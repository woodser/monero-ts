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
    return new Promise(function (resolve, reject) {

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
        reject(err);
      });
    });
  }

  static normalizeConfig(uriOrConfig, username, password) {
    let config = undefined;
    if (typeof uriOrConfig === "string") {
      config = new _MoneroDaemonConfig.default({ server: new _MoneroRpcConnection.default(uriOrConfig, username, password) });
    } else if (uriOrConfig.uri !== undefined) {
      config = new _MoneroDaemonConfig.default({ server: new _MoneroRpcConnection.default(uriOrConfig) });

      // transfer worker proxy setting from rpc connection to daemon config
      config.setProxyToWorker(config.proxyToWorker);
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
        for (let listener of await this.daemon.getListeners()) {
          await listener.onBlockHeader(header); // notify listener
        }
      }
    } catch (err) {
      console.error("Failed to background poll daemon header");
      console.error(err);
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
    return this.listener.onBlockHeader(new _MoneroBlockHeader.default(headerJson));
  }
}var _default = exports.default =

MoneroDaemonRpc;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX1Rhc2tMb29wZXIiLCJfTW9uZXJvQWx0Q2hhaW4iLCJfTW9uZXJvQmFuIiwiX01vbmVyb0Jsb2NrIiwiX01vbmVyb0Jsb2NrSGVhZGVyIiwiX01vbmVyb0Jsb2NrVGVtcGxhdGUiLCJfTW9uZXJvQ29ubmVjdGlvblNwYW4iLCJfTW9uZXJvRGFlbW9uIiwiX01vbmVyb0RhZW1vbkNvbmZpZyIsIl9Nb25lcm9EYWVtb25JbmZvIiwiX01vbmVyb0RhZW1vbkxpc3RlbmVyIiwiX01vbmVyb0RhZW1vblN5bmNJbmZvIiwiX01vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0IiwiX01vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0IiwiX01vbmVyb0ZlZUVzdGltYXRlIiwiX01vbmVyb0Vycm9yIiwiX01vbmVyb0hhcmRGb3JrSW5mbyIsIl9Nb25lcm9LZXlJbWFnZSIsIl9Nb25lcm9NaW5lclR4U3VtIiwiX01vbmVyb01pbmluZ1N0YXR1cyIsIl9Nb25lcm9OZXR3b3JrVHlwZSIsIl9Nb25lcm9PdXRwdXQiLCJfTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkiLCJfTW9uZXJvUGVlciIsIl9Nb25lcm9QcnVuZVJlc3VsdCIsIl9Nb25lcm9ScGNDb25uZWN0aW9uIiwiX01vbmVyb1N1Ym1pdFR4UmVzdWx0IiwiX01vbmVyb1R4IiwiX01vbmVyb1R4UG9vbFN0YXRzIiwiX01vbmVyb1V0aWxzIiwiX01vbmVyb1ZlcnNpb24iLCJNb25lcm9EYWVtb25ScGMiLCJNb25lcm9EYWVtb24iLCJNQVhfUkVRX1NJWkUiLCJERUZBVUxUX0lEIiwiTlVNX0hFQURFUlNfUEVSX1JFUSIsIkRFRkFVTFRfUE9MTF9QRVJJT0QiLCJjb25zdHJ1Y3RvciIsImNvbmZpZyIsInByb3h5RGFlbW9uIiwicHJveHlUb1dvcmtlciIsImxpc3RlbmVycyIsImNhY2hlZEhlYWRlcnMiLCJnZXRQcm9jZXNzIiwicHJvY2VzcyIsInN0b3BQcm9jZXNzIiwiZm9yY2UiLCJ1bmRlZmluZWQiLCJNb25lcm9FcnJvciIsImxpc3RlbmVyc0NvcHkiLCJHZW5VdGlscyIsImNvcHlBcnJheSIsImdldExpc3RlbmVycyIsImxpc3RlbmVyIiwicmVtb3ZlTGlzdGVuZXIiLCJraWxsUHJvY2VzcyIsImFkZExpc3RlbmVyIiwiYXNzZXJ0IiwiTW9uZXJvRGFlbW9uTGlzdGVuZXIiLCJwdXNoIiwicmVmcmVzaExpc3RlbmluZyIsImlkeCIsImluZGV4T2YiLCJzcGxpY2UiLCJnZXRScGNDb25uZWN0aW9uIiwiZ2V0U2VydmVyIiwiaXNDb25uZWN0ZWQiLCJnZXRWZXJzaW9uIiwiZSIsInJlc3AiLCJzZW5kSnNvblJlcXVlc3QiLCJjaGVja1Jlc3BvbnNlU3RhdHVzIiwicmVzdWx0IiwiTW9uZXJvVmVyc2lvbiIsInZlcnNpb24iLCJyZWxlYXNlIiwiaXNUcnVzdGVkIiwic2VuZFBhdGhSZXF1ZXN0IiwidW50cnVzdGVkIiwiZ2V0SGVpZ2h0IiwiY291bnQiLCJnZXRCbG9ja0hhc2giLCJoZWlnaHQiLCJnZXRCbG9ja1RlbXBsYXRlIiwid2FsbGV0QWRkcmVzcyIsInJlc2VydmVTaXplIiwid2FsbGV0X2FkZHJlc3MiLCJyZXNlcnZlX3NpemUiLCJjb252ZXJ0UnBjQmxvY2tUZW1wbGF0ZSIsImdldExhc3RCbG9ja0hlYWRlciIsImNvbnZlcnRScGNCbG9ja0hlYWRlciIsImJsb2NrX2hlYWRlciIsImdldEJsb2NrSGVhZGVyQnlIYXNoIiwiYmxvY2tIYXNoIiwiaGFzaCIsImdldEJsb2NrSGVhZGVyQnlIZWlnaHQiLCJnZXRCbG9ja0hlYWRlcnNCeVJhbmdlIiwic3RhcnRIZWlnaHQiLCJlbmRIZWlnaHQiLCJzdGFydF9oZWlnaHQiLCJlbmRfaGVpZ2h0IiwiaGVhZGVycyIsInJwY0hlYWRlciIsImdldEJsb2NrQnlIYXNoIiwiY29udmVydFJwY0Jsb2NrIiwiZ2V0QmxvY2tCeUhlaWdodCIsImdldEJsb2Nrc0J5SGVpZ2h0IiwiaGVpZ2h0cyIsInJlc3BCaW4iLCJzZW5kQmluYXJ5UmVxdWVzdCIsInJwY0Jsb2NrcyIsIk1vbmVyb1V0aWxzIiwiYmluYXJ5QmxvY2tzVG9Kc29uIiwiZXF1YWwiLCJ0eHMiLCJsZW5ndGgiLCJibG9ja3MiLCJibG9ja0lkeCIsImJsb2NrIiwic2V0SGVpZ2h0IiwidHhJZHgiLCJ0eCIsIk1vbmVyb1R4Iiwic2V0SGFzaCIsInR4X2hhc2hlcyIsInNldElzQ29uZmlybWVkIiwic2V0SW5UeFBvb2wiLCJzZXRJc01pbmVyVHgiLCJzZXRSZWxheSIsInNldElzUmVsYXllZCIsInNldElzRmFpbGVkIiwic2V0SXNEb3VibGVTcGVuZFNlZW4iLCJjb252ZXJ0UnBjVHgiLCJzZXRUeHMiLCJnZXRCbG9jayIsIm1lcmdlIiwiZ2V0VHhzIiwic2V0QmxvY2siLCJnZXRCbG9ja3NCeVJhbmdlIiwiZ2V0QmxvY2tzQnlSYW5nZUNodW5rZWQiLCJtYXhDaHVua1NpemUiLCJsYXN0SGVpZ2h0IiwiZ2V0TWF4QmxvY2tzIiwidHhIYXNoZXMiLCJwcnVuZSIsIkFycmF5IiwiaXNBcnJheSIsInR4c19oYXNoZXMiLCJkZWNvZGVfYXNfanNvbiIsIm1lc3NhZ2UiLCJnZXRUeEhleGVzIiwiaGV4ZXMiLCJnZXRQcnVuZWRIZXgiLCJnZXRGdWxsSGV4IiwiZ2V0TWluZXJUeFN1bSIsIm51bUJsb2NrcyIsInR4U3VtIiwiTW9uZXJvTWluZXJUeFN1bSIsInNldEVtaXNzaW9uU3VtIiwiQmlnSW50IiwiZW1pc3Npb25fYW1vdW50Iiwic2V0RmVlU3VtIiwiZmVlX2Ftb3VudCIsImdldEZlZUVzdGltYXRlIiwiZ3JhY2VCbG9ja3MiLCJncmFjZV9ibG9ja3MiLCJmZWVFc3RpbWF0ZSIsIk1vbmVyb0ZlZUVzdGltYXRlIiwic2V0RmVlIiwiZmVlIiwiZmVlcyIsImkiLCJzZXRGZWVzIiwic2V0UXVhbnRpemF0aW9uTWFzayIsInF1YW50aXphdGlvbl9tYXNrIiwic3VibWl0VHhIZXgiLCJ0eEhleCIsImRvTm90UmVsYXkiLCJ0eF9hc19oZXgiLCJkb19ub3RfcmVsYXkiLCJjb252ZXJ0UnBjU3VibWl0VHhSZXN1bHQiLCJzZXRJc0dvb2QiLCJyZWxheVR4c0J5SGFzaCIsInR4aWRzIiwiZ2V0VHhQb29sIiwidHJhbnNhY3Rpb25zIiwicnBjVHgiLCJzZXROdW1Db25maXJtYXRpb25zIiwiZ2V0VHhQb29sSGFzaGVzIiwiZ2V0VHhQb29sU3RhdHMiLCJjb252ZXJ0UnBjVHhQb29sU3RhdHMiLCJwb29sX3N0YXRzIiwiZmx1c2hUeFBvb2wiLCJoYXNoZXMiLCJsaXN0aWZ5IiwiZ2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzIiwia2V5SW1hZ2VzIiwia2V5X2ltYWdlcyIsInNwZW50X3N0YXR1cyIsImdldE91dHB1dEhpc3RvZ3JhbSIsImFtb3VudHMiLCJtaW5Db3VudCIsIm1heENvdW50IiwiaXNVbmxvY2tlZCIsInJlY2VudEN1dG9mZiIsIm1pbl9jb3VudCIsIm1heF9jb3VudCIsInVubG9ja2VkIiwicmVjZW50X2N1dG9mZiIsImVudHJpZXMiLCJoaXN0b2dyYW0iLCJycGNFbnRyeSIsImNvbnZlcnRScGNPdXRwdXRIaXN0b2dyYW1FbnRyeSIsImdldE91dHB1dERpc3RyaWJ1dGlvbiIsImN1bXVsYXRpdmUiLCJnZXRJbmZvIiwiY29udmVydFJwY0luZm8iLCJnZXRTeW5jSW5mbyIsImNvbnZlcnRScGNTeW5jSW5mbyIsImdldEhhcmRGb3JrSW5mbyIsImNvbnZlcnRScGNIYXJkRm9ya0luZm8iLCJnZXRBbHRDaGFpbnMiLCJjaGFpbnMiLCJycGNDaGFpbiIsImNvbnZlcnRScGNBbHRDaGFpbiIsImdldEFsdEJsb2NrSGFzaGVzIiwiYmxrc19oYXNoZXMiLCJnZXREb3dubG9hZExpbWl0IiwiZ2V0QmFuZHdpZHRoTGltaXRzIiwic2V0RG93bmxvYWRMaW1pdCIsImxpbWl0IiwicmVzZXREb3dubG9hZExpbWl0IiwiaXNJbnQiLCJzZXRCYW5kd2lkdGhMaW1pdHMiLCJnZXRVcGxvYWRMaW1pdCIsInNldFVwbG9hZExpbWl0IiwicmVzZXRVcGxvYWRMaW1pdCIsImdldFBlZXJzIiwicGVlcnMiLCJjb25uZWN0aW9ucyIsInJwY0Nvbm5lY3Rpb24iLCJjb252ZXJ0UnBjQ29ubmVjdGlvbiIsImdldEtub3duUGVlcnMiLCJncmF5X2xpc3QiLCJycGNQZWVyIiwicGVlciIsImNvbnZlcnRScGNQZWVyIiwic2V0SXNPbmxpbmUiLCJ3aGl0ZV9saXN0Iiwic2V0T3V0Z29pbmdQZWVyTGltaXQiLCJvdXRfcGVlcnMiLCJzZXRJbmNvbWluZ1BlZXJMaW1pdCIsImluX3BlZXJzIiwiZ2V0UGVlckJhbnMiLCJiYW5zIiwicnBjQmFuIiwiYmFuIiwiTW9uZXJvQmFuIiwic2V0SG9zdCIsImhvc3QiLCJzZXRJcCIsImlwIiwic2V0U2Vjb25kcyIsInNlY29uZHMiLCJzZXRQZWVyQmFucyIsInJwY0JhbnMiLCJjb252ZXJ0VG9ScGNCYW4iLCJzdGFydE1pbmluZyIsImFkZHJlc3MiLCJudW1UaHJlYWRzIiwiaXNCYWNrZ3JvdW5kIiwiaWdub3JlQmF0dGVyeSIsIm1pbmVyX2FkZHJlc3MiLCJ0aHJlYWRzX2NvdW50IiwiZG9fYmFja2dyb3VuZF9taW5pbmciLCJpZ25vcmVfYmF0dGVyeSIsInN0b3BNaW5pbmciLCJnZXRNaW5pbmdTdGF0dXMiLCJjb252ZXJ0UnBjTWluaW5nU3RhdHVzIiwic3VibWl0QmxvY2tzIiwiYmxvY2tCbG9icyIsInBydW5lQmxvY2tjaGFpbiIsImNoZWNrIiwiTW9uZXJvUHJ1bmVSZXN1bHQiLCJzZXRJc1BydW5lZCIsInBydW5lZCIsInNldFBydW5pbmdTZWVkIiwicHJ1bmluZ19zZWVkIiwiY2hlY2tGb3JVcGRhdGUiLCJjb21tYW5kIiwiY29udmVydFJwY1VwZGF0ZUNoZWNrUmVzdWx0IiwiZG93bmxvYWRVcGRhdGUiLCJwYXRoIiwiY29udmVydFJwY1VwZGF0ZURvd25sb2FkUmVzdWx0Iiwic3RvcCIsIndhaXRGb3JOZXh0QmxvY2tIZWFkZXIiLCJ0aGF0IiwiUHJvbWlzZSIsInJlc29sdmUiLCJvbkJsb2NrSGVhZGVyIiwiaGVhZGVyIiwiZ2V0UG9sbEludGVydmFsIiwicG9sbEludGVydmFsIiwiZ2V0VHgiLCJ0eEhhc2giLCJnZXRUeEhleCIsImdldEtleUltYWdlU3BlbnRTdGF0dXMiLCJrZXlJbWFnZSIsInNldFBlZXJCYW4iLCJzdWJtaXRCbG9jayIsImJsb2NrQmxvYiIsInBvbGxMaXN0ZW5lciIsIkRhZW1vblBvbGxlciIsInNldElzUG9sbGluZyIsImxpbWl0X2Rvd24iLCJsaW1pdF91cCIsImRvd25MaW1pdCIsInVwTGltaXQiLCJtYXhIZWlnaHQiLCJtYXhSZXFTaXplIiwicmVxU2l6ZSIsImdldEJsb2NrSGVhZGVyQnlIZWlnaHRDYWNoZWQiLCJnZXRTaXplIiwiY2FjaGVkSGVhZGVyIiwiTWF0aCIsIm1pbiIsImNvbm5lY3RUb0RhZW1vblJwYyIsInVyaU9yQ29uZmlnIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsIm5vcm1hbGl6ZUNvbmZpZyIsImNtZCIsInN0YXJ0TW9uZXJvZFByb2Nlc3MiLCJNb25lcm9EYWVtb25ScGNQcm94eSIsImNvbm5lY3QiLCJzcGF3biIsInNsaWNlIiwic3Rkb3V0Iiwic2V0RW5jb2RpbmciLCJzdGRlcnIiLCJ1cmkiLCJvdXRwdXQiLCJyZWplY3QiLCJvbiIsImRhdGEiLCJsaW5lIiwidG9TdHJpbmciLCJMaWJyYXJ5VXRpbHMiLCJsb2ciLCJ1cmlMaW5lQ29udGFpbnMiLCJ1cmlMaW5lQ29udGFpbnNJZHgiLCJzdWJzdHJpbmciLCJsYXN0SW5kZXhPZiIsInVuZm9ybWF0dGVkTGluZSIsInJlcGxhY2UiLCJ0cmltIiwicG9ydCIsInNzbElkeCIsInNzbEVuYWJsZWQiLCJ0b0xvd2VyQ2FzZSIsInVzZXJQYXNzSWR4IiwidXNlclBhc3MiLCJjb3B5Iiwic2V0U2VydmVyIiwicmVqZWN0VW5hdXRob3JpemVkIiwiZ2V0UmVqZWN0VW5hdXRob3JpemVkIiwic2V0UHJveHlUb1dvcmtlciIsImRhZW1vbiIsImlzUmVzb2x2ZWQiLCJnZXRMb2dMZXZlbCIsImNvbnNvbGUiLCJlcnJvciIsImNvZGUiLCJFcnJvciIsImVyciIsIm9yaWdpbiIsIk1vbmVyb0RhZW1vbkNvbmZpZyIsInNlcnZlciIsIk1vbmVyb1JwY0Nvbm5lY3Rpb24iLCJERUZBVUxUX0NPTkZJRyIsInN0YXR1cyIsIk1vbmVyb0Jsb2NrSGVhZGVyIiwia2V5IiwiT2JqZWN0Iiwia2V5cyIsInZhbCIsInNhZmVTZXQiLCJzZXRTaXplIiwiZ2V0RGVwdGgiLCJzZXREZXB0aCIsInNldERpZmZpY3VsdHkiLCJyZWNvbmNpbGUiLCJnZXREaWZmaWN1bHR5IiwicHJlZml4ZWRIZXhUb0JJIiwic2V0Q3VtdWxhdGl2ZURpZmZpY3VsdHkiLCJnZXRDdW11bGF0aXZlRGlmZmljdWx0eSIsImdldEhhc2giLCJnZXRNYWpvclZlcnNpb24iLCJzZXRNYWpvclZlcnNpb24iLCJnZXRNaW5vclZlcnNpb24iLCJzZXRNaW5vclZlcnNpb24iLCJnZXROb25jZSIsInNldE5vbmNlIiwiZ2V0TnVtVHhzIiwic2V0TnVtVHhzIiwiZ2V0T3JwaGFuU3RhdHVzIiwic2V0T3JwaGFuU3RhdHVzIiwiZ2V0UHJldkhhc2giLCJzZXRQcmV2SGFzaCIsImdldFJld2FyZCIsInNldFJld2FyZCIsImdldFRpbWVzdGFtcCIsInNldFRpbWVzdGFtcCIsImdldFdlaWdodCIsInNldFdlaWdodCIsImdldExvbmdUZXJtV2VpZ2h0Iiwic2V0TG9uZ1Rlcm1XZWlnaHQiLCJnZXRQb3dIYXNoIiwic2V0UG93SGFzaCIsInNldE1pbmVyVHhIYXNoIiwicnBjQmxvY2siLCJNb25lcm9CbG9jayIsInNldEhleCIsImJsb2IiLCJzZXRUeEhhc2hlcyIsInJwY01pbmVyVHgiLCJqc29uIiwiSlNPTiIsInBhcnNlIiwibWluZXJfdHgiLCJtaW5lclR4Iiwic2V0TWluZXJUeCIsImdldExhc3RSZWxheWVkVGltZXN0YW1wIiwic2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAiLCJnZXRSZWNlaXZlZFRpbWVzdGFtcCIsInNldFJlY2VpdmVkVGltZXN0YW1wIiwiZ2V0TnVtQ29uZmlybWF0aW9ucyIsImdldElzQ29uZmlybWVkIiwiZ2V0SW5UeFBvb2wiLCJnZXRJc0RvdWJsZVNwZW5kU2VlbiIsInNldFZlcnNpb24iLCJnZXRFeHRyYSIsInNldEV4dHJhIiwiVWludDhBcnJheSIsImdlbiIsInNldElucHV0cyIsIm1hcCIsInJwY1ZpbiIsImNvbnZlcnRScGNPdXRwdXQiLCJzZXRPdXRwdXRzIiwicnBjT3V0cHV0IiwiZ2V0UmN0U2lnbmF0dXJlcyIsInNldFJjdFNpZ25hdHVyZXMiLCJ0eG5GZWUiLCJnZXRGZWUiLCJnZXRSY3RTaWdQcnVuYWJsZSIsInNldFJjdFNpZ1BydW5hYmxlIiwiZ2V0VW5sb2NrVGltZSIsInNldFVubG9ja1RpbWUiLCJzZXRGdWxsSGV4IiwiZ2V0SXNSZWxheWVkIiwiZ2V0T3V0cHV0SW5kaWNlcyIsInNldE91dHB1dEluZGljZXMiLCJnZXRSZWxheSIsImdldElzS2VwdEJ5QmxvY2siLCJzZXRJc0tlcHRCeUJsb2NrIiwiZ2V0U2lnbmF0dXJlcyIsInNldFNpZ25hdHVyZXMiLCJnZXRJc0ZhaWxlZCIsImdldExhc3RGYWlsZWRIZWlnaHQiLCJzZXRMYXN0RmFpbGVkSGVpZ2h0IiwiZ2V0TGFzdEZhaWxlZEhhc2giLCJzZXRMYXN0RmFpbGVkSGFzaCIsImdldE1heFVzZWRCbG9ja0hlaWdodCIsInNldE1heFVzZWRCbG9ja0hlaWdodCIsImdldE1heFVzZWRCbG9ja0hhc2giLCJzZXRNYXhVc2VkQmxvY2tIYXNoIiwiZ2V0UHJ1bmFibGVIYXNoIiwic2V0UHJ1bmFibGVIYXNoIiwiZ2V0UHJ1bmFibGVIZXgiLCJzZXRQcnVuYWJsZUhleCIsInNldFBydW5lZEhleCIsImdldE91dHB1dHMiLCJzZXRJbmRleCIsImFzX2pzb24iLCJ0eF9qc29uIiwiTW9uZXJvT3V0cHV0Iiwic2V0VHgiLCJnZXRBbW91bnQiLCJzZXRBbW91bnQiLCJhbW91bnQiLCJnZXRLZXlJbWFnZSIsInNldEtleUltYWdlIiwiTW9uZXJvS2V5SW1hZ2UiLCJrX2ltYWdlIiwiZ2V0UmluZ091dHB1dEluZGljZXMiLCJzZXRSaW5nT3V0cHV0SW5kaWNlcyIsImtleV9vZmZzZXRzIiwicHViS2V5IiwidGFnZ2VkX2tleSIsImdldFN0ZWFsdGhQdWJsaWNLZXkiLCJzZXRTdGVhbHRoUHVibGljS2V5IiwicnBjVGVtcGxhdGUiLCJ0ZW1wbGF0ZSIsIk1vbmVyb0Jsb2NrVGVtcGxhdGUiLCJzZXRCbG9ja1RlbXBsYXRlQmxvYiIsInNldEJsb2NrSGFzaGluZ0Jsb2IiLCJzZXRFeHBlY3RlZFJld2FyZCIsInNldFJlc2VydmVkT2Zmc2V0Iiwic2V0U2VlZEhlaWdodCIsInNldFNlZWRIYXNoIiwic2V0TmV4dFNlZWRIYXNoIiwiZ2V0TmV4dFNlZWRIYXNoIiwicnBjSW5mbyIsImluZm8iLCJNb25lcm9EYWVtb25JbmZvIiwic2V0TnVtQWx0QmxvY2tzIiwic2V0QmxvY2tTaXplTGltaXQiLCJzZXRCbG9ja1NpemVNZWRpYW4iLCJzZXRCbG9ja1dlaWdodExpbWl0Iiwic2V0QmxvY2tXZWlnaHRNZWRpYW4iLCJzZXRCb290c3RyYXBEYWVtb25BZGRyZXNzIiwic2V0RnJlZVNwYWNlIiwic2V0RGF0YWJhc2VTaXplIiwic2V0TnVtT2ZmbGluZVBlZXJzIiwic2V0SGVpZ2h0V2l0aG91dEJvb3RzdHJhcCIsInNldE51bUluY29taW5nQ29ubmVjdGlvbnMiLCJzZXRJc09mZmxpbmUiLCJzZXROdW1PdXRnb2luZ0Nvbm5lY3Rpb25zIiwic2V0TnVtUnBjQ29ubmVjdGlvbnMiLCJzZXRTdGFydFRpbWVzdGFtcCIsInNldEFkanVzdGVkVGltZXN0YW1wIiwic2V0VGFyZ2V0Iiwic2V0VGFyZ2V0SGVpZ2h0Iiwic2V0VG9wQmxvY2tIYXNoIiwic2V0TnVtVHhzUG9vbCIsInNldFdhc0Jvb3RzdHJhcEV2ZXJVc2VkIiwic2V0TnVtT25saW5lUGVlcnMiLCJzZXRVcGRhdGVBdmFpbGFibGUiLCJnZXROZXR3b3JrVHlwZSIsInNldE5ldHdvcmtUeXBlIiwiTW9uZXJvTmV0d29ya1R5cGUiLCJNQUlOTkVUIiwiVEVTVE5FVCIsIlNUQUdFTkVUIiwic2V0Q3JlZGl0cyIsImdldFRvcEJsb2NrSGFzaCIsInNldElzQnVzeVN5bmNpbmciLCJzZXRJc1N5bmNocm9uaXplZCIsInNldElzUmVzdHJpY3RlZCIsInJwY1N5bmNJbmZvIiwic3luY0luZm8iLCJNb25lcm9EYWVtb25TeW5jSW5mbyIsInNldFBlZXJzIiwicnBjQ29ubmVjdGlvbnMiLCJzZXRTcGFucyIsInJwY1NwYW5zIiwicnBjU3BhbiIsImdldFNwYW5zIiwiY29udmVydFJwY0Nvbm5lY3Rpb25TcGFuIiwic2V0TmV4dE5lZWRlZFBydW5pbmdTZWVkIiwib3ZlcnZpZXciLCJycGNIYXJkRm9ya0luZm8iLCJNb25lcm9IYXJkRm9ya0luZm8iLCJzZXRFYXJsaWVzdEhlaWdodCIsInNldElzRW5hYmxlZCIsInNldFN0YXRlIiwic2V0VGhyZXNob2xkIiwic2V0TnVtVm90ZXMiLCJzZXRWb3RpbmciLCJzZXRXaW5kb3ciLCJycGNDb25uZWN0aW9uU3BhbiIsInNwYW4iLCJNb25lcm9Db25uZWN0aW9uU3BhbiIsInNldENvbm5lY3Rpb25JZCIsInNldE51bUJsb2NrcyIsInNldFJhdGUiLCJzZXRSZW1vdGVBZGRyZXNzIiwic2V0U3BlZWQiLCJzZXRTdGFydEhlaWdodCIsImVudHJ5IiwiTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkiLCJzZXROdW1JbnN0YW5jZXMiLCJzZXROdW1VbmxvY2tlZEluc3RhbmNlcyIsInNldE51bVJlY2VudEluc3RhbmNlcyIsInJwY1Jlc3VsdCIsIk1vbmVyb1N1Ym1pdFR4UmVzdWx0Iiwic2V0SXNGZWVUb29Mb3ciLCJzZXRIYXNJbnZhbGlkSW5wdXQiLCJzZXRIYXNJbnZhbGlkT3V0cHV0Iiwic2V0SGFzVG9vRmV3T3V0cHV0cyIsInNldElzTWl4aW5Ub29Mb3ciLCJzZXRJc092ZXJzcGVuZCIsInNldFJlYXNvbiIsInNldElzVG9vQmlnIiwic2V0U2FuaXR5Q2hlY2tGYWlsZWQiLCJzZXRJc1R4RXh0cmFUb29CaWciLCJycGNTdGF0cyIsInN0YXRzIiwiTW9uZXJvVHhQb29sU3RhdHMiLCJzZXRCeXRlc01heCIsInNldEJ5dGVzTWVkIiwic2V0Qnl0ZXNNaW4iLCJzZXRCeXRlc1RvdGFsIiwic2V0SGlzdG85OHBjIiwic2V0TnVtMTBtIiwic2V0TnVtRG91YmxlU3BlbmRzIiwic2V0TnVtRmFpbGluZyIsInNldE51bU5vdFJlbGF5ZWQiLCJzZXRPbGRlc3RUaW1lc3RhbXAiLCJzZXRGZWVUb3RhbCIsInNldEhpc3RvIiwiTWFwIiwiZWxlbSIsImdldEhpc3RvIiwic2V0IiwiYnl0ZXMiLCJnZXRIaXN0bzk4cGMiLCJjaGFpbiIsIk1vbmVyb0FsdENoYWluIiwic2V0TGVuZ3RoIiwic2V0QmxvY2tIYXNoZXMiLCJzZXRNYWluQ2hhaW5QYXJlbnRCbG9ja0hhc2giLCJNb25lcm9QZWVyIiwic2V0SWQiLCJzZXRMYXN0U2VlblRpbWVzdGFtcCIsInNldFBvcnQiLCJzZXRScGNQb3J0Iiwic2V0UnBjQ3JlZGl0c1Blckhhc2giLCJzZXRBZGRyZXNzIiwic2V0QXZnRG93bmxvYWQiLCJzZXRBdmdVcGxvYWQiLCJzZXRDdXJyZW50RG93bmxvYWQiLCJzZXRDdXJyZW50VXBsb2FkIiwic2V0SXNJbmNvbWluZyIsInNldExpdmVUaW1lIiwic2V0SXNMb2NhbElwIiwic2V0SXNMb2NhbEhvc3QiLCJwYXJzZUludCIsInNldE51bVJlY2VpdmVzIiwic2V0UmVjZWl2ZUlkbGVUaW1lIiwic2V0TnVtU2VuZHMiLCJzZXRTZW5kSWRsZVRpbWUiLCJzZXROdW1TdXBwb3J0RmxhZ3MiLCJzZXRUeXBlIiwiZ2V0SG9zdCIsImdldElwIiwiZ2V0SXNCYW5uZWQiLCJnZXRTZWNvbmRzIiwicnBjU3RhdHVzIiwiTW9uZXJvTWluaW5nU3RhdHVzIiwic2V0SXNBY3RpdmUiLCJhY3RpdmUiLCJzcGVlZCIsInNldE51bVRocmVhZHMiLCJzZXRJc0JhY2tncm91bmQiLCJpc19iYWNrZ3JvdW5kX21pbmluZ19lbmFibGVkIiwiTW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQiLCJzZXRBdXRvVXJpIiwic2V0SXNVcGRhdGVBdmFpbGFibGUiLCJzZXRVc2VyVXJpIiwiZ2V0QXV0b1VyaSIsImdldFVzZXJVcmkiLCJNb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdCIsInNldERvd25sb2FkUGF0aCIsImdldERvd25sb2FkUGF0aCIsImhleCIsImRhZW1vbklkIiwid29ya2VyIiwid3JhcHBlZExpc3RlbmVycyIsImdldFVVSUQiLCJhc3NpZ24iLCJpbnZva2VXb3JrZXIiLCJnZXRXb3JrZXIiLCJ3cmFwcGVkTGlzdGVuZXIiLCJEYWVtb25Xb3JrZXJMaXN0ZW5lciIsImxpc3RlbmVySWQiLCJnZXRJZCIsImFkZFdvcmtlckNhbGxiYWNrIiwiZ2V0TGlzdGVuZXIiLCJyZW1vdmVXb3JrZXJDYWxsYmFjayIsInZlcnNpb25Kc29uIiwibnVtYmVyIiwiaXNSZWxlYXNlIiwiZnJvbSIsImFyZ3VtZW50cyIsImJsb2NrSGVhZGVyc0pzb24iLCJibG9ja0hlYWRlckpzb24iLCJEZXNlcmlhbGl6YXRpb25UeXBlIiwiVFgiLCJnZXRCbG9ja3NCeUhhc2giLCJibG9ja0hhc2hlcyIsImJsb2Nrc0pzb24iLCJibG9ja0pzb24iLCJnZXRCbG9ja0hhc2hlcyIsImdldFR4UG9vbEJhY2tsb2ciLCJvdXRwdXRzIiwiZW50cnlKc29uIiwiYWx0Q2hhaW5zIiwiYWx0Q2hhaW5Kc29uIiwicGVlckpzb24iLCJiYW5Kc29uIiwiYmFuc0pzb24iLCJ0b0pzb24iLCJmbk5hbWUiLCJhcmdzIiwibG9vcGVyIiwiVGFza0xvb3BlciIsInBvbGwiLCJpc1BvbGxpbmciLCJzdGFydCIsImxhc3RIZWFkZXIiLCJpZCIsImhlYWRlckpzb24iLCJfZGVmYXVsdCIsImV4cG9ydHMiLCJkZWZhdWx0Il0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvZGFlbW9uL01vbmVyb0RhZW1vblJwYy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXNzZXJ0IGZyb20gXCJhc3NlcnRcIjtcbmltcG9ydCBHZW5VdGlscyBmcm9tIFwiLi4vY29tbW9uL0dlblV0aWxzXCI7XG5pbXBvcnQgTGlicmFyeVV0aWxzIGZyb20gXCIuLi9jb21tb24vTGlicmFyeVV0aWxzXCI7XG5pbXBvcnQgVGFza0xvb3BlciBmcm9tIFwiLi4vY29tbW9uL1Rhc2tMb29wZXJcIjtcbmltcG9ydCBNb25lcm9BbHRDaGFpbiBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BbHRDaGFpblwiO1xuaW1wb3J0IE1vbmVyb0JhbiBmcm9tIFwiLi9tb2RlbC9Nb25lcm9CYW5cIjtcbmltcG9ydCBNb25lcm9CbG9jayBmcm9tIFwiLi9tb2RlbC9Nb25lcm9CbG9ja1wiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrSGVhZGVyIGZyb20gXCIuL21vZGVsL01vbmVyb0Jsb2NrSGVhZGVyXCI7XG5pbXBvcnQgTW9uZXJvQmxvY2tUZW1wbGF0ZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9CbG9ja1RlbXBsYXRlXCI7XG5pbXBvcnQgTW9uZXJvQ29ubmVjdGlvblNwYW4gZnJvbSBcIi4vbW9kZWwvTW9uZXJvQ29ubmVjdGlvblNwYW5cIjtcbmltcG9ydCBNb25lcm9EYWVtb24gZnJvbSBcIi4vTW9uZXJvRGFlbW9uXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uQ29uZmlnIGZyb20gXCIuL21vZGVsL01vbmVyb0RhZW1vbkNvbmZpZ1wiO1xuaW1wb3J0IE1vbmVyb0RhZW1vbkluZm8gZnJvbSBcIi4vbW9kZWwvTW9uZXJvRGFlbW9uSW5mb1wiO1xuaW1wb3J0IE1vbmVyb0RhZW1vbkxpc3RlbmVyIGZyb20gXCIuL21vZGVsL01vbmVyb0RhZW1vbkxpc3RlbmVyXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uU3luY0luZm8gZnJvbSBcIi4vbW9kZWwvTW9uZXJvRGFlbW9uU3luY0luZm9cIjtcbmltcG9ydCBNb25lcm9EYWVtb25VcGRhdGVDaGVja1Jlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9EYWVtb25VcGRhdGVDaGVja1Jlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvRmVlRXN0aW1hdGUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvRmVlRXN0aW1hdGVcIjtcbmltcG9ydCBNb25lcm9FcnJvciBmcm9tIFwiLi4vY29tbW9uL01vbmVyb0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvSGFyZEZvcmtJbmZvIGZyb20gXCIuL21vZGVsL01vbmVyb0hhcmRGb3JrSW5mb1wiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlIGZyb20gXCIuL21vZGVsL01vbmVyb0tleUltYWdlXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2VTcGVudFN0YXR1cyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzXCI7XG5pbXBvcnQgTW9uZXJvTWluZXJUeFN1bSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NaW5lclR4U3VtXCI7XG5pbXBvcnQgTW9uZXJvTWluaW5nU3RhdHVzIGZyb20gXCIuL21vZGVsL01vbmVyb01pbmluZ1N0YXR1c1wiO1xuaW1wb3J0IE1vbmVyb05ldHdvcmtUeXBlIGZyb20gXCIuL21vZGVsL01vbmVyb05ldHdvcmtUeXBlXCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0IGZyb20gXCIuL21vZGVsL01vbmVyb091dHB1dFwiO1xuaW1wb3J0IE1vbmVyb091dHB1dEhpc3RvZ3JhbUVudHJ5IGZyb20gXCIuL21vZGVsL01vbmVyb091dHB1dEhpc3RvZ3JhbUVudHJ5XCI7XG5pbXBvcnQgTW9uZXJvUGVlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9QZWVyXCI7XG5pbXBvcnQgTW9uZXJvUHJ1bmVSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvUHJ1bmVSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9ScGNDb25uZWN0aW9uIGZyb20gXCIuLi9jb21tb24vTW9uZXJvUnBjQ29ubmVjdGlvblwiO1xuaW1wb3J0IE1vbmVyb1N1Ym1pdFR4UmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb1N1Ym1pdFR4UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvVHggZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhcIjtcbmltcG9ydCBNb25lcm9UeFBvb2xTdGF0cyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFBvb2xTdGF0c1wiO1xuaW1wb3J0IE1vbmVyb1V0aWxzIGZyb20gXCIuLi9jb21tb24vTW9uZXJvVXRpbHNcIjtcbmltcG9ydCBNb25lcm9WZXJzaW9uIGZyb20gXCIuL21vZGVsL01vbmVyb1ZlcnNpb25cIjtcbmltcG9ydCB7IENoaWxkUHJvY2VzcyB9IGZyb20gXCJjaGlsZF9wcm9jZXNzXCI7XG5cbi8qKlxuICogQ29weXJpZ2h0IChjKSB3b29kc2VyXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxuICogY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG4gKiBTT0ZUV0FSRS5cbiAqL1xuXG4vKipcbiAqIEltcGxlbWVudHMgYSBNb25lcm9EYWVtb24gYXMgYSBjbGllbnQgb2YgbW9uZXJvZC5cbiAqL1xuY2xhc3MgTW9uZXJvRGFlbW9uUnBjIGV4dGVuZHMgTW9uZXJvRGFlbW9uIHtcblxuICAvLyBzdGF0aWMgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBzdGF0aWMgcmVhZG9ubHkgTUFYX1JFUV9TSVpFID0gXCIzMDAwMDAwXCI7XG4gIHByb3RlY3RlZCBzdGF0aWMgcmVhZG9ubHkgREVGQVVMVF9JRCA9IFwiMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMFwiOyAvLyB1bmluaXRpYWxpemVkIHR4IG9yIGJsb2NrIGhhc2ggZnJvbSBkYWVtb24gcnBjXG4gIHByb3RlY3RlZCBzdGF0aWMgcmVhZG9ubHkgTlVNX0hFQURFUlNfUEVSX1JFUSA9IDc1MDsgLy8gbnVtYmVyIG9mIGhlYWRlcnMgdG8gZmV0Y2ggYW5kIGNhY2hlIHBlciByZXF1ZXN0XG4gIHByb3RlY3RlZCBzdGF0aWMgcmVhZG9ubHkgREVGQVVMVF9QT0xMX1BFUklPRCA9IDIwMDAwOyAvLyBkZWZhdWx0IGludGVydmFsIGJldHdlZW4gcG9sbGluZyB0aGUgZGFlbW9uIGluIG1zXG5cbiAgLy8gaW5zdGFuY2UgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBjb25maWc6IFBhcnRpYWw8TW9uZXJvRGFlbW9uQ29uZmlnPjtcbiAgcHJvdGVjdGVkIGxpc3RlbmVyczogTW9uZXJvRGFlbW9uTGlzdGVuZXJbXTtcbiAgcHJvdGVjdGVkIGNhY2hlZEhlYWRlcnM6IGFueTtcbiAgcHJvdGVjdGVkIHByb2Nlc3M6IGFueTtcbiAgcHJvdGVjdGVkIHBvbGxMaXN0ZW5lcjogYW55O1xuICBwcm90ZWN0ZWQgcHJveHlEYWVtb246IGFueTtcbiBcbiAgLyoqIEBwcml2YXRlICovXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogTW9uZXJvRGFlbW9uQ29uZmlnLCBwcm94eURhZW1vbjogTW9uZXJvRGFlbW9uUnBjUHJveHkpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMucHJveHlEYWVtb24gPSBwcm94eURhZW1vbjtcbiAgICBpZiAoY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybjtcbiAgICB0aGlzLmxpc3RlbmVycyA9IFtdOyAgICAgIC8vIGJsb2NrIGxpc3RlbmVyc1xuICAgIHRoaXMuY2FjaGVkSGVhZGVycyA9IHt9OyAgLy8gY2FjaGVkIGhlYWRlcnMgZm9yIGZldGNoaW5nIGJsb2NrcyBpbiBib3VuZCBjaHVua3NcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgaW50ZXJuYWwgcHJvY2VzcyBydW5uaW5nIG1vbmVyb2QuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtDaGlsZFByb2Nlc3N9IHRoZSBub2RlIHByb2Nlc3MgcnVubmluZyBtb25lcm9kLCB1bmRlZmluZWQgaWYgbm90IGNyZWF0ZWQgZnJvbSBuZXcgcHJvY2Vzc1xuICAgKi9cbiAgZ2V0UHJvY2VzcygpOiBDaGlsZFByb2Nlc3Mge1xuICAgIHJldHVybiB0aGlzLnByb2Nlc3M7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTdG9wIHRoZSBpbnRlcm5hbCBwcm9jZXNzIHJ1bm5pbmcgbW9uZXJvZCwgaWYgYXBwbGljYWJsZS5cbiAgICogXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2ZvcmNlXSBzcGVjaWZpZXMgaWYgdGhlIHByb2Nlc3Mgc2hvdWxkIGJlIGRlc3Ryb3llZCBmb3JjaWJseSAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxudW1iZXIgfCB1bmRlZmluZWQ+fSB0aGUgZXhpdCBjb2RlIGZyb20gc3RvcHBpbmcgdGhlIHByb2Nlc3NcbiAgICovXG4gIGFzeW5jIHN0b3BQcm9jZXNzKGZvcmNlID0gZmFsc2UpOiBQcm9taXNlPG51bWJlciB8IHVuZGVmaW5lZD4ge1xuICAgIGlmICh0aGlzLnByb2Nlc3MgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTW9uZXJvRGFlbW9uUnBjIGluc3RhbmNlIG5vdCBjcmVhdGVkIGZyb20gbmV3IHByb2Nlc3NcIik7XG4gICAgbGV0IGxpc3RlbmVyc0NvcHkgPSBHZW5VdGlscy5jb3B5QXJyYXkoYXdhaXQgdGhpcy5nZXRMaXN0ZW5lcnMoKSk7XG4gICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgbGlzdGVuZXJzQ29weSkgYXdhaXQgdGhpcy5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgcmV0dXJuIEdlblV0aWxzLmtpbGxQcm9jZXNzKHRoaXMucHJvY2VzcywgZm9yY2UgPyBcIlNJR0tJTExcIiA6IHVuZGVmaW5lZCk7XG4gIH1cbiAgXG4gIGFzeW5jIGFkZExpc3RlbmVyKGxpc3RlbmVyOiBNb25lcm9EYWVtb25MaXN0ZW5lcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgYXNzZXJ0KGxpc3RlbmVyIGluc3RhbmNlb2YgTW9uZXJvRGFlbW9uTGlzdGVuZXIsIFwiTGlzdGVuZXIgbXVzdCBiZSBpbnN0YW5jZSBvZiBNb25lcm9EYWVtb25MaXN0ZW5lclwiKTtcbiAgICB0aGlzLmxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcbiAgICB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXI6IE1vbmVyb0RhZW1vbkxpc3RlbmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBhc3NlcnQobGlzdGVuZXIgaW5zdGFuY2VvZiBNb25lcm9EYWVtb25MaXN0ZW5lciwgXCJMaXN0ZW5lciBtdXN0IGJlIGluc3RhbmNlIG9mIE1vbmVyb0RhZW1vbkxpc3RlbmVyXCIpO1xuICAgIGxldCBpZHggPSB0aGlzLmxpc3RlbmVycy5pbmRleE9mKGxpc3RlbmVyKTtcbiAgICBpZiAoaWR4ID4gLTEpIHRoaXMubGlzdGVuZXJzLnNwbGljZShpZHgsIDEpO1xuICAgIGVsc2UgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTGlzdGVuZXIgaXMgbm90IHJlZ2lzdGVyZWQgd2l0aCBkYWVtb25cIik7XG4gICAgdGhpcy5yZWZyZXNoTGlzdGVuaW5nKCk7XG4gIH1cbiAgXG4gIGdldExpc3RlbmVycygpOiBNb25lcm9EYWVtb25MaXN0ZW5lcltdIHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0TGlzdGVuZXJzKCk7XG4gICAgcmV0dXJuIHRoaXMubGlzdGVuZXJzO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBkYWVtb24ncyBSUEMgY29ubmVjdGlvbi5cbiAgICogXG4gICAqIEByZXR1cm4ge01vbmVyb1JwY0Nvbm5lY3Rpb259IHRoZSBkYWVtb24ncyBycGMgY29ubmVjdGlvblxuICAgKi9cbiAgYXN5bmMgZ2V0UnBjQ29ubmVjdGlvbigpIHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0UnBjQ29ubmVjdGlvbigpO1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNDb25uZWN0ZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmlzQ29ubmVjdGVkKCk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuZ2V0VmVyc2lvbigpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRWZXJzaW9uKCk6IFByb21pc2U8TW9uZXJvVmVyc2lvbj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRWZXJzaW9uKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfdmVyc2lvblwiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9WZXJzaW9uKHJlc3AucmVzdWx0LnZlcnNpb24sIHJlc3AucmVzdWx0LnJlbGVhc2UpO1xuICB9XG4gIFxuICBhc3luYyBpc1RydXN0ZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmlzVHJ1c3RlZCgpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwiZ2V0X2hlaWdodFwiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICByZXR1cm4gIXJlc3AudW50cnVzdGVkO1xuICB9XG4gIFxuICBhc3luYyBnZXRIZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0SGVpZ2h0KCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmxvY2tfY291bnRcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5jb3VudDtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tIYXNoKGhlaWdodDogbnVtYmVyKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tIYXNoKGhlaWdodCk7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJvbl9nZXRfYmxvY2tfaGFzaFwiLCBbaGVpZ2h0XSkpLnJlc3VsdDsgIC8vIFRPRE8gbW9uZXJvLXdhbGxldC1ycGM6IG5vIHN0YXR1cyByZXR1cm5lZFxuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja1RlbXBsYXRlKHdhbGxldEFkZHJlc3M6IHN0cmluZywgcmVzZXJ2ZVNpemU/OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb0Jsb2NrVGVtcGxhdGU+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tUZW1wbGF0ZSh3YWxsZXRBZGRyZXNzLCByZXNlcnZlU2l6ZSk7XG4gICAgYXNzZXJ0KHdhbGxldEFkZHJlc3MgJiYgdHlwZW9mIHdhbGxldEFkZHJlc3MgPT09IFwic3RyaW5nXCIsIFwiTXVzdCBzcGVjaWZ5IHdhbGxldCBhZGRyZXNzIHRvIGJlIG1pbmVkIHRvXCIpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2Jsb2NrX3RlbXBsYXRlXCIsIHt3YWxsZXRfYWRkcmVzczogd2FsbGV0QWRkcmVzcywgcmVzZXJ2ZV9zaXplOiByZXNlcnZlU2l6ZX0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNCbG9ja1RlbXBsYXRlKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TGFzdEJsb2NrSGVhZGVyKCk6IFByb21pc2U8TW9uZXJvQmxvY2tIZWFkZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0TGFzdEJsb2NrSGVhZGVyKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfbGFzdF9ibG9ja19oZWFkZXJcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Jsb2NrSGVhZGVyKHJlc3AucmVzdWx0LmJsb2NrX2hlYWRlcik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrSGVhZGVyQnlIYXNoKGJsb2NrSGFzaDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9CbG9ja0hlYWRlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRCbG9ja0hlYWRlckJ5SGFzaChibG9ja0hhc2gpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2Jsb2NrX2hlYWRlcl9ieV9oYXNoXCIsIHtoYXNoOiBibG9ja0hhc2h9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQmxvY2tIZWFkZXIocmVzcC5yZXN1bHQuYmxvY2tfaGVhZGVyKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tIZWFkZXJCeUhlaWdodChoZWlnaHQ6IG51bWJlcik6IFByb21pc2U8TW9uZXJvQmxvY2tIZWFkZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tIZWFkZXJCeUhlaWdodChoZWlnaHQpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2Jsb2NrX2hlYWRlcl9ieV9oZWlnaHRcIiwge2hlaWdodDogaGVpZ2h0fSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Jsb2NrSGVhZGVyKHJlc3AucmVzdWx0LmJsb2NrX2hlYWRlcik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrSGVhZGVyc0J5UmFuZ2Uoc3RhcnRIZWlnaHQ/OiBudW1iZXIsIGVuZEhlaWdodD86IG51bWJlcik6IFByb21pc2U8TW9uZXJvQmxvY2tIZWFkZXJbXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRCbG9ja0hlYWRlcnNCeVJhbmdlKHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpO1xuICAgIFxuICAgIC8vIGZldGNoIGJsb2NrIGhlYWRlcnNcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9ibG9ja19oZWFkZXJzX3JhbmdlXCIsIHtcbiAgICAgIHN0YXJ0X2hlaWdodDogc3RhcnRIZWlnaHQsXG4gICAgICBlbmRfaGVpZ2h0OiBlbmRIZWlnaHRcbiAgICB9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgXG4gICAgLy8gYnVpbGQgaGVhZGVyc1xuICAgIGxldCBoZWFkZXJzID0gW107XG4gICAgZm9yIChsZXQgcnBjSGVhZGVyIG9mIHJlc3AucmVzdWx0LmhlYWRlcnMpIHtcbiAgICAgIGhlYWRlcnMucHVzaChNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Jsb2NrSGVhZGVyKHJwY0hlYWRlcikpO1xuICAgIH1cbiAgICByZXR1cm4gaGVhZGVycztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tCeUhhc2goYmxvY2tIYXNoOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0Jsb2NrPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2NrQnlIYXNoKGJsb2NrSGFzaCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmxvY2tcIiwge2hhc2g6IGJsb2NrSGFzaH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNCbG9jayhyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrQnlIZWlnaHQoaGVpZ2h0OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb0Jsb2NrPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2NrQnlIZWlnaHQoaGVpZ2h0KTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9ibG9ja1wiLCB7aGVpZ2h0OiBoZWlnaHR9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQmxvY2socmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja3NCeUhlaWdodChoZWlnaHRzOiBudW1iZXJbXSk6IFByb21pc2U8TW9uZXJvQmxvY2tbXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRCbG9ja3NCeUhlaWdodChoZWlnaHRzKTtcbiAgICBcbiAgICAvLyBmZXRjaCBibG9ja3MgaW4gYmluYXJ5XG4gICAgbGV0IHJlc3BCaW4gPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kQmluYXJ5UmVxdWVzdChcImdldF9ibG9ja3NfYnlfaGVpZ2h0LmJpblwiLCB7aGVpZ2h0czogaGVpZ2h0c30pO1xuICAgIFxuICAgIC8vIGNvbnZlcnQgYmluYXJ5IGJsb2NrcyB0byBqc29uXG4gICAgbGV0IHJwY0Jsb2NrcyA9IGF3YWl0IE1vbmVyb1V0aWxzLmJpbmFyeUJsb2Nrc1RvSnNvbihyZXNwQmluKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhycGNCbG9ja3MpO1xuICAgIFxuICAgIC8vIGJ1aWxkIGJsb2NrcyB3aXRoIHRyYW5zYWN0aW9uc1xuICAgIGFzc2VydC5lcXVhbChycGNCbG9ja3MudHhzLmxlbmd0aCwgcnBjQmxvY2tzLmJsb2Nrcy5sZW5ndGgpOyAgICBcbiAgICBsZXQgYmxvY2tzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2tJZHggPSAwOyBibG9ja0lkeCA8IHJwY0Jsb2Nrcy5ibG9ja3MubGVuZ3RoOyBibG9ja0lkeCsrKSB7XG4gICAgICBcbiAgICAgIC8vIGJ1aWxkIGJsb2NrXG4gICAgICBsZXQgYmxvY2sgPSBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Jsb2NrKHJwY0Jsb2Nrcy5ibG9ja3NbYmxvY2tJZHhdKTtcbiAgICAgIGJsb2NrLnNldEhlaWdodChoZWlnaHRzW2Jsb2NrSWR4XSk7XG4gICAgICBibG9ja3MucHVzaChibG9jayk7XG4gICAgICBcbiAgICAgIC8vIGJ1aWxkIHRyYW5zYWN0aW9uc1xuICAgICAgbGV0IHR4cyA9IFtdO1xuICAgICAgZm9yIChsZXQgdHhJZHggPSAwOyB0eElkeCA8IHJwY0Jsb2Nrcy50eHNbYmxvY2tJZHhdLmxlbmd0aDsgdHhJZHgrKykge1xuICAgICAgICBsZXQgdHggPSBuZXcgTW9uZXJvVHgoKTtcbiAgICAgICAgdHhzLnB1c2godHgpO1xuICAgICAgICB0eC5zZXRIYXNoKHJwY0Jsb2Nrcy5ibG9ja3NbYmxvY2tJZHhdLnR4X2hhc2hlc1t0eElkeF0pO1xuICAgICAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICAgICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgICAgdHguc2V0SXNSZWxheWVkKHRydWUpO1xuICAgICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgICAgIHR4LnNldElzRG91YmxlU3BlbmRTZWVuKGZhbHNlKTtcbiAgICAgICAgTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNUeChycGNCbG9ja3MudHhzW2Jsb2NrSWR4XVt0eElkeF0sIHR4KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gbWVyZ2UgaW50byBvbmUgYmxvY2tcbiAgICAgIGJsb2NrLnNldFR4cyhbXSk7XG4gICAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgICAgaWYgKHR4LmdldEJsb2NrKCkpIGJsb2NrLm1lcmdlKHR4LmdldEJsb2NrKCkpO1xuICAgICAgICBlbHNlIGJsb2NrLmdldFR4cygpLnB1c2godHguc2V0QmxvY2soYmxvY2spKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGJsb2NrcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tzQnlSYW5nZShzdGFydEhlaWdodD86IG51bWJlciwgZW5kSGVpZ2h0PzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9CbG9ja1tdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2Nrc0J5UmFuZ2Uoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCk7XG4gICAgaWYgKHN0YXJ0SGVpZ2h0ID09PSB1bmRlZmluZWQpIHN0YXJ0SGVpZ2h0ID0gMDtcbiAgICBpZiAoZW5kSGVpZ2h0ID09PSB1bmRlZmluZWQpIGVuZEhlaWdodCA9IGF3YWl0IHRoaXMuZ2V0SGVpZ2h0KCkgLSAxO1xuICAgIGxldCBoZWlnaHRzID0gW107XG4gICAgZm9yIChsZXQgaGVpZ2h0ID0gc3RhcnRIZWlnaHQ7IGhlaWdodCA8PSBlbmRIZWlnaHQ7IGhlaWdodCsrKSBoZWlnaHRzLnB1c2goaGVpZ2h0KTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5nZXRCbG9ja3NCeUhlaWdodChoZWlnaHRzKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tzQnlSYW5nZUNodW5rZWQoc3RhcnRIZWlnaHQ/OiBudW1iZXIsIGVuZEhlaWdodD86IG51bWJlciwgbWF4Q2h1bmtTaXplPzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9CbG9ja1tdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2Nrc0J5UmFuZ2VDaHVua2VkKHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIG1heENodW5rU2l6ZSk7XG4gICAgaWYgKHN0YXJ0SGVpZ2h0ID09PSB1bmRlZmluZWQpIHN0YXJ0SGVpZ2h0ID0gMDtcbiAgICBpZiAoZW5kSGVpZ2h0ID09PSB1bmRlZmluZWQpIGVuZEhlaWdodCA9IGF3YWl0IHRoaXMuZ2V0SGVpZ2h0KCkgLSAxO1xuICAgIGxldCBsYXN0SGVpZ2h0ID0gc3RhcnRIZWlnaHQgLSAxO1xuICAgIGxldCBibG9ja3MgPSBbXTtcbiAgICB3aGlsZSAobGFzdEhlaWdodCA8IGVuZEhlaWdodCkge1xuICAgICAgZm9yIChsZXQgYmxvY2sgb2YgYXdhaXQgdGhpcy5nZXRNYXhCbG9ja3MobGFzdEhlaWdodCArIDEsIGVuZEhlaWdodCwgbWF4Q2h1bmtTaXplKSkge1xuICAgICAgICBibG9ja3MucHVzaChibG9jayk7XG4gICAgICB9XG4gICAgICBsYXN0SGVpZ2h0ID0gYmxvY2tzW2Jsb2Nrcy5sZW5ndGggLSAxXS5nZXRIZWlnaHQoKTtcbiAgICB9XG4gICAgcmV0dXJuIGJsb2NrcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhzKHR4SGFzaGVzOiBzdHJpbmdbXSwgcHJ1bmUgPSBmYWxzZSk6IFByb21pc2U8TW9uZXJvVHhbXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRUeHModHhIYXNoZXMsIHBydW5lKTtcbiAgICAgICAgXG4gICAgLy8gdmFsaWRhdGUgaW5wdXRcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheSh0eEhhc2hlcykgJiYgdHhIYXNoZXMubGVuZ3RoID4gMCwgXCJNdXN0IHByb3ZpZGUgYW4gYXJyYXkgb2YgdHJhbnNhY3Rpb24gaGFzaGVzXCIpO1xuICAgIGFzc2VydChwcnVuZSA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiBwcnVuZSA9PT0gXCJib29sZWFuXCIsIFwiUHJ1bmUgbXVzdCBiZSBhIGJvb2xlYW4gb3IgdW5kZWZpbmVkXCIpO1xuICAgICAgICBcbiAgICAvLyBmZXRjaCB0cmFuc2FjdGlvbnNcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImdldF90cmFuc2FjdGlvbnNcIiwge1xuICAgICAgdHhzX2hhc2hlczogdHhIYXNoZXMsXG4gICAgICBkZWNvZGVfYXNfanNvbjogdHJ1ZSxcbiAgICAgIHBydW5lOiBwcnVuZVxuICAgIH0pO1xuICAgIHRyeSB7XG4gICAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlLm1lc3NhZ2UuaW5kZXhPZihcIkZhaWxlZCB0byBwYXJzZSBoZXggcmVwcmVzZW50YXRpb24gb2YgdHJhbnNhY3Rpb24gaGFzaFwiKSA+PSAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJJbnZhbGlkIHRyYW5zYWN0aW9uIGhhc2hcIik7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgICAgICAgXG4gICAgLy8gYnVpbGQgdHJhbnNhY3Rpb24gbW9kZWxzXG4gICAgbGV0IHR4cyA9IFtdO1xuICAgIGlmIChyZXNwLnR4cykge1xuICAgICAgZm9yIChsZXQgdHhJZHggPSAwOyB0eElkeCA8IHJlc3AudHhzLmxlbmd0aDsgdHhJZHgrKykge1xuICAgICAgICBsZXQgdHggPSBuZXcgTW9uZXJvVHgoKTtcbiAgICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICAgICAgdHhzLnB1c2goTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNUeChyZXNwLnR4c1t0eElkeF0sIHR4KSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0eHM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4SGV4ZXModHhIYXNoZXM6IHN0cmluZ1tdLCBwcnVuZSA9IGZhbHNlKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRUeEhleGVzKHR4SGFzaGVzLCBwcnVuZSk7XG4gICAgbGV0IGhleGVzID0gW107XG4gICAgZm9yIChsZXQgdHggb2YgYXdhaXQgdGhpcy5nZXRUeHModHhIYXNoZXMsIHBydW5lKSkgaGV4ZXMucHVzaChwcnVuZSA/IHR4LmdldFBydW5lZEhleCgpIDogdHguZ2V0RnVsbEhleCgpKTtcbiAgICByZXR1cm4gaGV4ZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE1pbmVyVHhTdW0oaGVpZ2h0OiBudW1iZXIsIG51bUJsb2NrczogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9NaW5lclR4U3VtPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldE1pbmVyVHhTdW0oaGVpZ2h0LCBudW1CbG9ja3MpO1xuICAgIGlmIChoZWlnaHQgPT09IHVuZGVmaW5lZCkgaGVpZ2h0ID0gMDtcbiAgICBlbHNlIGFzc2VydChoZWlnaHQgPj0gMCwgXCJIZWlnaHQgbXVzdCBiZSBhbiBpbnRlZ2VyID49IDBcIik7XG4gICAgaWYgKG51bUJsb2NrcyA9PT0gdW5kZWZpbmVkKSBudW1CbG9ja3MgPSBhd2FpdCB0aGlzLmdldEhlaWdodCgpO1xuICAgIGVsc2UgYXNzZXJ0KG51bUJsb2NrcyA+PSAwLCBcIkNvdW50IG11c3QgYmUgYW4gaW50ZWdlciA+PSAwXCIpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2NvaW5iYXNlX3R4X3N1bVwiLCB7aGVpZ2h0OiBoZWlnaHQsIGNvdW50OiBudW1CbG9ja3N9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgbGV0IHR4U3VtID0gbmV3IE1vbmVyb01pbmVyVHhTdW0oKTtcbiAgICB0eFN1bS5zZXRFbWlzc2lvblN1bShCaWdJbnQocmVzcC5yZXN1bHQuZW1pc3Npb25fYW1vdW50KSk7XG4gICAgdHhTdW0uc2V0RmVlU3VtKEJpZ0ludChyZXNwLnJlc3VsdC5mZWVfYW1vdW50KSk7XG4gICAgcmV0dXJuIHR4U3VtO1xuICB9XG4gIFxuICBhc3luYyBnZXRGZWVFc3RpbWF0ZShncmFjZUJsb2Nrcz86IG51bWJlcik6IFByb21pc2U8TW9uZXJvRmVlRXN0aW1hdGU+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0RmVlRXN0aW1hdGUoZ3JhY2VCbG9ja3MpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2ZlZV9lc3RpbWF0ZVwiLCB7Z3JhY2VfYmxvY2tzOiBncmFjZUJsb2Nrc30pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICBsZXQgZmVlRXN0aW1hdGUgPSBuZXcgTW9uZXJvRmVlRXN0aW1hdGUoKTtcbiAgICBmZWVFc3RpbWF0ZS5zZXRGZWUoQmlnSW50KHJlc3AucmVzdWx0LmZlZSkpO1xuICAgIGxldCBmZWVzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZXNwLnJlc3VsdC5mZWVzLmxlbmd0aDsgaSsrKSBmZWVzLnB1c2goQmlnSW50KHJlc3AucmVzdWx0LmZlZXNbaV0pKTtcbiAgICBmZWVFc3RpbWF0ZS5zZXRGZWVzKGZlZXMpO1xuICAgIGZlZUVzdGltYXRlLnNldFF1YW50aXphdGlvbk1hc2soQmlnSW50KHJlc3AucmVzdWx0LnF1YW50aXphdGlvbl9tYXNrKSk7XG4gICAgcmV0dXJuIGZlZUVzdGltYXRlO1xuICB9XG4gIFxuICBhc3luYyBzdWJtaXRUeEhleCh0eEhleDogc3RyaW5nLCBkb05vdFJlbGF5OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9TdWJtaXRUeFJlc3VsdD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5zdWJtaXRUeEhleCh0eEhleCwgZG9Ob3RSZWxheSk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJzZW5kX3Jhd190cmFuc2FjdGlvblwiLCB7dHhfYXNfaGV4OiB0eEhleCwgZG9fbm90X3JlbGF5OiBkb05vdFJlbGF5fSk7XG4gICAgbGV0IHJlc3VsdCA9IE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjU3VibWl0VHhSZXN1bHQocmVzcCk7XG4gICAgXG4gICAgLy8gc2V0IGlzR29vZCBiYXNlZCBvbiBzdGF0dXNcbiAgICB0cnkge1xuICAgICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7IFxuICAgICAgcmVzdWx0LnNldElzR29vZCh0cnVlKTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIHJlc3VsdC5zZXRJc0dvb2QoZmFsc2UpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIFxuICBhc3luYyByZWxheVR4c0J5SGFzaCh0eEhhc2hlczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24ucmVsYXlUeHNCeUhhc2godHhIYXNoZXMpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicmVsYXlfdHhcIiwge3R4aWRzOiB0eEhhc2hlc30pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhQb29sKCk6IFByb21pc2U8TW9uZXJvVHhbXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRUeFBvb2woKTtcbiAgICBcbiAgICAvLyBzZW5kIHJwYyByZXF1ZXN0XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJnZXRfdHJhbnNhY3Rpb25fcG9vbFwiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICBcbiAgICAvLyBidWlsZCB0eHNcbiAgICBsZXQgdHhzID0gW107XG4gICAgaWYgKHJlc3AudHJhbnNhY3Rpb25zKSB7XG4gICAgICBmb3IgKGxldCBycGNUeCBvZiByZXNwLnRyYW5zYWN0aW9ucykge1xuICAgICAgICBsZXQgdHggPSBuZXcgTW9uZXJvVHgoKTtcbiAgICAgICAgdHhzLnB1c2godHgpO1xuICAgICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgICAgIHR4LnNldEluVHhQb29sKHRydWUpO1xuICAgICAgICB0eC5zZXROdW1Db25maXJtYXRpb25zKDApO1xuICAgICAgICBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1R4KHJwY1R4LCB0eCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0eHM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4UG9vbEhhc2hlcygpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICB9XG4gIFxuICAvLyBhc3luYyBnZXRUeFBvb2xCYWNrbG9nKCk6IFByb21pc2U8TW9uZXJvVHhCYWNrbG9nRW50cnlbXT4ge1xuICAvLyAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgLy8gfVxuXG4gIGFzeW5jIGdldFR4UG9vbFN0YXRzKCk6IFByb21pc2U8TW9uZXJvVHhQb29sU3RhdHM+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0VHhQb29sU3RhdHMoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImdldF90cmFuc2FjdGlvbl9wb29sX3N0YXRzXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1R4UG9vbFN0YXRzKHJlc3AucG9vbF9zdGF0cyk7XG4gIH1cbiAgXG4gIGFzeW5jIGZsdXNoVHhQb29sKGhhc2hlcz86IHN0cmluZyB8IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmZsdXNoVHhQb29sKGhhc2hlcyk7XG4gICAgaWYgKGhhc2hlcykgaGFzaGVzID0gR2VuVXRpbHMubGlzdGlmeShoYXNoZXMpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZmx1c2hfdHhwb29sXCIsIHt0eGlkczogaGFzaGVzfSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBnZXRLZXlJbWFnZVNwZW50U3RhdHVzZXMoa2V5SW1hZ2VzOiBzdHJpbmdbXSk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VTcGVudFN0YXR1c1tdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEtleUltYWdlU3BlbnRTdGF0dXNlcyhrZXlJbWFnZXMpO1xuICAgIGlmIChrZXlJbWFnZXMgPT09IHVuZGVmaW5lZCB8fCBrZXlJbWFnZXMubGVuZ3RoID09PSAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUga2V5IGltYWdlcyB0byBjaGVjayB0aGUgc3RhdHVzIG9mXCIpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwiaXNfa2V5X2ltYWdlX3NwZW50XCIsIHtrZXlfaW1hZ2VzOiBrZXlJbWFnZXN9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICByZXR1cm4gcmVzcC5zcGVudF9zdGF0dXM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dEhpc3RvZ3JhbShhbW91bnRzPzogYmlnaW50W10sIG1pbkNvdW50PzogbnVtYmVyLCBtYXhDb3VudD86IG51bWJlciwgaXNVbmxvY2tlZD86IGJvb2xlYW4sIHJlY2VudEN1dG9mZj86IG51bWJlcik6IFByb21pc2U8TW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnlbXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRPdXRwdXRIaXN0b2dyYW0oYW1vdW50cywgbWluQ291bnQsIG1heENvdW50LCBpc1VubG9ja2VkLCByZWNlbnRDdXRvZmYpO1xuICAgIFxuICAgIC8vIHNlbmQgcnBjIHJlcXVlc3RcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9vdXRwdXRfaGlzdG9ncmFtXCIsIHtcbiAgICAgIGFtb3VudHM6IGFtb3VudHMsXG4gICAgICBtaW5fY291bnQ6IG1pbkNvdW50LFxuICAgICAgbWF4X2NvdW50OiBtYXhDb3VudCxcbiAgICAgIHVubG9ja2VkOiBpc1VubG9ja2VkLFxuICAgICAgcmVjZW50X2N1dG9mZjogcmVjZW50Q3V0b2ZmXG4gICAgfSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIFxuICAgIC8vIGJ1aWxkIGhpc3RvZ3JhbSBlbnRyaWVzIGZyb20gcmVzcG9uc2VcbiAgICBsZXQgZW50cmllcyA9IFtdO1xuICAgIGlmICghcmVzcC5yZXN1bHQuaGlzdG9ncmFtKSByZXR1cm4gZW50cmllcztcbiAgICBmb3IgKGxldCBycGNFbnRyeSBvZiByZXNwLnJlc3VsdC5oaXN0b2dyYW0pIHtcbiAgICAgIGVudHJpZXMucHVzaChNb25lcm9EYWVtb25ScGMuY29udmVydFJwY091dHB1dEhpc3RvZ3JhbUVudHJ5KHJwY0VudHJ5KSk7XG4gICAgfVxuICAgIHJldHVybiBlbnRyaWVzO1xuICB9XG4gIFxuICBhc3luYyBnZXRPdXRwdXREaXN0cmlidXRpb24oYW1vdW50cywgY3VtdWxhdGl2ZSwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCkge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRPdXRwdXREaXN0cmlidXRpb24oYW1vdW50cywgY3VtdWxhdGl2ZSwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCk7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkIChyZXNwb25zZSAnZGlzdHJpYnV0aW9uJyBmaWVsZCBpcyBiaW5hcnkpXCIpO1xuICAgIFxuLy8gICAgbGV0IGFtb3VudFN0cnMgPSBbXTtcbi8vICAgIGZvciAobGV0IGFtb3VudCBvZiBhbW91bnRzKSBhbW91bnRTdHJzLnB1c2goYW1vdW50LnRvSlNWYWx1ZSgpKTtcbi8vICAgIGNvbnNvbGUubG9nKGFtb3VudFN0cnMpO1xuLy8gICAgY29uc29sZS5sb2coY3VtdWxhdGl2ZSk7XG4vLyAgICBjb25zb2xlLmxvZyhzdGFydEhlaWdodCk7XG4vLyAgICBjb25zb2xlLmxvZyhlbmRIZWlnaHQpO1xuLy8gICAgXG4vLyAgICAvLyBzZW5kIHJwYyByZXF1ZXN0XG4vLyAgICBjb25zb2xlLmxvZyhcIioqKioqKioqKioqIFNFTkRJTkcgUkVRVUVTVCAqKioqKioqKioqKioqXCIpO1xuLy8gICAgaWYgKHN0YXJ0SGVpZ2h0ID09PSB1bmRlZmluZWQpIHN0YXJ0SGVpZ2h0ID0gMDtcbi8vICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X291dHB1dF9kaXN0cmlidXRpb25cIiwge1xuLy8gICAgICBhbW91bnRzOiBhbW91bnRTdHJzLFxuLy8gICAgICBjdW11bGF0aXZlOiBjdW11bGF0aXZlLFxuLy8gICAgICBmcm9tX2hlaWdodDogc3RhcnRIZWlnaHQsXG4vLyAgICAgIHRvX2hlaWdodDogZW5kSGVpZ2h0XG4vLyAgICB9KTtcbi8vICAgIFxuLy8gICAgY29uc29sZS5sb2coXCJSRVNQT05TRVwiKTtcbi8vICAgIGNvbnNvbGUubG9nKHJlc3ApO1xuLy8gICAgXG4vLyAgICAvLyBidWlsZCBkaXN0cmlidXRpb24gZW50cmllcyBmcm9tIHJlc3BvbnNlXG4vLyAgICBsZXQgZW50cmllcyA9IFtdO1xuLy8gICAgaWYgKCFyZXNwLnJlc3VsdC5kaXN0cmlidXRpb25zKSByZXR1cm4gZW50cmllczsgXG4vLyAgICBmb3IgKGxldCBycGNFbnRyeSBvZiByZXNwLnJlc3VsdC5kaXN0cmlidXRpb25zKSB7XG4vLyAgICAgIGxldCBlbnRyeSA9IE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjT3V0cHV0RGlzdHJpYnV0aW9uRW50cnkocnBjRW50cnkpO1xuLy8gICAgICBlbnRyaWVzLnB1c2goZW50cnkpO1xuLy8gICAgfVxuLy8gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEluZm8oKTogUHJvbWlzZTxNb25lcm9EYWVtb25JbmZvPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEluZm8oKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9pbmZvXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNJbmZvKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U3luY0luZm8oKTogUHJvbWlzZTxNb25lcm9EYWVtb25TeW5jSW5mbz4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRTeW5jSW5mbygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3luY19pbmZvXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNTeW5jSW5mbyhyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhhcmRGb3JrSW5mbygpOiBQcm9taXNlPE1vbmVyb0hhcmRGb3JrSW5mbz4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRIYXJkRm9ya0luZm8oKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImhhcmRfZm9ya19pbmZvXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNIYXJkRm9ya0luZm8ocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBnZXRBbHRDaGFpbnMoKTogUHJvbWlzZTxNb25lcm9BbHRDaGFpbltdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEFsdENoYWlucygpO1xuICAgIFxuLy8gICAgLy8gbW9ja2VkIHJlc3BvbnNlIGZvciB0ZXN0XG4vLyAgICBsZXQgcmVzcCA9IHtcbi8vICAgICAgICBzdGF0dXM6IFwiT0tcIixcbi8vICAgICAgICBjaGFpbnM6IFtcbi8vICAgICAgICAgIHtcbi8vICAgICAgICAgICAgYmxvY2tfaGFzaDogXCI2OTdjZjAzYzg5YTliMTE4ZjdiZGYxMWIxYjNhNmEwMjhkN2IzNjE3ZDJkMGVkOTEzMjJjNTcwOWFjZjc1NjI1XCIsXG4vLyAgICAgICAgICAgIGRpZmZpY3VsdHk6IDE0MTE0NzI5NjM4MzAwMjgwLFxuLy8gICAgICAgICAgICBoZWlnaHQ6IDE1NjIwNjIsXG4vLyAgICAgICAgICAgIGxlbmd0aDogMlxuLy8gICAgICAgICAgfVxuLy8gICAgICAgIF1cbi8vICAgIH1cbiAgICBcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hbHRlcm5hdGVfY2hhaW5zXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICBsZXQgY2hhaW5zID0gW107XG4gICAgaWYgKCFyZXNwLnJlc3VsdC5jaGFpbnMpIHJldHVybiBjaGFpbnM7XG4gICAgZm9yIChsZXQgcnBjQ2hhaW4gb2YgcmVzcC5yZXN1bHQuY2hhaW5zKSBjaGFpbnMucHVzaChNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0FsdENoYWluKHJwY0NoYWluKSk7XG4gICAgcmV0dXJuIGNoYWlucztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWx0QmxvY2tIYXNoZXMoKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRBbHRCbG9ja0hhc2hlcygpO1xuICAgIFxuLy8gICAgLy8gbW9ja2VkIHJlc3BvbnNlIGZvciB0ZXN0XG4vLyAgICBsZXQgcmVzcCA9IHtcbi8vICAgICAgICBzdGF0dXM6IFwiT0tcIixcbi8vICAgICAgICB1bnRydXN0ZWQ6IGZhbHNlLFxuLy8gICAgICAgIGJsa3NfaGFzaGVzOiBbXCI5YzIyNzdjNTQ3MDIzNGJlOGIzMjM4MmNkZjgwOTRhMTAzYWJhNGZjZDVlODc1YTZmYzE1OWRjMmVjMDBlMDExXCIsXCI2MzdjMGUwZjA1NThlMjg0NDkzZjM4YTVmY2NhMzYxNWRiNTk0NThkOTBkM2E1ZWZmMGExOGZmNTliODNmNDZmXCIsXCI2ZjNhZGMxNzRhMmU4MDgyODE5ZWJiOTY1Yzk2YTA5NWUzZThiNjM5MjlhZDliZTJkNzA1YWQ5YzA4NmE2YjFjXCIsXCI2OTdjZjAzYzg5YTliMTE4ZjdiZGYxMWIxYjNhNmEwMjhkN2IzNjE3ZDJkMGVkOTEzMjJjNTcwOWFjZjc1NjI1XCJdXG4vLyAgICB9XG4gICAgXG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJnZXRfYWx0X2Jsb2Nrc19oYXNoZXNcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgaWYgKCFyZXNwLmJsa3NfaGFzaGVzKSByZXR1cm4gW107XG4gICAgcmV0dXJuIHJlc3AuYmxrc19oYXNoZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldERvd25sb2FkTGltaXQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0RG93bmxvYWRMaW1pdCgpO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRCYW5kd2lkdGhMaW1pdHMoKSlbMF07XG4gIH1cbiAgXG4gIGFzeW5jIHNldERvd25sb2FkTGltaXQobGltaXQ6IG51bWJlcik6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnNldERvd25sb2FkTGltaXQobGltaXQpO1xuICAgIGlmIChsaW1pdCA9PSAtMSkgcmV0dXJuIGF3YWl0IHRoaXMucmVzZXREb3dubG9hZExpbWl0KCk7XG4gICAgaWYgKCEoR2VuVXRpbHMuaXNJbnQobGltaXQpICYmIGxpbWl0ID4gMCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkRvd25sb2FkIGxpbWl0IG11c3QgYmUgYW4gaW50ZWdlciBncmVhdGVyIHRoYW4gMFwiKTtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuc2V0QmFuZHdpZHRoTGltaXRzKGxpbWl0LCAwKSlbMF07XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2V0RG93bmxvYWRMaW1pdCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5yZXNldERvd25sb2FkTGltaXQoKTtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuc2V0QmFuZHdpZHRoTGltaXRzKC0xLCAwKSlbMF07XG4gIH1cblxuICBhc3luYyBnZXRVcGxvYWRMaW1pdCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRVcGxvYWRMaW1pdCgpO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRCYW5kd2lkdGhMaW1pdHMoKSlbMV07XG4gIH1cbiAgXG4gIGFzeW5jIHNldFVwbG9hZExpbWl0KGxpbWl0OiBudW1iZXIpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5zZXRVcGxvYWRMaW1pdChsaW1pdCk7XG4gICAgaWYgKGxpbWl0ID09IC0xKSByZXR1cm4gYXdhaXQgdGhpcy5yZXNldFVwbG9hZExpbWl0KCk7XG4gICAgaWYgKCEoR2VuVXRpbHMuaXNJbnQobGltaXQpICYmIGxpbWl0ID4gMCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlVwbG9hZCBsaW1pdCBtdXN0IGJlIGFuIGludGVnZXIgZ3JlYXRlciB0aGFuIDBcIik7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLnNldEJhbmR3aWR0aExpbWl0cygwLCBsaW1pdCkpWzFdO1xuICB9XG4gIFxuICBhc3luYyByZXNldFVwbG9hZExpbWl0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnJlc2V0VXBsb2FkTGltaXQoKTtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuc2V0QmFuZHdpZHRoTGltaXRzKDAsIC0xKSlbMV07XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBlZXJzKCk6IFByb21pc2U8TW9uZXJvUGVlcltdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFBlZXJzKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfY29ubmVjdGlvbnNcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIGxldCBwZWVycyA9IFtdO1xuICAgIGlmICghcmVzcC5yZXN1bHQuY29ubmVjdGlvbnMpIHJldHVybiBwZWVycztcbiAgICBmb3IgKGxldCBycGNDb25uZWN0aW9uIG9mIHJlc3AucmVzdWx0LmNvbm5lY3Rpb25zKSB7XG4gICAgICBwZWVycy5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQ29ubmVjdGlvbihycGNDb25uZWN0aW9uKSk7XG4gICAgfVxuICAgIHJldHVybiBwZWVycztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0S25vd25QZWVycygpOiBQcm9taXNlPE1vbmVyb1BlZXJbXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRLbm93blBlZXJzKCk7XG4gICAgXG4gICAgLy8gdHggY29uZmlnXG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJnZXRfcGVlcl9saXN0XCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIFxuICAgIC8vIGJ1aWxkIHBlZXJzXG4gICAgbGV0IHBlZXJzID0gW107XG4gICAgaWYgKHJlc3AuZ3JheV9saXN0KSB7XG4gICAgICBmb3IgKGxldCBycGNQZWVyIG9mIHJlc3AuZ3JheV9saXN0KSB7XG4gICAgICAgIGxldCBwZWVyID0gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNQZWVyKHJwY1BlZXIpO1xuICAgICAgICBwZWVyLnNldElzT25saW5lKGZhbHNlKTsgLy8gZ3JheSBsaXN0IG1lYW5zIG9mZmxpbmUgbGFzdCBjaGVja2VkXG4gICAgICAgIHBlZXJzLnB1c2gocGVlcik7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChyZXNwLndoaXRlX2xpc3QpIHtcbiAgICAgIGZvciAobGV0IHJwY1BlZXIgb2YgcmVzcC53aGl0ZV9saXN0KSB7XG4gICAgICAgIGxldCBwZWVyID0gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNQZWVyKHJwY1BlZXIpO1xuICAgICAgICBwZWVyLnNldElzT25saW5lKHRydWUpOyAvLyB3aGl0ZSBsaXN0IG1lYW5zIG9ubGluZSBsYXN0IGNoZWNrZWRcbiAgICAgICAgcGVlcnMucHVzaChwZWVyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHBlZXJzO1xuICB9XG4gIFxuICBhc3luYyBzZXRPdXRnb2luZ1BlZXJMaW1pdChsaW1pdDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnNldE91dGdvaW5nUGVlckxpbWl0KGxpbWl0KTtcbiAgICBpZiAoIShHZW5VdGlscy5pc0ludChsaW1pdCkgJiYgbGltaXQgPj0gMCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk91dGdvaW5nIHBlZXIgbGltaXQgbXVzdCBiZSA+PSAwXCIpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwib3V0X3BlZXJzXCIsIHtvdXRfcGVlcnM6IGxpbWl0fSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gIH1cbiAgXG4gIGFzeW5jIHNldEluY29taW5nUGVlckxpbWl0KGxpbWl0OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc2V0SW5jb21pbmdQZWVyTGltaXQobGltaXQpO1xuICAgIGlmICghKEdlblV0aWxzLmlzSW50KGxpbWl0KSAmJiBsaW1pdCA+PSAwKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiSW5jb21pbmcgcGVlciBsaW1pdCBtdXN0IGJlID49IDBcIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJpbl9wZWVyc1wiLCB7aW5fcGVlcnM6IGxpbWl0fSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBlZXJCYW5zKCk6IFByb21pc2U8TW9uZXJvQmFuW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0UGVlckJhbnMoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9iYW5zXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICBsZXQgYmFucyA9IFtdO1xuICAgIGZvciAobGV0IHJwY0JhbiBvZiByZXNwLnJlc3VsdC5iYW5zKSB7XG4gICAgICBsZXQgYmFuID0gbmV3IE1vbmVyb0JhbigpO1xuICAgICAgYmFuLnNldEhvc3QocnBjQmFuLmhvc3QpO1xuICAgICAgYmFuLnNldElwKHJwY0Jhbi5pcCk7XG4gICAgICBiYW4uc2V0U2Vjb25kcyhycGNCYW4uc2Vjb25kcyk7XG4gICAgICBiYW5zLnB1c2goYmFuKTtcbiAgICB9XG4gICAgcmV0dXJuIGJhbnM7XG4gIH1cbiAgXG4gIGFzeW5jIHNldFBlZXJCYW5zKGJhbnM6IE1vbmVyb0JhbltdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnNldFBlZXJCYW5zKGJhbnMpO1xuICAgIGxldCBycGNCYW5zID0gW107XG4gICAgZm9yIChsZXQgYmFuIG9mIGJhbnMpIHJwY0JhbnMucHVzaChNb25lcm9EYWVtb25ScGMuY29udmVydFRvUnBjQmFuKGJhbikpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2V0X2JhbnNcIiwge2JhbnM6IHJwY0JhbnN9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0YXJ0TWluaW5nKGFkZHJlc3M6IHN0cmluZywgbnVtVGhyZWFkcz86IG51bWJlciwgaXNCYWNrZ3JvdW5kPzogYm9vbGVhbiwgaWdub3JlQmF0dGVyeT86IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc3RhcnRNaW5pbmcoYWRkcmVzcywgbnVtVGhyZWFkcywgaXNCYWNrZ3JvdW5kLCBpZ25vcmVCYXR0ZXJ5KTtcbiAgICBhc3NlcnQoYWRkcmVzcywgXCJNdXN0IHByb3ZpZGUgYWRkcmVzcyB0byBtaW5lIHRvXCIpO1xuICAgIGFzc2VydChHZW5VdGlscy5pc0ludChudW1UaHJlYWRzKSAmJiBudW1UaHJlYWRzID4gMCwgXCJOdW1iZXIgb2YgdGhyZWFkcyBtdXN0IGJlIGFuIGludGVnZXIgZ3JlYXRlciB0aGFuIDBcIik7XG4gICAgYXNzZXJ0KGlzQmFja2dyb3VuZCA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiBpc0JhY2tncm91bmQgPT09IFwiYm9vbGVhblwiKTtcbiAgICBhc3NlcnQoaWdub3JlQmF0dGVyeSA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiBpZ25vcmVCYXR0ZXJ5ID09PSBcImJvb2xlYW5cIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJzdGFydF9taW5pbmdcIiwge1xuICAgICAgbWluZXJfYWRkcmVzczogYWRkcmVzcyxcbiAgICAgIHRocmVhZHNfY291bnQ6IG51bVRocmVhZHMsXG4gICAgICBkb19iYWNrZ3JvdW5kX21pbmluZzogaXNCYWNrZ3JvdW5kLFxuICAgICAgaWdub3JlX2JhdHRlcnk6IGlnbm9yZUJhdHRlcnksXG4gICAgfSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0b3BNaW5pbmcoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnN0b3BNaW5pbmcoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcInN0b3BfbWluaW5nXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICB9XG4gIFxuICBhc3luYyBnZXRNaW5pbmdTdGF0dXMoKTogUHJvbWlzZTxNb25lcm9NaW5pbmdTdGF0dXM+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0TWluaW5nU3RhdHVzKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJtaW5pbmdfc3RhdHVzXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY01pbmluZ1N0YXR1cyhyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgc3VibWl0QmxvY2tzKGJsb2NrQmxvYnM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnN1Ym1pdEJsb2NrcygpO1xuICAgIGFzc2VydChBcnJheS5pc0FycmF5KGJsb2NrQmxvYnMpICYmIGJsb2NrQmxvYnMubGVuZ3RoID4gMCwgXCJNdXN0IHByb3ZpZGUgYW4gYXJyYXkgb2YgbWluZWQgYmxvY2sgYmxvYnMgdG8gc3VibWl0XCIpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3VibWl0X2Jsb2NrXCIsIGJsb2NrQmxvYnMpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgfVxuXG4gIGFzeW5jIHBydW5lQmxvY2tjaGFpbihjaGVjazogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvUHJ1bmVSZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24ucHJ1bmVCbG9ja2NoYWluKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJwcnVuZV9ibG9ja2NoYWluXCIsIHtjaGVjazogY2hlY2t9LCAwKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgbGV0IHJlc3VsdCA9IG5ldyBNb25lcm9QcnVuZVJlc3VsdCgpO1xuICAgIHJlc3VsdC5zZXRJc1BydW5lZChyZXNwLnJlc3VsdC5wcnVuZWQpO1xuICAgIHJlc3VsdC5zZXRQcnVuaW5nU2VlZChyZXNwLnJlc3VsdC5wcnVuaW5nX3NlZWQpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrRm9yVXBkYXRlKCk6IFByb21pc2U8TW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uY2hlY2tGb3JVcGRhdGUoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcInVwZGF0ZVwiLCB7Y29tbWFuZDogXCJjaGVja1wifSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVXBkYXRlQ2hlY2tSZXN1bHQocmVzcCk7XG4gIH1cbiAgXG4gIGFzeW5jIGRvd25sb2FkVXBkYXRlKHBhdGg/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmRvd25sb2FkVXBkYXRlKHBhdGgpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwidXBkYXRlXCIsIHtjb21tYW5kOiBcImRvd25sb2FkXCIsIHBhdGg6IHBhdGh9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNVcGRhdGVEb3dubG9hZFJlc3VsdChyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgc3RvcCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc3RvcCgpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwic3RvcF9kYWVtb25cIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gIH1cbiAgXG4gIGFzeW5jIHdhaXRGb3JOZXh0QmxvY2tIZWFkZXIoKTogUHJvbWlzZTxNb25lcm9CbG9ja0hlYWRlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi53YWl0Rm9yTmV4dEJsb2NrSGVhZGVyKCk7XG4gICAgbGV0IHRoYXQgPSB0aGlzO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyBmdW5jdGlvbihyZXNvbHZlKSB7XG4gICAgICBhd2FpdCB0aGF0LmFkZExpc3RlbmVyKG5ldyBjbGFzcyBleHRlbmRzIE1vbmVyb0RhZW1vbkxpc3RlbmVyIHtcbiAgICAgICAgYXN5bmMgb25CbG9ja0hlYWRlcihoZWFkZXIpIHtcbiAgICAgICAgICBhd2FpdCB0aGF0LnJlbW92ZUxpc3RlbmVyKHRoaXMpO1xuICAgICAgICAgIHJlc29sdmUoaGVhZGVyKTtcbiAgICAgICAgfVxuICAgICAgfSk7IFxuICAgIH0pO1xuICB9XG5cbiAgZ2V0UG9sbEludGVydmFsKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLnBvbGxJbnRlcnZhbDtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0gQUREIEpTRE9DIEZPUiBTVVBQT1JURUQgREVGQVVMVCBJTVBMRU1FTlRBVElPTlMgLS0tLS0tLS0tLS0tLS1cbiAgYXN5bmMgZ2V0VHgodHhIYXNoPzogc3RyaW5nLCBwcnVuZSA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9UeD4geyByZXR1cm4gc3VwZXIuZ2V0VHgodHhIYXNoLCBwcnVuZSk7IH07XG4gIGFzeW5jIGdldFR4SGV4KHR4SGFzaDogc3RyaW5nLCBwcnVuZSA9IGZhbHNlKTogUHJvbWlzZTxzdHJpbmc+IHsgcmV0dXJuIHN1cGVyLmdldFR4SGV4KHR4SGFzaCwgcHJ1bmUpOyB9O1xuICBhc3luYyBnZXRLZXlJbWFnZVNwZW50U3RhdHVzKGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlU3BlbnRTdGF0dXM+IHsgcmV0dXJuIHN1cGVyLmdldEtleUltYWdlU3BlbnRTdGF0dXMoa2V5SW1hZ2UpOyB9XG4gIGFzeW5jIHNldFBlZXJCYW4oYmFuOiBNb25lcm9CYW4pOiBQcm9taXNlPHZvaWQ+IHsgcmV0dXJuIHN1cGVyLnNldFBlZXJCYW4oYmFuKTsgfVxuICBhc3luYyBzdWJtaXRCbG9jayhibG9ja0Jsb2I6IHN0cmluZyk6IFByb21pc2U8dm9pZD4geyByZXR1cm4gc3VwZXIuc3VibWl0QmxvY2soYmxvY2tCbG9iKTsgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwcm90ZWN0ZWQgcmVmcmVzaExpc3RlbmluZygpIHtcbiAgICBpZiAodGhpcy5wb2xsTGlzdGVuZXIgPT0gdW5kZWZpbmVkICYmIHRoaXMubGlzdGVuZXJzLmxlbmd0aCkgdGhpcy5wb2xsTGlzdGVuZXIgPSBuZXcgRGFlbW9uUG9sbGVyKHRoaXMpO1xuICAgIGlmICh0aGlzLnBvbGxMaXN0ZW5lciAhPT0gdW5kZWZpbmVkKSB0aGlzLnBvbGxMaXN0ZW5lci5zZXRJc1BvbGxpbmcodGhpcy5saXN0ZW5lcnMubGVuZ3RoID4gMCk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBnZXRCYW5kd2lkdGhMaW1pdHMoKSB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJnZXRfbGltaXRcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgcmV0dXJuIFtyZXNwLmxpbWl0X2Rvd24sIHJlc3AubGltaXRfdXBdO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgc2V0QmFuZHdpZHRoTGltaXRzKGRvd25MaW1pdCwgdXBMaW1pdCkge1xuICAgIGlmIChkb3duTGltaXQgPT09IHVuZGVmaW5lZCkgZG93bkxpbWl0ID0gMDtcbiAgICBpZiAodXBMaW1pdCA9PT0gdW5kZWZpbmVkKSB1cExpbWl0ID0gMDtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcInNldF9saW1pdFwiLCB7bGltaXRfZG93bjogZG93bkxpbWl0LCBsaW1pdF91cDogdXBMaW1pdH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIHJldHVybiBbcmVzcC5saW1pdF9kb3duLCByZXNwLmxpbWl0X3VwXTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhIGNvbnRpZ3VvdXMgY2h1bmsgb2YgYmxvY2tzIHN0YXJ0aW5nIGZyb20gYSBnaXZlbiBoZWlnaHQgdXAgdG8gYSBtYXhpbXVtXG4gICAqIGhlaWdodCBvciBhbW91bnQgb2YgYmxvY2sgZGF0YSBmZXRjaGVkIGZyb20gdGhlIGJsb2NrY2hhaW4sIHdoaWNoZXZlciBjb21lcyBmaXJzdC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbc3RhcnRIZWlnaHRdIC0gc3RhcnQgaGVpZ2h0IHRvIHJldHJpZXZlIGJsb2NrcyAoZGVmYXVsdCAwKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW21heEhlaWdodF0gLSBtYXhpbXVtIGVuZCBoZWlnaHQgdG8gcmV0cmlldmUgYmxvY2tzIChkZWZhdWx0IGJsb2NrY2hhaW4gaGVpZ2h0KVxuICAgKiBAcGFyYW0ge251bWJlcn0gW21heFJlcVNpemVdIC0gbWF4aW11bSBhbW91bnQgb2YgYmxvY2sgZGF0YSB0byBmZXRjaCBmcm9tIHRoZSBibG9ja2NoYWluIGluIGJ5dGVzIChkZWZhdWx0IDMsMDAwLDAwMCBieXRlcylcbiAgICogQHJldHVybiB7TW9uZXJvQmxvY2tbXX0gYXJlIHRoZSByZXN1bHRpbmcgY2h1bmsgb2YgYmxvY2tzXG4gICAqL1xuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0TWF4QmxvY2tzKHN0YXJ0SGVpZ2h0LCBtYXhIZWlnaHQsIG1heFJlcVNpemUpIHtcbiAgICBpZiAoc3RhcnRIZWlnaHQgPT09IHVuZGVmaW5lZCkgc3RhcnRIZWlnaHQgPSAwO1xuICAgIGlmIChtYXhIZWlnaHQgPT09IHVuZGVmaW5lZCkgbWF4SGVpZ2h0ID0gYXdhaXQgdGhpcy5nZXRIZWlnaHQoKSAtIDE7XG4gICAgaWYgKG1heFJlcVNpemUgPT09IHVuZGVmaW5lZCkgbWF4UmVxU2l6ZSA9IE1vbmVyb0RhZW1vblJwYy5NQVhfUkVRX1NJWkU7XG4gICAgXG4gICAgLy8gZGV0ZXJtaW5lIGVuZCBoZWlnaHQgdG8gZmV0Y2hcbiAgICBsZXQgcmVxU2l6ZSA9IDA7XG4gICAgbGV0IGVuZEhlaWdodCA9IHN0YXJ0SGVpZ2h0IC0gMTtcbiAgICB3aGlsZSAocmVxU2l6ZSA8IG1heFJlcVNpemUgJiYgZW5kSGVpZ2h0IDwgbWF4SGVpZ2h0KSB7XG4gICAgICBcbiAgICAgIC8vIGdldCBoZWFkZXIgb2YgbmV4dCBibG9ja1xuICAgICAgbGV0IGhlYWRlciA9IGF3YWl0IHRoaXMuZ2V0QmxvY2tIZWFkZXJCeUhlaWdodENhY2hlZChlbmRIZWlnaHQgKyAxLCBtYXhIZWlnaHQpO1xuICAgICAgXG4gICAgICAvLyBibG9jayBjYW5ub3QgYmUgYmlnZ2VyIHRoYW4gbWF4IHJlcXVlc3Qgc2l6ZVxuICAgICAgYXNzZXJ0KGhlYWRlci5nZXRTaXplKCkgPD0gbWF4UmVxU2l6ZSwgXCJCbG9jayBleGNlZWRzIG1heGltdW0gcmVxdWVzdCBzaXplOiBcIiArIGhlYWRlci5nZXRTaXplKCkpO1xuICAgICAgXG4gICAgICAvLyBkb25lIGl0ZXJhdGluZyBpZiBmZXRjaGluZyBibG9jayB3b3VsZCBleGNlZWQgbWF4IHJlcXVlc3Qgc2l6ZVxuICAgICAgaWYgKHJlcVNpemUgKyBoZWFkZXIuZ2V0U2l6ZSgpID4gbWF4UmVxU2l6ZSkgYnJlYWs7XG4gICAgICBcbiAgICAgIC8vIG90aGVyd2lzZSBibG9jayBpcyBpbmNsdWRlZFxuICAgICAgcmVxU2l6ZSArPSBoZWFkZXIuZ2V0U2l6ZSgpO1xuICAgICAgZW5kSGVpZ2h0Kys7XG4gICAgfVxuICAgIHJldHVybiBlbmRIZWlnaHQgPj0gc3RhcnRIZWlnaHQgPyBhd2FpdCB0aGlzLmdldEJsb2Nrc0J5UmFuZ2Uoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCkgOiBbXTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhIGhlYWRlciBieSBoZWlnaHQgZnJvbSB0aGUgY2FjaGUgb3IgZmV0Y2hlcyBhbmQgY2FjaGVzIGEgaGVhZGVyXG4gICAqIHJhbmdlIGlmIG5vdCBhbHJlYWR5IGluIHRoZSBjYWNoZS5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHQgLSBoZWlnaHQgb2YgdGhlIGhlYWRlciB0byByZXRyaWV2ZSBmcm9tIHRoZSBjYWNoZVxuICAgKiBAcGFyYW0ge251bWJlcn0gbWF4SGVpZ2h0IC0gbWF4aW11bSBoZWlnaHQgb2YgaGVhZGVycyB0byBjYWNoZVxuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIGdldEJsb2NrSGVhZGVyQnlIZWlnaHRDYWNoZWQoaGVpZ2h0LCBtYXhIZWlnaHQpIHtcbiAgICBcbiAgICAvLyBnZXQgaGVhZGVyIGZyb20gY2FjaGVcbiAgICBsZXQgY2FjaGVkSGVhZGVyID0gdGhpcy5jYWNoZWRIZWFkZXJzW2hlaWdodF07XG4gICAgaWYgKGNhY2hlZEhlYWRlcikgcmV0dXJuIGNhY2hlZEhlYWRlcjtcbiAgICBcbiAgICAvLyBmZXRjaCBhbmQgY2FjaGUgaGVhZGVycyBpZiBub3QgaW4gY2FjaGVcbiAgICBsZXQgZW5kSGVpZ2h0ID0gTWF0aC5taW4obWF4SGVpZ2h0LCBoZWlnaHQgKyBNb25lcm9EYWVtb25ScGMuTlVNX0hFQURFUlNfUEVSX1JFUSAtIDEpOyAgLy8gVE9ETzogY291bGQgc3BlY2lmeSBlbmQgaGVpZ2h0IHRvIGNhY2hlIHRvIG9wdGltaXplIHNtYWxsIHJlcXVlc3RzICh3b3VsZCBsaWtlIHRvIGhhdmUgdGltZSBwcm9maWxpbmcgaW4gcGxhY2UgdGhvdWdoKVxuICAgIGxldCBoZWFkZXJzID0gYXdhaXQgdGhpcy5nZXRCbG9ja0hlYWRlcnNCeVJhbmdlKGhlaWdodCwgZW5kSGVpZ2h0KTtcbiAgICBmb3IgKGxldCBoZWFkZXIgb2YgaGVhZGVycykge1xuICAgICAgdGhpcy5jYWNoZWRIZWFkZXJzW2hlYWRlci5nZXRIZWlnaHQoKV0gPSBoZWFkZXI7XG4gICAgfVxuICAgIFxuICAgIC8vIHJldHVybiB0aGUgY2FjaGVkIGhlYWRlclxuICAgIHJldHVybiB0aGlzLmNhY2hlZEhlYWRlcnNbaGVpZ2h0XTtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFNUQVRJQyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBzdGF0aWMgYXN5bmMgY29ubmVjdFRvRGFlbW9uUnBjKHVyaU9yQ29uZmlnOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHwgUGFydGlhbDxNb25lcm9EYWVtb25Db25maWc+IHwgc3RyaW5nW10sIHVzZXJuYW1lPzogc3RyaW5nLCBwYXNzd29yZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvRGFlbW9uUnBjPiB7XG4gICAgbGV0IGNvbmZpZyA9IE1vbmVyb0RhZW1vblJwYy5ub3JtYWxpemVDb25maWcodXJpT3JDb25maWcsIHVzZXJuYW1lLCBwYXNzd29yZCk7XG4gICAgaWYgKGNvbmZpZy5jbWQpIHJldHVybiBNb25lcm9EYWVtb25ScGMuc3RhcnRNb25lcm9kUHJvY2Vzcyhjb25maWcpO1xuICAgIHJldHVybiBuZXcgTW9uZXJvRGFlbW9uUnBjKGNvbmZpZywgY29uZmlnLnByb3h5VG9Xb3JrZXIgPyBhd2FpdCBNb25lcm9EYWVtb25ScGNQcm94eS5jb25uZWN0KGNvbmZpZykgOiB1bmRlZmluZWQpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIHN0YXJ0TW9uZXJvZFByb2Nlc3MoY29uZmlnOiBNb25lcm9EYWVtb25Db25maWcpOiBQcm9taXNlPE1vbmVyb0RhZW1vblJwYz4ge1xuICAgIGFzc2VydChHZW5VdGlscy5pc0FycmF5KGNvbmZpZy5jbWQpLCBcIk11c3QgcHJvdmlkZSBzdHJpbmcgYXJyYXkgd2l0aCBjb21tYW5kIGxpbmUgcGFyYW1ldGVyc1wiKTtcbiAgICBcbiAgICAvLyBzdGFydCBwcm9jZXNzXG4gICAgbGV0IHByb2Nlc3MgPSByZXF1aXJlKCdjaGlsZF9wcm9jZXNzJykuc3Bhd24oY29uZmlnLmNtZFswXSwgY29uZmlnLmNtZC5zbGljZSgxKSwge30pO1xuICAgIHByb2Nlc3Muc3Rkb3V0LnNldEVuY29kaW5nKCd1dGY4Jyk7XG4gICAgcHJvY2Vzcy5zdGRlcnIuc2V0RW5jb2RpbmcoJ3V0ZjgnKTtcbiAgICBcbiAgICAvLyByZXR1cm4gcHJvbWlzZSB3aGljaCByZXNvbHZlcyBhZnRlciBzdGFydGluZyBtb25lcm9kXG4gICAgbGV0IHVyaTtcbiAgICBsZXQgb3V0cHV0ID0gXCJcIjtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICBcbiAgICAgIC8vIGhhbmRsZSBzdGRvdXRcbiAgICAgIHByb2Nlc3Muc3Rkb3V0Lm9uKCdkYXRhJywgYXN5bmMgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBsZXQgbGluZSA9IGRhdGEudG9TdHJpbmcoKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLmxvZygyLCBsaW5lKTtcbiAgICAgICAgb3V0cHV0ICs9IGxpbmUgKyAnXFxuJzsgLy8gY2FwdHVyZSBvdXRwdXQgaW4gY2FzZSBvZiBlcnJvclxuICAgICAgICBcbiAgICAgICAgLy8gZXh0cmFjdCB1cmkgZnJvbSBlLmcuIFwiSSBCaW5kaW5nIG9uIDEyNy4wLjAuMSAoSVB2NCk6MzgwODVcIlxuICAgICAgICBsZXQgdXJpTGluZUNvbnRhaW5zID0gXCJCaW5kaW5nIG9uIFwiO1xuICAgICAgICBsZXQgdXJpTGluZUNvbnRhaW5zSWR4ID0gbGluZS5pbmRleE9mKHVyaUxpbmVDb250YWlucyk7XG4gICAgICAgIGlmICh1cmlMaW5lQ29udGFpbnNJZHggPj0gMCkge1xuICAgICAgICAgIGxldCBob3N0ID0gbGluZS5zdWJzdHJpbmcodXJpTGluZUNvbnRhaW5zSWR4ICsgdXJpTGluZUNvbnRhaW5zLmxlbmd0aCwgbGluZS5sYXN0SW5kZXhPZignICcpKTtcbiAgICAgICAgICBsZXQgdW5mb3JtYXR0ZWRMaW5lID0gbGluZS5yZXBsYWNlKC9cXHUwMDFiXFxbLio/bS9nLCAnJykudHJpbSgpOyAvLyByZW1vdmUgY29sb3IgZm9ybWF0dGluZ1xuICAgICAgICAgIGxldCBwb3J0ID0gdW5mb3JtYXR0ZWRMaW5lLnN1YnN0cmluZyh1bmZvcm1hdHRlZExpbmUubGFzdEluZGV4T2YoJzonKSArIDEpO1xuICAgICAgICAgIGxldCBzc2xJZHggPSBjb25maWcuY21kLmluZGV4T2YoXCItLXJwYy1zc2xcIik7XG4gICAgICAgICAgbGV0IHNzbEVuYWJsZWQgPSBzc2xJZHggPj0gMCA/IFwiZW5hYmxlZFwiID09IGNvbmZpZy5jbWRbc3NsSWR4ICsgMV0udG9Mb3dlckNhc2UoKSA6IGZhbHNlO1xuICAgICAgICAgIHVyaSA9IChzc2xFbmFibGVkID8gXCJodHRwc1wiIDogXCJodHRwXCIpICsgXCI6Ly9cIiArIGhvc3QgKyBcIjpcIiArIHBvcnQ7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIHJlYWQgc3VjY2VzcyBtZXNzYWdlXG4gICAgICAgIGlmIChsaW5lLmluZGV4T2YoXCJjb3JlIFJQQyBzZXJ2ZXIgc3RhcnRlZCBva1wiKSA+PSAwKSB7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gZ2V0IHVzZXJuYW1lIGFuZCBwYXNzd29yZCBmcm9tIHBhcmFtc1xuICAgICAgICAgIGxldCB1c2VyUGFzc0lkeCA9IGNvbmZpZy5jbWQuaW5kZXhPZihcIi0tcnBjLWxvZ2luXCIpO1xuICAgICAgICAgIGxldCB1c2VyUGFzcyA9IHVzZXJQYXNzSWR4ID49IDAgPyBjb25maWcuY21kW3VzZXJQYXNzSWR4ICsgMV0gOiB1bmRlZmluZWQ7XG4gICAgICAgICAgbGV0IHVzZXJuYW1lID0gdXNlclBhc3MgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHVzZXJQYXNzLnN1YnN0cmluZygwLCB1c2VyUGFzcy5pbmRleE9mKCc6JykpO1xuICAgICAgICAgIGxldCBwYXNzd29yZCA9IHVzZXJQYXNzID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB1c2VyUGFzcy5zdWJzdHJpbmcodXNlclBhc3MuaW5kZXhPZignOicpICsgMSk7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gY3JlYXRlIGNsaWVudCBjb25uZWN0ZWQgdG8gaW50ZXJuYWwgcHJvY2Vzc1xuICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZy5jb3B5KCkuc2V0U2VydmVyKHt1cmk6IHVyaSwgdXNlcm5hbWU6IHVzZXJuYW1lLCBwYXNzd29yZDogcGFzc3dvcmQsIHJlamVjdFVuYXV0aG9yaXplZDogY29uZmlnLmdldFNlcnZlcigpID8gY29uZmlnLmdldFNlcnZlcigpLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdW5kZWZpbmVkfSk7XG4gICAgICAgICAgY29uZmlnLnNldFByb3h5VG9Xb3JrZXIoY29uZmlnLnByb3h5VG9Xb3JrZXIpO1xuICAgICAgICAgIGNvbmZpZy5jbWQgPSB1bmRlZmluZWRcbiAgICAgICAgICBsZXQgZGFlbW9uID0gYXdhaXQgTW9uZXJvRGFlbW9uUnBjLmNvbm5lY3RUb0RhZW1vblJwYyhjb25maWcpO1xuICAgICAgICAgIGRhZW1vbi5wcm9jZXNzID0gcHJvY2VzcztcbiAgICAgICAgICBcbiAgICAgICAgICAvLyByZXNvbHZlIHByb21pc2Ugd2l0aCBjbGllbnQgY29ubmVjdGVkIHRvIGludGVybmFsIHByb2Nlc3MgXG4gICAgICAgICAgdGhpcy5pc1Jlc29sdmVkID0gdHJ1ZTtcbiAgICAgICAgICByZXNvbHZlKGRhZW1vbik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgXG4gICAgICAvLyBoYW5kbGUgc3RkZXJyXG4gICAgICBwcm9jZXNzLnN0ZGVyci5vbignZGF0YScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgaWYgKExpYnJhcnlVdGlscy5nZXRMb2dMZXZlbCgpID49IDIpIGNvbnNvbGUuZXJyb3IoZGF0YSk7XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgLy8gaGFuZGxlIGV4aXRcbiAgICAgIHByb2Nlc3Mub24oXCJleGl0XCIsIGZ1bmN0aW9uKGNvZGUpIHtcbiAgICAgICAgaWYgKCF0aGlzLmlzUmVzb2x2ZWQpIHJlamVjdChuZXcgRXJyb3IoXCJtb25lcm9kIHByb2Nlc3MgdGVybWluYXRlZCB3aXRoIGV4aXQgY29kZSBcIiArIGNvZGUgKyAob3V0cHV0ID8gXCI6XFxuXFxuXCIgKyBvdXRwdXQgOiBcIlwiKSkpO1xuICAgICAgfSk7XG4gICAgICBcbiAgICAgIC8vIGhhbmRsZSBlcnJvclxuICAgICAgcHJvY2Vzcy5vbihcImVycm9yXCIsIGZ1bmN0aW9uKGVycikge1xuICAgICAgICBpZiAoZXJyLm1lc3NhZ2UuaW5kZXhPZihcIkVOT0VOVFwiKSA+PSAwKSByZWplY3QobmV3IEVycm9yKFwibW9uZXJvZCBkb2VzIG5vdCBleGlzdCBhdCBwYXRoICdcIiArIGNvbmZpZy5jbWRbMF0gKyBcIidcIikpO1xuICAgICAgICBpZiAoIXRoaXMuaXNSZXNvbHZlZCkgcmVqZWN0KGVycik7XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgLy8gaGFuZGxlIHVuY2F1Z2h0IGV4Y2VwdGlvblxuICAgICAgcHJvY2Vzcy5vbihcInVuY2F1Z2h0RXhjZXB0aW9uXCIsIGZ1bmN0aW9uKGVyciwgb3JpZ2luKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJVbmNhdWdodCBleGNlcHRpb24gaW4gbW9uZXJvZCBwcm9jZXNzOiBcIiArIGVyci5tZXNzYWdlKTtcbiAgICAgICAgY29uc29sZS5lcnJvcihvcmlnaW4pO1xuICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIG5vcm1hbGl6ZUNvbmZpZyh1cmlPckNvbmZpZzogc3RyaW5nIHwgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPiB8IFBhcnRpYWw8TW9uZXJvRGFlbW9uQ29uZmlnPiB8IHN0cmluZ1tdLCB1c2VybmFtZT86IHN0cmluZywgcGFzc3dvcmQ/OiBzdHJpbmcpOiBNb25lcm9EYWVtb25Db25maWcge1xuICAgIGxldCBjb25maWc6IHVuZGVmaW5lZCB8IFBhcnRpYWw8TW9uZXJvRGFlbW9uQ29uZmlnPiA9IHVuZGVmaW5lZDtcbiAgICBpZiAodHlwZW9mIHVyaU9yQ29uZmlnID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBjb25maWcgPSBuZXcgTW9uZXJvRGFlbW9uQ29uZmlnKHtzZXJ2ZXI6IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHVyaU9yQ29uZmlnIGFzIHN0cmluZywgdXNlcm5hbWUsIHBhc3N3b3JkKX0pO1xuICAgIH0gZWxzZSBpZiAoKHVyaU9yQ29uZmlnIGFzIFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4pLnVyaSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25maWcgPSBuZXcgTW9uZXJvRGFlbW9uQ29uZmlnKHtzZXJ2ZXI6IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHVyaU9yQ29uZmlnIGFzIFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4pfSk7XG5cbiAgICAgIC8vIHRyYW5zZmVyIHdvcmtlciBwcm94eSBzZXR0aW5nIGZyb20gcnBjIGNvbm5lY3Rpb24gdG8gZGFlbW9uIGNvbmZpZ1xuICAgICAgY29uZmlnLnNldFByb3h5VG9Xb3JrZXIoY29uZmlnLnByb3h5VG9Xb3JrZXIpO1xuICAgICAgY29uZmlnLmdldFNlcnZlcigpLnNldFByb3h5VG9Xb3JrZXIoTW9uZXJvUnBjQ29ubmVjdGlvbi5ERUZBVUxUX0NPTkZJRy5wcm94eVRvV29ya2VyKTtcbiAgICB9IGVsc2UgaWYgKEdlblV0aWxzLmlzQXJyYXkodXJpT3JDb25maWcpKSB7XG4gICAgICBjb25maWcgPSBuZXcgTW9uZXJvRGFlbW9uQ29uZmlnKHtjbWQ6IHVyaU9yQ29uZmlnIGFzIHN0cmluZ1tdfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbmZpZyA9IG5ldyBNb25lcm9EYWVtb25Db25maWcodXJpT3JDb25maWcgYXMgUGFydGlhbDxNb25lcm9EYWVtb25Db25maWc+KTtcbiAgICB9XG4gICAgaWYgKGNvbmZpZy5wcm94eVRvV29ya2VyID09PSB1bmRlZmluZWQpIGNvbmZpZy5wcm94eVRvV29ya2VyID0gdHJ1ZTtcbiAgICBpZiAoY29uZmlnLnBvbGxJbnRlcnZhbCA9PT0gdW5kZWZpbmVkKSBjb25maWcucG9sbEludGVydmFsID0gTW9uZXJvRGFlbW9uUnBjLkRFRkFVTFRfUE9MTF9QRVJJT0Q7XG4gICAgcmV0dXJuIGNvbmZpZyBhcyBNb25lcm9EYWVtb25Db25maWc7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKSB7XG4gICAgaWYgKHJlc3Auc3RhdHVzICE9PSBcIk9LXCIpIHRocm93IG5ldyBNb25lcm9FcnJvcihyZXNwLnN0YXR1cyk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY0Jsb2NrSGVhZGVyKHJwY0hlYWRlcikge1xuICAgIGlmICghcnBjSGVhZGVyKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIGxldCBoZWFkZXIgPSBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjSGVhZGVyKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY0hlYWRlcltrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJibG9ja19zaXplXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0U2l6ZSwgaGVhZGVyLnNldFNpemUsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGVwdGhcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXREZXB0aCwgaGVhZGVyLnNldERlcHRoLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRpZmZpY3VsdHlcIikgeyB9ICAvLyBoYW5kbGVkIGJ5IHdpZGVfZGlmZmljdWx0eVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImN1bXVsYXRpdmVfZGlmZmljdWx0eVwiKSB7IH0gLy8gaGFuZGxlZCBieSB3aWRlX2N1bXVsYXRpdmVfZGlmZmljdWx0eVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRpZmZpY3VsdHlfdG9wNjRcIikgeyB9ICAvLyBoYW5kbGVkIGJ5IHdpZGVfZGlmZmljdWx0eVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImN1bXVsYXRpdmVfZGlmZmljdWx0eV90b3A2NFwiKSB7IH0gLy8gaGFuZGxlZCBieSB3aWRlX2N1bXVsYXRpdmVfZGlmZmljdWx0eVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndpZGVfZGlmZmljdWx0eVwiKSBoZWFkZXIuc2V0RGlmZmljdWx0eShHZW5VdGlscy5yZWNvbmNpbGUoaGVhZGVyLmdldERpZmZpY3VsdHkoKSwgTW9uZXJvRGFlbW9uUnBjLnByZWZpeGVkSGV4VG9CSSh2YWwpKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2lkZV9jdW11bGF0aXZlX2RpZmZpY3VsdHlcIikgaGVhZGVyLnNldEN1bXVsYXRpdmVEaWZmaWN1bHR5KEdlblV0aWxzLnJlY29uY2lsZShoZWFkZXIuZ2V0Q3VtdWxhdGl2ZURpZmZpY3VsdHkoKSwgTW9uZXJvRGFlbW9uUnBjLnByZWZpeGVkSGV4VG9CSSh2YWwpKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGFzaFwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldEhhc2gsIGhlYWRlci5zZXRIYXNoLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhlaWdodFwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldEhlaWdodCwgaGVhZGVyLnNldEhlaWdodCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtYWpvcl92ZXJzaW9uXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0TWFqb3JWZXJzaW9uLCBoZWFkZXIuc2V0TWFqb3JWZXJzaW9uLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm1pbm9yX3ZlcnNpb25cIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRNaW5vclZlcnNpb24sIGhlYWRlci5zZXRNaW5vclZlcnNpb24sIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibm9uY2VcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXROb25jZSwgaGVhZGVyLnNldE5vbmNlLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm51bV90eGVzXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0TnVtVHhzLCBoZWFkZXIuc2V0TnVtVHhzLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm9ycGhhbl9zdGF0dXNcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRPcnBoYW5TdGF0dXMsIGhlYWRlci5zZXRPcnBoYW5TdGF0dXMsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHJldl9oYXNoXCIgfHwga2V5ID09PSBcInByZXZfaWRcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRQcmV2SGFzaCwgaGVhZGVyLnNldFByZXZIYXNoLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJld2FyZFwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldFJld2FyZCwgaGVhZGVyLnNldFJld2FyZCwgQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRpbWVzdGFtcFwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldFRpbWVzdGFtcCwgaGVhZGVyLnNldFRpbWVzdGFtcCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja193ZWlnaHRcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRXZWlnaHQsIGhlYWRlci5zZXRXZWlnaHQsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibG9uZ190ZXJtX3dlaWdodFwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldExvbmdUZXJtV2VpZ2h0LCBoZWFkZXIuc2V0TG9uZ1Rlcm1XZWlnaHQsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicG93X2hhc2hcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRQb3dIYXNoLCBoZWFkZXIuc2V0UG93SGFzaCwgdmFsID09PSBcIlwiID8gdW5kZWZpbmVkIDogdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9oYXNoZXNcIikge30gIC8vIHVzZWQgaW4gYmxvY2sgbW9kZWwsIG5vdCBoZWFkZXIgbW9kZWxcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtaW5lcl90eFwiKSB7fSAgIC8vIHVzZWQgaW4gYmxvY2sgbW9kZWwsIG5vdCBoZWFkZXIgbW9kZWxcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtaW5lcl90eF9oYXNoXCIpIGhlYWRlci5zZXRNaW5lclR4SGFzaCh2YWwpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgYmxvY2sgaGVhZGVyIGZpZWxkOiAnXCIgKyBrZXkgKyBcIic6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIGhlYWRlcjtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjQmxvY2socnBjQmxvY2spIHtcbiAgICBcbiAgICAvLyBidWlsZCBibG9ja1xuICAgIGxldCBibG9jayA9IG5ldyBNb25lcm9CbG9jayhNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Jsb2NrSGVhZGVyKHJwY0Jsb2NrLmJsb2NrX2hlYWRlciA/IHJwY0Jsb2NrLmJsb2NrX2hlYWRlciA6IHJwY0Jsb2NrKSBhcyBNb25lcm9CbG9jayk7XG4gICAgYmxvY2suc2V0SGV4KHJwY0Jsb2NrLmJsb2IpO1xuICAgIGJsb2NrLnNldFR4SGFzaGVzKHJwY0Jsb2NrLnR4X2hhc2hlcyA9PT0gdW5kZWZpbmVkID8gW10gOiBycGNCbG9jay50eF9oYXNoZXMpO1xuICAgIFxuICAgIC8vIGJ1aWxkIG1pbmVyIHR4XG4gICAgbGV0IHJwY01pbmVyVHggPSBycGNCbG9jay5qc29uID8gSlNPTi5wYXJzZShycGNCbG9jay5qc29uKS5taW5lcl90eCA6IHJwY0Jsb2NrLm1pbmVyX3R4OyAgLy8gbWF5IG5lZWQgdG8gYmUgcGFyc2VkIGZyb20ganNvblxuICAgIGxldCBtaW5lclR4ID0gbmV3IE1vbmVyb1R4KCk7XG4gICAgYmxvY2suc2V0TWluZXJUeChtaW5lclR4KTtcbiAgICBtaW5lclR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgIG1pbmVyVHguc2V0SW5UeFBvb2woZmFsc2UpXG4gICAgbWluZXJUeC5zZXRJc01pbmVyVHgodHJ1ZSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNUeChycGNNaW5lclR4LCBtaW5lclR4KTtcbiAgICBcbiAgICByZXR1cm4gYmxvY2s7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBUcmFuc2ZlcnMgUlBDIHR4IGZpZWxkcyB0byBhIGdpdmVuIE1vbmVyb1R4IHdpdGhvdXQgb3ZlcndyaXRpbmcgcHJldmlvdXMgdmFsdWVzLlxuICAgKiBcbiAgICogVE9ETzogc3dpdGNoIGZyb20gc2FmZSBzZXRcbiAgICogXG4gICAqIEBwYXJhbSBycGNUeCAtIFJQQyBtYXAgY29udGFpbmluZyB0cmFuc2FjdGlvbiBmaWVsZHNcbiAgICogQHBhcmFtIHR4ICAtIE1vbmVyb1R4IHRvIHBvcHVsYXRlIHdpdGggdmFsdWVzIChvcHRpb25hbClcbiAgICogQHJldHVybiB0eCAtIHNhbWUgdHggdGhhdCB3YXMgcGFzc2VkIGluIG9yIGEgbmV3IG9uZSBpZiBub25lIGdpdmVuXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNUeChycGNUeCwgdHgpIHtcbiAgICBpZiAocnBjVHggPT09IHVuZGVmaW5lZCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICBpZiAodHggPT09IHVuZGVmaW5lZCkgdHggPSBuZXcgTW9uZXJvVHgoKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIGZyb20gcnBjIG1hcFxuICAgIGxldCBoZWFkZXI7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1R4KSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1R4W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcInR4X2hhc2hcIiB8fCBrZXkgPT09IFwiaWRfaGFzaFwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRIYXNoLCB0eC5zZXRIYXNoLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX3RpbWVzdGFtcFwiKSB7XG4gICAgICAgIGlmICghaGVhZGVyKSBoZWFkZXIgPSBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoKTtcbiAgICAgICAgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRUaW1lc3RhbXAsIGhlYWRlci5zZXRUaW1lc3RhbXAsIHZhbCk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfaGVpZ2h0XCIpIHtcbiAgICAgICAgaWYgKCFoZWFkZXIpIGhlYWRlciA9IG5ldyBNb25lcm9CbG9ja0hlYWRlcigpO1xuICAgICAgICBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldEhlaWdodCwgaGVhZGVyLnNldEhlaWdodCwgdmFsKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsYXN0X3JlbGF5ZWRfdGltZVwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRMYXN0UmVsYXllZFRpbWVzdGFtcCwgdHguc2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVjZWl2ZV90aW1lXCIgfHwga2V5ID09PSBcInJlY2VpdmVkX3RpbWVzdGFtcFwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRSZWNlaXZlZFRpbWVzdGFtcCwgdHguc2V0UmVjZWl2ZWRUaW1lc3RhbXAsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY29uZmlybWF0aW9uc1wiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXROdW1Db25maXJtYXRpb25zLCB0eC5zZXROdW1Db25maXJtYXRpb25zLCB2YWwpOyBcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJpbl9wb29sXCIpIHtcbiAgICAgICAgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SXNDb25maXJtZWQsIHR4LnNldElzQ29uZmlybWVkLCAhdmFsKTtcbiAgICAgICAgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SW5UeFBvb2wsIHR4LnNldEluVHhQb29sLCB2YWwpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRvdWJsZV9zcGVuZF9zZWVuXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzRG91YmxlU3BlbmRTZWVuLCB0eC5zZXRJc0RvdWJsZVNwZW5kU2VlbiwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ2ZXJzaW9uXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFZlcnNpb24sIHR4LnNldFZlcnNpb24sIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZXh0cmFcIikge1xuICAgICAgICBpZiAodHlwZW9mIHZhbCA9PT0gXCJzdHJpbmdcIikgY29uc29sZS5sb2coXCJXQVJOSU5HOiBleHRyYSBmaWVsZCBhcyBzdHJpbmcgbm90IGJlaW5nIGFzaWduZWQgdG8gaW50W106IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTsgLy8gVE9ETzogaG93IHRvIHNldCBzdHJpbmcgdG8gaW50W10/IC0gb3IsIGV4dHJhIGlzIHN0cmluZyB3aGljaCBjYW4gZW5jb2RlIGludFtdXG4gICAgICAgIGVsc2UgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0RXh0cmEsIHR4LnNldEV4dHJhLCBuZXcgVWludDhBcnJheSh2YWwpKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ2aW5cIikge1xuICAgICAgICBpZiAodmFsLmxlbmd0aCAhPT0gMSB8fCAhdmFsWzBdLmdlbikgeyAgLy8gaWdub3JlIG1pbmVyIGlucHV0IFRPRE86IHdoeT9cbiAgICAgICAgICB0eC5zZXRJbnB1dHModmFsLm1hcChycGNWaW4gPT4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNPdXRwdXQocnBjVmluLCB0eCkpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInZvdXRcIikgdHguc2V0T3V0cHV0cyh2YWwubWFwKHJwY091dHB1dCA9PiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY091dHB1dChycGNPdXRwdXQsIHR4KSkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJjdF9zaWduYXR1cmVzXCIpIHtcbiAgICAgICAgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0UmN0U2lnbmF0dXJlcywgdHguc2V0UmN0U2lnbmF0dXJlcywgdmFsKTtcbiAgICAgICAgaWYgKHZhbC50eG5GZWUpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldEZlZSwgdHguc2V0RmVlLCBCaWdJbnQodmFsLnR4bkZlZSkpO1xuICAgICAgfSBcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyY3RzaWdfcHJ1bmFibGVcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0UmN0U2lnUHJ1bmFibGUsIHR4LnNldFJjdFNpZ1BydW5hYmxlLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVubG9ja190aW1lXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFVubG9ja1RpbWUsIHR4LnNldFVubG9ja1RpbWUsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYXNfanNvblwiIHx8IGtleSA9PT0gXCJ0eF9qc29uXCIpIHsgfSAgLy8gaGFuZGxlZCBsYXN0IHNvIHR4IGlzIGFzIGluaXRpYWxpemVkIGFzIHBvc3NpYmxlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYXNfaGV4XCIgfHwga2V5ID09PSBcInR4X2Jsb2JcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0RnVsbEhleCwgdHguc2V0RnVsbEhleCwgdmFsID8gdmFsIDogdW5kZWZpbmVkKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9iX3NpemVcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0U2l6ZSwgdHguc2V0U2l6ZSwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3ZWlnaHRcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0V2VpZ2h0LCB0eC5zZXRXZWlnaHQsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZmVlXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldEZlZSwgdHguc2V0RmVlLCBCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVsYXllZFwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc1JlbGF5ZWQsIHR4LnNldElzUmVsYXllZCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJvdXRwdXRfaW5kaWNlc1wiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRPdXRwdXRJbmRpY2VzLCB0eC5zZXRPdXRwdXRJbmRpY2VzLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRvX25vdF9yZWxheVwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRSZWxheSwgdHguc2V0UmVsYXksICF2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImtlcHRfYnlfYmxvY2tcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SXNLZXB0QnlCbG9jaywgdHguc2V0SXNLZXB0QnlCbG9jaywgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzaWduYXR1cmVzXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFNpZ25hdHVyZXMsIHR4LnNldFNpZ25hdHVyZXMsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibGFzdF9mYWlsZWRfaGVpZ2h0XCIpIHtcbiAgICAgICAgaWYgKHZhbCA9PT0gMCkgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SXNGYWlsZWQsIHR4LnNldElzRmFpbGVkLCBmYWxzZSk7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzRmFpbGVkLCB0eC5zZXRJc0ZhaWxlZCwgdHJ1ZSk7XG4gICAgICAgICAgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0TGFzdEZhaWxlZEhlaWdodCwgdHguc2V0TGFzdEZhaWxlZEhlaWdodCwgdmFsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxhc3RfZmFpbGVkX2lkX2hhc2hcIikge1xuICAgICAgICBpZiAodmFsID09PSBNb25lcm9EYWVtb25ScGMuREVGQVVMVF9JRCkgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SXNGYWlsZWQsIHR4LnNldElzRmFpbGVkLCBmYWxzZSk7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzRmFpbGVkLCB0eC5zZXRJc0ZhaWxlZCwgdHJ1ZSk7XG4gICAgICAgICAgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0TGFzdEZhaWxlZEhhc2gsIHR4LnNldExhc3RGYWlsZWRIYXNoLCB2YWwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibWF4X3VzZWRfYmxvY2tfaGVpZ2h0XCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldE1heFVzZWRCbG9ja0hlaWdodCwgdHguc2V0TWF4VXNlZEJsb2NrSGVpZ2h0LCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm1heF91c2VkX2Jsb2NrX2lkX2hhc2hcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0TWF4VXNlZEJsb2NrSGFzaCwgdHguc2V0TWF4VXNlZEJsb2NrSGFzaCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwcnVuYWJsZV9oYXNoXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFBydW5hYmxlSGFzaCwgdHguc2V0UHJ1bmFibGVIYXNoLCB2YWwgPyB2YWwgOiB1bmRlZmluZWQpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBydW5hYmxlX2FzX2hleFwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRQcnVuYWJsZUhleCwgdHguc2V0UHJ1bmFibGVIZXgsIHZhbCA/IHZhbCA6IHVuZGVmaW5lZCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHJ1bmVkX2FzX2hleFwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRQcnVuZWRIZXgsIHR4LnNldFBydW5lZEhleCwgdmFsID8gdmFsIDogdW5kZWZpbmVkKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIHJwYyB0eDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICBcbiAgICAvLyBsaW5rIGJsb2NrIGFuZCB0eFxuICAgIGlmIChoZWFkZXIpIHR4LnNldEJsb2NrKG5ldyBNb25lcm9CbG9jayhoZWFkZXIpLnNldFR4cyhbdHhdKSk7XG4gICAgXG4gICAgLy8gVE9ETyBtb25lcm9kOiB1bmNvbmZpcm1lZCB0eHMgbWlzcmVwb3J0IGJsb2NrIGhlaWdodCBhbmQgdGltZXN0YW1wP1xuICAgIGlmICh0eC5nZXRCbG9jaygpICYmIHR4LmdldEJsb2NrKCkuZ2V0SGVpZ2h0KCkgIT09IHVuZGVmaW5lZCAmJiB0eC5nZXRCbG9jaygpLmdldEhlaWdodCgpID09PSB0eC5nZXRCbG9jaygpLmdldFRpbWVzdGFtcCgpKSB7XG4gICAgICB0eC5zZXRCbG9jayh1bmRlZmluZWQpO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgIH1cbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHJlbWFpbmluZyBrbm93biBmaWVsZHNcbiAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSkge1xuICAgICAgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SXNSZWxheWVkLCB0eC5zZXRJc1JlbGF5ZWQsIHRydWUpO1xuICAgICAgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0UmVsYXksIHR4LnNldFJlbGF5LCB0cnVlKTtcbiAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzRmFpbGVkLCB0eC5zZXRJc0ZhaWxlZCwgZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0eC5zZXROdW1Db25maXJtYXRpb25zKDApO1xuICAgIH1cbiAgICBpZiAodHguZ2V0SXNGYWlsZWQoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgaWYgKHR4LmdldE91dHB1dEluZGljZXMoKSAmJiB0eC5nZXRPdXRwdXRzKCkpICB7XG4gICAgICBhc3NlcnQuZXF1YWwodHguZ2V0T3V0cHV0cygpLmxlbmd0aCwgdHguZ2V0T3V0cHV0SW5kaWNlcygpLmxlbmd0aCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHR4LmdldE91dHB1dHMoKS5sZW5ndGg7IGkrKykge1xuICAgICAgICB0eC5nZXRPdXRwdXRzKClbaV0uc2V0SW5kZXgodHguZ2V0T3V0cHV0SW5kaWNlcygpW2ldKTsgIC8vIHRyYW5zZmVyIG91dHB1dCBpbmRpY2VzIHRvIG91dHB1dHNcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHJwY1R4LmFzX2pzb24pIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVHgoSlNPTi5wYXJzZShycGNUeC5hc19qc29uKSwgdHgpO1xuICAgIGlmIChycGNUeC50eF9qc29uKSBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1R4KEpTT04ucGFyc2UocnBjVHgudHhfanNvbiksIHR4KTtcbiAgICBpZiAoIXR4LmdldElzUmVsYXllZCgpKSB0eC5zZXRMYXN0UmVsYXllZFRpbWVzdGFtcCh1bmRlZmluZWQpOyAgLy8gVE9ETyBtb25lcm9kOiByZXR1cm5zIGxhc3RfcmVsYXllZF90aW1lc3RhbXAgZGVzcGl0ZSByZWxheWVkOiBmYWxzZSwgc2VsZiBpbmNvbnNpc3RlbnRcbiAgICBcbiAgICAvLyByZXR1cm4gYnVpbHQgdHJhbnNhY3Rpb25cbiAgICByZXR1cm4gdHg7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY091dHB1dChycGNPdXRwdXQsIHR4KSB7XG4gICAgbGV0IG91dHB1dCA9IG5ldyBNb25lcm9PdXRwdXQoKTtcbiAgICBvdXRwdXQuc2V0VHgodHgpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNPdXRwdXQpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjT3V0cHV0W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImdlblwiKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJPdXRwdXQgd2l0aCAnZ2VuJyBmcm9tIGRhZW1vbiBycGMgaXMgbWluZXIgdHggd2hpY2ggd2UgaWdub3JlIChpLmUuIGVhY2ggbWluZXIgaW5wdXQgaXMgdW5kZWZpbmVkKVwiKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJrZXlcIikge1xuICAgICAgICBHZW5VdGlscy5zYWZlU2V0KG91dHB1dCwgb3V0cHV0LmdldEFtb3VudCwgb3V0cHV0LnNldEFtb3VudCwgQmlnSW50KHZhbC5hbW91bnQpKTtcbiAgICAgICAgR2VuVXRpbHMuc2FmZVNldChvdXRwdXQsIG91dHB1dC5nZXRLZXlJbWFnZSwgb3V0cHV0LnNldEtleUltYWdlLCBuZXcgTW9uZXJvS2V5SW1hZ2UodmFsLmtfaW1hZ2UpKTtcbiAgICAgICAgR2VuVXRpbHMuc2FmZVNldChvdXRwdXQsIG91dHB1dC5nZXRSaW5nT3V0cHV0SW5kaWNlcywgb3V0cHV0LnNldFJpbmdPdXRwdXRJbmRpY2VzLCB2YWwua2V5X29mZnNldHMpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudFwiKSBHZW5VdGlscy5zYWZlU2V0KG91dHB1dCwgb3V0cHV0LmdldEFtb3VudCwgb3V0cHV0LnNldEFtb3VudCwgQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRhcmdldFwiKSB7XG4gICAgICAgIGxldCBwdWJLZXkgPSB2YWwua2V5ID09PSB1bmRlZmluZWQgPyB2YWwudGFnZ2VkX2tleS5rZXkgOiB2YWwua2V5OyAvLyBUT0RPIChtb25lcm9kKTogcnBjIGpzb24gdXNlcyB7dGFnZ2VkX2tleT17a2V5PS4uLn19LCBiaW5hcnkgYmxvY2tzIHVzZSB7a2V5PS4uLn1cbiAgICAgICAgR2VuVXRpbHMuc2FmZVNldChvdXRwdXQsIG91dHB1dC5nZXRTdGVhbHRoUHVibGljS2V5LCBvdXRwdXQuc2V0U3RlYWx0aFB1YmxpY0tleSwgcHViS2V5KTtcbiAgICAgIH1cbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIG91dHB1dDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNCbG9ja1RlbXBsYXRlKHJwY1RlbXBsYXRlKSB7XG4gICAgbGV0IHRlbXBsYXRlID0gbmV3IE1vbmVyb0Jsb2NrVGVtcGxhdGUoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjVGVtcGxhdGUpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjVGVtcGxhdGVba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYmxvY2toYXNoaW5nX2Jsb2JcIikgdGVtcGxhdGUuc2V0QmxvY2tUZW1wbGF0ZUJsb2IodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja3RlbXBsYXRlX2Jsb2JcIikgdGVtcGxhdGUuc2V0QmxvY2tIYXNoaW5nQmxvYih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRpZmZpY3VsdHlcIikgdGVtcGxhdGUuc2V0RGlmZmljdWx0eShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZXhwZWN0ZWRfcmV3YXJkXCIpIHRlbXBsYXRlLnNldEV4cGVjdGVkUmV3YXJkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGlmZmljdWx0eVwiKSB7IH0gIC8vIGhhbmRsZWQgYnkgd2lkZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGlmZmljdWx0eV90b3A2NFwiKSB7IH0gIC8vIGhhbmRsZWQgYnkgd2lkZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2lkZV9kaWZmaWN1bHR5XCIpIHRlbXBsYXRlLnNldERpZmZpY3VsdHkoR2VuVXRpbHMucmVjb25jaWxlKHRlbXBsYXRlLmdldERpZmZpY3VsdHkoKSwgTW9uZXJvRGFlbW9uUnBjLnByZWZpeGVkSGV4VG9CSSh2YWwpKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGVpZ2h0XCIpIHRlbXBsYXRlLnNldEhlaWdodCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInByZXZfaGFzaFwiKSB0ZW1wbGF0ZS5zZXRQcmV2SGFzaCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJlc2VydmVkX29mZnNldFwiKSB0ZW1wbGF0ZS5zZXRSZXNlcnZlZE9mZnNldCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXR1c1wiKSB7fSAgLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bnRydXN0ZWRcIikge30gIC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic2VlZF9oZWlnaHRcIikgdGVtcGxhdGUuc2V0U2VlZEhlaWdodCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNlZWRfaGFzaFwiKSB0ZW1wbGF0ZS5zZXRTZWVkSGFzaCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm5leHRfc2VlZF9oYXNoXCIpIHRlbXBsYXRlLnNldE5leHRTZWVkSGFzaCh2YWwpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gYmxvY2sgdGVtcGxhdGU6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgaWYgKFwiXCIgPT09IHRlbXBsYXRlLmdldE5leHRTZWVkSGFzaCgpKSB0ZW1wbGF0ZS5zZXROZXh0U2VlZEhhc2godW5kZWZpbmVkKTtcbiAgICByZXR1cm4gdGVtcGxhdGU7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY0luZm8ocnBjSW5mbykge1xuICAgIGlmICghcnBjSW5mbykgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICBsZXQgaW5mbyA9IG5ldyBNb25lcm9EYWVtb25JbmZvKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY0luZm8pKSB7XG4gICAgICBsZXQgdmFsID0gcnBjSW5mb1trZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJ2ZXJzaW9uXCIpIGluZm8uc2V0VmVyc2lvbih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFsdF9ibG9ja3NfY291bnRcIikgaW5mby5zZXROdW1BbHRCbG9ja3ModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja19zaXplX2xpbWl0XCIpIGluZm8uc2V0QmxvY2tTaXplTGltaXQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja19zaXplX21lZGlhblwiKSBpbmZvLnNldEJsb2NrU2l6ZU1lZGlhbih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX3dlaWdodF9saW1pdFwiKSBpbmZvLnNldEJsb2NrV2VpZ2h0TGltaXQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja193ZWlnaHRfbWVkaWFuXCIpIGluZm8uc2V0QmxvY2tXZWlnaHRNZWRpYW4odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJib290c3RyYXBfZGFlbW9uX2FkZHJlc3NcIikgeyBpZiAodmFsKSBpbmZvLnNldEJvb3RzdHJhcERhZW1vbkFkZHJlc3ModmFsKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRpZmZpY3VsdHlcIikgeyB9ICAvLyBoYW5kbGVkIGJ5IHdpZGVfZGlmZmljdWx0eVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImN1bXVsYXRpdmVfZGlmZmljdWx0eVwiKSB7IH0gLy8gaGFuZGxlZCBieSB3aWRlX2N1bXVsYXRpdmVfZGlmZmljdWx0eVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRpZmZpY3VsdHlfdG9wNjRcIikgeyB9ICAvLyBoYW5kbGVkIGJ5IHdpZGVfZGlmZmljdWx0eVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImN1bXVsYXRpdmVfZGlmZmljdWx0eV90b3A2NFwiKSB7IH0gLy8gaGFuZGxlZCBieSB3aWRlX2N1bXVsYXRpdmVfZGlmZmljdWx0eVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndpZGVfZGlmZmljdWx0eVwiKSBpbmZvLnNldERpZmZpY3VsdHkoR2VuVXRpbHMucmVjb25jaWxlKGluZm8uZ2V0RGlmZmljdWx0eSgpLCBNb25lcm9EYWVtb25ScGMucHJlZml4ZWRIZXhUb0JJKHZhbCkpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3aWRlX2N1bXVsYXRpdmVfZGlmZmljdWx0eVwiKSBpbmZvLnNldEN1bXVsYXRpdmVEaWZmaWN1bHR5KEdlblV0aWxzLnJlY29uY2lsZShpbmZvLmdldEN1bXVsYXRpdmVEaWZmaWN1bHR5KCksIE1vbmVyb0RhZW1vblJwYy5wcmVmaXhlZEhleFRvQkkodmFsKSkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImZyZWVfc3BhY2VcIikgaW5mby5zZXRGcmVlU3BhY2UoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRhdGFiYXNlX3NpemVcIikgaW5mby5zZXREYXRhYmFzZVNpemUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJncmV5X3BlZXJsaXN0X3NpemVcIikgaW5mby5zZXROdW1PZmZsaW5lUGVlcnModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJoZWlnaHRcIikgaW5mby5zZXRIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJoZWlnaHRfd2l0aG91dF9ib290c3RyYXBcIikgaW5mby5zZXRIZWlnaHRXaXRob3V0Qm9vdHN0cmFwKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaW5jb21pbmdfY29ubmVjdGlvbnNfY291bnRcIikgaW5mby5zZXROdW1JbmNvbWluZ0Nvbm5lY3Rpb25zKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwib2ZmbGluZVwiKSBpbmZvLnNldElzT2ZmbGluZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm91dGdvaW5nX2Nvbm5lY3Rpb25zX2NvdW50XCIpIGluZm8uc2V0TnVtT3V0Z29pbmdDb25uZWN0aW9ucyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJwY19jb25uZWN0aW9uc19jb3VudFwiKSBpbmZvLnNldE51bVJwY0Nvbm5lY3Rpb25zKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3RhcnRfdGltZVwiKSBpbmZvLnNldFN0YXJ0VGltZXN0YW1wKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYWRqdXN0ZWRfdGltZVwiKSBpbmZvLnNldEFkanVzdGVkVGltZXN0YW1wKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3RhdHVzXCIpIHt9ICAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRhcmdldFwiKSBpbmZvLnNldFRhcmdldCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRhcmdldF9oZWlnaHRcIikgaW5mby5zZXRUYXJnZXRIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0b3BfYmxvY2tfaGFzaFwiKSBpbmZvLnNldFRvcEJsb2NrSGFzaCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2NvdW50XCIpIGluZm8uc2V0TnVtVHhzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfcG9vbF9zaXplXCIpIGluZm8uc2V0TnVtVHhzUG9vbCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVudHJ1c3RlZFwiKSB7fSAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndhc19ib290c3RyYXBfZXZlcl91c2VkXCIpIGluZm8uc2V0V2FzQm9vdHN0cmFwRXZlclVzZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3aGl0ZV9wZWVybGlzdF9zaXplXCIpIGluZm8uc2V0TnVtT25saW5lUGVlcnModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1cGRhdGVfYXZhaWxhYmxlXCIpIGluZm8uc2V0VXBkYXRlQXZhaWxhYmxlKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibmV0dHlwZVwiKSBHZW5VdGlscy5zYWZlU2V0KGluZm8sIGluZm8uZ2V0TmV0d29ya1R5cGUsIGluZm8uc2V0TmV0d29ya1R5cGUsIE1vbmVyb05ldHdvcmtUeXBlLnBhcnNlKHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm1haW5uZXRcIikgeyBpZiAodmFsKSBHZW5VdGlscy5zYWZlU2V0KGluZm8sIGluZm8uZ2V0TmV0d29ya1R5cGUsIGluZm8uc2V0TmV0d29ya1R5cGUsIE1vbmVyb05ldHdvcmtUeXBlLk1BSU5ORVQpOyB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidGVzdG5ldFwiKSB7IGlmICh2YWwpIEdlblV0aWxzLnNhZmVTZXQoaW5mbywgaW5mby5nZXROZXR3b3JrVHlwZSwgaW5mby5zZXROZXR3b3JrVHlwZSwgTW9uZXJvTmV0d29ya1R5cGUuVEVTVE5FVCk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGFnZW5ldFwiKSB7IGlmICh2YWwpIEdlblV0aWxzLnNhZmVTZXQoaW5mbywgaW5mby5nZXROZXR3b3JrVHlwZSwgaW5mby5zZXROZXR3b3JrVHlwZSwgTW9uZXJvTmV0d29ya1R5cGUuU1RBR0VORVQpOyB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3JlZGl0c1wiKSBpbmZvLnNldENyZWRpdHMoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRvcF9ibG9ja19oYXNoXCIgfHwga2V5ID09PSBcInRvcF9oYXNoXCIpIGluZm8uc2V0VG9wQmxvY2tIYXNoKEdlblV0aWxzLnJlY29uY2lsZShpbmZvLmdldFRvcEJsb2NrSGFzaCgpLCBcIlwiID09PSB2YWwgPyB1bmRlZmluZWQgOiB2YWwpKVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJ1c3lfc3luY2luZ1wiKSBpbmZvLnNldElzQnVzeVN5bmNpbmcodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzeW5jaHJvbml6ZWRcIikgaW5mby5zZXRJc1N5bmNocm9uaXplZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJlc3RyaWN0ZWRcIikgaW5mby5zZXRJc1Jlc3RyaWN0ZWQodmFsKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBJZ25vcmluZyB1bmV4cGVjdGVkIGluZm8gZmllbGQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIGluZm87XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbml0aWFsaXplcyBzeW5jIGluZm8gZnJvbSBSUEMgc3luYyBpbmZvLlxuICAgKiBcbiAgICogQHBhcmFtIHJwY1N5bmNJbmZvIC0gcnBjIG1hcCB0byBpbml0aWFsaXplIHRoZSBzeW5jIGluZm8gZnJvbVxuICAgKiBAcmV0dXJuIHtNb25lcm9EYWVtb25TeW5jSW5mb30gaXMgc3luYyBpbmZvIGluaXRpYWxpemVkIGZyb20gdGhlIG1hcFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjU3luY0luZm8ocnBjU3luY0luZm8pIHtcbiAgICBsZXQgc3luY0luZm8gPSBuZXcgTW9uZXJvRGFlbW9uU3luY0luZm8oKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjU3luY0luZm8pKSB7XG4gICAgICBsZXQgdmFsID0gcnBjU3luY0luZm9ba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiaGVpZ2h0XCIpIHN5bmNJbmZvLnNldEhlaWdodCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBlZXJzXCIpIHtcbiAgICAgICAgc3luY0luZm8uc2V0UGVlcnMoW10pO1xuICAgICAgICBsZXQgcnBjQ29ubmVjdGlvbnMgPSB2YWw7XG4gICAgICAgIGZvciAobGV0IHJwY0Nvbm5lY3Rpb24gb2YgcnBjQ29ubmVjdGlvbnMpIHtcbiAgICAgICAgICBzeW5jSW5mby5nZXRQZWVycygpLnB1c2goTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNDb25uZWN0aW9uKHJwY0Nvbm5lY3Rpb24uaW5mbykpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3BhbnNcIikge1xuICAgICAgICBzeW5jSW5mby5zZXRTcGFucyhbXSk7XG4gICAgICAgIGxldCBycGNTcGFucyA9IHZhbDtcbiAgICAgICAgZm9yIChsZXQgcnBjU3BhbiBvZiBycGNTcGFucykge1xuICAgICAgICAgIHN5bmNJbmZvLmdldFNwYW5zKCkucHVzaChNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Nvbm5lY3Rpb25TcGFuKHJwY1NwYW4pKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChrZXkgPT09IFwic3RhdHVzXCIpIHt9ICAgLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0YXJnZXRfaGVpZ2h0XCIpIHN5bmNJbmZvLnNldFRhcmdldEhlaWdodCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm5leHRfbmVlZGVkX3BydW5pbmdfc2VlZFwiKSBzeW5jSW5mby5zZXROZXh0TmVlZGVkUHJ1bmluZ1NlZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJvdmVydmlld1wiKSB7ICAvLyB0aGlzIHJldHVybnMgW10gd2l0aG91dCBwcnVuaW5nXG4gICAgICAgIGxldCBvdmVydmlldztcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBvdmVydmlldyA9IEpTT04ucGFyc2UodmFsKTtcbiAgICAgICAgICBpZiAob3ZlcnZpZXcgIT09IHVuZGVmaW5lZCAmJiBvdmVydmlldy5sZW5ndGggPiAwKSBjb25zb2xlLmVycm9yKFwiSWdub3Jpbmcgbm9uLWVtcHR5ICdvdmVydmlldycgZmllbGQgKG5vdCBpbXBsZW1lbnRlZCk6IFwiICsgb3ZlcnZpZXcpOyAvLyBUT0RPXG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gcGFyc2UgJ292ZXJ2aWV3JyBmaWVsZDogXCIgKyBvdmVydmlldyArIFwiOiBcIiArIGUubWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjcmVkaXRzXCIpIHN5bmNJbmZvLnNldENyZWRpdHMoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRvcF9oYXNoXCIpIHN5bmNJbmZvLnNldFRvcEJsb2NrSGFzaChcIlwiID09PSB2YWwgPyB1bmRlZmluZWQgOiB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVudHJ1c3RlZFwiKSB7fSAgLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIHN5bmMgaW5mbzogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gc3luY0luZm87XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY0hhcmRGb3JrSW5mbyhycGNIYXJkRm9ya0luZm8pIHtcbiAgICBsZXQgaW5mbyA9IG5ldyBNb25lcm9IYXJkRm9ya0luZm8oKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjSGFyZEZvcmtJbmZvKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY0hhcmRGb3JrSW5mb1trZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJlYXJsaWVzdF9oZWlnaHRcIikgaW5mby5zZXRFYXJsaWVzdEhlaWdodCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImVuYWJsZWRcIikgaW5mby5zZXRJc0VuYWJsZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGF0ZVwiKSBpbmZvLnNldFN0YXRlKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3RhdHVzXCIpIHt9ICAgICAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVudHJ1c3RlZFwiKSB7fSAgLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0aHJlc2hvbGRcIikgaW5mby5zZXRUaHJlc2hvbGQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ2ZXJzaW9uXCIpIGluZm8uc2V0VmVyc2lvbih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInZvdGVzXCIpIGluZm8uc2V0TnVtVm90ZXModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ2b3RpbmdcIikgaW5mby5zZXRWb3RpbmcodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3aW5kb3dcIikgaW5mby5zZXRXaW5kb3codmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjcmVkaXRzXCIpIGluZm8uc2V0Q3JlZGl0cyhCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidG9wX2hhc2hcIikgaW5mby5zZXRUb3BCbG9ja0hhc2goXCJcIiA9PT0gdmFsID8gdW5kZWZpbmVkIDogdmFsKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIGhhcmQgZm9yayBpbmZvOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBpbmZvO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNDb25uZWN0aW9uU3BhbihycGNDb25uZWN0aW9uU3Bhbikge1xuICAgIGxldCBzcGFuID0gbmV3IE1vbmVyb0Nvbm5lY3Rpb25TcGFuKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY0Nvbm5lY3Rpb25TcGFuKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY0Nvbm5lY3Rpb25TcGFuW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImNvbm5lY3Rpb25faWRcIikgc3Bhbi5zZXRDb25uZWN0aW9uSWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJuYmxvY2tzXCIpIHNwYW4uc2V0TnVtQmxvY2tzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmF0ZVwiKSBzcGFuLnNldFJhdGUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyZW1vdGVfYWRkcmVzc1wiKSB7IGlmICh2YWwgIT09IFwiXCIpIHNwYW4uc2V0UmVtb3RlQWRkcmVzcyh2YWwpOyB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic2l6ZVwiKSBzcGFuLnNldFNpemUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzcGVlZFwiKSBzcGFuLnNldFNwZWVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3RhcnRfYmxvY2tfaGVpZ2h0XCIpIHNwYW4uc2V0U3RhcnRIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIGRhZW1vbiBjb25uZWN0aW9uIHNwYW46IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIHNwYW47XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY091dHB1dEhpc3RvZ3JhbUVudHJ5KHJwY0VudHJ5KSB7XG4gICAgbGV0IGVudHJ5ID0gbmV3IE1vbmVyb091dHB1dEhpc3RvZ3JhbUVudHJ5KCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY0VudHJ5KSkge1xuICAgICAgbGV0IHZhbCA9IHJwY0VudHJ5W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImFtb3VudFwiKSBlbnRyeS5zZXRBbW91bnQoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRvdGFsX2luc3RhbmNlc1wiKSBlbnRyeS5zZXROdW1JbnN0YW5jZXModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bmxvY2tlZF9pbnN0YW5jZXNcIikgZW50cnkuc2V0TnVtVW5sb2NrZWRJbnN0YW5jZXModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyZWNlbnRfaW5zdGFuY2VzXCIpIGVudHJ5LnNldE51bVJlY2VudEluc3RhbmNlcyh2YWwpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gb3V0cHV0IGhpc3RvZ3JhbTogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gZW50cnk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1N1Ym1pdFR4UmVzdWx0KHJwY1Jlc3VsdCkge1xuICAgIGFzc2VydChycGNSZXN1bHQpO1xuICAgIGxldCByZXN1bHQgPSBuZXcgTW9uZXJvU3VibWl0VHhSZXN1bHQoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjUmVzdWx0KSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1Jlc3VsdFtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJkb3VibGVfc3BlbmRcIikgcmVzdWx0LnNldElzRG91YmxlU3BlbmRTZWVuKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZmVlX3Rvb19sb3dcIikgcmVzdWx0LnNldElzRmVlVG9vTG93KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaW52YWxpZF9pbnB1dFwiKSByZXN1bHQuc2V0SGFzSW52YWxpZElucHV0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaW52YWxpZF9vdXRwdXRcIikgcmVzdWx0LnNldEhhc0ludmFsaWRPdXRwdXQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0b29fZmV3X291dHB1dHNcIikgcmVzdWx0LnNldEhhc1Rvb0Zld091dHB1dHModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsb3dfbWl4aW5cIikgcmVzdWx0LnNldElzTWl4aW5Ub29Mb3codmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJub3RfcmVsYXllZFwiKSByZXN1bHQuc2V0SXNSZWxheWVkKCF2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm92ZXJzcGVuZFwiKSByZXN1bHQuc2V0SXNPdmVyc3BlbmQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyZWFzb25cIikgcmVzdWx0LnNldFJlYXNvbih2YWwgPT09IFwiXCIgPyB1bmRlZmluZWQgOiB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRvb19iaWdcIikgcmVzdWx0LnNldElzVG9vQmlnKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic2FuaXR5X2NoZWNrX2ZhaWxlZFwiKSByZXN1bHQuc2V0U2FuaXR5Q2hlY2tGYWlsZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjcmVkaXRzXCIpIHJlc3VsdC5zZXRDcmVkaXRzKEJpZ0ludCh2YWwpKVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXR1c1wiIHx8IGtleSA9PT0gXCJ1bnRydXN0ZWRcIikge30gIC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidG9wX2hhc2hcIikgcmVzdWx0LnNldFRvcEJsb2NrSGFzaChcIlwiID09PSB2YWwgPyB1bmRlZmluZWQgOiB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2V4dHJhX3Rvb19iaWdcIikgcmVzdWx0LnNldElzVHhFeHRyYVRvb0JpZyh2YWwpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gc3VibWl0IHR4IGhleCByZXN1bHQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVHhQb29sU3RhdHMocnBjU3RhdHMpIHtcbiAgICBhc3NlcnQocnBjU3RhdHMpO1xuICAgIGxldCBzdGF0cyA9IG5ldyBNb25lcm9UeFBvb2xTdGF0cygpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNTdGF0cykpIHtcbiAgICAgIGxldCB2YWwgPSBycGNTdGF0c1trZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJieXRlc19tYXhcIikgc3RhdHMuc2V0Qnl0ZXNNYXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJieXRlc19tZWRcIikgc3RhdHMuc2V0Qnl0ZXNNZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJieXRlc19taW5cIikgc3RhdHMuc2V0Qnl0ZXNNaW4odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJieXRlc190b3RhbFwiKSBzdGF0cy5zZXRCeXRlc1RvdGFsKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGlzdG9fOThwY1wiKSBzdGF0cy5zZXRIaXN0bzk4cGModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJudW1fMTBtXCIpIHN0YXRzLnNldE51bTEwbSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm51bV9kb3VibGVfc3BlbmRzXCIpIHN0YXRzLnNldE51bURvdWJsZVNwZW5kcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm51bV9mYWlsaW5nXCIpIHN0YXRzLnNldE51bUZhaWxpbmcodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJudW1fbm90X3JlbGF5ZWRcIikgc3RhdHMuc2V0TnVtTm90UmVsYXllZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm9sZGVzdFwiKSBzdGF0cy5zZXRPbGRlc3RUaW1lc3RhbXAodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eHNfdG90YWxcIikgc3RhdHMuc2V0TnVtVHhzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZmVlX3RvdGFsXCIpIHN0YXRzLnNldEZlZVRvdGFsKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJoaXN0b1wiKSB7XG4gICAgICAgIHN0YXRzLnNldEhpc3RvKG5ldyBNYXAoKSk7XG4gICAgICAgIGZvciAobGV0IGVsZW0gb2YgdmFsKSBzdGF0cy5nZXRIaXN0bygpLnNldChlbGVtLmJ5dGVzLCBlbGVtLnR4cyk7XG4gICAgICB9XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiB0eCBwb29sIHN0YXRzOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuXG4gICAgLy8gdW5pbml0aWFsaXplIHNvbWUgc3RhdHMgaWYgbm90IGFwcGxpY2FibGVcbiAgICBpZiAoc3RhdHMuZ2V0SGlzdG85OHBjKCkgPT09IDApIHN0YXRzLnNldEhpc3RvOThwYyh1bmRlZmluZWQpO1xuICAgIGlmIChzdGF0cy5nZXROdW1UeHMoKSA9PT0gMCkge1xuICAgICAgc3RhdHMuc2V0Qnl0ZXNNaW4odW5kZWZpbmVkKTtcbiAgICAgIHN0YXRzLnNldEJ5dGVzTWVkKHVuZGVmaW5lZCk7XG4gICAgICBzdGF0cy5zZXRCeXRlc01heCh1bmRlZmluZWQpO1xuICAgICAgc3RhdHMuc2V0SGlzdG85OHBjKHVuZGVmaW5lZCk7XG4gICAgICBzdGF0cy5zZXRPbGRlc3RUaW1lc3RhbXAodW5kZWZpbmVkKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3RhdHM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY0FsdENoYWluKHJwY0NoYWluKSB7XG4gICAgYXNzZXJ0KHJwY0NoYWluKTtcbiAgICBsZXQgY2hhaW4gPSBuZXcgTW9uZXJvQWx0Q2hhaW4oKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjQ2hhaW4pKSB7XG4gICAgICBsZXQgdmFsID0gcnBjQ2hhaW5ba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYmxvY2tfaGFzaFwiKSB7fSAgLy8gdXNpbmcgYmxvY2tfaGFzaGVzIGluc3RlYWRcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5XCIpIHsgfSAvLyBoYW5kbGVkIGJ5IHdpZGVfZGlmZmljdWx0eVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRpZmZpY3VsdHlfdG9wNjRcIikgeyB9ICAvLyBoYW5kbGVkIGJ5IHdpZGVfZGlmZmljdWx0eVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndpZGVfZGlmZmljdWx0eVwiKSBjaGFpbi5zZXREaWZmaWN1bHR5KEdlblV0aWxzLnJlY29uY2lsZShjaGFpbi5nZXREaWZmaWN1bHR5KCksIE1vbmVyb0RhZW1vblJwYy5wcmVmaXhlZEhleFRvQkkodmFsKSkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhlaWdodFwiKSBjaGFpbi5zZXRIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsZW5ndGhcIikgY2hhaW4uc2V0TGVuZ3RoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfaGFzaGVzXCIpIGNoYWluLnNldEJsb2NrSGFzaGVzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibWFpbl9jaGFpbl9wYXJlbnRfYmxvY2tcIikgY2hhaW4uc2V0TWFpbkNoYWluUGFyZW50QmxvY2tIYXNoKHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBhbHRlcm5hdGl2ZSBjaGFpbjogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gY2hhaW47XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1BlZXIocnBjUGVlcikge1xuICAgIGFzc2VydChycGNQZWVyKTtcbiAgICBsZXQgcGVlciA9IG5ldyBNb25lcm9QZWVyKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1BlZXIpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjUGVlcltrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJob3N0XCIpIHBlZXIuc2V0SG9zdCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImlkXCIpIHBlZXIuc2V0SWQoXCJcIiArIHZhbCk7ICAvLyBUT0RPIG1vbmVyby13YWxsZXQtcnBjOiBwZWVyIGlkIGlzIEJpZ0ludCBidXQgc3RyaW5nIGluIGBnZXRfY29ubmVjdGlvbnNgXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaXBcIikge30gLy8gaG9zdCB1c2VkIGluc3RlYWQgd2hpY2ggaXMgY29uc2lzdGVudGx5IGEgc3RyaW5nXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibGFzdF9zZWVuXCIpIHBlZXIuc2V0TGFzdFNlZW5UaW1lc3RhbXAodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwb3J0XCIpIHBlZXIuc2V0UG9ydCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJwY19wb3J0XCIpIHBlZXIuc2V0UnBjUG9ydCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBydW5pbmdfc2VlZFwiKSBwZWVyLnNldFBydW5pbmdTZWVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicnBjX2NyZWRpdHNfcGVyX2hhc2hcIikgcGVlci5zZXRScGNDcmVkaXRzUGVySGFzaChCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBycGMgcGVlcjogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gcGVlcjtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjQ29ubmVjdGlvbihycGNDb25uZWN0aW9uKSB7XG4gICAgbGV0IHBlZXIgPSBuZXcgTW9uZXJvUGVlcigpO1xuICAgIHBlZXIuc2V0SXNPbmxpbmUodHJ1ZSk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY0Nvbm5lY3Rpb24pKSB7XG4gICAgICBsZXQgdmFsID0gcnBjQ29ubmVjdGlvbltrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJhZGRyZXNzXCIpIHBlZXIuc2V0QWRkcmVzcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImF2Z19kb3dubG9hZFwiKSBwZWVyLnNldEF2Z0Rvd25sb2FkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYXZnX3VwbG9hZFwiKSBwZWVyLnNldEF2Z1VwbG9hZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNvbm5lY3Rpb25faWRcIikgcGVlci5zZXRJZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImN1cnJlbnRfZG93bmxvYWRcIikgcGVlci5zZXRDdXJyZW50RG93bmxvYWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjdXJyZW50X3VwbG9hZFwiKSBwZWVyLnNldEN1cnJlbnRVcGxvYWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJoZWlnaHRcIikgcGVlci5zZXRIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJob3N0XCIpIHBlZXIuc2V0SG9zdCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImlwXCIpIHt9IC8vIGhvc3QgdXNlZCBpbnN0ZWFkIHdoaWNoIGlzIGNvbnNpc3RlbnRseSBhIHN0cmluZ1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImluY29taW5nXCIpIHBlZXIuc2V0SXNJbmNvbWluZyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxpdmVfdGltZVwiKSBwZWVyLnNldExpdmVUaW1lKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibG9jYWxfaXBcIikgcGVlci5zZXRJc0xvY2FsSXAodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsb2NhbGhvc3RcIikgcGVlci5zZXRJc0xvY2FsSG9zdCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBlZXJfaWRcIikgcGVlci5zZXRJZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBvcnRcIikgcGVlci5zZXRQb3J0KHBhcnNlSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJwY19wb3J0XCIpIHBlZXIuc2V0UnBjUG9ydCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJlY3ZfY291bnRcIikgcGVlci5zZXROdW1SZWNlaXZlcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJlY3ZfaWRsZV90aW1lXCIpIHBlZXIuc2V0UmVjZWl2ZUlkbGVUaW1lKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic2VuZF9jb3VudFwiKSBwZWVyLnNldE51bVNlbmRzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic2VuZF9pZGxlX3RpbWVcIikgcGVlci5zZXRTZW5kSWRsZVRpbWUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGF0ZVwiKSBwZWVyLnNldFN0YXRlKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3VwcG9ydF9mbGFnc1wiKSBwZWVyLnNldE51bVN1cHBvcnRGbGFncyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBydW5pbmdfc2VlZFwiKSBwZWVyLnNldFBydW5pbmdTZWVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicnBjX2NyZWRpdHNfcGVyX2hhc2hcIikgcGVlci5zZXRScGNDcmVkaXRzUGVySGFzaChCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYWRkcmVzc190eXBlXCIpIHBlZXIuc2V0VHlwZSh2YWwpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gcGVlcjogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gcGVlcjtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0VG9ScGNCYW4oYmFuOiBNb25lcm9CYW4pIHtcbiAgICBsZXQgcnBjQmFuOiBhbnkgPSB7fTtcbiAgICBycGNCYW4uaG9zdCA9IGJhbi5nZXRIb3N0KCk7XG4gICAgcnBjQmFuLmlwID0gYmFuLmdldElwKCk7XG4gICAgcnBjQmFuLmJhbiA9IGJhbi5nZXRJc0Jhbm5lZCgpO1xuICAgIHJwY0Jhbi5zZWNvbmRzID0gYmFuLmdldFNlY29uZHMoKTtcbiAgICByZXR1cm4gcnBjQmFuO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNNaW5pbmdTdGF0dXMocnBjU3RhdHVzKSB7XG4gICAgbGV0IHN0YXR1cyA9IG5ldyBNb25lcm9NaW5pbmdTdGF0dXMoKTtcbiAgICBzdGF0dXMuc2V0SXNBY3RpdmUocnBjU3RhdHVzLmFjdGl2ZSk7XG4gICAgc3RhdHVzLnNldFNwZWVkKHJwY1N0YXR1cy5zcGVlZCk7XG4gICAgc3RhdHVzLnNldE51bVRocmVhZHMocnBjU3RhdHVzLnRocmVhZHNfY291bnQpO1xuICAgIGlmIChycGNTdGF0dXMuYWN0aXZlKSB7XG4gICAgICBzdGF0dXMuc2V0QWRkcmVzcyhycGNTdGF0dXMuYWRkcmVzcyk7XG4gICAgICBzdGF0dXMuc2V0SXNCYWNrZ3JvdW5kKHJwY1N0YXR1cy5pc19iYWNrZ3JvdW5kX21pbmluZ19lbmFibGVkKTtcbiAgICB9XG4gICAgcmV0dXJuIHN0YXR1cztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVXBkYXRlQ2hlY2tSZXN1bHQocnBjUmVzdWx0KSB7XG4gICAgYXNzZXJ0KHJwY1Jlc3VsdCk7XG4gICAgbGV0IHJlc3VsdCA9IG5ldyBNb25lcm9EYWVtb25VcGRhdGVDaGVja1Jlc3VsdCgpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNSZXN1bHQpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjUmVzdWx0W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImF1dG9fdXJpXCIpIHJlc3VsdC5zZXRBdXRvVXJpKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGFzaFwiKSByZXN1bHQuc2V0SGFzaCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBhdGhcIikge30gLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGF0dXNcIikge30gLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1cGRhdGVcIikgcmVzdWx0LnNldElzVXBkYXRlQXZhaWxhYmxlKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidXNlcl91cmlcIikgcmVzdWx0LnNldFVzZXJVcmkodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ2ZXJzaW9uXCIpIHJlc3VsdC5zZXRWZXJzaW9uKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW50cnVzdGVkXCIpIHt9IC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBycGMgY2hlY2sgdXBkYXRlIHJlc3VsdDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICBpZiAocmVzdWx0LmdldEF1dG9VcmkoKSA9PT0gXCJcIikgcmVzdWx0LnNldEF1dG9VcmkodW5kZWZpbmVkKTtcbiAgICBpZiAocmVzdWx0LmdldFVzZXJVcmkoKSA9PT0gXCJcIikgcmVzdWx0LnNldFVzZXJVcmkodW5kZWZpbmVkKTtcbiAgICBpZiAocmVzdWx0LmdldFZlcnNpb24oKSA9PT0gXCJcIikgcmVzdWx0LnNldFZlcnNpb24odW5kZWZpbmVkKTtcbiAgICBpZiAocmVzdWx0LmdldEhhc2goKSA9PT0gXCJcIikgcmVzdWx0LnNldEhhc2godW5kZWZpbmVkKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNVcGRhdGVEb3dubG9hZFJlc3VsdChycGNSZXN1bHQpIHtcbiAgICBsZXQgcmVzdWx0ID0gbmV3IE1vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0KE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVXBkYXRlQ2hlY2tSZXN1bHQocnBjUmVzdWx0KSBhcyBNb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdCk7XG4gICAgcmVzdWx0LnNldERvd25sb2FkUGF0aChycGNSZXN1bHRbXCJwYXRoXCJdKTtcbiAgICBpZiAocmVzdWx0LmdldERvd25sb2FkUGF0aCgpID09PSBcIlwiKSByZXN1bHQuc2V0RG93bmxvYWRQYXRoKHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBhICcweCcgcHJlZml4ZWQgaGV4aWRlY2ltYWwgc3RyaW5nIHRvIGEgYmlnaW50LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGhleCBpcyB0aGUgJzB4JyBwcmVmaXhlZCBoZXhpZGVjaW1hbCBzdHJpbmcgdG8gY29udmVydFxuICAgKiBAcmV0dXJuIHtiaWdpbnR9IHRoZSBoZXhpY2VkaW1hbCBjb252ZXJ0ZWQgdG8gZGVjaW1hbFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBwcmVmaXhlZEhleFRvQkkoaGV4KSB7XG4gICAgYXNzZXJ0KGhleC5zdWJzdHJpbmcoMCwgMikgPT09IFwiMHhcIik7XG4gICAgcmV0dXJuIEJpZ0ludChoZXgpO1xuICB9XG59XG5cbi8qKlxuICogSW1wbGVtZW50cyBhIE1vbmVyb0RhZW1vbiBieSBwcm94eWluZyByZXF1ZXN0cyB0byBhIHdvcmtlci5cbiAqIFxuICogQHByaXZhdGVcbiAqL1xuY2xhc3MgTW9uZXJvRGFlbW9uUnBjUHJveHkge1xuXG4gIC8vIHN0YXRlIHZhcmlhYmxlc1xuICBwcml2YXRlIGRhZW1vbklkOiBhbnk7XG4gIHByaXZhdGUgd29ya2VyOiBhbnk7XG4gIHByaXZhdGUgd3JhcHBlZExpc3RlbmVyczogYW55O1xuICBwcml2YXRlIHByb2Nlc3M6IGFueTtcblxuICBjb25zdHJ1Y3RvcihkYWVtb25JZCwgd29ya2VyKSB7XG4gICAgdGhpcy5kYWVtb25JZCA9IGRhZW1vbklkO1xuICAgIHRoaXMud29ya2VyID0gd29ya2VyO1xuICAgIHRoaXMud3JhcHBlZExpc3RlbmVycyA9IFtdO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU1RBVElDIFVUSUxJVElFUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgc3RhdGljIGFzeW5jIGNvbm5lY3QoY29uZmlnKSB7XG4gICAgbGV0IGRhZW1vbklkID0gR2VuVXRpbHMuZ2V0VVVJRCgpO1xuICAgIGNvbmZpZyA9IE9iamVjdC5hc3NpZ24oe30sIGNvbmZpZywge3Byb3h5VG9Xb3JrZXI6IGZhbHNlfSk7XG4gICAgYXdhaXQgTGlicmFyeVV0aWxzLmludm9rZVdvcmtlcihkYWVtb25JZCwgXCJjb25uZWN0RGFlbW9uUnBjXCIsIFtjb25maWddKTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0RhZW1vblJwY1Byb3h5KGRhZW1vbklkLCBhd2FpdCBMaWJyYXJ5VXRpbHMuZ2V0V29ya2VyKCkpO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIElOU1RBTkNFIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgYXN5bmMgYWRkTGlzdGVuZXIobGlzdGVuZXIpIHtcbiAgICBsZXQgd3JhcHBlZExpc3RlbmVyID0gbmV3IERhZW1vbldvcmtlckxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBsZXQgbGlzdGVuZXJJZCA9IHdyYXBwZWRMaXN0ZW5lci5nZXRJZCgpO1xuICAgIExpYnJhcnlVdGlscy5hZGRXb3JrZXJDYWxsYmFjayh0aGlzLmRhZW1vbklkLCBcIm9uQmxvY2tIZWFkZXJfXCIgKyBsaXN0ZW5lcklkLCBbd3JhcHBlZExpc3RlbmVyLm9uQmxvY2tIZWFkZXIsIHdyYXBwZWRMaXN0ZW5lcl0pO1xuICAgIHRoaXMud3JhcHBlZExpc3RlbmVycy5wdXNoKHdyYXBwZWRMaXN0ZW5lcik7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uQWRkTGlzdGVuZXJcIiwgW2xpc3RlbmVySWRdKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMud3JhcHBlZExpc3RlbmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHRoaXMud3JhcHBlZExpc3RlbmVyc1tpXS5nZXRMaXN0ZW5lcigpID09PSBsaXN0ZW5lcikge1xuICAgICAgICBsZXQgbGlzdGVuZXJJZCA9IHRoaXMud3JhcHBlZExpc3RlbmVyc1tpXS5nZXRJZCgpO1xuICAgICAgICBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblJlbW92ZUxpc3RlbmVyXCIsIFtsaXN0ZW5lcklkXSk7XG4gICAgICAgIExpYnJhcnlVdGlscy5yZW1vdmVXb3JrZXJDYWxsYmFjayh0aGlzLmRhZW1vbklkLCBcIm9uQmxvY2tIZWFkZXJfXCIgKyBsaXN0ZW5lcklkKTtcbiAgICAgICAgdGhpcy53cmFwcGVkTGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJMaXN0ZW5lciBpcyBub3QgcmVnaXN0ZXJlZCB3aXRoIGRhZW1vblwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TGlzdGVuZXJzKCkge1xuICAgIGxldCBsaXN0ZW5lcnMgPSBbXTtcbiAgICBmb3IgKGxldCB3cmFwcGVkTGlzdGVuZXIgb2YgdGhpcy53cmFwcGVkTGlzdGVuZXJzKSBsaXN0ZW5lcnMucHVzaCh3cmFwcGVkTGlzdGVuZXIuZ2V0TGlzdGVuZXIoKSk7XG4gICAgcmV0dXJuIGxpc3RlbmVycztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UnBjQ29ubmVjdGlvbigpIHtcbiAgICBsZXQgY29uZmlnID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRScGNDb25uZWN0aW9uXCIpO1xuICAgIHJldHVybiBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbihjb25maWcgYXMgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPik7XG4gIH1cbiAgXG4gIGFzeW5jIGlzQ29ubmVjdGVkKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbklzQ29ubmVjdGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRWZXJzaW9uKCkge1xuICAgIGxldCB2ZXJzaW9uSnNvbjogYW55ID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRWZXJzaW9uXCIpO1xuICAgIHJldHVybiBuZXcgTW9uZXJvVmVyc2lvbih2ZXJzaW9uSnNvbi5udW1iZXIsIHZlcnNpb25Kc29uLmlzUmVsZWFzZSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzVHJ1c3RlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25Jc1RydXN0ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhlaWdodCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRIZWlnaHRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrSGFzaChoZWlnaHQpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja0hhc2hcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tUZW1wbGF0ZSh3YWxsZXRBZGRyZXNzLCByZXNlcnZlU2l6ZSkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvQmxvY2tUZW1wbGF0ZShhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2NrVGVtcGxhdGVcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldExhc3RCbG9ja0hlYWRlcigpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0TGFzdEJsb2NrSGVhZGVyXCIpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tIZWFkZXJCeUhhc2goYmxvY2tIYXNoKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9CbG9ja0hlYWRlcihhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2NrSGVhZGVyQnlIYXNoXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0hlYWRlckJ5SGVpZ2h0KGhlaWdodCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja0hlYWRlckJ5SGVpZ2h0XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0hlYWRlcnNCeVJhbmdlKHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpIHtcbiAgICBsZXQgYmxvY2tIZWFkZXJzSnNvbjogYW55W10gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2NrSGVhZGVyc0J5UmFuZ2VcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSBhcyBhbnlbXTtcbiAgICBsZXQgaGVhZGVycyA9IFtdO1xuICAgIGZvciAobGV0IGJsb2NrSGVhZGVySnNvbiBvZiBibG9ja0hlYWRlcnNKc29uKSBoZWFkZXJzLnB1c2gobmV3IE1vbmVyb0Jsb2NrSGVhZGVyKGJsb2NrSGVhZGVySnNvbikpO1xuICAgIHJldHVybiBoZWFkZXJzO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0J5SGFzaChibG9ja0hhc2gpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0Jsb2NrKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tCeUhhc2hcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2Nrc0J5SGFzaChibG9ja0hhc2hlcywgc3RhcnRIZWlnaHQsIHBydW5lKSB7XG4gICAgbGV0IGJsb2Nrc0pzb246IGFueVtdID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja3NCeUhhc2hcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSBhcyBhbnlbXTtcbiAgICBsZXQgYmxvY2tzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2tKc29uIG9mIGJsb2Nrc0pzb24pIGJsb2Nrcy5wdXNoKG5ldyBNb25lcm9CbG9jayhibG9ja0pzb24pKTtcbiAgICByZXR1cm4gYmxvY2tzO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0J5SGVpZ2h0KGhlaWdodCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvQmxvY2soYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja0J5SGVpZ2h0XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSksIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFgpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja3NCeUhlaWdodChoZWlnaHRzKSB7XG4gICAgbGV0IGJsb2Nrc0pzb246IGFueVtdPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2Nrc0J5SGVpZ2h0XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkgYXMgYW55W107XG4gICAgbGV0IGJsb2NrcyA9IFtdO1xuICAgIGZvciAobGV0IGJsb2NrSnNvbiBvZiBibG9ja3NKc29uKSBibG9ja3MucHVzaChuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uLCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYKSk7XG4gICAgcmV0dXJuIGJsb2NrcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tzQnlSYW5nZShzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSB7XG4gICAgbGV0IGJsb2Nrc0pzb246IGFueVtdID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja3NCeVJhbmdlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkgYXMgYW55W107XG4gICAgbGV0IGJsb2NrcyA9IFtdO1xuICAgIGZvciAobGV0IGJsb2NrSnNvbiBvZiBibG9ja3NKc29uKSBibG9ja3MucHVzaChuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uLCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYKSk7XG4gICAgcmV0dXJuIGJsb2NrcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tzQnlSYW5nZUNodW5rZWQoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgbWF4Q2h1bmtTaXplKSB7XG4gICAgbGV0IGJsb2Nrc0pzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2Nrc0J5UmFuZ2VDaHVua2VkXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkgYXMgYW55W107XG4gICAgbGV0IGJsb2NrcyA9IFtdO1xuICAgIGZvciAobGV0IGJsb2NrSnNvbiBvZiBibG9ja3NKc29uKSBibG9ja3MucHVzaChuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uLCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYKSk7XG4gICAgcmV0dXJuIGJsb2NrcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tIYXNoZXMoYmxvY2tIYXNoZXMsIHN0YXJ0SGVpZ2h0KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tIYXNoZXNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhzKHR4SGFzaGVzLCBwcnVuZSA9IGZhbHNlKSB7XG4gICAgXG4gICAgLy8gZGVzZXJpYWxpemUgdHhzIGZyb20gYmxvY2tzXG4gICAgbGV0IGJsb2NrcyA9IFtdO1xuICAgIGZvciAobGV0IGJsb2NrSnNvbiBvZiBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFR4c1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpIGFzIGFueVtdKSB7XG4gICAgICBibG9ja3MucHVzaChuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uLCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYKSk7XG4gICAgfVxuICAgIFxuICAgIC8vIGNvbGxlY3QgdHhzXG4gICAgbGV0IHR4cyA9IFtdO1xuICAgIGZvciAobGV0IGJsb2NrIG9mIGJsb2Nrcykge1xuICAgICAgZm9yIChsZXQgdHggb2YgYmxvY2suZ2V0VHhzKCkpIHtcbiAgICAgICAgaWYgKCF0eC5nZXRJc0NvbmZpcm1lZCgpKSB0eC5zZXRCbG9jayh1bmRlZmluZWQpO1xuICAgICAgICB0eHMucHVzaCh0eCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0eHM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4SGV4ZXModHhIYXNoZXMsIHBydW5lID0gZmFsc2UpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRUeEhleGVzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE1pbmVyVHhTdW0oaGVpZ2h0LCBudW1CbG9ja3MpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb01pbmVyVHhTdW0oYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRNaW5lclR4U3VtXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBnZXRGZWVFc3RpbWF0ZShncmFjZUJsb2Nrcz8pIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0ZlZUVzdGltYXRlKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0RmVlRXN0aW1hdGVcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdFR4SGV4KHR4SGV4LCBkb05vdFJlbGF5KSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9TdWJtaXRUeFJlc3VsdChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblN1Ym1pdFR4SGV4XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyByZWxheVR4c0J5SGFzaCh0eEhhc2hlcykge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblJlbGF5VHhzQnlIYXNoXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4UG9vbCgpIHtcbiAgICBsZXQgYmxvY2tKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRUeFBvb2xcIik7XG4gICAgbGV0IHR4cyA9IG5ldyBNb25lcm9CbG9jayhibG9ja0pzb24sIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFgpLmdldFR4cygpO1xuICAgIGZvciAobGV0IHR4IG9mIHR4cykgdHguc2V0QmxvY2sodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gdHhzID8gdHhzIDogW107XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4UG9vbEhhc2hlcygpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRUeFBvb2xIYXNoZXNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhQb29sQmFja2xvZygpIHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4UG9vbFN0YXRzKCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvVHhQb29sU3RhdHMoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRUeFBvb2xTdGF0c1wiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGZsdXNoVHhQb29sKGhhc2hlcykge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkZsdXNoVHhQb29sXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEtleUltYWdlU3BlbnRTdGF0dXNlcyhrZXlJbWFnZXMpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRLZXlJbWFnZVNwZW50U3RhdHVzZXNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0T3V0cHV0cyhvdXRwdXRzKTogUHJvbWlzZTxNb25lcm9PdXRwdXRbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0T3V0cHV0SGlzdG9ncmFtKGFtb3VudHMsIG1pbkNvdW50LCBtYXhDb3VudCwgaXNVbmxvY2tlZCwgcmVjZW50Q3V0b2ZmKSB7XG4gICAgbGV0IGVudHJpZXMgPSBbXTtcbiAgICBmb3IgKGxldCBlbnRyeUpzb24gb2YgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRPdXRwdXRIaXN0b2dyYW1cIiwgW2Ftb3VudHMsIG1pbkNvdW50LCBtYXhDb3VudCwgaXNVbmxvY2tlZCwgcmVjZW50Q3V0b2ZmXSkgYXMgYW55W10pIHtcbiAgICAgIGVudHJpZXMucHVzaChuZXcgTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkoZW50cnlKc29uKSk7XG4gICAgfVxuICAgIHJldHVybiBlbnRyaWVzO1xuICB9XG4gIFxuICBhc3luYyBnZXRPdXRwdXREaXN0cmlidXRpb24oYW1vdW50cywgY3VtdWxhdGl2ZSwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCkge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SW5mbygpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0RhZW1vbkluZm8oYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRJbmZvXCIpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U3luY0luZm8oKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9EYWVtb25TeW5jSW5mbyhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFN5bmNJbmZvXCIpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGFyZEZvcmtJbmZvKCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvSGFyZEZvcmtJbmZvKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0SGFyZEZvcmtJbmZvXCIpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWx0Q2hhaW5zKCkge1xuICAgIGxldCBhbHRDaGFpbnMgPSBbXTtcbiAgICBmb3IgKGxldCBhbHRDaGFpbkpzb24gb2YgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRBbHRDaGFpbnNcIikgYXMgYW55KSBhbHRDaGFpbnMucHVzaChuZXcgTW9uZXJvQWx0Q2hhaW4oYWx0Q2hhaW5Kc29uKSk7XG4gICAgcmV0dXJuIGFsdENoYWlucztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWx0QmxvY2tIYXNoZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QWx0QmxvY2tIYXNoZXNcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldERvd25sb2FkTGltaXQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0RG93bmxvYWRMaW1pdFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0RG93bmxvYWRMaW1pdChsaW1pdCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblNldERvd25sb2FkTGltaXRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzZXREb3dubG9hZExpbWl0KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblJlc2V0RG93bmxvYWRMaW1pdFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VXBsb2FkTGltaXQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0VXBsb2FkTGltaXRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIHNldFVwbG9hZExpbWl0KGxpbWl0KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uU2V0VXBsb2FkTGltaXRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzZXRVcGxvYWRMaW1pdCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25SZXNldFVwbG9hZExpbWl0XCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRQZWVycygpIHtcbiAgICBsZXQgcGVlcnMgPSBbXTtcbiAgICBmb3IgKGxldCBwZWVySnNvbiBvZiBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFBlZXJzXCIpIGFzIGFueSkgcGVlcnMucHVzaChuZXcgTW9uZXJvUGVlcihwZWVySnNvbikpO1xuICAgIHJldHVybiBwZWVycztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0S25vd25QZWVycygpIHtcbiAgICBsZXQgcGVlcnMgPSBbXTtcbiAgICBmb3IgKGxldCBwZWVySnNvbiBvZiBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEtub3duUGVlcnNcIikgYXMgYW55KSBwZWVycy5wdXNoKG5ldyBNb25lcm9QZWVyKHBlZXJKc29uKSk7XG4gICAgcmV0dXJuIHBlZXJzO1xuICB9XG4gIFxuICBhc3luYyBzZXRPdXRnb2luZ1BlZXJMaW1pdChsaW1pdCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblNldEluY29taW5nUGVlckxpbWl0XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNldEluY29taW5nUGVlckxpbWl0KGxpbWl0KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uU2V0SW5jb21pbmdQZWVyTGltaXRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGVlckJhbnMoKSB7XG4gICAgbGV0IGJhbnMgPSBbXTtcbiAgICBmb3IgKGxldCBiYW5Kc29uIG9mIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0UGVlckJhbnNcIikgYXMgYW55KSBiYW5zLnB1c2gobmV3IE1vbmVyb0JhbihiYW5Kc29uKSk7XG4gICAgcmV0dXJuIGJhbnM7XG4gIH1cblxuICBhc3luYyBzZXRQZWVyQmFucyhiYW5zKSB7XG4gICAgbGV0IGJhbnNKc29uID0gW107XG4gICAgZm9yIChsZXQgYmFuIG9mIGJhbnMpIGJhbnNKc29uLnB1c2goYmFuLnRvSnNvbigpKTtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TZXRQZWVyQmFuc1wiLCBbYmFuc0pzb25dKTtcbiAgfVxuICBcbiAgYXN5bmMgc3RhcnRNaW5pbmcoYWRkcmVzcywgbnVtVGhyZWFkcywgaXNCYWNrZ3JvdW5kLCBpZ25vcmVCYXR0ZXJ5KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uU3RhcnRNaW5pbmdcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgc3RvcE1pbmluZygpIHtcbiAgICBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblN0b3BNaW5pbmdcIilcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TWluaW5nU3RhdHVzKCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvTWluaW5nU3RhdHVzKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0TWluaW5nU3RhdHVzXCIpKTtcbiAgfVxuICBcbiAgYXN5bmMgc3VibWl0QmxvY2tzKGJsb2NrQmxvYnMpIHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cblxuICBhc3luYyBwcnVuZUJsb2NrY2hhaW4oY2hlY2spIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1BydW5lUmVzdWx0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uUHJ1bmVCbG9ja2NoYWluXCIpKTtcbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tGb3JVcGRhdGUoKTogUHJvbWlzZTxNb25lcm9EYWVtb25VcGRhdGVDaGVja1Jlc3VsdD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZG93bmxvYWRVcGRhdGUocGF0aCk6IFByb21pc2U8TW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIHN0b3AoKSB7XG4gICAgd2hpbGUgKHRoaXMud3JhcHBlZExpc3RlbmVycy5sZW5ndGgpIGF3YWl0IHRoaXMucmVtb3ZlTGlzdGVuZXIodGhpcy53cmFwcGVkTGlzdGVuZXJzWzBdLmdldExpc3RlbmVyKCkpO1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblN0b3BcIik7XG4gIH1cbiAgXG4gIGFzeW5jIHdhaXRGb3JOZXh0QmxvY2tIZWFkZXIoKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9CbG9ja0hlYWRlcihhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbldhaXRGb3JOZXh0QmxvY2tIZWFkZXJcIikpO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUFJJVkFURSBIRUxQRVJTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgLy8gVE9ETzogZHVwbGljYXRlZCB3aXRoIE1vbmVyb1dhbGxldEZ1bGxQcm94eVxuICBwcm90ZWN0ZWQgYXN5bmMgaW52b2tlV29ya2VyKGZuTmFtZTogc3RyaW5nLCBhcmdzPzogYW55KSB7XG4gICAgcmV0dXJuIExpYnJhcnlVdGlscy5pbnZva2VXb3JrZXIodGhpcy5kYWVtb25JZCwgZm5OYW1lLCBhcmdzKTtcbiAgfVxufVxuXG4vKipcbiAqIFBvbGxzIGEgTW9uZXJvIGRhZW1vbiBmb3IgdXBkYXRlcyBhbmQgbm90aWZpZXMgbGlzdGVuZXJzIGFzIHRoZXkgb2NjdXIuXG4gKiBcbiAqIEBwcml2YXRlXG4gKi9cbmNsYXNzIERhZW1vblBvbGxlciB7XG5cbiAgcHJvdGVjdGVkIGRhZW1vbjogTW9uZXJvRGFlbW9uUnBjO1xuICBwcm90ZWN0ZWQgbG9vcGVyOiBUYXNrTG9vcGVyO1xuICBwcm90ZWN0ZWQgaXNQb2xsaW5nOiBib29sZWFuO1xuICBwcm90ZWN0ZWQgbGFzdEhlYWRlcjogTW9uZXJvQmxvY2tIZWFkZXI7XG5cbiAgY29uc3RydWN0b3IoZGFlbW9uKSB7XG4gICAgbGV0IHRoYXQgPSB0aGlzO1xuICAgIHRoaXMuZGFlbW9uID0gZGFlbW9uO1xuICAgIHRoaXMubG9vcGVyID0gbmV3IFRhc2tMb29wZXIoYXN5bmMgZnVuY3Rpb24oKSB7IGF3YWl0IHRoYXQucG9sbCgpOyB9KTtcbiAgfVxuICBcbiAgc2V0SXNQb2xsaW5nKGlzUG9sbGluZzogYm9vbGVhbikge1xuICAgIHRoaXMuaXNQb2xsaW5nID0gaXNQb2xsaW5nO1xuICAgIGlmIChpc1BvbGxpbmcpIHRoaXMubG9vcGVyLnN0YXJ0KHRoaXMuZGFlbW9uLmdldFBvbGxJbnRlcnZhbCgpKTtcbiAgICBlbHNlIHRoaXMubG9vcGVyLnN0b3AoKTtcbiAgfVxuICBcbiAgYXN5bmMgcG9sbCgpIHtcbiAgICB0cnkge1xuICAgICAgXG4gICAgICAvLyBnZXQgbGF0ZXN0IGJsb2NrIGhlYWRlclxuICAgICAgbGV0IGhlYWRlciA9IGF3YWl0IHRoaXMuZGFlbW9uLmdldExhc3RCbG9ja0hlYWRlcigpO1xuICAgICAgXG4gICAgICAvLyBzYXZlIGZpcnN0IGhlYWRlciBmb3IgY29tcGFyaXNvblxuICAgICAgaWYgKCF0aGlzLmxhc3RIZWFkZXIpIHtcbiAgICAgICAgdGhpcy5sYXN0SGVhZGVyID0gYXdhaXQgdGhpcy5kYWVtb24uZ2V0TGFzdEJsb2NrSGVhZGVyKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gY29tcGFyZSBoZWFkZXIgdG8gbGFzdFxuICAgICAgaWYgKGhlYWRlci5nZXRIYXNoKCkgIT09IHRoaXMubGFzdEhlYWRlci5nZXRIYXNoKCkpIHtcbiAgICAgICAgdGhpcy5sYXN0SGVhZGVyID0gaGVhZGVyO1xuICAgICAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiBhd2FpdCB0aGlzLmRhZW1vbi5nZXRMaXN0ZW5lcnMoKSkge1xuICAgICAgICAgIGF3YWl0IGxpc3RlbmVyLm9uQmxvY2tIZWFkZXIoaGVhZGVyKTsgLy8gbm90aWZ5IGxpc3RlbmVyXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gYmFja2dyb3VuZCBwb2xsIGRhZW1vbiBoZWFkZXJcIik7XG4gICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogSW50ZXJuYWwgbGlzdGVuZXIgdG8gYnJpZGdlIG5vdGlmaWNhdGlvbnMgdG8gZXh0ZXJuYWwgbGlzdGVuZXJzLlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBEYWVtb25Xb3JrZXJMaXN0ZW5lciB7XG5cbiAgcHJvdGVjdGVkIGlkOiBhbnk7XG4gIHByb3RlY3RlZCBsaXN0ZW5lcjogYW55O1xuXG4gIGNvbnN0cnVjdG9yKGxpc3RlbmVyKSB7XG4gICAgdGhpcy5pZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICB0aGlzLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIH1cbiAgXG4gIGdldElkKCkge1xuICAgIHJldHVybiB0aGlzLmlkO1xuICB9XG4gIFxuICBnZXRMaXN0ZW5lcigpIHtcbiAgICByZXR1cm4gdGhpcy5saXN0ZW5lcjtcbiAgfVxuICBcbiAgYXN5bmMgb25CbG9ja0hlYWRlcihoZWFkZXJKc29uKSB7XG4gICAgcmV0dXJuIHRoaXMubGlzdGVuZXIub25CbG9ja0hlYWRlcihuZXcgTW9uZXJvQmxvY2tIZWFkZXIoaGVhZGVySnNvbikpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IE1vbmVyb0RhZW1vblJwYztcbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLFNBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLGFBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFHLFdBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFJLGVBQUEsR0FBQUwsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFLLFVBQUEsR0FBQU4sc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFNLFlBQUEsR0FBQVAsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFPLGtCQUFBLEdBQUFSLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBUSxvQkFBQSxHQUFBVCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVMscUJBQUEsR0FBQVYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFVLGFBQUEsR0FBQVgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFXLG1CQUFBLEdBQUFaLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBWSxpQkFBQSxHQUFBYixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWEscUJBQUEsR0FBQWQsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFjLHFC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