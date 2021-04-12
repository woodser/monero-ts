const monerojs = require("../../../index");
const GenUtils = monerojs.GenUtils;
const MoneroUtils = monerojs.MoneroUtils;

/**
 * Tracks wallets which are in sync with the tx pool and therefore whose txs in the pool
 * do not need to be waited on for up-to-date pool information e.g. to create txs.
 * 
 * This is only necessary because txs relayed outside wallets are not fully incorporated
 * into the wallet state until confirmed.
 * 
 * TODO monero-project: sync txs relayed outside wallet so this class is unecessary
 */
class WalletTxTracker {

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
//    if (found) this.clearedWallets.add(sendingWallet);
//  }
  
  /**
   * Waits for transactions in the pool belonging to the given wallets to clear.
   * 
   * @param wallets have transactions to wait on if in the pool
   */
  async waitForWalletTxsToClearPool(wallets) {
    wallets = GenUtils.listify(wallets);
    
    // get wallet tx hashes
    let txHashesWallet = new Set();
    for (let wallet of wallets) {
      if (!this.clearedWallets.has(wallet)) {
        await wallet.sync();
        for (let tx of await wallet.getTxs()) {
          txHashesWallet.add(tx.getHash());
        }
      }
    }
    
    // loop until all wallet txs clear from pool
    let isFirst = true;
    let miningStarted = false;
    const TestUtils = require("./TestUtils"); // to avoid circular reference
    let daemon = await TestUtils.getDaemonRpc();
    while (true) {
      
      // get hashes of relayed, non-failed txs in the pool
      let txHashesPool = new Set();
      for (let tx of await daemon.getTxPool()) {
        if (!tx.isRelayed()) continue;
        else if (tx.isFailed()) await daemon.flushTxPool(tx.getHash());  // flush tx if failed
        else txHashesPool.add(tx.getHash());
      }
      
      // get hashes to wait for as intersection of wallet and pool txs
      let txHashesIntersection = new Set();
      for (let txHashPool of txHashesPool) {
        if (txHashesWallet.has(txHashPool)) txHashesIntersection.add(txHashPool);
      }
      txHashesPool = txHashesIntersection;
      
      // break if no txs to wait for
      if (txHashesPool.size === 0) break;

      // if first time waiting, log message and start mining
      if (isFirst) {
        isFirst = false;
        console.log("Waiting for wallet txs to clear from the pool in order to fully sync and avoid double spend attempts (known issue)");
        let miningStatus = await daemon.getMiningStatus();
        if (!miningStatus.isActive()) {
          try {
            const StartMining = require("./StartMining");
            await StartMining.startMining();
            miningStarted = true;
          } catch (e) {
            console.error("Error starting mining:");
            console.error(e);
          }
        }
      }
      
      // sleep for a moment
      await new Promise(function(resolve) { setTimeout(resolve, TestUtils.SYNC_PERIOD_IN_MS); });
    }
    
    // stop mining if started mining
    if (miningStarted) await daemon.stopMining();
    
    // sync wallets with the pool
    for (let wallet of wallets) {
      await wallet.sync();
      this.clearedWallets.add(wallet);
    }
  }
  
  async waitForUnlockedBalance(wallet, accountIndex, subaddressIndex, minAmount) {
    if (!minAmount) minAmount = new BigInteger("0");
    
    // check if wallet has balance
    if ((await wallet.getBalance(accountIndex, subaddressIndex)).compare(minAmount) < 0) throw new Error("Wallet does not have enough balance to wait for");
    
    // check if wallet has unlocked balance
    let unlockedBalance = await wallet.getUnlockedBalance(accountIndex, subaddressIndex);
    if (unlockedBalance.compare(minAmount) > 0) return unlockedBalance;
   
    // start mining
    const TestUtils = require("./TestUtils"); // to avoid circular reference
    let daemon = await TestUtils.getDaemonRpc();
    let miningStarted = false;
    if (!(await daemon.getMiningStatus()).isActive()) {
      try {
        console.log("Starting mining!");
        const StartMining = require("./StartMining"); // to avoid circular reference
        await StartMining.startMining();
        miningStarted = true;
      } catch (err) {
        console.error("Error starting mining:");
        console.error(e);
      }
    }
    
    // wait for unlocked balance // TODO: promote to MoneroWallet interface?
    console.log("Waiting for unlocked balance");
    while (unlockedBalance.compare(minAmount) < 0) {
      unlockedBalance = await wallet.getUnlockedBalance(accountIndex, subaddressIndex);
      await new Promise(function(resolve) { setTimeout(resolve, TestUtils.SYNC_PERIOD_IN_MS); });
    }
    
    // stop mining if started
    if (miningStarted) await daemon.stopMining();
    return unlockedBalance;
  }
}

module.exports = WalletTxTracker;