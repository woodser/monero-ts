const TestMoneroDaemonRpc = require("./TestMoneroDaemonRpc");
const TestMoneroWalletRpc = require("./TestMoneroWalletRpc")
const TestMoneroWalletLocal = require("./TestMoneroWalletLocal")
const TestUtils = require("./TestUtils");

describe("Test Scratchpad", function() {
  
  it("Can be scripted easily", async function() {
    let daemon = TestUtils.getDaemonRpc();
    await daemon.stopMining();
  });
});