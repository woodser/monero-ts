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
  
  getTxIds() {
    return this.txIds;
  }
  
  setTxIds(txIds) {
    this.txIds = txIds;
  }
  
  getTxs() {
    return this.txs;
  }
  
  setTxs(txs) {
    this.txs = txs;
  }
}

module.exports = MoneroBlock;