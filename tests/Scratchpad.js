const TestMoneroDaemonRpc = require("./TestMoneroDaemonRpc");
const TestMoneroWalletRpc = require("./TestMoneroWalletRpc")
const TestMoneroWalletLocal = require("./TestMoneroWalletLocal")
const TestUtils = require("./TestUtils");
const MoneroRpc = require("../src/rpc/MoneroRpc");
const MoneroTxFilter = require("../src/wallet/model/MoneroTxFilter");

describe("Scratchpad", function() {
  
  it("Can be scripted easily", async function() {
    
    // initialize daemon and wallet
    let daemon = TestUtils.getDaemonRpc();
    let wallet = TestUtils.getWalletRpc();
    await TestUtils.initWalletRpc();
    
//    try { await wallet.startMining(8, false, true); }
//    catch (e) { }
    await wallet.stopMining();
    await daemon.stopMining();
//    await wallet.rescanBlockchain();
//    await wallet.rescanSpent();
    
//    // fetch txs
//    let txId = "67c0172a2ada9b5c72a2bbe0b3272073d5a099075a2779cedeee4546556a60b6";
//    let filter = new MoneroTxFilter();
//    //filter.setAccountIndex(0);
//    //filter.setSubaddressIndices([0]);
//    //filter.setFetchVouts(true);
//    filter.setTxIds([txId]);
//    let txs = await wallet.getTxs(filter, undefined, txId);
//    for (let tx of txs) {
//      console.log(tx.toString());
//    }
    
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