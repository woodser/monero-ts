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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX1Rhc2tMb29wZXIiLCJfTW9uZXJvQWx0Q2hhaW4iLCJfTW9uZXJvQmFuIiwiX01vbmVyb0Jsb2NrIiwiX01vbmVyb0Jsb2NrSGVhZGVyIiwiX01vbmVyb0Jsb2NrVGVtcGxhdGUiLCJfTW9uZXJvQ29ubmVjdGlvblNwYW4iLCJfTW9uZXJvRGFlbW9uIiwiX01vbmVyb0RhZW1vbkNvbmZpZyIsIl9Nb25lcm9EYWVtb25JbmZvIiwiX01vbmVyb0RhZW1vbkxpc3RlbmVyIiwiX01vbmVyb0RhZW1vblN5bmNJbmZvIiwiX01vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0IiwiX01vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0IiwiX01vbmVyb0ZlZUVzdGltYXRlIiwiX01vbmVyb0Vycm9yIiwiX01vbmVyb0hhcmRGb3JrSW5mbyIsIl9Nb25lcm9LZXlJbWFnZSIsIl9Nb25lcm9NaW5lclR4U3VtIiwiX01vbmVyb01pbmluZ1N0YXR1cyIsIl9Nb25lcm9OZXR3b3JrVHlwZSIsIl9Nb25lcm9PdXRwdXQiLCJfTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkiLCJfTW9uZXJvUGVlciIsIl9Nb25lcm9QcnVuZVJlc3VsdCIsIl9Nb25lcm9ScGNDb25uZWN0aW9uIiwiX01vbmVyb1N1Ym1pdFR4UmVzdWx0IiwiX01vbmVyb1R4IiwiX01vbmVyb1R4UG9vbFN0YXRzIiwiX01vbmVyb1V0aWxzIiwiX01vbmVyb1ZlcnNpb24iLCJNb25lcm9EYWVtb25ScGMiLCJNb25lcm9EYWVtb24iLCJNQVhfUkVRX1NJWkUiLCJERUZBVUxUX0lEIiwiTlVNX0hFQURFUlNfUEVSX1JFUSIsIkRFRkFVTFRfUE9MTF9QRVJJT0QiLCJjb25zdHJ1Y3RvciIsImNvbmZpZyIsInByb3h5RGFlbW9uIiwicHJveHlUb1dvcmtlciIsImxpc3RlbmVycyIsImNhY2hlZEhlYWRlcnMiLCJnZXRQcm9jZXNzIiwicHJvY2VzcyIsInN0b3BQcm9jZXNzIiwiZm9yY2UiLCJ1bmRlZmluZWQiLCJNb25lcm9FcnJvciIsImxpc3RlbmVyc0NvcHkiLCJHZW5VdGlscyIsImNvcHlBcnJheSIsImdldExpc3RlbmVycyIsImxpc3RlbmVyIiwicmVtb3ZlTGlzdGVuZXIiLCJraWxsUHJvY2VzcyIsImFkZExpc3RlbmVyIiwiYXNzZXJ0IiwiTW9uZXJvRGFlbW9uTGlzdGVuZXIiLCJwdXNoIiwicmVmcmVzaExpc3RlbmluZyIsImlkeCIsImluZGV4T2YiLCJzcGxpY2UiLCJnZXRScGNDb25uZWN0aW9uIiwiZ2V0U2VydmVyIiwiaXNDb25uZWN0ZWQiLCJnZXRWZXJzaW9uIiwiZSIsInJlc3AiLCJzZW5kSnNvblJlcXVlc3QiLCJjaGVja1Jlc3BvbnNlU3RhdHVzIiwicmVzdWx0IiwiTW9uZXJvVmVyc2lvbiIsInZlcnNpb24iLCJyZWxlYXNlIiwiaXNUcnVzdGVkIiwic2VuZFBhdGhSZXF1ZXN0IiwidW50cnVzdGVkIiwiZ2V0SGVpZ2h0IiwiY291bnQiLCJnZXRCbG9ja0hhc2giLCJoZWlnaHQiLCJnZXRCbG9ja1RlbXBsYXRlIiwid2FsbGV0QWRkcmVzcyIsInJlc2VydmVTaXplIiwid2FsbGV0X2FkZHJlc3MiLCJyZXNlcnZlX3NpemUiLCJjb252ZXJ0UnBjQmxvY2tUZW1wbGF0ZSIsImdldExhc3RCbG9ja0hlYWRlciIsImNvbnZlcnRScGNCbG9ja0hlYWRlciIsImJsb2NrX2hlYWRlciIsImdldEJsb2NrSGVhZGVyQnlIYXNoIiwiYmxvY2tIYXNoIiwiaGFzaCIsImdldEJsb2NrSGVhZGVyQnlIZWlnaHQiLCJnZXRCbG9ja0hlYWRlcnNCeVJhbmdlIiwic3RhcnRIZWlnaHQiLCJlbmRIZWlnaHQiLCJzdGFydF9oZWlnaHQiLCJlbmRfaGVpZ2h0IiwiaGVhZGVycyIsInJwY0hlYWRlciIsImdldEJsb2NrQnlIYXNoIiwiY29udmVydFJwY0Jsb2NrIiwiZ2V0QmxvY2tCeUhlaWdodCIsImdldEJsb2Nrc0J5SGVpZ2h0IiwiaGVpZ2h0cyIsInJlc3BCaW4iLCJzZW5kQmluYXJ5UmVxdWVzdCIsInJwY0Jsb2NrcyIsIk1vbmVyb1V0aWxzIiwiYmluYXJ5QmxvY2tzVG9Kc29uIiwiZXF1YWwiLCJ0eHMiLCJsZW5ndGgiLCJibG9ja3MiLCJibG9ja0lkeCIsImJsb2NrIiwic2V0SGVpZ2h0IiwidHhJZHgiLCJ0eCIsIk1vbmVyb1R4Iiwic2V0SGFzaCIsInR4X2hhc2hlcyIsInNldElzQ29uZmlybWVkIiwic2V0SW5UeFBvb2wiLCJzZXRJc01pbmVyVHgiLCJzZXRSZWxheSIsInNldElzUmVsYXllZCIsInNldElzRmFpbGVkIiwic2V0SXNEb3VibGVTcGVuZFNlZW4iLCJjb252ZXJ0UnBjVHgiLCJzZXRUeHMiLCJnZXRCbG9jayIsIm1lcmdlIiwiZ2V0VHhzIiwic2V0QmxvY2siLCJnZXRCbG9ja3NCeVJhbmdlIiwiZ2V0QmxvY2tzQnlSYW5nZUNodW5rZWQiLCJtYXhDaHVua1NpemUiLCJsYXN0SGVpZ2h0IiwiZ2V0TWF4QmxvY2tzIiwidHhIYXNoZXMiLCJwcnVuZSIsIkFycmF5IiwiaXNBcnJheSIsInR4c19oYXNoZXMiLCJkZWNvZGVfYXNfanNvbiIsIm1lc3NhZ2UiLCJnZXRUeEhleGVzIiwiaGV4ZXMiLCJnZXRQcnVuZWRIZXgiLCJnZXRGdWxsSGV4IiwiZ2V0TWluZXJUeFN1bSIsIm51bUJsb2NrcyIsInR4U3VtIiwiTW9uZXJvTWluZXJUeFN1bSIsInNldEVtaXNzaW9uU3VtIiwiQmlnSW50IiwiZW1pc3Npb25fYW1vdW50Iiwic2V0RmVlU3VtIiwiZmVlX2Ftb3VudCIsImdldEZlZUVzdGltYXRlIiwiZ3JhY2VCbG9ja3MiLCJncmFjZV9ibG9ja3MiLCJmZWVFc3RpbWF0ZSIsIk1vbmVyb0ZlZUVzdGltYXRlIiwic2V0RmVlIiwiZmVlIiwic2V0UXVhbnRpemF0aW9uTWFzayIsInF1YW50aXphdGlvbl9tYXNrIiwiZmVlcyIsImkiLCJzZXRGZWVzIiwic3VibWl0VHhIZXgiLCJ0eEhleCIsImRvTm90UmVsYXkiLCJ0eF9hc19oZXgiLCJkb19ub3RfcmVsYXkiLCJjb252ZXJ0UnBjU3VibWl0VHhSZXN1bHQiLCJzZXRJc0dvb2QiLCJyZWxheVR4c0J5SGFzaCIsInR4aWRzIiwiZ2V0VHhQb29sIiwidHJhbnNhY3Rpb25zIiwicnBjVHgiLCJzZXROdW1Db25maXJtYXRpb25zIiwiZ2V0VHhQb29sSGFzaGVzIiwiZ2V0VHhQb29sU3RhdHMiLCJjb252ZXJ0UnBjVHhQb29sU3RhdHMiLCJwb29sX3N0YXRzIiwiZmx1c2hUeFBvb2wiLCJoYXNoZXMiLCJsaXN0aWZ5IiwiZ2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzIiwia2V5SW1hZ2VzIiwia2V5X2ltYWdlcyIsInNwZW50X3N0YXR1cyIsImdldE91dHB1dEhpc3RvZ3JhbSIsImFtb3VudHMiLCJtaW5Db3VudCIsIm1heENvdW50IiwiaXNVbmxvY2tlZCIsInJlY2VudEN1dG9mZiIsIm1pbl9jb3VudCIsIm1heF9jb3VudCIsInVubG9ja2VkIiwicmVjZW50X2N1dG9mZiIsImVudHJpZXMiLCJoaXN0b2dyYW0iLCJycGNFbnRyeSIsImNvbnZlcnRScGNPdXRwdXRIaXN0b2dyYW1FbnRyeSIsImdldE91dHB1dERpc3RyaWJ1dGlvbiIsImN1bXVsYXRpdmUiLCJnZXRJbmZvIiwiY29udmVydFJwY0luZm8iLCJnZXRTeW5jSW5mbyIsImNvbnZlcnRScGNTeW5jSW5mbyIsImdldEhhcmRGb3JrSW5mbyIsImNvbnZlcnRScGNIYXJkRm9ya0luZm8iLCJnZXRBbHRDaGFpbnMiLCJjaGFpbnMiLCJycGNDaGFpbiIsImNvbnZlcnRScGNBbHRDaGFpbiIsImdldEFsdEJsb2NrSGFzaGVzIiwiYmxrc19oYXNoZXMiLCJnZXREb3dubG9hZExpbWl0IiwiZ2V0QmFuZHdpZHRoTGltaXRzIiwic2V0RG93bmxvYWRMaW1pdCIsImxpbWl0IiwicmVzZXREb3dubG9hZExpbWl0IiwiaXNJbnQiLCJzZXRCYW5kd2lkdGhMaW1pdHMiLCJnZXRVcGxvYWRMaW1pdCIsInNldFVwbG9hZExpbWl0IiwicmVzZXRVcGxvYWRMaW1pdCIsImdldFBlZXJzIiwicGVlcnMiLCJjb25uZWN0aW9ucyIsInJwY0Nvbm5lY3Rpb24iLCJjb252ZXJ0UnBjQ29ubmVjdGlvbiIsImdldEtub3duUGVlcnMiLCJncmF5X2xpc3QiLCJycGNQZWVyIiwicGVlciIsImNvbnZlcnRScGNQZWVyIiwic2V0SXNPbmxpbmUiLCJ3aGl0ZV9saXN0Iiwic2V0T3V0Z29pbmdQZWVyTGltaXQiLCJvdXRfcGVlcnMiLCJzZXRJbmNvbWluZ1BlZXJMaW1pdCIsImluX3BlZXJzIiwiZ2V0UGVlckJhbnMiLCJiYW5zIiwicnBjQmFuIiwiYmFuIiwiTW9uZXJvQmFuIiwic2V0SG9zdCIsImhvc3QiLCJzZXRJcCIsImlwIiwic2V0U2Vjb25kcyIsInNlY29uZHMiLCJzZXRQZWVyQmFucyIsInJwY0JhbnMiLCJjb252ZXJ0VG9ScGNCYW4iLCJzdGFydE1pbmluZyIsImFkZHJlc3MiLCJudW1UaHJlYWRzIiwiaXNCYWNrZ3JvdW5kIiwiaWdub3JlQmF0dGVyeSIsIm1pbmVyX2FkZHJlc3MiLCJ0aHJlYWRzX2NvdW50IiwiZG9fYmFja2dyb3VuZF9taW5pbmciLCJpZ25vcmVfYmF0dGVyeSIsInN0b3BNaW5pbmciLCJnZXRNaW5pbmdTdGF0dXMiLCJjb252ZXJ0UnBjTWluaW5nU3RhdHVzIiwic3VibWl0QmxvY2tzIiwiYmxvY2tCbG9icyIsInBydW5lQmxvY2tjaGFpbiIsImNoZWNrIiwiTW9uZXJvUHJ1bmVSZXN1bHQiLCJzZXRJc1BydW5lZCIsInBydW5lZCIsInNldFBydW5pbmdTZWVkIiwicHJ1bmluZ19zZWVkIiwiY2hlY2tGb3JVcGRhdGUiLCJjb21tYW5kIiwiY29udmVydFJwY1VwZGF0ZUNoZWNrUmVzdWx0IiwiZG93bmxvYWRVcGRhdGUiLCJwYXRoIiwiY29udmVydFJwY1VwZGF0ZURvd25sb2FkUmVzdWx0Iiwic3RvcCIsIndhaXRGb3JOZXh0QmxvY2tIZWFkZXIiLCJ0aGF0IiwiUHJvbWlzZSIsInJlc29sdmUiLCJvbkJsb2NrSGVhZGVyIiwiaGVhZGVyIiwiZ2V0UG9sbEludGVydmFsIiwicG9sbEludGVydmFsIiwiZ2V0VHgiLCJ0eEhhc2giLCJnZXRUeEhleCIsImdldEtleUltYWdlU3BlbnRTdGF0dXMiLCJrZXlJbWFnZSIsInNldFBlZXJCYW4iLCJzdWJtaXRCbG9jayIsImJsb2NrQmxvYiIsInBvbGxMaXN0ZW5lciIsIkRhZW1vblBvbGxlciIsInNldElzUG9sbGluZyIsImxpbWl0X2Rvd24iLCJsaW1pdF91cCIsImRvd25MaW1pdCIsInVwTGltaXQiLCJtYXhIZWlnaHQiLCJtYXhSZXFTaXplIiwicmVxU2l6ZSIsImdldEJsb2NrSGVhZGVyQnlIZWlnaHRDYWNoZWQiLCJnZXRTaXplIiwiY2FjaGVkSGVhZGVyIiwiTWF0aCIsIm1pbiIsImNvbm5lY3RUb0RhZW1vblJwYyIsInVyaU9yQ29uZmlnIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsIm5vcm1hbGl6ZUNvbmZpZyIsImNtZCIsInN0YXJ0TW9uZXJvZFByb2Nlc3MiLCJNb25lcm9EYWVtb25ScGNQcm94eSIsImNvbm5lY3QiLCJjaGlsZFByb2Nlc3MiLCJzcGF3biIsInNsaWNlIiwiZW52IiwiTEFORyIsInN0ZG91dCIsInNldEVuY29kaW5nIiwic3RkZXJyIiwidXJpIiwib3V0cHV0IiwicmVqZWN0Iiwib24iLCJkYXRhIiwibGluZSIsInRvU3RyaW5nIiwiTGlicmFyeVV0aWxzIiwibG9nIiwidXJpTGluZUNvbnRhaW5zIiwidXJpTGluZUNvbnRhaW5zSWR4Iiwic3Vic3RyaW5nIiwibGFzdEluZGV4T2YiLCJ1bmZvcm1hdHRlZExpbmUiLCJyZXBsYWNlIiwidHJpbSIsInBvcnQiLCJzc2xJZHgiLCJzc2xFbmFibGVkIiwidG9Mb3dlckNhc2UiLCJ1c2VyUGFzc0lkeCIsInVzZXJQYXNzIiwiY29weSIsInNldFNlcnZlciIsInJlamVjdFVuYXV0aG9yaXplZCIsImdldFJlamVjdFVuYXV0aG9yaXplZCIsInNldFByb3h5VG9Xb3JrZXIiLCJkYWVtb24iLCJpc1Jlc29sdmVkIiwiZ2V0TG9nTGV2ZWwiLCJjb25zb2xlIiwiZXJyb3IiLCJjb2RlIiwiRXJyb3IiLCJlcnIiLCJvcmlnaW4iLCJNb25lcm9EYWVtb25Db25maWciLCJzZXJ2ZXIiLCJNb25lcm9ScGNDb25uZWN0aW9uIiwiREVGQVVMVF9DT05GSUciLCJzdGF0dXMiLCJNb25lcm9CbG9ja0hlYWRlciIsImtleSIsIk9iamVjdCIsImtleXMiLCJ2YWwiLCJzYWZlU2V0Iiwic2V0U2l6ZSIsImdldERlcHRoIiwic2V0RGVwdGgiLCJzZXREaWZmaWN1bHR5IiwicmVjb25jaWxlIiwiZ2V0RGlmZmljdWx0eSIsInByZWZpeGVkSGV4VG9CSSIsInNldEN1bXVsYXRpdmVEaWZmaWN1bHR5IiwiZ2V0Q3VtdWxhdGl2ZURpZmZpY3VsdHkiLCJnZXRIYXNoIiwiZ2V0TWFqb3JWZXJzaW9uIiwic2V0TWFqb3JWZXJzaW9uIiwiZ2V0TWlub3JWZXJzaW9uIiwic2V0TWlub3JWZXJzaW9uIiwiZ2V0Tm9uY2UiLCJzZXROb25jZSIsImdldE51bVR4cyIsInNldE51bVR4cyIsImdldE9ycGhhblN0YXR1cyIsInNldE9ycGhhblN0YXR1cyIsImdldFByZXZIYXNoIiwic2V0UHJldkhhc2giLCJnZXRSZXdhcmQiLCJzZXRSZXdhcmQiLCJnZXRUaW1lc3RhbXAiLCJzZXRUaW1lc3RhbXAiLCJnZXRXZWlnaHQiLCJzZXRXZWlnaHQiLCJnZXRMb25nVGVybVdlaWdodCIsInNldExvbmdUZXJtV2VpZ2h0IiwiZ2V0UG93SGFzaCIsInNldFBvd0hhc2giLCJzZXRNaW5lclR4SGFzaCIsInJwY0Jsb2NrIiwiTW9uZXJvQmxvY2siLCJzZXRIZXgiLCJibG9iIiwic2V0VHhIYXNoZXMiLCJycGNNaW5lclR4IiwianNvbiIsIkpTT04iLCJwYXJzZSIsIm1pbmVyX3R4IiwibWluZXJUeCIsInNldE1pbmVyVHgiLCJnZXRMYXN0UmVsYXllZFRpbWVzdGFtcCIsInNldExhc3RSZWxheWVkVGltZXN0YW1wIiwiZ2V0UmVjZWl2ZWRUaW1lc3RhbXAiLCJzZXRSZWNlaXZlZFRpbWVzdGFtcCIsImdldE51bUNvbmZpcm1hdGlvbnMiLCJnZXRJc0NvbmZpcm1lZCIsImdldEluVHhQb29sIiwiZ2V0SXNEb3VibGVTcGVuZFNlZW4iLCJzZXRWZXJzaW9uIiwiZ2V0RXh0cmEiLCJzZXRFeHRyYSIsIlVpbnQ4QXJyYXkiLCJnZW4iLCJzZXRJbnB1dHMiLCJtYXAiLCJycGNWaW4iLCJjb252ZXJ0UnBjT3V0cHV0Iiwic2V0T3V0cHV0cyIsInJwY091dHB1dCIsImdldFJjdFNpZ25hdHVyZXMiLCJzZXRSY3RTaWduYXR1cmVzIiwidHhuRmVlIiwiZ2V0RmVlIiwiZ2V0UmN0U2lnUHJ1bmFibGUiLCJzZXRSY3RTaWdQcnVuYWJsZSIsImdldFVubG9ja1RpbWUiLCJzZXRVbmxvY2tUaW1lIiwic2V0RnVsbEhleCIsImdldElzUmVsYXllZCIsImdldE91dHB1dEluZGljZXMiLCJzZXRPdXRwdXRJbmRpY2VzIiwiZ2V0UmVsYXkiLCJnZXRJc0tlcHRCeUJsb2NrIiwic2V0SXNLZXB0QnlCbG9jayIsImdldFNpZ25hdHVyZXMiLCJzZXRTaWduYXR1cmVzIiwiZ2V0SXNGYWlsZWQiLCJnZXRMYXN0RmFpbGVkSGVpZ2h0Iiwic2V0TGFzdEZhaWxlZEhlaWdodCIsImdldExhc3RGYWlsZWRIYXNoIiwic2V0TGFzdEZhaWxlZEhhc2giLCJnZXRNYXhVc2VkQmxvY2tIZWlnaHQiLCJzZXRNYXhVc2VkQmxvY2tIZWlnaHQiLCJnZXRNYXhVc2VkQmxvY2tIYXNoIiwic2V0TWF4VXNlZEJsb2NrSGFzaCIsImdldFBydW5hYmxlSGFzaCIsInNldFBydW5hYmxlSGFzaCIsImdldFBydW5hYmxlSGV4Iiwic2V0UHJ1bmFibGVIZXgiLCJzZXRQcnVuZWRIZXgiLCJnZXRPdXRwdXRzIiwic2V0SW5kZXgiLCJhc19qc29uIiwidHhfanNvbiIsIk1vbmVyb091dHB1dCIsInNldFR4IiwiZ2V0QW1vdW50Iiwic2V0QW1vdW50IiwiYW1vdW50IiwiZ2V0S2V5SW1hZ2UiLCJzZXRLZXlJbWFnZSIsIk1vbmVyb0tleUltYWdlIiwia19pbWFnZSIsImdldFJpbmdPdXRwdXRJbmRpY2VzIiwic2V0UmluZ091dHB1dEluZGljZXMiLCJrZXlfb2Zmc2V0cyIsInB1YktleSIsInRhZ2dlZF9rZXkiLCJnZXRTdGVhbHRoUHVibGljS2V5Iiwic2V0U3RlYWx0aFB1YmxpY0tleSIsInJwY1RlbXBsYXRlIiwidGVtcGxhdGUiLCJNb25lcm9CbG9ja1RlbXBsYXRlIiwic2V0QmxvY2tIYXNoaW5nQmxvYiIsInNldEJsb2NrVGVtcGxhdGVCbG9iIiwic2V0RXhwZWN0ZWRSZXdhcmQiLCJzZXRSZXNlcnZlZE9mZnNldCIsInNldFNlZWRIZWlnaHQiLCJzZXRTZWVkSGFzaCIsInNldE5leHRTZWVkSGFzaCIsImdldE5leHRTZWVkSGFzaCIsInJwY0luZm8iLCJpbmZvIiwiTW9uZXJvRGFlbW9uSW5mbyIsInNldE51bUFsdEJsb2NrcyIsInNldEJsb2NrU2l6ZUxpbWl0Iiwic2V0QmxvY2tTaXplTWVkaWFuIiwic2V0QmxvY2tXZWlnaHRMaW1pdCIsInNldEJsb2NrV2VpZ2h0TWVkaWFuIiwic2V0Qm9vdHN0cmFwRGFlbW9uQWRkcmVzcyIsInNldEZyZWVTcGFjZSIsInNldERhdGFiYXNlU2l6ZSIsInNldE51bU9mZmxpbmVQZWVycyIsInNldEhlaWdodFdpdGhvdXRCb290c3RyYXAiLCJzZXROdW1JbmNvbWluZ0Nvbm5lY3Rpb25zIiwic2V0SXNPZmZsaW5lIiwic2V0TnVtT3V0Z29pbmdDb25uZWN0aW9ucyIsInNldE51bVJwY0Nvbm5lY3Rpb25zIiwic2V0U3RhcnRUaW1lc3RhbXAiLCJzZXRBZGp1c3RlZFRpbWVzdGFtcCIsInNldFRhcmdldCIsInNldFRhcmdldEhlaWdodCIsInNldFRvcEJsb2NrSGFzaCIsInNldE51bVR4c1Bvb2wiLCJzZXRXYXNCb290c3RyYXBFdmVyVXNlZCIsInNldE51bU9ubGluZVBlZXJzIiwic2V0VXBkYXRlQXZhaWxhYmxlIiwiZ2V0TmV0d29ya1R5cGUiLCJzZXROZXR3b3JrVHlwZSIsIk1vbmVyb05ldHdvcmtUeXBlIiwiTUFJTk5FVCIsIlRFU1RORVQiLCJTVEFHRU5FVCIsInNldENyZWRpdHMiLCJnZXRUb3BCbG9ja0hhc2giLCJzZXRJc0J1c3lTeW5jaW5nIiwic2V0SXNTeW5jaHJvbml6ZWQiLCJzZXRJc1Jlc3RyaWN0ZWQiLCJycGNTeW5jSW5mbyIsInN5bmNJbmZvIiwiTW9uZXJvRGFlbW9uU3luY0luZm8iLCJzZXRQZWVycyIsInJwY0Nvbm5lY3Rpb25zIiwic2V0U3BhbnMiLCJycGNTcGFucyIsInJwY1NwYW4iLCJnZXRTcGFucyIsImNvbnZlcnRScGNDb25uZWN0aW9uU3BhbiIsInNldE5leHROZWVkZWRQcnVuaW5nU2VlZCIsIm92ZXJ2aWV3IiwicnBjSGFyZEZvcmtJbmZvIiwiTW9uZXJvSGFyZEZvcmtJbmZvIiwic2V0RWFybGllc3RIZWlnaHQiLCJzZXRJc0VuYWJsZWQiLCJzZXRTdGF0ZSIsInNldFRocmVzaG9sZCIsInNldE51bVZvdGVzIiwic2V0Vm90aW5nIiwic2V0V2luZG93IiwicnBjQ29ubmVjdGlvblNwYW4iLCJzcGFuIiwiTW9uZXJvQ29ubmVjdGlvblNwYW4iLCJzZXRDb25uZWN0aW9uSWQiLCJzZXROdW1CbG9ja3MiLCJzZXRSYXRlIiwic2V0UmVtb3RlQWRkcmVzcyIsInNldFNwZWVkIiwic2V0U3RhcnRIZWlnaHQiLCJlbnRyeSIsIk1vbmVyb091dHB1dEhpc3RvZ3JhbUVudHJ5Iiwic2V0TnVtSW5zdGFuY2VzIiwic2V0TnVtVW5sb2NrZWRJbnN0YW5jZXMiLCJzZXROdW1SZWNlbnRJbnN0YW5jZXMiLCJycGNSZXN1bHQiLCJNb25lcm9TdWJtaXRUeFJlc3VsdCIsInNldElzRmVlVG9vTG93Iiwic2V0SGFzSW52YWxpZElucHV0Iiwic2V0SGFzSW52YWxpZE91dHB1dCIsInNldEhhc1Rvb0Zld091dHB1dHMiLCJzZXRJc01peGluVG9vTG93Iiwic2V0SXNPdmVyc3BlbmQiLCJzZXRSZWFzb24iLCJzZXRJc1Rvb0JpZyIsInNldFNhbml0eUNoZWNrRmFpbGVkIiwic2V0SXNUeEV4dHJhVG9vQmlnIiwic2V0SXNOb256ZXJvVW5sb2NrVGltZSIsInJwY1N0YXRzIiwic3RhdHMiLCJNb25lcm9UeFBvb2xTdGF0cyIsInNldEJ5dGVzTWF4Iiwic2V0Qnl0ZXNNZWQiLCJzZXRCeXRlc01pbiIsInNldEJ5dGVzVG90YWwiLCJzZXRIaXN0bzk4cGMiLCJzZXROdW0xMG0iLCJzZXROdW1Eb3VibGVTcGVuZHMiLCJzZXROdW1GYWlsaW5nIiwic2V0TnVtTm90UmVsYXllZCIsInNldE9sZGVzdFRpbWVzdGFtcCIsInNldEZlZVRvdGFsIiwic2V0SGlzdG8iLCJNYXAiLCJlbGVtIiwiZ2V0SGlzdG8iLCJzZXQiLCJieXRlcyIsImdldEhpc3RvOThwYyIsImNoYWluIiwiTW9uZXJvQWx0Q2hhaW4iLCJzZXRMZW5ndGgiLCJzZXRCbG9ja0hhc2hlcyIsInNldE1haW5DaGFpblBhcmVudEJsb2NrSGFzaCIsIk1vbmVyb1BlZXIiLCJzZXRJZCIsInNldExhc3RTZWVuVGltZXN0YW1wIiwic2V0UG9ydCIsInNldFJwY1BvcnQiLCJzZXRScGNDcmVkaXRzUGVySGFzaCIsInNldEFkZHJlc3MiLCJzZXRBdmdEb3dubG9hZCIsInNldEF2Z1VwbG9hZCIsInNldEN1cnJlbnREb3dubG9hZCIsInNldEN1cnJlbnRVcGxvYWQiLCJzZXRJc0luY29taW5nIiwic2V0TGl2ZVRpbWUiLCJzZXRJc0xvY2FsSXAiLCJzZXRJc0xvY2FsSG9zdCIsInBhcnNlSW50Iiwic2V0TnVtUmVjZWl2ZXMiLCJzZXRSZWNlaXZlSWRsZVRpbWUiLCJzZXROdW1TZW5kcyIsInNldFNlbmRJZGxlVGltZSIsInNldE51bVN1cHBvcnRGbGFncyIsInNldFR5cGUiLCJnZXRIb3N0IiwiZ2V0SXAiLCJnZXRJc0Jhbm5lZCIsImdldFNlY29uZHMiLCJycGNTdGF0dXMiLCJNb25lcm9NaW5pbmdTdGF0dXMiLCJzZXRJc0FjdGl2ZSIsImFjdGl2ZSIsInNwZWVkIiwic2V0TnVtVGhyZWFkcyIsInNldElzQmFja2dyb3VuZCIsImlzX2JhY2tncm91bmRfbWluaW5nX2VuYWJsZWQiLCJNb25lcm9EYWVtb25VcGRhdGVDaGVja1Jlc3VsdCIsInNldEF1dG9VcmkiLCJzZXRJc1VwZGF0ZUF2YWlsYWJsZSIsInNldFVzZXJVcmkiLCJnZXRBdXRvVXJpIiwiZ2V0VXNlclVyaSIsIk1vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0Iiwic2V0RG93bmxvYWRQYXRoIiwiZ2V0RG93bmxvYWRQYXRoIiwiaGV4IiwiZGFlbW9uSWQiLCJ3b3JrZXIiLCJ3cmFwcGVkTGlzdGVuZXJzIiwiZ2V0VVVJRCIsImFzc2lnbiIsInRvSnNvbiIsImludm9rZVdvcmtlciIsImdldFdvcmtlciIsIndyYXBwZWRMaXN0ZW5lciIsIkRhZW1vbldvcmtlckxpc3RlbmVyIiwibGlzdGVuZXJJZCIsImdldElkIiwiYWRkV29ya2VyQ2FsbGJhY2siLCJnZXRMaXN0ZW5lciIsInJlbW92ZVdvcmtlckNhbGxiYWNrIiwidmVyc2lvbkpzb24iLCJudW1iZXIiLCJpc1JlbGVhc2UiLCJmcm9tIiwiYXJndW1lbnRzIiwiYmxvY2tIZWFkZXJzSnNvbiIsImJsb2NrSGVhZGVySnNvbiIsIkRlc2VyaWFsaXphdGlvblR5cGUiLCJUWCIsImdldEJsb2Nrc0J5SGFzaCIsImJsb2NrSGFzaGVzIiwiYmxvY2tzSnNvbiIsImJsb2NrSnNvbiIsImdldEJsb2NrSGFzaGVzIiwiZ2V0VHhQb29sQmFja2xvZyIsIm91dHB1dHMiLCJlbnRyeUpzb24iLCJhbHRDaGFpbnMiLCJhbHRDaGFpbkpzb24iLCJwZWVySnNvbiIsImJhbkpzb24iLCJiYW5zSnNvbiIsImZuTmFtZSIsImFyZ3MiLCJsb29wZXIiLCJUYXNrTG9vcGVyIiwicG9sbCIsImlzUG9sbGluZyIsInN0YXJ0IiwibGFzdEhlYWRlciIsImFubm91bmNlQmxvY2tIZWFkZXIiLCJpZCIsImhlYWRlckpzb24iLCJfZGVmYXVsdCIsImV4cG9ydHMiLCJkZWZhdWx0Il0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvZGFlbW9uL01vbmVyb0RhZW1vblJwYy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXNzZXJ0IGZyb20gXCJhc3NlcnRcIjtcbmltcG9ydCBHZW5VdGlscyBmcm9tIFwiLi4vY29tbW9uL0dlblV0aWxzXCI7XG5pbXBvcnQgTGlicmFyeVV0aWxzIGZyb20gXCIuLi9jb21tb24vTGlicmFyeVV0aWxzXCI7XG5pbXBvcnQgVGFza0xvb3BlciBmcm9tIFwiLi4vY29tbW9uL1Rhc2tMb29wZXJcIjtcbmltcG9ydCBNb25lcm9BbHRDaGFpbiBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BbHRDaGFpblwiO1xuaW1wb3J0IE1vbmVyb0JhbiBmcm9tIFwiLi9tb2RlbC9Nb25lcm9CYW5cIjtcbmltcG9ydCBNb25lcm9CbG9jayBmcm9tIFwiLi9tb2RlbC9Nb25lcm9CbG9ja1wiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrSGVhZGVyIGZyb20gXCIuL21vZGVsL01vbmVyb0Jsb2NrSGVhZGVyXCI7XG5pbXBvcnQgTW9uZXJvQmxvY2tUZW1wbGF0ZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9CbG9ja1RlbXBsYXRlXCI7XG5pbXBvcnQgTW9uZXJvQ29ubmVjdGlvblNwYW4gZnJvbSBcIi4vbW9kZWwvTW9uZXJvQ29ubmVjdGlvblNwYW5cIjtcbmltcG9ydCBNb25lcm9EYWVtb24gZnJvbSBcIi4vTW9uZXJvRGFlbW9uXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uQ29uZmlnIGZyb20gXCIuL21vZGVsL01vbmVyb0RhZW1vbkNvbmZpZ1wiO1xuaW1wb3J0IE1vbmVyb0RhZW1vbkluZm8gZnJvbSBcIi4vbW9kZWwvTW9uZXJvRGFlbW9uSW5mb1wiO1xuaW1wb3J0IE1vbmVyb0RhZW1vbkxpc3RlbmVyIGZyb20gXCIuL21vZGVsL01vbmVyb0RhZW1vbkxpc3RlbmVyXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uU3luY0luZm8gZnJvbSBcIi4vbW9kZWwvTW9uZXJvRGFlbW9uU3luY0luZm9cIjtcbmltcG9ydCBNb25lcm9EYWVtb25VcGRhdGVDaGVja1Jlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9EYWVtb25VcGRhdGVDaGVja1Jlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvRmVlRXN0aW1hdGUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvRmVlRXN0aW1hdGVcIjtcbmltcG9ydCBNb25lcm9FcnJvciBmcm9tIFwiLi4vY29tbW9uL01vbmVyb0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvSGFyZEZvcmtJbmZvIGZyb20gXCIuL21vZGVsL01vbmVyb0hhcmRGb3JrSW5mb1wiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlIGZyb20gXCIuL21vZGVsL01vbmVyb0tleUltYWdlXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2VTcGVudFN0YXR1cyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzXCI7XG5pbXBvcnQgTW9uZXJvTWluZXJUeFN1bSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NaW5lclR4U3VtXCI7XG5pbXBvcnQgTW9uZXJvTWluaW5nU3RhdHVzIGZyb20gXCIuL21vZGVsL01vbmVyb01pbmluZ1N0YXR1c1wiO1xuaW1wb3J0IE1vbmVyb05ldHdvcmtUeXBlIGZyb20gXCIuL21vZGVsL01vbmVyb05ldHdvcmtUeXBlXCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0IGZyb20gXCIuL21vZGVsL01vbmVyb091dHB1dFwiO1xuaW1wb3J0IE1vbmVyb091dHB1dEhpc3RvZ3JhbUVudHJ5IGZyb20gXCIuL21vZGVsL01vbmVyb091dHB1dEhpc3RvZ3JhbUVudHJ5XCI7XG5pbXBvcnQgTW9uZXJvUGVlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9QZWVyXCI7XG5pbXBvcnQgTW9uZXJvUHJ1bmVSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvUHJ1bmVSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9ScGNDb25uZWN0aW9uIGZyb20gXCIuLi9jb21tb24vTW9uZXJvUnBjQ29ubmVjdGlvblwiO1xuaW1wb3J0IE1vbmVyb1N1Ym1pdFR4UmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb1N1Ym1pdFR4UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvVHggZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhcIjtcbmltcG9ydCBNb25lcm9UeFBvb2xTdGF0cyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFBvb2xTdGF0c1wiO1xuaW1wb3J0IE1vbmVyb1V0aWxzIGZyb20gXCIuLi9jb21tb24vTW9uZXJvVXRpbHNcIjtcbmltcG9ydCBNb25lcm9WZXJzaW9uIGZyb20gXCIuL21vZGVsL01vbmVyb1ZlcnNpb25cIjtcbmltcG9ydCB7IENoaWxkUHJvY2VzcyB9IGZyb20gXCJjaGlsZF9wcm9jZXNzXCI7XG5cbi8qKlxuICogQ29weXJpZ2h0IChjKSB3b29kc2VyXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxuICogY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG4gKiBTT0ZUV0FSRS5cbiAqL1xuXG4vKipcbiAqIEltcGxlbWVudHMgYSBNb25lcm9EYWVtb24gYXMgYSBjbGllbnQgb2YgbW9uZXJvZC5cbiAqL1xuY2xhc3MgTW9uZXJvRGFlbW9uUnBjIGV4dGVuZHMgTW9uZXJvRGFlbW9uIHtcblxuICAvLyBzdGF0aWMgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBzdGF0aWMgcmVhZG9ubHkgTUFYX1JFUV9TSVpFID0gXCIzMDAwMDAwXCI7XG4gIHByb3RlY3RlZCBzdGF0aWMgcmVhZG9ubHkgREVGQVVMVF9JRCA9IFwiMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMFwiOyAvLyB1bmluaXRpYWxpemVkIHR4IG9yIGJsb2NrIGhhc2ggZnJvbSBkYWVtb24gcnBjXG4gIHByb3RlY3RlZCBzdGF0aWMgcmVhZG9ubHkgTlVNX0hFQURFUlNfUEVSX1JFUSA9IDc1MDsgLy8gbnVtYmVyIG9mIGhlYWRlcnMgdG8gZmV0Y2ggYW5kIGNhY2hlIHBlciByZXF1ZXN0XG4gIHByb3RlY3RlZCBzdGF0aWMgcmVhZG9ubHkgREVGQVVMVF9QT0xMX1BFUklPRCA9IDIwMDAwOyAvLyBkZWZhdWx0IGludGVydmFsIGJldHdlZW4gcG9sbGluZyB0aGUgZGFlbW9uIGluIG1zXG5cbiAgLy8gaW5zdGFuY2UgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBjb25maWc6IFBhcnRpYWw8TW9uZXJvRGFlbW9uQ29uZmlnPjtcbiAgcHJvdGVjdGVkIGxpc3RlbmVyczogTW9uZXJvRGFlbW9uTGlzdGVuZXJbXTtcbiAgcHJvdGVjdGVkIGNhY2hlZEhlYWRlcnM6IGFueTtcbiAgcHJvdGVjdGVkIHByb2Nlc3M6IGFueTtcbiAgcHJvdGVjdGVkIHBvbGxMaXN0ZW5lcjogYW55O1xuICBwcm90ZWN0ZWQgcHJveHlEYWVtb246IGFueTtcbiBcbiAgLyoqIEBwcml2YXRlICovXG4gIGNvbnN0cnVjdG9yKGNvbmZpZzogTW9uZXJvRGFlbW9uQ29uZmlnLCBwcm94eURhZW1vbjogTW9uZXJvRGFlbW9uUnBjUHJveHkpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xuICAgIHRoaXMucHJveHlEYWVtb24gPSBwcm94eURhZW1vbjtcbiAgICBpZiAoY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybjtcbiAgICB0aGlzLmxpc3RlbmVycyA9IFtdOyAgICAgIC8vIGJsb2NrIGxpc3RlbmVyc1xuICAgIHRoaXMuY2FjaGVkSGVhZGVycyA9IHt9OyAgLy8gY2FjaGVkIGhlYWRlcnMgZm9yIGZldGNoaW5nIGJsb2NrcyBpbiBib3VuZCBjaHVua3NcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgaW50ZXJuYWwgcHJvY2VzcyBydW5uaW5nIG1vbmVyb2QuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtDaGlsZFByb2Nlc3N9IHRoZSBub2RlIHByb2Nlc3MgcnVubmluZyBtb25lcm9kLCB1bmRlZmluZWQgaWYgbm90IGNyZWF0ZWQgZnJvbSBuZXcgcHJvY2Vzc1xuICAgKi9cbiAgZ2V0UHJvY2VzcygpOiBDaGlsZFByb2Nlc3Mge1xuICAgIHJldHVybiB0aGlzLnByb2Nlc3M7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTdG9wIHRoZSBpbnRlcm5hbCBwcm9jZXNzIHJ1bm5pbmcgbW9uZXJvZCwgaWYgYXBwbGljYWJsZS5cbiAgICogXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2ZvcmNlXSBzcGVjaWZpZXMgaWYgdGhlIHByb2Nlc3Mgc2hvdWxkIGJlIGRlc3Ryb3llZCBmb3JjaWJseSAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxudW1iZXIgfCB1bmRlZmluZWQ+fSB0aGUgZXhpdCBjb2RlIGZyb20gc3RvcHBpbmcgdGhlIHByb2Nlc3NcbiAgICovXG4gIGFzeW5jIHN0b3BQcm9jZXNzKGZvcmNlID0gZmFsc2UpOiBQcm9taXNlPG51bWJlciB8IHVuZGVmaW5lZD4ge1xuICAgIGlmICh0aGlzLnByb2Nlc3MgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTW9uZXJvRGFlbW9uUnBjIGluc3RhbmNlIG5vdCBjcmVhdGVkIGZyb20gbmV3IHByb2Nlc3NcIik7XG4gICAgbGV0IGxpc3RlbmVyc0NvcHkgPSBHZW5VdGlscy5jb3B5QXJyYXkoYXdhaXQgdGhpcy5nZXRMaXN0ZW5lcnMoKSk7XG4gICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgbGlzdGVuZXJzQ29weSkgYXdhaXQgdGhpcy5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgcmV0dXJuIEdlblV0aWxzLmtpbGxQcm9jZXNzKHRoaXMucHJvY2VzcywgZm9yY2UgPyBcIlNJR0tJTExcIiA6IHVuZGVmaW5lZCk7XG4gIH1cbiAgXG4gIGFzeW5jIGFkZExpc3RlbmVyKGxpc3RlbmVyOiBNb25lcm9EYWVtb25MaXN0ZW5lcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgYXNzZXJ0KGxpc3RlbmVyIGluc3RhbmNlb2YgTW9uZXJvRGFlbW9uTGlzdGVuZXIsIFwiTGlzdGVuZXIgbXVzdCBiZSBpbnN0YW5jZSBvZiBNb25lcm9EYWVtb25MaXN0ZW5lclwiKTtcbiAgICB0aGlzLmxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcbiAgICB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXI6IE1vbmVyb0RhZW1vbkxpc3RlbmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBhc3NlcnQobGlzdGVuZXIgaW5zdGFuY2VvZiBNb25lcm9EYWVtb25MaXN0ZW5lciwgXCJMaXN0ZW5lciBtdXN0IGJlIGluc3RhbmNlIG9mIE1vbmVyb0RhZW1vbkxpc3RlbmVyXCIpO1xuICAgIGxldCBpZHggPSB0aGlzLmxpc3RlbmVycy5pbmRleE9mKGxpc3RlbmVyKTtcbiAgICBpZiAoaWR4ID4gLTEpIHRoaXMubGlzdGVuZXJzLnNwbGljZShpZHgsIDEpO1xuICAgIGVsc2UgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTGlzdGVuZXIgaXMgbm90IHJlZ2lzdGVyZWQgd2l0aCBkYWVtb25cIik7XG4gICAgdGhpcy5yZWZyZXNoTGlzdGVuaW5nKCk7XG4gIH1cbiAgXG4gIGdldExpc3RlbmVycygpOiBNb25lcm9EYWVtb25MaXN0ZW5lcltdIHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0TGlzdGVuZXJzKCk7XG4gICAgcmV0dXJuIHRoaXMubGlzdGVuZXJzO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBkYWVtb24ncyBSUEMgY29ubmVjdGlvbi5cbiAgICogXG4gICAqIEByZXR1cm4ge01vbmVyb1JwY0Nvbm5lY3Rpb259IHRoZSBkYWVtb24ncyBycGMgY29ubmVjdGlvblxuICAgKi9cbiAgYXN5bmMgZ2V0UnBjQ29ubmVjdGlvbigpIHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0UnBjQ29ubmVjdGlvbigpO1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNDb25uZWN0ZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmlzQ29ubmVjdGVkKCk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuZ2V0VmVyc2lvbigpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXRWZXJzaW9uKCk6IFByb21pc2U8TW9uZXJvVmVyc2lvbj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRWZXJzaW9uKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfdmVyc2lvblwiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9WZXJzaW9uKHJlc3AucmVzdWx0LnZlcnNpb24sIHJlc3AucmVzdWx0LnJlbGVhc2UpO1xuICB9XG4gIFxuICBhc3luYyBpc1RydXN0ZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmlzVHJ1c3RlZCgpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwiZ2V0X2hlaWdodFwiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICByZXR1cm4gIXJlc3AudW50cnVzdGVkO1xuICB9XG4gIFxuICBhc3luYyBnZXRIZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0SGVpZ2h0KCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmxvY2tfY291bnRcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiByZXNwLnJlc3VsdC5jb3VudDtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tIYXNoKGhlaWdodDogbnVtYmVyKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tIYXNoKGhlaWdodCk7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJvbl9nZXRfYmxvY2tfaGFzaFwiLCBbaGVpZ2h0XSkpLnJlc3VsdDsgIC8vIFRPRE8gbW9uZXJvLXdhbGxldC1ycGM6IG5vIHN0YXR1cyByZXR1cm5lZFxuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja1RlbXBsYXRlKHdhbGxldEFkZHJlc3M6IHN0cmluZywgcmVzZXJ2ZVNpemU/OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb0Jsb2NrVGVtcGxhdGU+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tUZW1wbGF0ZSh3YWxsZXRBZGRyZXNzLCByZXNlcnZlU2l6ZSk7XG4gICAgYXNzZXJ0KHdhbGxldEFkZHJlc3MgJiYgdHlwZW9mIHdhbGxldEFkZHJlc3MgPT09IFwic3RyaW5nXCIsIFwiTXVzdCBzcGVjaWZ5IHdhbGxldCBhZGRyZXNzIHRvIGJlIG1pbmVkIHRvXCIpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2Jsb2NrX3RlbXBsYXRlXCIsIHt3YWxsZXRfYWRkcmVzczogd2FsbGV0QWRkcmVzcywgcmVzZXJ2ZV9zaXplOiByZXNlcnZlU2l6ZX0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNCbG9ja1RlbXBsYXRlKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TGFzdEJsb2NrSGVhZGVyKCk6IFByb21pc2U8TW9uZXJvQmxvY2tIZWFkZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0TGFzdEJsb2NrSGVhZGVyKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfbGFzdF9ibG9ja19oZWFkZXJcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Jsb2NrSGVhZGVyKHJlc3AucmVzdWx0LmJsb2NrX2hlYWRlcik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrSGVhZGVyQnlIYXNoKGJsb2NrSGFzaDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9CbG9ja0hlYWRlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRCbG9ja0hlYWRlckJ5SGFzaChibG9ja0hhc2gpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2Jsb2NrX2hlYWRlcl9ieV9oYXNoXCIsIHtoYXNoOiBibG9ja0hhc2h9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQmxvY2tIZWFkZXIocmVzcC5yZXN1bHQuYmxvY2tfaGVhZGVyKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tIZWFkZXJCeUhlaWdodChoZWlnaHQ6IG51bWJlcik6IFByb21pc2U8TW9uZXJvQmxvY2tIZWFkZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tIZWFkZXJCeUhlaWdodChoZWlnaHQpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2Jsb2NrX2hlYWRlcl9ieV9oZWlnaHRcIiwge2hlaWdodDogaGVpZ2h0fSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Jsb2NrSGVhZGVyKHJlc3AucmVzdWx0LmJsb2NrX2hlYWRlcik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrSGVhZGVyc0J5UmFuZ2Uoc3RhcnRIZWlnaHQ/OiBudW1iZXIsIGVuZEhlaWdodD86IG51bWJlcik6IFByb21pc2U8TW9uZXJvQmxvY2tIZWFkZXJbXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRCbG9ja0hlYWRlcnNCeVJhbmdlKHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpO1xuICAgIFxuICAgIC8vIGZldGNoIGJsb2NrIGhlYWRlcnNcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9ibG9ja19oZWFkZXJzX3JhbmdlXCIsIHtcbiAgICAgIHN0YXJ0X2hlaWdodDogc3RhcnRIZWlnaHQsXG4gICAgICBlbmRfaGVpZ2h0OiBlbmRIZWlnaHRcbiAgICB9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgXG4gICAgLy8gYnVpbGQgaGVhZGVyc1xuICAgIGxldCBoZWFkZXJzID0gW107XG4gICAgZm9yIChsZXQgcnBjSGVhZGVyIG9mIHJlc3AucmVzdWx0LmhlYWRlcnMpIHtcbiAgICAgIGhlYWRlcnMucHVzaChNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Jsb2NrSGVhZGVyKHJwY0hlYWRlcikpO1xuICAgIH1cbiAgICByZXR1cm4gaGVhZGVycztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tCeUhhc2goYmxvY2tIYXNoOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0Jsb2NrPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2NrQnlIYXNoKGJsb2NrSGFzaCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmxvY2tcIiwge2hhc2g6IGJsb2NrSGFzaH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNCbG9jayhyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrQnlIZWlnaHQoaGVpZ2h0OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb0Jsb2NrPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2NrQnlIZWlnaHQoaGVpZ2h0KTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9ibG9ja1wiLCB7aGVpZ2h0OiBoZWlnaHR9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQmxvY2socmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja3NCeUhlaWdodChoZWlnaHRzOiBudW1iZXJbXSk6IFByb21pc2U8TW9uZXJvQmxvY2tbXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRCbG9ja3NCeUhlaWdodChoZWlnaHRzKTtcbiAgICBcbiAgICAvLyBmZXRjaCBibG9ja3MgaW4gYmluYXJ5XG4gICAgbGV0IHJlc3BCaW4gPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kQmluYXJ5UmVxdWVzdChcImdldF9ibG9ja3NfYnlfaGVpZ2h0LmJpblwiLCB7aGVpZ2h0czogaGVpZ2h0c30pO1xuICAgIFxuICAgIC8vIGNvbnZlcnQgYmluYXJ5IGJsb2NrcyB0byBqc29uXG4gICAgbGV0IHJwY0Jsb2NrcyA9IGF3YWl0IE1vbmVyb1V0aWxzLmJpbmFyeUJsb2Nrc1RvSnNvbihyZXNwQmluKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhycGNCbG9ja3MpO1xuICAgIFxuICAgIC8vIGJ1aWxkIGJsb2NrcyB3aXRoIHRyYW5zYWN0aW9uc1xuICAgIGFzc2VydC5lcXVhbChycGNCbG9ja3MudHhzLmxlbmd0aCwgcnBjQmxvY2tzLmJsb2Nrcy5sZW5ndGgpOyAgICBcbiAgICBsZXQgYmxvY2tzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2tJZHggPSAwOyBibG9ja0lkeCA8IHJwY0Jsb2Nrcy5ibG9ja3MubGVuZ3RoOyBibG9ja0lkeCsrKSB7XG4gICAgICBcbiAgICAgIC8vIGJ1aWxkIGJsb2NrXG4gICAgICBsZXQgYmxvY2sgPSBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Jsb2NrKHJwY0Jsb2Nrcy5ibG9ja3NbYmxvY2tJZHhdKTtcbiAgICAgIGJsb2NrLnNldEhlaWdodChoZWlnaHRzW2Jsb2NrSWR4XSk7XG4gICAgICBibG9ja3MucHVzaChibG9jayk7XG4gICAgICBcbiAgICAgIC8vIGJ1aWxkIHRyYW5zYWN0aW9uc1xuICAgICAgbGV0IHR4cyA9IFtdO1xuICAgICAgZm9yIChsZXQgdHhJZHggPSAwOyB0eElkeCA8IHJwY0Jsb2Nrcy50eHNbYmxvY2tJZHhdLmxlbmd0aDsgdHhJZHgrKykge1xuICAgICAgICBsZXQgdHggPSBuZXcgTW9uZXJvVHgoKTtcbiAgICAgICAgdHhzLnB1c2godHgpO1xuICAgICAgICB0eC5zZXRIYXNoKHJwY0Jsb2Nrcy5ibG9ja3NbYmxvY2tJZHhdLnR4X2hhc2hlc1t0eElkeF0pO1xuICAgICAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICAgICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgICAgICB0eC5zZXRJc01pbmVyVHgoZmFsc2UpO1xuICAgICAgICB0eC5zZXRSZWxheSh0cnVlKTtcbiAgICAgICAgdHguc2V0SXNSZWxheWVkKHRydWUpO1xuICAgICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgICAgIHR4LnNldElzRG91YmxlU3BlbmRTZWVuKGZhbHNlKTtcbiAgICAgICAgTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNUeChycGNCbG9ja3MudHhzW2Jsb2NrSWR4XVt0eElkeF0sIHR4KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gbWVyZ2UgaW50byBvbmUgYmxvY2tcbiAgICAgIGJsb2NrLnNldFR4cyhbXSk7XG4gICAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgICAgaWYgKHR4LmdldEJsb2NrKCkpIGJsb2NrLm1lcmdlKHR4LmdldEJsb2NrKCkpO1xuICAgICAgICBlbHNlIGJsb2NrLmdldFR4cygpLnB1c2godHguc2V0QmxvY2soYmxvY2spKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGJsb2NrcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tzQnlSYW5nZShzdGFydEhlaWdodD86IG51bWJlciwgZW5kSGVpZ2h0PzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9CbG9ja1tdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2Nrc0J5UmFuZ2Uoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCk7XG4gICAgaWYgKHN0YXJ0SGVpZ2h0ID09PSB1bmRlZmluZWQpIHN0YXJ0SGVpZ2h0ID0gMDtcbiAgICBpZiAoZW5kSGVpZ2h0ID09PSB1bmRlZmluZWQpIGVuZEhlaWdodCA9IGF3YWl0IHRoaXMuZ2V0SGVpZ2h0KCkgLSAxO1xuICAgIGxldCBoZWlnaHRzID0gW107XG4gICAgZm9yIChsZXQgaGVpZ2h0ID0gc3RhcnRIZWlnaHQ7IGhlaWdodCA8PSBlbmRIZWlnaHQ7IGhlaWdodCsrKSBoZWlnaHRzLnB1c2goaGVpZ2h0KTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5nZXRCbG9ja3NCeUhlaWdodChoZWlnaHRzKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tzQnlSYW5nZUNodW5rZWQoc3RhcnRIZWlnaHQ/OiBudW1iZXIsIGVuZEhlaWdodD86IG51bWJlciwgbWF4Q2h1bmtTaXplPzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9CbG9ja1tdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2Nrc0J5UmFuZ2VDaHVua2VkKHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIG1heENodW5rU2l6ZSk7XG4gICAgaWYgKHN0YXJ0SGVpZ2h0ID09PSB1bmRlZmluZWQpIHN0YXJ0SGVpZ2h0ID0gMDtcbiAgICBpZiAoZW5kSGVpZ2h0ID09PSB1bmRlZmluZWQpIGVuZEhlaWdodCA9IGF3YWl0IHRoaXMuZ2V0SGVpZ2h0KCkgLSAxO1xuICAgIGxldCBsYXN0SGVpZ2h0ID0gc3RhcnRIZWlnaHQgLSAxO1xuICAgIGxldCBibG9ja3MgPSBbXTtcbiAgICB3aGlsZSAobGFzdEhlaWdodCA8IGVuZEhlaWdodCkge1xuICAgICAgZm9yIChsZXQgYmxvY2sgb2YgYXdhaXQgdGhpcy5nZXRNYXhCbG9ja3MobGFzdEhlaWdodCArIDEsIGVuZEhlaWdodCwgbWF4Q2h1bmtTaXplKSkge1xuICAgICAgICBibG9ja3MucHVzaChibG9jayk7XG4gICAgICB9XG4gICAgICBsYXN0SGVpZ2h0ID0gYmxvY2tzW2Jsb2Nrcy5sZW5ndGggLSAxXS5nZXRIZWlnaHQoKTtcbiAgICB9XG4gICAgcmV0dXJuIGJsb2NrcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhzKHR4SGFzaGVzOiBzdHJpbmdbXSwgcHJ1bmUgPSBmYWxzZSk6IFByb21pc2U8TW9uZXJvVHhbXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRUeHModHhIYXNoZXMsIHBydW5lKTtcbiAgICAgICAgXG4gICAgLy8gdmFsaWRhdGUgaW5wdXRcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheSh0eEhhc2hlcykgJiYgdHhIYXNoZXMubGVuZ3RoID4gMCwgXCJNdXN0IHByb3ZpZGUgYW4gYXJyYXkgb2YgdHJhbnNhY3Rpb24gaGFzaGVzXCIpO1xuICAgIGFzc2VydChwcnVuZSA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiBwcnVuZSA9PT0gXCJib29sZWFuXCIsIFwiUHJ1bmUgbXVzdCBiZSBhIGJvb2xlYW4gb3IgdW5kZWZpbmVkXCIpO1xuICAgICAgICBcbiAgICAvLyBmZXRjaCB0cmFuc2FjdGlvbnNcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImdldF90cmFuc2FjdGlvbnNcIiwge1xuICAgICAgdHhzX2hhc2hlczogdHhIYXNoZXMsXG4gICAgICBkZWNvZGVfYXNfanNvbjogdHJ1ZSxcbiAgICAgIHBydW5lOiBwcnVuZVxuICAgIH0pO1xuICAgIHRyeSB7XG4gICAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlLm1lc3NhZ2UuaW5kZXhPZihcIkZhaWxlZCB0byBwYXJzZSBoZXggcmVwcmVzZW50YXRpb24gb2YgdHJhbnNhY3Rpb24gaGFzaFwiKSA+PSAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJJbnZhbGlkIHRyYW5zYWN0aW9uIGhhc2hcIik7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgICAgICAgXG4gICAgLy8gYnVpbGQgdHJhbnNhY3Rpb24gbW9kZWxzXG4gICAgbGV0IHR4cyA9IFtdO1xuICAgIGlmIChyZXNwLnR4cykge1xuICAgICAgZm9yIChsZXQgdHhJZHggPSAwOyB0eElkeCA8IHJlc3AudHhzLmxlbmd0aDsgdHhJZHgrKykge1xuICAgICAgICBsZXQgdHggPSBuZXcgTW9uZXJvVHgoKTtcbiAgICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICAgICAgdHhzLnB1c2goTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNUeChyZXNwLnR4c1t0eElkeF0sIHR4KSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0eHM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4SGV4ZXModHhIYXNoZXM6IHN0cmluZ1tdLCBwcnVuZSA9IGZhbHNlKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRUeEhleGVzKHR4SGFzaGVzLCBwcnVuZSk7XG4gICAgbGV0IGhleGVzID0gW107XG4gICAgZm9yIChsZXQgdHggb2YgYXdhaXQgdGhpcy5nZXRUeHModHhIYXNoZXMsIHBydW5lKSkgaGV4ZXMucHVzaChwcnVuZSA/IHR4LmdldFBydW5lZEhleCgpIDogdHguZ2V0RnVsbEhleCgpKTtcbiAgICByZXR1cm4gaGV4ZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE1pbmVyVHhTdW0oaGVpZ2h0OiBudW1iZXIsIG51bUJsb2NrczogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9NaW5lclR4U3VtPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldE1pbmVyVHhTdW0oaGVpZ2h0LCBudW1CbG9ja3MpO1xuICAgIGlmIChoZWlnaHQgPT09IHVuZGVmaW5lZCkgaGVpZ2h0ID0gMDtcbiAgICBlbHNlIGFzc2VydChoZWlnaHQgPj0gMCwgXCJIZWlnaHQgbXVzdCBiZSBhbiBpbnRlZ2VyID49IDBcIik7XG4gICAgaWYgKG51bUJsb2NrcyA9PT0gdW5kZWZpbmVkKSBudW1CbG9ja3MgPSBhd2FpdCB0aGlzLmdldEhlaWdodCgpO1xuICAgIGVsc2UgYXNzZXJ0KG51bUJsb2NrcyA+PSAwLCBcIkNvdW50IG11c3QgYmUgYW4gaW50ZWdlciA+PSAwXCIpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2NvaW5iYXNlX3R4X3N1bVwiLCB7aGVpZ2h0OiBoZWlnaHQsIGNvdW50OiBudW1CbG9ja3N9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgbGV0IHR4U3VtID0gbmV3IE1vbmVyb01pbmVyVHhTdW0oKTtcbiAgICB0eFN1bS5zZXRFbWlzc2lvblN1bShCaWdJbnQocmVzcC5yZXN1bHQuZW1pc3Npb25fYW1vdW50KSk7XG4gICAgdHhTdW0uc2V0RmVlU3VtKEJpZ0ludChyZXNwLnJlc3VsdC5mZWVfYW1vdW50KSk7XG4gICAgcmV0dXJuIHR4U3VtO1xuICB9XG4gIFxuICBhc3luYyBnZXRGZWVFc3RpbWF0ZShncmFjZUJsb2Nrcz86IG51bWJlcik6IFByb21pc2U8TW9uZXJvRmVlRXN0aW1hdGU+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0RmVlRXN0aW1hdGUoZ3JhY2VCbG9ja3MpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2ZlZV9lc3RpbWF0ZVwiLCB7Z3JhY2VfYmxvY2tzOiBncmFjZUJsb2Nrc30pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICBsZXQgZmVlRXN0aW1hdGUgPSBuZXcgTW9uZXJvRmVlRXN0aW1hdGUoKTtcbiAgICBmZWVFc3RpbWF0ZS5zZXRGZWUoQmlnSW50KHJlc3AucmVzdWx0LmZlZSkpO1xuICAgIGZlZUVzdGltYXRlLnNldFF1YW50aXphdGlvbk1hc2soQmlnSW50KHJlc3AucmVzdWx0LnF1YW50aXphdGlvbl9tYXNrKSk7XG4gICAgaWYgKHJlc3AucmVzdWx0LmZlZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbGV0IGZlZXMgPSBbXTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVzcC5yZXN1bHQuZmVlcy5sZW5ndGg7IGkrKykgZmVlcy5wdXNoKEJpZ0ludChyZXNwLnJlc3VsdC5mZWVzW2ldKSk7XG4gICAgICBmZWVFc3RpbWF0ZS5zZXRGZWVzKGZlZXMpO1xuICAgIH1cbiAgICByZXR1cm4gZmVlRXN0aW1hdGU7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdFR4SGV4KHR4SGV4OiBzdHJpbmcsIGRvTm90UmVsYXk6IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb1N1Ym1pdFR4UmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnN1Ym1pdFR4SGV4KHR4SGV4LCBkb05vdFJlbGF5KTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcInNlbmRfcmF3X3RyYW5zYWN0aW9uXCIsIHt0eF9hc19oZXg6IHR4SGV4LCBkb19ub3RfcmVsYXk6IGRvTm90UmVsYXl9KTtcbiAgICBsZXQgcmVzdWx0ID0gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNTdWJtaXRUeFJlc3VsdChyZXNwKTtcbiAgICBcbiAgICAvLyBzZXQgaXNHb29kIGJhc2VkIG9uIHN0YXR1c1xuICAgIHRyeSB7XG4gICAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTsgXG4gICAgICByZXN1bHQuc2V0SXNHb29kKHRydWUpO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgcmVzdWx0LnNldElzR29vZChmYWxzZSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbGF5VHhzQnlIYXNoKHR4SGFzaGVzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5yZWxheVR4c0J5SGFzaCh0eEhhc2hlcyk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJyZWxheV90eFwiLCB7dHhpZHM6IHR4SGFzaGVzfSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFBvb2woKTogUHJvbWlzZTxNb25lcm9UeFtdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFR4UG9vbCgpO1xuICAgIFxuICAgIC8vIHNlbmQgcnBjIHJlcXVlc3RcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImdldF90cmFuc2FjdGlvbl9wb29sXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIFxuICAgIC8vIGJ1aWxkIHR4c1xuICAgIGxldCB0eHMgPSBbXTtcbiAgICBpZiAocmVzcC50cmFuc2FjdGlvbnMpIHtcbiAgICAgIGZvciAobGV0IHJwY1R4IG9mIHJlc3AudHJhbnNhY3Rpb25zKSB7XG4gICAgICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeCgpO1xuICAgICAgICB0eHMucHVzaCh0eCk7XG4gICAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICAgICAgdHguc2V0SW5UeFBvb2wodHJ1ZSk7XG4gICAgICAgIHR4LnNldE51bUNvbmZpcm1hdGlvbnMoMCk7XG4gICAgICAgIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVHgocnBjVHgsIHR4KTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHR4cztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhQb29sSGFzaGVzKCk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIC8vIGFzeW5jIGdldFR4UG9vbEJhY2tsb2coKTogUHJvbWlzZTxNb25lcm9UeEJhY2tsb2dFbnRyeVtdPiB7XG4gIC8vICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICAvLyB9XG5cbiAgYXN5bmMgZ2V0VHhQb29sU3RhdHMoKTogUHJvbWlzZTxNb25lcm9UeFBvb2xTdGF0cz4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRUeFBvb2xTdGF0cygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwiZ2V0X3RyYW5zYWN0aW9uX3Bvb2xfc3RhdHNcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVHhQb29sU3RhdHMocmVzcC5wb29sX3N0YXRzKTtcbiAgfVxuICBcbiAgYXN5bmMgZmx1c2hUeFBvb2woaGFzaGVzPzogc3RyaW5nIHwgc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZmx1c2hUeFBvb2woaGFzaGVzKTtcbiAgICBpZiAoaGFzaGVzKSBoYXNoZXMgPSBHZW5VdGlscy5saXN0aWZ5KGhhc2hlcyk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJmbHVzaF90eHBvb2xcIiwge3R4aWRzOiBoYXNoZXN9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEtleUltYWdlU3BlbnRTdGF0dXNlcyhrZXlJbWFnZXM6IHN0cmluZ1tdKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzKGtleUltYWdlcyk7XG4gICAgaWYgKGtleUltYWdlcyA9PT0gdW5kZWZpbmVkIHx8IGtleUltYWdlcy5sZW5ndGggPT09IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBrZXkgaW1hZ2VzIHRvIGNoZWNrIHRoZSBzdGF0dXMgb2ZcIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJpc19rZXlfaW1hZ2Vfc3BlbnRcIiwge2tleV9pbWFnZXM6IGtleUltYWdlc30pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIHJldHVybiByZXNwLnNwZW50X3N0YXR1cztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0T3V0cHV0SGlzdG9ncmFtKGFtb3VudHM/OiBiaWdpbnRbXSwgbWluQ291bnQ/OiBudW1iZXIsIG1heENvdW50PzogbnVtYmVyLCBpc1VubG9ja2VkPzogYm9vbGVhbiwgcmVjZW50Q3V0b2ZmPzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeVtdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldE91dHB1dEhpc3RvZ3JhbShhbW91bnRzLCBtaW5Db3VudCwgbWF4Q291bnQsIGlzVW5sb2NrZWQsIHJlY2VudEN1dG9mZik7XG4gICAgXG4gICAgLy8gc2VuZCBycGMgcmVxdWVzdFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X291dHB1dF9oaXN0b2dyYW1cIiwge1xuICAgICAgYW1vdW50czogYW1vdW50cyxcbiAgICAgIG1pbl9jb3VudDogbWluQ291bnQsXG4gICAgICBtYXhfY291bnQ6IG1heENvdW50LFxuICAgICAgdW5sb2NrZWQ6IGlzVW5sb2NrZWQsXG4gICAgICByZWNlbnRfY3V0b2ZmOiByZWNlbnRDdXRvZmZcbiAgICB9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgXG4gICAgLy8gYnVpbGQgaGlzdG9ncmFtIGVudHJpZXMgZnJvbSByZXNwb25zZVxuICAgIGxldCBlbnRyaWVzID0gW107XG4gICAgaWYgKCFyZXNwLnJlc3VsdC5oaXN0b2dyYW0pIHJldHVybiBlbnRyaWVzO1xuICAgIGZvciAobGV0IHJwY0VudHJ5IG9mIHJlc3AucmVzdWx0Lmhpc3RvZ3JhbSkge1xuICAgICAgZW50cmllcy5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjT3V0cHV0SGlzdG9ncmFtRW50cnkocnBjRW50cnkpKTtcbiAgICB9XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dERpc3RyaWJ1dGlvbihhbW91bnRzLCBjdW11bGF0aXZlLCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldE91dHB1dERpc3RyaWJ1dGlvbihhbW91bnRzLCBjdW11bGF0aXZlLCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0KTtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQgKHJlc3BvbnNlICdkaXN0cmlidXRpb24nIGZpZWxkIGlzIGJpbmFyeSlcIik7XG4gICAgXG4vLyAgICBsZXQgYW1vdW50U3RycyA9IFtdO1xuLy8gICAgZm9yIChsZXQgYW1vdW50IG9mIGFtb3VudHMpIGFtb3VudFN0cnMucHVzaChhbW91bnQudG9KU1ZhbHVlKCkpO1xuLy8gICAgY29uc29sZS5sb2coYW1vdW50U3Rycyk7XG4vLyAgICBjb25zb2xlLmxvZyhjdW11bGF0aXZlKTtcbi8vICAgIGNvbnNvbGUubG9nKHN0YXJ0SGVpZ2h0KTtcbi8vICAgIGNvbnNvbGUubG9nKGVuZEhlaWdodCk7XG4vLyAgICBcbi8vICAgIC8vIHNlbmQgcnBjIHJlcXVlc3Rcbi8vICAgIGNvbnNvbGUubG9nKFwiKioqKioqKioqKiogU0VORElORyBSRVFVRVNUICoqKioqKioqKioqKipcIik7XG4vLyAgICBpZiAoc3RhcnRIZWlnaHQgPT09IHVuZGVmaW5lZCkgc3RhcnRIZWlnaHQgPSAwO1xuLy8gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfb3V0cHV0X2Rpc3RyaWJ1dGlvblwiLCB7XG4vLyAgICAgIGFtb3VudHM6IGFtb3VudFN0cnMsXG4vLyAgICAgIGN1bXVsYXRpdmU6IGN1bXVsYXRpdmUsXG4vLyAgICAgIGZyb21faGVpZ2h0OiBzdGFydEhlaWdodCxcbi8vICAgICAgdG9faGVpZ2h0OiBlbmRIZWlnaHRcbi8vICAgIH0pO1xuLy8gICAgXG4vLyAgICBjb25zb2xlLmxvZyhcIlJFU1BPTlNFXCIpO1xuLy8gICAgY29uc29sZS5sb2cocmVzcCk7XG4vLyAgICBcbi8vICAgIC8vIGJ1aWxkIGRpc3RyaWJ1dGlvbiBlbnRyaWVzIGZyb20gcmVzcG9uc2Vcbi8vICAgIGxldCBlbnRyaWVzID0gW107XG4vLyAgICBpZiAoIXJlc3AucmVzdWx0LmRpc3RyaWJ1dGlvbnMpIHJldHVybiBlbnRyaWVzOyBcbi8vICAgIGZvciAobGV0IHJwY0VudHJ5IG9mIHJlc3AucmVzdWx0LmRpc3RyaWJ1dGlvbnMpIHtcbi8vICAgICAgbGV0IGVudHJ5ID0gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNPdXRwdXREaXN0cmlidXRpb25FbnRyeShycGNFbnRyeSk7XG4vLyAgICAgIGVudHJpZXMucHVzaChlbnRyeSk7XG4vLyAgICB9XG4vLyAgICByZXR1cm4gZW50cmllcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SW5mbygpOiBQcm9taXNlPE1vbmVyb0RhZW1vbkluZm8+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0SW5mbygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2luZm9cIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0luZm8ocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBnZXRTeW5jSW5mbygpOiBQcm9taXNlPE1vbmVyb0RhZW1vblN5bmNJbmZvPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFN5bmNJbmZvKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzeW5jX2luZm9cIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1N5bmNJbmZvKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGFyZEZvcmtJbmZvKCk6IFByb21pc2U8TW9uZXJvSGFyZEZvcmtJbmZvPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEhhcmRGb3JrSW5mbygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiaGFyZF9mb3JrX2luZm9cIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0hhcmRGb3JrSW5mbyhyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFsdENoYWlucygpOiBQcm9taXNlPE1vbmVyb0FsdENoYWluW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QWx0Q2hhaW5zKCk7XG4gICAgXG4vLyAgICAvLyBtb2NrZWQgcmVzcG9uc2UgZm9yIHRlc3Rcbi8vICAgIGxldCByZXNwID0ge1xuLy8gICAgICAgIHN0YXR1czogXCJPS1wiLFxuLy8gICAgICAgIGNoYWluczogW1xuLy8gICAgICAgICAge1xuLy8gICAgICAgICAgICBibG9ja19oYXNoOiBcIjY5N2NmMDNjODlhOWIxMThmN2JkZjExYjFiM2E2YTAyOGQ3YjM2MTdkMmQwZWQ5MTMyMmM1NzA5YWNmNzU2MjVcIixcbi8vICAgICAgICAgICAgZGlmZmljdWx0eTogMTQxMTQ3Mjk2MzgzMDAyODAsXG4vLyAgICAgICAgICAgIGhlaWdodDogMTU2MjA2Mixcbi8vICAgICAgICAgICAgbGVuZ3RoOiAyXG4vLyAgICAgICAgICB9XG4vLyAgICAgICAgXVxuLy8gICAgfVxuICAgIFxuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2FsdGVybmF0ZV9jaGFpbnNcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIGxldCBjaGFpbnMgPSBbXTtcbiAgICBpZiAoIXJlc3AucmVzdWx0LmNoYWlucykgcmV0dXJuIGNoYWlucztcbiAgICBmb3IgKGxldCBycGNDaGFpbiBvZiByZXNwLnJlc3VsdC5jaGFpbnMpIGNoYWlucy5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQWx0Q2hhaW4ocnBjQ2hhaW4pKTtcbiAgICByZXR1cm4gY2hhaW5zO1xuICB9XG4gIFxuICBhc3luYyBnZXRBbHRCbG9ja0hhc2hlcygpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEFsdEJsb2NrSGFzaGVzKCk7XG4gICAgXG4vLyAgICAvLyBtb2NrZWQgcmVzcG9uc2UgZm9yIHRlc3Rcbi8vICAgIGxldCByZXNwID0ge1xuLy8gICAgICAgIHN0YXR1czogXCJPS1wiLFxuLy8gICAgICAgIHVudHJ1c3RlZDogZmFsc2UsXG4vLyAgICAgICAgYmxrc19oYXNoZXM6IFtcIjljMjI3N2M1NDcwMjM0YmU4YjMyMzgyY2RmODA5NGExMDNhYmE0ZmNkNWU4NzVhNmZjMTU5ZGMyZWMwMGUwMTFcIixcIjYzN2MwZTBmMDU1OGUyODQ0OTNmMzhhNWZjY2EzNjE1ZGI1OTQ1OGQ5MGQzYTVlZmYwYTE4ZmY1OWI4M2Y0NmZcIixcIjZmM2FkYzE3NGEyZTgwODI4MTllYmI5NjVjOTZhMDk1ZTNlOGI2MzkyOWFkOWJlMmQ3MDVhZDljMDg2YTZiMWNcIixcIjY5N2NmMDNjODlhOWIxMThmN2JkZjExYjFiM2E2YTAyOGQ3YjM2MTdkMmQwZWQ5MTMyMmM1NzA5YWNmNzU2MjVcIl1cbi8vICAgIH1cbiAgICBcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImdldF9hbHRfYmxvY2tzX2hhc2hlc1wiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICBpZiAoIXJlc3AuYmxrc19oYXNoZXMpIHJldHVybiBbXTtcbiAgICByZXR1cm4gcmVzcC5ibGtzX2hhc2hlcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RG93bmxvYWRMaW1pdCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXREb3dubG9hZExpbWl0KCk7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldEJhbmR3aWR0aExpbWl0cygpKVswXTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0RG93bmxvYWRMaW1pdChsaW1pdDogbnVtYmVyKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc2V0RG93bmxvYWRMaW1pdChsaW1pdCk7XG4gICAgaWYgKGxpbWl0ID09IC0xKSByZXR1cm4gYXdhaXQgdGhpcy5yZXNldERvd25sb2FkTGltaXQoKTtcbiAgICBpZiAoIShHZW5VdGlscy5pc0ludChsaW1pdCkgJiYgbGltaXQgPiAwKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiRG93bmxvYWQgbGltaXQgbXVzdCBiZSBhbiBpbnRlZ2VyIGdyZWF0ZXIgdGhhbiAwXCIpO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5zZXRCYW5kd2lkdGhMaW1pdHMobGltaXQsIDApKVswXTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzZXREb3dubG9hZExpbWl0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnJlc2V0RG93bmxvYWRMaW1pdCgpO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5zZXRCYW5kd2lkdGhMaW1pdHMoLTEsIDApKVswXTtcbiAgfVxuXG4gIGFzeW5jIGdldFVwbG9hZExpbWl0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFVwbG9hZExpbWl0KCk7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldEJhbmR3aWR0aExpbWl0cygpKVsxXTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0VXBsb2FkTGltaXQobGltaXQ6IG51bWJlcik6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnNldFVwbG9hZExpbWl0KGxpbWl0KTtcbiAgICBpZiAobGltaXQgPT0gLTEpIHJldHVybiBhd2FpdCB0aGlzLnJlc2V0VXBsb2FkTGltaXQoKTtcbiAgICBpZiAoIShHZW5VdGlscy5pc0ludChsaW1pdCkgJiYgbGltaXQgPiAwKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiVXBsb2FkIGxpbWl0IG11c3QgYmUgYW4gaW50ZWdlciBncmVhdGVyIHRoYW4gMFwiKTtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuc2V0QmFuZHdpZHRoTGltaXRzKDAsIGxpbWl0KSlbMV07XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2V0VXBsb2FkTGltaXQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24ucmVzZXRVcGxvYWRMaW1pdCgpO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5zZXRCYW5kd2lkdGhMaW1pdHMoMCwgLTEpKVsxXTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGVlcnMoKTogUHJvbWlzZTxNb25lcm9QZWVyW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0UGVlcnMoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9jb25uZWN0aW9uc1wiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgbGV0IHBlZXJzID0gW107XG4gICAgaWYgKCFyZXNwLnJlc3VsdC5jb25uZWN0aW9ucykgcmV0dXJuIHBlZXJzO1xuICAgIGZvciAobGV0IHJwY0Nvbm5lY3Rpb24gb2YgcmVzcC5yZXN1bHQuY29ubmVjdGlvbnMpIHtcbiAgICAgIHBlZXJzLnB1c2goTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNDb25uZWN0aW9uKHJwY0Nvbm5lY3Rpb24pKTtcbiAgICB9XG4gICAgcmV0dXJuIHBlZXJzO1xuICB9XG4gIFxuICBhc3luYyBnZXRLbm93blBlZXJzKCk6IFByb21pc2U8TW9uZXJvUGVlcltdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEtub3duUGVlcnMoKTtcbiAgICBcbiAgICAvLyB0eCBjb25maWdcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImdldF9wZWVyX2xpc3RcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgXG4gICAgLy8gYnVpbGQgcGVlcnNcbiAgICBsZXQgcGVlcnMgPSBbXTtcbiAgICBpZiAocmVzcC5ncmF5X2xpc3QpIHtcbiAgICAgIGZvciAobGV0IHJwY1BlZXIgb2YgcmVzcC5ncmF5X2xpc3QpIHtcbiAgICAgICAgbGV0IHBlZXIgPSBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1BlZXIocnBjUGVlcik7XG4gICAgICAgIHBlZXIuc2V0SXNPbmxpbmUoZmFsc2UpOyAvLyBncmF5IGxpc3QgbWVhbnMgb2ZmbGluZSBsYXN0IGNoZWNrZWRcbiAgICAgICAgcGVlcnMucHVzaChwZWVyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHJlc3Aud2hpdGVfbGlzdCkge1xuICAgICAgZm9yIChsZXQgcnBjUGVlciBvZiByZXNwLndoaXRlX2xpc3QpIHtcbiAgICAgICAgbGV0IHBlZXIgPSBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1BlZXIocnBjUGVlcik7XG4gICAgICAgIHBlZXIuc2V0SXNPbmxpbmUodHJ1ZSk7IC8vIHdoaXRlIGxpc3QgbWVhbnMgb25saW5lIGxhc3QgY2hlY2tlZFxuICAgICAgICBwZWVycy5wdXNoKHBlZXIpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcGVlcnM7XG4gIH1cbiAgXG4gIGFzeW5jIHNldE91dGdvaW5nUGVlckxpbWl0KGxpbWl0OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc2V0T3V0Z29pbmdQZWVyTGltaXQobGltaXQpO1xuICAgIGlmICghKEdlblV0aWxzLmlzSW50KGxpbWl0KSAmJiBsaW1pdCA+PSAwKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiT3V0Z29pbmcgcGVlciBsaW1pdCBtdXN0IGJlID49IDBcIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJvdXRfcGVlcnNcIiwge291dF9wZWVyczogbGltaXR9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0SW5jb21pbmdQZWVyTGltaXQobGltaXQ6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5zZXRJbmNvbWluZ1BlZXJMaW1pdChsaW1pdCk7XG4gICAgaWYgKCEoR2VuVXRpbHMuaXNJbnQobGltaXQpICYmIGxpbWl0ID49IDApKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJJbmNvbWluZyBwZWVyIGxpbWl0IG11c3QgYmUgPj0gMFwiKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImluX3BlZXJzXCIsIHtpbl9wZWVyczogbGltaXR9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGVlckJhbnMoKTogUHJvbWlzZTxNb25lcm9CYW5bXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRQZWVyQmFucygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2JhbnNcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIGxldCBiYW5zID0gW107XG4gICAgZm9yIChsZXQgcnBjQmFuIG9mIHJlc3AucmVzdWx0LmJhbnMpIHtcbiAgICAgIGxldCBiYW4gPSBuZXcgTW9uZXJvQmFuKCk7XG4gICAgICBiYW4uc2V0SG9zdChycGNCYW4uaG9zdCk7XG4gICAgICBiYW4uc2V0SXAocnBjQmFuLmlwKTtcbiAgICAgIGJhbi5zZXRTZWNvbmRzKHJwY0Jhbi5zZWNvbmRzKTtcbiAgICAgIGJhbnMucHVzaChiYW4pO1xuICAgIH1cbiAgICByZXR1cm4gYmFucztcbiAgfVxuICBcbiAgYXN5bmMgc2V0UGVlckJhbnMoYmFuczogTW9uZXJvQmFuW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc2V0UGVlckJhbnMoYmFucyk7XG4gICAgbGV0IHJwY0JhbnMgPSBbXTtcbiAgICBmb3IgKGxldCBiYW4gb2YgYmFucykgcnBjQmFucy5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0VG9ScGNCYW4oYmFuKSk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJzZXRfYmFuc1wiLCB7YmFuczogcnBjQmFuc30pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgc3RhcnRNaW5pbmcoYWRkcmVzczogc3RyaW5nLCBudW1UaHJlYWRzPzogbnVtYmVyLCBpc0JhY2tncm91bmQ/OiBib29sZWFuLCBpZ25vcmVCYXR0ZXJ5PzogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5zdGFydE1pbmluZyhhZGRyZXNzLCBudW1UaHJlYWRzLCBpc0JhY2tncm91bmQsIGlnbm9yZUJhdHRlcnkpO1xuICAgIGFzc2VydChhZGRyZXNzLCBcIk11c3QgcHJvdmlkZSBhZGRyZXNzIHRvIG1pbmUgdG9cIik7XG4gICAgYXNzZXJ0KEdlblV0aWxzLmlzSW50KG51bVRocmVhZHMpICYmIG51bVRocmVhZHMgPiAwLCBcIk51bWJlciBvZiB0aHJlYWRzIG11c3QgYmUgYW4gaW50ZWdlciBncmVhdGVyIHRoYW4gMFwiKTtcbiAgICBhc3NlcnQoaXNCYWNrZ3JvdW5kID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIGlzQmFja2dyb3VuZCA9PT0gXCJib29sZWFuXCIpO1xuICAgIGFzc2VydChpZ25vcmVCYXR0ZXJ5ID09PSB1bmRlZmluZWQgfHwgdHlwZW9mIGlnbm9yZUJhdHRlcnkgPT09IFwiYm9vbGVhblwiKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcInN0YXJ0X21pbmluZ1wiLCB7XG4gICAgICBtaW5lcl9hZGRyZXNzOiBhZGRyZXNzLFxuICAgICAgdGhyZWFkc19jb3VudDogbnVtVGhyZWFkcyxcbiAgICAgIGRvX2JhY2tncm91bmRfbWluaW5nOiBpc0JhY2tncm91bmQsXG4gICAgICBpZ25vcmVfYmF0dGVyeTogaWdub3JlQmF0dGVyeSxcbiAgICB9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgc3RvcE1pbmluZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc3RvcE1pbmluZygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwic3RvcF9taW5pbmdcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE1pbmluZ1N0YXR1cygpOiBQcm9taXNlPE1vbmVyb01pbmluZ1N0YXR1cz4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRNaW5pbmdTdGF0dXMoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcIm1pbmluZ19zdGF0dXNcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjTWluaW5nU3RhdHVzKHJlc3ApO1xuICB9XG4gIFxuICBhc3luYyBzdWJtaXRCbG9ja3MoYmxvY2tCbG9iczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc3VibWl0QmxvY2tzKGJsb2NrQmxvYnMpO1xuICAgIGFzc2VydChBcnJheS5pc0FycmF5KGJsb2NrQmxvYnMpICYmIGJsb2NrQmxvYnMubGVuZ3RoID4gMCwgXCJNdXN0IHByb3ZpZGUgYW4gYXJyYXkgb2YgbWluZWQgYmxvY2sgYmxvYnMgdG8gc3VibWl0XCIpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3VibWl0X2Jsb2NrXCIsIGJsb2NrQmxvYnMpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgfVxuXG4gIGFzeW5jIHBydW5lQmxvY2tjaGFpbihjaGVjazogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvUHJ1bmVSZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24ucHJ1bmVCbG9ja2NoYWluKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJwcnVuZV9ibG9ja2NoYWluXCIsIHtjaGVjazogY2hlY2t9LCAwKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgbGV0IHJlc3VsdCA9IG5ldyBNb25lcm9QcnVuZVJlc3VsdCgpO1xuICAgIHJlc3VsdC5zZXRJc1BydW5lZChyZXNwLnJlc3VsdC5wcnVuZWQpO1xuICAgIHJlc3VsdC5zZXRQcnVuaW5nU2VlZChyZXNwLnJlc3VsdC5wcnVuaW5nX3NlZWQpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrRm9yVXBkYXRlKCk6IFByb21pc2U8TW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uY2hlY2tGb3JVcGRhdGUoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcInVwZGF0ZVwiLCB7Y29tbWFuZDogXCJjaGVja1wifSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVXBkYXRlQ2hlY2tSZXN1bHQocmVzcCk7XG4gIH1cbiAgXG4gIGFzeW5jIGRvd25sb2FkVXBkYXRlKHBhdGg/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmRvd25sb2FkVXBkYXRlKHBhdGgpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwidXBkYXRlXCIsIHtjb21tYW5kOiBcImRvd25sb2FkXCIsIHBhdGg6IHBhdGh9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNVcGRhdGVEb3dubG9hZFJlc3VsdChyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgc3RvcCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc3RvcCgpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwic3RvcF9kYWVtb25cIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gIH1cbiAgXG4gIGFzeW5jIHdhaXRGb3JOZXh0QmxvY2tIZWFkZXIoKTogUHJvbWlzZTxNb25lcm9CbG9ja0hlYWRlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi53YWl0Rm9yTmV4dEJsb2NrSGVhZGVyKCk7XG4gICAgbGV0IHRoYXQgPSB0aGlzO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyBmdW5jdGlvbihyZXNvbHZlKSB7XG4gICAgICBhd2FpdCB0aGF0LmFkZExpc3RlbmVyKG5ldyBjbGFzcyBleHRlbmRzIE1vbmVyb0RhZW1vbkxpc3RlbmVyIHtcbiAgICAgICAgYXN5bmMgb25CbG9ja0hlYWRlcihoZWFkZXIpIHtcbiAgICAgICAgICBhd2FpdCB0aGF0LnJlbW92ZUxpc3RlbmVyKHRoaXMpO1xuICAgICAgICAgIHJlc29sdmUoaGVhZGVyKTtcbiAgICAgICAgfVxuICAgICAgfSk7IFxuICAgIH0pO1xuICB9XG5cbiAgZ2V0UG9sbEludGVydmFsKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuY29uZmlnLnBvbGxJbnRlcnZhbDtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0gQUREIEpTRE9DIEZPUiBTVVBQT1JURUQgREVGQVVMVCBJTVBMRU1FTlRBVElPTlMgLS0tLS0tLS0tLS0tLS1cbiAgYXN5bmMgZ2V0VHgodHhIYXNoPzogc3RyaW5nLCBwcnVuZSA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9UeHx1bmRlZmluZWQ+IHsgcmV0dXJuIHN1cGVyLmdldFR4KHR4SGFzaCwgcHJ1bmUpOyB9O1xuICBhc3luYyBnZXRUeEhleCh0eEhhc2g6IHN0cmluZywgcHJ1bmUgPSBmYWxzZSk6IFByb21pc2U8c3RyaW5nPiB7IHJldHVybiBzdXBlci5nZXRUeEhleCh0eEhhc2gsIHBydW5lKTsgfTtcbiAgYXN5bmMgZ2V0S2V5SW1hZ2VTcGVudFN0YXR1cyhrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzPiB7IHJldHVybiBzdXBlci5nZXRLZXlJbWFnZVNwZW50U3RhdHVzKGtleUltYWdlKTsgfVxuICBhc3luYyBzZXRQZWVyQmFuKGJhbjogTW9uZXJvQmFuKTogUHJvbWlzZTx2b2lkPiB7IHJldHVybiBzdXBlci5zZXRQZWVyQmFuKGJhbik7IH1cbiAgYXN5bmMgc3VibWl0QmxvY2soYmxvY2tCbG9iOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHsgcmV0dXJuIHN1cGVyLnN1Ym1pdEJsb2NrKGJsb2NrQmxvYik7IH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUFJJVkFURSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHJvdGVjdGVkIHJlZnJlc2hMaXN0ZW5pbmcoKSB7XG4gICAgaWYgKHRoaXMucG9sbExpc3RlbmVyID09IHVuZGVmaW5lZCAmJiB0aGlzLmxpc3RlbmVycy5sZW5ndGgpIHRoaXMucG9sbExpc3RlbmVyID0gbmV3IERhZW1vblBvbGxlcih0aGlzKTtcbiAgICBpZiAodGhpcy5wb2xsTGlzdGVuZXIgIT09IHVuZGVmaW5lZCkgdGhpcy5wb2xsTGlzdGVuZXIuc2V0SXNQb2xsaW5nKHRoaXMubGlzdGVuZXJzLmxlbmd0aCA+IDApO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0QmFuZHdpZHRoTGltaXRzKCkge1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwiZ2V0X2xpbWl0XCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIHJldHVybiBbcmVzcC5saW1pdF9kb3duLCByZXNwLmxpbWl0X3VwXTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIHNldEJhbmR3aWR0aExpbWl0cyhkb3duTGltaXQsIHVwTGltaXQpIHtcbiAgICBpZiAoZG93bkxpbWl0ID09PSB1bmRlZmluZWQpIGRvd25MaW1pdCA9IDA7XG4gICAgaWYgKHVwTGltaXQgPT09IHVuZGVmaW5lZCkgdXBMaW1pdCA9IDA7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJzZXRfbGltaXRcIiwge2xpbWl0X2Rvd246IGRvd25MaW1pdCwgbGltaXRfdXA6IHVwTGltaXR9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICByZXR1cm4gW3Jlc3AubGltaXRfZG93biwgcmVzcC5saW1pdF91cF07XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYSBjb250aWd1b3VzIGNodW5rIG9mIGJsb2NrcyBzdGFydGluZyBmcm9tIGEgZ2l2ZW4gaGVpZ2h0IHVwIHRvIGEgbWF4aW11bVxuICAgKiBoZWlnaHQgb3IgYW1vdW50IG9mIGJsb2NrIGRhdGEgZmV0Y2hlZCBmcm9tIHRoZSBibG9ja2NoYWluLCB3aGljaGV2ZXIgY29tZXMgZmlyc3QuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gW3N0YXJ0SGVpZ2h0XSAtIHN0YXJ0IGhlaWdodCB0byByZXRyaWV2ZSBibG9ja3MgKGRlZmF1bHQgMClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFttYXhIZWlnaHRdIC0gbWF4aW11bSBlbmQgaGVpZ2h0IHRvIHJldHJpZXZlIGJsb2NrcyAoZGVmYXVsdCBibG9ja2NoYWluIGhlaWdodClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFttYXhSZXFTaXplXSAtIG1heGltdW0gYW1vdW50IG9mIGJsb2NrIGRhdGEgdG8gZmV0Y2ggZnJvbSB0aGUgYmxvY2tjaGFpbiBpbiBieXRlcyAoZGVmYXVsdCAzLDAwMCwwMDAgYnl0ZXMpXG4gICAqIEByZXR1cm4ge01vbmVyb0Jsb2NrW119IGFyZSB0aGUgcmVzdWx0aW5nIGNodW5rIG9mIGJsb2Nrc1xuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIGdldE1heEJsb2NrcyhzdGFydEhlaWdodCwgbWF4SGVpZ2h0LCBtYXhSZXFTaXplKSB7XG4gICAgaWYgKHN0YXJ0SGVpZ2h0ID09PSB1bmRlZmluZWQpIHN0YXJ0SGVpZ2h0ID0gMDtcbiAgICBpZiAobWF4SGVpZ2h0ID09PSB1bmRlZmluZWQpIG1heEhlaWdodCA9IGF3YWl0IHRoaXMuZ2V0SGVpZ2h0KCkgLSAxO1xuICAgIGlmIChtYXhSZXFTaXplID09PSB1bmRlZmluZWQpIG1heFJlcVNpemUgPSBNb25lcm9EYWVtb25ScGMuTUFYX1JFUV9TSVpFO1xuICAgIFxuICAgIC8vIGRldGVybWluZSBlbmQgaGVpZ2h0IHRvIGZldGNoXG4gICAgbGV0IHJlcVNpemUgPSAwO1xuICAgIGxldCBlbmRIZWlnaHQgPSBzdGFydEhlaWdodCAtIDE7XG4gICAgd2hpbGUgKHJlcVNpemUgPCBtYXhSZXFTaXplICYmIGVuZEhlaWdodCA8IG1heEhlaWdodCkge1xuICAgICAgXG4gICAgICAvLyBnZXQgaGVhZGVyIG9mIG5leHQgYmxvY2tcbiAgICAgIGxldCBoZWFkZXIgPSBhd2FpdCB0aGlzLmdldEJsb2NrSGVhZGVyQnlIZWlnaHRDYWNoZWQoZW5kSGVpZ2h0ICsgMSwgbWF4SGVpZ2h0KTtcbiAgICAgIFxuICAgICAgLy8gYmxvY2sgY2Fubm90IGJlIGJpZ2dlciB0aGFuIG1heCByZXF1ZXN0IHNpemVcbiAgICAgIGFzc2VydChoZWFkZXIuZ2V0U2l6ZSgpIDw9IG1heFJlcVNpemUsIFwiQmxvY2sgZXhjZWVkcyBtYXhpbXVtIHJlcXVlc3Qgc2l6ZTogXCIgKyBoZWFkZXIuZ2V0U2l6ZSgpKTtcbiAgICAgIFxuICAgICAgLy8gZG9uZSBpdGVyYXRpbmcgaWYgZmV0Y2hpbmcgYmxvY2sgd291bGQgZXhjZWVkIG1heCByZXF1ZXN0IHNpemVcbiAgICAgIGlmIChyZXFTaXplICsgaGVhZGVyLmdldFNpemUoKSA+IG1heFJlcVNpemUpIGJyZWFrO1xuICAgICAgXG4gICAgICAvLyBvdGhlcndpc2UgYmxvY2sgaXMgaW5jbHVkZWRcbiAgICAgIHJlcVNpemUgKz0gaGVhZGVyLmdldFNpemUoKTtcbiAgICAgIGVuZEhlaWdodCsrO1xuICAgIH1cbiAgICByZXR1cm4gZW5kSGVpZ2h0ID49IHN0YXJ0SGVpZ2h0ID8gYXdhaXQgdGhpcy5nZXRCbG9ja3NCeVJhbmdlKHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpIDogW107XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgYSBoZWFkZXIgYnkgaGVpZ2h0IGZyb20gdGhlIGNhY2hlIG9yIGZldGNoZXMgYW5kIGNhY2hlcyBhIGhlYWRlclxuICAgKiByYW5nZSBpZiBub3QgYWxyZWFkeSBpbiB0aGUgY2FjaGUuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gaGVpZ2h0IC0gaGVpZ2h0IG9mIHRoZSBoZWFkZXIgdG8gcmV0cmlldmUgZnJvbSB0aGUgY2FjaGVcbiAgICogQHBhcmFtIHtudW1iZXJ9IG1heEhlaWdodCAtIG1heGltdW0gaGVpZ2h0IG9mIGhlYWRlcnMgdG8gY2FjaGVcbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyBnZXRCbG9ja0hlYWRlckJ5SGVpZ2h0Q2FjaGVkKGhlaWdodCwgbWF4SGVpZ2h0KSB7XG4gICAgXG4gICAgLy8gZ2V0IGhlYWRlciBmcm9tIGNhY2hlXG4gICAgbGV0IGNhY2hlZEhlYWRlciA9IHRoaXMuY2FjaGVkSGVhZGVyc1toZWlnaHRdO1xuICAgIGlmIChjYWNoZWRIZWFkZXIpIHJldHVybiBjYWNoZWRIZWFkZXI7XG4gICAgXG4gICAgLy8gZmV0Y2ggYW5kIGNhY2hlIGhlYWRlcnMgaWYgbm90IGluIGNhY2hlXG4gICAgbGV0IGVuZEhlaWdodCA9IE1hdGgubWluKG1heEhlaWdodCwgaGVpZ2h0ICsgTW9uZXJvRGFlbW9uUnBjLk5VTV9IRUFERVJTX1BFUl9SRVEgLSAxKTsgIC8vIFRPRE86IGNvdWxkIHNwZWNpZnkgZW5kIGhlaWdodCB0byBjYWNoZSB0byBvcHRpbWl6ZSBzbWFsbCByZXF1ZXN0cyAod291bGQgbGlrZSB0byBoYXZlIHRpbWUgcHJvZmlsaW5nIGluIHBsYWNlIHRob3VnaClcbiAgICBsZXQgaGVhZGVycyA9IGF3YWl0IHRoaXMuZ2V0QmxvY2tIZWFkZXJzQnlSYW5nZShoZWlnaHQsIGVuZEhlaWdodCk7XG4gICAgZm9yIChsZXQgaGVhZGVyIG9mIGhlYWRlcnMpIHtcbiAgICAgIHRoaXMuY2FjaGVkSGVhZGVyc1toZWFkZXIuZ2V0SGVpZ2h0KCldID0gaGVhZGVyO1xuICAgIH1cbiAgICBcbiAgICAvLyByZXR1cm4gdGhlIGNhY2hlZCBoZWFkZXJcbiAgICByZXR1cm4gdGhpcy5jYWNoZWRIZWFkZXJzW2hlaWdodF07XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBTVEFUSUMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgc3RhdGljIGFzeW5jIGNvbm5lY3RUb0RhZW1vblJwYyh1cmlPckNvbmZpZzogc3RyaW5nIHwgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPiB8IFBhcnRpYWw8TW9uZXJvRGFlbW9uQ29uZmlnPiB8IHN0cmluZ1tdLCB1c2VybmFtZT86IHN0cmluZywgcGFzc3dvcmQ/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0RhZW1vblJwYz4ge1xuICAgIGxldCBjb25maWcgPSBNb25lcm9EYWVtb25ScGMubm9ybWFsaXplQ29uZmlnKHVyaU9yQ29uZmlnLCB1c2VybmFtZSwgcGFzc3dvcmQpO1xuICAgIGlmIChjb25maWcuY21kKSByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLnN0YXJ0TW9uZXJvZFByb2Nlc3MoY29uZmlnKTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0RhZW1vblJwYyhjb25maWcsIGNvbmZpZy5wcm94eVRvV29ya2VyID8gYXdhaXQgTW9uZXJvRGFlbW9uUnBjUHJveHkuY29ubmVjdChjb25maWcpIDogdW5kZWZpbmVkKTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBhc3luYyBzdGFydE1vbmVyb2RQcm9jZXNzKGNvbmZpZzogTW9uZXJvRGFlbW9uQ29uZmlnKTogUHJvbWlzZTxNb25lcm9EYWVtb25ScGM+IHtcbiAgICBhc3NlcnQoR2VuVXRpbHMuaXNBcnJheShjb25maWcuY21kKSwgXCJNdXN0IHByb3ZpZGUgc3RyaW5nIGFycmF5IHdpdGggY29tbWFuZCBsaW5lIHBhcmFtZXRlcnNcIik7XG4gICAgXG4gICAgLy8gc3RhcnQgcHJvY2Vzc1xuICAgIGxldCBjaGlsZFByb2Nlc3MgPSByZXF1aXJlKCdjaGlsZF9wcm9jZXNzJykuc3Bhd24oY29uZmlnLmNtZFswXSwgY29uZmlnLmNtZC5zbGljZSgxKSwge1xuICAgICAgZW52OiB7IC4uLnByb2Nlc3MuZW52LCBMQU5HOiAnZW5fVVMuVVRGLTgnIH0gLy8gc2NyYXBlIG91dHB1dCBpbiBlbmdsaXNoXG4gICAgfSk7XG4gICAgY2hpbGRQcm9jZXNzLnN0ZG91dC5zZXRFbmNvZGluZygndXRmOCcpO1xuICAgIGNoaWxkUHJvY2Vzcy5zdGRlcnIuc2V0RW5jb2RpbmcoJ3V0ZjgnKTtcbiAgICBcbiAgICAvLyByZXR1cm4gcHJvbWlzZSB3aGljaCByZXNvbHZlcyBhZnRlciBzdGFydGluZyBtb25lcm9kXG4gICAgbGV0IHVyaTtcbiAgICBsZXQgb3V0cHV0ID0gXCJcIjtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGF3YWl0IG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBzdGRvdXRcbiAgICAgICAgY2hpbGRQcm9jZXNzLnN0ZG91dC5vbignZGF0YScsIGFzeW5jIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICBsZXQgbGluZSA9IGRhdGEudG9TdHJpbmcoKTtcbiAgICAgICAgICBMaWJyYXJ5VXRpbHMubG9nKDIsIGxpbmUpO1xuICAgICAgICAgIG91dHB1dCArPSBsaW5lICsgJ1xcbic7IC8vIGNhcHR1cmUgb3V0cHV0IGluIGNhc2Ugb2YgZXJyb3JcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBleHRyYWN0IHVyaSBmcm9tIGUuZy4gXCJJIEJpbmRpbmcgb24gMTI3LjAuMC4xIChJUHY0KTozODA4NVwiXG4gICAgICAgICAgbGV0IHVyaUxpbmVDb250YWlucyA9IFwiQmluZGluZyBvbiBcIjtcbiAgICAgICAgICBsZXQgdXJpTGluZUNvbnRhaW5zSWR4ID0gbGluZS5pbmRleE9mKHVyaUxpbmVDb250YWlucyk7XG4gICAgICAgICAgaWYgKHVyaUxpbmVDb250YWluc0lkeCA+PSAwKSB7XG4gICAgICAgICAgICBsZXQgaG9zdCA9IGxpbmUuc3Vic3RyaW5nKHVyaUxpbmVDb250YWluc0lkeCArIHVyaUxpbmVDb250YWlucy5sZW5ndGgsIGxpbmUubGFzdEluZGV4T2YoJyAnKSk7XG4gICAgICAgICAgICBsZXQgdW5mb3JtYXR0ZWRMaW5lID0gbGluZS5yZXBsYWNlKC9cXHUwMDFiXFxbLio/bS9nLCAnJykudHJpbSgpOyAvLyByZW1vdmUgY29sb3IgZm9ybWF0dGluZ1xuICAgICAgICAgICAgbGV0IHBvcnQgPSB1bmZvcm1hdHRlZExpbmUuc3Vic3RyaW5nKHVuZm9ybWF0dGVkTGluZS5sYXN0SW5kZXhPZignOicpICsgMSk7XG4gICAgICAgICAgICBsZXQgc3NsSWR4ID0gY29uZmlnLmNtZC5pbmRleE9mKFwiLS1ycGMtc3NsXCIpO1xuICAgICAgICAgICAgbGV0IHNzbEVuYWJsZWQgPSBzc2xJZHggPj0gMCA/IFwiZW5hYmxlZFwiID09IGNvbmZpZy5jbWRbc3NsSWR4ICsgMV0udG9Mb3dlckNhc2UoKSA6IGZhbHNlO1xuICAgICAgICAgICAgdXJpID0gKHNzbEVuYWJsZWQgPyBcImh0dHBzXCIgOiBcImh0dHBcIikgKyBcIjovL1wiICsgaG9zdCArIFwiOlwiICsgcG9ydDtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gcmVhZCBzdWNjZXNzIG1lc3NhZ2VcbiAgICAgICAgICBpZiAobGluZS5pbmRleE9mKFwiY29yZSBSUEMgc2VydmVyIHN0YXJ0ZWQgb2tcIikgPj0gMCkge1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBnZXQgdXNlcm5hbWUgYW5kIHBhc3N3b3JkIGZyb20gcGFyYW1zXG4gICAgICAgICAgICBsZXQgdXNlclBhc3NJZHggPSBjb25maWcuY21kLmluZGV4T2YoXCItLXJwYy1sb2dpblwiKTtcbiAgICAgICAgICAgIGxldCB1c2VyUGFzcyA9IHVzZXJQYXNzSWR4ID49IDAgPyBjb25maWcuY21kW3VzZXJQYXNzSWR4ICsgMV0gOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICBsZXQgdXNlcm5hbWUgPSB1c2VyUGFzcyA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogdXNlclBhc3Muc3Vic3RyaW5nKDAsIHVzZXJQYXNzLmluZGV4T2YoJzonKSk7XG4gICAgICAgICAgICBsZXQgcGFzc3dvcmQgPSB1c2VyUGFzcyA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogdXNlclBhc3Muc3Vic3RyaW5nKHVzZXJQYXNzLmluZGV4T2YoJzonKSArIDEpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBjcmVhdGUgY2xpZW50IGNvbm5lY3RlZCB0byBpbnRlcm5hbCBwcm9jZXNzXG4gICAgICAgICAgICBjb25maWcgPSBjb25maWcuY29weSgpLnNldFNlcnZlcih7dXJpOiB1cmksIHVzZXJuYW1lOiB1c2VybmFtZSwgcGFzc3dvcmQ6IHBhc3N3b3JkLCByZWplY3RVbmF1dGhvcml6ZWQ6IGNvbmZpZy5nZXRTZXJ2ZXIoKSA/IGNvbmZpZy5nZXRTZXJ2ZXIoKS5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHVuZGVmaW5lZH0pO1xuICAgICAgICAgICAgY29uZmlnLnNldFByb3h5VG9Xb3JrZXIoY29uZmlnLnByb3h5VG9Xb3JrZXIpO1xuICAgICAgICAgICAgY29uZmlnLmNtZCA9IHVuZGVmaW5lZFxuICAgICAgICAgICAgbGV0IGRhZW1vbiA9IGF3YWl0IE1vbmVyb0RhZW1vblJwYy5jb25uZWN0VG9EYWVtb25ScGMoY29uZmlnKTtcbiAgICAgICAgICAgIGRhZW1vbi5wcm9jZXNzID0gY2hpbGRQcm9jZXNzO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyByZXNvbHZlIHByb21pc2Ugd2l0aCBjbGllbnQgY29ubmVjdGVkIHRvIGludGVybmFsIHByb2Nlc3MgXG4gICAgICAgICAgICB0aGlzLmlzUmVzb2x2ZWQgPSB0cnVlO1xuICAgICAgICAgICAgcmVzb2x2ZShkYWVtb24pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgc3RkZXJyXG4gICAgICAgIGNoaWxkUHJvY2Vzcy5zdGRlcnIub24oJ2RhdGEnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgaWYgKExpYnJhcnlVdGlscy5nZXRMb2dMZXZlbCgpID49IDIpIGNvbnNvbGUuZXJyb3IoZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gaGFuZGxlIGV4aXRcbiAgICAgICAgY2hpbGRQcm9jZXNzLm9uKFwiZXhpdFwiLCBmdW5jdGlvbihjb2RlKSB7XG4gICAgICAgICAgaWYgKCF0aGlzLmlzUmVzb2x2ZWQpIHJlamVjdChuZXcgRXJyb3IoXCJtb25lcm9kIHByb2Nlc3MgdGVybWluYXRlZCB3aXRoIGV4aXQgY29kZSBcIiArIGNvZGUgKyAob3V0cHV0ID8gXCI6XFxuXFxuXCIgKyBvdXRwdXQgOiBcIlwiKSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBlcnJvclxuICAgICAgICBjaGlsZFByb2Nlc3Mub24oXCJlcnJvclwiLCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICBpZiAoZXJyLm1lc3NhZ2UuaW5kZXhPZihcIkVOT0VOVFwiKSA+PSAwKSByZWplY3QobmV3IEVycm9yKFwibW9uZXJvZCBkb2VzIG5vdCBleGlzdCBhdCBwYXRoICdcIiArIGNvbmZpZy5jbWRbMF0gKyBcIidcIikpO1xuICAgICAgICAgIGlmICghdGhpcy5pc1Jlc29sdmVkKSByZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgdW5jYXVnaHQgZXhjZXB0aW9uXG4gICAgICAgIGNoaWxkUHJvY2Vzcy5vbihcInVuY2F1Z2h0RXhjZXB0aW9uXCIsIGZ1bmN0aW9uKGVyciwgb3JpZ2luKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIlVuY2F1Z2h0IGV4Y2VwdGlvbiBpbiBtb25lcm9kIHByb2Nlc3M6IFwiICsgZXJyLm1lc3NhZ2UpO1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3Iob3JpZ2luKTtcbiAgICAgICAgICBpZiAoIXRoaXMuaXNSZXNvbHZlZCkgcmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihlcnIubWVzc2FnZSk7XG4gICAgfVxuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIG5vcm1hbGl6ZUNvbmZpZyh1cmlPckNvbmZpZzogc3RyaW5nIHwgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPiB8IFBhcnRpYWw8TW9uZXJvRGFlbW9uQ29uZmlnPiB8IHN0cmluZ1tdLCB1c2VybmFtZT86IHN0cmluZywgcGFzc3dvcmQ/OiBzdHJpbmcpOiBNb25lcm9EYWVtb25Db25maWcge1xuICAgIGxldCBjb25maWc6IHVuZGVmaW5lZCB8IFBhcnRpYWw8TW9uZXJvRGFlbW9uQ29uZmlnPiA9IHVuZGVmaW5lZDtcbiAgICBpZiAodHlwZW9mIHVyaU9yQ29uZmlnID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBjb25maWcgPSBuZXcgTW9uZXJvRGFlbW9uQ29uZmlnKHtzZXJ2ZXI6IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHVyaU9yQ29uZmlnIGFzIHN0cmluZywgdXNlcm5hbWUsIHBhc3N3b3JkKX0pO1xuICAgIH0gZWxzZSBpZiAoKHVyaU9yQ29uZmlnIGFzIFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4pLnVyaSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25maWcgPSBuZXcgTW9uZXJvRGFlbW9uQ29uZmlnKHtzZXJ2ZXI6IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHVyaU9yQ29uZmlnIGFzIFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4pfSk7XG5cbiAgICAgIC8vIHRyYW5zZmVyIHdvcmtlciBwcm94eSBzZXR0aW5nIGZyb20gcnBjIGNvbm5lY3Rpb24gdG8gZGFlbW9uIGNvbmZpZ1xuICAgICAgY29uZmlnLnNldFByb3h5VG9Xb3JrZXIoKHVyaU9yQ29uZmlnIGFzIFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4pLnByb3h5VG9Xb3JrZXIpO1xuICAgICAgY29uZmlnLmdldFNlcnZlcigpLnNldFByb3h5VG9Xb3JrZXIoTW9uZXJvUnBjQ29ubmVjdGlvbi5ERUZBVUxUX0NPTkZJRy5wcm94eVRvV29ya2VyKTtcbiAgICB9IGVsc2UgaWYgKEdlblV0aWxzLmlzQXJyYXkodXJpT3JDb25maWcpKSB7XG4gICAgICBjb25maWcgPSBuZXcgTW9uZXJvRGFlbW9uQ29uZmlnKHtjbWQ6IHVyaU9yQ29uZmlnIGFzIHN0cmluZ1tdfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbmZpZyA9IG5ldyBNb25lcm9EYWVtb25Db25maWcodXJpT3JDb25maWcgYXMgUGFydGlhbDxNb25lcm9EYWVtb25Db25maWc+KTtcbiAgICB9XG4gICAgaWYgKGNvbmZpZy5wcm94eVRvV29ya2VyID09PSB1bmRlZmluZWQpIGNvbmZpZy5wcm94eVRvV29ya2VyID0gdHJ1ZTtcbiAgICBpZiAoY29uZmlnLnBvbGxJbnRlcnZhbCA9PT0gdW5kZWZpbmVkKSBjb25maWcucG9sbEludGVydmFsID0gTW9uZXJvRGFlbW9uUnBjLkRFRkFVTFRfUE9MTF9QRVJJT0Q7XG4gICAgcmV0dXJuIGNvbmZpZyBhcyBNb25lcm9EYWVtb25Db25maWc7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKSB7XG4gICAgaWYgKHJlc3Auc3RhdHVzICE9PSBcIk9LXCIpIHRocm93IG5ldyBNb25lcm9FcnJvcihyZXNwLnN0YXR1cyk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY0Jsb2NrSGVhZGVyKHJwY0hlYWRlcikge1xuICAgIGlmICghcnBjSGVhZGVyKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIGxldCBoZWFkZXIgPSBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjSGVhZGVyKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY0hlYWRlcltrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJibG9ja19zaXplXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0U2l6ZSwgaGVhZGVyLnNldFNpemUsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGVwdGhcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXREZXB0aCwgaGVhZGVyLnNldERlcHRoLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRpZmZpY3VsdHlcIikgeyB9ICAvLyBoYW5kbGVkIGJ5IHdpZGVfZGlmZmljdWx0eVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImN1bXVsYXRpdmVfZGlmZmljdWx0eVwiKSB7IH0gLy8gaGFuZGxlZCBieSB3aWRlX2N1bXVsYXRpdmVfZGlmZmljdWx0eVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRpZmZpY3VsdHlfdG9wNjRcIikgeyB9ICAvLyBoYW5kbGVkIGJ5IHdpZGVfZGlmZmljdWx0eVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImN1bXVsYXRpdmVfZGlmZmljdWx0eV90b3A2NFwiKSB7IH0gLy8gaGFuZGxlZCBieSB3aWRlX2N1bXVsYXRpdmVfZGlmZmljdWx0eVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndpZGVfZGlmZmljdWx0eVwiKSBoZWFkZXIuc2V0RGlmZmljdWx0eShHZW5VdGlscy5yZWNvbmNpbGUoaGVhZGVyLmdldERpZmZpY3VsdHkoKSwgTW9uZXJvRGFlbW9uUnBjLnByZWZpeGVkSGV4VG9CSSh2YWwpKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2lkZV9jdW11bGF0aXZlX2RpZmZpY3VsdHlcIikgaGVhZGVyLnNldEN1bXVsYXRpdmVEaWZmaWN1bHR5KEdlblV0aWxzLnJlY29uY2lsZShoZWFkZXIuZ2V0Q3VtdWxhdGl2ZURpZmZpY3VsdHkoKSwgTW9uZXJvRGFlbW9uUnBjLnByZWZpeGVkSGV4VG9CSSh2YWwpKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGFzaFwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldEhhc2gsIGhlYWRlci5zZXRIYXNoLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhlaWdodFwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldEhlaWdodCwgaGVhZGVyLnNldEhlaWdodCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtYWpvcl92ZXJzaW9uXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0TWFqb3JWZXJzaW9uLCBoZWFkZXIuc2V0TWFqb3JWZXJzaW9uLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm1pbm9yX3ZlcnNpb25cIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRNaW5vclZlcnNpb24sIGhlYWRlci5zZXRNaW5vclZlcnNpb24sIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibm9uY2VcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXROb25jZSwgaGVhZGVyLnNldE5vbmNlLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm51bV90eGVzXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0TnVtVHhzLCBoZWFkZXIuc2V0TnVtVHhzLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm9ycGhhbl9zdGF0dXNcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRPcnBoYW5TdGF0dXMsIGhlYWRlci5zZXRPcnBoYW5TdGF0dXMsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHJldl9oYXNoXCIgfHwga2V5ID09PSBcInByZXZfaWRcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRQcmV2SGFzaCwgaGVhZGVyLnNldFByZXZIYXNoLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJld2FyZFwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldFJld2FyZCwgaGVhZGVyLnNldFJld2FyZCwgQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRpbWVzdGFtcFwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldFRpbWVzdGFtcCwgaGVhZGVyLnNldFRpbWVzdGFtcCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja193ZWlnaHRcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRXZWlnaHQsIGhlYWRlci5zZXRXZWlnaHQsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibG9uZ190ZXJtX3dlaWdodFwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldExvbmdUZXJtV2VpZ2h0LCBoZWFkZXIuc2V0TG9uZ1Rlcm1XZWlnaHQsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicG93X2hhc2hcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRQb3dIYXNoLCBoZWFkZXIuc2V0UG93SGFzaCwgdmFsID09PSBcIlwiID8gdW5kZWZpbmVkIDogdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9oYXNoZXNcIikge30gIC8vIHVzZWQgaW4gYmxvY2sgbW9kZWwsIG5vdCBoZWFkZXIgbW9kZWxcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtaW5lcl90eFwiKSB7fSAgIC8vIHVzZWQgaW4gYmxvY2sgbW9kZWwsIG5vdCBoZWFkZXIgbW9kZWxcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtaW5lcl90eF9oYXNoXCIpIGhlYWRlci5zZXRNaW5lclR4SGFzaCh2YWwpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgYmxvY2sgaGVhZGVyIGZpZWxkOiAnXCIgKyBrZXkgKyBcIic6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIGhlYWRlcjtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjQmxvY2socnBjQmxvY2spIHtcbiAgICBcbiAgICAvLyBidWlsZCBibG9ja1xuICAgIGxldCBibG9jayA9IG5ldyBNb25lcm9CbG9jayhNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Jsb2NrSGVhZGVyKHJwY0Jsb2NrLmJsb2NrX2hlYWRlciA/IHJwY0Jsb2NrLmJsb2NrX2hlYWRlciA6IHJwY0Jsb2NrKSBhcyBNb25lcm9CbG9jayk7XG4gICAgYmxvY2suc2V0SGV4KHJwY0Jsb2NrLmJsb2IpO1xuICAgIGJsb2NrLnNldFR4SGFzaGVzKHJwY0Jsb2NrLnR4X2hhc2hlcyA9PT0gdW5kZWZpbmVkID8gW10gOiBycGNCbG9jay50eF9oYXNoZXMpO1xuICAgIFxuICAgIC8vIGJ1aWxkIG1pbmVyIHR4XG4gICAgbGV0IHJwY01pbmVyVHggPSBycGNCbG9jay5qc29uID8gSlNPTi5wYXJzZShycGNCbG9jay5qc29uKS5taW5lcl90eCA6IHJwY0Jsb2NrLm1pbmVyX3R4OyAgLy8gbWF5IG5lZWQgdG8gYmUgcGFyc2VkIGZyb20ganNvblxuICAgIGxldCBtaW5lclR4ID0gbmV3IE1vbmVyb1R4KCk7XG4gICAgYmxvY2suc2V0TWluZXJUeChtaW5lclR4KTtcbiAgICBtaW5lclR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgIG1pbmVyVHguc2V0SW5UeFBvb2woZmFsc2UpXG4gICAgbWluZXJUeC5zZXRJc01pbmVyVHgodHJ1ZSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNUeChycGNNaW5lclR4LCBtaW5lclR4KTtcbiAgICBcbiAgICByZXR1cm4gYmxvY2s7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBUcmFuc2ZlcnMgUlBDIHR4IGZpZWxkcyB0byBhIGdpdmVuIE1vbmVyb1R4IHdpdGhvdXQgb3ZlcndyaXRpbmcgcHJldmlvdXMgdmFsdWVzLlxuICAgKiBcbiAgICogVE9ETzogc3dpdGNoIGZyb20gc2FmZSBzZXRcbiAgICogXG4gICAqIEBwYXJhbSBycGNUeCAtIFJQQyBtYXAgY29udGFpbmluZyB0cmFuc2FjdGlvbiBmaWVsZHNcbiAgICogQHBhcmFtIHR4ICAtIE1vbmVyb1R4IHRvIHBvcHVsYXRlIHdpdGggdmFsdWVzIChvcHRpb25hbClcbiAgICogQHJldHVybiB0eCAtIHNhbWUgdHggdGhhdCB3YXMgcGFzc2VkIGluIG9yIGEgbmV3IG9uZSBpZiBub25lIGdpdmVuXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNUeChycGNUeCwgdHgpIHtcbiAgICBpZiAocnBjVHggPT09IHVuZGVmaW5lZCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICBpZiAodHggPT09IHVuZGVmaW5lZCkgdHggPSBuZXcgTW9uZXJvVHgoKTtcbiAgICBcbiAgICAvLyBpbml0aWFsaXplIGZyb20gcnBjIG1hcFxuICAgIGxldCBoZWFkZXI7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1R4KSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1R4W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcInR4X2hhc2hcIiB8fCBrZXkgPT09IFwiaWRfaGFzaFwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRIYXNoLCB0eC5zZXRIYXNoLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX3RpbWVzdGFtcFwiKSB7XG4gICAgICAgIGlmICghaGVhZGVyKSBoZWFkZXIgPSBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoKTtcbiAgICAgICAgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRUaW1lc3RhbXAsIGhlYWRlci5zZXRUaW1lc3RhbXAsIHZhbCk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfaGVpZ2h0XCIpIHtcbiAgICAgICAgaWYgKCFoZWFkZXIpIGhlYWRlciA9IG5ldyBNb25lcm9CbG9ja0hlYWRlcigpO1xuICAgICAgICBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldEhlaWdodCwgaGVhZGVyLnNldEhlaWdodCwgdmFsKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsYXN0X3JlbGF5ZWRfdGltZVwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRMYXN0UmVsYXllZFRpbWVzdGFtcCwgdHguc2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVjZWl2ZV90aW1lXCIgfHwga2V5ID09PSBcInJlY2VpdmVkX3RpbWVzdGFtcFwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRSZWNlaXZlZFRpbWVzdGFtcCwgdHguc2V0UmVjZWl2ZWRUaW1lc3RhbXAsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY29uZmlybWF0aW9uc1wiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXROdW1Db25maXJtYXRpb25zLCB0eC5zZXROdW1Db25maXJtYXRpb25zLCB2YWwpOyBcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJpbl9wb29sXCIpIHtcbiAgICAgICAgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SXNDb25maXJtZWQsIHR4LnNldElzQ29uZmlybWVkLCAhdmFsKTtcbiAgICAgICAgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SW5UeFBvb2wsIHR4LnNldEluVHhQb29sLCB2YWwpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRvdWJsZV9zcGVuZF9zZWVuXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzRG91YmxlU3BlbmRTZWVuLCB0eC5zZXRJc0RvdWJsZVNwZW5kU2VlbiwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ2ZXJzaW9uXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFZlcnNpb24sIHR4LnNldFZlcnNpb24sIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZXh0cmFcIikge1xuICAgICAgICBpZiAodHlwZW9mIHZhbCA9PT0gXCJzdHJpbmdcIikgY29uc29sZS5sb2coXCJXQVJOSU5HOiBleHRyYSBmaWVsZCBhcyBzdHJpbmcgbm90IGJlaW5nIGFzaWduZWQgdG8gaW50W106IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTsgLy8gVE9ETzogaG93IHRvIHNldCBzdHJpbmcgdG8gaW50W10/IC0gb3IsIGV4dHJhIGlzIHN0cmluZyB3aGljaCBjYW4gZW5jb2RlIGludFtdXG4gICAgICAgIGVsc2UgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0RXh0cmEsIHR4LnNldEV4dHJhLCBuZXcgVWludDhBcnJheSh2YWwpKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ2aW5cIikge1xuICAgICAgICBpZiAodmFsLmxlbmd0aCAhPT0gMSB8fCAhdmFsWzBdLmdlbikgeyAgLy8gaWdub3JlIG1pbmVyIGlucHV0IFRPRE86IHdoeT9cbiAgICAgICAgICB0eC5zZXRJbnB1dHModmFsLm1hcChycGNWaW4gPT4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNPdXRwdXQocnBjVmluLCB0eCkpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInZvdXRcIikgdHguc2V0T3V0cHV0cyh2YWwubWFwKHJwY091dHB1dCA9PiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY091dHB1dChycGNPdXRwdXQsIHR4KSkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJjdF9zaWduYXR1cmVzXCIpIHtcbiAgICAgICAgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0UmN0U2lnbmF0dXJlcywgdHguc2V0UmN0U2lnbmF0dXJlcywgdmFsKTtcbiAgICAgICAgaWYgKHZhbC50eG5GZWUpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldEZlZSwgdHguc2V0RmVlLCBCaWdJbnQodmFsLnR4bkZlZSkpO1xuICAgICAgfSBcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyY3RzaWdfcHJ1bmFibGVcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0UmN0U2lnUHJ1bmFibGUsIHR4LnNldFJjdFNpZ1BydW5hYmxlLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVubG9ja190aW1lXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFVubG9ja1RpbWUsIHR4LnNldFVubG9ja1RpbWUsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYXNfanNvblwiIHx8IGtleSA9PT0gXCJ0eF9qc29uXCIpIHsgfSAgLy8gaGFuZGxlZCBsYXN0IHNvIHR4IGlzIGFzIGluaXRpYWxpemVkIGFzIHBvc3NpYmxlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYXNfaGV4XCIgfHwga2V5ID09PSBcInR4X2Jsb2JcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0RnVsbEhleCwgdHguc2V0RnVsbEhleCwgdmFsID8gdmFsIDogdW5kZWZpbmVkKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9iX3NpemVcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0U2l6ZSwgdHguc2V0U2l6ZSwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3ZWlnaHRcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0V2VpZ2h0LCB0eC5zZXRXZWlnaHQsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZmVlXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldEZlZSwgdHguc2V0RmVlLCBCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVsYXllZFwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc1JlbGF5ZWQsIHR4LnNldElzUmVsYXllZCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJvdXRwdXRfaW5kaWNlc1wiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRPdXRwdXRJbmRpY2VzLCB0eC5zZXRPdXRwdXRJbmRpY2VzLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRvX25vdF9yZWxheVwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRSZWxheSwgdHguc2V0UmVsYXksICF2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImtlcHRfYnlfYmxvY2tcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SXNLZXB0QnlCbG9jaywgdHguc2V0SXNLZXB0QnlCbG9jaywgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzaWduYXR1cmVzXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFNpZ25hdHVyZXMsIHR4LnNldFNpZ25hdHVyZXMsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibGFzdF9mYWlsZWRfaGVpZ2h0XCIpIHtcbiAgICAgICAgaWYgKHZhbCA9PT0gMCkgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SXNGYWlsZWQsIHR4LnNldElzRmFpbGVkLCBmYWxzZSk7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzRmFpbGVkLCB0eC5zZXRJc0ZhaWxlZCwgdHJ1ZSk7XG4gICAgICAgICAgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0TGFzdEZhaWxlZEhlaWdodCwgdHguc2V0TGFzdEZhaWxlZEhlaWdodCwgdmFsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxhc3RfZmFpbGVkX2lkX2hhc2hcIikge1xuICAgICAgICBpZiAodmFsID09PSBNb25lcm9EYWVtb25ScGMuREVGQVVMVF9JRCkgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SXNGYWlsZWQsIHR4LnNldElzRmFpbGVkLCBmYWxzZSk7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzRmFpbGVkLCB0eC5zZXRJc0ZhaWxlZCwgdHJ1ZSk7XG4gICAgICAgICAgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0TGFzdEZhaWxlZEhhc2gsIHR4LnNldExhc3RGYWlsZWRIYXNoLCB2YWwpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibWF4X3VzZWRfYmxvY2tfaGVpZ2h0XCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldE1heFVzZWRCbG9ja0hlaWdodCwgdHguc2V0TWF4VXNlZEJsb2NrSGVpZ2h0LCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm1heF91c2VkX2Jsb2NrX2lkX2hhc2hcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0TWF4VXNlZEJsb2NrSGFzaCwgdHguc2V0TWF4VXNlZEJsb2NrSGFzaCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwcnVuYWJsZV9oYXNoXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFBydW5hYmxlSGFzaCwgdHguc2V0UHJ1bmFibGVIYXNoLCB2YWwgPyB2YWwgOiB1bmRlZmluZWQpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBydW5hYmxlX2FzX2hleFwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRQcnVuYWJsZUhleCwgdHguc2V0UHJ1bmFibGVIZXgsIHZhbCA/IHZhbCA6IHVuZGVmaW5lZCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHJ1bmVkX2FzX2hleFwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRQcnVuZWRIZXgsIHR4LnNldFBydW5lZEhleCwgdmFsID8gdmFsIDogdW5kZWZpbmVkKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIHJwYyB0eDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICBcbiAgICAvLyBsaW5rIGJsb2NrIGFuZCB0eFxuICAgIGlmIChoZWFkZXIpIHR4LnNldEJsb2NrKG5ldyBNb25lcm9CbG9jayhoZWFkZXIpLnNldFR4cyhbdHhdKSk7XG4gICAgXG4gICAgLy8gVE9ETyBtb25lcm9kOiB1bmNvbmZpcm1lZCB0eHMgbWlzcmVwb3J0IGJsb2NrIGhlaWdodCBhbmQgdGltZXN0YW1wP1xuICAgIGlmICh0eC5nZXRCbG9jaygpICYmIHR4LmdldEJsb2NrKCkuZ2V0SGVpZ2h0KCkgIT09IHVuZGVmaW5lZCAmJiB0eC5nZXRCbG9jaygpLmdldEhlaWdodCgpID09PSB0eC5nZXRCbG9jaygpLmdldFRpbWVzdGFtcCgpKSB7XG4gICAgICB0eC5zZXRCbG9jayh1bmRlZmluZWQpO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgIH1cbiAgICBcbiAgICAvLyBpbml0aWFsaXplIHJlbWFpbmluZyBrbm93biBmaWVsZHNcbiAgICBpZiAodHguZ2V0SXNDb25maXJtZWQoKSkge1xuICAgICAgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SXNSZWxheWVkLCB0eC5zZXRJc1JlbGF5ZWQsIHRydWUpO1xuICAgICAgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0UmVsYXksIHR4LnNldFJlbGF5LCB0cnVlKTtcbiAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzRmFpbGVkLCB0eC5zZXRJc0ZhaWxlZCwgZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0eC5zZXROdW1Db25maXJtYXRpb25zKDApO1xuICAgIH1cbiAgICBpZiAodHguZ2V0SXNGYWlsZWQoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgaWYgKHR4LmdldE91dHB1dEluZGljZXMoKSAmJiB0eC5nZXRPdXRwdXRzKCkpICB7XG4gICAgICBhc3NlcnQuZXF1YWwodHguZ2V0T3V0cHV0cygpLmxlbmd0aCwgdHguZ2V0T3V0cHV0SW5kaWNlcygpLmxlbmd0aCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHR4LmdldE91dHB1dHMoKS5sZW5ndGg7IGkrKykge1xuICAgICAgICB0eC5nZXRPdXRwdXRzKClbaV0uc2V0SW5kZXgodHguZ2V0T3V0cHV0SW5kaWNlcygpW2ldKTsgIC8vIHRyYW5zZmVyIG91dHB1dCBpbmRpY2VzIHRvIG91dHB1dHNcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHJwY1R4LmFzX2pzb24pIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVHgoSlNPTi5wYXJzZShycGNUeC5hc19qc29uKSwgdHgpO1xuICAgIGlmIChycGNUeC50eF9qc29uKSBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1R4KEpTT04ucGFyc2UocnBjVHgudHhfanNvbiksIHR4KTtcbiAgICBpZiAoIXR4LmdldElzUmVsYXllZCgpKSB0eC5zZXRMYXN0UmVsYXllZFRpbWVzdGFtcCh1bmRlZmluZWQpOyAgLy8gVE9ETyBtb25lcm9kOiByZXR1cm5zIGxhc3RfcmVsYXllZF90aW1lc3RhbXAgZGVzcGl0ZSByZWxheWVkOiBmYWxzZSwgc2VsZiBpbmNvbnNpc3RlbnRcbiAgICBcbiAgICAvLyByZXR1cm4gYnVpbHQgdHJhbnNhY3Rpb25cbiAgICByZXR1cm4gdHg7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY091dHB1dChycGNPdXRwdXQsIHR4KSB7XG4gICAgbGV0IG91dHB1dCA9IG5ldyBNb25lcm9PdXRwdXQoKTtcbiAgICBvdXRwdXQuc2V0VHgodHgpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNPdXRwdXQpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjT3V0cHV0W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImdlblwiKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJPdXRwdXQgd2l0aCAnZ2VuJyBmcm9tIGRhZW1vbiBycGMgaXMgbWluZXIgdHggd2hpY2ggd2UgaWdub3JlIChpLmUuIGVhY2ggbWluZXIgaW5wdXQgaXMgdW5kZWZpbmVkKVwiKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJrZXlcIikge1xuICAgICAgICBHZW5VdGlscy5zYWZlU2V0KG91dHB1dCwgb3V0cHV0LmdldEFtb3VudCwgb3V0cHV0LnNldEFtb3VudCwgQmlnSW50KHZhbC5hbW91bnQpKTtcbiAgICAgICAgR2VuVXRpbHMuc2FmZVNldChvdXRwdXQsIG91dHB1dC5nZXRLZXlJbWFnZSwgb3V0cHV0LnNldEtleUltYWdlLCBuZXcgTW9uZXJvS2V5SW1hZ2UodmFsLmtfaW1hZ2UpKTtcbiAgICAgICAgR2VuVXRpbHMuc2FmZVNldChvdXRwdXQsIG91dHB1dC5nZXRSaW5nT3V0cHV0SW5kaWNlcywgb3V0cHV0LnNldFJpbmdPdXRwdXRJbmRpY2VzLCB2YWwua2V5X29mZnNldHMpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFtb3VudFwiKSBHZW5VdGlscy5zYWZlU2V0KG91dHB1dCwgb3V0cHV0LmdldEFtb3VudCwgb3V0cHV0LnNldEFtb3VudCwgQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRhcmdldFwiKSB7XG4gICAgICAgIGxldCBwdWJLZXkgPSB2YWwua2V5ID09PSB1bmRlZmluZWQgPyB2YWwudGFnZ2VkX2tleS5rZXkgOiB2YWwua2V5OyAvLyBUT0RPIChtb25lcm9kKTogcnBjIGpzb24gdXNlcyB7dGFnZ2VkX2tleT17a2V5PS4uLn19LCBiaW5hcnkgYmxvY2tzIHVzZSB7a2V5PS4uLn1cbiAgICAgICAgR2VuVXRpbHMuc2FmZVNldChvdXRwdXQsIG91dHB1dC5nZXRTdGVhbHRoUHVibGljS2V5LCBvdXRwdXQuc2V0U3RlYWx0aFB1YmxpY0tleSwgcHViS2V5KTtcbiAgICAgIH1cbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIG91dHB1dDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNCbG9ja1RlbXBsYXRlKHJwY1RlbXBsYXRlKSB7XG4gICAgbGV0IHRlbXBsYXRlID0gbmV3IE1vbmVyb0Jsb2NrVGVtcGxhdGUoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjVGVtcGxhdGUpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjVGVtcGxhdGVba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYmxvY2toYXNoaW5nX2Jsb2JcIikgdGVtcGxhdGUuc2V0QmxvY2tIYXNoaW5nQmxvYih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrdGVtcGxhdGVfYmxvYlwiKSB0ZW1wbGF0ZS5zZXRCbG9ja1RlbXBsYXRlQmxvYih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImV4cGVjdGVkX3Jld2FyZFwiKSB0ZW1wbGF0ZS5zZXRFeHBlY3RlZFJld2FyZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRpZmZpY3VsdHlcIikgeyB9ICAvLyBoYW5kbGVkIGJ5IHdpZGVfZGlmZmljdWx0eVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRpZmZpY3VsdHlfdG9wNjRcIikgeyB9ICAvLyBoYW5kbGVkIGJ5IHdpZGVfZGlmZmljdWx0eVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndpZGVfZGlmZmljdWx0eVwiKSB0ZW1wbGF0ZS5zZXREaWZmaWN1bHR5KEdlblV0aWxzLnJlY29uY2lsZSh0ZW1wbGF0ZS5nZXREaWZmaWN1bHR5KCksIE1vbmVyb0RhZW1vblJwYy5wcmVmaXhlZEhleFRvQkkodmFsKSkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhlaWdodFwiKSB0ZW1wbGF0ZS5zZXRIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwcmV2X2hhc2hcIikgdGVtcGxhdGUuc2V0UHJldkhhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyZXNlcnZlZF9vZmZzZXRcIikgdGVtcGxhdGUuc2V0UmVzZXJ2ZWRPZmZzZXQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGF0dXNcIikge30gIC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW50cnVzdGVkXCIpIHt9ICAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNlZWRfaGVpZ2h0XCIpIHRlbXBsYXRlLnNldFNlZWRIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzZWVkX2hhc2hcIikgdGVtcGxhdGUuc2V0U2VlZEhhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJuZXh0X3NlZWRfaGFzaFwiKSB0ZW1wbGF0ZS5zZXROZXh0U2VlZEhhc2godmFsKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIGJsb2NrIHRlbXBsYXRlOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIGlmIChcIlwiID09PSB0ZW1wbGF0ZS5nZXROZXh0U2VlZEhhc2goKSkgdGVtcGxhdGUuc2V0TmV4dFNlZWRIYXNoKHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIHRlbXBsYXRlO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNJbmZvKHJwY0luZm8pIHtcbiAgICBpZiAoIXJwY0luZm8pIHJldHVybiB1bmRlZmluZWQ7XG4gICAgbGV0IGluZm8gPSBuZXcgTW9uZXJvRGFlbW9uSW5mbygpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNJbmZvKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY0luZm9ba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwidmVyc2lvblwiKSBpbmZvLnNldFZlcnNpb24odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbHRfYmxvY2tzX2NvdW50XCIpIGluZm8uc2V0TnVtQWx0QmxvY2tzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfc2l6ZV9saW1pdFwiKSBpbmZvLnNldEJsb2NrU2l6ZUxpbWl0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfc2l6ZV9tZWRpYW5cIikgaW5mby5zZXRCbG9ja1NpemVNZWRpYW4odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja193ZWlnaHRfbGltaXRcIikgaW5mby5zZXRCbG9ja1dlaWdodExpbWl0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfd2VpZ2h0X21lZGlhblwiKSBpbmZvLnNldEJsb2NrV2VpZ2h0TWVkaWFuKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYm9vdHN0cmFwX2RhZW1vbl9hZGRyZXNzXCIpIHsgaWYgKHZhbCkgaW5mby5zZXRCb290c3RyYXBEYWVtb25BZGRyZXNzKHZhbCk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5XCIpIHsgfSAgLy8gaGFuZGxlZCBieSB3aWRlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjdW11bGF0aXZlX2RpZmZpY3VsdHlcIikgeyB9IC8vIGhhbmRsZWQgYnkgd2lkZV9jdW11bGF0aXZlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5X3RvcDY0XCIpIHsgfSAgLy8gaGFuZGxlZCBieSB3aWRlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjdW11bGF0aXZlX2RpZmZpY3VsdHlfdG9wNjRcIikgeyB9IC8vIGhhbmRsZWQgYnkgd2lkZV9jdW11bGF0aXZlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3aWRlX2RpZmZpY3VsdHlcIikgaW5mby5zZXREaWZmaWN1bHR5KEdlblV0aWxzLnJlY29uY2lsZShpbmZvLmdldERpZmZpY3VsdHkoKSwgTW9uZXJvRGFlbW9uUnBjLnByZWZpeGVkSGV4VG9CSSh2YWwpKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2lkZV9jdW11bGF0aXZlX2RpZmZpY3VsdHlcIikgaW5mby5zZXRDdW11bGF0aXZlRGlmZmljdWx0eShHZW5VdGlscy5yZWNvbmNpbGUoaW5mby5nZXRDdW11bGF0aXZlRGlmZmljdWx0eSgpLCBNb25lcm9EYWVtb25ScGMucHJlZml4ZWRIZXhUb0JJKHZhbCkpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmcmVlX3NwYWNlXCIpIGluZm8uc2V0RnJlZVNwYWNlKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkYXRhYmFzZV9zaXplXCIpIGluZm8uc2V0RGF0YWJhc2VTaXplKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZ3JleV9wZWVybGlzdF9zaXplXCIpIGluZm8uc2V0TnVtT2ZmbGluZVBlZXJzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGVpZ2h0XCIpIGluZm8uc2V0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGVpZ2h0X3dpdGhvdXRfYm9vdHN0cmFwXCIpIGluZm8uc2V0SGVpZ2h0V2l0aG91dEJvb3RzdHJhcCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImluY29taW5nX2Nvbm5lY3Rpb25zX2NvdW50XCIpIGluZm8uc2V0TnVtSW5jb21pbmdDb25uZWN0aW9ucyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm9mZmxpbmVcIikgaW5mby5zZXRJc09mZmxpbmUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJvdXRnb2luZ19jb25uZWN0aW9uc19jb3VudFwiKSBpbmZvLnNldE51bU91dGdvaW5nQ29ubmVjdGlvbnModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJycGNfY29ubmVjdGlvbnNfY291bnRcIikgaW5mby5zZXROdW1ScGNDb25uZWN0aW9ucyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXJ0X3RpbWVcIikgaW5mby5zZXRTdGFydFRpbWVzdGFtcCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFkanVzdGVkX3RpbWVcIikgaW5mby5zZXRBZGp1c3RlZFRpbWVzdGFtcCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXR1c1wiKSB7fSAgLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0YXJnZXRcIikgaW5mby5zZXRUYXJnZXQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0YXJnZXRfaGVpZ2h0XCIpIGluZm8uc2V0VGFyZ2V0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidG9wX2Jsb2NrX2hhc2hcIikgaW5mby5zZXRUb3BCbG9ja0hhc2godmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9jb3VudFwiKSBpbmZvLnNldE51bVR4cyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4X3Bvb2xfc2l6ZVwiKSBpbmZvLnNldE51bVR4c1Bvb2wodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bnRydXN0ZWRcIikge30gLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3YXNfYm9vdHN0cmFwX2V2ZXJfdXNlZFwiKSBpbmZvLnNldFdhc0Jvb3RzdHJhcEV2ZXJVc2VkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2hpdGVfcGVlcmxpc3Rfc2l6ZVwiKSBpbmZvLnNldE51bU9ubGluZVBlZXJzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidXBkYXRlX2F2YWlsYWJsZVwiKSBpbmZvLnNldFVwZGF0ZUF2YWlsYWJsZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm5ldHR5cGVcIikgR2VuVXRpbHMuc2FmZVNldChpbmZvLCBpbmZvLmdldE5ldHdvcmtUeXBlLCBpbmZvLnNldE5ldHdvcmtUeXBlLCBNb25lcm9OZXR3b3JrVHlwZS5wYXJzZSh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtYWlubmV0XCIpIHsgaWYgKHZhbCkgR2VuVXRpbHMuc2FmZVNldChpbmZvLCBpbmZvLmdldE5ldHdvcmtUeXBlLCBpbmZvLnNldE5ldHdvcmtUeXBlLCBNb25lcm9OZXR3b3JrVHlwZS5NQUlOTkVUKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRlc3RuZXRcIikgeyBpZiAodmFsKSBHZW5VdGlscy5zYWZlU2V0KGluZm8sIGluZm8uZ2V0TmV0d29ya1R5cGUsIGluZm8uc2V0TmV0d29ya1R5cGUsIE1vbmVyb05ldHdvcmtUeXBlLlRFU1RORVQpOyB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3RhZ2VuZXRcIikgeyBpZiAodmFsKSBHZW5VdGlscy5zYWZlU2V0KGluZm8sIGluZm8uZ2V0TmV0d29ya1R5cGUsIGluZm8uc2V0TmV0d29ya1R5cGUsIE1vbmVyb05ldHdvcmtUeXBlLlNUQUdFTkVUKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNyZWRpdHNcIikgaW5mby5zZXRDcmVkaXRzKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0b3BfYmxvY2tfaGFzaFwiIHx8IGtleSA9PT0gXCJ0b3BfaGFzaFwiKSBpbmZvLnNldFRvcEJsb2NrSGFzaChHZW5VdGlscy5yZWNvbmNpbGUoaW5mby5nZXRUb3BCbG9ja0hhc2goKSwgXCJcIiA9PT0gdmFsID8gdW5kZWZpbmVkIDogdmFsKSlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJidXN5X3N5bmNpbmdcIikgaW5mby5zZXRJc0J1c3lTeW5jaW5nKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3luY2hyb25pemVkXCIpIGluZm8uc2V0SXNTeW5jaHJvbml6ZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyZXN0cmljdGVkXCIpIGluZm8uc2V0SXNSZXN0cmljdGVkKHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogSWdub3JpbmcgdW5leHBlY3RlZCBpbmZvIGZpZWxkOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBpbmZvO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgc3luYyBpbmZvIGZyb20gUlBDIHN5bmMgaW5mby5cbiAgICogXG4gICAqIEBwYXJhbSBycGNTeW5jSW5mbyAtIHJwYyBtYXAgdG8gaW5pdGlhbGl6ZSB0aGUgc3luYyBpbmZvIGZyb21cbiAgICogQHJldHVybiB7TW9uZXJvRGFlbW9uU3luY0luZm99IGlzIHN5bmMgaW5mbyBpbml0aWFsaXplZCBmcm9tIHRoZSBtYXBcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1N5bmNJbmZvKHJwY1N5bmNJbmZvKSB7XG4gICAgbGV0IHN5bmNJbmZvID0gbmV3IE1vbmVyb0RhZW1vblN5bmNJbmZvKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1N5bmNJbmZvKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1N5bmNJbmZvW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImhlaWdodFwiKSBzeW5jSW5mby5zZXRIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwZWVyc1wiKSB7XG4gICAgICAgIHN5bmNJbmZvLnNldFBlZXJzKFtdKTtcbiAgICAgICAgbGV0IHJwY0Nvbm5lY3Rpb25zID0gdmFsO1xuICAgICAgICBmb3IgKGxldCBycGNDb25uZWN0aW9uIG9mIHJwY0Nvbm5lY3Rpb25zKSB7XG4gICAgICAgICAgc3luY0luZm8uZ2V0UGVlcnMoKS5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQ29ubmVjdGlvbihycGNDb25uZWN0aW9uLmluZm8pKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNwYW5zXCIpIHtcbiAgICAgICAgc3luY0luZm8uc2V0U3BhbnMoW10pO1xuICAgICAgICBsZXQgcnBjU3BhbnMgPSB2YWw7XG4gICAgICAgIGZvciAobGV0IHJwY1NwYW4gb2YgcnBjU3BhbnMpIHtcbiAgICAgICAgICBzeW5jSW5mby5nZXRTcGFucygpLnB1c2goTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNDb25uZWN0aW9uU3BhbihycGNTcGFuKSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoa2V5ID09PSBcInN0YXR1c1wiKSB7fSAgIC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidGFyZ2V0X2hlaWdodFwiKSBzeW5jSW5mby5zZXRUYXJnZXRIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJuZXh0X25lZWRlZF9wcnVuaW5nX3NlZWRcIikgc3luY0luZm8uc2V0TmV4dE5lZWRlZFBydW5pbmdTZWVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwib3ZlcnZpZXdcIikgeyAgLy8gdGhpcyByZXR1cm5zIFtdIHdpdGhvdXQgcHJ1bmluZ1xuICAgICAgICBsZXQgb3ZlcnZpZXc7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgb3ZlcnZpZXcgPSBKU09OLnBhcnNlKHZhbCk7XG4gICAgICAgICAgaWYgKG92ZXJ2aWV3ICE9PSB1bmRlZmluZWQgJiYgb3ZlcnZpZXcubGVuZ3RoID4gMCkgY29uc29sZS5lcnJvcihcIklnbm9yaW5nIG5vbi1lbXB0eSAnb3ZlcnZpZXcnIGZpZWxkIChub3QgaW1wbGVtZW50ZWQpOiBcIiArIG92ZXJ2aWV3KTsgLy8gVE9ET1xuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIHBhcnNlICdvdmVydmlldycgZmllbGQ6IFwiICsgb3ZlcnZpZXcgKyBcIjogXCIgKyBlLm1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3JlZGl0c1wiKSBzeW5jSW5mby5zZXRDcmVkaXRzKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0b3BfaGFzaFwiKSBzeW5jSW5mby5zZXRUb3BCbG9ja0hhc2goXCJcIiA9PT0gdmFsID8gdW5kZWZpbmVkIDogdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bnRydXN0ZWRcIikge30gIC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBzeW5jIGluZm86IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIHN5bmNJbmZvO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNIYXJkRm9ya0luZm8ocnBjSGFyZEZvcmtJbmZvKSB7XG4gICAgbGV0IGluZm8gPSBuZXcgTW9uZXJvSGFyZEZvcmtJbmZvKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY0hhcmRGb3JrSW5mbykpIHtcbiAgICAgIGxldCB2YWwgPSBycGNIYXJkRm9ya0luZm9ba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiZWFybGllc3RfaGVpZ2h0XCIpIGluZm8uc2V0RWFybGllc3RIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJlbmFibGVkXCIpIGluZm8uc2V0SXNFbmFibGVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3RhdGVcIikgaW5mby5zZXRTdGF0ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXR1c1wiKSB7fSAgICAgLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bnRydXN0ZWRcIikge30gIC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidGhyZXNob2xkXCIpIGluZm8uc2V0VGhyZXNob2xkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidmVyc2lvblwiKSBpbmZvLnNldFZlcnNpb24odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ2b3Rlc1wiKSBpbmZvLnNldE51bVZvdGVzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidm90aW5nXCIpIGluZm8uc2V0Vm90aW5nKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2luZG93XCIpIGluZm8uc2V0V2luZG93KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3JlZGl0c1wiKSBpbmZvLnNldENyZWRpdHMoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRvcF9oYXNoXCIpIGluZm8uc2V0VG9wQmxvY2tIYXNoKFwiXCIgPT09IHZhbCA/IHVuZGVmaW5lZCA6IHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBoYXJkIGZvcmsgaW5mbzogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gaW5mbztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjQ29ubmVjdGlvblNwYW4ocnBjQ29ubmVjdGlvblNwYW4pIHtcbiAgICBsZXQgc3BhbiA9IG5ldyBNb25lcm9Db25uZWN0aW9uU3BhbigpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNDb25uZWN0aW9uU3BhbikpIHtcbiAgICAgIGxldCB2YWwgPSBycGNDb25uZWN0aW9uU3BhbltrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJjb25uZWN0aW9uX2lkXCIpIHNwYW4uc2V0Q29ubmVjdGlvbklkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibmJsb2Nrc1wiKSBzcGFuLnNldE51bUJsb2Nrcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJhdGVcIikgc3Bhbi5zZXRSYXRlKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVtb3RlX2FkZHJlc3NcIikgeyBpZiAodmFsICE9PSBcIlwiKSBzcGFuLnNldFJlbW90ZUFkZHJlc3ModmFsKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNpemVcIikgc3Bhbi5zZXRTaXplKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3BlZWRcIikgc3Bhbi5zZXRTcGVlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXJ0X2Jsb2NrX2hlaWdodFwiKSBzcGFuLnNldFN0YXJ0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBkYWVtb24gY29ubmVjdGlvbiBzcGFuOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBzcGFuO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNPdXRwdXRIaXN0b2dyYW1FbnRyeShycGNFbnRyeSkge1xuICAgIGxldCBlbnRyeSA9IG5ldyBNb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeSgpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNFbnRyeSkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNFbnRyeVtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJhbW91bnRcIikgZW50cnkuc2V0QW1vdW50KEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0b3RhbF9pbnN0YW5jZXNcIikgZW50cnkuc2V0TnVtSW5zdGFuY2VzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW5sb2NrZWRfaW5zdGFuY2VzXCIpIGVudHJ5LnNldE51bVVubG9ja2VkSW5zdGFuY2VzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVjZW50X2luc3RhbmNlc1wiKSBlbnRyeS5zZXROdW1SZWNlbnRJbnN0YW5jZXModmFsKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIG91dHB1dCBoaXN0b2dyYW06IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIGVudHJ5O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNTdWJtaXRUeFJlc3VsdChycGNSZXN1bHQpIHtcbiAgICBhc3NlcnQocnBjUmVzdWx0KTtcbiAgICBsZXQgcmVzdWx0ID0gbmV3IE1vbmVyb1N1Ym1pdFR4UmVzdWx0KCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1Jlc3VsdCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNSZXN1bHRba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiZG91YmxlX3NwZW5kXCIpIHJlc3VsdC5zZXRJc0RvdWJsZVNwZW5kU2Vlbih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImZlZV90b29fbG93XCIpIHJlc3VsdC5zZXRJc0ZlZVRvb0xvdyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImludmFsaWRfaW5wdXRcIikgcmVzdWx0LnNldEhhc0ludmFsaWRJbnB1dCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImludmFsaWRfb3V0cHV0XCIpIHJlc3VsdC5zZXRIYXNJbnZhbGlkT3V0cHV0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidG9vX2Zld19vdXRwdXRzXCIpIHJlc3VsdC5zZXRIYXNUb29GZXdPdXRwdXRzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibG93X21peGluXCIpIHJlc3VsdC5zZXRJc01peGluVG9vTG93KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibm90X3JlbGF5ZWRcIikgcmVzdWx0LnNldElzUmVsYXllZCghdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJvdmVyc3BlbmRcIikgcmVzdWx0LnNldElzT3ZlcnNwZW5kKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVhc29uXCIpIHJlc3VsdC5zZXRSZWFzb24odmFsID09PSBcIlwiID8gdW5kZWZpbmVkIDogdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0b29fYmlnXCIpIHJlc3VsdC5zZXRJc1Rvb0JpZyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNhbml0eV9jaGVja19mYWlsZWRcIikgcmVzdWx0LnNldFNhbml0eUNoZWNrRmFpbGVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3JlZGl0c1wiKSByZXN1bHQuc2V0Q3JlZGl0cyhCaWdJbnQodmFsKSlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGF0dXNcIiB8fCBrZXkgPT09IFwidW50cnVzdGVkXCIpIHt9ICAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRvcF9oYXNoXCIpIHJlc3VsdC5zZXRUb3BCbG9ja0hhc2goXCJcIiA9PT0gdmFsID8gdW5kZWZpbmVkIDogdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9leHRyYV90b29fYmlnXCIpIHJlc3VsdC5zZXRJc1R4RXh0cmFUb29CaWcodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJub256ZXJvX3VubG9ja190aW1lXCIpIHJlc3VsdC5zZXRJc05vbnplcm9VbmxvY2tUaW1lKHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBzdWJtaXQgdHggaGV4IHJlc3VsdDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNUeFBvb2xTdGF0cyhycGNTdGF0cykge1xuICAgIGFzc2VydChycGNTdGF0cyk7XG4gICAgbGV0IHN0YXRzID0gbmV3IE1vbmVyb1R4UG9vbFN0YXRzKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1N0YXRzKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1N0YXRzW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImJ5dGVzX21heFwiKSBzdGF0cy5zZXRCeXRlc01heCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJ5dGVzX21lZFwiKSBzdGF0cy5zZXRCeXRlc01lZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJ5dGVzX21pblwiKSBzdGF0cy5zZXRCeXRlc01pbih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJ5dGVzX3RvdGFsXCIpIHN0YXRzLnNldEJ5dGVzVG90YWwodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJoaXN0b185OHBjXCIpIHN0YXRzLnNldEhpc3RvOThwYyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm51bV8xMG1cIikgc3RhdHMuc2V0TnVtMTBtKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibnVtX2RvdWJsZV9zcGVuZHNcIikgc3RhdHMuc2V0TnVtRG91YmxlU3BlbmRzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibnVtX2ZhaWxpbmdcIikgc3RhdHMuc2V0TnVtRmFpbGluZyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm51bV9ub3RfcmVsYXllZFwiKSBzdGF0cy5zZXROdW1Ob3RSZWxheWVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwib2xkZXN0XCIpIHN0YXRzLnNldE9sZGVzdFRpbWVzdGFtcCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInR4c190b3RhbFwiKSBzdGF0cy5zZXROdW1UeHModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmZWVfdG90YWxcIikgc3RhdHMuc2V0RmVlVG90YWwoQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhpc3RvXCIpIHtcbiAgICAgICAgc3RhdHMuc2V0SGlzdG8obmV3IE1hcCgpKTtcbiAgICAgICAgZm9yIChsZXQgZWxlbSBvZiB2YWwpIHN0YXRzLmdldEhpc3RvKCkuc2V0KGVsZW0uYnl0ZXMsIGVsZW0udHhzKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIHR4IHBvb2wgc3RhdHM6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG5cbiAgICAvLyB1bmluaXRpYWxpemUgc29tZSBzdGF0cyBpZiBub3QgYXBwbGljYWJsZVxuICAgIGlmIChzdGF0cy5nZXRIaXN0bzk4cGMoKSA9PT0gMCkgc3RhdHMuc2V0SGlzdG85OHBjKHVuZGVmaW5lZCk7XG4gICAgaWYgKHN0YXRzLmdldE51bVR4cygpID09PSAwKSB7XG4gICAgICBzdGF0cy5zZXRCeXRlc01pbih1bmRlZmluZWQpO1xuICAgICAgc3RhdHMuc2V0Qnl0ZXNNZWQodW5kZWZpbmVkKTtcbiAgICAgIHN0YXRzLnNldEJ5dGVzTWF4KHVuZGVmaW5lZCk7XG4gICAgICBzdGF0cy5zZXRIaXN0bzk4cGModW5kZWZpbmVkKTtcbiAgICAgIHN0YXRzLnNldE9sZGVzdFRpbWVzdGFtcCh1bmRlZmluZWQpO1xuICAgIH1cblxuICAgIHJldHVybiBzdGF0cztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjQWx0Q2hhaW4ocnBjQ2hhaW4pIHtcbiAgICBhc3NlcnQocnBjQ2hhaW4pO1xuICAgIGxldCBjaGFpbiA9IG5ldyBNb25lcm9BbHRDaGFpbigpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNDaGFpbikpIHtcbiAgICAgIGxldCB2YWwgPSBycGNDaGFpbltrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJibG9ja19oYXNoXCIpIHt9ICAvLyB1c2luZyBibG9ja19oYXNoZXMgaW5zdGVhZFxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRpZmZpY3VsdHlcIikgeyB9IC8vIGhhbmRsZWQgYnkgd2lkZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGlmZmljdWx0eV90b3A2NFwiKSB7IH0gIC8vIGhhbmRsZWQgYnkgd2lkZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2lkZV9kaWZmaWN1bHR5XCIpIGNoYWluLnNldERpZmZpY3VsdHkoR2VuVXRpbHMucmVjb25jaWxlKGNoYWluLmdldERpZmZpY3VsdHkoKSwgTW9uZXJvRGFlbW9uUnBjLnByZWZpeGVkSGV4VG9CSSh2YWwpKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGVpZ2h0XCIpIGNoYWluLnNldEhlaWdodCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxlbmd0aFwiKSBjaGFpbi5zZXRMZW5ndGgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja19oYXNoZXNcIikgY2hhaW4uc2V0QmxvY2tIYXNoZXModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtYWluX2NoYWluX3BhcmVudF9ibG9ja1wiKSBjaGFpbi5zZXRNYWluQ2hhaW5QYXJlbnRCbG9ja0hhc2godmFsKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIGFsdGVybmF0aXZlIGNoYWluOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBjaGFpbjtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjUGVlcihycGNQZWVyKSB7XG4gICAgYXNzZXJ0KHJwY1BlZXIpO1xuICAgIGxldCBwZWVyID0gbmV3IE1vbmVyb1BlZXIoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjUGVlcikpIHtcbiAgICAgIGxldCB2YWwgPSBycGNQZWVyW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImhvc3RcIikgcGVlci5zZXRIb3N0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaWRcIikgcGVlci5zZXRJZChcIlwiICsgdmFsKTsgIC8vIFRPRE8gbW9uZXJvLXdhbGxldC1ycGM6IHBlZXIgaWQgaXMgQmlnSW50IGJ1dCBzdHJpbmcgaW4gYGdldF9jb25uZWN0aW9uc2BcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJpcFwiKSB7fSAvLyBob3N0IHVzZWQgaW5zdGVhZCB3aGljaCBpcyBjb25zaXN0ZW50bHkgYSBzdHJpbmdcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsYXN0X3NlZW5cIikgcGVlci5zZXRMYXN0U2VlblRpbWVzdGFtcCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBvcnRcIikgcGVlci5zZXRQb3J0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicnBjX3BvcnRcIikgcGVlci5zZXRScGNQb3J0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHJ1bmluZ19zZWVkXCIpIHBlZXIuc2V0UHJ1bmluZ1NlZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJycGNfY3JlZGl0c19wZXJfaGFzaFwiKSBwZWVyLnNldFJwY0NyZWRpdHNQZXJIYXNoKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIHJwYyBwZWVyOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBwZWVyO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNDb25uZWN0aW9uKHJwY0Nvbm5lY3Rpb24pIHtcbiAgICBsZXQgcGVlciA9IG5ldyBNb25lcm9QZWVyKCk7XG4gICAgcGVlci5zZXRJc09ubGluZSh0cnVlKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjQ29ubmVjdGlvbikpIHtcbiAgICAgIGxldCB2YWwgPSBycGNDb25uZWN0aW9uW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImFkZHJlc3NcIikgcGVlci5zZXRBZGRyZXNzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYXZnX2Rvd25sb2FkXCIpIHBlZXIuc2V0QXZnRG93bmxvYWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhdmdfdXBsb2FkXCIpIHBlZXIuc2V0QXZnVXBsb2FkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY29ubmVjdGlvbl9pZFwiKSBwZWVyLnNldElkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3VycmVudF9kb3dubG9hZFwiKSBwZWVyLnNldEN1cnJlbnREb3dubG9hZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImN1cnJlbnRfdXBsb2FkXCIpIHBlZXIuc2V0Q3VycmVudFVwbG9hZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhlaWdodFwiKSBwZWVyLnNldEhlaWdodCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhvc3RcIikgcGVlci5zZXRIb3N0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaXBcIikge30gLy8gaG9zdCB1c2VkIGluc3RlYWQgd2hpY2ggaXMgY29uc2lzdGVudGx5IGEgc3RyaW5nXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaW5jb21pbmdcIikgcGVlci5zZXRJc0luY29taW5nKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibGl2ZV90aW1lXCIpIHBlZXIuc2V0TGl2ZVRpbWUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsb2NhbF9pcFwiKSBwZWVyLnNldElzTG9jYWxJcCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxvY2FsaG9zdFwiKSBwZWVyLnNldElzTG9jYWxIb3N0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicGVlcl9pZFwiKSBwZWVyLnNldElkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicG9ydFwiKSBwZWVyLnNldFBvcnQocGFyc2VJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicnBjX3BvcnRcIikgcGVlci5zZXRScGNQb3J0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVjdl9jb3VudFwiKSBwZWVyLnNldE51bVJlY2VpdmVzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVjdl9pZGxlX3RpbWVcIikgcGVlci5zZXRSZWNlaXZlSWRsZVRpbWUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzZW5kX2NvdW50XCIpIHBlZXIuc2V0TnVtU2VuZHModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzZW5kX2lkbGVfdGltZVwiKSBwZWVyLnNldFNlbmRJZGxlVGltZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXRlXCIpIHBlZXIuc2V0U3RhdGUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdXBwb3J0X2ZsYWdzXCIpIHBlZXIuc2V0TnVtU3VwcG9ydEZsYWdzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHJ1bmluZ19zZWVkXCIpIHBlZXIuc2V0UHJ1bmluZ1NlZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJycGNfY3JlZGl0c19wZXJfaGFzaFwiKSBwZWVyLnNldFJwY0NyZWRpdHNQZXJIYXNoKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhZGRyZXNzX3R5cGVcIikgcGVlci5zZXRUeXBlKHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBwZWVyOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBwZWVyO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRUb1JwY0JhbihiYW46IE1vbmVyb0Jhbikge1xuICAgIGxldCBycGNCYW46IGFueSA9IHt9O1xuICAgIHJwY0Jhbi5ob3N0ID0gYmFuLmdldEhvc3QoKTtcbiAgICBycGNCYW4uaXAgPSBiYW4uZ2V0SXAoKTtcbiAgICBycGNCYW4uYmFuID0gYmFuLmdldElzQmFubmVkKCk7XG4gICAgcnBjQmFuLnNlY29uZHMgPSBiYW4uZ2V0U2Vjb25kcygpO1xuICAgIHJldHVybiBycGNCYW47XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY01pbmluZ1N0YXR1cyhycGNTdGF0dXMpIHtcbiAgICBsZXQgc3RhdHVzID0gbmV3IE1vbmVyb01pbmluZ1N0YXR1cygpO1xuICAgIHN0YXR1cy5zZXRJc0FjdGl2ZShycGNTdGF0dXMuYWN0aXZlKTtcbiAgICBzdGF0dXMuc2V0U3BlZWQocnBjU3RhdHVzLnNwZWVkKTtcbiAgICBzdGF0dXMuc2V0TnVtVGhyZWFkcyhycGNTdGF0dXMudGhyZWFkc19jb3VudCk7XG4gICAgaWYgKHJwY1N0YXR1cy5hY3RpdmUpIHtcbiAgICAgIHN0YXR1cy5zZXRBZGRyZXNzKHJwY1N0YXR1cy5hZGRyZXNzKTtcbiAgICAgIHN0YXR1cy5zZXRJc0JhY2tncm91bmQocnBjU3RhdHVzLmlzX2JhY2tncm91bmRfbWluaW5nX2VuYWJsZWQpO1xuICAgIH1cbiAgICByZXR1cm4gc3RhdHVzO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNVcGRhdGVDaGVja1Jlc3VsdChycGNSZXN1bHQpIHtcbiAgICBhc3NlcnQocnBjUmVzdWx0KTtcbiAgICBsZXQgcmVzdWx0ID0gbmV3IE1vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0KCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1Jlc3VsdCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNSZXN1bHRba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYXV0b191cmlcIikgcmVzdWx0LnNldEF1dG9VcmkodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJoYXNoXCIpIHJlc3VsdC5zZXRIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicGF0aFwiKSB7fSAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXR1c1wiKSB7fSAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVwZGF0ZVwiKSByZXN1bHQuc2V0SXNVcGRhdGVBdmFpbGFibGUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1c2VyX3VyaVwiKSByZXN1bHQuc2V0VXNlclVyaSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInZlcnNpb25cIikgcmVzdWx0LnNldFZlcnNpb24odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bnRydXN0ZWRcIikge30gLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGZpZWxkIGluIHJwYyBjaGVjayB1cGRhdGUgcmVzdWx0OiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIGlmIChyZXN1bHQuZ2V0QXV0b1VyaSgpID09PSBcIlwiKSByZXN1bHQuc2V0QXV0b1VyaSh1bmRlZmluZWQpO1xuICAgIGlmIChyZXN1bHQuZ2V0VXNlclVyaSgpID09PSBcIlwiKSByZXN1bHQuc2V0VXNlclVyaSh1bmRlZmluZWQpO1xuICAgIGlmIChyZXN1bHQuZ2V0VmVyc2lvbigpID09PSBcIlwiKSByZXN1bHQuc2V0VmVyc2lvbih1bmRlZmluZWQpO1xuICAgIGlmIChyZXN1bHQuZ2V0SGFzaCgpID09PSBcIlwiKSByZXN1bHQuc2V0SGFzaCh1bmRlZmluZWQpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1VwZGF0ZURvd25sb2FkUmVzdWx0KHJwY1Jlc3VsdCkge1xuICAgIGxldCByZXN1bHQgPSBuZXcgTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQoTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNVcGRhdGVDaGVja1Jlc3VsdChycGNSZXN1bHQpIGFzIE1vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0KTtcbiAgICByZXN1bHQuc2V0RG93bmxvYWRQYXRoKHJwY1Jlc3VsdFtcInBhdGhcIl0pO1xuICAgIGlmIChyZXN1bHQuZ2V0RG93bmxvYWRQYXRoKCkgPT09IFwiXCIpIHJlc3VsdC5zZXREb3dubG9hZFBhdGgodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGEgJzB4JyBwcmVmaXhlZCBoZXhpZGVjaW1hbCBzdHJpbmcgdG8gYSBiaWdpbnQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gaGV4IGlzIHRoZSAnMHgnIHByZWZpeGVkIGhleGlkZWNpbWFsIHN0cmluZyB0byBjb252ZXJ0XG4gICAqIEByZXR1cm4ge2JpZ2ludH0gdGhlIGhleGljZWRpbWFsIGNvbnZlcnRlZCB0byBkZWNpbWFsXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIHByZWZpeGVkSGV4VG9CSShoZXgpIHtcbiAgICBhc3NlcnQoaGV4LnN1YnN0cmluZygwLCAyKSA9PT0gXCIweFwiKTtcbiAgICByZXR1cm4gQmlnSW50KGhleCk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbXBsZW1lbnRzIGEgTW9uZXJvRGFlbW9uIGJ5IHByb3h5aW5nIHJlcXVlc3RzIHRvIGEgd29ya2VyLlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBNb25lcm9EYWVtb25ScGNQcm94eSB7XG5cbiAgLy8gc3RhdGUgdmFyaWFibGVzXG4gIHByaXZhdGUgZGFlbW9uSWQ6IGFueTtcbiAgcHJpdmF0ZSB3b3JrZXI6IGFueTtcbiAgcHJpdmF0ZSB3cmFwcGVkTGlzdGVuZXJzOiBhbnk7XG4gIHByaXZhdGUgcHJvY2VzczogYW55O1xuXG4gIGNvbnN0cnVjdG9yKGRhZW1vbklkLCB3b3JrZXIpIHtcbiAgICB0aGlzLmRhZW1vbklkID0gZGFlbW9uSWQ7XG4gICAgdGhpcy53b3JrZXIgPSB3b3JrZXI7XG4gICAgdGhpcy53cmFwcGVkTGlzdGVuZXJzID0gW107XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBTVEFUSUMgVVRJTElUSUVTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICBzdGF0aWMgYXN5bmMgY29ubmVjdChjb25maWc6IE1vbmVyb0RhZW1vbkNvbmZpZykge1xuICAgIGxldCBkYWVtb25JZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICBjb25maWcgPSBPYmplY3QuYXNzaWduKHt9LCBjb25maWcudG9Kc29uKCksIHtwcm94eVRvV29ya2VyOiBmYWxzZX0pO1xuICAgIGF3YWl0IExpYnJhcnlVdGlscy5pbnZva2VXb3JrZXIoZGFlbW9uSWQsIFwiY29ubmVjdERhZW1vblJwY1wiLCBbY29uZmlnXSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9EYWVtb25ScGNQcm94eShkYWVtb25JZCwgYXdhaXQgTGlicmFyeVV0aWxzLmdldFdvcmtlcigpKTtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBJTlNUQU5DRSBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIGFzeW5jIGFkZExpc3RlbmVyKGxpc3RlbmVyKSB7XG4gICAgbGV0IHdyYXBwZWRMaXN0ZW5lciA9IG5ldyBEYWVtb25Xb3JrZXJMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgbGV0IGxpc3RlbmVySWQgPSB3cmFwcGVkTGlzdGVuZXIuZ2V0SWQoKTtcbiAgICBMaWJyYXJ5VXRpbHMuYWRkV29ya2VyQ2FsbGJhY2sodGhpcy5kYWVtb25JZCwgXCJvbkJsb2NrSGVhZGVyX1wiICsgbGlzdGVuZXJJZCwgW3dyYXBwZWRMaXN0ZW5lci5vbkJsb2NrSGVhZGVyLCB3cmFwcGVkTGlzdGVuZXJdKTtcbiAgICB0aGlzLndyYXBwZWRMaXN0ZW5lcnMucHVzaCh3cmFwcGVkTGlzdGVuZXIpO1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkFkZExpc3RlbmVyXCIsIFtsaXN0ZW5lcklkXSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndyYXBwZWRMaXN0ZW5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLndyYXBwZWRMaXN0ZW5lcnNbaV0uZ2V0TGlzdGVuZXIoKSA9PT0gbGlzdGVuZXIpIHtcbiAgICAgICAgbGV0IGxpc3RlbmVySWQgPSB0aGlzLndyYXBwZWRMaXN0ZW5lcnNbaV0uZ2V0SWQoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25SZW1vdmVMaXN0ZW5lclwiLCBbbGlzdGVuZXJJZF0pO1xuICAgICAgICBMaWJyYXJ5VXRpbHMucmVtb3ZlV29ya2VyQ2FsbGJhY2sodGhpcy5kYWVtb25JZCwgXCJvbkJsb2NrSGVhZGVyX1wiICsgbGlzdGVuZXJJZCk7XG4gICAgICAgIHRoaXMud3JhcHBlZExpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTGlzdGVuZXIgaXMgbm90IHJlZ2lzdGVyZWQgd2l0aCBkYWVtb25cIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldExpc3RlbmVycygpIHtcbiAgICBsZXQgbGlzdGVuZXJzID0gW107XG4gICAgZm9yIChsZXQgd3JhcHBlZExpc3RlbmVyIG9mIHRoaXMud3JhcHBlZExpc3RlbmVycykgbGlzdGVuZXJzLnB1c2god3JhcHBlZExpc3RlbmVyLmdldExpc3RlbmVyKCkpO1xuICAgIHJldHVybiBsaXN0ZW5lcnM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFJwY0Nvbm5lY3Rpb24oKSB7XG4gICAgbGV0IGNvbmZpZyA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0UnBjQ29ubmVjdGlvblwiKTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24oY29uZmlnIGFzIFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4pO1xuICB9XG4gIFxuICBhc3luYyBpc0Nvbm5lY3RlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25Jc0Nvbm5lY3RlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VmVyc2lvbigpIHtcbiAgICBsZXQgdmVyc2lvbkpzb246IGFueSA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0VmVyc2lvblwiKTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1ZlcnNpb24odmVyc2lvbkpzb24ubnVtYmVyLCB2ZXJzaW9uSnNvbi5pc1JlbGVhc2UpO1xuICB9XG4gIFxuICBhc3luYyBpc1RydXN0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uSXNUcnVzdGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRIZWlnaHQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0SGVpZ2h0XCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0hhc2goaGVpZ2h0KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tIYXNoXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrVGVtcGxhdGUod2FsbGV0QWRkcmVzcywgcmVzZXJ2ZVNpemUpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0Jsb2NrVGVtcGxhdGUoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja1RlbXBsYXRlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBnZXRMYXN0QmxvY2tIZWFkZXIoKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9CbG9ja0hlYWRlcihhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldExhc3RCbG9ja0hlYWRlclwiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrSGVhZGVyQnlIYXNoKGJsb2NrSGFzaCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja0hlYWRlckJ5SGFzaFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tIZWFkZXJCeUhlaWdodChoZWlnaHQpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tIZWFkZXJCeUhlaWdodFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tIZWFkZXJzQnlSYW5nZShzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSB7XG4gICAgbGV0IGJsb2NrSGVhZGVyc0pzb246IGFueVtdID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja0hlYWRlcnNCeVJhbmdlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkgYXMgYW55W107XG4gICAgbGV0IGhlYWRlcnMgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0hlYWRlckpzb24gb2YgYmxvY2tIZWFkZXJzSnNvbikgaGVhZGVycy5wdXNoKG5ldyBNb25lcm9CbG9ja0hlYWRlcihibG9ja0hlYWRlckpzb24pKTtcbiAgICByZXR1cm4gaGVhZGVycztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tCeUhhc2goYmxvY2tIYXNoKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9CbG9jayhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2NrQnlIYXNoXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSksIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFgpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja3NCeUhhc2goYmxvY2tIYXNoZXMsIHN0YXJ0SGVpZ2h0LCBwcnVuZSkge1xuICAgIGxldCBibG9ja3NKc29uOiBhbnlbXSA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tzQnlIYXNoXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkgYXMgYW55W107XG4gICAgbGV0IGJsb2NrcyA9IFtdO1xuICAgIGZvciAobGV0IGJsb2NrSnNvbiBvZiBibG9ja3NKc29uKSBibG9ja3MucHVzaChuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uKSk7XG4gICAgcmV0dXJuIGJsb2NrcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tCeUhlaWdodChoZWlnaHQpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0Jsb2NrKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tCeUhlaWdodFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpLCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tzQnlIZWlnaHQoaGVpZ2h0cykge1xuICAgIGxldCBibG9ja3NKc29uOiBhbnlbXT0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja3NCeUhlaWdodFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpIGFzIGFueVtdO1xuICAgIGxldCBibG9ja3MgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0pzb24gb2YgYmxvY2tzSnNvbikgYmxvY2tzLnB1c2gobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWCkpO1xuICAgIHJldHVybiBibG9ja3M7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2Nrc0J5UmFuZ2Uoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCkge1xuICAgIGxldCBibG9ja3NKc29uOiBhbnlbXSA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tzQnlSYW5nZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpIGFzIGFueVtdO1xuICAgIGxldCBibG9ja3MgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0pzb24gb2YgYmxvY2tzSnNvbikgYmxvY2tzLnB1c2gobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWCkpO1xuICAgIHJldHVybiBibG9ja3M7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2Nrc0J5UmFuZ2VDaHVua2VkKHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIG1heENodW5rU2l6ZSkge1xuICAgIGxldCBibG9ja3NKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja3NCeVJhbmdlQ2h1bmtlZFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpIGFzIGFueVtdO1xuICAgIGxldCBibG9ja3MgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0pzb24gb2YgYmxvY2tzSnNvbikgYmxvY2tzLnB1c2gobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWCkpO1xuICAgIHJldHVybiBibG9ja3M7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrSGFzaGVzKGJsb2NrSGFzaGVzLCBzdGFydEhlaWdodCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2NrSGFzaGVzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4cyh0eEhhc2hlcywgcHJ1bmUgPSBmYWxzZSkge1xuICAgIFxuICAgIC8vIGRlc2VyaWFsaXplIHR4cyBmcm9tIGJsb2Nrc1xuICAgIGxldCBibG9ja3MgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0pzb24gb2YgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRUeHNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSBhcyBhbnlbXSkge1xuICAgICAgYmxvY2tzLnB1c2gobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWCkpO1xuICAgIH1cbiAgICBcbiAgICAvLyBjb2xsZWN0IHR4c1xuICAgIGxldCB0eHMgPSBbXTtcbiAgICBmb3IgKGxldCBibG9jayBvZiBibG9ja3MpIHtcbiAgICAgIGZvciAobGV0IHR4IG9mIGJsb2NrLmdldFR4cygpKSB7XG4gICAgICAgIGlmICghdHguZ2V0SXNDb25maXJtZWQoKSkgdHguc2V0QmxvY2sodW5kZWZpbmVkKTtcbiAgICAgICAgdHhzLnB1c2godHgpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHhzO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeEhleGVzKHR4SGFzaGVzLCBwcnVuZSA9IGZhbHNlKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0VHhIZXhlc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRNaW5lclR4U3VtKGhlaWdodCwgbnVtQmxvY2tzKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9NaW5lclR4U3VtKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0TWluZXJUeFN1bVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RmVlRXN0aW1hdGUoZ3JhY2VCbG9ja3M/KSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9GZWVFc3RpbWF0ZShhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEZlZUVzdGltYXRlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBzdWJtaXRUeEhleCh0eEhleCwgZG9Ob3RSZWxheSkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvU3VibWl0VHhSZXN1bHQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TdWJtaXRUeEhleFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVsYXlUeHNCeUhhc2godHhIYXNoZXMpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25SZWxheVR4c0J5SGFzaFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFBvb2woKSB7XG4gICAgbGV0IGJsb2NrSnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0VHhQb29sXCIpO1xuICAgIGxldCB0eHMgPSBuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uLCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYKS5nZXRUeHMoKTtcbiAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHR4LnNldEJsb2NrKHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIHR4cyA/IHR4cyA6IFtdO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFBvb2xIYXNoZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0VHhQb29sSGFzaGVzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4UG9vbEJhY2tsb2coKSB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFBvb2xTdGF0cygpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1R4UG9vbFN0YXRzKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0VHhQb29sU3RhdHNcIikpO1xuICB9XG4gIFxuICBhc3luYyBmbHVzaFR4UG9vbChoYXNoZXMpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25GbHVzaFR4UG9vbFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRLZXlJbWFnZVNwZW50U3RhdHVzZXMoa2V5SW1hZ2VzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dHMob3V0cHV0cyk6IFByb21pc2U8TW9uZXJvT3V0cHV0W10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dEhpc3RvZ3JhbShhbW91bnRzLCBtaW5Db3VudCwgbWF4Q291bnQsIGlzVW5sb2NrZWQsIHJlY2VudEN1dG9mZikge1xuICAgIGxldCBlbnRyaWVzID0gW107XG4gICAgZm9yIChsZXQgZW50cnlKc29uIG9mIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0T3V0cHV0SGlzdG9ncmFtXCIsIFthbW91bnRzLCBtaW5Db3VudCwgbWF4Q291bnQsIGlzVW5sb2NrZWQsIHJlY2VudEN1dG9mZl0pIGFzIGFueVtdKSB7XG4gICAgICBlbnRyaWVzLnB1c2gobmV3IE1vbmVyb091dHB1dEhpc3RvZ3JhbUVudHJ5KGVudHJ5SnNvbikpO1xuICAgIH1cbiAgICByZXR1cm4gZW50cmllcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0T3V0cHV0RGlzdHJpYnV0aW9uKGFtb3VudHMsIGN1bXVsYXRpdmUsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpIHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEluZm8oKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9EYWVtb25JbmZvKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0SW5mb1wiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFN5bmNJbmZvKCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvRGFlbW9uU3luY0luZm8oYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRTeW5jSW5mb1wiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhhcmRGb3JrSW5mbygpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0hhcmRGb3JrSW5mbyhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEhhcmRGb3JrSW5mb1wiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFsdENoYWlucygpIHtcbiAgICBsZXQgYWx0Q2hhaW5zID0gW107XG4gICAgZm9yIChsZXQgYWx0Q2hhaW5Kc29uIG9mIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QWx0Q2hhaW5zXCIpIGFzIGFueSkgYWx0Q2hhaW5zLnB1c2gobmV3IE1vbmVyb0FsdENoYWluKGFsdENoYWluSnNvbikpO1xuICAgIHJldHVybiBhbHRDaGFpbnM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFsdEJsb2NrSGFzaGVzKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEFsdEJsb2NrSGFzaGVzXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXREb3dubG9hZExpbWl0KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldERvd25sb2FkTGltaXRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIHNldERvd25sb2FkTGltaXQobGltaXQpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TZXREb3dubG9hZExpbWl0XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2V0RG93bmxvYWRMaW1pdCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25SZXNldERvd25sb2FkTGltaXRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFVwbG9hZExpbWl0KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFVwbG9hZExpbWl0XCIpO1xuICB9XG4gIFxuICBhc3luYyBzZXRVcGxvYWRMaW1pdChsaW1pdCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblNldFVwbG9hZExpbWl0XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2V0VXBsb2FkTGltaXQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uUmVzZXRVcGxvYWRMaW1pdFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGVlcnMoKSB7XG4gICAgbGV0IHBlZXJzID0gW107XG4gICAgZm9yIChsZXQgcGVlckpzb24gb2YgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRQZWVyc1wiKSBhcyBhbnkpIHBlZXJzLnB1c2gobmV3IE1vbmVyb1BlZXIocGVlckpzb24pKTtcbiAgICByZXR1cm4gcGVlcnM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEtub3duUGVlcnMoKSB7XG4gICAgbGV0IHBlZXJzID0gW107XG4gICAgZm9yIChsZXQgcGVlckpzb24gb2YgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRLbm93blBlZXJzXCIpIGFzIGFueSkgcGVlcnMucHVzaChuZXcgTW9uZXJvUGVlcihwZWVySnNvbikpO1xuICAgIHJldHVybiBwZWVycztcbiAgfVxuICBcbiAgYXN5bmMgc2V0T3V0Z29pbmdQZWVyTGltaXQobGltaXQpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TZXRJbmNvbWluZ1BlZXJMaW1pdFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBzZXRJbmNvbWluZ1BlZXJMaW1pdChsaW1pdCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblNldEluY29taW5nUGVlckxpbWl0XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBlZXJCYW5zKCkge1xuICAgIGxldCBiYW5zID0gW107XG4gICAgZm9yIChsZXQgYmFuSnNvbiBvZiBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFBlZXJCYW5zXCIpIGFzIGFueSkgYmFucy5wdXNoKG5ldyBNb25lcm9CYW4oYmFuSnNvbikpO1xuICAgIHJldHVybiBiYW5zO1xuICB9XG5cbiAgYXN5bmMgc2V0UGVlckJhbnMoYmFucykge1xuICAgIGxldCBiYW5zSnNvbiA9IFtdO1xuICAgIGZvciAobGV0IGJhbiBvZiBiYW5zKSBiYW5zSnNvbi5wdXNoKGJhbi50b0pzb24oKSk7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uU2V0UGVlckJhbnNcIiwgW2JhbnNKc29uXSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0YXJ0TWluaW5nKGFkZHJlc3MsIG51bVRocmVhZHMsIGlzQmFja2dyb3VuZCwgaWdub3JlQmF0dGVyeSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblN0YXJ0TWluaW5nXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0b3BNaW5pbmcoKSB7XG4gICAgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TdG9wTWluaW5nXCIpXG4gIH1cbiAgXG4gIGFzeW5jIGdldE1pbmluZ1N0YXR1cygpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb01pbmluZ1N0YXR1cyhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldE1pbmluZ1N0YXR1c1wiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdEJsb2NrcyhibG9ja0Jsb2JzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uU3VibWl0QmxvY2tzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cblxuICBhc3luYyBwcnVuZUJsb2NrY2hhaW4oY2hlY2spIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1BydW5lUmVzdWx0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uUHJ1bmVCbG9ja2NoYWluXCIpKTtcbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tGb3JVcGRhdGUoKTogUHJvbWlzZTxNb25lcm9EYWVtb25VcGRhdGVDaGVja1Jlc3VsdD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZG93bmxvYWRVcGRhdGUocGF0aCk6IFByb21pc2U8TW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIHN0b3AoKSB7XG4gICAgd2hpbGUgKHRoaXMud3JhcHBlZExpc3RlbmVycy5sZW5ndGgpIGF3YWl0IHRoaXMucmVtb3ZlTGlzdGVuZXIodGhpcy53cmFwcGVkTGlzdGVuZXJzWzBdLmdldExpc3RlbmVyKCkpO1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblN0b3BcIik7XG4gIH1cbiAgXG4gIGFzeW5jIHdhaXRGb3JOZXh0QmxvY2tIZWFkZXIoKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9CbG9ja0hlYWRlcihhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbldhaXRGb3JOZXh0QmxvY2tIZWFkZXJcIikpO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUFJJVkFURSBIRUxQRVJTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgLy8gVE9ETzogZHVwbGljYXRlZCB3aXRoIE1vbmVyb1dhbGxldEZ1bGxQcm94eVxuICBwcm90ZWN0ZWQgYXN5bmMgaW52b2tlV29ya2VyKGZuTmFtZTogc3RyaW5nLCBhcmdzPzogYW55KSB7XG4gICAgcmV0dXJuIExpYnJhcnlVdGlscy5pbnZva2VXb3JrZXIodGhpcy5kYWVtb25JZCwgZm5OYW1lLCBhcmdzKTtcbiAgfVxufVxuXG4vKipcbiAqIFBvbGxzIGEgTW9uZXJvIGRhZW1vbiBmb3IgdXBkYXRlcyBhbmQgbm90aWZpZXMgbGlzdGVuZXJzIGFzIHRoZXkgb2NjdXIuXG4gKiBcbiAqIEBwcml2YXRlXG4gKi9cbmNsYXNzIERhZW1vblBvbGxlciB7XG5cbiAgcHJvdGVjdGVkIGRhZW1vbjogTW9uZXJvRGFlbW9uUnBjO1xuICBwcm90ZWN0ZWQgbG9vcGVyOiBUYXNrTG9vcGVyO1xuICBwcm90ZWN0ZWQgaXNQb2xsaW5nOiBib29sZWFuO1xuICBwcm90ZWN0ZWQgbGFzdEhlYWRlcjogTW9uZXJvQmxvY2tIZWFkZXI7XG5cbiAgY29uc3RydWN0b3IoZGFlbW9uKSB7XG4gICAgbGV0IHRoYXQgPSB0aGlzO1xuICAgIHRoaXMuZGFlbW9uID0gZGFlbW9uO1xuICAgIHRoaXMubG9vcGVyID0gbmV3IFRhc2tMb29wZXIoYXN5bmMgZnVuY3Rpb24oKSB7IGF3YWl0IHRoYXQucG9sbCgpOyB9KTtcbiAgfVxuICBcbiAgc2V0SXNQb2xsaW5nKGlzUG9sbGluZzogYm9vbGVhbikge1xuICAgIHRoaXMuaXNQb2xsaW5nID0gaXNQb2xsaW5nO1xuICAgIGlmIChpc1BvbGxpbmcpIHRoaXMubG9vcGVyLnN0YXJ0KHRoaXMuZGFlbW9uLmdldFBvbGxJbnRlcnZhbCgpKTtcbiAgICBlbHNlIHRoaXMubG9vcGVyLnN0b3AoKTtcbiAgfVxuICBcbiAgYXN5bmMgcG9sbCgpIHtcbiAgICB0cnkge1xuICAgICAgXG4gICAgICAvLyBnZXQgbGF0ZXN0IGJsb2NrIGhlYWRlclxuICAgICAgbGV0IGhlYWRlciA9IGF3YWl0IHRoaXMuZGFlbW9uLmdldExhc3RCbG9ja0hlYWRlcigpO1xuICAgICAgXG4gICAgICAvLyBzYXZlIGZpcnN0IGhlYWRlciBmb3IgY29tcGFyaXNvblxuICAgICAgaWYgKCF0aGlzLmxhc3RIZWFkZXIpIHtcbiAgICAgICAgdGhpcy5sYXN0SGVhZGVyID0gYXdhaXQgdGhpcy5kYWVtb24uZ2V0TGFzdEJsb2NrSGVhZGVyKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gY29tcGFyZSBoZWFkZXIgdG8gbGFzdFxuICAgICAgaWYgKGhlYWRlci5nZXRIYXNoKCkgIT09IHRoaXMubGFzdEhlYWRlci5nZXRIYXNoKCkpIHtcbiAgICAgICAgdGhpcy5sYXN0SGVhZGVyID0gaGVhZGVyO1xuICAgICAgICBhd2FpdCB0aGlzLmFubm91bmNlQmxvY2tIZWFkZXIoaGVhZGVyKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gYmFja2dyb3VuZCBwb2xsIGRhZW1vbiBoZWFkZXJcIik7XG4gICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgfVxuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIGFubm91bmNlQmxvY2tIZWFkZXIoaGVhZGVyOiBNb25lcm9CbG9ja0hlYWRlcikge1xuICAgIGZvciAobGV0IGxpc3RlbmVyIG9mIGF3YWl0IHRoaXMuZGFlbW9uLmdldExpc3RlbmVycygpKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBsaXN0ZW5lci5vbkJsb2NrSGVhZGVyKGhlYWRlcik7IC8vIG5vdGlmeSBsaXN0ZW5lclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBjYWxsaW5nIGxpc3RlbmVyIG9uIGJsb2NrIGhlYWRlclwiLCBlcnIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEludGVybmFsIGxpc3RlbmVyIHRvIGJyaWRnZSBub3RpZmljYXRpb25zIHRvIGV4dGVybmFsIGxpc3RlbmVycy5cbiAqIFxuICogQHByaXZhdGVcbiAqL1xuY2xhc3MgRGFlbW9uV29ya2VyTGlzdGVuZXIge1xuXG4gIHByb3RlY3RlZCBpZDogYW55O1xuICBwcm90ZWN0ZWQgbGlzdGVuZXI6IGFueTtcblxuICBjb25zdHJ1Y3RvcihsaXN0ZW5lcikge1xuICAgIHRoaXMuaWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgdGhpcy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB9XG4gIFxuICBnZXRJZCgpIHtcbiAgICByZXR1cm4gdGhpcy5pZDtcbiAgfVxuICBcbiAgZ2V0TGlzdGVuZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMubGlzdGVuZXI7XG4gIH1cbiAgXG4gIGFzeW5jIG9uQmxvY2tIZWFkZXIoaGVhZGVySnNvbikge1xuICAgIHRoaXMubGlzdGVuZXIub25CbG9ja0hlYWRlcihuZXcgTW9uZXJvQmxvY2tIZWFkZXIoaGVhZGVySnNvbikpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IE1vbmVyb0RhZW1vblJwYztcbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLFNBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLGFBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFHLFdBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFJLGVBQUEsR0FBQUwsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFLLFVBQUEsR0FBQU4sc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFNLFlBQUEsR0FBQVAsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFPLGtCQUFBLEdBQUFSLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBUSxvQkFBQSxHQUFBVCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVMscUJBQUEsR0FBQVYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFVLGFBQUEsR0FBQVgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFXLG1CQUFBLEdBQUFaLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBWSxpQkFBQSxHQUFBYixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWEscUJBQUEsR0FBQWQsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFjLHFCQUFBLEdBQUFmLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBZSw4QkFBQSxH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