/**
 * Models an outgoing transaction from the wallet.
 */
class MoneroTxOutgoing extends MoneroTxWallet {
  
  /**
   * Constructs the model.
   * 
   * @param json is an existing JSON model to initialize from (optional)
   */
  constructor(json) {
    super(json);
    this.json = json ? json : {};
  }
  
  getSrcAccountIndex() {
    return this.json.srcAccountIndex;
  }
  
  setSrcAccountIndex(srcAccountIndex) {
    this.json.srcAccountIndex = srcAccountIndex;
  }
  
  getSrcSubaddrIndex() {
    return this.json.srcSubaddrIndex;
  }
  
  setSrcSubaddrIndex(srcSubaddrIndex) {
    this.json.srcSubaddrIndex = srcSubaddrIndex;
  }
  
  getSrcAddress() {
    return this.json.srcAddress;
  }
  
  setSrcAddress(srcAddress) {
    this.json.srcAddress = srcAddress;
  }
}

module.exports = MoneroTxOutgoing;