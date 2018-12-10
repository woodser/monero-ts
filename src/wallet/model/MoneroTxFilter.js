/**
 * Specifies filter options when querying transactions.
 */
class MoneroTxFilter {
  
  // constructs with defaults
  constructor() {
    this.incoming = true;   // tx is incoming to the wallet
    this.outgoing = true;   // tx is outgoing from the wallet
    this.confirmed = true;  // tx is confirmed
    this.mempool = true;    // tx is in mempool
    this.relayed = true;    // tx is relayed  // TODO: test fetching transactions with this value, throw exception? // TODO: should be notRelayed
    this.failed = true;     // tx has failed
  }
  
  getIncoming() {
    return this.incoming;
  }
  
  setIncoming(incoming) {
    this.incoming = incoming;
  }
  
  getOutgoing() {
    return this.outgoing;
  }
  
  setOutgoing(outgoing) {
    this.outgoing = outgoing;
  }
  
  getConfirmed() {
    return this.confirmed;
  }
  
  setConfirmed(confirmed) {
    this.confirmed = confirmed;
  }
  
  getMempool() {
    return this.mempool;
  }
  
  setMempool(mempool) {
    this.mempool = mempool;
  }
  
  getRelayed() {
    return this.relayed;
  }
  
  setRelayed(relayed) {
    this.relayed = relayed;
  }
  
  getFailed() {
    return this.failed;
  }
  
  setFailed(failed) {
    return this.failed = failed;
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

  getPaymentIds() {
    return this.paymentIds;
  }

  setPaymentIds(CpaymentIds) {
    this.paymentIds = paymentIds;
  }

  getHasPayments() {
    return this.hasPayments;
  }

  setHasPayments(hasPayments) {
    this.hasPayments = hasPayments;
  }
}

module.exports = MoneroTxFilter;