"use strict";
const Strings = require("../Strings");
const Network = require("../Network");
const { PlayerManager } = require("../Base/Manager");

class LoadRoomCommand {
  constructor(room) {
    this.room = room;
  }

  async execute(_payload) {
    const { playerId, player } = _payload;

    const messageListFilltred = [];
    const fiveMinutesAgo = Date.now() - 1 * 60 * 1000; // ۵ دقیقه قبل بر حسب میلی‌ثانیه
    const last50Messages = this.room.messages.slice(-50);

    for (let i = 0; i < last50Messages.length; i++) {
      const item = this.room.messages[i];
      if (
        !Object.hasOwn(item, "displayName") ||
        !Object.hasOwn(item, "avatar") ||
        !Object.hasOwn(item, "frame") ||
        !Object.hasOwn(item, "level") ||
        !Object.hasOwn(item, "isVip")
      ) {
        const playerId = item.playerId;
        const player = PlayerManager.get(playerId);
        if (player) {
          const profile = player.profile;
          if (profile) {
            item["displayName"] = Object.hasOwn(profile, "displayName")
              ? profile.displayName
              : "";
            item["avatar"] = Object.hasOwn(profile, "avatar")
              ? profile.avatar
              : "";
            item["frame"] = Object.hasOwn(profile, "frame")
              ? profile.frame
              : "";
            item["level"] = Object.hasOwn(profile, "level") ? profile.level : 0;
            item["isVip"] = Object.hasOwn(profile, "isVip")
              ? false //? profile.isVip
              : false;
          }
        }
      }
      if (item.type === 2) {
        if (item.date >= fiveMinutesAgo) {
          messageListFilltred.push(item);
        }
      } else {
        messageListFilltred.push(item);
      }
    }

    const payload = {};
    payload.playerId = player.playerId;
    payload.room = {};
    payload.room.onlines = Object.keys(this.room.onlinePlayers).length;
    payload.room.roomId = this.room.roomId;
    payload.room.messages = messageListFilltred || [];
    payload.room.filter = this.room.filter || 1;
    payload.room.adminMessage = this.room.adminMessage || {
      message: "",
      delay: 10
    };

    payload.room.players = this.room.players || {};

    const { connectionId } = player;
    await Network.SendByConnectionId(connectionId, {
      method: Strings.MT_LOAD_ROOM,
      req: this.room.req || 0,
      payload
    });

    return this.room;
  }
}

module.exports = LoadRoomCommand;
