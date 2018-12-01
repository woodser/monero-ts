const assert = require("assert");
const MoneroWallet = require("./MoneroWallet");
const MoneroUtils = require("../utils/MoneroUtils");
const MoneroDaemon = require("../daemon/MoneroDaemon");
const IndexMarker = require("../utils/IndexMarker");

/**
 * Implements a Monero wallet using client-side crypto and a given daemon.
 */
class MoneroWalletLocal extends MoneroWallet {
  
  /**
   * Constructs the wallet.
   * 
   * @param config.daemon is the daemon to support the wallet (required)
   * @param config.mnemonic is a mnemonic phrase to import or generates new one if not given (optional)
   * @param config.mnemonicLanguage specifies the mnemonic phrase language (defaults to "en" for english)
   * @param config.store is an existing wallet store to import (optional)
   * @param config.startHeight is the start height to scan the wallet from (defaults to 0)
   * @param config.requestsPerSecond throttles maximum rate of daemon requests (defaults to 50 rps)
   * @param config.numHeadersPerRequest specifies the number of headers to fetch when populating the header cache (defaults to 750)
   * @param config.maxReqSize specifies maximum total block size per blocks request (defaults to 4000000)
   * @param config.maxConcurrency specifies maximum concurrency for block requests; maximum memory = this * maxReqSize (defaults to 5)
   * @param config.skipMinerTxs skips processing miner txs to speed up scan time (defaults to false)
   */
  constructor(config) {
    super();
    
    // verify given config
    assert(config && config.daemon, "Must specify config.daemon");
    assert(config.daemon instanceof MoneroDaemon, "config.daemon be an instance of MoneroDaemon");
    assert(config.mnemonic === undefined || config.store === undefined, "May specify config.mnemonic or config.store but not both");
    if (config.mnemonic) assert(config.mnemonicLanguage === undefined || config.mnemonicLanguage === "en", "Mnemonic language must be english if phrase specified");  // TODO: avoid this?
    
    // merge given config with default
    this.config = Object.assign({}, MoneroWalletLocal.DEFAULT_CONFIG, config);
    
    // start one time initialization but do not wait
    this.initPromise = this._initOneTime();
  }
  
  getDaemon() {
    return this.config.daemon;
  }
  
  async getCoreUtils() {
    await this._initOneTime();
    return this.cache.coreUtils;
  }
  
  async getSeed() {
    await this._initOneTime();
    return this.store.seed;
  }
  
  async getMnemonic() {
    await this._initOneTime();
    return this.cache.mnemonic;
  }
  
  async getMnemonicLanguage() {
    await this._initOneTime();
    return this.cache.mnemonicLanguage;
  }
  
  async getPublicViewKey() {
    await this._initOneTime();
    return this.cache.pubViewKey;
  }
  
  async getPrivateViewKey() {
    await this._initOneTime();
    return this.cache.prvViewKey;
  }
  
  async getPublicSpendKey() {
    await this._initOneTime();
    return this.cache.pubSpendKey;
  }
  
  async getPrivateSpendKey() {
    await this._initOneTime();
    return this.cache.prvSpendKey;
  }
  
  async getPrimaryAddress() {
    await this._initOneTime();
    return this.cache.primaryAddress;
  }
  
  async getHeight() {
    await this._initOneTime();
    //return this.cache.processedMarker.getFirst
    throw new Error("getHeight() not implemented");
  }
  
  // TODO: only allow one refresh at a time
  async refresh() {
    await this._initOneTime();
    
    // initialize header cache
    delete this.cache.headers;
    this.cache.headers = {};
    
    // cache latest info to track progress
    let info = await this.config.daemon.getInfo();
    this.cache.chainHeight = info.getHeight();
    this.cache.numTxs = info.getTxCount();
    
    //console.log("PROCESSING BLOCKS [" + this.store.startHeight + ", " + (this.cache.chainHeight - 1) + "] WITH " + this.cache.numTxs + " NON-MINER TXS");
    
    // copy and invert processed blocks to track unprocessed blocks
    this.cache.unprocessedMarker = this.cache.processedMarker.copy().invert();
    
    // loop while there are unprocessed blocks
    while (this._hasUnprocessedBlocks()) {
      await this._processBlocksChunk();
    }
    
    throw new Error("Done processing!");
  }
  
  // -------------------------------- PRIVATE ---------------------------------
  
  /**
   * Performs one time initialization prior to executing wallet methods.
   * 
   * @returns Promise is a singleton promise that resolves after initializing
   */
  async _initOneTime() {
    
    // return singleton promise if already initialized
    if (this.initPromise) return this.initPromise;
    
    // initialize working cache
    this.cache = {};
    this.cache.coreUtils = await MoneroUtils.getCoreUtils();
    this.cache.network = (await this.config.daemon.getInfo()).getNetworkType();
    this.cache.processing = {};
    
    // initialize new store
    if (this.store === undefined) {
      this.store = {};
      this.store.version = "0.0.1";
      
      // initialize keys from core utils
      let keys;
      if (this.config.mnemonic === undefined) {
        keys = this.config.coreUtils.newly_created_wallet(this.config.mnemonicLanguage, this.cache.network);  // randomly generate keys
      } else {
        keys = this.cache.coreUtils.seed_and_keys_from_mnemonic(this.config.mnemonic, this.cache.network);    // initialize keys from mnemonic
        keys.mnemonic_string = this.config.mnemonic;
        keys.mnemonic_language = this.config.mnemonicLanguage
      }
      
      // save keys
      this.store.seed = keys.sec_seed_string; // only the seed goes in the store to be persisted
      this.cache.mnemonic = keys.mnemonic_string;
      this.cache.mnemonicLanguage = keys.mnemonic_language;
      this.cache.pubViewKey = keys.pub_viewKey_string;
      this.cache.prvViewKey = keys.sec_viewKey_string;
      this.cache.pubSpendKey = keys.pub_spendKey_string;
      this.cache.prvSpendKey = keys.sec_spendKey_string;
      this.cache.primaryAddress = keys.address_string;
      
      // track processed blocks using index marker whose state is stored
      this.cache.processedMarker = new IndexMarker();
      this.store.processed = this.cache.processedMarker.getState();
    }
    
    // otherwise import existing store
    else {
      throw new Error("Importing wallet store not supported");
    }
  }
  
