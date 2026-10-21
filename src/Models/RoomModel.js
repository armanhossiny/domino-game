class RoomModel {
  constructor(obj = {}) {
    const {
      roomId = "",
      players = {},
      onlinePlayers = {},
      kickedPlayers = {},
      messages = [],
      voiceTokens = {},
      filter = 1,
      adminMessage = {}
    } = obj;

    const { message = "", delay = 10 } = adminMessage;

    this.roomId = roomId;
    this.players = players;
    this.onlinePlayers = onlinePlayers;
    this.kickedPlayers = kickedPlayers;
    this.messages = messages;
    this.voiceTokens = voiceTokens;
    this.filter = filter;
    this.adminMessage = { message, delay };
  }
}

module.exports = RoomModel;
