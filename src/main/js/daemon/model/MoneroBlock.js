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
    
    // deserialize miner tx
    if (state.minerTx && !(state.minerTx instanceof MoneroTx)) state.minerTx = new MoneroTx(state.minerTx).setBlock(this);
    
    // deserialize non-miner txs
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
  
  getMinerTx() {
    return this.state.minerTx;
  }
  
  setMinerTx(minerTx) {
    this.state.minerTx = minerTx;
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
    if (this.getMinerTx()) json.minerTx = this.getMinerTx().toJson();
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
    this.setHex(GenUtils.reconcile(this.getHex(), block.getHex()));
    this.setTxIds(GenUtils.reconcile(this.getTxIds(), block.getTxIds()));
    
    // merge miner tx
    if (this.getMinerTx() === undefined) this.setMinerTx(block.getMinerTx());
    if (block.getMinerTx() !== undefined) {
      block.getMinerTx().setBlock(this);
      minerTx.merge(block.getMinerTx());
    }
    
    // merge non-miner txs
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
    str += GenUtils.kvLine("Hex", this.getHex(), indent);
    if (this.getTxs()) {
      str += GenUtils.kvLine("Txs", "", indent);
      for (let tx of this.getTxs()) {
        str += tx.toString(indent + 1) + "\n";
      }
    }
    if (this.getMinerTx()) {
      str += GenUtils.kvLine("Miner tx", "", indent);
      str += this.getMinerTx().toString(indent + 1) + "\n";
    }
    str += GenUtils.kvLine("Txs ids", this.getTxIds(), indent);
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