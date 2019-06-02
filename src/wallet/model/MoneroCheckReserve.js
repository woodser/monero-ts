const MoneroCheck = require("./MoneroCheck");

/**
 * Results from checking a reserve proof.
 */
class MoneroCheckReserve extends MoneroCheck {
  
  getTotalAmount() {
    return this.totalAmount;
  }

  setTotalAmount(totalAmount) {
    this.totalAmount = totalAmount;
    return this;
  }
  
  getUnconfirmedSpentAmount() {
    return this.unconfirmedSpentAmount;
  }

  setUnconfirmedSpentAmount(unconfirmedSpentAmount) {
    this.unconfirmedSpentAmount = unconfirmedSpentAmount;
    return this;
  }
}

module.exports = MoneroCheckReserve;