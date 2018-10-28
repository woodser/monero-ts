"use strict"

const MoneroWalletMM = require("./MoneroWalletMM");
const MoneroRPC = require("../monerojs");
//const WalletHostPollingController = require('../Wallets/Controllers/WalletHostPollingController')

window.BootApp = function() {
  console.log("Booting app...");
	require('../mymonero_core_js/monero_utils/monero_utils').then(function(monero_utils) {
	  console.log("Monero utils loaded");
    let wallet = new MoneroWalletMM(monero_utils);
    console.log("Wallet initialized");
    console.log("Seed: " + wallet.getSeed());
    //console.log("Height: " + wallet.getHeight());
    //console.log("Now what?");
    
//    console.log("Lets call to mymonero server");
//    const self = this
//    let options = { 
//      wallet: self,
//      factorOfIsFetchingStateDidUpdate_fn: function()
//      {
//        self.emit(self.EventName_isFetchingUpdatesChanged())
//      }
//    }
//    let context = self.context
//    self.hostPollingController = new WalletHostPollingController(options, context)
    
    console.log("Lets interact with a daemon");
    new MoneroRPC.daemonRPC({ autoconnect: true, random: true, user: "superuser", pass: "abctesting123" })
    .then(daemon => {
      daemon.getblockcount()
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