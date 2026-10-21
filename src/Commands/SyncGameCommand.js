"use strict";
const Strings = require("../Strings");
const Network = require("../Network");

class SyncGameCommand {
  async execute(_payload) {
    const { gameId, game, player } = _payload;

    const handPlayers = {};
    for (const playerId in game.players) {
      handPlayers[playerId] = game.players[playerId].hand.length;
    }
    const payload = {
      gameId,
      req: game.req, //TODO delete in 7.0.17
      bankSize: game.bank.length,
      boardSize: game.state.board.length,
      order: game.state.order,
      handSize: handPlayers
    };

    const { playerId } = player.extraData;
    await Network.SendByConnectionId(playerId, {
      method: Strings.MT_SYNC_GAME,
      req: game.req,
      payload
    });

    return game;
  }
}

module.exports = SyncGameCommand;
