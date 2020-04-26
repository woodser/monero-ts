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
          TestUtils.TX_POOL_WALLET_TRACKER.reset(); // all wallets need to wait for txs to confirm to reliably sync
          
          // create directory for test wallets if it doesn't exist
          let fs = MoneroUtils.getDefaultFs();
          if (!fs.existsSync(TestUtils.TEST_WALLETS_DIR)) {
            if (!fs.existsSync(process.cwd())) fs.mkdirSync(process.cwd(), { recursive: true });  // create current process directory for relative paths which does not exist in memory fs
            fs.mkdirSync(TestUtils.TEST_WALLETS_DIR);
          }
        } catch (e) {
          console.log(e);
        }
      });
      
      // TODO: wrap test in try...catch and close wasm wallet
      it("Can be demonstrated with sample code", async function() {
        
        // import library
        //require("monero-javascript"); // *** USE IN README.MD ***
        
        // connect to a daemon
        let daemon = new MoneroDaemonRpc({
          uri: "http://localhost:38081", 
          username: "superuser",
          password: "abctesting123",
          proxyToWorker: TestUtils.PROXY_TO_WORKER       // *** REMOVE FROM README.MD ***
        });
        let height = await daemon.getHeight();           // 1523651
        let feeEstimate = await daemon.getFeeEstimate(); // 1014313512
        
        // get transactions in the pool
        let txsInPool = await daemon.getTxPool();
        for (let tx of txsInPool) {
          let hash = tx.getHash();
          let fee = tx.getFee();
          let isDoubleSpendSeen = tx.isDoubleSpendSeen();
        }
        
        // get last 100 blocks as a binary request
        let blocks = await daemon.getBlocksByRange(height - 100, height - 1);
        for (let block of blocks) {
          let numTxs = block.getTxs().length;
        }
        
        // connect to a monero-wallet-rpc endpoint with authentication
        let walletRpc = new MoneroWalletRpc("http://localhost:38083", "rpc_user", "abc123");
        
        // open a wallet on the server
        await walletRpc.openWallet("test_wallet_1", "supersecretpassword123");
        let primaryAddress = await walletRpc.getPrimaryAddress(); // 59aZULsUF3YNSKGiHz4J...
        let balance = await walletRpc.getBalance();               // 533648366742
        let subaddress = await walletRpc.getSubaddress(1, 0);
        let subaddressBalance = subaddress.getBalance();
        
        // query a transaction by hash
        let tx = await walletRpc.getTx((await walletRpc.getTxs(new MoneroTxQuery().setIsOutgoing(true)))[0].getHash());  // *** REMOVE FROM README SAMPLE ***
        //let tx = await walletRpc.getTx("32088012e68be1c090dc022f7852ca4d7c23066241649cdfaeb14ec1fd5a10f8");
        let txHeight = tx.getHeight();
        let incomingTransfers = tx.getIncomingTransfers();
        let destinations = tx.getOutgoingTransfer().getDestinations();
        
        // query incoming transfers to account 1
        let transferQuery = new MoneroTransferQuery().setIsIncoming(true).setAccountIndex(1);
        let transfers = await walletRpc.getTransfers(transferQuery);
        
        // query unspent outputs
        let outputQuery = new MoneroOutputQuery().setIsSpent(false);
        let outputs = await walletRpc.getOutputs(outputQuery);
        
        // create a wallet from a mnemonic phrase using WebAssembly bindings to monero-project
        let walletWasm = await MoneroWalletWasm.createWallet({  // *** REPLACE WITH BELOW FOR README.MD ***
          path: "./test_wallets/" + GenUtils.getUUID(),
          password: "supersecretpassword123",
          networkType: TestUtils.NETWORK_TYPE,
          mnemonic: TestUtils.MNEMONIC,
          server: await daemon.getRpcConnection(),
          restoreHeight: TestUtils.FIRST_RECEIVE_HEIGHT,
          proxyToWorker: TestUtils.PROXY_TO_WORKER
        });
//        let walletWasm = await MoneroWalletWasm.createWallet({
//          path: "MyWallet",
//          password: "supersecretpassword123",
//          networkType: MoneroNetworkType.STAGENET,
//          mnemonic: "hefty value ...",
//          server: await daemon.getRpcConnection(),
//          restoreHeight: 501788
//        });
        
        // synchronize the wallet and receive progress notifications
        await walletWasm.sync(new class extends MoneroSyncListener {
          onSyncProgress(height, startHeight, endHeight, percentDone, message) {
            // feed a progress bar?
          }
        });
        
        // start syncing the wallet continuously in the background
        await walletWasm.startSyncing();
        
        // receive notifications when the wasm wallet receives funds
        await walletWasm.addListener(new class extends MoneroWalletListener {
          onOutputReceived(output) {
            console.log("Wallet received funds!");
            let txHash = output.getTx().getHash();
            let accountIdx = output.getAccountIndex();
            let subaddressIdx = output.getSubaddressIndex();
            TestSampleCode.CORE_OUTPUT_RECEIVED = true;
          }
        });
        
        // send funds from the RPC wallet to the wasm wallet
        await TestUtils.TX_POOL_WALLET_TRACKER.waitForWalletTxsToClearPool(walletRpc); // wait for txs to clear pool *** REMOVE FROM README SAMPLE ***
        let txSet = await walletRpc.sendTx(0, await walletWasm.getPrimaryAddress(), BigInteger.parse("50000"));
        let sentTx = txSet.getTxs()[0];  // send methods return tx set(s) which contain sent txs unless further steps needed in a multisig or watch-only wallet
        assert(sentTx.inTxPool(), "Sent transaction is not in the tx pool");
        
        // mine with 7 threads to push the network along
        let numThreads = 7;
        let isBackground = false;
        let ignoreBattery = false;
        try { await walletRpc.startMining(numThreads, isBackground, ignoreBattery); } catch(e) { }
        
        // wait for the next block to be added to the chain
        let nextBlockHeader = await daemon.getNextBlockHeader();
        let nextNumTxs = nextBlockHeader.getNumTxs();
        
        // stop mining
        try { await walletRpc.stopMining(); } catch(e) { }
        
        // the transaction is (probably) confirmed
        await new Promise(function(resolve) { setTimeout(resolve, 10000); });  // wait 10s for auto refresh
        let isConfirmed = (await walletRpc.getTx(sentTx.getHash())).isConfirmed();
        
        // create a request to send funds from the RPC wallet to multiple destinations in the wasm wallet
        let request = new MoneroSendRequest()
                .setAccountIndex(1)                           // send from account 1
                .setSubaddressIndices([0, 1])                 // send from subaddresses in account 1
                .setPriority(MoneroSendPriority.UNIMPORTANT)  // no rush
                .setDestinations([
                        new MoneroDestination(await walletWasm.getAddress(1, 0), BigInteger.parse("50000")),
                        new MoneroDestination(await walletWasm.getAddress(2, 0), BigInteger.parse("50000"))]);
        
        // create the transaction, confirm with the user, and relay to the network
        let createdTx = (await walletRpc.createTx(request)).getTxs()[0];
        let fee = createdTx.getFee();  // "Are you sure you want to send ...?"
        await walletRpc.relayTx(createdTx); // submit the transaction which will notify the JNI wallet
        
        // wasm wallet will receive notification of incoming output after a moment
        await new Promise(function(resolve) { setTimeout(resolve, 10000); });
        assert(TestSampleCode.CORE_OUTPUT_RECEIVED, "Output not received");
        
        // save and close the wasm wallet
        await walletWasm.close(true);
      });
    });
  }
}

module.exports = TestSampleCode;