const assert = require("assert");
const BigInteger = require("../../submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const MoneroUtils = require("../../utils/MoneroUtils");
const MoneroDestination = require("./MoneroDestination");

/**
 * Models a directional transfer of funds from or to a wallet.
 */
class MoneroTransfer {
  
  /**
   * Construct the model.
   * 
   * @param state is the initialized model state or serialized json (optional)
   */
  constructor(state) {
    state = Object.assign({}, state);
    this.state = state;
    if (state.amount && !(state.amount instanceof BigInteger)) state.amount = BigInteger.parse(json.amount);
    if (state.destinations) {
      for (let i = 0; i < state.destinations.length; i++) {
        if (!(state.destionation[i] instanceof MoneorDestionation)) state.destinations[i] = new MoneroDestionation(state.destinations[i]);
      }
    }
  }
  
  getAddress() {
    return this.state.address;
  }

  setAddress(address) {
    this.state.address = address;
    return this;
  }

  getAccountIndex() {
    return this.state.accountIndex;
  }

  setAccountIndex(accountIndex) {
    this.state.accountIndex = accountIndex;
    return this;
  }

  getSubaddressIndex() {
    return this.state.subaddressIndex;
  }

  setSubaddressIndex(subaddressIndex) {
    this.state.subaddressIndex = subaddressIndex;
    return this;
  }

  getAmount() {
    return this.state.amount;
  }

  setAmount(amount) {
    this.state.amount = amount;
    return this;
  }
  
  getDestinations() {
    return this.state.destinations;
  }
  
  setDestinations(destinations) {
    this.state.destinations = destinations;
    return this;
  }
  
  getTx() {
    return this.state.tx;
  }
  
  setTx(tx) {
    this.state.tx = tx;
    return this;
  }
  
  getIsOutgoing() {
    return this === this.tx.getOutgoingTransfer();
  }
  
  getIsIncoming() {
    if (!this.tx.getIncomingTransfers()) return false;
    return this.tx.getIncomingTransfers().includes(this);
  }
  
  copy() {
    return new MoneroTransfer(this.toJson());
  }
  
  toJson() {
    let json = Object.assign({}, this.state);
    if (this.getAmount()) json.amount = this.getAmount().toString()
    if (this.getDestinations()) {
      json.destinations = [];
      for (let destination of this.getDestinations()) json.destinations.push(destination.toJson());
    }
    delete json.tx; // parent tx is not serialized
    return json;
  }

  /**
   * Merges the given transfer into this transfer.
   * 
   * Sets uninitialized fields to the given payent. Validates initialized fields are equal.
   * 
   * @param transfer is the transfer to merge into this one
   */
  merge(transfer) {
    assert(transfer instanceof MoneroTransfer);
    this.setAddress(MoneroUtils.reconcile(this.getAddress(), transfer.getAddress()));
    this.setAccountIndex(MoneroUtils.reconcile(this.getAccountIndex(), transfer.getAccountIndex()));
    this.setSubaddressIndex(MoneroUtils.reconcile(this.getSubaddressIndex(), transfer.getSubaddressIndex()));
    this.setAmount(MoneroUtils.reconcile(this.getAmount(), transfer.getAmount()));
    
    // merge destinations
    if (this.getDestinations() === undefined) this.setDestinations(transfer.getDestinations());
    else if (transfer.getDestinations()) {
      assert.deepEqual(this.getDestinations(), transfer.getDestinations(), "Cannot merge transfer because destinations are different");
    }
  }
  
  toString(indent = 0) {
    let str = "";
    str += MoneroUtils.kvLine("Is outgoing", this.getIsOutgoing(), indent);
    str += MoneroUtils.kvLine("Address", this.getAddress(), indent);
    str += MoneroUtils.kvLine("Account index", this.getAccountIndex(), indent);
    str += MoneroUtils.kvLine("Subaddress index", this.getSubaddressIndex(), indent);
    str += MoneroUtils.kvLine("Amount", this.getAmount() ? this.getAmount().toString() : undefined, indent);
    if (this.getDestinations()) {
      str += MoneroUtils.kvLine("Destinations", "", indent);
      for (let i = 0; i < this.getDestinations().length; i++) {
        str += MoneroUtils.kvLine(i + 1, "", indent + 1);
        str += this.getDestinations()[i].toString(indent + 2) + "\n";
      }
    }
    return str.slice(0, str.length - 1);  // strip last newline
  }
}

module.exports = MoneroTransfer;