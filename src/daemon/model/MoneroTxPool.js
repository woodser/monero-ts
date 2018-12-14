const MoneroDaemonModel = require("./MoneroDaemonModel");

/**
 * Models transactions and spent key images known to the daemon's transaction pool.
 */
class MoneroTxPool extends MoneroDaemonModel {
  
  getTxs() {
    return this.txs;
  }
  
  setTxs(txs) {
    this.txs = txs;
  }
  
  getSpentKeyImages() {
    return this.spentKeyImages;
  }
  
  setSpentKeyImages(spentKeyImages) {
    this.spentKeyImages = spentKeyImages;
  }
}

module.exports = MoneroTxPool;