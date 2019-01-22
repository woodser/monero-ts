const MoneroDaemonModel = require("../../daemon/model/MoneroDaemonModel");

/**
 * Models results from importing key images.
 */
class MoneroKeyImageImportResult extends MoneroDaemonModel {
  
  getHeight() {
    return this.height;
  }
  
  setHeight(height) {
    this.height = height;
  }
  
  getAmountSpent() {
    return this.amountSpent;
  }
  
  setAmountSpent(amountSpent) {
    this.amountSpent = amountSpent;
  }
  
  getAmountUnspent() {
    return this.amountUnspent;
  }
  
  setAmountUnspent(amountUnspent) {
    this.amountUnspent = amountUnspent;
  }
}

module.exports = MoneroKeyImageImportResult;