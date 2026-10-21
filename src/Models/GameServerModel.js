const GameTableInfoModel = require("./GameTableInfoModel");
const GameSateModel = require("./GameSateModel");
const { GameType } = require("../Consts");
const { DominoAppConfigs } = require("../Consts");

class GameServerModel {
  constructor(obj = {}) {
    const {
      objectId = undefined,
      gameId = undefined,
      req = 0,
      cycle = 0,
      wait = 20,
      maxPlayer = 0,
      handSize = 0,
      players = {},
      bank = [],
      groups = [],
      board = [],
      isPlayedDomino = false,
      isPlayedLeftHead = false,
      isPlayedRightHead = false,
      isPlayedTopHead = false,
      isPlayedDownHead = false,
      historyBoard = [],
      delayTime = {},
      timer = {},
      maxTimer = DominoAppConfigs.PLAYER_MAX_TIMER,
      oldDelayTime = {},
      passCounter = 0,
      status = "",
      lastPlayerMove = "",
      table = new GameTableInfoModel(),
      state = new GameSateModel(),
      gameType = new GameType(),
      payed = {},
      friendly = false,
      dominoCounter = {}
    } = obj;

    this.objectId = objectId;
    this.gameId = gameId;
    this.req = req;
    this.cycle = cycle;
    this.wait = wait;
    this.maxPlayer = maxPlayer;
    this.handSize = handSize;
    this.players = players;
    this.bank = bank;
    this.groups = groups;
    this.board = board;
    this.isPlayedDomino = isPlayedDomino;
    this.isPlayedLeftHead = isPlayedLeftHead;
    this.isPlayedRightHead = isPlayedRightHead;
    this.isPlayedTopHead = isPlayedTopHead;
    this.isPlayedDownHead = isPlayedDownHead;
    this.historyBoard = historyBoard;
    this.delayTime = delayTime;
    this.timer = timer;
    this.maxTimer = maxTimer;
    this.oldDelayTime = oldDelayTime;
    this.passCounter = passCounter;
    this.status = status;
    this.lastPlayerMove = lastPlayerMove;
    this.table = table;
    this.state = state;
    this.gameType = gameType;
    this.payed = payed;
    this.friendly = friendly;
    this.dominoCounter = dominoCounter;
  }
}

module.exports = GameServerModel;
