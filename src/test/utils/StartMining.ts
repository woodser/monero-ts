import MoneroDaemonConfig from "../../main/ts/daemon/model/MoneroDaemonConfig";
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

  static async generateBlocks(blocks: number = 15, address: string = "9tsUiG9bwcU7oTbAdBwBk2PzxFtysge5qcEsHEpetmEKgerHQa1fDqH7a4FiquZmms7yM22jdifVAD7jAb2e63GSJMuhY75") {
    const daemon = await TestUtils.getDaemonRpc();
    return await ((daemon as any).config as MoneroDaemonConfig).getServer().sendJsonRequest("generateblocks", {
      amount_of_blocks: blocks,
      wallet_address: address,
      starting_nonce: 1,
    });
  }
}
