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
  
  getConfirmationCount() {
    return this.confirmationCount;
  }
  
  setConfirmationCount(confirmationCount) {
    this.confirmationCount = confirmationCount;
  }
  
  getAmountReceived() {
    return this.amountReceived;
  }
  
  setAmountReceived(amountReceived) {
    this.amountReceived = amountReceived;
  }
}

module.exports = MoneroCheckTx;