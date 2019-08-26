const assert = require("assert");
const GenUtils = require("../src/utils/GenUtils");
const TestUtils = require("./TestUtils");
const MoneroUtils = require("../src/utils/MoneroUtils");
const MoneroRpcError = require("../src/rpc/MoneroRpcError");
const MoneroAccountTag = require("../src/wallet/model/MoneroAccountTag");
const TestMoneroWalletCommon = require("./TestMoneroWalletCommon");
const MoneroIncomingTransfer = require("../src/wallet/model/MoneroIncomingTransfer");
const MoneroOutgoingTransfer = require("../src/wallet/model/MoneroOutgoingTransfer");
const MoneroTxRequest = require("../src/wallet/model/MoneroTxRequest");
const MoneroTransferRequest = require("../src/wallet/model/MoneroTransferRequest");
const MoneroOutputRequest = require("../src/wallet/model/MoneroOutputRequest");

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
        assert.equal(await wallet.isMultisigImportNeeded(), false); // TODO: test with multisig wallet
      });
      
      it("Can create and open a wallet", async function() {
        
        // create test wallet 2 which throws rpc code -21 if it already exists
        try {
          await wallet.createWallet(TestUtils.WALLET_RPC_NAME_2, TestUtils.WALLET_RPC_PW_2, "English");
        } catch (e) {
          assert(e instanceof MoneroRpcError); 
          assert.equal(e.getCode(), -21);
        }
        try {
          
          // open test wallet 2
          await wallet.openWallet(TestUtils.WALLET_RPC_NAME_2, TestUtils.WALLET_RPC_PW_2);
          
          // test fetching transactions
          let txs = await wallet.getTxs();
          assert(txs.length >= 0);
          
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
            assert.equal(e.getCode(), -1); // ok if wallet is already open
          }
        }
      });

      it("Can tag accounts and query accounts by tag", async function() {
        
        // get accounts
        let accounts = await wallet.getAccounts();
        assert(accounts.length >= 3, "Not enough accounts to test; run create account test");
        
        // tag some of the accounts
        let tag = new MoneroAccountTag("my_tag_" + GenUtils.uuidv4(), "my tag label", [0, 1]);
        await wallet.tagAccounts(tag.getTag(), tag.getAccountIndices());
        
        // query accounts by tag
        let taggedAccounts = await wallet.getAccounts(undefined, tag.getTag());
        assert.equal(taggedAccounts.length, 2);
        assert.equal(taggedAccounts[0].getIndex(), 0);
        assert.equal(taggedAccounts[0].getTag(), tag.getTag());
        assert.equal(taggedAccounts[1].getIndex(), 1);
        assert.equal(taggedAccounts[1].getTag(), tag.getTag());

        // set tag label
        await wallet.setAccountTagLabel(tag.getTag(), tag.getLabel());
        
        // fetch tags and ensure new tag is contained
        let tags = await wallet.getAccountTags();
        assert(GenUtils.arrayContains(tags, tag));
        
        // re-tag an account
        let tag2 = new MoneroAccountTag("my_tag_" + GenUtils.uuidv4(), "my tag label 2", [1]);
        await wallet.tagAccounts(tag2.getTag(), tag2.getAccountIndices());
        let taggedAccounts2 = await wallet.getAccounts(undefined, tag2.getTag())
        assert.equal(taggedAccounts2.length, 1);
        assert.equal(taggedAccounts2[0].getIndex(), 1);
        assert.equal(taggedAccounts2[0].getTag(), tag2.getTag());
        
        // re-query original tag which only applies to one account now
        taggedAccounts = await wallet.getAccounts(undefined, tag.getTag());
        assert.equal(taggedAccounts.length, 1);
        assert.equal(taggedAccounts[0].getIndex(), 0);
        assert.equal(taggedAccounts[0].getTag(), tag.getTag());
        
        // untag and query accounts
        await wallet.untagAccounts([0, 1]);
        assert.equal((await wallet.getAccountTags()).length, 0);
        try {
          await wallet.getAccounts(undefined, tag.getTag());
          fail("Should have thrown exception with unregistered tag");
        } catch (e) {
          assert.equal(e.getCode(), -1);
        }
        
        // test that non-existing tag returns no accounts
        try {
          await wallet.getAccounts(undefined, "non_existing_tag");
          fail("Should have thrown exception with unregistered tag");
        } catch (e) {
          assert.equal(e.getCode(), -1);
        }
      });
      
      it("Can fetch accounts and subaddresses without balance info because this is another RPC call", async function() {
        let accounts = await wallet.getAccounts(true, undefined, true);
        assert(accounts.length > 0);
        for (let account of accounts) {
          assert(account.getSubaddresses().length > 0);
          for (let subaddress of account.getSubaddresses()) {
            assert.equal(typeof subaddress.getAddress(), "string");
            assert(subaddress.getAddress().length > 0);
            assert(subaddress.getAccountIndex() >= 0);
            assert(subaddress.getIndex() >= 0);
            assert(subaddress.getLabel() === undefined || typeof subaddress.getLabel() === "string");
            if (typeof subaddress.getLabel() === "string") assert(subaddress.getLabel().length > 0);
            assert.equal(typeof subaddress.getIsUsed(), "boolean");
            assert.equal(subaddress.getNumUnspentOutputs(), undefined);
            assert.equal(subaddress.getBalance(), undefined);
            assert.equal(subaddress.getUnlockedBalance(), undefined);
          }
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
          indices.push(await wallet.addAddressBookEntry(address, "hi there!"));
        }
        entries = await wallet.getAddressBookEntries();
        assert.equal(entries.length, numEntriesStart + NUM_ENTRIES);
        for (let idx of indices) {
          let found = false;
          for (let entry of entries) {
            if (idx === entry.getIndex()) {
              testAddressBookEntry(entry);
              assert.equal(entry.getAddress(), address);
              assert.equal(entry.getDescription(), "hi there!");
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
        assert.equal(entries.length, numEntriesStart);
        
        // test adding integrated addresses
        indices = [];
        let paymentId = "03284e41c342f03"; // payment id less one character
        let integratedAddresses = {};
        let integratedDescriptions = {};
        for (let i = 0; i < NUM_ENTRIES; i++) {
          let integratedAddress = await wallet.getIntegratedAddress(paymentId + i); // create unique integrated address
          let uuid = GenUtils.uuidv4();
          let idx = await wallet.addAddressBookEntry(integratedAddress.toString(), uuid);
          indices.push(idx);
          integratedAddresses[idx] = integratedAddress;
          integratedDescriptions[idx] = uuid;
        }
        entries = await wallet.getAddressBookEntries();
        assert.equal(entries.length, numEntriesStart + NUM_ENTRIES);
        for (let idx of indices) {
          let found = false;
          for (let entry of entries) {
            if (idx === entry.getIndex()) {
              testAddressBookEntry(entry);
              assert.equal(entry.getDescription(), integratedDescriptions[idx]);
              assert.equal(entry.getAddress(), integratedAddresses[idx].getStandardAddress());
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
        assert.equal(entries.length, numEntriesStart);
      });
      
      it("Can rescan spent", async function() {
        await wallet.rescanSpent();
      });
      
      it("Can save the wallet file", async function() {
        await wallet.save();
      });
      
//      // disabled so wallet is not actually closed
//      it("Can close the currently open wallet", async function() {
//        await wallet.close();
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