"use strict";

const EndSetCommand = require("./EndSetCommand");

const Conductor = require("./Conductor");

const Strings = require("../Strings");
const { updateActiveState, broadcastAddState } = require("./CommandsFunctions");

class TurnPassCommand {
  async execute(_payload, game) {
    const { gameId, playerId } = _payload;

    const player = game.players[playerId];

    await updateActiveState({ game, player, ..._payload });

    game.cycle = 0;
    if (game.isSetEnded()) {
      await Conductor.run(
        new EndSetCommand(),
        { gameId: gameId, playerId: playerId },
        game
      );

      return;
    }

    game.passCounter++;

    game.changeOrder();

    const payload = {
      method: Strings.MT_TURN_PASS,
      req: game.req,
      payload: {
        info: {
          playerId: playerId
        },
        state: game.state
      }
    };

    await broadcastAddState(game, payload);
  }
}

module.exports = TurnPassCommand;
