const Network = require("../Network");
const Strings = require("../Strings");

class HideBankCommand {
  async execute(_payload, game) {
    const { gameId, playerId } = _payload;

    game.state.showBank = false;

    // const playerId = game.state.order;

    //this.game.delayTime[playerId, this.game.oldDelayTime.get(playerId)];
    // game.players.forEach(player => {
    for (const key in game.players) {
      const player = game.players[key];
      await Network.SendByPlayerId(player.playerId, {
        method: Strings.MT_HIDE_BANK,
        req: game.req,
        payload: { gameId, playerId: playerId }
      }).then();
    }
    // });
    return game;
  }
}

module.exports = HideBankCommand;
