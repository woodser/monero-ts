const MoneroCheck = require("./MoneroCheck");

/**
 * Results from checking a transaction key.
 */
class MoneroCheckTx extends MoneroCheck {

  getInPool() {
    return this.inPool;
  }
  
  setInPool(inPool) {
    this.inPool = inPool;
  }
  
  getNumConfirmations() {
    return this.numConfirmations;
  }
  
  setNumConfirmations(numConfirmations) {
    this.numConfirmations = numConfirmations;
  }
  
  getAmountReceived() {
    return this.amountReceived;
  }
  
  setAmountReceived(amountReceived) {
    this.amountReceived = amountReceived;
  }
}

module.exports = MoneroCheckTx;