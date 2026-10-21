const Parse = require("parse/node");

const gameTablesInfo = Parse.Object.extend("Emoji");

const GetStickerInfoParse = async () => {
  const query = new Parse.Query(gameTablesInfo);
  const results = await query.find({ useMasterKey: true });

  const allStickerInfo = {};
  results.forEach((object) => {
    allStickerInfo[object.get("name")] = {
      index: object.get("index"),
      name: object.get("name")
    };
  });

  return allStickerInfo;
};

module.exports = GetStickerInfoParse;
