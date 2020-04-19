describe("Scratchpad", function() {
  
  it("Can be scripted easily", async function() {
    
    // get test wasm wallet
//    let daemon = await TestUtils.getDaemonRpc();
//    let walletRpc = await TestUtils.getWalletRpc();
//    let walletWasm = await TestUtils.getWalletWasm();
    
    // initialize daemon rpc client
    let daemon = await MoneroDaemonRpc.connect({
      uri: "http://localhost:38081",
      username: "superuser",
      password: "abctesting123"
    });
    console.log("Daemon height: " + await daemon.getHeight());
    
    // initialize wallet rpc client
    let walletRpc = await MoneroWalletRpc.connect({
      uri: "http://localhost:38083",
      username: "rpc_user",
      password: "abc123"
    });
    console.log("RPC wallet mnemonic: " + await walletRpc.getMnemonic());
    
    // create in-memory wallet with random mnemonic
    let walletWasm = await MoneroWalletWasm.createWallet({
      //path: "./test_wallets/" + GenUtils.getUUID(), // default to in-memory wallet if not given
      password: "abctesting123",
      networkType: "stagenet",
      server: TestUtils.DAEMON_RPC_CONFIG,
      language: "Spanish"
    });
    console.log("WASM wallet mnemonic: " + await walletWasm.getMnemonic());
    await walletWasm.close();
    
//    // sleep for a moment
//    await new Promise(function(resolve) { setTimeout(resolve, 10000 }); // 10s
    
//    try { await wallet.startMining(8, false, true); }
//    catch (e) { }
    
//    // send test tx
//    console.log("Daemon height: " + await daemon.getHeight());
//    let txSet = await walletWasm.sendTx(0, "54tjXUgQVYNXQCJM4CatRQZMacZ2Awq4NboKiUYtUJrhgYZjiDhMz4ccuYRcMTno6V9mzKFXzfY8pbPnGmu2ukfWABV75k4", (await walletWasm.getUnlockedBalance(0)).divide(2));
//    console.log(txSet);
  });
});