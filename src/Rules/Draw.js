const { PlayerStatusType, GameMode } = require("../Consts");
const Chance = require("chance");
const { GameServerModel } = require("../Models");
const logger = require("../Utils/logger");
const chance = new Chance();

class Draw extends GameServerModel {
  constructor(data) {
    super();
    Object.assign(this, data);
  }

  canPlaySelectedSide(targetDomino, dir) {
    const sideMapping = {
      Left: this.state.left,
      Right: this.state.right
    };

    const selectedSideNumber =
      dir in sideMapping ? sideMapping[dir] : this.state.right;

    return (
      targetDomino.left === selectedSideNumber ||
      targetDomino.right === selectedSideNumber
    );
  }

  updateGameStateSideNumber(domino, dir) {
    const isFirstMove = this.state.board.length === 0;

    if (isFirstMove) {
      this.state.left = domino.left;
      this.state.right = domino.right;
    } else {
      const sideMapping = {
        Left: "left",
        Right: "right"
      };

      const side = dir in sideMapping ? sideMapping[dir] : undefined;
      if (side) {
        this.state[side] =
          domino.left === this.state[side] ? domino.right : domino.left;
      }
    }
  }

  unshift(_domino) {
    this.state.board.unshift(_domino);
  }

  changeOrder() {
    const order = this.state.order;
    const orders = this.state.orders;
    let index = orders.indexOf(order);
    index++;
    if (index >= orders.length) {
      index = 0;
    }
    this.state.order = this.state.orders[index];
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
    const countLeft = this.dominoCounter[left];
    const countRight = this.dominoCounter[right];

    if (countLeft === 7 && countRight === 7) {
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

  isSetEnded() {
    logger.debug("checkIsLeave");
    // TODO: Check heap
    if (this.state.isBlock) {
      return true;
    }

    const checkGroupStatus = (group) => {
      const [player1, player2] = group.players.map(
        (id) => this.players[id].status
      );
      return (
        (player1 === PlayerStatusType.LEAVE_GAME &&
          player2 === PlayerStatusType.LEAVE_GAME) ||
        (player1 === PlayerStatusType.NOT_PLAYED &&
          player2 === PlayerStatusType.NOT_PLAYED)
      );
    };

    if (this.maxPlayer === 4) {
      for (const group of this.groups) {
        if (checkGroupStatus(group)) {
          group.isLeave = true;
          group.leave = true;
          return true;
        }
      }
    } else {
      for (const group of this.groups) {
        const playerStatus = this.players[group.players[0]].status;
        if (
          playerStatus === PlayerStatusType.LEAVE_GAME ||
          playerStatus === PlayerStatusType.NOT_PLAYED
        ) {
          group.isLeave = true;
          group.leave = true;
          return true;
        }
      }
    }

    for (const player of Object.values(this.players)) {
      if (!player.hand.length) {
        return true;
      }
    }

    return this.passCounter >= Object.keys(this.players).length - 1;
  }

  canPlay(playerId) {
    const player = this.players[playerId];
    if (!player) {
      return false;
    }

    const isMatch = (value) =>
      value === this.state.left || value === this.state.right || value === -1;

    for (const domino of player.hand) {
      if (isMatch(domino[0]) || isMatch(domino[1])) {
        return true;
      }
    }

    return false;
  }

  sumScore(player) {
    return player.hand.reduce(
      (sum, domino) => sum + parseInt(domino[0]) + parseInt(domino[1]),
      0
    );
  }

  updateScore() {
    const resetGroupState = (group) => {
      group.isActive = false;
      group.isJoin = false;
      group.isLeave = true;
      group.inRoundPlayed = false;
      group.isPlayedWithDomino = false;
      group.score = 0;
      group.isBlock = false;
    };

    const calculateGroupScores = (group, addLastDominoFlag, minScore) => {
      let totalScore = 0;
      group.players.forEach((playerId) => {
        const player = this.players[playerId];
        group.isActive ||= player.isActive;
        group.isJoin ||= player.isJoin;
        group.isLeave &&= player.isLeave;
        group.inRoundPlayed = true; //||= player.inRoundPlayed;
        group.isPlayedWithDomino = true; //||= player.isPlayedWithDomino;

        const sum = this.sumScore(player);
        logger.debug(`playerId :  ${playerId} -  ${sum}`);
        totalScore += sum;
        minScore = minScore === -1 ? sum : Math.min(minScore, sum);
        if (player.hand.length === 0) {
          addLastDominoFlag = true;
        }
      });

      logger.debug(`group : ${group.index} -  ${totalScore}`);
      logger.debug("=====================================");
      return { totalScore, minScore, addLastDominoFlag };
    };

    const setWinner = (winnerGroup, loserGroup, winnerScore, loserScore) => {
      winnerGroup.isWinnerRound = true;
      winnerGroup.score = winnerScore;
      winnerGroup.totalScore += winnerScore;
      loserGroup.score = loserScore;
      loserGroup.totalScore += 0;
      this.state.order = this.lastPlayerMove.valueOf();
    };

    // Reset all players' scores
    for (const player of Object.values(this.players)) {
      player.score = 0;
      const sum = this.sumScore(player);
      player.score += sum;
      player.scores.push(sum);
      player.sumScore = (player.sumScore || 0) + sum;
    }

    // Reset group states
    resetGroupState(this.groups[0]);
    resetGroupState(this.groups[1]);

    // Calculate scores for groups
    let addLastDominoG1 = false,
      addLastDominoG2 = false,
      minScore_0 = -1,
      minScore_1 = -1;

    const group0 = calculateGroupScores(
      this.groups[0],
      addLastDominoG1,
      minScore_0
    );
    const group1 = calculateGroupScores(
      this.groups[1],
      addLastDominoG2,
      minScore_1
    );
    addLastDominoG1 = group0.addLastDominoFlag;
    addLastDominoG2 = group1.addLastDominoFlag;

    const gameMode = this.gameType.gameMode;
    if (gameMode === GameMode.AllFives || gameMode === 2) {
      if (this.groups[0].isWinnerAllFives) {
        addLastDominoG1 = true;
      } else if (this.groups[1].isWinnerAllFives) {
        addLastDominoG2 = true;
      }
    }
    // if (this.state.moveCount === 2) {
    //   group0.minScore = 0;
    //   group1.minScore = 0;
    // }

    minScore_0 = group0.minScore;
    minScore_1 = group1.minScore;
    // Update state based on conditions
    if (
      this.state.isBlock &&
      !this.groups[0].isWinnerAllFives &&
      !this.groups[1].isWinnerAllFives
    ) {
      if (this.maxPlayer === 4) {
        const blockGroup = this.groups[0].players.includes(this.state.blockedId)
          ? this.groups[0]
          : this.groups[1];
        blockGroup.isBlock = true;
      } else {
        const blockGroup =
          this.groups[0].players[0] === this.state.blockedId
            ? this.groups[0]
            : this.groups[1];
        blockGroup.isBlock = true;
      }
    }

    this.passCounter = 0;
    this.state.winnerRound = [];
    this.state.winnerSet = [];
    this.groups[0].isEqual = false;
    this.groups[1].isEqual = false;
    this.groups[0].isWinnerRound = false;
    this.groups[1].isWinnerRound = false;

    if (!this.groups[0].isLeave && this.groups[1].isLeave) {
      setWinner(this.groups[0], this.groups[1], group1.totalScore, 0);
    } else if (!this.groups[1].isLeave && this.groups[0].isLeave) {
      setWinner(this.groups[1], this.groups[0], group0.totalScore, 0);
    } else if (addLastDominoG1 || addLastDominoG2) {
      if (addLastDominoG2) {
        setWinner(this.groups[1], this.groups[0], group0.totalScore, 0);
      } else {
        setWinner(this.groups[0], this.groups[1], group1.totalScore, 0);
      }
    } else if (this.state.isBlock) {
      if (minScore_0 > minScore_1) {
        setWinner(this.groups[1], this.groups[0], group0.totalScore, 0);
      } else if (minScore_0 < minScore_1) {
        setWinner(this.groups[0], this.groups[1], group1.totalScore, 0);
      } else {
        this.state.order = this.lastPlayerMove.valueOf();
        this.groups[0].isEqual = true;
        this.groups[1].isEqual = true;
      }
    } else {
      if (group0.totalScore > group1.totalScore) {
        setWinner(this.groups[1], this.groups[0], group0.totalScore, 0);
      } else if (group0.totalScore < group1.totalScore) {
        setWinner(this.groups[0], this.groups[1], group1.totalScore, 0);
      } else {
        this.groups[0].isEqual = true;
        this.groups[1].isEqual = true;
      }
    }

    // Determine round winner
    if (this.groups[0].isWinnerRound) {
      this.state.winnerRound = [...this.groups[0].players];
    } else if (this.groups[1].isWinnerRound) {
      this.state.winnerRound = [...this.groups[1].players];
    }

    this.state.winnerSet = this.state.winnerRound;
    this.lastPlayerMove = "";

    return this;
  }

  isEndGame = function () {
    const markGameAsEnded = () => {
      this.state.isEnded = true;
      return true;
    };

    const isGroupInactive = (group) => {
      return !group.inRoundPlayed || group.isLeave;
    };

    const arePlayersInactive = (players) => {
      const [player1, player2] = players;
      const playerStatuses = [
        PlayerStatusType.LEAVE_GAME,
        PlayerStatusType.NOT_PLAYED
      ];
      return (
        playerStatuses.includes(this.players[player1].status) &&
        playerStatuses.includes(this.players[player2].status)
      );
    };

    const isGameOverByScore = () => {
      return (
        (this.table.maxSet !== 0 && this.table.maxSet <= this.state.set) ||
        (this.table.maxSet === 0 &&
          (this.groups[0].totalScore >= this.table.maxScore ||
            this.groups[1].totalScore >= this.table.maxScore))
      );
    };

    // Check group and player states
    if (this.maxPlayer === 4) {
      if (isGroupInactive(this.groups[0]) || isGroupInactive(this.groups[1])) {
        return markGameAsEnded();
      }
      if (
        arePlayersInactive(this.groups[0].players) ||
        arePlayersInactive(this.groups[1].players)
      ) {
        return markGameAsEnded();
      }
    } else {
      if (isGroupInactive(this.groups[0]) || isGroupInactive(this.groups[1])) {
        return markGameAsEnded();
      }
      if (
        [PlayerStatusType.LEAVE_GAME, PlayerStatusType.NOT_PLAYED].includes(
          this.players[this.groups[0].players[0]].status
        ) ||
        [PlayerStatusType.LEAVE_GAME, PlayerStatusType.NOT_PLAYED].includes(
          this.players[this.groups[1].players[0]].status
        )
      ) {
        return markGameAsEnded();
      }
    }

    // Check global endgame conditions
    if (
      isGameOverByScore() ||
      this.isEnded ||
      this.state.isEnded ||
      this.groups[0].leave ||
      this.groups[1].leave
    ) {
      return markGameAsEnded();
    }

    return false;
  };

  canPlayWith(domino) {
    const { left, right } = this.state;
    const validEnds = [left, right, -1]; // مقادیر قابل قبول

    return validEnds.includes(domino[0]) || validEnds.includes(domino[1]);
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = chance.integer({ min: 0, max: i });
      [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
  }

  initBank() {
    this.bank = [];
    let index = -1;
    for (let i = 0; i < 7; i++) {
      for (let j = i; j < 7; j++) {
        index++;
        this.bank.push([i, j, index]);
      }
    }
    this.shuffleArray(this.bank);
  }

  //TODO
  // - درحالت قبات فقط براساس امتیازات برنده مشخص میشه
  // - در حالت دومینو تیمی که آخرین مهره را گذاشته حتی با وجود داشتن بیشترین امتیاز هم تیمیمیش باز آن تیم برنده هستند
  // - حالت مساوی فقط در حالت قبات مشخص کننده اس
  setWinnerGame() {
    // Reset group and player states
    const resetGroupState = (group) => {
      group.isWinnerGame = false;
      group.isEqualGame = false;
      group.isWinnerAllFives = false;
    };

    const resetPlayerState = (players) => {
      players.forEach((playerId) => {
        this.players[playerId].isWinnerGame = false;
        this.players[playerId].isEqualGame = false;
      });
    };

    [this.groups[0], this.groups[1]].forEach((group) => {
      resetGroupState(group);
      resetPlayerState(group.players);
    });

    // Determine the winner
    const g0 = this.groups[0];
    const g1 = this.groups[1];
    const state = this.state;

    state.winnerGame = [];

    if (g1.isLeave) {
      g0.isWinnerGame = true;
    } else if (g0.isLeave) {
      g1.isWinnerGame = true;
    } else if (
      !g0.inRoundPlayed &&
      g0.isJoin &&
      !g1.inRoundPlayed &&
      g1.isJoin
    ) {
      g0.isEqualGame = g1.isEqualGame = true;
    } else if (!g1.inRoundPlayed) {
      g0.isWinnerGame = true;
    } else if (!g0.inRoundPlayed) {
      g1.isWinnerGame = true;
    } else if (g0.totalScore > g1.totalScore) {
      g0.isWinnerGame = true;
    } else if (g0.totalScore < g1.totalScore) {
      g1.isWinnerGame = true;
    } else {
      g0.isEqualGame = g1.isEqualGame = true;
    }

    // Update winnerGame and player states
    const updateWinnerState = (group) => {
      group.players.forEach((playerId) => {
        this.players[playerId].isWinnerGame = group.isWinnerGame;
        this.players[playerId].isEqualGame = group.isEqualGame;
        if (group.isWinnerGame) {
          state.winnerGame.push(playerId);
        }
      });
    };

    [g0, g1].forEach(updateWinnerState);
  }

  getListDominoFromBank() {
    const dominoList = [];
    for (let i = 0; i < this.bank.length; i++) {
      const domino = this.bank.pop();
      this.state.bankSize = this.bank.length;

      dominoList.push(domino);

      if (this.canPlayWith(domino)) {
        return dominoList;
      }
    }

    return dominoList;
  }

  resetState() {
    if (this.state.set) {
      this.state.set += 1;
    } else {
      this.state.set = 0;
      this.state.set += 1;
    }
    this.historyBoard = [];
    this.dominoCounter = {};
    this.state.historyBoard = [];
    this.state.board = [];
    this.state.left = -1;
    this.state.right = -1;
    this.state.showBank = false;
    this.state.isBlock = false;
    this.state.blockedId = "";
    this.state.kingSet = "";
    this.state.bankSize = this.bank.length;
  }

  initStateOrders() {
    let indexOrder = 0;

    for (const key in this.players) {
      const player = this.players[key];

      // بررسی اگر بازیکن قبلاً در `orders` وجود دارد
      const playerIndex = this.state.orders.indexOf(player.playerId);

      if (playerIndex === -1) {
        // پیدا کردن اولین موقعیت خالی در `orders`
        const emptyIndex = this.state.orders.indexOf("");
        if (emptyIndex !== -1) {
          this.state.orders[emptyIndex] = player.playerId;
          player.indexOrder = emptyIndex;
        } else {
          // اضافه کردن بازیکن به انتهای `orders` اگر موقعیت خالی نباشد
          this.state.orders.push(player.playerId);
          player.indexOrder = indexOrder++;
        }
      } else {
        // بازیکن قبلاً در `orders` است
        player.indexOrder = playerIndex;
      }
    }
  }

  initWhoStartTheGame() {
    let maxPair = -1;
    let maxDots = -1;
    let pairStarter = null;
    let dotStarter = null;

    // بررسی بازیکنان و دامینوها
    Object.values(this.players).forEach((player) => {
      player.hand.forEach((domino) => {
        const [left, right] = domino.map(Number);
        const totalDots = left + right;

        // به‌روزرسانی بازیکن با بیشترین جفت
        if (left === right && left > maxPair) {
          maxPair = left;
          pairStarter = player.playerId;
        }

        // به‌روزرسانی بازیکن با بیشترین تعداد نقاط
        if (totalDots > maxDots) {
          maxDots = totalDots;
          dotStarter = player.playerId;
        }
      });
    });

    // تعیین ترتیب شروع بازی
    if (pairStarter) {
      this.state.order = pairStarter;
    } else if (dotStarter) {
      this.state.order = dotStarter;
    } else {
      // انتخاب تصادفی در صورت نبودن بازیکن مشخص
      const playersArray = Object.keys(this.players);
      const randomIndex = Math.floor(Math.random() * playersArray.length);
      this.state.order = this.state.orders[randomIndex];
    }

    // تعیین پادشاه مجموعه
    this.state.kingSet = this.state.order;
  }

  removeDomino(hand, domino) {
    const [left, right] = domino.map(Number);

    const index = hand.findIndex(([handLeft, handRight]) => {
      handLeft = parseInt(handLeft);
      handRight = parseInt(handRight);
      return (
        (left === handLeft && right === handRight) ||
        (right === handLeft && left === handRight)
      );
    });

    if (index !== -1) {
      return hand.splice(index, 1)[0];
    }

    return null;
  }

  hasInHand(hand, domino) {
    const [left, right] = domino.map(Number);

    return hand.some(([handLeft, handRight]) => {
      handLeft = parseInt(handLeft);
      handRight = parseInt(handRight);
      return (
        (left === handLeft && right === handRight) ||
        (right === handLeft && left === handRight)
      );
    });
  }

  addToWhichHead(domino) {
    const { left: leftGame, right: rightGame } = this.state;
    const [left, right] = domino;

    if (leftGame === -1 || rightGame === -1) {
      return "Center";
    }

    if (left === rightGame || right === rightGame) {
      return "Right";
    }

    if (left === leftGame || right === leftGame) {
      return "Left";
    }

    return null; // در صورت عدم تطابق، مقدار پیش‌فرض
  }

  getDominoFromBank() {
    const domino = this.bank.pop();
    this.state.bankSize = this.bank.length;
    return domino;
  }

  getRandomDominoFromHand(playerId) {
    const { left, right } = this.state;
    const hand = this.players[playerId].hand;

    // فیلتر دومینوهای قابل بازی
    const canPlayDominoes = hand.filter(
      ([handLeft, handRight]) =>
        left === -1 ||
        right === -1 ||
        handLeft === left ||
        handRight === left ||
        handLeft === right ||
        handRight === right
    );

    // انتخاب دومینوی تصادفی یا بازگشت null
    return canPlayDominoes.length
      ? canPlayDominoes[Math.floor(Math.random() * canPlayDominoes.length)]
      : null;
  }

  getHandFromBank() {
    const hand = [];
    for (let i = 0; i < this.handSize; i++) {
      const domino = this.getDominoFromBank();
      hand.push(domino);
    }

    return hand;
  }

  isGreaterPairCountThenMax(hand) {
    const maxPair = 3;
    const count = hand.filter(([left, right]) => left === right).length;
    return count > maxPair;
  }

  isOneTypeDominoGreaterThenMax(hand) {
    const side = {};
    const maxOnceType = 4;

    hand.forEach(([left, right]) => {
      side[left] = (side[left] || 0) + 1;
      side[right] = (side[right] || 0) + 1;
    });

    for (const key in side) {
      if (side[key] > maxOnceType) {
        return true;
      }
    }

    return false;
  }

  initPlayersHand() {
    const maxRepeat = 15;

    for (let i = 1; i <= maxRepeat; i++) {
      let initAgain = false;

      // فراخوانی فقط یک‌بار برای initBank
      this.initBank();

      // بررسی دست بازیکنان
      for (const key in this.players) {
        const player = this.players[key];
        player.inRoundPlayed = false;
        player.isPlayedWithDomino = false;
        player.hand = this.getHandFromBank();

        if (
          this.isGreaterPairCountThenMax(player.hand) ||
          this.isOneTypeDominoGreaterThenMax(player.hand)
        ) {
          initAgain = true;
        }
      }

      // اگر دست‌ها بهینه شد، تمام می‌شود
      if (!initAgain) {
        return;
      }
    }
  }

  resetGame() {
    //TODO transfer following code to GameManager
    this.historyBoard = [];
    this.initPlayersHand(this.handSize);
    this.resetState();
  }

  isEndSetByScore() {
    const { maxSet, maxScore } = this.table;
    const [group1, group2] = this.groups;

    return (
      maxSet === 0 &&
      (group1.totalScore >= maxScore || group2.totalScore >= maxScore)
    );
  }
}

module.exports = Draw;
