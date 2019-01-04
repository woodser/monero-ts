/**
 * Represents a transaction output.
 */
class MoneroOutput {
  
  constructor(json) {
    this.json = Object.assign({}, json);
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

  getKeyImage() {
    return this.json.keyImage;
  }

  setKeyImage(keyImage) {
    this.json.keyImage = keyImage;
  }
  
  merge(output) {
    this.setIsSpent(MoneroUtils.reconcile(this.getIsSpent(), output.getIsSpent(), {resolveTrue: true})); // output can become spent
    this.setKeyImage(MoneroUtils.reconcile(this.getKeyImage(), output.getKeyImage()));
  }
  
  toString(indent = 0) {
    let str = "";
    str += MoneroUtils.kvLine("Index", this.getIndex(), indent);
    str += MoneroUtils.kvLine("Is spent", this.getIsSpent(), indent);
    str += MoneroUtils.kvLine("Key image", this.getKeyImage(), indent, false);
    return str;
  }
}

module.exports = MoneroOutput;