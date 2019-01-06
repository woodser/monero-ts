/**
 * Allows specific transactions to be queried by specifying filter options.
 * 
 * For each filter option:
 * 
 * If the filter option is undefined, the transaction will not be filtered by
 * that option.  All filter options are undefined by default.
 * 
 * If the filter option is defined and not false, the transaction must match it
 * or it will be filtered.
 * 
 * If the filter option is false, the transaction must not match it or it will be
 * filtered.
 * 
 * incoming, outgoing, confirmed, txpool, relayed, failed, coinbase, hasPayments,
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
  
  getInTxPool() {
    return this.inTxPool;
  }
  
  setInTxPool(inTxPool) {
    this.inTxPool = inTxPool;
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

  setPaymentIds(paymentIds) {
    this.paymentIds = paymentIds;
  }
  
  /**
   * Indicates if the given transaction meets the criteria of this filter and
   * will therefore not be filtered.
   * 
   * @param {MoneroWalletTx} is the transaction to check
   * @returns {boolean} true if the filter criteria are met, false otherwise
   */
  meetsCriteria(tx) {
    // TODO: does not check account index or subaddress indices
    if (this.getTxIds() !== undefined && !this.getTxIds().includes(tx.getId())) return false;
    if (this.getIsIncoming() !== undefined && this.getIsIncoming() !== tx.getIsIncoming()) return false;
    if (this.getIsOutgoing() !== undefined && this.getIsOutgoing() !== tx.getIsOutgoing()) return false;
    if (this.getIsConfirmed() !== undefined && this.getIsConfirmed() !== tx.getIsConfirmed()) return false;
    if (this.getInTxPool() !== undefined && this.getInTxPool() !== tx.getInTxPool()) return false;
    if (this.getIsRelayed() !== undefined && this.getIsRelayed() !== tx.getIsRelayed()) return false;
    if (this.getIsFailed() !== undefined && this.getIsFailed() !== tx.getIsFailed()) return false;
    if (this.getMinHeight() !== undefined && (tx.getHeight() === undefined || tx.getHeight() < this.getMinHeight())) return false;
    if (this.getMaxHeight() !== undefined && (tx.getHeight() === undefined || tx.getHeight() > this.getMaxHeight())) return false;
    if (this.getPaymentIds() !== undefined && !this.getPaymentIds().includes(tx.getPaymentId())) return false;
    if (this.getHasPayments() !== undefined) {
      if (this.getHasPayments() && (tx.getPayments() === undefined || tx.getPayments().length === 0)) return false;
      if (!this.getHasPayments() && tx.getPayments() !== undefined && tx.getPayments().length > 0) return false;
    }
    return true;
  }
}

module.exports = MoneroTxFilter;