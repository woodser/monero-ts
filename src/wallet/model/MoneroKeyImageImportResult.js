/**
 * Models results from importing key images.
 */
class MoneroKeyImageImportResult {
  
  getHeight() {
    return this.height;
  }
  
  setHeight(height) {
    this.height = height;
    return this;
  }
  
  getAmountSpent() {
    return this.amountSpent;
  }
  
  setAmountSpent(amountSpent) {
    this.amountSpent = amountSpent;
    return this;
  }
  
  getAmountUnspent() {
    return this.amountUnspent;
  }
  
  setAmountUnspent(amountUnspent) {
    this.amountUnspent = amountUnspent;
    return this;
  }
}

module.exports = MoneroKeyImageImportResult;