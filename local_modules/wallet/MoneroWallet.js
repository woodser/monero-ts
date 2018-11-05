/**
 * Monero wallet interface.
 */
class MoneroWallet {
  
  getSeed() {
    throw new Error("Subclass must implement");
  }
  
  getHeight() {
    throw new Error("Subclass must implement");
  }
}

module.exports = MoneroWallet;