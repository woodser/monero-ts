const MoneroTx = require("../../daemon/model/MoneroTx");

/**
 * Models a Monero transaction with additional fields in the context of a wallet.
 */
class MoneroWalletTx extends MoneroTx {
  
  getType() {
    return this.json.type;
  }
  
  setType(type) {
    this.json.type = type;
  }
  
  getState() {
    return this.json.state;
  }
  
  setState(state) {
    this.json.state = state;
  }
  
  getTotalAmount() {
    return this.json.totalAmount;
  }
  
  setTotalAmount(totalAmount) {
    this.json.totalAmount = totalAmount;
  }

  getSrcAddress() {
    return this.json.srcAddress;
  }
  
  setSrcAddress(srcAddress) {
    this.json.srcAddress = srcAddress;
  }
  
  getSrcAccountIndex() {
    return this.json.srcAccountIndex;
  }
  
  setSrcAccountIndex(srcAccountIndex) {
    this.json.srcAccountIndex = srcAccountIndex;
  }
  
  getSrcSubaddrIndex() {
    return this.json.srcSubaddrIndex;
  }
  
  setSrcSubaddrIndex(srcSubaddrIndex) {
    this.json.srcSubaddrIndex = srcSubaddrIndex;
  }
  
  getPayments() {
    return this.json.payments;
  }
  
  setPayments(payments) {
    this.json.payments = payments;
  }
  
  getNote() {
    return this.json.note;
  }
  
  setNote(note) {
    this.json.note = note;
  }
}

//incoming or outgoing tx relative to the wallet
MoneroWalletTx.Type = {
    INCOMING: 0,
    OUTGOING: 1
}

// state of the transaction
MoneroWalletTx.State = {
    CONFIRMED: 0
    MEMPOOL: 1,
    NOT_RELAYED: 2,
    FAILED: 3
}

module.exports = MoneroWalletTx;