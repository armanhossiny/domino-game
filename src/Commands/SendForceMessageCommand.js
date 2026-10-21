const Strings = require("../Strings");
const Network = require("../Network");
const { logger } = require("../Utils/logger");

class SendForceMessageCommand {
  async execute(playerId) {
    logger.debug(`SendForceMessageCommand execute:  ${playerId}`);
    const payload = {
      method: Strings.MT_FORCE_MESSAGE,
      payload: {
        verApp: 0,
        title: "Reset server! Please wait!",
        message: "Reset server! Please wait!",
        linkSite: "Reset server! Please wait!",
        linkPhoto: "Reset server! Please wait!"
      }
    };
    await Network.SendByPlayerId(playerId, payload).then();
  }
}

module.exports = SendForceMessageCommand;

//test push
