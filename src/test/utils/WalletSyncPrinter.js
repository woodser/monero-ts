/**
 * Print sync progress every X blocks.
 */
class WalletSyncPrinter extends MoneroWalletListener {
  
  constructor(syncResolution) {
    super();
    this.syncResolution = syncResolution ? syncResolution : .05;
    this.lastIncrement = 0;
  }
  
  onSyncProgress(height, startHeight, endHeight, percentDone, message) {
    if (percentDone >= this.lastIncrement + this.syncResolution) {
      console.log("onSyncProgress(" + height + ", " + startHeight + ", " + endHeight + ", " + percentDone + ", " + message + ")");
      this.lastIncrement += this.syncResolution;
    }
  }
}

module.exports = WalletSyncPrinter;