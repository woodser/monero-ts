const assert = require("assert");
const GenUtils = require("../src/utils/GenUtils");
const TestUtils = require("./TestUtils");
const MoneroRpcError = require("../src/rpc/MoneroRpcError");
const MoneroAccountTag = require("../src/wallet/model/MoneroAccountTag");
const TestMoneroWalletCommon = require("./TestMoneroWalletCommon");

/**
 * Tests the Monero Wallet RPC client and server.
 */
class TestMoneroWalletRpc extends TestMoneroWalletCommon {
  
  constructor() {
    super(TestUtils.getWalletRpc(), TestUtils.getDaemonRpc());
  }
  
  runTests(config) {
    let that = this;
    describe("TEST MONERO WALLET RPC", function() {
      
      // initialize wallet
      before(async function() {
        await TestUtils.initWalletRpc();
      });
      
      // run tests specific to wallet rpc
      that._testWalletRpc(config);
      
      // run common tests
      that.runCommonTests(config);
    });
  }
  
  _testWalletRpc(config) {
    let wallet = this.wallet;
    let daemon = this.daemon;
    
    describe("Tests specific to RPC wallet", function() {
      
      it("Can indicate if multisig import is needed for correct balance information", async function() {
        assert.equal(false, await wallet.isMultisigImportNeeded()); // TODO: test with multisig wallet
      });
      
      it("Can create and open a wallet", async function() {
        
        // create test wallet 2 which throws rpc code -21 if it already exists
        try {
          await wallet.createWallet(TestUtils.WALLET_RPC_NAME_2, TestUtils.WALLET_RPC_PW_2, "English");
        } catch (e) {
          assert(e instanceof MoneroRpcError); 
          assert.equal(-21, e.getRpcCode());
        }
        try {
          
          // open test wallet 2
          await wallet.openWallet(TestUtils.WALLET_RPC_NAME_2, TestUtils.WALLET_RPC_PW_2);
          
          // assert wallet 2 is empty
          let txs = await wallet.getTxs();
          assert(txs.length === 0);
          
          // open test wallet 1
          await wallet.openWallet(TestUtils.WALLET_RPC_NAME_1, TestUtils.WALLET_RPC_PW_1);
          txs = await wallet.getTxs();
          assert(txs.length !== 0);  // wallet is used
        } catch(e) {
          throw e;
        } finally {
          
          // open test wallet 1 no matter what for other tests
          try {
            await wallet.openWallet(TestUtils.WALLET_RPC_NAME_1, TestUtils.WALLET_RPC_PW_1);
          } catch (e) {
            assert(e instanceof MoneroRpcError);
            assert.equal(-1, e.getRpcCode()); // ok if wallet is already open
          }
        }
      });

      it("Can rescan spent", async function() {
        await wallet.rescanSpent();
      });
      
      it("Can save the blockchain", async function() {
        await wallet.saveBlockchain();
      });
      
      it("Can tag accounts and query accounts by tag", async function() {
        
        // test that non-existing tag returns no accounts
        try {
          await wallet.getAccounts(undefined, "non_existing_tag");
          fail("Should have thrown exception with unregistered tag");
        } catch (e) {
          assert.equal(-1, e.getRpcCode());
        }
        
        // create expected tag for test
        let expectedTag = new MoneroAccountTag("my_tag_" + GenUtils.uuidv4(), "my tag label", [0, 1]);
        
        // tag and query accounts
        let accounts1 = await wallet.getAccounts();
        assert(accounts1.length >= 3);
        await wallet.tagAccounts(expectedTag.getTag(), [0, 1]);
        let accounts2 = await wallet.getAccounts(undefined, expectedTag.getTag());
        assert.equal(2, accounts2.length);
        assert.deepEqual(accounts1[0], accounts2[0]);
        assert.deepEqual(accounts1[1], accounts2[1]);
        
        // set tag label
        await wallet.setAccountTagLabel(expectedTag.getTag(), expectedTag.getLabel());
        
        // retrieve and find new tag
        let tags = await wallet.getAccountTags();
        GenUtils.arrayContains(tags, expectedTag);
        
        // untag and query accounts
        await wallet.untagAccounts([0, 1]);
        assert.equal(false, (await wallet.getAccountTags()).includes(expectedTag));
        try {
          await wallet.getAccounts(undefined, expectedTag.getTag());
          fail("Should have thrown exception with unregistered tag");
        } catch (e) {
          assert.equal(-1, e.getRpcCode());
        }
      });
      
      it("Has an address book", async function() {
        throw new Error("Not implemented");
      });
      
      // disabled so wallet is not actually stopped
//      it("Can be stopped", async function() {
//        await wallet.stopWallet();
//      });
    })
  }
}

module.exports = TestMoneroWalletRpc;