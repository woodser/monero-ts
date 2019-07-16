const assert = require("assert");
const MoneroUtils = require("../../utils/MoneroUtils");
const MoneroTx = require("./MoneroTx");
const MoneroBlockHeader = require("./MoneroBlockHeader");

/**
 * Models a Monero block in the blockchain.
 */
class MoneroBlock extends MoneroBlockHeader {
  
  /**
   * Construct the model.
   * 
   * @param {MoneroBlock|MoneroBlockHeader|object} state is existing state to initialize from (optional)
   */
  constructor(state) {
    super(state);
    state = this.state;
    
    // deserialize coinbase tx
    if (state.coinbaseTx && !(state.coinbaseTx instanceof MoneroTx)) state.coinbaseTx = new MoneroTx(state.coinbaseTx).setBlock(this);
    
    // deserialize non-coinbase txs
    if (state.txs) {
      for (let i = 0; i < state.txs.length; i++) {
        if (!(state.txs[i] instanceof MoneroTx)) state.txs[i] = new MoneroTx(state.txs[i]).setBlock(this);
      }
    }
  }
  
  getHex() {
    return this.state.hex;
  }
  
  setHex(hex) {
    this.state.hex = hex;
    return this;
  }
  
  getCoinbaseTx() {
    return this.state.coinbaseTx;
  }
  
  setCoinbaseTx(coinbaseTx) {
    this.state.coinbaseTx = coinbaseTx;
    return this;
  }
  
  getTxs() {
    return this.state.txs;
  }
  
  setTxs(txs) {
    this.state.txs = txs;
    return this;
  }
  
  getTxIds() {
    return this.state.txIds;
  }
  
  setTxIds(txIds) {
    this.state.txIds = txIds;
    return this;
  }
  
  copy() {
    return new MoneroBlock(this);
  }
  
  toJson() {
    let json = super.toJson();
    if (this.getCoinbaseTx()) json.coinbaseTx = this.getCoinbaseTx().toJson();
    if (this.getTxs()) {
      json.txs = [];
      for (let tx of this.getTxs()) json.txs.push(tx.toJson());
    }
    return json;
  }
  
  merge(block) {
    assert(block instanceof MoneroBlock);
    if (this === block) return this;
    
    // merge header fields
    super.merge(block);
    
    // merge reconcilable block extensions
    this.setHex(MoneroUtils.reconcile(this.getHex(), block.getHex()));
    this.setTxIds(MoneroUtils.reconcile(this.getTxIds(), block.getTxIds()));
    
    // merge coinbase tx
    if (this.getCoinbaseTx() === undefined) this.setCoinbaseTx(block.getCoinbaseTx());
    if (block.getCoinbaseTx() !== undefined) {
      block.getCoinbaseTx().setBlock(this);
      coinbaseTx.merge(block.getCoinbaseTx());
    }
    
    // merge non-coinbase txs
    if (block.getTxs() !== undefined) {
      for (let tx of block.getTxs()) {
        tx.setBlock(this);
        MoneroBlock._mergeTx(this.getTxs(), tx);
      }
    }

    return this;
  }
  
  toString(indent = 0) {
    let str = super.toString(indent) + "\n";
    if (this.getCoinbaseTx()) {
      str += MoneroUtils.kvLine("Coinbase tx", "", indent);
      str += this.getCoinbaseTx().toString(indent + 1) + "\n";
    }
    str += MoneroUtils.kvLine("Hex", this.getHex(), indent);
    if (this.getTxs()) {
      str += MoneroUtils.kvLine("Txs", "", indent);
      for (let tx of this.getTxs()) {
        str += tx.toString(indent + 1) + "\n";
      }
    }
    str += MoneroUtils.kvLine("Txs ids", this.getTxIds(), indent);
    return str[str.length - 1] === "\n" ? str.slice(0, str.length - 1) : str  // strip last newline
  }
  
  // private helper to merge txs
  static _mergeTx(txs, tx) {
    for (let aTx of txs) {
      if (aTx.getId() === tx.getId()) {
        aTx.merge(tx);
        return;
      }
    }
    txs.push(tx);
  }
}

module.exports = MoneroBlock;