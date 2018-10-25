"use strict"

const MoneroWalletMM = require("./MoneroWalletMM");

window.BootApp = function() {
  console.log("Booting app...");
	require('../mymonero_core_js/monero_utils/monero_utils').then(function(monero_utils) {
	  console.log("Monero utils loaded");
    let wallet = new MoneroWalletMM(monero_utils);
    console.log("Wallet initialized");
    console.log("Seed: " + wallet.getSeed());
    console.log("Height: " + wallet.getHeight());
    console.log("Now what?");
	});
}
window.BootApp()