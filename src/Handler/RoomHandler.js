const Conductor = require("../Commands/Conductor");
const SendMessageCommand = require("../Commands/SendMessageCommand");
const SendStickerCommand = require("../Commands/SendStickerCommand");
const RoomManager = require("../Base/Manager/RoomManager");
const { RoomModel } = require("../Models");
const GetMessageChatCommand = require("../Commands/GetMessageChatCommand");
const SendProvidedMessageCommand = require("../Commands/SendProvidedMessageCommand");
const PlayerHandler = require("./PlayerHandler");
const MessageModel = require("../Models/MessageModel");
const ProvidedMessageModel = require("../Models/ProvidedMessageModel");
const SendChatMessageCommand = require("../Commands/SendChatMessageCommand");
const EmojiManager = require("../Base/Manager/EmojiManager");
const StickerManager = require("../Base/Manager/StickerManager");
const { getUserProfileParse } = require("../Services");
const JoinRoomCommand = require("../Commands/JoinRoomCommand");
const NewJoinRoomCommand = require("../Commands/NewJoinRoomCommand");
const leaveRoomCommand = require("../Commands/leaveRoomCommand");
const MatchMessageModel = require("../Models/MatchMessageModel");
const SendMatchMessageCommand = require("../Commands/SendMatchMessageCommand");
const Strings = require("../Strings");
const Network = require("../Network");
const { adminMessagesForPublicChat, filterMode } = require("../Consts");
const LoadRoomCommand = require("../Commands/LoadRoomCommand");
const Config = require("../Config");
const { PlayerManager } = require("../Base/Manager");
const kickFromRoomCommand = require("../Commands/kickFromRoomCommand");
const { isKicked } = require("../MiddleWares/room.middleware");
const GroupsManager = require("../Base/Manager/GroupsManager");
const { kickPlayer } = require("./GroupsHandler");
const { Code } = require("../Utils/responses");
const NewReJoinRoomCommand = require("../Commands/NewReJoinRoomCommand");

async function joinRoom(roomId, playerId, player) {
  let room = await RoomManager.get(roomId);
  if (!room || roomId.length === 0 || !roomId) {
    room = new RoomModel({
      roomId,
      players: {},
      messages: [],
      voiceTokens: {},
      filter: filterMode,
      adminMessage: adminMessagesForPublicChat
    });
  }

  room.adminMessage = adminMessagesForPublicChat;
  room.filter = filterMode;
  const isExist = room.players[playerId] !== undefined;
  const profile = player.profile;
  room.players[playerId] = {
    displayName: profile.displayName,
    avatar: profile.avatar_url,
    frame: profile.frame_url,
    level: profile.level,
    isVip: false //profile.isVip
  };
  room.onlinePlayers[playerId] = {};

  await RoomManager.joinPlayer(playerId, roomId);
  await RoomManager.save(roomId, room);

  if (!isExist) {
    await Conductor.run(new NewJoinRoomCommand(room), {
      roomId,
      playerId,
      player
    });

    // if (roomId === "laby") {
    //   await sendMessage({
    //     playerId,
    //     player,
    //     roomId,
    //     room,
    //     message: "startJoin", //{ type: "startJoin" },
    //     type: 0
    //   });
    // }
  } else {
    await Conductor.run(new NewReJoinRoomCommand(room), {
      roomId,
      playerId,
      player
    });
  }

  return room;
}

async function loadRoom(roomId, playerId, player) {
  let room = await RoomManager.get(roomId);
  if (!room || roomId.length === 0 || !roomId) {
    room = new RoomModel({
      roomId,
      players: {},
      onlinePlayers: {},
      messages: [],
      voiceTokens: {},
      filter: 1,
      adminMessage: {}
    });
  }
  room.adminMessage = adminMessagesForPublicChat;
  room.filter = filterMode;
  return room;
}

async function getRoom(roomId, playerId) {
  const room = await RoomManager.get(roomId);
  const player = room?.players[playerId] || undefined;
  if (player !== undefined) {
    return room;
  }
  return undefined;
}

async function leaveRoom(roomId, playerId) {
  return removeOnlinePlayersRoom(roomId, playerId);
}

async function kickFromRoom(roomId, playerId) {
  return addToKickedPlayersRoom(roomId, playerId);
}

async function removeOnlinePlayersRoom(roomId, playerId) {
  const room = await RoomManager.get(roomId);

  if (!room) {
    return null;
  }

  room.players ??= {};
  room.onlinePlayers ??= {};
  room.kickedPlayers ??= {};

  let isChanged = false;

  if (Object.hasOwn(room.players, playerId)) {
    room.players[playerId]["isLeave"] = true;
    isChanged = true;
  }

  // حذف از لیست آنلاین‌ها
  if (Object.hasOwn(room.onlinePlayers, playerId)) {
    delete room.onlinePlayers[playerId];
    isChanged = true;
  }

  // ابتدا وضعیت اخراج را ذخیره کن تا بازیکن نتواند دوباره وارد شود
  if (isChanged) {
    await RoomManager.save(roomId, room);
  }

  // فقط اگر واقعاً داخل روم است، خارجش کن
  if (Object.hasOwn(room.players, playerId)) {
    return RoomManager.leavePlayer(playerId, roomId);
  }

  return room;
}

