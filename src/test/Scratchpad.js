const assert = require("assert");
const BigInteger = require("../../external/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const TestMoneroDaemonRpc = require("./TestMoneroDaemonRpc");
const TestMoneroWalletRpc = require("./TestMoneroWalletRpc")
const TestMoneroWalletLocal = require("./TestMoneroWalletLocal")
const TestUtils = require("./utils/TestUtils");
const MoneroRpc = require("../main/rpc/MoneroRpcConnection");
const MoneroKeyImage = require("../main/daemon/model/MoneroKeyImage");
const MoneroTransfer = require("../main/wallet/model/MoneroTransfer");
const MoneroTxQuery = require("../main/wallet/model/MoneroQueries").MoneroTxQuery;
const MoneroTransferQuery = require("../main/wallet/model/MoneroQueries").MoneroTransferQuery;
const MoneroOutputQuery = require("../main/wallet/model/MoneroQueries").MoneroOutputQuery;
const MoneroTxWallet = require("../main/wallet/model/MoneroTxWallet");
const MoneroSendRequest = require("../main/wallet/model/MoneroSendRequest");
const MoneroDestination = require("../main/wallet/model/MoneroDestination");
const MoneroOutputWallet = require("../main/wallet/model/MoneroOutputWallet");

describe("Scratchpad", function() {
  
  it("Can be scripted easily", async function() {
    
    // initialize daemon, wallet, and direct rpc interface
    let daemon = TestUtils.getDaemonRpc();
    let wallet = await TestUtils.getWalletRpc();
    let rpc = new MoneroRpc(TestUtils.WALLET_RPC_CONFIG);
    
//  try { await wallet.startMining(8, false, true); }
//  catch (e) { }
//  await wallet.stopMining();
//  await daemon.stopMining();
//  await wallet.rescanBlockchain();
//  await wallet.rescanSpent();
//  await daemon.flushTxPool();
    
    // common variables
    let txs;
    let transfers;
    let txId;
    
    // -------------------------------- SCRATCHPAD ----------------------------
    
    let outputs = await wallet.getOutputs(new MoneroOutputQuery().setAccountIndex(0).setSubaddressIndex(1));
    assert(outputs.length > 0);
    for (let output of outputs) {
      assert.equal(output.getAccountIndex(), 0);
      assert.equal(output.getSubaddressIndex(), 1);
    }
  });
});