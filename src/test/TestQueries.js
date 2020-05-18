/**
 * Test queries in the developer guide.
 */
class TestQueries {
  
  runTests() {
    describe("Test Queries", function() {
      let that = this;
      let wallet;
      
      // initialize wallet
      before(async function() {
        try {
          wallet = await TestUtils.getWalletWasm();
        } catch (e) {
          console.log(e);
        }
      });
      
      // save wallet
      after(async function() {
        await wallet.save();
      });
      
      it("Test transaction queries", async function() {
        
        // get a transaction by hash
        let tx = await wallet.getTx("0b30d7b7510a1aed88c87464dffdcfe9d24feffc8798e30e887e3c9c3558a814");
        
        // get unconfirmed transactions
        let txs = await wallet.getTxs({
          isConfirmed: false
        });
        for (let tx of txs) {
          assert(!tx.isConfirmed());
        }
        
        // get transactions since height 582106 with incoming transfers to
        // account 0, subaddress 0
        txs = await wallet.getTxs({
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
      
      it("Test transfer queries", async function() {
        
        // get all transfers
        let transfers = await wallet.getTransfers();
        
        // get incoming transfers to account 0, subaddress 1
        transfers = await wallet.getTransfers({
          isIncoming: true,
          accountIndex: 0,
          subaddressIndex: 1
        });
        for (let transfer of transfers) {
          assert.equal(transfer.isIncoming(), true);
          assert.equal(transfer.getAccountIndex(), 0);
          assert.equal(transfer.getSubaddressIndex(), 1);
        }
        
        // get transfers in the tx pool
        transfers = await wallet.getTransfers({
          txQuery: {
            isConfirmed: false
          }
        });
        for (let transfer of transfers) {
          assert.equal(transfer.getTx().inTxPool(), true);
        }
        
        // get confirmed outgoing transfers since a block height
        transfers = await wallet.getTransfers({
          isOutgoing: true,
          txQuery: {
            isConfirmed: true,
            minHeight: 582106,
          }
        });
        assert(transfers.length > 0);
        for (let transfer of transfers) {
          assert(transfer.isOutgoing());
          assert(transfer.getTx().isConfirmed());
          assert(transfer.getTx().getHeight() >= 582106);
        }
      });
      
      it("Test output queries", async function() {
        
        // get all outputs
        let outputs = await wallet.getOutputs();
        assert(outputs.length > 0);
        
        // get outputs available to be spent
        outputs = await wallet.getOutputs({
          isSpent: false,
          txQuery: {
            isLocked: false
          }
        });
        assert(outputs.length > 0);
        for (let output of outputs) {
          assert(!output.isSpent());
          assert(!output.getTx().isLocked());
        }
        
        // get outputs received to a specific subaddress
        outputs = await wallet.getOutputs({
          accountIndex: 0,
          subaddressIndex: 1
        });
        assert(outputs.length > 0);
        for (let output of outputs) {
          assert.equal(output.getAccountIndex(), 0);
          assert.equal(output.getSubaddressIndex(), 1);
        }
        
        // get output by key image
        let keyImage = outputs[0].getKeyImage().getHex();
        outputs = await wallet.getOutputs({
          keyImage: keyImage
        });
        assert.equal(outputs.length, 1);
        assert.equal(outputs[0].getKeyImage().getHex(), keyImage);
      });
    });
  }
}

module.exports = TestQueries;