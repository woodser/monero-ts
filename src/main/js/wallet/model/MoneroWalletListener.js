/**
 * Base class to receive wallet notifications.
 */
class MoneroWalletListener extends MoneroSyncListener {

  onSyncProgress(height, startHeight, endHeight, percentDone, message) { }

  onNewBlock(height) { }

  onOutputReceived(output) { }
  
  onOutputSpent(output) { }
}

module.exports = MoneroWalletListener;