const MoneroTransfer = require("./MoneroTransfer");

/**
 * Models an incoming transfer of funds to the wallet.
 */
class MoneroIncomingTransfer extends MoneroTransfer {
  
  /**
   * Construct the model.
   * 
   * @param {MoneroTransfer|object} state is existing state to initialize from (optional)
   */
  constructor(state) {
    super(state);
  }
  
  isIncoming() {
    return true;
  }
  
  getSubaddressIndex() {
    return this.state.subaddressIndex;
  }
  
  setSubaddressIndex(subaddressIndex) {
    this.state.subaddressIndex = subaddressIndex;
    return this;
  }
  
  getAddress() {
    return this.state.address;
  }

  setAddress(address) {
    this.state.address = address;
    return this;
  }

  copy() {
    return new MoneroIncomingTransfer(this.toJson());
  }
  
  /**
   * Updates this transaction by merging the latest information from the given
   * transaction.
   * 
   * Merging can modify or build references to the transfer given so it
   * should not be re-used or it should be copied before calling this method.
   * 
   * @param {MoneroIncomingTransfer} transfer is the transfer to merge into this one
   */
  merge(transfer) {
    super.merge(transfer);
    assert(transfer instanceof MoneroIncomingTransfer);
    if (this === transfer) return this;
    this.setSubaddressIndex(MoneroUtils.reconcile(this.getSubaddressIndex(), transfer.getSubaddressIndex()));
    this.setAddress(MoneroUtils.reconcile(this.getAddress(), transfer.getAddress()));
    return this;
  }
  
  toString() {
    return this.toString(0);
  }
  
  toString(indent) {
    let str = super.toString(indent) + "\n";
    str += MoneroUtils.kvLine("Subaddress index", this.getSubaddressIndex(), indent);
    str += MoneroUtils.kvLine("Address", this.getAddress(), indent);
    return str.slice(0, str.length - 1);  // strip last newline
  }
}

module.exports = MoneroIncomingTransfer;