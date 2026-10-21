const redisUtils = require("../../Utils/redis");
const { RoomModel } = require("../../Models");
const { logger } = require("../../Utils");
const { RedisKeys } = require("../../Consts");
const { process } = global;

const ALL_ROOMS = RedisKeys.ALL_ROOMS;
const ONLINE_PLAYERS_ROOM = RedisKeys.ONLINE_PLAYERS_ROOM;

async function save(roomId, room) {
  await redisUtils.set(`${ALL_ROOMS}:${roomId}`, JSON.stringify(room), {
    EX: 60 * 60 * 24
  });
  return true;
}

async function del(roomId) {
  if (roomId) {
    await redisUtils.del(`${ALL_ROOMS}:${roomId}`);
  } else {
    logger.debug("invalide key arg in delete room!");
  }
}

async function get(roomId) {
  if (roomId) {
    const room = await redisUtils.get(`${ALL_ROOMS}:${roomId}`);
    if (!room) {
      return null;
    }
    const roomObject = JSON.parse(room);
    if (roomObject && Object.keys(roomObject).length) {
      return new RoomModel(roomObject);
    } else {
      return null;
    }
  }
  return null;
}

async function joinPlayer(playerId, roomId) {
  const key = `${ONLINE_PLAYERS_ROOM}:${roomId}`;
  await redisUtils.sAdd(key, playerId);
  await redisUtils.expire(key, 60 * 60);
}

async function leavePlayer(playerId, roomId) {
  if (!roomId) {
    return;
  }
  const key = `${ONLINE_PLAYERS_ROOM}:${roomId}`;
  await redisUtils.sRem(key, playerId);
  const setSize = await redisUtils.sCard(key);
  if (setSize === 0) {
    await redisUtils.del(key);
  }

  const room = await get(roomId);
  if (room) {
    const player = room.onlinePlayers[playerId];
    if (player) {
      delete room.onlinePlayers[playerId];
      await save(roomId, room);
    }
  }

  //TODO plz write code for delete room,room not delete at all

  return room;
}

function isEmptyObject(obj) {
  return Object.keys(obj).length === 0;
}

async function geOnlineCount(roomId) {
  const count = await redisUtils.sCard(`${ONLINE_PLAYERS_ROOM}:${roomId}`);
  return Number(count);
}

module.exports = {
  save,
  del,
  get,
  joinPlayer,
  leavePlayer,
  geOnlineCount
};
