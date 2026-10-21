const { createClient } = require("redis");
const process = require("process");
const { logger } = require("../Utils");

const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = process.env.REDIS_PORT || "6379";
const REDIS_DB = process.env.REDIS_DB || "0";
const REDIS_URL = `redis://${REDIS_HOST}:${REDIS_PORT}/${REDIS_DB}`;

const client = createClient({
  url: REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      const delay = Math.min(retries * 1000, 30000);
      logger.warn({
        message: "Redis reconnecting...",
        attempt: retries,
        delay: `${delay}ms`
      });
      return delay;
    },
    connectTimeout: 10000,
    keepAlive: 30000
  }
});

client.on("error", (err) => {
  logger.error({
    message: "Redis connection",
    error: err.message,
    stack: err.stack
  });
});

client.on("connect", () => {
  logger.info("Connected to Redis!");
});

module.exports = client;
