const Draw = require("./Draw");

class Block extends Draw {
  constructor(data) {
    super(data);
  }

  initPlayersHand() {
    super.initPlayersHand();

    this.bank = [];
    this.state.bankSize = this.bank.length;
  }
}

module.exports = Block;
