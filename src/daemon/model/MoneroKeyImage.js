const MoneroUtils = require("../../utils/MoneroUtils");
const MoneroDaemonModel = require("./MoneroDaemonModel");

/**
 * Models a Monero key image.
 */
class MoneroKeyImage extends MoneroDaemonModel {
  
  /**
   * Constructs the model.
   * 
   * @param stateOrHex is model state or json to initialize from, or a key image hex string (optional)
   * @param signature is the key image's signature
   */
  constructor(stateOrHex, signature) {
    super();
    
    // initialize without state
    if (stateOrHex === undefined || typeof stateOrHex === "string") {
      this.state = {};
      this.setHex(stateOrHex);
      this.setSignature(signature);
    }
    
    // initialize from state
    else {
      this.state = Object.assign({}, stateOrHex);
    }
  }

  getHex() {
    return this.state.hex;
  }

  setHex(hex) {
    this.state.hex = hex;
  }

  getSignature() {
    return this.state.signature;
  }

  setSignature(signature) {
    this.state.signature = signature;
  }

  getSpentStatus() {
    return this.state.spentStatus;
  }

  setSpentStatus(spentStatus) {
    this.state.spentStatus = spentStatus;
  }
  
  getSpendingTxIds() {
    return this.state.spendingTxIds;
  }
  
  setSpendingTxIds(spendingTxIds) {
    this.state.spendingTxIds = spendingTxIds;
  }
  
  copy() {
    return new MoneroKeyImage(this.toJson());
  }
  
  toJson() {
    return Object.assign({}, this.state);
  }
  
  toString(indent = 0) {
    let str = "";
    str += MoneroUtils.kvLine("Hex", this.getHex(), indent);
    str += MoneroUtils.kvLine("Signature", this.getSignature(), indent);
    str += MoneroUtils.kvLine("Spent status", this.getSpentStatus(), indent);
    str += MoneroUtils.kvLine("Spending tx ids", this.getSpendingTxIds(), indent);
    return str.slice(0, str.length - 1);  // strip last newline
  }
  
  merge(keyImage) {
    assert(keyImage instanceof MoneroKeyImage);
    if (keyImage === this) return;
    this.setHex(MoneroUtils.reconcile(this.getHex(), keyImage.getHex()));
    this.setSignature(MoneroUtils.reconcile(this.getSignature(), keyImage.getSignature()));
    this.setSpentStatus(MoneroUtils.reconcile(this.getSpentStatus(), keyImage.getSpentStatus()));
    this.setSpendingTxIds(MoneroUtils.reconcile(this.getSpendingTxIds(), keyImage.getSpendingTxIds()));
  }
}

/**
 * Enumerates key image spend statuses.
 */
MoneroKeyImage.SpentStatus = {
    NOT_SPENT: 0,
    TX_POOL: 1,
    CONFIRMED: 2
}

module.exports = MoneroKeyImage;