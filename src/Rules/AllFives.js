const Draw = require("./Draw");
const DominoModel = require("../Models/DominoModel");
const logger = require("../Utils/logger");

class AllFives extends Draw {
  constructor(data) {
    super(data);
  }

  canPlaySelectedSide(targetDomino, dir) {
    const sideMapping = {
      Left: this.state.left,
      Right: this.state.right,
      Top: this.state.top,
      Down: this.state.down
    };

    const selectedSideNumber =
      dir in sideMapping ? sideMapping[dir] : this.state.down;
    return (
      targetDomino.left === selectedSideNumber ||
      targetDomino.right === selectedSideNumber
    );
  }

  updateGameStateSideNumber(domino, dir) {
    const isFirstMove = this.state.board.length === 0;
    const sideMapping = {
      Center: "center",
      Left: "left",
      Right: "right",
      Top: "top",
      Down: "down"
    };

    const side = dir in sideMapping ? sideMapping[dir] : undefined;
    this.isPlayedDomino = true;
    if (side) {
      // logger.debug("-----------------------------");
      // logger.debug("Domino   : %i, %i = isPair  : %s",domino.left,domino.right,this.isPair(domino));
      // logger.debug("1-centerDomino   : %i, %i = isPair  :
      // %s",this.state.centerDomino.left,this.state.centerDomino.right,this.isPair(this.state.centerDomino));
      if (side === "center" || isFirstMove) {
        this.state.leftDomino = domino;
        this.state.rightDomino = domino;
        this.state.topDomino = domino;
        this.state.downDomino = domino;
        this.state.centerDomino = domino;

        this.isPlayedLeftHead = false;
        this.isPlayedRightHead = false;
        this.isPlayedTopHead = false;
        this.isPlayedDownHead = false;
      } else if (side === "left") {
        if (this.isPair(domino) && !this.isPair(this.state.centerDomino)) {
          this.state.centerDomino = domino;
          this.isPlayedLeftHead = false;
          this.isPlayedRightHead = true;
        } else {
          this.isPlayedLeftHead = true;
        }
        this.state.leftDomino = domino;
      } else if (side === "right") {
        if (this.isPair(domino) && !this.isPair(this.state.centerDomino)) {
          this.state.centerDomino = domino;
          this.isPlayedRightHead = false;
          this.isPlayedLeftHead = true;
        } else {
          this.isPlayedRightHead = true;
        }
        this.state.rightDomino = domino;
      } else if (side === "top") {
        this.state.topDomino = domino;
        this.isPlayedTopHead = true;
      } else if (side === "down") {
        this.state.downDomino = domino;
        this.isPlayedDownHead = true;
      }
    }

    // logger.debug("2-centerDomino   : %i, %i = isPair  :
    // %s",this.state.centerDomino.left,this.state.centerDomino.right,this.isPair(this.state.centerDomino));
    // logger.debug("isPlayedLeftHead : %s", this.isPlayedLeftHead); logger.debug("isPlayedRightHead: %s",
    // this.isPlayedRightHead); logger.debug("isPlayedTopHead  : %s", this.isPlayedTopHead);
    // logger.debug("isPlayedDownHead : %s", this.isPlayedDownHead); logger.debug("-----------------------------");

    if (!this.state.isAddFirstPairDomino && this.isPair(domino)) {
      this.state.isAddFirstPairDomino = true;
      this.state.top = domino.left;
      this.state.down = domino.left;
      this.state.centerDomino = domino;
    }

    if (isFirstMove) {
      this.state.left = domino.left;
      this.state.right = domino.right;
    } else {
      if (side) {
        this.state[side] =
          domino.left === this.state[side] ? domino.right : domino.left;
      }
    }
  }

  isBlockGame(domino, playerId) {
    if (!this.players[playerId].hand.length) {
      return false;
    }

    const updateCounter = (value) => {
      this.dominoCounter[value] = (this.dominoCounter[value] || 0) + 1;
    };

    const [leftDomino, rightDomino] = domino;
    updateCounter(leftDomino);

    if (leftDomino !== rightDomino) {
      updateCounter(rightDomino);
    }

    const left = this.state.left;
    const right = this.state.right;
    const top = this.state.top;
    const down = this.state.down;

    const countLeft = this.dominoCounter[left];
    const countRight = this.dominoCounter[right];
    const countTop = this.dominoCounter[top];
    const countDown = this.dominoCounter[down];

    if (
      countLeft === 7 &&
      countRight === 7 &&
      countTop === 7 &&
      countDown === 7
    ) {
      this.state.isBlock = true;
      this.state.blockedId = playerId;

      return true;
    }

    // if ((this.state.moveCount >= 2) /*&&(this.state.set > 2)*/ ) {
    //   this.state.isBlock = true;
    //   this.state.blockedId = playerId;
    //   return true;
    // }

    return false;
  }

