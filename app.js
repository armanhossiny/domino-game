require("dotenv").config();
const PQueue = require("p-queue").default;
const { ParseServerConfigs } = require("./src/Consts");
const redisUtils = require("./src/Utils/redis");
const ioredis = require("ioredis");
const EventHandler = require("./eventHandler");
const { runServer } = require("./src/Core");
const { initParseServer } = require("./src/Services");
const { onUncaughtException, onSIGUSR2 } = require("./src/MiddleWares");
const { process } = global;
const { logger } = require("./src/Utils");
const GetParseServerData = require("./src/Helpers/GetParseServerData");
const { ValidationError } = require("./src/Utils/CustomError");

const PQUEUE_TIMEOUT = process.env.NODE_ENV === "development" ? 5000000 : 2000;

const redisConfig = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || "6379",
  db: process.env.REDIS_DB || 0
};

const redisQueueConfig = {
  host: process.env.QUEUE_REDIS_HOST || "127.0.0.1",
  port: process.env.QUEUE_REDIS_PORT || "6379",
  db: process.env.QUEUE_REDIS_DB || 0
};

function getQueueConnection() {
  const envNodes =
    process.env.BULL_REDIS_CLUSTER_NODES ||
    `[{"host":"127.0.0.1","port":6379,"db":1}]`;
  const nodes = JSON.parse(envNodes);

  const commonRedisOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      logger.warn(`Redis retry attempt ${times}, waiting ${delay}ms`);
      return delay;
    },
    reconnectOnError(err) {
      logger.error("Redis connection error:", err);
      return true;
    }
  };

  if (nodes.length > 1) {
    return new ioredis.Cluster(nodes, {
      scaleReads: "master",
      enableReadyCheck: true,
      maxRedirections: 16,
      retryDelayOnFailover: 100,
      retryDelayOnClusterDown: 200,
      retryDelayOnTryAgain: 100,
      clusterRetryStrategy: (times) => {
        const delay = Math.min(times * 100, 3000);
        logger.warn(`[redis-cluster] retry #${times}, delay ${delay}ms`);
        return delay;
      },
      redisOptions: {
        ...commonRedisOptions,
        maxRetriesPerRequest: null
      }
    });
  }

  return new ioredis(nodes[0], commonRedisOptions);
}

function t(label) {
  const start = Date.now();
  return () => {
    if (Date.now() - start > 0) {
      logger.info(`${label}`, Date.now() - start, "ms");
    }
  };
}

/**
 * init parse server
 */
initParseServer(ParseServerConfigs);
logger.info(`try to connect Parse server:${ParseServerConfigs.PARSE_SERVER}`);

redisUtils.connect().then();

const queues = new Map();

async function processJobs(job) {
  if (!job) {
    logger.warn("job not exist");
    return;
  }
  const data = job.data;
  const { payload, method } = data;
  const { gameId, roomId } = payload;

  const key =
    gameId || roomId || (method === "joinMatch" && "joinMatch") || null;
  if (!key) {
    try {
      //const end = t(`EventHandler:${method}`);
      await EventHandler(data);
      //end();
    } catch (error) {
      throw new ValidationError(error.message);
    }
    return;
  }

  if (!queues.has(key)) {
    const queue = new PQueue({
      concurrency: 1,
      timeout: PQUEUE_TIMEOUT
    });
    queue.on("idle", () => {
      setTimeout(() => {
        if (queue.size === 0 && queue.pending === 0) {
          queues.delete(key);
        }
      }, 5000);
    });
    queues.set(key, queue);
  }

  const queue = queues.get(key);
  try {
    await queue.add(async () => {
      //const end = t(`EventHandler:${method}`);
      await EventHandler(data);
      //end();
    });
  } catch (error) {
    throw new ValidationError(error.message);
  }
}

/**
 * init server and run
 */
const initServer = async () => {
  logger.info("Start Core!");
  const processId = process.env.pm_id;
  logger.info(`Current PM2 process ID: ${processId}`);
  await GetParseServerData();

  logger.info("try to connect ....");
  logger.info(`redis host:${redisQueueConfig.host}`);
  logger.info(`redis port:${redisQueueConfig.port}`);
  logger.info(`redis db:${redisQueueConfig.db}`);

  const connection = getQueueConnection();
  await runServer(connection, redisQueueConfig, processJobs);
};

initServer()
  .catch((error) => {
    logger.error({
      message: "initServer",
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  })
  .then();

process.on("uncaughtException", onUncaughtException);
process.on("SIGUSR2", onSIGUSR2);
