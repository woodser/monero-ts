const assert = require("assert");
const MoneroWallet = require("./MoneroWallet");
const MoneroUtils = require("../utils/MoneroUtils");
const nettype = require("../submodules/mymonero-core-js/cryptonote_utils/nettype");

/**
 * Implements a Monero wallet using client-side crypto and a daemon.
 */
class MoneroWalletLocal extends MoneroWallet {
  
  /**
   * Constructs the wallet.
   * 
   * TODO: needs to take in language
   * 
   * @param daemon is the daemon to support the wallet
   * @param coreUtils provides utils from Monero Core to build a wallet
   * @param mnemonic is a pre-existing seed to import (optional)
   */
  constructor(daemon, coreUtils, mnemonic = null) {
    super();
    this.coreUtils = coreUtils;
    this.daemon = daemon;
    let network = nettype.network_type.STAGENET;  // TODO: determined from daemon
    
    // initialize keys
    let keys;
    if (mnemonic !== undefined) {
      keys = this.coreUtils.seed_and_keys_from_mnemonic(mnemonic, network); // initialize keys from mnemonic
      keys.mnemonic_string = mnemonic;
      keys.mnemonic_language = "en";  // TODO: passed in
    } else {
      keys = this.coreUtils.newly_created_wallet("en", network);  // randomly generate keys
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
  }
  
  getDaemon() {
    return this.daemon;
  }
  
  getCoreUtils() {
    return this.coreUtils;
  }
  
  async getSeed() {
    return this.seed;
  }
  
  async getMnemonic() {
    return this.mnemonic;
  }
  
  async getPrimaryAddress() {
    return this.primaryAddress;
  }
  
  async getHeight() {
    throw "getHeight() not implemented";
  }
  
  async refresh() {
    
//    throw new Error("Not implemented");
    
    // get height
    let height = await this.daemon.getHeight();
    
    // determine heights to fetch
    let numBlocks = 100;
    let numBlocksAgo = 400;
    assert(numBlocks > 0);
    assert(numBlocksAgo >= numBlocks);
    assert(height - numBlocksAgo + numBlocks - 1 < height);
    let startHeight = height - numBlocksAgo;
    let endHeight = height - numBlocksAgo + numBlocks - 1;
    
    // override for known incoming transactions
//    startHeight = 197085;
//    endHeight = startHeight + numBlocks - 1;
    startHeight = 196148;
    endHeight = 198148
    
    // fetch blocks
    console.log("Getting blocks from range: [" + startHeight + ", " + endHeight + "]");
    let blocks = await this.daemon.getBlocksByRange(startHeight, endHeight);
    
    // collect transactions
    let txs = blocks.map(block => block.getTxs()).reduce((a, b) => { a.push.apply(a, b); return a; });
    console.log("Fetched " + txs.length + " transactions");
    
    // fetch transactions by hash
    //let txHashes = blocks.map(block => block.getTxHashes()).reduce((a, b) => { a.push.apply(a, b); return a; }); // works
    //let txs = await this.daemon.getTxs(txHashes, true, false);
    
    // process transactions
    let numOwned = 0;
    let numUnowned = 0;
    
    //console.log("View key prv: " + this.viewKeyPrv);
    //console.log("Spend key pub: " + this.spendKeyPub);
    
    for (let txIdx = 0; txIdx < txs.length; txIdx++) {
      let tx = txs[txIdx];
      if (tx.getId() !== "cb8258a925b63a43f4447fd3c838b0d5b9389d1df1cd4c6e18b0476d2c221c9f") continue;
      
      // get tx pub key
      let lastPubKey;
      try {
        lastPubKey = MoneroUtils.getLastTxPubKey(tx.getExtra());
        //console.log("Last pub key: " + lastPubKey);
      } catch (err) {
        console.log("Could not process nonstandard extra: " + tx.getExtra());
        continue;
      }
      
      // process outputs
      for (let outIdx = 0; outIdx < tx.getVout().length; outIdx++) {
        //console.log("Last pub key: " + lastPubKey);
        //console.log("Private view key: " + this.viewKeyPrv);
        let derivation = this.coreUtils.generate_key_derivation(lastPubKey, this.viewKeyPrv);
        //console.log("Derivation: " + derivation);
        //console.log("Out index: " + outIdx);
        //console.log("Public spend key: " + this.spendKeyPub);
        let pubKeyDerived = this.coreUtils.derive_public_key(derivation, outIdx, this.spendKeyPub);
        //console.log("Pub key derived: " + pubKeyDerived);
        //console.log("Output key: " + tx.getVout()[outIdx].target.key + "\n\n");
        
        // check if wallet owns output
        if (tx.getVout()[outIdx].target.key === pubKeyDerived) {
          console.log("THIS MY OUTPUT!!!");
          numOwned++;
          
          // TODO: determine amount and test
        } else {
          numUnowned++;
        }
      }
    }
    
    console.log("Done processing, " + numOwned + " owned outputs found, " + numUnowned + " unowned");
  }
}

module.exports = MoneroWalletLocal;