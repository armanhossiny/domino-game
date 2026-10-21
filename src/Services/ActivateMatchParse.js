const Parse = require("parse/node");
module.exports = async game => Parse.Cloud.run("activate-match", {
  matchId: game.objectId, gameId: game.gameId
}, { useMasterKey: true });
