const assert = require("assert");
const TestUtils = require("./utils/TestUtils");

/**
 * Test the sample code in README.md.
 */
class TestSampleCode {
  
  runTests() {
    describe("Test Sample Code", function() {
      let that = this;
      
      // initialize wallet
      before(async function() {
        try {
          // all wallets need to wait for txs to confirm to reliably sync
          TestUtils.WALLET_TX_TRACKER.reset();
          
          // pre-create test wallet
          let wallet = await TestUtils.getWalletRpc();
          await wallet.close();
          
          // create directory for test wallets if it doesn't exist
          const monerojs = require("../../index");
          let fs = TestUtils.getDefaultFs();
          if (!fs.existsSync(TestUtils.TEST_WALLETS_DIR)) {
            if (!fs.existsSync(process.cwd())) fs.mkdirSync(process.cwd(), { recursive: true });  // create current process directory for relative paths which does not exist in memory fs
            fs.mkdirSync(TestUtils.TEST_WALLETS_DIR);
          }
        } catch (e) {
          console.error("Error before tests: ");
          console.error(e);
          throw e;
        }
      });
      
      // TODO: wrap test in try...catch
      it("Sample code demonstration", async function() {
        
        // import library
        const monerojs = require("../../index");	// *** CHANGE README TO "monero-javascript" ***
        
        // connect to daemon
        let daemon = await monerojs.connectToDaemonRpc("http://localhost:38081", "superuser", "abctesting123");
        let height = await daemon.getHeight();            // 1523651
        let feeEstimate = await daemon.getFeeEstimate();  // 1014313512
        let txsInPool = await daemon.getTxPool();         // get transactions in the pool
        
        // open wallet on monero-wallet-rpc
        let walletRpc = await monerojs.connectToWalletRpc("http://localhost:38084", "rpc_user", "abc123");
        await walletRpc.openWallet("test_wallet_1", "supersecretpassword123");  // *** CHANGE README TO "sample_wallet_rpc" ***
        let primaryAddress = await walletRpc.getPrimaryAddress(); // 555zgduFhmKd2o8rPUz...
        let balance = await walletRpc.getBalance();               // 533648366742
        let txs = await walletRpc.getTxs();                       // get transactions containing transfers to/from the wallet
        
        // create wallet from mnemonic phrase using WebAssembly bindings to monero-project
        let walletWasm = await monerojs.createWalletWasm({
          path: "./test_wallets/" + monerojs.GenUtils.getUUID(),  // *** CHANGE README TO "sample_wallet_wasm"
          password: "supersecretpassword123",
          networkType: "stagenet",
          serverUri: "http://localhost:38081",
          serverUsername: "superuser",
          serverPassword: "abctesting123",
          mnemonic: TestUtils.MNEMONIC,                  // *** REPLACE README WITH MNEMONIC ***
          restoreHeight: TestUtils.FIRST_RECEIVE_HEIGHT, // *** REPLACE README WITH FIRST RECEIVE HEIGHT ***
          fs: TestUtils.getDefaultFs()
        });
        
        // synchronize with progress notifications
        await walletWasm.sync(new class extends monerojs.MoneroWalletListener {
          onSyncProgress(height, startHeight, endHeight, percentDone, message) {
            // feed a progress bar?
          }
        });
        
        // synchronize in the background every 5 seconds
        await walletWasm.startSyncing(5000);
        
        // receive notifications when funds are received, confirmed, and unlocked
        let fundsReceived = false;
        await walletWasm.addListener(new class extends monerojs.MoneroWalletListener {
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
          address: await walletWasm.getAddress(1, 0),
          amount: "250000000000", // send 0.25 XMR (denominated in atomic units)
          relay: false // create transaction and relay to the network if true
        });
        let fee = createdTx.getFee(); // "Are you sure you want to send... ?"
        await walletRpc.relayTx(createdTx); // relay the transaction
        
        // recipient receives unconfirmed funds within 5 seconds
        await new Promise(function(resolve) { setTimeout(resolve, 5000); });
        assert(fundsReceived);
        
        // save and close WebAssembly wallet
        await walletWasm.close(true);
      });
    });
  }
}

module.exports = TestSampleCode;