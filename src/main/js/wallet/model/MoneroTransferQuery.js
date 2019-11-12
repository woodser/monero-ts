const MoneroTransfer = require("./MoneroTransfer");

/**
 * Configures a query to retrieve transfers.
 * 
 * All transfers are returned except those that do not meet the criteria defined in this query.
 */
class MoneroTransferQuery extends MoneroTransfer {
  
  /**
   * Constructs the query.
   * 
   * @param state is model state or json to initialize from (optional)
   */
  constructor(state) {
    super(state);
    state = this.state;
    
    // deserialize if necessary
    if (state.txQuery && !(state.txQuery instanceof MoneroTxQuery)) state.txQuery = new MoneroTxQuery(state.transferQuery);
    
    // alias isOutgoing to isIncoming
    if (state.isOutgoing !== undefined) state.isIncoming = !state.isOutgoing;
  }
  
  copy() {
    return new MoneroTransferQuery(this);
  }
  
  toJson() {
    let json = Object.assign({}, this.state, super.toJson());
    delete json.txQuery;
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
  
  hasDestinations() {
    return this.state.hasDestinations;
  }
  
  setHasDestinations(hasDestinations) {
    this.state.hasDestinations = hasDestinations;
    return this;
  }
  
  getTxQuery() {
    return this.state.txQuery;
  }
  
  setTxQuery(txQuery) {
    this.state.txQuery = txQuery;
    return this;
  }
  
  meetsCriteria(transfer) {
    assert(transfer !== null, "transfer is null");
    assert(transfer instanceof MoneroTransfer);
    
    // filter on common fields
    if (this.isIncoming() !== undefined && this.isIncoming() !== transfer.isIncoming()) return false;
    if (this.isOutgoing() !== undefined && this.isOutgoing() !== transfer.isOutgoing()) return false;
    if (this.getAmount() !== undefined && this.getAmount().compare(transfer.getAmount()) !== 0) return false;
    if (this.getAccountIndex() !== undefined && this.getAccountIndex() !== transfer.getAccountIndex()) return false;
    
    // filter on incoming fields
    if (transfer instanceof MoneroIncomingTransfer) {
      if (this.hasDestinations()) return false;
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
      if (this.hasDestinations() !== undefined) {
        if (this.hasDestinations() && transfer.getDestinations() === undefined) return false;
        if (!this.hasDestinations() && transfer.getDestinations() !== undefined) return false;
      }
      
      // filter on destinations TODO: start with test for this
//    if (this.getDestionations() !== undefined && this.getDestionations() !== transfer.getDestionations()) return false;
    }
    
    // otherwise invalid type
    else throw new Error("Transfer must be MoneroIncomingTransfer or MoneroOutgoingTransfer");
    
    // filter with tx filter
    if (this.getTxQuery() !== undefined && !this.getTxQuery().meetsCriteria(transfer.getTx())) return false;    
    return true;
  }
}

module.exports = MoneroTransferQuery;