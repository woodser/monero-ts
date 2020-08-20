/**
 * Default wallet listener which takes no action on notifications.
 */
class MoneroWalletListener {
  
  /**
   * Invoked as the wallet is synchronized.
   * 
   * @param {number} height - height of the synced block 
   * @param {number} startHeight - starting height of the sync request
   * @param {number} endHeight - ending height of the sync request
   * @param {number} percentDone - sync progress as a percentage
   * @param {string} message - human-readable description of the current progress
   */
  onSyncProgress(height, startHeight, endHeight, percentDone, message) { }

  /**
   * Invoked when a new block is added to the chain.
   * 
   * @param {int} height - the height of the block added to the chain
   */
  onNewBlock(height) { }
  
  /**
   * Invoked when the wallet's balances change.
   * 
   * @param {BigInteger} newBalance - new wallet balance
   * @param {BigInteger} newUnlockedBalance - new unlocked wallet balance
   */
  onBalancesChanged(newBalance, newUnlockedBalance) { }

  /**
   * Invoked when the wallet receives an unconfirmed output, when the output is confirmed,
   * and when the output is unlocked.
   * 
   * @param {MoneroOutputWallet} output - the received output
   */
  onOutputReceived(output) { }
  
  /**
   * Invoked when the wallet spends an output.
   * 
   * @param {MoneroOutputWallet} output - the spent output
   */
  onOutputSpent(output) { }
}

module.exports = MoneroWalletListener;