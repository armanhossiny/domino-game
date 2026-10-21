const { logger } = require("../Utils");
const { process } = global;
const PlayerStatusType = {
  ONLINE: "online",
  OFFLINE: "offline",
  INACTIVE: "Inactive",
  ACTIVE: "active",
  IN_GAME: "inGame",
  WAIT_TO_JOIN_GAME: "waitToJoinGame",
  LEAVE_GAME: "leaveGame",
  NOT_PLAYED: "notPlay",
  JOIN_GAME: "joinGame",
  IN_MATCH: "inMatch",
  IN_END_GAME: "inEndGame",
  JOIN_MATCH: "joinMatch",
  LEAVE_MATCH: "leaveMatch",
  IN_TABLE: "inTable",
  IN_MAIN_MENU: "inMainMenu",
  CLOSE: "close"
};

const GameMode = Object.freeze({
  None: 0,
  Draw: 1,
  AllFives: 2,
  Block: 3,

  0: "None",
  1: "Draw",
  2: "AllFives",
  3: "Block"
});

const PlayerCount = Object.freeze({
  None: 0,
  TwoPlayers: 1,
  FourPlayers: 2,

  0: "None",
  1: "TwoPlayers",
  2: "FourPlayers"
});

const ConnectionType = Object.freeze({
  None: 0,
  Offline: 1,
  Online: 2,
  Event: 3,
  Directly: 4,
  Friendly: 5,
  Club: 6,

  0: "None",
  1: "Offline",
  2: "Online",
  3: "Event",
  4: "Directly",
  5: "Friendly",
  6: "Club"
});

// تعریف GameType
class GameType {
  constructor(obj = {}) {
    const {
      gameMode = GameMode["None"],
      playerCount = PlayerCount["None"],
      connectionType = ConnectionType["None"]
    } = obj;

    this.gameMode = gameMode;
    this.playerCount = playerCount;
    this.connectionType = connectionType;
  }

  // متد مقایسه
  equals(other) {
    return (
      this.gameMode === other.gameMode &&
      this.playerCount === other.playerCount &&
      this.connectionType === other.connectionType
    );
  }
}

const DirectionAdd = Object.freeze({
  N: 0,
  L: 1,
  D: 2,
  DL: 3,
  R: 4,
  RL: 5,
  RD: 6,
  RDL: 7,
  T: 8,
  TL: 9,
  TD: 10,
  TDL: 11,
  TR: 12,
  TRL: 13,
  TRD: 14,
  TRDL: 15,
  C: 16
});

const DirectionHead = Object.freeze({
  UP: 0,
  UP_LEFT: 1,
  UP_RIGHT: 2,
  LEFT: 3,
  LEFT_UP: 4,
  LEFT_DOWN: 5,
  DOWN: 6,
  DOWN_LEFT: 7,
  DOWN_RIGHT: 8,
  RIGHT: 9,
  RIGHT_UP: 10,
  RIGHT_DOWN: 11,
  CENTER: 12,
  CENTER_UP: 13,
  CENTER_LEFT: 14,
  CENTER_DOWN: 15,
  CENTER_RIGHT: 16,
  NON: 17
});

const DominoAppConfigs = Object.freeze({
  PLAYER_MAX_TIMER: 100,
  resetServer: false,
  DELAY_TIME_FOR_LEFT_PLAYER: 6,
  DELAY_TIME_FOR_PICKUP_FROM_BANK: 15,
  END_SET_WAIT: 5,
  MAX_HAND_SIZE: 7,
  TIME_OUT: 1000,
  TURN_WAIT: 15,
  TURN_WAIT_LEAVE: 0,
  MAX_AUTO_MOVE_DOMINO: 3,
  WAITING_FOR_REMATCH_COUNTER: 60
});

const RedisKeys = Object.freeze({
  SERVER_GAME_QUEUE: "DominoServer:Games:AllGames",
  CORE_MESSAGE_QUEUE: "TICK_TO_CORE",
  QUEUE_SEND_JOIN_MATCH: "DominoServer:Match:QueueSendJoinMatch",
  ALL_MATCHES: "DominoServer:Match:AllMatches",
  IN_MATCHES: "DominoServer:Match:InMatch",
  ALL_GAMES_ID: "DominoServer:Games:AllGamesID",
  ALL_GAMES: "DominoServer:Games:AllGames",
  IS_PLAYER_ONLINE: "DominoServer:Players:IsPlayerOnline",
  PLAYER_ONLINE: "DominoServer:Players:PlayerOnline",
  ALL_PLAYERS: "DominoServer:Players:AllPlayers",
  LAST_DATA_PLAYERS: "DominoServer:Players:LastDataPlayers",
  ALL_ROOMS: "DominoServer:Room:AllRooms",
  ONLINE_PLAYERS_ROOM: "DominoServer:Room:OnlinePlayersRoom",
  ONLINE_PLAYERS_TABLE: "DominoServer:Tables:OnlinePlayersTable",
  GAME_TABLES_INFO: "DominoServer:Tables:GameTablesInfo",
  GAME_TABLES_KEY: "DominoServer:Tables:GameTablesKey",
  EMOJI_PLAYERS: "DominoServer:EmojiPlayers",
  EMOJI_INFO: "DominoServer:Emoji:EmojisInfo",
  STICKER_PLAYERS: "DominoServer:StickerPlayers",
  STICKER_INFO: "DominoServer:Sticker:StickersInfo"
});

const ParseServerConfigs = Object.freeze({
  PARSE_SERVER: process.env.PARSE_SERVER,
  REST_API_KEY: process.env.REST_API_KEY,
  APPLICATION_ID: process.env.APP_ID,
  JAVASCRIPT_KEY: process.env.JAVASCRIPT_KEY,
  MASTER_KEY: process.env.MASTER_KEY
});

function isValidJSON(query) {
  try {
    JSON.parse(query);
    return true;
  } catch (error) {
    return false;
  }
}

const adminMessagesForPublicChat = Object.freeze({
  message: "",
  // message:
  //   "چت عمومی فقط برای کاربران VIP که شماره تلفن خود را ثبت کردن فعال میباشد.",
  delay: 10,
  fixed: false
});

const adminMessagesForPrivateChat = Object.freeze({
  message: "",
  // message: "چت  فقط برای کاربرانی که شماره تلفن خود را ثبت کردن فعال میباشد.",
  delay: 10,
  fixed: false
});

const filterMode = 2; //0 none - 1 Normal - 2 hard

module.exports = {
  DirectionHead,
  DirectionAdd,
  PlayerStatusType,
  GameMode,
  PlayerCount,
  ConnectionType,
  GameType,
  DominoAppConfigs,
  ParseServerConfigs,
  RedisKeys,
  isValidJSON,
  adminMessagesForPublicChat,
  adminMessagesForPrivateChat,
  filterMode
};
