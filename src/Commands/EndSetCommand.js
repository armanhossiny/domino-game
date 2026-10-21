"use strict";
const Conductor = require("./Conductor");
const { DominoAppConfigs } = require("../Consts");
const Network = require("../Network");
const EndGameCommand = require("./EndGameCommand");
const Strings = require("../Strings");
const Core = require("../Core");
const GameManager = require("../Base/Manager/GameManager");

class EndSetCommand {
  async execute(_payload, game) {
    const { gameId, playerId } = _payload;
    game.req++;
    game.updateScore();

    if (game.isEndGame()) {
      game.state.isEnded = true;
      await Conductor.run(new EndGameCommand(), { gameId, playerId }, game);
      await GameManager.set("EndSetCommand", gameId, game);
    } else {
      // اطلاعات عمومی که برای همه بازیکنان یکسان است (قبل از حلقه محاسبه می‌شود) f
      const commonInfo = {
        players: {},
        winnerRound: game.state.winnerRound,
        winnerSet: game.state.winnerRound, // طبق کد قدیمی شما
        order: game.state.order
      };

      // محاسبه اطلاعات عمومی بازیکنان (امتیازات و تعداد کارت)
      for (const key in game.players) {
        const _player = game.players[key];
        commonInfo.players[_player.playerId] = {
          score: _player.score,
          sumScore: _player.sumScore,
          scores: _player.scores,
          handCount: _player.hand.length,
          hand: _player.hand
        };
      }

      game.resetGame();
      game.state.kingSet = game.state.order;
      // تبدیل بانک به آرایه ساده برای ارسال
      const bankPayload = [];
      game.bank.forEach((domino) => {
        bankPayload.push([domino[0], domino[1], domino[2]]);
      });

      // ارسال اطلاعات به هر بازیکن
      for (const key in game.players) {
        const player = game.players[key];

        // ساخت یک پیام اختصاصی برای این بازیکن خاص
        const playerPayload = {
          info: commonInfo, // ارسال اطلاعات محاسبه شده مشترک
          bank: bankPayload,
          state: {},
          gameId: game.gameId,
          groups: game.groups,
          hand: player.hand,
          players: {}
        };

        // کپی کردن وضعیت بازی
        Object.assign(playerPayload.state, game.state);

        // پر کردن دست بازیکنان برای این گیرنده خاص
        // توجه: نام متغیر حلقه داخلی تغییر کرده است
        for (const otherKey in game.players) {
          const _player = game.players[otherKey];

          if (_player.playerId === player.playerId) {
            // خود بازیکن: دست کامل را می‌بیند
            playerPayload.players[_player.playerId] = {
              handCount: _player.hand.length,
              hand: _player.hand,
              playerId: _player.playerId,
              groupIndex: _player.groupIndex,
              indexOrder: game.state.orders.indexOf(_player.playerId)
            };
          } else {
            // حریفان: دست مخفی شده را می‌بینند
            const newHand = [];
            _player.hand.forEach((domino) => {
              newHand.push([-1, -1, domino[2]]);
            });
            playerPayload.players[_player.playerId] = {
              handCount: _player.hand.length,
              hand: newHand,
              playerId: _player.playerId,
              groupIndex: _player.groupIndex,
              indexOrder: game.state.orders.indexOf(_player.playerId)
            };
          }
        }

        // ارسال پیام اختصاصی به بازیکن
        await Network.SendByPlayerId(player.playerId, {
          method: Strings.MT_END_SET,
          req: game.req,
          payload: playerPayload
        });
      }

      game.state.isWaiting = true;
      game.wait = DominoAppConfigs.END_SET_WAIT;
    }
    return game;
  }
}

module.exports = EndSetCommand;
