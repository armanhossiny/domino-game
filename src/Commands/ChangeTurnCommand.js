const Strings = require("../Strings");
const Conductor = require("./Conductor");
const TurnPassCommand = require("./TurnPassCommand");
const EndSetCommand = require("./EndSetCommand");
const { broadcastAddState } = require("./CommandsFunctions");

class ChangeTurnCommand {
  async execute(_payload, game) {
    const { gameId, playerId } = _payload;

    game.cycle = 0;
    if (game.isSetEnded()) {
      await Conductor.run(new EndSetCommand(), { gameId: gameId }, game);
      return;
    }

    game.changeOrder();
    const payload = {
      method: Strings.MT_CHANGE_TURN,
      req: game.req
    };
    payload.payload = {};
    payload.payload.info = {
      playerId: playerId
    };

    payload.payload.state = game.state;
    await broadcastAddState(game, payload);

    if (game.bank.length === 0 && !game.canPlay(playerId)) {
      await Conductor.run(
        new TurnPassCommand(),
        {
          gameId,
          playerId,
          fromClient: _payload.fromClient
        },
        game
      );
    }
  }
}

module.exports = ChangeTurnCommand;
