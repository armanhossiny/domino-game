const { GetGamesTableInfoParse } = require("../Services");
const { logger } = require("../Utils");
const { S_START_PARSE_ERROR } = require("../Strings");
const { TableManager } = require("../Base/Manager");
const { ValidationError } = require("../Utils/CustomError");

async function GetInfoTablesFromParseServer() {
  const allGameTablesInfo = await GetGamesTableInfoParse();
  logger.info("All Table Got!");

  await TableManager.delAllGameTablesInfo();

  if (!Object.keys(allGameTablesInfo).length) {
    throw new ValidationError(`${S_START_PARSE_ERROR}_GET_TABLE_INFO`);
  }

  const props = Object.keys(allGameTablesInfo);
  for (const name of props) {
    Object.assign(allGameTablesInfo[name], { online: 0 });
    await TableManager.addGameTableInfo(name, allGameTablesInfo[name]);
  }
}

module.exports = GetInfoTablesFromParseServer;
