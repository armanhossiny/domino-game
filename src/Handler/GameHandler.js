const GameManager = require("../Base/Manager/GameManager");
const PlayerManager = require("../Base/Manager/PlayerManager");
const Utils = require("../Utils");
const { DominoAppConfigs } = require("../Consts");
const { GameServerModel, PlayerClientModel } = require("../Models");
const PlayerHandler = require("./PlayerHandler");
const { Conductor, EndGameCommand } = require("../Commands");
const MoveCommand = require("../Commands/MoveCommand");
const JoinGameCommand = require("../Commands/JoinGameCommand");
const LeaveGameCommand = require("../Commands/LeaveGameCommand");
const PickFromBankCommand = require("../Commands/PickFromBankCommand");
const TurnPassCommand = require("../Commands/TurnPassCommand");
const ChangeTurnCommand = require("../Commands/ChangeTurnCommand");
const Strings = require("../Strings");
const ReJoinGameCommand = require("../Commands/ReJoinGameCommand");
const Network = require("../Network");
const OnlineStateCommand = require("../Commands/OnlineStateCommand");
const OfflinePlayerCommand = require("../Commands/OfflinePlayerCommand");
const EndSetCommand = require("../Commands/EndSetCommand");
const ruleFactory = require("../Rules");
const Core = require("../Core");
const { ValidationError } = require("../Utils/CustomError");

const { initGrouping } = require("../Commands/CommandsFunctions");

const {
  sendEndGameParse,
  getMatchParse,
  getUserProfileParse
} = require("../Services");

const HideBankCommand = require("../Commands/HideBankCommand");
const { TableManager } = require("../Base/Manager");
const SyncGameCommand = require("../Commands/SyncGameCommand");
const RoomHandler = require("./RoomHandler");
const OnlinePlayerCommand = require("../Commands/OnlinePlayerCommand");
const logger = require("../Utils/logger");
const ActivePlayerCommand = require("../Commands/ActivePlayerCommand");

async function syncGame(payload) {
  await Conductor.run(new SyncGameCommand(), payload);
}

async function joinGame(payload) {
  const { gameId, game, player } = payload;
  if (game.state.isEnded) {
    await Conductor.run(
      new EndGameCommand(),
      { gameId, playerId: player.playerId },
      game
    );

    return;
  }
  await payCoinToJoinGame(game, player);

  await Conductor.run(new JoinGameCommand(), payload);

  await GameManager.set("GameHandler-joinGame", gameId, game);
}

/**
 * get game id and check that if game exist now return player to game
 * @param player
 * @param game
 */
async function rejoinPlayerToExistGame(player, game) {
  const { playerId } = player.extraData;
  const { gameId, roomId } = game;

  //TODO if game id removed from redis ,client join to game but not played
  await GameManager.addId(gameId);
  //await onlinePlayer({ playerId, gameId });

  Object.assign(player.extraData, {
    gameId: game.gameId,
    roomId: game.roomId,
    status: PlayerHandler.statusType.IN_GAME,
    query: "",
    matchId: "",
    key: game.table.key
  });
  await RoomHandler.joinRoom(roomId, playerId, player);
  await PlayerManager.update(playerId, player, "rejoinPlayerToExistGame");

  game.players[playerId].isJoin = true;
  game.players[playerId].status = PlayerHandler.statusType.IN_GAME;

  const newGameSate = await Conductor.run(
    new ReJoinGameCommand(),
    { gameId, playerId, player },
    game
  );
  await GameManager.set("GameHandler-rejoinGame", gameId, newGameSate);
}

/**
 * if game early is in init state and game object in redis is deleted
 * game ended with equal state and show player end game
 */
async function changeGameStateToEqual(matchId, theGame) {
  //set game as equal
  const equalGameData = {
    matchId,
    winners: [],
    losers: [],
    data: "rejoin-equal",
    tournament: theGame.tournament || []
  };

  await sendEndGameParse(equalGameData);
}

/**
 * navigate user to end game and loser state at rejoin
 */
async function showEndgameSateRejoin(playerId, theGame) {
  const gameTableInfo = await TableManager.getGameTableInfo(theGame.tableKey);

  const gameData = {
    gameInfo: {
      ...theGame
    },
    order: theGame.players,
    table: gameTableInfo,
    players: {},
    gameId: theGame.gameId
  };

  gameData.players = await getListOfPlayerProfilesAsObject(theGame.players);

  await Network.SendByPlayerId(playerId, {
    method: Strings.MT_REJOIN_ERROR,
    payload: gameData
  });
}

