const MoneroUtils = require("../../utils/MoneroUtils");

/**
 * Models a Monero key image.
 */
class MoneroKeyImage {
  
  /**
   * Constructs the model.
   * 
   * @param stateOrHex is model state or json to initialize from, or a key image hex string (optional)
   * @param signature is the key image's signature
   */
  constructor(stateOrHex, signature) {
    
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
    return this;
  }

  getSignature() {
    return this.state.signature;
  }

  setSignature(signature) {
    this.state.signature = signature;
    return this;
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
    return str.slice(0, str.length - 1);  // strip last newline
  }
  
  merge(keyImage) {
    assert(keyImage instanceof MoneroKeyImage);
    if (keyImage === this) return;
    this.setHex(MoneroUtils.reconcile(this.getHex(), keyImage.getHex()));
    this.setSignature(MoneroUtils.reconcile(this.getSignature(), keyImage.getSignature()));
    return this;
  }
}

/**
 * Enumerates key image spent statuses.
 */
MoneroKeyImage.SpentStatus = {
    NOT_SPENT: 0,
    CONFIRMED: 1,
    TX_POOL: 2
}

module.exports = MoneroKeyImage;