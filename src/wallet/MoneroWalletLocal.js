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
   * TODO: needs to take in language, change config to {...}
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
    this.pubViewKey = keys.pub_viewKey_string;
    this.prvViewKey = keys.sec_viewKey_string;
    this.pubSpendKey = keys.pub_spendKey_string;
    this.prvSpendKey = keys.sec_spendKey_string;
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
  
  async getMnemonicLanguage() {
    return this.mnemonicLang;
  }
  
  async getPublicViewKey() {
    return this.pubViewKey;
  }
  
  async getPrivateViewKey() {
    return this.prvViewKey;
  }
  
  async getPublicSpendKey() {
    return this.pubSpendKey;
  }
  
  async getPrivateSpendKey() {
    return this.prvSpendKey;
  }
  
  async getPrimaryAddress() {
    return this.primaryAddress;
  }
  
  async getHeight() {
    throw "getHeight() not implemented";
  }
  
  async refresh() {
    
    // TODO: only process blocks that contain transactions
    // TODO: make next network request while processing blocks
    
    let maxSize = 3000000;
    let startHeight = 0;
    //let startHeight = 125982;  // TODO: auto figure out // TODO: doesn't work with how headers are passed in and processed currently
    
    // get total height
    let totalHeight = await this.daemon.getHeight();
    
    // get all headers
    console.log("Fetching headers...");
    let headers = await this.daemon.getBlockHeadersByRange(startHeight, totalHeight - 1); // TODO: fetch in chunks if needed
    console.log("Done.");
    
    let totalSize = 0;
    let totalTxs = 0;
    for (let header of headers) {
      totalSize += header.getBlockSize();
      totalTxs += header.getNumTxs();
    }
    console.log("Total size: " + totalSize);
    console.log("Total txs: " + totalTxs);
    
    // get blocks in fixed size chunks
    let curHeight = startHeight;
    let endHeight = null;
    let processedSize = 0;
    let numProcessedBlocks = 0;
    let numProcessedTxs = 0;
    while (curHeight < totalHeight) {
      endHeight = await this._getEndHeight(curHeight, totalHeight, maxSize, headers);
//      if (curHeight === endHeight) {
//        console.log("curHeight === endHeight === " + curHeight);
//        break;
//      }
      console.log("Fetching blocks [" + curHeight + ", " + endHeight + "]")
      let blocks = await this.daemon.getBlocksByRange(curHeight, endHeight);
      let numTxs = 0;
      for (let block of blocks) {
        numTxs += block.getTxs().length;
        this._processBlock(block);
        processedSize += headers[numProcessedBlocks].getBlockSize();
        numProcessedTxs += headers[numProcessedBlocks].getNumTxs();
        numProcessedBlocks++;
      }
      console.log(endHeight + " (" + (endHeight / totalHeight * 100) + "%) OR (" + (processedSize / totalSize) + "%) OR (" + (numProcessedTxs / totalTxs) + "%) " + numTxs + " transactions");
      curHeight = endHeight + 1;
    }
    
//    // iterate to fetch blocks in chunks
//    let startHeight = 190000;
//    let numBlocksPerRequest = 1000;
//    for (let curHeight = startHeight; curHeight < height; curHeight += numBlocksPerRequest) {
//      let blocks = await this.daemon.getBlocksByRange(curHeight, curHeight + numBlocksPerRequest);
//      let numTxs = 0;
//      for (let block of blocks) {
//        numTxs += block.getTxs().length;
//        this._processBlock(block);
//      }
//      console.log(curHeight + " (" + ((curHeight + numBlocksPerRequest) / height * 100) + "%) " + numTxs + " transactions");
//    }
    
//    // determine heights to fetch
//    let numBlocks = 100;
//    let numBlocksAgo = 400;
//    assert(numBlocks > 0);
//    assert(numBlocksAgo >= numBlocks);
//    assert(height - numBlocksAgo + numBlocks - 1 < height);
//    let startHeight = height - numBlocksAgo;
//    let endHeight = height - numBlocksAgo + numBlocks - 1;
    
    // override for known incoming transactions
//    startHeight = 197085;
//    endHeight = startHeight + numBlocks - 1;
//    startHeight = 196148;
//    endHeight = 198148
    
    // fetch blocks
//    console.log("Getting blocks from range: [" + startHeight + ", " + endHeight + "]");
//    let blocks = await this.daemon.getBlocksByRange(startHeight, endHeight);
    
//    for (let block of blocks) {
//      if (block.getTxs().length) {
//        console.log(block);
//      }
//    }
    
//    // process each block
//    for (let block of blocks) {
//      this._processBlock(block);
//    }
  }
  
  // -------------------------------- PRIVATE ---------------------------------
  
  /**
   * Gets the height of the block where the total size of blocks between it and
   * the given start block is up to but no more than the given maximum size.
   * 
   * @param startHeight is the starting height to compute total block size from
   * @param chainHeight is the current chain height to not be exceeded
   * @param headers are headers to inform block retrieval size
   * @param maxSize is the maximum size of all blocks between the start and end blocks
   * @return the height of the block where the total size of all blocks between the
   *         start and end is up to but no more than the given maximum size
   */
  async _getEndHeight(startHeight, chainHeight, maxSize, headers) {
    let totalSize = 0;
    for (let headerIdx = startHeight; headerIdx < headers.length; headerIdx++) {
      let header = headers[headerIdx];
      if (header.getBlockSize() > maxSize) throw new Error("Block is too big to process: " + header.getBlockSize());
      if (headerIdx < headers.length - 1 && totalSize + headers[headerIdx + 1].getBlockSize() > maxSize) return header.getHeight();
      totalSize += header.getBlockSize();
    }
    return headers[headers.length - 1].getHeight();
  }
  
  /**
   * Processes a single block.
   */
  _processBlock(block) {
    //console.log("Processing block...");
    //console.log(block);
    ///console.log("Block contains " + block.getTxs().length + " transactions");
    
    //if (block.getTxs().length) console.log("Block contains " + block.getTxs().length + " txs");
    
    // fetch transactions by hash
    //let txHashes = blocks.map(block => block.getTxHashes()).reduce((a, b) => { a.push.apply(a, b); return a; }); // works
    //let txs = await this.daemon.getTxs(txHashes, true, false);
    
    // process transactions
    let numOwned = 0;
    let numUnowned = 0;
    
    //console.log("View key prv: " + this.prvViewKey);
    //console.log("Spend key pub: " + this.pubSpendKey);
    
    for (let txIdx = 0; txIdx < block.getTxs().length; txIdx++) {
      let tx = block.getTxs()[txIdx];
      //if (tx.getId() !== "cb8258a925b63a43f4447fd3c838b0d5b9389d1df1cd4c6e18b0476d2c221c9f") continue;
      
      // get tx pub key
      let lastPubKey;
      try {
        lastPubKey = MoneroUtils.getLastTxPubKey(tx.getExtra());
        //console.log("Last pub key: " + lastPubKey);
      } catch (err) {
        //console.log("Could not process nonstandard extra: " + tx.getExtra());
        continue;
      }
      
      // process outputs
      for (let outIdx = 0; outIdx < tx.getVout().length; outIdx++) {
        //console.log("Last pub key: " + lastPubKey);
        //console.log("Private view key: " + this.prvViewKey);
        let derivation = this.coreUtils.generate_key_derivation(lastPubKey, this.prvViewKey);
        //console.log("Derivation: " + derivation);
        //console.log("Out index: " + outIdx);
        //console.log("Public spend key: " + this.pubSpendKey);
        let pubKeyDerived = this.coreUtils.derive_public_key(derivation, outIdx, this.pubSpendKey);
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
    
    //console.log("Done processing, " + numOwned + " owned outputs found, " + numUnowned + " unowned");
  }
}

module.exports = MoneroWalletLocal;