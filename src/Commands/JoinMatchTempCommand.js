"use strict";
const Strings = require("../Strings");
const Network = require("../Network");
const RoomHandler = require("../Handler/RoomHandler");
const { generateToken } = require("../Utils");
const RoomManager = require("../Base/Manager/RoomManager");

class JoinMatchTempCommand {
  constructor(match) {
    this.match = match;
  }

  async execute(_payload) {
    const {
      playerId,
      query,
      friendly = false,
      tournamentKey,
      player
    } = _payload;

    const players = {};
    const orders = [];
    let currentPlayerIndex = 0;

    for (let i = 0; i < this.match.presences.length; i++) {
      const presence = this.match.presences[i];
      if (!presence) {
        orders.push("");
        continue;
      }
      const { playerId: presenceId, order, profile, join, creator } = presence;
      orders.push(presenceId);
      players[presenceId] = {
        playerId: presenceId,
        order,
        profile,
        tournamentKey,
        query,
        join,
        creator
      };

      if (presenceId === playerId) {
        currentPlayerIndex = i;
      }
    }
    const { matchId, roomId, maxPlayer } = this.match;

    const payloadForNewPlayer = {
      matchId,
      roomId,
      maxPlayer,
      orders,
      players,
      query,
      friendly,
      tournamentKey,
      chat: []
    };

    const payloadForOther = {
      ...payloadForNewPlayer,
      newPlayer: {
        playerId: playerId,
        order: _payload.order,
        index: currentPlayerIndex,
        profile: _payload.profile
      }
    };

    // if (room) {
    //   payloadForNewPlayer.chat = room.messages;
    //   payloadForOther.chat = room.messages;
    // }

    for (const presence of this.match.presences) {
      if (!presence || playerId === presence.playerId) {
        continue;
      }

      await Network.SendByPlayerId(presence.playerId, {
        method: Strings.MT_JOINED_MATCH_TEMP,
        payload: payloadForOther
      });
    }
  }
}

module.exports = JoinMatchTempCommand;
