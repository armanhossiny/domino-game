"use strict";
const Strings = require("../Strings");
const Network = require("../Network");
const RoomHandler = require("../Handler/RoomHandler");
const { ValidationError } = require("../Utils/CustomError");
const { adminMessagesForPrivateChat, filterMode } = require("../Consts");
const { generateToken } = require("../Utils");

class JoinMatchCommand {
  constructor(match) {
    this.match = match;
  }

  async execute(_payload) {
    const { playerId, query, friendly = false, player } = _payload;

    const players = {};
    const orders = [];
    let currentPlayerIndex = 0;

    for (let i = 0; i < this.match.presences.length; i++) {
      const presence = this.match.presences[i];
      if (!presence) {
        orders.push("");
        continue;
      }

      const {
        playerId: presenceId,
        order,
        profile,
        join = false,
        creator = false
      } = presence;

      if (presenceId === _payload.playerId) {
        _payload.profile = profile;
      }

      orders.push(presenceId);
      players[presenceId] = {
        playerId: presenceId,
        order,
        profile: {
          playerId: profile.playerId,
          displayName: profile.displayName,
          avatar_url: profile.avatar_url,
          frame_url: profile.frame_url,
          selected_item: profile.selected_item,
          isVip: profile.isVip,
          level: profile.level
        },
        // tournamentKey,
        // query,
        join,
        creator
      };

      if (presenceId === playerId) {
        currentPlayerIndex = i;
      }
    }
    const { matchId, roomId, maxPlayer } = this.match;
    // const voiceToken = room?.voiceTokens[playerId] || "";
    //const player = await PlayerManager.get(playerId);

    const payloadForNewPlayer = {
      matchId,
      roomId,
      maxPlayer,
      orders,
      players,
      friendly,
      query,
      // tournamentKey,
      chat: [],
      adminMessage: {}
    };

    payloadForNewPlayer.adminMessage = adminMessagesForPrivateChat;
    payloadForNewPlayer.filter = filterMode;

    const payloadForOther = {
      ...payloadForNewPlayer,
      newPlayer: {
        playerId: playerId,
        order: _payload.order,
        index: currentPlayerIndex,
        //profile: _payload.profile
        profile: {
          playerId: player.profile.playerId,
          displayName: player.profile.displayName,
          avatar_url: player.profile.avatar_url,
          frame_url: player.profile.frame_url,
          selected_item: player.profile.selected_item,
          isVip: player.profile.isVip,
          level: player.profile.level
        }
      }
    };

    const room = await RoomHandler.getRoom(roomId, playerId);
    if (room) {
      payloadForNewPlayer.chat = room.messages.slice(-10);
      payloadForOther.chat = room.messages.slice(-10);
    }

    let isExistPlayer = false;

    // if (this.match.clubId) {
    //   const club = await RoomHandler.getRoom(this.match.clubId, playerId);
    // }

    for (const presence of this.match.presences) {
      if (!presence) {
        continue;
      }

      if (presence.playerId === playerId) {
        isExistPlayer = true;
      }
      await Network.SendByPlayerId(presence.playerId, {
        method:
          presence.playerId === playerId
            ? Strings.MT_JOIN_MATCH
            : Strings.MT_NEW_JOINED_MATCH,
        payload: payloadForOther
      });
    }

    if (!isExistPlayer) {
      throw new ValidationError("PleaseJoinInNewMatch");
    }
  }
}

module.exports = JoinMatchCommand;
