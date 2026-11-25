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
    for (let tx of await this.getTxs(txHashes, prune)) {
      hexes.push(tx.getPrunedHex() ? tx.getPrunedHex() : tx.getFullHex()); // tx may be pruned regardless of configuration
    }
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
    feeEstimate.setQuantizationMask(BigInt(resp.result.quantization_mask));
    if (resp.result.fees !== undefined) {
      let fees = [];
      for (let i = 0; i < resp.result.fees.length; i++) fees.push(BigInt(resp.result.fees[i]));
      feeEstimate.setFees(fees);
    }
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
    if (this.config.proxyToWorker) return this.proxyDaemon.submitBlocks(blockBlobs);
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
    let timeout;
    try {
      return await new Promise(function (resolve, reject) {

        // fail if process does not start within the timeout
        if (config.cmdTimeoutMs > 0) timeout = setTimeout(() => reject(new Error("Failed to start monerod within " + config.cmdTimeoutMs + " ms" + (output ? ":\n\n" + output : ""))), config.cmdTimeoutMs);

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
            try {

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
            } catch (err) {
              reject(err);
            }
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
      await _GenUtils.default.killProcess(childProcess, "SIGKILL"); // do not leave the process running
      throw new _MoneroError.default(err.message);
    } finally {
      clearTimeout(timeout);
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
      if (key === "blockhashing_blob") template.setBlockHashingBlob(val);else
      if (key === "blocktemplate_blob") template.setBlockTemplateBlob(val);else
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
      if (key === "nettype") {
        info.setIsRegtest(val === "fakechain");
        _GenUtils.default.safeSet(info, info.getNetworkType, info.setNetworkType, val === "fakechain" ? _MoneroNetworkType.default.MAINNET : _MoneroNetworkType.default.parse(val));
      } else
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
      if (key === "nonzero_unlock_time") result.setIsNonzeroUnlockTime(val);else
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
    config = Object.assign({}, config.toJson(), { proxyToWorker: false });
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
    return this.invokeWorker("daemonSubmitBlocks", Array.from(arguments));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX1Rhc2tMb29wZXIiLCJfTW9uZXJvQWx0Q2hhaW4iLCJfTW9uZXJvQmFuIiwiX01vbmVyb0Jsb2NrIiwiX01vbmVyb0Jsb2NrSGVhZGVyIiwiX01vbmVyb0Jsb2NrVGVtcGxhdGUiLCJfTW9uZXJvQ29ubmVjdGlvblNwYW4iLCJfTW9uZXJvRGFlbW9uIiwiX01vbmVyb0RhZW1vbkNvbmZpZyIsIl9Nb25lcm9EYWVtb25JbmZvIiwiX01vbmVyb0RhZW1vbkxpc3RlbmVyIiwiX01vbmVyb0RhZW1vblN5bmNJbmZvIiwiX01vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0IiwiX01vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0IiwiX01vbmVyb0ZlZUVzdGltYXRlIiwiX01vbmVyb0Vycm9yIiwiX01vbmVyb0hhcmRGb3JrSW5mbyIsIl9Nb25lcm9LZXlJbWFnZSIsIl9Nb25lcm9NaW5lclR4U3VtIiwiX01vbmVyb01pbmluZ1N0YXR1cyIsIl9Nb25lcm9OZXR3b3JrVHlwZSIsIl9Nb25lcm9PdXRwdXQiLCJfTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkiLCJfTW9uZXJvUGVlciIsIl9Nb25lcm9QcnVuZVJlc3VsdCIsIl9Nb25lcm9ScGNDb25uZWN0aW9uIiwiX01vbmVyb1N1Ym1pdFR4UmVzdWx0IiwiX01vbmVyb1R4IiwiX01vbmVyb1R4UG9vbFN0YXRzIiwiX01vbmVyb1V0aWxzIiwiX01vbmVyb1ZlcnNpb24iLCJNb25lcm9EYWVtb25ScGMiLCJNb25lcm9EYWVtb24iLCJNQVhfUkVRX1NJWkUiLCJERUZBVUxUX0lEIiwiTlVNX0hFQURFUlNfUEVSX1JFUSIsIkRFRkFVTFRfUE9MTF9QRVJJT0QiLCJjb25zdHJ1Y3RvciIsImNvbmZpZyIsInByb3h5RGFlbW9uIiwicHJveHlUb1dvcmtlciIsImxpc3RlbmVycyIsImNhY2hlZEhlYWRlcnMiLCJnZXRQcm9jZXNzIiwicHJvY2VzcyIsInN0b3BQcm9jZXNzIiwiZm9yY2UiLCJ1bmRlZmluZWQiLCJNb25lcm9FcnJvciIsImxpc3RlbmVyc0NvcHkiLCJHZW5VdGlscyIsImNvcHlBcnJheSIsImdldExpc3RlbmVycyIsImxpc3RlbmVyIiwicmVtb3ZlTGlzdGVuZXIiLCJraWxsUHJvY2VzcyIsImFkZExpc3RlbmVyIiwiYXNzZXJ0IiwiTW9uZXJvRGFlbW9uTGlzdGVuZXIiLCJwdXNoIiwicmVmcmVzaExpc3RlbmluZyIsImlkeCIsImluZGV4T2YiLCJzcGxpY2UiLCJnZXRScGNDb25uZWN0aW9uIiwiZ2V0U2VydmVyIiwiaXNDb25uZWN0ZWQiLCJnZXRWZXJzaW9uIiwiZSIsInJlc3AiLCJzZW5kSnNvblJlcXVlc3QiLCJjaGVja1Jlc3BvbnNlU3RhdHVzIiwicmVzdWx0IiwiTW9uZXJvVmVyc2lvbiIsInZlcnNpb24iLCJyZWxlYXNlIiwiaXNUcnVzdGVkIiwic2VuZFBhdGhSZXF1ZXN0IiwidW50cnVzdGVkIiwiZ2V0SGVpZ2h0IiwiY291bnQiLCJnZXRCbG9ja0hhc2giLCJoZWlnaHQiLCJnZXRCbG9ja1RlbXBsYXRlIiwid2FsbGV0QWRkcmVzcyIsInJlc2VydmVTaXplIiwid2FsbGV0X2FkZHJlc3MiLCJyZXNlcnZlX3NpemUiLCJjb252ZXJ0UnBjQmxvY2tUZW1wbGF0ZSIsImdldExhc3RCbG9ja0hlYWRlciIsImNvbnZlcnRScGNCbG9ja0hlYWRlciIsImJsb2NrX2hlYWRlciIsImdldEJsb2NrSGVhZGVyQnlIYXNoIiwiYmxvY2tIYXNoIiwiaGFzaCIsImdldEJsb2NrSGVhZGVyQnlIZWlnaHQiLCJnZXRCbG9ja0hlYWRlcnNCeVJhbmdlIiwic3RhcnRIZWlnaHQiLCJlbmRIZWlnaHQiLCJzdGFydF9oZWlnaHQiLCJlbmRfaGVpZ2h0IiwiaGVhZGVycyIsInJwY0hlYWRlciIsImdldEJsb2NrQnlIYXNoIiwiY29udmVydFJwY0Jsb2NrIiwiZ2V0QmxvY2tCeUhlaWdodCIsImdldEJsb2Nrc0J5SGVpZ2h0IiwiaGVpZ2h0cyIsInJlc3BCaW4iLCJzZW5kQmluYXJ5UmVxdWVzdCIsInJwY0Jsb2NrcyIsIk1vbmVyb1V0aWxzIiwiYmluYXJ5QmxvY2tzVG9Kc29uIiwiZXF1YWwiLCJ0eHMiLCJsZW5ndGgiLCJibG9ja3MiLCJibG9ja0lkeCIsImJsb2NrIiwic2V0SGVpZ2h0IiwidHhJZHgiLCJ0eCIsIk1vbmVyb1R4Iiwic2V0SGFzaCIsInR4X2hhc2hlcyIsInNldElzQ29uZmlybWVkIiwic2V0SW5UeFBvb2wiLCJzZXRJc01pbmVyVHgiLCJzZXRSZWxheSIsInNldElzUmVsYXllZCIsInNldElzRmFpbGVkIiwic2V0SXNEb3VibGVTcGVuZFNlZW4iLCJjb252ZXJ0UnBjVHgiLCJzZXRUeHMiLCJnZXRCbG9jayIsIm1lcmdlIiwiZ2V0VHhzIiwic2V0QmxvY2siLCJnZXRCbG9ja3NCeVJhbmdlIiwiZ2V0QmxvY2tzQnlSYW5nZUNodW5rZWQiLCJtYXhDaHVua1NpemUiLCJsYXN0SGVpZ2h0IiwiZ2V0TWF4QmxvY2tzIiwidHhIYXNoZXMiLCJwcnVuZSIsIkFycmF5IiwiaXNBcnJheSIsInR4c19oYXNoZXMiLCJkZWNvZGVfYXNfanNvbiIsIm1lc3NhZ2UiLCJnZXRUeEhleGVzIiwiaGV4ZXMiLCJnZXRQcnVuZWRIZXgiLCJnZXRGdWxsSGV4IiwiZ2V0TWluZXJUeFN1bSIsIm51bUJsb2NrcyIsInR4U3VtIiwiTW9uZXJvTWluZXJUeFN1bSIsInNldEVtaXNzaW9uU3VtIiwiQmlnSW50IiwiZW1pc3Npb25fYW1vdW50Iiwic2V0RmVlU3VtIiwiZmVlX2Ftb3VudCIsImdldEZlZUVzdGltYXRlIiwiZ3JhY2VCbG9ja3MiLCJncmFjZV9ibG9ja3MiLCJmZWVFc3RpbWF0ZSIsIk1vbmVyb0ZlZUVzdGltYXRlIiwic2V0RmVlIiwiZmVlIiwic2V0UXVhbnRpemF0aW9uTWFzayIsInF1YW50aXphdGlvbl9tYXNrIiwiZmVlcyIsImkiLCJzZXRGZWVzIiwic3VibWl0VHhIZXgiLCJ0eEhleCIsImRvTm90UmVsYXkiLCJ0eF9hc19oZXgiLCJkb19ub3RfcmVsYXkiLCJjb252ZXJ0UnBjU3VibWl0VHhSZXN1bHQiLCJzZXRJc0dvb2QiLCJyZWxheVR4c0J5SGFzaCIsInR4aWRzIiwiZ2V0VHhQb29sIiwidHJhbnNhY3Rpb25zIiwicnBjVHgiLCJzZXROdW1Db25maXJtYXRpb25zIiwiZ2V0VHhQb29sSGFzaGVzIiwiZ2V0VHhQb29sU3RhdHMiLCJjb252ZXJ0UnBjVHhQb29sU3RhdHMiLCJwb29sX3N0YXRzIiwiZmx1c2hUeFBvb2wiLCJoYXNoZXMiLCJsaXN0aWZ5IiwiZ2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzIiwia2V5SW1hZ2VzIiwia2V5X2ltYWdlcyIsInNwZW50X3N0YXR1cyIsImdldE91dHB1dEhpc3RvZ3JhbSIsImFtb3VudHMiLCJtaW5Db3VudCIsIm1heENvdW50IiwiaXNVbmxvY2tlZCIsInJlY2VudEN1dG9mZiIsIm1pbl9jb3VudCIsIm1heF9jb3VudCIsInVubG9ja2VkIiwicmVjZW50X2N1dG9mZiIsImVudHJpZXMiLCJoaXN0b2dyYW0iLCJycGNFbnRyeSIsImNvbnZlcnRScGNPdXRwdXRIaXN0b2dyYW1FbnRyeSIsImdldE91dHB1dERpc3RyaWJ1dGlvbiIsImN1bXVsYXRpdmUiLCJnZXRJbmZvIiwiY29udmVydFJwY0luZm8iLCJnZXRTeW5jSW5mbyIsImNvbnZlcnRScGNTeW5jSW5mbyIsImdldEhhcmRGb3JrSW5mbyIsImNvbnZlcnRScGNIYXJkRm9ya0luZm8iLCJnZXRBbHRDaGFpbnMiLCJjaGFpbnMiLCJycGNDaGFpbiIsImNvbnZlcnRScGNBbHRDaGFpbiIsImdldEFsdEJsb2NrSGFzaGVzIiwiYmxrc19oYXNoZXMiLCJnZXREb3dubG9hZExpbWl0IiwiZ2V0QmFuZHdpZHRoTGltaXRzIiwic2V0RG93bmxvYWRMaW1pdCIsImxpbWl0IiwicmVzZXREb3dubG9hZExpbWl0IiwiaXNJbnQiLCJzZXRCYW5kd2lkdGhMaW1pdHMiLCJnZXRVcGxvYWRMaW1pdCIsInNldFVwbG9hZExpbWl0IiwicmVzZXRVcGxvYWRMaW1pdCIsImdldFBlZXJzIiwicGVlcnMiLCJjb25uZWN0aW9ucyIsInJwY0Nvbm5lY3Rpb24iLCJjb252ZXJ0UnBjQ29ubmVjdGlvbiIsImdldEtub3duUGVlcnMiLCJncmF5X2xpc3QiLCJycGNQZWVyIiwicGVlciIsImNvbnZlcnRScGNQZWVyIiwic2V0SXNPbmxpbmUiLCJ3aGl0ZV9saXN0Iiwic2V0T3V0Z29pbmdQZWVyTGltaXQiLCJvdXRfcGVlcnMiLCJzZXRJbmNvbWluZ1BlZXJMaW1pdCIsImluX3BlZXJzIiwiZ2V0UGVlckJhbnMiLCJiYW5zIiwicnBjQmFuIiwiYmFuIiwiTW9uZXJvQmFuIiwic2V0SG9zdCIsImhvc3QiLCJzZXRJcCIsImlwIiwic2V0U2Vjb25kcyIsInNlY29uZHMiLCJzZXRQZWVyQmFucyIsInJwY0JhbnMiLCJjb252ZXJ0VG9ScGNCYW4iLCJzdGFydE1pbmluZyIsImFkZHJlc3MiLCJudW1UaHJlYWRzIiwiaXNCYWNrZ3JvdW5kIiwiaWdub3JlQmF0dGVyeSIsIm1pbmVyX2FkZHJlc3MiLCJ0aHJlYWRzX2NvdW50IiwiZG9fYmFja2dyb3VuZF9taW5pbmciLCJpZ25vcmVfYmF0dGVyeSIsInN0b3BNaW5pbmciLCJnZXRNaW5pbmdTdGF0dXMiLCJjb252ZXJ0UnBjTWluaW5nU3RhdHVzIiwic3VibWl0QmxvY2tzIiwiYmxvY2tCbG9icyIsInBydW5lQmxvY2tjaGFpbiIsImNoZWNrIiwiTW9uZXJvUHJ1bmVSZXN1bHQiLCJzZXRJc1BydW5lZCIsInBydW5lZCIsInNldFBydW5pbmdTZWVkIiwicHJ1bmluZ19zZWVkIiwiY2hlY2tGb3JVcGRhdGUiLCJjb21tYW5kIiwiY29udmVydFJwY1VwZGF0ZUNoZWNrUmVzdWx0IiwiZG93bmxvYWRVcGRhdGUiLCJwYXRoIiwiY29udmVydFJwY1VwZGF0ZURvd25sb2FkUmVzdWx0Iiwic3RvcCIsIndhaXRGb3JOZXh0QmxvY2tIZWFkZXIiLCJ0aGF0IiwiUHJvbWlzZSIsInJlc29sdmUiLCJvbkJsb2NrSGVhZGVyIiwiaGVhZGVyIiwiZ2V0UG9sbEludGVydmFsIiwicG9sbEludGVydmFsIiwiZ2V0VHgiLCJ0eEhhc2giLCJnZXRUeEhleCIsImdldEtleUltYWdlU3BlbnRTdGF0dXMiLCJrZXlJbWFnZSIsInNldFBlZXJCYW4iLCJzdWJtaXRCbG9jayIsImJsb2NrQmxvYiIsInBvbGxMaXN0ZW5lciIsIkRhZW1vblBvbGxlciIsInNldElzUG9sbGluZyIsImxpbWl0X2Rvd24iLCJsaW1pdF91cCIsImRvd25MaW1pdCIsInVwTGltaXQiLCJtYXhIZWlnaHQiLCJtYXhSZXFTaXplIiwicmVxU2l6ZSIsImdldEJsb2NrSGVhZGVyQnlIZWlnaHRDYWNoZWQiLCJnZXRTaXplIiwiY2FjaGVkSGVhZGVyIiwiTWF0aCIsIm1pbiIsImNvbm5lY3RUb0RhZW1vblJwYyIsInVyaU9yQ29uZmlnIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsIm5vcm1hbGl6ZUNvbmZpZyIsImNtZCIsInN0YXJ0TW9uZXJvZFByb2Nlc3MiLCJNb25lcm9EYWVtb25ScGNQcm94eSIsImNvbm5lY3QiLCJjaGlsZFByb2Nlc3MiLCJzcGF3biIsInNsaWNlIiwiZW52IiwiTEFORyIsInN0ZG91dCIsInNldEVuY29kaW5nIiwic3RkZXJyIiwidXJpIiwib3V0cHV0IiwidGltZW91dCIsInJlamVjdCIsImNtZFRpbWVvdXRNcyIsInNldFRpbWVvdXQiLCJFcnJvciIsIm9uIiwiZGF0YSIsImxpbmUiLCJ0b1N0cmluZyIsIkxpYnJhcnlVdGlscyIsImxvZyIsInVyaUxpbmVDb250YWlucyIsInVyaUxpbmVDb250YWluc0lkeCIsInN1YnN0cmluZyIsImxhc3RJbmRleE9mIiwidW5mb3JtYXR0ZWRMaW5lIiwicmVwbGFjZSIsInRyaW0iLCJwb3J0Iiwic3NsSWR4Iiwic3NsRW5hYmxlZCIsInRvTG93ZXJDYXNlIiwidXNlclBhc3NJZHgiLCJ1c2VyUGFzcyIsImNvcHkiLCJzZXRTZXJ2ZXIiLCJyZWplY3RVbmF1dGhvcml6ZWQiLCJnZXRSZWplY3RVbmF1dGhvcml6ZWQiLCJzZXRQcm94eVRvV29ya2VyIiwiZGFlbW9uIiwiaXNSZXNvbHZlZCIsImVyciIsImdldExvZ0xldmVsIiwiY29uc29sZSIsImVycm9yIiwiY29kZSIsIm9yaWdpbiIsImNsZWFyVGltZW91dCIsIk1vbmVyb0RhZW1vbkNvbmZpZyIsInNlcnZlciIsIk1vbmVyb1JwY0Nvbm5lY3Rpb24iLCJERUZBVUxUX0NPTkZJRyIsInN0YXR1cyIsIk1vbmVyb0Jsb2NrSGVhZGVyIiwia2V5IiwiT2JqZWN0Iiwia2V5cyIsInZhbCIsInNhZmVTZXQiLCJzZXRTaXplIiwiZ2V0RGVwdGgiLCJzZXREZXB0aCIsInNldERpZmZpY3VsdHkiLCJyZWNvbmNpbGUiLCJnZXREaWZmaWN1bHR5IiwicHJlZml4ZWRIZXhUb0JJIiwic2V0Q3VtdWxhdGl2ZURpZmZpY3VsdHkiLCJnZXRDdW11bGF0aXZlRGlmZmljdWx0eSIsImdldEhhc2giLCJnZXRNYWpvclZlcnNpb24iLCJzZXRNYWpvclZlcnNpb24iLCJnZXRNaW5vclZlcnNpb24iLCJzZXRNaW5vclZlcnNpb24iLCJnZXROb25jZSIsInNldE5vbmNlIiwiZ2V0TnVtVHhzIiwic2V0TnVtVHhzIiwiZ2V0T3JwaGFuU3RhdHVzIiwic2V0T3JwaGFuU3RhdHVzIiwiZ2V0UHJldkhhc2giLCJzZXRQcmV2SGFzaCIsImdldFJld2FyZCIsInNldFJld2FyZCIsImdldFRpbWVzdGFtcCIsInNldFRpbWVzdGFtcCIsImdldFdlaWdodCIsInNldFdlaWdodCIsImdldExvbmdUZXJtV2VpZ2h0Iiwic2V0TG9uZ1Rlcm1XZWlnaHQiLCJnZXRQb3dIYXNoIiwic2V0UG93SGFzaCIsInNldE1pbmVyVHhIYXNoIiwicnBjQmxvY2siLCJNb25lcm9CbG9jayIsInNldEhleCIsImJsb2IiLCJzZXRUeEhhc2hlcyIsInJwY01pbmVyVHgiLCJqc29uIiwiSlNPTiIsInBhcnNlIiwibWluZXJfdHgiLCJtaW5lclR4Iiwic2V0TWluZXJUeCIsImdldExhc3RSZWxheWVkVGltZXN0YW1wIiwic2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAiLCJnZXRSZWNlaXZlZFRpbWVzdGFtcCIsInNldFJlY2VpdmVkVGltZXN0YW1wIiwiZ2V0TnVtQ29uZmlybWF0aW9ucyIsImdldElzQ29uZmlybWVkIiwiZ2V0SW5UeFBvb2wiLCJnZXRJc0RvdWJsZVNwZW5kU2VlbiIsInNldFZlcnNpb24iLCJnZXRFeHRyYSIsInNldEV4dHJhIiwiVWludDhBcnJheSIsImdlbiIsInNldElucHV0cyIsIm1hcCIsInJwY1ZpbiIsImNvbnZlcnRScGNPdXRwdXQiLCJzZXRPdXRwdXRzIiwicnBjT3V0cHV0IiwiZ2V0UmN0U2lnbmF0dXJlcyIsInNldFJjdFNpZ25hdHVyZXMiLCJ0eG5GZWUiLCJnZXRGZWUiLCJnZXRSY3RTaWdQcnVuYWJsZSIsInNldFJjdFNpZ1BydW5hYmxlIiwiZ2V0VW5sb2NrVGltZSIsInNldFVubG9ja1RpbWUiLCJzZXRGdWxsSGV4IiwiZ2V0SXNSZWxheWVkIiwiZ2V0T3V0cHV0SW5kaWNlcyIsInNldE91dHB1dEluZGljZXMiLCJnZXRSZWxheSIsImdldElzS2VwdEJ5QmxvY2siLCJzZXRJc0tlcHRCeUJsb2NrIiwiZ2V0U2lnbmF0dXJlcyIsInNldFNpZ25hdHVyZXMiLCJnZXRJc0ZhaWxlZCIsImdldExhc3RGYWlsZWRIZWlnaHQiLCJzZXRMYXN0RmFpbGVkSGVpZ2h0IiwiZ2V0TGFzdEZhaWxlZEhhc2giLCJzZXRMYXN0RmFpbGVkSGFzaCIsImdldE1heFVzZWRCbG9ja0hlaWdodCIsInNldE1heFVzZWRCbG9ja0hlaWdodCIsImdldE1heFVzZWRCbG9ja0hhc2giLCJzZXRNYXhVc2VkQmxvY2tIYXNoIiwiZ2V0UHJ1bmFibGVIYXNoIiwic2V0UHJ1bmFibGVIYXNoIiwiZ2V0UHJ1bmFibGVIZXgiLCJzZXRQcnVuYWJsZUhleCIsInNldFBydW5lZEhleCIsImdldE91dHB1dHMiLCJzZXRJbmRleCIsImFzX2pzb24iLCJ0eF9qc29uIiwiTW9uZXJvT3V0cHV0Iiwic2V0VHgiLCJnZXRBbW91bnQiLCJzZXRBbW91bnQiLCJhbW91bnQiLCJnZXRLZXlJbWFnZSIsInNldEtleUltYWdlIiwiTW9uZXJvS2V5SW1hZ2UiLCJrX2ltYWdlIiwiZ2V0UmluZ091dHB1dEluZGljZXMiLCJzZXRSaW5nT3V0cHV0SW5kaWNlcyIsImtleV9vZmZzZXRzIiwicHViS2V5IiwidGFnZ2VkX2tleSIsImdldFN0ZWFsdGhQdWJsaWNLZXkiLCJzZXRTdGVhbHRoUHVibGljS2V5IiwicnBjVGVtcGxhdGUiLCJ0ZW1wbGF0ZSIsIk1vbmVyb0Jsb2NrVGVtcGxhdGUiLCJzZXRCbG9ja0hhc2hpbmdCbG9iIiwic2V0QmxvY2tUZW1wbGF0ZUJsb2IiLCJzZXRFeHBlY3RlZFJld2FyZCIsInNldFJlc2VydmVkT2Zmc2V0Iiwic2V0U2VlZEhlaWdodCIsInNldFNlZWRIYXNoIiwic2V0TmV4dFNlZWRIYXNoIiwiZ2V0TmV4dFNlZWRIYXNoIiwicnBjSW5mbyIsImluZm8iLCJNb25lcm9EYWVtb25JbmZvIiwic2V0TnVtQWx0QmxvY2tzIiwic2V0QmxvY2tTaXplTGltaXQiLCJzZXRCbG9ja1NpemVNZWRpYW4iLCJzZXRCbG9ja1dlaWdodExpbWl0Iiwic2V0QmxvY2tXZWlnaHRNZWRpYW4iLCJzZXRCb290c3RyYXBEYWVtb25BZGRyZXNzIiwic2V0RnJlZVNwYWNlIiwic2V0RGF0YWJhc2VTaXplIiwic2V0TnVtT2ZmbGluZVBlZXJzIiwic2V0SGVpZ2h0V2l0aG91dEJvb3RzdHJhcCIsInNldE51bUluY29taW5nQ29ubmVjdGlvbnMiLCJzZXRJc09mZmxpbmUiLCJzZXROdW1PdXRnb2luZ0Nvbm5lY3Rpb25zIiwic2V0TnVtUnBjQ29ubmVjdGlvbnMiLCJzZXRTdGFydFRpbWVzdGFtcCIsInNldEFkanVzdGVkVGltZXN0YW1wIiwic2V0VGFyZ2V0Iiwic2V0VGFyZ2V0SGVpZ2h0Iiwic2V0VG9wQmxvY2tIYXNoIiwic2V0TnVtVHhzUG9vbCIsInNldFdhc0Jvb3RzdHJhcEV2ZXJVc2VkIiwic2V0TnVtT25saW5lUGVlcnMiLCJzZXRVcGRhdGVBdmFpbGFibGUiLCJzZXRJc1JlZ3Rlc3QiLCJnZXROZXR3b3JrVHlwZSIsInNldE5ldHdvcmtUeXBlIiwiTW9uZXJvTmV0d29ya1R5cGUiLCJNQUlOTkVUIiwiVEVTVE5FVCIsIlNUQUdFTkVUIiwic2V0Q3JlZGl0cyIsImdldFRvcEJsb2NrSGFzaCIsInNldElzQnVzeVN5bmNpbmciLCJzZXRJc1N5bmNocm9uaXplZCIsInNldElzUmVzdHJpY3RlZCIsInJwY1N5bmNJbmZvIiwic3luY0luZm8iLCJNb25lcm9EYWVtb25TeW5jSW5mbyIsInNldFBlZXJzIiwicnBjQ29ubmVjdGlvbnMiLCJzZXRTcGFucyIsInJwY1NwYW5zIiwicnBjU3BhbiIsImdldFNwYW5zIiwiY29udmVydFJwY0Nvbm5lY3Rpb25TcGFuIiwic2V0TmV4dE5lZWRlZFBydW5pbmdTZWVkIiwib3ZlcnZpZXciLCJycGNIYXJkRm9ya0luZm8iLCJNb25lcm9IYXJkRm9ya0luZm8iLCJzZXRFYXJsaWVzdEhlaWdodCIsInNldElzRW5hYmxlZCIsInNldFN0YXRlIiwic2V0VGhyZXNob2xkIiwic2V0TnVtVm90ZXMiLCJzZXRWb3RpbmciLCJzZXRXaW5kb3ciLCJycGNDb25uZWN0aW9uU3BhbiIsInNwYW4iLCJNb25lcm9Db25uZWN0aW9uU3BhbiIsInNldENvbm5lY3Rpb25JZCIsInNldE51bUJsb2NrcyIsInNldFJhdGUiLCJzZXRSZW1vdGVBZGRyZXNzIiwic2V0U3BlZWQiLCJzZXRTdGFydEhlaWdodCIsImVudHJ5IiwiTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkiLCJzZXROdW1JbnN0YW5jZXMiLCJzZXROdW1VbmxvY2tlZEluc3RhbmNlcyIsInNldE51bVJlY2VudEluc3RhbmNlcyIsInJwY1Jlc3VsdCIsIk1vbmVyb1N1Ym1pdFR4UmVzdWx0Iiwic2V0SXNGZWVUb29Mb3ciLCJzZXRIYXNJbnZhbGlkSW5wdXQiLCJzZXRIYXNJbnZhbGlkT3V0cHV0Iiwic2V0SGFzVG9vRmV3T3V0cHV0cyIsInNldElzTWl4aW5Ub29Mb3ciLCJzZXRJc092ZXJzcGVuZCIsInNldFJlYXNvbiIsInNldElzVG9vQmlnIiwic2V0U2FuaXR5Q2hlY2tGYWlsZWQiLCJzZXRJc1R4RXh0cmFUb29CaWciLCJzZXRJc05vbnplcm9VbmxvY2tUaW1lIiwicnBjU3RhdHMiLCJzdGF0cyIsIk1vbmVyb1R4UG9vbFN0YXRzIiwic2V0Qnl0ZXNNYXgiLCJzZXRCeXRlc01lZCIsInNldEJ5dGVzTWluIiwic2V0Qnl0ZXNUb3RhbCIsInNldEhpc3RvOThwYyIsInNldE51bTEwbSIsInNldE51bURvdWJsZVNwZW5kcyIsInNldE51bUZhaWxpbmciLCJzZXROdW1Ob3RSZWxheWVkIiwic2V0T2xkZXN0VGltZXN0YW1wIiwic2V0RmVlVG90YWwiLCJzZXRIaXN0byIsIk1hcCIsImVsZW0iLCJnZXRIaXN0byIsInNldCIsImJ5dGVzIiwiZ2V0SGlzdG85OHBjIiwiY2hhaW4iLCJNb25lcm9BbHRDaGFpbiIsInNldExlbmd0aCIsInNldEJsb2NrSGFzaGVzIiwic2V0TWFpbkNoYWluUGFyZW50QmxvY2tIYXNoIiwiTW9uZXJvUGVlciIsInNldElkIiwic2V0TGFzdFNlZW5UaW1lc3RhbXAiLCJzZXRQb3J0Iiwic2V0UnBjUG9ydCIsInNldFJwY0NyZWRpdHNQZXJIYXNoIiwic2V0QWRkcmVzcyIsInNldEF2Z0Rvd25sb2FkIiwic2V0QXZnVXBsb2FkIiwic2V0Q3VycmVudERvd25sb2FkIiwic2V0Q3VycmVudFVwbG9hZCIsInNldElzSW5jb21pbmciLCJzZXRMaXZlVGltZSIsInNldElzTG9jYWxJcCIsInNldElzTG9jYWxIb3N0IiwicGFyc2VJbnQiLCJzZXROdW1SZWNlaXZlcyIsInNldFJlY2VpdmVJZGxlVGltZSIsInNldE51bVNlbmRzIiwic2V0U2VuZElkbGVUaW1lIiwic2V0TnVtU3VwcG9ydEZsYWdzIiwic2V0VHlwZSIsImdldEhvc3QiLCJnZXRJcCIsImdldElzQmFubmVkIiwiZ2V0U2Vjb25kcyIsInJwY1N0YXR1cyIsIk1vbmVyb01pbmluZ1N0YXR1cyIsInNldElzQWN0aXZlIiwiYWN0aXZlIiwic3BlZWQiLCJzZXROdW1UaHJlYWRzIiwic2V0SXNCYWNrZ3JvdW5kIiwiaXNfYmFja2dyb3VuZF9taW5pbmdfZW5hYmxlZCIsIk1vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0Iiwic2V0QXV0b1VyaSIsInNldElzVXBkYXRlQXZhaWxhYmxlIiwic2V0VXNlclVyaSIsImdldEF1dG9VcmkiLCJnZXRVc2VyVXJpIiwiTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQiLCJzZXREb3dubG9hZFBhdGgiLCJnZXREb3dubG9hZFBhdGgiLCJoZXgiLCJkYWVtb25JZCIsIndvcmtlciIsIndyYXBwZWRMaXN0ZW5lcnMiLCJnZXRVVUlEIiwiYXNzaWduIiwidG9Kc29uIiwiaW52b2tlV29ya2VyIiwiZ2V0V29ya2VyIiwid3JhcHBlZExpc3RlbmVyIiwiRGFlbW9uV29ya2VyTGlzdGVuZXIiLCJsaXN0ZW5lcklkIiwiZ2V0SWQiLCJhZGRXb3JrZXJDYWxsYmFjayIsImdldExpc3RlbmVyIiwicmVtb3ZlV29ya2VyQ2FsbGJhY2siLCJ2ZXJzaW9uSnNvbiIsIm51bWJlciIsImlzUmVsZWFzZSIsImZyb20iLCJhcmd1bWVudHMiLCJibG9ja0hlYWRlcnNKc29uIiwiYmxvY2tIZWFkZXJKc29uIiwiRGVzZXJpYWxpemF0aW9uVHlwZSIsIlRYIiwiZ2V0QmxvY2tzQnlIYXNoIiwiYmxvY2tIYXNoZXMiLCJibG9ja3NKc29uIiwiYmxvY2tKc29uIiwiZ2V0QmxvY2tIYXNoZXMiLCJnZXRUeFBvb2xCYWNrbG9nIiwib3V0cHV0cyIsImVudHJ5SnNvbiIsImFsdENoYWlucyIsImFsdENoYWluSnNvbiIsInBlZXJKc29uIiwiYmFuSnNvbiIsImJhbnNKc29uIiwiZm5OYW1lIiwiYXJncyIsImxvb3BlciIsIlRhc2tMb29wZXIiLCJwb2xsIiwiaXNQb2xsaW5nIiwic3RhcnQiLCJsYXN0SGVhZGVyIiwiYW5ub3VuY2VCbG9ja0hlYWRlciIsImlkIiwiaGVhZGVySnNvbiIsIl9kZWZhdWx0IiwiZXhwb3J0cyIsImRlZmF1bHQiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy9kYWVtb24vTW9uZXJvRGFlbW9uUnBjLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IEdlblV0aWxzIGZyb20gXCIuLi9jb21tb24vR2VuVXRpbHNcIjtcbmltcG9ydCBMaWJyYXJ5VXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9MaWJyYXJ5VXRpbHNcIjtcbmltcG9ydCBUYXNrTG9vcGVyIGZyb20gXCIuLi9jb21tb24vVGFza0xvb3BlclwiO1xuaW1wb3J0IE1vbmVyb0FsdENoYWluIGZyb20gXCIuL21vZGVsL01vbmVyb0FsdENoYWluXCI7XG5pbXBvcnQgTW9uZXJvQmFuIGZyb20gXCIuL21vZGVsL01vbmVyb0JhblwiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrIGZyb20gXCIuL21vZGVsL01vbmVyb0Jsb2NrXCI7XG5pbXBvcnQgTW9uZXJvQmxvY2tIZWFkZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQmxvY2tIZWFkZXJcIjtcbmltcG9ydCBNb25lcm9CbG9ja1RlbXBsYXRlIGZyb20gXCIuL21vZGVsL01vbmVyb0Jsb2NrVGVtcGxhdGVcIjtcbmltcG9ydCBNb25lcm9Db25uZWN0aW9uU3BhbiBmcm9tIFwiLi9tb2RlbC9Nb25lcm9Db25uZWN0aW9uU3BhblwiO1xuaW1wb3J0IE1vbmVyb0RhZW1vbiBmcm9tIFwiLi9Nb25lcm9EYWVtb25cIjtcbmltcG9ydCBNb25lcm9EYWVtb25Db25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvRGFlbW9uQ29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uSW5mbyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9EYWVtb25JbmZvXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uTGlzdGVuZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvRGFlbW9uTGlzdGVuZXJcIjtcbmltcG9ydCBNb25lcm9EYWVtb25TeW5jSW5mbyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9EYWVtb25TeW5jSW5mb1wiO1xuaW1wb3J0IE1vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9GZWVFc3RpbWF0ZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9GZWVFc3RpbWF0ZVwiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuLi9jb21tb24vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBNb25lcm9IYXJkRm9ya0luZm8gZnJvbSBcIi4vbW9kZWwvTW9uZXJvSGFyZEZvcmtJbmZvXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2UgZnJvbSBcIi4vbW9kZWwvTW9uZXJvS2V5SW1hZ2VcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzIGZyb20gXCIuL21vZGVsL01vbmVyb0tleUltYWdlU3BlbnRTdGF0dXNcIjtcbmltcG9ydCBNb25lcm9NaW5lclR4U3VtIGZyb20gXCIuL21vZGVsL01vbmVyb01pbmVyVHhTdW1cIjtcbmltcG9ydCBNb25lcm9NaW5pbmdTdGF0dXMgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTWluaW5nU3RhdHVzXCI7XG5pbXBvcnQgTW9uZXJvTmV0d29ya1R5cGUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTmV0d29ya1R5cGVcIjtcbmltcG9ydCBNb25lcm9PdXRwdXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0XCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnlcIjtcbmltcG9ydCBNb25lcm9QZWVyIGZyb20gXCIuL21vZGVsL01vbmVyb1BlZXJcIjtcbmltcG9ydCBNb25lcm9QcnVuZVJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9QcnVuZVJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb1JwY0Nvbm5lY3Rpb24gZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9ScGNDb25uZWN0aW9uXCI7XG5pbXBvcnQgTW9uZXJvU3VibWl0VHhSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvU3VibWl0VHhSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9UeCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFwiO1xuaW1wb3J0IE1vbmVyb1R4UG9vbFN0YXRzIGZyb20gXCIuL21vZGVsL01vbmVyb1R4UG9vbFN0YXRzXCI7XG5pbXBvcnQgTW9uZXJvVXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9VdGlsc1wiO1xuaW1wb3J0IE1vbmVyb1ZlcnNpb24gZnJvbSBcIi4vbW9kZWwvTW9uZXJvVmVyc2lvblwiO1xuaW1wb3J0IHsgQ2hpbGRQcm9jZXNzIH0gZnJvbSBcImNoaWxkX3Byb2Nlc3NcIjtcblxuLyoqXG4gKiBDb3B5cmlnaHQgKGMpIHdvb2RzZXJcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbi8qKlxuICogSW1wbGVtZW50cyBhIE1vbmVyb0RhZW1vbiBhcyBhIGNsaWVudCBvZiBtb25lcm9kLlxuICovXG5jbGFzcyBNb25lcm9EYWVtb25ScGMgZXh0ZW5kcyBNb25lcm9EYWVtb24ge1xuXG4gIC8vIHN0YXRpYyB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIHN0YXRpYyByZWFkb25seSBNQVhfUkVRX1NJWkUgPSBcIjMwMDAwMDBcIjtcbiAgcHJvdGVjdGVkIHN0YXRpYyByZWFkb25seSBERUZBVUxUX0lEID0gXCIwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwXCI7IC8vIHVuaW5pdGlhbGl6ZWQgdHggb3IgYmxvY2sgaGFzaCBmcm9tIGRhZW1vbiBycGNcbiAgcHJvdGVjdGVkIHN0YXRpYyByZWFkb25seSBOVU1fSEVBREVSU19QRVJfUkVRID0gNzUwOyAvLyBudW1iZXIgb2YgaGVhZGVycyB0byBmZXRjaCBhbmQgY2FjaGUgcGVyIHJlcXVlc3RcbiAgcHJvdGVjdGVkIHN0YXRpYyByZWFkb25seSBERUZBVUxUX1BPTExfUEVSSU9EID0gMjAwMDA7IC8vIGRlZmF1bHQgaW50ZXJ2YWwgYmV0d2VlbiBwb2xsaW5nIHRoZSBkYWVtb24gaW4gbXNcblxuICAvLyBpbnN0YW5jZSB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIGNvbmZpZzogUGFydGlhbDxNb25lcm9EYWVtb25Db25maWc+O1xuICBwcm90ZWN0ZWQgbGlzdGVuZXJzOiBNb25lcm9EYWVtb25MaXN0ZW5lcltdO1xuICBwcm90ZWN0ZWQgY2FjaGVkSGVhZGVyczogYW55O1xuICBwcm90ZWN0ZWQgcHJvY2VzczogYW55O1xuICBwcm90ZWN0ZWQgcG9sbExpc3RlbmVyOiBhbnk7XG4gIHByb3RlY3RlZCBwcm94eURhZW1vbjogYW55O1xuIFxuICAvKiogQHByaXZhdGUgKi9cbiAgY29uc3RydWN0b3IoY29uZmlnOiBNb25lcm9EYWVtb25Db25maWcsIHByb3h5RGFlbW9uOiBNb25lcm9EYWVtb25ScGNQcm94eSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy5wcm94eURhZW1vbiA9IHByb3h5RGFlbW9uO1xuICAgIGlmIChjb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuO1xuICAgIHRoaXMubGlzdGVuZXJzID0gW107ICAgICAgLy8gYmxvY2sgbGlzdGVuZXJzXG4gICAgdGhpcy5jYWNoZWRIZWFkZXJzID0ge307ICAvLyBjYWNoZWQgaGVhZGVycyBmb3IgZmV0Y2hpbmcgYmxvY2tzIGluIGJvdW5kIGNodW5rc1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBpbnRlcm5hbCBwcm9jZXNzIHJ1bm5pbmcgbW9uZXJvZC5cbiAgICogXG4gICAqIEByZXR1cm4ge0NoaWxkUHJvY2Vzc30gdGhlIG5vZGUgcHJvY2VzcyBydW5uaW5nIG1vbmVyb2QsIHVuZGVmaW5lZCBpZiBub3QgY3JlYXRlZCBmcm9tIG5ldyBwcm9jZXNzXG4gICAqL1xuICBnZXRQcm9jZXNzKCk6IENoaWxkUHJvY2VzcyB7XG4gICAgcmV0dXJuIHRoaXMucHJvY2VzcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN0b3AgdGhlIGludGVybmFsIHByb2Nlc3MgcnVubmluZyBtb25lcm9kLCBpZiBhcHBsaWNhYmxlLlxuICAgKiBcbiAgICogQHBhcmFtIHtib29sZWFufSBbZm9yY2VdIHNwZWNpZmllcyBpZiB0aGUgcHJvY2VzcyBzaG91bGQgYmUgZGVzdHJveWVkIGZvcmNpYmx5IChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlciB8IHVuZGVmaW5lZD59IHRoZSBleGl0IGNvZGUgZnJvbSBzdG9wcGluZyB0aGUgcHJvY2Vzc1xuICAgKi9cbiAgYXN5bmMgc3RvcFByb2Nlc3MoZm9yY2UgPSBmYWxzZSk6IFByb21pc2U8bnVtYmVyIHwgdW5kZWZpbmVkPiB7XG4gICAgaWYgKHRoaXMucHJvY2VzcyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNb25lcm9EYWVtb25ScGMgaW5zdGFuY2Ugbm90IGNyZWF0ZWQgZnJvbSBuZXcgcHJvY2Vzc1wiKTtcbiAgICBsZXQgbGlzdGVuZXJzQ29weSA9IEdlblV0aWxzLmNvcHlBcnJheShhd2FpdCB0aGlzLmdldExpc3RlbmVycygpKTtcbiAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiBsaXN0ZW5lcnNDb3B5KSBhd2FpdCB0aGlzLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICByZXR1cm4gR2VuVXRpbHMua2lsbFByb2Nlc3ModGhpcy5wcm9jZXNzLCBmb3JjZSA/IFwiU0lHS0lMTFwiIDogdW5kZWZpbmVkKTtcbiAgfVxuICBcbiAgYXN5bmMgYWRkTGlzdGVuZXIobGlzdGVuZXI6IE1vbmVyb0RhZW1vbkxpc3RlbmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBhc3NlcnQobGlzdGVuZXIgaW5zdGFuY2VvZiBNb25lcm9EYWVtb25MaXN0ZW5lciwgXCJMaXN0ZW5lciBtdXN0IGJlIGluc3RhbmNlIG9mIE1vbmVyb0RhZW1vbkxpc3RlbmVyXCIpO1xuICAgIHRoaXMubGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuICAgIHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICB9XG4gIFxuICBhc3luYyByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcjogTW9uZXJvRGFlbW9uTGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24ucmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIGFzc2VydChsaXN0ZW5lciBpbnN0YW5jZW9mIE1vbmVyb0RhZW1vbkxpc3RlbmVyLCBcIkxpc3RlbmVyIG11c3QgYmUgaW5zdGFuY2Ugb2YgTW9uZXJvRGFlbW9uTGlzdGVuZXJcIik7XG4gICAgbGV0IGlkeCA9IHRoaXMubGlzdGVuZXJzLmluZGV4T2YobGlzdGVuZXIpO1xuICAgIGlmIChpZHggPiAtMSkgdGhpcy5saXN0ZW5lcnMuc3BsaWNlKGlkeCwgMSk7XG4gICAgZWxzZSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJMaXN0ZW5lciBpcyBub3QgcmVnaXN0ZXJlZCB3aXRoIGRhZW1vblwiKTtcbiAgICB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgfVxuICBcbiAgZ2V0TGlzdGVuZXJzKCk6IE1vbmVyb0RhZW1vbkxpc3RlbmVyW10ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRMaXN0ZW5lcnMoKTtcbiAgICByZXR1cm4gdGhpcy5saXN0ZW5lcnM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGRhZW1vbidzIFJQQyBjb25uZWN0aW9uLlxuICAgKiBcbiAgICogQHJldHVybiB7TW9uZXJvUnBjQ29ubmVjdGlvbn0gdGhlIGRhZW1vbidzIHJwYyBjb25uZWN0aW9uXG4gICAqL1xuICBhc3luYyBnZXRScGNDb25uZWN0aW9uKCkge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRScGNDb25uZWN0aW9uKCk7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmdldFNlcnZlcigpO1xuICB9XG4gIFxuICBhc3luYyBpc0Nvbm5lY3RlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uaXNDb25uZWN0ZWQoKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5nZXRWZXJzaW9uKCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGdldFZlcnNpb24oKTogUHJvbWlzZTxNb25lcm9WZXJzaW9uPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFZlcnNpb24oKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF92ZXJzaW9uXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1ZlcnNpb24ocmVzcC5yZXN1bHQudmVyc2lvbiwgcmVzcC5yZXN1bHQucmVsZWFzZSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzVHJ1c3RlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uaXNUcnVzdGVkKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJnZXRfaGVpZ2h0XCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIHJldHVybiAhcmVzcC51bnRydXN0ZWQ7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRIZWlnaHQoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9ibG9ja19jb3VudFwiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LmNvdW50O1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0hhc2goaGVpZ2h0OiBudW1iZXIpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRCbG9ja0hhc2goaGVpZ2h0KTtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcIm9uX2dldF9ibG9ja19oYXNoXCIsIFtoZWlnaHRdKSkucmVzdWx0OyAgLy8gVE9ETyBtb25lcm8td2FsbGV0LXJwYzogbm8gc3RhdHVzIHJldHVybmVkXG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrVGVtcGxhdGUod2FsbGV0QWRkcmVzczogc3RyaW5nLCByZXNlcnZlU2l6ZT86IG51bWJlcik6IFByb21pc2U8TW9uZXJvQmxvY2tUZW1wbGF0ZT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRCbG9ja1RlbXBsYXRlKHdhbGxldEFkZHJlc3MsIHJlc2VydmVTaXplKTtcbiAgICBhc3NlcnQod2FsbGV0QWRkcmVzcyAmJiB0eXBlb2Ygd2FsbGV0QWRkcmVzcyA9PT0gXCJzdHJpbmdcIiwgXCJNdXN0IHNwZWNpZnkgd2FsbGV0IGFkZHJlc3MgdG8gYmUgbWluZWQgdG9cIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmxvY2tfdGVtcGxhdGVcIiwge3dhbGxldF9hZGRyZXNzOiB3YWxsZXRBZGRyZXNzLCByZXNlcnZlX3NpemU6IHJlc2VydmVTaXplfSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Jsb2NrVGVtcGxhdGUocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBnZXRMYXN0QmxvY2tIZWFkZXIoKTogUHJvbWlzZTxNb25lcm9CbG9ja0hlYWRlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRMYXN0QmxvY2tIZWFkZXIoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9sYXN0X2Jsb2NrX2hlYWRlclwiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQmxvY2tIZWFkZXIocmVzcC5yZXN1bHQuYmxvY2tfaGVhZGVyKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tIZWFkZXJCeUhhc2goYmxvY2tIYXNoOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0Jsb2NrSGVhZGVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2NrSGVhZGVyQnlIYXNoKGJsb2NrSGFzaCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmxvY2tfaGVhZGVyX2J5X2hhc2hcIiwge2hhc2g6IGJsb2NrSGFzaH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNCbG9ja0hlYWRlcihyZXNwLnJlc3VsdC5ibG9ja19oZWFkZXIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0hlYWRlckJ5SGVpZ2h0KGhlaWdodDogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9CbG9ja0hlYWRlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRCbG9ja0hlYWRlckJ5SGVpZ2h0KGhlaWdodCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmxvY2tfaGVhZGVyX2J5X2hlaWdodFwiLCB7aGVpZ2h0OiBoZWlnaHR9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQmxvY2tIZWFkZXIocmVzcC5yZXN1bHQuYmxvY2tfaGVhZGVyKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tIZWFkZXJzQnlSYW5nZShzdGFydEhlaWdodD86IG51bWJlciwgZW5kSGVpZ2h0PzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9CbG9ja0hlYWRlcltdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2NrSGVhZGVyc0J5UmFuZ2Uoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCk7XG4gICAgXG4gICAgLy8gZmV0Y2ggYmxvY2sgaGVhZGVyc1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2Jsb2NrX2hlYWRlcnNfcmFuZ2VcIiwge1xuICAgICAgc3RhcnRfaGVpZ2h0OiBzdGFydEhlaWdodCxcbiAgICAgIGVuZF9oZWlnaHQ6IGVuZEhlaWdodFxuICAgIH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICBcbiAgICAvLyBidWlsZCBoZWFkZXJzXG4gICAgbGV0IGhlYWRlcnMgPSBbXTtcbiAgICBmb3IgKGxldCBycGNIZWFkZXIgb2YgcmVzcC5yZXN1bHQuaGVhZGVycykge1xuICAgICAgaGVhZGVycy5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQmxvY2tIZWFkZXIocnBjSGVhZGVyKSk7XG4gICAgfVxuICAgIHJldHVybiBoZWFkZXJzO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0J5SGFzaChibG9ja0hhc2g6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQmxvY2s+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tCeUhhc2goYmxvY2tIYXNoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9ibG9ja1wiLCB7aGFzaDogYmxvY2tIYXNofSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Jsb2NrKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tCeUhlaWdodChoZWlnaHQ6IG51bWJlcik6IFByb21pc2U8TW9uZXJvQmxvY2s+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tCeUhlaWdodChoZWlnaHQpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2Jsb2NrXCIsIHtoZWlnaHQ6IGhlaWdodH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNCbG9jayhyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2Nrc0J5SGVpZ2h0KGhlaWdodHM6IG51bWJlcltdKTogUHJvbWlzZTxNb25lcm9CbG9ja1tdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2Nrc0J5SGVpZ2h0KGhlaWdodHMpO1xuICAgIFxuICAgIC8vIGZldGNoIGJsb2NrcyBpbiBiaW5hcnlcbiAgICBsZXQgcmVzcEJpbiA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRCaW5hcnlSZXF1ZXN0KFwiZ2V0X2Jsb2Nrc19ieV9oZWlnaHQuYmluXCIsIHtoZWlnaHRzOiBoZWlnaHRzfSk7XG4gICAgXG4gICAgLy8gY29udmVydCBiaW5hcnkgYmxvY2tzIHRvIGpzb25cbiAgICBsZXQgcnBjQmxvY2tzID0gYXdhaXQgTW9uZXJvVXRpbHMuYmluYXJ5QmxvY2tzVG9Kc29uKHJlc3BCaW4pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJwY0Jsb2Nrcyk7XG4gICAgXG4gICAgLy8gYnVpbGQgYmxvY2tzIHdpdGggdHJhbnNhY3Rpb25zXG4gICAgYXNzZXJ0LmVxdWFsKHJwY0Jsb2Nrcy50eHMubGVuZ3RoLCBycGNCbG9ja3MuYmxvY2tzLmxlbmd0aCk7ICAgIFxuICAgIGxldCBibG9ja3MgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0lkeCA9IDA7IGJsb2NrSWR4IDwgcnBjQmxvY2tzLmJsb2Nrcy5sZW5ndGg7IGJsb2NrSWR4KyspIHtcbiAgICAgIFxuICAgICAgLy8gYnVpbGQgYmxvY2tcbiAgICAgIGxldCBibG9jayA9IE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQmxvY2socnBjQmxvY2tzLmJsb2Nrc1tibG9ja0lkeF0pO1xuICAgICAgYmxvY2suc2V0SGVpZ2h0KGhlaWdodHNbYmxvY2tJZHhdKTtcbiAgICAgIGJsb2Nrcy5wdXNoKGJsb2NrKTtcbiAgICAgIFxuICAgICAgLy8gYnVpbGQgdHJhbnNhY3Rpb25zXG4gICAgICBsZXQgdHhzID0gW107XG4gICAgICBmb3IgKGxldCB0eElkeCA9IDA7IHR4SWR4IDwgcnBjQmxvY2tzLnR4c1tibG9ja0lkeF0ubGVuZ3RoOyB0eElkeCsrKSB7XG4gICAgICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeCgpO1xuICAgICAgICB0eHMucHVzaCh0eCk7XG4gICAgICAgIHR4LnNldEhhc2gocnBjQmxvY2tzLmJsb2Nrc1tibG9ja0lkeF0udHhfaGFzaGVzW3R4SWR4XSk7XG4gICAgICAgIHR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgICAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgICAgdHguc2V0SXNEb3VibGVTcGVuZFNlZW4oZmFsc2UpO1xuICAgICAgICBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1R4KHJwY0Jsb2Nrcy50eHNbYmxvY2tJZHhdW3R4SWR4XSwgdHgpO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBtZXJnZSBpbnRvIG9uZSBibG9ja1xuICAgICAgYmxvY2suc2V0VHhzKFtdKTtcbiAgICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgICBpZiAodHguZ2V0QmxvY2soKSkgYmxvY2subWVyZ2UodHguZ2V0QmxvY2soKSk7XG4gICAgICAgIGVsc2UgYmxvY2suZ2V0VHhzKCkucHVzaCh0eC5zZXRCbG9jayhibG9jaykpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gYmxvY2tzO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja3NCeVJhbmdlKHN0YXJ0SGVpZ2h0PzogbnVtYmVyLCBlbmRIZWlnaHQ/OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb0Jsb2NrW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tzQnlSYW5nZShzdGFydEhlaWdodCwgZW5kSGVpZ2h0KTtcbiAgICBpZiAoc3RhcnRIZWlnaHQgPT09IHVuZGVmaW5lZCkgc3RhcnRIZWlnaHQgPSAwO1xuICAgIGlmIChlbmRIZWlnaHQgPT09IHVuZGVmaW5lZCkgZW5kSGVpZ2h0ID0gYXdhaXQgdGhpcy5nZXRIZWlnaHQoKSAtIDE7XG4gICAgbGV0IGhlaWdodHMgPSBbXTtcbiAgICBmb3IgKGxldCBoZWlnaHQgPSBzdGFydEhlaWdodDsgaGVpZ2h0IDw9IGVuZEhlaWdodDsgaGVpZ2h0KyspIGhlaWdodHMucHVzaChoZWlnaHQpO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmdldEJsb2Nrc0J5SGVpZ2h0KGhlaWdodHMpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja3NCeVJhbmdlQ2h1bmtlZChzdGFydEhlaWdodD86IG51bWJlciwgZW5kSGVpZ2h0PzogbnVtYmVyLCBtYXhDaHVua1NpemU/OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb0Jsb2NrW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tzQnlSYW5nZUNodW5rZWQoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgbWF4Q2h1bmtTaXplKTtcbiAgICBpZiAoc3RhcnRIZWlnaHQgPT09IHVuZGVmaW5lZCkgc3RhcnRIZWlnaHQgPSAwO1xuICAgIGlmIChlbmRIZWlnaHQgPT09IHVuZGVmaW5lZCkgZW5kSGVpZ2h0ID0gYXdhaXQgdGhpcy5nZXRIZWlnaHQoKSAtIDE7XG4gICAgbGV0IGxhc3RIZWlnaHQgPSBzdGFydEhlaWdodCAtIDE7XG4gICAgbGV0IGJsb2NrcyA9IFtdO1xuICAgIHdoaWxlIChsYXN0SGVpZ2h0IDwgZW5kSGVpZ2h0KSB7XG4gICAgICBmb3IgKGxldCBibG9jayBvZiBhd2FpdCB0aGlzLmdldE1heEJsb2NrcyhsYXN0SGVpZ2h0ICsgMSwgZW5kSGVpZ2h0LCBtYXhDaHVua1NpemUpKSB7XG4gICAgICAgIGJsb2Nrcy5wdXNoKGJsb2NrKTtcbiAgICAgIH1cbiAgICAgIGxhc3RIZWlnaHQgPSBibG9ja3NbYmxvY2tzLmxlbmd0aCAtIDFdLmdldEhlaWdodCgpO1xuICAgIH1cbiAgICByZXR1cm4gYmxvY2tzO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeHModHhIYXNoZXM6IHN0cmluZ1tdLCBwcnVuZSA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9UeFtdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFR4cyh0eEhhc2hlcywgcHJ1bmUpO1xuICAgICAgICBcbiAgICAvLyB2YWxpZGF0ZSBpbnB1dFxuICAgIGFzc2VydChBcnJheS5pc0FycmF5KHR4SGFzaGVzKSAmJiB0eEhhc2hlcy5sZW5ndGggPiAwLCBcIk11c3QgcHJvdmlkZSBhbiBhcnJheSBvZiB0cmFuc2FjdGlvbiBoYXNoZXNcIik7XG4gICAgYXNzZXJ0KHBydW5lID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIHBydW5lID09PSBcImJvb2xlYW5cIiwgXCJQcnVuZSBtdXN0IGJlIGEgYm9vbGVhbiBvciB1bmRlZmluZWRcIik7XG4gICAgICAgIFxuICAgIC8vIGZldGNoIHRyYW5zYWN0aW9uc1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwiZ2V0X3RyYW5zYWN0aW9uc1wiLCB7XG4gICAgICB0eHNfaGFzaGVzOiB0eEhhc2hlcyxcbiAgICAgIGRlY29kZV9hc19qc29uOiB0cnVlLFxuICAgICAgcHJ1bmU6IHBydW5lXG4gICAgfSk7XG4gICAgdHJ5IHtcbiAgICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUubWVzc2FnZS5pbmRleE9mKFwiRmFpbGVkIHRvIHBhcnNlIGhleCByZXByZXNlbnRhdGlvbiBvZiB0cmFuc2FjdGlvbiBoYXNoXCIpID49IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkludmFsaWQgdHJhbnNhY3Rpb24gaGFzaFwiKTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICAgICAgICBcbiAgICAvLyBidWlsZCB0cmFuc2FjdGlvbiBtb2RlbHNcbiAgICBsZXQgdHhzID0gW107XG4gICAgaWYgKHJlc3AudHhzKSB7XG4gICAgICBmb3IgKGxldCB0eElkeCA9IDA7IHR4SWR4IDwgcmVzcC50eHMubGVuZ3RoOyB0eElkeCsrKSB7XG4gICAgICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeCgpO1xuICAgICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgICAgICB0eHMucHVzaChNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1R4KHJlc3AudHhzW3R4SWR4XSwgdHgpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHR4cztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhIZXhlcyh0eEhhc2hlczogc3RyaW5nW10sIHBydW5lID0gZmFsc2UpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFR4SGV4ZXModHhIYXNoZXMsIHBydW5lKTtcbiAgICBsZXQgaGV4ZXMgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiBhd2FpdCB0aGlzLmdldFR4cyh0eEhhc2hlcywgcHJ1bmUpKSB7XG4gICAgICBoZXhlcy5wdXNoKHR4LmdldFBydW5lZEhleCgpID8gdHguZ2V0UHJ1bmVkSGV4KCkgOiB0eC5nZXRGdWxsSGV4KCkpOyAvLyB0eCBtYXkgYmUgcHJ1bmVkIHJlZ2FyZGxlc3Mgb2YgY29uZmlndXJhdGlvblxuICAgIH1cbiAgICByZXR1cm4gaGV4ZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE1pbmVyVHhTdW0oaGVpZ2h0OiBudW1iZXIsIG51bUJsb2NrczogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9NaW5lclR4U3VtPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldE1pbmVyVHhTdW0oaGVpZ2h0LCBudW1CbG9ja3MpO1xuICAgIGlmIChoZWlnaHQgPT09IHVuZGVmaW5lZCkgaGVpZ2h0ID0gMDtcbiAgICBlbHNlIGFzc2VydChoZWlnaHQgPj0gMCwgXCJIZWlnaHQgbXVzdCBiZSBhbiBpbnRlZ2VyID49IDBcIik7XG4gICAgaWYgKG51bUJsb2NrcyA9PT0gdW5kZWZpbmVkKSBudW1CbG9ja3MgPSBhd2FpdCB0aGlzLmdldEhlaWdodCgpO1xuICAgIGVsc2UgYXNzZXJ0KG51bUJsb2NrcyA+PSAwLCBcIkNvdW50IG11c3QgYmUgYW4gaW50ZWdlciA+PSAwXCIpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2NvaW5iYXNlX3R4X3N1bVwiLCB7aGVpZ2h0OiBoZWlnaHQsIGNvdW50OiBudW1CbG9ja3N9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgbGV0IHR4U3VtID0gbmV3IE1vbmVyb01pbmVyVHhTdW0oKTtcbiAgICB0eFN1bS5zZXRFbWlzc2lvblN1bShCaWdJbnQocmVzcC5yZXN1bHQuZW1pc3Npb25fYW1vdW50KSk7XG4gICAgdHhTdW0uc2V0RmVlU3VtKEJpZ0ludChyZXNwLnJlc3VsdC5mZWVfYW1vdW50KSk7XG4gICAgcmV0dXJuIHR4U3VtO1xuICB9XG4gIFxuICBhc3luYyBnZXRGZWVFc3RpbWF0ZShncmFjZUJsb2Nrcz86IG51bWJlcik6IFByb21pc2U8TW9uZXJvRmVlRXN0aW1hdGU+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0RmVlRXN0aW1hdGUoZ3JhY2VCbG9ja3MpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2ZlZV9lc3RpbWF0ZVwiLCB7Z3JhY2VfYmxvY2tzOiBncmFjZUJsb2Nrc30pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICBsZXQgZmVlRXN0aW1hdGUgPSBuZXcgTW9uZXJvRmVlRXN0aW1hdGUoKTtcbiAgICBmZWVFc3RpbWF0ZS5zZXRGZWUoQmlnSW50KHJlc3AucmVzdWx0LmZlZSkpO1xuICAgIGZlZUVzdGltYXRlLnNldFF1YW50aXphdGlvbk1hc2soQmlnSW50KHJlc3AucmVzdWx0LnF1YW50aXphdGlvbl9tYXNrKSk7XG4gICAgaWYgKHJlc3AucmVzdWx0LmZlZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbGV0IGZlZXMgPSBbXTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVzcC5yZXN1bHQuZmVlcy5sZW5ndGg7IGkrKykgZmVlcy5wdXNoKEJpZ0ludChyZXNwLnJlc3VsdC5mZWVzW2ldKSk7XG4gICAgICBmZWVFc3RpbWF0ZS5zZXRGZWVzKGZlZXMpO1xuICAgIH1cbiAgICByZXR1cm4gZmVlRXN0aW1hdGU7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdFR4SGV4KHR4SGV4OiBzdHJpbmcsIGRvTm90UmVsYXk6IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb1N1Ym1pdFR4UmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnN1Ym1pdFR4SGV4KHR4SGV4LCBkb05vdFJlbGF5KTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcInNlbmRfcmF3X3RyYW5zYWN0aW9uXCIsIHt0eF9hc19oZXg6IHR4SGV4LCBkb19ub3RfcmVsYXk6IGRvTm90UmVsYXl9KTtcbiAgICBsZXQgcmVzdWx0ID0gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNTdWJtaXRUeFJlc3VsdChyZXNwKTtcbiAgICBcbiAgICAvLyBzZXQgaXNHb29kIGJhc2VkIG9uIHN0YXR1c1xuICAgIHRyeSB7XG4gICAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTsgXG4gICAgICByZXN1bHQuc2V0SXNHb29kKHRydWUpO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgcmVzdWx0LnNldElzR29vZChmYWxzZSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbGF5VHhzQnlIYXNoKHR4SGFzaGVzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5yZWxheVR4c0J5SGFzaCh0eEhhc2hlcyk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJyZWxheV90eFwiLCB7dHhpZHM6IHR4SGFzaGVzfSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFBvb2woKTogUHJvbWlzZTxNb25lcm9UeFtdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFR4UG9vbCgpO1xuICAgIFxuICAgIC8vIHNlbmQgcnBjIHJlcXVlc3RcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImdldF90cmFuc2FjdGlvbl9wb29sXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIFxuICAgIC8vIGJ1aWxkIHR4c1xuICAgIGxldCB0eHMgPSBbXTtcbiAgICBpZiAocmVzcC50cmFuc2FjdGlvbnMpIHtcbiAgICAgIGZvciAobGV0IHJwY1R4IG9mIHJlc3AudHJhbnNhY3Rpb25zKSB7XG4gICAgICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeCgpO1xuICAgICAgICB0eHMucHVzaCh0eCk7XG4gICAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICAgICAgdHguc2V0SW5UeFBvb2wodHJ1ZSk7XG4gICAgICAgIHR4LnNldE51bUNvbmZpcm1hdGlvbnMoMCk7XG4gICAgICAgIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVHgocnBjVHgsIHR4KTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHR4cztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhQb29sSGFzaGVzKCk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIC8vIGFzeW5jIGdldFR4UG9vbEJhY2tsb2coKTogUHJvbWlzZTxNb25lcm9UeEJhY2tsb2dFbnRyeVtdPiB7XG4gIC8vICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICAvLyB9XG5cbiAgYXN5bmMgZ2V0VHhQb29sU3RhdHMoKTogUHJvbWlzZTxNb25lcm9UeFBvb2xTdGF0cz4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRUeFBvb2xTdGF0cygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwiZ2V0X3RyYW5zYWN0aW9uX3Bvb2xfc3RhdHNcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVHhQb29sU3RhdHMocmVzcC5wb29sX3N0YXRzKTtcbiAgfVxuICBcbiAgYXN5bmMgZmx1c2hUeFBvb2woaGFzaGVzPzogc3RyaW5nIHwgc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZmx1c2hUeFBvb2woaGFzaGVzKTtcbiAgICBpZiAoaGFzaGVzKSBoYXNoZXMgPSBHZW5VdGlscy5saXN0aWZ5KGhhc2hlcyk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJmbHVzaF90eHBvb2xcIiwge3R4aWRzOiBoYXNoZXN9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEtleUltYWdlU3BlbnRTdGF0dXNlcyhrZXlJbWFnZXM6IHN0cmluZ1tdKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzKGtleUltYWdlcyk7XG4gICAgaWYgKGtleUltYWdlcyA9PT0gdW5kZWZpbmVkIHx8IGtleUltYWdlcy5sZW5ndGggPT09IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBrZXkgaW1hZ2VzIHRvIGNoZWNrIHRoZSBzdGF0dXMgb2ZcIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJpc19rZXlfaW1hZ2Vfc3BlbnRcIiwge2tleV9pbWFnZXM6IGtleUltYWdlc30pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIHJldHVybiByZXNwLnNwZW50X3N0YXR1cztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0T3V0cHV0SGlzdG9ncmFtKGFtb3VudHM/OiBiaWdpbnRbXSwgbWluQ291bnQ/OiBudW1iZXIsIG1heENvdW50PzogbnVtYmVyLCBpc1VubG9ja2VkPzogYm9vbGVhbiwgcmVjZW50Q3V0b2ZmPzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeVtdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldE91dHB1dEhpc3RvZ3JhbShhbW91bnRzLCBtaW5Db3VudCwgbWF4Q291bnQsIGlzVW5sb2NrZWQsIHJlY2VudEN1dG9mZik7XG4gICAgXG4gICAgLy8gc2VuZCBycGMgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X291dHB1dF9oaXN0b2dyYW1cIiwge1xuICAgICAgYW1vdW50czogYW1vdW50cyxcbiAgICAgIG1pbl9jb3VudDogbWluQ291bnQsXG4gICAgICBtYXhfY291bnQ6IG1heENvdW50LFxuICAgICAgdW5sb2NrZWQ6IGlzVW5sb2NrZWQsXG4gICAgICByZWNlbnRfY3V0b2ZmOiByZWNlbnRDdXRvZmZcbiAgICB9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgXG4gICAgLy8gYnVpbGQgaGlzdG9ncmFtIGVudHJpZXMgZnJvbSByZXNwb25zZVxuICAgIGxldCBlbnRyaWVzID0gW107XG4gICAgaWYgKCFyZXNwLnJlc3VsdC5oaXN0b2dyYW0pIHJldHVybiBlbnRyaWVzO1xuICAgIGZvciAobGV0IHJwY0VudHJ5IG9mIHJlc3AucmVzdWx0Lmhpc3RvZ3JhbSkge1xuICAgICAgZW50cmllcy5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjT3V0cHV0SGlzdG9ncmFtRW50cnkocnBjRW50cnkpKTtcbiAgICB9XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dERpc3RyaWJ1dGlvbihhbW91bnRzLCBjdW11bGF0aXZlLCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldE91dHB1dERpc3RyaWJ1dGlvbihhbW91bnRzLCBjdW11bGF0aXZlLCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0KTtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQgKHJlc3BvbnNlICdkaXN0cmlidXRpb24nIGZpZWxkIGlzIGJpbmFyeSlcIik7XG4gICAgXG4vLyAgICBsZXQgYW1vdW50U3RycyA9IFtdO1xuLy8gICAgZm9yIChsZXQgYW1vdW50IG9mIGFtb3VudHMpIGFtb3VudFN0cnMucHVzaChhbW91bnQudG9KU1ZhbHVlKCkpO1xuLy8gICAgY29uc29sZS5sb2coYW1vdW50U3Rycyk7XG4vLyAgICBjb25zb2xlLmxvZyhjdW11bGF0aXZlKTtcbi8vICAgIGNvbnNvbGUubG9nKHN0YXJ0SGVpZ2h0KTtcbi8vICAgIGNvbnNvbGUubG9nKGVuZEhlaWdodCk7XG4vLyAgICBcbi8vICAgIC8vIHNlbmQgcnBjIHJlcXVlc3Rcbi8vICAgIGNvbnNvbGUubG9nKFwiKioqKioqKioqKiogU0VORElORyBSRVFVRVNUICoqKioqKioqKioqKipcIik7XG4vLyAgICBpZiAoc3RhcnRIZWlnaHQgPT09IHVuZGVmaW5lZCkgc3RhcnRIZWlnaHQgPSAwO1xuLy8gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfb3V0cHV0X2Rpc3RyaWJ1dGlvblwiLCB7XG4vLyAgICAgIGFtb3VudHM6IGFtb3VudFN0cnMsXG4vLyAgICAgIGN1bXVsYXRpdmU6IGN1bXVsYXRpdmUsXG4vLyAgICAgIGZyb21faGVpZ2h0OiBzdGFydEhlaWdodCxcbi8vICAgICAgdG9faGVpZ2h0OiBlbmRIZWlnaHRcbi8vICAgIH0pO1xuLy8gICAgXG4vLyAgICBjb25zb2xlLmxvZyhcIlJFU1BPTlNFXCIpO1xuLy8gICAgY29uc29sZS5sb2cocmVzcCk7XG4vLyAgICBcbi8vICAgIC8vIGJ1aWxkIGRpc3RyaWJ1dGlvbiBlbnRyaWVzIGZyb20gcmVzcG9uc2Vcbi8vICAgIGxldCBlbnRyaWVzID0gW107XG4vLyAgICBpZiAoIXJlc3AucmVzdWx0LmRpc3RyaWJ1dGlvbnMpIHJldHVybiBlbnRyaWVzOyBcbi8vICAgIGZvciAobGV0IHJwY0VudHJ5IG9mIHJlc3AucmVzdWx0LmRpc3RyaWJ1dGlvbnMpIHtcbi8vICAgICAgbGV0IGVudHJ5ID0gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNPdXRwdXREaXN0cmlidXRpb25FbnRyeShycGNFbnRyeSk7XG4vLyAgICAgIGVudHJpZXMucHVzaChlbnRyeSk7XG4vLyAgICB9XG4vLyAgICByZXR1cm4gZW50cmllcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SW5mbygpOiBQcm9taXNlPE1vbmVyb0RhZW1vbkluZm8+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0SW5mbygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2luZm9cIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0luZm8ocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBnZXRTeW5jSW5mbygpOiBQcm9taXNlPE1vbmVyb0RhZW1vblN5bmNJbmZvPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFN5bmNJbmZvKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzeW5jX2luZm9cIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1N5bmNJbmZvKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGFyZEZvcmtJbmZvKCk6IFByb21pc2U8TW9uZXJvSGFyZEZvcmtJbmZvPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEhhcmRGb3JrSW5mbygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiaGFyZF9mb3JrX2luZm9cIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0hhcmRGb3JrSW5mbyhyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFsdENoYWlucygpOiBQcm9taXNlPE1vbmVyb0FsdENoYWluW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QWx0Q2hhaW5zKCk7XG4gICAgXG4vLyAgICAvLyBtb2NrZWQgcmVzcG9uc2UgZm9yIHRlc3Rcbi8vICAgIGxldCByZXNwID0ge1xuLy8gICAgICAgIHN0YXR1czogXCJPS1wiLFxuLy8gICAgICAgIGNoYWluczogW1xuLy8gICAgICAgICAge1xuLy8gICAgICAgICAgICBibG9ja19oYXNoOiBcIjY5N2NmMDNjODlhOWIxMThmN2JkZjExYjFiM2E2YTAyOGQ3YjM2MTdkMmQwZWQ5MTMyMmM1NzA5YWNmNzU2MjVcIixcbi8vICAgICAgICAgICAgZGlmZmljdWx0eTogMTQxMTQ3Mjk2MzgzMDAyODAsXG4vLyAgICAgICAgICAgIGhlaWdodDogMTU2MjA2Mixcbi8vICAgICAgICAgICAgbGVuZ3RoOiAyXG4vLyAgICAgICAgICB9XG4vLyAgICAgICAgXVxuLy8gICAgfVxuICAgIFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FsdGVybmF0ZV9jaGFpbnNcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIGxldCBjaGFpbnMgPSBbXTtcbiAgICBpZiAoIXJlc3AucmVzdWx0LmNoYWlucykgcmV0dXJuIGNoYWlucztcbiAgICBmb3IgKGxldCBycGNDaGFpbiBvZiByZXNwLnJlc3VsdC5jaGFpbnMpIGNoYWlucy5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQWx0Q2hhaW4ocnBjQ2hhaW4pKTtcbiAgICByZXR1cm4gY2hhaW5zO1xuICB9XG4gIFxuICBhc3luYyBnZXRBbHRCbG9ja0hhc2hlcygpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEFsdEJsb2NrSGFzaGVzKCk7XG4gICAgXG4vLyAgICAvLyBtb2NrZWQgcmVzcG9uc2UgZm9yIHRlc3Rcbi8vICAgIGxldCByZXNwID0ge1xuLy8gICAgICAgIHN0YXR1czogXCJPS1wiLFxuLy8gICAgICAgIHVudHJ1c3RlZDogZmFsc2UsXG4vLyAgICAgICAgYmxrc19oYXNoZXM6IFtcIjljMjI3N2M1NDcwMjM0YmU4YjMyMzgyY2RmODA5NGExMDNhYmE0ZmNkNWU4NzVhNmZjMTU5ZGMyZWMwMGUwMTFcIixcIjYzN2MwZTBmMDU1OGUyODQ0OTNmMzhhNWZjY2EzNjE1ZGI1OTQ1OGQ5MGQzYTVlZmYwYTE4ZmY1OWI4M2Y0NmZcIixcIjZmM2FkYzE3NGEyZTgwODI4MTllYmI5NjVjOTZhMDk1ZTNlOGI2MzkyOWFkOWJlMmQ3MDVhZDljMDg2YTZiMWNcIixcIjY5N2NmMDNjODlhOWIxMThmN2JkZjExYjFiM2E2YTAyOGQ3YjM2MTdkMmQwZWQ5MTMyMmM1NzA5YWNmNzU2MjVcIl1cbi8vICAgIH1cbiAgICBcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImdldF9hbHRfYmxvY2tzX2hhc2hlc1wiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICBpZiAoIXJlc3AuYmxrc19oYXNoZXMpIHJldHVybiBbXTtcbiAgICByZXR1cm4gcmVzcC5ibGtzX2hhc2hlcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RG93bmxvYWRMaW1pdCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXREb3dubG9hZExpbWl0KCk7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldEJhbmR3aWR0aExpbWl0cygpKVswXTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0RG93bmxvYWRMaW1pdChsaW1pdDogbnVtYmVyKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc2V0RG93bmxvYWRMaW1pdChsaW1pdCk7XG4gICAgaWYgKGxpbWl0ID09IC0xKSByZXR1cm4gYXdhaXQgdGhpcy5yZXNldERvd25sb2FkTGltaXQoKTtcbiAgICBpZiAoIShHZW5VdGlscy5pc0ludChsaW1pdCkgJiYgbGltaXQgPiAwKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiRG93bmxvYWQgbGltaXQgbXVzdCBiZSBhbiBpbnRlZ2VyIGdyZWF0ZXIgdGhhbiAwXCIpO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5zZXRCYW5kd2lkdGhMaW1pdHMobGltaXQsIDApKVswXTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzZXREb3dubG9hZExpbWl0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnJlc2V0RG93bmxvYWRMaW1pdCgpO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5zZXRCYW5kd2lkdGhMaW1pdHMoLTEsIDApKVswXTtcbiAgfVxuXG4gIGFzeW5jIGdldFVwbG9hZExpbWl0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFVwbG9hZExpbWl0KCk7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldEJhbmR3aWR0aExpbWl0cygpKVsxXTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0VXBsb2FkTGltaXQobGltaXQ6IG51bWJlcik6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnNldFVwbG9hZExpbWl0KGxpbWl0KTtcbiAgICBpZiAobGltaXQgPT0gLTEpIHJldHVybiBhd2FpdCB0aGlzLnJlc2V0VXBsb2FkTGltaXQoKTtcbiAgICBpZiAoIShHZW5VdGlscy5pc0ludChsaW1pdCkgJiYgbGltaXQgPiAwKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiVXBsb2FkIGxpbWl0IG11c3QgYmUgYW4gaW50ZWdlciBncmVhdGVyIHRoYW4gMFwiKTtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuc2V0QmFuZHdpZHRoTGltaXRzKDAsIGxpbWl0KSlbMV07XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2V0VXBsb2FkTGltaXQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24ucmVzZXRVcGxvYWRMaW1pdCgpO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5zZXRCYW5kd2lkdGhMaW1pdHMoMCwgLTEpKVsxXTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGVlcnMoKTogUHJvbWlzZTxNb25lcm9QZWVyW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0UGVlcnMoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9jb25uZWN0aW9uc1wiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgbGV0IHBlZXJzID0gW107XG4gICAgaWYgKCFyZXNwLnJlc3VsdC5jb25uZWN0aW9ucykgcmV0dXJuIHBlZXJzO1xuICAgIGZvciAobGV0IHJwY0Nvbm5lY3Rpb24gb2YgcmVzcC5yZXN1bHQuY29ubmVjdGlvbnMpIHtcbiAgICAgIHBlZXJzLnB1c2goTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNDb25uZWN0aW9uKHJwY0Nvbm5lY3Rpb24pKTtcbiAgICB9XG4gICAgcmV0dXJuIHBlZXJzO1xuICB9XG4gIFxuICBhc3luYyBnZXRLbm93blBlZXJzKCk6IFByb21pc2U8TW9uZXJvUGVlcltdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEtub3duUGVlcnMoKTtcbiAgICBcbiAgICAvLyB0eCBjb25maWdcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImdldF9wZWVyX2xpc3RcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgXG4gICAgLy8gYnVpbGQgcGVlcnNcbiAgICBsZXQgcGVlcnMgPSBbXTtcbiAgICBpZiAocmVzcC5ncmF5X2xpc3QpIHtcbiAgICAgIGZvciAobGV0IHJwY1BlZXIgb2YgcmVzcC5ncmF5X2xpc3QpIHtcbiAgICAgICAgbGV0IHBlZXIgPSBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1BlZXIocnBjUGVlcik7XG4gICAgICAgIHBlZXIuc2V0SXNPbmxpbmUoZmFsc2UpOyAvLyBncmF5IGxpc3QgbWVhbnMgb2ZmbGluZSBsYXN0IGNoZWNrZWRcbiAgICAgICAgcGVlcnMucHVzaChwZWVyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHJlc3Aud2hpdGVfbGlzdCkge1xuICAgICAgZm9yIChsZXQgcnBjUGVlciBvZiByZXNwLndoaXRlX2xpc3QpIHtcbiAgICAgICAgbGV0IHBlZXIgPSBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1BlZXIocnBjUGVlcik7XG4gICAgICAgIHBlZXIuc2V0SXNPbmxpbmUodHJ1ZSk7IC8vIHdoaXRlIGxpc3QgbWVhbnMgb25saW5lIGxhc3QgY2hlY2tlZFxuICAgICAgICBwZWVycy5wdXNoKHBlZXIpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcGVlcnM7XG4gIH1cbiAgXG4gIGFzeW5jIHNldE91dGdvaW5nUGVlckxpbWl0KGxpbWl0OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc2V0T3V0Z29pbmdQZWVyTGltaXQobGltaXQpO1xuICAgIGlmICghKEdlblV0aWxzLmlzSW50KGxpbWl0KSAmJiBsaW1pdCA+PSAwKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiT3V0Z29pbmcgcGVlciBsaW1pdCBtdXN0IGJlID49IDBcIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJvdXRfcGVlcnNcIiwge291dF9wZWVyczogbGltaXR9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0SW5jb21pbmdQZWVyTGltaXQobGltaXQ6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5zZXRJbmNvbWluZ1BlZXJMaW1pdChsaW1pdCk7XG4gICAgaWYgKCEoR2VuVXRpbHMuaXNJbnQobGltaXQpICYmIGxpbWl0ID49IDApKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJJbmNvbWluZyBwZWVyIGxpbWl0IG11c3QgYmUgPj0gMFwiKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImluX3BlZXJzXCIsIHtpbl9wZWVyczogbGltaXR9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGVlckJhbnMoKTogUHJvbWlzZTxNb25lcm9CYW5bXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRQZWVyQmFucygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2JhbnNcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIGxldCBiYW5zID0gW107XG4gICAgZm9yIChsZXQgcnBjQmFuIG9mIHJlc3AucmVzdWx0LmJhbnMpIHtcbiAgICAgIGxldCBiYW4gPSBuZXcgTW9uZXJvQmFuKCk7XG4gICAgICBiYW4uc2V0SG9zdChycGNCYW4uaG9zdCk7XG4gICAgICBiYW4uc2V0SXAocnBjQmFuLmlwKTtcbiAgICAgIGJhbi5zZXRTZWNvbmRzKHJwY0Jhbi5zZWNvbmRzKTtcbiAgICAgIGJhbnMucHVzaChiYW4pO1xuICAgIH1cbiAgICByZXR1cm4gYmFucztcbiAgfVxuICBcbiAgYXN5bmMgc2V0UGVlckJhbnMoYmFuczogTW9uZXJvQmFuW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc2V0UGVlckJhbnMoYmFucyk7XG4gICAgbGV0IHJwY0JhbnMgPSBbXTtcbiAgICBmb3IgKGxldCBiYW4gb2YgYmFucykgcnBjQmFucy5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0VG9ScGNCYW4oYmFuKSk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzZXRfYmFuc1wiLCB7YmFuczogcnBjQmFuc30pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgc3RhcnRNaW5pbmcoYWRkcmVzczogc3RyaW5nLCBudW1UaHJlYWRzPzogbnVtYmVyLCBpc0JhY2tncm91bmQ/OiBib29sZWFuLCBpZ25vcmVCYXR0ZXJ5PzogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5zdGFydE1pbmluZyhhZGRyZXNzLCBudW1UaHJlYWRzLCBpc0JhY2tncm91bmQsIGlnbm9yZUJhdHRlcnkpO1xuICAgIGFzc2VydChhZGRyZXNzLCBcIk11c3QgcHJvdmlkZSBhZGRyZXNzIHRvIG1pbmUgdG9cIik7XG4gICAgYXNzZXJ0KEdlblV0aWxzLmlzSW50KG51bVRocmVhZHMpICYmIG51bVRocmVhZHMgPiAwLCBcIk51bWJlciBvZiB0aHJlYWRzIG11c3QgYmUgYW4gaW50ZWdlciBncmVhdGVyIHRoYW4gMFwiKTtcbiAgICBhc3NlcnQoaXNCYWNrZ3JvdW5kID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIGlzQmFja2dyb3VuZCA9PT0gXCJib29sZWFuXCIpO1xuICAgIGFzc2VydChpZ25vcmVCYXR0ZXJ5ID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIGlnbm9yZUJhdHRlcnkgPT09IFwiYm9vbGVhblwiKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcInN0YXJ0X21pbmluZ1wiLCB7XG4gICAgICBtaW5lcl9hZGRyZXNzOiBhZGRyZXNzLFxuICAgICAgdGhyZWFkc19jb3VudDogbnVtVGhyZWFkcyxcbiAgICAgIGRvX2JhY2tncm91bmRfbWluaW5nOiBpc0JhY2tncm91bmQsXG4gICAgICBpZ25vcmVfYmF0dGVyeTogaWdub3JlQmF0dGVyeSxcbiAgICB9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgc3RvcE1pbmluZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc3RvcE1pbmluZygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwic3RvcF9taW5pbmdcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE1pbmluZ1N0YXR1cygpOiBQcm9taXNlPE1vbmVyb01pbmluZ1N0YXR1cz4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRNaW5pbmdTdGF0dXMoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcIm1pbmluZ19zdGF0dXNcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjTWluaW5nU3RhdHVzKHJlc3ApO1xuICB9XG4gIFxuICBhc3luYyBzdWJtaXRCbG9ja3MoYmxvY2tCbG9iczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc3VibWl0QmxvY2tzKGJsb2NrQmxvYnMpO1xuICAgIGFzc2VydChBcnJheS5pc0FycmF5KGJsb2NrQmxvYnMpICYmIGJsb2NrQmxvYnMubGVuZ3RoID4gMCwgXCJNdXN0IHByb3ZpZGUgYW4gYXJyYXkgb2YgbWluZWQgYmxvY2sgYmxvYnMgdG8gc3VibWl0XCIpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3VibWl0X2Jsb2NrXCIsIGJsb2NrQmxvYnMpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgfVxuXG4gIGFzeW5jIHBydW5lQmxvY2tjaGFpbihjaGVjazogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvUHJ1bmVSZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24ucHJ1bmVCbG9ja2NoYWluKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJwcnVuZV9ibG9ja2NoYWluXCIsIHtjaGVjazogY2hlY2t9LCAwKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgbGV0IHJlc3VsdCA9IG5ldyBNb25lcm9QcnVuZVJlc3VsdCgpO1xuICAgIHJlc3VsdC5zZXRJc1BydW5lZChyZXNwLnJlc3VsdC5wcnVuZWQpO1xuICAgIHJlc3VsdC5zZXRQcnVuaW5nU2VlZChyZXNwLnJlc3VsdC5wcnVuaW5nX3NlZWQpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrRm9yVXBkYXRlKCk6IFByb21pc2U8TW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uY2hlY2tGb3JVcGRhdGUoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcInVwZGF0ZVwiLCB7Y29tbWFuZDogXCJjaGVja1wifSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVXBkYXRlQ2hlY2tSZXN1bHQocmVzcCk7XG4gIH1cbiAgXG4gIGFzeW5jIGRvd25sb2FkVXBkYXRlKHBhdGg/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmRvd25sb2FkVXBkYXRlKHBhdGgpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwidXBkYXRlXCIsIHtjb21tYW5kOiBcImRvd25sb2FkXCIsIHBhdGg6IHBhdGh9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNVcGRhdGVEb3dubG9hZFJlc3VsdChyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgc3RvcCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc3RvcCgpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwic3RvcF9kYWVtb25cIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gIH1cbiAgXG4gIGFzeW5jIHdhaXRGb3JOZXh0QmxvY2tIZWFkZXIoKTogUHJvbWlzZTxNb25lcm9CbG9ja0hlYWRlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi53YWl0Rm9yTmV4dEJsb2NrSGVhZGVyKCk7XG4gICAgbGV0IHRoYXQgPSB0aGlzO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyBmdW5jdGlvbihyZXNvbHZlKSB7XG4gICAgICBhd2FpdCB0aGF0LmFkZExpc3RlbmVyKG5ldyBjbGFzcyBleHRlbmRzIE1vbmVyb0RhZW1vbkxpc3RlbmVyIHtcbiAgICAgICAgYXN5bmMgb25CbG9ja0hlYWRlcihoZWFkZXIpIHtcbiAgICAgICAgICBhd2FpdCB0aGF0LnJlbW92ZUxpc3RlbmVyKHRoaXMpO1xuICAgICAgICAgIHJlc29sdmUoaGVhZGVyKTtcbiAgICAgICAgfVxuICAgICAgfSk7IFxuICAgIH0pO1xuICB9XG5cbiAgZ2V0UG9sbEludGVydmFsKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLnBvbGxJbnRlcnZhbDtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0gQUREIEpTRE9DIEZPUiBTVVBQT1JURUQgREVGQVVMVCBJTVBMRU1FTlRBVElPTlMgLS0tLS0tLS0tLS0tLS1cbiAgYXN5bmMgZ2V0VHgodHhIYXNoPzogc3RyaW5nLCBwcnVuZSA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9UeHx1bmRlZmluZWQ+IHsgcmV0dXJuIHN1cGVyLmdldFR4KHR4SGFzaCwgcHJ1bmUpOyB9O1xuICBhc3luYyBnZXRUeEhleCh0eEhhc2g6IHN0cmluZywgcHJ1bmUgPSBmYWxzZSk6IFByb21pc2U8c3RyaW5nPiB7IHJldHVybiBzdXBlci5nZXRUeEhleCh0eEhhc2gsIHBydW5lKTsgfTtcbiAgYXN5bmMgZ2V0S2V5SW1hZ2VTcGVudFN0YXR1cyhrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzPiB7IHJldHVybiBzdXBlci5nZXRLZXlJbWFnZVNwZW50U3RhdHVzKGtleUltYWdlKTsgfVxuICBhc3luYyBzZXRQZWVyQmFuKGJhbjogTW9uZXJvQmFuKTogUHJvbWlzZTx2b2lkPiB7IHJldHVybiBzdXBlci5zZXRQZWVyQmFuKGJhbik7IH1cbiAgYXN5bmMgc3VibWl0QmxvY2soYmxvY2tCbG9iOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHsgcmV0dXJuIHN1cGVyLnN1Ym1pdEJsb2NrKGJsb2NrQmxvYik7IH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUFJJVkFURSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHJvdGVjdGVkIHJlZnJlc2hMaXN0ZW5pbmcoKSB7XG4gICAgaWYgKHRoaXMucG9sbExpc3RlbmVyID09IHVuZGVmaW5lZCAmJiB0aGlzLmxpc3RlbmVycy5sZW5ndGgpIHRoaXMucG9sbExpc3RlbmVyID0gbmV3IERhZW1vblBvbGxlcih0aGlzKTtcbiAgICBpZiAodGhpcy5wb2xsTGlzdGVuZXIgIT09IHVuZGVmaW5lZCkgdGhpcy5wb2xsTGlzdGVuZXIuc2V0SXNQb2xsaW5nKHRoaXMubGlzdGVuZXJzLmxlbmd0aCA+IDApO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0QmFuZHdpZHRoTGltaXRzKCkge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwiZ2V0X2xpbWl0XCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIHJldHVybiBbcmVzcC5saW1pdF9kb3duLCByZXNwLmxpbWl0X3VwXTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIHNldEJhbmR3aWR0aExpbWl0cyhkb3duTGltaXQsIHVwTGltaXQpIHtcbiAgICBpZiAoZG93bkxpbWl0ID09PSB1bmRlZmluZWQpIGRvd25MaW1pdCA9IDA7XG4gICAgaWYgKHVwTGltaXQgPT09IHVuZGVmaW5lZCkgdXBMaW1pdCA9IDA7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJzZXRfbGltaXRcIiwge2xpbWl0X2Rvd246IGRvd25MaW1pdCwgbGltaXRfdXA6IHVwTGltaXR9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICByZXR1cm4gW3Jlc3AubGltaXRfZG93biwgcmVzcC5saW1pdF91cF07XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYSBjb250aWd1b3VzIGNodW5rIG9mIGJsb2NrcyBzdGFydGluZyBmcm9tIGEgZ2l2ZW4gaGVpZ2h0IHVwIHRvIGEgbWF4aW11bVxuICAgKiBoZWlnaHQgb3IgYW1vdW50IG9mIGJsb2NrIGRhdGEgZmV0Y2hlZCBmcm9tIHRoZSBibG9ja2NoYWluLCB3aGljaGV2ZXIgY29tZXMgZmlyc3QuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gW3N0YXJ0SGVpZ2h0XSAtIHN0YXJ0IGhlaWdodCB0byByZXRyaWV2ZSBibG9ja3MgKGRlZmF1bHQgMClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFttYXhIZWlnaHRdIC0gbWF4aW11bSBlbmQgaGVpZ2h0IHRvIHJldHJpZXZlIGJsb2NrcyAoZGVmYXVsdCBibG9ja2NoYWluIGhlaWdodClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFttYXhSZXFTaXplXSAtIG1heGltdW0gYW1vdW50IG9mIGJsb2NrIGRhdGEgdG8gZmV0Y2ggZnJvbSB0aGUgYmxvY2tjaGFpbiBpbiBieXRlcyAoZGVmYXVsdCAzLDAwMCwwMDAgYnl0ZXMpXG4gICAqIEByZXR1cm4ge01vbmVyb0Jsb2NrW119IGFyZSB0aGUgcmVzdWx0aW5nIGNodW5rIG9mIGJsb2Nrc1xuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIGdldE1heEJsb2NrcyhzdGFydEhlaWdodCwgbWF4SGVpZ2h0LCBtYXhSZXFTaXplKSB7XG4gICAgaWYgKHN0YXJ0SGVpZ2h0ID09PSB1bmRlZmluZWQpIHN0YXJ0SGVpZ2h0ID0gMDtcbiAgICBpZiAobWF4SGVpZ2h0ID09PSB1bmRlZmluZWQpIG1heEhlaWdodCA9IGF3YWl0IHRoaXMuZ2V0SGVpZ2h0KCkgLSAxO1xuICAgIGlmIChtYXhSZXFTaXplID09PSB1bmRlZmluZWQpIG1heFJlcVNpemUgPSBNb25lcm9EYWVtb25ScGMuTUFYX1JFUV9TSVpFO1xuICAgIFxuICAgIC8vIGRldGVybWluZSBlbmQgaGVpZ2h0IHRvIGZldGNoXG4gICAgbGV0IHJlcVNpemUgPSAwO1xuICAgIGxldCBlbmRIZWlnaHQgPSBzdGFydEhlaWdodCAtIDE7XG4gICAgd2hpbGUgKHJlcVNpemUgPCBtYXhSZXFTaXplICYmIGVuZEhlaWdodCA8IG1heEhlaWdodCkge1xuICAgICAgXG4gICAgICAvLyBnZXQgaGVhZGVyIG9mIG5leHQgYmxvY2tcbiAgICAgIGxldCBoZWFkZXIgPSBhd2FpdCB0aGlzLmdldEJsb2NrSGVhZGVyQnlIZWlnaHRDYWNoZWQoZW5kSGVpZ2h0ICsgMSwgbWF4SGVpZ2h0KTtcbiAgICAgIFxuICAgICAgLy8gYmxvY2sgY2Fubm90IGJlIGJpZ2dlciB0aGFuIG1heCByZXF1ZXN0IHNpemVcbiAgICAgIGFzc2VydChoZWFkZXIuZ2V0U2l6ZSgpIDw9IG1heFJlcVNpemUsIFwiQmxvY2sgZXhjZWVkcyBtYXhpbXVtIHJlcXVlc3Qgc2l6ZTogXCIgKyBoZWFkZXIuZ2V0U2l6ZSgpKTtcbiAgICAgIFxuICAgICAgLy8gZG9uZSBpdGVyYXRpbmcgaWYgZmV0Y2hpbmcgYmxvY2sgd291bGQgZXhjZWVkIG1heCByZXF1ZXN0IHNpemVcbiAgICAgIGlmIChyZXFTaXplICsgaGVhZGVyLmdldFNpemUoKSA+IG1heFJlcVNpemUpIGJyZWFrO1xuICAgICAgXG4gICAgICAvLyBvdGhlcndpc2UgYmxvY2sgaXMgaW5jbHVkZWRcbiAgICAgIHJlcVNpemUgKz0gaGVhZGVyLmdldFNpemUoKTtcbiAgICAgIGVuZEhlaWdodCsrO1xuICAgIH1cbiAgICByZXR1cm4gZW5kSGVpZ2h0ID49IHN0YXJ0SGVpZ2h0ID8gYXdhaXQgdGhpcy5nZXRCbG9ja3NCeVJhbmdlKHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpIDogW107XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYSBoZWFkZXIgYnkgaGVpZ2h0IGZyb20gdGhlIGNhY2hlIG9yIGZldGNoZXMgYW5kIGNhY2hlcyBhIGhlYWRlclxuICAgKiByYW5nZSBpZiBub3QgYWxyZWFkeSBpbiB0aGUgY2FjaGUuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gaGVpZ2h0IC0gaGVpZ2h0IG9mIHRoZSBoZWFkZXIgdG8gcmV0cmlldmUgZnJvbSB0aGUgY2FjaGVcbiAgICogQHBhcmFtIHtudW1iZXJ9IG1heEhlaWdodCAtIG1heGltdW0gaGVpZ2h0IG9mIGhlYWRlcnMgdG8gY2FjaGVcbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyBnZXRCbG9ja0hlYWRlckJ5SGVpZ2h0Q2FjaGVkKGhlaWdodCwgbWF4SGVpZ2h0KSB7XG4gICAgXG4gICAgLy8gZ2V0IGhlYWRlciBmcm9tIGNhY2hlXG4gICAgbGV0IGNhY2hlZEhlYWRlciA9IHRoaXMuY2FjaGVkSGVhZGVyc1toZWlnaHRdO1xuICAgIGlmIChjYWNoZWRIZWFkZXIpIHJldHVybiBjYWNoZWRIZWFkZXI7XG4gICAgXG4gICAgLy8gZmV0Y2ggYW5kIGNhY2hlIGhlYWRlcnMgaWYgbm90IGluIGNhY2hlXG4gICAgbGV0IGVuZEhlaWdodCA9IE1hdGgubWluKG1heEhlaWdodCwgaGVpZ2h0ICsgTW9uZXJvRGFlbW9uUnBjLk5VTV9IRUFERVJTX1BFUl9SRVEgLSAxKTsgIC8vIFRPRE86IGNvdWxkIHNwZWNpZnkgZW5kIGhlaWdodCB0byBjYWNoZSB0byBvcHRpbWl6ZSBzbWFsbCByZXF1ZXN0cyAod291bGQgbGlrZSB0byBoYXZlIHRpbWUgcHJvZmlsaW5nIGluIHBsYWNlIHRob3VnaClcbiAgICBsZXQgaGVhZGVycyA9IGF3YWl0IHRoaXMuZ2V0QmxvY2tIZWFkZXJzQnlSYW5nZShoZWlnaHQsIGVuZEhlaWdodCk7XG4gICAgZm9yIChsZXQgaGVhZGVyIG9mIGhlYWRlcnMpIHtcbiAgICAgIHRoaXMuY2FjaGVkSGVhZGVyc1toZWFkZXIuZ2V0SGVpZ2h0KCldID0gaGVhZGVyO1xuICAgIH1cbiAgICBcbiAgICAvLyByZXR1cm4gdGhlIGNhY2hlZCBoZWFkZXJcbiAgICByZXR1cm4gdGhpcy5jYWNoZWRIZWFkZXJzW2hlaWdodF07XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBTVEFUSUMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgc3RhdGljIGFzeW5jIGNvbm5lY3RUb0RhZW1vblJwYyh1cmlPckNvbmZpZzogc3RyaW5nIHwgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPiB8IFBhcnRpYWw8TW9uZXJvRGFlbW9uQ29uZmlnPiB8IHN0cmluZ1tdLCB1c2VybmFtZT86IHN0cmluZywgcGFzc3dvcmQ/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0RhZW1vblJwYz4ge1xuICAgIGxldCBjb25maWcgPSBNb25lcm9EYWVtb25ScGMubm9ybWFsaXplQ29uZmlnKHVyaU9yQ29uZmlnLCB1c2VybmFtZSwgcGFzc3dvcmQpO1xuICAgIGlmIChjb25maWcuY21kKSByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLnN0YXJ0TW9uZXJvZFByb2Nlc3MoY29uZmlnKTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0RhZW1vblJwYyhjb25maWcsIGNvbmZpZy5wcm94eVRvV29ya2VyID8gYXdhaXQgTW9uZXJvRGFlbW9uUnBjUHJveHkuY29ubmVjdChjb25maWcpIDogdW5kZWZpbmVkKTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBhc3luYyBzdGFydE1vbmVyb2RQcm9jZXNzKGNvbmZpZzogTW9uZXJvRGFlbW9uQ29uZmlnKTogUHJvbWlzZTxNb25lcm9EYWVtb25ScGM+IHtcbiAgICBhc3NlcnQoR2VuVXRpbHMuaXNBcnJheShjb25maWcuY21kKSwgXCJNdXN0IHByb3ZpZGUgc3RyaW5nIGFycmF5IHdpdGggY29tbWFuZCBsaW5lIHBhcmFtZXRlcnNcIik7XG4gICAgXG4gICAgLy8gc3RhcnQgcHJvY2Vzc1xuICAgIGxldCBjaGlsZFByb2Nlc3MgPSByZXF1aXJlKCdjaGlsZF9wcm9jZXNzJykuc3Bhd24oY29uZmlnLmNtZFswXSwgY29uZmlnLmNtZC5zbGljZSgxKSwge1xuICAgICAgZW52OiB7IC4uLnByb2Nlc3MuZW52LCBMQU5HOiAnZW5fVVMuVVRGLTgnIH0gLy8gc2NyYXBlIG91dHB1dCBpbiBlbmdsaXNoXG4gICAgfSk7XG4gICAgY2hpbGRQcm9jZXNzLnN0ZG91dC5zZXRFbmNvZGluZygndXRmOCcpO1xuICAgIGNoaWxkUHJvY2Vzcy5zdGRlcnIuc2V0RW5jb2RpbmcoJ3V0ZjgnKTtcbiAgICBcbiAgICAvLyByZXR1cm4gcHJvbWlzZSB3aGljaCByZXNvbHZlcyBhZnRlciBzdGFydGluZyBtb25lcm9kXG4gICAgbGV0IHVyaTtcbiAgICBsZXQgb3V0cHV0ID0gXCJcIjtcbiAgICBsZXQgdGltZW91dDtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGF3YWl0IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBcbiAgICAgICAgLy8gZmFpbCBpZiBwcm9jZXNzIGRvZXMgbm90IHN0YXJ0IHdpdGhpbiB0aGUgdGltZW91dFxuICAgICAgICBpZiAoY29uZmlnLmNtZFRpbWVvdXRNcyA+IDApIHRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHJlamVjdChuZXcgRXJyb3IoXCJGYWlsZWQgdG8gc3RhcnQgbW9uZXJvZCB3aXRoaW4gXCIgKyBjb25maWcuY21kVGltZW91dE1zICsgXCIgbXNcIiArIChvdXRwdXQgPyBcIjpcXG5cXG5cIiArIG91dHB1dCA6IFwiXCIpKSksIGNvbmZpZy5jbWRUaW1lb3V0TXMpO1xuICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBzdGRvdXRcbiAgICAgICAgY2hpbGRQcm9jZXNzLnN0ZG91dC5vbignZGF0YScsIGFzeW5jIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICBsZXQgbGluZSA9IGRhdGEudG9TdHJpbmcoKTtcbiAgICAgICAgICBMaWJyYXJ5VXRpbHMubG9nKDIsIGxpbmUpO1xuICAgICAgICAgIG91dHB1dCArPSBsaW5lICsgJ1xcbic7IC8vIGNhcHR1cmUgb3V0cHV0IGluIGNhc2Ugb2YgZXJyb3JcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBleHRyYWN0IHVyaSBmcm9tIGUuZy4gXCJJIEJpbmRpbmcgb24gMTI3LjAuMC4xIChJUHY0KTozODA4NVwiXG4gICAgICAgICAgbGV0IHVyaUxpbmVDb250YWlucyA9IFwiQmluZGluZyBvbiBcIjtcbiAgICAgICAgICBsZXQgdXJpTGluZUNvbnRhaW5zSWR4ID0gbGluZS5pbmRleE9mKHVyaUxpbmVDb250YWlucyk7XG4gICAgICAgICAgaWYgKHVyaUxpbmVDb250YWluc0lkeCA+PSAwKSB7XG4gICAgICAgICAgICBsZXQgaG9zdCA9IGxpbmUuc3Vic3RyaW5nKHVyaUxpbmVDb250YWluc0lkeCArIHVyaUxpbmVDb250YWlucy5sZW5ndGgsIGxpbmUubGFzdEluZGV4T2YoJyAnKSk7XG4gICAgICAgICAgICBsZXQgdW5mb3JtYXR0ZWRMaW5lID0gbGluZS5yZXBsYWNlKC9cXHUwMDFiXFxbLio/bS9nLCAnJykudHJpbSgpOyAvLyByZW1vdmUgY29sb3IgZm9ybWF0dGluZ1xuICAgICAgICAgICAgbGV0IHBvcnQgPSB1bmZvcm1hdHRlZExpbmUuc3Vic3RyaW5nKHVuZm9ybWF0dGVkTGluZS5sYXN0SW5kZXhPZignOicpICsgMSk7XG4gICAgICAgICAgICBsZXQgc3NsSWR4ID0gY29uZmlnLmNtZC5pbmRleE9mKFwiLS1ycGMtc3NsXCIpO1xuICAgICAgICAgICAgbGV0IHNzbEVuYWJsZWQgPSBzc2xJZHggPj0gMCA/IFwiZW5hYmxlZFwiID09IGNvbmZpZy5jbWRbc3NsSWR4ICsgMV0udG9Mb3dlckNhc2UoKSA6IGZhbHNlO1xuICAgICAgICAgICAgdXJpID0gKHNzbEVuYWJsZWQgPyBcImh0dHBzXCIgOiBcImh0dHBcIikgKyBcIjovL1wiICsgaG9zdCArIFwiOlwiICsgcG9ydDtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gcmVhZCBzdWNjZXNzIG1lc3NhZ2VcbiAgICAgICAgICBpZiAobGluZS5pbmRleE9mKFwiY29yZSBSUEMgc2VydmVyIHN0YXJ0ZWQgb2tcIikgPj0gMCkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIC8vIGdldCB1c2VybmFtZSBhbmQgcGFzc3dvcmQgZnJvbSBwYXJhbXNcbiAgICAgICAgICAgICAgbGV0IHVzZXJQYXNzSWR4ID0gY29uZmlnLmNtZC5pbmRleE9mKFwiLS1ycGMtbG9naW5cIik7XG4gICAgICAgICAgICAgIGxldCB1c2VyUGFzcyA9IHVzZXJQYXNzSWR4ID49IDAgPyBjb25maWcuY21kW3VzZXJQYXNzSWR4ICsgMV0gOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgIGxldCB1c2VybmFtZSA9IHVzZXJQYXNzID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB1c2VyUGFzcy5zdWJzdHJpbmcoMCwgdXNlclBhc3MuaW5kZXhPZignOicpKTtcbiAgICAgICAgICAgICAgbGV0IHBhc3N3b3JkID0gdXNlclBhc3MgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHVzZXJQYXNzLnN1YnN0cmluZyh1c2VyUGFzcy5pbmRleE9mKCc6JykgKyAxKTtcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIC8vIGNyZWF0ZSBjbGllbnQgY29ubmVjdGVkIHRvIGludGVybmFsIHByb2Nlc3NcbiAgICAgICAgICAgICAgY29uZmlnID0gY29uZmlnLmNvcHkoKS5zZXRTZXJ2ZXIoe3VyaTogdXJpLCB1c2VybmFtZTogdXNlcm5hbWUsIHBhc3N3b3JkOiBwYXNzd29yZCwgcmVqZWN0VW5hdXRob3JpemVkOiBjb25maWcuZ2V0U2VydmVyKCkgPyBjb25maWcuZ2V0U2VydmVyKCkuZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkgOiB1bmRlZmluZWR9KTtcbiAgICAgICAgICAgICAgY29uZmlnLnNldFByb3h5VG9Xb3JrZXIoY29uZmlnLnByb3h5VG9Xb3JrZXIpO1xuICAgICAgICAgICAgICBjb25maWcuY21kID0gdW5kZWZpbmVkXG4gICAgICAgICAgICAgIGxldCBkYWVtb24gPSBhd2FpdCBNb25lcm9EYWVtb25ScGMuY29ubmVjdFRvRGFlbW9uUnBjKGNvbmZpZyk7XG4gICAgICAgICAgICAgIGRhZW1vbi5wcm9jZXNzID0gY2hpbGRQcm9jZXNzO1xuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgLy8gcmVzb2x2ZSBwcm9taXNlIHdpdGggY2xpZW50IGNvbm5lY3RlZCB0byBpbnRlcm5hbCBwcm9jZXNzIFxuICAgICAgICAgICAgICB0aGlzLmlzUmVzb2x2ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICByZXNvbHZlKGRhZW1vbik7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBzdGRlcnJcbiAgICAgICAgY2hpbGRQcm9jZXNzLnN0ZGVyci5vbignZGF0YScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICBpZiAoTGlicmFyeVV0aWxzLmdldExvZ0xldmVsKCkgPj0gMikgY29uc29sZS5lcnJvcihkYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgZXhpdFxuICAgICAgICBjaGlsZFByb2Nlc3Mub24oXCJleGl0XCIsIGZ1bmN0aW9uKGNvZGUpIHtcbiAgICAgICAgICBpZiAoIXRoaXMuaXNSZXNvbHZlZCkgcmVqZWN0KG5ldyBFcnJvcihcIm1vbmVyb2QgcHJvY2VzcyB0ZXJtaW5hdGVkIHdpdGggZXhpdCBjb2RlIFwiICsgY29kZSArIChvdXRwdXQgPyBcIjpcXG5cXG5cIiArIG91dHB1dCA6IFwiXCIpKSk7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gaGFuZGxlIGVycm9yXG4gICAgICAgIGNoaWxkUHJvY2Vzcy5vbihcImVycm9yXCIsIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgIGlmIChlcnIubWVzc2FnZS5pbmRleE9mKFwiRU5PRU5UXCIpID49IDApIHJlamVjdChuZXcgRXJyb3IoXCJtb25lcm9kIGRvZXMgbm90IGV4aXN0IGF0IHBhdGggJ1wiICsgY29uZmlnLmNtZFswXSArIFwiJ1wiKSk7XG4gICAgICAgICAgaWYgKCF0aGlzLmlzUmVzb2x2ZWQpIHJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSB1bmNhdWdodCBleGNlcHRpb25cbiAgICAgICAgY2hpbGRQcm9jZXNzLm9uKFwidW5jYXVnaHRFeGNlcHRpb25cIiwgZnVuY3Rpb24oZXJyLCBvcmlnaW4pIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiVW5jYXVnaHQgZXhjZXB0aW9uIGluIG1vbmVyb2QgcHJvY2VzczogXCIgKyBlcnIubWVzc2FnZSk7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihvcmlnaW4pO1xuICAgICAgICAgIGlmICghdGhpcy5pc1Jlc29sdmVkKSByZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgYXdhaXQgR2VuVXRpbHMua2lsbFByb2Nlc3MoY2hpbGRQcm9jZXNzLCBcIlNJR0tJTExcIik7IC8vIGRvIG5vdCBsZWF2ZSB0aGUgcHJvY2VzcyBydW5uaW5nXG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZXJyLm1lc3NhZ2UpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XG4gICAgfVxuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIG5vcm1hbGl6ZUNvbmZpZyh1cmlPckNvbmZpZzogc3RyaW5nIHwgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPiB8IFBhcnRpYWw8TW9uZXJvRGFlbW9uQ29uZmlnPiB8IHN0cmluZ1tdLCB1c2VybmFtZT86IHN0cmluZywgcGFzc3dvcmQ/OiBzdHJpbmcpOiBNb25lcm9EYWVtb25Db25maWcge1xuICAgIGxldCBjb25maWc6IHVuZGVmaW5lZCB8IFBhcnRpYWw8TW9uZXJvRGFlbW9uQ29uZmlnPiA9IHVuZGVmaW5lZDtcbiAgICBpZiAodHlwZW9mIHVyaU9yQ29uZmlnID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBjb25maWcgPSBuZXcgTW9uZXJvRGFlbW9uQ29uZmlnKHtzZXJ2ZXI6IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHVyaU9yQ29uZmlnIGFzIHN0cmluZywgdXNlcm5hbWUsIHBhc3N3b3JkKX0pO1xuICAgIH0gZWxzZSBpZiAoKHVyaU9yQ29uZmlnIGFzIFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4pLnVyaSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25maWcgPSBuZXcgTW9uZXJvRGFlbW9uQ29uZmlnKHtzZXJ2ZXI6IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHVyaU9yQ29uZmlnIGFzIFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4pfSk7XG5cbiAgICAgIC8vIHRyYW5zZmVyIHdvcmtlciBwcm94eSBzZXR0aW5nIGZyb20gcnBjIGNvbm5lY3Rpb24gdG8gZGFlbW9uIGNvbmZpZ1xuICAgICAgY29uZmlnLnNldFByb3h5VG9Xb3JrZXIoKHVyaU9yQ29uZmlnIGFzIFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4pLnByb3h5VG9Xb3JrZXIpO1xuICAgICAgY29uZmlnLmdldFNlcnZlcigpLnNldFByb3h5VG9Xb3JrZXIoTW9uZXJvUnBjQ29ubmVjdGlvbi5ERUZBVUxUX0NPTkZJRy5wcm94eVRvV29ya2VyKTtcbiAgICB9IGVsc2UgaWYgKEdlblV0aWxzLmlzQXJyYXkodXJpT3JDb25maWcpKSB7XG4gICAgICBjb25maWcgPSBuZXcgTW9uZXJvRGFlbW9uQ29uZmlnKHtjbWQ6IHVyaU9yQ29uZmlnIGFzIHN0cmluZ1tdfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbmZpZyA9IG5ldyBNb25lcm9EYWVtb25Db25maWcodXJpT3JDb25maWcgYXMgUGFydGlhbDxNb25lcm9EYWVtb25Db25maWc+KTtcbiAgICB9XG4gICAgaWYgKGNvbmZpZy5wcm94eVRvV29ya2VyID09PSB1bmRlZmluZWQpIGNvbmZpZy5wcm94eVRvV29ya2VyID0gdHJ1ZTtcbiAgICBpZiAoY29uZmlnLnBvbGxJbnRlcnZhbCA9PT0gdW5kZWZpbmVkKSBjb25maWcucG9sbEludGVydmFsID0gTW9uZXJvRGFlbW9uUnBjLkRFRkFVTFRfUE9MTF9QRVJJT0Q7XG4gICAgcmV0dXJuIGNvbmZpZyBhcyBNb25lcm9EYWVtb25Db25maWc7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKSB7XG4gICAgaWYgKHJlc3Auc3RhdHVzICE9PSBcIk9LXCIpIHRocm93IG5ldyBNb25lcm9FcnJvcihyZXNwLnN0YXR1cyk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY0Jsb2NrSGVhZGVyKHJwY0hlYWRlcikge1xuICAgIGlmICghcnBjSGVhZGVyKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIGxldCBoZWFkZXIgPSBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjSGVhZGVyKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY0hlYWRlcltrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJibG9ja19zaXplXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0U2l6ZSwgaGVhZGVyLnNldFNpemUsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGVwdGhcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXREZXB0aCwgaGVhZGVyLnNldERlcHRoLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRpZmZpY3VsdHlcIikgeyB9ICAvLyBoYW5kbGVkIGJ5IHdpZGVfZGlmZmljdWx0eVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImN1bXVsYXRpdmVfZGlmZmljdWx0eVwiKSB7IH0gLy8gaGFuZGxlZCBieSB3aWRlX2N1bXVsYXRpdmVfZGlmZmljdWx0eVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRpZmZpY3VsdHlfdG9wNjRcIikgeyB9ICAvLyBoYW5kbGVkIGJ5IHdpZGVfZGlmZmljdWx0eVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImN1bXVsYXRpdmVfZGlmZmljdWx0eV90b3A2NFwiKSB7IH0gLy8gaGFuZGxlZCBieSB3aWRlX2N1bXVsYXRpdmVfZGlmZmljdWx0eVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndpZGVfZGlmZmljdWx0eVwiKSBoZWFkZXIuc2V0RGlmZmljdWx0eShHZW5VdGlscy5yZWNvbmNpbGUoaGVhZGVyLmdldERpZmZpY3VsdHkoKSwgTW9uZXJvRGFlbW9uUnBjLnByZWZpeGVkSGV4VG9CSSh2YWwpKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2lkZV9jdW11bGF0aXZlX2RpZmZpY3VsdHlcIikgaGVhZGVyLnNldEN1bXVsYXRpdmVEaWZmaWN1bHR5KEdlblV0aWxzLnJlY29uY2lsZShoZWFkZXIuZ2V0Q3VtdWxhdGl2ZURpZmZpY3VsdHkoKSwgTW9uZXJvRGFlbW9uUnBjLnByZWZpeGVkSGV4VG9CSSh2YWwpKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGFzaFwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldEhhc2gsIGhlYWRlci5zZXRIYXNoLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhlaWdodFwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldEhlaWdodCwgaGVhZGVyLnNldEhlaWdodCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtYWpvcl92ZXJzaW9uXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0TWFqb3JWZXJzaW9uLCBoZWFkZXIuc2V0TWFqb3JWZXJzaW9uLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm1pbm9yX3ZlcnNpb25cIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRNaW5vclZlcnNpb24sIGhlYWRlci5zZXRNaW5vclZlcnNpb24sIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibm9uY2VcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXROb25jZSwgaGVhZGVyLnNldE5vbmNlLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm51bV90eGVzXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0TnVtVHhzLCBoZWFkZXIuc2V0TnVtVHhzLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm9ycGhhbl9zdGF0dXNcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRPcnBoYW5TdGF0dXMsIGhlYWRlci5zZXRPcnBoYW5TdGF0dXMsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHJldl9oYXNoXCIgfHwga2V5ID09PSBcInByZXZfaWRcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRQcmV2SGFzaCwgaGVhZGVyLnNldFByZXZIYXNoLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJld2FyZFwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldFJld2FyZCwgaGVhZGVyLnNldFJld2FyZCwgQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRpbWVzdGFtcFwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldFRpbWVzdGFtcCwgaGVhZGVyLnNldFRpbWVzdGFtcCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja193ZWlnaHRcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRXZWlnaHQsIGhlYWRlci5zZXRXZWlnaHQsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibG9uZ190ZXJtX3dlaWdodFwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldExvbmdUZXJtV2VpZ2h0LCBoZWFkZXIuc2V0TG9uZ1Rlcm1XZWlnaHQsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicG93X2hhc2hcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRQb3dIYXNoLCBoZWFkZXIuc2V0UG93SGFzaCwgdmFsID09PSBcIlwiID8gdW5kZWZpbmVkIDogdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9oYXNoZXNcIikge30gIC8vIHVzZWQgaW4gYmxvY2sgbW9kZWwsIG5vdCBoZWFkZXIgbW9kZWxcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtaW5lcl90eFwiKSB7fSAgIC8vIHVzZWQgaW4gYmxvY2sgbW9kZWwsIG5vdCBoZWFkZXIgbW9kZWxcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtaW5lcl90eF9oYXNoXCIpIGhlYWRlci5zZXRNaW5lclR4SGFzaCh2YWwpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgYmxvY2sgaGVhZGVyIGZpZWxkOiAnXCIgKyBrZXkgKyBcIic6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIGhlYWRlcjtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjQmxvY2socnBjQmxvY2spIHtcbiAgICBcbiAgICAvLyBidWlsZCBibG9ja1xuICAgIGxldCBibG9jayA9IG5ldyBNb25lcm9CbG9jayhNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Jsb2NrSGVhZGVyKHJwY0Jsb2NrLmJsb2NrX2hlYWRlciA/IHJwY0Jsb2NrLmJsb2NrX2hlYWRlciA6IHJwY0Jsb2NrKSBhcyBNb25lcm9CbG9jayk7XG4gICAgYmxvY2suc2V0SGV4KHJwY0Jsb2NrLmJsb2IpO1xuICAgIGJsb2NrLnNldFR4SGFzaGVzKHJwY0Jsb2NrLnR4X2hhc2hlcyA9PT0gdW5kZWZpbmVkID8gW10gOiBycGNCbG9jay50eF9oYXNoZXMpO1xuICAgIFxuICAgIC8vIGJ1aWxkIG1pbmVyIHR4XG4gICAgbGV0IHJwY01pbmVyVHggPSBycGNCbG9jay5qc29uID8gSlNPTi5wYXJzZShycGNCbG9jay5qc29uKS5taW5lcl90eCA6IHJwY0Jsb2NrLm1pbmVyX3R4OyAgLy8gbWF5IG5lZWQgdG8gYmUgcGFyc2VkIGZyb20ganNvblxuICAgIGxldCBtaW5lclR4ID0gbmV3IE1vbmVyb1R4KCk7XG4gICAgYmxvY2suc2V0TWluZXJUeChtaW5lclR4KTtcbiAgICBtaW5lclR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgIG1pbmVyVHguc2V0SW5UeFBvb2woZmFsc2UpXG4gICAgbWluZXJUeC5zZXRJc01pbmVyVHgodHJ1ZSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNUeChycGNNaW5lclR4LCBtaW5lclR4KTtcbiAgICBcbiAgICByZXR1cm4gYmxvY2s7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBUcmFuc2ZlcnMgUlBDIHR4IGZpZWxkcyB0byBhIGdpdmVuIE1vbmVyb1R4IHdpdGhvdXQgb3ZlcndyaXRpbmcgcHJldmlvdXMgdmFsdWVzLlxuICAgKiBcbiAgICogVE9ETzogc3dpdGNoIGZyb20gc2FmZSBzZXRcbiAgICogXG4gICAqIEBwYXJhbSBycGNUeCAtIFJQQyBtYXAgY29udGFpbmluZyB0cmFuc2FjdGlvbiBmaWVsZHNcbiAgICogQHBhcmFtIHR4ICAtIE1vbmVyb1R4IHRvIHBvcHVsYXRlIHdpdGggdmFsdWVzIChvcHRpb25hbClcbiAgICogQHJldHVybiB0eCAtIHNhbWUgdHggdGhhdCB3YXMgcGFzc2VkIGluIG9yIGEgbmV3IG9uZSBpZiBub25lIGdpdmVuXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNUeChycGNUeCwgdHgpIHtcbiAgICBpZiAocnBjVHggPT09IHVuZGVmaW5lZCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICBpZiAodHggPT09IHVuZGVmaW5lZCkgdHggPSBuZXcgTW9uZXJvVHgoKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIGZyb20gcnBjIG1hcFxuICAgIGxldCBoZWFkZXI7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1R4KSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1R4W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcInR4X2hhc2hcIiB8fCBrZXkgPT09IFwiaWRfaGFzaFwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRIYXNoLCB0eC5zZXRIYXNoLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX3RpbWVzdGFtcFwiKSB7XG4gICAgICAgIGlmICghaGVhZGVyKSBoZWFkZXIgPSBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoKTtcbiAgICAgICAgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRUaW1lc3RhbXAsIGhlYWRlci5zZXRUaW1lc3RhbXAsIHZhbCk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfaGVpZ2h0XCIpIHtcbiAgICAgICAgaWYgKCFoZWFkZXIpIGhlYWRlciA9IG5ldyBNb25lcm9CbG9ja0hlYWRlcigpO1xuICAgICAgICBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldEhlaWdodCwgaGVhZGVyLnNldEhlaWdodCwgdmFsKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsYXN0X3JlbGF5ZWRfdGltZVwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRMYXN0UmVsYXllZFRpbWVzdGFtcCwgdHguc2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVjZWl2ZV90aW1lXCIgfHwga2V5ID09PSBcInJlY2VpdmVkX3RpbWVzdGFtcFwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRSZWNlaXZlZFRpbWVzdGFtcCwgdHguc2V0UmVjZWl2ZWRUaW1lc3RhbXAsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY29uZmlybWF0aW9uc1wiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXROdW1Db25maXJtYXRpb25zLCB0eC5zZXROdW1Db25maXJtYXRpb25zLCB2YWwpOyBcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJpbl9wb29sXCIpIHtcbiAgICAgICAgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SXNDb25maXJtZWQsIHR4LnNldElzQ29uZmlybWVkLCAhdmFsKTtcbiAgICAgICAgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SW5UeFBvb2wsIHR4LnNldEluVHhQb29sLCB2YWwpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRvdWJsZV9zcGVuZF9zZWVuXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzRG91YmxlU3BlbmRTZWVuLCB0eC5zZXRJc0RvdWJsZVNwZW5kU2VlbiwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ2ZXJzaW9uXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFZlcnNpb24sIHR4LnNldFZlcnNpb24sIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZXh0cmFcIikge1xuICAgICAgICBpZiAodHlwZW9mIHZhbCA9PT0gXCJzdHJpbmdcIikgY29uc29sZS5sb2coXCJXQVJOSU5HOiBleHRyYSBmaWVsZCBhcyBzdHJpbmcgbm90IGJlaW5nIGFzaWduZWQgdG8gaW50W106IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTsgLy8gVE9ETzogaG93IHRvIHNldCBzdHJpbmcgdG8gaW50W10/IC0gb3IsIGV4dHJhIGlzIHN0cmluZyB3aGljaCBjYW4gZW5jb2RlIGludFtdXG4gICAgICAgIGVsc2UgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0RXh0cmEsIHR4LnNldEV4dHJhLCBuZXcgVWludDhBcnJheSh2YWwpKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ2aW5cIikge1xuICAgICAgICBpZiAodmFsLmxlbmd0aCAhPT0gMSB8fCAhdmFsWzBdLmdlbikgeyAgLy8gaWdub3JlIG1pbmVyIGlucHV0IFRPRE86IHdoeT9cbiAgICAgICAgICB0eC5zZXRJbnB1dHModmFsLm1hcChycGNWaW4gPT4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNPdXRwdXQocnBjVmluLCB0eCkpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInZvdXRcIikgdHguc2V0T3V0cHV0cyh2YWwubWFwKHJwY091dHB1dCA9PiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY091dHB1dChycGNPdXRwdXQsIHR4KSkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJjdF9zaWduYXR1cmVzXCIpIHtcbiAgICAgICAgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0UmN0U2lnbmF0dXJlcywgdHguc2V0UmN0U2lnbmF0dXJlcywgdmFsKTtcbiAgICAgICAgaWYgKHZhbC50eG5GZWUpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldEZlZSwgdHguc2V0RmVlLCBCaWdJbnQodmFsLnR4bkZlZSkpO1xuICAgICAgfSBcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyY3RzaWdfcHJ1bmFibGVcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0UmN0U2lnUHJ1bmFibGUsIHR4LnNldFJjdFNpZ1BydW5hYmxlLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVubG9ja190aW1lXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFVubG9ja1RpbWUsIHR4LnNldFVubG9ja1RpbWUsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYXNfanNvblwiIHx8IGtleSA9PT0gXCJ0eF9qc29uXCIpIHsgfSAgLy8gaGFuZGxlZCBsYXN0IHNvIHR4IGlzIGFzIGluaXRpYWxpemVkIGFzIHBvc3NpYmxlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYXNfaGV4XCIgfHwga2V5ID09PSBcInR4X2Jsb2JcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0RnVsbEhleCwgdHguc2V0RnVsbEhleCwgdmFsID8gdmFsIDogdW5kZWZpbmVkKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9iX3NpemVcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0U2l6ZSwgdHguc2V0U2l6ZSwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3ZWlnaHRcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0V2VpZ2h0LCB0eC5zZXRXZWlnaHQsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZmVlXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldEZlZSwgdHguc2V0RmVlLCBCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVsYXllZFwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc1JlbGF5ZWQsIHR4LnNldElzUmVsYXllZCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJvdXRwdXRfaW5kaWNlc1wiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRPdXRwdXRJbmRpY2VzLCB0eC5zZXRPdXRwdXRJbmRpY2VzLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRvX25vdF9yZWxheVwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRSZWxheSwgdHguc2V0UmVsYXksICF2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImtlcHRfYnlfYmxvY2tcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SXNLZXB0QnlCbG9jaywgdHguc2V0SXNLZXB0QnlCbG9jaywgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzaWduYXR1cmVzXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFNpZ25hdHVyZXMsIHR4LnNldFNpZ25hdHVyZXMsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibGFzdF9mYWlsZWRfaGVpZ2h0XCIpIHtcbiAgICAgICAgaWYgKHZhbCA9PT0gMCkgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SXNGYWlsZWQsIHR4LnNldElzRmFpbGVkLCBmYWxzZSk7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzRmFpbGVkLCB0eC5zZXRJc0ZhaWxlZCwgdHJ1ZSk7XG4gICAgICAgICAgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0TGFzdEZhaWxlZEhlaWdodCwgdHguc2V0TGFzdEZhaWxlZEhlaWdodCwgdmFsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxhc3RfZmFpbGVkX2lkX2hhc2hcIikge1xuICAgICAgICBpZiAodmFsID09PSBNb25lcm9EYWVtb25ScGMuREVGQVVMVF9JRCkgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SXNGYWlsZWQsIHR4LnNldElzRmFpbGVkLCBmYWxzZSk7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzRmFpbGVkLCB0eC5zZXRJc0ZhaWxlZCwgdHJ1ZSk7XG4gICAgICAgICAgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0TGFzdEZhaWxlZEhhc2gsIHR4LnNldExhc3RGYWlsZWRIYXNoLCB2YWwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibWF4X3VzZWRfYmxvY2tfaGVpZ2h0XCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldE1heFVzZWRCbG9ja0hlaWdodCwgdHguc2V0TWF4VXNlZEJsb2NrSGVpZ2h0LCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm1heF91c2VkX2Jsb2NrX2lkX2hhc2hcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0TWF4VXNlZEJsb2NrSGFzaCwgdHguc2V0TWF4VXNlZEJsb2NrSGFzaCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwcnVuYWJsZV9oYXNoXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFBydW5hYmxlSGFzaCwgdHguc2V0UHJ1bmFibGVIYXNoLCB2YWwgPyB2YWwgOiB1bmRlZmluZWQpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBydW5hYmxlX2FzX2hleFwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRQcnVuYWJsZUhleCwgdHguc2V0UHJ1bmFibGVIZXgsIHZhbCA/IHZhbCA6IHVuZGVmaW5lZCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHJ1bmVkX2FzX2hleFwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRQcnVuZWRIZXgsIHR4LnNldFBydW5lZEhleCwgdmFsID8gdmFsIDogdW5kZWZpbmVkKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIHJwYyB0eDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICBcbiAgICAvLyBsaW5rIGJsb2NrIGFuZCB0eFxuICAgIGlmIChoZWFkZXIpIHR4LnNldEJsb2NrKG5ldyBNb25lcm9CbG9jayhoZWFkZXIpLnNldFR4cyhbdHhdKSk7XG4gICAgXG4gICAgLy8gVE9ETyBtb25lcm9kOiB1bmNvbmZpcm1lZCB0eHMgbWlzcmVwb3J0IGJsb2NrIGhlaWdodCBhbmQgdGltZXN0YW1wP1xuICAgIGlmICh0eC5nZXRCbG9jaygpICYmIHR4LmdldEJsb2NrKCkuZ2V0SGVpZ2h0KCkgIT09IHVuZGVmaW5lZCAmJiB0eC5nZXRCbG9jaygpLmdldEhlaWdodCgpID09PSB0eC5nZXRCbG9jaygpLmdldFRpbWVzdGFtcCgpKSB7XG4gICAgICB0eC5zZXRCbG9jayh1bmRlZmluZWQpO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgIH1cbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHJlbWFpbmluZyBrbm93biBmaWVsZHNcbiAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSkge1xuICAgICAgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SXNSZWxheWVkLCB0eC5zZXRJc1JlbGF5ZWQsIHRydWUpO1xuICAgICAgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0UmVsYXksIHR4LnNldFJlbGF5LCB0cnVlKTtcbiAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzRmFpbGVkLCB0eC5zZXRJc0ZhaWxlZCwgZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0eC5zZXROdW1Db25maXJtYXRpb25zKDApO1xuICAgIH1cbiAgICBpZiAodHguZ2V0SXNGYWlsZWQoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgaWYgKHR4LmdldE91dHB1dEluZGljZXMoKSAmJiB0eC5nZXRPdXRwdXRzKCkpICB7XG4gICAgICBhc3NlcnQuZXF1YWwodHguZ2V0T3V0cHV0cygpLmxlbmd0aCwgdHguZ2V0T3V0cHV0SW5kaWNlcygpLmxlbmd0aCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHR4LmdldE91dHB1dHMoKS5sZW5ndGg7IGkrKykge1xuICAgICAgICB0eC5nZXRPdXRwdXRzKClbaV0uc2V0SW5kZXgodHguZ2V0T3V0cHV0SW5kaWNlcygpW2ldKTsgIC8vIHRyYW5zZmVyIG91dHB1dCBpbmRpY2VzIHRvIG91dHB1dHNcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHJwY1R4LmFzX2pzb24pIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVHgoSlNPTi5wYXJzZShycGNUeC5hc19qc29uKSwgdHgpO1xuICAgIGlmIChycGNUeC50eF9qc29uKSBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1R4KEpTT04ucGFyc2UocnBjVHgudHhfanNvbiksIHR4KTtcbiAgICBpZiAoIXR4LmdldElzUmVsYXllZCgpKSB0eC5zZXRMYXN0UmVsYXllZFRpbWVzdGFtcCh1bmRlZmluZWQpOyAgLy8gVE9ETyBtb25lcm9kOiByZXR1cm5zIGxhc3RfcmVsYXllZF90aW1lc3RhbXAgZGVzcGl0ZSByZWxheWVkOiBmYWxzZSwgc2VsZiBpbmNvbnNpc3RlbnRcbiAgICBcbiAgICAvLyByZXR1cm4gYnVpbHQgdHJhbnNhY3Rpb25cbiAgICByZXR1cm4gdHg7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY091dHB1dChycGNPdXRwdXQsIHR4KSB7XG4gICAgbGV0IG91dHB1dCA9IG5ldyBNb25lcm9PdXRwdXQoKTtcbiAgICBvdXRwdXQuc2V0VHgodHgpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNPdXRwdXQpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjT3V0cHV0W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImdlblwiKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJPdXRwdXQgd2l0aCAnZ2VuJyBmcm9tIGRhZW1vbiBycGMgaXMgbWluZXIgdHggd2hpY2ggd2UgaWdub3JlIChpLmUuIGVhY2ggbWluZXIgaW5wdXQgaXMgdW5kZWZpbmVkKVwiKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJrZXlcIikge1xuICAgICAgICBHZW5VdGlscy5zYWZlU2V0KG91dHB1dCwgb3V0cHV0LmdldEFtb3VudCwgb3V0cHV0LnNldEFtb3VudCwgQmlnSW50KHZhbC5hbW91bnQpKTtcbiAgICAgICAgR2VuVXRpbHMuc2FmZVNldChvdXRwdXQsIG91dHB1dC5nZXRLZXlJbWFnZSwgb3V0cHV0LnNldEtleUltYWdlLCBuZXcgTW9uZXJvS2V5SW1hZ2UodmFsLmtfaW1hZ2UpKTtcbiAgICAgICAgR2VuVXRpbHMuc2FmZVNldChvdXRwdXQsIG91dHB1dC5nZXRSaW5nT3V0cHV0SW5kaWNlcywgb3V0cHV0LnNldFJpbmdPdXRwdXRJbmRpY2VzLCB2YWwua2V5X29mZnNldHMpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudFwiKSBHZW5VdGlscy5zYWZlU2V0KG91dHB1dCwgb3V0cHV0LmdldEFtb3VudCwgb3V0cHV0LnNldEFtb3VudCwgQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRhcmdldFwiKSB7XG4gICAgICAgIGxldCBwdWJLZXkgPSB2YWwua2V5ID09PSB1bmRlZmluZWQgPyB2YWwudGFnZ2VkX2tleS5rZXkgOiB2YWwua2V5OyAvLyBUT0RPIChtb25lcm9kKTogcnBjIGpzb24gdXNlcyB7dGFnZ2VkX2tleT17a2V5PS4uLn19LCBiaW5hcnkgYmxvY2tzIHVzZSB7a2V5PS4uLn1cbiAgICAgICAgR2VuVXRpbHMuc2FmZVNldChvdXRwdXQsIG91dHB1dC5nZXRTdGVhbHRoUHVibGljS2V5LCBvdXRwdXQuc2V0U3RlYWx0aFB1YmxpY0tleSwgcHViS2V5KTtcbiAgICAgIH1cbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIG91dHB1dDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNCbG9ja1RlbXBsYXRlKHJwY1RlbXBsYXRlKSB7XG4gICAgbGV0IHRlbXBsYXRlID0gbmV3IE1vbmVyb0Jsb2NrVGVtcGxhdGUoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjVGVtcGxhdGUpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjVGVtcGxhdGVba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYmxvY2toYXNoaW5nX2Jsb2JcIikgdGVtcGxhdGUuc2V0QmxvY2tIYXNoaW5nQmxvYih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrdGVtcGxhdGVfYmxvYlwiKSB0ZW1wbGF0ZS5zZXRCbG9ja1RlbXBsYXRlQmxvYih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImV4cGVjdGVkX3Jld2FyZFwiKSB0ZW1wbGF0ZS5zZXRFeHBlY3RlZFJld2FyZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRpZmZpY3VsdHlcIikgeyB9ICAvLyBoYW5kbGVkIGJ5IHdpZGVfZGlmZmljdWx0eVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRpZmZpY3VsdHlfdG9wNjRcIikgeyB9ICAvLyBoYW5kbGVkIGJ5IHdpZGVfZGlmZmljdWx0eVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndpZGVfZGlmZmljdWx0eVwiKSB0ZW1wbGF0ZS5zZXREaWZmaWN1bHR5KEdlblV0aWxzLnJlY29uY2lsZSh0ZW1wbGF0ZS5nZXREaWZmaWN1bHR5KCksIE1vbmVyb0RhZW1vblJwYy5wcmVmaXhlZEhleFRvQkkodmFsKSkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhlaWdodFwiKSB0ZW1wbGF0ZS5zZXRIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwcmV2X2hhc2hcIikgdGVtcGxhdGUuc2V0UHJldkhhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyZXNlcnZlZF9vZmZzZXRcIikgdGVtcGxhdGUuc2V0UmVzZXJ2ZWRPZmZzZXQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGF0dXNcIikge30gIC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW50cnVzdGVkXCIpIHt9ICAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNlZWRfaGVpZ2h0XCIpIHRlbXBsYXRlLnNldFNlZWRIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzZWVkX2hhc2hcIikgdGVtcGxhdGUuc2V0U2VlZEhhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJuZXh0X3NlZWRfaGFzaFwiKSB0ZW1wbGF0ZS5zZXROZXh0U2VlZEhhc2godmFsKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIGJsb2NrIHRlbXBsYXRlOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIGlmIChcIlwiID09PSB0ZW1wbGF0ZS5nZXROZXh0U2VlZEhhc2goKSkgdGVtcGxhdGUuc2V0TmV4dFNlZWRIYXNoKHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIHRlbXBsYXRlO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNJbmZvKHJwY0luZm8pIHtcbiAgICBpZiAoIXJwY0luZm8pIHJldHVybiB1bmRlZmluZWQ7XG4gICAgbGV0IGluZm8gPSBuZXcgTW9uZXJvRGFlbW9uSW5mbygpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNJbmZvKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY0luZm9ba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwidmVyc2lvblwiKSBpbmZvLnNldFZlcnNpb24odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbHRfYmxvY2tzX2NvdW50XCIpIGluZm8uc2V0TnVtQWx0QmxvY2tzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfc2l6ZV9saW1pdFwiKSBpbmZvLnNldEJsb2NrU2l6ZUxpbWl0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfc2l6ZV9tZWRpYW5cIikgaW5mby5zZXRCbG9ja1NpemVNZWRpYW4odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja193ZWlnaHRfbGltaXRcIikgaW5mby5zZXRCbG9ja1dlaWdodExpbWl0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfd2VpZ2h0X21lZGlhblwiKSBpbmZvLnNldEJsb2NrV2VpZ2h0TWVkaWFuKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYm9vdHN0cmFwX2RhZW1vbl9hZGRyZXNzXCIpIHsgaWYgKHZhbCkgaW5mby5zZXRCb290c3RyYXBEYWVtb25BZGRyZXNzKHZhbCk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5XCIpIHsgfSAgLy8gaGFuZGxlZCBieSB3aWRlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjdW11bGF0aXZlX2RpZmZpY3VsdHlcIikgeyB9IC8vIGhhbmRsZWQgYnkgd2lkZV9jdW11bGF0aXZlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5X3RvcDY0XCIpIHsgfSAgLy8gaGFuZGxlZCBieSB3aWRlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjdW11bGF0aXZlX2RpZmZpY3VsdHlfdG9wNjRcIikgeyB9IC8vIGhhbmRsZWQgYnkgd2lkZV9jdW11bGF0aXZlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3aWRlX2RpZmZpY3VsdHlcIikgaW5mby5zZXREaWZmaWN1bHR5KEdlblV0aWxzLnJlY29uY2lsZShpbmZvLmdldERpZmZpY3VsdHkoKSwgTW9uZXJvRGFlbW9uUnBjLnByZWZpeGVkSGV4VG9CSSh2YWwpKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2lkZV9jdW11bGF0aXZlX2RpZmZpY3VsdHlcIikgaW5mby5zZXRDdW11bGF0aXZlRGlmZmljdWx0eShHZW5VdGlscy5yZWNvbmNpbGUoaW5mby5nZXRDdW11bGF0aXZlRGlmZmljdWx0eSgpLCBNb25lcm9EYWVtb25ScGMucHJlZml4ZWRIZXhUb0JJKHZhbCkpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmcmVlX3NwYWNlXCIpIGluZm8uc2V0RnJlZVNwYWNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkYXRhYmFzZV9zaXplXCIpIGluZm8uc2V0RGF0YWJhc2VTaXplKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZ3JleV9wZWVybGlzdF9zaXplXCIpIGluZm8uc2V0TnVtT2ZmbGluZVBlZXJzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGVpZ2h0XCIpIGluZm8uc2V0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGVpZ2h0X3dpdGhvdXRfYm9vdHN0cmFwXCIpIGluZm8uc2V0SGVpZ2h0V2l0aG91dEJvb3RzdHJhcCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImluY29taW5nX2Nvbm5lY3Rpb25zX2NvdW50XCIpIGluZm8uc2V0TnVtSW5jb21pbmdDb25uZWN0aW9ucyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm9mZmxpbmVcIikgaW5mby5zZXRJc09mZmxpbmUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJvdXRnb2luZ19jb25uZWN0aW9uc19jb3VudFwiKSBpbmZvLnNldE51bU91dGdvaW5nQ29ubmVjdGlvbnModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJycGNfY29ubmVjdGlvbnNfY291bnRcIikgaW5mby5zZXROdW1ScGNDb25uZWN0aW9ucyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXJ0X3RpbWVcIikgaW5mby5zZXRTdGFydFRpbWVzdGFtcCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFkanVzdGVkX3RpbWVcIikgaW5mby5zZXRBZGp1c3RlZFRpbWVzdGFtcCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXR1c1wiKSB7fSAgLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0YXJnZXRcIikgaW5mby5zZXRUYXJnZXQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0YXJnZXRfaGVpZ2h0XCIpIGluZm8uc2V0VGFyZ2V0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidG9wX2Jsb2NrX2hhc2hcIikgaW5mby5zZXRUb3BCbG9ja0hhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9jb3VudFwiKSBpbmZvLnNldE51bVR4cyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X3Bvb2xfc2l6ZVwiKSBpbmZvLnNldE51bVR4c1Bvb2wodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bnRydXN0ZWRcIikge30gLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3YXNfYm9vdHN0cmFwX2V2ZXJfdXNlZFwiKSBpbmZvLnNldFdhc0Jvb3RzdHJhcEV2ZXJVc2VkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2hpdGVfcGVlcmxpc3Rfc2l6ZVwiKSBpbmZvLnNldE51bU9ubGluZVBlZXJzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidXBkYXRlX2F2YWlsYWJsZVwiKSBpbmZvLnNldFVwZGF0ZUF2YWlsYWJsZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm5ldHR5cGVcIikge1xuICAgICAgICBpbmZvLnNldElzUmVndGVzdCh2YWwgPT09IFwiZmFrZWNoYWluXCIpO1xuICAgICAgICBHZW5VdGlscy5zYWZlU2V0KGluZm8sIGluZm8uZ2V0TmV0d29ya1R5cGUsIGluZm8uc2V0TmV0d29ya1R5cGUsIHZhbCA9PT0gXCJmYWtlY2hhaW5cIiA/IE1vbmVyb05ldHdvcmtUeXBlLk1BSU5ORVQgOiBNb25lcm9OZXR3b3JrVHlwZS5wYXJzZSh2YWwpKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtYWlubmV0XCIpIHsgaWYgKHZhbCkgR2VuVXRpbHMuc2FmZVNldChpbmZvLCBpbmZvLmdldE5ldHdvcmtUeXBlLCBpbmZvLnNldE5ldHdvcmtUeXBlLCBNb25lcm9OZXR3b3JrVHlwZS5NQUlOTkVUKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRlc3RuZXRcIikgeyBpZiAodmFsKSBHZW5VdGlscy5zYWZlU2V0KGluZm8sIGluZm8uZ2V0TmV0d29ya1R5cGUsIGluZm8uc2V0TmV0d29ya1R5cGUsIE1vbmVyb05ldHdvcmtUeXBlLlRFU1RORVQpOyB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3RhZ2VuZXRcIikgeyBpZiAodmFsKSBHZW5VdGlscy5zYWZlU2V0KGluZm8sIGluZm8uZ2V0TmV0d29ya1R5cGUsIGluZm8uc2V0TmV0d29ya1R5cGUsIE1vbmVyb05ldHdvcmtUeXBlLlNUQUdFTkVUKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNyZWRpdHNcIikgaW5mby5zZXRDcmVkaXRzKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0b3BfYmxvY2tfaGFzaFwiIHx8IGtleSA9PT0gXCJ0b3BfaGFzaFwiKSBpbmZvLnNldFRvcEJsb2NrSGFzaChHZW5VdGlscy5yZWNvbmNpbGUoaW5mby5nZXRUb3BCbG9ja0hhc2goKSwgXCJcIiA9PT0gdmFsID8gdW5kZWZpbmVkIDogdmFsKSlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJidXN5X3N5bmNpbmdcIikgaW5mby5zZXRJc0J1c3lTeW5jaW5nKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3luY2hyb25pemVkXCIpIGluZm8uc2V0SXNTeW5jaHJvbml6ZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyZXN0cmljdGVkXCIpIGluZm8uc2V0SXNSZXN0cmljdGVkKHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogSWdub3JpbmcgdW5leHBlY3RlZCBpbmZvIGZpZWxkOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBpbmZvO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgc3luYyBpbmZvIGZyb20gUlBDIHN5bmMgaW5mby5cbiAgICogXG4gICAqIEBwYXJhbSBycGNTeW5jSW5mbyAtIHJwYyBtYXAgdG8gaW5pdGlhbGl6ZSB0aGUgc3luYyBpbmZvIGZyb21cbiAgICogQHJldHVybiB7TW9uZXJvRGFlbW9uU3luY0luZm99IGlzIHN5bmMgaW5mbyBpbml0aWFsaXplZCBmcm9tIHRoZSBtYXBcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1N5bmNJbmZvKHJwY1N5bmNJbmZvKSB7XG4gICAgbGV0IHN5bmNJbmZvID0gbmV3IE1vbmVyb0RhZW1vblN5bmNJbmZvKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1N5bmNJbmZvKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1N5bmNJbmZvW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImhlaWdodFwiKSBzeW5jSW5mby5zZXRIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwZWVyc1wiKSB7XG4gICAgICAgIHN5bmNJbmZvLnNldFBlZXJzKFtdKTtcbiAgICAgICAgbGV0IHJwY0Nvbm5lY3Rpb25zID0gdmFsO1xuICAgICAgICBmb3IgKGxldCBycGNDb25uZWN0aW9uIG9mIHJwY0Nvbm5lY3Rpb25zKSB7XG4gICAgICAgICAgc3luY0luZm8uZ2V0UGVlcnMoKS5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQ29ubmVjdGlvbihycGNDb25uZWN0aW9uLmluZm8pKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNwYW5zXCIpIHtcbiAgICAgICAgc3luY0luZm8uc2V0U3BhbnMoW10pO1xuICAgICAgICBsZXQgcnBjU3BhbnMgPSB2YWw7XG4gICAgICAgIGZvciAobGV0IHJwY1NwYW4gb2YgcnBjU3BhbnMpIHtcbiAgICAgICAgICBzeW5jSW5mby5nZXRTcGFucygpLnB1c2goTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNDb25uZWN0aW9uU3BhbihycGNTcGFuKSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoa2V5ID09PSBcInN0YXR1c1wiKSB7fSAgIC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidGFyZ2V0X2hlaWdodFwiKSBzeW5jSW5mby5zZXRUYXJnZXRIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJuZXh0X25lZWRlZF9wcnVuaW5nX3NlZWRcIikgc3luY0luZm8uc2V0TmV4dE5lZWRlZFBydW5pbmdTZWVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwib3ZlcnZpZXdcIikgeyAgLy8gdGhpcyByZXR1cm5zIFtdIHdpdGhvdXQgcHJ1bmluZ1xuICAgICAgICBsZXQgb3ZlcnZpZXc7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgb3ZlcnZpZXcgPSBKU09OLnBhcnNlKHZhbCk7XG4gICAgICAgICAgaWYgKG92ZXJ2aWV3ICE9PSB1bmRlZmluZWQgJiYgb3ZlcnZpZXcubGVuZ3RoID4gMCkgY29uc29sZS5lcnJvcihcIklnbm9yaW5nIG5vbi1lbXB0eSAnb3ZlcnZpZXcnIGZpZWxkIChub3QgaW1wbGVtZW50ZWQpOiBcIiArIG92ZXJ2aWV3KTsgLy8gVE9ET1xuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIHBhcnNlICdvdmVydmlldycgZmllbGQ6IFwiICsgb3ZlcnZpZXcgKyBcIjogXCIgKyBlLm1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3JlZGl0c1wiKSBzeW5jSW5mby5zZXRDcmVkaXRzKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0b3BfaGFzaFwiKSBzeW5jSW5mby5zZXRUb3BCbG9ja0hhc2goXCJcIiA9PT0gdmFsID8gdW5kZWZpbmVkIDogdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bnRydXN0ZWRcIikge30gIC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBzeW5jIGluZm86IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIHN5bmNJbmZvO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNIYXJkRm9ya0luZm8ocnBjSGFyZEZvcmtJbmZvKSB7XG4gICAgbGV0IGluZm8gPSBuZXcgTW9uZXJvSGFyZEZvcmtJbmZvKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY0hhcmRGb3JrSW5mbykpIHtcbiAgICAgIGxldCB2YWwgPSBycGNIYXJkRm9ya0luZm9ba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiZWFybGllc3RfaGVpZ2h0XCIpIGluZm8uc2V0RWFybGllc3RIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJlbmFibGVkXCIpIGluZm8uc2V0SXNFbmFibGVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3RhdGVcIikgaW5mby5zZXRTdGF0ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXR1c1wiKSB7fSAgICAgLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bnRydXN0ZWRcIikge30gIC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidGhyZXNob2xkXCIpIGluZm8uc2V0VGhyZXNob2xkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidmVyc2lvblwiKSBpbmZvLnNldFZlcnNpb24odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ2b3Rlc1wiKSBpbmZvLnNldE51bVZvdGVzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidm90aW5nXCIpIGluZm8uc2V0Vm90aW5nKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2luZG93XCIpIGluZm8uc2V0V2luZG93KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3JlZGl0c1wiKSBpbmZvLnNldENyZWRpdHMoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRvcF9oYXNoXCIpIGluZm8uc2V0VG9wQmxvY2tIYXNoKFwiXCIgPT09IHZhbCA/IHVuZGVmaW5lZCA6IHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBoYXJkIGZvcmsgaW5mbzogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gaW5mbztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjQ29ubmVjdGlvblNwYW4ocnBjQ29ubmVjdGlvblNwYW4pIHtcbiAgICBsZXQgc3BhbiA9IG5ldyBNb25lcm9Db25uZWN0aW9uU3BhbigpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNDb25uZWN0aW9uU3BhbikpIHtcbiAgICAgIGxldCB2YWwgPSBycGNDb25uZWN0aW9uU3BhbltrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJjb25uZWN0aW9uX2lkXCIpIHNwYW4uc2V0Q29ubmVjdGlvbklkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibmJsb2Nrc1wiKSBzcGFuLnNldE51bUJsb2Nrcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJhdGVcIikgc3Bhbi5zZXRSYXRlKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVtb3RlX2FkZHJlc3NcIikgeyBpZiAodmFsICE9PSBcIlwiKSBzcGFuLnNldFJlbW90ZUFkZHJlc3ModmFsKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNpemVcIikgc3Bhbi5zZXRTaXplKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3BlZWRcIikgc3Bhbi5zZXRTcGVlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXJ0X2Jsb2NrX2hlaWdodFwiKSBzcGFuLnNldFN0YXJ0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBkYWVtb24gY29ubmVjdGlvbiBzcGFuOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBzcGFuO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNPdXRwdXRIaXN0b2dyYW1FbnRyeShycGNFbnRyeSkge1xuICAgIGxldCBlbnRyeSA9IG5ldyBNb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeSgpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNFbnRyeSkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNFbnRyeVtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJhbW91bnRcIikgZW50cnkuc2V0QW1vdW50KEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0b3RhbF9pbnN0YW5jZXNcIikgZW50cnkuc2V0TnVtSW5zdGFuY2VzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5sb2NrZWRfaW5zdGFuY2VzXCIpIGVudHJ5LnNldE51bVVubG9ja2VkSW5zdGFuY2VzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVjZW50X2luc3RhbmNlc1wiKSBlbnRyeS5zZXROdW1SZWNlbnRJbnN0YW5jZXModmFsKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIG91dHB1dCBoaXN0b2dyYW06IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIGVudHJ5O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNTdWJtaXRUeFJlc3VsdChycGNSZXN1bHQpIHtcbiAgICBhc3NlcnQocnBjUmVzdWx0KTtcbiAgICBsZXQgcmVzdWx0ID0gbmV3IE1vbmVyb1N1Ym1pdFR4UmVzdWx0KCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1Jlc3VsdCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNSZXN1bHRba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiZG91YmxlX3NwZW5kXCIpIHJlc3VsdC5zZXRJc0RvdWJsZVNwZW5kU2Vlbih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImZlZV90b29fbG93XCIpIHJlc3VsdC5zZXRJc0ZlZVRvb0xvdyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImludmFsaWRfaW5wdXRcIikgcmVzdWx0LnNldEhhc0ludmFsaWRJbnB1dCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImludmFsaWRfb3V0cHV0XCIpIHJlc3VsdC5zZXRIYXNJbnZhbGlkT3V0cHV0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidG9vX2Zld19vdXRwdXRzXCIpIHJlc3VsdC5zZXRIYXNUb29GZXdPdXRwdXRzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibG93X21peGluXCIpIHJlc3VsdC5zZXRJc01peGluVG9vTG93KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibm90X3JlbGF5ZWRcIikgcmVzdWx0LnNldElzUmVsYXllZCghdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJvdmVyc3BlbmRcIikgcmVzdWx0LnNldElzT3ZlcnNwZW5kKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVhc29uXCIpIHJlc3VsdC5zZXRSZWFzb24odmFsID09PSBcIlwiID8gdW5kZWZpbmVkIDogdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0b29fYmlnXCIpIHJlc3VsdC5zZXRJc1Rvb0JpZyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNhbml0eV9jaGVja19mYWlsZWRcIikgcmVzdWx0LnNldFNhbml0eUNoZWNrRmFpbGVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3JlZGl0c1wiKSByZXN1bHQuc2V0Q3JlZGl0cyhCaWdJbnQodmFsKSlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGF0dXNcIiB8fCBrZXkgPT09IFwidW50cnVzdGVkXCIpIHt9ICAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRvcF9oYXNoXCIpIHJlc3VsdC5zZXRUb3BCbG9ja0hhc2goXCJcIiA9PT0gdmFsID8gdW5kZWZpbmVkIDogdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9leHRyYV90b29fYmlnXCIpIHJlc3VsdC5zZXRJc1R4RXh0cmFUb29CaWcodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJub256ZXJvX3VubG9ja190aW1lXCIpIHJlc3VsdC5zZXRJc05vbnplcm9VbmxvY2tUaW1lKHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBzdWJtaXQgdHggaGV4IHJlc3VsdDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNUeFBvb2xTdGF0cyhycGNTdGF0cykge1xuICAgIGFzc2VydChycGNTdGF0cyk7XG4gICAgbGV0IHN0YXRzID0gbmV3IE1vbmVyb1R4UG9vbFN0YXRzKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1N0YXRzKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1N0YXRzW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImJ5dGVzX21heFwiKSBzdGF0cy5zZXRCeXRlc01heCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJ5dGVzX21lZFwiKSBzdGF0cy5zZXRCeXRlc01lZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJ5dGVzX21pblwiKSBzdGF0cy5zZXRCeXRlc01pbih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJ5dGVzX3RvdGFsXCIpIHN0YXRzLnNldEJ5dGVzVG90YWwodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJoaXN0b185OHBjXCIpIHN0YXRzLnNldEhpc3RvOThwYyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm51bV8xMG1cIikgc3RhdHMuc2V0TnVtMTBtKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibnVtX2RvdWJsZV9zcGVuZHNcIikgc3RhdHMuc2V0TnVtRG91YmxlU3BlbmRzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibnVtX2ZhaWxpbmdcIikgc3RhdHMuc2V0TnVtRmFpbGluZyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm51bV9ub3RfcmVsYXllZFwiKSBzdGF0cy5zZXROdW1Ob3RSZWxheWVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwib2xkZXN0XCIpIHN0YXRzLnNldE9sZGVzdFRpbWVzdGFtcCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4c190b3RhbFwiKSBzdGF0cy5zZXROdW1UeHModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmZWVfdG90YWxcIikgc3RhdHMuc2V0RmVlVG90YWwoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhpc3RvXCIpIHtcbiAgICAgICAgc3RhdHMuc2V0SGlzdG8obmV3IE1hcCgpKTtcbiAgICAgICAgZm9yIChsZXQgZWxlbSBvZiB2YWwpIHN0YXRzLmdldEhpc3RvKCkuc2V0KGVsZW0uYnl0ZXMsIGVsZW0udHhzKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIHR4IHBvb2wgc3RhdHM6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG5cbiAgICAvLyB1bmluaXRpYWxpemUgc29tZSBzdGF0cyBpZiBub3QgYXBwbGljYWJsZVxuICAgIGlmIChzdGF0cy5nZXRIaXN0bzk4cGMoKSA9PT0gMCkgc3RhdHMuc2V0SGlzdG85OHBjKHVuZGVmaW5lZCk7XG4gICAgaWYgKHN0YXRzLmdldE51bVR4cygpID09PSAwKSB7XG4gICAgICBzdGF0cy5zZXRCeXRlc01pbih1bmRlZmluZWQpO1xuICAgICAgc3RhdHMuc2V0Qnl0ZXNNZWQodW5kZWZpbmVkKTtcbiAgICAgIHN0YXRzLnNldEJ5dGVzTWF4KHVuZGVmaW5lZCk7XG4gICAgICBzdGF0cy5zZXRIaXN0bzk4cGModW5kZWZpbmVkKTtcbiAgICAgIHN0YXRzLnNldE9sZGVzdFRpbWVzdGFtcCh1bmRlZmluZWQpO1xuICAgIH1cblxuICAgIHJldHVybiBzdGF0cztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjQWx0Q2hhaW4ocnBjQ2hhaW4pIHtcbiAgICBhc3NlcnQocnBjQ2hhaW4pO1xuICAgIGxldCBjaGFpbiA9IG5ldyBNb25lcm9BbHRDaGFpbigpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNDaGFpbikpIHtcbiAgICAgIGxldCB2YWwgPSBycGNDaGFpbltrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJibG9ja19oYXNoXCIpIHt9ICAvLyB1c2luZyBibG9ja19oYXNoZXMgaW5zdGVhZFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRpZmZpY3VsdHlcIikgeyB9IC8vIGhhbmRsZWQgYnkgd2lkZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGlmZmljdWx0eV90b3A2NFwiKSB7IH0gIC8vIGhhbmRsZWQgYnkgd2lkZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2lkZV9kaWZmaWN1bHR5XCIpIGNoYWluLnNldERpZmZpY3VsdHkoR2VuVXRpbHMucmVjb25jaWxlKGNoYWluLmdldERpZmZpY3VsdHkoKSwgTW9uZXJvRGFlbW9uUnBjLnByZWZpeGVkSGV4VG9CSSh2YWwpKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGVpZ2h0XCIpIGNoYWluLnNldEhlaWdodCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxlbmd0aFwiKSBjaGFpbi5zZXRMZW5ndGgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja19oYXNoZXNcIikgY2hhaW4uc2V0QmxvY2tIYXNoZXModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtYWluX2NoYWluX3BhcmVudF9ibG9ja1wiKSBjaGFpbi5zZXRNYWluQ2hhaW5QYXJlbnRCbG9ja0hhc2godmFsKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIGFsdGVybmF0aXZlIGNoYWluOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBjaGFpbjtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjUGVlcihycGNQZWVyKSB7XG4gICAgYXNzZXJ0KHJwY1BlZXIpO1xuICAgIGxldCBwZWVyID0gbmV3IE1vbmVyb1BlZXIoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjUGVlcikpIHtcbiAgICAgIGxldCB2YWwgPSBycGNQZWVyW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImhvc3RcIikgcGVlci5zZXRIb3N0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaWRcIikgcGVlci5zZXRJZChcIlwiICsgdmFsKTsgIC8vIFRPRE8gbW9uZXJvLXdhbGxldC1ycGM6IHBlZXIgaWQgaXMgQmlnSW50IGJ1dCBzdHJpbmcgaW4gYGdldF9jb25uZWN0aW9uc2BcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJpcFwiKSB7fSAvLyBob3N0IHVzZWQgaW5zdGVhZCB3aGljaCBpcyBjb25zaXN0ZW50bHkgYSBzdHJpbmdcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsYXN0X3NlZW5cIikgcGVlci5zZXRMYXN0U2VlblRpbWVzdGFtcCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBvcnRcIikgcGVlci5zZXRQb3J0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicnBjX3BvcnRcIikgcGVlci5zZXRScGNQb3J0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHJ1bmluZ19zZWVkXCIpIHBlZXIuc2V0UHJ1bmluZ1NlZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJycGNfY3JlZGl0c19wZXJfaGFzaFwiKSBwZWVyLnNldFJwY0NyZWRpdHNQZXJIYXNoKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIHJwYyBwZWVyOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBwZWVyO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNDb25uZWN0aW9uKHJwY0Nvbm5lY3Rpb24pIHtcbiAgICBsZXQgcGVlciA9IG5ldyBNb25lcm9QZWVyKCk7XG4gICAgcGVlci5zZXRJc09ubGluZSh0cnVlKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjQ29ubmVjdGlvbikpIHtcbiAgICAgIGxldCB2YWwgPSBycGNDb25uZWN0aW9uW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImFkZHJlc3NcIikgcGVlci5zZXRBZGRyZXNzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYXZnX2Rvd25sb2FkXCIpIHBlZXIuc2V0QXZnRG93bmxvYWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhdmdfdXBsb2FkXCIpIHBlZXIuc2V0QXZnVXBsb2FkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY29ubmVjdGlvbl9pZFwiKSBwZWVyLnNldElkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3VycmVudF9kb3dubG9hZFwiKSBwZWVyLnNldEN1cnJlbnREb3dubG9hZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImN1cnJlbnRfdXBsb2FkXCIpIHBlZXIuc2V0Q3VycmVudFVwbG9hZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhlaWdodFwiKSBwZWVyLnNldEhlaWdodCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhvc3RcIikgcGVlci5zZXRIb3N0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaXBcIikge30gLy8gaG9zdCB1c2VkIGluc3RlYWQgd2hpY2ggaXMgY29uc2lzdGVudGx5IGEgc3RyaW5nXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaW5jb21pbmdcIikgcGVlci5zZXRJc0luY29taW5nKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibGl2ZV90aW1lXCIpIHBlZXIuc2V0TGl2ZVRpbWUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsb2NhbF9pcFwiKSBwZWVyLnNldElzTG9jYWxJcCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxvY2FsaG9zdFwiKSBwZWVyLnNldElzTG9jYWxIb3N0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicGVlcl9pZFwiKSBwZWVyLnNldElkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicG9ydFwiKSBwZWVyLnNldFBvcnQocGFyc2VJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicnBjX3BvcnRcIikgcGVlci5zZXRScGNQb3J0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVjdl9jb3VudFwiKSBwZWVyLnNldE51bVJlY2VpdmVzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVjdl9pZGxlX3RpbWVcIikgcGVlci5zZXRSZWNlaXZlSWRsZVRpbWUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzZW5kX2NvdW50XCIpIHBlZXIuc2V0TnVtU2VuZHModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzZW5kX2lkbGVfdGltZVwiKSBwZWVyLnNldFNlbmRJZGxlVGltZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXRlXCIpIHBlZXIuc2V0U3RhdGUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdXBwb3J0X2ZsYWdzXCIpIHBlZXIuc2V0TnVtU3VwcG9ydEZsYWdzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHJ1bmluZ19zZWVkXCIpIHBlZXIuc2V0UHJ1bmluZ1NlZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJycGNfY3JlZGl0c19wZXJfaGFzaFwiKSBwZWVyLnNldFJwY0NyZWRpdHNQZXJIYXNoKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhZGRyZXNzX3R5cGVcIikgcGVlci5zZXRUeXBlKHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBwZWVyOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBwZWVyO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRUb1JwY0JhbihiYW46IE1vbmVyb0Jhbikge1xuICAgIGxldCBycGNCYW46IGFueSA9IHt9O1xuICAgIHJwY0Jhbi5ob3N0ID0gYmFuLmdldEhvc3QoKTtcbiAgICBycGNCYW4uaXAgPSBiYW4uZ2V0SXAoKTtcbiAgICBycGNCYW4uYmFuID0gYmFuLmdldElzQmFubmVkKCk7XG4gICAgcnBjQmFuLnNlY29uZHMgPSBiYW4uZ2V0U2Vjb25kcygpO1xuICAgIHJldHVybiBycGNCYW47XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY01pbmluZ1N0YXR1cyhycGNTdGF0dXMpIHtcbiAgICBsZXQgc3RhdHVzID0gbmV3IE1vbmVyb01pbmluZ1N0YXR1cygpO1xuICAgIHN0YXR1cy5zZXRJc0FjdGl2ZShycGNTdGF0dXMuYWN0aXZlKTtcbiAgICBzdGF0dXMuc2V0U3BlZWQocnBjU3RhdHVzLnNwZWVkKTtcbiAgICBzdGF0dXMuc2V0TnVtVGhyZWFkcyhycGNTdGF0dXMudGhyZWFkc19jb3VudCk7XG4gICAgaWYgKHJwY1N0YXR1cy5hY3RpdmUpIHtcbiAgICAgIHN0YXR1cy5zZXRBZGRyZXNzKHJwY1N0YXR1cy5hZGRyZXNzKTtcbiAgICAgIHN0YXR1cy5zZXRJc0JhY2tncm91bmQocnBjU3RhdHVzLmlzX2JhY2tncm91bmRfbWluaW5nX2VuYWJsZWQpO1xuICAgIH1cbiAgICByZXR1cm4gc3RhdHVzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNVcGRhdGVDaGVja1Jlc3VsdChycGNSZXN1bHQpIHtcbiAgICBhc3NlcnQocnBjUmVzdWx0KTtcbiAgICBsZXQgcmVzdWx0ID0gbmV3IE1vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0KCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1Jlc3VsdCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNSZXN1bHRba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYXV0b191cmlcIikgcmVzdWx0LnNldEF1dG9VcmkodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJoYXNoXCIpIHJlc3VsdC5zZXRIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicGF0aFwiKSB7fSAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXR1c1wiKSB7fSAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVwZGF0ZVwiKSByZXN1bHQuc2V0SXNVcGRhdGVBdmFpbGFibGUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1c2VyX3VyaVwiKSByZXN1bHQuc2V0VXNlclVyaSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInZlcnNpb25cIikgcmVzdWx0LnNldFZlcnNpb24odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bnRydXN0ZWRcIikge30gLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIHJwYyBjaGVjayB1cGRhdGUgcmVzdWx0OiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIGlmIChyZXN1bHQuZ2V0QXV0b1VyaSgpID09PSBcIlwiKSByZXN1bHQuc2V0QXV0b1VyaSh1bmRlZmluZWQpO1xuICAgIGlmIChyZXN1bHQuZ2V0VXNlclVyaSgpID09PSBcIlwiKSByZXN1bHQuc2V0VXNlclVyaSh1bmRlZmluZWQpO1xuICAgIGlmIChyZXN1bHQuZ2V0VmVyc2lvbigpID09PSBcIlwiKSByZXN1bHQuc2V0VmVyc2lvbih1bmRlZmluZWQpO1xuICAgIGlmIChyZXN1bHQuZ2V0SGFzaCgpID09PSBcIlwiKSByZXN1bHQuc2V0SGFzaCh1bmRlZmluZWQpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1VwZGF0ZURvd25sb2FkUmVzdWx0KHJwY1Jlc3VsdCkge1xuICAgIGxldCByZXN1bHQgPSBuZXcgTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQoTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNVcGRhdGVDaGVja1Jlc3VsdChycGNSZXN1bHQpIGFzIE1vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0KTtcbiAgICByZXN1bHQuc2V0RG93bmxvYWRQYXRoKHJwY1Jlc3VsdFtcInBhdGhcIl0pO1xuICAgIGlmIChyZXN1bHQuZ2V0RG93bmxvYWRQYXRoKCkgPT09IFwiXCIpIHJlc3VsdC5zZXREb3dubG9hZFBhdGgodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGEgJzB4JyBwcmVmaXhlZCBoZXhpZGVjaW1hbCBzdHJpbmcgdG8gYSBiaWdpbnQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gaGV4IGlzIHRoZSAnMHgnIHByZWZpeGVkIGhleGlkZWNpbWFsIHN0cmluZyB0byBjb252ZXJ0XG4gICAqIEByZXR1cm4ge2JpZ2ludH0gdGhlIGhleGljZWRpbWFsIGNvbnZlcnRlZCB0byBkZWNpbWFsXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIHByZWZpeGVkSGV4VG9CSShoZXgpIHtcbiAgICBhc3NlcnQoaGV4LnN1YnN0cmluZygwLCAyKSA9PT0gXCIweFwiKTtcbiAgICByZXR1cm4gQmlnSW50KGhleCk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbXBsZW1lbnRzIGEgTW9uZXJvRGFlbW9uIGJ5IHByb3h5aW5nIHJlcXVlc3RzIHRvIGEgd29ya2VyLlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBNb25lcm9EYWVtb25ScGNQcm94eSB7XG5cbiAgLy8gc3RhdGUgdmFyaWFibGVzXG4gIHByaXZhdGUgZGFlbW9uSWQ6IGFueTtcbiAgcHJpdmF0ZSB3b3JrZXI6IGFueTtcbiAgcHJpdmF0ZSB3cmFwcGVkTGlzdGVuZXJzOiBhbnk7XG4gIHByaXZhdGUgcHJvY2VzczogYW55O1xuXG4gIGNvbnN0cnVjdG9yKGRhZW1vbklkLCB3b3JrZXIpIHtcbiAgICB0aGlzLmRhZW1vbklkID0gZGFlbW9uSWQ7XG4gICAgdGhpcy53b3JrZXIgPSB3b3JrZXI7XG4gICAgdGhpcy53cmFwcGVkTGlzdGVuZXJzID0gW107XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBTVEFUSUMgVVRJTElUSUVTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICBzdGF0aWMgYXN5bmMgY29ubmVjdChjb25maWc6IE1vbmVyb0RhZW1vbkNvbmZpZykge1xuICAgIGxldCBkYWVtb25JZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICBjb25maWcgPSBPYmplY3QuYXNzaWduKHt9LCBjb25maWcudG9Kc29uKCksIHtwcm94eVRvV29ya2VyOiBmYWxzZX0pO1xuICAgIGF3YWl0IExpYnJhcnlVdGlscy5pbnZva2VXb3JrZXIoZGFlbW9uSWQsIFwiY29ubmVjdERhZW1vblJwY1wiLCBbY29uZmlnXSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9EYWVtb25ScGNQcm94eShkYWVtb25JZCwgYXdhaXQgTGlicmFyeVV0aWxzLmdldFdvcmtlcigpKTtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBJTlNUQU5DRSBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIGFzeW5jIGFkZExpc3RlbmVyKGxpc3RlbmVyKSB7XG4gICAgbGV0IHdyYXBwZWRMaXN0ZW5lciA9IG5ldyBEYWVtb25Xb3JrZXJMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgbGV0IGxpc3RlbmVySWQgPSB3cmFwcGVkTGlzdGVuZXIuZ2V0SWQoKTtcbiAgICBMaWJyYXJ5VXRpbHMuYWRkV29ya2VyQ2FsbGJhY2sodGhpcy5kYWVtb25JZCwgXCJvbkJsb2NrSGVhZGVyX1wiICsgbGlzdGVuZXJJZCwgW3dyYXBwZWRMaXN0ZW5lci5vbkJsb2NrSGVhZGVyLCB3cmFwcGVkTGlzdGVuZXJdKTtcbiAgICB0aGlzLndyYXBwZWRMaXN0ZW5lcnMucHVzaCh3cmFwcGVkTGlzdGVuZXIpO1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkFkZExpc3RlbmVyXCIsIFtsaXN0ZW5lcklkXSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndyYXBwZWRMaXN0ZW5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLndyYXBwZWRMaXN0ZW5lcnNbaV0uZ2V0TGlzdGVuZXIoKSA9PT0gbGlzdGVuZXIpIHtcbiAgICAgICAgbGV0IGxpc3RlbmVySWQgPSB0aGlzLndyYXBwZWRMaXN0ZW5lcnNbaV0uZ2V0SWQoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25SZW1vdmVMaXN0ZW5lclwiLCBbbGlzdGVuZXJJZF0pO1xuICAgICAgICBMaWJyYXJ5VXRpbHMucmVtb3ZlV29ya2VyQ2FsbGJhY2sodGhpcy5kYWVtb25JZCwgXCJvbkJsb2NrSGVhZGVyX1wiICsgbGlzdGVuZXJJZCk7XG4gICAgICAgIHRoaXMud3JhcHBlZExpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTGlzdGVuZXIgaXMgbm90IHJlZ2lzdGVyZWQgd2l0aCBkYWVtb25cIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldExpc3RlbmVycygpIHtcbiAgICBsZXQgbGlzdGVuZXJzID0gW107XG4gICAgZm9yIChsZXQgd3JhcHBlZExpc3RlbmVyIG9mIHRoaXMud3JhcHBlZExpc3RlbmVycykgbGlzdGVuZXJzLnB1c2god3JhcHBlZExpc3RlbmVyLmdldExpc3RlbmVyKCkpO1xuICAgIHJldHVybiBsaXN0ZW5lcnM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFJwY0Nvbm5lY3Rpb24oKSB7XG4gICAgbGV0IGNvbmZpZyA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0UnBjQ29ubmVjdGlvblwiKTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24oY29uZmlnIGFzIFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4pO1xuICB9XG4gIFxuICBhc3luYyBpc0Nvbm5lY3RlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25Jc0Nvbm5lY3RlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VmVyc2lvbigpIHtcbiAgICBsZXQgdmVyc2lvbkpzb246IGFueSA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0VmVyc2lvblwiKTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1ZlcnNpb24odmVyc2lvbkpzb24ubnVtYmVyLCB2ZXJzaW9uSnNvbi5pc1JlbGVhc2UpO1xuICB9XG4gIFxuICBhc3luYyBpc1RydXN0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uSXNUcnVzdGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRIZWlnaHQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0SGVpZ2h0XCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0hhc2goaGVpZ2h0KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tIYXNoXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrVGVtcGxhdGUod2FsbGV0QWRkcmVzcywgcmVzZXJ2ZVNpemUpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0Jsb2NrVGVtcGxhdGUoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja1RlbXBsYXRlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBnZXRMYXN0QmxvY2tIZWFkZXIoKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9CbG9ja0hlYWRlcihhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldExhc3RCbG9ja0hlYWRlclwiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrSGVhZGVyQnlIYXNoKGJsb2NrSGFzaCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja0hlYWRlckJ5SGFzaFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tIZWFkZXJCeUhlaWdodChoZWlnaHQpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tIZWFkZXJCeUhlaWdodFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tIZWFkZXJzQnlSYW5nZShzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSB7XG4gICAgbGV0IGJsb2NrSGVhZGVyc0pzb246IGFueVtdID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja0hlYWRlcnNCeVJhbmdlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkgYXMgYW55W107XG4gICAgbGV0IGhlYWRlcnMgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0hlYWRlckpzb24gb2YgYmxvY2tIZWFkZXJzSnNvbikgaGVhZGVycy5wdXNoKG5ldyBNb25lcm9CbG9ja0hlYWRlcihibG9ja0hlYWRlckpzb24pKTtcbiAgICByZXR1cm4gaGVhZGVycztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tCeUhhc2goYmxvY2tIYXNoKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9CbG9jayhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2NrQnlIYXNoXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSksIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFgpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja3NCeUhhc2goYmxvY2tIYXNoZXMsIHN0YXJ0SGVpZ2h0LCBwcnVuZSkge1xuICAgIGxldCBibG9ja3NKc29uOiBhbnlbXSA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tzQnlIYXNoXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkgYXMgYW55W107XG4gICAgbGV0IGJsb2NrcyA9IFtdO1xuICAgIGZvciAobGV0IGJsb2NrSnNvbiBvZiBibG9ja3NKc29uKSBibG9ja3MucHVzaChuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uKSk7XG4gICAgcmV0dXJuIGJsb2NrcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tCeUhlaWdodChoZWlnaHQpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0Jsb2NrKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tCeUhlaWdodFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpLCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tzQnlIZWlnaHQoaGVpZ2h0cykge1xuICAgIGxldCBibG9ja3NKc29uOiBhbnlbXT0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja3NCeUhlaWdodFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpIGFzIGFueVtdO1xuICAgIGxldCBibG9ja3MgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0pzb24gb2YgYmxvY2tzSnNvbikgYmxvY2tzLnB1c2gobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWCkpO1xuICAgIHJldHVybiBibG9ja3M7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2Nrc0J5UmFuZ2Uoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCkge1xuICAgIGxldCBibG9ja3NKc29uOiBhbnlbXSA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tzQnlSYW5nZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpIGFzIGFueVtdO1xuICAgIGxldCBibG9ja3MgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0pzb24gb2YgYmxvY2tzSnNvbikgYmxvY2tzLnB1c2gobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWCkpO1xuICAgIHJldHVybiBibG9ja3M7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2Nrc0J5UmFuZ2VDaHVua2VkKHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIG1heENodW5rU2l6ZSkge1xuICAgIGxldCBibG9ja3NKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja3NCeVJhbmdlQ2h1bmtlZFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpIGFzIGFueVtdO1xuICAgIGxldCBibG9ja3MgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0pzb24gb2YgYmxvY2tzSnNvbikgYmxvY2tzLnB1c2gobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWCkpO1xuICAgIHJldHVybiBibG9ja3M7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrSGFzaGVzKGJsb2NrSGFzaGVzLCBzdGFydEhlaWdodCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2NrSGFzaGVzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4cyh0eEhhc2hlcywgcHJ1bmUgPSBmYWxzZSkge1xuICAgIFxuICAgIC8vIGRlc2VyaWFsaXplIHR4cyBmcm9tIGJsb2Nrc1xuICAgIGxldCBibG9ja3MgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0pzb24gb2YgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRUeHNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSBhcyBhbnlbXSkge1xuICAgICAgYmxvY2tzLnB1c2gobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWCkpO1xuICAgIH1cbiAgICBcbiAgICAvLyBjb2xsZWN0IHR4c1xuICAgIGxldCB0eHMgPSBbXTtcbiAgICBmb3IgKGxldCBibG9jayBvZiBibG9ja3MpIHtcbiAgICAgIGZvciAobGV0IHR4IG9mIGJsb2NrLmdldFR4cygpKSB7XG4gICAgICAgIGlmICghdHguZ2V0SXNDb25maXJtZWQoKSkgdHguc2V0QmxvY2sodW5kZWZpbmVkKTtcbiAgICAgICAgdHhzLnB1c2godHgpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHhzO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeEhleGVzKHR4SGFzaGVzLCBwcnVuZSA9IGZhbHNlKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0VHhIZXhlc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRNaW5lclR4U3VtKGhlaWdodCwgbnVtQmxvY2tzKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9NaW5lclR4U3VtKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0TWluZXJUeFN1bVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RmVlRXN0aW1hdGUoZ3JhY2VCbG9ja3M/KSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9GZWVFc3RpbWF0ZShhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEZlZUVzdGltYXRlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBzdWJtaXRUeEhleCh0eEhleCwgZG9Ob3RSZWxheSkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvU3VibWl0VHhSZXN1bHQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TdWJtaXRUeEhleFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVsYXlUeHNCeUhhc2godHhIYXNoZXMpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25SZWxheVR4c0J5SGFzaFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFBvb2woKSB7XG4gICAgbGV0IGJsb2NrSnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0VHhQb29sXCIpO1xuICAgIGxldCB0eHMgPSBuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uLCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYKS5nZXRUeHMoKTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHR4LnNldEJsb2NrKHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIHR4cyA/IHR4cyA6IFtdO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFBvb2xIYXNoZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0VHhQb29sSGFzaGVzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4UG9vbEJhY2tsb2coKSB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFBvb2xTdGF0cygpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1R4UG9vbFN0YXRzKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0VHhQb29sU3RhdHNcIikpO1xuICB9XG4gIFxuICBhc3luYyBmbHVzaFR4UG9vbChoYXNoZXMpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25GbHVzaFR4UG9vbFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRLZXlJbWFnZVNwZW50U3RhdHVzZXMoa2V5SW1hZ2VzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dHMob3V0cHV0cyk6IFByb21pc2U8TW9uZXJvT3V0cHV0W10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dEhpc3RvZ3JhbShhbW91bnRzLCBtaW5Db3VudCwgbWF4Q291bnQsIGlzVW5sb2NrZWQsIHJlY2VudEN1dG9mZikge1xuICAgIGxldCBlbnRyaWVzID0gW107XG4gICAgZm9yIChsZXQgZW50cnlKc29uIG9mIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0T3V0cHV0SGlzdG9ncmFtXCIsIFthbW91bnRzLCBtaW5Db3VudCwgbWF4Q291bnQsIGlzVW5sb2NrZWQsIHJlY2VudEN1dG9mZl0pIGFzIGFueVtdKSB7XG4gICAgICBlbnRyaWVzLnB1c2gobmV3IE1vbmVyb091dHB1dEhpc3RvZ3JhbUVudHJ5KGVudHJ5SnNvbikpO1xuICAgIH1cbiAgICByZXR1cm4gZW50cmllcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0T3V0cHV0RGlzdHJpYnV0aW9uKGFtb3VudHMsIGN1bXVsYXRpdmUsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpIHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEluZm8oKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9EYWVtb25JbmZvKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0SW5mb1wiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFN5bmNJbmZvKCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvRGFlbW9uU3luY0luZm8oYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRTeW5jSW5mb1wiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhhcmRGb3JrSW5mbygpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0hhcmRGb3JrSW5mbyhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEhhcmRGb3JrSW5mb1wiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFsdENoYWlucygpIHtcbiAgICBsZXQgYWx0Q2hhaW5zID0gW107XG4gICAgZm9yIChsZXQgYWx0Q2hhaW5Kc29uIG9mIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QWx0Q2hhaW5zXCIpIGFzIGFueSkgYWx0Q2hhaW5zLnB1c2gobmV3IE1vbmVyb0FsdENoYWluKGFsdENoYWluSnNvbikpO1xuICAgIHJldHVybiBhbHRDaGFpbnM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFsdEJsb2NrSGFzaGVzKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEFsdEJsb2NrSGFzaGVzXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXREb3dubG9hZExpbWl0KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldERvd25sb2FkTGltaXRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIHNldERvd25sb2FkTGltaXQobGltaXQpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TZXREb3dubG9hZExpbWl0XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2V0RG93bmxvYWRMaW1pdCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25SZXNldERvd25sb2FkTGltaXRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFVwbG9hZExpbWl0KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFVwbG9hZExpbWl0XCIpO1xuICB9XG4gIFxuICBhc3luYyBzZXRVcGxvYWRMaW1pdChsaW1pdCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblNldFVwbG9hZExpbWl0XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2V0VXBsb2FkTGltaXQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uUmVzZXRVcGxvYWRMaW1pdFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGVlcnMoKSB7XG4gICAgbGV0IHBlZXJzID0gW107XG4gICAgZm9yIChsZXQgcGVlckpzb24gb2YgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRQZWVyc1wiKSBhcyBhbnkpIHBlZXJzLnB1c2gobmV3IE1vbmVyb1BlZXIocGVlckpzb24pKTtcbiAgICByZXR1cm4gcGVlcnM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEtub3duUGVlcnMoKSB7XG4gICAgbGV0IHBlZXJzID0gW107XG4gICAgZm9yIChsZXQgcGVlckpzb24gb2YgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRLbm93blBlZXJzXCIpIGFzIGFueSkgcGVlcnMucHVzaChuZXcgTW9uZXJvUGVlcihwZWVySnNvbikpO1xuICAgIHJldHVybiBwZWVycztcbiAgfVxuICBcbiAgYXN5bmMgc2V0T3V0Z29pbmdQZWVyTGltaXQobGltaXQpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TZXRJbmNvbWluZ1BlZXJMaW1pdFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBzZXRJbmNvbWluZ1BlZXJMaW1pdChsaW1pdCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblNldEluY29taW5nUGVlckxpbWl0XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBlZXJCYW5zKCkge1xuICAgIGxldCBiYW5zID0gW107XG4gICAgZm9yIChsZXQgYmFuSnNvbiBvZiBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFBlZXJCYW5zXCIpIGFzIGFueSkgYmFucy5wdXNoKG5ldyBNb25lcm9CYW4oYmFuSnNvbikpO1xuICAgIHJldHVybiBiYW5zO1xuICB9XG5cbiAgYXN5bmMgc2V0UGVlckJhbnMoYmFucykge1xuICAgIGxldCBiYW5zSnNvbiA9IFtdO1xuICAgIGZvciAobGV0IGJhbiBvZiBiYW5zKSBiYW5zSnNvbi5wdXNoKGJhbi50b0pzb24oKSk7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uU2V0UGVlckJhbnNcIiwgW2JhbnNKc29uXSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0YXJ0TWluaW5nKGFkZHJlc3MsIG51bVRocmVhZHMsIGlzQmFja2dyb3VuZCwgaWdub3JlQmF0dGVyeSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblN0YXJ0TWluaW5nXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0b3BNaW5pbmcoKSB7XG4gICAgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TdG9wTWluaW5nXCIpXG4gIH1cbiAgXG4gIGFzeW5jIGdldE1pbmluZ1N0YXR1cygpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb01pbmluZ1N0YXR1cyhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldE1pbmluZ1N0YXR1c1wiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdEJsb2NrcyhibG9ja0Jsb2JzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uU3VibWl0QmxvY2tzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cblxuICBhc3luYyBwcnVuZUJsb2NrY2hhaW4oY2hlY2spIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1BydW5lUmVzdWx0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uUHJ1bmVCbG9ja2NoYWluXCIpKTtcbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tGb3JVcGRhdGUoKTogUHJvbWlzZTxNb25lcm9EYWVtb25VcGRhdGVDaGVja1Jlc3VsdD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZG93bmxvYWRVcGRhdGUocGF0aCk6IFByb21pc2U8TW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIHN0b3AoKSB7XG4gICAgd2hpbGUgKHRoaXMud3JhcHBlZExpc3RlbmVycy5sZW5ndGgpIGF3YWl0IHRoaXMucmVtb3ZlTGlzdGVuZXIodGhpcy53cmFwcGVkTGlzdGVuZXJzWzBdLmdldExpc3RlbmVyKCkpO1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblN0b3BcIik7XG4gIH1cbiAgXG4gIGFzeW5jIHdhaXRGb3JOZXh0QmxvY2tIZWFkZXIoKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9CbG9ja0hlYWRlcihhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbldhaXRGb3JOZXh0QmxvY2tIZWFkZXJcIikpO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUFJJVkFURSBIRUxQRVJTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgLy8gVE9ETzogZHVwbGljYXRlZCB3aXRoIE1vbmVyb1dhbGxldEZ1bGxQcm94eVxuICBwcm90ZWN0ZWQgYXN5bmMgaW52b2tlV29ya2VyKGZuTmFtZTogc3RyaW5nLCBhcmdzPzogYW55KSB7XG4gICAgcmV0dXJuIExpYnJhcnlVdGlscy5pbnZva2VXb3JrZXIodGhpcy5kYWVtb25JZCwgZm5OYW1lLCBhcmdzKTtcbiAgfVxufVxuXG4vKipcbiAqIFBvbGxzIGEgTW9uZXJvIGRhZW1vbiBmb3IgdXBkYXRlcyBhbmQgbm90aWZpZXMgbGlzdGVuZXJzIGFzIHRoZXkgb2NjdXIuXG4gKiBcbiAqIEBwcml2YXRlXG4gKi9cbmNsYXNzIERhZW1vblBvbGxlciB7XG5cbiAgcHJvdGVjdGVkIGRhZW1vbjogTW9uZXJvRGFlbW9uUnBjO1xuICBwcm90ZWN0ZWQgbG9vcGVyOiBUYXNrTG9vcGVyO1xuICBwcm90ZWN0ZWQgaXNQb2xsaW5nOiBib29sZWFuO1xuICBwcm90ZWN0ZWQgbGFzdEhlYWRlcjogTW9uZXJvQmxvY2tIZWFkZXI7XG5cbiAgY29uc3RydWN0b3IoZGFlbW9uKSB7XG4gICAgbGV0IHRoYXQgPSB0aGlzO1xuICAgIHRoaXMuZGFlbW9uID0gZGFlbW9uO1xuICAgIHRoaXMubG9vcGVyID0gbmV3IFRhc2tMb29wZXIoYXN5bmMgZnVuY3Rpb24oKSB7IGF3YWl0IHRoYXQucG9sbCgpOyB9KTtcbiAgfVxuICBcbiAgc2V0SXNQb2xsaW5nKGlzUG9sbGluZzogYm9vbGVhbikge1xuICAgIHRoaXMuaXNQb2xsaW5nID0gaXNQb2xsaW5nO1xuICAgIGlmIChpc1BvbGxpbmcpIHRoaXMubG9vcGVyLnN0YXJ0KHRoaXMuZGFlbW9uLmdldFBvbGxJbnRlcnZhbCgpKTtcbiAgICBlbHNlIHRoaXMubG9vcGVyLnN0b3AoKTtcbiAgfVxuICBcbiAgYXN5bmMgcG9sbCgpIHtcbiAgICB0cnkge1xuICAgICAgXG4gICAgICAvLyBnZXQgbGF0ZXN0IGJsb2NrIGhlYWRlclxuICAgICAgbGV0IGhlYWRlciA9IGF3YWl0IHRoaXMuZGFlbW9uLmdldExhc3RCbG9ja0hlYWRlcigpO1xuICAgICAgXG4gICAgICAvLyBzYXZlIGZpcnN0IGhlYWRlciBmb3IgY29tcGFyaXNvblxuICAgICAgaWYgKCF0aGlzLmxhc3RIZWFkZXIpIHtcbiAgICAgICAgdGhpcy5sYXN0SGVhZGVyID0gYXdhaXQgdGhpcy5kYWVtb24uZ2V0TGFzdEJsb2NrSGVhZGVyKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gY29tcGFyZSBoZWFkZXIgdG8gbGFzdFxuICAgICAgaWYgKGhlYWRlci5nZXRIYXNoKCkgIT09IHRoaXMubGFzdEhlYWRlci5nZXRIYXNoKCkpIHtcbiAgICAgICAgdGhpcy5sYXN0SGVhZGVyID0gaGVhZGVyO1xuICAgICAgICBhd2FpdCB0aGlzLmFubm91bmNlQmxvY2tIZWFkZXIoaGVhZGVyKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gYmFja2dyb3VuZCBwb2xsIGRhZW1vbiBoZWFkZXJcIik7XG4gICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgfVxuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIGFubm91bmNlQmxvY2tIZWFkZXIoaGVhZGVyOiBNb25lcm9CbG9ja0hlYWRlcikge1xuICAgIGZvciAobGV0IGxpc3RlbmVyIG9mIGF3YWl0IHRoaXMuZGFlbW9uLmdldExpc3RlbmVycygpKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBsaXN0ZW5lci5vbkJsb2NrSGVhZGVyKGhlYWRlcik7IC8vIG5vdGlmeSBsaXN0ZW5lclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBjYWxsaW5nIGxpc3RlbmVyIG9uIGJsb2NrIGhlYWRlclwiLCBlcnIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEludGVybmFsIGxpc3RlbmVyIHRvIGJyaWRnZSBub3RpZmljYXRpb25zIHRvIGV4dGVybmFsIGxpc3RlbmVycy5cbiAqIFxuICogQHByaXZhdGVcbiAqL1xuY2xhc3MgRGFlbW9uV29ya2VyTGlzdGVuZXIge1xuXG4gIHByb3RlY3RlZCBpZDogYW55O1xuICBwcm90ZWN0ZWQgbGlzdGVuZXI6IGFueTtcblxuICBjb25zdHJ1Y3RvcihsaXN0ZW5lcikge1xuICAgIHRoaXMuaWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgdGhpcy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB9XG4gIFxuICBnZXRJZCgpIHtcbiAgICByZXR1cm4gdGhpcy5pZDtcbiAgfVxuICBcbiAgZ2V0TGlzdGVuZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMubGlzdGVuZXI7XG4gIH1cbiAgXG4gIGFzeW5jIG9uQmxvY2tIZWFkZXIoaGVhZGVySnNvbikge1xuICAgIHRoaXMubGlzdGVuZXIub25CbG9ja0hlYWRlcihuZXcgTW9uZXJvQmxvY2tIZWFkZXIoaGVhZGVySnNvbikpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IE1vbmVyb0RhZW1vblJwYztcbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLFNBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLGFBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFHLFdBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFJLGVBQUEsR0FBQUwsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFLLFVBQUEsR0FBQU4sc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFNLFlBQUEsR0FBQVAsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFPLGtCQUFBLEdBQUFSLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBUSxvQkFBQSxHQUFBVCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVMscUJBQUEsR0FBQVYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFVLGFBQUEsR0FBQVgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFXLG1CQUFBLEdBQUFaLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBWSxpQkFBQSxHQUFBYixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWEscUJBQUEsR0FBQWQsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFjLHFCQUFBLEdBQUFmLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBZSw4QkFBQSxHQUFBaEIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFnQixpQ0FBQSxHQUFBakIsc0JBQUEsQ0FB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