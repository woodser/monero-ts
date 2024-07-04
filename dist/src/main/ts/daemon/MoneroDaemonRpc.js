"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _assert = _interopRequireDefault(require("assert"));
var _GenUtils = _interopRequireDefault(require("../common/GenUtils"));
var _LibraryUtils = _interopRequireDefault(require("../common/LibraryUtils"));
var _TaskLooper = _interopRequireDefault(require("../common/TaskLooper"));
var _MoneroAltChain = _interopRequireDefault(require("./model/MoneroAltChain"));
var _MoneroBan = _interopRequireDefault(require("./model/MoneroBan"));
var _MoneroBlock = _interopRequireDefault(require("./model/MoneroBlock"));
var _MoneroBlockHeader = _interopRequireDefault(require("./model/MoneroBlockHeader"));
var _MoneroBlockTemplate = _interopRequireDefault(require("./model/MoneroBlockTemplate"));
var _MoneroConnectionSpan = _interopRequireDefault(require("./model/MoneroConnectionSpan"));
var _MoneroDaemon = _interopRequireDefault(require("./MoneroDaemon"));
var _MoneroDaemonConfig = _interopRequireDefault(require("./model/MoneroDaemonConfig"));
var _MoneroDaemonInfo = _interopRequireDefault(require("./model/MoneroDaemonInfo"));
var _MoneroDaemonListener = _interopRequireDefault(require("./model/MoneroDaemonListener"));
var _MoneroDaemonSyncInfo = _interopRequireDefault(require("./model/MoneroDaemonSyncInfo"));
var _MoneroDaemonUpdateCheckResult = _interopRequireDefault(require("./model/MoneroDaemonUpdateCheckResult"));
var _MoneroDaemonUpdateDownloadResult = _interopRequireDefault(require("./model/MoneroDaemonUpdateDownloadResult"));
var _MoneroFeeEstimate = _interopRequireDefault(require("./model/MoneroFeeEstimate"));
var _MoneroError = _interopRequireDefault(require("../common/MoneroError"));
var _MoneroHardForkInfo = _interopRequireDefault(require("./model/MoneroHardForkInfo"));
var _MoneroKeyImage = _interopRequireDefault(require("./model/MoneroKeyImage"));

var _MoneroMinerTxSum = _interopRequireDefault(require("./model/MoneroMinerTxSum"));
var _MoneroMiningStatus = _interopRequireDefault(require("./model/MoneroMiningStatus"));
var _MoneroNetworkType = _interopRequireDefault(require("./model/MoneroNetworkType"));
var _MoneroOutput = _interopRequireDefault(require("./model/MoneroOutput"));
var _MoneroOutputHistogramEntry = _interopRequireDefault(require("./model/MoneroOutputHistogramEntry"));
var _MoneroPeer = _interopRequireDefault(require("./model/MoneroPeer"));
var _MoneroPruneResult = _interopRequireDefault(require("./model/MoneroPruneResult"));
var _MoneroRpcConnection = _interopRequireDefault(require("../common/MoneroRpcConnection"));
var _MoneroSubmitTxResult = _interopRequireDefault(require("./model/MoneroSubmitTxResult"));
var _MoneroTx = _interopRequireDefault(require("./model/MoneroTx"));
var _MoneroTxPoolStats = _interopRequireDefault(require("./model/MoneroTxPoolStats"));
var _MoneroUtils = _interopRequireDefault(require("../common/MoneroUtils"));
var _MoneroVersion = _interopRequireDefault(require("./model/MoneroVersion"));


/**
 * Copyright (c) woodser
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Implements a MoneroDaemon as a client of monerod.
 */
class MoneroDaemonRpc extends _MoneroDaemon.default {

  // static variables
  static MAX_REQ_SIZE = "3000000";
  static DEFAULT_ID = "0000000000000000000000000000000000000000000000000000000000000000"; // uninitialized tx or block hash from daemon rpc
  static NUM_HEADERS_PER_REQ = 750; // number of headers to fetch and cache per request
  static DEFAULT_POLL_PERIOD = 20000; // default interval between polling the daemon in ms

  // instance variables







  /** @private */
  constructor(config, proxyDaemon) {
    super();
    this.config = config;
    this.proxyDaemon = proxyDaemon;
    if (config.proxyToWorker) return;
    this.listeners = []; // block listeners
    this.cachedHeaders = {}; // cached headers for fetching blocks in bound chunks
  }

  /**
   * Get the internal process running monerod.
   * 
   * @return {ChildProcess} the node process running monerod, undefined if not created from new process
   */
  getProcess() {
    return this.process;
  }

  /**
   * Stop the internal process running monerod, if applicable.
   * 
   * @param {boolean} [force] specifies if the process should be destroyed forcibly (default false)
   * @return {Promise<number | undefined>} the exit code from stopping the process
   */
  async stopProcess(force = false) {
    if (this.process === undefined) throw new _MoneroError.default("MoneroDaemonRpc instance not created from new process");
    let listenersCopy = _GenUtils.default.copyArray(await this.getListeners());
    for (let listener of listenersCopy) await this.removeListener(listener);
    return _GenUtils.default.killProcess(this.process, force ? "SIGKILL" : undefined);
  }

  async addListener(listener) {
    if (this.config.proxyToWorker) return this.proxyDaemon.addListener(listener);
    (0, _assert.default)(listener instanceof _MoneroDaemonListener.default, "Listener must be instance of MoneroDaemonListener");
    this.listeners.push(listener);
    this.refreshListening();
  }

  async removeListener(listener) {
    if (this.config.proxyToWorker) return this.proxyDaemon.removeListener(listener);
    (0, _assert.default)(listener instanceof _MoneroDaemonListener.default, "Listener must be instance of MoneroDaemonListener");
    let idx = this.listeners.indexOf(listener);
    if (idx > -1) this.listeners.splice(idx, 1);else
    throw new _MoneroError.default("Listener is not registered with daemon");
    this.refreshListening();
  }

  getListeners() {
    if (this.config.proxyToWorker) return this.proxyDaemon.getListeners();
    return this.listeners;
  }

  /**
   * Get the daemon's RPC connection.
   * 
   * @return {MoneroRpcConnection} the daemon's rpc connection
   */
  async getRpcConnection() {
    if (this.config.proxyToWorker) return this.proxyDaemon.getRpcConnection();
    return this.config.getServer();
  }

  async isConnected() {
    if (this.config.proxyToWorker) return this.proxyDaemon.isConnected();
    try {
      await this.getVersion();
      return true;
    } catch (e) {
      return false;
    }
  }

  async getVersion() {
    if (this.config.proxyToWorker) return this.proxyDaemon.getVersion();
    let resp = await this.config.getServer().sendJsonRequest("get_version");
    MoneroDaemonRpc.checkResponseStatus(resp.result);
    return new _MoneroVersion.default(resp.result.version, resp.result.release);
  }

  async isTrusted() {
    if (this.config.proxyToWorker) return this.proxyDaemon.isTrusted();
    let resp = await this.config.getServer().sendPathRequest("get_height");
    MoneroDaemonRpc.checkResponseStatus(resp);
    return !resp.untrusted;
  }

  async getHeight() {
    if (this.config.proxyToWorker) return this.proxyDaemon.getHeight();
    let resp = await this.config.getServer().sendJsonRequest("get_block_count");
    MoneroDaemonRpc.checkResponseStatus(resp.result);
    return resp.result.count;
  }

  async getBlockHash(height) {
    if (this.config.proxyToWorker) return this.proxyDaemon.getBlockHash(height);
    return (await this.config.getServer().sendJsonRequest("on_get_block_hash", [height])).result; // TODO monero-wallet-rpc: no status returned
  }

  async getBlockTemplate(walletAddress, reserveSize) {
    if (this.config.proxyToWorker) return this.proxyDaemon.getBlockTemplate(walletAddress, reserveSize);
    (0, _assert.default)(walletAddress && typeof walletAddress === "string", "Must specify wallet address to be mined to");
    let resp = await this.config.getServer().sendJsonRequest("get_block_template", { wallet_address: walletAddress, reserve_size: reserveSize });
    MoneroDaemonRpc.checkResponseStatus(resp.result);
    return MoneroDaemonRpc.convertRpcBlockTemplate(resp.result);
  }

  async getLastBlockHeader() {
    if (this.config.proxyToWorker) return this.proxyDaemon.getLastBlockHeader();
    let resp = await this.config.getServer().sendJsonRequest("get_last_block_header");
    MoneroDaemonRpc.checkResponseStatus(resp.result);
    return MoneroDaemonRpc.convertRpcBlockHeader(resp.result.block_header);
  }

  async getBlockHeaderByHash(blockHash) {
    if (this.config.proxyToWorker) return this.proxyDaemon.getBlockHeaderByHash(blockHash);
    let resp = await this.config.getServer().sendJsonRequest("get_block_header_by_hash", { hash: blockHash });
    MoneroDaemonRpc.checkResponseStatus(resp.result);
    return MoneroDaemonRpc.convertRpcBlockHeader(resp.result.block_header);
  }

  async getBlockHeaderByHeight(height) {
    if (this.config.proxyToWorker) return this.proxyDaemon.getBlockHeaderByHeight(height);
    let resp = await this.config.getServer().sendJsonRequest("get_block_header_by_height", { height: height });
    MoneroDaemonRpc.checkResponseStatus(resp.result);
    return MoneroDaemonRpc.convertRpcBlockHeader(resp.result.block_header);
  }

  async getBlockHeadersByRange(startHeight, endHeight) {
    if (this.config.proxyToWorker) return this.proxyDaemon.getBlockHeadersByRange(startHeight, endHeight);

    // fetch block headers
    let resp = await this.config.getServer().sendJsonRequest("get_block_headers_range", {
      start_height: startHeight,
      end_height: endHeight
    });
    MoneroDaemonRpc.checkResponseStatus(resp.result);

    // build headers
    let headers = [];
    for (let rpcHeader of resp.result.headers) {
      headers.push(MoneroDaemonRpc.convertRpcBlockHeader(rpcHeader));
    }
    return headers;
  }

  async getBlockByHash(blockHash) {
    if (this.config.proxyToWorker) return this.proxyDaemon.getBlockByHash(blockHash);
    let resp = await this.config.getServer().sendJsonRequest("get_block", { hash: blockHash });
    MoneroDaemonRpc.checkResponseStatus(resp.result);
    return MoneroDaemonRpc.convertRpcBlock(resp.result);
  }

  async getBlockByHeight(height) {
    if (this.config.proxyToWorker) return this.proxyDaemon.getBlockByHeight(height);
    let resp = await this.config.getServer().sendJsonRequest("get_block", { height: height });
    MoneroDaemonRpc.checkResponseStatus(resp.result);
    return MoneroDaemonRpc.convertRpcBlock(resp.result);
  }

  async getBlocksByHeight(heights) {
    if (this.config.proxyToWorker) return this.proxyDaemon.getBlocksByHeight(heights);

    // fetch blocks in binary
    let respBin = await this.config.getServer().sendBinaryRequest("get_blocks_by_height.bin", { heights: heights });

    // convert binary blocks to json
    let rpcBlocks = await _MoneroUtils.default.binaryBlocksToJson(respBin);
    MoneroDaemonRpc.checkResponseStatus(rpcBlocks);

    // build blocks with transactions
    _assert.default.equal(rpcBlocks.txs.length, rpcBlocks.blocks.length);
    let blocks = [];
    for (let blockIdx = 0; blockIdx < rpcBlocks.blocks.length; blockIdx++) {

      // build block
      let block = MoneroDaemonRpc.convertRpcBlock(rpcBlocks.blocks[blockIdx]);
      block.setHeight(heights[blockIdx]);
      blocks.push(block);

      // build transactions
      let txs = [];
      for (let txIdx = 0; txIdx < rpcBlocks.txs[blockIdx].length; txIdx++) {
        let tx = new _MoneroTx.default();
        txs.push(tx);
        tx.setHash(rpcBlocks.blocks[blockIdx].tx_hashes[txIdx]);
        tx.setIsConfirmed(true);
        tx.setInTxPool(false);
        tx.setIsMinerTx(false);
        tx.setRelay(true);
        tx.setIsRelayed(true);
        tx.setIsFailed(false);
        tx.setIsDoubleSpendSeen(false);
        MoneroDaemonRpc.convertRpcTx(rpcBlocks.txs[blockIdx][txIdx], tx);
      }

      // merge into one block
      block.setTxs([]);
      for (let tx of txs) {
        if (tx.getBlock()) block.merge(tx.getBlock());else
        block.getTxs().push(tx.setBlock(block));
      }
    }

    return blocks;
  }

  async getBlocksByRange(startHeight, endHeight) {
    if (this.config.proxyToWorker) return this.proxyDaemon.getBlocksByRange(startHeight, endHeight);
    if (startHeight === undefined) startHeight = 0;
    if (endHeight === undefined) endHeight = (await this.getHeight()) - 1;
    let heights = [];
    for (let height = startHeight; height <= endHeight; height++) heights.push(height);
    return await this.getBlocksByHeight(heights);
  }

  async getBlocksByRangeChunked(startHeight, endHeight, maxChunkSize) {
    if (this.config.proxyToWorker) return this.proxyDaemon.getBlocksByRangeChunked(startHeight, endHeight, maxChunkSize);
    if (startHeight === undefined) startHeight = 0;
    if (endHeight === undefined) endHeight = (await this.getHeight()) - 1;
    let lastHeight = startHeight - 1;
    let blocks = [];
    while (lastHeight < endHeight) {
      for (let block of await this.getMaxBlocks(lastHeight + 1, endHeight, maxChunkSize)) {
        blocks.push(block);
      }
      lastHeight = blocks[blocks.length - 1].getHeight();
    }
    return blocks;
  }

  async getTxs(txHashes, prune = false) {
    if (this.config.proxyToWorker) return this.proxyDaemon.getTxs(txHashes, prune);

    // validate input
    (0, _assert.default)(Array.isArray(txHashes) && txHashes.length > 0, "Must provide an array of transaction hashes");
    (0, _assert.default)(prune === undefined || typeof prune === "boolean", "Prune must be a boolean or undefined");

    // fetch transactions
    let resp = await this.config.getServer().sendPathRequest("get_transactions", {
      txs_hashes: txHashes,
      decode_as_json: true,
      prune: prune
    });
    try {
      MoneroDaemonRpc.checkResponseStatus(resp);
    } catch (e) {
      if (e.message.indexOf("Failed to parse hex representation of transaction hash") >= 0) throw new _MoneroError.default("Invalid transaction hash");
      throw e;
    }

    // build transaction models
    let txs = [];
    if (resp.txs) {
      for (let txIdx = 0; txIdx < resp.txs.length; txIdx++) {
        let tx = new _MoneroTx.default();
        tx.setIsMinerTx(false);
        txs.push(MoneroDaemonRpc.convertRpcTx(resp.txs[txIdx], tx));
      }
    }

    return txs;
  }

  async getTxHexes(txHashes, prune = false) {
    if (this.config.proxyToWorker) return this.proxyDaemon.getTxHexes(txHashes, prune);
    let hexes = [];
    for (let tx of await this.getTxs(txHashes, prune)) hexes.push(prune ? tx.getPrunedHex() : tx.getFullHex());
    return hexes;
  }

  async getMinerTxSum(height, numBlocks) {
    if (this.config.proxyToWorker) return this.proxyDaemon.getMinerTxSum(height, numBlocks);
    if (height === undefined) height = 0;else
    (0, _assert.default)(height >= 0, "Height must be an integer >= 0");
    if (numBlocks === undefined) numBlocks = await this.getHeight();else
    (0, _assert.default)(numBlocks >= 0, "Count must be an integer >= 0");
    let resp = await this.config.getServer().sendJsonRequest("get_coinbase_tx_sum", { height: height, count: numBlocks });
    MoneroDaemonRpc.checkResponseStatus(resp.result);
    let txSum = new _MoneroMinerTxSum.default();
    txSum.setEmissionSum(BigInt(resp.result.emission_amount));
    txSum.setFeeSum(BigInt(resp.result.fee_amount));
    return txSum;
  }

  async getFeeEstimate(graceBlocks) {
    if (this.config.proxyToWorker) return this.proxyDaemon.getFeeEstimate(graceBlocks);
    let resp = await this.config.getServer().sendJsonRequest("get_fee_estimate", { grace_blocks: graceBlocks });
    MoneroDaemonRpc.checkResponseStatus(resp.result);
    let feeEstimate = new _MoneroFeeEstimate.default();
    feeEstimate.setFee(BigInt(resp.result.fee));
    let fees = [];
    for (let i = 0; i < resp.result.fees.length; i++) fees.push(BigInt(resp.result.fees[i]));
    feeEstimate.setFees(fees);
    feeEstimate.setQuantizationMask(BigInt(resp.result.quantization_mask));
    return feeEstimate;
  }

  async submitTxHex(txHex, doNotRelay) {
    if (this.config.proxyToWorker) return this.proxyDaemon.submitTxHex(txHex, doNotRelay);
    let resp = await this.config.getServer().sendPathRequest("send_raw_transaction", { tx_as_hex: txHex, do_not_relay: doNotRelay });
    let result = MoneroDaemonRpc.convertRpcSubmitTxResult(resp);

    // set isGood based on status
    try {
      MoneroDaemonRpc.checkResponseStatus(resp);
      result.setIsGood(true);
    } catch (e) {
      result.setIsGood(false);
    }
    return result;
  }

  async relayTxsByHash(txHashes) {
    if (this.config.proxyToWorker) return this.proxyDaemon.relayTxsByHash(txHashes);
    let resp = await this.config.getServer().sendJsonRequest("relay_tx", { txids: txHashes });
    MoneroDaemonRpc.checkResponseStatus(resp.result);
  }

  async getTxPool() {
    if (this.config.proxyToWorker) return this.proxyDaemon.getTxPool();

    // send rpc request
    let resp = await this.config.getServer().sendPathRequest("get_transaction_pool");
    MoneroDaemonRpc.checkResponseStatus(resp);

    // build txs
    let txs = [];
    if (resp.transactions) {
      for (let rpcTx of resp.transactions) {
        let tx = new _MoneroTx.default();
        txs.push(tx);
        tx.setIsConfirmed(false);
        tx.setIsMinerTx(false);
        tx.setInTxPool(true);
        tx.setNumConfirmations(0);
        MoneroDaemonRpc.convertRpcTx(rpcTx, tx);
      }
    }

    return txs;
  }

  async getTxPoolHashes() {
    throw new _MoneroError.default("Not implemented");
  }

  // async getTxPoolBacklog(): Promise<MoneroTxBacklogEntry[]> {
  //   throw new MoneroError("Not implemented");
  // }

  async getTxPoolStats() {
    if (this.config.proxyToWorker) return this.proxyDaemon.getTxPoolStats();
    let resp = await this.config.getServer().sendPathRequest("get_transaction_pool_stats");
    MoneroDaemonRpc.checkResponseStatus(resp);
    return MoneroDaemonRpc.convertRpcTxPoolStats(resp.pool_stats);
  }

  async flushTxPool(hashes) {
    if (this.config.proxyToWorker) return this.proxyDaemon.flushTxPool(hashes);
    if (hashes) hashes = _GenUtils.default.listify(hashes);
    let resp = await this.config.getServer().sendJsonRequest("flush_txpool", { txids: hashes });
    MoneroDaemonRpc.checkResponseStatus(resp.result);
  }

  async getKeyImageSpentStatuses(keyImages) {
    if (this.config.proxyToWorker) return this.proxyDaemon.getKeyImageSpentStatuses(keyImages);
    if (keyImages === undefined || keyImages.length === 0) throw new _MoneroError.default("Must provide key images to check the status of");
    let resp = await this.config.getServer().sendPathRequest("is_key_image_spent", { key_images: keyImages });
    MoneroDaemonRpc.checkResponseStatus(resp);
    return resp.spent_status;
  }

  async getOutputHistogram(amounts, minCount, maxCount, isUnlocked, recentCutoff) {
    if (this.config.proxyToWorker) return this.proxyDaemon.getOutputHistogram(amounts, minCount, maxCount, isUnlocked, recentCutoff);

    // send rpc request
    let resp = await this.config.getServer().sendJsonRequest("get_output_histogram", {
      amounts: amounts,
      min_count: minCount,
      max_count: maxCount,
      unlocked: isUnlocked,
      recent_cutoff: recentCutoff
    });
    MoneroDaemonRpc.checkResponseStatus(resp.result);

    // build histogram entries from response
    let entries = [];
    if (!resp.result.histogram) return entries;
    for (let rpcEntry of resp.result.histogram) {
      entries.push(MoneroDaemonRpc.convertRpcOutputHistogramEntry(rpcEntry));
    }
    return entries;
  }

  async getOutputDistribution(amounts, cumulative, startHeight, endHeight) {
    if (this.config.proxyToWorker) return this.proxyDaemon.getOutputDistribution(amounts, cumulative, startHeight, endHeight);
    throw new _MoneroError.default("Not implemented (response 'distribution' field is binary)");

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
    //    let resp = await this.config.getServer().sendJsonRequest("get_output_distribution", {
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
    //    if (!resp.result.distributions) return entries; 
    //    for (let rpcEntry of resp.result.distributions) {
    //      let entry = MoneroDaemonRpc.convertRpcOutputDistributionEntry(rpcEntry);
    //      entries.push(entry);
    //    }
    //    return entries;
  }

  async getInfo() {
    if (this.config.proxyToWorker) return this.proxyDaemon.getInfo();
    let resp = await this.config.getServer().sendJsonRequest("get_info");
    MoneroDaemonRpc.checkResponseStatus(resp.result);
    return MoneroDaemonRpc.convertRpcInfo(resp.result);
  }

  async getSyncInfo() {
    if (this.config.proxyToWorker) return this.proxyDaemon.getSyncInfo();
    let resp = await this.config.getServer().sendJsonRequest("sync_info");
    MoneroDaemonRpc.checkResponseStatus(resp.result);
    return MoneroDaemonRpc.convertRpcSyncInfo(resp.result);
  }

  async getHardForkInfo() {
    if (this.config.proxyToWorker) return this.proxyDaemon.getHardForkInfo();
    let resp = await this.config.getServer().sendJsonRequest("hard_fork_info");
    MoneroDaemonRpc.checkResponseStatus(resp.result);
    return MoneroDaemonRpc.convertRpcHardForkInfo(resp.result);
  }

  async getAltChains() {
    if (this.config.proxyToWorker) return this.proxyDaemon.getAltChains();

    //    // mocked response for test
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

    let resp = await this.config.getServer().sendJsonRequest("get_alternate_chains");
    MoneroDaemonRpc.checkResponseStatus(resp.result);
    let chains = [];
    if (!resp.result.chains) return chains;
    for (let rpcChain of resp.result.chains) chains.push(MoneroDaemonRpc.convertRpcAltChain(rpcChain));
    return chains;
  }

  async getAltBlockHashes() {
    if (this.config.proxyToWorker) return this.proxyDaemon.getAltBlockHashes();

    //    // mocked response for test
    //    let resp = {
    //        status: "OK",
    //        untrusted: false,
    //        blks_hashes: ["9c2277c5470234be8b32382cdf8094a103aba4fcd5e875a6fc159dc2ec00e011","637c0e0f0558e284493f38a5fcca3615db59458d90d3a5eff0a18ff59b83f46f","6f3adc174a2e8082819ebb965c96a095e3e8b63929ad9be2d705ad9c086a6b1c","697cf03c89a9b118f7bdf11b1b3a6a028d7b3617d2d0ed91322c5709acf75625"]
    //    }

    let resp = await this.config.getServer().sendPathRequest("get_alt_blocks_hashes");
    MoneroDaemonRpc.checkResponseStatus(resp);
    if (!resp.blks_hashes) return [];
    return resp.blks_hashes;
  }

  async getDownloadLimit() {
    if (this.config.proxyToWorker) return this.proxyDaemon.getDownloadLimit();
    return (await this.getBandwidthLimits())[0];
  }

  async setDownloadLimit(limit) {
    if (this.config.proxyToWorker) return this.proxyDaemon.setDownloadLimit(limit);
    if (limit == -1) return await this.resetDownloadLimit();
    if (!(_GenUtils.default.isInt(limit) && limit > 0)) throw new _MoneroError.default("Download limit must be an integer greater than 0");
    return (await this.setBandwidthLimits(limit, 0))[0];
  }

  async resetDownloadLimit() {
    if (this.config.proxyToWorker) return this.proxyDaemon.resetDownloadLimit();
    return (await this.setBandwidthLimits(-1, 0))[0];
  }

  async getUploadLimit() {
    if (this.config.proxyToWorker) return this.proxyDaemon.getUploadLimit();
    return (await this.getBandwidthLimits())[1];
  }

  async setUploadLimit(limit) {
    if (this.config.proxyToWorker) return this.proxyDaemon.setUploadLimit(limit);
    if (limit == -1) return await this.resetUploadLimit();
    if (!(_GenUtils.default.isInt(limit) && limit > 0)) throw new _MoneroError.default("Upload limit must be an integer greater than 0");
    return (await this.setBandwidthLimits(0, limit))[1];
  }

  async resetUploadLimit() {
    if (this.config.proxyToWorker) return this.proxyDaemon.resetUploadLimit();
    return (await this.setBandwidthLimits(0, -1))[1];
  }

  async getPeers() {
    if (this.config.proxyToWorker) return this.proxyDaemon.getPeers();
    let resp = await this.config.getServer().sendJsonRequest("get_connections");
    MoneroDaemonRpc.checkResponseStatus(resp.result);
    let peers = [];
    if (!resp.result.connections) return peers;
    for (let rpcConnection of resp.result.connections) {
      peers.push(MoneroDaemonRpc.convertRpcConnection(rpcConnection));
    }
    return peers;
  }

  async getKnownPeers() {
    if (this.config.proxyToWorker) return this.proxyDaemon.getKnownPeers();

    // tx config
    let resp = await this.config.getServer().sendPathRequest("get_peer_list");
    MoneroDaemonRpc.checkResponseStatus(resp);

    // build peers
    let peers = [];
    if (resp.gray_list) {
      for (let rpcPeer of resp.gray_list) {
        let peer = MoneroDaemonRpc.convertRpcPeer(rpcPeer);
        peer.setIsOnline(false); // gray list means offline last checked
        peers.push(peer);
      }
    }
    if (resp.white_list) {
      for (let rpcPeer of resp.white_list) {
        let peer = MoneroDaemonRpc.convertRpcPeer(rpcPeer);
        peer.setIsOnline(true); // white list means online last checked
        peers.push(peer);
      }
    }
    return peers;
  }

  async setOutgoingPeerLimit(limit) {
    if (this.config.proxyToWorker) return this.proxyDaemon.setOutgoingPeerLimit(limit);
    if (!(_GenUtils.default.isInt(limit) && limit >= 0)) throw new _MoneroError.default("Outgoing peer limit must be >= 0");
    let resp = await this.config.getServer().sendPathRequest("out_peers", { out_peers: limit });
    MoneroDaemonRpc.checkResponseStatus(resp);
  }

  async setIncomingPeerLimit(limit) {
    if (this.config.proxyToWorker) return this.proxyDaemon.setIncomingPeerLimit(limit);
    if (!(_GenUtils.default.isInt(limit) && limit >= 0)) throw new _MoneroError.default("Incoming peer limit must be >= 0");
    let resp = await this.config.getServer().sendPathRequest("in_peers", { in_peers: limit });
    MoneroDaemonRpc.checkResponseStatus(resp);
  }

  async getPeerBans() {
    if (this.config.proxyToWorker) return this.proxyDaemon.getPeerBans();
    let resp = await this.config.getServer().sendJsonRequest("get_bans");
    MoneroDaemonRpc.checkResponseStatus(resp.result);
    let bans = [];
    for (let rpcBan of resp.result.bans) {
      let ban = new _MoneroBan.default();
      ban.setHost(rpcBan.host);
      ban.setIp(rpcBan.ip);
      ban.setSeconds(rpcBan.seconds);
      bans.push(ban);
    }
    return bans;
  }

  async setPeerBans(bans) {
    if (this.config.proxyToWorker) return this.proxyDaemon.setPeerBans(bans);
    let rpcBans = [];
    for (let ban of bans) rpcBans.push(MoneroDaemonRpc.convertToRpcBan(ban));
    let resp = await this.config.getServer().sendJsonRequest("set_bans", { bans: rpcBans });
    MoneroDaemonRpc.checkResponseStatus(resp.result);
  }

  async startMining(address, numThreads, isBackground, ignoreBattery) {
    if (this.config.proxyToWorker) return this.proxyDaemon.startMining(address, numThreads, isBackground, ignoreBattery);
    (0, _assert.default)(address, "Must provide address to mine to");
    (0, _assert.default)(_GenUtils.default.isInt(numThreads) && numThreads > 0, "Number of threads must be an integer greater than 0");
    (0, _assert.default)(isBackground === undefined || typeof isBackground === "boolean");
    (0, _assert.default)(ignoreBattery === undefined || typeof ignoreBattery === "boolean");
    let resp = await this.config.getServer().sendPathRequest("start_mining", {
      miner_address: address,
      threads_count: numThreads,
      do_background_mining: isBackground,
      ignore_battery: ignoreBattery
    });
    MoneroDaemonRpc.checkResponseStatus(resp);
  }

  async stopMining() {
    if (this.config.proxyToWorker) return this.proxyDaemon.stopMining();
    let resp = await this.config.getServer().sendPathRequest("stop_mining");
    MoneroDaemonRpc.checkResponseStatus(resp);
  }

  async getMiningStatus() {
    if (this.config.proxyToWorker) return this.proxyDaemon.getMiningStatus();
    let resp = await this.config.getServer().sendPathRequest("mining_status");
    MoneroDaemonRpc.checkResponseStatus(resp);
    return MoneroDaemonRpc.convertRpcMiningStatus(resp);
  }

  async submitBlocks(blockBlobs) {
    if (this.config.proxyToWorker) return this.proxyDaemon.submitBlocks();
    (0, _assert.default)(Array.isArray(blockBlobs) && blockBlobs.length > 0, "Must provide an array of mined block blobs to submit");
    let resp = await this.config.getServer().sendJsonRequest("submit_block", blockBlobs);
    MoneroDaemonRpc.checkResponseStatus(resp.result);
  }

  async pruneBlockchain(check) {
    if (this.config.proxyToWorker) return this.proxyDaemon.pruneBlockchain();
    let resp = await this.config.getServer().sendJsonRequest("prune_blockchain", { check: check }, 0);
    MoneroDaemonRpc.checkResponseStatus(resp.result);
    let result = new _MoneroPruneResult.default();
    result.setIsPruned(resp.result.pruned);
    result.setPruningSeed(resp.result.pruning_seed);
    return result;
  }

  async checkForUpdate() {
    if (this.config.proxyToWorker) return this.proxyDaemon.checkForUpdate();
    let resp = await this.config.getServer().sendPathRequest("update", { command: "check" });
    MoneroDaemonRpc.checkResponseStatus(resp);
    return MoneroDaemonRpc.convertRpcUpdateCheckResult(resp);
  }

  async downloadUpdate(path) {
    if (this.config.proxyToWorker) return this.proxyDaemon.downloadUpdate(path);
    let resp = await this.config.getServer().sendPathRequest("update", { command: "download", path: path });
    MoneroDaemonRpc.checkResponseStatus(resp);
    return MoneroDaemonRpc.convertRpcUpdateDownloadResult(resp);
  }

  async stop() {
    if (this.config.proxyToWorker) return this.proxyDaemon.stop();
    let resp = await this.config.getServer().sendPathRequest("stop_daemon");
    MoneroDaemonRpc.checkResponseStatus(resp);
  }

  async waitForNextBlockHeader() {
    if (this.config.proxyToWorker) return this.proxyDaemon.waitForNextBlockHeader();
    let that = this;
    return new Promise(async function (resolve) {
      await that.addListener(new class extends _MoneroDaemonListener.default {
        async onBlockHeader(header) {
          await that.removeListener(this);
          resolve(header);
        }
      }());
    });
  }

  getPollInterval() {
    return this.config.pollInterval;
  }

  // ----------- ADD JSDOC FOR SUPPORTED DEFAULT IMPLEMENTATIONS --------------
  async getTx(txHash, prune = false) {return super.getTx(txHash, prune);}
  async getTxHex(txHash, prune = false) {return super.getTxHex(txHash, prune);}
  async getKeyImageSpentStatus(keyImage) {return super.getKeyImageSpentStatus(keyImage);}
  async setPeerBan(ban) {return super.setPeerBan(ban);}
  async submitBlock(blockBlob) {return super.submitBlock(blockBlob);}

  // ------------------------------- PRIVATE ----------------------------------

  refreshListening() {
    if (this.pollListener == undefined && this.listeners.length) this.pollListener = new DaemonPoller(this);
    if (this.pollListener !== undefined) this.pollListener.setIsPolling(this.listeners.length > 0);
  }

  async getBandwidthLimits() {
    let resp = await this.config.getServer().sendPathRequest("get_limit");
    MoneroDaemonRpc.checkResponseStatus(resp);
    return [resp.limit_down, resp.limit_up];
  }

  async setBandwidthLimits(downLimit, upLimit) {
    if (downLimit === undefined) downLimit = 0;
    if (upLimit === undefined) upLimit = 0;
    let resp = await this.config.getServer().sendPathRequest("set_limit", { limit_down: downLimit, limit_up: upLimit });
    MoneroDaemonRpc.checkResponseStatus(resp);
    return [resp.limit_down, resp.limit_up];
  }

  /**
   * Get a contiguous chunk of blocks starting from a given height up to a maximum
   * height or amount of block data fetched from the blockchain, whichever comes first.
   * 
   * @param {number} [startHeight] - start height to retrieve blocks (default 0)
   * @param {number} [maxHeight] - maximum end height to retrieve blocks (default blockchain height)
   * @param {number} [maxReqSize] - maximum amount of block data to fetch from the blockchain in bytes (default 3,000,000 bytes)
   * @return {MoneroBlock[]} are the resulting chunk of blocks
   */
  async getMaxBlocks(startHeight, maxHeight, maxReqSize) {
    if (startHeight === undefined) startHeight = 0;
    if (maxHeight === undefined) maxHeight = (await this.getHeight()) - 1;
    if (maxReqSize === undefined) maxReqSize = MoneroDaemonRpc.MAX_REQ_SIZE;

    // determine end height to fetch
    let reqSize = 0;
    let endHeight = startHeight - 1;
    while (reqSize < maxReqSize && endHeight < maxHeight) {

      // get header of next block
      let header = await this.getBlockHeaderByHeightCached(endHeight + 1, maxHeight);

      // block cannot be bigger than max request size
      (0, _assert.default)(header.getSize() <= maxReqSize, "Block exceeds maximum request size: " + header.getSize());

      // done iterating if fetching block would exceed max request size
      if (reqSize + header.getSize() > maxReqSize) break;

      // otherwise block is included
      reqSize += header.getSize();
      endHeight++;
    }
    return endHeight >= startHeight ? await this.getBlocksByRange(startHeight, endHeight) : [];
  }

