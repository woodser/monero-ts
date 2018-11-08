/**
 * Represents a transaction on the Monero network.
 */
class MoneroTx {
  
  getId() {
    return this.id;
  }
  
  setId(id) {
    this.id = id;
  }
  
  getTotalAmount() {
    return this.totalAmount;
  }
  
  setTotalAmount(totalAmount) {
    this.totalAmount = totalAmount;
  }
  
  getPaymentId() {
    return this.getPaymentId;
  }
  
  setPaymentId(paymentId) {
    this.paymentId = paymentId;
  }
  
  getFee() {
    return this.fee;
  }
  
  setFee(fee) {
    this.fee = fee;
  }
  
  getMixin() {
    return this.mixin;
  }
  
  setMixin(mixin) {
    this.mixin = mixin;
  }
  
  getSize() {
    return this.size;
  }
  
  setSize(size) {
    this.size = size;
  }
  
  getType() {
    return this.type;
  }
  
  setType(type) {
    this.type = type;
  }
  
  getHeight() {
    return this.height;
  }
  
  setHeight(height) {
    this.height = height;
  }
  
  getTimestamp() {
    return this.timestamp;
  }
  
  setTimestamp() {
    this.timestamp = timestamp;
  }
  
  getUnlockTime() {
    return this.unlockTime;
  }
  
  setUnlockTime(unlockTime) {
    this.unlockTime = unlockTime;
  }
  
  getIsDoubleSpend() {
    return this.isDoubleSpend;
  }
  
  setIsDoubleSpend(isDoubleSpend) {
    this.isDoubleSpend = isDoubleSpend;
  }
  
  getKey() {
    return this.key;
  }
  
  setKey(key) {
    this.key = key;
  }
  
  getBlob() {
    return this.blob;
  }
  
  setBlob(blob) {
    this.blob = blob;
  }
  
  getMetadata() {
    return this.metadata;
  }
  
  setMetadata(metadata) {
    this.metadata = metadata;
  }
  
  getNumConfirmations() {
    return this.numConfirmations;
  }
  
  setNumConfirmations(numConfirmations) {
    this.numConfirmations = numConfirmations;
  }
  
  getNumEstimatedBocksUntilConfirmed() {
    return this.numEstimatedBlocksUntilConfirmed;
  }
  
  setNumEstimatedBlocksUntilConfirmed(numEstimatedBlocksUntilConfirmed) {
    this.numEstimatedBlocksUntilConfirmed = numEstimatedBlocksUntilConfirmed;
  }
  
  getCommonTxSets() {
    return this.commonTxSets;
  }
  
  setCommonTxSets(commonTxSets) {
    this.commonTxSets = commonTxSets;
  }
}

module.exports = MoneroTx;