async function getListOfPlayerProfilesAsObject(players) {
  const profiles = {};
  for (const player of players) {
    const profile = await getUserProfileParse(player);
    if (profile) {
      profiles[player] = profile;
    }
  }
  return profiles;
}

async function reJoinGame(payload) {
  const { playerId, player, game } = payload;
  let { gameId } = payload;
  const { objectId: matchObjectId } = payload;

  const originGameId = gameId;

  const lastGame = await PlayerManager.getLastPlayerGame(playerId);
  if (lastGame && lastGame.gameId !== gameId) {
    gameId = lastGame.gameId;
  }

  if (!game || !game.players[playerId] || game.players[playerId].isLeave) {
    logger.warn({
      event: "game_rejoin_rejected",
      reasonCode: !game ? "GAME_NOT_FOUND" : !game.players[playerId] ? "PLAYER_NOT_IN_GAME" : "PLAYER_ALREADY_LEFT",
      gameId, originGameId, lastGameId: lastGame?.gameId || null,
      playerId, rid: payload.rid || null
    });
    Network.SendByPlayerId(playerId, {
      method: Strings.MT_GAME_NOT_VALID,
      payload: { gameId, message: Strings.S_GAME_NOT_VALID }
    });
    return;
  }

  if (game.state.admissionPending && !await require("./AdmissionActivation")(game)) {
    await Network.SendByPlayerId(playerId, {
      method: Strings.MT_GAME_NOT_VALID,
      payload: { gameId, message: Strings.S_GAME_NOT_VALID, reason: "ADMISSION_REFUNDED" }
    });
    return;
  }
  const isPlayerInGame =
    (game &&
      !game.state.isEnded &&
      player &&
      game.players[playerId] &&
      !game.players[playerId].isLeave) ||
    false;
  // if game exist and is live rejoin to game
  if (isPlayerInGame) {
    await rejoinPlayerToExistGame(player, game);
    return;
  }

  if (!matchObjectId) {
    logger.debug(`S_GAME_NOT_VALID playerId:${playerId} !matchObjectId`);

    await Network.SendByPlayerId(playerId, {
      method: Strings.MT_GAME_NOT_VALID,
      payload: { gameId: gameId, message: Strings.S_GAME_NOT_VALID }
    });
    return;
  }

  const theGame = await getMatchParse(matchObjectId);
  if (!theGame) {
    logger.debug(`S_GAME_NOT_VALID playerId:${playerId} !theGame`);
    await Network.SendByPlayerId(playerId, {
      method: Strings.MT_GAME_NOT_VALID,
      payload: { gameId: gameId, message: Strings.S_GAME_NOT_VALID }
    });
    return;
  }

  theGame.gameId = gameId;
  if (theGame.status === "init") {
    await changeGameStateToEqual(matchObjectId, theGame);
  }

  await showEndgameSateRejoin(playerId, theGame);
}

async function leaveGame(payload) {
  const { playerId, game } = payload;
  const { gameId } = game;

  await offlinePlayer({ playerId, gameId });

  await PlayerManager.delLastGameIdPlayer(playerId);

  //await PlayerHandler.updateUserInParseServer(playerId, player);

  //await TableManager.leaveOfTable(game.table.key, playerId);

  await leavePlayerFromGame(playerId, game);

  const player = await PlayerHandler.get(playerId);
  if (player) {
    Object.assign(player.extraData, {
      matchId: "",
      gameId: "",
      roomId: "",
      query: "",
      status: PlayerHandler.statusType.IN_TABLE,
      key: ""
    });

    await PlayerManager.update(playerId, player, "leaveGame");
  }
  await GameManager.set("GameHandler-leaveGame", gameId, game);
}

