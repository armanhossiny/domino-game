const Router = require("../Utils/CustomRouter");
const { pairPlayerWorker } = require("../Core");
const { playerMiddleware } = require("../MiddleWares");
const { PlayerHandler } = require("../Handler");
const { needPlayerExist } = require("../MiddleWares/player.middleware");
const { setPlayerOnline } = playerMiddleware;

Router.handle("userOnline", [pairPlayerWorker], setPlayerOnline);
Router.handle("report", [needPlayerExist], PlayerHandler.report);
