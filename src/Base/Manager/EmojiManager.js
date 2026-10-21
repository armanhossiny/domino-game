const { process } = global;
const redisUtils = require("../../Utils/redis");
const { RedisKeys } = require("../../Consts");
const { ValidationError } = require("../../Utils/CustomError");

const EMOJI_PLAYERS = RedisKeys.EMOJI_PLAYERS || "DominoServer:EmojiPlayers";
const EMOJI_INFO = RedisKeys.EMOJI_INFO || "DominoServer:Emoji:EmojisInfo";

/**
 * Generate Redis key for a player
 * @param {string} playerId - Player identifier
 * @returns {string} Redis key
 */
const getPlayerEmojiData = (playerId) => `${EMOJI_PLAYERS}:${playerId}`;

/**
 * Generate Redis key for emoji info
 * @param {string} emojiName - Emoji name
 * @returns {string} Redis key
 */
const getEmojiInfoKey = (emojiName) => `${EMOJI_INFO}:${emojiName}`;

/**
 * Set emoji list for a player
 * @param {string} playerId - Player identifier
 * @param {Array} emojiList - List of emojis
 * @returns {Promise<void>}
 */
async function set(playerId, emojiName, count) {
  if (playerId && emojiName) {
    await redisUtils.set(
      `${getPlayerEmojiData(playerId)}:${emojiName}`,
      count,
      { EX: 60 * 60 * 24 }
    );
  }
}

/**
 * Delete emoji list for a player
 * @param {string} playerId - Player identifier
 * @returns {Promise<void>}
 */
async function del(playerId, name) {
  if (!playerId) {
    throw new ValidationError("Invalid input: playerId is required");
  }

  await redisUtils.del(`${getPlayerEmojiData(playerId)}:${name}`);
}

/**
 * Get emoji list for a player
 * @param {string} playerId - Player identifier
 * @returns {Promise<Array|undefined>} Emoji list or undefined
 */
async function get(playerId, name) {
  if (!playerId) {
    throw new ValidationError("Invalid input: playerId is required");
  }

  const result = await redisUtils.get(
    `${getPlayerEmojiData(playerId)}:${name}`
  );
  return result;
}

/**
 * Add emoji information to Redis
 * @param {string} emojiName - Emoji name
 * @param {Object} emoji - Emoji object containing info
 * @returns {Promise<boolean>} Success status
 */
async function addEmojiInfo(emojiName, emoji) {
  if (!emojiName || !emoji) {
    throw new ValidationError(
      "Invalid input: emojiName and emoji are required"
    );
  }

  await redisUtils.set(getEmojiInfoKey(emojiName), JSON.stringify(emoji));
  return true;
}

/**
 * Delete all emojis information from Redis
 * @returns {Promise<void>}
 */
async function delAllEmojisInfo() {
  const pattern = `${EMOJI_INFO}:*`;
  const keys = await redisUtils.keys(pattern);

  if (keys && keys.length > 0) {
    await redisUtils.del(keys);
  }
}

module.exports = {
  set,
  del,
  get,
  addEmojiInfo,
  delAllEmojisInfo
};
