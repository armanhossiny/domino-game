const Router = require("../Utils/CustomRouter");
const { GameHandler } = require("../Handler");
const { gameMiddleware, playerMiddleware } = require("../MiddleWares");
const { needPlayerExist } = playerMiddleware;

const {
  needGameExist,
  ensureGameNotFinished,
  isPlayerInGame,
  isPlayerOrder,
  isPlayerLeave
} = gameMiddleware;

Router.handle("tick", [needGameExist], GameHandler.tick);
Router.handle(
  "joinGame",
  [needPlayerExist, needGameExist, isPlayerInGame],
  GameHandler.joinGame
);
Router.handle(
  "reJoinGame",
  [needPlayerExist, needGameExist, isPlayerInGame],
  GameHandler.reJoinGame
);
Router.handle("move_leave_player", [needGameExist], GameHandler.onMove);

Router.handle(
  "pickup_leave_player",
  [needGameExist],
  GameHandler.pickUpBankTurn
);

Router.handle("turnPass_leave_player", [needGameExist], GameHandler.onTurnPass);

[
  ["pickup", GameHandler.onPickUp],
  ["move", GameHandler.onMove],
  ["turnPass", GameHandler.onTurnPass]
].forEach(([event, handler]) =>
  Router.handle(
    event,
    [
      needPlayerExist,
      needGameExist,
      ensureGameNotFinished,
      isPlayerOrder,
      isPlayerLeave
    ],
    handler
  )
);

Router.handle(
  "changTurn",
  [needGameExist, ensureGameNotFinished, isPlayerOrder],
  GameHandler.onChangTurn
);
Router.handle(
  "syncGame",
  [needPlayerExist, needGameExist],
  GameHandler.syncGame
);

//Router.handle("onlineState", [needPlayerExist], GameHandler.onOnlineState);
