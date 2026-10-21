const fs = require("fs");
const { logger } = require("./logger");

async function checkSumBoard(game, event, always) {
  try {
    const bankLength = game.bank.length;
    const boardLength = game.state.board.length;
    let handlen = 0;
    for (const playerId in game.players) {
      handlen += game.players[playerId].hand.length;
    }

    const sum = bankLength + handlen + boardLength;
    if (sum !== 28 || always) {
      // Convert the object to a JSON string
      const jsonString = JSON.stringify(game, null, 2); // The third argument (2) adds indentation for readability

      // Specify the file path (adjust as needed)
      const filePath = `src/games/${game.gameId}_${event}.json`;
      // const filePath = path.join(__dirname, 'games', `${game.gameId}_${event}.json`);

      fs.appendFile(filePath, jsonString, "utf8", (errorFile) => {
        if (errorFile) {
          throw errorFile;
        }
      });
    }
  } catch (error) {
    logger.error({
      message: "checkSumBoard",
      error: error.message,
      stack: error.stack
    });
  }
}

async function writeObjectToFile(fileName, jsonObject) {
  const filePath = `src/games/${fileName}.json`;
  // const filePath = path.join(__dirname, 'games', `${fileName}.json`);
  fs.appendFile(filePath, JSON.stringify(jsonObject), "utf8", (errorFile) => {
    if (errorFile) {
      throw errorFile;
    }
  });
}

module.exports = {
  checkSumBoard,
  writeObjectToFile
};
