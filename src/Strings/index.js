//channels
const CH_CORE = "coreChannel";
const CH_WORKER = "workerChannel";

//string
const S_CAN_NOT_ADD_DOMINO = "Your can not add this domino!";
const S_CAN_NOT_ADD_TO = "Your can not add this domino to the ";
const S_CAN_NOT_CONNECT_PARSE =
  "Can't connect to parse server for get game table!";
const S_DOMINO_IS_NULL = "Domino is null!";
const S_END_GAME = "End game!";
const S_GAME_ENDED = "Game is ended!";
const S_GAME_NOT_VALID = "Game Not valid!";
const S_PLAYER_IN_GAME_NOT_VALID = "Player in Game Not valid!";
const S_ROOM_NOT_VALID = "Room Not valid!";
const S_ROOM_ID_IS_EMPTY = "Room Id is Empty!";
const S_NOT_ENOUGH_COIN = "You don't have enough coins!";
const S_NOT_FOUND_USER = "Not found user!";
const S_NOT_ORDER = "It is not your turn!";
const S_CAN_NOT_PLAY = "You can't play game!";
const S_CAN_NOT_PLAY_STR = "CAN_NOT_PLAY";
const S_ROOM_IS_CLOSED = "Chat Room is  closed!";
const S_ROOM_IS_CLOSED_STR = "ROOM_IS_CLOSED";
const S_PLAYER_ALREADY_IN_GAME = "Player is already in this game!";
const S_PLAYER_HAVE_NOT_DOMINO = "Player have not domino!";
const S_START_NEW_SET = "Start new set!";
const S_START_PARSE_ERROR = "Parse server (Error) = ";
const S_ONE_OF_PLAYER_IS_FAKE = "One of player is Fake!";
const S_PLAYER_IS_BANNED = "Player is Banned!";
const S_PLAYER_IS_KICKED = "Player is Kicked!";
const S_ADD_PHONE = "Player have no phone number!";
const S_ERROR_ACCESS_ROOM_PHONE = "Player have no access to send this room!";
// const S_NOT_EXIST_TABLE = "Table is Fake!";
// const S_PLAYER_IS_FAKE = "Player is Fake!";
// const S_UPDATE_YOUR_PROFILE = "Your profile not sync!";
const S_NOT_EXIST_PLAYER_IN_SERVER = "Player notExist In Server";
const S_NOT_EXIST_PLAYER_IN_CACHE = "Player not Exist In Cached";

//status
const ST_ERROR = "Error";
const ST_WARNING = "Warning";
const ST_INFO = "Info";

//method

const MT_CREATE_GAME_ERROR = "createGameError";
const MT_NOT_EXIST_TABLE = "notExistTable";
const MT_NOT_EXIST_PLAYER = "notExistPlayer";
const MT_CHANGE_TURN = "changeTurn";
const MT_END_GAME = "endGame";
const MT_END_SET = "endSet";
const MT_RESET_SERVER = "resetServer";
const MT_FORCE_MESSAGE = "forceMessage";
const MT_HIDE_BANK = "hideBank";
const MT_INIT_GAME = "initGame";
const MT_ONLINE_STATE = "onlineState";
const MT_JOIN_GAME = "joinGame";
const MT_REJOIN_ERROR = "reJoinError";
const MT_PARSE_ERROR = "parseError";
const MT_GAME_NOT_VALID = "gameNotValid";
const MT_JOIN_ERROR = "joinError";
const MT_JOIN_ROOM_ERROR = "joinRoomError";
const MT_REJOIN_GAME = "reJoinGame";
const MT_REJOINED_PLAYER_TO_GAME = "reJoinedPlayerToGame";
const MT_JOIN_MATCH = "joinMatch";
const MT_NEW_JOINED_MATCH = "newJoinedMatch";
const MT_JOINED_MATCH_TEMP = "JoinedMatchTemp";
const MT_LAST_STATE = "setState";
const MT_LEAVE_MATCH = "leaveMatch";
const MT_INVITE_TO_MATCH = "inviteToMatch";
const MT_INVITE_REMATCH = "inviteRematch";
const MT_MATCH_IS_FULL = "matchIsFull";
const MT_PLAYER_IS_NOT_ONLINE = "playerIsNotOnline";
const MT_CHECK_ONLINE = "checkOnline";
const MT_PLAYER_IS_IN_OTHER_GAME = "playerIsInOtherGame";
const MT_ACCEPT_JOIN_MATCH = "acceptJoinMatch";
const MT_DECLINE_JOIN_MATCH = "declineJoinMatch";
const MT_REMOVE_PLAYER_IN_MATCH = "removePlayerInMatch";
const MT_LEFT_GAME = "leaveGame";
const MT_DEACTIVE_PLAYER = "deactivePlayer";
const MT_ACTIVE_PLAYER = "activePlayer";
const MT_OFFLINE_PLAYER = "offlinePlayer";
const MT_ONLINE_PLAYER = "onlinePlayer";
const MT_LEFT_JOIN = "leftJoin";
const MT_MOVE = "move";
const MT_PICKUP = "pickup";
const MT_SHOW_BANK = "showBank";
const MT_SHOW_MESSAGE = "showMessage";
const MT_SHOW_PROVIDED_MESSAGE = "showProvidedMessage";
const MT_MATCH_MESSAGE = "showMatchMessage";
const MT_GET_CHAT_MESSAGE = "getChatMessage";
const MT_CHAT_MESSAGE = "chatMessage";
const MT_BLOCKED_GAME = "blockedGame";
const MT_SHOW_EMOJI_MESSAGE = "showEmojiMessage";
const MT_SHOW_STICKER_MESSAGE = "showStickerMessage";
const MT_TURN_PASS = "turnPass";
const MT_UPDATE_PROFILE = "updateProfile";
const MT_NOT_ENOUGH_COIN = "notEnoughCoin";
const MT_PING = "ping";
const MT_PING_FROM_SERVER = "pingFromServer";
const MT_IS_BANNED = "playerIsBanned";
const MT_IS_KICKED = "playerIsKicked";
const MT_ERROR_PHONE = "errorPhone";
const MT_ERROR_ACCESS_ROOM = "errorAccessRoom";
const MT_ACK = "ack";
const MT_RETURN_ACT = "act";
const MT_SYNC_GAME = "syncGame";
const MT_JOIN_ROOM = "joinRoom";
const MT_LOAD_ROOM = "loadRoom";
const MT_NEW_JOIN_ROOM = "newJoinRoom";
const MT_NEW_REJOIN_ROOM = "newReJoinRoom";
const MT_REJOIN_ROOM = "reJoinRoom";
const MT_LEAVE_ROOM = "leaveRoom";

