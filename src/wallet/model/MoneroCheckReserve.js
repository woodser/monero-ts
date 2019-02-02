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
    return this;
  }

  getAmountTotal() {
    return this.amountTotal;
  }

  setAmountTotal(amountTotal) {
    this.amountTotal = amountTotal;
    return this;
  }
}

module.exports = MoneroCheckReserve;