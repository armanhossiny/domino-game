"use strict";
const Strings = require("../Strings");
const Network = require("../Network");

class InviteToMatchCommand {
  async execute(_payload) {
    const {
      gameId,
      playerId,
      profile,
      invitePlayerId,
      table,
      query,
      players,
      roomId,
      gameType,
      order
    } = _payload;

    const payload = {
      playerId,
      gameId,
      roomId,
      table,
      gameType,
      query,
      profile,
      players,
      order
    };

    await Network.SendByPlayerId(invitePlayerId, {
      method: Strings.MT_INVITE_TO_MATCH,
      payload: payload
    });
  }
}

module.exports = InviteToMatchCommand;
