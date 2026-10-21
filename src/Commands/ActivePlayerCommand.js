"use strict";
const Strings = require("../Strings");
const Network = require("../Network");
const PlayerHandler = require("../Handler/PlayerHandler");

class ActivePlayerCommand {
  async execute(_payload, game) {
    const { playerId } = _payload;

    const payload = {};
    payload.gameId = game.gameId;
    payload.playerId = playerId;

    payload.info = {};
    payload.info.delayTime = game.delayTime;
    payload.info.timer = game.timer;
    payload.info.isOnline =
      game.players[playerId].status == PlayerHandler.statusType.IN_GAME;

    Network.SendToAllPlayerInGame(
      game,
      {
        method: Strings.MT_ACTIVE_PLAYER,
        req: game.req,
        payload
      },
      false
    ).then();

  }
}

module.exports = ActivePlayerCommand;
