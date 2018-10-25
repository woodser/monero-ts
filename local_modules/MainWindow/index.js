"use strict"

const MoneroWalletMM = require("./MoneroWalletMM");
const MoneroRPC = require("../monerojs");


window.BootApp = function() {
  console.log("Booting app...");
	require('../mymonero_core_js/monero_utils/monero_utils').then(function(monero_utils) {
	  console.log("Monero utils loaded");
    let wallet = new MoneroWalletMM(monero_utils);
    console.log("Wallet initialized");
    console.log("Seed: " + wallet.getSeed());
    //console.log("Height: " + wallet.getHeight());
    //console.log("Now what?");
    
    console.log("Lets interact with a daemon");
    const daemonRPC = new MoneroRPC.daemonRPC({ autoconnect: true, random: true })
    .then(daemon => {
      daemonRPC = daemon; // Store daemon interface in global variable
      
      daemonRPC.getblockcount()
      .then(blocks => {
        console.log(`Block count: ${blocks['count'] - 1}`);
      });
    })
    .catch(err => {
      console.error(err);
    });
	});
}
window.BootApp()