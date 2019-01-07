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
  
  getIsOutgoing() {
    return this.isOutgoing;
  }
  
  setIsOutgoing(isOutgoing) {
    this.isOutgoing = isOutgoing;
  }
  
  getIsIncoming() {
    return this.isIncoming;
  }
  
  setIsIncoming(isIncoming) {
    this.isIncoming = isIncoming;
  }
  
  getTxIds() {
    return this.txIds;
  }

  setTxIds(txIds) {
    this.txIds = txIds;
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
  
  getHasOutgoingPayments() {
    return this.hasOutgoingPayments;
  }

  setHasOutgoingPayments(hasOutgoingPayments) {
    this.hasOutgoingPayments = hasOutgoingPayments;
  }
  
  getHasIncomingPayments() {
    return this.hasIncomingPayments;
  }

  setHasIncomingPayments(hasIncomingPayments) {
    this.hasIncomingPayments = hasIncomingPayments;
  }
  
  getPaymentIds() {
    return this.paymentIds;
  }

  setPaymentIds(paymentIds) {
    this.paymentIds = paymentIds;
  }
  
  // TODO: this more an instruction than a filter, remove altogether and force client to get their own vouts? prolly.
  // just test specifically that vout txs can be merged with zisting txs lulz
  getFetchVouts() {
    return this.fetchVouts;
  }
  
  setFetchVouts(fetchVouts) {
    this.fetchVouts = fetchVouts;
  }
  
  /**
   * Indicates if the given transaction meets the criteria of this filter and
   * will therefore not be filtered.
   * 
   * @param {MoneroWalletTx} is the transaction to check
   * @returns {boolean} true if the filter criteria are met, false otherwise
   */
  meetsCriteria(tx) {
    
    // filter on account idx by checking tx src account index and payment account indices
    if (this.getAccountIndex() !== undefined) {
      if (tx.getSrcAccountIndex() !== this.getAccountIndex()) {
        let matchingPayment = false;
        if (tx.getIncomingPayments()) {
          for (let payment of tx.getIncomingPayments()) {
            if (payment.getAccountIndex() === this.getAccountIndex()) {
              matchingPayment = true;
              break;
            }
          }
        }
        if (!matchingPayment) return false;
      }
    }
    
    // filter on subaddress idx by checking tx src subaddress index and payment subaddress indices
    if (this.getSubaddressIndices() !== undefined) {
      for (let subaddressIdx of this.getSubaddressIndices()) {
        if (tx.getSrcSubaddressIndex() !== subaddressIdx) {
          let matchingPayment = false;
          if (tx.getIncomingPayments()) {
            for (let payment of tx.getIncomingPayments()) {
              if (payment.getSubaddressIndex() === subaddressIdx) {
                matchingPayment = true;
                break;
              }
            }
          }
          if (!matchingPayment) return false;
        }
      }
    }
    
    // filter on outgoing payments
    if (this.getHasOutgoingPayments() !== undefined) {
      if (this.getHasOutgoingPayments() && (tx.getOutgoingPayments() === undefined || tx.getOutgoingPayments().length === 0)) return false;
      if (!this.getHasOutgoingPayments() && tx.getOutgoingPayments() !== undefined && tx.getOutgoingPayments().length > 0) return false;
    }
    
    // filter on incoming payments
    if (this.getHasIncomingPayments() !== undefined) {
      if (this.getHasIncomingPayments() && (tx.getIncomingPayments() === undefined || tx.getIncomingPayments().length === 0)) return false;
      if (!this.getHasIncomingPayments() && tx.getIncomingPayments() !== undefined && tx.getIncomingPayments().length > 0) return false;
    }
    
    // filter on remaining fields
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
    
    // tx is not filtered out
    return true;
  }
}

module.exports = MoneroTxFilter;