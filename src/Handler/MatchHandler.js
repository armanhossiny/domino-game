const Conductor = require("../Commands/Conductor");
const Config = require("../Config");
const MatchManager = require("../Base/Manager/MatchManager");
const GameManager = require("../Base/Manager/GameManager");
const PlayerHandler = require("./PlayerHandler");
const JoinMatchCommand = require("../Commands/JoinMatchCommand");
const LeaveMatchCommand = require("../Commands/LeaveMatchCommand");
const Network = require("../Network");
const Strings = require("../Strings");
const DeclineInviteMatchCommand = require("../Commands/DeclineInviteMatchCommand");
const InviteToMatchCommand = require("../Commands/InviteToMatchCommand");
const InviteRematchCommand = require("../Commands/InviteRematchCommand");
const GameHandler = require("./GameHandler");
const { PlayerManager, TableManager, RoomManager } = require("../Base/Manager");
const { logger, guid, generateToken } = require("../Utils");
const Core = require("../Core");
const { joinMatchParse, getUserProfileParse } = require("../Services");
const { ValidationError } = require("../Utils/CustomError");
const { InitGameCommand } = require("../Commands");
const RoomHandler = require("./RoomHandler");
const {
  GameType,
  PlayerCount,
  ConnectionType,
  GameMode
} = require("../Consts");
const JoinMatchTempCommand = require("../Commands/JoinMatchTempCommand");
const MatchModel = require("../Models/MatchModel");

const MATCH_EXPIRED_TIME = 120;
const MAX_WAIT_TIME_FOR_SEGMENTATION = 60;
let onMatchStartCallback = null;
let onJoinsCallback = null;
let onLeaveCallback = null;

function t(label) {
  const start = Date.now();
  return () => logger.info(`JoinTest:${label}`, Date.now() - start, "ms");
}

// ✅ توابع کمکی

const isRealPlayer = (p) =>
  p !== null &&
  typeof p === "object" &&
  typeof p.playerId !== "undefined" &&
  p.playerId !== null;

