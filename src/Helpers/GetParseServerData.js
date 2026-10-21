const GetInfoTablesFromParseServer = require("./GetTablesInfo");

const logger = require("../Utils/logger");

async function GetParseServerData() {
  logger.info("===================================");
  logger.info("Start get data of parse server ...!");

  await GetInfoTablesFromParseServer();


  logger.info("End get data of parse server ...!");
  logger.info("===================================");
}

module.exports = GetParseServerData;
