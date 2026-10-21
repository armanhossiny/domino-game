"use strict";

const Strings = require("../Strings");
const Conductor = require("./Conductor");

const HideBankCommand = require("./HideBankCommand");
const EndSetCommand = require("./EndSetCommand");
const TurnPassCommand = require("./TurnPassCommand");

const { updateActiveState, broadcastAddState } = require("./CommandsFunctions");

class PickFromBankCommand {
  async execute(_payload, game) {
    const { gameId, playerId } = _payload;

    const player = game.players[playerId];

    const domino = _payload.domino;

    game.cycle = 0;

    if (domino === null) {
      await Conductor.run(
        new HideBankCommand(),
        {
          gameId: gameId,
          playerId: playerId
        },
        game
      );

      return;
    }

    await updateActiveState({ game, player, ..._payload });
    player.hand.push(domino);

    const payload = {};
    payload.method = Strings.MT_PICKUP;
    payload.req = game.req;
    payload.payload = {};
    payload.payload.info = {};
    payload.payload.info.playerId = playerId;
    payload.payload.info.index = _payload.indexDomino;
    payload.payload.info.fromClient = _payload.fromClient;

    //if you can play , all player can be seen them
    if (game.canPlayWith(domino)) {
      payload.payload.info.domino = domino;
    } else {
      payload.payload.info.domino = [-1, -1, domino[2]];
    }

    game = await broadcastAddState(game, payload, playerId, {
      domino: domino
    });

    // player can play with picked up domino
    if (game.canPlayWith(domino)) {
      await Conductor.run(
        new HideBankCommand(),
        {
          gameId: gameId,
          playerId: playerId
        },
        game
      );

      return;
    }

    // bank be empty need to close back
    if (game.state.bankSize === 0) {
      await Conductor.run(
        new HideBankCommand(),
        {
          gameId: gameId,
          playerId: playerId
        },
        game
      );

      await Conductor.run(
        new TurnPassCommand(),
        {
          gameId: gameId,
          playerId: playerId,
          fromClient: _payload.fromClient
        },
        game
      );
      return;
    }

    // is current set ended
    if (game.isSetEnded()) {
      //close bank
      await Conductor.run(
        new HideBankCommand(),
        {
          gameId: gameId,
          playerId: playerId
        },
        game
      );

      // run end set
      await Conductor.run(
        new EndSetCommand(),
        {
          gameId: gameId,
          playerId: playerId
        },
        game
      );
    }
  }
}

module.exports = PickFromBankCommand;
