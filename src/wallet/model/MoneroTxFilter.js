/**
 * Specifies filter options when querying transactions.
 */
class MoneroTxFilter {
  
  // constructs with defaults
  constructor() {
    throw new Error("Not implemented");
  }
  
  getIncoming() {
    return this.json.incoming;
  }
  
  setIncoming(incoming) {
    this.json.incoming = incoming;
  }
  
  getOutgoing() {
    return this.json.outgoing;
  }
  
  setOutgoing(outgoing) {
    this.json.outgoing = outgoing;
  }
  
  getConfirmed() {
    return this.json.confirmed;
  }
  
  setConfirmed(confirmed) {
    this.json.confirmed = confirmed;
  }
  
  getPending() {
    return this.json.pending;
  }
  
  setPending(pending) {
    this.json.pending = pending;
  }
  
  getRelayed() {
    return this.json.relayed;
  }
  
  setRelayed(relayed) {
    this.json.relayed = relayed;
  }
  
  getFailed() {
    return this.json.failed;
  }
  
  setFailed(failed) {
    return this.json.failed = failed;
  }

  getMinHeight() {
    return this.json.minHeight;
  }

  setMinHeight(minHeight) {
    this.json.minHeight = minHeight;
  }

  getMaxHeight() {
    return this.json.maxHeight;
  }

  setMaxHeight(maxHeight) {
    this.json.maxHeight = maxHeight;
  }

  getAccountIndex() {
    return this.json.accountIndex;
  }

  setAccountIndex(accountIndex) {
    this.json.accountIndex = accountIndex;
  }

  getSubaddressIndices() {
    return this.json.subaddressIndices;
  }

  setSubaddressIndices(subaddressIndices) {
    this.json.subaddressIndices = subaddressIndices;
  }

  getTxIds() {
    return this.json.txIds;
  }

  setTxIds(txIds) {
    this.json.txIds = txIds;
  }

  getPaymentIds() {
    return this.json.paymentIds;
  }

  setPaymentIds(CpaymentIds) {
    this.json.paymentIds = paymentIds;
  }

  getHasPayments() {
    return this.json.hasPayments;
  }

  setHasPayments(hasPayments) {
    this.json.hasPayments = hasPayments;
  }
}

modules.export = MoneroTxFilter;