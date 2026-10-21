const StickerManager = require("../Base/Manager/StickerManager");

class StickerHandler {
  constructor() {}

  async get(playerId) {
    return await StickerManager.get(playerId);
  }
}

module.exports = new StickerHandler();
