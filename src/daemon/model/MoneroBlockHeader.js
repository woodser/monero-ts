const MoneroDaemonModel = require("./MoneroDaemonModel");

class MoneroBlockHeader extends MoneroDaemonModel {
  
  getBlockSize() {
    return this.blockSize;
  }
  
  setBlockSize(blockSize) {
    this.blockSize = blockSize;
  }
}

module.exports = MoneroBlockHeader;