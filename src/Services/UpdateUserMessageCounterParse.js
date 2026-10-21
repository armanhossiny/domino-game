const Parse = require("parse/node");
const User = Parse.Object.extend("User");
const { logger } = require("../Utils");

const updateUserMessageCounterParse = async (objectId, numberMessageUsed) => {
  const query = new Parse.Query(User);
  query.equalTo("objectId", objectId);

  try {
    const userProfile = await query.first({ useMasterKey: true });

    if (userProfile && numberMessageUsed > 0) {
      userProfile.decrement("numberMassage", numberMessageUsed);
      const player = await userProfile.save(null, { useMasterKey: true });
      return player;
    }
  } catch (error) {
    logger.error({
      message: "Error updating user message counter",
      error: error.message,
      stack: error.stack
    });
  }
};

module.exports = updateUserMessageCounterParse;
