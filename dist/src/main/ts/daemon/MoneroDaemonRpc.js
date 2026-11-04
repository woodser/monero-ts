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

  async getBlockHashes(
  blockHashes,
  startHeight)
  {
    if (this.config.proxyToWorker) return this.proxyDaemon.getBlockHashes(blockHashes, startHeight);

    // serialize binary request
    const request = await _MoneroUtils.default.getHashesRequestToBinary(
      blockHashes,
      startHeight
    );

    // fetch block hashes in binary
    const response = await this.config.getServer().sendBinaryRequest(
      "get_hashes.bin",
      request
    );

    // deserialize binary response
    const decoded = await _MoneroUtils.default.binaryHashesToJson(response);

    MoneroDaemonRpc.checkResponseStatus(decoded);

    return decoded.hashes;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX1Rhc2tMb29wZXIiLCJfTW9uZXJvQWx0Q2hhaW4iLCJfTW9uZXJvQmFuIiwiX01vbmVyb0Jsb2NrIiwiX01vbmVyb0Jsb2NrSGVhZGVyIiwiX01vbmVyb0Jsb2NrVGVtcGxhdGUiLCJfTW9uZXJvQ29ubmVjdGlvblNwYW4iLCJfTW9uZXJvRGFlbW9uIiwiX01vbmVyb0RhZW1vbkNvbmZpZyIsIl9Nb25lcm9EYWVtb25JbmZvIiwiX01vbmVyb0RhZW1vbkxpc3RlbmVyIiwiX01vbmVyb0RhZW1vblN5bmNJbmZvIiwiX01vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0IiwiX01vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0IiwiX01vbmVyb0ZlZUVzdGltYXRlIiwiX01vbmVyb0Vycm9yIiwiX01vbmVyb0hhcmRGb3JrSW5mbyIsIl9Nb25lcm9LZXlJbWFnZSIsIl9Nb25lcm9NaW5lclR4U3VtIiwiX01vbmVyb01pbmluZ1N0YXR1cyIsIl9Nb25lcm9OZXR3b3JrVHlwZSIsIl9Nb25lcm9PdXRwdXQiLCJfTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkiLCJfTW9uZXJvUGVlciIsIl9Nb25lcm9QcnVuZVJlc3VsdCIsIl9Nb25lcm9ScGNDb25uZWN0aW9uIiwiX01vbmVyb1N1Ym1pdFR4UmVzdWx0IiwiX01vbmVyb1R4IiwiX01vbmVyb1R4UG9vbFN0YXRzIiwiX01vbmVyb1V0aWxzIiwiX01vbmVyb1ZlcnNpb24iLCJNb25lcm9EYWVtb25ScGMiLCJNb25lcm9EYWVtb24iLCJNQVhfUkVRX1NJWkUiLCJERUZBVUxUX0lEIiwiTlVNX0hFQURFUlNfUEVSX1JFUSIsIkRFRkFVTFRfUE9MTF9QRVJJT0QiLCJjb25zdHJ1Y3RvciIsImNvbmZpZyIsInByb3h5RGFlbW9uIiwicHJveHlUb1dvcmtlciIsImxpc3RlbmVycyIsImNhY2hlZEhlYWRlcnMiLCJnZXRQcm9jZXNzIiwicHJvY2VzcyIsInN0b3BQcm9jZXNzIiwiZm9yY2UiLCJ1bmRlZmluZWQiLCJNb25lcm9FcnJvciIsImxpc3RlbmVyc0NvcHkiLCJHZW5VdGlscyIsImNvcHlBcnJheSIsImdldExpc3RlbmVycyIsImxpc3RlbmVyIiwicmVtb3ZlTGlzdGVuZXIiLCJraWxsUHJvY2VzcyIsImFkZExpc3RlbmVyIiwiYXNzZXJ0IiwiTW9uZXJvRGFlbW9uTGlzdGVuZXIiLCJwdXNoIiwicmVmcmVzaExpc3RlbmluZyIsImlkeCIsImluZGV4T2YiLCJzcGxpY2UiLCJnZXRScGNDb25uZWN0aW9uIiwiZ2V0U2VydmVyIiwiaXNDb25uZWN0ZWQiLCJnZXRWZXJzaW9uIiwiZSIsInJlc3AiLCJzZW5kSnNvblJlcXVlc3QiLCJjaGVja1Jlc3BvbnNlU3RhdHVzIiwicmVzdWx0IiwiTW9uZXJvVmVyc2lvbiIsInZlcnNpb24iLCJyZWxlYXNlIiwiaXNUcnVzdGVkIiwic2VuZFBhdGhSZXF1ZXN0IiwidW50cnVzdGVkIiwiZ2V0SGVpZ2h0IiwiY291bnQiLCJnZXRCbG9ja0hhc2giLCJoZWlnaHQiLCJnZXRCbG9ja1RlbXBsYXRlIiwid2FsbGV0QWRkcmVzcyIsInJlc2VydmVTaXplIiwid2FsbGV0X2FkZHJlc3MiLCJyZXNlcnZlX3NpemUiLCJjb252ZXJ0UnBjQmxvY2tUZW1wbGF0ZSIsImdldExhc3RCbG9ja0hlYWRlciIsImNvbnZlcnRScGNCbG9ja0hlYWRlciIsImJsb2NrX2hlYWRlciIsImdldEJsb2NrSGVhZGVyQnlIYXNoIiwiYmxvY2tIYXNoIiwiaGFzaCIsImdldEJsb2NrSGVhZGVyQnlIZWlnaHQiLCJnZXRCbG9ja0hlYWRlcnNCeVJhbmdlIiwic3RhcnRIZWlnaHQiLCJlbmRIZWlnaHQiLCJzdGFydF9oZWlnaHQiLCJlbmRfaGVpZ2h0IiwiaGVhZGVycyIsInJwY0hlYWRlciIsImdldEJsb2NrQnlIYXNoIiwiY29udmVydFJwY0Jsb2NrIiwiZ2V0QmxvY2tCeUhlaWdodCIsImdldEJsb2Nrc0J5SGVpZ2h0IiwiaGVpZ2h0cyIsInJlc3BCaW4iLCJzZW5kQmluYXJ5UmVxdWVzdCIsInJwY0Jsb2NrcyIsIk1vbmVyb1V0aWxzIiwiYmluYXJ5QmxvY2tzVG9Kc29uIiwiZXF1YWwiLCJ0eHMiLCJsZW5ndGgiLCJibG9ja3MiLCJibG9ja0lkeCIsImJsb2NrIiwic2V0SGVpZ2h0IiwidHhJZHgiLCJ0eCIsIk1vbmVyb1R4Iiwic2V0SGFzaCIsInR4X2hhc2hlcyIsInNldElzQ29uZmlybWVkIiwic2V0SW5UeFBvb2wiLCJzZXRJc01pbmVyVHgiLCJzZXRSZWxheSIsInNldElzUmVsYXllZCIsInNldElzRmFpbGVkIiwic2V0SXNEb3VibGVTcGVuZFNlZW4iLCJjb252ZXJ0UnBjVHgiLCJzZXRUeHMiLCJnZXRCbG9jayIsIm1lcmdlIiwiZ2V0VHhzIiwic2V0QmxvY2siLCJnZXRCbG9ja0hhc2hlcyIsImJsb2NrSGFzaGVzIiwicmVxdWVzdCIsImdldEhhc2hlc1JlcXVlc3RUb0JpbmFyeSIsInJlc3BvbnNlIiwiZGVjb2RlZCIsImJpbmFyeUhhc2hlc1RvSnNvbiIsImhhc2hlcyIsImdldEJsb2Nrc0J5UmFuZ2UiLCJnZXRCbG9ja3NCeVJhbmdlQ2h1bmtlZCIsIm1heENodW5rU2l6ZSIsImxhc3RIZWlnaHQiLCJnZXRNYXhCbG9ja3MiLCJ0eEhhc2hlcyIsInBydW5lIiwiQXJyYXkiLCJpc0FycmF5IiwidHhzX2hhc2hlcyIsImRlY29kZV9hc19qc29uIiwibWVzc2FnZSIsImdldFR4SGV4ZXMiLCJoZXhlcyIsImdldFBydW5lZEhleCIsImdldEZ1bGxIZXgiLCJnZXRNaW5lclR4U3VtIiwibnVtQmxvY2tzIiwidHhTdW0iLCJNb25lcm9NaW5lclR4U3VtIiwic2V0RW1pc3Npb25TdW0iLCJCaWdJbnQiLCJlbWlzc2lvbl9hbW91bnQiLCJzZXRGZWVTdW0iLCJmZWVfYW1vdW50IiwiZ2V0RmVlRXN0aW1hdGUiLCJncmFjZUJsb2NrcyIsImdyYWNlX2Jsb2NrcyIsImZlZUVzdGltYXRlIiwiTW9uZXJvRmVlRXN0aW1hdGUiLCJzZXRGZWUiLCJmZWUiLCJzZXRRdWFudGl6YXRpb25NYXNrIiwicXVhbnRpemF0aW9uX21hc2siLCJmZWVzIiwiaSIsInNldEZlZXMiLCJzdWJtaXRUeEhleCIsInR4SGV4IiwiZG9Ob3RSZWxheSIsInR4X2FzX2hleCIsImRvX25vdF9yZWxheSIsImNvbnZlcnRScGNTdWJtaXRUeFJlc3VsdCIsInNldElzR29vZCIsInJlbGF5VHhzQnlIYXNoIiwidHhpZHMiLCJnZXRUeFBvb2wiLCJ0cmFuc2FjdGlvbnMiLCJycGNUeCIsInNldE51bUNvbmZpcm1hdGlvbnMiLCJnZXRUeFBvb2xIYXNoZXMiLCJnZXRUeFBvb2xTdGF0cyIsImNvbnZlcnRScGNUeFBvb2xTdGF0cyIsInBvb2xfc3RhdHMiLCJmbHVzaFR4UG9vbCIsImxpc3RpZnkiLCJnZXRLZXlJbWFnZVNwZW50U3RhdHVzZXMiLCJrZXlJbWFnZXMiLCJrZXlfaW1hZ2VzIiwic3BlbnRfc3RhdHVzIiwiZ2V0T3V0cHV0SGlzdG9ncmFtIiwiYW1vdW50cyIsIm1pbkNvdW50IiwibWF4Q291bnQiLCJpc1VubG9ja2VkIiwicmVjZW50Q3V0b2ZmIiwibWluX2NvdW50IiwibWF4X2NvdW50IiwidW5sb2NrZWQiLCJyZWNlbnRfY3V0b2ZmIiwiZW50cmllcyIsImhpc3RvZ3JhbSIsInJwY0VudHJ5IiwiY29udmVydFJwY091dHB1dEhpc3RvZ3JhbUVudHJ5IiwiZ2V0T3V0cHV0RGlzdHJpYnV0aW9uIiwiY3VtdWxhdGl2ZSIsImdldEluZm8iLCJjb252ZXJ0UnBjSW5mbyIsImdldFN5bmNJbmZvIiwiY29udmVydFJwY1N5bmNJbmZvIiwiZ2V0SGFyZEZvcmtJbmZvIiwiY29udmVydFJwY0hhcmRGb3JrSW5mbyIsImdldEFsdENoYWlucyIsImNoYWlucyIsInJwY0NoYWluIiwiY29udmVydFJwY0FsdENoYWluIiwiZ2V0QWx0QmxvY2tIYXNoZXMiLCJibGtzX2hhc2hlcyIsImdldERvd25sb2FkTGltaXQiLCJnZXRCYW5kd2lkdGhMaW1pdHMiLCJzZXREb3dubG9hZExpbWl0IiwibGltaXQiLCJyZXNldERvd25sb2FkTGltaXQiLCJpc0ludCIsInNldEJhbmR3aWR0aExpbWl0cyIsImdldFVwbG9hZExpbWl0Iiwic2V0VXBsb2FkTGltaXQiLCJyZXNldFVwbG9hZExpbWl0IiwiZ2V0UGVlcnMiLCJwZWVycyIsImNvbm5lY3Rpb25zIiwicnBjQ29ubmVjdGlvbiIsImNvbnZlcnRScGNDb25uZWN0aW9uIiwiZ2V0S25vd25QZWVycyIsImdyYXlfbGlzdCIsInJwY1BlZXIiLCJwZWVyIiwiY29udmVydFJwY1BlZXIiLCJzZXRJc09ubGluZSIsIndoaXRlX2xpc3QiLCJzZXRPdXRnb2luZ1BlZXJMaW1pdCIsIm91dF9wZWVycyIsInNldEluY29taW5nUGVlckxpbWl0IiwiaW5fcGVlcnMiLCJnZXRQZWVyQmFucyIsImJhbnMiLCJycGNCYW4iLCJiYW4iLCJNb25lcm9CYW4iLCJzZXRIb3N0IiwiaG9zdCIsInNldElwIiwiaXAiLCJzZXRTZWNvbmRzIiwic2Vjb25kcyIsInNldFBlZXJCYW5zIiwicnBjQmFucyIsImNvbnZlcnRUb1JwY0JhbiIsInN0YXJ0TWluaW5nIiwiYWRkcmVzcyIsIm51bVRocmVhZHMiLCJpc0JhY2tncm91bmQiLCJpZ25vcmVCYXR0ZXJ5IiwibWluZXJfYWRkcmVzcyIsInRocmVhZHNfY291bnQiLCJkb19iYWNrZ3JvdW5kX21pbmluZyIsImlnbm9yZV9iYXR0ZXJ5Iiwic3RvcE1pbmluZyIsImdldE1pbmluZ1N0YXR1cyIsImNvbnZlcnRScGNNaW5pbmdTdGF0dXMiLCJzdWJtaXRCbG9ja3MiLCJibG9ja0Jsb2JzIiwicHJ1bmVCbG9ja2NoYWluIiwiY2hlY2siLCJNb25lcm9QcnVuZVJlc3VsdCIsInNldElzUHJ1bmVkIiwicHJ1bmVkIiwic2V0UHJ1bmluZ1NlZWQiLCJwcnVuaW5nX3NlZWQiLCJjaGVja0ZvclVwZGF0ZSIsImNvbW1hbmQiLCJjb252ZXJ0UnBjVXBkYXRlQ2hlY2tSZXN1bHQiLCJkb3dubG9hZFVwZGF0ZSIsInBhdGgiLCJjb252ZXJ0UnBjVXBkYXRlRG93bmxvYWRSZXN1bHQiLCJzdG9wIiwid2FpdEZvck5leHRCbG9ja0hlYWRlciIsInRoYXQiLCJQcm9taXNlIiwicmVzb2x2ZSIsIm9uQmxvY2tIZWFkZXIiLCJoZWFkZXIiLCJnZXRQb2xsSW50ZXJ2YWwiLCJwb2xsSW50ZXJ2YWwiLCJnZXRUeCIsInR4SGFzaCIsImdldFR4SGV4IiwiZ2V0S2V5SW1hZ2VTcGVudFN0YXR1cyIsImtleUltYWdlIiwic2V0UGVlckJhbiIsInN1Ym1pdEJsb2NrIiwiYmxvY2tCbG9iIiwicG9sbExpc3RlbmVyIiwiRGFlbW9uUG9sbGVyIiwic2V0SXNQb2xsaW5nIiwibGltaXRfZG93biIsImxpbWl0X3VwIiwiZG93bkxpbWl0IiwidXBMaW1pdCIsIm1heEhlaWdodCIsIm1heFJlcVNpemUiLCJyZXFTaXplIiwiZ2V0QmxvY2tIZWFkZXJCeUhlaWdodENhY2hlZCIsImdldFNpemUiLCJjYWNoZWRIZWFkZXIiLCJNYXRoIiwibWluIiwiY29ubmVjdFRvRGFlbW9uUnBjIiwidXJpT3JDb25maWciLCJ1c2VybmFtZSIsInBhc3N3b3JkIiwibm9ybWFsaXplQ29uZmlnIiwiY21kIiwic3RhcnRNb25lcm9kUHJvY2VzcyIsIk1vbmVyb0RhZW1vblJwY1Byb3h5IiwiY29ubmVjdCIsImNoaWxkUHJvY2VzcyIsInNwYXduIiwic2xpY2UiLCJlbnYiLCJMQU5HIiwic3Rkb3V0Iiwic2V0RW5jb2RpbmciLCJzdGRlcnIiLCJ1cmkiLCJvdXRwdXQiLCJyZWplY3QiLCJvbiIsImRhdGEiLCJsaW5lIiwidG9TdHJpbmciLCJMaWJyYXJ5VXRpbHMiLCJsb2ciLCJ1cmlMaW5lQ29udGFpbnMiLCJ1cmlMaW5lQ29udGFpbnNJZHgiLCJzdWJzdHJpbmciLCJsYXN0SW5kZXhPZiIsInVuZm9ybWF0dGVkTGluZSIsInJlcGxhY2UiLCJ0cmltIiwicG9ydCIsInNzbElkeCIsInNzbEVuYWJsZWQiLCJ0b0xvd2VyQ2FzZSIsInVzZXJQYXNzSWR4IiwidXNlclBhc3MiLCJjb3B5Iiwic2V0U2VydmVyIiwicmVqZWN0VW5hdXRob3JpemVkIiwiZ2V0UmVqZWN0VW5hdXRob3JpemVkIiwic2V0UHJveHlUb1dvcmtlciIsImRhZW1vbiIsImlzUmVzb2x2ZWQiLCJnZXRMb2dMZXZlbCIsImNvbnNvbGUiLCJlcnJvciIsImNvZGUiLCJFcnJvciIsImVyciIsIm9yaWdpbiIsIk1vbmVyb0RhZW1vbkNvbmZpZyIsInNlcnZlciIsIk1vbmVyb1JwY0Nvbm5lY3Rpb24iLCJERUZBVUxUX0NPTkZJRyIsInN0YXR1cyIsIk1vbmVyb0Jsb2NrSGVhZGVyIiwia2V5IiwiT2JqZWN0Iiwia2V5cyIsInZhbCIsInNhZmVTZXQiLCJzZXRTaXplIiwiZ2V0RGVwdGgiLCJzZXREZXB0aCIsInNldERpZmZpY3VsdHkiLCJyZWNvbmNpbGUiLCJnZXREaWZmaWN1bHR5IiwicHJlZml4ZWRIZXhUb0JJIiwic2V0Q3VtdWxhdGl2ZURpZmZpY3VsdHkiLCJnZXRDdW11bGF0aXZlRGlmZmljdWx0eSIsImdldEhhc2giLCJnZXRNYWpvclZlcnNpb24iLCJzZXRNYWpvclZlcnNpb24iLCJnZXRNaW5vclZlcnNpb24iLCJzZXRNaW5vclZlcnNpb24iLCJnZXROb25jZSIsInNldE5vbmNlIiwiZ2V0TnVtVHhzIiwic2V0TnVtVHhzIiwiZ2V0T3JwaGFuU3RhdHVzIiwic2V0T3JwaGFuU3RhdHVzIiwiZ2V0UHJldkhhc2giLCJzZXRQcmV2SGFzaCIsImdldFJld2FyZCIsInNldFJld2FyZCIsImdldFRpbWVzdGFtcCIsInNldFRpbWVzdGFtcCIsImdldFdlaWdodCIsInNldFdlaWdodCIsImdldExvbmdUZXJtV2VpZ2h0Iiwic2V0TG9uZ1Rlcm1XZWlnaHQiLCJnZXRQb3dIYXNoIiwic2V0UG93SGFzaCIsInNldE1pbmVyVHhIYXNoIiwicnBjQmxvY2siLCJNb25lcm9CbG9jayIsInNldEhleCIsImJsb2IiLCJzZXRUeEhhc2hlcyIsInJwY01pbmVyVHgiLCJqc29uIiwiSlNPTiIsInBhcnNlIiwibWluZXJfdHgiLCJtaW5lclR4Iiwic2V0TWluZXJUeCIsImdldExhc3RSZWxheWVkVGltZXN0YW1wIiwic2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAiLCJnZXRSZWNlaXZlZFRpbWVzdGFtcCIsInNldFJlY2VpdmVkVGltZXN0YW1wIiwiZ2V0TnVtQ29uZmlybWF0aW9ucyIsImdldElzQ29uZmlybWVkIiwiZ2V0SW5UeFBvb2wiLCJnZXRJc0RvdWJsZVNwZW5kU2VlbiIsInNldFZlcnNpb24iLCJnZXRFeHRyYSIsInNldEV4dHJhIiwiVWludDhBcnJheSIsImdlbiIsInNldElucHV0cyIsIm1hcCIsInJwY1ZpbiIsImNvbnZlcnRScGNPdXRwdXQiLCJzZXRPdXRwdXRzIiwicnBjT3V0cHV0IiwiZ2V0UmN0U2lnbmF0dXJlcyIsInNldFJjdFNpZ25hdHVyZXMiLCJ0eG5GZWUiLCJnZXRGZWUiLCJnZXRSY3RTaWdQcnVuYWJsZSIsInNldFJjdFNpZ1BydW5hYmxlIiwiZ2V0VW5sb2NrVGltZSIsInNldFVubG9ja1RpbWUiLCJzZXRGdWxsSGV4IiwiZ2V0SXNSZWxheWVkIiwiZ2V0T3V0cHV0SW5kaWNlcyIsInNldE91dHB1dEluZGljZXMiLCJnZXRSZWxheSIsImdldElzS2VwdEJ5QmxvY2siLCJzZXRJc0tlcHRCeUJsb2NrIiwiZ2V0U2lnbmF0dXJlcyIsInNldFNpZ25hdHVyZXMiLCJnZXRJc0ZhaWxlZCIsImdldExhc3RGYWlsZWRIZWlnaHQiLCJzZXRMYXN0RmFpbGVkSGVpZ2h0IiwiZ2V0TGFzdEZhaWxlZEhhc2giLCJzZXRMYXN0RmFpbGVkSGFzaCIsImdldE1heFVzZWRCbG9ja0hlaWdodCIsInNldE1heFVzZWRCbG9ja0hlaWdodCIsImdldE1heFVzZWRCbG9ja0hhc2giLCJzZXRNYXhVc2VkQmxvY2tIYXNoIiwiZ2V0UHJ1bmFibGVIYXNoIiwic2V0UHJ1bmFibGVIYXNoIiwiZ2V0UHJ1bmFibGVIZXgiLCJzZXRQcnVuYWJsZUhleCIsInNldFBydW5lZEhleCIsImdldE91dHB1dHMiLCJzZXRJbmRleCIsImFzX2pzb24iLCJ0eF9qc29uIiwiTW9uZXJvT3V0cHV0Iiwic2V0VHgiLCJnZXRBbW91bnQiLCJzZXRBbW91bnQiLCJhbW91bnQiLCJnZXRLZXlJbWFnZSIsInNldEtleUltYWdlIiwiTW9uZXJvS2V5SW1hZ2UiLCJrX2ltYWdlIiwiZ2V0UmluZ091dHB1dEluZGljZXMiLCJzZXRSaW5nT3V0cHV0SW5kaWNlcyIsImtleV9vZmZzZXRzIiwicHViS2V5IiwidGFnZ2VkX2tleSIsImdldFN0ZWFsdGhQdWJsaWNLZXkiLCJzZXRTdGVhbHRoUHVibGljS2V5IiwicnBjVGVtcGxhdGUiLCJ0ZW1wbGF0ZSIsIk1vbmVyb0Jsb2NrVGVtcGxhdGUiLCJzZXRCbG9ja0hhc2hpbmdCbG9iIiwic2V0QmxvY2tUZW1wbGF0ZUJsb2IiLCJzZXRFeHBlY3RlZFJld2FyZCIsInNldFJlc2VydmVkT2Zmc2V0Iiwic2V0U2VlZEhlaWdodCIsInNldFNlZWRIYXNoIiwic2V0TmV4dFNlZWRIYXNoIiwiZ2V0TmV4dFNlZWRIYXNoIiwicnBjSW5mbyIsImluZm8iLCJNb25lcm9EYWVtb25JbmZvIiwic2V0TnVtQWx0QmxvY2tzIiwic2V0QmxvY2tTaXplTGltaXQiLCJzZXRCbG9ja1NpemVNZWRpYW4iLCJzZXRCbG9ja1dlaWdodExpbWl0Iiwic2V0QmxvY2tXZWlnaHRNZWRpYW4iLCJzZXRCb290c3RyYXBEYWVtb25BZGRyZXNzIiwic2V0RnJlZVNwYWNlIiwic2V0RGF0YWJhc2VTaXplIiwic2V0TnVtT2ZmbGluZVBlZXJzIiwic2V0SGVpZ2h0V2l0aG91dEJvb3RzdHJhcCIsInNldE51bUluY29taW5nQ29ubmVjdGlvbnMiLCJzZXRJc09mZmxpbmUiLCJzZXROdW1PdXRnb2luZ0Nvbm5lY3Rpb25zIiwic2V0TnVtUnBjQ29ubmVjdGlvbnMiLCJzZXRTdGFydFRpbWVzdGFtcCIsInNldEFkanVzdGVkVGltZXN0YW1wIiwic2V0VGFyZ2V0Iiwic2V0VGFyZ2V0SGVpZ2h0Iiwic2V0VG9wQmxvY2tIYXNoIiwic2V0TnVtVHhzUG9vbCIsInNldFdhc0Jvb3RzdHJhcEV2ZXJVc2VkIiwic2V0TnVtT25saW5lUGVlcnMiLCJzZXRVcGRhdGVBdmFpbGFibGUiLCJnZXROZXR3b3JrVHlwZSIsInNldE5ldHdvcmtUeXBlIiwiTW9uZXJvTmV0d29ya1R5cGUiLCJNQUlOTkVUIiwiVEVTVE5FVCIsIlNUQUdFTkVUIiwic2V0Q3JlZGl0cyIsImdldFRvcEJsb2NrSGFzaCIsInNldElzQnVzeVN5bmNpbmciLCJzZXRJc1N5bmNocm9uaXplZCIsInNldElzUmVzdHJpY3RlZCIsInJwY1N5bmNJbmZvIiwic3luY0luZm8iLCJNb25lcm9EYWVtb25TeW5jSW5mbyIsInNldFBlZXJzIiwicnBjQ29ubmVjdGlvbnMiLCJzZXRTcGFucyIsInJwY1NwYW5zIiwicnBjU3BhbiIsImdldFNwYW5zIiwiY29udmVydFJwY0Nvbm5lY3Rpb25TcGFuIiwic2V0TmV4dE5lZWRlZFBydW5pbmdTZWVkIiwib3ZlcnZpZXciLCJycGNIYXJkRm9ya0luZm8iLCJNb25lcm9IYXJkRm9ya0luZm8iLCJzZXRFYXJsaWVzdEhlaWdodCIsInNldElzRW5hYmxlZCIsInNldFN0YXRlIiwic2V0VGhyZXNob2xkIiwic2V0TnVtVm90ZXMiLCJzZXRWb3RpbmciLCJzZXRXaW5kb3ciLCJycGNDb25uZWN0aW9uU3BhbiIsInNwYW4iLCJNb25lcm9Db25uZWN0aW9uU3BhbiIsInNldENvbm5lY3Rpb25JZCIsInNldE51bUJsb2NrcyIsInNldFJhdGUiLCJzZXRSZW1vdGVBZGRyZXNzIiwic2V0U3BlZWQiLCJzZXRTdGFydEhlaWdodCIsImVudHJ5IiwiTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkiLCJzZXROdW1JbnN0YW5jZXMiLCJzZXROdW1VbmxvY2tlZEluc3RhbmNlcyIsInNldE51bVJlY2VudEluc3RhbmNlcyIsInJwY1Jlc3VsdCIsIk1vbmVyb1N1Ym1pdFR4UmVzdWx0Iiwic2V0SXNGZWVUb29Mb3ciLCJzZXRIYXNJbnZhbGlkSW5wdXQiLCJzZXRIYXNJbnZhbGlkT3V0cHV0Iiwic2V0SGFzVG9vRmV3T3V0cHV0cyIsInNldElzTWl4aW5Ub29Mb3ciLCJzZXRJc092ZXJzcGVuZCIsInNldFJlYXNvbiIsInNldElzVG9vQmlnIiwic2V0U2FuaXR5Q2hlY2tGYWlsZWQiLCJzZXRJc1R4RXh0cmFUb29CaWciLCJzZXRJc05vbnplcm9VbmxvY2tUaW1lIiwicnBjU3RhdHMiLCJzdGF0cyIsIk1vbmVyb1R4UG9vbFN0YXRzIiwic2V0Qnl0ZXNNYXgiLCJzZXRCeXRlc01lZCIsInNldEJ5dGVzTWluIiwic2V0Qnl0ZXNUb3RhbCIsInNldEhpc3RvOThwYyIsInNldE51bTEwbSIsInNldE51bURvdWJsZVNwZW5kcyIsInNldE51bUZhaWxpbmciLCJzZXROdW1Ob3RSZWxheWVkIiwic2V0T2xkZXN0VGltZXN0YW1wIiwic2V0RmVlVG90YWwiLCJzZXRIaXN0byIsIk1hcCIsImVsZW0iLCJnZXRIaXN0byIsInNldCIsImJ5dGVzIiwiZ2V0SGlzdG85OHBjIiwiY2hhaW4iLCJNb25lcm9BbHRDaGFpbiIsInNldExlbmd0aCIsInNldEJsb2NrSGFzaGVzIiwic2V0TWFpbkNoYWluUGFyZW50QmxvY2tIYXNoIiwiTW9uZXJvUGVlciIsInNldElkIiwic2V0TGFzdFNlZW5UaW1lc3RhbXAiLCJzZXRQb3J0Iiwic2V0UnBjUG9ydCIsInNldFJwY0NyZWRpdHNQZXJIYXNoIiwic2V0QWRkcmVzcyIsInNldEF2Z0Rvd25sb2FkIiwic2V0QXZnVXBsb2FkIiwic2V0Q3VycmVudERvd25sb2FkIiwic2V0Q3VycmVudFVwbG9hZCIsInNldElzSW5jb21pbmciLCJzZXRMaXZlVGltZSIsInNldElzTG9jYWxJcCIsInNldElzTG9jYWxIb3N0IiwicGFyc2VJbnQiLCJzZXROdW1SZWNlaXZlcyIsInNldFJlY2VpdmVJZGxlVGltZSIsInNldE51bVNlbmRzIiwic2V0U2VuZElkbGVUaW1lIiwic2V0TnVtU3VwcG9ydEZsYWdzIiwic2V0VHlwZSIsImdldEhvc3QiLCJnZXRJcCIsImdldElzQmFubmVkIiwiZ2V0U2Vjb25kcyIsInJwY1N0YXR1cyIsIk1vbmVyb01pbmluZ1N0YXR1cyIsInNldElzQWN0aXZlIiwiYWN0aXZlIiwic3BlZWQiLCJzZXROdW1UaHJlYWRzIiwic2V0SXNCYWNrZ3JvdW5kIiwiaXNfYmFja2dyb3VuZF9taW5pbmdfZW5hYmxlZCIsIk1vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0Iiwic2V0QXV0b1VyaSIsInNldElzVXBkYXRlQXZhaWxhYmxlIiwic2V0VXNlclVyaSIsImdldEF1dG9VcmkiLCJnZXRVc2VyVXJpIiwiTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQiLCJzZXREb3dubG9hZFBhdGgiLCJnZXREb3dubG9hZFBhdGgiLCJoZXgiLCJkYWVtb25JZCIsIndvcmtlciIsIndyYXBwZWRMaXN0ZW5lcnMiLCJnZXRVVUlEIiwiYXNzaWduIiwidG9Kc29uIiwiaW52b2tlV29ya2VyIiwiZ2V0V29ya2VyIiwid3JhcHBlZExpc3RlbmVyIiwiRGFlbW9uV29ya2VyTGlzdGVuZXIiLCJsaXN0ZW5lcklkIiwiZ2V0SWQiLCJhZGRXb3JrZXJDYWxsYmFjayIsImdldExpc3RlbmVyIiwicmVtb3ZlV29ya2VyQ2FsbGJhY2siLCJ2ZXJzaW9uSnNvbiIsIm51bWJlciIsImlzUmVsZWFzZSIsImZyb20iLCJhcmd1bWVudHMiLCJibG9ja0hlYWRlcnNKc29uIiwiYmxvY2tIZWFkZXJKc29uIiwiRGVzZXJpYWxpemF0aW9uVHlwZSIsIlRYIiwiZ2V0QmxvY2tzQnlIYXNoIiwiYmxvY2tzSnNvbiIsImJsb2NrSnNvbiIsImdldFR4UG9vbEJhY2tsb2ciLCJvdXRwdXRzIiwiZW50cnlKc29uIiwiYWx0Q2hhaW5zIiwiYWx0Q2hhaW5Kc29uIiwicGVlckpzb24iLCJiYW5Kc29uIiwiYmFuc0pzb24iLCJmbk5hbWUiLCJhcmdzIiwibG9vcGVyIiwiVGFza0xvb3BlciIsInBvbGwiLCJpc1BvbGxpbmciLCJzdGFydCIsImxhc3RIZWFkZXIiLCJhbm5vdW5jZUJsb2NrSGVhZGVyIiwiaWQiLCJoZWFkZXJKc29uIiwiX2RlZmF1bHQiLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL2RhZW1vbi9Nb25lcm9EYWVtb25ScGMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XG5pbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9HZW5VdGlsc1wiO1xuaW1wb3J0IExpYnJhcnlVdGlscyBmcm9tIFwiLi4vY29tbW9uL0xpYnJhcnlVdGlsc1wiO1xuaW1wb3J0IFRhc2tMb29wZXIgZnJvbSBcIi4uL2NvbW1vbi9UYXNrTG9vcGVyXCI7XG5pbXBvcnQgTW9uZXJvQWx0Q2hhaW4gZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWx0Q2hhaW5cIjtcbmltcG9ydCBNb25lcm9CYW4gZnJvbSBcIi4vbW9kZWwvTW9uZXJvQmFuXCI7XG5pbXBvcnQgTW9uZXJvQmxvY2sgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQmxvY2tcIjtcbmltcG9ydCBNb25lcm9CbG9ja0hlYWRlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9CbG9ja0hlYWRlclwiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrVGVtcGxhdGUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQmxvY2tUZW1wbGF0ZVwiO1xuaW1wb3J0IE1vbmVyb0Nvbm5lY3Rpb25TcGFuIGZyb20gXCIuL21vZGVsL01vbmVyb0Nvbm5lY3Rpb25TcGFuXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uIGZyb20gXCIuL01vbmVyb0RhZW1vblwiO1xuaW1wb3J0IE1vbmVyb0RhZW1vbkNvbmZpZyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9EYWVtb25Db25maWdcIjtcbmltcG9ydCBNb25lcm9EYWVtb25JbmZvIGZyb20gXCIuL21vZGVsL01vbmVyb0RhZW1vbkluZm9cIjtcbmltcG9ydCBNb25lcm9EYWVtb25MaXN0ZW5lciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9EYWVtb25MaXN0ZW5lclwiO1xuaW1wb3J0IE1vbmVyb0RhZW1vblN5bmNJbmZvIGZyb20gXCIuL21vZGVsL01vbmVyb0RhZW1vblN5bmNJbmZvXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb0ZlZUVzdGltYXRlIGZyb20gXCIuL21vZGVsL01vbmVyb0ZlZUVzdGltYXRlXCI7XG5pbXBvcnQgTW9uZXJvRXJyb3IgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9FcnJvclwiO1xuaW1wb3J0IE1vbmVyb0hhcmRGb3JrSW5mbyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9IYXJkRm9ya0luZm9cIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9LZXlJbWFnZVwiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlU3BlbnRTdGF0dXMgZnJvbSBcIi4vbW9kZWwvTW9uZXJvS2V5SW1hZ2VTcGVudFN0YXR1c1wiO1xuaW1wb3J0IE1vbmVyb01pbmVyVHhTdW0gZnJvbSBcIi4vbW9kZWwvTW9uZXJvTWluZXJUeFN1bVwiO1xuaW1wb3J0IE1vbmVyb01pbmluZ1N0YXR1cyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NaW5pbmdTdGF0dXNcIjtcbmltcG9ydCBNb25lcm9OZXR3b3JrVHlwZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9OZXR3b3JrVHlwZVwiO1xuaW1wb3J0IE1vbmVyb091dHB1dCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRwdXRcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeVwiO1xuaW1wb3J0IE1vbmVyb1BlZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvUGVlclwiO1xuaW1wb3J0IE1vbmVyb1BydW5lUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb1BydW5lUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvUnBjQ29ubmVjdGlvbiBmcm9tIFwiLi4vY29tbW9uL01vbmVyb1JwY0Nvbm5lY3Rpb25cIjtcbmltcG9ydCBNb25lcm9TdWJtaXRUeFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9TdWJtaXRUeFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb1R4IGZyb20gXCIuL21vZGVsL01vbmVyb1R4XCI7XG5pbXBvcnQgTW9uZXJvVHhQb29sU3RhdHMgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhQb29sU3RhdHNcIjtcbmltcG9ydCBNb25lcm9VdGlscyBmcm9tIFwiLi4vY29tbW9uL01vbmVyb1V0aWxzXCI7XG5pbXBvcnQgTW9uZXJvVmVyc2lvbiBmcm9tIFwiLi9tb2RlbC9Nb25lcm9WZXJzaW9uXCI7XG5pbXBvcnQgeyBDaGlsZFByb2Nlc3MgfSBmcm9tIFwiY2hpbGRfcHJvY2Vzc1wiO1xuXG4vKipcbiAqIENvcHlyaWdodCAoYykgd29vZHNlclxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcbiAqIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICogU09GVFdBUkUuXG4gKi9cblxuLyoqXG4gKiBJbXBsZW1lbnRzIGEgTW9uZXJvRGFlbW9uIGFzIGEgY2xpZW50IG9mIG1vbmVyb2QuXG4gKi9cbmNsYXNzIE1vbmVyb0RhZW1vblJwYyBleHRlbmRzIE1vbmVyb0RhZW1vbiB7XG5cbiAgLy8gc3RhdGljIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgc3RhdGljIHJlYWRvbmx5IE1BWF9SRVFfU0laRSA9IFwiMzAwMDAwMFwiO1xuICBwcm90ZWN0ZWQgc3RhdGljIHJlYWRvbmx5IERFRkFVTFRfSUQgPSBcIjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDBcIjsgLy8gdW5pbml0aWFsaXplZCB0eCBvciBibG9jayBoYXNoIGZyb20gZGFlbW9uIHJwY1xuICBwcm90ZWN0ZWQgc3RhdGljIHJlYWRvbmx5IE5VTV9IRUFERVJTX1BFUl9SRVEgPSA3NTA7IC8vIG51bWJlciBvZiBoZWFkZXJzIHRvIGZldGNoIGFuZCBjYWNoZSBwZXIgcmVxdWVzdFxuICBwcm90ZWN0ZWQgc3RhdGljIHJlYWRvbmx5IERFRkFVTFRfUE9MTF9QRVJJT0QgPSAyMDAwMDsgLy8gZGVmYXVsdCBpbnRlcnZhbCBiZXR3ZWVuIHBvbGxpbmcgdGhlIGRhZW1vbiBpbiBtc1xuXG4gIC8vIGluc3RhbmNlIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgY29uZmlnOiBQYXJ0aWFsPE1vbmVyb0RhZW1vbkNvbmZpZz47XG4gIHByb3RlY3RlZCBsaXN0ZW5lcnM6IE1vbmVyb0RhZW1vbkxpc3RlbmVyW107XG4gIHByb3RlY3RlZCBjYWNoZWRIZWFkZXJzOiBhbnk7XG4gIHByb3RlY3RlZCBwcm9jZXNzOiBhbnk7XG4gIHByb3RlY3RlZCBwb2xsTGlzdGVuZXI6IGFueTtcbiAgcHJvdGVjdGVkIHByb3h5RGFlbW9uOiBhbnk7XG4gXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBjb25zdHJ1Y3Rvcihjb25maWc6IE1vbmVyb0RhZW1vbkNvbmZpZywgcHJveHlEYWVtb246IE1vbmVyb0RhZW1vblJwY1Byb3h5KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICB0aGlzLnByb3h5RGFlbW9uID0gcHJveHlEYWVtb247XG4gICAgaWYgKGNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm47XG4gICAgdGhpcy5saXN0ZW5lcnMgPSBbXTsgICAgICAvLyBibG9jayBsaXN0ZW5lcnNcbiAgICB0aGlzLmNhY2hlZEhlYWRlcnMgPSB7fTsgIC8vIGNhY2hlZCBoZWFkZXJzIGZvciBmZXRjaGluZyBibG9ja3MgaW4gYm91bmQgY2h1bmtzXG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGludGVybmFsIHByb2Nlc3MgcnVubmluZyBtb25lcm9kLlxuICAgKiBcbiAgICogQHJldHVybiB7Q2hpbGRQcm9jZXNzfSB0aGUgbm9kZSBwcm9jZXNzIHJ1bm5pbmcgbW9uZXJvZCwgdW5kZWZpbmVkIGlmIG5vdCBjcmVhdGVkIGZyb20gbmV3IHByb2Nlc3NcbiAgICovXG4gIGdldFByb2Nlc3MoKTogQ2hpbGRQcm9jZXNzIHtcbiAgICByZXR1cm4gdGhpcy5wcm9jZXNzO1xuICB9XG4gIFxuICAvKipcbiAgICogU3RvcCB0aGUgaW50ZXJuYWwgcHJvY2VzcyBydW5uaW5nIG1vbmVyb2QsIGlmIGFwcGxpY2FibGUuXG4gICAqIFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtmb3JjZV0gc3BlY2lmaWVzIGlmIHRoZSBwcm9jZXNzIHNob3VsZCBiZSBkZXN0cm95ZWQgZm9yY2libHkgKGRlZmF1bHQgZmFsc2UpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyIHwgdW5kZWZpbmVkPn0gdGhlIGV4aXQgY29kZSBmcm9tIHN0b3BwaW5nIHRoZSBwcm9jZXNzXG4gICAqL1xuICBhc3luYyBzdG9wUHJvY2Vzcyhmb3JjZSA9IGZhbHNlKTogUHJvbWlzZTxudW1iZXIgfCB1bmRlZmluZWQ+IHtcbiAgICBpZiAodGhpcy5wcm9jZXNzID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk1vbmVyb0RhZW1vblJwYyBpbnN0YW5jZSBub3QgY3JlYXRlZCBmcm9tIG5ldyBwcm9jZXNzXCIpO1xuICAgIGxldCBsaXN0ZW5lcnNDb3B5ID0gR2VuVXRpbHMuY29weUFycmF5KGF3YWl0IHRoaXMuZ2V0TGlzdGVuZXJzKCkpO1xuICAgIGZvciAobGV0IGxpc3RlbmVyIG9mIGxpc3RlbmVyc0NvcHkpIGF3YWl0IHRoaXMucmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIHJldHVybiBHZW5VdGlscy5raWxsUHJvY2Vzcyh0aGlzLnByb2Nlc3MsIGZvcmNlID8gXCJTSUdLSUxMXCIgOiB1bmRlZmluZWQpO1xuICB9XG4gIFxuICBhc3luYyBhZGRMaXN0ZW5lcihsaXN0ZW5lcjogTW9uZXJvRGFlbW9uTGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIGFzc2VydChsaXN0ZW5lciBpbnN0YW5jZW9mIE1vbmVyb0RhZW1vbkxpc3RlbmVyLCBcIkxpc3RlbmVyIG11c3QgYmUgaW5zdGFuY2Ugb2YgTW9uZXJvRGFlbW9uTGlzdGVuZXJcIik7XG4gICAgdGhpcy5saXN0ZW5lcnMucHVzaChsaXN0ZW5lcik7XG4gICAgdGhpcy5yZWZyZXNoTGlzdGVuaW5nKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyOiBNb25lcm9EYWVtb25MaXN0ZW5lcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgYXNzZXJ0KGxpc3RlbmVyIGluc3RhbmNlb2YgTW9uZXJvRGFlbW9uTGlzdGVuZXIsIFwiTGlzdGVuZXIgbXVzdCBiZSBpbnN0YW5jZSBvZiBNb25lcm9EYWVtb25MaXN0ZW5lclwiKTtcbiAgICBsZXQgaWR4ID0gdGhpcy5saXN0ZW5lcnMuaW5kZXhPZihsaXN0ZW5lcik7XG4gICAgaWYgKGlkeCA+IC0xKSB0aGlzLmxpc3RlbmVycy5zcGxpY2UoaWR4LCAxKTtcbiAgICBlbHNlIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkxpc3RlbmVyIGlzIG5vdCByZWdpc3RlcmVkIHdpdGggZGFlbW9uXCIpO1xuICAgIHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICB9XG4gIFxuICBnZXRMaXN0ZW5lcnMoKTogTW9uZXJvRGFlbW9uTGlzdGVuZXJbXSB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldExpc3RlbmVycygpO1xuICAgIHJldHVybiB0aGlzLmxpc3RlbmVycztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgZGFlbW9uJ3MgUlBDIGNvbm5lY3Rpb24uXG4gICAqIFxuICAgKiBAcmV0dXJuIHtNb25lcm9ScGNDb25uZWN0aW9ufSB0aGUgZGFlbW9uJ3MgcnBjIGNvbm5lY3Rpb25cbiAgICovXG4gIGFzeW5jIGdldFJwY0Nvbm5lY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFJwY0Nvbm5lY3Rpb24oKTtcbiAgICByZXR1cm4gdGhpcy5jb25maWcuZ2V0U2VydmVyKCk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzQ29ubmVjdGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5pc0Nvbm5lY3RlZCgpO1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCB0aGlzLmdldFZlcnNpb24oKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICBcbiAgYXN5bmMgZ2V0VmVyc2lvbigpOiBQcm9taXNlPE1vbmVyb1ZlcnNpb24+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0VmVyc2lvbigpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X3ZlcnNpb25cIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBuZXcgTW9uZXJvVmVyc2lvbihyZXNwLnJlc3VsdC52ZXJzaW9uLCByZXNwLnJlc3VsdC5yZWxlYXNlKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNUcnVzdGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5pc1RydXN0ZWQoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImdldF9oZWlnaHRcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgcmV0dXJuICFyZXNwLnVudHJ1c3RlZDtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEhlaWdodCgpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2Jsb2NrX2NvdW50XCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gcmVzcC5yZXN1bHQuY291bnQ7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrSGFzaChoZWlnaHQ6IG51bWJlcik6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2NrSGFzaChoZWlnaHQpO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwib25fZ2V0X2Jsb2NrX2hhc2hcIiwgW2hlaWdodF0pKS5yZXN1bHQ7ICAvLyBUT0RPIG1vbmVyby13YWxsZXQtcnBjOiBubyBzdGF0dXMgcmV0dXJuZWRcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tUZW1wbGF0ZSh3YWxsZXRBZGRyZXNzOiBzdHJpbmcsIHJlc2VydmVTaXplPzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9CbG9ja1RlbXBsYXRlPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2NrVGVtcGxhdGUod2FsbGV0QWRkcmVzcywgcmVzZXJ2ZVNpemUpO1xuICAgIGFzc2VydCh3YWxsZXRBZGRyZXNzICYmIHR5cGVvZiB3YWxsZXRBZGRyZXNzID09PSBcInN0cmluZ1wiLCBcIk11c3Qgc3BlY2lmeSB3YWxsZXQgYWRkcmVzcyB0byBiZSBtaW5lZCB0b1wiKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9ibG9ja190ZW1wbGF0ZVwiLCB7d2FsbGV0X2FkZHJlc3M6IHdhbGxldEFkZHJlc3MsIHJlc2VydmVfc2l6ZTogcmVzZXJ2ZVNpemV9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQmxvY2tUZW1wbGF0ZShyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldExhc3RCbG9ja0hlYWRlcigpOiBQcm9taXNlPE1vbmVyb0Jsb2NrSGVhZGVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldExhc3RCbG9ja0hlYWRlcigpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2xhc3RfYmxvY2tfaGVhZGVyXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNCbG9ja0hlYWRlcihyZXNwLnJlc3VsdC5ibG9ja19oZWFkZXIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0hlYWRlckJ5SGFzaChibG9ja0hhc2g6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQmxvY2tIZWFkZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tIZWFkZXJCeUhhc2goYmxvY2tIYXNoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9ibG9ja19oZWFkZXJfYnlfaGFzaFwiLCB7aGFzaDogYmxvY2tIYXNofSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Jsb2NrSGVhZGVyKHJlc3AucmVzdWx0LmJsb2NrX2hlYWRlcik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrSGVhZGVyQnlIZWlnaHQoaGVpZ2h0OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb0Jsb2NrSGVhZGVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2NrSGVhZGVyQnlIZWlnaHQoaGVpZ2h0KTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9ibG9ja19oZWFkZXJfYnlfaGVpZ2h0XCIsIHtoZWlnaHQ6IGhlaWdodH0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNCbG9ja0hlYWRlcihyZXNwLnJlc3VsdC5ibG9ja19oZWFkZXIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0hlYWRlcnNCeVJhbmdlKHN0YXJ0SGVpZ2h0PzogbnVtYmVyLCBlbmRIZWlnaHQ/OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb0Jsb2NrSGVhZGVyW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tIZWFkZXJzQnlSYW5nZShzdGFydEhlaWdodCwgZW5kSGVpZ2h0KTtcbiAgICBcbiAgICAvLyBmZXRjaCBibG9jayBoZWFkZXJzXG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmxvY2tfaGVhZGVyc19yYW5nZVwiLCB7XG4gICAgICBzdGFydF9oZWlnaHQ6IHN0YXJ0SGVpZ2h0LFxuICAgICAgZW5kX2hlaWdodDogZW5kSGVpZ2h0XG4gICAgfSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIFxuICAgIC8vIGJ1aWxkIGhlYWRlcnNcbiAgICBsZXQgaGVhZGVycyA9IFtdO1xuICAgIGZvciAobGV0IHJwY0hlYWRlciBvZiByZXNwLnJlc3VsdC5oZWFkZXJzKSB7XG4gICAgICBoZWFkZXJzLnB1c2goTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNCbG9ja0hlYWRlcihycGNIZWFkZXIpKTtcbiAgICB9XG4gICAgcmV0dXJuIGhlYWRlcnM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrQnlIYXNoKGJsb2NrSGFzaDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9CbG9jaz4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRCbG9ja0J5SGFzaChibG9ja0hhc2gpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X2Jsb2NrXCIsIHtoYXNoOiBibG9ja0hhc2h9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQmxvY2socmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0J5SGVpZ2h0KGhlaWdodDogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9CbG9jaz4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRCbG9ja0J5SGVpZ2h0KGhlaWdodCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfYmxvY2tcIiwge2hlaWdodDogaGVpZ2h0fSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Jsb2NrKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tzQnlIZWlnaHQoaGVpZ2h0czogbnVtYmVyW10pOiBQcm9taXNlPE1vbmVyb0Jsb2NrW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0QmxvY2tzQnlIZWlnaHQoaGVpZ2h0cyk7XG4gICAgXG4gICAgLy8gZmV0Y2ggYmxvY2tzIGluIGJpbmFyeVxuICAgIGxldCByZXNwQmluID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEJpbmFyeVJlcXVlc3QoXCJnZXRfYmxvY2tzX2J5X2hlaWdodC5iaW5cIiwge2hlaWdodHM6IGhlaWdodHN9KTtcbiAgICBcbiAgICAvLyBjb252ZXJ0IGJpbmFyeSBibG9ja3MgdG8ganNvblxuICAgIGxldCBycGNCbG9ja3MgPSBhd2FpdCBNb25lcm9VdGlscy5iaW5hcnlCbG9ja3NUb0pzb24ocmVzcEJpbik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocnBjQmxvY2tzKTtcbiAgICBcbiAgICAvLyBidWlsZCBibG9ja3Mgd2l0aCB0cmFuc2FjdGlvbnNcbiAgICBhc3NlcnQuZXF1YWwocnBjQmxvY2tzLnR4cy5sZW5ndGgsIHJwY0Jsb2Nrcy5ibG9ja3MubGVuZ3RoKTsgICAgXG4gICAgbGV0IGJsb2NrcyA9IFtdO1xuICAgIGZvciAobGV0IGJsb2NrSWR4ID0gMDsgYmxvY2tJZHggPCBycGNCbG9ja3MuYmxvY2tzLmxlbmd0aDsgYmxvY2tJZHgrKykge1xuICAgICAgXG4gICAgICAvLyBidWlsZCBibG9ja1xuICAgICAgbGV0IGJsb2NrID0gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNCbG9jayhycGNCbG9ja3MuYmxvY2tzW2Jsb2NrSWR4XSk7XG4gICAgICBibG9jay5zZXRIZWlnaHQoaGVpZ2h0c1tibG9ja0lkeF0pO1xuICAgICAgYmxvY2tzLnB1c2goYmxvY2spO1xuICAgICAgXG4gICAgICAvLyBidWlsZCB0cmFuc2FjdGlvbnNcbiAgICAgIGxldCB0eHMgPSBbXTtcbiAgICAgIGZvciAobGV0IHR4SWR4ID0gMDsgdHhJZHggPCBycGNCbG9ja3MudHhzW2Jsb2NrSWR4XS5sZW5ndGg7IHR4SWR4KyspIHtcbiAgICAgICAgbGV0IHR4ID0gbmV3IE1vbmVyb1R4KCk7XG4gICAgICAgIHR4cy5wdXNoKHR4KTtcbiAgICAgICAgdHguc2V0SGFzaChycGNCbG9ja3MuYmxvY2tzW2Jsb2NrSWR4XS50eF9oYXNoZXNbdHhJZHhdKTtcbiAgICAgICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICAgICAgdHguc2V0UmVsYXkodHJ1ZSk7XG4gICAgICAgIHR4LnNldElzUmVsYXllZCh0cnVlKTtcbiAgICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgICAgICB0eC5zZXRJc0RvdWJsZVNwZW5kU2VlbihmYWxzZSk7XG4gICAgICAgIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVHgocnBjQmxvY2tzLnR4c1tibG9ja0lkeF1bdHhJZHhdLCB0eCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIG1lcmdlIGludG8gb25lIGJsb2NrXG4gICAgICBibG9jay5zZXRUeHMoW10pO1xuICAgICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICAgIGlmICh0eC5nZXRCbG9jaygpKSBibG9jay5tZXJnZSh0eC5nZXRCbG9jaygpKTtcbiAgICAgICAgZWxzZSBibG9jay5nZXRUeHMoKS5wdXNoKHR4LnNldEJsb2NrKGJsb2NrKSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBibG9ja3M7XG4gIH1cblxuICBhc3luYyBnZXRCbG9ja0hhc2hlcyhcbiAgICBibG9ja0hhc2hlczogc3RyaW5nW10sXG4gICAgc3RhcnRIZWlnaHQ6IG51bWJlclxuICApOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2NrSGFzaGVzKGJsb2NrSGFzaGVzLCBzdGFydEhlaWdodCk7XG5cbiAgICAvLyBzZXJpYWxpemUgYmluYXJ5IHJlcXVlc3RcbiAgICBjb25zdCByZXF1ZXN0ID0gYXdhaXQgTW9uZXJvVXRpbHMuZ2V0SGFzaGVzUmVxdWVzdFRvQmluYXJ5KFxuICAgICAgYmxvY2tIYXNoZXMsXG4gICAgICBzdGFydEhlaWdodFxuICAgICk7XG5cbiAgICAvLyBmZXRjaCBibG9jayBoYXNoZXMgaW4gYmluYXJ5XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kQmluYXJ5UmVxdWVzdChcbiAgICAgIFwiZ2V0X2hhc2hlcy5iaW5cIixcbiAgICAgIHJlcXVlc3RcbiAgICApO1xuXG4gICAgLy8gZGVzZXJpYWxpemUgYmluYXJ5IHJlc3BvbnNlXG4gICAgY29uc3QgZGVjb2RlZCA9IGF3YWl0IE1vbmVyb1V0aWxzLmJpbmFyeUhhc2hlc1RvSnNvbihyZXNwb25zZSk7XG5cbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhkZWNvZGVkKTtcblxuICAgIHJldHVybiBkZWNvZGVkLmhhc2hlcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tzQnlSYW5nZShzdGFydEhlaWdodD86IG51bWJlciwgZW5kSGVpZ2h0PzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9CbG9ja1tdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2Nrc0J5UmFuZ2Uoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCk7XG4gICAgaWYgKHN0YXJ0SGVpZ2h0ID09PSB1bmRlZmluZWQpIHN0YXJ0SGVpZ2h0ID0gMDtcbiAgICBpZiAoZW5kSGVpZ2h0ID09PSB1bmRlZmluZWQpIGVuZEhlaWdodCA9IGF3YWl0IHRoaXMuZ2V0SGVpZ2h0KCkgLSAxO1xuICAgIGxldCBoZWlnaHRzID0gW107XG4gICAgZm9yIChsZXQgaGVpZ2h0ID0gc3RhcnRIZWlnaHQ7IGhlaWdodCA8PSBlbmRIZWlnaHQ7IGhlaWdodCsrKSBoZWlnaHRzLnB1c2goaGVpZ2h0KTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5nZXRCbG9ja3NCeUhlaWdodChoZWlnaHRzKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tzQnlSYW5nZUNodW5rZWQoc3RhcnRIZWlnaHQ/OiBudW1iZXIsIGVuZEhlaWdodD86IG51bWJlciwgbWF4Q2h1bmtTaXplPzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9CbG9ja1tdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEJsb2Nrc0J5UmFuZ2VDaHVua2VkKHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIG1heENodW5rU2l6ZSk7XG4gICAgaWYgKHN0YXJ0SGVpZ2h0ID09PSB1bmRlZmluZWQpIHN0YXJ0SGVpZ2h0ID0gMDtcbiAgICBpZiAoZW5kSGVpZ2h0ID09PSB1bmRlZmluZWQpIGVuZEhlaWdodCA9IGF3YWl0IHRoaXMuZ2V0SGVpZ2h0KCkgLSAxO1xuICAgIGxldCBsYXN0SGVpZ2h0ID0gc3RhcnRIZWlnaHQgLSAxO1xuICAgIGxldCBibG9ja3MgPSBbXTtcbiAgICB3aGlsZSAobGFzdEhlaWdodCA8IGVuZEhlaWdodCkge1xuICAgICAgZm9yIChsZXQgYmxvY2sgb2YgYXdhaXQgdGhpcy5nZXRNYXhCbG9ja3MobGFzdEhlaWdodCArIDEsIGVuZEhlaWdodCwgbWF4Q2h1bmtTaXplKSkge1xuICAgICAgICBibG9ja3MucHVzaChibG9jayk7XG4gICAgICB9XG4gICAgICBsYXN0SGVpZ2h0ID0gYmxvY2tzW2Jsb2Nrcy5sZW5ndGggLSAxXS5nZXRIZWlnaHQoKTtcbiAgICB9XG4gICAgcmV0dXJuIGJsb2NrcztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhzKHR4SGFzaGVzOiBzdHJpbmdbXSwgcHJ1bmUgPSBmYWxzZSk6IFByb21pc2U8TW9uZXJvVHhbXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRUeHModHhIYXNoZXMsIHBydW5lKTtcbiAgICAgICAgXG4gICAgLy8gdmFsaWRhdGUgaW5wdXRcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheSh0eEhhc2hlcykgJiYgdHhIYXNoZXMubGVuZ3RoID4gMCwgXCJNdXN0IHByb3ZpZGUgYW4gYXJyYXkgb2YgdHJhbnNhY3Rpb24gaGFzaGVzXCIpO1xuICAgIGFzc2VydChwcnVuZSA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiBwcnVuZSA9PT0gXCJib29sZWFuXCIsIFwiUHJ1bmUgbXVzdCBiZSBhIGJvb2xlYW4gb3IgdW5kZWZpbmVkXCIpO1xuICAgICAgICBcbiAgICAvLyBmZXRjaCB0cmFuc2FjdGlvbnNcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImdldF90cmFuc2FjdGlvbnNcIiwge1xuICAgICAgdHhzX2hhc2hlczogdHhIYXNoZXMsXG4gICAgICBkZWNvZGVfYXNfanNvbjogdHJ1ZSxcbiAgICAgIHBydW5lOiBwcnVuZVxuICAgIH0pO1xuICAgIHRyeSB7XG4gICAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIGlmIChlLm1lc3NhZ2UuaW5kZXhPZihcIkZhaWxlZCB0byBwYXJzZSBoZXggcmVwcmVzZW50YXRpb24gb2YgdHJhbnNhY3Rpb24gaGFzaFwiKSA+PSAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJJbnZhbGlkIHRyYW5zYWN0aW9uIGhhc2hcIik7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cbiAgICAgICAgXG4gICAgLy8gYnVpbGQgdHJhbnNhY3Rpb24gbW9kZWxzXG4gICAgbGV0IHR4cyA9IFtdO1xuICAgIGlmIChyZXNwLnR4cykge1xuICAgICAgZm9yIChsZXQgdHhJZHggPSAwOyB0eElkeCA8IHJlc3AudHhzLmxlbmd0aDsgdHhJZHgrKykge1xuICAgICAgICBsZXQgdHggPSBuZXcgTW9uZXJvVHgoKTtcbiAgICAgICAgdHguc2V0SXNNaW5lclR4KGZhbHNlKTtcbiAgICAgICAgdHhzLnB1c2goTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNUeChyZXNwLnR4c1t0eElkeF0sIHR4KSk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0eHM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4SGV4ZXModHhIYXNoZXM6IHN0cmluZ1tdLCBwcnVuZSA9IGZhbHNlKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRUeEhleGVzKHR4SGFzaGVzLCBwcnVuZSk7XG4gICAgbGV0IGhleGVzID0gW107XG4gICAgZm9yIChsZXQgdHggb2YgYXdhaXQgdGhpcy5nZXRUeHModHhIYXNoZXMsIHBydW5lKSkge1xuICAgICAgaGV4ZXMucHVzaCh0eC5nZXRQcnVuZWRIZXgoKSA/IHR4LmdldFBydW5lZEhleCgpIDogdHguZ2V0RnVsbEhleCgpKTsgLy8gdHggbWF5IGJlIHBydW5lZCByZWdhcmRsZXNzIG9mIGNvbmZpZ3VyYXRpb25cbiAgICB9XG4gICAgcmV0dXJuIGhleGVzO1xuICB9XG4gIFxuICBhc3luYyBnZXRNaW5lclR4U3VtKGhlaWdodDogbnVtYmVyLCBudW1CbG9ja3M6IG51bWJlcik6IFByb21pc2U8TW9uZXJvTWluZXJUeFN1bT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRNaW5lclR4U3VtKGhlaWdodCwgbnVtQmxvY2tzKTtcbiAgICBpZiAoaGVpZ2h0ID09PSB1bmRlZmluZWQpIGhlaWdodCA9IDA7XG4gICAgZWxzZSBhc3NlcnQoaGVpZ2h0ID49IDAsIFwiSGVpZ2h0IG11c3QgYmUgYW4gaW50ZWdlciA+PSAwXCIpO1xuICAgIGlmIChudW1CbG9ja3MgPT09IHVuZGVmaW5lZCkgbnVtQmxvY2tzID0gYXdhaXQgdGhpcy5nZXRIZWlnaHQoKTtcbiAgICBlbHNlIGFzc2VydChudW1CbG9ja3MgPj0gMCwgXCJDb3VudCBtdXN0IGJlIGFuIGludGVnZXIgPj0gMFwiKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9jb2luYmFzZV90eF9zdW1cIiwge2hlaWdodDogaGVpZ2h0LCBjb3VudDogbnVtQmxvY2tzfSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIGxldCB0eFN1bSA9IG5ldyBNb25lcm9NaW5lclR4U3VtKCk7XG4gICAgdHhTdW0uc2V0RW1pc3Npb25TdW0oQmlnSW50KHJlc3AucmVzdWx0LmVtaXNzaW9uX2Ftb3VudCkpO1xuICAgIHR4U3VtLnNldEZlZVN1bShCaWdJbnQocmVzcC5yZXN1bHQuZmVlX2Ftb3VudCkpO1xuICAgIHJldHVybiB0eFN1bTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RmVlRXN0aW1hdGUoZ3JhY2VCbG9ja3M/OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb0ZlZUVzdGltYXRlPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEZlZUVzdGltYXRlKGdyYWNlQmxvY2tzKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9mZWVfZXN0aW1hdGVcIiwge2dyYWNlX2Jsb2NrczogZ3JhY2VCbG9ja3N9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gICAgbGV0IGZlZUVzdGltYXRlID0gbmV3IE1vbmVyb0ZlZUVzdGltYXRlKCk7XG4gICAgZmVlRXN0aW1hdGUuc2V0RmVlKEJpZ0ludChyZXNwLnJlc3VsdC5mZWUpKTtcbiAgICBmZWVFc3RpbWF0ZS5zZXRRdWFudGl6YXRpb25NYXNrKEJpZ0ludChyZXNwLnJlc3VsdC5xdWFudGl6YXRpb25fbWFzaykpO1xuICAgIGlmIChyZXNwLnJlc3VsdC5mZWVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGxldCBmZWVzID0gW107XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlc3AucmVzdWx0LmZlZXMubGVuZ3RoOyBpKyspIGZlZXMucHVzaChCaWdJbnQocmVzcC5yZXN1bHQuZmVlc1tpXSkpO1xuICAgICAgZmVlRXN0aW1hdGUuc2V0RmVlcyhmZWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIGZlZUVzdGltYXRlO1xuICB9XG4gIFxuICBhc3luYyBzdWJtaXRUeEhleCh0eEhleDogc3RyaW5nLCBkb05vdFJlbGF5OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9TdWJtaXRUeFJlc3VsdD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5zdWJtaXRUeEhleCh0eEhleCwgZG9Ob3RSZWxheSk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJzZW5kX3Jhd190cmFuc2FjdGlvblwiLCB7dHhfYXNfaGV4OiB0eEhleCwgZG9fbm90X3JlbGF5OiBkb05vdFJlbGF5fSk7XG4gICAgbGV0IHJlc3VsdCA9IE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjU3VibWl0VHhSZXN1bHQocmVzcCk7XG4gICAgXG4gICAgLy8gc2V0IGlzR29vZCBiYXNlZCBvbiBzdGF0dXNcbiAgICB0cnkge1xuICAgICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7IFxuICAgICAgcmVzdWx0LnNldElzR29vZCh0cnVlKTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIHJlc3VsdC5zZXRJc0dvb2QoZmFsc2UpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIFxuICBhc3luYyByZWxheVR4c0J5SGFzaCh0eEhhc2hlczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24ucmVsYXlUeHNCeUhhc2godHhIYXNoZXMpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicmVsYXlfdHhcIiwge3R4aWRzOiB0eEhhc2hlc30pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhQb29sKCk6IFByb21pc2U8TW9uZXJvVHhbXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRUeFBvb2woKTtcbiAgICBcbiAgICAvLyBzZW5kIHJwYyByZXF1ZXN0XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJnZXRfdHJhbnNhY3Rpb25fcG9vbFwiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICBcbiAgICAvLyBidWlsZCB0eHNcbiAgICBsZXQgdHhzID0gW107XG4gICAgaWYgKHJlc3AudHJhbnNhY3Rpb25zKSB7XG4gICAgICBmb3IgKGxldCBycGNUeCBvZiByZXNwLnRyYW5zYWN0aW9ucykge1xuICAgICAgICBsZXQgdHggPSBuZXcgTW9uZXJvVHgoKTtcbiAgICAgICAgdHhzLnB1c2godHgpO1xuICAgICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICAgIHR4LnNldElzTWluZXJUeChmYWxzZSk7XG4gICAgICAgIHR4LnNldEluVHhQb29sKHRydWUpO1xuICAgICAgICB0eC5zZXROdW1Db25maXJtYXRpb25zKDApO1xuICAgICAgICBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1R4KHJwY1R4LCB0eCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0eHM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4UG9vbEhhc2hlcygpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICB9XG4gIFxuICAvLyBhc3luYyBnZXRUeFBvb2xCYWNrbG9nKCk6IFByb21pc2U8TW9uZXJvVHhCYWNrbG9nRW50cnlbXT4ge1xuICAvLyAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgLy8gfVxuXG4gIGFzeW5jIGdldFR4UG9vbFN0YXRzKCk6IFByb21pc2U8TW9uZXJvVHhQb29sU3RhdHM+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0VHhQb29sU3RhdHMoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImdldF90cmFuc2FjdGlvbl9wb29sX3N0YXRzXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1R4UG9vbFN0YXRzKHJlc3AucG9vbF9zdGF0cyk7XG4gIH1cbiAgXG4gIGFzeW5jIGZsdXNoVHhQb29sKGhhc2hlcz86IHN0cmluZyB8IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmZsdXNoVHhQb29sKGhhc2hlcyk7XG4gICAgaWYgKGhhc2hlcykgaGFzaGVzID0gR2VuVXRpbHMubGlzdGlmeShoYXNoZXMpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZmx1c2hfdHhwb29sXCIsIHt0eGlkczogaGFzaGVzfSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBnZXRLZXlJbWFnZVNwZW50U3RhdHVzZXMoa2V5SW1hZ2VzOiBzdHJpbmdbXSk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VTcGVudFN0YXR1c1tdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEtleUltYWdlU3BlbnRTdGF0dXNlcyhrZXlJbWFnZXMpO1xuICAgIGlmIChrZXlJbWFnZXMgPT09IHVuZGVmaW5lZCB8fCBrZXlJbWFnZXMubGVuZ3RoID09PSAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUga2V5IGltYWdlcyB0byBjaGVjayB0aGUgc3RhdHVzIG9mXCIpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwiaXNfa2V5X2ltYWdlX3NwZW50XCIsIHtrZXlfaW1hZ2VzOiBrZXlJbWFnZXN9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICByZXR1cm4gcmVzcC5zcGVudF9zdGF0dXM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dEhpc3RvZ3JhbShhbW91bnRzPzogYmlnaW50W10sIG1pbkNvdW50PzogbnVtYmVyLCBtYXhDb3VudD86IG51bWJlciwgaXNVbmxvY2tlZD86IGJvb2xlYW4sIHJlY2VudEN1dG9mZj86IG51bWJlcik6IFByb21pc2U8TW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnlbXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRPdXRwdXRIaXN0b2dyYW0oYW1vdW50cywgbWluQ291bnQsIG1heENvdW50LCBpc1VubG9ja2VkLCByZWNlbnRDdXRvZmYpO1xuICAgIFxuICAgIC8vIHNlbmQgcnBjIHJlcXVlc3RcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9vdXRwdXRfaGlzdG9ncmFtXCIsIHtcbiAgICAgIGFtb3VudHM6IGFtb3VudHMsXG4gICAgICBtaW5fY291bnQ6IG1pbkNvdW50LFxuICAgICAgbWF4X2NvdW50OiBtYXhDb3VudCxcbiAgICAgIHVubG9ja2VkOiBpc1VubG9ja2VkLFxuICAgICAgcmVjZW50X2N1dG9mZjogcmVjZW50Q3V0b2ZmXG4gICAgfSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIFxuICAgIC8vIGJ1aWxkIGhpc3RvZ3JhbSBlbnRyaWVzIGZyb20gcmVzcG9uc2VcbiAgICBsZXQgZW50cmllcyA9IFtdO1xuICAgIGlmICghcmVzcC5yZXN1bHQuaGlzdG9ncmFtKSByZXR1cm4gZW50cmllcztcbiAgICBmb3IgKGxldCBycGNFbnRyeSBvZiByZXNwLnJlc3VsdC5oaXN0b2dyYW0pIHtcbiAgICAgIGVudHJpZXMucHVzaChNb25lcm9EYWVtb25ScGMuY29udmVydFJwY091dHB1dEhpc3RvZ3JhbUVudHJ5KHJwY0VudHJ5KSk7XG4gICAgfVxuICAgIHJldHVybiBlbnRyaWVzO1xuICB9XG4gIFxuICBhc3luYyBnZXRPdXRwdXREaXN0cmlidXRpb24oYW1vdW50cywgY3VtdWxhdGl2ZSwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCkge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRPdXRwdXREaXN0cmlidXRpb24oYW1vdW50cywgY3VtdWxhdGl2ZSwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCk7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkIChyZXNwb25zZSAnZGlzdHJpYnV0aW9uJyBmaWVsZCBpcyBiaW5hcnkpXCIpO1xuICAgIFxuLy8gICAgbGV0IGFtb3VudFN0cnMgPSBbXTtcbi8vICAgIGZvciAobGV0IGFtb3VudCBvZiBhbW91bnRzKSBhbW91bnRTdHJzLnB1c2goYW1vdW50LnRvSlNWYWx1ZSgpKTtcbi8vICAgIGNvbnNvbGUubG9nKGFtb3VudFN0cnMpO1xuLy8gICAgY29uc29sZS5sb2coY3VtdWxhdGl2ZSk7XG4vLyAgICBjb25zb2xlLmxvZyhzdGFydEhlaWdodCk7XG4vLyAgICBjb25zb2xlLmxvZyhlbmRIZWlnaHQpO1xuLy8gICAgXG4vLyAgICAvLyBzZW5kIHJwYyByZXF1ZXN0XG4vLyAgICBjb25zb2xlLmxvZyhcIioqKioqKioqKioqIFNFTkRJTkcgUkVRVUVTVCAqKioqKioqKioqKioqXCIpO1xuLy8gICAgaWYgKHN0YXJ0SGVpZ2h0ID09PSB1bmRlZmluZWQpIHN0YXJ0SGVpZ2h0ID0gMDtcbi8vICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwiZ2V0X291dHB1dF9kaXN0cmlidXRpb25cIiwge1xuLy8gICAgICBhbW91bnRzOiBhbW91bnRTdHJzLFxuLy8gICAgICBjdW11bGF0aXZlOiBjdW11bGF0aXZlLFxuLy8gICAgICBmcm9tX2hlaWdodDogc3RhcnRIZWlnaHQsXG4vLyAgICAgIHRvX2hlaWdodDogZW5kSGVpZ2h0XG4vLyAgICB9KTtcbi8vICAgIFxuLy8gICAgY29uc29sZS5sb2coXCJSRVNQT05TRVwiKTtcbi8vICAgIGNvbnNvbGUubG9nKHJlc3ApO1xuLy8gICAgXG4vLyAgICAvLyBidWlsZCBkaXN0cmlidXRpb24gZW50cmllcyBmcm9tIHJlc3BvbnNlXG4vLyAgICBsZXQgZW50cmllcyA9IFtdO1xuLy8gICAgaWYgKCFyZXNwLnJlc3VsdC5kaXN0cmlidXRpb25zKSByZXR1cm4gZW50cmllczsgXG4vLyAgICBmb3IgKGxldCBycGNFbnRyeSBvZiByZXNwLnJlc3VsdC5kaXN0cmlidXRpb25zKSB7XG4vLyAgICAgIGxldCBlbnRyeSA9IE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjT3V0cHV0RGlzdHJpYnV0aW9uRW50cnkocnBjRW50cnkpO1xuLy8gICAgICBlbnRyaWVzLnB1c2goZW50cnkpO1xuLy8gICAgfVxuLy8gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEluZm8oKTogUHJvbWlzZTxNb25lcm9EYWVtb25JbmZvPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEluZm8oKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9pbmZvXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNJbmZvKHJlc3AucmVzdWx0KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U3luY0luZm8oKTogUHJvbWlzZTxNb25lcm9EYWVtb25TeW5jSW5mbz4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRTeW5jSW5mbygpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic3luY19pbmZvXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNTeW5jSW5mbyhyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhhcmRGb3JrSW5mbygpOiBQcm9taXNlPE1vbmVyb0hhcmRGb3JrSW5mbz4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRIYXJkRm9ya0luZm8oKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImhhcmRfZm9ya19pbmZvXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNIYXJkRm9ya0luZm8ocmVzcC5yZXN1bHQpO1xuICB9XG4gIFxuICBhc3luYyBnZXRBbHRDaGFpbnMoKTogUHJvbWlzZTxNb25lcm9BbHRDaGFpbltdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldEFsdENoYWlucygpO1xuICAgIFxuLy8gICAgLy8gbW9ja2VkIHJlc3BvbnNlIGZvciB0ZXN0XG4vLyAgICBsZXQgcmVzcCA9IHtcbi8vICAgICAgICBzdGF0dXM6IFwiT0tcIixcbi8vICAgICAgICBjaGFpbnM6IFtcbi8vICAgICAgICAgIHtcbi8vICAgICAgICAgICAgYmxvY2tfaGFzaDogXCI2OTdjZjAzYzg5YTliMTE4ZjdiZGYxMWIxYjNhNmEwMjhkN2IzNjE3ZDJkMGVkOTEzMjJjNTcwOWFjZjc1NjI1XCIsXG4vLyAgICAgICAgICAgIGRpZmZpY3VsdHk6IDE0MTE0NzI5NjM4MzAwMjgwLFxuLy8gICAgICAgICAgICBoZWlnaHQ6IDE1NjIwNjIsXG4vLyAgICAgICAgICAgIGxlbmd0aDogMlxuLy8gICAgICAgICAgfVxuLy8gICAgICAgIF1cbi8vICAgIH1cbiAgICBcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9hbHRlcm5hdGVfY2hhaW5zXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICBsZXQgY2hhaW5zID0gW107XG4gICAgaWYgKCFyZXNwLnJlc3VsdC5jaGFpbnMpIHJldHVybiBjaGFpbnM7XG4gICAgZm9yIChsZXQgcnBjQ2hhaW4gb2YgcmVzcC5yZXN1bHQuY2hhaW5zKSBjaGFpbnMucHVzaChNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0FsdENoYWluKHJwY0NoYWluKSk7XG4gICAgcmV0dXJuIGNoYWlucztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWx0QmxvY2tIYXNoZXMoKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRBbHRCbG9ja0hhc2hlcygpO1xuICAgIFxuLy8gICAgLy8gbW9ja2VkIHJlc3BvbnNlIGZvciB0ZXN0XG4vLyAgICBsZXQgcmVzcCA9IHtcbi8vICAgICAgICBzdGF0dXM6IFwiT0tcIixcbi8vICAgICAgICB1bnRydXN0ZWQ6IGZhbHNlLFxuLy8gICAgICAgIGJsa3NfaGFzaGVzOiBbXCI5YzIyNzdjNTQ3MDIzNGJlOGIzMjM4MmNkZjgwOTRhMTAzYWJhNGZjZDVlODc1YTZmYzE1OWRjMmVjMDBlMDExXCIsXCI2MzdjMGUwZjA1NThlMjg0NDkzZjM4YTVmY2NhMzYxNWRiNTk0NThkOTBkM2E1ZWZmMGExOGZmNTliODNmNDZmXCIsXCI2ZjNhZGMxNzRhMmU4MDgyODE5ZWJiOTY1Yzk2YTA5NWUzZThiNjM5MjlhZDliZTJkNzA1YWQ5YzA4NmE2YjFjXCIsXCI2OTdjZjAzYzg5YTliMTE4ZjdiZGYxMWIxYjNhNmEwMjhkN2IzNjE3ZDJkMGVkOTEzMjJjNTcwOWFjZjc1NjI1XCJdXG4vLyAgICB9XG4gICAgXG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJnZXRfYWx0X2Jsb2Nrc19oYXNoZXNcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgaWYgKCFyZXNwLmJsa3NfaGFzaGVzKSByZXR1cm4gW107XG4gICAgcmV0dXJuIHJlc3AuYmxrc19oYXNoZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldERvd25sb2FkTGltaXQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0RG93bmxvYWRMaW1pdCgpO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRCYW5kd2lkdGhMaW1pdHMoKSlbMF07XG4gIH1cbiAgXG4gIGFzeW5jIHNldERvd25sb2FkTGltaXQobGltaXQ6IG51bWJlcik6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnNldERvd25sb2FkTGltaXQobGltaXQpO1xuICAgIGlmIChsaW1pdCA9PSAtMSkgcmV0dXJuIGF3YWl0IHRoaXMucmVzZXREb3dubG9hZExpbWl0KCk7XG4gICAgaWYgKCEoR2VuVXRpbHMuaXNJbnQobGltaXQpICYmIGxpbWl0ID4gMCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkRvd25sb2FkIGxpbWl0IG11c3QgYmUgYW4gaW50ZWdlciBncmVhdGVyIHRoYW4gMFwiKTtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuc2V0QmFuZHdpZHRoTGltaXRzKGxpbWl0LCAwKSlbMF07XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2V0RG93bmxvYWRMaW1pdCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5yZXNldERvd25sb2FkTGltaXQoKTtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuc2V0QmFuZHdpZHRoTGltaXRzKC0xLCAwKSlbMF07XG4gIH1cblxuICBhc3luYyBnZXRVcGxvYWRMaW1pdCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRVcGxvYWRMaW1pdCgpO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRCYW5kd2lkdGhMaW1pdHMoKSlbMV07XG4gIH1cbiAgXG4gIGFzeW5jIHNldFVwbG9hZExpbWl0KGxpbWl0OiBudW1iZXIpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5zZXRVcGxvYWRMaW1pdChsaW1pdCk7XG4gICAgaWYgKGxpbWl0ID09IC0xKSByZXR1cm4gYXdhaXQgdGhpcy5yZXNldFVwbG9hZExpbWl0KCk7XG4gICAgaWYgKCEoR2VuVXRpbHMuaXNJbnQobGltaXQpICYmIGxpbWl0ID4gMCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlVwbG9hZCBsaW1pdCBtdXN0IGJlIGFuIGludGVnZXIgZ3JlYXRlciB0aGFuIDBcIik7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLnNldEJhbmR3aWR0aExpbWl0cygwLCBsaW1pdCkpWzFdO1xuICB9XG4gIFxuICBhc3luYyByZXNldFVwbG9hZExpbWl0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnJlc2V0VXBsb2FkTGltaXQoKTtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuc2V0QmFuZHdpZHRoTGltaXRzKDAsIC0xKSlbMV07XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBlZXJzKCk6IFByb21pc2U8TW9uZXJvUGVlcltdPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmdldFBlZXJzKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kSnNvblJlcXVlc3QoXCJnZXRfY29ubmVjdGlvbnNcIik7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIGxldCBwZWVycyA9IFtdO1xuICAgIGlmICghcmVzcC5yZXN1bHQuY29ubmVjdGlvbnMpIHJldHVybiBwZWVycztcbiAgICBmb3IgKGxldCBycGNDb25uZWN0aW9uIG9mIHJlc3AucmVzdWx0LmNvbm5lY3Rpb25zKSB7XG4gICAgICBwZWVycy5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQ29ubmVjdGlvbihycGNDb25uZWN0aW9uKSk7XG4gICAgfVxuICAgIHJldHVybiBwZWVycztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0S25vd25QZWVycygpOiBQcm9taXNlPE1vbmVyb1BlZXJbXT4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5nZXRLbm93blBlZXJzKCk7XG4gICAgXG4gICAgLy8gdHggY29uZmlnXG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJnZXRfcGVlcl9saXN0XCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIFxuICAgIC8vIGJ1aWxkIHBlZXJzXG4gICAgbGV0IHBlZXJzID0gW107XG4gICAgaWYgKHJlc3AuZ3JheV9saXN0KSB7XG4gICAgICBmb3IgKGxldCBycGNQZWVyIG9mIHJlc3AuZ3JheV9saXN0KSB7XG4gICAgICAgIGxldCBwZWVyID0gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNQZWVyKHJwY1BlZXIpO1xuICAgICAgICBwZWVyLnNldElzT25saW5lKGZhbHNlKTsgLy8gZ3JheSBsaXN0IG1lYW5zIG9mZmxpbmUgbGFzdCBjaGVja2VkXG4gICAgICAgIHBlZXJzLnB1c2gocGVlcik7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChyZXNwLndoaXRlX2xpc3QpIHtcbiAgICAgIGZvciAobGV0IHJwY1BlZXIgb2YgcmVzcC53aGl0ZV9saXN0KSB7XG4gICAgICAgIGxldCBwZWVyID0gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNQZWVyKHJwY1BlZXIpO1xuICAgICAgICBwZWVyLnNldElzT25saW5lKHRydWUpOyAvLyB3aGl0ZSBsaXN0IG1lYW5zIG9ubGluZSBsYXN0IGNoZWNrZWRcbiAgICAgICAgcGVlcnMucHVzaChwZWVyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHBlZXJzO1xuICB9XG4gIFxuICBhc3luYyBzZXRPdXRnb2luZ1BlZXJMaW1pdChsaW1pdDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnNldE91dGdvaW5nUGVlckxpbWl0KGxpbWl0KTtcbiAgICBpZiAoIShHZW5VdGlscy5pc0ludChsaW1pdCkgJiYgbGltaXQgPj0gMCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk91dGdvaW5nIHBlZXIgbGltaXQgbXVzdCBiZSA+PSAwXCIpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwib3V0X3BlZXJzXCIsIHtvdXRfcGVlcnM6IGxpbWl0fSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gIH1cbiAgXG4gIGFzeW5jIHNldEluY29taW5nUGVlckxpbWl0KGxpbWl0OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc2V0SW5jb21pbmdQZWVyTGltaXQobGltaXQpO1xuICAgIGlmICghKEdlblV0aWxzLmlzSW50KGxpbWl0KSAmJiBsaW1pdCA+PSAwKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiSW5jb21pbmcgcGVlciBsaW1pdCBtdXN0IGJlID49IDBcIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJpbl9wZWVyc1wiLCB7aW5fcGVlcnM6IGxpbWl0fSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBlZXJCYW5zKCk6IFByb21pc2U8TW9uZXJvQmFuW10+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0UGVlckJhbnMoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcImdldF9iYW5zXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3AucmVzdWx0KTtcbiAgICBsZXQgYmFucyA9IFtdO1xuICAgIGZvciAobGV0IHJwY0JhbiBvZiByZXNwLnJlc3VsdC5iYW5zKSB7XG4gICAgICBsZXQgYmFuID0gbmV3IE1vbmVyb0JhbigpO1xuICAgICAgYmFuLnNldEhvc3QocnBjQmFuLmhvc3QpO1xuICAgICAgYmFuLnNldElwKHJwY0Jhbi5pcCk7XG4gICAgICBiYW4uc2V0U2Vjb25kcyhycGNCYW4uc2Vjb25kcyk7XG4gICAgICBiYW5zLnB1c2goYmFuKTtcbiAgICB9XG4gICAgcmV0dXJuIGJhbnM7XG4gIH1cbiAgXG4gIGFzeW5jIHNldFBlZXJCYW5zKGJhbnM6IE1vbmVyb0JhbltdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnNldFBlZXJCYW5zKGJhbnMpO1xuICAgIGxldCBycGNCYW5zID0gW107XG4gICAgZm9yIChsZXQgYmFuIG9mIGJhbnMpIHJwY0JhbnMucHVzaChNb25lcm9EYWVtb25ScGMuY29udmVydFRvUnBjQmFuKGJhbikpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwic2V0X2JhbnNcIiwge2JhbnM6IHJwY0JhbnN9KTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0YXJ0TWluaW5nKGFkZHJlc3M6IHN0cmluZywgbnVtVGhyZWFkcz86IG51bWJlciwgaXNCYWNrZ3JvdW5kPzogYm9vbGVhbiwgaWdub3JlQmF0dGVyeT86IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uc3RhcnRNaW5pbmcoYWRkcmVzcywgbnVtVGhyZWFkcywgaXNCYWNrZ3JvdW5kLCBpZ25vcmVCYXR0ZXJ5KTtcbiAgICBhc3NlcnQoYWRkcmVzcywgXCJNdXN0IHByb3ZpZGUgYWRkcmVzcyB0byBtaW5lIHRvXCIpO1xuICAgIGFzc2VydChHZW5VdGlscy5pc0ludChudW1UaHJlYWRzKSAmJiBudW1UaHJlYWRzID4gMCwgXCJOdW1iZXIgb2YgdGhyZWFkcyBtdXN0IGJlIGFuIGludGVnZXIgZ3JlYXRlciB0aGFuIDBcIik7XG4gICAgYXNzZXJ0KGlzQmFja2dyb3VuZCA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiBpc0JhY2tncm91bmQgPT09IFwiYm9vbGVhblwiKTtcbiAgICBhc3NlcnQoaWdub3JlQmF0dGVyeSA9PT0gdW5kZWZpbmVkIHx8IHR5cGVvZiBpZ25vcmVCYXR0ZXJ5ID09PSBcImJvb2xlYW5cIik7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJzdGFydF9taW5pbmdcIiwge1xuICAgICAgbWluZXJfYWRkcmVzczogYWRkcmVzcyxcbiAgICAgIHRocmVhZHNfY291bnQ6IG51bVRocmVhZHMsXG4gICAgICBkb19iYWNrZ3JvdW5kX21pbmluZzogaXNCYWNrZ3JvdW5kLFxuICAgICAgaWdub3JlX2JhdHRlcnk6IGlnbm9yZUJhdHRlcnksXG4gICAgfSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0b3BNaW5pbmcoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnN0b3BNaW5pbmcoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcInN0b3BfbWluaW5nXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICB9XG4gIFxuICBhc3luYyBnZXRNaW5pbmdTdGF0dXMoKTogUHJvbWlzZTxNb25lcm9NaW5pbmdTdGF0dXM+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24uZ2V0TWluaW5nU3RhdHVzKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJtaW5pbmdfc3RhdHVzXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY01pbmluZ1N0YXR1cyhyZXNwKTtcbiAgfVxuICBcbiAgYXN5bmMgc3VibWl0QmxvY2tzKGJsb2NrQmxvYnM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnN1Ym1pdEJsb2NrcyhibG9ja0Jsb2JzKTtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheShibG9ja0Jsb2JzKSAmJiBibG9ja0Jsb2JzLmxlbmd0aCA+IDAsIFwiTXVzdCBwcm92aWRlIGFuIGFycmF5IG9mIG1pbmVkIGJsb2NrIGJsb2JzIHRvIHN1Ym1pdFwiKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRKc29uUmVxdWVzdChcInN1Ym1pdF9ibG9ja1wiLCBibG9ja0Jsb2JzKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwLnJlc3VsdCk7XG4gIH1cblxuICBhc3luYyBwcnVuZUJsb2NrY2hhaW4oY2hlY2s6IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb1BydW5lUmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnBydW5lQmxvY2tjaGFpbigpO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZEpzb25SZXF1ZXN0KFwicHJ1bmVfYmxvY2tjaGFpblwiLCB7Y2hlY2s6IGNoZWNrfSwgMCk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcC5yZXN1bHQpO1xuICAgIGxldCByZXN1bHQgPSBuZXcgTW9uZXJvUHJ1bmVSZXN1bHQoKTtcbiAgICByZXN1bHQuc2V0SXNQcnVuZWQocmVzcC5yZXN1bHQucHJ1bmVkKTtcbiAgICByZXN1bHQuc2V0UHJ1bmluZ1NlZWQocmVzcC5yZXN1bHQucHJ1bmluZ19zZWVkKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIFxuICBhc3luYyBjaGVja0ZvclVwZGF0ZSgpOiBQcm9taXNlPE1vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLmNoZWNrRm9yVXBkYXRlKCk7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCB0aGlzLmNvbmZpZy5nZXRTZXJ2ZXIoKS5zZW5kUGF0aFJlcXVlc3QoXCJ1cGRhdGVcIiwge2NvbW1hbmQ6IFwiY2hlY2tcIn0pO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICAgIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1VwZGF0ZUNoZWNrUmVzdWx0KHJlc3ApO1xuICB9XG4gIFxuICBhc3luYyBkb3dubG9hZFVwZGF0ZShwYXRoPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdD4ge1xuICAgIGlmICh0aGlzLmNvbmZpZy5wcm94eVRvV29ya2VyKSByZXR1cm4gdGhpcy5wcm94eURhZW1vbi5kb3dubG9hZFVwZGF0ZShwYXRoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcInVwZGF0ZVwiLCB7Y29tbWFuZDogXCJkb3dubG9hZFwiLCBwYXRoOiBwYXRofSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVXBkYXRlRG93bmxvYWRSZXN1bHQocmVzcCk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0b3AoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiB0aGlzLnByb3h5RGFlbW9uLnN0b3AoKTtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcInN0b3BfZGFlbW9uXCIpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jaGVja1Jlc3BvbnNlU3RhdHVzKHJlc3ApO1xuICB9XG4gIFxuICBhc3luYyB3YWl0Rm9yTmV4dEJsb2NrSGVhZGVyKCk6IFByb21pc2U8TW9uZXJvQmxvY2tIZWFkZXI+IHtcbiAgICBpZiAodGhpcy5jb25maWcucHJveHlUb1dvcmtlcikgcmV0dXJuIHRoaXMucHJveHlEYWVtb24ud2FpdEZvck5leHRCbG9ja0hlYWRlcigpO1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgZnVuY3Rpb24ocmVzb2x2ZSkge1xuICAgICAgYXdhaXQgdGhhdC5hZGRMaXN0ZW5lcihuZXcgY2xhc3MgZXh0ZW5kcyBNb25lcm9EYWVtb25MaXN0ZW5lciB7XG4gICAgICAgIGFzeW5jIG9uQmxvY2tIZWFkZXIoaGVhZGVyKSB7XG4gICAgICAgICAgYXdhaXQgdGhhdC5yZW1vdmVMaXN0ZW5lcih0aGlzKTtcbiAgICAgICAgICByZXNvbHZlKGhlYWRlcik7XG4gICAgICAgIH1cbiAgICAgIH0pOyBcbiAgICB9KTtcbiAgfVxuXG4gIGdldFBvbGxJbnRlcnZhbCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLmNvbmZpZy5wb2xsSW50ZXJ2YWw7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tIEFERCBKU0RPQyBGT1IgU1VQUE9SVEVEIERFRkFVTFQgSU1QTEVNRU5UQVRJT05TIC0tLS0tLS0tLS0tLS0tXG4gIGFzeW5jIGdldFR4KHR4SGFzaD86IHN0cmluZywgcHJ1bmUgPSBmYWxzZSk6IFByb21pc2U8TW9uZXJvVHh8dW5kZWZpbmVkPiB7IHJldHVybiBzdXBlci5nZXRUeCh0eEhhc2gsIHBydW5lKTsgfTtcbiAgYXN5bmMgZ2V0VHhIZXgodHhIYXNoOiBzdHJpbmcsIHBydW5lID0gZmFsc2UpOiBQcm9taXNlPHN0cmluZz4geyByZXR1cm4gc3VwZXIuZ2V0VHhIZXgodHhIYXNoLCBwcnVuZSk7IH07XG4gIGFzeW5jIGdldEtleUltYWdlU3BlbnRTdGF0dXMoa2V5SW1hZ2U6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VTcGVudFN0YXR1cz4geyByZXR1cm4gc3VwZXIuZ2V0S2V5SW1hZ2VTcGVudFN0YXR1cyhrZXlJbWFnZSk7IH1cbiAgYXN5bmMgc2V0UGVlckJhbihiYW46IE1vbmVyb0Jhbik6IFByb21pc2U8dm9pZD4geyByZXR1cm4gc3VwZXIuc2V0UGVlckJhbihiYW4pOyB9XG4gIGFzeW5jIHN1Ym1pdEJsb2NrKGJsb2NrQmxvYjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7IHJldHVybiBzdXBlci5zdWJtaXRCbG9jayhibG9ja0Jsb2IpOyB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFBSSVZBVEUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByb3RlY3RlZCByZWZyZXNoTGlzdGVuaW5nKCkge1xuICAgIGlmICh0aGlzLnBvbGxMaXN0ZW5lciA9PSB1bmRlZmluZWQgJiYgdGhpcy5saXN0ZW5lcnMubGVuZ3RoKSB0aGlzLnBvbGxMaXN0ZW5lciA9IG5ldyBEYWVtb25Qb2xsZXIodGhpcyk7XG4gICAgaWYgKHRoaXMucG9sbExpc3RlbmVyICE9PSB1bmRlZmluZWQpIHRoaXMucG9sbExpc3RlbmVyLnNldElzUG9sbGluZyh0aGlzLmxpc3RlbmVycy5sZW5ndGggPiAwKTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGdldEJhbmR3aWR0aExpbWl0cygpIHtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IHRoaXMuY29uZmlnLmdldFNlcnZlcigpLnNlbmRQYXRoUmVxdWVzdChcImdldF9saW1pdFwiKTtcbiAgICBNb25lcm9EYWVtb25ScGMuY2hlY2tSZXNwb25zZVN0YXR1cyhyZXNwKTtcbiAgICByZXR1cm4gW3Jlc3AubGltaXRfZG93biwgcmVzcC5saW1pdF91cF07XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBzZXRCYW5kd2lkdGhMaW1pdHMoZG93bkxpbWl0LCB1cExpbWl0KSB7XG4gICAgaWYgKGRvd25MaW1pdCA9PT0gdW5kZWZpbmVkKSBkb3duTGltaXQgPSAwO1xuICAgIGlmICh1cExpbWl0ID09PSB1bmRlZmluZWQpIHVwTGltaXQgPSAwO1xuICAgIGxldCByZXNwID0gYXdhaXQgdGhpcy5jb25maWcuZ2V0U2VydmVyKCkuc2VuZFBhdGhSZXF1ZXN0KFwic2V0X2xpbWl0XCIsIHtsaW1pdF9kb3duOiBkb3duTGltaXQsIGxpbWl0X3VwOiB1cExpbWl0fSk7XG4gICAgTW9uZXJvRGFlbW9uUnBjLmNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCk7XG4gICAgcmV0dXJuIFtyZXNwLmxpbWl0X2Rvd24sIHJlc3AubGltaXRfdXBdO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGEgY29udGlndW91cyBjaHVuayBvZiBibG9ja3Mgc3RhcnRpbmcgZnJvbSBhIGdpdmVuIGhlaWdodCB1cCB0byBhIG1heGltdW1cbiAgICogaGVpZ2h0IG9yIGFtb3VudCBvZiBibG9jayBkYXRhIGZldGNoZWQgZnJvbSB0aGUgYmxvY2tjaGFpbiwgd2hpY2hldmVyIGNvbWVzIGZpcnN0LlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtzdGFydEhlaWdodF0gLSBzdGFydCBoZWlnaHQgdG8gcmV0cmlldmUgYmxvY2tzIChkZWZhdWx0IDApXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbbWF4SGVpZ2h0XSAtIG1heGltdW0gZW5kIGhlaWdodCB0byByZXRyaWV2ZSBibG9ja3MgKGRlZmF1bHQgYmxvY2tjaGFpbiBoZWlnaHQpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbbWF4UmVxU2l6ZV0gLSBtYXhpbXVtIGFtb3VudCBvZiBibG9jayBkYXRhIHRvIGZldGNoIGZyb20gdGhlIGJsb2NrY2hhaW4gaW4gYnl0ZXMgKGRlZmF1bHQgMywwMDAsMDAwIGJ5dGVzKVxuICAgKiBAcmV0dXJuIHtNb25lcm9CbG9ja1tdfSBhcmUgdGhlIHJlc3VsdGluZyBjaHVuayBvZiBibG9ja3NcbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyBnZXRNYXhCbG9ja3Moc3RhcnRIZWlnaHQsIG1heEhlaWdodCwgbWF4UmVxU2l6ZSkge1xuICAgIGlmIChzdGFydEhlaWdodCA9PT0gdW5kZWZpbmVkKSBzdGFydEhlaWdodCA9IDA7XG4gICAgaWYgKG1heEhlaWdodCA9PT0gdW5kZWZpbmVkKSBtYXhIZWlnaHQgPSBhd2FpdCB0aGlzLmdldEhlaWdodCgpIC0gMTtcbiAgICBpZiAobWF4UmVxU2l6ZSA9PT0gdW5kZWZpbmVkKSBtYXhSZXFTaXplID0gTW9uZXJvRGFlbW9uUnBjLk1BWF9SRVFfU0laRTtcbiAgICBcbiAgICAvLyBkZXRlcm1pbmUgZW5kIGhlaWdodCB0byBmZXRjaFxuICAgIGxldCByZXFTaXplID0gMDtcbiAgICBsZXQgZW5kSGVpZ2h0ID0gc3RhcnRIZWlnaHQgLSAxO1xuICAgIHdoaWxlIChyZXFTaXplIDwgbWF4UmVxU2l6ZSAmJiBlbmRIZWlnaHQgPCBtYXhIZWlnaHQpIHtcbiAgICAgIFxuICAgICAgLy8gZ2V0IGhlYWRlciBvZiBuZXh0IGJsb2NrXG4gICAgICBsZXQgaGVhZGVyID0gYXdhaXQgdGhpcy5nZXRCbG9ja0hlYWRlckJ5SGVpZ2h0Q2FjaGVkKGVuZEhlaWdodCArIDEsIG1heEhlaWdodCk7XG4gICAgICBcbiAgICAgIC8vIGJsb2NrIGNhbm5vdCBiZSBiaWdnZXIgdGhhbiBtYXggcmVxdWVzdCBzaXplXG4gICAgICBhc3NlcnQoaGVhZGVyLmdldFNpemUoKSA8PSBtYXhSZXFTaXplLCBcIkJsb2NrIGV4Y2VlZHMgbWF4aW11bSByZXF1ZXN0IHNpemU6IFwiICsgaGVhZGVyLmdldFNpemUoKSk7XG4gICAgICBcbiAgICAgIC8vIGRvbmUgaXRlcmF0aW5nIGlmIGZldGNoaW5nIGJsb2NrIHdvdWxkIGV4Y2VlZCBtYXggcmVxdWVzdCBzaXplXG4gICAgICBpZiAocmVxU2l6ZSArIGhlYWRlci5nZXRTaXplKCkgPiBtYXhSZXFTaXplKSBicmVhaztcbiAgICAgIFxuICAgICAgLy8gb3RoZXJ3aXNlIGJsb2NrIGlzIGluY2x1ZGVkXG4gICAgICByZXFTaXplICs9IGhlYWRlci5nZXRTaXplKCk7XG4gICAgICBlbmRIZWlnaHQrKztcbiAgICB9XG4gICAgcmV0dXJuIGVuZEhlaWdodCA+PSBzdGFydEhlaWdodCA/IGF3YWl0IHRoaXMuZ2V0QmxvY2tzQnlSYW5nZShzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSA6IFtdO1xuICB9XG4gIFxuICAvKipcbiAgICogUmV0cmlldmVzIGEgaGVhZGVyIGJ5IGhlaWdodCBmcm9tIHRoZSBjYWNoZSBvciBmZXRjaGVzIGFuZCBjYWNoZXMgYSBoZWFkZXJcbiAgICogcmFuZ2UgaWYgbm90IGFscmVhZHkgaW4gdGhlIGNhY2hlLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodCAtIGhlaWdodCBvZiB0aGUgaGVhZGVyIHRvIHJldHJpZXZlIGZyb20gdGhlIGNhY2hlXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBtYXhIZWlnaHQgLSBtYXhpbXVtIGhlaWdodCBvZiBoZWFkZXJzIHRvIGNhY2hlXG4gICAqL1xuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0QmxvY2tIZWFkZXJCeUhlaWdodENhY2hlZChoZWlnaHQsIG1heEhlaWdodCkge1xuICAgIFxuICAgIC8vIGdldCBoZWFkZXIgZnJvbSBjYWNoZVxuICAgIGxldCBjYWNoZWRIZWFkZXIgPSB0aGlzLmNhY2hlZEhlYWRlcnNbaGVpZ2h0XTtcbiAgICBpZiAoY2FjaGVkSGVhZGVyKSByZXR1cm4gY2FjaGVkSGVhZGVyO1xuICAgIFxuICAgIC8vIGZldGNoIGFuZCBjYWNoZSBoZWFkZXJzIGlmIG5vdCBpbiBjYWNoZVxuICAgIGxldCBlbmRIZWlnaHQgPSBNYXRoLm1pbihtYXhIZWlnaHQsIGhlaWdodCArIE1vbmVyb0RhZW1vblJwYy5OVU1fSEVBREVSU19QRVJfUkVRIC0gMSk7ICAvLyBUT0RPOiBjb3VsZCBzcGVjaWZ5IGVuZCBoZWlnaHQgdG8gY2FjaGUgdG8gb3B0aW1pemUgc21hbGwgcmVxdWVzdHMgKHdvdWxkIGxpa2UgdG8gaGF2ZSB0aW1lIHByb2ZpbGluZyBpbiBwbGFjZSB0aG91Z2gpXG4gICAgbGV0IGhlYWRlcnMgPSBhd2FpdCB0aGlzLmdldEJsb2NrSGVhZGVyc0J5UmFuZ2UoaGVpZ2h0LCBlbmRIZWlnaHQpO1xuICAgIGZvciAobGV0IGhlYWRlciBvZiBoZWFkZXJzKSB7XG4gICAgICB0aGlzLmNhY2hlZEhlYWRlcnNbaGVhZGVyLmdldEhlaWdodCgpXSA9IGhlYWRlcjtcbiAgICB9XG4gICAgXG4gICAgLy8gcmV0dXJuIHRoZSBjYWNoZWQgaGVhZGVyXG4gICAgcmV0dXJuIHRoaXMuY2FjaGVkSGVhZGVyc1toZWlnaHRdO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU1RBVElDIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHN0YXRpYyBhc3luYyBjb25uZWN0VG9EYWVtb25ScGModXJpT3JDb25maWc6IHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4gfCBQYXJ0aWFsPE1vbmVyb0RhZW1vbkNvbmZpZz4gfCBzdHJpbmdbXSwgdXNlcm5hbWU/OiBzdHJpbmcsIHBhc3N3b3JkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9EYWVtb25ScGM+IHtcbiAgICBsZXQgY29uZmlnID0gTW9uZXJvRGFlbW9uUnBjLm5vcm1hbGl6ZUNvbmZpZyh1cmlPckNvbmZpZywgdXNlcm5hbWUsIHBhc3N3b3JkKTtcbiAgICBpZiAoY29uZmlnLmNtZCkgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5zdGFydE1vbmVyb2RQcm9jZXNzKGNvbmZpZyk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9EYWVtb25ScGMoY29uZmlnLCBjb25maWcucHJveHlUb1dvcmtlciA/IGF3YWl0IE1vbmVyb0RhZW1vblJwY1Byb3h5LmNvbm5lY3QoY29uZmlnKSA6IHVuZGVmaW5lZCk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgc3RhcnRNb25lcm9kUHJvY2Vzcyhjb25maWc6IE1vbmVyb0RhZW1vbkNvbmZpZyk6IFByb21pc2U8TW9uZXJvRGFlbW9uUnBjPiB7XG4gICAgYXNzZXJ0KEdlblV0aWxzLmlzQXJyYXkoY29uZmlnLmNtZCksIFwiTXVzdCBwcm92aWRlIHN0cmluZyBhcnJheSB3aXRoIGNvbW1hbmQgbGluZSBwYXJhbWV0ZXJzXCIpO1xuICAgIFxuICAgIC8vIHN0YXJ0IHByb2Nlc3NcbiAgICBsZXQgY2hpbGRQcm9jZXNzID0gcmVxdWlyZSgnY2hpbGRfcHJvY2VzcycpLnNwYXduKGNvbmZpZy5jbWRbMF0sIGNvbmZpZy5jbWQuc2xpY2UoMSksIHtcbiAgICAgIGVudjogeyAuLi5wcm9jZXNzLmVudiwgTEFORzogJ2VuX1VTLlVURi04JyB9IC8vIHNjcmFwZSBvdXRwdXQgaW4gZW5nbGlzaFxuICAgIH0pO1xuICAgIGNoaWxkUHJvY2Vzcy5zdGRvdXQuc2V0RW5jb2RpbmcoJ3V0ZjgnKTtcbiAgICBjaGlsZFByb2Nlc3Muc3RkZXJyLnNldEVuY29kaW5nKCd1dGY4Jyk7XG4gICAgXG4gICAgLy8gcmV0dXJuIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgYWZ0ZXIgc3RhcnRpbmcgbW9uZXJvZFxuICAgIGxldCB1cmk7XG4gICAgbGV0IG91dHB1dCA9IFwiXCI7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBhd2FpdCBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgc3Rkb3V0XG4gICAgICAgIGNoaWxkUHJvY2Vzcy5zdGRvdXQub24oJ2RhdGEnLCBhc3luYyBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgbGV0IGxpbmUgPSBkYXRhLnRvU3RyaW5nKCk7XG4gICAgICAgICAgTGlicmFyeVV0aWxzLmxvZygyLCBsaW5lKTtcbiAgICAgICAgICBvdXRwdXQgKz0gbGluZSArICdcXG4nOyAvLyBjYXB0dXJlIG91dHB1dCBpbiBjYXNlIG9mIGVycm9yXG4gICAgICAgICAgXG4gICAgICAgICAgLy8gZXh0cmFjdCB1cmkgZnJvbSBlLmcuIFwiSSBCaW5kaW5nIG9uIDEyNy4wLjAuMSAoSVB2NCk6MzgwODVcIlxuICAgICAgICAgIGxldCB1cmlMaW5lQ29udGFpbnMgPSBcIkJpbmRpbmcgb24gXCI7XG4gICAgICAgICAgbGV0IHVyaUxpbmVDb250YWluc0lkeCA9IGxpbmUuaW5kZXhPZih1cmlMaW5lQ29udGFpbnMpO1xuICAgICAgICAgIGlmICh1cmlMaW5lQ29udGFpbnNJZHggPj0gMCkge1xuICAgICAgICAgICAgbGV0IGhvc3QgPSBsaW5lLnN1YnN0cmluZyh1cmlMaW5lQ29udGFpbnNJZHggKyB1cmlMaW5lQ29udGFpbnMubGVuZ3RoLCBsaW5lLmxhc3RJbmRleE9mKCcgJykpO1xuICAgICAgICAgICAgbGV0IHVuZm9ybWF0dGVkTGluZSA9IGxpbmUucmVwbGFjZSgvXFx1MDAxYlxcWy4qP20vZywgJycpLnRyaW0oKTsgLy8gcmVtb3ZlIGNvbG9yIGZvcm1hdHRpbmdcbiAgICAgICAgICAgIGxldCBwb3J0ID0gdW5mb3JtYXR0ZWRMaW5lLnN1YnN0cmluZyh1bmZvcm1hdHRlZExpbmUubGFzdEluZGV4T2YoJzonKSArIDEpO1xuICAgICAgICAgICAgbGV0IHNzbElkeCA9IGNvbmZpZy5jbWQuaW5kZXhPZihcIi0tcnBjLXNzbFwiKTtcbiAgICAgICAgICAgIGxldCBzc2xFbmFibGVkID0gc3NsSWR4ID49IDAgPyBcImVuYWJsZWRcIiA9PSBjb25maWcuY21kW3NzbElkeCArIDFdLnRvTG93ZXJDYXNlKCkgOiBmYWxzZTtcbiAgICAgICAgICAgIHVyaSA9IChzc2xFbmFibGVkID8gXCJodHRwc1wiIDogXCJodHRwXCIpICsgXCI6Ly9cIiArIGhvc3QgKyBcIjpcIiArIHBvcnQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIC8vIHJlYWQgc3VjY2VzcyBtZXNzYWdlXG4gICAgICAgICAgaWYgKGxpbmUuaW5kZXhPZihcImNvcmUgUlBDIHNlcnZlciBzdGFydGVkIG9rXCIpID49IDApIHtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gZ2V0IHVzZXJuYW1lIGFuZCBwYXNzd29yZCBmcm9tIHBhcmFtc1xuICAgICAgICAgICAgbGV0IHVzZXJQYXNzSWR4ID0gY29uZmlnLmNtZC5pbmRleE9mKFwiLS1ycGMtbG9naW5cIik7XG4gICAgICAgICAgICBsZXQgdXNlclBhc3MgPSB1c2VyUGFzc0lkeCA+PSAwID8gY29uZmlnLmNtZFt1c2VyUGFzc0lkeCArIDFdIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgbGV0IHVzZXJuYW1lID0gdXNlclBhc3MgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHVzZXJQYXNzLnN1YnN0cmluZygwLCB1c2VyUGFzcy5pbmRleE9mKCc6JykpO1xuICAgICAgICAgICAgbGV0IHBhc3N3b3JkID0gdXNlclBhc3MgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHVzZXJQYXNzLnN1YnN0cmluZyh1c2VyUGFzcy5pbmRleE9mKCc6JykgKyAxKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gY3JlYXRlIGNsaWVudCBjb25uZWN0ZWQgdG8gaW50ZXJuYWwgcHJvY2Vzc1xuICAgICAgICAgICAgY29uZmlnID0gY29uZmlnLmNvcHkoKS5zZXRTZXJ2ZXIoe3VyaTogdXJpLCB1c2VybmFtZTogdXNlcm5hbWUsIHBhc3N3b3JkOiBwYXNzd29yZCwgcmVqZWN0VW5hdXRob3JpemVkOiBjb25maWcuZ2V0U2VydmVyKCkgPyBjb25maWcuZ2V0U2VydmVyKCkuZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkgOiB1bmRlZmluZWR9KTtcbiAgICAgICAgICAgIGNvbmZpZy5zZXRQcm94eVRvV29ya2VyKGNvbmZpZy5wcm94eVRvV29ya2VyKTtcbiAgICAgICAgICAgIGNvbmZpZy5jbWQgPSB1bmRlZmluZWRcbiAgICAgICAgICAgIGxldCBkYWVtb24gPSBhd2FpdCBNb25lcm9EYWVtb25ScGMuY29ubmVjdFRvRGFlbW9uUnBjKGNvbmZpZyk7XG4gICAgICAgICAgICBkYWVtb24ucHJvY2VzcyA9IGNoaWxkUHJvY2VzcztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gcmVzb2x2ZSBwcm9taXNlIHdpdGggY2xpZW50IGNvbm5lY3RlZCB0byBpbnRlcm5hbCBwcm9jZXNzIFxuICAgICAgICAgICAgdGhpcy5pc1Jlc29sdmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHJlc29sdmUoZGFlbW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gaGFuZGxlIHN0ZGVyclxuICAgICAgICBjaGlsZFByb2Nlc3Muc3RkZXJyLm9uKCdkYXRhJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0TG9nTGV2ZWwoKSA+PSAyKSBjb25zb2xlLmVycm9yKGRhdGEpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIGhhbmRsZSBleGl0XG4gICAgICAgIGNoaWxkUHJvY2Vzcy5vbihcImV4aXRcIiwgZnVuY3Rpb24oY29kZSkge1xuICAgICAgICAgIGlmICghdGhpcy5pc1Jlc29sdmVkKSByZWplY3QobmV3IEVycm9yKFwibW9uZXJvZCBwcm9jZXNzIHRlcm1pbmF0ZWQgd2l0aCBleGl0IGNvZGUgXCIgKyBjb2RlICsgKG91dHB1dCA/IFwiOlxcblxcblwiICsgb3V0cHV0IDogXCJcIikpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyBoYW5kbGUgZXJyb3JcbiAgICAgICAgY2hpbGRQcm9jZXNzLm9uKFwiZXJyb3JcIiwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgaWYgKGVyci5tZXNzYWdlLmluZGV4T2YoXCJFTk9FTlRcIikgPj0gMCkgcmVqZWN0KG5ldyBFcnJvcihcIm1vbmVyb2QgZG9lcyBub3QgZXhpc3QgYXQgcGF0aCAnXCIgKyBjb25maWcuY21kWzBdICsgXCInXCIpKTtcbiAgICAgICAgICBpZiAoIXRoaXMuaXNSZXNvbHZlZCkgcmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gaGFuZGxlIHVuY2F1Z2h0IGV4Y2VwdGlvblxuICAgICAgICBjaGlsZFByb2Nlc3Mub24oXCJ1bmNhdWdodEV4Y2VwdGlvblwiLCBmdW5jdGlvbihlcnIsIG9yaWdpbikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJVbmNhdWdodCBleGNlcHRpb24gaW4gbW9uZXJvZCBwcm9jZXNzOiBcIiArIGVyci5tZXNzYWdlKTtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKG9yaWdpbik7XG4gICAgICAgICAgaWYgKCF0aGlzLmlzUmVzb2x2ZWQpIHJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZXJyLm1lc3NhZ2UpO1xuICAgIH1cbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBub3JtYWxpemVDb25maWcodXJpT3JDb25maWc6IHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4gfCBQYXJ0aWFsPE1vbmVyb0RhZW1vbkNvbmZpZz4gfCBzdHJpbmdbXSwgdXNlcm5hbWU/OiBzdHJpbmcsIHBhc3N3b3JkPzogc3RyaW5nKTogTW9uZXJvRGFlbW9uQ29uZmlnIHtcbiAgICBsZXQgY29uZmlnOiB1bmRlZmluZWQgfCBQYXJ0aWFsPE1vbmVyb0RhZW1vbkNvbmZpZz4gPSB1bmRlZmluZWQ7XG4gICAgaWYgKHR5cGVvZiB1cmlPckNvbmZpZyA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgY29uZmlnID0gbmV3IE1vbmVyb0RhZW1vbkNvbmZpZyh7c2VydmVyOiBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih1cmlPckNvbmZpZyBhcyBzdHJpbmcsIHVzZXJuYW1lLCBwYXNzd29yZCl9KTtcbiAgICB9IGVsc2UgaWYgKCh1cmlPckNvbmZpZyBhcyBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+KS51cmkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uZmlnID0gbmV3IE1vbmVyb0RhZW1vbkNvbmZpZyh7c2VydmVyOiBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih1cmlPckNvbmZpZyBhcyBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+KX0pO1xuXG4gICAgICAvLyB0cmFuc2ZlciB3b3JrZXIgcHJveHkgc2V0dGluZyBmcm9tIHJwYyBjb25uZWN0aW9uIHRvIGRhZW1vbiBjb25maWdcbiAgICAgIGNvbmZpZy5zZXRQcm94eVRvV29ya2VyKCh1cmlPckNvbmZpZyBhcyBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+KS5wcm94eVRvV29ya2VyKTtcbiAgICAgIGNvbmZpZy5nZXRTZXJ2ZXIoKS5zZXRQcm94eVRvV29ya2VyKE1vbmVyb1JwY0Nvbm5lY3Rpb24uREVGQVVMVF9DT05GSUcucHJveHlUb1dvcmtlcik7XG4gICAgfSBlbHNlIGlmIChHZW5VdGlscy5pc0FycmF5KHVyaU9yQ29uZmlnKSkge1xuICAgICAgY29uZmlnID0gbmV3IE1vbmVyb0RhZW1vbkNvbmZpZyh7Y21kOiB1cmlPckNvbmZpZyBhcyBzdHJpbmdbXX0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25maWcgPSBuZXcgTW9uZXJvRGFlbW9uQ29uZmlnKHVyaU9yQ29uZmlnIGFzIFBhcnRpYWw8TW9uZXJvRGFlbW9uQ29uZmlnPik7XG4gICAgfVxuICAgIGlmIChjb25maWcucHJveHlUb1dvcmtlciA9PT0gdW5kZWZpbmVkKSBjb25maWcucHJveHlUb1dvcmtlciA9IHRydWU7XG4gICAgaWYgKGNvbmZpZy5wb2xsSW50ZXJ2YWwgPT09IHVuZGVmaW5lZCkgY29uZmlnLnBvbGxJbnRlcnZhbCA9IE1vbmVyb0RhZW1vblJwYy5ERUZBVUxUX1BPTExfUEVSSU9EO1xuICAgIHJldHVybiBjb25maWcgYXMgTW9uZXJvRGFlbW9uQ29uZmlnO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNoZWNrUmVzcG9uc2VTdGF0dXMocmVzcCkge1xuICAgIGlmIChyZXNwLnN0YXR1cyAhPT0gXCJPS1wiKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IocmVzcC5zdGF0dXMpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNCbG9ja0hlYWRlcihycGNIZWFkZXIpIHtcbiAgICBpZiAoIXJwY0hlYWRlcikgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICBsZXQgaGVhZGVyID0gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY0hlYWRlcikpIHtcbiAgICAgIGxldCB2YWwgPSBycGNIZWFkZXJba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYmxvY2tfc2l6ZVwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldFNpemUsIGhlYWRlci5zZXRTaXplLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRlcHRoXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0RGVwdGgsIGhlYWRlci5zZXREZXB0aCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5XCIpIHsgfSAgLy8gaGFuZGxlZCBieSB3aWRlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjdW11bGF0aXZlX2RpZmZpY3VsdHlcIikgeyB9IC8vIGhhbmRsZWQgYnkgd2lkZV9jdW11bGF0aXZlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5X3RvcDY0XCIpIHsgfSAgLy8gaGFuZGxlZCBieSB3aWRlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjdW11bGF0aXZlX2RpZmZpY3VsdHlfdG9wNjRcIikgeyB9IC8vIGhhbmRsZWQgYnkgd2lkZV9jdW11bGF0aXZlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3aWRlX2RpZmZpY3VsdHlcIikgaGVhZGVyLnNldERpZmZpY3VsdHkoR2VuVXRpbHMucmVjb25jaWxlKGhlYWRlci5nZXREaWZmaWN1bHR5KCksIE1vbmVyb0RhZW1vblJwYy5wcmVmaXhlZEhleFRvQkkodmFsKSkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndpZGVfY3VtdWxhdGl2ZV9kaWZmaWN1bHR5XCIpIGhlYWRlci5zZXRDdW11bGF0aXZlRGlmZmljdWx0eShHZW5VdGlscy5yZWNvbmNpbGUoaGVhZGVyLmdldEN1bXVsYXRpdmVEaWZmaWN1bHR5KCksIE1vbmVyb0RhZW1vblJwYy5wcmVmaXhlZEhleFRvQkkodmFsKSkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhhc2hcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRIYXNoLCBoZWFkZXIuc2V0SGFzaCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJoZWlnaHRcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRIZWlnaHQsIGhlYWRlci5zZXRIZWlnaHQsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibWFqb3JfdmVyc2lvblwiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldE1ham9yVmVyc2lvbiwgaGVhZGVyLnNldE1ham9yVmVyc2lvbiwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtaW5vcl92ZXJzaW9uXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0TWlub3JWZXJzaW9uLCBoZWFkZXIuc2V0TWlub3JWZXJzaW9uLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm5vbmNlXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0Tm9uY2UsIGhlYWRlci5zZXROb25jZSwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJudW1fdHhlc1wiKSBHZW5VdGlscy5zYWZlU2V0KGhlYWRlciwgaGVhZGVyLmdldE51bVR4cywgaGVhZGVyLnNldE51bVR4cywgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJvcnBoYW5fc3RhdHVzXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0T3JwaGFuU3RhdHVzLCBoZWFkZXIuc2V0T3JwaGFuU3RhdHVzLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInByZXZfaGFzaFwiIHx8IGtleSA9PT0gXCJwcmV2X2lkXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0UHJldkhhc2gsIGhlYWRlci5zZXRQcmV2SGFzaCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyZXdhcmRcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRSZXdhcmQsIGhlYWRlci5zZXRSZXdhcmQsIEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0aW1lc3RhbXBcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRUaW1lc3RhbXAsIGhlYWRlci5zZXRUaW1lc3RhbXAsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfd2VpZ2h0XCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0V2VpZ2h0LCBoZWFkZXIuc2V0V2VpZ2h0LCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxvbmdfdGVybV93ZWlnaHRcIikgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRMb25nVGVybVdlaWdodCwgaGVhZGVyLnNldExvbmdUZXJtV2VpZ2h0LCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBvd19oYXNoXCIpIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0UG93SGFzaCwgaGVhZGVyLnNldFBvd0hhc2gsIHZhbCA9PT0gXCJcIiA/IHVuZGVmaW5lZCA6IHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfaGFzaGVzXCIpIHt9ICAvLyB1c2VkIGluIGJsb2NrIG1vZGVsLCBub3QgaGVhZGVyIG1vZGVsXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibWluZXJfdHhcIikge30gICAvLyB1c2VkIGluIGJsb2NrIG1vZGVsLCBub3QgaGVhZGVyIG1vZGVsXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibWluZXJfdHhfaGFzaFwiKSBoZWFkZXIuc2V0TWluZXJUeEhhc2godmFsKTtcbiAgICAgIGVsc2UgY29uc29sZS5sb2coXCJXQVJOSU5HOiBpZ25vcmluZyB1bmV4cGVjdGVkIGJsb2NrIGhlYWRlciBmaWVsZDogJ1wiICsga2V5ICsgXCInOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBoZWFkZXI7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY0Jsb2NrKHJwY0Jsb2NrKSB7XG4gICAgXG4gICAgLy8gYnVpbGQgYmxvY2tcbiAgICBsZXQgYmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNCbG9ja0hlYWRlcihycGNCbG9jay5ibG9ja19oZWFkZXIgPyBycGNCbG9jay5ibG9ja19oZWFkZXIgOiBycGNCbG9jaykgYXMgTW9uZXJvQmxvY2spO1xuICAgIGJsb2NrLnNldEhleChycGNCbG9jay5ibG9iKTtcbiAgICBibG9jay5zZXRUeEhhc2hlcyhycGNCbG9jay50eF9oYXNoZXMgPT09IHVuZGVmaW5lZCA/IFtdIDogcnBjQmxvY2sudHhfaGFzaGVzKTtcbiAgICBcbiAgICAvLyBidWlsZCBtaW5lciB0eFxuICAgIGxldCBycGNNaW5lclR4ID0gcnBjQmxvY2suanNvbiA/IEpTT04ucGFyc2UocnBjQmxvY2suanNvbikubWluZXJfdHggOiBycGNCbG9jay5taW5lcl90eDsgIC8vIG1heSBuZWVkIHRvIGJlIHBhcnNlZCBmcm9tIGpzb25cbiAgICBsZXQgbWluZXJUeCA9IG5ldyBNb25lcm9UeCgpO1xuICAgIGJsb2NrLnNldE1pbmVyVHgobWluZXJUeCk7XG4gICAgbWluZXJUeC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICBtaW5lclR4LnNldEluVHhQb29sKGZhbHNlKVxuICAgIG1pbmVyVHguc2V0SXNNaW5lclR4KHRydWUpO1xuICAgIE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVHgocnBjTWluZXJUeCwgbWluZXJUeCk7XG4gICAgXG4gICAgcmV0dXJuIGJsb2NrO1xuICB9XG4gIFxuICAvKipcbiAgICogVHJhbnNmZXJzIFJQQyB0eCBmaWVsZHMgdG8gYSBnaXZlbiBNb25lcm9UeCB3aXRob3V0IG92ZXJ3cml0aW5nIHByZXZpb3VzIHZhbHVlcy5cbiAgICogXG4gICAqIFRPRE86IHN3aXRjaCBmcm9tIHNhZmUgc2V0XG4gICAqIFxuICAgKiBAcGFyYW0gcnBjVHggLSBSUEMgbWFwIGNvbnRhaW5pbmcgdHJhbnNhY3Rpb24gZmllbGRzXG4gICAqIEBwYXJhbSB0eCAgLSBNb25lcm9UeCB0byBwb3B1bGF0ZSB3aXRoIHZhbHVlcyAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4gdHggLSBzYW1lIHR4IHRoYXQgd2FzIHBhc3NlZCBpbiBvciBhIG5ldyBvbmUgaWYgbm9uZSBnaXZlblxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVHgocnBjVHgsIHR4KSB7XG4gICAgaWYgKHJwY1R4ID09PSB1bmRlZmluZWQpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgaWYgKHR4ID09PSB1bmRlZmluZWQpIHR4ID0gbmV3IE1vbmVyb1R4KCk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSBmcm9tIHJwYyBtYXBcbiAgICBsZXQgaGVhZGVyO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNUeCkpIHtcbiAgICAgIGxldCB2YWwgPSBycGNUeFtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJ0eF9oYXNoXCIgfHwga2V5ID09PSBcImlkX2hhc2hcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SGFzaCwgdHguc2V0SGFzaCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja190aW1lc3RhbXBcIikge1xuICAgICAgICBpZiAoIWhlYWRlcikgaGVhZGVyID0gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKCk7XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQoaGVhZGVyLCBoZWFkZXIuZ2V0VGltZXN0YW1wLCBoZWFkZXIuc2V0VGltZXN0YW1wLCB2YWwpO1xuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX2hlaWdodFwiKSB7XG4gICAgICAgIGlmICghaGVhZGVyKSBoZWFkZXIgPSBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoKTtcbiAgICAgICAgR2VuVXRpbHMuc2FmZVNldChoZWFkZXIsIGhlYWRlci5nZXRIZWlnaHQsIGhlYWRlci5zZXRIZWlnaHQsIHZhbCk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibGFzdF9yZWxheWVkX3RpbWVcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAsIHR4LnNldExhc3RSZWxheWVkVGltZXN0YW1wLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJlY2VpdmVfdGltZVwiIHx8IGtleSA9PT0gXCJyZWNlaXZlZF90aW1lc3RhbXBcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0UmVjZWl2ZWRUaW1lc3RhbXAsIHR4LnNldFJlY2VpdmVkVGltZXN0YW1wLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNvbmZpcm1hdGlvbnNcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0TnVtQ29uZmlybWF0aW9ucywgdHguc2V0TnVtQ29uZmlybWF0aW9ucywgdmFsKTsgXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaW5fcG9vbFwiKSB7XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzQ29uZmlybWVkLCB0eC5zZXRJc0NvbmZpcm1lZCwgIXZhbCk7XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldEluVHhQb29sLCB0eC5zZXRJblR4UG9vbCwgdmFsKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkb3VibGVfc3BlbmRfc2VlblwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc0RvdWJsZVNwZW5kU2VlbiwgdHguc2V0SXNEb3VibGVTcGVuZFNlZW4sIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidmVyc2lvblwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRWZXJzaW9uLCB0eC5zZXRWZXJzaW9uLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImV4dHJhXCIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWwgPT09IFwic3RyaW5nXCIpIGNvbnNvbGUubG9nKFwiV0FSTklORzogZXh0cmEgZmllbGQgYXMgc3RyaW5nIG5vdCBiZWluZyBhc2lnbmVkIHRvIGludFtdOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7IC8vIFRPRE86IGhvdyB0byBzZXQgc3RyaW5nIHRvIGludFtdPyAtIG9yLCBleHRyYSBpcyBzdHJpbmcgd2hpY2ggY2FuIGVuY29kZSBpbnRbXVxuICAgICAgICBlbHNlIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldEV4dHJhLCB0eC5zZXRFeHRyYSwgbmV3IFVpbnQ4QXJyYXkodmFsKSk7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidmluXCIpIHtcbiAgICAgICAgaWYgKHZhbC5sZW5ndGggIT09IDEgfHwgIXZhbFswXS5nZW4pIHsgIC8vIGlnbm9yZSBtaW5lciBpbnB1dCBUT0RPOiB3aHk/XG4gICAgICAgICAgdHguc2V0SW5wdXRzKHZhbC5tYXAocnBjVmluID0+IE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjT3V0cHV0KHJwY1ZpbiwgdHgpKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ2b3V0XCIpIHR4LnNldE91dHB1dHModmFsLm1hcChycGNPdXRwdXQgPT4gTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNPdXRwdXQocnBjT3V0cHV0LCB0eCkpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyY3Rfc2lnbmF0dXJlc1wiKSB7XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFJjdFNpZ25hdHVyZXMsIHR4LnNldFJjdFNpZ25hdHVyZXMsIHZhbCk7XG4gICAgICAgIGlmICh2YWwudHhuRmVlKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRGZWUsIHR4LnNldEZlZSwgQmlnSW50KHZhbC50eG5GZWUpKTtcbiAgICAgIH0gXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmN0c2lnX3BydW5hYmxlXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFJjdFNpZ1BydW5hYmxlLCB0eC5zZXRSY3RTaWdQcnVuYWJsZSwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1bmxvY2tfdGltZVwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRVbmxvY2tUaW1lLCB0eC5zZXRVbmxvY2tUaW1lLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFzX2pzb25cIiB8fCBrZXkgPT09IFwidHhfanNvblwiKSB7IH0gIC8vIGhhbmRsZWQgbGFzdCBzbyB0eCBpcyBhcyBpbml0aWFsaXplZCBhcyBwb3NzaWJsZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImFzX2hleFwiIHx8IGtleSA9PT0gXCJ0eF9ibG9iXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldEZ1bGxIZXgsIHR4LnNldEZ1bGxIZXgsIHZhbCA/IHZhbCA6IHVuZGVmaW5lZCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvYl9zaXplXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFNpemUsIHR4LnNldFNpemUsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2VpZ2h0XCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFdlaWdodCwgdHguc2V0V2VpZ2h0LCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImZlZVwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRGZWUsIHR4LnNldEZlZSwgQmlnSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJlbGF5ZWRcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0SXNSZWxheWVkLCB0eC5zZXRJc1JlbGF5ZWQsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwib3V0cHV0X2luZGljZXNcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0T3V0cHV0SW5kaWNlcywgdHguc2V0T3V0cHV0SW5kaWNlcywgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkb19ub3RfcmVsYXlcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0UmVsYXksIHR4LnNldFJlbGF5LCAhdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJrZXB0X2J5X2Jsb2NrXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzS2VwdEJ5QmxvY2ssIHR4LnNldElzS2VwdEJ5QmxvY2ssIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic2lnbmF0dXJlc1wiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRTaWduYXR1cmVzLCB0eC5zZXRTaWduYXR1cmVzLCB2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxhc3RfZmFpbGVkX2hlaWdodFwiKSB7XG4gICAgICAgIGlmICh2YWwgPT09IDApIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzRmFpbGVkLCB0eC5zZXRJc0ZhaWxlZCwgZmFsc2UpO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc0ZhaWxlZCwgdHguc2V0SXNGYWlsZWQsIHRydWUpO1xuICAgICAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldExhc3RGYWlsZWRIZWlnaHQsIHR4LnNldExhc3RGYWlsZWRIZWlnaHQsIHZhbCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsYXN0X2ZhaWxlZF9pZF9oYXNoXCIpIHtcbiAgICAgICAgaWYgKHZhbCA9PT0gTW9uZXJvRGFlbW9uUnBjLkRFRkFVTFRfSUQpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzRmFpbGVkLCB0eC5zZXRJc0ZhaWxlZCwgZmFsc2UpO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc0ZhaWxlZCwgdHguc2V0SXNGYWlsZWQsIHRydWUpO1xuICAgICAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldExhc3RGYWlsZWRIYXNoLCB0eC5zZXRMYXN0RmFpbGVkSGFzaCwgdmFsKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm1heF91c2VkX2Jsb2NrX2hlaWdodFwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRNYXhVc2VkQmxvY2tIZWlnaHQsIHR4LnNldE1heFVzZWRCbG9ja0hlaWdodCwgdmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJtYXhfdXNlZF9ibG9ja19pZF9oYXNoXCIpIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldE1heFVzZWRCbG9ja0hhc2gsIHR4LnNldE1heFVzZWRCbG9ja0hhc2gsIHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHJ1bmFibGVfaGFzaFwiKSBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRQcnVuYWJsZUhhc2gsIHR4LnNldFBydW5hYmxlSGFzaCwgdmFsID8gdmFsIDogdW5kZWZpbmVkKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwcnVuYWJsZV9hc19oZXhcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0UHJ1bmFibGVIZXgsIHR4LnNldFBydW5hYmxlSGV4LCB2YWwgPyB2YWwgOiB1bmRlZmluZWQpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBydW5lZF9hc19oZXhcIikgR2VuVXRpbHMuc2FmZVNldCh0eCwgdHguZ2V0UHJ1bmVkSGV4LCB0eC5zZXRQcnVuZWRIZXgsIHZhbCA/IHZhbCA6IHVuZGVmaW5lZCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBycGMgdHg6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgXG4gICAgLy8gbGluayBibG9jayBhbmQgdHhcbiAgICBpZiAoaGVhZGVyKSB0eC5zZXRCbG9jayhuZXcgTW9uZXJvQmxvY2soaGVhZGVyKS5zZXRUeHMoW3R4XSkpO1xuICAgIFxuICAgIC8vIFRPRE8gbW9uZXJvZDogdW5jb25maXJtZWQgdHhzIG1pc3JlcG9ydCBibG9jayBoZWlnaHQgYW5kIHRpbWVzdGFtcD9cbiAgICBpZiAodHguZ2V0QmxvY2soKSAmJiB0eC5nZXRCbG9jaygpLmdldEhlaWdodCgpICE9PSB1bmRlZmluZWQgJiYgdHguZ2V0QmxvY2soKS5nZXRIZWlnaHQoKSA9PT0gdHguZ2V0QmxvY2soKS5nZXRUaW1lc3RhbXAoKSkge1xuICAgICAgdHguc2V0QmxvY2sodW5kZWZpbmVkKTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICB9XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSByZW1haW5pbmcga25vd24gZmllbGRzXG4gICAgaWYgKHR4LmdldElzQ29uZmlybWVkKCkpIHtcbiAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldElzUmVsYXllZCwgdHguc2V0SXNSZWxheWVkLCB0cnVlKTtcbiAgICAgIEdlblV0aWxzLnNhZmVTZXQodHgsIHR4LmdldFJlbGF5LCB0eC5zZXRSZWxheSwgdHJ1ZSk7XG4gICAgICBHZW5VdGlscy5zYWZlU2V0KHR4LCB0eC5nZXRJc0ZhaWxlZCwgdHguc2V0SXNGYWlsZWQsIGZhbHNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdHguc2V0TnVtQ29uZmlybWF0aW9ucygwKTtcbiAgICB9XG4gICAgaWYgKHR4LmdldElzRmFpbGVkKCkgPT09IHVuZGVmaW5lZCkgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgIGlmICh0eC5nZXRPdXRwdXRJbmRpY2VzKCkgJiYgdHguZ2V0T3V0cHV0cygpKSAge1xuICAgICAgYXNzZXJ0LmVxdWFsKHR4LmdldE91dHB1dHMoKS5sZW5ndGgsIHR4LmdldE91dHB1dEluZGljZXMoKS5sZW5ndGgpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0eC5nZXRPdXRwdXRzKCkubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdHguZ2V0T3V0cHV0cygpW2ldLnNldEluZGV4KHR4LmdldE91dHB1dEluZGljZXMoKVtpXSk7ICAvLyB0cmFuc2ZlciBvdXRwdXQgaW5kaWNlcyB0byBvdXRwdXRzXG4gICAgICB9XG4gICAgfVxuICAgIGlmIChycGNUeC5hc19qc29uKSBNb25lcm9EYWVtb25ScGMuY29udmVydFJwY1R4KEpTT04ucGFyc2UocnBjVHguYXNfanNvbiksIHR4KTtcbiAgICBpZiAocnBjVHgudHhfanNvbikgTW9uZXJvRGFlbW9uUnBjLmNvbnZlcnRScGNUeChKU09OLnBhcnNlKHJwY1R4LnR4X2pzb24pLCB0eCk7XG4gICAgaWYgKCF0eC5nZXRJc1JlbGF5ZWQoKSkgdHguc2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAodW5kZWZpbmVkKTsgIC8vIFRPRE8gbW9uZXJvZDogcmV0dXJucyBsYXN0X3JlbGF5ZWRfdGltZXN0YW1wIGRlc3BpdGUgcmVsYXllZDogZmFsc2UsIHNlbGYgaW5jb25zaXN0ZW50XG4gICAgXG4gICAgLy8gcmV0dXJuIGJ1aWx0IHRyYW5zYWN0aW9uXG4gICAgcmV0dXJuIHR4O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNPdXRwdXQocnBjT3V0cHV0LCB0eCkge1xuICAgIGxldCBvdXRwdXQgPSBuZXcgTW9uZXJvT3V0cHV0KCk7XG4gICAgb3V0cHV0LnNldFR4KHR4KTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjT3V0cHV0KSkge1xuICAgICAgbGV0IHZhbCA9IHJwY091dHB1dFtrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJnZW5cIikgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiT3V0cHV0IHdpdGggJ2dlbicgZnJvbSBkYWVtb24gcnBjIGlzIG1pbmVyIHR4IHdoaWNoIHdlIGlnbm9yZSAoaS5lLiBlYWNoIG1pbmVyIGlucHV0IGlzIHVuZGVmaW5lZClcIik7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwia2V5XCIpIHtcbiAgICAgICAgR2VuVXRpbHMuc2FmZVNldChvdXRwdXQsIG91dHB1dC5nZXRBbW91bnQsIG91dHB1dC5zZXRBbW91bnQsIEJpZ0ludCh2YWwuYW1vdW50KSk7XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQob3V0cHV0LCBvdXRwdXQuZ2V0S2V5SW1hZ2UsIG91dHB1dC5zZXRLZXlJbWFnZSwgbmV3IE1vbmVyb0tleUltYWdlKHZhbC5rX2ltYWdlKSk7XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQob3V0cHV0LCBvdXRwdXQuZ2V0UmluZ091dHB1dEluZGljZXMsIG91dHB1dC5zZXRSaW5nT3V0cHV0SW5kaWNlcywgdmFsLmtleV9vZmZzZXRzKTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhbW91bnRcIikgR2VuVXRpbHMuc2FmZVNldChvdXRwdXQsIG91dHB1dC5nZXRBbW91bnQsIG91dHB1dC5zZXRBbW91bnQsIEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0YXJnZXRcIikge1xuICAgICAgICBsZXQgcHViS2V5ID0gdmFsLmtleSA9PT0gdW5kZWZpbmVkID8gdmFsLnRhZ2dlZF9rZXkua2V5IDogdmFsLmtleTsgLy8gVE9ETyAobW9uZXJvZCk6IHJwYyBqc29uIHVzZXMge3RhZ2dlZF9rZXk9e2tleT0uLi59fSwgYmluYXJ5IGJsb2NrcyB1c2Uge2tleT0uLi59XG4gICAgICAgIEdlblV0aWxzLnNhZmVTZXQob3V0cHV0LCBvdXRwdXQuZ2V0U3RlYWx0aFB1YmxpY0tleSwgb3V0cHV0LnNldFN0ZWFsdGhQdWJsaWNLZXksIHB1YktleSk7XG4gICAgICB9XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBvdXRwdXQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIG91dHB1dDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjQmxvY2tUZW1wbGF0ZShycGNUZW1wbGF0ZSkge1xuICAgIGxldCB0ZW1wbGF0ZSA9IG5ldyBNb25lcm9CbG9ja1RlbXBsYXRlKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1RlbXBsYXRlKSkge1xuICAgICAgbGV0IHZhbCA9IHJwY1RlbXBsYXRlW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImJsb2NraGFzaGluZ19ibG9iXCIpIHRlbXBsYXRlLnNldEJsb2NrSGFzaGluZ0Jsb2IodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJibG9ja3RlbXBsYXRlX2Jsb2JcIikgdGVtcGxhdGUuc2V0QmxvY2tUZW1wbGF0ZUJsb2IodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJleHBlY3RlZF9yZXdhcmRcIikgdGVtcGxhdGUuc2V0RXhwZWN0ZWRSZXdhcmQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5XCIpIHsgfSAgLy8gaGFuZGxlZCBieSB3aWRlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5X3RvcDY0XCIpIHsgfSAgLy8gaGFuZGxlZCBieSB3aWRlX2RpZmZpY3VsdHlcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ3aWRlX2RpZmZpY3VsdHlcIikgdGVtcGxhdGUuc2V0RGlmZmljdWx0eShHZW5VdGlscy5yZWNvbmNpbGUodGVtcGxhdGUuZ2V0RGlmZmljdWx0eSgpLCBNb25lcm9EYWVtb25ScGMucHJlZml4ZWRIZXhUb0JJKHZhbCkpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJoZWlnaHRcIikgdGVtcGxhdGUuc2V0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicHJldl9oYXNoXCIpIHRlbXBsYXRlLnNldFByZXZIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVzZXJ2ZWRfb2Zmc2V0XCIpIHRlbXBsYXRlLnNldFJlc2VydmVkT2Zmc2V0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3RhdHVzXCIpIHt9ICAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVudHJ1c3RlZFwiKSB7fSAgLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzZWVkX2hlaWdodFwiKSB0ZW1wbGF0ZS5zZXRTZWVkSGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic2VlZF9oYXNoXCIpIHRlbXBsYXRlLnNldFNlZWRIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibmV4dF9zZWVkX2hhc2hcIikgdGVtcGxhdGUuc2V0TmV4dFNlZWRIYXNoKHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBibG9jayB0ZW1wbGF0ZTogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICBpZiAoXCJcIiA9PT0gdGVtcGxhdGUuZ2V0TmV4dFNlZWRIYXNoKCkpIHRlbXBsYXRlLnNldE5leHRTZWVkSGFzaCh1bmRlZmluZWQpO1xuICAgIHJldHVybiB0ZW1wbGF0ZTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjSW5mbyhycGNJbmZvKSB7XG4gICAgaWYgKCFycGNJbmZvKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIGxldCBpbmZvID0gbmV3IE1vbmVyb0RhZW1vbkluZm8oKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjSW5mbykpIHtcbiAgICAgIGxldCB2YWwgPSBycGNJbmZvW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcInZlcnNpb25cIikgaW5mby5zZXRWZXJzaW9uKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYWx0X2Jsb2Nrc19jb3VudFwiKSBpbmZvLnNldE51bUFsdEJsb2Nrcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX3NpemVfbGltaXRcIikgaW5mby5zZXRCbG9ja1NpemVMaW1pdCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX3NpemVfbWVkaWFuXCIpIGluZm8uc2V0QmxvY2tTaXplTWVkaWFuKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfd2VpZ2h0X2xpbWl0XCIpIGluZm8uc2V0QmxvY2tXZWlnaHRMaW1pdCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJsb2NrX3dlaWdodF9tZWRpYW5cIikgaW5mby5zZXRCbG9ja1dlaWdodE1lZGlhbih2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImJvb3RzdHJhcF9kYWVtb25fYWRkcmVzc1wiKSB7IGlmICh2YWwpIGluZm8uc2V0Qm9vdHN0cmFwRGFlbW9uQWRkcmVzcyh2YWwpOyB9XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGlmZmljdWx0eVwiKSB7IH0gIC8vIGhhbmRsZWQgYnkgd2lkZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3VtdWxhdGl2ZV9kaWZmaWN1bHR5XCIpIHsgfSAvLyBoYW5kbGVkIGJ5IHdpZGVfY3VtdWxhdGl2ZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGlmZmljdWx0eV90b3A2NFwiKSB7IH0gIC8vIGhhbmRsZWQgYnkgd2lkZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiY3VtdWxhdGl2ZV9kaWZmaWN1bHR5X3RvcDY0XCIpIHsgfSAvLyBoYW5kbGVkIGJ5IHdpZGVfY3VtdWxhdGl2ZV9kaWZmaWN1bHR5XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2lkZV9kaWZmaWN1bHR5XCIpIGluZm8uc2V0RGlmZmljdWx0eShHZW5VdGlscy5yZWNvbmNpbGUoaW5mby5nZXREaWZmaWN1bHR5KCksIE1vbmVyb0RhZW1vblJwYy5wcmVmaXhlZEhleFRvQkkodmFsKSkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndpZGVfY3VtdWxhdGl2ZV9kaWZmaWN1bHR5XCIpIGluZm8uc2V0Q3VtdWxhdGl2ZURpZmZpY3VsdHkoR2VuVXRpbHMucmVjb25jaWxlKGluZm8uZ2V0Q3VtdWxhdGl2ZURpZmZpY3VsdHkoKSwgTW9uZXJvRGFlbW9uUnBjLnByZWZpeGVkSGV4VG9CSSh2YWwpKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZnJlZV9zcGFjZVwiKSBpbmZvLnNldEZyZWVTcGFjZShCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZGF0YWJhc2Vfc2l6ZVwiKSBpbmZvLnNldERhdGFiYXNlU2l6ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImdyZXlfcGVlcmxpc3Rfc2l6ZVwiKSBpbmZvLnNldE51bU9mZmxpbmVQZWVycyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhlaWdodFwiKSBpbmZvLnNldEhlaWdodCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhlaWdodF93aXRob3V0X2Jvb3RzdHJhcFwiKSBpbmZvLnNldEhlaWdodFdpdGhvdXRCb290c3RyYXAodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJpbmNvbWluZ19jb25uZWN0aW9uc19jb3VudFwiKSBpbmZvLnNldE51bUluY29taW5nQ29ubmVjdGlvbnModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJvZmZsaW5lXCIpIGluZm8uc2V0SXNPZmZsaW5lKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwib3V0Z29pbmdfY29ubmVjdGlvbnNfY291bnRcIikgaW5mby5zZXROdW1PdXRnb2luZ0Nvbm5lY3Rpb25zKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicnBjX2Nvbm5lY3Rpb25zX2NvdW50XCIpIGluZm8uc2V0TnVtUnBjQ29ubmVjdGlvbnModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGFydF90aW1lXCIpIGluZm8uc2V0U3RhcnRUaW1lc3RhbXAodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJhZGp1c3RlZF90aW1lXCIpIGluZm8uc2V0QWRqdXN0ZWRUaW1lc3RhbXAodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGF0dXNcIikge30gIC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidGFyZ2V0XCIpIGluZm8uc2V0VGFyZ2V0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidGFyZ2V0X2hlaWdodFwiKSBpbmZvLnNldFRhcmdldEhlaWdodCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRvcF9ibG9ja19oYXNoXCIpIGluZm8uc2V0VG9wQmxvY2tIYXNoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfY291bnRcIikgaW5mby5zZXROdW1UeHModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eF9wb29sX3NpemVcIikgaW5mby5zZXROdW1UeHNQb29sKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW50cnVzdGVkXCIpIHt9IC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwid2FzX2Jvb3RzdHJhcF9ldmVyX3VzZWRcIikgaW5mby5zZXRXYXNCb290c3RyYXBFdmVyVXNlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndoaXRlX3BlZXJsaXN0X3NpemVcIikgaW5mby5zZXROdW1PbmxpbmVQZWVycyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVwZGF0ZV9hdmFpbGFibGVcIikgaW5mby5zZXRVcGRhdGVBdmFpbGFibGUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJuZXR0eXBlXCIpIEdlblV0aWxzLnNhZmVTZXQoaW5mbywgaW5mby5nZXROZXR3b3JrVHlwZSwgaW5mby5zZXROZXR3b3JrVHlwZSwgTW9uZXJvTmV0d29ya1R5cGUucGFyc2UodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibWFpbm5ldFwiKSB7IGlmICh2YWwpIEdlblV0aWxzLnNhZmVTZXQoaW5mbywgaW5mby5nZXROZXR3b3JrVHlwZSwgaW5mby5zZXROZXR3b3JrVHlwZSwgTW9uZXJvTmV0d29ya1R5cGUuTUFJTk5FVCk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0ZXN0bmV0XCIpIHsgaWYgKHZhbCkgR2VuVXRpbHMuc2FmZVNldChpbmZvLCBpbmZvLmdldE5ldHdvcmtUeXBlLCBpbmZvLnNldE5ldHdvcmtUeXBlLCBNb25lcm9OZXR3b3JrVHlwZS5URVNUTkVUKTsgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YWdlbmV0XCIpIHsgaWYgKHZhbCkgR2VuVXRpbHMuc2FmZVNldChpbmZvLCBpbmZvLmdldE5ldHdvcmtUeXBlLCBpbmZvLnNldE5ldHdvcmtUeXBlLCBNb25lcm9OZXR3b3JrVHlwZS5TVEFHRU5FVCk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjcmVkaXRzXCIpIGluZm8uc2V0Q3JlZGl0cyhCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidG9wX2Jsb2NrX2hhc2hcIiB8fCBrZXkgPT09IFwidG9wX2hhc2hcIikgaW5mby5zZXRUb3BCbG9ja0hhc2goR2VuVXRpbHMucmVjb25jaWxlKGluZm8uZ2V0VG9wQmxvY2tIYXNoKCksIFwiXCIgPT09IHZhbCA/IHVuZGVmaW5lZCA6IHZhbCkpXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYnVzeV9zeW5jaW5nXCIpIGluZm8uc2V0SXNCdXN5U3luY2luZyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN5bmNocm9uaXplZFwiKSBpbmZvLnNldElzU3luY2hyb25pemVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicmVzdHJpY3RlZFwiKSBpbmZvLnNldElzUmVzdHJpY3RlZCh2YWwpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IElnbm9yaW5nIHVuZXhwZWN0ZWQgaW5mbyBmaWVsZDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gaW5mbztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluaXRpYWxpemVzIHN5bmMgaW5mbyBmcm9tIFJQQyBzeW5jIGluZm8uXG4gICAqIFxuICAgKiBAcGFyYW0gcnBjU3luY0luZm8gLSBycGMgbWFwIHRvIGluaXRpYWxpemUgdGhlIHN5bmMgaW5mbyBmcm9tXG4gICAqIEByZXR1cm4ge01vbmVyb0RhZW1vblN5bmNJbmZvfSBpcyBzeW5jIGluZm8gaW5pdGlhbGl6ZWQgZnJvbSB0aGUgbWFwXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNTeW5jSW5mbyhycGNTeW5jSW5mbykge1xuICAgIGxldCBzeW5jSW5mbyA9IG5ldyBNb25lcm9EYWVtb25TeW5jSW5mbygpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNTeW5jSW5mbykpIHtcbiAgICAgIGxldCB2YWwgPSBycGNTeW5jSW5mb1trZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJoZWlnaHRcIikgc3luY0luZm8uc2V0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicGVlcnNcIikge1xuICAgICAgICBzeW5jSW5mby5zZXRQZWVycyhbXSk7XG4gICAgICAgIGxldCBycGNDb25uZWN0aW9ucyA9IHZhbDtcbiAgICAgICAgZm9yIChsZXQgcnBjQ29ubmVjdGlvbiBvZiBycGNDb25uZWN0aW9ucykge1xuICAgICAgICAgIHN5bmNJbmZvLmdldFBlZXJzKCkucHVzaChNb25lcm9EYWVtb25ScGMuY29udmVydFJwY0Nvbm5lY3Rpb24ocnBjQ29ubmVjdGlvbi5pbmZvKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzcGFuc1wiKSB7XG4gICAgICAgIHN5bmNJbmZvLnNldFNwYW5zKFtdKTtcbiAgICAgICAgbGV0IHJwY1NwYW5zID0gdmFsO1xuICAgICAgICBmb3IgKGxldCBycGNTcGFuIG9mIHJwY1NwYW5zKSB7XG4gICAgICAgICAgc3luY0luZm8uZ2V0U3BhbnMoKS5wdXNoKE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjQ29ubmVjdGlvblNwYW4ocnBjU3BhbikpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGtleSA9PT0gXCJzdGF0dXNcIikge30gICAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRhcmdldF9oZWlnaHRcIikgc3luY0luZm8uc2V0VGFyZ2V0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibmV4dF9uZWVkZWRfcHJ1bmluZ19zZWVkXCIpIHN5bmNJbmZvLnNldE5leHROZWVkZWRQcnVuaW5nU2VlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm92ZXJ2aWV3XCIpIHsgIC8vIHRoaXMgcmV0dXJucyBbXSB3aXRob3V0IHBydW5pbmdcbiAgICAgICAgbGV0IG92ZXJ2aWV3O1xuICAgICAgICB0cnkge1xuICAgICAgICAgIG92ZXJ2aWV3ID0gSlNPTi5wYXJzZSh2YWwpO1xuICAgICAgICAgIGlmIChvdmVydmlldyAhPT0gdW5kZWZpbmVkICYmIG92ZXJ2aWV3Lmxlbmd0aCA+IDApIGNvbnNvbGUuZXJyb3IoXCJJZ25vcmluZyBub24tZW1wdHkgJ292ZXJ2aWV3JyBmaWVsZCAobm90IGltcGxlbWVudGVkKTogXCIgKyBvdmVydmlldyk7IC8vIFRPRE9cbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBwYXJzZSAnb3ZlcnZpZXcnIGZpZWxkOiBcIiArIG92ZXJ2aWV3ICsgXCI6IFwiICsgZS5tZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNyZWRpdHNcIikgc3luY0luZm8uc2V0Q3JlZGl0cyhCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidG9wX2hhc2hcIikgc3luY0luZm8uc2V0VG9wQmxvY2tIYXNoKFwiXCIgPT09IHZhbCA/IHVuZGVmaW5lZCA6IHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW50cnVzdGVkXCIpIHt9ICAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gc3luYyBpbmZvOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBzeW5jSW5mbztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjSGFyZEZvcmtJbmZvKHJwY0hhcmRGb3JrSW5mbykge1xuICAgIGxldCBpbmZvID0gbmV3IE1vbmVyb0hhcmRGb3JrSW5mbygpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNIYXJkRm9ya0luZm8pKSB7XG4gICAgICBsZXQgdmFsID0gcnBjSGFyZEZvcmtJbmZvW2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImVhcmxpZXN0X2hlaWdodFwiKSBpbmZvLnNldEVhcmxpZXN0SGVpZ2h0KHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZW5hYmxlZFwiKSBpbmZvLnNldElzRW5hYmxlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInN0YXRlXCIpIGluZm8uc2V0U3RhdGUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGF0dXNcIikge30gICAgIC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW50cnVzdGVkXCIpIHt9ICAvLyBoYW5kbGVkIGVsc2V3aGVyZVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRocmVzaG9sZFwiKSBpbmZvLnNldFRocmVzaG9sZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInZlcnNpb25cIikgaW5mby5zZXRWZXJzaW9uKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidm90ZXNcIikgaW5mby5zZXROdW1Wb3Rlcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInZvdGluZ1wiKSBpbmZvLnNldFZvdGluZyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndpbmRvd1wiKSBpbmZvLnNldFdpbmRvdyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNyZWRpdHNcIikgaW5mby5zZXRDcmVkaXRzKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0b3BfaGFzaFwiKSBpbmZvLnNldFRvcEJsb2NrSGFzaChcIlwiID09PSB2YWwgPyB1bmRlZmluZWQgOiB2YWwpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gaGFyZCBmb3JrIGluZm86IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIGluZm87XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY0Nvbm5lY3Rpb25TcGFuKHJwY0Nvbm5lY3Rpb25TcGFuKSB7XG4gICAgbGV0IHNwYW4gPSBuZXcgTW9uZXJvQ29ubmVjdGlvblNwYW4oKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjQ29ubmVjdGlvblNwYW4pKSB7XG4gICAgICBsZXQgdmFsID0gcnBjQ29ubmVjdGlvblNwYW5ba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiY29ubmVjdGlvbl9pZFwiKSBzcGFuLnNldENvbm5lY3Rpb25JZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm5ibG9ja3NcIikgc3Bhbi5zZXROdW1CbG9ja3ModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJyYXRlXCIpIHNwYW4uc2V0UmF0ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJlbW90ZV9hZGRyZXNzXCIpIHsgaWYgKHZhbCAhPT0gXCJcIikgc3Bhbi5zZXRSZW1vdGVBZGRyZXNzKHZhbCk7IH1cbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzaXplXCIpIHNwYW4uc2V0U2l6ZSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInNwZWVkXCIpIHNwYW4uc2V0U3BlZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGFydF9ibG9ja19oZWlnaHRcIikgc3Bhbi5zZXRTdGFydEhlaWdodCh2YWwpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gZGFlbW9uIGNvbm5lY3Rpb24gc3BhbjogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gc3BhbjtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjT3V0cHV0SGlzdG9ncmFtRW50cnkocnBjRW50cnkpIHtcbiAgICBsZXQgZW50cnkgPSBuZXcgTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkoKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjRW50cnkpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjRW50cnlba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYW1vdW50XCIpIGVudHJ5LnNldEFtb3VudChCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidG90YWxfaW5zdGFuY2VzXCIpIGVudHJ5LnNldE51bUluc3RhbmNlcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInVubG9ja2VkX2luc3RhbmNlc1wiKSBlbnRyeS5zZXROdW1VbmxvY2tlZEluc3RhbmNlcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJlY2VudF9pbnN0YW5jZXNcIikgZW50cnkuc2V0TnVtUmVjZW50SW5zdGFuY2VzKHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBvdXRwdXQgaGlzdG9ncmFtOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuICAgIHJldHVybiBlbnRyeTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjU3VibWl0VHhSZXN1bHQocnBjUmVzdWx0KSB7XG4gICAgYXNzZXJ0KHJwY1Jlc3VsdCk7XG4gICAgbGV0IHJlc3VsdCA9IG5ldyBNb25lcm9TdWJtaXRUeFJlc3VsdCgpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNSZXN1bHQpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjUmVzdWx0W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImRvdWJsZV9zcGVuZFwiKSByZXN1bHQuc2V0SXNEb3VibGVTcGVuZFNlZW4odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJmZWVfdG9vX2xvd1wiKSByZXN1bHQuc2V0SXNGZWVUb29Mb3codmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJpbnZhbGlkX2lucHV0XCIpIHJlc3VsdC5zZXRIYXNJbnZhbGlkSW5wdXQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJpbnZhbGlkX291dHB1dFwiKSByZXN1bHQuc2V0SGFzSW52YWxpZE91dHB1dCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInRvb19mZXdfb3V0cHV0c1wiKSByZXN1bHQuc2V0SGFzVG9vRmV3T3V0cHV0cyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxvd19taXhpblwiKSByZXN1bHQuc2V0SXNNaXhpblRvb0xvdyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm5vdF9yZWxheWVkXCIpIHJlc3VsdC5zZXRJc1JlbGF5ZWQoIXZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwib3ZlcnNwZW5kXCIpIHJlc3VsdC5zZXRJc092ZXJzcGVuZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJlYXNvblwiKSByZXN1bHQuc2V0UmVhc29uKHZhbCA9PT0gXCJcIiA/IHVuZGVmaW5lZCA6IHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidG9vX2JpZ1wiKSByZXN1bHQuc2V0SXNUb29CaWcodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzYW5pdHlfY2hlY2tfZmFpbGVkXCIpIHJlc3VsdC5zZXRTYW5pdHlDaGVja0ZhaWxlZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNyZWRpdHNcIikgcmVzdWx0LnNldENyZWRpdHMoQmlnSW50KHZhbCkpXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3RhdHVzXCIgfHwga2V5ID09PSBcInVudHJ1c3RlZFwiKSB7fSAgLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0b3BfaGFzaFwiKSByZXN1bHQuc2V0VG9wQmxvY2tIYXNoKFwiXCIgPT09IHZhbCA/IHVuZGVmaW5lZCA6IHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidHhfZXh0cmFfdG9vX2JpZ1wiKSByZXN1bHQuc2V0SXNUeEV4dHJhVG9vQmlnKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibm9uemVyb191bmxvY2tfdGltZVwiKSByZXN1bHQuc2V0SXNOb256ZXJvVW5sb2NrVGltZSh2YWwpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gc3VibWl0IHR4IGhleCByZXN1bHQ6IFwiICsga2V5ICsgXCI6IFwiICsgdmFsKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVHhQb29sU3RhdHMocnBjU3RhdHMpIHtcbiAgICBhc3NlcnQocnBjU3RhdHMpO1xuICAgIGxldCBzdGF0cyA9IG5ldyBNb25lcm9UeFBvb2xTdGF0cygpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNTdGF0cykpIHtcbiAgICAgIGxldCB2YWwgPSBycGNTdGF0c1trZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJieXRlc19tYXhcIikgc3RhdHMuc2V0Qnl0ZXNNYXgodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJieXRlc19tZWRcIikgc3RhdHMuc2V0Qnl0ZXNNZWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJieXRlc19taW5cIikgc3RhdHMuc2V0Qnl0ZXNNaW4odmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJieXRlc190b3RhbFwiKSBzdGF0cy5zZXRCeXRlc1RvdGFsKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGlzdG9fOThwY1wiKSBzdGF0cy5zZXRIaXN0bzk4cGModmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJudW1fMTBtXCIpIHN0YXRzLnNldE51bTEwbSh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm51bV9kb3VibGVfc3BlbmRzXCIpIHN0YXRzLnNldE51bURvdWJsZVNwZW5kcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm51bV9mYWlsaW5nXCIpIHN0YXRzLnNldE51bUZhaWxpbmcodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJudW1fbm90X3JlbGF5ZWRcIikgc3RhdHMuc2V0TnVtTm90UmVsYXllZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIm9sZGVzdFwiKSBzdGF0cy5zZXRPbGRlc3RUaW1lc3RhbXAodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ0eHNfdG90YWxcIikgc3RhdHMuc2V0TnVtVHhzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiZmVlX3RvdGFsXCIpIHN0YXRzLnNldEZlZVRvdGFsKEJpZ0ludCh2YWwpKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJoaXN0b1wiKSB7XG4gICAgICAgIHN0YXRzLnNldEhpc3RvKG5ldyBNYXAoKSk7XG4gICAgICAgIGZvciAobGV0IGVsZW0gb2YgdmFsKSBzdGF0cy5nZXRIaXN0bygpLnNldChlbGVtLmJ5dGVzLCBlbGVtLnR4cyk7XG4gICAgICB9XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiB0eCBwb29sIHN0YXRzOiBcIiArIGtleSArIFwiOiBcIiArIHZhbCk7XG4gICAgfVxuXG4gICAgLy8gdW5pbml0aWFsaXplIHNvbWUgc3RhdHMgaWYgbm90IGFwcGxpY2FibGVcbiAgICBpZiAoc3RhdHMuZ2V0SGlzdG85OHBjKCkgPT09IDApIHN0YXRzLnNldEhpc3RvOThwYyh1bmRlZmluZWQpO1xuICAgIGlmIChzdGF0cy5nZXROdW1UeHMoKSA9PT0gMCkge1xuICAgICAgc3RhdHMuc2V0Qnl0ZXNNaW4odW5kZWZpbmVkKTtcbiAgICAgIHN0YXRzLnNldEJ5dGVzTWVkKHVuZGVmaW5lZCk7XG4gICAgICBzdGF0cy5zZXRCeXRlc01heCh1bmRlZmluZWQpO1xuICAgICAgc3RhdHMuc2V0SGlzdG85OHBjKHVuZGVmaW5lZCk7XG4gICAgICBzdGF0cy5zZXRPbGRlc3RUaW1lc3RhbXAodW5kZWZpbmVkKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3RhdHM7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY0FsdENoYWluKHJwY0NoYWluKSB7XG4gICAgYXNzZXJ0KHJwY0NoYWluKTtcbiAgICBsZXQgY2hhaW4gPSBuZXcgTW9uZXJvQWx0Q2hhaW4oKTtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMocnBjQ2hhaW4pKSB7XG4gICAgICBsZXQgdmFsID0gcnBjQ2hhaW5ba2V5XTtcbiAgICAgIGlmIChrZXkgPT09IFwiYmxvY2tfaGFzaFwiKSB7fSAgLy8gdXNpbmcgYmxvY2tfaGFzaGVzIGluc3RlYWRcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJkaWZmaWN1bHR5XCIpIHsgfSAvLyBoYW5kbGVkIGJ5IHdpZGVfZGlmZmljdWx0eVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImRpZmZpY3VsdHlfdG9wNjRcIikgeyB9ICAvLyBoYW5kbGVkIGJ5IHdpZGVfZGlmZmljdWx0eVxuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcIndpZGVfZGlmZmljdWx0eVwiKSBjaGFpbi5zZXREaWZmaWN1bHR5KEdlblV0aWxzLnJlY29uY2lsZShjaGFpbi5nZXREaWZmaWN1bHR5KCksIE1vbmVyb0RhZW1vblJwYy5wcmVmaXhlZEhleFRvQkkodmFsKSkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImhlaWdodFwiKSBjaGFpbi5zZXRIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsZW5ndGhcIikgY2hhaW4uc2V0TGVuZ3RoKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYmxvY2tfaGFzaGVzXCIpIGNoYWluLnNldEJsb2NrSGFzaGVzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibWFpbl9jaGFpbl9wYXJlbnRfYmxvY2tcIikgY2hhaW4uc2V0TWFpbkNoYWluUGFyZW50QmxvY2tIYXNoKHZhbCk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBhbHRlcm5hdGl2ZSBjaGFpbjogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gY2hhaW47XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgY29udmVydFJwY1BlZXIocnBjUGVlcikge1xuICAgIGFzc2VydChycGNQZWVyKTtcbiAgICBsZXQgcGVlciA9IG5ldyBNb25lcm9QZWVyKCk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY1BlZXIpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjUGVlcltrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJob3N0XCIpIHBlZXIuc2V0SG9zdCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImlkXCIpIHBlZXIuc2V0SWQoXCJcIiArIHZhbCk7ICAvLyBUT0RPIG1vbmVyby13YWxsZXQtcnBjOiBwZWVyIGlkIGlzIEJpZ0ludCBidXQgc3RyaW5nIGluIGBnZXRfY29ubmVjdGlvbnNgXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaXBcIikge30gLy8gaG9zdCB1c2VkIGluc3RlYWQgd2hpY2ggaXMgY29uc2lzdGVudGx5IGEgc3RyaW5nXG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibGFzdF9zZWVuXCIpIHBlZXIuc2V0TGFzdFNlZW5UaW1lc3RhbXAodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJwb3J0XCIpIHBlZXIuc2V0UG9ydCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJwY19wb3J0XCIpIHBlZXIuc2V0UnBjUG9ydCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBydW5pbmdfc2VlZFwiKSBwZWVyLnNldFBydW5pbmdTZWVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicnBjX2NyZWRpdHNfcGVyX2hhc2hcIikgcGVlci5zZXRScGNDcmVkaXRzUGVySGFzaChCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBycGMgcGVlcjogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gcGVlcjtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjQ29ubmVjdGlvbihycGNDb25uZWN0aW9uKSB7XG4gICAgbGV0IHBlZXIgPSBuZXcgTW9uZXJvUGVlcigpO1xuICAgIHBlZXIuc2V0SXNPbmxpbmUodHJ1ZSk7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKHJwY0Nvbm5lY3Rpb24pKSB7XG4gICAgICBsZXQgdmFsID0gcnBjQ29ubmVjdGlvbltrZXldO1xuICAgICAgaWYgKGtleSA9PT0gXCJhZGRyZXNzXCIpIHBlZXIuc2V0QWRkcmVzcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImF2Z19kb3dubG9hZFwiKSBwZWVyLnNldEF2Z0Rvd25sb2FkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYXZnX3VwbG9hZFwiKSBwZWVyLnNldEF2Z1VwbG9hZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImNvbm5lY3Rpb25faWRcIikgcGVlci5zZXRJZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImN1cnJlbnRfZG93bmxvYWRcIikgcGVlci5zZXRDdXJyZW50RG93bmxvYWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJjdXJyZW50X3VwbG9hZFwiKSBwZWVyLnNldEN1cnJlbnRVcGxvYWQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJoZWlnaHRcIikgcGVlci5zZXRIZWlnaHQodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJob3N0XCIpIHBlZXIuc2V0SG9zdCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImlwXCIpIHt9IC8vIGhvc3QgdXNlZCBpbnN0ZWFkIHdoaWNoIGlzIGNvbnNpc3RlbnRseSBhIHN0cmluZ1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImluY29taW5nXCIpIHBlZXIuc2V0SXNJbmNvbWluZyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcImxpdmVfdGltZVwiKSBwZWVyLnNldExpdmVUaW1lKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwibG9jYWxfaXBcIikgcGVlci5zZXRJc0xvY2FsSXAodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJsb2NhbGhvc3RcIikgcGVlci5zZXRJc0xvY2FsSG9zdCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBlZXJfaWRcIikgcGVlci5zZXRJZCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBvcnRcIikgcGVlci5zZXRQb3J0KHBhcnNlSW50KHZhbCkpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJwY19wb3J0XCIpIHBlZXIuc2V0UnBjUG9ydCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJlY3ZfY291bnRcIikgcGVlci5zZXROdW1SZWNlaXZlcyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInJlY3ZfaWRsZV90aW1lXCIpIHBlZXIuc2V0UmVjZWl2ZUlkbGVUaW1lKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic2VuZF9jb3VudFwiKSBwZWVyLnNldE51bVNlbmRzKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic2VuZF9pZGxlX3RpbWVcIikgcGVlci5zZXRTZW5kSWRsZVRpbWUodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGF0ZVwiKSBwZWVyLnNldFN0YXRlKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwic3VwcG9ydF9mbGFnc1wiKSBwZWVyLnNldE51bVN1cHBvcnRGbGFncyh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBydW5pbmdfc2VlZFwiKSBwZWVyLnNldFBydW5pbmdTZWVkKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwicnBjX2NyZWRpdHNfcGVyX2hhc2hcIikgcGVlci5zZXRScGNDcmVkaXRzUGVySGFzaChCaWdJbnQodmFsKSk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiYWRkcmVzc190eXBlXCIpIHBlZXIuc2V0VHlwZSh2YWwpO1xuICAgICAgZWxzZSBjb25zb2xlLmxvZyhcIldBUk5JTkc6IGlnbm9yaW5nIHVuZXhwZWN0ZWQgZmllbGQgaW4gcGVlcjogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICByZXR1cm4gcGVlcjtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0VG9ScGNCYW4oYmFuOiBNb25lcm9CYW4pIHtcbiAgICBsZXQgcnBjQmFuOiBhbnkgPSB7fTtcbiAgICBycGNCYW4uaG9zdCA9IGJhbi5nZXRIb3N0KCk7XG4gICAgcnBjQmFuLmlwID0gYmFuLmdldElwKCk7XG4gICAgcnBjQmFuLmJhbiA9IGJhbi5nZXRJc0Jhbm5lZCgpO1xuICAgIHJwY0Jhbi5zZWNvbmRzID0gYmFuLmdldFNlY29uZHMoKTtcbiAgICByZXR1cm4gcnBjQmFuO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNNaW5pbmdTdGF0dXMocnBjU3RhdHVzKSB7XG4gICAgbGV0IHN0YXR1cyA9IG5ldyBNb25lcm9NaW5pbmdTdGF0dXMoKTtcbiAgICBzdGF0dXMuc2V0SXNBY3RpdmUocnBjU3RhdHVzLmFjdGl2ZSk7XG4gICAgc3RhdHVzLnNldFNwZWVkKHJwY1N0YXR1cy5zcGVlZCk7XG4gICAgc3RhdHVzLnNldE51bVRocmVhZHMocnBjU3RhdHVzLnRocmVhZHNfY291bnQpO1xuICAgIGlmIChycGNTdGF0dXMuYWN0aXZlKSB7XG4gICAgICBzdGF0dXMuc2V0QWRkcmVzcyhycGNTdGF0dXMuYWRkcmVzcyk7XG4gICAgICBzdGF0dXMuc2V0SXNCYWNrZ3JvdW5kKHJwY1N0YXR1cy5pc19iYWNrZ3JvdW5kX21pbmluZ19lbmFibGVkKTtcbiAgICB9XG4gICAgcmV0dXJuIHN0YXR1cztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBjb252ZXJ0UnBjVXBkYXRlQ2hlY2tSZXN1bHQocnBjUmVzdWx0KSB7XG4gICAgYXNzZXJ0KHJwY1Jlc3VsdCk7XG4gICAgbGV0IHJlc3VsdCA9IG5ldyBNb25lcm9EYWVtb25VcGRhdGVDaGVja1Jlc3VsdCgpO1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhycGNSZXN1bHQpKSB7XG4gICAgICBsZXQgdmFsID0gcnBjUmVzdWx0W2tleV07XG4gICAgICBpZiAoa2V5ID09PSBcImF1dG9fdXJpXCIpIHJlc3VsdC5zZXRBdXRvVXJpKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwiaGFzaFwiKSByZXN1bHQuc2V0SGFzaCh2YWwpO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSBcInBhdGhcIikge30gLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJzdGF0dXNcIikge30gLy8gaGFuZGxlZCBlbHNld2hlcmVcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ1cGRhdGVcIikgcmVzdWx0LnNldElzVXBkYXRlQXZhaWxhYmxlKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidXNlcl91cmlcIikgcmVzdWx0LnNldFVzZXJVcmkodmFsKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gXCJ2ZXJzaW9uXCIpIHJlc3VsdC5zZXRWZXJzaW9uKHZhbCk7XG4gICAgICBlbHNlIGlmIChrZXkgPT09IFwidW50cnVzdGVkXCIpIHt9IC8vIGhhbmRsZWQgZWxzZXdoZXJlXG4gICAgICBlbHNlIGNvbnNvbGUubG9nKFwiV0FSTklORzogaWdub3JpbmcgdW5leHBlY3RlZCBmaWVsZCBpbiBycGMgY2hlY2sgdXBkYXRlIHJlc3VsdDogXCIgKyBrZXkgKyBcIjogXCIgKyB2YWwpO1xuICAgIH1cbiAgICBpZiAocmVzdWx0LmdldEF1dG9VcmkoKSA9PT0gXCJcIikgcmVzdWx0LnNldEF1dG9VcmkodW5kZWZpbmVkKTtcbiAgICBpZiAocmVzdWx0LmdldFVzZXJVcmkoKSA9PT0gXCJcIikgcmVzdWx0LnNldFVzZXJVcmkodW5kZWZpbmVkKTtcbiAgICBpZiAocmVzdWx0LmdldFZlcnNpb24oKSA9PT0gXCJcIikgcmVzdWx0LnNldFZlcnNpb24odW5kZWZpbmVkKTtcbiAgICBpZiAocmVzdWx0LmdldEhhc2goKSA9PT0gXCJcIikgcmVzdWx0LnNldEhhc2godW5kZWZpbmVkKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGNvbnZlcnRScGNVcGRhdGVEb3dubG9hZFJlc3VsdChycGNSZXN1bHQpIHtcbiAgICBsZXQgcmVzdWx0ID0gbmV3IE1vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0KE1vbmVyb0RhZW1vblJwYy5jb252ZXJ0UnBjVXBkYXRlQ2hlY2tSZXN1bHQocnBjUmVzdWx0KSBhcyBNb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdCk7XG4gICAgcmVzdWx0LnNldERvd25sb2FkUGF0aChycGNSZXN1bHRbXCJwYXRoXCJdKTtcbiAgICBpZiAocmVzdWx0LmdldERvd25sb2FkUGF0aCgpID09PSBcIlwiKSByZXN1bHQuc2V0RG93bmxvYWRQYXRoKHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBhICcweCcgcHJlZml4ZWQgaGV4aWRlY2ltYWwgc3RyaW5nIHRvIGEgYmlnaW50LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGhleCBpcyB0aGUgJzB4JyBwcmVmaXhlZCBoZXhpZGVjaW1hbCBzdHJpbmcgdG8gY29udmVydFxuICAgKiBAcmV0dXJuIHtiaWdpbnR9IHRoZSBoZXhpY2VkaW1hbCBjb252ZXJ0ZWQgdG8gZGVjaW1hbFxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBwcmVmaXhlZEhleFRvQkkoaGV4KSB7XG4gICAgYXNzZXJ0KGhleC5zdWJzdHJpbmcoMCwgMikgPT09IFwiMHhcIik7XG4gICAgcmV0dXJuIEJpZ0ludChoZXgpO1xuICB9XG59XG5cbi8qKlxuICogSW1wbGVtZW50cyBhIE1vbmVyb0RhZW1vbiBieSBwcm94eWluZyByZXF1ZXN0cyB0byBhIHdvcmtlci5cbiAqIFxuICogQHByaXZhdGVcbiAqL1xuY2xhc3MgTW9uZXJvRGFlbW9uUnBjUHJveHkge1xuXG4gIC8vIHN0YXRlIHZhcmlhYmxlc1xuICBwcml2YXRlIGRhZW1vbklkOiBhbnk7XG4gIHByaXZhdGUgd29ya2VyOiBhbnk7XG4gIHByaXZhdGUgd3JhcHBlZExpc3RlbmVyczogYW55O1xuICBwcml2YXRlIHByb2Nlc3M6IGFueTtcblxuICBjb25zdHJ1Y3RvcihkYWVtb25JZCwgd29ya2VyKSB7XG4gICAgdGhpcy5kYWVtb25JZCA9IGRhZW1vbklkO1xuICAgIHRoaXMud29ya2VyID0gd29ya2VyO1xuICAgIHRoaXMud3JhcHBlZExpc3RlbmVycyA9IFtdO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU1RBVElDIFVUSUxJVElFUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgc3RhdGljIGFzeW5jIGNvbm5lY3QoY29uZmlnOiBNb25lcm9EYWVtb25Db25maWcpIHtcbiAgICBsZXQgZGFlbW9uSWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgY29uZmlnID0gT2JqZWN0LmFzc2lnbih7fSwgY29uZmlnLnRvSnNvbigpLCB7cHJveHlUb1dvcmtlcjogZmFsc2V9KTtcbiAgICBhd2FpdCBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKGRhZW1vbklkLCBcImNvbm5lY3REYWVtb25ScGNcIiwgW2NvbmZpZ10pO1xuICAgIHJldHVybiBuZXcgTW9uZXJvRGFlbW9uUnBjUHJveHkoZGFlbW9uSWQsIGF3YWl0IExpYnJhcnlVdGlscy5nZXRXb3JrZXIoKSk7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gSU5TVEFOQ0UgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICBhc3luYyBhZGRMaXN0ZW5lcihsaXN0ZW5lcikge1xuICAgIGxldCB3cmFwcGVkTGlzdGVuZXIgPSBuZXcgRGFlbW9uV29ya2VyTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIGxldCBsaXN0ZW5lcklkID0gd3JhcHBlZExpc3RlbmVyLmdldElkKCk7XG4gICAgTGlicmFyeVV0aWxzLmFkZFdvcmtlckNhbGxiYWNrKHRoaXMuZGFlbW9uSWQsIFwib25CbG9ja0hlYWRlcl9cIiArIGxpc3RlbmVySWQsIFt3cmFwcGVkTGlzdGVuZXIub25CbG9ja0hlYWRlciwgd3JhcHBlZExpc3RlbmVyXSk7XG4gICAgdGhpcy53cmFwcGVkTGlzdGVuZXJzLnB1c2god3JhcHBlZExpc3RlbmVyKTtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25BZGRMaXN0ZW5lclwiLCBbbGlzdGVuZXJJZF0pO1xuICB9XG4gIFxuICBhc3luYyByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcikge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53cmFwcGVkTGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodGhpcy53cmFwcGVkTGlzdGVuZXJzW2ldLmdldExpc3RlbmVyKCkgPT09IGxpc3RlbmVyKSB7XG4gICAgICAgIGxldCBsaXN0ZW5lcklkID0gdGhpcy53cmFwcGVkTGlzdGVuZXJzW2ldLmdldElkKCk7XG4gICAgICAgIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uUmVtb3ZlTGlzdGVuZXJcIiwgW2xpc3RlbmVySWRdKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnJlbW92ZVdvcmtlckNhbGxiYWNrKHRoaXMuZGFlbW9uSWQsIFwib25CbG9ja0hlYWRlcl9cIiArIGxpc3RlbmVySWQpO1xuICAgICAgICB0aGlzLndyYXBwZWRMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkxpc3RlbmVyIGlzIG5vdCByZWdpc3RlcmVkIHdpdGggZGFlbW9uXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRMaXN0ZW5lcnMoKSB7XG4gICAgbGV0IGxpc3RlbmVycyA9IFtdO1xuICAgIGZvciAobGV0IHdyYXBwZWRMaXN0ZW5lciBvZiB0aGlzLndyYXBwZWRMaXN0ZW5lcnMpIGxpc3RlbmVycy5wdXNoKHdyYXBwZWRMaXN0ZW5lci5nZXRMaXN0ZW5lcigpKTtcbiAgICByZXR1cm4gbGlzdGVuZXJzO1xuICB9XG4gIFxuICBhc3luYyBnZXRScGNDb25uZWN0aW9uKCkge1xuICAgIGxldCBjb25maWcgPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFJwY0Nvbm5lY3Rpb25cIik7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKGNvbmZpZyBhcyBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+KTtcbiAgfVxuICBcbiAgYXN5bmMgaXNDb25uZWN0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uSXNDb25uZWN0ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFZlcnNpb24oKSB7XG4gICAgbGV0IHZlcnNpb25Kc29uOiBhbnkgPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFZlcnNpb25cIik7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9WZXJzaW9uKHZlcnNpb25Kc29uLm51bWJlciwgdmVyc2lvbkpzb24uaXNSZWxlYXNlKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNUcnVzdGVkKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbklzVHJ1c3RlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEhlaWdodFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tIYXNoKGhlaWdodCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2NrSGFzaFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja1RlbXBsYXRlKHdhbGxldEFkZHJlc3MsIHJlc2VydmVTaXplKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9CbG9ja1RlbXBsYXRlKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tUZW1wbGF0ZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TGFzdEJsb2NrSGVhZGVyKCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRMYXN0QmxvY2tIZWFkZXJcIikpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0hlYWRlckJ5SGFzaChibG9ja0hhc2gpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0Jsb2NrSGVhZGVyKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tIZWFkZXJCeUhhc2hcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrSGVhZGVyQnlIZWlnaHQoaGVpZ2h0KSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9CbG9ja0hlYWRlcihhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2NrSGVhZGVyQnlIZWlnaHRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrSGVhZGVyc0J5UmFuZ2Uoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCkge1xuICAgIGxldCBibG9ja0hlYWRlcnNKc29uOiBhbnlbXSA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tIZWFkZXJzQnlSYW5nZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpIGFzIGFueVtdO1xuICAgIGxldCBoZWFkZXJzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2tIZWFkZXJKc29uIG9mIGJsb2NrSGVhZGVyc0pzb24pIGhlYWRlcnMucHVzaChuZXcgTW9uZXJvQmxvY2tIZWFkZXIoYmxvY2tIZWFkZXJKc29uKSk7XG4gICAgcmV0dXJuIGhlYWRlcnM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrQnlIYXNoKGJsb2NrSGFzaCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvQmxvY2soYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja0J5SGFzaFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpLCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmxvY2tzQnlIYXNoKGJsb2NrSGFzaGVzLCBzdGFydEhlaWdodCwgcHJ1bmUpIHtcbiAgICBsZXQgYmxvY2tzSnNvbjogYW55W10gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2Nrc0J5SGFzaFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpIGFzIGFueVtdO1xuICAgIGxldCBibG9ja3MgPSBbXTtcbiAgICBmb3IgKGxldCBibG9ja0pzb24gb2YgYmxvY2tzSnNvbikgYmxvY2tzLnB1c2gobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbikpO1xuICAgIHJldHVybiBibG9ja3M7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2NrQnlIZWlnaHQoaGVpZ2h0KSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9CbG9jayhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2NrQnlIZWlnaHRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWCk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJsb2Nrc0J5SGVpZ2h0KGhlaWdodHMpIHtcbiAgICBsZXQgYmxvY2tzSnNvbjogYW55W109IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tzQnlIZWlnaHRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSBhcyBhbnlbXTtcbiAgICBsZXQgYmxvY2tzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2tKc29uIG9mIGJsb2Nrc0pzb24pIGJsb2Nrcy5wdXNoKG5ldyBNb25lcm9CbG9jayhibG9ja0pzb24sIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFgpKTtcbiAgICByZXR1cm4gYmxvY2tzO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja3NCeVJhbmdlKHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpIHtcbiAgICBsZXQgYmxvY2tzSnNvbjogYW55W10gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEJsb2Nrc0J5UmFuZ2VcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSBhcyBhbnlbXTtcbiAgICBsZXQgYmxvY2tzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2tKc29uIG9mIGJsb2Nrc0pzb24pIGJsb2Nrcy5wdXNoKG5ldyBNb25lcm9CbG9jayhibG9ja0pzb24sIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFgpKTtcbiAgICByZXR1cm4gYmxvY2tzO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja3NCeVJhbmdlQ2h1bmtlZChzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBtYXhDaHVua1NpemUpIHtcbiAgICBsZXQgYmxvY2tzSnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0QmxvY2tzQnlSYW5nZUNodW5rZWRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSBhcyBhbnlbXTtcbiAgICBsZXQgYmxvY2tzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2tKc29uIG9mIGJsb2Nrc0pzb24pIGJsb2Nrcy5wdXNoKG5ldyBNb25lcm9CbG9jayhibG9ja0pzb24sIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFgpKTtcbiAgICByZXR1cm4gYmxvY2tzO1xuICB9XG4gIFxuICBhc3luYyBnZXRCbG9ja0hhc2hlcyhibG9ja0hhc2hlcywgc3RhcnRIZWlnaHQpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRCbG9ja0hhc2hlc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeHModHhIYXNoZXMsIHBydW5lID0gZmFsc2UpIHtcbiAgICBcbiAgICAvLyBkZXNlcmlhbGl6ZSB0eHMgZnJvbSBibG9ja3NcbiAgICBsZXQgYmxvY2tzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2tKc29uIG9mIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0VHhzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkgYXMgYW55W10pIHtcbiAgICAgIGJsb2Nrcy5wdXNoKG5ldyBNb25lcm9CbG9jayhibG9ja0pzb24sIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFgpKTtcbiAgICB9XG4gICAgXG4gICAgLy8gY29sbGVjdCB0eHNcbiAgICBsZXQgdHhzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2sgb2YgYmxvY2tzKSB7XG4gICAgICBmb3IgKGxldCB0eCBvZiBibG9jay5nZXRUeHMoKSkge1xuICAgICAgICBpZiAoIXR4LmdldElzQ29uZmlybWVkKCkpIHR4LnNldEJsb2NrKHVuZGVmaW5lZCk7XG4gICAgICAgIHR4cy5wdXNoKHR4KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHR4cztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhIZXhlcyh0eEhhc2hlcywgcHJ1bmUgPSBmYWxzZSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFR4SGV4ZXNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TWluZXJUeFN1bShoZWlnaHQsIG51bUJsb2Nrcykge1xuICAgIHJldHVybiBuZXcgTW9uZXJvTWluZXJUeFN1bShhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldE1pbmVyVHhTdW1cIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEZlZUVzdGltYXRlKGdyYWNlQmxvY2tzPykge1xuICAgIHJldHVybiBuZXcgTW9uZXJvRmVlRXN0aW1hdGUoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRGZWVFc3RpbWF0ZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgc3VibWl0VHhIZXgodHhIZXgsIGRvTm90UmVsYXkpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1N1Ym1pdFR4UmVzdWx0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uU3VibWl0VHhIZXhcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbGF5VHhzQnlIYXNoKHR4SGFzaGVzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uUmVsYXlUeHNCeUhhc2hcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhQb29sKCkge1xuICAgIGxldCBibG9ja0pzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFR4UG9vbFwiKTtcbiAgICBsZXQgdHhzID0gbmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWCkuZ2V0VHhzKCk7XG4gICAgZm9yIChsZXQgdHggb2YgdHhzKSB0eC5zZXRCbG9jayh1bmRlZmluZWQpO1xuICAgIHJldHVybiB0eHMgPyB0eHMgOiBbXTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhQb29sSGFzaGVzKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFR4UG9vbEhhc2hlc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFBvb2xCYWNrbG9nKCkge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhQb29sU3RhdHMoKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9UeFBvb2xTdGF0cyhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldFR4UG9vbFN0YXRzXCIpKTtcbiAgfVxuICBcbiAgYXN5bmMgZmx1c2hUeFBvb2woaGFzaGVzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uRmx1c2hUeFBvb2xcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzKGtleUltYWdlcykge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEtleUltYWdlU3BlbnRTdGF0dXNlc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRPdXRwdXRzKG91dHB1dHMpOiBQcm9taXNlPE1vbmVyb091dHB1dFtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRPdXRwdXRIaXN0b2dyYW0oYW1vdW50cywgbWluQ291bnQsIG1heENvdW50LCBpc1VubG9ja2VkLCByZWNlbnRDdXRvZmYpIHtcbiAgICBsZXQgZW50cmllcyA9IFtdO1xuICAgIGZvciAobGV0IGVudHJ5SnNvbiBvZiBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldE91dHB1dEhpc3RvZ3JhbVwiLCBbYW1vdW50cywgbWluQ291bnQsIG1heENvdW50LCBpc1VubG9ja2VkLCByZWNlbnRDdXRvZmZdKSBhcyBhbnlbXSkge1xuICAgICAgZW50cmllcy5wdXNoKG5ldyBNb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeShlbnRyeUpzb24pKTtcbiAgICB9XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dERpc3RyaWJ1dGlvbihhbW91bnRzLCBjdW11bGF0aXZlLCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRJbmZvKCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvRGFlbW9uSW5mbyhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEluZm9cIikpO1xuICB9XG4gIFxuICBhc3luYyBnZXRTeW5jSW5mbygpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0RhZW1vblN5bmNJbmZvKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0U3luY0luZm9cIikpO1xuICB9XG4gIFxuICBhc3luYyBnZXRIYXJkRm9ya0luZm8oKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9IYXJkRm9ya0luZm8oYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRIYXJkRm9ya0luZm9cIikpO1xuICB9XG4gIFxuICBhc3luYyBnZXRBbHRDaGFpbnMoKSB7XG4gICAgbGV0IGFsdENoYWlucyA9IFtdO1xuICAgIGZvciAobGV0IGFsdENoYWluSnNvbiBvZiBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vbkdldEFsdENoYWluc1wiKSBhcyBhbnkpIGFsdENoYWlucy5wdXNoKG5ldyBNb25lcm9BbHRDaGFpbihhbHRDaGFpbkpzb24pKTtcbiAgICByZXR1cm4gYWx0Q2hhaW5zO1xuICB9XG4gIFxuICBhc3luYyBnZXRBbHRCbG9ja0hhc2hlcygpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRBbHRCbG9ja0hhc2hlc1wiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RG93bmxvYWRMaW1pdCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXREb3dubG9hZExpbWl0XCIpO1xuICB9XG4gIFxuICBhc3luYyBzZXREb3dubG9hZExpbWl0KGxpbWl0KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uU2V0RG93bmxvYWRMaW1pdFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyByZXNldERvd25sb2FkTGltaXQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uUmVzZXREb3dubG9hZExpbWl0XCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRVcGxvYWRMaW1pdCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRVcGxvYWRMaW1pdFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0VXBsb2FkTGltaXQobGltaXQpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TZXRVcGxvYWRMaW1pdFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyByZXNldFVwbG9hZExpbWl0KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblJlc2V0VXBsb2FkTGltaXRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBlZXJzKCkge1xuICAgIGxldCBwZWVycyA9IFtdO1xuICAgIGZvciAobGV0IHBlZXJKc29uIG9mIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0UGVlcnNcIikgYXMgYW55KSBwZWVycy5wdXNoKG5ldyBNb25lcm9QZWVyKHBlZXJKc29uKSk7XG4gICAgcmV0dXJuIHBlZXJzO1xuICB9XG4gIFxuICBhc3luYyBnZXRLbm93blBlZXJzKCkge1xuICAgIGxldCBwZWVycyA9IFtdO1xuICAgIGZvciAobGV0IHBlZXJKc29uIG9mIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uR2V0S25vd25QZWVyc1wiKSBhcyBhbnkpIHBlZXJzLnB1c2gobmV3IE1vbmVyb1BlZXIocGVlckpzb24pKTtcbiAgICByZXR1cm4gcGVlcnM7XG4gIH1cbiAgXG4gIGFzeW5jIHNldE91dGdvaW5nUGVlckxpbWl0KGxpbWl0KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uU2V0SW5jb21pbmdQZWVyTGltaXRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0SW5jb21pbmdQZWVyTGltaXQobGltaXQpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TZXRJbmNvbWluZ1BlZXJMaW1pdFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRQZWVyQmFucygpIHtcbiAgICBsZXQgYmFucyA9IFtdO1xuICAgIGZvciAobGV0IGJhbkpzb24gb2YgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRQZWVyQmFuc1wiKSBhcyBhbnkpIGJhbnMucHVzaChuZXcgTW9uZXJvQmFuKGJhbkpzb24pKTtcbiAgICByZXR1cm4gYmFucztcbiAgfVxuXG4gIGFzeW5jIHNldFBlZXJCYW5zKGJhbnMpIHtcbiAgICBsZXQgYmFuc0pzb24gPSBbXTtcbiAgICBmb3IgKGxldCBiYW4gb2YgYmFucykgYmFuc0pzb24ucHVzaChiYW4udG9Kc29uKCkpO1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblNldFBlZXJCYW5zXCIsIFtiYW5zSnNvbl0pO1xuICB9XG4gIFxuICBhc3luYyBzdGFydE1pbmluZyhhZGRyZXNzLCBudW1UaHJlYWRzLCBpc0JhY2tncm91bmQsIGlnbm9yZUJhdHRlcnkpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TdGFydE1pbmluZ1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBzdG9wTWluaW5nKCkge1xuICAgIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGFlbW9uU3RvcE1pbmluZ1wiKVxuICB9XG4gIFxuICBhc3luYyBnZXRNaW5pbmdTdGF0dXMoKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9NaW5pbmdTdGF0dXMoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25HZXRNaW5pbmdTdGF0dXNcIikpO1xuICB9XG4gIFxuICBhc3luYyBzdWJtaXRCbG9ja3MoYmxvY2tCbG9icykge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblN1Ym1pdEJsb2Nrc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG5cbiAgYXN5bmMgcHJ1bmVCbG9ja2NoYWluKGNoZWNrKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9QcnVuZVJlc3VsdChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRhZW1vblBydW5lQmxvY2tjaGFpblwiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrRm9yVXBkYXRlKCk6IFByb21pc2U8TW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGRvd25sb2FkVXBkYXRlKHBhdGgpOiBQcm9taXNlPE1vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBzdG9wKCkge1xuICAgIHdoaWxlICh0aGlzLndyYXBwZWRMaXN0ZW5lcnMubGVuZ3RoKSBhd2FpdCB0aGlzLnJlbW92ZUxpc3RlbmVyKHRoaXMud3JhcHBlZExpc3RlbmVyc1swXS5nZXRMaXN0ZW5lcigpKTtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25TdG9wXCIpO1xuICB9XG4gIFxuICBhc3luYyB3YWl0Rm9yTmV4dEJsb2NrSGVhZGVyKCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvQmxvY2tIZWFkZXIoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkYWVtb25XYWl0Rm9yTmV4dEJsb2NrSGVhZGVyXCIpKTtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFBSSVZBVEUgSEVMUEVSUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIC8vIFRPRE86IGR1cGxpY2F0ZWQgd2l0aCBNb25lcm9XYWxsZXRGdWxsUHJveHlcbiAgcHJvdGVjdGVkIGFzeW5jIGludm9rZVdvcmtlcihmbk5hbWU6IHN0cmluZywgYXJncz86IGFueSkge1xuICAgIHJldHVybiBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKHRoaXMuZGFlbW9uSWQsIGZuTmFtZSwgYXJncyk7XG4gIH1cbn1cblxuLyoqXG4gKiBQb2xscyBhIE1vbmVybyBkYWVtb24gZm9yIHVwZGF0ZXMgYW5kIG5vdGlmaWVzIGxpc3RlbmVycyBhcyB0aGV5IG9jY3VyLlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBEYWVtb25Qb2xsZXIge1xuXG4gIHByb3RlY3RlZCBkYWVtb246IE1vbmVyb0RhZW1vblJwYztcbiAgcHJvdGVjdGVkIGxvb3BlcjogVGFza0xvb3BlcjtcbiAgcHJvdGVjdGVkIGlzUG9sbGluZzogYm9vbGVhbjtcbiAgcHJvdGVjdGVkIGxhc3RIZWFkZXI6IE1vbmVyb0Jsb2NrSGVhZGVyO1xuXG4gIGNvbnN0cnVjdG9yKGRhZW1vbikge1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICB0aGlzLmRhZW1vbiA9IGRhZW1vbjtcbiAgICB0aGlzLmxvb3BlciA9IG5ldyBUYXNrTG9vcGVyKGFzeW5jIGZ1bmN0aW9uKCkgeyBhd2FpdCB0aGF0LnBvbGwoKTsgfSk7XG4gIH1cbiAgXG4gIHNldElzUG9sbGluZyhpc1BvbGxpbmc6IGJvb2xlYW4pIHtcbiAgICB0aGlzLmlzUG9sbGluZyA9IGlzUG9sbGluZztcbiAgICBpZiAoaXNQb2xsaW5nKSB0aGlzLmxvb3Blci5zdGFydCh0aGlzLmRhZW1vbi5nZXRQb2xsSW50ZXJ2YWwoKSk7XG4gICAgZWxzZSB0aGlzLmxvb3Blci5zdG9wKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHBvbGwoKSB7XG4gICAgdHJ5IHtcbiAgICAgIFxuICAgICAgLy8gZ2V0IGxhdGVzdCBibG9jayBoZWFkZXJcbiAgICAgIGxldCBoZWFkZXIgPSBhd2FpdCB0aGlzLmRhZW1vbi5nZXRMYXN0QmxvY2tIZWFkZXIoKTtcbiAgICAgIFxuICAgICAgLy8gc2F2ZSBmaXJzdCBoZWFkZXIgZm9yIGNvbXBhcmlzb25cbiAgICAgIGlmICghdGhpcy5sYXN0SGVhZGVyKSB7XG4gICAgICAgIHRoaXMubGFzdEhlYWRlciA9IGF3YWl0IHRoaXMuZGFlbW9uLmdldExhc3RCbG9ja0hlYWRlcigpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIGNvbXBhcmUgaGVhZGVyIHRvIGxhc3RcbiAgICAgIGlmIChoZWFkZXIuZ2V0SGFzaCgpICE9PSB0aGlzLmxhc3RIZWFkZXIuZ2V0SGFzaCgpKSB7XG4gICAgICAgIHRoaXMubGFzdEhlYWRlciA9IGhlYWRlcjtcbiAgICAgICAgYXdhaXQgdGhpcy5hbm5vdW5jZUJsb2NrSGVhZGVyKGhlYWRlcik7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGJhY2tncm91bmQgcG9sbCBkYWVtb24gaGVhZGVyXCIpO1xuICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgIH1cbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBhbm5vdW5jZUJsb2NrSGVhZGVyKGhlYWRlcjogTW9uZXJvQmxvY2tIZWFkZXIpIHtcbiAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiBhd2FpdCB0aGlzLmRhZW1vbi5nZXRMaXN0ZW5lcnMoKSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgbGlzdGVuZXIub25CbG9ja0hlYWRlcihoZWFkZXIpOyAvLyBub3RpZnkgbGlzdGVuZXJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgY2FsbGluZyBsaXN0ZW5lciBvbiBibG9jayBoZWFkZXJcIiwgZXJyKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBJbnRlcm5hbCBsaXN0ZW5lciB0byBicmlkZ2Ugbm90aWZpY2F0aW9ucyB0byBleHRlcm5hbCBsaXN0ZW5lcnMuXG4gKiBcbiAqIEBwcml2YXRlXG4gKi9cbmNsYXNzIERhZW1vbldvcmtlckxpc3RlbmVyIHtcblxuICBwcm90ZWN0ZWQgaWQ6IGFueTtcbiAgcHJvdGVjdGVkIGxpc3RlbmVyOiBhbnk7XG5cbiAgY29uc3RydWN0b3IobGlzdGVuZXIpIHtcbiAgICB0aGlzLmlkID0gR2VuVXRpbHMuZ2V0VVVJRCgpO1xuICAgIHRoaXMubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgfVxuICBcbiAgZ2V0SWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaWQ7XG4gIH1cbiAgXG4gIGdldExpc3RlbmVyKCkge1xuICAgIHJldHVybiB0aGlzLmxpc3RlbmVyO1xuICB9XG4gIFxuICBhc3luYyBvbkJsb2NrSGVhZGVyKGhlYWRlckpzb24pIHtcbiAgICB0aGlzLmxpc3RlbmVyLm9uQmxvY2tIZWFkZXIobmV3IE1vbmVyb0Jsb2NrSGVhZGVyKGhlYWRlckpzb24pKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBNb25lcm9EYWVtb25ScGM7XG4iXSwibWFwcGluZ3MiOiJ5TEFBQSxJQUFBQSxPQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxTQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxhQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRyxXQUFBLEdBQUFKLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSSxlQUFBLEdBQUFMLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSyxVQUFBLEdBQUFOLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTSxZQUFBLEdBQUFQLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTyxrQkFBQSxHQUFBUixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVEsb0JBQUEsR0FBQVQsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFTLHFCQUFBLEdBQUFWLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBVSxhQUFBLEdBQUFYLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBVyxtQkFBQSxHQUFBWixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVksaUJBQUEsR0FBQWIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFhLHFCQUFBLEdBQUFkLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBYyxxQkFBQSxHQUFBZixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWUsOEJBQUEsR0FBQWhCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBZ0Is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