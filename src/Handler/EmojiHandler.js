const EmojiManager = require("../Base/Manager/EmojiManager");

class EmojiHandler {
  constructor() {}

  async get(playerId) {
    return await EmojiManager.get(playerId);
  }
}

module.exports = new EmojiHandler();
