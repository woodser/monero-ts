const TestUtils = require("./utils/TestUtils");
const WalletSyncPrinter = require("./utils/WalletSyncPrinter");
const monerojs = require("../../index");

describe("Scratchpad", function() {
  
  it("Can be scripted easily", async function() {
    
//    let daemon = await TestUtils.getDaemonRpc();
//    let walletRpc = await TestUtils.getWalletRpc();
//    let walletFull = await TestUtils.getWalletFull();
    
    // initialize daemon rpc client
    let daemon = await monerojs.connectToDaemonRpc({
      uri: "http://localhost:38081",
      username: "superuser",
      password: "abctesting123",
      proxyToWorker: TestUtils.PROXY_TO_WORKER,
      rejectUnauthorized: false
    });
    console.log("Daemon height: " + await daemon.getHeight());
    
    // initialize wallet rpc client
    let walletRpc = await monerojs.connectToWalletRpc({
      uri: "http://localhost:38084",
      username: "rpc_user",
      password: "abc123",
      rejectUnauthorized: false
    });
    await walletRpc.openWallet("test_wallet_1", "supersecretpassword123");
    console.log("RPC wallet mnemonic: " + await walletRpc.getMnemonic());
    
    // create in-memory wallet with mnemonic
    let walletFull = await monerojs.createWalletFull({
      //path: "./test_wallets/" + GenUtils.getUUID(), // in-memory wallet if not given
      password: "abctesting123",
      networkType: "stagenet",
      serverUri: "http://localhost:38081",
      serverUsername: "superuser",
      serverPassword: "abctesting123",
      mnemonic: "hijack lucky rally sober hockey robot gumball amaze gave fifteen organs gecko skater wizard demonstrate upright system vegan tobacco tsunami lurk withdrawn tomorrow uphill organs",
      restoreHeight: 0,
      proxyToWorker: TestUtils.PROXY_TO_WORKER,
      rejectUnauthorized: false
    });
    await walletFull.sync(new WalletSyncPrinter());
    console.log("Full wallet daemon height: " + await walletFull.getDaemonHeight());
    console.log("Full wallet mnemonic: " + await walletFull.getMnemonic());
    
    await walletFull.close();
  });
});