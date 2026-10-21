const Draw = require("./Draw");
const { GameMode } = require("../Consts");
const Block = require("./Block");
const AllFives = require("./AllFives");
const { DominoAppConfigs } = require("../Consts");
const logger = require("../Utils/logger");

function ruleFactory(gameObj) {
  const gameMode = gameObj.gameType.gameMode;
  //logger.debug(`gameObj:  ${JSON.stringify(gameObj)}`);
  if (gameMode === 0 || gameMode === GameMode[0]) {
    logger.warn(" GameMode undefined ", { gameObj });
    return undefined;
  }

  gameObj.handSize = DominoAppConfigs.MAX_HAND_SIZE;
  if (gameMode === 1 || gameMode === GameMode[1]) {
    if (gameObj.gameType.playerCount === 2) {
      gameObj.handSize = 5;
      gameObj.gameType.playerCount = 2;
    }
    return new Draw(gameObj);
  } else if (gameMode === 2 || gameMode === GameMode[2]) {
    return new AllFives(gameObj);
  } else if (gameMode === 3 || gameMode === GameMode[3]) {
    return new Block(gameObj);
  }
}

module.exports = ruleFactory;
