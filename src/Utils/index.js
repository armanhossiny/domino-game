const Config = require("../Config");
const logger = require("./logger");
const { AccessToken, TrackSource } = require("livekit-server-sdk");
const apiKey = "APISsaYFkBTeW6t";
const apiSecret = "fQF4F2ZHc51x7LclbFcz5oNMHDKb70MiPfvTeLVquU6B";

const Utils = {
  guid: () => {
    return (Math.random() + 1).toString(36).substring(6);
  }
};

async function generateToken(player, roomId) {
  const { playerId } = player;

  if (!Config.isChatEnabled(player)) {
    return "PlayerNotHavePhone";
  }

  const token = new AccessToken(apiKey, apiSecret, {
    identity: playerId,
    ttl: 360000,
    metadata: JSON.stringify({ role: "player" })
  });

  token.addGrant({
    room: roomId,
    roomJoin: true, // Required to join the room
    canPublish: true, // Required to send audio
    canSubscribe: true, // Required to receive others' audio
    roomCreate: true, // If you want to allow room creation
    roomList: false, // Typically not needed
    roomRecord: false, // If you don't need recording
    roomAdmin: false, // If not an admin
    ingressAdmin: false, // If not managing ingress
    canPublishSources: [TrackSource.MICROPHONE], // Restrict to audio only
    canUpdateOwnMetadata: true // Allow name changes
  });
  return await token.toJwt();
}

module.exports = {
  logger,
  generateToken,
  guid: Utils.guid
};
