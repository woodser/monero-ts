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
    // if there are only mined blocks lately, fees array is empty (not present)
    for (let i = 0; i < resp.result.fees?.length; i++) fees.push(BigInt(resp.result.fees[i]));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX1Rhc2tMb29wZXIiLCJfTW9uZXJvQWx0Q2hhaW4iLCJfTW9uZXJvQmFuIiwiX01vbmVyb0Jsb2NrIiwiX01vbmVyb0Jsb2NrSGVhZGVyIiwiX01vbmVyb0Jsb2NrVGVtcGxhdGUiLCJfTW9uZXJvQ29ubmVjdGlvblNwYW4iLCJfTW9uZXJvRGFlbW9uIiwiX01vbmVyb0RhZW1vbkNvbmZpZyIsIl9Nb25lcm9EYWVtb25JbmZvIiwiX01vbmVyb0RhZW1vbkxpc3RlbmVyIiwiX01vbmVyb0RhZW1vblN5bmNJbmZvIiwiX01vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0IiwiX01vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0IiwiX01vbmVyb0ZlZUVzdGltYXRlIiwiX01vbmVyb0Vycm9yIiwiX01vbmVyb0hhcmRGb3JrSW5mbyIsIl9Nb25lcm9LZXlJbWFnZSIsIl9Nb25lcm9NaW5lclR4U3VtIiwiX01vbmVyb01pbmluZ1N0YXR1cyIsIl9Nb25lcm9OZXR3b3JrVHlwZSIsIl9Nb25lcm9PdXRwdXQiLCJfTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkiLCJfTW9uZXJvUGVlciIsIl9Nb25lcm9QcnVuZVJlc3VsdCIsIl9Nb25lcm9ScGNDb25uZWN0aW9uIiwiX01vbmVyb1N1Ym1pdFR4UmVzdWx0IiwiX01vbmVyb1R4IiwiX01vbmVyb1R4UG9vbFN0YXRzIiwiX01vbmVyb1V0aWxzIiwiX01vbmVyb1ZlcnNpb24iLCJNb25lcm9EYWVtb25ScGMiLCJNb25lcm9EYWVtb24iLCJNQVhfUkVRX1NJWkUiLCJERUZBVUxUX0lEIiwiTlVNX0hFQURFUlNfUEVSX1JFUSIsIkRFRkFVTFRfUE9MTF9QRVJJT0QiLCJjb25zdHJ1Y3RvciIsImNvbmZpZyIsInByb3h5RGFlbW9uIiwicHJveHlUb1dvcmtlciIsImxpc3RlbmVycyIsImNhY2hlZEhlYWRlcnMiLCJnZXRQcm9jZXNzIiwicHJvY2VzcyIsInN0b3BQcm9jZXNzIiwiZm9yY2UiLCJ1bmRlZmluZWQiLCJNb25lcm9FcnJvciIsImxpc3RlbmVyc0NvcHkiLCJHZW5VdGlscyIsImNvcHlBcnJheSIsImdldExpc3RlbmVycyIsImxpc3RlbmVyIiwicmVtb3ZlTGlzdGVuZXIiLCJraWxsUHJvY2VzcyIsImFkZExpc3RlbmVyIiwiYXNzZXJ0IiwiTW9uZXJvRGFlbW9uTGlzdGVuZXIiLCJwdXNoIiwicmVmcmVzaExpc3RlbmluZyIsImlkeCIsImluZGV4T2YiLCJzcGxpY2UiLCJnZXRScGNDb25uZWN0aW9uIiwiZ2V0U2VydmVyIiwiaXNDb25uZWN0ZWQiLCJnZXRWZXJzaW9uIiwiZSIsInJlc3AiLCJzZW5kSnNvblJlcXVlc3QiLCJjaGVja1Jlc3BvbnNlU3RhdHVzIiwicmVzdWx0IiwiTW9uZXJvVmVyc2lvbiIsInZlcnNpb24iLCJyZWxlYXNlIiwiaXNUcnVzdGVkIiwic2VuZFBhdGhSZXF1ZXN0IiwidW50cnVzdGVkIiwiZ2V0SGVpZ2h0IiwiY291bnQiLCJnZXRCbG9ja0hhc2giLCJoZWlnaHQiLCJnZXRCbG9ja1RlbXBsYXRlIiwid2FsbGV0QWRkcmVzcyIsInJlc2VydmVTaXplIiwid2FsbGV0X2FkZHJlc3MiLCJyZXNlcnZlX3NpemUiLCJjb252ZXJ0UnBjQmxvY2tUZW1wbGF0ZSIsImdldExhc3RCbG9ja0hlYWRlciIsImNvbnZlcnRScGNCbG9ja0hlYWRlciIsImJsb2NrX2hlYWRlciIsImdldEJsb2NrSGVhZGVyQnlIYXNoIiwiYmxvY2tIYXNoIiwiaGFzaCIsImdldEJsb2NrSGVhZGVyQnlIZWlnaHQiLCJnZXRCbG9ja0hlYWRlcnNCeVJhbmdlIiwic3RhcnRIZWlnaHQiLCJlbmRIZWlnaHQiLCJzdGFydF9oZWlnaHQiLCJlbmRfaGVpZ2h0IiwiaGVhZGVycyIsInJwY0hlYWRlciIsImdldEJsb2NrQnlIYXNoIiwiY29udmVydFJwY0Jsb2NrIiwiZ2V0QmxvY2tCeUhlaWdodCIsImdldEJsb2Nrc0J5SGVpZ2h0IiwiaGVpZ2h0cyIsInJlc3BCaW4iLCJzZW5kQmluYXJ5UmVxdWVzdCIsInJwY0Jsb2NrcyIsIk1vbmVyb1V0aWxzIiwiYmluYXJ5QmxvY2tzVG9Kc29uIiwiZXF1YWwiLCJ0eHMiLCJsZW5ndGgiLCJibG9ja3MiLCJibG9ja0lkeCIsImJsb2NrIiwic2V0SGVpZ2h0IiwidHhJZHgiLCJ0eCIsIk1vbmVyb1R4Iiwic2V0SGFzaCIsInR4X2hhc2hlcyIsInNldElzQ29uZmlybWVkIiwic2V0SW5UeFBvb2wiLCJzZXRJc01pbmVyVHgiLCJzZXRSZWxheSIsInNldElzUmVsYXllZCIsInNldElzRmFpbGVkIiwic2V0SXNEb3VibGVTcGVuZFNlZW4iLCJjb252ZXJ0UnBjVHgiLCJzZXRUeHMiLCJnZXRCbG9jayIsIm1lcmdlIiwiZ2V0VHhzIiwic2V0QmxvY2siLCJnZXRCbG9ja3NCeVJhbmdlIiwiZ2V0QmxvY2tzQnlSYW5nZUNodW5rZWQiLCJtYXhDaHVua1NpemUiLCJsYXN0SGVpZ2h0IiwiZ2V0TWF4QmxvY2tzIiwidHhIYXNoZXMiLCJwcnVuZSIsIkFycmF5IiwiaXNBcnJheSIsInR4c19oYXNoZXMiLCJkZWNvZGVfYXNfanNvbiIsIm1lc3NhZ2UiLCJnZXRUeEhleGVzIiwiaGV4ZXMiLCJnZXRQcnVuZWRIZXgiLCJnZXRGdWxsSGV4IiwiZ2V0TWluZXJUeFN1bSIsIm51bUJsb2NrcyIsInR4U3VtIiwiTW9uZXJvTWluZXJUeFN1bSIsInNldEVtaXNzaW9uU3VtIiwiQmlnSW50IiwiZW1pc3Npb25fYW1vdW50Iiwic2V0RmVlU3VtIiwiZmVlX2Ftb3VudCIsImdldEZlZUVzdGltYXRlIiwiZ3JhY2VCbG9ja3MiLCJncmFjZV9ibG9ja3MiLCJmZWVFc3RpbWF0ZSIsIk1vbmVyb0ZlZUVzdGltYXRlIiwic2V0RmVlIiwiZmVlIiwiZmVlcyIsImkiLCJzZXRGZWVzIiwic2V0UXVhbnRpemF0aW9uTWFzayIsInF1YW50aXphdGlvbl9tYXNrIiwic3VibWl0VHhIZXgiLCJ0eEhleCIsImRvTm90UmVsYXkiLCJ0eF9hc19oZXgiLCJkb19ub3RfcmVsYXkiLCJjb252ZXJ0UnBjU3VibWl0VHhSZXN1bHQiLCJzZXRJc0dvb2QiLCJyZWxheVR4c0J5SGFzaCIsInR4aWRzIiwiZ2V0VHhQb29sIiwidHJhbnNhY3Rpb25zIiwicnBjVHgiLCJzZXROdW1Db25maXJtYXRpb25zIiwiZ2V0VHhQb29sSGFzaGVzIiwiZ2V0VHhQb29sU3RhdHMiLCJjb252ZXJ0UnBjVHhQb29sU3RhdHMiLCJwb29sX3N0YXRzIiwiZmx1c2hUeFBvb2wiLCJoYXNoZXMiLCJsaXN0aWZ5IiwiZ2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzIiwia2V5SW1hZ2VzIiwia2V5X2ltYWdlcyIsInNwZW50X3N0YXR1cyIsImdldE91dHB1dEhpc3RvZ3JhbSIsImFtb3VudHMiLCJtaW5Db3VudCIsIm1heENvdW50IiwiaXNVbmxvY2tlZCIsInJlY2VudEN1dG9mZiIsIm1pbl9jb3VudCIsIm1heF9jb3VudCIsInVubG9ja2VkIiwicmVjZW50X2N1dG9mZiIsImVudHJpZXMiLCJoaXN0b2dyYW0iLCJycGNFbnRyeSIsImNvbnZlcnRScGNPdXRwdXRIaXN0b2dyYW1FbnRyeSIsImdldE91dHB1dERpc3RyaWJ1dGlvbiIsImN1bXVsYXRpdmUiLCJnZXRJbmZvIiwiY29udmVydFJwY0luZm8iLCJnZXRTeW5jSW5mbyIsImNvbnZlcnRScGNTeW5jSW5mbyIsImdldEhhcmRGb3JrSW5mbyIsImNvbnZlcnRScGNIYXJkRm9ya0luZm8iLCJnZXRBbHRDaGFpbnMiLCJjaGFpbnMiLCJycGNDaGFpbiIsImNvbnZlcnRScGNBbHRDaGFpbiIsImdldEFsdEJsb2NrSGFzaGVzIiwiYmxrc19oYXNoZXMiLCJnZXREb3dubG9hZExpbWl0IiwiZ2V0QmFuZHdpZHRoTGltaXRzIiwic2V0RG93bmxvYWRMaW1pdCIsImxpbWl0IiwicmVzZXREb3dubG9hZExpbWl0IiwiaXNJbnQiLCJzZXRCYW5kd2lkdGhMaW1pdHMiLCJnZXRVcGxvYWRMaW1pdCIsInNldFVwbG9hZExpbWl0IiwicmVzZXRVcGxvYWRMaW1pdCIsImdldFBlZXJzIiwicGVlcnMiLCJjb25uZWN0aW9ucyIsInJwY0Nvbm5lY3Rpb24iLCJjb252ZXJ0UnBjQ29ubmVjdGlvbiIsImdldEtub3duUGVlcnMiLCJncmF5X2xpc3QiLCJycGNQZWVyIiwicGVlciIsImNvbnZlcnRScGNQZWVyIiwic2V0SXNPbmxpbmUiLCJ3aGl0ZV9saXN0Iiwic2V0T3V0Z29pbmdQZWVyTGltaXQiLCJvdXRfcGVlcnMiLCJzZXRJbmNvbWluZ1BlZXJMaW1pdCIsImluX3BlZXJzIiwiZ2V0UGVlckJhbnMiLCJiYW5zIiwicnBjQmFuIiwiYmFuIiwiTW9uZXJvQmFuIiwic2V0SG9zdCIsImhvc3QiLCJzZXRJcCIsImlwIiwic2V0U2Vjb25kcyIsInNlY29uZHMiLCJzZXRQZWVyQmFucyIsInJwY0JhbnMiLCJjb252ZXJ0VG9ScGNCYW4iLCJzdGFydE1pbmluZyIsImFkZHJlc3MiLCJudW1UaHJlYWRzIiwiaXNCYWNrZ3JvdW5kIiwiaWdub3JlQmF0dGVyeSIsIm1pbmVyX2FkZHJlc3MiLCJ0aHJlYWRzX2NvdW50IiwiZG9fYmFja2dyb3VuZF9taW5pbmciLCJpZ25vcmVfYmF0dGVyeSIsInN0b3BNaW5pbmciLCJnZXRNaW5pbmdTdGF0dXMiLCJjb252ZXJ0UnBjTWluaW5nU3RhdHVzIiwic3VibWl0QmxvY2tzIiwiYmxvY2tCbG9icyIsInBydW5lQmxvY2tjaGFpbiIsImNoZWNrIiwiTW9uZXJvUHJ1bmVSZXN1bHQiLCJzZXRJc1BydW5lZCIsInBydW5lZCIsInNldFBydW5pbmdTZWVkIiwicHJ1bmluZ19zZWVkIiwiY2hlY2tGb3JVcGRhdGUiLCJjb21tYW5kIiwiY29udmVydFJwY1VwZGF0ZUNoZWNrUmVzdWx0IiwiZG93bmxvYWRVcGRhdGUiLCJwYXRoIiwiY29udmVydFJwY1VwZGF0ZURvd25sb2FkUmVzdWx0Iiwic3RvcCIsIndhaXRGb3JOZXh0QmxvY2tIZWFkZXIiLCJ0aGF0IiwiUHJvbWlzZSIsInJlc29sdmUiLCJvbkJsb2NrSGVhZGVyIiwiaGVhZGVyIiwiZ2V0UG9sbEludGVydmFsIiwicG9sbEludGVydmFsIiwiZ2V0VHgiLCJ0eEhhc2giLCJnZXRUeEhleCIsImdldEtleUltYWdlU3BlbnRTdGF0dXMiLCJrZXlJbWFnZSIsInNldFBlZXJCYW4iLCJzdWJtaXRCbG9jayIsImJsb2NrQmxvYiIsInBvbGxMaXN0ZW5lciIsIkRhZW1vblBvbGxlciIsInNldElzUG9sbGluZyIsImxpbWl0X2Rvd24iLCJsaW1pdF91cCIsImRvd25MaW1pdCIsInVwTGltaXQiLCJtYXhIZWlnaHQiLCJtYXhSZXFTaXplIiwicmVxU2l6ZSIsImdldEJsb2NrSGVhZGVyQnlIZWlnaHRDYWNoZWQiLCJnZXRTaXplIiwiY2FjaGVkSGVhZGVyIiwiTWF0aCIsIm1pbiIsImNvbm5lY3RUb0RhZW1vblJwYyIsInVyaU9yQ29uZmlnIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsIm5vcm1hbGl6ZUNvbmZpZyIsImNtZCIsInN0YXJ0TW9uZXJvZFByb2Nlc3MiLCJNb25lcm9EYWVtb25ScGNQcm94eSIsImNvbm5lY3QiLCJzcGF3biIsInNsaWNlIiwic3Rkb3V0Iiwic2V0RW5jb2RpbmciLCJzdGRlcnIiLCJ1cmkiLCJvdXRwdXQiLCJyZWplY3QiLCJvbiIsImRhdGEiLCJsaW5lIiwidG9TdHJpbmciLCJMaWJyYXJ5VXRpbHMiLCJsb2ciLCJ1cmlMaW5lQ29udGFpbnMiLCJ1cmlMaW5lQ29udGFpbnNJZHgiLCJzdWJzdHJpbmciLCJsYXN0SW5kZXhPZiIsInVuZm9ybWF0dGVkTGluZSIsInJlcGxhY2UiLCJ0cmltIiwicG9ydCIsInNzbElkeCIsInNzbEVuYWJsZWQiLCJ0b0xvd2VyQ2FzZSIsInVzZXJQYXNzSWR4IiwidXNlclBhc3MiLCJjb3B5Iiwic2V0U2VydmVyIiwicmVqZWN0VW5hdXRob3JpemVkIiwiZ2V0UmVqZWN0VW5hdXRob3JpemVkIiwic2V0UHJveHlUb1dvcmtlciIsImRhZW1vbiIsImlzUmVzb2x2ZWQiLCJnZXRMb2dMZXZlbCIsImNvbnNvbGUiLCJlcnJvciIsImNvZGUiLCJFcnJvciIsImVyciIsIm9yaWdpbiIsIk1vbmVyb0RhZW1vbkNvbmZpZyIsInNlcnZlciIsIk1vbmVyb1JwY0Nvbm5lY3Rpb24iLCJERUZBVUxUX0NPTkZJRyIsInN0YXR1cyIsIk1vbmVyb0Jsb2NrSGVhZGVyIiwia2V5IiwiT2JqZWN0Iiwia2V5cyIsInZhbCIsInNhZmVTZXQiLCJzZXRTaXplIiwiZ2V0RGVwdGgiLCJzZXREZXB0aCIsInNldERpZmZpY3VsdHkiLCJyZWNvbmNpbGUiLCJnZXREaWZmaWN1bHR5IiwicHJlZml4ZWRIZXhUb0JJIiwic2V0Q3VtdWxhdGl2ZURpZmZpY3VsdHkiLCJnZXRDdW11bGF0aXZlRGlmZmljdWx0eSIsImdldEhhc2giLCJnZXRNYWpvclZlcnNpb24iLCJzZXRNYWpvclZlcnNpb24iLCJnZXRNaW5vclZlcnNpb24iLCJzZXRNaW5vclZlcnNpb24iLCJnZXROb25jZSIsInNldE5vbmNlIiwiZ2V0TnVtVHhzIiwic2V0TnVtVHhzIiwiZ2V0T3JwaGFuU3RhdHVzIiwic2V0T3JwaGFuU3RhdHVzIiwiZ2V0UHJldkhhc2giLCJzZXRQcmV2SGFzaCIsImdldFJld2FyZCIsInNldFJld2FyZCIsImdldFRpbWVzdGFtcCIsInNldFRpbWVzdGFtcCIsImdldFdlaWdodCIsInNldFdlaWdodCIsImdldExvbmdUZXJtV2VpZ2h0Iiwic2V0TG9uZ1Rlcm1XZWlnaHQiLCJnZXRQb3dIYXNoIiwic2V0UG93SGFzaCIsInNldE1pbmVyVHhIYXNoIiwicnBjQmxvY2siLCJNb25lcm9CbG9jayIsInNldEhleCIsImJsb2IiLCJzZXRUeEhhc2hlcyIsInJwY01pbmVyVHgiLCJqc29uIiwiSlNPTiIsInBhcnNlIiwibWluZXJfdHgiLCJtaW5lclR4Iiwic2V0TWluZXJUeCIsImdldExhc3RSZWxheWVkVGltZXN0YW1wIiwic2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAiLCJnZXRSZWNlaXZlZFRpbWVzdGFtcCIsInNldFJlY2VpdmVkVGltZXN0YW1wIiwiZ2V0TnVtQ29uZmlybWF0aW9ucyIsImdldElzQ29uZmlybWVkIiwiZ2V0SW5UeFBvb2wiLCJnZXRJc0RvdWJsZVNwZW5kU2VlbiIsInNldFZlcnNpb24iLCJnZXRFeHRyYSIsInNldEV4dHJhIiwiVWludDhBcnJheSIsImdlbiIsInNldElucHV0cyIsIm1hcCIsInJwY1ZpbiIsImNvbnZlcnRScGNPdXRwdXQiLCJzZXRPdXRwdXRzIiwicnBjT3V0cHV0IiwiZ2V0UmN0U2lnbmF0dXJlcyIsInNldFJjdFNpZ25hdHVyZXMiLCJ0eG5GZWUiLCJnZXRGZWUiLCJnZXRSY3RTaWdQcnVuYWJsZSIsInNldFJjdFNpZ1BydW5hYmxlIiwiZ2V0VW5sb2NrVGltZSIsInNldFVubG9ja1RpbWUiLCJzZXRGdWxsSGV4IiwiZ2V0SXNSZWxheWVkIiwiZ2V0T3V0cHV0SW5kaWNlcyIsInNldE91dHB1dEluZGljZXMiLCJnZXRSZWxheSIsImdldElzS2VwdEJ5QmxvY2siLCJzZXRJc0tlcHRCeUJsb2NrIiwiZ2V0U2lnbmF0dXJlcyIsInNldFNpZ25hdHVyZXMiLCJnZXRJc0ZhaWxlZCIsImdldExhc3RGYWlsZWRIZWlnaHQiLCJzZXRMYXN0RmFpbGVkSGVpZ2h0IiwiZ2V0TGFzdEZhaWxlZEhhc2giLCJzZXRMYXN0RmFpbGVkSGFzaCIsImdldE1heFVzZWRCbG9ja0hlaWdodCIsInNldE1heFVzZWRCbG9ja0hlaWdodCIsImdldE1heFVzZWRCbG9ja0hhc2giLCJzZXRNYXhVc2VkQmxvY2tIYXNoIiwiZ2V0UHJ1bmFibGVIYXNoIiwic2V0UHJ1bmFibGVIYXNoIiwiZ2V0UHJ1bmFibGVIZXgiLCJzZXRQcnVuYWJsZUhleCIsInNldFBydW5lZEhleCIsImdldE91dHB1dHMiLCJzZXRJbmRleCIsImFzX2pzb24iLCJ0eF9qc29uIiwiTW9uZXJvT3V0cHV0Iiwic2V0VHgiLCJnZXRBbW91bnQiLCJzZXRBbW91bnQiLCJhbW91bnQiLCJnZXRLZXlJbWFnZSIsInNldEtleUltYWdlIiwiTW9uZXJvS2V5SW1hZ2UiLCJrX2ltYWdlIiwiZ2V0UmluZ091dHB1dEluZGljZXMiLCJzZXRSaW5nT3V0cHV0SW5kaWNlcyIsImtleV9vZmZzZXRzIiwicHViS2V5IiwidGFnZ2VkX2tleSIsImdldFN0ZWFsdGhQdWJsaWNLZXkiLCJzZXRTdGVhbHRoUHVibGljS2V5IiwicnBjVGVtcGxhdGUiLCJ0ZW1wbGF0ZSIsIk1vbmVyb0Jsb2NrVGVtcGxhdGUiLCJzZXRCbG9ja1RlbXBsYXRlQmxvYiIsInNldEJsb2NrSGFzaGluZ0Jsb2IiLCJzZXRFeHBlY3RlZFJld2FyZCIsInNldFJlc2VydmVkT2Zmc2V0Iiwic2V0U2VlZEhlaWdodCIsInNldFNlZWRIYXNoIiwic2V0TmV4dFNlZWRIYXNoIiwiZ2V0TmV4dFNlZWRIYXNoIiwicnBjSW5mbyIsImluZm8iLCJNb25lcm9EYWVtb25JbmZvIiwic2V0TnVtQWx0QmxvY2tzIiwic2V0QmxvY2tTaXplTGltaXQiLCJzZXRCbG9ja1NpemVNZWRpYW4iLCJzZXRCbG9ja1dlaWdodExpbWl0Iiwic2V0QmxvY2tXZWlnaHRNZWRpYW4iLCJzZXRCb290c3RyYXBEYWVtb25BZGRyZXNzIiwic2V0RnJlZVNwYWNlIiwic2V0RGF0YWJhc2VTaXplIiwic2V0TnVtT2ZmbGluZVBlZXJzIiwic2V0SGVpZ2h0V2l0aG91dEJvb3RzdHJhcCIsInNldE51bUluY29taW5nQ29ubmVjdGlvbnMiLCJzZXRJc09mZmxpbmUiLCJzZXROdW1PdXRnb2luZ0Nvbm5lY3Rpb25zIiwic2V0TnVtUnBjQ29ubmVjdGlvbnMiLCJzZXRTdGFydFRpbWVzdGFtcCIsInNldEFkanVzdGVkVGltZXN0YW1wIiwic2V0VGFyZ2V0Iiwic2V0VGFyZ2V0SGVpZ2h0Iiwic2V0VG9wQmxvY2tIYXNoIiwic2V0TnVtVHhzUG9vbCIsInNldFdhc0Jvb3RzdHJhcEV2ZXJVc2VkIiwic2V0TnVtT25saW5lUGVlcnMiLCJzZXRVcGRhdGVBdmFpbGFibGUiLCJnZXROZXR3b3JrVHlwZSIsInNldE5ldHdvcmtUeXBlIiwiTW9uZXJvTmV0d29ya1R5cGUiLCJNQUlOTkVUIiwiVEVTVE5FVCIsIlNUQUdFTkVUIiwic2V0Q3JlZGl0cyIsImdldFRvcEJsb2NrSGFzaCIsInNldElzQnVzeVN5bmNpbmciLCJzZXRJc1N5bmNocm9uaXplZCIsInNldElzUmVzdHJpY3RlZCIsInJwY1N5bmNJbmZvIiwic3luY0luZm8iLCJNb25lcm9EYWVtb25TeW5jSW5mbyIsInNldFBlZXJzIiwicnBjQ29ubmVjdGlvbnMiLCJzZXRTcGFucyIsInJwY1NwYW5zIiwicnBjU3BhbiIsImdldFNwYW5zIiwiY29udmVydFJwY0Nvbm5lY3Rpb25TcGFuIiwic2V0TmV4dE5lZWRlZFBydW5pbmdTZWVkIiwib3ZlcnZpZXciLCJycGNIYXJkRm9ya0luZm8iLCJNb25lcm9IYXJkRm9ya0luZm8iLCJzZXRFYXJsaWVzdEhlaWdodCIsInNldElzRW5hYmxlZCIsInNldFN0YXRlIiwic2V0VGhyZXNob2xkIiwic2V0TnVtVm90ZXMiLCJzZXRWb3RpbmciLCJzZXRXaW5kb3ciLCJycGNDb25uZWN0aW9uU3BhbiIsInNwYW4iLCJNb25lcm9Db25uZWN0aW9uU3BhbiIsInNldENvbm5lY3Rpb25JZCIsInNldE51bUJsb2NrcyIsInNldFJhdGUiLCJzZXRSZW1vdGVBZGRyZXNzIiwic2V0U3BlZWQiLCJzZXRTdGFydEhlaWdodCIsImVudHJ5IiwiTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkiLCJzZXROdW1JbnN0YW5jZXMiLCJzZXROdW1VbmxvY2tlZEluc3RhbmNlcyIsInNldE51bVJlY2VudEluc3RhbmNlcyIsInJwY1Jlc3VsdCIsIk1vbmVyb1N1Ym1pdFR4UmVzdWx0Iiwic2V0SXNGZWVUb29Mb3ciLCJzZXRIYXNJbnZhbGlkSW5wdXQiLCJzZXRIYXNJbnZhbGlkT3V0cHV0Iiwic2V0SGFzVG9vRmV3T3V0cHV0cyIsInNldElzTWl4aW5Ub29Mb3ciLCJzZXRJc092ZXJzcGVuZCIsInNldFJlYXNvbiIsInNldElzVG9vQmlnIiwic2V0U2FuaXR5Q2hlY2tGYWlsZWQiLCJzZXRJc1R4RXh0cmFUb29CaWciLCJycGNTdGF0cyIsInN0YXRzIiwiTW9uZXJvVHhQb29sU3RhdHMiLCJzZXRCeXRlc01heCIsInNldEJ5dGVzTWVkIiwic2V0Qnl0ZXNNaW4iLCJzZXRCeXRlc1RvdGFsIiwic2V0SGlzdG85OHBjIiwic2V0TnVtMTBtIiwic2V0TnVtRG91YmxlU3BlbmRzIiwic2V0TnVtRmFpbGluZyIsInNldE51bU5vdFJlbGF5ZWQiLCJzZXRPbGRlc3RUaW1lc3RhbXAiLCJzZXRGZWVUb3RhbCIsInNldEhpc3RvIiwiTWFwIiwiZWxlbSIsImdldEhpc3RvIiwic2V0IiwiYnl0ZXMiLCJnZXRIaXN0bzk4cGMiLCJjaGFpbiIsIk1vbmVyb0FsdENoYWluIiwic2V0TGVuZ3RoIiwic2V0QmxvY2tIYXNoZXMiLCJzZXRNYWluQ2hhaW5QYXJlbnRCbG9ja0hhc2giLCJNb25lcm9QZWVyIiwic2V0SWQiLCJzZXRMYXN0U2VlblRpbWVzdGFtcCIsInNldFBvcnQiLCJzZXRScGNQb3J0Iiwic2V0UnBjQ3JlZGl0c1Blckhhc2giLCJzZXRBZGRyZXNzIiwic2V0QXZnRG93bmxvYWQiLCJzZXRBdmdVcGxvYWQiLCJzZXRDdXJyZW50RG93bmxvYWQiLCJzZXRDdXJyZW50VXBsb2FkIiwic2V0SXNJbmNvbWluZyIsInNldExpdmVUaW1lIiwic2V0SXNMb2NhbElwIiwic2V0SXNMb2NhbEhvc3QiLCJwYXJzZUludCIsInNldE51bVJlY2VpdmVzIiwic2V0UmVjZWl2ZUlkbGVUaW1lIiwic2V0TnVtU2VuZHMiLCJzZXRTZW5kSWRsZVRpbWUiLCJzZXROdW1TdXBwb3J0RmxhZ3MiLCJzZXRUeXBlIiwiZ2V0SG9zdCIsImdldElwIiwiZ2V0SXNCYW5uZWQiLCJnZXRTZWNvbmRzIiwicnBjU3RhdHVzIiwiTW9uZXJvTWluaW5nU3RhdHVzIiwic2V0SXNBY3RpdmUiLCJhY3RpdmUiLCJzcGVlZCIsInNldE51bVRocmVhZHMiLCJzZXRJc0JhY2tncm91bmQiLCJpc19iYWNrZ3JvdW5kX21pbmluZ19lbmFibGVkIiwiTW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQiLCJzZXRBdXRvVXJpIiwic2V0SXNVcGRhdGVBdmFpbGFibGUiLCJzZXRVc2VyVXJpIiwiZ2V0QXV0b1VyaSIsImdldFVzZXJVcmkiLCJNb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdCIsInNldERvd25sb2FkUGF0aCIsImdldERvd25sb2FkUGF0aCIsImhleCIsImRhZW1vbklkIiwid29ya2VyIiwid3JhcHBlZExpc3RlbmVycyIsImdldFVVSUQiLCJhc3NpZ24iLCJpbnZva2VXb3JrZXIiLCJnZXRXb3JrZXIiLCJ3cmFwcGVkTGlzdGVuZXIiLCJEYWVtb25Xb3JrZXJMaXN0ZW5lciIsImxpc3RlbmVySWQiLCJnZXRJZCIsImFkZFdvcmtlckNhbGxiYWNrIiwiZ2V0TGlzdGVuZXIiLCJyZW1vdmVXb3JrZXJDYWxsYmFjayIsInZlcnNpb25Kc29uIiwibnVtYmVyIiwiaXNSZWxlYXNlIiwiZnJvbSIsImFyZ3VtZW50cyIsImJsb2NrSGVhZGVyc0pzb24iLCJibG9ja0hlYWRlckpzb24iLCJEZXNlcmlhbGl6YXRpb25UeXBlIiwiVFgiLCJnZXRCbG9ja3NCeUhhc2giLCJibG9ja0hhc2hlcyIsImJsb2Nrc0pzb24iLCJibG9ja0pzb24iLCJnZXRCbG9ja0hhc2hlcyIsImdldFR4UG9vbEJhY2tsb2ciLCJvdXRwdXRzIiwiZW50cnlKc29uIiwiYWx0Q2hhaW5zIiwiYWx0Q2hhaW5Kc29uIiwicGVlckpzb24iLCJiYW5Kc29uIiwiYmFuc0pzb24iLCJ0b0pzb24iLCJmbk5hbWUiLCJhcmdzIiwibG9vcGVyIiwiVGFza0xvb3BlciIsInBvbGwiLCJpc1BvbGxpbmciLCJzdGFydCIsImxhc3RIZWFkZXIiLCJhbm5vdW5jZUJsb2NrSGVhZGVyIiwiaWQiLCJoZWFkZXJKc29uIiwiX2RlZmF1bHQiLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL2RhZW1vbi9Nb25lcm9EYWVtb25ScGMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XG5pbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9HZW5VdGlsc1wiO1xuaW1wb3J0IExpYnJhcnlVdGlscyBmcm9tIFwiLi4vY29tbW9uL0xpYnJhcnlVdGlsc1wiO1xuaW1wb3J0IFRhc2tMb29wZXIgZnJvbSBcIi4uL2NvbW1vbi9UYXNrTG9vcGVyXCI7XG5pbXBvcnQgTW9uZXJvQWx0Q2hhaW4gZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWx0Q2hhaW5cIjtcbmltcG9ydCBNb25lcm9CYW4gZnJvbSBcIi4vbW9kZWwvTW9uZXJvQmFuXCI7XG5pbXBvcnQgTW9uZXJvQmxvY2sgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQmxvY2tcIjtcbmltcG9ydCBNb25lcm9CbG9ja0hlYWRlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9CbG9ja0hlYWRlclwiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrVGVtcGxhdGUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQmxvY2tUZW1wbGF0ZVwiO1xuaW1wb3J0IE1vbmVyb0Nvbm5lY3Rpb25TcGFuIGZyb20gXCIuL21vZGVsL01vbmVyb0Nvbm5lY3Rpb25TcGFuXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uIGZyb20gXCIuL01vbmVyb0RhZW1vblwiO1xuaW1wb3J0IE1vbmVyb0RhZW1vbkNvbmZpZyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9EYWVtb25Db25maWdcIjtcbmltcG9ydCBNb25lcm9EYWVtb25JbmZvIGZyb20gXCIuL21vZGVsL01vbmVyb0RhZW1vbkluZm9cIjtcbmltcG9ydCBNb25lcm9EYWVtb25MaXN0ZW5lciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9EYWVtb25MaXN0ZW5lclwiO1xuaW1wb3J0IE1vbmVyb0RhZW1vblN5bmNJbmZvIGZyb20gXCIuL21vZGVsL01vbmVyb0RhZW1vblN5bmNJbmZvXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb0ZlZUVzdGltYXRlIGZyb20gXCIuL21vZGVsL01vbmVyb0ZlZUVzdGltYXRlXCI7XG5pbXBvcnQgTW9uZXJvRXJyb3IgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9FcnJvclwiO1xuaW1wb3J0IE1vbmVyb0hhcmRGb3JrSW5mbyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9IYXJkRm9ya0luZm9cIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9LZXlJbWFnZVwiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlU3BlbnRTdGF0dXMgZnJvbSBcIi4vbW9kZWwvTW9uZXJvS2V5SW1hZ2VTcGVudFN0YXR1c1wiO1xuaW1wb3J0IE1vbmVyb01pbmVyVHhTdW0gZnJvbSBcIi4vbW9kZWwvTW9uZXJvTWluZXJUeFN1bVwiO1xuaW1wb3J0IE1vbmVyb01pbmluZ1N0YXR1cyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NaW5pbmdTdGF0dXNcIjtcbmltcG9ydCBNb25lcm9OZXR3b3JrVHlwZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9OZXR3b3JrVHlwZVwiO1xuaW1wb3J0IE1vbmVyb091dHB1dCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRwdXRcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeVwiO1xuaW1wb3J0IE1vbmVyb1BlZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvUGVlclwiO1xuaW1wb3J0IE1vbmVyb1BydW5lUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb1BydW5lUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvUnBjQ29ubmVjdGlvbiBmcm9tIFwiLi4vY29tbW9uL01vbmVyb1JwY0Nvbm5lY3Rpb25cIjtcbmltcG9ydCBNb25lcm9TdWJtaXRUeFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9TdWJtaXRUeFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb1R4IGZyb20gXCIuL21vZGVsL01vbmVyb1R4XCI7XG5pbXBvcnQgTW9uZXJvVHhQb29sU3RhdHMgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhQb29sU3RhdHNcIjtcbmltcG9ydCBNb25lcm9VdGlscyBmcm9tIFwiLi4vY29tbW9uL01vbmVyb1V0aWxzXCI7XG5pbXBvcnQgTW9uZXJvVmVyc2lvbiBmcm9tIFwiLi9tb2RlbC9Nb25lcm9WZXJzaW9uXCI7XG5pbXBvcnQgeyBDaGlsZFByb2Nlc3MgfSBmcm9tIFwiY2hpbGRfcHJvY2Vzc1wiO1xuXG4vKipcbiAqIENvcHlyaWdodCAoYykgd29vZHNlclxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcbiAqIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICogU09GVFdBUkUuXG4gKi9cblxuLyoqXG4gKiBJbXBsZW1lbnRzIGEgTW9uZXJvRGFlbW9uIGFzIGEgY2xpZW50IG9mIG1vbmVyb2QuXG4gKi9cbmNsYXNzIE1vbmVyb0RhZW1vblJwYyBleHRlbmRzIE1vbmVyb0RhZW1vbiB7XG5cbiAgLy8gc3RhdGljIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgc3RhdGljIHJlYWRvbmx5IE1BWF9SRVFfU0laRSA9IFwiMzAwMDAwMFwiO1xuICBwcm90ZWN0ZWQgc3RhdGljIHJlYWRvbmx5IERFRkFVTFRfSUQgPSBcIjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDBcIjsgLy8gdW5pbml0aWFsaXplZCB0eCBvciBibG9jayBoYXNoIGZyb20gZGFlbW9uIHJwY1xuICBwcm90ZWN0ZWQgc3RhdGljIHJlYWRvbmx5IE5VTV9IRUFERVJTX1BFUl9SRVEgPSA3NTA7IC8vIG51bWJlciBvZiBoZWFkZXJzIHRvIGZldGNoIGFuZCBjYWNoZSBwZXIgcmVxdWVzdFxuICBwcm90ZWN0ZWQgc3RhdGljIHJlYWRvbmx5IERFRkFVTFRfUE9MTF9QRVJJT0QgPSAyMDAwMDsgLy8gZGVmYXVsdCBpbnRlcnZhbCBiZXR3ZWVuIHBvbGxpbmcgdGhlIGRhZW1vbiBpbiBtc1xuXG4gIC8vIGluc3RhbmNlIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgY29uZmlnOiBQYXJ0aWFsPE1vbmVyb0RhZW1vbkNvbmZpZz47XG4gIHByb3RlY3RlZCBsaXN0ZW5lcnM6IE1vbmVyb0RhZW1vbkxpc3RlbmVyW107XG4gIHByb3RlY3RlZCBjYWNoZWRIZWFkZXJzOiBhbnk7XG4gIHByb3RlY3RlZCBwcm9jZXNzOiBhbnk7XG4gIHByb3RlY3RlZCBwb2xsTGlzdGVuZXI6IGFueTtcbiAgcHJvdGVjdGVkIHByb3h5RGFlbW9uOiBhbnk7XG4gXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBjb25zdHJ1Y3Rvcihjb25maWc6IE1vbmVyb0RhZW1vbkNvbmZpZywgcHJveHlEYWVtb246IE1vbmVyb0RhZW1vblJwY1Byb3h5KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLnByb3h5RGFlbW9uID0gcHJveHlEYWVtb247XG4gICAgaWYgKGNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm47XG4gICAgdGhpcy5saXN0ZW5lcnMgPSBbXTsgICAgICAvLyBibG9jayBsaXN0ZW5lcnNcbiAgICB0aGlzLmNhY2hlZEhlYWRlcnMgPSB7fTsgIC8vIGNhY2hlZCBoZWFkZXJzIGZvciBmZXRjaGluZyBibG9ja3MgaW4gYm91bmQgY2h1bmtzXG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGludGVybmFsIHByb2Nlc3MgcnVubmluZyBtb25lcm9kLlxuICAgKiBcbiAgICogQHJldHVybiB7Q2hpbGRQcm9jZXNzfSB0aGUgbm9kZSBwcm9jZXNzIHJ1bm5pbmcgbW9uZXJvZCwgdW5kZWZpbmVkIGlmIG5vdCBjcmVhdGVkIGZyb20gbmV3IHByb2Nlc3NcbiAgICovXG4gIGdldFByb2Nlc3MoKTogQ2hpbGRQcm9jZXNzIHtcbiAgICByZXR1cm4gdGhpcy5wcm9jZXNzO1xuICB9XG4gIFxuICAvKipcbiAgICogU3RvcCB0aGUgaW50ZXJuYWwgcHJvY2VzcyBydW5uaW5nIG1vbmVyb2QsIGlmIGFwcGxpY2FibGUuXG4gICAqIFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtmb3JjZV0gc3BlY2lmaWVzIGlmIHRoZSBwcm9jZXNzIHNob3VsZCBiZSBkZXN0cm95ZWQgZm9yY2libHkgKGRlZmF1bHQgZmFsc2UpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyIHwgdW5kZWZpbmVkPn0gdGhlIGV4aXQgY29kZSBmcm9tIHN0b3BwaW5nIHRoZSBwcm9jZXNzXG4gICAqL1xuICBhc3luYyBzdG9wUHJvY2Vzcyhmb3JjZSA9IGZhbHNlKTogUHJvbWlzZTxudW1iZXIgfCB1bmRlZmluZWQ+IHtcbiAgICBpZiAodGhpcy5wcm9jZXNzID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk1vbmVyb0RhZW1vblJwYyBpbnN0YW5jZSBub3QgY3JlYXRlZCBmcm9tIG5ldyBwcm9jZXNzXCIpO1xuICAgIGxldCBsaXN0ZW5lcnNDb3B5ID0gR2VuVXRpbHMuY29weUFycmF5KGF3YWl0IHRoaXMuZ2V0TGlzdGVuZXJzKCkpO1xuICAgIGZvciAobGV0IGxpc3RlbmVyIG9mIGxpc3RlbmVyc0NvcHkpIGF3YWl0IHRoaXMucmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIHJldHVybiBHZW5VdGlscy5raWxsUHJvY2Vzcyh0aGlzLnByb2Nlc3MsIGZvcmNlID8gXCJTSUdLSUxMXCIgOiB1bmRlZmluZWQpO1xuICB9XG4gIFxuICBhc3luYyBhZGRMaXN0ZW5lcihsaXN0ZW5lcjogTW9uZXJvRGFlbW9uTGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIGFzc2VydChsaXN0ZW5lciBpbnN0YW5jZW9mIE1vbmVyb0RhZW1vbkxpc3RlbmVyLCBcIkxpc3RlbmVyIG11c3QgYmUgaW5zdGFuY2Ugb2YgTW9uZXJvRGFlbW9uTGlzdGVuZXJcIik7XG4gICAgdGhpcy5saXN0ZW5lcnMucHVzaChsaXN0ZW5lcik7XG4gICAgdGhpcy5yZWZyZXNoTGlzdGVuaW5nKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyOiBNb25lcm9EYWVtb25MaXN0ZW5lcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgYXNzZXJ0KGxpc3RlbmVyIGluc3RhbmNlb2YgTW9uZXJvRGFlbW9uTGlzdGVuZXIsIFwiTGlzdGVuZXIgbXVzdCBiZSBpbnN0YW5jZSBvZiBNb25lcm9EYWVtb25MaXN0ZW5lclwiKTtcbiAgICBsZXQgaWR4ID0gdGhpcy5saXN0ZW5lcnMuaW5kZXhPZihsaXN0ZW5lcik7XG4gICAgaWYgKGlkeCA+IC0xKSB0aGlzLmxpc3RlbmVycy5zcGxpY2UoaWR4LCAxKTtcbiAgICBlbHNlIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkxpc3RlbmVyIGlzIG5vdCByZWdpc3RlcmVkIHdpdGggZGFlbW9uXCIpO1xuICAgIHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICB9XG4gIFxuICBnZXRMaXN0ZW5lcnMoKTogTW9uZXJvRGFlbW9uTGlzdGVuZXJbXSB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldExpc3RlbmVycygpO1xuICAgIHJldHVybiB0aGlzLmxpc3RlbmVycztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgZGFlbW9uJ3MgUlBDIGNvbm5lY3Rpb24uXG4gICAqIFxuICAgKiBAcmV0dXJuIHtNb25lcm9ScGNDb25uZWN0aW9ufSB0aGUgZGFlbW9uJ3MgcnBjIGNvbm5lY3Rpb25cbiAgICovXG4gIGFzeW5jIGdldFJwY0Nvbm5lY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFJwY0Nvbm5lY3Rpb24oKTtcbiAgICByZXR1cm4gdGhpcy5jb25maWcuZ2V0U2VydmVyKCk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzQ29ubmVjdGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5pc0Nvbm5lY3RlZCgpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmdldFZlcnNpb24oKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZ2V0VmVyc2lvbigpOiBQcm9taXNlPE1vbmVyb1ZlcnNpb24+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0VmVyc2lvbigpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3ZlcnNpb25cIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBuZXcgTW9uZXJvVmVyc2lvbihyZXNwLnJlc3VsdC52ZXJzaW9uLCByZXNwLnJlc3VsdC5yZWxlYXNlKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNUcnVzdGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5pc1RydXN0ZWQoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImdldF9oZWlnaHRcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgcmV0dXJuICFyZXNwLnVudHJ1c3RlZDtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEhlaWdodCgpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2Jsb2NrX2NvdW50XCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuY291bnQ7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrSGFzaChoZWlnaHQ6IG51bWJlcik6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2NrSGFzaChoZWlnaHQpO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwib25fZ2V0X2Jsb2NrX2hhc2hcIiwgW2hlaWdodF0pKS5yZXN1bHQ7ICAvLyBUT0RPIG1vbmVyby13YWxsZXQtcnBjOiBubyBzdGF0dXMgcmV0dXJuZWRcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tUZW1wbGF0ZSh3YWxsZXRBZGRyZXNzOiBzdHJpbmcsIHJlc2VydmVTaXplPzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9CbG9ja1RlbXBsYXRlPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2NrVGVtcGxhdGUod2FsbGV0QWRkcmVzcywgcmVzZXJ2ZVNpemUpO1xuICAgIGFzc2VydCh3YWxsZXRBZGRyZXNzICYmIHR5cGVvZiB3YWxsZXRBZGRyZXNzID09PSBcInN0cmluZ1wiLCBcIk11c3Qgc3BlY2lmeSB3YWxsZXQgYWRkcmVzcyB0byBiZSBtaW5lZCB0b1wiKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9ibG9ja190ZW1wbGF0ZVwiLCB7d2FsbGV0X2FkZHJlc3M6IHdhbGxldEFkZHJlc3MsIHJlc2VydmVfc2l6ZTogcmVzZXJ2ZVNpemV9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQmxvY2tUZW1wbGF0ZShyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldExhc3RCbG9ja0hlYWRlcigpOiBQcm9taXNlPE1vbmVyb0Jsb2NrSGVhZGVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldExhc3RCbG9ja0hlYWRlcigpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2xhc3RfYmxvY2tfaGVhZGVyXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNCbG9ja0hlYWRlcihyZXNwLnJlc3VsdC5ibG9ja19oZWFkZXIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0hlYWRlckJ5SGFzaChibG9ja0hhc2g6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQmxvY2tIZWFkZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tIZWFkZXJCeUhhc2goYmxvY2tIYXNoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9ibG9ja19oZWFkZXJfYnlfaGFzaFwiLCB7aGFzaDogYmxvY2tIYXNofSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Jsb2NrSGVhZGVyKHJlc3AucmVzdWx0LmJsb2NrX2hlYWRlcik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrSGVhZGVyQnlIZWlnaHQoaGVpZ2h0OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb0Jsb2NrSGVhZGVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2NrSGVhZGVyQnlIZWlnaHQoaGVpZ2h0KTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9ibG9ja19oZWFkZXJfYnlfaGVpZ2h0XCIsIHtoZWlnaHQ6IGhlaWdodH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNCbG9ja0hlYWRlcihyZXNwLnJlc3VsdC5ibG9ja19oZWFkZXIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0hlYWRlcnNCeVJhbmdlKHN0YXJ0SGVpZ2h0PzogbnVtYmVyLCBlbmRIZWlnaHQ/OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb0Jsb2NrSGVhZGVyW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tIZWFkZXJzQnlSYW5nZShzdGFydEhlaWdodCwgZW5kSGVpZ2h0KTtcbiAgICBcbiAgICAvLyBmZXRjaCBibG9jayBoZWFkZXJzXG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmxvY2tfaGVhZGVyc19yYW5nZVwiLCB7XG4gICAgICBzdGFydF9oZWlnaHQ6IHN0YXJ0SGVpZ2h0LFxuICAgICAgZW5kX2hlaWdodDogZW5kSGVpZ2h0XG4gICAgfSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIFxuICAgIC8vIGJ1aWxkIGhlYWRlcnNcbiAgICBsZXQgaGVhZGVycyA9IFtdO1xuICAgIGZvciAobGV0IHJwY0hlYWRlciBvZiByZXNwLnJlc3VsdC5oZWFkZXJzKSB7XG4gICAgICBoZWFkZXJzLnB1c2goTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNCbG9ja0hlYWRlcihycGNIZWFkZXIpKTtcbiAgICB9XG4gICAgcmV0dXJuIGhlYWRlcnM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrQnlIYXNoKGJsb2NrSGFzaDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9CbG9jaz4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRCbG9ja0J5SGFzaChibG9ja0hhc2gpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2Jsb2NrXCIsIHtoYXNoOiBibG9ja0hhc2h9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQmxvY2socmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0J5SGVpZ2h0KGhlaWdodDogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9CbG9jaz4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRCbG9ja0J5SGVpZ2h0KGhlaWdodCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmxvY2tcIiwge2hlaWdodDogaGVpZ2h0fSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Jsb2NrKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tzQnlIZWlnaHQoaGVpZ2h0czogbnVtYmVyW10pOiBQcm9taXNlPE1vbmVyb0Jsb2NrW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tzQnlIZWlnaHQoaGVpZ2h0cyk7XG4gICAgXG4gICAgLy8gZmV0Y2ggYmxvY2tzIGluIGJpbmFyeVxuICAgIGxldCByZXNwQmluID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEJpbmFyeVJlcXVlc3QoXCJnZXRfYmxvY2tzX2J5X2hlaWdodC5iaW5cIiwge2hlaWdodHM6IGhlaWdodHN9KTtcbiAgICBcbiAgICAvLyBjb252ZXJ0IGJpbmFyeSBibG9ja3MgdG8ganNvblxuICAgIGxldCBycGNCbG9ja3MgPSBhd2FpdCBNb25lcm9VdGlscy5iaW5hcnlCbG9ja3NUb0pzb24ocmVzcEJpbik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocnBjQmxvY2tzKTtcbiAgICBcbiAgICAvLyBidWlsZCBibG9ja3Mgd2l0aCB0cmFuc2FjdGlvbnNcbiAgICBhc3NlcnQuZXF1YWwocnBjQmxvY2tzLnR4cy5sZW5ndGgsIHJwY0Jsb2Nrcy5ibG9ja3MubGVuZ3RoKTsgICAgXG4gICAgbGV0IGJsb2NrcyA9IFtdO1xuICAgIGZvciAobGV0IGJsb2NrSWR4ID0gMDsgYmxvY2tJZHggPCBycGNCbG9ja3MuYmxvY2tzLmxlbmd0aDsgYmxvY2tJZHgrKykge1xuICAgICAgXG4gICAgICAvLyBidWlsZCBibG9ja1xuICAgICAgbGV0IGJsb2NrID0gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNCbG9jayhycGNCbG9ja3MuYmxvY2tzW2Jsb2NrSWR4XSk7XG4gICAgICBibG9jay5zZXRIZWlnaHQoaGVpZ2h0c1tibG9ja0lkeF0pO1xuICAgICAgYmxvY2tzLnB1c2goYmxvY2spO1xuICAgICAgXG4gICAgICAvLyBidWlsZCB0cmFuc2FjdGlvbnNcbiAgICAgIGxldCB0eHMgPSBbXTtcbiAgICAgIGZvciAobGV0IHR4SWR4ID0gMDsgdHhJZHggPCBycGNCbG9ja3MudHhzW2Jsb2NrSWR4XS5sZW5ndGg7IHR4SWR4KyspIHtcbiAgICAgICAgbGV0IHR4ID0gbmV3IE1vbmVyb1R4KCk7XG4gICAgICAgIHR4cy5wdXNoKHR4KTtcbiAgICAgICAgdHguc2V0SGFzaChycGNCbG9ja3MuYmxvY2tzW2Jsb2NrSWR4XS50eF9oYXNoZXNbdHhJZHhdKTtcbiAgICAgICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICAgICAgdHguc2V0UmVsYXkodHJ1ZSk7XG4gICAgICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgICAgICB0eC5zZXRJc0RvdWJsZVNwZW5kU2VlbihmYWxzZSk7XG4gICAgICAgIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVHgocnBjQmxvY2tzLnR4c1tibG9ja0lkeF1bdHhJZHhdLCB0eCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIG1lcmdlIGludG8gb25lIGJsb2NrXG4gICAgICBibG9jay5zZXRUeHMoW10pO1xuICAgICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICAgIGlmICh0eC5nZXRCbG9jaygpKSBibG9jay5tZXJnZSh0eC5nZXRCbG9jaygpKTtcbiAgICAgICAgZWxzZSBibG9jay5nZXRUeHMoKS5wdXNoKHR4LnNldEJsb2NrKGJsb2NrKSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBibG9ja3M7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2Nrc0J5UmFuZ2Uoc3RhcnRIZWlnaHQ/OiBudW1iZXIsIGVuZEhlaWdodD86IG51bWJlcik6IFByb21pc2U8TW9uZXJvQmxvY2tbXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRCbG9ja3NCeVJhbmdlKHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpO1xuICAgIGlmIChzdGFydEhlaWdodCA9PT0gdW5kZWZpbmVkKSBzdGFydEhlaWdodCA9IDA7XG4gICAgaWYgKGVuZEhlaWdodCA9PT0gdW5kZWZpbmVkKSBlbmRIZWlnaHQgPSBhd2FpdCB0aGlzLmdldEhlaWdodCgpIC0gMTtcbiAgICBsZXQgaGVpZ2h0cyA9IFtdO1xuICAgIGZvciAobGV0IGhlaWdodCA9IHN0YXJ0SGVpZ2h0OyBoZWlnaHQgPD0gZW5kSGVpZ2h0OyBoZWlnaHQrKykgaGVpZ2h0cy5wdXNoKGhlaWdodCk7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZ2V0QmxvY2tzQnlIZWlnaHQoaGVpZ2h0cyk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2Nrc0J5UmFuZ2VDaHVua2VkKHN0YXJ0SGVpZ2h0PzogbnVtYmVyLCBlbmRIZWlnaHQ/OiBudW1iZXIsIG1heENodW5rU2l6ZT86IG51bWJlcik6IFByb21pc2U8TW9uZXJvQmxvY2tbXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRCbG9ja3NCeVJhbmdlQ2h1bmtlZChzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBtYXhDaHVua1NpemUpO1xuICAgIGlmIChzdGFydEhlaWdodCA9PT0gdW5kZWZpbmVkKSBzdGFydEhlaWdodCA9IDA7XG4gICAgaWYgKGVuZEhlaWdodCA9PT0gdW5kZWZpbmVkKSBlbmRIZWlnaHQgPSBhd2FpdCB0aGlzLmdldEhlaWdodCgpIC0gMTtcbiAgICBsZXQgbGFzdEhlaWdodCA9IHN0YXJ0SGVpZ2h0IC0gMTtcbiAgICBsZXQgYmxvY2tzID0gW107XG4gICAgd2hpbGUgKGxhc3RIZWlnaHQgPCBlbmRIZWlnaHQpIHtcbiAgICAgIGZvciAobGV0IGJsb2NrIG9mIGF3YWl0IHRoaXMuZ2V0TWF4QmxvY2tzKGxhc3RIZWlnaHQgKyAxLCBlbmRIZWlnaHQsIG1heENodW5rU2l6ZSkpIHtcbiAgICAgICAgYmxvY2tzLnB1c2goYmxvY2spO1xuICAgICAgfVxuICAgICAgbGFzdEhlaWdodCA9IGJsb2Nrc1tibG9ja3MubGVuZ3RoIC0gMV0uZ2V0SGVpZ2h0KCk7XG4gICAgfVxuICAgIHJldHVybiBibG9ja3M7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4cyh0eEhhc2hlczogc3RyaW5nW10sIHBydW5lID0gZmFsc2UpOiBQcm9taXNlPE1vbmVyb1R4W10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0VHhzKHR4SGFzaGVzLCBwcnVuZSk7XG4gICAgICAgIFxuICAgIC8vIHZhbGlkYXRlIGlucHV0XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkodHhIYXNoZXMpICYmIHR4SGFzaGVzLmxlbmd0aCA+IDAsIFwiTXVzdCBwcm92aWRlIGFuIGFycmF5IG9mIHRyYW5zYWN0aW9uIGhhc2hlc1wiKTtcbiAgICBhc3NlcnQocHJ1bmUgPT09IHVuZGVmaW5lZCB8fCB0eXBlb2YgcHJ1bmUgPT09IFwiYm9vbGVhblwiLCBcIlBydW5lIG11c3QgYmUgYSBib29sZWFuIG9yIHVuZGVmaW5lZFwiKTtcbiAgICAgICAgXG4gICAgLy8gZmV0Y2ggdHJhbnNhY3Rpb25zXG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJnZXRfdHJhbnNhY3Rpb25zXCIsIHtcbiAgICAgIHR4c19oYXNoZXM6IHR4SGFzaGVzLFxuICAgICAgZGVjb2RlX2FzX2pzb246IHRydWUsXG4gICAgICBwcnVuZTogcHJ1bmVcbiAgICB9KTtcbiAgICB0cnkge1xuICAgICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICBpZiAoZS5tZXNzYWdlLmluZGV4T2YoXCJGYWlsZWQgdG8gcGFyc2UgaGV4IHJlcHJlc2VudGF0aW9uIG9mIHRyYW5zYWN0aW9uIGhhc2hcIikgPj0gMCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiSW52YWxpZCB0cmFuc2FjdGlvbiBoYXNoXCIpO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG4gICAgICAgIFxuICAgIC8vIGJ1aWxkIHRyYW5zYWN0aW9uIG1vZGVsc1xuICAgIGxldCB0eHMgPSBbXTtcbiAgICBpZiAocmVzcC50eHMpIHtcbiAgICAgIGZvciAobGV0IHR4SWR4ID0gMDsgdHhJZHggPCByZXNwLnR4cy5sZW5ndGg7IHR4SWR4KyspIHtcbiAgICAgICAgbGV0IHR4ID0gbmV3IE1vbmVyb1R4KCk7XG4gICAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgICAgIHR4cy5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVHgocmVzcC50eHNbdHhJZHhdLCB0eCkpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdHhzO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeEhleGVzKHR4SGFzaGVzOiBzdHJpbmdbXSwgcHJ1bmUgPSBmYWxzZSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0VHhIZXhlcyh0eEhhc2hlcywgcHJ1bmUpO1xuICAgIGxldCBoZXhlcyA9IFtdO1xuICAgIGZvciAobGV0IHR4IG9mIGF3YWl0IHRoaXMuZ2V0VHhzKHR4SGFzaGVzLCBwcnVuZSkpIGhleGVzLnB1c2gocHJ1bmUgPyB0eC5nZXRQcnVuZWRIZXgoKSA6IHR4LmdldEZ1bGxIZXgoKSk7XG4gICAgcmV0dXJuIGhleGVzO1xuICB9XG4gIFxuICBhc3luYyBnZXRNaW5lclR4U3VtKGhlaWdodDogbnVtYmVyLCBudW1CbG9ja3M6IG51bWJlcik6IFByb21pc2U8TW9uZXJvTWluZXJUeFN1bT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRNaW5lclR4U3VtKGhlaWdodCwgbnVtQmxvY2tzKTtcbiAgICBpZiAoaGVpZ2h0ID09PSB1bmRlZmluZWQpIGhlaWdodCA9IDA7XG4gICAgZWxzZSBhc3NlcnQoaGVpZ2h0ID49IDAsIFwiSGVpZ2h0IG11c3QgYmUgYW4gaW50ZWdlciA+PSAwXCIpO1xuICAgIGlmIChudW1CbG9ja3MgPT09IHVuZGVmaW5lZCkgbnVtQmxvY2tzID0gYXdhaXQgdGhpcy5nZXRIZWlnaHQoKTtcbiAgICBlbHNlIGFzc2VydChudW1CbG9ja3MgPj0gMCwgXCJDb3VudCBtdXN0IGJlIGFuIGludGVnZXIgPj0gMFwiKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9jb2luYmFzZV90eF9zdW1cIiwge2hlaWdodDogaGVpZ2h0LCBjb3VudDogbnVtQmxvY2tzfSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIGxldCB0eFN1bSA9IG5ldyBNb25lcm9NaW5lclR4U3VtKCk7XG4gICAgdHhTdW0uc2V0RW1pc3Npb25TdW0oQmlnSW50KHJlc3AucmVzdWx0LmVtaXNzaW9uX2Ftb3VudCkpO1xuICAgIHR4U3VtLnNldEZlZVN1bShCaWdJbnQocmVzcC5yZXN1bHQuZmVlX2Ftb3VudCkpO1xuICAgIHJldHVybiB0eFN1bTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RmVlRXN0aW1hdGUoZ3JhY2VCbG9ja3M/OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb0ZlZUVzdGltYXRlPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEZlZUVzdGltYXRlKGdyYWNlQmxvY2tzKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9mZWVfZXN0aW1hdGVcIiwge2dyYWNlX2Jsb2NrczogZ3JhY2VCbG9ja3N9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgbGV0IGZlZUVzdGltYXRlID0gbmV3IE1vbmVyb0ZlZUVzdGltYXRlKCk7XG4gICAgZmVlRXN0aW1hdGUuc2V0RmVlKEJpZ0ludChyZXNwLnJlc3VsdC5mZWUpKTtcbiAgICBsZXQgZmVlcyA9IFtdO1xuICAgIC8vIGlmIHRoZXJlIGFyZSBvbmx5IG1pbmVkIGJsb2NrcyBsYXRlbHksIGZlZXMgYXJyYXkgaXMgZW1wdHkgKG5vdCBwcmVzZW50KVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVzcC5yZXN1bHQuZmVlcz8ubGVuZ3RoOyBpKyspIGZlZXMucHVzaChCaWdJbnQocmVzcC5yZXN1bHQuZmVlc1tpXSkpO1xuICAgIGZlZUVzdGltYXRlLnNldEZlZXMoZmVlcyk7XG4gICAgZmVlRXN0aW1hdGUuc2V0UXVhbnRpemF0aW9uTWFzayhCaWdJbnQocmVzcC5yZXN1bHQucXVhbnRpemF0aW9uX21hc2spKTtcbiAgICByZXR1cm4gZmVlRXN0aW1hdGU7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdFR4SGV4KHR4SGV4OiBzdHJpbmcsIGRvTm90UmVsYXk6IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb1N1Ym1pdFR4UmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnN1Ym1pdFR4SGV4KHR4SGV4LCBkb05vdFJlbGF5KTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcInNlbmRfcmF3X3RyYW5zYWN0aW9uXCIsIHt0eF9hc19oZXg6IHR4SGV4LCBkb19ub3RfcmVsYXk6IGRvTm90UmVsYXl9KTtcbiAgICBsZXQgcmVzdWx0ID0gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNTdWJtaXRUeFJlc3VsdChyZXNwKTtcbiAgICBcbiAgICAvLyBzZXQgaXNHb29kIGJhc2VkIG9uIHN0YXR1c1xuICAgIHRyeSB7XG4gICAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTsgXG4gICAgICByZXN1bHQuc2V0SXNHb29kKHRydWUpO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgcmVzdWx0LnNldElzR29vZChmYWxzZSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbGF5VHhzQnlIYXNoKHR4SGFzaGVzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5yZWxheVR4c0J5SGFzaCh0eEhhc2hlcyk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJyZWxheV90eFwiLCB7dHhpZHM6IHR4SGFzaGVzfSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFBvb2woKTogUHJvbWlzZTxNb25lcm9UeFtdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFR4UG9vbCgpO1xuICAgIFxuICAgIC8vIHNlbmQgcnBjIHJlcXVlc3RcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImdldF90cmFuc2FjdGlvbl9wb29sXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIFxuICAgIC8vIGJ1aWxkIHR4c1xuICAgIGxldCB0eHMgPSBbXTtcbiAgICBpZiAocmVzcC50cmFuc2FjdGlvbnMpIHtcbiAgICAgIGZvciAobGV0IHJwY1R4IG9mIHJlc3AudHJhbnNhY3Rpb25zKSB7XG4gICAgICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeCgpO1xuICAgICAgICB0eHMucHVzaCh0eCk7XG4gICAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICAgICAgdHguc2V0SW5UeFBvb2wodHJ1ZSk7XG4gICAgICAgIHR4LnNldE51bUNvbmZpcm1hdGlvbnMoMCk7XG4gICAgICAgIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVHgocnBjVHgsIHR4KTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHR4cztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhQb29sSGFzaGVzKCk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIC8vIGFzeW5jIGdldFR4UG9vbEJhY2tsb2coKTogUHJvbWlzZTxNb25lcm9UeEJhY2tsb2dFbnRyeVtdPiB7XG4gIC8vICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICAvLyB9XG5cbiAgYXN5bmMgZ2V0VHhQb29sU3RhdHMoKTogUHJvbWlzZTxNb25lcm9UeFBvb2xTdGF0cz4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRUeFBvb2xTdGF0cygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwiZ2V0X3RyYW5zYWN0aW9uX3Bvb2xfc3RhdHNcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVHhQb29sU3RhdHMocmVzcC5wb29sX3N0YXRzKTtcbiAgfVxuICBcbiAgYXN5bmMgZmx1c2hUeFBvb2woaGFzaGVzPzogc3RyaW5nIHwgc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZmx1c2hUeFBvb2woaGFzaGVzKTtcbiAgICBpZiAoaGFzaGVzKSBoYXNoZXMgPSBHZW5VdGlscy5saXN0aWZ5KGhhc2hlcyk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJmbHVzaF90eHBvb2xcIiwge3R4aWRzOiBoYXNoZXN9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEtleUltYWdlU3BlbnRTdGF0dXNlcyhrZXlJbWFnZXM6IHN0cmluZ1tdKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzKGtleUltYWdlcyk7XG4gICAgaWYgKGtleUltYWdlcyA9PT0gdW5kZWZpbmVkIHx8IGtleUltYWdlcy5sZW5ndGggPT09IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBrZXkgaW1hZ2VzIHRvIGNoZWNrIHRoZSBzdGF0dXMgb2ZcIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJpc19rZXlfaW1hZ2Vfc3BlbnRcIiwge2tleV9pbWFnZXM6IGtleUltYWdlc30pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIHJldHVybiByZXNwLnNwZW50X3N0YXR1cztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0T3V0cHV0SGlzdG9ncmFtKGFtb3VudHM/OiBiaWdpbnRbXSwgbWluQ291bnQ/OiBudW1iZXIsIG1heENvdW50PzogbnVtYmVyLCBpc1VubG9ja2VkPzogYm9vbGVhbiwgcmVjZW50Q3V0b2ZmPzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeVtdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldE91dHB1dEhpc3RvZ3JhbShhbW91bnRzLCBtaW5Db3VudCwgbWF4Q291bnQsIGlzVW5sb2NrZWQsIHJlY2VudEN1dG9mZik7XG4gICAgXG4gICAgLy8gc2VuZCBycGMgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X291dHB1dF9oaXN0b2dyYW1cIiwge1xuICAgICAgYW1vdW50czogYW1vdW50cyxcbiAgICAgIG1pbl9jb3VudDogbWluQ291bnQsXG4gICAgICBtYXhfY291bnQ6IG1heENvdW50LFxuICAgICAgdW5sb2NrZWQ6IGlzVW5sb2NrZWQsXG4gICAgICByZWNlbnRfY3V0b2ZmOiByZWNlbnRDdXRvZmZcbiAgICB9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgXG4gICAgLy8gYnVpbGQgaGlzdG9ncmFtIGVudHJpZXMgZnJvbSByZXNwb25zZVxuICAgIGxldCBlbnRyaWVzID0gW107XG4gICAgaWYgKCFyZXNwLnJlc3VsdC5oaXN0b2dyYW0pIHJldHVybiBlbnRyaWVzO1xuICAgIGZvciAobGV0IHJwY0VudHJ5IG9mIHJlc3AucmVzdWx0Lmhpc3RvZ3JhbSkge1xuICAgICAgZW50cmllcy5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjT3V0cHV0SGlzdG9ncmFtRW50cnkocnBjRW50cnkpKTtcbiAgICB9XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dERpc3RyaWJ1dGlvbihhbW91bnRzLCBjdW11bGF0aXZlLCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldE91dHB1dERpc3RyaWJ1dGlvbihhbW91bnRzLCBjdW11bGF0aXZlLCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0KTtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQgKHJlc3BvbnNlICdkaXN0cmlidXRpb24nIGZpZWxkIGlzIGJpbmFyeSlcIik7XG4gICAgXG4vLyAgICBsZXQgYW1vdW50U3RycyA9IFtdO1xuLy8gICAgZm9yIChsZXQgYW1vdW50IG9mIGFtb3VudHMpIGFtb3VudFN0cnMucHVzaChhbW91bnQudG9KU1ZhbHVlKCkpO1xuLy8gICAgY29uc29sZS5sb2coYW1vdW50U3Rycyk7XG4vLyAgICBjb25zb2xlLmxvZyhjdW11bGF0aXZlKTtcbi8vICAgIGNvbnNvbGUubG9nKHN0YXJ0SGVpZ2h0KTtcbi8vICAgIGNvbnNvbGUubG9nKGVuZEhlaWdodCk7XG4vLyAgICBcbi8vICAgIC8vIHNlbmQgcnBjIHJlcXVlc3Rcbi8vICAgIGNvbnNvbGUubG9nKFwiKioqKioqKioqKiogU0VORElORyBSRVFVRVNUICoqKioqKioqKioqKipcIik7XG4vLyAgICBpZiAoc3RhcnRIZWlnaHQgPT09IHVuZGVmaW5lZCkgc3RhcnRIZWlnaHQgPSAwO1xuLy8gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfb3V0cHV0X2Rpc3RyaWJ1dGlvblwiLCB7XG4vLyAgICAgIGFtb3VudHM6IGFtb3VudFN0cnMsXG4vLyAgICAgIGN1bXVsYXRpdmU6IGN1bXVsYXRpdmUsXG4vLyAgICAgIGZyb21faGVpZ2h0OiBzdGFydEhlaWdodCxcbi8vICAgICAgdG9faGVpZ2h0OiBlbmRIZWlnaHRcbi8vICAgIH0pO1xuLy8gICAgXG4vLyAgICBjb25zb2xlLmxvZyhcIlJFU1BPTlNFXCIpO1xuLy8gICAgY29uc29sZS5sb2cocmVzcCk7XG4vLyAgICBcbi8vICAgIC8vIGJ1aWxkIGRpc3RyaWJ1dGlvbiBlbnRyaWVzIGZyb20gcmVzcG9uc2Vcbi8vICAgIGxldCBlbnRyaWVzID0gW107XG4vLyAgICBpZiAoIXJlc3AucmVzdWx0LmRpc3RyaWJ1dGlvbnMpIHJldHVybiBlbnRyaWVzOyBcbi8vICAgIGZvciAobGV0IHJwY0VudHJ5IG9mIHJlc3AucmVzdWx0LmRpc3RyaWJ1dGlvbnMpIHtcbi8vICAgICAgbGV0IGVudHJ5ID0gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNPdXRwdXREaXN0cmlidXRpb25FbnRyeShycGNFbnRyeSk7XG4vLyAgICAgIGVudHJpZXMucHVzaChlbnRyeSk7XG4vLyAgICB9XG4vLyAgICByZXR1cm4gZW50cmllcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SW5mbygpOiBQcm9taXNlPE1vbmVyb0RhZW1vbkluZm8+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0SW5mbygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2luZm9cIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0luZm8ocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBnZXRTeW5jSW5mbygpOiBQcm9taXNlPE1vbmVyb0RhZW1vblN5bmNJbmZvPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFN5bmNJbmZvKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzeW5jX2luZm9cIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1N5bmNJbmZvKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGFyZEZvcmtJbmZvKCk6IFByb21pc2U8TW9uZXJvSGFyZEZvcmtJbmZvPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEhhcmRGb3JrSW5mbygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiaGFyZF9mb3JrX2luZm9cIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0hhcmRGb3JrSW5mbyhyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFsdENoYWlucygpOiBQcm9taXNlPE1vbmVyb0FsdENoYWluW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QWx0Q2hhaW5zKCk7XG4gICAgXG4vLyAgICAvLyBtb2NrZWQgcmVzcG9uc2UgZm9yIHRlc3Rcbi8vICAgIGxldCByZXNwID0ge1xuLy8gICAgICAgIHN0YXR1czogXCJPS1wiLFxuLy8gICAgICAgIGNoYWluczogW1xuLy8gICAgICAgICAge1xuLy8gICAgICAgICAgICBibG9ja19oYXNoOiBcIjY5N2NmMDNjODlhOWIxMThmN2JkZjExYjFiM2E2YTAyOGQ3YjM2MTdkMmQwZWQ5MTMyMmM1NzA5YWNmNzU2MjVcIixcbi8vICAgICAgICAgICAgZGlmZmljdWx0eTogMTQxMTQ3Mjk2MzgzMDAyODAsXG4vLyAgICAgICAgICAgIGhlaWdodDogMTU2MjA2Mixcbi8vICAgICAgICAgICAgbGVuZ3RoOiAyXG4vLyAgICAgICAgICB9XG4vLyAgICAgICAgXVxuLy8gICAgfVxuICAgIFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FsdGVybmF0ZV9jaGFpbnNcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIGxldCBjaGFpbnMgPSBbXTtcbiAgICBpZiAoIXJlc3AucmVzdWx0LmNoYWlucykgcmV0dXJuIGNoYWlucztcbiAgICBmb3IgKGxldCBycGNDaGFpbiBvZiByZXNwLnJlc3VsdC5jaGFpbnMpIGNoYWlucy5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQWx0Q2hhaW4ocnBjQ2hhaW4pKTtcbiAgICByZXR1cm4gY2hhaW5zO1xuICB9XG4gIFxuICBhc3luYyBnZXRBbHRCbG9ja0hhc2hlcygpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEFsdEJsb2NrSGFzaGVzKCk7XG4gICAgXG4vLyAgICAvLyBtb2NrZWQgcmVzcG9uc2UgZm9yIHRlc3Rcbi8vICAgIGxldCByZXNwID0ge1xuLy8gICAgICAgIHN0YXR1czogXCJPS1wiLFxuLy8gICAgICAgIHVudHJ1c3RlZDogZmFsc2UsXG4vLyAgICAgICAgYmxrc19oYXNoZXM6IFtcIjljMjI3N2M1NDcwMjM0YmU4YjMyMzgyY2RmODA5NGExMDNhYmE0ZmNkNWU4NzVhNmZjMTU5ZGMyZWMwMGUwMTFcIixcIjYzN2MwZTBmMDU1OGUyODQ0OTNmMzhhNWZjY2EzNjE1ZGI1OTQ1OGQ5MGQzYTVlZmYwYTE4ZmY1OWI4M2Y0NmZcIixcIjZmM2FkYzE3NGEyZTgwODI4MTllYmI5NjVjOTZhMDk1ZTNlOGI2MzkyOWFkOWJlMmQ3MDVhZDljMDg2YTZiMWNcIixcIjY5N2NmMDNjODlhOWIxMThmN2JkZjExYjFiM2E2YTAyOGQ3YjM2MTdkMmQwZWQ5MTMyMmM1NzA5YWNmNzU2MjVcIl1cbi8vICAgIH1cbiAgICBcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImdldF9hbHRfYmxvY2tzX2hhc2hlc1wiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICBpZiAoIXJlc3AuYmxrc19oYXNoZXMpIHJldHVybiBbXTtcbiAgICByZXR1cm4gcmVzcC5ibGtzX2hhc2hlcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RG93bmxvYWRMaW1pdCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXREb3dubG9hZExpbWl0KCk7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldEJhbmR3aWR0aExpbWl0cygpKVswXTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0RG93bmxvYWRMaW1pdChsaW1pdDogbnVtYmVyKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc2V0RG93bmxvYWRMaW1pdChsaW1pdCk7XG4gICAgaWYgKGxpbWl0ID09IC0xKSByZXR1cm4gYXdhaXQgdGhpcy5yZXNldERvd25sb2FkTGltaXQoKTtcbiAgICBpZiAoIShHZW5VdGlscy5pc0ludChsaW1pdCkgJiYgbGltaXQgPiAwKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiRG93bmxvYWQgbGltaXQgbXVzdCBiZSBhbiBpbnRlZ2VyIGdyZWF0ZXIgdGhhbiAwXCIpO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5zZXRCYW5kd2lkdGhMaW1pdHMobGltaXQsIDApKVswXTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzZXREb3dubG9hZExpbWl0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnJlc2V0RG93bmxvYWRMaW1pdCgpO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5zZXRCYW5kd2lkdGhMaW1pdHMoLTEsIDApKVswXTtcbiAgfVxuXG4gIGFzeW5jIGdldFVwbG9hZExpbWl0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFVwbG9hZExpbWl0KCk7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldEJhbmR3aWR0aExpbWl0cygpKVsxXTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0VXBsb2FkTGltaXQobGltaXQ6IG51bWJlcik6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnNldFVwbG9hZExpbWl0KGxpbWl0KTtcbiAgICBpZiAobGltaXQgPT0gLTEpIHJldHVybiBhd2FpdCB0aGlzLnJlc2V0VXBsb2FkTGltaXQoKTtcbiAgICBpZiAoIShHZW5VdGlscy5pc0ludChsaW1pdCkgJiYgbGltaXQgPiAwKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiVXBsb2FkIGxpbWl0IG11c3QgYmUgYW4gaW50ZWdlciBncmVhdGVyIHRoYW4gMFwiKTtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuc2V0QmFuZHdpZHRoTGltaXRzKDAsIGxpbWl0KSlbMV07XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2V0VXBsb2FkTGltaXQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24ucmVzZXRVcGxvYWRMaW1pdCgpO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5zZXRCYW5kd2lkdGhMaW1pdHMoMCwgLTEpKVsxXTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGVlcnMoKTogUHJvbWlzZTxNb25lcm9QZWVyW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0UGVlcnMoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9jb25uZWN0aW9uc1wiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgbGV0IHBlZXJzID0gW107XG4gICAgaWYgKCFyZXNwLnJlc3VsdC5jb25uZWN0aW9ucykgcmV0dXJuIHBlZXJzO1xuICAgIGZvciAobGV0IHJwY0Nvbm5lY3Rpb24gb2YgcmVzcC5yZXN1bHQuY29ubmVjdGlvbnMpIHtcbiAgICAgIHBlZXJzLnB1c2goTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNDb25uZWN0aW9uKHJwY0Nvbm5lY3Rpb24pKTtcbiAgICB9XG4gICAgcmV0dXJuIHBlZXJzO1xuICB9XG4gIFxuICBhc3luYyBnZXRLbm93blBlZXJzKCk6IFByb21pc2U8TW9uZXJvUGVlcltdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEtub3duUGVlcnMoKTtcbiAgICBcbiAgICAvLyB0eCBjb25maWdcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImdldF9wZWVyX2xpc3RcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgXG4gICAgLy8gYnVpbGQgcGVlcnNcbiAgICBsZXQgcGVlcnMgPSBbXTtcbiAgICBpZiAocmVzcC5ncmF5X2xpc3QpIHtcbiAgICAgIGZvciAobGV0IHJwY1BlZXIgb2YgcmVzcC5ncmF5X2xpc3QpIHtcbiAgICAgICAgbGV0IHBlZXIgPSBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1BlZXIocnBjUGVlcik7XG4gICAgICAgIHBlZXIuc2V0SXNPbmxpbmUoZmFsc2UpOyAvLyBncmF5IGxpc3QgbWVhbnMgb2ZmbGluZSBsYXN0IGNoZWNrZWRcbiAgICAgICAgcGVlcnMucHVzaChwZWVyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHJlc3Aud2hpdGVfbGlzdCkge1xuICAgICAgZm9yIChsZXQgcnBjUGVlciBvZiByZXNwLndoaXRlX2xpc3QpIHtcbiAgICAgICAgbGV0IHBlZXIgPSBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1BlZXIocnBjUGVlcik7XG4gICAgICAgIHBlZXIuc2V0SXNPbmxpbmUodHJ1ZSk7IC8vIHdoaXRlIGxpc3QgbWVhbnMgb25saW5lIGxhc3QgY2hlY2tlZFxuICAgICAgICBwZWVycy5wdXNoKHBlZXIpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcGVlcnM7XG4gIH1cbiAgXG4gIGFzeW5jIHNldE91dGdvaW5nUGVlckxpbWl0KGxpbWl0OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc2V0T3V0Z29pbmdQZWVyTGltaXQobGltaXQpO1xuICAgIGlmICghKEdlblV0aWxzLmlzSW50KGxpbWl0KSAmJiBsaW1pdCA+PSAwKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiT3V0Z29pbmcgcGVlciBsaW1pdCBtdXN0IGJlID49IDBcIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJvdXRfcGVlcnNcIiwge291dF9wZWVyczogbGltaXR9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0SW5jb21pbmdQZWVyTGltaXQobGltaXQ6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5zZXRJbmNvbWluZ1BlZXJMaW1pdChsaW1pdCk7XG4gICAgaWYgKCEoR2VuVXRpbHMuaXNJbnQobGltaXQpICYmIGxpbWl0ID49IDApKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJJbmNvbWluZyBwZWVyIGxpbWl0IG11c3QgYmUgPj0gMFwiKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImluX3BlZXJzXCIsIHtpbl9wZWVyczogbGltaXR9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGVlckJhbnMoKTogUHJvbWlzZTxNb25lcm9CYW5bXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRQZWVyQmFucygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2JhbnNcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIGxldCBiYW5zID0gW107XG4gICAgZm9yIChsZXQgcnBjQmFuIG9mIHJlc3AucmVzdWx0LmJhbnMpIHtcbiAgICAgIGxldCBiYW4gPSBuZXcgTW9uZXJvQmFuKCk7XG4gICAgICBiYW4uc2V0SG9zdChycGNCYW4uaG9zdCk7XG4gICAgICBiYW4uc2V0SXAocnBjQmFuLmlwKTtcbiAgICAgIGJhbi5zZXRTZWNvbmRzKHJwY0Jhbi5zZWNvbmRzKTtcbiAgICAgIGJhbnMucHVzaChiYW4pO1xuICAgIH1cbiAgICByZXR1cm4gYmFucztcbiAgfVxuICBcbiAgYXN5bmMgc2V0UGVlckJhbnMoYmFuczogTW9uZXJvQmFuW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc2V0UGVlckJhbnMoYmFucyk7XG4gICAgbGV0IHJwY0JhbnMgPSBbXTtcbiAgICBmb3IgKGxldCBiYW4gb2YgYmFucykgcnBjQmFucy5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0VG9ScGNCYW4oYmFuKSk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzZXRfYmFuc1wiLCB7YmFuczogcnBjQmFuc30pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgc3RhcnRNaW5pbmcoYWRkcmVzczogc3RyaW5nLCBudW1UaHJlYWRzPzogbnVtYmVyLCBpc0JhY2tncm91bmQ/OiBib29sZWFuLCBpZ25vcmVCYXR0ZXJ5PzogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5zdGFydE1pbmluZyhhZGRyZXNzLCBudW1UaHJlYWRzLCBpc0JhY2tncm91bmQsIGlnbm9yZUJhdHRlcnkpO1xuICAgIGFzc2VydChhZGRyZXNzLCBcIk11c3QgcHJvdmlkZSBhZGRyZXNzIHRvIG1pbmUgdG9cIik7XG4gICAgYXNzZXJ0KEdlblV0aWxzLmlzSW50KG51bVRocmVhZHMpICYmIG51bVRocmVhZHMgPiAwLCBcIk51bWJlciBvZiB0aHJlYWRzIG11c3QgYmUgYW4gaW50ZWdlciBncmVhdGVyIHRoYW4gMFwiKTtcbiAgICBhc3NlcnQoaXNCYWNrZ3JvdW5kID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIGlzQmFja2dyb3VuZCA9PT0gXCJib29sZWFuXCIpO1xuICAgIGFzc2VydChpZ25vcmVCYXR0ZXJ5ID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIGlnbm9yZUJhdHRlcnkgPT09IFwiYm9vbGVhblwiKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcInN0YXJ0X21pbmluZ1wiLCB7XG4gICAgICBtaW5lcl9hZGRyZXNzOiBhZGRyZXNzLFxuICAgICAgdGhyZWFkc19jb3VudDogbnVtVGhyZWFkcyxcbiAgICAgIGRvX2JhY2tncm91bmRfbWluaW5nOiBpc0JhY2tncm91bmQsXG4gICAgICBpZ25vcmVfYmF0dGVyeTogaWdub3JlQmF0dGVyeSxcbiAgICB9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgc3RvcE1pbmluZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc3RvcE1pbmluZygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwic3RvcF9taW5pbmdcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE1pbmluZ1N0YXR1cygpOiBQcm9taXNlPE1vbmVyb01pbmluZ1N0YXR1cz4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRNaW5pbmdTdGF0dXMoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcIm1pbmluZ19zdGF0dXNcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjTWluaW5nU3RhdHVzKHJlc3ApO1xuICB9XG4gIFxuICBhc3luYyBzdWJtaXRCbG9ja3MoYmxvY2tCbG9iczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc3VibWl0QmxvY2tzKCk7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkoYmxvY2tCbG9icykgJiYgYmxvY2tCbG9icy5sZW5ndGggPiAwLCBcIk11c3QgcHJvdmlkZSBhbiBhcnJheSBvZiBtaW5lZCBibG9jayBibG9icyB0byBzdWJtaXRcIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdWJtaXRfYmxvY2tcIiwgYmxvY2tCbG9icyk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICB9XG5cbiAgYXN5bmMgcHJ1bmVCbG9ja2NoYWluKGNoZWNrOiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9QcnVuZVJlc3VsdD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5wcnVuZUJsb2NrY2hhaW4oKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInBydW5lX2Jsb2NrY2hhaW5cIiwge2NoZWNrOiBjaGVja30sIDApO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICBsZXQgcmVzdWx0ID0gbmV3IE1vbmVyb1BydW5lUmVzdWx0KCk7XG4gICAgcmVzdWx0LnNldElzUHJ1bmVkKHJlc3AucmVzdWx0LnBydW5lZCk7XG4gICAgcmVzdWx0LnNldFBydW5pbmdTZWVkKHJlc3AucmVzdWx0LnBydW5pbmdfc2VlZCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tGb3JVcGRhdGUoKTogUHJvbWlzZTxNb25lcm9EYWVtb25VcGRhdGVDaGVja1Jlc3VsdD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5jaGVja0ZvclVwZGF0ZSgpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwidXBkYXRlXCIsIHtjb21tYW5kOiBcImNoZWNrXCJ9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNVcGRhdGVDaGVja1Jlc3VsdChyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgZG93bmxvYWRVcGRhdGUocGF0aD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZG93bmxvYWRVcGRhdGUocGF0aCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJ1cGRhdGVcIiwge2NvbW1hbmQ6IFwiZG93bmxvYWRcIiwgcGF0aDogcGF0aH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1VwZGF0ZURvd25sb2FkUmVzdWx0KHJlc3ApO1xuICB9XG4gIFxuICBhc3luYyBzdG9wKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5zdG9wKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJzdG9wX2RhZW1vblwiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgd2FpdEZvck5leHRCbG9ja0hlYWRlcigpOiBQcm9taXNlPE1vbmVyb0Jsb2NrSGVhZGVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLndhaXRGb3JOZXh0QmxvY2tIZWFkZXIoKTtcbiAgICBsZXQgdGhhdCA9IHRoaXM7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jIGZ1bmN0aW9uKHJlc29sdmUpIHtcbiAgICAgIGF3YWl0IHRoYXQuYWRkTGlzdGVuZXIobmV3IGNsYXNzIGV4dGVuZHMgTW9uZXJvRGFlbW9uTGlzdGVuZXIge1xuICAgICAgICBhc3luYyBvbkJsb2NrSGVhZGVyKGhlYWRlcikge1xuICAgICAgICAgIGF3YWl0IHRoYXQucmVtb3ZlTGlzdGVuZXIodGhpcyk7XG4gICAgICAgICAgcmVzb2x2ZShoZWFkZXIpO1xuICAgICAgICB9XG4gICAgICB9KTsgXG4gICAgfSk7XG4gIH1cblxuICBnZXRQb2xsSW50ZXJ2YWwoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5jb25maWcucG9sbEludGVydmFsO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLSBBREQgSlNET0MgRk9SIFNVUFBPUlRFRCBERUZBVUxUIElNUExFTUVOVEFUSU9OUyAtLS0tLS0tLS0tLS0tLVxuICBhc3luYyBnZXRUeCh0eEhhc2g/OiBzdHJpbmcsIHBydW5lID0gZmFsc2UpOiBQcm9taXNlPE1vbmVyb1R4PiB7IHJldHVybiBzdXBlci5nZXRUeCh0eEhhc2gsIHBydW5lKTsgfTtcbiAgYXN5bmMgZ2V0VHhIZXgodHhIYXNoOiBzdHJpbmcsIHBydW5lID0gZmFsc2UpOiBQcm9taXNlPHN0cmluZz4geyByZXR1cm4gc3VwZXIuZ2V0VHhIZXgodHhIYXNoLCBwcnVuZSk7IH07XG4gIGFzeW5jIGdldEtleUltYWdlU3BlbnRTdGF0dXMoa2V5SW1hZ2U6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VTcGVudFN0YXR1cz4geyByZXR1cm4gc3VwZXIuZ2V0S2V5SW1hZ2VTcGVudFN0YXR1cyhrZXlJbWFnZSk7IH1cbiAgYXN5bmMgc2V0UGVlckJhbihiYW46IE1vbmVyb0Jhbik6IFByb21pc2U8dm9pZD4geyByZXR1cm4gc3VwZXIuc2V0UGVlckJhbihiYW4pOyB9XG4gIGFzeW5jIHN1Ym1pdEJsb2NrKGJsb2NrQmxvYjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7IHJldHVybiBzdXBlci5zdWJtaXRCbG9jayhibG9ja0Jsb2IpOyB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFBSSVZBVEUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByb3RlY3RlZCByZWZyZXNoTGlzdGVuaW5nKCkge1xuICAgIGlmICh0aGlzLnBvbGxMaXN0ZW5lciA9PSB1bmRlZmluZWQgJiYgdGhpcy5saXN0ZW5lcnMubGVuZ3RoKSB0aGlzLnBvbGxMaXN0ZW5lciA9IG5ldyBEYWVtb25Qb2xsZXIodGhpcyk7XG4gICAgaWYgKHRoaXMucG9sbExpc3RlbmVyICE9PSB1bmRlZmluZWQpIHRoaXMucG9sbExpc3RlbmVyLnNldElzUG9sbGluZyh0aGlzLmxpc3RlbmVycy5sZW5ndGggPiAwKTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGdldEJhbmR3aWR0aExpbWl0cygpIHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImdldF9saW1pdFwiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICByZXR1cm4gW3Jlc3AubGltaXRfZG93biwgcmVzcC5saW1pdF91cF07XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBzZXRCYW5kd2lkdGhMaW1pdHMoZG93bkxpbWl0LCB1cExpbWl0KSB7XG4gICAgaWYgKGRvd25MaW1pdCA9PT0gdW5kZWZpbmVkKSBkb3duTGltaXQgPSAwO1xuICAgIGlmICh1cExpbWl0ID09PSB1bmRlZmluZWQpIHVwTGltaXQgPSAwO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwic2V0X2xpbWl0XCIsIHtsaW1pdF9kb3duOiBkb3duTGltaXQsIGxpbWl0X3VwOiB1cExpbWl0fSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgcmV0dXJuIFtyZXNwLmxpbWl0X2Rvd24sIHJlc3AubGltaXRfdXBdO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGEgY29udGlndW91cyBjaHVuayBvZiBibG9ja3Mgc3RhcnRpbmcgZnJvbSBhIGdpdmVuIGhlaWdodCB1cCB0byBhIG1heGltdW1cbiAgICogaGVpZ2h0IG9yIGFtb3VudCBvZiBibG9jayBkYXRhIGZldGNoZWQgZnJvbSB0aGUgYmxvY2tjaGFpbiwgd2hpY2hldmVyIGNvbWVzIGZpcnN0LlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtzdGFydEhlaWdodF0gLSBzdGFydCBoZWlnaHQgdG8gcmV0cmlldmUgYmxvY2tzIChkZWZhdWx0IDApXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbbWF4SGVpZ2h0XSAtIG1heGltdW0gZW5kIGhlaWdodCB0byByZXRyaWV2ZSBibG9ja3MgKGRlZmF1bHQgYmxvY2tjaGFpbiBoZWlnaHQpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbbWF4UmVxU2l6ZV0gLSBtYXhpbXVtIGFtb3VudCBvZiBibG9jayBkYXRhIHRvIGZldGNoIGZyb20gdGhlIGJsb2NrY2hhaW4gaW4gYnl0ZXMgKGRlZmF1bHQgMywwMDAsMDAwIGJ5dGVzKVxuICAgKiBAcmV0dXJuIHtNb25lcm9CbG9ja1tdfSBhcmUgdGhlIHJlc3VsdGluZyBjaHVuayBvZiBibG9ja3NcbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyBnZXRNYXhCbG9ja3Moc3RhcnRIZWlnaHQsIG1heEhlaWdodCwgbWF4UmVxU2l6ZSkge1xuICAgIGlmIChzdGFydEhlaWdodCA9PT0gdW5kZWZpbmVkKSBzdGFydEhlaWdodCA9IDA7XG4gICAgaWYgKG1heEhlaWdodCA9PT0gdW5kZWZpbmVkKSBtYXhIZWlnaHQgPSBhd2FpdCB0aGlzLmdldEhlaWdodCgpIC0gMTtcbiAgICBpZiAobWF4UmVxU2l6ZSA9PT0gdW5kZWZpbmVkKSBtYXhSZXFTaXplID0gTW9uZXJvRGFlbW9uUnBjLk1BWF9SRVFfU0laRTtcbiAgICBcbiAgICAvLyBkZXRlcm1pbmUgZW5kIGhlaWdodCB0byBmZXRjaFxuICAgIGxldCByZXFTaXplID0gMDtcbiAgICBsZXQgZW5kSGVpZ2h0ID0gc3RhcnRIZWlnaHQgLSAxO1xuICAgIHdoaWxlIChyZXFTaXplIDwgbWF4UmVxU2l6ZSAmJiBlbmRIZWlnaHQgPCBtYXhIZWlnaHQpIHtcbiAgICAgIFxuICAgICAgLy8gZ2V0IGhlYWRlciBvZiBuZXh0IGJsb2NrXG4gICAgICBsZXQgaGVhZGVyID0gYXdhaXQgdGhpcy5nZXRCbG9ja0hlYWRlckJ5SGVpZ2h0Q2FjaGVkKGVuZEhlaWdodCArIDEsIG1heEhlaWdodCk7XG4gICAgICBcbiAgICAgIC8vIGJsb2NrIGNhbm5vdCBiZSBiaWdnZXIgdGhhbiBtYXggcmVxdWVzdCBzaXplXG4gICAgICBhc3NlcnQoaGVhZGVyLmdldFNpemUoKSA8PSBtYXhSZXFTaXplLCBcIkJsb2NrIGV4Y2VlZHMgbWF4aW11bSByZXF1ZXN0IHNpemU6IFwiICsgaGVhZGVyLmdldFNpemUoKSk7XG4gICAgICBcbiAgICAgIC8vIGRvbmUgaXRlcmF0aW5nIGlmIGZldGNoaW5nIGJsb2NrIHdvdWxkIGV4Y2VlZCBtYXggcmVxdWVzdCBzaXplXG4gICAgICBpZiAocmVxU2l6ZSArIGhlYWRlci5nZXRTaXplKCkgPiBtYXhSZXFTaXplKSBicmVhaztcbiAgICAgIFxuICAgICAgLy8gb3RoZXJ3aXNlIGJsb2NrIGlzIGluY2x1ZGVkXG4gICAgICByZXFTaXplICs9IGhlYWRlci5nZXRTaXplKCk7XG4gICAgICBlbmRIZWlnaHQrKztcbiAgICB9XG4gICAgcmV0dXJuIGVuZEhlaWdodCA+PSBzdGFydEhlaWdodCA/IGF3YWl0IHRoaXMuZ2V0QmxvY2tzQnlSYW5nZShzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSA6IFtdO1xuICB9XG4gIFxuICAvKipcbiAgICogUmV0cmlldmVzIGEgaGVhZGVyIGJ5IGhlaWdodCBmcm9tIHRoZSBjYWNoZSBvciBmZXRjaGVzIGFuZCBjYWNoZXMgYSBoZWFkZXJcbiAgICogcmFuZ2UgaWYgbm90IGFscmVhZHkgaW4gdGhlIGNhY2hlLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodCAtIGhlaWdodCBvZiB0aGUgaGVhZGVyIHRvIHJldHJpZXZlIGZyb20gdGhlIGNhY2hlXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBtYXhIZWlnaHQgLSBtYXhpbXVtIGhlaWdodCBvZiBoZWFkZXJzIHRvIGNhY2hlXG4gICAqL1xuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0QmxvY2tIZWFkZXJCeUhlaWdodENhY2hlZChoZWlnaHQsIG1heEhlaWdodCkge1xuICAgIFxuICAgIC8vIGdldCBoZWFkZXIgZnJvbSBjYWNoZVxuICAgIGxldCBjYWNoZWRIZWFkZXIgPSB0aGlzLmNhY2hlZEhlYWRlcnNbaGVpZ2h0XTtcbiAgICBpZiAoY2FjaGVkSGVhZGVyKSByZXR1cm4gY2FjaGVkSGVhZGVyO1xuICAgIFxuICAgIC8vIGZldGNoIGFuZCBjYWNoZSBoZWFkZXJzIGlmIG5vdCBpbiBjYWNoZVxuICAgIGxldCBlbmRIZWlnaHQgPSBNYXRoLm1pbihtYXhIZWlnaHQsIGhlaWdodCArIE1vbmVyb0RhZW1vblJwYy5OVU1fSEVBREVSU19QRVJfUkVRIC0gMSk7ICAvLyBUT0RPOiBjb3VsZCBzcGVjaWZ5IGVuZCBoZWlnaHQgdG8gY2FjaGUgdG8gb3B0aW1pemUgc21hbGwgcmVxdWVzdHMgKHdvdWxkIGxpa2UgdG8gaGF2ZSB0aW1lIHByb2ZpbGluZyBpbiBwbGFjZSB0aG91Z2gpXG4gICAgbGV0IGhlYWRlcnMgPSBhd2FpdCB0aGlzLmdldEJsb2NrSGVhZGVyc0J5UmFuZ2UoaGVpZ2h0LCBlbmRIZWlnaHQpO1xuICAgIGZvciAobGV0IGhlYWRlciBvZiBoZWFkZXJzKSB7XG4gICAgICB0aGlzLmNhY2hlZEhlYWRlcnNbaGVhZGVyLmdldEhlaWdodCgpXSA9IGhlYWRlcjtcbiAgICB9XG4gICAgXG4gICAgLy8gcmV0dXJuIHRoZSBjYWNoZWQgaGVhZGVyXG4gICAgcmV0dXJuIHRoaXMuY2FjaGVkSGVhZGVyc1toZWlnaHRdO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU1RBVElDIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHN0YXRpYyBhc3luYyBjb25uZWN0VG9EYWVtb25ScGModXJpT3JDb25maWc6IHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4gfCBQYXJ0aWFsPE1vbmVyb0RhZW1vbkNvbmZpZz4gfCBzdHJpbmdbXSwgdXNlcm5hbWU/OiBzdHJpbmcsIHBhc3N3b3JkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9EYWVtb25ScGM+IHtcbiAgICBsZXQgY29uZmlnID0gTW9uZXJvRGFlbW9uUnBjLm5vcm1hbGl6ZUNvbmZpZyh1cmlPckNvbmZpZywgdXNlcm5hbWUsIHBhc3N3b3JkKTtcbiAgICBpZiAoY29uZmlnLmNtZCkgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5zdGFydE1vbmVyb2RQcm9jZXNzKGNvbmZpZyk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9EYWVtb25ScGMoY29uZmlnLCBjb25maWcucHJveHlUb1dvcmtlciA/IGF3YWl0IE1vbmVyb0RhZW1vblJwY1Byb3h5LmNvbm5lY3QoY29uZmlnKSA6IHVuZGVmaW5lZCk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgc3RhcnRNb25lcm9kUHJvY2Vzcyhjb25maWc6IE1vbmVyb0RhZW1vbkNvbmZpZyk6IFByb21pc2U8TW9uZXJvRGFlbW9uUnBjPiB7XG4gICAgYXNzZXJ0KEdlblV0aWxzLmlzQXJyYXkoY29uZmlnLmNtZCksIFwiTXVzdCBwcm92aWRlIHN0cmluZyBhcnJheSB3aXRoIGNvbW1hbmQgbGluZSBwYXJhbWV0ZXJzXCIpO1xuICAgIFxuICAgIC8vIHN0YXJ0IHByb2Nlc3NcbiAgICBsZXQgcHJvY2VzcyA9IHJlcXVpcmUoJ2NoaWxkX3Byb2Nlc3MnKS5zcGF3bihjb25maWcuY21kWzBdLCBjb25maWcuY21kLnNsaWNlKDEpLCB7fSk7XG4gICAgcHJvY2Vzcy5zdGRvdXQuc2V0RW5jb2RpbmcoJ3V0ZjgnKTtcbiAgICBwcm9jZXNzLnN0ZGVyci5zZXRFbmNvZGluZygndXRmOCcpO1xuICAgIFxuICAgIC8vIHJldHVybiBwcm9taXNlIHdoaWNoIHJlc29sdmVzIGFmdGVyIHN0YXJ0aW5nIG1vbmVyb2RcbiAgICBsZXQgdXJpO1xuICAgIGxldCBvdXRwdXQgPSBcIlwiO1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gYXdhaXQgbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICBcbiAgICAgICAgLy8gaGFuZGxlIHN0ZG91dFxuICAgICAgICBwcm9jZXNzLnN0ZG91dC5vbignZGF0YScsIGFzeW5jIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICBsZXQgbGluZSA9IGRhdGEudG9TdHJpbmcoKTtcbiAgICAgICAgICBMaWJyYXJ5VXRpbHMubG9nKDIsIGxpbmUpO1xuICAgICAgICAgIG91dHB1dCArPSBsaW5lICsgJ1xcbic7IC8vIGNhcHR1cmUgb3V0cHV0IGluIGNhc2Ugb2YgZXJyb3JcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBleHRyYWN0IHVyaSBmcm9tIGUuZy4gXCJJIEJpbmRpbmcgb24gMTI3LjAuMC4xIChJUHY0KTozODA4NVwiXG4gICAgICAgICAgbGV0IHVyaUxpbmVDb250YWlucyA9IFwiQmluZGluZyBvbiBcIjtcbiAgICAgICAgICBsZXQgdXJpTGluZUNvbnRhaW5zSWR4ID0gbGluZS5pbmRleE9mKHVyaUxpbmVDb250YWlucyk7XG4gICAgICAgICAgaWYgKHVyaUxpbmVDb250YWluc0lkeCA+PSAwKSB7XG4gICAgICAgICAgICBsZXQgaG9zdCA9IGxpbmUuc3Vic3RyaW5nKHVyaUxpbmVDb250YWluc0lkeCArIHVyaUxpbmVDb250YWlucy5sZW5ndGgsIGxpbmUubGFzdEluZGV4T2YoJyAnKSk7XG4gICAgICAgICAgICBsZXQgdW5mb3JtYXR0ZWRMaW5lID0gbGluZS5yZXBsYWNlKC9cXHUwMDFiXFxbLio/bS9nLCAnJykudHJpbSgpOyAvLyByZW1vdmUgY29sb3IgZm9ybWF0dGluZ1xuICAgICAgICAgICAgbGV0IHBvcnQgPSB1bmZvcm1hdHRlZExpbmUuc3Vic3RyaW5nKHVuZm9ybWF0dGVkTGluZS5sYXN0SW5kZXhPZignOicpICsgMSk7XG4gICAgICAgICAgICBsZXQgc3NsSWR4ID0gY29uZmlnLmNtZC5pbmRleE9mKFwiLS1ycGMtc3NsXCIpO1xuICAgICAgICAgICAgbGV0IHNzbEVuYWJsZWQgPSBzc2xJZHggPj0gMCA/IFwiZW5hYmxlZFwiID09IGNvbmZpZy5jbWRbc3NsSWR4ICsgMV0udG9Mb3dlckNhc2UoKSA6IGZhbHNlO1xuICAgICAgICAgICAgdXJpID0gKHNzbEVuYWJsZWQgPyBcImh0dHBzXCIgOiBcImh0dHBcIikgKyBcIjovL1wiICsgaG9zdCArIFwiOlwiICsgcG9ydDtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gcmVhZCBzdWNjZXNzIG1lc3NhZ2VcbiAgICAgICAgICBpZiAobGluZS5pbmRleE9mKFwiY29yZSBSUEMgc2VydmVyIHN0YXJ0ZWQgb2tcIikgPj0gMCkge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBnZXQgdXNlcm5hbWUgYW5kIHBhc3N3b3JkIGZyb20gcGFyYW1zXG4gICAgICAgICAgICBsZXQgdXNlclBhc3NJZHggPSBjb25maWcuY21kLmluZGV4T2YoXCItLXJwYy1sb2dpblwiKTtcbiAgICAgICAgICAgIGxldCB1c2VyUGFzcyA9IHVzZXJQYXNzSWR4ID49IDAgPyBjb25maWcuY21kW3VzZXJQYXNzSWR4ICsgMV0gOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICBsZXQgdXNlcm5hbWUgPSB1c2VyUGFzcyA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogdXNlclBhc3Muc3Vic3RyaW5nKDAsIHVzZXJQYXNzLmluZGV4T2YoJzonKSk7XG4gICAgICAgICAgICBsZXQgcGFzc3dvcmQgPSB1c2VyUGFzcyA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogdXNlclBhc3Muc3Vic3RyaW5nKHVzZXJQYXNzLmluZGV4T2YoJzonKSArIDEpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBjcmVhdGUgY2xpZW50IGNvbm5lY3RlZCB0byBpbnRlcm5hbCBwcm9jZXNzXG4gICAgICAgICAgICBjb25maWcgPSBjb25maWcuY29weSgpLnNldFNlcnZlcih7dXJpOiB1cmksIHVzZXJuYW1lOiB1c2VybmFtZSwgcGFzc3dvcmQ6IHBhc3N3b3JkLCByZWplY3RVbmF1dGhvcml6ZWQ6IGNvbmZpZy5nZXRTZXJ2ZXIoKSA/IGNvbmZpZy5nZXRTZXJ2ZXIoKS5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHVuZGVmaW5lZH0pO1xuICAgICAgICAgICAgY29uZmlnLnNldFByb3h5VG9Xb3JrZXIoY29uZmlnLnByb3h5VG9Xb3JrZXIpO1xuICAgICAgICAgICAgY29uZmlnLmNtZCA9IHVuZGVmaW5lZFxuICAgICAgICAgICAgbGV0IGRhZW1vbiA9IGF3YWl0IE1vbmVyb0RhZW1vblJwYy5jb25uZWN0VG9EYWVtb25ScGMoY29uZmlnKTtcbiAgICAgICAgICAgIGRhZW1vbi5wcm9jZXNzID0gcHJvY2VzcztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gcmVzb2x2ZSBwcm9taXNlIHdpdGggY2xpZW50IGNvbm5lY3RlZCB0byBpbnRlcm5hbCBwcm9jZXNzIFxuICAgICAgICAgICAgdGhpcy5pc1Jlc29sdmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHJlc29sdmUoZGFlbW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gaGFuZGxlIHN0ZGVyclxuICAgICAgICBwcm9jZXNzLnN0ZGVyci5vbignZGF0YScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICBpZiAoTGlicmFyeVV0aWxzLmdldExvZ0xldmVsKCkgPj0gMikgY29uc29sZS5lcnJvcihkYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgZXhpdFxuICAgICAgICBwcm9jZXNzLm9uKFwiZXhpdFwiLCBmdW5jdGlvbihjb2RlKSB7XG4gICAgICAgICAgaWYgKCF0aGlzLmlzUmVzb2x2ZWQpIHJlamVjdChuZXcgRXJyb3IoXCJtb25lcm9kIHByb2Nlc3MgdGVybWluYXRlZCB3aXRoIGV4aXQgY29kZSBcIiArIGNvZGUgKyAob3V0cHV0ID8gXCI6XFxuXFxuXCIgKyBvdXRwdXQgOiBcIlwiKSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBlcnJvclxuICAgICAgICBwcm9jZXNzLm9uKFwiZXJyb3JcIiwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgaWYgKGVyci5tZXNzYWdlLmluZGV4T2YoXCJFTk9FTlRcIikgPj0gMCkgcmVqZWN0KG5ldyBFcnJvcihcIm1vbmVyb2QgZG9lcyBub3QgZXhpc3QgYXQgcGF0aCAnXCIgKyBjb25maWcuY21kWzBdICsgXCInXCIpKTtcbiAgICAgICAgICBpZiAoIXRoaXMuaXNSZXNvbHZlZCkgcmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gaGFuZGxlIHVuY2F1Z2h0IGV4Y2VwdGlvblxuICAgICAgICBwcm9jZXNzLm9uKFwidW5jYXVnaHRFeGNlcHRpb25cIiwgZnVuY3Rpb24oZXJyLCBvcmlnaW4pIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiVW5jYXVnaHQgZXhjZXB0aW9uIGluIG1vbmVyb2QgcHJvY2VzczogXCIgKyBlcnIubWVzc2FnZSk7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihvcmlnaW4pO1xuICAgICAgICAgIGlmICghdGhpcy5pc1Jlc29sdmVkKSByZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGVyci5tZXNzYWdlKTtcbiAgICB9XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgbm9ybWFsaXplQ29uZmlnKHVyaU9yQ29uZmlnOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHwgUGFydGlhbDxNb25lcm9EYWVtb25Db25maWc+IHwgc3RyaW5nW10sIHVzZXJuYW1lPzogc3RyaW5nLCBwYXNzd29yZD86IHN0cmluZyk6IE1vbmVyb0RhZW1vbkNvbmZpZyB7XG4gICAgbGV0IGNvbmZpZzogdW5kZWZpbmVkIHwgUGFydGlhbDxNb25lcm9EYWVtb25Db25maWc+ID0gdW5kZWZpbmVkO1xuICAgIGlmICh0eXBlb2YgdXJpT3JDb25maWcgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGNvbmZpZyA9IG5ldyBNb25lcm9EYWVtb25Db25maWcoe3NlcnZlcjogbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24odXJpT3JDb25maWcgYXMgc3RyaW5nLCB1c2VybmFtZSwgcGFzc3dvcmQpfSk7XG4gICAgfSBlbHNlIGlmICgodXJpT3JDb25maWcgYXMgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPikudXJpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbmZpZyA9IG5ldyBNb25lcm9EYWVtb25Db25maWcoe3NlcnZlcjogbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24odXJpT3JDb25maWcgYXMgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPil9KTtcblxuICAgICAgLy8gdHJhbnNmZXIgd29ya2VyIHByb3h5IHNldHRpbmcgZnJvbSBycGMgY29ubmVjdGlvbiB0byBkYWVtb24gY29uZmlnXG4gICAgICBjb25maWcuc2V0UHJveHlUb1dvcmtlcigodXJpT3JDb25maWcgYXMgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPikucHJveHlUb1dvcmtlcik7XG4gICAgICBjb25maWcuZ2V0U2VydmVyKCkuc2V0UHJveHlUb1dvcmtlcihNb25lcm9ScGNDb25uZWN0aW9uLkRFRkFVTFRfQ09ORklHLnByb3h5VG9Xb3JrZXIpO1xuICAgIH0gZWxzZSBpZiAoR2VuVXRpbHMuaXNBcnJheSh1cmlPckNvbmZpZykpIHtcbiAgICAgIGNvbmZpZyA9IG5ldyBNb25lcm9EYWVtb25Db25maWcoe2NtZDogdXJpT3JDb25maWcgYXMgc3RyaW5nW119KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uZmlnID0gbmV3IE1vbmVyb0RhZW1vbkNvbmZpZyh1cmlPckNvbmZpZyBhcyBQYXJ0aWFsPE1vbmVyb0RhZW1vbkNvbmZpZz4pO1xuICAgIH1cbiAgICBpZiAoY29uZmlnLnByb3h5VG9Xb3JrZXIgPT09IHVuZGVmaW5lZCkgY29uZmlnLnByb3h5VG9Xb3JrZXIgPSB0cnVlO1xuICAgIGlmIChjb25maWcucG9sbEludGVydmFsID09PSB1bmRlZmluZWQpIGNvbmZpZy5wb2xsSW50ZXJ2YWwgPSBNb25lcm9EYWVtb25ScGMuREVGQVVMVF9QT0xMX1BFUklPRDtcbiAgICByZXR1cm4gY29uZmlnIGFzIE1vbmVyb0RhZW1vbkNvbmZpZztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApIHtcbiAgICBpZiAocmVzcC5zdGF0dXMgIT09IFwiT0tcIikgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHJlc3Auc3RhdHVzKTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjQmxvY2tIZWFkZXIocnBjSGVhZGVyKSB7XG4gICAgaWYgKCFycGNIZWFkZXIpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgbGV0IGhlYWRlciA9IG5ldyBNb25lcm9CbG9ja0hlYWRlcigpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNIZWFkZXIpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjSGVhZGVyW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImJsb2NrX3NpemVcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRTaXplLCBoZWFkZXIuc2V0U2l6ZSwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkZXB0aFwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldERlcHRoLCBoZWFkZXIuc2V0RGVwdGgsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGlmZmljdWx0eVwiKSB7IH0gIC8vIGhhbmRsZWQgYnkgd2lkZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3VtdWxhdGl2ZV9kaWZmaWN1bHR5XCIpIHsgfSAvLyBoYW5kbGVkIGJ5IHdpZGVfY3VtdWxhdGl2ZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGlmZmljdWx0eV90b3A2NFwiKSB7IH0gIC8vIGhhbmRsZWQgYnkgd2lkZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3VtdWxhdGl2ZV9kaWZmaWN1bHR5X3RvcDY0XCIpIHsgfSAvLyBoYW5kbGVkIGJ5IHdpZGVfY3VtdWxhdGl2ZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2lkZV9kaWZmaWN1bHR5XCIpIGhlYWRlci5zZXREaWZmaWN1bHR5KEdlblV0aWxzLnJlY29uY2lsZShoZWFkZXIuZ2V0RGlmZmljdWx0eSgpLCBNb25lcm9EYWVtb25ScGMucHJlZml4ZWRIZXhUb0JJKHZhbCkpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3aWRlX2N1bXVsYXRpdmVfZGlmZmljdWx0eVwiKSBoZWFkZXIuc2V0Q3VtdWxhdGl2ZURpZmZpY3VsdHkoR2VuVXRpbHMucmVjb25jaWxlKGhlYWRlci5nZXRDdW11bGF0aXZlRGlmZmljdWx0eSgpLCBNb25lcm9EYWVtb25ScGMucHJlZml4ZWRIZXhUb0JJKHZhbCkpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJoYXNoXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0SGFzaCwgaGVhZGVyLnNldEhhc2gsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGVpZ2h0XCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0SGVpZ2h0LCBoZWFkZXIuc2V0SGVpZ2h0LCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm1ham9yX3ZlcnNpb25cIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRNYWpvclZlcnNpb24sIGhlYWRlci5zZXRNYWpvclZlcnNpb24sIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibWlub3JfdmVyc2lvblwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldE1pbm9yVmVyc2lvbiwgaGVhZGVyLnNldE1pbm9yVmVyc2lvbiwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJub25jZVwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldE5vbmNlLCBoZWFkZXIuc2V0Tm9uY2UsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibnVtX3R4ZXNcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXROdW1UeHMsIGhlYWRlci5zZXROdW1UeHMsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwib3JwaGFuX3N0YXR1c1wiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldE9ycGhhblN0YXR1cywgaGVhZGVyLnNldE9ycGhhblN0YXR1cywgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwcmV2X2hhc2hcIiB8fCBrZXkgPT09IFwicHJldl9pZFwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldFByZXZIYXNoLCBoZWFkZXIuc2V0UHJldkhhc2gsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmV3YXJkXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0UmV3YXJkLCBoZWFkZXIuc2V0UmV3YXJkLCBCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidGltZXN0YW1wXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0VGltZXN0YW1wLCBoZWFkZXIuc2V0VGltZXN0YW1wLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX3dlaWdodFwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldFdlaWdodCwgaGVhZGVyLnNldFdlaWdodCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsb25nX3Rlcm1fd2VpZ2h0XCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0TG9uZ1Rlcm1XZWlnaHQsIGhlYWRlci5zZXRMb25nVGVybVdlaWdodCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwb3dfaGFzaFwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldFBvd0hhc2gsIGhlYWRlci5zZXRQb3dIYXNoLCB2YWwgPT09IFwiXCIgPyB1bmRlZmluZWQgOiB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2hhc2hlc1wiKSB7fSAgLy8gdXNlZCBpbiBibG9jayBtb2RlbCwgbm90IGhlYWRlciBtb2RlbFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm1pbmVyX3R4XCIpIHt9ICAgLy8gdXNlZCBpbiBibG9jayBtb2RlbCwgbm90IGhlYWRlciBtb2RlbFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm1pbmVyX3R4X2hhc2hcIikgaGVhZGVyLnNldE1pbmVyVHhIYXNoKHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBibG9jayBoZWFkZXIgZmllbGQ6ICdcIiArIGtleSArIFwiJzogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gaGVhZGVyO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNCbG9jayhycGNCbG9jaykge1xuICAgIFxuICAgIC8vIGJ1aWxkIGJsb2NrXG4gICAgbGV0IGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQmxvY2tIZWFkZXIocnBjQmxvY2suYmxvY2tfaGVhZGVyID8gcnBjQmxvY2suYmxvY2tfaGVhZGVyIDogcnBjQmxvY2spIGFzIE1vbmVyb0Jsb2NrKTtcbiAgICBibG9jay5zZXRIZXgocnBjQmxvY2suYmxvYik7XG4gICAgYmxvY2suc2V0VHhIYXNoZXMocnBjQmxvY2sudHhfaGFzaGVzID09PSB1bmRlZmluZWQgPyBbXSA6IHJwY0Jsb2NrLnR4X2hhc2hlcyk7XG4gICAgXG4gICAgLy8gYnVpbGQgbWluZXIgdHhcbiAgICBsZXQgcnBjTWluZXJUeCA9IHJwY0Jsb2NrLmpzb24gPyBKU09OLnBhcnNlKHJwY0Jsb2NrLmpzb24pLm1pbmVyX3R4IDogcnBjQmxvY2subWluZXJfdHg7ICAvLyBtYXkgbmVlZCB0byBiZSBwYXJzZWQgZnJvbSBqc29uXG4gICAgbGV0IG1pbmVyVHggPSBuZXcgTW9uZXJvVHgoKTtcbiAgICBibG9jay5zZXRNaW5lclR4KG1pbmVyVHgpO1xuICAgIG1pbmVyVHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgbWluZXJUeC5zZXRJblR4UG9vbChmYWxzZSlcbiAgICBtaW5lclR4LnNldElzTWluZXJUeCh0cnVlKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1R4KHJwY01pbmVyVHgsIG1pbmVyVHgpO1xuICAgIFxuICAgIHJldHVybiBibG9jaztcbiAgfVxuICBcbiAgLyoqXG4gICAqIFRyYW5zZmVycyBSUEMgdHggZmllbGRzIHRvIGEgZ2l2ZW4gTW9uZXJvVHggd2l0aG91dCBvdmVyd3JpdGluZyBwcmV2aW91cyB2YWx1ZXMuXG4gICAqIFxuICAgKiBUT0RPOiBzd2l0Y2ggZnJvbSBzYWZlIHNldFxuICAgKiBcbiAgICogQHBhcmFtIHJwY1R4IC0gUlBDIG1hcCBjb250YWluaW5nIHRyYW5zYWN0aW9uIGZpZWxkc1xuICAgKiBAcGFyYW0gdHggIC0gTW9uZXJvVHggdG8gcG9wdWxhdGUgd2l0aCB2YWx1ZXMgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHR4IC0gc2FtZSB0eCB0aGF0IHdhcyBwYXNzZWQgaW4gb3IgYSBuZXcgb25lIGlmIG5vbmUgZ2l2ZW5cbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1R4KHJwY1R4LCB0eCkge1xuICAgIGlmIChycGNUeCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIGlmICh0eCA9PT0gdW5kZWZpbmVkKSB0eCA9IG5ldyBNb25lcm9UeCgpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgZnJvbSBycGMgbWFwXG4gICAgbGV0IGhlYWRlcjtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjVHgpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjVHhba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwidHhfaGFzaFwiIHx8IGtleSA9PT0gXCJpZF9oYXNoXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldEhhc2gsIHR4LnNldEhhc2gsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfdGltZXN0YW1wXCIpIHtcbiAgICAgICAgaWYgKCFoZWFkZXIpIGhlYWRlciA9IG5ldyBNb25lcm9CbG9ja0hlYWRlcigpO1xuICAgICAgICBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldFRpbWVzdGFtcCwgaGVhZGVyLnNldFRpbWVzdGFtcCwgdmFsKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja19oZWlnaHRcIikge1xuICAgICAgICBpZiAoIWhlYWRlcikgaGVhZGVyID0gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKCk7XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0SGVpZ2h0LCBoZWFkZXIuc2V0SGVpZ2h0LCB2YWwpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxhc3RfcmVsYXllZF90aW1lXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldExhc3RSZWxheWVkVGltZXN0YW1wLCB0eC5zZXRMYXN0UmVsYXllZFRpbWVzdGFtcCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyZWNlaXZlX3RpbWVcIiB8fCBrZXkgPT09IFwicmVjZWl2ZWRfdGltZXN0YW1wXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFJlY2VpdmVkVGltZXN0YW1wLCB0eC5zZXRSZWNlaXZlZFRpbWVzdGFtcCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjb25maXJtYXRpb25zXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldE51bUNvbmZpcm1hdGlvbnMsIHR4LnNldE51bUNvbmZpcm1hdGlvbnMsIHZhbCk7IFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImluX3Bvb2xcIikge1xuICAgICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc0NvbmZpcm1lZCwgdHguc2V0SXNDb25maXJtZWQsICF2YWwpO1xuICAgICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJblR4UG9vbCwgdHguc2V0SW5UeFBvb2wsIHZhbCk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZG91YmxlX3NwZW5kX3NlZW5cIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SXNEb3VibGVTcGVuZFNlZW4sIHR4LnNldElzRG91YmxlU3BlbmRTZWVuLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInZlcnNpb25cIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0VmVyc2lvbiwgdHguc2V0VmVyc2lvbiwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJleHRyYVwiKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdmFsID09PSBcInN0cmluZ1wiKSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGV4dHJhIGZpZWxkIGFzIHN0cmluZyBub3QgYmVpbmcgYXNpZ25lZCB0byBpbnRbXTogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpOyAvLyBUT0RPOiBob3cgdG8gc2V0IHN0cmluZyB0byBpbnRbXT8gLSBvciwgZXh0cmEgaXMgc3RyaW5nIHdoaWNoIGNhbiBlbmNvZGUgaW50W11cbiAgICAgICAgZWxzZSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRFeHRyYSwgdHguc2V0RXh0cmEsIG5ldyBVaW50OEFycmF5KHZhbCkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInZpblwiKSB7XG4gICAgICAgIGlmICh2YWwubGVuZ3RoICE9PSAxIHx8ICF2YWxbMF0uZ2VuKSB7ICAvLyBpZ25vcmUgbWluZXIgaW5wdXQgVE9ETzogd2h5P1xuICAgICAgICAgIHR4LnNldElucHV0cyh2YWwubWFwKHJwY1ZpbiA9PiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY091dHB1dChycGNWaW4sIHR4KSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidm91dFwiKSB0eC5zZXRPdXRwdXRzKHZhbC5tYXAocnBjT3V0cHV0ID0+IE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjT3V0cHV0KHJwY091dHB1dCwgdHgpKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmN0X3NpZ25hdHVyZXNcIikge1xuICAgICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRSY3RTaWduYXR1cmVzLCB0eC5zZXRSY3RTaWduYXR1cmVzLCB2YWwpO1xuICAgICAgICBpZiAodmFsLnR4bkZlZSkgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0RmVlLCB0eC5zZXRGZWUsIEJpZ0ludCh2YWwudHhuRmVlKSk7XG4gICAgICB9IFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJjdHNpZ19wcnVuYWJsZVwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRSY3RTaWdQcnVuYWJsZSwgdHguc2V0UmN0U2lnUHJ1bmFibGUsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5sb2NrX3RpbWVcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0VW5sb2NrVGltZSwgdHguc2V0VW5sb2NrVGltZSwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhc19qc29uXCIgfHwga2V5ID09PSBcInR4X2pzb25cIikgeyB9ICAvLyBoYW5kbGVkIGxhc3Qgc28gdHggaXMgYXMgaW5pdGlhbGl6ZWQgYXMgcG9zc2libGVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhc19oZXhcIiB8fCBrZXkgPT09IFwidHhfYmxvYlwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRGdWxsSGV4LCB0eC5zZXRGdWxsSGV4LCB2YWwgPyB2YWwgOiB1bmRlZmluZWQpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2Jfc2l6ZVwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRTaXplLCB0eC5zZXRTaXplLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndlaWdodFwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRXZWlnaHQsIHR4LnNldFdlaWdodCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmZWVcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0RmVlLCB0eC5zZXRGZWUsIEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyZWxheWVkXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzUmVsYXllZCwgdHguc2V0SXNSZWxheWVkLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm91dHB1dF9pbmRpY2VzXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldE91dHB1dEluZGljZXMsIHR4LnNldE91dHB1dEluZGljZXMsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZG9fbm90X3JlbGF5XCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFJlbGF5LCB0eC5zZXRSZWxheSwgIXZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwia2VwdF9ieV9ibG9ja1wiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc0tlcHRCeUJsb2NrLCB0eC5zZXRJc0tlcHRCeUJsb2NrLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNpZ25hdHVyZXNcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0U2lnbmF0dXJlcywgdHguc2V0U2lnbmF0dXJlcywgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsYXN0X2ZhaWxlZF9oZWlnaHRcIikge1xuICAgICAgICBpZiAodmFsID09PSAwKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc0ZhaWxlZCwgdHguc2V0SXNGYWlsZWQsIGZhbHNlKTtcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SXNGYWlsZWQsIHR4LnNldElzRmFpbGVkLCB0cnVlKTtcbiAgICAgICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRMYXN0RmFpbGVkSGVpZ2h0LCB0eC5zZXRMYXN0RmFpbGVkSGVpZ2h0LCB2YWwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibGFzdF9mYWlsZWRfaWRfaGFzaFwiKSB7XG4gICAgICAgIGlmICh2YWwgPT09IE1vbmVyb0RhZW1vblJwYy5ERUZBVUxUX0lEKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc0ZhaWxlZCwgdHguc2V0SXNGYWlsZWQsIGZhbHNlKTtcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SXNGYWlsZWQsIHR4LnNldElzRmFpbGVkLCB0cnVlKTtcbiAgICAgICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRMYXN0RmFpbGVkSGFzaCwgdHguc2V0TGFzdEZhaWxlZEhhc2gsIHZhbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtYXhfdXNlZF9ibG9ja19oZWlnaHRcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0TWF4VXNlZEJsb2NrSGVpZ2h0LCB0eC5zZXRNYXhVc2VkQmxvY2tIZWlnaHQsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibWF4X3VzZWRfYmxvY2tfaWRfaGFzaFwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRNYXhVc2VkQmxvY2tIYXNoLCB0eC5zZXRNYXhVc2VkQmxvY2tIYXNoLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBydW5hYmxlX2hhc2hcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0UHJ1bmFibGVIYXNoLCB0eC5zZXRQcnVuYWJsZUhhc2gsIHZhbCA/IHZhbCA6IHVuZGVmaW5lZCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHJ1bmFibGVfYXNfaGV4XCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFBydW5hYmxlSGV4LCB0eC5zZXRQcnVuYWJsZUhleCwgdmFsID8gdmFsIDogdW5kZWZpbmVkKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwcnVuZWRfYXNfaGV4XCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFBydW5lZEhleCwgdHguc2V0UHJ1bmVkSGV4LCB2YWwgPyB2YWwgOiB1bmRlZmluZWQpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gcnBjIHR4OiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIFxuICAgIC8vIGxpbmsgYmxvY2sgYW5kIHR4XG4gICAgaWYgKGhlYWRlcikgdHguc2V0QmxvY2sobmV3IE1vbmVyb0Jsb2NrKGhlYWRlcikuc2V0VHhzKFt0eF0pKTtcbiAgICBcbiAgICAvLyBUT0RPIG1vbmVyb2Q6IHVuY29uZmlybWVkIHR4cyBtaXNyZXBvcnQgYmxvY2sgaGVpZ2h0IGFuZCB0aW1lc3RhbXA/XG4gICAgaWYgKHR4LmdldEJsb2NrKCkgJiYgdHguZ2V0QmxvY2soKS5nZXRIZWlnaHQoKSAhPT0gdW5kZWZpbmVkICYmIHR4LmdldEJsb2NrKCkuZ2V0SGVpZ2h0KCkgPT09IHR4LmdldEJsb2NrKCkuZ2V0VGltZXN0YW1wKCkpIHtcbiAgICAgIHR4LnNldEJsb2NrKHVuZGVmaW5lZCk7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgfVxuICAgIFxuICAgIC8vIGluaXRpYWxpemUgcmVtYWluaW5nIGtub3duIGZpZWxkc1xuICAgIGlmICh0eC5nZXRJc0NvbmZpcm1lZCgpKSB7XG4gICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc1JlbGF5ZWQsIHR4LnNldElzUmVsYXllZCwgdHJ1ZSk7XG4gICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRSZWxheSwgdHguc2V0UmVsYXksIHRydWUpO1xuICAgICAgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SXNGYWlsZWQsIHR4LnNldElzRmFpbGVkLCBmYWxzZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHR4LnNldE51bUNvbmZpcm1hdGlvbnMoMCk7XG4gICAgfVxuICAgIGlmICh0eC5nZXRJc0ZhaWxlZCgpID09PSB1bmRlZmluZWQpIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICBpZiAodHguZ2V0T3V0cHV0SW5kaWNlcygpICYmIHR4LmdldE91dHB1dHMoKSkgIHtcbiAgICAgIGFzc2VydC5lcXVhbCh0eC5nZXRPdXRwdXRzKCkubGVuZ3RoLCB0eC5nZXRPdXRwdXRJbmRpY2VzKCkubGVuZ3RoKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdHguZ2V0T3V0cHV0cygpLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHR4LmdldE91dHB1dHMoKVtpXS5zZXRJbmRleCh0eC5nZXRPdXRwdXRJbmRpY2VzKClbaV0pOyAgLy8gdHJhbnNmZXIgb3V0cHV0IGluZGljZXMgdG8gb3V0cHV0c1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAocnBjVHguYXNfanNvbikgTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNUeChKU09OLnBhcnNlKHJwY1R4LmFzX2pzb24pLCB0eCk7XG4gICAgaWYgKHJwY1R4LnR4X2pzb24pIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVHgoSlNPTi5wYXJzZShycGNUeC50eF9qc29uKSwgdHgpO1xuICAgIGlmICghdHguZ2V0SXNSZWxheWVkKCkpIHR4LnNldExhc3RSZWxheWVkVGltZXN0YW1wKHVuZGVmaW5lZCk7ICAvLyBUT0RPIG1vbmVyb2Q6IHJldHVybnMgbGFzdF9yZWxheWVkX3RpbWVzdGFtcCBkZXNwaXRlIHJlbGF5ZWQ6IGZhbHNlLCBzZWxmIGluY29uc2lzdGVudFxuICAgIFxuICAgIC8vIHJldHVybiBidWlsdCB0cmFuc2FjdGlvblxuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjT3V0cHV0KHJwY091dHB1dCwgdHgpIHtcbiAgICBsZXQgb3V0cHV0ID0gbmV3IE1vbmVyb091dHB1dCgpO1xuICAgIG91dHB1dC5zZXRUeCh0eCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY091dHB1dCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNPdXRwdXRba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiZ2VuXCIpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk91dHB1dCB3aXRoICdnZW4nIGZyb20gZGFlbW9uIHJwYyBpcyBtaW5lciB0eCB3aGljaCB3ZSBpZ25vcmUgKGkuZS4gZWFjaCBtaW5lciBpbnB1dCBpcyB1bmRlZmluZWQpXCIpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImtleVwiKSB7XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQob3V0cHV0LCBvdXRwdXQuZ2V0QW1vdW50LCBvdXRwdXQuc2V0QW1vdW50LCBCaWdJbnQodmFsLmFtb3VudCkpO1xuICAgICAgICBHZW5VdGlscy5zYWZlU2V0KG91dHB1dCwgb3V0cHV0LmdldEtleUltYWdlLCBvdXRwdXQuc2V0S2V5SW1hZ2UsIG5ldyBNb25lcm9LZXlJbWFnZSh2YWwua19pbWFnZSkpO1xuICAgICAgICBHZW5VdGlscy5zYWZlU2V0KG91dHB1dCwgb3V0cHV0LmdldFJpbmdPdXRwdXRJbmRpY2VzLCBvdXRwdXQuc2V0UmluZ091dHB1dEluZGljZXMsIHZhbC5rZXlfb2Zmc2V0cyk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50XCIpIEdlblV0aWxzLnNhZmVTZXQob3V0cHV0LCBvdXRwdXQuZ2V0QW1vdW50LCBvdXRwdXQuc2V0QW1vdW50LCBCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidGFyZ2V0XCIpIHtcbiAgICAgICAgbGV0IHB1YktleSA9IHZhbC5rZXkgPT09IHVuZGVmaW5lZCA/IHZhbC50YWdnZWRfa2V5LmtleSA6IHZhbC5rZXk7IC8vIFRPRE8gKG1vbmVyb2QpOiBycGMganNvbiB1c2VzIHt0YWdnZWRfa2V5PXtrZXk9Li4ufX0sIGJpbmFyeSBibG9ja3MgdXNlIHtrZXk9Li4ufVxuICAgICAgICBHZW5VdGlscy5zYWZlU2V0KG91dHB1dCwgb3V0cHV0LmdldFN0ZWFsdGhQdWJsaWNLZXksIG91dHB1dC5zZXRTdGVhbHRoUHVibGljS2V5LCBwdWJLZXkpO1xuICAgICAgfVxuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgb3V0cHV0OiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBvdXRwdXQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY0Jsb2NrVGVtcGxhdGUocnBjVGVtcGxhdGUpIHtcbiAgICBsZXQgdGVtcGxhdGUgPSBuZXcgTW9uZXJvQmxvY2tUZW1wbGF0ZSgpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNUZW1wbGF0ZSkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNUZW1wbGF0ZVtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJibG9ja2hhc2hpbmdfYmxvYlwiKSB0ZW1wbGF0ZS5zZXRCbG9ja1RlbXBsYXRlQmxvYih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrdGVtcGxhdGVfYmxvYlwiKSB0ZW1wbGF0ZS5zZXRCbG9ja0hhc2hpbmdCbG9iKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGlmZmljdWx0eVwiKSB0ZW1wbGF0ZS5zZXREaWZmaWN1bHR5KEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJleHBlY3RlZF9yZXdhcmRcIikgdGVtcGxhdGUuc2V0RXhwZWN0ZWRSZXdhcmQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5XCIpIHsgfSAgLy8gaGFuZGxlZCBieSB3aWRlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5X3RvcDY0XCIpIHsgfSAgLy8gaGFuZGxlZCBieSB3aWRlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3aWRlX2RpZmZpY3VsdHlcIikgdGVtcGxhdGUuc2V0RGlmZmljdWx0eShHZW5VdGlscy5yZWNvbmNpbGUodGVtcGxhdGUuZ2V0RGlmZmljdWx0eSgpLCBNb25lcm9EYWVtb25ScGMucHJlZml4ZWRIZXhUb0JJKHZhbCkpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJoZWlnaHRcIikgdGVtcGxhdGUuc2V0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHJldl9oYXNoXCIpIHRlbXBsYXRlLnNldFByZXZIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVzZXJ2ZWRfb2Zmc2V0XCIpIHRlbXBsYXRlLnNldFJlc2VydmVkT2Zmc2V0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3RhdHVzXCIpIHt9ICAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVudHJ1c3RlZFwiKSB7fSAgLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzZWVkX2hlaWdodFwiKSB0ZW1wbGF0ZS5zZXRTZWVkSGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic2VlZF9oYXNoXCIpIHRlbXBsYXRlLnNldFNlZWRIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibmV4dF9zZWVkX2hhc2hcIikgdGVtcGxhdGUuc2V0TmV4dFNlZWRIYXNoKHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBibG9jayB0ZW1wbGF0ZTogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICBpZiAoXCJcIiA9PT0gdGVtcGxhdGUuZ2V0TmV4dFNlZWRIYXNoKCkpIHRlbXBsYXRlLnNldE5leHRTZWVkSGFzaCh1bmRlZmluZWQpO1xuICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjSW5mbyhycGNJbmZvKSB7XG4gICAgaWYgKCFycGNJbmZvKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIGxldCBpbmZvID0gbmV3IE1vbmVyb0RhZW1vbkluZm8oKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjSW5mbykpIHtcbiAgICAgIGxldCB2YWwgPSBycGNJbmZvW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcInZlcnNpb25cIikgaW5mby5zZXRWZXJzaW9uKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYWx0X2Jsb2Nrc19jb3VudFwiKSBpbmZvLnNldE51bUFsdEJsb2Nrcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX3NpemVfbGltaXRcIikgaW5mby5zZXRCbG9ja1NpemVMaW1pdCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX3NpemVfbWVkaWFuXCIpIGluZm8uc2V0QmxvY2tTaXplTWVkaWFuKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfd2VpZ2h0X2xpbWl0XCIpIGluZm8uc2V0QmxvY2tXZWlnaHRMaW1pdCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX3dlaWdodF9tZWRpYW5cIikgaW5mby5zZXRCbG9ja1dlaWdodE1lZGlhbih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJvb3RzdHJhcF9kYWVtb25fYWRkcmVzc1wiKSB7IGlmICh2YWwpIGluZm8uc2V0Qm9vdHN0cmFwRGFlbW9uQWRkcmVzcyh2YWwpOyB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGlmZmljdWx0eVwiKSB7IH0gIC8vIGhhbmRsZWQgYnkgd2lkZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3VtdWxhdGl2ZV9kaWZmaWN1bHR5XCIpIHsgfSAvLyBoYW5kbGVkIGJ5IHdpZGVfY3VtdWxhdGl2ZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGlmZmljdWx0eV90b3A2NFwiKSB7IH0gIC8vIGhhbmRsZWQgYnkgd2lkZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3VtdWxhdGl2ZV9kaWZmaWN1bHR5X3RvcDY0XCIpIHsgfSAvLyBoYW5kbGVkIGJ5IHdpZGVfY3VtdWxhdGl2ZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2lkZV9kaWZmaWN1bHR5XCIpIGluZm8uc2V0RGlmZmljdWx0eShHZW5VdGlscy5yZWNvbmNpbGUoaW5mby5nZXREaWZmaWN1bHR5KCksIE1vbmVyb0RhZW1vblJwYy5wcmVmaXhlZEhleFRvQkkodmFsKSkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndpZGVfY3VtdWxhdGl2ZV9kaWZmaWN1bHR5XCIpIGluZm8uc2V0Q3VtdWxhdGl2ZURpZmZpY3VsdHkoR2VuVXRpbHMucmVjb25jaWxlKGluZm8uZ2V0Q3VtdWxhdGl2ZURpZmZpY3VsdHkoKSwgTW9uZXJvRGFlbW9uUnBjLnByZWZpeGVkSGV4VG9CSSh2YWwpKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZnJlZV9zcGFjZVwiKSBpbmZvLnNldEZyZWVTcGFjZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGF0YWJhc2Vfc2l6ZVwiKSBpbmZvLnNldERhdGFiYXNlU2l6ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImdyZXlfcGVlcmxpc3Rfc2l6ZVwiKSBpbmZvLnNldE51bU9mZmxpbmVQZWVycyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhlaWdodFwiKSBpbmZvLnNldEhlaWdodCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhlaWdodF93aXRob3V0X2Jvb3RzdHJhcFwiKSBpbmZvLnNldEhlaWdodFdpdGhvdXRCb290c3RyYXAodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJpbmNvbWluZ19jb25uZWN0aW9uc19jb3VudFwiKSBpbmZvLnNldE51bUluY29taW5nQ29ubmVjdGlvbnModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJvZmZsaW5lXCIpIGluZm8uc2V0SXNPZmZsaW5lKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwib3V0Z29pbmdfY29ubmVjdGlvbnNfY291bnRcIikgaW5mby5zZXROdW1PdXRnb2luZ0Nvbm5lY3Rpb25zKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicnBjX2Nvbm5lY3Rpb25zX2NvdW50XCIpIGluZm8uc2V0TnVtUnBjQ29ubmVjdGlvbnModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGFydF90aW1lXCIpIGluZm8uc2V0U3RhcnRUaW1lc3RhbXAodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhZGp1c3RlZF90aW1lXCIpIGluZm8uc2V0QWRqdXN0ZWRUaW1lc3RhbXAodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGF0dXNcIikge30gIC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidGFyZ2V0XCIpIGluZm8uc2V0VGFyZ2V0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidGFyZ2V0X2hlaWdodFwiKSBpbmZvLnNldFRhcmdldEhlaWdodCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRvcF9ibG9ja19oYXNoXCIpIGluZm8uc2V0VG9wQmxvY2tIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfY291bnRcIikgaW5mby5zZXROdW1UeHModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9wb29sX3NpemVcIikgaW5mby5zZXROdW1UeHNQb29sKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW50cnVzdGVkXCIpIHt9IC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2FzX2Jvb3RzdHJhcF9ldmVyX3VzZWRcIikgaW5mby5zZXRXYXNCb290c3RyYXBFdmVyVXNlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndoaXRlX3BlZXJsaXN0X3NpemVcIikgaW5mby5zZXROdW1PbmxpbmVQZWVycyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVwZGF0ZV9hdmFpbGFibGVcIikgaW5mby5zZXRVcGRhdGVBdmFpbGFibGUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJuZXR0eXBlXCIpIEdlblV0aWxzLnNhZmVTZXQoaW5mbywgaW5mby5nZXROZXR3b3JrVHlwZSwgaW5mby5zZXROZXR3b3JrVHlwZSwgTW9uZXJvTmV0d29ya1R5cGUucGFyc2UodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibWFpbm5ldFwiKSB7IGlmICh2YWwpIEdlblV0aWxzLnNhZmVTZXQoaW5mbywgaW5mby5nZXROZXR3b3JrVHlwZSwgaW5mby5zZXROZXR3b3JrVHlwZSwgTW9uZXJvTmV0d29ya1R5cGUuTUFJTk5FVCk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0ZXN0bmV0XCIpIHsgaWYgKHZhbCkgR2VuVXRpbHMuc2FmZVNldChpbmZvLCBpbmZvLmdldE5ldHdvcmtUeXBlLCBpbmZvLnNldE5ldHdvcmtUeXBlLCBNb25lcm9OZXR3b3JrVHlwZS5URVNUTkVUKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YWdlbmV0XCIpIHsgaWYgKHZhbCkgR2VuVXRpbHMuc2FmZVNldChpbmZvLCBpbmZvLmdldE5ldHdvcmtUeXBlLCBpbmZvLnNldE5ldHdvcmtUeXBlLCBNb25lcm9OZXR3b3JrVHlwZS5TVEFHRU5FVCk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjcmVkaXRzXCIpIGluZm8uc2V0Q3JlZGl0cyhCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidG9wX2Jsb2NrX2hhc2hcIiB8fCBrZXkgPT09IFwidG9wX2hhc2hcIikgaW5mby5zZXRUb3BCbG9ja0hhc2goR2VuVXRpbHMucmVjb25jaWxlKGluZm8uZ2V0VG9wQmxvY2tIYXNoKCksIFwiXCIgPT09IHZhbCA/IHVuZGVmaW5lZCA6IHZhbCkpXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYnVzeV9zeW5jaW5nXCIpIGluZm8uc2V0SXNCdXN5U3luY2luZyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN5bmNocm9uaXplZFwiKSBpbmZvLnNldElzU3luY2hyb25pemVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVzdHJpY3RlZFwiKSBpbmZvLnNldElzUmVzdHJpY3RlZCh2YWwpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IElnbm9yaW5nIHVuZXhwZWN0ZWQgaW5mbyBmaWVsZDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gaW5mbztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHN5bmMgaW5mbyBmcm9tIFJQQyBzeW5jIGluZm8uXG4gICAqIFxuICAgKiBAcGFyYW0gcnBjU3luY0luZm8gLSBycGMgbWFwIHRvIGluaXRpYWxpemUgdGhlIHN5bmMgaW5mbyBmcm9tXG4gICAqIEByZXR1cm4ge01vbmVyb0RhZW1vblN5bmNJbmZvfSBpcyBzeW5jIGluZm8gaW5pdGlhbGl6ZWQgZnJvbSB0aGUgbWFwXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNTeW5jSW5mbyhycGNTeW5jSW5mbykge1xuICAgIGxldCBzeW5jSW5mbyA9IG5ldyBNb25lcm9EYWVtb25TeW5jSW5mbygpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNTeW5jSW5mbykpIHtcbiAgICAgIGxldCB2YWwgPSBycGNTeW5jSW5mb1trZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJoZWlnaHRcIikgc3luY0luZm8uc2V0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicGVlcnNcIikge1xuICAgICAgICBzeW5jSW5mby5zZXRQZWVycyhbXSk7XG4gICAgICAgIGxldCBycGNDb25uZWN0aW9ucyA9IHZhbDtcbiAgICAgICAgZm9yIChsZXQgcnBjQ29ubmVjdGlvbiBvZiBycGNDb25uZWN0aW9ucykge1xuICAgICAgICAgIHN5bmNJbmZvLmdldFBlZXJzKCkucHVzaChNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Nvbm5lY3Rpb24ocnBjQ29ubmVjdGlvbi5pbmZvKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzcGFuc1wiKSB7XG4gICAgICAgIHN5bmNJbmZvLnNldFNwYW5zKFtdKTtcbiAgICAgICAgbGV0IHJwY1NwYW5zID0gdmFsO1xuICAgICAgICBmb3IgKGxldCBycGNTcGFuIG9mIHJwY1NwYW5zKSB7XG4gICAgICAgICAgc3luY0luZm8uZ2V0U3BhbnMoKS5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQ29ubmVjdGlvblNwYW4ocnBjU3BhbikpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGtleSA9PT0gXCJzdGF0dXNcIikge30gICAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRhcmdldF9oZWlnaHRcIikgc3luY0luZm8uc2V0VGFyZ2V0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibmV4dF9uZWVkZWRfcHJ1bmluZ19zZWVkXCIpIHN5bmNJbmZvLnNldE5leHROZWVkZWRQcnVuaW5nU2VlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm92ZXJ2aWV3XCIpIHsgIC8vIHRoaXMgcmV0dXJucyBbXSB3aXRob3V0IHBydW5pbmdcbiAgICAgICAgbGV0IG92ZXJ2aWV3O1xuICAgICAgICB0cnkge1xuICAgICAgICAgIG92ZXJ2aWV3ID0gSlNPTi5wYXJzZSh2YWwpO1xuICAgICAgICAgIGlmIChvdmVydmlldyAhPT0gdW5kZWZpbmVkICYmIG92ZXJ2aWV3Lmxlbmd0aCA+IDApIGNvbnNvbGUuZXJyb3IoXCJJZ25vcmluZyBub24tZW1wdHkgJ292ZXJ2aWV3JyBmaWVsZCAobm90IGltcGxlbWVudGVkKTogXCIgKyBvdmVydmlldyk7IC8vIFRPRE9cbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBwYXJzZSAnb3ZlcnZpZXcnIGZpZWxkOiBcIiArIG92ZXJ2aWV3ICsgXCI6IFwiICsgZS5tZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNyZWRpdHNcIikgc3luY0luZm8uc2V0Q3JlZGl0cyhCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidG9wX2hhc2hcIikgc3luY0luZm8uc2V0VG9wQmxvY2tIYXNoKFwiXCIgPT09IHZhbCA/IHVuZGVmaW5lZCA6IHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW50cnVzdGVkXCIpIHt9ICAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gc3luYyBpbmZvOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBzeW5jSW5mbztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjSGFyZEZvcmtJbmZvKHJwY0hhcmRGb3JrSW5mbykge1xuICAgIGxldCBpbmZvID0gbmV3IE1vbmVyb0hhcmRGb3JrSW5mbygpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNIYXJkRm9ya0luZm8pKSB7XG4gICAgICBsZXQgdmFsID0gcnBjSGFyZEZvcmtJbmZvW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImVhcmxpZXN0X2hlaWdodFwiKSBpbmZvLnNldEVhcmxpZXN0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZW5hYmxlZFwiKSBpbmZvLnNldElzRW5hYmxlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXRlXCIpIGluZm8uc2V0U3RhdGUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGF0dXNcIikge30gICAgIC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW50cnVzdGVkXCIpIHt9ICAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRocmVzaG9sZFwiKSBpbmZvLnNldFRocmVzaG9sZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInZlcnNpb25cIikgaW5mby5zZXRWZXJzaW9uKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidm90ZXNcIikgaW5mby5zZXROdW1Wb3Rlcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInZvdGluZ1wiKSBpbmZvLnNldFZvdGluZyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndpbmRvd1wiKSBpbmZvLnNldFdpbmRvdyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNyZWRpdHNcIikgaW5mby5zZXRDcmVkaXRzKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0b3BfaGFzaFwiKSBpbmZvLnNldFRvcEJsb2NrSGFzaChcIlwiID09PSB2YWwgPyB1bmRlZmluZWQgOiB2YWwpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gaGFyZCBmb3JrIGluZm86IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIGluZm87XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY0Nvbm5lY3Rpb25TcGFuKHJwY0Nvbm5lY3Rpb25TcGFuKSB7XG4gICAgbGV0IHNwYW4gPSBuZXcgTW9uZXJvQ29ubmVjdGlvblNwYW4oKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjQ29ubmVjdGlvblNwYW4pKSB7XG4gICAgICBsZXQgdmFsID0gcnBjQ29ubmVjdGlvblNwYW5ba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiY29ubmVjdGlvbl9pZFwiKSBzcGFuLnNldENvbm5lY3Rpb25JZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm5ibG9ja3NcIikgc3Bhbi5zZXROdW1CbG9ja3ModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyYXRlXCIpIHNwYW4uc2V0UmF0ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJlbW90ZV9hZGRyZXNzXCIpIHsgaWYgKHZhbCAhPT0gXCJcIikgc3Bhbi5zZXRSZW1vdGVBZGRyZXNzKHZhbCk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzaXplXCIpIHNwYW4uc2V0U2l6ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNwZWVkXCIpIHNwYW4uc2V0U3BlZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGFydF9ibG9ja19oZWlnaHRcIikgc3Bhbi5zZXRTdGFydEhlaWdodCh2YWwpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gZGFlbW9uIGNvbm5lY3Rpb24gc3BhbjogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gc3BhbjtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjT3V0cHV0SGlzdG9ncmFtRW50cnkocnBjRW50cnkpIHtcbiAgICBsZXQgZW50cnkgPSBuZXcgTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjRW50cnkpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjRW50cnlba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYW1vdW50XCIpIGVudHJ5LnNldEFtb3VudChCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidG90YWxfaW5zdGFuY2VzXCIpIGVudHJ5LnNldE51bUluc3RhbmNlcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVubG9ja2VkX2luc3RhbmNlc1wiKSBlbnRyeS5zZXROdW1VbmxvY2tlZEluc3RhbmNlcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJlY2VudF9pbnN0YW5jZXNcIikgZW50cnkuc2V0TnVtUmVjZW50SW5zdGFuY2VzKHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBvdXRwdXQgaGlzdG9ncmFtOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBlbnRyeTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjU3VibWl0VHhSZXN1bHQocnBjUmVzdWx0KSB7XG4gICAgYXNzZXJ0KHJwY1Jlc3VsdCk7XG4gICAgbGV0IHJlc3VsdCA9IG5ldyBNb25lcm9TdWJtaXRUeFJlc3VsdCgpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNSZXN1bHQpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjUmVzdWx0W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImRvdWJsZV9zcGVuZFwiKSByZXN1bHQuc2V0SXNEb3VibGVTcGVuZFNlZW4odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmZWVfdG9vX2xvd1wiKSByZXN1bHQuc2V0SXNGZWVUb29Mb3codmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJpbnZhbGlkX2lucHV0XCIpIHJlc3VsdC5zZXRIYXNJbnZhbGlkSW5wdXQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJpbnZhbGlkX291dHB1dFwiKSByZXN1bHQuc2V0SGFzSW52YWxpZE91dHB1dCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRvb19mZXdfb3V0cHV0c1wiKSByZXN1bHQuc2V0SGFzVG9vRmV3T3V0cHV0cyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxvd19taXhpblwiKSByZXN1bHQuc2V0SXNNaXhpblRvb0xvdyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm5vdF9yZWxheWVkXCIpIHJlc3VsdC5zZXRJc1JlbGF5ZWQoIXZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwib3ZlcnNwZW5kXCIpIHJlc3VsdC5zZXRJc092ZXJzcGVuZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJlYXNvblwiKSByZXN1bHQuc2V0UmVhc29uKHZhbCA9PT0gXCJcIiA/IHVuZGVmaW5lZCA6IHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidG9vX2JpZ1wiKSByZXN1bHQuc2V0SXNUb29CaWcodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzYW5pdHlfY2hlY2tfZmFpbGVkXCIpIHJlc3VsdC5zZXRTYW5pdHlDaGVja0ZhaWxlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNyZWRpdHNcIikgcmVzdWx0LnNldENyZWRpdHMoQmlnSW50KHZhbCkpXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3RhdHVzXCIgfHwga2V5ID09PSBcInVudHJ1c3RlZFwiKSB7fSAgLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0b3BfaGFzaFwiKSByZXN1bHQuc2V0VG9wQmxvY2tIYXNoKFwiXCIgPT09IHZhbCA/IHVuZGVmaW5lZCA6IHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfZXh0cmFfdG9vX2JpZ1wiKSByZXN1bHQuc2V0SXNUeEV4dHJhVG9vQmlnKHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBzdWJtaXQgdHggaGV4IHJlc3VsdDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNUeFBvb2xTdGF0cyhycGNTdGF0cykge1xuICAgIGFzc2VydChycGNTdGF0cyk7XG4gICAgbGV0IHN0YXRzID0gbmV3IE1vbmVyb1R4UG9vbFN0YXRzKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1N0YXRzKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1N0YXRzW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImJ5dGVzX21heFwiKSBzdGF0cy5zZXRCeXRlc01heCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJ5dGVzX21lZFwiKSBzdGF0cy5zZXRCeXRlc01lZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJ5dGVzX21pblwiKSBzdGF0cy5zZXRCeXRlc01pbih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJ5dGVzX3RvdGFsXCIpIHN0YXRzLnNldEJ5dGVzVG90YWwodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJoaXN0b185OHBjXCIpIHN0YXRzLnNldEhpc3RvOThwYyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm51bV8xMG1cIikgc3RhdHMuc2V0TnVtMTBtKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibnVtX2RvdWJsZV9zcGVuZHNcIikgc3RhdHMuc2V0TnVtRG91YmxlU3BlbmRzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibnVtX2ZhaWxpbmdcIikgc3RhdHMuc2V0TnVtRmFpbGluZyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm51bV9ub3RfcmVsYXllZFwiKSBzdGF0cy5zZXROdW1Ob3RSZWxheWVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwib2xkZXN0XCIpIHN0YXRzLnNldE9sZGVzdFRpbWVzdGFtcCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4c190b3RhbFwiKSBzdGF0cy5zZXROdW1UeHModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmZWVfdG90YWxcIikgc3RhdHMuc2V0RmVlVG90YWwoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhpc3RvXCIpIHtcbiAgICAgICAgc3RhdHMuc2V0SGlzdG8obmV3IE1hcCgpKTtcbiAgICAgICAgZm9yIChsZXQgZWxlbSBvZiB2YWwpIHN0YXRzLmdldEhpc3RvKCkuc2V0KGVsZW0uYnl0ZXMsIGVsZW0udHhzKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIHR4IHBvb2wgc3RhdHM6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG5cbiAgICAvLyB1bmluaXRpYWxpemUgc29tZSBzdGF0cyBpZiBub3QgYXBwbGljYWJsZVxuICAgIGlmIChzdGF0cy5nZXRIaXN0bzk4cGMoKSA9PT0gMCkgc3RhdHMuc2V0SGlzdG85OHBjKHVuZGVmaW5lZCk7XG4gICAgaWYgKHN0YXRzLmdldE51bVR4cygpID09PSAwKSB7XG4gICAgICBzdGF0cy5zZXRCeXRlc01pbih1bmRlZmluZWQpO1xuICAgICAgc3RhdHMuc2V0Qnl0ZXNNZWQodW5kZWZpbmVkKTtcbiAgICAgIHN0YXRzLnNldEJ5dGVzTWF4KHVuZGVmaW5lZCk7XG4gICAgICBzdGF0cy5zZXRIaXN0bzk4cGModW5kZWZpbmVkKTtcbiAgICAgIHN0YXRzLnNldE9sZGVzdFRpbWVzdGFtcCh1bmRlZmluZWQpO1xuICAgIH1cblxuICAgIHJldHVybiBzdGF0cztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjQWx0Q2hhaW4ocnBjQ2hhaW4pIHtcbiAgICBhc3NlcnQocnBjQ2hhaW4pO1xuICAgIGxldCBjaGFpbiA9IG5ldyBNb25lcm9BbHRDaGFpbigpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNDaGFpbikpIHtcbiAgICAgIGxldCB2YWwgPSBycGNDaGFpbltrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJibG9ja19oYXNoXCIpIHt9ICAvLyB1c2luZyBibG9ja19oYXNoZXMgaW5zdGVhZFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRpZmZpY3VsdHlcIikgeyB9IC8vIGhhbmRsZWQgYnkgd2lkZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGlmZmljdWx0eV90b3A2NFwiKSB7IH0gIC8vIGhhbmRsZWQgYnkgd2lkZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2lkZV9kaWZmaWN1bHR5XCIpIGNoYWluLnNldERpZmZpY3VsdHkoR2VuVXRpbHMucmVjb25jaWxlKGNoYWluLmdldERpZmZpY3VsdHkoKSwgTW9uZXJvRGFlbW9uUnBjLnByZWZpeGVkSGV4VG9CSSh2YWwpKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGVpZ2h0XCIpIGNoYWluLnNldEhlaWdodCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxlbmd0aFwiKSBjaGFpbi5zZXRMZW5ndGgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja19oYXNoZXNcIikgY2hhaW4uc2V0QmxvY2tIYXNoZXModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtYWluX2NoYWluX3BhcmVudF9ibG9ja1wiKSBjaGFpbi5zZXRNYWluQ2hhaW5QYXJlbnRCbG9ja0hhc2godmFsKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIGFsdGVybmF0aXZlIGNoYWluOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBjaGFpbjtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjUGVlcihycGNQZWVyKSB7XG4gICAgYXNzZXJ0KHJwY1BlZXIpO1xuICAgIGxldCBwZWVyID0gbmV3IE1vbmVyb1BlZXIoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjUGVlcikpIHtcbiAgICAgIGxldCB2YWwgPSBycGNQZWVyW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImhvc3RcIikgcGVlci5zZXRIb3N0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaWRcIikgcGVlci5zZXRJZChcIlwiICsgdmFsKTsgIC8vIFRPRE8gbW9uZXJvLXdhbGxldC1ycGM6IHBlZXIgaWQgaXMgQmlnSW50IGJ1dCBzdHJpbmcgaW4gYGdldF9jb25uZWN0aW9uc2BcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJpcFwiKSB7fSAvLyBob3N0IHVzZWQgaW5zdGVhZCB3aGljaCBpcyBjb25zaXN0ZW50bHkgYSBzdHJpbmdcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsYXN0X3NlZW5cIikgcGVlci5zZXRMYXN0U2VlblRpbWVzdGFtcCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBvcnRcIikgcGVlci5zZXRQb3J0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicnBjX3BvcnRcIikgcGVlci5zZXRScGNQb3J0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHJ1bmluZ19zZWVkXCIpIHBlZXIuc2V0UHJ1bmluZ1NlZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJycGNfY3JlZGl0c19wZXJfaGFzaFwiKSBwZWVyLnNldFJwY0NyZWRpdHNQZXJIYXNoKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIHJwYyBwZWVyOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBwZWVyO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNDb25uZWN0aW9uKHJwY0Nvbm5lY3Rpb24pIHtcbiAgICBsZXQgcGVlciA9IG5ldyBNb25lcm9QZWVyKCk7XG4gICAgcGVlci5zZXRJc09ubGluZSh0cnVlKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjQ29ubmVjdGlvbikpIHtcbiAgICAgIGxldCB2YWwgPSBycGNDb25uZWN0aW9uW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImFkZHJlc3NcIikgcGVlci5zZXRBZGRyZXNzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYXZnX2Rvd25sb2FkXCIpIHBlZXIuc2V0QXZnRG93bmxvYWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhdmdfdXBsb2FkXCIpIHBlZXIuc2V0QXZnVXBsb2FkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY29ubmVjdGlvbl9pZFwiKSBwZWVyLnNldElkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3VycmVudF9kb3dubG9hZFwiKSBwZWVyLnNldEN1cnJlbnREb3dubG9hZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImN1cnJlbnRfdXBsb2FkXCIpIHBlZXIuc2V0Q3VycmVudFVwbG9hZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhlaWdodFwiKSBwZWVyLnNldEhlaWdodCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhvc3RcIikgcGVlci5zZXRIb3N0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaXBcIikge30gLy8gaG9zdCB1c2VkIGluc3RlYWQgd2hpY2ggaXMgY29uc2lzdGVudGx5IGEgc3RyaW5nXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaW5jb21pbmdcIikgcGVlci5zZXRJc0luY29taW5nKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibGl2ZV90aW1lXCIpIHBlZXIuc2V0TGl2ZVRpbWUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsb2NhbF9pcFwiKSBwZWVyLnNldElzTG9jYWxJcCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxvY2FsaG9zdFwiKSBwZWVyLnNldElzTG9jYWxIb3N0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicGVlcl9pZFwiKSBwZWVyLnNldElkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicG9ydFwiKSBwZWVyLnNldFBvcnQocGFyc2VJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicnBjX3BvcnRcIikgcGVlci5zZXRScGNQb3J0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVjdl9jb3VudFwiKSBwZWVyLnNldE51bVJlY2VpdmVzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVjdl9pZGxlX3RpbWVcIikgcGVlci5zZXRSZWNlaXZlSWRsZVRpbWUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzZW5kX2NvdW50XCIpIHBlZXIuc2V0TnVtU2VuZHModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzZW5kX2lkbGVfdGltZVwiKSBwZWVyLnNldFNlbmRJZGxlVGltZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXRlXCIpIHBlZXIuc2V0U3RhdGUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdXBwb3J0X2ZsYWdzXCIpIHBlZXIuc2V0TnVtU3VwcG9ydEZsYWdzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHJ1bmluZ19zZWVkXCIpIHBlZXIuc2V0UHJ1bmluZ1NlZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJycGNfY3JlZGl0c19wZXJfaGFzaFwiKSBwZWVyLnNldFJwY0NyZWRpdHNQZXJIYXNoKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhZGRyZXNzX3R5cGVcIikgcGVlci5zZXRUeXBlKHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBwZWVyOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBwZWVyO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRUb1JwY0JhbihiYW46IE1vbmVyb0Jhbikge1xuICAgIGxldCBycGNCYW46IGFueSA9IHt9O1xuICAgIHJwY0Jhbi5ob3N0ID0gYmFuLmdldEhvc3QoKTtcbiAgICBycGNCYW4uaXAgPSBiYW4uZ2V0SXAoKTtcbiAgICBycGNCYW4uYmFuID0gYmFuLmdldElzQmFubmVkKCk7XG4gICAgcnBjQmFuLnNlY29uZHMgPSBiYW4uZ2V0U2Vjb25kcygpO1xuICAgIHJldHVybiBycGNCYW47XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY01pbmluZ1N0YXR1cyhycGNTdGF0dXMpIHtcbiAgICBsZXQgc3RhdHVzID0gbmV3IE1vbmVyb01pbmluZ1N0YXR1cygpO1xuICAgIHN0YXR1cy5zZXRJc0FjdGl2ZShycGNTdGF0dXMuYWN0aXZlKTtcbiAgICBzdGF0dXMuc2V0U3BlZWQocnBjU3RhdHVzLnNwZWVkKTtcbiAgICBzdGF0dXMuc2V0TnVtVGhyZWFkcyhycGNTdGF0dXMudGhyZWFkc19jb3VudCk7XG4gICAgaWYgKHJwY1N0YXR1cy5hY3RpdmUpIHtcbiAgICAgIHN0YXR1cy5zZXRBZGRyZXNzKHJwY1N0YXR1cy5hZGRyZXNzKTtcbiAgICAgIHN0YXR1cy5zZXRJc0JhY2tncm91bmQocnBjU3RhdHVzLmlzX2JhY2tncm91bmRfbWluaW5nX2VuYWJsZWQpO1xuICAgIH1cbiAgICByZXR1cm4gc3RhdHVzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNVcGRhdGVDaGVja1Jlc3VsdChycGNSZXN1bHQpIHtcbiAgICBhc3NlcnQocnBjUmVzdWx0KTtcbiAgICBsZXQgcmVzdWx0ID0gbmV3IE1vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0KCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1Jlc3VsdCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNSZXN1bHRba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYXV0b191cmlcIikgcmVzdWx0LnNldEF1dG9VcmkodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJoYXNoXCIpIHJlc3VsdC5zZXRIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicGF0aFwiKSB7fSAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXR1c1wiKSB7fSAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVwZGF0ZVwiKSByZXN1bHQuc2V0SXNVcGRhdGVBdmFpbGFibGUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1c2VyX3VyaVwiKSByZXN1bHQuc2V0VXNlclVyaSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInZlcnNpb25cIikgcmVzdWx0LnNldFZlcnNpb24odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bnRydXN0ZWRcIikge30gLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIHJwYyBjaGVjayB1cGRhdGUgcmVzdWx0OiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIGlmIChyZXN1bHQuZ2V0QXV0b1VyaSgpID09PSBcIlwiKSByZXN1bHQuc2V0QXV0b1VyaSh1bmRlZmluZWQpO1xuICAgIGlmIChyZXN1bHQuZ2V0VXNlclVyaSgpID09PSBcIlwiKSByZXN1bHQuc2V0VXNlclVyaSh1bmRlZmluZWQpO1xuICAgIGlmIChyZXN1bHQuZ2V0VmVyc2lvbigpID09PSBcIlwiKSByZXN1bHQuc2V0VmVyc2lvbih1bmRlZmluZWQpO1xuICAgIGlmIChyZXN1bHQuZ2V0SGFzaCgpID09PSBcIlwiKSByZXN1bHQuc2V0SGFzaCh1bmRlZmluZWQpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1VwZGF0ZURvd25sb2FkUmVzdWx0KHJwY1Jlc3VsdCkge1xuICAgIGxldCByZXN1bHQgPSBuZXcgTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQoTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNVcGRhdGVDaGVja1Jlc3VsdChycGNSZXN1bHQpIGFzIE1vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0KTtcbiAgICByZXN1bHQuc2V0RG93bmxvYWRQYXRoKHJwY1Jlc3VsdFtcInBhdGhcIl0pO1xuICAgIGlmIChyZXN1bHQuZ2V0RG93bmxvYWRQYXRoKCkgPT09IFwiXCIpIHJlc3VsdC5zZXREb3dubG9hZFBhdGgodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGEgJzB4JyBwcmVmaXhlZCBoZXhpZGVjaW1hbCBzdHJpbmcgdG8gYSBiaWdpbnQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gaGV4IGlzIHRoZSAnMHgnIHByZWZpeGVkIGhleGlkZWNpbWFsIHN0cmluZyB0byBjb252ZXJ0XG4gICAqIEByZXR1cm4ge2JpZ2ludH0gdGhlIGhleGljZWRpbWFsIGNvbnZlcnRlZCB0byBkZWNpbWFsXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIHByZWZpeGVkSGV4VG9CSShoZXgpIHtcbiAgICBhc3NlcnQoaGV4LnN1YnN0cmluZygwLCAyKSA9PT0gXCIweFwiKTtcbiAgICByZXR1cm4gQmlnSW50KGhleCk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbXBsZW1lbnRzIGEgTW9uZXJvRGFlbW9uIGJ5IHByb3h5aW5nIHJlcXVlc3RzIHRvIGEgd29ya2VyLlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBNb25lcm9EYWVtb25ScGNQcm94eSB7XG5cbiAgLy8gc3RhdGUgdmFyaWFibGVzXG4gIHByaXZhdGUgZGFlbW9uSWQ6IGFueTtcbiAgcHJpdmF0ZSB3b3JrZXI6IGFueTtcbiAgcHJpdmF0ZSB3cmFwcGVkTGlzdGVuZXJzOiBhbnk7XG4gIHByaXZhdGUgcHJvY2VzczogYW55O1xuXG4gIGNvbnN0cnVjdG9yKGRhZW1vbklkLCB3b3JrZXIpIHtcbiAgICB0aGlzLmRhZW1vbklkID0gZGFlbW9uSWQ7XG4gICAgdGhpcy53b3JrZXIgPSB3b3JrZXI7XG4gICAgdGhpcy53cmFwcGVkTGlzdGVuZXJzID0gW107XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBTVEFUSUMgVVRJTElUSUVTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICBzdGF0aWMgYXN5bmMgY29ubmVjdChjb25maWcpIHtcbiAgICBsZXQgZGFlbW9uSWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgY29uZmlnID0gT2JqZWN0LmFzc2lnbih7fSwgY29uZmlnLCB7cHJveHlUb1dvcmtlcjogZmFsc2V9KTtcbiAgICBhd2FpdCBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKGRhZW1vbklkLCBcImNvbm5lY3REYWVtb25ScGNcIiwgW2NvbmZpZ10pO1xuICAgIHJldHVybiBuZXcgTW9uZXJvRGFlbW9uUnBjUHJveHkoZGFlbW9uSWQsIGF3YWl0IExpYnJhcnlVdGlscy5nZXRXb3JrZXIoKSk7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gSU5TVEFOQ0UgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICBhc3luYyBhZGRMaXN0ZW5lcihsaXN0ZW5lcikge1xuICAgIGxldCB3cmFwcGVkTGlzdGVuZXIgPSBuZXcgRGFlbW9uV29ya2VyTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIGxldCBsaXN0ZW5lcklkID0gd3JhcHBlZExpc3RlbmVyLmdldElkKCk7XG4gICAgTGlicmFyeVV0aWxzLmFkZFdvcmtlckNhbGxiYWNrKHRoaXMuZGFlbW9uSWQsIFwib25CbG9ja0hlYWRlcl9cIiArIGxpc3RlbmVySWQsIFt3cmFwcGVkTGlzdGVuZXIub25CbG9ja0hlYWRlciwgd3JhcHBlZExpc3RlbmVyXSk7XG4gICAgdGhpcy53cmFwcGVkTGlzdGVuZXJzLnB1c2god3JhcHBlZExpc3RlbmVyKTtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25BZGRMaXN0ZW5lclwiLCBbbGlzdGVuZXJJZF0pO1xuICB9XG4gIFxuICBhc3luYyByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcikge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53cmFwcGVkTGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodGhpcy53cmFwcGVkTGlzdGVuZXJzW2ldLmdldExpc3RlbmVyKCkgPT09IGxpc3RlbmVyKSB7XG4gICAgICAgIGxldCBsaXN0ZW5lcklkID0gdGhpcy53cmFwcGVkTGlzdGVuZXJzW2ldLmdldElkKCk7XG4gICAgICAgIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uUmVtb3ZlTGlzdGVuZXJcIiwgW2xpc3RlbmVySWRdKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnJlbW92ZVdvcmtlckNhbGxiYWNrKHRoaXMuZGFlbW9uSWQsIFwib25CbG9ja0hlYWRlcl9cIiArIGxpc3RlbmVySWQpO1xuICAgICAgICB0aGlzLndyYXBwZWRMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkxpc3RlbmVyIGlzIG5vdCByZWdpc3RlcmVkIHdpdGggZGFlbW9uXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRMaXN0ZW5lcnMoKSB7XG4gICAgbGV0IGxpc3RlbmVycyA9IFtdO1xuICAgIGZvciAobGV0IHdyYXBwZWRMaXN0ZW5lciBvZiB0aGlzLndyYXBwZWRMaXN0ZW5lcnMpIGxpc3RlbmVycy5wdXNoKHdyYXBwZWRMaXN0ZW5lci5nZXRMaXN0ZW5lcigpKTtcbiAgICByZXR1cm4gbGlzdGVuZXJzO1xuICB9XG4gIFxuICBhc3luYyBnZXRScGNDb25uZWN0aW9uKCkge1xuICAgIGxldCBjb25maWcgPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFJwY0Nvbm5lY3Rpb25cIik7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKGNvbmZpZyBhcyBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+KTtcbiAgfVxuICBcbiAgYXN5bmMgaXNDb25uZWN0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uSXNDb25uZWN0ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFZlcnNpb24oKSB7XG4gICAgbGV0IHZlcnNpb25Kc29uOiBhbnkgPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFZlcnNpb25cIik7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9WZXJzaW9uKHZlcnNpb25Kc29uLm51bWJlciwgdmVyc2lvbkpzb24uaXNSZWxlYXNlKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNUcnVzdGVkKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbklzVHJ1c3RlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEhlaWdodFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tIYXNoKGhlaWdodCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2NrSGFzaFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja1RlbXBsYXRlKHdhbGxldEFkZHJlc3MsIHJlc2VydmVTaXplKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9CbG9ja1RlbXBsYXRlKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tUZW1wbGF0ZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TGFzdEJsb2NrSGVhZGVyKCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRMYXN0QmxvY2tIZWFkZXJcIikpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0hlYWRlckJ5SGFzaChibG9ja0hhc2gpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tIZWFkZXJCeUhhc2hcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrSGVhZGVyQnlIZWlnaHQoaGVpZ2h0KSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9CbG9ja0hlYWRlcihhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2NrSGVhZGVyQnlIZWlnaHRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrSGVhZGVyc0J5UmFuZ2Uoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCkge1xuICAgIGxldCBibG9ja0hlYWRlcnNKc29uOiBhbnlbXSA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tIZWFkZXJzQnlSYW5nZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpIGFzIGFueVtdO1xuICAgIGxldCBoZWFkZXJzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2tIZWFkZXJKc29uIG9mIGJsb2NrSGVhZGVyc0pzb24pIGhlYWRlcnMucHVzaChuZXcgTW9uZXJvQmxvY2tIZWFkZXIoYmxvY2tIZWFkZXJKc29uKSk7XG4gICAgcmV0dXJuIGhlYWRlcnM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrQnlIYXNoKGJsb2NrSGFzaCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvQmxvY2soYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja0J5SGFzaFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpLCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tzQnlIYXNoKGJsb2NrSGFzaGVzLCBzdGFydEhlaWdodCwgcHJ1bmUpIHtcbiAgICBsZXQgYmxvY2tzSnNvbjogYW55W10gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2Nrc0J5SGFzaFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpIGFzIGFueVtdO1xuICAgIGxldCBibG9ja3MgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0pzb24gb2YgYmxvY2tzSnNvbikgYmxvY2tzLnB1c2gobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbikpO1xuICAgIHJldHVybiBibG9ja3M7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrQnlIZWlnaHQoaGVpZ2h0KSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9CbG9jayhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2NrQnlIZWlnaHRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2Nrc0J5SGVpZ2h0KGhlaWdodHMpIHtcbiAgICBsZXQgYmxvY2tzSnNvbjogYW55W109IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tzQnlIZWlnaHRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSBhcyBhbnlbXTtcbiAgICBsZXQgYmxvY2tzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2tKc29uIG9mIGJsb2Nrc0pzb24pIGJsb2Nrcy5wdXNoKG5ldyBNb25lcm9CbG9jayhibG9ja0pzb24sIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFgpKTtcbiAgICByZXR1cm4gYmxvY2tzO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja3NCeVJhbmdlKHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpIHtcbiAgICBsZXQgYmxvY2tzSnNvbjogYW55W10gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2Nrc0J5UmFuZ2VcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSBhcyBhbnlbXTtcbiAgICBsZXQgYmxvY2tzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2tKc29uIG9mIGJsb2Nrc0pzb24pIGJsb2Nrcy5wdXNoKG5ldyBNb25lcm9CbG9jayhibG9ja0pzb24sIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFgpKTtcbiAgICByZXR1cm4gYmxvY2tzO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja3NCeVJhbmdlQ2h1bmtlZChzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBtYXhDaHVua1NpemUpIHtcbiAgICBsZXQgYmxvY2tzSnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tzQnlSYW5nZUNodW5rZWRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSBhcyBhbnlbXTtcbiAgICBsZXQgYmxvY2tzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2tKc29uIG9mIGJsb2Nrc0pzb24pIGJsb2Nrcy5wdXNoKG5ldyBNb25lcm9CbG9jayhibG9ja0pzb24sIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFgpKTtcbiAgICByZXR1cm4gYmxvY2tzO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0hhc2hlcyhibG9ja0hhc2hlcywgc3RhcnRIZWlnaHQpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja0hhc2hlc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeHModHhIYXNoZXMsIHBydW5lID0gZmFsc2UpIHtcbiAgICBcbiAgICAvLyBkZXNlcmlhbGl6ZSB0eHMgZnJvbSBibG9ja3NcbiAgICBsZXQgYmxvY2tzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2tKc29uIG9mIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0VHhzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkgYXMgYW55W10pIHtcbiAgICAgIGJsb2Nrcy5wdXNoKG5ldyBNb25lcm9CbG9jayhibG9ja0pzb24sIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFgpKTtcbiAgICB9XG4gICAgXG4gICAgLy8gY29sbGVjdCB0eHNcbiAgICBsZXQgdHhzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2sgb2YgYmxvY2tzKSB7XG4gICAgICBmb3IgKGxldCB0eCBvZiBibG9jay5nZXRUeHMoKSkge1xuICAgICAgICBpZiAoIXR4LmdldElzQ29uZmlybWVkKCkpIHR4LnNldEJsb2NrKHVuZGVmaW5lZCk7XG4gICAgICAgIHR4cy5wdXNoKHR4KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHR4cztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhIZXhlcyh0eEhhc2hlcywgcHJ1bmUgPSBmYWxzZSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFR4SGV4ZXNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TWluZXJUeFN1bShoZWlnaHQsIG51bUJsb2Nrcykge1xuICAgIHJldHVybiBuZXcgTW9uZXJvTWluZXJUeFN1bShhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldE1pbmVyVHhTdW1cIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEZlZUVzdGltYXRlKGdyYWNlQmxvY2tzPykge1xuICAgIHJldHVybiBuZXcgTW9uZXJvRmVlRXN0aW1hdGUoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRGZWVFc3RpbWF0ZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgc3VibWl0VHhIZXgodHhIZXgsIGRvTm90UmVsYXkpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1N1Ym1pdFR4UmVzdWx0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uU3VibWl0VHhIZXhcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbGF5VHhzQnlIYXNoKHR4SGFzaGVzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uUmVsYXlUeHNCeUhhc2hcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhQb29sKCkge1xuICAgIGxldCBibG9ja0pzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFR4UG9vbFwiKTtcbiAgICBsZXQgdHhzID0gbmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWCkuZ2V0VHhzKCk7XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB0eC5zZXRCbG9jayh1bmRlZmluZWQpO1xuICAgIHJldHVybiB0eHMgPyB0eHMgOiBbXTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhQb29sSGFzaGVzKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFR4UG9vbEhhc2hlc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFBvb2xCYWNrbG9nKCkge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhQb29sU3RhdHMoKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9UeFBvb2xTdGF0cyhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFR4UG9vbFN0YXRzXCIpKTtcbiAgfVxuICBcbiAgYXN5bmMgZmx1c2hUeFBvb2woaGFzaGVzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uRmx1c2hUeFBvb2xcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzKGtleUltYWdlcykge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEtleUltYWdlU3BlbnRTdGF0dXNlc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRPdXRwdXRzKG91dHB1dHMpOiBQcm9taXNlPE1vbmVyb091dHB1dFtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRPdXRwdXRIaXN0b2dyYW0oYW1vdW50cywgbWluQ291bnQsIG1heENvdW50LCBpc1VubG9ja2VkLCByZWNlbnRDdXRvZmYpIHtcbiAgICBsZXQgZW50cmllcyA9IFtdO1xuICAgIGZvciAobGV0IGVudHJ5SnNvbiBvZiBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldE91dHB1dEhpc3RvZ3JhbVwiLCBbYW1vdW50cywgbWluQ291bnQsIG1heENvdW50LCBpc1VubG9ja2VkLCByZWNlbnRDdXRvZmZdKSBhcyBhbnlbXSkge1xuICAgICAgZW50cmllcy5wdXNoKG5ldyBNb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeShlbnRyeUpzb24pKTtcbiAgICB9XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dERpc3RyaWJ1dGlvbihhbW91bnRzLCBjdW11bGF0aXZlLCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRJbmZvKCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvRGFlbW9uSW5mbyhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEluZm9cIikpO1xuICB9XG4gIFxuICBhc3luYyBnZXRTeW5jSW5mbygpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0RhZW1vblN5bmNJbmZvKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0U3luY0luZm9cIikpO1xuICB9XG4gIFxuICBhc3luYyBnZXRIYXJkRm9ya0luZm8oKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9IYXJkRm9ya0luZm8oYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRIYXJkRm9ya0luZm9cIikpO1xuICB9XG4gIFxuICBhc3luYyBnZXRBbHRDaGFpbnMoKSB7XG4gICAgbGV0IGFsdENoYWlucyA9IFtdO1xuICAgIGZvciAobGV0IGFsdENoYWluSnNvbiBvZiBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEFsdENoYWluc1wiKSBhcyBhbnkpIGFsdENoYWlucy5wdXNoKG5ldyBNb25lcm9BbHRDaGFpbihhbHRDaGFpbkpzb24pKTtcbiAgICByZXR1cm4gYWx0Q2hhaW5zO1xuICB9XG4gIFxuICBhc3luYyBnZXRBbHRCbG9ja0hhc2hlcygpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRBbHRCbG9ja0hhc2hlc1wiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RG93bmxvYWRMaW1pdCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXREb3dubG9hZExpbWl0XCIpO1xuICB9XG4gIFxuICBhc3luYyBzZXREb3dubG9hZExpbWl0KGxpbWl0KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uU2V0RG93bmxvYWRMaW1pdFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyByZXNldERvd25sb2FkTGltaXQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uUmVzZXREb3dubG9hZExpbWl0XCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRVcGxvYWRMaW1pdCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRVcGxvYWRMaW1pdFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0VXBsb2FkTGltaXQobGltaXQpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TZXRVcGxvYWRMaW1pdFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyByZXNldFVwbG9hZExpbWl0KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblJlc2V0VXBsb2FkTGltaXRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBlZXJzKCkge1xuICAgIGxldCBwZWVycyA9IFtdO1xuICAgIGZvciAobGV0IHBlZXJKc29uIG9mIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0UGVlcnNcIikgYXMgYW55KSBwZWVycy5wdXNoKG5ldyBNb25lcm9QZWVyKHBlZXJKc29uKSk7XG4gICAgcmV0dXJuIHBlZXJzO1xuICB9XG4gIFxuICBhc3luYyBnZXRLbm93blBlZXJzKCkge1xuICAgIGxldCBwZWVycyA9IFtdO1xuICAgIGZvciAobGV0IHBlZXJKc29uIG9mIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0S25vd25QZWVyc1wiKSBhcyBhbnkpIHBlZXJzLnB1c2gobmV3IE1vbmVyb1BlZXIocGVlckpzb24pKTtcbiAgICByZXR1cm4gcGVlcnM7XG4gIH1cbiAgXG4gIGFzeW5jIHNldE91dGdvaW5nUGVlckxpbWl0KGxpbWl0KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uU2V0SW5jb21pbmdQZWVyTGltaXRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0SW5jb21pbmdQZWVyTGltaXQobGltaXQpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TZXRJbmNvbWluZ1BlZXJMaW1pdFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRQZWVyQmFucygpIHtcbiAgICBsZXQgYmFucyA9IFtdO1xuICAgIGZvciAobGV0IGJhbkpzb24gb2YgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRQZWVyQmFuc1wiKSBhcyBhbnkpIGJhbnMucHVzaChuZXcgTW9uZXJvQmFuKGJhbkpzb24pKTtcbiAgICByZXR1cm4gYmFucztcbiAgfVxuXG4gIGFzeW5jIHNldFBlZXJCYW5zKGJhbnMpIHtcbiAgICBsZXQgYmFuc0pzb24gPSBbXTtcbiAgICBmb3IgKGxldCBiYW4gb2YgYmFucykgYmFuc0pzb24ucHVzaChiYW4udG9Kc29uKCkpO1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblNldFBlZXJCYW5zXCIsIFtiYW5zSnNvbl0pO1xuICB9XG4gIFxuICBhc3luYyBzdGFydE1pbmluZyhhZGRyZXNzLCBudW1UaHJlYWRzLCBpc0JhY2tncm91bmQsIGlnbm9yZUJhdHRlcnkpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TdGFydE1pbmluZ1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBzdG9wTWluaW5nKCkge1xuICAgIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uU3RvcE1pbmluZ1wiKVxuICB9XG4gIFxuICBhc3luYyBnZXRNaW5pbmdTdGF0dXMoKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9NaW5pbmdTdGF0dXMoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRNaW5pbmdTdGF0dXNcIikpO1xuICB9XG4gIFxuICBhc3luYyBzdWJtaXRCbG9ja3MoYmxvY2tCbG9icykge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuXG4gIGFzeW5jIHBydW5lQmxvY2tjaGFpbihjaGVjaykge1xuICAgIHJldHVybiBuZXcgTW9uZXJvUHJ1bmVSZXN1bHQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25QcnVuZUJsb2NrY2hhaW5cIikpO1xuICB9XG4gIFxuICBhc3luYyBjaGVja0ZvclVwZGF0ZSgpOiBQcm9taXNlPE1vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBkb3dubG9hZFVwZGF0ZShwYXRoKTogUHJvbWlzZTxNb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgc3RvcCgpIHtcbiAgICB3aGlsZSAodGhpcy53cmFwcGVkTGlzdGVuZXJzLmxlbmd0aCkgYXdhaXQgdGhpcy5yZW1vdmVMaXN0ZW5lcih0aGlzLndyYXBwZWRMaXN0ZW5lcnNbMF0uZ2V0TGlzdGVuZXIoKSk7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uU3RvcFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgd2FpdEZvck5leHRCbG9ja0hlYWRlcigpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uV2FpdEZvck5leHRCbG9ja0hlYWRlclwiKSk7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIEhFTFBFUlMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICAvLyBUT0RPOiBkdXBsaWNhdGVkIHdpdGggTW9uZXJvV2FsbGV0RnVsbFByb3h5XG4gIHByb3RlY3RlZCBhc3luYyBpbnZva2VXb3JrZXIoZm5OYW1lOiBzdHJpbmcsIGFyZ3M/OiBhbnkpIHtcbiAgICByZXR1cm4gTGlicmFyeVV0aWxzLmludm9rZVdvcmtlcih0aGlzLmRhZW1vbklkLCBmbk5hbWUsIGFyZ3MpO1xuICB9XG59XG5cbi8qKlxuICogUG9sbHMgYSBNb25lcm8gZGFlbW9uIGZvciB1cGRhdGVzIGFuZCBub3RpZmllcyBsaXN0ZW5lcnMgYXMgdGhleSBvY2N1ci5cbiAqIFxuICogQHByaXZhdGVcbiAqL1xuY2xhc3MgRGFlbW9uUG9sbGVyIHtcblxuICBwcm90ZWN0ZWQgZGFlbW9uOiBNb25lcm9EYWVtb25ScGM7XG4gIHByb3RlY3RlZCBsb29wZXI6IFRhc2tMb29wZXI7XG4gIHByb3RlY3RlZCBpc1BvbGxpbmc6IGJvb2xlYW47XG4gIHByb3RlY3RlZCBsYXN0SGVhZGVyOiBNb25lcm9CbG9ja0hlYWRlcjtcblxuICBjb25zdHJ1Y3RvcihkYWVtb24pIHtcbiAgICBsZXQgdGhhdCA9IHRoaXM7XG4gICAgdGhpcy5kYWVtb24gPSBkYWVtb247XG4gICAgdGhpcy5sb29wZXIgPSBuZXcgVGFza0xvb3Blcihhc3luYyBmdW5jdGlvbigpIHsgYXdhaXQgdGhhdC5wb2xsKCk7IH0pO1xuICB9XG4gIFxuICBzZXRJc1BvbGxpbmcoaXNQb2xsaW5nOiBib29sZWFuKSB7XG4gICAgdGhpcy5pc1BvbGxpbmcgPSBpc1BvbGxpbmc7XG4gICAgaWYgKGlzUG9sbGluZykgdGhpcy5sb29wZXIuc3RhcnQodGhpcy5kYWVtb24uZ2V0UG9sbEludGVydmFsKCkpO1xuICAgIGVsc2UgdGhpcy5sb29wZXIuc3RvcCgpO1xuICB9XG4gIFxuICBhc3luYyBwb2xsKCkge1xuICAgIHRyeSB7XG4gICAgICBcbiAgICAgIC8vIGdldCBsYXRlc3QgYmxvY2sgaGVhZGVyXG4gICAgICBsZXQgaGVhZGVyID0gYXdhaXQgdGhpcy5kYWVtb24uZ2V0TGFzdEJsb2NrSGVhZGVyKCk7XG4gICAgICBcbiAgICAgIC8vIHNhdmUgZmlyc3QgaGVhZGVyIGZvciBjb21wYXJpc29uXG4gICAgICBpZiAoIXRoaXMubGFzdEhlYWRlcikge1xuICAgICAgICB0aGlzLmxhc3RIZWFkZXIgPSBhd2FpdCB0aGlzLmRhZW1vbi5nZXRMYXN0QmxvY2tIZWFkZXIoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBjb21wYXJlIGhlYWRlciB0byBsYXN0XG4gICAgICBpZiAoaGVhZGVyLmdldEhhc2goKSAhPT0gdGhpcy5sYXN0SGVhZGVyLmdldEhhc2goKSkge1xuICAgICAgICB0aGlzLmxhc3RIZWFkZXIgPSBoZWFkZXI7XG4gICAgICAgIGF3YWl0IHRoaXMuYW5ub3VuY2VCbG9ja0hlYWRlcihoZWFkZXIpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBiYWNrZ3JvdW5kIHBvbGwgZGFlbW9uIGhlYWRlclwiKTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICB9XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgYW5ub3VuY2VCbG9ja0hlYWRlcihoZWFkZXI6IE1vbmVyb0Jsb2NrSGVhZGVyKSB7XG4gICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgYXdhaXQgdGhpcy5kYWVtb24uZ2V0TGlzdGVuZXJzKCkpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGxpc3RlbmVyLm9uQmxvY2tIZWFkZXIoaGVhZGVyKTsgLy8gbm90aWZ5IGxpc3RlbmVyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGNhbGxpbmcgbGlzdGVuZXIgb24gYmxvY2sgaGVhZGVyXCIsIGVycik7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogSW50ZXJuYWwgbGlzdGVuZXIgdG8gYnJpZGdlIG5vdGlmaWNhdGlvbnMgdG8gZXh0ZXJuYWwgbGlzdGVuZXJzLlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBEYWVtb25Xb3JrZXJMaXN0ZW5lciB7XG5cbiAgcHJvdGVjdGVkIGlkOiBhbnk7XG4gIHByb3RlY3RlZCBsaXN0ZW5lcjogYW55O1xuXG4gIGNvbnN0cnVjdG9yKGxpc3RlbmVyKSB7XG4gICAgdGhpcy5pZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICB0aGlzLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIH1cbiAgXG4gIGdldElkKCkge1xuICAgIHJldHVybiB0aGlzLmlkO1xuICB9XG4gIFxuICBnZXRMaXN0ZW5lcigpIHtcbiAgICByZXR1cm4gdGhpcy5saXN0ZW5lcjtcbiAgfVxuICBcbiAgYXN5bmMgb25CbG9ja0hlYWRlcihoZWFkZXJKc29uKSB7XG4gICAgdGhpcy5saXN0ZW5lci5vbkJsb2NrSGVhZGVyKG5ldyBNb25lcm9CbG9ja0hlYWRlcihoZWFkZXJKc29uKSk7XG4gIH1cbn1cblxuZXhw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