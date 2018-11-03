const nettype = require("../mymonero_core_js/cryptonote_utils/nettype");

class MoneroWalletMM {
  
  constructor(daemon, monero_utils) {
    this.monero_utils = monero_utils;
    this.daemon = daemon;
    
    // collect keys
    const keys = this.monero_utils.newly_created_wallet("en", nettype.network_type.MAINNET);
    this.seed = keys.mnemonic_string;
    this.seedLang = keys.mnemonic_language;
    this.seedHex = keys.sec_seed_string;
    this.viewKeyPub = keys.pub_viewKey_string;
    this.viewKeySec = keys.sec_viewKey_string;
    this.spendKeyPub = keys.pub_spendKey_string;
    this.spendKeySec = keys.sec_spendKey_string;
    this.primaryAddress = keys.address_string;
  }
  
  getSeed() {
    return this.seed;
  }
  
  getHeight() {
    throw "getHeight() not implemented";
  }
  
  async sync() {
    
    // get height
    let resp = await this.daemon.get_height();
    
    // fetch block headers
    const NUM_BLOCKS = 10;
    let endHeight = resp.height - 1;
    let startHeight = endHeight - NUM_BLOCKS + 1;
    console.log("Getting blocks from range: [" + startHeight + ", " + endHeight + "]");
    let headersResp = await this.daemon.get_block_headers_range(startHeight, endHeight);
    
    // fetch blocks
    let requests = headersResp.headers.map(header => () => this.daemon.getblock_by_height(header.height));
    let blocks = [];
    for (let request of requests) {
      blocks.push(await request());
    }
    
    // collect transaction hashes
//    let txHashes = blocks.map(block => block.tx_hashes === undefined ? [] : block.tx_hashes).reduce((a, b) => a.concat(b)); // works but bad memory profile
    let txHashes = blocks.map(block => block.tx_hashes === undefined ? [] : block.tx_hashes).reduce((a, b) => { a.push.apply(a, b); return a; }); // works
//    let txHashes = [];
//    for (let block of blocks) {
//      if (block.tx_hashes === undefined) continue;
//      for (let txHash of block.tx_hashes) {
//        txHashes.push(txHash);
//      }
//    }
    console.log(txHashes);
    
    // fetch transactions
    let txResp = await this.daemon.get_transactions(txHashes, true, false);
    console.log(txResp);
    let txs = txResp.txs_as_json.map(txStr => JSON.parse(txStr));
    console.log(txs);
    

    
//    const serial = funcs =>
//      funcs.reduce((promise, func) =>
//          promise.then(result => func().then(Array.prototype.concat.bind(result))), Promise.resolve([]))
//    serial(requests).then(blocks => {
//      console.log(blocks);
//      

//      
//      // fetch transactions
//      console.log(txHashes);
//    });
    
    
//    let blocks = await Promise.all(requests);
//    console.log(blocks);
//    
//    // collect transaction hashes
//    let txHashes = [];
//    for (let block of blocks) {
//      if (block.tx_hashes === undefined) continue;
//      for (let txHash of block.tx_hashes) {
//        txHashes.push(txHash);
//      }
//    }
//    
//    // fetch transactions
//    console.log(txHashes);
    

//    
//    this.daemon.get_height().then(resp => {
//      console.log("Height: " + resp.height);
//      
//      const NUM_BLOCKS = 10;
//      let endHeight = resp.height - 1;
//      let startHeight = endHeight - NUM_BLOCKS + 1;
//      console.log("Getting blocks from range: [" + startHeight + ", " + endHeight + "]");
//      this.daemon.get_block_headers_range(startHeight, endHeight)
//        .then(headersResp => {
//          
//          // fetch blocks
//          let requests = headersResp.headers.map(header => () => this.daemon.getblock_by_height(header.height));
//          console.log(requests);
//          serial(requests).then(blocks => {
//            console.log(blocks);
//            
//            // collect transaction hashes
//            let txHashes = [];
//            for (let block of blocks) {
//              console.log(block);
//              if (block.tx_hashes === undefined) continue;
//              for (let txHash of block.tx_hashes) {
//                txHashes.push(txHash);
//              }
//            }
//            
//            // fetch transactions
//            console.log(txHashes);
//          }).catch(err => {
//            console.log(err);
//          })
//        })
//        .catch(errResp => {
//          console.log("Error get headers range! " + errResp);
//        });
//    });
  }
}

module.exports = MoneroWalletMM;