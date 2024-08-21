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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX1Rhc2tMb29wZXIiLCJfTW9uZXJvQWx0Q2hhaW4iLCJfTW9uZXJvQmFuIiwiX01vbmVyb0Jsb2NrIiwiX01vbmVyb0Jsb2NrSGVhZGVyIiwiX01vbmVyb0Jsb2NrVGVtcGxhdGUiLCJfTW9uZXJvQ29ubmVjdGlvblNwYW4iLCJfTW9uZXJvRGFlbW9uIiwiX01vbmVyb0RhZW1vbkNvbmZpZyIsIl9Nb25lcm9EYWVtb25JbmZvIiwiX01vbmVyb0RhZW1vbkxpc3RlbmVyIiwiX01vbmVyb0RhZW1vblN5bmNJbmZvIiwiX01vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0IiwiX01vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0IiwiX01vbmVyb0ZlZUVzdGltYXRlIiwiX01vbmVyb0Vycm9yIiwiX01vbmVyb0hhcmRGb3JrSW5mbyIsIl9Nb25lcm9LZXlJbWFnZSIsIl9Nb25lcm9NaW5lclR4U3VtIiwiX01vbmVyb01pbmluZ1N0YXR1cyIsIl9Nb25lcm9OZXR3b3JrVHlwZSIsIl9Nb25lcm9PdXRwdXQiLCJfTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkiLCJfTW9uZXJvUGVlciIsIl9Nb25lcm9QcnVuZVJlc3VsdCIsIl9Nb25lcm9ScGNDb25uZWN0aW9uIiwiX01vbmVyb1N1Ym1pdFR4UmVzdWx0IiwiX01vbmVyb1R4IiwiX01vbmVyb1R4UG9vbFN0YXRzIiwiX01vbmVyb1V0aWxzIiwiX01vbmVyb1ZlcnNpb24iLCJNb25lcm9EYWVtb25ScGMiLCJNb25lcm9EYWVtb24iLCJNQVhfUkVRX1NJWkUiLCJERUZBVUxUX0lEIiwiTlVNX0hFQURFUlNfUEVSX1JFUSIsIkRFRkFVTFRfUE9MTF9QRVJJT0QiLCJjb25zdHJ1Y3RvciIsImNvbmZpZyIsInByb3h5RGFlbW9uIiwicHJveHlUb1dvcmtlciIsImxpc3RlbmVycyIsImNhY2hlZEhlYWRlcnMiLCJnZXRQcm9jZXNzIiwicHJvY2VzcyIsInN0b3BQcm9jZXNzIiwiZm9yY2UiLCJ1bmRlZmluZWQiLCJNb25lcm9FcnJvciIsImxpc3RlbmVyc0NvcHkiLCJHZW5VdGlscyIsImNvcHlBcnJheSIsImdldExpc3RlbmVycyIsImxpc3RlbmVyIiwicmVtb3ZlTGlzdGVuZXIiLCJraWxsUHJvY2VzcyIsImFkZExpc3RlbmVyIiwiYXNzZXJ0IiwiTW9uZXJvRGFlbW9uTGlzdGVuZXIiLCJwdXNoIiwicmVmcmVzaExpc3RlbmluZyIsImlkeCIsImluZGV4T2YiLCJzcGxpY2UiLCJnZXRScGNDb25uZWN0aW9uIiwiZ2V0U2VydmVyIiwiaXNDb25uZWN0ZWQiLCJnZXRWZXJzaW9uIiwiZSIsInJlc3AiLCJzZW5kSnNvblJlcXVlc3QiLCJjaGVja1Jlc3BvbnNlU3RhdHVzIiwicmVzdWx0IiwiTW9uZXJvVmVyc2lvbiIsInZlcnNpb24iLCJyZWxlYXNlIiwiaXNUcnVzdGVkIiwic2VuZFBhdGhSZXF1ZXN0IiwidW50cnVzdGVkIiwiZ2V0SGVpZ2h0IiwiY291bnQiLCJnZXRCbG9ja0hhc2giLCJoZWlnaHQiLCJnZXRCbG9ja1RlbXBsYXRlIiwid2FsbGV0QWRkcmVzcyIsInJlc2VydmVTaXplIiwid2FsbGV0X2FkZHJlc3MiLCJyZXNlcnZlX3NpemUiLCJjb252ZXJ0UnBjQmxvY2tUZW1wbGF0ZSIsImdldExhc3RCbG9ja0hlYWRlciIsImNvbnZlcnRScGNCbG9ja0hlYWRlciIsImJsb2NrX2hlYWRlciIsImdldEJsb2NrSGVhZGVyQnlIYXNoIiwiYmxvY2tIYXNoIiwiaGFzaCIsImdldEJsb2NrSGVhZGVyQnlIZWlnaHQiLCJnZXRCbG9ja0hlYWRlcnNCeVJhbmdlIiwic3RhcnRIZWlnaHQiLCJlbmRIZWlnaHQiLCJzdGFydF9oZWlnaHQiLCJlbmRfaGVpZ2h0IiwiaGVhZGVycyIsInJwY0hlYWRlciIsImdldEJsb2NrQnlIYXNoIiwiY29udmVydFJwY0Jsb2NrIiwiZ2V0QmxvY2tCeUhlaWdodCIsImdldEJsb2Nrc0J5SGVpZ2h0IiwiaGVpZ2h0cyIsInJlc3BCaW4iLCJzZW5kQmluYXJ5UmVxdWVzdCIsInJwY0Jsb2NrcyIsIk1vbmVyb1V0aWxzIiwiYmluYXJ5QmxvY2tzVG9Kc29uIiwiZXF1YWwiLCJ0eHMiLCJsZW5ndGgiLCJibG9ja3MiLCJibG9ja0lkeCIsImJsb2NrIiwic2V0SGVpZ2h0IiwidHhJZHgiLCJ0eCIsIk1vbmVyb1R4Iiwic2V0SGFzaCIsInR4X2hhc2hlcyIsInNldElzQ29uZmlybWVkIiwic2V0SW5UeFBvb2wiLCJzZXRJc01pbmVyVHgiLCJzZXRSZWxheSIsInNldElzUmVsYXllZCIsInNldElzRmFpbGVkIiwic2V0SXNEb3VibGVTcGVuZFNlZW4iLCJjb252ZXJ0UnBjVHgiLCJzZXRUeHMiLCJnZXRCbG9jayIsIm1lcmdlIiwiZ2V0VHhzIiwic2V0QmxvY2siLCJnZXRCbG9ja3NCeVJhbmdlIiwiZ2V0QmxvY2tzQnlSYW5nZUNodW5rZWQiLCJtYXhDaHVua1NpemUiLCJsYXN0SGVpZ2h0IiwiZ2V0TWF4QmxvY2tzIiwidHhIYXNoZXMiLCJwcnVuZSIsIkFycmF5IiwiaXNBcnJheSIsInR4c19oYXNoZXMiLCJkZWNvZGVfYXNfanNvbiIsIm1lc3NhZ2UiLCJnZXRUeEhleGVzIiwiaGV4ZXMiLCJnZXRQcnVuZWRIZXgiLCJnZXRGdWxsSGV4IiwiZ2V0TWluZXJUeFN1bSIsIm51bUJsb2NrcyIsInR4U3VtIiwiTW9uZXJvTWluZXJUeFN1bSIsInNldEVtaXNzaW9uU3VtIiwiQmlnSW50IiwiZW1pc3Npb25fYW1vdW50Iiwic2V0RmVlU3VtIiwiZmVlX2Ftb3VudCIsImdldEZlZUVzdGltYXRlIiwiZ3JhY2VCbG9ja3MiLCJncmFjZV9ibG9ja3MiLCJmZWVFc3RpbWF0ZSIsIk1vbmVyb0ZlZUVzdGltYXRlIiwic2V0RmVlIiwiZmVlIiwic2V0UXVhbnRpemF0aW9uTWFzayIsInF1YW50aXphdGlvbl9tYXNrIiwiZmVlcyIsImkiLCJzZXRGZWVzIiwic3VibWl0VHhIZXgiLCJ0eEhleCIsImRvTm90UmVsYXkiLCJ0eF9hc19oZXgiLCJkb19ub3RfcmVsYXkiLCJjb252ZXJ0UnBjU3VibWl0VHhSZXN1bHQiLCJzZXRJc0dvb2QiLCJyZWxheVR4c0J5SGFzaCIsInR4aWRzIiwiZ2V0VHhQb29sIiwidHJhbnNhY3Rpb25zIiwicnBjVHgiLCJzZXROdW1Db25maXJtYXRpb25zIiwiZ2V0VHhQb29sSGFzaGVzIiwiZ2V0VHhQb29sU3RhdHMiLCJjb252ZXJ0UnBjVHhQb29sU3RhdHMiLCJwb29sX3N0YXRzIiwiZmx1c2hUeFBvb2wiLCJoYXNoZXMiLCJsaXN0aWZ5IiwiZ2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzIiwia2V5SW1hZ2VzIiwia2V5X2ltYWdlcyIsInNwZW50X3N0YXR1cyIsImdldE91dHB1dEhpc3RvZ3JhbSIsImFtb3VudHMiLCJtaW5Db3VudCIsIm1heENvdW50IiwiaXNVbmxvY2tlZCIsInJlY2VudEN1dG9mZiIsIm1pbl9jb3VudCIsIm1heF9jb3VudCIsInVubG9ja2VkIiwicmVjZW50X2N1dG9mZiIsImVudHJpZXMiLCJoaXN0b2dyYW0iLCJycGNFbnRyeSIsImNvbnZlcnRScGNPdXRwdXRIaXN0b2dyYW1FbnRyeSIsImdldE91dHB1dERpc3RyaWJ1dGlvbiIsImN1bXVsYXRpdmUiLCJnZXRJbmZvIiwiY29udmVydFJwY0luZm8iLCJnZXRTeW5jSW5mbyIsImNvbnZlcnRScGNTeW5jSW5mbyIsImdldEhhcmRGb3JrSW5mbyIsImNvbnZlcnRScGNIYXJkRm9ya0luZm8iLCJnZXRBbHRDaGFpbnMiLCJjaGFpbnMiLCJycGNDaGFpbiIsImNvbnZlcnRScGNBbHRDaGFpbiIsImdldEFsdEJsb2NrSGFzaGVzIiwiYmxrc19oYXNoZXMiLCJnZXREb3dubG9hZExpbWl0IiwiZ2V0QmFuZHdpZHRoTGltaXRzIiwic2V0RG93bmxvYWRMaW1pdCIsImxpbWl0IiwicmVzZXREb3dubG9hZExpbWl0IiwiaXNJbnQiLCJzZXRCYW5kd2lkdGhMaW1pdHMiLCJnZXRVcGxvYWRMaW1pdCIsInNldFVwbG9hZExpbWl0IiwicmVzZXRVcGxvYWRMaW1pdCIsImdldFBlZXJzIiwicGVlcnMiLCJjb25uZWN0aW9ucyIsInJwY0Nvbm5lY3Rpb24iLCJjb252ZXJ0UnBjQ29ubmVjdGlvbiIsImdldEtub3duUGVlcnMiLCJncmF5X2xpc3QiLCJycGNQZWVyIiwicGVlciIsImNvbnZlcnRScGNQZWVyIiwic2V0SXNPbmxpbmUiLCJ3aGl0ZV9saXN0Iiwic2V0T3V0Z29pbmdQZWVyTGltaXQiLCJvdXRfcGVlcnMiLCJzZXRJbmNvbWluZ1BlZXJMaW1pdCIsImluX3BlZXJzIiwiZ2V0UGVlckJhbnMiLCJiYW5zIiwicnBjQmFuIiwiYmFuIiwiTW9uZXJvQmFuIiwic2V0SG9zdCIsImhvc3QiLCJzZXRJcCIsImlwIiwic2V0U2Vjb25kcyIsInNlY29uZHMiLCJzZXRQZWVyQmFucyIsInJwY0JhbnMiLCJjb252ZXJ0VG9ScGNCYW4iLCJzdGFydE1pbmluZyIsImFkZHJlc3MiLCJudW1UaHJlYWRzIiwiaXNCYWNrZ3JvdW5kIiwiaWdub3JlQmF0dGVyeSIsIm1pbmVyX2FkZHJlc3MiLCJ0aHJlYWRzX2NvdW50IiwiZG9fYmFja2dyb3VuZF9taW5pbmciLCJpZ25vcmVfYmF0dGVyeSIsInN0b3BNaW5pbmciLCJnZXRNaW5pbmdTdGF0dXMiLCJjb252ZXJ0UnBjTWluaW5nU3RhdHVzIiwic3VibWl0QmxvY2tzIiwiYmxvY2tCbG9icyIsInBydW5lQmxvY2tjaGFpbiIsImNoZWNrIiwiTW9uZXJvUHJ1bmVSZXN1bHQiLCJzZXRJc1BydW5lZCIsInBydW5lZCIsInNldFBydW5pbmdTZWVkIiwicHJ1bmluZ19zZWVkIiwiY2hlY2tGb3JVcGRhdGUiLCJjb21tYW5kIiwiY29udmVydFJwY1VwZGF0ZUNoZWNrUmVzdWx0IiwiZG93bmxvYWRVcGRhdGUiLCJwYXRoIiwiY29udmVydFJwY1VwZGF0ZURvd25sb2FkUmVzdWx0Iiwic3RvcCIsIndhaXRGb3JOZXh0QmxvY2tIZWFkZXIiLCJ0aGF0IiwiUHJvbWlzZSIsInJlc29sdmUiLCJvbkJsb2NrSGVhZGVyIiwiaGVhZGVyIiwiZ2V0UG9sbEludGVydmFsIiwicG9sbEludGVydmFsIiwiZ2V0VHgiLCJ0eEhhc2giLCJnZXRUeEhleCIsImdldEtleUltYWdlU3BlbnRTdGF0dXMiLCJrZXlJbWFnZSIsInNldFBlZXJCYW4iLCJzdWJtaXRCbG9jayIsImJsb2NrQmxvYiIsInBvbGxMaXN0ZW5lciIsIkRhZW1vblBvbGxlciIsInNldElzUG9sbGluZyIsImxpbWl0X2Rvd24iLCJsaW1pdF91cCIsImRvd25MaW1pdCIsInVwTGltaXQiLCJtYXhIZWlnaHQiLCJtYXhSZXFTaXplIiwicmVxU2l6ZSIsImdldEJsb2NrSGVhZGVyQnlIZWlnaHRDYWNoZWQiLCJnZXRTaXplIiwiY2FjaGVkSGVhZGVyIiwiTWF0aCIsIm1pbiIsImNvbm5lY3RUb0RhZW1vblJwYyIsInVyaU9yQ29uZmlnIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsIm5vcm1hbGl6ZUNvbmZpZyIsImNtZCIsInN0YXJ0TW9uZXJvZFByb2Nlc3MiLCJNb25lcm9EYWVtb25ScGNQcm94eSIsImNvbm5lY3QiLCJjaGlsZFByb2Nlc3MiLCJzcGF3biIsInNsaWNlIiwiZW52IiwiTEFORyIsInN0ZG91dCIsInNldEVuY29kaW5nIiwic3RkZXJyIiwidXJpIiwib3V0cHV0IiwicmVqZWN0Iiwib24iLCJkYXRhIiwibGluZSIsInRvU3RyaW5nIiwiTGlicmFyeVV0aWxzIiwibG9nIiwidXJpTGluZUNvbnRhaW5zIiwidXJpTGluZUNvbnRhaW5zSWR4Iiwic3Vic3RyaW5nIiwibGFzdEluZGV4T2YiLCJ1bmZvcm1hdHRlZExpbmUiLCJyZXBsYWNlIiwidHJpbSIsInBvcnQiLCJzc2xJZHgiLCJzc2xFbmFibGVkIiwidG9Mb3dlckNhc2UiLCJ1c2VyUGFzc0lkeCIsInVzZXJQYXNzIiwiY29weSIsInNldFNlcnZlciIsInJlamVjdFVuYXV0aG9yaXplZCIsImdldFJlamVjdFVuYXV0aG9yaXplZCIsInNldFByb3h5VG9Xb3JrZXIiLCJkYWVtb24iLCJpc1Jlc29sdmVkIiwiZ2V0TG9nTGV2ZWwiLCJjb25zb2xlIiwiZXJyb3IiLCJjb2RlIiwiRXJyb3IiLCJlcnIiLCJvcmlnaW4iLCJNb25lcm9EYWVtb25Db25maWciLCJzZXJ2ZXIiLCJNb25lcm9ScGNDb25uZWN0aW9uIiwiREVGQVVMVF9DT05GSUciLCJzdGF0dXMiLCJNb25lcm9CbG9ja0hlYWRlciIsImtleSIsIk9iamVjdCIsImtleXMiLCJ2YWwiLCJzYWZlU2V0Iiwic2V0U2l6ZSIsImdldERlcHRoIiwic2V0RGVwdGgiLCJzZXREaWZmaWN1bHR5IiwicmVjb25jaWxlIiwiZ2V0RGlmZmljdWx0eSIsInByZWZpeGVkSGV4VG9CSSIsInNldEN1bXVsYXRpdmVEaWZmaWN1bHR5IiwiZ2V0Q3VtdWxhdGl2ZURpZmZpY3VsdHkiLCJnZXRIYXNoIiwiZ2V0TWFqb3JWZXJzaW9uIiwic2V0TWFqb3JWZXJzaW9uIiwiZ2V0TWlub3JWZXJzaW9uIiwic2V0TWlub3JWZXJzaW9uIiwiZ2V0Tm9uY2UiLCJzZXROb25jZSIsImdldE51bVR4cyIsInNldE51bVR4cyIsImdldE9ycGhhblN0YXR1cyIsInNldE9ycGhhblN0YXR1cyIsImdldFByZXZIYXNoIiwic2V0UHJldkhhc2giLCJnZXRSZXdhcmQiLCJzZXRSZXdhcmQiLCJnZXRUaW1lc3RhbXAiLCJzZXRUaW1lc3RhbXAiLCJnZXRXZWlnaHQiLCJzZXRXZWlnaHQiLCJnZXRMb25nVGVybVdlaWdodCIsInNldExvbmdUZXJtV2VpZ2h0IiwiZ2V0UG93SGFzaCIsInNldFBvd0hhc2giLCJzZXRNaW5lclR4SGFzaCIsInJwY0Jsb2NrIiwiTW9uZXJvQmxvY2siLCJzZXRIZXgiLCJibG9iIiwic2V0VHhIYXNoZXMiLCJycGNNaW5lclR4IiwianNvbiIsIkpTT04iLCJwYXJzZSIsIm1pbmVyX3R4IiwibWluZXJUeCIsInNldE1pbmVyVHgiLCJnZXRMYXN0UmVsYXllZFRpbWVzdGFtcCIsInNldExhc3RSZWxheWVkVGltZXN0YW1wIiwiZ2V0UmVjZWl2ZWRUaW1lc3RhbXAiLCJzZXRSZWNlaXZlZFRpbWVzdGFtcCIsImdldE51bUNvbmZpcm1hdGlvbnMiLCJnZXRJc0NvbmZpcm1lZCIsImdldEluVHhQb29sIiwiZ2V0SXNEb3VibGVTcGVuZFNlZW4iLCJzZXRWZXJzaW9uIiwiZ2V0RXh0cmEiLCJzZXRFeHRyYSIsIlVpbnQ4QXJyYXkiLCJnZW4iLCJzZXRJbnB1dHMiLCJtYXAiLCJycGNWaW4iLCJjb252ZXJ0UnBjT3V0cHV0Iiwic2V0T3V0cHV0cyIsInJwY091dHB1dCIsImdldFJjdFNpZ25hdHVyZXMiLCJzZXRSY3RTaWduYXR1cmVzIiwidHhuRmVlIiwiZ2V0RmVlIiwiZ2V0UmN0U2lnUHJ1bmFibGUiLCJzZXRSY3RTaWdQcnVuYWJsZSIsImdldFVubG9ja1RpbWUiLCJzZXRVbmxvY2tUaW1lIiwic2V0RnVsbEhleCIsImdldElzUmVsYXllZCIsImdldE91dHB1dEluZGljZXMiLCJzZXRPdXRwdXRJbmRpY2VzIiwiZ2V0UmVsYXkiLCJnZXRJc0tlcHRCeUJsb2NrIiwic2V0SXNLZXB0QnlCbG9jayIsImdldFNpZ25hdHVyZXMiLCJzZXRTaWduYXR1cmVzIiwiZ2V0SXNGYWlsZWQiLCJnZXRMYXN0RmFpbGVkSGVpZ2h0Iiwic2V0TGFzdEZhaWxlZEhlaWdodCIsImdldExhc3RGYWlsZWRIYXNoIiwic2V0TGFzdEZhaWxlZEhhc2giLCJnZXRNYXhVc2VkQmxvY2tIZWlnaHQiLCJzZXRNYXhVc2VkQmxvY2tIZWlnaHQiLCJnZXRNYXhVc2VkQmxvY2tIYXNoIiwic2V0TWF4VXNlZEJsb2NrSGFzaCIsImdldFBydW5hYmxlSGFzaCIsInNldFBydW5hYmxlSGFzaCIsImdldFBydW5hYmxlSGV4Iiwic2V0UHJ1bmFibGVIZXgiLCJzZXRQcnVuZWRIZXgiLCJnZXRPdXRwdXRzIiwic2V0SW5kZXgiLCJhc19qc29uIiwidHhfanNvbiIsIk1vbmVyb091dHB1dCIsInNldFR4IiwiZ2V0QW1vdW50Iiwic2V0QW1vdW50IiwiYW1vdW50IiwiZ2V0S2V5SW1hZ2UiLCJzZXRLZXlJbWFnZSIsIk1vbmVyb0tleUltYWdlIiwia19pbWFnZSIsImdldFJpbmdPdXRwdXRJbmRpY2VzIiwic2V0UmluZ091dHB1dEluZGljZXMiLCJrZXlfb2Zmc2V0cyIsInB1YktleSIsInRhZ2dlZF9rZXkiLCJnZXRTdGVhbHRoUHVibGljS2V5Iiwic2V0U3RlYWx0aFB1YmxpY0tleSIsInJwY1RlbXBsYXRlIiwidGVtcGxhdGUiLCJNb25lcm9CbG9ja1RlbXBsYXRlIiwic2V0QmxvY2tUZW1wbGF0ZUJsb2IiLCJzZXRCbG9ja0hhc2hpbmdCbG9iIiwic2V0RXhwZWN0ZWRSZXdhcmQiLCJzZXRSZXNlcnZlZE9mZnNldCIsInNldFNlZWRIZWlnaHQiLCJzZXRTZWVkSGFzaCIsInNldE5leHRTZWVkSGFzaCIsImdldE5leHRTZWVkSGFzaCIsInJwY0luZm8iLCJpbmZvIiwiTW9uZXJvRGFlbW9uSW5mbyIsInNldE51bUFsdEJsb2NrcyIsInNldEJsb2NrU2l6ZUxpbWl0Iiwic2V0QmxvY2tTaXplTWVkaWFuIiwic2V0QmxvY2tXZWlnaHRMaW1pdCIsInNldEJsb2NrV2VpZ2h0TWVkaWFuIiwic2V0Qm9vdHN0cmFwRGFlbW9uQWRkcmVzcyIsInNldEZyZWVTcGFjZSIsInNldERhdGFiYXNlU2l6ZSIsInNldE51bU9mZmxpbmVQZWVycyIsInNldEhlaWdodFdpdGhvdXRCb290c3RyYXAiLCJzZXROdW1JbmNvbWluZ0Nvbm5lY3Rpb25zIiwic2V0SXNPZmZsaW5lIiwic2V0TnVtT3V0Z29pbmdDb25uZWN0aW9ucyIsInNldE51bVJwY0Nvbm5lY3Rpb25zIiwic2V0U3RhcnRUaW1lc3RhbXAiLCJzZXRBZGp1c3RlZFRpbWVzdGFtcCIsInNldFRhcmdldCIsInNldFRhcmdldEhlaWdodCIsInNldFRvcEJsb2NrSGFzaCIsInNldE51bVR4c1Bvb2wiLCJzZXRXYXNCb290c3RyYXBFdmVyVXNlZCIsInNldE51bU9ubGluZVBlZXJzIiwic2V0VXBkYXRlQXZhaWxhYmxlIiwiZ2V0TmV0d29ya1R5cGUiLCJzZXROZXR3b3JrVHlwZSIsIk1vbmVyb05ldHdvcmtUeXBlIiwiTUFJTk5FVCIsIlRFU1RORVQiLCJTVEFHRU5FVCIsInNldENyZWRpdHMiLCJnZXRUb3BCbG9ja0hhc2giLCJzZXRJc0J1c3lTeW5jaW5nIiwic2V0SXNTeW5jaHJvbml6ZWQiLCJzZXRJc1Jlc3RyaWN0ZWQiLCJycGNTeW5jSW5mbyIsInN5bmNJbmZvIiwiTW9uZXJvRGFlbW9uU3luY0luZm8iLCJzZXRQZWVycyIsInJwY0Nvbm5lY3Rpb25zIiwic2V0U3BhbnMiLCJycGNTcGFucyIsInJwY1NwYW4iLCJnZXRTcGFucyIsImNvbnZlcnRScGNDb25uZWN0aW9uU3BhbiIsInNldE5leHROZWVkZWRQcnVuaW5nU2VlZCIsIm92ZXJ2aWV3IiwicnBjSGFyZEZvcmtJbmZvIiwiTW9uZXJvSGFyZEZvcmtJbmZvIiwic2V0RWFybGllc3RIZWlnaHQiLCJzZXRJc0VuYWJsZWQiLCJzZXRTdGF0ZSIsInNldFRocmVzaG9sZCIsInNldE51bVZvdGVzIiwic2V0Vm90aW5nIiwic2V0V2luZG93IiwicnBjQ29ubmVjdGlvblNwYW4iLCJzcGFuIiwiTW9uZXJvQ29ubmVjdGlvblNwYW4iLCJzZXRDb25uZWN0aW9uSWQiLCJzZXROdW1CbG9ja3MiLCJzZXRSYXRlIiwic2V0UmVtb3RlQWRkcmVzcyIsInNldFNwZWVkIiwic2V0U3RhcnRIZWlnaHQiLCJlbnRyeSIsIk1vbmVyb091dHB1dEhpc3RvZ3JhbUVudHJ5Iiwic2V0TnVtSW5zdGFuY2VzIiwic2V0TnVtVW5sb2NrZWRJbnN0YW5jZXMiLCJzZXROdW1SZWNlbnRJbnN0YW5jZXMiLCJycGNSZXN1bHQiLCJNb25lcm9TdWJtaXRUeFJlc3VsdCIsInNldElzRmVlVG9vTG93Iiwic2V0SGFzSW52YWxpZElucHV0Iiwic2V0SGFzSW52YWxpZE91dHB1dCIsInNldEhhc1Rvb0Zld091dHB1dHMiLCJzZXRJc01peGluVG9vTG93Iiwic2V0SXNPdmVyc3BlbmQiLCJzZXRSZWFzb24iLCJzZXRJc1Rvb0JpZyIsInNldFNhbml0eUNoZWNrRmFpbGVkIiwic2V0SXNUeEV4dHJhVG9vQmlnIiwicnBjU3RhdHMiLCJzdGF0cyIsIk1vbmVyb1R4UG9vbFN0YXRzIiwic2V0Qnl0ZXNNYXgiLCJzZXRCeXRlc01lZCIsInNldEJ5dGVzTWluIiwic2V0Qnl0ZXNUb3RhbCIsInNldEhpc3RvOThwYyIsInNldE51bTEwbSIsInNldE51bURvdWJsZVNwZW5kcyIsInNldE51bUZhaWxpbmciLCJzZXROdW1Ob3RSZWxheWVkIiwic2V0T2xkZXN0VGltZXN0YW1wIiwic2V0RmVlVG90YWwiLCJzZXRIaXN0byIsIk1hcCIsImVsZW0iLCJnZXRIaXN0byIsInNldCIsImJ5dGVzIiwiZ2V0SGlzdG85OHBjIiwiY2hhaW4iLCJNb25lcm9BbHRDaGFpbiIsInNldExlbmd0aCIsInNldEJsb2NrSGFzaGVzIiwic2V0TWFpbkNoYWluUGFyZW50QmxvY2tIYXNoIiwiTW9uZXJvUGVlciIsInNldElkIiwic2V0TGFzdFNlZW5UaW1lc3RhbXAiLCJzZXRQb3J0Iiwic2V0UnBjUG9ydCIsInNldFJwY0NyZWRpdHNQZXJIYXNoIiwic2V0QWRkcmVzcyIsInNldEF2Z0Rvd25sb2FkIiwic2V0QXZnVXBsb2FkIiwic2V0Q3VycmVudERvd25sb2FkIiwic2V0Q3VycmVudFVwbG9hZCIsInNldElzSW5jb21pbmciLCJzZXRMaXZlVGltZSIsInNldElzTG9jYWxJcCIsInNldElzTG9jYWxIb3N0IiwicGFyc2VJbnQiLCJzZXROdW1SZWNlaXZlcyIsInNldFJlY2VpdmVJZGxlVGltZSIsInNldE51bVNlbmRzIiwic2V0U2VuZElkbGVUaW1lIiwic2V0TnVtU3VwcG9ydEZsYWdzIiwic2V0VHlwZSIsImdldEhvc3QiLCJnZXRJcCIsImdldElzQmFubmVkIiwiZ2V0U2Vjb25kcyIsInJwY1N0YXR1cyIsIk1vbmVyb01pbmluZ1N0YXR1cyIsInNldElzQWN0aXZlIiwiYWN0aXZlIiwic3BlZWQiLCJzZXROdW1UaHJlYWRzIiwic2V0SXNCYWNrZ3JvdW5kIiwiaXNfYmFja2dyb3VuZF9taW5pbmdfZW5hYmxlZCIsIk1vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0Iiwic2V0QXV0b1VyaSIsInNldElzVXBkYXRlQXZhaWxhYmxlIiwic2V0VXNlclVyaSIsImdldEF1dG9VcmkiLCJnZXRVc2VyVXJpIiwiTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQiLCJzZXREb3dubG9hZFBhdGgiLCJnZXREb3dubG9hZFBhdGgiLCJoZXgiLCJkYWVtb25JZCIsIndvcmtlciIsIndyYXBwZWRMaXN0ZW5lcnMiLCJnZXRVVUlEIiwiYXNzaWduIiwiaW52b2tlV29ya2VyIiwiZ2V0V29ya2VyIiwid3JhcHBlZExpc3RlbmVyIiwiRGFlbW9uV29ya2VyTGlzdGVuZXIiLCJsaXN0ZW5lcklkIiwiZ2V0SWQiLCJhZGRXb3JrZXJDYWxsYmFjayIsImdldExpc3RlbmVyIiwicmVtb3ZlV29ya2VyQ2FsbGJhY2siLCJ2ZXJzaW9uSnNvbiIsIm51bWJlciIsImlzUmVsZWFzZSIsImZyb20iLCJhcmd1bWVudHMiLCJibG9ja0hlYWRlcnNKc29uIiwiYmxvY2tIZWFkZXJKc29uIiwiRGVzZXJpYWxpemF0aW9uVHlwZSIsIlRYIiwiZ2V0QmxvY2tzQnlIYXNoIiwiYmxvY2tIYXNoZXMiLCJibG9ja3NKc29uIiwiYmxvY2tKc29uIiwiZ2V0QmxvY2tIYXNoZXMiLCJnZXRUeFBvb2xCYWNrbG9nIiwib3V0cHV0cyIsImVudHJ5SnNvbiIsImFsdENoYWlucyIsImFsdENoYWluSnNvbiIsInBlZXJKc29uIiwiYmFuSnNvbiIsImJhbnNKc29uIiwidG9Kc29uIiwiZm5OYW1lIiwiYXJncyIsImxvb3BlciIsIlRhc2tMb29wZXIiLCJwb2xsIiwiaXNQb2xsaW5nIiwic3RhcnQiLCJsYXN0SGVhZGVyIiwiYW5ub3VuY2VCbG9ja0hlYWRlciIsImlkIiwiaGVhZGVySnNvbiIsIl9kZWZhdWx0IiwiZXhwb3J0cyIsImRlZmF1bHQiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy9kYWVtb24vTW9uZXJvRGFlbW9uUnBjLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IEdlblV0aWxzIGZyb20gXCIuLi9jb21tb24vR2VuVXRpbHNcIjtcbmltcG9ydCBMaWJyYXJ5VXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9MaWJyYXJ5VXRpbHNcIjtcbmltcG9ydCBUYXNrTG9vcGVyIGZyb20gXCIuLi9jb21tb24vVGFza0xvb3BlclwiO1xuaW1wb3J0IE1vbmVyb0FsdENoYWluIGZyb20gXCIuL21vZGVsL01vbmVyb0FsdENoYWluXCI7XG5pbXBvcnQgTW9uZXJvQmFuIGZyb20gXCIuL21vZGVsL01vbmVyb0JhblwiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrIGZyb20gXCIuL21vZGVsL01vbmVyb0Jsb2NrXCI7XG5pbXBvcnQgTW9uZXJvQmxvY2tIZWFkZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQmxvY2tIZWFkZXJcIjtcbmltcG9ydCBNb25lcm9CbG9ja1RlbXBsYXRlIGZyb20gXCIuL21vZGVsL01vbmVyb0Jsb2NrVGVtcGxhdGVcIjtcbmltcG9ydCBNb25lcm9Db25uZWN0aW9uU3BhbiBmcm9tIFwiLi9tb2RlbC9Nb25lcm9Db25uZWN0aW9uU3BhblwiO1xuaW1wb3J0IE1vbmVyb0RhZW1vbiBmcm9tIFwiLi9Nb25lcm9EYWVtb25cIjtcbmltcG9ydCBNb25lcm9EYWVtb25Db25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvRGFlbW9uQ29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uSW5mbyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9EYWVtb25JbmZvXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uTGlzdGVuZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvRGFlbW9uTGlzdGVuZXJcIjtcbmltcG9ydCBNb25lcm9EYWVtb25TeW5jSW5mbyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9EYWVtb25TeW5jSW5mb1wiO1xuaW1wb3J0IE1vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9GZWVFc3RpbWF0ZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9GZWVFc3RpbWF0ZVwiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuLi9jb21tb24vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBNb25lcm9IYXJkRm9ya0luZm8gZnJvbSBcIi4vbW9kZWwvTW9uZXJvSGFyZEZvcmtJbmZvXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2UgZnJvbSBcIi4vbW9kZWwvTW9uZXJvS2V5SW1hZ2VcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzIGZyb20gXCIuL21vZGVsL01vbmVyb0tleUltYWdlU3BlbnRTdGF0dXNcIjtcbmltcG9ydCBNb25lcm9NaW5lclR4U3VtIGZyb20gXCIuL21vZGVsL01vbmVyb01pbmVyVHhTdW1cIjtcbmltcG9ydCBNb25lcm9NaW5pbmdTdGF0dXMgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTWluaW5nU3RhdHVzXCI7XG5pbXBvcnQgTW9uZXJvTmV0d29ya1R5cGUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTmV0d29ya1R5cGVcIjtcbmltcG9ydCBNb25lcm9PdXRwdXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0XCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnlcIjtcbmltcG9ydCBNb25lcm9QZWVyIGZyb20gXCIuL21vZGVsL01vbmVyb1BlZXJcIjtcbmltcG9ydCBNb25lcm9QcnVuZVJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9QcnVuZVJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb1JwY0Nvbm5lY3Rpb24gZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9ScGNDb25uZWN0aW9uXCI7XG5pbXBvcnQgTW9uZXJvU3VibWl0VHhSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvU3VibWl0VHhSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9UeCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFwiO1xuaW1wb3J0IE1vbmVyb1R4UG9vbFN0YXRzIGZyb20gXCIuL21vZGVsL01vbmVyb1R4UG9vbFN0YXRzXCI7XG5pbXBvcnQgTW9uZXJvVXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9VdGlsc1wiO1xuaW1wb3J0IE1vbmVyb1ZlcnNpb24gZnJvbSBcIi4vbW9kZWwvTW9uZXJvVmVyc2lvblwiO1xuaW1wb3J0IHsgQ2hpbGRQcm9jZXNzIH0gZnJvbSBcImNoaWxkX3Byb2Nlc3NcIjtcblxuLyoqXG4gKiBDb3B5cmlnaHQgKGMpIHdvb2RzZXJcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbi8qKlxuICogSW1wbGVtZW50cyBhIE1vbmVyb0RhZW1vbiBhcyBhIGNsaWVudCBvZiBtb25lcm9kLlxuICovXG5jbGFzcyBNb25lcm9EYWVtb25ScGMgZXh0ZW5kcyBNb25lcm9EYWVtb24ge1xuXG4gIC8vIHN0YXRpYyB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIHN0YXRpYyByZWFkb25seSBNQVhfUkVRX1NJWkUgPSBcIjMwMDAwMDBcIjtcbiAgcHJvdGVjdGVkIHN0YXRpYyByZWFkb25seSBERUZBVUxUX0lEID0gXCIwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwXCI7IC8vIHVuaW5pdGlhbGl6ZWQgdHggb3IgYmxvY2sgaGFzaCBmcm9tIGRhZW1vbiBycGNcbiAgcHJvdGVjdGVkIHN0YXRpYyByZWFkb25seSBOVU1fSEVBREVSU19QRVJfUkVRID0gNzUwOyAvLyBudW1iZXIgb2YgaGVhZGVycyB0byBmZXRjaCBhbmQgY2FjaGUgcGVyIHJlcXVlc3RcbiAgcHJvdGVjdGVkIHN0YXRpYyByZWFkb25seSBERUZBVUxUX1BPTExfUEVSSU9EID0gMjAwMDA7IC8vIGRlZmF1bHQgaW50ZXJ2YWwgYmV0d2VlbiBwb2xsaW5nIHRoZSBkYWVtb24gaW4gbXNcblxuICAvLyBpbnN0YW5jZSB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIGNvbmZpZzogUGFydGlhbDxNb25lcm9EYWVtb25Db25maWc+O1xuICBwcm90ZWN0ZWQgbGlzdGVuZXJzOiBNb25lcm9EYWVtb25MaXN0ZW5lcltdO1xuICBwcm90ZWN0ZWQgY2FjaGVkSGVhZGVyczogYW55O1xuICBwcm90ZWN0ZWQgcHJvY2VzczogYW55O1xuICBwcm90ZWN0ZWQgcG9sbExpc3RlbmVyOiBhbnk7XG4gIHByb3RlY3RlZCBwcm94eURhZW1vbjogYW55O1xuIFxuICAvKiogQHByaXZhdGUgKi9cbiAgY29uc3RydWN0b3IoY29uZmlnOiBNb25lcm9EYWVtb25Db25maWcsIHByb3h5RGFlbW9uOiBNb25lcm9EYWVtb25ScGNQcm94eSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jb25maWcgPSBjb25maWc7XG4gICAgdGhpcy5wcm94eURhZW1vbiA9IHByb3h5RGFlbW9uO1xuICAgIGlmIChjb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuO1xuICAgIHRoaXMubGlzdGVuZXJzID0gW107ICAgICAgLy8gYmxvY2sgbGlzdGVuZXJzXG4gICAgdGhpcy5jYWNoZWRIZWFkZXJzID0ge307ICAvLyBjYWNoZWQgaGVhZGVycyBmb3IgZmV0Y2hpbmcgYmxvY2tzIGluIGJvdW5kIGNodW5rc1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBpbnRlcm5hbCBwcm9jZXNzIHJ1bm5pbmcgbW9uZXJvZC5cbiAgICogXG4gICAqIEByZXR1cm4ge0NoaWxkUHJvY2Vzc30gdGhlIG5vZGUgcHJvY2VzcyBydW5uaW5nIG1vbmVyb2QsIHVuZGVmaW5lZCBpZiBub3QgY3JlYXRlZCBmcm9tIG5ldyBwcm9jZXNzXG4gICAqL1xuICBnZXRQcm9jZXNzKCk6IENoaWxkUHJvY2VzcyB7XG4gICAgcmV0dXJuIHRoaXMucHJvY2VzcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN0b3AgdGhlIGludGVybmFsIHByb2Nlc3MgcnVubmluZyBtb25lcm9kLCBpZiBhcHBsaWNhYmxlLlxuICAgKiBcbiAgICogQHBhcmFtIHtib29sZWFufSBbZm9yY2VdIHNwZWNpZmllcyBpZiB0aGUgcHJvY2VzcyBzaG91bGQgYmUgZGVzdHJveWVkIGZvcmNpYmx5IChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlciB8IHVuZGVmaW5lZD59IHRoZSBleGl0IGNvZGUgZnJvbSBzdG9wcGluZyB0aGUgcHJvY2Vzc1xuICAgKi9cbiAgYXN5bmMgc3RvcFByb2Nlc3MoZm9yY2UgPSBmYWxzZSk6IFByb21pc2U8bnVtYmVyIHwgdW5kZWZpbmVkPiB7XG4gICAgaWYgKHRoaXMucHJvY2VzcyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNb25lcm9EYWVtb25ScGMgaW5zdGFuY2Ugbm90IGNyZWF0ZWQgZnJvbSBuZXcgcHJvY2Vzc1wiKTtcbiAgICBsZXQgbGlzdGVuZXJzQ29weSA9IEdlblV0aWxzLmNvcHlBcnJheShhd2FpdCB0aGlzLmdldExpc3RlbmVycygpKTtcbiAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiBsaXN0ZW5lcnNDb3B5KSBhd2FpdCB0aGlzLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICByZXR1cm4gR2VuVXRpbHMua2lsbFByb2Nlc3ModGhpcy5wcm9jZXNzLCBmb3JjZSA/IFwiU0lHS0lMTFwiIDogdW5kZWZpbmVkKTtcbiAgfVxuICBcbiAgYXN5bmMgYWRkTGlzdGVuZXIobGlzdGVuZXI6IE1vbmVyb0RhZW1vbkxpc3RlbmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBhc3NlcnQobGlzdGVuZXIgaW5zdGFuY2VvZiBNb25lcm9EYWVtb25MaXN0ZW5lciwgXCJMaXN0ZW5lciBtdXN0IGJlIGluc3RhbmNlIG9mIE1vbmVyb0RhZW1vbkxpc3RlbmVyXCIpO1xuICAgIHRoaXMubGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuICAgIHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICB9XG4gIFxuICBhc3luYyByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcjogTW9uZXJvRGFlbW9uTGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24ucmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIGFzc2VydChsaXN0ZW5lciBpbnN0YW5jZW9mIE1vbmVyb0RhZW1vbkxpc3RlbmVyLCBcIkxpc3RlbmVyIG11c3QgYmUgaW5zdGFuY2Ugb2YgTW9uZXJvRGFlbW9uTGlzdGVuZXJcIik7XG4gICAgbGV0IGlkeCA9IHRoaXMubGlzdGVuZXJzLmluZGV4T2YobGlzdGVuZXIpO1xuICAgIGlmIChpZHggPiAtMSkgdGhpcy5saXN0ZW5lcnMuc3BsaWNlKGlkeCwgMSk7XG4gICAgZWxzZSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJMaXN0ZW5lciBpcyBub3QgcmVnaXN0ZXJlZCB3aXRoIGRhZW1vblwiKTtcbiAgICB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgfVxuICBcbiAgZ2V0TGlzdGVuZXJzKCk6IE1vbmVyb0RhZW1vbkxpc3RlbmVyW10ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRMaXN0ZW5lcnMoKTtcbiAgICByZXR1cm4gdGhpcy5saXN0ZW5lcnM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGRhZW1vbidzIFJQQyBjb25uZWN0aW9uLlxuICAgKiBcbiAgICogQHJldHVybiB7TW9uZXJvUnBjQ29ubmVjdGlvbn0gdGhlIGRhZW1vbidzIHJwYyBjb25uZWN0aW9uXG4gICAqL1xuICBhc3luYyBnZXRScGNDb25uZWN0aW9uKCkge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRScGNDb25uZWN0aW9uKCk7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLmdldFNlcnZlcigpO1xuICB9XG4gIFxuICBhc3luYyBpc0Nvbm5lY3RlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uaXNDb25uZWN0ZWQoKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgdGhpcy5nZXRWZXJzaW9uKCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGdldFZlcnNpb24oKTogUHJvbWlzZTxNb25lcm9WZXJzaW9uPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFZlcnNpb24oKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF92ZXJzaW9uXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1ZlcnNpb24ocmVzcC5yZXN1bHQudmVyc2lvbiwgcmVzcC5yZXN1bHQucmVsZWFzZSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzVHJ1c3RlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uaXNUcnVzdGVkKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJnZXRfaGVpZ2h0XCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIHJldHVybiAhcmVzcC51bnRydXN0ZWQ7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRIZWlnaHQoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9ibG9ja19jb3VudFwiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIHJlc3AucmVzdWx0LmNvdW50O1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0hhc2goaGVpZ2h0OiBudW1iZXIpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRCbG9ja0hhc2goaGVpZ2h0KTtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcIm9uX2dldF9ibG9ja19oYXNoXCIsIFtoZWlnaHRdKSkucmVzdWx0OyAgLy8gVE9ETyBtb25lcm8td2FsbGV0LXJwYzogbm8gc3RhdHVzIHJldHVybmVkXG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrVGVtcGxhdGUod2FsbGV0QWRkcmVzczogc3RyaW5nLCByZXNlcnZlU2l6ZT86IG51bWJlcik6IFByb21pc2U8TW9uZXJvQmxvY2tUZW1wbGF0ZT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRCbG9ja1RlbXBsYXRlKHdhbGxldEFkZHJlc3MsIHJlc2VydmVTaXplKTtcbiAgICBhc3NlcnQod2FsbGV0QWRkcmVzcyAmJiB0eXBlb2Ygd2FsbGV0QWRkcmVzcyA9PT0gXCJzdHJpbmdcIiwgXCJNdXN0IHNwZWNpZnkgd2FsbGV0IGFkZHJlc3MgdG8gYmUgbWluZWQgdG9cIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmxvY2tfdGVtcGxhdGVcIiwge3dhbGxldF9hZGRyZXNzOiB3YWxsZXRBZGRyZXNzLCByZXNlcnZlX3NpemU6IHJlc2VydmVTaXplfSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Jsb2NrVGVtcGxhdGUocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBnZXRMYXN0QmxvY2tIZWFkZXIoKTogUHJvbWlzZTxNb25lcm9CbG9ja0hlYWRlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRMYXN0QmxvY2tIZWFkZXIoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9sYXN0X2Jsb2NrX2hlYWRlclwiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQmxvY2tIZWFkZXIocmVzcC5yZXN1bHQuYmxvY2tfaGVhZGVyKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tIZWFkZXJCeUhhc2goYmxvY2tIYXNoOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0Jsb2NrSGVhZGVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2NrSGVhZGVyQnlIYXNoKGJsb2NrSGFzaCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmxvY2tfaGVhZGVyX2J5X2hhc2hcIiwge2hhc2g6IGJsb2NrSGFzaH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNCbG9ja0hlYWRlcihyZXNwLnJlc3VsdC5ibG9ja19oZWFkZXIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0hlYWRlckJ5SGVpZ2h0KGhlaWdodDogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9CbG9ja0hlYWRlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRCbG9ja0hlYWRlckJ5SGVpZ2h0KGhlaWdodCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmxvY2tfaGVhZGVyX2J5X2hlaWdodFwiLCB7aGVpZ2h0OiBoZWlnaHR9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQmxvY2tIZWFkZXIocmVzcC5yZXN1bHQuYmxvY2tfaGVhZGVyKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tIZWFkZXJzQnlSYW5nZShzdGFydEhlaWdodD86IG51bWJlciwgZW5kSGVpZ2h0PzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9CbG9ja0hlYWRlcltdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2NrSGVhZGVyc0J5UmFuZ2Uoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCk7XG4gICAgXG4gICAgLy8gZmV0Y2ggYmxvY2sgaGVhZGVyc1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2Jsb2NrX2hlYWRlcnNfcmFuZ2VcIiwge1xuICAgICAgc3RhcnRfaGVpZ2h0OiBzdGFydEhlaWdodCxcbiAgICAgIGVuZF9oZWlnaHQ6IGVuZEhlaWdodFxuICAgIH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICBcbiAgICAvLyBidWlsZCBoZWFkZXJzXG4gICAgbGV0IGhlYWRlcnMgPSBbXTtcbiAgICBmb3IgKGxldCBycGNIZWFkZXIgb2YgcmVzcC5yZXN1bHQuaGVhZGVycykge1xuICAgICAgaGVhZGVycy5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQmxvY2tIZWFkZXIocnBjSGVhZGVyKSk7XG4gICAgfVxuICAgIHJldHVybiBoZWFkZXJzO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0J5SGFzaChibG9ja0hhc2g6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQmxvY2s+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tCeUhhc2goYmxvY2tIYXNoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9ibG9ja1wiLCB7aGFzaDogYmxvY2tIYXNofSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Jsb2NrKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tCeUhlaWdodChoZWlnaHQ6IG51bWJlcik6IFByb21pc2U8TW9uZXJvQmxvY2s+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tCeUhlaWdodChoZWlnaHQpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2Jsb2NrXCIsIHtoZWlnaHQ6IGhlaWdodH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNCbG9jayhyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2Nrc0J5SGVpZ2h0KGhlaWdodHM6IG51bWJlcltdKTogUHJvbWlzZTxNb25lcm9CbG9ja1tdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2Nrc0J5SGVpZ2h0KGhlaWdodHMpO1xuICAgIFxuICAgIC8vIGZldGNoIGJsb2NrcyBpbiBiaW5hcnlcbiAgICBsZXQgcmVzcEJpbiA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRCaW5hcnlSZXF1ZXN0KFwiZ2V0X2Jsb2Nrc19ieV9oZWlnaHQuYmluXCIsIHtoZWlnaHRzOiBoZWlnaHRzfSk7XG4gICAgXG4gICAgLy8gY29udmVydCBiaW5hcnkgYmxvY2tzIHRvIGpzb25cbiAgICBsZXQgcnBjQmxvY2tzID0gYXdhaXQgTW9uZXJvVXRpbHMuYmluYXJ5QmxvY2tzVG9Kc29uKHJlc3BCaW4pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJwY0Jsb2Nrcyk7XG4gICAgXG4gICAgLy8gYnVpbGQgYmxvY2tzIHdpdGggdHJhbnNhY3Rpb25zXG4gICAgYXNzZXJ0LmVxdWFsKHJwY0Jsb2Nrcy50eHMubGVuZ3RoLCBycGNCbG9ja3MuYmxvY2tzLmxlbmd0aCk7ICAgIFxuICAgIGxldCBibG9ja3MgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0lkeCA9IDA7IGJsb2NrSWR4IDwgcnBjQmxvY2tzLmJsb2Nrcy5sZW5ndGg7IGJsb2NrSWR4KyspIHtcbiAgICAgIFxuICAgICAgLy8gYnVpbGQgYmxvY2tcbiAgICAgIGxldCBibG9jayA9IE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQmxvY2socnBjQmxvY2tzLmJsb2Nrc1tibG9ja0lkeF0pO1xuICAgICAgYmxvY2suc2V0SGVpZ2h0KGhlaWdodHNbYmxvY2tJZHhdKTtcbiAgICAgIGJsb2Nrcy5wdXNoKGJsb2NrKTtcbiAgICAgIFxuICAgICAgLy8gYnVpbGQgdHJhbnNhY3Rpb25zXG4gICAgICBsZXQgdHhzID0gW107XG4gICAgICBmb3IgKGxldCB0eElkeCA9IDA7IHR4SWR4IDwgcnBjQmxvY2tzLnR4c1tibG9ja0lkeF0ubGVuZ3RoOyB0eElkeCsrKSB7XG4gICAgICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeCgpO1xuICAgICAgICB0eHMucHVzaCh0eCk7XG4gICAgICAgIHR4LnNldEhhc2gocnBjQmxvY2tzLmJsb2Nrc1tibG9ja0lkeF0udHhfaGFzaGVzW3R4SWR4XSk7XG4gICAgICAgIHR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgICAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgICAgIHR4LnNldFJlbGF5KHRydWUpO1xuICAgICAgICB0eC5zZXRJc1JlbGF5ZWQodHJ1ZSk7XG4gICAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICAgICAgdHguc2V0SXNEb3VibGVTcGVuZFNlZW4oZmFsc2UpO1xuICAgICAgICBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1R4KHJwY0Jsb2Nrcy50eHNbYmxvY2tJZHhdW3R4SWR4XSwgdHgpO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBtZXJnZSBpbnRvIG9uZSBibG9ja1xuICAgICAgYmxvY2suc2V0VHhzKFtdKTtcbiAgICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgICBpZiAodHguZ2V0QmxvY2soKSkgYmxvY2subWVyZ2UodHguZ2V0QmxvY2soKSk7XG4gICAgICAgIGVsc2UgYmxvY2suZ2V0VHhzKCkucHVzaCh0eC5zZXRCbG9jayhibG9jaykpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gYmxvY2tzO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja3NCeVJhbmdlKHN0YXJ0SGVpZ2h0PzogbnVtYmVyLCBlbmRIZWlnaHQ/OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb0Jsb2NrW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tzQnlSYW5nZShzdGFydEhlaWdodCwgZW5kSGVpZ2h0KTtcbiAgICBpZiAoc3RhcnRIZWlnaHQgPT09IHVuZGVmaW5lZCkgc3RhcnRIZWlnaHQgPSAwO1xuICAgIGlmIChlbmRIZWlnaHQgPT09IHVuZGVmaW5lZCkgZW5kSGVpZ2h0ID0gYXdhaXQgdGhpcy5nZXRIZWlnaHQoKSAtIDE7XG4gICAgbGV0IGhlaWdodHMgPSBbXTtcbiAgICBmb3IgKGxldCBoZWlnaHQgPSBzdGFydEhlaWdodDsgaGVpZ2h0IDw9IGVuZEhlaWdodDsgaGVpZ2h0KyspIGhlaWdodHMucHVzaChoZWlnaHQpO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmdldEJsb2Nrc0J5SGVpZ2h0KGhlaWdodHMpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja3NCeVJhbmdlQ2h1bmtlZChzdGFydEhlaWdodD86IG51bWJlciwgZW5kSGVpZ2h0PzogbnVtYmVyLCBtYXhDaHVua1NpemU/OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb0Jsb2NrW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tzQnlSYW5nZUNodW5rZWQoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgbWF4Q2h1bmtTaXplKTtcbiAgICBpZiAoc3RhcnRIZWlnaHQgPT09IHVuZGVmaW5lZCkgc3RhcnRIZWlnaHQgPSAwO1xuICAgIGlmIChlbmRIZWlnaHQgPT09IHVuZGVmaW5lZCkgZW5kSGVpZ2h0ID0gYXdhaXQgdGhpcy5nZXRIZWlnaHQoKSAtIDE7XG4gICAgbGV0IGxhc3RIZWlnaHQgPSBzdGFydEhlaWdodCAtIDE7XG4gICAgbGV0IGJsb2NrcyA9IFtdO1xuICAgIHdoaWxlIChsYXN0SGVpZ2h0IDwgZW5kSGVpZ2h0KSB7XG4gICAgICBmb3IgKGxldCBibG9jayBvZiBhd2FpdCB0aGlzLmdldE1heEJsb2NrcyhsYXN0SGVpZ2h0ICsgMSwgZW5kSGVpZ2h0LCBtYXhDaHVua1NpemUpKSB7XG4gICAgICAgIGJsb2Nrcy5wdXNoKGJsb2NrKTtcbiAgICAgIH1cbiAgICAgIGxhc3RIZWlnaHQgPSBibG9ja3NbYmxvY2tzLmxlbmd0aCAtIDFdLmdldEhlaWdodCgpO1xuICAgIH1cbiAgICByZXR1cm4gYmxvY2tzO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeHModHhIYXNoZXM6IHN0cmluZ1tdLCBwcnVuZSA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9UeFtdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFR4cyh0eEhhc2hlcywgcHJ1bmUpO1xuICAgICAgICBcbiAgICAvLyB2YWxpZGF0ZSBpbnB1dFxuICAgIGFzc2VydChBcnJheS5pc0FycmF5KHR4SGFzaGVzKSAmJiB0eEhhc2hlcy5sZW5ndGggPiAwLCBcIk11c3QgcHJvdmlkZSBhbiBhcnJheSBvZiB0cmFuc2FjdGlvbiBoYXNoZXNcIik7XG4gICAgYXNzZXJ0KHBydW5lID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIHBydW5lID09PSBcImJvb2xlYW5cIiwgXCJQcnVuZSBtdXN0IGJlIGEgYm9vbGVhbiBvciB1bmRlZmluZWRcIik7XG4gICAgICAgIFxuICAgIC8vIGZldGNoIHRyYW5zYWN0aW9uc1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwiZ2V0X3RyYW5zYWN0aW9uc1wiLCB7XG4gICAgICB0eHNfaGFzaGVzOiB0eEhhc2hlcyxcbiAgICAgIGRlY29kZV9hc19qc29uOiB0cnVlLFxuICAgICAgcHJ1bmU6IHBydW5lXG4gICAgfSk7XG4gICAgdHJ5IHtcbiAgICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgaWYgKGUubWVzc2FnZS5pbmRleE9mKFwiRmFpbGVkIHRvIHBhcnNlIGhleCByZXByZXNlbnRhdGlvbiBvZiB0cmFuc2FjdGlvbiBoYXNoXCIpID49IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkludmFsaWQgdHJhbnNhY3Rpb24gaGFzaFwiKTtcbiAgICAgIHRocm93IGU7XG4gICAgfVxuICAgICAgICBcbiAgICAvLyBidWlsZCB0cmFuc2FjdGlvbiBtb2RlbHNcbiAgICBsZXQgdHhzID0gW107XG4gICAgaWYgKHJlc3AudHhzKSB7XG4gICAgICBmb3IgKGxldCB0eElkeCA9IDA7IHR4SWR4IDwgcmVzcC50eHMubGVuZ3RoOyB0eElkeCsrKSB7XG4gICAgICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeCgpO1xuICAgICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgICAgICB0eHMucHVzaChNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1R4KHJlc3AudHhzW3R4SWR4XSwgdHgpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHR4cztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhIZXhlcyh0eEhhc2hlczogc3RyaW5nW10sIHBydW5lID0gZmFsc2UpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFR4SGV4ZXModHhIYXNoZXMsIHBydW5lKTtcbiAgICBsZXQgaGV4ZXMgPSBbXTtcbiAgICBmb3IgKGxldCB0eCBvZiBhd2FpdCB0aGlzLmdldFR4cyh0eEhhc2hlcywgcHJ1bmUpKSBoZXhlcy5wdXNoKHBydW5lID8gdHguZ2V0UHJ1bmVkSGV4KCkgOiB0eC5nZXRGdWxsSGV4KCkpO1xuICAgIHJldHVybiBoZXhlcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TWluZXJUeFN1bShoZWlnaHQ6IG51bWJlciwgbnVtQmxvY2tzOiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb01pbmVyVHhTdW0+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0TWluZXJUeFN1bShoZWlnaHQsIG51bUJsb2Nrcyk7XG4gICAgaWYgKGhlaWdodCA9PT0gdW5kZWZpbmVkKSBoZWlnaHQgPSAwO1xuICAgIGVsc2UgYXNzZXJ0KGhlaWdodCA+PSAwLCBcIkhlaWdodCBtdXN0IGJlIGFuIGludGVnZXIgPj0gMFwiKTtcbiAgICBpZiAobnVtQmxvY2tzID09PSB1bmRlZmluZWQpIG51bUJsb2NrcyA9IGF3YWl0IHRoaXMuZ2V0SGVpZ2h0KCk7XG4gICAgZWxzZSBhc3NlcnQobnVtQmxvY2tzID49IDAsIFwiQ291bnQgbXVzdCBiZSBhbiBpbnRlZ2VyID49IDBcIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfY29pbmJhc2VfdHhfc3VtXCIsIHtoZWlnaHQ6IGhlaWdodCwgY291bnQ6IG51bUJsb2Nrc30pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICBsZXQgdHhTdW0gPSBuZXcgTW9uZXJvTWluZXJUeFN1bSgpO1xuICAgIHR4U3VtLnNldEVtaXNzaW9uU3VtKEJpZ0ludChyZXNwLnJlc3VsdC5lbWlzc2lvbl9hbW91bnQpKTtcbiAgICB0eFN1bS5zZXRGZWVTdW0oQmlnSW50KHJlc3AucmVzdWx0LmZlZV9hbW91bnQpKTtcbiAgICByZXR1cm4gdHhTdW07XG4gIH1cbiAgXG4gIGFzeW5jIGdldEZlZUVzdGltYXRlKGdyYWNlQmxvY2tzPzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9GZWVFc3RpbWF0ZT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRGZWVFc3RpbWF0ZShncmFjZUJsb2Nrcyk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfZmVlX2VzdGltYXRlXCIsIHtncmFjZV9ibG9ja3M6IGdyYWNlQmxvY2tzfSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIGxldCBmZWVFc3RpbWF0ZSA9IG5ldyBNb25lcm9GZWVFc3RpbWF0ZSgpO1xuICAgIGZlZUVzdGltYXRlLnNldEZlZShCaWdJbnQocmVzcC5yZXN1bHQuZmVlKSk7XG4gICAgZmVlRXN0aW1hdGUuc2V0UXVhbnRpemF0aW9uTWFzayhCaWdJbnQocmVzcC5yZXN1bHQucXVhbnRpemF0aW9uX21hc2spKTtcbiAgICBpZiAocmVzcC5yZXN1bHQuZmVlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBsZXQgZmVlcyA9IFtdO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZXNwLnJlc3VsdC5mZWVzLmxlbmd0aDsgaSsrKSBmZWVzLnB1c2goQmlnSW50KHJlc3AucmVzdWx0LmZlZXNbaV0pKTtcbiAgICAgIGZlZUVzdGltYXRlLnNldEZlZXMoZmVlcyk7XG4gICAgfVxuICAgIHJldHVybiBmZWVFc3RpbWF0ZTtcbiAgfVxuICBcbiAgYXN5bmMgc3VibWl0VHhIZXgodHhIZXg6IHN0cmluZywgZG9Ob3RSZWxheTogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvU3VibWl0VHhSZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc3VibWl0VHhIZXgodHhIZXgsIGRvTm90UmVsYXkpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwic2VuZF9yYXdfdHJhbnNhY3Rpb25cIiwge3R4X2FzX2hleDogdHhIZXgsIGRvX25vdF9yZWxheTogZG9Ob3RSZWxheX0pO1xuICAgIGxldCByZXN1bHQgPSBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1N1Ym1pdFR4UmVzdWx0KHJlc3ApO1xuICAgIFxuICAgIC8vIHNldCBpc0dvb2QgYmFzZWQgb24gc3RhdHVzXG4gICAgdHJ5IHtcbiAgICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApOyBcbiAgICAgIHJlc3VsdC5zZXRJc0dvb2QodHJ1ZSk7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICByZXN1bHQuc2V0SXNHb29kKGZhbHNlKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBcbiAgYXN5bmMgcmVsYXlUeHNCeUhhc2godHhIYXNoZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnJlbGF5VHhzQnlIYXNoKHR4SGFzaGVzKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInJlbGF5X3R4XCIsIHt0eGlkczogdHhIYXNoZXN9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4UG9vbCgpOiBQcm9taXNlPE1vbmVyb1R4W10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0VHhQb29sKCk7XG4gICAgXG4gICAgLy8gc2VuZCBycGMgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwiZ2V0X3RyYW5zYWN0aW9uX3Bvb2xcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgXG4gICAgLy8gYnVpbGQgdHhzXG4gICAgbGV0IHR4cyA9IFtdO1xuICAgIGlmIChyZXNwLnRyYW5zYWN0aW9ucykge1xuICAgICAgZm9yIChsZXQgcnBjVHggb2YgcmVzcC50cmFuc2FjdGlvbnMpIHtcbiAgICAgICAgbGV0IHR4ID0gbmV3IE1vbmVyb1R4KCk7XG4gICAgICAgIHR4cy5wdXNoKHR4KTtcbiAgICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgICAgICB0eC5zZXRJblR4UG9vbCh0cnVlKTtcbiAgICAgICAgdHguc2V0TnVtQ29uZmlybWF0aW9ucygwKTtcbiAgICAgICAgTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNUeChycGNUeCwgdHgpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdHhzO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFBvb2xIYXNoZXMoKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuICBcbiAgLy8gYXN5bmMgZ2V0VHhQb29sQmFja2xvZygpOiBQcm9taXNlPE1vbmVyb1R4QmFja2xvZ0VudHJ5W10+IHtcbiAgLy8gICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIC8vIH1cblxuICBhc3luYyBnZXRUeFBvb2xTdGF0cygpOiBQcm9taXNlPE1vbmVyb1R4UG9vbFN0YXRzPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFR4UG9vbFN0YXRzKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJnZXRfdHJhbnNhY3Rpb25fcG9vbF9zdGF0c1wiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNUeFBvb2xTdGF0cyhyZXNwLnBvb2xfc3RhdHMpO1xuICB9XG4gIFxuICBhc3luYyBmbHVzaFR4UG9vbChoYXNoZXM/OiBzdHJpbmcgfCBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5mbHVzaFR4UG9vbChoYXNoZXMpO1xuICAgIGlmIChoYXNoZXMpIGhhc2hlcyA9IEdlblV0aWxzLmxpc3RpZnkoaGFzaGVzKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImZsdXNoX3R4cG9vbFwiLCB7dHhpZHM6IGhhc2hlc30pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzKGtleUltYWdlczogc3RyaW5nW10pOiBQcm9taXNlPE1vbmVyb0tleUltYWdlU3BlbnRTdGF0dXNbXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRLZXlJbWFnZVNwZW50U3RhdHVzZXMoa2V5SW1hZ2VzKTtcbiAgICBpZiAoa2V5SW1hZ2VzID09PSB1bmRlZmluZWQgfHwga2V5SW1hZ2VzLmxlbmd0aCA9PT0gMCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGtleSBpbWFnZXMgdG8gY2hlY2sgdGhlIHN0YXR1cyBvZlwiKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImlzX2tleV9pbWFnZV9zcGVudFwiLCB7a2V5X2ltYWdlczoga2V5SW1hZ2VzfSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgcmV0dXJuIHJlc3Auc3BlbnRfc3RhdHVzO1xuICB9XG4gIFxuICBhc3luYyBnZXRPdXRwdXRIaXN0b2dyYW0oYW1vdW50cz86IGJpZ2ludFtdLCBtaW5Db3VudD86IG51bWJlciwgbWF4Q291bnQ/OiBudW1iZXIsIGlzVW5sb2NrZWQ/OiBib29sZWFuLCByZWNlbnRDdXRvZmY/OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb091dHB1dEhpc3RvZ3JhbUVudHJ5W10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0T3V0cHV0SGlzdG9ncmFtKGFtb3VudHMsIG1pbkNvdW50LCBtYXhDb3VudCwgaXNVbmxvY2tlZCwgcmVjZW50Q3V0b2ZmKTtcbiAgICBcbiAgICAvLyBzZW5kIHJwYyByZXF1ZXN0XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfb3V0cHV0X2hpc3RvZ3JhbVwiLCB7XG4gICAgICBhbW91bnRzOiBhbW91bnRzLFxuICAgICAgbWluX2NvdW50OiBtaW5Db3VudCxcbiAgICAgIG1heF9jb3VudDogbWF4Q291bnQsXG4gICAgICB1bmxvY2tlZDogaXNVbmxvY2tlZCxcbiAgICAgIHJlY2VudF9jdXRvZmY6IHJlY2VudEN1dG9mZlxuICAgIH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICBcbiAgICAvLyBidWlsZCBoaXN0b2dyYW0gZW50cmllcyBmcm9tIHJlc3BvbnNlXG4gICAgbGV0IGVudHJpZXMgPSBbXTtcbiAgICBpZiAoIXJlc3AucmVzdWx0Lmhpc3RvZ3JhbSkgcmV0dXJuIGVudHJpZXM7XG4gICAgZm9yIChsZXQgcnBjRW50cnkgb2YgcmVzcC5yZXN1bHQuaGlzdG9ncmFtKSB7XG4gICAgICBlbnRyaWVzLnB1c2goTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNPdXRwdXRIaXN0b2dyYW1FbnRyeShycGNFbnRyeSkpO1xuICAgIH1cbiAgICByZXR1cm4gZW50cmllcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0T3V0cHV0RGlzdHJpYnV0aW9uKGFtb3VudHMsIGN1bXVsYXRpdmUsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpIHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0T3V0cHV0RGlzdHJpYnV0aW9uKGFtb3VudHMsIGN1bXVsYXRpdmUsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpO1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZCAocmVzcG9uc2UgJ2Rpc3RyaWJ1dGlvbicgZmllbGQgaXMgYmluYXJ5KVwiKTtcbiAgICBcbi8vICAgIGxldCBhbW91bnRTdHJzID0gW107XG4vLyAgICBmb3IgKGxldCBhbW91bnQgb2YgYW1vdW50cykgYW1vdW50U3Rycy5wdXNoKGFtb3VudC50b0pTVmFsdWUoKSk7XG4vLyAgICBjb25zb2xlLmxvZyhhbW91bnRTdHJzKTtcbi8vICAgIGNvbnNvbGUubG9nKGN1bXVsYXRpdmUpO1xuLy8gICAgY29uc29sZS5sb2coc3RhcnRIZWlnaHQpO1xuLy8gICAgY29uc29sZS5sb2coZW5kSGVpZ2h0KTtcbi8vICAgIFxuLy8gICAgLy8gc2VuZCBycGMgcmVxdWVzdFxuLy8gICAgY29uc29sZS5sb2coXCIqKioqKioqKioqKiBTRU5ESU5HIFJFUVVFU1QgKioqKioqKioqKioqKlwiKTtcbi8vICAgIGlmIChzdGFydEhlaWdodCA9PT0gdW5kZWZpbmVkKSBzdGFydEhlaWdodCA9IDA7XG4vLyAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9vdXRwdXRfZGlzdHJpYnV0aW9uXCIsIHtcbi8vICAgICAgYW1vdW50czogYW1vdW50U3Rycyxcbi8vICAgICAgY3VtdWxhdGl2ZTogY3VtdWxhdGl2ZSxcbi8vICAgICAgZnJvbV9oZWlnaHQ6IHN0YXJ0SGVpZ2h0LFxuLy8gICAgICB0b19oZWlnaHQ6IGVuZEhlaWdodFxuLy8gICAgfSk7XG4vLyAgICBcbi8vICAgIGNvbnNvbGUubG9nKFwiUkVTUE9OU0VcIik7XG4vLyAgICBjb25zb2xlLmxvZyhyZXNwKTtcbi8vICAgIFxuLy8gICAgLy8gYnVpbGQgZGlzdHJpYnV0aW9uIGVudHJpZXMgZnJvbSByZXNwb25zZVxuLy8gICAgbGV0IGVudHJpZXMgPSBbXTtcbi8vICAgIGlmICghcmVzcC5yZXN1bHQuZGlzdHJpYnV0aW9ucykgcmV0dXJuIGVudHJpZXM7IFxuLy8gICAgZm9yIChsZXQgcnBjRW50cnkgb2YgcmVzcC5yZXN1bHQuZGlzdHJpYnV0aW9ucykge1xuLy8gICAgICBsZXQgZW50cnkgPSBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY091dHB1dERpc3RyaWJ1dGlvbkVudHJ5KHJwY0VudHJ5KTtcbi8vICAgICAgZW50cmllcy5wdXNoKGVudHJ5KTtcbi8vICAgIH1cbi8vICAgIHJldHVybiBlbnRyaWVzO1xuICB9XG4gIFxuICBhc3luYyBnZXRJbmZvKCk6IFByb21pc2U8TW9uZXJvRGFlbW9uSW5mbz4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRJbmZvKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfaW5mb1wiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjSW5mbyhyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFN5bmNJbmZvKCk6IFByb21pc2U8TW9uZXJvRGFlbW9uU3luY0luZm8+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0U3luY0luZm8oKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN5bmNfaW5mb1wiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjU3luY0luZm8ocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBnZXRIYXJkRm9ya0luZm8oKTogUHJvbWlzZTxNb25lcm9IYXJkRm9ya0luZm8+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0SGFyZEZvcmtJbmZvKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJoYXJkX2ZvcmtfaW5mb1wiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjSGFyZEZvcmtJbmZvKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWx0Q2hhaW5zKCk6IFByb21pc2U8TW9uZXJvQWx0Q2hhaW5bXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRBbHRDaGFpbnMoKTtcbiAgICBcbi8vICAgIC8vIG1vY2tlZCByZXNwb25zZSBmb3IgdGVzdFxuLy8gICAgbGV0IHJlc3AgPSB7XG4vLyAgICAgICAgc3RhdHVzOiBcIk9LXCIsXG4vLyAgICAgICAgY2hhaW5zOiBbXG4vLyAgICAgICAgICB7XG4vLyAgICAgICAgICAgIGJsb2NrX2hhc2g6IFwiNjk3Y2YwM2M4OWE5YjExOGY3YmRmMTFiMWIzYTZhMDI4ZDdiMzYxN2QyZDBlZDkxMzIyYzU3MDlhY2Y3NTYyNVwiLFxuLy8gICAgICAgICAgICBkaWZmaWN1bHR5OiAxNDExNDcyOTYzODMwMDI4MCxcbi8vICAgICAgICAgICAgaGVpZ2h0OiAxNTYyMDYyLFxuLy8gICAgICAgICAgICBsZW5ndGg6IDJcbi8vICAgICAgICAgIH1cbi8vICAgICAgICBdXG4vLyAgICB9XG4gICAgXG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYWx0ZXJuYXRlX2NoYWluc1wiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgbGV0IGNoYWlucyA9IFtdO1xuICAgIGlmICghcmVzcC5yZXN1bHQuY2hhaW5zKSByZXR1cm4gY2hhaW5zO1xuICAgIGZvciAobGV0IHJwY0NoYWluIG9mIHJlc3AucmVzdWx0LmNoYWlucykgY2hhaW5zLnB1c2goTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNBbHRDaGFpbihycGNDaGFpbikpO1xuICAgIHJldHVybiBjaGFpbnM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFsdEJsb2NrSGFzaGVzKCk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QWx0QmxvY2tIYXNoZXMoKTtcbiAgICBcbi8vICAgIC8vIG1vY2tlZCByZXNwb25zZSBmb3IgdGVzdFxuLy8gICAgbGV0IHJlc3AgPSB7XG4vLyAgICAgICAgc3RhdHVzOiBcIk9LXCIsXG4vLyAgICAgICAgdW50cnVzdGVkOiBmYWxzZSxcbi8vICAgICAgICBibGtzX2hhc2hlczogW1wiOWMyMjc3YzU0NzAyMzRiZThiMzIzODJjZGY4MDk0YTEwM2FiYTRmY2Q1ZTg3NWE2ZmMxNTlkYzJlYzAwZTAxMVwiLFwiNjM3YzBlMGYwNTU4ZTI4NDQ5M2YzOGE1ZmNjYTM2MTVkYjU5NDU4ZDkwZDNhNWVmZjBhMThmZjU5YjgzZjQ2ZlwiLFwiNmYzYWRjMTc0YTJlODA4MjgxOWViYjk2NWM5NmEwOTVlM2U4YjYzOTI5YWQ5YmUyZDcwNWFkOWMwODZhNmIxY1wiLFwiNjk3Y2YwM2M4OWE5YjExOGY3YmRmMTFiMWIzYTZhMDI4ZDdiMzYxN2QyZDBlZDkxMzIyYzU3MDlhY2Y3NTYyNVwiXVxuLy8gICAgfVxuICAgIFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwiZ2V0X2FsdF9ibG9ja3NfaGFzaGVzXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIGlmICghcmVzcC5ibGtzX2hhc2hlcykgcmV0dXJuIFtdO1xuICAgIHJldHVybiByZXNwLmJsa3NfaGFzaGVzO1xuICB9XG4gIFxuICBhc3luYyBnZXREb3dubG9hZExpbWl0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldERvd25sb2FkTGltaXQoKTtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuZ2V0QmFuZHdpZHRoTGltaXRzKCkpWzBdO1xuICB9XG4gIFxuICBhc3luYyBzZXREb3dubG9hZExpbWl0KGxpbWl0OiBudW1iZXIpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5zZXREb3dubG9hZExpbWl0KGxpbWl0KTtcbiAgICBpZiAobGltaXQgPT0gLTEpIHJldHVybiBhd2FpdCB0aGlzLnJlc2V0RG93bmxvYWRMaW1pdCgpO1xuICAgIGlmICghKEdlblV0aWxzLmlzSW50KGxpbWl0KSAmJiBsaW1pdCA+IDApKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJEb3dubG9hZCBsaW1pdCBtdXN0IGJlIGFuIGludGVnZXIgZ3JlYXRlciB0aGFuIDBcIik7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLnNldEJhbmR3aWR0aExpbWl0cyhsaW1pdCwgMCkpWzBdO1xuICB9XG4gIFxuICBhc3luYyByZXNldERvd25sb2FkTGltaXQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24ucmVzZXREb3dubG9hZExpbWl0KCk7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLnNldEJhbmR3aWR0aExpbWl0cygtMSwgMCkpWzBdO1xuICB9XG5cbiAgYXN5bmMgZ2V0VXBsb2FkTGltaXQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0VXBsb2FkTGltaXQoKTtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuZ2V0QmFuZHdpZHRoTGltaXRzKCkpWzFdO1xuICB9XG4gIFxuICBhc3luYyBzZXRVcGxvYWRMaW1pdChsaW1pdDogbnVtYmVyKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc2V0VXBsb2FkTGltaXQobGltaXQpO1xuICAgIGlmIChsaW1pdCA9PSAtMSkgcmV0dXJuIGF3YWl0IHRoaXMucmVzZXRVcGxvYWRMaW1pdCgpO1xuICAgIGlmICghKEdlblV0aWxzLmlzSW50KGxpbWl0KSAmJiBsaW1pdCA+IDApKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJVcGxvYWQgbGltaXQgbXVzdCBiZSBhbiBpbnRlZ2VyIGdyZWF0ZXIgdGhhbiAwXCIpO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5zZXRCYW5kd2lkdGhMaW1pdHMoMCwgbGltaXQpKVsxXTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzZXRVcGxvYWRMaW1pdCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5yZXNldFVwbG9hZExpbWl0KCk7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLnNldEJhbmR3aWR0aExpbWl0cygwLCAtMSkpWzFdO1xuICB9XG4gIFxuICBhc3luYyBnZXRQZWVycygpOiBQcm9taXNlPE1vbmVyb1BlZXJbXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRQZWVycygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2Nvbm5lY3Rpb25zXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICBsZXQgcGVlcnMgPSBbXTtcbiAgICBpZiAoIXJlc3AucmVzdWx0LmNvbm5lY3Rpb25zKSByZXR1cm4gcGVlcnM7XG4gICAgZm9yIChsZXQgcnBjQ29ubmVjdGlvbiBvZiByZXNwLnJlc3VsdC5jb25uZWN0aW9ucykge1xuICAgICAgcGVlcnMucHVzaChNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Nvbm5lY3Rpb24ocnBjQ29ubmVjdGlvbikpO1xuICAgIH1cbiAgICByZXR1cm4gcGVlcnM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEtub3duUGVlcnMoKTogUHJvbWlzZTxNb25lcm9QZWVyW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0S25vd25QZWVycygpO1xuICAgIFxuICAgIC8vIHR4IGNvbmZpZ1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwiZ2V0X3BlZXJfbGlzdFwiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICBcbiAgICAvLyBidWlsZCBwZWVyc1xuICAgIGxldCBwZWVycyA9IFtdO1xuICAgIGlmIChyZXNwLmdyYXlfbGlzdCkge1xuICAgICAgZm9yIChsZXQgcnBjUGVlciBvZiByZXNwLmdyYXlfbGlzdCkge1xuICAgICAgICBsZXQgcGVlciA9IE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjUGVlcihycGNQZWVyKTtcbiAgICAgICAgcGVlci5zZXRJc09ubGluZShmYWxzZSk7IC8vIGdyYXkgbGlzdCBtZWFucyBvZmZsaW5lIGxhc3QgY2hlY2tlZFxuICAgICAgICBwZWVycy5wdXNoKHBlZXIpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAocmVzcC53aGl0ZV9saXN0KSB7XG4gICAgICBmb3IgKGxldCBycGNQZWVyIG9mIHJlc3Aud2hpdGVfbGlzdCkge1xuICAgICAgICBsZXQgcGVlciA9IE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjUGVlcihycGNQZWVyKTtcbiAgICAgICAgcGVlci5zZXRJc09ubGluZSh0cnVlKTsgLy8gd2hpdGUgbGlzdCBtZWFucyBvbmxpbmUgbGFzdCBjaGVja2VkXG4gICAgICAgIHBlZXJzLnB1c2gocGVlcik7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwZWVycztcbiAgfVxuICBcbiAgYXN5bmMgc2V0T3V0Z29pbmdQZWVyTGltaXQobGltaXQ6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5zZXRPdXRnb2luZ1BlZXJMaW1pdChsaW1pdCk7XG4gICAgaWYgKCEoR2VuVXRpbHMuaXNJbnQobGltaXQpICYmIGxpbWl0ID49IDApKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJPdXRnb2luZyBwZWVyIGxpbWl0IG11c3QgYmUgPj0gMFwiKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcIm91dF9wZWVyc1wiLCB7b3V0X3BlZXJzOiBsaW1pdH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICB9XG4gIFxuICBhc3luYyBzZXRJbmNvbWluZ1BlZXJMaW1pdChsaW1pdDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnNldEluY29taW5nUGVlckxpbWl0KGxpbWl0KTtcbiAgICBpZiAoIShHZW5VdGlscy5pc0ludChsaW1pdCkgJiYgbGltaXQgPj0gMCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkluY29taW5nIHBlZXIgbGltaXQgbXVzdCBiZSA+PSAwXCIpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwiaW5fcGVlcnNcIiwge2luX3BlZXJzOiBsaW1pdH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICB9XG4gIFxuICBhc3luYyBnZXRQZWVyQmFucygpOiBQcm9taXNlPE1vbmVyb0JhbltdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFBlZXJCYW5zKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmFuc1wiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgbGV0IGJhbnMgPSBbXTtcbiAgICBmb3IgKGxldCBycGNCYW4gb2YgcmVzcC5yZXN1bHQuYmFucykge1xuICAgICAgbGV0IGJhbiA9IG5ldyBNb25lcm9CYW4oKTtcbiAgICAgIGJhbi5zZXRIb3N0KHJwY0Jhbi5ob3N0KTtcbiAgICAgIGJhbi5zZXRJcChycGNCYW4uaXApO1xuICAgICAgYmFuLnNldFNlY29uZHMocnBjQmFuLnNlY29uZHMpO1xuICAgICAgYmFucy5wdXNoKGJhbik7XG4gICAgfVxuICAgIHJldHVybiBiYW5zO1xuICB9XG4gIFxuICBhc3luYyBzZXRQZWVyQmFucyhiYW5zOiBNb25lcm9CYW5bXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5zZXRQZWVyQmFucyhiYW5zKTtcbiAgICBsZXQgcnBjQmFucyA9IFtdO1xuICAgIGZvciAobGV0IGJhbiBvZiBiYW5zKSBycGNCYW5zLnB1c2goTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRUb1JwY0JhbihiYW4pKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInNldF9iYW5zXCIsIHtiYW5zOiBycGNCYW5zfSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBzdGFydE1pbmluZyhhZGRyZXNzOiBzdHJpbmcsIG51bVRocmVhZHM/OiBudW1iZXIsIGlzQmFja2dyb3VuZD86IGJvb2xlYW4sIGlnbm9yZUJhdHRlcnk/OiBib29sZWFuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnN0YXJ0TWluaW5nKGFkZHJlc3MsIG51bVRocmVhZHMsIGlzQmFja2dyb3VuZCwgaWdub3JlQmF0dGVyeSk7XG4gICAgYXNzZXJ0KGFkZHJlc3MsIFwiTXVzdCBwcm92aWRlIGFkZHJlc3MgdG8gbWluZSB0b1wiKTtcbiAgICBhc3NlcnQoR2VuVXRpbHMuaXNJbnQobnVtVGhyZWFkcykgJiYgbnVtVGhyZWFkcyA+IDAsIFwiTnVtYmVyIG9mIHRocmVhZHMgbXVzdCBiZSBhbiBpbnRlZ2VyIGdyZWF0ZXIgdGhhbiAwXCIpO1xuICAgIGFzc2VydChpc0JhY2tncm91bmQgPT09IHVuZGVmaW5lZCB8fCB0eXBlb2YgaXNCYWNrZ3JvdW5kID09PSBcImJvb2xlYW5cIik7XG4gICAgYXNzZXJ0KGlnbm9yZUJhdHRlcnkgPT09IHVuZGVmaW5lZCB8fCB0eXBlb2YgaWdub3JlQmF0dGVyeSA9PT0gXCJib29sZWFuXCIpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwic3RhcnRfbWluaW5nXCIsIHtcbiAgICAgIG1pbmVyX2FkZHJlc3M6IGFkZHJlc3MsXG4gICAgICB0aHJlYWRzX2NvdW50OiBudW1UaHJlYWRzLFxuICAgICAgZG9fYmFja2dyb3VuZF9taW5pbmc6IGlzQmFja2dyb3VuZCxcbiAgICAgIGlnbm9yZV9iYXR0ZXJ5OiBpZ25vcmVCYXR0ZXJ5LFxuICAgIH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICB9XG4gIFxuICBhc3luYyBzdG9wTWluaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5zdG9wTWluaW5nKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJzdG9wX21pbmluZ1wiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TWluaW5nU3RhdHVzKCk6IFByb21pc2U8TW9uZXJvTWluaW5nU3RhdHVzPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldE1pbmluZ1N0YXR1cygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwibWluaW5nX3N0YXR1c1wiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNNaW5pbmdTdGF0dXMocmVzcCk7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdEJsb2NrcyhibG9ja0Jsb2JzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5zdWJtaXRCbG9ja3MoKTtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheShibG9ja0Jsb2JzKSAmJiBibG9ja0Jsb2JzLmxlbmd0aCA+IDAsIFwiTXVzdCBwcm92aWRlIGFuIGFycmF5IG9mIG1pbmVkIGJsb2NrIGJsb2JzIHRvIHN1Ym1pdFwiKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN1Ym1pdF9ibG9ja1wiLCBibG9ja0Jsb2JzKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gIH1cblxuICBhc3luYyBwcnVuZUJsb2NrY2hhaW4oY2hlY2s6IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb1BydW5lUmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnBydW5lQmxvY2tjaGFpbigpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicHJ1bmVfYmxvY2tjaGFpblwiLCB7Y2hlY2s6IGNoZWNrfSwgMCk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIGxldCByZXN1bHQgPSBuZXcgTW9uZXJvUHJ1bmVSZXN1bHQoKTtcbiAgICByZXN1bHQuc2V0SXNQcnVuZWQocmVzcC5yZXN1bHQucHJ1bmVkKTtcbiAgICByZXN1bHQuc2V0UHJ1bmluZ1NlZWQocmVzcC5yZXN1bHQucHJ1bmluZ19zZWVkKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIFxuICBhc3luYyBjaGVja0ZvclVwZGF0ZSgpOiBQcm9taXNlPE1vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmNoZWNrRm9yVXBkYXRlKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJ1cGRhdGVcIiwge2NvbW1hbmQ6IFwiY2hlY2tcIn0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1VwZGF0ZUNoZWNrUmVzdWx0KHJlc3ApO1xuICB9XG4gIFxuICBhc3luYyBkb3dubG9hZFVwZGF0ZShwYXRoPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5kb3dubG9hZFVwZGF0ZShwYXRoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcInVwZGF0ZVwiLCB7Y29tbWFuZDogXCJkb3dubG9hZFwiLCBwYXRoOiBwYXRofSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVXBkYXRlRG93bmxvYWRSZXN1bHQocmVzcCk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0b3AoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnN0b3AoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcInN0b3BfZGFlbW9uXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICB9XG4gIFxuICBhc3luYyB3YWl0Rm9yTmV4dEJsb2NrSGVhZGVyKCk6IFByb21pc2U8TW9uZXJvQmxvY2tIZWFkZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24ud2FpdEZvck5leHRCbG9ja0hlYWRlcigpO1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgZnVuY3Rpb24ocmVzb2x2ZSkge1xuICAgICAgYXdhaXQgdGhhdC5hZGRMaXN0ZW5lcihuZXcgY2xhc3MgZXh0ZW5kcyBNb25lcm9EYWVtb25MaXN0ZW5lciB7XG4gICAgICAgIGFzeW5jIG9uQmxvY2tIZWFkZXIoaGVhZGVyKSB7XG4gICAgICAgICAgYXdhaXQgdGhhdC5yZW1vdmVMaXN0ZW5lcih0aGlzKTtcbiAgICAgICAgICByZXNvbHZlKGhlYWRlcik7XG4gICAgICAgIH1cbiAgICAgIH0pOyBcbiAgICB9KTtcbiAgfVxuXG4gIGdldFBvbGxJbnRlcnZhbCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5wb2xsSW50ZXJ2YWw7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tIEFERCBKU0RPQyBGT1IgU1VQUE9SVEVEIERFRkFVTFQgSU1QTEVNRU5UQVRJT05TIC0tLS0tLS0tLS0tLS0tXG4gIGFzeW5jIGdldFR4KHR4SGFzaD86IHN0cmluZywgcHJ1bmUgPSBmYWxzZSk6IFByb21pc2U8TW9uZXJvVHh8dW5kZWZpbmVkPiB7IHJldHVybiBzdXBlci5nZXRUeCh0eEhhc2gsIHBydW5lKTsgfTtcbiAgYXN5bmMgZ2V0VHhIZXgodHhIYXNoOiBzdHJpbmcsIHBydW5lID0gZmFsc2UpOiBQcm9taXNlPHN0cmluZz4geyByZXR1cm4gc3VwZXIuZ2V0VHhIZXgodHhIYXNoLCBwcnVuZSk7IH07XG4gIGFzeW5jIGdldEtleUltYWdlU3BlbnRTdGF0dXMoa2V5SW1hZ2U6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VTcGVudFN0YXR1cz4geyByZXR1cm4gc3VwZXIuZ2V0S2V5SW1hZ2VTcGVudFN0YXR1cyhrZXlJbWFnZSk7IH1cbiAgYXN5bmMgc2V0UGVlckJhbihiYW46IE1vbmVyb0Jhbik6IFByb21pc2U8dm9pZD4geyByZXR1cm4gc3VwZXIuc2V0UGVlckJhbihiYW4pOyB9XG4gIGFzeW5jIHN1Ym1pdEJsb2NrKGJsb2NrQmxvYjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7IHJldHVybiBzdXBlci5zdWJtaXRCbG9jayhibG9ja0Jsb2IpOyB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFBSSVZBVEUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByb3RlY3RlZCByZWZyZXNoTGlzdGVuaW5nKCkge1xuICAgIGlmICh0aGlzLnBvbGxMaXN0ZW5lciA9PSB1bmRlZmluZWQgJiYgdGhpcy5saXN0ZW5lcnMubGVuZ3RoKSB0aGlzLnBvbGxMaXN0ZW5lciA9IG5ldyBEYWVtb25Qb2xsZXIodGhpcyk7XG4gICAgaWYgKHRoaXMucG9sbExpc3RlbmVyICE9PSB1bmRlZmluZWQpIHRoaXMucG9sbExpc3RlbmVyLnNldElzUG9sbGluZyh0aGlzLmxpc3RlbmVycy5sZW5ndGggPiAwKTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGdldEJhbmR3aWR0aExpbWl0cygpIHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImdldF9saW1pdFwiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICByZXR1cm4gW3Jlc3AubGltaXRfZG93biwgcmVzcC5saW1pdF91cF07XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBzZXRCYW5kd2lkdGhMaW1pdHMoZG93bkxpbWl0LCB1cExpbWl0KSB7XG4gICAgaWYgKGRvd25MaW1pdCA9PT0gdW5kZWZpbmVkKSBkb3duTGltaXQgPSAwO1xuICAgIGlmICh1cExpbWl0ID09PSB1bmRlZmluZWQpIHVwTGltaXQgPSAwO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwic2V0X2xpbWl0XCIsIHtsaW1pdF9kb3duOiBkb3duTGltaXQsIGxpbWl0X3VwOiB1cExpbWl0fSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgcmV0dXJuIFtyZXNwLmxpbWl0X2Rvd24sIHJlc3AubGltaXRfdXBdO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGEgY29udGlndW91cyBjaHVuayBvZiBibG9ja3Mgc3RhcnRpbmcgZnJvbSBhIGdpdmVuIGhlaWdodCB1cCB0byBhIG1heGltdW1cbiAgICogaGVpZ2h0IG9yIGFtb3VudCBvZiBibG9jayBkYXRhIGZldGNoZWQgZnJvbSB0aGUgYmxvY2tjaGFpbiwgd2hpY2hldmVyIGNvbWVzIGZpcnN0LlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtzdGFydEhlaWdodF0gLSBzdGFydCBoZWlnaHQgdG8gcmV0cmlldmUgYmxvY2tzIChkZWZhdWx0IDApXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbbWF4SGVpZ2h0XSAtIG1heGltdW0gZW5kIGhlaWdodCB0byByZXRyaWV2ZSBibG9ja3MgKGRlZmF1bHQgYmxvY2tjaGFpbiBoZWlnaHQpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbbWF4UmVxU2l6ZV0gLSBtYXhpbXVtIGFtb3VudCBvZiBibG9jayBkYXRhIHRvIGZldGNoIGZyb20gdGhlIGJsb2NrY2hhaW4gaW4gYnl0ZXMgKGRlZmF1bHQgMywwMDAsMDAwIGJ5dGVzKVxuICAgKiBAcmV0dXJuIHtNb25lcm9CbG9ja1tdfSBhcmUgdGhlIHJlc3VsdGluZyBjaHVuayBvZiBibG9ja3NcbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyBnZXRNYXhCbG9ja3Moc3RhcnRIZWlnaHQsIG1heEhlaWdodCwgbWF4UmVxU2l6ZSkge1xuICAgIGlmIChzdGFydEhlaWdodCA9PT0gdW5kZWZpbmVkKSBzdGFydEhlaWdodCA9IDA7XG4gICAgaWYgKG1heEhlaWdodCA9PT0gdW5kZWZpbmVkKSBtYXhIZWlnaHQgPSBhd2FpdCB0aGlzLmdldEhlaWdodCgpIC0gMTtcbiAgICBpZiAobWF4UmVxU2l6ZSA9PT0gdW5kZWZpbmVkKSBtYXhSZXFTaXplID0gTW9uZXJvRGFlbW9uUnBjLk1BWF9SRVFfU0laRTtcbiAgICBcbiAgICAvLyBkZXRlcm1pbmUgZW5kIGhlaWdodCB0byBmZXRjaFxuICAgIGxldCByZXFTaXplID0gMDtcbiAgICBsZXQgZW5kSGVpZ2h0ID0gc3RhcnRIZWlnaHQgLSAxO1xuICAgIHdoaWxlIChyZXFTaXplIDwgbWF4UmVxU2l6ZSAmJiBlbmRIZWlnaHQgPCBtYXhIZWlnaHQpIHtcbiAgICAgIFxuICAgICAgLy8gZ2V0IGhlYWRlciBvZiBuZXh0IGJsb2NrXG4gICAgICBsZXQgaGVhZGVyID0gYXdhaXQgdGhpcy5nZXRCbG9ja0hlYWRlckJ5SGVpZ2h0Q2FjaGVkKGVuZEhlaWdodCArIDEsIG1heEhlaWdodCk7XG4gICAgICBcbiAgICAgIC8vIGJsb2NrIGNhbm5vdCBiZSBiaWdnZXIgdGhhbiBtYXggcmVxdWVzdCBzaXplXG4gICAgICBhc3NlcnQoaGVhZGVyLmdldFNpemUoKSA8PSBtYXhSZXFTaXplLCBcIkJsb2NrIGV4Y2VlZHMgbWF4aW11bSByZXF1ZXN0IHNpemU6IFwiICsgaGVhZGVyLmdldFNpemUoKSk7XG4gICAgICBcbiAgICAgIC8vIGRvbmUgaXRlcmF0aW5nIGlmIGZldGNoaW5nIGJsb2NrIHdvdWxkIGV4Y2VlZCBtYXggcmVxdWVzdCBzaXplXG4gICAgICBpZiAocmVxU2l6ZSArIGhlYWRlci5nZXRTaXplKCkgPiBtYXhSZXFTaXplKSBicmVhaztcbiAgICAgIFxuICAgICAgLy8gb3RoZXJ3aXNlIGJsb2NrIGlzIGluY2x1ZGVkXG4gICAgICByZXFTaXplICs9IGhlYWRlci5nZXRTaXplKCk7XG4gICAgICBlbmRIZWlnaHQrKztcbiAgICB9XG4gICAgcmV0dXJuIGVuZEhlaWdodCA+PSBzdGFydEhlaWdodCA/IGF3YWl0IHRoaXMuZ2V0QmxvY2tzQnlSYW5nZShzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSA6IFtdO1xuICB9XG4gIFxuICAvKipcbiAgICogUmV0cmlldmVzIGEgaGVhZGVyIGJ5IGhlaWdodCBmcm9tIHRoZSBjYWNoZSBvciBmZXRjaGVzIGFuZCBjYWNoZXMgYSBoZWFkZXJcbiAgICogcmFuZ2UgaWYgbm90IGFscmVhZHkgaW4gdGhlIGNhY2hlLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodCAtIGhlaWdodCBvZiB0aGUgaGVhZGVyIHRvIHJldHJpZXZlIGZyb20gdGhlIGNhY2hlXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBtYXhIZWlnaHQgLSBtYXhpbXVtIGhlaWdodCBvZiBoZWFkZXJzIHRvIGNhY2hlXG4gICAqL1xuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0QmxvY2tIZWFkZXJCeUhlaWdodENhY2hlZChoZWlnaHQsIG1heEhlaWdodCkge1xuICAgIFxuICAgIC8vIGdldCBoZWFkZXIgZnJvbSBjYWNoZVxuICAgIGxldCBjYWNoZWRIZWFkZXIgPSB0aGlzLmNhY2hlZEhlYWRlcnNbaGVpZ2h0XTtcbiAgICBpZiAoY2FjaGVkSGVhZGVyKSByZXR1cm4gY2FjaGVkSGVhZGVyO1xuICAgIFxuICAgIC8vIGZldGNoIGFuZCBjYWNoZSBoZWFkZXJzIGlmIG5vdCBpbiBjYWNoZVxuICAgIGxldCBlbmRIZWlnaHQgPSBNYXRoLm1pbihtYXhIZWlnaHQsIGhlaWdodCArIE1vbmVyb0RhZW1vblJwYy5OVU1fSEVBREVSU19QRVJfUkVRIC0gMSk7ICAvLyBUT0RPOiBjb3VsZCBzcGVjaWZ5IGVuZCBoZWlnaHQgdG8gY2FjaGUgdG8gb3B0aW1pemUgc21hbGwgcmVxdWVzdHMgKHdvdWxkIGxpa2UgdG8gaGF2ZSB0aW1lIHByb2ZpbGluZyBpbiBwbGFjZSB0aG91Z2gpXG4gICAgbGV0IGhlYWRlcnMgPSBhd2FpdCB0aGlzLmdldEJsb2NrSGVhZGVyc0J5UmFuZ2UoaGVpZ2h0LCBlbmRIZWlnaHQpO1xuICAgIGZvciAobGV0IGhlYWRlciBvZiBoZWFkZXJzKSB7XG4gICAgICB0aGlzLmNhY2hlZEhlYWRlcnNbaGVhZGVyLmdldEhlaWdodCgpXSA9IGhlYWRlcjtcbiAgICB9XG4gICAgXG4gICAgLy8gcmV0dXJuIHRoZSBjYWNoZWQgaGVhZGVyXG4gICAgcmV0dXJuIHRoaXMuY2FjaGVkSGVhZGVyc1toZWlnaHRdO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU1RBVElDIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHN0YXRpYyBhc3luYyBjb25uZWN0VG9EYWVtb25ScGModXJpT3JDb25maWc6IHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4gfCBQYXJ0aWFsPE1vbmVyb0RhZW1vbkNvbmZpZz4gfCBzdHJpbmdbXSwgdXNlcm5hbWU/OiBzdHJpbmcsIHBhc3N3b3JkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9EYWVtb25ScGM+IHtcbiAgICBsZXQgY29uZmlnID0gTW9uZXJvRGFlbW9uUnBjLm5vcm1hbGl6ZUNvbmZpZyh1cmlPckNvbmZpZywgdXNlcm5hbWUsIHBhc3N3b3JkKTtcbiAgICBpZiAoY29uZmlnLmNtZCkgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5zdGFydE1vbmVyb2RQcm9jZXNzKGNvbmZpZyk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9EYWVtb25ScGMoY29uZmlnLCBjb25maWcucHJveHlUb1dvcmtlciA/IGF3YWl0IE1vbmVyb0RhZW1vblJwY1Byb3h5LmNvbm5lY3QoY29uZmlnKSA6IHVuZGVmaW5lZCk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgc3RhcnRNb25lcm9kUHJvY2Vzcyhjb25maWc6IE1vbmVyb0RhZW1vbkNvbmZpZyk6IFByb21pc2U8TW9uZXJvRGFlbW9uUnBjPiB7XG4gICAgYXNzZXJ0KEdlblV0aWxzLmlzQXJyYXkoY29uZmlnLmNtZCksIFwiTXVzdCBwcm92aWRlIHN0cmluZyBhcnJheSB3aXRoIGNvbW1hbmQgbGluZSBwYXJhbWV0ZXJzXCIpO1xuICAgIFxuICAgIC8vIHN0YXJ0IHByb2Nlc3NcbiAgICBsZXQgY2hpbGRQcm9jZXNzID0gcmVxdWlyZSgnY2hpbGRfcHJvY2VzcycpLnNwYXduKGNvbmZpZy5jbWRbMF0sIGNvbmZpZy5jbWQuc2xpY2UoMSksIHtcbiAgICAgIGVudjogeyAuLi5wcm9jZXNzLmVudiwgTEFORzogJ2VuX1VTLlVURi04JyB9IC8vIHNjcmFwZSBvdXRwdXQgaW4gZW5nbGlzaFxuICAgIH0pO1xuICAgIGNoaWxkUHJvY2Vzcy5zdGRvdXQuc2V0RW5jb2RpbmcoJ3V0ZjgnKTtcbiAgICBjaGlsZFByb2Nlc3Muc3RkZXJyLnNldEVuY29kaW5nKCd1dGY4Jyk7XG4gICAgXG4gICAgLy8gcmV0dXJuIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgYWZ0ZXIgc3RhcnRpbmcgbW9uZXJvZFxuICAgIGxldCB1cmk7XG4gICAgbGV0IG91dHB1dCA9IFwiXCI7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBhd2FpdCBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgc3Rkb3V0XG4gICAgICAgIGNoaWxkUHJvY2Vzcy5zdGRvdXQub24oJ2RhdGEnLCBhc3luYyBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgbGV0IGxpbmUgPSBkYXRhLnRvU3RyaW5nKCk7XG4gICAgICAgICAgTGlicmFyeVV0aWxzLmxvZygyLCBsaW5lKTtcbiAgICAgICAgICBvdXRwdXQgKz0gbGluZSArICdcXG4nOyAvLyBjYXB0dXJlIG91dHB1dCBpbiBjYXNlIG9mIGVycm9yXG4gICAgICAgICAgXG4gICAgICAgICAgLy8gZXh0cmFjdCB1cmkgZnJvbSBlLmcuIFwiSSBCaW5kaW5nIG9uIDEyNy4wLjAuMSAoSVB2NCk6MzgwODVcIlxuICAgICAgICAgIGxldCB1cmlMaW5lQ29udGFpbnMgPSBcIkJpbmRpbmcgb24gXCI7XG4gICAgICAgICAgbGV0IHVyaUxpbmVDb250YWluc0lkeCA9IGxpbmUuaW5kZXhPZih1cmlMaW5lQ29udGFpbnMpO1xuICAgICAgICAgIGlmICh1cmlMaW5lQ29udGFpbnNJZHggPj0gMCkge1xuICAgICAgICAgICAgbGV0IGhvc3QgPSBsaW5lLnN1YnN0cmluZyh1cmlMaW5lQ29udGFpbnNJZHggKyB1cmlMaW5lQ29udGFpbnMubGVuZ3RoLCBsaW5lLmxhc3RJbmRleE9mKCcgJykpO1xuICAgICAgICAgICAgbGV0IHVuZm9ybWF0dGVkTGluZSA9IGxpbmUucmVwbGFjZSgvXFx1MDAxYlxcWy4qP20vZywgJycpLnRyaW0oKTsgLy8gcmVtb3ZlIGNvbG9yIGZvcm1hdHRpbmdcbiAgICAgICAgICAgIGxldCBwb3J0ID0gdW5mb3JtYXR0ZWRMaW5lLnN1YnN0cmluZyh1bmZvcm1hdHRlZExpbmUubGFzdEluZGV4T2YoJzonKSArIDEpO1xuICAgICAgICAgICAgbGV0IHNzbElkeCA9IGNvbmZpZy5jbWQuaW5kZXhPZihcIi0tcnBjLXNzbFwiKTtcbiAgICAgICAgICAgIGxldCBzc2xFbmFibGVkID0gc3NsSWR4ID49IDAgPyBcImVuYWJsZWRcIiA9PSBjb25maWcuY21kW3NzbElkeCArIDFdLnRvTG93ZXJDYXNlKCkgOiBmYWxzZTtcbiAgICAgICAgICAgIHVyaSA9IChzc2xFbmFibGVkID8gXCJodHRwc1wiIDogXCJodHRwXCIpICsgXCI6Ly9cIiArIGhvc3QgKyBcIjpcIiArIHBvcnQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIC8vIHJlYWQgc3VjY2VzcyBtZXNzYWdlXG4gICAgICAgICAgaWYgKGxpbmUuaW5kZXhPZihcImNvcmUgUlBDIHNlcnZlciBzdGFydGVkIG9rXCIpID49IDApIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gZ2V0IHVzZXJuYW1lIGFuZCBwYXNzd29yZCBmcm9tIHBhcmFtc1xuICAgICAgICAgICAgbGV0IHVzZXJQYXNzSWR4ID0gY29uZmlnLmNtZC5pbmRleE9mKFwiLS1ycGMtbG9naW5cIik7XG4gICAgICAgICAgICBsZXQgdXNlclBhc3MgPSB1c2VyUGFzc0lkeCA+PSAwID8gY29uZmlnLmNtZFt1c2VyUGFzc0lkeCArIDFdIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgbGV0IHVzZXJuYW1lID0gdXNlclBhc3MgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHVzZXJQYXNzLnN1YnN0cmluZygwLCB1c2VyUGFzcy5pbmRleE9mKCc6JykpO1xuICAgICAgICAgICAgbGV0IHBhc3N3b3JkID0gdXNlclBhc3MgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHVzZXJQYXNzLnN1YnN0cmluZyh1c2VyUGFzcy5pbmRleE9mKCc6JykgKyAxKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gY3JlYXRlIGNsaWVudCBjb25uZWN0ZWQgdG8gaW50ZXJuYWwgcHJvY2Vzc1xuICAgICAgICAgICAgY29uZmlnID0gY29uZmlnLmNvcHkoKS5zZXRTZXJ2ZXIoe3VyaTogdXJpLCB1c2VybmFtZTogdXNlcm5hbWUsIHBhc3N3b3JkOiBwYXNzd29yZCwgcmVqZWN0VW5hdXRob3JpemVkOiBjb25maWcuZ2V0U2VydmVyKCkgPyBjb25maWcuZ2V0U2VydmVyKCkuZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkgOiB1bmRlZmluZWR9KTtcbiAgICAgICAgICAgIGNvbmZpZy5zZXRQcm94eVRvV29ya2VyKGNvbmZpZy5wcm94eVRvV29ya2VyKTtcbiAgICAgICAgICAgIGNvbmZpZy5jbWQgPSB1bmRlZmluZWRcbiAgICAgICAgICAgIGxldCBkYWVtb24gPSBhd2FpdCBNb25lcm9EYWVtb25ScGMuY29ubmVjdFRvRGFlbW9uUnBjKGNvbmZpZyk7XG4gICAgICAgICAgICBkYWVtb24ucHJvY2VzcyA9IGNoaWxkUHJvY2VzcztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gcmVzb2x2ZSBwcm9taXNlIHdpdGggY2xpZW50IGNvbm5lY3RlZCB0byBpbnRlcm5hbCBwcm9jZXNzIFxuICAgICAgICAgICAgdGhpcy5pc1Jlc29sdmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHJlc29sdmUoZGFlbW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gaGFuZGxlIHN0ZGVyclxuICAgICAgICBjaGlsZFByb2Nlc3Muc3RkZXJyLm9uKCdkYXRhJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0TG9nTGV2ZWwoKSA+PSAyKSBjb25zb2xlLmVycm9yKGRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBleGl0XG4gICAgICAgIGNoaWxkUHJvY2Vzcy5vbihcImV4aXRcIiwgZnVuY3Rpb24oY29kZSkge1xuICAgICAgICAgIGlmICghdGhpcy5pc1Jlc29sdmVkKSByZWplY3QobmV3IEVycm9yKFwibW9uZXJvZCBwcm9jZXNzIHRlcm1pbmF0ZWQgd2l0aCBleGl0IGNvZGUgXCIgKyBjb2RlICsgKG91dHB1dCA/IFwiOlxcblxcblwiICsgb3V0cHV0IDogXCJcIikpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgZXJyb3JcbiAgICAgICAgY2hpbGRQcm9jZXNzLm9uKFwiZXJyb3JcIiwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgaWYgKGVyci5tZXNzYWdlLmluZGV4T2YoXCJFTk9FTlRcIikgPj0gMCkgcmVqZWN0KG5ldyBFcnJvcihcIm1vbmVyb2QgZG9lcyBub3QgZXhpc3QgYXQgcGF0aCAnXCIgKyBjb25maWcuY21kWzBdICsgXCInXCIpKTtcbiAgICAgICAgICBpZiAoIXRoaXMuaXNSZXNvbHZlZCkgcmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gaGFuZGxlIHVuY2F1Z2h0IGV4Y2VwdGlvblxuICAgICAgICBjaGlsZFByb2Nlc3Mub24oXCJ1bmNhdWdodEV4Y2VwdGlvblwiLCBmdW5jdGlvbihlcnIsIG9yaWdpbikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJVbmNhdWdodCBleGNlcHRpb24gaW4gbW9uZXJvZCBwcm9jZXNzOiBcIiArIGVyci5tZXNzYWdlKTtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKG9yaWdpbik7XG4gICAgICAgICAgaWYgKCF0aGlzLmlzUmVzb2x2ZWQpIHJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZXJyLm1lc3NhZ2UpO1xuICAgIH1cbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBub3JtYWxpemVDb25maWcodXJpT3JDb25maWc6IHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4gfCBQYXJ0aWFsPE1vbmVyb0RhZW1vbkNvbmZpZz4gfCBzdHJpbmdbXSwgdXNlcm5hbWU/OiBzdHJpbmcsIHBhc3N3b3JkPzogc3RyaW5nKTogTW9uZXJvRGFlbW9uQ29uZmlnIHtcbiAgICBsZXQgY29uZmlnOiB1bmRlZmluZWQgfCBQYXJ0aWFsPE1vbmVyb0RhZW1vbkNvbmZpZz4gPSB1bmRlZmluZWQ7XG4gICAgaWYgKHR5cGVvZiB1cmlPckNvbmZpZyA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgY29uZmlnID0gbmV3IE1vbmVyb0RhZW1vbkNvbmZpZyh7c2VydmVyOiBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih1cmlPckNvbmZpZyBhcyBzdHJpbmcsIHVzZXJuYW1lLCBwYXNzd29yZCl9KTtcbiAgICB9IGVsc2UgaWYgKCh1cmlPckNvbmZpZyBhcyBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+KS51cmkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uZmlnID0gbmV3IE1vbmVyb0RhZW1vbkNvbmZpZyh7c2VydmVyOiBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih1cmlPckNvbmZpZyBhcyBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+KX0pO1xuXG4gICAgICAvLyB0cmFuc2ZlciB3b3JrZXIgcHJveHkgc2V0dGluZyBmcm9tIHJwYyBjb25uZWN0aW9uIHRvIGRhZW1vbiBjb25maWdcbiAgICAgIGNvbmZpZy5zZXRQcm94eVRvV29ya2VyKCh1cmlPckNvbmZpZyBhcyBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+KS5wcm94eVRvV29ya2VyKTtcbiAgICAgIGNvbmZpZy5nZXRTZXJ2ZXIoKS5zZXRQcm94eVRvV29ya2VyKE1vbmVyb1JwY0Nvbm5lY3Rpb24uREVGQVVMVF9DT05GSUcucHJveHlUb1dvcmtlcik7XG4gICAgfSBlbHNlIGlmIChHZW5VdGlscy5pc0FycmF5KHVyaU9yQ29uZmlnKSkge1xuICAgICAgY29uZmlnID0gbmV3IE1vbmVyb0RhZW1vbkNvbmZpZyh7Y21kOiB1cmlPckNvbmZpZyBhcyBzdHJpbmdbXX0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25maWcgPSBuZXcgTW9uZXJvRGFlbW9uQ29uZmlnKHVyaU9yQ29uZmlnIGFzIFBhcnRpYWw8TW9uZXJvRGFlbW9uQ29uZmlnPik7XG4gICAgfVxuICAgIGlmIChjb25maWcucHJveHlUb1dvcmtlciA9PT0gdW5kZWZpbmVkKSBjb25maWcucHJveHlUb1dvcmtlciA9IHRydWU7XG4gICAgaWYgKGNvbmZpZy5wb2xsSW50ZXJ2YWwgPT09IHVuZGVmaW5lZCkgY29uZmlnLnBvbGxJbnRlcnZhbCA9IE1vbmVyb0RhZW1vblJwYy5ERUZBVUxUX1BPTExfUEVSSU9EO1xuICAgIHJldHVybiBjb25maWcgYXMgTW9uZXJvRGFlbW9uQ29uZmlnO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCkge1xuICAgIGlmIChyZXNwLnN0YXR1cyAhPT0gXCJPS1wiKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IocmVzcC5zdGF0dXMpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNCbG9ja0hlYWRlcihycGNIZWFkZXIpIHtcbiAgICBpZiAoIXJwY0hlYWRlcikgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICBsZXQgaGVhZGVyID0gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY0hlYWRlcikpIHtcbiAgICAgIGxldCB2YWwgPSBycGNIZWFkZXJba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYmxvY2tfc2l6ZVwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldFNpemUsIGhlYWRlci5zZXRTaXplLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRlcHRoXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0RGVwdGgsIGhlYWRlci5zZXREZXB0aCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5XCIpIHsgfSAgLy8gaGFuZGxlZCBieSB3aWRlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjdW11bGF0aXZlX2RpZmZpY3VsdHlcIikgeyB9IC8vIGhhbmRsZWQgYnkgd2lkZV9jdW11bGF0aXZlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5X3RvcDY0XCIpIHsgfSAgLy8gaGFuZGxlZCBieSB3aWRlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjdW11bGF0aXZlX2RpZmZpY3VsdHlfdG9wNjRcIikgeyB9IC8vIGhhbmRsZWQgYnkgd2lkZV9jdW11bGF0aXZlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3aWRlX2RpZmZpY3VsdHlcIikgaGVhZGVyLnNldERpZmZpY3VsdHkoR2VuVXRpbHMucmVjb25jaWxlKGhlYWRlci5nZXREaWZmaWN1bHR5KCksIE1vbmVyb0RhZW1vblJwYy5wcmVmaXhlZEhleFRvQkkodmFsKSkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndpZGVfY3VtdWxhdGl2ZV9kaWZmaWN1bHR5XCIpIGhlYWRlci5zZXRDdW11bGF0aXZlRGlmZmljdWx0eShHZW5VdGlscy5yZWNvbmNpbGUoaGVhZGVyLmdldEN1bXVsYXRpdmVEaWZmaWN1bHR5KCksIE1vbmVyb0RhZW1vblJwYy5wcmVmaXhlZEhleFRvQkkodmFsKSkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhhc2hcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRIYXNoLCBoZWFkZXIuc2V0SGFzaCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJoZWlnaHRcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRIZWlnaHQsIGhlYWRlci5zZXRIZWlnaHQsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibWFqb3JfdmVyc2lvblwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldE1ham9yVmVyc2lvbiwgaGVhZGVyLnNldE1ham9yVmVyc2lvbiwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtaW5vcl92ZXJzaW9uXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0TWlub3JWZXJzaW9uLCBoZWFkZXIuc2V0TWlub3JWZXJzaW9uLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm5vbmNlXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0Tm9uY2UsIGhlYWRlci5zZXROb25jZSwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJudW1fdHhlc1wiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldE51bVR4cywgaGVhZGVyLnNldE51bVR4cywgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJvcnBoYW5fc3RhdHVzXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0T3JwaGFuU3RhdHVzLCBoZWFkZXIuc2V0T3JwaGFuU3RhdHVzLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInByZXZfaGFzaFwiIHx8IGtleSA9PT0gXCJwcmV2X2lkXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0UHJldkhhc2gsIGhlYWRlci5zZXRQcmV2SGFzaCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyZXdhcmRcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRSZXdhcmQsIGhlYWRlci5zZXRSZXdhcmQsIEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0aW1lc3RhbXBcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRUaW1lc3RhbXAsIGhlYWRlci5zZXRUaW1lc3RhbXAsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfd2VpZ2h0XCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0V2VpZ2h0LCBoZWFkZXIuc2V0V2VpZ2h0LCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxvbmdfdGVybV93ZWlnaHRcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRMb25nVGVybVdlaWdodCwgaGVhZGVyLnNldExvbmdUZXJtV2VpZ2h0LCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBvd19oYXNoXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0UG93SGFzaCwgaGVhZGVyLnNldFBvd0hhc2gsIHZhbCA9PT0gXCJcIiA/IHVuZGVmaW5lZCA6IHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfaGFzaGVzXCIpIHt9ICAvLyB1c2VkIGluIGJsb2NrIG1vZGVsLCBub3QgaGVhZGVyIG1vZGVsXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibWluZXJfdHhcIikge30gICAvLyB1c2VkIGluIGJsb2NrIG1vZGVsLCBub3QgaGVhZGVyIG1vZGVsXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibWluZXJfdHhfaGFzaFwiKSBoZWFkZXIuc2V0TWluZXJUeEhhc2godmFsKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGJsb2NrIGhlYWRlciBmaWVsZDogJ1wiICsga2V5ICsgXCInOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBoZWFkZXI7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY0Jsb2NrKHJwY0Jsb2NrKSB7XG4gICAgXG4gICAgLy8gYnVpbGQgYmxvY2tcbiAgICBsZXQgYmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNCbG9ja0hlYWRlcihycGNCbG9jay5ibG9ja19oZWFkZXIgPyBycGNCbG9jay5ibG9ja19oZWFkZXIgOiBycGNCbG9jaykgYXMgTW9uZXJvQmxvY2spO1xuICAgIGJsb2NrLnNldEhleChycGNCbG9jay5ibG9iKTtcbiAgICBibG9jay5zZXRUeEhhc2hlcyhycGNCbG9jay50eF9oYXNoZXMgPT09IHVuZGVmaW5lZCA/IFtdIDogcnBjQmxvY2sudHhfaGFzaGVzKTtcbiAgICBcbiAgICAvLyBidWlsZCBtaW5lciB0eFxuICAgIGxldCBycGNNaW5lclR4ID0gcnBjQmxvY2suanNvbiA/IEpTT04ucGFyc2UocnBjQmxvY2suanNvbikubWluZXJfdHggOiBycGNCbG9jay5taW5lcl90eDsgIC8vIG1heSBuZWVkIHRvIGJlIHBhcnNlZCBmcm9tIGpzb25cbiAgICBsZXQgbWluZXJUeCA9IG5ldyBNb25lcm9UeCgpO1xuICAgIGJsb2NrLnNldE1pbmVyVHgobWluZXJUeCk7XG4gICAgbWluZXJUeC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICBtaW5lclR4LnNldEluVHhQb29sKGZhbHNlKVxuICAgIG1pbmVyVHguc2V0SXNNaW5lclR4KHRydWUpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVHgocnBjTWluZXJUeCwgbWluZXJUeCk7XG4gICAgXG4gICAgcmV0dXJuIGJsb2NrO1xuICB9XG4gIFxuICAvKipcbiAgICogVHJhbnNmZXJzIFJQQyB0eCBmaWVsZHMgdG8gYSBnaXZlbiBNb25lcm9UeCB3aXRob3V0IG92ZXJ3cml0aW5nIHByZXZpb3VzIHZhbHVlcy5cbiAgICogXG4gICAqIFRPRE86IHN3aXRjaCBmcm9tIHNhZmUgc2V0XG4gICAqIFxuICAgKiBAcGFyYW0gcnBjVHggLSBSUEMgbWFwIGNvbnRhaW5pbmcgdHJhbnNhY3Rpb24gZmllbGRzXG4gICAqIEBwYXJhbSB0eCAgLSBNb25lcm9UeCB0byBwb3B1bGF0ZSB3aXRoIHZhbHVlcyAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4gdHggLSBzYW1lIHR4IHRoYXQgd2FzIHBhc3NlZCBpbiBvciBhIG5ldyBvbmUgaWYgbm9uZSBnaXZlblxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVHgocnBjVHgsIHR4KSB7XG4gICAgaWYgKHJwY1R4ID09PSB1bmRlZmluZWQpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgaWYgKHR4ID09PSB1bmRlZmluZWQpIHR4ID0gbmV3IE1vbmVyb1R4KCk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSBmcm9tIHJwYyBtYXBcbiAgICBsZXQgaGVhZGVyO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNUeCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNUeFtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJ0eF9oYXNoXCIgfHwga2V5ID09PSBcImlkX2hhc2hcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SGFzaCwgdHguc2V0SGFzaCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja190aW1lc3RhbXBcIikge1xuICAgICAgICBpZiAoIWhlYWRlcikgaGVhZGVyID0gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKCk7XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0VGltZXN0YW1wLCBoZWFkZXIuc2V0VGltZXN0YW1wLCB2YWwpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX2hlaWdodFwiKSB7XG4gICAgICAgIGlmICghaGVhZGVyKSBoZWFkZXIgPSBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoKTtcbiAgICAgICAgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRIZWlnaHQsIGhlYWRlci5zZXRIZWlnaHQsIHZhbCk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibGFzdF9yZWxheWVkX3RpbWVcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAsIHR4LnNldExhc3RSZWxheWVkVGltZXN0YW1wLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJlY2VpdmVfdGltZVwiIHx8IGtleSA9PT0gXCJyZWNlaXZlZF90aW1lc3RhbXBcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0UmVjZWl2ZWRUaW1lc3RhbXAsIHR4LnNldFJlY2VpdmVkVGltZXN0YW1wLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNvbmZpcm1hdGlvbnNcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0TnVtQ29uZmlybWF0aW9ucywgdHguc2V0TnVtQ29uZmlybWF0aW9ucywgdmFsKTsgXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaW5fcG9vbFwiKSB7XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzQ29uZmlybWVkLCB0eC5zZXRJc0NvbmZpcm1lZCwgIXZhbCk7XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldEluVHhQb29sLCB0eC5zZXRJblR4UG9vbCwgdmFsKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkb3VibGVfc3BlbmRfc2VlblwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc0RvdWJsZVNwZW5kU2VlbiwgdHguc2V0SXNEb3VibGVTcGVuZFNlZW4sIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidmVyc2lvblwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRWZXJzaW9uLCB0eC5zZXRWZXJzaW9uLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImV4dHJhXCIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWwgPT09IFwic3RyaW5nXCIpIGNvbnNvbGUubG9nKFwiV0FSTklORzogZXh0cmEgZmllbGQgYXMgc3RyaW5nIG5vdCBiZWluZyBhc2lnbmVkIHRvIGludFtdOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7IC8vIFRPRE86IGhvdyB0byBzZXQgc3RyaW5nIHRvIGludFtdPyAtIG9yLCBleHRyYSBpcyBzdHJpbmcgd2hpY2ggY2FuIGVuY29kZSBpbnRbXVxuICAgICAgICBlbHNlIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldEV4dHJhLCB0eC5zZXRFeHRyYSwgbmV3IFVpbnQ4QXJyYXkodmFsKSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidmluXCIpIHtcbiAgICAgICAgaWYgKHZhbC5sZW5ndGggIT09IDEgfHwgIXZhbFswXS5nZW4pIHsgIC8vIGlnbm9yZSBtaW5lciBpbnB1dCBUT0RPOiB3aHk/XG4gICAgICAgICAgdHguc2V0SW5wdXRzKHZhbC5tYXAocnBjVmluID0+IE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjT3V0cHV0KHJwY1ZpbiwgdHgpKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ2b3V0XCIpIHR4LnNldE91dHB1dHModmFsLm1hcChycGNPdXRwdXQgPT4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNPdXRwdXQocnBjT3V0cHV0LCB0eCkpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyY3Rfc2lnbmF0dXJlc1wiKSB7XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFJjdFNpZ25hdHVyZXMsIHR4LnNldFJjdFNpZ25hdHVyZXMsIHZhbCk7XG4gICAgICAgIGlmICh2YWwudHhuRmVlKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRGZWUsIHR4LnNldEZlZSwgQmlnSW50KHZhbC50eG5GZWUpKTtcbiAgICAgIH0gXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmN0c2lnX3BydW5hYmxlXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFJjdFNpZ1BydW5hYmxlLCB0eC5zZXRSY3RTaWdQcnVuYWJsZSwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bmxvY2tfdGltZVwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRVbmxvY2tUaW1lLCB0eC5zZXRVbmxvY2tUaW1lLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFzX2pzb25cIiB8fCBrZXkgPT09IFwidHhfanNvblwiKSB7IH0gIC8vIGhhbmRsZWQgbGFzdCBzbyB0eCBpcyBhcyBpbml0aWFsaXplZCBhcyBwb3NzaWJsZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFzX2hleFwiIHx8IGtleSA9PT0gXCJ0eF9ibG9iXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldEZ1bGxIZXgsIHR4LnNldEZ1bGxIZXgsIHZhbCA/IHZhbCA6IHVuZGVmaW5lZCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvYl9zaXplXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFNpemUsIHR4LnNldFNpemUsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2VpZ2h0XCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFdlaWdodCwgdHguc2V0V2VpZ2h0LCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImZlZVwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRGZWUsIHR4LnNldEZlZSwgQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJlbGF5ZWRcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SXNSZWxheWVkLCB0eC5zZXRJc1JlbGF5ZWQsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwib3V0cHV0X2luZGljZXNcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0T3V0cHV0SW5kaWNlcywgdHguc2V0T3V0cHV0SW5kaWNlcywgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkb19ub3RfcmVsYXlcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0UmVsYXksIHR4LnNldFJlbGF5LCAhdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJrZXB0X2J5X2Jsb2NrXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzS2VwdEJ5QmxvY2ssIHR4LnNldElzS2VwdEJ5QmxvY2ssIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic2lnbmF0dXJlc1wiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRTaWduYXR1cmVzLCB0eC5zZXRTaWduYXR1cmVzLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxhc3RfZmFpbGVkX2hlaWdodFwiKSB7XG4gICAgICAgIGlmICh2YWwgPT09IDApIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzRmFpbGVkLCB0eC5zZXRJc0ZhaWxlZCwgZmFsc2UpO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc0ZhaWxlZCwgdHguc2V0SXNGYWlsZWQsIHRydWUpO1xuICAgICAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldExhc3RGYWlsZWRIZWlnaHQsIHR4LnNldExhc3RGYWlsZWRIZWlnaHQsIHZhbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsYXN0X2ZhaWxlZF9pZF9oYXNoXCIpIHtcbiAgICAgICAgaWYgKHZhbCA9PT0gTW9uZXJvRGFlbW9uUnBjLkRFRkFVTFRfSUQpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzRmFpbGVkLCB0eC5zZXRJc0ZhaWxlZCwgZmFsc2UpO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc0ZhaWxlZCwgdHguc2V0SXNGYWlsZWQsIHRydWUpO1xuICAgICAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldExhc3RGYWlsZWRIYXNoLCB0eC5zZXRMYXN0RmFpbGVkSGFzaCwgdmFsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm1heF91c2VkX2Jsb2NrX2hlaWdodFwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRNYXhVc2VkQmxvY2tIZWlnaHQsIHR4LnNldE1heFVzZWRCbG9ja0hlaWdodCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtYXhfdXNlZF9ibG9ja19pZF9oYXNoXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldE1heFVzZWRCbG9ja0hhc2gsIHR4LnNldE1heFVzZWRCbG9ja0hhc2gsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHJ1bmFibGVfaGFzaFwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRQcnVuYWJsZUhhc2gsIHR4LnNldFBydW5hYmxlSGFzaCwgdmFsID8gdmFsIDogdW5kZWZpbmVkKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwcnVuYWJsZV9hc19oZXhcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0UHJ1bmFibGVIZXgsIHR4LnNldFBydW5hYmxlSGV4LCB2YWwgPyB2YWwgOiB1bmRlZmluZWQpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBydW5lZF9hc19oZXhcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0UHJ1bmVkSGV4LCB0eC5zZXRQcnVuZWRIZXgsIHZhbCA/IHZhbCA6IHVuZGVmaW5lZCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBycGMgdHg6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgXG4gICAgLy8gbGluayBibG9jayBhbmQgdHhcbiAgICBpZiAoaGVhZGVyKSB0eC5zZXRCbG9jayhuZXcgTW9uZXJvQmxvY2soaGVhZGVyKS5zZXRUeHMoW3R4XSkpO1xuICAgIFxuICAgIC8vIFRPRE8gbW9uZXJvZDogdW5jb25maXJtZWQgdHhzIG1pc3JlcG9ydCBibG9jayBoZWlnaHQgYW5kIHRpbWVzdGFtcD9cbiAgICBpZiAodHguZ2V0QmxvY2soKSAmJiB0eC5nZXRCbG9jaygpLmdldEhlaWdodCgpICE9PSB1bmRlZmluZWQgJiYgdHguZ2V0QmxvY2soKS5nZXRIZWlnaHQoKSA9PT0gdHguZ2V0QmxvY2soKS5nZXRUaW1lc3RhbXAoKSkge1xuICAgICAgdHguc2V0QmxvY2sodW5kZWZpbmVkKTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICB9XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSByZW1haW5pbmcga25vd24gZmllbGRzXG4gICAgaWYgKHR4LmdldElzQ29uZmlybWVkKCkpIHtcbiAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzUmVsYXllZCwgdHguc2V0SXNSZWxheWVkLCB0cnVlKTtcbiAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFJlbGF5LCB0eC5zZXRSZWxheSwgdHJ1ZSk7XG4gICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc0ZhaWxlZCwgdHguc2V0SXNGYWlsZWQsIGZhbHNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdHguc2V0TnVtQ29uZmlybWF0aW9ucygwKTtcbiAgICB9XG4gICAgaWYgKHR4LmdldElzRmFpbGVkKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgIGlmICh0eC5nZXRPdXRwdXRJbmRpY2VzKCkgJiYgdHguZ2V0T3V0cHV0cygpKSAge1xuICAgICAgYXNzZXJ0LmVxdWFsKHR4LmdldE91dHB1dHMoKS5sZW5ndGgsIHR4LmdldE91dHB1dEluZGljZXMoKS5sZW5ndGgpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0eC5nZXRPdXRwdXRzKCkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdHguZ2V0T3V0cHV0cygpW2ldLnNldEluZGV4KHR4LmdldE91dHB1dEluZGljZXMoKVtpXSk7ICAvLyB0cmFuc2ZlciBvdXRwdXQgaW5kaWNlcyB0byBvdXRwdXRzXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChycGNUeC5hc19qc29uKSBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1R4KEpTT04ucGFyc2UocnBjVHguYXNfanNvbiksIHR4KTtcbiAgICBpZiAocnBjVHgudHhfanNvbikgTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNUeChKU09OLnBhcnNlKHJwY1R4LnR4X2pzb24pLCB0eCk7XG4gICAgaWYgKCF0eC5nZXRJc1JlbGF5ZWQoKSkgdHguc2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAodW5kZWZpbmVkKTsgIC8vIFRPRE8gbW9uZXJvZDogcmV0dXJucyBsYXN0X3JlbGF5ZWRfdGltZXN0YW1wIGRlc3BpdGUgcmVsYXllZDogZmFsc2UsIHNlbGYgaW5jb25zaXN0ZW50XG4gICAgXG4gICAgLy8gcmV0dXJuIGJ1aWx0IHRyYW5zYWN0aW9uXG4gICAgcmV0dXJuIHR4O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNPdXRwdXQocnBjT3V0cHV0LCB0eCkge1xuICAgIGxldCBvdXRwdXQgPSBuZXcgTW9uZXJvT3V0cHV0KCk7XG4gICAgb3V0cHV0LnNldFR4KHR4KTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjT3V0cHV0KSkge1xuICAgICAgbGV0IHZhbCA9IHJwY091dHB1dFtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJnZW5cIikgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiT3V0cHV0IHdpdGggJ2dlbicgZnJvbSBkYWVtb24gcnBjIGlzIG1pbmVyIHR4IHdoaWNoIHdlIGlnbm9yZSAoaS5lLiBlYWNoIG1pbmVyIGlucHV0IGlzIHVuZGVmaW5lZClcIik7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwia2V5XCIpIHtcbiAgICAgICAgR2VuVXRpbHMuc2FmZVNldChvdXRwdXQsIG91dHB1dC5nZXRBbW91bnQsIG91dHB1dC5zZXRBbW91bnQsIEJpZ0ludCh2YWwuYW1vdW50KSk7XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQob3V0cHV0LCBvdXRwdXQuZ2V0S2V5SW1hZ2UsIG91dHB1dC5zZXRLZXlJbWFnZSwgbmV3IE1vbmVyb0tleUltYWdlKHZhbC5rX2ltYWdlKSk7XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQob3V0cHV0LCBvdXRwdXQuZ2V0UmluZ091dHB1dEluZGljZXMsIG91dHB1dC5zZXRSaW5nT3V0cHV0SW5kaWNlcywgdmFsLmtleV9vZmZzZXRzKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRcIikgR2VuVXRpbHMuc2FmZVNldChvdXRwdXQsIG91dHB1dC5nZXRBbW91bnQsIG91dHB1dC5zZXRBbW91bnQsIEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0YXJnZXRcIikge1xuICAgICAgICBsZXQgcHViS2V5ID0gdmFsLmtleSA9PT0gdW5kZWZpbmVkID8gdmFsLnRhZ2dlZF9rZXkua2V5IDogdmFsLmtleTsgLy8gVE9ETyAobW9uZXJvZCk6IHJwYyBqc29uIHVzZXMge3RhZ2dlZF9rZXk9e2tleT0uLi59fSwgYmluYXJ5IGJsb2NrcyB1c2Uge2tleT0uLi59XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQob3V0cHV0LCBvdXRwdXQuZ2V0U3RlYWx0aFB1YmxpY0tleSwgb3V0cHV0LnNldFN0ZWFsdGhQdWJsaWNLZXksIHB1YktleSk7XG4gICAgICB9XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBvdXRwdXQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjQmxvY2tUZW1wbGF0ZShycGNUZW1wbGF0ZSkge1xuICAgIGxldCB0ZW1wbGF0ZSA9IG5ldyBNb25lcm9CbG9ja1RlbXBsYXRlKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1RlbXBsYXRlKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1RlbXBsYXRlW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImJsb2NraGFzaGluZ19ibG9iXCIpIHRlbXBsYXRlLnNldEJsb2NrVGVtcGxhdGVCbG9iKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2t0ZW1wbGF0ZV9ibG9iXCIpIHRlbXBsYXRlLnNldEJsb2NrSGFzaGluZ0Jsb2IodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5XCIpIHRlbXBsYXRlLnNldERpZmZpY3VsdHkoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImV4cGVjdGVkX3Jld2FyZFwiKSB0ZW1wbGF0ZS5zZXRFeHBlY3RlZFJld2FyZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRpZmZpY3VsdHlcIikgeyB9ICAvLyBoYW5kbGVkIGJ5IHdpZGVfZGlmZmljdWx0eVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRpZmZpY3VsdHlfdG9wNjRcIikgeyB9ICAvLyBoYW5kbGVkIGJ5IHdpZGVfZGlmZmljdWx0eVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndpZGVfZGlmZmljdWx0eVwiKSB0ZW1wbGF0ZS5zZXREaWZmaWN1bHR5KEdlblV0aWxzLnJlY29uY2lsZSh0ZW1wbGF0ZS5nZXREaWZmaWN1bHR5KCksIE1vbmVyb0RhZW1vblJwYy5wcmVmaXhlZEhleFRvQkkodmFsKSkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhlaWdodFwiKSB0ZW1wbGF0ZS5zZXRIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwcmV2X2hhc2hcIikgdGVtcGxhdGUuc2V0UHJldkhhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyZXNlcnZlZF9vZmZzZXRcIikgdGVtcGxhdGUuc2V0UmVzZXJ2ZWRPZmZzZXQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGF0dXNcIikge30gIC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW50cnVzdGVkXCIpIHt9ICAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNlZWRfaGVpZ2h0XCIpIHRlbXBsYXRlLnNldFNlZWRIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzZWVkX2hhc2hcIikgdGVtcGxhdGUuc2V0U2VlZEhhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJuZXh0X3NlZWRfaGFzaFwiKSB0ZW1wbGF0ZS5zZXROZXh0U2VlZEhhc2godmFsKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIGJsb2NrIHRlbXBsYXRlOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIGlmIChcIlwiID09PSB0ZW1wbGF0ZS5nZXROZXh0U2VlZEhhc2goKSkgdGVtcGxhdGUuc2V0TmV4dFNlZWRIYXNoKHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIHRlbXBsYXRlO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNJbmZvKHJwY0luZm8pIHtcbiAgICBpZiAoIXJwY0luZm8pIHJldHVybiB1bmRlZmluZWQ7XG4gICAgbGV0IGluZm8gPSBuZXcgTW9uZXJvRGFlbW9uSW5mbygpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNJbmZvKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY0luZm9ba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwidmVyc2lvblwiKSBpbmZvLnNldFZlcnNpb24odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbHRfYmxvY2tzX2NvdW50XCIpIGluZm8uc2V0TnVtQWx0QmxvY2tzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfc2l6ZV9saW1pdFwiKSBpbmZvLnNldEJsb2NrU2l6ZUxpbWl0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfc2l6ZV9tZWRpYW5cIikgaW5mby5zZXRCbG9ja1NpemVNZWRpYW4odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja193ZWlnaHRfbGltaXRcIikgaW5mby5zZXRCbG9ja1dlaWdodExpbWl0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfd2VpZ2h0X21lZGlhblwiKSBpbmZvLnNldEJsb2NrV2VpZ2h0TWVkaWFuKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYm9vdHN0cmFwX2RhZW1vbl9hZGRyZXNzXCIpIHsgaWYgKHZhbCkgaW5mby5zZXRCb290c3RyYXBEYWVtb25BZGRyZXNzKHZhbCk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5XCIpIHsgfSAgLy8gaGFuZGxlZCBieSB3aWRlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjdW11bGF0aXZlX2RpZmZpY3VsdHlcIikgeyB9IC8vIGhhbmRsZWQgYnkgd2lkZV9jdW11bGF0aXZlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5X3RvcDY0XCIpIHsgfSAgLy8gaGFuZGxlZCBieSB3aWRlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjdW11bGF0aXZlX2RpZmZpY3VsdHlfdG9wNjRcIikgeyB9IC8vIGhhbmRsZWQgYnkgd2lkZV9jdW11bGF0aXZlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3aWRlX2RpZmZpY3VsdHlcIikgaW5mby5zZXREaWZmaWN1bHR5KEdlblV0aWxzLnJlY29uY2lsZShpbmZvLmdldERpZmZpY3VsdHkoKSwgTW9uZXJvRGFlbW9uUnBjLnByZWZpeGVkSGV4VG9CSSh2YWwpKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2lkZV9jdW11bGF0aXZlX2RpZmZpY3VsdHlcIikgaW5mby5zZXRDdW11bGF0aXZlRGlmZmljdWx0eShHZW5VdGlscy5yZWNvbmNpbGUoaW5mby5nZXRDdW11bGF0aXZlRGlmZmljdWx0eSgpLCBNb25lcm9EYWVtb25ScGMucHJlZml4ZWRIZXhUb0JJKHZhbCkpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmcmVlX3NwYWNlXCIpIGluZm8uc2V0RnJlZVNwYWNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkYXRhYmFzZV9zaXplXCIpIGluZm8uc2V0RGF0YWJhc2VTaXplKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZ3JleV9wZWVybGlzdF9zaXplXCIpIGluZm8uc2V0TnVtT2ZmbGluZVBlZXJzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGVpZ2h0XCIpIGluZm8uc2V0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGVpZ2h0X3dpdGhvdXRfYm9vdHN0cmFwXCIpIGluZm8uc2V0SGVpZ2h0V2l0aG91dEJvb3RzdHJhcCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImluY29taW5nX2Nvbm5lY3Rpb25zX2NvdW50XCIpIGluZm8uc2V0TnVtSW5jb21pbmdDb25uZWN0aW9ucyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm9mZmxpbmVcIikgaW5mby5zZXRJc09mZmxpbmUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJvdXRnb2luZ19jb25uZWN0aW9uc19jb3VudFwiKSBpbmZvLnNldE51bU91dGdvaW5nQ29ubmVjdGlvbnModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJycGNfY29ubmVjdGlvbnNfY291bnRcIikgaW5mby5zZXROdW1ScGNDb25uZWN0aW9ucyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXJ0X3RpbWVcIikgaW5mby5zZXRTdGFydFRpbWVzdGFtcCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFkanVzdGVkX3RpbWVcIikgaW5mby5zZXRBZGp1c3RlZFRpbWVzdGFtcCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXR1c1wiKSB7fSAgLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0YXJnZXRcIikgaW5mby5zZXRUYXJnZXQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0YXJnZXRfaGVpZ2h0XCIpIGluZm8uc2V0VGFyZ2V0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidG9wX2Jsb2NrX2hhc2hcIikgaW5mby5zZXRUb3BCbG9ja0hhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9jb3VudFwiKSBpbmZvLnNldE51bVR4cyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X3Bvb2xfc2l6ZVwiKSBpbmZvLnNldE51bVR4c1Bvb2wodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bnRydXN0ZWRcIikge30gLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3YXNfYm9vdHN0cmFwX2V2ZXJfdXNlZFwiKSBpbmZvLnNldFdhc0Jvb3RzdHJhcEV2ZXJVc2VkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2hpdGVfcGVlcmxpc3Rfc2l6ZVwiKSBpbmZvLnNldE51bU9ubGluZVBlZXJzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidXBkYXRlX2F2YWlsYWJsZVwiKSBpbmZvLnNldFVwZGF0ZUF2YWlsYWJsZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm5ldHR5cGVcIikgR2VuVXRpbHMuc2FmZVNldChpbmZvLCBpbmZvLmdldE5ldHdvcmtUeXBlLCBpbmZvLnNldE5ldHdvcmtUeXBlLCBNb25lcm9OZXR3b3JrVHlwZS5wYXJzZSh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtYWlubmV0XCIpIHsgaWYgKHZhbCkgR2VuVXRpbHMuc2FmZVNldChpbmZvLCBpbmZvLmdldE5ldHdvcmtUeXBlLCBpbmZvLnNldE5ldHdvcmtUeXBlLCBNb25lcm9OZXR3b3JrVHlwZS5NQUlOTkVUKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRlc3RuZXRcIikgeyBpZiAodmFsKSBHZW5VdGlscy5zYWZlU2V0KGluZm8sIGluZm8uZ2V0TmV0d29ya1R5cGUsIGluZm8uc2V0TmV0d29ya1R5cGUsIE1vbmVyb05ldHdvcmtUeXBlLlRFU1RORVQpOyB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3RhZ2VuZXRcIikgeyBpZiAodmFsKSBHZW5VdGlscy5zYWZlU2V0KGluZm8sIGluZm8uZ2V0TmV0d29ya1R5cGUsIGluZm8uc2V0TmV0d29ya1R5cGUsIE1vbmVyb05ldHdvcmtUeXBlLlNUQUdFTkVUKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNyZWRpdHNcIikgaW5mby5zZXRDcmVkaXRzKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0b3BfYmxvY2tfaGFzaFwiIHx8IGtleSA9PT0gXCJ0b3BfaGFzaFwiKSBpbmZvLnNldFRvcEJsb2NrSGFzaChHZW5VdGlscy5yZWNvbmNpbGUoaW5mby5nZXRUb3BCbG9ja0hhc2goKSwgXCJcIiA9PT0gdmFsID8gdW5kZWZpbmVkIDogdmFsKSlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJidXN5X3N5bmNpbmdcIikgaW5mby5zZXRJc0J1c3lTeW5jaW5nKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3luY2hyb25pemVkXCIpIGluZm8uc2V0SXNTeW5jaHJvbml6ZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyZXN0cmljdGVkXCIpIGluZm8uc2V0SXNSZXN0cmljdGVkKHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogSWdub3JpbmcgdW5leHBlY3RlZCBpbmZvIGZpZWxkOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBpbmZvO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgc3luYyBpbmZvIGZyb20gUlBDIHN5bmMgaW5mby5cbiAgICogXG4gICAqIEBwYXJhbSBycGNTeW5jSW5mbyAtIHJwYyBtYXAgdG8gaW5pdGlhbGl6ZSB0aGUgc3luYyBpbmZvIGZyb21cbiAgICogQHJldHVybiB7TW9uZXJvRGFlbW9uU3luY0luZm99IGlzIHN5bmMgaW5mbyBpbml0aWFsaXplZCBmcm9tIHRoZSBtYXBcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1N5bmNJbmZvKHJwY1N5bmNJbmZvKSB7XG4gICAgbGV0IHN5bmNJbmZvID0gbmV3IE1vbmVyb0RhZW1vblN5bmNJbmZvKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1N5bmNJbmZvKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1N5bmNJbmZvW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImhlaWdodFwiKSBzeW5jSW5mby5zZXRIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwZWVyc1wiKSB7XG4gICAgICAgIHN5bmNJbmZvLnNldFBlZXJzKFtdKTtcbiAgICAgICAgbGV0IHJwY0Nvbm5lY3Rpb25zID0gdmFsO1xuICAgICAgICBmb3IgKGxldCBycGNDb25uZWN0aW9uIG9mIHJwY0Nvbm5lY3Rpb25zKSB7XG4gICAgICAgICAgc3luY0luZm8uZ2V0UGVlcnMoKS5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQ29ubmVjdGlvbihycGNDb25uZWN0aW9uLmluZm8pKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNwYW5zXCIpIHtcbiAgICAgICAgc3luY0luZm8uc2V0U3BhbnMoW10pO1xuICAgICAgICBsZXQgcnBjU3BhbnMgPSB2YWw7XG4gICAgICAgIGZvciAobGV0IHJwY1NwYW4gb2YgcnBjU3BhbnMpIHtcbiAgICAgICAgICBzeW5jSW5mby5nZXRTcGFucygpLnB1c2goTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNDb25uZWN0aW9uU3BhbihycGNTcGFuKSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoa2V5ID09PSBcInN0YXR1c1wiKSB7fSAgIC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidGFyZ2V0X2hlaWdodFwiKSBzeW5jSW5mby5zZXRUYXJnZXRIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJuZXh0X25lZWRlZF9wcnVuaW5nX3NlZWRcIikgc3luY0luZm8uc2V0TmV4dE5lZWRlZFBydW5pbmdTZWVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwib3ZlcnZpZXdcIikgeyAgLy8gdGhpcyByZXR1cm5zIFtdIHdpdGhvdXQgcHJ1bmluZ1xuICAgICAgICBsZXQgb3ZlcnZpZXc7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgb3ZlcnZpZXcgPSBKU09OLnBhcnNlKHZhbCk7XG4gICAgICAgICAgaWYgKG92ZXJ2aWV3ICE9PSB1bmRlZmluZWQgJiYgb3ZlcnZpZXcubGVuZ3RoID4gMCkgY29uc29sZS5lcnJvcihcIklnbm9yaW5nIG5vbi1lbXB0eSAnb3ZlcnZpZXcnIGZpZWxkIChub3QgaW1wbGVtZW50ZWQpOiBcIiArIG92ZXJ2aWV3KTsgLy8gVE9ET1xuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIHBhcnNlICdvdmVydmlldycgZmllbGQ6IFwiICsgb3ZlcnZpZXcgKyBcIjogXCIgKyBlLm1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3JlZGl0c1wiKSBzeW5jSW5mby5zZXRDcmVkaXRzKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0b3BfaGFzaFwiKSBzeW5jSW5mby5zZXRUb3BCbG9ja0hhc2goXCJcIiA9PT0gdmFsID8gdW5kZWZpbmVkIDogdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bnRydXN0ZWRcIikge30gIC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBzeW5jIGluZm86IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIHN5bmNJbmZvO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNIYXJkRm9ya0luZm8ocnBjSGFyZEZvcmtJbmZvKSB7XG4gICAgbGV0IGluZm8gPSBuZXcgTW9uZXJvSGFyZEZvcmtJbmZvKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY0hhcmRGb3JrSW5mbykpIHtcbiAgICAgIGxldCB2YWwgPSBycGNIYXJkRm9ya0luZm9ba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiZWFybGllc3RfaGVpZ2h0XCIpIGluZm8uc2V0RWFybGllc3RIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJlbmFibGVkXCIpIGluZm8uc2V0SXNFbmFibGVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3RhdGVcIikgaW5mby5zZXRTdGF0ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXR1c1wiKSB7fSAgICAgLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bnRydXN0ZWRcIikge30gIC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidGhyZXNob2xkXCIpIGluZm8uc2V0VGhyZXNob2xkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidmVyc2lvblwiKSBpbmZvLnNldFZlcnNpb24odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ2b3Rlc1wiKSBpbmZvLnNldE51bVZvdGVzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidm90aW5nXCIpIGluZm8uc2V0Vm90aW5nKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2luZG93XCIpIGluZm8uc2V0V2luZG93KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3JlZGl0c1wiKSBpbmZvLnNldENyZWRpdHMoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRvcF9oYXNoXCIpIGluZm8uc2V0VG9wQmxvY2tIYXNoKFwiXCIgPT09IHZhbCA/IHVuZGVmaW5lZCA6IHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBoYXJkIGZvcmsgaW5mbzogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gaW5mbztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjQ29ubmVjdGlvblNwYW4ocnBjQ29ubmVjdGlvblNwYW4pIHtcbiAgICBsZXQgc3BhbiA9IG5ldyBNb25lcm9Db25uZWN0aW9uU3BhbigpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNDb25uZWN0aW9uU3BhbikpIHtcbiAgICAgIGxldCB2YWwgPSBycGNDb25uZWN0aW9uU3BhbltrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJjb25uZWN0aW9uX2lkXCIpIHNwYW4uc2V0Q29ubmVjdGlvbklkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibmJsb2Nrc1wiKSBzcGFuLnNldE51bUJsb2Nrcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJhdGVcIikgc3Bhbi5zZXRSYXRlKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVtb3RlX2FkZHJlc3NcIikgeyBpZiAodmFsICE9PSBcIlwiKSBzcGFuLnNldFJlbW90ZUFkZHJlc3ModmFsKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNpemVcIikgc3Bhbi5zZXRTaXplKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3BlZWRcIikgc3Bhbi5zZXRTcGVlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXJ0X2Jsb2NrX2hlaWdodFwiKSBzcGFuLnNldFN0YXJ0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBkYWVtb24gY29ubmVjdGlvbiBzcGFuOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBzcGFuO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNPdXRwdXRIaXN0b2dyYW1FbnRyeShycGNFbnRyeSkge1xuICAgIGxldCBlbnRyeSA9IG5ldyBNb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeSgpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNFbnRyeSkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNFbnRyeVtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJhbW91bnRcIikgZW50cnkuc2V0QW1vdW50KEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0b3RhbF9pbnN0YW5jZXNcIikgZW50cnkuc2V0TnVtSW5zdGFuY2VzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5sb2NrZWRfaW5zdGFuY2VzXCIpIGVudHJ5LnNldE51bVVubG9ja2VkSW5zdGFuY2VzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVjZW50X2luc3RhbmNlc1wiKSBlbnRyeS5zZXROdW1SZWNlbnRJbnN0YW5jZXModmFsKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIG91dHB1dCBoaXN0b2dyYW06IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIGVudHJ5O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNTdWJtaXRUeFJlc3VsdChycGNSZXN1bHQpIHtcbiAgICBhc3NlcnQocnBjUmVzdWx0KTtcbiAgICBsZXQgcmVzdWx0ID0gbmV3IE1vbmVyb1N1Ym1pdFR4UmVzdWx0KCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1Jlc3VsdCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNSZXN1bHRba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiZG91YmxlX3NwZW5kXCIpIHJlc3VsdC5zZXRJc0RvdWJsZVNwZW5kU2Vlbih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImZlZV90b29fbG93XCIpIHJlc3VsdC5zZXRJc0ZlZVRvb0xvdyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImludmFsaWRfaW5wdXRcIikgcmVzdWx0LnNldEhhc0ludmFsaWRJbnB1dCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImludmFsaWRfb3V0cHV0XCIpIHJlc3VsdC5zZXRIYXNJbnZhbGlkT3V0cHV0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidG9vX2Zld19vdXRwdXRzXCIpIHJlc3VsdC5zZXRIYXNUb29GZXdPdXRwdXRzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibG93X21peGluXCIpIHJlc3VsdC5zZXRJc01peGluVG9vTG93KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibm90X3JlbGF5ZWRcIikgcmVzdWx0LnNldElzUmVsYXllZCghdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJvdmVyc3BlbmRcIikgcmVzdWx0LnNldElzT3ZlcnNwZW5kKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVhc29uXCIpIHJlc3VsdC5zZXRSZWFzb24odmFsID09PSBcIlwiID8gdW5kZWZpbmVkIDogdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0b29fYmlnXCIpIHJlc3VsdC5zZXRJc1Rvb0JpZyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNhbml0eV9jaGVja19mYWlsZWRcIikgcmVzdWx0LnNldFNhbml0eUNoZWNrRmFpbGVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3JlZGl0c1wiKSByZXN1bHQuc2V0Q3JlZGl0cyhCaWdJbnQodmFsKSlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGF0dXNcIiB8fCBrZXkgPT09IFwidW50cnVzdGVkXCIpIHt9ICAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRvcF9oYXNoXCIpIHJlc3VsdC5zZXRUb3BCbG9ja0hhc2goXCJcIiA9PT0gdmFsID8gdW5kZWZpbmVkIDogdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9leHRyYV90b29fYmlnXCIpIHJlc3VsdC5zZXRJc1R4RXh0cmFUb29CaWcodmFsKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIHN1Ym1pdCB0eCBoZXggcmVzdWx0OiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1R4UG9vbFN0YXRzKHJwY1N0YXRzKSB7XG4gICAgYXNzZXJ0KHJwY1N0YXRzKTtcbiAgICBsZXQgc3RhdHMgPSBuZXcgTW9uZXJvVHhQb29sU3RhdHMoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjU3RhdHMpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjU3RhdHNba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYnl0ZXNfbWF4XCIpIHN0YXRzLnNldEJ5dGVzTWF4KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYnl0ZXNfbWVkXCIpIHN0YXRzLnNldEJ5dGVzTWVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYnl0ZXNfbWluXCIpIHN0YXRzLnNldEJ5dGVzTWluKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYnl0ZXNfdG90YWxcIikgc3RhdHMuc2V0Qnl0ZXNUb3RhbCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhpc3RvXzk4cGNcIikgc3RhdHMuc2V0SGlzdG85OHBjKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibnVtXzEwbVwiKSBzdGF0cy5zZXROdW0xMG0odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJudW1fZG91YmxlX3NwZW5kc1wiKSBzdGF0cy5zZXROdW1Eb3VibGVTcGVuZHModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJudW1fZmFpbGluZ1wiKSBzdGF0cy5zZXROdW1GYWlsaW5nKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibnVtX25vdF9yZWxheWVkXCIpIHN0YXRzLnNldE51bU5vdFJlbGF5ZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJvbGRlc3RcIikgc3RhdHMuc2V0T2xkZXN0VGltZXN0YW1wKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhzX3RvdGFsXCIpIHN0YXRzLnNldE51bVR4cyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImZlZV90b3RhbFwiKSBzdGF0cy5zZXRGZWVUb3RhbChCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGlzdG9cIikge1xuICAgICAgICBzdGF0cy5zZXRIaXN0byhuZXcgTWFwKCkpO1xuICAgICAgICBmb3IgKGxldCBlbGVtIG9mIHZhbCkgc3RhdHMuZ2V0SGlzdG8oKS5zZXQoZWxlbS5ieXRlcywgZWxlbS50eHMpO1xuICAgICAgfVxuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gdHggcG9vbCBzdGF0czogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cblxuICAgIC8vIHVuaW5pdGlhbGl6ZSBzb21lIHN0YXRzIGlmIG5vdCBhcHBsaWNhYmxlXG4gICAgaWYgKHN0YXRzLmdldEhpc3RvOThwYygpID09PSAwKSBzdGF0cy5zZXRIaXN0bzk4cGModW5kZWZpbmVkKTtcbiAgICBpZiAoc3RhdHMuZ2V0TnVtVHhzKCkgPT09IDApIHtcbiAgICAgIHN0YXRzLnNldEJ5dGVzTWluKHVuZGVmaW5lZCk7XG4gICAgICBzdGF0cy5zZXRCeXRlc01lZCh1bmRlZmluZWQpO1xuICAgICAgc3RhdHMuc2V0Qnl0ZXNNYXgodW5kZWZpbmVkKTtcbiAgICAgIHN0YXRzLnNldEhpc3RvOThwYyh1bmRlZmluZWQpO1xuICAgICAgc3RhdHMuc2V0T2xkZXN0VGltZXN0YW1wKHVuZGVmaW5lZCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0YXRzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNBbHRDaGFpbihycGNDaGFpbikge1xuICAgIGFzc2VydChycGNDaGFpbik7XG4gICAgbGV0IGNoYWluID0gbmV3IE1vbmVyb0FsdENoYWluKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY0NoYWluKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY0NoYWluW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImJsb2NrX2hhc2hcIikge30gIC8vIHVzaW5nIGJsb2NrX2hhc2hlcyBpbnN0ZWFkXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGlmZmljdWx0eVwiKSB7IH0gLy8gaGFuZGxlZCBieSB3aWRlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5X3RvcDY0XCIpIHsgfSAgLy8gaGFuZGxlZCBieSB3aWRlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3aWRlX2RpZmZpY3VsdHlcIikgY2hhaW4uc2V0RGlmZmljdWx0eShHZW5VdGlscy5yZWNvbmNpbGUoY2hhaW4uZ2V0RGlmZmljdWx0eSgpLCBNb25lcm9EYWVtb25ScGMucHJlZml4ZWRIZXhUb0JJKHZhbCkpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJoZWlnaHRcIikgY2hhaW4uc2V0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibGVuZ3RoXCIpIGNoYWluLnNldExlbmd0aCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX2hhc2hlc1wiKSBjaGFpbi5zZXRCbG9ja0hhc2hlcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm1haW5fY2hhaW5fcGFyZW50X2Jsb2NrXCIpIGNoYWluLnNldE1haW5DaGFpblBhcmVudEJsb2NrSGFzaCh2YWwpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gYWx0ZXJuYXRpdmUgY2hhaW46IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIGNoYWluO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNQZWVyKHJwY1BlZXIpIHtcbiAgICBhc3NlcnQocnBjUGVlcik7XG4gICAgbGV0IHBlZXIgPSBuZXcgTW9uZXJvUGVlcigpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNQZWVyKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1BlZXJba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiaG9zdFwiKSBwZWVyLnNldEhvc3QodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJpZFwiKSBwZWVyLnNldElkKFwiXCIgKyB2YWwpOyAgLy8gVE9ETyBtb25lcm8td2FsbGV0LXJwYzogcGVlciBpZCBpcyBCaWdJbnQgYnV0IHN0cmluZyBpbiBgZ2V0X2Nvbm5lY3Rpb25zYFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImlwXCIpIHt9IC8vIGhvc3QgdXNlZCBpbnN0ZWFkIHdoaWNoIGlzIGNvbnNpc3RlbnRseSBhIHN0cmluZ1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxhc3Rfc2VlblwiKSBwZWVyLnNldExhc3RTZWVuVGltZXN0YW1wKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicG9ydFwiKSBwZWVyLnNldFBvcnQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJycGNfcG9ydFwiKSBwZWVyLnNldFJwY1BvcnQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwcnVuaW5nX3NlZWRcIikgcGVlci5zZXRQcnVuaW5nU2VlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJwY19jcmVkaXRzX3Blcl9oYXNoXCIpIHBlZXIuc2V0UnBjQ3JlZGl0c1Blckhhc2goQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gcnBjIHBlZXI6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIHBlZXI7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY0Nvbm5lY3Rpb24ocnBjQ29ubmVjdGlvbikge1xuICAgIGxldCBwZWVyID0gbmV3IE1vbmVyb1BlZXIoKTtcbiAgICBwZWVyLnNldElzT25saW5lKHRydWUpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNDb25uZWN0aW9uKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY0Nvbm5lY3Rpb25ba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYWRkcmVzc1wiKSBwZWVyLnNldEFkZHJlc3ModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhdmdfZG93bmxvYWRcIikgcGVlci5zZXRBdmdEb3dubG9hZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImF2Z191cGxvYWRcIikgcGVlci5zZXRBdmdVcGxvYWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjb25uZWN0aW9uX2lkXCIpIHBlZXIuc2V0SWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjdXJyZW50X2Rvd25sb2FkXCIpIHBlZXIuc2V0Q3VycmVudERvd25sb2FkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3VycmVudF91cGxvYWRcIikgcGVlci5zZXRDdXJyZW50VXBsb2FkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGVpZ2h0XCIpIHBlZXIuc2V0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaG9zdFwiKSBwZWVyLnNldEhvc3QodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJpcFwiKSB7fSAvLyBob3N0IHVzZWQgaW5zdGVhZCB3aGljaCBpcyBjb25zaXN0ZW50bHkgYSBzdHJpbmdcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJpbmNvbWluZ1wiKSBwZWVyLnNldElzSW5jb21pbmcodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsaXZlX3RpbWVcIikgcGVlci5zZXRMaXZlVGltZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxvY2FsX2lwXCIpIHBlZXIuc2V0SXNMb2NhbElwKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibG9jYWxob3N0XCIpIHBlZXIuc2V0SXNMb2NhbEhvc3QodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwZWVyX2lkXCIpIHBlZXIuc2V0SWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwb3J0XCIpIHBlZXIuc2V0UG9ydChwYXJzZUludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJycGNfcG9ydFwiKSBwZWVyLnNldFJwY1BvcnQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyZWN2X2NvdW50XCIpIHBlZXIuc2V0TnVtUmVjZWl2ZXModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyZWN2X2lkbGVfdGltZVwiKSBwZWVyLnNldFJlY2VpdmVJZGxlVGltZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNlbmRfY291bnRcIikgcGVlci5zZXROdW1TZW5kcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNlbmRfaWRsZV90aW1lXCIpIHBlZXIuc2V0U2VuZElkbGVUaW1lKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3RhdGVcIikgcGVlci5zZXRTdGF0ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN1cHBvcnRfZmxhZ3NcIikgcGVlci5zZXROdW1TdXBwb3J0RmxhZ3ModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwcnVuaW5nX3NlZWRcIikgcGVlci5zZXRQcnVuaW5nU2VlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJwY19jcmVkaXRzX3Blcl9oYXNoXCIpIHBlZXIuc2V0UnBjQ3JlZGl0c1Blckhhc2goQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFkZHJlc3NfdHlwZVwiKSBwZWVyLnNldFR5cGUodmFsKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIHBlZXI6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIHBlZXI7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFRvUnBjQmFuKGJhbjogTW9uZXJvQmFuKSB7XG4gICAgbGV0IHJwY0JhbjogYW55ID0ge307XG4gICAgcnBjQmFuLmhvc3QgPSBiYW4uZ2V0SG9zdCgpO1xuICAgIHJwY0Jhbi5pcCA9IGJhbi5nZXRJcCgpO1xuICAgIHJwY0Jhbi5iYW4gPSBiYW4uZ2V0SXNCYW5uZWQoKTtcbiAgICBycGNCYW4uc2Vjb25kcyA9IGJhbi5nZXRTZWNvbmRzKCk7XG4gICAgcmV0dXJuIHJwY0JhbjtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjTWluaW5nU3RhdHVzKHJwY1N0YXR1cykge1xuICAgIGxldCBzdGF0dXMgPSBuZXcgTW9uZXJvTWluaW5nU3RhdHVzKCk7XG4gICAgc3RhdHVzLnNldElzQWN0aXZlKHJwY1N0YXR1cy5hY3RpdmUpO1xuICAgIHN0YXR1cy5zZXRTcGVlZChycGNTdGF0dXMuc3BlZWQpO1xuICAgIHN0YXR1cy5zZXROdW1UaHJlYWRzKHJwY1N0YXR1cy50aHJlYWRzX2NvdW50KTtcbiAgICBpZiAocnBjU3RhdHVzLmFjdGl2ZSkge1xuICAgICAgc3RhdHVzLnNldEFkZHJlc3MocnBjU3RhdHVzLmFkZHJlc3MpO1xuICAgICAgc3RhdHVzLnNldElzQmFja2dyb3VuZChycGNTdGF0dXMuaXNfYmFja2dyb3VuZF9taW5pbmdfZW5hYmxlZCk7XG4gICAgfVxuICAgIHJldHVybiBzdGF0dXM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1VwZGF0ZUNoZWNrUmVzdWx0KHJwY1Jlc3VsdCkge1xuICAgIGFzc2VydChycGNSZXN1bHQpO1xuICAgIGxldCByZXN1bHQgPSBuZXcgTW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjUmVzdWx0KSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1Jlc3VsdFtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJhdXRvX3VyaVwiKSByZXN1bHQuc2V0QXV0b1VyaSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhhc2hcIikgcmVzdWx0LnNldEhhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwYXRoXCIpIHt9IC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3RhdHVzXCIpIHt9IC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidXBkYXRlXCIpIHJlc3VsdC5zZXRJc1VwZGF0ZUF2YWlsYWJsZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVzZXJfdXJpXCIpIHJlc3VsdC5zZXRVc2VyVXJpKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidmVyc2lvblwiKSByZXN1bHQuc2V0VmVyc2lvbih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVudHJ1c3RlZFwiKSB7fSAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gcnBjIGNoZWNrIHVwZGF0ZSByZXN1bHQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgaWYgKHJlc3VsdC5nZXRBdXRvVXJpKCkgPT09IFwiXCIpIHJlc3VsdC5zZXRBdXRvVXJpKHVuZGVmaW5lZCk7XG4gICAgaWYgKHJlc3VsdC5nZXRVc2VyVXJpKCkgPT09IFwiXCIpIHJlc3VsdC5zZXRVc2VyVXJpKHVuZGVmaW5lZCk7XG4gICAgaWYgKHJlc3VsdC5nZXRWZXJzaW9uKCkgPT09IFwiXCIpIHJlc3VsdC5zZXRWZXJzaW9uKHVuZGVmaW5lZCk7XG4gICAgaWYgKHJlc3VsdC5nZXRIYXNoKCkgPT09IFwiXCIpIHJlc3VsdC5zZXRIYXNoKHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVXBkYXRlRG93bmxvYWRSZXN1bHQocnBjUmVzdWx0KSB7XG4gICAgbGV0IHJlc3VsdCA9IG5ldyBNb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdChNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1VwZGF0ZUNoZWNrUmVzdWx0KHJwY1Jlc3VsdCkgYXMgTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQpO1xuICAgIHJlc3VsdC5zZXREb3dubG9hZFBhdGgocnBjUmVzdWx0W1wicGF0aFwiXSk7XG4gICAgaWYgKHJlc3VsdC5nZXREb3dubG9hZFBhdGgoKSA9PT0gXCJcIikgcmVzdWx0LnNldERvd25sb2FkUGF0aCh1bmRlZmluZWQpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgYSAnMHgnIHByZWZpeGVkIGhleGlkZWNpbWFsIHN0cmluZyB0byBhIGJpZ2ludC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBoZXggaXMgdGhlICcweCcgcHJlZml4ZWQgaGV4aWRlY2ltYWwgc3RyaW5nIHRvIGNvbnZlcnRcbiAgICogQHJldHVybiB7YmlnaW50fSB0aGUgaGV4aWNlZGltYWwgY29udmVydGVkIHRvIGRlY2ltYWxcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgcHJlZml4ZWRIZXhUb0JJKGhleCkge1xuICAgIGFzc2VydChoZXguc3Vic3RyaW5nKDAsIDIpID09PSBcIjB4XCIpO1xuICAgIHJldHVybiBCaWdJbnQoaGV4KTtcbiAgfVxufVxuXG4vKipcbiAqIEltcGxlbWVudHMgYSBNb25lcm9EYWVtb24gYnkgcHJveHlpbmcgcmVxdWVzdHMgdG8gYSB3b3JrZXIuXG4gKiBcbiAqIEBwcml2YXRlXG4gKi9cbmNsYXNzIE1vbmVyb0RhZW1vblJwY1Byb3h5IHtcblxuICAvLyBzdGF0ZSB2YXJpYWJsZXNcbiAgcHJpdmF0ZSBkYWVtb25JZDogYW55O1xuICBwcml2YXRlIHdvcmtlcjogYW55O1xuICBwcml2YXRlIHdyYXBwZWRMaXN0ZW5lcnM6IGFueTtcbiAgcHJpdmF0ZSBwcm9jZXNzOiBhbnk7XG5cbiAgY29uc3RydWN0b3IoZGFlbW9uSWQsIHdvcmtlcikge1xuICAgIHRoaXMuZGFlbW9uSWQgPSBkYWVtb25JZDtcbiAgICB0aGlzLndvcmtlciA9IHdvcmtlcjtcbiAgICB0aGlzLndyYXBwZWRMaXN0ZW5lcnMgPSBbXTtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFNUQVRJQyBVVElMSVRJRVMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIHN0YXRpYyBhc3luYyBjb25uZWN0KGNvbmZpZykge1xuICAgIGxldCBkYWVtb25JZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICBjb25maWcgPSBPYmplY3QuYXNzaWduKHt9LCBjb25maWcsIHtwcm94eVRvV29ya2VyOiBmYWxzZX0pO1xuICAgIGF3YWl0IExpYnJhcnlVdGlscy5pbnZva2VXb3JrZXIoZGFlbW9uSWQsIFwiY29ubmVjdERhZW1vblJwY1wiLCBbY29uZmlnXSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9EYWVtb25ScGNQcm94eShkYWVtb25JZCwgYXdhaXQgTGlicmFyeVV0aWxzLmdldFdvcmtlcigpKTtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBJTlNUQU5DRSBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIGFzeW5jIGFkZExpc3RlbmVyKGxpc3RlbmVyKSB7XG4gICAgbGV0IHdyYXBwZWRMaXN0ZW5lciA9IG5ldyBEYWVtb25Xb3JrZXJMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgbGV0IGxpc3RlbmVySWQgPSB3cmFwcGVkTGlzdGVuZXIuZ2V0SWQoKTtcbiAgICBMaWJyYXJ5VXRpbHMuYWRkV29ya2VyQ2FsbGJhY2sodGhpcy5kYWVtb25JZCwgXCJvbkJsb2NrSGVhZGVyX1wiICsgbGlzdGVuZXJJZCwgW3dyYXBwZWRMaXN0ZW5lci5vbkJsb2NrSGVhZGVyLCB3cmFwcGVkTGlzdGVuZXJdKTtcbiAgICB0aGlzLndyYXBwZWRMaXN0ZW5lcnMucHVzaCh3cmFwcGVkTGlzdGVuZXIpO1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkFkZExpc3RlbmVyXCIsIFtsaXN0ZW5lcklkXSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndyYXBwZWRMaXN0ZW5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLndyYXBwZWRMaXN0ZW5lcnNbaV0uZ2V0TGlzdGVuZXIoKSA9PT0gbGlzdGVuZXIpIHtcbiAgICAgICAgbGV0IGxpc3RlbmVySWQgPSB0aGlzLndyYXBwZWRMaXN0ZW5lcnNbaV0uZ2V0SWQoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25SZW1vdmVMaXN0ZW5lclwiLCBbbGlzdGVuZXJJZF0pO1xuICAgICAgICBMaWJyYXJ5VXRpbHMucmVtb3ZlV29ya2VyQ2FsbGJhY2sodGhpcy5kYWVtb25JZCwgXCJvbkJsb2NrSGVhZGVyX1wiICsgbGlzdGVuZXJJZCk7XG4gICAgICAgIHRoaXMud3JhcHBlZExpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTGlzdGVuZXIgaXMgbm90IHJlZ2lzdGVyZWQgd2l0aCBkYWVtb25cIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldExpc3RlbmVycygpIHtcbiAgICBsZXQgbGlzdGVuZXJzID0gW107XG4gICAgZm9yIChsZXQgd3JhcHBlZExpc3RlbmVyIG9mIHRoaXMud3JhcHBlZExpc3RlbmVycykgbGlzdGVuZXJzLnB1c2god3JhcHBlZExpc3RlbmVyLmdldExpc3RlbmVyKCkpO1xuICAgIHJldHVybiBsaXN0ZW5lcnM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFJwY0Nvbm5lY3Rpb24oKSB7XG4gICAgbGV0IGNvbmZpZyA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0UnBjQ29ubmVjdGlvblwiKTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24oY29uZmlnIGFzIFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4pO1xuICB9XG4gIFxuICBhc3luYyBpc0Nvbm5lY3RlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25Jc0Nvbm5lY3RlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VmVyc2lvbigpIHtcbiAgICBsZXQgdmVyc2lvbkpzb246IGFueSA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0VmVyc2lvblwiKTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1ZlcnNpb24odmVyc2lvbkpzb24ubnVtYmVyLCB2ZXJzaW9uSnNvbi5pc1JlbGVhc2UpO1xuICB9XG4gIFxuICBhc3luYyBpc1RydXN0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uSXNUcnVzdGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRIZWlnaHQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0SGVpZ2h0XCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0hhc2goaGVpZ2h0KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tIYXNoXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrVGVtcGxhdGUod2FsbGV0QWRkcmVzcywgcmVzZXJ2ZVNpemUpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0Jsb2NrVGVtcGxhdGUoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja1RlbXBsYXRlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBnZXRMYXN0QmxvY2tIZWFkZXIoKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9CbG9ja0hlYWRlcihhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldExhc3RCbG9ja0hlYWRlclwiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrSGVhZGVyQnlIYXNoKGJsb2NrSGFzaCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja0hlYWRlckJ5SGFzaFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tIZWFkZXJCeUhlaWdodChoZWlnaHQpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tIZWFkZXJCeUhlaWdodFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tIZWFkZXJzQnlSYW5nZShzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSB7XG4gICAgbGV0IGJsb2NrSGVhZGVyc0pzb246IGFueVtdID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja0hlYWRlcnNCeVJhbmdlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkgYXMgYW55W107XG4gICAgbGV0IGhlYWRlcnMgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0hlYWRlckpzb24gb2YgYmxvY2tIZWFkZXJzSnNvbikgaGVhZGVycy5wdXNoKG5ldyBNb25lcm9CbG9ja0hlYWRlcihibG9ja0hlYWRlckpzb24pKTtcbiAgICByZXR1cm4gaGVhZGVycztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tCeUhhc2goYmxvY2tIYXNoKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9CbG9jayhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2NrQnlIYXNoXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSksIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFgpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja3NCeUhhc2goYmxvY2tIYXNoZXMsIHN0YXJ0SGVpZ2h0LCBwcnVuZSkge1xuICAgIGxldCBibG9ja3NKc29uOiBhbnlbXSA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tzQnlIYXNoXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkgYXMgYW55W107XG4gICAgbGV0IGJsb2NrcyA9IFtdO1xuICAgIGZvciAobGV0IGJsb2NrSnNvbiBvZiBibG9ja3NKc29uKSBibG9ja3MucHVzaChuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uKSk7XG4gICAgcmV0dXJuIGJsb2NrcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tCeUhlaWdodChoZWlnaHQpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0Jsb2NrKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tCeUhlaWdodFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpLCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tzQnlIZWlnaHQoaGVpZ2h0cykge1xuICAgIGxldCBibG9ja3NKc29uOiBhbnlbXT0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja3NCeUhlaWdodFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpIGFzIGFueVtdO1xuICAgIGxldCBibG9ja3MgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0pzb24gb2YgYmxvY2tzSnNvbikgYmxvY2tzLnB1c2gobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWCkpO1xuICAgIHJldHVybiBibG9ja3M7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2Nrc0J5UmFuZ2Uoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCkge1xuICAgIGxldCBibG9ja3NKc29uOiBhbnlbXSA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tzQnlSYW5nZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpIGFzIGFueVtdO1xuICAgIGxldCBibG9ja3MgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0pzb24gb2YgYmxvY2tzSnNvbikgYmxvY2tzLnB1c2gobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWCkpO1xuICAgIHJldHVybiBibG9ja3M7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2Nrc0J5UmFuZ2VDaHVua2VkKHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIG1heENodW5rU2l6ZSkge1xuICAgIGxldCBibG9ja3NKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja3NCeVJhbmdlQ2h1bmtlZFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpIGFzIGFueVtdO1xuICAgIGxldCBibG9ja3MgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0pzb24gb2YgYmxvY2tzSnNvbikgYmxvY2tzLnB1c2gobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWCkpO1xuICAgIHJldHVybiBibG9ja3M7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrSGFzaGVzKGJsb2NrSGFzaGVzLCBzdGFydEhlaWdodCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2NrSGFzaGVzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4cyh0eEhhc2hlcywgcHJ1bmUgPSBmYWxzZSkge1xuICAgIFxuICAgIC8vIGRlc2VyaWFsaXplIHR4cyBmcm9tIGJsb2Nrc1xuICAgIGxldCBibG9ja3MgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0pzb24gb2YgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRUeHNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSBhcyBhbnlbXSkge1xuICAgICAgYmxvY2tzLnB1c2gobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWCkpO1xuICAgIH1cbiAgICBcbiAgICAvLyBjb2xsZWN0IHR4c1xuICAgIGxldCB0eHMgPSBbXTtcbiAgICBmb3IgKGxldCBibG9jayBvZiBibG9ja3MpIHtcbiAgICAgIGZvciAobGV0IHR4IG9mIGJsb2NrLmdldFR4cygpKSB7XG4gICAgICAgIGlmICghdHguZ2V0SXNDb25maXJtZWQoKSkgdHguc2V0QmxvY2sodW5kZWZpbmVkKTtcbiAgICAgICAgdHhzLnB1c2godHgpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHhzO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeEhleGVzKHR4SGFzaGVzLCBwcnVuZSA9IGZhbHNlKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0VHhIZXhlc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRNaW5lclR4U3VtKGhlaWdodCwgbnVtQmxvY2tzKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9NaW5lclR4U3VtKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0TWluZXJUeFN1bVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RmVlRXN0aW1hdGUoZ3JhY2VCbG9ja3M/KSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9GZWVFc3RpbWF0ZShhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEZlZUVzdGltYXRlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBzdWJtaXRUeEhleCh0eEhleCwgZG9Ob3RSZWxheSkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvU3VibWl0VHhSZXN1bHQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TdWJtaXRUeEhleFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVsYXlUeHNCeUhhc2godHhIYXNoZXMpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25SZWxheVR4c0J5SGFzaFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFBvb2woKSB7XG4gICAgbGV0IGJsb2NrSnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0VHhQb29sXCIpO1xuICAgIGxldCB0eHMgPSBuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uLCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYKS5nZXRUeHMoKTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHR4LnNldEJsb2NrKHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIHR4cyA/IHR4cyA6IFtdO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFBvb2xIYXNoZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0VHhQb29sSGFzaGVzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4UG9vbEJhY2tsb2coKSB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFBvb2xTdGF0cygpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1R4UG9vbFN0YXRzKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0VHhQb29sU3RhdHNcIikpO1xuICB9XG4gIFxuICBhc3luYyBmbHVzaFR4UG9vbChoYXNoZXMpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25GbHVzaFR4UG9vbFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRLZXlJbWFnZVNwZW50U3RhdHVzZXMoa2V5SW1hZ2VzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dHMob3V0cHV0cyk6IFByb21pc2U8TW9uZXJvT3V0cHV0W10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dEhpc3RvZ3JhbShhbW91bnRzLCBtaW5Db3VudCwgbWF4Q291bnQsIGlzVW5sb2NrZWQsIHJlY2VudEN1dG9mZikge1xuICAgIGxldCBlbnRyaWVzID0gW107XG4gICAgZm9yIChsZXQgZW50cnlKc29uIG9mIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0T3V0cHV0SGlzdG9ncmFtXCIsIFthbW91bnRzLCBtaW5Db3VudCwgbWF4Q291bnQsIGlzVW5sb2NrZWQsIHJlY2VudEN1dG9mZl0pIGFzIGFueVtdKSB7XG4gICAgICBlbnRyaWVzLnB1c2gobmV3IE1vbmVyb091dHB1dEhpc3RvZ3JhbUVudHJ5KGVudHJ5SnNvbikpO1xuICAgIH1cbiAgICByZXR1cm4gZW50cmllcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0T3V0cHV0RGlzdHJpYnV0aW9uKGFtb3VudHMsIGN1bXVsYXRpdmUsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpIHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEluZm8oKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9EYWVtb25JbmZvKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0SW5mb1wiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFN5bmNJbmZvKCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvRGFlbW9uU3luY0luZm8oYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRTeW5jSW5mb1wiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhhcmRGb3JrSW5mbygpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0hhcmRGb3JrSW5mbyhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEhhcmRGb3JrSW5mb1wiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFsdENoYWlucygpIHtcbiAgICBsZXQgYWx0Q2hhaW5zID0gW107XG4gICAgZm9yIChsZXQgYWx0Q2hhaW5Kc29uIG9mIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QWx0Q2hhaW5zXCIpIGFzIGFueSkgYWx0Q2hhaW5zLnB1c2gobmV3IE1vbmVyb0FsdENoYWluKGFsdENoYWluSnNvbikpO1xuICAgIHJldHVybiBhbHRDaGFpbnM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFsdEJsb2NrSGFzaGVzKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEFsdEJsb2NrSGFzaGVzXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXREb3dubG9hZExpbWl0KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldERvd25sb2FkTGltaXRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIHNldERvd25sb2FkTGltaXQobGltaXQpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TZXREb3dubG9hZExpbWl0XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2V0RG93bmxvYWRMaW1pdCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25SZXNldERvd25sb2FkTGltaXRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFVwbG9hZExpbWl0KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFVwbG9hZExpbWl0XCIpO1xuICB9XG4gIFxuICBhc3luYyBzZXRVcGxvYWRMaW1pdChsaW1pdCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblNldFVwbG9hZExpbWl0XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2V0VXBsb2FkTGltaXQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uUmVzZXRVcGxvYWRMaW1pdFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGVlcnMoKSB7XG4gICAgbGV0IHBlZXJzID0gW107XG4gICAgZm9yIChsZXQgcGVlckpzb24gb2YgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRQZWVyc1wiKSBhcyBhbnkpIHBlZXJzLnB1c2gobmV3IE1vbmVyb1BlZXIocGVlckpzb24pKTtcbiAgICByZXR1cm4gcGVlcnM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEtub3duUGVlcnMoKSB7XG4gICAgbGV0IHBlZXJzID0gW107XG4gICAgZm9yIChsZXQgcGVlckpzb24gb2YgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRLbm93blBlZXJzXCIpIGFzIGFueSkgcGVlcnMucHVzaChuZXcgTW9uZXJvUGVlcihwZWVySnNvbikpO1xuICAgIHJldHVybiBwZWVycztcbiAgfVxuICBcbiAgYXN5bmMgc2V0T3V0Z29pbmdQZWVyTGltaXQobGltaXQpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TZXRJbmNvbWluZ1BlZXJMaW1pdFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBzZXRJbmNvbWluZ1BlZXJMaW1pdChsaW1pdCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblNldEluY29taW5nUGVlckxpbWl0XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBlZXJCYW5zKCkge1xuICAgIGxldCBiYW5zID0gW107XG4gICAgZm9yIChsZXQgYmFuSnNvbiBvZiBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFBlZXJCYW5zXCIpIGFzIGFueSkgYmFucy5wdXNoKG5ldyBNb25lcm9CYW4oYmFuSnNvbikpO1xuICAgIHJldHVybiBiYW5zO1xuICB9XG5cbiAgYXN5bmMgc2V0UGVlckJhbnMoYmFucykge1xuICAgIGxldCBiYW5zSnNvbiA9IFtdO1xuICAgIGZvciAobGV0IGJhbiBvZiBiYW5zKSBiYW5zSnNvbi5wdXNoKGJhbi50b0pzb24oKSk7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uU2V0UGVlckJhbnNcIiwgW2JhbnNKc29uXSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0YXJ0TWluaW5nKGFkZHJlc3MsIG51bVRocmVhZHMsIGlzQmFja2dyb3VuZCwgaWdub3JlQmF0dGVyeSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblN0YXJ0TWluaW5nXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0b3BNaW5pbmcoKSB7XG4gICAgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TdG9wTWluaW5nXCIpXG4gIH1cbiAgXG4gIGFzeW5jIGdldE1pbmluZ1N0YXR1cygpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb01pbmluZ1N0YXR1cyhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldE1pbmluZ1N0YXR1c1wiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdEJsb2NrcyhibG9ja0Jsb2JzKSB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICB9XG5cbiAgYXN5bmMgcHJ1bmVCbG9ja2NoYWluKGNoZWNrKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9QcnVuZVJlc3VsdChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblBydW5lQmxvY2tjaGFpblwiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrRm9yVXBkYXRlKCk6IFByb21pc2U8TW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGRvd25sb2FkVXBkYXRlKHBhdGgpOiBQcm9taXNlPE1vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBzdG9wKCkge1xuICAgIHdoaWxlICh0aGlzLndyYXBwZWRMaXN0ZW5lcnMubGVuZ3RoKSBhd2FpdCB0aGlzLnJlbW92ZUxpc3RlbmVyKHRoaXMud3JhcHBlZExpc3RlbmVyc1swXS5nZXRMaXN0ZW5lcigpKTtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TdG9wXCIpO1xuICB9XG4gIFxuICBhc3luYyB3YWl0Rm9yTmV4dEJsb2NrSGVhZGVyKCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25XYWl0Rm9yTmV4dEJsb2NrSGVhZGVyXCIpKTtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFBSSVZBVEUgSEVMUEVSUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIC8vIFRPRE86IGR1cGxpY2F0ZWQgd2l0aCBNb25lcm9XYWxsZXRGdWxsUHJveHlcbiAgcHJvdGVjdGVkIGFzeW5jIGludm9rZVdvcmtlcihmbk5hbWU6IHN0cmluZywgYXJncz86IGFueSkge1xuICAgIHJldHVybiBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKHRoaXMuZGFlbW9uSWQsIGZuTmFtZSwgYXJncyk7XG4gIH1cbn1cblxuLyoqXG4gKiBQb2xscyBhIE1vbmVybyBkYWVtb24gZm9yIHVwZGF0ZXMgYW5kIG5vdGlmaWVzIGxpc3RlbmVycyBhcyB0aGV5IG9jY3VyLlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBEYWVtb25Qb2xsZXIge1xuXG4gIHByb3RlY3RlZCBkYWVtb246IE1vbmVyb0RhZW1vblJwYztcbiAgcHJvdGVjdGVkIGxvb3BlcjogVGFza0xvb3BlcjtcbiAgcHJvdGVjdGVkIGlzUG9sbGluZzogYm9vbGVhbjtcbiAgcHJvdGVjdGVkIGxhc3RIZWFkZXI6IE1vbmVyb0Jsb2NrSGVhZGVyO1xuXG4gIGNvbnN0cnVjdG9yKGRhZW1vbikge1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICB0aGlzLmRhZW1vbiA9IGRhZW1vbjtcbiAgICB0aGlzLmxvb3BlciA9IG5ldyBUYXNrTG9vcGVyKGFzeW5jIGZ1bmN0aW9uKCkgeyBhd2FpdCB0aGF0LnBvbGwoKTsgfSk7XG4gIH1cbiAgXG4gIHNldElzUG9sbGluZyhpc1BvbGxpbmc6IGJvb2xlYW4pIHtcbiAgICB0aGlzLmlzUG9sbGluZyA9IGlzUG9sbGluZztcbiAgICBpZiAoaXNQb2xsaW5nKSB0aGlzLmxvb3Blci5zdGFydCh0aGlzLmRhZW1vbi5nZXRQb2xsSW50ZXJ2YWwoKSk7XG4gICAgZWxzZSB0aGlzLmxvb3Blci5zdG9wKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHBvbGwoKSB7XG4gICAgdHJ5IHtcbiAgICAgIFxuICAgICAgLy8gZ2V0IGxhdGVzdCBibG9jayBoZWFkZXJcbiAgICAgIGxldCBoZWFkZXIgPSBhd2FpdCB0aGlzLmRhZW1vbi5nZXRMYXN0QmxvY2tIZWFkZXIoKTtcbiAgICAgIFxuICAgICAgLy8gc2F2ZSBmaXJzdCBoZWFkZXIgZm9yIGNvbXBhcmlzb25cbiAgICAgIGlmICghdGhpcy5sYXN0SGVhZGVyKSB7XG4gICAgICAgIHRoaXMubGFzdEhlYWRlciA9IGF3YWl0IHRoaXMuZGFlbW9uLmdldExhc3RCbG9ja0hlYWRlcigpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIGNvbXBhcmUgaGVhZGVyIHRvIGxhc3RcbiAgICAgIGlmIChoZWFkZXIuZ2V0SGFzaCgpICE9PSB0aGlzLmxhc3RIZWFkZXIuZ2V0SGFzaCgpKSB7XG4gICAgICAgIHRoaXMubGFzdEhlYWRlciA9IGhlYWRlcjtcbiAgICAgICAgYXdhaXQgdGhpcy5hbm5vdW5jZUJsb2NrSGVhZGVyKGhlYWRlcik7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGJhY2tncm91bmQgcG9sbCBkYWVtb24gaGVhZGVyXCIpO1xuICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgIH1cbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBhbm5vdW5jZUJsb2NrSGVhZGVyKGhlYWRlcjogTW9uZXJvQmxvY2tIZWFkZXIpIHtcbiAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiBhd2FpdCB0aGlzLmRhZW1vbi5nZXRMaXN0ZW5lcnMoKSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgbGlzdGVuZXIub25CbG9ja0hlYWRlcihoZWFkZXIpOyAvLyBub3RpZnkgbGlzdGVuZXJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgY2FsbGluZyBsaXN0ZW5lciBvbiBibG9jayBoZWFkZXJcIiwgZXJyKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBJbnRlcm5hbCBsaXN0ZW5lciB0byBicmlkZ2Ugbm90aWZpY2F0aW9ucyB0byBleHRlcm5hbCBsaXN0ZW5lcnMuXG4gKiBcbiAqIEBwcml2YXRlXG4gKi9cbmNsYXNzIERhZW1vbldvcmtlckxpc3RlbmVyIHtcblxuICBwcm90ZWN0ZWQgaWQ6IGFueTtcbiAgcHJvdGVjdGVkIGxpc3RlbmVyOiBhbnk7XG5cbiAgY29uc3RydWN0b3IobGlzdGVuZXIpIHtcbiAgICB0aGlzLmlkID0gR2VuVXRpbHMuZ2V0VVVJRCgpO1xuICAgIHRoaXMubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgfVxuICBcbiAgZ2V0SWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaWQ7XG4gIH1cbiAgXG4gIGdldExpc3RlbmVyKCkge1xuICAgIHJldHVybiB0aGlzLmxpc3RlbmVyO1xuICB9XG4gIFxuICBhc3luYyBvbkJsb2NrSGVhZGVyKGhlYWRlckpzb24pIHtcbiAgICB0aGlzLmxpc3RlbmVyLm9uQmxvY2tIZWFkZXIobmV3IE1vbmVyb0Jsb2NrSGVhZGVyKGhlYWRlckpzb24pKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBNb25lcm9EYWVtb25ScGM7XG4iXSwibWFwcGluZ3MiOiJ5TEFBQSxJQUFBQSxPQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxTQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxhQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRyxXQUFBLEdBQUFKLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSSxlQUFBLEdBQUFMLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSyxVQUFBLEdBQUFOLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTSxZQUFBLEdBQUFQLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTyxrQkFBQSxHQUFBUixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVEsb0JBQUEsR0FBQVQsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFTLHFCQUFBLEdBQUFWLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBVSxhQUFBLEdBQUFYLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBVyxtQkFBQSxHQUFBWixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVksaUJBQUEsR0FBQWIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFhLHFCQUFBLEdBQUFkLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBYyxxQkFBQSxHQUFBZixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWUsOEJBQUEsR0FBQWhCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBZ0IsaUNBQUEsR0FBQWpCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBaUIsa0JBQUEsR0FBQWxCLHNCQUFBLENBQUFD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