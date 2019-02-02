/**
 * Monero block.
 */
class MoneroBlock {
  
  getHex() {
    return this.hex;
  }
  
  setHex(hex) {
    this.hex = hex;
    return this;
  }
  
  getHeader() {
    return this.header;
  }
  
  setHeader(header) {
    this.header = header;
    return this;
  }
  
  getCoinbaseTx() {
    return this.coinbaseTx;
  }
  
  setCoinbaseTx(coinbaseTx) {
    this.coinbaseTx = coinbaseTx;
    return this;
  }
  
  getTxIds() {
    return this.txIds;
  }
  
  setTxIds(txIds) {
    this.txIds = txIds;
    return this;
  }
  
  getTxs() {
    return this.txs;
  }
  
  setTxs(txs) {
    this.txs = txs;
    return this;
  }
}

module.exports = MoneroBlock;