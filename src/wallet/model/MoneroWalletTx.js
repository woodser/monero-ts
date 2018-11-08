const MoneroTx = require("../../daemon/model/MoneroTx");

/**
 * Models a Monero transaction with additional fields known to wallet.
 */
class MoneroWalletTx extends MoneroTx {

  getSrcAddress() {
    return this.srcAddress;
  }
  
  setSrcAddress(srcAddress) {
    this.srcAddress = srcAddress;
  }
  
  getSrcAccountIndex() {
    return this.srcAccountIndex;
  }
  
  setSrcAccountIndex(srcAccountIndex) {
    this.srcAccountIndex = srcAccountIndex;
  }
  
  getSrcSubaddrIndex() {
    return this.srcSubaddrIndex;
  }
  
  setSrcSubaddrIndex(srcSubaddrIndex) {
    this.srcSubaddrIndex = srcSubaddrIndex;
  }
  
  getPayments() {
    return this.payments;
  }
  
  setPayments(payments) {
    this.payments = payments;
  }
  
  getNote() {
    return this.note;
  }
  
  setNote(note) {
    this.note = note;
  }
}

module.exports = MoneroWalletTx;