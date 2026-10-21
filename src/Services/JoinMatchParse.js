const Parse = require("parse/node");
const { logger } = require("../Utils");

const joinMatchParse = async (dataToSend) => {
  // Enable only after Parse's atomic admission has been deployed. Every attempt
  // retains the original admissionId/gameId and the already-created game state.
  const attempts = process.env.MATCH_ATOMIC_ADMISSION === "1" ? 3 : 1;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const result = await Parse.Cloud.run("join-match", dataToSend, { useMasterKey: true });

      return result;
    } catch (err) {
      logger.error({
        message: "joinMatchParse",
        error: err.message,
        stack: err.stack
      });

      if (attempt === attempts - 1) return undefined;
    }
  }
};

module.exports = joinMatchParse;
