const Strings = require("../Strings");

const { broadcastToRoom } = require("./CommandsFunctions");

class SendProvidedMessageCommand {
  async execute(_payload, room) {
    const { roomId, playerId, key, name, type, financial } = _payload;

    if (!key || !playerId || !name || !type) {
      return;
    }
    const payload = {
      method: Strings.MT_SHOW_PROVIDED_MESSAGE,
      payload: {
        roomId: roomId,
        info: {
          playerId: playerId,
          key: key,
          name: name,
          type: type,
          financial: financial
        }
      }
    };

    await broadcastToRoom(room, payload, false);
  }
}

module.exports = SendProvidedMessageCommand;

//test push