async function offlinePlayer(payload) {
  logger.debug("offlinePlayer");
  const { playerId, gameId, player } = payload;

  if (!playerId) {
    return;
  }

  const game = await GameManager.get(gameId);

  if (!player) {
    return;
  }

  Object.assign(player.extraData, {
    status: PlayerHandler.statusType.OFFLINE
  });

  await PlayerHandler.update(playerId, player);

  if (game) {
    if (
      game.players[playerId] !== undefined &&
      game.players[playerId] !== null &&
      game.players[playerId] !== PlayerHandler.statusType.LEAVE_GAME
    ) {
      game.players[playerId].status = PlayerHandler.statusType.OFFLINE;
    }

    await GameManager.set("GameHandler-offlinePlayer", gameId, game);
    await Conductor.run(new OfflinePlayerCommand(), { gameId, playerId }, game);
  }
}

async function onlinePlayer(payload) {
  const { playerId, gameId } = payload;
  logger.debug("onlinePlayer");
  const player = await PlayerManager.get(playerId);
  const game = await GameManager.get(gameId);

  if (!game || !player) {
    return;
  }

  Object.assign(player.extraData, {
    status: PlayerHandler.statusType.IN_GAME
  });

  await PlayerHandler.update(playerId, player);

  if (
    game.players[playerId] !== undefined &&
    game.players[playerId] !== null &&
    game.players[playerId] !== PlayerHandler.statusType.LEAVE_GAME
  ) {
    game.players[playerId].status = PlayerHandler.statusType.IN_GAME;
  }

  await GameManager.set("GameHandler-offlinePlayer", gameId, game);
  await Conductor.run(new OnlinePlayerCommand(), { gameId, playerId }, game);
}

async function onChangTurn(payload) {
  const { playerId, gameId, game } = payload;

  await Conductor.run(
    new ChangeTurnCommand(),
    { playerId, fromClient: true },
    game
  );
  await GameManager.set("GameHandler-onChangeTurn", gameId, game);
}

async function onMove(payload) {
  const { gameId, playerId, domino, dir, fromClient, game } = payload;
  await Conductor.run(
    new MoveCommand(),
    { gameId, playerId, domino, dir, fromClient },
    game
  );
  await GameManager.set("GameHandler-onMove", gameId, game);
}

async function onPickUp(payload) {
  const { gameId, playerId, game, fromClient } = payload;

  if (game.canPlay(playerId) || game.bank.length < 1) {
    await Conductor.run(
      new HideBankCommand(),
      {
        gameId: gameId,
        playerId: playerId
      },
      game
    );
    return;
  }

  const domino = game.getDominoFromBank();
  const indexDomino = domino[2];

  await Conductor.run(
    new PickFromBankCommand(),
    {
      gameId,
      playerId,
      domino,
      indexDomino,
      fromClient
    },
    game
  );

  await GameManager.set("GameHandler-onPickup", gameId, game);
}

async function onTurnPass(payload) {
  const { gameId, playerId, game } = payload;

  if (game.bank.length > 0 || game.canPlay(playerId)) {
    // console.log("-------------------------------------------------------");
    // console.log("gameId: " + gameId + " PlayerId: " + playerId);
    // console.log("-------------------------------------------------------");
    throw new ValidationError("ERROR_IN_TURN_PASS");
  }

  await Conductor.run(
    new TurnPassCommand(),
    { gameId, playerId, fromClient: true },
    game
  );
  await GameManager.set("GameHandler-onTurnPass", gameId, game);
}

async function setupGame(match, gameTableInfo) {
  const game = await initNewGame(match, gameTableInfo);
  updateGameTournament(game);
  resetPlayerPayed(game);
  resetPlayerDelayTime(game);
  game.initPlayersHand();
  game.initStateOrders();
  game.initWhoStartTheGame();
  initGrouping(game);
  return game;
}

