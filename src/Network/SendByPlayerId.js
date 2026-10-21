const PlayerManager = require("../Base/Manager/PlayerManager");
const SendByConnectionId = require("./SendByConnectionId");

const SendByPlayerId = async (playerId, payload) => {
  await SendByConnectionId(playerId, payload);
};

module.exports = SendByPlayerId;
