/**
 * Monero address book entry model
 */
class MoneroAddressBookEntry {
  
  constructor(index, address, paymentId, description) {
    this.index = index;
    this.address = address;
    this.paymentId = paymentId;
    this.description = description;
  }
  
  getIndex() {
    return this.index;
  }
  
  setIndex(index) {
    this.index = index;
    return this;
  }
  
  getAddress() {
    return this.address;
  }
  
  setAddress(address) {
    this.address = address;
    return this;
  }
  
  getPaymentId() {
    return this.paymentId;
  }
  
  setPaymentId(paymentId) {
    this.paymentId = paymentId;
    return this;
  }
  
  getDescription() {
    return this.description;
  }
  
  setDescription(description) {
    this.description = description;
    return this;
  }
  
}

module.exports = MoneroAddressBookEntry;