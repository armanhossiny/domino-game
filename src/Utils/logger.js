const winston = require("winston");
const { ValidationError } = require("./CustomError");

const { process } = global;
const level = process.env.NODE_ENV === "development" ? "debug" : "info";

const ValidationErrorFormat = winston.format((log) => {
  if (log.level !== "error") {
    return log;
  }
  if (log.isOperational) {
    log.level = "warn";
  }
  return log;
});

const logger = winston.createLogger({
  level,
  format: winston.format.combine(
    ValidationErrorFormat(),
    winston.format.timestamp({ format: "HH:mm:ss" }),
    winston.format.printf((info) => {
      const { timestamp, level, message, stack, error, ...meta } = info;

      let logOutput = `[${timestamp}] [${level.toUpperCase()}]: ${message}`;

      if (error) {
        logOutput += `\n    Error Message: ${error}`;
      }

      if (Object.keys(meta).length > 0) {
        logOutput += `\n    Additional Data: ${JSON.stringify(meta, null, 2)}`;
      }

      if (stack) {
        logOutput += `\n    Stack Trace:\n${stack}`;
      }

      return logOutput;
    })
  ),
  transports: [new winston.transports.Console()]
});

module.exports = logger;
