const redisUtils = require("../../Utils/redis");

const { logger } = require("../../Utils");

const GAME = "DominoServer";
const CATEGORY = "Groups";
const GROUPS = `${GAME}:${CATEGORY}:list`;
const GROUPS_INFO = `${GAME}:${CATEGORY}:info`;
const GROUPS_CACHE_TTL = 3600;
const GROUP_INFO_TTL = 1800;
const GROUPS_PAGE_CACHE_TTL = 60;
const MEMBERS_QUERY_LIMIT = 100;
const PENDING_REQUESTS_LIMIT = 20; // 🆕: صفحه‌بندی برای join requests
const SEARCH_CACHE_TTL = 15;
const MIN_SEARCH_NAME_LENGTH = 2;
const NULL_CACHE_TTL = 300; // برای نتایج null
const LEADERBOARD_ENRICH_LIMIT = 50; // حداکثر پلیر برای enrich کردن
const REDIS_BATCH_SIZE = 50; // 🆕: Chunked mGet batch size

function buildGroupData(group) {
  const createdAt = group.get?.("createdAt") ?? group.createdAt;
  const updatedAt = group.get?.("updatedAt") ?? group.updatedAt;

  return {
    objectId: group.id,
    admins: group.get("admins") || [],
    avatar: group.get("avatar"),
    co_admins: group.get("co_admins") || [],
    describe: group.get("describe"),
    displayName: group.get("displayName"),
    location: group.get("location"),
    owner: group.get("owner"),
    players: group.get("players") || [],
    isPrivate: group.get("isPrivate"),
    maxMember: group.get("maxMember"),
    createdAt: createdAt instanceof Date ? createdAt.toISOString() : createdAt,
    updatedAt: updatedAt instanceof Date ? updatedAt.toISOString() : updatedAt
  };
}

async function get(groupId) {
  const cacheKey = `${GROUPS_INFO}:${groupId}`;
  const cached = await redisUtils.get(cacheKey);
  if (cached !== null) {
    if (cached === "null") {
      return null;
    }
    return JSON.parse(cached);
  }
  return null;
}

async function updateGroupCache(groupId, group) {
  const pipeline = redisUtils.multi();

  pipeline.set(
    `${GROUPS_INFO}:${groupId}`,
    JSON.stringify(buildGroupData(group)),
    { EX: GROUP_INFO_TTL }
  );

  pipeline.zAdd(
    GROUPS,
    [
      {
        score: group.get("createdAt").getTime(),
        value: groupId
      }
    ],
    { XX: true }
  );

  await pipeline.exec();
}

module.exports = {
  get,
  buildGroupData,
  updateGroupCache
};
