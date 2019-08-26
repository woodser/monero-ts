const assert = require("assert");
const GenUtils = require("../main/utils/GenUtils");
const TestUtils = require("./utils/TestUtils");
const MoneroUtils = require("../main/utils/MoneroUtils");
const MoneroRpcError = require("../main/rpc/MoneroRpcError");
const MoneroAccountTag = require("../main/wallet/model/MoneroAccountTag");
const TestMoneroWalletCommon = require("./TestMoneroWalletCommon");
const MoneroIncomingTransfer = require("../main/wallet/model/MoneroIncomingTransfer");
const MoneroOutgoingTransfer = require("../main/wallet/model/MoneroOutgoingTransfer");
const MoneroTxQuery = require("../main/wallet/model/MoneroTxQuery");
const MoneroTransferQuery = require("../main/wallet/model/MoneroTransferQuery");
const MoneroOutputQuery = require("../main/wallet/model/MoneroOutputQuery");

/**
 * Tests the Monero Wallet RPC client and server.
 */
class TestMoneroWalletRpc extends TestMoneroWalletCommon {
  
  constructor() {
    super(TestUtils.getWalletRpc(), TestUtils.getDaemonRpc());
  }
  
  getTestWallet() {
    return TestUtils.getWalletRpc();
  }
  
  async createRandomWallet() {
    await this.wallet.createWalletRandom(GenUtils.uuidv4(), TestUtils.PASSWORD);
    return wallet;
  }
  
