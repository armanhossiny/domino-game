const SendByPlayerId = require("./SendByPlayerId");
const SendToAllPlayerInRoom = async (room, payload) => {
  for (const playerId in room.onlinePlayers) {
    //const player = room.players[playerId];
    // if (!player.isLeave)
    {
      SendByPlayerId(playerId, payload).then();
    }
  }
  return room;
};

module.exports = SendToAllPlayerInRoom;
