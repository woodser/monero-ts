const assert = require("assert");
const GenUtils = require("../utils/GenUtils");
const BigInteger = require("../submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const MoneroUtils = require("../utils/MoneroUtils");
const MoneroRpc = require("../rpc/MoneroRpc")
const MoneroDaemon = require("./MoneroDaemon");
const MoneroNetworkType = require("./model/MoneroNetworkType");
const MoneroBlockHeader = require("./model/MoneroBlockHeader");
const MoneroBlock = require("./model/MoneroBlock");
const MoneroTx = require("./model/MoneroTx");
const MoneroOutput = require("./model/MoneroOutput");
const MoneroBlockTemplate = require("./model/MoneroBlockTemplate");
const MoneroDaemonInfo = require("./model/MoneroDaemonInfo");
const MoneroDaemonSyncInfo = require("./model/MoneroDaemonSyncInfo");
const MoneroHardForkInfo = require("./model/MoneroHardForkInfo");
const MoneroBan = require("./model/MoneroBan");
const MoneroDaemonConnection = require("./model/MoneroDaemonConnection");
const MoneroCoinbaseTxSum = require("./model/MoneroCoinbaseTxSum");
const MoneroOutputHistogramEntry = require("./model/MoneroOutputHistogramEntry");
const MoneroKeyImage = require("./model/MoneroKeyImage");
const MoneroSubmitTxResult = require("./model/MoneroSubmitTxResult");
const MoneroTxPoolStats = require("./model/MoneroTxPoolStats");
const MoneroAltChain = require("./model/MoneroAltChain");
const MoneroDaemonPeer = require("./model/MoneroDaemonPeer");
const MoneroMiningStatus = require("./model/MoneroMiningStatus");
const MoneroDaemonUpdateCheckResult = require("./model/MoneroDaemonUpdateCheckResult");
const MoneroDaemonUpdateDownloadResult = require("./model/MoneroDaemonUpdateDownloadResult");

/**
 * Implements a Monero daemon using monero-daemon-rpc.
 */
class MoneroDaemonRpc extends MoneroDaemon {
  
  /**
   * Constructs the daemon.
   * 
   * @param config is the daemon configuration	// TODO: config default and validation
   */
  constructor(config) {
    super();
    
    // assign config
    this.config = Object.assign({}, config);
    
    // initialize rpc if not given
    if (!this.config.rpc) this.config.rpc = new MoneroRpc(config);
    
    // one time initialization
    this.listeners = [];  // block listeners
    this.initPromise = this._initOneTime();
  }
  
  async isTrusted() {
    await this._initOneTime();
    let resp = await this.config.rpc.sendPathRequest("get_height");
    MoneroDaemonRpc._checkResponseStatus(resp);
    return !resp.untrusted;
  }
  
  async getHeight() {
    await this._initOneTime();
    let resp = await this.config.rpc.sendJsonRequest("get_block_count");
    MoneroDaemonRpc._checkResponseStatus(resp);
    return resp.count;
  }
  
  async getBlockId(height) {
    await this._initOneTime();
    return await this.config.rpc.sendJsonRequest("on_get_block_hash", [height]);  // TODO monero-wallet-rpc: no status returned
  }
  
  async getBlockTemplate(walletAddress, reserveSize) {
    assert(walletAddress && typeof walletAddress === "string", "Must specify wallet address to be mined to");
    await this._initOneTime();
    let resp = await this.config.rpc.sendJsonRequest("get_block_template", { wallet_address: walletAddress, reserve_size: reserveSize });
    MoneroDaemonRpc._checkResponseStatus(resp);
    return MoneroDaemonRpc._buildBlockTemplate(resp);
  }
  
  async getLastBlockHeader() {
    await this._initOneTime();
    let resp = await this.config.rpc.sendJsonRequest("get_last_block_header");
    MoneroDaemonRpc._checkResponseStatus(resp);
    return MoneroDaemonRpc._buildBlockHeader(resp.block_header);
  }
  
  async getBlockHeaderById(blockId) {
    await this._initOneTime();
    let resp = await this.config.rpc.sendJsonRequest("get_block_header_by_hash", { hash: blockId } );
    MoneroDaemonRpc._checkResponseStatus(resp);
    return MoneroDaemonRpc._buildBlockHeader(resp.block_header);
  }
  
  async getBlockHeaderByHeight(height) {
    await this._initOneTime();
    let resp = await this.config.rpc.sendJsonRequest("get_block_header_by_height", { height: height } );
    MoneroDaemonRpc._checkResponseStatus(resp);
    return MoneroDaemonRpc._buildBlockHeader(resp.block_header);
  }
  
  async getBlockHeadersByRange(startHeight, endHeight) {
    await this._initOneTime();
    
    // fetch block headers
    let resp = await this.config.rpc.sendJsonRequest("get_block_headers_range", {
      start_height: startHeight,
      end_height: endHeight
    });
    MoneroDaemonRpc._checkResponseStatus(resp);
    
    // build headers
    let headers = [];
    for (let respHeader of resp.headers) {
      headers.push(MoneroDaemonRpc._buildBlockHeader(respHeader));
    }
    return headers;
  }
  
  async getBlockById(blockId) {
    await this._initOneTime();
    let resp = await this.config.rpc.sendJsonRequest("get_block", { hash: blockId });
    MoneroDaemonRpc._checkResponseStatus(resp);
    return MoneroDaemonRpc._buildBlock(resp);
  }
  
  async getBlockByHeight(height) {
    await this._initOneTime();
    let resp = await this.config.rpc.sendJsonRequest("get_block", { height: height });
    MoneroDaemonRpc._checkResponseStatus(resp);
    return MoneroDaemonRpc._buildBlock(resp);
  }
  
  async getBlocksByHeight(heights) {
    await this._initOneTime();
    
    // fetch blocks in binary
    let respBin = await this.config.rpc.sendBinaryRequest("get_blocks_by_height.bin", { heights: heights });
    
    // convert binary blocks to json
    let rpcBlocks = this.coreUtils.binary_blocks_to_json(respBin);
    MoneroDaemonRpc._checkResponseStatus(rpcBlocks);
    //console.log(JSON.stringify(rpcBlocks));
    
    // build blocks with transactions
    assert.equal(rpcBlocks.txs.length, rpcBlocks.blocks.length);    
    let blocks = [];
    for (let blockIdx = 0; blockIdx < rpcBlocks.blocks.length; blockIdx++) {
      
      // build block
      let block = MoneroDaemonRpc._buildBlock(rpcBlocks.blocks[blockIdx]);
      block.getHeader().setHeight(heights[blockIdx]);
      blocks.push(block);
      
      // build transactions
      let txs = [];
      for (let txIdx = 0; txIdx < rpcBlocks.txs[blockIdx].length; txIdx++) {
        let tx = new MoneroTx();
        txs.push(tx);
        tx.setId(rpcBlocks.blocks[blockIdx].tx_hashes[txIdx]);
        tx.setIsConfirmed(true);
        tx.setInTxPool(false);
        tx.setIsCoinbase(false);
        tx.setDoNotRelay(false);
        tx.setIsRelayed(true);
        tx.setIsFailed(false);
        tx.setIsDoubleSpend(false);
        MoneroDaemonRpc._buildTx(rpcBlocks.txs[blockIdx][txIdx], tx);
      }
      
      // merge into one block
      block.setTxs([]);
      for (let tx of txs) {
        if (tx.getBlock()) block.merge(tx.getBlock());
        else block.getTxs().push(tx.setBlock(block));
      }
    }
    
    return blocks;
  }
  
  async getBlocksByRange(startHeight, endHeight) {
    await this._initOneTime();
    if (typeof startHeight !== "number") startHeight = 0;
    if (typeof endHeight !== "number") endHeight = await this.getHeight() - 1;
    let heights = [];
    for (let height = startHeight; height <= endHeight; height++) heights.push(height);
    return await this.getBlocksByHeight(heights);
  }
  
  async getTxs(txIds, prune) {
    await this._initOneTime();
    
    // validate input
    assert(Array.isArray(txIds) && txIds.length > 0, "Must provide an array of transaction ids");
    assert(prune === undefined || typeof prune === "boolean", "Prune must be a boolean or undefined");
    
    // fetch transactions
    let resp = await this.config.rpc.sendPathRequest("get_transactions", {
      txs_hashes: txIds,
      decode_as_json: true,
      prune: prune
    });
    try {
      MoneroDaemonRpc._checkResponseStatus(resp);
    } catch (e) {
      if (e.message.indexOf("Failed to parse hex representation of transaction hash") >= 0) throw new Error("Invalid transaction id");
      throw e;
    }
    
    // build transaction models
    let txs = [];
    if (resp.txs) {
      for (let txIdx = 0; txIdx < resp.txs.length; txIdx++) {
        let tx = new MoneroTx();
        tx.setIsCoinbase(false);
        txs.push(MoneroDaemonRpc._buildTx(resp.txs[txIdx], tx));
      }
    }
    return txs;
  }
  
  async getTxHexes(txIds, prune) {
    await this._initOneTime();
    
    // validate input
    assert(Array.isArray(txIds) && txIds.length > 0, "Must provide an array of transaction ids");
    assert(prune === undefined || typeof prune === "boolean", "Prune must be a boolean or undefined");
    
    // fetch transactions
    let resp = await this.config.rpc.sendPathRequest("get_transactions", {
      txs_hashes: txIds,
      decode_as_json: false,
      prune: prune
    });
    try {
      MoneroDaemonRpc._checkResponseStatus(resp);
    } catch (e) {
      if (e.message.indexOf("Failed to parse hex representation of transaction hash") >= 0) throw new Error("Invalid transaction id");
      throw e;
    }

    // collect hexes which may be pruned
    let hexes = [];
    if (resp.txs) {
      assert.equal(resp.txs.length, txIds.length);
      for (let rpcTx of resp.txs) {
        hexes.push(prune ? rpcTx.pruned_as_hex : rpcTx.as_hex);
      }
    }
    return hexes;
  }
  
  async getCoinbaseTxSum(height, count) {
    if (height === undefined) height = 0;
    else assert(height >= 0, "Height must be an integer >= 0");
    if (count === undefined) count = await this.getHeight();
    else assert(count >= 0, "Count must be an integer >= 0");
    let resp = await this.config.rpc.sendJsonRequest("get_coinbase_tx_sum", {height: height, count: count});
    MoneroDaemonRpc._checkResponseStatus(resp);
    let txSum = new MoneroCoinbaseTxSum();
    txSum.setTotalEmission(new BigInteger(resp.emission_amount));
    txSum.setTotalFees(new BigInteger(resp.fee_amount));
    return txSum;
  }
  
  async getFeeEstimate(graceBlocks) {
    let resp = await this.config.rpc.sendJsonRequest("get_fee_estimate", {grace_blocks: graceBlocks});
    MoneroDaemonRpc._checkResponseStatus(resp);
    return new BigInteger(resp.fee);
  }
  
  async submitTxHex(txHex, doNotRelay) {
    let resp = await this.config.rpc.sendPathRequest("send_raw_transaction", {tx_as_hex: txHex, do_not_relay: doNotRelay});
    let result = MoneroDaemonRpc._buildSubmitTxResult(resp);
    try { // collect response instead of throwing
      MoneroDaemonRpc._checkResponseStatus(resp); 
      result.setIsGood(true);
    } catch(e) {
      result.setIsGood(false);
    }
    return result;
  }
  
  async relayTxsById(txIds) {
    let resp = await this.config.rpc.sendJsonRequest("relay_tx", {txids: txIds});
    MoneroDaemonRpc._checkResponseStatus(resp);
  }
  
  async getTxPool() {
    
    // send rpc request
    let resp = await this.config.rpc.sendPathRequest("get_transaction_pool");
    MoneroDaemonRpc._checkResponseStatus(resp);
    
    // build txs
    let txs = [];
    if (resp.transactions) {
      for (let rpcTx of resp.transactions) {
        let tx = new MoneroTx();
        txs.push(tx);
        tx.setIsConfirmed(false);
        tx.setIsCoinbase(false);
        tx.setInTxPool(true);
        tx.setConfirmationCount(0);
        MoneroDaemonRpc._buildTx(rpcTx, tx);
      }
    }
    
    return txs;
  }
  
  async getTxPoolIds() {
    throw new Error("Not implemented");
  }
  
  async getTxPoolBacklog() {
    throw new Error("Not implemented");
  }

  async getTxPoolStats() {
    throw new Error("Response contains field 'histo' which is binary'");
    let resp = await this.config.rpc.sendPathRequest("get_transaction_pool_stats");
    MoneroDaemonRpc._checkResponseStatus(resp);
    let stats = MoneroDaemonRpc._buildTxPoolStats(resp.pool_stats);
    
    // uninitialize some stats if not applicable
    if (stats.getTime98pc() === 0) stats.setTime98pc(undefined);
    if (stats.getCount() === 0) {
      stats.setBytesMin(undefined);
      stats.setBytesMed(undefined);
      stats.setBytesMax(undefined);
      stats.setTime98pc(undefined);
      stats.setTimeOldest(undefined);
    }
    
    return stats;
  }
  
  async flushTxPool(ids) {
    if (ids) ids = GenUtils.listify(ids);
    let resp = await this.config.rpc.sendJsonRequest("flush_txpool", {txids: ids});
    MoneroDaemonRpc._checkResponseStatus(resp);
  }
  
  async getSpentStatuses(keyImages) {
    let resp = await this.config.rpc.sendPathRequest("is_key_image_spent", {key_images: keyImages});
    MoneroDaemonRpc._checkResponseStatus(resp);
    return resp.spent_status;
  }
  
  async getOutputHistogram(amounts, minCount, maxCount, isUnlocked, recentCutoff) {
    
    // send rpc request
    let resp = await this.config.rpc.sendJsonRequest("get_output_histogram", {
      amounts: amounts,
      min_count: minCount,
      max_count: maxCount,
      unlocked: isUnlocked,
      recent_cutoff: isUnlocked
    });
    MoneroDaemonRpc._checkResponseStatus(resp);
    
    // build histogram entries from response
    let entries = [];
    if (!resp.histogram) return entries;
    for (let rpcEntry of resp.histogram) {
      entries.push(MoneroDaemonRpc._buildOutputHistogramEntry(rpcEntry));
    }
    return entries;
  }
  
  async getOutputDistribution(amounts, cumulative, startHeight, endHeight) {
    throw new Error("Not implemented (response 'distribution' field is binary)");
    
//    let amountStrs = [];
//    for (let amount of amounts) amountStrs.push(amount.toJSValue());
//    console.log(amountStrs);
//    console.log(cumulative);
//    console.log(startHeight);
//    console.log(endHeight);
//    
//    // send rpc request
//    console.log("*********** SENDING REQUEST *************");
//    if (startHeight === undefined) startHeight = 0;
//    let resp = await this.config.rpc.sendJsonRequest("get_output_distribution", {
//      amounts: amountStrs,
//      cumulative: cumulative,
//      from_height: startHeight,
//      to_height: endHeight
//    });
//    
//    console.log("RESPONSE");
//    console.log(resp);
//    
//    // build distribution entries from response
//    let entries = [];
//    if (!resp.distributions) return entries; 
//    for (let rpcEntry of resp.distributions) {
//      let entry = MoneroDaemonRpc._buildOutputDistributionEntry(rpcEntry);
//      entries.push(entry);
//      MoneroDaemonRpc._setResponseInfo(resp, entry);  // TODO: set same response info for every entry, else this gets prohibitively large?
//    }
//    return entries;
  }
  
  async getInfo() {
    await this._initOneTime();
    let resp = await this.config.rpc.sendJsonRequest("get_info");
    MoneroDaemonRpc._checkResponseStatus(resp);
    return MoneroDaemonRpc._buildInfo(resp);
  }
  
  async getSyncInfo() {
    await this._initOneTime();
    let resp = await this.config.rpc.sendJsonRequest("sync_info");
    MoneroDaemonRpc._checkResponseStatus(resp);
    return MoneroDaemonRpc._buildSyncInfo(resp);
  }
  
  async getHardForkInfo() {
    let resp = await this.config.rpc.sendJsonRequest("hard_fork_info");
    MoneroDaemonRpc._checkResponseStatus(resp);
    return MoneroDaemonRpc._buildHardForkInfo(resp);
  }
  
  async getAltChains() {
    
//    // mocked response for test TODO: mock response test framework
//    let resp = {
//        status: "OK",
//        chains: [
//          {
//            block_hash: "697cf03c89a9b118f7bdf11b1b3a6a028d7b3617d2d0ed91322c5709acf75625",
//            difficulty: 14114729638300280,
//            height: 1562062,
//            length: 2
//          }
//        ]
//    }
    
    let resp = await this.config.rpc.sendJsonRequest("get_alternate_chains");
    MoneroDaemonRpc._checkResponseStatus(resp);
    if (!resp.chains) return [];
    let chains = [];
    for (let rpcChain of resp.chains) chains.push(MoneroDaemonRpc._buildAltChain(rpcChain));
    return chains;
  }
  
  async getAltBlockIds() {
    
//    // mocked response for test TODO: mock response test framework
//    let resp = {
//        status: "OK",
//        untrusted: false,
//        blks_hashes: ["9c2277c5470234be8b32382cdf8094a103aba4fcd5e875a6fc159dc2ec00e011","637c0e0f0558e284493f38a5fcca3615db59458d90d3a5eff0a18ff59b83f46f","6f3adc174a2e8082819ebb965c96a095e3e8b63929ad9be2d705ad9c086a6b1c","697cf03c89a9b118f7bdf11b1b3a6a028d7b3617d2d0ed91322c5709acf75625"]
//    }
    
    let resp = await this.config.rpc.sendPathRequest("get_alt_blocks_hashes");
    MoneroDaemonRpc._checkResponseStatus(resp);
    if (!resp.blks_hashes) return [];
    return resp.blks_hashes;
  }
  
  async getDownloadLimit() {
    return (await this._getBandwidthLimits())[0];
  }
  
  async setDownloadLimit(limit) {
    assert(GenUtils.isInt(limit) && limit > 0, "Download limit must be an integer greater than 0");
    await this._setBandwidthLimits(limit);
  }
  
  async resetDownloadLimit() {
    return (await this._setBandwidthLimits(-1))[0];
  }

  async getUploadLimit() {
    return (await this._getBandwidthLimits())[1];
  }
  
  async setUploadLimit(limit) {
    assert(GenUtils.isInt(limit) && limit > 0, "Upload limit must be an integer greater than 0");
    await this._setBandwidthLimits(undefined, limit);
  }
  
  async resetUploadLimit() {
    return (await this._setBandwidthLimits(undefined, -1))[1];
  }
  
  async getConnections() {
    await this._initOneTime();
    let resp = await this.config.rpc.sendJsonRequest("get_connections");
    MoneroDaemonRpc._checkResponseStatus(resp);
    let connections = [];
    if (!resp.connections) return connections;
    for (let rpcConnection of resp.connections) {
      connections.push(MoneroDaemonRpc._buildConnection(rpcConnection));
    }
    return connections;
  }
  
  async getKnownPeers() {
    
    // send request
    let resp = await this.config.rpc.sendPathRequest("get_peer_list");
    MoneroDaemonRpc._checkResponseStatus(resp);
    
    // build peers
    let peers = [];
    if (resp.gray_list) {
      for (let rpcPeer of resp.gray_list) {
        let peer = MoneroDaemonRpc._buildPeer(rpcPeer);
        peer.setIsOnline(false); // gray list means offline last checked
        peers.push(peer);
      }
    }
    if (resp.white_list) {
      for (let rpcPeer of resp.white_list) {
        let peer = MoneroDaemonRpc._buildPeer(rpcPeer);
        peer.setIsOnline(true); // white list means online last checked
        peers.push(peer);
      }
    }
    return peers;
  }
  
  async setOutgoingPeerLimit(limit) {
    assert(GenUtils.isInt(limit) && limit >= 0, "Outgoing peer limit must be >= 0");
    let resp = await this.config.rpc.sendPathRequest("out_peers", {out_peers: limit});
    MoneroDaemonRpc._checkResponseStatus(resp);
  }
  
  async setIncomingPeerLimit(limit) {
    assert(GenUtils.isInt(limit) && limit >= 0, "Incoming peer limit must be >= 0");
    let resp = await this.config.rpc.sendPathRequest("in_peers", {in_peers: limit});
    MoneroDaemonRpc._checkResponseStatus(resp);
  }
  
  async getPeerBans() {
    let resp = await this.config.rpc.sendJsonRequest("get_bans");
    MoneroDaemonRpc._checkResponseStatus(resp);
    let bans = [];
    for (let rpcBan of resp.bans) {
      let ban = new MoneroBan();
      ban.setHost(rpcBan.host);
      ban.setIp(rpcBan.ip);
      ban.setSeconds(rpcBan.seconds);
      bans.push(ban);
    }
    return bans;
  }
  
  async setPeerBan(ban) {
    return await this.setPeerBans([ban]);
  }
  
  async setPeerBans(bans) {
    let rpcBans = [];
    for (let ban of bans) rpcBans.push(MoneroDaemonRpc._buildRpcBan(ban));
    let resp = await this.config.rpc.sendJsonRequest("set_bans", {bans: rpcBans});
    MoneroDaemonRpc._checkResponseStatus(resp);
  }
  
  async startMining(address, threadCount, isBackground, ignoreBattery) {
    assert(address, "Address must be given to mine to");
    assert(GenUtils.isInt(threadCount) && threadCount > 0, "Thread count must be an integer greater than 0");
    assert(isBackground === undefined || typeof isBackground === "boolean");
    assert(ignoreBattery === undefined || typeof ignoreBattery === "boolean");
    let resp = await this.config.rpc.sendPathRequest("start_mining", {
      miner_address: address,
      threads_count: threadCount,
      do_background_mining: isBackground,
      ignore_battery: ignoreBattery,
    });
    MoneroDaemonRpc._checkResponseStatus(resp);
  }
  
  async stopMining() {
    let resp = await this.config.rpc.sendPathRequest("stop_mining");
    MoneroDaemonRpc._checkResponseStatus(resp);
  }
  
  async getMiningStatus() {
    let resp = await this.config.rpc.sendPathRequest("mining_status");
    MoneroDaemonRpc._checkResponseStatus(resp);
    return MoneroDaemonRpc._buildMiningStatus(resp);
  }
  
  async submitBlocks(blockBlobs) {
    assert(Array.isArray(blockBlobs) && blockBlobs.length > 0, "Must provide an array of mined block blobs to submit");
    let resp = await this.config.rpc.sendJsonRequest("submit_block", blockBlobs);
    MoneroDaemonRpc._checkResponseStatus(resp);
  }
  
  async checkForUpdate() {
    let resp = await this.config.rpc.sendPathRequest("update", {command: "check"});
    MoneroDaemonRpc._checkResponseStatus(resp);
    return MoneroDaemonRpc._buildUpdateCheckResult(resp);
  }
  
  async downloadUpdate(path) {
    let resp = await this.config.rpc.sendPathRequest("update", {command: "download", path: path});
    MoneroDaemonRpc._checkResponseStatus(resp);
    return MoneroDaemonRpc._buildUpdateDownloadResult(resp);
  }
  
  async stop() {
    let resp = await this.config.rpc.sendPathRequest("stop_daemon");
    MoneroDaemonRpc._checkResponseStatus(resp);
  }
  
  async getNextBlockHeader() {
    let that = this;
    return new Promise(function(resolve, reject) {
      let listener = function(header) {
        resolve(header);
        that.removeBlockListener(listener);
      }
      that.addBlockListener(listener);
    });
  }
  
  addBlockListener(listener) {

    // register listener
    this.listeners.push(listener);
    
    // start polling for new blocks
    const POLL_INTERVAL = 5000; // TODO: move to config
    if (!this.isPollingHeaders) this._startPollingHeaders(POLL_INTERVAL);
  }
  
  removeBlockListener(listener) {
    let found = GenUtils.remove(this.listeners, listener);
    assert(found, "Listener is not registered");
    if (this.listeners.length === 0) this._stopPollingHeaders();
  }
  
  // ------------------------------- PRIVATE ----------------------------------
  
  async _startPollingHeaders(interval) {
    assert(!this.isPollingHeaders, "Daemon is already polling block headers");
    
    // get header to detect changes while polling
    let lastHeader = await this.getLastBlockHeader();
    
    // poll until stopped
    let that = this;
    this.isPollingHeaders = true;
    while (this.isPollingHeaders) {
      await new Promise(function(resolve) { setTimeout(resolve, interval); });
      let header = await this.getLastBlockHeader();
      if (header.getId() !== lastHeader.getId()) {
        lastHeader = header;
        for (let listener of this.listeners) {
          listener(header); // notify listener
        }
      }
    }
  }
  
  _stopPollingHeaders() {
    this.isPollingHeaders = false; // causes polling loop to exit
  }
  
  async _initOneTime() {
    
    // return singleton promise if already initialized
    if (this.initPromise) return this.initPromise;
    
    // get core utils
    this.coreUtils = await MoneroUtils.getCoreUtils();
  }
  
  async _getBandwidthLimits() {
    let resp = await this.config.rpc.sendPathRequest("get_limit");
    MoneroDaemonRpc._checkResponseStatus(resp);
    return [resp.limit_down, resp.limit_up];
  }
  
  async _setBandwidthLimits(downLimit, upLimit) {
    let resp = await this.config.rpc.sendPathRequest("set_limit", {limit_down: downLimit, limit_up: upLimit});
    MoneroDaemonRpc._checkResponseStatus(resp);
    return [resp.limit_down, resp.limit_up];
  }
  
  // --------------------------------- STATIC ---------------------------------
  
  static _checkResponseStatus(resp) {
    if (resp.status !== "OK") throw new Error(resp.status);
  }
  
  static _buildBlockHeader(rpcHeader) {
    if (!rpcHeader) return undefined;
    let header = new MoneroBlockHeader();
    for (let key of Object.keys(rpcHeader)) {
      let val = rpcHeader[key];
      if (key === "block_size") header.setSize(val);
      else if (key === "depth") header.setDepth(val);
      else if (key === "difficulty") header.setDifficulty(new BigInteger(val));
      else if (key === "cumulative_difficulty") header.setCumulativeDifficulty(new BigInteger(val));
      else if (key === "hash") header.setId(val);
      else if (key === "height") header.setHeight(val);
      else if (key === "major_version") header.setMajorVersion(val);
      else if (key === "minor_version") header.setMinorVersion(val);
      else if (key === "nonce") header.setNonce(val);
      else if (key === "num_txes") header.setTxCount(val);
      else if (key === "orphan_status") header.setOrphanStatus(val);
      else if (key === "prev_hash" || key === "prev_id") header.setPrevId(val);
      else if (key === "reward") header.setReward(new BigInteger(val));
      else if (key === "timestamp") header.setTimestamp(val);
      else if (key === "block_weight") header.setWeight(val);
      else if (key === "pow_hash") header.setPowHash(val === "" ? undefined : val);
      //else console.log("WARNING: ignoring unexpected block header field: '" + key + "': " + val); // TODO: if ignoring warning, use safe set like below
    }
    return header;
  }
  
  static _buildBlock(rpcBlock) {
    
    // build block
    let block = new MoneroBlock();
    block.setHex(rpcBlock.blob);
    block.setHeader(MoneroDaemonRpc._buildBlockHeader(rpcBlock.block_header ? rpcBlock.block_header : rpcBlock));
    block.setTxIds(rpcBlock.tx_hashes === undefined ? [] : rpcBlock.tx_hashes);
    
    // build coinbase tx
    let rpcCoinbaseTx = rpcBlock.json ? JSON.parse(rpcBlock.json).miner_tx : rpcBlock.miner_tx;  // may need to be parsed from json
    let coinbaseTx = new MoneroTx();
    block.setCoinbaseTx(coinbaseTx);
    coinbaseTx.setIsConfirmed(true);
    coinbaseTx.setIsCoinbase(true);
    MoneroDaemonRpc._buildTx(rpcCoinbaseTx, coinbaseTx);
    
    return block;
  }
  
  /**
   * Transfers RPC tx fields to a given MoneroTx without overwriting previous values.
   * 
   * TODO: switch from safe set
   * 
   * @param rpcTx is the RPC map containing transaction fields
   * @param tx is the MoneroTx to populate with values (optional)
   * @returns tx is the same tx that was passed in or a new one if none given
   */
  static _buildTx(rpcTx, tx) {
    if (rpcTx === undefined) return undefined;
    if (tx === undefined) tx = new MoneroTx();
    
//    console.log("******** BUILDING TX ***********");
//    console.log(rpcTx);
//    console.log(tx.toString());
    
    // initialize from rpc map
    let header;
    for (let key of Object.keys(rpcTx)) {
      let val = rpcTx[key];
      if (key === "tx_hash" || key === "id_hash") MoneroUtils.safeSet(tx, tx.getId, tx.setId, val);
      else if (key === "block_timestamp") {
        if (!header) header = new MoneroBlockHeader();
        MoneroUtils.safeSet(header, header.getTimestamp, header.setTimestamp, val);
      }
      else if (key === "block_height") {
        if (!header) header = new MoneroBlockHeader();
        MoneroUtils.safeSet(header, header.getHeight, header.setHeight, val);
      }
      else if (key === "last_relayed_time") MoneroUtils.safeSet(tx, tx.getLastRelayedTimestamp, tx.setLastRelayedTimestamp, val);
      else if (key === "receive_time") MoneroUtils.safeSet(tx, tx.getReceivedTimestamp, tx.setReceivedTimestamp, val);
      else if (key === "in_pool") {
        MoneroUtils.safeSet(tx, tx.getIsConfirmed, tx.setIsConfirmed, !val);
        MoneroUtils.safeSet(tx, tx.getInTxPool, tx.setInTxPool, val);
      }
      else if (key === "double_spend_seen") MoneroUtils.safeSet(tx, tx.getIsDoubleSpend, tx.setIsDoubleSpend, val);
      else if (key === "version") MoneroUtils.safeSet(tx, tx.getVersion, tx.setVersion, val);
      else if (key === "extra") MoneroUtils.safeSet(tx, tx.getExtra, tx.setExtra, val);
      else if (key === "vin") {
        if (val.length !== 1 || !val[0].gen) {  // ignore coinbase vin TODO: why?
          tx.setVins(val.map(rpcVin => MoneroDaemonRpc._buildOutput(rpcVin, tx)));
        }
      }
      else if (key === "vout") tx.setVouts(val.map(rpcVout => MoneroDaemonRpc._buildOutput(rpcVout, tx)));
      else if (key === "rct_signatures") MoneroUtils.safeSet(tx, tx.getRctSignatures, tx.setRctSignatures, val);
      else if (key === "rctsig_prunable") MoneroUtils.safeSet(tx, tx.getRctSigPrunable, tx.setRctSigPrunable, val);
      else if (key === "unlock_time") MoneroUtils.safeSet(tx, tx.getUnlockTime, tx.setUnlockTime, val);
      else if (key === "as_json" || key === "tx_json") { }  // handled last so tx is as initialized as possible
      else if (key === "as_hex" || key === "tx_blob") MoneroUtils.safeSet(tx, tx.getHex, tx.setHex, val ? val : undefined);
      else if (key === "blob_size") MoneroUtils.safeSet(tx, tx.getSize, tx.setSize, val);
      else if (key === "weight") MoneroUtils.safeSet(tx, tx.getWeight, tx.setWeight, val);
      else if (key === "fee") MoneroUtils.safeSet(tx, tx.getFee, tx.setFee, new BigInteger(val));
      else if (key === "relayed") MoneroUtils.safeSet(tx, tx.getIsRelayed, tx.setIsRelayed, val);
      else if (key === "output_indices") MoneroUtils.safeSet(tx, tx.getOutputIndices, tx.setOutputIndices, val);
      else if (key === "do_not_relay") MoneroUtils.safeSet(tx, tx.getDoNotRelay, tx.setDoNotRelay, val);
      else if (key === "kept_by_block") MoneroUtils.safeSet(tx, tx.getKeptByBlock, tx.setKeptByBlock, val);
      else if (key === "signatures") MoneroUtils.safeSet(tx, tx.getSignatures, tx.setSignatures, val);
      else if (key === "last_failed_height") {
        if (val === 0) MoneroUtils.safeSet(tx, tx.getIsFailed, tx.setIsFailed, false);
        else {
          MoneroUtils.safeSet(tx, tx.getIsFailed, tx.setIsFailed, true);
          MoneroUtils.safeSet(tx, tx.getLastFailedHeight, tx.setLastFailedHeight, val);
        }
      }
      else if (key === "last_failed_id_hash") {
        if (val === MoneroDaemonRpc.DEFAULT_ID) MoneroUtils.safeSet(tx, tx.getIsFailed, tx.setIsFailed, false);
        else {
          MoneroUtils.safeSet(tx, tx.getIsFailed, tx.setIsFailed, true);
          MoneroUtils.safeSet(tx, tx.getLastFailedId, tx.setLastFailedId, val);
        }
      }
      else if (key === "max_used_block_height") MoneroUtils.safeSet(tx, tx.getMaxUsedBlockHeight, tx.setMaxUsedBlockHeight, val);
      else if (key === "max_used_block_id_hash") MoneroUtils.safeSet(tx, tx.getMaxUsedBlockId, tx.setMaxUsedBlockId, val);
      else if (key === "prunable_hash") MoneroUtils.safeSet(tx, tx.getPrunableHash, tx.setPrunableHash, val ? val : undefined);
      else if (key === "prunable_as_hex") MoneroUtils.safeSet(tx, tx.getPrunableHex, tx.setPrunableHex, val ? val : undefined);
      else if (key === "pruned_as_hex") MoneroUtils.safeSet(tx, tx.getPrunedHex, tx.setPrunedHex, val ? val : undefined);
      else console.log("WARNING: ignoring unexpected field in rpc tx: " + key + ": " + val);
    }
    
    // link block and tx
    if (header) tx.setBlock(new MoneroBlock().setHeader(header).setTxs([tx]));
    
    // TODO monero-daemon-rpc: unconfirmed txs block height and timestamp are actually received timestamp; overloading data model variables is bad juju
    if (tx.getBlock() && tx.getBlock().getHeader().getHeight() !== undefined && tx.getBlock().getHeader().getHeight() === tx.getBlock().getHeader().getTimestamp()) {
      tx.setReceivedTimestamp(tx.getBlock().getHeader().getHeight());
      tx.setBlock(undefined);
      tx.setIsConfirmed(false);
    }
    
    // initialize remaining known fields
    if (tx.getIsConfirmed()) {
      MoneroUtils.safeSet(tx, tx.getIsRelayed, tx.setIsRelayed, true);
      MoneroUtils.safeSet(tx, tx.getDoNotRelay, tx.setDoNotRelay, false);
      MoneroUtils.safeSet(tx, tx.getIsFailed, tx.setIsFailed, false);
    } else {
      tx.setConfirmationCount(0);
    }
    if (tx.getIsFailed() === undefined) tx.setIsFailed(false);
    if (tx.getOutputIndices() && tx.getVouts())  {
      assert.equal(tx.getVouts().length, tx.getOutputIndices().length);
      for (let i = 0; i < tx.getVouts().length; i++) {
        tx.getVouts()[i].setIndex(tx.getOutputIndices()[i]);  // transfer output indices to vouts
      }
    }
    if (rpcTx.as_json) MoneroDaemonRpc._buildTx(JSON.parse(rpcTx.as_json), tx);
    if (rpcTx.tx_json) MoneroDaemonRpc._buildTx(JSON.parse(rpcTx.tx_json), tx);
    
    // return built transaction
    return tx;
  }
  
  static _buildOutput(rpcOutput, tx) {
    let output = new MoneroOutput();
    output.setTx(tx);
    for (let key of Object.keys(rpcOutput)) {
      let val = rpcOutput[key];
      if (key === "gen") throw new Error("Output with 'gen' from daemon rpc is coinbase tx which we ignore (i.e. each coinbase vin is undefined)");
      else if (key === "key") {
        MoneroUtils.safeSet(output, output.getAmount, output.setAmount, new BigInteger(val.amount));
        MoneroUtils.safeSet(output, output.getKeyImage, output.setKeyImage, new MoneroKeyImage(val.k_image));
        MoneroUtils.safeSet(output, output.getRingOutputIndices, output.setRingOutputIndices, val.key_offsets);
      }
      else if (key === "amount") MoneroUtils.safeSet(output, output.getAmount, output.setAmount, new BigInteger(val));
      else if (key === "target") MoneroUtils.safeSet(output, output.getStealthPublicKey, output.setStealthPublicKey, val.key);
      else console.log("WARNING: ignoring unexpected field output: " + key + ": " + val);
    }
    return output;
  }
  
  static _buildBlockTemplate(rpcTemplate) {
    let template = new MoneroBlockTemplate();
    for (let key of Object.keys(rpcTemplate)) {
      let val = rpcTemplate[key];
      if (key === "blockhashing_blob") template.setBlockTemplateBlob(val);
      else if (key === "blocktemplate_blob") template.setBlockHashingBlob(val);
      else if (key === "difficulty") template.setDifficulty(new BigInteger(val));
      else if (key === "expected_reward") template.setExpectedReward(val);
      else if (key === "height") template.setHeight(val);
      else if (key === "prev_hash") template.setPrevId(val);
      else if (key === "reserved_offset") template.setReservedOffset(val);
      else if (key === "status") {}  // set elsewhere
      else if (key === "untrusted") {}  // set elsewhere
      else console.log("WARNING: ignoring unexpected field in block template: " + key + ": " + val);
    }
    return template;
  }
  
  static _buildInfo(rpcInfo) {
    if (!rpcInfo) return undefined;
    let info = new MoneroDaemonInfo();
    for (let key of Object.keys(rpcInfo)) {
      let val = rpcInfo[key];
      if (key === "version") info.setVersion(val);
      else if (key === "alt_blocks_count") info.setAltBlocksCount(val);
      else if (key === "block_size_limit") info.setBlockSizeLimit(val);
      else if (key === "block_size_median") info.setBlockSizeMedian(val);
      else if (key === "block_weight_limit") info.setBlockWeightLimit(val);
      else if (key === "block_weight_median") info.setBlockWeightMedian(val);
      else if (key === "bootstrap_daemon_address") info.setBootstrapDaemonAddress(val);
      else if (key === "cumulative_difficulty") info.setCumulativeDifficulty(new BigInteger(val));
      else if (key === "difficulty") info.setDifficulty(new BigInteger(val));
      else if (key === "free_space") info.setFreeSpace(new BigInteger(val));
      else if (key === "database_size") info.setDatabaseSize(new BigInteger(val));  // TODO: big integers necessary?  test?
      else if (key === "grey_peerlist_size") info.setOfflinePeerCount(val);
      else if (key === "height") info.setHeight(val);
      else if (key === "height_without_bootstrap") info.setHeightWithoutBootstrap(val);
      else if (key === "incoming_connections_count") info.setIncomingConnectionsCount(val);
      else if (key === "offline") info.setIsOffline(val);
      else if (key === "outgoing_connections_count") info.setOutgoingConnectionsCount(val);
      else if (key === "rpc_connections_count") info.setRpcConnectionsCount(val);
      else if (key === "start_time") info.setStartTimestamp(val);
      else if (key === "status") {}  // set elsewhere
      else if (key === "target") info.setTarget(val);
      else if (key === "target_height") info.setTargetHeight(val);
      else if (key === "top_block_hash") info.setTopBlockId(val);
      else if (key === "tx_count") info.setTxCount(val);
      else if (key === "tx_pool_size") info.setTxPoolSize(val);
      else if (key === "untrusted") {} // set elsewhere
      else if (key === "was_bootstrap_ever_used") info.setWasBootstrapEverUsed(val);
      else if (key === "white_peerlist_size") info.setOnlinePeerCount(val);
      else if (key === "update_available") info.setUpdateAvailable(val);
      else if (key === "nettype") MoneroUtils.safeSet(info, info.getNetworkType, info.setNetworkType, MoneroDaemon.parseNetworkType(val));
      else if (key === "mainnet") { if (val) MoneroUtils.safeSet(info, info.getNetworkType, info.setNetworkType, MoneroNetworkType.MAINNET); }
      else if (key === "testnet") { if (val) MoneroUtils.safeSet(info, info.getNetworkType, info.setNetworkType, MoneroNetworkType.TESTNET); }
      else if (key === "stagenet") { if (val) MoneroUtils.safeSet(info, info.getNetworkType, info.setNetworkType, MoneroNetworkType.STAGENET); }
      else console.log("WARNING: Ignoring unexpected info field: " + key + ": " + val);
    }
    return info;
  }
  
  /**
   * Initializes sync info from RPC sync info.
   * 
   * @param rpcSyncInfo is the rpc map to initialize the sync info from
   * @return {MoneroDaemonSyncInfo} is sync info initialized from the map
   */
  static _buildSyncInfo(rpcSyncInfo) {
    let syncInfo = new MoneroDaemonSyncInfo();
    for (let key of Object.keys(rpcSyncInfo)) {
      let val = rpcSyncInfo[key];
      if (key === "height") syncInfo.setHeight(new BigInteger(val));
      else if (key === "peers") {
        syncInfo.setConnections([]);
        let rpcConnections = val;
        for (let rpcConnection of rpcConnections) {
          syncInfo.getConnections().push(MoneroDaemonRpc._buildConnection(rpcConnection.info));
        }
      } else if (key === "spans") {
        syncInfo.setSpans([]);
        let rpcSpans = val;
        for (let rpcSpan of rpcSpans) {
          syncInfo.getSpans().push(MoneroDaemonRpc._buildConnetionSpan(rpcSpan));
        }
      } else if (key === "status") {}   // set elsewhere
      else if (key === "target_height") syncInfo.setTargetHeight(new BigInteger(val));
      else if (key === "next_needed_pruning_seed") syncInfo.setNextNeededPruningSeed(val);
      else if (key === "overview") {
        let overview = JSON.parse(val); // TODO: not tested with pruning enabled
        if (overview.length > 0) syncInfo.setOverview(val);
      }
      else console.log("WARNING: ignoring unexpected field in sync info: " + key + ": " + val);
    }
    return syncInfo;
  }
  
  static _buildHardForkInfo(rpcHardForkInfo) {
    let info = new MoneroHardForkInfo();
    for (let key of Object.keys(rpcHardForkInfo)) {
      let val = rpcHardForkInfo[key];
      if (key === "earliest_height") info.setEarliestHeight(val);
      else if (key === "enabled") info.setIsEnabled(val);
      else if (key === "state") info.setState(val);
      else if (key === "status") {}     // set elsewhere
      else if (key === "untrusted") {}  // set elsewhere
      else if (key === "threshold") info.setThreshold(val);
      else if (key === "version") info.setVersion(val);
      else if (key === "votes") info.setVotes(val);
      else if (key === "voting") info.setVoting(val);
      else if (key === "window") info.setWindow(val);
      else console.log("WARNING: ignoring unexpected field in hard fork info: " + key + ": " + val);
    }
    return info;
  }
  
  static _buildConnectionSpan(rpcConnectionSpan) {
    throw new Error("Not implemented");
  }
  
  static _buildOutputHistogramEntry(rpcEntry) {
    let entry = new MoneroOutputHistogramEntry();
    for (let key of Object.keys(rpcEntry)) {
      let val = rpcEntry[key];
      if (key === "amount") entry.setAmount(new BigInteger(val));
      else if (key === "total_instances") entry.setTotalInstances(val);
      else if (key === "unlocked_instances") entry.setUnlockedInstances(val);
      else if (key === "recent_instances") entry.setRecentInstances(val);
      else console.log("WARNING: ignoring unexpected field in output histogram: " + key + ": " + val);
    }
    return entry;
  }
  
  static _buildSubmitTxResult(rpcResult) {
    assert(rpcResult);
    let result = new MoneroSubmitTxResult();
    for (let key of Object.keys(rpcResult)) {
      let val = rpcResult[key];
      if (key === "double_spend") result.setIsDoubleSpend(val);
      else if (key === "fee_too_low") result.setIsFeeTooLow(val);
      else if (key === "invalid_input") result.setHasInvalidInput(val);
      else if (key === "invalid_output") result.setHasInvalidOutput(val);
      else if (key === "low_mixin") result.setIsMixinTooLow(val);
      else if (key === "not_rct") result.setIsRct(!val);
      else if (key === "not_relayed") result.setIsRelayed(!val);
      else if (key === "overspend") result.setIsOverspend(val);
      else if (key === "reason") result.setReason(val);
      else if (key === "too_big") result.setIsTooBig(val);
      else if (key === "status" || key === "untrusted") {}  // handled elsewhere
      else console.log("WARNING: ignoring unexpected field in submit tx hex result: " + key + ": " + val);
    }
    return result;
  }
  
  static _buildTxPoolStats(rpcStats) {
    assert(rpcStats);
    let stats = new MoneroTxPoolStats();
    for (let key of Object.keys(rpcStats)) {
      let val = rpcStats[key];
      if (key === "bytes_max") stats.setBytesMax(val);
      else if (key === "bytes_med") stats.setBytesMed(val);
      else if (key === "bytes_min") stats.setBytesMin(val);
      else if (key === "bytes_total") stats.setBytesTotal(val);
      else if (key === "histo_98pc") stats.setTime98pc(val);
      else if (key === "num_10m") stats.setCount10m(val);
      else if (key === "num_double_spends") stats.setDoubleSpendCount(val);
      else if (key === "num_failing") stats.setFailedCount(val);
      else if (key === "num_not_relayed") stats.setNotRelayedCount(val);
      else if (key === "oldest") stats.setTimeOldest(val);
      else if (key === "txs_total") stats.setCount(val);
      else if (key === "fee_total") stats.setFeeTotal(new BigInteger(val));
      else if (key === "histo") throw new Error("Not implemented");
      else console.log("WARNING: ignoring unexpected field in tx pool stats: " + key + ": " + val);
    }
    return stats;
  }
  
  static _buildAltChain(rpcChain) {
    assert(rpcChain);
    let chain = new MoneroAltChain();
    for (let key of Object.keys(rpcChain)) {
      let val = rpcChain[key];
      if (key === "block_hash") {}  // using block_hashes instead
      else if (key === "difficulty") chain.setDifficulty(new BigInteger(val));
      else if (key === "height") chain.setHeight(val);
      else if (key === "length") chain.setLength(val);
      else if (key === "block_hashes") chain.setBlockIds(val);
      else if (key === "main_chain_parent_block") chain.setMainChainParentBlockId(val);
      else console.log("WARNING: ignoring unexpected field in alternative chain: " + key + ": " + val);
    }
    return chain;
  }
  
  static _buildPeer(rpcPeer) {
    assert(rpcPeer);
    let peer = new MoneroDaemonPeer();
    for (let key of Object.keys(rpcPeer)) {
      let val = rpcPeer[key];
      if (key === "host") peer.setHost(val);
      else if (key === "id") peer.setId("" + val);  // TODO monero-wallet-rpc: peer id is big integer but string in `get_connections`
      else if (key === "ip") {} // host used instead which is consistently a string
      else if (key === "last_seen") peer.setLastSeen(val);
      else if (key === "port") peer.setPort(val);
      else if (key === "pruning_seed") peer.setPruningSeed(val);
      else console.log("WARNING: ignoring unexpected field in rpc peer: " + key + ": " + val);
    }
    return peer;
  }
  
  static _buildConnection(rpcConnection) {
    let connection = new MoneroDaemonConnection();
    let peer = new MoneroDaemonPeer();
    connection.setPeer(peer);
    peer.setIsOnline(true);
    for (let key of Object.keys(rpcConnection)) {
      let val = rpcConnection[key];
      if (key === "address") peer.setAddress(val);
      else if (key === "avg_download") connection.setAvgDownload(val);
      else if (key === "avg_upload") connection.setAvgUpload(val);
      else if (key === "connection_id") connection.setId(val);
      else if (key === "current_download") connection.setCurrentDownload(val);
      else if (key === "current_upload") connection.setCurrentUpload(val);
      else if (key === "height") connection.setHeight(val);
      else if (key === "host") peer.setHost(val);
      else if (key === "ip") {} // host used instead which is consistently a string
      else if (key === "incoming") connection.setIsIncoming(val);
      else if (key === "live_time") connection.setLiveTime(val);
      else if (key === "local_ip") connection.setIsLocalIp(val);
      else if (key === "localhost") connection.setIsLocalHost(val);
      else if (key === "peer_id") peer.setId(val);
      else if (key === "port") peer.setPort(val);
      else if (key === "recv_count") connection.setReceiveCount(val);
      else if (key === "recv_idle_time") connection.setReceiveIdleTime(val);
      else if (key === "send_count") connection.setSendCount(val);
      else if (key === "send_idle_time") connection.setSendIdleTime(val);
      else if (key === "state") connection.setState(val);
      else if (key === "support_flags") connection.setSupportFlagCount(val);
      else if (key === "pruning_seed") peer.setPruningSeed(val);
      else console.log("WARNING: ignoring unexpected field in connection: " + key + ": " + val);
    }
    return connection;
  }
  
  static _buildRpcBan(ban) {
    let rpcBan = {};
    rpcBan.host = ban.getHost();
    rpcBan.ip = ban.getIp();
    rpcBan.ban = ban.getIsBanned();
    rpcBan.seconds = ban.getSeconds();
    return rpcBan;
  }
  
  static _buildMiningStatus(rpcStatus) {
    let status = new MoneroMiningStatus();
    status.setIsActive(rpcStatus.active);
    status.setSpeed(rpcStatus.speed);
    status.setThreadCount(rpcStatus.threads_count);
    if (rpcStatus.active) {
      status.setAddress(rpcStatus.address);
      status.setIsBackground(rpcStatus.is_background_mining_enabled);
    }
    return status;
  }
  
  static _buildUpdateCheckResult(rpcResult) {
    assert(rpcResult);
    let result = new MoneroDaemonUpdateCheckResult();
    for (let key of Object.keys(rpcResult)) {
      let val = rpcResult[key];
      if (key === "auto_uri") result.setAutoUri(val);
      else if (key === "hash") result.setHash(val);
      else if (key === "path") {} // handled elsewhere
      else if (key === "status") {} // handled elsewhere
      else if (key === "update") result.setIsUpdateAvailable(val);
      else if (key === "user_uri") result.setUserUri(val);
      else if (key === "version") result.setVersion(val);
      else console.log("WARNING: ignoring unexpected field in rpc check update result: " + key + ": " + val);
    }
    if (result.getVersion() === "") result.setVersion(undefined);
    if (result.getHash() === "") result.setHash(undefined);
    return result;
  }
  
  static _buildUpdateDownloadResult(rpcResult) {
    let result = new MoneroDaemonUpdateDownloadResult(MoneroDaemonRpc._buildUpdateCheckResult(rpcResult));
    if (rpcResult["path"] !== "") result.setDownloadPath(rpcResult["path"]);
    return result;
  }
}

// uninitialized tx or block id from daemon rpc
MoneroDaemonRpc.DEFAULT_ID = "0000000000000000000000000000000000000000000000000000000000000000";

module.exports = MoneroDaemonRpc;