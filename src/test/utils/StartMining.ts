import TestUtils from "./TestUtils";

/**
 * Utility class to start mining.
 */
export default class StartMining {
  
  static async startMining(numThreads?: number) {
    if (!numThreads) numThreads = 1;
    //TestUtils.getWalletRpc().startMining(numThreads, false, true);
    let daemon = await TestUtils.getDaemonRpc();
    await daemon.startMining("9tsUiG9bwcU7oTbAdBwBk2PzxFtysge5qcEsHEpetmEKgerHQa1fDqH7a4FiquZmms7yM22jdifVAD7jAb2e63GSJMuhY75", numThreads, false, false);  // random subaddress
  }
}
