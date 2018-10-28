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
      
      const NUM_BLOCKS = 100;
      daemon.get_height().then(resp => {
        console.log("Height: " + resp.height);
        
        let endHeight = resp.height - 1;
        let startHeight = endHeight - NUM_BLOCKS;
        console.log("Getting blocks from range: [" + startHeight + ", " + endHeight + "]");
        daemon.get_block_headers_range(startHeight, endHeight)
          .then(headersResp => {
            for (let header of headersResp.headers) {
              console.log("Fetching block at height: " + header.height);
              daemon.getblock_by_height(header.height)
                .then(blockResp => {
                  console.log("Downloaded block at height " + header.height);
                  console.log("Blob: " + blockResp.blob);
                })
                .catch(errResp => {
                  console.log("Error fetching block! " + errResp);
                });
            }
          })
          .catch(errResp => {
            console.log("Error get headers range! " + errResp);
          });
      });
      
      
//      daemon.getblockcount()
//      .then(blocks => {
//        console.log(`Block count: ${blocks['count'] - 1}`);
//        
//        
//        
//        daemon.get_block_headers_range()
//        
//      });
    })
    .catch(err => {
      console.error(err);
    });
	});
}
window.BootApp()