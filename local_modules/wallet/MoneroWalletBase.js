/**
 * Monero wallet interface and default implementations.
 */
class MoneroWalletBase {
  
  getSeed() {
    throw new Error("Subclass must implement");
  }
  
  getHeight() {
    throw new Error("Subclass must implement");
  }
}

module.exports = MoneroWalletBase;