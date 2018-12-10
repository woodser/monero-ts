const MoneroTx = require("../../daemon/model/MoneroTx");

/**
 * Models a Monero transaction with additional fields in the context of a wallet.
 */
class MoneroTxWallet extends MoneroTx {
  
  constructor(json) {
    super(json);
  }
  
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
  
  getSrcAddress() {
    return this.json.srcAddress;
  }
  
  setSrcAddress(srcAddress) {
    this.json.srcAddress = srcAddress;
  }
  
  getIsCoinbase() {
    return this.json.coinbase;
  }
  
  setIsCoinbase(coinbase) {
    this.json.coinbase = coinbase;
  }
  
  merge(tx) {
    MoneroUtils.safeSet(this, this.getType, this.setType, tx.getType());
    MoneroUtils.safeSet(this, this.getState, this.setState, tx.getState());
    MoneroUtils.safeSet(this, this.getSrcAccountIndex, this.setSrcAccountIndex, tx.getSrcAccountIndex());
    MoneroUtils.safeSet(this, this.getSrcSubaddressIndex, this.setSrcSubaddressIndex, tx.getSrcSubaddressIndex());
    MoneroUtils.safeSet(this, this.getSrcAddress, this.setSrcAddress, tx.getSrcAddress());
  }
}

// possible transaction types
MoneroTxWallet.Type = {
    INCOMING: 0,
    OUTGOING: 1
}

// possible transaction states
MoneroTxWallet.State = {
    CONFIRMED: 0,
    MEMPOOL: 1,
    NOT_RELAYED: 2,
    FAILED: 3
}

// default payment id
MoneroTxWallet.DEFAULT_PAYMENT_ID = "0000000000000000";

module.exports = MoneroTxWallet;