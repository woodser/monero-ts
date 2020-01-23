describe("Scratchpad", function() {
  
  it("Can be scripted easily", async function() {
    
    // initialize daemon, wallet, and direct rpc interface
    let daemon = TestUtils.getDaemonRpc();
    let walletRpc = await TestUtils.getWalletRpc();
    let walletCore = await TestUtils.getWalletCore();
    let rpc = new MoneroRpcConnection(TestUtils.WALLET_RPC_CONFIG);
    
//  try { await wallet.startMining(8, false, true); }
//  catch (e) { }
//  await wallet.stopMining();
//  await daemon.stopMining();
//  await wallet.rescanBlockchain();
//  await wallet.rescanSpent();
//  await daemon.flushTxPool();
    
    // send a transaction to the test wallet
    console.log("Daemon height: " + await daemon.getHeight());
    let txSet = await walletCore.send(0, "54tjXUgQVYNXQCJM4CatRQZMacZ2Awq4NboKiUYtUJrhgYZjiDhMz4ccuYRcMTno6V9mzKFXzfY8pbPnGmu2ukfWABV75k4", (await walletCore.getUnlockedBalance(0)).divide(2));
    console.log(txSet);
    
    // -------------------------------- SCRATCHPAD ----------------------------
    
    let outputs = await walletRpc.getOutputs(new MoneroOutputQuery().setAccountIndex(0).setSubaddressIndex(1));
    assert(outputs.length > 0);
    for (let output of outputs) {
      assert.equal(output.getAccountIndex(), 0);
      assert.equal(output.getSubaddressIndex(), 1);
    }
  });
});