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
          await TestUtils.getWalletKeys();
          TestUtils.TX_POOL_WALLET_TRACKER.reset(); // all wallets need to wait for txs to confirm to reliably sync
        } catch (e) {
          console.log(e);
        }
      });
      
      it("Can be demonstrated with sample code", async function() {
        
        // import Monero types
        require("../../index.js");
        //require("monero-javascript"); // *** USE IN README SAMPLE ***
        
        // connect to a daemon
        let daemon = new MoneroDaemonRpc("http://localhost:38081");
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
        
        // create a keys-only wallet with a random mnemonic phrase
        let walletKeys = await MoneroWalletKeys.createWalletRandom(MoneroNetworkType.STAGENET, "English");
        let mnemonic = await walletKeys.getMnemonic();  // megabyte ghetto syllabus ...
        
        // open a wallet on the server
        await walletRpc.openWallet("test_wallet_1", "supersecretpassword123");
        let primaryAddress = await walletRpc.getPrimaryAddress(); // 59aZULsUF3YNSKGiHz4J...
        let balance = await walletRpc.getBalance();               // 533648366742
        let subaddress = await walletRpc.getSubaddress(1, 0);
        let subaddressBalance = subaddress.getBalance();
        
        // query a transaction by hash
        let tx = await walletRpc.getTx((await walletRpc.getTxs(new MoneroTxQuery().setIsOutgoing(true)))[0].getHash()); // *** REMOVE FROM README SAMPLE ***
        //let tx = await walletRpc.getTx("314a0f1375db31cea4dac4e0a51514a6282b43792269b3660166d4d2b46437ca");
        let txHeight = tx.getHeight();
        let incomingTransfers = tx.getIncomingTransfers();
        let destinations = tx.getOutgoingTransfer().getDestinations();
        
        // query incoming transfers to account 1
        let transferQuery = new MoneroTransferQuery().setIsIncoming(true).setAccountIndex(1);
        let transfers = await walletRpc.getTransfers(transferQuery);
        
        // query unspent outputs
        let outputQuery = new MoneroOutputQuery().setIsSpent(false);
        let outputs = await walletRpc.getOutputs(outputQuery);
        
        // send funds from the RPC wallet
        await TestUtils.TX_POOL_WALLET_TRACKER.waitForWalletTxsToClearPool(walletRpc); // wait for txs to clear pool *** REMOVE FROM README SAMPLE ***
        let txSet = await walletRpc.send(0, "79fgaPL8we44uPA5SBzB7ABvxR1CrU6gteRfny1eXc2RVQk7Jhk5oR5YQnQZuorP3kEVXxewi2CG5CfUBfmRqTvy49UvYkG", BigInteger.parse("50000"));
        let sentTx = txSet.getTxs()[0];  // send methods return tx set(s) which contain sent txs unless further steps needed in a multisig or watch-only wallet
        assert(sentTx.inTxPool());
        
        // create a request to send funds from the RPC wallet to multiple destinations
        let request = new MoneroSendRequest()
                .setAccountIndex(1)                           // send from account 1
                .setSubaddressIndices([0, 1])                 // send from subaddreses in account 1
                .setPriority(MoneroSendPriority.UNIMPORTANT)  // no rush
                .setDestinations([
                        new MoneroDestination("79LS7Vq214d6tXRdAoosz9Qifbg2qTNrZfWziwLZc8ih3GRjxN1dWZNTYmr7HAmVKLd5NsCfJRucJH4xPF326HdeVhngHyj", BigInteger.parse("50000")),
                        new MoneroDestination("74YpXA1GvZeJHQtdRCByB2PzEfGzQSpniDr6yier8UrKhXU4YAp8QVDFSKd4XAMsj4HYcE9ibW3JzKVSXEDoE4xkMSFvHAe", BigInteger.parse("50000"))]);
        
        // create the transaction, confirm with the user, and relay to the network
        let createdTx = (await walletRpc.createTx(request)).getTxs()[0];
        let fee = createdTx.getFee();       // "Are you sure you want to send ...?"
        await walletRpc.relayTx(createdTx); // submit the transaction which will notify the JNI wallet
        
        // mine with 7 threads to push the network along
        let numThreads = 7;
        let isBackground = false;
        let ignoreBattery = false;
        await walletRpc.startMining(numThreads, isBackground, ignoreBattery);
        
        // wait for the next block to be added to the chain
        let nextBlockHeader = await daemon.getNextBlockHeader();
        let nextNumTxs = nextBlockHeader.getNumTxs();
        
        // stop mining
        await walletRpc.stopMining();
        
        // the transaction is (probably) confirmed
        await new Promise(function(resolve) { setTimeout(resolve, 10000); }); // wait 10s for auto refresh
        let isConfirmed = (await walletRpc.getTx(createdTx.getHash())).isConfirmed();
      });
      
      if (false)  // TODO: deprecated
      it("Can demonstrate the wallet with sample code", async function() {
        
        // imports
        const BigInteger = require("../../external/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
        const MoneroWalletRpc = require("../main/js/wallet/MoneroWalletRpc");
        const MoneroTransfer = require("../main/js/wallet/model/MoneroTransfer");
        const MoneroSendPriority = require("../main/js/wallet/model/MoneroSendPriority");
        const MoneroDestination = require("../main/js/wallet/model/MoneroDestination");
        const MoneroSendRequest = require("../main/js/wallet/model/MoneroSendRequest");
        
        // create a wallet that uses a monero-wallet-rpc endpoint with authentication
        let wallet = new MoneroWalletRpc({
          uri: "http://localhost:38083",
          user: "rpc_user",
          pass: "abc123"
        });

        // get wallet balance as BigInteger
        let balance = await wallet.getBalance();  // e.g. 533648366742
        
        // get wallet primary address
        let primaryAddress = await wallet.getPrimaryAddress();  // e.g. 59aZULsUF3YNSKGiHz4J...
        
        // get address and balance of subaddress [1, 0]
        let subaddress = await wallet.getSubaddress(1, 0);
        let subaddressBalance = subaddress.getBalance();
        let subaddressAddress = subaddress.getAddress();
        
        // get incoming and outgoing transfers
        let transfers = await wallet.getTransfers();
        for (let transfer of transfers) {
          let isIncoming = transfer.isIncoming();
          let amount = transfer.getAmount();
          let accountIdx = transfer.getAccountIndex();
          let height = transfer.getTx().getHeight();  // will be undefined if unconfirmed
        }
        
        // get incoming transfers to account 0
        transfers = await wallet.getTransfers(new MoneroTransferQuery().setAccountIndex(0).setIsIncoming(true));
        for (let transfer of transfers) {
          assert(transfer.isIncoming());
          assert.equal(transfer.getAccountIndex(), 0);
          let amount = transfer.getAmount();
          let height = transfer.getTx().getHeight();  // will be undefined if unconfirmed
        }

        // send to an address from account 0
        let sentTx = await wallet.send(0, "74oAtjgE2dfD1bJBo4DWW3E6qXCAwUDMgNqUurnX9b2xUvDTwMwExiXDkZskg7Vct37tRGjzHRqL4gH4H3oag3YyMYJzrNp", new BigInteger(50000));

        // send to multiple destinations from multiple subaddresses in account 1 which can be split into multiple transactions
        // see MoneroSendRequest.js for all config options or to build a config object
        let sentTxs = await wallet.sendSplit({
          destinations: [
            {address: "7BV7iyk9T6kfs7cPfmn7vPZPyWRid7WEwecBkkVr8fpw9MmUgXTPtvMKXuuzqKyr2BegWMhEcGGEt5vNkmJEtgnRFUAvf29", amount: new BigInteger(50000) },
            {address: "78NWrWGgyZeYgckJhuxmtDMqo8Kzq5r9j1kV8BQXGq5CDnECz2KjQeBDc3KKvdMQmR6TWtfbRaedgbSGmmwr1g8N1rBMdvW", amount: new BigInteger(50000) }
          ],
          accountIndex: 1,
          subaddressIndices: [0, 1],
          priority: MoneroSendPriority.UNIMPORTANT // no rush
        });
        
        // get all confirmed wallet transactions
        for (let tx of await wallet.getTxs(new MoneroTxQuery().setIsConfirmed(true))) {
          let txHash = tx.getHash();                  // e.g. f8b2f0baa80bf6b...
          let txFee = tx.getFee();                // e.g. 750000
          let isConfirmed = tx.isConfirmed();  // e.g. true
        }
        
        // get a wallet transaction by hash
        let tx = await wallet.getTx("69a0d27a3e019526cb5a969ce9f65f1433b8069b68b3ff3c6a5b992a2983f7a2");
        let txHash = tx.getHash();                  // e.g. 69a0d27a3e019526c...
        let txFee = tx.getFee();                // e.g. 750000
        let isConfirmed = tx.isConfirmed();  // e.g. true
      });

      if (false)  // TODO: deprecated
      it("Can demonstrate the daemon with sample code", async function() {
          
          // imports
          const MoneroDaemonRpc = require("../main/js/daemon/MoneroDaemonRpc");
          
          // create a daemon that uses a monero-daemon-rpc endpoint
          let daemon = new MoneroDaemonRpc({uri: "http://localhost:38081"});
          
          // get daemon info
          let height = await daemon.getHeight();           // e.g. 1523651
          let feeEstimate = await daemon.getFeeEstimate(); // e.g. 750000
          
          // get first 100 blocks as a binary request
          let blocks = await daemon.getBlocksByRange(0, 100);
          
          // get block info
          for (let block of blocks) {
            let blockHeight = block.getHeight();
            let blockHash = block.getHash();
            let txCount = block.getTxs().length;
          }
          
          // start mining to an address with 4 threads, not in the background, and ignoring the battery
          let address = TestUtils.ADDRESS;
          //let address = "74oAtjgE2dfD1bJBo4DWW3E6qXCAwUDMgNqUurnX9b2xUvDTwMwExiXDkZskg7Vct37tRGjzHRqL4gH4H3oag3YyMYJzrNp";
          let numThreads = 4;
          let isBackground = false;
          let ignoreBattery = false;
          await daemon.startMining(address, numThreads, isBackground, ignoreBattery);
          
          // wait for the header of the next block added to the chain
          let nextBlockHeader = await daemon.getNextBlockHeader();
          let nextNumTxs = nextBlockHeader.getNumTxs();
          
          // stop mining
          await daemon.stopMining();
        });
    });
  }
}

module.exports = TestSampleCode;