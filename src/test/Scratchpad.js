describe("Scratchpad", function() {
  
  it("Can be scripted easily", async function() {
    
    // initialize daemon, wallet, and direct rpc interface
    let daemon = TestUtils.getDaemonRpc();
    let wallet = await TestUtils.getWalletRpc();
    let rpc = new MoneroRpcConnection(TestUtils.WALLET_RPC_CONFIG);
    
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
    let txHash;
    
    // -------------------------------- SCRATCHPAD ----------------------------
    
    let outputs = await wallet.getOutputs(new MoneroOutputQuery().setAccountIndex(0).setSubaddressIndex(1));
    assert(outputs.length > 0);
    for (let output of outputs) {
      assert.equal(output.getAccountIndex(), 0);
      assert.equal(output.getSubaddressIndex(), 1);
    }
  });
});