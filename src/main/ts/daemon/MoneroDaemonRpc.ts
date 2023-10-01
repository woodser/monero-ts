import assert from "assert";
import GenUtils from "../common/GenUtils";
import LibraryUtils from "../common/LibraryUtils";
import TaskLooper from "../common/TaskLooper";
import MoneroAltChain from "./model/MoneroAltChain";
import MoneroBan from "./model/MoneroBan";
import MoneroBlock from "./model/MoneroBlock";
import MoneroBlockHeader from "./model/MoneroBlockHeader";
import MoneroBlockTemplate from "./model/MoneroBlockTemplate";
import MoneroConnectionSpan from "./model/MoneroConnectionSpan";
import MoneroDaemon from "./MoneroDaemon";
import MoneroDaemonConfig from "./model/MoneroDaemonConfig";
import MoneroDaemonInfo from "./model/MoneroDaemonInfo";
import MoneroDaemonListener from "./model/MoneroDaemonListener";
import MoneroDaemonSyncInfo from "./model/MoneroDaemonSyncInfo";
import MoneroDaemonUpdateCheckResult from "./model/MoneroDaemonUpdateCheckResult";
import MoneroDaemonUpdateDownloadResult from "./model/MoneroDaemonUpdateDownloadResult";
import MoneroFeeEstimate from "./model/MoneroFeeEstimate";
import MoneroError from "../common/MoneroError";
import MoneroHardForkInfo from "./model/MoneroHardForkInfo";
import MoneroKeyImage from "./model/MoneroKeyImage";
import MoneroKeyImageSpentStatus from "./model/MoneroKeyImageSpentStatus";
import MoneroMinerTxSum from "./model/MoneroMinerTxSum";
import MoneroMiningStatus from "./model/MoneroMiningStatus";
import MoneroNetworkType from "./model/MoneroNetworkType";
import MoneroOutput from "./model/MoneroOutput";
import MoneroOutputHistogramEntry from "./model/MoneroOutputHistogramEntry";
import MoneroPeer from "./model/MoneroPeer";
import MoneroPruneResult from "./model/MoneroPruneResult";
import MoneroRpcConnection from "../common/MoneroRpcConnection";
import MoneroSubmitTxResult from "./model/MoneroSubmitTxResult";
import MoneroTx from "./model/MoneroTx";
import MoneroTxPoolStats from "./model/MoneroTxPoolStats";
import MoneroUtils from "../common/MoneroUtils";
import MoneroVersion from "./model/MoneroVersion";
import { ChildProcess } from "child_process";

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
class MoneroDaemonRpc extends MoneroDaemon {

  // static variables
  protected static readonly MAX_REQ_SIZE = "3000000";
  protected static readonly DEFAULT_ID = "0000000000000000000000000000000000000000000000000000000000000000"; // uninitialized tx or block hash from daemon rpc
  protected static readonly NUM_HEADERS_PER_REQ = 750; // number of headers to fetch and cache per request
  protected static readonly DEFAULT_POLL_PERIOD = 20000; // default interval between polling the daemon in ms

  // instance variables
  protected config: Partial<MoneroDaemonConfig>;
  protected listeners: MoneroDaemonListener[];
  protected cachedHeaders: any;
  protected process: any;
  protected pollListener: any;
  protected proxyDaemon: any;
 
  /** @private */
  constructor(config: MoneroDaemonConfig, proxyDaemon: MoneroDaemonRpcProxy) {
    super();
    this.config = config;
    this.proxyDaemon = proxyDaemon;
    if (config.proxyToWorker) return;
    this.listeners = [];      // block listeners
    this.cachedHeaders = {};  // cached headers for fetching blocks in bound chunks
  }
  
  /**
   * Get the internal process running monerod.
   * 
   * @return {ChildProcess} the node process running monerod, undefined if not created from new process
   */
  getProcess(): ChildProcess {
    return this.process;
  }
  
  /**
   * Stop the internal process running monerod, if applicable.
   * 
   * @param {boolean} [force] specifies if the process should be destroyed forcibly (default false)
   * @return {Promise<number | undefined>} the exit code from stopping the process
   */
  async stopProcess(force = false): Promise<number | undefined> {
    if (this.process === undefined) throw new MoneroError("MoneroDaemonRpc instance not created from new process");
    let listenersCopy = GenUtils.copyArray(await this.getListeners());
    for (let listener of listenersCopy) await this.removeListener(listener);
    return GenUtils.killProcess(this.process, force ? "SIGKILL" : undefined);
  }
  
  async addListener(listener: MoneroDaemonListener): Promise<void> {
    if (this.config.proxyToWorker) return this.proxyDaemon.addListener(listener);
    assert(listener instanceof MoneroDaemonListener, "Listener must be instance of MoneroDaemonListener");
    this.listeners.push(listener);
    this.refreshListening();
  }
  
  async removeListener(listener: MoneroDaemonListener): Promise<void> {
    if (this.config.proxyToWorker) return this.proxyDaemon.removeListener(listener);
    assert(listener instanceof MoneroDaemonListener, "Listener must be instance of MoneroDaemonListener");
    let idx = this.listeners.indexOf(listener);
    if (idx > -1) this.listeners.splice(idx, 1);
    else throw new MoneroError("Listener is not registered with daemon");
    this.refreshListening();
  }
  
