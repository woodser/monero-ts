const assert = require("assert");
const BigInteger = require("../../submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
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
  
  toString(indent = 0) {
    let str = super.toString(indent) + '\n'
    str += MoneroUtils.kvLine("Is incoming", this.getIsIncoming(), indent);
    str += MoneroUtils.kvLine("Is outgoing", this.getIsOutgoing(), indent);
    str += MoneroUtils.kvLine("Total amount", this.getTotalAmount() ? this.getTotalAmount().toString() : undefined, indent);
    str += MoneroUtils.kvLine("Source account index", this.getSrcAccountIndex(), indent);
    str += MoneroUtils.kvLine("Source subaddress index", this.getSrcSubaddressIndex(), indent);
    str += MoneroUtils.kvLine("Source address", this.getSrcAddress(), indent);
    str += MoneroUtils.kvLine("Note: ", this.getNote(), indent);
    if (this.getPayments()) {
      str += MoneroUtils.kvLine("Payments", "", indent);
      for (let i = 0; i < this.getPayments().length; i++) {
        str += MoneroUtils.kvLine(i + 1, "", indent + 1);
        str += this.getPayments()[i].toString(indent + 2);
        if (i < this.getPayments().length - 1) str += '\n'
      }
    } else {
      str += MoneroUtils.kvLine("Payments", this.getPayments(), indent);
    }
    return str;
  }
  
  merge(tx) {
    
    // merge base transaction
    super.merge(tx);
    
    // merge wallet extensions
    this.setIsIncoming(MoneroUtils.reconcile(this.getIsIncoming(), tx.getIsIncoming()));
    this.setSrcAccountIndex(MoneroUtils.reconcile(this.getSrcAccountIndex(), tx.getSrcAccountIndex()));
    this.setSrcSubaddressIndex(MoneroUtils.reconcile(this.getSrcSubaddressIndex(), tx.getSrcSubaddressIndex()));
    this.setSrcAddress(MoneroUtils.reconcile(this.getSrcAddress(), tx.getSrcAddress()));
    this.setNote(MoneroUtils.reconcile(this.getNote(), tx.getNote()));
    
    // merge payments
    if (this.getPayments() === undefined) this.setPayments(tx.getPayments());
    else if (tx.getPayments()) {
      for (let newPayment of tx.getPayments()) {
        let merged = false;
        for (let oldPayment of this.getPayments()) {
          if (oldPayment.getAccountIndex() === newPayment.getAccountIndex() && oldPayment.getSubaddressIndex() === newPayment.getSubaddressIndex()) {
            oldPayment.merge(newPayment);
            merged = true;
            break;
          }
        }
        if (!merged) this.getPayments().push(newPayment);
      }
    }
    
    // total amount is sum of payments
    let paymentTotal = new BigInteger(0);
    for (let payment of tx.getPayments()) paymentTotal = paymentTotal.add(payment.getAmount());
    tx.setTotalAmount(paymentTotal);
  }
}

module.exports = MoneroTxWallet;