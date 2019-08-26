const assert = require("assert");
const TestUtils = require("./TestUtils");
const MoneroTxRequest = require("../src/wallet/model/MoneroTxRequest");
const MoneroTransferRequest = require("../src/wallet/model/MoneroTransferRequest");

/**
 * Test the sample code in README.md.
 */
describe("Test Sample Code", function() {
  
  it("Can demonstrate the wallet with sample code", async function() {
    
    // imports
    const BigInteger = require("../external/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
    const MoneroWalletRpc = require("../src/wallet/MoneroWalletRpc");
    const MoneroTransfer = require("../src/wallet/model/MoneroTransfer");
    const MoneroSendPriority = require("../src/wallet/model/MoneroSendPriority");
    const MoneroDestination = require("../src/wallet/model/MoneroDestination");
    const MoneroSendRequest = require("../src/wallet/model/MoneroSendRequest");
    
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
      let isIncoming = transfer.getIsIncoming();
      let amount = transfer.getAmount();
      let accountIdx = transfer.getAccountIndex();
      let height = transfer.getTx().getHeight();  // will be undefined if unconfirmed
    }
    
    // get incoming transfers to account 0
    transfers = await wallet.getTransfers(new MoneroTransferRequest().setAccountIndex(0).setIsIncoming(true));
    for (let transfer of transfers) {
      assert(transfer.getIsIncoming());
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
    for (let tx of await wallet.getTxs(new MoneroTxRequest().setIsConfirmed(true))) {
      let txId = tx.getId();                  // e.g. f8b2f0baa80bf6b...
      let txFee = tx.getFee();                // e.g. 750000
      let isConfirmed = tx.getIsConfirmed();  // e.g. true
    }
    
    // get a wallet transaction by id
    let tx = await wallet.getTx("69a0d27a3e019526cb5a969ce9f65f1433b8069b68b3ff3c6a5b992a2983f7a2");
    let txId = tx.getId();                  // e.g. 69a0d27a3e019526c...
    let txFee = tx.getFee();                // e.g. 750000
    let isConfirmed = tx.getIsConfirmed();  // e.g. true
  });

  it("Can demonstrate the daemon with sample code", async function() {
      
      // imports
      const MoneroDaemonRpc = require("../src/daemon/MoneroDaemonRpc");
      
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
        let blockId = block.getId();
        let txCount = block.getTxs().length;
      }
      
      // start mining to an address with 4 threads, not in the background, and ignoring the battery
      let address = TestUtils.TEST_ADDRESS;
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