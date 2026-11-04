import TestUtils from "./utils/TestUtils";
import WalletSyncPrinter from "./utils/WalletSyncPrinter";
import {createWalletFull,
        connectToWalletRpc,
        connectToDaemonRpc,
        GenUtils,
        LibraryUtils,
        MoneroWalletListener} from "../../index";

describe("Scratchpad", function() {

  it("Can be scripted easily", async function() {

    // create directory for test wallets if it doesn't exist
    let fs = await TestUtils.getDefaultFs();
    if (!await LibraryUtils.exists(fs, TestUtils.TEST_WALLETS_DIR)) {
      if (!await LibraryUtils.exists(fs, process.cwd())) await fs.mkdir(process.cwd(), { recursive: true }); // create current process directory for relative paths which does not exist in memory fs
      await fs.mkdir(TestUtils.TEST_WALLETS_DIR, { recursive: true });
    }

//    let daemon = await TestUtils.getDaemonRpc();
//    let walletRpc = await TestUtils.getWalletRpc();
//    let walletFull = await TestUtils.getWalletFull();

  //  // initialize daemon rpc client
  //  let daemon = await connectToDaemonRpc({
  //    uri: "http://localhost:28081",
  //    username: "superuser",
  //    password: "abctesting123",
  //    proxyToWorker: TestUtils.PROXY_TO_WORKER,
  //    rejectUnauthorized: false
  //  });
  //  console.log("Daemon height: " + await daemon.getHeight());

  //  // initialize wallet rpc client
  //  let walletRpc = await connectToWalletRpc({
  //    uri: "http://localhost:28084",
  //    username: "rpc_user",
  //    password: "abc123",
  //    rejectUnauthorized: false
  //  });
  //  await walletRpc.openWallet("test_wallet_1", "supersecretpassword123");
  //  console.log("RPC wallet seed: " + await walletRpc.getSeed());

    // create wallet from seed on regtest
    let walletFull = await createWalletFull({
      path: TestUtils.TEST_WALLETS_DIR + "/" + GenUtils.getUUID(), // in-memory wallet if not given
      password: "abctesting123",
      networkType: TestUtils.NETWORK_TYPE,
      regtest: true,
      server: TestUtils.DAEMON_RPC_CONFIG,
      restoreHeight: TestUtils.FIRST_RECEIVE_HEIGHT,
      seed: TestUtils.SEED
    });
    await walletFull.sync(new class extends MoneroWalletListener {
      async onSyncProgress(height: number, startHeight: number, endHeight: number, percentDone: number, message: string) {
        console.log("Sync progress: " + percentDone * 100 + "%, height: " + height + ", startHeight: " + startHeight + ", endHeight: " + endHeight + ", message: " + message);
      }
    });
    console.log("Full wallet daemon height: " + await walletFull.getDaemonHeight());
    console.log("Full wallet seed: " + await walletFull.getSeed());
    console.log("Wallet balance: " + (await walletFull.getUnlockedBalance()).toString())
    await walletFull.close();
  });
});
