const Parse = require("parse/node");
const { logger } = require("../Utils");

const UpdateUserStickerCounterParse = async (dataToSend) => {
  try {
    const result = await Parse.Cloud.run("dec-sticker-counter", dataToSend, { useMasterKey: true });
    return result;
  } catch (err) {
    logger.error({
      message: "UpdateUserStickerCounterParse",
      error: err.message,
      stack: err.stack
    });
    return undefined;
  }
};

module.exports = UpdateUserStickerCounterParse;
