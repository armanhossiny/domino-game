const Parse = require("parse/node");
const { logger } = require("../Utils");

const UpdateUserEmojiCounterParse = async (dataToSend) => {
  try {
    const result = await Parse.Cloud.run("dec-emoji-counter", dataToSend, { useMasterKey: true });
    return result;
  } catch (err) {
    logger.error({
      message: "UpdateUserEmojiCounterParse",
      error: err.message,
      stack: err.stack
    });
    return undefined;
  }
};

module.exports = UpdateUserEmojiCounterParse;
