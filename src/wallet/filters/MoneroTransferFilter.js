assert = require("assert");
const Filter = require("../../utils/Filter");
const MoneroTransfer = require("../model/MoneroTransfer");

/**
 * Filters transfers that don't match initialized filter criteria.
 */
class MoneroTransferFilter extends Filter {
  
  /**
   * Constructs the filter.
   * 
   * @param state is a model or json to initialize from (optional)
   */
  constructor(state) {
    super();
    this.state = Object.assign({}, state);
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
    
    let debug = transfer.getTx().getId() === "219c7917bb9d2288f468256539250fd56c5d15cb3c22f9850e98490e67efa860";
    if (debug) console.log(transfer.toString());
    
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
    
    if (debug) console.log("RETURNING TRUE! " + transfer.getTx().getId());
    
    // transfer meets filter criteria
    return true;
  }
}

module.exports = MoneroTransferFilter;