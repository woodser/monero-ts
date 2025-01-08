/// <reference types="node" />
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
import MoneroHardForkInfo from "./model/MoneroHardForkInfo";
import MoneroKeyImageSpentStatus from "./model/MoneroKeyImageSpentStatus";
import MoneroMinerTxSum from "./model/MoneroMinerTxSum";
import MoneroMiningStatus from "./model/MoneroMiningStatus";
import MoneroOutput from "./model/MoneroOutput";
import MoneroOutputHistogramEntry from "./model/MoneroOutputHistogramEntry";
import MoneroPeer from "./model/MoneroPeer";
import MoneroPruneResult from "./model/MoneroPruneResult";
import MoneroRpcConnection from "../common/MoneroRpcConnection";
import MoneroSubmitTxResult from "./model/MoneroSubmitTxResult";
import MoneroTx from "./model/MoneroTx";
import MoneroTxPoolStats from "./model/MoneroTxPoolStats";
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
declare class MoneroDaemonRpc extends MoneroDaemon {
    protected static readonly MAX_REQ_SIZE = "3000000";
    protected static readonly DEFAULT_ID = "0000000000000000000000000000000000000000000000000000000000000000";
    protected static readonly NUM_HEADERS_PER_REQ = 750;
    protected static readonly DEFAULT_POLL_PERIOD = 20000;
    protected config: Partial<MoneroDaemonConfig>;
    protected listeners: MoneroDaemonListener[];
    protected cachedHeaders: any;
    protected process: any;
    protected pollListener: any;
    protected proxyDaemon: any;
    /** @private */
    constructor(config: MoneroDaemonConfig, proxyDaemon: MoneroDaemonRpcProxy);
    /**
     * Get the internal process running monerod.
     *
     * @return {ChildProcess} the node process running monerod, undefined if not created from new process
     */
    getProcess(): ChildProcess;
    /**
     * Stop the internal process running monerod, if applicable.
     *
     * @param {boolean} [force] specifies if the process should be destroyed forcibly (default false)
     * @return {Promise<number | undefined>} the exit code from stopping the process
     */
    stopProcess(force?: boolean): Promise<number | undefined>;
    addListener(listener: MoneroDaemonListener): Promise<void>;
    removeListener(listener: MoneroDaemonListener): Promise<void>;
    getListeners(): MoneroDaemonListener[];
    /**
     * Get the daemon's RPC connection.
     *
     * @return {MoneroRpcConnection} the daemon's rpc connection
     */
    getRpcConnection(): Promise<any>;
    isConnected(): Promise<boolean>;
    getVersion(): Promise<MoneroVersion>;
    isTrusted(): Promise<boolean>;
    getHeight(): Promise<number>;
    getBlockHash(height: number): Promise<string>;
    getBlockTemplate(walletAddress: string, reserveSize?: number): Promise<MoneroBlockTemplate>;
    getLastBlockHeader(): Promise<MoneroBlockHeader>;
    getBlockHeaderByHash(blockHash: string): Promise<MoneroBlockHeader>;
    getBlockHeaderByHeight(height: number): Promise<MoneroBlockHeader>;
    getBlockHeadersByRange(startHeight?: number, endHeight?: number): Promise<MoneroBlockHeader[]>;
    getBlockByHash(blockHash: string): Promise<MoneroBlock>;
    getBlockByHeight(height: number): Promise<MoneroBlock>;
    getBlocksByHeight(heights: number[]): Promise<MoneroBlock[]>;
    getBlocksByRange(startHeight?: number, endHeight?: number): Promise<MoneroBlock[]>;
    getBlocksByRangeChunked(startHeight?: number, endHeight?: number, maxChunkSize?: number): Promise<MoneroBlock[]>;
    getTxs(txHashes: string[], prune?: boolean): Promise<MoneroTx[]>;
    getTxHexes(txHashes: string[], prune?: boolean): Promise<string[]>;
    getMinerTxSum(height: number, numBlocks: number): Promise<MoneroMinerTxSum>;
    getFeeEstimate(graceBlocks?: number): Promise<MoneroFeeEstimate>;
    submitTxHex(txHex: string, doNotRelay: boolean): Promise<MoneroSubmitTxResult>;
    relayTxsByHash(txHashes: string[]): Promise<void>;
    getTxPool(): Promise<MoneroTx[]>;
    getTxPoolHashes(): Promise<string[]>;
    getTxPoolStats(): Promise<MoneroTxPoolStats>;
    flushTxPool(hashes?: string | string[]): Promise<void>;
    getKeyImageSpentStatuses(keyImages: string[]): Promise<MoneroKeyImageSpentStatus[]>;
    getOutputHistogram(amounts?: bigint[], minCount?: number, maxCount?: number, isUnlocked?: boolean, recentCutoff?: number): Promise<MoneroOutputHistogramEntry[]>;
    getOutputDistribution(amounts: any, cumulative: any, startHeight: any, endHeight: any): Promise<any>;
    getInfo(): Promise<MoneroDaemonInfo>;
    getSyncInfo(): Promise<MoneroDaemonSyncInfo>;
    getHardForkInfo(): Promise<MoneroHardForkInfo>;
    getAltChains(): Promise<MoneroAltChain[]>;
    getAltBlockHashes(): Promise<string[]>;
    getDownloadLimit(): Promise<number>;
    setDownloadLimit(limit: number): Promise<number>;
    resetDownloadLimit(): Promise<number>;
    getUploadLimit(): Promise<number>;
    setUploadLimit(limit: number): Promise<number>;
    resetUploadLimit(): Promise<number>;
    getPeers(): Promise<MoneroPeer[]>;
    getKnownPeers(): Promise<MoneroPeer[]>;
    setOutgoingPeerLimit(limit: number): Promise<void>;
    setIncomingPeerLimit(limit: number): Promise<void>;
    getPeerBans(): Promise<MoneroBan[]>;
    setPeerBans(bans: MoneroBan[]): Promise<void>;
    startMining(address: string, numThreads?: number, isBackground?: boolean, ignoreBattery?: boolean): Promise<void>;
    stopMining(): Promise<void>;
    getMiningStatus(): Promise<MoneroMiningStatus>;
    submitBlocks(blockBlobs: string[]): Promise<void>;
    pruneBlockchain(check: boolean): Promise<MoneroPruneResult>;
    checkForUpdate(): Promise<MoneroDaemonUpdateCheckResult>;
    downloadUpdate(path?: string): Promise<MoneroDaemonUpdateDownloadResult>;
    stop(): Promise<void>;
    waitForNextBlockHeader(): Promise<MoneroBlockHeader>;
    getPollInterval(): number;
    getTx(txHash?: string, prune?: boolean): Promise<MoneroTx | undefined>;
    getTxHex(txHash: string, prune?: boolean): Promise<string>;
    getKeyImageSpentStatus(keyImage: string): Promise<MoneroKeyImageSpentStatus>;
    setPeerBan(ban: MoneroBan): Promise<void>;
    submitBlock(blockBlob: string): Promise<void>;
    protected refreshListening(): void;
    protected getBandwidthLimits(): Promise<any[]>;
    protected setBandwidthLimits(downLimit: any, upLimit: any): Promise<any[]>;
    /**
     * Get a contiguous chunk of blocks starting from a given height up to a maximum
     * height or amount of block data fetched from the blockchain, whichever comes first.
     *
     * @param {number} [startHeight] - start height to retrieve blocks (default 0)
     * @param {number} [maxHeight] - maximum end height to retrieve blocks (default blockchain height)
     * @param {number} [maxReqSize] - maximum amount of block data to fetch from the blockchain in bytes (default 3,000,000 bytes)
     * @return {MoneroBlock[]} are the resulting chunk of blocks
     */
    protected getMaxBlocks(startHeight: any, maxHeight: any, maxReqSize: any): Promise<MoneroBlock[]>;
    /**
     * Retrieves a header by height from the cache or fetches and caches a header
     * range if not already in the cache.
     *
     * @param {number} height - height of the header to retrieve from the cache
     * @param {number} maxHeight - maximum height of headers to cache
     */
    protected getBlockHeaderByHeightCached(height: any, maxHeight: any): Promise<any>;
    static connectToDaemonRpc(uriOrConfig: string | Partial<MoneroRpcConnection> | Partial<MoneroDaemonConfig> | string[], username?: string, password?: string): Promise<MoneroDaemonRpc>;
    protected static startMonerodProcess(config: MoneroDaemonConfig): Promise<MoneroDaemonRpc>;
    protected static normalizeConfig(uriOrConfig: string | Partial<MoneroRpcConnection> | Partial<MoneroDaemonConfig> | string[], username?: string, password?: string): MoneroDaemonConfig;
    protected static checkResponseStatus(resp: any): void;
    protected static convertRpcBlockHeader(rpcHeader: any): MoneroBlockHeader;
    protected static convertRpcBlock(rpcBlock: any): MoneroBlock;
    /**
     * Transfers RPC tx fields to a given MoneroTx without overwriting previous values.
     *
     * TODO: switch from safe set
     *
     * @param rpcTx - RPC map containing transaction fields
     * @param tx  - MoneroTx to populate with values (optional)
     * @return tx - same tx that was passed in or a new one if none given
     */
    protected static convertRpcTx(rpcTx: any, tx: any): any;
    protected static convertRpcOutput(rpcOutput: any, tx: any): MoneroOutput;
    protected static convertRpcBlockTemplate(rpcTemplate: any): MoneroBlockTemplate;
    protected static convertRpcInfo(rpcInfo: any): MoneroDaemonInfo;
    /**
     * Initializes sync info from RPC sync info.
     *
     * @param rpcSyncInfo - rpc map to initialize the sync info from
     * @return {MoneroDaemonSyncInfo} is sync info initialized from the map
     */
    protected static convertRpcSyncInfo(rpcSyncInfo: any): MoneroDaemonSyncInfo;
    protected static convertRpcHardForkInfo(rpcHardForkInfo: any): MoneroHardForkInfo;
    protected static convertRpcConnectionSpan(rpcConnectionSpan: any): MoneroConnectionSpan;
    protected static convertRpcOutputHistogramEntry(rpcEntry: any): MoneroOutputHistogramEntry;
    protected static convertRpcSubmitTxResult(rpcResult: any): MoneroSubmitTxResult;
    protected static convertRpcTxPoolStats(rpcStats: any): MoneroTxPoolStats;
    protected static convertRpcAltChain(rpcChain: any): MoneroAltChain;
    protected static convertRpcPeer(rpcPeer: any): MoneroPeer;
    protected static convertRpcConnection(rpcConnection: any): MoneroPeer;
    protected static convertToRpcBan(ban: MoneroBan): any;
    protected static convertRpcMiningStatus(rpcStatus: any): MoneroMiningStatus;
    protected static convertRpcUpdateCheckResult(rpcResult: any): MoneroDaemonUpdateCheckResult;
    protected static convertRpcUpdateDownloadResult(rpcResult: any): MoneroDaemonUpdateDownloadResult;
    /**
     * Converts a '0x' prefixed hexidecimal string to a bigint.
     *
     * @param {string} hex is the '0x' prefixed hexidecimal string to convert
     * @return {bigint} the hexicedimal converted to decimal
     */
    protected static prefixedHexToBI(hex: any): bigint;
}
/**
 * Implements a MoneroDaemon by proxying requests to a worker.
 *
 * @private
 */
