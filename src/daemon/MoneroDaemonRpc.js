const assert = require("assert");
const MoneroUtils = require("../utils/MoneroUtils");
const MoneroRpc = require("../rpc/MoneroRpc")
const MoneroDaemon = require("./MoneroDaemon");
const MoneroDaemonModel = require("./model/MoneroDaemonModel");
const MoneroDaemonResponseInfo = require("./model/MoneroDaemonResponseInfo"); 
const MoneroHeight = require("./model/MoneroHeight");
const MoneroBlockHeader = require("./model/MoneroBlockHeader");
const MoneroBlock = require("./model/MoneroBlock");
const MoneroTx = require("./model/MoneroTx");
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
const BigInteger = require("../submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;

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
    this.initPromise = this._initOneTime();
  }
  
  async getHeight() {
    await this._initOneTime();
    return (await this.config.rpc.sendJsonRpcRequest("get_block_count")).count;
  }
  
  async getBlockHash(height) {
    await this._initOneTime();
    return await this.config.rpc.sendJsonRpcRequest("on_get_block_hash", [height]);
  }
  
  async getBlockTemplate(walletAddress, reserveSize) {
    await this._initOneTime();
    let resp = await this.config.rpc.sendJsonRpcRequest("get_block_template", { wallet_address: walletAddress, reserve_size: reserveSize });
    let template = MoneroDaemonRpc._buildBlockTemplate(resp);
    MoneroDaemonRpc._setResponseInfo(resp, template);
    return template;
  }
  
  async getLastBlockHeader() {
    await this._initOneTime();
    let resp = await this.config.rpc.sendJsonRpcRequest("get_last_block_header");
    let header = MoneroDaemonRpc._buildBlockHeader(resp.block_header);
    MoneroDaemonRpc._setResponseInfo(resp, header);
    return header;
  }
  
  async getBlockHeaderByHash(hash) {
    await this._initOneTime();
    let resp = await this.config.rpc.sendJsonRpcRequest("get_block_header_by_hash", { hash: hash } );
    let header = MoneroDaemonRpc._buildBlockHeader(resp.block_header);
    MoneroDaemonRpc._setResponseInfo(resp, header);
    return header;
  }
  
  async getBlockHeaderByHeight(height) {
    await this._initOneTime();
    let resp = await this.config.rpc.sendJsonRpcRequest("get_block_header_by_height", { height: height } );
    let header = MoneroDaemonRpc._buildBlockHeader(resp.block_header);
    MoneroDaemonRpc._setResponseInfo(resp, header);
    return header;
  }
  
  async getBlockHeadersByRange(startHeight, endHeight) {
    await this._initOneTime();
    
    // fetch block headers
    let resp = await this.config.rpc.sendJsonRpcRequest("get_block_headers_range", {
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
  
  async getBlockByHash(hash) {
    await this._initOneTime();
    let resp = await this.config.rpc.sendJsonRpcRequest("get_block", { hash: hash });
    let block = MoneroDaemonRpc._buildBlock(resp);
    MoneroDaemonRpc._setResponseInfo(resp, block);
    return block;
  }
  
  async getBlockByHeight(height) {
    await this._initOneTime();
    let resp = await this.config.rpc.sendJsonRpcRequest("get_block", { height: height });
    let block = MoneroDaemonRpc._buildBlock(resp);
    MoneroDaemonRpc._setResponseInfo(resp, block);
    return block;
  }
  
  async getBlocksByHeight(heights) {
    await this._initOneTime();
    
    // fetch blocks in binary
    let respBin = await this.config.rpc.sendBinRpcRequest("get_blocks_by_height.bin", { heights: heights });
    
    // convert binary blocks to json
    let rpcBlocks = this.coreUtils.binary_blocks_to_json(respBin);
    
    // build complete blocks
    assert.equal(rpcBlocks.blocks.length, rpcBlocks.txs.length);    
    let blocks = [];
    for (let blockIdx = 0; blockIdx < rpcBlocks.blocks.length; blockIdx++) {
      let block = MoneroDaemonRpc._buildBlock(rpcBlocks.blocks[blockIdx]);                  // create block
      block.getHeader().setHeight(heights[blockIdx]);                                       // set header height
      block.setTxs(rpcBlocks.txs[blockIdx].map(rpcTx => MoneroDaemonRpc._buildTx(rpcTx)));  // create transactions
      for (let txIdx = 0; txIdx < block.getTxs().length; txIdx++) {
        block.getTxs()[txIdx].setId(rpcBlocks.blocks[blockIdx].tx_hashes[txIdx]);           // set tx id
        block.getTxs()[txIdx].setHeight(block.getHeader().getHeight());                     // set tx height
      }
      MoneroDaemonRpc._setResponseInfo(rpcBlocks, block);
      blocks.push(block);
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
  
  async getTxs(txHashes, decodeAsJson, prune) {
    await this._initOneTime();
    
    // fetch transactions
    let resp = await this.config.rpc.sendPathRpcRequest("get_transactions", {
      txs_hashes: txHashes,
      decode_as_json: decodeAsJson,
      prune: prune
    });
    
    // build transaction models
    let txs = resp.txs ? resp.txs.map(tx => MoneroDaemonRpc._buildTx(tx)) : [];
    txs.map(tx => MoneroDaemonRpc._setResponseInfo(resp, tx));
    return txs;
  }
  
  async getCoinbaseTxSum(height, count) {
    if (height === undefined) height = 0;
    else assert(height >= 0, "Height must be an integer >= 0");
    if (count === undefined) count = await this.getHeight();
    else assert(count >= 0, "Count must be an integer >= 0");
    let resp = await this.config.rpc.sendJsonRpcRequest("get_coinbase_tx_sum", {height: height, count: count});
    let txSum = new MoneroCoinbaseTxSum();
    txSum.setTotalEmission(new BigInteger(resp.emission_amount));
    txSum.setTotalFees(new BigInteger(resp.fee_amount));
    MoneroDaemonRpc._setResponseInfo(resp, txSum);
    return txSum;
  }
  
  async getFeeEstimate(graceBlocks) {
    let resp = await this.config.rpc.sendJsonRpcRequest("get_fee_estimate", {grace_blocks: graceBlocks});
    let feeEstimate = new MoneroFeeEstimate();
    feeEstimate.setFeeEstimate(new BigInteger(resp.fee));
    MoneroDaemonRpc._setResponseInfo(resp, feeEstimate);
    return feeEstimate;
  }
  
  async getTxPoolTxsAndSpentKeyImages() {
    
    // send rpc request
    let resp = await this.config.rpc.sendPathRpcRequest("get_transaction_pool");
    
    // build container for txs and spent key images
    let txPool = new MoneroTxPool();
    MoneroDaemonRpc._setResponseInfo(resp, txPool);
    
    // built txs
    let txs = [];
    txPool.setTxs(txs);
    if (resp.transactions) {
      for (let rpcTx of resp.transactions) {
        let tx = MoneroDaemonRpc._buildTx(rpcTx); // TODO: needs to handle additional daemon mempool tx fields
        txs.push(tx);
      }
    }
    
    // build key images
    throw new Error("Not implemented");
  }
  
  async getInfo() {
    await this._initOneTime();
    let resp = await this.config.rpc.sendJsonRpcRequest("get_info");
    let info = MoneroDaemonRpc._buildInfo(resp);
    MoneroDaemonRpc._setResponseInfo(resp, info);
    return info;
  }
  
  async getSyncInfo() {
    await this._initOneTime();
    
    // fetch sync info
    let resp = await this.config.rpc.sendJsonRpcRequest("sync_info");
    
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
    let resp = await this.config.rpc.sendJsonRpcRequest("hard_fork_info");
    let hardForkInfo = MoneroDaemonRpc._buildHardForkInfo(resp);
    MoneroDaemonRpc._setResponseInfo(resp, hardForkInfo);
    return hardForkInfo;
  }
  
  async getConnections() {
    await this._initOneTime();
    let resp = await this.config.rpc.sendJsonRpcRequest("get_connections");
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
    let resp = await this.config.rpc.sendJsonRpcRequest("set_bans", {bans: rpcBans});
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
    let resp = await this.config.rpc.sendJsonRpcRequest("get_bans");
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
    let resp = await this.config.rpc.sendPathRpcRequest("start_mining", {
      miner_address: address,
      threads_count: numThreads,
      do_background_mining: backgroundMining,
      ignore_battery: ignoreBattery,
    })
    return MoneroDaemonRpc._setResponseInfo(resp, new MoneroDaemonModel());
  }
  
  async stopMining() {
    let resp = await this.config.rpc.sendPathRpcRequest("stop_mining");
    resp = JSON.parse(resp);  // TODO: this is being returned as string instead of an object for some reason???
    return MoneroDaemonRpc._setResponseInfo(resp, new MoneroDaemonModel());
  }
  
  async flushTxPool(ids) {
    if (ids) ids = GenUtils.listify(ids);
    let resp = await this.config.rpc.sendJsonRpcRequest("flush_txpool", {txids: ids});
    let model = new MoneroDaemonModel();
    MoneroDaemonRpc._setResponseInfo(resp, model);
    return model;
  }
  
  async getOutputHistogram(amounts, minCount, maxCount, isUnlocked, recentCutoff) {
    
    // send rpc request
    let resp = await this.config.rpc.sendJsonRpcRequest("get_output_histogram", {
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
    throw new Error("Response is being returned as string for some reason");  // TODO
    
//    // TODO: need to send BigIntegers to RPC API
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
//    let resp = await this.config.rpc.sendJsonRpcRequest("get_output_distribution", {
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
  
  // ------------------------------- PRIVATE STATIC ---------------------------
  
  async _initOneTime() {
    
    // return singleton promise if already initialized
    if (this.initPromise) return this.initPromise;
    
    // get core utils
    this.coreUtils = await MoneroUtils.getCoreUtils();
  }
  
  static _setResponseInfo(resp, model) {
    let responseInfo = new MoneroDaemonResponseInfo(resp.status, resp.untrusted ? !resp.untrusted : resp.untrusted);  // invert api's isUntrusted to isTrusted  // TODO: uninvert
    model.setResponseInfo(responseInfo);
    return model;
  }
  
  static _buildBlockHeader(rpcHeader) {
    if (!rpcHeader) return undefined;
    let header = new MoneroBlockHeader();
    for (var prop in rpcHeader) {
      let key = prop.toString();
      let val = rpcHeader[key];
      if (key === "block_size") header.setBlockSize(val);
      else if (key === "depth") header.setDepth(val);
      else if (key === "difficulty") header.setDifficulty(new BigInteger(val));
      else if (key === "cumulative_difficulty") header.setCumulativeDifficulty(new BigInteger(val));
      else if (key === "hash") header.setHash(val);
      else if (key === "height") header.setHeight(val);
      else if (key === "major_version") header.setMajorVersion(val);
      else if (key === "minor_version") header.setMinorVersion(val);
      else if (key === "nonce") header.setNonce(val);
      else if (key === "num_txes") header.setNumTxs(val);
      else if (key === "orphan_status") header.setOrphanStatus(val);
      else if (key === "prev_hash" || key === "prev_id") header.setPrevHash(val);
      else if (key === "reward") header.setReward(new BigInteger(val));
      else if (key === "timestamp") header.setTimestamp(val);
      else if (key === "block_weight") header.setBlockWeight(val);
      else if (key === "pow_hash") header.setPowHash(val === "" ? undefined : val);
      //else console.log("WARNING: ignoring unexpected block header field: '" + key + "': " + val); // TODO: if ignoring warning, use safe set like below
    }
    return header;
  }
  
  static _buildBlock(rpcBlock) {
    let block = new MoneroBlock();
    block.setHex(rpcBlock.blob);
    block.setHeader(MoneroDaemonRpc._buildBlockHeader(rpcBlock.block_header ? rpcBlock.block_header : rpcBlock));
    block.setTxHashes(rpcBlock.tx_hashes === undefined ? [] : rpcBlock.tx_hashes);
    let minerTxRpc = rpcBlock.json ? JSON.parse(rpcBlock.json).miner_tx : rpcBlock.miner_tx; // get miner tx from rpc
    block.setMinerTx(MoneroDaemonRpc._buildTx(minerTxRpc));
    return block;
  }
  
  /**
   * Transfers RPC tx fields to a given MoneroTx without overwriting previous values.
   * 
   * @param rpcTx is the RPC map containing transaction fields
   * @param tx is the MoneroTx to populate with values (optional)
   * @returns tx is the same tx that was passed in or a new one if none given
   */
  static _buildTx(rpcTx, tx) {
    if (!tx) tx = new MoneroTx();
    if (rpcTx === undefined) return tx;
    MoneroUtils.safeSet(tx, tx.getHex, tx.setHex, rpcTx.as_hex);
    MoneroUtils.safeSet(tx, tx.getHeight, tx.setHeight, rpcTx.block_height);
    MoneroUtils.safeSet(tx, tx.getTimestamp, tx.setTimestamp, rpcTx.block_timestamp);
    MoneroUtils.safeSet(tx, tx.getIsConfirmed, tx.setIsConfirmed, rpcTx.in_pool === undefined ? undefined : !rpcTx.in_pool);
    MoneroUtils.safeSet(tx, tx.getIsDoubleSpend, tx.setIsDoubleSpend, rpcTx.double_spend_seen);
    MoneroUtils.safeSet(tx, tx.getId, tx.setId, rpcTx.tx_hash);
    MoneroUtils.safeSet(tx, tx.getVersion, tx.setVersion, rpcTx.version);
    MoneroUtils.safeSet(tx, tx.getExtra, tx.setExtra, rpcTx.extra);
    MoneroUtils.safeSet(tx, tx.getVin, tx.setVin, rpcTx.vin);
    MoneroUtils.safeSet(tx, tx.getVout, tx.setVout, rpcTx.vout);
    MoneroUtils.safeSet(tx, tx.getRctSignatures, tx.setRctSignatures, rpcTx.rct_signatures);
    MoneroUtils.safeSet(tx, tx.getRctSigPrunable, tx.setRctSigPrunable, rpcTx.rctsig_prunable);
    MoneroUtils.safeSet(tx, tx.getUnlockTime, tx.setUnlockTime, rpcTx.unlock_time);
    if (rpcTx.as_json) MoneroDaemonRpc._buildTx(JSON.parse(rpcTx.as_json), tx);  // may need to read tx from json str
    return tx;
  }
  
  static _buildBlockTemplate(rpcTemplate) {
    let template = new MoneroBlockTemplate();
    for (let key in rpcTemplate) {
      if (!rpcTemplate.hasOwnProperty(key)) continue;
      let val = rpcTemplate[key];
      if (key === "blockhashing_blob") template.setTemplateBlob(val);
      else if (key === "blocktemplate_blob") template.setHashBlob(val);
      else if (key === "difficulty") template.setDifficulty(val);
      else if (key === "expected_reward") template.setExpectedReward(val);
      else if (key === "height") template.setHeight(val);
      else if (key === "prev_hash") template.setPrevHash(val);
      else if (key === "reserved_offset") template.setReservedOffset(val);
      else if (key === "status") {}  // set elsewhere
      else if (key === "untrusted") {}  // set elsewhere
      else console.log("WARNING: ignoring unexpected field in block template: '" + key + "'");
    }
    return template;
  }
  
  static _buildInfo(rpcInfo) {
    if (!rpcInfo) return undefined;
    let info = new MoneroDaemonInfo();
    for (var prop in rpcInfo) {
      let key = prop.toString();
      let val = rpcInfo[key];
      if (key === "alt_blocks_count") info.setAltBlocksCount(val);
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
      else if (key === "top_block_hash") info.setTopBlockHash(val);
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
      else console.log("WARNIN: ignoring unexpected field in sync info: '" + key + "'");
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
      else console.log("WARNING: ignoring unexpected field in hard fork info: '" + key + "'");
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
      else console.log("WARNING: ignoring unexpected field in connection: '" + key + "'");
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
      else console.log("WARNING: ignoring unexpected field in output histogram: '" + key + "'");
    }
    return entry;
  }
}

module.exports = MoneroDaemonRpc;