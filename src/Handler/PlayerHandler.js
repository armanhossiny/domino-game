const PlayerManager = require("../Base/Manager/PlayerManager");

const { PlayerModel } = require("../Models");
const { PlayerStatusType } = require("../Consts");
const { SendByConnectionId } = require("../Network");
const {
  getUserProfileParse,
  updateUserMessageCounterParse
} = require("../Services");
const EmojiManager = require("../Base/Manager/EmojiManager");
const UpdateUserEmojiCounterParse = require("../Services/UpdateUserEmojiCounterParse");
const StickerManager = require("../Base/Manager/StickerManager");
const UpdateUserStickerCounterParse = require("../Services/UpdateUserStickerCounterParse");
const logger = require("../Utils/logger");
const ReportPlayerParse = require("../Services/ReportPlayerParse");
const { ValidationError } = require("../Utils/CustomError");

class PlayerHandler {
  constructor() {
    this.statusType = PlayerStatusType;
  }

  async close(playerId) {
    const player = await this.get(playerId);

    // if (player) {
    //   await this.updateUserInParseServer(playerId, player);
    // }

    await PlayerManager.del(playerId);
  }

  async connect(payload) {
    const {
      playerId,
      player: previousPlayer,
      connectionId /*ver = 0*/
    } = payload;

    logger.debug(`Player ${playerId} connected with id ${connectionId}`);
    const playerProfile = await getUserProfileParse(playerId);
    if (!playerProfile) {
      throw new ValidationError("PLAYER_NOT_FOUND");
    }
    const oldPlayer = await PlayerManager.get(playerId);
    const newPlayer = oldPlayer ? oldPlayer : new PlayerModel();

    newPlayer.connectionId = connectionId;
    logger.debug(
      `Connected : Connection Size of player: ${playerId} -> ${newPlayer.connectionId.length} - (${newPlayer.connectionId})`
    );
    newPlayer.isVip = playerProfile.isVip;
    if (playerProfile.messageCount) {
      newPlayer.messageCount = playerProfile.messageCount;
    }

    newPlayer.playerId = playerId;
    newPlayer.variant = playerProfile.variant;
    newPlayer.status = PlayerStatusType.ONLINE;
    newPlayer.profile = {};
    newPlayer.profile.playerId = playerProfile.playerId;
    newPlayer.profile.displayName = playerProfile.displayName;
    newPlayer.profile.avatar_url = playerProfile.avatar_url;
    newPlayer.profile.frame_url = playerProfile.frame_url;
    newPlayer.profile.isVip = playerProfile.isVip;
    newPlayer.profile.selectedItem = playerProfile.selected_item;
    newPlayer.profile.selectedCrown = playerProfile.selected_crown;
    newPlayer.profile.coins = playerProfile.coins;
    newPlayer.profile.gems = playerProfile.gems;
    newPlayer.profile.level = playerProfile.level;
    newPlayer.extraData = { ...payload };
    newPlayer.extraData.phone = playerProfile.phone;
    newPlayer.extraData.status = PlayerStatusType.ONLINE;

    delete newPlayer.extraData.player;
    delete newPlayer.extraData.connectionId;

    // copy exist player extra data
    if (previousPlayer) {
      const mergedData = { ...previousPlayer.extraData };
      //delete mergedData.connectionId;

      newPlayer.extraData = { ...newPlayer.extraData, ...mergedData };
    }

    await PlayerManager.add(playerId, newPlayer, "Connect");

    await SendByConnectionId(newPlayer.playerId, {
      method: "connected",
      payload
    });
  }

  async get(playerId) {
    return await PlayerManager.get(playerId);
  }

  async count() {
    return await PlayerManager.count();
  }

  async updateMessageCount(payload) {
    const { playerId, player } = payload;

    if (player.messageCount > 0 || player.isVip) {
      if (!player.isVip) {
        player.messageUsedCount++;
        player.messageCount--;
      }
      await PlayerManager.update(playerId, player, "updateMessageCount");
    }
  }

  async report(payload) {
    const { playerId, reportedPlayerId, message } = payload;
    const dataToSend = { playerId, reportedPlayerId, meta: message };

    const result = await ReportPlayerParse(dataToSend);

    if (result) {
      if (result.isBannedNow) {
        const player = await PlayerManager.get(reportedPlayerId);
        if (player) {
          player.isBanned = true;
          await PlayerManager.update(
            reportedPlayerId,
            player,
            "updateMessageCount"
          );
        }
      }
    }
  }

  async update(playerId, player) {
    await PlayerManager.update(playerId, player, "playerHandlerUpdate");
  }

  async updateExtraData(playerId, extraData) {
    const player = await this.get(playerId);
    if (!player) {
      return;
    }
    Object.assign(player.extraData, extraData);
    await PlayerManager.update(playerId, player, "updateExtraData");
  }

  async updateStatus(playerId, status) {
    if (status) {
      await PlayerManager.updateStatus(playerId, status);
    }
  }

  async updateClientStatus(payload) {
    const playerId = payload.playerId;
    const status = payload.status;
    if (status && playerId) {
      if (status === "exitEndGame") {
        await PlayerManager.updateStatus(playerId, PlayerStatusType.IN_TABLE);
      } else if (status === "rematch") {
        await PlayerManager.updateStatus(playerId, PlayerStatusType.IN_MATCH);
      } else if (status === "inGame") {
        await PlayerManager.updateStatus(playerId, PlayerStatusType.IN_GAME);
      } else {
        await PlayerManager.updateStatus(
          playerId,
          PlayerStatusType.IN_MAIN_MENU
        );
      }
    }
  }

  async updateUserMessageUsedCountInParseServer(playerId, player) {
    if (player) {
      //update message count user
      if (player.messageUsedCount > 0) {
        await updateUserMessageCounterParse(playerId, player.messageUsedCount);
        player.messageUsedCount = 0;
        await this.update(playerId, player);
      }
    }
  }

  async updateUserEmojiInParseServer(playerId, name, count) {
    //update emoji count user
    if (count > 0) {
      await UpdateUserEmojiCounterParse({
        playerId,
        name,
        count
      });
    }

    await EmojiManager.del(playerId, name);
  }

  async updateUserStickerInParseServer(playerId, name, count) {
    //update sticker count user

    if (count > 0) {
      await UpdateUserStickerCounterParse({
        playerId,
        name,
        count
      });
    }

    await StickerManager.del(playerId, name);
  }
}

module.exports = new PlayerHandler();
