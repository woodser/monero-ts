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
  
  getSpentAmount() {
    return this.spentAmount;
  }
  
  setSpentAmount(spentAmount) {
    this.spentAmount = spentAmount;
    return this;
  }
  
  getUnspentAmount() {
    return this.unspentAmount;
  }
  
  setUnspentAmount(unspentAmount) {
    this.unspentAmount = unspentAmount;
    return this;
  }
}

module.exports = MoneroKeyImageImportResult;