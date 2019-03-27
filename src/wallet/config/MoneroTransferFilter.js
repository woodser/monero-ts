const assert = require("assert");
const Filter = require("../../utils/Filter");
const MoneroTransfer = require("../model/MoneroTransfer");

/**
 * Filters transfers that don't match initialized filter criteria.
 */
class MoneroTransferFilter extends MoneroTransfer {
  
  /**
   * Constructs the filter.
   * 
   * @param state is model state or json to initialize from (optional)
   */
  constructor(state) {
    super(state);
    
    // deserialize if necessary
    if (this.state.txFilter && !(this.state.txFilter instanceof MoneroTxFilter)) this.state.txFilter = new MoneroTxFilter(this.state.transferFilter);
  }
  
  getIsOutgoing() {
    return this.state.isOutgoing;
  }
  
  setIsOutgoing(isOutgoing) {
    this.state.isOutgoing = isOutgoing;
    return this;
  }
  
  getIsIncoming() {
    return this.state.isIncoming;
  }
  
  setIsIncoming(isIncoming) {
    this.state.isIncoming = isIncoming;
    return this;
  }
  
  getHasDestinations() {
    return this.state.hasDestinations;
  }
  
  setHasDestinations(hasDestinations) {
    this.state.hasDestinations = hasDestinations;
    return this;
  }
  
  getSubaddressIndices() {
    return this.state.subaddressIndices;
  }
  
  setSubaddressIndices(subaddressIndices) {
    this.state.subaddressIndices = subaddressIndices;
    return this;
  }
  
  getTxFilter() {
    return this.state.txFilter;
  }
  
  setTxFilter(txFilter) {
    this.state.txFilter = txFilter;
    return this;
  }
  
  meetsCriteria(transfer) {
    if (!(transfer instanceof MoneroTransfer)) return false;
    
    // filter on transfer fields
    if (this.getAddress() !== undefined && this.getAddress() !== transfer.getAddress()) return false;
    if (this.getAccountIndex() !== undefined && this.getAccountIndex() !== transfer.getAccountIndex()) return false;
    if (this.getSubaddressIndex() !== undefined && !transfer.getIsOutgoing() && this.getSubaddressIndex() !== transfer.getSubaddressIndex()) return false; // outgoing subaddresses are always 0 TODO monero-wallet-rpc: possible to return correct subaddress?
    if (this.getAmount() !== undefined && this.getAmount().compare(transfer.getAmount()) !== 0) return false;
    
    // filter extensions
    if (this.getIsIncoming() !== undefined && this.getIsIncoming() !== transfer.getIsIncoming()) return false;
    if (this.getIsOutgoing() !== undefined && this.getIsOutgoing() !== transfer.getIsOutgoing()) return false;
    if (this.getSubaddressIndices() !== undefined && !this.getSubaddressIndices().includes(transfer.getSubaddressIndex())) return false;
    if (this.getHasDestinations() !== undefined) {
      if (this.getHasDestinations() && transfer.getDestinations() === undefined) return false;
      if (!this.getHasDestinations() && transfer.getDestinations() !== undefined) return false;
    }
    
    // filter with transaction filter
    if (this.getTxFilter() && !this.getTxFilter().meetsCriteria(transfer.getTx())) return false;
    
    // filter on destinations TODO: start with test for this
//  if (this.getDestionations() !== undefined && this.getDestionations() !== transfer.getDestionations()) return false;
    
    // transfer meets filter criteria
    return true;
  }
}

module.exports = MoneroTransferFilter;