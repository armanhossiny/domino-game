const redisUtils = require("../../Utils/redis");
const ruleFactory = require("../../Rules");
const { logger } = require("../../Utils");
const { RedisKeys } = require("../../Consts");
const Core = require("../../Core");
const { process } = global;
const GAME_MAX_EX_TIME = 60 * 20;

const ALL_GAMES = RedisKeys.ALL_GAMES;

async function add(gameId, game) {
  await redisUtils.set(`${ALL_GAMES}:${gameId}`, JSON.stringify(game), {
    EX: GAME_MAX_EX_TIME
  });
  await Core.addGame(gameId);
  return true;
}

async function addId(gameId) {
  return true;
}

async function finalizeAdmission(gameId, objectId, refunded) {
  const key = `${ALL_GAMES}:${gameId}`;
  for (let attempt = 0; attempt < 5; attempt++) {
    const raw = await redisUtils.get(key);
    if (!raw) throw Error("ACTIVATION_GAME_STATE_MISSING");
    const current = JSON.parse(raw);
    if (current.objectId !== objectId) throw Error("ACTIVATION_GAME_ID_CONFLICT");
    if (!current.state.admissionPending || current.state.admissionRefunded) {
      if (!current.state.isEnded) await Core.addGame(gameId);
      return ruleFactory(current);
    }
    current.state.admissionPending = refunded;
    if (refunded) {
      current.state.isEnded = true;
      current.state.admissionRefunded = true;
    }
    // CAS preserves a newer board when an activation response arrives late.
    const changed = await redisUtils.eval(
      "if redis.call('GET',KEYS[1]) ~= ARGV[1] then return 0 end redis.call('SET',KEYS[1],ARGV[2],'EX',ARGV[3]); return 1",
      { keys: [key], arguments: [raw, JSON.stringify(current), String(GAME_MAX_EX_TIME)] });
    if (!changed) continue;
    if (refunded) await Core.removeGame(gameId);
    else await Core.addGame(gameId);
    return ruleFactory(current);
  }
  throw Error("ACTIVATION_STATE_BUSY");
}

async function set(where, gameId, game) {
  if (game) {
    if (gameId && Object.keys(game).length) {
      await redisUtils.set(`${ALL_GAMES}:${gameId}`, JSON.stringify(game), {
        EX: GAME_MAX_EX_TIME
      });
    }
  }
}

async function del(gameId) {
  if (gameId) {
    //await redisUtils.del(`${ALL_GAMES}:${gameId}`);
    await Core.removeGame(gameId);
    return true;
  }
  return false;
}

async function count() {
  return await Core.getGameCount();
}

async function get(gameId) {
  const game = await redisUtils.get(`${ALL_GAMES}:${gameId}`);
  if (!game) {
    return null;
  }

  const gameObj = JSON.parse(game);
  if (gameObj && Object.keys(gameObj).length) {
    return ruleFactory(gameObj);
  } else {
    logger.debug(`gameObj && Object.keys(gameObj).length ${gameId} `);
    logger.debug(game);
    //console.trace("gameObj Called from:");
    //logger.error(new Error("gameObj Called from:"));
  }

  return null;
}

async function all() {
  return await Core.getAllGames();
}

module.exports = {
  finalizeAdmission,
  add,
  addId,
  set,
  del,
  count,
  get,
  all
};
