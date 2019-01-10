const BigInteger = require("../../submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const MoneroUtils = require("../../utils/MoneroUtils");

/**
 * Models an outgoing transfer destination.
 */
class MoneroDestination {
  
  constructor(jsonOrAddress, amount) {
    
    // initialize without json
    if (jsonOrAddress === undefined || typeof jsonOrAddress === "string") {
      this.state = {};
      this.setAddress(jsonOrAddress);
      this.setAmount(amount);
    }
    
    // otherwise deserialize json
    else {
      let json = jsonOrAddress;
      this.state = Object.assign({}, json);
      if (json.amount) this.setAmount(BigInteger.parse(json.amount));
    }
  }
  
  getAddress() {
    return this.state.address;
  }

  setAddress(address) {
    this.state.address = address;
  }
  
  getAmount() {
    return this.state.amount;
  }

  setAmount(amount) {
    this.state.amount = amount;
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