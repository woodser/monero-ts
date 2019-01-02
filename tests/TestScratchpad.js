const TestMoneroDaemonRpc = require("./TestMoneroDaemonRpc");
const TestMoneroWalletRpc = require("./TestMoneroWalletRpc")
const TestMoneroWalletLocal = require("./TestMoneroWalletLocal")
const TestUtils = require("./TestUtils");
const MoneroRpc = require("../src/rpc/MoneroRpc");
const MoneroTxFilter = require("../src/wallet/model/MoneroTxFilter");

describe("Test Scratchpad", function() {
  
  it("Can be scripted easily", async function() {
    let daemon = TestUtils.getDaemonRpc();
    let wallet = TestUtils.getWalletRpc();

    await daemon.stopMining();
    
//    // fetch txs
//    let filter = new MoneroTxFilter();
//    filter.setTxIds(["5d6218a24a81de3c7eb4474b3452ef6b81aea84dda930a129f807f80feac34f2"]);
//    let txs = await wallet.getTxs(filter);
//    for (let tx of txs) {
//      console.log(tx);
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