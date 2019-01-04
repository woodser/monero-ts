const assert = require("assert");
const MoneroUtils = require("../../utils/MoneroUtils");
const MoneroTx = require("../../daemon/model/MoneroTx");

/**
 * Models a Monero transaction with additional fields in the context of a wallet.
 */
class MoneroTxWallet extends MoneroTx {
  
  constructor(json) {
    super(json);
  }
  
  getIsIncoming() {
    return this.json.isIncoming;
  }
  
  setIsIncoming(isIncoming) {
    this.json.isIncoming = isIncoming;
  }
  
  getIsOutgoing() {
    if (this.json.isIncoming === undefined) return undefined;
    return !this.json.isIncoming;
  }
  
  setIsOutgoing(isOutgoing) {
    this.setIsIncoming(isOutgoing === undefined ? undefined : !isOutgoing);
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
  
  getNote() {
    return this.json.note;
  }
  
  setNote(note) {
    this.json.note = note;
  }
  
  copy() {
    return new MoneroTxWallet(Object.assign({}, this.json));  // create tx with copied json
  }
  
  toJson() {
    return this.json; // TODO: correctly serialize complex types
    //throw new Error("Not implemented");
  }
  
  toString(offset = 0) {
    let str = super.toString(offset) + '\n'
    str += MoneroUtils.kvLine("Is incoming", this.getIsIncoming(), offset);
    str += MoneroUtils.kvLine("Is outgoing", this.getIsOutgoing(), offset);
    str += MoneroUtils.kvLine("Total amount", this.getTotalAmount().toString(), offset);
    str += MoneroUtils.kvLine("Source account index", this.getSrcAccountIndex(), offset);
    str += MoneroUtils.kvLine("Source subaddress index", this.getSrcSubaddressIndex(), offset);
    str += MoneroUtils.kvLine("Source address", this.getSrcAddress(), offset);
    str += MoneroUtils.kvLine("Note: ", this.getNote(), offset);
    if (this.getPayments()) {
      str += MoneroUtils.kvLine("Payments", "", offset);
      for (let i = 0; i < this.getPayments().length; i++) {
        str += MoneroUtils.kvLine(i + 1, "", offset + 1);
        str += this.getPayments()[i].toString(offset + 2);
        if (i < this.getPayments().length - 1) str += '\n'
      }
    } else {
      str += MoneroUtils.kvLine("Payments", this.getPayments(), offset);
    }
    return str;
  }
  
  merge(tx, mergePayments) {
    
    // merge base transaction
    super.merge(tx);
    
    // merge wallet extensions
    this.setIsIncoming(MoneroUtils.reconcile(this.getIsIncoming(), tx.getIsIncoming()));
    this.setSrcAccountIndex(MoneroUtils.reconcile(this.getSrcAccountIndex(), tx.getSrcAccountIndex()));
    this.setSrcSubaddressIndex(MoneroUtils.reconcile(this.getSrcSubaddressIndex(), tx.getSrcSubaddressIndex()));
    this.setSrcAddress(MoneroUtils.reconcile(this.getSrcAddress(), tx.getSrcAddress()));
    this.setNote(MoneroUtils.reconcile(this.getNote(), tx.getNote()));
    
    // merge total amount
    if (this.getTotalAmount() === undefined) this.setTotalAmount(tx.getTotalAmount());
    else {
      if (mergePayments) assert.equal(0, this.getTotalAmount().compare(tx.getTotalAmount()));
      else this.setTotalAmount(this.getTotalAmount().add(tx.getTotalAmount()));
    }
    
    // merge payments
    if (this.getPayments() === undefined) this.setPayments(tx.getPayments());
    else if (tx.getPayments() !== undefined) {
      if (mergePayments) {
        assert(tx.getPayments().length >= 0);
        assert.equal(this.getPayments().length, tx.getPayments().length, "Merging payments must be same size"); // TODO: not so!  because of occlusion issue and no incoming_transfers, should get additional payment when change tx becomes known
        for (let i = 0; i < this.json.payments.length; i++) {
          this.getPayments()[i].merge(tx.getPayments()[i]);
        }
      } else {
        for (let payment of tx.getPayments()) {
          this.getPayments().push(payment);
        }
      }
    }
  }
}

module.exports = MoneroTxWallet;