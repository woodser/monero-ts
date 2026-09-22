import TestUtils from "./TestUtils";
import {GenUtils} from "../../../index";

/**
 * Utility class to start mining.
 */
export default class StartMining {

  static async mineToHeight(height: number) {
    let daemon = await TestUtils.getDaemonRpc();
    if (await daemon.getHeight() >= height) return;
    let startedMining = false;
    if (!(await daemon.getMiningStatus()).getIsActive()) {
      try {
        await StartMining.startMining();
        startedMining = true;
      } catch (e) { }
    }
    try {
      while (await daemon.getHeight() < height) await GenUtils.waitFor(TestUtils.SYNC_PERIOD_IN_MS);
    } finally {
      if (startedMining) await daemon.stopMining();
    }
  }
  
  static async startMining(numThreads?: number) {
    if (!numThreads) numThreads = 1;
    //TestUtils.getWalletRpc().startMining(numThreads, false, true);
    let daemon = await TestUtils.getDaemonRpc();
    await daemon.startMining("9tsUiG9bwcU7oTbAdBwBk2PzxFtysge5qcEsHEpetmEKgerHQa1fDqH7a4FiquZmms7yM22jdifVAD7jAb2e63GSJMuhY75", numThreads, false, false);  // random subaddress
  }
}
