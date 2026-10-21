"use strict";
const Strings = require("../Strings");
const Network = require("../Network");

class isKickFromRoomCommand {
  constructor(room) {
    this.room = room;
  }

  async execute(_payload) {
    const { playerId, player } = _payload;

    const payload = {
      roomId: this.room.roomId,
      playerId
    };

    Network.SendByPlayerId(playerId, {
      method: Strings.MT_IS_KICKED,
      req: this.room.req,
      payload
    }).then();

    return this.room;
  }
}

module.exports = isKickFromRoomCommand;
