"use strict"

const MoneroWalletMM = require("./MoneroWalletMM");
const MoneroRPC = require("../monerojs");
//const WalletHostPollingController = require('../Wallets/Controllers/WalletHostPollingController')

window.BootApp = function() {  
  console.log("Booting app...");
	require('../mymonero_core_js/monero_utils/monero_utils').then(function(monero_utils) {
	  console.log("Monero utils loaded");
	  console.log(monero_utils);
	  
    new MoneroRPC.daemonRPC({ autoconnect: true, random: true, user: "superuser", pass: "abctesting123" })
    .then(daemonRPC => {
      let wallet = new MoneroWalletMM(daemonRPC, monero_utils);
      wallet.sync();
    })
    .catch(err => {
      console.error(err);;
    });
	});
}
window.BootApp()