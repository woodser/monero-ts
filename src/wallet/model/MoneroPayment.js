const assert = require("assert");
const BigInteger = require("../../submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const MoneroUtils = require("../../utils/MoneroUtils");

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
  
  copy() {
    return new MoneroPayment(this.toJson());
  }
  
  toJson() {
    let json = Object.assign({}, this.state);
    if (this.getAmount()) json.amount = this.getAmount().toString()
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
    assert(payment instanceof MoneroPayment);
    this.setAddress(MoneroUtils.reconcile(this.getAddress(), payment.getAddress()));
    this.setAccountIndex(MoneroUtils.reconcile(this.getAccountIndex(), payment.getAccountIndex()));
    this.setSubaddressIndex(MoneroUtils.reconcile(this.getSubaddressIndex(), payment.getSubaddressIndex()));
    this.setAmount(MoneroUtils.reconcile(this.getAmount(), payment.getAmount()));
  }
  
  toString(indent = 0) {
    let str = "";
    str += MoneroUtils.kvLine("Address", this.getAddress(), indent);
    str += MoneroUtils.kvLine("Account index", this.getAccountIndex(), indent);
    str += MoneroUtils.kvLine("Subaddress index", this.getSubaddressIndex(), indent);
    str += MoneroUtils.kvLine("Amount", this.getAmount() ? this.getAmount().toString() : undefined, indent);
    return str.slice(0, str.length - 1);  // strip last newline
  }
}

module.exports = MoneroPayment;