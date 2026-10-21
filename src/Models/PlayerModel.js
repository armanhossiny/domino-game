const Profile = require("./ProfileModel");

class PlayerModel {
  constructor(obj = {}) {
    const {
      connectionId = [],
      playerId = undefined,
      isActive = true,
      isLeave = false,
      isJoin = false,
      isPlayedWithDomino = false,
      inRoundPlayed = false,
      connection = undefined,
      status = undefined,
      messageCount = 0,
      isVip = false,
      messageUsedCount = 0,
      emoji = {},
      sticker = {},
      profile = {}
    } = obj;

    this.connectionId = connectionId;
    this.playerId = playerId;
    this.isActive = isActive;
    this.isLeave = isLeave;
    this.isJoin = isJoin;
    this.isPlayedWithDomino = isPlayedWithDomino;
    this.inRoundPlayed = inRoundPlayed;
    this.connection = connection;
    this.status = status;
    this.messageCount = messageCount;
    this.emoji = emoji;
    this.sticker = sticker;
    this.isVip = isVip;
    this.messageUsedCount = messageUsedCount;
    this.profile = new Profile(profile);
  }
}

module.exports = PlayerModel;
