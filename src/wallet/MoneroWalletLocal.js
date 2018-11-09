const assert = require("assert");
const MoneroWallet = require("./MoneroWallet");
const MoneroUtils = require("../utils/MoneroUtils");
const nettype = require("../mymonero_core_js/cryptonote_utils/nettype");

/**
 * Implements a Monero wallet using client-side crypto and a daemon.
 */
class MoneroWalletLocal extends MoneroWallet {
  
  /**
   * Constructs the wallet.
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
    startHeight = 197148;
    endHeight = 197148
    
    // fetch blocks
    console.log("Getting blocks from range: [" + startHeight + ", " + endHeight + "]");
    let blocks = await this.daemon.getBlocksByRange(startHeight, endHeight);
    
    // collect transaction hashes
//    let txHashes = blocks.map(block => block.tx_hashes === undefined ? [] : block.tx_hashes).reduce((a, b) => a.concat(b)); // works but bad memory profile
    let txHashes = blocks.map(block => block.getTxHashes()).reduce((a, b) => { a.push.apply(a, b); return a; }); // works
    
    // fetch transactions
    let txs = await this.daemon.getTxs(txHashes, true, false);
    console.log("Fetched " + txs.length + " transactions");
    if (txHashes.length !== txs.length) throw new Error("Missing fetched transactions");
    
    // process transactions
    let numOwned = 0;
    let numUnowned = 0;
    
    //console.log("View key prv: " + this.viewKeyPrv);
    //console.log("Spend key pub: " + this.spendKeyPub);
    
    console.log("Processing transactions...");
    for (let txIdx = 0; txIdx < txHashes.length; txIdx++) {
      let tx = txs[txIdx];
      console.log(tx);
      if (txHashes[txIdx] !== "cb8258a925b63a43f4447fd3c838b0d5b9389d1df1cd4c6e18b0476d2c221c9f") continue;
      
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
      for (let vout of tx.getVout()) {
        
        console.log("Last pub key: " + lastPubKey);
        console.log("Private view key: " + this.viewKeyPrv);
        let derivation = this.coreUtils.generate_key_derivation(lastPubKey, this.viewKeyPrv);
        console.log("Derivation: " + derivation);
        console.log("Out index: " + vout.index);
        console.log("Public spend key: " + this.spendKeyPub);
        let pubKeyDerived = this.coreUtils.derive_public_key(derivation, vout.index, this.spendKeyPub);
        console.log("Pub key derived: " + pubKeyDerived);
        console.log("Output key: " + vout.target.key + "\n\n");
        
        // check if wallet owns output
        if (vout.target.key === pubKeyDerived) {
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
  }
  
  // ------------------------------- PRIVATE STATIC ---------------------------
  
  /**
   * Get Monero Core utils for client-side wallet crypto.
   */
  static async getCoreUtils() {
    return await require('../mymonero_core_js/monero_utils/monero_utils')();
  }
  
  /**
   * Creates a new instance.
   * 
   * @param daemon is the daemon to support the wallet
   * @param mnemonic is a pre-existing seed to import (optional)
   */
  static async newInstance(daemon, mnemonic) {
    let coreUtils = await this.getCoreUtils();
    return new MoneroWalletLocal(daemon, await coreUtils, mnemonic);    
  }
}

module.exports = MoneroWalletLocal;