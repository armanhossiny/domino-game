const fs = require("fs");
const path = require("path");
const { logger } = require("../Utils");
const Config = require("../Config");
const GetParseServerData = require("../Helpers/GetParseServerData");
const { process } = global;

function parseJsonFile(filename) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(process.cwd(), filename);
    if (!fs.existsSync(filePath)) {
      return reject(
        new Error(
          `File "${filename}" not found in current directory ${filePath}`
        )
      );
    }

    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        return reject(new Error(`Unable to read file: ${err.message}`));
      }

      try {
        const parsedData = JSON.parse(data);
        resolve(parsedData);
      } catch (parseError) {
        logger.error(parseError);
        reject(new Error(`Invalid JSON format: ${parseError.message}`));
      }
    });
  });
}

const onSIGUSR2 = async () => {
  await GetParseServerData();
  parseJsonFile("data.json")
    .then((data) => {
      logger.info("Successfully parsed");
      for (const key in data) {
        Config.set(key, data[key]);
      }
    })
    .catch((error) => {
      logger.error(error);
    });
  logger.info("Successfully load data");
};

module.exports = onSIGUSR2;
