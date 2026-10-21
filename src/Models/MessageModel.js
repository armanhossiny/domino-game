class MessageModel {
  constructor(obj = {}) {
    const {
      id = undefined,
      playerId = undefined,
      displayName = "",
      avatar = "defaults",
      frame = "defaults",
      level = 1,
      isVip = false,
      type = 1,
      message = "",
      date = undefined
    } = obj;

    this.id = id;
    this.playerId = playerId;
    this.displayName = displayName;
    this.avatar = avatar;
    this.frame = frame;
    this.level = level;
    this.isVip = isVip;
    this.type = type; // 0 player - 1 admin - 2 match
    this.message = message;
    this.date = date;
  }
}

module.exports = MessageModel;
