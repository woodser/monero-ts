const MoneroSubaddressFilter = require("./MoneroSubaddressFilter");

/**
 * Filters transactions by their attributes.
 * 
 * Transactions are only filtered if they don't match any fields that are set
 * in the filter.
 */
class MoneroTxFilter extends MoneroSubaddressFilter {
  
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
  
  getPaymentIds() {
    return this.paymentIds;
  }

  setPaymentIds(paymentIds) {
    this.paymentIds = paymentIds;
  }
  
//  // TODO: this more an instruction than a filter, remove altogether and force client to get their own vouts? prolly.
//  // just test specifically that vout txs can be merged with zisting txs lulz
//  getFetchVouts() {
//    return this.fetchVouts;
//  }
//  
//  setFetchVouts(fetchVouts) {
//    this.fetchVouts = fetchVouts;
//  }
}

module.exports = MoneroTxFilter;