async function joinMatch(payload) {
  const {
    roomId: roomIdTemp,
    clubId,
    player,
    order,
    friendly,
    gameType = new GameType(),
    tournamentKey,
    gameTableInfo,
    query
  } = payload;

  const key = payload?.key || payload?.table?.key;
  const { playerId } = player.extraData;
  const {
    matchId: lastMatchId,
    key: lastKey,
    query: lastQuery
  } = player.extraData;

  if (!playerId) {
    throw new ValidationError("PLAYER_ID_IS_REQUIRED");
  }

  // ساخت gameType
  const { maxPlayer, modeGame } = gameTableInfo;
  gameType.gameMode = GameMode[modeGame];
  gameType.playerCount =
    maxPlayer === 4 ? PlayerCount.FourPlayers : PlayerCount.TwoPlayers;
  gameType.connectionType = ConnectionType.Online;

  // خروج از match قبلی
  if (lastMatchId && query && lastQuery !== query) {
    await leaveMatch(lastMatchId, lastKey, player);
    logger.debug(`player.query:${lastQuery} | payload.query:${query}`);
  }

  const status = PlayerHandler.statusType.JOIN_MATCH;

  // ✅ Promise.all + fallback
  const [earlyInMatch, matchesRaw] = await Promise.all([
    MatchManager.getInMatch(playerId),
    MatchManager.getMatch(`${key}${query}`)
  ]);

  let matches = matchesRaw || [];

  // خروج از match قبلی
  if (earlyInMatch && earlyInMatch.query === query) {
    await leaveMatchHandler(earlyInMatch);
    await MatchManager.delInMatch(playerId);
  }

  // پیدا کردن match
  let match = matches.find(
    (m) =>
      query &&
      m.query === query &&
      (getFirstEmptyPlace(m) !== -1 || isExistingInMatch(m, playerId))
  );

  // جستجوی پیشرفته
  if (!match) {
    const playerSegment = getPlayerSegment(player);
    const now = Date.now();
    const isTableSegmentationEnabled = false;

    let bestMatch = null;
    let bestCreatedAt = -Infinity;

    for (const _match of matches) {
      const timeDiff = (now - _match.createdAt) / 1000;

      if (!_match.createdAt || timeDiff > MATCH_EXPIRED_TIME) {
        _match.needToRemove = true;
        continue;
      }

      if (getFirstEmptyPlace(_match) < 0) {
        continue;
      }

      const isWaitingTooLong = timeDiff > MAX_WAIT_TIME_FOR_SEGMENTATION;
      const sameQuery = _match.query === query;

      if (query && !sameQuery && !isWaitingTooLong) {
        continue;
      }

      if (
        isTableSegmentationEnabled &&
        _match.segment !== playerSegment &&
        !isWaitingTooLong
      ) {
        continue;
      }

      if (_match.createdAt > bestCreatedAt) {
        bestCreatedAt = _match.createdAt;
        bestMatch = _match;
      }
    }

    match = bestMatch;
    matches = matches.filter((m) => !m.needToRemove);
  }

  // roomId و join
  const roomId = match?.roomId || roomIdTemp || guid();
  await RoomHandler.joinRoom(roomId, playerId, player);

  // ساخت match جدید
  let creator = false;
  if (!match) {
    match = createNewMatch(maxPlayer);
    Object.assign(match, {
      roomId,
      clubId,
      messageIndex: -1,
      query,
      key,
      friendly: friendly || false,
      gameType: gameType || new GameType(),
      segment: getPlayerSegment(player),
      isOpen: !query
    });
    matches.push(match);
    creator = true;
  }

  // به‌روزرسانی player
  player.extraData = {
    ...(player.extraData || {}),
    query,
    status,
    key,
    roomId,
    matchId: match.matchId || ""
  };
  player.profile = {
    ...(player.profile || {}),
    ...(payload?.profile || {})
  };

  await PlayerHandler.update(playerId, player);

  // اضافه/به‌روزرسانی در match
  const existingIndex = match.presences.findIndex(
    (el) => isRealPlayer(el) && el.playerId === playerId
  );

  // data برای addToMatch
  const data = {
    playerId,
    index: order,
    order,
    query,
    friendly: friendly || false,
    tournamentKey: tournamentKey || "",
    gameType,
    player
  };

  if (existingIndex === -1) {
    if (!order) {
      payload.order = getFirstEmptyPlace(match);
    }
    addToMatch(match, data, true, creator, order);
  } else {
    match.presences[existingIndex].join = true;
  }

  // ✅ بارگذاری موازی + Map برای O(n)
  const playerIds = match.presences
    .slice(0, match.maxPlayer)
    .filter(isRealPlayer)
    .map((p) => p.playerId);

  const playerDataList = await Promise.all(
    playerIds.map((id) => PlayerHandler.get(id))
  );

  const playerDataMap = new Map(
    playerDataList.filter(Boolean).map((d) => [d.playerId, d])
  );

  for (const p of match.presences) {
    if (!isRealPlayer(p)) {
      continue;
    }
    const playerData = playerDataMap.get(p.playerId);
    if (!playerData) {
      continue;
    }

    Object.assign(p, {
      profile: { ...playerData.profile, isVip: playerData.isVip },
      connection: playerData.connection
    });
  }

  // ارسال پیام به club
  if (clubId) {
    const clubRoom = await RoomHandler.getRoom(clubId, playerId);
    match.messageIndex = await RoomHandler.sendMessage({
      playerId,
      roomId: clubId,
      room: clubRoom,
      player,
      type: 2,
      message: JSON.stringify({
        query,
        key,
        gameMode: GameMode[gameType.gameMode]
      })
    });
  }

  // ✅ onJoin قبل از ذخیره‌سازی نهایی
  await onJoin(match, data);

  player.extraData.matchId = match.matchId;
  await PlayerManager.set(playerId, player);
  await MatchManager.addInMatch(playerId, {
    matchId: match.matchId,
    key,
    playerId
  });

  // ✅ if/else به جای return وسط تابع
  if (isMatchStared(match)) {
    matches = matches.filter((m) => m.matchId !== match.matchId);

    await Core.pushMessageToQueue({
      method: "create_match_system",
      payload: { matchId: match.matchId, key, match }
    });
  }
  await MatchManager.addInAllMatches(`${key}${query}`, matches);

  return match; // ✅ همیشه return
}

