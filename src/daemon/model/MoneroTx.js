const MoneroDaemonModel = require("./MoneroDaemonModel");
const MoneroUtils = require("../../utils/MoneroUtils");

/**
 * Represents a transaction on the Monero network.
 */
class MoneroTx extends MoneroDaemonModel {
  
  /**
   * Constructs the model.
   */
  constructor(json) {
    super();
    this.json = Object.assign({}, json);
  }
  
  getId() {
    return this.json.id;
  }
  
  setId(id) {
    this.json.id = id;
  }
  
  getVersion() {
    return this.json.version;
  }
  
  setVersion(version) {
    this.json.version = version;
  }
  
  getPaymentId() {
    return this.json.getPaymentId;
  }
  
  setPaymentId(paymentId) {
    this.json.paymentId = paymentId;
  }
  
  getFee() {
    return this.json.fee;
  }
  
  setFee(fee) {
    this.json.fee = fee;
  }
  
  getMixin() {
    return this.json.mixin;
  }
  
  setMixin(mixin) {
    this.json.mixin = mixin;
  }
  
  getSize() {
    return this.json.size;
  }
  
  setSize(size) {
    this.json.size = size;
  }
  
  getHeight() {
    return this.json.height;
  }
  
  setHeight(height) {
    this.json.height = height;
  }
  
  getTimestamp() {
    return this.json.timestamp;
  }
  
  setTimestamp(timestamp) {
    this.json.timestamp = timestamp;
  }
  
  getUnlockTime() {
    return this.json.unlockTime;
  }
  
  setUnlockTime(unlockTime) {
    this.json.unlockTime = unlockTime;
  }
  
  getIsDoubleSpend() {
    return this.json.isDoubleSpend;
  }
  
  setIsDoubleSpend(isDoubleSpend) {
    this.json.isDoubleSpend = isDoubleSpend;
  }
  
  getKey() {
    return this.json.key;
  }
  
  setKey(key) {
    this.json.key = key;
  }
  
  getHex() {
    return this.json.hex;
  }
  
  setHex(hex) {
    this.json.hex = hex;
  }
  
  getMetadata() {
    return this.json.metadata;
  }
  
  setMetadata(metadata) {
    this.json.metadata = metadata;
  }
  
  getIsConfirmed() {
    return this.json.isConfirmed;
  }
  
  setIsConfirmed(isConfirmed) {
    this.json.isConfirmed = isConfirmed;
  }
  
  getNumConfirmations() {
    return this.json.numConfirmations;
  }
  
  setNumConfirmations(numConfirmations) {
    this.json.numConfirmations = numConfirmations;
  }
  
  getNumEstimatedBocksUntilConfirmed() {
    return this.json.numEstimatedBlocksUntilConfirmed;
  }
  
  setNumEstimatedBlocksUntilConfirmed(numEstimatedBlocksUntilConfirmed) {
    this.json.numEstimatedBlocksUntilConfirmed = numEstimatedBlocksUntilConfirmed;
  }
  
  getCommonTxSets() {
    return this.json.commonTxSets;
  }
  
  setCommonTxSets(commonTxSets) {
    this.json.commonTxSets = commonTxSets;
  }
  
  getExtra() {
    return this.json.extra;
  }
  
  setExtra(extra) {
    this.json.extra = extra;
  }
  
  getVin() {
    return this.json.vin;
  }
  
  setVin(vin) {
    this.json.vin = vin;
  }
  
  getVout() {
    return this.json.vout;
  }
  
  setVout(vout) {
    this.json.vout = vout;
  }
  
  getRctSignatures() {
    return this.json.rctSignatures;
  }
  
  setRctSignatures(rctSignatures) {
    this.json.rctSignatures = rctSignatures;
  }
  
  getRctSigPrunable() {
    return this.json.rctSigPrunable;
  }
  
  setRctSigPrunable(rctSigPrunable) {
    this.json.rctSigPrunable = rctSigPrunable;
  }
  
  /**
   * Merges the given transaction into this transaction.
   * 
   * @param tx is the transaction to merge into this one
   * @param mergePayments specifies if payments should be merged with xor appended to existing payments
   */
  merge(tx, mergePayments) { 
    
    // no special handling needed
    MoneroUtils.safeSet(this, this.getId, this.setId, tx.getId());
    MoneroUtils.safeSet(this, this.getPaymentId, this.setPaymentId, tx.getPaymentId());
    MoneroUtils.safeSet(this, this.getFee, this.setFee, tx.getFee());
    MoneroUtils.safeSet(this, this.getMixin, this.setMixin, tx.getMixin());
    MoneroUtils.safeSet(this, this.getKey, this.setKey, tx.getKey());
    MoneroUtils.safeSet(this, this.getSize, this.setSize, tx.getSize());
    MoneroUtils.safeSet(this, this.getVersion, this.setVersion, tx.getVersion());
    MoneroUtils.safeSet(this, this.getHeight, this.setHeight, tx.getHeight());
    MoneroUtils.safeSet(this, this.getNote, this.setNote, tx.getNote());
    MoneroUtils.safeSet(this, this.getUnlockTime, this.setUnlockTime, tx.getUnlockTime());
    MoneroUtils.safeSet(this, this.getIsDoubleSpend, this.setIsDoubleSpend, tx.getIsDoubleSpend());
    MoneroUtils.safeSet(this, this.getBlob, this.setBlob, tx.getBlob());
    MoneroUtils.safeSet(this, this.getMetadata, this.setMetadata, tx.getMetadata());
    MoneroUtils.safeSet(this, this.getCommonTxSets, this.setCommonTxsSets, tx.getCommonTxSets());
    MoneroUtils.safeSet(this, this.getHex, this.setHex, tx.getHex());
    MoneroUtils.safeSet(this, this.getIsConfirmed, this.setIsConfirmed, tx.getIsConfirmed());
    MoneroUtils.safeSet(this, this.getExtra, this.setExtra, tx.getExtra());
    MoneroUtils.safeSet(this, this.getVin, this.setVin, tx.getVin());
    MoneroUtils.safeSet(this, this.getVout, this.setVout, tx.getVout());
    MoneroUtils.safeSet(this, this.getRctSignatures, this.setRctSignatures, tx.getRctSignatures());
    MoneroUtils.safeSet(this, this.getRctSigPrunable, this.setRctSigPrunable, tx.getRctSigPrunable());
    
    // need some interpretation // TODO
    MoneroUtils.safeSet(this, this.getTimestamp, this.setTimestamp, tx.getTimestamp());
    MoneroUtils.safeSet(this, this.getNumConfirmations, this.setNumConfirmations, tx.getNumConfirmations());
    MoneroUtils.safeSet(this, this.getNumEstimatedBlocksUntilConfirmed, this.setNumEstimatedBlocksUntilConfirmed, tx.getNumEstimatedBlocksUntilConfirmed());
    throw new Error("Not implemented");
  }
  
  toJson() {
    throw new Error("Not implemented");
  }
}

module.exports = MoneroTx;