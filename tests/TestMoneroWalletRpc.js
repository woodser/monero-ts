const assert = require("assert");
const GenUtils = require("../src/utils/GenUtils");
const TestUtils = require("./TestUtils");
const MoneroUtils = require("../src/utils/MoneroUtils");
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
        
        // initial state
        let entries = await wallet.getAddressBookEntries();
        let numEntriesStart = entries.length
        for (let entry of entries) testAddressBookEntry(entry);
        
        // test adding standard addresses
        const NUM_ENTRIES = 5;
        let address = (await wallet.getSubaddress(0, 0)).getAddress();
        let indices = [];
        for (let i = 0; i < NUM_ENTRIES; i++) {
          indices.push(await wallet.addAddressBookEntry(address, undefined, "hi there!"));
        }
        entries = await wallet.getAddressBookEntries();
        assert.equal(numEntriesStart + NUM_ENTRIES, entries.length);
        for (let idx of indices) {
          let found = false;
          for (let entry of entries) {
            if (idx === entry.getIndex()) {
              testAddressBookEntry(entry);
              assert.equal(address, entry.getAddress());
              assert.equal("hi there!", entry.getDescription());
              found = true;
              break;
            }
          }
          assert(found, "Index " + idx + " not found in address book indices");
        }
        
        // delete entries at starting index
        let deleteIdx = indices[0];
        for (let i = 0; i < indices.length; i++) {
          await wallet.deleteAddressBookEntry(deleteIdx);
        }
        entries = await wallet.getAddressBookEntries();
        assert.equal(numEntriesStart, entries.length);
        
        // test adding integrated addresses
        indices = [];
        let paymentId = "03284e41c342f03"; // payment id less one character
        let integratedAddresses = {};
        let integratedDescriptions = {};
        for (let i = 0; i < NUM_ENTRIES; i++) {
          let integratedAddress = await wallet.getIntegratedAddress(paymentId + i); // create unique integrated address
          let uuid = GenUtils.uuidv4();
          let idx = await wallet.addAddressBookEntry(integratedAddress.toString(), undefined, uuid);
          indices.push(idx);
          integratedAddresses[idx] = integratedAddress;
          integratedDescriptions[idx] = uuid;
        }
        entries = await wallet.getAddressBookEntries();
        assert.equal(numEntriesStart + NUM_ENTRIES, entries.length);
        for (let idx of indices) {
          let found = false;
          for (let entry of entries) {
            if (idx === entry.getIndex()) {
              testAddressBookEntry(entry);
              assert.equal(integratedDescriptions[idx], entry.getDescription());
              assert.equal(integratedAddresses[idx].getStandardAddress(), entry.getAddress());
              assert(MoneroUtils.paymentIdsEqual(integratedAddresses[idx].getPaymentId(), entry.getPaymentId()));
              found = true;
              break;
            }
          }
          assert(found, "Index " + idx + " not found in address book indices");
        }
        
        // delete entries at starting index
        deleteIdx = indices[0];
        for (let i = 0; i < indices.length; i++) {
          await wallet.deleteAddressBookEntry(deleteIdx);
        }
        entries = await wallet.getAddressBookEntries();
        assert.equal(numEntriesStart, entries.length);
      });
      
      // disabled so wallet is not actually stopped
//      it("Can be stopped", async function() {
//        await wallet.stopWallet();
//      });
    })
  }
}

module.exports = TestMoneroWalletRpc;

function testAddressBookEntry(entry) {
  assert(entry.getIndex() >= 0);
  assert(entry.getAddress());
  assert(entry.getDescription());
}