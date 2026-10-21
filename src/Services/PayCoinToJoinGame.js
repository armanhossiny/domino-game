const Parse = require("parse/node");
const { logger } = require("../Utils");

const payCoinToJoinGameParse = async (dataToSend) => {
  try {
    const result = await Parse.Cloud.run("entryfee-match", dataToSend, { useMasterKey: true });
    return result;
  } catch (err) {
    logger.error({
      message: "payCoinToJoinGameParse",
      error: err.message,
      stack: err.stack
    });
    return undefined;
  }
};

// module.exports = payCoinToJoinGameParse;