  canPlay(playerId) {
    const player = this.players[playerId];
    if (!player) {
      return false;
    }

    const isMatch = (value) =>
      value === this.state.left ||
      value === this.state.right ||
      value === this.state.top ||
      value === this.state.down ||
      value === -1;

    for (const domino of player.hand) {
      if (
        isMatch(domino[0]) ||
        isMatch(domino[1]) ||
        (this.isAddFirstPairDomino &&
          (isMatch(this.state.top) || isMatch(this.state.down)))
      ) {
        return true;
      }
    }

    return false;
  }

  canPlayWith(domino) {
    const { left, right, top, down } = this.state;
    const validEnds = [left, right, top, down, -1]; // مقادیر قابل قبول
    return validEnds.includes(domino[0]) || validEnds.includes(domino[1]);
  }

  resetState() {
    super.resetState();

    this.state.top = -1;
    this.state.down = -1;
    this.state.isAddFirstPairDomino = false;
    this.isPlayedDomino = false;
    this.isPlayedLeftHead = false;
    this.isPlayedRightHead = false;
    this.isPlayedTopHead = false;
    this.isPlayedDownHead = false;
    this.state.centerDomino = new DominoModel();
    this.state.leftDomino = new DominoModel();
    this.state.rightDomino = new DominoModel();
    this.state.topDomino = new DominoModel();
    this.state.downDomino = new DominoModel();
    this.state.centerDomino = new DominoModel();
  }

  addToWhichHead(domino) {
    const {
      left: leftGame,
      right: rightGame,
      top: topGame,
      down: downGame
    } = this.state;
    const [left, right] = domino;

    if (
      leftGame === -1 &&
      downGame === -1 &&
      rightGame === -1 &&
      topGame === -1
    ) {
      return "Center";
    }

    if (left === downGame || right === downGame) {
      return "Down";
    }

    if (left === rightGame || right === rightGame) {
      return "Right";
    }

    if (left === topGame || right === topGame) {
      return "Top";
    }

    if (left === leftGame || right === leftGame) {
      return "Left";
    }

    return null; // در صورت عدم تطابق، مقدار پیش‌فرض
  }

  getRandomDominoFromHand(playerId) {
    const { left, right, top, down } = this.state;
    const hand = this.players[playerId].hand;

    // فیلتر دومینوهای قابل بازی
    const canPlayDominoes = hand.filter(
      ([handLeft, handRight]) =>
        left === -1 ||
        right === -1 ||
        // top === -1 ||
        // down === -1 ||
        handLeft === left ||
        handRight === left ||
        handLeft === right ||
        handRight === right ||
        handLeft === top ||
        handRight === top ||
        handLeft === down ||
        handRight === down
    );

    // انتخاب دومینوی تصادفی یا بازگشت null
    return canPlayDominoes.length
      ? canPlayDominoes[Math.floor(Math.random() * canPlayDominoes.length)]
      : null;
  }

