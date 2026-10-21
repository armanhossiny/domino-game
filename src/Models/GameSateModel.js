const DominoModel = require("./DominoModel");

class GameSateModel {
  constructor(obj = {}) {
    const {
      left = -1,
      right = -1,
      top = -1,
      down = -1,
      leftDomino = new DominoModel(),
      rightDomino = new DominoModel(),
      topDomino = new DominoModel(),
      downDomino = new DominoModel(),
      centerDomino = new DominoModel(),
      orders = [],
      order = "",
      board = [],
      historyBoard = [],
      bankSize = -1,
      set = 1,
      winnerRound = [],
      winnerGame = [],
      isEnded = false,
      isAddFirstPairDomino = false,
      isWaiting = true,
      waitingForRematchCounter = 60,
      autoCount = {},
      showBank = false,
      isBlock = false,
      blockedId = ""
      // moveCount= 0
    } = obj;

    this.left = left;
    this.right = right;
    this.top = top;
    this.down = down;
    this.leftDomino = leftDomino;
    this.rightDomino = rightDomino;
    this.topDomino = topDomino;
    this.downDomino = downDomino;
    this.centerDomino = centerDomino;
    this.orders = orders;
    this.order = order;

    this.board = board;
    this.historyBoard = historyBoard;
    this.bankSize = bankSize;
    this.set = set;
    this.winnerRound = winnerRound;

    this.winnerGame = winnerGame;
    this.isEnded = isEnded;
    this.isAddFirstPairDomino = isAddFirstPairDomino;
    this.isWaiting = isWaiting;
    this.waitingForRematchCounter = waitingForRematchCounter;
    this.autoCount = autoCount;
    this.showBank = showBank;
    this.isBlock = isBlock;
    this.blockedId = blockedId;
    // this.moveCount = moveCount;
  }
}

module.exports = GameSateModel;
