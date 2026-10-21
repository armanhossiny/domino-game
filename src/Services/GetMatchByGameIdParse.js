const Parse = require("parse/node");
const Matches = Parse.Object.extend("Matches");

const getMatchParse = async (objectId) => {
  const query = new Parse.Query(Matches);
  query.equalTo("objectId", objectId);
  const results = await query.first({ useMasterKey: true });

  if (!results) {
    // throw "Match not found.";
    return null;
  }

  const winners = results.get("winners") || [];
  const losers = results.get("losers") || [];

  return {
    isEqual: results.get("status") === "equal",
    winners,
    losers,
    tableKey: results.get("table"),
    status: results.get("status"),
    gameId: results.get("gameId"),
    objectId: results.id,
    playersSize: results.get("players_size"),
    players: results.get("players"),
    tournament: results.get("tournament")
  };
};

module.exports = getMatchParse;
