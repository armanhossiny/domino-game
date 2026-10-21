"use strict";
const Strings = require("../Strings");
const Network = require("../Network");

class LeaveGameCommand {
  async execute(_payload, game) {
    const { gameId, playerId } = _payload;

    const payload = {};
    payload.gameId = gameId;
    payload.playerId = playerId;

    await Network.SendByPlayerId(playerId, {
      method: Strings.MT_LEFT_GAME,
      req: game.req + 1,
      payload
    });

    game = await Network.SendToAllPlayerInGame(
      game,
      {
        method: Strings.MT_LEFT_GAME,
        req: game.req,
        payload
      },
      true
    ).then();

    return game;
  }
}

module.exports = LeaveGameCommand;
