import TestUtils from "./TestUtils";

/**
 * Mines regtest blocks on demand or at random intervals in the background.
 */
export default class StartMining {

  protected static miner: {stopped: boolean, done: Promise<void>, wake: () => void} | undefined;

  static async generateBlocks(numBlocks: number, address = TestUtils.MINING_ADDRESS) {
    if (numBlocks <= 0) return;
    await TestUtils.getDaemonRpcConnection().sendJsonRequest("generateblocks", {wallet_address: address, amount_of_blocks: numBlocks});
  }

  static async mineToHeight(height: number) {
    await StartMining.generateBlocks(height - await (await TestUtils.getDaemonRpc()).getHeight());
  }

  static async startMining() {
    while (StartMining.miner?.stopped) await StartMining.miner.done; // stopped mining finishes first
    if (StartMining.miner) return;
    let miner = {stopped: false, done: Promise.resolve(), wake: (): void => undefined};
    miner.done = (async () => {
      while (!miner.stopped) {
        try { await StartMining.generateBlocks(1); }
        catch (e: any) { console.error("Failed to mine block: " + e.message); }
        if (miner.stopped) break;
        await new Promise<void>((resolve) => { // exponential intervals like mined blocks
          let timeout = setTimeout(resolve, -Math.log(1 - Math.random()) * TestUtils.BLOCK_PERIOD_IN_MS);
          miner.wake = () => { clearTimeout(timeout); resolve(); };
        });
      }
    })();
    StartMining.miner = miner;
  }

  static async stopMining() {
    let miner = StartMining.miner;
    if (!miner) return;
    miner.stopped = true;
    miner.wake(); // skip the wait for the next block
    await miner.done; // a block being mined completes first
    if (StartMining.miner === miner) StartMining.miner = undefined;
  }

  static isMining() {
    return StartMining.miner !== undefined;
  }
}
