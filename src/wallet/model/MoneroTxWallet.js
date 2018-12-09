const MoneroTx = require("../../daemon/model/MoneroTx");

/**
 * Models a Monero transaction with additional fields in the context of a wallet.
 */
class MoneroWalletTx extends MoneroTx {
  
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