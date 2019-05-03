const BigInteger = require("../src/submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const TestMoneroDaemonRpc = require("./TestMoneroDaemonRpc");
const TestMoneroWalletRpc = require("./TestMoneroWalletRpc")
const TestMoneroWalletLocal = require("./TestMoneroWalletLocal")
const TestUtils = require("./TestUtils");
const MoneroRpc = require("../src/rpc/MoneroRpc");
const MoneroKeyImage = require("../src/daemon/model/MoneroKeyImage");
const MoneroTransfer = require("../src/wallet/model/MoneroTransfer");
const MoneroTxRequest = require("../src/wallet/request/MoneroTxRequest");
const MoneroTxWallet = require("../src/wallet/model/MoneroTxWallet");
const MoneroSendRequest = require("../src/wallet/request/MoneroSendRequest");
const MoneroTransferRequest = require("../src/wallet/request/MoneroTransferRequest");
const MoneroDestination = require("../src/wallet/model/MoneroDestination");
const MoneroOutputWallet = require("../src/wallet/model/MoneroOutputWallet");

describe("Scratchpad", function() {
  
  it("Can be scripted easily", async function() {
    
    // initialize daemon, wallet, and direct rpc interface
    let daemon = TestUtils.getDaemonRpc();
    let wallet = TestUtils.getWalletRpc();
    await TestUtils.initWalletRpc();
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