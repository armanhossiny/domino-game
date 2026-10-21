const ProfileModel = require("./ProfileModel");
const { DominoAppConfigs } = require("../Consts");

class PlayerClientModel {
  constructor(obj = {}) {
    const {
      playerId = undefined,
      isActive = true,
      inRoundPlayed = false,
      isPlayedWithDomino = false,
      isLeave = false,
      isJoin = false,
      delayTime = DominoAppConfigs.TURN_WAIT,
      timer = DominoAppConfigs.PLAYER_MAX_TIMER,
      status = undefined,
      scores = [],
      hand = [],
      profile = {}
    } = obj;

    this.playerId = playerId;
    this.isActive = isActive;
    this.inRoundPlayed = inRoundPlayed;
    this.isPlayedWithDomino = isPlayedWithDomino;
    this.isLeave = isLeave;
    this.isJoin = isJoin;
    this.delayTime = delayTime;
    this.timer = timer;
    this.status = status;
    this.scores = scores;
    this.hand = hand;

    this.profile = new ProfileModel(profile);
  }
}

module.exports = PlayerClientModel;
