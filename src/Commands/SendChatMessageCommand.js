const Strings = require("../Strings");
const { SendByPlayerId } = require("../Network");
const RoomManager = require("../Base/Manager/RoomManager");

class SendChatMessageCommand {
  async execute(_payload) {
    const playerId = _payload.playerId;
    const displayName = _payload.displayName;
    const avatar = _payload.avatar;
    const frame = _payload.frame;
    const level = _payload.level;
    const isVip = _payload.isVip;
    const roomId = _payload.roomId;
    const msg = _payload.message;
    const type = _payload.type;
    const date = _payload.date;
    const room = await RoomManager.get(roomId);
    const payload = {
      method: Strings.MT_CHAT_MESSAGE,
      payload: {
        //gameId: gameId,
        roomId: roomId,
        info: {
          playerId: playerId,
          displayName,
          avatar,
          frame,
          level,
          isVip,
          message: msg,
          type: type,
          date: date
        }
      }
    };

    if (room) {
      const playerIds = Object.keys(room.onlinePlayers);

      for (const playerId of playerIds) {
        //if (!room.players[playerId].isLeave)
        {
          SendByPlayerId(playerId, payload).then();
        }
      }
    }
  }
}

module.exports = SendChatMessageCommand;

//test push
