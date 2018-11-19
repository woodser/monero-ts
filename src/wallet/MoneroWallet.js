/**
 * Monero wallet interface and default implementations.
 */
class MoneroWallet {
  
  async getSeed() {
    throw new Error("Subclass must implement");
  }
  
  async getMnemonic() {
    throw new Error("Subclass must implement");
  }
  
  async getHeight() {
    throw new Error("Subclass must implement");
  }
  
  refresh(onProgress) {
    throw new Error("Subclass must implement");
  }
}

module.exports = MoneroWallet;