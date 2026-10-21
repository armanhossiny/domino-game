const Strings = require("../Strings");
const { broadcastToRoom } = require("./CommandsFunctions");

class SendStickerCommand {
  async execute(_payload, room) {
    const { roomId, senderId, receiverId, key } = _payload;

    if (!key || !senderId || !receiverId || !roomId) {
      return;
    }
    const payload = {
      method: Strings.MT_SHOW_STICKER_MESSAGE,
      payload: {
        roomId: roomId,
        info: {
          senderId: senderId,
          receiverId: receiverId,
          key: key
        }
      }
    };

    await broadcastToRoom(room, payload, false);
  }
}

module.exports = SendStickerCommand;

//test push