async function acceptJoinMatch(payload) {
  const { inviterPlayerId, isPlayerExistInMatch, playerId, order } = payload;

  // const playerClient = players?.[playerId];
  // if (!playerClient) {
  //   throw new ValidationError("PLAYER_NOT_FOUND_IN_PAYLOAD");
  // }

  const enrichedPayload = { ...payload, order };

  if (!isPlayerExistInMatch) {
    const match = await joinMatch(enrichedPayload);

    if (!match?.presences) {
      logger.error("joinMatch returned invalid match");
      return;
    }

    const isExistInviterPlayer = isExistingInMatch(match, inviterPlayerId);
    // true یا false ✅

    if (!isExistInviterPlayer) {
      payload.order = getFirstEmptyPlace(match);
      await reInvitePlayerToMatch(payload);
    }
  }
}

async function inviteRematch(payload) {
  const { players, isPlayerExistInMatch, playerId } = payload;

  const playerClient = players?.[playerId];
  if (!playerClient) {
    throw new ValidationError("PLAYER_NOT_FOUND_IN_PAYLOAD");
  }

  const enrichedPayload = { ...payload, order: playerClient.order };

  if (!isPlayerExistInMatch) {
    const match = await joinMatch(enrichedPayload);

    if (!match?.presences) {
      logger.error("joinMatch returned invalid match");
      return;
    }

    // ✅ شمارش دقیق بازیکنان واقعی ("" و null و undefined را نادیده می‌گیرد)
    const presencesCount = match.presences.filter((p) =>
      isRealPlayer(p)
    ).length;

    if (presencesCount !== 1) {
      return;
    }
  }

  await invitePlayersToMatch(
    players,
    enrichedPayload,
    new InviteRematchCommand()
  );
}

/**
 * check if player not in game and can join to match
 *
 * @param {string} playerState
 * @returns
 */
function canPlayerJoinToMatchWithState(playerState) {
  return (
    playerState === "" ||
    playerState === PlayerHandler.statusType.IN_END_GAME ||
    playerState === PlayerHandler.statusType.LEAVE_GAME ||
    playerState === PlayerHandler.statusType.WAIT_TO_JOIN_GAME ||
    playerState === PlayerHandler.statusType.JOIN_MATCH ||
    playerState === PlayerHandler.statusType.ONLINE
  );
}

/**
 * send invite request to player is
 *
 * @param players
 * @param payload
 * @param JoinMatchCommand
 */
async function invitePlayersToMatch(players, payload, JoinMatchCommand) {
  const { playerId } = payload;
  payload.order = 0;
  let index = 0;
  for (const [invitePlayerId, playerData] of Object.entries(players)) {
    payload.order = playerData.order ? playerData.order : index;
    // check if invited player equal to playerId
    if (invitePlayerId === playerId) {
      continue;
    }

    // if invited player is online
    const player = await PlayerHandler.get(playerId);
    const playerToInvite = await PlayerHandler.get(invitePlayerId);
    if (!playerToInvite) {
      await Network.SendByPlayerId(playerId, {
        method: Strings.MT_PLAYER_IS_NOT_ONLINE,
        payload: { playerId: invitePlayerId }
      });
      continue;
    }

    // if invited player can play
    if (
      !canPlayerJoinToMatchWithState(playerToInvite.status) &&
      player.extraData.gameId !== playerToInvite.extraData.gameId
    ) {
      await Network.SendByPlayerId(playerId, {
        method: Strings.MT_DECLINE_JOIN_MATCH,
        payload: { playerId: invitePlayerId, player: player.profile }
      });
      continue;
    }

    // join player to match
    payload.invitePlayerId = invitePlayerId;
    await Conductor.run(JoinMatchCommand, payload);
    index++;
  }
}

async function invitePlayerToMatch(forPlayerId, payload, JoinMatchCommand) {
  const { playerId } = payload;

  // check if invited player equal to playerId
  if (forPlayerId === playerId) {
    return;
  }

  // if invited player is online
  const playerToInvite = await PlayerHandler.get(forPlayerId);
  if (playerToInvite === undefined) {
    await Network.SendByPlayerId(playerId, {
      method: Strings.MT_PLAYER_IS_NOT_ONLINE,
      payload: { playerId: forPlayerId, player: playerToInvite }
    });
    return;
  }

  // if invited player can play
  if (!canPlayerJoinToMatchWithState(playerToInvite.status)) {
    await Network.SendByPlayerId(playerId, {
      method: Strings.MT_DECLINE_JOIN_MATCH,
      payload: { playerId: forPlayerId, player: playerToInvite.profile }
    });
    return;
  }

  // join player to match
  payload.invitePlayerId = forPlayerId;
  await Conductor.run(JoinMatchCommand, payload);
}

