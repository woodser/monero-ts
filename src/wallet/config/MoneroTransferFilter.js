const assert = require("assert");
const Filter = require("../../utils/Filter");
const MoneroTransfer = require("../model/MoneroTransfer");

/**
 * Filters transfers that don't match initialized filter criteria.
 */
class MoneroTransferFilter extends Filter {
  
  /**
   * Constructs the filter.
   * 
   * @param state is model state or json to initialize from (optional)
   */
  constructor(state) {
    super();
    state = Object.assign({}, state);
    this.state = state;
    if (!state.transfer) state.transfer = new MoneroTransfer(state);
    
    // deserialize if necessary
    if (state.txFilter && !(state.txFilter instanceof MoneroTxFilter)) state.txFilter = new MoneroTxFilter(state.transferFilter);
    if (!(state.transfer instanceof MoneroTransfer)) state.transfer = new MoneroTransfer(state.transfer);
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
  
  getTransfer() {
    return this.state.transfer;
  }
  
  setTransfer(transfer) {
    this.state.transfer = transfer;
    return this;
  }
  
  meetsCriteria(transfer) {
    if (!(transfer instanceof MoneroTransfer)) return false;

    // filter on transfer
    if (this.getTransfer()) {
      let tr = this.getTransfer();
      if (tr.getAddress() !== undefined && tr.getAddress() !== transfer.getAddress()) return false;
      if (tr.getAccountIndex() !== undefined && tr.getAccountIndex() !== transfer.getAccountIndex()) return false;
      if (tr.getSubaddressIndex() !== undefined && !transfer.getIsOutgoing() && tr.getSubaddressIndex() !== transfer.getSubaddressIndex()) return false; // outgoing subaddresses are always 0 TODO monero-wallet-rpc: possible to return correct subaddress?
      if (tr.getAmount() !== undefined && tr.getAmount().compare(transfer.getAmount()) !== 0) return false;
    }
    
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
    
    // filter on destinations TODO
//  if (this.getDestionations() !== undefined && this.getDestionations() !== transfer.getDestionations()) return false;
    
    // transfer meets filter criteria
    return true;
  }
}

module.exports = MoneroTransferFilter;