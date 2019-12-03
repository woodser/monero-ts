/**
 * Monero address book entry model
 */
class MoneroAddressBookEntry {
  
  constructor(index, address, description, paymentId) {
    this.index = index;
    this.address = address;
    this.description = description;
    this.paymentId = paymentId;
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
  
  getDescription() {
    return this.description;
  }
  
  setDescription(description) {
    this.description = description;
    return this;
  }
  
  getPaymentId() {
    return this.paymentId;
  }
  
  setPaymentId(paymentId) {
    this.paymentId = paymentId;
    return this;
  }
}

module.exports = MoneroAddressBookEntry;