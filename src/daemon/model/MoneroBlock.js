const MoneroDaemonModel = require("./MoneroDaemonModel");

/**
 * Monero block.
 */
class MoneroBlock extends MoneroDaemonModel {
  
  getHex() {
    return this.hex;
  }
  
  setHex(hex) {
    this.hex = hex;
  }
  
  getHeader() {
    return this.header;
  }
  
  setHeader(header) {
    this.header = header;
  }
  
  getCoinbaseTx() {
    return this.coinbaseTx;
  }
  
  setCoinbaseTx(coinbaseTx) {
    this.coinbaseTx = coinbaseTx;
  }
  
  getTxHashes() { // TODO: collapse with getTxs() so no redundant information?
    return this.txHashes;
  }
  
  setTxHashes(txHashes) {
    this.txHashes = txHashes;
  }
  
  getTxs() {
    return this.txs;
  }
  
  setTxs(txs) {
    this.txs = txs;
  }
}

module.exports = MoneroBlock;