  async openWallet(path) {
    await this.wallet.openWallet(path, TestUtils.PASSWORD);
    return wallet;
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
  
  // ---------------------------------- PRIVATE -------------------------------
  
  // rpc-specific tx test
  async _testTxWallet(tx, ctx) {
    ctx = Object.assign({}, ctx);
    
    // run common tests
    super._testTxWallet(tx, ctx);
    
    // test tx results from send or relay
    if (ctx.isSendResponse === true) {
      if (ctx.sendRequest.getCanSplit() === true) assert.equal(tx.getKey(), undefined);  // TODO monero-wallet-rpc: tx key is not returned from transfer_split
    }
  }
  
  _testWalletRpc(config) {
    let wallet = this.wallet;
    let daemon = this.daemon;
    let that = this;
    
    describe("Tests specific to RPC wallet", function() {
      
      // ---------------------------- BEGIN TESTS ---------------------------------
      
      it("Can create a wallet with a randomly generated seed", async function() {
        let err;
        try {
          
          // create random wallet with defaults
          let path = GenUtils.uuidv4();
          await that.wallet.createWalletRandom(path, TestUtils.WALLET_PASSWORD);
          let mnemonic = await that.wallet.getMnemonic();
          MoneroUtils.validateMnemonic(mnemonic);
          assert.notEqual(mnemonic, TestUtils.MNEMONIC);
          MoneroUtils.validateAddress(await that.wallet.getPrimaryAddress());
          assert.equal(await that.wallet.getHeight(), 1); // TODO monero core: why does height of new unsynced wallet start at 1?
          await that.wallet.sync();  // very quick because restore height is chain height
          await that.wallet.close();

          // create random wallet with non defaults
          path = GenUtils.uuidv4();
          await that.wallet.createWalletRandom(path, TestUtils.WALLET_PASSWORD, "Spanish");
          MoneroUtils.validateMnemonic(await that.wallet.getMnemonic());
          assert.notEqual(await that.wallet.getMnemonic(), mnemonic);
          MoneroUtils.validateAddress(await that.wallet.getPrimaryAddress());
          assert.equal(await that.wallet.getHeight(), 1); // TODO monero core: why is height of unsynced wallet 1?
          await that.wallet.close();
          
          // attempt to create wallet which already exists
          try {
            await that.wallet.createWalletRandom(path, TestUtils.WALLET_PASSWORD, "Spanish");
          } catch (e) {
            assert.equal(e.getCode(), -21);
          }
        } catch (e) {
          err = e;
        }
          
        // open main test wallet for other tests
        await that.wallet.openWallet(TestUtils.WALLET_RPC_NAME_1, TestUtils.WALLET_PASSWORD);
        
        // throw error if there was one
        if (err) throw err;
      });
      
      it("Can create a wallet from a mnemonic phrase", async function() {
        let err;
        try {
          
          // create wallet with mnemonic and defaults
          let path = GenUtils.uuidv4();
          await that.wallet.createWalletFromMnemonic(path, TestUtils.WALLET_PASSWORD, TestUtils.MNEMONIC, TestUtils.FIRST_RECEIVE_HEIGHT);
          assert.equal(await that.wallet.getMnemonic(), TestUtils.MNEMONIC);
          assert.equal(await that.wallet.getPrimaryAddress(), TestUtils.ADDRESS);
          assert.equal(await that.wallet.getHeight(), 1);      // TODO monero-core: sometimes wallet is synced after fresh creation here, but not if run alone
          assert.equal(await that.wallet.getTxs().size(), 0);  // wallet is not synced
          await that.wallet.sync();
          assert.equal(await that.wallet.getHeight(), daemon.getHeight());
          let txs = await that.wallet.getTxs();
          assert(txs.length > 0); // wallet is used
          assert.equal(txs[0].getHeight(), TestUtils.FIRST_RECEIVE_HEIGHT);
          await that.wallet.close();
          
          // create wallet with non-defaults
          path = GenUtils.uuidv4();
          await that.wallet.createWalletFromMnemonic(path, TestUtils.WALLET_PASSWORD, TestUtils.MNEMONIC, TestUtils.FIRST_RECEIVE_HEIGHT, "German", "my offset!", false);
          MoneroUtils.validateMnemonic(await that.wallet.getMnemonic());
          assert.notEqual(await that.wallet.getMnemonic(), TestUtils.MNEMONIC);  // mnemonic is different because of offset
          assert.notEqual(await that.wallet.getPrimaryAddress(), TestUtils.ADDRESS);
          assert.equal(await that.wallet.getHeight(), 1);
          await that.wallet.close();
          
        } catch (e) {
          err = e;
        }
        
        // open main test wallet for other tests
        await that.wallet.openWallet(TestUtils.WALLET_RPC_NAME_1, TestUtils.WALLET_PASSWORD);
        
        // throw error if there was one
        if (err) throw err;
      });
      
      it("Can open wallets", async function() {
        let err;
        try {
          
          // create names of test wallets
          let numTestWallets = 3;
          let names = [];
          for (let i = 0; i < numTestWallets; i++) names.add(GenUtils.uuidv4());
          
          // create test wallets
          let mnemonics = [];
          for (let name of names) {
            await that.wallet.createWalletRandom(name, TestUtils.WALLET_PASSWORD);
            mnemonics.add(await that.wallet.getMnemonic());
            await that.wallet.close();
          }
          
          // open test wallets
          for (let i = 0; i < numTestWallets; i++) {
            await that.wallet.openWallet(names[i], TestUtils.WALLET_PASSWORD);
            assert.equal(await that.wallet.getMnemonic(), mnemonics[i]);
            await that.wallet.close();
          }
          
          // attempt to re-open already opened wallet
          try {
            await that.wallet.openWallet(names.get(numTestWallets - 1), TestUtils.WALLET_PASSWORD);
          } catch (e) {
            assert.equal(e.getCode(), -1);
          }
          
          // attempt to open non-existent
          try {
            await that.wallet.openWallet("btc_integrity", TestUtils.WALLET_PASSWORD);
          } catch (e) {
            assert.equal( e.getCode(), -1);  // -1 indicates wallet does not exist (or is open by another app)
          }
        } catch (e) {
          let err = e;
        }
        
        // open main test wallet for other tests
        try {
          await that.wallet.openWallet(TestUtils.WALLET_RPC_NAME_1, TestUtils.WALLET_PASSWORD);
        } catch (e) {
          assert.equal(e.getCode(), -1); // ok if wallet is already open
        }
        
        // throw error if there was one
        if (err) throw err;
      });
      
      it("Can indicate if multisig import is needed for correct balance information", async function() {
        assert.equal(await wallet.isMultisigImportNeeded(), false); // TODO: test with multisig wallet
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
      
      it("Can get addresses out of range of used accounts and subaddresses", async function() {
        let accounts = await this.wallet.getAccounts(true);
        let accountIdx = accounts.size() - 1;
        let subaddressIdx = accounts.get(accountIdx).getSubaddresses().size();
        let address = await this.wallet.getAddress(accountIdx, subaddressIdx);
        assert.equal(address, undefined);
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
            assert.equal(typeof subaddress.isUsed(), "boolean");
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
      
      it("Can close a wallet", async function() {
        
        // create a test wallet
        let path = GenUtils.uuidv4();
        await this.wallet.createWalletRandom(path, TestUtils.WALLET_RPC_PASSWORD);
        await this.wallet.sync();
        assert((await this.wallet.getHeight()) > 1);
        
        // close the wallet
        await this.wallet.close();
        
        // attempt to interact with the wallet
        try {
          await this.wallet.getHeight();
        } catch (e) {
          assert.equal(e.getCode(), -13);
          assert.equal(e.getMessage(), "No wallet file");
        }
        try {
          await this.wallet.getMnemonic();
        } catch (e) {
          assert.equal(e.getCode(), -13);
          assert.equal(e.getMessage(), "No wallet file");
        }
        try {
          await this.wallet.sync();
        } catch (e) {
          assert.equal(e.getCode(), -13);
          assert.equal(e.getMessage(), "No wallet file");
        }
        
        // re-open the wallet
        await this.wallet.openWallet(path, TestUtils.WALLET_RPC_PASSWORD);
        await this.wallet.sync();
        assert.equal(await this.wallet.getHeight(), daemon.getHeight());
        
        // close the wallet
        await this.wallet.close();
        
        // re-open main test wallet for other tests
        await this.wallet.openWallet(TestUtils.WALLET_RPC_NAME_1, TestUtils.WALLET_PASSWORD);
      });
      
      if (false)  // disabled so server not actually stopped
      it("Can stop the RPC server", async function() {
        await this.wallet.stop();
      });
    });
  }
}

module.exports = TestMoneroWalletRpc;

function testAddressBookEntry(entry) {
  assert(entry.getIndex() >= 0);
  assert(entry.getAddress());
  assert(entry.getDescription());
}