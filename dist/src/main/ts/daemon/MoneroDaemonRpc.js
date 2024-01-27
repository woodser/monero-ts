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
    let process = require('child_process').spawn(config.cmd[0], config.cmd.slice(1), {});
    process.stdout.setEncoding('utf8');
    process.stderr.setEncoding('utf8');

    // return promise which resolves after starting monerod
    let uri;
    let output = "";
    try {
      return await new Promise(function (resolve, reject) {

        // handle stdout
        process.stdout.on('data', async function (data) {
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
            daemon.process = process;

            // resolve promise with client connected to internal process 
            this.isResolved = true;
            resolve(daemon);
          }
        });

        // handle stderr
        process.stderr.on('data', function (data) {
          if (_LibraryUtils.default.getLogLevel() >= 2) console.error(data);
        });

        // handle exit
        process.on("exit", function (code) {
          if (!this.isResolved) reject(new Error("monerod process terminated with exit code " + code + (output ? ":\n\n" + output : "")));
        });

        // handle error
        process.on("error", function (err) {
          if (err.message.indexOf("ENOENT") >= 0) reject(new Error("monerod does not exist at path '" + config.cmd[0] + "'"));
          if (!this.isResolved) reject(err);
        });

        // handle uncaught exception
        process.on("uncaughtException", function (err, origin) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX1Rhc2tMb29wZXIiLCJfTW9uZXJvQWx0Q2hhaW4iLCJfTW9uZXJvQmFuIiwiX01vbmVyb0Jsb2NrIiwiX01vbmVyb0Jsb2NrSGVhZGVyIiwiX01vbmVyb0Jsb2NrVGVtcGxhdGUiLCJfTW9uZXJvQ29ubmVjdGlvblNwYW4iLCJfTW9uZXJvRGFlbW9uIiwiX01vbmVyb0RhZW1vbkNvbmZpZyIsIl9Nb25lcm9EYWVtb25JbmZvIiwiX01vbmVyb0RhZW1vbkxpc3RlbmVyIiwiX01vbmVyb0RhZW1vblN5bmNJbmZvIiwiX01vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0IiwiX01vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0IiwiX01vbmVyb0ZlZUVzdGltYXRlIiwiX01vbmVyb0Vycm9yIiwiX01vbmVyb0hhcmRGb3JrSW5mbyIsIl9Nb25lcm9LZXlJbWFnZSIsIl9Nb25lcm9NaW5lclR4U3VtIiwiX01vbmVyb01pbmluZ1N0YXR1cyIsIl9Nb25lcm9OZXR3b3JrVHlwZSIsIl9Nb25lcm9PdXRwdXQiLCJfTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkiLCJfTW9uZXJvUGVlciIsIl9Nb25lcm9QcnVuZVJlc3VsdCIsIl9Nb25lcm9ScGNDb25uZWN0aW9uIiwiX01vbmVyb1N1Ym1pdFR4UmVzdWx0IiwiX01vbmVyb1R4IiwiX01vbmVyb1R4UG9vbFN0YXRzIiwiX01vbmVyb1V0aWxzIiwiX01vbmVyb1ZlcnNpb24iLCJNb25lcm9EYWVtb25ScGMiLCJNb25lcm9EYWVtb24iLCJNQVhfUkVRX1NJWkUiLCJERUZBVUxUX0lEIiwiTlVNX0hFQURFUlNfUEVSX1JFUSIsIkRFRkFVTFRfUE9MTF9QRVJJT0QiLCJjb25zdHJ1Y3RvciIsImNvbmZpZyIsInByb3h5RGFlbW9uIiwicHJveHlUb1dvcmtlciIsImxpc3RlbmVycyIsImNhY2hlZEhlYWRlcnMiLCJnZXRQcm9jZXNzIiwicHJvY2VzcyIsInN0b3BQcm9jZXNzIiwiZm9yY2UiLCJ1bmRlZmluZWQiLCJNb25lcm9FcnJvciIsImxpc3RlbmVyc0NvcHkiLCJHZW5VdGlscyIsImNvcHlBcnJheSIsImdldExpc3RlbmVycyIsImxpc3RlbmVyIiwicmVtb3ZlTGlzdGVuZXIiLCJraWxsUHJvY2VzcyIsImFkZExpc3RlbmVyIiwiYXNzZXJ0IiwiTW9uZXJvRGFlbW9uTGlzdGVuZXIiLCJwdXNoIiwicmVmcmVzaExpc3RlbmluZyIsImlkeCIsImluZGV4T2YiLCJzcGxpY2UiLCJnZXRScGNDb25uZWN0aW9uIiwiZ2V0U2VydmVyIiwiaXNDb25uZWN0ZWQiLCJnZXRWZXJzaW9uIiwiZSIsInJlc3AiLCJzZW5kSnNvblJlcXVlc3QiLCJjaGVja1Jlc3BvbnNlU3RhdHVzIiwicmVzdWx0IiwiTW9uZXJvVmVyc2lvbiIsInZlcnNpb24iLCJyZWxlYXNlIiwiaXNUcnVzdGVkIiwic2VuZFBhdGhSZXF1ZXN0IiwidW50cnVzdGVkIiwiZ2V0SGVpZ2h0IiwiY291bnQiLCJnZXRCbG9ja0hhc2giLCJoZWlnaHQiLCJnZXRCbG9ja1RlbXBsYXRlIiwid2FsbGV0QWRkcmVzcyIsInJlc2VydmVTaXplIiwid2FsbGV0X2FkZHJlc3MiLCJyZXNlcnZlX3NpemUiLCJjb252ZXJ0UnBjQmxvY2tUZW1wbGF0ZSIsImdldExhc3RCbG9ja0hlYWRlciIsImNvbnZlcnRScGNCbG9ja0hlYWRlciIsImJsb2NrX2hlYWRlciIsImdldEJsb2NrSGVhZGVyQnlIYXNoIiwiYmxvY2tIYXNoIiwiaGFzaCIsImdldEJsb2NrSGVhZGVyQnlIZWlnaHQiLCJnZXRCbG9ja0hlYWRlcnNCeVJhbmdlIiwic3RhcnRIZWlnaHQiLCJlbmRIZWlnaHQiLCJzdGFydF9oZWlnaHQiLCJlbmRfaGVpZ2h0IiwiaGVhZGVycyIsInJwY0hlYWRlciIsImdldEJsb2NrQnlIYXNoIiwiY29udmVydFJwY0Jsb2NrIiwiZ2V0QmxvY2tCeUhlaWdodCIsImdldEJsb2Nrc0J5SGVpZ2h0IiwiaGVpZ2h0cyIsInJlc3BCaW4iLCJzZW5kQmluYXJ5UmVxdWVzdCIsInJwY0Jsb2NrcyIsIk1vbmVyb1V0aWxzIiwiYmluYXJ5QmxvY2tzVG9Kc29uIiwiZXF1YWwiLCJ0eHMiLCJsZW5ndGgiLCJibG9ja3MiLCJibG9ja0lkeCIsImJsb2NrIiwic2V0SGVpZ2h0IiwidHhJZHgiLCJ0eCIsIk1vbmVyb1R4Iiwic2V0SGFzaCIsInR4X2hhc2hlcyIsInNldElzQ29uZmlybWVkIiwic2V0SW5UeFBvb2wiLCJzZXRJc01pbmVyVHgiLCJzZXRSZWxheSIsInNldElzUmVsYXllZCIsInNldElzRmFpbGVkIiwic2V0SXNEb3VibGVTcGVuZFNlZW4iLCJjb252ZXJ0UnBjVHgiLCJzZXRUeHMiLCJnZXRCbG9jayIsIm1lcmdlIiwiZ2V0VHhzIiwic2V0QmxvY2siLCJnZXRCbG9ja3NCeVJhbmdlIiwiZ2V0QmxvY2tzQnlSYW5nZUNodW5rZWQiLCJtYXhDaHVua1NpemUiLCJsYXN0SGVpZ2h0IiwiZ2V0TWF4QmxvY2tzIiwidHhIYXNoZXMiLCJwcnVuZSIsIkFycmF5IiwiaXNBcnJheSIsInR4c19oYXNoZXMiLCJkZWNvZGVfYXNfanNvbiIsIm1lc3NhZ2UiLCJnZXRUeEhleGVzIiwiaGV4ZXMiLCJnZXRQcnVuZWRIZXgiLCJnZXRGdWxsSGV4IiwiZ2V0TWluZXJUeFN1bSIsIm51bUJsb2NrcyIsInR4U3VtIiwiTW9uZXJvTWluZXJUeFN1bSIsInNldEVtaXNzaW9uU3VtIiwiQmlnSW50IiwiZW1pc3Npb25fYW1vdW50Iiwic2V0RmVlU3VtIiwiZmVlX2Ftb3VudCIsImdldEZlZUVzdGltYXRlIiwiZ3JhY2VCbG9ja3MiLCJncmFjZV9ibG9ja3MiLCJmZWVFc3RpbWF0ZSIsIk1vbmVyb0ZlZUVzdGltYXRlIiwic2V0RmVlIiwiZmVlIiwiZmVlcyIsImkiLCJzZXRGZWVzIiwic2V0UXVhbnRpemF0aW9uTWFzayIsInF1YW50aXphdGlvbl9tYXNrIiwic3VibWl0VHhIZXgiLCJ0eEhleCIsImRvTm90UmVsYXkiLCJ0eF9hc19oZXgiLCJkb19ub3RfcmVsYXkiLCJjb252ZXJ0UnBjU3VibWl0VHhSZXN1bHQiLCJzZXRJc0dvb2QiLCJyZWxheVR4c0J5SGFzaCIsInR4aWRzIiwiZ2V0VHhQb29sIiwidHJhbnNhY3Rpb25zIiwicnBjVHgiLCJzZXROdW1Db25maXJtYXRpb25zIiwiZ2V0VHhQb29sSGFzaGVzIiwiZ2V0VHhQb29sU3RhdHMiLCJjb252ZXJ0UnBjVHhQb29sU3RhdHMiLCJwb29sX3N0YXRzIiwiZmx1c2hUeFBvb2wiLCJoYXNoZXMiLCJsaXN0aWZ5IiwiZ2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzIiwia2V5SW1hZ2VzIiwia2V5X2ltYWdlcyIsInNwZW50X3N0YXR1cyIsImdldE91dHB1dEhpc3RvZ3JhbSIsImFtb3VudHMiLCJtaW5Db3VudCIsIm1heENvdW50IiwiaXNVbmxvY2tlZCIsInJlY2VudEN1dG9mZiIsIm1pbl9jb3VudCIsIm1heF9jb3VudCIsInVubG9ja2VkIiwicmVjZW50X2N1dG9mZiIsImVudHJpZXMiLCJoaXN0b2dyYW0iLCJycGNFbnRyeSIsImNvbnZlcnRScGNPdXRwdXRIaXN0b2dyYW1FbnRyeSIsImdldE91dHB1dERpc3RyaWJ1dGlvbiIsImN1bXVsYXRpdmUiLCJnZXRJbmZvIiwiY29udmVydFJwY0luZm8iLCJnZXRTeW5jSW5mbyIsImNvbnZlcnRScGNTeW5jSW5mbyIsImdldEhhcmRGb3JrSW5mbyIsImNvbnZlcnRScGNIYXJkRm9ya0luZm8iLCJnZXRBbHRDaGFpbnMiLCJjaGFpbnMiLCJycGNDaGFpbiIsImNvbnZlcnRScGNBbHRDaGFpbiIsImdldEFsdEJsb2NrSGFzaGVzIiwiYmxrc19oYXNoZXMiLCJnZXREb3dubG9hZExpbWl0IiwiZ2V0QmFuZHdpZHRoTGltaXRzIiwic2V0RG93bmxvYWRMaW1pdCIsImxpbWl0IiwicmVzZXREb3dubG9hZExpbWl0IiwiaXNJbnQiLCJzZXRCYW5kd2lkdGhMaW1pdHMiLCJnZXRVcGxvYWRMaW1pdCIsInNldFVwbG9hZExpbWl0IiwicmVzZXRVcGxvYWRMaW1pdCIsImdldFBlZXJzIiwicGVlcnMiLCJjb25uZWN0aW9ucyIsInJwY0Nvbm5lY3Rpb24iLCJjb252ZXJ0UnBjQ29ubmVjdGlvbiIsImdldEtub3duUGVlcnMiLCJncmF5X2xpc3QiLCJycGNQZWVyIiwicGVlciIsImNvbnZlcnRScGNQZWVyIiwic2V0SXNPbmxpbmUiLCJ3aGl0ZV9saXN0Iiwic2V0T3V0Z29pbmdQZWVyTGltaXQiLCJvdXRfcGVlcnMiLCJzZXRJbmNvbWluZ1BlZXJMaW1pdCIsImluX3BlZXJzIiwiZ2V0UGVlckJhbnMiLCJiYW5zIiwicnBjQmFuIiwiYmFuIiwiTW9uZXJvQmFuIiwic2V0SG9zdCIsImhvc3QiLCJzZXRJcCIsImlwIiwic2V0U2Vjb25kcyIsInNlY29uZHMiLCJzZXRQZWVyQmFucyIsInJwY0JhbnMiLCJjb252ZXJ0VG9ScGNCYW4iLCJzdGFydE1pbmluZyIsImFkZHJlc3MiLCJudW1UaHJlYWRzIiwiaXNCYWNrZ3JvdW5kIiwiaWdub3JlQmF0dGVyeSIsIm1pbmVyX2FkZHJlc3MiLCJ0aHJlYWRzX2NvdW50IiwiZG9fYmFja2dyb3VuZF9taW5pbmciLCJpZ25vcmVfYmF0dGVyeSIsInN0b3BNaW5pbmciLCJnZXRNaW5pbmdTdGF0dXMiLCJjb252ZXJ0UnBjTWluaW5nU3RhdHVzIiwic3VibWl0QmxvY2tzIiwiYmxvY2tCbG9icyIsInBydW5lQmxvY2tjaGFpbiIsImNoZWNrIiwiTW9uZXJvUHJ1bmVSZXN1bHQiLCJzZXRJc1BydW5lZCIsInBydW5lZCIsInNldFBydW5pbmdTZWVkIiwicHJ1bmluZ19zZWVkIiwiY2hlY2tGb3JVcGRhdGUiLCJjb21tYW5kIiwiY29udmVydFJwY1VwZGF0ZUNoZWNrUmVzdWx0IiwiZG93bmxvYWRVcGRhdGUiLCJwYXRoIiwiY29udmVydFJwY1VwZGF0ZURvd25sb2FkUmVzdWx0Iiwic3RvcCIsIndhaXRGb3JOZXh0QmxvY2tIZWFkZXIiLCJ0aGF0IiwiUHJvbWlzZSIsInJlc29sdmUiLCJvbkJsb2NrSGVhZGVyIiwiaGVhZGVyIiwiZ2V0UG9sbEludGVydmFsIiwicG9sbEludGVydmFsIiwiZ2V0VHgiLCJ0eEhhc2giLCJnZXRUeEhleCIsImdldEtleUltYWdlU3BlbnRTdGF0dXMiLCJrZXlJbWFnZSIsInNldFBlZXJCYW4iLCJzdWJtaXRCbG9jayIsImJsb2NrQmxvYiIsInBvbGxMaXN0ZW5lciIsIkRhZW1vblBvbGxlciIsInNldElzUG9sbGluZyIsImxpbWl0X2Rvd24iLCJsaW1pdF91cCIsImRvd25MaW1pdCIsInVwTGltaXQiLCJtYXhIZWlnaHQiLCJtYXhSZXFTaXplIiwicmVxU2l6ZSIsImdldEJsb2NrSGVhZGVyQnlIZWlnaHRDYWNoZWQiLCJnZXRTaXplIiwiY2FjaGVkSGVhZGVyIiwiTWF0aCIsIm1pbiIsImNvbm5lY3RUb0RhZW1vblJwYyIsInVyaU9yQ29uZmlnIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsIm5vcm1hbGl6ZUNvbmZpZyIsImNtZCIsInN0YXJ0TW9uZXJvZFByb2Nlc3MiLCJNb25lcm9EYWVtb25ScGNQcm94eSIsImNvbm5lY3QiLCJzcGF3biIsInNsaWNlIiwic3Rkb3V0Iiwic2V0RW5jb2RpbmciLCJzdGRlcnIiLCJ1cmkiLCJvdXRwdXQiLCJyZWplY3QiLCJvbiIsImRhdGEiLCJsaW5lIiwidG9TdHJpbmciLCJMaWJyYXJ5VXRpbHMiLCJsb2ciLCJ1cmlMaW5lQ29udGFpbnMiLCJ1cmlMaW5lQ29udGFpbnNJZHgiLCJzdWJzdHJpbmciLCJsYXN0SW5kZXhPZiIsInVuZm9ybWF0dGVkTGluZSIsInJlcGxhY2UiLCJ0cmltIiwicG9ydCIsInNzbElkeCIsInNzbEVuYWJsZWQiLCJ0b0xvd2VyQ2FzZSIsInVzZXJQYXNzSWR4IiwidXNlclBhc3MiLCJjb3B5Iiwic2V0U2VydmVyIiwicmVqZWN0VW5hdXRob3JpemVkIiwiZ2V0UmVqZWN0VW5hdXRob3JpemVkIiwic2V0UHJveHlUb1dvcmtlciIsImRhZW1vbiIsImlzUmVzb2x2ZWQiLCJnZXRMb2dMZXZlbCIsImNvbnNvbGUiLCJlcnJvciIsImNvZGUiLCJFcnJvciIsImVyciIsIm9yaWdpbiIsIk1vbmVyb0RhZW1vbkNvbmZpZyIsInNlcnZlciIsIk1vbmVyb1JwY0Nvbm5lY3Rpb24iLCJERUZBVUxUX0NPTkZJRyIsInN0YXR1cyIsIk1vbmVyb0Jsb2NrSGVhZGVyIiwia2V5IiwiT2JqZWN0Iiwia2V5cyIsInZhbCIsInNhZmVTZXQiLCJzZXRTaXplIiwiZ2V0RGVwdGgiLCJzZXREZXB0aCIsInNldERpZmZpY3VsdHkiLCJyZWNvbmNpbGUiLCJnZXREaWZmaWN1bHR5IiwicHJlZml4ZWRIZXhUb0JJIiwic2V0Q3VtdWxhdGl2ZURpZmZpY3VsdHkiLCJnZXRDdW11bGF0aXZlRGlmZmljdWx0eSIsImdldEhhc2giLCJnZXRNYWpvclZlcnNpb24iLCJzZXRNYWpvclZlcnNpb24iLCJnZXRNaW5vclZlcnNpb24iLCJzZXRNaW5vclZlcnNpb24iLCJnZXROb25jZSIsInNldE5vbmNlIiwiZ2V0TnVtVHhzIiwic2V0TnVtVHhzIiwiZ2V0T3JwaGFuU3RhdHVzIiwic2V0T3JwaGFuU3RhdHVzIiwiZ2V0UHJldkhhc2giLCJzZXRQcmV2SGFzaCIsImdldFJld2FyZCIsInNldFJld2FyZCIsImdldFRpbWVzdGFtcCIsInNldFRpbWVzdGFtcCIsImdldFdlaWdodCIsInNldFdlaWdodCIsImdldExvbmdUZXJtV2VpZ2h0Iiwic2V0TG9uZ1Rlcm1XZWlnaHQiLCJnZXRQb3dIYXNoIiwic2V0UG93SGFzaCIsInNldE1pbmVyVHhIYXNoIiwicnBjQmxvY2siLCJNb25lcm9CbG9jayIsInNldEhleCIsImJsb2IiLCJzZXRUeEhhc2hlcyIsInJwY01pbmVyVHgiLCJqc29uIiwiSlNPTiIsInBhcnNlIiwibWluZXJfdHgiLCJtaW5lclR4Iiwic2V0TWluZXJUeCIsImdldExhc3RSZWxheWVkVGltZXN0YW1wIiwic2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAiLCJnZXRSZWNlaXZlZFRpbWVzdGFtcCIsInNldFJlY2VpdmVkVGltZXN0YW1wIiwiZ2V0TnVtQ29uZmlybWF0aW9ucyIsImdldElzQ29uZmlybWVkIiwiZ2V0SW5UeFBvb2wiLCJnZXRJc0RvdWJsZVNwZW5kU2VlbiIsInNldFZlcnNpb24iLCJnZXRFeHRyYSIsInNldEV4dHJhIiwiVWludDhBcnJheSIsImdlbiIsInNldElucHV0cyIsIm1hcCIsInJwY1ZpbiIsImNvbnZlcnRScGNPdXRwdXQiLCJzZXRPdXRwdXRzIiwicnBjT3V0cHV0IiwiZ2V0UmN0U2lnbmF0dXJlcyIsInNldFJjdFNpZ25hdHVyZXMiLCJ0eG5GZWUiLCJnZXRGZWUiLCJnZXRSY3RTaWdQcnVuYWJsZSIsInNldFJjdFNpZ1BydW5hYmxlIiwiZ2V0VW5sb2NrVGltZSIsInNldFVubG9ja1RpbWUiLCJzZXRGdWxsSGV4IiwiZ2V0SXNSZWxheWVkIiwiZ2V0T3V0cHV0SW5kaWNlcyIsInNldE91dHB1dEluZGljZXMiLCJnZXRSZWxheSIsImdldElzS2VwdEJ5QmxvY2siLCJzZXRJc0tlcHRCeUJsb2NrIiwiZ2V0U2lnbmF0dXJlcyIsInNldFNpZ25hdHVyZXMiLCJnZXRJc0ZhaWxlZCIsImdldExhc3RGYWlsZWRIZWlnaHQiLCJzZXRMYXN0RmFpbGVkSGVpZ2h0IiwiZ2V0TGFzdEZhaWxlZEhhc2giLCJzZXRMYXN0RmFpbGVkSGFzaCIsImdldE1heFVzZWRCbG9ja0hlaWdodCIsInNldE1heFVzZWRCbG9ja0hlaWdodCIsImdldE1heFVzZWRCbG9ja0hhc2giLCJzZXRNYXhVc2VkQmxvY2tIYXNoIiwiZ2V0UHJ1bmFibGVIYXNoIiwic2V0UHJ1bmFibGVIYXNoIiwiZ2V0UHJ1bmFibGVIZXgiLCJzZXRQcnVuYWJsZUhleCIsInNldFBydW5lZEhleCIsImdldE91dHB1dHMiLCJzZXRJbmRleCIsImFzX2pzb24iLCJ0eF9qc29uIiwiTW9uZXJvT3V0cHV0Iiwic2V0VHgiLCJnZXRBbW91bnQiLCJzZXRBbW91bnQiLCJhbW91bnQiLCJnZXRLZXlJbWFnZSIsInNldEtleUltYWdlIiwiTW9uZXJvS2V5SW1hZ2UiLCJrX2ltYWdlIiwiZ2V0UmluZ091dHB1dEluZGljZXMiLCJzZXRSaW5nT3V0cHV0SW5kaWNlcyIsImtleV9vZmZzZXRzIiwicHViS2V5IiwidGFnZ2VkX2tleSIsImdldFN0ZWFsdGhQdWJsaWNLZXkiLCJzZXRTdGVhbHRoUHVibGljS2V5IiwicnBjVGVtcGxhdGUiLCJ0ZW1wbGF0ZSIsIk1vbmVyb0Jsb2NrVGVtcGxhdGUiLCJzZXRCbG9ja1RlbXBsYXRlQmxvYiIsInNldEJsb2NrSGFzaGluZ0Jsb2IiLCJzZXRFeHBlY3RlZFJld2FyZCIsInNldFJlc2VydmVkT2Zmc2V0Iiwic2V0U2VlZEhlaWdodCIsInNldFNlZWRIYXNoIiwic2V0TmV4dFNlZWRIYXNoIiwiZ2V0TmV4dFNlZWRIYXNoIiwicnBjSW5mbyIsImluZm8iLCJNb25lcm9EYWVtb25JbmZvIiwic2V0TnVtQWx0QmxvY2tzIiwic2V0QmxvY2tTaXplTGltaXQiLCJzZXRCbG9ja1NpemVNZWRpYW4iLCJzZXRCbG9ja1dlaWdodExpbWl0Iiwic2V0QmxvY2tXZWlnaHRNZWRpYW4iLCJzZXRCb290c3RyYXBEYWVtb25BZGRyZXNzIiwic2V0RnJlZVNwYWNlIiwic2V0RGF0YWJhc2VTaXplIiwic2V0TnVtT2ZmbGluZVBlZXJzIiwic2V0SGVpZ2h0V2l0aG91dEJvb3RzdHJhcCIsInNldE51bUluY29taW5nQ29ubmVjdGlvbnMiLCJzZXRJc09mZmxpbmUiLCJzZXROdW1PdXRnb2luZ0Nvbm5lY3Rpb25zIiwic2V0TnVtUnBjQ29ubmVjdGlvbnMiLCJzZXRTdGFydFRpbWVzdGFtcCIsInNldEFkanVzdGVkVGltZXN0YW1wIiwic2V0VGFyZ2V0Iiwic2V0VGFyZ2V0SGVpZ2h0Iiwic2V0VG9wQmxvY2tIYXNoIiwic2V0TnVtVHhzUG9vbCIsInNldFdhc0Jvb3RzdHJhcEV2ZXJVc2VkIiwic2V0TnVtT25saW5lUGVlcnMiLCJzZXRVcGRhdGVBdmFpbGFibGUiLCJnZXROZXR3b3JrVHlwZSIsInNldE5ldHdvcmtUeXBlIiwiTW9uZXJvTmV0d29ya1R5cGUiLCJNQUlOTkVUIiwiVEVTVE5FVCIsIlNUQUdFTkVUIiwic2V0Q3JlZGl0cyIsImdldFRvcEJsb2NrSGFzaCIsInNldElzQnVzeVN5bmNpbmciLCJzZXRJc1N5bmNocm9uaXplZCIsInNldElzUmVzdHJpY3RlZCIsInJwY1N5bmNJbmZvIiwic3luY0luZm8iLCJNb25lcm9EYWVtb25TeW5jSW5mbyIsInNldFBlZXJzIiwicnBjQ29ubmVjdGlvbnMiLCJzZXRTcGFucyIsInJwY1NwYW5zIiwicnBjU3BhbiIsImdldFNwYW5zIiwiY29udmVydFJwY0Nvbm5lY3Rpb25TcGFuIiwic2V0TmV4dE5lZWRlZFBydW5pbmdTZWVkIiwib3ZlcnZpZXciLCJycGNIYXJkRm9ya0luZm8iLCJNb25lcm9IYXJkRm9ya0luZm8iLCJzZXRFYXJsaWVzdEhlaWdodCIsInNldElzRW5hYmxlZCIsInNldFN0YXRlIiwic2V0VGhyZXNob2xkIiwic2V0TnVtVm90ZXMiLCJzZXRWb3RpbmciLCJzZXRXaW5kb3ciLCJycGNDb25uZWN0aW9uU3BhbiIsInNwYW4iLCJNb25lcm9Db25uZWN0aW9uU3BhbiIsInNldENvbm5lY3Rpb25JZCIsInNldE51bUJsb2NrcyIsInNldFJhdGUiLCJzZXRSZW1vdGVBZGRyZXNzIiwic2V0U3BlZWQiLCJzZXRTdGFydEhlaWdodCIsImVudHJ5IiwiTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkiLCJzZXROdW1JbnN0YW5jZXMiLCJzZXROdW1VbmxvY2tlZEluc3RhbmNlcyIsInNldE51bVJlY2VudEluc3RhbmNlcyIsInJwY1Jlc3VsdCIsIk1vbmVyb1N1Ym1pdFR4UmVzdWx0Iiwic2V0SXNGZWVUb29Mb3ciLCJzZXRIYXNJbnZhbGlkSW5wdXQiLCJzZXRIYXNJbnZhbGlkT3V0cHV0Iiwic2V0SGFzVG9vRmV3T3V0cHV0cyIsInNldElzTWl4aW5Ub29Mb3ciLCJzZXRJc092ZXJzcGVuZCIsInNldFJlYXNvbiIsInNldElzVG9vQmlnIiwic2V0U2FuaXR5Q2hlY2tGYWlsZWQiLCJzZXRJc1R4RXh0cmFUb29CaWciLCJycGNTdGF0cyIsInN0YXRzIiwiTW9uZXJvVHhQb29sU3RhdHMiLCJzZXRCeXRlc01heCIsInNldEJ5dGVzTWVkIiwic2V0Qnl0ZXNNaW4iLCJzZXRCeXRlc1RvdGFsIiwic2V0SGlzdG85OHBjIiwic2V0TnVtMTBtIiwic2V0TnVtRG91YmxlU3BlbmRzIiwic2V0TnVtRmFpbGluZyIsInNldE51bU5vdFJlbGF5ZWQiLCJzZXRPbGRlc3RUaW1lc3RhbXAiLCJzZXRGZWVUb3RhbCIsInNldEhpc3RvIiwiTWFwIiwiZWxlbSIsImdldEhpc3RvIiwic2V0IiwiYnl0ZXMiLCJnZXRIaXN0bzk4cGMiLCJjaGFpbiIsIk1vbmVyb0FsdENoYWluIiwic2V0TGVuZ3RoIiwic2V0QmxvY2tIYXNoZXMiLCJzZXRNYWluQ2hhaW5QYXJlbnRCbG9ja0hhc2giLCJNb25lcm9QZWVyIiwic2V0SWQiLCJzZXRMYXN0U2VlblRpbWVzdGFtcCIsInNldFBvcnQiLCJzZXRScGNQb3J0Iiwic2V0UnBjQ3JlZGl0c1Blckhhc2giLCJzZXRBZGRyZXNzIiwic2V0QXZnRG93bmxvYWQiLCJzZXRBdmdVcGxvYWQiLCJzZXRDdXJyZW50RG93bmxvYWQiLCJzZXRDdXJyZW50VXBsb2FkIiwic2V0SXNJbmNvbWluZyIsInNldExpdmVUaW1lIiwic2V0SXNMb2NhbElwIiwic2V0SXNMb2NhbEhvc3QiLCJwYXJzZUludCIsInNldE51bVJlY2VpdmVzIiwic2V0UmVjZWl2ZUlkbGVUaW1lIiwic2V0TnVtU2VuZHMiLCJzZXRTZW5kSWRsZVRpbWUiLCJzZXROdW1TdXBwb3J0RmxhZ3MiLCJzZXRUeXBlIiwiZ2V0SG9zdCIsImdldElwIiwiZ2V0SXNCYW5uZWQiLCJnZXRTZWNvbmRzIiwicnBjU3RhdHVzIiwiTW9uZXJvTWluaW5nU3RhdHVzIiwic2V0SXNBY3RpdmUiLCJhY3RpdmUiLCJzcGVlZCIsInNldE51bVRocmVhZHMiLCJzZXRJc0JhY2tncm91bmQiLCJpc19iYWNrZ3JvdW5kX21pbmluZ19lbmFibGVkIiwiTW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQiLCJzZXRBdXRvVXJpIiwic2V0SXNVcGRhdGVBdmFpbGFibGUiLCJzZXRVc2VyVXJpIiwiZ2V0QXV0b1VyaSIsImdldFVzZXJVcmkiLCJNb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdCIsInNldERvd25sb2FkUGF0aCIsImdldERvd25sb2FkUGF0aCIsImhleCIsImRhZW1vbklkIiwid29ya2VyIiwid3JhcHBlZExpc3RlbmVycyIsImdldFVVSUQiLCJhc3NpZ24iLCJpbnZva2VXb3JrZXIiLCJnZXRXb3JrZXIiLCJ3cmFwcGVkTGlzdGVuZXIiLCJEYWVtb25Xb3JrZXJMaXN0ZW5lciIsImxpc3RlbmVySWQiLCJnZXRJZCIsImFkZFdvcmtlckNhbGxiYWNrIiwiZ2V0TGlzdGVuZXIiLCJyZW1vdmVXb3JrZXJDYWxsYmFjayIsInZlcnNpb25Kc29uIiwibnVtYmVyIiwiaXNSZWxlYXNlIiwiZnJvbSIsImFyZ3VtZW50cyIsImJsb2NrSGVhZGVyc0pzb24iLCJibG9ja0hlYWRlckpzb24iLCJEZXNlcmlhbGl6YXRpb25UeXBlIiwiVFgiLCJnZXRCbG9ja3NCeUhhc2giLCJibG9ja0hhc2hlcyIsImJsb2Nrc0pzb24iLCJibG9ja0pzb24iLCJnZXRCbG9ja0hhc2hlcyIsImdldFR4UG9vbEJhY2tsb2ciLCJvdXRwdXRzIiwiZW50cnlKc29uIiwiYWx0Q2hhaW5zIiwiYWx0Q2hhaW5Kc29uIiwicGVlckpzb24iLCJiYW5Kc29uIiwiYmFuc0pzb24iLCJ0b0pzb24iLCJmbk5hbWUiLCJhcmdzIiwibG9vcGVyIiwiVGFza0xvb3BlciIsInBvbGwiLCJpc1BvbGxpbmciLCJzdGFydCIsImxhc3RIZWFkZXIiLCJhbm5vdW5jZUJsb2NrSGVhZGVyIiwiaWQiLCJoZWFkZXJKc29uIiwiX2RlZmF1bHQiLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL2RhZW1vbi9Nb25lcm9EYWVtb25ScGMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XG5pbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9HZW5VdGlsc1wiO1xuaW1wb3J0IExpYnJhcnlVdGlscyBmcm9tIFwiLi4vY29tbW9uL0xpYnJhcnlVdGlsc1wiO1xuaW1wb3J0IFRhc2tMb29wZXIgZnJvbSBcIi4uL2NvbW1vbi9UYXNrTG9vcGVyXCI7XG5pbXBvcnQgTW9uZXJvQWx0Q2hhaW4gZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWx0Q2hhaW5cIjtcbmltcG9ydCBNb25lcm9CYW4gZnJvbSBcIi4vbW9kZWwvTW9uZXJvQmFuXCI7XG5pbXBvcnQgTW9uZXJvQmxvY2sgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQmxvY2tcIjtcbmltcG9ydCBNb25lcm9CbG9ja0hlYWRlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9CbG9ja0hlYWRlclwiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrVGVtcGxhdGUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQmxvY2tUZW1wbGF0ZVwiO1xuaW1wb3J0IE1vbmVyb0Nvbm5lY3Rpb25TcGFuIGZyb20gXCIuL21vZGVsL01vbmVyb0Nvbm5lY3Rpb25TcGFuXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uIGZyb20gXCIuL01vbmVyb0RhZW1vblwiO1xuaW1wb3J0IE1vbmVyb0RhZW1vbkNvbmZpZyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9EYWVtb25Db25maWdcIjtcbmltcG9ydCBNb25lcm9EYWVtb25JbmZvIGZyb20gXCIuL21vZGVsL01vbmVyb0RhZW1vbkluZm9cIjtcbmltcG9ydCBNb25lcm9EYWVtb25MaXN0ZW5lciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9EYWVtb25MaXN0ZW5lclwiO1xuaW1wb3J0IE1vbmVyb0RhZW1vblN5bmNJbmZvIGZyb20gXCIuL21vZGVsL01vbmVyb0RhZW1vblN5bmNJbmZvXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb0ZlZUVzdGltYXRlIGZyb20gXCIuL21vZGVsL01vbmVyb0ZlZUVzdGltYXRlXCI7XG5pbXBvcnQgTW9uZXJvRXJyb3IgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9FcnJvclwiO1xuaW1wb3J0IE1vbmVyb0hhcmRGb3JrSW5mbyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9IYXJkRm9ya0luZm9cIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9LZXlJbWFnZVwiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlU3BlbnRTdGF0dXMgZnJvbSBcIi4vbW9kZWwvTW9uZXJvS2V5SW1hZ2VTcGVudFN0YXR1c1wiO1xuaW1wb3J0IE1vbmVyb01pbmVyVHhTdW0gZnJvbSBcIi4vbW9kZWwvTW9uZXJvTWluZXJUeFN1bVwiO1xuaW1wb3J0IE1vbmVyb01pbmluZ1N0YXR1cyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NaW5pbmdTdGF0dXNcIjtcbmltcG9ydCBNb25lcm9OZXR3b3JrVHlwZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9OZXR3b3JrVHlwZVwiO1xuaW1wb3J0IE1vbmVyb091dHB1dCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRwdXRcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeVwiO1xuaW1wb3J0IE1vbmVyb1BlZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvUGVlclwiO1xuaW1wb3J0IE1vbmVyb1BydW5lUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb1BydW5lUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvUnBjQ29ubmVjdGlvbiBmcm9tIFwiLi4vY29tbW9uL01vbmVyb1JwY0Nvbm5lY3Rpb25cIjtcbmltcG9ydCBNb25lcm9TdWJtaXRUeFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9TdWJtaXRUeFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb1R4IGZyb20gXCIuL21vZGVsL01vbmVyb1R4XCI7XG5pbXBvcnQgTW9uZXJvVHhQb29sU3RhdHMgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhQb29sU3RhdHNcIjtcbmltcG9ydCBNb25lcm9VdGlscyBmcm9tIFwiLi4vY29tbW9uL01vbmVyb1V0aWxzXCI7XG5pbXBvcnQgTW9uZXJvVmVyc2lvbiBmcm9tIFwiLi9tb2RlbC9Nb25lcm9WZXJzaW9uXCI7XG5pbXBvcnQgeyBDaGlsZFByb2Nlc3MgfSBmcm9tIFwiY2hpbGRfcHJvY2Vzc1wiO1xuXG4vKipcbiAqIENvcHlyaWdodCAoYykgd29vZHNlclxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcbiAqIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICogU09GVFdBUkUuXG4gKi9cblxuLyoqXG4gKiBJbXBsZW1lbnRzIGEgTW9uZXJvRGFlbW9uIGFzIGEgY2xpZW50IG9mIG1vbmVyb2QuXG4gKi9cbmNsYXNzIE1vbmVyb0RhZW1vblJwYyBleHRlbmRzIE1vbmVyb0RhZW1vbiB7XG5cbiAgLy8gc3RhdGljIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgc3RhdGljIHJlYWRvbmx5IE1BWF9SRVFfU0laRSA9IFwiMzAwMDAwMFwiO1xuICBwcm90ZWN0ZWQgc3RhdGljIHJlYWRvbmx5IERFRkFVTFRfSUQgPSBcIjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDBcIjsgLy8gdW5pbml0aWFsaXplZCB0eCBvciBibG9jayBoYXNoIGZyb20gZGFlbW9uIHJwY1xuICBwcm90ZWN0ZWQgc3RhdGljIHJlYWRvbmx5IE5VTV9IRUFERVJTX1BFUl9SRVEgPSA3NTA7IC8vIG51bWJlciBvZiBoZWFkZXJzIHRvIGZldGNoIGFuZCBjYWNoZSBwZXIgcmVxdWVzdFxuICBwcm90ZWN0ZWQgc3RhdGljIHJlYWRvbmx5IERFRkFVTFRfUE9MTF9QRVJJT0QgPSAyMDAwMDsgLy8gZGVmYXVsdCBpbnRlcnZhbCBiZXR3ZWVuIHBvbGxpbmcgdGhlIGRhZW1vbiBpbiBtc1xuXG4gIC8vIGluc3RhbmNlIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgY29uZmlnOiBQYXJ0aWFsPE1vbmVyb0RhZW1vbkNvbmZpZz47XG4gIHByb3RlY3RlZCBsaXN0ZW5lcnM6IE1vbmVyb0RhZW1vbkxpc3RlbmVyW107XG4gIHByb3RlY3RlZCBjYWNoZWRIZWFkZXJzOiBhbnk7XG4gIHByb3RlY3RlZCBwcm9jZXNzOiBhbnk7XG4gIHByb3RlY3RlZCBwb2xsTGlzdGVuZXI6IGFueTtcbiAgcHJvdGVjdGVkIHByb3h5RGFlbW9uOiBhbnk7XG4gXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBjb25zdHJ1Y3Rvcihjb25maWc6IE1vbmVyb0RhZW1vbkNvbmZpZywgcHJveHlEYWVtb246IE1vbmVyb0RhZW1vblJwY1Byb3h5KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLnByb3h5RGFlbW9uID0gcHJveHlEYWVtb247XG4gICAgaWYgKGNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm47XG4gICAgdGhpcy5saXN0ZW5lcnMgPSBbXTsgICAgICAvLyBibG9jayBsaXN0ZW5lcnNcbiAgICB0aGlzLmNhY2hlZEhlYWRlcnMgPSB7fTsgIC8vIGNhY2hlZCBoZWFkZXJzIGZvciBmZXRjaGluZyBibG9ja3MgaW4gYm91bmQgY2h1bmtzXG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGludGVybmFsIHByb2Nlc3MgcnVubmluZyBtb25lcm9kLlxuICAgKiBcbiAgICogQHJldHVybiB7Q2hpbGRQcm9jZXNzfSB0aGUgbm9kZSBwcm9jZXNzIHJ1bm5pbmcgbW9uZXJvZCwgdW5kZWZpbmVkIGlmIG5vdCBjcmVhdGVkIGZyb20gbmV3IHByb2Nlc3NcbiAgICovXG4gIGdldFByb2Nlc3MoKTogQ2hpbGRQcm9jZXNzIHtcbiAgICByZXR1cm4gdGhpcy5wcm9jZXNzO1xuICB9XG4gIFxuICAvKipcbiAgICogU3RvcCB0aGUgaW50ZXJuYWwgcHJvY2VzcyBydW5uaW5nIG1vbmVyb2QsIGlmIGFwcGxpY2FibGUuXG4gICAqIFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtmb3JjZV0gc3BlY2lmaWVzIGlmIHRoZSBwcm9jZXNzIHNob3VsZCBiZSBkZXN0cm95ZWQgZm9yY2libHkgKGRlZmF1bHQgZmFsc2UpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyIHwgdW5kZWZpbmVkPn0gdGhlIGV4aXQgY29kZSBmcm9tIHN0b3BwaW5nIHRoZSBwcm9jZXNzXG4gICAqL1xuICBhc3luYyBzdG9wUHJvY2Vzcyhmb3JjZSA9IGZhbHNlKTogUHJvbWlzZTxudW1iZXIgfCB1bmRlZmluZWQ+IHtcbiAgICBpZiAodGhpcy5wcm9jZXNzID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk1vbmVyb0RhZW1vblJwYyBpbnN0YW5jZSBub3QgY3JlYXRlZCBmcm9tIG5ldyBwcm9jZXNzXCIpO1xuICAgIGxldCBsaXN0ZW5lcnNDb3B5ID0gR2VuVXRpbHMuY29weUFycmF5KGF3YWl0IHRoaXMuZ2V0TGlzdGVuZXJzKCkpO1xuICAgIGZvciAobGV0IGxpc3RlbmVyIG9mIGxpc3RlbmVyc0NvcHkpIGF3YWl0IHRoaXMucmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIHJldHVybiBHZW5VdGlscy5raWxsUHJvY2Vzcyh0aGlzLnByb2Nlc3MsIGZvcmNlID8gXCJTSUdLSUxMXCIgOiB1bmRlZmluZWQpO1xuICB9XG4gIFxuICBhc3luYyBhZGRMaXN0ZW5lcihsaXN0ZW5lcjogTW9uZXJvRGFlbW9uTGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIGFzc2VydChsaXN0ZW5lciBpbnN0YW5jZW9mIE1vbmVyb0RhZW1vbkxpc3RlbmVyLCBcIkxpc3RlbmVyIG11c3QgYmUgaW5zdGFuY2Ugb2YgTW9uZXJvRGFlbW9uTGlzdGVuZXJcIik7XG4gICAgdGhpcy5saXN0ZW5lcnMucHVzaChsaXN0ZW5lcik7XG4gICAgdGhpcy5yZWZyZXNoTGlzdGVuaW5nKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyOiBNb25lcm9EYWVtb25MaXN0ZW5lcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgYXNzZXJ0KGxpc3RlbmVyIGluc3RhbmNlb2YgTW9uZXJvRGFlbW9uTGlzdGVuZXIsIFwiTGlzdGVuZXIgbXVzdCBiZSBpbnN0YW5jZSBvZiBNb25lcm9EYWVtb25MaXN0ZW5lclwiKTtcbiAgICBsZXQgaWR4ID0gdGhpcy5saXN0ZW5lcnMuaW5kZXhPZihsaXN0ZW5lcik7XG4gICAgaWYgKGlkeCA+IC0xKSB0aGlzLmxpc3RlbmVycy5zcGxpY2UoaWR4LCAxKTtcbiAgICBlbHNlIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkxpc3RlbmVyIGlzIG5vdCByZWdpc3RlcmVkIHdpdGggZGFlbW9uXCIpO1xuICAgIHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICB9XG4gIFxuICBnZXRMaXN0ZW5lcnMoKTogTW9uZXJvRGFlbW9uTGlzdGVuZXJbXSB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldExpc3RlbmVycygpO1xuICAgIHJldHVybiB0aGlzLmxpc3RlbmVycztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgZGFlbW9uJ3MgUlBDIGNvbm5lY3Rpb24uXG4gICAqIFxuICAgKiBAcmV0dXJuIHtNb25lcm9ScGNDb25uZWN0aW9ufSB0aGUgZGFlbW9uJ3MgcnBjIGNvbm5lY3Rpb25cbiAgICovXG4gIGFzeW5jIGdldFJwY0Nvbm5lY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFJwY0Nvbm5lY3Rpb24oKTtcbiAgICByZXR1cm4gdGhpcy5jb25maWcuZ2V0U2VydmVyKCk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzQ29ubmVjdGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5pc0Nvbm5lY3RlZCgpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmdldFZlcnNpb24oKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZ2V0VmVyc2lvbigpOiBQcm9taXNlPE1vbmVyb1ZlcnNpb24+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0VmVyc2lvbigpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3ZlcnNpb25cIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBuZXcgTW9uZXJvVmVyc2lvbihyZXNwLnJlc3VsdC52ZXJzaW9uLCByZXNwLnJlc3VsdC5yZWxlYXNlKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNUcnVzdGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5pc1RydXN0ZWQoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImdldF9oZWlnaHRcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgcmV0dXJuICFyZXNwLnVudHJ1c3RlZDtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEhlaWdodCgpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2Jsb2NrX2NvdW50XCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuY291bnQ7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrSGFzaChoZWlnaHQ6IG51bWJlcik6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2NrSGFzaChoZWlnaHQpO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwib25fZ2V0X2Jsb2NrX2hhc2hcIiwgW2hlaWdodF0pKS5yZXN1bHQ7ICAvLyBUT0RPIG1vbmVyby13YWxsZXQtcnBjOiBubyBzdGF0dXMgcmV0dXJuZWRcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tUZW1wbGF0ZSh3YWxsZXRBZGRyZXNzOiBzdHJpbmcsIHJlc2VydmVTaXplPzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9CbG9ja1RlbXBsYXRlPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2NrVGVtcGxhdGUod2FsbGV0QWRkcmVzcywgcmVzZXJ2ZVNpemUpO1xuICAgIGFzc2VydCh3YWxsZXRBZGRyZXNzICYmIHR5cGVvZiB3YWxsZXRBZGRyZXNzID09PSBcInN0cmluZ1wiLCBcIk11c3Qgc3BlY2lmeSB3YWxsZXQgYWRkcmVzcyB0byBiZSBtaW5lZCB0b1wiKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9ibG9ja190ZW1wbGF0ZVwiLCB7d2FsbGV0X2FkZHJlc3M6IHdhbGxldEFkZHJlc3MsIHJlc2VydmVfc2l6ZTogcmVzZXJ2ZVNpemV9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQmxvY2tUZW1wbGF0ZShyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldExhc3RCbG9ja0hlYWRlcigpOiBQcm9taXNlPE1vbmVyb0Jsb2NrSGVhZGVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldExhc3RCbG9ja0hlYWRlcigpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2xhc3RfYmxvY2tfaGVhZGVyXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNCbG9ja0hlYWRlcihyZXNwLnJlc3VsdC5ibG9ja19oZWFkZXIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0hlYWRlckJ5SGFzaChibG9ja0hhc2g6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQmxvY2tIZWFkZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tIZWFkZXJCeUhhc2goYmxvY2tIYXNoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9ibG9ja19oZWFkZXJfYnlfaGFzaFwiLCB7aGFzaDogYmxvY2tIYXNofSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Jsb2NrSGVhZGVyKHJlc3AucmVzdWx0LmJsb2NrX2hlYWRlcik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrSGVhZGVyQnlIZWlnaHQoaGVpZ2h0OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb0Jsb2NrSGVhZGVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2NrSGVhZGVyQnlIZWlnaHQoaGVpZ2h0KTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9ibG9ja19oZWFkZXJfYnlfaGVpZ2h0XCIsIHtoZWlnaHQ6IGhlaWdodH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNCbG9ja0hlYWRlcihyZXNwLnJlc3VsdC5ibG9ja19oZWFkZXIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0hlYWRlcnNCeVJhbmdlKHN0YXJ0SGVpZ2h0PzogbnVtYmVyLCBlbmRIZWlnaHQ/OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb0Jsb2NrSGVhZGVyW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tIZWFkZXJzQnlSYW5nZShzdGFydEhlaWdodCwgZW5kSGVpZ2h0KTtcbiAgICBcbiAgICAvLyBmZXRjaCBibG9jayBoZWFkZXJzXG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmxvY2tfaGVhZGVyc19yYW5nZVwiLCB7XG4gICAgICBzdGFydF9oZWlnaHQ6IHN0YXJ0SGVpZ2h0LFxuICAgICAgZW5kX2hlaWdodDogZW5kSGVpZ2h0XG4gICAgfSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIFxuICAgIC8vIGJ1aWxkIGhlYWRlcnNcbiAgICBsZXQgaGVhZGVycyA9IFtdO1xuICAgIGZvciAobGV0IHJwY0hlYWRlciBvZiByZXNwLnJlc3VsdC5oZWFkZXJzKSB7XG4gICAgICBoZWFkZXJzLnB1c2goTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNCbG9ja0hlYWRlcihycGNIZWFkZXIpKTtcbiAgICB9XG4gICAgcmV0dXJuIGhlYWRlcnM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrQnlIYXNoKGJsb2NrSGFzaDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9CbG9jaz4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRCbG9ja0J5SGFzaChibG9ja0hhc2gpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2Jsb2NrXCIsIHtoYXNoOiBibG9ja0hhc2h9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQmxvY2socmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0J5SGVpZ2h0KGhlaWdodDogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9CbG9jaz4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRCbG9ja0J5SGVpZ2h0KGhlaWdodCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmxvY2tcIiwge2hlaWdodDogaGVpZ2h0fSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Jsb2NrKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tzQnlIZWlnaHQoaGVpZ2h0czogbnVtYmVyW10pOiBQcm9taXNlPE1vbmVyb0Jsb2NrW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tzQnlIZWlnaHQoaGVpZ2h0cyk7XG4gICAgXG4gICAgLy8gZmV0Y2ggYmxvY2tzIGluIGJpbmFyeVxuICAgIGxldCByZXNwQmluID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEJpbmFyeVJlcXVlc3QoXCJnZXRfYmxvY2tzX2J5X2hlaWdodC5iaW5cIiwge2hlaWdodHM6IGhlaWdodHN9KTtcbiAgICBcbiAgICAvLyBjb252ZXJ0IGJpbmFyeSBibG9ja3MgdG8ganNvblxuICAgIGxldCBycGNCbG9ja3MgPSBhd2FpdCBNb25lcm9VdGlscy5iaW5hcnlCbG9ja3NUb0pzb24ocmVzcEJpbik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocnBjQmxvY2tzKTtcbiAgICBcbiAgICAvLyBidWlsZCBibG9ja3Mgd2l0aCB0cmFuc2FjdGlvbnNcbiAgICBhc3NlcnQuZXF1YWwocnBjQmxvY2tzLnR4cy5sZW5ndGgsIHJwY0Jsb2Nrcy5ibG9ja3MubGVuZ3RoKTsgICAgXG4gICAgbGV0IGJsb2NrcyA9IFtdO1xuICAgIGZvciAobGV0IGJsb2NrSWR4ID0gMDsgYmxvY2tJZHggPCBycGNCbG9ja3MuYmxvY2tzLmxlbmd0aDsgYmxvY2tJZHgrKykge1xuICAgICAgXG4gICAgICAvLyBidWlsZCBibG9ja1xuICAgICAgbGV0IGJsb2NrID0gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNCbG9jayhycGNCbG9ja3MuYmxvY2tzW2Jsb2NrSWR4XSk7XG4gICAgICBibG9jay5zZXRIZWlnaHQoaGVpZ2h0c1tibG9ja0lkeF0pO1xuICAgICAgYmxvY2tzLnB1c2goYmxvY2spO1xuICAgICAgXG4gICAgICAvLyBidWlsZCB0cmFuc2FjdGlvbnNcbiAgICAgIGxldCB0eHMgPSBbXTtcbiAgICAgIGZvciAobGV0IHR4SWR4ID0gMDsgdHhJZHggPCBycGNCbG9ja3MudHhzW2Jsb2NrSWR4XS5sZW5ndGg7IHR4SWR4KyspIHtcbiAgICAgICAgbGV0IHR4ID0gbmV3IE1vbmVyb1R4KCk7XG4gICAgICAgIHR4cy5wdXNoKHR4KTtcbiAgICAgICAgdHguc2V0SGFzaChycGNCbG9ja3MuYmxvY2tzW2Jsb2NrSWR4XS50eF9oYXNoZXNbdHhJZHhdKTtcbiAgICAgICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICAgICAgdHguc2V0UmVsYXkodHJ1ZSk7XG4gICAgICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgICAgICB0eC5zZXRJc0RvdWJsZVNwZW5kU2VlbihmYWxzZSk7XG4gICAgICAgIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVHgocnBjQmxvY2tzLnR4c1tibG9ja0lkeF1bdHhJZHhdLCB0eCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIG1lcmdlIGludG8gb25lIGJsb2NrXG4gICAgICBibG9jay5zZXRUeHMoW10pO1xuICAgICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICAgIGlmICh0eC5nZXRCbG9jaygpKSBibG9jay5tZXJnZSh0eC5nZXRCbG9jaygpKTtcbiAgICAgICAgZWxzZSBibG9jay5nZXRUeHMoKS5wdXNoKHR4LnNldEJsb2NrKGJsb2NrKSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBibG9ja3M7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2Nrc0J5UmFuZ2Uoc3RhcnRIZWlnaHQ/OiBudW1iZXIsIGVuZEhlaWdodD86IG51bWJlcik6IFByb21pc2U8TW9uZXJvQmxvY2tbXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRCbG9ja3NCeVJhbmdlKHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpO1xuICAgIGlmIChzdGFydEhlaWdodCA9PT0gdW5kZWZpbmVkKSBzdGFydEhlaWdodCA9IDA7XG4gICAgaWYgKGVuZEhlaWdodCA9PT0gdW5kZWZpbmVkKSBlbmRIZWlnaHQgPSBhd2FpdCB0aGlzLmdldEhlaWdodCgpIC0gMTtcbiAgICBsZXQgaGVpZ2h0cyA9IFtdO1xuICAgIGZvciAobGV0IGhlaWdodCA9IHN0YXJ0SGVpZ2h0OyBoZWlnaHQgPD0gZW5kSGVpZ2h0OyBoZWlnaHQrKykgaGVpZ2h0cy5wdXNoKGhlaWdodCk7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZ2V0QmxvY2tzQnlIZWlnaHQoaGVpZ2h0cyk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2Nrc0J5UmFuZ2VDaHVua2VkKHN0YXJ0SGVpZ2h0PzogbnVtYmVyLCBlbmRIZWlnaHQ/OiBudW1iZXIsIG1heENodW5rU2l6ZT86IG51bWJlcik6IFByb21pc2U8TW9uZXJvQmxvY2tbXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRCbG9ja3NCeVJhbmdlQ2h1bmtlZChzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBtYXhDaHVua1NpemUpO1xuICAgIGlmIChzdGFydEhlaWdodCA9PT0gdW5kZWZpbmVkKSBzdGFydEhlaWdodCA9IDA7XG4gICAgaWYgKGVuZEhlaWdodCA9PT0gdW5kZWZpbmVkKSBlbmRIZWlnaHQgPSBhd2FpdCB0aGlzLmdldEhlaWdodCgpIC0gMTtcbiAgICBsZXQgbGFzdEhlaWdodCA9IHN0YXJ0SGVpZ2h0IC0gMTtcbiAgICBsZXQgYmxvY2tzID0gW107XG4gICAgd2hpbGUgKGxhc3RIZWlnaHQgPCBlbmRIZWlnaHQpIHtcbiAgICAgIGZvciAobGV0IGJsb2NrIG9mIGF3YWl0IHRoaXMuZ2V0TWF4QmxvY2tzKGxhc3RIZWlnaHQgKyAxLCBlbmRIZWlnaHQsIG1heENodW5rU2l6ZSkpIHtcbiAgICAgICAgYmxvY2tzLnB1c2goYmxvY2spO1xuICAgICAgfVxuICAgICAgbGFzdEhlaWdodCA9IGJsb2Nrc1tibG9ja3MubGVuZ3RoIC0gMV0uZ2V0SGVpZ2h0KCk7XG4gICAgfVxuICAgIHJldHVybiBibG9ja3M7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4cyh0eEhhc2hlczogc3RyaW5nW10sIHBydW5lID0gZmFsc2UpOiBQcm9taXNlPE1vbmVyb1R4W10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0VHhzKHR4SGFzaGVzLCBwcnVuZSk7XG4gICAgICAgIFxuICAgIC8vIHZhbGlkYXRlIGlucHV0XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkodHhIYXNoZXMpICYmIHR4SGFzaGVzLmxlbmd0aCA+IDAsIFwiTXVzdCBwcm92aWRlIGFuIGFycmF5IG9mIHRyYW5zYWN0aW9uIGhhc2hlc1wiKTtcbiAgICBhc3NlcnQocHJ1bmUgPT09IHVuZGVmaW5lZCB8fCB0eXBlb2YgcHJ1bmUgPT09IFwiYm9vbGVhblwiLCBcIlBydW5lIG11c3QgYmUgYSBib29sZWFuIG9yIHVuZGVmaW5lZFwiKTtcbiAgICAgICAgXG4gICAgLy8gZmV0Y2ggdHJhbnNhY3Rpb25zXG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJnZXRfdHJhbnNhY3Rpb25zXCIsIHtcbiAgICAgIHR4c19oYXNoZXM6IHR4SGFzaGVzLFxuICAgICAgZGVjb2RlX2FzX2pzb246IHRydWUsXG4gICAgICBwcnVuZTogcHJ1bmVcbiAgICB9KTtcbiAgICB0cnkge1xuICAgICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZS5tZXNzYWdlLmluZGV4T2YoXCJGYWlsZWQgdG8gcGFyc2UgaGV4IHJlcHJlc2VudGF0aW9uIG9mIHRyYW5zYWN0aW9uIGhhc2hcIikgPj0gMCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiSW52YWxpZCB0cmFuc2FjdGlvbiBoYXNoXCIpO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gICAgICAgIFxuICAgIC8vIGJ1aWxkIHRyYW5zYWN0aW9uIG1vZGVsc1xuICAgIGxldCB0eHMgPSBbXTtcbiAgICBpZiAocmVzcC50eHMpIHtcbiAgICAgIGZvciAobGV0IHR4SWR4ID0gMDsgdHhJZHggPCByZXNwLnR4cy5sZW5ndGg7IHR4SWR4KyspIHtcbiAgICAgICAgbGV0IHR4ID0gbmV3IE1vbmVyb1R4KCk7XG4gICAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgICAgIHR4cy5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVHgocmVzcC50eHNbdHhJZHhdLCB0eCkpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdHhzO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeEhleGVzKHR4SGFzaGVzOiBzdHJpbmdbXSwgcHJ1bmUgPSBmYWxzZSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0VHhIZXhlcyh0eEhhc2hlcywgcHJ1bmUpO1xuICAgIGxldCBoZXhlcyA9IFtdO1xuICAgIGZvciAobGV0IHR4IG9mIGF3YWl0IHRoaXMuZ2V0VHhzKHR4SGFzaGVzLCBwcnVuZSkpIGhleGVzLnB1c2gocHJ1bmUgPyB0eC5nZXRQcnVuZWRIZXgoKSA6IHR4LmdldEZ1bGxIZXgoKSk7XG4gICAgcmV0dXJuIGhleGVzO1xuICB9XG4gIFxuICBhc3luYyBnZXRNaW5lclR4U3VtKGhlaWdodDogbnVtYmVyLCBudW1CbG9ja3M6IG51bWJlcik6IFByb21pc2U8TW9uZXJvTWluZXJUeFN1bT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRNaW5lclR4U3VtKGhlaWdodCwgbnVtQmxvY2tzKTtcbiAgICBpZiAoaGVpZ2h0ID09PSB1bmRlZmluZWQpIGhlaWdodCA9IDA7XG4gICAgZWxzZSBhc3NlcnQoaGVpZ2h0ID49IDAsIFwiSGVpZ2h0IG11c3QgYmUgYW4gaW50ZWdlciA+PSAwXCIpO1xuICAgIGlmIChudW1CbG9ja3MgPT09IHVuZGVmaW5lZCkgbnVtQmxvY2tzID0gYXdhaXQgdGhpcy5nZXRIZWlnaHQoKTtcbiAgICBlbHNlIGFzc2VydChudW1CbG9ja3MgPj0gMCwgXCJDb3VudCBtdXN0IGJlIGFuIGludGVnZXIgPj0gMFwiKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9jb2luYmFzZV90eF9zdW1cIiwge2hlaWdodDogaGVpZ2h0LCBjb3VudDogbnVtQmxvY2tzfSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIGxldCB0eFN1bSA9IG5ldyBNb25lcm9NaW5lclR4U3VtKCk7XG4gICAgdHhTdW0uc2V0RW1pc3Npb25TdW0oQmlnSW50KHJlc3AucmVzdWx0LmVtaXNzaW9uX2Ftb3VudCkpO1xuICAgIHR4U3VtLnNldEZlZVN1bShCaWdJbnQocmVzcC5yZXN1bHQuZmVlX2Ftb3VudCkpO1xuICAgIHJldHVybiB0eFN1bTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RmVlRXN0aW1hdGUoZ3JhY2VCbG9ja3M/OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb0ZlZUVzdGltYXRlPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEZlZUVzdGltYXRlKGdyYWNlQmxvY2tzKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9mZWVfZXN0aW1hdGVcIiwge2dyYWNlX2Jsb2NrczogZ3JhY2VCbG9ja3N9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgbGV0IGZlZUVzdGltYXRlID0gbmV3IE1vbmVyb0ZlZUVzdGltYXRlKCk7XG4gICAgZmVlRXN0aW1hdGUuc2V0RmVlKEJpZ0ludChyZXNwLnJlc3VsdC5mZWUpKTtcbiAgICBsZXQgZmVlcyA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVzcC5yZXN1bHQuZmVlcy5sZW5ndGg7IGkrKykgZmVlcy5wdXNoKEJpZ0ludChyZXNwLnJlc3VsdC5mZWVzW2ldKSk7XG4gICAgZmVlRXN0aW1hdGUuc2V0RmVlcyhmZWVzKTtcbiAgICBmZWVFc3RpbWF0ZS5zZXRRdWFudGl6YXRpb25NYXNrKEJpZ0ludChyZXNwLnJlc3VsdC5xdWFudGl6YXRpb25fbWFzaykpO1xuICAgIHJldHVybiBmZWVFc3RpbWF0ZTtcbiAgfVxuICBcbiAgYXN5bmMgc3VibWl0VHhIZXgodHhIZXg6IHN0cmluZywgZG9Ob3RSZWxheTogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvU3VibWl0VHhSZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc3VibWl0VHhIZXgodHhIZXgsIGRvTm90UmVsYXkpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwic2VuZF9yYXdfdHJhbnNhY3Rpb25cIiwge3R4X2FzX2hleDogdHhIZXgsIGRvX25vdF9yZWxheTogZG9Ob3RSZWxheX0pO1xuICAgIGxldCByZXN1bHQgPSBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1N1Ym1pdFR4UmVzdWx0KHJlc3ApO1xuICAgIFxuICAgIC8vIHNldCBpc0dvb2QgYmFzZWQgb24gc3RhdHVzXG4gICAgdHJ5IHtcbiAgICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApOyBcbiAgICAgIHJlc3VsdC5zZXRJc0dvb2QodHJ1ZSk7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICByZXN1bHQuc2V0SXNHb29kKGZhbHNlKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBcbiAgYXN5bmMgcmVsYXlUeHNCeUhhc2godHhIYXNoZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnJlbGF5VHhzQnlIYXNoKHR4SGFzaGVzKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInJlbGF5X3R4XCIsIHt0eGlkczogdHhIYXNoZXN9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4UG9vbCgpOiBQcm9taXNlPE1vbmVyb1R4W10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0VHhQb29sKCk7XG4gICAgXG4gICAgLy8gc2VuZCBycGMgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwiZ2V0X3RyYW5zYWN0aW9uX3Bvb2xcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgXG4gICAgLy8gYnVpbGQgdHhzXG4gICAgbGV0IHR4cyA9IFtdO1xuICAgIGlmIChyZXNwLnRyYW5zYWN0aW9ucykge1xuICAgICAgZm9yIChsZXQgcnBjVHggb2YgcmVzcC50cmFuc2FjdGlvbnMpIHtcbiAgICAgICAgbGV0IHR4ID0gbmV3IE1vbmVyb1R4KCk7XG4gICAgICAgIHR4cy5wdXNoKHR4KTtcbiAgICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgICAgICB0eC5zZXRJblR4UG9vbCh0cnVlKTtcbiAgICAgICAgdHguc2V0TnVtQ29uZmlybWF0aW9ucygwKTtcbiAgICAgICAgTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNUeChycGNUeCwgdHgpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdHhzO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFBvb2xIYXNoZXMoKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuICBcbiAgLy8gYXN5bmMgZ2V0VHhQb29sQmFja2xvZygpOiBQcm9taXNlPE1vbmVyb1R4QmFja2xvZ0VudHJ5W10+IHtcbiAgLy8gICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIC8vIH1cblxuICBhc3luYyBnZXRUeFBvb2xTdGF0cygpOiBQcm9taXNlPE1vbmVyb1R4UG9vbFN0YXRzPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFR4UG9vbFN0YXRzKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJnZXRfdHJhbnNhY3Rpb25fcG9vbF9zdGF0c1wiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNUeFBvb2xTdGF0cyhyZXNwLnBvb2xfc3RhdHMpO1xuICB9XG4gIFxuICBhc3luYyBmbHVzaFR4UG9vbChoYXNoZXM/OiBzdHJpbmcgfCBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5mbHVzaFR4UG9vbChoYXNoZXMpO1xuICAgIGlmIChoYXNoZXMpIGhhc2hlcyA9IEdlblV0aWxzLmxpc3RpZnkoaGFzaGVzKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImZsdXNoX3R4cG9vbFwiLCB7dHhpZHM6IGhhc2hlc30pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzKGtleUltYWdlczogc3RyaW5nW10pOiBQcm9taXNlPE1vbmVyb0tleUltYWdlU3BlbnRTdGF0dXNbXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRLZXlJbWFnZVNwZW50U3RhdHVzZXMoa2V5SW1hZ2VzKTtcbiAgICBpZiAoa2V5SW1hZ2VzID09PSB1bmRlZmluZWQgfHwga2V5SW1hZ2VzLmxlbmd0aCA9PT0gMCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGtleSBpbWFnZXMgdG8gY2hlY2sgdGhlIHN0YXR1cyBvZlwiKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImlzX2tleV9pbWFnZV9zcGVudFwiLCB7a2V5X2ltYWdlczoga2V5SW1hZ2VzfSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgcmV0dXJuIHJlc3Auc3BlbnRfc3RhdHVzO1xuICB9XG4gIFxuICBhc3luYyBnZXRPdXRwdXRIaXN0b2dyYW0oYW1vdW50cz86IGJpZ2ludFtdLCBtaW5Db3VudD86IG51bWJlciwgbWF4Q291bnQ/OiBudW1iZXIsIGlzVW5sb2NrZWQ/OiBib29sZWFuLCByZWNlbnRDdXRvZmY/OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb091dHB1dEhpc3RvZ3JhbUVudHJ5W10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0T3V0cHV0SGlzdG9ncmFtKGFtb3VudHMsIG1pbkNvdW50LCBtYXhDb3VudCwgaXNVbmxvY2tlZCwgcmVjZW50Q3V0b2ZmKTtcbiAgICBcbiAgICAvLyBzZW5kIHJwYyByZXF1ZXN0XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfb3V0cHV0X2hpc3RvZ3JhbVwiLCB7XG4gICAgICBhbW91bnRzOiBhbW91bnRzLFxuICAgICAgbWluX2NvdW50OiBtaW5Db3VudCxcbiAgICAgIG1heF9jb3VudDogbWF4Q291bnQsXG4gICAgICB1bmxvY2tlZDogaXNVbmxvY2tlZCxcbiAgICAgIHJlY2VudF9jdXRvZmY6IHJlY2VudEN1dG9mZlxuICAgIH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICBcbiAgICAvLyBidWlsZCBoaXN0b2dyYW0gZW50cmllcyBmcm9tIHJlc3BvbnNlXG4gICAgbGV0IGVudHJpZXMgPSBbXTtcbiAgICBpZiAoIXJlc3AucmVzdWx0Lmhpc3RvZ3JhbSkgcmV0dXJuIGVudHJpZXM7XG4gICAgZm9yIChsZXQgcnBjRW50cnkgb2YgcmVzcC5yZXN1bHQuaGlzdG9ncmFtKSB7XG4gICAgICBlbnRyaWVzLnB1c2goTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNPdXRwdXRIaXN0b2dyYW1FbnRyeShycGNFbnRyeSkpO1xuICAgIH1cbiAgICByZXR1cm4gZW50cmllcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0T3V0cHV0RGlzdHJpYnV0aW9uKGFtb3VudHMsIGN1bXVsYXRpdmUsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpIHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0T3V0cHV0RGlzdHJpYnV0aW9uKGFtb3VudHMsIGN1bXVsYXRpdmUsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpO1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZCAocmVzcG9uc2UgJ2Rpc3RyaWJ1dGlvbicgZmllbGQgaXMgYmluYXJ5KVwiKTtcbiAgICBcbi8vICAgIGxldCBhbW91bnRTdHJzID0gW107XG4vLyAgICBmb3IgKGxldCBhbW91bnQgb2YgYW1vdW50cykgYW1vdW50U3Rycy5wdXNoKGFtb3VudC50b0pTVmFsdWUoKSk7XG4vLyAgICBjb25zb2xlLmxvZyhhbW91bnRTdHJzKTtcbi8vICAgIGNvbnNvbGUubG9nKGN1bXVsYXRpdmUpO1xuLy8gICAgY29uc29sZS5sb2coc3RhcnRIZWlnaHQpO1xuLy8gICAgY29uc29sZS5sb2coZW5kSGVpZ2h0KTtcbi8vICAgIFxuLy8gICAgLy8gc2VuZCBycGMgcmVxdWVzdFxuLy8gICAgY29uc29sZS5sb2coXCIqKioqKioqKioqKiBTRU5ESU5HIFJFUVVFU1QgKioqKioqKioqKioqKlwiKTtcbi8vICAgIGlmIChzdGFydEhlaWdodCA9PT0gdW5kZWZpbmVkKSBzdGFydEhlaWdodCA9IDA7XG4vLyAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9vdXRwdXRfZGlzdHJpYnV0aW9uXCIsIHtcbi8vICAgICAgYW1vdW50czogYW1vdW50U3Rycyxcbi8vICAgICAgY3VtdWxhdGl2ZTogY3VtdWxhdGl2ZSxcbi8vICAgICAgZnJvbV9oZWlnaHQ6IHN0YXJ0SGVpZ2h0LFxuLy8gICAgICB0b19oZWlnaHQ6IGVuZEhlaWdodFxuLy8gICAgfSk7XG4vLyAgICBcbi8vICAgIGNvbnNvbGUubG9nKFwiUkVTUE9OU0VcIik7XG4vLyAgICBjb25zb2xlLmxvZyhyZXNwKTtcbi8vICAgIFxuLy8gICAgLy8gYnVpbGQgZGlzdHJpYnV0aW9uIGVudHJpZXMgZnJvbSByZXNwb25zZVxuLy8gICAgbGV0IGVudHJpZXMgPSBbXTtcbi8vICAgIGlmICghcmVzcC5yZXN1bHQuZGlzdHJpYnV0aW9ucykgcmV0dXJuIGVudHJpZXM7IFxuLy8gICAgZm9yIChsZXQgcnBjRW50cnkgb2YgcmVzcC5yZXN1bHQuZGlzdHJpYnV0aW9ucykge1xuLy8gICAgICBsZXQgZW50cnkgPSBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY091dHB1dERpc3RyaWJ1dGlvbkVudHJ5KHJwY0VudHJ5KTtcbi8vICAgICAgZW50cmllcy5wdXNoKGVudHJ5KTtcbi8vICAgIH1cbi8vICAgIHJldHVybiBlbnRyaWVzO1xuICB9XG4gIFxuICBhc3luYyBnZXRJbmZvKCk6IFByb21pc2U8TW9uZXJvRGFlbW9uSW5mbz4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRJbmZvKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfaW5mb1wiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjSW5mbyhyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFN5bmNJbmZvKCk6IFByb21pc2U8TW9uZXJvRGFlbW9uU3luY0luZm8+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0U3luY0luZm8oKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN5bmNfaW5mb1wiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjU3luY0luZm8ocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBnZXRIYXJkRm9ya0luZm8oKTogUHJvbWlzZTxNb25lcm9IYXJkRm9ya0luZm8+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0SGFyZEZvcmtJbmZvKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJoYXJkX2ZvcmtfaW5mb1wiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjSGFyZEZvcmtJbmZvKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWx0Q2hhaW5zKCk6IFByb21pc2U8TW9uZXJvQWx0Q2hhaW5bXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRBbHRDaGFpbnMoKTtcbiAgICBcbi8vICAgIC8vIG1vY2tlZCByZXNwb25zZSBmb3IgdGVzdFxuLy8gICAgbGV0IHJlc3AgPSB7XG4vLyAgICAgICAgc3RhdHVzOiBcIk9LXCIsXG4vLyAgICAgICAgY2hhaW5zOiBbXG4vLyAgICAgICAgICB7XG4vLyAgICAgICAgICAgIGJsb2NrX2hhc2g6IFwiNjk3Y2YwM2M4OWE5YjExOGY3YmRmMTFiMWIzYTZhMDI4ZDdiMzYxN2QyZDBlZDkxMzIyYzU3MDlhY2Y3NTYyNVwiLFxuLy8gICAgICAgICAgICBkaWZmaWN1bHR5OiAxNDExNDcyOTYzODMwMDI4MCxcbi8vICAgICAgICAgICAgaGVpZ2h0OiAxNTYyMDYyLFxuLy8gICAgICAgICAgICBsZW5ndGg6IDJcbi8vICAgICAgICAgIH1cbi8vICAgICAgICBdXG4vLyAgICB9XG4gICAgXG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYWx0ZXJuYXRlX2NoYWluc1wiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgbGV0IGNoYWlucyA9IFtdO1xuICAgIGlmICghcmVzcC5yZXN1bHQuY2hhaW5zKSByZXR1cm4gY2hhaW5zO1xuICAgIGZvciAobGV0IHJwY0NoYWluIG9mIHJlc3AucmVzdWx0LmNoYWlucykgY2hhaW5zLnB1c2goTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNBbHRDaGFpbihycGNDaGFpbikpO1xuICAgIHJldHVybiBjaGFpbnM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFsdEJsb2NrSGFzaGVzKCk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QWx0QmxvY2tIYXNoZXMoKTtcbiAgICBcbi8vICAgIC8vIG1vY2tlZCByZXNwb25zZSBmb3IgdGVzdFxuLy8gICAgbGV0IHJlc3AgPSB7XG4vLyAgICAgICAgc3RhdHVzOiBcIk9LXCIsXG4vLyAgICAgICAgdW50cnVzdGVkOiBmYWxzZSxcbi8vICAgICAgICBibGtzX2hhc2hlczogW1wiOWMyMjc3YzU0NzAyMzRiZThiMzIzODJjZGY4MDk0YTEwM2FiYTRmY2Q1ZTg3NWE2ZmMxNTlkYzJlYzAwZTAxMVwiLFwiNjM3YzBlMGYwNTU4ZTI4NDQ5M2YzOGE1ZmNjYTM2MTVkYjU5NDU4ZDkwZDNhNWVmZjBhMThmZjU5YjgzZjQ2ZlwiLFwiNmYzYWRjMTc0YTJlODA4MjgxOWViYjk2NWM5NmEwOTVlM2U4YjYzOTI5YWQ5YmUyZDcwNWFkOWMwODZhNmIxY1wiLFwiNjk3Y2YwM2M4OWE5YjExOGY3YmRmMTFiMWIzYTZhMDI4ZDdiMzYxN2QyZDBlZDkxMzIyYzU3MDlhY2Y3NTYyNVwiXVxuLy8gICAgfVxuICAgIFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwiZ2V0X2FsdF9ibG9ja3NfaGFzaGVzXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIGlmICghcmVzcC5ibGtzX2hhc2hlcykgcmV0dXJuIFtdO1xuICAgIHJldHVybiByZXNwLmJsa3NfaGFzaGVzO1xuICB9XG4gIFxuICBhc3luYyBnZXREb3dubG9hZExpbWl0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldERvd25sb2FkTGltaXQoKTtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuZ2V0QmFuZHdpZHRoTGltaXRzKCkpWzBdO1xuICB9XG4gIFxuICBhc3luYyBzZXREb3dubG9hZExpbWl0KGxpbWl0OiBudW1iZXIpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5zZXREb3dubG9hZExpbWl0KGxpbWl0KTtcbiAgICBpZiAobGltaXQgPT0gLTEpIHJldHVybiBhd2FpdCB0aGlzLnJlc2V0RG93bmxvYWRMaW1pdCgpO1xuICAgIGlmICghKEdlblV0aWxzLmlzSW50KGxpbWl0KSAmJiBsaW1pdCA+IDApKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJEb3dubG9hZCBsaW1pdCBtdXN0IGJlIGFuIGludGVnZXIgZ3JlYXRlciB0aGFuIDBcIik7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLnNldEJhbmR3aWR0aExpbWl0cyhsaW1pdCwgMCkpWzBdO1xuICB9XG4gIFxuICBhc3luYyByZXNldERvd25sb2FkTGltaXQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24ucmVzZXREb3dubG9hZExpbWl0KCk7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLnNldEJhbmR3aWR0aExpbWl0cygtMSwgMCkpWzBdO1xuICB9XG5cbiAgYXN5bmMgZ2V0VXBsb2FkTGltaXQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0VXBsb2FkTGltaXQoKTtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuZ2V0QmFuZHdpZHRoTGltaXRzKCkpWzFdO1xuICB9XG4gIFxuICBhc3luYyBzZXRVcGxvYWRMaW1pdChsaW1pdDogbnVtYmVyKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc2V0VXBsb2FkTGltaXQobGltaXQpO1xuICAgIGlmIChsaW1pdCA9PSAtMSkgcmV0dXJuIGF3YWl0IHRoaXMucmVzZXRVcGxvYWRMaW1pdCgpO1xuICAgIGlmICghKEdlblV0aWxzLmlzSW50KGxpbWl0KSAmJiBsaW1pdCA+IDApKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJVcGxvYWQgbGltaXQgbXVzdCBiZSBhbiBpbnRlZ2VyIGdyZWF0ZXIgdGhhbiAwXCIpO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5zZXRCYW5kd2lkdGhMaW1pdHMoMCwgbGltaXQpKVsxXTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzZXRVcGxvYWRMaW1pdCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5yZXNldFVwbG9hZExpbWl0KCk7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLnNldEJhbmR3aWR0aExpbWl0cygwLCAtMSkpWzFdO1xuICB9XG4gIFxuICBhc3luYyBnZXRQZWVycygpOiBQcm9taXNlPE1vbmVyb1BlZXJbXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRQZWVycygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2Nvbm5lY3Rpb25zXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICBsZXQgcGVlcnMgPSBbXTtcbiAgICBpZiAoIXJlc3AucmVzdWx0LmNvbm5lY3Rpb25zKSByZXR1cm4gcGVlcnM7XG4gICAgZm9yIChsZXQgcnBjQ29ubmVjdGlvbiBvZiByZXNwLnJlc3VsdC5jb25uZWN0aW9ucykge1xuICAgICAgcGVlcnMucHVzaChNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Nvbm5lY3Rpb24ocnBjQ29ubmVjdGlvbikpO1xuICAgIH1cbiAgICByZXR1cm4gcGVlcnM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEtub3duUGVlcnMoKTogUHJvbWlzZTxNb25lcm9QZWVyW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0S25vd25QZWVycygpO1xuICAgIFxuICAgIC8vIHR4IGNvbmZpZ1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwiZ2V0X3BlZXJfbGlzdFwiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICBcbiAgICAvLyBidWlsZCBwZWVyc1xuICAgIGxldCBwZWVycyA9IFtdO1xuICAgIGlmIChyZXNwLmdyYXlfbGlzdCkge1xuICAgICAgZm9yIChsZXQgcnBjUGVlciBvZiByZXNwLmdyYXlfbGlzdCkge1xuICAgICAgICBsZXQgcGVlciA9IE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjUGVlcihycGNQZWVyKTtcbiAgICAgICAgcGVlci5zZXRJc09ubGluZShmYWxzZSk7IC8vIGdyYXkgbGlzdCBtZWFucyBvZmZsaW5lIGxhc3QgY2hlY2tlZFxuICAgICAgICBwZWVycy5wdXNoKHBlZXIpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAocmVzcC53aGl0ZV9saXN0KSB7XG4gICAgICBmb3IgKGxldCBycGNQZWVyIG9mIHJlc3Aud2hpdGVfbGlzdCkge1xuICAgICAgICBsZXQgcGVlciA9IE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjUGVlcihycGNQZWVyKTtcbiAgICAgICAgcGVlci5zZXRJc09ubGluZSh0cnVlKTsgLy8gd2hpdGUgbGlzdCBtZWFucyBvbmxpbmUgbGFzdCBjaGVja2VkXG4gICAgICAgIHBlZXJzLnB1c2gocGVlcik7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwZWVycztcbiAgfVxuICBcbiAgYXN5bmMgc2V0T3V0Z29pbmdQZWVyTGltaXQobGltaXQ6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5zZXRPdXRnb2luZ1BlZXJMaW1pdChsaW1pdCk7XG4gICAgaWYgKCEoR2VuVXRpbHMuaXNJbnQobGltaXQpICYmIGxpbWl0ID49IDApKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJPdXRnb2luZyBwZWVyIGxpbWl0IG11c3QgYmUgPj0gMFwiKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcIm91dF9wZWVyc1wiLCB7b3V0X3BlZXJzOiBsaW1pdH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICB9XG4gIFxuICBhc3luYyBzZXRJbmNvbWluZ1BlZXJMaW1pdChsaW1pdDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnNldEluY29taW5nUGVlckxpbWl0KGxpbWl0KTtcbiAgICBpZiAoIShHZW5VdGlscy5pc0ludChsaW1pdCkgJiYgbGltaXQgPj0gMCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkluY29taW5nIHBlZXIgbGltaXQgbXVzdCBiZSA+PSAwXCIpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwiaW5fcGVlcnNcIiwge2luX3BlZXJzOiBsaW1pdH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICB9XG4gIFxuICBhc3luYyBnZXRQZWVyQmFucygpOiBQcm9taXNlPE1vbmVyb0JhbltdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFBlZXJCYW5zKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmFuc1wiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgbGV0IGJhbnMgPSBbXTtcbiAgICBmb3IgKGxldCBycGNCYW4gb2YgcmVzcC5yZXN1bHQuYmFucykge1xuICAgICAgbGV0IGJhbiA9IG5ldyBNb25lcm9CYW4oKTtcbiAgICAgIGJhbi5zZXRIb3N0KHJwY0Jhbi5ob3N0KTtcbiAgICAgIGJhbi5zZXRJcChycGNCYW4uaXApO1xuICAgICAgYmFuLnNldFNlY29uZHMocnBjQmFuLnNlY29uZHMpO1xuICAgICAgYmFucy5wdXNoKGJhbik7XG4gICAgfVxuICAgIHJldHVybiBiYW5zO1xuICB9XG4gIFxuICBhc3luYyBzZXRQZWVyQmFucyhiYW5zOiBNb25lcm9CYW5bXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5zZXRQZWVyQmFucyhiYW5zKTtcbiAgICBsZXQgcnBjQmFucyA9IFtdO1xuICAgIGZvciAobGV0IGJhbiBvZiBiYW5zKSBycGNCYW5zLnB1c2goTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRUb1JwY0JhbihiYW4pKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNldF9iYW5zXCIsIHtiYW5zOiBycGNCYW5zfSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBzdGFydE1pbmluZyhhZGRyZXNzOiBzdHJpbmcsIG51bVRocmVhZHM/OiBudW1iZXIsIGlzQmFja2dyb3VuZD86IGJvb2xlYW4sIGlnbm9yZUJhdHRlcnk/OiBib29sZWFuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnN0YXJ0TWluaW5nKGFkZHJlc3MsIG51bVRocmVhZHMsIGlzQmFja2dyb3VuZCwgaWdub3JlQmF0dGVyeSk7XG4gICAgYXNzZXJ0KGFkZHJlc3MsIFwiTXVzdCBwcm92aWRlIGFkZHJlc3MgdG8gbWluZSB0b1wiKTtcbiAgICBhc3NlcnQoR2VuVXRpbHMuaXNJbnQobnVtVGhyZWFkcykgJiYgbnVtVGhyZWFkcyA+IDAsIFwiTnVtYmVyIG9mIHRocmVhZHMgbXVzdCBiZSBhbiBpbnRlZ2VyIGdyZWF0ZXIgdGhhbiAwXCIpO1xuICAgIGFzc2VydChpc0JhY2tncm91bmQgPT09IHVuZGVmaW5lZCB8fCB0eXBlb2YgaXNCYWNrZ3JvdW5kID09PSBcImJvb2xlYW5cIik7XG4gICAgYXNzZXJ0KGlnbm9yZUJhdHRlcnkgPT09IHVuZGVmaW5lZCB8fCB0eXBlb2YgaWdub3JlQmF0dGVyeSA9PT0gXCJib29sZWFuXCIpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwic3RhcnRfbWluaW5nXCIsIHtcbiAgICAgIG1pbmVyX2FkZHJlc3M6IGFkZHJlc3MsXG4gICAgICB0aHJlYWRzX2NvdW50OiBudW1UaHJlYWRzLFxuICAgICAgZG9fYmFja2dyb3VuZF9taW5pbmc6IGlzQmFja2dyb3VuZCxcbiAgICAgIGlnbm9yZV9iYXR0ZXJ5OiBpZ25vcmVCYXR0ZXJ5LFxuICAgIH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICB9XG4gIFxuICBhc3luYyBzdG9wTWluaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5zdG9wTWluaW5nKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJzdG9wX21pbmluZ1wiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TWluaW5nU3RhdHVzKCk6IFByb21pc2U8TW9uZXJvTWluaW5nU3RhdHVzPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldE1pbmluZ1N0YXR1cygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwibWluaW5nX3N0YXR1c1wiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNNaW5pbmdTdGF0dXMocmVzcCk7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdEJsb2NrcyhibG9ja0Jsb2JzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5zdWJtaXRCbG9ja3MoKTtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheShibG9ja0Jsb2JzKSAmJiBibG9ja0Jsb2JzLmxlbmd0aCA+IDAsIFwiTXVzdCBwcm92aWRlIGFuIGFycmF5IG9mIG1pbmVkIGJsb2NrIGJsb2JzIHRvIHN1Ym1pdFwiKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN1Ym1pdF9ibG9ja1wiLCBibG9ja0Jsb2JzKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gIH1cblxuICBhc3luYyBwcnVuZUJsb2NrY2hhaW4oY2hlY2s6IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb1BydW5lUmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnBydW5lQmxvY2tjaGFpbigpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicHJ1bmVfYmxvY2tjaGFpblwiLCB7Y2hlY2s6IGNoZWNrfSwgMCk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIGxldCByZXN1bHQgPSBuZXcgTW9uZXJvUHJ1bmVSZXN1bHQoKTtcbiAgICByZXN1bHQuc2V0SXNQcnVuZWQocmVzcC5yZXN1bHQucHJ1bmVkKTtcbiAgICByZXN1bHQuc2V0UHJ1bmluZ1NlZWQocmVzcC5yZXN1bHQucHJ1bmluZ19zZWVkKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIFxuICBhc3luYyBjaGVja0ZvclVwZGF0ZSgpOiBQcm9taXNlPE1vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmNoZWNrRm9yVXBkYXRlKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJ1cGRhdGVcIiwge2NvbW1hbmQ6IFwiY2hlY2tcIn0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1VwZGF0ZUNoZWNrUmVzdWx0KHJlc3ApO1xuICB9XG4gIFxuICBhc3luYyBkb3dubG9hZFVwZGF0ZShwYXRoPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5kb3dubG9hZFVwZGF0ZShwYXRoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcInVwZGF0ZVwiLCB7Y29tbWFuZDogXCJkb3dubG9hZFwiLCBwYXRoOiBwYXRofSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVXBkYXRlRG93bmxvYWRSZXN1bHQocmVzcCk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0b3AoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnN0b3AoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcInN0b3BfZGFlbW9uXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICB9XG4gIFxuICBhc3luYyB3YWl0Rm9yTmV4dEJsb2NrSGVhZGVyKCk6IFByb21pc2U8TW9uZXJvQmxvY2tIZWFkZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24ud2FpdEZvck5leHRCbG9ja0hlYWRlcigpO1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgZnVuY3Rpb24ocmVzb2x2ZSkge1xuICAgICAgYXdhaXQgdGhhdC5hZGRMaXN0ZW5lcihuZXcgY2xhc3MgZXh0ZW5kcyBNb25lcm9EYWVtb25MaXN0ZW5lciB7XG4gICAgICAgIGFzeW5jIG9uQmxvY2tIZWFkZXIoaGVhZGVyKSB7XG4gICAgICAgICAgYXdhaXQgdGhhdC5yZW1vdmVMaXN0ZW5lcih0aGlzKTtcbiAgICAgICAgICByZXNvbHZlKGhlYWRlcik7XG4gICAgICAgIH1cbiAgICAgIH0pOyBcbiAgICB9KTtcbiAgfVxuXG4gIGdldFBvbGxJbnRlcnZhbCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5wb2xsSW50ZXJ2YWw7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tIEFERCBKU0RPQyBGT1IgU1VQUE9SVEVEIERFRkFVTFQgSU1QTEVNRU5UQVRJT05TIC0tLS0tLS0tLS0tLS0tXG4gIGFzeW5jIGdldFR4KHR4SGFzaD86IHN0cmluZywgcHJ1bmUgPSBmYWxzZSk6IFByb21pc2U8TW9uZXJvVHg+IHsgcmV0dXJuIHN1cGVyLmdldFR4KHR4SGFzaCwgcHJ1bmUpOyB9O1xuICBhc3luYyBnZXRUeEhleCh0eEhhc2g6IHN0cmluZywgcHJ1bmUgPSBmYWxzZSk6IFByb21pc2U8c3RyaW5nPiB7IHJldHVybiBzdXBlci5nZXRUeEhleCh0eEhhc2gsIHBydW5lKTsgfTtcbiAgYXN5bmMgZ2V0S2V5SW1hZ2VTcGVudFN0YXR1cyhrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzPiB7IHJldHVybiBzdXBlci5nZXRLZXlJbWFnZVNwZW50U3RhdHVzKGtleUltYWdlKTsgfVxuICBhc3luYyBzZXRQZWVyQmFuKGJhbjogTW9uZXJvQmFuKTogUHJvbWlzZTx2b2lkPiB7IHJldHVybiBzdXBlci5zZXRQZWVyQmFuKGJhbik7IH1cbiAgYXN5bmMgc3VibWl0QmxvY2soYmxvY2tCbG9iOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHsgcmV0dXJuIHN1cGVyLnN1Ym1pdEJsb2NrKGJsb2NrQmxvYik7IH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUFJJVkFURSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHJvdGVjdGVkIHJlZnJlc2hMaXN0ZW5pbmcoKSB7XG4gICAgaWYgKHRoaXMucG9sbExpc3RlbmVyID09IHVuZGVmaW5lZCAmJiB0aGlzLmxpc3RlbmVycy5sZW5ndGgpIHRoaXMucG9sbExpc3RlbmVyID0gbmV3IERhZW1vblBvbGxlcih0aGlzKTtcbiAgICBpZiAodGhpcy5wb2xsTGlzdGVuZXIgIT09IHVuZGVmaW5lZCkgdGhpcy5wb2xsTGlzdGVuZXIuc2V0SXNQb2xsaW5nKHRoaXMubGlzdGVuZXJzLmxlbmd0aCA+IDApO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0QmFuZHdpZHRoTGltaXRzKCkge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwiZ2V0X2xpbWl0XCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIHJldHVybiBbcmVzcC5saW1pdF9kb3duLCByZXNwLmxpbWl0X3VwXTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIHNldEJhbmR3aWR0aExpbWl0cyhkb3duTGltaXQsIHVwTGltaXQpIHtcbiAgICBpZiAoZG93bkxpbWl0ID09PSB1bmRlZmluZWQpIGRvd25MaW1pdCA9IDA7XG4gICAgaWYgKHVwTGltaXQgPT09IHVuZGVmaW5lZCkgdXBMaW1pdCA9IDA7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJzZXRfbGltaXRcIiwge2xpbWl0X2Rvd246IGRvd25MaW1pdCwgbGltaXRfdXA6IHVwTGltaXR9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICByZXR1cm4gW3Jlc3AubGltaXRfZG93biwgcmVzcC5saW1pdF91cF07XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYSBjb250aWd1b3VzIGNodW5rIG9mIGJsb2NrcyBzdGFydGluZyBmcm9tIGEgZ2l2ZW4gaGVpZ2h0IHVwIHRvIGEgbWF4aW11bVxuICAgKiBoZWlnaHQgb3IgYW1vdW50IG9mIGJsb2NrIGRhdGEgZmV0Y2hlZCBmcm9tIHRoZSBibG9ja2NoYWluLCB3aGljaGV2ZXIgY29tZXMgZmlyc3QuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gW3N0YXJ0SGVpZ2h0XSAtIHN0YXJ0IGhlaWdodCB0byByZXRyaWV2ZSBibG9ja3MgKGRlZmF1bHQgMClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFttYXhIZWlnaHRdIC0gbWF4aW11bSBlbmQgaGVpZ2h0IHRvIHJldHJpZXZlIGJsb2NrcyAoZGVmYXVsdCBibG9ja2NoYWluIGhlaWdodClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFttYXhSZXFTaXplXSAtIG1heGltdW0gYW1vdW50IG9mIGJsb2NrIGRhdGEgdG8gZmV0Y2ggZnJvbSB0aGUgYmxvY2tjaGFpbiBpbiBieXRlcyAoZGVmYXVsdCAzLDAwMCwwMDAgYnl0ZXMpXG4gICAqIEByZXR1cm4ge01vbmVyb0Jsb2NrW119IGFyZSB0aGUgcmVzdWx0aW5nIGNodW5rIG9mIGJsb2Nrc1xuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIGdldE1heEJsb2NrcyhzdGFydEhlaWdodCwgbWF4SGVpZ2h0LCBtYXhSZXFTaXplKSB7XG4gICAgaWYgKHN0YXJ0SGVpZ2h0ID09PSB1bmRlZmluZWQpIHN0YXJ0SGVpZ2h0ID0gMDtcbiAgICBpZiAobWF4SGVpZ2h0ID09PSB1bmRlZmluZWQpIG1heEhlaWdodCA9IGF3YWl0IHRoaXMuZ2V0SGVpZ2h0KCkgLSAxO1xuICAgIGlmIChtYXhSZXFTaXplID09PSB1bmRlZmluZWQpIG1heFJlcVNpemUgPSBNb25lcm9EYWVtb25ScGMuTUFYX1JFUV9TSVpFO1xuICAgIFxuICAgIC8vIGRldGVybWluZSBlbmQgaGVpZ2h0IHRvIGZldGNoXG4gICAgbGV0IHJlcVNpemUgPSAwO1xuICAgIGxldCBlbmRIZWlnaHQgPSBzdGFydEhlaWdodCAtIDE7XG4gICAgd2hpbGUgKHJlcVNpemUgPCBtYXhSZXFTaXplICYmIGVuZEhlaWdodCA8IG1heEhlaWdodCkge1xuICAgICAgXG4gICAgICAvLyBnZXQgaGVhZGVyIG9mIG5leHQgYmxvY2tcbiAgICAgIGxldCBoZWFkZXIgPSBhd2FpdCB0aGlzLmdldEJsb2NrSGVhZGVyQnlIZWlnaHRDYWNoZWQoZW5kSGVpZ2h0ICsgMSwgbWF4SGVpZ2h0KTtcbiAgICAgIFxuICAgICAgLy8gYmxvY2sgY2Fubm90IGJlIGJpZ2dlciB0aGFuIG1heCByZXF1ZXN0IHNpemVcbiAgICAgIGFzc2VydChoZWFkZXIuZ2V0U2l6ZSgpIDw9IG1heFJlcVNpemUsIFwiQmxvY2sgZXhjZWVkcyBtYXhpbXVtIHJlcXVlc3Qgc2l6ZTogXCIgKyBoZWFkZXIuZ2V0U2l6ZSgpKTtcbiAgICAgIFxuICAgICAgLy8gZG9uZSBpdGVyYXRpbmcgaWYgZmV0Y2hpbmcgYmxvY2sgd291bGQgZXhjZWVkIG1heCByZXF1ZXN0IHNpemVcbiAgICAgIGlmIChyZXFTaXplICsgaGVhZGVyLmdldFNpemUoKSA+IG1heFJlcVNpemUpIGJyZWFrO1xuICAgICAgXG4gICAgICAvLyBvdGhlcndpc2UgYmxvY2sgaXMgaW5jbHVkZWRcbiAgICAgIHJlcVNpemUgKz0gaGVhZGVyLmdldFNpemUoKTtcbiAgICAgIGVuZEhlaWdodCsrO1xuICAgIH1cbiAgICByZXR1cm4gZW5kSGVpZ2h0ID49IHN0YXJ0SGVpZ2h0ID8gYXdhaXQgdGhpcy5nZXRCbG9ja3NCeVJhbmdlKHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpIDogW107XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYSBoZWFkZXIgYnkgaGVpZ2h0IGZyb20gdGhlIGNhY2hlIG9yIGZldGNoZXMgYW5kIGNhY2hlcyBhIGhlYWRlclxuICAgKiByYW5nZSBpZiBub3QgYWxyZWFkeSBpbiB0aGUgY2FjaGUuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gaGVpZ2h0IC0gaGVpZ2h0IG9mIHRoZSBoZWFkZXIgdG8gcmV0cmlldmUgZnJvbSB0aGUgY2FjaGVcbiAgICogQHBhcmFtIHtudW1iZXJ9IG1heEhlaWdodCAtIG1heGltdW0gaGVpZ2h0IG9mIGhlYWRlcnMgdG8gY2FjaGVcbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyBnZXRCbG9ja0hlYWRlckJ5SGVpZ2h0Q2FjaGVkKGhlaWdodCwgbWF4SGVpZ2h0KSB7XG4gICAgXG4gICAgLy8gZ2V0IGhlYWRlciBmcm9tIGNhY2hlXG4gICAgbGV0IGNhY2hlZEhlYWRlciA9IHRoaXMuY2FjaGVkSGVhZGVyc1toZWlnaHRdO1xuICAgIGlmIChjYWNoZWRIZWFkZXIpIHJldHVybiBjYWNoZWRIZWFkZXI7XG4gICAgXG4gICAgLy8gZmV0Y2ggYW5kIGNhY2hlIGhlYWRlcnMgaWYgbm90IGluIGNhY2hlXG4gICAgbGV0IGVuZEhlaWdodCA9IE1hdGgubWluKG1heEhlaWdodCwgaGVpZ2h0ICsgTW9uZXJvRGFlbW9uUnBjLk5VTV9IRUFERVJTX1BFUl9SRVEgLSAxKTsgIC8vIFRPRE86IGNvdWxkIHNwZWNpZnkgZW5kIGhlaWdodCB0byBjYWNoZSB0byBvcHRpbWl6ZSBzbWFsbCByZXF1ZXN0cyAod291bGQgbGlrZSB0byBoYXZlIHRpbWUgcHJvZmlsaW5nIGluIHBsYWNlIHRob3VnaClcbiAgICBsZXQgaGVhZGVycyA9IGF3YWl0IHRoaXMuZ2V0QmxvY2tIZWFkZXJzQnlSYW5nZShoZWlnaHQsIGVuZEhlaWdodCk7XG4gICAgZm9yIChsZXQgaGVhZGVyIG9mIGhlYWRlcnMpIHtcbiAgICAgIHRoaXMuY2FjaGVkSGVhZGVyc1toZWFkZXIuZ2V0SGVpZ2h0KCldID0gaGVhZGVyO1xuICAgIH1cbiAgICBcbiAgICAvLyByZXR1cm4gdGhlIGNhY2hlZCBoZWFkZXJcbiAgICByZXR1cm4gdGhpcy5jYWNoZWRIZWFkZXJzW2hlaWdodF07XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBTVEFUSUMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgc3RhdGljIGFzeW5jIGNvbm5lY3RUb0RhZW1vblJwYyh1cmlPckNvbmZpZzogc3RyaW5nIHwgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPiB8IFBhcnRpYWw8TW9uZXJvRGFlbW9uQ29uZmlnPiB8IHN0cmluZ1tdLCB1c2VybmFtZT86IHN0cmluZywgcGFzc3dvcmQ/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0RhZW1vblJwYz4ge1xuICAgIGxldCBjb25maWcgPSBNb25lcm9EYWVtb25ScGMubm9ybWFsaXplQ29uZmlnKHVyaU9yQ29uZmlnLCB1c2VybmFtZSwgcGFzc3dvcmQpO1xuICAgIGlmIChjb25maWcuY21kKSByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLnN0YXJ0TW9uZXJvZFByb2Nlc3MoY29uZmlnKTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0RhZW1vblJwYyhjb25maWcsIGNvbmZpZy5wcm94eVRvV29ya2VyID8gYXdhaXQgTW9uZXJvRGFlbW9uUnBjUHJveHkuY29ubmVjdChjb25maWcpIDogdW5kZWZpbmVkKTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBhc3luYyBzdGFydE1vbmVyb2RQcm9jZXNzKGNvbmZpZzogTW9uZXJvRGFlbW9uQ29uZmlnKTogUHJvbWlzZTxNb25lcm9EYWVtb25ScGM+IHtcbiAgICBhc3NlcnQoR2VuVXRpbHMuaXNBcnJheShjb25maWcuY21kKSwgXCJNdXN0IHByb3ZpZGUgc3RyaW5nIGFycmF5IHdpdGggY29tbWFuZCBsaW5lIHBhcmFtZXRlcnNcIik7XG4gICAgXG4gICAgLy8gc3RhcnQgcHJvY2Vzc1xuICAgIGxldCBwcm9jZXNzID0gcmVxdWlyZSgnY2hpbGRfcHJvY2VzcycpLnNwYXduKGNvbmZpZy5jbWRbMF0sIGNvbmZpZy5jbWQuc2xpY2UoMSksIHt9KTtcbiAgICBwcm9jZXNzLnN0ZG91dC5zZXRFbmNvZGluZygndXRmOCcpO1xuICAgIHByb2Nlc3Muc3RkZXJyLnNldEVuY29kaW5nKCd1dGY4Jyk7XG4gICAgXG4gICAgLy8gcmV0dXJuIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgYWZ0ZXIgc3RhcnRpbmcgbW9uZXJvZFxuICAgIGxldCB1cmk7XG4gICAgbGV0IG91dHB1dCA9IFwiXCI7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBhd2FpdCBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgc3Rkb3V0XG4gICAgICAgIHByb2Nlc3Muc3Rkb3V0Lm9uKCdkYXRhJywgYXN5bmMgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgIGxldCBsaW5lID0gZGF0YS50b1N0cmluZygpO1xuICAgICAgICAgIExpYnJhcnlVdGlscy5sb2coMiwgbGluZSk7XG4gICAgICAgICAgb3V0cHV0ICs9IGxpbmUgKyAnXFxuJzsgLy8gY2FwdHVyZSBvdXRwdXQgaW4gY2FzZSBvZiBlcnJvclxuICAgICAgICAgIFxuICAgICAgICAgIC8vIGV4dHJhY3QgdXJpIGZyb20gZS5nLiBcIkkgQmluZGluZyBvbiAxMjcuMC4wLjEgKElQdjQpOjM4MDg1XCJcbiAgICAgICAgICBsZXQgdXJpTGluZUNvbnRhaW5zID0gXCJCaW5kaW5nIG9uIFwiO1xuICAgICAgICAgIGxldCB1cmlMaW5lQ29udGFpbnNJZHggPSBsaW5lLmluZGV4T2YodXJpTGluZUNvbnRhaW5zKTtcbiAgICAgICAgICBpZiAodXJpTGluZUNvbnRhaW5zSWR4ID49IDApIHtcbiAgICAgICAgICAgIGxldCBob3N0ID0gbGluZS5zdWJzdHJpbmcodXJpTGluZUNvbnRhaW5zSWR4ICsgdXJpTGluZUNvbnRhaW5zLmxlbmd0aCwgbGluZS5sYXN0SW5kZXhPZignICcpKTtcbiAgICAgICAgICAgIGxldCB1bmZvcm1hdHRlZExpbmUgPSBsaW5lLnJlcGxhY2UoL1xcdTAwMWJcXFsuKj9tL2csICcnKS50cmltKCk7IC8vIHJlbW92ZSBjb2xvciBmb3JtYXR0aW5nXG4gICAgICAgICAgICBsZXQgcG9ydCA9IHVuZm9ybWF0dGVkTGluZS5zdWJzdHJpbmcodW5mb3JtYXR0ZWRMaW5lLmxhc3RJbmRleE9mKCc6JykgKyAxKTtcbiAgICAgICAgICAgIGxldCBzc2xJZHggPSBjb25maWcuY21kLmluZGV4T2YoXCItLXJwYy1zc2xcIik7XG4gICAgICAgICAgICBsZXQgc3NsRW5hYmxlZCA9IHNzbElkeCA+PSAwID8gXCJlbmFibGVkXCIgPT0gY29uZmlnLmNtZFtzc2xJZHggKyAxXS50b0xvd2VyQ2FzZSgpIDogZmFsc2U7XG4gICAgICAgICAgICB1cmkgPSAoc3NsRW5hYmxlZCA/IFwiaHR0cHNcIiA6IFwiaHR0cFwiKSArIFwiOi8vXCIgKyBob3N0ICsgXCI6XCIgKyBwb3J0O1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICAvLyByZWFkIHN1Y2Nlc3MgbWVzc2FnZVxuICAgICAgICAgIGlmIChsaW5lLmluZGV4T2YoXCJjb3JlIFJQQyBzZXJ2ZXIgc3RhcnRlZCBva1wiKSA+PSAwKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIGdldCB1c2VybmFtZSBhbmQgcGFzc3dvcmQgZnJvbSBwYXJhbXNcbiAgICAgICAgICAgIGxldCB1c2VyUGFzc0lkeCA9IGNvbmZpZy5jbWQuaW5kZXhPZihcIi0tcnBjLWxvZ2luXCIpO1xuICAgICAgICAgICAgbGV0IHVzZXJQYXNzID0gdXNlclBhc3NJZHggPj0gMCA/IGNvbmZpZy5jbWRbdXNlclBhc3NJZHggKyAxXSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGxldCB1c2VybmFtZSA9IHVzZXJQYXNzID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB1c2VyUGFzcy5zdWJzdHJpbmcoMCwgdXNlclBhc3MuaW5kZXhPZignOicpKTtcbiAgICAgICAgICAgIGxldCBwYXNzd29yZCA9IHVzZXJQYXNzID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB1c2VyUGFzcy5zdWJzdHJpbmcodXNlclBhc3MuaW5kZXhPZignOicpICsgMSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIGNyZWF0ZSBjbGllbnQgY29ubmVjdGVkIHRvIGludGVybmFsIHByb2Nlc3NcbiAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZy5jb3B5KCkuc2V0U2VydmVyKHt1cmk6IHVyaSwgdXNlcm5hbWU6IHVzZXJuYW1lLCBwYXNzd29yZDogcGFzc3dvcmQsIHJlamVjdFVuYXV0aG9yaXplZDogY29uZmlnLmdldFNlcnZlcigpID8gY29uZmlnLmdldFNlcnZlcigpLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdW5kZWZpbmVkfSk7XG4gICAgICAgICAgICBjb25maWcuc2V0UHJveHlUb1dvcmtlcihjb25maWcucHJveHlUb1dvcmtlcik7XG4gICAgICAgICAgICBjb25maWcuY21kID0gdW5kZWZpbmVkXG4gICAgICAgICAgICBsZXQgZGFlbW9uID0gYXdhaXQgTW9uZXJvRGFlbW9uUnBjLmNvbm5lY3RUb0RhZW1vblJwYyhjb25maWcpO1xuICAgICAgICAgICAgZGFlbW9uLnByb2Nlc3MgPSBwcm9jZXNzO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyByZXNvbHZlIHByb21pc2Ugd2l0aCBjbGllbnQgY29ubmVjdGVkIHRvIGludGVybmFsIHByb2Nlc3MgXG4gICAgICAgICAgICB0aGlzLmlzUmVzb2x2ZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmVzb2x2ZShkYWVtb24pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgc3RkZXJyXG4gICAgICAgIHByb2Nlc3Muc3RkZXJyLm9uKCdkYXRhJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0TG9nTGV2ZWwoKSA+PSAyKSBjb25zb2xlLmVycm9yKGRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBleGl0XG4gICAgICAgIHByb2Nlc3Mub24oXCJleGl0XCIsIGZ1bmN0aW9uKGNvZGUpIHtcbiAgICAgICAgICBpZiAoIXRoaXMuaXNSZXNvbHZlZCkgcmVqZWN0KG5ldyBFcnJvcihcIm1vbmVyb2QgcHJvY2VzcyB0ZXJtaW5hdGVkIHdpdGggZXhpdCBjb2RlIFwiICsgY29kZSArIChvdXRwdXQgPyBcIjpcXG5cXG5cIiArIG91dHB1dCA6IFwiXCIpKSk7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gaGFuZGxlIGVycm9yXG4gICAgICAgIHByb2Nlc3Mub24oXCJlcnJvclwiLCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICBpZiAoZXJyLm1lc3NhZ2UuaW5kZXhPZihcIkVOT0VOVFwiKSA+PSAwKSByZWplY3QobmV3IEVycm9yKFwibW9uZXJvZCBkb2VzIG5vdCBleGlzdCBhdCBwYXRoICdcIiArIGNvbmZpZy5jbWRbMF0gKyBcIidcIikpO1xuICAgICAgICAgIGlmICghdGhpcy5pc1Jlc29sdmVkKSByZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgdW5jYXVnaHQgZXhjZXB0aW9uXG4gICAgICAgIHByb2Nlc3Mub24oXCJ1bmNhdWdodEV4Y2VwdGlvblwiLCBmdW5jdGlvbihlcnIsIG9yaWdpbikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJVbmNhdWdodCBleGNlcHRpb24gaW4gbW9uZXJvZCBwcm9jZXNzOiBcIiArIGVyci5tZXNzYWdlKTtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKG9yaWdpbik7XG4gICAgICAgICAgaWYgKCF0aGlzLmlzUmVzb2x2ZWQpIHJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZXJyLm1lc3NhZ2UpO1xuICAgIH1cbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBub3JtYWxpemVDb25maWcodXJpT3JDb25maWc6IHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4gfCBQYXJ0aWFsPE1vbmVyb0RhZW1vbkNvbmZpZz4gfCBzdHJpbmdbXSwgdXNlcm5hbWU/OiBzdHJpbmcsIHBhc3N3b3JkPzogc3RyaW5nKTogTW9uZXJvRGFlbW9uQ29uZmlnIHtcbiAgICBsZXQgY29uZmlnOiB1bmRlZmluZWQgfCBQYXJ0aWFsPE1vbmVyb0RhZW1vbkNvbmZpZz4gPSB1bmRlZmluZWQ7XG4gICAgaWYgKHR5cGVvZiB1cmlPckNvbmZpZyA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgY29uZmlnID0gbmV3IE1vbmVyb0RhZW1vbkNvbmZpZyh7c2VydmVyOiBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih1cmlPckNvbmZpZyBhcyBzdHJpbmcsIHVzZXJuYW1lLCBwYXNzd29yZCl9KTtcbiAgICB9IGVsc2UgaWYgKCh1cmlPckNvbmZpZyBhcyBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+KS51cmkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uZmlnID0gbmV3IE1vbmVyb0RhZW1vbkNvbmZpZyh7c2VydmVyOiBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih1cmlPckNvbmZpZyBhcyBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+KX0pO1xuXG4gICAgICAvLyB0cmFuc2ZlciB3b3JrZXIgcHJveHkgc2V0dGluZyBmcm9tIHJwYyBjb25uZWN0aW9uIHRvIGRhZW1vbiBjb25maWdcbiAgICAgIGNvbmZpZy5zZXRQcm94eVRvV29ya2VyKCh1cmlPckNvbmZpZyBhcyBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+KS5wcm94eVRvV29ya2VyKTtcbiAgICAgIGNvbmZpZy5nZXRTZXJ2ZXIoKS5zZXRQcm94eVRvV29ya2VyKE1vbmVyb1JwY0Nvbm5lY3Rpb24uREVGQVVMVF9DT05GSUcucHJveHlUb1dvcmtlcik7XG4gICAgfSBlbHNlIGlmIChHZW5VdGlscy5pc0FycmF5KHVyaU9yQ29uZmlnKSkge1xuICAgICAgY29uZmlnID0gbmV3IE1vbmVyb0RhZW1vbkNvbmZpZyh7Y21kOiB1cmlPckNvbmZpZyBhcyBzdHJpbmdbXX0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25maWcgPSBuZXcgTW9uZXJvRGFlbW9uQ29uZmlnKHVyaU9yQ29uZmlnIGFzIFBhcnRpYWw8TW9uZXJvRGFlbW9uQ29uZmlnPik7XG4gICAgfVxuICAgIGlmIChjb25maWcucHJveHlUb1dvcmtlciA9PT0gdW5kZWZpbmVkKSBjb25maWcucHJveHlUb1dvcmtlciA9IHRydWU7XG4gICAgaWYgKGNvbmZpZy5wb2xsSW50ZXJ2YWwgPT09IHVuZGVmaW5lZCkgY29uZmlnLnBvbGxJbnRlcnZhbCA9IE1vbmVyb0RhZW1vblJwYy5ERUZBVUxUX1BPTExfUEVSSU9EO1xuICAgIHJldHVybiBjb25maWcgYXMgTW9uZXJvRGFlbW9uQ29uZmlnO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCkge1xuICAgIGlmIChyZXNwLnN0YXR1cyAhPT0gXCJPS1wiKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IocmVzcC5zdGF0dXMpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNCbG9ja0hlYWRlcihycGNIZWFkZXIpIHtcbiAgICBpZiAoIXJwY0hlYWRlcikgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICBsZXQgaGVhZGVyID0gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY0hlYWRlcikpIHtcbiAgICAgIGxldCB2YWwgPSBycGNIZWFkZXJba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYmxvY2tfc2l6ZVwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldFNpemUsIGhlYWRlci5zZXRTaXplLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRlcHRoXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0RGVwdGgsIGhlYWRlci5zZXREZXB0aCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5XCIpIHsgfSAgLy8gaGFuZGxlZCBieSB3aWRlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjdW11bGF0aXZlX2RpZmZpY3VsdHlcIikgeyB9IC8vIGhhbmRsZWQgYnkgd2lkZV9jdW11bGF0aXZlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5X3RvcDY0XCIpIHsgfSAgLy8gaGFuZGxlZCBieSB3aWRlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjdW11bGF0aXZlX2RpZmZpY3VsdHlfdG9wNjRcIikgeyB9IC8vIGhhbmRsZWQgYnkgd2lkZV9jdW11bGF0aXZlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3aWRlX2RpZmZpY3VsdHlcIikgaGVhZGVyLnNldERpZmZpY3VsdHkoR2VuVXRpbHMucmVjb25jaWxlKGhlYWRlci5nZXREaWZmaWN1bHR5KCksIE1vbmVyb0RhZW1vblJwYy5wcmVmaXhlZEhleFRvQkkodmFsKSkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndpZGVfY3VtdWxhdGl2ZV9kaWZmaWN1bHR5XCIpIGhlYWRlci5zZXRDdW11bGF0aXZlRGlmZmljdWx0eShHZW5VdGlscy5yZWNvbmNpbGUoaGVhZGVyLmdldEN1bXVsYXRpdmVEaWZmaWN1bHR5KCksIE1vbmVyb0RhZW1vblJwYy5wcmVmaXhlZEhleFRvQkkodmFsKSkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhhc2hcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRIYXNoLCBoZWFkZXIuc2V0SGFzaCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJoZWlnaHRcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRIZWlnaHQsIGhlYWRlci5zZXRIZWlnaHQsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibWFqb3JfdmVyc2lvblwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldE1ham9yVmVyc2lvbiwgaGVhZGVyLnNldE1ham9yVmVyc2lvbiwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtaW5vcl92ZXJzaW9uXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0TWlub3JWZXJzaW9uLCBoZWFkZXIuc2V0TWlub3JWZXJzaW9uLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm5vbmNlXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0Tm9uY2UsIGhlYWRlci5zZXROb25jZSwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJudW1fdHhlc1wiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldE51bVR4cywgaGVhZGVyLnNldE51bVR4cywgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJvcnBoYW5fc3RhdHVzXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0T3JwaGFuU3RhdHVzLCBoZWFkZXIuc2V0T3JwaGFuU3RhdHVzLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInByZXZfaGFzaFwiIHx8IGtleSA9PT0gXCJwcmV2X2lkXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0UHJldkhhc2gsIGhlYWRlci5zZXRQcmV2SGFzaCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyZXdhcmRcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRSZXdhcmQsIGhlYWRlci5zZXRSZXdhcmQsIEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0aW1lc3RhbXBcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRUaW1lc3RhbXAsIGhlYWRlci5zZXRUaW1lc3RhbXAsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfd2VpZ2h0XCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0V2VpZ2h0LCBoZWFkZXIuc2V0V2VpZ2h0LCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxvbmdfdGVybV93ZWlnaHRcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRMb25nVGVybVdlaWdodCwgaGVhZGVyLnNldExvbmdUZXJtV2VpZ2h0LCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBvd19oYXNoXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0UG93SGFzaCwgaGVhZGVyLnNldFBvd0hhc2gsIHZhbCA9PT0gXCJcIiA/IHVuZGVmaW5lZCA6IHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfaGFzaGVzXCIpIHt9ICAvLyB1c2VkIGluIGJsb2NrIG1vZGVsLCBub3QgaGVhZGVyIG1vZGVsXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibWluZXJfdHhcIikge30gICAvLyB1c2VkIGluIGJsb2NrIG1vZGVsLCBub3QgaGVhZGVyIG1vZGVsXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibWluZXJfdHhfaGFzaFwiKSBoZWFkZXIuc2V0TWluZXJUeEhhc2godmFsKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGJsb2NrIGhlYWRlciBmaWVsZDogJ1wiICsga2V5ICsgXCInOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBoZWFkZXI7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY0Jsb2NrKHJwY0Jsb2NrKSB7XG4gICAgXG4gICAgLy8gYnVpbGQgYmxvY2tcbiAgICBsZXQgYmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNCbG9ja0hlYWRlcihycGNCbG9jay5ibG9ja19oZWFkZXIgPyBycGNCbG9jay5ibG9ja19oZWFkZXIgOiBycGNCbG9jaykgYXMgTW9uZXJvQmxvY2spO1xuICAgIGJsb2NrLnNldEhleChycGNCbG9jay5ibG9iKTtcbiAgICBibG9jay5zZXRUeEhhc2hlcyhycGNCbG9jay50eF9oYXNoZXMgPT09IHVuZGVmaW5lZCA/IFtdIDogcnBjQmxvY2sudHhfaGFzaGVzKTtcbiAgICBcbiAgICAvLyBidWlsZCBtaW5lciB0eFxuICAgIGxldCBycGNNaW5lclR4ID0gcnBjQmxvY2suanNvbiA/IEpTT04ucGFyc2UocnBjQmxvY2suanNvbikubWluZXJfdHggOiBycGNCbG9jay5taW5lcl90eDsgIC8vIG1heSBuZWVkIHRvIGJlIHBhcnNlZCBmcm9tIGpzb25cbiAgICBsZXQgbWluZXJUeCA9IG5ldyBNb25lcm9UeCgpO1xuICAgIGJsb2NrLnNldE1pbmVyVHgobWluZXJUeCk7XG4gICAgbWluZXJUeC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICBtaW5lclR4LnNldEluVHhQb29sKGZhbHNlKVxuICAgIG1pbmVyVHguc2V0SXNNaW5lclR4KHRydWUpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVHgocnBjTWluZXJUeCwgbWluZXJUeCk7XG4gICAgXG4gICAgcmV0dXJuIGJsb2NrO1xuICB9XG4gIFxuICAvKipcbiAgICogVHJhbnNmZXJzIFJQQyB0eCBmaWVsZHMgdG8gYSBnaXZlbiBNb25lcm9UeCB3aXRob3V0IG92ZXJ3cml0aW5nIHByZXZpb3VzIHZhbHVlcy5cbiAgICogXG4gICAqIFRPRE86IHN3aXRjaCBmcm9tIHNhZmUgc2V0XG4gICAqIFxuICAgKiBAcGFyYW0gcnBjVHggLSBSUEMgbWFwIGNvbnRhaW5pbmcgdHJhbnNhY3Rpb24gZmllbGRzXG4gICAqIEBwYXJhbSB0eCAgLSBNb25lcm9UeCB0byBwb3B1bGF0ZSB3aXRoIHZhbHVlcyAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4gdHggLSBzYW1lIHR4IHRoYXQgd2FzIHBhc3NlZCBpbiBvciBhIG5ldyBvbmUgaWYgbm9uZSBnaXZlblxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVHgocnBjVHgsIHR4KSB7XG4gICAgaWYgKHJwY1R4ID09PSB1bmRlZmluZWQpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgaWYgKHR4ID09PSB1bmRlZmluZWQpIHR4ID0gbmV3IE1vbmVyb1R4KCk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSBmcm9tIHJwYyBtYXBcbiAgICBsZXQgaGVhZGVyO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNUeCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNUeFtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJ0eF9oYXNoXCIgfHwga2V5ID09PSBcImlkX2hhc2hcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SGFzaCwgdHguc2V0SGFzaCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja190aW1lc3RhbXBcIikge1xuICAgICAgICBpZiAoIWhlYWRlcikgaGVhZGVyID0gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKCk7XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0VGltZXN0YW1wLCBoZWFkZXIuc2V0VGltZXN0YW1wLCB2YWwpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX2hlaWdodFwiKSB7XG4gICAgICAgIGlmICghaGVhZGVyKSBoZWFkZXIgPSBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoKTtcbiAgICAgICAgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRIZWlnaHQsIGhlYWRlci5zZXRIZWlnaHQsIHZhbCk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibGFzdF9yZWxheWVkX3RpbWVcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAsIHR4LnNldExhc3RSZWxheWVkVGltZXN0YW1wLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJlY2VpdmVfdGltZVwiIHx8IGtleSA9PT0gXCJyZWNlaXZlZF90aW1lc3RhbXBcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0UmVjZWl2ZWRUaW1lc3RhbXAsIHR4LnNldFJlY2VpdmVkVGltZXN0YW1wLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNvbmZpcm1hdGlvbnNcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0TnVtQ29uZmlybWF0aW9ucywgdHguc2V0TnVtQ29uZmlybWF0aW9ucywgdmFsKTsgXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaW5fcG9vbFwiKSB7XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzQ29uZmlybWVkLCB0eC5zZXRJc0NvbmZpcm1lZCwgIXZhbCk7XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldEluVHhQb29sLCB0eC5zZXRJblR4UG9vbCwgdmFsKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkb3VibGVfc3BlbmRfc2VlblwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc0RvdWJsZVNwZW5kU2VlbiwgdHguc2V0SXNEb3VibGVTcGVuZFNlZW4sIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidmVyc2lvblwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRWZXJzaW9uLCB0eC5zZXRWZXJzaW9uLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImV4dHJhXCIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWwgPT09IFwic3RyaW5nXCIpIGNvbnNvbGUubG9nKFwiV0FSTklORzogZXh0cmEgZmllbGQgYXMgc3RyaW5nIG5vdCBiZWluZyBhc2lnbmVkIHRvIGludFtdOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7IC8vIFRPRE86IGhvdyB0byBzZXQgc3RyaW5nIHRvIGludFtdPyAtIG9yLCBleHRyYSBpcyBzdHJpbmcgd2hpY2ggY2FuIGVuY29kZSBpbnRbXVxuICAgICAgICBlbHNlIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldEV4dHJhLCB0eC5zZXRFeHRyYSwgbmV3IFVpbnQ4QXJyYXkodmFsKSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidmluXCIpIHtcbiAgICAgICAgaWYgKHZhbC5sZW5ndGggIT09IDEgfHwgIXZhbFswXS5nZW4pIHsgIC8vIGlnbm9yZSBtaW5lciBpbnB1dCBUT0RPOiB3aHk/XG4gICAgICAgICAgdHguc2V0SW5wdXRzKHZhbC5tYXAocnBjVmluID0+IE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjT3V0cHV0KHJwY1ZpbiwgdHgpKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ2b3V0XCIpIHR4LnNldE91dHB1dHModmFsLm1hcChycGNPdXRwdXQgPT4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNPdXRwdXQocnBjT3V0cHV0LCB0eCkpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyY3Rfc2lnbmF0dXJlc1wiKSB7XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFJjdFNpZ25hdHVyZXMsIHR4LnNldFJjdFNpZ25hdHVyZXMsIHZhbCk7XG4gICAgICAgIGlmICh2YWwudHhuRmVlKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRGZWUsIHR4LnNldEZlZSwgQmlnSW50KHZhbC50eG5GZWUpKTtcbiAgICAgIH0gXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmN0c2lnX3BydW5hYmxlXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFJjdFNpZ1BydW5hYmxlLCB0eC5zZXRSY3RTaWdQcnVuYWJsZSwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bmxvY2tfdGltZVwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRVbmxvY2tUaW1lLCB0eC5zZXRVbmxvY2tUaW1lLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFzX2pzb25cIiB8fCBrZXkgPT09IFwidHhfanNvblwiKSB7IH0gIC8vIGhhbmRsZWQgbGFzdCBzbyB0eCBpcyBhcyBpbml0aWFsaXplZCBhcyBwb3NzaWJsZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFzX2hleFwiIHx8IGtleSA9PT0gXCJ0eF9ibG9iXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldEZ1bGxIZXgsIHR4LnNldEZ1bGxIZXgsIHZhbCA/IHZhbCA6IHVuZGVmaW5lZCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvYl9zaXplXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFNpemUsIHR4LnNldFNpemUsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2VpZ2h0XCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFdlaWdodCwgdHguc2V0V2VpZ2h0LCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImZlZVwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRGZWUsIHR4LnNldEZlZSwgQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJlbGF5ZWRcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SXNSZWxheWVkLCB0eC5zZXRJc1JlbGF5ZWQsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwib3V0cHV0X2luZGljZXNcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0T3V0cHV0SW5kaWNlcywgdHguc2V0T3V0cHV0SW5kaWNlcywgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkb19ub3RfcmVsYXlcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0UmVsYXksIHR4LnNldFJlbGF5LCAhdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJrZXB0X2J5X2Jsb2NrXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzS2VwdEJ5QmxvY2ssIHR4LnNldElzS2VwdEJ5QmxvY2ssIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic2lnbmF0dXJlc1wiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRTaWduYXR1cmVzLCB0eC5zZXRTaWduYXR1cmVzLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxhc3RfZmFpbGVkX2hlaWdodFwiKSB7XG4gICAgICAgIGlmICh2YWwgPT09IDApIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzRmFpbGVkLCB0eC5zZXRJc0ZhaWxlZCwgZmFsc2UpO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc0ZhaWxlZCwgdHguc2V0SXNGYWlsZWQsIHRydWUpO1xuICAgICAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldExhc3RGYWlsZWRIZWlnaHQsIHR4LnNldExhc3RGYWlsZWRIZWlnaHQsIHZhbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsYXN0X2ZhaWxlZF9pZF9oYXNoXCIpIHtcbiAgICAgICAgaWYgKHZhbCA9PT0gTW9uZXJvRGFlbW9uUnBjLkRFRkFVTFRfSUQpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzRmFpbGVkLCB0eC5zZXRJc0ZhaWxlZCwgZmFsc2UpO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc0ZhaWxlZCwgdHguc2V0SXNGYWlsZWQsIHRydWUpO1xuICAgICAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldExhc3RGYWlsZWRIYXNoLCB0eC5zZXRMYXN0RmFpbGVkSGFzaCwgdmFsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm1heF91c2VkX2Jsb2NrX2hlaWdodFwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRNYXhVc2VkQmxvY2tIZWlnaHQsIHR4LnNldE1heFVzZWRCbG9ja0hlaWdodCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtYXhfdXNlZF9ibG9ja19pZF9oYXNoXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldE1heFVzZWRCbG9ja0hhc2gsIHR4LnNldE1heFVzZWRCbG9ja0hhc2gsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHJ1bmFibGVfaGFzaFwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRQcnVuYWJsZUhhc2gsIHR4LnNldFBydW5hYmxlSGFzaCwgdmFsID8gdmFsIDogdW5kZWZpbmVkKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwcnVuYWJsZV9hc19oZXhcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0UHJ1bmFibGVIZXgsIHR4LnNldFBydW5hYmxlSGV4LCB2YWwgPyB2YWwgOiB1bmRlZmluZWQpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBydW5lZF9hc19oZXhcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0UHJ1bmVkSGV4LCB0eC5zZXRQcnVuZWRIZXgsIHZhbCA/IHZhbCA6IHVuZGVmaW5lZCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBycGMgdHg6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgXG4gICAgLy8gbGluayBibG9jayBhbmQgdHhcbiAgICBpZiAoaGVhZGVyKSB0eC5zZXRCbG9jayhuZXcgTW9uZXJvQmxvY2soaGVhZGVyKS5zZXRUeHMoW3R4XSkpO1xuICAgIFxuICAgIC8vIFRPRE8gbW9uZXJvZDogdW5jb25maXJtZWQgdHhzIG1pc3JlcG9ydCBibG9jayBoZWlnaHQgYW5kIHRpbWVzdGFtcD9cbiAgICBpZiAodHguZ2V0QmxvY2soKSAmJiB0eC5nZXRCbG9jaygpLmdldEhlaWdodCgpICE9PSB1bmRlZmluZWQgJiYgdHguZ2V0QmxvY2soKS5nZXRIZWlnaHQoKSA9PT0gdHguZ2V0QmxvY2soKS5nZXRUaW1lc3RhbXAoKSkge1xuICAgICAgdHguc2V0QmxvY2sodW5kZWZpbmVkKTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICB9XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSByZW1haW5pbmcga25vd24gZmllbGRzXG4gICAgaWYgKHR4LmdldElzQ29uZmlybWVkKCkpIHtcbiAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzUmVsYXllZCwgdHguc2V0SXNSZWxheWVkLCB0cnVlKTtcbiAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFJlbGF5LCB0eC5zZXRSZWxheSwgdHJ1ZSk7XG4gICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc0ZhaWxlZCwgdHguc2V0SXNGYWlsZWQsIGZhbHNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdHguc2V0TnVtQ29uZmlybWF0aW9ucygwKTtcbiAgICB9XG4gICAgaWYgKHR4LmdldElzRmFpbGVkKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgIGlmICh0eC5nZXRPdXRwdXRJbmRpY2VzKCkgJiYgdHguZ2V0T3V0cHV0cygpKSAge1xuICAgICAgYXNzZXJ0LmVxdWFsKHR4LmdldE91dHB1dHMoKS5sZW5ndGgsIHR4LmdldE91dHB1dEluZGljZXMoKS5sZW5ndGgpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0eC5nZXRPdXRwdXRzKCkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdHguZ2V0T3V0cHV0cygpW2ldLnNldEluZGV4KHR4LmdldE91dHB1dEluZGljZXMoKVtpXSk7ICAvLyB0cmFuc2ZlciBvdXRwdXQgaW5kaWNlcyB0byBvdXRwdXRzXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChycGNUeC5hc19qc29uKSBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1R4KEpTT04ucGFyc2UocnBjVHguYXNfanNvbiksIHR4KTtcbiAgICBpZiAocnBjVHgudHhfanNvbikgTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNUeChKU09OLnBhcnNlKHJwY1R4LnR4X2pzb24pLCB0eCk7XG4gICAgaWYgKCF0eC5nZXRJc1JlbGF5ZWQoKSkgdHguc2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAodW5kZWZpbmVkKTsgIC8vIFRPRE8gbW9uZXJvZDogcmV0dXJucyBsYXN0X3JlbGF5ZWRfdGltZXN0YW1wIGRlc3BpdGUgcmVsYXllZDogZmFsc2UsIHNlbGYgaW5jb25zaXN0ZW50XG4gICAgXG4gICAgLy8gcmV0dXJuIGJ1aWx0IHRyYW5zYWN0aW9uXG4gICAgcmV0dXJuIHR4O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNPdXRwdXQocnBjT3V0cHV0LCB0eCkge1xuICAgIGxldCBvdXRwdXQgPSBuZXcgTW9uZXJvT3V0cHV0KCk7XG4gICAgb3V0cHV0LnNldFR4KHR4KTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjT3V0cHV0KSkge1xuICAgICAgbGV0IHZhbCA9IHJwY091dHB1dFtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJnZW5cIikgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiT3V0cHV0IHdpdGggJ2dlbicgZnJvbSBkYWVtb24gcnBjIGlzIG1pbmVyIHR4IHdoaWNoIHdlIGlnbm9yZSAoaS5lLiBlYWNoIG1pbmVyIGlucHV0IGlzIHVuZGVmaW5lZClcIik7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwia2V5XCIpIHtcbiAgICAgICAgR2VuVXRpbHMuc2FmZVNldChvdXRwdXQsIG91dHB1dC5nZXRBbW91bnQsIG91dHB1dC5zZXRBbW91bnQsIEJpZ0ludCh2YWwuYW1vdW50KSk7XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQob3V0cHV0LCBvdXRwdXQuZ2V0S2V5SW1hZ2UsIG91dHB1dC5zZXRLZXlJbWFnZSwgbmV3IE1vbmVyb0tleUltYWdlKHZhbC5rX2ltYWdlKSk7XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQob3V0cHV0LCBvdXRwdXQuZ2V0UmluZ091dHB1dEluZGljZXMsIG91dHB1dC5zZXRSaW5nT3V0cHV0SW5kaWNlcywgdmFsLmtleV9vZmZzZXRzKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRcIikgR2VuVXRpbHMuc2FmZVNldChvdXRwdXQsIG91dHB1dC5nZXRBbW91bnQsIG91dHB1dC5zZXRBbW91bnQsIEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0YXJnZXRcIikge1xuICAgICAgICBsZXQgcHViS2V5ID0gdmFsLmtleSA9PT0gdW5kZWZpbmVkID8gdmFsLnRhZ2dlZF9rZXkua2V5IDogdmFsLmtleTsgLy8gVE9ETyAobW9uZXJvZCk6IHJwYyBqc29uIHVzZXMge3RhZ2dlZF9rZXk9e2tleT0uLi59fSwgYmluYXJ5IGJsb2NrcyB1c2Uge2tleT0uLi59XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQob3V0cHV0LCBvdXRwdXQuZ2V0U3RlYWx0aFB1YmxpY0tleSwgb3V0cHV0LnNldFN0ZWFsdGhQdWJsaWNLZXksIHB1YktleSk7XG4gICAgICB9XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBvdXRwdXQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjQmxvY2tUZW1wbGF0ZShycGNUZW1wbGF0ZSkge1xuICAgIGxldCB0ZW1wbGF0ZSA9IG5ldyBNb25lcm9CbG9ja1RlbXBsYXRlKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1RlbXBsYXRlKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1RlbXBsYXRlW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImJsb2NraGFzaGluZ19ibG9iXCIpIHRlbXBsYXRlLnNldEJsb2NrVGVtcGxhdGVCbG9iKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2t0ZW1wbGF0ZV9ibG9iXCIpIHRlbXBsYXRlLnNldEJsb2NrSGFzaGluZ0Jsb2IodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5XCIpIHRlbXBsYXRlLnNldERpZmZpY3VsdHkoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImV4cGVjdGVkX3Jld2FyZFwiKSB0ZW1wbGF0ZS5zZXRFeHBlY3RlZFJld2FyZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRpZmZpY3VsdHlcIikgeyB9ICAvLyBoYW5kbGVkIGJ5IHdpZGVfZGlmZmljdWx0eVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRpZmZpY3VsdHlfdG9wNjRcIikgeyB9ICAvLyBoYW5kbGVkIGJ5IHdpZGVfZGlmZmljdWx0eVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndpZGVfZGlmZmljdWx0eVwiKSB0ZW1wbGF0ZS5zZXREaWZmaWN1bHR5KEdlblV0aWxzLnJlY29uY2lsZSh0ZW1wbGF0ZS5nZXREaWZmaWN1bHR5KCksIE1vbmVyb0RhZW1vblJwYy5wcmVmaXhlZEhleFRvQkkodmFsKSkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhlaWdodFwiKSB0ZW1wbGF0ZS5zZXRIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwcmV2X2hhc2hcIikgdGVtcGxhdGUuc2V0UHJldkhhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyZXNlcnZlZF9vZmZzZXRcIikgdGVtcGxhdGUuc2V0UmVzZXJ2ZWRPZmZzZXQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGF0dXNcIikge30gIC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW50cnVzdGVkXCIpIHt9ICAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNlZWRfaGVpZ2h0XCIpIHRlbXBsYXRlLnNldFNlZWRIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzZWVkX2hhc2hcIikgdGVtcGxhdGUuc2V0U2VlZEhhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJuZXh0X3NlZWRfaGFzaFwiKSB0ZW1wbGF0ZS5zZXROZXh0U2VlZEhhc2godmFsKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIGJsb2NrIHRlbXBsYXRlOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIGlmIChcIlwiID09PSB0ZW1wbGF0ZS5nZXROZXh0U2VlZEhhc2goKSkgdGVtcGxhdGUuc2V0TmV4dFNlZWRIYXNoKHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIHRlbXBsYXRlO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNJbmZvKHJwY0luZm8pIHtcbiAgICBpZiAoIXJwY0luZm8pIHJldHVybiB1bmRlZmluZWQ7XG4gICAgbGV0IGluZm8gPSBuZXcgTW9uZXJvRGFlbW9uSW5mbygpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNJbmZvKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY0luZm9ba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwidmVyc2lvblwiKSBpbmZvLnNldFZlcnNpb24odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbHRfYmxvY2tzX2NvdW50XCIpIGluZm8uc2V0TnVtQWx0QmxvY2tzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfc2l6ZV9saW1pdFwiKSBpbmZvLnNldEJsb2NrU2l6ZUxpbWl0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfc2l6ZV9tZWRpYW5cIikgaW5mby5zZXRCbG9ja1NpemVNZWRpYW4odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja193ZWlnaHRfbGltaXRcIikgaW5mby5zZXRCbG9ja1dlaWdodExpbWl0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfd2VpZ2h0X21lZGlhblwiKSBpbmZvLnNldEJsb2NrV2VpZ2h0TWVkaWFuKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYm9vdHN0cmFwX2RhZW1vbl9hZGRyZXNzXCIpIHsgaWYgKHZhbCkgaW5mby5zZXRCb290c3RyYXBEYWVtb25BZGRyZXNzKHZhbCk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5XCIpIHsgfSAgLy8gaGFuZGxlZCBieSB3aWRlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjdW11bGF0aXZlX2RpZmZpY3VsdHlcIikgeyB9IC8vIGhhbmRsZWQgYnkgd2lkZV9jdW11bGF0aXZlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5X3RvcDY0XCIpIHsgfSAgLy8gaGFuZGxlZCBieSB3aWRlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjdW11bGF0aXZlX2RpZmZpY3VsdHlfdG9wNjRcIikgeyB9IC8vIGhhbmRsZWQgYnkgd2lkZV9jdW11bGF0aXZlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3aWRlX2RpZmZpY3VsdHlcIikgaW5mby5zZXREaWZmaWN1bHR5KEdlblV0aWxzLnJlY29uY2lsZShpbmZvLmdldERpZmZpY3VsdHkoKSwgTW9uZXJvRGFlbW9uUnBjLnByZWZpeGVkSGV4VG9CSSh2YWwpKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2lkZV9jdW11bGF0aXZlX2RpZmZpY3VsdHlcIikgaW5mby5zZXRDdW11bGF0aXZlRGlmZmljdWx0eShHZW5VdGlscy5yZWNvbmNpbGUoaW5mby5nZXRDdW11bGF0aXZlRGlmZmljdWx0eSgpLCBNb25lcm9EYWVtb25ScGMucHJlZml4ZWRIZXhUb0JJKHZhbCkpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmcmVlX3NwYWNlXCIpIGluZm8uc2V0RnJlZVNwYWNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkYXRhYmFzZV9zaXplXCIpIGluZm8uc2V0RGF0YWJhc2VTaXplKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZ3JleV9wZWVybGlzdF9zaXplXCIpIGluZm8uc2V0TnVtT2ZmbGluZVBlZXJzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGVpZ2h0XCIpIGluZm8uc2V0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGVpZ2h0X3dpdGhvdXRfYm9vdHN0cmFwXCIpIGluZm8uc2V0SGVpZ2h0V2l0aG91dEJvb3RzdHJhcCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImluY29taW5nX2Nvbm5lY3Rpb25zX2NvdW50XCIpIGluZm8uc2V0TnVtSW5jb21pbmdDb25uZWN0aW9ucyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm9mZmxpbmVcIikgaW5mby5zZXRJc09mZmxpbmUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJvdXRnb2luZ19jb25uZWN0aW9uc19jb3VudFwiKSBpbmZvLnNldE51bU91dGdvaW5nQ29ubmVjdGlvbnModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJycGNfY29ubmVjdGlvbnNfY291bnRcIikgaW5mby5zZXROdW1ScGNDb25uZWN0aW9ucyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXJ0X3RpbWVcIikgaW5mby5zZXRTdGFydFRpbWVzdGFtcCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFkanVzdGVkX3RpbWVcIikgaW5mby5zZXRBZGp1c3RlZFRpbWVzdGFtcCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXR1c1wiKSB7fSAgLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0YXJnZXRcIikgaW5mby5zZXRUYXJnZXQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0YXJnZXRfaGVpZ2h0XCIpIGluZm8uc2V0VGFyZ2V0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidG9wX2Jsb2NrX2hhc2hcIikgaW5mby5zZXRUb3BCbG9ja0hhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9jb3VudFwiKSBpbmZvLnNldE51bVR4cyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X3Bvb2xfc2l6ZVwiKSBpbmZvLnNldE51bVR4c1Bvb2wodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bnRydXN0ZWRcIikge30gLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3YXNfYm9vdHN0cmFwX2V2ZXJfdXNlZFwiKSBpbmZvLnNldFdhc0Jvb3RzdHJhcEV2ZXJVc2VkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2hpdGVfcGVlcmxpc3Rfc2l6ZVwiKSBpbmZvLnNldE51bU9ubGluZVBlZXJzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidXBkYXRlX2F2YWlsYWJsZVwiKSBpbmZvLnNldFVwZGF0ZUF2YWlsYWJsZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm5ldHR5cGVcIikgR2VuVXRpbHMuc2FmZVNldChpbmZvLCBpbmZvLmdldE5ldHdvcmtUeXBlLCBpbmZvLnNldE5ldHdvcmtUeXBlLCBNb25lcm9OZXR3b3JrVHlwZS5wYXJzZSh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtYWlubmV0XCIpIHsgaWYgKHZhbCkgR2VuVXRpbHMuc2FmZVNldChpbmZvLCBpbmZvLmdldE5ldHdvcmtUeXBlLCBpbmZvLnNldE5ldHdvcmtUeXBlLCBNb25lcm9OZXR3b3JrVHlwZS5NQUlOTkVUKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRlc3RuZXRcIikgeyBpZiAodmFsKSBHZW5VdGlscy5zYWZlU2V0KGluZm8sIGluZm8uZ2V0TmV0d29ya1R5cGUsIGluZm8uc2V0TmV0d29ya1R5cGUsIE1vbmVyb05ldHdvcmtUeXBlLlRFU1RORVQpOyB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3RhZ2VuZXRcIikgeyBpZiAodmFsKSBHZW5VdGlscy5zYWZlU2V0KGluZm8sIGluZm8uZ2V0TmV0d29ya1R5cGUsIGluZm8uc2V0TmV0d29ya1R5cGUsIE1vbmVyb05ldHdvcmtUeXBlLlNUQUdFTkVUKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNyZWRpdHNcIikgaW5mby5zZXRDcmVkaXRzKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0b3BfYmxvY2tfaGFzaFwiIHx8IGtleSA9PT0gXCJ0b3BfaGFzaFwiKSBpbmZvLnNldFRvcEJsb2NrSGFzaChHZW5VdGlscy5yZWNvbmNpbGUoaW5mby5nZXRUb3BCbG9ja0hhc2goKSwgXCJcIiA9PT0gdmFsID8gdW5kZWZpbmVkIDogdmFsKSlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJidXN5X3N5bmNpbmdcIikgaW5mby5zZXRJc0J1c3lTeW5jaW5nKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3luY2hyb25pemVkXCIpIGluZm8uc2V0SXNTeW5jaHJvbml6ZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyZXN0cmljdGVkXCIpIGluZm8uc2V0SXNSZXN0cmljdGVkKHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogSWdub3JpbmcgdW5leHBlY3RlZCBpbmZvIGZpZWxkOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBpbmZvO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgc3luYyBpbmZvIGZyb20gUlBDIHN5bmMgaW5mby5cbiAgICogXG4gICAqIEBwYXJhbSBycGNTeW5jSW5mbyAtIHJwYyBtYXAgdG8gaW5pdGlhbGl6ZSB0aGUgc3luYyBpbmZvIGZyb21cbiAgICogQHJldHVybiB7TW9uZXJvRGFlbW9uU3luY0luZm99IGlzIHN5bmMgaW5mbyBpbml0aWFsaXplZCBmcm9tIHRoZSBtYXBcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1N5bmNJbmZvKHJwY1N5bmNJbmZvKSB7XG4gICAgbGV0IHN5bmNJbmZvID0gbmV3IE1vbmVyb0RhZW1vblN5bmNJbmZvKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1N5bmNJbmZvKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1N5bmNJbmZvW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImhlaWdodFwiKSBzeW5jSW5mby5zZXRIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwZWVyc1wiKSB7XG4gICAgICAgIHN5bmNJbmZvLnNldFBlZXJzKFtdKTtcbiAgICAgICAgbGV0IHJwY0Nvbm5lY3Rpb25zID0gdmFsO1xuICAgICAgICBmb3IgKGxldCBycGNDb25uZWN0aW9uIG9mIHJwY0Nvbm5lY3Rpb25zKSB7XG4gICAgICAgICAgc3luY0luZm8uZ2V0UGVlcnMoKS5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQ29ubmVjdGlvbihycGNDb25uZWN0aW9uLmluZm8pKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNwYW5zXCIpIHtcbiAgICAgICAgc3luY0luZm8uc2V0U3BhbnMoW10pO1xuICAgICAgICBsZXQgcnBjU3BhbnMgPSB2YWw7XG4gICAgICAgIGZvciAobGV0IHJwY1NwYW4gb2YgcnBjU3BhbnMpIHtcbiAgICAgICAgICBzeW5jSW5mby5nZXRTcGFucygpLnB1c2goTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNDb25uZWN0aW9uU3BhbihycGNTcGFuKSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoa2V5ID09PSBcInN0YXR1c1wiKSB7fSAgIC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidGFyZ2V0X2hlaWdodFwiKSBzeW5jSW5mby5zZXRUYXJnZXRIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJuZXh0X25lZWRlZF9wcnVuaW5nX3NlZWRcIikgc3luY0luZm8uc2V0TmV4dE5lZWRlZFBydW5pbmdTZWVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwib3ZlcnZpZXdcIikgeyAgLy8gdGhpcyByZXR1cm5zIFtdIHdpdGhvdXQgcHJ1bmluZ1xuICAgICAgICBsZXQgb3ZlcnZpZXc7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgb3ZlcnZpZXcgPSBKU09OLnBhcnNlKHZhbCk7XG4gICAgICAgICAgaWYgKG92ZXJ2aWV3ICE9PSB1bmRlZmluZWQgJiYgb3ZlcnZpZXcubGVuZ3RoID4gMCkgY29uc29sZS5lcnJvcihcIklnbm9yaW5nIG5vbi1lbXB0eSAnb3ZlcnZpZXcnIGZpZWxkIChub3QgaW1wbGVtZW50ZWQpOiBcIiArIG92ZXJ2aWV3KTsgLy8gVE9ET1xuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIHBhcnNlICdvdmVydmlldycgZmllbGQ6IFwiICsgb3ZlcnZpZXcgKyBcIjogXCIgKyBlLm1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3JlZGl0c1wiKSBzeW5jSW5mby5zZXRDcmVkaXRzKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0b3BfaGFzaFwiKSBzeW5jSW5mby5zZXRUb3BCbG9ja0hhc2goXCJcIiA9PT0gdmFsID8gdW5kZWZpbmVkIDogdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bnRydXN0ZWRcIikge30gIC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBzeW5jIGluZm86IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIHN5bmNJbmZvO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNIYXJkRm9ya0luZm8ocnBjSGFyZEZvcmtJbmZvKSB7XG4gICAgbGV0IGluZm8gPSBuZXcgTW9uZXJvSGFyZEZvcmtJbmZvKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY0hhcmRGb3JrSW5mbykpIHtcbiAgICAgIGxldCB2YWwgPSBycGNIYXJkRm9ya0luZm9ba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiZWFybGllc3RfaGVpZ2h0XCIpIGluZm8uc2V0RWFybGllc3RIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJlbmFibGVkXCIpIGluZm8uc2V0SXNFbmFibGVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3RhdGVcIikgaW5mby5zZXRTdGF0ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXR1c1wiKSB7fSAgICAgLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bnRydXN0ZWRcIikge30gIC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidGhyZXNob2xkXCIpIGluZm8uc2V0VGhyZXNob2xkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidmVyc2lvblwiKSBpbmZvLnNldFZlcnNpb24odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ2b3Rlc1wiKSBpbmZvLnNldE51bVZvdGVzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidm90aW5nXCIpIGluZm8uc2V0Vm90aW5nKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2luZG93XCIpIGluZm8uc2V0V2luZG93KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3JlZGl0c1wiKSBpbmZvLnNldENyZWRpdHMoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRvcF9oYXNoXCIpIGluZm8uc2V0VG9wQmxvY2tIYXNoKFwiXCIgPT09IHZhbCA/IHVuZGVmaW5lZCA6IHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBoYXJkIGZvcmsgaW5mbzogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gaW5mbztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjQ29ubmVjdGlvblNwYW4ocnBjQ29ubmVjdGlvblNwYW4pIHtcbiAgICBsZXQgc3BhbiA9IG5ldyBNb25lcm9Db25uZWN0aW9uU3BhbigpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNDb25uZWN0aW9uU3BhbikpIHtcbiAgICAgIGxldCB2YWwgPSBycGNDb25uZWN0aW9uU3BhbltrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJjb25uZWN0aW9uX2lkXCIpIHNwYW4uc2V0Q29ubmVjdGlvbklkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibmJsb2Nrc1wiKSBzcGFuLnNldE51bUJsb2Nrcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJhdGVcIikgc3Bhbi5zZXRSYXRlKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVtb3RlX2FkZHJlc3NcIikgeyBpZiAodmFsICE9PSBcIlwiKSBzcGFuLnNldFJlbW90ZUFkZHJlc3ModmFsKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNpemVcIikgc3Bhbi5zZXRTaXplKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3BlZWRcIikgc3Bhbi5zZXRTcGVlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXJ0X2Jsb2NrX2hlaWdodFwiKSBzcGFuLnNldFN0YXJ0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBkYWVtb24gY29ubmVjdGlvbiBzcGFuOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBzcGFuO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNPdXRwdXRIaXN0b2dyYW1FbnRyeShycGNFbnRyeSkge1xuICAgIGxldCBlbnRyeSA9IG5ldyBNb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeSgpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNFbnRyeSkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNFbnRyeVtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJhbW91bnRcIikgZW50cnkuc2V0QW1vdW50KEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0b3RhbF9pbnN0YW5jZXNcIikgZW50cnkuc2V0TnVtSW5zdGFuY2VzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5sb2NrZWRfaW5zdGFuY2VzXCIpIGVudHJ5LnNldE51bVVubG9ja2VkSW5zdGFuY2VzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVjZW50X2luc3RhbmNlc1wiKSBlbnRyeS5zZXROdW1SZWNlbnRJbnN0YW5jZXModmFsKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIG91dHB1dCBoaXN0b2dyYW06IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIGVudHJ5O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNTdWJtaXRUeFJlc3VsdChycGNSZXN1bHQpIHtcbiAgICBhc3NlcnQocnBjUmVzdWx0KTtcbiAgICBsZXQgcmVzdWx0ID0gbmV3IE1vbmVyb1N1Ym1pdFR4UmVzdWx0KCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1Jlc3VsdCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNSZXN1bHRba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiZG91YmxlX3NwZW5kXCIpIHJlc3VsdC5zZXRJc0RvdWJsZVNwZW5kU2Vlbih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImZlZV90b29fbG93XCIpIHJlc3VsdC5zZXRJc0ZlZVRvb0xvdyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImludmFsaWRfaW5wdXRcIikgcmVzdWx0LnNldEhhc0ludmFsaWRJbnB1dCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImludmFsaWRfb3V0cHV0XCIpIHJlc3VsdC5zZXRIYXNJbnZhbGlkT3V0cHV0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidG9vX2Zld19vdXRwdXRzXCIpIHJlc3VsdC5zZXRIYXNUb29GZXdPdXRwdXRzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibG93X21peGluXCIpIHJlc3VsdC5zZXRJc01peGluVG9vTG93KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibm90X3JlbGF5ZWRcIikgcmVzdWx0LnNldElzUmVsYXllZCghdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJvdmVyc3BlbmRcIikgcmVzdWx0LnNldElzT3ZlcnNwZW5kKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVhc29uXCIpIHJlc3VsdC5zZXRSZWFzb24odmFsID09PSBcIlwiID8gdW5kZWZpbmVkIDogdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0b29fYmlnXCIpIHJlc3VsdC5zZXRJc1Rvb0JpZyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNhbml0eV9jaGVja19mYWlsZWRcIikgcmVzdWx0LnNldFNhbml0eUNoZWNrRmFpbGVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3JlZGl0c1wiKSByZXN1bHQuc2V0Q3JlZGl0cyhCaWdJbnQodmFsKSlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGF0dXNcIiB8fCBrZXkgPT09IFwidW50cnVzdGVkXCIpIHt9ICAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRvcF9oYXNoXCIpIHJlc3VsdC5zZXRUb3BCbG9ja0hhc2goXCJcIiA9PT0gdmFsID8gdW5kZWZpbmVkIDogdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9leHRyYV90b29fYmlnXCIpIHJlc3VsdC5zZXRJc1R4RXh0cmFUb29CaWcodmFsKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIHN1Ym1pdCB0eCBoZXggcmVzdWx0OiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1R4UG9vbFN0YXRzKHJwY1N0YXRzKSB7XG4gICAgYXNzZXJ0KHJwY1N0YXRzKTtcbiAgICBsZXQgc3RhdHMgPSBuZXcgTW9uZXJvVHhQb29sU3RhdHMoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjU3RhdHMpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjU3RhdHNba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYnl0ZXNfbWF4XCIpIHN0YXRzLnNldEJ5dGVzTWF4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYnl0ZXNfbWVkXCIpIHN0YXRzLnNldEJ5dGVzTWVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYnl0ZXNfbWluXCIpIHN0YXRzLnNldEJ5dGVzTWluKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYnl0ZXNfdG90YWxcIikgc3RhdHMuc2V0Qnl0ZXNUb3RhbCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhpc3RvXzk4cGNcIikgc3RhdHMuc2V0SGlzdG85OHBjKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibnVtXzEwbVwiKSBzdGF0cy5zZXROdW0xMG0odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJudW1fZG91YmxlX3NwZW5kc1wiKSBzdGF0cy5zZXROdW1Eb3VibGVTcGVuZHModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJudW1fZmFpbGluZ1wiKSBzdGF0cy5zZXROdW1GYWlsaW5nKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibnVtX25vdF9yZWxheWVkXCIpIHN0YXRzLnNldE51bU5vdFJlbGF5ZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJvbGRlc3RcIikgc3RhdHMuc2V0T2xkZXN0VGltZXN0YW1wKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhzX3RvdGFsXCIpIHN0YXRzLnNldE51bVR4cyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImZlZV90b3RhbFwiKSBzdGF0cy5zZXRGZWVUb3RhbChCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGlzdG9cIikge1xuICAgICAgICBzdGF0cy5zZXRIaXN0byhuZXcgTWFwKCkpO1xuICAgICAgICBmb3IgKGxldCBlbGVtIG9mIHZhbCkgc3RhdHMuZ2V0SGlzdG8oKS5zZXQoZWxlbS5ieXRlcywgZWxlbS50eHMpO1xuICAgICAgfVxuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gdHggcG9vbCBzdGF0czogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cblxuICAgIC8vIHVuaW5pdGlhbGl6ZSBzb21lIHN0YXRzIGlmIG5vdCBhcHBsaWNhYmxlXG4gICAgaWYgKHN0YXRzLmdldEhpc3RvOThwYygpID09PSAwKSBzdGF0cy5zZXRIaXN0bzk4cGModW5kZWZpbmVkKTtcbiAgICBpZiAoc3RhdHMuZ2V0TnVtVHhzKCkgPT09IDApIHtcbiAgICAgIHN0YXRzLnNldEJ5dGVzTWluKHVuZGVmaW5lZCk7XG4gICAgICBzdGF0cy5zZXRCeXRlc01lZCh1bmRlZmluZWQpO1xuICAgICAgc3RhdHMuc2V0Qnl0ZXNNYXgodW5kZWZpbmVkKTtcbiAgICAgIHN0YXRzLnNldEhpc3RvOThwYyh1bmRlZmluZWQpO1xuICAgICAgc3RhdHMuc2V0T2xkZXN0VGltZXN0YW1wKHVuZGVmaW5lZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0YXRzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNBbHRDaGFpbihycGNDaGFpbikge1xuICAgIGFzc2VydChycGNDaGFpbik7XG4gICAgbGV0IGNoYWluID0gbmV3IE1vbmVyb0FsdENoYWluKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY0NoYWluKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY0NoYWluW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImJsb2NrX2hhc2hcIikge30gIC8vIHVzaW5nIGJsb2NrX2hhc2hlcyBpbnN0ZWFkXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGlmZmljdWx0eVwiKSB7IH0gLy8gaGFuZGxlZCBieSB3aWRlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5X3RvcDY0XCIpIHsgfSAgLy8gaGFuZGxlZCBieSB3aWRlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3aWRlX2RpZmZpY3VsdHlcIikgY2hhaW4uc2V0RGlmZmljdWx0eShHZW5VdGlscy5yZWNvbmNpbGUoY2hhaW4uZ2V0RGlmZmljdWx0eSgpLCBNb25lcm9EYWVtb25ScGMucHJlZml4ZWRIZXhUb0JJKHZhbCkpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJoZWlnaHRcIikgY2hhaW4uc2V0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibGVuZ3RoXCIpIGNoYWluLnNldExlbmd0aCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX2hhc2hlc1wiKSBjaGFpbi5zZXRCbG9ja0hhc2hlcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm1haW5fY2hhaW5fcGFyZW50X2Jsb2NrXCIpIGNoYWluLnNldE1haW5DaGFpblBhcmVudEJsb2NrSGFzaCh2YWwpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gYWx0ZXJuYXRpdmUgY2hhaW46IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIGNoYWluO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNQZWVyKHJwY1BlZXIpIHtcbiAgICBhc3NlcnQocnBjUGVlcik7XG4gICAgbGV0IHBlZXIgPSBuZXcgTW9uZXJvUGVlcigpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNQZWVyKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1BlZXJba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiaG9zdFwiKSBwZWVyLnNldEhvc3QodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJpZFwiKSBwZWVyLnNldElkKFwiXCIgKyB2YWwpOyAgLy8gVE9ETyBtb25lcm8td2FsbGV0LXJwYzogcGVlciBpZCBpcyBCaWdJbnQgYnV0IHN0cmluZyBpbiBgZ2V0X2Nvbm5lY3Rpb25zYFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImlwXCIpIHt9IC8vIGhvc3QgdXNlZCBpbnN0ZWFkIHdoaWNoIGlzIGNvbnNpc3RlbnRseSBhIHN0cmluZ1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxhc3Rfc2VlblwiKSBwZWVyLnNldExhc3RTZWVuVGltZXN0YW1wKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicG9ydFwiKSBwZWVyLnNldFBvcnQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJycGNfcG9ydFwiKSBwZWVyLnNldFJwY1BvcnQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwcnVuaW5nX3NlZWRcIikgcGVlci5zZXRQcnVuaW5nU2VlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJwY19jcmVkaXRzX3Blcl9oYXNoXCIpIHBlZXIuc2V0UnBjQ3JlZGl0c1Blckhhc2goQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gcnBjIHBlZXI6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIHBlZXI7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY0Nvbm5lY3Rpb24ocnBjQ29ubmVjdGlvbikge1xuICAgIGxldCBwZWVyID0gbmV3IE1vbmVyb1BlZXIoKTtcbiAgICBwZWVyLnNldElzT25saW5lKHRydWUpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNDb25uZWN0aW9uKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY0Nvbm5lY3Rpb25ba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYWRkcmVzc1wiKSBwZWVyLnNldEFkZHJlc3ModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhdmdfZG93bmxvYWRcIikgcGVlci5zZXRBdmdEb3dubG9hZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImF2Z191cGxvYWRcIikgcGVlci5zZXRBdmdVcGxvYWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjb25uZWN0aW9uX2lkXCIpIHBlZXIuc2V0SWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjdXJyZW50X2Rvd25sb2FkXCIpIHBlZXIuc2V0Q3VycmVudERvd25sb2FkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3VycmVudF91cGxvYWRcIikgcGVlci5zZXRDdXJyZW50VXBsb2FkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGVpZ2h0XCIpIHBlZXIuc2V0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaG9zdFwiKSBwZWVyLnNldEhvc3QodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJpcFwiKSB7fSAvLyBob3N0IHVzZWQgaW5zdGVhZCB3aGljaCBpcyBjb25zaXN0ZW50bHkgYSBzdHJpbmdcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJpbmNvbWluZ1wiKSBwZWVyLnNldElzSW5jb21pbmcodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsaXZlX3RpbWVcIikgcGVlci5zZXRMaXZlVGltZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxvY2FsX2lwXCIpIHBlZXIuc2V0SXNMb2NhbElwKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibG9jYWxob3N0XCIpIHBlZXIuc2V0SXNMb2NhbEhvc3QodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwZWVyX2lkXCIpIHBlZXIuc2V0SWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwb3J0XCIpIHBlZXIuc2V0UG9ydChwYXJzZUludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJycGNfcG9ydFwiKSBwZWVyLnNldFJwY1BvcnQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyZWN2X2NvdW50XCIpIHBlZXIuc2V0TnVtUmVjZWl2ZXModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyZWN2X2lkbGVfdGltZVwiKSBwZWVyLnNldFJlY2VpdmVJZGxlVGltZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNlbmRfY291bnRcIikgcGVlci5zZXROdW1TZW5kcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNlbmRfaWRsZV90aW1lXCIpIHBlZXIuc2V0U2VuZElkbGVUaW1lKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3RhdGVcIikgcGVlci5zZXRTdGF0ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN1cHBvcnRfZmxhZ3NcIikgcGVlci5zZXROdW1TdXBwb3J0RmxhZ3ModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwcnVuaW5nX3NlZWRcIikgcGVlci5zZXRQcnVuaW5nU2VlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJwY19jcmVkaXRzX3Blcl9oYXNoXCIpIHBlZXIuc2V0UnBjQ3JlZGl0c1Blckhhc2goQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFkZHJlc3NfdHlwZVwiKSBwZWVyLnNldFR5cGUodmFsKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIHBlZXI6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIHBlZXI7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFRvUnBjQmFuKGJhbjogTW9uZXJvQmFuKSB7XG4gICAgbGV0IHJwY0JhbjogYW55ID0ge307XG4gICAgcnBjQmFuLmhvc3QgPSBiYW4uZ2V0SG9zdCgpO1xuICAgIHJwY0Jhbi5pcCA9IGJhbi5nZXRJcCgpO1xuICAgIHJwY0Jhbi5iYW4gPSBiYW4uZ2V0SXNCYW5uZWQoKTtcbiAgICBycGNCYW4uc2Vjb25kcyA9IGJhbi5nZXRTZWNvbmRzKCk7XG4gICAgcmV0dXJuIHJwY0JhbjtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjTWluaW5nU3RhdHVzKHJwY1N0YXR1cykge1xuICAgIGxldCBzdGF0dXMgPSBuZXcgTW9uZXJvTWluaW5nU3RhdHVzKCk7XG4gICAgc3RhdHVzLnNldElzQWN0aXZlKHJwY1N0YXR1cy5hY3RpdmUpO1xuICAgIHN0YXR1cy5zZXRTcGVlZChycGNTdGF0dXMuc3BlZWQpO1xuICAgIHN0YXR1cy5zZXROdW1UaHJlYWRzKHJwY1N0YXR1cy50aHJlYWRzX2NvdW50KTtcbiAgICBpZiAocnBjU3RhdHVzLmFjdGl2ZSkge1xuICAgICAgc3RhdHVzLnNldEFkZHJlc3MocnBjU3RhdHVzLmFkZHJlc3MpO1xuICAgICAgc3RhdHVzLnNldElzQmFja2dyb3VuZChycGNTdGF0dXMuaXNfYmFja2dyb3VuZF9taW5pbmdfZW5hYmxlZCk7XG4gICAgfVxuICAgIHJldHVybiBzdGF0dXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1VwZGF0ZUNoZWNrUmVzdWx0KHJwY1Jlc3VsdCkge1xuICAgIGFzc2VydChycGNSZXN1bHQpO1xuICAgIGxldCByZXN1bHQgPSBuZXcgTW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjUmVzdWx0KSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1Jlc3VsdFtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJhdXRvX3VyaVwiKSByZXN1bHQuc2V0QXV0b1VyaSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhhc2hcIikgcmVzdWx0LnNldEhhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwYXRoXCIpIHt9IC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3RhdHVzXCIpIHt9IC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidXBkYXRlXCIpIHJlc3VsdC5zZXRJc1VwZGF0ZUF2YWlsYWJsZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVzZXJfdXJpXCIpIHJlc3VsdC5zZXRVc2VyVXJpKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidmVyc2lvblwiKSByZXN1bHQuc2V0VmVyc2lvbih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVudHJ1c3RlZFwiKSB7fSAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gcnBjIGNoZWNrIHVwZGF0ZSByZXN1bHQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgaWYgKHJlc3VsdC5nZXRBdXRvVXJpKCkgPT09IFwiXCIpIHJlc3VsdC5zZXRBdXRvVXJpKHVuZGVmaW5lZCk7XG4gICAgaWYgKHJlc3VsdC5nZXRVc2VyVXJpKCkgPT09IFwiXCIpIHJlc3VsdC5zZXRVc2VyVXJpKHVuZGVmaW5lZCk7XG4gICAgaWYgKHJlc3VsdC5nZXRWZXJzaW9uKCkgPT09IFwiXCIpIHJlc3VsdC5zZXRWZXJzaW9uKHVuZGVmaW5lZCk7XG4gICAgaWYgKHJlc3VsdC5nZXRIYXNoKCkgPT09IFwiXCIpIHJlc3VsdC5zZXRIYXNoKHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVXBkYXRlRG93bmxvYWRSZXN1bHQocnBjUmVzdWx0KSB7XG4gICAgbGV0IHJlc3VsdCA9IG5ldyBNb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdChNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1VwZGF0ZUNoZWNrUmVzdWx0KHJwY1Jlc3VsdCkgYXMgTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQpO1xuICAgIHJlc3VsdC5zZXREb3dubG9hZFBhdGgocnBjUmVzdWx0W1wicGF0aFwiXSk7XG4gICAgaWYgKHJlc3VsdC5nZXREb3dubG9hZFBhdGgoKSA9PT0gXCJcIikgcmVzdWx0LnNldERvd25sb2FkUGF0aCh1bmRlZmluZWQpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgYSAnMHgnIHByZWZpeGVkIGhleGlkZWNpbWFsIHN0cmluZyB0byBhIGJpZ2ludC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBoZXggaXMgdGhlICcweCcgcHJlZml4ZWQgaGV4aWRlY2ltYWwgc3RyaW5nIHRvIGNvbnZlcnRcbiAgICogQHJldHVybiB7YmlnaW50fSB0aGUgaGV4aWNlZGltYWwgY29udmVydGVkIHRvIGRlY2ltYWxcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgcHJlZml4ZWRIZXhUb0JJKGhleCkge1xuICAgIGFzc2VydChoZXguc3Vic3RyaW5nKDAsIDIpID09PSBcIjB4XCIpO1xuICAgIHJldHVybiBCaWdJbnQoaGV4KTtcbiAgfVxufVxuXG4vKipcbiAqIEltcGxlbWVudHMgYSBNb25lcm9EYWVtb24gYnkgcHJveHlpbmcgcmVxdWVzdHMgdG8gYSB3b3JrZXIuXG4gKiBcbiAqIEBwcml2YXRlXG4gKi9cbmNsYXNzIE1vbmVyb0RhZW1vblJwY1Byb3h5IHtcblxuICAvLyBzdGF0ZSB2YXJpYWJsZXNcbiAgcHJpdmF0ZSBkYWVtb25JZDogYW55O1xuICBwcml2YXRlIHdvcmtlcjogYW55O1xuICBwcml2YXRlIHdyYXBwZWRMaXN0ZW5lcnM6IGFueTtcbiAgcHJpdmF0ZSBwcm9jZXNzOiBhbnk7XG5cbiAgY29uc3RydWN0b3IoZGFlbW9uSWQsIHdvcmtlcikge1xuICAgIHRoaXMuZGFlbW9uSWQgPSBkYWVtb25JZDtcbiAgICB0aGlzLndvcmtlciA9IHdvcmtlcjtcbiAgICB0aGlzLndyYXBwZWRMaXN0ZW5lcnMgPSBbXTtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFNUQVRJQyBVVElMSVRJRVMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIHN0YXRpYyBhc3luYyBjb25uZWN0KGNvbmZpZykge1xuICAgIGxldCBkYWVtb25JZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICBjb25maWcgPSBPYmplY3QuYXNzaWduKHt9LCBjb25maWcsIHtwcm94eVRvV29ya2VyOiBmYWxzZX0pO1xuICAgIGF3YWl0IExpYnJhcnlVdGlscy5pbnZva2VXb3JrZXIoZGFlbW9uSWQsIFwiY29ubmVjdERhZW1vblJwY1wiLCBbY29uZmlnXSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9EYWVtb25ScGNQcm94eShkYWVtb25JZCwgYXdhaXQgTGlicmFyeVV0aWxzLmdldFdvcmtlcigpKTtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBJTlNUQU5DRSBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIGFzeW5jIGFkZExpc3RlbmVyKGxpc3RlbmVyKSB7XG4gICAgbGV0IHdyYXBwZWRMaXN0ZW5lciA9IG5ldyBEYWVtb25Xb3JrZXJMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgbGV0IGxpc3RlbmVySWQgPSB3cmFwcGVkTGlzdGVuZXIuZ2V0SWQoKTtcbiAgICBMaWJyYXJ5VXRpbHMuYWRkV29ya2VyQ2FsbGJhY2sodGhpcy5kYWVtb25JZCwgXCJvbkJsb2NrSGVhZGVyX1wiICsgbGlzdGVuZXJJZCwgW3dyYXBwZWRMaXN0ZW5lci5vbkJsb2NrSGVhZGVyLCB3cmFwcGVkTGlzdGVuZXJdKTtcbiAgICB0aGlzLndyYXBwZWRMaXN0ZW5lcnMucHVzaCh3cmFwcGVkTGlzdGVuZXIpO1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkFkZExpc3RlbmVyXCIsIFtsaXN0ZW5lcklkXSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndyYXBwZWRMaXN0ZW5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLndyYXBwZWRMaXN0ZW5lcnNbaV0uZ2V0TGlzdGVuZXIoKSA9PT0gbGlzdGVuZXIpIHtcbiAgICAgICAgbGV0IGxpc3RlbmVySWQgPSB0aGlzLndyYXBwZWRMaXN0ZW5lcnNbaV0uZ2V0SWQoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25SZW1vdmVMaXN0ZW5lclwiLCBbbGlzdGVuZXJJZF0pO1xuICAgICAgICBMaWJyYXJ5VXRpbHMucmVtb3ZlV29ya2VyQ2FsbGJhY2sodGhpcy5kYWVtb25JZCwgXCJvbkJsb2NrSGVhZGVyX1wiICsgbGlzdGVuZXJJZCk7XG4gICAgICAgIHRoaXMud3JhcHBlZExpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTGlzdGVuZXIgaXMgbm90IHJlZ2lzdGVyZWQgd2l0aCBkYWVtb25cIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldExpc3RlbmVycygpIHtcbiAgICBsZXQgbGlzdGVuZXJzID0gW107XG4gICAgZm9yIChsZXQgd3JhcHBlZExpc3RlbmVyIG9mIHRoaXMud3JhcHBlZExpc3RlbmVycykgbGlzdGVuZXJzLnB1c2god3JhcHBlZExpc3RlbmVyLmdldExpc3RlbmVyKCkpO1xuICAgIHJldHVybiBsaXN0ZW5lcnM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFJwY0Nvbm5lY3Rpb24oKSB7XG4gICAgbGV0IGNvbmZpZyA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0UnBjQ29ubmVjdGlvblwiKTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24oY29uZmlnIGFzIFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4pO1xuICB9XG4gIFxuICBhc3luYyBpc0Nvbm5lY3RlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25Jc0Nvbm5lY3RlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VmVyc2lvbigpIHtcbiAgICBsZXQgdmVyc2lvbkpzb246IGFueSA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0VmVyc2lvblwiKTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1ZlcnNpb24odmVyc2lvbkpzb24ubnVtYmVyLCB2ZXJzaW9uSnNvbi5pc1JlbGVhc2UpO1xuICB9XG4gIFxuICBhc3luYyBpc1RydXN0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uSXNUcnVzdGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRIZWlnaHQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0SGVpZ2h0XCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0hhc2goaGVpZ2h0KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tIYXNoXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrVGVtcGxhdGUod2FsbGV0QWRkcmVzcywgcmVzZXJ2ZVNpemUpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0Jsb2NrVGVtcGxhdGUoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja1RlbXBsYXRlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBnZXRMYXN0QmxvY2tIZWFkZXIoKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9CbG9ja0hlYWRlcihhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldExhc3RCbG9ja0hlYWRlclwiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrSGVhZGVyQnlIYXNoKGJsb2NrSGFzaCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja0hlYWRlckJ5SGFzaFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tIZWFkZXJCeUhlaWdodChoZWlnaHQpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tIZWFkZXJCeUhlaWdodFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tIZWFkZXJzQnlSYW5nZShzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSB7XG4gICAgbGV0IGJsb2NrSGVhZGVyc0pzb246IGFueVtdID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja0hlYWRlcnNCeVJhbmdlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkgYXMgYW55W107XG4gICAgbGV0IGhlYWRlcnMgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0hlYWRlckpzb24gb2YgYmxvY2tIZWFkZXJzSnNvbikgaGVhZGVycy5wdXNoKG5ldyBNb25lcm9CbG9ja0hlYWRlcihibG9ja0hlYWRlckpzb24pKTtcbiAgICByZXR1cm4gaGVhZGVycztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tCeUhhc2goYmxvY2tIYXNoKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9CbG9jayhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2NrQnlIYXNoXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSksIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFgpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja3NCeUhhc2goYmxvY2tIYXNoZXMsIHN0YXJ0SGVpZ2h0LCBwcnVuZSkge1xuICAgIGxldCBibG9ja3NKc29uOiBhbnlbXSA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tzQnlIYXNoXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkgYXMgYW55W107XG4gICAgbGV0IGJsb2NrcyA9IFtdO1xuICAgIGZvciAobGV0IGJsb2NrSnNvbiBvZiBibG9ja3NKc29uKSBibG9ja3MucHVzaChuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uKSk7XG4gICAgcmV0dXJuIGJsb2NrcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tCeUhlaWdodChoZWlnaHQpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0Jsb2NrKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tCeUhlaWdodFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpLCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tzQnlIZWlnaHQoaGVpZ2h0cykge1xuICAgIGxldCBibG9ja3NKc29uOiBhbnlbXT0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja3NCeUhlaWdodFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpIGFzIGFueVtdO1xuICAgIGxldCBibG9ja3MgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0pzb24gb2YgYmxvY2tzSnNvbikgYmxvY2tzLnB1c2gobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWCkpO1xuICAgIHJldHVybiBibG9ja3M7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2Nrc0J5UmFuZ2Uoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCkge1xuICAgIGxldCBibG9ja3NKc29uOiBhbnlbXSA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tzQnlSYW5nZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpIGFzIGFueVtdO1xuICAgIGxldCBibG9ja3MgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0pzb24gb2YgYmxvY2tzSnNvbikgYmxvY2tzLnB1c2gobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWCkpO1xuICAgIHJldHVybiBibG9ja3M7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2Nrc0J5UmFuZ2VDaHVua2VkKHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIG1heENodW5rU2l6ZSkge1xuICAgIGxldCBibG9ja3NKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja3NCeVJhbmdlQ2h1bmtlZFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpIGFzIGFueVtdO1xuICAgIGxldCBibG9ja3MgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0pzb24gb2YgYmxvY2tzSnNvbikgYmxvY2tzLnB1c2gobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWCkpO1xuICAgIHJldHVybiBibG9ja3M7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrSGFzaGVzKGJsb2NrSGFzaGVzLCBzdGFydEhlaWdodCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2NrSGFzaGVzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4cyh0eEhhc2hlcywgcHJ1bmUgPSBmYWxzZSkge1xuICAgIFxuICAgIC8vIGRlc2VyaWFsaXplIHR4cyBmcm9tIGJsb2Nrc1xuICAgIGxldCBibG9ja3MgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0pzb24gb2YgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRUeHNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSBhcyBhbnlbXSkge1xuICAgICAgYmxvY2tzLnB1c2gobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWCkpO1xuICAgIH1cbiAgICBcbiAgICAvLyBjb2xsZWN0IHR4c1xuICAgIGxldCB0eHMgPSBbXTtcbiAgICBmb3IgKGxldCBibG9jayBvZiBibG9ja3MpIHtcbiAgICAgIGZvciAobGV0IHR4IG9mIGJsb2NrLmdldFR4cygpKSB7XG4gICAgICAgIGlmICghdHguZ2V0SXNDb25maXJtZWQoKSkgdHguc2V0QmxvY2sodW5kZWZpbmVkKTtcbiAgICAgICAgdHhzLnB1c2godHgpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHhzO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeEhleGVzKHR4SGFzaGVzLCBwcnVuZSA9IGZhbHNlKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0VHhIZXhlc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRNaW5lclR4U3VtKGhlaWdodCwgbnVtQmxvY2tzKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9NaW5lclR4U3VtKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0TWluZXJUeFN1bVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RmVlRXN0aW1hdGUoZ3JhY2VCbG9ja3M/KSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9GZWVFc3RpbWF0ZShhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEZlZUVzdGltYXRlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBzdWJtaXRUeEhleCh0eEhleCwgZG9Ob3RSZWxheSkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvU3VibWl0VHhSZXN1bHQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TdWJtaXRUeEhleFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVsYXlUeHNCeUhhc2godHhIYXNoZXMpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25SZWxheVR4c0J5SGFzaFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFBvb2woKSB7XG4gICAgbGV0IGJsb2NrSnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0VHhQb29sXCIpO1xuICAgIGxldCB0eHMgPSBuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uLCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYKS5nZXRUeHMoKTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHR4LnNldEJsb2NrKHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIHR4cyA/IHR4cyA6IFtdO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFBvb2xIYXNoZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0VHhQb29sSGFzaGVzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4UG9vbEJhY2tsb2coKSB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFBvb2xTdGF0cygpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1R4UG9vbFN0YXRzKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0VHhQb29sU3RhdHNcIikpO1xuICB9XG4gIFxuICBhc3luYyBmbHVzaFR4UG9vbChoYXNoZXMpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25GbHVzaFR4UG9vbFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRLZXlJbWFnZVNwZW50U3RhdHVzZXMoa2V5SW1hZ2VzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dHMob3V0cHV0cyk6IFByb21pc2U8TW9uZXJvT3V0cHV0W10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dEhpc3RvZ3JhbShhbW91bnRzLCBtaW5Db3VudCwgbWF4Q291bnQsIGlzVW5sb2NrZWQsIHJlY2VudEN1dG9mZikge1xuICAgIGxldCBlbnRyaWVzID0gW107XG4gICAgZm9yIChsZXQgZW50cnlKc29uIG9mIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0T3V0cHV0SGlzdG9ncmFtXCIsIFthbW91bnRzLCBtaW5Db3VudCwgbWF4Q291bnQsIGlzVW5sb2NrZWQsIHJlY2VudEN1dG9mZl0pIGFzIGFueVtdKSB7XG4gICAgICBlbnRyaWVzLnB1c2gobmV3IE1vbmVyb091dHB1dEhpc3RvZ3JhbUVudHJ5KGVudHJ5SnNvbikpO1xuICAgIH1cbiAgICByZXR1cm4gZW50cmllcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0T3V0cHV0RGlzdHJpYnV0aW9uKGFtb3VudHMsIGN1bXVsYXRpdmUsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpIHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEluZm8oKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9EYWVtb25JbmZvKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0SW5mb1wiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFN5bmNJbmZvKCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvRGFlbW9uU3luY0luZm8oYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRTeW5jSW5mb1wiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhhcmRGb3JrSW5mbygpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0hhcmRGb3JrSW5mbyhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEhhcmRGb3JrSW5mb1wiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFsdENoYWlucygpIHtcbiAgICBsZXQgYWx0Q2hhaW5zID0gW107XG4gICAgZm9yIChsZXQgYWx0Q2hhaW5Kc29uIG9mIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QWx0Q2hhaW5zXCIpIGFzIGFueSkgYWx0Q2hhaW5zLnB1c2gobmV3IE1vbmVyb0FsdENoYWluKGFsdENoYWluSnNvbikpO1xuICAgIHJldHVybiBhbHRDaGFpbnM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFsdEJsb2NrSGFzaGVzKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEFsdEJsb2NrSGFzaGVzXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXREb3dubG9hZExpbWl0KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldERvd25sb2FkTGltaXRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIHNldERvd25sb2FkTGltaXQobGltaXQpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TZXREb3dubG9hZExpbWl0XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2V0RG93bmxvYWRMaW1pdCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25SZXNldERvd25sb2FkTGltaXRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFVwbG9hZExpbWl0KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFVwbG9hZExpbWl0XCIpO1xuICB9XG4gIFxuICBhc3luYyBzZXRVcGxvYWRMaW1pdChsaW1pdCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblNldFVwbG9hZExpbWl0XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2V0VXBsb2FkTGltaXQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uUmVzZXRVcGxvYWRMaW1pdFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGVlcnMoKSB7XG4gICAgbGV0IHBlZXJzID0gW107XG4gICAgZm9yIChsZXQgcGVlckpzb24gb2YgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRQZWVyc1wiKSBhcyBhbnkpIHBlZXJzLnB1c2gobmV3IE1vbmVyb1BlZXIocGVlckpzb24pKTtcbiAgICByZXR1cm4gcGVlcnM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEtub3duUGVlcnMoKSB7XG4gICAgbGV0IHBlZXJzID0gW107XG4gICAgZm9yIChsZXQgcGVlckpzb24gb2YgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRLbm93blBlZXJzXCIpIGFzIGFueSkgcGVlcnMucHVzaChuZXcgTW9uZXJvUGVlcihwZWVySnNvbikpO1xuICAgIHJldHVybiBwZWVycztcbiAgfVxuICBcbiAgYXN5bmMgc2V0T3V0Z29pbmdQZWVyTGltaXQobGltaXQpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TZXRJbmNvbWluZ1BlZXJMaW1pdFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBzZXRJbmNvbWluZ1BlZXJMaW1pdChsaW1pdCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblNldEluY29taW5nUGVlckxpbWl0XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBlZXJCYW5zKCkge1xuICAgIGxldCBiYW5zID0gW107XG4gICAgZm9yIChsZXQgYmFuSnNvbiBvZiBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFBlZXJCYW5zXCIpIGFzIGFueSkgYmFucy5wdXNoKG5ldyBNb25lcm9CYW4oYmFuSnNvbikpO1xuICAgIHJldHVybiBiYW5zO1xuICB9XG5cbiAgYXN5bmMgc2V0UGVlckJhbnMoYmFucykge1xuICAgIGxldCBiYW5zSnNvbiA9IFtdO1xuICAgIGZvciAobGV0IGJhbiBvZiBiYW5zKSBiYW5zSnNvbi5wdXNoKGJhbi50b0pzb24oKSk7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uU2V0UGVlckJhbnNcIiwgW2JhbnNKc29uXSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0YXJ0TWluaW5nKGFkZHJlc3MsIG51bVRocmVhZHMsIGlzQmFja2dyb3VuZCwgaWdub3JlQmF0dGVyeSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblN0YXJ0TWluaW5nXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0b3BNaW5pbmcoKSB7XG4gICAgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TdG9wTWluaW5nXCIpXG4gIH1cbiAgXG4gIGFzeW5jIGdldE1pbmluZ1N0YXR1cygpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb01pbmluZ1N0YXR1cyhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldE1pbmluZ1N0YXR1c1wiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdEJsb2NrcyhibG9ja0Jsb2JzKSB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICB9XG5cbiAgYXN5bmMgcHJ1bmVCbG9ja2NoYWluKGNoZWNrKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9QcnVuZVJlc3VsdChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblBydW5lQmxvY2tjaGFpblwiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrRm9yVXBkYXRlKCk6IFByb21pc2U8TW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGRvd25sb2FkVXBkYXRlKHBhdGgpOiBQcm9taXNlPE1vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBzdG9wKCkge1xuICAgIHdoaWxlICh0aGlzLndyYXBwZWRMaXN0ZW5lcnMubGVuZ3RoKSBhd2FpdCB0aGlzLnJlbW92ZUxpc3RlbmVyKHRoaXMud3JhcHBlZExpc3RlbmVyc1swXS5nZXRMaXN0ZW5lcigpKTtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TdG9wXCIpO1xuICB9XG4gIFxuICBhc3luYyB3YWl0Rm9yTmV4dEJsb2NrSGVhZGVyKCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25XYWl0Rm9yTmV4dEJsb2NrSGVhZGVyXCIpKTtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFBSSVZBVEUgSEVMUEVSUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIC8vIFRPRE86IGR1cGxpY2F0ZWQgd2l0aCBNb25lcm9XYWxsZXRGdWxsUHJveHlcbiAgcHJvdGVjdGVkIGFzeW5jIGludm9rZVdvcmtlcihmbk5hbWU6IHN0cmluZywgYXJncz86IGFueSkge1xuICAgIHJldHVybiBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKHRoaXMuZGFlbW9uSWQsIGZuTmFtZSwgYXJncyk7XG4gIH1cbn1cblxuLyoqXG4gKiBQb2xscyBhIE1vbmVybyBkYWVtb24gZm9yIHVwZGF0ZXMgYW5kIG5vdGlmaWVzIGxpc3RlbmVycyBhcyB0aGV5IG9jY3VyLlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBEYWVtb25Qb2xsZXIge1xuXG4gIHByb3RlY3RlZCBkYWVtb246IE1vbmVyb0RhZW1vblJwYztcbiAgcHJvdGVjdGVkIGxvb3BlcjogVGFza0xvb3BlcjtcbiAgcHJvdGVjdGVkIGlzUG9sbGluZzogYm9vbGVhbjtcbiAgcHJvdGVjdGVkIGxhc3RIZWFkZXI6IE1vbmVyb0Jsb2NrSGVhZGVyO1xuXG4gIGNvbnN0cnVjdG9yKGRhZW1vbikge1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICB0aGlzLmRhZW1vbiA9IGRhZW1vbjtcbiAgICB0aGlzLmxvb3BlciA9IG5ldyBUYXNrTG9vcGVyKGFzeW5jIGZ1bmN0aW9uKCkgeyBhd2FpdCB0aGF0LnBvbGwoKTsgfSk7XG4gIH1cbiAgXG4gIHNldElzUG9sbGluZyhpc1BvbGxpbmc6IGJvb2xlYW4pIHtcbiAgICB0aGlzLmlzUG9sbGluZyA9IGlzUG9sbGluZztcbiAgICBpZiAoaXNQb2xsaW5nKSB0aGlzLmxvb3Blci5zdGFydCh0aGlzLmRhZW1vbi5nZXRQb2xsSW50ZXJ2YWwoKSk7XG4gICAgZWxzZSB0aGlzLmxvb3Blci5zdG9wKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHBvbGwoKSB7XG4gICAgdHJ5IHtcbiAgICAgIFxuICAgICAgLy8gZ2V0IGxhdGVzdCBibG9jayBoZWFkZXJcbiAgICAgIGxldCBoZWFkZXIgPSBhd2FpdCB0aGlzLmRhZW1vbi5nZXRMYXN0QmxvY2tIZWFkZXIoKTtcbiAgICAgIFxuICAgICAgLy8gc2F2ZSBmaXJzdCBoZWFkZXIgZm9yIGNvbXBhcmlzb25cbiAgICAgIGlmICghdGhpcy5sYXN0SGVhZGVyKSB7XG4gICAgICAgIHRoaXMubGFzdEhlYWRlciA9IGF3YWl0IHRoaXMuZGFlbW9uLmdldExhc3RCbG9ja0hlYWRlcigpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIGNvbXBhcmUgaGVhZGVyIHRvIGxhc3RcbiAgICAgIGlmIChoZWFkZXIuZ2V0SGFzaCgpICE9PSB0aGlzLmxhc3RIZWFkZXIuZ2V0SGFzaCgpKSB7XG4gICAgICAgIHRoaXMubGFzdEhlYWRlciA9IGhlYWRlcjtcbiAgICAgICAgYXdhaXQgdGhpcy5hbm5vdW5jZUJsb2NrSGVhZGVyKGhlYWRlcik7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGJhY2tncm91bmQgcG9sbCBkYWVtb24gaGVhZGVyXCIpO1xuICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgIH1cbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBhbm5vdW5jZUJsb2NrSGVhZGVyKGhlYWRlcjogTW9uZXJvQmxvY2tIZWFkZXIpIHtcbiAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiBhd2FpdCB0aGlzLmRhZW1vbi5nZXRMaXN0ZW5lcnMoKSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgbGlzdGVuZXIub25CbG9ja0hlYWRlcihoZWFkZXIpOyAvLyBub3RpZnkgbGlzdGVuZXJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgY2FsbGluZyBsaXN0ZW5lciBvbiBibG9jayBoZWFkZXJcIiwgZXJyKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBJbnRlcm5hbCBsaXN0ZW5lciB0byBicmlkZ2Ugbm90aWZpY2F0aW9ucyB0byBleHRlcm5hbCBsaXN0ZW5lcnMuXG4gKiBcbiAqIEBwcml2YXRlXG4gKi9cbmNsYXNzIERhZW1vbldvcmtlckxpc3RlbmVyIHtcblxuICBwcm90ZWN0ZWQgaWQ6IGFueTtcbiAgcHJvdGVjdGVkIGxpc3RlbmVyOiBhbnk7XG5cbiAgY29uc3RydWN0b3IobGlzdGVuZXIpIHtcbiAgICB0aGlzLmlkID0gR2VuVXRpbHMuZ2V0VVVJRCgpO1xuICAgIHRoaXMubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgfVxuICBcbiAgZ2V0SWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaWQ7XG4gIH1cbiAgXG4gIGdldExpc3RlbmVyKCkge1xuICAgIHJldHVybiB0aGlzLmxpc3RlbmVyO1xuICB9XG4gIFxuICBhc3luYyBvbkJsb2NrSGVhZGVyKGhlYWRlckpzb24pIHtcbiAgICB0aGlzLmxpc3RlbmVyLm9uQmxvY2tIZWFkZXIobmV3IE1vbmVyb0Jsb2NrSGVhZGVyKGhlYWRlckpzb24pKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBNb25lcm9EYWVtb25ScGM7XG4iXSwibWFwcGluZ3MiOiJ5TEFBQSxJQUFBQSxPQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9B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