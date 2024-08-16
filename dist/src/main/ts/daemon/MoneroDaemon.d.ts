import MoneroAltChain from "./model/MoneroAltChain";
import MoneroBan from "./model/MoneroBan";
import MoneroBlock from "./model/MoneroBlock";
import MoneroBlockHeader from "./model/MoneroBlockHeader";
import MoneroBlockTemplate from "./model/MoneroBlockTemplate";
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
import MoneroSubmitTxResult from "./model/MoneroSubmitTxResult";
import MoneroTx from "./model/MoneroTx";
import MoneroTxPoolStats from "./model/MoneroTxPoolStats";
import MoneroVersion from "./model/MoneroVersion";
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
 * Monero daemon interface and default implementations.
 */
export default class MoneroDaemon {
    /**
     * Register a listener to receive daemon notifications.
     *
     * @param {MoneroDaemonListener} listener - listener to receive daemon notifications
     * @return {Promise<void>}
     */
    addListener(listener: MoneroDaemonListener): Promise<void>;
    /**
     * Unregister a listener to receive daemon notifications.
     *
     * @param {MoneroDaemonListener} listener - listener to unregister
     * @return {Promise<void>}
     */
    removeListener(listener: MoneroDaemonListener): Promise<void>;
    /**
     * Get the listeners registered with the daemon.
     *
     * @return {MoneroDaemonListener[]} the registered listeners
     */
    getListeners(): MoneroDaemonListener[];
    /**
     * Indicates if the client is connected to the daemon via RPC.
     *
     * @return {Promise<boolean>} true if the client is connected to the daemon, false otherwise
     */
    isConnected(): Promise<boolean>;
    /**
     * Gets the version of the daemon.
     *
     * @return {Promise<MoneroVersion>} the version of the daemon
     */
    getVersion(): Promise<MoneroVersion>;
    /**
     * Indicates if the daemon is trusted xor untrusted.
     *
     * @return {Promise<boolean>} true if the daemon is trusted, false otherwise
     */
    isTrusted(): Promise<boolean>;
    /**
     * Get the number of blocks in the longest chain known to the node.
     *
     * @return {Promise<number>} the number of blocks!
     */
    getHeight(): Promise<number>;
    /**
     * Get a block's hash by its height.
     *
     * @param {number} height - height of the block hash to get
     * @return {Promise<string>} the block's hash at the given height
     */
    getBlockHash(height: number): Promise<string>;
    /**
     * Get a block template for mining a new block.
     *
     * @param {string} walletAddress - address of the wallet to receive miner transactions if block is successfully mined
     * @param {number} [reserveSize] - reserve size (optional)
     * @return {Promise<MoneroBlockTemplate>} is a block template for mining a new block
     */
    getBlockTemplate(walletAddress: string, reserveSize?: number): Promise<MoneroBlockTemplate>;
    /**
     * Get the last block's header.
     *
     * @return {Promise<MoneroBlockHeader>} last block's header
     */
    getLastBlockHeader(): Promise<MoneroBlockHeader>;
    /**
     * Get a block header by its hash.
     *
     * @param {string} blockHash - hash of the block to get the header of
     * @return {Promise<MoneroBlockHeader>} block's header
     */
    getBlockHeaderByHash(blockHash: string): Promise<MoneroBlockHeader>;
    /**
     * Get a block header by its height.
     *
     * @param {number} height - height of the block to get the header of
     * @return {Promise<MoneroBlockHeader>} block's header
     */
    getBlockHeaderByHeight(height: number): Promise<MoneroBlockHeader>;
    /**
     * Get block headers for the given range.
     *
     * @param {number} [startHeight] - start height lower bound inclusive (optional)
     * @param {number} [endHeight] - end height upper bound inclusive (optional)
     * @return {Promise<MoneroBlockHeader[]>} for the given range
     */
    getBlockHeadersByRange(startHeight?: number, endHeight?: number): Promise<MoneroBlockHeader[]>;
    /**
     * Get a block by hash.
     *
     * @param {string} blockHash - hash of the block to get
     * @return {Promise<MoneroBlock>} with the given hash
     */
    getBlockByHash(blockHash: string): Promise<MoneroBlock>;
    /**
     * Get blocks by hash.
     *
     * @param {string[]} blockHashes - array of hashes; first 10 blocks hashes goes sequential,
     *        next goes in pow(2,n) offset, like 2, 4, 8, 16, 32, 64 and so on,
     *        and the last one is always genesis block
     * @param {number} startHeight - start height to get blocks by hash
     * @param {boolean} [prune] - specifies if returned blocks should be pruned (defaults to false)  // TODO: test default
     * @return {Promise<MoneroBlock[]>} retrieved blocks
     */
    getBlocksByHash(blockHashes: string[], startHeight: number, prune?: boolean): Promise<MoneroBlock[]>;
    /**
     * Get a block by height.
     *
     * @param {number} height - height of the block to get
     * @return {Promise<MoneroBlock>} with the given height
     */
    getBlockByHeight(height: number): Promise<MoneroBlock>;
    /**
     * Get blocks at the given heights.
     *
     * @param {number[]} heights - heights of the blocks to get
     * @return {Promise<MoneroBlock[]>} are blocks at the given heights
     */
    getBlocksByHeight(heights: number[]): Promise<MoneroBlock[]>;
    /**
     * Get blocks in the given height range.
     *
     * @param {number} [startHeight] - start height lower bound inclusive (optional)
     * @param {number} [endHeight] - end height upper bound inclusive (optional)
     * @return {Promise<MoneroBlock[]>} are blocks in the given height range
     */
    getBlocksByRange(startHeight?: number, endHeight?: number): Promise<MoneroBlock[]>;
    /**
     * Get blocks in the given height range as chunked requests so that each request is
     * not too big.
     *
     * @param {number} [startHeight] - start height lower bound inclusive (optional)
     * @param {number} [endHeight] - end height upper bound inclusive (optional)
     * @param {number} [maxChunkSize] - maximum chunk size in any one request (default 3,000,000 bytes)
     * @return {Promise<MoneroBlock[]>} blocks in the given height range
     */
    getBlocksByRangeChunked(startHeight?: number, endHeight?: number, maxChunkSize?: number): Promise<MoneroBlock[]>;
    /**
     * Get block hashes as a binary request to the daemon.
     *
     * @param {string[]} blockHashes - specify block hashes to fetch; first 10 blocks hash goes
     *        sequential, next goes in pow(2,n) offset, like 2, 4, 8, 16, 32, 64
     *        and so on, and the last one is always genesis block
     * @param {number} startHeight - starting height of block hashes to return
     * @return {Promise<string[]>} requested block hashes
     */
    getBlockHashes(blockHashes: string[], startHeight: number): Promise<string[]>;
    /**
     * Get a transaction by hash.
     *
     * @param {string} txHash - hash of the transaction to get
     * @param {boolean} [prune] - specifies if the returned tx should be pruned (defaults to false)
     * @return {Promise<MoneroTx>} transaction with the given hash or undefined if not found
     */
    getTx(txHash?: string, prune?: boolean): Promise<MoneroTx | undefined>;
    /**
     * Get transactions by hashes.
     *
     * @param {string[]} txHashes - hashes of transactions to get
     * @param {boolean} [prune] - specifies if the returned txs should be pruned (defaults to false)
     * @return {Promise<MoneroTx[]>} found transactions with the given hashes
     */
    getTxs(txHashes: string[], prune?: boolean): Promise<MoneroTx[]>;
    /**
     * Get a transaction hex by hash.
     *
     * @param {string} txHash - hash of the transaction to get hex from
     * @param {boolean} [prune] - specifies if the returned tx hex should be pruned (defaults to false)
     * @return {Promise<string>} tx hex with the given hash
     */
    getTxHex(txHash: string, prune?: boolean): Promise<string>;
    /**
     * Get transaction hexes by hashes.
     *
     * @param {string[]} txHashes - hashes of transactions to get hexes from
     * @param {boolean} [prune] - specifies if the returned tx hexes should be pruned (defaults to false)
     * @return {Promise<string[]>} tx hexes
     */
    getTxHexes(txHashes: string[], prune?: boolean): Promise<string[]>;
    /**
     * Gets the total emissions and fees from the genesis block to the current height.
     *
     * @param {number} height - height to start computing the miner sum
     * @param {number} numBlocks - number of blocks to include in the sum
     * @return {Promise<MoneroMinerTxSum>} encapsulates the total emissions and fees since the genesis block
     */
    getMinerTxSum(height: number, numBlocks: number): Promise<MoneroMinerTxSum>;
    /**
     * Get mining fee estimates per kB.
     *
     * @param {number} graceBlocks TODO
     * @return {Promise<MoneroFeeEstimate>} mining fee estimates per kB
     */
    getFeeEstimate(graceBlocks?: number): Promise<MoneroFeeEstimate>;
    /**
     * Submits a transaction to the daemon's pool.
     *
     * @param {string} txHex - raw transaction hex to submit
     * @param {boolean} doNotRelay specifies if the tx should be relayed (default false, i.e. relay)
     * @return {Promise<MoneroSubmitTxResult>} contains submission results
     */
    submitTxHex(txHex: string, doNotRelay?: boolean): Promise<MoneroSubmitTxResult>;
    /**
     * Relays a transaction by hash.
     *
     * @param {string} txHash - hash of the transaction to relay
     * @return {Promise<void>}
     */
    relayTxByHash(txHash: string): Promise<void>;
    /**
     * Relays transactions by hash.
     *
     * @param {string[]} txHashes - hashes of the transactinos to relay
     * @return {Promise<void>}
     */
    relayTxsByHash(txHashes: string[]): Promise<void>;
    /**
     * Get valid transactions seen by the node but not yet mined into a block, as well
     * as spent key image information for the tx pool.
     *
     * @return {Promise<MoneroTx[]>} are transactions in the transaction pool!
     */
    getTxPool(): Promise<MoneroTx[]>;
    /**
     * Get hashes of transactions in the transaction pool.
     *
     * @return {string[]} are hashes of transactions in the transaction pool
     */
    getTxPoolHashes(): Promise<string[]>;
    /**
     * Get transaction pool statistics.
     *
     * @return {Promise<MoneroTxPoolStats>} contains statistics about the transaction pool
     */
    getTxPoolStats(): Promise<MoneroTxPoolStats>;
    /**
     * Flush transactions from the tx pool.
     *
     * @param {(string | string[])} [hashes] - specific transactions to flush (defaults to all)
     * @return {Promise<void>}
     */
    flushTxPool(hashes?: string | string[]): Promise<void>;
    /**
     * Get the spent status of the given key image.
     *
     * @param {string} keyImage - key image hex to get the status of
     * @return {Promise<MoneroKeyImageSpentStatus>} status of the key image
     */
    getKeyImageSpentStatus(keyImage: string): Promise<MoneroKeyImageSpentStatus>;
    /**
     * Get the spent status of each given key image.
     *
     * @param {string[]} keyImages are hex key images to get the statuses of
     * @return {Promise<MoneroKeyImageSpentStatus[]>} status for each key image
     */
    getKeyImageSpentStatuses(keyImages: string[]): Promise<MoneroKeyImageSpentStatus[]>;
    /**
     * Get outputs identified by a list of output amounts and indices as a binary
     * request.
     *
     * @param {MoneroOutput[]} outputs - identify each output by amount and index
     * @return {Promise<MoneroOutput[]>} identified outputs
     */
    getOutputs(outputs: MoneroOutput[]): Promise<MoneroOutput[]>;
    /**
     * Get a histogram of output amounts. For all amounts (possibly filtered by
     * parameters), gives the number of outputs on the chain for that amount.
     * RingCT outputs counts as 0 amount.
     *
     * @param {bigint[]} [amounts] - amounts of outputs to make the histogram with
     * @param {number} [minCount] - TODO
     * @param {number} [maxCount] - TODO
     * @param {boolean} [isUnlocked] - makes a histogram with outputs with the specified lock state
     * @param {number} [recentCutoff] - TODO
     * @return {Promise<MoneroOutputHistogramEntry[]>} are entries meeting the parameters
     */
    getOutputHistogram(amounts?: bigint[], minCount?: number, maxCount?: number, isUnlocked?: boolean, recentCutoff?: number): Promise<MoneroOutputHistogramEntry[]>;
    /**
     * Get general information about the state of the node and the network.
     *
     * @return {Promise<MoneroDaemonInfo>} is general information about the node and network
     */
    getInfo(): Promise<MoneroDaemonInfo>;
    /**
     * Get synchronization information.
     *
     * @return {Promise<MoneroDaemonSyncInfo>} contains sync information
     */
    getSyncInfo(): Promise<MoneroDaemonSyncInfo>;
    /**
     * Look up information regarding hard fork voting and readiness.
     *
     * @return {Promise<MoneroHardForkInfo> } contains hard fork information
     */
    getHardForkInfo(): Promise<MoneroHardForkInfo>;
    /**
     * Get alternative chains seen by the node.
     *
     * @return {Promise<MoneroAltChain[]>} alternative chains
     */
    getAltChains(): Promise<MoneroAltChain[]>;
    /**
     * Get known block hashes which are not on the main chain.
     *
     * @return {Promise<string[]>} known block hashes which are not on the main chain
     */
    getAltBlockHashes(): Promise<string[]>;
    /**
     * Get the download bandwidth limit.
     *
     * @return {Promise<number>} download bandwidth limit
     */
    getDownloadLimit(): Promise<number>;
    /**
     * Set the download bandwidth limit.
     *
     * @param {number} limit - download limit to set (-1 to reset to default)
     * @return {number} new download limit after setting
     */
    setDownloadLimit(limit: number): Promise<number>;
    /**
     * Reset the download bandwidth limit.
     *
     * @return {Promise<number>} download bandwidth limit after resetting
     */
    resetDownloadLimit(): Promise<number>;
    /**
     * Get the upload bandwidth limit.
     *
     * @return {Promise<number>} upload bandwidth limit
     */
    getUploadLimit(): Promise<number>;
    /**
     * Set the upload bandwidth limit.
     *
     * @param limit - upload limit to set (-1 to reset to default)
     * @return {Promise<number>} new upload limit after setting
     */
    setUploadLimit(limit: number): Promise<number>;
    /**
     * Reset the upload bandwidth limit.
     *
     * @return {Promise<number>} upload bandwidth limit after resetting
     */
    resetUploadLimit(): Promise<number>;
    /**
     * Get peers with active incoming or outgoing connections to the node.
     *
     * @return {Promise<MoneroPeer[]>} the daemon's peers
     */
    getPeers(): Promise<MoneroPeer[]>;
    /**
     * Get known peers including their last known online status.
     *
     * @return {MoneroPeer[]} the daemon's known peers
     */
    getKnownPeers(): Promise<MoneroPeer[]>;
    /**
     * Limit number of outgoing peers.
     *
     * @param {number} limit - maximum number of outgoing peers
     * @return {Promise<void>}
     */
    setOutgoingPeerLimit(limit: number): Promise<void>;
    /**
     * Limit number of incoming peers.
     *
     * @param {number} limit - maximum number of incoming peers
     * @return {Promise<void>}
     */
    setIncomingPeerLimit(limit: number): Promise<void>;
    /**
     * Get peer bans.
     *
     * @return {Promise<MoneroBan[]>} entries about banned peers
     */
    getPeerBans(): Promise<MoneroBan[]>;
    /**
     * Ban a peer node.
     *
     * @param {MoneroBan} ban - contains information about a node to ban
     * @return {Promise<void>}
     */
    setPeerBan(ban: MoneroBan): Promise<void>;
    /**
     * Ban peers nodes.
     *
     * @param {MoneroBan[]} bans - specify which peers to ban
     * @return {Promise<void>}
     */
    setPeerBans(bans: MoneroBan[]): Promise<void>;
    /**
     * Start mining.
     *
     * @param {string} address - address given miner rewards if the daemon mines a block
     * @param {integer} [numThreads] - number of mining threads to run (default 1)
     * @param {boolean} [isBackground] - specifies if the miner should run in the background or not (default false)
     * @param {boolean} [ignoreBattery] - specifies if the battery state (e.g. on laptop) should be ignored or not (default false)
     * @return {Promise<void>}
     */
    startMining(address: string, numThreads?: number, isBackground?: boolean, ignoreBattery?: boolean): Promise<void>;
    /**
     * Stop mining.
     *
     * @return {Promise<void>}
     */
    stopMining(): Promise<void>;
    /**
     * Get the daemon's mining status.
     *
     * @return {Promise<MoneroMiningStatus>} daemon's mining status
     */
    getMiningStatus(): Promise<MoneroMiningStatus>;
    /**
     * Submit a mined block to the network.
     *
     * @param {string} blockBlob - mined block to submit
     * @return {Promise<void>}
     */
    submitBlock(blockBlob: string): Promise<void>;
    /**
     * Prune the blockchain.
     *
     * @param {boolean} check specifies to check the pruning (default false)
     * @return {Promise<MoneroPruneResult>} the prune result
     */
    pruneBlockchain(check: boolean): Promise<MoneroPruneResult>;
    /**
     * Submit mined blocks to the network.
     *
     * @param {string[]} blockBlobs - mined blocks to submit
     * @return {Promise<void>}
     */
    submitBlocks(blockBlobs: string[]): Promise<void>;
    /**
     * Check for update.
     *
     * @return {Promise<MoneroDaemonUpdateCheckResult>} the result
     */
    checkForUpdate(): Promise<MoneroDaemonUpdateCheckResult>;
    /**
     * Download an update.
     *
     * @param {string} [path] - path to download the update (optional)
     * @return {Promise<MoneroDaemonUpdateDownloadResult>} the result
     */
    downloadUpdate(path?: string): Promise<MoneroDaemonUpdateDownloadResult>;
    /**
     * Safely disconnect and shut down the daemon.
     *
     * @return {Promise<void>}
     */
    stop(): Promise<void>;
    /**
     * Get the header of the next block added to the chain.
     *
     * @return {Promise<MoneroBlockHeader>} header of the next block added to the chain
     */
    waitForNextBlockHeader(): Promise<MoneroBlockHeader>;
}
