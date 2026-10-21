const onUncaughtException = require("./onUncaughtException");
const onSIGUSR2 = require("./onSIGUSR2");
const playerMiddleware = require("./player.middleware");
const gameMiddleware = require("./game.middleware");
const roomMiddleware = require("./room.middleware");
const matchMiddleware = require("./match.middleware");

module.exports = {
  playerMiddleware,
  onUncaughtException,
  gameMiddleware,
  roomMiddleware,
  matchMiddleware,
  onSIGUSR2
};