module.exports = {
  //channel
  CH_CORE,
  CH_WORKER,

  //string
  S_CAN_NOT_ADD_DOMINO,
  S_CAN_NOT_ADD_TO,
  S_CAN_NOT_CONNECT_PARSE,
  S_DOMINO_IS_NULL,
  S_END_GAME,
  S_GAME_ENDED,
  S_GAME_NOT_VALID,
  S_PLAYER_IN_GAME_NOT_VALID,
  S_ROOM_NOT_VALID,
  S_NOT_ENOUGH_COIN,
  S_NOT_FOUND_USER,
  S_NOT_ORDER,
  S_CAN_NOT_PLAY,
  S_CAN_NOT_PLAY_STR,
  S_ROOM_IS_CLOSED,
  S_ROOM_IS_CLOSED_STR,
  S_PLAYER_ALREADY_IN_GAME,
  S_PLAYER_HAVE_NOT_DOMINO,
  S_START_NEW_SET,
  S_START_PARSE_ERROR,
  S_ONE_OF_PLAYER_IS_FAKE,
  S_PLAYER_IS_BANNED,
  S_PLAYER_IS_KICKED,
  S_ADD_PHONE,
  S_ERROR_ACCESS_ROOM_PHONE,
  S_ROOM_ID_IS_EMPTY,
  S_NOT_EXIST_PLAYER_IN_SERVER,
  S_NOT_EXIST_PLAYER_IN_CACHE,

  //status
  ST_ERROR,
  ST_WARNING,
  ST_INFO,

  //method
  MT_RETURN_ACT,
  MT_CREATE_GAME_ERROR,
  MT_CHANGE_TURN,
  MT_END_GAME,
  MT_END_SET,
  MT_RESET_SERVER,
  MT_FORCE_MESSAGE,
  MT_HIDE_BANK,
  MT_INIT_GAME,
  MT_ONLINE_STATE,
  MT_JOIN_GAME,
  MT_REJOIN_ERROR,
  MT_PARSE_ERROR,
  MT_GAME_NOT_VALID,
  MT_JOIN_ERROR,
  MT_JOIN_ROOM_ERROR,
  MT_REJOIN_GAME,
  MT_REJOINED_PLAYER_TO_GAME,
  MT_JOIN_MATCH,
  MT_NEW_JOINED_MATCH,
  MT_JOINED_MATCH_TEMP,
  MT_LAST_STATE,
  MT_LEAVE_MATCH,
  MT_INVITE_TO_MATCH,
  MT_INVITE_REMATCH,
  MT_MATCH_IS_FULL,
  MT_PLAYER_IS_NOT_ONLINE,
  MT_CHECK_ONLINE,
  MT_PLAYER_IS_IN_OTHER_GAME,
  MT_ACCEPT_JOIN_MATCH,
  MT_DECLINE_JOIN_MATCH,
  MT_REMOVE_PLAYER_IN_MATCH,
  MT_LEFT_GAME,
  MT_DEACTIVE_PLAYER,
  MT_ACTIVE_PLAYER,
  MT_OFFLINE_PLAYER,
  MT_ONLINE_PLAYER,
  MT_LEFT_JOIN,
  MT_MOVE,
  MT_PICKUP,
  MT_SHOW_BANK,
  MT_SHOW_MESSAGE,
  MT_SHOW_PROVIDED_MESSAGE,
  MT_MATCH_MESSAGE,
  MT_GET_CHAT_MESSAGE,
  MT_CHAT_MESSAGE,
  MT_BLOCKED_GAME,
  MT_SHOW_EMOJI_MESSAGE,
  MT_SHOW_STICKER_MESSAGE,
  MT_TURN_PASS,
  MT_UPDATE_PROFILE,
  MT_NOT_ENOUGH_COIN,
  MT_PING,
  MT_PING_FROM_SERVER,
  MT_NOT_EXIST_PLAYER,
  MT_NOT_EXIST_TABLE,
  MT_IS_BANNED,
  MT_ACK,
  MT_ERROR_ACCESS_ROOM,
  MT_SYNC_GAME,
  MT_JOIN_ROOM,
  MT_LOAD_ROOM,
  MT_NEW_JOIN_ROOM,
  MT_NEW_REJOIN_ROOM,
  MT_REJOIN_ROOM,
  MT_ERROR_PHONE,
  MT_LEAVE_ROOM,
  MT_IS_KICKED
};
