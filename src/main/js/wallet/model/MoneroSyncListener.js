/**
 * Base class to receive progress notifications as a wallet is synchronized.
 */
class MoneroSyncListener {

  /**
   * Invoked as the wallet is synchronized.
   * 
   * @param {number} height is the height of the synced block 
   * @param {number} startHeight is the starting height of the sync request
   * @param {number} endHeight is the ending height of the sync request
   * @param {number} percentDone is the sync progress as a percentage
   * @param {string} message is a human-readable description of the current progress
   */
  onSyncProgress(height, startHeight, endHeight, percentDone, message) { }
}

module.exports = MoneroSyncListener;