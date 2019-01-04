const MoneroUtils = require("../../utils/MoneroUtils");

/**
 * Represents a transaction output.
 */
class MoneroOutput {
  
  constructor(json) {
    this.json = Object.assign({}, json);
  }
  
  getKeyImage() {
    return this.json.keyImage;
  }

  setKeyImage(keyImage) {
    this.json.keyImage = keyImage;
  }
  
  getAmount() {
    return this.json.amount;
  }

  setAmount(amount) {
    this.json.amount = amount;
  }
  
  getIndex() {
    return this.json.index;
  }
  
  setIndex(index) {
    this.json.index = index;
  }
  
  getIsSpent() {
    return this.json.isSpent;
  }

  setIsSpent(isSpent) {
    this.json.isSpent = isSpent;
  }
  
  merge(output) {
    this.setKeyImage(MoneroUtils.reconcile(this.getKeyImage(), output.getKeyImage()));
    this.setAmount(MoneroUtils.reconcile(this.getAmount(), output.getAmount()));
    this.setIndex(MoneroUtils.reconcile(this.getIndex(), output.getIndex()));
    this.setIsSpent(MoneroUtils.reconcile(this.getIsSpent(), output.getIsSpent(), {resolveTrue: true})); // output can become spent
  }
  
  toString(indent = 0) {
    let str = "";
    str += MoneroUtils.kvLine("Key image", this.getKeyImage(), indent);
    str += MoneroUtils.kvLine("Amount", this.getAmount(), indent);
    str += MoneroUtils.kvLine("Index", this.getIndex(), indent);
    str += MoneroUtils.kvLine("Is spent", this.getIsSpent(), indent);
    return str.slice(0, str.length - 1);  // strip last newline
  }
}

module.exports = MoneroOutput;