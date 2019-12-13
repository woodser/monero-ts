/**
 * Tracks wallets which are in sync with the tx pool and therefore whose txs in the pool
 * do not need to be waited on for up-to-date pool information e.g. to create txs.
 * 
 * This is only necessary because txs relayed outside wallets are not fully incorporated
 * into the wallet state until confirmed.
 * 
 * TODO monero core: sync txs relayed outside wallet so this class is unecessary
 */
class TxPoolWalletTracker {

  constructor() {
    this.clearedWallets = new Set();
  }
  
  reset() {
    this.clearedWallets.clear();
  }
  
//  /**
//   * Reset the tracker such that all wallets except the given sending wallet will
//   * need to wait for pool txs to confirm in order to reliably sync.
//   * 
//   * @param sendingWallet is the wallet which sent the tx and therefore should not cause txs to be waited on
//   */
//  resetExcept(sendingWallet) {
//    let found = this.clearedWallets.has(sendingWallet);
//    this.clearedWallets.clear();
//    if (found) clearedWallets.add(sendingWallet);
//  }
  
  async waitForWalletTxsToClearPool(wallets) {
    wallets = GenUtils.listify(wallets);
    
    // get hashes of txs in the pool
    let txHashesPool = new Set();
    for (let tx of await TestUtils.getDaemonRpc().getTxPool()) {
      if (!tx.isRelayed() || tx.isFailed()) continue;
      txHashesPool.add(tx.getHash());
    }
    
    // get hashes of txs from wallets to wait for
    let txHashesWallet = new Set();
    for (let wallet of wallets) {
      if (!this.clearedWallets.has(wallet)) {
        await wallet.sync();
        for (let tx of await wallet.getTxs()) {
          txHashesWallet.add(tx.getHash());
        }
      }
    }
    
    // wait for txs to clear pool
    let txHashesIntersection = new Set();
    for (let txHashPool of txHashesPool) {
      if (txHashesWallet.has(txHashPool)) txHashesIntersection.add(txHashPool);
    }
    await TxPoolWalletTracker.waitForTxsToClearPool(Array.from(txHashesIntersection));
    
    // sync wallets with the pool
    for (let wallet of wallets) {
      await wallet.sync();
      this.clearedWallets.add(wallet);
    }
  }
  
  static async waitForTxsToClearPool(txHashes) {
    txHashes = GenUtils.listify(txHashes);
    let daemon = TestUtils.getDaemonRpc(); 
      
    // attempt to start mining to push the network along
    let startedMining = false;
    let miningStatus = await daemon.getMiningStatus();
    if (!miningStatus.isActive()) {
      try {
        await StartMining.startMining();
        startedMining = true;
      } catch (e) { } // no problem
    }
    
    // loop until txs are not in pool
    let isFirst = true;
    while (await TxPoolWalletTracker._txsInPool(txHashes)) {
      
      // print debug messsage one time
      if (isFirst) {  
        console.log("Waiting for wallet txs to clear from the pool in order to fully sync and avoid double spend attempts (known issue)");
        isFirst = false;
      }
      
      // sleep for a moment
      await new Promise(function(resolve) { setTimeout(resolve, MoneroUtils.WALLET_REFRESH_RATE); });
    }
    
    // stop mining at end of test
    if (startedMining) await daemon.stopMining();
  }
  
  static async _txsInPool(txHashes) {
    txHashes = GenUtils.listify(txHashes);
    let daemon = TestUtils.getDaemonRpc();
    let txsPool = await daemon.getTxPool();
    for (let txPool of txsPool) {
      for (let txHash of txHashes) {
        if (txHash === txPool.getHash()) return true;
      }
    }
    return false;
  }
}

module.exports = TxPoolWalletTracker;