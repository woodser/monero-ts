const assert = require("assert");
const MoneroUtils = require("../../utils/MoneroUtils");
const MoneroPayment = require("./MoneroPayment");

/**
 * Configuration for sending transactions.
 */
class MoneroSendConfig {
  
  constructor(configOrAddress, amount, paymentId, priority, mixin, fee) {
    if (configOrAddress instanceof Object) {
      throw new Error("Need to map object to fields");
    } else if (typeof configOrAddress === "string") {
      let payment = new MoneroPayment();
      payment.setAddress(configOrAddress);
      payment.setAmount(amount);
      this.payments = [payment];
      this.setPaymentId(paymentId);
      this.setPriority(priority);
      this.setMixin(mixin);
      this.setFee(fee);
    }
    
    // verify types
    assert(this.paymentId === undefined || MoneroUtils.isValidPaymentId(this.paymentId));
  }
  
  getPayments() {
    return this.payments;
  }
  
  setPayments(payments) {
    this.payments = payments;
  }
  
  getPaymentId() {
    return this.paymentId;
  }
  
  setPaymentId(paymentId) {
    this.paymentId = paymentId;
  }
  
  getPriority() {
    return this.priority;
  }
  
  setPriority(priority) {
    this.priority = priority;
  }
  
  getMixin() {
    return this.mixin;
  }
  
  setMixin(mixin) {
    this.mixin = mixin;
  }
  
  getFee() {
    return this.fee;
  }
  
  setFee(fee) {
    this.fee = fee;
  }
  
  getAccountIndex() {
    return this.accountIndex;
  }
  
  setAccountIndex(accountIndex) {
    this.accountIndex = accountIndex;
  }
  
  getSubaddressIndices() {
    return this.subaddressIndices;
  }
  
  setSubaddressIndices(subaddressIndices) {
    this.subaddressIndices = subaddressIndices;
  }
  
  getUnlockTime() {
    return this.unlockTime;
  }
  
  setUnlockTime(unlockTime) {
    this.unlockTime = unlockTime;
  }
  
  getDoNotRelay() {
    return this.doNotRelay;
  }
  
  setDoNotRelay(doNotRelay) {
    this.doNotRelay = doNotRelay;
  }
  
  // TODO: could extend this class to make MoneroSweepConfig with these params
  
  getBelowAmount() {  // TODO: specific to sweep?
    return this.belowAmount;
  }
  
  setBelowAmount(belowAmount) {
    this.belowAmount = belowAmount;
  }
  
  getSweepEachSubaddress() {
    return this.sweepEachSubaddress;
  }
  
  setSweepEachSubaddress(sweepEachSubaddress) {
    this.sweepEachSubaddress = sweepEachSubaddress;
  }
}

module.exports = MoneroSendConfig;