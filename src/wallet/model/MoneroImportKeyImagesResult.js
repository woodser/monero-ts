/**
 * Stores the result from importing key images into a wallet.
 */
class MoneroImportKeyImagesResult {
  
  getHeight() {
    return this.height;
  }
  
  setHeight(height) {
    this.height = height;
  }
  
  getSpentAmount() {
    return this.spentAmount;
  }
  
  setSpentAmount(spentAmount) {
    this.spentAmount = spentAmount;
  }
  
  getUnspentAmount() {
    return this.unspentAmount;
  }
  
  setUnspentAmount(unspentAmount) {
    this.unspentAmount = unspentAmount;
  }
}

module.exports = MoneroImportKeyImagesResult;