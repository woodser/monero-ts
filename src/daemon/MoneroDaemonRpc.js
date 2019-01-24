const assert = require("assert");
const GenUtils = require("../utils/GenUtils");
const BigInteger = require("../submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const MoneroUtils = require("../utils/MoneroUtils");
const MoneroRpc = require("../rpc/MoneroRpc")
const MoneroDaemon = require("./MoneroDaemon");
const MoneroDaemonModel = require("./model/MoneroDaemonModel");
const MoneroDaemonResponseInfo = require("./model/MoneroDaemonResponseInfo"); 
const MoneroHeight = require("./model/MoneroHeight");
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
const MoneroFeeEstimate = require("./model/MoneroFeeEstimate");
const MoneroOutputHistogramEntry = require("./model/MoneroOutputHistogramEntry");
const MoneroTxPool = require("./model/MoneroTxPool");
const MoneroKeyImage = require("./model/MoneroKeyImage");
const MoneroSubmitTxResult = require("./model/MoneroSubmitTxResult");
const MoneroTxPoolStats = require("./model/MoneroTxPoolStats");
const MoneroAltChain = require("./model/MoneroAltChain");

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
  
  async getHeight() {
    await this._initOneTime();
    return (await this.config.rpc.sendJsonRequest("get_block_count")).count;
  }
  
  async getBlockId(height) {
    await this._initOneTime();
    return await this.config.rpc.sendJsonRequest("on_get_block_hash", [height]);
  }
  
  async getBlockTemplate(walletAddress, reserveSize) {
    await this._initOneTime();
    let resp = await this.config.rpc.sendJsonRequest("get_block_template", { wallet_address: walletAddress, reserve_size: reserveSize });
    let template = MoneroDaemonRpc._buildBlockTemplate(resp);
    MoneroDaemonRpc._setResponseInfo(resp, template);
    return template;
  }
  
  async getLastBlockHeader() {
    await this._initOneTime();
    let resp = await this.config.rpc.sendJsonRequest("get_last_block_header");
    let header = MoneroDaemonRpc._buildBlockHeader(resp.block_header);
    MoneroDaemonRpc._setResponseInfo(resp, header);
    return header;
  }
  
  async getBlockHeaderById(blockId) {
    await this._initOneTime();
    let resp = await this.config.rpc.sendJsonRequest("get_block_header_by_hash", { hash: blockId } );
    let header = MoneroDaemonRpc._buildBlockHeader(resp.block_header);
    MoneroDaemonRpc._setResponseInfo(resp, header);
    return header;
  }
  
  async getBlockHeaderByHeight(height) {
    await this._initOneTime();
    let resp = await this.config.rpc.sendJsonRequest("get_block_header_by_height", { height: height } );
    let header = MoneroDaemonRpc._buildBlockHeader(resp.block_header);
    MoneroDaemonRpc._setResponseInfo(resp, header);
    return header;
  }
  
  async getBlockHeadersByRange(startHeight, endHeight) {
    await this._initOneTime();
    
    // fetch block headers
    let resp = await this.config.rpc.sendJsonRequest("get_block_headers_range", {
      start_height: startHeight,
      end_height: endHeight
    });
    
    // build headers
    let headers = [];
    for (let respHeader of resp.headers) {
      let header = MoneroDaemonRpc._buildBlockHeader(respHeader);
      headers.push(header);
      MoneroDaemonRpc._setResponseInfo(resp, header);
    }
    return headers;
  }
  
  async getBlockById(blockId) {
    await this._initOneTime();
    let resp = await this.config.rpc.sendJsonRequest("get_block", { hash: blockId });
    let block = MoneroDaemonRpc._buildBlock(resp);
    MoneroDaemonRpc._setResponseInfo(resp, block);
    return block;
  }
  
  async getBlockByHeight(height) {
    await this._initOneTime();
    let resp = await this.config.rpc.sendJsonRequest("get_block", { height: height });
    let block = MoneroDaemonRpc._buildBlock(resp);
    MoneroDaemonRpc._setResponseInfo(resp, block);
    return block;
  }
  
  async getBlocksByHeight(heights) {
    await this._initOneTime();
    
    // fetch blocks in binary
    let respBin = await this.config.rpc.sendBinaryRequest("get_blocks_by_height.bin", { heights: heights });
    
    // convert binary blocks to json
    let rpcBlocks = this.coreUtils.binary_blocks_to_json(respBin);
    //console.log(JSON.stringify(rpcBlocks));
    
    // build blocks with transactions
    assert.equal(rpcBlocks.txs.length, rpcBlocks.blocks.length);    
    let blocks = [];
    for (let blockIdx = 0; blockIdx < rpcBlocks.blocks.length; blockIdx++) {
      
      // build block
      let block = MoneroDaemonRpc._buildBlock(rpcBlocks.blocks[blockIdx]);
      blocks.push(block);
      block.getHeader().setHeight(heights[blockIdx]);
      MoneroDaemonRpc._setResponseInfo(rpcBlocks, block);      
      
      // build transactions
      let txs = [];
      block.setTxs(txs);
      for (let txIdx = 0; txIdx < rpcBlocks.txs[blockIdx].length; txIdx++) {
        let tx = new MoneroTx();
        txs.push(tx);
        tx.setId(rpcBlocks.blocks[blockIdx].tx_hashes[txIdx]);
        tx.setHeight(block.getHeader().getHeight());
        tx.setIsConfirmed(true);
        tx.setInTxPool(false);
        tx.setIsCoinbase(false);
        tx.setIsRelayed(true);
        MoneroDaemonRpc._buildTx(rpcBlocks.txs[blockIdx][txIdx], tx);
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
  
  async getTxs(txIds, decodeAsJson, prune) {
    await this._initOneTime();
    
    // fetch transactions
    let resp = await this.config.rpc.sendPathRequest("get_transactions", {
      txs_hashes: txIds,
      decode_as_json: decodeAsJson,
      prune: prune
    });
    
    // build transaction models
    let txs = [];
    if (resp.txs) {
      for (let txIdx = 0; txIdx < resp.txs.length; txIdx++) {
        let tx = new MoneroTx();
        tx.setIsCoinbase(false);
        MoneroDaemonRpc._buildTx(resp.txs[txIdx], tx);
        MoneroDaemonRpc._setResponseInfo(resp, tx);
        txs.push(tx);
      }
    }
    return txs;
  }
  
  async getCoinbaseTxSum(height, count) {
    if (height === undefined) height = 0;
    else assert(height >= 0, "Height must be an integer >= 0");
    if (count === undefined) count = await this.getHeight();
    else assert(count >= 0, "Count must be an integer >= 0");
    let resp = await this.config.rpc.sendJsonRequest("get_coinbase_tx_sum", {height: height, count: count});
    let txSum = new MoneroCoinbaseTxSum();
    txSum.setTotalEmission(new BigInteger(resp.emission_amount));
    txSum.setTotalFees(new BigInteger(resp.fee_amount));
    MoneroDaemonRpc._setResponseInfo(resp, txSum);
    return txSum;
  }
  
  async getFeeEstimate(graceBlocks) {
    let resp = await this.config.rpc.sendJsonRequest("get_fee_estimate", {grace_blocks: graceBlocks});
    let feeEstimate = new MoneroFeeEstimate();
    feeEstimate.setFeeEstimate(new BigInteger(resp.fee));
    MoneroDaemonRpc._setResponseInfo(resp, feeEstimate);
    return feeEstimate;
  }
  
  async submitTxHex(txHex, doNotRelay) {
    let resp = await this.config.rpc.sendPathRequest("send_raw_transaction", {tx_as_hex: txHex, do_not_relay: doNotRelay});
    let result = MoneroDaemonRpc._buildSubmitTxResult(resp);
    MoneroDaemonRpc._setResponseInfo(resp, result);
    return result;
  }
  
  async relayTxsById(txIds) {
    let resp = await this.config.rpc.sendJsonRequest("relay_tx", {txids: txIds});
    return MoneroDaemonRpc._setResponseInfo(resp, new MoneroDaemonModel());
  }
  
  async getTxPoolTxsAndSpentKeyImages() {
    
    // send rpc request
    let resp = await this.config.rpc.sendPathRequest("get_transaction_pool");
    
    // build container for txs and spent key images
    let txPool = new MoneroTxPool();
    MoneroDaemonRpc._setResponseInfo(resp, txPool);
    
    // build txs
    let txs = [];
    txPool.setTxs(txs);
    if (resp.transactions) {
      for (let rpcTx of resp.transactions) {
        let tx = new MoneroTx();
        tx.setIsConfirmed(false);
        tx.setIsCoinbase(false);
        tx.setInTxPool(true);
        MoneroDaemonRpc._buildTx(rpcTx, tx);
        txs.push(tx);
      }
    }
    
    // build key images
    let keyImages = [];
    txPool.setSpentKeyImages(keyImages);
    if (resp.spent_key_images) {
      for (let rpcKeyImage of resp.spent_key_images) {
        let keyImage = MoneroDaemonRpc._buildSpentKeyImage(rpcKeyImage);
        keyImage.setSpentStatus(MoneroKeyImage.SpentStatus.TX_POOL);
        keyImages.push(keyImage);
      }
    }
    
    return txPool;
  }
  
  async getInfo() {
    await this._initOneTime();
    let resp = await this.config.rpc.sendJsonRequest("get_info");
    let info = MoneroDaemonRpc._buildInfo(resp);
    MoneroDaemonRpc._setResponseInfo(resp, info);
    return info;
  }
  
  async getTxPoolTxIds() {
    throw new Error("Not implemented");
  }
  
  async getTxPoolBacklog() {
    throw new Error("Not implemented");
  }

  async getTxPoolStats() {
    throw new Error("Response contains field 'histo' which is binary'");
    let resp = await this.config.rpc.sendPathRequest("get_transaction_pool_stats");
    let stats = MoneroDaemonRpc._setResponseInfo(resp, MoneroDaemonRpc._buildTxPoolStats(resp.pool_stats));
    
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
    let model = new MoneroDaemonModel();
    MoneroDaemonRpc._setResponseInfo(resp, model);
    return model;
  }
  
  async getSpentStatuses(keyImages) {
    let resp = await this.config.rpc.sendPathRequest("is_key_image_spent", {key_images: keyImages});
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
    
    // build histogram entries from response
    let entries = [];
    if (!resp.histogram) return entries;
    for (let rpcEntry of resp.histogram) {
      let entry = MoneroDaemonRpc._buildOutputHistogramEntry(rpcEntry);
      entries.push(entry);
      MoneroDaemonRpc._setResponseInfo(resp, entry);
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
  
  async getSyncInfo() {
    await this._initOneTime();
    
    // fetch sync info
    let resp = await this.config.rpc.sendJsonRequest("sync_info");
    
    // build sync response
    let syncInfo = MoneroDaemonRpc._buildSyncInfo(resp);
    MoneroDaemonRpc._setResponseInfo(resp, syncInfo);
    if (syncInfo.getPeers() !== undefined) {
      for (let peer of syncInfo.getPeers()) {
        peer.setResponseInfo(syncInfo.getResponseInfo());
      }
    }
    if (syncInfo.getSpans() !== undefined) {
      for (let span of syncInfo.getSpans()) {
        span.setResponseInfo(syncInfo.getResponseInfo());
      }
    }
    
    // return response;
    return syncInfo;
  }
  
  async getHardForkInfo() {
    let resp = await this.config.rpc.sendJsonRequest("hard_fork_info");
    let hardForkInfo = MoneroDaemonRpc._buildHardForkInfo(resp);
    MoneroDaemonRpc._setResponseInfo(resp, hardForkInfo);
    return hardForkInfo;
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
    if (!resp.chains) return [];
    let chains = [];
    let respInfo = MoneroDaemonRpc._getResponseInfo(resp);
    for (let rpcChain of resp.chains) {
      let chain = MoneroDaemonRpc._buildAltChain(rpcChain);
      chain.setResponseInfo(respInfo);
      chains.push(chain);
    }
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
  
  async getConnections() {  // TODO: test common response info
    await this._initOneTime();
    let resp = await this.config.rpc.sendJsonRequest("get_connections");
    let connections = [];
    if (!resp.connections) return connections;
    for (let rpcConnection of resp.connections) {
      let connection = MoneroDaemonRpc._buildConnection(rpcConnection);
      MoneroDaemonRpc._setResponseInfo(resp, connection);
      connections.push(connection);
    }
    return connections;
  }
  
  async setPeerBan(ban) {
    return await this.setPeerBans([ban]);
  }
  
  async setPeerBans(bans) {
    let rpcBans = [];
    for (let ban of bans) rpcBans.push(banToRpc(ban));
    let resp = await this.config.rpc.sendJsonRequest("set_bans", {bans: rpcBans});
    let model = new MoneroDaemonModel();
    MoneroDaemonRpc._setResponseInfo(resp, model);
    return model;
    
    // converts a ban to a rpc parameter
    function banToRpc(ban) {
      let rpcBan = {};
      rpcBan.host = ban.getHost();
      rpcBan.ip = ban.getIp();
      rpcBan.ban = ban.getIsBanned();
      rpcBan.seconds = ban.getSeconds();
      return rpcBan;
    }
  }
  
  async getPeerBans() {
    let resp = await this.config.rpc.sendJsonRequest("get_bans");
    let bans = [];
    for (let rpcBan of resp.bans) {
      let ban = new MoneroBan();
      ban.setHost(rpcBan.host);
      ban.setIp(rpcBan.ip);
      ban.setSeconds(rpcBan.seconds);
      MoneroDaemonRpc._setResponseInfo(resp, ban);
      bans.push(ban);
    }
    return bans;
  }
  
  async startMining(address, numThreads, backgroundMining, ignoreBattery) {
    assert(address);
    assert(numThreads > 0);
    assert(typeof backgroundMining === "boolean");
    assert(typeof ignoreBattery === "boolean");
    let resp = await this.config.rpc.sendPathRequest("start_mining", {
      miner_address: address,
      threads_count: numThreads,
      do_background_mining: backgroundMining,
      ignore_battery: ignoreBattery,
    })
    return MoneroDaemonRpc._setResponseInfo(resp, new MoneroDaemonModel());
  }
  
  async stopMining() {
    let resp = await this.config.rpc.sendPathRequest("stop_mining");
    return MoneroDaemonRpc._setResponseInfo(resp, new MoneroDaemonModel());
  }
  
  async nextBlockHeader() {
    let that = this;
    return new Promise(function(resolve, reject) {
      let listener = function(header) {
        resolve(header);
        that.removeBlockHeaderListener(listener);
      }
      that.addBlockHeaderListener(listener);
    });
  }
  
  addBlockHeaderListener(listener) {

    // register listener
    this.listeners.push(listener);
    
    // start polling for new blocks
    const POLL_INTERVAL = 5000; // TODO: move to config
    if (!this.isPollingHeaders) this._startPollingHeaders(POLL_INTERVAL);
  }
  
  removeBlockHeaderListener(listener) {
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
    return [resp.limit_down, resp.limit_up];
  }
  
  async _setBandwidthLimits(downLimit, upLimit) {
    let resp = await this.config.rpc.sendPathRequest("set_limit", {limit_down: downLimit, limit_up: upLimit});
    return [resp.limit_down, resp.limit_up];
  }
  
  // --------------------------------- STATIC ---------------------------------
  
  static _getResponseInfo(resp) {
    return new MoneroDaemonResponseInfo(resp.status, resp.untrusted ? !resp.untrusted : resp.untrusted);  // invert api's isUntrusted to isTrusted  // TODO: uninvert
  }
  
  static _setResponseInfo(resp, model) {
    let responseInfo = MoneroDaemonRpc._getResponseInfo(resp);
    model.setResponseInfo(responseInfo);
    return model;
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
      else if (key === "block_weight") header.setBlockWeight(val);
      else if (key === "pow_hash") header.setPowHash(val === "" ? undefined : val);
      //else console.log("WARNING: ignoring unexpected block header field: '" + key + "': " + val); // TODO: if ignoring warning, use safe set like below
    }
    return header;
  }
  
  static _buildBlock(rpcBlock) {
    
    // build coinbase tx from rpc
    let rpcCoinbaseTx = rpcBlock.json ? JSON.parse(rpcBlock.json).miner_tx : rpcBlock.miner_tx;  // may need to be parsed from json
    let coinbaseTx = new MoneroTx();
    coinbaseTx.setIsConfirmed(true);
    coinbaseTx.setIsCoinbase(true);
    MoneroDaemonRpc._buildTx(rpcCoinbaseTx, coinbaseTx);
    
    // build block
    let block = new MoneroBlock();
    block.setHex(rpcBlock.blob);
    block.setHeader(MoneroDaemonRpc._buildBlockHeader(rpcBlock.block_header ? rpcBlock.block_header : rpcBlock));
    block.setTxIds(rpcBlock.tx_hashes === undefined ? [] : rpcBlock.tx_hashes);
    block.setCoinbaseTx(coinbaseTx);
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
    
    // initialize from rpc map
    let blockHeight;
    for (let key of Object.keys(rpcTx)) {
      let val = rpcTx[key];
      if (key === "tx_hash" || key === "id_hash") MoneroUtils.safeSet(tx, tx.getId, tx.setId, val);
      else if (key === "block_timestamp") MoneroUtils.safeSet(tx, tx.getBlockTimestamp, tx.setBlockTimestamp, val);
      else if (key === "last_relayed_time") MoneroUtils.safeSet(tx, tx.getLastRelayedTime, tx.setLastRelayedTime, val);
      else if (key === "receive_time") MoneroUtils.safeSet(tx, tx.getReceivedTime, tx.setReceivedTime, val);
      else if (key === "in_pool") {
        MoneroUtils.safeSet(tx, tx.getIsConfirmed, tx.setIsConfirmed, !val);
        MoneroUtils.safeSet(tx, tx.getInTxPool, tx.setInTxPool, val);
      }
      else if (key === "double_spend_seen") MoneroUtils.safeSet(tx, tx.getIsDoubleSpend, tx.setIsDoubleSpend, val);
      else if (key === "version") MoneroUtils.safeSet(tx, tx.getVersion, tx.setVersion, val);
      else if (key === "extra") MoneroUtils.safeSet(tx, tx.getExtra, tx.setExtra, val);
      else if (key === "vin") {
        if (val.length !== 1 || !val[0].gen) {  // ignore coinbase vin
          tx.setVins(val.map(rpcVin => MoneroDaemonRpc._buildOutput(rpcVin, tx)));
        }
      }
      else if (key === "vout") tx.setVouts(val.map(rpcVout => MoneroDaemonRpc._buildOutput(rpcVout, tx)));
      else if (key === "rct_signatures") MoneroUtils.safeSet(tx, tx.getRctSignatures, tx.setRctSignatures, val);
      else if (key === "rctsig_prunable") MoneroUtils.safeSet(tx, tx.getRctSigPrunable, tx.setRctSigPrunable, val);
      else if (key === "unlock_time") MoneroUtils.safeSet(tx, tx.getUnlockTime, tx.setUnlockTime, val);
      else if (key === "as_json" || key === "tx_json") { if (val) MoneroDaemonRpc._buildTx(JSON.parse(val), tx); }  // may need to read tx from json str
      else if (key === "as_hex" || key === "tx_blob") MoneroUtils.safeSet(tx, tx.getHex, tx.setHex, val);
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
      else if (key === "block_height") blockHeight = val;
      else console.log("WARNING: ignoring unexpected field in rpc tx: " + key + ": " + val);
    }
    
//    if (typeof tx.getIsConfirmed() !== "boolean") {
//      console.log(rpcTx);
//      console.log(tx.toString());
//    }
    //assert.equal(typeof tx.getIsConfirmed(), "boolean")
    
    // initialize final fields
    if (tx.getIsConfirmed()) {
      MoneroUtils.safeSet(tx, tx.getIsRelayed, tx.setIsRelayed, true);
      MoneroUtils.safeSet(tx, tx.getHeight, tx.setHeight, blockHeight); // use block height iff confirmed, otherwise rpc returns timestamp
    }
    
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
      else if (key === "target") MoneroUtils.safeSet(output, output.getKeyImage, output.setKeyImage, new MoneroKeyImage(val.key));
      else console.log("WARNING: ignoring unexpected field output: " + key + ": " + val);
    }
    return output;
  }
  
  static _buildBlockTemplate(rpcTemplate) {
    let template = new MoneroBlockTemplate();
    for (let key of Object.keys(rpcTemplate)) {
      let val = rpcTemplate[key];
      if (key === "blockhashing_blob") template.setTemplateBlob(val);
      else if (key === "blocktemplate_blob") template.setHashBlob(val);
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
      else if (key === "grey_peerlist_size") info.setGreyPeerlistSize(val);
      else if (key === "height") info.setHeight(val);
      else if (key === "height_without_bootstrap") info.setHeightWithoutBootstrap(val);
      else if (key === "incoming_connections_count") info.setIncomingConnectionsCount(val);
      else if (key === "offline") info.setIsOffline(val);
      else if (key === "outgoing_connections_count") info.setOutgoingConnectionsCount(val);
      else if (key === "rpc_connections_count") info.setRpcConnectionsCount(val);
      else if (key === "start_time") info.setStartTime(val);
      else if (key === "status") {}  // set elsewhere
      else if (key === "target") info.setTarget(val);
      else if (key === "target_height") info.setTargetHeight(val);
      else if (key === "top_block_hash") info.setTopBlockId(val);
      else if (key === "tx_count") info.setTxCount(val);
      else if (key === "tx_pool_size") info.setTxPoolSize(val);
      else if (key === "untrusted") {} // set elsewhere
      else if (key === "was_bootstrap_ever_used") info.setWasBootstrapEverUsed(val);
      else if (key === "white_peerlist_size") info.setWhitePeerlistSize(val);
      else if (key === "update_available") info.setUpdateAvailable(val);
      else if (key === "nettype") MoneroUtils.safeSet(info, info.getNetworkType, info.setNetworkType, MoneroDaemon.parseNetworkType(val));
      else if (key === "mainnet") { if (val) MoneroUtils.safeSet(info, info.getNetworkType, info.setNetworkType, MoneroDaemon.NetworkType.MAINNET); }
      else if (key === "testnet") { if (val) MoneroUtils.safeSet(info, info.getNetworkType, info.setNetworkType, MoneroDaemon.NetworkType.TESTNET); }
      else if (key === "stagenet") { if (val) MoneroUtils.safeSet(info, info.getNetworkType, info.setNetworkType, MoneroDaemon.NetworkType.STAGENET); }
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
        syncInfo.setPeers([]);
        let rpcPeers = val;
        for (let rpcPeer of rpcPeers) {
          syncInfo.getPeers().push(MoneroDaemonRpc._buildConnection(rpcPeer.info));
        }
      } else if (key === "spans") {
        syncInfo.setSpans([]);
        let rpcSpans = val;
        for (let rpcSpan of rpcSpans) {
          syncInfo.getSpans().push(MoneroDaemonRpc._buildConnetionSpan(rpcSpan));
        }
      } else if (key === "status") {}   // set elsewhere
      else if (key === "target_height") syncInfo.setTargetHeight(new BigInteger(val));
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
  
  static _buildConnection(rpcConnection) {
    let connection = new MoneroDaemonConnection();
    for (let key of Object.keys(rpcConnection)) {
      let val = rpcConnection[key];
      if (key === "address") connection.setAddress(val);
      else if (key === "avg_download") connection.setAvgDownload(val);
      else if (key === "avg_upload") connection.setAvgUpload(val);
      else if (key === "connection_id") connection.setId(val);
      else if (key === "current_download") connection.setCurrentDownload(val);
      else if (key === "current_upload") connection.setCurrentUpload(val);
      else if (key === "height") connection.setHeight(val);
      else if (key === "host") connection.setHost(val);
      else if (key === "incoming") connection.setIsIncoming(val);
      else if (key === "ip") connection.setIp(val);
      else if (key === "live_time") connection.setLiveTime(val);
      else if (key === "local_ip") connection.setIsLocalIp(val);
      else if (key === "localhost") connection.setIsLocalHost(val);
      else if (key === "peer_id") connection.setPeerId(val);
      else if (key === "port") connection.setPort(val);
      else if (key === "recv_count") connection.setReceiveCount(val);
      else if (key === "recv_idle_time") connection.setReceiveIdleTime(val);
      else if (key === "send_count") connection.setSendCount(val);
      else if (key === "send_idle_time") connection.setSendIdleTime(val);
      else if (key === "state") connection.setState(val);
      else if (key === "support_flags") connection.setNumSupportFlags(val);
      else console.log("WARNING: ignoring unexpected field in connection: " + key + ": " + val);
    }
    return connection;
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
  
  static _buildSpentKeyImage(rpcKeyImage) {
    assert(rpcKeyImage);
    let keyImage = new MoneroKeyImage();
    for (let key of Object.keys(rpcKeyImage)) {
      let val = rpcKeyImage[key];
      if (key === "id_hash") keyImage.setHex(val);
      else if (key === "txs_hashes") {
        let ids = [];
        for (let id of val) ids.push(id);
        keyImage.setSpendingTxIds(ids);
      }
      else console.log("WARNING: ignoring unexpected field in spent key image: " + key + ": " + val);
    }
    return keyImage;
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
      if (key === "block_hash") chain.setBlockId(val);
      else if (key === "difficulty") chain.setDifficulty(new BigInteger(val));
      else if (key === "height") chain.setHeight(val);
      else if (key === "length") chain.setLength(val);
      else console.log("WARNING: ignoring unexpected field in alternative chain: " + key + ": " + val);
    }
    return chain;
  }
}

// uninitialized tx or block id from daemon rpc
MoneroDaemonRpc.DEFAULT_ID = "0000000000000000000000000000000000000000000000000000000000000000";

module.exports = MoneroDaemonRpc;