"use strict"

const MoneroUtils = require("./utils/MoneroUtils");
const MoneroDaemonRpc = require("./daemon/MoneroDaemonRpc");
const MoneroWalletLocal = require("./wallet/MoneroWalletLocal");

//const WalletHostPollingController = require('../Wallets/Controllers/WalletHostPollingController')

startApp();
async function startApp() {
  console.log("Starting app...");
  
  // create daemon to support wallet
  let daemon = new MoneroDaemonRpc({port: 38081, user: "superuser", pass: "abctesting123", protocol: "http"});
  
  // create wallet with known mnemonic
  let mnemonic = "nagged giddy virtual bias spying arsenic fowls hexagon oars frying lava dialect copy gasp utensils muffin tattoo ritual exotic inmate kisses either sprig sunken sprig";
  let primaryAddress = "59aZULsUF3YNSKGiHz4JPMfjGYkm1S4TB3sPsTr3j85HhXb9crZqGa7jJ8cA87U48kT5wzi2VzGZnN2PKojEwoyaHqtpeZh";  // just for reference
  let wallet = new MoneroWalletLocal({daemon: daemon, mnemonic: mnemonic});
  if (primaryAddress !== await wallet.getPrimaryAddress()) throw "Addresses do not match";
  
  // sync the wallet
  await wallet.sync(null, null, function(progress) {
    //console.log(progress.percent);
  });
}