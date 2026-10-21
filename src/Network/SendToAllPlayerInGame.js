const SendByPlayerId = require("./SendByPlayerId");
const SendToAllPlayerInGame = async (game, payload, addCounter) => {
  if (addCounter !== false) {
    game.req++;
    payload.req = game.req;
  }
  for (const key in game.players) {
    const player = game.players[key];
    const playerId = player.playerId;
    if (!player.isLeave) {
      SendByPlayerId(playerId, payload).then();
    }
  }
  return game;
};

module.exports = SendToAllPlayerInGame;
