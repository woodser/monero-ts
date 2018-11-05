const nettype = require("../mymonero_core_js/cryptonote_utils/nettype");
const MoneroUtils = require("./MoneroUtils");

class MoneroWalletMM {
  
  constructor(daemon, monero_utils, mnemonic) {
    this.monero_utils = monero_utils;
    this.daemon = daemon;
    let network = nettype.network_type.STAGENET;  // TODO: determined from daemon
    
    // initialize key
    let keys;
    if (mnemonic !== undefined) {
      keys = this.monero_utils.seed_and_keys_from_mnemonic(mnemonic, network); // initialize keys from mnemonic
      keys.mnemonic_string = mnemonic;
      keys.mnemonic_language = "en";  // TODO: passed in
    } else {
      keys = this.monero_utils.newly_created_wallet("en", network);  // randomly generate keys
    }
    
    // initialize wallet keys
    this.seed = keys.sec_seed_string;
    this.mnemonic = keys.mnemonic_string;
    this.mnemonicLang = keys.mnemonic_language;
    this.viewKeyPub = keys.pub_viewKey_string;
    this.viewKeyPrv = keys.sec_viewKey_string;
    this.spendKeyPub = keys.pub_spendKey_string;
    this.spendKeyPrv = keys.sec_spendKey_string;
    this.primaryAddress = keys.address_string;
    console.log(this);
  }
  
  getSeed() {
    return this.seed;
  }
  
  getMnemonic() {
    return this.mnemonic;
  }
  
  getPrimaryAddress() {
    return this.primaryAddress;
  }
  
  getHeight() {
    throw "getHeight() not implemented";
  }
  
  async sync() {
    
    // get height
    let resp = await this.daemon.get_height();
    
    // fetch block headers
    const NUM_BLOCKS = 100;
    let endHeight = resp.height - 1;
    let startHeight = endHeight - NUM_BLOCKS + 1;
    startHeight = 197085;
    endHeight = startHeight + NUM_BLOCKS;
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
    
    // fetch transactions
    let txResp = await this.daemon.get_transactions(txHashes, true, false);
    let txs = txResp.txs_as_json.map(txStr => JSON.parse(txStr));
    if (txHashes.length !== txs.length) throw new Error("Missing fetched transactions");
    
    // process transactions
    //let decoder = new TextDecoder("utf-8");
    let numOwned = 0;
    let numUnowned = 0;
    
    console.log("View key prv: " + this.viewKeyPrv);
    console.log("Spend key pub: " + this.spendKeyPub);
    
    console.log("Processing transactions...");
    for (let txIdx = 0; txIdx < txHashes.length; txIdx++) {
      let tx = txs[txIdx];
      if (txHashes[txIdx] !== "cb8258a925b63a43f4447fd3c838b0d5b9389d1df1cd4c6e18b0476d2c221c9f") continue;
      
      console.log("Tx hash: " + txHashes[txIdx]);
      console.log(tx);
      
      // get tx pub key
      let lastPubKey;
      try {
        lastPubKey = MoneroUtils.getLastTxPubKey(tx.extra);
        console.log("Last pub key: " + lastPubKey);
      } catch (err) {
        console.log("Could not process nonstandard extra: " + tx.extra);
        continue;
      }
      
      // process outputs
      for (let idx = 0; idx < tx.vout.length; idx++) {
        let out = tx.vout[idx];
        //let pubKey = out.target.key;
        

//        console.log("Amount: " + amount);
        console.log("Index: " + idx);
        
        let derivation = this.monero_utils.generate_key_derivation(lastPubKey, this.viewKeyPrv);
        console.log("Derivation: " + derivation);
        
        let pubKeyDerived = this.monero_utils.derive_public_key(derivation, idx, this.spendKeyPub);
        console.log("Pub key derived: " + pubKeyDerived);
        
        // check if wallet owns output
        if (lastPubKey === pubKeyDerived) {
          console.log("This my output!!!");
          numOwned++;
          console.log(out);
          
          // TODO: determine amount and test
        } else {
          numUnowned++;
        }
      }
    }
    
    console.log("Done processing, " + numOwned + " owned outputs found, " + numUnowned + " unowned");
    

    
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