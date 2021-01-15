const TestUtils = require("./TestUtils");

/**
 * Utility class to run monero-wallet-rpc test servers until terminated.
 */
class RunWalletRpcTestServers {
  
  static async run() {
    
    // start monero-wallet-rpc servers
    console.log("Starting monero-wallet-rpc servers...");
    let numProcesses = 10;
    let processPromises = [];
    for (let i = 0; i < numProcesses; i++) {
      processPromises.push(TestUtils.startWalletRpcProcess());
    }
    let wallets = await Promise.all(processPromises);
    console.log("Done starting monero-wallet-rpc servers");
    
    // close wallets and servers on ctrl+c
    process.on("SIGINT", async function() {
      console.log("Stopping monero-wallet-rpc servers...");
      for (let wallet of wallets) await TestUtils.stopWalletRpcProcess(wallet);
      console.log("Stopped monero-wallet-rpc servers");
      process.exit(0);
    });
  }
}

// run until termination
RunWalletRpcTestServers.run();

module.exports = RunWalletRpcTestServers;