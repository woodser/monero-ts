"use strict"

const MoneroDaemonRpc = require("./daemon/MoneroDaemonRpc");
const MoneroWalletLocal = require("./wallet/MoneroWalletLocal");

const MoneroRPC = require("./monerojs");
//const WalletHostPollingController = require('../Wallets/Controllers/WalletHostPollingController')

console.log("Booting app...");
require('./mymonero_core_js/monero_utils/monero_utils')().then(function(monero_utils) {
  console.log("Monero utils loaded");
  //console.log(monero_utils);
  
  // mnemonic for testing or undefined
  //let mnemonic = undefined;
  //let mnemonic = "mohawk veteran buffet siren pencil pause worry aggravate upright chrome aptitude roomy nibs extra oozed irony tonic gusts aplomb nostril update heron reunion sadness chrome";
  //let primaryAddress = "51sLpF8fWaK11111111111111111111111111111111112N1GuTZeagfRbbKcALdcZev4QXGGuoLh2x36LhaxLSxCZiDpfU";  // just for reference
  let mnemonic = "nagged giddy virtual bias spying arsenic fowls hexagon oars frying lava dialect copy gasp utensils muffin tattoo ritual exotic inmate kisses either sprig sunken sprig";
  let primaryAddress = "59aZULsUF3YNSKGiHz4JPMfjGYkm1S4TB3sPsTr3j85HhXb9crZqGa7jJ8cA87U48kT5wzi2VzGZnN2PKojEwoyaHqtpeZh";  // just for reference
  
  let daemonRpc = new MoneroDaemonRpc({ port: 38081, user: "superuser", pass: "abctesting123", protocol: "http" });
  let wallet = new MoneroWalletLocal(daemonRpc, monero_utils, mnemonic);
  if (primaryAddress !== wallet.getPrimaryAddress()) throw "Addresses do not match";
  wallet.sync();
})