const redisUtils = require("../../Utils/redis");
const { process } = global;
const { RedisKeys } = require("../../Consts");

const ONLINE_PLAYERS_TABLE = RedisKeys.ONLINE_PLAYERS_TABLE;
const GAME_TABLES_INFO = RedisKeys.GAME_TABLES_INFO;
const GAME_TABLES_KEY = RedisKeys.GAME_TABLES_KEY;

const joinToTable = async (tableName, playerId) => {
  const path = `${ONLINE_PLAYERS_TABLE}:${checkTableKey(tableName)}`;
  await redisUtils.sAdd(path, playerId);
};

const leaveOfTable = async (tableName, playerId) => {
  const path = `${ONLINE_PLAYERS_TABLE}:${checkTableKey(tableName)}`;
  await redisUtils.sRem(path, playerId);
};

const getTableOnlineCount = async (tableName) => {
  const path = `${ONLINE_PLAYERS_TABLE}:${checkTableKey(tableName)}`;
  return await redisUtils.sCard(path);
};

const addGameTableInfo = async (tableName, table) => {
  const _tableName = checkTableKey(tableName);
  await Promise.all([
    redisUtils.set(`${GAME_TABLES_INFO}:${_tableName}`, JSON.stringify(table)),
    redisUtils.sAdd(GAME_TABLES_KEY, _tableName)
  ]);
};

const getGameTableInfo = async (tableName) => {
  if (!tableName) {
    return undefined;
  }

  const table = await redisUtils.get(
    `${GAME_TABLES_INFO}:${checkTableKey(tableName)}`
  );
  const tableObj = JSON.parse(table);

  return tableObj && Object.keys(tableObj).length ? tableObj : undefined;
};

const delGameTableInfo = async (tableName) => {
  if (!tableName) {
    return;
  }

  const _tableName = checkTableKey(tableName);
  await Promise.all([
    redisUtils.sRem(GAME_TABLES_KEY, _tableName),
    redisUtils.del(`${GAME_TABLES_INFO}:${_tableName}`)
  ]);
};

const delAllGameTablesInfo = async () => {
  const tables = await redisUtils.sMembers(GAME_TABLES_KEY);
  const deletionPromises = tables.map((tableName) =>
    Promise.all([
      redisUtils.sRem(GAME_TABLES_KEY, tableName),
      redisUtils.del(`${GAME_TABLES_INFO}:${tableName}`)
    ])
  );

  await Promise.all(deletionPromises);
};

const getAllGameTablesInfo = async () => {
  const tables = await redisUtils.sMembers(GAME_TABLES_KEY);
  return Promise.all(tables.map(getGameTableInfo));
};

const checkTableKey = (key) => {
  const lastChar = key.at(-1);
  return Number(lastChar) > -1 ? `${key}_Draw` : key;
};

module.exports = {
  joinToTable,
  leaveOfTable,
  getTableOnlineCount,
  addGameTableInfo,
  delAllGameTablesInfo,
  getGameTableInfo,
  getAllGameTablesInfo,
  delGameTableInfo,
  checkTableKey
};
