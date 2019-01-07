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
      
      // deserialize outgoing amount and payments
      if (json.outgoingAmount) this.setOutgoingAmount(BigInteger.parse(json.outgoingAmount));
      if (json.outgoingPayments) {
        let outgoingPayments = [];
        for (let outgoingPaymentJson of json.outgoingPayments) outgoingPayments.push(new MoneroPayment(outgoingPaymentJson));
        this.setOutgoingPayments(outgoingPayments);
      }
      
      // deserialize incoming amound payments
      if (json.incomingAmount) this.setIncomingAmount(BigInteger.parse(json.incomingAmount));
      if (json.incomingPayments) {
        let incomingPayments = [];
        for (let incomingPaymentJson of json.incomingPayments) incomingPayments.push(new MoneroPayment(incomingPaymentJson));
        this.setIncomingPayments(incomingPayments);
      }
    }
  }
  
  getIsOutgoing() {
    return this.getOutgoingAmount() !== undefined;
  }
  
  getIsIncoming() {
    return this.getIncomingAmount() !== undefined;
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
    if (this.getOutgoingAmount()) json.outgoingAmount = this.getOutgoingAmount().toString();
    if (this.getIncomingAmount()) json.incomingAmount = this.getIncomingAmount().toString();
    if (this.getOutgoingPayments()) {
      json.outgoingPayments = [];
      for (let outgoingPayment of this.getOutgoingPayments()) json.outgoingPayments.push(outgoingPayment.toJson());
    }
    if (this.getIncomingPayments()) {
      json.incomingPayments = [];
      for (let incomingPayment of this.getIncomingPayments()) json.incomingPayments.push(incomingPayment.toJson());
    }
    return json;
  }
  
  toString(indent = 0) {
    let str = super.toString(indent) + "\n";
    str += MoneroUtils.kvLine("Is outgoing", this.getIsOutgoing(), indent);
    str += MoneroUtils.kvLine("Outgoing amount", this.getOutgoingAmount(), indent);
    str += MoneroUtils.kvLine("Source account index", this.getSrcAccountIndex(), indent);
    str += MoneroUtils.kvLine("Source subaddress index", this.getSrcSubaddressIndex(), indent);
    str += MoneroUtils.kvLine("Source address", this.getSrcAddress(), indent);
    if (this.getOutgoingPayments()) {
      str += MoneroUtils.kvLine("Outgoing payments", "", indent);
      for (let i = 0; i < this.getOutgoingPayments().length; i++) {
        str += MoneroUtils.kvLine(i + 1, "", indent + 1);
        str += this.getOutgoingPayments()[i].toString(indent + 2) + "\n";
        if (i < this.getOutgoingPayments().length - 1) str += '\n'
      }
    }
    str += MoneroUtils.kvLine("Is incoming", this.getIsIncoming(), indent);
    str += MoneroUtils.kvLine("Incoming amount", this.getIncomingAmount(), indent);
    if (this.getIncomingPayments()) {
      str += MoneroUtils.kvLine("Incoming payments", "", indent);
      for (let i = 0; i < this.getIncomingPayments().length; i++) {
        str += MoneroUtils.kvLine(i + 1, "", indent + 1);
        str += this.getIncomingPayments()[i].toString(indent + 2) + "\n";
      }
    }
    str += MoneroUtils.kvLine("Note: ", this.getNote(), indent);
    return str.slice(0, str.length - 1);  // strip last newline
  }
  
  merge(tx) {
    
    // merge base transaction
    super.merge(tx);
    
    // merge wallet extensions
    this.setOutgoingAmount(MoneroUtils.reconcile(this.getOutgoingAmount(), tx.getOutgoingAmount()));
    this.setSrcAccountIndex(MoneroUtils.reconcile(this.getSrcAccountIndex(), tx.getSrcAccountIndex()));
    this.setSrcSubaddressIndex(MoneroUtils.reconcile(this.getSrcSubaddressIndex(), tx.getSrcSubaddressIndex()));
    this.setSrcAddress(MoneroUtils.reconcile(this.getSrcAddress(), tx.getSrcAddress()));
    this.setNote(MoneroUtils.reconcile(this.getNote(), tx.getNote()));
    
    // merge payments
    if (tx.getOutgoingPayments()) {
      if (this.getOutgoingPayments() === undefined) this.setOutgoingPayments([]);
      for (let payment of tx.getOutgoingPayments()) {
        mergePayment(this.getOutgoingPayments(), payment);
      }
    }
    if (tx.getIncomingPayments()) {
      if (this.getIncomingPayments() === undefined) this.setIncomingPayments([]);
      for (let payment of tx.getIncomingPayments()) {
        mergePayment(this.getIncomingPayments(), payment);
      }
    }
    
    // incoming amount is sum of incoming payments
    if (this.getIncomingPayments()) {
      let incomingAmt = new BigInteger(0);
      for (let payment of this.getIncomingPayments()) incomingAmt = incomingAmt.add(payment.getAmount());
      this.setIncomingAmount(incomingAmt);
    }
    
    // helper function to merge payments
    function mergePayment(payments, payment) {
      for (let aPayment of payments) {
        if (aPayment.getAccountIndex() === payment.getAccountIndex() && aPayment.getSubaddressIndex() === payment.getSubaddressIndex()) {
          aPayment.merge(payment);
          return;
        }
      }
      payments.push(payment);
    }
  }
}

module.exports = MoneroWalletTx;