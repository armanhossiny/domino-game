const Parse = require("parse/node");
const { logger } = require("../Utils");

function t(label) {
  const start = Date.now();
  return () => {
    if (Date.now() - start > 0) {
      logger.info(`${label} ${Date.now() - start} ms`);
    }
  };
}

const sendEndGameParse = async (dataToSend) => {
  const end = t("sendEndGameParse");
  try {
    const result = await Parse.Cloud.run("end-match", dataToSend, { useMasterKey: true });
    end();
    return result;
  } catch (err) {
    logger.error({
      message: "sendEndGameParse",
      error: err.message,
      stack: err.stack
    });
    end();
    return undefined;
  }
};

module.exports = sendEndGameParse;
