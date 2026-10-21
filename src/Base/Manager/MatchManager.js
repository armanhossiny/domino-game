const redisUtils = require("../../Utils/redis");
const { isValidJSON, RedisKeys } = require("../../Consts");
const { process } = global;
const QUEUE_SEND_JOIN_MATCH = RedisKeys.QUEUE_SEND_JOIN_MATCH;
const ALL_MATCHES = RedisKeys.ALL_MATCHES;
const IN_MATCHES = RedisKeys.IN_MATCHES;

async function matchCount() {
  return await countAllMatches();
}

async function deleteMatch(query) {
  await delInAllMatches(query);
}

async function addInMatch(playerId, data) {
  const key = `${IN_MATCHES}:${playerId}`;
  await redisUtils.set(key, JSON.stringify(data), { EX: 60 * 60 });
}

async function delInMatch(playerId) {
  const key = `${IN_MATCHES}:${playerId}`;
  await redisUtils.del(key);
}

async function getInMatch(playerId) {
  const key = `${IN_MATCHES}:${playerId}`;
  const value = await redisUtils.get(key);

  try {
    return JSON.parse(value);
  } catch (e) {
    return null;
  }
}

async function addQueueSendJoinMatch(objectId, playerId) {
  await redisUtils.sAdd(`${QUEUE_SEND_JOIN_MATCH}:${objectId}`, playerId, {
    EX: 60 * 60 * 12
  });
}

async function getQueueSendJoinMatch(objectId) {
  return await redisUtils.sMembers(`${QUEUE_SEND_JOIN_MATCH}:${objectId}`);
}

async function deleteQueueSendJoinMatch(objectId) {
  await redisUtils.del(`${QUEUE_SEND_JOIN_MATCH}:${objectId}`);
}

async function addInAllMatches(query, matches) {
  const key = `${ALL_MATCHES}:${query}`;
  await redisUtils.set(key, JSON.stringify(matches), { EX: 60 * 5 });
}

async function delInAllMatches(query) {
  await redisUtils.del(`${ALL_MATCHES}:${query}`);
}

async function countAllMatches() {
  const count = await redisUtils.sCard(`${ALL_MATCHES}`);
  return Number(count);
}

async function getInAllMatches(key) {
  const result = await redisUtils.get(`${ALL_MATCHES}:${key}`);
  const matches = JSON.parse(result);
  return matches || [];
}

async function getMatch(query) {
  const key = isValidJSON(query) ? JSON.parse(query).key : query;
  return await getInAllMatches(key);
}

module.exports = {
  matchCount,
  addQueueSendJoinMatch,
  getQueueSendJoinMatch,
  deleteQueueSendJoinMatch,
  addInMatch,
  deleteMatch,
  delInMatch,
  getInMatch,
  addInAllMatches,
  delInAllMatches,
  countAllMatches,
  getInAllMatches,
  getMatch
};
