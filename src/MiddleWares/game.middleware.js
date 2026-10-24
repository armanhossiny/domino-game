const GameManager = require("../Base/Manager/GameManager");
const Network = require("../Network");
const Strings = require("../Strings");
const { ValidationError } = require("../Utils/CustomError");
const { rejoinPlayerToExistGame } = require("../Handler/GameHandler");

/**
 * attache game to paylaod
 * check if game by gameId is exist attach game to pay load
 *
 * @param {*} payload
 */
async function isGameExist(payload) {
  const { gameId } = payload;
  if (gameId) {
    const game = await GameManager.get(gameId);
    payload.game = game;
  }
}

/**
 * if game not exist return message to user and throw error
 * @param {*} payload
 * @returns
 */
async function needGameExist(payload) {
  const { gameId, player } = payload;
  const game = await GameManager.get(gameId);

  if (game) {
    payload.game = game;
    return;
  }

  GameManager.del(gameId).then();

  if (player) {
    const { playerId } = player.extraData;
    await Network.SendByConnectionId(playerId, {
      method: Strings.MT_GAME_NOT_VALID,
      payload: { gameId, message: Strings.S_GAME_NOT_VALID }
    });
  }

  throw new ValidationError("GAME_NOTE_EXIST" + " _ " + gameId);
}

/**
 * if game not exist return message to user and throw error
 * @param {*} payload
 * @returns
 */
async function isPlayerInGame(payload) {
  const { game, playerId, connectionId, gameId } = payload;

  const player = game.players[playerId];

  if (player) {
    payload.game = game;
    return;
  }

  await Network.SendByConnectionId(playerId, {
    method: Strings.MT_JOIN_ERROR,
    message: Strings.S_PLAYER_IN_GAME_NOT_VALID
  });

  throw new ValidationError("PLAYER_NOT_IN_GAME" + " _ " + gameId);
}

/**
 * if set is ended dont allow to run method
 * @param {*} payload
 * @returns
 */
async function ensureGameNotFinished(payload) {
  const { game, playerId, player } = payload;

  if (game.state.settlementPending) throw new ValidationError("MATCH_SETTLEMENT_PENDING");

  if (!game.state.isEnded) {
    return;
  }

  if (!player) {
    return;
  }

  const isPlayerInGame =
    (game &&
      !game.state.isEnded &&
      player &&
      game.players[playerId] &&
      !game.players[playerId].isLeave) ||
    false;
  // if game exist and is live rejoin to game
  if (isPlayerInGame) {
    await rejoinPlayerToExistGame(player, game);
    return;
  }

  const gameIsNull = game ? "isValid" : "isNull";
  const gameIsEnded = game.state.isEnded ? "true" : "false";
  const playerIsNull = player ? "false" : "true";
  const playerIsLeave = game.players[playerId].isLeave ? "true" : "false";

  await Network.SendByConnectionId(playerId, {
    method: Strings.MT_GAME_NOT_VALID,
    payload: {
      gameId: game.gameId,
      message: `${Strings.S_GAME_NOT_VALID}  
           Game isValid: ${gameIsNull} 
          Game is Ended: ${gameIsEnded}    
         player Is Null: ${playerIsNull}     
        player Is Leave: ${playerIsLeave}     
       `
    }
  });
  throw new ValidationError(
    `ensureGameNotFinished :${Strings.S_GAME_NOT_VALID} \n 
           Game isValid: ${gameIsNull} 
          Game is Ended: ${gameIsEnded}    
         player Is Null: ${playerIsNull}     
        player Is Leave: ${playerIsLeave}     
       `
  );
}

/**
 * check is sender current order of game
 * @param {*} payload
 * @returns
 */
async function isPlayerOrder(payload) {
  const { game, playerId, connectionId } = payload;
  const order = game.state.order;

  if (playerId === order) {
    return;
  }

  const message = {
    method: Strings.ST_ERROR,
    message: Strings.S_NOT_ORDER,
    payload: {
      gameId: game.gameId
    }
  };
  await Network.SendByConnectionId(playerId, message);

  throw new ValidationError(`isPlayerOrder:${Strings.S_NOT_ORDER}`);
}

async function isPlayerLeave(payload) {
  const { game, playerId, connectionId } = payload;
  const player = game.players[playerId];
  if (!player.isLeave) {
    return;
  }

  const message = {
    method: Strings.ST_INFO,
    payload: {
      gameId: game.gameId,
      playerId: playerId,
      message: Strings.S_CAN_NOT_PLAY_STR,
      error: Strings.S_CAN_NOT_PLAY
    }
  };
  await Network.SendByConnectionId(playerId, message);

  throw new ValidationError(`isPlayerLeaved:${Strings.S_CAN_NOT_PLAY}`);
}

module.exports = {
  needGameExist,
  isGameExist,
  isPlayerInGame,
  ensureGameNotFinished,
  isPlayerLeave,
  isPlayerOrder
};
