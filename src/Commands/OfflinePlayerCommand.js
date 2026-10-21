"use strict";

const Strings = require("../Strings");
const Network = require("../Network");

class OfflinePlayerCommand {
  async execute(_payload, game) {
    const { playerId } = _payload;
    const payload = {};
    payload.gameId = game.gameId;
    payload.playerId = playerId;

    game = await Network.SendToAllPlayerInGame(
      game,
      {
        method: Strings.MT_OFFLINE_PLAYER,
        req: game.req,
        payload
      },
      false
    ).then();

    return game;
  }
}

module.exports = OfflinePlayerCommand;
