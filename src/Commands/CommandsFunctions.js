const Strings = require("../Strings");
const Network = require("../Network");
const { GroupModel } = require("../Models");
const PlayerHandler = require("../Handler/PlayerHandler");

const { sendEndGameParse } = require("../Services");
const Conductor = require("./Conductor");
const ActivePlayerCommand = require("../Commands/ActivePlayerCommand");

const broadcastToRoom = async function (room, payload, addCounter) {
  return await Network.SendToAllPlayerInRoom(room, payload, addCounter).then();
};

const broadcastToGame = async function (game, payload, addCounter) {
  return await Network.SendToAllPlayerInGame(game, payload, addCounter).then();
};

const broadcastAddState = async function (
  game,
  payload,
  playerId = "",
  privatePayload = {}
) {
  if (payload.method === "") {
    payload.method = Strings.MT_LAST_STATE;
  }
  game.req++;
  payload.req = game.req;

  const autoCount = {};
  for (const key in game.state.autoCount) {
    autoCount[key] = game.state.autoCount[key];
  }

  for (const key in game.players) {
    const player = game.players[key];
    if (!player.isLeave) {
      const playerPayload = JSON.parse(JSON.stringify(payload));
      const _payload = playerPayload.payload;
      _payload.gameId = game.gameId;
      if (playerId.length && player.playerId === playerId) {
        for (const pKey in privatePayload) {
          _payload.info[pKey] = privatePayload[pKey];
        }
      }
      _payload.state = {};
      Object.assign(_payload.state, game.state);

      delete _payload.state.leftDomino;
      delete _payload.state.rightDomino;
      delete _payload.state.topDomino;
      delete _payload.state.downDomino;
      delete _payload.state.centerDomino;
      delete _payload.state.historyBoard;
      delete _payload.state.isEnded;
      delete _payload.state.isAddFirstPairDomino;
      delete _payload.state.isWaiting;

      delete _payload.state.waitingForRematchCounter;
      delete _payload.state.autoCount;
      delete _payload.state.showBank;
      delete _payload.state.kingSet;
      delete _payload.state.winnerSet;

      _payload.state.autoCount = autoCount;
      _payload.hand = player.hand;
      _payload.players = {};

      for (const pKey in game.players) {
        const _player = game.players[pKey];
        _payload.players[_player.playerId] = {
          handCount: _player.hand.length,
          delayTime: _player.delayTime,
          timer: _player.timer
        };
      }
      Network.SendByPlayerId(player.playerId, playerPayload).then();
    }
  }
  return game;
};

const initGrouping = function (game) {
  const array = [...Object.keys(game.players)];
  if (array.length === 4) {
    const group1 = new GroupModel();
    group1.inRoundPlayed = false;
    group1.isPlayedWithDomino = false;
    group1.index = 0;
    group1.players.push(array[0]);
    group1.players.push(array[2]);
    game.players[array[0]].groupIndex = 0;
    game.players[array[2]].groupIndex = 0;

    const group2 = new GroupModel();
    group2.inRoundPlayed = false;
    group2.isPlayedWithDomino = false;
    group2.index = 1;
    group2.players.push(array[1]);
    group2.players.push(array[3]);
    game.players[array[1]].groupIndex = 1;
    game.players[array[3]].groupIndex = 1;

    game.groups.push(group1);
    game.groups.push(group2);
  } else if (array.length === 2) {
    const group1 = new GroupModel();
    group1.inRoundPlayed = false;
    group1.index = 0;
    group1.players.push(array[0]);
    game.players[array[0]].groupIndex = 0;

    const group2 = new GroupModel();
    group2.inRoundPlayed = false;
    group2.index = 1;
    group2.players.push(array[1]);
    game.players[array[1]].groupIndex = 1;

    game.groups.push(group1);
    game.groups.push(group2);
  }
};

