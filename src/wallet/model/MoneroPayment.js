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
    throw new Error("Not implemented"); // TODO: can probably use MoneroUtils.safeSet()
//    if (tx == null) tx = payment.getTx();
//    else if (payment.getTx() != null) tx.merge(payment.getTx());
//    if (address == null) address = payment.getAddress();
//    else if (payment.getAddress() != null) assertEquals(address, payment.getAddress());
//    if (accountIndex == null) accountIndex = payment.getAccountIndex();
//    else if (payment.getAccountIndex() != null) assertEquals(accountIndex, payment.getAccountIndex());
//    if (subaddressIndex == null) subaddressIndex = payment.getSubaddressIndex();
//    else if (payment.getSubaddressIndex() != null) assertEquals(subaddressIndex, payment.getSubaddressIndex());
//    if (amount == null) amount = payment.getAmount();
//    else if (payment.getAmount() != null) assertTrue("Amounts", amount.compareTo(payment.getAmount()) == 0);
//    if (isSpent == null) isSpent = payment.getIsSpent();
//    else if (payment.getIsSpent() != null) assertEquals("Is spents", isSpent, payment.getIsSpent());
//    if (keyImage == null) keyImage = payment.getKeyImage();
//    else if (payment.getKeyImage() != null) assertEquals("Key images", keyImage, payment.getKeyImage());
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