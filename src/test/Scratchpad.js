import TestUtils from "./utils/TestUtils";
import WalletSyncPrinter from "./utils/WalletSyncPrinter";

describe("Scratchpad", function() {
  
  it("Can be scripted easily", async function() {
    
//    let daemon = await TestUtils.getDaemonRpc();
//    let walletRpc = await TestUtils.getWalletRpc();
//    let walletFull = await TestUtils.getWalletFull();
    
    // initialize daemon rpc client
    let daemon = await connectToDaemonRpc({
      uri: "http://localhost:28081",
      username: "superuser",
      password: "abctesting123",
      proxyToWorker: TestUtils.PROXY_TO_WORKER,
      rejectUnauthorized: false
    });
    console.log("Daemon height: " + await daemon.getHeight());
    
    // initialize wallet rpc client
    let walletRpc = await connectToWalletRpc({
      uri: "http://localhost:28084",
      username: "rpc_user",
      password: "abc123",
      rejectUnauthorized: false
    });
    await walletRpc.openWallet("test_wallet_1", "supersecretpassword123");
    console.log("RPC wallet mnemonic: " + await walletRpc.getMnemonic());
    
    // create in-memory wallet with mnemonic
    let walletFull = await createWalletFull({
      //path: "./test_wallets/" + GenUtils.getUUID(), // in-memory wallet if not given
      password: "supersecretpassword123",
      serverUsername: "superuser",
      serverPassword: "abctesting123",
      networkType: "testnet",
      serverUri: "http://localhost:28081",
      mnemonic: "silk mocked cucumber lettuce hope adrenalin aching lush roles fuel revamp baptism wrist long tender teardrop midst pastry pigment equip frying inbound pinched ravine frying",
      restoreHeight: 0,
      proxyToWorker: TestUtils.PROXY_TO_WORKER, 
      rejectUnauthorized: false
    });
    await walletFull.sync(new WalletSyncPrinter());
    console.log("Full wallet daemon height: " + await walletFull.getDaemonHeight());
    console.log("Full wallet mnemonic: " + await walletFull.getMnemonic());
    console.log("Wallet balance: " + (await walletFull.getUnlockedBalance()).toString()) 
    await walletFull.close();
  });
});
