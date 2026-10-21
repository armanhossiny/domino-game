const Router = require("./src/Utils/CustomRouter");
const { MatchHandler } = require("./src/Handler");

require("./src/Routers");

MatchHandler.setOnJoin(MatchHandler.onJoinMatch);
MatchHandler.setOnLeave(MatchHandler.onLeaveMatch);
MatchHandler.setOnMatchStart(MatchHandler.onMatchStart);

const main = async (data) => {
  await Router.handleEvent(data);
};

module.exports = main;
