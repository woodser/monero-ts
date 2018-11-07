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
  
  getSrcAddress() {
    return this.srcAddress;
  }
  
  setSrcAddress(srcAddress) {
    this.srcAddress = srcAddress;
  }
  
  getSrcAccountIndex() {
    return this.srcAccountIndex;
  }
  
  setSrcAccountIndex(srcAccountIndex) {
    this.srcAccountIndex = srcAccountIndex;
  }
  
  getSrcSubaddrIndex() {
    return this.srcSubaddrIndex;
  }
  
  setSrcSubaddrIndex(srcSubaddrIndex) {
    this.srcSubaddrIndex = srcSubaddrIndex;
  }
  
  getTotalAmount() {
    return this.totalAmount;
  }
  
  setTotalAmount(totalAmount) {
    this.totalAmount = totalAmount;
  }
  
  getPayments() {
    return this.payments;
  }
  
  setPayments(payments) {
    this.payments = payments;
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
  
  getNote() {
    return this.note;
  }
  
  setNote(note) {
    this.note = note;
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