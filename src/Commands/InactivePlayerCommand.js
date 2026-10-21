"use strict";
const Strings = require("../Strings");
const Network = require("../Network");
const Config = require("../Config");

class InactivePlayerCommand {
  async execute(_payload, game) {
    const { playerId } = _payload;

    const payload = {};
    payload.gameId = game.gameId;
    payload.playerId = playerId;
    payload.info = {};
    payload.info.delayTime = game.delayTime;
    payload.info.timer = game.timer;

    game = await Network.SendToAllPlayerInGame(game, {
      method: Strings.MT_DEACTIVE_PLAYER,
      req: game.req,
      payload
    }).then();

    return game;
  }
}

module.exports = InactivePlayerCommand;