  /**
   * Retrieves a header by height from the cache or fetches and caches a header
   * range if not already in the cache.
   * 
   * @param {number} height - height of the header to retrieve from the cache
   * @param {number} maxHeight - maximum height of headers to cache
   */
  async getBlockHeaderByHeightCached(height, maxHeight) {

    // get header from cache
    let cachedHeader = this.cachedHeaders[height];
    if (cachedHeader) return cachedHeader;

    // fetch and cache headers if not in cache
    let endHeight = Math.min(maxHeight, height + MoneroDaemonRpc.NUM_HEADERS_PER_REQ - 1); // TODO: could specify end height to cache to optimize small requests (would like to have time profiling in place though)
    let headers = await this.getBlockHeadersByRange(height, endHeight);
    for (let header of headers) {
      this.cachedHeaders[header.getHeight()] = header;
    }

    // return the cached header
    return this.cachedHeaders[height];
  }

  // --------------------------------- STATIC ---------------------------------

  static async connectToDaemonRpc(uriOrConfig, username, password) {
    let config = MoneroDaemonRpc.normalizeConfig(uriOrConfig, username, password);
    if (config.cmd) return MoneroDaemonRpc.startMonerodProcess(config);
    return new MoneroDaemonRpc(config, config.proxyToWorker ? await MoneroDaemonRpcProxy.connect(config) : undefined);
  }

  static async startMonerodProcess(config) {
    (0, _assert.default)(_GenUtils.default.isArray(config.cmd), "Must provide string array with command line parameters");

    // start process
    let childProcess = require('child_process').spawn(config.cmd[0], config.cmd.slice(1), {
      env: { ...process.env, LANG: 'en_US.UTF-8' } // scrape output in english
    });
    childProcess.stdout.setEncoding('utf8');
    childProcess.stderr.setEncoding('utf8');

    // return promise which resolves after starting monerod
    let uri;
    let output = "";
    try {
      return await new Promise(function (resolve, reject) {

        // handle stdout
        childProcess.stdout.on('data', async function (data) {
          let line = data.toString();
          _LibraryUtils.default.log(2, line);
          output += line + '\n'; // capture output in case of error

          // extract uri from e.g. "I Binding on 127.0.0.1 (IPv4):38085"
          let uriLineContains = "Binding on ";
          let uriLineContainsIdx = line.indexOf(uriLineContains);
          if (uriLineContainsIdx >= 0) {
            let host = line.substring(uriLineContainsIdx + uriLineContains.length, line.lastIndexOf(' '));
            let unformattedLine = line.replace(/\u001b\[.*?m/g, '').trim(); // remove color formatting
            let port = unformattedLine.substring(unformattedLine.lastIndexOf(':') + 1);
            let sslIdx = config.cmd.indexOf("--rpc-ssl");
            let sslEnabled = sslIdx >= 0 ? "enabled" == config.cmd[sslIdx + 1].toLowerCase() : false;
            uri = (sslEnabled ? "https" : "http") + "://" + host + ":" + port;
          }

          // read success message
          if (line.indexOf("core RPC server started ok") >= 0) {

            // get username and password from params
            let userPassIdx = config.cmd.indexOf("--rpc-login");
            let userPass = userPassIdx >= 0 ? config.cmd[userPassIdx + 1] : undefined;
            let username = userPass === undefined ? undefined : userPass.substring(0, userPass.indexOf(':'));
            let password = userPass === undefined ? undefined : userPass.substring(userPass.indexOf(':') + 1);

            // create client connected to internal process
            config = config.copy().setServer({ uri: uri, username: username, password: password, rejectUnauthorized: config.getServer() ? config.getServer().getRejectUnauthorized() : undefined });
            config.setProxyToWorker(config.proxyToWorker);
            config.cmd = undefined;
            let daemon = await MoneroDaemonRpc.connectToDaemonRpc(config);
            daemon.process = childProcess;

            // resolve promise with client connected to internal process 
            this.isResolved = true;
            resolve(daemon);
          }
        });

        // handle stderr
        childProcess.stderr.on('data', function (data) {
          if (_LibraryUtils.default.getLogLevel() >= 2) console.error(data);
        });

        // handle exit
        childProcess.on("exit", function (code) {
          if (!this.isResolved) reject(new Error("monerod process terminated with exit code " + code + (output ? ":\n\n" + output : "")));
        });

        // handle error
        childProcess.on("error", function (err) {
          if (err.message.indexOf("ENOENT") >= 0) reject(new Error("monerod does not exist at path '" + config.cmd[0] + "'"));
          if (!this.isResolved) reject(err);
        });

        // handle uncaught exception
        childProcess.on("uncaughtException", function (err, origin) {
          console.error("Uncaught exception in monerod process: " + err.message);
          console.error(origin);
          if (!this.isResolved) reject(err);
        });
      });
    } catch (err) {
      throw new _MoneroError.default(err.message);
    }
  }

  static normalizeConfig(uriOrConfig, username, password) {
    let config = undefined;
    if (typeof uriOrConfig === "string") {
      config = new _MoneroDaemonConfig.default({ server: new _MoneroRpcConnection.default(uriOrConfig, username, password) });
    } else if (uriOrConfig.uri !== undefined) {
      config = new _MoneroDaemonConfig.default({ server: new _MoneroRpcConnection.default(uriOrConfig) });

      // transfer worker proxy setting from rpc connection to daemon config
      config.setProxyToWorker(uriOrConfig.proxyToWorker);
      config.getServer().setProxyToWorker(_MoneroRpcConnection.default.DEFAULT_CONFIG.proxyToWorker);
    } else if (_GenUtils.default.isArray(uriOrConfig)) {
      config = new _MoneroDaemonConfig.default({ cmd: uriOrConfig });
    } else {
      config = new _MoneroDaemonConfig.default(uriOrConfig);
    }
    if (config.proxyToWorker === undefined) config.proxyToWorker = true;
    if (config.pollInterval === undefined) config.pollInterval = MoneroDaemonRpc.DEFAULT_POLL_PERIOD;
    return config;
  }

  static checkResponseStatus(resp) {
    if (resp.status !== "OK") throw new _MoneroError.default(resp.status);
  }

  static convertRpcBlockHeader(rpcHeader) {
    if (!rpcHeader) return undefined;
    let header = new _MoneroBlockHeader.default();
    for (let key of Object.keys(rpcHeader)) {
      let val = rpcHeader[key];
      if (key === "block_size") _GenUtils.default.safeSet(header, header.getSize, header.setSize, val);else
      if (key === "depth") _GenUtils.default.safeSet(header, header.getDepth, header.setDepth, val);else
      if (key === "difficulty") {} // handled by wide_difficulty
      else if (key === "cumulative_difficulty") {} // handled by wide_cumulative_difficulty
      else if (key === "difficulty_top64") {} // handled by wide_difficulty
      else if (key === "cumulative_difficulty_top64") {} // handled by wide_cumulative_difficulty
      else if (key === "wide_difficulty") header.setDifficulty(_GenUtils.default.reconcile(header.getDifficulty(), MoneroDaemonRpc.prefixedHexToBI(val)));else
      if (key === "wide_cumulative_difficulty") header.setCumulativeDifficulty(_GenUtils.default.reconcile(header.getCumulativeDifficulty(), MoneroDaemonRpc.prefixedHexToBI(val)));else
      if (key === "hash") _GenUtils.default.safeSet(header, header.getHash, header.setHash, val);else
      if (key === "height") _GenUtils.default.safeSet(header, header.getHeight, header.setHeight, val);else
      if (key === "major_version") _GenUtils.default.safeSet(header, header.getMajorVersion, header.setMajorVersion, val);else
      if (key === "minor_version") _GenUtils.default.safeSet(header, header.getMinorVersion, header.setMinorVersion, val);else
      if (key === "nonce") _GenUtils.default.safeSet(header, header.getNonce, header.setNonce, val);else
      if (key === "num_txes") _GenUtils.default.safeSet(header, header.getNumTxs, header.setNumTxs, val);else
      if (key === "orphan_status") _GenUtils.default.safeSet(header, header.getOrphanStatus, header.setOrphanStatus, val);else
      if (key === "prev_hash" || key === "prev_id") _GenUtils.default.safeSet(header, header.getPrevHash, header.setPrevHash, val);else
      if (key === "reward") _GenUtils.default.safeSet(header, header.getReward, header.setReward, BigInt(val));else
      if (key === "timestamp") _GenUtils.default.safeSet(header, header.getTimestamp, header.setTimestamp, val);else
      if (key === "block_weight") _GenUtils.default.safeSet(header, header.getWeight, header.setWeight, val);else
      if (key === "long_term_weight") _GenUtils.default.safeSet(header, header.getLongTermWeight, header.setLongTermWeight, val);else
      if (key === "pow_hash") _GenUtils.default.safeSet(header, header.getPowHash, header.setPowHash, val === "" ? undefined : val);else
      if (key === "tx_hashes") {} // used in block model, not header model
      else if (key === "miner_tx") {} // used in block model, not header model
      else if (key === "miner_tx_hash") header.setMinerTxHash(val);else
      console.log("WARNING: ignoring unexpected block header field: '" + key + "': " + val);
    }
    return header;
  }

  static convertRpcBlock(rpcBlock) {

    // build block
    let block = new _MoneroBlock.default(MoneroDaemonRpc.convertRpcBlockHeader(rpcBlock.block_header ? rpcBlock.block_header : rpcBlock));
    block.setHex(rpcBlock.blob);
    block.setTxHashes(rpcBlock.tx_hashes === undefined ? [] : rpcBlock.tx_hashes);

    // build miner tx
    let rpcMinerTx = rpcBlock.json ? JSON.parse(rpcBlock.json).miner_tx : rpcBlock.miner_tx; // may need to be parsed from json
    let minerTx = new _MoneroTx.default();
    block.setMinerTx(minerTx);
    minerTx.setIsConfirmed(true);
    minerTx.setInTxPool(false);
    minerTx.setIsMinerTx(true);
    MoneroDaemonRpc.convertRpcTx(rpcMinerTx, minerTx);

    return block;
  }

  /**
   * Transfers RPC tx fields to a given MoneroTx without overwriting previous values.
   * 
   * TODO: switch from safe set
   * 
   * @param rpcTx - RPC map containing transaction fields
   * @param tx  - MoneroTx to populate with values (optional)
   * @return tx - same tx that was passed in or a new one if none given
   */
  static convertRpcTx(rpcTx, tx) {
    if (rpcTx === undefined) return undefined;
    if (tx === undefined) tx = new _MoneroTx.default();

    // initialize from rpc map
    let header;
    for (let key of Object.keys(rpcTx)) {
      let val = rpcTx[key];
      if (key === "tx_hash" || key === "id_hash") _GenUtils.default.safeSet(tx, tx.getHash, tx.setHash, val);else
      if (key === "block_timestamp") {
        if (!header) header = new _MoneroBlockHeader.default();
        _GenUtils.default.safeSet(header, header.getTimestamp, header.setTimestamp, val);
      } else
      if (key === "block_height") {
        if (!header) header = new _MoneroBlockHeader.default();
        _GenUtils.default.safeSet(header, header.getHeight, header.setHeight, val);
      } else
      if (key === "last_relayed_time") _GenUtils.default.safeSet(tx, tx.getLastRelayedTimestamp, tx.setLastRelayedTimestamp, val);else
      if (key === "receive_time" || key === "received_timestamp") _GenUtils.default.safeSet(tx, tx.getReceivedTimestamp, tx.setReceivedTimestamp, val);else
      if (key === "confirmations") _GenUtils.default.safeSet(tx, tx.getNumConfirmations, tx.setNumConfirmations, val);else
      if (key === "in_pool") {
        _GenUtils.default.safeSet(tx, tx.getIsConfirmed, tx.setIsConfirmed, !val);
        _GenUtils.default.safeSet(tx, tx.getInTxPool, tx.setInTxPool, val);
      } else
      if (key === "double_spend_seen") _GenUtils.default.safeSet(tx, tx.getIsDoubleSpendSeen, tx.setIsDoubleSpendSeen, val);else
      if (key === "version") _GenUtils.default.safeSet(tx, tx.getVersion, tx.setVersion, val);else
      if (key === "extra") {
        if (typeof val === "string") console.log("WARNING: extra field as string not being asigned to int[]: " + key + ": " + val); // TODO: how to set string to int[]? - or, extra is string which can encode int[]
        else _GenUtils.default.safeSet(tx, tx.getExtra, tx.setExtra, new Uint8Array(val));
      } else
      if (key === "vin") {
        if (val.length !== 1 || !val[0].gen) {// ignore miner input TODO: why?
          tx.setInputs(val.map((rpcVin) => MoneroDaemonRpc.convertRpcOutput(rpcVin, tx)));
        }
      } else
      if (key === "vout") tx.setOutputs(val.map((rpcOutput) => MoneroDaemonRpc.convertRpcOutput(rpcOutput, tx)));else
      if (key === "rct_signatures") {
        _GenUtils.default.safeSet(tx, tx.getRctSignatures, tx.setRctSignatures, val);
        if (val.txnFee) _GenUtils.default.safeSet(tx, tx.getFee, tx.setFee, BigInt(val.txnFee));
      } else
      if (key === "rctsig_prunable") _GenUtils.default.safeSet(tx, tx.getRctSigPrunable, tx.setRctSigPrunable, val);else
      if (key === "unlock_time") _GenUtils.default.safeSet(tx, tx.getUnlockTime, tx.setUnlockTime, val);else
      if (key === "as_json" || key === "tx_json") {} // handled last so tx is as initialized as possible
      else if (key === "as_hex" || key === "tx_blob") _GenUtils.default.safeSet(tx, tx.getFullHex, tx.setFullHex, val ? val : undefined);else
      if (key === "blob_size") _GenUtils.default.safeSet(tx, tx.getSize, tx.setSize, val);else
      if (key === "weight") _GenUtils.default.safeSet(tx, tx.getWeight, tx.setWeight, val);else
      if (key === "fee") _GenUtils.default.safeSet(tx, tx.getFee, tx.setFee, BigInt(val));else
      if (key === "relayed") _GenUtils.default.safeSet(tx, tx.getIsRelayed, tx.setIsRelayed, val);else
      if (key === "output_indices") _GenUtils.default.safeSet(tx, tx.getOutputIndices, tx.setOutputIndices, val);else
      if (key === "do_not_relay") _GenUtils.default.safeSet(tx, tx.getRelay, tx.setRelay, !val);else
      if (key === "kept_by_block") _GenUtils.default.safeSet(tx, tx.getIsKeptByBlock, tx.setIsKeptByBlock, val);else
      if (key === "signatures") _GenUtils.default.safeSet(tx, tx.getSignatures, tx.setSignatures, val);else
      if (key === "last_failed_height") {
        if (val === 0) _GenUtils.default.safeSet(tx, tx.getIsFailed, tx.setIsFailed, false);else
        {
          _GenUtils.default.safeSet(tx, tx.getIsFailed, tx.setIsFailed, true);
          _GenUtils.default.safeSet(tx, tx.getLastFailedHeight, tx.setLastFailedHeight, val);
        }
      } else
      if (key === "last_failed_id_hash") {
        if (val === MoneroDaemonRpc.DEFAULT_ID) _GenUtils.default.safeSet(tx, tx.getIsFailed, tx.setIsFailed, false);else
        {
          _GenUtils.default.safeSet(tx, tx.getIsFailed, tx.setIsFailed, true);
          _GenUtils.default.safeSet(tx, tx.getLastFailedHash, tx.setLastFailedHash, val);
        }
      } else
      if (key === "max_used_block_height") _GenUtils.default.safeSet(tx, tx.getMaxUsedBlockHeight, tx.setMaxUsedBlockHeight, val);else
      if (key === "max_used_block_id_hash") _GenUtils.default.safeSet(tx, tx.getMaxUsedBlockHash, tx.setMaxUsedBlockHash, val);else
      if (key === "prunable_hash") _GenUtils.default.safeSet(tx, tx.getPrunableHash, tx.setPrunableHash, val ? val : undefined);else
      if (key === "prunable_as_hex") _GenUtils.default.safeSet(tx, tx.getPrunableHex, tx.setPrunableHex, val ? val : undefined);else
      if (key === "pruned_as_hex") _GenUtils.default.safeSet(tx, tx.getPrunedHex, tx.setPrunedHex, val ? val : undefined);else
      console.log("WARNING: ignoring unexpected field in rpc tx: " + key + ": " + val);
    }

    // link block and tx
    if (header) tx.setBlock(new _MoneroBlock.default(header).setTxs([tx]));

    // TODO monerod: unconfirmed txs misreport block height and timestamp?
    if (tx.getBlock() && tx.getBlock().getHeight() !== undefined && tx.getBlock().getHeight() === tx.getBlock().getTimestamp()) {
      tx.setBlock(undefined);
      tx.setIsConfirmed(false);
    }

    // initialize remaining known fields
    if (tx.getIsConfirmed()) {
      _GenUtils.default.safeSet(tx, tx.getIsRelayed, tx.setIsRelayed, true);
      _GenUtils.default.safeSet(tx, tx.getRelay, tx.setRelay, true);
      _GenUtils.default.safeSet(tx, tx.getIsFailed, tx.setIsFailed, false);
    } else {
      tx.setNumConfirmations(0);
    }
    if (tx.getIsFailed() === undefined) tx.setIsFailed(false);
    if (tx.getOutputIndices() && tx.getOutputs()) {
      _assert.default.equal(tx.getOutputs().length, tx.getOutputIndices().length);
      for (let i = 0; i < tx.getOutputs().length; i++) {
        tx.getOutputs()[i].setIndex(tx.getOutputIndices()[i]); // transfer output indices to outputs
      }
    }
    if (rpcTx.as_json) MoneroDaemonRpc.convertRpcTx(JSON.parse(rpcTx.as_json), tx);
    if (rpcTx.tx_json) MoneroDaemonRpc.convertRpcTx(JSON.parse(rpcTx.tx_json), tx);
    if (!tx.getIsRelayed()) tx.setLastRelayedTimestamp(undefined); // TODO monerod: returns last_relayed_timestamp despite relayed: false, self inconsistent

    // return built transaction
    return tx;
  }

  static convertRpcOutput(rpcOutput, tx) {
    let output = new _MoneroOutput.default();
    output.setTx(tx);
    for (let key of Object.keys(rpcOutput)) {
      let val = rpcOutput[key];
      if (key === "gen") throw new _MoneroError.default("Output with 'gen' from daemon rpc is miner tx which we ignore (i.e. each miner input is undefined)");else
      if (key === "key") {
        _GenUtils.default.safeSet(output, output.getAmount, output.setAmount, BigInt(val.amount));
        _GenUtils.default.safeSet(output, output.getKeyImage, output.setKeyImage, new _MoneroKeyImage.default(val.k_image));
        _GenUtils.default.safeSet(output, output.getRingOutputIndices, output.setRingOutputIndices, val.key_offsets);
      } else
      if (key === "amount") _GenUtils.default.safeSet(output, output.getAmount, output.setAmount, BigInt(val));else
      if (key === "target") {
        let pubKey = val.key === undefined ? val.tagged_key.key : val.key; // TODO (monerod): rpc json uses {tagged_key={key=...}}, binary blocks use {key=...}
        _GenUtils.default.safeSet(output, output.getStealthPublicKey, output.setStealthPublicKey, pubKey);
      } else
      console.log("WARNING: ignoring unexpected field output: " + key + ": " + val);
    }
    return output;
  }

  static convertRpcBlockTemplate(rpcTemplate) {
    let template = new _MoneroBlockTemplate.default();
    for (let key of Object.keys(rpcTemplate)) {
      let val = rpcTemplate[key];
      if (key === "blockhashing_blob") template.setBlockTemplateBlob(val);else
      if (key === "blocktemplate_blob") template.setBlockHashingBlob(val);else
      if (key === "difficulty") template.setDifficulty(BigInt(val));else
      if (key === "expected_reward") template.setExpectedReward(val);else
      if (key === "difficulty") {} // handled by wide_difficulty
      else if (key === "difficulty_top64") {} // handled by wide_difficulty
      else if (key === "wide_difficulty") template.setDifficulty(_GenUtils.default.reconcile(template.getDifficulty(), MoneroDaemonRpc.prefixedHexToBI(val)));else
      if (key === "height") template.setHeight(val);else
      if (key === "prev_hash") template.setPrevHash(val);else
      if (key === "reserved_offset") template.setReservedOffset(val);else
      if (key === "status") {} // handled elsewhere
      else if (key === "untrusted") {} // handled elsewhere
      else if (key === "seed_height") template.setSeedHeight(val);else
      if (key === "seed_hash") template.setSeedHash(val);else
      if (key === "next_seed_hash") template.setNextSeedHash(val);else
      console.log("WARNING: ignoring unexpected field in block template: " + key + ": " + val);
    }
    if ("" === template.getNextSeedHash()) template.setNextSeedHash(undefined);
    return template;
  }

  static convertRpcInfo(rpcInfo) {
    if (!rpcInfo) return undefined;
    let info = new _MoneroDaemonInfo.default();
    for (let key of Object.keys(rpcInfo)) {
      let val = rpcInfo[key];
      if (key === "version") info.setVersion(val);else
      if (key === "alt_blocks_count") info.setNumAltBlocks(val);else
      if (key === "block_size_limit") info.setBlockSizeLimit(val);else
      if (key === "block_size_median") info.setBlockSizeMedian(val);else
      if (key === "block_weight_limit") info.setBlockWeightLimit(val);else
      if (key === "block_weight_median") info.setBlockWeightMedian(val);else
      if (key === "bootstrap_daemon_address") {if (val) info.setBootstrapDaemonAddress(val);} else
      if (key === "difficulty") {} // handled by wide_difficulty
      else if (key === "cumulative_difficulty") {} // handled by wide_cumulative_difficulty
      else if (key === "difficulty_top64") {} // handled by wide_difficulty
      else if (key === "cumulative_difficulty_top64") {} // handled by wide_cumulative_difficulty
      else if (key === "wide_difficulty") info.setDifficulty(_GenUtils.default.reconcile(info.getDifficulty(), MoneroDaemonRpc.prefixedHexToBI(val)));else
      if (key === "wide_cumulative_difficulty") info.setCumulativeDifficulty(_GenUtils.default.reconcile(info.getCumulativeDifficulty(), MoneroDaemonRpc.prefixedHexToBI(val)));else
      if (key === "free_space") info.setFreeSpace(BigInt(val));else
      if (key === "database_size") info.setDatabaseSize(val);else
      if (key === "grey_peerlist_size") info.setNumOfflinePeers(val);else
      if (key === "height") info.setHeight(val);else
      if (key === "height_without_bootstrap") info.setHeightWithoutBootstrap(val);else
      if (key === "incoming_connections_count") info.setNumIncomingConnections(val);else
      if (key === "offline") info.setIsOffline(val);else
      if (key === "outgoing_connections_count") info.setNumOutgoingConnections(val);else
      if (key === "rpc_connections_count") info.setNumRpcConnections(val);else
      if (key === "start_time") info.setStartTimestamp(val);else
      if (key === "adjusted_time") info.setAdjustedTimestamp(val);else
      if (key === "status") {} // handled elsewhere
      else if (key === "target") info.setTarget(val);else
      if (key === "target_height") info.setTargetHeight(val);else
      if (key === "top_block_hash") info.setTopBlockHash(val);else
      if (key === "tx_count") info.setNumTxs(val);else
      if (key === "tx_pool_size") info.setNumTxsPool(val);else
      if (key === "untrusted") {} // handled elsewhere
      else if (key === "was_bootstrap_ever_used") info.setWasBootstrapEverUsed(val);else
      if (key === "white_peerlist_size") info.setNumOnlinePeers(val);else
      if (key === "update_available") info.setUpdateAvailable(val);else
      if (key === "nettype") _GenUtils.default.safeSet(info, info.getNetworkType, info.setNetworkType, _MoneroNetworkType.default.parse(val));else
      if (key === "mainnet") {if (val) _GenUtils.default.safeSet(info, info.getNetworkType, info.setNetworkType, _MoneroNetworkType.default.MAINNET);} else
      if (key === "testnet") {if (val) _GenUtils.default.safeSet(info, info.getNetworkType, info.setNetworkType, _MoneroNetworkType.default.TESTNET);} else
      if (key === "stagenet") {if (val) _GenUtils.default.safeSet(info, info.getNetworkType, info.setNetworkType, _MoneroNetworkType.default.STAGENET);} else
      if (key === "credits") info.setCredits(BigInt(val));else
      if (key === "top_block_hash" || key === "top_hash") info.setTopBlockHash(_GenUtils.default.reconcile(info.getTopBlockHash(), "" === val ? undefined : val));else
      if (key === "busy_syncing") info.setIsBusySyncing(val);else
      if (key === "synchronized") info.setIsSynchronized(val);else
      if (key === "restricted") info.setIsRestricted(val);else
      console.log("WARNING: Ignoring unexpected info field: " + key + ": " + val);
    }
    return info;
  }

  /**
   * Initializes sync info from RPC sync info.
   * 
   * @param rpcSyncInfo - rpc map to initialize the sync info from
   * @return {MoneroDaemonSyncInfo} is sync info initialized from the map
   */
  static convertRpcSyncInfo(rpcSyncInfo) {
    let syncInfo = new _MoneroDaemonSyncInfo.default();
    for (let key of Object.keys(rpcSyncInfo)) {
      let val = rpcSyncInfo[key];
      if (key === "height") syncInfo.setHeight(val);else
      if (key === "peers") {
        syncInfo.setPeers([]);
        let rpcConnections = val;
        for (let rpcConnection of rpcConnections) {
          syncInfo.getPeers().push(MoneroDaemonRpc.convertRpcConnection(rpcConnection.info));
        }
      } else
      if (key === "spans") {
        syncInfo.setSpans([]);
        let rpcSpans = val;
        for (let rpcSpan of rpcSpans) {
          syncInfo.getSpans().push(MoneroDaemonRpc.convertRpcConnectionSpan(rpcSpan));
        }
      } else if (key === "status") {} // handled elsewhere
      else if (key === "target_height") syncInfo.setTargetHeight(val);else
      if (key === "next_needed_pruning_seed") syncInfo.setNextNeededPruningSeed(val);else
      if (key === "overview") {// this returns [] without pruning
        let overview;
        try {
          overview = JSON.parse(val);
          if (overview !== undefined && overview.length > 0) console.error("Ignoring non-empty 'overview' field (not implemented): " + overview); // TODO
        } catch (e) {
          console.error("Failed to parse 'overview' field: " + overview + ": " + e.message);
        }
      } else
      if (key === "credits") syncInfo.setCredits(BigInt(val));else
      if (key === "top_hash") syncInfo.setTopBlockHash("" === val ? undefined : val);else
      if (key === "untrusted") {} // handled elsewhere
      else console.log("WARNING: ignoring unexpected field in sync info: " + key + ": " + val);
    }
    return syncInfo;
  }

  static convertRpcHardForkInfo(rpcHardForkInfo) {
    let info = new _MoneroHardForkInfo.default();
    for (let key of Object.keys(rpcHardForkInfo)) {
      let val = rpcHardForkInfo[key];
      if (key === "earliest_height") info.setEarliestHeight(val);else
      if (key === "enabled") info.setIsEnabled(val);else
      if (key === "state") info.setState(val);else
      if (key === "status") {} // handled elsewhere
      else if (key === "untrusted") {} // handled elsewhere
      else if (key === "threshold") info.setThreshold(val);else
      if (key === "version") info.setVersion(val);else
      if (key === "votes") info.setNumVotes(val);else
      if (key === "voting") info.setVoting(val);else
      if (key === "window") info.setWindow(val);else
      if (key === "credits") info.setCredits(BigInt(val));else
      if (key === "top_hash") info.setTopBlockHash("" === val ? undefined : val);else
      console.log("WARNING: ignoring unexpected field in hard fork info: " + key + ": " + val);
    }
    return info;
  }

  static convertRpcConnectionSpan(rpcConnectionSpan) {
    let span = new _MoneroConnectionSpan.default();
    for (let key of Object.keys(rpcConnectionSpan)) {
      let val = rpcConnectionSpan[key];
      if (key === "connection_id") span.setConnectionId(val);else
      if (key === "nblocks") span.setNumBlocks(val);else
      if (key === "rate") span.setRate(val);else
      if (key === "remote_address") {if (val !== "") span.setRemoteAddress(val);} else
      if (key === "size") span.setSize(val);else
      if (key === "speed") span.setSpeed(val);else
      if (key === "start_block_height") span.setStartHeight(val);else
      console.log("WARNING: ignoring unexpected field in daemon connection span: " + key + ": " + val);
    }
    return span;
  }

  static convertRpcOutputHistogramEntry(rpcEntry) {
    let entry = new _MoneroOutputHistogramEntry.default();
    for (let key of Object.keys(rpcEntry)) {
      let val = rpcEntry[key];
      if (key === "amount") entry.setAmount(BigInt(val));else
      if (key === "total_instances") entry.setNumInstances(val);else
      if (key === "unlocked_instances") entry.setNumUnlockedInstances(val);else
      if (key === "recent_instances") entry.setNumRecentInstances(val);else
      console.log("WARNING: ignoring unexpected field in output histogram: " + key + ": " + val);
    }
    return entry;
  }

  static convertRpcSubmitTxResult(rpcResult) {
    (0, _assert.default)(rpcResult);
    let result = new _MoneroSubmitTxResult.default();
    for (let key of Object.keys(rpcResult)) {
      let val = rpcResult[key];
      if (key === "double_spend") result.setIsDoubleSpendSeen(val);else
      if (key === "fee_too_low") result.setIsFeeTooLow(val);else
      if (key === "invalid_input") result.setHasInvalidInput(val);else
      if (key === "invalid_output") result.setHasInvalidOutput(val);else
      if (key === "too_few_outputs") result.setHasTooFewOutputs(val);else
      if (key === "low_mixin") result.setIsMixinTooLow(val);else
      if (key === "not_relayed") result.setIsRelayed(!val);else
      if (key === "overspend") result.setIsOverspend(val);else
      if (key === "reason") result.setReason(val === "" ? undefined : val);else
      if (key === "too_big") result.setIsTooBig(val);else
      if (key === "sanity_check_failed") result.setSanityCheckFailed(val);else
      if (key === "credits") result.setCredits(BigInt(val));else
      if (key === "status" || key === "untrusted") {} // handled elsewhere
      else if (key === "top_hash") result.setTopBlockHash("" === val ? undefined : val);else
      if (key === "tx_extra_too_big") result.setIsTxExtraTooBig(val);else
      console.log("WARNING: ignoring unexpected field in submit tx hex result: " + key + ": " + val);
    }
    return result;
  }

  static convertRpcTxPoolStats(rpcStats) {
    (0, _assert.default)(rpcStats);
    let stats = new _MoneroTxPoolStats.default();
    for (let key of Object.keys(rpcStats)) {
      let val = rpcStats[key];
      if (key === "bytes_max") stats.setBytesMax(val);else
      if (key === "bytes_med") stats.setBytesMed(val);else
      if (key === "bytes_min") stats.setBytesMin(val);else
      if (key === "bytes_total") stats.setBytesTotal(val);else
      if (key === "histo_98pc") stats.setHisto98pc(val);else
      if (key === "num_10m") stats.setNum10m(val);else
      if (key === "num_double_spends") stats.setNumDoubleSpends(val);else
      if (key === "num_failing") stats.setNumFailing(val);else
      if (key === "num_not_relayed") stats.setNumNotRelayed(val);else
      if (key === "oldest") stats.setOldestTimestamp(val);else
      if (key === "txs_total") stats.setNumTxs(val);else
      if (key === "fee_total") stats.setFeeTotal(BigInt(val));else
      if (key === "histo") {
        stats.setHisto(new Map());
        for (let elem of val) stats.getHisto().set(elem.bytes, elem.txs);
      } else
      console.log("WARNING: ignoring unexpected field in tx pool stats: " + key + ": " + val);
    }

    // uninitialize some stats if not applicable
    if (stats.getHisto98pc() === 0) stats.setHisto98pc(undefined);
    if (stats.getNumTxs() === 0) {
      stats.setBytesMin(undefined);
      stats.setBytesMed(undefined);
      stats.setBytesMax(undefined);
      stats.setHisto98pc(undefined);
      stats.setOldestTimestamp(undefined);
    }

    return stats;
  }

  static convertRpcAltChain(rpcChain) {
    (0, _assert.default)(rpcChain);
    let chain = new _MoneroAltChain.default();
    for (let key of Object.keys(rpcChain)) {
      let val = rpcChain[key];
      if (key === "block_hash") {} // using block_hashes instead
      else if (key === "difficulty") {} // handled by wide_difficulty
      else if (key === "difficulty_top64") {} // handled by wide_difficulty
      else if (key === "wide_difficulty") chain.setDifficulty(_GenUtils.default.reconcile(chain.getDifficulty(), MoneroDaemonRpc.prefixedHexToBI(val)));else
      if (key === "height") chain.setHeight(val);else
      if (key === "length") chain.setLength(val);else
      if (key === "block_hashes") chain.setBlockHashes(val);else
      if (key === "main_chain_parent_block") chain.setMainChainParentBlockHash(val);else
      console.log("WARNING: ignoring unexpected field in alternative chain: " + key + ": " + val);
    }
    return chain;
  }

  static convertRpcPeer(rpcPeer) {
    (0, _assert.default)(rpcPeer);
    let peer = new _MoneroPeer.default();
    for (let key of Object.keys(rpcPeer)) {
      let val = rpcPeer[key];
      if (key === "host") peer.setHost(val);else
      if (key === "id") peer.setId("" + val); // TODO monero-wallet-rpc: peer id is BigInt but string in `get_connections`
      else if (key === "ip") {} // host used instead which is consistently a string
      else if (key === "last_seen") peer.setLastSeenTimestamp(val);else
      if (key === "port") peer.setPort(val);else
      if (key === "rpc_port") peer.setRpcPort(val);else
      if (key === "pruning_seed") peer.setPruningSeed(val);else
      if (key === "rpc_credits_per_hash") peer.setRpcCreditsPerHash(BigInt(val));else
      console.log("WARNING: ignoring unexpected field in rpc peer: " + key + ": " + val);
    }
    return peer;
  }

  static convertRpcConnection(rpcConnection) {
    let peer = new _MoneroPeer.default();
    peer.setIsOnline(true);
    for (let key of Object.keys(rpcConnection)) {
      let val = rpcConnection[key];
      if (key === "address") peer.setAddress(val);else
      if (key === "avg_download") peer.setAvgDownload(val);else
      if (key === "avg_upload") peer.setAvgUpload(val);else
      if (key === "connection_id") peer.setId(val);else
      if (key === "current_download") peer.setCurrentDownload(val);else
      if (key === "current_upload") peer.setCurrentUpload(val);else
      if (key === "height") peer.setHeight(val);else
      if (key === "host") peer.setHost(val);else
      if (key === "ip") {} // host used instead which is consistently a string
      else if (key === "incoming") peer.setIsIncoming(val);else
      if (key === "live_time") peer.setLiveTime(val);else
      if (key === "local_ip") peer.setIsLocalIp(val);else
      if (key === "localhost") peer.setIsLocalHost(val);else
      if (key === "peer_id") peer.setId(val);else
      if (key === "port") peer.setPort(parseInt(val));else
      if (key === "rpc_port") peer.setRpcPort(val);else
      if (key === "recv_count") peer.setNumReceives(val);else
      if (key === "recv_idle_time") peer.setReceiveIdleTime(val);else
      if (key === "send_count") peer.setNumSends(val);else
      if (key === "send_idle_time") peer.setSendIdleTime(val);else
      if (key === "state") peer.setState(val);else
      if (key === "support_flags") peer.setNumSupportFlags(val);else
      if (key === "pruning_seed") peer.setPruningSeed(val);else
      if (key === "rpc_credits_per_hash") peer.setRpcCreditsPerHash(BigInt(val));else
      if (key === "address_type") peer.setType(val);else
      console.log("WARNING: ignoring unexpected field in peer: " + key + ": " + val);
    }
    return peer;
  }

  static convertToRpcBan(ban) {
    let rpcBan = {};
    rpcBan.host = ban.getHost();
    rpcBan.ip = ban.getIp();
    rpcBan.ban = ban.getIsBanned();
    rpcBan.seconds = ban.getSeconds();
    return rpcBan;
  }

  static convertRpcMiningStatus(rpcStatus) {
    let status = new _MoneroMiningStatus.default();
    status.setIsActive(rpcStatus.active);
    status.setSpeed(rpcStatus.speed);
    status.setNumThreads(rpcStatus.threads_count);
    if (rpcStatus.active) {
      status.setAddress(rpcStatus.address);
      status.setIsBackground(rpcStatus.is_background_mining_enabled);
    }
    return status;
  }

  static convertRpcUpdateCheckResult(rpcResult) {
    (0, _assert.default)(rpcResult);
    let result = new _MoneroDaemonUpdateCheckResult.default();
    for (let key of Object.keys(rpcResult)) {
      let val = rpcResult[key];
      if (key === "auto_uri") result.setAutoUri(val);else
      if (key === "hash") result.setHash(val);else
      if (key === "path") {} // handled elsewhere
      else if (key === "status") {} // handled elsewhere
      else if (key === "update") result.setIsUpdateAvailable(val);else
      if (key === "user_uri") result.setUserUri(val);else
      if (key === "version") result.setVersion(val);else
      if (key === "untrusted") {} // handled elsewhere
      else console.log("WARNING: ignoring unexpected field in rpc check update result: " + key + ": " + val);
    }
    if (result.getAutoUri() === "") result.setAutoUri(undefined);
    if (result.getUserUri() === "") result.setUserUri(undefined);
    if (result.getVersion() === "") result.setVersion(undefined);
    if (result.getHash() === "") result.setHash(undefined);
    return result;
  }

  static convertRpcUpdateDownloadResult(rpcResult) {
    let result = new _MoneroDaemonUpdateDownloadResult.default(MoneroDaemonRpc.convertRpcUpdateCheckResult(rpcResult));
    result.setDownloadPath(rpcResult["path"]);
    if (result.getDownloadPath() === "") result.setDownloadPath(undefined);
    return result;
  }

  /**
   * Converts a '0x' prefixed hexidecimal string to a bigint.
   * 
   * @param {string} hex is the '0x' prefixed hexidecimal string to convert
   * @return {bigint} the hexicedimal converted to decimal
   */
  static prefixedHexToBI(hex) {
    (0, _assert.default)(hex.substring(0, 2) === "0x");
    return BigInt(hex);
  }
}

/**
 * Implements a MoneroDaemon by proxying requests to a worker.
 * 
 * @private
 */
class MoneroDaemonRpcProxy {

