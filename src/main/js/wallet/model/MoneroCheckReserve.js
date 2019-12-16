/**
 * Results from checking a reserve proof.
 */
class MoneroCheckReserve extends MoneroCheck {
  
  constructor() {
    super();
  }
  
  getTotalAmount() {
    return this.state.totalAmount;
  }

  setTotalAmount(totalAmount) {
    this.state.totalAmount = totalAmount;
    return this;
  }
  
  getUnconfirmedSpentAmount() {
    return this.state.unconfirmedSpentAmount;
  }

  setUnconfirmedSpentAmount(unconfirmedSpentAmount) {
    this.state.unconfirmedSpentAmount = unconfirmedSpentAmount;
    return this;
  }
}

module.exports = MoneroCheckReserve;