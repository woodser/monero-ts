/**
 * Models transactions and spent key images known to the daemon's transaction pool.
 */
class MoneroTxPool {
  
  getTxs() {
    return this.txs;
  }
  
  setTxs(txs) {
    this.txs = txs;
    return this;
  }
  
  getSpentKeyImages() {
    return this.spentKeyImages;
  }
  
  setSpentKeyImages(spentKeyImages) {
    this.spentKeyImages = spentKeyImages;
    return this;
  }
}

module.exports = MoneroTxPool;