  // state variables





  constructor(daemonId, worker) {
    this.daemonId = daemonId;
    this.worker = worker;
    this.wrappedListeners = [];
  }

  // --------------------------- STATIC UTILITIES -----------------------------

  static async connect(config) {
    let daemonId = _GenUtils.default.getUUID();
    config = Object.assign({}, config, { proxyToWorker: false });
    await _LibraryUtils.default.invokeWorker(daemonId, "connectDaemonRpc", [config]);
    return new MoneroDaemonRpcProxy(daemonId, await _LibraryUtils.default.getWorker());
  }

  // ---------------------------- INSTANCE METHODS ----------------------------

  async addListener(listener) {
    let wrappedListener = new DaemonWorkerListener(listener);
    let listenerId = wrappedListener.getId();
    _LibraryUtils.default.addWorkerCallback(this.daemonId, "onBlockHeader_" + listenerId, [wrappedListener.onBlockHeader, wrappedListener]);
    this.wrappedListeners.push(wrappedListener);
    return this.invokeWorker("daemonAddListener", [listenerId]);
  }

  async removeListener(listener) {
    for (let i = 0; i < this.wrappedListeners.length; i++) {
      if (this.wrappedListeners[i].getListener() === listener) {
        let listenerId = this.wrappedListeners[i].getId();
        await this.invokeWorker("daemonRemoveListener", [listenerId]);
        _LibraryUtils.default.removeWorkerCallback(this.daemonId, "onBlockHeader_" + listenerId);
        this.wrappedListeners.splice(i, 1);
        return;
      }
    }
    throw new _MoneroError.default("Listener is not registered with daemon");
  }

  async getListeners() {
    let listeners = [];
    for (let wrappedListener of this.wrappedListeners) listeners.push(wrappedListener.getListener());
    return listeners;
  }

  async getRpcConnection() {
    let config = await this.invokeWorker("daemonGetRpcConnection");
    return new _MoneroRpcConnection.default(config);
  }

  async isConnected() {
    return this.invokeWorker("daemonIsConnected");
  }

  async getVersion() {
    let versionJson = await this.invokeWorker("daemonGetVersion");
    return new _MoneroVersion.default(versionJson.number, versionJson.isRelease);
  }

  async isTrusted() {
    return this.invokeWorker("daemonIsTrusted");
  }

  async getHeight() {
    return this.invokeWorker("daemonGetHeight");
  }

  async getBlockHash(height) {
    return this.invokeWorker("daemonGetBlockHash", Array.from(arguments));
  }

  async getBlockTemplate(walletAddress, reserveSize) {
    return new _MoneroBlockTemplate.default(await this.invokeWorker("daemonGetBlockTemplate", Array.from(arguments)));
  }

  async getLastBlockHeader() {
    return new _MoneroBlockHeader.default(await this.invokeWorker("daemonGetLastBlockHeader"));
  }

  async getBlockHeaderByHash(blockHash) {
    return new _MoneroBlockHeader.default(await this.invokeWorker("daemonGetBlockHeaderByHash", Array.from(arguments)));
  }

  async getBlockHeaderByHeight(height) {
    return new _MoneroBlockHeader.default(await this.invokeWorker("daemonGetBlockHeaderByHeight", Array.from(arguments)));
  }

  async getBlockHeadersByRange(startHeight, endHeight) {
    let blockHeadersJson = await this.invokeWorker("daemonGetBlockHeadersByRange", Array.from(arguments));
    let headers = [];
    for (let blockHeaderJson of blockHeadersJson) headers.push(new _MoneroBlockHeader.default(blockHeaderJson));
    return headers;
  }

  async getBlockByHash(blockHash) {
    return new _MoneroBlock.default(await this.invokeWorker("daemonGetBlockByHash", Array.from(arguments)), _MoneroBlock.default.DeserializationType.TX);
  }

  async getBlocksByHash(blockHashes, startHeight, prune) {
    let blocksJson = await this.invokeWorker("daemonGetBlocksByHash", Array.from(arguments));
    let blocks = [];
    for (let blockJson of blocksJson) blocks.push(new _MoneroBlock.default(blockJson));
    return blocks;
  }

  async getBlockByHeight(height) {
    return new _MoneroBlock.default(await this.invokeWorker("daemonGetBlockByHeight", Array.from(arguments)), _MoneroBlock.default.DeserializationType.TX);
  }

  async getBlocksByHeight(heights) {
    let blocksJson = await this.invokeWorker("daemonGetBlocksByHeight", Array.from(arguments));
    let blocks = [];
    for (let blockJson of blocksJson) blocks.push(new _MoneroBlock.default(blockJson, _MoneroBlock.default.DeserializationType.TX));
    return blocks;
  }

  async getBlocksByRange(startHeight, endHeight) {
    let blocksJson = await this.invokeWorker("daemonGetBlocksByRange", Array.from(arguments));
    let blocks = [];
    for (let blockJson of blocksJson) blocks.push(new _MoneroBlock.default(blockJson, _MoneroBlock.default.DeserializationType.TX));
    return blocks;
  }

  async getBlocksByRangeChunked(startHeight, endHeight, maxChunkSize) {
    let blocksJson = await this.invokeWorker("daemonGetBlocksByRangeChunked", Array.from(arguments));
    let blocks = [];
    for (let blockJson of blocksJson) blocks.push(new _MoneroBlock.default(blockJson, _MoneroBlock.default.DeserializationType.TX));
    return blocks;
  }

  async getBlockHashes(blockHashes, startHeight) {
    return this.invokeWorker("daemonGetBlockHashes", Array.from(arguments));
  }

  async getTxs(txHashes, prune = false) {

    // deserialize txs from blocks
    let blocks = [];
    for (let blockJson of await this.invokeWorker("daemonGetTxs", Array.from(arguments))) {
      blocks.push(new _MoneroBlock.default(blockJson, _MoneroBlock.default.DeserializationType.TX));
    }

    // collect txs
    let txs = [];
    for (let block of blocks) {
      for (let tx of block.getTxs()) {
        if (!tx.getIsConfirmed()) tx.setBlock(undefined);
        txs.push(tx);
      }
    }
    return txs;
  }

  async getTxHexes(txHashes, prune = false) {
    return this.invokeWorker("daemonGetTxHexes", Array.from(arguments));
  }

  async getMinerTxSum(height, numBlocks) {
    return new _MoneroMinerTxSum.default(await this.invokeWorker("daemonGetMinerTxSum", Array.from(arguments)));
  }

  async getFeeEstimate(graceBlocks) {
    return new _MoneroFeeEstimate.default(await this.invokeWorker("daemonGetFeeEstimate", Array.from(arguments)));
  }

  async submitTxHex(txHex, doNotRelay) {
    return new _MoneroSubmitTxResult.default(await this.invokeWorker("daemonSubmitTxHex", Array.from(arguments)));
  }

  async relayTxsByHash(txHashes) {
    return this.invokeWorker("daemonRelayTxsByHash", Array.from(arguments));
  }

  async getTxPool() {
    let blockJson = await this.invokeWorker("daemonGetTxPool");
    let txs = new _MoneroBlock.default(blockJson, _MoneroBlock.default.DeserializationType.TX).getTxs();
    for (let tx of txs) tx.setBlock(undefined);
    return txs ? txs : [];
  }

  async getTxPoolHashes() {
    return this.invokeWorker("daemonGetTxPoolHashes", Array.from(arguments));
  }

  async getTxPoolBacklog() {
    throw new _MoneroError.default("Not implemented");
  }

  async getTxPoolStats() {
    return new _MoneroTxPoolStats.default(await this.invokeWorker("daemonGetTxPoolStats"));
  }

  async flushTxPool(hashes) {
    return this.invokeWorker("daemonFlushTxPool", Array.from(arguments));
  }

  async getKeyImageSpentStatuses(keyImages) {
    return this.invokeWorker("daemonGetKeyImageSpentStatuses", Array.from(arguments));
  }

  async getOutputs(outputs) {
    throw new _MoneroError.default("Not implemented");
  }

  async getOutputHistogram(amounts, minCount, maxCount, isUnlocked, recentCutoff) {
    let entries = [];
    for (let entryJson of await this.invokeWorker("daemonGetOutputHistogram", [amounts, minCount, maxCount, isUnlocked, recentCutoff])) {
      entries.push(new _MoneroOutputHistogramEntry.default(entryJson));
    }
    return entries;
  }

  async getOutputDistribution(amounts, cumulative, startHeight, endHeight) {
    throw new _MoneroError.default("Not implemented");
  }

  async getInfo() {
    return new _MoneroDaemonInfo.default(await this.invokeWorker("daemonGetInfo"));
  }

  async getSyncInfo() {
    return new _MoneroDaemonSyncInfo.default(await this.invokeWorker("daemonGetSyncInfo"));
  }

  async getHardForkInfo() {
    return new _MoneroHardForkInfo.default(await this.invokeWorker("daemonGetHardForkInfo"));
  }

  async getAltChains() {
    let altChains = [];
    for (let altChainJson of await this.invokeWorker("daemonGetAltChains")) altChains.push(new _MoneroAltChain.default(altChainJson));
    return altChains;
  }

  async getAltBlockHashes() {
    return this.invokeWorker("daemonGetAltBlockHashes");
  }

  async getDownloadLimit() {
    return this.invokeWorker("daemonGetDownloadLimit");
  }

  async setDownloadLimit(limit) {
    return this.invokeWorker("daemonSetDownloadLimit", Array.from(arguments));
  }

  async resetDownloadLimit() {
    return this.invokeWorker("daemonResetDownloadLimit");
  }

  async getUploadLimit() {
    return this.invokeWorker("daemonGetUploadLimit");
  }

  async setUploadLimit(limit) {
    return this.invokeWorker("daemonSetUploadLimit", Array.from(arguments));
  }

  async resetUploadLimit() {
    return this.invokeWorker("daemonResetUploadLimit");
  }

  async getPeers() {
    let peers = [];
    for (let peerJson of await this.invokeWorker("daemonGetPeers")) peers.push(new _MoneroPeer.default(peerJson));
    return peers;
  }

  async getKnownPeers() {
    let peers = [];
    for (let peerJson of await this.invokeWorker("daemonGetKnownPeers")) peers.push(new _MoneroPeer.default(peerJson));
    return peers;
  }

  async setOutgoingPeerLimit(limit) {
    return this.invokeWorker("daemonSetIncomingPeerLimit", Array.from(arguments));
  }

  async setIncomingPeerLimit(limit) {
    return this.invokeWorker("daemonSetIncomingPeerLimit", Array.from(arguments));
  }

  async getPeerBans() {
    let bans = [];
    for (let banJson of await this.invokeWorker("daemonGetPeerBans")) bans.push(new _MoneroBan.default(banJson));
    return bans;
  }

  async setPeerBans(bans) {
    let bansJson = [];
    for (let ban of bans) bansJson.push(ban.toJson());
    return this.invokeWorker("daemonSetPeerBans", [bansJson]);
  }

  async startMining(address, numThreads, isBackground, ignoreBattery) {
    return this.invokeWorker("daemonStartMining", Array.from(arguments));
  }

  async stopMining() {
    await this.invokeWorker("daemonStopMining");
  }

  async getMiningStatus() {
    return new _MoneroMiningStatus.default(await this.invokeWorker("daemonGetMiningStatus"));
  }

  async submitBlocks(blockBlobs) {
    throw new _MoneroError.default("Not implemented");
  }

  async pruneBlockchain(check) {
    return new _MoneroPruneResult.default(await this.invokeWorker("daemonPruneBlockchain"));
  }

  async checkForUpdate() {
    throw new _MoneroError.default("Not implemented");
  }

  async downloadUpdate(path) {
    throw new _MoneroError.default("Not implemented");
  }

  async stop() {
    while (this.wrappedListeners.length) await this.removeListener(this.wrappedListeners[0].getListener());
    return this.invokeWorker("daemonStop");
  }

  async waitForNextBlockHeader() {
    return new _MoneroBlockHeader.default(await this.invokeWorker("daemonWaitForNextBlockHeader"));
  }

  // --------------------------- PRIVATE HELPERS ------------------------------

  // TODO: duplicated with MoneroWalletFullProxy
  async invokeWorker(fnName, args) {
    return _LibraryUtils.default.invokeWorker(this.daemonId, fnName, args);
  }
}

/**
 * Polls a Monero daemon for updates and notifies listeners as they occur.
 * 
 * @private
 */
class DaemonPoller {






  constructor(daemon) {
    let that = this;
    this.daemon = daemon;
    this.looper = new _TaskLooper.default(async function () {await that.poll();});
  }

  setIsPolling(isPolling) {
    this.isPolling = isPolling;
    if (isPolling) this.looper.start(this.daemon.getPollInterval());else
    this.looper.stop();
  }

  async poll() {
    try {

      // get latest block header
      let header = await this.daemon.getLastBlockHeader();

      // save first header for comparison
      if (!this.lastHeader) {
        this.lastHeader = await this.daemon.getLastBlockHeader();
        return;
      }

      // compare header to last
      if (header.getHash() !== this.lastHeader.getHash()) {
        this.lastHeader = header;
        await this.announceBlockHeader(header);
      }
    } catch (err) {
      console.error("Failed to background poll daemon header");
      console.error(err);
    }
  }

  async announceBlockHeader(header) {
    for (let listener of await this.daemon.getListeners()) {
      try {
        await listener.onBlockHeader(header); // notify listener
      } catch (err) {
        console.error("Error calling listener on block header", err);
      }
    }
  }
}

/**
 * Internal listener to bridge notifications to external listeners.
 * 
 * @private
 */
class DaemonWorkerListener {




  constructor(listener) {
    this.id = _GenUtils.default.getUUID();
    this.listener = listener;
  }

  getId() {
    return this.id;
  }

  getListener() {
    return this.listener;
  }

