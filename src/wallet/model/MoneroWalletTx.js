const assert = require("assert");
const BigInteger = require("../../submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const MoneroUtils = require("../../utils/MoneroUtils");
const MoneroTx = require("../../daemon/model/MoneroTx");
const MoneroPayment = require("../../wallet/model/MoneroPayment");

/**
 * Models a Monero transaction with additional fields in the context of a wallet.
 */
class MoneroWalletTx extends MoneroTx {
  
  /**
   * Constructs the model.
   * 
   * @param json is JSON to construct the model (optional)
   */
  constructor(json) {
    super(json);
    
    // deserialize json
    if (json) {
      this.setOutgoingAmount(BigInteger.parse(json.outgoingAmount));
      let outgoingPayments = [];
      for (let outgoingPaymentJson of json.outgoingPayments) payments.push(new MoneroPayment(outgoingPaymentJson));
      this.setOutgoingPayments(outgoingPayments);
      this.setIncomingAmount(BigInteger.parse(json.incomingAmount));
      let incomingPayments = [];
      for (let incomingPaymentJson of json.incomingPayments) payments.push(new MoneroPayment(incomingPaymentJson));
      this.setIncomingPayments(incomingPayments);
    }
    
    // construct anew
    else {
      this.state.outgoingAmount = new BigInteger(0);
      this.state.outgoingPayments = [];
      this.state.incomingAmount = new BigInteger(0);
      this.state.incomingPayments = [];
    }
  }
  
  getIsOutgoing() {
    return this.getSrcAccountIndex() !== undefined;
  }
  
  getIsIncoming() {
    return this.getIncomingPayments().length > 0;
  }
  
  getOutgoingAmount() {
    return this.outgoingAmount;
  }
  
  setOutgoingAmount(outgoingAmount) {
    this.outgoingAmount = outgoingAmount;
  }
  
  getIncomingAmount() {
    return this.incomingAmount;
  }
  
  setIncomingAmount(incomingAmount) {
    this.incomingAmount = incomingAmount;
  }
  
  getOutgoingPayments() {
    return this.state.outgoingPayments;
  }
  
  setOutgoingPayments(outgoingPayments) {
    this.state.outgoingPayments = outgoingPayments;
  }
  
  getIncomingPayments() {
    return this.state.incomingPayments;
  }
  
  setIncomingPayments(incomingPayments) {
    this.state.incomingPayments = incomingPayments;
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
    return new MoneroWalletTx(this.toJson());
  }
  
  toJson() {
    let json = Object.assign({}, this.state, super.toJson()); // merge json onto native state
    if (this.outgoingAmount) json.outgoingAmount = this.getOutgoingAmount().toString();
    if (this.incomingAmount) json.incomingAmount = this.getIncomingAmount().toString();
    json.outgoingPayments = [];
    for (let outgoingPayment of this.getOutgoingPayments()) json.outgoingPayments.push(outgoingPayment.toJson());
    json.incomingPayments = [];
    for (let incomingPayment of this.getIncomingPayments()) json.incomingPayments.push(incomingPayment.toJson());
    return json;
  }
  
  toString(indent = 0) {
    let str = "";
    str += MoneroUtils.kvLine("Is incoming", this.getIsIncoming(), indent);
    str += MoneroUtils.kvLine("Is outgoing", this.getIsOutgoing(), indent);
    str += MoneroUtils.kvLine("Incoming amount", this.getIncomingAmount(), indent);
    str += MoneroUtils.kvLine("Outgoing amount", this.getOutgoingAmount(), indent);
    str += MoneroUtils.kvLine("Source account index", this.getSrcAccountIndex(), indent);
    str += MoneroUtils.kvLine("Source subaddress index", this.getSrcSubaddressIndex(), indent);
    str += MoneroUtils.kvLine("Source address", this.getSrcAddress(), indent);
    str += MoneroUtils.kvLine("Note: ", this.getNote(), indent);
    if (this.getOutgoingPayments().length > 0) {
      str += MoneroUtils.kvLine("Outgoing payments", "", indent);
      for (let i = 0; i < this.getOutgoingPayments().length; i++) {
        str += MoneroUtils.kvLine(i + 1, "", indent + 1);
        str += this.getOutgoingPayments()[i].toString(indent + 2);
        if (i < this.getOutgoingPayments().length - 1) str += '\n'
      }
    }
    if (this.getIncomingPayments().length > 0) {
      str += MoneroUtils.kvLine("Incoming payments", "", indent);
      for (let i = 0; i < this.getIncomingPayments().length; i++) {
        str += MoneroUtils.kvLine(i + 1, "", indent + 1);
        str += this.getIncomingPayments()[i].toString(indent + 2);
        if (i < this.getIncomingPayments().length - 1) str += '\n'
      }
    }
    str += super.toString(indent);
    return str;
  }
  
  merge(tx) {
    
    // merge base transaction
    super.merge(tx);
    
    // merge wallet extensions
    this.setOutgoingAmount(MoneroUtils.reconcile(this.getOutgoingAmount()));
    this.setSrcAccountIndex(MoneroUtils.reconcile(this.getSrcAccountIndex(), tx.getSrcAccountIndex()));
    this.setSrcSubaddressIndex(MoneroUtils.reconcile(this.getSrcSubaddressIndex(), tx.getSrcSubaddressIndex()));
    this.setSrcAddress(MoneroUtils.reconcile(this.getSrcAddress(), tx.getSrcAddress()));
    this.setNote(MoneroUtils.reconcile(this.getNote(), tx.getNote()));
    
    // merge outgoing and incoming payments
    for (let payment of tx.getOutgoingPayments()) mergePayment(this.getOutgoingPayments(), payment);
    for (let payment of tx.getIncomingPayments()) mergePayment(this.getIncomingPayments(), payment);
    
    // incoming amount is sum of incoming payments
    let incomingAmt = new BigInteger(0);
    for (let payment of this.getIncomingPayments()) incomingAmt = incomingAmt.add(payment.getAmount());
    this.setIncomingAmount(incomingAmt);
    
    // helper function to merge payments
    function mergePayment(payments, payment) {
      for (let aPayment of payments) {
        if (aPayment.getAccountIndex() === payment.getAccountIndex() && aPayment.getSubaddressIndex() === payment.getSubaddressIndex()) {
          aPayment.merge(payments);
          return;
        }
      }
      payments.push(payment);
    }
  }
}

module.exports = MoneroWalletTx;