const Network = require("../Network");
const Strings = require("../Strings");

class UpdateProfileCommand {
  async execute(_payload) {
    const { connectionId, playerId } = _payload;

    const payload = {
      method: Strings.MT_UPDATE_PROFILE
    };
    payload.payload = {};
    payload.payload.players = _payload.players;

    await Network.SendByConnectionId(playerId, payload).then();
  }
}

module.exports = UpdateProfileCommand;
