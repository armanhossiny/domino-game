const Parse = require("parse/node");
const { logger } = require("../Utils");

/**
 *
 * @param {*} dataToSend
 * @returns check user coin before join to game
 */
const checkCoinsParse = async (dataToSend) => {
  try {
    const result = await Parse.Cloud.run("checkCoinBeforeJoin", dataToSend);
    return result;
  } catch (err) {
    logger.error({
      message: "checkCoinsParse",
      error: err.message,
      stack: err.stack
    });
    return undefined;
  }
};

module.exports = checkCoinsParse;
