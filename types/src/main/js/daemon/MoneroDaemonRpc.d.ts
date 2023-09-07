export = MoneroDaemonRpc;
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
 *
 * @implements {MoneroDaemon}
 * @hideconstructor
 */
declare class MoneroDaemonRpc extends MoneroDaemon implements MoneroDaemon {
    /**
     * <p>Create a client connected to monerod (for internal use).</p>
     *
     * @param {string|string[]|object|MoneroRpcConnection} uriOrConfig - uri of monerod or terminal parameters or JS config object or MoneroRpcConnection
     * @param {string} uriOrConfig.uri - uri of monerod
     * @param {string} uriOrConfig.username - username to authenticate with monerod (optional)
     * @param {string} uriOrConfig.password - password to authenticate with monerod (optional)
     * @param {boolean} uriOrConfig.rejectUnauthorized - rejects self-signed certificates if true (default true)
     * @param {number} uriOrConfig.pollInterval - poll interval to query for updates in ms (default 5000)
     * @param {boolean} uriOrConfig.proxyToWorker - run the daemon client in a worker if true (default true)
     * @param {string} username - username to authenticate with monerod (optional)
     * @param {string} password - password to authenticate with monerod (optional)
     * @param {boolean} rejectUnauthorized - rejects self-signed certificates if true (default true)
     * @param {number} pollInterval - poll interval to query for updates in ms (default 5000)
     * @param {boolean} proxyToWorker - runs the daemon client in a worker if true (default true)
     * @return {MoneroDaemonRpc} the daemon RPC client
     */
    static _connectToDaemonRpc(uriOrConfig: string | string[] | object | MoneroRpcConnection, username: string, password: string, rejectUnauthorized: boolean, pollInterval: number, proxyToWorker: boolean): MoneroDaemonRpc;
    static _startMonerodProcess(cmd: any, rejectUnauthorized: any, pollInterval: any, proxyToWorker: any): Promise<any>;
    static _normalizeConfig(uriOrConfigOrConnection: any, username: any, password: any, rejectUnauthorized: any, pollInterval: any, proxyToWorker: any): any;
    static _checkResponseStatus(resp: any): void;
    static _convertRpcBlockHeader(rpcHeader: any): MoneroBlockHeader;
    static _convertRpcBlock(rpcBlock: any): MoneroBlock;
    /**
     * Transfers RPC tx fields to a given MoneroTx without overwriting previous values.
     *
     * TODO: switch from safe set
     *
     * @param rpcTx - RPC map containing transaction fields
     * @param tx  - MoneroTx to populate with values (optional)
     * @returns tx - same tx that was passed in or a new one if none given
     */
    static _convertRpcTx(rpcTx: any, tx: any): any;
    static _convertRpcOutput(rpcOutput: any, tx: any): MoneroOutput;
    static _convertRpcBlockTemplate(rpcTemplate: any): MoneroBlockTemplate;
    static _convertRpcInfo(rpcInfo: any): MoneroDaemonInfo;
    /**
     * Initializes sync info from RPC sync info.
     *
     * @param rpcSyncInfo - rpc map to initialize the sync info from
     * @return {MoneroDaemonSyncInfo} is sync info initialized from the map
     */
    static _convertRpcSyncInfo(rpcSyncInfo: any): MoneroDaemonSyncInfo;
    static _convertRpcHardForkInfo(rpcHardForkInfo: any): MoneroHardForkInfo;
    static _convertRpcConnectionSpan(rpcConnectionSpan: any): any;
    static _convertRpcOutputHistogramEntry(rpcEntry: any): MoneroOutputHistogramEntry;
    static _convertRpcSubmitTxResult(rpcResult: any): MoneroSubmitTxResult;
    static _convertRpcTxPoolStats(rpcStats: any): MoneroTxPoolStats;
    static _convertRpcAltChain(rpcChain: any): MoneroAltChain;
    static _convertRpcPeer(rpcPeer: any): MoneroPeer;
    static _convertRpcConnection(rpcConnection: any): MoneroPeer;
    static _convertToRpcBan(ban: any): {
        host: any;
        ip: any;
        ban: any;
        seconds: any;
    };
    static _convertRpcMiningStatus(rpcStatus: any): MoneroMiningStatus;
    static _convertRpcUpdateCheckResult(rpcResult: any): any;
    static _convertRpcUpdateDownloadResult(rpcResult: any): any;
    /**
     * Converts a '0x' prefixed hexidecimal string to a BigInteger.
     *
     * @param hex is the '0x' prefixed hexidecimal string to convert
     * @return BigInteger is the hexicedimal converted to decimal
     */
    static _prefixedHexToBI(hex: any): any;
    /**
     * <p>Construct a daemon RPC client (for internal use).<p>
     *
     * @param {string|object|MoneroRpcConnection} uriOrConfig - uri of monerod or JS config object or MoneroRpcConnection
     * @param {string} uriOrConfig.uri - uri of monerod
     * @param {string} uriOrConfig.username - username to authenticate with monerod (optional)
     * @param {string} uriOrConfig.password - password to authenticate with monerod (optional)
     * @param {boolean} uriOrConfig.rejectUnauthorized - rejects self-signed certificates if true (default true)
     * @param {number} uriOrConfig.pollInterval - poll interval to query for updates in ms (default 5000)
     * @param {string} username - username to authenticate with monerod (optional)
     * @param {string} password - password to authenticate with monerod (optional)
     * @param {boolean} rejectUnauthorized - rejects self-signed certificates if true (default true)
     * @param {number} pollInterval - poll interval to query for updates in ms (default 5000)
     * @param {boolean} proxyToWorker - runs the daemon client in a worker if true (default true)
     */
    constructor(uriOrConfig: string | object | MoneroRpcConnection, username: string, password: string, rejectUnauthorized: boolean, pollInterval: number, proxyToWorker: boolean);
    config: any;
    rpc: MoneroRpcConnection;
    listeners: any[];
    cachedHeaders: {};
    /**
     * Get the internal process running monerod.
     *
     * @return the process running monerod, undefined if not created from new process
     */
    getProcess(): any;
    /**
     * Stop the internal process running monerod, if applicable.
     *
     * @param {boolean} force specifies if the process should be destroyed forcibly
     * @return {Promise<number|undefined>} the exit code from stopping the process
     */
    stopProcess(force: boolean): Promise<number | undefined>;
    addListener(listener: any): Promise<void>;
    removeListener(listener: any): Promise<void>;
    /**
     * Get the daemon's RPC connection.
     *
     * @return {MoneroRpcConnection} the daemon's rpc connection
     */
    getRpcConnection(): MoneroRpcConnection;
    isConnected(): Promise<boolean>;
    getVersion(): Promise<MoneroVersion>;
    isTrusted(): Promise<boolean>;
    getHeight(): Promise<any>;
    getBlockHash(height: any): Promise<any>;
    getBlockTemplate(walletAddress: any, reserveSize: any): Promise<MoneroBlockTemplate>;
    getLastBlockHeader(): Promise<MoneroBlockHeader>;
    getBlockHeaderByHash(blockHash: any): Promise<MoneroBlockHeader>;
    getBlockHeaderByHeight(height: any): Promise<MoneroBlockHeader>;
    getBlockHeadersByRange(startHeight: any, endHeight: any): Promise<MoneroBlockHeader[]>;
    getBlockByHash(blockHash: any): Promise<MoneroBlock>;
    getBlockByHeight(height: any): Promise<MoneroBlock>;
    getBlocksByHeight(heights: any): Promise<MoneroBlock[]>;
    getBlocksByRange(startHeight: any, endHeight: any): Promise<MoneroBlock[]>;
    getBlocksByRangeChunked(startHeight: any, endHeight: any, maxChunkSize: any): Promise<MoneroBlock[]>;
    getTxs(txHashes: any, prune: any): Promise<any[]>;
    getTxHexes(txHashes: any, prune: any): Promise<any[]>;
    getMinerTxSum(height: any, numBlocks: any): Promise<MoneroMinerTxSum>;
    getFeeEstimate(graceBlocks: any): Promise<MoneroFeeEstimate>;
    submitTxHex(txHex: any, doNotRelay: any): Promise<MoneroSubmitTxResult>;
    relayTxsByHash(txHashes: any): Promise<void>;
    getTxPool(): Promise<MoneroTx[]>;
    getTxPoolHashes(): Promise<void>;
    getTxPoolBacklog(): Promise<void>;
    getTxPoolStats(): Promise<MoneroTxPoolStats>;
    flushTxPool(hashes: any): Promise<void>;
    getKeyImageSpentStatuses(keyImages: any): Promise<any>;
    getOutputHistogram(amounts: any, minCount: any, maxCount: any, isUnlocked: any, recentCutoff: any): Promise<any[]>;
    getOutputDistribution(amounts: any, cumulative: any, startHeight: any, endHeight: any): Promise<void>;
    getInfo(): Promise<MoneroDaemonInfo>;
    getSyncInfo(): Promise<MoneroDaemonSyncInfo>;
    getHardForkInfo(): Promise<MoneroHardForkInfo>;
    getAltChains(): Promise<any[]>;
    getAltBlockHashes(): Promise<any>;
    getDownloadLimit(): Promise<any>;
    setDownloadLimit(limit: any): Promise<any>;
    resetDownloadLimit(): Promise<any>;
    getUploadLimit(): Promise<any>;
    setUploadLimit(limit: any): Promise<any>;
    resetUploadLimit(): Promise<any>;
    getPeers(): Promise<any[]>;
    getKnownPeers(): Promise<MoneroPeer[]>;
    setOutgoingPeerLimit(limit: any): Promise<void>;
    setIncomingPeerLimit(limit: any): Promise<void>;
    getPeerBans(): Promise<MoneroBan[]>;
    setPeerBans(bans: any): Promise<void>;
    startMining(address: any, numThreads: any, isBackground: any, ignoreBattery: any): Promise<void>;
    getMiningStatus(): Promise<MoneroMiningStatus>;
    submitBlocks(blockBlobs: any): Promise<void>;
    pruneBlockchain(check: any): Promise<MoneroPruneResult>;
    checkForUpdate(): Promise<any>;
    downloadUpdate(path: any): Promise<any>;
    waitForNextBlockHeader(): Promise<any>;
    getTx(...args: any[]): Promise<MoneroTx>;
    getTxHex(...args: any[]): Promise<string>;
    getKeyImageSpentStatus(...args: any[]): Promise<MoneroKeyImageSpentStatus>;
    setPeerBan(...args: any[]): Promise<void>;
    submitBlock(...args: any[]): Promise<void>;
    _refreshListening(): void;
    pollListener: DaemonPoller;
    _getBandwidthLimits(): Promise<any[]>;
    _setBandwidthLimits(downLimit: any, upLimit: any): Promise<any[]>;
    /**
     * Get a contiguous chunk of blocks starting from a given height up to a maximum
     * height or amount of block data fetched from the blockchain, whichever comes first.
     *
     * @param {number} startHeight - start height to retrieve blocks (default 0)
     * @param {number} maxHeight - maximum end height to retrieve blocks (default blockchain height)
     * @param {number} maxReqSize - maximum amount of block data to fetch from the blockchain in bytes (default 3,000,000 bytes)
     * @return {MoneroBlock[]} are the resulting chunk of blocks
     */
    _getMaxBlocks(startHeight: number, maxHeight: number, maxReqSize: number): MoneroBlock[];
    /**
     * Retrieves a header by height from the cache or fetches and caches a header
     * range if not already in the cache.
     *
     * @param {number} height - height of the header to retrieve from the cache
     * @param {number} maxHeight - maximum height of headers to cache
     */
    _getBlockHeaderByHeightCached(height: number, maxHeight: number): Promise<any>;
}
declare namespace MoneroDaemonRpc {
    let process: any;
    let DEFAULT_ID: string;
    let MAX_REQ_SIZE: string;
    let NUM_HEADERS_PER_REQ: string;
}
import MoneroDaemon = require("./MoneroDaemon");
import MoneroRpcConnection = require("../common/MoneroRpcConnection");
import MoneroVersion = require("./model/MoneroVersion");
import MoneroBlockTemplate = require("./model/MoneroBlockTemplate");
import MoneroBlockHeader = require("./model/MoneroBlockHeader");
import MoneroBlock = require("./model/MoneroBlock");
import MoneroMinerTxSum = require("./model/MoneroMinerTxSum");
import MoneroFeeEstimate = require("./model/MoneroFeeEstimate");
import MoneroSubmitTxResult = require("./model/MoneroSubmitTxResult");
import MoneroTx = require("./model/MoneroTx");
import MoneroTxPoolStats = require("./model/MoneroTxPoolStats");
import MoneroDaemonInfo = require("./model/MoneroDaemonInfo");
import MoneroDaemonSyncInfo = require("./model/MoneroDaemonSyncInfo");
import MoneroHardForkInfo = require("./model/MoneroHardForkInfo");
import MoneroPeer = require("./model/MoneroPeer");
import MoneroBan = require("./model/MoneroBan");
import MoneroMiningStatus = require("./model/MoneroMiningStatus");
import MoneroPruneResult = require("./model/MoneroPruneResult");
/**
 * Polls a Monero daemon for updates and notifies listeners as they occur.
 *
 * @class
 * @ignore
 */
declare class DaemonPoller {
    constructor(daemon: any);
    _daemon: any;
    _looper: TaskLooper;
    setIsPolling(isPolling: any): void;
    _isPolling: any;
    poll(): Promise<void>;
    _lastHeader: any;
}
import MoneroOutput = require("./model/MoneroOutput");
import MoneroOutputHistogramEntry = require("./model/MoneroOutputHistogramEntry");
import MoneroAltChain = require("./model/MoneroAltChain");
import TaskLooper = require("../common/TaskLooper");