async function inviteFriendsToMatch(payload) {
  const { playerId, query, players, key } = payload;

  const matches = await MatchManager.getMatch(`${key}${query}`);
  const match = matches.find((m) => m.query === query);
  if (match) {
    const thisPlayer = match.presences.find((element) =>
      element && element.playerId === playerId ? element : undefined
    );
    if (!thisPlayer.creator) {
      await joinMatch(payload);
    }
  } else {
    await invitePlayersToMatch(players, payload, new InviteToMatchCommand());
  }
}

async function inviteFriendToMatch(_payload) {
  logger.debug(`inviteFriendToMatch :  ${JSON.stringify(_payload)}`);
  const { playerId, query, forPlayerId, key, player } = _payload;
  let { order } = _payload;

  const forPlayer = await PlayerManager.get(forPlayerId);
  if (!forPlayer) {
    await Network.SendByPlayerId(playerId, {
      method: Strings.MT_PLAYER_IS_NOT_ONLINE,
      payload: { playerId: forPlayerId }
    });
    return;
  }

  const matches = await MatchManager.getMatch(`${key}${query}`);
  const match = matches.find((m) => m.query === query); //for invite friends

  if (!match) {
    return;
  }

  if (match && !order) {
    order = getFirstEmptyPlace(match);
  }

  const data = {
    playerId: forPlayerId,
    index: order,
    order,
    query,
    tournamentKey: "",
    player
  };
  addToMatch(match, data, false, false);
  await MatchManager.addInAllMatches(`${key}${query}`, matches);
  logger.debug("****INVITE****");
  const payload = { ..._payload, order };

  await onJoinMatchTemp(match, data, _payload);

  await invitePlayerToMatch(forPlayerId, payload, new InviteToMatchCommand());
}

async function inviteToMatch(_payload) {
  const { playerId, invitePlayerId } = _payload;

  const playerToInvite = await PlayerHandler.get(invitePlayerId);

  if (!playerToInvite) {
    await Network.SendByPlayerId(playerId, {
      method: Strings.MT_PLAYER_IS_NOT_ONLINE,
      payload: { playerId: invitePlayerId }
    });

    return;
  }

  if (playerToInvite.status === PlayerHandler.statusType.IN_GAME) {
    await Network.SendByPlayerId(playerId, {
      method: Strings.MT_PLAYER_IS_IN_OTHER_GAME,
      payload: { playerId: invitePlayerId }
    });

    return;
  }

  const query = _payload.query;
  const key = _payload.table.key;

  const matches = await MatchManager.getMatch(`${key}${query}`);
  const match = matches.find((m) => m.query === query);
  if (match) {
    if (!_payload.order) {
      _payload.order = getFirstEmptyPlace(match);
    }
  }
  await Conductor.run(new InviteToMatchCommand(), _payload);
}

/**
 * get max player of table
 * @param {string} key
 * @returns
 */
async function getTableMaxPlayer(key) {
  const gameTableInfo = await TableManager.getGameTableInfo(key);
  if (gameTableInfo) {
    return gameTableInfo.maxPlayer;
  }
}

async function reInvitePlayerToMatch(payload) {
  const { playerId, inviterPlayerId, key, query, order = -1, player } = payload;

  const maxPlayer = await getTableMaxPlayer(key);

  const matches = await MatchManager.getMatch(`${key}${query}`);
  const match = matches.find((m) => m.query === query);
  if (maxPlayer === 2 && match) {
    const _payload = {
      playerId,
      table: { key: key },
      query,
      profile: player["profile"] || {},
      order,
      forPlayerId: inviterPlayerId
    };

    await invitePlayerToMatch(
      inviterPlayerId,
      _payload,
      new InviteToMatchCommand()
    );
  }
}

async function declineJoinMatch(payload) {
  const { key, playerId, query } = payload;

  const matches = await MatchManager.getMatch(`${key}${payload.query}`);
  const match = matches.find((m) => m.query === query);
  if (match) {
    await Conductor.run(new DeclineInviteMatchCommand(match), payload);
    await leaveMatchHandler({
      playerId,
      matchId: match.matchId,
      query,
      key
    });
  }
}

