/**
 * Base class to receive wallet notifications.
 * 
 * @extends {MoneroSyncListener}
 */
class MoneroWalletListener extends MoneroSyncListener {

  onSyncProgress(height, startHeight, endHeight, percentDone, message) { }

  onNewBlock(height) { }

  onOutputReceived(output) { }
  
  onOutputSpent(output) { }
}

module.exports = MoneroWalletListener;