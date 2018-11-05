/**
 * Monero wallet interface.
 */
class MoneroWallet {
  
  constructor() {
    throw new Error("Subclass must implement");
  }
  
  getHeight() {
    throw new Error("Subclass must implement");
  }
}