async function removePlayerInMatch(payload) {
  const { key, playerId, query } = payload;

  const matches = await MatchManager.getMatch(`${key}${payload.query}`);
  const match = matches.find((m) => m.query === query);
  if (match) {
    //await Conductor.run(new DeclineInviteMatchCommand(match), payload);
    await leaveMatchHandler({
      playerId,
      matchId: match.matchId,
      query,
      key
    });
  }
}

async function deleteFromMatch(payload) {
  const { key, playerId, query } = payload;

  const matches = await MatchManager.getMatch(`${key}${payload.query}`);
  const match = matches.find((m) => m.query === query);
  if (match) {
    await Conductor.run(new DeclineInviteMatchCommand(match), payload);
    await leaveMatchHandler({
      playerId,
      matchId: match.matchId,
      query: query,
      key
    });
  }
}

async function leaveMatchHandler(payload) {
  const { playerId, matchId, key } = payload;

  const player = await PlayerHandler.get(playerId);
  if (player) {
    const { roomId } = player.extraData;
    if (roomId) {
      RoomHandler.removeOnlinePlayersRoom(roomId, playerId).then();
    }

    if (matchId) {
      await leaveMatch(matchId, key, {
        extraData: {
          playerId,
          query: player?.extraData?.query || "",
          key: player?.extraData?.key || ""
        }
      });
    }

    Object.assign(player.extraData, {
      status: PlayerHandler.statusType.ONLINE,
      query: "",
      key: "",
      matchId: "",
      roomId: ""
    });

    PlayerHandler.update(playerId, player).then();
  }
}

async function onJoinMatch(match, data) {
  await Conductor.run(new JoinMatchCommand(match), data);
}

async function onJoinMatchTemp(match, data, payload) {
  try {
    for (let index = 0; index < match.maxPlayer; index++) {
      const player = match.presences[index];
      if (player) {
        const playerData = await PlayerHandler.get(player.playerId);
        if (playerData) {
          Object.assign(player, {
            profile: { ...playerData.profile, isVip: playerData["isVip"] },
            connection: playerData["connection"]
          });
        }
      }
    }

    await Conductor.run(new JoinMatchTempCommand(match), data);
  } catch (e) {
    logger.error(e);
    logger.info(`match:${JSON.stringify(match)}`);
    logger.info(`query: ${data.query}`);
    logger.info(`payload:${JSON.stringify(payload)}`);
  }
}

async function onLeaveMatch(match, data) {
  const { playerId } = data;
  const exists = match.presences.find((m) =>
    m ? m.playerId === playerId : false
  );
  if (!exists) {
    await Network.SendByPlayerId(playerId, {
      method: Strings.MT_LEAVE_MATCH,
      payload: {
        matchId: match.matchId,
        maxPlayer: match.maxPlayer,
        orders: [],
        players: {},
        playerLeaved: {
          playerId: playerId,
          order: data.order
        }
      }
    });
    return;
  }
  for (let index = 0; index < match.maxPlayer; index++) {
    const player = match.presences[index];
    if (player) {
      const playerData = await PlayerHandler.get(player.playerId);
      if (playerData) {
        Object.assign(player, {
          profile: { ...playerData.profile, isVip: playerData["isVip"] },
          connection: playerData["connection"]
        });
      }
    }
  }

  await Conductor.run(new LeaveMatchCommand(match), data);
}

async function onMatchStart(match, gameTableInfo) {
  try {
    const { maxPlayer, coin_entry, key } = gameTableInfo;
    const game = await GameHandler.setupGame(match, gameTableInfo);

    game.table = gameTableInfo;

    const users = await getGamePlayerIds(game);

    // pay game coins

    const dataToSend = {
      users,
      coin_entry,
      tableKey: key,
      friendly: game.friendly,
      tournament: game.tournament,
      gameId: game.gameId,
      admissionId: match.matchId
    };

    const result = await joinMatchParse(dataToSend);
    if (result?.success !== true || typeof result.objectId !== "string" || !result.objectId) {
      // Reject the entire admission, including malformed/empty Parse responses.
      for (const playerId of users) {
        try {
          await leaveMatchHandler({
            playerId,
            matchId: match.matchId,
            query: match.query,
            key
          });
        } catch (error) {
          logger.error("JOIN_MATCH_CLEANUP_FAILED", { playerId, message: error.message });
        }
      }

      throw new ValidationError("JOIN_MATCH_PARSE");
    }
    game.objectId = result.objectId;

    const { gameId, objectId, friendly, tournament } = game;

    // await payGameEntryFee(game, coin_entry, key);

    await GameManager.add(gameId, game);

    await Conductor.run(new InitGameCommand(match), {
      gameId,
      objectId,
      maxPlayer,
      friendly,
      tournament
    });

    await GameManager.set("GameHandler-createNewGame", gameId, game);
  } catch (error) {
    logger.error(error);
  }
}

