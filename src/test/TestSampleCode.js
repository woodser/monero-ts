const assert = require("assert");
const monerojs = require("../../index");
const TestUtils = require("./utils/TestUtils");

/**
 * Test the sample code in README.md.
 */
class TestSampleCode {
  
  runTests() {
    describe("Test sample code", function() {
      let that = this;
      let wallet;
      
      // initialize wallet
      before(async function() {
        try {
          
          // all wallets need to wait for txs to confirm to reliably sync
          TestUtils.WALLET_TX_TRACKER.reset();
          
          // create rpc test wallet
          let walletRpc = await TestUtils.getWalletRpc();
          await walletRpc.close();
          
          // create directory for test wallets if it doesn't exist
          let fs = TestUtils.getDefaultFs();
          if (!fs.existsSync(TestUtils.TEST_WALLETS_DIR)) {
            if (!fs.existsSync(process.cwd())) fs.mkdirSync(process.cwd(), { recursive: true });  // create current process directory for relative paths which does not exist in memory fs
            fs.mkdirSync(TestUtils.TEST_WALLETS_DIR);
          }
          
          // create full test wallet
          wallet = await TestUtils.getWalletFull();
        } catch (e) {
          console.error("Error before tests: ");
          console.error(e);
          throw e;
        }
      });
      
      after(async function() {
        if (wallet) await wallet.close(true);
      });
      
      it("Sample code demonstration", async function() {
        
        // import library
        const monerojs = require("../../index");	// *** CHANGE README TO "monero-javascript" ***
        
        // connect to daemon
        let daemon = await monerojs.connectToDaemonRpc("http://localhost:28081");
        let height = await daemon.getHeight();            // 1523651
        let txsInPool = await daemon.getTxPool();         // get transactions in the pool
        
        // open wallet on monero-wallet-rpc
        let walletRpc = await monerojs.connectToWalletRpc("http://localhost:28084", "rpc_user", "abc123");
        await walletRpc.openWallet("test_wallet_1", "supersecretpassword123");  // *** CHANGE README TO "sample_wallet_rpc" ***
        let primaryAddress = await walletRpc.getPrimaryAddress(); // 555zgduFhmKd2o8rPUz...
        let balance = await walletRpc.getBalance();               // 533648366742
        let txs = await walletRpc.getTxs();                       // get transactions containing transfers to/from the wallet
        
        // create wallet from mnemonic phrase using WebAssembly bindings to monero-project
        let walletFull = await monerojs.createWalletFull({
          path: "./test_wallets/" + monerojs.GenUtils.getUUID(),  // *** CHANGE README TO "sample_wallet_full"
          password: "supersecretpassword123",
          networkType: "testnet",
          serverUri: "http://localhost:28081",
          serverUsername: "superuser",
          serverPassword: "abctesting123",
          mnemonic: TestUtils.MNEMONIC,                  // *** REPLACE README WITH MNEMONIC ***
          restoreHeight: TestUtils.FIRST_RECEIVE_HEIGHT, // *** REPLACE README WITH FIRST RECEIVE HEIGHT ***
          fs: TestUtils.getDefaultFs()
        });
        
        // synchronize with progress notifications
        await walletFull.sync(new class extends monerojs.MoneroWalletListener {
          onSyncProgress(height, startHeight, endHeight, percentDone, message) {
            // feed a progress bar?
          }
        });
        
        // synchronize in the background every 5 seconds
        await walletFull.startSyncing(5000);
        
        // receive notifications when funds are received, confirmed, and unlocked
        let fundsReceived = false;
        await walletFull.addListener(new class extends monerojs.MoneroWalletListener {
          onOutputReceived(output) {
            let amount = output.getAmount();
            let txHash = output.getTx().getHash();
            let isConfirmed = output.getTx().isConfirmed();
            let isLocked = output.getTx().isLocked();
            fundsReceived = true;
          }
        });
        
        // send funds from RPC wallet to WebAssembly wallet
        await TestUtils.WALLET_TX_TRACKER.waitForWalletTxsToClearPool(walletRpc); // *** REMOVE FROM README SAMPLE ***
        let createdTx = await walletRpc.createTx({
          accountIndex: 0,
          address: await walletFull.getAddress(1, 0),
          amount: "250000000000", // send 0.25 XMR (denominated in atomic units)
          relay: false // create transaction and relay to the network if true
        });
        let fee = createdTx.getFee(); // "Are you sure you want to send... ?"
        await walletRpc.relayTx(createdTx); // relay the transaction
        
        // recipient receives unconfirmed funds within 5 seconds
        await new Promise(function(resolve) { setTimeout(resolve, 5000); });
        assert(fundsReceived);
        
        // save and close WebAssembly wallet
        await walletFull.close(true);
      });
      
      it("Connection manager demonstration", async function() {
        
        // imports
        const monerojs = require("../../index");    // *** CHANGE README TO "monero-javascript" ***
        const MoneroRpcConnection = monerojs.MoneroRpcConnection;
        const MoneroConnectionManager = monerojs.MoneroConnectionManager;
        const MoneroConnectionManagerListener = monerojs.MoneroConnectionManagerListener;
        
        // create connection manager
        let connectionManager = new MoneroConnectionManager();
        
        // add managed connections with priorities
        connectionManager.addConnection(new MoneroRpcConnection("http://localhost:28081").setPriority(1)); // use localhost as first priority
        connectionManager.addConnection(new MoneroRpcConnection("http://example.com")); // default priority is prioritized last
        
        // set current connection
        connectionManager.setConnection(new MoneroRpcConnection("http://foo.bar", "admin", "password")); // connection is added if new
        
        // check connection status
        await connectionManager.checkConnection();
        console.log("Connection manager is connected: " + connectionManager.isConnected());
        console.log("Connection is online: " + connectionManager.getConnection().isOnline());
        console.log("Connection is authenticated: " + connectionManager.getConnection().isAuthenticated());
        
        // receive notifications of any changes to current connection
        connectionManager.addListener(new class extends MoneroConnectionManagerListener {
          onConnectionChanged(connection) {
            console.log("Connection changed to: " + connection);
          }
        });
        
        // check connection status every 10 seconds
        await connectionManager.startCheckingConnection(10000);
        
        // automatically switch to best available connection if disconnected
        connectionManager.setAutoSwitch(true);
        
        // get best available connection in order of priority then response time
        let bestConnection = await connectionManager.getBestAvailableConnection();
        
        // check status of all connections
        await connectionManager.checkConnections();
        
        // get connections in order of current connection, online status from last check, priority, and name
        let connections = connectionManager.getConnections();
        
        // clear connection manager
        connectionManager.clear();
      });
      
      it("Test developer guide transaction queries", async function() {
        
        // get a transaction by hash
        let tx = await wallet.getTx((await wallet.getTxs())[0].getHash()); // REPLACE WITH BELOW FOR MD FILE
        //let tx = await wallet.getTx("9fb2cb7c73743002f131b72874e77b1152891968dc1f2849d3439ace8bae6d8e");
        
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
      
      it("Test developer guide transfer queries", async function() {
        
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
            inTxPool: true
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
            minHeight: TestUtils.FIRST_RECEIVE_HEIGHT   // *** REPLACE WITH NUMBER IN .MD FILE ***
          }
        });
        assert(transfers.length > 0);
        for (let transfer of transfers) {
          assert(transfer.isOutgoing());
          assert(transfer.getTx().isConfirmed());
          assert(transfer.getTx().getHeight() >= TestUtils.FIRST_RECEIVE_HEIGHT);
        }
      });
      
      it("Test developer guide output queries", async function() {
        
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
        
        // get outputs by amount
        let amount = outputs[0].getAmount();
        outputs = await wallet.getOutputs({
          amount: amount.toString()    // *** REPLACE WITH BigInteger IN .MD FILE ***
        });
        assert(outputs.length > 0);
        for (let output of outputs) assert.equal(output.getAmount().toString(), amount.toString());
        
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
      
      it("Test developer guide send funds", async function() {
        
        // create in-memory test wallet with randomly generated mnemonic
        let wallet = await monerojs.createWalletFull({
          password: "abctesting123",
          networkType: "testnet",
          serverUri: "http://localhost:28081"
        });
        
        try {
          // create a transaction to send funds to an address, but do not relay
          let tx = await wallet.createTx({
            accountIndex: 0,  // source account to send funds from
            address: "9tsUiG9bwcU7oTbAdBwBk2PzxFtysge5qcEsHEpetmEKgerHQa1fDqH7a4FiquZmms7yM22jdifVAD7jAb2e63GSJMuhY75",
            amount: "1000000000000" // send 1 XMR (denominated in atomic units)
          });
          
          // can confirm with the user
          let fee = tx.getFee();  // "Are you sure you want to send... ?"
          
          // relay the transaction
          let hash = await wallet.relayTx(tx);
        } catch (err) {
          assert.equal(err.message, "not enough money");
        }
        
        try {
          // send funds to a single destination
          let tx = await wallet.createTx({
            accountIndex: 0,  // source account to send funds from
            address: "9tsUiG9bwcU7oTbAdBwBk2PzxFtysge5qcEsHEpetmEKgerHQa1fDqH7a4FiquZmms7yM22jdifVAD7jAb2e63GSJMuhY75",
            amount: "1000000000000", // send 1 XMR (denominated in atomic units)
            relay: true // relay the transaction to the network
          });
        } catch (err) {
          assert.equal(err.message, "not enough money");
        }
        
        try {
          // send funds from a specific subaddress to multiple destinations,
          // allowing transfers to be split across multiple transactions if needed
          let txs = await wallet.createTxs({
            accountIndex: 0,    // source account to send funds from
            subaddressIndex: 1, // source subaddress to send funds from
            destinations: [{
                address: "9tsUiG9bwcU7oTbAdBwBk2PzxFtysge5qcEsHEpetmEKgerHQa1fDqH7a4FiquZmms7yM22jdifVAD7jAb2e63GSJMuhY75",
                amount: "500000000000", // send 0.5 XMR (denominated in atomic units)
              }, {
                address: "9y3bAgpF9iajSsNa7t4FN7Zh73MadCL4oMDTcD8SGzbxBGnkYhGyC67AD4pVkvaYw1XL97uwDYuFGf9hi1KEVgZpQtPWcZm",
                amount: "500000000000", // send 0.5 XMR (denominated in atomic units)
              }],
            priority: monerojs.MoneroTxPriority.IMPORTANT,
            relay: true // relay the transaction to the network
          });
        } catch (err) {
          assert.equal(err.message, "not enough money");
        }
        
        try {
          // sweep an output
          let tx = await wallet.sweepOutput({
            address: "9tsUiG9bwcU7oTbAdBwBk2PzxFtysge5qcEsHEpetmEKgerHQa1fDqH7a4FiquZmms7yM22jdifVAD7jAb2e63GSJMuhY75",
            keyImage: "b7afd6afbb1615c98b1c0350b81c98a77d6d4fc0ab92020d25fd76aca0914f1e",
            relay: true
          });
        } catch (err) {
          assert.equal(err.message, "No outputs found");
        }
        
        try {
          // sweep all unlocked funds in a wallet
          let txs = await wallet.sweepUnlocked({
            address: "9tsUiG9bwcU7oTbAdBwBk2PzxFtysge5qcEsHEpetmEKgerHQa1fDqH7a4FiquZmms7yM22jdifVAD7jAb2e63GSJMuhY75",
            relay: true
          });
        } catch (err) {
          assert.equal(err.message, "No unlocked balance in the specified account");
        }
        
        try {
          // sweep unlocked funds in an account
          let txs = await wallet.sweepUnlocked({
            accountIndex: 0,
            address: "9tsUiG9bwcU7oTbAdBwBk2PzxFtysge5qcEsHEpetmEKgerHQa1fDqH7a4FiquZmms7yM22jdifVAD7jAb2e63GSJMuhY75",
            relay: true
          });
        } catch (err) {
          assert.equal(err.message, "No unlocked balance in the specified account");
        }
        
        try {
          // sweep unlocked funds in a subaddress
          let txs = await wallet.sweepUnlocked({
            accountIndex: 0,
            subaddressIndex: 0,
            address: "9tsUiG9bwcU7oTbAdBwBk2PzxFtysge5qcEsHEpetmEKgerHQa1fDqH7a4FiquZmms7yM22jdifVAD7jAb2e63GSJMuhY75",
            relay: true
          });
        } catch (err) {
          assert.equal(err.message, "No unlocked balance in the specified account");
        }
      });
    });
  }
}

module.exports = TestSampleCode;