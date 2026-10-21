"use strict";
const Strings = require("../Strings");
const Network = require("../Network");
const PlayerHandler = require("../Handler/PlayerHandler");
const MatchManager = require("../Base/Manager/MatchManager");

class DeclineInviteMatchCommand {
  constructor(match) {
    this.match = match;
  }

  async execute(_payload, game) {
    const { gameId, playerId, key, inviterPlayerId } = _payload;

    const player = await PlayerHandler.get(playerId);
    const query = JSON.stringify({
      query: _payload.query,
      key: key
      //variant:variant
    });

    const matches = await MatchManager.getMatch(`${key}${_payload.query}`);
    const match = matches.find((m) => m.query === _payload.query);
    if (match) {
      if (player) {
        const profile = player.profile;
        const variant = player?.variant || "default";
        const payload = {
          gameId,
          matchId: match.matchId,
          playerId,
          key,
          query: _payload.query,
          player: profile
        };
        const inviterPlayer = await PlayerHandler.get(inviterPlayerId);
        if (inviterPlayer) {
          await Network.SendByPlayerId(inviterPlayer.playerId, {
            method: Strings.MT_DECLINE_JOIN_MATCH,
            payload: payload
          }).then();
        }
      }
    }
    return game;
  }
}

module.exports = DeclineInviteMatchCommand;