async function isAllPlayerExist(match) {
  for (let i = 0; i < match.presences.length; i++) {
    const presence = match.presences[i];
    const player = await PlayerHandler.get(presence.playerId);
    if (!player) {
      removePlayerFromMatch(i, match);
      await leaveMatch(match.matchId, match.key, {
        extraData: {
          playerId: presence.playerId,
          query: "",
          key: ""
        }
      });
      throw new ValidationError("MATCH_PLAYER_NOT_EXIST");
    }
  }
}

async function getGamePlayerIds(game) {
  const playerIds = [];

  for (const key in game.players) {
    const playerId = game.players[key].playerId;
    game.state.autoCount[playerId] = 0;
    const player = await PlayerHandler.get(playerId);
    if (player) {
      playerIds.push(player.playerId);
    }
  }

  return playerIds;
}

function removePlayerFromMatch(index, match) {
  match.presences[index] = null;
}

async function playerHaveActiveGame(playerId) {
  const lastGame = await PlayerManager.getLastPlayerGame(playerId);
  if (lastGame) {
    const isPlayerInGame =
      (!lastGame.state?.isEnded &&
        lastGame.players[playerId] &&
        !lastGame.players[playerId].isLeave) ||
      false;
    // if game exist and is live rejoin to game
    if (isPlayerInGame) {
      return true;
    }
  }
  return false;
}

async function completeMatch(payload) {
  const { match, key } = payload;

  if (!match) {
    logger.warn("match deleted error...........................");
    return;
  }
  const gameTableInfo = await TableManager.getGameTableInfo(key);

  let allPlayersOk = true;

  for (const player of match.presences) {
    if (!player) {
      allPlayersOk &= false;
      logger.warn("on complete error one player undefined or leave!");

      break;
    }

    const playerRedis = await PlayerHandler.get(player.playerId);

    if (!playerRedis) {
      allPlayersOk &= false;
      logger.warn("on complete error one player undefined in redis!");
      break;
    }

    const isEnoughEntryFeePlayer = await enoughEntryFeePlayer(
      player.playerId,
      gameTableInfo
    );

    const haveActiveGame = await playerHaveActiveGame(player.playerId);

    allPlayersOk &= isEnoughEntryFeePlayer && !haveActiveGame;

    if (haveActiveGame) {
      allPlayersOk &= false;
      logger.warn("player have game!");
      break;
    }

    if (!isEnoughEntryFeePlayer) {
      allPlayersOk &= false;
      logger.warn("player not enoughEntryFee!");

      break;
    }
  }

  if (!allPlayersOk) {
    let order = 0;
    for (const player of match.presences) {
      if (player) {
        const playerId = player.playerId;

        await onLeave(match, { playerId, order });
      }
      order++;
    }
    return;
  }
  onMatchStart(match, gameTableInfo).then();
}

function getPlayerSegment(player) {
  const { level } = player.profile;
  if (level < 5) {
    return "Beginner";
  } else if (level < 10) {
    return "Intermediate";
  } else if (level < 20) {
    return "Advanced";
  } else {
    return "Expert";
  }
}

function createNewMatch(maxPlayer) {
  return new MatchModel({ maxPlayer });
}

async function enoughEntryFeePlayer(playerId, gameTableInfo) {
  const playerProfile = await getUserProfileParse(playerId);
  if (playerProfile.coins < gameTableInfo.coin_entry) {
    logger.warn(
      `playerProfile.coins < gameTableInfo.coin_entry  : ${playerId} - ${playerProfile.coins} < ${gameTableInfo.coin_entry}`
    );
    logger.debug("start atMatch:coins < coin_entry");
    await Network.SendByPlayerId(playerId, {
      method: Strings.MT_NOT_ENOUGH_COIN,
      payload: { message: Strings.S_NOT_ENOUGH_COIN }
    });
    return false;
  }
  return true;
}

