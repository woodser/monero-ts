const assert = require("assert");
const Filter = require("../../utils/Filter");
const MoneroTransfer = require("../model/MoneroTransfer");
const MoneroIncomingTransfer = require("../model/MoneroIncomingTransfer");
const MoneroOutgoingTransfer = require("../model/MoneroOutgoingTransfer");

/**
 * Filters transfers that don't match initialized filter criteria.
 */
class MoneroTransferRequest extends MoneroTransfer {
  
  /**
   * Constructs the request.
   * 
   * @param state is model state or json to initialize from (optional)
   */
  constructor(state) {
    super(state);
    state = this.state;
    
    // deserialize if necessary
    if (state.txRequest && !(state.txRequest instanceof MoneroTxRequest)) state.txRequest = new MoneroTxRequest(state.transferRequest);
    
    // alias isOutgoing to isIncoming
    if (state.isOutgoing !== undefined) state.isIncoming = !state.isOutgoing;
  }
  
  getIsIncoming() {
    return this.state.isIncoming;
  }

  setIsIncoming(isIncoming) {
    this.state.isIncoming = isIncoming;
    return this;
  }
  
  getIsOutgoing() {
    return this.state.isIncoming === undefined ? undefined : !this.state.isIncoming;
  }
  
  setIsOutgoing(isOutgoing) {
    this.state.isIncoming = isOutgoing === undefined ? undefined : !isOutgoing;
    return this;
  }
  
  getAddress() {
    return this.state.address;
  }

  setAddress(address) {
    this.state.address = address;
    return this;
  }
  
  getAddresses() {
    return this.state.addresses;
  }

  setAddresses(addresses) {
    this.state.addresses = addresses;
    return this;
  }
  
  getSubaddressIndex() {
    return this.state.subaddressIndex;
  }
  
  setSubaddressIndex(subaddressIndex) {
    this.state.subaddressIndex = subaddressIndex;
    return this;
  }
  
  getSubaddressIndices() {
    return this.state.subaddressIndices;
  }
  
  setSubaddressIndices(subaddressIndices) {
    this.state.subaddressIndices = subaddressIndices;
    return this;
  }
  
  getDestinations() {
    return this.state.destinations;
  }
  
  setDestinations(destinations) {
    this.state.destinations = destinations;
    return this;
  }
  
  getHasDestinations() {
    return this.state.hasDestinations;
  }
  
  setHasDestinations(hasDestinations) {
    this.state.hasDestinations = hasDestinations;
    return this;
  }
  
  getTxRequest() {
    return this.state.txRequest;
  }
  
  setTxRequest(txRequest) {
    this.state.txRequest = txRequest;
    return this;
  }
  
  meetsCriteria(transfer) {
    if (transfer === undefined) return false;
    assert(transfer instanceof MoneroTransfer);
    
    // filter on common fields
    if (this.getIsIncoming() !== undefined && this.getIsIncoming() !== transfer.getIsIncoming()) return false;
    if (this.getIsOutgoing() !== undefined && this.getIsOutgoing() !== transfer.getIsOutgoing()) return false;
    if (this.getAmount() !== undefined && this.getAmount().compare(transfer.getAmount()) !== 0) return false;
    if (this.getAccountIndex() !== undefined && this.getAccountIndex() !== transfer.getAccountIndex()) return false;
    
    // filter on incoming fields
    if (transfer instanceof MoneroIncomingTransfer) {
      if (this.getHasDestinations()) return false;
      if (this.getAddress() !== undefined && this.getAddress() !== transfer.getAddress()) return false;
      if (this.getAddresses() !== undefined && !this.getAddresses().includes(transfer.getAddress())) return false;
      if (this.getSubaddressIndex() !== undefined && this.getSubaddressIndex() !== transfer.getSubaddressIndex()) return false;
      if (this.getSubaddressIndices() !== undefined && !this.getSubaddressIndices().includes(transfer.getSubaddressIndex())) return false;
    }

    // filter on outgoing fields
    else if (transfer instanceof MoneroOutgoingTransfer) {
      
      // filter on addresses which must have overlap
      if (this.getAddress() !== undefined && (transfer.getAddresses() === undefined || !transfer.getAddresses().includes(this.getAddress()))) return false;   // TODO: will filter all transfers that don't contain addresses (outgoing txs might not have this field initialized)
      if (this.getAddresses() !== undefined) {
        if (!transfer.getAddresses()) return false;
        if (!this.getAddresses().some(address => transfer.getAddresses().includes(address))) return false;
      }
      
      // filter on subaddress indices
      if (this.getSubaddressIndex() !== undefined && (transfer.getSubaddressIndices() === undefined || !transfer.getSubaddressIndices().includes(this.getSubaddressIndex()))) return false;
      if (this.getSubaddressIndices() !== undefined) {
        if (!transfer.getSubaddressIndices()) return false;
        if (!this.getSubaddressIndices().some(subaddressIdx => transfer.getSubaddressIndices().includes(subaddressIdx))) return false;
      }
      
      // filter on having destinations
      if (this.getHasDestinations() !== undefined) {
        if (this.getHasDestinations() && transfer.getDestinations() === undefined) return false;
        if (!this.getHasDestinations() && transfer.getDestinations() !== undefined) return false;
      }
      
      // filter on destinations TODO: start with test for this
//    if (this.getDestionations() !== undefined && this.getDestionations() !== transfer.getDestionations()) return false;
    }
    
    // otherwise invalid type
    else throw new Error("Transfer must be MoneroIncomingTransfer or MoneroOutgoingTransfer");
    
    // filter with tx filter
    if (this.getTxRequest() !== undefined && !this.getTxRequest().meetsCriteria(transfer.getTx())) return false;    
    return true;
  }
}

module.exports = MoneroTransferRequest;