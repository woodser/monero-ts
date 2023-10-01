import { MoneroWalletListener } from "../../../index";

/**
 * Print sync progress every X blocks.
 */
export default class WalletSyncPrinter extends MoneroWalletListener {

  nextIncrement: number;
  syncResolution: number;
  
  constructor(syncResolution?: number) {
    super();
    this.nextIncrement = 0;
    this.syncResolution = syncResolution ? syncResolution : .05;
  }
  
  async onSyncProgress(height, startHeight, endHeight, percentDone, message) {
    if (percentDone === 1 || percentDone >= this.nextIncrement) {
      console.log("onSyncProgress(" + height + ", " + startHeight + ", " + endHeight + ", " + percentDone + ", " + message + ")");
      this.nextIncrement += this.syncResolution;
    }
  }
}
