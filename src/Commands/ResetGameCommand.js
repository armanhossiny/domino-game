"use strict";
const { initPlayersHand } = require("./CommandsFunctions");

class ResetGameCommand {
  async execute(_payload, game) {
    game.resetState();
    initPlayersHand(game);
    return game;
  }
}

module.exports = ResetGameCommand;
