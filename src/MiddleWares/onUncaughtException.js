const fs = require("fs");
const logger = require("../Utils/logger");
const { ValidationError } = require("../Utils/CustomError");

const { process } = global;

const onUncaughtException = (err) => {
  const error = err.message + "\n" + err.stack + "\n";
  logger.error({
    message: "Redis reconnect on error:"
  });
  const date = new Date();
  const strDate =
    date.getFullYear() + "_" + date.getMonth() + "_" + date.getDay();
  fs.appendFile(
    "./log/ErrorLog_" + strDate + ".log",
    error,
    "utf8",
    (errorFile) => {
      if (errorFile) {
        throw new ValidationError("errorFile");
      }
      logger.error({
        message: "Saved error log file!",
        error: error.message,
        stack: error.stack
      });
    }
  );

  process.exit();
};

module.exports = onUncaughtException;
