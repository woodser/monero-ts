const assert = require("assert");
const BigInteger = require("../../submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const MoneroUtils = require("../../utils/MoneroUtils");
const MoneroTx = require("../../daemon/model/MoneroTx");
const MoneroPayment = require("../../wallet/model/MoneroPayment");

/**
 * Models a Monero transaction with additional fields in the context of a wallet.
 */
class MoneroTxWallet extends MoneroTx {
  
  /**
   * Constructs the model.
   * 
   * @param json is JSON to construct the model (optional)
   */
  constructor(json) {
    super(json);
    
    // deserialize json
    if (!json) return;
    if (json.totalAmount) this.setTotalAmount(BigInteger.parse(json.totalAmount));
    if (json.payments) {
      let payments = [];
      for (let jsonPayment of json.payments) payments.push(new MoneroPayment(jsonPayment));
      this.setPayments(payments);
    }
  }
  
  getIsIncoming() {
    return this.state.isIncoming;
  }
  
  setIsIncoming(isIncoming) {
    this.state.isIncoming = isIncoming;
  }
  
  getIsOutgoing() {
    if (this.state.isIncoming === undefined) return undefined;
    return !this.state.isIncoming;
  }
  
  setIsOutgoing(isOutgoing) {
    this.setIsIncoming(isOutgoing === undefined ? undefined : !isOutgoing);
  }
  
  getTotalAmount() {
    return this.state.totalAmount;
  }
  
  setTotalAmount(totalAmount) {
    this.state.totalAmount = totalAmount;
  }
  
  getPayments() {
    return this.state.payments;
  }
  
  setPayments(payments) {
    this.state.payments = payments;
  }
  
  getSrcAccountIndex() {
    return this.state.srcAccountIndex;
  }
  
  setSrcAccountIndex(srcAccountIndex) {
    this.state.srcAccountIndex = srcAccountIndex;
  }
  
  getSrcSubaddressIndex() {
    return this.state.srcSubaddrIndex;
  }
  
  setSrcSubaddressIndex(srcSubaddrIndex) {
    this.state.srcSubaddrIndex = srcSubaddrIndex;
  }
  
  getSrcAddress() {
    return this.state.srcAddress;
  }
  
  setSrcAddress(srcAddress) {
    this.state.srcAddress = srcAddress;
  }
  
  getNote() {
    return this.state.note;
  }
  
  setNote(note) {
    this.state.note = note;
  }
  
  copy() {
    return new MoneroTxWallet(this.toJson());
  }
  
  toJson() {
    let json = super.toJson();
    Object.assign(json, this.state);
    if (this.getTotalAmount()) json.totalAmount = this.getTotalAmount().toString();
    if (this.getPayments()) {
      json.payments = [];
      for (let payment of this.getPayments()) json.payments.push(payment.toJson());
    }
    return json;
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
      for (let merger of tx.getPayments()) {
        let merged = false;
        for (let mergee of this.getPayments()) {
          if (mergee.getAccountIndex() === merger.getAccountIndex() && mergee.getSubaddressIndex() === merger.getSubaddressIndex()) {
            mergee.merge(merger);
            merged = true;
            break;
          }
        }
        if (!merged) this.getPayments().push(merger);
      }
    }
    
    // total amount is sum of payments if they exist
    if (tx.getPayments()) {
      let paymentTotal = new BigInteger(0);
      for (let payment of tx.getPayments()) paymentTotal = paymentTotal.add(payment.getAmount());
      tx.setTotalAmount(paymentTotal);
    }
  }
}

module.exports = MoneroTxWallet;