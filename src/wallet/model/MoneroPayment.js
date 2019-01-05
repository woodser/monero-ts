const assert = require("assert");
const BigInteger = require("../../submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const MoneroUtils = require("../../utils/MoneroUtils");
const MoneroOutput = require("./MoneroOutput");

/**
 * Represents a payment on the Monero network to an address.
 * 
 * A transaction may have one or more payments.
 */
class MoneroPayment {
  
  /**
   * Constructs the model.
   * 
   * @param jsonOrAddress is JSON to construct the model or an address (optional)
   */
  constructor(jsonOrAddress, amount) {
    if (jsonOrAddress === undefined || typeof jsonOrAddress === "string") {
      this.state = {};
      this.setAddress(jsonOrAddress);
      this.setAmount(amount);
    } else {
      
      // deserialize json
      let json = jsonOrAddress;
      this.state = Object.assign({}, json);
      if (json.amount) this.setAmount(BigInteger.parse(json.amount));
      if (json.outputs) {
        let outputs = [];
        for (let jsonOutput of json.outputs) outputs.push(new MoneroOutput(jsonOutput));
        this.setOutputs(outputs);
      }
    }
  }
  
  getAddress() {
    return this.state.address;
  }

  setAddress(address) {
    this.state.address = address;
  }

  getAccountIndex() {
    return this.state.accountIndex;
  }

  setAccountIndex(accountIndex) {
    this.state.accountIndex = accountIndex;
  }

  getSubaddressIndex() {
    return this.state.subaddressIndex;
  }

  setSubaddressIndex(subaddressIndex) {
    this.state.subaddressIndex = subaddressIndex;
  }

  getAmount() {
    return this.state.amount;
  }

  setAmount(amount) {
    this.state.amount = amount;
  }
  
  getOutputs() {
    return this.state.outputs;
  }
  
  setOutputs(outputs) {
    if (outputs) {
      assert(Array.isArray(outputs));
      for (let output of outputs) {
        assert(output instanceof MoneroOutput);
      }
    }
    
    this.state.outputs = outputs;
  }
  
  copy() {
    return new MoneroPayment(this.toJson());
  }
  
  toJson() {
    let json = Object.assign({}, this.state);
    if (this.getAmount()) json.amount = this.getAmount().toString()
    if (this.getOutputs()) {
      json.outputs = [];
      for (let output of this.getOutputs()) json.outputs.push(output.toJson());
    }
    return json;
  }

  /**
   * Merges the given payment into this payment.
   * 
   * Sets uninitialized fields to the given payent. Validates initialized fields are equal.
   * 
   * @param payment is the payment to merge into this one
   */
  merge(payment) {
    this.setAddress(MoneroUtils.reconcile(this.getAddress(), payment.getAddress()));
    this.setAccountIndex(MoneroUtils.reconcile(this.getAccountIndex(), payment.getAccountIndex()));
    this.setSubaddressIndex(MoneroUtils.reconcile(this.getSubaddressIndex(), payment.getSubaddressIndex()));
    this.setAmount(MoneroUtils.reconcile(this.getAmount(), payment.getAmount()));
    
    // merge outputs
    if (this.getOutputs() === undefined) this.setOutputs(payment.getOutputs());
    else if (payment.getOutputs()) {
      for (let merger of payment.getOutputs()) {
        let merged = false;
        for (let mergee of this.getOutputs()) {
          if (mergee.getKeyImage() === merger.getKeyImage()) {
            mergee.merge(merger);
            merged = true;
            break;
          }
        }
        if (!merged) this.getOutputs().push(merger);
      }
    }
  }
  
  toString(indent = 0) {
    let str = "";
    str += MoneroUtils.kvLine("Address", this.getAddress(), indent);
    str += MoneroUtils.kvLine("Account index", this.getAccountIndex(), indent);
    str += MoneroUtils.kvLine("Subaddress index", this.getSubaddressIndex(), indent);
    str += MoneroUtils.kvLine("Amount", this.getAmount() ? this.getAmount().toString() : undefined, indent);
    if (this.getOutputs()) {
      str += MoneroUtils.kvLine("Outputs", "", indent);
      for (let i = 0; i < this.getOutputs().length; i++) {
        str += MoneroUtils.kvLine(i + 1, "", indent + 1);
        str += this.getOutputs()[i].toString(indent + 2);
        str += '\n'
      }
    } else {
      str += MoneroUtils.kvLine("Outputs", this.getOutputs(), indent);
    }
    return str.slice(0, str.length - 1);  // strip last newline
  }
}

module.exports = MoneroPayment;