const redisUtils = require("../../Utils/redis");
const GameManager = require("./GameManager");
const EmojiManager = require("./EmojiManager");
const StickerManager = require("./StickerManager");
const { RedisKeys } = require("../../Consts");
const { process } = global;
const { logger } = require("../../Utils");

const PLAYER_ONLINE = RedisKeys.PLAYER_ONLINE;
const ALL_PLAYERS = RedisKeys.ALL_PLAYERS;
const LAST_DATA_PLAYERS = RedisKeys.LAST_DATA_PLAYERS;

async function add(playerId, player, from) {
  if (player && !player.profile) {
    logger.warn("profile undefined", { from });
    const i = 0;
  }
  const now = Date.now();
  await redisUtils.zAdd(`${PLAYER_ONLINE}`, {
    score: now,
    value: playerId
  });
  await redisUtils.set(`${ALL_PLAYERS}:${playerId}`, JSON.stringify(player), {
    EX: 60 * 60 * 3
  });
  return true;
}

async function saveLastGameIdPlayer(playerId, gameId) {
  await redisUtils.set(`${LAST_DATA_PLAYERS}:${playerId}`, gameId, {
    EX: 60 * 60 * 12
  });
}

async function getLastPlayerGame(playerId) {
  const gameId = await redisUtils.get(`${LAST_DATA_PLAYERS}:${playerId}`);
  if (gameId) {
    const game = await GameManager.get(gameId);
    if (game) {
      return game;
    } else {
      await redisUtils.del(`${LAST_DATA_PLAYERS}:${playerId}`);
    }
  }
  return null;
}

async function delLastGameIdPlayer(playerId) {
  return await redisUtils.del(`${LAST_DATA_PLAYERS}:${playerId}`);
}

async function set(playerId, player) {
  if (player) {
    await redisUtils.set(`${ALL_PLAYERS}:${playerId}`, JSON.stringify(player), {
      EX: 60 * 60 * 3
    });
  }
}

async function del(playerId) {
  await redisUtils.del(`${ALL_PLAYERS}:${playerId}`);

  await EmojiManager.del(playerId);
  await StickerManager.del(playerId);
  logger.debug("Delete player!");
}

async function get(playerId) {
  const result = await redisUtils.get(`${ALL_PLAYERS}:${playerId}`);
  return result ? JSON.parse(result) : undefined;
}

async function count() {
  const count = await redisUtils.zCard(`${PLAYER_ONLINE}`);
  return count;
}

async function update(playerId, player, from) {
  if (player && !player.profile) {
    logger.warn("profile undefined", { from });
    const i = 0;
  }
  await redisUtils.set(`${ALL_PLAYERS}:${playerId}`, JSON.stringify(player), {
    EX: 60 * 60 * 3
  });
}

async function updateStatus(playerId, status) {
  const player = await this.get(playerId);
  if (player) {
    Object.assign(player, { status: status });

    await redisUtils.set(`${ALL_PLAYERS}:${playerId}`, JSON.stringify(player), {
      EX: 60 * 60 * 3
    });
  }
  return true;
}

async function setPlayerAsOnline(playerId) {
  const now = Date.now();
  await redisUtils.zAdd(`${PLAYER_ONLINE}`, {
    score: now,
    value: playerId
  });
}

module.exports = {
  add,
  set,
  del,
  count,
  get,
  update,
  updateStatus,
  saveLastGameIdPlayer,
  getLastPlayerGame,
  setPlayerAsOnline,
  delLastGameIdPlayer
};
