const { RedisKeys } = require("../../Consts");
const redisUtils = require("../../Utils/redis");
const { ValidationError } = require("../../Utils/CustomError");

const STICKER_PLAYERS =
  RedisKeys.STICKER_PLAYERS || "DominoServer:StickerPlayers";
const STICKER_INFO =
  RedisKeys.STICKER_INFO || "DominoServer:Sticker:StickersInfo";

/**
 * Generate Redis key for a player
 * @param {string} playerId - Player identifier
 * @returns {string} Redis key
 */
const getPlayerStickerData = (playerId) => `${STICKER_PLAYERS}:${playerId}`;

/**
 * Generate Redis key for sticker info
 * @param {string} stickerName - Sticker name
 * @returns {string} Redis key
 */
const getStickerInfoKey = (stickerName) => `${STICKER_INFO}:${stickerName}`;

/**
 * Set sticker list for a player
 * @param {string} playerId - Player identifier
 * @param {Array} stickerList - List of stickers
 * @returns {Promise<void>}
 */
async function set(playerId, stickerName, count) {
  if (playerId && stickerName) {
    await redisUtils.set(
      `${getPlayerStickerData(playerId)}:${stickerName}`,
      count,
      { EX: 60 * 60 * 24 }
    );
  }
}

/**
 * Delete sticker list for a player
 * @param {string} playerId - Player identifier
 * @returns {Promise<void>}
 */
async function del(playerId, name) {
  if (!playerId) {
    throw new ValidationError("Invalid input: playerId is required");
  }

  await redisUtils.del(`${getPlayerStickerData(playerId)}:${name}`);
}

/**
 * Get sticker list for a player
 * @param {string} playerId - Player identifier
 * @returns {Promise<Array|undefined>} Sticker list or undefined
 */
async function get(playerId, name) {
  if (!playerId) {
    throw new ValidationError("Invalid input: playerId is required");
  }

  const result = await redisUtils.get(
    `${getPlayerStickerData(playerId)}:${name}`
  );
  return result;
}

/**
 * Add sticker information to Redis
 * @param {string} stickerName - Sticker name
 * @param {Object} sticker - Sticker object containing info
 * @returns {Promise<boolean>} Success status
 */
async function addStickerInfo(stickerName, sticker) {
  if (!stickerName || !sticker) {
    throw new ValidationError(
      "Invalid input: stickerName and sticker are required"
    );
  }

  await redisUtils.set(getStickerInfoKey(stickerName), JSON.stringify(sticker));
  return true;
}

/**
 * Get sticker information from Redis
 * @param {string} stickerName - Sticker name
 * @returns {Promise<Object|undefined>} Sticker info object or undefined
 */
async function getStickerInfo(stickerName) {
  if (!stickerName) {
    throw new ValidationError("Invalid input: stickerName is required");
  }

  const result = await redisUtils.get(getStickerInfoKey(stickerName));
  return result ? JSON.parse(result) : undefined;
}

/**
 * Delete sticker information from Redis
 * @param {string} stickerName - Sticker name
 * @returns {Promise<void>}
 */
async function delStickerInfo(stickerName) {
  if (!stickerName) {
    throw new ValidationError("Invalid input: stickerName is required");
  }

  await redisUtils.del(getStickerInfoKey(stickerName));
}

/**
 * Delete all stickers information from Redis
 * @returns {Promise<void>}
 */
async function delAllStickersInfo() {
  const pattern = `${STICKER_INFO}:*`;
  const keys = await redisUtils.keys(pattern);

  if (keys && keys.length > 0) {
    await redisUtils.del(keys);
  }
}

/**
 * Get all stickers information from Redis
 * @returns {Promise<Object>} Object containing all sticker info
 */
async function getAllStickersInfo() {
  const pattern = `${STICKER_INFO}:*`;
  const keys = await redisUtils.keys(pattern);
  const result = {};

  if (keys && keys.length > 0) {
    for (const key of keys) {
      const stickerName = key.replace(`${STICKER_INFO}:`, "");
      const stickerData = await redisUtils.get(key);
      if (stickerData) {
        result[stickerName] = JSON.parse(stickerData);
      }
    }
  }

  return result;
}

/**
 * Check if sticker key exists and is valid
 * @param {string} key - Redis key to check
 * @returns {boolean} True if key is valid sticker key
 */
function checkStickerKey(key) {
  if (!key || typeof key !== "string") {
    return false;
  }

  // Check if key matches sticker info pattern
  const stickerInfoPattern = new RegExp(`^${STICKER_INFO}:`);

  // Check if key matches player sticker pattern
  const playerStickerPattern = new RegExp(`^${STICKER_PLAYERS}:`);

  return stickerInfoPattern.test(key) || playerStickerPattern.test(key);
}

module.exports = {
  set,
  del,
  get,
  addStickerInfo,
  getStickerInfo,
  delStickerInfo,
  delAllStickersInfo,
  getAllStickersInfo,
  checkStickerKey
};
