assert = require("assert");
const MoneroTransfer = require("../model/MoneroTransfer");

/**
 * Filters transfers that don't match initialized filter criteria.
 * 
 * Extends MoneroTransfer to enable direct filtering on every transfer field.
 */
class MoneroTransferFilter extends MoneroTransfer {
  
  /**
   * Constructs the filter.
   * 
   * @param state is a model or json to initialize from (optional)
   */
  constructor(state) {
    super(state);
  }
  
  getIsOutgoing() {
    return this.isOutgoing;
  }
  
  setIsOutgoing(isOutgoing) {
    this.isOutgoing = isOutgoing;
    return this;
  }
  
  getIsIncoming() {
    return this.isOutgoing === undefined ? undefined : !this.isOutgoing;
  }
  
  setIsIncoming(isIncoming) {
    return this.setIsOutgoing(isIncoming === undefined ? undefined : !isIncoming);
  }
  
  getHasDestinations() {
    return this.hasDestinations;
  }
  
  setHasDestinations(hasDestinations) {
    this.hasDestinations = hasDestinations;
    return this;
  }
  
  getSubaddressIndices() {
    this.subaddressIndices;
  }
  
  setSubaddressIndices(subaddressIndices) {
    this.subaddressIndices = subaddressIndices;
    return this;
  }
  
  getTxFilter() {
    return this.txFilter;
  }
  
  setTxFilter(txFilter) {
    this.txFilter = txFilter;
    return this;
  }
  
  meetsCriteria(transfer) {
    assert(transfer instanceof MoneroTransfer);
    
    // direct comparisons
    if (this.getAddress() !== undefined && this.getAddress() !== transfer.getAddress()) return false;
    if (this.getAccountIndex() !== undefined && this.getAccountIndex() !== transfer.getAccountIndex()) return false;
    if (this.getSubaddressIndex() !== undefined && this.getSubaddressIndex() !== transfer.getSubaddressIndex()) return false;
    if (this.getAmount() !== undefined && this.getAmount().compare(transfer.getAmount()) !== 0) return false;
    
    // custom handling TODO
//    if (this.getDestionations() !== undefined && this.getDestionations() !== transfer.getDestionations()) return false;
//    if (this.getTx() !== undefined && this.getTx() !== transfer.getTx()) return false;
    
    // filter extensions
    if (this.getIsIncoming() !== undefined && this.getIsIncoming() !== transfer.getIsIncoming()) return false;
    if (this.getIsOutgoing() !== undefined && this.getIsOutgoing() !== transfer.getIsOutgoing()) return false;
    if (this.getHasDestinations() !== undefined) {
      if (this.getHasDestinations() && transfer.getDestinations() === undefined) return false;
      if (!this.getHasDestinations() && transfer.getDestinations() !== undefined) return false;
    }
    if (this.getSubaddressIndices() !== undefined && !this.getSubaddressIndices().includes(transfer.getSubaddressIndex())) return false;
    
    // TODO: tx filter
    
    // transfer meets filter criteria
    return true;
  }
}

module.exports = MoneroTransferFilter;