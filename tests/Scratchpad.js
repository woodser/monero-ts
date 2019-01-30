const BigInteger = require("../src/submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const TestMoneroDaemonRpc = require("./TestMoneroDaemonRpc");
const TestMoneroWalletRpc = require("./TestMoneroWalletRpc")
const TestMoneroWalletLocal = require("./TestMoneroWalletLocal")
const TestUtils = require("./TestUtils");
const MoneroRpc = require("../src/rpc/MoneroRpc");
const MoneroKeyImage = require("../src/daemon/model/MoneroKeyImage");
const MoneroTransfer = require("../src/wallet/model/MoneroTransfer");
const MoneroTxFilter = require("../src/wallet/filters/MoneroTxFilter");
const MoneroWalletTx = require("../src/wallet/model/MoneroWalletTx");
const MoneroSendConfig = require("../src/wallet/model/MoneroSendConfig");
const MoneroTransferFilter = require("../src/wallet/filters/MoneroTransferFilter");
const MoneroDestination = require("../src/wallet/model/MoneroDestination");
const MoneroWalletOutput = require("../src/wallet/model/MoneroWalletOutput");

describe("Scratchpad", function() {
  
  it("Can be scripted easily", async function() {
    
    // initialize daemon, wallet, and direct rpc interface
    let daemon = TestUtils.getDaemonRpc();
    let wallet = TestUtils.getWalletRpc();
    await TestUtils.initWalletRpc();
    let rpc = new MoneroRpc({
      uri: "http://localhost:38083",
      user: "rpc_user",
      pass: "abc123",
    });
    
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
    
    transfers = await wallet.getTransfers({accountIndex: 0, subaddressIndices: [0, 1, 2], txId: "5d6218a24a81de3c7eb4474b3452ef6b81aea84dda930a129f807f80feac34f2"});
    for (let transfer of transfers) {
      console.log(transfers);
    }
  });
});