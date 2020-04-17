describe("Scratchpad", function() {
  
  it("Can be scripted easily", async function() {
    
    // initialize daemon, rpc wallet, and wasm wallet
    let daemon = await TestUtils.getDaemonRpc();
    let walletRpc = await TestUtils.getWalletRpc();
    let walletWasm = await TestUtils.getWalletWasm();
    
    // create in-memory wallet
    let myWallet = await MoneroWalletWasm.createWallet({
      password: "abctesting123",
      networkType: "stagenet",
      server: TestUtils.DAEMON_RPC_CONFIG
    });
    await myWallet.close();
    
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