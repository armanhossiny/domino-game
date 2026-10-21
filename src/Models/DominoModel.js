class DominoModel {
  constructor(obj = {}) {
    const { left = -1, right = -1 } = obj;

    this.left = left;
    this.right = right;
  }

  isPair() {
    return this.left === this.right;
  }
}

module.exports = DominoModel;
