const MoneroCheck = require("./MoneroCheck");

/**
 * Results from checking a reserve proof.
 */
class MoneroCheckReserve extends MoneroCheck {
  
  getSpentAmount() {
    return this.spentAmount;
  }

  setSpentAmount(spentAmount) {
    this.spentAmount = spentAmount;
    return this;
  }

  getTotalAmount() {
    return this.totalAmount;
  }

  setTotalAmount(totalAmount) {
    this.totalAmount = totalAmount;
    return this;
  }
}

module.exports = MoneroCheckReserve;