const setEndGameParse = async function (game) {
  const winners = [];
  const losers = [];

  const team1 = game.groups[0];
  const team2 = game.groups[1];

  let group0_ids = "";
  team1.players.forEach((playerId) => {
    if (group0_ids.length) {
      group0_ids += " , " + playerId;
    } else {
      group0_ids += playerId;
    }
  });

  let group1_ids = "";
  team2.players.forEach((playerId) => {
    if (group1_ids.length) {
      group1_ids += " , " + playerId;
    } else {
      group1_ids += playerId;
    }
  });

  if (team1.leave) {
    team2.players.forEach((playerId) => {
      winners.push(playerId);
    });
    team1.players.forEach((playerId) => {
      losers.push(playerId);
    });
  } else if (team2.leave) {
    team1.players.forEach((playerId) => {
      winners.push(playerId);
    });
    team2.players.forEach((playerId) => {
      losers.push(playerId);
    });
  } else if (team1.isWinnerGame) {
    team1.players.forEach((playerId) => {
      winners.push(playerId);
    });
    team2.players.forEach((playerId) => {
      losers.push(playerId);
    });
  } else if (team2.isWinnerGame) {
    team2.players.forEach((playerId) => {
      winners.push(playerId);
    });
    team1.players.forEach((playerId) => {
      losers.push(playerId);
    });
  }

  const dataToSend = {
    matchId: game.objectId,
    winners,
    losers,
    data: JSON.stringify({
      info: {
        winners,
        losers,
        set: game.state.set,
        table: {
          tableKey: game.table.key,
          maxSet: game.table.maxSet,
          maxScore: game.table.maxScore
        }
      },
      team1: team1,
      team2: team2
    }),
    tournament: game.tournament || []
  };
  //logger.debug("=====>dataToSend: ", dataToSend);

  const keys = Object.keys(game.players);

  // for (const playerId of keys) {
  //   const player = await PlayerHandler.get(playerId);
  //   if (player) {
  //     await PlayerHandler.updateUserInParseServer(playerId, player);
  //   }
  // }

  const result = await sendEndGameParse(dataToSend);

  if (result?.success !== true || !Array.isArray(result.data)) {
    throw new Error("MATCH_SETTLEMENT_NOT_CONFIRMED");
  }

  let userData = [];
  if (result) {
    const { data } = result;
    if (data) {
      userData = data;
    }
  }

  return userData;
};

const memoryUsage = function (memoryData) {
  return JSON.parse(
    JSON.stringify({
      //rss: `${formatMemoryUsage(memoryData.rss)} -> Resident Set Size - total memory allocated for the process
      // execution`, heapTotal: `${formatMemoryUsage(memoryData.heapTotal)} -> total size of the allocated heap`,
      // heapUsed: `${formatMemoryUsage(memoryData.heapUsed)} -> actual memory used during the execution`, external:
      // `${formatMemoryUsage(memoryData.external)} -> V8 external memory`,

      heapUsed: `${formatMemoryUsage(memoryData.heapUsed)}`
    })
  );

  // return (`{ `+
  //     //rss: `${formatMemoryUsage(memoryData.rss)} -> Resident Set Size - total memory allocated for the process
  // execution`, //heapTotal: `${formatMemoryUsage(memoryData.heapTotal)} -> total size of the allocated heap`,
  // //heapUsed: `${formatMemoryUsage(memoryData.heapUsed)} -> actual memory used during the execution`, //external:
  // `${formatMemoryUsage(memoryData.external)} -> V8 external memory`,  `heapUsed:
  // ${formatMemoryUsage(memoryData.heapUsed)}`+ ` }`);
};

const formatMemoryUsage = (data) =>
  `${Math.round((data / 1024 / 1024) * 100) / 100} MB`;

async function updateActiveState(_payload) {
  const { game, player, playerId, gameId, fromClient } = _payload;

  if (fromClient) {
    player.inRoundPlayed = true;
    player.isPlayedWithDomino = true;
    if (!player.isActive) {
      player.isActive = true;

      await Conductor.run(
        new ActivePlayerCommand(),
        { gameId, playerId },
        game
      );
    }
  }
}

module.exports = {
  broadcastToGame,
  broadcastToRoom,
  broadcastAddState,
  formatMemoryUsage,
  initGrouping,
  memoryUsage,
  setEndGameParse,
  updateActiveState
};
