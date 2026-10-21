const Strings = require("../Strings");
const Network = require("../Network");

class SendResetServerMessageCommand {
  async execute(playerId) {
    const payload = {
      method: Strings.MT_RESET_SERVER,
      payload: {
        message: "Reset server! Please wait!"
      }
    };
    await Network.SendByPlayerId(playerId, payload).then();
  }
}

module.exports = SendResetServerMessageCommand;

//test push
