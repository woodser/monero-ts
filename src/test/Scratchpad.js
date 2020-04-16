describe("Scratchpad", function() {
  
  it("Can be scripted easily", async function() {
    
    // initialize daemon, wallet, and direct rpc interface
    let daemon = await TestUtils.getDaemonRpc();
    let walletRpc = await TestUtils.getWalletRpc();
    let walletCore = await TestUtils.getWalletWasm();
    
//    // create a wallet
//    let myWallet = await MoneroWalletWasm.createWallet({
//      path: "./test_wallets/" + GenUtils.getUUID(),
//      password: "abctesting123",
//      networkType: "stagenet",
//      server: TestUtils.DAEMON_RPC_CONFIG
//    });
    
//  try { await wallet.startMining(8, false, true); }
//  catch (e) { }
//  await wallet.stopMining();
//  await daemon.stopMining();
//  await wallet.rescanBlockchain();
//  await wallet.rescanSpent();
//  await daemon.flushTxPool();
    
//    // send a transaction to the test wallet
//    console.log("Daemon height: " + await daemon.getHeight());
//    let txSet = await walletCore.sendTx(0, "54tjXUgQVYNXQCJM4CatRQZMacZ2Awq4NboKiUYtUJrhgYZjiDhMz4ccuYRcMTno6V9mzKFXzfY8pbPnGmu2ukfWABV75k4", (await walletCore.getUnlockedBalance(0)).divide(2));
//    console.log(txSet);
    
//    for (let account of await walletCore.getAccounts(true)) {
//      for (let subaddress of account.getSubaddresses()) {
//        let outputs = await walletCore.getOutputs(new MoneroOutputQuery().setAccountIndex(subaddress.getAccountIndex()).setSubaddressIndex(subaddress.getIndex()).setIsLocked(false));
//        for (let output of outputs) {
//          assert(!output.isLocked());
//        }
//        console.log("[" + subaddress.getAccountIndex() + ", " + subaddress.getIndex() + "]: " + outputs.length);
//      }
//    }
    
//    let outputs = await walletRpc.getOutputs(new MoneroOutputQuery().setAccountIndex(0).setSubaddressIndex(1).setIsLocked(false));
//    assert(outputs.length > 0);
//    for (let output of outputs) {
//      assert.equal(output.getAccountIndex(), 0);
//      assert.equal(output.getSubaddressIndex(), 1);
//      console.log(output.getAmount().toString());
//    }
  });
});