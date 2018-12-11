/**
 * Specifies filter options when querying transactions.
 * 
 * incoming, outgoing, confirmed, mempool, relayed, failed, coinbase, hasPayments,
 * min height, max height, account idx, subaddress indices, tx ids, payment ids
 */
class MoneroTxFilter {
  
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

  getTxIds() {
    return this.txIds;
  }

  setTxIds(txIds) {
    this.txIds = txIds;
  }
  
  getIsIncoming() {
    return this.isIncoming;
  }
  
  setIsIncoming(isIncoming) {
    this.isIncoming = isIncoming;
  }
  
  getIsOutgoing() {
    return this.isOutgoing;
  }
  
  setIsOutgoing(isOutgoing) {
    this.isOutgoing = isOutgoing;
  }
  
  getIsConfirmed() {
    return this.isConfirmed;
  }
  
  setIsConfirmed(isConfirmed) {
    this.isConfirmed = isConfirmed;
  }
  
  getInMempool() {
    return this.inMempool;
  }
  
  setInMempool(inMempool) {
    this.inMempool = inMempool;
  }
  
  getIsRelayed() {
    return this.isRelayed;
  }
  
  setIsRelayed(isRelayed) {
    this.isRelayed = isRelayed;
  }
  
  getIsFailed() {
    return this.isFailed;
  }
  
  setIsFailed(isFailed) {
    return this.isFailed = isFailed;
  }

  getMinHeight() {
    return this.minHeight;
  }

  setMinHeight(minHeight) {
    this.minHeight = minHeight;
  }

  getMaxHeight() {
    return this.maxHeight;
  }

  setMaxHeight(maxHeight) {
    this.maxHeight = maxHeight;
  }
  
  getHasPayments() {
    return this.hasPayments;
  }

  setHasPayments(hasPayments) {
    this.hasPayments = hasPayments;
  }
  
  getPaymentIds() {
    return this.paymentIds;
  }

  setPaymentIds(CpaymentIds) {
    this.paymentIds = paymentIds;
  }
}

module.exports = MoneroTxFilter;