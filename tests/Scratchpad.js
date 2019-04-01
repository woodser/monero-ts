const BigInteger = require("../src/submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const TestMoneroDaemonRpc = require("./TestMoneroDaemonRpc");
const TestMoneroWalletRpc = require("./TestMoneroWalletRpc")
const TestMoneroWalletLocal = require("./TestMoneroWalletLocal")
const TestUtils = require("./TestUtils");
const MoneroRpc = require("../src/rpc/MoneroRpc");
const MoneroKeyImage = require("../src/daemon/model/MoneroKeyImage");
const MoneroTransfer = require("../src/wallet/model/MoneroTransfer");
const MoneroTxFilter = require("../src/wallet/config/MoneroTxFilter");
const MoneroTxWallet = require("../src/wallet/model/MoneroTxWallet");
const MoneroSendConfig = require("../src/wallet/config/MoneroSendConfig");
const MoneroTransferFilter = require("../src/wallet/config/MoneroTransferFilter");
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
    let vouts;
    
    // -------------------------------- SCRATCHPAD ----------------------------
    
//    let tx = (await wallet.getTxs({txId: "fb677bee4ce47a308e366ac3ae9fe06b29c8673cf4ef0bf9d9bf9e621fb62673"}))[0];
//    console.log(tx.toString());
    
    let accounts = await wallet.getAccounts(true);
    for (let account of accounts) {
      console.log(account.getUnlockedBalance().toJSValue());
      for (let subaddress of account.getSubaddresses()) {
        console.log("\t" + subaddress.getUnlockedBalance().toJSValue());
      }
    }
    
//    let tx = await wallet.send(await wallet.getPrimaryAddress(), TestUtils.MAX_FEE);
//    console.log(tx.toString());
    
//    transfers = await wallet.getTransfers({isOutgoing: true, accountIndex: 0, subaddressIndices: [0, 1, 2]});
//    for (let transfer of transfers) {
//      //console.log(transfers);
//    }
  });
});