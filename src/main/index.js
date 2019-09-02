"use strict"

const MoneroDaemonRpc = require("./daemon/MoneroDaemonRpc");
const MoneroWalletRpc = require("./wallet/MoneroWalletRpc");
const MoneroWalletLocal = require("./wallet/MoneroWalletLocal");

startApp();
async function startApp() {
  console.log("Starting app...");
  
  // create daemon to support wallet
  let daemon = new MoneroDaemonRpc({uri: "http://localhost:38081", user: "superuser", pass: "abctesting123"});
  console.log("Daemon height: " + await daemon.getHeight());
  
  let walletRpc = new MoneroWalletRpc({
    uri: "http://localhost:38083",
    user: "rpc_user",
    pass: "abc123"
  });
  console.log("Wallet rpc mnemonic: " + await walletRpc.getMnemonic());
  console.log("Wallet rpc balance: " + await walletRpc.getBalance());
  
  // create wallet with known mnemonic
  let mnemonic = "nagged giddy virtual bias spying arsenic fowls hexagon oars frying lava dialect copy gasp utensils muffin tattoo ritual exotic inmate kisses either sprig sunken sprig";
  let primaryAddress = "59aZULsUF3YNSKGiHz4JPMfjGYkm1S4TB3sPsTr3j85HhXb9crZqGa7jJ8cA87U48kT5wzi2VzGZnN2PKojEwoyaHqtpeZh";  // just for reference
  let walletLocal = new MoneroWalletLocal({daemon: daemon, mnemonic: mnemonic});
  console.log("Local wallet address: " + await walletLocal.getPrimaryAddress());
  console.log("Local wallet height: " + await walletLocal.getHeight());
  if (primaryAddress !== await walletLocal.getPrimaryAddress()) throw "Addresses do not match";
  
  // sync the wallet
//  await wallet.sync(undefined, function(progress) {
//    console.log(progress.percent);
//  });
//  console.log("Done syncing?");
  console.log("Done");
}