"use strict";
const Strings = require("../Strings");
const Network = require("../Network");
const PlayerManager = require("../Base/Manager/PlayerManager");
const RoomManager = require("../Base/Manager/RoomManager");
const PlayerHandler = require("../Handler/PlayerHandler");
const { adminMessagesForPrivateChat, filterMode } = require("../Consts");
const { generateToken } = require("../Utils");

class JoinGameCommand {
  async execute(_payload) {
    const { playerId, game, player } = _payload;

    const payload = {};

    player.scores = [];

    payload.gameId = game.gameId;
    payload.objectId = game.objectId;
    payload.playerId = player.playerId;
    payload.roomId = game.roomId;
    payload.maxPlayer = game.maxPlayer;
    payload.handSize = game.handSize;
    payload.friendly = game.friendly || false;
    payload.maxTimer = game.maxTimer;
    payload.gameType = game.gameType;
    payload.delayTime = game.delayTime;
    payload.timer = game.timer;
    // payload.playerId = player.playerId;
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
    payload.hand = [];
    payload.players = {};
    payload.bank = [];
    payload.historyBoard = [];
    payload.board = [];
    payload.state = {};

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
    payload.state.bankSize = game.state.bankSize;

    const room = await RoomManager.get(game.roomId);

    payload.adminMessage = {};

    payload.adminMessage = adminMessagesForPrivateChat;
    payload.filter = filterMode;
    payload.voiceToken = await generateToken(player, room.roomId);
    if (room) {
      payload.chat = room.messages.slice(-10);
    }

    game.bank.forEach((domino) => {
      payload.bank.push([domino[0], domino[1], domino[2]]);
    });

    {
      Object.assign(player.extraData, {
        status: PlayerHandler.statusType.IN_GAME,
        gameId: game.gameId,
        query: "",
        key: "",
        matchId: ""
      });
      game.players[playerId].isJoin = true;
      game.players[playerId].status = PlayerHandler.statusType.IN_GAME;
    }
    await PlayerManager.update(playerId, player, "JoinGameCommand");

    for (const key in game.players) {
      const _player = game.players[key];
      let newHand = [];

      const isJoinGamePlayer = _player.playerId === player.playerId;

      if (isJoinGamePlayer) {
        newHand = _player.hand;
        payload.hand = newHand;
      } else {
        _player.hand.forEach((domino) => {
          newHand.push([-1, -1, domino[2]]);
        });
      }
      payload.players[_player.playerId] = {
        handCount: _player.hand.length,
        hand: newHand,
        profile: _player.profile,
        groupIndex: _player.groupIndex,
        indexOrder: game.state.orders.indexOf(_player.playerId),
        delayTime: _player.delayTime,
        timer: _player.timer,
        status: _player.status
      };
    }

    await Network.SendByConnectionId(playerId, {
      method: Strings.MT_JOIN_GAME,
      req: game.req,
      payload
    }).then();

    return game;
  }
}

module.exports = JoinGameCommand;
