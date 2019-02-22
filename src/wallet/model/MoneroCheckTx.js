const MoneroCheck = require("./MoneroCheck");

/**
 * Results from checking a transaction key.
 */
class MoneroCheckTx extends MoneroCheck {

  getInTxPool() {
    return this.inTxPool;
  }
  
  setInTxPool(inTxPool) {
    this.inTxPool = inTxPool;
    return this;
  }
  
  getNumConfirmations() {
    return this.numConfirmations;
  }
  
  setNumConfirmations(numConfirmations) {
    this.numConfirmations = numConfirmations;
    return this;
  }
  
  getReceivedAmount() {
    return this.receivedAmount;
  }
  
  setReceivedAmount(receivedAmount) {
    this.receivedAmount = receivedAmount;
    return this;
  }
}

module.exports = MoneroCheckTx;