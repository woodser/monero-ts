/**
 * Monero block.
 */
class MoneroBlock {
  
  getHeader() {
    return this.header;
  }
  
  setHeader(header) {
    this.header = header;
    return this;
  }
  
  getHex() {
    return this.hex;
  }
  
  setHex(hex) {
    this.hex = hex;
    return this;
  }
  
  getCoinbaseTx() {
    return this.coinbaseTx;
  }
  
  setCoinbaseTx(coinbaseTx) {
    this.coinbaseTx = coinbaseTx;
    return this;
  }
  
  getTxs() {
    return this.txs;
  }
  
  setTxs(txs) {
    this.txs = txs;
    return this;
  }
  
  getTxIds() {
    return this.txIds;
  }
  
  setTxIds(txIds) {
    this.txIds = txIds;
    return this;
  }
}

module.exports = MoneroBlock;