async function addToKickedPlayersRoom(roomId, playerId) {
  const room = await RoomManager.get(roomId);

  if (!room) {
    return null;
  }

  room.players ??= {};
  room.onlinePlayers ??= {};
  room.kickedPlayers ??= {};

  let isChanged = false;

  if (!Object.hasOwn(room.players, playerId)) {
    room.players[playerId]["isKicked"] = true;
    isChanged = true;
  }
  // ثبت بازیکن به‌عنوان اخراج‌شده
  if (!Object.hasOwn(room.kickedPlayers, playerId)) {
    room.kickedPlayers[playerId] = true;
    isChanged = true;
  }

  // حذف از لیست آنلاین‌ها
  if (Object.hasOwn(room.onlinePlayers, playerId)) {
    delete room.onlinePlayers[playerId];
    isChanged = true;
  }

  // ابتدا وضعیت اخراج را ذخیره کن تا بازیکن نتواند دوباره وارد شود
  if (isChanged) {
    await RoomManager.save(roomId, room);
  }

  // فقط اگر واقعاً داخل روم است، خارجش کن
  if (Object.hasOwn(room.players, playerId)) {
    return RoomManager.leavePlayer(playerId, roomId);
  }

  return room;
}

async function onGetChatMessage(payload) {
  const { gameId, playerId, game } = payload;

  await Conductor.run(new GetMessageChatCommand(), { gameId, playerId }, game);
}

async function onShowMessage(payload) {
  const { gameId, playerId, game, message } = payload;

  await Conductor.run(
    new SendMessageCommand(),
    { gameId, playerId, message },
    game
  );
}

async function onSendChatMessage(payload) {
  const { playerId, player, room, message } = payload;

  if (!Config.isChatEnabled(player)) {
    const message = {
      method: Strings.MT_ERROR_PHONE,
      message: Strings.S_ADD_PHONE
    };
    await Network.SendByConnectionId(playerId, message);
    return;
  }

  if (message.length && room) {
    // if (!Object.prototype.hasOwnProperty.call(room.players, playerId)) {
    if (!Object.hasOwn(room.players, playerId)) {
      const message = {
        method: Strings.MT_ERROR_ACCESS_ROOM,
        message: Strings.S_ERROR_ACCESS_ROOM_PHONE
      };
      await Network.SendByConnectionId(playerId, message);
      return;
    }

    if (player.messageCount < 1) {
      const playerProfile = await getUserProfileParse(playerId);
      player.messageCount = playerProfile.messageCount;
    }

    if (player.messageCount > 0 || player.isVip) {
      if (!player.isVip) {
        player.messageUsedCount++;
        player.messageCount--;
        if (player.messageUsedCount >= 10) {
          PlayerHandler.updateUserMessageUsedCountInParseServer(
            playerId,
            player
          ).then();
        }
        await PlayerHandler.update(playerId, player);
      }
      await sendMessage(payload);
    }
  }
}

async function onSendProvidedMessage(payload) {
  const { playerId, roomId, name, key, type, financial, room } = payload;

  if (key.length && room) {
    if (type === "anim" && financial) {
      await onSendEmojiMessage(payload);
    } else {
      const msg = new ProvidedMessageModel();
      msg.playerId = playerId;
      msg.key = key;
      msg.name = name;
      msg.type = type;
      msg.financial = financial;

      msg.date = JSON.stringify(new Date());

      await Conductor.run(
        new SendProvidedMessageCommand(),
        {
          roomId,
          playerId,
          ...msg
        },
        room
      );
    }
  }
}

async function onSendStickerMessage(payload) {
  const { playerId, name, key, type, financial, room } = payload;

  if (key.length && room) {
    if (type === "sticker" && financial) {
      // if (!player.isVip)
      {
        let stickerCount = (await StickerManager.get(playerId, name)) || 0;

        if (stickerCount) {
          stickerCount++;
          if (stickerCount >= 10) {
            PlayerHandler.updateUserStickerInParseServer(
              playerId,
              name,
              stickerCount
            ).then();
          } else {
            await StickerManager.set(playerId, name, stickerCount);
          }
        } else {
          await StickerManager.set(playerId, name, 1);
        }
      }
      await sendStickerMessage(payload);
    }
  }
}