  async onBlockHeader(headerJson) {
    this.listener.onBlockHeader(new _MoneroBlockHeader.default(headerJson));
  }
}var _default = exports.default =

MoneroDaemonRpc;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX1Rhc2tMb29wZXIiLCJfTW9uZXJvQWx0Q2hhaW4iLCJfTW9uZXJvQmFuIiwiX01vbmVyb0Jsb2NrIiwiX01vbmVyb0Jsb2NrSGVhZGVyIiwiX01vbmVyb0Jsb2NrVGVtcGxhdGUiLCJfTW9uZXJvQ29ubmVjdGlvblNwYW4iLCJfTW9uZXJvRGFlbW9uIiwiX01vbmVyb0RhZW1vbkNvbmZpZyIsIl9Nb25lcm9EYWVtb25JbmZvIiwiX01vbmVyb0RhZW1vbkxpc3RlbmVyIiwiX01vbmVyb0RhZW1vblN5bmNJbmZvIiwiX01vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0IiwiX01vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0IiwiX01vbmVyb0ZlZUVzdGltYXRlIiwiX01vbmVyb0Vycm9yIiwiX01vbmVyb0hhcmRGb3JrSW5mbyIsIl9Nb25lcm9LZXlJbWFnZSIsIl9Nb25lcm9NaW5lclR4U3VtIiwiX01vbmVyb01pbmluZ1N0YXR1cyIsIl9Nb25lcm9OZXR3b3JrVHlwZSIsIl9Nb25lcm9PdXRwdXQiLCJfTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkiLCJfTW9uZXJvUGVlciIsIl9Nb25lcm9QcnVuZVJlc3VsdCIsIl9Nb25lcm9ScGNDb25uZWN0aW9uIiwiX01vbmVyb1N1Ym1pdFR4UmVzdWx0IiwiX01vbmVyb1R4IiwiX01vbmVyb1R4UG9vbFN0YXRzIiwiX01vbmVyb1V0aWxzIiwiX01vbmVyb1ZlcnNpb24iLCJNb25lcm9EYWVtb25ScGMiLCJNb25lcm9EYWVtb24iLCJNQVhfUkVRX1NJWkUiLCJERUZBVUxUX0lEIiwiTlVNX0hFQURFUlNfUEVSX1JFUSIsIkRFRkFVTFRfUE9MTF9QRVJJT0QiLCJjb25zdHJ1Y3RvciIsImNvbmZpZyIsInByb3h5RGFlbW9uIiwicHJveHlUb1dvcmtlciIsImxpc3RlbmVycyIsImNhY2hlZEhlYWRlcnMiLCJnZXRQcm9jZXNzIiwicHJvY2VzcyIsInN0b3BQcm9jZXNzIiwiZm9yY2UiLCJ1bmRlZmluZWQiLCJNb25lcm9FcnJvciIsImxpc3RlbmVyc0NvcHkiLCJHZW5VdGlscyIsImNvcHlBcnJheSIsImdldExpc3RlbmVycyIsImxpc3RlbmVyIiwicmVtb3ZlTGlzdGVuZXIiLCJraWxsUHJvY2VzcyIsImFkZExpc3RlbmVyIiwiYXNzZXJ0IiwiTW9uZXJvRGFlbW9uTGlzdGVuZXIiLCJwdXNoIiwicmVmcmVzaExpc3RlbmluZyIsImlkeCIsImluZGV4T2YiLCJzcGxpY2UiLCJnZXRScGNDb25uZWN0aW9uIiwiZ2V0U2VydmVyIiwiaXNDb25uZWN0ZWQiLCJnZXRWZXJzaW9uIiwiZSIsInJlc3AiLCJzZW5kSnNvblJlcXVlc3QiLCJjaGVja1Jlc3BvbnNlU3RhdHVzIiwicmVzdWx0IiwiTW9uZXJvVmVyc2lvbiIsInZlcnNpb24iLCJyZWxlYXNlIiwiaXNUcnVzdGVkIiwic2VuZFBhdGhSZXF1ZXN0IiwidW50cnVzdGVkIiwiZ2V0SGVpZ2h0IiwiY291bnQiLCJnZXRCbG9ja0hhc2giLCJoZWlnaHQiLCJnZXRCbG9ja1RlbXBsYXRlIiwid2FsbGV0QWRkcmVzcyIsInJlc2VydmVTaXplIiwid2FsbGV0X2FkZHJlc3MiLCJyZXNlcnZlX3NpemUiLCJjb252ZXJ0UnBjQmxvY2tUZW1wbGF0ZSIsImdldExhc3RCbG9ja0hlYWRlciIsImNvbnZlcnRScGNCbG9ja0hlYWRlciIsImJsb2NrX2hlYWRlciIsImdldEJsb2NrSGVhZGVyQnlIYXNoIiwiYmxvY2tIYXNoIiwiaGFzaCIsImdldEJsb2NrSGVhZGVyQnlIZWlnaHQiLCJnZXRCbG9ja0hlYWRlcnNCeVJhbmdlIiwic3RhcnRIZWlnaHQiLCJlbmRIZWlnaHQiLCJzdGFydF9oZWlnaHQiLCJlbmRfaGVpZ2h0IiwiaGVhZGVycyIsInJwY0hlYWRlciIsImdldEJsb2NrQnlIYXNoIiwiY29udmVydFJwY0Jsb2NrIiwiZ2V0QmxvY2tCeUhlaWdodCIsImdldEJsb2Nrc0J5SGVpZ2h0IiwiaGVpZ2h0cyIsInJlc3BCaW4iLCJzZW5kQmluYXJ5UmVxdWVzdCIsInJwY0Jsb2NrcyIsIk1vbmVyb1V0aWxzIiwiYmluYXJ5QmxvY2tzVG9Kc29uIiwiZXF1YWwiLCJ0eHMiLCJsZW5ndGgiLCJibG9ja3MiLCJibG9ja0lkeCIsImJsb2NrIiwic2V0SGVpZ2h0IiwidHhJZHgiLCJ0eCIsIk1vbmVyb1R4Iiwic2V0SGFzaCIsInR4X2hhc2hlcyIsInNldElzQ29uZmlybWVkIiwic2V0SW5UeFBvb2wiLCJzZXRJc01pbmVyVHgiLCJzZXRSZWxheSIsInNldElzUmVsYXllZCIsInNldElzRmFpbGVkIiwic2V0SXNEb3VibGVTcGVuZFNlZW4iLCJjb252ZXJ0UnBjVHgiLCJzZXRUeHMiLCJnZXRCbG9jayIsIm1lcmdlIiwiZ2V0VHhzIiwic2V0QmxvY2siLCJnZXRCbG9ja3NCeVJhbmdlIiwiZ2V0QmxvY2tzQnlSYW5nZUNodW5rZWQiLCJtYXhDaHVua1NpemUiLCJsYXN0SGVpZ2h0IiwiZ2V0TWF4QmxvY2tzIiwidHhIYXNoZXMiLCJwcnVuZSIsIkFycmF5IiwiaXNBcnJheSIsInR4c19oYXNoZXMiLCJkZWNvZGVfYXNfanNvbiIsIm1lc3NhZ2UiLCJnZXRUeEhleGVzIiwiaGV4ZXMiLCJnZXRQcnVuZWRIZXgiLCJnZXRGdWxsSGV4IiwiZ2V0TWluZXJUeFN1bSIsIm51bUJsb2NrcyIsInR4U3VtIiwiTW9uZXJvTWluZXJUeFN1bSIsInNldEVtaXNzaW9uU3VtIiwiQmlnSW50IiwiZW1pc3Npb25fYW1vdW50Iiwic2V0RmVlU3VtIiwiZmVlX2Ftb3VudCIsImdldEZlZUVzdGltYXRlIiwiZ3JhY2VCbG9ja3MiLCJncmFjZV9ibG9ja3MiLCJmZWVFc3RpbWF0ZSIsIk1vbmVyb0ZlZUVzdGltYXRlIiwic2V0RmVlIiwiZmVlIiwiZmVlcyIsImkiLCJzZXRGZWVzIiwic2V0UXVhbnRpemF0aW9uTWFzayIsInF1YW50aXphdGlvbl9tYXNrIiwic3VibWl0VHhIZXgiLCJ0eEhleCIsImRvTm90UmVsYXkiLCJ0eF9hc19oZXgiLCJkb19ub3RfcmVsYXkiLCJjb252ZXJ0UnBjU3VibWl0VHhSZXN1bHQiLCJzZXRJc0dvb2QiLCJyZWxheVR4c0J5SGFzaCIsInR4aWRzIiwiZ2V0VHhQb29sIiwidHJhbnNhY3Rpb25zIiwicnBjVHgiLCJzZXROdW1Db25maXJtYXRpb25zIiwiZ2V0VHhQb29sSGFzaGVzIiwiZ2V0VHhQb29sU3RhdHMiLCJjb252ZXJ0UnBjVHhQb29sU3RhdHMiLCJwb29sX3N0YXRzIiwiZmx1c2hUeFBvb2wiLCJoYXNoZXMiLCJsaXN0aWZ5IiwiZ2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzIiwia2V5SW1hZ2VzIiwia2V5X2ltYWdlcyIsInNwZW50X3N0YXR1cyIsImdldE91dHB1dEhpc3RvZ3JhbSIsImFtb3VudHMiLCJtaW5Db3VudCIsIm1heENvdW50IiwiaXNVbmxvY2tlZCIsInJlY2VudEN1dG9mZiIsIm1pbl9jb3VudCIsIm1heF9jb3VudCIsInVubG9ja2VkIiwicmVjZW50X2N1dG9mZiIsImVudHJpZXMiLCJoaXN0b2dyYW0iLCJycGNFbnRyeSIsImNvbnZlcnRScGNPdXRwdXRIaXN0b2dyYW1FbnRyeSIsImdldE91dHB1dERpc3RyaWJ1dGlvbiIsImN1bXVsYXRpdmUiLCJnZXRJbmZvIiwiY29udmVydFJwY0luZm8iLCJnZXRTeW5jSW5mbyIsImNvbnZlcnRScGNTeW5jSW5mbyIsImdldEhhcmRGb3JrSW5mbyIsImNvbnZlcnRScGNIYXJkRm9ya0luZm8iLCJnZXRBbHRDaGFpbnMiLCJjaGFpbnMiLCJycGNDaGFpbiIsImNvbnZlcnRScGNBbHRDaGFpbiIsImdldEFsdEJsb2NrSGFzaGVzIiwiYmxrc19oYXNoZXMiLCJnZXREb3dubG9hZExpbWl0IiwiZ2V0QmFuZHdpZHRoTGltaXRzIiwic2V0RG93bmxvYWRMaW1pdCIsImxpbWl0IiwicmVzZXREb3dubG9hZExpbWl0IiwiaXNJbnQiLCJzZXRCYW5kd2lkdGhMaW1pdHMiLCJnZXRVcGxvYWRMaW1pdCIsInNldFVwbG9hZExpbWl0IiwicmVzZXRVcGxvYWRMaW1pdCIsImdldFBlZXJzIiwicGVlcnMiLCJjb25uZWN0aW9ucyIsInJwY0Nvbm5lY3Rpb24iLCJjb252ZXJ0UnBjQ29ubmVjdGlvbiIsImdldEtub3duUGVlcnMiLCJncmF5X2xpc3QiLCJycGNQZWVyIiwicGVlciIsImNvbnZlcnRScGNQZWVyIiwic2V0SXNPbmxpbmUiLCJ3aGl0ZV9saXN0Iiwic2V0T3V0Z29pbmdQZWVyTGltaXQiLCJvdXRfcGVlcnMiLCJzZXRJbmNvbWluZ1BlZXJMaW1pdCIsImluX3BlZXJzIiwiZ2V0UGVlckJhbnMiLCJiYW5zIiwicnBjQmFuIiwiYmFuIiwiTW9uZXJvQmFuIiwic2V0SG9zdCIsImhvc3QiLCJzZXRJcCIsImlwIiwic2V0U2Vjb25kcyIsInNlY29uZHMiLCJzZXRQZWVyQmFucyIsInJwY0JhbnMiLCJjb252ZXJ0VG9ScGNCYW4iLCJzdGFydE1pbmluZyIsImFkZHJlc3MiLCJudW1UaHJlYWRzIiwiaXNCYWNrZ3JvdW5kIiwiaWdub3JlQmF0dGVyeSIsIm1pbmVyX2FkZHJlc3MiLCJ0aHJlYWRzX2NvdW50IiwiZG9fYmFja2dyb3VuZF9taW5pbmciLCJpZ25vcmVfYmF0dGVyeSIsInN0b3BNaW5pbmciLCJnZXRNaW5pbmdTdGF0dXMiLCJjb252ZXJ0UnBjTWluaW5nU3RhdHVzIiwic3VibWl0QmxvY2tzIiwiYmxvY2tCbG9icyIsInBydW5lQmxvY2tjaGFpbiIsImNoZWNrIiwiTW9uZXJvUHJ1bmVSZXN1bHQiLCJzZXRJc1BydW5lZCIsInBydW5lZCIsInNldFBydW5pbmdTZWVkIiwicHJ1bmluZ19zZWVkIiwiY2hlY2tGb3JVcGRhdGUiLCJjb21tYW5kIiwiY29udmVydFJwY1VwZGF0ZUNoZWNrUmVzdWx0IiwiZG93bmxvYWRVcGRhdGUiLCJwYXRoIiwiY29udmVydFJwY1VwZGF0ZURvd25sb2FkUmVzdWx0Iiwic3RvcCIsIndhaXRGb3JOZXh0QmxvY2tIZWFkZXIiLCJ0aGF0IiwiUHJvbWlzZSIsInJlc29sdmUiLCJvbkJsb2NrSGVhZGVyIiwiaGVhZGVyIiwiZ2V0UG9sbEludGVydmFsIiwicG9sbEludGVydmFsIiwiZ2V0VHgiLCJ0eEhhc2giLCJnZXRUeEhleCIsImdldEtleUltYWdlU3BlbnRTdGF0dXMiLCJrZXlJbWFnZSIsInNldFBlZXJCYW4iLCJzdWJtaXRCbG9jayIsImJsb2NrQmxvYiIsInBvbGxMaXN0ZW5lciIsIkRhZW1vblBvbGxlciIsInNldElzUG9sbGluZyIsImxpbWl0X2Rvd24iLCJsaW1pdF91cCIsImRvd25MaW1pdCIsInVwTGltaXQiLCJtYXhIZWlnaHQiLCJtYXhSZXFTaXplIiwicmVxU2l6ZSIsImdldEJsb2NrSGVhZGVyQnlIZWlnaHRDYWNoZWQiLCJnZXRTaXplIiwiY2FjaGVkSGVhZGVyIiwiTWF0aCIsIm1pbiIsImNvbm5lY3RUb0RhZW1vblJwYyIsInVyaU9yQ29uZmlnIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsIm5vcm1hbGl6ZUNvbmZpZyIsImNtZCIsInN0YXJ0TW9uZXJvZFByb2Nlc3MiLCJNb25lcm9EYWVtb25ScGNQcm94eSIsImNvbm5lY3QiLCJjaGlsZFByb2Nlc3MiLCJzcGF3biIsInNsaWNlIiwiZW52IiwiTEFORyIsInN0ZG91dCIsInNldEVuY29kaW5nIiwic3RkZXJyIiwidXJpIiwib3V0cHV0IiwicmVqZWN0Iiwib24iLCJkYXRhIiwibGluZSIsInRvU3RyaW5nIiwiTGlicmFyeVV0aWxzIiwibG9nIiwidXJpTGluZUNvbnRhaW5zIiwidXJpTGluZUNvbnRhaW5zSWR4Iiwic3Vic3RyaW5nIiwibGFzdEluZGV4T2YiLCJ1bmZvcm1hdHRlZExpbmUiLCJyZXBsYWNlIiwidHJpbSIsInBvcnQiLCJzc2xJZHgiLCJzc2xFbmFibGVkIiwidG9Mb3dlckNhc2UiLCJ1c2VyUGFzc0lkeCIsInVzZXJQYXNzIiwiY29weSIsInNldFNlcnZlciIsInJlamVjdFVuYXV0aG9yaXplZCIsImdldFJlamVjdFVuYXV0aG9yaXplZCIsInNldFByb3h5VG9Xb3JrZXIiLCJkYWVtb24iLCJpc1Jlc29sdmVkIiwiZ2V0TG9nTGV2ZWwiLCJjb25zb2xlIiwiZXJyb3IiLCJjb2RlIiwiRXJyb3IiLCJlcnIiLCJvcmlnaW4iLCJNb25lcm9EYWVtb25Db25maWciLCJzZXJ2ZXIiLCJNb25lcm9ScGNDb25uZWN0aW9uIiwiREVGQVVMVF9DT05GSUciLCJzdGF0dXMiLCJNb25lcm9CbG9ja0hlYWRlciIsImtleSIsIk9iamVjdCIsImtleXMiLCJ2YWwiLCJzYWZlU2V0Iiwic2V0U2l6ZSIsImdldERlcHRoIiwic2V0RGVwdGgiLCJzZXREaWZmaWN1bHR5IiwicmVjb25jaWxlIiwiZ2V0RGlmZmljdWx0eSIsInByZWZpeGVkSGV4VG9CSSIsInNldEN1bXVsYXRpdmVEaWZmaWN1bHR5IiwiZ2V0Q3VtdWxhdGl2ZURpZmZpY3VsdHkiLCJnZXRIYXNoIiwiZ2V0TWFqb3JWZXJzaW9uIiwic2V0TWFqb3JWZXJzaW9uIiwiZ2V0TWlub3JWZXJzaW9uIiwic2V0TWlub3JWZXJzaW9uIiwiZ2V0Tm9uY2UiLCJzZXROb25jZSIsImdldE51bVR4cyIsInNldE51bVR4cyIsImdldE9ycGhhblN0YXR1cyIsInNldE9ycGhhblN0YXR1cyIsImdldFByZXZIYXNoIiwic2V0UHJldkhhc2giLCJnZXRSZXdhcmQiLCJzZXRSZXdhcmQiLCJnZXRUaW1lc3RhbXAiLCJzZXRUaW1lc3RhbXAiLCJnZXRXZWlnaHQiLCJzZXRXZWlnaHQiLCJnZXRMb25nVGVybVdlaWdodCIsInNldExvbmdUZXJtV2VpZ2h0IiwiZ2V0UG93SGFzaCIsInNldFBvd0hhc2giLCJzZXRNaW5lclR4SGFzaCIsInJwY0Jsb2NrIiwiTW9uZXJvQmxvY2siLCJzZXRIZXgiLCJibG9iIiwic2V0VHhIYXNoZXMiLCJycGNNaW5lclR4IiwianNvbiIsIkpTT04iLCJwYXJzZSIsIm1pbmVyX3R4IiwibWluZXJUeCIsInNldE1pbmVyVHgiLCJnZXRMYXN0UmVsYXllZFRpbWVzdGFtcCIsInNldExhc3RSZWxheWVkVGltZXN0YW1wIiwiZ2V0UmVjZWl2ZWRUaW1lc3RhbXAiLCJzZXRSZWNlaXZlZFRpbWVzdGFtcCIsImdldE51bUNvbmZpcm1hdGlvbnMiLCJnZXRJc0NvbmZpcm1lZCIsImdldEluVHhQb29sIiwiZ2V0SXNEb3VibGVTcGVuZFNlZW4iLCJzZXRWZXJzaW9uIiwiZ2V0RXh0cmEiLCJzZXRFeHRyYSIsIlVpbnQ4QXJyYXkiLCJnZW4iLCJzZXRJbnB1dHMiLCJtYXAiLCJycGNWaW4iLCJjb252ZXJ0UnBjT3V0cHV0Iiwic2V0T3V0cHV0cyIsInJwY091dHB1dCIsImdldFJjdFNpZ25hdHVyZXMiLCJzZXRSY3RTaWduYXR1cmVzIiwidHhuRmVlIiwiZ2V0RmVlIiwiZ2V0UmN0U2lnUHJ1bmFibGUiLCJzZXRSY3RTaWdQcnVuYWJsZSIsImdldFVubG9ja1RpbWUiLCJzZXRVbmxvY2tUaW1lIiwic2V0RnVsbEhleCIsImdldElzUmVsYXllZCIsImdldE91dHB1dEluZGljZXMiLCJzZXRPdXRwdXRJbmRpY2VzIiwiZ2V0UmVsYXkiLCJnZXRJc0tlcHRCeUJsb2NrIiwic2V0SXNLZXB0QnlCbG9jayIsImdldFNpZ25hdHVyZXMiLCJzZXRTaWduYXR1cmVzIiwiZ2V0SXNGYWlsZWQiLCJnZXRMYXN0RmFpbGVkSGVpZ2h0Iiwic2V0TGFzdEZhaWxlZEhlaWdodCIsImdldExhc3RGYWlsZWRIYXNoIiwic2V0TGFzdEZhaWxlZEhhc2giLCJnZXRNYXhVc2VkQmxvY2tIZWlnaHQiLCJzZXRNYXhVc2VkQmxvY2tIZWlnaHQiLCJnZXRNYXhVc2VkQmxvY2tIYXNoIiwic2V0TWF4VXNlZEJsb2NrSGFzaCIsImdldFBydW5hYmxlSGFzaCIsInNldFBydW5hYmxlSGFzaCIsImdldFBydW5hYmxlSGV4Iiwic2V0UHJ1bmFibGVIZXgiLCJzZXRQcnVuZWRIZXgiLCJnZXRPdXRwdXRzIiwic2V0SW5kZXgiLCJhc19qc29uIiwidHhfanNvbiIsIk1vbmVyb091dHB1dCIsInNldFR4IiwiZ2V0QW1vdW50Iiwic2V0QW1vdW50IiwiYW1vdW50IiwiZ2V0S2V5SW1hZ2UiLCJzZXRLZXlJbWFnZSIsIk1vbmVyb0tleUltYWdlIiwia19pbWFnZSIsImdldFJpbmdPdXRwdXRJbmRpY2VzIiwic2V0UmluZ091dHB1dEluZGljZXMiLCJrZXlfb2Zmc2V0cyIsInB1YktleSIsInRhZ2dlZF9rZXkiLCJnZXRTdGVhbHRoUHVibGljS2V5Iiwic2V0U3RlYWx0aFB1YmxpY0tleSIsInJwY1RlbXBsYXRlIiwidGVtcGxhdGUiLCJNb25lcm9CbG9ja1RlbXBsYXRlIiwic2V0QmxvY2tUZW1wbGF0ZUJsb2IiLCJzZXRCbG9ja0hhc2hpbmdCbG9iIiwic2V0RXhwZWN0ZWRSZXdhcmQiLCJzZXRSZXNlcnZlZE9mZnNldCIsInNldFNlZWRIZWlnaHQiLCJzZXRTZWVkSGFzaCIsInNldE5leHRTZWVkSGFzaCIsImdldE5leHRTZWVkSGFzaCIsInJwY0luZm8iLCJpbmZvIiwiTW9uZXJvRGFlbW9uSW5mbyIsInNldE51bUFsdEJsb2NrcyIsInNldEJsb2NrU2l6ZUxpbWl0Iiwic2V0QmxvY2tTaXplTWVkaWFuIiwic2V0QmxvY2tXZWlnaHRMaW1pdCIsInNldEJsb2NrV2VpZ2h0TWVkaWFuIiwic2V0Qm9vdHN0cmFwRGFlbW9uQWRkcmVzcyIsInNldEZyZWVTcGFjZSIsInNldERhdGFiYXNlU2l6ZSIsInNldE51bU9mZmxpbmVQZWVycyIsInNldEhlaWdodFdpdGhvdXRCb290c3RyYXAiLCJzZXROdW1JbmNvbWluZ0Nvbm5lY3Rpb25zIiwic2V0SXNPZmZsaW5lIiwic2V0TnVtT3V0Z29pbmdDb25uZWN0aW9ucyIsInNldE51bVJwY0Nvbm5lY3Rpb25zIiwic2V0U3RhcnRUaW1lc3RhbXAiLCJzZXRBZGp1c3RlZFRpbWVzdGFtcCIsInNldFRhcmdldCIsInNldFRhcmdldEhlaWdodCIsInNldFRvcEJsb2NrSGFzaCIsInNldE51bVR4c1Bvb2wiLCJzZXRXYXNCb290c3RyYXBFdmVyVXNlZCIsInNldE51bU9ubGluZVBlZXJzIiwic2V0VXBkYXRlQXZhaWxhYmxlIiwiZ2V0TmV0d29ya1R5cGUiLCJzZXROZXR3b3JrVHlwZSIsIk1vbmVyb05ldHdvcmtUeXBlIiwiTUFJTk5FVCIsIlRFU1RORVQiLCJTVEFHRU5FVCIsInNldENyZWRpdHMiLCJnZXRUb3BCbG9ja0hhc2giLCJzZXRJc0J1c3lTeW5jaW5nIiwic2V0SXNTeW5jaHJvbml6ZWQiLCJzZXRJc1Jlc3RyaWN0ZWQiLCJycGNTeW5jSW5mbyIsInN5bmNJbmZvIiwiTW9uZXJvRGFlbW9uU3luY0luZm8iLCJzZXRQZWVycyIsInJwY0Nvbm5lY3Rpb25zIiwic2V0U3BhbnMiLCJycGNTcGFucyIsInJwY1NwYW4iLCJnZXRTcGFucyIsImNvbnZlcnRScGNDb25uZWN0aW9uU3BhbiIsInNldE5leHROZWVkZWRQcnVuaW5nU2VlZCIsIm92ZXJ2aWV3IiwicnBjSGFyZEZvcmtJbmZvIiwiTW9uZXJvSGFyZEZvcmtJbmZvIiwic2V0RWFybGllc3RIZWlnaHQiLCJzZXRJc0VuYWJsZWQiLCJzZXRTdGF0ZSIsInNldFRocmVzaG9sZCIsInNldE51bVZvdGVzIiwic2V0Vm90aW5nIiwic2V0V2luZG93IiwicnBjQ29ubmVjdGlvblNwYW4iLCJzcGFuIiwiTW9uZXJvQ29ubmVjdGlvblNwYW4iLCJzZXRDb25uZWN0aW9uSWQiLCJzZXROdW1CbG9ja3MiLCJzZXRSYXRlIiwic2V0UmVtb3RlQWRkcmVzcyIsInNldFNwZWVkIiwic2V0U3RhcnRIZWlnaHQiLCJlbnRyeSIsIk1vbmVyb091dHB1dEhpc3RvZ3JhbUVudHJ5Iiwic2V0TnVtSW5zdGFuY2VzIiwic2V0TnVtVW5sb2NrZWRJbnN0YW5jZXMiLCJzZXROdW1SZWNlbnRJbnN0YW5jZXMiLCJycGNSZXN1bHQiLCJNb25lcm9TdWJtaXRUeFJlc3VsdCIsInNldElzRmVlVG9vTG93Iiwic2V0SGFzSW52YWxpZElucHV0Iiwic2V0SGFzSW52YWxpZE91dHB1dCIsInNldEhhc1Rvb0Zld091dHB1dHMiLCJzZXRJc01peGluVG9vTG93Iiwic2V0SXNPdmVyc3BlbmQiLCJzZXRSZWFzb24iLCJzZXRJc1Rvb0JpZyIsInNldFNhbml0eUNoZWNrRmFpbGVkIiwic2V0SXNUeEV4dHJhVG9vQmlnIiwicnBjU3RhdHMiLCJzdGF0cyIsIk1vbmVyb1R4UG9vbFN0YXRzIiwic2V0Qnl0ZXNNYXgiLCJzZXRCeXRlc01lZCIsInNldEJ5dGVzTWluIiwic2V0Qnl0ZXNUb3RhbCIsInNldEhpc3RvOThwYyIsInNldE51bTEwbSIsInNldE51bURvdWJsZVNwZW5kcyIsInNldE51bUZhaWxpbmciLCJzZXROdW1Ob3RSZWxheWVkIiwic2V0T2xkZXN0VGltZXN0YW1wIiwic2V0RmVlVG90YWwiLCJzZXRIaXN0byIsIk1hcCIsImVsZW0iLCJnZXRIaXN0byIsInNldCIsImJ5dGVzIiwiZ2V0SGlzdG85OHBjIiwiY2hhaW4iLCJNb25lcm9BbHRDaGFpbiIsInNldExlbmd0aCIsInNldEJsb2NrSGFzaGVzIiwic2V0TWFpbkNoYWluUGFyZW50QmxvY2tIYXNoIiwiTW9uZXJvUGVlciIsInNldElkIiwic2V0TGFzdFNlZW5UaW1lc3RhbXAiLCJzZXRQb3J0Iiwic2V0UnBjUG9ydCIsInNldFJwY0NyZWRpdHNQZXJIYXNoIiwic2V0QWRkcmVzcyIsInNldEF2Z0Rvd25sb2FkIiwic2V0QXZnVXBsb2FkIiwic2V0Q3VycmVudERvd25sb2FkIiwic2V0Q3VycmVudFVwbG9hZCIsInNldElzSW5jb21pbmciLCJzZXRMaXZlVGltZSIsInNldElzTG9jYWxJcCIsInNldElzTG9jYWxIb3N0IiwicGFyc2VJbnQiLCJzZXROdW1SZWNlaXZlcyIsInNldFJlY2VpdmVJZGxlVGltZSIsInNldE51bVNlbmRzIiwic2V0U2VuZElkbGVUaW1lIiwic2V0TnVtU3VwcG9ydEZsYWdzIiwic2V0VHlwZSIsImdldEhvc3QiLCJnZXRJcCIsImdldElzQmFubmVkIiwiZ2V0U2Vjb25kcyIsInJwY1N0YXR1cyIsIk1vbmVyb01pbmluZ1N0YXR1cyIsInNldElzQWN0aXZlIiwiYWN0aXZlIiwic3BlZWQiLCJzZXROdW1UaHJlYWRzIiwic2V0SXNCYWNrZ3JvdW5kIiwiaXNfYmFja2dyb3VuZF9taW5pbmdfZW5hYmxlZCIsIk1vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0Iiwic2V0QXV0b1VyaSIsInNldElzVXBkYXRlQXZhaWxhYmxlIiwic2V0VXNlclVyaSIsImdldEF1dG9VcmkiLCJnZXRVc2VyVXJpIiwiTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQiLCJzZXREb3dubG9hZFBhdGgiLCJnZXREb3dubG9hZFBhdGgiLCJoZXgiLCJkYWVtb25JZCIsIndvcmtlciIsIndyYXBwZWRMaXN0ZW5lcnMiLCJnZXRVVUlEIiwiYXNzaWduIiwiaW52b2tlV29ya2VyIiwiZ2V0V29ya2VyIiwid3JhcHBlZExpc3RlbmVyIiwiRGFlbW9uV29ya2VyTGlzdGVuZXIiLCJsaXN0ZW5lcklkIiwiZ2V0SWQiLCJhZGRXb3JrZXJDYWxsYmFjayIsImdldExpc3RlbmVyIiwicmVtb3ZlV29ya2VyQ2FsbGJhY2siLCJ2ZXJzaW9uSnNvbiIsIm51bWJlciIsImlzUmVsZWFzZSIsImZyb20iLCJhcmd1bWVudHMiLCJibG9ja0hlYWRlcnNKc29uIiwiYmxvY2tIZWFkZXJKc29uIiwiRGVzZXJpYWxpemF0aW9uVHlwZSIsIlRYIiwiZ2V0QmxvY2tzQnlIYXNoIiwiYmxvY2tIYXNoZXMiLCJibG9ja3NKc29uIiwiYmxvY2tKc29uIiwiZ2V0QmxvY2tIYXNoZXMiLCJnZXRUeFBvb2xCYWNrbG9nIiwib3V0cHV0cyIsImVudHJ5SnNvbiIsImFsdENoYWlucyIsImFsdENoYWluSnNvbiIsInBlZXJKc29uIiwiYmFuSnNvbiIsImJhbnNKc29uIiwidG9Kc29uIiwiZm5OYW1lIiwiYXJncyIsImxvb3BlciIsIlRhc2tMb29wZXIiLCJwb2xsIiwiaXNQb2xsaW5nIiwic3RhcnQiLCJsYXN0SGVhZGVyIiwiYW5ub3VuY2VCbG9ja0hlYWRlciIsImlkIiwiaGVhZGVySnNvbiIsIl9kZWZhdWx0IiwiZXhwb3J0cyIsImRlZmF1bHQiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy9kYWVtb24vTW9uZXJvRGFlbW9uUnBjLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IEdlblV0aWxzIGZyb20gXCIuLi9jb21tb24vR2VuVXRpbHNcIjtcbmltcG9ydCBMaWJyYXJ5VXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9MaWJyYXJ5VXRpbHNcIjtcbmltcG9ydCBUYXNrTG9vcGVyIGZyb20gXCIuLi9jb21tb24vVGFza0xvb3BlclwiO1xuaW1wb3J0IE1vbmVyb0FsdENoYWluIGZyb20gXCIuL21vZGVsL01vbmVyb0FsdENoYWluXCI7XG5pbXBvcnQgTW9uZXJvQmFuIGZyb20gXCIuL21vZGVsL01vbmVyb0JhblwiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrIGZyb20gXCIuL21vZGVsL01vbmVyb0Jsb2NrXCI7XG5pbXBvcnQgTW9uZXJvQmxvY2tIZWFkZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQmxvY2tIZWFkZXJcIjtcbmltcG9ydCBNb25lcm9CbG9ja1RlbXBsYXRlIGZyb20gXCIuL21vZGVsL01vbmVyb0Jsb2NrVGVtcGxhdGVcIjtcbmltcG9ydCBNb25lcm9Db25uZWN0aW9uU3BhbiBmcm9tIFwiLi9tb2RlbC9Nb25lcm9Db25uZWN0aW9uU3BhblwiO1xuaW1wb3J0IE1vbmVyb0RhZW1vbiBmcm9tIFwiLi9Nb25lcm9EYWVtb25cIjtcbmltcG9ydCBNb25lcm9EYWVtb25Db25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvRGFlbW9uQ29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uSW5mbyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9EYWVtb25JbmZvXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uTGlzdGVuZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvRGFlbW9uTGlzdGVuZXJcIjtcbmltcG9ydCBNb25lcm9EYWVtb25TeW5jSW5mbyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9EYWVtb25TeW5jSW5mb1wiO1xuaW1wb3J0IE1vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9GZWVFc3RpbWF0ZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9GZWVFc3RpbWF0ZVwiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuLi9jb21tb24vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBNb25lcm9IYXJkRm9ya0luZm8gZnJvbSBcIi4vbW9kZWwvTW9uZXJvSGFyZEZvcmtJbmZvXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2UgZnJvbSBcIi4vbW9kZWwvTW9uZXJvS2V5SW1hZ2VcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzIGZyb20gXCIuL21vZGVsL01vbmVyb0tleUltYWdlU3BlbnRTdGF0dXNcIjtcbmltcG9ydCBNb25lcm9NaW5lclR4U3VtIGZyb20gXCIuL21vZGVsL01vbmVyb01pbmVyVHhTdW1cIjtcbmltcG9ydCBNb25lcm9NaW5pbmdTdGF0dXMgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTWluaW5nU3RhdHVzXCI7XG5pbXBvcnQgTW9uZXJvTmV0d29ya1R5cGUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTmV0d29ya1R5cGVcIjtcbmltcG9ydCBNb25lcm9PdXRwdXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0XCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnlcIjtcbmltcG9ydCBNb25lcm9QZWVyIGZyb20gXCIuL21vZGVsL01vbmVyb1BlZXJcIjtcbmltcG9ydCBNb25lcm9QcnVuZVJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9QcnVuZVJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb1JwY0Nvbm5lY3Rpb24gZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9ScGNDb25uZWN0aW9uXCI7XG5pbXBvcnQgTW9uZXJvU3VibWl0VHhSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvU3VibWl0VHhSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9UeCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFwiO1xuaW1wb3J0IE1vbmVyb1R4UG9vbFN0YXRzIGZyb20gXCIuL21vZGVsL01vbmVyb1R4UG9vbFN0YXRzXCI7XG5pbXBvcnQgTW9uZXJvVXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9VdGlsc1wiO1xuaW1wb3J0IE1vbmVyb1ZlcnNpb24gZnJvbSBcIi4vbW9kZWwvTW9uZXJvVmVyc2lvblwiO1xuaW1wb3J0IHsgQ2hpbGRQcm9jZXNzIH0gZnJvbSBcImNoaWxkX3Byb2Nlc3NcIjtcblxuLyoqXG4gKiBDb3B5cmlnaHQgKGMpIHdvb2RzZXJcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbi8qKlxuICogSW1wbGVtZW50cyBhIE1vbmVyb0RhZW1vbiBhcyBhIGNsaWVudCBvZiBtb25lcm9kLlxuICovXG5jbGFzcyBNb25lcm9EYWVtb25ScGMgZXh0ZW5kcyBNb25lcm9EYWVtb24ge1xuXG4gIC8vIHN0YXRpYyB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIHN0YXRpYyByZWFkb25seSBNQVhfUkVRX1NJWkUgPSBcIjMwMDAwMDBcIjtcbiAgcHJvdGVjdGVkIHN0YXRpYyByZWFkb25seSBERUZBVUxUX0lEID0gXCIwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwXCI7IC8vIHVuaW5pdGlhbGl6ZWQgdHggb3IgYmxvY2sgaGFzaCBmcm9tIGRhZW1vbiBycGNcbiAgcHJvdGVjdGVkIHN0YXRpYyByZWFkb25seSBOVU1fSEVBREVSU19QRVJfUkVRID0gNzUwOyAvLyBudW1iZXIgb2YgaGVhZGVycyB0byBmZXRjaCBhbmQgY2FjaGUgcGVyIHJlcXVlc3RcbiAgcHJvdGVjdGVkIHN0YXRpYyByZWFkb25seSBERUZBVUxUX1BPTExfUEVSSU9EID0gMjAwMDA7IC8vIGRlZmF1bHQgaW50ZXJ2YWwgYmV0d2VlbiBwb2xsaW5nIHRoZSBkYWVtb24gaW4gbXNcblxuICAvLyBpbnN0YW5jZSB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIGNvbmZpZzogUGFydGlhbDxNb25lcm9EYWVtb25Db25maWc+O1xuICBwcm90ZWN0ZWQgbGlzdGVuZXJzOiBNb25lcm9EYWVtb25MaXN0ZW5lcltdO1xuICBwcm90ZWN0ZWQgY2FjaGVkSGVhZGVyczogYW55O1xuICBwcm90ZWN0ZWQgcHJvY2VzczogYW55O1xuICBwcm90ZWN0ZWQgcG9sbExpc3RlbmVyOiBhbnk7XG4gIHByb3RlY3RlZCBwcm94eURhZW1vbjogYW55O1xuIFxuICAvKiogQHByaXZhdGUgKi9cbiAgY29uc3RydWN0b3IoY29uZmlnOiBNb25lcm9EYWVtb25Db25maWcsIHByb3h5RGFlbW9uOiBNb25lcm9EYWVtb25ScGNQcm94eSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy5wcm94eURhZW1vbiA9IHByb3h5RGFlbW9uO1xuICAgIGlmIChjb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuO1xuICAgIHRoaXMubGlzdGVuZXJzID0gW107ICAgICAgLy8gYmxvY2sgbGlzdGVuZXJzXG4gICAgdGhpcy5jYWNoZWRIZWFkZXJzID0ge307ICAvLyBjYWNoZWQgaGVhZGVycyBmb3IgZmV0Y2hpbmcgYmxvY2tzIGluIGJvdW5kIGNodW5rc1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBpbnRlcm5hbCBwcm9jZXNzIHJ1bm5pbmcgbW9uZXJvZC5cbiAgICogXG4gICAqIEByZXR1cm4ge0NoaWxkUHJvY2Vzc30gdGhlIG5vZGUgcHJvY2VzcyBydW5uaW5nIG1vbmVyb2QsIHVuZGVmaW5lZCBpZiBub3QgY3JlYXRlZCBmcm9tIG5ldyBwcm9jZXNzXG4gICAqL1xuICBnZXRQcm9jZXNzKCk6IENoaWxkUHJvY2VzcyB7XG4gICAgcmV0dXJuIHRoaXMucHJvY2VzcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN0b3AgdGhlIGludGVybmFsIHByb2Nlc3MgcnVubmluZyBtb25lcm9kLCBpZiBhcHBsaWNhYmxlLlxuICAgKiBcbiAgICogQHBhcmFtIHtib29sZWFufSBbZm9yY2VdIHNwZWNpZmllcyBpZiB0aGUgcHJvY2VzcyBzaG91bGQgYmUgZGVzdHJveWVkIGZvcmNpYmx5IChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlciB8IHVuZGVmaW5lZD59IHRoZSBleGl0IGNvZGUgZnJvbSBzdG9wcGluZyB0aGUgcHJvY2Vzc1xuICAgKi9cbiAgYXN5bmMgc3RvcFByb2Nlc3MoZm9yY2UgPSBmYWxzZSk6IFByb21pc2U8bnVtYmVyIHwgdW5kZWZpbmVkPiB7XG4gICAgaWYgKHRoaXMucHJvY2VzcyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNb25lcm9EYWVtb25ScGMgaW5zdGFuY2Ugbm90IGNyZWF0ZWQgZnJvbSBuZXcgcHJvY2Vzc1wiKTtcbiAgICBsZXQgbGlzdGVuZXJzQ29weSA9IEdlblV0aWxzLmNvcHlBcnJheShhd2FpdCB0aGlzLmdldExpc3RlbmVycygpKTtcbiAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiBsaXN0ZW5lcnNDb3B5KSBhd2FpdCB0aGlzLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICByZXR1cm4gR2VuVXRpbHMua2lsbFByb2Nlc3ModGhpcy5wcm9jZXNzLCBmb3JjZSA/IFwiU0lHS0lMTFwiIDogdW5kZWZpbmVkKTtcbiAgfVxuICBcbiAgYXN5bmMgYWRkTGlzdGVuZXIobGlzdGVuZXI6IE1vbmVyb0RhZW1vbkxpc3RlbmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBhc3NlcnQobGlzdGVuZXIgaW5zdGFuY2VvZiBNb25lcm9EYWVtb25MaXN0ZW5lciwgXCJMaXN0ZW5lciBtdXN0IGJlIGluc3RhbmNlIG9mIE1vbmVyb0RhZW1vbkxpc3RlbmVyXCIpO1xuICAgIHRoaXMubGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuICAgIHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICB9XG4gIFxuICBhc3luYyByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcjogTW9uZXJvRGFlbW9uTGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24ucmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIGFzc2VydChsaXN0ZW5lciBpbnN0YW5jZW9mIE1vbmVyb0RhZW1vbkxpc3RlbmVyLCBcIkxpc3RlbmVyIG11c3QgYmUgaW5zdGFuY2Ugb2YgTW9uZXJvRGFlbW9uTGlzdGVuZXJcIik7XG4gICAgbGV0IGlkeCA9IHRoaXMubGlzdGVuZXJzLmluZGV4T2YobGlzdGVuZXIpO1xuICAgIGlmIChpZHggPiAtMSkgdGhpcy5saXN0ZW5lcnMuc3BsaWNlKGlkeCwgMSk7XG4gICAgZWxzZSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJMaXN0ZW5lciBpcyBub3QgcmVnaXN0ZXJlZCB3aXRoIGRhZW1vblwiKTtcbiAgICB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgfVxuICBcbiAgZ2V0TGlzdGVuZXJzKCk6IE1vbmVyb0RhZW1vbkxpc3RlbmVyW10ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRMaXN0ZW5lcnMoKTtcbiAgICByZXR1cm4gdGhpcy5saXN0ZW5lcnM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGRhZW1vbidzIFJQQyBjb25uZWN0aW9uLlxuICAgKiBcbiAgICogQHJldHVybiB7TW9uZXJvUnBjQ29ubmVjdGlvbn0gdGhlIGRhZW1vbidzIHJwYyBjb25uZWN0aW9uXG4gICAqL1xuICBhc3luYyBnZXRScGNDb25uZWN0aW9uKCkge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRScGNDb25uZWN0aW9uKCk7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmdldFNlcnZlcigpO1xuICB9XG4gIFxuICBhc3luYyBpc0Nvbm5lY3RlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uaXNDb25uZWN0ZWQoKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5nZXRWZXJzaW9uKCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGdldFZlcnNpb24oKTogUHJvbWlzZTxNb25lcm9WZXJzaW9uPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFZlcnNpb24oKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF92ZXJzaW9uXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1ZlcnNpb24ocmVzcC5yZXN1bHQudmVyc2lvbiwgcmVzcC5yZXN1bHQucmVsZWFzZSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzVHJ1c3RlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uaXNUcnVzdGVkKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJnZXRfaGVpZ2h0XCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIHJldHVybiAhcmVzcC51bnRydXN0ZWQ7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRIZWlnaHQoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9ibG9ja19jb3VudFwiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LmNvdW50O1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0hhc2goaGVpZ2h0OiBudW1iZXIpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRCbG9ja0hhc2goaGVpZ2h0KTtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcIm9uX2dldF9ibG9ja19oYXNoXCIsIFtoZWlnaHRdKSkucmVzdWx0OyAgLy8gVE9ETyBtb25lcm8td2FsbGV0LXJwYzogbm8gc3RhdHVzIHJldHVybmVkXG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrVGVtcGxhdGUod2FsbGV0QWRkcmVzczogc3RyaW5nLCByZXNlcnZlU2l6ZT86IG51bWJlcik6IFByb21pc2U8TW9uZXJvQmxvY2tUZW1wbGF0ZT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRCbG9ja1RlbXBsYXRlKHdhbGxldEFkZHJlc3MsIHJlc2VydmVTaXplKTtcbiAgICBhc3NlcnQod2FsbGV0QWRkcmVzcyAmJiB0eXBlb2Ygd2FsbGV0QWRkcmVzcyA9PT0gXCJzdHJpbmdcIiwgXCJNdXN0IHNwZWNpZnkgd2FsbGV0IGFkZHJlc3MgdG8gYmUgbWluZWQgdG9cIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmxvY2tfdGVtcGxhdGVcIiwge3dhbGxldF9hZGRyZXNzOiB3YWxsZXRBZGRyZXNzLCByZXNlcnZlX3NpemU6IHJlc2VydmVTaXplfSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Jsb2NrVGVtcGxhdGUocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBnZXRMYXN0QmxvY2tIZWFkZXIoKTogUHJvbWlzZTxNb25lcm9CbG9ja0hlYWRlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRMYXN0QmxvY2tIZWFkZXIoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9sYXN0X2Jsb2NrX2hlYWRlclwiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQmxvY2tIZWFkZXIocmVzcC5yZXN1bHQuYmxvY2tfaGVhZGVyKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tIZWFkZXJCeUhhc2goYmxvY2tIYXNoOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0Jsb2NrSGVhZGVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2NrSGVhZGVyQnlIYXNoKGJsb2NrSGFzaCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmxvY2tfaGVhZGVyX2J5X2hhc2hcIiwge2hhc2g6IGJsb2NrSGFzaH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNCbG9ja0hlYWRlcihyZXNwLnJlc3VsdC5ibG9ja19oZWFkZXIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0hlYWRlckJ5SGVpZ2h0KGhlaWdodDogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9CbG9ja0hlYWRlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRCbG9ja0hlYWRlckJ5SGVpZ2h0KGhlaWdodCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmxvY2tfaGVhZGVyX2J5X2hlaWdodFwiLCB7aGVpZ2h0OiBoZWlnaHR9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQmxvY2tIZWFkZXIocmVzcC5yZXN1bHQuYmxvY2tfaGVhZGVyKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tIZWFkZXJzQnlSYW5nZShzdGFydEhlaWdodD86IG51bWJlciwgZW5kSGVpZ2h0PzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9CbG9ja0hlYWRlcltdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2NrSGVhZGVyc0J5UmFuZ2Uoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCk7XG4gICAgXG4gICAgLy8gZmV0Y2ggYmxvY2sgaGVhZGVyc1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2Jsb2NrX2hlYWRlcnNfcmFuZ2VcIiwge1xuICAgICAgc3RhcnRfaGVpZ2h0OiBzdGFydEhlaWdodCxcbiAgICAgIGVuZF9oZWlnaHQ6IGVuZEhlaWdodFxuICAgIH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICBcbiAgICAvLyBidWlsZCBoZWFkZXJzXG4gICAgbGV0IGhlYWRlcnMgPSBbXTtcbiAgICBmb3IgKGxldCBycGNIZWFkZXIgb2YgcmVzcC5yZXN1bHQuaGVhZGVycykge1xuICAgICAgaGVhZGVycy5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQmxvY2tIZWFkZXIocnBjSGVhZGVyKSk7XG4gICAgfVxuICAgIHJldHVybiBoZWFkZXJzO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0J5SGFzaChibG9ja0hhc2g6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQmxvY2s+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tCeUhhc2goYmxvY2tIYXNoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9ibG9ja1wiLCB7aGFzaDogYmxvY2tIYXNofSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Jsb2NrKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tCeUhlaWdodChoZWlnaHQ6IG51bWJlcik6IFByb21pc2U8TW9uZXJvQmxvY2s+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tCeUhlaWdodChoZWlnaHQpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2Jsb2NrXCIsIHtoZWlnaHQ6IGhlaWdodH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNCbG9jayhyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2Nrc0J5SGVpZ2h0KGhlaWdodHM6IG51bWJlcltdKTogUHJvbWlzZTxNb25lcm9CbG9ja1tdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2Nrc0J5SGVpZ2h0KGhlaWdodHMpO1xuICAgIFxuICAgIC8vIGZldGNoIGJsb2NrcyBpbiBiaW5hcnlcbiAgICBsZXQgcmVzcEJpbiA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRCaW5hcnlSZXF1ZXN0KFwiZ2V0X2Jsb2Nrc19ieV9oZWlnaHQuYmluXCIsIHtoZWlnaHRzOiBoZWlnaHRzfSk7XG4gICAgXG4gICAgLy8gY29udmVydCBiaW5hcnkgYmxvY2tzIHRvIGpzb25cbiAgICBsZXQgcnBjQmxvY2tzID0gYXdhaXQgTW9uZXJvVXRpbHMuYmluYXJ5QmxvY2tzVG9Kc29uKHJlc3BCaW4pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJwY0Jsb2Nrcyk7XG4gICAgXG4gICAgLy8gYnVpbGQgYmxvY2tzIHdpdGggdHJhbnNhY3Rpb25zXG4gICAgYXNzZXJ0LmVxdWFsKHJwY0Jsb2Nrcy50eHMubGVuZ3RoLCBycGNCbG9ja3MuYmxvY2tzLmxlbmd0aCk7ICAgIFxuICAgIGxldCBibG9ja3MgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0lkeCA9IDA7IGJsb2NrSWR4IDwgcnBjQmxvY2tzLmJsb2Nrcy5sZW5ndGg7IGJsb2NrSWR4KyspIHtcbiAgICAgIFxuICAgICAgLy8gYnVpbGQgYmxvY2tcbiAgICAgIGxldCBibG9jayA9IE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQmxvY2socnBjQmxvY2tzLmJsb2Nrc1tibG9ja0lkeF0pO1xuICAgICAgYmxvY2suc2V0SGVpZ2h0KGhlaWdodHNbYmxvY2tJZHhdKTtcbiAgICAgIGJsb2Nrcy5wdXNoKGJsb2NrKTtcbiAgICAgIFxuICAgICAgLy8gYnVpbGQgdHJhbnNhY3Rpb25zXG4gICAgICBsZXQgdHhzID0gW107XG4gICAgICBmb3IgKGxldCB0eElkeCA9IDA7IHR4SWR4IDwgcnBjQmxvY2tzLnR4c1tibG9ja0lkeF0ubGVuZ3RoOyB0eElkeCsrKSB7XG4gICAgICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeCgpO1xuICAgICAgICB0eHMucHVzaCh0eCk7XG4gICAgICAgIHR4LnNldEhhc2gocnBjQmxvY2tzLmJsb2Nrc1tibG9ja0lkeF0udHhfaGFzaGVzW3R4SWR4XSk7XG4gICAgICAgIHR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgICAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgICAgdHguc2V0SXNEb3VibGVTcGVuZFNlZW4oZmFsc2UpO1xuICAgICAgICBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1R4KHJwY0Jsb2Nrcy50eHNbYmxvY2tJZHhdW3R4SWR4XSwgdHgpO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBtZXJnZSBpbnRvIG9uZSBibG9ja1xuICAgICAgYmxvY2suc2V0VHhzKFtdKTtcbiAgICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgICBpZiAodHguZ2V0QmxvY2soKSkgYmxvY2subWVyZ2UodHguZ2V0QmxvY2soKSk7XG4gICAgICAgIGVsc2UgYmxvY2suZ2V0VHhzKCkucHVzaCh0eC5zZXRCbG9jayhibG9jaykpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gYmxvY2tzO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja3NCeVJhbmdlKHN0YXJ0SGVpZ2h0PzogbnVtYmVyLCBlbmRIZWlnaHQ/OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb0Jsb2NrW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tzQnlSYW5nZShzdGFydEhlaWdodCwgZW5kSGVpZ2h0KTtcbiAgICBpZiAoc3RhcnRIZWlnaHQgPT09IHVuZGVmaW5lZCkgc3RhcnRIZWlnaHQgPSAwO1xuICAgIGlmIChlbmRIZWlnaHQgPT09IHVuZGVmaW5lZCkgZW5kSGVpZ2h0ID0gYXdhaXQgdGhpcy5nZXRIZWlnaHQoKSAtIDE7XG4gICAgbGV0IGhlaWdodHMgPSBbXTtcbiAgICBmb3IgKGxldCBoZWlnaHQgPSBzdGFydEhlaWdodDsgaGVpZ2h0IDw9IGVuZEhlaWdodDsgaGVpZ2h0KyspIGhlaWdodHMucHVzaChoZWlnaHQpO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmdldEJsb2Nrc0J5SGVpZ2h0KGhlaWdodHMpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja3NCeVJhbmdlQ2h1bmtlZChzdGFydEhlaWdodD86IG51bWJlciwgZW5kSGVpZ2h0PzogbnVtYmVyLCBtYXhDaHVua1NpemU/OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb0Jsb2NrW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tzQnlSYW5nZUNodW5rZWQoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgbWF4Q2h1bmtTaXplKTtcbiAgICBpZiAoc3RhcnRIZWlnaHQgPT09IHVuZGVmaW5lZCkgc3RhcnRIZWlnaHQgPSAwO1xuICAgIGlmIChlbmRIZWlnaHQgPT09IHVuZGVmaW5lZCkgZW5kSGVpZ2h0ID0gYXdhaXQgdGhpcy5nZXRIZWlnaHQoKSAtIDE7XG4gICAgbGV0IGxhc3RIZWlnaHQgPSBzdGFydEhlaWdodCAtIDE7XG4gICAgbGV0IGJsb2NrcyA9IFtdO1xuICAgIHdoaWxlIChsYXN0SGVpZ2h0IDwgZW5kSGVpZ2h0KSB7XG4gICAgICBmb3IgKGxldCBibG9jayBvZiBhd2FpdCB0aGlzLmdldE1heEJsb2NrcyhsYXN0SGVpZ2h0ICsgMSwgZW5kSGVpZ2h0LCBtYXhDaHVua1NpemUpKSB7XG4gICAgICAgIGJsb2Nrcy5wdXNoKGJsb2NrKTtcbiAgICAgIH1cbiAgICAgIGxhc3RIZWlnaHQgPSBibG9ja3NbYmxvY2tzLmxlbmd0aCAtIDFdLmdldEhlaWdodCgpO1xuICAgIH1cbiAgICByZXR1cm4gYmxvY2tzO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeHModHhIYXNoZXM6IHN0cmluZ1tdLCBwcnVuZSA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9UeFtdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFR4cyh0eEhhc2hlcywgcHJ1bmUpO1xuICAgICAgICBcbiAgICAvLyB2YWxpZGF0ZSBpbnB1dFxuICAgIGFzc2VydChBcnJheS5pc0FycmF5KHR4SGFzaGVzKSAmJiB0eEhhc2hlcy5sZW5ndGggPiAwLCBcIk11c3QgcHJvdmlkZSBhbiBhcnJheSBvZiB0cmFuc2FjdGlvbiBoYXNoZXNcIik7XG4gICAgYXNzZXJ0KHBydW5lID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIHBydW5lID09PSBcImJvb2xlYW5cIiwgXCJQcnVuZSBtdXN0IGJlIGEgYm9vbGVhbiBvciB1bmRlZmluZWRcIik7XG4gICAgICAgIFxuICAgIC8vIGZldGNoIHRyYW5zYWN0aW9uc1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwiZ2V0X3RyYW5zYWN0aW9uc1wiLCB7XG4gICAgICB0eHNfaGFzaGVzOiB0eEhhc2hlcyxcbiAgICAgIGRlY29kZV9hc19qc29uOiB0cnVlLFxuICAgICAgcHJ1bmU6IHBydW5lXG4gICAgfSk7XG4gICAgdHJ5IHtcbiAgICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUubWVzc2FnZS5pbmRleE9mKFwiRmFpbGVkIHRvIHBhcnNlIGhleCByZXByZXNlbnRhdGlvbiBvZiB0cmFuc2FjdGlvbiBoYXNoXCIpID49IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkludmFsaWQgdHJhbnNhY3Rpb24gaGFzaFwiKTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICAgICAgICBcbiAgICAvLyBidWlsZCB0cmFuc2FjdGlvbiBtb2RlbHNcbiAgICBsZXQgdHhzID0gW107XG4gICAgaWYgKHJlc3AudHhzKSB7XG4gICAgICBmb3IgKGxldCB0eElkeCA9IDA7IHR4SWR4IDwgcmVzcC50eHMubGVuZ3RoOyB0eElkeCsrKSB7XG4gICAgICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeCgpO1xuICAgICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgICAgICB0eHMucHVzaChNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1R4KHJlc3AudHhzW3R4SWR4XSwgdHgpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHR4cztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhIZXhlcyh0eEhhc2hlczogc3RyaW5nW10sIHBydW5lID0gZmFsc2UpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFR4SGV4ZXModHhIYXNoZXMsIHBydW5lKTtcbiAgICBsZXQgaGV4ZXMgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiBhd2FpdCB0aGlzLmdldFR4cyh0eEhhc2hlcywgcHJ1bmUpKSBoZXhlcy5wdXNoKHBydW5lID8gdHguZ2V0UHJ1bmVkSGV4KCkgOiB0eC5nZXRGdWxsSGV4KCkpO1xuICAgIHJldHVybiBoZXhlcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TWluZXJUeFN1bShoZWlnaHQ6IG51bWJlciwgbnVtQmxvY2tzOiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb01pbmVyVHhTdW0+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0TWluZXJUeFN1bShoZWlnaHQsIG51bUJsb2Nrcyk7XG4gICAgaWYgKGhlaWdodCA9PT0gdW5kZWZpbmVkKSBoZWlnaHQgPSAwO1xuICAgIGVsc2UgYXNzZXJ0KGhlaWdodCA+PSAwLCBcIkhlaWdodCBtdXN0IGJlIGFuIGludGVnZXIgPj0gMFwiKTtcbiAgICBpZiAobnVtQmxvY2tzID09PSB1bmRlZmluZWQpIG51bUJsb2NrcyA9IGF3YWl0IHRoaXMuZ2V0SGVpZ2h0KCk7XG4gICAgZWxzZSBhc3NlcnQobnVtQmxvY2tzID49IDAsIFwiQ291bnQgbXVzdCBiZSBhbiBpbnRlZ2VyID49IDBcIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfY29pbmJhc2VfdHhfc3VtXCIsIHtoZWlnaHQ6IGhlaWdodCwgY291bnQ6IG51bUJsb2Nrc30pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICBsZXQgdHhTdW0gPSBuZXcgTW9uZXJvTWluZXJUeFN1bSgpO1xuICAgIHR4U3VtLnNldEVtaXNzaW9uU3VtKEJpZ0ludChyZXNwLnJlc3VsdC5lbWlzc2lvbl9hbW91bnQpKTtcbiAgICB0eFN1bS5zZXRGZWVTdW0oQmlnSW50KHJlc3AucmVzdWx0LmZlZV9hbW91bnQpKTtcbiAgICByZXR1cm4gdHhTdW07XG4gIH1cbiAgXG4gIGFzeW5jIGdldEZlZUVzdGltYXRlKGdyYWNlQmxvY2tzPzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9GZWVFc3RpbWF0ZT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRGZWVFc3RpbWF0ZShncmFjZUJsb2Nrcyk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfZmVlX2VzdGltYXRlXCIsIHtncmFjZV9ibG9ja3M6IGdyYWNlQmxvY2tzfSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIGxldCBmZWVFc3RpbWF0ZSA9IG5ldyBNb25lcm9GZWVFc3RpbWF0ZSgpO1xuICAgIGZlZUVzdGltYXRlLnNldEZlZShCaWdJbnQocmVzcC5yZXN1bHQuZmVlKSk7XG4gICAgbGV0IGZlZXMgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlc3AucmVzdWx0LmZlZXMubGVuZ3RoOyBpKyspIGZlZXMucHVzaChCaWdJbnQocmVzcC5yZXN1bHQuZmVlc1tpXSkpO1xuICAgIGZlZUVzdGltYXRlLnNldEZlZXMoZmVlcyk7XG4gICAgZmVlRXN0aW1hdGUuc2V0UXVhbnRpemF0aW9uTWFzayhCaWdJbnQocmVzcC5yZXN1bHQucXVhbnRpemF0aW9uX21hc2spKTtcbiAgICByZXR1cm4gZmVlRXN0aW1hdGU7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdFR4SGV4KHR4SGV4OiBzdHJpbmcsIGRvTm90UmVsYXk6IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb1N1Ym1pdFR4UmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnN1Ym1pdFR4SGV4KHR4SGV4LCBkb05vdFJlbGF5KTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcInNlbmRfcmF3X3RyYW5zYWN0aW9uXCIsIHt0eF9hc19oZXg6IHR4SGV4LCBkb19ub3RfcmVsYXk6IGRvTm90UmVsYXl9KTtcbiAgICBsZXQgcmVzdWx0ID0gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNTdWJtaXRUeFJlc3VsdChyZXNwKTtcbiAgICBcbiAgICAvLyBzZXQgaXNHb29kIGJhc2VkIG9uIHN0YXR1c1xuICAgIHRyeSB7XG4gICAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTsgXG4gICAgICByZXN1bHQuc2V0SXNHb29kKHRydWUpO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgcmVzdWx0LnNldElzR29vZChmYWxzZSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbGF5VHhzQnlIYXNoKHR4SGFzaGVzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5yZWxheVR4c0J5SGFzaCh0eEhhc2hlcyk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJyZWxheV90eFwiLCB7dHhpZHM6IHR4SGFzaGVzfSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFBvb2woKTogUHJvbWlzZTxNb25lcm9UeFtdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFR4UG9vbCgpO1xuICAgIFxuICAgIC8vIHNlbmQgcnBjIHJlcXVlc3RcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImdldF90cmFuc2FjdGlvbl9wb29sXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIFxuICAgIC8vIGJ1aWxkIHR4c1xuICAgIGxldCB0eHMgPSBbXTtcbiAgICBpZiAocmVzcC50cmFuc2FjdGlvbnMpIHtcbiAgICAgIGZvciAobGV0IHJwY1R4IG9mIHJlc3AudHJhbnNhY3Rpb25zKSB7XG4gICAgICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeCgpO1xuICAgICAgICB0eHMucHVzaCh0eCk7XG4gICAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICAgICAgdHguc2V0SW5UeFBvb2wodHJ1ZSk7XG4gICAgICAgIHR4LnNldE51bUNvbmZpcm1hdGlvbnMoMCk7XG4gICAgICAgIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVHgocnBjVHgsIHR4KTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHR4cztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhQb29sSGFzaGVzKCk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIC8vIGFzeW5jIGdldFR4UG9vbEJhY2tsb2coKTogUHJvbWlzZTxNb25lcm9UeEJhY2tsb2dFbnRyeVtdPiB7XG4gIC8vICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICAvLyB9XG5cbiAgYXN5bmMgZ2V0VHhQb29sU3RhdHMoKTogUHJvbWlzZTxNb25lcm9UeFBvb2xTdGF0cz4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRUeFBvb2xTdGF0cygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwiZ2V0X3RyYW5zYWN0aW9uX3Bvb2xfc3RhdHNcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVHhQb29sU3RhdHMocmVzcC5wb29sX3N0YXRzKTtcbiAgfVxuICBcbiAgYXN5bmMgZmx1c2hUeFBvb2woaGFzaGVzPzogc3RyaW5nIHwgc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZmx1c2hUeFBvb2woaGFzaGVzKTtcbiAgICBpZiAoaGFzaGVzKSBoYXNoZXMgPSBHZW5VdGlscy5saXN0aWZ5KGhhc2hlcyk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJmbHVzaF90eHBvb2xcIiwge3R4aWRzOiBoYXNoZXN9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEtleUltYWdlU3BlbnRTdGF0dXNlcyhrZXlJbWFnZXM6IHN0cmluZ1tdKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzKGtleUltYWdlcyk7XG4gICAgaWYgKGtleUltYWdlcyA9PT0gdW5kZWZpbmVkIHx8IGtleUltYWdlcy5sZW5ndGggPT09IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBrZXkgaW1hZ2VzIHRvIGNoZWNrIHRoZSBzdGF0dXMgb2ZcIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJpc19rZXlfaW1hZ2Vfc3BlbnRcIiwge2tleV9pbWFnZXM6IGtleUltYWdlc30pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIHJldHVybiByZXNwLnNwZW50X3N0YXR1cztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0T3V0cHV0SGlzdG9ncmFtKGFtb3VudHM/OiBiaWdpbnRbXSwgbWluQ291bnQ/OiBudW1iZXIsIG1heENvdW50PzogbnVtYmVyLCBpc1VubG9ja2VkPzogYm9vbGVhbiwgcmVjZW50Q3V0b2ZmPzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeVtdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldE91dHB1dEhpc3RvZ3JhbShhbW91bnRzLCBtaW5Db3VudCwgbWF4Q291bnQsIGlzVW5sb2NrZWQsIHJlY2VudEN1dG9mZik7XG4gICAgXG4gICAgLy8gc2VuZCBycGMgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X291dHB1dF9oaXN0b2dyYW1cIiwge1xuICAgICAgYW1vdW50czogYW1vdW50cyxcbiAgICAgIG1pbl9jb3VudDogbWluQ291bnQsXG4gICAgICBtYXhfY291bnQ6IG1heENvdW50LFxuICAgICAgdW5sb2NrZWQ6IGlzVW5sb2NrZWQsXG4gICAgICByZWNlbnRfY3V0b2ZmOiByZWNlbnRDdXRvZmZcbiAgICB9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgXG4gICAgLy8gYnVpbGQgaGlzdG9ncmFtIGVudHJpZXMgZnJvbSByZXNwb25zZVxuICAgIGxldCBlbnRyaWVzID0gW107XG4gICAgaWYgKCFyZXNwLnJlc3VsdC5oaXN0b2dyYW0pIHJldHVybiBlbnRyaWVzO1xuICAgIGZvciAobGV0IHJwY0VudHJ5IG9mIHJlc3AucmVzdWx0Lmhpc3RvZ3JhbSkge1xuICAgICAgZW50cmllcy5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjT3V0cHV0SGlzdG9ncmFtRW50cnkocnBjRW50cnkpKTtcbiAgICB9XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dERpc3RyaWJ1dGlvbihhbW91bnRzLCBjdW11bGF0aXZlLCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldE91dHB1dERpc3RyaWJ1dGlvbihhbW91bnRzLCBjdW11bGF0aXZlLCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0KTtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQgKHJlc3BvbnNlICdkaXN0cmlidXRpb24nIGZpZWxkIGlzIGJpbmFyeSlcIik7XG4gICAgXG4vLyAgICBsZXQgYW1vdW50U3RycyA9IFtdO1xuLy8gICAgZm9yIChsZXQgYW1vdW50IG9mIGFtb3VudHMpIGFtb3VudFN0cnMucHVzaChhbW91bnQudG9KU1ZhbHVlKCkpO1xuLy8gICAgY29uc29sZS5sb2coYW1vdW50U3Rycyk7XG4vLyAgICBjb25zb2xlLmxvZyhjdW11bGF0aXZlKTtcbi8vICAgIGNvbnNvbGUubG9nKHN0YXJ0SGVpZ2h0KTtcbi8vICAgIGNvbnNvbGUubG9nKGVuZEhlaWdodCk7XG4vLyAgICBcbi8vICAgIC8vIHNlbmQgcnBjIHJlcXVlc3Rcbi8vICAgIGNvbnNvbGUubG9nKFwiKioqKioqKioqKiogU0VORElORyBSRVFVRVNUICoqKioqKioqKioqKipcIik7XG4vLyAgICBpZiAoc3RhcnRIZWlnaHQgPT09IHVuZGVmaW5lZCkgc3RhcnRIZWlnaHQgPSAwO1xuLy8gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfb3V0cHV0X2Rpc3RyaWJ1dGlvblwiLCB7XG4vLyAgICAgIGFtb3VudHM6IGFtb3VudFN0cnMsXG4vLyAgICAgIGN1bXVsYXRpdmU6IGN1bXVsYXRpdmUsXG4vLyAgICAgIGZyb21faGVpZ2h0OiBzdGFydEhlaWdodCxcbi8vICAgICAgdG9faGVpZ2h0OiBlbmRIZWlnaHRcbi8vICAgIH0pO1xuLy8gICAgXG4vLyAgICBjb25zb2xlLmxvZyhcIlJFU1BPTlNFXCIpO1xuLy8gICAgY29uc29sZS5sb2cocmVzcCk7XG4vLyAgICBcbi8vICAgIC8vIGJ1aWxkIGRpc3RyaWJ1dGlvbiBlbnRyaWVzIGZyb20gcmVzcG9uc2Vcbi8vICAgIGxldCBlbnRyaWVzID0gW107XG4vLyAgICBpZiAoIXJlc3AucmVzdWx0LmRpc3RyaWJ1dGlvbnMpIHJldHVybiBlbnRyaWVzOyBcbi8vICAgIGZvciAobGV0IHJwY0VudHJ5IG9mIHJlc3AucmVzdWx0LmRpc3RyaWJ1dGlvbnMpIHtcbi8vICAgICAgbGV0IGVudHJ5ID0gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNPdXRwdXREaXN0cmlidXRpb25FbnRyeShycGNFbnRyeSk7XG4vLyAgICAgIGVudHJpZXMucHVzaChlbnRyeSk7XG4vLyAgICB9XG4vLyAgICByZXR1cm4gZW50cmllcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SW5mbygpOiBQcm9taXNlPE1vbmVyb0RhZW1vbkluZm8+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0SW5mbygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2luZm9cIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0luZm8ocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBnZXRTeW5jSW5mbygpOiBQcm9taXNlPE1vbmVyb0RhZW1vblN5bmNJbmZvPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFN5bmNJbmZvKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzeW5jX2luZm9cIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1N5bmNJbmZvKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGFyZEZvcmtJbmZvKCk6IFByb21pc2U8TW9uZXJvSGFyZEZvcmtJbmZvPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEhhcmRGb3JrSW5mbygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiaGFyZF9mb3JrX2luZm9cIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0hhcmRGb3JrSW5mbyhyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFsdENoYWlucygpOiBQcm9taXNlPE1vbmVyb0FsdENoYWluW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QWx0Q2hhaW5zKCk7XG4gICAgXG4vLyAgICAvLyBtb2NrZWQgcmVzcG9uc2UgZm9yIHRlc3Rcbi8vICAgIGxldCByZXNwID0ge1xuLy8gICAgICAgIHN0YXR1czogXCJPS1wiLFxuLy8gICAgICAgIGNoYWluczogW1xuLy8gICAgICAgICAge1xuLy8gICAgICAgICAgICBibG9ja19oYXNoOiBcIjY5N2NmMDNjODlhOWIxMThmN2JkZjExYjFiM2E2YTAyOGQ3YjM2MTdkMmQwZWQ5MTMyMmM1NzA5YWNmNzU2MjVcIixcbi8vICAgICAgICAgICAgZGlmZmljdWx0eTogMTQxMTQ3Mjk2MzgzMDAyODAsXG4vLyAgICAgICAgICAgIGhlaWdodDogMTU2MjA2Mixcbi8vICAgICAgICAgICAgbGVuZ3RoOiAyXG4vLyAgICAgICAgICB9XG4vLyAgICAgICAgXVxuLy8gICAgfVxuICAgIFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FsdGVybmF0ZV9jaGFpbnNcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIGxldCBjaGFpbnMgPSBbXTtcbiAgICBpZiAoIXJlc3AucmVzdWx0LmNoYWlucykgcmV0dXJuIGNoYWlucztcbiAgICBmb3IgKGxldCBycGNDaGFpbiBvZiByZXNwLnJlc3VsdC5jaGFpbnMpIGNoYWlucy5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQWx0Q2hhaW4ocnBjQ2hhaW4pKTtcbiAgICByZXR1cm4gY2hhaW5zO1xuICB9XG4gIFxuICBhc3luYyBnZXRBbHRCbG9ja0hhc2hlcygpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEFsdEJsb2NrSGFzaGVzKCk7XG4gICAgXG4vLyAgICAvLyBtb2NrZWQgcmVzcG9uc2UgZm9yIHRlc3Rcbi8vICAgIGxldCByZXNwID0ge1xuLy8gICAgICAgIHN0YXR1czogXCJPS1wiLFxuLy8gICAgICAgIHVudHJ1c3RlZDogZmFsc2UsXG4vLyAgICAgICAgYmxrc19oYXNoZXM6IFtcIjljMjI3N2M1NDcwMjM0YmU4YjMyMzgyY2RmODA5NGExMDNhYmE0ZmNkNWU4NzVhNmZjMTU5ZGMyZWMwMGUwMTFcIixcIjYzN2MwZTBmMDU1OGUyODQ0OTNmMzhhNWZjY2EzNjE1ZGI1OTQ1OGQ5MGQzYTVlZmYwYTE4ZmY1OWI4M2Y0NmZcIixcIjZmM2FkYzE3NGEyZTgwODI4MTllYmI5NjVjOTZhMDk1ZTNlOGI2MzkyOWFkOWJlMmQ3MDVhZDljMDg2YTZiMWNcIixcIjY5N2NmMDNjODlhOWIxMThmN2JkZjExYjFiM2E2YTAyOGQ3YjM2MTdkMmQwZWQ5MTMyMmM1NzA5YWNmNzU2MjVcIl1cbi8vICAgIH1cbiAgICBcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImdldF9hbHRfYmxvY2tzX2hhc2hlc1wiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICBpZiAoIXJlc3AuYmxrc19oYXNoZXMpIHJldHVybiBbXTtcbiAgICByZXR1cm4gcmVzcC5ibGtzX2hhc2hlcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RG93bmxvYWRMaW1pdCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXREb3dubG9hZExpbWl0KCk7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldEJhbmR3aWR0aExpbWl0cygpKVswXTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0RG93bmxvYWRMaW1pdChsaW1pdDogbnVtYmVyKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc2V0RG93bmxvYWRMaW1pdChsaW1pdCk7XG4gICAgaWYgKGxpbWl0ID09IC0xKSByZXR1cm4gYXdhaXQgdGhpcy5yZXNldERvd25sb2FkTGltaXQoKTtcbiAgICBpZiAoIShHZW5VdGlscy5pc0ludChsaW1pdCkgJiYgbGltaXQgPiAwKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiRG93bmxvYWQgbGltaXQgbXVzdCBiZSBhbiBpbnRlZ2VyIGdyZWF0ZXIgdGhhbiAwXCIpO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5zZXRCYW5kd2lkdGhMaW1pdHMobGltaXQsIDApKVswXTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzZXREb3dubG9hZExpbWl0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnJlc2V0RG93bmxvYWRMaW1pdCgpO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5zZXRCYW5kd2lkdGhMaW1pdHMoLTEsIDApKVswXTtcbiAgfVxuXG4gIGFzeW5jIGdldFVwbG9hZExpbWl0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFVwbG9hZExpbWl0KCk7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldEJhbmR3aWR0aExpbWl0cygpKVsxXTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0VXBsb2FkTGltaXQobGltaXQ6IG51bWJlcik6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnNldFVwbG9hZExpbWl0KGxpbWl0KTtcbiAgICBpZiAobGltaXQgPT0gLTEpIHJldHVybiBhd2FpdCB0aGlzLnJlc2V0VXBsb2FkTGltaXQoKTtcbiAgICBpZiAoIShHZW5VdGlscy5pc0ludChsaW1pdCkgJiYgbGltaXQgPiAwKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiVXBsb2FkIGxpbWl0IG11c3QgYmUgYW4gaW50ZWdlciBncmVhdGVyIHRoYW4gMFwiKTtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuc2V0QmFuZHdpZHRoTGltaXRzKDAsIGxpbWl0KSlbMV07XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2V0VXBsb2FkTGltaXQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24ucmVzZXRVcGxvYWRMaW1pdCgpO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5zZXRCYW5kd2lkdGhMaW1pdHMoMCwgLTEpKVsxXTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGVlcnMoKTogUHJvbWlzZTxNb25lcm9QZWVyW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0UGVlcnMoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9jb25uZWN0aW9uc1wiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgbGV0IHBlZXJzID0gW107XG4gICAgaWYgKCFyZXNwLnJlc3VsdC5jb25uZWN0aW9ucykgcmV0dXJuIHBlZXJzO1xuICAgIGZvciAobGV0IHJwY0Nvbm5lY3Rpb24gb2YgcmVzcC5yZXN1bHQuY29ubmVjdGlvbnMpIHtcbiAgICAgIHBlZXJzLnB1c2goTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNDb25uZWN0aW9uKHJwY0Nvbm5lY3Rpb24pKTtcbiAgICB9XG4gICAgcmV0dXJuIHBlZXJzO1xuICB9XG4gIFxuICBhc3luYyBnZXRLbm93blBlZXJzKCk6IFByb21pc2U8TW9uZXJvUGVlcltdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEtub3duUGVlcnMoKTtcbiAgICBcbiAgICAvLyB0eCBjb25maWdcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImdldF9wZWVyX2xpc3RcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgXG4gICAgLy8gYnVpbGQgcGVlcnNcbiAgICBsZXQgcGVlcnMgPSBbXTtcbiAgICBpZiAocmVzcC5ncmF5X2xpc3QpIHtcbiAgICAgIGZvciAobGV0IHJwY1BlZXIgb2YgcmVzcC5ncmF5X2xpc3QpIHtcbiAgICAgICAgbGV0IHBlZXIgPSBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1BlZXIocnBjUGVlcik7XG4gICAgICAgIHBlZXIuc2V0SXNPbmxpbmUoZmFsc2UpOyAvLyBncmF5IGxpc3QgbWVhbnMgb2ZmbGluZSBsYXN0IGNoZWNrZWRcbiAgICAgICAgcGVlcnMucHVzaChwZWVyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHJlc3Aud2hpdGVfbGlzdCkge1xuICAgICAgZm9yIChsZXQgcnBjUGVlciBvZiByZXNwLndoaXRlX2xpc3QpIHtcbiAgICAgICAgbGV0IHBlZXIgPSBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1BlZXIocnBjUGVlcik7XG4gICAgICAgIHBlZXIuc2V0SXNPbmxpbmUodHJ1ZSk7IC8vIHdoaXRlIGxpc3QgbWVhbnMgb25saW5lIGxhc3QgY2hlY2tlZFxuICAgICAgICBwZWVycy5wdXNoKHBlZXIpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcGVlcnM7XG4gIH1cbiAgXG4gIGFzeW5jIHNldE91dGdvaW5nUGVlckxpbWl0KGxpbWl0OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc2V0T3V0Z29pbmdQZWVyTGltaXQobGltaXQpO1xuICAgIGlmICghKEdlblV0aWxzLmlzSW50KGxpbWl0KSAmJiBsaW1pdCA+PSAwKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiT3V0Z29pbmcgcGVlciBsaW1pdCBtdXN0IGJlID49IDBcIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJvdXRfcGVlcnNcIiwge291dF9wZWVyczogbGltaXR9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0SW5jb21pbmdQZWVyTGltaXQobGltaXQ6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5zZXRJbmNvbWluZ1BlZXJMaW1pdChsaW1pdCk7XG4gICAgaWYgKCEoR2VuVXRpbHMuaXNJbnQobGltaXQpICYmIGxpbWl0ID49IDApKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJJbmNvbWluZyBwZWVyIGxpbWl0IG11c3QgYmUgPj0gMFwiKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImluX3BlZXJzXCIsIHtpbl9wZWVyczogbGltaXR9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGVlckJhbnMoKTogUHJvbWlzZTxNb25lcm9CYW5bXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRQZWVyQmFucygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2JhbnNcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIGxldCBiYW5zID0gW107XG4gICAgZm9yIChsZXQgcnBjQmFuIG9mIHJlc3AucmVzdWx0LmJhbnMpIHtcbiAgICAgIGxldCBiYW4gPSBuZXcgTW9uZXJvQmFuKCk7XG4gICAgICBiYW4uc2V0SG9zdChycGNCYW4uaG9zdCk7XG4gICAgICBiYW4uc2V0SXAocnBjQmFuLmlwKTtcbiAgICAgIGJhbi5zZXRTZWNvbmRzKHJwY0Jhbi5zZWNvbmRzKTtcbiAgICAgIGJhbnMucHVzaChiYW4pO1xuICAgIH1cbiAgICByZXR1cm4gYmFucztcbiAgfVxuICBcbiAgYXN5bmMgc2V0UGVlckJhbnMoYmFuczogTW9uZXJvQmFuW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc2V0UGVlckJhbnMoYmFucyk7XG4gICAgbGV0IHJwY0JhbnMgPSBbXTtcbiAgICBmb3IgKGxldCBiYW4gb2YgYmFucykgcnBjQmFucy5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0VG9ScGNCYW4oYmFuKSk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzZXRfYmFuc1wiLCB7YmFuczogcnBjQmFuc30pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgc3RhcnRNaW5pbmcoYWRkcmVzczogc3RyaW5nLCBudW1UaHJlYWRzPzogbnVtYmVyLCBpc0JhY2tncm91bmQ/OiBib29sZWFuLCBpZ25vcmVCYXR0ZXJ5PzogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5zdGFydE1pbmluZyhhZGRyZXNzLCBudW1UaHJlYWRzLCBpc0JhY2tncm91bmQsIGlnbm9yZUJhdHRlcnkpO1xuICAgIGFzc2VydChhZGRyZXNzLCBcIk11c3QgcHJvdmlkZSBhZGRyZXNzIHRvIG1pbmUgdG9cIik7XG4gICAgYXNzZXJ0KEdlblV0aWxzLmlzSW50KG51bVRocmVhZHMpICYmIG51bVRocmVhZHMgPiAwLCBcIk51bWJlciBvZiB0aHJlYWRzIG11c3QgYmUgYW4gaW50ZWdlciBncmVhdGVyIHRoYW4gMFwiKTtcbiAgICBhc3NlcnQoaXNCYWNrZ3JvdW5kID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIGlzQmFja2dyb3VuZCA9PT0gXCJib29sZWFuXCIpO1xuICAgIGFzc2VydChpZ25vcmVCYXR0ZXJ5ID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIGlnbm9yZUJhdHRlcnkgPT09IFwiYm9vbGVhblwiKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcInN0YXJ0X21pbmluZ1wiLCB7XG4gICAgICBtaW5lcl9hZGRyZXNzOiBhZGRyZXNzLFxuICAgICAgdGhyZWFkc19jb3VudDogbnVtVGhyZWFkcyxcbiAgICAgIGRvX2JhY2tncm91bmRfbWluaW5nOiBpc0JhY2tncm91bmQsXG4gICAgICBpZ25vcmVfYmF0dGVyeTogaWdub3JlQmF0dGVyeSxcbiAgICB9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgc3RvcE1pbmluZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc3RvcE1pbmluZygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwic3RvcF9taW5pbmdcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE1pbmluZ1N0YXR1cygpOiBQcm9taXNlPE1vbmVyb01pbmluZ1N0YXR1cz4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRNaW5pbmdTdGF0dXMoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcIm1pbmluZ19zdGF0dXNcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjTWluaW5nU3RhdHVzKHJlc3ApO1xuICB9XG4gIFxuICBhc3luYyBzdWJtaXRCbG9ja3MoYmxvY2tCbG9iczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc3VibWl0QmxvY2tzKCk7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkoYmxvY2tCbG9icykgJiYgYmxvY2tCbG9icy5sZW5ndGggPiAwLCBcIk11c3QgcHJvdmlkZSBhbiBhcnJheSBvZiBtaW5lZCBibG9jayBibG9icyB0byBzdWJtaXRcIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdWJtaXRfYmxvY2tcIiwgYmxvY2tCbG9icyk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICB9XG5cbiAgYXN5bmMgcHJ1bmVCbG9ja2NoYWluKGNoZWNrOiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9QcnVuZVJlc3VsdD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5wcnVuZUJsb2NrY2hhaW4oKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInBydW5lX2Jsb2NrY2hhaW5cIiwge2NoZWNrOiBjaGVja30sIDApO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICBsZXQgcmVzdWx0ID0gbmV3IE1vbmVyb1BydW5lUmVzdWx0KCk7XG4gICAgcmVzdWx0LnNldElzUHJ1bmVkKHJlc3AucmVzdWx0LnBydW5lZCk7XG4gICAgcmVzdWx0LnNldFBydW5pbmdTZWVkKHJlc3AucmVzdWx0LnBydW5pbmdfc2VlZCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tGb3JVcGRhdGUoKTogUHJvbWlzZTxNb25lcm9EYWVtb25VcGRhdGVDaGVja1Jlc3VsdD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5jaGVja0ZvclVwZGF0ZSgpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwidXBkYXRlXCIsIHtjb21tYW5kOiBcImNoZWNrXCJ9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNVcGRhdGVDaGVja1Jlc3VsdChyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgZG93bmxvYWRVcGRhdGUocGF0aD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZG93bmxvYWRVcGRhdGUocGF0aCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJ1cGRhdGVcIiwge2NvbW1hbmQ6IFwiZG93bmxvYWRcIiwgcGF0aDogcGF0aH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1VwZGF0ZURvd25sb2FkUmVzdWx0KHJlc3ApO1xuICB9XG4gIFxuICBhc3luYyBzdG9wKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5zdG9wKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJzdG9wX2RhZW1vblwiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgd2FpdEZvck5leHRCbG9ja0hlYWRlcigpOiBQcm9taXNlPE1vbmVyb0Jsb2NrSGVhZGVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLndhaXRGb3JOZXh0QmxvY2tIZWFkZXIoKTtcbiAgICBsZXQgdGhhdCA9IHRoaXM7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jIGZ1bmN0aW9uKHJlc29sdmUpIHtcbiAgICAgIGF3YWl0IHRoYXQuYWRkTGlzdGVuZXIobmV3IGNsYXNzIGV4dGVuZHMgTW9uZXJvRGFlbW9uTGlzdGVuZXIge1xuICAgICAgICBhc3luYyBvbkJsb2NrSGVhZGVyKGhlYWRlcikge1xuICAgICAgICAgIGF3YWl0IHRoYXQucmVtb3ZlTGlzdGVuZXIodGhpcyk7XG4gICAgICAgICAgcmVzb2x2ZShoZWFkZXIpO1xuICAgICAgICB9XG4gICAgICB9KTsgXG4gICAgfSk7XG4gIH1cblxuICBnZXRQb2xsSW50ZXJ2YWwoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5jb25maWcucG9sbEludGVydmFsO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLSBBREQgSlNET0MgRk9SIFNVUFBPUlRFRCBERUZBVUxUIElNUExFTUVOVEFUSU9OUyAtLS0tLS0tLS0tLS0tLVxuICBhc3luYyBnZXRUeCh0eEhhc2g/OiBzdHJpbmcsIHBydW5lID0gZmFsc2UpOiBQcm9taXNlPE1vbmVyb1R4PiB7IHJldHVybiBzdXBlci5nZXRUeCh0eEhhc2gsIHBydW5lKTsgfTtcbiAgYXN5bmMgZ2V0VHhIZXgodHhIYXNoOiBzdHJpbmcsIHBydW5lID0gZmFsc2UpOiBQcm9taXNlPHN0cmluZz4geyByZXR1cm4gc3VwZXIuZ2V0VHhIZXgodHhIYXNoLCBwcnVuZSk7IH07XG4gIGFzeW5jIGdldEtleUltYWdlU3BlbnRTdGF0dXMoa2V5SW1hZ2U6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VTcGVudFN0YXR1cz4geyByZXR1cm4gc3VwZXIuZ2V0S2V5SW1hZ2VTcGVudFN0YXR1cyhrZXlJbWFnZSk7IH1cbiAgYXN5bmMgc2V0UGVlckJhbihiYW46IE1vbmVyb0Jhbik6IFByb21pc2U8dm9pZD4geyByZXR1cm4gc3VwZXIuc2V0UGVlckJhbihiYW4pOyB9XG4gIGFzeW5jIHN1Ym1pdEJsb2NrKGJsb2NrQmxvYjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7IHJldHVybiBzdXBlci5zdWJtaXRCbG9jayhibG9ja0Jsb2IpOyB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFBSSVZBVEUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByb3RlY3RlZCByZWZyZXNoTGlzdGVuaW5nKCkge1xuICAgIGlmICh0aGlzLnBvbGxMaXN0ZW5lciA9PSB1bmRlZmluZWQgJiYgdGhpcy5saXN0ZW5lcnMubGVuZ3RoKSB0aGlzLnBvbGxMaXN0ZW5lciA9IG5ldyBEYWVtb25Qb2xsZXIodGhpcyk7XG4gICAgaWYgKHRoaXMucG9sbExpc3RlbmVyICE9PSB1bmRlZmluZWQpIHRoaXMucG9sbExpc3RlbmVyLnNldElzUG9sbGluZyh0aGlzLmxpc3RlbmVycy5sZW5ndGggPiAwKTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGdldEJhbmR3aWR0aExpbWl0cygpIHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImdldF9saW1pdFwiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICByZXR1cm4gW3Jlc3AubGltaXRfZG93biwgcmVzcC5saW1pdF91cF07XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBzZXRCYW5kd2lkdGhMaW1pdHMoZG93bkxpbWl0LCB1cExpbWl0KSB7XG4gICAgaWYgKGRvd25MaW1pdCA9PT0gdW5kZWZpbmVkKSBkb3duTGltaXQgPSAwO1xuICAgIGlmICh1cExpbWl0ID09PSB1bmRlZmluZWQpIHVwTGltaXQgPSAwO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwic2V0X2xpbWl0XCIsIHtsaW1pdF9kb3duOiBkb3duTGltaXQsIGxpbWl0X3VwOiB1cExpbWl0fSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgcmV0dXJuIFtyZXNwLmxpbWl0X2Rvd24sIHJlc3AubGltaXRfdXBdO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGEgY29udGlndW91cyBjaHVuayBvZiBibG9ja3Mgc3RhcnRpbmcgZnJvbSBhIGdpdmVuIGhlaWdodCB1cCB0byBhIG1heGltdW1cbiAgICogaGVpZ2h0IG9yIGFtb3VudCBvZiBibG9jayBkYXRhIGZldGNoZWQgZnJvbSB0aGUgYmxvY2tjaGFpbiwgd2hpY2hldmVyIGNvbWVzIGZpcnN0LlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtzdGFydEhlaWdodF0gLSBzdGFydCBoZWlnaHQgdG8gcmV0cmlldmUgYmxvY2tzIChkZWZhdWx0IDApXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbbWF4SGVpZ2h0XSAtIG1heGltdW0gZW5kIGhlaWdodCB0byByZXRyaWV2ZSBibG9ja3MgKGRlZmF1bHQgYmxvY2tjaGFpbiBoZWlnaHQpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbbWF4UmVxU2l6ZV0gLSBtYXhpbXVtIGFtb3VudCBvZiBibG9jayBkYXRhIHRvIGZldGNoIGZyb20gdGhlIGJsb2NrY2hhaW4gaW4gYnl0ZXMgKGRlZmF1bHQgMywwMDAsMDAwIGJ5dGVzKVxuICAgKiBAcmV0dXJuIHtNb25lcm9CbG9ja1tdfSBhcmUgdGhlIHJlc3VsdGluZyBjaHVuayBvZiBibG9ja3NcbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyBnZXRNYXhCbG9ja3Moc3RhcnRIZWlnaHQsIG1heEhlaWdodCwgbWF4UmVxU2l6ZSkge1xuICAgIGlmIChzdGFydEhlaWdodCA9PT0gdW5kZWZpbmVkKSBzdGFydEhlaWdodCA9IDA7XG4gICAgaWYgKG1heEhlaWdodCA9PT0gdW5kZWZpbmVkKSBtYXhIZWlnaHQgPSBhd2FpdCB0aGlzLmdldEhlaWdodCgpIC0gMTtcbiAgICBpZiAobWF4UmVxU2l6ZSA9PT0gdW5kZWZpbmVkKSBtYXhSZXFTaXplID0gTW9uZXJvRGFlbW9uUnBjLk1BWF9SRVFfU0laRTtcbiAgICBcbiAgICAvLyBkZXRlcm1pbmUgZW5kIGhlaWdodCB0byBmZXRjaFxuICAgIGxldCByZXFTaXplID0gMDtcbiAgICBsZXQgZW5kSGVpZ2h0ID0gc3RhcnRIZWlnaHQgLSAxO1xuICAgIHdoaWxlIChyZXFTaXplIDwgbWF4UmVxU2l6ZSAmJiBlbmRIZWlnaHQgPCBtYXhIZWlnaHQpIHtcbiAgICAgIFxuICAgICAgLy8gZ2V0IGhlYWRlciBvZiBuZXh0IGJsb2NrXG4gICAgICBsZXQgaGVhZGVyID0gYXdhaXQgdGhpcy5nZXRCbG9ja0hlYWRlckJ5SGVpZ2h0Q2FjaGVkKGVuZEhlaWdodCArIDEsIG1heEhlaWdodCk7XG4gICAgICBcbiAgICAgIC8vIGJsb2NrIGNhbm5vdCBiZSBiaWdnZXIgdGhhbiBtYXggcmVxdWVzdCBzaXplXG4gICAgICBhc3NlcnQoaGVhZGVyLmdldFNpemUoKSA8PSBtYXhSZXFTaXplLCBcIkJsb2NrIGV4Y2VlZHMgbWF4aW11bSByZXF1ZXN0IHNpemU6IFwiICsgaGVhZGVyLmdldFNpemUoKSk7XG4gICAgICBcbiAgICAgIC8vIGRvbmUgaXRlcmF0aW5nIGlmIGZldGNoaW5nIGJsb2NrIHdvdWxkIGV4Y2VlZCBtYXggcmVxdWVzdCBzaXplXG4gICAgICBpZiAocmVxU2l6ZSArIGhlYWRlci5nZXRTaXplKCkgPiBtYXhSZXFTaXplKSBicmVhaztcbiAgICAgIFxuICAgICAgLy8gb3RoZXJ3aXNlIGJsb2NrIGlzIGluY2x1ZGVkXG4gICAgICByZXFTaXplICs9IGhlYWRlci5nZXRTaXplKCk7XG4gICAgICBlbmRIZWlnaHQrKztcbiAgICB9XG4gICAgcmV0dXJuIGVuZEhlaWdodCA+PSBzdGFydEhlaWdodCA/IGF3YWl0IHRoaXMuZ2V0QmxvY2tzQnlSYW5nZShzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSA6IFtdO1xuICB9XG4gIFxuICAvKipcbiAgICogUmV0cmlldmVzIGEgaGVhZGVyIGJ5IGhlaWdodCBmcm9tIHRoZSBjYWNoZSBvciBmZXRjaGVzIGFuZCBjYWNoZXMgYSBoZWFkZXJcbiAgICogcmFuZ2UgaWYgbm90IGFscmVhZHkgaW4gdGhlIGNhY2hlLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodCAtIGhlaWdodCBvZiB0aGUgaGVhZGVyIHRvIHJldHJpZXZlIGZyb20gdGhlIGNhY2hlXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBtYXhIZWlnaHQgLSBtYXhpbXVtIGhlaWdodCBvZiBoZWFkZXJzIHRvIGNhY2hlXG4gICAqL1xuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0QmxvY2tIZWFkZXJCeUhlaWdodENhY2hlZChoZWlnaHQsIG1heEhlaWdodCkge1xuICAgIFxuICAgIC8vIGdldCBoZWFkZXIgZnJvbSBjYWNoZVxuICAgIGxldCBjYWNoZWRIZWFkZXIgPSB0aGlzLmNhY2hlZEhlYWRlcnNbaGVpZ2h0XTtcbiAgICBpZiAoY2FjaGVkSGVhZGVyKSByZXR1cm4gY2FjaGVkSGVhZGVyO1xuICAgIFxuICAgIC8vIGZldGNoIGFuZCBjYWNoZSBoZWFkZXJzIGlmIG5vdCBpbiBjYWNoZVxuICAgIGxldCBlbmRIZWlnaHQgPSBNYXRoLm1pbihtYXhIZWlnaHQsIGhlaWdodCArIE1vbmVyb0RhZW1vblJwYy5OVU1fSEVBREVSU19QRVJfUkVRIC0gMSk7ICAvLyBUT0RPOiBjb3VsZCBzcGVjaWZ5IGVuZCBoZWlnaHQgdG8gY2FjaGUgdG8gb3B0aW1pemUgc21hbGwgcmVxdWVzdHMgKHdvdWxkIGxpa2UgdG8gaGF2ZSB0aW1lIHByb2ZpbGluZyBpbiBwbGFjZSB0aG91Z2gpXG4gICAgbGV0IGhlYWRlcnMgPSBhd2FpdCB0aGlzLmdldEJsb2NrSGVhZGVyc0J5UmFuZ2UoaGVpZ2h0LCBlbmRIZWlnaHQpO1xuICAgIGZvciAobGV0IGhlYWRlciBvZiBoZWFkZXJzKSB7XG4gICAgICB0aGlzLmNhY2hlZEhlYWRlcnNbaGVhZGVyLmdldEhlaWdodCgpXSA9IGhlYWRlcjtcbiAgICB9XG4gICAgXG4gICAgLy8gcmV0dXJuIHRoZSBjYWNoZWQgaGVhZGVyXG4gICAgcmV0dXJuIHRoaXMuY2FjaGVkSGVhZGVyc1toZWlnaHRdO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU1RBVElDIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHN0YXRpYyBhc3luYyBjb25uZWN0VG9EYWVtb25ScGModXJpT3JDb25maWc6IHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4gfCBQYXJ0aWFsPE1vbmVyb0RhZW1vbkNvbmZpZz4gfCBzdHJpbmdbXSwgdXNlcm5hbWU/OiBzdHJpbmcsIHBhc3N3b3JkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9EYWVtb25ScGM+IHtcbiAgICBsZXQgY29uZmlnID0gTW9uZXJvRGFlbW9uUnBjLm5vcm1hbGl6ZUNvbmZpZyh1cmlPckNvbmZpZywgdXNlcm5hbWUsIHBhc3N3b3JkKTtcbiAgICBpZiAoY29uZmlnLmNtZCkgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5zdGFydE1vbmVyb2RQcm9jZXNzKGNvbmZpZyk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9EYWVtb25ScGMoY29uZmlnLCBjb25maWcucHJveHlUb1dvcmtlciA/IGF3YWl0IE1vbmVyb0RhZW1vblJwY1Byb3h5LmNvbm5lY3QoY29uZmlnKSA6IHVuZGVmaW5lZCk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgc3RhcnRNb25lcm9kUHJvY2Vzcyhjb25maWc6IE1vbmVyb0RhZW1vbkNvbmZpZyk6IFByb21pc2U8TW9uZXJvRGFlbW9uUnBjPiB7XG4gICAgYXNzZXJ0KEdlblV0aWxzLmlzQXJyYXkoY29uZmlnLmNtZCksIFwiTXVzdCBwcm92aWRlIHN0cmluZyBhcnJheSB3aXRoIGNvbW1hbmQgbGluZSBwYXJhbWV0ZXJzXCIpO1xuICAgIFxuICAgIC8vIHN0YXJ0IHByb2Nlc3NcbiAgICBsZXQgY2hpbGRQcm9jZXNzID0gcmVxdWlyZSgnY2hpbGRfcHJvY2VzcycpLnNwYXduKGNvbmZpZy5jbWRbMF0sIGNvbmZpZy5jbWQuc2xpY2UoMSksIHtcbiAgICAgIGVudjogeyAuLi5wcm9jZXNzLmVudiwgTEFORzogJ2VuX1VTLlVURi04JyB9IC8vIHNjcmFwZSBvdXRwdXQgaW4gZW5nbGlzaFxuICAgIH0pO1xuICAgIGNoaWxkUHJvY2Vzcy5zdGRvdXQuc2V0RW5jb2RpbmcoJ3V0ZjgnKTtcbiAgICBjaGlsZFByb2Nlc3Muc3RkZXJyLnNldEVuY29kaW5nKCd1dGY4Jyk7XG4gICAgXG4gICAgLy8gcmV0dXJuIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgYWZ0ZXIgc3RhcnRpbmcgbW9uZXJvZFxuICAgIGxldCB1cmk7XG4gICAgbGV0IG91dHB1dCA9IFwiXCI7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBhd2FpdCBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgc3Rkb3V0XG4gICAgICAgIGNoaWxkUHJvY2Vzcy5zdGRvdXQub24oJ2RhdGEnLCBhc3luYyBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgbGV0IGxpbmUgPSBkYXRhLnRvU3RyaW5nKCk7XG4gICAgICAgICAgTGlicmFyeVV0aWxzLmxvZygyLCBsaW5lKTtcbiAgICAgICAgICBvdXRwdXQgKz0gbGluZSArICdcXG4nOyAvLyBjYXB0dXJlIG91dHB1dCBpbiBjYXNlIG9mIGVycm9yXG4gICAgICAgICAgXG4gICAgICAgICAgLy8gZXh0cmFjdCB1cmkgZnJvbSBlLmcuIFwiSSBCaW5kaW5nIG9uIDEyNy4wLjAuMSAoSVB2NCk6MzgwODVcIlxuICAgICAgICAgIGxldCB1cmlMaW5lQ29udGFpbnMgPSBcIkJpbmRpbmcgb24gXCI7XG4gICAgICAgICAgbGV0IHVyaUxpbmVDb250YWluc0lkeCA9IGxpbmUuaW5kZXhPZih1cmlMaW5lQ29udGFpbnMpO1xuICAgICAgICAgIGlmICh1cmlMaW5lQ29udGFpbnNJZHggPj0gMCkge1xuICAgICAgICAgICAgbGV0IGhvc3QgPSBsaW5lLnN1YnN0cmluZyh1cmlMaW5lQ29udGFpbnNJZHggKyB1cmlMaW5lQ29udGFpbnMubGVuZ3RoLCBsaW5lLmxhc3RJbmRleE9mKCcgJykpO1xuICAgICAgICAgICAgbGV0IHVuZm9ybWF0dGVkTGluZSA9IGxpbmUucmVwbGFjZSgvXFx1MDAxYlxcWy4qP20vZywgJycpLnRyaW0oKTsgLy8gcmVtb3ZlIGNvbG9yIGZvcm1hdHRpbmdcbiAgICAgICAgICAgIGxldCBwb3J0ID0gdW5mb3JtYXR0ZWRMaW5lLnN1YnN0cmluZyh1bmZvcm1hdHRlZExpbmUubGFzdEluZGV4T2YoJzonKSArIDEpO1xuICAgICAgICAgICAgbGV0IHNzbElkeCA9IGNvbmZpZy5jbWQuaW5kZXhPZihcIi0tcnBjLXNzbFwiKTtcbiAgICAgICAgICAgIGxldCBzc2xFbmFibGVkID0gc3NsSWR4ID49IDAgPyBcImVuYWJsZWRcIiA9PSBjb25maWcuY21kW3NzbElkeCArIDFdLnRvTG93ZXJDYXNlKCkgOiBmYWxzZTtcbiAgICAgICAgICAgIHVyaSA9IChzc2xFbmFibGVkID8gXCJodHRwc1wiIDogXCJodHRwXCIpICsgXCI6Ly9cIiArIGhvc3QgKyBcIjpcIiArIHBvcnQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIC8vIHJlYWQgc3VjY2VzcyBtZXNzYWdlXG4gICAgICAgICAgaWYgKGxpbmUuaW5kZXhPZihcImNvcmUgUlBDIHNlcnZlciBzdGFydGVkIG9rXCIpID49IDApIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gZ2V0IHVzZXJuYW1lIGFuZCBwYXNzd29yZCBmcm9tIHBhcmFtc1xuICAgICAgICAgICAgbGV0IHVzZXJQYXNzSWR4ID0gY29uZmlnLmNtZC5pbmRleE9mKFwiLS1ycGMtbG9naW5cIik7XG4gICAgICAgICAgICBsZXQgdXNlclBhc3MgPSB1c2VyUGFzc0lkeCA+PSAwID8gY29uZmlnLmNtZFt1c2VyUGFzc0lkeCArIDFdIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgbGV0IHVzZXJuYW1lID0gdXNlclBhc3MgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHVzZXJQYXNzLnN1YnN0cmluZygwLCB1c2VyUGFzcy5pbmRleE9mKCc6JykpO1xuICAgICAgICAgICAgbGV0IHBhc3N3b3JkID0gdXNlclBhc3MgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHVzZXJQYXNzLnN1YnN0cmluZyh1c2VyUGFzcy5pbmRleE9mKCc6JykgKyAxKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gY3JlYXRlIGNsaWVudCBjb25uZWN0ZWQgdG8gaW50ZXJuYWwgcHJvY2Vzc1xuICAgICAgICAgICAgY29uZmlnID0gY29uZmlnLmNvcHkoKS5zZXRTZXJ2ZXIoe3VyaTogdXJpLCB1c2VybmFtZTogdXNlcm5hbWUsIHBhc3N3b3JkOiBwYXNzd29yZCwgcmVqZWN0VW5hdXRob3JpemVkOiBjb25maWcuZ2V0U2VydmVyKCkgPyBjb25maWcuZ2V0U2VydmVyKCkuZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkgOiB1bmRlZmluZWR9KTtcbiAgICAgICAgICAgIGNvbmZpZy5zZXRQcm94eVRvV29ya2VyKGNvbmZpZy5wcm94eVRvV29ya2VyKTtcbiAgICAgICAgICAgIGNvbmZpZy5jbWQgPSB1bmRlZmluZWRcbiAgICAgICAgICAgIGxldCBkYWVtb24gPSBhd2FpdCBNb25lcm9EYWVtb25ScGMuY29ubmVjdFRvRGFlbW9uUnBjKGNvbmZpZyk7XG4gICAgICAgICAgICBkYWVtb24ucHJvY2VzcyA9IGNoaWxkUHJvY2VzcztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gcmVzb2x2ZSBwcm9taXNlIHdpdGggY2xpZW50IGNvbm5lY3RlZCB0byBpbnRlcm5hbCBwcm9jZXNzIFxuICAgICAgICAgICAgdGhpcy5pc1Jlc29sdmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHJlc29sdmUoZGFlbW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gaGFuZGxlIHN0ZGVyclxuICAgICAgICBjaGlsZFByb2Nlc3Muc3RkZXJyLm9uKCdkYXRhJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0TG9nTGV2ZWwoKSA+PSAyKSBjb25zb2xlLmVycm9yKGRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBleGl0XG4gICAgICAgIGNoaWxkUHJvY2Vzcy5vbihcImV4aXRcIiwgZnVuY3Rpb24oY29kZSkge1xuICAgICAgICAgIGlmICghdGhpcy5pc1Jlc29sdmVkKSByZWplY3QobmV3IEVycm9yKFwibW9uZXJvZCBwcm9jZXNzIHRlcm1pbmF0ZWQgd2l0aCBleGl0IGNvZGUgXCIgKyBjb2RlICsgKG91dHB1dCA/IFwiOlxcblxcblwiICsgb3V0cHV0IDogXCJcIikpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgZXJyb3JcbiAgICAgICAgY2hpbGRQcm9jZXNzLm9uKFwiZXJyb3JcIiwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgaWYgKGVyci5tZXNzYWdlLmluZGV4T2YoXCJFTk9FTlRcIikgPj0gMCkgcmVqZWN0KG5ldyBFcnJvcihcIm1vbmVyb2QgZG9lcyBub3QgZXhpc3QgYXQgcGF0aCAnXCIgKyBjb25maWcuY21kWzBdICsgXCInXCIpKTtcbiAgICAgICAgICBpZiAoIXRoaXMuaXNSZXNvbHZlZCkgcmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gaGFuZGxlIHVuY2F1Z2h0IGV4Y2VwdGlvblxuICAgICAgICBjaGlsZFByb2Nlc3Mub24oXCJ1bmNhdWdodEV4Y2VwdGlvblwiLCBmdW5jdGlvbihlcnIsIG9yaWdpbikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJVbmNhdWdodCBleGNlcHRpb24gaW4gbW9uZXJvZCBwcm9jZXNzOiBcIiArIGVyci5tZXNzYWdlKTtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKG9yaWdpbik7XG4gICAgICAgICAgaWYgKCF0aGlzLmlzUmVzb2x2ZWQpIHJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZXJyLm1lc3NhZ2UpO1xuICAgIH1cbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBub3JtYWxpemVDb25maWcodXJpT3JDb25maWc6IHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4gfCBQYXJ0aWFsPE1vbmVyb0RhZW1vbkNvbmZpZz4gfCBzdHJpbmdbXSwgdXNlcm5hbWU/OiBzdHJpbmcsIHBhc3N3b3JkPzogc3RyaW5nKTogTW9uZXJvRGFlbW9uQ29uZmlnIHtcbiAgICBsZXQgY29uZmlnOiB1bmRlZmluZWQgfCBQYXJ0aWFsPE1vbmVyb0RhZW1vbkNvbmZpZz4gPSB1bmRlZmluZWQ7XG4gICAgaWYgKHR5cGVvZiB1cmlPckNvbmZpZyA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgY29uZmlnID0gbmV3IE1vbmVyb0RhZW1vbkNvbmZpZyh7c2VydmVyOiBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih1cmlPckNvbmZpZyBhcyBzdHJpbmcsIHVzZXJuYW1lLCBwYXNzd29yZCl9KTtcbiAgICB9IGVsc2UgaWYgKCh1cmlPckNvbmZpZyBhcyBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+KS51cmkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uZmlnID0gbmV3IE1vbmVyb0RhZW1vbkNvbmZpZyh7c2VydmVyOiBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih1cmlPckNvbmZpZyBhcyBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+KX0pO1xuXG4gICAgICAvLyB0cmFuc2ZlciB3b3JrZXIgcHJveHkgc2V0dGluZyBmcm9tIHJwYyBjb25uZWN0aW9uIHRvIGRhZW1vbiBjb25maWdcbiAgICAgIGNvbmZpZy5zZXRQcm94eVRvV29ya2VyKCh1cmlPckNvbmZpZyBhcyBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+KS5wcm94eVRvV29ya2VyKTtcbiAgICAgIGNvbmZpZy5nZXRTZXJ2ZXIoKS5zZXRQcm94eVRvV29ya2VyKE1vbmVyb1JwY0Nvbm5lY3Rpb24uREVGQVVMVF9DT05GSUcucHJveHlUb1dvcmtlcik7XG4gICAgfSBlbHNlIGlmIChHZW5VdGlscy5pc0FycmF5KHVyaU9yQ29uZmlnKSkge1xuICAgICAgY29uZmlnID0gbmV3IE1vbmVyb0RhZW1vbkNvbmZpZyh7Y21kOiB1cmlPckNvbmZpZyBhcyBzdHJpbmdbXX0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25maWcgPSBuZXcgTW9uZXJvRGFlbW9uQ29uZmlnKHVyaU9yQ29uZmlnIGFzIFBhcnRpYWw8TW9uZXJvRGFlbW9uQ29uZmlnPik7XG4gICAgfVxuICAgIGlmIChjb25maWcucHJveHlUb1dvcmtlciA9PT0gdW5kZWZpbmVkKSBjb25maWcucHJveHlUb1dvcmtlciA9IHRydWU7XG4gICAgaWYgKGNvbmZpZy5wb2xsSW50ZXJ2YWwgPT09IHVuZGVmaW5lZCkgY29uZmlnLnBvbGxJbnRlcnZhbCA9IE1vbmVyb0RhZW1vblJwYy5ERUZBVUxUX1BPTExfUEVSSU9EO1xuICAgIHJldHVybiBjb25maWcgYXMgTW9uZXJvRGFlbW9uQ29uZmlnO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCkge1xuICAgIGlmIChyZXNwLnN0YXR1cyAhPT0gXCJPS1wiKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IocmVzcC5zdGF0dXMpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNCbG9ja0hlYWRlcihycGNIZWFkZXIpIHtcbiAgICBpZiAoIXJwY0hlYWRlcikgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICBsZXQgaGVhZGVyID0gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY0hlYWRlcikpIHtcbiAgICAgIGxldCB2YWwgPSBycGNIZWFkZXJba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYmxvY2tfc2l6ZVwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldFNpemUsIGhlYWRlci5zZXRTaXplLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRlcHRoXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0RGVwdGgsIGhlYWRlci5zZXREZXB0aCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5XCIpIHsgfSAgLy8gaGFuZGxlZCBieSB3aWRlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjdW11bGF0aXZlX2RpZmZpY3VsdHlcIikgeyB9IC8vIGhhbmRsZWQgYnkgd2lkZV9jdW11bGF0aXZlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5X3RvcDY0XCIpIHsgfSAgLy8gaGFuZGxlZCBieSB3aWRlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjdW11bGF0aXZlX2RpZmZpY3VsdHlfdG9wNjRcIikgeyB9IC8vIGhhbmRsZWQgYnkgd2lkZV9jdW11bGF0aXZlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3aWRlX2RpZmZpY3VsdHlcIikgaGVhZGVyLnNldERpZmZpY3VsdHkoR2VuVXRpbHMucmVjb25jaWxlKGhlYWRlci5nZXREaWZmaWN1bHR5KCksIE1vbmVyb0RhZW1vblJwYy5wcmVmaXhlZEhleFRvQkkodmFsKSkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndpZGVfY3VtdWxhdGl2ZV9kaWZmaWN1bHR5XCIpIGhlYWRlci5zZXRDdW11bGF0aXZlRGlmZmljdWx0eShHZW5VdGlscy5yZWNvbmNpbGUoaGVhZGVyLmdldEN1bXVsYXRpdmVEaWZmaWN1bHR5KCksIE1vbmVyb0RhZW1vblJwYy5wcmVmaXhlZEhleFRvQkkodmFsKSkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhhc2hcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRIYXNoLCBoZWFkZXIuc2V0SGFzaCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJoZWlnaHRcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRIZWlnaHQsIGhlYWRlci5zZXRIZWlnaHQsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibWFqb3JfdmVyc2lvblwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldE1ham9yVmVyc2lvbiwgaGVhZGVyLnNldE1ham9yVmVyc2lvbiwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtaW5vcl92ZXJzaW9uXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0TWlub3JWZXJzaW9uLCBoZWFkZXIuc2V0TWlub3JWZXJzaW9uLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm5vbmNlXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0Tm9uY2UsIGhlYWRlci5zZXROb25jZSwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJudW1fdHhlc1wiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldE51bVR4cywgaGVhZGVyLnNldE51bVR4cywgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJvcnBoYW5fc3RhdHVzXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0T3JwaGFuU3RhdHVzLCBoZWFkZXIuc2V0T3JwaGFuU3RhdHVzLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInByZXZfaGFzaFwiIHx8IGtleSA9PT0gXCJwcmV2X2lkXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0UHJldkhhc2gsIGhlYWRlci5zZXRQcmV2SGFzaCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyZXdhcmRcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRSZXdhcmQsIGhlYWRlci5zZXRSZXdhcmQsIEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0aW1lc3RhbXBcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRUaW1lc3RhbXAsIGhlYWRlci5zZXRUaW1lc3RhbXAsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfd2VpZ2h0XCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0V2VpZ2h0LCBoZWFkZXIuc2V0V2VpZ2h0LCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxvbmdfdGVybV93ZWlnaHRcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRMb25nVGVybVdlaWdodCwgaGVhZGVyLnNldExvbmdUZXJtV2VpZ2h0LCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBvd19oYXNoXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0UG93SGFzaCwgaGVhZGVyLnNldFBvd0hhc2gsIHZhbCA9PT0gXCJcIiA/IHVuZGVmaW5lZCA6IHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfaGFzaGVzXCIpIHt9ICAvLyB1c2VkIGluIGJsb2NrIG1vZGVsLCBub3QgaGVhZGVyIG1vZGVsXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibWluZXJfdHhcIikge30gICAvLyB1c2VkIGluIGJsb2NrIG1vZGVsLCBub3QgaGVhZGVyIG1vZGVsXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibWluZXJfdHhfaGFzaFwiKSBoZWFkZXIuc2V0TWluZXJUeEhhc2godmFsKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGJsb2NrIGhlYWRlciBmaWVsZDogJ1wiICsga2V5ICsgXCInOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBoZWFkZXI7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY0Jsb2NrKHJwY0Jsb2NrKSB7XG4gICAgXG4gICAgLy8gYnVpbGQgYmxvY2tcbiAgICBsZXQgYmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNCbG9ja0hlYWRlcihycGNCbG9jay5ibG9ja19oZWFkZXIgPyBycGNCbG9jay5ibG9ja19oZWFkZXIgOiBycGNCbG9jaykgYXMgTW9uZXJvQmxvY2spO1xuICAgIGJsb2NrLnNldEhleChycGNCbG9jay5ibG9iKTtcbiAgICBibG9jay5zZXRUeEhhc2hlcyhycGNCbG9jay50eF9oYXNoZXMgPT09IHVuZGVmaW5lZCA/IFtdIDogcnBjQmxvY2sudHhfaGFzaGVzKTtcbiAgICBcbiAgICAvLyBidWlsZCBtaW5lciB0eFxuICAgIGxldCBycGNNaW5lclR4ID0gcnBjQmxvY2suanNvbiA/IEpTT04ucGFyc2UocnBjQmxvY2suanNvbikubWluZXJfdHggOiBycGNCbG9jay5taW5lcl90eDsgIC8vIG1heSBuZWVkIHRvIGJlIHBhcnNlZCBmcm9tIGpzb25cbiAgICBsZXQgbWluZXJUeCA9IG5ldyBNb25lcm9UeCgpO1xuICAgIGJsb2NrLnNldE1pbmVyVHgobWluZXJUeCk7XG4gICAgbWluZXJUeC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICBtaW5lclR4LnNldEluVHhQb29sKGZhbHNlKVxuICAgIG1pbmVyVHguc2V0SXNNaW5lclR4KHRydWUpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVHgocnBjTWluZXJUeCwgbWluZXJUeCk7XG4gICAgXG4gICAgcmV0dXJuIGJsb2NrO1xuICB9XG4gIFxuICAvKipcbiAgICogVHJhbnNmZXJzIFJQQyB0eCBmaWVsZHMgdG8gYSBnaXZlbiBNb25lcm9UeCB3aXRob3V0IG92ZXJ3cml0aW5nIHByZXZpb3VzIHZhbHVlcy5cbiAgICogXG4gICAqIFRPRE86IHN3aXRjaCBmcm9tIHNhZmUgc2V0XG4gICAqIFxuICAgKiBAcGFyYW0gcnBjVHggLSBSUEMgbWFwIGNvbnRhaW5pbmcgdHJhbnNhY3Rpb24gZmllbGRzXG4gICAqIEBwYXJhbSB0eCAgLSBNb25lcm9UeCB0byBwb3B1bGF0ZSB3aXRoIHZhbHVlcyAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4gdHggLSBzYW1lIHR4IHRoYXQgd2FzIHBhc3NlZCBpbiBvciBhIG5ldyBvbmUgaWYgbm9uZSBnaXZlblxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVHgocnBjVHgsIHR4KSB7XG4gICAgaWYgKHJwY1R4ID09PSB1bmRlZmluZWQpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgaWYgKHR4ID09PSB1bmRlZmluZWQpIHR4ID0gbmV3IE1vbmVyb1R4KCk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSBmcm9tIHJwYyBtYXBcbiAgICBsZXQgaGVhZGVyO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNUeCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNUeFtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJ0eF9oYXNoXCIgfHwga2V5ID09PSBcImlkX2hhc2hcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SGFzaCwgdHguc2V0SGFzaCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja190aW1lc3RhbXBcIikge1xuICAgICAgICBpZiAoIWhlYWRlcikgaGVhZGVyID0gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKCk7XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0VGltZXN0YW1wLCBoZWFkZXIuc2V0VGltZXN0YW1wLCB2YWwpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX2hlaWdodFwiKSB7XG4gICAgICAgIGlmICghaGVhZGVyKSBoZWFkZXIgPSBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoKTtcbiAgICAgICAgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRIZWlnaHQsIGhlYWRlci5zZXRIZWlnaHQsIHZhbCk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibGFzdF9yZWxheWVkX3RpbWVcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAsIHR4LnNldExhc3RSZWxheWVkVGltZXN0YW1wLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJlY2VpdmVfdGltZVwiIHx8IGtleSA9PT0gXCJyZWNlaXZlZF90aW1lc3RhbXBcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0UmVjZWl2ZWRUaW1lc3RhbXAsIHR4LnNldFJlY2VpdmVkVGltZXN0YW1wLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNvbmZpcm1hdGlvbnNcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0TnVtQ29uZmlybWF0aW9ucywgdHguc2V0TnVtQ29uZmlybWF0aW9ucywgdmFsKTsgXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaW5fcG9vbFwiKSB7XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzQ29uZmlybWVkLCB0eC5zZXRJc0NvbmZpcm1lZCwgIXZhbCk7XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldEluVHhQb29sLCB0eC5zZXRJblR4UG9vbCwgdmFsKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkb3VibGVfc3BlbmRfc2VlblwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc0RvdWJsZVNwZW5kU2VlbiwgdHguc2V0SXNEb3VibGVTcGVuZFNlZW4sIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidmVyc2lvblwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRWZXJzaW9uLCB0eC5zZXRWZXJzaW9uLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImV4dHJhXCIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWwgPT09IFwic3RyaW5nXCIpIGNvbnNvbGUubG9nKFwiV0FSTklORzogZXh0cmEgZmllbGQgYXMgc3RyaW5nIG5vdCBiZWluZyBhc2lnbmVkIHRvIGludFtdOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7IC8vIFRPRE86IGhvdyB0byBzZXQgc3RyaW5nIHRvIGludFtdPyAtIG9yLCBleHRyYSBpcyBzdHJpbmcgd2hpY2ggY2FuIGVuY29kZSBpbnRbXVxuICAgICAgICBlbHNlIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldEV4dHJhLCB0eC5zZXRFeHRyYSwgbmV3IFVpbnQ4QXJyYXkodmFsKSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidmluXCIpIHtcbiAgICAgICAgaWYgKHZhbC5sZW5ndGggIT09IDEgfHwgIXZhbFswXS5nZW4pIHsgIC8vIGlnbm9yZSBtaW5lciBpbnB1dCBUT0RPOiB3aHk/XG4gICAgICAgICAgdHguc2V0SW5wdXRzKHZhbC5tYXAocnBjVmluID0+IE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjT3V0cHV0KHJwY1ZpbiwgdHgpKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ2b3V0XCIpIHR4LnNldE91dHB1dHModmFsLm1hcChycGNPdXRwdXQgPT4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNPdXRwdXQocnBjT3V0cHV0LCB0eCkpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyY3Rfc2lnbmF0dXJlc1wiKSB7XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFJjdFNpZ25hdHVyZXMsIHR4LnNldFJjdFNpZ25hdHVyZXMsIHZhbCk7XG4gICAgICAgIGlmICh2YWwudHhuRmVlKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRGZWUsIHR4LnNldEZlZSwgQmlnSW50KHZhbC50eG5GZWUpKTtcbiAgICAgIH0gXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmN0c2lnX3BydW5hYmxlXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFJjdFNpZ1BydW5hYmxlLCB0eC5zZXRSY3RTaWdQcnVuYWJsZSwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bmxvY2tfdGltZVwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRVbmxvY2tUaW1lLCB0eC5zZXRVbmxvY2tUaW1lLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFzX2pzb25cIiB8fCBrZXkgPT09IFwidHhfanNvblwiKSB7IH0gIC8vIGhhbmRsZWQgbGFzdCBzbyB0eCBpcyBhcyBpbml0aWFsaXplZCBhcyBwb3NzaWJsZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFzX2hleFwiIHx8IGtleSA9PT0gXCJ0eF9ibG9iXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldEZ1bGxIZXgsIHR4LnNldEZ1bGxIZXgsIHZhbCA/IHZhbCA6IHVuZGVmaW5lZCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvYl9zaXplXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFNpemUsIHR4LnNldFNpemUsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2VpZ2h0XCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFdlaWdodCwgdHguc2V0V2VpZ2h0LCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImZlZVwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRGZWUsIHR4LnNldEZlZSwgQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJlbGF5ZWRcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SXNSZWxheWVkLCB0eC5zZXRJc1JlbGF5ZWQsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwib3V0cHV0X2luZGljZXNcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0T3V0cHV0SW5kaWNlcywgdHguc2V0T3V0cHV0SW5kaWNlcywgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkb19ub3RfcmVsYXlcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0UmVsYXksIHR4LnNldFJlbGF5LCAhdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJrZXB0X2J5X2Jsb2NrXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzS2VwdEJ5QmxvY2ssIHR4LnNldElzS2VwdEJ5QmxvY2ssIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic2lnbmF0dXJlc1wiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRTaWduYXR1cmVzLCB0eC5zZXRTaWduYXR1cmVzLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxhc3RfZmFpbGVkX2hlaWdodFwiKSB7XG4gICAgICAgIGlmICh2YWwgPT09IDApIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzRmFpbGVkLCB0eC5zZXRJc0ZhaWxlZCwgZmFsc2UpO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc0ZhaWxlZCwgdHguc2V0SXNGYWlsZWQsIHRydWUpO1xuICAgICAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldExhc3RGYWlsZWRIZWlnaHQsIHR4LnNldExhc3RGYWlsZWRIZWlnaHQsIHZhbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsYXN0X2ZhaWxlZF9pZF9oYXNoXCIpIHtcbiAgICAgICAgaWYgKHZhbCA9PT0gTW9uZXJvRGFlbW9uUnBjLkRFRkFVTFRfSUQpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzRmFpbGVkLCB0eC5zZXRJc0ZhaWxlZCwgZmFsc2UpO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc0ZhaWxlZCwgdHguc2V0SXNGYWlsZWQsIHRydWUpO1xuICAgICAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldExhc3RGYWlsZWRIYXNoLCB0eC5zZXRMYXN0RmFpbGVkSGFzaCwgdmFsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm1heF91c2VkX2Jsb2NrX2hlaWdodFwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRNYXhVc2VkQmxvY2tIZWlnaHQsIHR4LnNldE1heFVzZWRCbG9ja0hlaWdodCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtYXhfdXNlZF9ibG9ja19pZF9oYXNoXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldE1heFVzZWRCbG9ja0hhc2gsIHR4LnNldE1heFVzZWRCbG9ja0hhc2gsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHJ1bmFibGVfaGFzaFwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRQcnVuYWJsZUhhc2gsIHR4LnNldFBydW5hYmxlSGFzaCwgdmFsID8gdmFsIDogdW5kZWZpbmVkKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwcnVuYWJsZV9hc19oZXhcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0UHJ1bmFibGVIZXgsIHR4LnNldFBydW5hYmxlSGV4LCB2YWwgPyB2YWwgOiB1bmRlZmluZWQpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBydW5lZF9hc19oZXhcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0UHJ1bmVkSGV4LCB0eC5zZXRQcnVuZWRIZXgsIHZhbCA/IHZhbCA6IHVuZGVmaW5lZCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBycGMgdHg6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgXG4gICAgLy8gbGluayBibG9jayBhbmQgdHhcbiAgICBpZiAoaGVhZGVyKSB0eC5zZXRCbG9jayhuZXcgTW9uZXJvQmxvY2soaGVhZGVyKS5zZXRUeHMoW3R4XSkpO1xuICAgIFxuICAgIC8vIFRPRE8gbW9uZXJvZDogdW5jb25maXJtZWQgdHhzIG1pc3JlcG9ydCBibG9jayBoZWlnaHQgYW5kIHRpbWVzdGFtcD9cbiAgICBpZiAodHguZ2V0QmxvY2soKSAmJiB0eC5nZXRCbG9jaygpLmdldEhlaWdodCgpICE9PSB1bmRlZmluZWQgJiYgdHguZ2V0QmxvY2soKS5nZXRIZWlnaHQoKSA9PT0gdHguZ2V0QmxvY2soKS5nZXRUaW1lc3RhbXAoKSkge1xuICAgICAgdHguc2V0QmxvY2sodW5kZWZpbmVkKTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICB9XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSByZW1haW5pbmcga25vd24gZmllbGRzXG4gICAgaWYgKHR4LmdldElzQ29uZmlybWVkKCkpIHtcbiAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzUmVsYXllZCwgdHguc2V0SXNSZWxheWVkLCB0cnVlKTtcbiAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFJlbGF5LCB0eC5zZXRSZWxheSwgdHJ1ZSk7XG4gICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc0ZhaWxlZCwgdHguc2V0SXNGYWlsZWQsIGZhbHNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdHguc2V0TnVtQ29uZmlybWF0aW9ucygwKTtcbiAgICB9XG4gICAgaWYgKHR4LmdldElzRmFpbGVkKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgIGlmICh0eC5nZXRPdXRwdXRJbmRpY2VzKCkgJiYgdHguZ2V0T3V0cHV0cygpKSAge1xuICAgICAgYXNzZXJ0LmVxdWFsKHR4LmdldE91dHB1dHMoKS5sZW5ndGgsIHR4LmdldE91dHB1dEluZGljZXMoKS5sZW5ndGgpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0eC5nZXRPdXRwdXRzKCkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdHguZ2V0T3V0cHV0cygpW2ldLnNldEluZGV4KHR4LmdldE91dHB1dEluZGljZXMoKVtpXSk7ICAvLyB0cmFuc2ZlciBvdXRwdXQgaW5kaWNlcyB0byBvdXRwdXRzXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChycGNUeC5hc19qc29uKSBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1R4KEpTT04ucGFyc2UocnBjVHguYXNfanNvbiksIHR4KTtcbiAgICBpZiAocnBjVHgudHhfanNvbikgTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNUeChKU09OLnBhcnNlKHJwY1R4LnR4X2pzb24pLCB0eCk7XG4gICAgaWYgKCF0eC5nZXRJc1JlbGF5ZWQoKSkgdHguc2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAodW5kZWZpbmVkKTsgIC8vIFRPRE8gbW9uZXJvZDogcmV0dXJucyBsYXN0X3JlbGF5ZWRfdGltZXN0YW1wIGRlc3BpdGUgcmVsYXllZDogZmFsc2UsIHNlbGYgaW5jb25zaXN0ZW50XG4gICAgXG4gICAgLy8gcmV0dXJuIGJ1aWx0IHRyYW5zYWN0aW9uXG4gICAgcmV0dXJuIHR4O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNPdXRwdXQocnBjT3V0cHV0LCB0eCkge1xuICAgIGxldCBvdXRwdXQgPSBuZXcgTW9uZXJvT3V0cHV0KCk7XG4gICAgb3V0cHV0LnNldFR4KHR4KTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjT3V0cHV0KSkge1xuICAgICAgbGV0IHZhbCA9IHJwY091dHB1dFtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJnZW5cIikgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiT3V0cHV0IHdpdGggJ2dlbicgZnJvbSBkYWVtb24gcnBjIGlzIG1pbmVyIHR4IHdoaWNoIHdlIGlnbm9yZSAoaS5lLiBlYWNoIG1pbmVyIGlucHV0IGlzIHVuZGVmaW5lZClcIik7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwia2V5XCIpIHtcbiAgICAgICAgR2VuVXRpbHMuc2FmZVNldChvdXRwdXQsIG91dHB1dC5nZXRBbW91bnQsIG91dHB1dC5zZXRBbW91bnQsIEJpZ0ludCh2YWwuYW1vdW50KSk7XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQob3V0cHV0LCBvdXRwdXQuZ2V0S2V5SW1hZ2UsIG91dHB1dC5zZXRLZXlJbWFnZSwgbmV3IE1vbmVyb0tleUltYWdlKHZhbC5rX2ltYWdlKSk7XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQob3V0cHV0LCBvdXRwdXQuZ2V0UmluZ091dHB1dEluZGljZXMsIG91dHB1dC5zZXRSaW5nT3V0cHV0SW5kaWNlcywgdmFsLmtleV9vZmZzZXRzKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRcIikgR2VuVXRpbHMuc2FmZVNldChvdXRwdXQsIG91dHB1dC5nZXRBbW91bnQsIG91dHB1dC5zZXRBbW91bnQsIEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0YXJnZXRcIikge1xuICAgICAgICBsZXQgcHViS2V5ID0gdmFsLmtleSA9PT0gdW5kZWZpbmVkID8gdmFsLnRhZ2dlZF9rZXkua2V5IDogdmFsLmtleTsgLy8gVE9ETyAobW9uZXJvZCk6IHJwYyBqc29uIHVzZXMge3RhZ2dlZF9rZXk9e2tleT0uLi59fSwgYmluYXJ5IGJsb2NrcyB1c2Uge2tleT0uLi59XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQob3V0cHV0LCBvdXRwdXQuZ2V0U3RlYWx0aFB1YmxpY0tleSwgb3V0cHV0LnNldFN0ZWFsdGhQdWJsaWNLZXksIHB1YktleSk7XG4gICAgICB9XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBvdXRwdXQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjQmxvY2tUZW1wbGF0ZShycGNUZW1wbGF0ZSkge1xuICAgIGxldCB0ZW1wbGF0ZSA9IG5ldyBNb25lcm9CbG9ja1RlbXBsYXRlKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1RlbXBsYXRlKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1RlbXBsYXRlW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImJsb2NraGFzaGluZ19ibG9iXCIpIHRlbXBsYXRlLnNldEJsb2NrVGVtcGxhdGVCbG9iKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2t0ZW1wbGF0ZV9ibG9iXCIpIHRlbXBsYXRlLnNldEJsb2NrSGFzaGluZ0Jsb2IodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5XCIpIHRlbXBsYXRlLnNldERpZmZpY3VsdHkoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImV4cGVjdGVkX3Jld2FyZFwiKSB0ZW1wbGF0ZS5zZXRFeHBlY3RlZFJld2FyZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRpZmZpY3VsdHlcIikgeyB9ICAvLyBoYW5kbGVkIGJ5IHdpZGVfZGlmZmljdWx0eVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRpZmZpY3VsdHlfdG9wNjRcIikgeyB9ICAvLyBoYW5kbGVkIGJ5IHdpZGVfZGlmZmljdWx0eVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndpZGVfZGlmZmljdWx0eVwiKSB0ZW1wbGF0ZS5zZXREaWZmaWN1bHR5KEdlblV0aWxzLnJlY29uY2lsZSh0ZW1wbGF0ZS5nZXREaWZmaWN1bHR5KCksIE1vbmVyb0RhZW1vblJwYy5wcmVmaXhlZEhleFRvQkkodmFsKSkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhlaWdodFwiKSB0ZW1wbGF0ZS5zZXRIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwcmV2X2hhc2hcIikgdGVtcGxhdGUuc2V0UHJldkhhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyZXNlcnZlZF9vZmZzZXRcIikgdGVtcGxhdGUuc2V0UmVzZXJ2ZWRPZmZzZXQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGF0dXNcIikge30gIC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW50cnVzdGVkXCIpIHt9ICAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNlZWRfaGVpZ2h0XCIpIHRlbXBsYXRlLnNldFNlZWRIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzZWVkX2hhc2hcIikgdGVtcGxhdGUuc2V0U2VlZEhhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJuZXh0X3NlZWRfaGFzaFwiKSB0ZW1wbGF0ZS5zZXROZXh0U2VlZEhhc2godmFsKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIGJsb2NrIHRlbXBsYXRlOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIGlmIChcIlwiID09PSB0ZW1wbGF0ZS5nZXROZXh0U2VlZEhhc2goKSkgdGVtcGxhdGUuc2V0TmV4dFNlZWRIYXNoKHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIHRlbXBsYXRlO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNJbmZvKHJwY0luZm8pIHtcbiAgICBpZiAoIXJwY0luZm8pIHJldHVybiB1bmRlZmluZWQ7XG4gICAgbGV0IGluZm8gPSBuZXcgTW9uZXJvRGFlbW9uSW5mbygpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNJbmZvKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY0luZm9ba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwidmVyc2lvblwiKSBpbmZvLnNldFZlcnNpb24odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbHRfYmxvY2tzX2NvdW50XCIpIGluZm8uc2V0TnVtQWx0QmxvY2tzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfc2l6ZV9saW1pdFwiKSBpbmZvLnNldEJsb2NrU2l6ZUxpbWl0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfc2l6ZV9tZWRpYW5cIikgaW5mby5zZXRCbG9ja1NpemVNZWRpYW4odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja193ZWlnaHRfbGltaXRcIikgaW5mby5zZXRCbG9ja1dlaWdodExpbWl0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfd2VpZ2h0X21lZGlhblwiKSBpbmZvLnNldEJsb2NrV2VpZ2h0TWVkaWFuKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYm9vdHN0cmFwX2RhZW1vbl9hZGRyZXNzXCIpIHsgaWYgKHZhbCkgaW5mby5zZXRCb290c3RyYXBEYWVtb25BZGRyZXNzKHZhbCk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5XCIpIHsgfSAgLy8gaGFuZGxlZCBieSB3aWRlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjdW11bGF0aXZlX2RpZmZpY3VsdHlcIikgeyB9IC8vIGhhbmRsZWQgYnkgd2lkZV9jdW11bGF0aXZlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5X3RvcDY0XCIpIHsgfSAgLy8gaGFuZGxlZCBieSB3aWRlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjdW11bGF0aXZlX2RpZmZpY3VsdHlfdG9wNjRcIikgeyB9IC8vIGhhbmRsZWQgYnkgd2lkZV9jdW11bGF0aXZlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3aWRlX2RpZmZpY3VsdHlcIikgaW5mby5zZXREaWZmaWN1bHR5KEdlblV0aWxzLnJlY29uY2lsZShpbmZvLmdldERpZmZpY3VsdHkoKSwgTW9uZXJvRGFlbW9uUnBjLnByZWZpeGVkSGV4VG9CSSh2YWwpKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2lkZV9jdW11bGF0aXZlX2RpZmZpY3VsdHlcIikgaW5mby5zZXRDdW11bGF0aXZlRGlmZmljdWx0eShHZW5VdGlscy5yZWNvbmNpbGUoaW5mby5nZXRDdW11bGF0aXZlRGlmZmljdWx0eSgpLCBNb25lcm9EYWVtb25ScGMucHJlZml4ZWRIZXhUb0JJKHZhbCkpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmcmVlX3NwYWNlXCIpIGluZm8uc2V0RnJlZVNwYWNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkYXRhYmFzZV9zaXplXCIpIGluZm8uc2V0RGF0YWJhc2VTaXplKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZ3JleV9wZWVybGlzdF9zaXplXCIpIGluZm8uc2V0TnVtT2ZmbGluZVBlZXJzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGVpZ2h0XCIpIGluZm8uc2V0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGVpZ2h0X3dpdGhvdXRfYm9vdHN0cmFwXCIpIGluZm8uc2V0SGVpZ2h0V2l0aG91dEJvb3RzdHJhcCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImluY29taW5nX2Nvbm5lY3Rpb25zX2NvdW50XCIpIGluZm8uc2V0TnVtSW5jb21pbmdDb25uZWN0aW9ucyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm9mZmxpbmVcIikgaW5mby5zZXRJc09mZmxpbmUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJvdXRnb2luZ19jb25uZWN0aW9uc19jb3VudFwiKSBpbmZvLnNldE51bU91dGdvaW5nQ29ubmVjdGlvbnModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJycGNfY29ubmVjdGlvbnNfY291bnRcIikgaW5mby5zZXROdW1ScGNDb25uZWN0aW9ucyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXJ0X3RpbWVcIikgaW5mby5zZXRTdGFydFRpbWVzdGFtcCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFkanVzdGVkX3RpbWVcIikgaW5mby5zZXRBZGp1c3RlZFRpbWVzdGFtcCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXR1c1wiKSB7fSAgLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0YXJnZXRcIikgaW5mby5zZXRUYXJnZXQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0YXJnZXRfaGVpZ2h0XCIpIGluZm8uc2V0VGFyZ2V0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidG9wX2Jsb2NrX2hhc2hcIikgaW5mby5zZXRUb3BCbG9ja0hhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9jb3VudFwiKSBpbmZvLnNldE51bVR4cyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X3Bvb2xfc2l6ZVwiKSBpbmZvLnNldE51bVR4c1Bvb2wodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bnRydXN0ZWRcIikge30gLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3YXNfYm9vdHN0cmFwX2V2ZXJfdXNlZFwiKSBpbmZvLnNldFdhc0Jvb3RzdHJhcEV2ZXJVc2VkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2hpdGVfcGVlcmxpc3Rfc2l6ZVwiKSBpbmZvLnNldE51bU9ubGluZVBlZXJzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidXBkYXRlX2F2YWlsYWJsZVwiKSBpbmZvLnNldFVwZGF0ZUF2YWlsYWJsZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm5ldHR5cGVcIikgR2VuVXRpbHMuc2FmZVNldChpbmZvLCBpbmZvLmdldE5ldHdvcmtUeXBlLCBpbmZvLnNldE5ldHdvcmtUeXBlLCBNb25lcm9OZXR3b3JrVHlwZS5wYXJzZSh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtYWlubmV0XCIpIHsgaWYgKHZhbCkgR2VuVXRpbHMuc2FmZVNldChpbmZvLCBpbmZvLmdldE5ldHdvcmtUeXBlLCBpbmZvLnNldE5ldHdvcmtUeXBlLCBNb25lcm9OZXR3b3JrVHlwZS5NQUlOTkVUKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRlc3RuZXRcIikgeyBpZiAodmFsKSBHZW5VdGlscy5zYWZlU2V0KGluZm8sIGluZm8uZ2V0TmV0d29ya1R5cGUsIGluZm8uc2V0TmV0d29ya1R5cGUsIE1vbmVyb05ldHdvcmtUeXBlLlRFU1RORVQpOyB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3RhZ2VuZXRcIikgeyBpZiAodmFsKSBHZW5VdGlscy5zYWZlU2V0KGluZm8sIGluZm8uZ2V0TmV0d29ya1R5cGUsIGluZm8uc2V0TmV0d29ya1R5cGUsIE1vbmVyb05ldHdvcmtUeXBlLlNUQUdFTkVUKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNyZWRpdHNcIikgaW5mby5zZXRDcmVkaXRzKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0b3BfYmxvY2tfaGFzaFwiIHx8IGtleSA9PT0gXCJ0b3BfaGFzaFwiKSBpbmZvLnNldFRvcEJsb2NrSGFzaChHZW5VdGlscy5yZWNvbmNpbGUoaW5mby5nZXRUb3BCbG9ja0hhc2goKSwgXCJcIiA9PT0gdmFsID8gdW5kZWZpbmVkIDogdmFsKSlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJidXN5X3N5bmNpbmdcIikgaW5mby5zZXRJc0J1c3lTeW5jaW5nKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3luY2hyb25pemVkXCIpIGluZm8uc2V0SXNTeW5jaHJvbml6ZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyZXN0cmljdGVkXCIpIGluZm8uc2V0SXNSZXN0cmljdGVkKHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogSWdub3JpbmcgdW5leHBlY3RlZCBpbmZvIGZpZWxkOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBpbmZvO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgc3luYyBpbmZvIGZyb20gUlBDIHN5bmMgaW5mby5cbiAgICogXG4gICAqIEBwYXJhbSBycGNTeW5jSW5mbyAtIHJwYyBtYXAgdG8gaW5pdGlhbGl6ZSB0aGUgc3luYyBpbmZvIGZyb21cbiAgICogQHJldHVybiB7TW9uZXJvRGFlbW9uU3luY0luZm99IGlzIHN5bmMgaW5mbyBpbml0aWFsaXplZCBmcm9tIHRoZSBtYXBcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1N5bmNJbmZvKHJwY1N5bmNJbmZvKSB7XG4gICAgbGV0IHN5bmNJbmZvID0gbmV3IE1vbmVyb0RhZW1vblN5bmNJbmZvKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1N5bmNJbmZvKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1N5bmNJbmZvW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImhlaWdodFwiKSBzeW5jSW5mby5zZXRIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwZWVyc1wiKSB7XG4gICAgICAgIHN5bmNJbmZvLnNldFBlZXJzKFtdKTtcbiAgICAgICAgbGV0IHJwY0Nvbm5lY3Rpb25zID0gdmFsO1xuICAgICAgICBmb3IgKGxldCBycGNDb25uZWN0aW9uIG9mIHJwY0Nvbm5lY3Rpb25zKSB7XG4gICAgICAgICAgc3luY0luZm8uZ2V0UGVlcnMoKS5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQ29ubmVjdGlvbihycGNDb25uZWN0aW9uLmluZm8pKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNwYW5zXCIpIHtcbiAgICAgICAgc3luY0luZm8uc2V0U3BhbnMoW10pO1xuICAgICAgICBsZXQgcnBjU3BhbnMgPSB2YWw7XG4gICAgICAgIGZvciAobGV0IHJwY1NwYW4gb2YgcnBjU3BhbnMpIHtcbiAgICAgICAgICBzeW5jSW5mby5nZXRTcGFucygpLnB1c2goTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNDb25uZWN0aW9uU3BhbihycGNTcGFuKSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoa2V5ID09PSBcInN0YXR1c1wiKSB7fSAgIC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidGFyZ2V0X2hlaWdodFwiKSBzeW5jSW5mby5zZXRUYXJnZXRIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJuZXh0X25lZWRlZF9wcnVuaW5nX3NlZWRcIikgc3luY0luZm8uc2V0TmV4dE5lZWRlZFBydW5pbmdTZWVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwib3ZlcnZpZXdcIikgeyAgLy8gdGhpcyByZXR1cm5zIFtdIHdpdGhvdXQgcHJ1bmluZ1xuICAgICAgICBsZXQgb3ZlcnZpZXc7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgb3ZlcnZpZXcgPSBKU09OLnBhcnNlKHZhbCk7XG4gICAgICAgICAgaWYgKG92ZXJ2aWV3ICE9PSB1bmRlZmluZWQgJiYgb3ZlcnZpZXcubGVuZ3RoID4gMCkgY29uc29sZS5lcnJvcihcIklnbm9yaW5nIG5vbi1lbXB0eSAnb3ZlcnZpZXcnIGZpZWxkIChub3QgaW1wbGVtZW50ZWQpOiBcIiArIG92ZXJ2aWV3KTsgLy8gVE9ET1xuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIHBhcnNlICdvdmVydmlldycgZmllbGQ6IFwiICsgb3ZlcnZpZXcgKyBcIjogXCIgKyBlLm1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3JlZGl0c1wiKSBzeW5jSW5mby5zZXRDcmVkaXRzKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0b3BfaGFzaFwiKSBzeW5jSW5mby5zZXRUb3BCbG9ja0hhc2goXCJcIiA9PT0gdmFsID8gdW5kZWZpbmVkIDogdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bnRydXN0ZWRcIikge30gIC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBzeW5jIGluZm86IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIHN5bmNJbmZvO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNIYXJkRm9ya0luZm8ocnBjSGFyZEZvcmtJbmZvKSB7XG4gICAgbGV0IGluZm8gPSBuZXcgTW9uZXJvSGFyZEZvcmtJbmZvKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY0hhcmRGb3JrSW5mbykpIHtcbiAgICAgIGxldCB2YWwgPSBycGNIYXJkRm9ya0luZm9ba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiZWFybGllc3RfaGVpZ2h0XCIpIGluZm8uc2V0RWFybGllc3RIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJlbmFibGVkXCIpIGluZm8uc2V0SXNFbmFibGVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3RhdGVcIikgaW5mby5zZXRTdGF0ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXR1c1wiKSB7fSAgICAgLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bnRydXN0ZWRcIikge30gIC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidGhyZXNob2xkXCIpIGluZm8uc2V0VGhyZXNob2xkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidmVyc2lvblwiKSBpbmZvLnNldFZlcnNpb24odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ2b3Rlc1wiKSBpbmZvLnNldE51bVZvdGVzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidm90aW5nXCIpIGluZm8uc2V0Vm90aW5nKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2luZG93XCIpIGluZm8uc2V0V2luZG93KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3JlZGl0c1wiKSBpbmZvLnNldENyZWRpdHMoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRvcF9oYXNoXCIpIGluZm8uc2V0VG9wQmxvY2tIYXNoKFwiXCIgPT09IHZhbCA/IHVuZGVmaW5lZCA6IHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBoYXJkIGZvcmsgaW5mbzogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gaW5mbztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjQ29ubmVjdGlvblNwYW4ocnBjQ29ubmVjdGlvblNwYW4pIHtcbiAgICBsZXQgc3BhbiA9IG5ldyBNb25lcm9Db25uZWN0aW9uU3BhbigpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNDb25uZWN0aW9uU3BhbikpIHtcbiAgICAgIGxldCB2YWwgPSBycGNDb25uZWN0aW9uU3BhbltrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJjb25uZWN0aW9uX2lkXCIpIHNwYW4uc2V0Q29ubmVjdGlvbklkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibmJsb2Nrc1wiKSBzcGFuLnNldE51bUJsb2Nrcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJhdGVcIikgc3Bhbi5zZXRSYXRlKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVtb3RlX2FkZHJlc3NcIikgeyBpZiAodmFsICE9PSBcIlwiKSBzcGFuLnNldFJlbW90ZUFkZHJlc3ModmFsKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNpemVcIikgc3Bhbi5zZXRTaXplKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3BlZWRcIikgc3Bhbi5zZXRTcGVlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXJ0X2Jsb2NrX2hlaWdodFwiKSBzcGFuLnNldFN0YXJ0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBkYWVtb24gY29ubmVjdGlvbiBzcGFuOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBzcGFuO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNPdXRwdXRIaXN0b2dyYW1FbnRyeShycGNFbnRyeSkge1xuICAgIGxldCBlbnRyeSA9IG5ldyBNb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeSgpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNFbnRyeSkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNFbnRyeVtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJhbW91bnRcIikgZW50cnkuc2V0QW1vdW50KEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0b3RhbF9pbnN0YW5jZXNcIikgZW50cnkuc2V0TnVtSW5zdGFuY2VzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5sb2NrZWRfaW5zdGFuY2VzXCIpIGVudHJ5LnNldE51bVVubG9ja2VkSW5zdGFuY2VzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVjZW50X2luc3RhbmNlc1wiKSBlbnRyeS5zZXROdW1SZWNlbnRJbnN0YW5jZXModmFsKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIG91dHB1dCBoaXN0b2dyYW06IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIGVudHJ5O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNTdWJtaXRUeFJlc3VsdChycGNSZXN1bHQpIHtcbiAgICBhc3NlcnQocnBjUmVzdWx0KTtcbiAgICBsZXQgcmVzdWx0ID0gbmV3IE1vbmVyb1N1Ym1pdFR4UmVzdWx0KCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1Jlc3VsdCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNSZXN1bHRba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiZG91YmxlX3NwZW5kXCIpIHJlc3VsdC5zZXRJc0RvdWJsZVNwZW5kU2Vlbih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImZlZV90b29fbG93XCIpIHJlc3VsdC5zZXRJc0ZlZVRvb0xvdyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImludmFsaWRfaW5wdXRcIikgcmVzdWx0LnNldEhhc0ludmFsaWRJbnB1dCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImludmFsaWRfb3V0cHV0XCIpIHJlc3VsdC5zZXRIYXNJbnZhbGlkT3V0cHV0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidG9vX2Zld19vdXRwdXRzXCIpIHJlc3VsdC5zZXRIYXNUb29GZXdPdXRwdXRzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibG93X21peGluXCIpIHJlc3VsdC5zZXRJc01peGluVG9vTG93KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibm90X3JlbGF5ZWRcIikgcmVzdWx0LnNldElzUmVsYXllZCghdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJvdmVyc3BlbmRcIikgcmVzdWx0LnNldElzT3ZlcnNwZW5kKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVhc29uXCIpIHJlc3VsdC5zZXRSZWFzb24odmFsID09PSBcIlwiID8gdW5kZWZpbmVkIDogdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0b29fYmlnXCIpIHJlc3VsdC5zZXRJc1Rvb0JpZyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNhbml0eV9jaGVja19mYWlsZWRcIikgcmVzdWx0LnNldFNhbml0eUNoZWNrRmFpbGVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3JlZGl0c1wiKSByZXN1bHQuc2V0Q3JlZGl0cyhCaWdJbnQodmFsKSlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGF0dXNcIiB8fCBrZXkgPT09IFwidW50cnVzdGVkXCIpIHt9ICAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRvcF9oYXNoXCIpIHJlc3VsdC5zZXRUb3BCbG9ja0hhc2goXCJcIiA9PT0gdmFsID8gdW5kZWZpbmVkIDogdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9leHRyYV90b29fYmlnXCIpIHJlc3VsdC5zZXRJc1R4RXh0cmFUb29CaWcodmFsKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIHN1Ym1pdCB0eCBoZXggcmVzdWx0OiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1R4UG9vbFN0YXRzKHJwY1N0YXRzKSB7XG4gICAgYXNzZXJ0KHJwY1N0YXRzKTtcbiAgICBsZXQgc3RhdHMgPSBuZXcgTW9uZXJvVHhQb29sU3RhdHMoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjU3RhdHMpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjU3RhdHNba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYnl0ZXNfbWF4XCIpIHN0YXRzLnNldEJ5dGVzTWF4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYnl0ZXNfbWVkXCIpIHN0YXRzLnNldEJ5dGVzTWVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYnl0ZXNfbWluXCIpIHN0YXRzLnNldEJ5dGVzTWluKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYnl0ZXNfdG90YWxcIikgc3RhdHMuc2V0Qnl0ZXNUb3RhbCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhpc3RvXzk4cGNcIikgc3RhdHMuc2V0SGlzdG85OHBjKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibnVtXzEwbVwiKSBzdGF0cy5zZXROdW0xMG0odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJudW1fZG91YmxlX3NwZW5kc1wiKSBzdGF0cy5zZXROdW1Eb3VibGVTcGVuZHModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJudW1fZmFpbGluZ1wiKSBzdGF0cy5zZXROdW1GYWlsaW5nKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibnVtX25vdF9yZWxheWVkXCIpIHN0YXRzLnNldE51bU5vdFJlbGF5ZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJvbGRlc3RcIikgc3RhdHMuc2V0T2xkZXN0VGltZXN0YW1wKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhzX3RvdGFsXCIpIHN0YXRzLnNldE51bVR4cyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImZlZV90b3RhbFwiKSBzdGF0cy5zZXRGZWVUb3RhbChCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGlzdG9cIikge1xuICAgICAgICBzdGF0cy5zZXRIaXN0byhuZXcgTWFwKCkpO1xuICAgICAgICBmb3IgKGxldCBlbGVtIG9mIHZhbCkgc3RhdHMuZ2V0SGlzdG8oKS5zZXQoZWxlbS5ieXRlcywgZWxlbS50eHMpO1xuICAgICAgfVxuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gdHggcG9vbCBzdGF0czogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cblxuICAgIC8vIHVuaW5pdGlhbGl6ZSBzb21lIHN0YXRzIGlmIG5vdCBhcHBsaWNhYmxlXG4gICAgaWYgKHN0YXRzLmdldEhpc3RvOThwYygpID09PSAwKSBzdGF0cy5zZXRIaXN0bzk4cGModW5kZWZpbmVkKTtcbiAgICBpZiAoc3RhdHMuZ2V0TnVtVHhzKCkgPT09IDApIHtcbiAgICAgIHN0YXRzLnNldEJ5dGVzTWluKHVuZGVmaW5lZCk7XG4gICAgICBzdGF0cy5zZXRCeXRlc01lZCh1bmRlZmluZWQpO1xuICAgICAgc3RhdHMuc2V0Qnl0ZXNNYXgodW5kZWZpbmVkKTtcbiAgICAgIHN0YXRzLnNldEhpc3RvOThwYyh1bmRlZmluZWQpO1xuICAgICAgc3RhdHMuc2V0T2xkZXN0VGltZXN0YW1wKHVuZGVmaW5lZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0YXRzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNBbHRDaGFpbihycGNDaGFpbikge1xuICAgIGFzc2VydChycGNDaGFpbik7XG4gICAgbGV0IGNoYWluID0gbmV3IE1vbmVyb0FsdENoYWluKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY0NoYWluKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY0NoYWluW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImJsb2NrX2hhc2hcIikge30gIC8vIHVzaW5nIGJsb2NrX2hhc2hlcyBpbnN0ZWFkXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGlmZmljdWx0eVwiKSB7IH0gLy8gaGFuZGxlZCBieSB3aWRlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5X3RvcDY0XCIpIHsgfSAgLy8gaGFuZGxlZCBieSB3aWRlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3aWRlX2RpZmZpY3VsdHlcIikgY2hhaW4uc2V0RGlmZmljdWx0eShHZW5VdGlscy5yZWNvbmNpbGUoY2hhaW4uZ2V0RGlmZmljdWx0eSgpLCBNb25lcm9EYWVtb25ScGMucHJlZml4ZWRIZXhUb0JJKHZhbCkpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJoZWlnaHRcIikgY2hhaW4uc2V0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibGVuZ3RoXCIpIGNoYWluLnNldExlbmd0aCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX2hhc2hlc1wiKSBjaGFpbi5zZXRCbG9ja0hhc2hlcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm1haW5fY2hhaW5fcGFyZW50X2Jsb2NrXCIpIGNoYWluLnNldE1haW5DaGFpblBhcmVudEJsb2NrSGFzaCh2YWwpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gYWx0ZXJuYXRpdmUgY2hhaW46IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIGNoYWluO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNQZWVyKHJwY1BlZXIpIHtcbiAgICBhc3NlcnQocnBjUGVlcik7XG4gICAgbGV0IHBlZXIgPSBuZXcgTW9uZXJvUGVlcigpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNQZWVyKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1BlZXJba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiaG9zdFwiKSBwZWVyLnNldEhvc3QodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJpZFwiKSBwZWVyLnNldElkKFwiXCIgKyB2YWwpOyAgLy8gVE9ETyBtb25lcm8td2FsbGV0LXJwYzogcGVlciBpZCBpcyBCaWdJbnQgYnV0IHN0cmluZyBpbiBgZ2V0X2Nvbm5lY3Rpb25zYFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImlwXCIpIHt9IC8vIGhvc3QgdXNlZCBpbnN0ZWFkIHdoaWNoIGlzIGNvbnNpc3RlbnRseSBhIHN0cmluZ1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxhc3Rfc2VlblwiKSBwZWVyLnNldExhc3RTZWVuVGltZXN0YW1wKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicG9ydFwiKSBwZWVyLnNldFBvcnQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJycGNfcG9ydFwiKSBwZWVyLnNldFJwY1BvcnQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwcnVuaW5nX3NlZWRcIikgcGVlci5zZXRQcnVuaW5nU2VlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJwY19jcmVkaXRzX3Blcl9oYXNoXCIpIHBlZXIuc2V0UnBjQ3JlZGl0c1Blckhhc2goQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gcnBjIHBlZXI6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIHBlZXI7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY0Nvbm5lY3Rpb24ocnBjQ29ubmVjdGlvbikge1xuICAgIGxldCBwZWVyID0gbmV3IE1vbmVyb1BlZXIoKTtcbiAgICBwZWVyLnNldElzT25saW5lKHRydWUpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNDb25uZWN0aW9uKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY0Nvbm5lY3Rpb25ba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYWRkcmVzc1wiKSBwZWVyLnNldEFkZHJlc3ModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhdmdfZG93bmxvYWRcIikgcGVlci5zZXRBdmdEb3dubG9hZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImF2Z191cGxvYWRcIikgcGVlci5zZXRBdmdVcGxvYWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjb25uZWN0aW9uX2lkXCIpIHBlZXIuc2V0SWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjdXJyZW50X2Rvd25sb2FkXCIpIHBlZXIuc2V0Q3VycmVudERvd25sb2FkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3VycmVudF91cGxvYWRcIikgcGVlci5zZXRDdXJyZW50VXBsb2FkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGVpZ2h0XCIpIHBlZXIuc2V0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaG9zdFwiKSBwZWVyLnNldEhvc3QodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJpcFwiKSB7fSAvLyBob3N0IHVzZWQgaW5zdGVhZCB3aGljaCBpcyBjb25zaXN0ZW50bHkgYSBzdHJpbmdcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJpbmNvbWluZ1wiKSBwZWVyLnNldElzSW5jb21pbmcodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsaXZlX3RpbWVcIikgcGVlci5zZXRMaXZlVGltZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxvY2FsX2lwXCIpIHBlZXIuc2V0SXNMb2NhbElwKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibG9jYWxob3N0XCIpIHBlZXIuc2V0SXNMb2NhbEhvc3QodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwZWVyX2lkXCIpIHBlZXIuc2V0SWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwb3J0XCIpIHBlZXIuc2V0UG9ydChwYXJzZUludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJycGNfcG9ydFwiKSBwZWVyLnNldFJwY1BvcnQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyZWN2X2NvdW50XCIpIHBlZXIuc2V0TnVtUmVjZWl2ZXModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyZWN2X2lkbGVfdGltZVwiKSBwZWVyLnNldFJlY2VpdmVJZGxlVGltZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNlbmRfY291bnRcIikgcGVlci5zZXROdW1TZW5kcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNlbmRfaWRsZV90aW1lXCIpIHBlZXIuc2V0U2VuZElkbGVUaW1lKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3RhdGVcIikgcGVlci5zZXRTdGF0ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN1cHBvcnRfZmxhZ3NcIikgcGVlci5zZXROdW1TdXBwb3J0RmxhZ3ModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwcnVuaW5nX3NlZWRcIikgcGVlci5zZXRQcnVuaW5nU2VlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJwY19jcmVkaXRzX3Blcl9oYXNoXCIpIHBlZXIuc2V0UnBjQ3JlZGl0c1Blckhhc2goQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFkZHJlc3NfdHlwZVwiKSBwZWVyLnNldFR5cGUodmFsKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIHBlZXI6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIHBlZXI7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFRvUnBjQmFuKGJhbjogTW9uZXJvQmFuKSB7XG4gICAgbGV0IHJwY0JhbjogYW55ID0ge307XG4gICAgcnBjQmFuLmhvc3QgPSBiYW4uZ2V0SG9zdCgpO1xuICAgIHJwY0Jhbi5pcCA9IGJhbi5nZXRJcCgpO1xuICAgIHJwY0Jhbi5iYW4gPSBiYW4uZ2V0SXNCYW5uZWQoKTtcbiAgICBycGNCYW4uc2Vjb25kcyA9IGJhbi5nZXRTZWNvbmRzKCk7XG4gICAgcmV0dXJuIHJwY0JhbjtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjTWluaW5nU3RhdHVzKHJwY1N0YXR1cykge1xuICAgIGxldCBzdGF0dXMgPSBuZXcgTW9uZXJvTWluaW5nU3RhdHVzKCk7XG4gICAgc3RhdHVzLnNldElzQWN0aXZlKHJwY1N0YXR1cy5hY3RpdmUpO1xuICAgIHN0YXR1cy5zZXRTcGVlZChycGNTdGF0dXMuc3BlZWQpO1xuICAgIHN0YXR1cy5zZXROdW1UaHJlYWRzKHJwY1N0YXR1cy50aHJlYWRzX2NvdW50KTtcbiAgICBpZiAocnBjU3RhdHVzLmFjdGl2ZSkge1xuICAgICAgc3RhdHVzLnNldEFkZHJlc3MocnBjU3RhdHVzLmFkZHJlc3MpO1xuICAgICAgc3RhdHVzLnNldElzQmFja2dyb3VuZChycGNTdGF0dXMuaXNfYmFja2dyb3VuZF9taW5pbmdfZW5hYmxlZCk7XG4gICAgfVxuICAgIHJldHVybiBzdGF0dXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1VwZGF0ZUNoZWNrUmVzdWx0KHJwY1Jlc3VsdCkge1xuICAgIGFzc2VydChycGNSZXN1bHQpO1xuICAgIGxldCByZXN1bHQgPSBuZXcgTW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjUmVzdWx0KSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1Jlc3VsdFtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJhdXRvX3VyaVwiKSByZXN1bHQuc2V0QXV0b1VyaSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhhc2hcIikgcmVzdWx0LnNldEhhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwYXRoXCIpIHt9IC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3RhdHVzXCIpIHt9IC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidXBkYXRlXCIpIHJlc3VsdC5zZXRJc1VwZGF0ZUF2YWlsYWJsZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVzZXJfdXJpXCIpIHJlc3VsdC5zZXRVc2VyVXJpKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidmVyc2lvblwiKSByZXN1bHQuc2V0VmVyc2lvbih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVudHJ1c3RlZFwiKSB7fSAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gcnBjIGNoZWNrIHVwZGF0ZSByZXN1bHQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgaWYgKHJlc3VsdC5nZXRBdXRvVXJpKCkgPT09IFwiXCIpIHJlc3VsdC5zZXRBdXRvVXJpKHVuZGVmaW5lZCk7XG4gICAgaWYgKHJlc3VsdC5nZXRVc2VyVXJpKCkgPT09IFwiXCIpIHJlc3VsdC5zZXRVc2VyVXJpKHVuZGVmaW5lZCk7XG4gICAgaWYgKHJlc3VsdC5nZXRWZXJzaW9uKCkgPT09IFwiXCIpIHJlc3VsdC5zZXRWZXJzaW9uKHVuZGVmaW5lZCk7XG4gICAgaWYgKHJlc3VsdC5nZXRIYXNoKCkgPT09IFwiXCIpIHJlc3VsdC5zZXRIYXNoKHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVXBkYXRlRG93bmxvYWRSZXN1bHQocnBjUmVzdWx0KSB7XG4gICAgbGV0IHJlc3VsdCA9IG5ldyBNb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdChNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1VwZGF0ZUNoZWNrUmVzdWx0KHJwY1Jlc3VsdCkgYXMgTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQpO1xuICAgIHJlc3VsdC5zZXREb3dubG9hZFBhdGgocnBjUmVzdWx0W1wicGF0aFwiXSk7XG4gICAgaWYgKHJlc3VsdC5nZXREb3dubG9hZFBhdGgoKSA9PT0gXCJcIikgcmVzdWx0LnNldERvd25sb2FkUGF0aCh1bmRlZmluZWQpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgYSAnMHgnIHByZWZpeGVkIGhleGlkZWNpbWFsIHN0cmluZyB0byBhIGJpZ2ludC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBoZXggaXMgdGhlICcweCcgcHJlZml4ZWQgaGV4aWRlY2ltYWwgc3RyaW5nIHRvIGNvbnZlcnRcbiAgICogQHJldHVybiB7YmlnaW50fSB0aGUgaGV4aWNlZGltYWwgY29udmVydGVkIHRvIGRlY2ltYWxcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgcHJlZml4ZWRIZXhUb0JJKGhleCkge1xuICAgIGFzc2VydChoZXguc3Vic3RyaW5nKDAsIDIpID09PSBcIjB4XCIpO1xuICAgIHJldHVybiBCaWdJbnQoaGV4KTtcbiAgfVxufVxuXG4vKipcbiAqIEltcGxlbWVudHMgYSBNb25lcm9EYWVtb24gYnkgcHJveHlpbmcgcmVxdWVzdHMgdG8gYSB3b3JrZXIuXG4gKiBcbiAqIEBwcml2YXRlXG4gKi9cbmNsYXNzIE1vbmVyb0RhZW1vblJwY1Byb3h5IHtcblxuICAvLyBzdGF0ZSB2YXJpYWJsZXNcbiAgcHJpdmF0ZSBkYWVtb25JZDogYW55O1xuICBwcml2YXRlIHdvcmtlcjogYW55O1xuICBwcml2YXRlIHdyYXBwZWRMaXN0ZW5lcnM6IGFueTtcbiAgcHJpdmF0ZSBwcm9jZXNzOiBhbnk7XG5cbiAgY29uc3RydWN0b3IoZGFlbW9uSWQsIHdvcmtlcikge1xuICAgIHRoaXMuZGFlbW9uSWQgPSBkYWVtb25JZDtcbiAgICB0aGlzLndvcmtlciA9IHdvcmtlcjtcbiAgICB0aGlzLndyYXBwZWRMaXN0ZW5lcnMgPSBbXTtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFNUQVRJQyBVVElMSVRJRVMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIHN0YXRpYyBhc3luYyBjb25uZWN0KGNvbmZpZykge1xuICAgIGxldCBkYWVtb25JZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICBjb25maWcgPSBPYmplY3QuYXNzaWduKHt9LCBjb25maWcsIHtwcm94eVRvV29ya2VyOiBmYWxzZX0pO1xuICAgIGF3YWl0IExpYnJhcnlVdGlscy5pbnZva2VXb3JrZXIoZGFlbW9uSWQsIFwiY29ubmVjdERhZW1vblJwY1wiLCBbY29uZmlnXSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9EYWVtb25ScGNQcm94eShkYWVtb25JZCwgYXdhaXQgTGlicmFyeVV0aWxzLmdldFdvcmtlcigpKTtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBJTlNUQU5DRSBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIGFzeW5jIGFkZExpc3RlbmVyKGxpc3RlbmVyKSB7XG4gICAgbGV0IHdyYXBwZWRMaXN0ZW5lciA9IG5ldyBEYWVtb25Xb3JrZXJMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgbGV0IGxpc3RlbmVySWQgPSB3cmFwcGVkTGlzdGVuZXIuZ2V0SWQoKTtcbiAgICBMaWJyYXJ5VXRpbHMuYWRkV29ya2VyQ2FsbGJhY2sodGhpcy5kYWVtb25JZCwgXCJvbkJsb2NrSGVhZGVyX1wiICsgbGlzdGVuZXJJZCwgW3dyYXBwZWRMaXN0ZW5lci5vbkJsb2NrSGVhZGVyLCB3cmFwcGVkTGlzdGVuZXJdKTtcbiAgICB0aGlzLndyYXBwZWRMaXN0ZW5lcnMucHVzaCh3cmFwcGVkTGlzdGVuZXIpO1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkFkZExpc3RlbmVyXCIsIFtsaXN0ZW5lcklkXSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndyYXBwZWRMaXN0ZW5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLndyYXBwZWRMaXN0ZW5lcnNbaV0uZ2V0TGlzdGVuZXIoKSA9PT0gbGlzdGVuZXIpIHtcbiAgICAgICAgbGV0IGxpc3RlbmVySWQgPSB0aGlzLndyYXBwZWRMaXN0ZW5lcnNbaV0uZ2V0SWQoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25SZW1vdmVMaXN0ZW5lclwiLCBbbGlzdGVuZXJJZF0pO1xuICAgICAgICBMaWJyYXJ5VXRpbHMucmVtb3ZlV29ya2VyQ2FsbGJhY2sodGhpcy5kYWVtb25JZCwgXCJvbkJsb2NrSGVhZGVyX1wiICsgbGlzdGVuZXJJZCk7XG4gICAgICAgIHRoaXMud3JhcHBlZExpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTGlzdGVuZXIgaXMgbm90IHJlZ2lzdGVyZWQgd2l0aCBkYWVtb25cIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldExpc3RlbmVycygpIHtcbiAgICBsZXQgbGlzdGVuZXJzID0gW107XG4gICAgZm9yIChsZXQgd3JhcHBlZExpc3RlbmVyIG9mIHRoaXMud3JhcHBlZExpc3RlbmVycykgbGlzdGVuZXJzLnB1c2god3JhcHBlZExpc3RlbmVyLmdldExpc3RlbmVyKCkpO1xuICAgIHJldHVybiBsaXN0ZW5lcnM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFJwY0Nvbm5lY3Rpb24oKSB7XG4gICAgbGV0IGNvbmZpZyA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0UnBjQ29ubmVjdGlvblwiKTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24oY29uZmlnIGFzIFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4pO1xuICB9XG4gIFxuICBhc3luYyBpc0Nvbm5lY3RlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25Jc0Nvbm5lY3RlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VmVyc2lvbigpIHtcbiAgICBsZXQgdmVyc2lvbkpzb246IGFueSA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0VmVyc2lvblwiKTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1ZlcnNpb24odmVyc2lvbkpzb24ubnVtYmVyLCB2ZXJzaW9uSnNvbi5pc1JlbGVhc2UpO1xuICB9XG4gIFxuICBhc3luYyBpc1RydXN0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uSXNUcnVzdGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRIZWlnaHQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0SGVpZ2h0XCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0hhc2goaGVpZ2h0KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tIYXNoXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrVGVtcGxhdGUod2FsbGV0QWRkcmVzcywgcmVzZXJ2ZVNpemUpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0Jsb2NrVGVtcGxhdGUoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja1RlbXBsYXRlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBnZXRMYXN0QmxvY2tIZWFkZXIoKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9CbG9ja0hlYWRlcihhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldExhc3RCbG9ja0hlYWRlclwiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrSGVhZGVyQnlIYXNoKGJsb2NrSGFzaCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja0hlYWRlckJ5SGFzaFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tIZWFkZXJCeUhlaWdodChoZWlnaHQpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tIZWFkZXJCeUhlaWdodFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tIZWFkZXJzQnlSYW5nZShzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSB7XG4gICAgbGV0IGJsb2NrSGVhZGVyc0pzb246IGFueVtdID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja0hlYWRlcnNCeVJhbmdlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkgYXMgYW55W107XG4gICAgbGV0IGhlYWRlcnMgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0hlYWRlckpzb24gb2YgYmxvY2tIZWFkZXJzSnNvbikgaGVhZGVycy5wdXNoKG5ldyBNb25lcm9CbG9ja0hlYWRlcihibG9ja0hlYWRlckpzb24pKTtcbiAgICByZXR1cm4gaGVhZGVycztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tCeUhhc2goYmxvY2tIYXNoKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9CbG9jayhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2NrQnlIYXNoXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSksIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFgpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja3NCeUhhc2goYmxvY2tIYXNoZXMsIHN0YXJ0SGVpZ2h0LCBwcnVuZSkge1xuICAgIGxldCBibG9ja3NKc29uOiBhbnlbXSA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tzQnlIYXNoXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkgYXMgYW55W107XG4gICAgbGV0IGJsb2NrcyA9IFtdO1xuICAgIGZvciAobGV0IGJsb2NrSnNvbiBvZiBibG9ja3NKc29uKSBibG9ja3MucHVzaChuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uKSk7XG4gICAgcmV0dXJuIGJsb2NrcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tCeUhlaWdodChoZWlnaHQpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0Jsb2NrKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tCeUhlaWdodFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpLCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tzQnlIZWlnaHQoaGVpZ2h0cykge1xuICAgIGxldCBibG9ja3NKc29uOiBhbnlbXT0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja3NCeUhlaWdodFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpIGFzIGFueVtdO1xuICAgIGxldCBibG9ja3MgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0pzb24gb2YgYmxvY2tzSnNvbikgYmxvY2tzLnB1c2gobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWCkpO1xuICAgIHJldHVybiBibG9ja3M7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2Nrc0J5UmFuZ2Uoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCkge1xuICAgIGxldCBibG9ja3NKc29uOiBhbnlbXSA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tzQnlSYW5nZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpIGFzIGFueVtdO1xuICAgIGxldCBibG9ja3MgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0pzb24gb2YgYmxvY2tzSnNvbikgYmxvY2tzLnB1c2gobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWCkpO1xuICAgIHJldHVybiBibG9ja3M7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2Nrc0J5UmFuZ2VDaHVua2VkKHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIG1heENodW5rU2l6ZSkge1xuICAgIGxldCBibG9ja3NKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja3NCeVJhbmdlQ2h1bmtlZFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpIGFzIGFueVtdO1xuICAgIGxldCBibG9ja3MgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0pzb24gb2YgYmxvY2tzSnNvbikgYmxvY2tzLnB1c2gobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWCkpO1xuICAgIHJldHVybiBibG9ja3M7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrSGFzaGVzKGJsb2NrSGFzaGVzLCBzdGFydEhlaWdodCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2NrSGFzaGVzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4cyh0eEhhc2hlcywgcHJ1bmUgPSBmYWxzZSkge1xuICAgIFxuICAgIC8vIGRlc2VyaWFsaXplIHR4cyBmcm9tIGJsb2Nrc1xuICAgIGxldCBibG9ja3MgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0pzb24gb2YgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRUeHNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSBhcyBhbnlbXSkge1xuICAgICAgYmxvY2tzLnB1c2gobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWCkpO1xuICAgIH1cbiAgICBcbiAgICAvLyBjb2xsZWN0IHR4c1xuICAgIGxldCB0eHMgPSBbXTtcbiAgICBmb3IgKGxldCBibG9jayBvZiBibG9ja3MpIHtcbiAgICAgIGZvciAobGV0IHR4IG9mIGJsb2NrLmdldFR4cygpKSB7XG4gICAgICAgIGlmICghdHguZ2V0SXNDb25maXJtZWQoKSkgdHguc2V0QmxvY2sodW5kZWZpbmVkKTtcbiAgICAgICAgdHhzLnB1c2godHgpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHhzO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeEhleGVzKHR4SGFzaGVzLCBwcnVuZSA9IGZhbHNlKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0VHhIZXhlc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRNaW5lclR4U3VtKGhlaWdodCwgbnVtQmxvY2tzKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9NaW5lclR4U3VtKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0TWluZXJUeFN1bVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RmVlRXN0aW1hdGUoZ3JhY2VCbG9ja3M/KSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9GZWVFc3RpbWF0ZShhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEZlZUVzdGltYXRlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBzdWJtaXRUeEhleCh0eEhleCwgZG9Ob3RSZWxheSkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvU3VibWl0VHhSZXN1bHQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TdWJtaXRUeEhleFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVsYXlUeHNCeUhhc2godHhIYXNoZXMpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25SZWxheVR4c0J5SGFzaFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFBvb2woKSB7XG4gICAgbGV0IGJsb2NrSnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0VHhQb29sXCIpO1xuICAgIGxldCB0eHMgPSBuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uLCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYKS5nZXRUeHMoKTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHR4LnNldEJsb2NrKHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIHR4cyA/IHR4cyA6IFtdO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFBvb2xIYXNoZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0VHhQb29sSGFzaGVzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4UG9vbEJhY2tsb2coKSB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFBvb2xTdGF0cygpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1R4UG9vbFN0YXRzKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0VHhQb29sU3RhdHNcIikpO1xuICB9XG4gIFxuICBhc3luYyBmbHVzaFR4UG9vbChoYXNoZXMpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25GbHVzaFR4UG9vbFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRLZXlJbWFnZVNwZW50U3RhdHVzZXMoa2V5SW1hZ2VzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dHMob3V0cHV0cyk6IFByb21pc2U8TW9uZXJvT3V0cHV0W10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dEhpc3RvZ3JhbShhbW91bnRzLCBtaW5Db3VudCwgbWF4Q291bnQsIGlzVW5sb2NrZWQsIHJlY2VudEN1dG9mZikge1xuICAgIGxldCBlbnRyaWVzID0gW107XG4gICAgZm9yIChsZXQgZW50cnlKc29uIG9mIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0T3V0cHV0SGlzdG9ncmFtXCIsIFthbW91bnRzLCBtaW5Db3VudCwgbWF4Q291bnQsIGlzVW5sb2NrZWQsIHJlY2VudEN1dG9mZl0pIGFzIGFueVtdKSB7XG4gICAgICBlbnRyaWVzLnB1c2gobmV3IE1vbmVyb091dHB1dEhpc3RvZ3JhbUVudHJ5KGVudHJ5SnNvbikpO1xuICAgIH1cbiAgICByZXR1cm4gZW50cmllcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0T3V0cHV0RGlzdHJpYnV0aW9uKGFtb3VudHMsIGN1bXVsYXRpdmUsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpIHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEluZm8oKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9EYWVtb25JbmZvKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0SW5mb1wiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFN5bmNJbmZvKCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvRGFlbW9uU3luY0luZm8oYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRTeW5jSW5mb1wiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhhcmRGb3JrSW5mbygpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0hhcmRGb3JrSW5mbyhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEhhcmRGb3JrSW5mb1wiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFsdENoYWlucygpIHtcbiAgICBsZXQgYWx0Q2hhaW5zID0gW107XG4gICAgZm9yIChsZXQgYWx0Q2hhaW5Kc29uIG9mIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QWx0Q2hhaW5zXCIpIGFzIGFueSkgYWx0Q2hhaW5zLnB1c2gobmV3IE1vbmVyb0FsdENoYWluKGFsdENoYWluSnNvbikpO1xuICAgIHJldHVybiBhbHRDaGFpbnM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFsdEJsb2NrSGFzaGVzKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEFsdEJsb2NrSGFzaGVzXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXREb3dubG9hZExpbWl0KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldERvd25sb2FkTGltaXRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIHNldERvd25sb2FkTGltaXQobGltaXQpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TZXREb3dubG9hZExpbWl0XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2V0RG93bmxvYWRMaW1pdCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25SZXNldERvd25sb2FkTGltaXRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFVwbG9hZExpbWl0KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFVwbG9hZExpbWl0XCIpO1xuICB9XG4gIFxuICBhc3luYyBzZXRVcGxvYWRMaW1pdChsaW1pdCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblNldFVwbG9hZExpbWl0XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2V0VXBsb2FkTGltaXQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uUmVzZXRVcGxvYWRMaW1pdFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGVlcnMoKSB7XG4gICAgbGV0IHBlZXJzID0gW107XG4gICAgZm9yIChsZXQgcGVlckpzb24gb2YgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRQZWVyc1wiKSBhcyBhbnkpIHBlZXJzLnB1c2gobmV3IE1vbmVyb1BlZXIocGVlckpzb24pKTtcbiAgICByZXR1cm4gcGVlcnM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEtub3duUGVlcnMoKSB7XG4gICAgbGV0IHBlZXJzID0gW107XG4gICAgZm9yIChsZXQgcGVlckpzb24gb2YgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRLbm93blBlZXJzXCIpIGFzIGFueSkgcGVlcnMucHVzaChuZXcgTW9uZXJvUGVlcihwZWVySnNvbikpO1xuICAgIHJldHVybiBwZWVycztcbiAgfVxuICBcbiAgYXN5bmMgc2V0T3V0Z29pbmdQZWVyTGltaXQobGltaXQpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TZXRJbmNvbWluZ1BlZXJMaW1pdFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBzZXRJbmNvbWluZ1BlZXJMaW1pdChsaW1pdCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblNldEluY29taW5nUGVlckxpbWl0XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBlZXJCYW5zKCkge1xuICAgIGxldCBiYW5zID0gW107XG4gICAgZm9yIChsZXQgYmFuSnNvbiBvZiBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFBlZXJCYW5zXCIpIGFzIGFueSkgYmFucy5wdXNoKG5ldyBNb25lcm9CYW4oYmFuSnNvbikpO1xuICAgIHJldHVybiBiYW5zO1xuICB9XG5cbiAgYXN5bmMgc2V0UGVlckJhbnMoYmFucykge1xuICAgIGxldCBiYW5zSnNvbiA9IFtdO1xuICAgIGZvciAobGV0IGJhbiBvZiBiYW5zKSBiYW5zSnNvbi5wdXNoKGJhbi50b0pzb24oKSk7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uU2V0UGVlckJhbnNcIiwgW2JhbnNKc29uXSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0YXJ0TWluaW5nKGFkZHJlc3MsIG51bVRocmVhZHMsIGlzQmFja2dyb3VuZCwgaWdub3JlQmF0dGVyeSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblN0YXJ0TWluaW5nXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0b3BNaW5pbmcoKSB7XG4gICAgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TdG9wTWluaW5nXCIpXG4gIH1cbiAgXG4gIGFzeW5jIGdldE1pbmluZ1N0YXR1cygpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb01pbmluZ1N0YXR1cyhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldE1pbmluZ1N0YXR1c1wiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdEJsb2NrcyhibG9ja0Jsb2JzKSB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICB9XG5cbiAgYXN5bmMgcHJ1bmVCbG9ja2NoYWluKGNoZWNrKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9QcnVuZVJlc3VsdChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblBydW5lQmxvY2tjaGFpblwiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrRm9yVXBkYXRlKCk6IFByb21pc2U8TW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGRvd25sb2FkVXBkYXRlKHBhdGgpOiBQcm9taXNlPE1vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBzdG9wKCkge1xuICAgIHdoaWxlICh0aGlzLndyYXBwZWRMaXN0ZW5lcnMubGVuZ3RoKSBhd2FpdCB0aGlzLnJlbW92ZUxpc3RlbmVyKHRoaXMud3JhcHBlZExpc3RlbmVyc1swXS5nZXRMaXN0ZW5lcigpKTtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TdG9wXCIpO1xuICB9XG4gIFxuICBhc3luYyB3YWl0Rm9yTmV4dEJsb2NrSGVhZGVyKCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25XYWl0Rm9yTmV4dEJsb2NrSGVhZGVyXCIpKTtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFBSSVZBVEUgSEVMUEVSUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIC8vIFRPRE86IGR1cGxpY2F0ZWQgd2l0aCBNb25lcm9XYWxsZXRGdWxsUHJveHlcbiAgcHJvdGVjdGVkIGFzeW5jIGludm9rZVdvcmtlcihmbk5hbWU6IHN0cmluZywgYXJncz86IGFueSkge1xuICAgIHJldHVybiBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKHRoaXMuZGFlbW9uSWQsIGZuTmFtZSwgYXJncyk7XG4gIH1cbn1cblxuLyoqXG4gKiBQb2xscyBhIE1vbmVybyBkYWVtb24gZm9yIHVwZGF0ZXMgYW5kIG5vdGlmaWVzIGxpc3RlbmVycyBhcyB0aGV5IG9jY3VyLlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBEYWVtb25Qb2xsZXIge1xuXG4gIHByb3RlY3RlZCBkYWVtb246IE1vbmVyb0RhZW1vblJwYztcbiAgcHJvdGVjdGVkIGxvb3BlcjogVGFza0xvb3BlcjtcbiAgcHJvdGVjdGVkIGlzUG9sbGluZzogYm9vbGVhbjtcbiAgcHJvdGVjdGVkIGxhc3RIZWFkZXI6IE1vbmVyb0Jsb2NrSGVhZGVyO1xuXG4gIGNvbnN0cnVjdG9yKGRhZW1vbikge1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICB0aGlzLmRhZW1vbiA9IGRhZW1vbjtcbiAgICB0aGlzLmxvb3BlciA9IG5ldyBUYXNrTG9vcGVyKGFzeW5jIGZ1bmN0aW9uKCkgeyBhd2FpdCB0aGF0LnBvbGwoKTsgfSk7XG4gIH1cbiAgXG4gIHNldElzUG9sbGluZyhpc1BvbGxpbmc6IGJvb2xlYW4pIHtcbiAgICB0aGlzLmlzUG9sbGluZyA9IGlzUG9sbGluZztcbiAgICBpZiAoaXNQb2xsaW5nKSB0aGlzLmxvb3Blci5zdGFydCh0aGlzLmRhZW1vbi5nZXRQb2xsSW50ZXJ2YWwoKSk7XG4gICAgZWxzZSB0aGlzLmxvb3Blci5zdG9wKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHBvbGwoKSB7XG4gICAgdHJ5IHtcbiAgICAgIFxuICAgICAgLy8gZ2V0IGxhdGVzdCBibG9jayBoZWFkZXJcbiAgICAgIGxldCBoZWFkZXIgPSBhd2FpdCB0aGlzLmRhZW1vbi5nZXRMYXN0QmxvY2tIZWFkZXIoKTtcbiAgICAgIFxuICAgICAgLy8gc2F2ZSBmaXJzdCBoZWFkZXIgZm9yIGNvbXBhcmlzb25cbiAgICAgIGlmICghdGhpcy5sYXN0SGVhZGVyKSB7XG4gICAgICAgIHRoaXMubGFzdEhlYWRlciA9IGF3YWl0IHRoaXMuZGFlbW9uLmdldExhc3RCbG9ja0hlYWRlcigpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIGNvbXBhcmUgaGVhZGVyIHRvIGxhc3RcbiAgICAgIGlmIChoZWFkZXIuZ2V0SGFzaCgpICE9PSB0aGlzLmxhc3RIZWFkZXIuZ2V0SGFzaCgpKSB7XG4gICAgICAgIHRoaXMubGFzdEhlYWRlciA9IGhlYWRlcjtcbiAgICAgICAgYXdhaXQgdGhpcy5hbm5vdW5jZUJsb2NrSGVhZGVyKGhlYWRlcik7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGJhY2tncm91bmQgcG9sbCBkYWVtb24gaGVhZGVyXCIpO1xuICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgIH1cbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBhbm5vdW5jZUJsb2NrSGVhZGVyKGhlYWRlcjogTW9uZXJvQmxvY2tIZWFkZXIpIHtcbiAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiBhd2FpdCB0aGlzLmRhZW1vbi5nZXRMaXN0ZW5lcnMoKSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgbGlzdGVuZXIub25CbG9ja0hlYWRlcihoZWFkZXIpOyAvLyBub3RpZnkgbGlzdGVuZXJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgY2FsbGluZyBsaXN0ZW5lciBvbiBibG9jayBoZWFkZXJcIiwgZXJyKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBJbnRlcm5hbCBsaXN0ZW5lciB0byBicmlkZ2Ugbm90aWZpY2F0aW9ucyB0byBleHRlcm5hbCBsaXN0ZW5lcnMuXG4gKiBcbiAqIEBwcml2YXRlXG4gKi9cbmNsYXNzIERhZW1vbldvcmtlckxpc3RlbmVyIHtcblxuICBwcm90ZWN0ZWQgaWQ6IGFueTtcbiAgcHJvdGVjdGVkIGxpc3RlbmVyOiBhbnk7XG5cbiAgY29uc3RydWN0b3IobGlzdGVuZXIpIHtcbiAgICB0aGlzLmlkID0gR2VuVXRpbHMuZ2V0VVVJRCgpO1xuICAgIHRoaXMubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgfVxuICBcbiAgZ2V0SWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaWQ7XG4gIH1cbiAgXG4gIGdldExpc3RlbmVyKCkge1xuICAgIHJldHVybiB0aGlzLmxpc3RlbmVyO1xuICB9XG4gIFxuICBhc3luYyBvbkJsb2NrSGVhZGVyKGhlYWRlckpzb24pIHtcbiAgICB0aGlzLmxpc3RlbmVyLm9uQmxvY2tIZWFkZXIobmV3IE1vbmVyb0Jsb2NrSGVhZGVyKGhlYWRlckpzb24pKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBNb25lcm9EYWVtb25ScGM7XG4iXSwibWFwcGluZ3MiOiJ5TEFBQSxJQUFBQSxPQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxTQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxhQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRyxXQUFBLEdBQUFKLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSSxlQUFBLEdBQUFMLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSyxVQUFBLEdBQUFOLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTSxZQUFBLEdBQUFQLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTyxrQkFBQSxHQUFBUixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVEsb0JBQUEsR0FBQVQsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFTLHFCQUFBLEdBQUFWLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBVSxhQUFBLEdBQUFYLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBVyxtQkFBQSxHQUFBWixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVksaUJBQUEsR0FBQWIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFhLHFCQUFBLEdBQUFkLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBYyxxQkFBQSxHQUFBZixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWUsOEJBQUEsR0FBQWhCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBZ0IsaUNBQUEsR0FBQWpCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBaUIsa0JBQUEsR0FBQWxCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBa0IsWUFBQSxHQUFBbkIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFtQixtQkFBQSxH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