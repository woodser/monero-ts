import Regtest from "./Regtest";
import TestUtils from "./TestUtils";
import { MoneroWalletRpc } from "../../../index";

/**
 * Utility class to run regtest and monero-wallet-rpc test servers until terminated.
 */
export default class RunBrowserTestServers {

  static async run() {

    // start regtest servers
    await Regtest.start();

    // start monero-wallet-rpc servers
    console.log("Starting monero-wallet-rpc servers...");
    let numProcesses = 10;
    let processPromises: Promise<MoneroWalletRpc>[] = [];
    for (let i = 0; i < numProcesses; i++) {
      processPromises.push(TestUtils.startWalletRpcProcess());
    }
    for (let result of await Promise.allSettled(processPromises)) if (result.status === "rejected") throw result.reason; // every start settles before cleanup on failure
    console.log("Done starting monero-wallet-rpc servers");
  }
}

// run until termination when started directly rather than by RunBrowserTests
if (require.main === module) RunBrowserTestServers.run().catch(async function(err) {
  console.error(err);
  await Regtest.stop();
  process.exit(1);
});
