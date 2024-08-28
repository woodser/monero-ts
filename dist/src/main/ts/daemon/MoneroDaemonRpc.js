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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX1Rhc2tMb29wZXIiLCJfTW9uZXJvQWx0Q2hhaW4iLCJfTW9uZXJvQmFuIiwiX01vbmVyb0Jsb2NrIiwiX01vbmVyb0Jsb2NrSGVhZGVyIiwiX01vbmVyb0Jsb2NrVGVtcGxhdGUiLCJfTW9uZXJvQ29ubmVjdGlvblNwYW4iLCJfTW9uZXJvRGFlbW9uIiwiX01vbmVyb0RhZW1vbkNvbmZpZyIsIl9Nb25lcm9EYWVtb25JbmZvIiwiX01vbmVyb0RhZW1vbkxpc3RlbmVyIiwiX01vbmVyb0RhZW1vblN5bmNJbmZvIiwiX01vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0IiwiX01vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0IiwiX01vbmVyb0ZlZUVzdGltYXRlIiwiX01vbmVyb0Vycm9yIiwiX01vbmVyb0hhcmRGb3JrSW5mbyIsIl9Nb25lcm9LZXlJbWFnZSIsIl9Nb25lcm9NaW5lclR4U3VtIiwiX01vbmVyb01pbmluZ1N0YXR1cyIsIl9Nb25lcm9OZXR3b3JrVHlwZSIsIl9Nb25lcm9PdXRwdXQiLCJfTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkiLCJfTW9uZXJvUGVlciIsIl9Nb25lcm9QcnVuZVJlc3VsdCIsIl9Nb25lcm9ScGNDb25uZWN0aW9uIiwiX01vbmVyb1N1Ym1pdFR4UmVzdWx0IiwiX01vbmVyb1R4IiwiX01vbmVyb1R4UG9vbFN0YXRzIiwiX01vbmVyb1V0aWxzIiwiX01vbmVyb1ZlcnNpb24iLCJNb25lcm9EYWVtb25ScGMiLCJNb25lcm9EYWVtb24iLCJNQVhfUkVRX1NJWkUiLCJERUZBVUxUX0lEIiwiTlVNX0hFQURFUlNfUEVSX1JFUSIsIkRFRkFVTFRfUE9MTF9QRVJJT0QiLCJjb25zdHJ1Y3RvciIsImNvbmZpZyIsInByb3h5RGFlbW9uIiwicHJveHlUb1dvcmtlciIsImxpc3RlbmVycyIsImNhY2hlZEhlYWRlcnMiLCJnZXRQcm9jZXNzIiwicHJvY2VzcyIsInN0b3BQcm9jZXNzIiwiZm9yY2UiLCJ1bmRlZmluZWQiLCJNb25lcm9FcnJvciIsImxpc3RlbmVyc0NvcHkiLCJHZW5VdGlscyIsImNvcHlBcnJheSIsImdldExpc3RlbmVycyIsImxpc3RlbmVyIiwicmVtb3ZlTGlzdGVuZXIiLCJraWxsUHJvY2VzcyIsImFkZExpc3RlbmVyIiwiYXNzZXJ0IiwiTW9uZXJvRGFlbW9uTGlzdGVuZXIiLCJwdXNoIiwicmVmcmVzaExpc3RlbmluZyIsImlkeCIsImluZGV4T2YiLCJzcGxpY2UiLCJnZXRScGNDb25uZWN0aW9uIiwiZ2V0U2VydmVyIiwiaXNDb25uZWN0ZWQiLCJnZXRWZXJzaW9uIiwiZSIsInJlc3AiLCJzZW5kSnNvblJlcXVlc3QiLCJjaGVja1Jlc3BvbnNlU3RhdHVzIiwicmVzdWx0IiwiTW9uZXJvVmVyc2lvbiIsInZlcnNpb24iLCJyZWxlYXNlIiwiaXNUcnVzdGVkIiwic2VuZFBhdGhSZXF1ZXN0IiwidW50cnVzdGVkIiwiZ2V0SGVpZ2h0IiwiY291bnQiLCJnZXRCbG9ja0hhc2giLCJoZWlnaHQiLCJnZXRCbG9ja1RlbXBsYXRlIiwid2FsbGV0QWRkcmVzcyIsInJlc2VydmVTaXplIiwid2FsbGV0X2FkZHJlc3MiLCJyZXNlcnZlX3NpemUiLCJjb252ZXJ0UnBjQmxvY2tUZW1wbGF0ZSIsImdldExhc3RCbG9ja0hlYWRlciIsImNvbnZlcnRScGNCbG9ja0hlYWRlciIsImJsb2NrX2hlYWRlciIsImdldEJsb2NrSGVhZGVyQnlIYXNoIiwiYmxvY2tIYXNoIiwiaGFzaCIsImdldEJsb2NrSGVhZGVyQnlIZWlnaHQiLCJnZXRCbG9ja0hlYWRlcnNCeVJhbmdlIiwic3RhcnRIZWlnaHQiLCJlbmRIZWlnaHQiLCJzdGFydF9oZWlnaHQiLCJlbmRfaGVpZ2h0IiwiaGVhZGVycyIsInJwY0hlYWRlciIsImdldEJsb2NrQnlIYXNoIiwiY29udmVydFJwY0Jsb2NrIiwiZ2V0QmxvY2tCeUhlaWdodCIsImdldEJsb2Nrc0J5SGVpZ2h0IiwiaGVpZ2h0cyIsInJlc3BCaW4iLCJzZW5kQmluYXJ5UmVxdWVzdCIsInJwY0Jsb2NrcyIsIk1vbmVyb1V0aWxzIiwiYmluYXJ5QmxvY2tzVG9Kc29uIiwiZXF1YWwiLCJ0eHMiLCJsZW5ndGgiLCJibG9ja3MiLCJibG9ja0lkeCIsImJsb2NrIiwic2V0SGVpZ2h0IiwidHhJZHgiLCJ0eCIsIk1vbmVyb1R4Iiwic2V0SGFzaCIsInR4X2hhc2hlcyIsInNldElzQ29uZmlybWVkIiwic2V0SW5UeFBvb2wiLCJzZXRJc01pbmVyVHgiLCJzZXRSZWxheSIsInNldElzUmVsYXllZCIsInNldElzRmFpbGVkIiwic2V0SXNEb3VibGVTcGVuZFNlZW4iLCJjb252ZXJ0UnBjVHgiLCJzZXRUeHMiLCJnZXRCbG9jayIsIm1lcmdlIiwiZ2V0VHhzIiwic2V0QmxvY2siLCJnZXRCbG9ja3NCeVJhbmdlIiwiZ2V0QmxvY2tzQnlSYW5nZUNodW5rZWQiLCJtYXhDaHVua1NpemUiLCJsYXN0SGVpZ2h0IiwiZ2V0TWF4QmxvY2tzIiwidHhIYXNoZXMiLCJwcnVuZSIsIkFycmF5IiwiaXNBcnJheSIsInR4c19oYXNoZXMiLCJkZWNvZGVfYXNfanNvbiIsIm1lc3NhZ2UiLCJnZXRUeEhleGVzIiwiaGV4ZXMiLCJnZXRQcnVuZWRIZXgiLCJnZXRGdWxsSGV4IiwiZ2V0TWluZXJUeFN1bSIsIm51bUJsb2NrcyIsInR4U3VtIiwiTW9uZXJvTWluZXJUeFN1bSIsInNldEVtaXNzaW9uU3VtIiwiQmlnSW50IiwiZW1pc3Npb25fYW1vdW50Iiwic2V0RmVlU3VtIiwiZmVlX2Ftb3VudCIsImdldEZlZUVzdGltYXRlIiwiZ3JhY2VCbG9ja3MiLCJncmFjZV9ibG9ja3MiLCJmZWVFc3RpbWF0ZSIsIk1vbmVyb0ZlZUVzdGltYXRlIiwic2V0RmVlIiwiZmVlIiwic2V0UXVhbnRpemF0aW9uTWFzayIsInF1YW50aXphdGlvbl9tYXNrIiwiZmVlcyIsImkiLCJzZXRGZWVzIiwic3VibWl0VHhIZXgiLCJ0eEhleCIsImRvTm90UmVsYXkiLCJ0eF9hc19oZXgiLCJkb19ub3RfcmVsYXkiLCJjb252ZXJ0UnBjU3VibWl0VHhSZXN1bHQiLCJzZXRJc0dvb2QiLCJyZWxheVR4c0J5SGFzaCIsInR4aWRzIiwiZ2V0VHhQb29sIiwidHJhbnNhY3Rpb25zIiwicnBjVHgiLCJzZXROdW1Db25maXJtYXRpb25zIiwiZ2V0VHhQb29sSGFzaGVzIiwiZ2V0VHhQb29sU3RhdHMiLCJjb252ZXJ0UnBjVHhQb29sU3RhdHMiLCJwb29sX3N0YXRzIiwiZmx1c2hUeFBvb2wiLCJoYXNoZXMiLCJsaXN0aWZ5IiwiZ2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzIiwia2V5SW1hZ2VzIiwia2V5X2ltYWdlcyIsInNwZW50X3N0YXR1cyIsImdldE91dHB1dEhpc3RvZ3JhbSIsImFtb3VudHMiLCJtaW5Db3VudCIsIm1heENvdW50IiwiaXNVbmxvY2tlZCIsInJlY2VudEN1dG9mZiIsIm1pbl9jb3VudCIsIm1heF9jb3VudCIsInVubG9ja2VkIiwicmVjZW50X2N1dG9mZiIsImVudHJpZXMiLCJoaXN0b2dyYW0iLCJycGNFbnRyeSIsImNvbnZlcnRScGNPdXRwdXRIaXN0b2dyYW1FbnRyeSIsImdldE91dHB1dERpc3RyaWJ1dGlvbiIsImN1bXVsYXRpdmUiLCJnZXRJbmZvIiwiY29udmVydFJwY0luZm8iLCJnZXRTeW5jSW5mbyIsImNvbnZlcnRScGNTeW5jSW5mbyIsImdldEhhcmRGb3JrSW5mbyIsImNvbnZlcnRScGNIYXJkRm9ya0luZm8iLCJnZXRBbHRDaGFpbnMiLCJjaGFpbnMiLCJycGNDaGFpbiIsImNvbnZlcnRScGNBbHRDaGFpbiIsImdldEFsdEJsb2NrSGFzaGVzIiwiYmxrc19oYXNoZXMiLCJnZXREb3dubG9hZExpbWl0IiwiZ2V0QmFuZHdpZHRoTGltaXRzIiwic2V0RG93bmxvYWRMaW1pdCIsImxpbWl0IiwicmVzZXREb3dubG9hZExpbWl0IiwiaXNJbnQiLCJzZXRCYW5kd2lkdGhMaW1pdHMiLCJnZXRVcGxvYWRMaW1pdCIsInNldFVwbG9hZExpbWl0IiwicmVzZXRVcGxvYWRMaW1pdCIsImdldFBlZXJzIiwicGVlcnMiLCJjb25uZWN0aW9ucyIsInJwY0Nvbm5lY3Rpb24iLCJjb252ZXJ0UnBjQ29ubmVjdGlvbiIsImdldEtub3duUGVlcnMiLCJncmF5X2xpc3QiLCJycGNQZWVyIiwicGVlciIsImNvbnZlcnRScGNQZWVyIiwic2V0SXNPbmxpbmUiLCJ3aGl0ZV9saXN0Iiwic2V0T3V0Z29pbmdQZWVyTGltaXQiLCJvdXRfcGVlcnMiLCJzZXRJbmNvbWluZ1BlZXJMaW1pdCIsImluX3BlZXJzIiwiZ2V0UGVlckJhbnMiLCJiYW5zIiwicnBjQmFuIiwiYmFuIiwiTW9uZXJvQmFuIiwic2V0SG9zdCIsImhvc3QiLCJzZXRJcCIsImlwIiwic2V0U2Vjb25kcyIsInNlY29uZHMiLCJzZXRQZWVyQmFucyIsInJwY0JhbnMiLCJjb252ZXJ0VG9ScGNCYW4iLCJzdGFydE1pbmluZyIsImFkZHJlc3MiLCJudW1UaHJlYWRzIiwiaXNCYWNrZ3JvdW5kIiwiaWdub3JlQmF0dGVyeSIsIm1pbmVyX2FkZHJlc3MiLCJ0aHJlYWRzX2NvdW50IiwiZG9fYmFja2dyb3VuZF9taW5pbmciLCJpZ25vcmVfYmF0dGVyeSIsInN0b3BNaW5pbmciLCJnZXRNaW5pbmdTdGF0dXMiLCJjb252ZXJ0UnBjTWluaW5nU3RhdHVzIiwic3VibWl0QmxvY2tzIiwiYmxvY2tCbG9icyIsInBydW5lQmxvY2tjaGFpbiIsImNoZWNrIiwiTW9uZXJvUHJ1bmVSZXN1bHQiLCJzZXRJc1BydW5lZCIsInBydW5lZCIsInNldFBydW5pbmdTZWVkIiwicHJ1bmluZ19zZWVkIiwiY2hlY2tGb3JVcGRhdGUiLCJjb21tYW5kIiwiY29udmVydFJwY1VwZGF0ZUNoZWNrUmVzdWx0IiwiZG93bmxvYWRVcGRhdGUiLCJwYXRoIiwiY29udmVydFJwY1VwZGF0ZURvd25sb2FkUmVzdWx0Iiwic3RvcCIsIndhaXRGb3JOZXh0QmxvY2tIZWFkZXIiLCJ0aGF0IiwiUHJvbWlzZSIsInJlc29sdmUiLCJvbkJsb2NrSGVhZGVyIiwiaGVhZGVyIiwiZ2V0UG9sbEludGVydmFsIiwicG9sbEludGVydmFsIiwiZ2V0VHgiLCJ0eEhhc2giLCJnZXRUeEhleCIsImdldEtleUltYWdlU3BlbnRTdGF0dXMiLCJrZXlJbWFnZSIsInNldFBlZXJCYW4iLCJzdWJtaXRCbG9jayIsImJsb2NrQmxvYiIsInBvbGxMaXN0ZW5lciIsIkRhZW1vblBvbGxlciIsInNldElzUG9sbGluZyIsImxpbWl0X2Rvd24iLCJsaW1pdF91cCIsImRvd25MaW1pdCIsInVwTGltaXQiLCJtYXhIZWlnaHQiLCJtYXhSZXFTaXplIiwicmVxU2l6ZSIsImdldEJsb2NrSGVhZGVyQnlIZWlnaHRDYWNoZWQiLCJnZXRTaXplIiwiY2FjaGVkSGVhZGVyIiwiTWF0aCIsIm1pbiIsImNvbm5lY3RUb0RhZW1vblJwYyIsInVyaU9yQ29uZmlnIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsIm5vcm1hbGl6ZUNvbmZpZyIsImNtZCIsInN0YXJ0TW9uZXJvZFByb2Nlc3MiLCJNb25lcm9EYWVtb25ScGNQcm94eSIsImNvbm5lY3QiLCJjaGlsZFByb2Nlc3MiLCJzcGF3biIsInNsaWNlIiwiZW52IiwiTEFORyIsInN0ZG91dCIsInNldEVuY29kaW5nIiwic3RkZXJyIiwidXJpIiwib3V0cHV0IiwicmVqZWN0Iiwib24iLCJkYXRhIiwibGluZSIsInRvU3RyaW5nIiwiTGlicmFyeVV0aWxzIiwibG9nIiwidXJpTGluZUNvbnRhaW5zIiwidXJpTGluZUNvbnRhaW5zSWR4Iiwic3Vic3RyaW5nIiwibGFzdEluZGV4T2YiLCJ1bmZvcm1hdHRlZExpbmUiLCJyZXBsYWNlIiwidHJpbSIsInBvcnQiLCJzc2xJZHgiLCJzc2xFbmFibGVkIiwidG9Mb3dlckNhc2UiLCJ1c2VyUGFzc0lkeCIsInVzZXJQYXNzIiwiY29weSIsInNldFNlcnZlciIsInJlamVjdFVuYXV0aG9yaXplZCIsImdldFJlamVjdFVuYXV0aG9yaXplZCIsInNldFByb3h5VG9Xb3JrZXIiLCJkYWVtb24iLCJpc1Jlc29sdmVkIiwiZ2V0TG9nTGV2ZWwiLCJjb25zb2xlIiwiZXJyb3IiLCJjb2RlIiwiRXJyb3IiLCJlcnIiLCJvcmlnaW4iLCJNb25lcm9EYWVtb25Db25maWciLCJzZXJ2ZXIiLCJNb25lcm9ScGNDb25uZWN0aW9uIiwiREVGQVVMVF9DT05GSUciLCJzdGF0dXMiLCJNb25lcm9CbG9ja0hlYWRlciIsImtleSIsIk9iamVjdCIsImtleXMiLCJ2YWwiLCJzYWZlU2V0Iiwic2V0U2l6ZSIsImdldERlcHRoIiwic2V0RGVwdGgiLCJzZXREaWZmaWN1bHR5IiwicmVjb25jaWxlIiwiZ2V0RGlmZmljdWx0eSIsInByZWZpeGVkSGV4VG9CSSIsInNldEN1bXVsYXRpdmVEaWZmaWN1bHR5IiwiZ2V0Q3VtdWxhdGl2ZURpZmZpY3VsdHkiLCJnZXRIYXNoIiwiZ2V0TWFqb3JWZXJzaW9uIiwic2V0TWFqb3JWZXJzaW9uIiwiZ2V0TWlub3JWZXJzaW9uIiwic2V0TWlub3JWZXJzaW9uIiwiZ2V0Tm9uY2UiLCJzZXROb25jZSIsImdldE51bVR4cyIsInNldE51bVR4cyIsImdldE9ycGhhblN0YXR1cyIsInNldE9ycGhhblN0YXR1cyIsImdldFByZXZIYXNoIiwic2V0UHJldkhhc2giLCJnZXRSZXdhcmQiLCJzZXRSZXdhcmQiLCJnZXRUaW1lc3RhbXAiLCJzZXRUaW1lc3RhbXAiLCJnZXRXZWlnaHQiLCJzZXRXZWlnaHQiLCJnZXRMb25nVGVybVdlaWdodCIsInNldExvbmdUZXJtV2VpZ2h0IiwiZ2V0UG93SGFzaCIsInNldFBvd0hhc2giLCJzZXRNaW5lclR4SGFzaCIsInJwY0Jsb2NrIiwiTW9uZXJvQmxvY2siLCJzZXRIZXgiLCJibG9iIiwic2V0VHhIYXNoZXMiLCJycGNNaW5lclR4IiwianNvbiIsIkpTT04iLCJwYXJzZSIsIm1pbmVyX3R4IiwibWluZXJUeCIsInNldE1pbmVyVHgiLCJnZXRMYXN0UmVsYXllZFRpbWVzdGFtcCIsInNldExhc3RSZWxheWVkVGltZXN0YW1wIiwiZ2V0UmVjZWl2ZWRUaW1lc3RhbXAiLCJzZXRSZWNlaXZlZFRpbWVzdGFtcCIsImdldE51bUNvbmZpcm1hdGlvbnMiLCJnZXRJc0NvbmZpcm1lZCIsImdldEluVHhQb29sIiwiZ2V0SXNEb3VibGVTcGVuZFNlZW4iLCJzZXRWZXJzaW9uIiwiZ2V0RXh0cmEiLCJzZXRFeHRyYSIsIlVpbnQ4QXJyYXkiLCJnZW4iLCJzZXRJbnB1dHMiLCJtYXAiLCJycGNWaW4iLCJjb252ZXJ0UnBjT3V0cHV0Iiwic2V0T3V0cHV0cyIsInJwY091dHB1dCIsImdldFJjdFNpZ25hdHVyZXMiLCJzZXRSY3RTaWduYXR1cmVzIiwidHhuRmVlIiwiZ2V0RmVlIiwiZ2V0UmN0U2lnUHJ1bmFibGUiLCJzZXRSY3RTaWdQcnVuYWJsZSIsImdldFVubG9ja1RpbWUiLCJzZXRVbmxvY2tUaW1lIiwic2V0RnVsbEhleCIsImdldElzUmVsYXllZCIsImdldE91dHB1dEluZGljZXMiLCJzZXRPdXRwdXRJbmRpY2VzIiwiZ2V0UmVsYXkiLCJnZXRJc0tlcHRCeUJsb2NrIiwic2V0SXNLZXB0QnlCbG9jayIsImdldFNpZ25hdHVyZXMiLCJzZXRTaWduYXR1cmVzIiwiZ2V0SXNGYWlsZWQiLCJnZXRMYXN0RmFpbGVkSGVpZ2h0Iiwic2V0TGFzdEZhaWxlZEhlaWdodCIsImdldExhc3RGYWlsZWRIYXNoIiwic2V0TGFzdEZhaWxlZEhhc2giLCJnZXRNYXhVc2VkQmxvY2tIZWlnaHQiLCJzZXRNYXhVc2VkQmxvY2tIZWlnaHQiLCJnZXRNYXhVc2VkQmxvY2tIYXNoIiwic2V0TWF4VXNlZEJsb2NrSGFzaCIsImdldFBydW5hYmxlSGFzaCIsInNldFBydW5hYmxlSGFzaCIsImdldFBydW5hYmxlSGV4Iiwic2V0UHJ1bmFibGVIZXgiLCJzZXRQcnVuZWRIZXgiLCJnZXRPdXRwdXRzIiwic2V0SW5kZXgiLCJhc19qc29uIiwidHhfanNvbiIsIk1vbmVyb091dHB1dCIsInNldFR4IiwiZ2V0QW1vdW50Iiwic2V0QW1vdW50IiwiYW1vdW50IiwiZ2V0S2V5SW1hZ2UiLCJzZXRLZXlJbWFnZSIsIk1vbmVyb0tleUltYWdlIiwia19pbWFnZSIsImdldFJpbmdPdXRwdXRJbmRpY2VzIiwic2V0UmluZ091dHB1dEluZGljZXMiLCJrZXlfb2Zmc2V0cyIsInB1YktleSIsInRhZ2dlZF9rZXkiLCJnZXRTdGVhbHRoUHVibGljS2V5Iiwic2V0U3RlYWx0aFB1YmxpY0tleSIsInJwY1RlbXBsYXRlIiwidGVtcGxhdGUiLCJNb25lcm9CbG9ja1RlbXBsYXRlIiwic2V0QmxvY2tUZW1wbGF0ZUJsb2IiLCJzZXRCbG9ja0hhc2hpbmdCbG9iIiwic2V0RXhwZWN0ZWRSZXdhcmQiLCJzZXRSZXNlcnZlZE9mZnNldCIsInNldFNlZWRIZWlnaHQiLCJzZXRTZWVkSGFzaCIsInNldE5leHRTZWVkSGFzaCIsImdldE5leHRTZWVkSGFzaCIsInJwY0luZm8iLCJpbmZvIiwiTW9uZXJvRGFlbW9uSW5mbyIsInNldE51bUFsdEJsb2NrcyIsInNldEJsb2NrU2l6ZUxpbWl0Iiwic2V0QmxvY2tTaXplTWVkaWFuIiwic2V0QmxvY2tXZWlnaHRMaW1pdCIsInNldEJsb2NrV2VpZ2h0TWVkaWFuIiwic2V0Qm9vdHN0cmFwRGFlbW9uQWRkcmVzcyIsInNldEZyZWVTcGFjZSIsInNldERhdGFiYXNlU2l6ZSIsInNldE51bU9mZmxpbmVQZWVycyIsInNldEhlaWdodFdpdGhvdXRCb290c3RyYXAiLCJzZXROdW1JbmNvbWluZ0Nvbm5lY3Rpb25zIiwic2V0SXNPZmZsaW5lIiwic2V0TnVtT3V0Z29pbmdDb25uZWN0aW9ucyIsInNldE51bVJwY0Nvbm5lY3Rpb25zIiwic2V0U3RhcnRUaW1lc3RhbXAiLCJzZXRBZGp1c3RlZFRpbWVzdGFtcCIsInNldFRhcmdldCIsInNldFRhcmdldEhlaWdodCIsInNldFRvcEJsb2NrSGFzaCIsInNldE51bVR4c1Bvb2wiLCJzZXRXYXNCb290c3RyYXBFdmVyVXNlZCIsInNldE51bU9ubGluZVBlZXJzIiwic2V0VXBkYXRlQXZhaWxhYmxlIiwiZ2V0TmV0d29ya1R5cGUiLCJzZXROZXR3b3JrVHlwZSIsIk1vbmVyb05ldHdvcmtUeXBlIiwiTUFJTk5FVCIsIlRFU1RORVQiLCJTVEFHRU5FVCIsInNldENyZWRpdHMiLCJnZXRUb3BCbG9ja0hhc2giLCJzZXRJc0J1c3lTeW5jaW5nIiwic2V0SXNTeW5jaHJvbml6ZWQiLCJzZXRJc1Jlc3RyaWN0ZWQiLCJycGNTeW5jSW5mbyIsInN5bmNJbmZvIiwiTW9uZXJvRGFlbW9uU3luY0luZm8iLCJzZXRQZWVycyIsInJwY0Nvbm5lY3Rpb25zIiwic2V0U3BhbnMiLCJycGNTcGFucyIsInJwY1NwYW4iLCJnZXRTcGFucyIsImNvbnZlcnRScGNDb25uZWN0aW9uU3BhbiIsInNldE5leHROZWVkZWRQcnVuaW5nU2VlZCIsIm92ZXJ2aWV3IiwicnBjSGFyZEZvcmtJbmZvIiwiTW9uZXJvSGFyZEZvcmtJbmZvIiwic2V0RWFybGllc3RIZWlnaHQiLCJzZXRJc0VuYWJsZWQiLCJzZXRTdGF0ZSIsInNldFRocmVzaG9sZCIsInNldE51bVZvdGVzIiwic2V0Vm90aW5nIiwic2V0V2luZG93IiwicnBjQ29ubmVjdGlvblNwYW4iLCJzcGFuIiwiTW9uZXJvQ29ubmVjdGlvblNwYW4iLCJzZXRDb25uZWN0aW9uSWQiLCJzZXROdW1CbG9ja3MiLCJzZXRSYXRlIiwic2V0UmVtb3RlQWRkcmVzcyIsInNldFNwZWVkIiwic2V0U3RhcnRIZWlnaHQiLCJlbnRyeSIsIk1vbmVyb091dHB1dEhpc3RvZ3JhbUVudHJ5Iiwic2V0TnVtSW5zdGFuY2VzIiwic2V0TnVtVW5sb2NrZWRJbnN0YW5jZXMiLCJzZXROdW1SZWNlbnRJbnN0YW5jZXMiLCJycGNSZXN1bHQiLCJNb25lcm9TdWJtaXRUeFJlc3VsdCIsInNldElzRmVlVG9vTG93Iiwic2V0SGFzSW52YWxpZElucHV0Iiwic2V0SGFzSW52YWxpZE91dHB1dCIsInNldEhhc1Rvb0Zld091dHB1dHMiLCJzZXRJc01peGluVG9vTG93Iiwic2V0SXNPdmVyc3BlbmQiLCJzZXRSZWFzb24iLCJzZXRJc1Rvb0JpZyIsInNldFNhbml0eUNoZWNrRmFpbGVkIiwic2V0SXNUeEV4dHJhVG9vQmlnIiwic2V0SXNOb256ZXJvVW5sb2NrVGltZSIsInJwY1N0YXRzIiwic3RhdHMiLCJNb25lcm9UeFBvb2xTdGF0cyIsInNldEJ5dGVzTWF4Iiwic2V0Qnl0ZXNNZWQiLCJzZXRCeXRlc01pbiIsInNldEJ5dGVzVG90YWwiLCJzZXRIaXN0bzk4cGMiLCJzZXROdW0xMG0iLCJzZXROdW1Eb3VibGVTcGVuZHMiLCJzZXROdW1GYWlsaW5nIiwic2V0TnVtTm90UmVsYXllZCIsInNldE9sZGVzdFRpbWVzdGFtcCIsInNldEZlZVRvdGFsIiwic2V0SGlzdG8iLCJNYXAiLCJlbGVtIiwiZ2V0SGlzdG8iLCJzZXQiLCJieXRlcyIsImdldEhpc3RvOThwYyIsImNoYWluIiwiTW9uZXJvQWx0Q2hhaW4iLCJzZXRMZW5ndGgiLCJzZXRCbG9ja0hhc2hlcyIsInNldE1haW5DaGFpblBhcmVudEJsb2NrSGFzaCIsIk1vbmVyb1BlZXIiLCJzZXRJZCIsInNldExhc3RTZWVuVGltZXN0YW1wIiwic2V0UG9ydCIsInNldFJwY1BvcnQiLCJzZXRScGNDcmVkaXRzUGVySGFzaCIsInNldEFkZHJlc3MiLCJzZXRBdmdEb3dubG9hZCIsInNldEF2Z1VwbG9hZCIsInNldEN1cnJlbnREb3dubG9hZCIsInNldEN1cnJlbnRVcGxvYWQiLCJzZXRJc0luY29taW5nIiwic2V0TGl2ZVRpbWUiLCJzZXRJc0xvY2FsSXAiLCJzZXRJc0xvY2FsSG9zdCIsInBhcnNlSW50Iiwic2V0TnVtUmVjZWl2ZXMiLCJzZXRSZWNlaXZlSWRsZVRpbWUiLCJzZXROdW1TZW5kcyIsInNldFNlbmRJZGxlVGltZSIsInNldE51bVN1cHBvcnRGbGFncyIsInNldFR5cGUiLCJnZXRIb3N0IiwiZ2V0SXAiLCJnZXRJc0Jhbm5lZCIsImdldFNlY29uZHMiLCJycGNTdGF0dXMiLCJNb25lcm9NaW5pbmdTdGF0dXMiLCJzZXRJc0FjdGl2ZSIsImFjdGl2ZSIsInNwZWVkIiwic2V0TnVtVGhyZWFkcyIsInNldElzQmFja2dyb3VuZCIsImlzX2JhY2tncm91bmRfbWluaW5nX2VuYWJsZWQiLCJNb25lcm9EYWVtb25VcGRhdGVDaGVja1Jlc3VsdCIsInNldEF1dG9VcmkiLCJzZXRJc1VwZGF0ZUF2YWlsYWJsZSIsInNldFVzZXJVcmkiLCJnZXRBdXRvVXJpIiwiZ2V0VXNlclVyaSIsIk1vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0Iiwic2V0RG93bmxvYWRQYXRoIiwiZ2V0RG93bmxvYWRQYXRoIiwiaGV4IiwiZGFlbW9uSWQiLCJ3b3JrZXIiLCJ3cmFwcGVkTGlzdGVuZXJzIiwiZ2V0VVVJRCIsImFzc2lnbiIsInRvSnNvbiIsImludm9rZVdvcmtlciIsImdldFdvcmtlciIsIndyYXBwZWRMaXN0ZW5lciIsIkRhZW1vbldvcmtlckxpc3RlbmVyIiwibGlzdGVuZXJJZCIsImdldElkIiwiYWRkV29ya2VyQ2FsbGJhY2siLCJnZXRMaXN0ZW5lciIsInJlbW92ZVdvcmtlckNhbGxiYWNrIiwidmVyc2lvbkpzb24iLCJudW1iZXIiLCJpc1JlbGVhc2UiLCJmcm9tIiwiYXJndW1lbnRzIiwiYmxvY2tIZWFkZXJzSnNvbiIsImJsb2NrSGVhZGVySnNvbiIsIkRlc2VyaWFsaXphdGlvblR5cGUiLCJUWCIsImdldEJsb2Nrc0J5SGFzaCIsImJsb2NrSGFzaGVzIiwiYmxvY2tzSnNvbiIsImJsb2NrSnNvbiIsImdldEJsb2NrSGFzaGVzIiwiZ2V0VHhQb29sQmFja2xvZyIsIm91dHB1dHMiLCJlbnRyeUpzb24iLCJhbHRDaGFpbnMiLCJhbHRDaGFpbkpzb24iLCJwZWVySnNvbiIsImJhbkpzb24iLCJiYW5zSnNvbiIsImZuTmFtZSIsImFyZ3MiLCJsb29wZXIiLCJUYXNrTG9vcGVyIiwicG9sbCIsImlzUG9sbGluZyIsInN0YXJ0IiwibGFzdEhlYWRlciIsImFubm91bmNlQmxvY2tIZWFkZXIiLCJpZCIsImhlYWRlckpzb24iLCJfZGVmYXVsdCIsImV4cG9ydHMiLCJkZWZhdWx0Il0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvZGFlbW9uL01vbmVyb0RhZW1vblJwYy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXNzZXJ0IGZyb20gXCJhc3NlcnRcIjtcbmltcG9ydCBHZW5VdGlscyBmcm9tIFwiLi4vY29tbW9uL0dlblV0aWxzXCI7XG5pbXBvcnQgTGlicmFyeVV0aWxzIGZyb20gXCIuLi9jb21tb24vTGlicmFyeVV0aWxzXCI7XG5pbXBvcnQgVGFza0xvb3BlciBmcm9tIFwiLi4vY29tbW9uL1Rhc2tMb29wZXJcIjtcbmltcG9ydCBNb25lcm9BbHRDaGFpbiBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BbHRDaGFpblwiO1xuaW1wb3J0IE1vbmVyb0JhbiBmcm9tIFwiLi9tb2RlbC9Nb25lcm9CYW5cIjtcbmltcG9ydCBNb25lcm9CbG9jayBmcm9tIFwiLi9tb2RlbC9Nb25lcm9CbG9ja1wiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrSGVhZGVyIGZyb20gXCIuL21vZGVsL01vbmVyb0Jsb2NrSGVhZGVyXCI7XG5pbXBvcnQgTW9uZXJvQmxvY2tUZW1wbGF0ZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9CbG9ja1RlbXBsYXRlXCI7XG5pbXBvcnQgTW9uZXJvQ29ubmVjdGlvblNwYW4gZnJvbSBcIi4vbW9kZWwvTW9uZXJvQ29ubmVjdGlvblNwYW5cIjtcbmltcG9ydCBNb25lcm9EYWVtb24gZnJvbSBcIi4vTW9uZXJvRGFlbW9uXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uQ29uZmlnIGZyb20gXCIuL21vZGVsL01vbmVyb0RhZW1vbkNvbmZpZ1wiO1xuaW1wb3J0IE1vbmVyb0RhZW1vbkluZm8gZnJvbSBcIi4vbW9kZWwvTW9uZXJvRGFlbW9uSW5mb1wiO1xuaW1wb3J0IE1vbmVyb0RhZW1vbkxpc3RlbmVyIGZyb20gXCIuL21vZGVsL01vbmVyb0RhZW1vbkxpc3RlbmVyXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uU3luY0luZm8gZnJvbSBcIi4vbW9kZWwvTW9uZXJvRGFlbW9uU3luY0luZm9cIjtcbmltcG9ydCBNb25lcm9EYWVtb25VcGRhdGVDaGVja1Jlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9EYWVtb25VcGRhdGVDaGVja1Jlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvRmVlRXN0aW1hdGUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvRmVlRXN0aW1hdGVcIjtcbmltcG9ydCBNb25lcm9FcnJvciBmcm9tIFwiLi4vY29tbW9uL01vbmVyb0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvSGFyZEZvcmtJbmZvIGZyb20gXCIuL21vZGVsL01vbmVyb0hhcmRGb3JrSW5mb1wiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlIGZyb20gXCIuL21vZGVsL01vbmVyb0tleUltYWdlXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2VTcGVudFN0YXR1cyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzXCI7XG5pbXBvcnQgTW9uZXJvTWluZXJUeFN1bSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NaW5lclR4U3VtXCI7XG5pbXBvcnQgTW9uZXJvTWluaW5nU3RhdHVzIGZyb20gXCIuL21vZGVsL01vbmVyb01pbmluZ1N0YXR1c1wiO1xuaW1wb3J0IE1vbmVyb05ldHdvcmtUeXBlIGZyb20gXCIuL21vZGVsL01vbmVyb05ldHdvcmtUeXBlXCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0IGZyb20gXCIuL21vZGVsL01vbmVyb091dHB1dFwiO1xuaW1wb3J0IE1vbmVyb091dHB1dEhpc3RvZ3JhbUVudHJ5IGZyb20gXCIuL21vZGVsL01vbmVyb091dHB1dEhpc3RvZ3JhbUVudHJ5XCI7XG5pbXBvcnQgTW9uZXJvUGVlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9QZWVyXCI7XG5pbXBvcnQgTW9uZXJvUHJ1bmVSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvUHJ1bmVSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9ScGNDb25uZWN0aW9uIGZyb20gXCIuLi9jb21tb24vTW9uZXJvUnBjQ29ubmVjdGlvblwiO1xuaW1wb3J0IE1vbmVyb1N1Ym1pdFR4UmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb1N1Ym1pdFR4UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvVHggZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhcIjtcbmltcG9ydCBNb25lcm9UeFBvb2xTdGF0cyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFBvb2xTdGF0c1wiO1xuaW1wb3J0IE1vbmVyb1V0aWxzIGZyb20gXCIuLi9jb21tb24vTW9uZXJvVXRpbHNcIjtcbmltcG9ydCBNb25lcm9WZXJzaW9uIGZyb20gXCIuL21vZGVsL01vbmVyb1ZlcnNpb25cIjtcbmltcG9ydCB7IENoaWxkUHJvY2VzcyB9IGZyb20gXCJjaGlsZF9wcm9jZXNzXCI7XG5cbi8qKlxuICogQ29weXJpZ2h0IChjKSB3b29kc2VyXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxuICogY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG4gKiBTT0ZUV0FSRS5cbiAqL1xuXG4vKipcbiAqIEltcGxlbWVudHMgYSBNb25lcm9EYWVtb24gYXMgYSBjbGllbnQgb2YgbW9uZXJvZC5cbiAqL1xuY2xhc3MgTW9uZXJvRGFlbW9uUnBjIGV4dGVuZHMgTW9uZXJvRGFlbW9uIHtcblxuICAvLyBzdGF0aWMgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBzdGF0aWMgcmVhZG9ubHkgTUFYX1JFUV9TSVpFID0gXCIzMDAwMDAwXCI7XG4gIHByb3RlY3RlZCBzdGF0aWMgcmVhZG9ubHkgREVGQVVMVF9JRCA9IFwiMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMFwiOyAvLyB1bmluaXRpYWxpemVkIHR4IG9yIGJsb2NrIGhhc2ggZnJvbSBkYWVtb24gcnBjXG4gIHByb3RlY3RlZCBzdGF0aWMgcmVhZG9ubHkgTlVNX0hFQURFUlNfUEVSX1JFUSA9IDc1MDsgLy8gbnVtYmVyIG9mIGhlYWRlcnMgdG8gZmV0Y2ggYW5kIGNhY2hlIHBlciByZXF1ZXN0XG4gIHByb3RlY3RlZCBzdGF0aWMgcmVhZG9ubHkgREVGQVVMVF9QT0xMX1BFUklPRCA9IDIwMDAwOyAvLyBkZWZhdWx0IGludGVydmFsIGJldHdlZW4gcG9sbGluZyB0aGUgZGFlbW9uIGluIG1zXG5cbiAgLy8gaW5zdGFuY2UgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBjb25maWc6IFBhcnRpYWw8TW9uZXJvRGFlbW9uQ29uZmlnPjtcbiAgcHJvdGVjdGVkIGxpc3RlbmVyczogTW9uZXJvRGFlbW9uTGlzdGVuZXJbXTtcbiAgcHJvdGVjdGVkIGNhY2hlZEhlYWRlcnM6IGFueTtcbiAgcHJvdGVjdGVkIHByb2Nlc3M6IGFueTtcbiAgcHJvdGVjdGVkIHBvbGxMaXN0ZW5lcjogYW55O1xuICBwcm90ZWN0ZWQgcHJveHlEYWVtb246IGFueTtcbiBcbiAgLyoqIEBwcml2YXRlICovXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogTW9uZXJvRGFlbW9uQ29uZmlnLCBwcm94eURhZW1vbjogTW9uZXJvRGFlbW9uUnBjUHJveHkpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMucHJveHlEYWVtb24gPSBwcm94eURhZW1vbjtcbiAgICBpZiAoY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybjtcbiAgICB0aGlzLmxpc3RlbmVycyA9IFtdOyAgICAgIC8vIGJsb2NrIGxpc3RlbmVyc1xuICAgIHRoaXMuY2FjaGVkSGVhZGVycyA9IHt9OyAgLy8gY2FjaGVkIGhlYWRlcnMgZm9yIGZldGNoaW5nIGJsb2NrcyBpbiBib3VuZCBjaHVua3NcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgaW50ZXJuYWwgcHJvY2VzcyBydW5uaW5nIG1vbmVyb2QuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtDaGlsZFByb2Nlc3N9IHRoZSBub2RlIHByb2Nlc3MgcnVubmluZyBtb25lcm9kLCB1bmRlZmluZWQgaWYgbm90IGNyZWF0ZWQgZnJvbSBuZXcgcHJvY2Vzc1xuICAgKi9cbiAgZ2V0UHJvY2VzcygpOiBDaGlsZFByb2Nlc3Mge1xuICAgIHJldHVybiB0aGlzLnByb2Nlc3M7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTdG9wIHRoZSBpbnRlcm5hbCBwcm9jZXNzIHJ1bm5pbmcgbW9uZXJvZCwgaWYgYXBwbGljYWJsZS5cbiAgICogXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2ZvcmNlXSBzcGVjaWZpZXMgaWYgdGhlIHByb2Nlc3Mgc2hvdWxkIGJlIGRlc3Ryb3llZCBmb3JjaWJseSAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxudW1iZXIgfCB1bmRlZmluZWQ+fSB0aGUgZXhpdCBjb2RlIGZyb20gc3RvcHBpbmcgdGhlIHByb2Nlc3NcbiAgICovXG4gIGFzeW5jIHN0b3BQcm9jZXNzKGZvcmNlID0gZmFsc2UpOiBQcm9taXNlPG51bWJlciB8IHVuZGVmaW5lZD4ge1xuICAgIGlmICh0aGlzLnByb2Nlc3MgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTW9uZXJvRGFlbW9uUnBjIGluc3RhbmNlIG5vdCBjcmVhdGVkIGZyb20gbmV3IHByb2Nlc3NcIik7XG4gICAgbGV0IGxpc3RlbmVyc0NvcHkgPSBHZW5VdGlscy5jb3B5QXJyYXkoYXdhaXQgdGhpcy5nZXRMaXN0ZW5lcnMoKSk7XG4gICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgbGlzdGVuZXJzQ29weSkgYXdhaXQgdGhpcy5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgcmV0dXJuIEdlblV0aWxzLmtpbGxQcm9jZXNzKHRoaXMucHJvY2VzcywgZm9yY2UgPyBcIlNJR0tJTExcIiA6IHVuZGVmaW5lZCk7XG4gIH1cbiAgXG4gIGFzeW5jIGFkZExpc3RlbmVyKGxpc3RlbmVyOiBNb25lcm9EYWVtb25MaXN0ZW5lcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgYXNzZXJ0KGxpc3RlbmVyIGluc3RhbmNlb2YgTW9uZXJvRGFlbW9uTGlzdGVuZXIsIFwiTGlzdGVuZXIgbXVzdCBiZSBpbnN0YW5jZSBvZiBNb25lcm9EYWVtb25MaXN0ZW5lclwiKTtcbiAgICB0aGlzLmxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcbiAgICB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXI6IE1vbmVyb0RhZW1vbkxpc3RlbmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBhc3NlcnQobGlzdGVuZXIgaW5zdGFuY2VvZiBNb25lcm9EYWVtb25MaXN0ZW5lciwgXCJMaXN0ZW5lciBtdXN0IGJlIGluc3RhbmNlIG9mIE1vbmVyb0RhZW1vbkxpc3RlbmVyXCIpO1xuICAgIGxldCBpZHggPSB0aGlzLmxpc3RlbmVycy5pbmRleE9mKGxpc3RlbmVyKTtcbiAgICBpZiAoaWR4ID4gLTEpIHRoaXMubGlzdGVuZXJzLnNwbGljZShpZHgsIDEpO1xuICAgIGVsc2UgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTGlzdGVuZXIgaXMgbm90IHJlZ2lzdGVyZWQgd2l0aCBkYWVtb25cIik7XG4gICAgdGhpcy5yZWZyZXNoTGlzdGVuaW5nKCk7XG4gIH1cbiAgXG4gIGdldExpc3RlbmVycygpOiBNb25lcm9EYWVtb25MaXN0ZW5lcltdIHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0TGlzdGVuZXJzKCk7XG4gICAgcmV0dXJuIHRoaXMubGlzdGVuZXJzO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBkYWVtb24ncyBSUEMgY29ubmVjdGlvbi5cbiAgICogXG4gICAqIEByZXR1cm4ge01vbmVyb1JwY0Nvbm5lY3Rpb259IHRoZSBkYWVtb24ncyBycGMgY29ubmVjdGlvblxuICAgKi9cbiAgYXN5bmMgZ2V0UnBjQ29ubmVjdGlvbigpIHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0UnBjQ29ubmVjdGlvbigpO1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNDb25uZWN0ZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmlzQ29ubmVjdGVkKCk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuZ2V0VmVyc2lvbigpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRWZXJzaW9uKCk6IFByb21pc2U8TW9uZXJvVmVyc2lvbj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRWZXJzaW9uKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfdmVyc2lvblwiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9WZXJzaW9uKHJlc3AucmVzdWx0LnZlcnNpb24sIHJlc3AucmVzdWx0LnJlbGVhc2UpO1xuICB9XG4gIFxuICBhc3luYyBpc1RydXN0ZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmlzVHJ1c3RlZCgpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwiZ2V0X2hlaWdodFwiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICByZXR1cm4gIXJlc3AudW50cnVzdGVkO1xuICB9XG4gIFxuICBhc3luYyBnZXRIZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0SGVpZ2h0KCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmxvY2tfY291bnRcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5jb3VudDtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tIYXNoKGhlaWdodDogbnVtYmVyKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tIYXNoKGhlaWdodCk7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJvbl9nZXRfYmxvY2tfaGFzaFwiLCBbaGVpZ2h0XSkpLnJlc3VsdDsgIC8vIFRPRE8gbW9uZXJvLXdhbGxldC1ycGM6IG5vIHN0YXR1cyByZXR1cm5lZFxuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja1RlbXBsYXRlKHdhbGxldEFkZHJlc3M6IHN0cmluZywgcmVzZXJ2ZVNpemU/OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb0Jsb2NrVGVtcGxhdGU+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tUZW1wbGF0ZSh3YWxsZXRBZGRyZXNzLCByZXNlcnZlU2l6ZSk7XG4gICAgYXNzZXJ0KHdhbGxldEFkZHJlc3MgJiYgdHlwZW9mIHdhbGxldEFkZHJlc3MgPT09IFwic3RyaW5nXCIsIFwiTXVzdCBzcGVjaWZ5IHdhbGxldCBhZGRyZXNzIHRvIGJlIG1pbmVkIHRvXCIpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2Jsb2NrX3RlbXBsYXRlXCIsIHt3YWxsZXRfYWRkcmVzczogd2FsbGV0QWRkcmVzcywgcmVzZXJ2ZV9zaXplOiByZXNlcnZlU2l6ZX0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNCbG9ja1RlbXBsYXRlKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TGFzdEJsb2NrSGVhZGVyKCk6IFByb21pc2U8TW9uZXJvQmxvY2tIZWFkZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0TGFzdEJsb2NrSGVhZGVyKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfbGFzdF9ibG9ja19oZWFkZXJcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Jsb2NrSGVhZGVyKHJlc3AucmVzdWx0LmJsb2NrX2hlYWRlcik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrSGVhZGVyQnlIYXNoKGJsb2NrSGFzaDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9CbG9ja0hlYWRlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRCbG9ja0hlYWRlckJ5SGFzaChibG9ja0hhc2gpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2Jsb2NrX2hlYWRlcl9ieV9oYXNoXCIsIHtoYXNoOiBibG9ja0hhc2h9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQmxvY2tIZWFkZXIocmVzcC5yZXN1bHQuYmxvY2tfaGVhZGVyKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tIZWFkZXJCeUhlaWdodChoZWlnaHQ6IG51bWJlcik6IFByb21pc2U8TW9uZXJvQmxvY2tIZWFkZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tIZWFkZXJCeUhlaWdodChoZWlnaHQpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2Jsb2NrX2hlYWRlcl9ieV9oZWlnaHRcIiwge2hlaWdodDogaGVpZ2h0fSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Jsb2NrSGVhZGVyKHJlc3AucmVzdWx0LmJsb2NrX2hlYWRlcik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrSGVhZGVyc0J5UmFuZ2Uoc3RhcnRIZWlnaHQ/OiBudW1iZXIsIGVuZEhlaWdodD86IG51bWJlcik6IFByb21pc2U8TW9uZXJvQmxvY2tIZWFkZXJbXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRCbG9ja0hlYWRlcnNCeVJhbmdlKHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpO1xuICAgIFxuICAgIC8vIGZldGNoIGJsb2NrIGhlYWRlcnNcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9ibG9ja19oZWFkZXJzX3JhbmdlXCIsIHtcbiAgICAgIHN0YXJ0X2hlaWdodDogc3RhcnRIZWlnaHQsXG4gICAgICBlbmRfaGVpZ2h0OiBlbmRIZWlnaHRcbiAgICB9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgXG4gICAgLy8gYnVpbGQgaGVhZGVyc1xuICAgIGxldCBoZWFkZXJzID0gW107XG4gICAgZm9yIChsZXQgcnBjSGVhZGVyIG9mIHJlc3AucmVzdWx0LmhlYWRlcnMpIHtcbiAgICAgIGhlYWRlcnMucHVzaChNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Jsb2NrSGVhZGVyKHJwY0hlYWRlcikpO1xuICAgIH1cbiAgICByZXR1cm4gaGVhZGVycztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tCeUhhc2goYmxvY2tIYXNoOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0Jsb2NrPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2NrQnlIYXNoKGJsb2NrSGFzaCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmxvY2tcIiwge2hhc2g6IGJsb2NrSGFzaH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNCbG9jayhyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrQnlIZWlnaHQoaGVpZ2h0OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb0Jsb2NrPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2NrQnlIZWlnaHQoaGVpZ2h0KTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9ibG9ja1wiLCB7aGVpZ2h0OiBoZWlnaHR9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQmxvY2socmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja3NCeUhlaWdodChoZWlnaHRzOiBudW1iZXJbXSk6IFByb21pc2U8TW9uZXJvQmxvY2tbXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRCbG9ja3NCeUhlaWdodChoZWlnaHRzKTtcbiAgICBcbiAgICAvLyBmZXRjaCBibG9ja3MgaW4gYmluYXJ5XG4gICAgbGV0IHJlc3BCaW4gPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kQmluYXJ5UmVxdWVzdChcImdldF9ibG9ja3NfYnlfaGVpZ2h0LmJpblwiLCB7aGVpZ2h0czogaGVpZ2h0c30pO1xuICAgIFxuICAgIC8vIGNvbnZlcnQgYmluYXJ5IGJsb2NrcyB0byBqc29uXG4gICAgbGV0IHJwY0Jsb2NrcyA9IGF3YWl0IE1vbmVyb1V0aWxzLmJpbmFyeUJsb2Nrc1RvSnNvbihyZXNwQmluKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhycGNCbG9ja3MpO1xuICAgIFxuICAgIC8vIGJ1aWxkIGJsb2NrcyB3aXRoIHRyYW5zYWN0aW9uc1xuICAgIGFzc2VydC5lcXVhbChycGNCbG9ja3MudHhzLmxlbmd0aCwgcnBjQmxvY2tzLmJsb2Nrcy5sZW5ndGgpOyAgICBcbiAgICBsZXQgYmxvY2tzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2tJZHggPSAwOyBibG9ja0lkeCA8IHJwY0Jsb2Nrcy5ibG9ja3MubGVuZ3RoOyBibG9ja0lkeCsrKSB7XG4gICAgICBcbiAgICAgIC8vIGJ1aWxkIGJsb2NrXG4gICAgICBsZXQgYmxvY2sgPSBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Jsb2NrKHJwY0Jsb2Nrcy5ibG9ja3NbYmxvY2tJZHhdKTtcbiAgICAgIGJsb2NrLnNldEhlaWdodChoZWlnaHRzW2Jsb2NrSWR4XSk7XG4gICAgICBibG9ja3MucHVzaChibG9jayk7XG4gICAgICBcbiAgICAgIC8vIGJ1aWxkIHRyYW5zYWN0aW9uc1xuICAgICAgbGV0IHR4cyA9IFtdO1xuICAgICAgZm9yIChsZXQgdHhJZHggPSAwOyB0eElkeCA8IHJwY0Jsb2Nrcy50eHNbYmxvY2tJZHhdLmxlbmd0aDsgdHhJZHgrKykge1xuICAgICAgICBsZXQgdHggPSBuZXcgTW9uZXJvVHgoKTtcbiAgICAgICAgdHhzLnB1c2godHgpO1xuICAgICAgICB0eC5zZXRIYXNoKHJwY0Jsb2Nrcy5ibG9ja3NbYmxvY2tJZHhdLnR4X2hhc2hlc1t0eElkeF0pO1xuICAgICAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICAgICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgICAgdHguc2V0SXNSZWxheWVkKHRydWUpO1xuICAgICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgICAgIHR4LnNldElzRG91YmxlU3BlbmRTZWVuKGZhbHNlKTtcbiAgICAgICAgTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNUeChycGNCbG9ja3MudHhzW2Jsb2NrSWR4XVt0eElkeF0sIHR4KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gbWVyZ2UgaW50byBvbmUgYmxvY2tcbiAgICAgIGJsb2NrLnNldFR4cyhbXSk7XG4gICAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgICAgaWYgKHR4LmdldEJsb2NrKCkpIGJsb2NrLm1lcmdlKHR4LmdldEJsb2NrKCkpO1xuICAgICAgICBlbHNlIGJsb2NrLmdldFR4cygpLnB1c2godHguc2V0QmxvY2soYmxvY2spKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGJsb2NrcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tzQnlSYW5nZShzdGFydEhlaWdodD86IG51bWJlciwgZW5kSGVpZ2h0PzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9CbG9ja1tdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2Nrc0J5UmFuZ2Uoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCk7XG4gICAgaWYgKHN0YXJ0SGVpZ2h0ID09PSB1bmRlZmluZWQpIHN0YXJ0SGVpZ2h0ID0gMDtcbiAgICBpZiAoZW5kSGVpZ2h0ID09PSB1bmRlZmluZWQpIGVuZEhlaWdodCA9IGF3YWl0IHRoaXMuZ2V0SGVpZ2h0KCkgLSAxO1xuICAgIGxldCBoZWlnaHRzID0gW107XG4gICAgZm9yIChsZXQgaGVpZ2h0ID0gc3RhcnRIZWlnaHQ7IGhlaWdodCA8PSBlbmRIZWlnaHQ7IGhlaWdodCsrKSBoZWlnaHRzLnB1c2goaGVpZ2h0KTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5nZXRCbG9ja3NCeUhlaWdodChoZWlnaHRzKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tzQnlSYW5nZUNodW5rZWQoc3RhcnRIZWlnaHQ/OiBudW1iZXIsIGVuZEhlaWdodD86IG51bWJlciwgbWF4Q2h1bmtTaXplPzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9CbG9ja1tdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2Nrc0J5UmFuZ2VDaHVua2VkKHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIG1heENodW5rU2l6ZSk7XG4gICAgaWYgKHN0YXJ0SGVpZ2h0ID09PSB1bmRlZmluZWQpIHN0YXJ0SGVpZ2h0ID0gMDtcbiAgICBpZiAoZW5kSGVpZ2h0ID09PSB1bmRlZmluZWQpIGVuZEhlaWdodCA9IGF3YWl0IHRoaXMuZ2V0SGVpZ2h0KCkgLSAxO1xuICAgIGxldCBsYXN0SGVpZ2h0ID0gc3RhcnRIZWlnaHQgLSAxO1xuICAgIGxldCBibG9ja3MgPSBbXTtcbiAgICB3aGlsZSAobGFzdEhlaWdodCA8IGVuZEhlaWdodCkge1xuICAgICAgZm9yIChsZXQgYmxvY2sgb2YgYXdhaXQgdGhpcy5nZXRNYXhCbG9ja3MobGFzdEhlaWdodCArIDEsIGVuZEhlaWdodCwgbWF4Q2h1bmtTaXplKSkge1xuICAgICAgICBibG9ja3MucHVzaChibG9jayk7XG4gICAgICB9XG4gICAgICBsYXN0SGVpZ2h0ID0gYmxvY2tzW2Jsb2Nrcy5sZW5ndGggLSAxXS5nZXRIZWlnaHQoKTtcbiAgICB9XG4gICAgcmV0dXJuIGJsb2NrcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhzKHR4SGFzaGVzOiBzdHJpbmdbXSwgcHJ1bmUgPSBmYWxzZSk6IFByb21pc2U8TW9uZXJvVHhbXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRUeHModHhIYXNoZXMsIHBydW5lKTtcbiAgICAgICAgXG4gICAgLy8gdmFsaWRhdGUgaW5wdXRcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheSh0eEhhc2hlcykgJiYgdHhIYXNoZXMubGVuZ3RoID4gMCwgXCJNdXN0IHByb3ZpZGUgYW4gYXJyYXkgb2YgdHJhbnNhY3Rpb24gaGFzaGVzXCIpO1xuICAgIGFzc2VydChwcnVuZSA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiBwcnVuZSA9PT0gXCJib29sZWFuXCIsIFwiUHJ1bmUgbXVzdCBiZSBhIGJvb2xlYW4gb3IgdW5kZWZpbmVkXCIpO1xuICAgICAgICBcbiAgICAvLyBmZXRjaCB0cmFuc2FjdGlvbnNcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImdldF90cmFuc2FjdGlvbnNcIiwge1xuICAgICAgdHhzX2hhc2hlczogdHhIYXNoZXMsXG4gICAgICBkZWNvZGVfYXNfanNvbjogdHJ1ZSxcbiAgICAgIHBydW5lOiBwcnVuZVxuICAgIH0pO1xuICAgIHRyeSB7XG4gICAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlLm1lc3NhZ2UuaW5kZXhPZihcIkZhaWxlZCB0byBwYXJzZSBoZXggcmVwcmVzZW50YXRpb24gb2YgdHJhbnNhY3Rpb24gaGFzaFwiKSA+PSAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJJbnZhbGlkIHRyYW5zYWN0aW9uIGhhc2hcIik7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgICAgICAgXG4gICAgLy8gYnVpbGQgdHJhbnNhY3Rpb24gbW9kZWxzXG4gICAgbGV0IHR4cyA9IFtdO1xuICAgIGlmIChyZXNwLnR4cykge1xuICAgICAgZm9yIChsZXQgdHhJZHggPSAwOyB0eElkeCA8IHJlc3AudHhzLmxlbmd0aDsgdHhJZHgrKykge1xuICAgICAgICBsZXQgdHggPSBuZXcgTW9uZXJvVHgoKTtcbiAgICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICAgICAgdHhzLnB1c2goTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNUeChyZXNwLnR4c1t0eElkeF0sIHR4KSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0eHM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4SGV4ZXModHhIYXNoZXM6IHN0cmluZ1tdLCBwcnVuZSA9IGZhbHNlKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRUeEhleGVzKHR4SGFzaGVzLCBwcnVuZSk7XG4gICAgbGV0IGhleGVzID0gW107XG4gICAgZm9yIChsZXQgdHggb2YgYXdhaXQgdGhpcy5nZXRUeHModHhIYXNoZXMsIHBydW5lKSkgaGV4ZXMucHVzaChwcnVuZSA/IHR4LmdldFBydW5lZEhleCgpIDogdHguZ2V0RnVsbEhleCgpKTtcbiAgICByZXR1cm4gaGV4ZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE1pbmVyVHhTdW0oaGVpZ2h0OiBudW1iZXIsIG51bUJsb2NrczogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9NaW5lclR4U3VtPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldE1pbmVyVHhTdW0oaGVpZ2h0LCBudW1CbG9ja3MpO1xuICAgIGlmIChoZWlnaHQgPT09IHVuZGVmaW5lZCkgaGVpZ2h0ID0gMDtcbiAgICBlbHNlIGFzc2VydChoZWlnaHQgPj0gMCwgXCJIZWlnaHQgbXVzdCBiZSBhbiBpbnRlZ2VyID49IDBcIik7XG4gICAgaWYgKG51bUJsb2NrcyA9PT0gdW5kZWZpbmVkKSBudW1CbG9ja3MgPSBhd2FpdCB0aGlzLmdldEhlaWdodCgpO1xuICAgIGVsc2UgYXNzZXJ0KG51bUJsb2NrcyA+PSAwLCBcIkNvdW50IG11c3QgYmUgYW4gaW50ZWdlciA+PSAwXCIpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2NvaW5iYXNlX3R4X3N1bVwiLCB7aGVpZ2h0OiBoZWlnaHQsIGNvdW50OiBudW1CbG9ja3N9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgbGV0IHR4U3VtID0gbmV3IE1vbmVyb01pbmVyVHhTdW0oKTtcbiAgICB0eFN1bS5zZXRFbWlzc2lvblN1bShCaWdJbnQocmVzcC5yZXN1bHQuZW1pc3Npb25fYW1vdW50KSk7XG4gICAgdHhTdW0uc2V0RmVlU3VtKEJpZ0ludChyZXNwLnJlc3VsdC5mZWVfYW1vdW50KSk7XG4gICAgcmV0dXJuIHR4U3VtO1xuICB9XG4gIFxuICBhc3luYyBnZXRGZWVFc3RpbWF0ZShncmFjZUJsb2Nrcz86IG51bWJlcik6IFByb21pc2U8TW9uZXJvRmVlRXN0aW1hdGU+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0RmVlRXN0aW1hdGUoZ3JhY2VCbG9ja3MpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2ZlZV9lc3RpbWF0ZVwiLCB7Z3JhY2VfYmxvY2tzOiBncmFjZUJsb2Nrc30pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICBsZXQgZmVlRXN0aW1hdGUgPSBuZXcgTW9uZXJvRmVlRXN0aW1hdGUoKTtcbiAgICBmZWVFc3RpbWF0ZS5zZXRGZWUoQmlnSW50KHJlc3AucmVzdWx0LmZlZSkpO1xuICAgIGZlZUVzdGltYXRlLnNldFF1YW50aXphdGlvbk1hc2soQmlnSW50KHJlc3AucmVzdWx0LnF1YW50aXphdGlvbl9tYXNrKSk7XG4gICAgaWYgKHJlc3AucmVzdWx0LmZlZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbGV0IGZlZXMgPSBbXTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVzcC5yZXN1bHQuZmVlcy5sZW5ndGg7IGkrKykgZmVlcy5wdXNoKEJpZ0ludChyZXNwLnJlc3VsdC5mZWVzW2ldKSk7XG4gICAgICBmZWVFc3RpbWF0ZS5zZXRGZWVzKGZlZXMpO1xuICAgIH1cbiAgICByZXR1cm4gZmVlRXN0aW1hdGU7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdFR4SGV4KHR4SGV4OiBzdHJpbmcsIGRvTm90UmVsYXk6IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb1N1Ym1pdFR4UmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnN1Ym1pdFR4SGV4KHR4SGV4LCBkb05vdFJlbGF5KTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcInNlbmRfcmF3X3RyYW5zYWN0aW9uXCIsIHt0eF9hc19oZXg6IHR4SGV4LCBkb19ub3RfcmVsYXk6IGRvTm90UmVsYXl9KTtcbiAgICBsZXQgcmVzdWx0ID0gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNTdWJtaXRUeFJlc3VsdChyZXNwKTtcbiAgICBcbiAgICAvLyBzZXQgaXNHb29kIGJhc2VkIG9uIHN0YXR1c1xuICAgIHRyeSB7XG4gICAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTsgXG4gICAgICByZXN1bHQuc2V0SXNHb29kKHRydWUpO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgcmVzdWx0LnNldElzR29vZChmYWxzZSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbGF5VHhzQnlIYXNoKHR4SGFzaGVzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5yZWxheVR4c0J5SGFzaCh0eEhhc2hlcyk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJyZWxheV90eFwiLCB7dHhpZHM6IHR4SGFzaGVzfSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFBvb2woKTogUHJvbWlzZTxNb25lcm9UeFtdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFR4UG9vbCgpO1xuICAgIFxuICAgIC8vIHNlbmQgcnBjIHJlcXVlc3RcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImdldF90cmFuc2FjdGlvbl9wb29sXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIFxuICAgIC8vIGJ1aWxkIHR4c1xuICAgIGxldCB0eHMgPSBbXTtcbiAgICBpZiAocmVzcC50cmFuc2FjdGlvbnMpIHtcbiAgICAgIGZvciAobGV0IHJwY1R4IG9mIHJlc3AudHJhbnNhY3Rpb25zKSB7XG4gICAgICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeCgpO1xuICAgICAgICB0eHMucHVzaCh0eCk7XG4gICAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICAgICAgdHguc2V0SW5UeFBvb2wodHJ1ZSk7XG4gICAgICAgIHR4LnNldE51bUNvbmZpcm1hdGlvbnMoMCk7XG4gICAgICAgIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVHgocnBjVHgsIHR4KTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHR4cztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhQb29sSGFzaGVzKCk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIC8vIGFzeW5jIGdldFR4UG9vbEJhY2tsb2coKTogUHJvbWlzZTxNb25lcm9UeEJhY2tsb2dFbnRyeVtdPiB7XG4gIC8vICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICAvLyB9XG5cbiAgYXN5bmMgZ2V0VHhQb29sU3RhdHMoKTogUHJvbWlzZTxNb25lcm9UeFBvb2xTdGF0cz4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRUeFBvb2xTdGF0cygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwiZ2V0X3RyYW5zYWN0aW9uX3Bvb2xfc3RhdHNcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVHhQb29sU3RhdHMocmVzcC5wb29sX3N0YXRzKTtcbiAgfVxuICBcbiAgYXN5bmMgZmx1c2hUeFBvb2woaGFzaGVzPzogc3RyaW5nIHwgc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZmx1c2hUeFBvb2woaGFzaGVzKTtcbiAgICBpZiAoaGFzaGVzKSBoYXNoZXMgPSBHZW5VdGlscy5saXN0aWZ5KGhhc2hlcyk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJmbHVzaF90eHBvb2xcIiwge3R4aWRzOiBoYXNoZXN9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEtleUltYWdlU3BlbnRTdGF0dXNlcyhrZXlJbWFnZXM6IHN0cmluZ1tdKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzKGtleUltYWdlcyk7XG4gICAgaWYgKGtleUltYWdlcyA9PT0gdW5kZWZpbmVkIHx8IGtleUltYWdlcy5sZW5ndGggPT09IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBrZXkgaW1hZ2VzIHRvIGNoZWNrIHRoZSBzdGF0dXMgb2ZcIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJpc19rZXlfaW1hZ2Vfc3BlbnRcIiwge2tleV9pbWFnZXM6IGtleUltYWdlc30pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIHJldHVybiByZXNwLnNwZW50X3N0YXR1cztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0T3V0cHV0SGlzdG9ncmFtKGFtb3VudHM/OiBiaWdpbnRbXSwgbWluQ291bnQ/OiBudW1iZXIsIG1heENvdW50PzogbnVtYmVyLCBpc1VubG9ja2VkPzogYm9vbGVhbiwgcmVjZW50Q3V0b2ZmPzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeVtdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldE91dHB1dEhpc3RvZ3JhbShhbW91bnRzLCBtaW5Db3VudCwgbWF4Q291bnQsIGlzVW5sb2NrZWQsIHJlY2VudEN1dG9mZik7XG4gICAgXG4gICAgLy8gc2VuZCBycGMgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X291dHB1dF9oaXN0b2dyYW1cIiwge1xuICAgICAgYW1vdW50czogYW1vdW50cyxcbiAgICAgIG1pbl9jb3VudDogbWluQ291bnQsXG4gICAgICBtYXhfY291bnQ6IG1heENvdW50LFxuICAgICAgdW5sb2NrZWQ6IGlzVW5sb2NrZWQsXG4gICAgICByZWNlbnRfY3V0b2ZmOiByZWNlbnRDdXRvZmZcbiAgICB9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgXG4gICAgLy8gYnVpbGQgaGlzdG9ncmFtIGVudHJpZXMgZnJvbSByZXNwb25zZVxuICAgIGxldCBlbnRyaWVzID0gW107XG4gICAgaWYgKCFyZXNwLnJlc3VsdC5oaXN0b2dyYW0pIHJldHVybiBlbnRyaWVzO1xuICAgIGZvciAobGV0IHJwY0VudHJ5IG9mIHJlc3AucmVzdWx0Lmhpc3RvZ3JhbSkge1xuICAgICAgZW50cmllcy5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjT3V0cHV0SGlzdG9ncmFtRW50cnkocnBjRW50cnkpKTtcbiAgICB9XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dERpc3RyaWJ1dGlvbihhbW91bnRzLCBjdW11bGF0aXZlLCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldE91dHB1dERpc3RyaWJ1dGlvbihhbW91bnRzLCBjdW11bGF0aXZlLCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0KTtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQgKHJlc3BvbnNlICdkaXN0cmlidXRpb24nIGZpZWxkIGlzIGJpbmFyeSlcIik7XG4gICAgXG4vLyAgICBsZXQgYW1vdW50U3RycyA9IFtdO1xuLy8gICAgZm9yIChsZXQgYW1vdW50IG9mIGFtb3VudHMpIGFtb3VudFN0cnMucHVzaChhbW91bnQudG9KU1ZhbHVlKCkpO1xuLy8gICAgY29uc29sZS5sb2coYW1vdW50U3Rycyk7XG4vLyAgICBjb25zb2xlLmxvZyhjdW11bGF0aXZlKTtcbi8vICAgIGNvbnNvbGUubG9nKHN0YXJ0SGVpZ2h0KTtcbi8vICAgIGNvbnNvbGUubG9nKGVuZEhlaWdodCk7XG4vLyAgICBcbi8vICAgIC8vIHNlbmQgcnBjIHJlcXVlc3Rcbi8vICAgIGNvbnNvbGUubG9nKFwiKioqKioqKioqKiogU0VORElORyBSRVFVRVNUICoqKioqKioqKioqKipcIik7XG4vLyAgICBpZiAoc3RhcnRIZWlnaHQgPT09IHVuZGVmaW5lZCkgc3RhcnRIZWlnaHQgPSAwO1xuLy8gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfb3V0cHV0X2Rpc3RyaWJ1dGlvblwiLCB7XG4vLyAgICAgIGFtb3VudHM6IGFtb3VudFN0cnMsXG4vLyAgICAgIGN1bXVsYXRpdmU6IGN1bXVsYXRpdmUsXG4vLyAgICAgIGZyb21faGVpZ2h0OiBzdGFydEhlaWdodCxcbi8vICAgICAgdG9faGVpZ2h0OiBlbmRIZWlnaHRcbi8vICAgIH0pO1xuLy8gICAgXG4vLyAgICBjb25zb2xlLmxvZyhcIlJFU1BPTlNFXCIpO1xuLy8gICAgY29uc29sZS5sb2cocmVzcCk7XG4vLyAgICBcbi8vICAgIC8vIGJ1aWxkIGRpc3RyaWJ1dGlvbiBlbnRyaWVzIGZyb20gcmVzcG9uc2Vcbi8vICAgIGxldCBlbnRyaWVzID0gW107XG4vLyAgICBpZiAoIXJlc3AucmVzdWx0LmRpc3RyaWJ1dGlvbnMpIHJldHVybiBlbnRyaWVzOyBcbi8vICAgIGZvciAobGV0IHJwY0VudHJ5IG9mIHJlc3AucmVzdWx0LmRpc3RyaWJ1dGlvbnMpIHtcbi8vICAgICAgbGV0IGVudHJ5ID0gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNPdXRwdXREaXN0cmlidXRpb25FbnRyeShycGNFbnRyeSk7XG4vLyAgICAgIGVudHJpZXMucHVzaChlbnRyeSk7XG4vLyAgICB9XG4vLyAgICByZXR1cm4gZW50cmllcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SW5mbygpOiBQcm9taXNlPE1vbmVyb0RhZW1vbkluZm8+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0SW5mbygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2luZm9cIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0luZm8ocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBnZXRTeW5jSW5mbygpOiBQcm9taXNlPE1vbmVyb0RhZW1vblN5bmNJbmZvPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFN5bmNJbmZvKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzeW5jX2luZm9cIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1N5bmNJbmZvKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGFyZEZvcmtJbmZvKCk6IFByb21pc2U8TW9uZXJvSGFyZEZvcmtJbmZvPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEhhcmRGb3JrSW5mbygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiaGFyZF9mb3JrX2luZm9cIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0hhcmRGb3JrSW5mbyhyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFsdENoYWlucygpOiBQcm9taXNlPE1vbmVyb0FsdENoYWluW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QWx0Q2hhaW5zKCk7XG4gICAgXG4vLyAgICAvLyBtb2NrZWQgcmVzcG9uc2UgZm9yIHRlc3Rcbi8vICAgIGxldCByZXNwID0ge1xuLy8gICAgICAgIHN0YXR1czogXCJPS1wiLFxuLy8gICAgICAgIGNoYWluczogW1xuLy8gICAgICAgICAge1xuLy8gICAgICAgICAgICBibG9ja19oYXNoOiBcIjY5N2NmMDNjODlhOWIxMThmN2JkZjExYjFiM2E2YTAyOGQ3YjM2MTdkMmQwZWQ5MTMyMmM1NzA5YWNmNzU2MjVcIixcbi8vICAgICAgICAgICAgZGlmZmljdWx0eTogMTQxMTQ3Mjk2MzgzMDAyODAsXG4vLyAgICAgICAgICAgIGhlaWdodDogMTU2MjA2Mixcbi8vICAgICAgICAgICAgbGVuZ3RoOiAyXG4vLyAgICAgICAgICB9XG4vLyAgICAgICAgXVxuLy8gICAgfVxuICAgIFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FsdGVybmF0ZV9jaGFpbnNcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIGxldCBjaGFpbnMgPSBbXTtcbiAgICBpZiAoIXJlc3AucmVzdWx0LmNoYWlucykgcmV0dXJuIGNoYWlucztcbiAgICBmb3IgKGxldCBycGNDaGFpbiBvZiByZXNwLnJlc3VsdC5jaGFpbnMpIGNoYWlucy5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQWx0Q2hhaW4ocnBjQ2hhaW4pKTtcbiAgICByZXR1cm4gY2hhaW5zO1xuICB9XG4gIFxuICBhc3luYyBnZXRBbHRCbG9ja0hhc2hlcygpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEFsdEJsb2NrSGFzaGVzKCk7XG4gICAgXG4vLyAgICAvLyBtb2NrZWQgcmVzcG9uc2UgZm9yIHRlc3Rcbi8vICAgIGxldCByZXNwID0ge1xuLy8gICAgICAgIHN0YXR1czogXCJPS1wiLFxuLy8gICAgICAgIHVudHJ1c3RlZDogZmFsc2UsXG4vLyAgICAgICAgYmxrc19oYXNoZXM6IFtcIjljMjI3N2M1NDcwMjM0YmU4YjMyMzgyY2RmODA5NGExMDNhYmE0ZmNkNWU4NzVhNmZjMTU5ZGMyZWMwMGUwMTFcIixcIjYzN2MwZTBmMDU1OGUyODQ0OTNmMzhhNWZjY2EzNjE1ZGI1OTQ1OGQ5MGQzYTVlZmYwYTE4ZmY1OWI4M2Y0NmZcIixcIjZmM2FkYzE3NGEyZTgwODI4MTllYmI5NjVjOTZhMDk1ZTNlOGI2MzkyOWFkOWJlMmQ3MDVhZDljMDg2YTZiMWNcIixcIjY5N2NmMDNjODlhOWIxMThmN2JkZjExYjFiM2E2YTAyOGQ3YjM2MTdkMmQwZWQ5MTMyMmM1NzA5YWNmNzU2MjVcIl1cbi8vICAgIH1cbiAgICBcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImdldF9hbHRfYmxvY2tzX2hhc2hlc1wiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICBpZiAoIXJlc3AuYmxrc19oYXNoZXMpIHJldHVybiBbXTtcbiAgICByZXR1cm4gcmVzcC5ibGtzX2hhc2hlcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RG93bmxvYWRMaW1pdCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXREb3dubG9hZExpbWl0KCk7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldEJhbmR3aWR0aExpbWl0cygpKVswXTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0RG93bmxvYWRMaW1pdChsaW1pdDogbnVtYmVyKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc2V0RG93bmxvYWRMaW1pdChsaW1pdCk7XG4gICAgaWYgKGxpbWl0ID09IC0xKSByZXR1cm4gYXdhaXQgdGhpcy5yZXNldERvd25sb2FkTGltaXQoKTtcbiAgICBpZiAoIShHZW5VdGlscy5pc0ludChsaW1pdCkgJiYgbGltaXQgPiAwKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiRG93bmxvYWQgbGltaXQgbXVzdCBiZSBhbiBpbnRlZ2VyIGdyZWF0ZXIgdGhhbiAwXCIpO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5zZXRCYW5kd2lkdGhMaW1pdHMobGltaXQsIDApKVswXTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzZXREb3dubG9hZExpbWl0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnJlc2V0RG93bmxvYWRMaW1pdCgpO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5zZXRCYW5kd2lkdGhMaW1pdHMoLTEsIDApKVswXTtcbiAgfVxuXG4gIGFzeW5jIGdldFVwbG9hZExpbWl0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFVwbG9hZExpbWl0KCk7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldEJhbmR3aWR0aExpbWl0cygpKVsxXTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0VXBsb2FkTGltaXQobGltaXQ6IG51bWJlcik6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnNldFVwbG9hZExpbWl0KGxpbWl0KTtcbiAgICBpZiAobGltaXQgPT0gLTEpIHJldHVybiBhd2FpdCB0aGlzLnJlc2V0VXBsb2FkTGltaXQoKTtcbiAgICBpZiAoIShHZW5VdGlscy5pc0ludChsaW1pdCkgJiYgbGltaXQgPiAwKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiVXBsb2FkIGxpbWl0IG11c3QgYmUgYW4gaW50ZWdlciBncmVhdGVyIHRoYW4gMFwiKTtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuc2V0QmFuZHdpZHRoTGltaXRzKDAsIGxpbWl0KSlbMV07XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2V0VXBsb2FkTGltaXQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24ucmVzZXRVcGxvYWRMaW1pdCgpO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5zZXRCYW5kd2lkdGhMaW1pdHMoMCwgLTEpKVsxXTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGVlcnMoKTogUHJvbWlzZTxNb25lcm9QZWVyW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0UGVlcnMoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9jb25uZWN0aW9uc1wiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgbGV0IHBlZXJzID0gW107XG4gICAgaWYgKCFyZXNwLnJlc3VsdC5jb25uZWN0aW9ucykgcmV0dXJuIHBlZXJzO1xuICAgIGZvciAobGV0IHJwY0Nvbm5lY3Rpb24gb2YgcmVzcC5yZXN1bHQuY29ubmVjdGlvbnMpIHtcbiAgICAgIHBlZXJzLnB1c2goTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNDb25uZWN0aW9uKHJwY0Nvbm5lY3Rpb24pKTtcbiAgICB9XG4gICAgcmV0dXJuIHBlZXJzO1xuICB9XG4gIFxuICBhc3luYyBnZXRLbm93blBlZXJzKCk6IFByb21pc2U8TW9uZXJvUGVlcltdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEtub3duUGVlcnMoKTtcbiAgICBcbiAgICAvLyB0eCBjb25maWdcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImdldF9wZWVyX2xpc3RcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgXG4gICAgLy8gYnVpbGQgcGVlcnNcbiAgICBsZXQgcGVlcnMgPSBbXTtcbiAgICBpZiAocmVzcC5ncmF5X2xpc3QpIHtcbiAgICAgIGZvciAobGV0IHJwY1BlZXIgb2YgcmVzcC5ncmF5X2xpc3QpIHtcbiAgICAgICAgbGV0IHBlZXIgPSBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1BlZXIocnBjUGVlcik7XG4gICAgICAgIHBlZXIuc2V0SXNPbmxpbmUoZmFsc2UpOyAvLyBncmF5IGxpc3QgbWVhbnMgb2ZmbGluZSBsYXN0IGNoZWNrZWRcbiAgICAgICAgcGVlcnMucHVzaChwZWVyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHJlc3Aud2hpdGVfbGlzdCkge1xuICAgICAgZm9yIChsZXQgcnBjUGVlciBvZiByZXNwLndoaXRlX2xpc3QpIHtcbiAgICAgICAgbGV0IHBlZXIgPSBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1BlZXIocnBjUGVlcik7XG4gICAgICAgIHBlZXIuc2V0SXNPbmxpbmUodHJ1ZSk7IC8vIHdoaXRlIGxpc3QgbWVhbnMgb25saW5lIGxhc3QgY2hlY2tlZFxuICAgICAgICBwZWVycy5wdXNoKHBlZXIpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcGVlcnM7XG4gIH1cbiAgXG4gIGFzeW5jIHNldE91dGdvaW5nUGVlckxpbWl0KGxpbWl0OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc2V0T3V0Z29pbmdQZWVyTGltaXQobGltaXQpO1xuICAgIGlmICghKEdlblV0aWxzLmlzSW50KGxpbWl0KSAmJiBsaW1pdCA+PSAwKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiT3V0Z29pbmcgcGVlciBsaW1pdCBtdXN0IGJlID49IDBcIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJvdXRfcGVlcnNcIiwge291dF9wZWVyczogbGltaXR9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0SW5jb21pbmdQZWVyTGltaXQobGltaXQ6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5zZXRJbmNvbWluZ1BlZXJMaW1pdChsaW1pdCk7XG4gICAgaWYgKCEoR2VuVXRpbHMuaXNJbnQobGltaXQpICYmIGxpbWl0ID49IDApKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJJbmNvbWluZyBwZWVyIGxpbWl0IG11c3QgYmUgPj0gMFwiKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImluX3BlZXJzXCIsIHtpbl9wZWVyczogbGltaXR9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGVlckJhbnMoKTogUHJvbWlzZTxNb25lcm9CYW5bXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRQZWVyQmFucygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2JhbnNcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIGxldCBiYW5zID0gW107XG4gICAgZm9yIChsZXQgcnBjQmFuIG9mIHJlc3AucmVzdWx0LmJhbnMpIHtcbiAgICAgIGxldCBiYW4gPSBuZXcgTW9uZXJvQmFuKCk7XG4gICAgICBiYW4uc2V0SG9zdChycGNCYW4uaG9zdCk7XG4gICAgICBiYW4uc2V0SXAocnBjQmFuLmlwKTtcbiAgICAgIGJhbi5zZXRTZWNvbmRzKHJwY0Jhbi5zZWNvbmRzKTtcbiAgICAgIGJhbnMucHVzaChiYW4pO1xuICAgIH1cbiAgICByZXR1cm4gYmFucztcbiAgfVxuICBcbiAgYXN5bmMgc2V0UGVlckJhbnMoYmFuczogTW9uZXJvQmFuW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc2V0UGVlckJhbnMoYmFucyk7XG4gICAgbGV0IHJwY0JhbnMgPSBbXTtcbiAgICBmb3IgKGxldCBiYW4gb2YgYmFucykgcnBjQmFucy5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0VG9ScGNCYW4oYmFuKSk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzZXRfYmFuc1wiLCB7YmFuczogcnBjQmFuc30pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgc3RhcnRNaW5pbmcoYWRkcmVzczogc3RyaW5nLCBudW1UaHJlYWRzPzogbnVtYmVyLCBpc0JhY2tncm91bmQ/OiBib29sZWFuLCBpZ25vcmVCYXR0ZXJ5PzogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5zdGFydE1pbmluZyhhZGRyZXNzLCBudW1UaHJlYWRzLCBpc0JhY2tncm91bmQsIGlnbm9yZUJhdHRlcnkpO1xuICAgIGFzc2VydChhZGRyZXNzLCBcIk11c3QgcHJvdmlkZSBhZGRyZXNzIHRvIG1pbmUgdG9cIik7XG4gICAgYXNzZXJ0KEdlblV0aWxzLmlzSW50KG51bVRocmVhZHMpICYmIG51bVRocmVhZHMgPiAwLCBcIk51bWJlciBvZiB0aHJlYWRzIG11c3QgYmUgYW4gaW50ZWdlciBncmVhdGVyIHRoYW4gMFwiKTtcbiAgICBhc3NlcnQoaXNCYWNrZ3JvdW5kID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIGlzQmFja2dyb3VuZCA9PT0gXCJib29sZWFuXCIpO1xuICAgIGFzc2VydChpZ25vcmVCYXR0ZXJ5ID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIGlnbm9yZUJhdHRlcnkgPT09IFwiYm9vbGVhblwiKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcInN0YXJ0X21pbmluZ1wiLCB7XG4gICAgICBtaW5lcl9hZGRyZXNzOiBhZGRyZXNzLFxuICAgICAgdGhyZWFkc19jb3VudDogbnVtVGhyZWFkcyxcbiAgICAgIGRvX2JhY2tncm91bmRfbWluaW5nOiBpc0JhY2tncm91bmQsXG4gICAgICBpZ25vcmVfYmF0dGVyeTogaWdub3JlQmF0dGVyeSxcbiAgICB9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgc3RvcE1pbmluZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc3RvcE1pbmluZygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwic3RvcF9taW5pbmdcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE1pbmluZ1N0YXR1cygpOiBQcm9taXNlPE1vbmVyb01pbmluZ1N0YXR1cz4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRNaW5pbmdTdGF0dXMoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcIm1pbmluZ19zdGF0dXNcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjTWluaW5nU3RhdHVzKHJlc3ApO1xuICB9XG4gIFxuICBhc3luYyBzdWJtaXRCbG9ja3MoYmxvY2tCbG9iczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc3VibWl0QmxvY2tzKCk7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkoYmxvY2tCbG9icykgJiYgYmxvY2tCbG9icy5sZW5ndGggPiAwLCBcIk11c3QgcHJvdmlkZSBhbiBhcnJheSBvZiBtaW5lZCBibG9jayBibG9icyB0byBzdWJtaXRcIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzdWJtaXRfYmxvY2tcIiwgYmxvY2tCbG9icyk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICB9XG5cbiAgYXN5bmMgcHJ1bmVCbG9ja2NoYWluKGNoZWNrOiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9QcnVuZVJlc3VsdD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5wcnVuZUJsb2NrY2hhaW4oKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInBydW5lX2Jsb2NrY2hhaW5cIiwge2NoZWNrOiBjaGVja30sIDApO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICBsZXQgcmVzdWx0ID0gbmV3IE1vbmVyb1BydW5lUmVzdWx0KCk7XG4gICAgcmVzdWx0LnNldElzUHJ1bmVkKHJlc3AucmVzdWx0LnBydW5lZCk7XG4gICAgcmVzdWx0LnNldFBydW5pbmdTZWVkKHJlc3AucmVzdWx0LnBydW5pbmdfc2VlZCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tGb3JVcGRhdGUoKTogUHJvbWlzZTxNb25lcm9EYWVtb25VcGRhdGVDaGVja1Jlc3VsdD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5jaGVja0ZvclVwZGF0ZSgpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwidXBkYXRlXCIsIHtjb21tYW5kOiBcImNoZWNrXCJ9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNVcGRhdGVDaGVja1Jlc3VsdChyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgZG93bmxvYWRVcGRhdGUocGF0aD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZG93bmxvYWRVcGRhdGUocGF0aCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJ1cGRhdGVcIiwge2NvbW1hbmQ6IFwiZG93bmxvYWRcIiwgcGF0aDogcGF0aH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1VwZGF0ZURvd25sb2FkUmVzdWx0KHJlc3ApO1xuICB9XG4gIFxuICBhc3luYyBzdG9wKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5zdG9wKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJzdG9wX2RhZW1vblwiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgd2FpdEZvck5leHRCbG9ja0hlYWRlcigpOiBQcm9taXNlPE1vbmVyb0Jsb2NrSGVhZGVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLndhaXRGb3JOZXh0QmxvY2tIZWFkZXIoKTtcbiAgICBsZXQgdGhhdCA9IHRoaXM7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jIGZ1bmN0aW9uKHJlc29sdmUpIHtcbiAgICAgIGF3YWl0IHRoYXQuYWRkTGlzdGVuZXIobmV3IGNsYXNzIGV4dGVuZHMgTW9uZXJvRGFlbW9uTGlzdGVuZXIge1xuICAgICAgICBhc3luYyBvbkJsb2NrSGVhZGVyKGhlYWRlcikge1xuICAgICAgICAgIGF3YWl0IHRoYXQucmVtb3ZlTGlzdGVuZXIodGhpcyk7XG4gICAgICAgICAgcmVzb2x2ZShoZWFkZXIpO1xuICAgICAgICB9XG4gICAgICB9KTsgXG4gICAgfSk7XG4gIH1cblxuICBnZXRQb2xsSW50ZXJ2YWwoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5jb25maWcucG9sbEludGVydmFsO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLSBBREQgSlNET0MgRk9SIFNVUFBPUlRFRCBERUZBVUxUIElNUExFTUVOVEFUSU9OUyAtLS0tLS0tLS0tLS0tLVxuICBhc3luYyBnZXRUeCh0eEhhc2g/OiBzdHJpbmcsIHBydW5lID0gZmFsc2UpOiBQcm9taXNlPE1vbmVyb1R4fHVuZGVmaW5lZD4geyByZXR1cm4gc3VwZXIuZ2V0VHgodHhIYXNoLCBwcnVuZSk7IH07XG4gIGFzeW5jIGdldFR4SGV4KHR4SGFzaDogc3RyaW5nLCBwcnVuZSA9IGZhbHNlKTogUHJvbWlzZTxzdHJpbmc+IHsgcmV0dXJuIHN1cGVyLmdldFR4SGV4KHR4SGFzaCwgcHJ1bmUpOyB9O1xuICBhc3luYyBnZXRLZXlJbWFnZVNwZW50U3RhdHVzKGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlU3BlbnRTdGF0dXM+IHsgcmV0dXJuIHN1cGVyLmdldEtleUltYWdlU3BlbnRTdGF0dXMoa2V5SW1hZ2UpOyB9XG4gIGFzeW5jIHNldFBlZXJCYW4oYmFuOiBNb25lcm9CYW4pOiBQcm9taXNlPHZvaWQ+IHsgcmV0dXJuIHN1cGVyLnNldFBlZXJCYW4oYmFuKTsgfVxuICBhc3luYyBzdWJtaXRCbG9jayhibG9ja0Jsb2I6IHN0cmluZyk6IFByb21pc2U8dm9pZD4geyByZXR1cm4gc3VwZXIuc3VibWl0QmxvY2soYmxvY2tCbG9iKTsgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwcm90ZWN0ZWQgcmVmcmVzaExpc3RlbmluZygpIHtcbiAgICBpZiAodGhpcy5wb2xsTGlzdGVuZXIgPT0gdW5kZWZpbmVkICYmIHRoaXMubGlzdGVuZXJzLmxlbmd0aCkgdGhpcy5wb2xsTGlzdGVuZXIgPSBuZXcgRGFlbW9uUG9sbGVyKHRoaXMpO1xuICAgIGlmICh0aGlzLnBvbGxMaXN0ZW5lciAhPT0gdW5kZWZpbmVkKSB0aGlzLnBvbGxMaXN0ZW5lci5zZXRJc1BvbGxpbmcodGhpcy5saXN0ZW5lcnMubGVuZ3RoID4gMCk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBnZXRCYW5kd2lkdGhMaW1pdHMoKSB7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJnZXRfbGltaXRcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgcmV0dXJuIFtyZXNwLmxpbWl0X2Rvd24sIHJlc3AubGltaXRfdXBdO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgc2V0QmFuZHdpZHRoTGltaXRzKGRvd25MaW1pdCwgdXBMaW1pdCkge1xuICAgIGlmIChkb3duTGltaXQgPT09IHVuZGVmaW5lZCkgZG93bkxpbWl0ID0gMDtcbiAgICBpZiAodXBMaW1pdCA9PT0gdW5kZWZpbmVkKSB1cExpbWl0ID0gMDtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcInNldF9saW1pdFwiLCB7bGltaXRfZG93bjogZG93bkxpbWl0LCBsaW1pdF91cDogdXBMaW1pdH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIHJldHVybiBbcmVzcC5saW1pdF9kb3duLCByZXNwLmxpbWl0X3VwXTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhIGNvbnRpZ3VvdXMgY2h1bmsgb2YgYmxvY2tzIHN0YXJ0aW5nIGZyb20gYSBnaXZlbiBoZWlnaHQgdXAgdG8gYSBtYXhpbXVtXG4gICAqIGhlaWdodCBvciBhbW91bnQgb2YgYmxvY2sgZGF0YSBmZXRjaGVkIGZyb20gdGhlIGJsb2NrY2hhaW4sIHdoaWNoZXZlciBjb21lcyBmaXJzdC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbc3RhcnRIZWlnaHRdIC0gc3RhcnQgaGVpZ2h0IHRvIHJldHJpZXZlIGJsb2NrcyAoZGVmYXVsdCAwKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW21heEhlaWdodF0gLSBtYXhpbXVtIGVuZCBoZWlnaHQgdG8gcmV0cmlldmUgYmxvY2tzIChkZWZhdWx0IGJsb2NrY2hhaW4gaGVpZ2h0KVxuICAgKiBAcGFyYW0ge251bWJlcn0gW21heFJlcVNpemVdIC0gbWF4aW11bSBhbW91bnQgb2YgYmxvY2sgZGF0YSB0byBmZXRjaCBmcm9tIHRoZSBibG9ja2NoYWluIGluIGJ5dGVzIChkZWZhdWx0IDMsMDAwLDAwMCBieXRlcylcbiAgICogQHJldHVybiB7TW9uZXJvQmxvY2tbXX0gYXJlIHRoZSByZXN1bHRpbmcgY2h1bmsgb2YgYmxvY2tzXG4gICAqL1xuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0TWF4QmxvY2tzKHN0YXJ0SGVpZ2h0LCBtYXhIZWlnaHQsIG1heFJlcVNpemUpIHtcbiAgICBpZiAoc3RhcnRIZWlnaHQgPT09IHVuZGVmaW5lZCkgc3RhcnRIZWlnaHQgPSAwO1xuICAgIGlmIChtYXhIZWlnaHQgPT09IHVuZGVmaW5lZCkgbWF4SGVpZ2h0ID0gYXdhaXQgdGhpcy5nZXRIZWlnaHQoKSAtIDE7XG4gICAgaWYgKG1heFJlcVNpemUgPT09IHVuZGVmaW5lZCkgbWF4UmVxU2l6ZSA9IE1vbmVyb0RhZW1vblJwYy5NQVhfUkVRX1NJWkU7XG4gICAgXG4gICAgLy8gZGV0ZXJtaW5lIGVuZCBoZWlnaHQgdG8gZmV0Y2hcbiAgICBsZXQgcmVxU2l6ZSA9IDA7XG4gICAgbGV0IGVuZEhlaWdodCA9IHN0YXJ0SGVpZ2h0IC0gMTtcbiAgICB3aGlsZSAocmVxU2l6ZSA8IG1heFJlcVNpemUgJiYgZW5kSGVpZ2h0IDwgbWF4SGVpZ2h0KSB7XG4gICAgICBcbiAgICAgIC8vIGdldCBoZWFkZXIgb2YgbmV4dCBibG9ja1xuICAgICAgbGV0IGhlYWRlciA9IGF3YWl0IHRoaXMuZ2V0QmxvY2tIZWFkZXJCeUhlaWdodENhY2hlZChlbmRIZWlnaHQgKyAxLCBtYXhIZWlnaHQpO1xuICAgICAgXG4gICAgICAvLyBibG9jayBjYW5ub3QgYmUgYmlnZ2VyIHRoYW4gbWF4IHJlcXVlc3Qgc2l6ZVxuICAgICAgYXNzZXJ0KGhlYWRlci5nZXRTaXplKCkgPD0gbWF4UmVxU2l6ZSwgXCJCbG9jayBleGNlZWRzIG1heGltdW0gcmVxdWVzdCBzaXplOiBcIiArIGhlYWRlci5nZXRTaXplKCkpO1xuICAgICAgXG4gICAgICAvLyBkb25lIGl0ZXJhdGluZyBpZiBmZXRjaGluZyBibG9jayB3b3VsZCBleGNlZWQgbWF4IHJlcXVlc3Qgc2l6ZVxuICAgICAgaWYgKHJlcVNpemUgKyBoZWFkZXIuZ2V0U2l6ZSgpID4gbWF4UmVxU2l6ZSkgYnJlYWs7XG4gICAgICBcbiAgICAgIC8vIG90aGVyd2lzZSBibG9jayBpcyBpbmNsdWRlZFxuICAgICAgcmVxU2l6ZSArPSBoZWFkZXIuZ2V0U2l6ZSgpO1xuICAgICAgZW5kSGVpZ2h0Kys7XG4gICAgfVxuICAgIHJldHVybiBlbmRIZWlnaHQgPj0gc3RhcnRIZWlnaHQgPyBhd2FpdCB0aGlzLmdldEJsb2Nrc0J5UmFuZ2Uoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCkgOiBbXTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFJldHJpZXZlcyBhIGhlYWRlciBieSBoZWlnaHQgZnJvbSB0aGUgY2FjaGUgb3IgZmV0Y2hlcyBhbmQgY2FjaGVzIGEgaGVhZGVyXG4gICAqIHJhbmdlIGlmIG5vdCBhbHJlYWR5IGluIHRoZSBjYWNoZS5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHQgLSBoZWlnaHQgb2YgdGhlIGhlYWRlciB0byByZXRyaWV2ZSBmcm9tIHRoZSBjYWNoZVxuICAgKiBAcGFyYW0ge251bWJlcn0gbWF4SGVpZ2h0IC0gbWF4aW11bSBoZWlnaHQgb2YgaGVhZGVycyB0byBjYWNoZVxuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIGdldEJsb2NrSGVhZGVyQnlIZWlnaHRDYWNoZWQoaGVpZ2h0LCBtYXhIZWlnaHQpIHtcbiAgICBcbiAgICAvLyBnZXQgaGVhZGVyIGZyb20gY2FjaGVcbiAgICBsZXQgY2FjaGVkSGVhZGVyID0gdGhpcy5jYWNoZWRIZWFkZXJzW2hlaWdodF07XG4gICAgaWYgKGNhY2hlZEhlYWRlcikgcmV0dXJuIGNhY2hlZEhlYWRlcjtcbiAgICBcbiAgICAvLyBmZXRjaCBhbmQgY2FjaGUgaGVhZGVycyBpZiBub3QgaW4gY2FjaGVcbiAgICBsZXQgZW5kSGVpZ2h0ID0gTWF0aC5taW4obWF4SGVpZ2h0LCBoZWlnaHQgKyBNb25lcm9EYWVtb25ScGMuTlVNX0hFQURFUlNfUEVSX1JFUSAtIDEpOyAgLy8gVE9ETzogY291bGQgc3BlY2lmeSBlbmQgaGVpZ2h0IHRvIGNhY2hlIHRvIG9wdGltaXplIHNtYWxsIHJlcXVlc3RzICh3b3VsZCBsaWtlIHRvIGhhdmUgdGltZSBwcm9maWxpbmcgaW4gcGxhY2UgdGhvdWdoKVxuICAgIGxldCBoZWFkZXJzID0gYXdhaXQgdGhpcy5nZXRCbG9ja0hlYWRlcnNCeVJhbmdlKGhlaWdodCwgZW5kSGVpZ2h0KTtcbiAgICBmb3IgKGxldCBoZWFkZXIgb2YgaGVhZGVycykge1xuICAgICAgdGhpcy5jYWNoZWRIZWFkZXJzW2hlYWRlci5nZXRIZWlnaHQoKV0gPSBoZWFkZXI7XG4gICAgfVxuICAgIFxuICAgIC8vIHJldHVybiB0aGUgY2FjaGVkIGhlYWRlclxuICAgIHJldHVybiB0aGlzLmNhY2hlZEhlYWRlcnNbaGVpZ2h0XTtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFNUQVRJQyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBzdGF0aWMgYXN5bmMgY29ubmVjdFRvRGFlbW9uUnBjKHVyaU9yQ29uZmlnOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHwgUGFydGlhbDxNb25lcm9EYWVtb25Db25maWc+IHwgc3RyaW5nW10sIHVzZXJuYW1lPzogc3RyaW5nLCBwYXNzd29yZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvRGFlbW9uUnBjPiB7XG4gICAgbGV0IGNvbmZpZyA9IE1vbmVyb0RhZW1vblJwYy5ub3JtYWxpemVDb25maWcodXJpT3JDb25maWcsIHVzZXJuYW1lLCBwYXNzd29yZCk7XG4gICAgaWYgKGNvbmZpZy5jbWQpIHJldHVybiBNb25lcm9EYWVtb25ScGMuc3RhcnRNb25lcm9kUHJvY2Vzcyhjb25maWcpO1xuICAgIHJldHVybiBuZXcgTW9uZXJvRGFlbW9uUnBjKGNvbmZpZywgY29uZmlnLnByb3h5VG9Xb3JrZXIgPyBhd2FpdCBNb25lcm9EYWVtb25ScGNQcm94eS5jb25uZWN0KGNvbmZpZykgOiB1bmRlZmluZWQpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIHN0YXJ0TW9uZXJvZFByb2Nlc3MoY29uZmlnOiBNb25lcm9EYWVtb25Db25maWcpOiBQcm9taXNlPE1vbmVyb0RhZW1vblJwYz4ge1xuICAgIGFzc2VydChHZW5VdGlscy5pc0FycmF5KGNvbmZpZy5jbWQpLCBcIk11c3QgcHJvdmlkZSBzdHJpbmcgYXJyYXkgd2l0aCBjb21tYW5kIGxpbmUgcGFyYW1ldGVyc1wiKTtcbiAgICBcbiAgICAvLyBzdGFydCBwcm9jZXNzXG4gICAgbGV0IGNoaWxkUHJvY2VzcyA9IHJlcXVpcmUoJ2NoaWxkX3Byb2Nlc3MnKS5zcGF3bihjb25maWcuY21kWzBdLCBjb25maWcuY21kLnNsaWNlKDEpLCB7XG4gICAgICBlbnY6IHsgLi4ucHJvY2Vzcy5lbnYsIExBTkc6ICdlbl9VUy5VVEYtOCcgfSAvLyBzY3JhcGUgb3V0cHV0IGluIGVuZ2xpc2hcbiAgICB9KTtcbiAgICBjaGlsZFByb2Nlc3Muc3Rkb3V0LnNldEVuY29kaW5nKCd1dGY4Jyk7XG4gICAgY2hpbGRQcm9jZXNzLnN0ZGVyci5zZXRFbmNvZGluZygndXRmOCcpO1xuICAgIFxuICAgIC8vIHJldHVybiBwcm9taXNlIHdoaWNoIHJlc29sdmVzIGFmdGVyIHN0YXJ0aW5nIG1vbmVyb2RcbiAgICBsZXQgdXJpO1xuICAgIGxldCBvdXRwdXQgPSBcIlwiO1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gYXdhaXQgbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICBcbiAgICAgICAgLy8gaGFuZGxlIHN0ZG91dFxuICAgICAgICBjaGlsZFByb2Nlc3Muc3Rkb3V0Lm9uKCdkYXRhJywgYXN5bmMgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgIGxldCBsaW5lID0gZGF0YS50b1N0cmluZygpO1xuICAgICAgICAgIExpYnJhcnlVdGlscy5sb2coMiwgbGluZSk7XG4gICAgICAgICAgb3V0cHV0ICs9IGxpbmUgKyAnXFxuJzsgLy8gY2FwdHVyZSBvdXRwdXQgaW4gY2FzZSBvZiBlcnJvclxuICAgICAgICAgIFxuICAgICAgICAgIC8vIGV4dHJhY3QgdXJpIGZyb20gZS5nLiBcIkkgQmluZGluZyBvbiAxMjcuMC4wLjEgKElQdjQpOjM4MDg1XCJcbiAgICAgICAgICBsZXQgdXJpTGluZUNvbnRhaW5zID0gXCJCaW5kaW5nIG9uIFwiO1xuICAgICAgICAgIGxldCB1cmlMaW5lQ29udGFpbnNJZHggPSBsaW5lLmluZGV4T2YodXJpTGluZUNvbnRhaW5zKTtcbiAgICAgICAgICBpZiAodXJpTGluZUNvbnRhaW5zSWR4ID49IDApIHtcbiAgICAgICAgICAgIGxldCBob3N0ID0gbGluZS5zdWJzdHJpbmcodXJpTGluZUNvbnRhaW5zSWR4ICsgdXJpTGluZUNvbnRhaW5zLmxlbmd0aCwgbGluZS5sYXN0SW5kZXhPZignICcpKTtcbiAgICAgICAgICAgIGxldCB1bmZvcm1hdHRlZExpbmUgPSBsaW5lLnJlcGxhY2UoL1xcdTAwMWJcXFsuKj9tL2csICcnKS50cmltKCk7IC8vIHJlbW92ZSBjb2xvciBmb3JtYXR0aW5nXG4gICAgICAgICAgICBsZXQgcG9ydCA9IHVuZm9ybWF0dGVkTGluZS5zdWJzdHJpbmcodW5mb3JtYXR0ZWRMaW5lLmxhc3RJbmRleE9mKCc6JykgKyAxKTtcbiAgICAgICAgICAgIGxldCBzc2xJZHggPSBjb25maWcuY21kLmluZGV4T2YoXCItLXJwYy1zc2xcIik7XG4gICAgICAgICAgICBsZXQgc3NsRW5hYmxlZCA9IHNzbElkeCA+PSAwID8gXCJlbmFibGVkXCIgPT0gY29uZmlnLmNtZFtzc2xJZHggKyAxXS50b0xvd2VyQ2FzZSgpIDogZmFsc2U7XG4gICAgICAgICAgICB1cmkgPSAoc3NsRW5hYmxlZCA/IFwiaHR0cHNcIiA6IFwiaHR0cFwiKSArIFwiOi8vXCIgKyBob3N0ICsgXCI6XCIgKyBwb3J0O1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICAvLyByZWFkIHN1Y2Nlc3MgbWVzc2FnZVxuICAgICAgICAgIGlmIChsaW5lLmluZGV4T2YoXCJjb3JlIFJQQyBzZXJ2ZXIgc3RhcnRlZCBva1wiKSA+PSAwKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIGdldCB1c2VybmFtZSBhbmQgcGFzc3dvcmQgZnJvbSBwYXJhbXNcbiAgICAgICAgICAgIGxldCB1c2VyUGFzc0lkeCA9IGNvbmZpZy5jbWQuaW5kZXhPZihcIi0tcnBjLWxvZ2luXCIpO1xuICAgICAgICAgICAgbGV0IHVzZXJQYXNzID0gdXNlclBhc3NJZHggPj0gMCA/IGNvbmZpZy5jbWRbdXNlclBhc3NJZHggKyAxXSA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGxldCB1c2VybmFtZSA9IHVzZXJQYXNzID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB1c2VyUGFzcy5zdWJzdHJpbmcoMCwgdXNlclBhc3MuaW5kZXhPZignOicpKTtcbiAgICAgICAgICAgIGxldCBwYXNzd29yZCA9IHVzZXJQYXNzID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB1c2VyUGFzcy5zdWJzdHJpbmcodXNlclBhc3MuaW5kZXhPZignOicpICsgMSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIGNyZWF0ZSBjbGllbnQgY29ubmVjdGVkIHRvIGludGVybmFsIHByb2Nlc3NcbiAgICAgICAgICAgIGNvbmZpZyA9IGNvbmZpZy5jb3B5KCkuc2V0U2VydmVyKHt1cmk6IHVyaSwgdXNlcm5hbWU6IHVzZXJuYW1lLCBwYXNzd29yZDogcGFzc3dvcmQsIHJlamVjdFVuYXV0aG9yaXplZDogY29uZmlnLmdldFNlcnZlcigpID8gY29uZmlnLmdldFNlcnZlcigpLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdW5kZWZpbmVkfSk7XG4gICAgICAgICAgICBjb25maWcuc2V0UHJveHlUb1dvcmtlcihjb25maWcucHJveHlUb1dvcmtlcik7XG4gICAgICAgICAgICBjb25maWcuY21kID0gdW5kZWZpbmVkXG4gICAgICAgICAgICBsZXQgZGFlbW9uID0gYXdhaXQgTW9uZXJvRGFlbW9uUnBjLmNvbm5lY3RUb0RhZW1vblJwYyhjb25maWcpO1xuICAgICAgICAgICAgZGFlbW9uLnByb2Nlc3MgPSBjaGlsZFByb2Nlc3M7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIHJlc29sdmUgcHJvbWlzZSB3aXRoIGNsaWVudCBjb25uZWN0ZWQgdG8gaW50ZXJuYWwgcHJvY2VzcyBcbiAgICAgICAgICAgIHRoaXMuaXNSZXNvbHZlZCA9IHRydWU7XG4gICAgICAgICAgICByZXNvbHZlKGRhZW1vbik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBzdGRlcnJcbiAgICAgICAgY2hpbGRQcm9jZXNzLnN0ZGVyci5vbignZGF0YScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICBpZiAoTGlicmFyeVV0aWxzLmdldExvZ0xldmVsKCkgPj0gMikgY29uc29sZS5lcnJvcihkYXRhKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgZXhpdFxuICAgICAgICBjaGlsZFByb2Nlc3Mub24oXCJleGl0XCIsIGZ1bmN0aW9uKGNvZGUpIHtcbiAgICAgICAgICBpZiAoIXRoaXMuaXNSZXNvbHZlZCkgcmVqZWN0KG5ldyBFcnJvcihcIm1vbmVyb2QgcHJvY2VzcyB0ZXJtaW5hdGVkIHdpdGggZXhpdCBjb2RlIFwiICsgY29kZSArIChvdXRwdXQgPyBcIjpcXG5cXG5cIiArIG91dHB1dCA6IFwiXCIpKSk7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gaGFuZGxlIGVycm9yXG4gICAgICAgIGNoaWxkUHJvY2Vzcy5vbihcImVycm9yXCIsIGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgIGlmIChlcnIubWVzc2FnZS5pbmRleE9mKFwiRU5PRU5UXCIpID49IDApIHJlamVjdChuZXcgRXJyb3IoXCJtb25lcm9kIGRvZXMgbm90IGV4aXN0IGF0IHBhdGggJ1wiICsgY29uZmlnLmNtZFswXSArIFwiJ1wiKSk7XG4gICAgICAgICAgaWYgKCF0aGlzLmlzUmVzb2x2ZWQpIHJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSB1bmNhdWdodCBleGNlcHRpb25cbiAgICAgICAgY2hpbGRQcm9jZXNzLm9uKFwidW5jYXVnaHRFeGNlcHRpb25cIiwgZnVuY3Rpb24oZXJyLCBvcmlnaW4pIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiVW5jYXVnaHQgZXhjZXB0aW9uIGluIG1vbmVyb2QgcHJvY2VzczogXCIgKyBlcnIubWVzc2FnZSk7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihvcmlnaW4pO1xuICAgICAgICAgIGlmICghdGhpcy5pc1Jlc29sdmVkKSByZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGVyci5tZXNzYWdlKTtcbiAgICB9XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgbm9ybWFsaXplQ29uZmlnKHVyaU9yQ29uZmlnOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHwgUGFydGlhbDxNb25lcm9EYWVtb25Db25maWc+IHwgc3RyaW5nW10sIHVzZXJuYW1lPzogc3RyaW5nLCBwYXNzd29yZD86IHN0cmluZyk6IE1vbmVyb0RhZW1vbkNvbmZpZyB7XG4gICAgbGV0IGNvbmZpZzogdW5kZWZpbmVkIHwgUGFydGlhbDxNb25lcm9EYWVtb25Db25maWc+ID0gdW5kZWZpbmVkO1xuICAgIGlmICh0eXBlb2YgdXJpT3JDb25maWcgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGNvbmZpZyA9IG5ldyBNb25lcm9EYWVtb25Db25maWcoe3NlcnZlcjogbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24odXJpT3JDb25maWcgYXMgc3RyaW5nLCB1c2VybmFtZSwgcGFzc3dvcmQpfSk7XG4gICAgfSBlbHNlIGlmICgodXJpT3JDb25maWcgYXMgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPikudXJpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbmZpZyA9IG5ldyBNb25lcm9EYWVtb25Db25maWcoe3NlcnZlcjogbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24odXJpT3JDb25maWcgYXMgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPil9KTtcblxuICAgICAgLy8gdHJhbnNmZXIgd29ya2VyIHByb3h5IHNldHRpbmcgZnJvbSBycGMgY29ubmVjdGlvbiB0byBkYWVtb24gY29uZmlnXG4gICAgICBjb25maWcuc2V0UHJveHlUb1dvcmtlcigodXJpT3JDb25maWcgYXMgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPikucHJveHlUb1dvcmtlcik7XG4gICAgICBjb25maWcuZ2V0U2VydmVyKCkuc2V0UHJveHlUb1dvcmtlcihNb25lcm9ScGNDb25uZWN0aW9uLkRFRkFVTFRfQ09ORklHLnByb3h5VG9Xb3JrZXIpO1xuICAgIH0gZWxzZSBpZiAoR2VuVXRpbHMuaXNBcnJheSh1cmlPckNvbmZpZykpIHtcbiAgICAgIGNvbmZpZyA9IG5ldyBNb25lcm9EYWVtb25Db25maWcoe2NtZDogdXJpT3JDb25maWcgYXMgc3RyaW5nW119KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uZmlnID0gbmV3IE1vbmVyb0RhZW1vbkNvbmZpZyh1cmlPckNvbmZpZyBhcyBQYXJ0aWFsPE1vbmVyb0RhZW1vbkNvbmZpZz4pO1xuICAgIH1cbiAgICBpZiAoY29uZmlnLnByb3h5VG9Xb3JrZXIgPT09IHVuZGVmaW5lZCkgY29uZmlnLnByb3h5VG9Xb3JrZXIgPSB0cnVlO1xuICAgIGlmIChjb25maWcucG9sbEludGVydmFsID09PSB1bmRlZmluZWQpIGNvbmZpZy5wb2xsSW50ZXJ2YWwgPSBNb25lcm9EYWVtb25ScGMuREVGQVVMVF9QT0xMX1BFUklPRDtcbiAgICByZXR1cm4gY29uZmlnIGFzIE1vbmVyb0RhZW1vbkNvbmZpZztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApIHtcbiAgICBpZiAocmVzcC5zdGF0dXMgIT09IFwiT0tcIikgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHJlc3Auc3RhdHVzKTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjQmxvY2tIZWFkZXIocnBjSGVhZGVyKSB7XG4gICAgaWYgKCFycGNIZWFkZXIpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgbGV0IGhlYWRlciA9IG5ldyBNb25lcm9CbG9ja0hlYWRlcigpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNIZWFkZXIpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjSGVhZGVyW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImJsb2NrX3NpemVcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRTaXplLCBoZWFkZXIuc2V0U2l6ZSwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkZXB0aFwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldERlcHRoLCBoZWFkZXIuc2V0RGVwdGgsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGlmZmljdWx0eVwiKSB7IH0gIC8vIGhhbmRsZWQgYnkgd2lkZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3VtdWxhdGl2ZV9kaWZmaWN1bHR5XCIpIHsgfSAvLyBoYW5kbGVkIGJ5IHdpZGVfY3VtdWxhdGl2ZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGlmZmljdWx0eV90b3A2NFwiKSB7IH0gIC8vIGhhbmRsZWQgYnkgd2lkZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3VtdWxhdGl2ZV9kaWZmaWN1bHR5X3RvcDY0XCIpIHsgfSAvLyBoYW5kbGVkIGJ5IHdpZGVfY3VtdWxhdGl2ZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2lkZV9kaWZmaWN1bHR5XCIpIGhlYWRlci5zZXREaWZmaWN1bHR5KEdlblV0aWxzLnJlY29uY2lsZShoZWFkZXIuZ2V0RGlmZmljdWx0eSgpLCBNb25lcm9EYWVtb25ScGMucHJlZml4ZWRIZXhUb0JJKHZhbCkpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3aWRlX2N1bXVsYXRpdmVfZGlmZmljdWx0eVwiKSBoZWFkZXIuc2V0Q3VtdWxhdGl2ZURpZmZpY3VsdHkoR2VuVXRpbHMucmVjb25jaWxlKGhlYWRlci5nZXRDdW11bGF0aXZlRGlmZmljdWx0eSgpLCBNb25lcm9EYWVtb25ScGMucHJlZml4ZWRIZXhUb0JJKHZhbCkpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJoYXNoXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0SGFzaCwgaGVhZGVyLnNldEhhc2gsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGVpZ2h0XCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0SGVpZ2h0LCBoZWFkZXIuc2V0SGVpZ2h0LCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm1ham9yX3ZlcnNpb25cIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRNYWpvclZlcnNpb24sIGhlYWRlci5zZXRNYWpvclZlcnNpb24sIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibWlub3JfdmVyc2lvblwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldE1pbm9yVmVyc2lvbiwgaGVhZGVyLnNldE1pbm9yVmVyc2lvbiwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJub25jZVwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldE5vbmNlLCBoZWFkZXIuc2V0Tm9uY2UsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibnVtX3R4ZXNcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXROdW1UeHMsIGhlYWRlci5zZXROdW1UeHMsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwib3JwaGFuX3N0YXR1c1wiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldE9ycGhhblN0YXR1cywgaGVhZGVyLnNldE9ycGhhblN0YXR1cywgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwcmV2X2hhc2hcIiB8fCBrZXkgPT09IFwicHJldl9pZFwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldFByZXZIYXNoLCBoZWFkZXIuc2V0UHJldkhhc2gsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmV3YXJkXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0UmV3YXJkLCBoZWFkZXIuc2V0UmV3YXJkLCBCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidGltZXN0YW1wXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0VGltZXN0YW1wLCBoZWFkZXIuc2V0VGltZXN0YW1wLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX3dlaWdodFwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldFdlaWdodCwgaGVhZGVyLnNldFdlaWdodCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsb25nX3Rlcm1fd2VpZ2h0XCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0TG9uZ1Rlcm1XZWlnaHQsIGhlYWRlci5zZXRMb25nVGVybVdlaWdodCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwb3dfaGFzaFwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldFBvd0hhc2gsIGhlYWRlci5zZXRQb3dIYXNoLCB2YWwgPT09IFwiXCIgPyB1bmRlZmluZWQgOiB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X2hhc2hlc1wiKSB7fSAgLy8gdXNlZCBpbiBibG9jayBtb2RlbCwgbm90IGhlYWRlciBtb2RlbFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm1pbmVyX3R4XCIpIHt9ICAgLy8gdXNlZCBpbiBibG9jayBtb2RlbCwgbm90IGhlYWRlciBtb2RlbFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm1pbmVyX3R4X2hhc2hcIikgaGVhZGVyLnNldE1pbmVyVHhIYXNoKHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBibG9jayBoZWFkZXIgZmllbGQ6ICdcIiArIGtleSArIFwiJzogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gaGVhZGVyO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNCbG9jayhycGNCbG9jaykge1xuICAgIFxuICAgIC8vIGJ1aWxkIGJsb2NrXG4gICAgbGV0IGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQmxvY2tIZWFkZXIocnBjQmxvY2suYmxvY2tfaGVhZGVyID8gcnBjQmxvY2suYmxvY2tfaGVhZGVyIDogcnBjQmxvY2spIGFzIE1vbmVyb0Jsb2NrKTtcbiAgICBibG9jay5zZXRIZXgocnBjQmxvY2suYmxvYik7XG4gICAgYmxvY2suc2V0VHhIYXNoZXMocnBjQmxvY2sudHhfaGFzaGVzID09PSB1bmRlZmluZWQgPyBbXSA6IHJwY0Jsb2NrLnR4X2hhc2hlcyk7XG4gICAgXG4gICAgLy8gYnVpbGQgbWluZXIgdHhcbiAgICBsZXQgcnBjTWluZXJUeCA9IHJwY0Jsb2NrLmpzb24gPyBKU09OLnBhcnNlKHJwY0Jsb2NrLmpzb24pLm1pbmVyX3R4IDogcnBjQmxvY2subWluZXJfdHg7ICAvLyBtYXkgbmVlZCB0byBiZSBwYXJzZWQgZnJvbSBqc29uXG4gICAgbGV0IG1pbmVyVHggPSBuZXcgTW9uZXJvVHgoKTtcbiAgICBibG9jay5zZXRNaW5lclR4KG1pbmVyVHgpO1xuICAgIG1pbmVyVHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgbWluZXJUeC5zZXRJblR4UG9vbChmYWxzZSlcbiAgICBtaW5lclR4LnNldElzTWluZXJUeCh0cnVlKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1R4KHJwY01pbmVyVHgsIG1pbmVyVHgpO1xuICAgIFxuICAgIHJldHVybiBibG9jaztcbiAgfVxuICBcbiAgLyoqXG4gICAqIFRyYW5zZmVycyBSUEMgdHggZmllbGRzIHRvIGEgZ2l2ZW4gTW9uZXJvVHggd2l0aG91dCBvdmVyd3JpdGluZyBwcmV2aW91cyB2YWx1ZXMuXG4gICAqIFxuICAgKiBUT0RPOiBzd2l0Y2ggZnJvbSBzYWZlIHNldFxuICAgKiBcbiAgICogQHBhcmFtIHJwY1R4IC0gUlBDIG1hcCBjb250YWluaW5nIHRyYW5zYWN0aW9uIGZpZWxkc1xuICAgKiBAcGFyYW0gdHggIC0gTW9uZXJvVHggdG8gcG9wdWxhdGUgd2l0aCB2YWx1ZXMgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHR4IC0gc2FtZSB0eCB0aGF0IHdhcyBwYXNzZWQgaW4gb3IgYSBuZXcgb25lIGlmIG5vbmUgZ2l2ZW5cbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1R4KHJwY1R4LCB0eCkge1xuICAgIGlmIChycGNUeCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIGlmICh0eCA9PT0gdW5kZWZpbmVkKSB0eCA9IG5ldyBNb25lcm9UeCgpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgZnJvbSBycGMgbWFwXG4gICAgbGV0IGhlYWRlcjtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjVHgpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjVHhba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwidHhfaGFzaFwiIHx8IGtleSA9PT0gXCJpZF9oYXNoXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldEhhc2gsIHR4LnNldEhhc2gsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfdGltZXN0YW1wXCIpIHtcbiAgICAgICAgaWYgKCFoZWFkZXIpIGhlYWRlciA9IG5ldyBNb25lcm9CbG9ja0hlYWRlcigpO1xuICAgICAgICBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldFRpbWVzdGFtcCwgaGVhZGVyLnNldFRpbWVzdGFtcCwgdmFsKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja19oZWlnaHRcIikge1xuICAgICAgICBpZiAoIWhlYWRlcikgaGVhZGVyID0gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKCk7XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0SGVpZ2h0LCBoZWFkZXIuc2V0SGVpZ2h0LCB2YWwpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxhc3RfcmVsYXllZF90aW1lXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldExhc3RSZWxheWVkVGltZXN0YW1wLCB0eC5zZXRMYXN0UmVsYXllZFRpbWVzdGFtcCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyZWNlaXZlX3RpbWVcIiB8fCBrZXkgPT09IFwicmVjZWl2ZWRfdGltZXN0YW1wXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFJlY2VpdmVkVGltZXN0YW1wLCB0eC5zZXRSZWNlaXZlZFRpbWVzdGFtcCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjb25maXJtYXRpb25zXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldE51bUNvbmZpcm1hdGlvbnMsIHR4LnNldE51bUNvbmZpcm1hdGlvbnMsIHZhbCk7IFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImluX3Bvb2xcIikge1xuICAgICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc0NvbmZpcm1lZCwgdHguc2V0SXNDb25maXJtZWQsICF2YWwpO1xuICAgICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJblR4UG9vbCwgdHguc2V0SW5UeFBvb2wsIHZhbCk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZG91YmxlX3NwZW5kX3NlZW5cIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SXNEb3VibGVTcGVuZFNlZW4sIHR4LnNldElzRG91YmxlU3BlbmRTZWVuLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInZlcnNpb25cIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0VmVyc2lvbiwgdHguc2V0VmVyc2lvbiwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJleHRyYVwiKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdmFsID09PSBcInN0cmluZ1wiKSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGV4dHJhIGZpZWxkIGFzIHN0cmluZyBub3QgYmVpbmcgYXNpZ25lZCB0byBpbnRbXTogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpOyAvLyBUT0RPOiBob3cgdG8gc2V0IHN0cmluZyB0byBpbnRbXT8gLSBvciwgZXh0cmEgaXMgc3RyaW5nIHdoaWNoIGNhbiBlbmNvZGUgaW50W11cbiAgICAgICAgZWxzZSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRFeHRyYSwgdHguc2V0RXh0cmEsIG5ldyBVaW50OEFycmF5KHZhbCkpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInZpblwiKSB7XG4gICAgICAgIGlmICh2YWwubGVuZ3RoICE9PSAxIHx8ICF2YWxbMF0uZ2VuKSB7ICAvLyBpZ25vcmUgbWluZXIgaW5wdXQgVE9ETzogd2h5P1xuICAgICAgICAgIHR4LnNldElucHV0cyh2YWwubWFwKHJwY1ZpbiA9PiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY091dHB1dChycGNWaW4sIHR4KSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidm91dFwiKSB0eC5zZXRPdXRwdXRzKHZhbC5tYXAocnBjT3V0cHV0ID0+IE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjT3V0cHV0KHJwY091dHB1dCwgdHgpKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmN0X3NpZ25hdHVyZXNcIikge1xuICAgICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRSY3RTaWduYXR1cmVzLCB0eC5zZXRSY3RTaWduYXR1cmVzLCB2YWwpO1xuICAgICAgICBpZiAodmFsLnR4bkZlZSkgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0RmVlLCB0eC5zZXRGZWUsIEJpZ0ludCh2YWwudHhuRmVlKSk7XG4gICAgICB9IFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJjdHNpZ19wcnVuYWJsZVwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRSY3RTaWdQcnVuYWJsZSwgdHguc2V0UmN0U2lnUHJ1bmFibGUsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5sb2NrX3RpbWVcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0VW5sb2NrVGltZSwgdHguc2V0VW5sb2NrVGltZSwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhc19qc29uXCIgfHwga2V5ID09PSBcInR4X2pzb25cIikgeyB9ICAvLyBoYW5kbGVkIGxhc3Qgc28gdHggaXMgYXMgaW5pdGlhbGl6ZWQgYXMgcG9zc2libGVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhc19oZXhcIiB8fCBrZXkgPT09IFwidHhfYmxvYlwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRGdWxsSGV4LCB0eC5zZXRGdWxsSGV4LCB2YWwgPyB2YWwgOiB1bmRlZmluZWQpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2Jfc2l6ZVwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRTaXplLCB0eC5zZXRTaXplLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndlaWdodFwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRXZWlnaHQsIHR4LnNldFdlaWdodCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmZWVcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0RmVlLCB0eC5zZXRGZWUsIEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyZWxheWVkXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzUmVsYXllZCwgdHguc2V0SXNSZWxheWVkLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm91dHB1dF9pbmRpY2VzXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldE91dHB1dEluZGljZXMsIHR4LnNldE91dHB1dEluZGljZXMsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZG9fbm90X3JlbGF5XCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFJlbGF5LCB0eC5zZXRSZWxheSwgIXZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwia2VwdF9ieV9ibG9ja1wiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc0tlcHRCeUJsb2NrLCB0eC5zZXRJc0tlcHRCeUJsb2NrLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNpZ25hdHVyZXNcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0U2lnbmF0dXJlcywgdHguc2V0U2lnbmF0dXJlcywgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsYXN0X2ZhaWxlZF9oZWlnaHRcIikge1xuICAgICAgICBpZiAodmFsID09PSAwKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc0ZhaWxlZCwgdHguc2V0SXNGYWlsZWQsIGZhbHNlKTtcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SXNGYWlsZWQsIHR4LnNldElzRmFpbGVkLCB0cnVlKTtcbiAgICAgICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRMYXN0RmFpbGVkSGVpZ2h0LCB0eC5zZXRMYXN0RmFpbGVkSGVpZ2h0LCB2YWwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibGFzdF9mYWlsZWRfaWRfaGFzaFwiKSB7XG4gICAgICAgIGlmICh2YWwgPT09IE1vbmVyb0RhZW1vblJwYy5ERUZBVUxUX0lEKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc0ZhaWxlZCwgdHguc2V0SXNGYWlsZWQsIGZhbHNlKTtcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SXNGYWlsZWQsIHR4LnNldElzRmFpbGVkLCB0cnVlKTtcbiAgICAgICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRMYXN0RmFpbGVkSGFzaCwgdHguc2V0TGFzdEZhaWxlZEhhc2gsIHZhbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtYXhfdXNlZF9ibG9ja19oZWlnaHRcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0TWF4VXNlZEJsb2NrSGVpZ2h0LCB0eC5zZXRNYXhVc2VkQmxvY2tIZWlnaHQsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibWF4X3VzZWRfYmxvY2tfaWRfaGFzaFwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRNYXhVc2VkQmxvY2tIYXNoLCB0eC5zZXRNYXhVc2VkQmxvY2tIYXNoLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBydW5hYmxlX2hhc2hcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0UHJ1bmFibGVIYXNoLCB0eC5zZXRQcnVuYWJsZUhhc2gsIHZhbCA/IHZhbCA6IHVuZGVmaW5lZCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHJ1bmFibGVfYXNfaGV4XCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFBydW5hYmxlSGV4LCB0eC5zZXRQcnVuYWJsZUhleCwgdmFsID8gdmFsIDogdW5kZWZpbmVkKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwcnVuZWRfYXNfaGV4XCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFBydW5lZEhleCwgdHguc2V0UHJ1bmVkSGV4LCB2YWwgPyB2YWwgOiB1bmRlZmluZWQpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gcnBjIHR4OiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIFxuICAgIC8vIGxpbmsgYmxvY2sgYW5kIHR4XG4gICAgaWYgKGhlYWRlcikgdHguc2V0QmxvY2sobmV3IE1vbmVyb0Jsb2NrKGhlYWRlcikuc2V0VHhzKFt0eF0pKTtcbiAgICBcbiAgICAvLyBUT0RPIG1vbmVyb2Q6IHVuY29uZmlybWVkIHR4cyBtaXNyZXBvcnQgYmxvY2sgaGVpZ2h0IGFuZCB0aW1lc3RhbXA/XG4gICAgaWYgKHR4LmdldEJsb2NrKCkgJiYgdHguZ2V0QmxvY2soKS5nZXRIZWlnaHQoKSAhPT0gdW5kZWZpbmVkICYmIHR4LmdldEJsb2NrKCkuZ2V0SGVpZ2h0KCkgPT09IHR4LmdldEJsb2NrKCkuZ2V0VGltZXN0YW1wKCkpIHtcbiAgICAgIHR4LnNldEJsb2NrKHVuZGVmaW5lZCk7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgfVxuICAgIFxuICAgIC8vIGluaXRpYWxpemUgcmVtYWluaW5nIGtub3duIGZpZWxkc1xuICAgIGlmICh0eC5nZXRJc0NvbmZpcm1lZCgpKSB7XG4gICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc1JlbGF5ZWQsIHR4LnNldElzUmVsYXllZCwgdHJ1ZSk7XG4gICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRSZWxheSwgdHguc2V0UmVsYXksIHRydWUpO1xuICAgICAgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SXNGYWlsZWQsIHR4LnNldElzRmFpbGVkLCBmYWxzZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHR4LnNldE51bUNvbmZpcm1hdGlvbnMoMCk7XG4gICAgfVxuICAgIGlmICh0eC5nZXRJc0ZhaWxlZCgpID09PSB1bmRlZmluZWQpIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICBpZiAodHguZ2V0T3V0cHV0SW5kaWNlcygpICYmIHR4LmdldE91dHB1dHMoKSkgIHtcbiAgICAgIGFzc2VydC5lcXVhbCh0eC5nZXRPdXRwdXRzKCkubGVuZ3RoLCB0eC5nZXRPdXRwdXRJbmRpY2VzKCkubGVuZ3RoKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdHguZ2V0T3V0cHV0cygpLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHR4LmdldE91dHB1dHMoKVtpXS5zZXRJbmRleCh0eC5nZXRPdXRwdXRJbmRpY2VzKClbaV0pOyAgLy8gdHJhbnNmZXIgb3V0cHV0IGluZGljZXMgdG8gb3V0cHV0c1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAocnBjVHguYXNfanNvbikgTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNUeChKU09OLnBhcnNlKHJwY1R4LmFzX2pzb24pLCB0eCk7XG4gICAgaWYgKHJwY1R4LnR4X2pzb24pIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVHgoSlNPTi5wYXJzZShycGNUeC50eF9qc29uKSwgdHgpO1xuICAgIGlmICghdHguZ2V0SXNSZWxheWVkKCkpIHR4LnNldExhc3RSZWxheWVkVGltZXN0YW1wKHVuZGVmaW5lZCk7ICAvLyBUT0RPIG1vbmVyb2Q6IHJldHVybnMgbGFzdF9yZWxheWVkX3RpbWVzdGFtcCBkZXNwaXRlIHJlbGF5ZWQ6IGZhbHNlLCBzZWxmIGluY29uc2lzdGVudFxuICAgIFxuICAgIC8vIHJldHVybiBidWlsdCB0cmFuc2FjdGlvblxuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjT3V0cHV0KHJwY091dHB1dCwgdHgpIHtcbiAgICBsZXQgb3V0cHV0ID0gbmV3IE1vbmVyb091dHB1dCgpO1xuICAgIG91dHB1dC5zZXRUeCh0eCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY091dHB1dCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNPdXRwdXRba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiZ2VuXCIpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk91dHB1dCB3aXRoICdnZW4nIGZyb20gZGFlbW9uIHJwYyBpcyBtaW5lciB0eCB3aGljaCB3ZSBpZ25vcmUgKGkuZS4gZWFjaCBtaW5lciBpbnB1dCBpcyB1bmRlZmluZWQpXCIpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImtleVwiKSB7XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQob3V0cHV0LCBvdXRwdXQuZ2V0QW1vdW50LCBvdXRwdXQuc2V0QW1vdW50LCBCaWdJbnQodmFsLmFtb3VudCkpO1xuICAgICAgICBHZW5VdGlscy5zYWZlU2V0KG91dHB1dCwgb3V0cHV0LmdldEtleUltYWdlLCBvdXRwdXQuc2V0S2V5SW1hZ2UsIG5ldyBNb25lcm9LZXlJbWFnZSh2YWwua19pbWFnZSkpO1xuICAgICAgICBHZW5VdGlscy5zYWZlU2V0KG91dHB1dCwgb3V0cHV0LmdldFJpbmdPdXRwdXRJbmRpY2VzLCBvdXRwdXQuc2V0UmluZ091dHB1dEluZGljZXMsIHZhbC5rZXlfb2Zmc2V0cyk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYW1vdW50XCIpIEdlblV0aWxzLnNhZmVTZXQob3V0cHV0LCBvdXRwdXQuZ2V0QW1vdW50LCBvdXRwdXQuc2V0QW1vdW50LCBCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidGFyZ2V0XCIpIHtcbiAgICAgICAgbGV0IHB1YktleSA9IHZhbC5rZXkgPT09IHVuZGVmaW5lZCA/IHZhbC50YWdnZWRfa2V5LmtleSA6IHZhbC5rZXk7IC8vIFRPRE8gKG1vbmVyb2QpOiBycGMganNvbiB1c2VzIHt0YWdnZWRfa2V5PXtrZXk9Li4ufX0sIGJpbmFyeSBibG9ja3MgdXNlIHtrZXk9Li4ufVxuICAgICAgICBHZW5VdGlscy5zYWZlU2V0KG91dHB1dCwgb3V0cHV0LmdldFN0ZWFsdGhQdWJsaWNLZXksIG91dHB1dC5zZXRTdGVhbHRoUHVibGljS2V5LCBwdWJLZXkpO1xuICAgICAgfVxuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgb3V0cHV0OiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBvdXRwdXQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY0Jsb2NrVGVtcGxhdGUocnBjVGVtcGxhdGUpIHtcbiAgICBsZXQgdGVtcGxhdGUgPSBuZXcgTW9uZXJvQmxvY2tUZW1wbGF0ZSgpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNUZW1wbGF0ZSkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNUZW1wbGF0ZVtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJibG9ja2hhc2hpbmdfYmxvYlwiKSB0ZW1wbGF0ZS5zZXRCbG9ja1RlbXBsYXRlQmxvYih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrdGVtcGxhdGVfYmxvYlwiKSB0ZW1wbGF0ZS5zZXRCbG9ja0hhc2hpbmdCbG9iKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGlmZmljdWx0eVwiKSB0ZW1wbGF0ZS5zZXREaWZmaWN1bHR5KEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJleHBlY3RlZF9yZXdhcmRcIikgdGVtcGxhdGUuc2V0RXhwZWN0ZWRSZXdhcmQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5XCIpIHsgfSAgLy8gaGFuZGxlZCBieSB3aWRlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5X3RvcDY0XCIpIHsgfSAgLy8gaGFuZGxlZCBieSB3aWRlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3aWRlX2RpZmZpY3VsdHlcIikgdGVtcGxhdGUuc2V0RGlmZmljdWx0eShHZW5VdGlscy5yZWNvbmNpbGUodGVtcGxhdGUuZ2V0RGlmZmljdWx0eSgpLCBNb25lcm9EYWVtb25ScGMucHJlZml4ZWRIZXhUb0JJKHZhbCkpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJoZWlnaHRcIikgdGVtcGxhdGUuc2V0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHJldl9oYXNoXCIpIHRlbXBsYXRlLnNldFByZXZIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVzZXJ2ZWRfb2Zmc2V0XCIpIHRlbXBsYXRlLnNldFJlc2VydmVkT2Zmc2V0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3RhdHVzXCIpIHt9ICAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVudHJ1c3RlZFwiKSB7fSAgLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzZWVkX2hlaWdodFwiKSB0ZW1wbGF0ZS5zZXRTZWVkSGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic2VlZF9oYXNoXCIpIHRlbXBsYXRlLnNldFNlZWRIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibmV4dF9zZWVkX2hhc2hcIikgdGVtcGxhdGUuc2V0TmV4dFNlZWRIYXNoKHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBibG9jayB0ZW1wbGF0ZTogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICBpZiAoXCJcIiA9PT0gdGVtcGxhdGUuZ2V0TmV4dFNlZWRIYXNoKCkpIHRlbXBsYXRlLnNldE5leHRTZWVkSGFzaCh1bmRlZmluZWQpO1xuICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjSW5mbyhycGNJbmZvKSB7XG4gICAgaWYgKCFycGNJbmZvKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIGxldCBpbmZvID0gbmV3IE1vbmVyb0RhZW1vbkluZm8oKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjSW5mbykpIHtcbiAgICAgIGxldCB2YWwgPSBycGNJbmZvW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcInZlcnNpb25cIikgaW5mby5zZXRWZXJzaW9uKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYWx0X2Jsb2Nrc19jb3VudFwiKSBpbmZvLnNldE51bUFsdEJsb2Nrcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX3NpemVfbGltaXRcIikgaW5mby5zZXRCbG9ja1NpemVMaW1pdCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX3NpemVfbWVkaWFuXCIpIGluZm8uc2V0QmxvY2tTaXplTWVkaWFuKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfd2VpZ2h0X2xpbWl0XCIpIGluZm8uc2V0QmxvY2tXZWlnaHRMaW1pdCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX3dlaWdodF9tZWRpYW5cIikgaW5mby5zZXRCbG9ja1dlaWdodE1lZGlhbih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJvb3RzdHJhcF9kYWVtb25fYWRkcmVzc1wiKSB7IGlmICh2YWwpIGluZm8uc2V0Qm9vdHN0cmFwRGFlbW9uQWRkcmVzcyh2YWwpOyB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGlmZmljdWx0eVwiKSB7IH0gIC8vIGhhbmRsZWQgYnkgd2lkZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3VtdWxhdGl2ZV9kaWZmaWN1bHR5XCIpIHsgfSAvLyBoYW5kbGVkIGJ5IHdpZGVfY3VtdWxhdGl2ZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGlmZmljdWx0eV90b3A2NFwiKSB7IH0gIC8vIGhhbmRsZWQgYnkgd2lkZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3VtdWxhdGl2ZV9kaWZmaWN1bHR5X3RvcDY0XCIpIHsgfSAvLyBoYW5kbGVkIGJ5IHdpZGVfY3VtdWxhdGl2ZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2lkZV9kaWZmaWN1bHR5XCIpIGluZm8uc2V0RGlmZmljdWx0eShHZW5VdGlscy5yZWNvbmNpbGUoaW5mby5nZXREaWZmaWN1bHR5KCksIE1vbmVyb0RhZW1vblJwYy5wcmVmaXhlZEhleFRvQkkodmFsKSkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndpZGVfY3VtdWxhdGl2ZV9kaWZmaWN1bHR5XCIpIGluZm8uc2V0Q3VtdWxhdGl2ZURpZmZpY3VsdHkoR2VuVXRpbHMucmVjb25jaWxlKGluZm8uZ2V0Q3VtdWxhdGl2ZURpZmZpY3VsdHkoKSwgTW9uZXJvRGFlbW9uUnBjLnByZWZpeGVkSGV4VG9CSSh2YWwpKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZnJlZV9zcGFjZVwiKSBpbmZvLnNldEZyZWVTcGFjZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGF0YWJhc2Vfc2l6ZVwiKSBpbmZvLnNldERhdGFiYXNlU2l6ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImdyZXlfcGVlcmxpc3Rfc2l6ZVwiKSBpbmZvLnNldE51bU9mZmxpbmVQZWVycyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhlaWdodFwiKSBpbmZvLnNldEhlaWdodCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhlaWdodF93aXRob3V0X2Jvb3RzdHJhcFwiKSBpbmZvLnNldEhlaWdodFdpdGhvdXRCb290c3RyYXAodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJpbmNvbWluZ19jb25uZWN0aW9uc19jb3VudFwiKSBpbmZvLnNldE51bUluY29taW5nQ29ubmVjdGlvbnModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJvZmZsaW5lXCIpIGluZm8uc2V0SXNPZmZsaW5lKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwib3V0Z29pbmdfY29ubmVjdGlvbnNfY291bnRcIikgaW5mby5zZXROdW1PdXRnb2luZ0Nvbm5lY3Rpb25zKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicnBjX2Nvbm5lY3Rpb25zX2NvdW50XCIpIGluZm8uc2V0TnVtUnBjQ29ubmVjdGlvbnModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGFydF90aW1lXCIpIGluZm8uc2V0U3RhcnRUaW1lc3RhbXAodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhZGp1c3RlZF90aW1lXCIpIGluZm8uc2V0QWRqdXN0ZWRUaW1lc3RhbXAodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGF0dXNcIikge30gIC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidGFyZ2V0XCIpIGluZm8uc2V0VGFyZ2V0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidGFyZ2V0X2hlaWdodFwiKSBpbmZvLnNldFRhcmdldEhlaWdodCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRvcF9ibG9ja19oYXNoXCIpIGluZm8uc2V0VG9wQmxvY2tIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfY291bnRcIikgaW5mby5zZXROdW1UeHModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9wb29sX3NpemVcIikgaW5mby5zZXROdW1UeHNQb29sKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW50cnVzdGVkXCIpIHt9IC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2FzX2Jvb3RzdHJhcF9ldmVyX3VzZWRcIikgaW5mby5zZXRXYXNCb290c3RyYXBFdmVyVXNlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndoaXRlX3BlZXJsaXN0X3NpemVcIikgaW5mby5zZXROdW1PbmxpbmVQZWVycyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVwZGF0ZV9hdmFpbGFibGVcIikgaW5mby5zZXRVcGRhdGVBdmFpbGFibGUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJuZXR0eXBlXCIpIEdlblV0aWxzLnNhZmVTZXQoaW5mbywgaW5mby5nZXROZXR3b3JrVHlwZSwgaW5mby5zZXROZXR3b3JrVHlwZSwgTW9uZXJvTmV0d29ya1R5cGUucGFyc2UodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibWFpbm5ldFwiKSB7IGlmICh2YWwpIEdlblV0aWxzLnNhZmVTZXQoaW5mbywgaW5mby5nZXROZXR3b3JrVHlwZSwgaW5mby5zZXROZXR3b3JrVHlwZSwgTW9uZXJvTmV0d29ya1R5cGUuTUFJTk5FVCk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0ZXN0bmV0XCIpIHsgaWYgKHZhbCkgR2VuVXRpbHMuc2FmZVNldChpbmZvLCBpbmZvLmdldE5ldHdvcmtUeXBlLCBpbmZvLnNldE5ldHdvcmtUeXBlLCBNb25lcm9OZXR3b3JrVHlwZS5URVNUTkVUKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YWdlbmV0XCIpIHsgaWYgKHZhbCkgR2VuVXRpbHMuc2FmZVNldChpbmZvLCBpbmZvLmdldE5ldHdvcmtUeXBlLCBpbmZvLnNldE5ldHdvcmtUeXBlLCBNb25lcm9OZXR3b3JrVHlwZS5TVEFHRU5FVCk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjcmVkaXRzXCIpIGluZm8uc2V0Q3JlZGl0cyhCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidG9wX2Jsb2NrX2hhc2hcIiB8fCBrZXkgPT09IFwidG9wX2hhc2hcIikgaW5mby5zZXRUb3BCbG9ja0hhc2goR2VuVXRpbHMucmVjb25jaWxlKGluZm8uZ2V0VG9wQmxvY2tIYXNoKCksIFwiXCIgPT09IHZhbCA/IHVuZGVmaW5lZCA6IHZhbCkpXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYnVzeV9zeW5jaW5nXCIpIGluZm8uc2V0SXNCdXN5U3luY2luZyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN5bmNocm9uaXplZFwiKSBpbmZvLnNldElzU3luY2hyb25pemVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVzdHJpY3RlZFwiKSBpbmZvLnNldElzUmVzdHJpY3RlZCh2YWwpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IElnbm9yaW5nIHVuZXhwZWN0ZWQgaW5mbyBmaWVsZDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gaW5mbztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHN5bmMgaW5mbyBmcm9tIFJQQyBzeW5jIGluZm8uXG4gICAqIFxuICAgKiBAcGFyYW0gcnBjU3luY0luZm8gLSBycGMgbWFwIHRvIGluaXRpYWxpemUgdGhlIHN5bmMgaW5mbyBmcm9tXG4gICAqIEByZXR1cm4ge01vbmVyb0RhZW1vblN5bmNJbmZvfSBpcyBzeW5jIGluZm8gaW5pdGlhbGl6ZWQgZnJvbSB0aGUgbWFwXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNTeW5jSW5mbyhycGNTeW5jSW5mbykge1xuICAgIGxldCBzeW5jSW5mbyA9IG5ldyBNb25lcm9EYWVtb25TeW5jSW5mbygpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNTeW5jSW5mbykpIHtcbiAgICAgIGxldCB2YWwgPSBycGNTeW5jSW5mb1trZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJoZWlnaHRcIikgc3luY0luZm8uc2V0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicGVlcnNcIikge1xuICAgICAgICBzeW5jSW5mby5zZXRQZWVycyhbXSk7XG4gICAgICAgIGxldCBycGNDb25uZWN0aW9ucyA9IHZhbDtcbiAgICAgICAgZm9yIChsZXQgcnBjQ29ubmVjdGlvbiBvZiBycGNDb25uZWN0aW9ucykge1xuICAgICAgICAgIHN5bmNJbmZvLmdldFBlZXJzKCkucHVzaChNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Nvbm5lY3Rpb24ocnBjQ29ubmVjdGlvbi5pbmZvKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzcGFuc1wiKSB7XG4gICAgICAgIHN5bmNJbmZvLnNldFNwYW5zKFtdKTtcbiAgICAgICAgbGV0IHJwY1NwYW5zID0gdmFsO1xuICAgICAgICBmb3IgKGxldCBycGNTcGFuIG9mIHJwY1NwYW5zKSB7XG4gICAgICAgICAgc3luY0luZm8uZ2V0U3BhbnMoKS5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQ29ubmVjdGlvblNwYW4ocnBjU3BhbikpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGtleSA9PT0gXCJzdGF0dXNcIikge30gICAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRhcmdldF9oZWlnaHRcIikgc3luY0luZm8uc2V0VGFyZ2V0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibmV4dF9uZWVkZWRfcHJ1bmluZ19zZWVkXCIpIHN5bmNJbmZvLnNldE5leHROZWVkZWRQcnVuaW5nU2VlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm92ZXJ2aWV3XCIpIHsgIC8vIHRoaXMgcmV0dXJucyBbXSB3aXRob3V0IHBydW5pbmdcbiAgICAgICAgbGV0IG92ZXJ2aWV3O1xuICAgICAgICB0cnkge1xuICAgICAgICAgIG92ZXJ2aWV3ID0gSlNPTi5wYXJzZSh2YWwpO1xuICAgICAgICAgIGlmIChvdmVydmlldyAhPT0gdW5kZWZpbmVkICYmIG92ZXJ2aWV3Lmxlbmd0aCA+IDApIGNvbnNvbGUuZXJyb3IoXCJJZ25vcmluZyBub24tZW1wdHkgJ292ZXJ2aWV3JyBmaWVsZCAobm90IGltcGxlbWVudGVkKTogXCIgKyBvdmVydmlldyk7IC8vIFRPRE9cbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBwYXJzZSAnb3ZlcnZpZXcnIGZpZWxkOiBcIiArIG92ZXJ2aWV3ICsgXCI6IFwiICsgZS5tZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNyZWRpdHNcIikgc3luY0luZm8uc2V0Q3JlZGl0cyhCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidG9wX2hhc2hcIikgc3luY0luZm8uc2V0VG9wQmxvY2tIYXNoKFwiXCIgPT09IHZhbCA/IHVuZGVmaW5lZCA6IHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW50cnVzdGVkXCIpIHt9ICAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gc3luYyBpbmZvOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBzeW5jSW5mbztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjSGFyZEZvcmtJbmZvKHJwY0hhcmRGb3JrSW5mbykge1xuICAgIGxldCBpbmZvID0gbmV3IE1vbmVyb0hhcmRGb3JrSW5mbygpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNIYXJkRm9ya0luZm8pKSB7XG4gICAgICBsZXQgdmFsID0gcnBjSGFyZEZvcmtJbmZvW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImVhcmxpZXN0X2hlaWdodFwiKSBpbmZvLnNldEVhcmxpZXN0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZW5hYmxlZFwiKSBpbmZvLnNldElzRW5hYmxlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXRlXCIpIGluZm8uc2V0U3RhdGUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGF0dXNcIikge30gICAgIC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW50cnVzdGVkXCIpIHt9ICAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRocmVzaG9sZFwiKSBpbmZvLnNldFRocmVzaG9sZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInZlcnNpb25cIikgaW5mby5zZXRWZXJzaW9uKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidm90ZXNcIikgaW5mby5zZXROdW1Wb3Rlcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInZvdGluZ1wiKSBpbmZvLnNldFZvdGluZyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndpbmRvd1wiKSBpbmZvLnNldFdpbmRvdyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNyZWRpdHNcIikgaW5mby5zZXRDcmVkaXRzKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0b3BfaGFzaFwiKSBpbmZvLnNldFRvcEJsb2NrSGFzaChcIlwiID09PSB2YWwgPyB1bmRlZmluZWQgOiB2YWwpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gaGFyZCBmb3JrIGluZm86IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIGluZm87XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY0Nvbm5lY3Rpb25TcGFuKHJwY0Nvbm5lY3Rpb25TcGFuKSB7XG4gICAgbGV0IHNwYW4gPSBuZXcgTW9uZXJvQ29ubmVjdGlvblNwYW4oKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjQ29ubmVjdGlvblNwYW4pKSB7XG4gICAgICBsZXQgdmFsID0gcnBjQ29ubmVjdGlvblNwYW5ba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiY29ubmVjdGlvbl9pZFwiKSBzcGFuLnNldENvbm5lY3Rpb25JZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm5ibG9ja3NcIikgc3Bhbi5zZXROdW1CbG9ja3ModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyYXRlXCIpIHNwYW4uc2V0UmF0ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJlbW90ZV9hZGRyZXNzXCIpIHsgaWYgKHZhbCAhPT0gXCJcIikgc3Bhbi5zZXRSZW1vdGVBZGRyZXNzKHZhbCk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzaXplXCIpIHNwYW4uc2V0U2l6ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNwZWVkXCIpIHNwYW4uc2V0U3BlZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGFydF9ibG9ja19oZWlnaHRcIikgc3Bhbi5zZXRTdGFydEhlaWdodCh2YWwpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gZGFlbW9uIGNvbm5lY3Rpb24gc3BhbjogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gc3BhbjtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjT3V0cHV0SGlzdG9ncmFtRW50cnkocnBjRW50cnkpIHtcbiAgICBsZXQgZW50cnkgPSBuZXcgTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjRW50cnkpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjRW50cnlba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYW1vdW50XCIpIGVudHJ5LnNldEFtb3VudChCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidG90YWxfaW5zdGFuY2VzXCIpIGVudHJ5LnNldE51bUluc3RhbmNlcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVubG9ja2VkX2luc3RhbmNlc1wiKSBlbnRyeS5zZXROdW1VbmxvY2tlZEluc3RhbmNlcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJlY2VudF9pbnN0YW5jZXNcIikgZW50cnkuc2V0TnVtUmVjZW50SW5zdGFuY2VzKHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBvdXRwdXQgaGlzdG9ncmFtOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBlbnRyeTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjU3VibWl0VHhSZXN1bHQocnBjUmVzdWx0KSB7XG4gICAgYXNzZXJ0KHJwY1Jlc3VsdCk7XG4gICAgbGV0IHJlc3VsdCA9IG5ldyBNb25lcm9TdWJtaXRUeFJlc3VsdCgpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNSZXN1bHQpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjUmVzdWx0W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImRvdWJsZV9zcGVuZFwiKSByZXN1bHQuc2V0SXNEb3VibGVTcGVuZFNlZW4odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmZWVfdG9vX2xvd1wiKSByZXN1bHQuc2V0SXNGZWVUb29Mb3codmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJpbnZhbGlkX2lucHV0XCIpIHJlc3VsdC5zZXRIYXNJbnZhbGlkSW5wdXQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJpbnZhbGlkX291dHB1dFwiKSByZXN1bHQuc2V0SGFzSW52YWxpZE91dHB1dCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRvb19mZXdfb3V0cHV0c1wiKSByZXN1bHQuc2V0SGFzVG9vRmV3T3V0cHV0cyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxvd19taXhpblwiKSByZXN1bHQuc2V0SXNNaXhpblRvb0xvdyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm5vdF9yZWxheWVkXCIpIHJlc3VsdC5zZXRJc1JlbGF5ZWQoIXZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwib3ZlcnNwZW5kXCIpIHJlc3VsdC5zZXRJc092ZXJzcGVuZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJlYXNvblwiKSByZXN1bHQuc2V0UmVhc29uKHZhbCA9PT0gXCJcIiA/IHVuZGVmaW5lZCA6IHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidG9vX2JpZ1wiKSByZXN1bHQuc2V0SXNUb29CaWcodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzYW5pdHlfY2hlY2tfZmFpbGVkXCIpIHJlc3VsdC5zZXRTYW5pdHlDaGVja0ZhaWxlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNyZWRpdHNcIikgcmVzdWx0LnNldENyZWRpdHMoQmlnSW50KHZhbCkpXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3RhdHVzXCIgfHwga2V5ID09PSBcInVudHJ1c3RlZFwiKSB7fSAgLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0b3BfaGFzaFwiKSByZXN1bHQuc2V0VG9wQmxvY2tIYXNoKFwiXCIgPT09IHZhbCA/IHVuZGVmaW5lZCA6IHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfZXh0cmFfdG9vX2JpZ1wiKSByZXN1bHQuc2V0SXNUeEV4dHJhVG9vQmlnKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibm9uemVyb191bmxvY2tfdGltZVwiKSByZXN1bHQuc2V0SXNOb256ZXJvVW5sb2NrVGltZSh2YWwpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gc3VibWl0IHR4IGhleCByZXN1bHQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVHhQb29sU3RhdHMocnBjU3RhdHMpIHtcbiAgICBhc3NlcnQocnBjU3RhdHMpO1xuICAgIGxldCBzdGF0cyA9IG5ldyBNb25lcm9UeFBvb2xTdGF0cygpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNTdGF0cykpIHtcbiAgICAgIGxldCB2YWwgPSBycGNTdGF0c1trZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJieXRlc19tYXhcIikgc3RhdHMuc2V0Qnl0ZXNNYXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJieXRlc19tZWRcIikgc3RhdHMuc2V0Qnl0ZXNNZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJieXRlc19taW5cIikgc3RhdHMuc2V0Qnl0ZXNNaW4odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJieXRlc190b3RhbFwiKSBzdGF0cy5zZXRCeXRlc1RvdGFsKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGlzdG9fOThwY1wiKSBzdGF0cy5zZXRIaXN0bzk4cGModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJudW1fMTBtXCIpIHN0YXRzLnNldE51bTEwbSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm51bV9kb3VibGVfc3BlbmRzXCIpIHN0YXRzLnNldE51bURvdWJsZVNwZW5kcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm51bV9mYWlsaW5nXCIpIHN0YXRzLnNldE51bUZhaWxpbmcodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJudW1fbm90X3JlbGF5ZWRcIikgc3RhdHMuc2V0TnVtTm90UmVsYXllZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm9sZGVzdFwiKSBzdGF0cy5zZXRPbGRlc3RUaW1lc3RhbXAodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eHNfdG90YWxcIikgc3RhdHMuc2V0TnVtVHhzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZmVlX3RvdGFsXCIpIHN0YXRzLnNldEZlZVRvdGFsKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJoaXN0b1wiKSB7XG4gICAgICAgIHN0YXRzLnNldEhpc3RvKG5ldyBNYXAoKSk7XG4gICAgICAgIGZvciAobGV0IGVsZW0gb2YgdmFsKSBzdGF0cy5nZXRIaXN0bygpLnNldChlbGVtLmJ5dGVzLCBlbGVtLnR4cyk7XG4gICAgICB9XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiB0eCBwb29sIHN0YXRzOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuXG4gICAgLy8gdW5pbml0aWFsaXplIHNvbWUgc3RhdHMgaWYgbm90IGFwcGxpY2FibGVcbiAgICBpZiAoc3RhdHMuZ2V0SGlzdG85OHBjKCkgPT09IDApIHN0YXRzLnNldEhpc3RvOThwYyh1bmRlZmluZWQpO1xuICAgIGlmIChzdGF0cy5nZXROdW1UeHMoKSA9PT0gMCkge1xuICAgICAgc3RhdHMuc2V0Qnl0ZXNNaW4odW5kZWZpbmVkKTtcbiAgICAgIHN0YXRzLnNldEJ5dGVzTWVkKHVuZGVmaW5lZCk7XG4gICAgICBzdGF0cy5zZXRCeXRlc01heCh1bmRlZmluZWQpO1xuICAgICAgc3RhdHMuc2V0SGlzdG85OHBjKHVuZGVmaW5lZCk7XG4gICAgICBzdGF0cy5zZXRPbGRlc3RUaW1lc3RhbXAodW5kZWZpbmVkKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3RhdHM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY0FsdENoYWluKHJwY0NoYWluKSB7XG4gICAgYXNzZXJ0KHJwY0NoYWluKTtcbiAgICBsZXQgY2hhaW4gPSBuZXcgTW9uZXJvQWx0Q2hhaW4oKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjQ2hhaW4pKSB7XG4gICAgICBsZXQgdmFsID0gcnBjQ2hhaW5ba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYmxvY2tfaGFzaFwiKSB7fSAgLy8gdXNpbmcgYmxvY2tfaGFzaGVzIGluc3RlYWRcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5XCIpIHsgfSAvLyBoYW5kbGVkIGJ5IHdpZGVfZGlmZmljdWx0eVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRpZmZpY3VsdHlfdG9wNjRcIikgeyB9ICAvLyBoYW5kbGVkIGJ5IHdpZGVfZGlmZmljdWx0eVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndpZGVfZGlmZmljdWx0eVwiKSBjaGFpbi5zZXREaWZmaWN1bHR5KEdlblV0aWxzLnJlY29uY2lsZShjaGFpbi5nZXREaWZmaWN1bHR5KCksIE1vbmVyb0RhZW1vblJwYy5wcmVmaXhlZEhleFRvQkkodmFsKSkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhlaWdodFwiKSBjaGFpbi5zZXRIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsZW5ndGhcIikgY2hhaW4uc2V0TGVuZ3RoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfaGFzaGVzXCIpIGNoYWluLnNldEJsb2NrSGFzaGVzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibWFpbl9jaGFpbl9wYXJlbnRfYmxvY2tcIikgY2hhaW4uc2V0TWFpbkNoYWluUGFyZW50QmxvY2tIYXNoKHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBhbHRlcm5hdGl2ZSBjaGFpbjogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gY2hhaW47XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1BlZXIocnBjUGVlcikge1xuICAgIGFzc2VydChycGNQZWVyKTtcbiAgICBsZXQgcGVlciA9IG5ldyBNb25lcm9QZWVyKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1BlZXIpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjUGVlcltrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJob3N0XCIpIHBlZXIuc2V0SG9zdCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImlkXCIpIHBlZXIuc2V0SWQoXCJcIiArIHZhbCk7ICAvLyBUT0RPIG1vbmVyby13YWxsZXQtcnBjOiBwZWVyIGlkIGlzIEJpZ0ludCBidXQgc3RyaW5nIGluIGBnZXRfY29ubmVjdGlvbnNgXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaXBcIikge30gLy8gaG9zdCB1c2VkIGluc3RlYWQgd2hpY2ggaXMgY29uc2lzdGVudGx5IGEgc3RyaW5nXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibGFzdF9zZWVuXCIpIHBlZXIuc2V0TGFzdFNlZW5UaW1lc3RhbXAodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwb3J0XCIpIHBlZXIuc2V0UG9ydCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJwY19wb3J0XCIpIHBlZXIuc2V0UnBjUG9ydCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBydW5pbmdfc2VlZFwiKSBwZWVyLnNldFBydW5pbmdTZWVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicnBjX2NyZWRpdHNfcGVyX2hhc2hcIikgcGVlci5zZXRScGNDcmVkaXRzUGVySGFzaChCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBycGMgcGVlcjogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gcGVlcjtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjQ29ubmVjdGlvbihycGNDb25uZWN0aW9uKSB7XG4gICAgbGV0IHBlZXIgPSBuZXcgTW9uZXJvUGVlcigpO1xuICAgIHBlZXIuc2V0SXNPbmxpbmUodHJ1ZSk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY0Nvbm5lY3Rpb24pKSB7XG4gICAgICBsZXQgdmFsID0gcnBjQ29ubmVjdGlvbltrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJhZGRyZXNzXCIpIHBlZXIuc2V0QWRkcmVzcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImF2Z19kb3dubG9hZFwiKSBwZWVyLnNldEF2Z0Rvd25sb2FkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYXZnX3VwbG9hZFwiKSBwZWVyLnNldEF2Z1VwbG9hZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNvbm5lY3Rpb25faWRcIikgcGVlci5zZXRJZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImN1cnJlbnRfZG93bmxvYWRcIikgcGVlci5zZXRDdXJyZW50RG93bmxvYWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjdXJyZW50X3VwbG9hZFwiKSBwZWVyLnNldEN1cnJlbnRVcGxvYWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJoZWlnaHRcIikgcGVlci5zZXRIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJob3N0XCIpIHBlZXIuc2V0SG9zdCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImlwXCIpIHt9IC8vIGhvc3QgdXNlZCBpbnN0ZWFkIHdoaWNoIGlzIGNvbnNpc3RlbnRseSBhIHN0cmluZ1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImluY29taW5nXCIpIHBlZXIuc2V0SXNJbmNvbWluZyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxpdmVfdGltZVwiKSBwZWVyLnNldExpdmVUaW1lKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibG9jYWxfaXBcIikgcGVlci5zZXRJc0xvY2FsSXAodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsb2NhbGhvc3RcIikgcGVlci5zZXRJc0xvY2FsSG9zdCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBlZXJfaWRcIikgcGVlci5zZXRJZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBvcnRcIikgcGVlci5zZXRQb3J0KHBhcnNlSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJwY19wb3J0XCIpIHBlZXIuc2V0UnBjUG9ydCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJlY3ZfY291bnRcIikgcGVlci5zZXROdW1SZWNlaXZlcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJlY3ZfaWRsZV90aW1lXCIpIHBlZXIuc2V0UmVjZWl2ZUlkbGVUaW1lKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic2VuZF9jb3VudFwiKSBwZWVyLnNldE51bVNlbmRzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic2VuZF9pZGxlX3RpbWVcIikgcGVlci5zZXRTZW5kSWRsZVRpbWUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGF0ZVwiKSBwZWVyLnNldFN0YXRlKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3VwcG9ydF9mbGFnc1wiKSBwZWVyLnNldE51bVN1cHBvcnRGbGFncyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBydW5pbmdfc2VlZFwiKSBwZWVyLnNldFBydW5pbmdTZWVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicnBjX2NyZWRpdHNfcGVyX2hhc2hcIikgcGVlci5zZXRScGNDcmVkaXRzUGVySGFzaChCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYWRkcmVzc190eXBlXCIpIHBlZXIuc2V0VHlwZSh2YWwpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gcGVlcjogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gcGVlcjtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0VG9ScGNCYW4oYmFuOiBNb25lcm9CYW4pIHtcbiAgICBsZXQgcnBjQmFuOiBhbnkgPSB7fTtcbiAgICBycGNCYW4uaG9zdCA9IGJhbi5nZXRIb3N0KCk7XG4gICAgcnBjQmFuLmlwID0gYmFuLmdldElwKCk7XG4gICAgcnBjQmFuLmJhbiA9IGJhbi5nZXRJc0Jhbm5lZCgpO1xuICAgIHJwY0Jhbi5zZWNvbmRzID0gYmFuLmdldFNlY29uZHMoKTtcbiAgICByZXR1cm4gcnBjQmFuO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNNaW5pbmdTdGF0dXMocnBjU3RhdHVzKSB7XG4gICAgbGV0IHN0YXR1cyA9IG5ldyBNb25lcm9NaW5pbmdTdGF0dXMoKTtcbiAgICBzdGF0dXMuc2V0SXNBY3RpdmUocnBjU3RhdHVzLmFjdGl2ZSk7XG4gICAgc3RhdHVzLnNldFNwZWVkKHJwY1N0YXR1cy5zcGVlZCk7XG4gICAgc3RhdHVzLnNldE51bVRocmVhZHMocnBjU3RhdHVzLnRocmVhZHNfY291bnQpO1xuICAgIGlmIChycGNTdGF0dXMuYWN0aXZlKSB7XG4gICAgICBzdGF0dXMuc2V0QWRkcmVzcyhycGNTdGF0dXMuYWRkcmVzcyk7XG4gICAgICBzdGF0dXMuc2V0SXNCYWNrZ3JvdW5kKHJwY1N0YXR1cy5pc19iYWNrZ3JvdW5kX21pbmluZ19lbmFibGVkKTtcbiAgICB9XG4gICAgcmV0dXJuIHN0YXR1cztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVXBkYXRlQ2hlY2tSZXN1bHQocnBjUmVzdWx0KSB7XG4gICAgYXNzZXJ0KHJwY1Jlc3VsdCk7XG4gICAgbGV0IHJlc3VsdCA9IG5ldyBNb25lcm9EYWVtb25VcGRhdGVDaGVja1Jlc3VsdCgpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNSZXN1bHQpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjUmVzdWx0W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImF1dG9fdXJpXCIpIHJlc3VsdC5zZXRBdXRvVXJpKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGFzaFwiKSByZXN1bHQuc2V0SGFzaCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBhdGhcIikge30gLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGF0dXNcIikge30gLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1cGRhdGVcIikgcmVzdWx0LnNldElzVXBkYXRlQXZhaWxhYmxlKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidXNlcl91cmlcIikgcmVzdWx0LnNldFVzZXJVcmkodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ2ZXJzaW9uXCIpIHJlc3VsdC5zZXRWZXJzaW9uKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW50cnVzdGVkXCIpIHt9IC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBycGMgY2hlY2sgdXBkYXRlIHJlc3VsdDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICBpZiAocmVzdWx0LmdldEF1dG9VcmkoKSA9PT0gXCJcIikgcmVzdWx0LnNldEF1dG9VcmkodW5kZWZpbmVkKTtcbiAgICBpZiAocmVzdWx0LmdldFVzZXJVcmkoKSA9PT0gXCJcIikgcmVzdWx0LnNldFVzZXJVcmkodW5kZWZpbmVkKTtcbiAgICBpZiAocmVzdWx0LmdldFZlcnNpb24oKSA9PT0gXCJcIikgcmVzdWx0LnNldFZlcnNpb24odW5kZWZpbmVkKTtcbiAgICBpZiAocmVzdWx0LmdldEhhc2goKSA9PT0gXCJcIikgcmVzdWx0LnNldEhhc2godW5kZWZpbmVkKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNVcGRhdGVEb3dubG9hZFJlc3VsdChycGNSZXN1bHQpIHtcbiAgICBsZXQgcmVzdWx0ID0gbmV3IE1vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0KE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVXBkYXRlQ2hlY2tSZXN1bHQocnBjUmVzdWx0KSBhcyBNb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdCk7XG4gICAgcmVzdWx0LnNldERvd25sb2FkUGF0aChycGNSZXN1bHRbXCJwYXRoXCJdKTtcbiAgICBpZiAocmVzdWx0LmdldERvd25sb2FkUGF0aCgpID09PSBcIlwiKSByZXN1bHQuc2V0RG93bmxvYWRQYXRoKHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBhICcweCcgcHJlZml4ZWQgaGV4aWRlY2ltYWwgc3RyaW5nIHRvIGEgYmlnaW50LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGhleCBpcyB0aGUgJzB4JyBwcmVmaXhlZCBoZXhpZGVjaW1hbCBzdHJpbmcgdG8gY29udmVydFxuICAgKiBAcmV0dXJuIHtiaWdpbnR9IHRoZSBoZXhpY2VkaW1hbCBjb252ZXJ0ZWQgdG8gZGVjaW1hbFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBwcmVmaXhlZEhleFRvQkkoaGV4KSB7XG4gICAgYXNzZXJ0KGhleC5zdWJzdHJpbmcoMCwgMikgPT09IFwiMHhcIik7XG4gICAgcmV0dXJuIEJpZ0ludChoZXgpO1xuICB9XG59XG5cbi8qKlxuICogSW1wbGVtZW50cyBhIE1vbmVyb0RhZW1vbiBieSBwcm94eWluZyByZXF1ZXN0cyB0byBhIHdvcmtlci5cbiAqIFxuICogQHByaXZhdGVcbiAqL1xuY2xhc3MgTW9uZXJvRGFlbW9uUnBjUHJveHkge1xuXG4gIC8vIHN0YXRlIHZhcmlhYmxlc1xuICBwcml2YXRlIGRhZW1vbklkOiBhbnk7XG4gIHByaXZhdGUgd29ya2VyOiBhbnk7XG4gIHByaXZhdGUgd3JhcHBlZExpc3RlbmVyczogYW55O1xuICBwcml2YXRlIHByb2Nlc3M6IGFueTtcblxuICBjb25zdHJ1Y3RvcihkYWVtb25JZCwgd29ya2VyKSB7XG4gICAgdGhpcy5kYWVtb25JZCA9IGRhZW1vbklkO1xuICAgIHRoaXMud29ya2VyID0gd29ya2VyO1xuICAgIHRoaXMud3JhcHBlZExpc3RlbmVycyA9IFtdO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU1RBVElDIFVUSUxJVElFUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgc3RhdGljIGFzeW5jIGNvbm5lY3QoY29uZmlnOiBNb25lcm9EYWVtb25Db25maWcpIHtcbiAgICBsZXQgZGFlbW9uSWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgY29uZmlnID0gT2JqZWN0LmFzc2lnbih7fSwgY29uZmlnLnRvSnNvbigpLCB7cHJveHlUb1dvcmtlcjogZmFsc2V9KTtcbiAgICBhd2FpdCBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKGRhZW1vbklkLCBcImNvbm5lY3REYWVtb25ScGNcIiwgW2NvbmZpZ10pO1xuICAgIHJldHVybiBuZXcgTW9uZXJvRGFlbW9uUnBjUHJveHkoZGFlbW9uSWQsIGF3YWl0IExpYnJhcnlVdGlscy5nZXRXb3JrZXIoKSk7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gSU5TVEFOQ0UgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICBhc3luYyBhZGRMaXN0ZW5lcihsaXN0ZW5lcikge1xuICAgIGxldCB3cmFwcGVkTGlzdGVuZXIgPSBuZXcgRGFlbW9uV29ya2VyTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIGxldCBsaXN0ZW5lcklkID0gd3JhcHBlZExpc3RlbmVyLmdldElkKCk7XG4gICAgTGlicmFyeVV0aWxzLmFkZFdvcmtlckNhbGxiYWNrKHRoaXMuZGFlbW9uSWQsIFwib25CbG9ja0hlYWRlcl9cIiArIGxpc3RlbmVySWQsIFt3cmFwcGVkTGlzdGVuZXIub25CbG9ja0hlYWRlciwgd3JhcHBlZExpc3RlbmVyXSk7XG4gICAgdGhpcy53cmFwcGVkTGlzdGVuZXJzLnB1c2god3JhcHBlZExpc3RlbmVyKTtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25BZGRMaXN0ZW5lclwiLCBbbGlzdGVuZXJJZF0pO1xuICB9XG4gIFxuICBhc3luYyByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcikge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53cmFwcGVkTGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodGhpcy53cmFwcGVkTGlzdGVuZXJzW2ldLmdldExpc3RlbmVyKCkgPT09IGxpc3RlbmVyKSB7XG4gICAgICAgIGxldCBsaXN0ZW5lcklkID0gdGhpcy53cmFwcGVkTGlzdGVuZXJzW2ldLmdldElkKCk7XG4gICAgICAgIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uUmVtb3ZlTGlzdGVuZXJcIiwgW2xpc3RlbmVySWRdKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnJlbW92ZVdvcmtlckNhbGxiYWNrKHRoaXMuZGFlbW9uSWQsIFwib25CbG9ja0hlYWRlcl9cIiArIGxpc3RlbmVySWQpO1xuICAgICAgICB0aGlzLndyYXBwZWRMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkxpc3RlbmVyIGlzIG5vdCByZWdpc3RlcmVkIHdpdGggZGFlbW9uXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRMaXN0ZW5lcnMoKSB7XG4gICAgbGV0IGxpc3RlbmVycyA9IFtdO1xuICAgIGZvciAobGV0IHdyYXBwZWRMaXN0ZW5lciBvZiB0aGlzLndyYXBwZWRMaXN0ZW5lcnMpIGxpc3RlbmVycy5wdXNoKHdyYXBwZWRMaXN0ZW5lci5nZXRMaXN0ZW5lcigpKTtcbiAgICByZXR1cm4gbGlzdGVuZXJzO1xuICB9XG4gIFxuICBhc3luYyBnZXRScGNDb25uZWN0aW9uKCkge1xuICAgIGxldCBjb25maWcgPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFJwY0Nvbm5lY3Rpb25cIik7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKGNvbmZpZyBhcyBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+KTtcbiAgfVxuICBcbiAgYXN5bmMgaXNDb25uZWN0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uSXNDb25uZWN0ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFZlcnNpb24oKSB7XG4gICAgbGV0IHZlcnNpb25Kc29uOiBhbnkgPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFZlcnNpb25cIik7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9WZXJzaW9uKHZlcnNpb25Kc29uLm51bWJlciwgdmVyc2lvbkpzb24uaXNSZWxlYXNlKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNUcnVzdGVkKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbklzVHJ1c3RlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEhlaWdodFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tIYXNoKGhlaWdodCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2NrSGFzaFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja1RlbXBsYXRlKHdhbGxldEFkZHJlc3MsIHJlc2VydmVTaXplKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9CbG9ja1RlbXBsYXRlKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tUZW1wbGF0ZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TGFzdEJsb2NrSGVhZGVyKCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRMYXN0QmxvY2tIZWFkZXJcIikpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0hlYWRlckJ5SGFzaChibG9ja0hhc2gpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tIZWFkZXJCeUhhc2hcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrSGVhZGVyQnlIZWlnaHQoaGVpZ2h0KSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9CbG9ja0hlYWRlcihhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2NrSGVhZGVyQnlIZWlnaHRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrSGVhZGVyc0J5UmFuZ2Uoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCkge1xuICAgIGxldCBibG9ja0hlYWRlcnNKc29uOiBhbnlbXSA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tIZWFkZXJzQnlSYW5nZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpIGFzIGFueVtdO1xuICAgIGxldCBoZWFkZXJzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2tIZWFkZXJKc29uIG9mIGJsb2NrSGVhZGVyc0pzb24pIGhlYWRlcnMucHVzaChuZXcgTW9uZXJvQmxvY2tIZWFkZXIoYmxvY2tIZWFkZXJKc29uKSk7XG4gICAgcmV0dXJuIGhlYWRlcnM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrQnlIYXNoKGJsb2NrSGFzaCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvQmxvY2soYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja0J5SGFzaFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpLCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tzQnlIYXNoKGJsb2NrSGFzaGVzLCBzdGFydEhlaWdodCwgcHJ1bmUpIHtcbiAgICBsZXQgYmxvY2tzSnNvbjogYW55W10gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2Nrc0J5SGFzaFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpIGFzIGFueVtdO1xuICAgIGxldCBibG9ja3MgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0pzb24gb2YgYmxvY2tzSnNvbikgYmxvY2tzLnB1c2gobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbikpO1xuICAgIHJldHVybiBibG9ja3M7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrQnlIZWlnaHQoaGVpZ2h0KSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9CbG9jayhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2NrQnlIZWlnaHRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2Nrc0J5SGVpZ2h0KGhlaWdodHMpIHtcbiAgICBsZXQgYmxvY2tzSnNvbjogYW55W109IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tzQnlIZWlnaHRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSBhcyBhbnlbXTtcbiAgICBsZXQgYmxvY2tzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2tKc29uIG9mIGJsb2Nrc0pzb24pIGJsb2Nrcy5wdXNoKG5ldyBNb25lcm9CbG9jayhibG9ja0pzb24sIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFgpKTtcbiAgICByZXR1cm4gYmxvY2tzO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja3NCeVJhbmdlKHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpIHtcbiAgICBsZXQgYmxvY2tzSnNvbjogYW55W10gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2Nrc0J5UmFuZ2VcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSBhcyBhbnlbXTtcbiAgICBsZXQgYmxvY2tzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2tKc29uIG9mIGJsb2Nrc0pzb24pIGJsb2Nrcy5wdXNoKG5ldyBNb25lcm9CbG9jayhibG9ja0pzb24sIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFgpKTtcbiAgICByZXR1cm4gYmxvY2tzO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja3NCeVJhbmdlQ2h1bmtlZChzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBtYXhDaHVua1NpemUpIHtcbiAgICBsZXQgYmxvY2tzSnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tzQnlSYW5nZUNodW5rZWRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSBhcyBhbnlbXTtcbiAgICBsZXQgYmxvY2tzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2tKc29uIG9mIGJsb2Nrc0pzb24pIGJsb2Nrcy5wdXNoKG5ldyBNb25lcm9CbG9jayhibG9ja0pzb24sIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFgpKTtcbiAgICByZXR1cm4gYmxvY2tzO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0hhc2hlcyhibG9ja0hhc2hlcywgc3RhcnRIZWlnaHQpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja0hhc2hlc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeHModHhIYXNoZXMsIHBydW5lID0gZmFsc2UpIHtcbiAgICBcbiAgICAvLyBkZXNlcmlhbGl6ZSB0eHMgZnJvbSBibG9ja3NcbiAgICBsZXQgYmxvY2tzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2tKc29uIG9mIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0VHhzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkgYXMgYW55W10pIHtcbiAgICAgIGJsb2Nrcy5wdXNoKG5ldyBNb25lcm9CbG9jayhibG9ja0pzb24sIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFgpKTtcbiAgICB9XG4gICAgXG4gICAgLy8gY29sbGVjdCB0eHNcbiAgICBsZXQgdHhzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2sgb2YgYmxvY2tzKSB7XG4gICAgICBmb3IgKGxldCB0eCBvZiBibG9jay5nZXRUeHMoKSkge1xuICAgICAgICBpZiAoIXR4LmdldElzQ29uZmlybWVkKCkpIHR4LnNldEJsb2NrKHVuZGVmaW5lZCk7XG4gICAgICAgIHR4cy5wdXNoKHR4KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHR4cztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhIZXhlcyh0eEhhc2hlcywgcHJ1bmUgPSBmYWxzZSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFR4SGV4ZXNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TWluZXJUeFN1bShoZWlnaHQsIG51bUJsb2Nrcykge1xuICAgIHJldHVybiBuZXcgTW9uZXJvTWluZXJUeFN1bShhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldE1pbmVyVHhTdW1cIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEZlZUVzdGltYXRlKGdyYWNlQmxvY2tzPykge1xuICAgIHJldHVybiBuZXcgTW9uZXJvRmVlRXN0aW1hdGUoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRGZWVFc3RpbWF0ZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgc3VibWl0VHhIZXgodHhIZXgsIGRvTm90UmVsYXkpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1N1Ym1pdFR4UmVzdWx0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uU3VibWl0VHhIZXhcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbGF5VHhzQnlIYXNoKHR4SGFzaGVzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uUmVsYXlUeHNCeUhhc2hcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhQb29sKCkge1xuICAgIGxldCBibG9ja0pzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFR4UG9vbFwiKTtcbiAgICBsZXQgdHhzID0gbmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWCkuZ2V0VHhzKCk7XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB0eC5zZXRCbG9jayh1bmRlZmluZWQpO1xuICAgIHJldHVybiB0eHMgPyB0eHMgOiBbXTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhQb29sSGFzaGVzKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFR4UG9vbEhhc2hlc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFBvb2xCYWNrbG9nKCkge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhQb29sU3RhdHMoKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9UeFBvb2xTdGF0cyhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFR4UG9vbFN0YXRzXCIpKTtcbiAgfVxuICBcbiAgYXN5bmMgZmx1c2hUeFBvb2woaGFzaGVzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uRmx1c2hUeFBvb2xcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzKGtleUltYWdlcykge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEtleUltYWdlU3BlbnRTdGF0dXNlc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRPdXRwdXRzKG91dHB1dHMpOiBQcm9taXNlPE1vbmVyb091dHB1dFtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRPdXRwdXRIaXN0b2dyYW0oYW1vdW50cywgbWluQ291bnQsIG1heENvdW50LCBpc1VubG9ja2VkLCByZWNlbnRDdXRvZmYpIHtcbiAgICBsZXQgZW50cmllcyA9IFtdO1xuICAgIGZvciAobGV0IGVudHJ5SnNvbiBvZiBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldE91dHB1dEhpc3RvZ3JhbVwiLCBbYW1vdW50cywgbWluQ291bnQsIG1heENvdW50LCBpc1VubG9ja2VkLCByZWNlbnRDdXRvZmZdKSBhcyBhbnlbXSkge1xuICAgICAgZW50cmllcy5wdXNoKG5ldyBNb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeShlbnRyeUpzb24pKTtcbiAgICB9XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dERpc3RyaWJ1dGlvbihhbW91bnRzLCBjdW11bGF0aXZlLCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRJbmZvKCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvRGFlbW9uSW5mbyhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEluZm9cIikpO1xuICB9XG4gIFxuICBhc3luYyBnZXRTeW5jSW5mbygpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0RhZW1vblN5bmNJbmZvKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0U3luY0luZm9cIikpO1xuICB9XG4gIFxuICBhc3luYyBnZXRIYXJkRm9ya0luZm8oKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9IYXJkRm9ya0luZm8oYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRIYXJkRm9ya0luZm9cIikpO1xuICB9XG4gIFxuICBhc3luYyBnZXRBbHRDaGFpbnMoKSB7XG4gICAgbGV0IGFsdENoYWlucyA9IFtdO1xuICAgIGZvciAobGV0IGFsdENoYWluSnNvbiBvZiBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEFsdENoYWluc1wiKSBhcyBhbnkpIGFsdENoYWlucy5wdXNoKG5ldyBNb25lcm9BbHRDaGFpbihhbHRDaGFpbkpzb24pKTtcbiAgICByZXR1cm4gYWx0Q2hhaW5zO1xuICB9XG4gIFxuICBhc3luYyBnZXRBbHRCbG9ja0hhc2hlcygpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRBbHRCbG9ja0hhc2hlc1wiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RG93bmxvYWRMaW1pdCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXREb3dubG9hZExpbWl0XCIpO1xuICB9XG4gIFxuICBhc3luYyBzZXREb3dubG9hZExpbWl0KGxpbWl0KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uU2V0RG93bmxvYWRMaW1pdFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyByZXNldERvd25sb2FkTGltaXQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uUmVzZXREb3dubG9hZExpbWl0XCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRVcGxvYWRMaW1pdCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRVcGxvYWRMaW1pdFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0VXBsb2FkTGltaXQobGltaXQpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TZXRVcGxvYWRMaW1pdFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyByZXNldFVwbG9hZExpbWl0KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblJlc2V0VXBsb2FkTGltaXRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBlZXJzKCkge1xuICAgIGxldCBwZWVycyA9IFtdO1xuICAgIGZvciAobGV0IHBlZXJKc29uIG9mIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0UGVlcnNcIikgYXMgYW55KSBwZWVycy5wdXNoKG5ldyBNb25lcm9QZWVyKHBlZXJKc29uKSk7XG4gICAgcmV0dXJuIHBlZXJzO1xuICB9XG4gIFxuICBhc3luYyBnZXRLbm93blBlZXJzKCkge1xuICAgIGxldCBwZWVycyA9IFtdO1xuICAgIGZvciAobGV0IHBlZXJKc29uIG9mIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0S25vd25QZWVyc1wiKSBhcyBhbnkpIHBlZXJzLnB1c2gobmV3IE1vbmVyb1BlZXIocGVlckpzb24pKTtcbiAgICByZXR1cm4gcGVlcnM7XG4gIH1cbiAgXG4gIGFzeW5jIHNldE91dGdvaW5nUGVlckxpbWl0KGxpbWl0KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uU2V0SW5jb21pbmdQZWVyTGltaXRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0SW5jb21pbmdQZWVyTGltaXQobGltaXQpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TZXRJbmNvbWluZ1BlZXJMaW1pdFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRQZWVyQmFucygpIHtcbiAgICBsZXQgYmFucyA9IFtdO1xuICAgIGZvciAobGV0IGJhbkpzb24gb2YgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRQZWVyQmFuc1wiKSBhcyBhbnkpIGJhbnMucHVzaChuZXcgTW9uZXJvQmFuKGJhbkpzb24pKTtcbiAgICByZXR1cm4gYmFucztcbiAgfVxuXG4gIGFzeW5jIHNldFBlZXJCYW5zKGJhbnMpIHtcbiAgICBsZXQgYmFuc0pzb24gPSBbXTtcbiAgICBmb3IgKGxldCBiYW4gb2YgYmFucykgYmFuc0pzb24ucHVzaChiYW4udG9Kc29uKCkpO1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblNldFBlZXJCYW5zXCIsIFtiYW5zSnNvbl0pO1xuICB9XG4gIFxuICBhc3luYyBzdGFydE1pbmluZyhhZGRyZXNzLCBudW1UaHJlYWRzLCBpc0JhY2tncm91bmQsIGlnbm9yZUJhdHRlcnkpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TdGFydE1pbmluZ1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBzdG9wTWluaW5nKCkge1xuICAgIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uU3RvcE1pbmluZ1wiKVxuICB9XG4gIFxuICBhc3luYyBnZXRNaW5pbmdTdGF0dXMoKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9NaW5pbmdTdGF0dXMoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRNaW5pbmdTdGF0dXNcIikpO1xuICB9XG4gIFxuICBhc3luYyBzdWJtaXRCbG9ja3MoYmxvY2tCbG9icykge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuXG4gIGFzeW5jIHBydW5lQmxvY2tjaGFpbihjaGVjaykge1xuICAgIHJldHVybiBuZXcgTW9uZXJvUHJ1bmVSZXN1bHQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25QcnVuZUJsb2NrY2hhaW5cIikpO1xuICB9XG4gIFxuICBhc3luYyBjaGVja0ZvclVwZGF0ZSgpOiBQcm9taXNlPE1vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBkb3dubG9hZFVwZGF0ZShwYXRoKTogUHJvbWlzZTxNb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgc3RvcCgpIHtcbiAgICB3aGlsZSAodGhpcy53cmFwcGVkTGlzdGVuZXJzLmxlbmd0aCkgYXdhaXQgdGhpcy5yZW1vdmVMaXN0ZW5lcih0aGlzLndyYXBwZWRMaXN0ZW5lcnNbMF0uZ2V0TGlzdGVuZXIoKSk7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uU3RvcFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgd2FpdEZvck5leHRCbG9ja0hlYWRlcigpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uV2FpdEZvck5leHRCbG9ja0hlYWRlclwiKSk7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIEhFTFBFUlMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICAvLyBUT0RPOiBkdXBsaWNhdGVkIHdpdGggTW9uZXJvV2FsbGV0RnVsbFByb3h5XG4gIHByb3RlY3RlZCBhc3luYyBpbnZva2VXb3JrZXIoZm5OYW1lOiBzdHJpbmcsIGFyZ3M/OiBhbnkpIHtcbiAgICByZXR1cm4gTGlicmFyeVV0aWxzLmludm9rZVdvcmtlcih0aGlzLmRhZW1vbklkLCBmbk5hbWUsIGFyZ3MpO1xuICB9XG59XG5cbi8qKlxuICogUG9sbHMgYSBNb25lcm8gZGFlbW9uIGZvciB1cGRhdGVzIGFuZCBub3RpZmllcyBsaXN0ZW5lcnMgYXMgdGhleSBvY2N1ci5cbiAqIFxuICogQHByaXZhdGVcbiAqL1xuY2xhc3MgRGFlbW9uUG9sbGVyIHtcblxuICBwcm90ZWN0ZWQgZGFlbW9uOiBNb25lcm9EYWVtb25ScGM7XG4gIHByb3RlY3RlZCBsb29wZXI6IFRhc2tMb29wZXI7XG4gIHByb3RlY3RlZCBpc1BvbGxpbmc6IGJvb2xlYW47XG4gIHByb3RlY3RlZCBsYXN0SGVhZGVyOiBNb25lcm9CbG9ja0hlYWRlcjtcblxuICBjb25zdHJ1Y3RvcihkYWVtb24pIHtcbiAgICBsZXQgdGhhdCA9IHRoaXM7XG4gICAgdGhpcy5kYWVtb24gPSBkYWVtb247XG4gICAgdGhpcy5sb29wZXIgPSBuZXcgVGFza0xvb3Blcihhc3luYyBmdW5jdGlvbigpIHsgYXdhaXQgdGhhdC5wb2xsKCk7IH0pO1xuICB9XG4gIFxuICBzZXRJc1BvbGxpbmcoaXNQb2xsaW5nOiBib29sZWFuKSB7XG4gICAgdGhpcy5pc1BvbGxpbmcgPSBpc1BvbGxpbmc7XG4gICAgaWYgKGlzUG9sbGluZykgdGhpcy5sb29wZXIuc3RhcnQodGhpcy5kYWVtb24uZ2V0UG9sbEludGVydmFsKCkpO1xuICAgIGVsc2UgdGhpcy5sb29wZXIuc3RvcCgpO1xuICB9XG4gIFxuICBhc3luYyBwb2xsKCkge1xuICAgIHRyeSB7XG4gICAgICBcbiAgICAgIC8vIGdldCBsYXRlc3QgYmxvY2sgaGVhZGVyXG4gICAgICBsZXQgaGVhZGVyID0gYXdhaXQgdGhpcy5kYWVtb24uZ2V0TGFzdEJsb2NrSGVhZGVyKCk7XG4gICAgICBcbiAgICAgIC8vIHNhdmUgZmlyc3QgaGVhZGVyIGZvciBjb21wYXJpc29uXG4gICAgICBpZiAoIXRoaXMubGFzdEhlYWRlcikge1xuICAgICAgICB0aGlzLmxhc3RIZWFkZXIgPSBhd2FpdCB0aGlzLmRhZW1vbi5nZXRMYXN0QmxvY2tIZWFkZXIoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBjb21wYXJlIGhlYWRlciB0byBsYXN0XG4gICAgICBpZiAoaGVhZGVyLmdldEhhc2goKSAhPT0gdGhpcy5sYXN0SGVhZGVyLmdldEhhc2goKSkge1xuICAgICAgICB0aGlzLmxhc3RIZWFkZXIgPSBoZWFkZXI7XG4gICAgICAgIGF3YWl0IHRoaXMuYW5ub3VuY2VCbG9ja0hlYWRlcihoZWFkZXIpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBiYWNrZ3JvdW5kIHBvbGwgZGFlbW9uIGhlYWRlclwiKTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICB9XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgYW5ub3VuY2VCbG9ja0hlYWRlcihoZWFkZXI6IE1vbmVyb0Jsb2NrSGVhZGVyKSB7XG4gICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgYXdhaXQgdGhpcy5kYWVtb24uZ2V0TGlzdGVuZXJzKCkpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGxpc3RlbmVyLm9uQmxvY2tIZWFkZXIoaGVhZGVyKTsgLy8gbm90aWZ5IGxpc3RlbmVyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGNhbGxpbmcgbGlzdGVuZXIgb24gYmxvY2sgaGVhZGVyXCIsIGVycik7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogSW50ZXJuYWwgbGlzdGVuZXIgdG8gYnJpZGdlIG5vdGlmaWNhdGlvbnMgdG8gZXh0ZXJuYWwgbGlzdGVuZXJzLlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBEYWVtb25Xb3JrZXJMaXN0ZW5lciB7XG5cbiAgcHJvdGVjdGVkIGlkOiBhbnk7XG4gIHByb3RlY3RlZCBsaXN0ZW5lcjogYW55O1xuXG4gIGNvbnN0cnVjdG9yKGxpc3RlbmVyKSB7XG4gICAgdGhpcy5pZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICB0aGlzLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIH1cbiAgXG4gIGdldElkKCkge1xuICAgIHJldHVybiB0aGlzLmlkO1xuICB9XG4gIFxuICBnZXRMaXN0ZW5lcigpIHtcbiAgICByZXR1cm4gdGhpcy5saXN0ZW5lcjtcbiAgfVxuICBcbiAgYXN5bmMgb25CbG9ja0hlYWRlcihoZWFkZXJKc29uKSB7XG4gICAgdGhpcy5saXN0ZW5lci5vbkJsb2NrSGVhZGVyKG5ldyBNb25lcm9CbG9ja0hlYWRlcihoZWFkZXJKc29uKSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTW9uZXJvRGFlbW9uUnBjO1xuIl0sIm1hcHBpbmdzIjoieUxBQUEsSUFBQUEsT0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMsU0FBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUUsYUFBQSxHQUFBSCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUcsV0FBQSxHQUFBSixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUksZUFBQSxHQUFBTCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUssVUFBQSxHQUFBTixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQU0sWUFBQSxHQUFBUCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQU8sa0JBQUEsR0FBQVIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFRLG9CQUFBLEdBQUFULHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBUyxxQkFBQSxHQUFBVixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVUsYUFBQSxHQUFBWCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVcsbUJBQUEsR0FBQVosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFZLGlCQUFBLEdBQUFiLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBYSxxQkFBQSxHQUFBZCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWMscUJBQUEsR0FB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