  updateScoreHeaderBoard(domino, directionAdd) {
    let _sumLeftValue = 0;
    let _sumRightValue = 0;
    let _sumTopValue = 0;
    let _sumDownValue = 0;
    let _sumCenterValue = 0;

    const isPlayedLeftHead = this.isPlayedLeftHead;
    const isPlayedRightHead = this.isPlayedRightHead;
    const isPlayedTopHead = this.isPlayedTopHead;
    const isPlayedDownHead = this.isPlayedDownHead;
    const isPlayedDomino =
      this.isPlayedDomino || this.state.historyBoard.length > 0;
    // const isPlayedDomino = ( isPlayedLeftHead || isPlayedRightHead || isPlayedTopHead || isPlayedDownHead ) || (
    // this.state.historyBoard.length > 1 ); //this.isPlayedDomino || ( this.state.historyBoard.length > 0 );

    const _leftHeadLastDomino = this.state.leftDomino;
    const _rightHeadLastDomino = this.state.rightDomino;
    const _topHeadLastDomino = this.state.topDomino;
    const _downHeadLastDomino = this.state.downDomino;
    const _centerDomino = this.state.centerDomino;

    const _leftHeadLastValue = this.state.left;
    const _rightHeadLastValue = this.state.right;
    const _topHeadLastValue = this.state.top;
    const _downHeadLastValue = this.state.down;

    let emptyHeadCount = 4;
    const leftDomino = domino.left;
    const rightDomino = domino.right;
    const multi = this.isPair(domino) ? 2 : 1;
    const leftDominoValue = leftDomino * multi;
    const rightDominoValue = rightDomino * multi;

    if (isPlayedTopHead /*&& (_centerDomino !==_topHeadLastDomino   )*/) {
      emptyHeadCount--;
    }
    if (isPlayedDownHead /*&& (_centerDomino !==_downHeadLastDomino  )*/) {
      emptyHeadCount--;
    }
    if (isPlayedLeftHead /*&& (_centerDomino !==_leftHeadLastDomino  )*/) {
      emptyHeadCount--;
    }
    if (isPlayedRightHead /*&& (_centerDomino !==_rightHeadLastDomino )*/) {
      emptyHeadCount--;
    }

    if (!_leftHeadLastDomino || !_rightHeadLastDomino) {
      return 0;
    }
    let leftValue = 0;
    let rightValue = 0;
    let topValue = 0;
    let downValue = 0;

    const calculateValuesForFourEmptyHeads = () => {
      let leftValue, rightValue;

      if (_centerDomino && this.isPair(_centerDomino)) {
        leftValue = rightValue = -1;
      } else {
        leftValue =
          (this.isPair(_leftHeadLastDomino) ? 2 : 1) * _leftHeadLastValue;
        rightValue =
          (this.isPair(_rightHeadLastDomino) ? 2 : 1) * _rightHeadLastValue;
      }
      const topValue = _topHeadLastValue;
      const downValue = _downHeadLastValue;

      return { leftValue, rightValue, topValue, downValue };
    };

    const calculateValuesForThreeEmptyHeads = () => {
      const hasTopOrDown = isPlayedTopHead || isPlayedDownHead;
      const hasLeftOrRight = isPlayedLeftHead || isPlayedRightHead;

      const leftValue =
        !isPlayedLeftHead && hasTopOrDown
          ? 0
          : (this.isPair(_leftHeadLastDomino) ? 2 : 1) * _leftHeadLastValue;

      const rightValue =
        !isPlayedRightHead && hasTopOrDown
          ? 0
          : (this.isPair(_rightHeadLastDomino) ? 2 : 1) * _rightHeadLastValue;

      const topValue =
        !_topHeadLastDomino || hasLeftOrRight
          ? 0
          : (this.isPair(_topHeadLastDomino) && isPlayedTopHead ? 2 : 1) *
            _topHeadLastValue;

      const downValue =
        !_downHeadLastDomino || hasLeftOrRight
          ? 0
          : (this.isPair(_downHeadLastDomino) && isPlayedDownHead ? 2 : 1) *
            _downHeadLastValue;

      return { leftValue, rightValue, topValue, downValue };
    };

    const calculateValuesForOtherCases = () => {
      const leftValue = !isPlayedLeftHead
        ? -1
        : (this.isPair(_leftHeadLastDomino) && isPlayedLeftHead ? 2 : 1) *
          _leftHeadLastValue;

      const rightValue = !isPlayedRightHead
        ? -1
        : (this.isPair(_rightHeadLastDomino) && isPlayedRightHead ? 2 : 1) *
          _rightHeadLastValue;

      const topValue = !isPlayedTopHead
        ? -1
        : (this.isPair(_topHeadLastDomino) && isPlayedTopHead ? 2 : 1) *
          _topHeadLastValue;

      const downValue = !isPlayedDownHead
        ? -1
        : (this.isPair(_downHeadLastDomino) && isPlayedDownHead ? 2 : 1) *
          _downHeadLastValue;

      return { leftValue, rightValue, topValue, downValue };
    };

    const calculateFinalScores = (
      leftDomino,
      leftDominoValue,
      rightDominoValue,
      leftValue,
      rightValue,
      topValue,
      downValue
    ) => {
      leftValue = Math.max(0, leftValue);
      rightValue = Math.max(0, rightValue);
      topValue = Math.max(0, topValue);
      downValue = Math.max(0, downValue);

      _sumLeftValue =
        (leftDomino === _leftHeadLastValue
          ? rightDominoValue
          : leftDominoValue) +
        rightValue +
        topValue +
        downValue;

      _sumRightValue =
        (leftDomino === _rightHeadLastValue
          ? rightDominoValue
          : leftDominoValue) +
        leftValue +
        topValue +
        downValue;

      _sumTopValue =
        (leftDomino === _topHeadLastValue
          ? rightDominoValue
          : leftDominoValue) +
        leftValue +
        rightValue +
        downValue;

      _sumDownValue =
        (leftDomino === _downHeadLastValue
          ? rightDominoValue
          : leftDominoValue) +
        leftValue +
        rightValue +
        topValue;
    };

    const calculateFinalScoresForThreeEmptyHeads = (
      leftDomino,
      leftDominoValue,
      rightDominoValue,
      leftValue,
      rightValue,
      topValue,
      downValue
    ) => {
      leftValue = Math.max(0, leftValue);
      rightValue = Math.max(0, rightValue);
      topValue = Math.max(0, topValue);
      downValue = Math.max(0, downValue);

      if (_centerDomino && !this.isPair(_centerDomino)) {
        calculateFinalScores(
          leftDomino,
          leftDominoValue,
          rightDominoValue,
          leftValue,
          rightValue,
          topValue,
          downValue
        );
      } else {
        if (isPlayedLeftHead) {
          _sumLeftValue =
            (leftDomino === _leftHeadLastValue
              ? rightDominoValue
              : leftDominoValue) + rightValue;
          _sumRightValue =
            (leftDomino === _rightHeadLastValue
              ? rightDominoValue
              : leftDominoValue) + leftValue;
          _sumTopValue =
            (leftDomino === _topHeadLastValue
              ? rightDominoValue
              : leftDominoValue) + leftValue;
          _sumDownValue =
            (leftDomino === _downHeadLastValue
              ? rightDominoValue
              : leftDominoValue) + leftValue;
        } else if (isPlayedRightHead) {
          _sumLeftValue =
            (leftDomino === _leftHeadLastValue
              ? rightDominoValue
              : leftDominoValue) + rightValue;
          _sumRightValue =
            (leftDomino === _rightHeadLastValue
              ? rightDominoValue
              : leftDominoValue) + leftValue;
          _sumTopValue =
            (leftDomino === _topHeadLastValue
              ? rightDominoValue
              : leftDominoValue) + rightValue;
          _sumDownValue =
            (leftDomino === _downHeadLastValue
              ? rightDominoValue
              : leftDominoValue) + rightValue;
        } else if (isPlayedTopHead) {
          _sumLeftValue =
            (leftDomino === _leftHeadLastValue
              ? rightDominoValue
              : leftDominoValue) + topValue;
          _sumRightValue =
            (leftDomino === _rightHeadLastValue
              ? rightDominoValue
              : leftDominoValue) + topValue;
          _sumTopValue =
            (leftDomino === _topHeadLastValue
              ? rightDominoValue
              : leftDominoValue) + downValue;
          _sumDownValue =
            (leftDomino === _downHeadLastValue
              ? rightDominoValue
              : leftDominoValue) + topValue;
        } else {
          _sumLeftValue =
            (leftDomino === _leftHeadLastValue
              ? rightDominoValue
              : leftDominoValue) + downValue;
          _sumRightValue =
            (leftDomino === _rightHeadLastValue
              ? rightDominoValue
              : leftDominoValue) + downValue;
          _sumTopValue =
            (leftDomino === _topHeadLastValue
              ? rightDominoValue
              : leftDominoValue) + downValue;
          _sumDownValue =
            (leftDomino === _downHeadLastValue
              ? rightDominoValue
              : leftDominoValue) + topValue;
        }
      }
    };

    if (!isPlayedDomino) {
      logger.debug("-0-");
      _sumCenterValue = leftDomino + rightDomino;
    } else if (emptyHeadCount === 4) {
      logger.debug("-4-");
      ({ leftValue, rightValue, topValue, downValue } =
        calculateValuesForFourEmptyHeads());
      calculateFinalScores(
        leftDomino,
        leftDominoValue,
        rightDominoValue,
        leftValue,
        rightValue,
        topValue,
        downValue
      );
    } else if (emptyHeadCount === 3) {
      logger.debug("-3-");
      ({ leftValue, rightValue, topValue, downValue } =
        calculateValuesForThreeEmptyHeads());
      calculateFinalScoresForThreeEmptyHeads(
        leftDomino,
        leftDominoValue,
        rightDominoValue,
        leftValue,
        rightValue,
        topValue,
        downValue
      );
    } else {
      logger.debug("-1-");
      ({ leftValue, rightValue, topValue, downValue } =
        calculateValuesForOtherCases());
      calculateFinalScores(
        leftDomino,
        leftDominoValue,
        rightDominoValue,
        leftValue,
        rightValue,
        topValue,
        downValue
      );
    }
    // if (_centerDomino.left === -1 && _centerDomino.right ===  -1) {
    //
    //     if (directionAdd === "Left") {
    //         _sumCenterValue = _sumLeftValue;
    //     }
    //     else if (directionAdd === "Right") {
    //         _sumCenterValue = _sumRightValue;
    //     }
    //
    // }

    let totalScore = 0;

    switch (directionAdd) {
      case "Left":
        totalScore = _sumLeftValue;
        break;
      case "Down":
        totalScore = _sumDownValue;
        break;
      case "Right":
        totalScore = _sumRightValue;
        break;
      case "Top":
        totalScore = _sumTopValue;
        break;
      case "Center":
        totalScore = _sumCenterValue;
        break;
      default:
        break;
    }

    // logger.debug("=======================================================");
    // logger.debug("direction        : %s", directionAdd);
    // logger.debug("Domino           : %i , %i", domino.left, domino.right);
    // logger.debug("Empty Head Count : %i", emptyHeadCount);
    //
    // logger.debug("isPlayedLeftHead : %s", isPlayedLeftHead);
    // logger.debug("isPlayedRightHead: %s", isPlayedRightHead);
    // logger.debug("isPlayedTopHead  : %s", isPlayedTopHead);
    // logger.debug("isPlayedDownHead : %s", isPlayedDownHead);
    //
    // logger.debug("_leftHeadLastValue: %i ,_rightHeadLastValue: %i ,_topHeadLastValue: %i ,_downHeadLastValue: %i",
    // _leftHeadLastValue, _rightHeadLastValue, _topHeadLastValue, _downHeadLastValue); logger.debug("
    // _sumLeftValue: %i ,     _sumRightValue: %i ,     _sumTopValue: %i ,     _sumDownValue: %i", _sumLeftValue,
    // _sumRightValue, _sumTopValue, _sumDownValue); logger.debug("         LeftValue: %i ,         RightValue: %i ,
    //      TopValue: %i ,         DownValue: %i", leftValue, rightValue, topValue, downValue);
    // logger.debug("CenterValue: %i ,%i", _centerDomino.left, _centerDomino.right); logger.debug("totalScore : %i",
    // totalScore);
    return totalScore;
  }

  updateScoreGroup(score, playerId) {
    const player = this.players[playerId];
    if (player) {
      const groupIndex = player.groupIndex;
      const group = this.groups[groupIndex];
      if (group) {
        group.score += score;
        group.totalScore += score;
        group.players.forEach((playerId) => {
          this.players[playerId].scores.push(score);
        });
      } else {
        logger.warn("Group with index not found.", { groupIndex });
      }
    } else {
      logger.warn("Player with ID not found.", { playerId });
    }
  }

  isPair(domino) {
    return (
      domino.left !== -1 && domino.right !== -1 && domino.left === domino.right
    );
    // return ( domino.left === domino.right );
  }

  isSetEnded() {
    const isGameOverByScore = () => {
      if (this.table.maxSet === 0) {
        if (this.groups[0].totalScore >= this.table.maxScore) {
          this.groups[0].isWinnerAllFives = true;
          return true;
        } else if (this.groups[1].totalScore >= this.table.maxScore) {
          this.groups[1].isWinnerAllFives = true;
          return true;
        }
      }
      return false;
    };

    return super.isSetEnded() || isGameOverByScore();
  }
}

module.exports = AllFives;
