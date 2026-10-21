"use strict";

class AcceptInviteMatchCommand {
  constructor(match) {
    this.match = match;
  }

  execute(_payload, game) {
    return game;
  }
}

module.exports = AcceptInviteMatchCommand;
