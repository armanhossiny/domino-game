"use strict";

const Network = require("../Network");
const Strings = require("../Strings");
const { GameMode } = require("../Consts");
const { DominoAppConfigs } = require("../Consts");
const { broadcastAddState } = require("./CommandsFunctions");
const ShowBankCommand = require("./ShowBankCommand");
const EndSetCommand = require("./EndSetCommand");
const BlockGameCommand = require("./BlockGameCommand");
const Conductor = require("./Conductor");
const { ValidationError } = require("../Utils/CustomError");

class MoveCommand {
  async execute(_payload, game) {
    const { gameId, playerId, fromClient } = _payload;
    // game.state.moveCount = ( game.state?.moveCount ?? 0 ) + 1;
    // await checkSumBoard(game, `${ gameId }_Move_part_0`);

    //_payload.historyBoard = [];

    game.state.showBank = false;

    //Object.assign(_payload.historyBoard, game.historyBoard);
    const player = game.players[playerId];

    if (fromClient) {
      game.delayTime[playerId] = DominoAppConfigs.TURN_WAIT;
      player.delayTime = DominoAppConfigs.TURN_WAIT;
    }
    const state = game.state;
    const directionMap = {
      Center: "Center",
      Down: "Down",
      Left: "Left",
      Right: "Right",
      Top: "Top"
    };
    const dir = directionMap[_payload.dir] || "Top";

    // await updateActiveState({ game, player, ..._payload });

    const payload = {};
    payload.gameId = gameId;
    payload.info = {};
    payload.info = _payload;

    delete payload.info.gameId;
    delete payload.info.historyBoard;

    const _domino = _payload.domino;

    if (!_domino) {
      await Network.SendByPlayerId(playerId, {
        method: Strings.ST_ERROR,
        message: Strings.S_DOMINO_IS_NULL,
        payload: {
          gameId: gameId
        }
      }).then();

      throw new ValidationError(Strings.S_DOMINO_IS_NULL);
    }

    const targetDomino = {
      left: parseInt(_domino[0]),
      right: parseInt(_domino[1]),
      index: parseInt(_domino[2])
    };

    if (!game.hasInHand(player.hand, _domino)) {
      await Network.SendByPlayerId(playerId, {
        method: Strings.ST_ERROR,
        message: Strings.S_PLAYER_HAVE_NOT_DOMINO,
        payload: {
          gameId: gameId
        }
      });
      throw new ValidationError(Strings.S_PLAYER_HAVE_NOT_DOMINO);
    }

    const handDomino = game.removeDomino(player.hand, _domino);
    if (!handDomino) {
      await Network.SendByPlayerId(playerId, {
        method: Strings.ST_ERROR,
        message: Strings.S_DOMINO_IS_NULL,
        payload: {
          gameId: gameId
        }
      });

      throw new ValidationError(Strings.S_DOMINO_IS_NULL);
    }

    const canPlaySelectedSide = game.canPlaySelectedSide(targetDomino, dir);

    const isFirstMove = state.board.length === 0;
    if (!canPlaySelectedSide && !isFirstMove) {
      await Network.SendByPlayerId(playerId, {
        method: Strings.ST_ERROR,
        message: Strings.S_CAN_NOT_ADD_TO + dir,
        payload: {
          gameId: gameId
        }
      });

      throw new ValidationError(Strings.S_CAN_NOT_ADD_TO + dir);
    }

    const moveDomino = {
      playerId: playerId,
      _domino,
      dir,
      fromClient
    };

    //////////////////////////////////////////////////////////////////////////////
    const gameMode = game.gameType.gameMode;
    if (gameMode === GameMode.AllFives || gameMode === 2) {
      const score = game.updateScoreHeaderBoard(targetDomino, dir);

      //logger.debug("SumScore   : %i", score);
      if (score !== 0 && score % 5 === 0) {
        game.updateScoreGroup(score, playerId);
      }
    }
    //////////////////////////////////////////////////////////////////////////////

    game.historyBoard.push(moveDomino);
    state.historyBoard.push(moveDomino);
    game.lastPlayerMove = playerId;
    game.cycle = 0;

    game.updateGameStateSideNumber(targetDomino, dir);

    game.passCounter = 0;
    game.unshift(_domino);

    await this.sendNewState(game, payload, _domino);
  }

  async sendNewState(game, _payload, domino) {
    const gameId = _payload.gameId;
    const prePlayerId = _payload.info.playerId;

    _payload.info.delayTime = game.delayTime;
    _payload.info.timer = game.timer;
    _payload.groupsScore = [];
    for (const item of game.groups) {
      const groupScore = {
        index: item.index,
        score: item.score,
        totalScore: item.totalScore
      };
      _payload.groupsScore.push(groupScore);
    }

    const _isBlock = game.isBlockGame(domino, prePlayerId);
    const _isEndSet = game.isSetEnded();
    const _isEndSetByScore = game.isEndSetByScore();

    if (!_isBlock && !_isEndSet && !_isEndSetByScore) {
      game.changeOrder();
    }

    //TODO this filed required in client
    _payload.info.isLastDomino = !!_isEndSet;

    await broadcastAddState(
      game,
      {
        method: Strings.MT_MOVE,
        req: game.req,
        payload: _payload
      },
      prePlayerId,
      {
        domino: domino
      }
    );

    if (_isBlock && !_isEndSetByScore) {
      await Conductor.run(
        new BlockGameCommand(),
        { gameId: gameId, playerId: prePlayerId },
        game
      );
    }

    if (_isEndSet) {
      await Conductor.run(
        new EndSetCommand(),
        { gameId: gameId, playerId: prePlayerId },
        game
      );
      return;
    }

    const playerId = game.state.order;
    if (!game.canPlay(playerId)) {
      if (game.bank.length) {
        await Conductor.run(
          new ShowBankCommand(),
          { gameId: gameId, playerId: playerId },
          game
        );
      }
    }
  }
}

module.exports = MoveCommand;
