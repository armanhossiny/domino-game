const Strings = require("../Strings");
const Network = require("../Network");

class InitGameCommand {
  constructor(match) {
    this.match = match;
  }

  async execute(payload) {
    for (const player of this.match.presences) {
      Network.SendByPlayerId(player.playerId, {
        method: Strings.MT_INIT_GAME,
        payload
      }).then();
    }
  }
}

module.exports = InitGameCommand;
