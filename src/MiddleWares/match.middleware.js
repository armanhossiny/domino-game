const { logger } = require("../Utils");
const Network = require("../Network");
const Strings = require("../Strings");
const { TableManager, PlayerManager } = require("../Base/Manager");
const Core = require("../Core");
const Config = require("../Config");
const Conductor = require("../Commands/Conductor");
const SendResetServerMessageCommand = require("../Commands/SendResetServerMessageCommand");
const MatchManager = require("../Base/Manager/MatchManager");
const { playerHaveActiveGame } = require("../Handler/MatchHandler");

async function sendRejoinGame(payload) {
  const { playerId, gameId, matchObjectId } = payload;
  const job = {
    method: "reJoinGame",
    payload: { playerId, gameId, matchObjectId, fromClient: false }
  };
  await Core.pushMessageToQueue(job);
}

async function isTableExist(payload) {
  const { key, playerId, table } = payload;
  const gameTableInfo = await TableManager.getGameTableInfo(key || table?.key);

  payload.gameTableInfo = gameTableInfo;

  if (!gameTableInfo) {
    logger.debug("start atMatch:gameTableInfo");
    await Network.SendByPlayerId(playerId, {
      method: Strings.MT_NOT_EXIST_TABLE,
      payload: { message: Strings.MT_NOT_EXIST_TABLE }
    });
    throw new Error(Strings.MT_NOT_EXIST_TABLE);
  }
}

async function isPlayerProfileExist(payload) {
  const { player } = payload;
  const { playerId } = player;
  const playerProfile = player.profile; //await getUserProfileParse(playerId);

  if (!playerProfile) {
    logger.debug("start atMatch:playerProfile");
    await Network.SendByPlayerId(playerId, {
      method: Strings.MT_NOT_EXIST_PLAYER,
      payload: { playerId, message: Strings.S_NOT_EXIST_PLAYER_IN_SERVER }
    });
    throw new Error(Strings.MT_NOT_EXIST_PLAYER);
  }
}

async function isNotPlayerBanned(payload) {
  const { player } = payload;
  const { playerId } = player;
  const playerProfile = player.profile;

  if (playerProfile.isBanned) {
    logger.debug("player is banned");
    await Network.SendByPlayerId(playerId, {
      method: Strings.MT_IS_BANNED,
      payload: { message: Strings.S_PLAYER_IS_BANNED }
    });
    throw Error(Strings.MT_IS_BANNED);
  }
}

function checkOrder(payload) {
  const { order } = payload;
  if (order < 0 || order > 4) {
    payload.order = -1;
  }
}

function JoinMatchErrorHandler(fn) {
  return async function (payload) {
    try {
      await fn(payload);
    } catch (e) {
      logger.error(e);
      await Network.SendByPlayerId(payload.player.playerId, {
        method: Strings.MT_JOIN_ERROR,
        payload: {
          playerId: payload.player.playerId,
          message: Strings.S_NOT_EXIST_PLAYER_IN_CACHE
        }
      });
    }
  };
}

async function isPlayerEarlyInGame(payload) {
  const { player } = payload;
  const { playerId } = player;

  const haveActiveGame = await playerHaveActiveGame(playerId);

  if (haveActiveGame) {
    const lastGame = await PlayerManager.getLastPlayerGame(playerId);

    await sendRejoinGame({
      gameId: lastGame.gameId,
      playerId,
      matchObjectId: lastGame.objectId
    });
    throw new Error("PLAYER_EARLY_IN_GAME");
  }
}

async function isCreateGameEnabled(payload) {
  const { playerId } = payload;
  if (Config.get("isGameCreationEnabled") === true) {
    return;
  }

  if (Config.get("isQueueFull") === false) {
    return;
  }

  await Conductor.run(new SendResetServerMessageCommand(), playerId);
  throw new Error(Strings.MT_RESET_SERVER);
}

function isExistingInMatch(match, playerId) {
  return match.presences.find((element) =>
    element ? element.playerId === playerId : false
  );
}

async function checkPlayerEarlyInThisMatch(payload) {
  const { playerId, key, query } = payload;

  const matches = await MatchManager.getMatch(`${key}${query}`);
  const match = matches.find((m) => m.query === query);
  if (match) {
    payload.isPlayerExistInMatch = isExistingInMatch(match, playerId);
  }
}

module.exports = {
  JoinMatchErrorHandler,
  isPlayerProfileExist,
  isNotPlayerBanned,
  isTableExist,
  checkOrder,
  isPlayerEarlyInGame,
  isCreateGameEnabled,
  checkPlayerEarlyInThisMatch
};
