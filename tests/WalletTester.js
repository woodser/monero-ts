const assert = require("assert");

/**
 * Tests a given wallet.
 */
class WalletTester {
  
  /**
   * Constructs the tester.
   * 
   * @param description is the test description
   * @param wallet is the wallet to test
   */
  constructor(description, wallet) {
    this.description = description;
    this.wallet = wallet;
  }
  
  async run() {
    let wallet = this.wallet;
    describe(this.description, function() {
      
      it("getMnemonic()", function() {
        assert(wallet.getMnemonic());
      });
      
      it("sync()", async function() {
        await wallet.sync();
      });
    });
  }
}

module.exports = WalletTester;