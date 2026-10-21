const Parse = require("parse/node");
/**
 * Initialize of parse server to connect it.

 * @param config
 */
const initParseServer = (config) => {
  const { PARSE_SERVER, APPLICATION_ID, JAVASCRIPT_KEY, MASTER_KEY } = config;

  Parse.initialize(APPLICATION_ID, JAVASCRIPT_KEY, MASTER_KEY);

  Parse.serverURL = PARSE_SERVER;
};

module.exports = initParseServer;
