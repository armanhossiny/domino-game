"use strict";
const Strings = require("../Strings");
const Network = require("../Network");
const RoomManager = require("../Base/Manager/RoomManager");
const { PlayerManager } = require("../Base/Manager");
const { generateToken } = require("../Utils");

class ReJoinGameCommand {
  async execute(_payload, game) {
    const { playerId, player } = _payload;

    const playerInGame = game.players[playerId];

    const payload = {};

    playerInGame.scores = [];

    payload.gameId = game.gameId;
    payload.objectId = game.objectId;
    payload.playerId = playerInGame.playerId;
    payload.roomId = game.roomId;
    payload.maxPlayer = game.maxPlayer;
    payload.friendly = game.friendly || false;
    payload.gameType = game.gameType;
    payload.delayTime = game.delayTime;
    payload.timer = game.timer;
    payload.groups = [];
    payload.groups = game.groups;
    for (const group of payload.groups) {
      delete group.isActive;
      delete group.isJoin;
      delete group.isLeave;
      delete group.isPlayedWithDomino;
      delete group.inRoundPlayed;
      delete group.isWinnerAllFives;
      delete group.isEqualGame;
      delete group.leave;
    }
    payload.table = game.table;
    payload.handSize = game.handSize;
    payload.hand = playerInGame.hand;
    payload.players = {};
    payload.bank = [];
    payload.historyBoard = [];
    payload.board = [];
    payload.state = {};

    payload.maxTimer = game.maxTimer;
    const autoCount = {};
    // game.state.autoCount.forEach((value, key) => {
    for (const key in game.state.autoCount) {
      autoCount[key] = game.state.autoCount[key];
    }
    // });
    payload.state.autoCount = {};

    payload.state.showBank = game.state.showBank;

    Object.assign(payload.state, game.state);
    Object.assign(payload.historyBoard, game.historyBoard);

    delete payload.state.leftDomino;
    delete payload.state.rightDomino;
    delete payload.state.topDomino;
    delete payload.state.downDomino;
    delete payload.state.centerDomino;
    delete payload.state.historyBoard;
    delete payload.state.isEnded;
    delete payload.state.isAddFirstPairDomino;
    delete payload.state.isWaiting;

    delete payload.state.waitingForRematchCounter;
    delete payload.state.winnerSet;

    payload.chat = [];

    const room = await RoomManager.get(game.roomId);
    // payload.voiceToken = room?.voiceTokens[playerId] || "";
    // const player = await PlayerManager.get(playerId);
    payload.voiceToken = await generateToken(player, room.roomId);

    if (room) {
      payload.chat = room.messages.slice(-10);
    }
    payload.state.bankSize = game.state.bankSize;

    game.bank.forEach((domino) => {
      payload.bank.push([domino[0], domino[1], domino[2]]);
    });

    // game.players.forEach(_player => {
    for (const key in game.players) {
      const _player = game.players[key];
      if (_player.playerId === playerInGame.playerId) {
        payload.hand = _player.hand;
        payload.players[_player.playerId] = {
          handCount: _player.hand.length,
          hand: _player.hand,
          profile: _player.profile,
          groupIndex: _player.groupIndex,
          indexOrder: game.state.orders.indexOf(_player.playerId),
          delayTime: _player.delayTime,
          timer: game.timer[_player.playerId],
          status: _player.status
        };
      } else {
        const newHand = [];
        _player.hand.forEach((domino) => {
          newHand.push([-1, -1, domino[2]]);
        });
        payload.players[_player.playerId] = {
          handCount: _player.hand.length,
          hand: newHand,
          profile: _player.profile,
          groupIndex: _player.groupIndex,
          indexOrder: game.state.orders.indexOf(_player.playerId),
          delayTime: _player.delayTime,
          timer: game.timer[_player.playerId],
          status: _player.status
        };
      }
    }

    await Network.SendByPlayerId(playerInGame.playerId, {
      method: Strings.MT_REJOIN_GAME,
      req: game.req,
      payload
    }).then();

    // game.players.forEach(_player => {
    for (const key in game.players) {
      const _player = game.players[key];
      if (!_player.isLeave) {
        if (_player.playerId !== playerInGame.playerId) {
          const payload = {};

          payload.gameId = game.gameId;
          payload.playerId = playerInGame.playerId;
          await Network.SendByPlayerId(_player.playerId, {
            method: Strings.MT_REJOINED_PLAYER_TO_GAME,
            req: game.req,

            payload
          }).then();
        }
      }
    }
    // });

    return game;
  }
}

module.exports = ReJoinGameCommand;
