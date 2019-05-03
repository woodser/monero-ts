const assert = require("assert");
const Filter = require("../../utils/Filter");
const MoneroTxWallet = require("../model/MoneroTxWallet");
const MoneroTransferFilter = require("./MoneroTransferFilter"); // TODO: combine filters file so these can import each other?

/**
 * Filters transactions that don't match initialized filter criteria.
 */
class MoneroTxFilter extends MoneroTxWallet {
  
  /**
   * Constructs the filter.
   * 
   * @param state is model state or json to initialize from (optional)
   */
  constructor(state) {
    super(state);
    
    // deserialize if necessary
    if (this.state.transferFilter && !(this.state.transferFilter instanceof MoneroTransferFilter)) this.state.transferFilter = new MoneroTransferFilter(this.state.transferFilter);
  }
  
  getIsIncoming() {
    return this.state.isIncoming;
  }
  
  setIsIncoming(isIncoming) {
    this.state.isIncoming = isIncoming;
    return this;
  }
  
  getIsOutgoing() {
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
  
  getHasPaymentId() {
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
  
  getIncludeVouts() {
    return this.state.includeVouts;
  }

  setIncludeVouts(includeVouts) {
    this.state.includeVouts = includeVouts;
    return this;
  }
  
  getTransferFilter() {
    return this.state.transferFilter;
  }
  
  setTransferFilter(transferFilter) {
    this.state.transferFilter = transferFilter;
    return this;
  }
  
  // TODO: this filtering is not complete
  meetsCriteria(tx) {
    if (!(tx instanceof MoneroTxWallet)) return false;
    
    // filter on tx
    if (this.getId() !== undefined && this.getId() !== tx.getId()) return false;
    if (this.getPaymentId() !== undefined && this.getPaymentId() !== tx.getPaymentId()) return false;
    if (this.getIsConfirmed() !== undefined && this.getIsConfirmed() !== tx.getIsConfirmed()) return false;
    if (this.getInTxPool() !== undefined && this.getInTxPool() !== tx.getInTxPool()) return false;
    if (this.getDoNotRelay() !== undefined && this.getDoNotRelay() !== tx.getDoNotRelay()) return false;
    if (this.getIsRelayed() !== undefined && this.getIsRelayed() !== tx.getIsRelayed()) return false;
    if (this.getIsFailed() !== undefined && this.getIsFailed() !== tx.getIsFailed()) return false;
    if (this.getIsCoinbase() !== undefined && this.getIsCoinbase() !== tx.getIsCoinbase()) return false;
    
    // at least one transfer must meet transfer filter if defined
    if (this.getTransferFilter()) {
      let matchFound = false;
      if (tx.getOutgoingTransfer() && this.getTransferFilter().meetsCriteria(tx.getOutgoingTransfer())) matchFound = true;
      else if (tx.getIncomingTransfers()) {
        for (let incomingTransfer of tx.getIncomingTransfers()) {
          if (this.getTransferFilter().meetsCriteria(incomingTransfer)) {
            matchFound = true;
            break;
          }
        }
      }
      if (!matchFound) return false;
    }
    
    // filter on having a payment id
    if (this.getHasPaymentId() !== undefined) {
      if (this.getHasPaymentId() && tx.getPaymentId() === undefined) return false;
      if (!this.getHasPaymentId() && tx.getPaymentId() !== undefined) return false;
    }
    
    // filter on incoming
    if (this.getIsIncoming() !== undefined) {
      if (this.getIsIncoming() && !tx.getIsIncoming()) return false;
      if (!this.getIsIncoming() && tx.getIsIncoming()) return false;
    }
    
    // filter on outgoing
    if (this.getIsOutgoing() !== undefined) {
      if (this.getIsOutgoing() && !tx.getIsOutgoing()) return false;
      if (!this.getIsOutgoing() && tx.getIsOutgoing()) return false;
    }
    
    // filter on remaining fields
    let height = tx.getBlock() === undefined ? undefined : tx.getBlock().getHeight();
    if (this.getTxIds() !== undefined && !this.getTxIds().includes(tx.getId())) return false;
    if (this.getPaymentIds() !== undefined && !this.getPaymentIds().includes(tx.getPaymentId())) return false;
    if (this.getHeight() !== undefined && height !== this.getHeight()) return false;
    if (this.getMinHeight() !== undefined && (height === undefined || height < this.getMinHeight())) return false;
    if (this.getMaxHeight() !== undefined && (height === undefined || height > this.getMaxHeight())) return false;
    
    // transaction meets filter criteria
    return true;
  }
}

module.exports = MoneroTxFilter;