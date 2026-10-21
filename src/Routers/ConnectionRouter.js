const Router = require("../Utils/CustomRouter");
const { pairPlayerWorker } = require("../Core");
const { playerMiddleware, gameMiddleware } = require("../MiddleWares");
const { needPlayerExist } = playerMiddleware;
const { needGameExist, ensureGameNotFinished } = gameMiddleware;

const {
  onLeaveGame,
  onQueueMessageCount,
  onDisconnect,
  onCheckOnline,
  onOfflinePlayer
} = require("../Handler/ConnectionHandler");
const {
  parseConnectionQuery,
  getPlayerIdWithSessionToken,
  checkLastPlayerGame
} = require("../MiddleWares/player.middleware");
const { PlayerHandler } = require("../Handler");

Router.handle(
  "connect",
  [
    parseConnectionQuery,
    getPlayerIdWithSessionToken,
    pairPlayerWorker,
    checkLastPlayerGame
  ],
  PlayerHandler.connect
);
Router.handle("disconnect", [], onDisconnect);
Router.handle(
  "checkOnline",
  [needPlayerExist, pairPlayerWorker],
  onCheckOnline
);

Router.handle("offline", [needPlayerExist], onOfflinePlayer);

Router.handle(
  "leaveGame",
  [needPlayerExist, needGameExist, ensureGameNotFinished],
  onLeaveGame
);

Router.handle("QueueMessageCount", [], onQueueMessageCount);
