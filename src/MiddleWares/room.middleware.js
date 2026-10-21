const Network = require("../Network");
const Strings = require("../Strings");
const { RoomManager } = require("../Base/Manager");
const { ValidationError } = require("../Utils/CustomError");
const Conductor = require("../Commands/Conductor");
const isKickFromRoomCommand = require("../Commands/isKickFromRoomCommand");

async function isRoomExist(payload) {
  const { roomId } = payload;
  if (roomId) {
    const room = await RoomManager.get(roomId);
    if (room) {
      return true;
    }
  }
  return false;
}

async function isKicked(payload) {
  const { roomId } = payload;
  if (roomId) {
    const room = await RoomManager.get(roomId);
    if (room) {
      const { player } = payload;
      const playerId = player.playerId;
      const kickedPlayers = room.kickedPlayers;
      const players = room.players;
      if (
        !kickedPlayers ||
        !Object.hasOwn(kickedPlayers, playerId) ||
        Object.hasOwn(players, playerId)
      ) {
        return false;
      }
      await Conductor.run(new isKickFromRoomCommand(room), payload);

      throw new ValidationError(`isPlayerKicked:${Strings.S_PLAYER_IS_KICKED}`);
    }
  }
  return false;
}

async function needRoomExist(payload) {
  const { player, roomId } = payload;
  const playerId = player.playerId;
  const roomIdFinal = roomId; /*|| player?.extraData?.roomId*/
  if (roomIdFinal) {
    payload.roomId = roomIdFinal;
    const room = await RoomManager.get(roomIdFinal);

    if (room) {
      payload.room = room;
      return;
    }

    await Network.SendByConnectionId(playerId, {
      method: Strings.MT_JOIN_ROOM_ERROR,
      message: Strings.S_ROOM_NOT_VALID
    });

    await RoomManager.del(roomIdFinal);
    throw new ValidationError("ROOM_NOTE_EXIST");
  } else {
    await Network.SendByConnectionId(playerId, {
      method: Strings.MT_JOIN_ROOM_ERROR,
      message: Strings.S_ROOM_ID_IS_EMPTY
    });
    console.error("---> roomIdEmpty:", payload);
    throw new ValidationError("ROOM_ID_EMPTY");
  }
}

module.exports = {
  isRoomExist,
  isKicked,
  needRoomExist
};
