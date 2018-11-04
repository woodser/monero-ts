"use strict"

const MoneroWalletMM = require("./MoneroWalletMM");
const MoneroRPC = require("../monerojs");
//const WalletHostPollingController = require('../Wallets/Controllers/WalletHostPollingController')

window.BootApp = function() {  
  console.log("Booting app...");
	require('../mymonero_core_js/monero_utils/monero_utils')().then(function(monero_utils) {
	  console.log("Monero utils loaded");
	  console.log(monero_utils);
	  
	  // seed for testing or undefined
	  //let seed = undefined;
	  //let seed = "mohawk veteran buffet siren pencil pause worry aggravate upright chrome aptitude roomy nibs extra oozed irony tonic gusts aplomb nostril update heron reunion sadness chrome";
	  //let primaryAddress = "51sLpF8fWaK11111111111111111111111111111111112N1GuTZeagfRbbKcALdcZev4QXGGuoLh2x36LhaxLSxCZiDpfU";  // just for reference
	  let seed = "nagged giddy virtual bias spying arsenic fowls hexagon oars frying lava dialect copy gasp utensils muffin tattoo ritual exotic inmate kisses either sprig sunken sprig";
	  //let primaryAddress = "59aZULsUF3YNSKGiHz4JPMfjGYkm1S4TB3sPsTr3j85HhXb9crZqGa7jJ8cA87U48kT5wzi2VzGZnN2PKojEwoyaHqtpeZh";  // just for reference
  
    new MoneroRPC.daemonRPC({ hostname: "localhost", port: 38081, user: "superuser", pass: "abctesting123", protocol: "http", network: "stagenet" })
//	  new MoneroRPC.daemonRPC("localhost", 38081, "superuser", "abctesting123", "http", "mainnet")
//    new MoneroRPC.daemonRPC({ autoconnect: true, random: true, user: "superuser", pass: "abctesting123" })
    .then(daemonRPC => {
      console.log("Daemon initialized");
      let wallet = new MoneroWalletMM(daemonRPC, monero_utils, seed);
      console.log(wallet.getSeed());
      console.log(wallet.getPrimaryAddress());
      wallet.sync();
    })
    .catch(err => {
      console.log("Error");
      console.error(err);
    });
	});
}
window.BootApp()