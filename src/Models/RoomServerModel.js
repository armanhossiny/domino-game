class RoomServerModel {
  constructor(obj = {}) {
    const {
      objectId = undefined,
      gameId = undefined,
      players = new Map(),
      onlinePlayers = new Map(),
      kickedPlayers = new Map(),
      messages = []
    } = obj;

    this.objectId = objectId;
    this.gameId = gameId;
    this.players = players;
    this.onlinePlayers = onlinePlayers;
    this.kickedPlayers = kickedPlayers;
    this.messages = messages;
  }
}

module.exports = RoomServerModel;
