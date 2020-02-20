/**
 * Monero integrated address model.
 */
class MoneroIntegratedAddress {
  
  constructor(state) {
    if (!state) throw new Error("NO STATE!!!");
    this.state = Object.assign({}, state);
  }
  
  toJson() {
    return Object.assign({}, this.state);
  }

  getStandardAddress() {
    return this.state.standardAddress;
  }
  
  setStandardAddress(standardAddress) {
    this.state.standardAddress = standardAddress;
    return this;
  }
  
  getPaymentId() {
    return this.state.paymentId;
  }
  
  setPaymentId(paymentId) {
    this.state.paymentId = this.state.paymentId;
    return this;
  }
  
  getIntegratedAddress() {
    return this.state.integratedAddress;
  }
  
  setIntegratedAddress(integratedAddress) {
    this.state.integratedAddress = integratedAddress;
    return this;
  }
  
  toString() {
    return this.state.integratedAddress;
  }
}

module.exports = MoneroIntegratedAddress;