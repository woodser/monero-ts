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
const MoneroTxWallet = require("../main/wallet/model/MoneroTxWallet");
const MoneroSendRequest = require("../main/wallet/model/MoneroSendRequest");
const MoneroTransferQuery = require("../main/wallet/model/MoneroQueries").MoneroTransferQuery;
const MoneroDestination = require("../main/wallet/model/MoneroDestination");
const MoneroOutputWallet = require("../main/wallet/model/MoneroOutputWallet");

describe("Scratchpad", function() {
  
  it("Can be scripted easily", async function() {
    
    // initialize daemon, wallet, and direct rpc interface
    let daemon = TestUtils.getDaemonRpc();
    let wallet = TestUtils.getWalletRpc();
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
    
  });
});