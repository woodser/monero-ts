const MoneroTx = require("../../wallet/model/MoneroTx");

/**
 * Represents a miner tx in a block.
 */
class MoneroMinerTx extends MoneroTx {
  
  getVersion() {
    return this.version;
  }
  
  setVersion(version) {
    this.version = version;
  }
  
  getExtra() {
    return this.extra;
  }
  
  setExtra(extra) {
    this.extra = extra;
  }
}

module.exports = MoneroMinerTx;