const Filter = require("../../utils/Filter");

/**
 * Filters transactions by their attributes.
 * 
 * Transactions are only filtered if they don't match any fields that are set
 * in the filter.
 */
class MoneroTxFilter extends Filter {
  
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
  
  setTransferFilter(transferFilter) {
    this.transferFilter = transferFilter;
  }
  
  getTransferFilter() {
    return this.transferFilter;
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
  
  meetsCriteria(tx) {
    
    // any transfer must meet transfer filter if defined
    if (this.getTransferFilter()) {
      let matchFound = false;
      if (tx.getOutputTransfer() && this.getTransferFilter().meetsCriteria(this.getOutputTransfer())) matchFound = true;
      else if (tx.getInputTransfers()) {
        for (let inputTransfer of tx.getInputTransfers()) {
          if (this.getTransferFilter().meetsCriteria(inputTransfer)) {
            matchFound = true;
            break;
          }
        }
      }
      if (!matchFound) return false;
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
    
    // meets filter's criteria
    return true;
  }
}

module.exports = MoneroTxFilter;