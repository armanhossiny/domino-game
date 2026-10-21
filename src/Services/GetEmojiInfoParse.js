const Parse = require("parse/node");

const gameTablesInfo = Parse.Object.extend("EmojiNew");

const GetEmojiInfoParse = async () => {
  const query = new Parse.Query(gameTablesInfo);
  const results = await query.find({ useMasterKey: true });

  const allEmojiInfo = {};
  results.forEach((object) => {
    allEmojiInfo[object.get("name")] = {
      index: object.get("index"),
      name: object.get("name")
    };
  });

  return allEmojiInfo;
};

module.exports = GetEmojiInfoParse;