async function onSendEmojiMessage(payload) {
  const { playerId, name, key, type, financial, room } = payload;

  if (key.length && room) {
    if (type === "anim" && financial) {
      // if (!player.isVip)
      {
        let emojiCount = (await EmojiManager.get(playerId, name)) || 0;

        if (emojiCount) {
          emojiCount++;
          if (emojiCount >= 5) {
            PlayerHandler.updateUserEmojiInParseServer(
              playerId,
              name,
              emojiCount
            ).then();
          } else {
            await EmojiManager.set(playerId, name, emojiCount);
          }
        } else {
          await EmojiManager.set(playerId, name, 1);
        }
      }
      await sendEmojiMessage(payload);
    }
  }
}

async function sendStickerMessage(payload) {
  const { senderId, receiverId, key, roomId, room } = payload;
  if (room) {
    await Conductor.run(
      new SendStickerCommand(),
      {
        roomId,
        senderId,
        receiverId,
        key
      },
      room
    );
  }
}

async function sendEmojiMessage(payload) {
  const { playerId, roomId, name, key, type, financial, room } = payload;

  if (key.length && room) {
    const msg = new ProvidedMessageModel();
    msg.playerId = playerId;
    msg.key = key;
    msg.name = name;
    msg.type = type;
    msg.financial = financial;

    msg.date = JSON.stringify(new Date());

    await Conductor.run(
      new SendProvidedMessageCommand(),
      {
        roomId,
        playerId,
        ...msg
      },
      room
    );
  }
}

async function sendMessage(payload) {
  const { playerId, roomId, room, message, type = 1 } = payload;
  const player = await PlayerManager.get(playerId);
  if (!player) {
    return;
  }
  const { displayName, avatar_url, frame_url, level, isVip } = player.profile;
  if (message && room) {
    const msg = new MessageModel();
    msg.id = room.messages.length; //TODO becuase we slpit message to 40 ,that id alwayes is 40
    msg.playerId = playerId;
    msg.type = type;
    msg.message = message;
    msg.displayName = displayName;
    msg.avatar = avatar_url;
    msg.frame = frame_url;
    msg.level = level;
    msg.isVip = false; //isVip;

    // msg.date = JSON.stringify(new Date());
    msg.date = Date.now();
    const index = room.messages.push(msg);
    room.messages = room.messages.slice(-40);
    await RoomManager.save(roomId, room);
    await Conductor.run(new SendChatMessageCommand(), {
      roomId,
      playerId,
      ...msg
    });
    return index;
  }
  return -1;
}

async function onJoinRoom(payload) {
  const { playerId, roomId, player } = payload;
  let room = await RoomManager.get(roomId);
  if (roomId === "laby") {
    if (player.isVip) {
      room = await joinRoom(roomId, playerId, player);
    } else {
      room = await loadRoom(roomId, playerId, player);
      if (room) {
        await Conductor.run(new LoadRoomCommand(room), payload);
      }
      return;
    }
  } else {
    room = await joinRoom(roomId, playerId, player);
  }
  if (room) {
    await Conductor.run(new JoinRoomCommand(room), payload);
  }
}

async function onLeaveRoom(payload) {
  const { playerId, roomId } = payload;
  const room = await leaveRoom(roomId, playerId);
  if (room) {
    await Conductor.run(new leaveRoomCommand(room), payload);
  }
}

async function onKickRoom(payload) {
  const { playerId, roomId } = payload;

  if (roomId) {
    const room = await RoomManager.get(roomId);
    if (room) {
      const { player } = payload;
      const playerId = player.playerId;
      const kickedPlayers = room.kickedPlayers;
      const players = room.players;
      if (
        kickedPlayers &&
        Object.hasOwn(kickedPlayers, playerId) &&
        !Object.hasOwn(players, playerId)
      ) {
        return;
      }
    }
  }

  const room = await kickFromRoom(roomId, playerId);

  if (room) {
    await Conductor.run(new kickFromRoomCommand(room), payload);
  }
}

async function onSendMatchMessage(payload) {
  const { playerId, roomId, key, query, room, maxPlayer } = payload;

  if (key.length && room) {
    const msg = new MatchMessageModel();
    msg.id = room.messages.length;
    msg.playerId = playerId;
    msg.key = key;
    msg.maxPlayer = maxPlayer;
    msg.query = query;
    msg.state = "init";
    msg.joined = 1;
    msg.date = JSON.stringify(new Date());

    room.messages.push(msg);
    await RoomManager.save(roomId, room);

    await Conductor.run(
      new SendMatchMessageCommand(),
      {
        roomId,
        playerId,
        ...msg
      },
      room
    );
  }
}

module.exports = {
  onShowMessage,
  onSendStickerMessage,
  joinRoom,
  kickFromRoom,
  loadRoom,
  getRoom,
  sendMessage,
  leaveRoom,
  removeOnlinePlayersRoom,
  addToKickedPlayersRoom,
  onGetChatMessage,
  onSendChatMessage,
  onJoinRoom,
  onLeaveRoom,
  onKickRoom,
  onSendProvidedMessage,
  onSendMatchMessage
};
