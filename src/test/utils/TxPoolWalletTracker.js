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
    
    // get ids of txs in the pool
    let txIdsPool = new Set();
    for (let tx of await TestUtils.getDaemonRpc().getTxPool()) {
      if (!tx.isRelayed() || tx.isFailed()) continue;
      txIdsPool.add(tx.getId());
    }
    
    // get ids of txs from wallets to wait for
    let txIdsWallet = new Set();
    for (let wallet of wallets) {
      if (!this.clearedWallets.has(wallet)) {
        await wallet.sync();
        for (let tx of await wallet.getTxs()) {
          txIdsWallet.add(tx.getId());
        }
      }
    }
    
    // wait for txs to clear pool
    let txIdsIntersection = new Set();
    for (let txIdPool of txIdsPool) {
      if (txIdsWallet.has(txIdPool)) txIdsIntersection.add(txIdPool);
    }
    await TxPoolWalletTracker.waitForTxsToClearPool(Array.from(txIdsIntersection));
    
    // sync wallets with the pool
    for (let wallet of wallets) {
      await wallet.sync();
      this.clearedWallets.add(wallet);
    }
  }
  
  static async waitForTxsToClearPool(txIds) {
    txIds = GenUtils.listify(txIds);
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
    while (await TxPoolWalletTracker._txsInPool(txIds)) {
      
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
  
  static async _txsInPool(txIds) {
    txIds = GenUtils.listify(txIds);
    let daemon = TestUtils.getDaemonRpc();
    let txsPool = await daemon.getTxPool();
    for (let txPool of txsPool) {
      for (let txId of txIds) {
        if (txId === txPool.getId()) return true;
      }
    }
    return false;
  }
}

module.exports = TxPoolWalletTracker;