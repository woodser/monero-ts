import TestUtils from "./utils/TestUtils";
import WalletSyncPrinter from "./utils/WalletSyncPrinter";
import {createWalletFull,
        connectToWalletRpc,
        connectToDaemonRpc,
        GenUtils,
        MoneroNetworkType,
        MoneroWalletListener} from "../../index";

describe("Scratchpad", function() {

  it("Can be scripted easily", async function() {

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

    // create wallet from seed on mainnet
    let daemon = await connectToDaemonRpc({
      uri: "http://xmr-node.cakewallet.com:18081",
      rejectUnauthorized: false
    });
    let walletFull = await createWalletFull({
      path: "./test_wallets/" + GenUtils.getUUID(), // in-memory wallet if not given
      password: "abctesting123",
      networkType: MoneroNetworkType.MAINNET,
      server: {
        uri: "http://xmr-node.cakewallet.com:18081",
        //proxyUri: "socks5h://127.0.0.1:59787"
      },
      restoreHeight: await daemon.getHeight() - 1000,
      seed: "inbound boldly fuselage jukebox unveil rounded village summon swiftly aside shuffled rising examine friendly goat rockets girth mugged january yesterday went dented amnesty awful unveil"
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
