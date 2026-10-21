const Network = require("../Network");
const Strings = require("../Strings");
const { DominoAppConfigs } = require("../Consts");

class ShowBankCommand {
  async execute(_payload, game) {
    const { gameId, playerId } = _payload;

    game.state.showBank = true;
    const player = game.players[playerId];
    //game.oldDelayTime.set(playerId, game.delayTime[playerId]);

    if (!player.isActive || player.isLeave) {
      game.delayTime[playerId] = DominoAppConfigs.TURN_WAIT_LEAVE;
    } else {
      game.delayTime[playerId] = DominoAppConfigs.TURN_WAIT;
    }

    await Network.SendToAllPlayerInGame(game, {
      method: Strings.MT_SHOW_BANK,
      req: game.req,
      payload: { gameId, playerId }
    }).then();
  }
}

module.exports = ShowBankCommand;
