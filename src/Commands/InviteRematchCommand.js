"use strict";

const Strings = require("../Strings");
const Network = require("../Network");
const PlayerHandler = require("../Handler/PlayerHandler");
const { GameType } = require("../Consts");

class InviteRematchCommand {
  async execute(_payload, game) {
    const { gameId, playerId } = _payload;

    const profile = _payload.profile;
    const invitePlayerId = _payload.invitePlayerId;
    const table = _payload.table;
    const query = _payload.query;
    const players = _payload.players;
    const order = _payload.order || -1;
    const friendly = _payload.friendly || false;
    const gameType = _payload.gameType || new GameType();

    const player = await PlayerHandler.get(playerId);
    const invitePlayer = await PlayerHandler.get(invitePlayerId);

    const payload = {
      friendly,
      gameId,
      playerId,
      table,
      gameType,
      query,
      profile,
      order,
      players
    };

    if (invitePlayer) {
      await Network.SendByPlayerId(invitePlayer.playerId, {
        method: Strings.MT_INVITE_REMATCH,
        payload: payload
      }).then();
    } else {
      Object.assign(payload, {
        playerId: invitePlayerId,
        inviterPlayerId: playerId
      });
      await Network.SendByPlayerId(player.playerId, {
        method: Strings.MT_DECLINE_JOIN_MATCH,
        payload: payload
      }).then();
    }

    return game;
  }
}

module.exports = InviteRematchCommand;
