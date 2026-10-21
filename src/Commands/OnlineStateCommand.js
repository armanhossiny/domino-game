const Strings = require("../Strings");
const Network = require("../Network");
const PlayerManager = require("../Base/Manager/PlayerManager");
const { TableManager } = require("../Base/Manager");

class OnlineStateCommand {
  async execute(_payload) {
    const { connectionId, gameMode, player } = _payload;
    const playerId = player?.playerId || "";
    const result = await TableManager.getAllGameTablesInfo();
    const allGameTablesInfo = {};
    for (const table of result) {
      table.online = await TableManager.getTableOnlineCount(table.key);
      if (
        table.modeGame === gameMode ||
        !gameMode ||
        gameMode === "None" ||
        gameMode === 0
      ) {
        allGameTablesInfo[table.key] = {
          key: table.key,
          online: table.online
        };
      }
    }

    const allOnline = await PlayerManager.count();
    const payload = { table: allGameTablesInfo, allOnline };

    await Network.SendByConnectionId(playerId, {
      method: Strings.MT_ONLINE_STATE,
      payload
    });
  }
}

module.exports = OnlineStateCommand;
