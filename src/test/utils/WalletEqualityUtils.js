/**
 * Utilities to deep compare wallets.
 */
class WalletEqualityUtils {
  
  /**
   * Compare the keys of two wallets.
   */
  static async testWalletEqualityKeys(w1, w2) {
    assert.equal(await w2.getMnemonic(), await w1.getMnemonic());
    assert.equal(await w2.getPrimaryAddress(), await w1.getPrimaryAddress());
    assert.equal(await w2.getPrivateViewKey(), await w1.getPrivateViewKey());
  }
}

module.exports = WalletEqualityUtils;
