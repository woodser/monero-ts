import TestUtils from "./TestUtils";
import {GenUtils} from "../../../index";

/**
 * Mines regtest blocks on demand or one per block period in the background.
 */
export default class StartMining {

  protected static miner: {stopped: boolean, done: Promise<void>} | undefined;

  static async generateBlocks(numBlocks: number, address = TestUtils.MINING_ADDRESS) {
    if (numBlocks <= 0) return;
    await TestUtils.getDaemonRpcConnection().sendJsonRequest("generateblocks", {wallet_address: address, amount_of_blocks: numBlocks});
  }

  static async mineToHeight(height: number) {
    await StartMining.generateBlocks(height - await (await TestUtils.getDaemonRpc()).getHeight());
  }

  static async startMining() {
    if (StartMining.miner) return;
    let miner = {stopped: false, done: Promise.resolve()};
    miner.done = (async () => {
      while (!miner.stopped) {
        try { await StartMining.generateBlocks(1); }
        catch (e: any) { console.error("Failed to mine block: " + e.message); }
        await GenUtils.waitFor(TestUtils.BLOCK_PERIOD_IN_MS);
      }
    })();
    StartMining.miner = miner;
  }

  static async stopMining() {
    let miner = StartMining.miner;
    if (!miner) return;
    StartMining.miner = undefined;
    miner.stopped = true;
    await miner.done; // a block being mined completes first
  }

  static isMining() {
    return StartMining.miner !== undefined;
  }
}
