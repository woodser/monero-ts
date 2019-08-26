const MoneroCheck = require("./MoneroCheck");

/**
 * Results from checking a transaction key.
 */
class MoneroCheckTx extends MoneroCheck {
  
  constructor() {
    this.state.state = {};
  }

  getInTxPool() {
    return this.state.inTxPool;
  }
  
  setInTxPool(inTxPool) {
    this.state.inTxPool = inTxPool;
    return this;
  }
  
  getNumConfirmations() {
    return this.state.numConfirmations;
  }
  
  setNumConfirmations(numConfirmations) {
    this.state.numConfirmations = numConfirmations;
    return this;
  }
  
  getReceivedAmount() {
    return this.state.receivedAmount;
  }
  
  setReceivedAmount(receivedAmount) {
    this.state.receivedAmount = receivedAmount;
    return this;
  }
}

module.exports = MoneroCheckTx;