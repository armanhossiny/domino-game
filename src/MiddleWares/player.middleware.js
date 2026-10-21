const PlayerManager = require("../Base/Manager/PlayerManager");
const Network = require("../Network");
const Strings = require("../Strings");
const Parse = require("parse/node");
const redisUtils = require("../Utils/redis");
const { ValidationError } = require("../Utils/CustomError");

const Conductor = require("../Commands/Conductor");
const { SendForceMessageCommand } = require("../Commands");
const { logger } = require("../Utils");

async function getPlayerIdWithSessionToken(payload) {
  const { token } = payload;
  if (!token) {
    throw new ValidationError("Invalid session token at payload.");
  }

  const query = new Parse.Query("_Session");
  query.equalTo("sessionToken", token);
  const session = await query.first({ useMasterKey: true });
  if (!session) {
    throw new ValidationError("Invalid session token.token not found ");
  }

  const user = session.get("user");
  if (!user) {
    throw new ValidationError("Invalid session token. user not found");
  }

  if (payload.playerId !== user.id || payload.connectionId !== user.id) {
    throw new ValidationError("SESSION_IDENTITY_MISMATCH");
  }

  payload.playerId = user.id;
}

/**
 * check if player early be in game update the game id with the last game id
 * @param {*} payload
 * @returns {*} payload
 */
async function checkLastPlayerGame(payload) {
  const { playerId, gameId } = payload;
  const lastGame = await PlayerManager.getLastPlayerGame(playerId);
  if (lastGame && lastGame.gameId !== gameId) {
    payload.gameId = lastGame.gameId;
    payload.roomId = lastGame.roomId;
  }
}

/**
 * check if player exist attach to peyload if not player exist send error
 *
 * @param {*} payload
 * @returns
 */
async function needPlayerExist(payload) {
  const { playerId } = payload;

  const player = await PlayerManager.get(playerId);

  //TODO  check player don't send other player id
  if (player) {
    player.profile = {
      ...player.profile,
      isVip: player["isVip"] || false
    };
    payload.player = player;
    return;
  }
  logger.debug("Error On Join Player to Match!");
  await Network.SendByPlayerId(playerId, {
    method: Strings.MT_NOT_EXIST_PLAYER,
    payload: { playerId, message: Strings.S_NOT_EXIST_PLAYER_IN_CACHE }
  });

  throw new ValidationError("PLAYER_NOT_EXIST");
}

async function setPlayerOnline(payload) {
  const { playerId } = payload;
  PlayerManager.setPlayerAsOnline(playerId).then();
}

function setAsFromClient(payload) {
  if (payload) {
    payload.fromClient = true;
  }
}

async function returnAct(payload) {
  const { playerId, act, rid } = payload;
  if (payload && rid !== undefined) {
    await Network.SendByPlayerId(playerId, {
      method: Strings.MT_RETURN_ACT,
      payload: {
        playerId: playerId,
        act: act,
        rid: rid
      }
    });
  }
}

function parseConnectionQuery(payload) {
  const { extra } = payload;
  const url = new URL(`https://example.org${extra}`); //temp url

  const params = url.searchParams;

  payload.ver = Number(params.get("ver") || 0);
  payload.token = params.get("token") || "";
  payload.deviceId = params.get("deviceId") || "";
  payload.playerId = params.get("playerId") || "";
  payload.gameId = params.get("gameId") || "";
  payload.roomId = params.get("roomId") || "";
  payload.query = params.get("query") || "";
  payload.status = "online";
  logger.debug(`check player exist: ${payload.playerId}`);
}

async function checkForceMessage(payload) {
  const { playerId } = payload;
  await Conductor.run(new SendForceMessageCommand(), playerId);
}

async function isPlayerBanned(payload) {
  const { player } = payload;
  const playerId = player.playerId;
  if (!player.isBanned) {
    return;
  }
  const message = {
    method: Strings.MT_IS_BANNED,
    message: Strings.S_PLAYER_IS_BANNED
  };
  await Network.SendByConnectionId(playerId, message);

  throw new ValidationError(`isPlayerBanned:${Strings.S_PLAYER_IS_BANNED}`);
}

async function acknowledgeMiddleware(payload) {
  const { playerId } = payload;

  const message = {
    method: Strings.MT_ACK,
    message: Date.now()
  };
  await Network.SendByConnectionId(playerId, message);
}

module.exports = {
  checkLastPlayerGame,
  needPlayerExist,
  setAsFromClient,
  getPlayerIdWithSessionToken,
  returnAct,
  parseConnectionQuery,
  acknowledgeMiddleware,
  checkForceMessage,
  setPlayerOnline,
  isPlayerBanned
};
