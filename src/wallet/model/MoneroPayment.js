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
   * @param json is existing JSON to construct the model from (optional)
   */
  constructor(jsonOrAddress, amount) {
    if (typeof jsonOrAddress === "string") {
      this.json = {};
      this.setAddress(jsonOrAddress);
      this.setAmount(amount);
    } else {
      this.json = Object.assign({}, jsonOrAddress);
    }
  }
  
  getAddress() {
    return this.json.address;
  }

  setAddress(address) {
    this.json.address = address;
  }

  getAccountIndex() {
    return this.json.accountIndex;
  }

  setAccountIndex(accountIndex) {
    this.json.accountIndex = accountIndex;
  }

  getSubaddressIndex() {
    return this.json.subaddressIndex;
  }

  setSubaddressIndex(subaddressIndex) {
    this.json.subaddressIndex = subaddressIndex;
  }

  getAmount() {
    return this.json.amount;
  }

  setAmount(amount) {
    this.json.amount = amount;
  }

  getIsSpent() {
    return this.json.isSpent;
  }

  setIsSpent(isSpent) {
    this.json.isSpent = isSpent;
  }

  getKeyImage() {
    return this.json.keyImage;
  }

  setKeyImage(keyImage) {
    this.json.keyImage = keyImage;
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
    this.setIsSpent(MoneroUtils.reconcile(this.getIsSpent(), payment.getIsSpent(), {resolveTrue: true})); // payment can become spent
    this.setKeyImage(MoneroUtils.reconcile(this.getKeyImage(), payment.getKeyImage()));
  }
  
  toString(indent = 0) {
    let str = "";
    str += MoneroUtils.kvLine("Address", this.getAddress(), indent);
    str += MoneroUtils.kvLine("Account index", this.getAccountIndex(), indent);
    str += MoneroUtils.kvLine("Subaddress index", this.getSubaddressIndex(), indent);
    str += MoneroUtils.kvLine("Amount", this.getAmount().toString(), indent);
    str += MoneroUtils.kvLine("Is spent", this.getIsSpent(), indent);
    str += MoneroUtils.kvLine("Key image", this.getKeyImage(), indent);
    return str.slice(0, str.length - 1);  // strip last newline
  }
}

module.exports = MoneroPayment;