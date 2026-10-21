class GroupModel {
  constructor(obj = {}) {
    const {
      index = 0,
      isActive = true,
      isJoin = false,
      isLeave = false,
      isPlayedWithDomino = false,
      inRoundPlayed = false,
      players = [],
      score = 0,
      totalScore = 0,
      isWinnerAllFives = false,
      isEqualGame = false,
      isWinnerGame = false,
      isWinnerRound = false,
      leave = false
      // isGameWinner = false, // old version
      // isSetWinner = false, // old version
    } = obj;

    this.index = index;
    this.isActive = isActive;
    this.isJoin = isJoin;
    this.isLeave = isLeave;
    this.isPlayedWithDomino = isPlayedWithDomino;
    this.inRoundPlayed = inRoundPlayed;
    this.players = players;
    this.score = score;
    this.totalScore = totalScore;
    this.isWinnerAllFives = isWinnerAllFives;
    this.isEqualGame = isEqualGame;
    this.isWinnerGame = isWinnerGame;
    this.isWinnerRound = isWinnerRound;
    this.leave = leave;
    // this.isGameWinner = isGameWinner; // old version
    // this.isSetWinner = isSetWinner; // old version
  }
}

// Object.freeze(GroupModel);
module.exports = GroupModel;
