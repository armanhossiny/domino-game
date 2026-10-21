const Parse = require("parse/node");

const gameTablesInfo = Parse.Object.extend("v1_table_game");

const GetGamesTableInfoParse = async () => {
  const query = new Parse.Query(gameTablesInfo);
  const results = await query.find({ useMasterKey: true });

  const allGameTablesInfo = {};
  results.forEach((object) => {
    allGameTablesInfo[object.get("key")] = {
      index: object.get("index"),
      key: object.get("key"),
      playerOnline: 0, //TODO: this key for ver 8.6.8 or older(can  delete it)
      playerOnlineDraw: 0,
      playerOnlineBlock: 0,
      playerOnlineAllFive: 0,
      maxPlayer: object.get("max_player"),
      maxSet: object.get("max_set"),
      maxScore: object.get("max_score"),
      coin_entry: object.get("coin_entry"),
      modeGame: object.get("modeGame"),
      maxTimer: object.get("maxTimer") || 100,
      hasBank: true
    };
  });

  return allGameTablesInfo;
};

module.exports = GetGamesTableInfoParse;
