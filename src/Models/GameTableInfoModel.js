class GameTableInfoModel {
  constructor(obj = {}) {
    const {
      index = 2,
      name = "",
      key = "",
      city = "",
      url = "",
      coin_prize = 0,
      cp = 0, // TODO: the cp field is a keyword in JavaScript
      coin_entry = 0,
      playerOnline = 0, //TODO: this key for ver 8.6.8 or older(can  delete it)
      playerOnlineDraw = 0,
      playerOnlineBlock = 0,
      playerOnlineAllFive = 0,
      maxPlayer = 2,
      maxSet = 0,
      maxScore = 104,
      hasBank = true,
      caption = ""
    } = obj;

    this.index = index;
    this.name = name;
    this.key = key;
    this.city = city;
    this.url = url;
    this.coin_prize = coin_prize;
    this.cp = cp;
    this.coin_entry = coin_entry;
    this.playerOnline = playerOnline; //TODO: this key for ver 8.6.8 or older(can  delete it)
    this.playerOnlineDraw = playerOnlineDraw;
    this.playerOnlineBlock = playerOnlineBlock;
    this.playerOnlineAllFive = playerOnlineAllFive;
    this.maxPlayer = maxPlayer;
    this.maxSet = maxSet;
    this.maxScore = maxScore;
    this.hasBank = hasBank;
    this.caption = caption;
  }
}

module.exports = GameTableInfoModel;
