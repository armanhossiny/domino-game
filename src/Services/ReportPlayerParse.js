const Parse = require("parse/node");
const { logger } = require("../Utils");
/**
 *
 * @param {object} dataToSend
 * @returns send game data to match
 */
const ReportPlayerParse = async (dataToSend) => {
  try {
    //const result = await Parse.Cloud.run("end-match", dataToSend);
    return await Parse.Cloud.run("reportFromGameServer", dataToSend, { useMasterKey: true });
  } catch (err) {
    logger.error({
      message: "ReportPlayerParse",
      error: err.message,
      stack: err.stack
    });
    return undefined;
  }
};

module.exports = ReportPlayerParse;
