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
  
  getSpent() {
    return this.spent;
  }
  
  setSpent(spent) {
    this.spent = spent;
  }
  
  getUnspent() {
    return this.unspent;
  }
  
  setUnspent(unspent) {
    this.unspent = unspent;
  }
}

module.exports = MoneroImportKeyImagesResult;