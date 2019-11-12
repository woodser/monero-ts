const MoneroTxWallet = require("./MoneroTxWallet");

/**
 * Configures a query to retrieve transactions.
 * 
 * All transactions are returned except those that do not meet the criteria defined in this query.
 */
class MoneroTxQuery extends MoneroTxWallet {
  
  /**
   * Constructs the query.
   * 
   * @param state is model state or json to initialize from (optional)
   */
  constructor(state) {
    super(state);
    
    // deserialize if necessary
    if (this.state.transferQuery && !(this.state.transferQuery instanceof MoneroTransferQuery)) this.state.transferQuery = new MoneroTransferQuery(this.state.transferQuery);
    if (this.state.outputQuery && !(this.state.outputQuery instanceof MoneroOutputQuery)) this.state.outputQuery = new MoneroOutputQuery(this.state.outputQuery);
    
    // alias 'txId' to txIds
    if (this.state.txId) {
      this.setTxIds([this.state.txId]);
      delete this.state.txId;
    }
  }
  
  copy() {
    return new MoneroTxQuery(this);
  }
  
  toJson() {
    let json = Object.assign({}, this.state, super.toJson()); // merge json onto inherited state
    if (this.getTransferQuery()) json.transferQuery = this.getTransferQuery().toJson();
    if (this.getOutputQuery()) json.outputQuery = this.getOutputQuery().toJson();
    delete json.block;  // do not serialize parent block
    return json;
  }
  
  isIncoming() {
    return this.state.isIncoming;
  }
  
  setIsIncoming(isIncoming) {
    this.state.isIncoming = isIncoming;
    return this;
  }
  
  isOutgoing() {
    return this.state.isOutgoing;
  }
  
  setIsOutgoing(isOutgoing) {
    this.state.isOutgoing = isOutgoing;
    return this;
  }

  getTxIds() {
    return this.state.txIds;
  }

  setTxIds(txIds) {
    this.state.txIds = txIds;
    return this;
  }
  
  setTxId(txId) {
    if (txId === undefined) return this.setTxIds(undefined);
    assert(typeof txId === "string");
    return this.setTxIds([txId]);
  }
  
  hasPaymentId() {
    return this.state.hasPaymentId;
  }
  
  setHasPaymentId() {
    this.state.hasPaymentId = hasPaymentId;
    return this;
  }
  
  getPaymentIds() {
    return this.state.paymentIds;
  }

  setPaymentIds(paymentIds) {
    this.state.paymentIds = paymentIds;
    return this;
  }
  
  setPaymentId(paymentId) {
    if (paymentId === undefined) return this.setPaymentIds(undefined);
    assert(typeof paymentId === "string");
    return this.setPaymentIds([paymentId]);
  }
  
  getHeight() {
    return this.state.height;
  }
  
  setHeight(height) {
    this.state.height = height;
    return this;
  }
  
  getMinHeight() {
    return this.state.minHeight;
  }

  setMinHeight(minHeight) {
    this.state.minHeight = minHeight;
    return this;
  }

  getMaxHeight() {
    return this.state.maxHeight;
  }

  setMaxHeight(maxHeight) {
    this.state.maxHeight = maxHeight;
    return this;
  }
  
  getIncludeOutputs() {
    return this.state.includeOutputs;
  }

  setIncludeOutputs(includeOutputs) {
    this.state.includeOutputs = includeOutputs;
    return this;
  }
  
  getTransferQuery() {
    return this.state.transferQuery;
  }
  
  setTransferQuery(transferQuery) {
    this.state.transferQuery = transferQuery;
    return this;
  }
  
  getOutputQuery() {
    return this.state.outputQuery;
  }
  
  setOutputQuery(outputQuery) {
    this.state.outputQuery = outputQuery;
    return this;
  }
  
  // TODO: this filtering is not complete
  meetsCriteria(tx) {
    if (!(tx instanceof MoneroTxWallet)) return false;
    
    // filter on tx
    if (this.getId() !== undefined && this.getId() !== tx.getId()) return false;
    if (this.getPaymentId() !== undefined && this.getPaymentId() !== tx.getPaymentId()) return false;
    if (this.isConfirmed() !== undefined && this.isConfirmed() !== tx.isConfirmed()) return false;
    if (this.inTxPool() !== undefined && this.inTxPool() !== tx.inTxPool()) return false;
    if (this.getDoNotRelay() !== undefined && this.getDoNotRelay() !== tx.getDoNotRelay()) return false;
    if (this.isRelayed() !== undefined && this.isRelayed() !== tx.isRelayed()) return false;
    if (this.isFailed() !== undefined && this.isFailed() !== tx.isFailed()) return false;
    if (this.isMinerTx() !== undefined && this.isMinerTx() !== tx.isMinerTx()) return false;
    
    // at least one transfer must meet transfer filter if defined
    if (this.getTransferQuery()) {
      let matchFound = false;
      if (tx.getOutgoingTransfer() && this.getTransferQuery().meetsCriteria(tx.getOutgoingTransfer())) matchFound = true;
      else if (tx.getIncomingTransfers()) {
        for (let incomingTransfer of tx.getIncomingTransfers()) {
          if (this.getTransferQuery().meetsCriteria(incomingTransfer)) {
            matchFound = true;
            break;
          }
        }
      }
      if (!matchFound) return false;
    }
    
    // at least one output must meet output query if defined
    if (this.getOutputQuery() !== undefined && !this.getOutputQuery().isDefault()) {
      if (tx.getVouts() === undefined || tx.getVouts().length === 0) return false;
      let matchFound = false;
      for (let vout of tx.getVouts()) {
        if (this.getOutputQuery().meetsCriteria(vout)) {
          matchFound = true;
          break;
        }
      }
      if (!matchFound) return false;
    }
    
    // filter on having a payment id
    if (this.hasPaymentId() !== undefined) {
      if (this.hasPaymentId() && tx.getPaymentId() === undefined) return false;
      if (!this.hasPaymentId() && tx.getPaymentId() !== undefined) return false;
    }
    
    // filter on incoming
    if (this.isIncoming() !== undefined) {
      if (this.isIncoming() && !tx.isIncoming()) return false;
      if (!this.isIncoming() && tx.isIncoming()) return false;
    }
    
    // filter on outgoing
    if (this.isOutgoing() !== undefined) {
      if (this.isOutgoing() && !tx.isOutgoing()) return false;
      if (!this.isOutgoing() && tx.isOutgoing()) return false;
    }
    
    // filter on remaining fields
    let txHeight = tx.getBlock() === undefined ? undefined : tx.getBlock().getHeight();
    if (this.getTxIds() !== undefined && !this.getTxIds().includes(tx.getId())) return false;
    if (this.getPaymentIds() !== undefined && !this.getPaymentIds().includes(tx.getPaymentId())) return false;
    if (this.getHeight() !== undefined && (txHeight === undefined || txHeight !== this.getHeight())) return false;
    if (this.getMinHeight() !== undefined && (txHeight === undefined || txHeight < this.getMinHeight())) return false;
    if (this.getMaxHeight() !== undefined && (txHeight === undefined || txHeight > this.getMaxHeight())) return false;
    
    // transaction meets filter criteria
    return true;
  }
}

module.exports = MoneroTxQuery;