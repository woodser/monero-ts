const assert = require("assert");
const MoneroUtils = require("../../utils/MoneroUtils");
const MoneroTransfer = require("./MoneroTransfer");
const MoneroDestination = require("./MoneroDestination");

/**
 * Configuration for sending transactions.
 * 
 * TODO: this should use state object so it can be initialized with {}
 */
class MoneroSendConfig {
  
  constructor(configOrAddress, amount, paymentId, priority, mixin, fee) {
    if (configOrAddress instanceof Object) {
      throw new Error("Need to map object to fields");
    } else if (typeof configOrAddress === "string") {
      let destination = new MoneroDestination(configOrAddress, amount);
      this.setDestinations([destination]);
      this.setPaymentId(paymentId);
      this.setPriority(priority);
      this.setMixin(mixin);
      this.setFee(fee);
    }
  }
  
  getDestinations() {
    return this.destinations;
  }
  
  setDestinations(destinations) {
    this.destinations = destinations;
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
  
  getCanSplit() {
    return this.canSplit;
  }
  
  setCanSplit(canSplit) {
    this.canSplit = canSplit;
  }
  
  getNote() {
    return this.note;
  }
  
  setNote(note) {
    this.note = note;
  }
  
  getRecipientName() {
    return this.recipientName;
  }
  
  setRecipientName(recipientName) {
    this.recipientName = recipientName;
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