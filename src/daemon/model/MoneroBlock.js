const MoneroDaemonModel = require("./MoneroDaemonModel");

/**
 * Monero block.
 */
class MoneroBlock extends MoneroDaemonModel {
  
  getBlob() {
    return this.blob;
  }
  
  setBlob(blob) {
    this.blob = blob;
  }
  
  getHeader() {
    return this.header;
  }
  
  setHeader(header) {
    this.header = header;
  }
  
  getMinerTx() {
    return this.minerTx;
  }
  
  setMinerTx(minerTx) {
    this.minerTx = minerTx;
  }
  
  getTxHashes() {
    return this.txHashes;
  }
  
  setTxHashes(txHashes) {
    this.txHashes = txHashes;
  }
}

module.exports = MoneroBlock;