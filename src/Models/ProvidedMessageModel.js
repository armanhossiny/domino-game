class ProvidedMessageModel {
  constructor(obj = {}) {
    const {
      playerId = undefined,
      key = "",
      name = "",
      type = "",
      financial = false,
      date = undefined
    } = obj;

    this.playerId = playerId;
    this.key = key;
    this.name = name;
    this.type = type;
    this.financial = financial;
    this.date = date;
  }
}

module.exports = ProvidedMessageModel;
