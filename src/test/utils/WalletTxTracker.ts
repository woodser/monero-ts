import TestUtils from "./TestUtils"; // to avoid circular reference
import StartMining from "./StartMining";
import {GenUtils,
        MoneroTxQuery,
        MoneroUtils,
        MoneroWallet} from "../../../index";

/**
 * Tracks wallets which are in sync with the tx pool and therefore whose txs in the pool
 * do not need to be waited on for up-to-date pool information e.g. to create txs.
 * 
 * This is only necessary because txs relayed outside wallets are not fully incorporated
 * into the wallet state until confirmed.
 * 
 * TODO monero-project: sync txs relayed outside wallet so this class is unecessary
 */
export default class WalletTxTracker {

  constructor() {
    // nothing to construct
  }

  /**
   * Wait for pending wallet transactions to clear the pool.
   * 
   * @param wallets may have transactions to clear
   */
  async waitForTxsToClearPool(...wallets: MoneroWallet[]) {
    return this.waitForTxsToClear(false, ...wallets);
  }

  /**
   * Wait for pending wallet transasctions to clear from the wallets.
   * 
   * @param wallets may have transactions to clear
   */
  async waitForTxsToClearWallets(...wallets: MoneroWallet[]) {
    return this.waitForTxsToClear(true, ...wallets);
  }

  async waitForTxsToClear(clearFromWallet: boolean, ...wallets: MoneroWallet[]) {

    // loop until pending txs cleared
    let isFirst = true;
    let miningStarted = false;
    let daemon = await TestUtils.getDaemonRpc();
    while (true) {

      // get pending wallet tx hashes
      let txHashesWallet = new Set();
      for (let wallet of wallets) {
        await wallet.sync();
        for (let tx of await wallet.getTxs(new MoneroTxQuery().setInTxPool(true))) {
          if (!tx.getIsRelayed()) continue;
          else if (tx.getIsFailed()) await daemon.flushTxPool(tx.getHash()); // flush tx if failed
          else txHashesWallet.add(tx.getHash());
        }
      }

      // get pending txs to wait for
      let txHashesPool = new Set();
      if (clearFromWallet) {
        for (let txHash of txHashesWallet) txHashesPool.add(txHash);
      } else {
        for (let tx of await daemon.getTxPool()) {
          if (!tx.getIsRelayed()) continue;
          else if (tx.getIsFailed()) await daemon.flushTxPool(tx.getHash()); // flush tx if failed
          else if (txHashesWallet.has(tx.getHash())) txHashesPool.add(tx.getHash());
        }
      }
      
      // break if no txs to wait for
      if (txHashesPool.size === 0) {
        if (miningStarted) await daemon.stopMining(); // stop mining if started mining
        break;
      }

      // log message and start mining if first iteration
      if (isFirst) {
        isFirst = false;
        console.log("Waiting for wallet txs to clear from the pool in order to fully sync and avoid double spend attempts: " + Array.from(txHashesPool).join(", "));
        let miningStatus = await daemon.getMiningStatus();
        if (!miningStatus.getIsActive()) {
          try {
            await StartMining.startMining();
            miningStarted = true;
          } catch (e) {
            console.error("Error starting mining:");
            console.error(e);
          }
        }
      }
      
      // sleep for sync period
      await new Promise(function(resolve) { setTimeout(resolve, TestUtils.SYNC_PERIOD_IN_MS); });
    }
  }
  
  async waitForUnlockedBalance(wallet, accountIndex, subaddressIndex, minAmount) {
    if (!minAmount) minAmount = 0n;
    
    // check if wallet has balance
    if (await wallet.getBalance(accountIndex, subaddressIndex) < minAmount) throw new Error("Wallet does not have enough balance to wait for");
    
    // check if wallet has unlocked balance
    let unlockedBalance = await wallet.getUnlockedBalance(accountIndex, subaddressIndex);
    if (unlockedBalance > minAmount) return unlockedBalance;
   
    // start mining
    //import TestUtils from "./TestUtils"; // to avoid circular reference
    let daemon = await TestUtils.getDaemonRpc();
    let miningStarted = false;
    if (!(await daemon.getMiningStatus()).getIsActive()) {
      try {
        console.log("Starting mining!");
        //import StartMining from "./StartMining"; // to avoid circular reference
        await StartMining.startMining();
        miningStarted = true;
      } catch (err) {
        console.error("Error starting mining:");
        console.error(err);
      }
    }
    
    // wait for unlocked balance // TODO: promote to MoneroWallet interface?
    console.log("Waiting for unlocked balance");
    while (unlockedBalance < minAmount) {
      unlockedBalance = await wallet.getUnlockedBalance(accountIndex, subaddressIndex);
      await new Promise(function(resolve) { setTimeout(resolve, TestUtils.SYNC_PERIOD_IN_MS); });
    }
    
    // stop mining if started
    if (miningStarted) await daemon.stopMining();
    return unlockedBalance;
  }
}