async function initNewGame(match, gameTableInfo) {
  const gameModel = new GameServerModel();

  // const keyTable = match.key;
  match.key = gameTableInfo.key;
  const tableInfo = gameTableInfo; //await TableManager.getGameTableInfo(keyTable);
  if (!tableInfo) {
    return;
  }

  gameModel.gameType = match.gameType;
  gameModel.gameType.playerCount = match.maxPlayer === 4 ? 2 : 1;

  if (gameModel.gameType.gameMode === 0) {
    if (tableInfo["modeGame"] === "Draw") {
      gameModel.gameType.gameMode = 1;
    } else if (tableInfo["modeGame"] === "AllFives") {
      gameModel.gameType.gameMode = 2;
    } else if (tableInfo["modeGame"] === "Block") {
      gameModel.gameType.gameMode = 3;
    }
  }

  const game = ruleFactory(gameModel);

  const players = await initGamePlayers(match);
  game.gameId = Utils.guid();
  game.players = players;

  for (const key in players) {
    const player = game.players[key];
    // Object.assign(game.delayTime,player.playerId=TURN_WAIT);
    // Object.assign(game.timer,player.playerId=PLAYER_MAX_TIMER);
    game.delayTime[player.playerId] = DominoAppConfigs.TURN_WAIT;
    game.timer[player.playerId] = tableInfo.maxTimer
      ? tableInfo.maxTimer
      : DominoAppConfigs.PLAYER_MAX_TIMER;
    player.delayTime = DominoAppConfigs.TURN_WAIT;
    player.timer = tableInfo.maxTimer
      ? tableInfo.maxTimer
      : DominoAppConfigs.PLAYER_MAX_TIMER;
    await PlayerManager.saveLastGameIdPlayer(player.playerId, game.gameId);
  }

  game.gameType = match.gameType;
  game.roomId = match.roomId;
  game.maxPlayer = match.maxPlayer;
  game.friendly = match.friendly;
  game.status = "init";
  game.maxTimer = tableInfo.maxTimer
    ? tableInfo.maxTimer
    : DominoAppConfigs.PLAYER_MAX_TIMER;

  game.state.waitingForRematchCounter =
    DominoAppConfigs.WAITING_FOR_REMATCH_COUNTER;
  game.wait = DominoAppConfigs.END_SET_WAIT;
  return game;
}

function resetPlayerDelayTime(game) {
  const { players, maxTimer } = game;
  // const tableInfo = await TableManager.getGameTableInfo(keyTable);
  // if (!tableInfo) {
  //   return;
  // }
  for (const key in players) {
    const player = game.players[key];
    game.delayTime[player.playerId] = DominoAppConfigs.TURN_WAIT;
    game.timer[player.playerId] = maxTimer
      ? maxTimer
      : DominoAppConfigs.PLAYER_MAX_TIMER;
    player.delayTime = DominoAppConfigs.TURN_WAIT;
    player.timer = maxTimer ? maxTimer : DominoAppConfigs.PLAYER_MAX_TIMER;
  }
}

function resetPlayerPayed(game) {
  const { players } = game;

  for (const key in players) {
    const player = game.players[key];
    game.payed[player.playerId] = false;
  }
}

async function initGamePlayers(match) {
  const { key } = match;
  const players = {};
  const tableInfo = await TableManager.getGameTableInfo(key);
  if (!tableInfo) {
    return;
  }
  for (const item of match.presences) {
    const playerData = await PlayerHandler.get(item.playerId);

    await PlayerHandler.updateStatus(
      item.playerId,
      PlayerHandler.statusType.WAIT_TO_JOIN_GAME
    );

    const player = new PlayerClientModel();
    player.tournamentKey = item.tournamentKey;
    player.playerId = playerData.playerId;
    player.status = playerData.extraData.status;
    player.profile = playerData.profile ? playerData.profile : {};
    player.delayTime = DominoAppConfigs.TURN_WAIT;
    player.timer = tableInfo.maxTimer
      ? tableInfo.maxTimer
      : DominoAppConfigs.PLAYER_MAX_TIMER;
    players[player.playerId] = player;
  }

  return players;
}

function updateGameTournament(game) {
  const tournament = [];
  const { players } = game;
  for (const key in players) {
    const player = players[key];
    const { tournamentKey, playerId } = player;
    if (tournamentKey) {
      tournament.push({ playerId, event: tournamentKey });
    }
  }

  game.tournament = tournament;
}

async function onOnlineState(payload) {
  await Conductor.run(new OnlineStateCommand(), payload);
}

///////////////////////////////////////////////

async function tick(payload) {
  const { gameId, MaxTick, game } = payload;
  if (game.state.admissionPending) {
    await require("./AdmissionActivation")(game);
    return;
  }

  if (game.state.settlementPending) {
    // Automatic replay is only safe with Parse's atomic settlement enabled.
    if (process.env.MATCH_ATOMIC_SETTLEMENT === "1" &&
        Date.now() >= (game.state.settlementRetryAt || 0)) {
      await Conductor.run(new EndGameCommand(), payload, game);
      await GameManager.set("Core-settlement-retry", gameId, game);
    }
    return;
  }

  if (game.state.isEnded) {
    await GameManager.del(game.gameId);
    return;
  }

  await handleNormalTurn(game, MaxTick);

  // Update game state
  await GameManager.set("Core-GameLoop", gameId, game);
}