//TODO plz send valid query include key table if not have key not valid result
async function leaveMatch(matchId, key, player) {
  const { playerId } = player.extraData;
  let matches = await MatchManager.getInAllMatches(
    `${key}${player?.extraData?.query || ""}`
  );
  const match = matches.find((m) => m.matchId === matchId);

  if (!match) {
    return false;
  }

  const index = match.presences.findIndex((element) =>
    element ? element.playerId === playerId : false
  );

  await MatchManager.delInMatch(playerId);

  if (index !== -1) {
    await checkAndSetAdmin(match, match.presences[index]);
    const order = match.presences[index].order;

    RoomManager.leavePlayer(playerId, match.roomId).then();

    await onLeave(match, { playerId, order });
    match.presences[index] = null;
  }
  let countEmpty = 0;
  match.presences.forEach((player) => {
    if (!player) {
      countEmpty++;
    }
  });
  if (countEmpty === match.presences.length) {
    matches = matches.filter((m) => m.matchId !== match.matchId);
  }
  await MatchManager.addInAllMatches(
    `${key}${player?.extraData?.query || ""}`,
    matches
  );

  const extraData = {
    query: "",
    status: "",
    key: "",
    roomId: "",
    matchId: ""
  };

  await PlayerHandler.updateExtraData(playerId, extraData);
  return match;
}

async function checkAndSetAdmin(match, leavePresence) {
  const index = leavePresence.index;
  if (leavePresence.join && leavePresence.creator) {
    if (match.maxPlayer === 4) {
      if (index === 0 && match.presences[2] && match.presences[2].join) {
        match.presences[2].creator = true;
      } else if (index === 1 && match.presences[3] && match.presences[3].join) {
        match.presences[3].creator = true;
      } else if (index === 2 && match.presences[0] && match.presences[0].join) {
        match.presences[0].creator = true;
      } else if (index === 3 && match.presences[1] && match.presences[1].join) {
        match.presences[1].creator = true;
      } else {
        match.presences.forEach((player) => {
          if (player && player.index !== index && player.join) {
            player.creator = true;
          }
        });
      }
    }
  }
}

function addToMatch(match, data, join, creator, order) {
  if (!match) {
    return false;
  }

  let index =
    order && order > -1 && order < 4 ? order : getFirstEmptyPlace(match);
  if (data.index) {
    if (data.index > -1 && order < 4) {
      index = data.index;
    }
  }

  if (index > -1 && order < 4) {
    Object.assign(data, { order: index, index: index });
    match.presences[index] = {
      playerId: data.playerId,
      // profile: data.profile,
      index: index,
      order: data.order,
      tournamentKey: data.tournamentKey,
      join,
      creator
    };
    return true;
  }

  return false;
}

function isMatchStared(match) {
  const matchPresencesCount = match.presences.filter((x) => x !== null).length;
  return match.maxPlayer === matchPresencesCount;
}

function getFirstEmptyPlace(match) {
  return match.presences.indexOf(null);
}

function isExistingInMatch(match, playerId) {
  return match.presences.find(
    (element) => isRealPlayer(element) && element.playerId === playerId
  );
}

async function onJoin(match, data) {
  if (onJoinsCallback) {
    await onJoinsCallback(match, data);
  }
}

async function onLeave(match, data) {
  if (onLeaveCallback) {
    await onLeaveCallback(match, data);
  }
}

function setOnJoin(callback) {
  onJoinsCallback = callback;
}

function setOnLeave(callback) {
  onLeaveCallback = callback;
}

function setOnMatchStart(callback) {
  onMatchStartCallback = callback;
}

module.exports = {
  joinMatch,
  acceptJoinMatch,
  inviteRematch,
  inviteFriendsToMatch,
  inviteFriendToMatch,
  invitePlayerToMatch,
  inviteToMatch,
  reInvitePlayerToMatch,
  declineJoinMatch,
  deleteFromMatch,
  leaveMatchHandler,
  onJoinMatch,
  onLeaveMatch,
  onMatchStart,
  removePlayerInMatch,
  leaveMatch,
  setOnJoin,
  setOnLeave,
  playerHaveActiveGame,
  completeMatch,
  setOnMatchStart
};
