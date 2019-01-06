const MoneroUtils = require("../../utils/MoneroUtils");
const BigInteger = require("../../submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;

/**
 * Represents a transaction output.
 * 
 * TODO: this goes in daemon model when modeling daemon outputs
 */
class MoneroOutput {
  
  constructor(json) {
    this.state = Object.assign({}, json);
    if (json && json.amount) this.setAmount(BigInteger.parse(json.amount));
  }
  
  getKeyImage() {
    return this.state.keyImage;
  }

  setKeyImage(keyImage) {
    this.state.keyImage = keyImage;
  }
  
  getAmount() {
    return this.state.amount;
  }

  setAmount(amount) {
    this.state.amount = amount;
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
  
  // TODO: rename to getGlobalIndex()
  getIndex() {
    return this.state.index;
  }
  
  setIndex(index) {
    this.state.index = index;
  }
  
  getIsSpent() {
    return this.state.isSpent;
  }

  setIsSpent(isSpent) {
    this.state.isSpent = isSpent;
  }
  
  copy() {
    return new MoneroOutput(this.toJson());
  }
  
  toJson() {
    let json = Object.assign({}, this.state);
    if (this.getAmount()) json.amount = this.getAmount().toString();
    return json;
  }
  
  merge(output) {
    this.setKeyImage(MoneroUtils.reconcile(this.getKeyImage(), output.getKeyImage()));
    this.setAmount(MoneroUtils.reconcile(this.getAmount(), output.getAmount()));
    this.setAccountIndex(MoneroUtils.reconcile(this.getAccountIndex(), output.getAccountIndex()));
    this.setSubaddressIndex(MoneroUtils.reconcile(this.getSubaddressIndex(), output.getSubaddressIndex()));
    this.setIndex(MoneroUtils.reconcile(this.getIndex(), output.getIndex()));
    this.setIsSpent(MoneroUtils.reconcile(this.getIsSpent(), output.getIsSpent(), {resolveTrue: true})); // output can become spent
  }
  
  toString(indent = 0) {
    let str = "";
    str += MoneroUtils.kvLine("Key image", this.getKeyImage(), indent);
    str += MoneroUtils.kvLine("Amount", this.getAmount(), indent);
    str += MoneroUtils.kvLine("Account index", this.getAccountIndex(), indent);
    str += MoneroUtils.kvLine("Subaddress index", this.getSubaddressIndex(), indent);
    str += MoneroUtils.kvLine("Index", this.getIndex(), indent);
    str += MoneroUtils.kvLine("Is spent", this.getIsSpent(), indent);
    return str.slice(0, str.length - 1);  // strip last newline
  }
}

module.exports = MoneroOutput;