async function playRandomTurnForLeavePlayer(game) {
  const { gameId } = game;
  const playerId = game.state.order;
  const domino = game.getRandomDominoFromHand(playerId);
  if (domino) {
    const dir = game.addToWhichHead(domino);
    const job = {
      method: "move_leave_player",
      payload: { gameId, playerId, domino, dir, fromClient: false }
    };
    await Core.pushMessageToQueue(job);
    return;
  }

  if (game.bank.length) {
    const job = {
      method: "pickup_leave_player",
      payload: { gameId, fromClient: false }
    };
    await Core.pushMessageToQueue(job);
    return;
  }

  const job = {
    method: "turnPass_leave_player",
    payload: { gameId, playerId, fromClient: false }
  };
  await Core.pushMessageToQueue(job);
}

async function handleNormalTurn(game, MaxTick) {
  const { gameId } = game;
  const playerId = game.state.order;

  if (game.wait >= 0) {
    game.wait -= MaxTick;
    return;
  }

  const delayTimePlayer = game.delayTime[playerId];
  const maxTimePlayer = game.timer[playerId];
  const playerInGame = game.players[playerId];

  if (playerInGame.isLeave) {
    await playRandomTurnForLeavePlayer(game);
    return;
  }

  if (delayTimePlayer >= MaxTick) {
    game.delayTime[playerId] -= MaxTick;
    game.players[playerId].delayTime -= MaxTick;
    return;
  }

  if (maxTimePlayer > 0) {
    const consumed = Math.min(MaxTick, maxTimePlayer);
    game.timer[playerId] -= consumed;
    game.players[playerId].timer -= consumed;

    if (game.timer[playerId] > 0) {
      Conductor.run(new ActivePlayerCommand(), { gameId, playerId }, game);
      return;
    }
  }

  if (game.timer[playerId] <= 0) {
    const payload = {
      game,
      playerId
    };
    await leaveGame(payload);

    logger.warn({
      event: "game_exit",
      reasonCode: "TURN_TIMER_EXPIRED",
      gameId,
      playerId,
      timer: game.timer[playerId],
      isLeave: playerInGame.isLeave
    });
  }
}

async function pickUpBankTurn(payload) {
  const { game } = payload;
  const { gameId } = game;

  game.cycle = 0;
  const listDomino = game.getListDominoFromBank();

  for (const domino of listDomino) {
    await Conductor.run(
      new PickFromBankCommand(),
      {
        gameId,
        playerId: game.state.order,
        domino,
        indexDomino: domino[2],
        fromClient: false
      },
      game
    );
  }
}

async function handleEndGame(game) {
  if (!game.state.isEnded && game.state.waitingForRematchCounter > 0) {
    game.state.waitingForRematchCounter--;
  } else {
    game.state.isEnded = true;
  }
}

async function leavePlayerFromGame(playerId, game) {
  const gameId = game.gameId;
  game.players[playerId].isLeave = true;
  game.players[playerId].status = PlayerHandler.statusType.LEAVE_GAME;
  game.delayTime[playerId] = 0;
  game.timer[playerId] = 0;

  await RoomHandler.leaveRoom(game.roomId, playerId);

  await Conductor.run(new LeaveGameCommand(), { gameId, playerId }, game);

  if (game.isSetEnded()) {
    await Conductor.run(new EndSetCommand(), { gameId, playerId }, game);
  }
  await GameManager.set("GameHandler - leavePlayer", gameId, game);
}

async function payCoinToJoinGame(game, player) {
  const { playerId } = player.extraData;

  await PlayerManager.saveLastGameIdPlayer(playerId, game.gameId);

  game.players[playerId].isJoin = true;
  game.payed[playerId] = true;
}

module.exports = {
  syncGame,
  joinGame,
  reJoinGame,
  leaveGame,
  offlinePlayer,
  onlinePlayer,
  onChangTurn,
  onMove,
  onPickUp,
  onTurnPass,
  setupGame,
  onOnlineState,
  pickUpBankTurn,
  rejoinPlayerToExistGame,
  tick
};
