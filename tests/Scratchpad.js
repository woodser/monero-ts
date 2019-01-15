const BigInteger = require("../src/submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const TestMoneroDaemonRpc = require("./TestMoneroDaemonRpc");
const TestMoneroWalletRpc = require("./TestMoneroWalletRpc")
const TestMoneroWalletLocal = require("./TestMoneroWalletLocal")
const TestUtils = require("./TestUtils");
const MoneroRpc = require("../src/rpc/MoneroRpc");
const MoneroTransfer = require("../src/wallet/model/MoneroTransfer");
const MoneroTxFilter = require("../src/wallet/filters/MoneroTxFilter");
const MoneroWalletTx = require("../src/wallet/model/MoneroWalletTx");
const MoneroSendConfig = require("../src/wallet/model/MoneroSendConfig");
const MoneroTransferFilter = require("../src/wallet/filters/MoneroTransferFilter");
const MoneroDestination = require("../src/wallet/model/MoneroDestination");
const MoneroWalletOutput = require("../src/wallet/model/MoneroWalletOutput");

describe("Scratchpad", function() {
  
  it("Can be scripted easily", async function() {
    
    // initialize daemon and wallet
    let daemon = TestUtils.getDaemonRpc();
    let wallet = TestUtils.getWalletRpc();
    await TestUtils.initWalletRpc();
    
    
//    try { await wallet.startMining(8, false, true); }
//    catch (e) { }
//    await wallet.stopMining();
//    await daemon.stopMining();
//    await wallet.rescanBlockchain();
//    await wallet.rescanSpent();
    
    let txId = "af88ea62c1f0d439641f90f634d5bf5a6441170b35a36e53d52f4a4598df5682";
    
    // fetch transactions
//    let txs = await wallet.getTxs({txId: txId, getVouts: true});
//    for (let tx of txs) {
//      console.log(tx.toString());
//    }
    
//    // fetch transfers
//    let transfers = await wallet.getTransfers({accountIndex: 0, debugTxId: "a8429a20b173b119ffde6d3a0b3ebf666977f669cec1c5d23e879b69b553a37e"});
//    let str = "";
//    for (let transfer of transfers) {
//      str += transfer.getIsIncoming() ? "IN | " : "OUT | ";
//      str += transfer.getAmount().toString() + " | ";
//      str += transfer.getTx().getInTxPool() ? "POOL | " : transfer.getTx().getIsConfirmed() ? "CONFIRMED | " : transfer.getTx().getIsFailed() ? "FAILED | " : "?";
//      str += "\n";
//      if (transfer.getTx().getIsFailed()) {
//        console.log(transfer.getTx().toString());
//      }
//    }
//    console.log(str);

    
//    // fetch vouts
//    let vouts = await wallet.getVouts({accountIndex: 0, subaddressIndex: 2});
//    for (let vout of vouts) {
//      console.log(vout.toString());
//    }
    
    // send tx
//  let address1 = (await wallet.getSubaddress(1, 0)).getAddress();
//  let transfer1 = new MoneroTransfer(address1, new BigInteger(2).multiply(TestUtils.MAX_FEE));
//  let transfer2 = new MoneroTransfer(address1, new BigInteger(3).multiply(TestUtils.MAX_FEE));
//  let sendConfig = new MoneroSendConfig();
//  sendConfig.setTransfers([transfer1, transfer2]);
//  sendConfig.setAccountIndex(0);
//  let tx = await wallet.send(sendConfig);
//  console.log(tx.toString());
    
//    
//    // use direct rpc interface to
//    let rpc = new MoneroRpc({
//      uri: "http://localhost:38083",
//      user: "rpc_user",
//      pass: "abc123",
//    });
//    let resp = await rpc.sendJsonRequest("get_transfer_by_txid", {txid: "5d6218a24a81de3c7eb4474b3452ef6b81aea84dda930a129f807f80feac34f2"});
//    console.log(resp);
  });
});