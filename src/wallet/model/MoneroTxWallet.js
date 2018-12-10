const MoneroUtils = require("../../utils/MoneroUtils");
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
  
  getSrcSubaddressIndex() {
    return this.json.srcSubaddrIndex;
  }
  
  setSrcSubaddressIndex(srcSubaddrIndex) {
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
  
  merge(tx, mergePayments) {
    
    // no special handling needed
    MoneroUtils.safeSet(this, this.getType, this.setType, tx.getType());
    MoneroUtils.safeSet(this, this.getNote, this.setNote, tx.getNote());
    MoneroUtils.safeSet(this, this.getSrcAccountIndex, this.setSrcAccountIndex, tx.getSrcAccountIndex());
    MoneroUtils.safeSet(this, this.getSrcSubaddressIndex, this.setSrcSubaddressIndex, tx.getSrcSubaddressIndex());
    MoneroUtils.safeSet(this, this.getSrcAddress, this.setSrcAddress, tx.getSrcAddress());
    MoneroUtils.safeSet(this, this.getIsCoinbase, this.setIsCoinbase, tx.getIsCoinbase());
    
    // needs interpretation
    if (this.json.totalAmount === undefined) this.json.totalAmount = tx.getTotalAmount();
    else {
      if (mergePayments) assert(totalAmount.toJSValue() === 0);
      else this.json.totalAmount = this.json.totalAmount.add(tx.getTotalAmount());
    }
    if (this.json.payments === undefined) this.setPayments(tx.getPayments());
    else if (tx.getPayments() !== undefined) {
      if (mergePayments) {
        assert(tx.getPayments().length >= 0, "Tx " + tx.getId() + " cannot be merged because payments are different sizes");
        for (let i = 0; i < this.json.payments.length; i++) {
          this.json.payments[i].merge(tx.getPayments()[i]);
        }
      } else {
        for (let payment of tx.getPayments()) {
          payment.setTx(this);
          this.json.payments.push(payment);
        }
      }
    }
  }
}

// possible transaction types
MoneroTxWallet.Type = {
    INCOMING: 0,
    OUTGOING: 1
}

// default payment id
MoneroTxWallet.DEFAULT_PAYMENT_ID = "0000000000000000";

module.exports = MoneroTxWallet;