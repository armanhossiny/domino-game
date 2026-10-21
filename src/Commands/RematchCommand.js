"use strict";

const Strings = require("../Strings");
const { broadcastToGame } = require("./CommandsFunctions");

class RematchCommand {
  async execute(_payload, game) {
    const { playerId } = _payload;

    const msg = _payload.message;

    const payload = {
      method: Strings.MT_SHOW_MESSAGE
    };
    payload.payload = {
      gameId: game.gameId
    };
    payload.payload.info = {
      playerId: playerId,
      message: msg
    };
    await broadcastToGame(game, payload);

    return game;
  }
}

module.exports = RematchCommand;
