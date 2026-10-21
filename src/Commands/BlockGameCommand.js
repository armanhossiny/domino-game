const Strings = require("../Strings");
const { broadcastToGame } = require("./CommandsFunctions");

class BlockGameCommand {
  async execute(_payload, game) {
    const { gameId, playerId } = _payload;

    const payload = {
      method: Strings.MT_BLOCKED_GAME,
      req: game.req
    };
    const hands = {};
    for (const key in game.players) {
      const player = game.players[key];
      hands[key] = 0;
      player.hand.forEach((domino) => {
        hands[key] += domino[0] + domino[1];
      });
    }

    payload.payload = {
      gameId: gameId,
      hands
    };

    payload.payload.info = {
      playerId: playerId
    };

    await broadcastToGame(game, payload, true);
  }
}

module.exports = BlockGameCommand;

//test push
