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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX1Rhc2tMb29wZXIiLCJfTW9uZXJvQWx0Q2hhaW4iLCJfTW9uZXJvQmFuIiwiX01vbmVyb0Jsb2NrIiwiX01vbmVyb0Jsb2NrSGVhZGVyIiwiX01vbmVyb0Jsb2NrVGVtcGxhdGUiLCJfTW9uZXJvQ29ubmVjdGlvblNwYW4iLCJfTW9uZXJvRGFlbW9uIiwiX01vbmVyb0RhZW1vbkNvbmZpZyIsIl9Nb25lcm9EYWVtb25JbmZvIiwiX01vbmVyb0RhZW1vbkxpc3RlbmVyIiwiX01vbmVyb0RhZW1vblN5bmNJbmZvIiwiX01vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0IiwiX01vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0IiwiX01vbmVyb0ZlZUVzdGltYXRlIiwiX01vbmVyb0Vycm9yIiwiX01vbmVyb0hhcmRGb3JrSW5mbyIsIl9Nb25lcm9LZXlJbWFnZSIsIl9Nb25lcm9NaW5lclR4U3VtIiwiX01vbmVyb01pbmluZ1N0YXR1cyIsIl9Nb25lcm9OZXR3b3JrVHlwZSIsIl9Nb25lcm9PdXRwdXQiLCJfTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkiLCJfTW9uZXJvUGVlciIsIl9Nb25lcm9QcnVuZVJlc3VsdCIsIl9Nb25lcm9ScGNDb25uZWN0aW9uIiwiX01vbmVyb1N1Ym1pdFR4UmVzdWx0IiwiX01vbmVyb1R4IiwiX01vbmVyb1R4UG9vbFN0YXRzIiwiX01vbmVyb1V0aWxzIiwiX01vbmVyb1ZlcnNpb24iLCJNb25lcm9EYWVtb25ScGMiLCJNb25lcm9EYWVtb24iLCJNQVhfUkVRX1NJWkUiLCJERUZBVUxUX0lEIiwiTlVNX0hFQURFUlNfUEVSX1JFUSIsIkRFRkFVTFRfUE9MTF9QRVJJT0QiLCJjb25zdHJ1Y3RvciIsImNvbmZpZyIsInByb3h5RGFlbW9uIiwicHJveHlUb1dvcmtlciIsImxpc3RlbmVycyIsImNhY2hlZEhlYWRlcnMiLCJnZXRQcm9jZXNzIiwicHJvY2VzcyIsInN0b3BQcm9jZXNzIiwiZm9yY2UiLCJ1bmRlZmluZWQiLCJNb25lcm9FcnJvciIsImxpc3RlbmVyc0NvcHkiLCJHZW5VdGlscyIsImNvcHlBcnJheSIsImdldExpc3RlbmVycyIsImxpc3RlbmVyIiwicmVtb3ZlTGlzdGVuZXIiLCJraWxsUHJvY2VzcyIsImFkZExpc3RlbmVyIiwiYXNzZXJ0IiwiTW9uZXJvRGFlbW9uTGlzdGVuZXIiLCJwdXNoIiwicmVmcmVzaExpc3RlbmluZyIsImlkeCIsImluZGV4T2YiLCJzcGxpY2UiLCJnZXRScGNDb25uZWN0aW9uIiwiZ2V0U2VydmVyIiwiaXNDb25uZWN0ZWQiLCJnZXRWZXJzaW9uIiwiZSIsInJlc3AiLCJzZW5kSnNvblJlcXVlc3QiLCJjaGVja1Jlc3BvbnNlU3RhdHVzIiwicmVzdWx0IiwiTW9uZXJvVmVyc2lvbiIsInZlcnNpb24iLCJyZWxlYXNlIiwiaXNUcnVzdGVkIiwic2VuZFBhdGhSZXF1ZXN0IiwidW50cnVzdGVkIiwiZ2V0SGVpZ2h0IiwiY291bnQiLCJnZXRCbG9ja0hhc2giLCJoZWlnaHQiLCJnZXRCbG9ja1RlbXBsYXRlIiwid2FsbGV0QWRkcmVzcyIsInJlc2VydmVTaXplIiwid2FsbGV0X2FkZHJlc3MiLCJyZXNlcnZlX3NpemUiLCJjb252ZXJ0UnBjQmxvY2tUZW1wbGF0ZSIsImdldExhc3RCbG9ja0hlYWRlciIsImNvbnZlcnRScGNCbG9ja0hlYWRlciIsImJsb2NrX2hlYWRlciIsImdldEJsb2NrSGVhZGVyQnlIYXNoIiwiYmxvY2tIYXNoIiwiaGFzaCIsImdldEJsb2NrSGVhZGVyQnlIZWlnaHQiLCJnZXRCbG9ja0hlYWRlcnNCeVJhbmdlIiwic3RhcnRIZWlnaHQiLCJlbmRIZWlnaHQiLCJzdGFydF9oZWlnaHQiLCJlbmRfaGVpZ2h0IiwiaGVhZGVycyIsInJwY0hlYWRlciIsImdldEJsb2NrQnlIYXNoIiwiY29udmVydFJwY0Jsb2NrIiwiZ2V0QmxvY2tCeUhlaWdodCIsImdldEJsb2Nrc0J5SGVpZ2h0IiwiaGVpZ2h0cyIsInJlc3BCaW4iLCJzZW5kQmluYXJ5UmVxdWVzdCIsInJwY0Jsb2NrcyIsIk1vbmVyb1V0aWxzIiwiYmluYXJ5QmxvY2tzVG9Kc29uIiwiZXF1YWwiLCJ0eHMiLCJsZW5ndGgiLCJibG9ja3MiLCJibG9ja0lkeCIsImJsb2NrIiwic2V0SGVpZ2h0IiwidHhJZHgiLCJ0eCIsIk1vbmVyb1R4Iiwic2V0SGFzaCIsInR4X2hhc2hlcyIsInNldElzQ29uZmlybWVkIiwic2V0SW5UeFBvb2wiLCJzZXRJc01pbmVyVHgiLCJzZXRSZWxheSIsInNldElzUmVsYXllZCIsInNldElzRmFpbGVkIiwic2V0SXNEb3VibGVTcGVuZFNlZW4iLCJjb252ZXJ0UnBjVHgiLCJzZXRUeHMiLCJnZXRCbG9jayIsIm1lcmdlIiwiZ2V0VHhzIiwic2V0QmxvY2siLCJnZXRCbG9ja3NCeVJhbmdlIiwiZ2V0QmxvY2tzQnlSYW5nZUNodW5rZWQiLCJtYXhDaHVua1NpemUiLCJsYXN0SGVpZ2h0IiwiZ2V0TWF4QmxvY2tzIiwidHhIYXNoZXMiLCJwcnVuZSIsIkFycmF5IiwiaXNBcnJheSIsInR4c19oYXNoZXMiLCJkZWNvZGVfYXNfanNvbiIsIm1lc3NhZ2UiLCJnZXRUeEhleGVzIiwiaGV4ZXMiLCJnZXRQcnVuZWRIZXgiLCJnZXRGdWxsSGV4IiwiZ2V0TWluZXJUeFN1bSIsIm51bUJsb2NrcyIsInR4U3VtIiwiTW9uZXJvTWluZXJUeFN1bSIsInNldEVtaXNzaW9uU3VtIiwiQmlnSW50IiwiZW1pc3Npb25fYW1vdW50Iiwic2V0RmVlU3VtIiwiZmVlX2Ftb3VudCIsImdldEZlZUVzdGltYXRlIiwiZ3JhY2VCbG9ja3MiLCJncmFjZV9ibG9ja3MiLCJmZWVFc3RpbWF0ZSIsIk1vbmVyb0ZlZUVzdGltYXRlIiwic2V0RmVlIiwiZmVlIiwiZmVlcyIsImkiLCJzZXRGZWVzIiwic2V0UXVhbnRpemF0aW9uTWFzayIsInF1YW50aXphdGlvbl9tYXNrIiwic3VibWl0VHhIZXgiLCJ0eEhleCIsImRvTm90UmVsYXkiLCJ0eF9hc19oZXgiLCJkb19ub3RfcmVsYXkiLCJjb252ZXJ0UnBjU3VibWl0VHhSZXN1bHQiLCJzZXRJc0dvb2QiLCJyZWxheVR4c0J5SGFzaCIsInR4aWRzIiwiZ2V0VHhQb29sIiwidHJhbnNhY3Rpb25zIiwicnBjVHgiLCJzZXROdW1Db25maXJtYXRpb25zIiwiZ2V0VHhQb29sSGFzaGVzIiwiZ2V0VHhQb29sU3RhdHMiLCJjb252ZXJ0UnBjVHhQb29sU3RhdHMiLCJwb29sX3N0YXRzIiwiZmx1c2hUeFBvb2wiLCJoYXNoZXMiLCJsaXN0aWZ5IiwiZ2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzIiwia2V5SW1hZ2VzIiwia2V5X2ltYWdlcyIsInNwZW50X3N0YXR1cyIsImdldE91dHB1dEhpc3RvZ3JhbSIsImFtb3VudHMiLCJtaW5Db3VudCIsIm1heENvdW50IiwiaXNVbmxvY2tlZCIsInJlY2VudEN1dG9mZiIsIm1pbl9jb3VudCIsIm1heF9jb3VudCIsInVubG9ja2VkIiwicmVjZW50X2N1dG9mZiIsImVudHJpZXMiLCJoaXN0b2dyYW0iLCJycGNFbnRyeSIsImNvbnZlcnRScGNPdXRwdXRIaXN0b2dyYW1FbnRyeSIsImdldE91dHB1dERpc3RyaWJ1dGlvbiIsImN1bXVsYXRpdmUiLCJnZXRJbmZvIiwiY29udmVydFJwY0luZm8iLCJnZXRTeW5jSW5mbyIsImNvbnZlcnRScGNTeW5jSW5mbyIsImdldEhhcmRGb3JrSW5mbyIsImNvbnZlcnRScGNIYXJkRm9ya0luZm8iLCJnZXRBbHRDaGFpbnMiLCJjaGFpbnMiLCJycGNDaGFpbiIsImNvbnZlcnRScGNBbHRDaGFpbiIsImdldEFsdEJsb2NrSGFzaGVzIiwiYmxrc19oYXNoZXMiLCJnZXREb3dubG9hZExpbWl0IiwiZ2V0QmFuZHdpZHRoTGltaXRzIiwic2V0RG93bmxvYWRMaW1pdCIsImxpbWl0IiwicmVzZXREb3dubG9hZExpbWl0IiwiaXNJbnQiLCJzZXRCYW5kd2lkdGhMaW1pdHMiLCJnZXRVcGxvYWRMaW1pdCIsInNldFVwbG9hZExpbWl0IiwicmVzZXRVcGxvYWRMaW1pdCIsImdldFBlZXJzIiwicGVlcnMiLCJjb25uZWN0aW9ucyIsInJwY0Nvbm5lY3Rpb24iLCJjb252ZXJ0UnBjQ29ubmVjdGlvbiIsImdldEtub3duUGVlcnMiLCJncmF5X2xpc3QiLCJycGNQZWVyIiwicGVlciIsImNvbnZlcnRScGNQZWVyIiwic2V0SXNPbmxpbmUiLCJ3aGl0ZV9saXN0Iiwic2V0T3V0Z29pbmdQZWVyTGltaXQiLCJvdXRfcGVlcnMiLCJzZXRJbmNvbWluZ1BlZXJMaW1pdCIsImluX3BlZXJzIiwiZ2V0UGVlckJhbnMiLCJiYW5zIiwicnBjQmFuIiwiYmFuIiwiTW9uZXJvQmFuIiwic2V0SG9zdCIsImhvc3QiLCJzZXRJcCIsImlwIiwic2V0U2Vjb25kcyIsInNlY29uZHMiLCJzZXRQZWVyQmFucyIsInJwY0JhbnMiLCJjb252ZXJ0VG9ScGNCYW4iLCJzdGFydE1pbmluZyIsImFkZHJlc3MiLCJudW1UaHJlYWRzIiwiaXNCYWNrZ3JvdW5kIiwiaWdub3JlQmF0dGVyeSIsIm1pbmVyX2FkZHJlc3MiLCJ0aHJlYWRzX2NvdW50IiwiZG9fYmFja2dyb3VuZF9taW5pbmciLCJpZ25vcmVfYmF0dGVyeSIsInN0b3BNaW5pbmciLCJnZXRNaW5pbmdTdGF0dXMiLCJjb252ZXJ0UnBjTWluaW5nU3RhdHVzIiwic3VibWl0QmxvY2tzIiwiYmxvY2tCbG9icyIsInBydW5lQmxvY2tjaGFpbiIsImNoZWNrIiwiTW9uZXJvUHJ1bmVSZXN1bHQiLCJzZXRJc1BydW5lZCIsInBydW5lZCIsInNldFBydW5pbmdTZWVkIiwicHJ1bmluZ19zZWVkIiwiY2hlY2tGb3JVcGRhdGUiLCJjb21tYW5kIiwiY29udmVydFJwY1VwZGF0ZUNoZWNrUmVzdWx0IiwiZG93bmxvYWRVcGRhdGUiLCJwYXRoIiwiY29udmVydFJwY1VwZGF0ZURvd25sb2FkUmVzdWx0Iiwic3RvcCIsIndhaXRGb3JOZXh0QmxvY2tIZWFkZXIiLCJ0aGF0IiwiUHJvbWlzZSIsInJlc29sdmUiLCJvbkJsb2NrSGVhZGVyIiwiaGVhZGVyIiwiZ2V0UG9sbEludGVydmFsIiwicG9sbEludGVydmFsIiwiZ2V0VHgiLCJ0eEhhc2giLCJnZXRUeEhleCIsImdldEtleUltYWdlU3BlbnRTdGF0dXMiLCJrZXlJbWFnZSIsInNldFBlZXJCYW4iLCJzdWJtaXRCbG9jayIsImJsb2NrQmxvYiIsInBvbGxMaXN0ZW5lciIsIkRhZW1vblBvbGxlciIsInNldElzUG9sbGluZyIsImxpbWl0X2Rvd24iLCJsaW1pdF91cCIsImRvd25MaW1pdCIsInVwTGltaXQiLCJtYXhIZWlnaHQiLCJtYXhSZXFTaXplIiwicmVxU2l6ZSIsImdldEJsb2NrSGVhZGVyQnlIZWlnaHRDYWNoZWQiLCJnZXRTaXplIiwiY2FjaGVkSGVhZGVyIiwiTWF0aCIsIm1pbiIsImNvbm5lY3RUb0RhZW1vblJwYyIsInVyaU9yQ29uZmlnIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsIm5vcm1hbGl6ZUNvbmZpZyIsImNtZCIsInN0YXJ0TW9uZXJvZFByb2Nlc3MiLCJNb25lcm9EYWVtb25ScGNQcm94eSIsImNvbm5lY3QiLCJjaGlsZFByb2Nlc3MiLCJzcGF3biIsInNsaWNlIiwiZW52IiwiTEFORyIsInN0ZG91dCIsInNldEVuY29kaW5nIiwic3RkZXJyIiwidXJpIiwib3V0cHV0IiwicmVqZWN0Iiwib24iLCJkYXRhIiwibGluZSIsInRvU3RyaW5nIiwiTGlicmFyeVV0aWxzIiwibG9nIiwidXJpTGluZUNvbnRhaW5zIiwidXJpTGluZUNvbnRhaW5zSWR4Iiwic3Vic3RyaW5nIiwibGFzdEluZGV4T2YiLCJ1bmZvcm1hdHRlZExpbmUiLCJyZXBsYWNlIiwidHJpbSIsInBvcnQiLCJzc2xJZHgiLCJzc2xFbmFibGVkIiwidG9Mb3dlckNhc2UiLCJ1c2VyUGFzc0lkeCIsInVzZXJQYXNzIiwiY29weSIsInNldFNlcnZlciIsInJlamVjdFVuYXV0aG9yaXplZCIsImdldFJlamVjdFVuYXV0aG9yaXplZCIsInNldFByb3h5VG9Xb3JrZXIiLCJkYWVtb24iLCJpc1Jlc29sdmVkIiwiZ2V0TG9nTGV2ZWwiLCJjb25zb2xlIiwiZXJyb3IiLCJjb2RlIiwiRXJyb3IiLCJlcnIiLCJvcmlnaW4iLCJNb25lcm9EYWVtb25Db25maWciLCJzZXJ2ZXIiLCJNb25lcm9ScGNDb25uZWN0aW9uIiwiREVGQVVMVF9DT05GSUciLCJzdGF0dXMiLCJNb25lcm9CbG9ja0hlYWRlciIsImtleSIsIk9iamVjdCIsImtleXMiLCJ2YWwiLCJzYWZlU2V0Iiwic2V0U2l6ZSIsImdldERlcHRoIiwic2V0RGVwdGgiLCJzZXREaWZmaWN1bHR5IiwicmVjb25jaWxlIiwiZ2V0RGlmZmljdWx0eSIsInByZWZpeGVkSGV4VG9CSSIsInNldEN1bXVsYXRpdmVEaWZmaWN1bHR5IiwiZ2V0Q3VtdWxhdGl2ZURpZmZpY3VsdHkiLCJnZXRIYXNoIiwiZ2V0TWFqb3JWZXJzaW9uIiwic2V0TWFqb3JWZXJzaW9uIiwiZ2V0TWlub3JWZXJzaW9uIiwic2V0TWlub3JWZXJzaW9uIiwiZ2V0Tm9uY2UiLCJzZXROb25jZSIsImdldE51bVR4cyIsInNldE51bVR4cyIsImdldE9ycGhhblN0YXR1cyIsInNldE9ycGhhblN0YXR1cyIsImdldFByZXZIYXNoIiwic2V0UHJldkhhc2giLCJnZXRSZXdhcmQiLCJzZXRSZXdhcmQiLCJnZXRUaW1lc3RhbXAiLCJzZXRUaW1lc3RhbXAiLCJnZXRXZWlnaHQiLCJzZXRXZWlnaHQiLCJnZXRMb25nVGVybVdlaWdodCIsInNldExvbmdUZXJtV2VpZ2h0IiwiZ2V0UG93SGFzaCIsInNldFBvd0hhc2giLCJzZXRNaW5lclR4SGFzaCIsInJwY0Jsb2NrIiwiTW9uZXJvQmxvY2siLCJzZXRIZXgiLCJibG9iIiwic2V0VHhIYXNoZXMiLCJycGNNaW5lclR4IiwianNvbiIsIkpTT04iLCJwYXJzZSIsIm1pbmVyX3R4IiwibWluZXJUeCIsInNldE1pbmVyVHgiLCJnZXRMYXN0UmVsYXllZFRpbWVzdGFtcCIsInNldExhc3RSZWxheWVkVGltZXN0YW1wIiwiZ2V0UmVjZWl2ZWRUaW1lc3RhbXAiLCJzZXRSZWNlaXZlZFRpbWVzdGFtcCIsImdldE51bUNvbmZpcm1hdGlvbnMiLCJnZXRJc0NvbmZpcm1lZCIsImdldEluVHhQb29sIiwiZ2V0SXNEb3VibGVTcGVuZFNlZW4iLCJzZXRWZXJzaW9uIiwiZ2V0RXh0cmEiLCJzZXRFeHRyYSIsIlVpbnQ4QXJyYXkiLCJnZW4iLCJzZXRJbnB1dHMiLCJtYXAiLCJycGNWaW4iLCJjb252ZXJ0UnBjT3V0cHV0Iiwic2V0T3V0cHV0cyIsInJwY091dHB1dCIsImdldFJjdFNpZ25hdHVyZXMiLCJzZXRSY3RTaWduYXR1cmVzIiwidHhuRmVlIiwiZ2V0RmVlIiwiZ2V0UmN0U2lnUHJ1bmFibGUiLCJzZXRSY3RTaWdQcnVuYWJsZSIsImdldFVubG9ja1RpbWUiLCJzZXRVbmxvY2tUaW1lIiwic2V0RnVsbEhleCIsImdldElzUmVsYXllZCIsImdldE91dHB1dEluZGljZXMiLCJzZXRPdXRwdXRJbmRpY2VzIiwiZ2V0UmVsYXkiLCJnZXRJc0tlcHRCeUJsb2NrIiwic2V0SXNLZXB0QnlCbG9jayIsImdldFNpZ25hdHVyZXMiLCJzZXRTaWduYXR1cmVzIiwiZ2V0SXNGYWlsZWQiLCJnZXRMYXN0RmFpbGVkSGVpZ2h0Iiwic2V0TGFzdEZhaWxlZEhlaWdodCIsImdldExhc3RGYWlsZWRIYXNoIiwic2V0TGFzdEZhaWxlZEhhc2giLCJnZXRNYXhVc2VkQmxvY2tIZWlnaHQiLCJzZXRNYXhVc2VkQmxvY2tIZWlnaHQiLCJnZXRNYXhVc2VkQmxvY2tIYXNoIiwic2V0TWF4VXNlZEJsb2NrSGFzaCIsImdldFBydW5hYmxlSGFzaCIsInNldFBydW5hYmxlSGFzaCIsImdldFBydW5hYmxlSGV4Iiwic2V0UHJ1bmFibGVIZXgiLCJzZXRQcnVuZWRIZXgiLCJnZXRPdXRwdXRzIiwic2V0SW5kZXgiLCJhc19qc29uIiwidHhfanNvbiIsIk1vbmVyb091dHB1dCIsInNldFR4IiwiZ2V0QW1vdW50Iiwic2V0QW1vdW50IiwiYW1vdW50IiwiZ2V0S2V5SW1hZ2UiLCJzZXRLZXlJbWFnZSIsIk1vbmVyb0tleUltYWdlIiwia19pbWFnZSIsImdldFJpbmdPdXRwdXRJbmRpY2VzIiwic2V0UmluZ091dHB1dEluZGljZXMiLCJrZXlfb2Zmc2V0cyIsInB1YktleSIsInRhZ2dlZF9rZXkiLCJnZXRTdGVhbHRoUHVibGljS2V5Iiwic2V0U3RlYWx0aFB1YmxpY0tleSIsInJwY1RlbXBsYXRlIiwidGVtcGxhdGUiLCJNb25lcm9CbG9ja1RlbXBsYXRlIiwic2V0QmxvY2tUZW1wbGF0ZUJsb2IiLCJzZXRCbG9ja0hhc2hpbmdCbG9iIiwic2V0RXhwZWN0ZWRSZXdhcmQiLCJzZXRSZXNlcnZlZE9mZnNldCIsInNldFNlZWRIZWlnaHQiLCJzZXRTZWVkSGFzaCIsInNldE5leHRTZWVkSGFzaCIsImdldE5leHRTZWVkSGFzaCIsInJwY0luZm8iLCJpbmZvIiwiTW9uZXJvRGFlbW9uSW5mbyIsInNldE51bUFsdEJsb2NrcyIsInNldEJsb2NrU2l6ZUxpbWl0Iiwic2V0QmxvY2tTaXplTWVkaWFuIiwic2V0QmxvY2tXZWlnaHRMaW1pdCIsInNldEJsb2NrV2VpZ2h0TWVkaWFuIiwic2V0Qm9vdHN0cmFwRGFlbW9uQWRkcmVzcyIsInNldEZyZWVTcGFjZSIsInNldERhdGFiYXNlU2l6ZSIsInNldE51bU9mZmxpbmVQZWVycyIsInNldEhlaWdodFdpdGhvdXRCb290c3RyYXAiLCJzZXROdW1JbmNvbWluZ0Nvbm5lY3Rpb25zIiwic2V0SXNPZmZsaW5lIiwic2V0TnVtT3V0Z29pbmdDb25uZWN0aW9ucyIsInNldE51bVJwY0Nvbm5lY3Rpb25zIiwic2V0U3RhcnRUaW1lc3RhbXAiLCJzZXRBZGp1c3RlZFRpbWVzdGFtcCIsInNldFRhcmdldCIsInNldFRhcmdldEhlaWdodCIsInNldFRvcEJsb2NrSGFzaCIsInNldE51bVR4c1Bvb2wiLCJzZXRXYXNCb290c3RyYXBFdmVyVXNlZCIsInNldE51bU9ubGluZVBlZXJzIiwic2V0VXBkYXRlQXZhaWxhYmxlIiwiZ2V0TmV0d29ya1R5cGUiLCJzZXROZXR3b3JrVHlwZSIsIk1vbmVyb05ldHdvcmtUeXBlIiwiTUFJTk5FVCIsIlRFU1RORVQiLCJTVEFHRU5FVCIsInNldENyZWRpdHMiLCJnZXRUb3BCbG9ja0hhc2giLCJzZXRJc0J1c3lTeW5jaW5nIiwic2V0SXNTeW5jaHJvbml6ZWQiLCJzZXRJc1Jlc3RyaWN0ZWQiLCJycGNTeW5jSW5mbyIsInN5bmNJbmZvIiwiTW9uZXJvRGFlbW9uU3luY0luZm8iLCJzZXRQZWVycyIsInJwY0Nvbm5lY3Rpb25zIiwic2V0U3BhbnMiLCJycGNTcGFucyIsInJwY1NwYW4iLCJnZXRTcGFucyIsImNvbnZlcnRScGNDb25uZWN0aW9uU3BhbiIsInNldE5leHROZWVkZWRQcnVuaW5nU2VlZCIsIm92ZXJ2aWV3IiwicnBjSGFyZEZvcmtJbmZvIiwiTW9uZXJvSGFyZEZvcmtJbmZvIiwic2V0RWFybGllc3RIZWlnaHQiLCJzZXRJc0VuYWJsZWQiLCJzZXRTdGF0ZSIsInNldFRocmVzaG9sZCIsInNldE51bVZvdGVzIiwic2V0Vm90aW5nIiwic2V0V2luZG93IiwicnBjQ29ubmVjdGlvblNwYW4iLCJzcGFuIiwiTW9uZXJvQ29ubmVjdGlvblNwYW4iLCJzZXRDb25uZWN0aW9uSWQiLCJzZXROdW1CbG9ja3MiLCJzZXRSYXRlIiwic2V0UmVtb3RlQWRkcmVzcyIsInNldFNwZWVkIiwic2V0U3RhcnRIZWlnaHQiLCJlbnRyeSIsIk1vbmVyb091dHB1dEhpc3RvZ3JhbUVudHJ5Iiwic2V0TnVtSW5zdGFuY2VzIiwic2V0TnVtVW5sb2NrZWRJbnN0YW5jZXMiLCJzZXROdW1SZWNlbnRJbnN0YW5jZXMiLCJycGNSZXN1bHQiLCJNb25lcm9TdWJtaXRUeFJlc3VsdCIsInNldElzRmVlVG9vTG93Iiwic2V0SGFzSW52YWxpZElucHV0Iiwic2V0SGFzSW52YWxpZE91dHB1dCIsInNldEhhc1Rvb0Zld091dHB1dHMiLCJzZXRJc01peGluVG9vTG93Iiwic2V0SXNPdmVyc3BlbmQiLCJzZXRSZWFzb24iLCJzZXRJc1Rvb0JpZyIsInNldFNhbml0eUNoZWNrRmFpbGVkIiwic2V0SXNUeEV4dHJhVG9vQmlnIiwicnBjU3RhdHMiLCJzdGF0cyIsIk1vbmVyb1R4UG9vbFN0YXRzIiwic2V0Qnl0ZXNNYXgiLCJzZXRCeXRlc01lZCIsInNldEJ5dGVzTWluIiwic2V0Qnl0ZXNUb3RhbCIsInNldEhpc3RvOThwYyIsInNldE51bTEwbSIsInNldE51bURvdWJsZVNwZW5kcyIsInNldE51bUZhaWxpbmciLCJzZXROdW1Ob3RSZWxheWVkIiwic2V0T2xkZXN0VGltZXN0YW1wIiwic2V0RmVlVG90YWwiLCJzZXRIaXN0byIsIk1hcCIsImVsZW0iLCJnZXRIaXN0byIsInNldCIsImJ5dGVzIiwiZ2V0SGlzdG85OHBjIiwiY2hhaW4iLCJNb25lcm9BbHRDaGFpbiIsInNldExlbmd0aCIsInNldEJsb2NrSGFzaGVzIiwic2V0TWFpbkNoYWluUGFyZW50QmxvY2tIYXNoIiwiTW9uZXJvUGVlciIsInNldElkIiwic2V0TGFzdFNlZW5UaW1lc3RhbXAiLCJzZXRQb3J0Iiwic2V0UnBjUG9ydCIsInNldFJwY0NyZWRpdHNQZXJIYXNoIiwic2V0QWRkcmVzcyIsInNldEF2Z0Rvd25sb2FkIiwic2V0QXZnVXBsb2FkIiwic2V0Q3VycmVudERvd25sb2FkIiwic2V0Q3VycmVudFVwbG9hZCIsInNldElzSW5jb21pbmciLCJzZXRMaXZlVGltZSIsInNldElzTG9jYWxJcCIsInNldElzTG9jYWxIb3N0IiwicGFyc2VJbnQiLCJzZXROdW1SZWNlaXZlcyIsInNldFJlY2VpdmVJZGxlVGltZSIsInNldE51bVNlbmRzIiwic2V0U2VuZElkbGVUaW1lIiwic2V0TnVtU3VwcG9ydEZsYWdzIiwic2V0VHlwZSIsImdldEhvc3QiLCJnZXRJcCIsImdldElzQmFubmVkIiwiZ2V0U2Vjb25kcyIsInJwY1N0YXR1cyIsIk1vbmVyb01pbmluZ1N0YXR1cyIsInNldElzQWN0aXZlIiwiYWN0aXZlIiwic3BlZWQiLCJzZXROdW1UaHJlYWRzIiwic2V0SXNCYWNrZ3JvdW5kIiwiaXNfYmFja2dyb3VuZF9taW5pbmdfZW5hYmxlZCIsIk1vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0Iiwic2V0QXV0b1VyaSIsInNldElzVXBkYXRlQXZhaWxhYmxlIiwic2V0VXNlclVyaSIsImdldEF1dG9VcmkiLCJnZXRVc2VyVXJpIiwiTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQiLCJzZXREb3dubG9hZFBhdGgiLCJnZXREb3dubG9hZFBhdGgiLCJoZXgiLCJkYWVtb25JZCIsIndvcmtlciIsIndyYXBwZWRMaXN0ZW5lcnMiLCJnZXRVVUlEIiwiYXNzaWduIiwiaW52b2tlV29ya2VyIiwiZ2V0V29ya2VyIiwid3JhcHBlZExpc3RlbmVyIiwiRGFlbW9uV29ya2VyTGlzdGVuZXIiLCJsaXN0ZW5lcklkIiwiZ2V0SWQiLCJhZGRXb3JrZXJDYWxsYmFjayIsImdldExpc3RlbmVyIiwicmVtb3ZlV29ya2VyQ2FsbGJhY2siLCJ2ZXJzaW9uSnNvbiIsIm51bWJlciIsImlzUmVsZWFzZSIsImZyb20iLCJhcmd1bWVudHMiLCJibG9ja0hlYWRlcnNKc29uIiwiYmxvY2tIZWFkZXJKc29uIiwiRGVzZXJpYWxpemF0aW9uVHlwZSIsIlRYIiwiZ2V0QmxvY2tzQnlIYXNoIiwiYmxvY2tIYXNoZXMiLCJibG9ja3NKc29uIiwiYmxvY2tKc29uIiwiZ2V0QmxvY2tIYXNoZXMiLCJnZXRUeFBvb2xCYWNrbG9nIiwib3V0cHV0cyIsImVudHJ5SnNvbiIsImFsdENoYWlucyIsImFsdENoYWluSnNvbiIsInBlZXJKc29uIiwiYmFuSnNvbiIsImJhbnNKc29uIiwidG9Kc29uIiwiZm5OYW1lIiwiYXJncyIsImxvb3BlciIsIlRhc2tMb29wZXIiLCJwb2xsIiwiaXNQb2xsaW5nIiwic3RhcnQiLCJsYXN0SGVhZGVyIiwiYW5ub3VuY2VCbG9ja0hlYWRlciIsImlkIiwiaGVhZGVySnNvbiIsIl9kZWZhdWx0IiwiZXhwb3J0cyIsImRlZmF1bHQiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy9kYWVtb24vTW9uZXJvRGFlbW9uUnBjLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IEdlblV0aWxzIGZyb20gXCIuLi9jb21tb24vR2VuVXRpbHNcIjtcbmltcG9ydCBMaWJyYXJ5VXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9MaWJyYXJ5VXRpbHNcIjtcbmltcG9ydCBUYXNrTG9vcGVyIGZyb20gXCIuLi9jb21tb24vVGFza0xvb3BlclwiO1xuaW1wb3J0IE1vbmVyb0FsdENoYWluIGZyb20gXCIuL21vZGVsL01vbmVyb0FsdENoYWluXCI7XG5pbXBvcnQgTW9uZXJvQmFuIGZyb20gXCIuL21vZGVsL01vbmVyb0JhblwiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrIGZyb20gXCIuL21vZGVsL01vbmVyb0Jsb2NrXCI7XG5pbXBvcnQgTW9uZXJvQmxvY2tIZWFkZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQmxvY2tIZWFkZXJcIjtcbmltcG9ydCBNb25lcm9CbG9ja1RlbXBsYXRlIGZyb20gXCIuL21vZGVsL01vbmVyb0Jsb2NrVGVtcGxhdGVcIjtcbmltcG9ydCBNb25lcm9Db25uZWN0aW9uU3BhbiBmcm9tIFwiLi9tb2RlbC9Nb25lcm9Db25uZWN0aW9uU3BhblwiO1xuaW1wb3J0IE1vbmVyb0RhZW1vbiBmcm9tIFwiLi9Nb25lcm9EYWVtb25cIjtcbmltcG9ydCBNb25lcm9EYWVtb25Db25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvRGFlbW9uQ29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uSW5mbyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9EYWVtb25JbmZvXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uTGlzdGVuZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvRGFlbW9uTGlzdGVuZXJcIjtcbmltcG9ydCBNb25lcm9EYWVtb25TeW5jSW5mbyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9EYWVtb25TeW5jSW5mb1wiO1xuaW1wb3J0IE1vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9GZWVFc3RpbWF0ZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9GZWVFc3RpbWF0ZVwiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuLi9jb21tb24vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBNb25lcm9IYXJkRm9ya0luZm8gZnJvbSBcIi4vbW9kZWwvTW9uZXJvSGFyZEZvcmtJbmZvXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2UgZnJvbSBcIi4vbW9kZWwvTW9uZXJvS2V5SW1hZ2VcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzIGZyb20gXCIuL21vZGVsL01vbmVyb0tleUltYWdlU3BlbnRTdGF0dXNcIjtcbmltcG9ydCBNb25lcm9NaW5lclR4U3VtIGZyb20gXCIuL21vZGVsL01vbmVyb01pbmVyVHhTdW1cIjtcbmltcG9ydCBNb25lcm9NaW5pbmdTdGF0dXMgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTWluaW5nU3RhdHVzXCI7XG5pbXBvcnQgTW9uZXJvTmV0d29ya1R5cGUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTmV0d29ya1R5cGVcIjtcbmltcG9ydCBNb25lcm9PdXRwdXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0XCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnlcIjtcbmltcG9ydCBNb25lcm9QZWVyIGZyb20gXCIuL21vZGVsL01vbmVyb1BlZXJcIjtcbmltcG9ydCBNb25lcm9QcnVuZVJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9QcnVuZVJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb1JwY0Nvbm5lY3Rpb24gZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9ScGNDb25uZWN0aW9uXCI7XG5pbXBvcnQgTW9uZXJvU3VibWl0VHhSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvU3VibWl0VHhSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9UeCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFwiO1xuaW1wb3J0IE1vbmVyb1R4UG9vbFN0YXRzIGZyb20gXCIuL21vZGVsL01vbmVyb1R4UG9vbFN0YXRzXCI7XG5pbXBvcnQgTW9uZXJvVXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9VdGlsc1wiO1xuaW1wb3J0IE1vbmVyb1ZlcnNpb24gZnJvbSBcIi4vbW9kZWwvTW9uZXJvVmVyc2lvblwiO1xuaW1wb3J0IHsgQ2hpbGRQcm9jZXNzIH0gZnJvbSBcImNoaWxkX3Byb2Nlc3NcIjtcblxuLyoqXG4gKiBDb3B5cmlnaHQgKGMpIHdvb2RzZXJcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbi8qKlxuICogSW1wbGVtZW50cyBhIE1vbmVyb0RhZW1vbiBhcyBhIGNsaWVudCBvZiBtb25lcm9kLlxuICovXG5jbGFzcyBNb25lcm9EYWVtb25ScGMgZXh0ZW5kcyBNb25lcm9EYWVtb24ge1xuXG4gIC8vIHN0YXRpYyB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIHN0YXRpYyByZWFkb25seSBNQVhfUkVRX1NJWkUgPSBcIjMwMDAwMDBcIjtcbiAgcHJvdGVjdGVkIHN0YXRpYyByZWFkb25seSBERUZBVUxUX0lEID0gXCIwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwXCI7IC8vIHVuaW5pdGlhbGl6ZWQgdHggb3IgYmxvY2sgaGFzaCBmcm9tIGRhZW1vbiBycGNcbiAgcHJvdGVjdGVkIHN0YXRpYyByZWFkb25seSBOVU1fSEVBREVSU19QRVJfUkVRID0gNzUwOyAvLyBudW1iZXIgb2YgaGVhZGVycyB0byBmZXRjaCBhbmQgY2FjaGUgcGVyIHJlcXVlc3RcbiAgcHJvdGVjdGVkIHN0YXRpYyByZWFkb25seSBERUZBVUxUX1BPTExfUEVSSU9EID0gMjAwMDA7IC8vIGRlZmF1bHQgaW50ZXJ2YWwgYmV0d2VlbiBwb2xsaW5nIHRoZSBkYWVtb24gaW4gbXNcblxuICAvLyBpbnN0YW5jZSB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIGNvbmZpZzogUGFydGlhbDxNb25lcm9EYWVtb25Db25maWc+O1xuICBwcm90ZWN0ZWQgbGlzdGVuZXJzOiBNb25lcm9EYWVtb25MaXN0ZW5lcltdO1xuICBwcm90ZWN0ZWQgY2FjaGVkSGVhZGVyczogYW55O1xuICBwcm90ZWN0ZWQgcHJvY2VzczogYW55O1xuICBwcm90ZWN0ZWQgcG9sbExpc3RlbmVyOiBhbnk7XG4gIHByb3RlY3RlZCBwcm94eURhZW1vbjogYW55O1xuIFxuICAvKiogQHByaXZhdGUgKi9cbiAgY29uc3RydWN0b3IoY29uZmlnOiBNb25lcm9EYWVtb25Db25maWcsIHByb3h5RGFlbW9uOiBNb25lcm9EYWVtb25ScGNQcm94eSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy5wcm94eURhZW1vbiA9IHByb3h5RGFlbW9uO1xuICAgIGlmIChjb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuO1xuICAgIHRoaXMubGlzdGVuZXJzID0gW107ICAgICAgLy8gYmxvY2sgbGlzdGVuZXJzXG4gICAgdGhpcy5jYWNoZWRIZWFkZXJzID0ge307ICAvLyBjYWNoZWQgaGVhZGVycyBmb3IgZmV0Y2hpbmcgYmxvY2tzIGluIGJvdW5kIGNodW5rc1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBpbnRlcm5hbCBwcm9jZXNzIHJ1bm5pbmcgbW9uZXJvZC5cbiAgICogXG4gICAqIEByZXR1cm4ge0NoaWxkUHJvY2Vzc30gdGhlIG5vZGUgcHJvY2VzcyBydW5uaW5nIG1vbmVyb2QsIHVuZGVmaW5lZCBpZiBub3QgY3JlYXRlZCBmcm9tIG5ldyBwcm9jZXNzXG4gICAqL1xuICBnZXRQcm9jZXNzKCk6IENoaWxkUHJvY2VzcyB7XG4gICAgcmV0dXJuIHRoaXMucHJvY2VzcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN0b3AgdGhlIGludGVybmFsIHByb2Nlc3MgcnVubmluZyBtb25lcm9kLCBpZiBhcHBsaWNhYmxlLlxuICAgKiBcbiAgICogQHBhcmFtIHtib29sZWFufSBbZm9yY2VdIHNwZWNpZmllcyBpZiB0aGUgcHJvY2VzcyBzaG91bGQgYmUgZGVzdHJveWVkIGZvcmNpYmx5IChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlciB8IHVuZGVmaW5lZD59IHRoZSBleGl0IGNvZGUgZnJvbSBzdG9wcGluZyB0aGUgcHJvY2Vzc1xuICAgKi9cbiAgYXN5bmMgc3RvcFByb2Nlc3MoZm9yY2UgPSBmYWxzZSk6IFByb21pc2U8bnVtYmVyIHwgdW5kZWZpbmVkPiB7XG4gICAgaWYgKHRoaXMucHJvY2VzcyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNb25lcm9EYWVtb25ScGMgaW5zdGFuY2Ugbm90IGNyZWF0ZWQgZnJvbSBuZXcgcHJvY2Vzc1wiKTtcbiAgICBsZXQgbGlzdGVuZXJzQ29weSA9IEdlblV0aWxzLmNvcHlBcnJheShhd2FpdCB0aGlzLmdldExpc3RlbmVycygpKTtcbiAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiBsaXN0ZW5lcnNDb3B5KSBhd2FpdCB0aGlzLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICByZXR1cm4gR2VuVXRpbHMua2lsbFByb2Nlc3ModGhpcy5wcm9jZXNzLCBmb3JjZSA/IFwiU0lHS0lMTFwiIDogdW5kZWZpbmVkKTtcbiAgfVxuICBcbiAgYXN5bmMgYWRkTGlzdGVuZXIobGlzdGVuZXI6IE1vbmVyb0RhZW1vbkxpc3RlbmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBhc3NlcnQobGlzdGVuZXIgaW5zdGFuY2VvZiBNb25lcm9EYWVtb25MaXN0ZW5lciwgXCJMaXN0ZW5lciBtdXN0IGJlIGluc3RhbmNlIG9mIE1vbmVyb0RhZW1vbkxpc3RlbmVyXCIpO1xuICAgIHRoaXMubGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuICAgIHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICB9XG4gIFxuICBhc3luYyByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcjogTW9uZXJvRGFlbW9uTGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24ucmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIGFzc2VydChsaXN0ZW5lciBpbnN0YW5jZW9mIE1vbmVyb0RhZW1vbkxpc3RlbmVyLCBcIkxpc3RlbmVyIG11c3QgYmUgaW5zdGFuY2Ugb2YgTW9uZXJvRGFlbW9uTGlzdGVuZXJcIik7XG4gICAgbGV0IGlkeCA9IHRoaXMubGlzdGVuZXJzLmluZGV4T2YobGlzdGVuZXIpO1xuICAgIGlmIChpZHggPiAtMSkgdGhpcy5saXN0ZW5lcnMuc3BsaWNlKGlkeCwgMSk7XG4gICAgZWxzZSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJMaXN0ZW5lciBpcyBub3QgcmVnaXN0ZXJlZCB3aXRoIGRhZW1vblwiKTtcbiAgICB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgfVxuICBcbiAgZ2V0TGlzdGVuZXJzKCk6IE1vbmVyb0RhZW1vbkxpc3RlbmVyW10ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRMaXN0ZW5lcnMoKTtcbiAgICByZXR1cm4gdGhpcy5saXN0ZW5lcnM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGRhZW1vbidzIFJQQyBjb25uZWN0aW9uLlxuICAgKiBcbiAgICogQHJldHVybiB7TW9uZXJvUnBjQ29ubmVjdGlvbn0gdGhlIGRhZW1vbidzIHJwYyBjb25uZWN0aW9uXG4gICAqL1xuICBhc3luYyBnZXRScGNDb25uZWN0aW9uKCkge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRScGNDb25uZWN0aW9uKCk7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmdldFNlcnZlcigpO1xuICB9XG4gIFxuICBhc3luYyBpc0Nvbm5lY3RlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uaXNDb25uZWN0ZWQoKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5nZXRWZXJzaW9uKCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGdldFZlcnNpb24oKTogUHJvbWlzZTxNb25lcm9WZXJzaW9uPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFZlcnNpb24oKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF92ZXJzaW9uXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1ZlcnNpb24ocmVzcC5yZXN1bHQudmVyc2lvbiwgcmVzcC5yZXN1bHQucmVsZWFzZSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzVHJ1c3RlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uaXNUcnVzdGVkKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJnZXRfaGVpZ2h0XCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIHJldHVybiAhcmVzcC51bnRydXN0ZWQ7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRIZWlnaHQoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9ibG9ja19jb3VudFwiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LmNvdW50O1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0hhc2goaGVpZ2h0OiBudW1iZXIpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRCbG9ja0hhc2goaGVpZ2h0KTtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcIm9uX2dldF9ibG9ja19oYXNoXCIsIFtoZWlnaHRdKSkucmVzdWx0OyAgLy8gVE9ETyBtb25lcm8td2FsbGV0LXJwYzogbm8gc3RhdHVzIHJldHVybmVkXG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrVGVtcGxhdGUod2FsbGV0QWRkcmVzczogc3RyaW5nLCByZXNlcnZlU2l6ZT86IG51bWJlcik6IFByb21pc2U8TW9uZXJvQmxvY2tUZW1wbGF0ZT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRCbG9ja1RlbXBsYXRlKHdhbGxldEFkZHJlc3MsIHJlc2VydmVTaXplKTtcbiAgICBhc3NlcnQod2FsbGV0QWRkcmVzcyAmJiB0eXBlb2Ygd2FsbGV0QWRkcmVzcyA9PT0gXCJzdHJpbmdcIiwgXCJNdXN0IHNwZWNpZnkgd2FsbGV0IGFkZHJlc3MgdG8gYmUgbWluZWQgdG9cIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmxvY2tfdGVtcGxhdGVcIiwge3dhbGxldF9hZGRyZXNzOiB3YWxsZXRBZGRyZXNzLCByZXNlcnZlX3NpemU6IHJlc2VydmVTaXplfSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Jsb2NrVGVtcGxhdGUocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBnZXRMYXN0QmxvY2tIZWFkZXIoKTogUHJvbWlzZTxNb25lcm9CbG9ja0hlYWRlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRMYXN0QmxvY2tIZWFkZXIoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9sYXN0X2Jsb2NrX2hlYWRlclwiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQmxvY2tIZWFkZXIocmVzcC5yZXN1bHQuYmxvY2tfaGVhZGVyKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tIZWFkZXJCeUhhc2goYmxvY2tIYXNoOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0Jsb2NrSGVhZGVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2NrSGVhZGVyQnlIYXNoKGJsb2NrSGFzaCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmxvY2tfaGVhZGVyX2J5X2hhc2hcIiwge2hhc2g6IGJsb2NrSGFzaH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNCbG9ja0hlYWRlcihyZXNwLnJlc3VsdC5ibG9ja19oZWFkZXIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0hlYWRlckJ5SGVpZ2h0KGhlaWdodDogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9CbG9ja0hlYWRlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRCbG9ja0hlYWRlckJ5SGVpZ2h0KGhlaWdodCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmxvY2tfaGVhZGVyX2J5X2hlaWdodFwiLCB7aGVpZ2h0OiBoZWlnaHR9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQmxvY2tIZWFkZXIocmVzcC5yZXN1bHQuYmxvY2tfaGVhZGVyKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tIZWFkZXJzQnlSYW5nZShzdGFydEhlaWdodD86IG51bWJlciwgZW5kSGVpZ2h0PzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9CbG9ja0hlYWRlcltdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2NrSGVhZGVyc0J5UmFuZ2Uoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCk7XG4gICAgXG4gICAgLy8gZmV0Y2ggYmxvY2sgaGVhZGVyc1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2Jsb2NrX2hlYWRlcnNfcmFuZ2VcIiwge1xuICAgICAgc3RhcnRfaGVpZ2h0OiBzdGFydEhlaWdodCxcbiAgICAgIGVuZF9oZWlnaHQ6IGVuZEhlaWdodFxuICAgIH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICBcbiAgICAvLyBidWlsZCBoZWFkZXJzXG4gICAgbGV0IGhlYWRlcnMgPSBbXTtcbiAgICBmb3IgKGxldCBycGNIZWFkZXIgb2YgcmVzcC5yZXN1bHQuaGVhZGVycykge1xuICAgICAgaGVhZGVycy5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQmxvY2tIZWFkZXIocnBjSGVhZGVyKSk7XG4gICAgfVxuICAgIHJldHVybiBoZWFkZXJzO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0J5SGFzaChibG9ja0hhc2g6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQmxvY2s+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tCeUhhc2goYmxvY2tIYXNoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9ibG9ja1wiLCB7aGFzaDogYmxvY2tIYXNofSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Jsb2NrKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tCeUhlaWdodChoZWlnaHQ6IG51bWJlcik6IFByb21pc2U8TW9uZXJvQmxvY2s+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tCeUhlaWdodChoZWlnaHQpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2Jsb2NrXCIsIHtoZWlnaHQ6IGhlaWdodH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNCbG9jayhyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2Nrc0J5SGVpZ2h0KGhlaWdodHM6IG51bWJlcltdKTogUHJvbWlzZTxNb25lcm9CbG9ja1tdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2Nrc0J5SGVpZ2h0KGhlaWdodHMpO1xuICAgIFxuICAgIC8vIGZldGNoIGJsb2NrcyBpbiBiaW5hcnlcbiAgICBsZXQgcmVzcEJpbiA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRCaW5hcnlSZXF1ZXN0KFwiZ2V0X2Jsb2Nrc19ieV9oZWlnaHQuYmluXCIsIHtoZWlnaHRzOiBoZWlnaHRzfSk7XG4gICAgXG4gICAgLy8gY29udmVydCBiaW5hcnkgYmxvY2tzIHRvIGpzb25cbiAgICBsZXQgcnBjQmxvY2tzID0gYXdhaXQgTW9uZXJvVXRpbHMuYmluYXJ5QmxvY2tzVG9Kc29uKHJlc3BCaW4pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJwY0Jsb2Nrcyk7XG4gICAgXG4gICAgLy8gYnVpbGQgYmxvY2tzIHdpdGggdHJhbnNhY3Rpb25zXG4gICAgYXNzZXJ0LmVxdWFsKHJwY0Jsb2Nrcy50eHMubGVuZ3RoLCBycGNCbG9ja3MuYmxvY2tzLmxlbmd0aCk7ICAgIFxuICAgIGxldCBibG9ja3MgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0lkeCA9IDA7IGJsb2NrSWR4IDwgcnBjQmxvY2tzLmJsb2Nrcy5sZW5ndGg7IGJsb2NrSWR4KyspIHtcbiAgICAgIFxuICAgICAgLy8gYnVpbGQgYmxvY2tcbiAgICAgIGxldCBibG9jayA9IE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQmxvY2socnBjQmxvY2tzLmJsb2Nrc1tibG9ja0lkeF0pO1xuICAgICAgYmxvY2suc2V0SGVpZ2h0KGhlaWdodHNbYmxvY2tJZHhdKTtcbiAgICAgIGJsb2Nrcy5wdXNoKGJsb2NrKTtcbiAgICAgIFxuICAgICAgLy8gYnVpbGQgdHJhbnNhY3Rpb25zXG4gICAgICBsZXQgdHhzID0gW107XG4gICAgICBmb3IgKGxldCB0eElkeCA9IDA7IHR4SWR4IDwgcnBjQmxvY2tzLnR4c1tibG9ja0lkeF0ubGVuZ3RoOyB0eElkeCsrKSB7XG4gICAgICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeCgpO1xuICAgICAgICB0eHMucHVzaCh0eCk7XG4gICAgICAgIHR4LnNldEhhc2gocnBjQmxvY2tzLmJsb2Nrc1tibG9ja0lkeF0udHhfaGFzaGVzW3R4SWR4XSk7XG4gICAgICAgIHR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgICAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgICAgdHguc2V0SXNEb3VibGVTcGVuZFNlZW4oZmFsc2UpO1xuICAgICAgICBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1R4KHJwY0Jsb2Nrcy50eHNbYmxvY2tJZHhdW3R4SWR4XSwgdHgpO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBtZXJnZSBpbnRvIG9uZSBibG9ja1xuICAgICAgYmxvY2suc2V0VHhzKFtdKTtcbiAgICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgICBpZiAodHguZ2V0QmxvY2soKSkgYmxvY2subWVyZ2UodHguZ2V0QmxvY2soKSk7XG4gICAgICAgIGVsc2UgYmxvY2suZ2V0VHhzKCkucHVzaCh0eC5zZXRCbG9jayhibG9jaykpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gYmxvY2tzO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja3NCeVJhbmdlKHN0YXJ0SGVpZ2h0PzogbnVtYmVyLCBlbmRIZWlnaHQ/OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb0Jsb2NrW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tzQnlSYW5nZShzdGFydEhlaWdodCwgZW5kSGVpZ2h0KTtcbiAgICBpZiAoc3RhcnRIZWlnaHQgPT09IHVuZGVmaW5lZCkgc3RhcnRIZWlnaHQgPSAwO1xuICAgIGlmIChlbmRIZWlnaHQgPT09IHVuZGVmaW5lZCkgZW5kSGVpZ2h0ID0gYXdhaXQgdGhpcy5nZXRIZWlnaHQoKSAtIDE7XG4gICAgbGV0IGhlaWdodHMgPSBbXTtcbiAgICBmb3IgKGxldCBoZWlnaHQgPSBzdGFydEhlaWdodDsgaGVpZ2h0IDw9IGVuZEhlaWdodDsgaGVpZ2h0KyspIGhlaWdodHMucHVzaChoZWlnaHQpO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmdldEJsb2Nrc0J5SGVpZ2h0KGhlaWdodHMpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja3NCeVJhbmdlQ2h1bmtlZChzdGFydEhlaWdodD86IG51bWJlciwgZW5kSGVpZ2h0PzogbnVtYmVyLCBtYXhDaHVua1NpemU/OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb0Jsb2NrW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tzQnlSYW5nZUNodW5rZWQoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgbWF4Q2h1bmtTaXplKTtcbiAgICBpZiAoc3RhcnRIZWlnaHQgPT09IHVuZGVmaW5lZCkgc3RhcnRIZWlnaHQgPSAwO1xuICAgIGlmIChlbmRIZWlnaHQgPT09IHVuZGVmaW5lZCkgZW5kSGVpZ2h0ID0gYXdhaXQgdGhpcy5nZXRIZWlnaHQoKSAtIDE7XG4gICAgbGV0IGxhc3RIZWlnaHQgPSBzdGFydEhlaWdodCAtIDE7XG4gICAgbGV0IGJsb2NrcyA9IFtdO1xuICAgIHdoaWxlIChsYXN0SGVpZ2h0IDwgZW5kSGVpZ2h0KSB7XG4gICAgICBmb3IgKGxldCBibG9jayBvZiBhd2FpdCB0aGlzLmdldE1heEJsb2NrcyhsYXN0SGVpZ2h0ICsgMSwgZW5kSGVpZ2h0LCBtYXhDaHVua1NpemUpKSB7XG4gICAgICAgIGJsb2Nrcy5wdXNoKGJsb2NrKTtcbiAgICAgIH1cbiAgICAgIGxhc3RIZWlnaHQgPSBibG9ja3NbYmxvY2tzLmxlbmd0aCAtIDFdLmdldEhlaWdodCgpO1xuICAgIH1cbiAgICByZXR1cm4gYmxvY2tzO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeHModHhIYXNoZXM6IHN0cmluZ1tdLCBwcnVuZSA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9UeFtdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFR4cyh0eEhhc2hlcywgcHJ1bmUpO1xuICAgICAgICBcbiAgICAvLyB2YWxpZGF0ZSBpbnB1dFxuICAgIGFzc2VydChBcnJheS5pc0FycmF5KHR4SGFzaGVzKSAmJiB0eEhhc2hlcy5sZW5ndGggPiAwLCBcIk11c3QgcHJvdmlkZSBhbiBhcnJheSBvZiB0cmFuc2FjdGlvbiBoYXNoZXNcIik7XG4gICAgYXNzZXJ0KHBydW5lID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIHBydW5lID09PSBcImJvb2xlYW5cIiwgXCJQcnVuZSBtdXN0IGJlIGEgYm9vbGVhbiBvciB1bmRlZmluZWRcIik7XG4gICAgICAgIFxuICAgIC8vIGZldGNoIHRyYW5zYWN0aW9uc1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwiZ2V0X3RyYW5zYWN0aW9uc1wiLCB7XG4gICAgICB0eHNfaGFzaGVzOiB0eEhhc2hlcyxcbiAgICAgIGRlY29kZV9hc19qc29uOiB0cnVlLFxuICAgICAgcHJ1bmU6IHBydW5lXG4gICAgfSk7XG4gICAgdHJ5IHtcbiAgICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUubWVzc2FnZS5pbmRleE9mKFwiRmFpbGVkIHRvIHBhcnNlIGhleCByZXByZXNlbnRhdGlvbiBvZiB0cmFuc2FjdGlvbiBoYXNoXCIpID49IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkludmFsaWQgdHJhbnNhY3Rpb24gaGFzaFwiKTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICAgICAgICBcbiAgICAvLyBidWlsZCB0cmFuc2FjdGlvbiBtb2RlbHNcbiAgICBsZXQgdHhzID0gW107XG4gICAgaWYgKHJlc3AudHhzKSB7XG4gICAgICBmb3IgKGxldCB0eElkeCA9IDA7IHR4SWR4IDwgcmVzcC50eHMubGVuZ3RoOyB0eElkeCsrKSB7XG4gICAgICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeCgpO1xuICAgICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgICAgICB0eHMucHVzaChNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1R4KHJlc3AudHhzW3R4SWR4XSwgdHgpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHR4cztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhIZXhlcyh0eEhhc2hlczogc3RyaW5nW10sIHBydW5lID0gZmFsc2UpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFR4SGV4ZXModHhIYXNoZXMsIHBydW5lKTtcbiAgICBsZXQgaGV4ZXMgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiBhd2FpdCB0aGlzLmdldFR4cyh0eEhhc2hlcywgcHJ1bmUpKSBoZXhlcy5wdXNoKHBydW5lID8gdHguZ2V0UHJ1bmVkSGV4KCkgOiB0eC5nZXRGdWxsSGV4KCkpO1xuICAgIHJldHVybiBoZXhlcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TWluZXJUeFN1bShoZWlnaHQ6IG51bWJlciwgbnVtQmxvY2tzOiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb01pbmVyVHhTdW0+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0TWluZXJUeFN1bShoZWlnaHQsIG51bUJsb2Nrcyk7XG4gICAgaWYgKGhlaWdodCA9PT0gdW5kZWZpbmVkKSBoZWlnaHQgPSAwO1xuICAgIGVsc2UgYXNzZXJ0KGhlaWdodCA+PSAwLCBcIkhlaWdodCBtdXN0IGJlIGFuIGludGVnZXIgPj0gMFwiKTtcbiAgICBpZiAobnVtQmxvY2tzID09PSB1bmRlZmluZWQpIG51bUJsb2NrcyA9IGF3YWl0IHRoaXMuZ2V0SGVpZ2h0KCk7XG4gICAgZWxzZSBhc3NlcnQobnVtQmxvY2tzID49IDAsIFwiQ291bnQgbXVzdCBiZSBhbiBpbnRlZ2VyID49IDBcIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfY29pbmJhc2VfdHhfc3VtXCIsIHtoZWlnaHQ6IGhlaWdodCwgY291bnQ6IG51bUJsb2Nrc30pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICBsZXQgdHhTdW0gPSBuZXcgTW9uZXJvTWluZXJUeFN1bSgpO1xuICAgIHR4U3VtLnNldEVtaXNzaW9uU3VtKEJpZ0ludChyZXNwLnJlc3VsdC5lbWlzc2lvbl9hbW91bnQpKTtcbiAgICB0eFN1bS5zZXRGZWVTdW0oQmlnSW50KHJlc3AucmVzdWx0LmZlZV9hbW91bnQpKTtcbiAgICByZXR1cm4gdHhTdW07XG4gIH1cbiAgXG4gIGFzeW5jIGdldEZlZUVzdGltYXRlKGdyYWNlQmxvY2tzPzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9GZWVFc3RpbWF0ZT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRGZWVFc3RpbWF0ZShncmFjZUJsb2Nrcyk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfZmVlX2VzdGltYXRlXCIsIHtncmFjZV9ibG9ja3M6IGdyYWNlQmxvY2tzfSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIGxldCBmZWVFc3RpbWF0ZSA9IG5ldyBNb25lcm9GZWVFc3RpbWF0ZSgpO1xuICAgIGZlZUVzdGltYXRlLnNldEZlZShCaWdJbnQocmVzcC5yZXN1bHQuZmVlKSk7XG4gICAgbGV0IGZlZXMgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlc3AucmVzdWx0LmZlZXMubGVuZ3RoOyBpKyspIGZlZXMucHVzaChCaWdJbnQocmVzcC5yZXN1bHQuZmVlc1tpXSkpO1xuICAgIGZlZUVzdGltYXRlLnNldEZlZXMoZmVlcyk7XG4gICAgZmVlRXN0aW1hdGUuc2V0UXVhbnRpemF0aW9uTWFzayhCaWdJbnQocmVzcC5yZXN1bHQucXVhbnRpemF0aW9uX21hc2spKTtcbiAgICByZXR1cm4gZmVlRXN0aW1hdGU7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdFR4SGV4KHR4SGV4OiBzdHJpbmcsIGRvTm90UmVsYXk6IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb1N1Ym1pdFR4UmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnN1Ym1pdFR4SGV4KHR4SGV4LCBkb05vdFJlbGF5KTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcInNlbmRfcmF3X3RyYW5zYWN0aW9uXCIsIHt0eF9hc19oZXg6IHR4SGV4LCBkb19ub3RfcmVsYXk6IGRvTm90UmVsYXl9KTtcbiAgICBsZXQgcmVzdWx0ID0gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNTdWJtaXRUeFJlc3VsdChyZXNwKTtcbiAgICBcbiAgICAvLyBzZXQgaXNHb29kIGJhc2VkIG9uIHN0YXR1c1xuICAgIHRyeSB7XG4gICAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTsgXG4gICAgICByZXN1bHQuc2V0SXNHb29kKHRydWUpO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgcmVzdWx0LnNldElzR29vZChmYWxzZSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbGF5VHhzQnlIYXNoKHR4SGFzaGVzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5yZWxheVR4c0J5SGFzaCh0eEhhc2hlcyk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJyZWxheV90eFwiLCB7dHhpZHM6IHR4SGFzaGVzfSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFBvb2woKTogUHJvbWlzZTxNb25lcm9UeFtdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFR4UG9vbCgpO1xuICAgIFxuICAgIC8vIHNlbmQgcnBjIHJlcXVlc3RcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImdldF90cmFuc2FjdGlvbl9wb29sXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIFxuICAgIC8vIGJ1aWxkIHR4c1xuICAgIGxldCB0eHMgPSBbXTtcbiAgICBpZiAocmVzcC50cmFuc2FjdGlvbnMpIHtcbiAgICAgIGZvciAobGV0IHJwY1R4IG9mIHJlc3AudHJhbnNhY3Rpb25zKSB7XG4gICAgICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeCgpO1xuICAgICAgICB0eHMucHVzaCh0eCk7XG4gICAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICAgICAgdHguc2V0SW5UeFBvb2wodHJ1ZSk7XG4gICAgICAgIHR4LnNldE51bUNvbmZpcm1hdGlvbnMoMCk7XG4gICAgICAgIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVHgocnBjVHgsIHR4KTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHR4cztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhQb29sSGFzaGVzKCk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIC8vIGFzeW5jIGdldFR4UG9vbEJhY2tsb2coKTogUHJvbWlzZTxNb25lcm9UeEJhY2tsb2dFbnRyeVtdPiB7XG4gIC8vICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICAvLyB9XG5cbiAgYXN5bmMgZ2V0VHhQb29sU3RhdHMoKTogUHJvbWlzZTxNb25lcm9UeFBvb2xTdGF0cz4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRUeFBvb2xTdGF0cygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwiZ2V0X3RyYW5zYWN0aW9uX3Bvb2xfc3RhdHNcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVHhQb29sU3RhdHMocmVzcC5wb29sX3N0YXRzKTtcbiAgfVxuICBcbiAgYXN5bmMgZmx1c2hUeFBvb2woaGFzaGVzPzogc3RyaW5nIHwgc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZmx1c2hUeFBvb2woaGFzaGVzKTtcbiAgICBpZiAoaGFzaGVzKSBoYXNoZXMgPSBHZW5VdGlscy5saXN0aWZ5KGhhc2hlcyk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJmbHVzaF90eHBvb2xcIiwge3R4aWRzOiBoYXNoZXN9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEtleUltYWdlU3BlbnRTdGF0dXNlcyhrZXlJbWFnZXM6IHN0cmluZ1tdKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzKGtleUltYWdlcyk7XG4gICAgaWYgKGtleUltYWdlcyA9PT0gdW5kZWZpbmVkIHx8IGtleUltYWdlcy5sZW5ndGggPT09IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBrZXkgaW1hZ2VzIHRvIGNoZWNrIHRoZSBzdGF0dXMgb2ZcIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJpc19rZXlfaW1hZ2Vfc3BlbnRcIiwge2tleV9pbWFnZXM6IGtleUltYWdlc30pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIHJldHVybiByZXNwLnNwZW50X3N0YXR1cztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0T3V0cHV0SGlzdG9ncmFtKGFtb3VudHM/OiBiaWdpbnRbXSwgbWluQ291bnQ/OiBudW1iZXIsIG1heENvdW50PzogbnVtYmVyLCBpc1VubG9ja2VkPzogYm9vbGVhbiwgcmVjZW50Q3V0b2ZmPzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeVtdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldE91dHB1dEhpc3RvZ3JhbShhbW91bnRzLCBtaW5Db3VudCwgbWF4Q291bnQsIGlzVW5sb2NrZWQsIHJlY2VudEN1dG9mZik7XG4gICAgXG4gICAgLy8gc2VuZCBycGMgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X291dHB1dF9oaXN0b2dyYW1cIiwge1xuICAgICAgYW1vdW50czogYW1vdW50cyxcbiAgICAgIG1pbl9jb3VudDogbWluQ291bnQsXG4gICAgICBtYXhfY291bnQ6IG1heENvdW50LFxuICAgICAgdW5sb2NrZWQ6IGlzVW5sb2NrZWQsXG4gICAgICByZWNlbnRfY3V0b2ZmOiByZWNlbnRDdXRvZmZcbiAgICB9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgXG4gICAgLy8gYnVpbGQgaGlzdG9ncmFtIGVudHJpZXMgZnJvbSByZXNwb25zZVxuICAgIGxldCBlbnRyaWVzID0gW107XG4gICAgaWYgKCFyZXNwLnJlc3VsdC5oaXN0b2dyYW0pIHJldHVybiBlbnRyaWVzO1xuICAgIGZvciAobGV0IHJwY0VudHJ5IG9mIHJlc3AucmVzdWx0Lmhpc3RvZ3JhbSkge1xuICAgICAgZW50cmllcy5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjT3V0cHV0SGlzdG9ncmFtRW50cnkocnBjRW50cnkpKTtcbiAgICB9XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dERpc3RyaWJ1dGlvbihhbW91bnRzLCBjdW11bGF0aXZlLCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldE91dHB1dERpc3RyaWJ1dGlvbihhbW91bnRzLCBjdW11bGF0aXZlLCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0KTtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQgKHJlc3BvbnNlICdkaXN0cmlidXRpb24nIGZpZWxkIGlzIGJpbmFyeSlcIik7XG4gICAgXG4vLyAgICBsZXQgYW1vdW50U3RycyA9IFtdO1xuLy8gICAgZm9yIChsZXQgYW1vdW50IG9mIGFtb3VudHMpIGFtb3VudFN0cnMucHVzaChhbW91bnQudG9KU1ZhbHVlKCkpO1xuLy8gICAgY29uc29sZS5sb2coYW1vdW50U3Rycyk7XG4vLyAgICBjb25zb2xlLmxvZyhjdW11bGF0aXZlKTtcbi8vICAgIGNvbnNvbGUubG9nKHN0YXJ0SGVpZ2h0KTtcbi8vICAgIGNvbnNvbGUubG9nKGVuZEhlaWdodCk7XG4vLyAgICBcbi8vICAgIC8vIHNlbmQgcnBjIHJlcXVlc3Rcbi8vICAgIGNvbnNvbGUubG9nKFwiKioqKioqKioqKiogU0VORElORyBSRVFVRVNUICoqKioqKioqKioqKipcIik7XG4vLyAgICBpZiAoc3RhcnRIZWlnaHQgPT09IHVuZGVmaW5lZCkgc3RhcnRIZWlnaHQgPSAwO1xuLy8gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfb3V0cHV0X2Rpc3RyaWJ1dGlvblwiLCB7XG4vLyAgICAgIGFtb3VudHM6IGFtb3VudFN0cnMsXG4vLyAgICAgIGN1bXVsYXRpdmU6IGN1bXVsYXRpdmUsXG4vLyAgICAgIGZyb21faGVpZ2h0OiBzdGFydEhlaWdodCxcbi8vICAgICAgdG9faGVpZ2h0OiBlbmRIZWlnaHRcbi8vICAgIH0pO1xuLy8gICAgXG4vLyAgICBjb25zb2xlLmxvZyhcIlJFU1BPTlNFXCIpO1xuLy8gICAgY29uc29sZS5sb2cocmVzcCk7XG4vLyAgICBcbi8vICAgIC8vIGJ1aWxkIGRpc3RyaWJ1dGlvbiBlbnRyaWVzIGZyb20gcmVzcG9uc2Vcbi8vICAgIGxldCBlbnRyaWVzID0gW107XG4vLyAgICBpZiAoIXJlc3AucmVzdWx0LmRpc3RyaWJ1dGlvbnMpIHJldHVybiBlbnRyaWVzOyBcbi8vICAgIGZvciAobGV0IHJwY0VudHJ5IG9mIHJlc3AucmVzdWx0LmRpc3RyaWJ1dGlvbnMpIHtcbi8vICAgICAgbGV0IGVudHJ5ID0gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNPdXRwdXREaXN0cmlidXRpb25FbnRyeShycGNFbnRyeSk7XG4vLyAgICAgIGVudHJpZXMucHVzaChlbnRyeSk7XG4vLyAgICB9XG4vLyAgICByZXR1cm4gZW50cmllcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SW5mbygpOiBQcm9taXNlPE1vbmVyb0RhZW1vbkluZm8+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0SW5mbygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2luZm9cIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0luZm8ocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBnZXRTeW5jSW5mbygpOiBQcm9taXNlPE1vbmVyb0RhZW1vblN5bmNJbmZvPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFN5bmNJbmZvKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzeW5jX2luZm9cIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1N5bmNJbmZvKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGFyZEZvcmtJbmZvKCk6IFByb21pc2U8TW9uZXJvSGFyZEZvcmtJbmZvPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEhhcmRGb3JrSW5mbygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiaGFyZF9mb3JrX2luZm9cIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0hhcmRGb3JrSW5mbyhyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFsdENoYWlucygpOiBQcm9taXNlPE1vbmVyb0FsdENoYWluW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QWx0Q2hhaW5zKCk7XG4gICAgXG4vLyAgICAvLyBtb2NrZWQgcmVzcG9uc2UgZm9yIHRlc3Rcbi8vICAgIGxldCByZXNwID0ge1xuLy8gICAgICAgIHN0YXR1czogXCJPS1wiLFxuLy8gICAgICAgIGNoYWluczogW1xuLy8gICAgICAgICAge1xuLy8gICAgICAgICAgICBibG9ja19oYXNoOiBcIjY5N2NmMDNjODlhOWIxMThmN2JkZjExYjFiM2E2YTAyOGQ3YjM2MTdkMmQwZWQ5MTMyMmM1NzA5YWNmNzU2MjVcIixcbi8vICAgICAgICAgICAgZGlmZmljdWx0eTogMTQxMTQ3Mjk2MzgzMDAyODAsXG4vLyAgICAgICAgICAgIGhlaWdodDogMTU2MjA2Mixcbi8vICAgICAgICAgICAgbGVuZ3RoOiAyXG4vLyAgICAgICAgICB9XG4vLyAgICAgICAgXVxuLy8gICAgfVxuICAgIFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FsdGVybmF0ZV9jaGFpbnNcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIGxldCBjaGFpbnMgPSBbXTtcbiAgICBpZiAoIXJlc3AucmVzdWx0LmNoYWlucykgcmV0dXJuIGNoYWlucztcbiAgICBmb3IgKGxldCBycGNDaGFpbiBvZiByZXNwLnJlc3VsdC5jaGFpbnMpIGNoYWlucy5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQWx0Q2hhaW4ocnBjQ2hhaW4pKTtcbiAgICByZXR1cm4gY2hhaW5zO1xuICB9XG4gIFxuICBhc3luYyBnZXRBbHRCbG9ja0hhc2hlcygpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEFsdEJsb2NrSGFzaGVzKCk7XG4gICAgXG4vLyAgICAvLyBtb2NrZWQgcmVzcG9uc2UgZm9yIHRlc3Rcbi8vICAgIGxldCByZXNwID0ge1xuLy8gICAgICAgIHN0YXR1czogXCJPS1wiLFxuLy8gICAgICAgIHVudHJ1c3RlZDogZmFsc2UsXG4vLyAgICAgICAgYmxrc19oYXNoZXM6IFtcIjljMjI3N2M1NDcwMjM0YmU4YjMyMzgyY2RmODA5NGExMDNhYmE0ZmNkNWU4NzVhNmZjMTU5ZGMyZWMwMGUwMTFcIixcIjYzN2MwZTBmMDU1OGUyODQ0OTNmMzhhNWZjY2EzNjE1ZGI1OTQ1OGQ5MGQzYTVlZmYwYTE4ZmY1OWI4M2Y0NmZcIixcIjZmM2FkYzE3NGEyZTgwODI4MTllYmI5NjVjOTZhMDk1ZTNlOGI2MzkyOWFkOWJlMmQ3MDVhZDljMDg2YTZiMWNcIixcIjY5N2NmMDNjODlhOWIxMThmN2JkZjExYjFiM2E2YTAyOGQ3YjM2MTdkMmQwZWQ5MTMyMmM1NzA5YWNmNzU2MjVcIl1cbi8vICAgIH1cbiAgICBcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImdldF9hbHRfYmxvY2tzX2hhc2hlc1wiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICBpZiAoIXJlc3AuYmxrc19oYXNoZXMpIHJldHVybiBbXTtcbiAgICByZXR1cm4gcmVzcC5ibGtzX2hhc2hlcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RG93bmxvYWRMaW1pdCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXREb3dubG9hZExpbWl0KCk7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldEJhbmR3aWR0aExpbWl0cygpKVswXTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0RG93bmxvYWRMaW1pdChsaW1pdDogbnVtYmVyKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc2V0RG93bmxvYWRMaW1pdChsaW1pdCk7XG4gICAgaWYgKGxpbWl0ID09IC0xKSByZXR1cm4gYXdhaXQgdGhpcy5yZXNldERvd25sb2FkTGltaXQoKTtcbiAgICBpZiAoIShHZW5VdGlscy5pc0ludChsaW1pdCkgJiYgbGltaXQgPiAwKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiRG93bmxvYWQgbGltaXQgbXVzdCBiZSBhbiBpbnRlZ2VyIGdyZWF0ZXIgdGhhbiAwXCIpO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5zZXRCYW5kd2lkdGhMaW1pdHMobGltaXQsIDApKVswXTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzZXREb3dubG9hZExpbWl0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnJlc2V0RG93bmxvYWRMaW1pdCgpO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5zZXRCYW5kd2lkdGhMaW1pdHMoLTEsIDApKVswXTtcbiAgfVxuXG4gIGFzeW5jIGdldFVwbG9hZExpbWl0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFVwbG9hZExpbWl0KCk7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldEJhbmR3aWR0aExpbWl0cygpKVsxXTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0VXBsb2FkTGltaXQobGltaXQ6IG51bWJlcik6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnNldFVwbG9hZExpbWl0KGxpbWl0KTtcbiAgICBpZiAobGltaXQgPT0gLTEpIHJldHVybiBhd2FpdCB0aGlzLnJlc2V0VXBsb2FkTGltaXQoKTtcbiAgICBpZiAoIShHZW5VdGlscy5pc0ludChsaW1pdCkgJiYgbGltaXQgPiAwKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiVXBsb2FkIGxpbWl0IG11c3QgYmUgYW4gaW50ZWdlciBncmVhdGVyIHRoYW4gMFwiKTtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuc2V0QmFuZHdpZHRoTGltaXRzKDAsIGxpbWl0KSlbMV07XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2V0VXBsb2FkTGltaXQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24ucmVzZXRVcGxvYWRMaW1pdCgpO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5zZXRCYW5kd2lkdGhMaW1pdHMoMCwgLTEpKVsxXTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGVlcnMoKTogUHJvbWlzZTxNb25lcm9QZWVyW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0UGVlcnMoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9jb25uZWN0aW9uc1wiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgbGV0IHBlZXJzID0gW107XG4gICAgaWYgKCFyZXNwLnJlc3VsdC5jb25uZWN0aW9ucykgcmV0dXJuIHBlZXJzO1xuICAgIGZvciAobGV0IHJwY0Nvbm5lY3Rpb24gb2YgcmVzcC5yZXN1bHQuY29ubmVjdGlvbnMpIHtcbiAgICAgIHBlZXJzLnB1c2goTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNDb25uZWN0aW9uKHJwY0Nvbm5lY3Rpb24pKTtcbiAgICB9XG4gICAgcmV0dXJuIHBlZXJzO1xuICB9XG4gIFxuICBhc3luYyBnZXRLbm93blBlZXJzKCk6IFByb21pc2U8TW9uZXJvUGVlcltdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEtub3duUGVlcnMoKTtcbiAgICBcbiAgICAvLyB0eCBjb25maWdcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImdldF9wZWVyX2xpc3RcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgXG4gICAgLy8gYnVpbGQgcGVlcnNcbiAgICBsZXQgcGVlcnMgPSBbXTtcbiAgICBpZiAocmVzcC5ncmF5X2xpc3QpIHtcbiAgICAgIGZvciAobGV0IHJwY1BlZXIgb2YgcmVzcC5ncmF5X2xpc3QpIHtcbiAgICAgICAgbGV0IHBlZXIgPSBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1BlZXIocnBjUGVlcik7XG4gICAgICAgIHBlZXIuc2V0SXNPbmxpbmUoZmFsc2UpOyAvLyBncmF5IGxpc3QgbWVhbnMgb2ZmbGluZSBsYXN0IGNoZWNrZWRcbiAgICAgICAgcGVlcnMucHVzaChwZWVyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHJlc3Aud2hpdGVfbGlzdCkge1xuICAgICAgZm9yIChsZXQgcnBjUGVlciBvZiByZXNwLndoaXRlX2xpc3QpIHtcbiAgICAgICAgbGV0IHBlZXIgPSBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1BlZXIocnBjUGVlcik7XG4gICAgICAgIHBlZXIuc2V0SXNPbmxpbmUodHJ1ZSk7IC8vIHdoaXRlIGxpc3QgbWVhbnMgb25saW5lIGxhc3QgY2hlY2tlZFxuICAgICAgICBwZWVycy5wdXNoKHBlZXIpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcGVlcnM7XG4gIH1cbiAgXG4gIGFzeW5jIHNldE91dGdvaW5nUGVlckxpbWl0KGxpbWl0OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc2V0T3V0Z29pbmdQZWVyTGltaXQobGltaXQpO1xuICAgIGlmICghKEdlblV0aWxzLmlzSW50KGxpbWl0KSAmJiBsaW1pdCA+PSAwKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiT3V0Z29pbmcgcGVlciBsaW1pdCBtdXN0IGJlID49IDBcIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJvdXRfcGVlcnNcIiwge291dF9wZWVyczogbGltaXR9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0SW5jb21pbmdQZWVyTGltaXQobGltaXQ6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5zZXRJbmNvbWluZ1BlZXJMaW1pdChsaW1pdCk7XG4gICAgaWYgKCEoR2VuVXRpbHMuaXNJbnQobGltaXQpICYmIGxpbWl0ID49IDApKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJJbmNvbWluZyBwZWVyIGxpbWl0IG11c3QgYmUgPj0gMFwiKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImluX3BlZXJzXCIsIHtpbl9wZWVyczogbGltaXR9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGVlckJhbnMoKTogUHJvbWlzZTxNb25lcm9CYW5bXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRQZWVyQmFucygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2JhbnNcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIGxldCBiYW5zID0gW107XG4gICAgZm9yIChsZXQgcnBjQmFuIG9mIHJlc3AucmVzdWx0LmJhbnMpIHtcbiAgICAgIGxldCBiYW4gPSBuZXcgTW9uZXJvQmFuKCk7XG4gICAgICBiYW4uc2V0SG9zdChycGNCYW4uaG9zdCk7XG4gICAgICBiYW4uc2V0SXAocnBjQmFuLmlwKTtcbiAgICAgIGJhbi5zZXRTZWNvbmRzKHJwY0Jhbi5zZWNvbmRzKTtcbiAgICAgIGJhbnMucHVzaChiYW4pO1xuICAgIH1cbiAgICByZXR1cm4gYmFucztcbiAgfVxuICBcbiAgYXN5bmMgc2V0UGVlckJhbnMoYmFuczogTW9uZXJvQmFuW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc2V0UGVlckJhbnMoYmFucyk7XG4gICAgbGV0IHJwY0JhbnMgPSBbXTtcbiAgICBmb3IgKGxldCBiYW4gb2YgYmFucykgcnBjQmFucy5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0VG9ScGNCYW4oYmFuKSk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzZXRfYmFuc1wiLCB7YmFuczogcnBjQmFuc30pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgc3RhcnRNaW5pbmcoYWRkcmVzczogc3RyaW5nLCBudW1UaHJlYWRzPzogbnVtYmVyLCBpc0JhY2tncm91bmQ/OiBib29sZWFuLCBpZ25vcmVCYXR0ZXJ5PzogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5zdGFydE1pbmluZyhhZGRyZXNzLCBudW1UaHJlYWRzLCBpc0JhY2tncm91bmQsIGlnbm9yZUJhdHRlcnkpO1xuICAgIGFzc2VydChhZGRyZXNzLCBcIk11c3QgcHJvdmlkZSBhZGRyZXNzIHRvIG1pbmUgdG9cIik7XG4gICAgYXNzZXJ0KEdlblV0aWxzLmlzSW50KG51bVRocmVhZHMpICYmIG51bVRocmVhZHMgPiAwLCBcIk51bWJlciBvZiB0aHJlYWRzIG11c3QgYmUgYW4gaW50ZWdlciBncmVhdGVyIHRoYW4gMFwiKTtcbiAgICBhc3NlcnQoaXNCYWNrZ3JvdW5kID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIGlzQmFja2dyb3VuZCA9PT0gXCJib29sZWFuXCIpO1xuICAgIGFzc2VydChpZ25vcmVCYXR0ZXJ5ID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIGlnbm9yZUJhdHRlcnkgPT09IFwiYm9vbGVhblwiKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcInN0YXJ0X21pbmluZ1wiLCB7XG4gICAgICBtaW5lcl9hZGRyZXNzOiBhZGRyZXNzLFxuICAgICAgdGhyZWFkc19jb3VudDogbnVtVGhyZWFkcyxcbiAgICAgIGRvX2JhY2tncm91bmRfbWluaW5nOiBpc0JhY2tncm91bmQsXG4gICAgICBpZ25vcmVfYmF0dGVyeTogaWdub3JlQmF0dGVyeSxcbiAgICB9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgc3RvcE1pbmluZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc3RvcE1pbmluZygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwic3RvcF9taW5pbmdcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE1pbmluZ1N0YXR1cygpOiBQcm9taXNlPE1vbmVyb01pbmluZ1N0YXR1cz4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRNaW5pbmdTdGF0dXMoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcIm1pbmluZ19zdGF0dXNcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjTWluaW5nU3RhdHVzKHJlc3ApO1xuICB9XG4gIFxuICBhc3luYyBzdWJtaXRCbG9ja3MoYmxvY2tCbG9iczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc3VibWl0QmxvY2tzKCk7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkoYmxvY2tCbG9icykgJiYgYmxvY2tCbG9icy5sZW5ndGggPiAwLCBcIk11c3QgcHJvdmlkZSBhbiBhcnJheSBvZiBtaW5lZCBibG9jayBibG9icyB0byBzdWJtaXRcIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdWJtaXRfYmxvY2tcIiwgYmxvY2tCbG9icyk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICB9XG5cbiAgYXN5bmMgcHJ1bmVCbG9ja2NoYWluKGNoZWNrOiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9QcnVuZVJlc3VsdD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5wcnVuZUJsb2NrY2hhaW4oKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInBydW5lX2Jsb2NrY2hhaW5cIiwge2NoZWNrOiBjaGVja30sIDApO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICBsZXQgcmVzdWx0ID0gbmV3IE1vbmVyb1BydW5lUmVzdWx0KCk7XG4gICAgcmVzdWx0LnNldElzUHJ1bmVkKHJlc3AucmVzdWx0LnBydW5lZCk7XG4gICAgcmVzdWx0LnNldFBydW5pbmdTZWVkKHJlc3AucmVzdWx0LnBydW5pbmdfc2VlZCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tGb3JVcGRhdGUoKTogUHJvbWlzZTxNb25lcm9EYWVtb25VcGRhdGVDaGVja1Jlc3VsdD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5jaGVja0ZvclVwZGF0ZSgpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwidXBkYXRlXCIsIHtjb21tYW5kOiBcImNoZWNrXCJ9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNVcGRhdGVDaGVja1Jlc3VsdChyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgZG93bmxvYWRVcGRhdGUocGF0aD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZG93bmxvYWRVcGRhdGUocGF0aCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJ1cGRhdGVcIiwge2NvbW1hbmQ6IFwiZG93bmxvYWRcIiwgcGF0aDogcGF0aH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1VwZGF0ZURvd25sb2FkUmVzdWx0KHJlc3ApO1xuICB9XG4gIFxuICBhc3luYyBzdG9wKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5zdG9wKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJzdG9wX2RhZW1vblwiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgd2FpdEZvck5leHRCbG9ja0hlYWRlcigpOiBQcm9taXNlPE1vbmVyb0Jsb2NrSGVhZGVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLndhaXRGb3JOZXh0QmxvY2tIZWFkZXIoKTtcbiAgICBsZXQgdGhhdCA9IHRoaXM7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jIGZ1bmN0aW9uKHJlc29sdmUpIHtcbiAgICAgIGF3YWl0IHRoYXQuYWRkTGlzdGVuZXIobmV3IGNsYXNzIGV4dGVuZHMgTW9uZXJvRGFlbW9uTGlzdGVuZXIge1xuICAgICAgICBhc3luYyBvbkJsb2NrSGVhZGVyKGhlYWRlcikge1xuICAgICAgICAgIGF3YWl0IHRoYXQucmVtb3ZlTGlzdGVuZXIodGhpcyk7XG4gICAgICAgICAgcmVzb2x2ZShoZWFkZXIpO1xuICAgICAgICB9XG4gICAgICB9KTsgXG4gICAgfSk7XG4gIH1cblxuICBnZXRQb2xsSW50ZXJ2YWwoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5jb25maWcucG9sbEludGVydmFsO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLSBBREQgSlNET0MgRk9SIFNVUFBPUlRFRCBERUZBVUxUIElNUExFTUVOVEFUSU9OUyAtLS0tLS0tLS0tLS0tLVxuICBhc3luYyBnZXRUeCh0eEhhc2g/OiBzdHJpbmcsIHBydW5lID0gZmFsc2UpOiBQcm9taXNlPE1vbmVyb1R4fHVuZGVmaW5lZD4geyByZXR1cm4gc3VwZXIuZ2V0VHgodHhIYXNoLCBwcnVuZSk7IH07XG4gIGFzeW5jIGdldFR4SGV4KHR4SGFzaDogc3RyaW5nLCBwcnVuZSA9IGZhbHNlKTogUHJvbWlzZTxzdHJpbmc+IHsgcmV0dXJuIHN1cGVyLmdldFR4SGV4KHR4SGFzaCwgcHJ1bmUpOyB9O1xuICBhc3luYyBnZXRLZXlJbWFnZVNwZW50U3RhdHVzKGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlU3BlbnRTdGF0dXM+IHsgcmV0dXJuIHN1cGVyLmdldEtleUltYWdlU3BlbnRTdGF0dXMoa2V5SW1hZ2UpOyB9XG4gIGFzeW5jIHNldFBlZXJCYW4oYmFuOiBNb25lcm9CYW4pOiBQcm9taXNlPHZvaWQ+IHsgcmV0dXJuIHN1cGVyLnNldFBlZXJCYW4oYmFuKTsgfVxuICBhc3luYyBzdWJtaXRCbG9jayhibG9ja0Jsb2I6IHN0cmluZyk6IFByb21pc2U8dm9pZD4geyByZXR1cm4gc3VwZXIuc3VibWl0QmxvY2soYmxvY2tCbG9iKTsgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwcm90ZWN0ZWQgcmVmcmVzaExpc3RlbmluZygpIHtcbiAgICBpZiAodGhpcy5wb2xsTGlzdGVuZXIgPT0gdW5kZWZpbmVkICYmIHRoaXMubGlzdGVuZXJzLmxlbmd0aCkgdGhpcy5wb2xsTGlzdGVuZXIgPSBuZXcgRGFlbW9uUG9sbGVyKHRoaXMpO1xuICAgIGlmICh0aGlzLnBvbGxMaXN0ZW5lciAhPT0gdW5kZWZpbmVkKSB0aGlzLnBvbGxMaXN0ZW5lci5zZXRJc1BvbGxpbmcodGhpcy5saXN0ZW5lcnMubGVuZ3RoID4gMCk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBnZXRCYW5kd2lkdGhMaW1pdHMoKSB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJnZXRfbGltaXRcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgcmV0dXJuIFtyZXNwLmxpbWl0X2Rvd24sIHJlc3AubGltaXRfdXBdO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgc2V0QmFuZHdpZHRoTGltaXRzKGRvd25MaW1pdCwgdXBMaW1pdCkge1xuICAgIGlmIChkb3duTGltaXQgPT09IHVuZGVmaW5lZCkgZG93bkxpbWl0ID0gMDtcbiAgICBpZiAodXBMaW1pdCA9PT0gdW5kZWZpbmVkKSB1cExpbWl0ID0gMDtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcInNldF9saW1pdFwiLCB7bGltaXRfZG93bjogZG93bkxpbWl0LCBsaW1pdF91cDogdXBMaW1pdH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIHJldHVybiBbcmVzcC5saW1pdF9kb3duLCByZXNwLmxpbWl0X3VwXTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhIGNvbnRpZ3VvdXMgY2h1bmsgb2YgYmxvY2tzIHN0YXJ0aW5nIGZyb20gYSBnaXZlbiBoZWlnaHQgdXAgdG8gYSBtYXhpbXVtXG4gICAqIGhlaWdodCBvciBhbW91bnQgb2YgYmxvY2sgZGF0YSBmZXRjaGVkIGZyb20gdGhlIGJsb2NrY2hhaW4sIHdoaWNoZXZlciBjb21lcyBmaXJzdC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbc3RhcnRIZWlnaHRdIC0gc3RhcnQgaGVpZ2h0IHRvIHJldHJpZXZlIGJsb2NrcyAoZGVmYXVsdCAwKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW21heEhlaWdodF0gLSBtYXhpbXVtIGVuZCBoZWlnaHQgdG8gcmV0cmlldmUgYmxvY2tzIChkZWZhdWx0IGJsb2NrY2hhaW4gaGVpZ2h0KVxuICAgKiBAcGFyYW0ge251bWJlcn0gW21heFJlcVNpemVdIC0gbWF4aW11bSBhbW91bnQgb2YgYmxvY2sgZGF0YSB0byBmZXRjaCBmcm9tIHRoZSBibG9ja2NoYWluIGluIGJ5dGVzIChkZWZhdWx0IDMsMDAwLDAwMCBieXRlcylcbiAgICogQHJldHVybiB7TW9uZXJvQmxvY2tbXX0gYXJlIHRoZSByZXN1bHRpbmcgY2h1bmsgb2YgYmxvY2tzXG4gICAqL1xuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0TWF4QmxvY2tzKHN0YXJ0SGVpZ2h0LCBtYXhIZWlnaHQsIG1heFJlcVNpemUpIHtcbiAgICBpZiAoc3RhcnRIZWlnaHQgPT09IHVuZGVmaW5lZCkgc3RhcnRIZWlnaHQgPSAwO1xuICAgIGlmIChtYXhIZWlnaHQgPT09IHVuZGVmaW5lZCkgbWF4SGVpZ2h0ID0gYXdhaXQgdGhpcy5nZXRIZWlnaHQoKSAtIDE7XG4gICAgaWYgKG1heFJlcVNpemUgPT09IHVuZGVmaW5lZCkgbWF4UmVxU2l6ZSA9IE1vbmVyb0RhZW1vblJwYy5NQVhfUkVRX1NJWkU7XG4gICAgXG4gICAgLy8gZGV0ZXJtaW5lIGVuZCBoZWlnaHQgdG8gZmV0Y2hcbiAgICBsZXQgcmVxU2l6ZSA9IDA7XG4gICAgbGV0IGVuZEhlaWdodCA9IHN0YXJ0SGVpZ2h0IC0gMTtcbiAgICB3aGlsZSAocmVxU2l6ZSA8IG1heFJlcVNpemUgJiYgZW5kSGVpZ2h0IDwgbWF4SGVpZ2h0KSB7XG4gICAgICBcbiAgICAgIC8vIGdldCBoZWFkZXIgb2YgbmV4dCBibG9ja1xuICAgICAgbGV0IGhlYWRlciA9IGF3YWl0IHRoaXMuZ2V0QmxvY2tIZWFkZXJCeUhlaWdodENhY2hlZChlbmRIZWlnaHQgKyAxLCBtYXhIZWlnaHQpO1xuICAgICAgXG4gICAgICAvLyBibG9jayBjYW5ub3QgYmUgYmlnZ2VyIHRoYW4gbWF4IHJlcXVlc3Qgc2l6ZVxuICAgICAgYXNzZXJ0KGhlYWRlci5nZXRTaXplKCkgPD0gbWF4UmVxU2l6ZSwgXCJCbG9jayBleGNlZWRzIG1heGltdW0gcmVxdWVzdCBzaXplOiBcIiArIGhlYWRlci5nZXRTaXplKCkpO1xuICAgICAgXG4gICAgICAvLyBkb25lIGl0ZXJhdGluZyBpZiBmZXRjaGluZyBibG9jayB3b3VsZCBleGNlZWQgbWF4IHJlcXVlc3Qgc2l6ZVxuICAgICAgaWYgKHJlcVNpemUgKyBoZWFkZXIuZ2V0U2l6ZSgpID4gbWF4UmVxU2l6ZSkgYnJlYWs7XG4gICAgICBcbiAgICAgIC8vIG90aGVyd2lzZSBibG9jayBpcyBpbmNsdWRlZFxuICAgICAgcmVxU2l6ZSArPSBoZWFkZXIuZ2V0U2l6ZSgpO1xuICAgICAgZW5kSGVpZ2h0Kys7XG4gICAgfVxuICAgIHJldHVybiBlbmRIZWlnaHQgPj0gc3RhcnRIZWlnaHQgPyBhd2FpdCB0aGlzLmdldEJsb2Nrc0J5UmFuZ2Uoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCkgOiBbXTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhIGhlYWRlciBieSBoZWlnaHQgZnJvbSB0aGUgY2FjaGUgb3IgZmV0Y2hlcyBhbmQgY2FjaGVzIGEgaGVhZGVyXG4gICAqIHJhbmdlIGlmIG5vdCBhbHJlYWR5IGluIHRoZSBjYWNoZS5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHQgLSBoZWlnaHQgb2YgdGhlIGhlYWRlciB0byByZXRyaWV2ZSBmcm9tIHRoZSBjYWNoZVxuICAgKiBAcGFyYW0ge251bWJlcn0gbWF4SGVpZ2h0IC0gbWF4aW11bSBoZWlnaHQgb2YgaGVhZGVycyB0byBjYWNoZVxuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIGdldEJsb2NrSGVhZGVyQnlIZWlnaHRDYWNoZWQoaGVpZ2h0LCBtYXhIZWlnaHQpIHtcbiAgICBcbiAgICAvLyBnZXQgaGVhZGVyIGZyb20gY2FjaGVcbiAgICBsZXQgY2FjaGVkSGVhZGVyID0gdGhpcy5jYWNoZWRIZWFkZXJzW2hlaWdodF07XG4gICAgaWYgKGNhY2hlZEhlYWRlcikgcmV0dXJuIGNhY2hlZEhlYWRlcjtcbiAgICBcbiAgICAvLyBmZXRjaCBhbmQgY2FjaGUgaGVhZGVycyBpZiBub3QgaW4gY2FjaGVcbiAgICBsZXQgZW5kSGVpZ2h0ID0gTWF0aC5taW4obWF4SGVpZ2h0LCBoZWlnaHQgKyBNb25lcm9EYWVtb25ScGMuTlVNX0hFQURFUlNfUEVSX1JFUSAtIDEpOyAgLy8gVE9ETzogY291bGQgc3BlY2lmeSBlbmQgaGVpZ2h0IHRvIGNhY2hlIHRvIG9wdGltaXplIHNtYWxsIHJlcXVlc3RzICh3b3VsZCBsaWtlIHRvIGhhdmUgdGltZSBwcm9maWxpbmcgaW4gcGxhY2UgdGhvdWdoKVxuICAgIGxldCBoZWFkZXJzID0gYXdhaXQgdGhpcy5nZXRCbG9ja0hlYWRlcnNCeVJhbmdlKGhlaWdodCwgZW5kSGVpZ2h0KTtcbiAgICBmb3IgKGxldCBoZWFkZXIgb2YgaGVhZGVycykge1xuICAgICAgdGhpcy5jYWNoZWRIZWFkZXJzW2hlYWRlci5nZXRIZWlnaHQoKV0gPSBoZWFkZXI7XG4gICAgfVxuICAgIFxuICAgIC8vIHJldHVybiB0aGUgY2FjaGVkIGhlYWRlclxuICAgIHJldHVybiB0aGlzLmNhY2hlZEhlYWRlcnNbaGVpZ2h0XTtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFNUQVRJQyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBzdGF0aWMgYXN5bmMgY29ubmVjdFRvRGFlbW9uUnBjKHVyaU9yQ29uZmlnOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHwgUGFydGlhbDxNb25lcm9EYWVtb25Db25maWc+IHwgc3RyaW5nW10sIHVzZXJuYW1lPzogc3RyaW5nLCBwYXNzd29yZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvRGFlbW9uUnBjPiB7XG4gICAgbGV0IGNvbmZpZyA9IE1vbmVyb0RhZW1vblJwYy5ub3JtYWxpemVDb25maWcodXJpT3JDb25maWcsIHVzZXJuYW1lLCBwYXNzd29yZCk7XG4gICAgaWYgKGNvbmZpZy5jbWQpIHJldHVybiBNb25lcm9EYWVtb25ScGMuc3RhcnRNb25lcm9kUHJvY2Vzcyhjb25maWcpO1xuICAgIHJldHVybiBuZXcgTW9uZXJvRGFlbW9uUnBjKGNvbmZpZywgY29uZmlnLnByb3h5VG9Xb3JrZXIgPyBhd2FpdCBNb25lcm9EYWVtb25ScGNQcm94eS5jb25uZWN0KGNvbmZpZykgOiB1bmRlZmluZWQpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIHN0YXJ0TW9uZXJvZFByb2Nlc3MoY29uZmlnOiBNb25lcm9EYWVtb25Db25maWcpOiBQcm9taXNlPE1vbmVyb0RhZW1vblJwYz4ge1xuICAgIGFzc2VydChHZW5VdGlscy5pc0FycmF5KGNvbmZpZy5jbWQpLCBcIk11c3QgcHJvdmlkZSBzdHJpbmcgYXJyYXkgd2l0aCBjb21tYW5kIGxpbmUgcGFyYW1ldGVyc1wiKTtcbiAgICBcbiAgICAvLyBzdGFydCBwcm9jZXNzXG4gICAgbGV0IGNoaWxkUHJvY2VzcyA9IHJlcXVpcmUoJ2NoaWxkX3Byb2Nlc3MnKS5zcGF3bihjb25maWcuY21kWzBdLCBjb25maWcuY21kLnNsaWNlKDEpLCB7XG4gICAgICBlbnY6IHsgLi4ucHJvY2Vzcy5lbnYsIExBTkc6ICdlbl9VUy5VVEYtOCcgfSAvLyBzY3JhcGUgb3V0cHV0IGluIGVuZ2xpc2hcbiAgICB9KTtcbiAgICBjaGlsZFByb2Nlc3Muc3Rkb3V0LnNldEVuY29kaW5nKCd1dGY4Jyk7XG4gICAgY2hpbGRQcm9jZXNzLnN0ZGVyci5zZXRFbmNvZGluZygndXRmOCcpO1xuICAgIFxuICAgIC8vIHJldHVybiBwcm9taXNlIHdoaWNoIHJlc29sdmVzIGFmdGVyIHN0YXJ0aW5nIG1vbmVyb2RcbiAgICBsZXQgdXJpO1xuICAgIGxldCBvdXRwdXQgPSBcIlwiO1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gYXdhaXQgbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICBcbiAgICAgICAgLy8gaGFuZGxlIHN0ZG91dFxuICAgICAgICBjaGlsZFByb2Nlc3Muc3Rkb3V0Lm9uKCdkYXRhJywgYXN5bmMgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgIGxldCBsaW5lID0gZGF0YS50b1N0cmluZygpO1xuICAgICAgICAgIExpYnJhcnlVdGlscy5sb2coMiwgbGluZSk7XG4gICAgICAgICAgb3V0cHV0ICs9IGxpbmUgKyAnXFxuJzsgLy8gY2FwdHVyZSBvdXRwdXQgaW4gY2FzZSBvZiBlcnJvclxuICAgICAgICAgIFxuICAgICAgICAgIC8vIGV4dHJhY3QgdXJpIGZyb20gZS5nLiBcIkkgQmluZGluZyBvbiAxMjcuMC4wLjEgKElQdjQpOjM4MDg1XCJcbiAgICAgICAgICBsZXQgdXJpTGluZUNvbnRhaW5zID0gXCJCaW5kaW5nIG9uIFwiO1xuICAgICAgICAgIGxldCB1cmlMaW5lQ29udGFpbnNJZHggPSBsaW5lLmluZGV4T2YodXJpTGluZUNvbnRhaW5zKTtcbiAgICAgICAgICBpZiAodXJpTGluZUNvbnRhaW5zSWR4ID49IDApIHtcbiAgICAgICAgICAgIGxldCBob3N0ID0gbGluZS5zdWJzdHJpbmcodXJpTGluZUNvbnRhaW5zSWR4ICsgdXJpTGluZUNvbnRhaW5zLmxlbmd0aCwgbGluZS5sYXN0SW5kZXhPZignICcpKTtcbiAgICAgICAgICAgIGxldCB1bmZvcm1hdHRlZExpbmUgPSBsaW5lLnJlcGxhY2UoL1xcdTAwMWJcXFsuKj9tL2csICcnKS50cmltKCk7IC8vIHJlbW92ZSBjb2xvciBmb3JtYXR0aW5nXG4gICAgICAgICAgICBsZXQgcG9ydCA9IHVuZm9ybWF0dGVkTGluZS5zdWJzdHJpbmcodW5mb3JtYXR0ZWRMaW5lLmxhc3RJbmRleE9mKCc6JykgKyAxKTtcbiAgICAgICAgICAgIGxldCBzc2xJZHggPSBjb25maWcuY21kLmluZGV4T2YoXCItLXJwYy1zc2xcIik7XG4gICAgICAgICAgICBsZXQgc3NsRW5hYmxlZCA9IHNzbElkeCA+PSAwID8gXCJlbmFibGVkXCIgPT0gY29uZmlnLmNtZFtzc2xJZHggKyAxXS50b0xvd2VyQ2FzZSgpIDogZmFsc2U7XG4gICAgICAgICAgICB1cmkgPSAoc3NsRW5hYmxlZCA/IFwiaHR0cHNcIiA6IFwiaHR0cFwiKSArIFwiOi8vXCIgKyBob3N0ICsgXCI6XCIgKyBwb3J0O1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICAvLyByZWFkIHN1Y2Nlc3MgbWVzc2FnZVxuICAgICAgICAgIGlmIChsaW5lLmluZGV4T2YoXCJjb3JlIFJQQyBzZXJ2ZXIgc3RhcnRlZCBva1wiKSA+PSAwKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIGdldCB1c2VybmFtZSBhbmQgcGFzc3dvcmQgZnJvbSBwYXJhbXNcbiAgICAgICAgICAgIGxldCB1c2VyUGFzc0lkeCA9IGNvbmZpZy5jbWQuaW5kZXhPZihcIi0tcnBjLWxvZ2luXCIpO1xuICAgICAgICAgICAgbGV0IHVzZXJQYXNzID0gdXNlclBhc3NJZHggPj0gMCA/IGNvbmZpZy5jbWRbdXNlclBhc3NJZHggKyAxXSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGxldCB1c2VybmFtZSA9IHVzZXJQYXNzID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB1c2VyUGFzcy5zdWJzdHJpbmcoMCwgdXNlclBhc3MuaW5kZXhPZignOicpKTtcbiAgICAgICAgICAgIGxldCBwYXNzd29yZCA9IHVzZXJQYXNzID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB1c2VyUGFzcy5zdWJzdHJpbmcodXNlclBhc3MuaW5kZXhPZignOicpICsgMSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIGNyZWF0ZSBjbGllbnQgY29ubmVjdGVkIHRvIGludGVybmFsIHByb2Nlc3NcbiAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZy5jb3B5KCkuc2V0U2VydmVyKHt1cmk6IHVyaSwgdXNlcm5hbWU6IHVzZXJuYW1lLCBwYXNzd29yZDogcGFzc3dvcmQsIHJlamVjdFVuYXV0aG9yaXplZDogY29uZmlnLmdldFNlcnZlcigpID8gY29uZmlnLmdldFNlcnZlcigpLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdW5kZWZpbmVkfSk7XG4gICAgICAgICAgICBjb25maWcuc2V0UHJveHlUb1dvcmtlcihjb25maWcucHJveHlUb1dvcmtlcik7XG4gICAgICAgICAgICBjb25maWcuY21kID0gdW5kZWZpbmVkXG4gICAgICAgICAgICBsZXQgZGFlbW9uID0gYXdhaXQgTW9uZXJvRGFlbW9uUnBjLmNvbm5lY3RUb0RhZW1vblJwYyhjb25maWcpO1xuICAgICAgICAgICAgZGFlbW9uLnByb2Nlc3MgPSBjaGlsZFByb2Nlc3M7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIHJlc29sdmUgcHJvbWlzZSB3aXRoIGNsaWVudCBjb25uZWN0ZWQgdG8gaW50ZXJuYWwgcHJvY2VzcyBcbiAgICAgICAgICAgIHRoaXMuaXNSZXNvbHZlZCA9IHRydWU7XG4gICAgICAgICAgICByZXNvbHZlKGRhZW1vbik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBzdGRlcnJcbiAgICAgICAgY2hpbGRQcm9jZXNzLnN0ZGVyci5vbignZGF0YScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICBpZiAoTGlicmFyeVV0aWxzLmdldExvZ0xldmVsKCkgPj0gMikgY29uc29sZS5lcnJvcihkYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgZXhpdFxuICAgICAgICBjaGlsZFByb2Nlc3Mub24oXCJleGl0XCIsIGZ1bmN0aW9uKGNvZGUpIHtcbiAgICAgICAgICBpZiAoIXRoaXMuaXNSZXNvbHZlZCkgcmVqZWN0KG5ldyBFcnJvcihcIm1vbmVyb2QgcHJvY2VzcyB0ZXJtaW5hdGVkIHdpdGggZXhpdCBjb2RlIFwiICsgY29kZSArIChvdXRwdXQgPyBcIjpcXG5cXG5cIiArIG91dHB1dCA6IFwiXCIpKSk7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gaGFuZGxlIGVycm9yXG4gICAgICAgIGNoaWxkUHJvY2Vzcy5vbihcImVycm9yXCIsIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgIGlmIChlcnIubWVzc2FnZS5pbmRleE9mKFwiRU5PRU5UXCIpID49IDApIHJlamVjdChuZXcgRXJyb3IoXCJtb25lcm9kIGRvZXMgbm90IGV4aXN0IGF0IHBhdGggJ1wiICsgY29uZmlnLmNtZFswXSArIFwiJ1wiKSk7XG4gICAgICAgICAgaWYgKCF0aGlzLmlzUmVzb2x2ZWQpIHJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSB1bmNhdWdodCBleGNlcHRpb25cbiAgICAgICAgY2hpbGRQcm9jZXNzLm9uKFwidW5jYXVnaHRFeGNlcHRpb25cIiwgZnVuY3Rpb24oZXJyLCBvcmlnaW4pIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiVW5jYXVnaHQgZXhjZXB0aW9uIGluIG1vbmVyb2QgcHJvY2VzczogXCIgKyBlcnIubWVzc2FnZSk7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihvcmlnaW4pO1xuICAgICAgICAgIGlmICghdGhpcy5pc1Jlc29sdmVkKSByZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGVyci5tZXNzYWdlKTtcbiAgICB9XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgbm9ybWFsaXplQ29uZmlnKHVyaU9yQ29uZmlnOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHwgUGFydGlhbDxNb25lcm9EYWVtb25Db25maWc+IHwgc3RyaW5nW10sIHVzZXJuYW1lPzogc3RyaW5nLCBwYXNzd29yZD86IHN0cmluZyk6IE1vbmVyb0RhZW1vbkNvbmZpZyB7XG4gICAgbGV0IGNvbmZpZzogdW5kZWZpbmVkIHwgUGFydGlhbDxNb25lcm9EYWVtb25Db25maWc+ID0gdW5kZWZpbmVkO1xuICAgIGlmICh0eXBlb2YgdXJpT3JDb25maWcgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGNvbmZpZyA9IG5ldyBNb25lcm9EYWVtb25Db25maWcoe3NlcnZlcjogbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24odXJpT3JDb25maWcgYXMgc3RyaW5nLCB1c2VybmFtZSwgcGFzc3dvcmQpfSk7XG4gICAgfSBlbHNlIGlmICgodXJpT3JDb25maWcgYXMgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPikudXJpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbmZpZyA9IG5ldyBNb25lcm9EYWVtb25Db25maWcoe3NlcnZlcjogbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24odXJpT3JDb25maWcgYXMgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPil9KTtcblxuICAgICAgLy8gdHJhbnNmZXIgd29ya2VyIHByb3h5IHNldHRpbmcgZnJvbSBycGMgY29ubmVjdGlvbiB0byBkYWVtb24gY29uZmlnXG4gICAgICBjb25maWcuc2V0UHJveHlUb1dvcmtlcigodXJpT3JDb25maWcgYXMgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPikucHJveHlUb1dvcmtlcik7XG4gICAgICBjb25maWcuZ2V0U2VydmVyKCkuc2V0UHJveHlUb1dvcmtlcihNb25lcm9ScGNDb25uZWN0aW9uLkRFRkFVTFRfQ09ORklHLnByb3h5VG9Xb3JrZXIpO1xuICAgIH0gZWxzZSBpZiAoR2VuVXRpbHMuaXNBcnJheSh1cmlPckNvbmZpZykpIHtcbiAgICAgIGNvbmZpZyA9IG5ldyBNb25lcm9EYWVtb25Db25maWcoe2NtZDogdXJpT3JDb25maWcgYXMgc3RyaW5nW119KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uZmlnID0gbmV3IE1vbmVyb0RhZW1vbkNvbmZpZyh1cmlPckNvbmZpZyBhcyBQYXJ0aWFsPE1vbmVyb0RhZW1vbkNvbmZpZz4pO1xuICAgIH1cbiAgICBpZiAoY29uZmlnLnByb3h5VG9Xb3JrZXIgPT09IHVuZGVmaW5lZCkgY29uZmlnLnByb3h5VG9Xb3JrZXIgPSB0cnVlO1xuICAgIGlmIChjb25maWcucG9sbEludGVydmFsID09PSB1bmRlZmluZWQpIGNvbmZpZy5wb2xsSW50ZXJ2YWwgPSBNb25lcm9EYWVtb25ScGMuREVGQVVMVF9QT0xMX1BFUklPRDtcbiAgICByZXR1cm4gY29uZmlnIGFzIE1vbmVyb0RhZW1vbkNvbmZpZztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApIHtcbiAgICBpZiAocmVzcC5zdGF0dXMgIT09IFwiT0tcIikgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHJlc3Auc3RhdHVzKTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjQmxvY2tIZWFkZXIocnBjSGVhZGVyKSB7XG4gICAgaWYgKCFycGNIZWFkZXIpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgbGV0IGhlYWRlciA9IG5ldyBNb25lcm9CbG9ja0hlYWRlcigpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNIZWFkZXIpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjSGVhZGVyW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImJsb2NrX3NpemVcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRTaXplLCBoZWFkZXIuc2V0U2l6ZSwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkZXB0aFwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldERlcHRoLCBoZWFkZXIuc2V0RGVwdGgsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGlmZmljdWx0eVwiKSB7IH0gIC8vIGhhbmRsZWQgYnkgd2lkZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3VtdWxhdGl2ZV9kaWZmaWN1bHR5XCIpIHsgfSAvLyBoYW5kbGVkIGJ5IHdpZGVfY3VtdWxhdGl2ZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGlmZmljdWx0eV90b3A2NFwiKSB7IH0gIC8vIGhhbmRsZWQgYnkgd2lkZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3VtdWxhdGl2ZV9kaWZmaWN1bHR5X3RvcDY0XCIpIHsgfSAvLyBoYW5kbGVkIGJ5IHdpZGVfY3VtdWxhdGl2ZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2lkZV9kaWZmaWN1bHR5XCIpIGhlYWRlci5zZXREaWZmaWN1bHR5KEdlblV0aWxzLnJlY29uY2lsZShoZWFkZXIuZ2V0RGlmZmljdWx0eSgpLCBNb25lcm9EYWVtb25ScGMucHJlZml4ZWRIZXhUb0JJKHZhbCkpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3aWRlX2N1bXVsYXRpdmVfZGlmZmljdWx0eVwiKSBoZWFkZXIuc2V0Q3VtdWxhdGl2ZURpZmZpY3VsdHkoR2VuVXRpbHMucmVjb25jaWxlKGhlYWRlci5nZXRDdW11bGF0aXZlRGlmZmljdWx0eSgpLCBNb25lcm9EYWVtb25ScGMucHJlZml4ZWRIZXhUb0JJKHZhbCkpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJoYXNoXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0SGFzaCwgaGVhZGVyLnNldEhhc2gsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGVpZ2h0XCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0SGVpZ2h0LCBoZWFkZXIuc2V0SGVpZ2h0LCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm1ham9yX3ZlcnNpb25cIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRNYWpvclZlcnNpb24sIGhlYWRlci5zZXRNYWpvclZlcnNpb24sIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibWlub3JfdmVyc2lvblwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldE1pbm9yVmVyc2lvbiwgaGVhZGVyLnNldE1pbm9yVmVyc2lvbiwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJub25jZVwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldE5vbmNlLCBoZWFkZXIuc2V0Tm9uY2UsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibnVtX3R4ZXNcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXROdW1UeHMsIGhlYWRlci5zZXROdW1UeHMsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwib3JwaGFuX3N0YXR1c1wiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldE9ycGhhblN0YXR1cywgaGVhZGVyLnNldE9ycGhhblN0YXR1cywgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwcmV2X2hhc2hcIiB8fCBrZXkgPT09IFwicHJldl9pZFwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldFByZXZIYXNoLCBoZWFkZXIuc2V0UHJldkhhc2gsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmV3YXJkXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0UmV3YXJkLCBoZWFkZXIuc2V0UmV3YXJkLCBCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidGltZXN0YW1wXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0VGltZXN0YW1wLCBoZWFkZXIuc2V0VGltZXN0YW1wLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX3dlaWdodFwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldFdlaWdodCwgaGVhZGVyLnNldFdlaWdodCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsb25nX3Rlcm1fd2VpZ2h0XCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0TG9uZ1Rlcm1XZWlnaHQsIGhlYWRlci5zZXRMb25nVGVybVdlaWdodCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwb3dfaGFzaFwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldFBvd0hhc2gsIGhlYWRlci5zZXRQb3dIYXNoLCB2YWwgPT09IFwiXCIgPyB1bmRlZmluZWQgOiB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2hhc2hlc1wiKSB7fSAgLy8gdXNlZCBpbiBibG9jayBtb2RlbCwgbm90IGhlYWRlciBtb2RlbFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm1pbmVyX3R4XCIpIHt9ICAgLy8gdXNlZCBpbiBibG9jayBtb2RlbCwgbm90IGhlYWRlciBtb2RlbFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm1pbmVyX3R4X2hhc2hcIikgaGVhZGVyLnNldE1pbmVyVHhIYXNoKHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBibG9jayBoZWFkZXIgZmllbGQ6ICdcIiArIGtleSArIFwiJzogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gaGVhZGVyO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNCbG9jayhycGNCbG9jaykge1xuICAgIFxuICAgIC8vIGJ1aWxkIGJsb2NrXG4gICAgbGV0IGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQmxvY2tIZWFkZXIocnBjQmxvY2suYmxvY2tfaGVhZGVyID8gcnBjQmxvY2suYmxvY2tfaGVhZGVyIDogcnBjQmxvY2spIGFzIE1vbmVyb0Jsb2NrKTtcbiAgICBibG9jay5zZXRIZXgocnBjQmxvY2suYmxvYik7XG4gICAgYmxvY2suc2V0VHhIYXNoZXMocnBjQmxvY2sudHhfaGFzaGVzID09PSB1bmRlZmluZWQgPyBbXSA6IHJwY0Jsb2NrLnR4X2hhc2hlcyk7XG4gICAgXG4gICAgLy8gYnVpbGQgbWluZXIgdHhcbiAgICBsZXQgcnBjTWluZXJUeCA9IHJwY0Jsb2NrLmpzb24gPyBKU09OLnBhcnNlKHJwY0Jsb2NrLmpzb24pLm1pbmVyX3R4IDogcnBjQmxvY2subWluZXJfdHg7ICAvLyBtYXkgbmVlZCB0byBiZSBwYXJzZWQgZnJvbSBqc29uXG4gICAgbGV0IG1pbmVyVHggPSBuZXcgTW9uZXJvVHgoKTtcbiAgICBibG9jay5zZXRNaW5lclR4KG1pbmVyVHgpO1xuICAgIG1pbmVyVHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgbWluZXJUeC5zZXRJblR4UG9vbChmYWxzZSlcbiAgICBtaW5lclR4LnNldElzTWluZXJUeCh0cnVlKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1R4KHJwY01pbmVyVHgsIG1pbmVyVHgpO1xuICAgIFxuICAgIHJldHVybiBibG9jaztcbiAgfVxuICBcbiAgLyoqXG4gICAqIFRyYW5zZmVycyBSUEMgdHggZmllbGRzIHRvIGEgZ2l2ZW4gTW9uZXJvVHggd2l0aG91dCBvdmVyd3JpdGluZyBwcmV2aW91cyB2YWx1ZXMuXG4gICAqIFxuICAgKiBUT0RPOiBzd2l0Y2ggZnJvbSBzYWZlIHNldFxuICAgKiBcbiAgICogQHBhcmFtIHJwY1R4IC0gUlBDIG1hcCBjb250YWluaW5nIHRyYW5zYWN0aW9uIGZpZWxkc1xuICAgKiBAcGFyYW0gdHggIC0gTW9uZXJvVHggdG8gcG9wdWxhdGUgd2l0aCB2YWx1ZXMgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHR4IC0gc2FtZSB0eCB0aGF0IHdhcyBwYXNzZWQgaW4gb3IgYSBuZXcgb25lIGlmIG5vbmUgZ2l2ZW5cbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1R4KHJwY1R4LCB0eCkge1xuICAgIGlmIChycGNUeCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIGlmICh0eCA9PT0gdW5kZWZpbmVkKSB0eCA9IG5ldyBNb25lcm9UeCgpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgZnJvbSBycGMgbWFwXG4gICAgbGV0IGhlYWRlcjtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjVHgpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjVHhba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwidHhfaGFzaFwiIHx8IGtleSA9PT0gXCJpZF9oYXNoXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldEhhc2gsIHR4LnNldEhhc2gsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfdGltZXN0YW1wXCIpIHtcbiAgICAgICAgaWYgKCFoZWFkZXIpIGhlYWRlciA9IG5ldyBNb25lcm9CbG9ja0hlYWRlcigpO1xuICAgICAgICBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldFRpbWVzdGFtcCwgaGVhZGVyLnNldFRpbWVzdGFtcCwgdmFsKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja19oZWlnaHRcIikge1xuICAgICAgICBpZiAoIWhlYWRlcikgaGVhZGVyID0gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKCk7XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0SGVpZ2h0LCBoZWFkZXIuc2V0SGVpZ2h0LCB2YWwpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxhc3RfcmVsYXllZF90aW1lXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldExhc3RSZWxheWVkVGltZXN0YW1wLCB0eC5zZXRMYXN0UmVsYXllZFRpbWVzdGFtcCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyZWNlaXZlX3RpbWVcIiB8fCBrZXkgPT09IFwicmVjZWl2ZWRfdGltZXN0YW1wXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFJlY2VpdmVkVGltZXN0YW1wLCB0eC5zZXRSZWNlaXZlZFRpbWVzdGFtcCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjb25maXJtYXRpb25zXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldE51bUNvbmZpcm1hdGlvbnMsIHR4LnNldE51bUNvbmZpcm1hdGlvbnMsIHZhbCk7IFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImluX3Bvb2xcIikge1xuICAgICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc0NvbmZpcm1lZCwgdHguc2V0SXNDb25maXJtZWQsICF2YWwpO1xuICAgICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJblR4UG9vbCwgdHguc2V0SW5UeFBvb2wsIHZhbCk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZG91YmxlX3NwZW5kX3NlZW5cIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SXNEb3VibGVTcGVuZFNlZW4sIHR4LnNldElzRG91YmxlU3BlbmRTZWVuLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInZlcnNpb25cIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0VmVyc2lvbiwgdHguc2V0VmVyc2lvbiwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJleHRyYVwiKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdmFsID09PSBcInN0cmluZ1wiKSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGV4dHJhIGZpZWxkIGFzIHN0cmluZyBub3QgYmVpbmcgYXNpZ25lZCB0byBpbnRbXTogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpOyAvLyBUT0RPOiBob3cgdG8gc2V0IHN0cmluZyB0byBpbnRbXT8gLSBvciwgZXh0cmEgaXMgc3RyaW5nIHdoaWNoIGNhbiBlbmNvZGUgaW50W11cbiAgICAgICAgZWxzZSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRFeHRyYSwgdHguc2V0RXh0cmEsIG5ldyBVaW50OEFycmF5KHZhbCkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInZpblwiKSB7XG4gICAgICAgIGlmICh2YWwubGVuZ3RoICE9PSAxIHx8ICF2YWxbMF0uZ2VuKSB7ICAvLyBpZ25vcmUgbWluZXIgaW5wdXQgVE9ETzogd2h5P1xuICAgICAgICAgIHR4LnNldElucHV0cyh2YWwubWFwKHJwY1ZpbiA9PiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY091dHB1dChycGNWaW4sIHR4KSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidm91dFwiKSB0eC5zZXRPdXRwdXRzKHZhbC5tYXAocnBjT3V0cHV0ID0+IE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjT3V0cHV0KHJwY091dHB1dCwgdHgpKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmN0X3NpZ25hdHVyZXNcIikge1xuICAgICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRSY3RTaWduYXR1cmVzLCB0eC5zZXRSY3RTaWduYXR1cmVzLCB2YWwpO1xuICAgICAgICBpZiAodmFsLnR4bkZlZSkgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0RmVlLCB0eC5zZXRGZWUsIEJpZ0ludCh2YWwudHhuRmVlKSk7XG4gICAgICB9IFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJjdHNpZ19wcnVuYWJsZVwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRSY3RTaWdQcnVuYWJsZSwgdHguc2V0UmN0U2lnUHJ1bmFibGUsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5sb2NrX3RpbWVcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0VW5sb2NrVGltZSwgdHguc2V0VW5sb2NrVGltZSwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhc19qc29uXCIgfHwga2V5ID09PSBcInR4X2pzb25cIikgeyB9ICAvLyBoYW5kbGVkIGxhc3Qgc28gdHggaXMgYXMgaW5pdGlhbGl6ZWQgYXMgcG9zc2libGVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhc19oZXhcIiB8fCBrZXkgPT09IFwidHhfYmxvYlwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRGdWxsSGV4LCB0eC5zZXRGdWxsSGV4LCB2YWwgPyB2YWwgOiB1bmRlZmluZWQpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2Jfc2l6ZVwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRTaXplLCB0eC5zZXRTaXplLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndlaWdodFwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRXZWlnaHQsIHR4LnNldFdlaWdodCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmZWVcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0RmVlLCB0eC5zZXRGZWUsIEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyZWxheWVkXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzUmVsYXllZCwgdHguc2V0SXNSZWxheWVkLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm91dHB1dF9pbmRpY2VzXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldE91dHB1dEluZGljZXMsIHR4LnNldE91dHB1dEluZGljZXMsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZG9fbm90X3JlbGF5XCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFJlbGF5LCB0eC5zZXRSZWxheSwgIXZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwia2VwdF9ieV9ibG9ja1wiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc0tlcHRCeUJsb2NrLCB0eC5zZXRJc0tlcHRCeUJsb2NrLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNpZ25hdHVyZXNcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0U2lnbmF0dXJlcywgdHguc2V0U2lnbmF0dXJlcywgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsYXN0X2ZhaWxlZF9oZWlnaHRcIikge1xuICAgICAgICBpZiAodmFsID09PSAwKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc0ZhaWxlZCwgdHguc2V0SXNGYWlsZWQsIGZhbHNlKTtcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SXNGYWlsZWQsIHR4LnNldElzRmFpbGVkLCB0cnVlKTtcbiAgICAgICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRMYXN0RmFpbGVkSGVpZ2h0LCB0eC5zZXRMYXN0RmFpbGVkSGVpZ2h0LCB2YWwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibGFzdF9mYWlsZWRfaWRfaGFzaFwiKSB7XG4gICAgICAgIGlmICh2YWwgPT09IE1vbmVyb0RhZW1vblJwYy5ERUZBVUxUX0lEKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc0ZhaWxlZCwgdHguc2V0SXNGYWlsZWQsIGZhbHNlKTtcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SXNGYWlsZWQsIHR4LnNldElzRmFpbGVkLCB0cnVlKTtcbiAgICAgICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRMYXN0RmFpbGVkSGFzaCwgdHguc2V0TGFzdEZhaWxlZEhhc2gsIHZhbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtYXhfdXNlZF9ibG9ja19oZWlnaHRcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0TWF4VXNlZEJsb2NrSGVpZ2h0LCB0eC5zZXRNYXhVc2VkQmxvY2tIZWlnaHQsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibWF4X3VzZWRfYmxvY2tfaWRfaGFzaFwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRNYXhVc2VkQmxvY2tIYXNoLCB0eC5zZXRNYXhVc2VkQmxvY2tIYXNoLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBydW5hYmxlX2hhc2hcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0UHJ1bmFibGVIYXNoLCB0eC5zZXRQcnVuYWJsZUhhc2gsIHZhbCA/IHZhbCA6IHVuZGVmaW5lZCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHJ1bmFibGVfYXNfaGV4XCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFBydW5hYmxlSGV4LCB0eC5zZXRQcnVuYWJsZUhleCwgdmFsID8gdmFsIDogdW5kZWZpbmVkKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwcnVuZWRfYXNfaGV4XCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFBydW5lZEhleCwgdHguc2V0UHJ1bmVkSGV4LCB2YWwgPyB2YWwgOiB1bmRlZmluZWQpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gcnBjIHR4OiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIFxuICAgIC8vIGxpbmsgYmxvY2sgYW5kIHR4XG4gICAgaWYgKGhlYWRlcikgdHguc2V0QmxvY2sobmV3IE1vbmVyb0Jsb2NrKGhlYWRlcikuc2V0VHhzKFt0eF0pKTtcbiAgICBcbiAgICAvLyBUT0RPIG1vbmVyb2Q6IHVuY29uZmlybWVkIHR4cyBtaXNyZXBvcnQgYmxvY2sgaGVpZ2h0IGFuZCB0aW1lc3RhbXA/XG4gICAgaWYgKHR4LmdldEJsb2NrKCkgJiYgdHguZ2V0QmxvY2soKS5nZXRIZWlnaHQoKSAhPT0gdW5kZWZpbmVkICYmIHR4LmdldEJsb2NrKCkuZ2V0SGVpZ2h0KCkgPT09IHR4LmdldEJsb2NrKCkuZ2V0VGltZXN0YW1wKCkpIHtcbiAgICAgIHR4LnNldEJsb2NrKHVuZGVmaW5lZCk7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgfVxuICAgIFxuICAgIC8vIGluaXRpYWxpemUgcmVtYWluaW5nIGtub3duIGZpZWxkc1xuICAgIGlmICh0eC5nZXRJc0NvbmZpcm1lZCgpKSB7XG4gICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc1JlbGF5ZWQsIHR4LnNldElzUmVsYXllZCwgdHJ1ZSk7XG4gICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRSZWxheSwgdHguc2V0UmVsYXksIHRydWUpO1xuICAgICAgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SXNGYWlsZWQsIHR4LnNldElzRmFpbGVkLCBmYWxzZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHR4LnNldE51bUNvbmZpcm1hdGlvbnMoMCk7XG4gICAgfVxuICAgIGlmICh0eC5nZXRJc0ZhaWxlZCgpID09PSB1bmRlZmluZWQpIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICBpZiAodHguZ2V0T3V0cHV0SW5kaWNlcygpICYmIHR4LmdldE91dHB1dHMoKSkgIHtcbiAgICAgIGFzc2VydC5lcXVhbCh0eC5nZXRPdXRwdXRzKCkubGVuZ3RoLCB0eC5nZXRPdXRwdXRJbmRpY2VzKCkubGVuZ3RoKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdHguZ2V0T3V0cHV0cygpLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHR4LmdldE91dHB1dHMoKVtpXS5zZXRJbmRleCh0eC5nZXRPdXRwdXRJbmRpY2VzKClbaV0pOyAgLy8gdHJhbnNmZXIgb3V0cHV0IGluZGljZXMgdG8gb3V0cHV0c1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAocnBjVHguYXNfanNvbikgTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNUeChKU09OLnBhcnNlKHJwY1R4LmFzX2pzb24pLCB0eCk7XG4gICAgaWYgKHJwY1R4LnR4X2pzb24pIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVHgoSlNPTi5wYXJzZShycGNUeC50eF9qc29uKSwgdHgpO1xuICAgIGlmICghdHguZ2V0SXNSZWxheWVkKCkpIHR4LnNldExhc3RSZWxheWVkVGltZXN0YW1wKHVuZGVmaW5lZCk7ICAvLyBUT0RPIG1vbmVyb2Q6IHJldHVybnMgbGFzdF9yZWxheWVkX3RpbWVzdGFtcCBkZXNwaXRlIHJlbGF5ZWQ6IGZhbHNlLCBzZWxmIGluY29uc2lzdGVudFxuICAgIFxuICAgIC8vIHJldHVybiBidWlsdCB0cmFuc2FjdGlvblxuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjT3V0cHV0KHJwY091dHB1dCwgdHgpIHtcbiAgICBsZXQgb3V0cHV0ID0gbmV3IE1vbmVyb091dHB1dCgpO1xuICAgIG91dHB1dC5zZXRUeCh0eCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY091dHB1dCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNPdXRwdXRba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiZ2VuXCIpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk91dHB1dCB3aXRoICdnZW4nIGZyb20gZGFlbW9uIHJwYyBpcyBtaW5lciB0eCB3aGljaCB3ZSBpZ25vcmUgKGkuZS4gZWFjaCBtaW5lciBpbnB1dCBpcyB1bmRlZmluZWQpXCIpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImtleVwiKSB7XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQob3V0cHV0LCBvdXRwdXQuZ2V0QW1vdW50LCBvdXRwdXQuc2V0QW1vdW50LCBCaWdJbnQodmFsLmFtb3VudCkpO1xuICAgICAgICBHZW5VdGlscy5zYWZlU2V0KG91dHB1dCwgb3V0cHV0LmdldEtleUltYWdlLCBvdXRwdXQuc2V0S2V5SW1hZ2UsIG5ldyBNb25lcm9LZXlJbWFnZSh2YWwua19pbWFnZSkpO1xuICAgICAgICBHZW5VdGlscy5zYWZlU2V0KG91dHB1dCwgb3V0cHV0LmdldFJpbmdPdXRwdXRJbmRpY2VzLCBvdXRwdXQuc2V0UmluZ091dHB1dEluZGljZXMsIHZhbC5rZXlfb2Zmc2V0cyk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50XCIpIEdlblV0aWxzLnNhZmVTZXQob3V0cHV0LCBvdXRwdXQuZ2V0QW1vdW50LCBvdXRwdXQuc2V0QW1vdW50LCBCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidGFyZ2V0XCIpIHtcbiAgICAgICAgbGV0IHB1YktleSA9IHZhbC5rZXkgPT09IHVuZGVmaW5lZCA/IHZhbC50YWdnZWRfa2V5LmtleSA6IHZhbC5rZXk7IC8vIFRPRE8gKG1vbmVyb2QpOiBycGMganNvbiB1c2VzIHt0YWdnZWRfa2V5PXtrZXk9Li4ufX0sIGJpbmFyeSBibG9ja3MgdXNlIHtrZXk9Li4ufVxuICAgICAgICBHZW5VdGlscy5zYWZlU2V0KG91dHB1dCwgb3V0cHV0LmdldFN0ZWFsdGhQdWJsaWNLZXksIG91dHB1dC5zZXRTdGVhbHRoUHVibGljS2V5LCBwdWJLZXkpO1xuICAgICAgfVxuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgb3V0cHV0OiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBvdXRwdXQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY0Jsb2NrVGVtcGxhdGUocnBjVGVtcGxhdGUpIHtcbiAgICBsZXQgdGVtcGxhdGUgPSBuZXcgTW9uZXJvQmxvY2tUZW1wbGF0ZSgpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNUZW1wbGF0ZSkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNUZW1wbGF0ZVtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJibG9ja2hhc2hpbmdfYmxvYlwiKSB0ZW1wbGF0ZS5zZXRCbG9ja1RlbXBsYXRlQmxvYih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrdGVtcGxhdGVfYmxvYlwiKSB0ZW1wbGF0ZS5zZXRCbG9ja0hhc2hpbmdCbG9iKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGlmZmljdWx0eVwiKSB0ZW1wbGF0ZS5zZXREaWZmaWN1bHR5KEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJleHBlY3RlZF9yZXdhcmRcIikgdGVtcGxhdGUuc2V0RXhwZWN0ZWRSZXdhcmQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5XCIpIHsgfSAgLy8gaGFuZGxlZCBieSB3aWRlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5X3RvcDY0XCIpIHsgfSAgLy8gaGFuZGxlZCBieSB3aWRlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3aWRlX2RpZmZpY3VsdHlcIikgdGVtcGxhdGUuc2V0RGlmZmljdWx0eShHZW5VdGlscy5yZWNvbmNpbGUodGVtcGxhdGUuZ2V0RGlmZmljdWx0eSgpLCBNb25lcm9EYWVtb25ScGMucHJlZml4ZWRIZXhUb0JJKHZhbCkpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJoZWlnaHRcIikgdGVtcGxhdGUuc2V0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHJldl9oYXNoXCIpIHRlbXBsYXRlLnNldFByZXZIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVzZXJ2ZWRfb2Zmc2V0XCIpIHRlbXBsYXRlLnNldFJlc2VydmVkT2Zmc2V0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3RhdHVzXCIpIHt9ICAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVudHJ1c3RlZFwiKSB7fSAgLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzZWVkX2hlaWdodFwiKSB0ZW1wbGF0ZS5zZXRTZWVkSGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic2VlZF9oYXNoXCIpIHRlbXBsYXRlLnNldFNlZWRIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibmV4dF9zZWVkX2hhc2hcIikgdGVtcGxhdGUuc2V0TmV4dFNlZWRIYXNoKHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBibG9jayB0ZW1wbGF0ZTogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICBpZiAoXCJcIiA9PT0gdGVtcGxhdGUuZ2V0TmV4dFNlZWRIYXNoKCkpIHRlbXBsYXRlLnNldE5leHRTZWVkSGFzaCh1bmRlZmluZWQpO1xuICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjSW5mbyhycGNJbmZvKSB7XG4gICAgaWYgKCFycGNJbmZvKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIGxldCBpbmZvID0gbmV3IE1vbmVyb0RhZW1vbkluZm8oKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjSW5mbykpIHtcbiAgICAgIGxldCB2YWwgPSBycGNJbmZvW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcInZlcnNpb25cIikgaW5mby5zZXRWZXJzaW9uKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYWx0X2Jsb2Nrc19jb3VudFwiKSBpbmZvLnNldE51bUFsdEJsb2Nrcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX3NpemVfbGltaXRcIikgaW5mby5zZXRCbG9ja1NpemVMaW1pdCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX3NpemVfbWVkaWFuXCIpIGluZm8uc2V0QmxvY2tTaXplTWVkaWFuKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfd2VpZ2h0X2xpbWl0XCIpIGluZm8uc2V0QmxvY2tXZWlnaHRMaW1pdCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX3dlaWdodF9tZWRpYW5cIikgaW5mby5zZXRCbG9ja1dlaWdodE1lZGlhbih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJvb3RzdHJhcF9kYWVtb25fYWRkcmVzc1wiKSB7IGlmICh2YWwpIGluZm8uc2V0Qm9vdHN0cmFwRGFlbW9uQWRkcmVzcyh2YWwpOyB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGlmZmljdWx0eVwiKSB7IH0gIC8vIGhhbmRsZWQgYnkgd2lkZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3VtdWxhdGl2ZV9kaWZmaWN1bHR5XCIpIHsgfSAvLyBoYW5kbGVkIGJ5IHdpZGVfY3VtdWxhdGl2ZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGlmZmljdWx0eV90b3A2NFwiKSB7IH0gIC8vIGhhbmRsZWQgYnkgd2lkZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3VtdWxhdGl2ZV9kaWZmaWN1bHR5X3RvcDY0XCIpIHsgfSAvLyBoYW5kbGVkIGJ5IHdpZGVfY3VtdWxhdGl2ZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2lkZV9kaWZmaWN1bHR5XCIpIGluZm8uc2V0RGlmZmljdWx0eShHZW5VdGlscy5yZWNvbmNpbGUoaW5mby5nZXREaWZmaWN1bHR5KCksIE1vbmVyb0RhZW1vblJwYy5wcmVmaXhlZEhleFRvQkkodmFsKSkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndpZGVfY3VtdWxhdGl2ZV9kaWZmaWN1bHR5XCIpIGluZm8uc2V0Q3VtdWxhdGl2ZURpZmZpY3VsdHkoR2VuVXRpbHMucmVjb25jaWxlKGluZm8uZ2V0Q3VtdWxhdGl2ZURpZmZpY3VsdHkoKSwgTW9uZXJvRGFlbW9uUnBjLnByZWZpeGVkSGV4VG9CSSh2YWwpKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZnJlZV9zcGFjZVwiKSBpbmZvLnNldEZyZWVTcGFjZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGF0YWJhc2Vfc2l6ZVwiKSBpbmZvLnNldERhdGFiYXNlU2l6ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImdyZXlfcGVlcmxpc3Rfc2l6ZVwiKSBpbmZvLnNldE51bU9mZmxpbmVQZWVycyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhlaWdodFwiKSBpbmZvLnNldEhlaWdodCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhlaWdodF93aXRob3V0X2Jvb3RzdHJhcFwiKSBpbmZvLnNldEhlaWdodFdpdGhvdXRCb290c3RyYXAodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJpbmNvbWluZ19jb25uZWN0aW9uc19jb3VudFwiKSBpbmZvLnNldE51bUluY29taW5nQ29ubmVjdGlvbnModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJvZmZsaW5lXCIpIGluZm8uc2V0SXNPZmZsaW5lKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwib3V0Z29pbmdfY29ubmVjdGlvbnNfY291bnRcIikgaW5mby5zZXROdW1PdXRnb2luZ0Nvbm5lY3Rpb25zKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicnBjX2Nvbm5lY3Rpb25zX2NvdW50XCIpIGluZm8uc2V0TnVtUnBjQ29ubmVjdGlvbnModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGFydF90aW1lXCIpIGluZm8uc2V0U3RhcnRUaW1lc3RhbXAodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhZGp1c3RlZF90aW1lXCIpIGluZm8uc2V0QWRqdXN0ZWRUaW1lc3RhbXAodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGF0dXNcIikge30gIC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidGFyZ2V0XCIpIGluZm8uc2V0VGFyZ2V0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidGFyZ2V0X2hlaWdodFwiKSBpbmZvLnNldFRhcmdldEhlaWdodCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRvcF9ibG9ja19oYXNoXCIpIGluZm8uc2V0VG9wQmxvY2tIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfY291bnRcIikgaW5mby5zZXROdW1UeHModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9wb29sX3NpemVcIikgaW5mby5zZXROdW1UeHNQb29sKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW50cnVzdGVkXCIpIHt9IC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2FzX2Jvb3RzdHJhcF9ldmVyX3VzZWRcIikgaW5mby5zZXRXYXNCb290c3RyYXBFdmVyVXNlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndoaXRlX3BlZXJsaXN0X3NpemVcIikgaW5mby5zZXROdW1PbmxpbmVQZWVycyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVwZGF0ZV9hdmFpbGFibGVcIikgaW5mby5zZXRVcGRhdGVBdmFpbGFibGUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJuZXR0eXBlXCIpIEdlblV0aWxzLnNhZmVTZXQoaW5mbywgaW5mby5nZXROZXR3b3JrVHlwZSwgaW5mby5zZXROZXR3b3JrVHlwZSwgTW9uZXJvTmV0d29ya1R5cGUucGFyc2UodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibWFpbm5ldFwiKSB7IGlmICh2YWwpIEdlblV0aWxzLnNhZmVTZXQoaW5mbywgaW5mby5nZXROZXR3b3JrVHlwZSwgaW5mby5zZXROZXR3b3JrVHlwZSwgTW9uZXJvTmV0d29ya1R5cGUuTUFJTk5FVCk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0ZXN0bmV0XCIpIHsgaWYgKHZhbCkgR2VuVXRpbHMuc2FmZVNldChpbmZvLCBpbmZvLmdldE5ldHdvcmtUeXBlLCBpbmZvLnNldE5ldHdvcmtUeXBlLCBNb25lcm9OZXR3b3JrVHlwZS5URVNUTkVUKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YWdlbmV0XCIpIHsgaWYgKHZhbCkgR2VuVXRpbHMuc2FmZVNldChpbmZvLCBpbmZvLmdldE5ldHdvcmtUeXBlLCBpbmZvLnNldE5ldHdvcmtUeXBlLCBNb25lcm9OZXR3b3JrVHlwZS5TVEFHRU5FVCk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjcmVkaXRzXCIpIGluZm8uc2V0Q3JlZGl0cyhCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidG9wX2Jsb2NrX2hhc2hcIiB8fCBrZXkgPT09IFwidG9wX2hhc2hcIikgaW5mby5zZXRUb3BCbG9ja0hhc2goR2VuVXRpbHMucmVjb25jaWxlKGluZm8uZ2V0VG9wQmxvY2tIYXNoKCksIFwiXCIgPT09IHZhbCA/IHVuZGVmaW5lZCA6IHZhbCkpXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYnVzeV9zeW5jaW5nXCIpIGluZm8uc2V0SXNCdXN5U3luY2luZyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN5bmNocm9uaXplZFwiKSBpbmZvLnNldElzU3luY2hyb25pemVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVzdHJpY3RlZFwiKSBpbmZvLnNldElzUmVzdHJpY3RlZCh2YWwpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IElnbm9yaW5nIHVuZXhwZWN0ZWQgaW5mbyBmaWVsZDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gaW5mbztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHN5bmMgaW5mbyBmcm9tIFJQQyBzeW5jIGluZm8uXG4gICAqIFxuICAgKiBAcGFyYW0gcnBjU3luY0luZm8gLSBycGMgbWFwIHRvIGluaXRpYWxpemUgdGhlIHN5bmMgaW5mbyBmcm9tXG4gICAqIEByZXR1cm4ge01vbmVyb0RhZW1vblN5bmNJbmZvfSBpcyBzeW5jIGluZm8gaW5pdGlhbGl6ZWQgZnJvbSB0aGUgbWFwXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNTeW5jSW5mbyhycGNTeW5jSW5mbykge1xuICAgIGxldCBzeW5jSW5mbyA9IG5ldyBNb25lcm9EYWVtb25TeW5jSW5mbygpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNTeW5jSW5mbykpIHtcbiAgICAgIGxldCB2YWwgPSBycGNTeW5jSW5mb1trZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJoZWlnaHRcIikgc3luY0luZm8uc2V0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicGVlcnNcIikge1xuICAgICAgICBzeW5jSW5mby5zZXRQZWVycyhbXSk7XG4gICAgICAgIGxldCBycGNDb25uZWN0aW9ucyA9IHZhbDtcbiAgICAgICAgZm9yIChsZXQgcnBjQ29ubmVjdGlvbiBvZiBycGNDb25uZWN0aW9ucykge1xuICAgICAgICAgIHN5bmNJbmZvLmdldFBlZXJzKCkucHVzaChNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Nvbm5lY3Rpb24ocnBjQ29ubmVjdGlvbi5pbmZvKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzcGFuc1wiKSB7XG4gICAgICAgIHN5bmNJbmZvLnNldFNwYW5zKFtdKTtcbiAgICAgICAgbGV0IHJwY1NwYW5zID0gdmFsO1xuICAgICAgICBmb3IgKGxldCBycGNTcGFuIG9mIHJwY1NwYW5zKSB7XG4gICAgICAgICAgc3luY0luZm8uZ2V0U3BhbnMoKS5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQ29ubmVjdGlvblNwYW4ocnBjU3BhbikpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGtleSA9PT0gXCJzdGF0dXNcIikge30gICAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRhcmdldF9oZWlnaHRcIikgc3luY0luZm8uc2V0VGFyZ2V0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibmV4dF9uZWVkZWRfcHJ1bmluZ19zZWVkXCIpIHN5bmNJbmZvLnNldE5leHROZWVkZWRQcnVuaW5nU2VlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm92ZXJ2aWV3XCIpIHsgIC8vIHRoaXMgcmV0dXJucyBbXSB3aXRob3V0IHBydW5pbmdcbiAgICAgICAgbGV0IG92ZXJ2aWV3O1xuICAgICAgICB0cnkge1xuICAgICAgICAgIG92ZXJ2aWV3ID0gSlNPTi5wYXJzZSh2YWwpO1xuICAgICAgICAgIGlmIChvdmVydmlldyAhPT0gdW5kZWZpbmVkICYmIG92ZXJ2aWV3Lmxlbmd0aCA+IDApIGNvbnNvbGUuZXJyb3IoXCJJZ25vcmluZyBub24tZW1wdHkgJ292ZXJ2aWV3JyBmaWVsZCAobm90IGltcGxlbWVudGVkKTogXCIgKyBvdmVydmlldyk7IC8vIFRPRE9cbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBwYXJzZSAnb3ZlcnZpZXcnIGZpZWxkOiBcIiArIG92ZXJ2aWV3ICsgXCI6IFwiICsgZS5tZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNyZWRpdHNcIikgc3luY0luZm8uc2V0Q3JlZGl0cyhCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidG9wX2hhc2hcIikgc3luY0luZm8uc2V0VG9wQmxvY2tIYXNoKFwiXCIgPT09IHZhbCA/IHVuZGVmaW5lZCA6IHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW50cnVzdGVkXCIpIHt9ICAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gc3luYyBpbmZvOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBzeW5jSW5mbztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjSGFyZEZvcmtJbmZvKHJwY0hhcmRGb3JrSW5mbykge1xuICAgIGxldCBpbmZvID0gbmV3IE1vbmVyb0hhcmRGb3JrSW5mbygpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNIYXJkRm9ya0luZm8pKSB7XG4gICAgICBsZXQgdmFsID0gcnBjSGFyZEZvcmtJbmZvW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImVhcmxpZXN0X2hlaWdodFwiKSBpbmZvLnNldEVhcmxpZXN0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZW5hYmxlZFwiKSBpbmZvLnNldElzRW5hYmxlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXRlXCIpIGluZm8uc2V0U3RhdGUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGF0dXNcIikge30gICAgIC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW50cnVzdGVkXCIpIHt9ICAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRocmVzaG9sZFwiKSBpbmZvLnNldFRocmVzaG9sZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInZlcnNpb25cIikgaW5mby5zZXRWZXJzaW9uKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidm90ZXNcIikgaW5mby5zZXROdW1Wb3Rlcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInZvdGluZ1wiKSBpbmZvLnNldFZvdGluZyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndpbmRvd1wiKSBpbmZvLnNldFdpbmRvdyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNyZWRpdHNcIikgaW5mby5zZXRDcmVkaXRzKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0b3BfaGFzaFwiKSBpbmZvLnNldFRvcEJsb2NrSGFzaChcIlwiID09PSB2YWwgPyB1bmRlZmluZWQgOiB2YWwpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gaGFyZCBmb3JrIGluZm86IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIGluZm87XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY0Nvbm5lY3Rpb25TcGFuKHJwY0Nvbm5lY3Rpb25TcGFuKSB7XG4gICAgbGV0IHNwYW4gPSBuZXcgTW9uZXJvQ29ubmVjdGlvblNwYW4oKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjQ29ubmVjdGlvblNwYW4pKSB7XG4gICAgICBsZXQgdmFsID0gcnBjQ29ubmVjdGlvblNwYW5ba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiY29ubmVjdGlvbl9pZFwiKSBzcGFuLnNldENvbm5lY3Rpb25JZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm5ibG9ja3NcIikgc3Bhbi5zZXROdW1CbG9ja3ModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyYXRlXCIpIHNwYW4uc2V0UmF0ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJlbW90ZV9hZGRyZXNzXCIpIHsgaWYgKHZhbCAhPT0gXCJcIikgc3Bhbi5zZXRSZW1vdGVBZGRyZXNzKHZhbCk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzaXplXCIpIHNwYW4uc2V0U2l6ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNwZWVkXCIpIHNwYW4uc2V0U3BlZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGFydF9ibG9ja19oZWlnaHRcIikgc3Bhbi5zZXRTdGFydEhlaWdodCh2YWwpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gZGFlbW9uIGNvbm5lY3Rpb24gc3BhbjogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gc3BhbjtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjT3V0cHV0SGlzdG9ncmFtRW50cnkocnBjRW50cnkpIHtcbiAgICBsZXQgZW50cnkgPSBuZXcgTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjRW50cnkpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjRW50cnlba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYW1vdW50XCIpIGVudHJ5LnNldEFtb3VudChCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidG90YWxfaW5zdGFuY2VzXCIpIGVudHJ5LnNldE51bUluc3RhbmNlcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVubG9ja2VkX2luc3RhbmNlc1wiKSBlbnRyeS5zZXROdW1VbmxvY2tlZEluc3RhbmNlcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJlY2VudF9pbnN0YW5jZXNcIikgZW50cnkuc2V0TnVtUmVjZW50SW5zdGFuY2VzKHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBvdXRwdXQgaGlzdG9ncmFtOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBlbnRyeTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjU3VibWl0VHhSZXN1bHQocnBjUmVzdWx0KSB7XG4gICAgYXNzZXJ0KHJwY1Jlc3VsdCk7XG4gICAgbGV0IHJlc3VsdCA9IG5ldyBNb25lcm9TdWJtaXRUeFJlc3VsdCgpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNSZXN1bHQpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjUmVzdWx0W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImRvdWJsZV9zcGVuZFwiKSByZXN1bHQuc2V0SXNEb3VibGVTcGVuZFNlZW4odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmZWVfdG9vX2xvd1wiKSByZXN1bHQuc2V0SXNGZWVUb29Mb3codmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJpbnZhbGlkX2lucHV0XCIpIHJlc3VsdC5zZXRIYXNJbnZhbGlkSW5wdXQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJpbnZhbGlkX291dHB1dFwiKSByZXN1bHQuc2V0SGFzSW52YWxpZE91dHB1dCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRvb19mZXdfb3V0cHV0c1wiKSByZXN1bHQuc2V0SGFzVG9vRmV3T3V0cHV0cyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxvd19taXhpblwiKSByZXN1bHQuc2V0SXNNaXhpblRvb0xvdyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm5vdF9yZWxheWVkXCIpIHJlc3VsdC5zZXRJc1JlbGF5ZWQoIXZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwib3ZlcnNwZW5kXCIpIHJlc3VsdC5zZXRJc092ZXJzcGVuZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJlYXNvblwiKSByZXN1bHQuc2V0UmVhc29uKHZhbCA9PT0gXCJcIiA/IHVuZGVmaW5lZCA6IHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidG9vX2JpZ1wiKSByZXN1bHQuc2V0SXNUb29CaWcodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzYW5pdHlfY2hlY2tfZmFpbGVkXCIpIHJlc3VsdC5zZXRTYW5pdHlDaGVja0ZhaWxlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNyZWRpdHNcIikgcmVzdWx0LnNldENyZWRpdHMoQmlnSW50KHZhbCkpXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3RhdHVzXCIgfHwga2V5ID09PSBcInVudHJ1c3RlZFwiKSB7fSAgLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0b3BfaGFzaFwiKSByZXN1bHQuc2V0VG9wQmxvY2tIYXNoKFwiXCIgPT09IHZhbCA/IHVuZGVmaW5lZCA6IHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfZXh0cmFfdG9vX2JpZ1wiKSByZXN1bHQuc2V0SXNUeEV4dHJhVG9vQmlnKHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBzdWJtaXQgdHggaGV4IHJlc3VsdDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNUeFBvb2xTdGF0cyhycGNTdGF0cykge1xuICAgIGFzc2VydChycGNTdGF0cyk7XG4gICAgbGV0IHN0YXRzID0gbmV3IE1vbmVyb1R4UG9vbFN0YXRzKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1N0YXRzKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1N0YXRzW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImJ5dGVzX21heFwiKSBzdGF0cy5zZXRCeXRlc01heCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJ5dGVzX21lZFwiKSBzdGF0cy5zZXRCeXRlc01lZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJ5dGVzX21pblwiKSBzdGF0cy5zZXRCeXRlc01pbih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJ5dGVzX3RvdGFsXCIpIHN0YXRzLnNldEJ5dGVzVG90YWwodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJoaXN0b185OHBjXCIpIHN0YXRzLnNldEhpc3RvOThwYyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm51bV8xMG1cIikgc3RhdHMuc2V0TnVtMTBtKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibnVtX2RvdWJsZV9zcGVuZHNcIikgc3RhdHMuc2V0TnVtRG91YmxlU3BlbmRzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibnVtX2ZhaWxpbmdcIikgc3RhdHMuc2V0TnVtRmFpbGluZyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm51bV9ub3RfcmVsYXllZFwiKSBzdGF0cy5zZXROdW1Ob3RSZWxheWVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwib2xkZXN0XCIpIHN0YXRzLnNldE9sZGVzdFRpbWVzdGFtcCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4c190b3RhbFwiKSBzdGF0cy5zZXROdW1UeHModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmZWVfdG90YWxcIikgc3RhdHMuc2V0RmVlVG90YWwoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhpc3RvXCIpIHtcbiAgICAgICAgc3RhdHMuc2V0SGlzdG8obmV3IE1hcCgpKTtcbiAgICAgICAgZm9yIChsZXQgZWxlbSBvZiB2YWwpIHN0YXRzLmdldEhpc3RvKCkuc2V0KGVsZW0uYnl0ZXMsIGVsZW0udHhzKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIHR4IHBvb2wgc3RhdHM6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG5cbiAgICAvLyB1bmluaXRpYWxpemUgc29tZSBzdGF0cyBpZiBub3QgYXBwbGljYWJsZVxuICAgIGlmIChzdGF0cy5nZXRIaXN0bzk4cGMoKSA9PT0gMCkgc3RhdHMuc2V0SGlzdG85OHBjKHVuZGVmaW5lZCk7XG4gICAgaWYgKHN0YXRzLmdldE51bVR4cygpID09PSAwKSB7XG4gICAgICBzdGF0cy5zZXRCeXRlc01pbih1bmRlZmluZWQpO1xuICAgICAgc3RhdHMuc2V0Qnl0ZXNNZWQodW5kZWZpbmVkKTtcbiAgICAgIHN0YXRzLnNldEJ5dGVzTWF4KHVuZGVmaW5lZCk7XG4gICAgICBzdGF0cy5zZXRIaXN0bzk4cGModW5kZWZpbmVkKTtcbiAgICAgIHN0YXRzLnNldE9sZGVzdFRpbWVzdGFtcCh1bmRlZmluZWQpO1xuICAgIH1cblxuICAgIHJldHVybiBzdGF0cztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjQWx0Q2hhaW4ocnBjQ2hhaW4pIHtcbiAgICBhc3NlcnQocnBjQ2hhaW4pO1xuICAgIGxldCBjaGFpbiA9IG5ldyBNb25lcm9BbHRDaGFpbigpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNDaGFpbikpIHtcbiAgICAgIGxldCB2YWwgPSBycGNDaGFpbltrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJibG9ja19oYXNoXCIpIHt9ICAvLyB1c2luZyBibG9ja19oYXNoZXMgaW5zdGVhZFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRpZmZpY3VsdHlcIikgeyB9IC8vIGhhbmRsZWQgYnkgd2lkZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGlmZmljdWx0eV90b3A2NFwiKSB7IH0gIC8vIGhhbmRsZWQgYnkgd2lkZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2lkZV9kaWZmaWN1bHR5XCIpIGNoYWluLnNldERpZmZpY3VsdHkoR2VuVXRpbHMucmVjb25jaWxlKGNoYWluLmdldERpZmZpY3VsdHkoKSwgTW9uZXJvRGFlbW9uUnBjLnByZWZpeGVkSGV4VG9CSSh2YWwpKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGVpZ2h0XCIpIGNoYWluLnNldEhlaWdodCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxlbmd0aFwiKSBjaGFpbi5zZXRMZW5ndGgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja19oYXNoZXNcIikgY2hhaW4uc2V0QmxvY2tIYXNoZXModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtYWluX2NoYWluX3BhcmVudF9ibG9ja1wiKSBjaGFpbi5zZXRNYWluQ2hhaW5QYXJlbnRCbG9ja0hhc2godmFsKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIGFsdGVybmF0aXZlIGNoYWluOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBjaGFpbjtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjUGVlcihycGNQZWVyKSB7XG4gICAgYXNzZXJ0KHJwY1BlZXIpO1xuICAgIGxldCBwZWVyID0gbmV3IE1vbmVyb1BlZXIoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjUGVlcikpIHtcbiAgICAgIGxldCB2YWwgPSBycGNQZWVyW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImhvc3RcIikgcGVlci5zZXRIb3N0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaWRcIikgcGVlci5zZXRJZChcIlwiICsgdmFsKTsgIC8vIFRPRE8gbW9uZXJvLXdhbGxldC1ycGM6IHBlZXIgaWQgaXMgQmlnSW50IGJ1dCBzdHJpbmcgaW4gYGdldF9jb25uZWN0aW9uc2BcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJpcFwiKSB7fSAvLyBob3N0IHVzZWQgaW5zdGVhZCB3aGljaCBpcyBjb25zaXN0ZW50bHkgYSBzdHJpbmdcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsYXN0X3NlZW5cIikgcGVlci5zZXRMYXN0U2VlblRpbWVzdGFtcCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBvcnRcIikgcGVlci5zZXRQb3J0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicnBjX3BvcnRcIikgcGVlci5zZXRScGNQb3J0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHJ1bmluZ19zZWVkXCIpIHBlZXIuc2V0UHJ1bmluZ1NlZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJycGNfY3JlZGl0c19wZXJfaGFzaFwiKSBwZWVyLnNldFJwY0NyZWRpdHNQZXJIYXNoKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIHJwYyBwZWVyOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBwZWVyO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNDb25uZWN0aW9uKHJwY0Nvbm5lY3Rpb24pIHtcbiAgICBsZXQgcGVlciA9IG5ldyBNb25lcm9QZWVyKCk7XG4gICAgcGVlci5zZXRJc09ubGluZSh0cnVlKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjQ29ubmVjdGlvbikpIHtcbiAgICAgIGxldCB2YWwgPSBycGNDb25uZWN0aW9uW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImFkZHJlc3NcIikgcGVlci5zZXRBZGRyZXNzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYXZnX2Rvd25sb2FkXCIpIHBlZXIuc2V0QXZnRG93bmxvYWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhdmdfdXBsb2FkXCIpIHBlZXIuc2V0QXZnVXBsb2FkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY29ubmVjdGlvbl9pZFwiKSBwZWVyLnNldElkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3VycmVudF9kb3dubG9hZFwiKSBwZWVyLnNldEN1cnJlbnREb3dubG9hZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImN1cnJlbnRfdXBsb2FkXCIpIHBlZXIuc2V0Q3VycmVudFVwbG9hZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhlaWdodFwiKSBwZWVyLnNldEhlaWdodCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhvc3RcIikgcGVlci5zZXRIb3N0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaXBcIikge30gLy8gaG9zdCB1c2VkIGluc3RlYWQgd2hpY2ggaXMgY29uc2lzdGVudGx5IGEgc3RyaW5nXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaW5jb21pbmdcIikgcGVlci5zZXRJc0luY29taW5nKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibGl2ZV90aW1lXCIpIHBlZXIuc2V0TGl2ZVRpbWUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsb2NhbF9pcFwiKSBwZWVyLnNldElzTG9jYWxJcCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxvY2FsaG9zdFwiKSBwZWVyLnNldElzTG9jYWxIb3N0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicGVlcl9pZFwiKSBwZWVyLnNldElkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicG9ydFwiKSBwZWVyLnNldFBvcnQocGFyc2VJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicnBjX3BvcnRcIikgcGVlci5zZXRScGNQb3J0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVjdl9jb3VudFwiKSBwZWVyLnNldE51bVJlY2VpdmVzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVjdl9pZGxlX3RpbWVcIikgcGVlci5zZXRSZWNlaXZlSWRsZVRpbWUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzZW5kX2NvdW50XCIpIHBlZXIuc2V0TnVtU2VuZHModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzZW5kX2lkbGVfdGltZVwiKSBwZWVyLnNldFNlbmRJZGxlVGltZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXRlXCIpIHBlZXIuc2V0U3RhdGUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdXBwb3J0X2ZsYWdzXCIpIHBlZXIuc2V0TnVtU3VwcG9ydEZsYWdzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHJ1bmluZ19zZWVkXCIpIHBlZXIuc2V0UHJ1bmluZ1NlZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJycGNfY3JlZGl0c19wZXJfaGFzaFwiKSBwZWVyLnNldFJwY0NyZWRpdHNQZXJIYXNoKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhZGRyZXNzX3R5cGVcIikgcGVlci5zZXRUeXBlKHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBwZWVyOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBwZWVyO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRUb1JwY0JhbihiYW46IE1vbmVyb0Jhbikge1xuICAgIGxldCBycGNCYW46IGFueSA9IHt9O1xuICAgIHJwY0Jhbi5ob3N0ID0gYmFuLmdldEhvc3QoKTtcbiAgICBycGNCYW4uaXAgPSBiYW4uZ2V0SXAoKTtcbiAgICBycGNCYW4uYmFuID0gYmFuLmdldElzQmFubmVkKCk7XG4gICAgcnBjQmFuLnNlY29uZHMgPSBiYW4uZ2V0U2Vjb25kcygpO1xuICAgIHJldHVybiBycGNCYW47XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY01pbmluZ1N0YXR1cyhycGNTdGF0dXMpIHtcbiAgICBsZXQgc3RhdHVzID0gbmV3IE1vbmVyb01pbmluZ1N0YXR1cygpO1xuICAgIHN0YXR1cy5zZXRJc0FjdGl2ZShycGNTdGF0dXMuYWN0aXZlKTtcbiAgICBzdGF0dXMuc2V0U3BlZWQocnBjU3RhdHVzLnNwZWVkKTtcbiAgICBzdGF0dXMuc2V0TnVtVGhyZWFkcyhycGNTdGF0dXMudGhyZWFkc19jb3VudCk7XG4gICAgaWYgKHJwY1N0YXR1cy5hY3RpdmUpIHtcbiAgICAgIHN0YXR1cy5zZXRBZGRyZXNzKHJwY1N0YXR1cy5hZGRyZXNzKTtcbiAgICAgIHN0YXR1cy5zZXRJc0JhY2tncm91bmQocnBjU3RhdHVzLmlzX2JhY2tncm91bmRfbWluaW5nX2VuYWJsZWQpO1xuICAgIH1cbiAgICByZXR1cm4gc3RhdHVzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNVcGRhdGVDaGVja1Jlc3VsdChycGNSZXN1bHQpIHtcbiAgICBhc3NlcnQocnBjUmVzdWx0KTtcbiAgICBsZXQgcmVzdWx0ID0gbmV3IE1vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0KCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1Jlc3VsdCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNSZXN1bHRba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYXV0b191cmlcIikgcmVzdWx0LnNldEF1dG9VcmkodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJoYXNoXCIpIHJlc3VsdC5zZXRIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicGF0aFwiKSB7fSAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXR1c1wiKSB7fSAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVwZGF0ZVwiKSByZXN1bHQuc2V0SXNVcGRhdGVBdmFpbGFibGUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1c2VyX3VyaVwiKSByZXN1bHQuc2V0VXNlclVyaSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInZlcnNpb25cIikgcmVzdWx0LnNldFZlcnNpb24odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bnRydXN0ZWRcIikge30gLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIHJwYyBjaGVjayB1cGRhdGUgcmVzdWx0OiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIGlmIChyZXN1bHQuZ2V0QXV0b1VyaSgpID09PSBcIlwiKSByZXN1bHQuc2V0QXV0b1VyaSh1bmRlZmluZWQpO1xuICAgIGlmIChyZXN1bHQuZ2V0VXNlclVyaSgpID09PSBcIlwiKSByZXN1bHQuc2V0VXNlclVyaSh1bmRlZmluZWQpO1xuICAgIGlmIChyZXN1bHQuZ2V0VmVyc2lvbigpID09PSBcIlwiKSByZXN1bHQuc2V0VmVyc2lvbih1bmRlZmluZWQpO1xuICAgIGlmIChyZXN1bHQuZ2V0SGFzaCgpID09PSBcIlwiKSByZXN1bHQuc2V0SGFzaCh1bmRlZmluZWQpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1VwZGF0ZURvd25sb2FkUmVzdWx0KHJwY1Jlc3VsdCkge1xuICAgIGxldCByZXN1bHQgPSBuZXcgTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQoTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNVcGRhdGVDaGVja1Jlc3VsdChycGNSZXN1bHQpIGFzIE1vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0KTtcbiAgICByZXN1bHQuc2V0RG93bmxvYWRQYXRoKHJwY1Jlc3VsdFtcInBhdGhcIl0pO1xuICAgIGlmIChyZXN1bHQuZ2V0RG93bmxvYWRQYXRoKCkgPT09IFwiXCIpIHJlc3VsdC5zZXREb3dubG9hZFBhdGgodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGEgJzB4JyBwcmVmaXhlZCBoZXhpZGVjaW1hbCBzdHJpbmcgdG8gYSBiaWdpbnQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gaGV4IGlzIHRoZSAnMHgnIHByZWZpeGVkIGhleGlkZWNpbWFsIHN0cmluZyB0byBjb252ZXJ0XG4gICAqIEByZXR1cm4ge2JpZ2ludH0gdGhlIGhleGljZWRpbWFsIGNvbnZlcnRlZCB0byBkZWNpbWFsXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIHByZWZpeGVkSGV4VG9CSShoZXgpIHtcbiAgICBhc3NlcnQoaGV4LnN1YnN0cmluZygwLCAyKSA9PT0gXCIweFwiKTtcbiAgICByZXR1cm4gQmlnSW50KGhleCk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbXBsZW1lbnRzIGEgTW9uZXJvRGFlbW9uIGJ5IHByb3h5aW5nIHJlcXVlc3RzIHRvIGEgd29ya2VyLlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBNb25lcm9EYWVtb25ScGNQcm94eSB7XG5cbiAgLy8gc3RhdGUgdmFyaWFibGVzXG4gIHByaXZhdGUgZGFlbW9uSWQ6IGFueTtcbiAgcHJpdmF0ZSB3b3JrZXI6IGFueTtcbiAgcHJpdmF0ZSB3cmFwcGVkTGlzdGVuZXJzOiBhbnk7XG4gIHByaXZhdGUgcHJvY2VzczogYW55O1xuXG4gIGNvbnN0cnVjdG9yKGRhZW1vbklkLCB3b3JrZXIpIHtcbiAgICB0aGlzLmRhZW1vbklkID0gZGFlbW9uSWQ7XG4gICAgdGhpcy53b3JrZXIgPSB3b3JrZXI7XG4gICAgdGhpcy53cmFwcGVkTGlzdGVuZXJzID0gW107XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBTVEFUSUMgVVRJTElUSUVTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICBzdGF0aWMgYXN5bmMgY29ubmVjdChjb25maWcpIHtcbiAgICBsZXQgZGFlbW9uSWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgY29uZmlnID0gT2JqZWN0LmFzc2lnbih7fSwgY29uZmlnLCB7cHJveHlUb1dvcmtlcjogZmFsc2V9KTtcbiAgICBhd2FpdCBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKGRhZW1vbklkLCBcImNvbm5lY3REYWVtb25ScGNcIiwgW2NvbmZpZ10pO1xuICAgIHJldHVybiBuZXcgTW9uZXJvRGFlbW9uUnBjUHJveHkoZGFlbW9uSWQsIGF3YWl0IExpYnJhcnlVdGlscy5nZXRXb3JrZXIoKSk7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gSU5TVEFOQ0UgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICBhc3luYyBhZGRMaXN0ZW5lcihsaXN0ZW5lcikge1xuICAgIGxldCB3cmFwcGVkTGlzdGVuZXIgPSBuZXcgRGFlbW9uV29ya2VyTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIGxldCBsaXN0ZW5lcklkID0gd3JhcHBlZExpc3RlbmVyLmdldElkKCk7XG4gICAgTGlicmFyeVV0aWxzLmFkZFdvcmtlckNhbGxiYWNrKHRoaXMuZGFlbW9uSWQsIFwib25CbG9ja0hlYWRlcl9cIiArIGxpc3RlbmVySWQsIFt3cmFwcGVkTGlzdGVuZXIub25CbG9ja0hlYWRlciwgd3JhcHBlZExpc3RlbmVyXSk7XG4gICAgdGhpcy53cmFwcGVkTGlzdGVuZXJzLnB1c2god3JhcHBlZExpc3RlbmVyKTtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25BZGRMaXN0ZW5lclwiLCBbbGlzdGVuZXJJZF0pO1xuICB9XG4gIFxuICBhc3luYyByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcikge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53cmFwcGVkTGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodGhpcy53cmFwcGVkTGlzdGVuZXJzW2ldLmdldExpc3RlbmVyKCkgPT09IGxpc3RlbmVyKSB7XG4gICAgICAgIGxldCBsaXN0ZW5lcklkID0gdGhpcy53cmFwcGVkTGlzdGVuZXJzW2ldLmdldElkKCk7XG4gICAgICAgIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uUmVtb3ZlTGlzdGVuZXJcIiwgW2xpc3RlbmVySWRdKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnJlbW92ZVdvcmtlckNhbGxiYWNrKHRoaXMuZGFlbW9uSWQsIFwib25CbG9ja0hlYWRlcl9cIiArIGxpc3RlbmVySWQpO1xuICAgICAgICB0aGlzLndyYXBwZWRMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkxpc3RlbmVyIGlzIG5vdCByZWdpc3RlcmVkIHdpdGggZGFlbW9uXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRMaXN0ZW5lcnMoKSB7XG4gICAgbGV0IGxpc3RlbmVycyA9IFtdO1xuICAgIGZvciAobGV0IHdyYXBwZWRMaXN0ZW5lciBvZiB0aGlzLndyYXBwZWRMaXN0ZW5lcnMpIGxpc3RlbmVycy5wdXNoKHdyYXBwZWRMaXN0ZW5lci5nZXRMaXN0ZW5lcigpKTtcbiAgICByZXR1cm4gbGlzdGVuZXJzO1xuICB9XG4gIFxuICBhc3luYyBnZXRScGNDb25uZWN0aW9uKCkge1xuICAgIGxldCBjb25maWcgPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFJwY0Nvbm5lY3Rpb25cIik7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKGNvbmZpZyBhcyBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+KTtcbiAgfVxuICBcbiAgYXN5bmMgaXNDb25uZWN0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uSXNDb25uZWN0ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFZlcnNpb24oKSB7XG4gICAgbGV0IHZlcnNpb25Kc29uOiBhbnkgPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFZlcnNpb25cIik7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9WZXJzaW9uKHZlcnNpb25Kc29uLm51bWJlciwgdmVyc2lvbkpzb24uaXNSZWxlYXNlKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNUcnVzdGVkKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbklzVHJ1c3RlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEhlaWdodFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tIYXNoKGhlaWdodCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2NrSGFzaFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja1RlbXBsYXRlKHdhbGxldEFkZHJlc3MsIHJlc2VydmVTaXplKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9CbG9ja1RlbXBsYXRlKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tUZW1wbGF0ZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TGFzdEJsb2NrSGVhZGVyKCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRMYXN0QmxvY2tIZWFkZXJcIikpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0hlYWRlckJ5SGFzaChibG9ja0hhc2gpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tIZWFkZXJCeUhhc2hcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrSGVhZGVyQnlIZWlnaHQoaGVpZ2h0KSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9CbG9ja0hlYWRlcihhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2NrSGVhZGVyQnlIZWlnaHRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrSGVhZGVyc0J5UmFuZ2Uoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCkge1xuICAgIGxldCBibG9ja0hlYWRlcnNKc29uOiBhbnlbXSA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tIZWFkZXJzQnlSYW5nZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpIGFzIGFueVtdO1xuICAgIGxldCBoZWFkZXJzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2tIZWFkZXJKc29uIG9mIGJsb2NrSGVhZGVyc0pzb24pIGhlYWRlcnMucHVzaChuZXcgTW9uZXJvQmxvY2tIZWFkZXIoYmxvY2tIZWFkZXJKc29uKSk7XG4gICAgcmV0dXJuIGhlYWRlcnM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrQnlIYXNoKGJsb2NrSGFzaCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvQmxvY2soYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja0J5SGFzaFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpLCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tzQnlIYXNoKGJsb2NrSGFzaGVzLCBzdGFydEhlaWdodCwgcHJ1bmUpIHtcbiAgICBsZXQgYmxvY2tzSnNvbjogYW55W10gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2Nrc0J5SGFzaFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpIGFzIGFueVtdO1xuICAgIGxldCBibG9ja3MgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0pzb24gb2YgYmxvY2tzSnNvbikgYmxvY2tzLnB1c2gobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbikpO1xuICAgIHJldHVybiBibG9ja3M7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrQnlIZWlnaHQoaGVpZ2h0KSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9CbG9jayhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2NrQnlIZWlnaHRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2Nrc0J5SGVpZ2h0KGhlaWdodHMpIHtcbiAgICBsZXQgYmxvY2tzSnNvbjogYW55W109IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tzQnlIZWlnaHRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSBhcyBhbnlbXTtcbiAgICBsZXQgYmxvY2tzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2tKc29uIG9mIGJsb2Nrc0pzb24pIGJsb2Nrcy5wdXNoKG5ldyBNb25lcm9CbG9jayhibG9ja0pzb24sIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFgpKTtcbiAgICByZXR1cm4gYmxvY2tzO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja3NCeVJhbmdlKHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpIHtcbiAgICBsZXQgYmxvY2tzSnNvbjogYW55W10gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2Nrc0J5UmFuZ2VcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSBhcyBhbnlbXTtcbiAgICBsZXQgYmxvY2tzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2tKc29uIG9mIGJsb2Nrc0pzb24pIGJsb2Nrcy5wdXNoKG5ldyBNb25lcm9CbG9jayhibG9ja0pzb24sIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFgpKTtcbiAgICByZXR1cm4gYmxvY2tzO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja3NCeVJhbmdlQ2h1bmtlZChzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBtYXhDaHVua1NpemUpIHtcbiAgICBsZXQgYmxvY2tzSnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tzQnlSYW5nZUNodW5rZWRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSBhcyBhbnlbXTtcbiAgICBsZXQgYmxvY2tzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2tKc29uIG9mIGJsb2Nrc0pzb24pIGJsb2Nrcy5wdXNoKG5ldyBNb25lcm9CbG9jayhibG9ja0pzb24sIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFgpKTtcbiAgICByZXR1cm4gYmxvY2tzO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0hhc2hlcyhibG9ja0hhc2hlcywgc3RhcnRIZWlnaHQpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja0hhc2hlc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeHModHhIYXNoZXMsIHBydW5lID0gZmFsc2UpIHtcbiAgICBcbiAgICAvLyBkZXNlcmlhbGl6ZSB0eHMgZnJvbSBibG9ja3NcbiAgICBsZXQgYmxvY2tzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2tKc29uIG9mIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0VHhzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkgYXMgYW55W10pIHtcbiAgICAgIGJsb2Nrcy5wdXNoKG5ldyBNb25lcm9CbG9jayhibG9ja0pzb24sIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFgpKTtcbiAgICB9XG4gICAgXG4gICAgLy8gY29sbGVjdCB0eHNcbiAgICBsZXQgdHhzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2sgb2YgYmxvY2tzKSB7XG4gICAgICBmb3IgKGxldCB0eCBvZiBibG9jay5nZXRUeHMoKSkge1xuICAgICAgICBpZiAoIXR4LmdldElzQ29uZmlybWVkKCkpIHR4LnNldEJsb2NrKHVuZGVmaW5lZCk7XG4gICAgICAgIHR4cy5wdXNoKHR4KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHR4cztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhIZXhlcyh0eEhhc2hlcywgcHJ1bmUgPSBmYWxzZSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFR4SGV4ZXNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TWluZXJUeFN1bShoZWlnaHQsIG51bUJsb2Nrcykge1xuICAgIHJldHVybiBuZXcgTW9uZXJvTWluZXJUeFN1bShhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldE1pbmVyVHhTdW1cIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEZlZUVzdGltYXRlKGdyYWNlQmxvY2tzPykge1xuICAgIHJldHVybiBuZXcgTW9uZXJvRmVlRXN0aW1hdGUoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRGZWVFc3RpbWF0ZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgc3VibWl0VHhIZXgodHhIZXgsIGRvTm90UmVsYXkpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1N1Ym1pdFR4UmVzdWx0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uU3VibWl0VHhIZXhcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbGF5VHhzQnlIYXNoKHR4SGFzaGVzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uUmVsYXlUeHNCeUhhc2hcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhQb29sKCkge1xuICAgIGxldCBibG9ja0pzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFR4UG9vbFwiKTtcbiAgICBsZXQgdHhzID0gbmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWCkuZ2V0VHhzKCk7XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB0eC5zZXRCbG9jayh1bmRlZmluZWQpO1xuICAgIHJldHVybiB0eHMgPyB0eHMgOiBbXTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhQb29sSGFzaGVzKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFR4UG9vbEhhc2hlc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFBvb2xCYWNrbG9nKCkge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhQb29sU3RhdHMoKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9UeFBvb2xTdGF0cyhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFR4UG9vbFN0YXRzXCIpKTtcbiAgfVxuICBcbiAgYXN5bmMgZmx1c2hUeFBvb2woaGFzaGVzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uRmx1c2hUeFBvb2xcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzKGtleUltYWdlcykge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEtleUltYWdlU3BlbnRTdGF0dXNlc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRPdXRwdXRzKG91dHB1dHMpOiBQcm9taXNlPE1vbmVyb091dHB1dFtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRPdXRwdXRIaXN0b2dyYW0oYW1vdW50cywgbWluQ291bnQsIG1heENvdW50LCBpc1VubG9ja2VkLCByZWNlbnRDdXRvZmYpIHtcbiAgICBsZXQgZW50cmllcyA9IFtdO1xuICAgIGZvciAobGV0IGVudHJ5SnNvbiBvZiBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldE91dHB1dEhpc3RvZ3JhbVwiLCBbYW1vdW50cywgbWluQ291bnQsIG1heENvdW50LCBpc1VubG9ja2VkLCByZWNlbnRDdXRvZmZdKSBhcyBhbnlbXSkge1xuICAgICAgZW50cmllcy5wdXNoKG5ldyBNb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeShlbnRyeUpzb24pKTtcbiAgICB9XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dERpc3RyaWJ1dGlvbihhbW91bnRzLCBjdW11bGF0aXZlLCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRJbmZvKCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvRGFlbW9uSW5mbyhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEluZm9cIikpO1xuICB9XG4gIFxuICBhc3luYyBnZXRTeW5jSW5mbygpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0RhZW1vblN5bmNJbmZvKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0U3luY0luZm9cIikpO1xuICB9XG4gIFxuICBhc3luYyBnZXRIYXJkRm9ya0luZm8oKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9IYXJkRm9ya0luZm8oYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRIYXJkRm9ya0luZm9cIikpO1xuICB9XG4gIFxuICBhc3luYyBnZXRBbHRDaGFpbnMoKSB7XG4gICAgbGV0IGFsdENoYWlucyA9IFtdO1xuICAgIGZvciAobGV0IGFsdENoYWluSnNvbiBvZiBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEFsdENoYWluc1wiKSBhcyBhbnkpIGFsdENoYWlucy5wdXNoKG5ldyBNb25lcm9BbHRDaGFpbihhbHRDaGFpbkpzb24pKTtcbiAgICByZXR1cm4gYWx0Q2hhaW5zO1xuICB9XG4gIFxuICBhc3luYyBnZXRBbHRCbG9ja0hhc2hlcygpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRBbHRCbG9ja0hhc2hlc1wiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RG93bmxvYWRMaW1pdCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXREb3dubG9hZExpbWl0XCIpO1xuICB9XG4gIFxuICBhc3luYyBzZXREb3dubG9hZExpbWl0KGxpbWl0KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uU2V0RG93bmxvYWRMaW1pdFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyByZXNldERvd25sb2FkTGltaXQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uUmVzZXREb3dubG9hZExpbWl0XCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRVcGxvYWRMaW1pdCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRVcGxvYWRMaW1pdFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0VXBsb2FkTGltaXQobGltaXQpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TZXRVcGxvYWRMaW1pdFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyByZXNldFVwbG9hZExpbWl0KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblJlc2V0VXBsb2FkTGltaXRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBlZXJzKCkge1xuICAgIGxldCBwZWVycyA9IFtdO1xuICAgIGZvciAobGV0IHBlZXJKc29uIG9mIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0UGVlcnNcIikgYXMgYW55KSBwZWVycy5wdXNoKG5ldyBNb25lcm9QZWVyKHBlZXJKc29uKSk7XG4gICAgcmV0dXJuIHBlZXJzO1xuICB9XG4gIFxuICBhc3luYyBnZXRLbm93blBlZXJzKCkge1xuICAgIGxldCBwZWVycyA9IFtdO1xuICAgIGZvciAobGV0IHBlZXJKc29uIG9mIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0S25vd25QZWVyc1wiKSBhcyBhbnkpIHBlZXJzLnB1c2gobmV3IE1vbmVyb1BlZXIocGVlckpzb24pKTtcbiAgICByZXR1cm4gcGVlcnM7XG4gIH1cbiAgXG4gIGFzeW5jIHNldE91dGdvaW5nUGVlckxpbWl0KGxpbWl0KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uU2V0SW5jb21pbmdQZWVyTGltaXRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0SW5jb21pbmdQZWVyTGltaXQobGltaXQpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TZXRJbmNvbWluZ1BlZXJMaW1pdFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRQZWVyQmFucygpIHtcbiAgICBsZXQgYmFucyA9IFtdO1xuICAgIGZvciAobGV0IGJhbkpzb24gb2YgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRQZWVyQmFuc1wiKSBhcyBhbnkpIGJhbnMucHVzaChuZXcgTW9uZXJvQmFuKGJhbkpzb24pKTtcbiAgICByZXR1cm4gYmFucztcbiAgfVxuXG4gIGFzeW5jIHNldFBlZXJCYW5zKGJhbnMpIHtcbiAgICBsZXQgYmFuc0pzb24gPSBbXTtcbiAgICBmb3IgKGxldCBiYW4gb2YgYmFucykgYmFuc0pzb24ucHVzaChiYW4udG9Kc29uKCkpO1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblNldFBlZXJCYW5zXCIsIFtiYW5zSnNvbl0pO1xuICB9XG4gIFxuICBhc3luYyBzdGFydE1pbmluZyhhZGRyZXNzLCBudW1UaHJlYWRzLCBpc0JhY2tncm91bmQsIGlnbm9yZUJhdHRlcnkpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TdGFydE1pbmluZ1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBzdG9wTWluaW5nKCkge1xuICAgIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uU3RvcE1pbmluZ1wiKVxuICB9XG4gIFxuICBhc3luYyBnZXRNaW5pbmdTdGF0dXMoKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9NaW5pbmdTdGF0dXMoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRNaW5pbmdTdGF0dXNcIikpO1xuICB9XG4gIFxuICBhc3luYyBzdWJtaXRCbG9ja3MoYmxvY2tCbG9icykge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuXG4gIGFzeW5jIHBydW5lQmxvY2tjaGFpbihjaGVjaykge1xuICAgIHJldHVybiBuZXcgTW9uZXJvUHJ1bmVSZXN1bHQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25QcnVuZUJsb2NrY2hhaW5cIikpO1xuICB9XG4gIFxuICBhc3luYyBjaGVja0ZvclVwZGF0ZSgpOiBQcm9taXNlPE1vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBkb3dubG9hZFVwZGF0ZShwYXRoKTogUHJvbWlzZTxNb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgc3RvcCgpIHtcbiAgICB3aGlsZSAodGhpcy53cmFwcGVkTGlzdGVuZXJzLmxlbmd0aCkgYXdhaXQgdGhpcy5yZW1vdmVMaXN0ZW5lcih0aGlzLndyYXBwZWRMaXN0ZW5lcnNbMF0uZ2V0TGlzdGVuZXIoKSk7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uU3RvcFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgd2FpdEZvck5leHRCbG9ja0hlYWRlcigpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uV2FpdEZvck5leHRCbG9ja0hlYWRlclwiKSk7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIEhFTFBFUlMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICAvLyBUT0RPOiBkdXBsaWNhdGVkIHdpdGggTW9uZXJvV2FsbGV0RnVsbFByb3h5XG4gIHByb3RlY3RlZCBhc3luYyBpbnZva2VXb3JrZXIoZm5OYW1lOiBzdHJpbmcsIGFyZ3M/OiBhbnkpIHtcbiAgICByZXR1cm4gTGlicmFyeVV0aWxzLmludm9rZVdvcmtlcih0aGlzLmRhZW1vbklkLCBmbk5hbWUsIGFyZ3MpO1xuICB9XG59XG5cbi8qKlxuICogUG9sbHMgYSBNb25lcm8gZGFlbW9uIGZvciB1cGRhdGVzIGFuZCBub3RpZmllcyBsaXN0ZW5lcnMgYXMgdGhleSBvY2N1ci5cbiAqIFxuICogQHByaXZhdGVcbiAqL1xuY2xhc3MgRGFlbW9uUG9sbGVyIHtcblxuICBwcm90ZWN0ZWQgZGFlbW9uOiBNb25lcm9EYWVtb25ScGM7XG4gIHByb3RlY3RlZCBsb29wZXI6IFRhc2tMb29wZXI7XG4gIHByb3RlY3RlZCBpc1BvbGxpbmc6IGJvb2xlYW47XG4gIHByb3RlY3RlZCBsYXN0SGVhZGVyOiBNb25lcm9CbG9ja0hlYWRlcjtcblxuICBjb25zdHJ1Y3RvcihkYWVtb24pIHtcbiAgICBsZXQgdGhhdCA9IHRoaXM7XG4gICAgdGhpcy5kYWVtb24gPSBkYWVtb247XG4gICAgdGhpcy5sb29wZXIgPSBuZXcgVGFza0xvb3Blcihhc3luYyBmdW5jdGlvbigpIHsgYXdhaXQgdGhhdC5wb2xsKCk7IH0pO1xuICB9XG4gIFxuICBzZXRJc1BvbGxpbmcoaXNQb2xsaW5nOiBib29sZWFuKSB7XG4gICAgdGhpcy5pc1BvbGxpbmcgPSBpc1BvbGxpbmc7XG4gICAgaWYgKGlzUG9sbGluZykgdGhpcy5sb29wZXIuc3RhcnQodGhpcy5kYWVtb24uZ2V0UG9sbEludGVydmFsKCkpO1xuICAgIGVsc2UgdGhpcy5sb29wZXIuc3RvcCgpO1xuICB9XG4gIFxuICBhc3luYyBwb2xsKCkge1xuICAgIHRyeSB7XG4gICAgICBcbiAgICAgIC8vIGdldCBsYXRlc3QgYmxvY2sgaGVhZGVyXG4gICAgICBsZXQgaGVhZGVyID0gYXdhaXQgdGhpcy5kYWVtb24uZ2V0TGFzdEJsb2NrSGVhZGVyKCk7XG4gICAgICBcbiAgICAgIC8vIHNhdmUgZmlyc3QgaGVhZGVyIGZvciBjb21wYXJpc29uXG4gICAgICBpZiAoIXRoaXMubGFzdEhlYWRlcikge1xuICAgICAgICB0aGlzLmxhc3RIZWFkZXIgPSBhd2FpdCB0aGlzLmRhZW1vbi5nZXRMYXN0QmxvY2tIZWFkZXIoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBjb21wYXJlIGhlYWRlciB0byBsYXN0XG4gICAgICBpZiAoaGVhZGVyLmdldEhhc2goKSAhPT0gdGhpcy5sYXN0SGVhZGVyLmdldEhhc2goKSkge1xuICAgICAgICB0aGlzLmxhc3RIZWFkZXIgPSBoZWFkZXI7XG4gICAgICAgIGF3YWl0IHRoaXMuYW5ub3VuY2VCbG9ja0hlYWRlcihoZWFkZXIpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBiYWNrZ3JvdW5kIHBvbGwgZGFlbW9uIGhlYWRlclwiKTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICB9XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgYW5ub3VuY2VCbG9ja0hlYWRlcihoZWFkZXI6IE1vbmVyb0Jsb2NrSGVhZGVyKSB7XG4gICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgYXdhaXQgdGhpcy5kYWVtb24uZ2V0TGlzdGVuZXJzKCkpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGxpc3RlbmVyLm9uQmxvY2tIZWFkZXIoaGVhZGVyKTsgLy8gbm90aWZ5IGxpc3RlbmVyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGNhbGxpbmcgbGlzdGVuZXIgb24gYmxvY2sgaGVhZGVyXCIsIGVycik7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogSW50ZXJuYWwgbGlzdGVuZXIgdG8gYnJpZGdlIG5vdGlmaWNhdGlvbnMgdG8gZXh0ZXJuYWwgbGlzdGVuZXJzLlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBEYWVtb25Xb3JrZXJMaXN0ZW5lciB7XG5cbiAgcHJvdGVjdGVkIGlkOiBhbnk7XG4gIHByb3RlY3RlZCBsaXN0ZW5lcjogYW55O1xuXG4gIGNvbnN0cnVjdG9yKGxpc3RlbmVyKSB7XG4gICAgdGhpcy5pZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICB0aGlzLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIH1cbiAgXG4gIGdldElkKCkge1xuICAgIHJldHVybiB0aGlzLmlkO1xuICB9XG4gIFxuICBnZXRMaXN0ZW5lcigpIHtcbiAgICByZXR1cm4gdGhpcy5saXN0ZW5lcjtcbiAgfVxuICBcbiAgYXN5bmMgb25CbG9ja0hlYWRlcihoZWFkZXJKc29uKSB7XG4gICAgdGhpcy5saXN0ZW5lci5vbkJsb2NrSGVhZGVyKG5ldyBNb25lcm9CbG9ja0hlYWRlcihoZWFkZXJKc29uKSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTW9uZXJvRGFlbW9uUnBjO1xuIl0sIm1hcHBpbmdzIjoieUxBQUEsSUFBQUEsT0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMsU0FBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUUsYUFBQSxHQUFBSCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUcsV0FBQSxHQUFBSixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUksZUFBQSxHQUFBTCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUssVUFBQSxHQUFBTixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQU0sWUFBQSxHQUFBUCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQU8sa0JBQUEsR0FBQVIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFRLG9CQUFBLEdBQUFULHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBUyxxQkFBQSxHQUFBVixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVUsYUFBQSxHQUFBWCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVcsbUJBQUEsR0FBQVosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFZLGlCQUFBLEdBQUFiLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBYSxxQkFBQSxHQUFBZCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWMscUJBQUEsR0FBQWYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFlLDhCQUFBLEdBQUFoQixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWdCLGlDQUFBLEdBQUFqQixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWlCLGtCQUFBLEdBQUFsQixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWtCLFlBQUEsR0FBQW5CLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFB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