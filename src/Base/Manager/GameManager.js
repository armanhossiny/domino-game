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
  add,
  addId,
  set,
  del,
  count,
  get,
  all
};
