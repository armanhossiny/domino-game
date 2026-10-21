"use strict";
const Strings = require("../Strings");
const Network = require("../Network");

class NewReJoinRoomCommand {
  constructor(room) {
    this.room = room;
  }

  async execute(_payload) {
    const { playerId, player } = _payload;

    const payload = {
      roomId: this.room.roomId,
      playerId,
      onlines: Object.keys(this.room.onlinePlayers).length,
      player: this.room.players[playerId]
    };

    const playerIds = Object.keys(this.room.onlinePlayers);

    for (const id of playerIds) {
      if (id === playerId) {
        continue;
      }
      Network.SendByPlayerId(id, {
        method: Strings.MT_NEW_REJOIN_ROOM,
        req: this.room.req,
        payload
      }).then();
    }
    return this.room;
  }
}

module.exports = NewReJoinRoomCommand;
