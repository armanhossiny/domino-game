const Router = require("../Utils/CustomRouter");
const { playerMiddleware } = require("../MiddleWares");
const { setAsFromClient, returnAct } = playerMiddleware;

Router.use(setAsFromClient);
Router.useAfter(returnAct);
