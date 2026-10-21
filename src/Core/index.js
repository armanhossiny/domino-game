"use strict";
const redis = require("redis");
const { Worker, Queue } = require("bullmq");
const { process } = global;
const { logger } = require("../Utils");
const { RedisKeys } = require("../Consts");
const os = require("os");
const { createClient } = require("redis");

const CONNECTION_KEY = "Domino:cons";
const ALL_GAMES_ID = RedisKeys.ALL_GAMES_ID;

const channels = new Map();
let redisConnectionConfig = null;
let redisClient = null;
let queueConnection = null;

async function initRedisPublisher(config) {
  redisConnectionConfig = config;
}

function initQueueConnection(connection) {
  queueConnection = connection;
}

async function initRedisClient(config) {
  redisClient = redis.createClient({
    url: `redis://${config.host}:${config.port}/${config.db}`,
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
  redisClient.on("error", (err) => {
    logger.error({
      message: "Redis reconnect on error:",
      error: err.message,
      stack: err.stack
    });
  });
  redisClient.connect().then(() => logger.info("redisClient connect!"));
}

let jobProcessor = null;

const NODE_ENV =
  process.env.NODE_ENV === "production" ? "production" : "develop";
const ProcessId = process.env.pm_id || "develop";
const host = os.hostname();
const queueName = `${host}_${ProcessId}`;
const WORKERS_KEY = "Domino:Workers";
let worker = null;
let queue = null;

async function registerQueue(config) {
  logger.info(`Registering queue: ${queueName}`);
  queue = new Queue(queueName, {
    connection: queueConnection,
    prefix: `{${queueName}}`
  });
  worker = new Worker(
    queueName,
    async (job) => {
      const age = Date.now() - job.timestamp; // محاسبه سن جاب به میلی‌ثانیه

      if (age > 6000) {
        logger.warn("dont process old jobs");
        return;
      }
      await jobProcessor(job);
    },
    {
      connection: queueConnection,
      concurrency: 10,
      prefix: `{${queueName}}`,
      removeOnComplete: { count: 0 },
      removeOnFail: { count: 50 }
    }
  );
}

async function registerHeartBeatService() {
  if (!redisClient) {
    logger.error({
      message: "Redis reconnect on error:"
    });
    return;
  }
  const now = Date.now();
  await redisClient.zAdd(WORKERS_KEY, {
    score: now,
    value: queueName
  });
  logger.info("update Workers Time");
}

async function getQueueMessageCount() {
  if (!worker || !queue) {
    return;
  }

  const jobCounts = await queue.getJobCounts();
  const messageCount = jobCounts.waiting;
  //console.log(`messageCount :${messageCount} ......................................`);
  const job = {
    method: "QueueMessageCount",
    payload: { messageCount }
  };
  queue.add(queueName, job);
}

async function pushMessageToQueue(message) {
  if (!worker || !queue) {
    return;
  }
  queue.add(queueName, message);
}

const runServer = async (QueueConnection, redisQueueConfig, _jobProcessor) => {
  jobProcessor = _jobProcessor;
  initQueueConnection(QueueConnection);
  await initRedisClient(redisQueueConfig);
  await initRedisPublisher(redisQueueConfig);
  await registerQueue(redisQueueConfig);
  await registerHeartBeatService();
  setInterval(registerHeartBeatService, 1000 * 60);
  setInterval(getQueueMessageCount, 5000);
};

function getQueueWithName(name) {
  let _queue = channels.get(name);
  if (!_queue) {
    _queue = new Queue(name, {
      connection: queueConnection,
      prefix: `{${name}}`
    });
    channels.set(name, _queue);
  }

  return _queue;
}

const publishMessage = async (playerId, payload) => {
  const chanel = await redisClient.get(`${CONNECTION_KEY}:${playerId}`);
  if (!chanel) {
    logger.warn("worker not found  channel", {
      playerId,
      payload: JSON.stringify(payload),
      CONNECTION_KEY
    });
    return;
  }

  const _queue = getQueueWithName(chanel);
  _queue.add(chanel, { playerId, payload });
};

async function pairPlayerWorker(payload) {
  const { playerId, queue } = payload;
  if (playerId && queue) {
    const key = `${CONNECTION_KEY}:${playerId}`;
    await redisClient.set(key, queue, { EX: 60 * 60 * 3 });
  }
}

async function addGame(gameId) {
  const nextTick = Date.now();
  await redisClient.zAdd(`${ALL_GAMES_ID}`, {
    score: nextTick,
    value: gameId
  });

  const workers = await redisClient.zRange(WORKERS_KEY, 0, -1);
  const rndWorker = workers[Math.floor(Math.random() * workers.length)];
  const randomQueue = getQueueWithName(rndWorker);

  const MaxTick = 3;
  const data = {
    gameId,
    method: "tick",
    payload: { gameId, MaxTick }
  };

  await randomQueue.upsertJobScheduler(
    `repeat-${gameId}`,
    {
      every: MaxTick * 1000
    },
    {
      name: gameId,
      data,
      opts: {
        removeOnComplete: true
      }
    }
  );
}

async function removeGame(gameId) {
  await redisClient.zRem(`${ALL_GAMES_ID}`, gameId);

  if (!queue) {
    return;
  }
  await queue.removeJobScheduler(`repeat-${gameId}`);
}

async function getGameCount() {
  const count = await redisClient.zCard(`${ALL_GAMES_ID}`);
  return Number(count);
}

async function getAllGames() {
  return await redisClient.zRange(`${ALL_GAMES_ID}`, 0, -1);
}

module.exports = {
  runServer,
  pairPlayerWorker,
  pushMessageToQueue,
  publishMessage,
  addGame,
  removeGame,
  getGameCount,
  getAllGames
};
