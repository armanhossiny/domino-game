const Parse = require("parse/node");
const { logger } = require("../Utils");
const User = Parse.Object.extend("User");

const isVipDateExpired = (vip) => {
  const dateVip = new Date(vip);
  const currentTime = new Date();
  const diffTwoTime = dateVip - currentTime;

  return diffTwoTime > 0;
};

const GetUserProfileParse = async (objectId) => {
  const query = new Parse.Query(User);

  try {
    const profile = await query.get(objectId, { useMasterKey: true });
    const player_Info = {
      playerId: profile.id,
      user_name: profile.get("username"),
      displayName: profile.get("displayName"),
      rankCaption: profile.get("user_rankCaption"),
      avatar_url: profile.get("selectedAvatar"),
      frame_url: profile.get("selectedFrame"),
      selected_item: profile.get("selectedItem"),
      selected_crown: profile.get("selectedItem"),
      selected_domino: profile.get("selectedDomino"),
      selected_emoji: profile.get("selectedEmoji"),
      list_emoji: profile.get("listEmojiNew"),
      list_sticker: profile.get("list_emoji"),
      ostan: profile.get("ostan"),
      count: 0, //profile.get('playerName'),
      score: 0, //profile.get('playerName'),
      phone: profile.get("phone"),
      level: profile.get("level"),
      coins: profile.get("coins"),
      gems: profile.get("gems"),
      totalWinCoins: profile.get("totalWinCoins"),
      totalGames: profile.get("totalGames"),
      wonGame: profile.get("wonGame"),
      progressBar: profile.get("progressBar"),
      messageCount: profile.get("numberMassage"),
      isVip: isVipDateExpired(profile.get("vip")),
      isOnline: false, //profile.get('playerName'),
      isBanned: profile.get("isBanned") || false,
      variant: profile.get("variant") || "default",
      scoreLastweekLeaderboard: 0, //profile.get('playerName'),
      countLastweekLeaderboardWorld: 0, //profile.get('playerName'),
      countLastweekLeaderboardOstan: 0 //profile.get('playerName')
    };
    return player_Info;
  } catch (error) {
    logger.error({
      message: "GetUserProfileParse",
      error: error.message,
      stack: error.stack
    });
    return null;
  }
};

module.exports = GetUserProfileParse;
