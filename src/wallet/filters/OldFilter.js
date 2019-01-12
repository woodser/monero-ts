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
 */
class MoneroFilter {
  
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
  
  
  // TODO: this more an instruction than a filter, remove altogether and force client to get their own vouts? prolly.
  // just test specifically that vout txs can be merged with zisting txs lulz
  getFetchVouts() {
    return this.fetchVouts;
  }
  
  setFetchVouts(fetchVouts) {
    this.fetchVouts = fetchVouts;
    return this;
  }
  

  // -------- tx filter
  
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
  
  getHasOutgoingTransfer() {
    return this.hasOutgoingTransfer;
  }

  setHasOutgoingTransfer(hasOutgoingTransfer) {
    this.hasOutgoingTransfer = hasOutgoingTransfer;
  }
  
  getHasIncomingTransfers() {
    return this.hasIncomingTransfers;
  }

  setHasIncomingTransfers(hasIncomingTransfers) {
    this.hasIncomingTransfers = hasIncomingTransfers;
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
  
  // ---------- tx filter & transfer filter
  
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

  
  /**
   * Indicates if the given transaction meets the criteria of this filter and
   * will therefore not be filtered.
   * 
   * @param {MoneroWalletTx} is the transaction to check
   * @returns {boolean} true if the filter criteria are met, false otherwise
   */
  meetsCriteria(tx) {
    
    // filter on account idx by checking outgoing and incoming account indices
    if (this.getAccountIndex() !== undefined) {
      let matchingTransfer = false;
      if (tx.getOutgoingTransfer() && tx.getOutgoingTransfer().getAccountIndex() === this.getAccountIndex()) {
        matchingTransfer = true;
      } else if (tx.getIncomingTransfers()) {
        for (let transfer of tx.getIncomingTransfers()) {
          if (transfer.getAccountIndex() === this.getAccountIndex()) {
            matchingTransfer = true;
            break;
          }
        }
      }
      if (!matchingTransfer) return false;
    }
    
    // filter on subaddress idx by checking outgoing and incoming subaddress indices
    if (this.getSubaddressIndices() !== undefined) {
      let matchingTransfer = false;
      for (let subaddressIdx of this.getSubaddressIndices()) {
        if (tx.getOutgoingTransfer() && tx.getOutgoingTransfer().getSubaddressIndex() === subaddressIdx) {  // TODO: outgoing subaddress always 0, remove entirely?
          matchingTransfer = true;
        } else if (tx.getIncomingTransfers()) {
          for (let transfer of tx.getIncomingTransfers()) {
            if (transfer.getSubaddressIndex() === subaddressIdx) {
              matchingTransfer = true;
              break;
            }
          }
        }
      }
      if (!matchingTransfer) return false;
    }
    
    // filter on outgoing transfers
    if (this.getHasOutgoingTransfer() !== undefined) {
      if (this.getHasOutgoingTransfer() && (tx.getOutgoingTransfer() === undefined)) return false;
      if (!this.getHasOutgoingTransfer() && tx.getOutgoingTransfer() !== undefined) return false;
    }
    
    // filter on incoming transfers
    if (this.getHasIncomingTransfers() !== undefined) {
      if (this.getHasIncomingTransfers() && (tx.getIncomingTransfers() === undefined || tx.getIncomingTransfers().length === 0)) return false;
      if (!this.getHasIncomingTransfers() && tx.getIncomingTransfers() !== undefined && tx.getIncomingTransfers().length > 0) return false;
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
    
    // tx meets this filter's criteria
    return true;
  }
}

module.exports = MoneroFilter;