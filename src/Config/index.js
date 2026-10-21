/**
 * @typedef {Object} ConfigManager
 * @property {number} maxGameSupport
 * @property {number} maxActiveJobsOnQueue
 * @property {boolean} isGameCreationEnabled
 * @property {function(string): any} get
 * @property {function(string, any): void} set
 */

class ConfigManager {
  constructor() {
    this.maxGameSupport = 1000;
    this.isGameCreationEnabled = true;
    this.isQueueFull = false;
    this.maxActiveJobsOnQueue = 50;
  }

  get(key) {
    if (key in this) {
      return this[key];
    }
    return null;
  }

  set(key, value) {
    this[key] = value;
  }

  isChatEnabled(player) {
    return true; //player.extraData.phone;
  }
}

module.exports = new ConfigManager();
