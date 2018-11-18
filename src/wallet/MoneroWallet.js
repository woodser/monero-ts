/**
 * Monero wallet interface and default implementations.
 */
class MoneroWallet {
  
  getSeed() {
    throw new Error("Subclass must implement");
  }
  
  getMnemonic() {
    throw new Error("Subclass must implement");
  }
  
  getHeight() {
    throw new Error("Subclass must implement");
  }
  
  refresh() {
    throw new Error("Subclass must implement");
  }
}

module.exports = MoneroWallet;