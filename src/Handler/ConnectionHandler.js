const PlayerManager = require("../Base/Manager/PlayerManager");
const GameHandler = require("./GameHandler");
const PlayerHandler = require("./PlayerHandler");
const MatchHandler = require("./MatchHandler");
const { logger } = require("../Utils");
const { RoomManager } = require("../Base/Manager");
const Network = require("../Network");
const Strings = require("../Strings");
const MatchManager = require("../Base/Manager/MatchManager");
const Config = require("../Config");

async function onDisconnect({ playerId, connectionId: conId }) {
  const player = await PlayerManager.get(playerId);
  if (player) {
    const { matchId, key, gameId, roomId } = player.extraData;
    if (player.connectionId === conId) {
      await GameHandler.offlinePlayer({ playerId, gameId, roomId, player });
      logger.debug(`PlayerCount:${await PlayerHandler.count()} (Leave/Close)`);
      if (matchId && key) {
        await MatchHandler.leaveMatch(matchId, key, player);
      }
      await RoomManager.leavePlayer(playerId, roomId);

      if (player.isVip) {
        await RoomManager.leavePlayer(playerId, "laby");
      }

      logger.debug(
        `Disconnect : Connection Size of player: ${playerId} -> ${player.connectionId.length} - (${player.connectionId})`
      );

      //await PlayerHandler.updateUserInParseServer(playerId, player);
      await PlayerManager.del(playerId);

      logger.debug(`PlayerCount : ${await PlayerHandler.count()} (close)`);
    }
  }
}

async function onOfflinePlayer({ playerId, connectionId: conId }) {
  const player = await PlayerManager.get(playerId);
  if (player) {
    const { matchId, key, gameId, roomId } = player.extraData;
    if (player.connectionId === conId) {
      await GameHandler.offlinePlayer({ playerId, gameId, roomId, player });
      logger.debug(`PlayerCount:${await PlayerHandler.count()} (Leave/Close)`);
      if (matchId && key) {
        await MatchHandler.leaveMatch(matchId, key, player);
      }
      await RoomManager.leavePlayer(playerId, roomId);
      if (player.isVip) {
        await RoomManager.leavePlayer(playerId, "laby");
      }
    }
  }
}

async function onCheckOnline({ player }) {
  await Network.SendByPlayerId(player.playerId, {
    method: Strings.MT_CHECK_ONLINE,
    payload: { playerId: player.playerId }
  });
}

async function onLeaveGame(payload) {
  const { playerId } = payload;
  logger.debug(`isLeave: player leave :${playerId}`);
  await GameHandler.leaveGame(payload);
  await MatchManager.delInMatch(playerId);
}

function onQueueMessageCount(payload) {
  const { messageCount } = payload;
  if (messageCount > Config.get("maxActiveJobsOnQueue")) {
    logger.info("onQueueMessageCount");
    Config.set("isQueueFull", true);
  } else {
    Config.set("isQueueFull", false);
  }
  logger.debug(`messageCount:${messageCount}`);
}

module.exports = {
  onDisconnect,
  onOfflinePlayer,
  onCheckOnline,
  onLeaveGame,
  onQueueMessageCount
};
