"use strict";
const Strings = require("../Strings");
const Network = require("../Network");
const PlayerHandler = require("../Handler/PlayerHandler");

class LeaveMatchCommand {
  constructor(match) {
    this.match = match;
  }

  async execute(_payload) {
    const { playerId } = _payload;

    const players = {};
    const orders = [];

    for (const presence of this.match.presences) {
      if (!presence) {
        orders.push("");
        continue;
      }
      const {
        playerId,
        order,

        join = false,
        creator = false
      } = presence;
      const playerData = await PlayerHandler.get(playerId);
      const profile =
        playerData !== undefined && playerData !== null
          ? playerData["profile"]
          : presence.profile;

      orders.push(playerId);
      players[playerId] = {
        playerId,
        order,
        profile,
        join,
        creator
      };
    }

    const { matchId, maxPlayer } = this.match;
    const payloadForOther = {
      method: Strings.MT_LEAVE_MATCH,
      payload: {
        matchId,
        maxPlayer,
        orders,
        players,
        playerLeaved: {
          playerId: playerId,
          order: _payload.order
        }
      }
    };

    await Network.SendByPlayerId(playerId, payloadForOther);

    for (const presence of this.match.presences) {
      if (!presence || playerId === presence.playerId) {
        continue;
      }

      await Network.SendByPlayerId(presence.playerId, payloadForOther);
    }
  }
}

module.exports = LeaveMatchCommand;
