const Strings = require("../Strings");

const { broadcastToRoom } = require("./CommandsFunctions");

class SendMessageCommand {
  async execute(_payload, room) {
    const { roomId, playerId } = _payload;

    const msg = _payload.message;

    const payload = {
      method: Strings.MT_SHOW_MESSAGE,
      payload: {
        roomId: roomId,
        info: {
          playerId: playerId,
          message: msg
        }
      }
    };

    await broadcastToRoom(room, payload, false);
  }
}

module.exports = SendMessageCommand;

//test push
