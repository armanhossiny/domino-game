const checkCoinsParse = require("./CheckCoins");
const sendEndGameParse = require("./EndGameParse");
const GetGamesTableInfoParse = require("./GetGamesTablesInfo");
const getMatchParse = require("./GetMatchParse");
const getUserProfileParse = require("./GetUserProfileParse");
const initParseServer = require("./InitParseServer");
const joinMatchParse = require("./JoinMatchParse");
//const payCoinToJoinGameParse = require("./PayCoinToJoinGame");
const updateUserMessageCounterParse = require("./UpdateUserMessageCounterParse");
const GetStickerInfoParse = require("./GetStickerInfoParse");
const GetEmojiInfoParse = require("./GetEmojiInfoParse");
const ReportPlayerParse = require("./ReportPlayerParse");
const FetchGroup = require("./FetchGroup");

module.exports = {
  checkCoinsParse,
  sendEndGameParse,
  GetGamesTableInfoParse,
  getMatchParse,
  getUserProfileParse,
  initParseServer,
  joinMatchParse,
  //payCoinToJoinGameParse,
  updateUserMessageCounterParse,
  GetStickerInfoParse,
  GetEmojiInfoParse,
  FetchGroup,
  ReportPlayerParse
};
