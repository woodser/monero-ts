const MoneroDaemonModel = require("./MoneroDaemonModel");

/**
 * Represents a Monero key image.
 */
class MoneroKeyImage extends MoneroDaemonModel {
  
  constructor(json) {
    super();
    this.json = Object.assign({}, json);
  }

  getKeyImage() {
    return this.json.keyImage;
  }

  setKeyImage(keyImage) { // TODO: replace with setId(), getId()?
    this.json.keyImage = keyImage;
  }

  getSignature() {
    return this.json.signature;
  }

  setSignature(signature) {
    this.json.signature = signature;
  }

  getSpentStatus() {
    return this.json.spentStatus;
  }

  setSpentStatus(spentStatus) {
    this.json.spentStatus = spentStatus;
  }
  
  getSpendingTxIds() {
    return this.json.spendingTxIds;
  }
  
  setSpendingTxIds(spendingTxIds) {
    this.json.spendingTxIds = spendingTxIds;
  }
  
  toJson() {
    return this.json;
  }
}

module.exports = MoneroKeyImage;