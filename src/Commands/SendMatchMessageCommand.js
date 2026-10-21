const Strings = require("../Strings");

const { broadcastToRoom } = require("./CommandsFunctions");

class SendMatchMessageCommand {
  async execute(_payload, room) {
    const { playerId, roomId, key, query, maxPlayer, state, joined } = _payload;

    if (!key || !playerId || !query) {
      return;
    }
    const payload = {
      method: Strings.MT_MATCH_MESSAGE,
      payload: {
        roomId: roomId,
        info: {
          playerId,
          key,
          query,
          maxPlayer,
          state,
          joined
        }
      }
    };

    await broadcastToRoom(room, payload, false);
  }
}

module.exports = SendMatchMessageCommand;

//test push
