const MoneroCheck = require("./MoneroCheck");

/**
 * Results from checking a reserve proof.
 */
class MoneroCheckReserve extends MoneroCheck {
  
  getAmountSpent() {
    return this.amountSpent;
  }

  setAmountSpent(amountSpent) {
    this.amountSpent = amountSpent;
  }

  getAmountTotal() {
    return this.amountTotal;
  }

  setAmountTotal(amountTotal) {
    this.amountTotal = amountTotal;
  }
}

module.exports = MoneroCheckReserve;