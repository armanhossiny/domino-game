const Strings = require("../Strings");
const Network = require("../Network");

class GetMessageChatCommand {
  async execute(_payload, game) {
    const { gameId, playerId } = _payload;

    const player = game.players[playerId];

    const payload = {
      method: Strings.MT_GET_CHAT_MESSAGE,
      payload: {
        gameId: gameId,
        info: {
          chat: game.chat
        }
      }
    };

    await Network.SendByPlayerId(player.playerId, payload).then();
  }
}

module.exports = GetMessageChatCommand;

//test push
