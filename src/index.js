"use strict"

const MoneroUtils = require("./utils/MoneroUtils");
const MoneroDaemonRpc = require("./daemon/MoneroDaemonRpc");
const MoneroWalletLocal = require("./wallet/MoneroWalletLocal");

//const WalletHostPollingController = require('../Wallets/Controllers/WalletHostPollingController')

startApp();
async function startApp() {
  console.log("Starting app...");
  
  // get core utils TODO: if daemon and wallet functions are already async could not do this instead, then again would be nice to have some functions not be async (e.g. getPrimaryAddress())
  let coreUtils = await MoneroUtils.getCoreUtils();
  
  // mnemonic for testing or undefined
  let mnemonic = "nagged giddy virtual bias spying arsenic fowls hexagon oars frying lava dialect copy gasp utensils muffin tattoo ritual exotic inmate kisses either sprig sunken sprig";
  let primaryAddress = "59aZULsUF3YNSKGiHz4JPMfjGYkm1S4TB3sPsTr3j85HhXb9crZqGa7jJ8cA87U48kT5wzi2VzGZnN2PKojEwoyaHqtpeZh";  // just for reference
  
  // daemon
  let daemonRpc = new MoneroDaemonRpc({ port: 38081, user: "superuser", pass: "abctesting123", protocol: "http", coreUtils: coreUtils });
  
  // make wallet with daemon and core utils
  let wallet = new MoneroWalletLocal(daemonRpc, coreUtils, mnemonic); // TODO: {...} config
  if (primaryAddress !== await wallet.getPrimaryAddress()) throw "Addresses do not match";
  wallet.refresh();
}