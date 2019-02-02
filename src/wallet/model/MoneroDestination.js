const BigInteger = require("../../submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const MoneroUtils = require("../../utils/MoneroUtils");

/**
 * Models an outgoing transfer destination.
 */
class MoneroDestination {
  
  constructor(stateOrAddress, amount) {
    
    // initialize without state
    if (stateOrAddress === undefined || typeof stateOrAddress === "string") {
      this.state = {};
      this.setAddress(stateOrAddress);
      this.setAmount(amount);
    }
    
    // initialize from state
    else {
      this.state = Object.assign({}, stateOrAddress);
      if (this.state.amount && !(this.state.amount instanceof BigInteger)) this.state.amount = BigInteger.parse(this.state.amount);
    }
  }
  
  getAddress() {
    return this.state.address;
  }

  setAddress(address) {
    this.state.address = address;
    return this;
  }
  
  getAmount() {
    return this.state.amount;
  }

  setAmount(amount) {
    this.state.amount = amount;
    return this;
  }

  copy() {
    return new MoneroDestination(this.toJson());
  }
  
  toJson() {
    let json = Object.assign({}, this.state);
    if (this.getAmount()) json.amount = this.getAmount().toString()
    return json;
  }
  
  toString(indent = 0) {
    let str = MoneroUtils.kvLine("Address", this.getAddress(), indent);
    str += MoneroUtils.kvLine("Amount", this.getAmount() ? this.getAmount().toString() : undefined, indent);
    return str.slice(0, str.length - 1);  // strip last newline
  }
}

module.exports = MoneroDestination;