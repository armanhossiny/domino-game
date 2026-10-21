const { RoomHandler } = require("../Handler");
const Router = require("../Utils/CustomRouter");
const { isPlayerBanned } = require("../MiddleWares/player.middleware");
const { playerMiddleware, roomMiddleware } = require("../MiddleWares");
const { needPlayerExist } = playerMiddleware;
const { needRoomExist, isKicked } = roomMiddleware;

[["joinRoom", RoomHandler.onJoinRoom]].forEach(([event, handler]) =>
  Router.handle(event, [needPlayerExist, isKicked], handler)
);
[
  ["kickRoom", RoomHandler.onKickRoom],
  ["leaveRoom", RoomHandler.onLeaveRoom]
].forEach(([event, handler]) =>
  Router.handle(event, [needPlayerExist], handler)
);

[
  ["showMessage", RoomHandler.onShowMessage],
  ["sendStickerMessage", RoomHandler.onSendStickerMessage],
  ["getChatMessage", RoomHandler.onGetChatMessage],
  ["sendChatMessage", RoomHandler.onSendChatMessage],
  // ["onJoinRoom", RoomHandler.onJoinRoom],
  // ["onLeaveRoom", RoomHandler.onLeaveRoom],
  ["sendProvidedMessage", RoomHandler.onSendProvidedMessage],
  ["sendMatchMessage", RoomHandler.onSendMatchMessage]
].forEach(([event, handler]) =>
  Router.handle(
    event,
    [needPlayerExist, isPlayerBanned, needRoomExist, isKicked],
    handler
  )
);
