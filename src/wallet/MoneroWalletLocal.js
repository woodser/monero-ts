const assert = require("assert");
const MoneroWallet = require("./MoneroWallet");
const MoneroUtils = require("../utils/MoneroUtils");
const MoneroDaemon = require("../daemon/MoneroDaemon");

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
   * @param config.requestsPerSecond throttles rate of daemon requests (defaults to 50 RPS)
   * @param config.numHeadersPerRequest specifies the number of headers to fetch when populating the header cache (defaults to 750)
   * @param config.maxBytesPerBlocksRequest specifies maximum total block size per blocks request (defaults to 4000000)
   * @param config.maxBlocksRequestRecursion specifies maximum recursion per blocks request; maximum memory required = this * maxBytesPerBlocksRequest (defaults to 5)
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
    this._initOneTime();
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
    return this.prvSpendKey;
  }
  
  async getPrimaryAddress() {
    await this._initOneTime();
    return this.cache.primaryAddress;
  }
  
  async getHeight() {
    throw new Error("getHeight() not implemented");
  }
  
  async refresh() {
    await this._initOneTime();
    
    // TODO: only process blocks that contain transactions
    // TODO: make next network request while processing blocks
    
    // configuration TODO
    const START_HEIGHT = 210000;
    const MAX_REQ_SIZE = 5000000;
    const MAX_RECURSION = 1000;
    
    // initialize header cache
    delete this.cache.headers;
    this.cache.headers = {};
    
    // get daemon info
    let info = await this.config.daemon.getInfo();
    let chainHeight = info.getHeight();
    
//    // process blocks
//    await this._processBlocks(START_HEIGHT, info.getHeight() - 1, info.getTxCount());   
    
    console.log("PROCESSING BLOCKS [" + START_HEIGHT + ", " + (chainHeight - 1) + "] WITH " + info.getTxCount() + " NON-MINER TXS");
    
    // process blocks in chunks
    let curHeight = START_HEIGHT;
    while (curHeight < chainHeight - 1) {
      let endChunksHeight = await this._processBlockChunks(curHeight, chainHeight - 1, MAX_REQ_SIZE, MAX_RECURSION);
      curHeight = endChunksHeight + 1;
    }
    
//    // get all headers
//    console.log("Fetching headers cache...");
//    let headersCache = {};
//    await MoneroWalletLocal._buildHeadersCache(this.config.daemon, startHeight, chainHeight - 1, headersCache);
//    //let headers = await this.config.daemon.getBlockHeadersByRange(startHeight, chainHeight - 1); // TODO: fetch in chunks if needed
//    console.log("Done.");
//    console.log(headersCache);
    
//    let totalSize = 0;
//    let totalTxs = 0;
//    for (let header of headers) {
//      totalSize += header.getBlockSize();
//      totalTxs += header.getNumTxs();
//    }
//    console.log("Total size: " + totalSize);
//    console.log("Total txs: " + totalTxs);
//    
//    // get blocks in fixed size chunks
//    let curHeight = startHeight;
//    let endHeight = null;
//    let processedSize = 0;
//    let numProcessedBlocks = 0;
//    let numProcessedTxs = 0;
//    while (curHeight < chainHeight) {
//      endHeight = await this._getEndHeight(curHeight, chainHeight, maxSize, headers);
////      if (curHeight === endHeight) {
////        console.log("curHeight === endHeight === " + curHeight);
////        break;
////      }
//      //console.log("Fetching blocks [" + curHeight + ", " + endHeight + "]")
//      let blocks = await this.config.daemon.getBlocksByRange(curHeight, endHeight);
//      let numTxs = 0;
//      for (let block of blocks) {
//        numTxs += block.getTxs().length;
//        this._processBlock(block);
//        processedSize += headers[numProcessedBlocks].getBlockSize();
//        numProcessedTxs += headers[numProcessedBlocks].getNumTxs();
//        numProcessedBlocks++;
//      }
//      console.log(endHeight + " (" + (endHeight / chainHeight * 100) + "%) OR (" + (processedSize / totalSize) + "%) OR (" + (numProcessedTxs / totalTxs) + "%) " + numTxs + " transactions");
//      curHeight = endHeight + 1;
//    }
    
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
   * Gets the first block height within the range that has txs.
   * 
   * @param startHeight is the start height to search from
   * @param maxHeight is the maximum block height
   * @returns the first height within the range with txs, null if none found
   */
  async _getFirstTxHeight(startHeight, maxHeight) {
    for (let i = startHeight; i <= maxHeight; i++) {
      let cachedHeader = await this._getCachedHeader(i, maxHeight);
      if (cachedHeader.numTxs > 0) return i;
    }
    return null;
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
  
//  static async _fetchHeadersByTotalBlockSize(daemon, startHeight, maxHeight, totalBlockSize, headerCache) {
//    throw new Error("Not implemented");
//  };
// 
//  static async _buildHeadersCache(daemon, startHeight, endHeight, headersCache) {
//    
//    const NUM_HEADERS_PER_REQUEST = 1000;
//    const MAX_REQUESTS_PER_SECOND = 1;
//    
//    let maxRecursionLevel = MAX_REQUESTS_PER_SECOND < 1 ? 1 : Math.floor(MAX_REQUESTS_PER_SECOND);
//    let minMsPerRequest = 1 / MAX_REQUESTS_PER_SECOND * 1000;
//    let minMsRecursion = maxRecursionLevel * minMsPerRequest;
//    
////    console.log("max recursion level: " + maxRecursionLevel);
////    console.log("min ms per request: " + minMsPerRequest);
////    console.log("min ms recursion: " + minMsRecursion);
//    
//    let curHeight = startHeight;
//    while (curHeight < endHeight) {
//      let startTime = +new Date();
//      let endRecursionHeight = await _buildHeaderCacheRecursively(daemon, curHeight, endHeight, NUM_HEADERS_PER_REQUEST, maxRecursionLevel, headersCache);
//      let recurseTime = +new Date() - startTime;
//      if (recurseTime < minMsRecursion) {
//        console.log("Slowing this puppy down...");
//        await timeout(minMsRecursion - recurseTime);  // throttle requests    
//      }
//      curHeight = endRecursionHeight + 1;
//    }
//    
//    function timeout(ms) {
//      return new Promise(resolve => setTimeout(resolve, ms));
//    }
//    
//    async function _buildHeaderCacheRecursively(daemon, startHeight, maxHeight, numHeadersPerRequest, numMaxRecursion, headersCache) {
//      
//      // compute end height
//      let endHeight = Math.min(maxHeight, startHeight + numHeadersPerRequest - 1);
//
//      // fetch headers
//      let headers = await daemon.getBlockHeadersByRange(startHeight, endHeight);
//      
//      // recurse to start fetching next headers
//      let recursePromise = null;
//      if (endHeight + 1 < maxHeight && numMaxRecursion > 1) {
//        recursePromise = _buildHeaderCacheRecursively(daemon, endHeight + 1, maxHeight, numHeadersPerRequest, numMaxRecursion - 1, headersCache);
//      }
//      
//      // cache headers
//      for (let header of headers) {
//        headersCache[header.getHeight()] = "Hi!";
//      }
//      
//      // return result from recursion or max height if base case
//      if (recursePromise) return await recursePromise;
//      else return headers[headers.length - 1].getHeight();
//    }
//  }
//  
//  
//  
//  /**
//   * Gets the height of the block where the total size of blocks between it and
//   * the given start block is up to but no more than the given maximum size.
//   * 
//   * @param startHeight is the starting height to compute total block size from
//   * @param chainHeight is the current chain height to not be exceeded
//   * @param headers are headers to inform block retrieval size
//   * @param maxSize is the maximum size of all blocks between the start and end blocks
//   * @return the height of the block where the total size of all blocks between the
//   *         start and end is up to but no more than the given maximum size
//   */
//  async _getEndHeight(startHeight, chainHeight, maxSize, headers) {
//    let totalSize = 0;
//    for (let headerIdx = startHeight; headerIdx < headers.length; headerIdx++) {
//      let header = headers[headerIdx];
//      if (header.getBlockSize() > maxSize) throw new Error("Block is too big to process: " + header.getBlockSize());
//      if (headerIdx < headers.length - 1 && totalSize + headers[headerIdx + 1].getBlockSize() > maxSize) return header.getHeight();
//      totalSize += header.getBlockSize();
//    }
//    return headers[headers.length - 1].getHeight();
//  }
  
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
  
  /**
   * Performs one time initialization prior to executing wallet methods.
   * 
   * @returns Promise is a singleton promise that resolves after initializing
   */
  async _initOneTime() {
    
    // already initialized if cache initialized
    if (this.cache) return;

    // initialize working cache
    this.cache = {};
    this.cache.coreUtils = await MoneroUtils.getCoreUtils();
    this.cache.network = (await this.config.daemon.getInfo()).getNetworkType();
    
    // initialize new store
    if (this.store === undefined) {
      this.store = {};
      this.store.version = "0.0.1";
      
      // initialize keys from core utils
      let keys;
      if (this.config.mnemonic === undefined) {
        keys = this.config.coreUtils.newly_created_wallet(this.config.mnemonicLanguage, this.cache.network);  // randomly generate keys
      } else {
        keys = this.cache.coreUtils.seed_and_keys_from_mnemonic(this.config.mnemonic, this.cache.network); // initialize keys from mnemonic
        keys.mnemonic_string = this.config.mnemonic;
        keys.mnemonic_language = this.config.mnemonicLanguage
      }
      
      // initialize wallet keys
      this.store.seed = keys.sec_seed_string; // only seed goes in the store
      this.cache.mnemonic = keys.mnemonic_string;
      this.cache.mnemonicLanguage = keys.mnemonic_language;
      this.cache.pubViewKey = keys.pub_viewKey_string;
      this.cache.prvViewKey = keys.sec_viewKey_string;
      this.cache.pubSpendKey = keys.pub_spendKey_string;
      this.cache.prvSpendKey = keys.sec_spendKey_string;
      this.cache.primaryAddress = keys.address_string;
    }
    
    // otherwise import existing store
    else {
      throw new Error("Importing wallet store not supported");
    }
  }
}

MoneroWalletLocal.DEFAULT_CONFIG = {
    startHeight: 0,                     // start height to process the wallet from
    mnemonicLanguage: "en",             // default mnemonic phrase language
    requestsPerSecond: 50,              // maximum requests per second to the daemon
    numHeadersPerRequest: 750,          // number of headers per headers fetch request 
    maxBytesPerBlocksRequest: 4000000,  // maximum total block size per blocks request
    maxBlocksRequestRecursion: 5,       // maximum recursion per blocks request; maximum memory required = this * maxBytesPerBlocksRequest
    skipMinerTxs: false,                // instructs the wallet to skip processing miner txs
}

module.exports = MoneroWalletLocal;