  /**
   * Retrieves a header from the cache or fetches and caches a header range if not in the cache.
   * 
   * @param height is the height of the header to retrieve from the cache
   * @param maxHeight is the maximum header height to fetch
   */
  async _getCachedHeader(height, maxHeight) {
    
    // get header from cache
    let cachedHeader = this.cache.headers[height];
    if (cachedHeader) return cachedHeader;
    
    // fetch and cache headers if not in cache
    const NUM_HEADERS_PER_REQUEST = 1000;
    let endHeight = Math.min(maxHeight, height + NUM_HEADERS_PER_REQUEST - 1);
    let headers = await this.config.daemon.getBlockHeadersByRange(height, endHeight);
    for (let header of headers) {
      this.cache.headers[header.getHeight()] = {
          blockSize: header.getBlockSize(),
          numTxs: header.getNumTxs()
      }
    }
    
    // return the cached header
    return this.cache.headers[height];
  }
  
  _hasUnprocessedBlocks() {
    return this.cache.unprocessedMarker.isMarked(0, this.cache.chainHeight - 1) !== false; // has unprocessed if any true
  }
  
//  _getNextUnprocessedHeader() {
//    
////    
////    for (let i = 0; i < this.cache.chainHeight; i++) {
////      let idx = GenUtils.getFirstBit(this.store.processed, 0, this.cache.chainHeight, false);
////    }
////    
////    
////    let GenUtils.getFirstBit(this.store.processed, 0, this.cache.chainHeight, false);
////    
//    
//    
//    throw new Error("Not implemented");
//  }
  
  /**
   * Processes a chunk of unprocessed blocks.
   * 
   * @param daemon is the daemon to query
   */
  async _processBlocksChunk(daemon) {
    
    console.log("Processing chunk");
    
    // collect block indices to fetch
    let reqSize = 0;
    let blockIndices = 0;
    let unprocessedHeader = null;
    console.log(this.config);
    while (reqSize < this.config.maxReqSize && (unprocessedHeader = this._getNextUnprocessedHeader()) ) {
      console.log("loop");

      console.log("Ok we we have an unprocessed header");
      consolelog(unprocessedHeader);
    }
    
    console.log("dne");
    
    
    
    
    
    
    throw new Error("Not implemented");
  }
  
  async _processBlockChunks(startHeight, maxHeight, maxReqSize, maxRecursion) {
    
    // configuration TODO
    const SKIP_MINER_TX = true;  // optimizes block processing to skip miner txs or blocks containing no non-miner txs
    
    // determine block indices to fetch up to max request size
    let reqSize = 0;
    let blockIndices = [];
    let height = startHeight;
    while (height <= maxHeight) {
      if (SKIP_MINER_TX) {
        height = await this._getFirstTxHeight(height, maxHeight);
        if (height === null) break;
      }
      let cachedHeader = await this._getCachedHeader(height, maxHeight);
      assert(cachedHeader.blockSize <= maxReqSize, "Block " + height + " is too big to process: " + cachedHeader.blockSize);
      if (reqSize + cachedHeader.blockSize > maxReqSize) break;
      blockIndices.push(height);
      reqSize += cachedHeader.blockSize;
      height++;
    }
    
    // done if no blocks to fetch
    if (blockIndices.length === 0) return maxHeight;
    
    // fetch blocks
    let blocks = await this.config.daemon.getBlocksByHeight(blockIndices);
    
    // recurse to start fetching next blocks without waiting
    let recursePromise = null;
    let endHeight = blockIndices[blockIndices.length - 1];
    if (endHeight + 1 < maxHeight && maxRecursion > 1) {
      recursePromise = this._processBlockChunks(endHeight + 1, maxHeight, maxReqSize, maxRecursion - 1);
    }
    
    // process blocks
    blocks.map(block => this._processBlock(block));
    console.log("Done processing blocks [" + startHeight + ", " + endHeight + "]");
    
    // await recursion to return
    if (recursePromise) return await recursePromise;
    else return endHeight;
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
        let derivation = this.cache.coreUtils.generate_key_derivation(lastPubKey, this.cache.prvViewKey);
        //console.log("Derivation: " + derivation);
        //console.log("Out index: " + outIdx);
        //console.log("Public spend key: " + this.pubSpendKey);
        let pubKeyDerived = this.cache.coreUtils.derive_public_key(derivation, outIdx, this.cache.pubSpendKey);
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

/**
 * Local wallet default config.
 */
MoneroWalletLocal.DEFAULT_CONFIG = {
    startHeight: 0,                     // start height to process the wallet from
    mnemonicLanguage: "en",             // default mnemonic phrase language
    requestsPerSecond: 50,              // maximum requests per second to the daemon
    numHeadersPerRequest: 750,          // number of headers per headers fetch request 
    maxReqSize: 4000000,                // maximum size of any request to make
    maxConcurrency: 5,                  // maximum concurrency when processing; maximum memory = this * maxReqSize (defaults to 5)
    skipMinerTxs: false,                // instructs the wallet to skip processing miner txs
}

module.exports = MoneroWalletLocal;