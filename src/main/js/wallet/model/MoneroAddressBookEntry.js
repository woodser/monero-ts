/**
 * Monero address book entry model
 */
class MoneroAddressBookEntry {
  
  constructor(state) {
    this.state = Object.assign({}, state);
  }
  
  toJson() {
    return Object.assign({}, this.state);
  }
  
  getIndex() {
    return this.state.index;
  }
  
  setIndex(index) {
    this.state.index = index;
    return this;
  }
  
  getAddress() {
    return this.state.address;
  }
  
  setAddress(address) {
    this.state.address = address;
    return this;
  }
  
  getDescription() {
    return this.state.description;
  }
  
  setDescription(description) {
    this.state.description = description;
    return this;
  }
  
  getPaymentId() {
    return this.state.paymentId;
  }
  
  setPaymentId(paymentId) {
    this.state.paymentId = paymentId;
    return this;
  }
}

module.exports = MoneroAddressBookEntry;