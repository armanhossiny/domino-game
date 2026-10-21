"use strict";

const Network = require("../Network");
const Strings = require("../Strings");
const { logger } = require("../Utils");
const GameManager = require("../Base/Manager/GameManager");
const PlayerManager = require("../Base/Manager/PlayerManager");
const PlayerHandler = require("../Handler/PlayerHandler");
const { setEndGameParse } = require("./CommandsFunctions");
const MatchManager = require("../Base/Manager/MatchManager");
const RoomManager = require("../Base/Manager/RoomManager");

class EndGameCommand {
  async execute(_payload, game) {
    //game.req++;
    // if (game.state.isBlock) {
    //   game.updateScore();

    // }
    game.setWinnerGame();
    let userData = game.state.settlementProfiles;
    if (!Array.isArray(userData)) {
      game.state.settlementPending = true;
      game.state.settlementRetryAt = Date.now() + 5000;
      await GameManager.set("EndGame-settlement-pending", game.gameId, game);
      userData = await setEndGameParse(game);
      game.state.settlementProfiles = userData;
      game.state.settlementPending = false;
      await GameManager.set("EndGame-settlement-confirmed", game.gameId, game);
    }
    const payload = {};

    payload.roomId = game.roomId;
    payload.chat = [];
    const room = await RoomManager.get(game.roomId);
    if (room) {
      payload.chat = room.messages.slice(-10);
    }

    payload.info = {};
    const info = payload.info;
    info.players = {};
    info.winnerGame = game.state.winnerGame;
    info.winnerRound = game.state.winnerRound;
    // old version
    info.winnerSet = info.winnerRound;
    for (const key in game.players) {
      const _player = game.players[key];
      const _playerId = _player.playerId;
      const player = await PlayerManager.get(_playerId);
      if (player) {
        Object.assign(player.extraData, {
          status: PlayerHandler.statusType.IN_END_GAME,
          gameId: "",
          query: "",
          key: "",
          matchId: ""
        });

        await PlayerManager.update(_playerId, player, "EndGameCommand");
      }

      await PlayerManager.delLastGameIdPlayer(_playerId);
      await MatchManager.delInMatch(_playerId);

      const _hand = [];
      _player.hand.forEach((domino) => {
        _hand.push(domino);
      });
      info.players[_playerId] = {
        score: _player.score,
        sumScore: _player.sumScore,
        scores: _player.scores,
        handCount: _player.hand.length,
        hand: _hand
      };
    }

    const userProfileParse = new Map();
    for (const player of userData) {
      const profile = {
        playerId: player._id,
        coins: player.coins,
        gems: player.gems,
        progressBar: player.progressBar,
        level: player.level,
        user_rankCaption: player.user_rankCaption
      };
      userProfileParse.set(player._id, profile);
    }
    // game.players.forEach(player => {
    for (const key in game.players) {
      const player = game.players[key];
      let leave = false;
      if (player.isLeave) {
        leave = true;
      }
      //TODO check client if another game
      if (!leave) {
        //TODO update date user must be updated
        payload.state = {};
        Object.assign(payload.state, game.state);
        payload.gameId = game.gameId;
        payload.objectId = game.objectId;
        payload.hand = player.hand;
        payload.groups = [];
        payload.groups = game.groups;
        payload.players = {};
        // game.players.forEach(_player => {
        for (const key in game.players) {
          const _player = game.players[key];
          payload.players[_player.playerId] = {
            handCount: _player.hand.length
          };
        }
        // });
        payload["userData"] = {};
        if (userProfileParse.size > 0) {
          payload["userData"] = userProfileParse.get(player.playerId);
        }
        await Network.SendByPlayerId(player.playerId, {
          method: Strings.MT_END_GAME,
          req: game.req,
          payload: payload
        }).then();
      }
    }
    // });
    game.state.isEnded = true;
    logger.debug(`GameCount : ${await GameManager.count()} (EndGame)`);

    return game;
  }
}

module.exports = EndGameCommand;
