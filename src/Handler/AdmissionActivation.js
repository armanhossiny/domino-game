const activate = require("../Services/ActivateMatchParse");
const GameManager = require("../Base/Manager/GameManager");
module.exports = async game => {
  if (!game.state.admissionPending) return true;
  const result = await activate(game);
  if (result?.state === "refunded") {
    Object.assign(game, await GameManager.finalizeAdmission(game.gameId, game.objectId, true));
    return false;
  }
  if (result?.success !== true || result.state !== "active") throw Error("ADMISSION_ACTIVATION_UNCONFIRMED");
  Object.assign(game, await GameManager.finalizeAdmission(game.gameId, game.objectId, false));
  return true;
};
