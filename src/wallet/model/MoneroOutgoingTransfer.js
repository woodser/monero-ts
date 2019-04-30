const assert = require("assert");
const MoneroUtils = require("../../utils/MoneroUtils");
const MoneroTransfer = require("../model/MoneroTransfer");

/**
 * Models an outgoing transfer of funds from the wallet.
 */
class MoneroOutgoingTransfer extends MoneroTransfer {

  /**
   * Construct the model.
   * 
   * @param {MoneroOutgoingTranser|object} state is existing state to initialize from (optional)
   */
  constructor(state) {
    super(state);
    state = this.state;
    
    // deserialize destinations
    if (state.destinations) {
      for (let i = 0; i < state.destinations.length; i++) {
        if (!(state.destinations[i] instanceof MoneroDestination)) state.destinations[i] = new MoneroDestination(state.destinations[i]);
      }
    }
  }
  
  getIsIncoming() {
    return false;
  }
  
  getIsOutgoing() {
    return true;
  }
  
  getSubaddressIndices() {
    return this.state.subaddressIndices;
  }

  setSubaddressIndices(subaddressIndices) {
    this.state.subaddressIndices = subaddressIndices;
    return this;
  }
  
  getAddresses() {
    return this.state.addresses;
  }

  setAddresses(addresses) {
    this.state.addresses = addresses;
    return this;
  }

  getDestinations() {
    return this.state.destinations;
  }
  
  setDestinations(destinations) {
    this.state.destinations = destinations;
    return this;
  }
  
  copy() {
    return new MoneroOutgoingTransfer(this);
  }
  
  toJson() {
    let json = Object.assign({}, this.state, super.toJson()); // merge json onto inherited state
    if (this.getDestinations()) {
      json.destinations = [];
      for (let destination of this.getDestination()) json.destinations.push(destination.toJson());
    }
    return json;
  }
  
  /**
   * Updates this transaction by merging the latest information from the given
   * transaction.
   * 
   * Merging can modify or build references to the transfer given so it
   * should not be re-used or it should be copied before calling this method.
   * 
   * @param transfer is the transfer to merge into this one
   */
  merge(transfer) {
    super.merge(transfer);
    assert(transfer instanceof MoneroOutgoingTransfer);
    if (this === transfer) return this;
    this.setSubaddressIndices(MoneroUtils.reconcile(this.getSubaddressIndices(), transfer.getSubaddressIndices()));
    this.setAddresses(MoneroUtils.reconcile(this.getAddresses(), transfer.getAddresses()));
    this.setDestinations(MoneroUtils.reconcile(this.getDestinations(), transfer.getDestinations()));
    return this;
  }
  
  public String toString() {
    return toString(0);
  }
  
  public String toString(int indent) {
    let str = super.toString(indent) + "\n";
    str += MoneroUtils.kvLine("Subaddress indices", this.getSubaddressIndices(), indent);
    str += MoneroUtils.kvLine("Addresses", this.getAddresses(), indent);
    if (this.getDestinations()) {
      str += MoneroUtils.kvLine("Destinations", "", indent);
      for (let i = 0; i < this.getDestinations().length; i++) {
        str += MoneroUtils.kvLine(i + 1, "", indent + 1);
        str += this.getDestinations()[i].toString(indent + 2) + "\n");
      }
      return str.slice(0, str.length - 1);  // strip last newline
    }
  }
}
