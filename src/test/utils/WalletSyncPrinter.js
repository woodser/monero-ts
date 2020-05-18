/**
 * Print sync progress every X blocks.
 */
class WalletSyncPrinter extends MoneroWalletListener {
  
  constructor(syncResolution) {
    super();
    this.lastIncrement = 0;
    this.syncResolution = syncResolution ? syncResolution : .05;
  }
  
  onSyncProgress(height, startHeight, endHeight, percentDone, message) {
    if (percentDone === 1 || percentDone >= this.lastIncrement) {
      console.log("onSyncProgress(" + height + ", " + startHeight + ", " + endHeight + ", " + percentDone + ", " + message + ")");
      this.lastIncrement += this.syncResolution;
    }
  }
}

module.exports = WalletSyncPrinter;