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
  
  getConfirmationCount() {
    return this.confirmationCount;
  }
  
  setConfirmationCount(confirmationCount) {
    this.confirmationCount = confirmationCount;
    return this;
  }
  
  getAmountReceived() {
    return this.amountReceived;
  }
  
  setAmountReceived(amountReceived) {
    this.amountReceived = amountReceived;
    return this;
  }
}

module.exports = MoneroCheckTx;