declare class MoneroDaemonRpcProxy {
    private daemonId;
    private worker;
    private wrappedListeners;
    private process;
    constructor(daemonId: any, worker: any);
    static connect(config: MoneroDaemonConfig): Promise<MoneroDaemonRpcProxy>;
    addListener(listener: any): Promise<unknown>;
    removeListener(listener: any): Promise<void>;
    getListeners(): Promise<any[]>;
    getRpcConnection(): Promise<MoneroRpcConnection>;
    isConnected(): Promise<unknown>;
    getVersion(): Promise<MoneroVersion>;
    isTrusted(): Promise<unknown>;
    getHeight(): Promise<unknown>;
    getBlockHash(height: any): Promise<unknown>;
    getBlockTemplate(walletAddress: any, reserveSize: any): Promise<MoneroBlockTemplate>;
    getLastBlockHeader(): Promise<MoneroBlockHeader>;
    getBlockHeaderByHash(blockHash: any): Promise<MoneroBlockHeader>;
    getBlockHeaderByHeight(height: any): Promise<MoneroBlockHeader>;
    getBlockHeadersByRange(startHeight: any, endHeight: any): Promise<any[]>;
    getBlockByHash(blockHash: any): Promise<MoneroBlock>;
    getBlocksByHash(blockHashes: any, startHeight: any, prune: any): Promise<any[]>;
    getBlockByHeight(height: any): Promise<MoneroBlock>;
    getBlocksByHeight(heights: any): Promise<any[]>;
    getBlocksByRange(startHeight: any, endHeight: any): Promise<any[]>;
    getBlocksByRangeChunked(startHeight: any, endHeight: any, maxChunkSize: any): Promise<any[]>;
    getBlockHashes(blockHashes: any, startHeight: any): Promise<unknown>;
    getTxs(txHashes: any, prune?: boolean): Promise<any[]>;
    getTxHexes(txHashes: any, prune?: boolean): Promise<unknown>;
    getMinerTxSum(height: any, numBlocks: any): Promise<MoneroMinerTxSum>;
    getFeeEstimate(graceBlocks?: any): Promise<MoneroFeeEstimate>;
    submitTxHex(txHex: any, doNotRelay: any): Promise<MoneroSubmitTxResult>;
    relayTxsByHash(txHashes: any): Promise<unknown>;
    getTxPool(): Promise<MoneroTx[]>;
    getTxPoolHashes(): Promise<unknown>;
    getTxPoolBacklog(): Promise<void>;
    getTxPoolStats(): Promise<MoneroTxPoolStats>;
    flushTxPool(hashes: any): Promise<unknown>;
    getKeyImageSpentStatuses(keyImages: any): Promise<unknown>;
    getOutputs(outputs: any): Promise<MoneroOutput[]>;
    getOutputHistogram(amounts: any, minCount: any, maxCount: any, isUnlocked: any, recentCutoff: any): Promise<any[]>;
    getOutputDistribution(amounts: any, cumulative: any, startHeight: any, endHeight: any): Promise<void>;
    getInfo(): Promise<MoneroDaemonInfo>;
    getSyncInfo(): Promise<MoneroDaemonSyncInfo>;
    getHardForkInfo(): Promise<MoneroHardForkInfo>;
    getAltChains(): Promise<any[]>;
    getAltBlockHashes(): Promise<unknown>;
    getDownloadLimit(): Promise<unknown>;
    setDownloadLimit(limit: any): Promise<unknown>;
    resetDownloadLimit(): Promise<unknown>;
    getUploadLimit(): Promise<unknown>;
    setUploadLimit(limit: any): Promise<unknown>;
    resetUploadLimit(): Promise<unknown>;
    getPeers(): Promise<any[]>;
    getKnownPeers(): Promise<any[]>;
    setOutgoingPeerLimit(limit: any): Promise<unknown>;
    setIncomingPeerLimit(limit: any): Promise<unknown>;
    getPeerBans(): Promise<any[]>;
    setPeerBans(bans: any): Promise<unknown>;
    startMining(address: any, numThreads: any, isBackground: any, ignoreBattery: any): Promise<unknown>;
    stopMining(): Promise<void>;
    getMiningStatus(): Promise<MoneroMiningStatus>;
    submitBlocks(blockBlobs: any): Promise<unknown>;
    pruneBlockchain(check: any): Promise<MoneroPruneResult>;
    checkForUpdate(): Promise<MoneroDaemonUpdateCheckResult>;
    downloadUpdate(path: any): Promise<MoneroDaemonUpdateDownloadResult>;
    stop(): Promise<unknown>;
    waitForNextBlockHeader(): Promise<MoneroBlockHeader>;
    protected invokeWorker(fnName: string, args?: any): Promise<unknown>;
}
export default MoneroDaemonRpc;
