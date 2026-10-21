"use strict";
const Utils = require("../Utils");

class MatchModel {
  constructor(obj = {}) {
    const { maxPlayer = 0, presences = [], matchId = Utils.guid() } = obj;

    this.createdAt = Date.now();
    this.maxPlayer = maxPlayer;
    this.presences = presences;
    this.matchId = matchId;
    this.segment = null;

    for (let count = 0; count < this.maxPlayer; count++) {
      this.presences.push(null);
    }
  }
}

module.exports = MatchModel;
