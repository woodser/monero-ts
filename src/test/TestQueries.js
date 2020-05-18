/**
 * Test queries in the developer guide.
 */
class TestQueries {
  
  runTests() {
    describe("Test Queries", function() {
      let that = this;
      let wallet = new MoneroWalletRpc("http://localhost:38083", "rpc_user", "abc123");
      
      // initialize wallet
      before(async function() {
        try {
          await TestUtils.getWalletRpc(); // open rpc test wallet
        } catch (e) {
          console.log(e);
        }
      });
      
      it("Test transaction queries", async function() {
        
        // get unconfirmed transactions
        let txs = await wallet.getTxs({
          isConfirmed: false
        });
        for (let tx of txs) {
          assert(!tx.isConfirmed());
        }
        
        // get confirmed transactions since height 582106 with
        // incoming transfers to account 0, subaddress 1
        txs = await wallet.getTxs({
          isConfirmed: true,
          minHeight: 582106,
          transferQuery: {
            isIncoming: true,
            accountIndex: 0,
            subaddressIndex: 1
          }
        });
        for (let tx of txs) {
          assert(tx.isConfirmed());
          assert(tx.getHeight() >= 582106)
          let found = false;
          for (let transfer of tx.getTransfers()) {
            if (transfer.isIncoming() && transfer.getAccountIndex() === 0 && transfer.getSubaddressIndex() === 1) {
              found = true;
              break;
            }
          }
          assert(found);
        }
        
        // get transactions with available outputs
        txs = await wallet.getTxs({
          isLocked: false,
          outputQuery: {
            isSpent: false,
          }
        });
        for (let tx of txs) {
          assert(!tx.isLocked());
          assert(tx.getOutputs().length > 0);
          let found = false;
          for (let output of tx.getOutputs()) {
            if (!output.isSpent()) {
              found = true;
              break;
            }
          }
          if (!found) {
            console.log(tx.getOutputs());
          }
          assert(found);
        }
      });
    });
  }
}

module.exports = TestQueries;