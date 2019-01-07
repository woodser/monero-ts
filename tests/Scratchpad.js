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

    await daemon.stopMining();
    
//    await wallet.rescanBlockchain();
//    await wallet.rescanSpent();
    
    // fetch txs
    let txId = "07e50b08d46fa4075ac11ec05d8b5fe133026afc63d473db21a25b1f844a5bdd";
    let filter = new MoneroTxFilter();
    filter.setAccountIndex(0);
    filter.setSubaddressIndices([0]);
    filter.setTxIds([txId]);
    let txs = await wallet.getTxs(filter, undefined, txId);
    for (let tx of txs) {
      console.log(tx.toString());
    }
    
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