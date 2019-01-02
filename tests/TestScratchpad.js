const MoneroRpc = require("../src/rpc/MoneroRpc");
const TestMoneroDaemonRpc = require("./TestMoneroDaemonRpc");
const TestMoneroWalletRpc = require("./TestMoneroWalletRpc")
const TestMoneroWalletLocal = require("./TestMoneroWalletLocal")
const TestUtils = require("./TestUtils");

describe("Test Scratchpad", function() {
  
  it("Can be scripted easily", async function() {
//    let daemon = TestUtils.getDaemonRpc();
//    await daemon.stopMining();
    
    let rpc = new MoneroRpc({
      uri: "http://localhost:38083",
      user: "rpc_user",
      pass: "abc123",
    });
    let resp = await rpc.sendJsonRequest("get_transfer_by_txid", {txid: "5d6218a24a81de3c7eb4474b3452ef6b81aea84dda930a129f807f80feac34f2"});
    console.log(resp);
  });
});