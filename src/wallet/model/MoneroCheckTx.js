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