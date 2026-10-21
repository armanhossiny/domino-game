class MatchMessageModel {
  constructor(obj = {}) {
    const {
      id = undefined,
      playerId = undefined,
      key = "",
      query = "",
      type = "",
      state = "",
      date = undefined
    } = obj;

    this.id = id;
    this.playerId = playerId;
    this.key = key;
    this.query = query;
    this.type = type;
    this.state = state;
    this.date = date;
  }
}

module.exports = MatchMessageModel;