  getListeners(): MoneroDaemonListener[] {
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
  
  async isConnected(): Promise<boolean> {
    if (this.config.proxyToWorker) return this.proxyDaemon.isConnected();
    try {
      await this.getVersion();
      return true;
    } catch (e: any) {
      return false;
    }
  }
  
  async getVersion(): Promise<MoneroVersion> {
    if (this.config.proxyToWorker) return this.proxyDaemon.getVersion();
    let resp = await this.config.getServer().sendJsonRequest("get_version");
    MoneroDaemonRpc.checkResponseStatus(resp.result);
    return new MoneroVersion(resp.result.version, resp.result.release);
  }
  
  async isTrusted(): Promise<boolean> {
    if (this.config.proxyToWorker) return this.proxyDaemon.isTrusted();
    let resp = await this.config.getServer().sendPathRequest("get_height");
    MoneroDaemonRpc.checkResponseStatus(resp);
    return !resp.untrusted;
  }
  
  async getHeight(): Promise<number> {
    if (this.config.proxyToWorker) return this.proxyDaemon.getHeight();
    let resp = await this.config.getServer().sendJsonRequest("get_block_count");
    MoneroDaemonRpc.checkResponseStatus(resp.result);
    return resp.result.count;
  }
  
  async getBlockHash(height: number): Promise<string> {
    if (this.config.proxyToWorker) return this.proxyDaemon.getBlockHash(height);
    return (await this.config.getServer().sendJsonRequest("on_get_block_hash", [height])).result;  // TODO monero-wallet-rpc: no status returned
  }
  
  async getBlockTemplate(walletAddress: string, reserveSize?: number): Promise<MoneroBlockTemplate> {
    if (this.config.proxyToWorker) return this.proxyDaemon.getBlockTemplate(walletAddress, reserveSize);
    assert(walletAddress && typeof walletAddress === "string", "Must specify wallet address to be mined to");
    let resp = await this.config.getServer().sendJsonRequest("get_block_template", {wallet_address: walletAddress, reserve_size: reserveSize});
    MoneroDaemonRpc.checkResponseStatus(resp.result);
    return MoneroDaemonRpc.convertRpcBlockTemplate(resp.result);
  }
  
  async getLastBlockHeader(): Promise<MoneroBlockHeader> {
    if (this.config.proxyToWorker) return this.proxyDaemon.getLastBlockHeader();
    let resp = await this.config.getServer().sendJsonRequest("get_last_block_header");
    MoneroDaemonRpc.checkResponseStatus(resp.result);
    return MoneroDaemonRpc.convertRpcBlockHeader(resp.result.block_header);
  }
  
  async getBlockHeaderByHash(blockHash: string): Promise<MoneroBlockHeader> {
    if (this.config.proxyToWorker) return this.proxyDaemon.getBlockHeaderByHash(blockHash);
    let resp = await this.config.getServer().sendJsonRequest("get_block_header_by_hash", {hash: blockHash});
    MoneroDaemonRpc.checkResponseStatus(resp.result);
    return MoneroDaemonRpc.convertRpcBlockHeader(resp.result.block_header);
  }
  
  async getBlockHeaderByHeight(height: number): Promise<MoneroBlockHeader> {
    if (this.config.proxyToWorker) return this.proxyDaemon.getBlockHeaderByHeight(height);
    let resp = await this.config.getServer().sendJsonRequest("get_block_header_by_height", {height: height});
    MoneroDaemonRpc.checkResponseStatus(resp.result);
    return MoneroDaemonRpc.convertRpcBlockHeader(resp.result.block_header);
  }
  
  async getBlockHeadersByRange(startHeight?: number, endHeight?: number): Promise<MoneroBlockHeader[]> {
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
  
  async getBlockByHash(blockHash: string): Promise<MoneroBlock> {
    if (this.config.proxyToWorker) return this.proxyDaemon.getBlockByHash(blockHash);
    let resp = await this.config.getServer().sendJsonRequest("get_block", {hash: blockHash});
    MoneroDaemonRpc.checkResponseStatus(resp.result);
    return MoneroDaemonRpc.convertRpcBlock(resp.result);
  }
  
  async getBlockByHeight(height: number): Promise<MoneroBlock> {
    if (this.config.proxyToWorker) return this.proxyDaemon.getBlockByHeight(height);
    let resp = await this.config.getServer().sendJsonRequest("get_block", {height: height});
    MoneroDaemonRpc.checkResponseStatus(resp.result);
    return MoneroDaemonRpc.convertRpcBlock(resp.result);
  }
  
  async getBlocksByHeight(heights: number[]): Promise<MoneroBlock[]> {
    if (this.config.proxyToWorker) return this.proxyDaemon.getBlocksByHeight(heights);
    
    // fetch blocks in binary
    let respBin = await this.config.getServer().sendBinaryRequest("get_blocks_by_height.bin", {heights: heights});
    
    // convert binary blocks to json
    let rpcBlocks = await MoneroUtils.binaryBlocksToJson(respBin);
    MoneroDaemonRpc.checkResponseStatus(rpcBlocks);
    
    // build blocks with transactions
    assert.equal(rpcBlocks.txs.length, rpcBlocks.blocks.length);    
    let blocks = [];
    for (let blockIdx = 0; blockIdx < rpcBlocks.blocks.length; blockIdx++) {
      
      // build block
      let block = MoneroDaemonRpc.convertRpcBlock(rpcBlocks.blocks[blockIdx]);
      block.setHeight(heights[blockIdx]);
      blocks.push(block);
      
      // build transactions
      let txs = [];
      for (let txIdx = 0; txIdx < rpcBlocks.txs[blockIdx].length; txIdx++) {
        let tx = new MoneroTx();
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
        if (tx.getBlock()) block.merge(tx.getBlock());
        else block.getTxs().push(tx.setBlock(block));
      }
    }
    
    return blocks;
  }
  
  async getBlocksByRange(startHeight?: number, endHeight?: number): Promise<MoneroBlock[]> {
    if (this.config.proxyToWorker) return this.proxyDaemon.getBlocksByRange(startHeight, endHeight);
    if (startHeight === undefined) startHeight = 0;
    if (endHeight === undefined) endHeight = await this.getHeight() - 1;
    let heights = [];
    for (let height = startHeight; height <= endHeight; height++) heights.push(height);
    return await this.getBlocksByHeight(heights);
  }
  
  async getBlocksByRangeChunked(startHeight?: number, endHeight?: number, maxChunkSize?: number): Promise<MoneroBlock[]> {
    if (this.config.proxyToWorker) return this.proxyDaemon.getBlocksByRangeChunked(startHeight, endHeight, maxChunkSize);
    if (startHeight === undefined) startHeight = 0;
    if (endHeight === undefined) endHeight = await this.getHeight() - 1;
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
  
  async getTxs(txHashes: string[], prune = false): Promise<MoneroTx[]> {
    if (this.config.proxyToWorker) return this.proxyDaemon.getTxs(txHashes, prune);
        
    // validate input
    assert(Array.isArray(txHashes) && txHashes.length > 0, "Must provide an array of transaction hashes");
    assert(prune === undefined || typeof prune === "boolean", "Prune must be a boolean or undefined");
        
    // fetch transactions
    let resp = await this.config.getServer().sendPathRequest("get_transactions", {
      txs_hashes: txHashes,
      decode_as_json: true,
      prune: prune
    });
    try {
      MoneroDaemonRpc.checkResponseStatus(resp);
    } catch (e: any) {
      if (e.message.indexOf("Failed to parse hex representation of transaction hash") >= 0) throw new MoneroError("Invalid transaction hash");
      throw e;
    }
        
    // build transaction models
    let txs = [];
    if (resp.txs) {
      for (let txIdx = 0; txIdx < resp.txs.length; txIdx++) {
        let tx = new MoneroTx();
        tx.setIsMinerTx(false);
        txs.push(MoneroDaemonRpc.convertRpcTx(resp.txs[txIdx], tx));
      }
    }
    
    return txs;
  }
  
  async getTxHexes(txHashes: string[], prune = false): Promise<string[]> {
    if (this.config.proxyToWorker) return this.proxyDaemon.getTxHexes(txHashes, prune);
    let hexes = [];
    for (let tx of await this.getTxs(txHashes, prune)) hexes.push(prune ? tx.getPrunedHex() : tx.getFullHex());
    return hexes;
  }
  
  async getMinerTxSum(height: number, numBlocks: number): Promise<MoneroMinerTxSum> {
    if (this.config.proxyToWorker) return this.proxyDaemon.getMinerTxSum(height, numBlocks);
    if (height === undefined) height = 0;
    else assert(height >= 0, "Height must be an integer >= 0");
    if (numBlocks === undefined) numBlocks = await this.getHeight();
    else assert(numBlocks >= 0, "Count must be an integer >= 0");
    let resp = await this.config.getServer().sendJsonRequest("get_coinbase_tx_sum", {height: height, count: numBlocks});
    MoneroDaemonRpc.checkResponseStatus(resp.result);
    let txSum = new MoneroMinerTxSum();
    txSum.setEmissionSum(BigInt(resp.result.emission_amount));
    txSum.setFeeSum(BigInt(resp.result.fee_amount));
    return txSum;
  }
  
  async getFeeEstimate(graceBlocks?: number): Promise<MoneroFeeEstimate> {
    if (this.config.proxyToWorker) return this.proxyDaemon.getFeeEstimate(graceBlocks);
    let resp = await this.config.getServer().sendJsonRequest("get_fee_estimate", {grace_blocks: graceBlocks});
    MoneroDaemonRpc.checkResponseStatus(resp.result);
    let feeEstimate = new MoneroFeeEstimate();
    feeEstimate.setFee(BigInt(resp.result.fee));
    let fees = [];
    for (let i = 0; i < resp.result.fees.length; i++) fees.push(BigInt(resp.result.fees[i]));
    feeEstimate.setFees(fees);
    feeEstimate.setQuantizationMask(BigInt(resp.result.quantization_mask));
    return feeEstimate;
  }
  
  async submitTxHex(txHex: string, doNotRelay: boolean): Promise<MoneroSubmitTxResult> {
    if (this.config.proxyToWorker) return this.proxyDaemon.submitTxHex(txHex, doNotRelay);
    let resp = await this.config.getServer().sendPathRequest("send_raw_transaction", {tx_as_hex: txHex, do_not_relay: doNotRelay});
    let result = MoneroDaemonRpc.convertRpcSubmitTxResult(resp);
    
    // set isGood based on status
    try {
      MoneroDaemonRpc.checkResponseStatus(resp); 
      result.setIsGood(true);
    } catch (e: any) {
      result.setIsGood(false);
    }
    return result;
  }
  
  async relayTxsByHash(txHashes: string[]): Promise<void> {
    if (this.config.proxyToWorker) return this.proxyDaemon.relayTxsByHash(txHashes);
    let resp = await this.config.getServer().sendJsonRequest("relay_tx", {txids: txHashes});
    MoneroDaemonRpc.checkResponseStatus(resp.result);
  }
  
  async getTxPool(): Promise<MoneroTx[]> {
    if (this.config.proxyToWorker) return this.proxyDaemon.getTxPool();
    
    // send rpc request
    let resp = await this.config.getServer().sendPathRequest("get_transaction_pool");
    MoneroDaemonRpc.checkResponseStatus(resp);
    
    // build txs
    let txs = [];
    if (resp.transactions) {
      for (let rpcTx of resp.transactions) {
        let tx = new MoneroTx();
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
  
  async getTxPoolHashes(): Promise<string[]> {
    throw new MoneroError("Not implemented");
  }
  
  // async getTxPoolBacklog(): Promise<MoneroTxBacklogEntry[]> {
  //   throw new MoneroError("Not implemented");
  // }

  async getTxPoolStats(): Promise<MoneroTxPoolStats> {
    if (this.config.proxyToWorker) return this.proxyDaemon.getTxPoolStats();
    let resp = await this.config.getServer().sendPathRequest("get_transaction_pool_stats");
    MoneroDaemonRpc.checkResponseStatus(resp);
    return MoneroDaemonRpc.convertRpcTxPoolStats(resp.pool_stats);
  }
  
  async flushTxPool(hashes?: string | string[]): Promise<void> {
    if (this.config.proxyToWorker) return this.proxyDaemon.flushTxPool(hashes);
    if (hashes) hashes = GenUtils.listify(hashes);
    let resp = await this.config.getServer().sendJsonRequest("flush_txpool", {txids: hashes});
    MoneroDaemonRpc.checkResponseStatus(resp.result);
  }
  
  async getKeyImageSpentStatuses(keyImages: string[]): Promise<MoneroKeyImageSpentStatus[]> {
    if (this.config.proxyToWorker) return this.proxyDaemon.getKeyImageSpentStatuses(keyImages);
    if (keyImages === undefined || keyImages.length === 0) throw new MoneroError("Must provide key images to check the status of");
    let resp = await this.config.getServer().sendPathRequest("is_key_image_spent", {key_images: keyImages});
    MoneroDaemonRpc.checkResponseStatus(resp);
    return resp.spent_status;
  }
  
  async getOutputHistogram(amounts?: bigint[], minCount?: number, maxCount?: number, isUnlocked?: boolean, recentCutoff?: number): Promise<MoneroOutputHistogramEntry[]> {
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
    throw new MoneroError("Not implemented (response 'distribution' field is binary)");
    
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
  
  async getInfo(): Promise<MoneroDaemonInfo> {
    if (this.config.proxyToWorker) return this.proxyDaemon.getInfo();
    let resp = await this.config.getServer().sendJsonRequest("get_info");
    MoneroDaemonRpc.checkResponseStatus(resp.result);
    return MoneroDaemonRpc.convertRpcInfo(resp.result);
  }
  
  async getSyncInfo(): Promise<MoneroDaemonSyncInfo> {
    if (this.config.proxyToWorker) return this.proxyDaemon.getSyncInfo();
    let resp = await this.config.getServer().sendJsonRequest("sync_info");
    MoneroDaemonRpc.checkResponseStatus(resp.result);
    return MoneroDaemonRpc.convertRpcSyncInfo(resp.result);
  }
  
  async getHardForkInfo(): Promise<MoneroHardForkInfo> {
    if (this.config.proxyToWorker) return this.proxyDaemon.getHardForkInfo();
    let resp = await this.config.getServer().sendJsonRequest("hard_fork_info");
    MoneroDaemonRpc.checkResponseStatus(resp.result);
    return MoneroDaemonRpc.convertRpcHardForkInfo(resp.result);
  }
  
  async getAltChains(): Promise<MoneroAltChain[]> {
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
  
  async getAltBlockHashes(): Promise<string[]> {
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
  
  async getDownloadLimit(): Promise<number> {
    if (this.config.proxyToWorker) return this.proxyDaemon.getDownloadLimit();
    return (await this.getBandwidthLimits())[0];
  }
  
  async setDownloadLimit(limit: number): Promise<number> {
    if (this.config.proxyToWorker) return this.proxyDaemon.setDownloadLimit(limit);
    if (limit == -1) return await this.resetDownloadLimit();
    if (!(GenUtils.isInt(limit) && limit > 0)) throw new MoneroError("Download limit must be an integer greater than 0");
    return (await this.setBandwidthLimits(limit, 0))[0];
  }
  
  async resetDownloadLimit(): Promise<number> {
    if (this.config.proxyToWorker) return this.proxyDaemon.resetDownloadLimit();
    return (await this.setBandwidthLimits(-1, 0))[0];
  }

  async getUploadLimit(): Promise<number> {
    if (this.config.proxyToWorker) return this.proxyDaemon.getUploadLimit();
    return (await this.getBandwidthLimits())[1];
  }
  
  async setUploadLimit(limit: number): Promise<number> {
    if (this.config.proxyToWorker) return this.proxyDaemon.setUploadLimit(limit);
    if (limit == -1) return await this.resetUploadLimit();
    if (!(GenUtils.isInt(limit) && limit > 0)) throw new MoneroError("Upload limit must be an integer greater than 0");
    return (await this.setBandwidthLimits(0, limit))[1];
  }
  
  async resetUploadLimit(): Promise<number> {
    if (this.config.proxyToWorker) return this.proxyDaemon.resetUploadLimit();
    return (await this.setBandwidthLimits(0, -1))[1];
  }
  
  async getPeers(): Promise<MoneroPeer[]> {
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
  
  async getKnownPeers(): Promise<MoneroPeer[]> {
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
  
  async setOutgoingPeerLimit(limit: number): Promise<void> {
    if (this.config.proxyToWorker) return this.proxyDaemon.setOutgoingPeerLimit(limit);
    if (!(GenUtils.isInt(limit) && limit >= 0)) throw new MoneroError("Outgoing peer limit must be >= 0");
    let resp = await this.config.getServer().sendPathRequest("out_peers", {out_peers: limit});
    MoneroDaemonRpc.checkResponseStatus(resp);
  }
  
  async setIncomingPeerLimit(limit: number): Promise<void> {
    if (this.config.proxyToWorker) return this.proxyDaemon.setIncomingPeerLimit(limit);
    if (!(GenUtils.isInt(limit) && limit >= 0)) throw new MoneroError("Incoming peer limit must be >= 0");
    let resp = await this.config.getServer().sendPathRequest("in_peers", {in_peers: limit});
    MoneroDaemonRpc.checkResponseStatus(resp);
  }
  
  async getPeerBans(): Promise<MoneroBan[]> {
    if (this.config.proxyToWorker) return this.proxyDaemon.getPeerBans();
    let resp = await this.config.getServer().sendJsonRequest("get_bans");
    MoneroDaemonRpc.checkResponseStatus(resp.result);
    let bans = [];
    for (let rpcBan of resp.result.bans) {
      let ban = new MoneroBan();
      ban.setHost(rpcBan.host);
      ban.setIp(rpcBan.ip);
      ban.setSeconds(rpcBan.seconds);
      bans.push(ban);
    }
    return bans;
  }
  
  async setPeerBans(bans: MoneroBan[]): Promise<void> {
    if (this.config.proxyToWorker) return this.proxyDaemon.setPeerBans(bans);
    let rpcBans = [];
    for (let ban of bans) rpcBans.push(MoneroDaemonRpc.convertToRpcBan(ban));
    let resp = await this.config.getServer().sendJsonRequest("set_bans", {bans: rpcBans});
    MoneroDaemonRpc.checkResponseStatus(resp.result);
  }
  
  async startMining(address: string, numThreads?: number, isBackground?: boolean, ignoreBattery?: boolean): Promise<void> {
    if (this.config.proxyToWorker) return this.proxyDaemon.startMining(address, numThreads, isBackground, ignoreBattery);
    assert(address, "Must provide address to mine to");
    assert(GenUtils.isInt(numThreads) && numThreads > 0, "Number of threads must be an integer greater than 0");
    assert(isBackground === undefined || typeof isBackground === "boolean");
    assert(ignoreBattery === undefined || typeof ignoreBattery === "boolean");
    let resp = await this.config.getServer().sendPathRequest("start_mining", {
      miner_address: address,
      threads_count: numThreads,
      do_background_mining: isBackground,
      ignore_battery: ignoreBattery,
    });
    MoneroDaemonRpc.checkResponseStatus(resp);
  }
  
  async stopMining(): Promise<void> {
    if (this.config.proxyToWorker) return this.proxyDaemon.stopMining();
    let resp = await this.config.getServer().sendPathRequest("stop_mining");
    MoneroDaemonRpc.checkResponseStatus(resp);
  }
  
  async getMiningStatus(): Promise<MoneroMiningStatus> {
    if (this.config.proxyToWorker) return this.proxyDaemon.getMiningStatus();
    let resp = await this.config.getServer().sendPathRequest("mining_status");
    MoneroDaemonRpc.checkResponseStatus(resp);
    return MoneroDaemonRpc.convertRpcMiningStatus(resp);
  }
  
  async submitBlocks(blockBlobs: string[]): Promise<void> {
    if (this.config.proxyToWorker) return this.proxyDaemon.submitBlocks();
    assert(Array.isArray(blockBlobs) && blockBlobs.length > 0, "Must provide an array of mined block blobs to submit");
    let resp = await this.config.getServer().sendJsonRequest("submit_block", blockBlobs);
    MoneroDaemonRpc.checkResponseStatus(resp.result);
  }

  async pruneBlockchain(check: boolean): Promise<MoneroPruneResult> {
    if (this.config.proxyToWorker) return this.proxyDaemon.pruneBlockchain();
    let resp = await this.config.getServer().sendJsonRequest("prune_blockchain", {check: check}, 0);
    MoneroDaemonRpc.checkResponseStatus(resp.result);
    let result = new MoneroPruneResult();
    result.setIsPruned(resp.result.pruned);
    result.setPruningSeed(resp.result.pruning_seed);
    return result;
  }
  
  async checkForUpdate(): Promise<MoneroDaemonUpdateCheckResult> {
    if (this.config.proxyToWorker) return this.proxyDaemon.checkForUpdate();
    let resp = await this.config.getServer().sendPathRequest("update", {command: "check"});
    MoneroDaemonRpc.checkResponseStatus(resp);
    return MoneroDaemonRpc.convertRpcUpdateCheckResult(resp);
  }
  
  async downloadUpdate(path?: string): Promise<MoneroDaemonUpdateDownloadResult> {
    if (this.config.proxyToWorker) return this.proxyDaemon.downloadUpdate(path);
    let resp = await this.config.getServer().sendPathRequest("update", {command: "download", path: path});
    MoneroDaemonRpc.checkResponseStatus(resp);
    return MoneroDaemonRpc.convertRpcUpdateDownloadResult(resp);
  }
  
  async stop(): Promise<void> {
    if (this.config.proxyToWorker) return this.proxyDaemon.stop();
    let resp = await this.config.getServer().sendPathRequest("stop_daemon");
    MoneroDaemonRpc.checkResponseStatus(resp);
  }
  
  async waitForNextBlockHeader(): Promise<MoneroBlockHeader> {
    if (this.config.proxyToWorker) return this.proxyDaemon.waitForNextBlockHeader();
    let that = this;
    return new Promise(async function(resolve) {
      await that.addListener(new class extends MoneroDaemonListener {
        async onBlockHeader(header) {
          await that.removeListener(this);
          resolve(header);
        }
      }); 
    });
  }

  getPollInterval(): number {
    return this.config.pollInterval;
  }
  
  // ----------- ADD JSDOC FOR SUPPORTED DEFAULT IMPLEMENTATIONS --------------
  async getTx(txHash?: string, prune = false): Promise<MoneroTx> { return super.getTx(txHash, prune); };
  async getTxHex(txHash: string, prune = false): Promise<string> { return super.getTxHex(txHash, prune); };
  async getKeyImageSpentStatus(keyImage: string): Promise<MoneroKeyImageSpentStatus> { return super.getKeyImageSpentStatus(keyImage); }
  async setPeerBan(ban: MoneroBan): Promise<void> { return super.setPeerBan(ban); }
  async submitBlock(blockBlob: string): Promise<void> { return super.submitBlock(blockBlob); }
  
  // ------------------------------- PRIVATE ----------------------------------

  protected refreshListening() {
    if (this.pollListener == undefined && this.listeners.length) this.pollListener = new DaemonPoller(this);
    if (this.pollListener !== undefined) this.pollListener.setIsPolling(this.listeners.length > 0);
  }
  
  protected async getBandwidthLimits() {
    let resp = await this.config.getServer().sendPathRequest("get_limit");
    MoneroDaemonRpc.checkResponseStatus(resp);
    return [resp.limit_down, resp.limit_up];
  }
  
  protected async setBandwidthLimits(downLimit, upLimit) {
    if (downLimit === undefined) downLimit = 0;
    if (upLimit === undefined) upLimit = 0;
    let resp = await this.config.getServer().sendPathRequest("set_limit", {limit_down: downLimit, limit_up: upLimit});
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
  protected async getMaxBlocks(startHeight, maxHeight, maxReqSize) {
    if (startHeight === undefined) startHeight = 0;
    if (maxHeight === undefined) maxHeight = await this.getHeight() - 1;
    if (maxReqSize === undefined) maxReqSize = MoneroDaemonRpc.MAX_REQ_SIZE;
    
    // determine end height to fetch
    let reqSize = 0;
    let endHeight = startHeight - 1;
    while (reqSize < maxReqSize && endHeight < maxHeight) {
      
      // get header of next block
      let header = await this.getBlockHeaderByHeightCached(endHeight + 1, maxHeight);
      
      // block cannot be bigger than max request size
      assert(header.getSize() <= maxReqSize, "Block exceeds maximum request size: " + header.getSize());
      
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
  protected async getBlockHeaderByHeightCached(height, maxHeight) {
    
    // get header from cache
    let cachedHeader = this.cachedHeaders[height];
    if (cachedHeader) return cachedHeader;
    
    // fetch and cache headers if not in cache
    let endHeight = Math.min(maxHeight, height + MoneroDaemonRpc.NUM_HEADERS_PER_REQ - 1);  // TODO: could specify end height to cache to optimize small requests (would like to have time profiling in place though)
    let headers = await this.getBlockHeadersByRange(height, endHeight);
    for (let header of headers) {
      this.cachedHeaders[header.getHeight()] = header;
    }
    
    // return the cached header
    return this.cachedHeaders[height];
  }
  
  // --------------------------------- STATIC ---------------------------------

  static async connectToDaemonRpc(uriOrConfig: string | Partial<MoneroRpcConnection> | Partial<MoneroDaemonConfig> | string[], username?: string, password?: string): Promise<MoneroDaemonRpc> {
    let config = MoneroDaemonRpc.normalizeConfig(uriOrConfig, username, password);
    if (config.cmd) return MoneroDaemonRpc.startMonerodProcess(config);
    return new MoneroDaemonRpc(config, config.proxyToWorker ? await MoneroDaemonRpcProxy.connect(config) : undefined);
  }
  
  protected static async startMonerodProcess(config: MoneroDaemonConfig): Promise<MoneroDaemonRpc> {
    assert(GenUtils.isArray(config.cmd), "Must provide string array with command line parameters");
    
    // start process
    let process = require('child_process').spawn(config.cmd[0], config.cmd.slice(1), {});
    process.stdout.setEncoding('utf8');
    process.stderr.setEncoding('utf8');
    
    // return promise which resolves after starting monerod
    let uri;
    let output = "";
    return new Promise(function(resolve, reject) {
      
      // handle stdout
      process.stdout.on('data', async function(data) {
        let line = data.toString();
        LibraryUtils.log(2, line);
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
          config = config.copy().setServer({uri: uri, username: username, password: password, rejectUnauthorized: config.getServer() ? config.getServer().getRejectUnauthorized() : undefined});
          config.setProxyToWorker(config.proxyToWorker);
          config.cmd = undefined
          let daemon = await MoneroDaemonRpc.connectToDaemonRpc(config);
          daemon.process = process;
          
          // resolve promise with client connected to internal process 
          this.isResolved = true;
          resolve(daemon);
        }
      });
      
      // handle stderr
      process.stderr.on('data', function(data) {
        if (LibraryUtils.getLogLevel() >= 2) console.error(data);
      });
      
      // handle exit
      process.on("exit", function(code) {
        if (!this.isResolved) reject(new Error("monerod process terminated with exit code " + code + (output ? ":\n\n" + output : "")));
      });
      
      // handle error
      process.on("error", function(err) {
        if (err.message.indexOf("ENOENT") >= 0) reject(new Error("monerod does not exist at path '" + config.cmd[0] + "'"));
        if (!this.isResolved) reject(err);
      });
      
      // handle uncaught exception
      process.on("uncaughtException", function(err, origin) {
        console.error("Uncaught exception in monerod process: " + err.message);
        console.error(origin);
        reject(err);
      });
    });
  }
  
  protected static normalizeConfig(uriOrConfig: string | Partial<MoneroRpcConnection> | Partial<MoneroDaemonConfig> | string[], username?: string, password?: string): MoneroDaemonConfig {
    let config: undefined | Partial<MoneroDaemonConfig> = undefined;
    if (typeof uriOrConfig === "string") {
      config = new MoneroDaemonConfig({server: new MoneroRpcConnection(uriOrConfig as string, username, password)});
    } else if ((uriOrConfig as Partial<MoneroRpcConnection>).uri !== undefined) {
      config = new MoneroDaemonConfig({server: new MoneroRpcConnection(uriOrConfig as Partial<MoneroRpcConnection>)});

      // transfer worker proxy setting from rpc connection to daemon config
      config.setProxyToWorker(config.proxyToWorker);
      config.getServer().setProxyToWorker(MoneroRpcConnection.DEFAULT_CONFIG.proxyToWorker);
    } else if (GenUtils.isArray(uriOrConfig)) {
      config = new MoneroDaemonConfig({cmd: uriOrConfig as string[]});
    } else {
      config = new MoneroDaemonConfig(uriOrConfig as Partial<MoneroDaemonConfig>);
    }
    if (config.proxyToWorker === undefined) config.proxyToWorker = true;
    if (config.pollInterval === undefined) config.pollInterval = MoneroDaemonRpc.DEFAULT_POLL_PERIOD;
    return config as MoneroDaemonConfig;
  }
  
  protected static checkResponseStatus(resp) {
    if (resp.status !== "OK") throw new MoneroError(resp.status);
  }
  
  protected static convertRpcBlockHeader(rpcHeader) {
    if (!rpcHeader) return undefined;
    let header = new MoneroBlockHeader();
    for (let key of Object.keys(rpcHeader)) {
      let val = rpcHeader[key];
      if (key === "block_size") GenUtils.safeSet(header, header.getSize, header.setSize, val);
      else if (key === "depth") GenUtils.safeSet(header, header.getDepth, header.setDepth, val);
      else if (key === "difficulty") { }  // handled by wide_difficulty
      else if (key === "cumulative_difficulty") { } // handled by wide_cumulative_difficulty
      else if (key === "difficulty_top64") { }  // handled by wide_difficulty
      else if (key === "cumulative_difficulty_top64") { } // handled by wide_cumulative_difficulty
      else if (key === "wide_difficulty") header.setDifficulty(GenUtils.reconcile(header.getDifficulty(), MoneroDaemonRpc.prefixedHexToBI(val)));
      else if (key === "wide_cumulative_difficulty") header.setCumulativeDifficulty(GenUtils.reconcile(header.getCumulativeDifficulty(), MoneroDaemonRpc.prefixedHexToBI(val)));
      else if (key === "hash") GenUtils.safeSet(header, header.getHash, header.setHash, val);
      else if (key === "height") GenUtils.safeSet(header, header.getHeight, header.setHeight, val);
      else if (key === "major_version") GenUtils.safeSet(header, header.getMajorVersion, header.setMajorVersion, val);
      else if (key === "minor_version") GenUtils.safeSet(header, header.getMinorVersion, header.setMinorVersion, val);
      else if (key === "nonce") GenUtils.safeSet(header, header.getNonce, header.setNonce, val);
      else if (key === "num_txes") GenUtils.safeSet(header, header.getNumTxs, header.setNumTxs, val);
      else if (key === "orphan_status") GenUtils.safeSet(header, header.getOrphanStatus, header.setOrphanStatus, val);
      else if (key === "prev_hash" || key === "prev_id") GenUtils.safeSet(header, header.getPrevHash, header.setPrevHash, val);
      else if (key === "reward") GenUtils.safeSet(header, header.getReward, header.setReward, BigInt(val));
      else if (key === "timestamp") GenUtils.safeSet(header, header.getTimestamp, header.setTimestamp, val);
      else if (key === "block_weight") GenUtils.safeSet(header, header.getWeight, header.setWeight, val);
      else if (key === "long_term_weight") GenUtils.safeSet(header, header.getLongTermWeight, header.setLongTermWeight, val);
      else if (key === "pow_hash") GenUtils.safeSet(header, header.getPowHash, header.setPowHash, val === "" ? undefined : val);
      else if (key === "tx_hashes") {}  // used in block model, not header model
      else if (key === "miner_tx") {}   // used in block model, not header model
      else if (key === "miner_tx_hash") header.setMinerTxHash(val);
      else console.log("WARNING: ignoring unexpected block header field: '" + key + "': " + val);
    }
    return header;
  }
  
  protected static convertRpcBlock(rpcBlock) {
    
    // build block
    let block = new MoneroBlock(MoneroDaemonRpc.convertRpcBlockHeader(rpcBlock.block_header ? rpcBlock.block_header : rpcBlock) as MoneroBlock);
    block.setHex(rpcBlock.blob);
    block.setTxHashes(rpcBlock.tx_hashes === undefined ? [] : rpcBlock.tx_hashes);
    
    // build miner tx
    let rpcMinerTx = rpcBlock.json ? JSON.parse(rpcBlock.json).miner_tx : rpcBlock.miner_tx;  // may need to be parsed from json
    let minerTx = new MoneroTx();
    block.setMinerTx(minerTx);
    minerTx.setIsConfirmed(true);
    minerTx.setInTxPool(false)
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
  protected static convertRpcTx(rpcTx, tx) {
    if (rpcTx === undefined) return undefined;
    if (tx === undefined) tx = new MoneroTx();
    
    // initialize from rpc map
    let header;
    for (let key of Object.keys(rpcTx)) {
      let val = rpcTx[key];
      if (key === "tx_hash" || key === "id_hash") GenUtils.safeSet(tx, tx.getHash, tx.setHash, val);
      else if (key === "block_timestamp") {
        if (!header) header = new MoneroBlockHeader();
        GenUtils.safeSet(header, header.getTimestamp, header.setTimestamp, val);
      }
      else if (key === "block_height") {
        if (!header) header = new MoneroBlockHeader();
        GenUtils.safeSet(header, header.getHeight, header.setHeight, val);
      }
      else if (key === "last_relayed_time") GenUtils.safeSet(tx, tx.getLastRelayedTimestamp, tx.setLastRelayedTimestamp, val);
      else if (key === "receive_time" || key === "received_timestamp") GenUtils.safeSet(tx, tx.getReceivedTimestamp, tx.setReceivedTimestamp, val);
      else if (key === "confirmations") GenUtils.safeSet(tx, tx.getNumConfirmations, tx.setNumConfirmations, val); 
      else if (key === "in_pool") {
        GenUtils.safeSet(tx, tx.getIsConfirmed, tx.setIsConfirmed, !val);
        GenUtils.safeSet(tx, tx.getInTxPool, tx.setInTxPool, val);
      }
      else if (key === "double_spend_seen") GenUtils.safeSet(tx, tx.getIsDoubleSpendSeen, tx.setIsDoubleSpendSeen, val);
      else if (key === "version") GenUtils.safeSet(tx, tx.getVersion, tx.setVersion, val);
      else if (key === "extra") {
        if (typeof val === "string") console.log("WARNING: extra field as string not being asigned to int[]: " + key + ": " + val); // TODO: how to set string to int[]? - or, extra is string which can encode int[]
        else GenUtils.safeSet(tx, tx.getExtra, tx.setExtra, new Uint8Array(val));
      }
      else if (key === "vin") {
        if (val.length !== 1 || !val[0].gen) {  // ignore miner input TODO: why?
          tx.setInputs(val.map(rpcVin => MoneroDaemonRpc.convertRpcOutput(rpcVin, tx)));
        }
      }
      else if (key === "vout") tx.setOutputs(val.map(rpcOutput => MoneroDaemonRpc.convertRpcOutput(rpcOutput, tx)));
      else if (key === "rct_signatures") {
        GenUtils.safeSet(tx, tx.getRctSignatures, tx.setRctSignatures, val);
        if (val.txnFee) GenUtils.safeSet(tx, tx.getFee, tx.setFee, BigInt(val.txnFee));
      } 
      else if (key === "rctsig_prunable") GenUtils.safeSet(tx, tx.getRctSigPrunable, tx.setRctSigPrunable, val);
      else if (key === "unlock_time") GenUtils.safeSet(tx, tx.getUnlockTime, tx.setUnlockTime, val);
      else if (key === "as_json" || key === "tx_json") { }  // handled last so tx is as initialized as possible
      else if (key === "as_hex" || key === "tx_blob") GenUtils.safeSet(tx, tx.getFullHex, tx.setFullHex, val ? val : undefined);
      else if (key === "blob_size") GenUtils.safeSet(tx, tx.getSize, tx.setSize, val);
      else if (key === "weight") GenUtils.safeSet(tx, tx.getWeight, tx.setWeight, val);
      else if (key === "fee") GenUtils.safeSet(tx, tx.getFee, tx.setFee, BigInt(val));
      else if (key === "relayed") GenUtils.safeSet(tx, tx.getIsRelayed, tx.setIsRelayed, val);
      else if (key === "output_indices") GenUtils.safeSet(tx, tx.getOutputIndices, tx.setOutputIndices, val);
      else if (key === "do_not_relay") GenUtils.safeSet(tx, tx.getRelay, tx.setRelay, !val);
      else if (key === "kept_by_block") GenUtils.safeSet(tx, tx.getIsKeptByBlock, tx.setIsKeptByBlock, val);
      else if (key === "signatures") GenUtils.safeSet(tx, tx.getSignatures, tx.setSignatures, val);
      else if (key === "last_failed_height") {
        if (val === 0) GenUtils.safeSet(tx, tx.getIsFailed, tx.setIsFailed, false);
        else {
          GenUtils.safeSet(tx, tx.getIsFailed, tx.setIsFailed, true);
          GenUtils.safeSet(tx, tx.getLastFailedHeight, tx.setLastFailedHeight, val);
        }
      }
      else if (key === "last_failed_id_hash") {
        if (val === MoneroDaemonRpc.DEFAULT_ID) GenUtils.safeSet(tx, tx.getIsFailed, tx.setIsFailed, false);
        else {
          GenUtils.safeSet(tx, tx.getIsFailed, tx.setIsFailed, true);
          GenUtils.safeSet(tx, tx.getLastFailedHash, tx.setLastFailedHash, val);
        }
      }
      else if (key === "max_used_block_height") GenUtils.safeSet(tx, tx.getMaxUsedBlockHeight, tx.setMaxUsedBlockHeight, val);
      else if (key === "max_used_block_id_hash") GenUtils.safeSet(tx, tx.getMaxUsedBlockHash, tx.setMaxUsedBlockHash, val);
      else if (key === "prunable_hash") GenUtils.safeSet(tx, tx.getPrunableHash, tx.setPrunableHash, val ? val : undefined);
      else if (key === "prunable_as_hex") GenUtils.safeSet(tx, tx.getPrunableHex, tx.setPrunableHex, val ? val : undefined);
      else if (key === "pruned_as_hex") GenUtils.safeSet(tx, tx.getPrunedHex, tx.setPrunedHex, val ? val : undefined);
      else console.log("WARNING: ignoring unexpected field in rpc tx: " + key + ": " + val);
    }
    
    // link block and tx
    if (header) tx.setBlock(new MoneroBlock(header).setTxs([tx]));
    
    // TODO monerod: unconfirmed txs misreport block height and timestamp?
    if (tx.getBlock() && tx.getBlock().getHeight() !== undefined && tx.getBlock().getHeight() === tx.getBlock().getTimestamp()) {
      tx.setBlock(undefined);
      tx.setIsConfirmed(false);
    }
    
    // initialize remaining known fields
    if (tx.getIsConfirmed()) {
      GenUtils.safeSet(tx, tx.getIsRelayed, tx.setIsRelayed, true);
      GenUtils.safeSet(tx, tx.getRelay, tx.setRelay, true);
      GenUtils.safeSet(tx, tx.getIsFailed, tx.setIsFailed, false);
    } else {
      tx.setNumConfirmations(0);
    }
    if (tx.getIsFailed() === undefined) tx.setIsFailed(false);
    if (tx.getOutputIndices() && tx.getOutputs())  {
      assert.equal(tx.getOutputs().length, tx.getOutputIndices().length);
      for (let i = 0; i < tx.getOutputs().length; i++) {
        tx.getOutputs()[i].setIndex(tx.getOutputIndices()[i]);  // transfer output indices to outputs
      }
    }
    if (rpcTx.as_json) MoneroDaemonRpc.convertRpcTx(JSON.parse(rpcTx.as_json), tx);
    if (rpcTx.tx_json) MoneroDaemonRpc.convertRpcTx(JSON.parse(rpcTx.tx_json), tx);
    if (!tx.getIsRelayed()) tx.setLastRelayedTimestamp(undefined);  // TODO monerod: returns last_relayed_timestamp despite relayed: false, self inconsistent
    
    // return built transaction
    return tx;
  }
  
  protected static convertRpcOutput(rpcOutput, tx) {
    let output = new MoneroOutput();
    output.setTx(tx);
    for (let key of Object.keys(rpcOutput)) {
      let val = rpcOutput[key];
      if (key === "gen") throw new MoneroError("Output with 'gen' from daemon rpc is miner tx which we ignore (i.e. each miner input is undefined)");
      else if (key === "key") {
        GenUtils.safeSet(output, output.getAmount, output.setAmount, BigInt(val.amount));
        GenUtils.safeSet(output, output.getKeyImage, output.setKeyImage, new MoneroKeyImage(val.k_image));
        GenUtils.safeSet(output, output.getRingOutputIndices, output.setRingOutputIndices, val.key_offsets);
      }
      else if (key === "amount") GenUtils.safeSet(output, output.getAmount, output.setAmount, BigInt(val));
      else if (key === "target") {
        let pubKey = val.key === undefined ? val.tagged_key.key : val.key; // TODO (monerod): rpc json uses {tagged_key={key=...}}, binary blocks use {key=...}
        GenUtils.safeSet(output, output.getStealthPublicKey, output.setStealthPublicKey, pubKey);
      }
      else console.log("WARNING: ignoring unexpected field output: " + key + ": " + val);
    }
    return output;
  }
  
  protected static convertRpcBlockTemplate(rpcTemplate) {
    let template = new MoneroBlockTemplate();
    for (let key of Object.keys(rpcTemplate)) {
      let val = rpcTemplate[key];
      if (key === "blockhashing_blob") template.setBlockTemplateBlob(val);
      else if (key === "blocktemplate_blob") template.setBlockHashingBlob(val);
      else if (key === "difficulty") template.setDifficulty(BigInt(val));
      else if (key === "expected_reward") template.setExpectedReward(val);
      else if (key === "difficulty") { }  // handled by wide_difficulty
      else if (key === "difficulty_top64") { }  // handled by wide_difficulty
      else if (key === "wide_difficulty") template.setDifficulty(GenUtils.reconcile(template.getDifficulty(), MoneroDaemonRpc.prefixedHexToBI(val)));
      else if (key === "height") template.setHeight(val);
      else if (key === "prev_hash") template.setPrevHash(val);
      else if (key === "reserved_offset") template.setReservedOffset(val);
      else if (key === "status") {}  // handled elsewhere
      else if (key === "untrusted") {}  // handled elsewhere
      else if (key === "seed_height") template.setSeedHeight(val);
      else if (key === "seed_hash") template.setSeedHash(val);
      else if (key === "next_seed_hash") template.setNextSeedHash(val);
      else console.log("WARNING: ignoring unexpected field in block template: " + key + ": " + val);
    }
    if ("" === template.getNextSeedHash()) template.setNextSeedHash(undefined);
    return template;
  }
  
  protected static convertRpcInfo(rpcInfo) {
    if (!rpcInfo) return undefined;
    let info = new MoneroDaemonInfo();
    for (let key of Object.keys(rpcInfo)) {
      let val = rpcInfo[key];
      if (key === "version") info.setVersion(val);
      else if (key === "alt_blocks_count") info.setNumAltBlocks(val);
      else if (key === "block_size_limit") info.setBlockSizeLimit(val);
      else if (key === "block_size_median") info.setBlockSizeMedian(val);
      else if (key === "block_weight_limit") info.setBlockWeightLimit(val);
      else if (key === "block_weight_median") info.setBlockWeightMedian(val);
      else if (key === "bootstrap_daemon_address") { if (val) info.setBootstrapDaemonAddress(val); }
      else if (key === "difficulty") { }  // handled by wide_difficulty
      else if (key === "cumulative_difficulty") { } // handled by wide_cumulative_difficulty
      else if (key === "difficulty_top64") { }  // handled by wide_difficulty
      else if (key === "cumulative_difficulty_top64") { } // handled by wide_cumulative_difficulty
      else if (key === "wide_difficulty") info.setDifficulty(GenUtils.reconcile(info.getDifficulty(), MoneroDaemonRpc.prefixedHexToBI(val)));
      else if (key === "wide_cumulative_difficulty") info.setCumulativeDifficulty(GenUtils.reconcile(info.getCumulativeDifficulty(), MoneroDaemonRpc.prefixedHexToBI(val)));
      else if (key === "free_space") info.setFreeSpace(BigInt(val));
      else if (key === "database_size") info.setDatabaseSize(val);
      else if (key === "grey_peerlist_size") info.setNumOfflinePeers(val);
      else if (key === "height") info.setHeight(val);
      else if (key === "height_without_bootstrap") info.setHeightWithoutBootstrap(val);
      else if (key === "incoming_connections_count") info.setNumIncomingConnections(val);
      else if (key === "offline") info.setIsOffline(val);
      else if (key === "outgoing_connections_count") info.setNumOutgoingConnections(val);
      else if (key === "rpc_connections_count") info.setNumRpcConnections(val);
      else if (key === "start_time") info.setStartTimestamp(val);
      else if (key === "adjusted_time") info.setAdjustedTimestamp(val);
      else if (key === "status") {}  // handled elsewhere
      else if (key === "target") info.setTarget(val);
      else if (key === "target_height") info.setTargetHeight(val);
      else if (key === "top_block_hash") info.setTopBlockHash(val);
      else if (key === "tx_count") info.setNumTxs(val);
      else if (key === "tx_pool_size") info.setNumTxsPool(val);
      else if (key === "untrusted") {} // handled elsewhere
      else if (key === "was_bootstrap_ever_used") info.setWasBootstrapEverUsed(val);
      else if (key === "white_peerlist_size") info.setNumOnlinePeers(val);
      else if (key === "update_available") info.setUpdateAvailable(val);
      else if (key === "nettype") GenUtils.safeSet(info, info.getNetworkType, info.setNetworkType, MoneroNetworkType.parse(val));
      else if (key === "mainnet") { if (val) GenUtils.safeSet(info, info.getNetworkType, info.setNetworkType, MoneroNetworkType.MAINNET); }
      else if (key === "testnet") { if (val) GenUtils.safeSet(info, info.getNetworkType, info.setNetworkType, MoneroNetworkType.TESTNET); }
      else if (key === "stagenet") { if (val) GenUtils.safeSet(info, info.getNetworkType, info.setNetworkType, MoneroNetworkType.STAGENET); }
      else if (key === "credits") info.setCredits(BigInt(val));
      else if (key === "top_block_hash" || key === "top_hash") info.setTopBlockHash(GenUtils.reconcile(info.getTopBlockHash(), "" === val ? undefined : val))
      else if (key === "busy_syncing") info.setIsBusySyncing(val);
      else if (key === "synchronized") info.setIsSynchronized(val);
      else if (key === "restricted") info.setIsRestricted(val);
      else console.log("WARNING: Ignoring unexpected info field: " + key + ": " + val);
    }
    return info;
  }
  
  /**
   * Initializes sync info from RPC sync info.
   * 
   * @param rpcSyncInfo - rpc map to initialize the sync info from
   * @return {MoneroDaemonSyncInfo} is sync info initialized from the map
   */
  protected static convertRpcSyncInfo(rpcSyncInfo) {
    let syncInfo = new MoneroDaemonSyncInfo();
    for (let key of Object.keys(rpcSyncInfo)) {
      let val = rpcSyncInfo[key];
      if (key === "height") syncInfo.setHeight(val);
      else if (key === "peers") {
        syncInfo.setPeers([]);
        let rpcConnections = val;
        for (let rpcConnection of rpcConnections) {
          syncInfo.getPeers().push(MoneroDaemonRpc.convertRpcConnection(rpcConnection.info));
        }
      }
      else if (key === "spans") {
        syncInfo.setSpans([]);
        let rpcSpans = val;
        for (let rpcSpan of rpcSpans) {
          syncInfo.getSpans().push(MoneroDaemonRpc.convertRpcConnectionSpan(rpcSpan));
        }
      } else if (key === "status") {}   // handled elsewhere
      else if (key === "target_height") syncInfo.setTargetHeight(val);
      else if (key === "next_needed_pruning_seed") syncInfo.setNextNeededPruningSeed(val);
      else if (key === "overview") {  // this returns [] without pruning
        let overview;
        try {
          overview = JSON.parse(val);
          if (overview !== undefined && overview.length > 0) console.error("Ignoring non-empty 'overview' field (not implemented): " + overview); // TODO
        } catch (e: any) {
          console.error("Failed to parse 'overview' field: " + overview + ": " + e.message);
        }
      }
      else if (key === "credits") syncInfo.setCredits(BigInt(val));
      else if (key === "top_hash") syncInfo.setTopBlockHash("" === val ? undefined : val);
      else if (key === "untrusted") {}  // handled elsewhere
      else console.log("WARNING: ignoring unexpected field in sync info: " + key + ": " + val);
    }
    return syncInfo;
  }
  
  protected static convertRpcHardForkInfo(rpcHardForkInfo) {
    let info = new MoneroHardForkInfo();
    for (let key of Object.keys(rpcHardForkInfo)) {
      let val = rpcHardForkInfo[key];
      if (key === "earliest_height") info.setEarliestHeight(val);
      else if (key === "enabled") info.setIsEnabled(val);
      else if (key === "state") info.setState(val);
      else if (key === "status") {}     // handled elsewhere
      else if (key === "untrusted") {}  // handled elsewhere
      else if (key === "threshold") info.setThreshold(val);
      else if (key === "version") info.setVersion(val);
      else if (key === "votes") info.setNumVotes(val);
      else if (key === "voting") info.setVoting(val);
      else if (key === "window") info.setWindow(val);
      else if (key === "credits") info.setCredits(BigInt(val));
      else if (key === "top_hash") info.setTopBlockHash("" === val ? undefined : val);
      else console.log("WARNING: ignoring unexpected field in hard fork info: " + key + ": " + val);
    }
    return info;
  }
  
  protected static convertRpcConnectionSpan(rpcConnectionSpan) {
    let span = new MoneroConnectionSpan();
    for (let key of Object.keys(rpcConnectionSpan)) {
      let val = rpcConnectionSpan[key];
      if (key === "connection_id") span.setConnectionId(val);
      else if (key === "nblocks") span.setNumBlocks(val);
      else if (key === "rate") span.setRate(val);
      else if (key === "remote_address") { if (val !== "") span.setRemoteAddress(val); }
      else if (key === "size") span.setSize(val);
      else if (key === "speed") span.setSpeed(val);
      else if (key === "start_block_height") span.setStartHeight(val);
      else console.log("WARNING: ignoring unexpected field in daemon connection span: " + key + ": " + val);
    }
    return span;
  }
  
  protected static convertRpcOutputHistogramEntry(rpcEntry) {
    let entry = new MoneroOutputHistogramEntry();
    for (let key of Object.keys(rpcEntry)) {
      let val = rpcEntry[key];
      if (key === "amount") entry.setAmount(BigInt(val));
      else if (key === "total_instances") entry.setNumInstances(val);
      else if (key === "unlocked_instances") entry.setNumUnlockedInstances(val);
      else if (key === "recent_instances") entry.setNumRecentInstances(val);
      else console.log("WARNING: ignoring unexpected field in output histogram: " + key + ": " + val);
    }
    return entry;
  }
  
  protected static convertRpcSubmitTxResult(rpcResult) {
    assert(rpcResult);
    let result = new MoneroSubmitTxResult();
    for (let key of Object.keys(rpcResult)) {
      let val = rpcResult[key];
      if (key === "double_spend") result.setIsDoubleSpendSeen(val);
      else if (key === "fee_too_low") result.setIsFeeTooLow(val);
      else if (key === "invalid_input") result.setHasInvalidInput(val);
      else if (key === "invalid_output") result.setHasInvalidOutput(val);
      else if (key === "too_few_outputs") result.setHasTooFewOutputs(val);
      else if (key === "low_mixin") result.setIsMixinTooLow(val);
      else if (key === "not_relayed") result.setIsRelayed(!val);
      else if (key === "overspend") result.setIsOverspend(val);
      else if (key === "reason") result.setReason(val === "" ? undefined : val);
      else if (key === "too_big") result.setIsTooBig(val);
      else if (key === "sanity_check_failed") result.setSanityCheckFailed(val);
      else if (key === "credits") result.setCredits(BigInt(val))
      else if (key === "status" || key === "untrusted") {}  // handled elsewhere
      else if (key === "top_hash") result.setTopBlockHash("" === val ? undefined : val);
      else if (key === "tx_extra_too_big") result.setIsTxExtraTooBig(val);
      else console.log("WARNING: ignoring unexpected field in submit tx hex result: " + key + ": " + val);
    }
    return result;
  }
  
  protected static convertRpcTxPoolStats(rpcStats) {
    assert(rpcStats);
    let stats = new MoneroTxPoolStats();
    for (let key of Object.keys(rpcStats)) {
      let val = rpcStats[key];
      if (key === "bytes_max") stats.setBytesMax(val);
      else if (key === "bytes_med") stats.setBytesMed(val);
      else if (key === "bytes_min") stats.setBytesMin(val);
      else if (key === "bytes_total") stats.setBytesTotal(val);
      else if (key === "histo_98pc") stats.setHisto98pc(val);
      else if (key === "num_10m") stats.setNum10m(val);
      else if (key === "num_double_spends") stats.setNumDoubleSpends(val);
      else if (key === "num_failing") stats.setNumFailing(val);
      else if (key === "num_not_relayed") stats.setNumNotRelayed(val);
      else if (key === "oldest") stats.setOldestTimestamp(val);
      else if (key === "txs_total") stats.setNumTxs(val);
      else if (key === "fee_total") stats.setFeeTotal(BigInt(val));
      else if (key === "histo") {
        stats.setHisto(new Map());
        for (let elem of val) stats.getHisto().set(elem.bytes, elem.txs);
      }
      else console.log("WARNING: ignoring unexpected field in tx pool stats: " + key + ": " + val);
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
  
  protected static convertRpcAltChain(rpcChain) {
    assert(rpcChain);
    let chain = new MoneroAltChain();
    for (let key of Object.keys(rpcChain)) {
      let val = rpcChain[key];
      if (key === "block_hash") {}  // using block_hashes instead
      else if (key === "difficulty") { } // handled by wide_difficulty
      else if (key === "difficulty_top64") { }  // handled by wide_difficulty
      else if (key === "wide_difficulty") chain.setDifficulty(GenUtils.reconcile(chain.getDifficulty(), MoneroDaemonRpc.prefixedHexToBI(val)));
      else if (key === "height") chain.setHeight(val);
      else if (key === "length") chain.setLength(val);
      else if (key === "block_hashes") chain.setBlockHashes(val);
      else if (key === "main_chain_parent_block") chain.setMainChainParentBlockHash(val);
      else console.log("WARNING: ignoring unexpected field in alternative chain: " + key + ": " + val);
    }
    return chain;
  }
  
  protected static convertRpcPeer(rpcPeer) {
    assert(rpcPeer);
    let peer = new MoneroPeer();
    for (let key of Object.keys(rpcPeer)) {
      let val = rpcPeer[key];
      if (key === "host") peer.setHost(val);
      else if (key === "id") peer.setId("" + val);  // TODO monero-wallet-rpc: peer id is BigInt but string in `get_connections`
      else if (key === "ip") {} // host used instead which is consistently a string
      else if (key === "last_seen") peer.setLastSeenTimestamp(val);
      else if (key === "port") peer.setPort(val);
      else if (key === "rpc_port") peer.setRpcPort(val);
      else if (key === "pruning_seed") peer.setPruningSeed(val);
      else if (key === "rpc_credits_per_hash") peer.setRpcCreditsPerHash(BigInt(val));
      else console.log("WARNING: ignoring unexpected field in rpc peer: " + key + ": " + val);
    }
    return peer;
  }
  
  protected static convertRpcConnection(rpcConnection) {
    let peer = new MoneroPeer();
    peer.setIsOnline(true);
    for (let key of Object.keys(rpcConnection)) {
      let val = rpcConnection[key];
      if (key === "address") peer.setAddress(val);
      else if (key === "avg_download") peer.setAvgDownload(val);
      else if (key === "avg_upload") peer.setAvgUpload(val);
      else if (key === "connection_id") peer.setId(val);
      else if (key === "current_download") peer.setCurrentDownload(val);
      else if (key === "current_upload") peer.setCurrentUpload(val);
      else if (key === "height") peer.setHeight(val);
      else if (key === "host") peer.setHost(val);
      else if (key === "ip") {} // host used instead which is consistently a string
      else if (key === "incoming") peer.setIsIncoming(val);
      else if (key === "live_time") peer.setLiveTime(val);
      else if (key === "local_ip") peer.setIsLocalIp(val);
      else if (key === "localhost") peer.setIsLocalHost(val);
      else if (key === "peer_id") peer.setId(val);
      else if (key === "port") peer.setPort(parseInt(val));
      else if (key === "rpc_port") peer.setRpcPort(val);
      else if (key === "recv_count") peer.setNumReceives(val);
      else if (key === "recv_idle_time") peer.setReceiveIdleTime(val);
      else if (key === "send_count") peer.setNumSends(val);
      else if (key === "send_idle_time") peer.setSendIdleTime(val);
      else if (key === "state") peer.setState(val);
      else if (key === "support_flags") peer.setNumSupportFlags(val);
      else if (key === "pruning_seed") peer.setPruningSeed(val);
      else if (key === "rpc_credits_per_hash") peer.setRpcCreditsPerHash(BigInt(val));
      else if (key === "address_type") peer.setType(val);
      else console.log("WARNING: ignoring unexpected field in peer: " + key + ": " + val);
    }
    return peer;
  }
  
  protected static convertToRpcBan(ban: MoneroBan) {
    let rpcBan: any = {};
    rpcBan.host = ban.getHost();
    rpcBan.ip = ban.getIp();
    rpcBan.ban = ban.getIsBanned();
    rpcBan.seconds = ban.getSeconds();
    return rpcBan;
  }
  
  protected static convertRpcMiningStatus(rpcStatus) {
    let status = new MoneroMiningStatus();
    status.setIsActive(rpcStatus.active);
    status.setSpeed(rpcStatus.speed);
    status.setNumThreads(rpcStatus.threads_count);
    if (rpcStatus.active) {
      status.setAddress(rpcStatus.address);
      status.setIsBackground(rpcStatus.is_background_mining_enabled);
    }
    return status;
  }
  
  protected static convertRpcUpdateCheckResult(rpcResult) {
    assert(rpcResult);
    let result = new MoneroDaemonUpdateCheckResult();
    for (let key of Object.keys(rpcResult)) {
      let val = rpcResult[key];
      if (key === "auto_uri") result.setAutoUri(val);
      else if (key === "hash") result.setHash(val);
      else if (key === "path") {} // handled elsewhere
      else if (key === "status") {} // handled elsewhere
      else if (key === "update") result.setIsUpdateAvailable(val);
      else if (key === "user_uri") result.setUserUri(val);
      else if (key === "version") result.setVersion(val);
      else if (key === "untrusted") {} // handled elsewhere
      else console.log("WARNING: ignoring unexpected field in rpc check update result: " + key + ": " + val);
    }
    if (result.getAutoUri() === "") result.setAutoUri(undefined);
    if (result.getUserUri() === "") result.setUserUri(undefined);
    if (result.getVersion() === "") result.setVersion(undefined);
    if (result.getHash() === "") result.setHash(undefined);
    return result;
  }
  
  protected static convertRpcUpdateDownloadResult(rpcResult) {
    let result = new MoneroDaemonUpdateDownloadResult(MoneroDaemonRpc.convertRpcUpdateCheckResult(rpcResult) as MoneroDaemonUpdateDownloadResult);
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
  protected static prefixedHexToBI(hex) {
    assert(hex.substring(0, 2) === "0x");
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
  private daemonId: any;
  private worker: any;
  private wrappedListeners: any;
  private process: any;

  constructor(daemonId, worker) {
    this.daemonId = daemonId;
    this.worker = worker;
    this.wrappedListeners = [];
  }
  
  // --------------------------- STATIC UTILITIES -----------------------------
  
  static async connect(config) {
    let daemonId = GenUtils.getUUID();
    config = Object.assign({}, config, {proxyToWorker: false});
    await LibraryUtils.invokeWorker(daemonId, "connectDaemonRpc", [config]);
    return new MoneroDaemonRpcProxy(daemonId, await LibraryUtils.getWorker());
  }
  
  // ---------------------------- INSTANCE METHODS ----------------------------
  
  async addListener(listener) {
    let wrappedListener = new DaemonWorkerListener(listener);
    let listenerId = wrappedListener.getId();
    LibraryUtils.addWorkerCallback(this.daemonId, "onBlockHeader_" + listenerId, [wrappedListener.onBlockHeader, wrappedListener]);
    this.wrappedListeners.push(wrappedListener);
    return this.invokeWorker("daemonAddListener", [listenerId]);
  }
  
  async removeListener(listener) {
    for (let i = 0; i < this.wrappedListeners.length; i++) {
      if (this.wrappedListeners[i].getListener() === listener) {
        let listenerId = this.wrappedListeners[i].getId();
        await this.invokeWorker("daemonRemoveListener", [listenerId]);
        LibraryUtils.removeWorkerCallback(this.daemonId, "onBlockHeader_" + listenerId);
        this.wrappedListeners.splice(i, 1);
        return;
      }
    }
    throw new MoneroError("Listener is not registered with daemon");
  }
  
  async getListeners() {
    let listeners = [];
    for (let wrappedListener of this.wrappedListeners) listeners.push(wrappedListener.getListener());
    return listeners;
  }
  
  async getRpcConnection() {
    let config = await this.invokeWorker("daemonGetRpcConnection");
    return new MoneroRpcConnection(config as Partial<MoneroRpcConnection>);
  }
  
  async isConnected() {
    return this.invokeWorker("daemonIsConnected");
  }
  
  async getVersion() {
    let versionJson: any = await this.invokeWorker("daemonGetVersion");
    return new MoneroVersion(versionJson.number, versionJson.isRelease);
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
    return new MoneroBlockTemplate(await this.invokeWorker("daemonGetBlockTemplate", Array.from(arguments)));
  }
  
  async getLastBlockHeader() {
    return new MoneroBlockHeader(await this.invokeWorker("daemonGetLastBlockHeader"));
  }
  
  async getBlockHeaderByHash(blockHash) {
    return new MoneroBlockHeader(await this.invokeWorker("daemonGetBlockHeaderByHash", Array.from(arguments)));
  }
  
  async getBlockHeaderByHeight(height) {
    return new MoneroBlockHeader(await this.invokeWorker("daemonGetBlockHeaderByHeight", Array.from(arguments)));
  }
  
  async getBlockHeadersByRange(startHeight, endHeight) {
    let blockHeadersJson: any[] = await this.invokeWorker("daemonGetBlockHeadersByRange", Array.from(arguments)) as any[];
    let headers = [];
    for (let blockHeaderJson of blockHeadersJson) headers.push(new MoneroBlockHeader(blockHeaderJson));
    return headers;
  }
  
  async getBlockByHash(blockHash) {
    return new MoneroBlock(await this.invokeWorker("daemonGetBlockByHash", Array.from(arguments)), MoneroBlock.DeserializationType.TX);
  }
  
  async getBlocksByHash(blockHashes, startHeight, prune) {
    let blocksJson: any[] = await this.invokeWorker("daemonGetBlocksByHash", Array.from(arguments)) as any[];
    let blocks = [];
    for (let blockJson of blocksJson) blocks.push(new MoneroBlock(blockJson));
    return blocks;
  }
  
  async getBlockByHeight(height) {
    return new MoneroBlock(await this.invokeWorker("daemonGetBlockByHeight", Array.from(arguments)), MoneroBlock.DeserializationType.TX);
  }
  
  async getBlocksByHeight(heights) {
    let blocksJson: any[]= await this.invokeWorker("daemonGetBlocksByHeight", Array.from(arguments)) as any[];
    let blocks = [];
    for (let blockJson of blocksJson) blocks.push(new MoneroBlock(blockJson, MoneroBlock.DeserializationType.TX));
    return blocks;
  }
  
  async getBlocksByRange(startHeight, endHeight) {
    let blocksJson: any[] = await this.invokeWorker("daemonGetBlocksByRange", Array.from(arguments)) as any[];
    let blocks = [];
    for (let blockJson of blocksJson) blocks.push(new MoneroBlock(blockJson, MoneroBlock.DeserializationType.TX));
    return blocks;
  }
  
  async getBlocksByRangeChunked(startHeight, endHeight, maxChunkSize) {
    let blocksJson = await this.invokeWorker("daemonGetBlocksByRangeChunked", Array.from(arguments)) as any[];
    let blocks = [];
    for (let blockJson of blocksJson) blocks.push(new MoneroBlock(blockJson, MoneroBlock.DeserializationType.TX));
    return blocks;
  }
  
  async getBlockHashes(blockHashes, startHeight) {
    return this.invokeWorker("daemonGetBlockHashes", Array.from(arguments));
  }
  
  async getTxs(txHashes, prune = false) {
    
    // deserialize txs from blocks
    let blocks = [];
    for (let blockJson of await this.invokeWorker("daemonGetTxs", Array.from(arguments)) as any[]) {
      blocks.push(new MoneroBlock(blockJson, MoneroBlock.DeserializationType.TX));
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
    return new MoneroMinerTxSum(await this.invokeWorker("daemonGetMinerTxSum", Array.from(arguments)));
  }
  
  async getFeeEstimate(graceBlocks?) {
    return new MoneroFeeEstimate(await this.invokeWorker("daemonGetFeeEstimate", Array.from(arguments)));
  }
  
  async submitTxHex(txHex, doNotRelay) {
    return new MoneroSubmitTxResult(await this.invokeWorker("daemonSubmitTxHex", Array.from(arguments)));
  }
  
  async relayTxsByHash(txHashes) {
    return this.invokeWorker("daemonRelayTxsByHash", Array.from(arguments));
  }
  
  async getTxPool() {
    let blockJson = await this.invokeWorker("daemonGetTxPool");
    let txs = new MoneroBlock(blockJson, MoneroBlock.DeserializationType.TX).getTxs();
    for (let tx of txs) tx.setBlock(undefined);
    return txs ? txs : [];
  }
  
  async getTxPoolHashes() {
    return this.invokeWorker("daemonGetTxPoolHashes", Array.from(arguments));
  }
  
  async getTxPoolBacklog() {
    throw new MoneroError("Not implemented");
  }
  
  async getTxPoolStats() {
    return new MoneroTxPoolStats(await this.invokeWorker("daemonGetTxPoolStats"));
  }
  
  async flushTxPool(hashes) {
    return this.invokeWorker("daemonFlushTxPool", Array.from(arguments));
  }
  
  async getKeyImageSpentStatuses(keyImages) {
    return this.invokeWorker("daemonGetKeyImageSpentStatuses", Array.from(arguments));
  }
  
  async getOutputs(outputs): Promise<MoneroOutput[]> {
    throw new MoneroError("Not implemented");
  }
  
  async getOutputHistogram(amounts, minCount, maxCount, isUnlocked, recentCutoff) {
    let entries = [];
    for (let entryJson of await this.invokeWorker("daemonGetOutputHistogram", [amounts, minCount, maxCount, isUnlocked, recentCutoff]) as any[]) {
      entries.push(new MoneroOutputHistogramEntry(entryJson));
    }
    return entries;
  }
  
  async getOutputDistribution(amounts, cumulative, startHeight, endHeight) {
    throw new MoneroError("Not implemented");
  }
  
  async getInfo() {
    return new MoneroDaemonInfo(await this.invokeWorker("daemonGetInfo"));
  }
  
  async getSyncInfo() {
    return new MoneroDaemonSyncInfo(await this.invokeWorker("daemonGetSyncInfo"));
  }
  
  async getHardForkInfo() {
    return new MoneroHardForkInfo(await this.invokeWorker("daemonGetHardForkInfo"));
  }
  
  async getAltChains() {
    let altChains = [];
    for (let altChainJson of await this.invokeWorker("daemonGetAltChains") as any) altChains.push(new MoneroAltChain(altChainJson));
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
    for (let peerJson of await this.invokeWorker("daemonGetPeers") as any) peers.push(new MoneroPeer(peerJson));
    return peers;
  }
  
  async getKnownPeers() {
    let peers = [];
    for (let peerJson of await this.invokeWorker("daemonGetKnownPeers") as any) peers.push(new MoneroPeer(peerJson));
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
    for (let banJson of await this.invokeWorker("daemonGetPeerBans") as any) bans.push(new MoneroBan(banJson));
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
    await this.invokeWorker("daemonStopMining")
  }
  
  async getMiningStatus() {
    return new MoneroMiningStatus(await this.invokeWorker("daemonGetMiningStatus"));
  }
  
  async submitBlocks(blockBlobs) {
    throw new MoneroError("Not implemented");
  }

  async pruneBlockchain(check) {
    return new MoneroPruneResult(await this.invokeWorker("daemonPruneBlockchain"));
  }
  
  async checkForUpdate(): Promise<MoneroDaemonUpdateCheckResult> {
    throw new MoneroError("Not implemented");
  }
  
  async downloadUpdate(path): Promise<MoneroDaemonUpdateDownloadResult> {
    throw new MoneroError("Not implemented");
  }
  
  async stop() {
    while (this.wrappedListeners.length) await this.removeListener(this.wrappedListeners[0].getListener());
    return this.invokeWorker("daemonStop");
  }
  
  async waitForNextBlockHeader() {
    return new MoneroBlockHeader(await this.invokeWorker("daemonWaitForNextBlockHeader"));
  }
  
  // --------------------------- PRIVATE HELPERS ------------------------------
  
  // TODO: duplicated with MoneroWalletFullProxy
  protected async invokeWorker(fnName: string, args?: any) {
    return LibraryUtils.invokeWorker(this.daemonId, fnName, args);
  }
}

/**
 * Polls a Monero daemon for updates and notifies listeners as they occur.
 * 
 * @private
 */
class DaemonPoller {

  protected daemon: MoneroDaemonRpc;
  protected looper: TaskLooper;
  protected isPolling: boolean;
  protected lastHeader: MoneroBlockHeader;

  constructor(daemon) {
    let that = this;
    this.daemon = daemon;
    this.looper = new TaskLooper(async function() { await that.poll(); });
  }
  
  setIsPolling(isPolling: boolean) {
    this.isPolling = isPolling;
    if (isPolling) this.looper.start(this.daemon.getPollInterval());
    else this.looper.stop();
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

  protected id: any;
  protected listener: any;

  constructor(listener) {
    this.id = GenUtils.getUUID();
    this.listener = listener;
  }
  
  getId() {
    return this.id;
  }
  
  getListener() {
    return this.listener;
  }
  
  async onBlockHeader(headerJson) {
    return this.listener.onBlockHeader(new MoneroBlockHeader(headerJson));
  }
}

export default MoneroDaemonRpc;
