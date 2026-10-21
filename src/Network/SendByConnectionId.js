const { publishMessage } = require("../Core");

const SendByConnectionId = async (playerId, data) => {
  publishMessage(playerId, data).then();
};

module.exports = SendByConnectionId;
