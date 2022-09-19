import MoneroCheck from "./MoneroCheck";

/**
 * Results from checking a reserve proof.
 * 
 * @extends {MoneroCheck}
 */
class MoneroCheckReserve extends MoneroCheck {
  
  constructor(state) {
    super(state);
    if (this.state.totalAmount !== undefined && !(this.state.totalAmount instanceof BigInt)) this.state.totalAmount = BigInt(this.state.totalAmount);
    if (this.state.unconfirmedSpentAmount !== undefined && !(this.state.unconfirmedSpentAmount instanceof BigInt)) this.state.unconfirmedSpentAmount = BigInt(this.state.unconfirmedSpentAmount);
  }
  
  toJson() {
    let json = Object.assign({}, this.state);
    if (this.getTotalAmount() !== undefined) json.totalAmount = this.getTotalAmount().toString();
    if (this.getUnconfirmedSpentAmount() !== undefined) json.unconfirmedSpentAmount = this.getUnconfirmedSpentAmount().toString();
    return json;
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

export default MoneroCheckReserve;
