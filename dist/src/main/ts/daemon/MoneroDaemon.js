"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _assert = _interopRequireDefault(require("assert"));










var _MoneroError = _interopRequireDefault(require("../common/MoneroError"));






//import MoneroOutputDistributionEntry from "./model/MoneroOutputDistributionEntry";









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
class MoneroDaemon {

  /**
   * Register a listener to receive daemon notifications.
   * 
   * @param {MoneroDaemonListener} listener - listener to receive daemon notifications
   * @return {Promise<void>}
   */
  async addListener(listener) {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Unregister a listener to receive daemon notifications.
   * 
   * @param {MoneroDaemonListener} listener - listener to unregister
   * @return {Promise<void>}
   */
  async removeListener(listener) {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Get the listeners registered with the daemon.
   * 
   * @return {MoneroDaemonListener[]} the registered listeners
   */
  getListeners() {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Indicates if the client is connected to the daemon via RPC.
   * 
   * @return {Promise<boolean>} true if the client is connected to the daemon, false otherwise
   */
  async isConnected() {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Gets the version of the daemon.
   * 
   * @return {Promise<MoneroVersion>} the version of the daemon
   */
  async getVersion() {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Indicates if the daemon is trusted xor untrusted.
   * 
   * @return {Promise<boolean>} true if the daemon is trusted, false otherwise
   */
  async isTrusted() {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Get the number of blocks in the longest chain known to the node.
   * 
   * @return {Promise<number>} the number of blocks!
   */
  async getHeight() {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Get a block's hash by its height.
   * 
   * @param {number} height - height of the block hash to get
   * @return {Promise<string>} the block's hash at the given height
   */
  async getBlockHash(height) {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Get a block template for mining a new block.
   * 
   * @param {string} walletAddress - address of the wallet to receive miner transactions if block is successfully mined
   * @param {number} [reserveSize] - reserve size (optional)
   * @return {Promise<MoneroBlockTemplate>} is a block template for mining a new block
   */
  async getBlockTemplate(walletAddress, reserveSize) {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Get the last block's header.
   * 
   * @return {Promise<MoneroBlockHeader>} last block's header
   */
  async getLastBlockHeader() {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Get a block header by its hash.
   * 
   * @param {string} blockHash - hash of the block to get the header of
   * @return {Promise<MoneroBlockHeader>} block's header
   */
  async getBlockHeaderByHash(blockHash) {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Get a block header by its height.
   * 
   * @param {number} height - height of the block to get the header of
   * @return {Promise<MoneroBlockHeader>} block's header
   */
  async getBlockHeaderByHeight(height) {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Get block headers for the given range.
   * 
   * @param {number} [startHeight] - start height lower bound inclusive (optional)
   * @param {number} [endHeight] - end height upper bound inclusive (optional)
   * @return {Promise<MoneroBlockHeader[]>} for the given range
   */
  async getBlockHeadersByRange(startHeight, endHeight) {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Get a block by hash.
   * 
   * @param {string} blockHash - hash of the block to get
   * @return {Promise<MoneroBlock>} with the given hash
   */
  async getBlockByHash(blockHash) {
    throw new _MoneroError.default("Subclass must implement");
  }

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
  async getBlocksByHash(blockHashes, startHeight, prune = false) {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Get a block by height.
   * 
   * @param {number} height - height of the block to get
   * @return {Promise<MoneroBlock>} with the given height
   */
  async getBlockByHeight(height) {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Get blocks at the given heights.
   * 
   * @param {number[]} heights - heights of the blocks to get
   * @return {Promise<MoneroBlock[]>} are blocks at the given heights
   */
  async getBlocksByHeight(heights) {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Get blocks in the given height range.
   * 
   * @param {number} [startHeight] - start height lower bound inclusive (optional)
   * @param {number} [endHeight] - end height upper bound inclusive (optional)
   * @return {Promise<MoneroBlock[]>} are blocks in the given height range
   */
  async getBlocksByRange(startHeight, endHeight) {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Get blocks in the given height range as chunked requests so that each request is
   * not too big.
   * 
   * @param {number} [startHeight] - start height lower bound inclusive (optional)
   * @param {number} [endHeight] - end height upper bound inclusive (optional)
   * @param {number} [maxChunkSize] - maximum chunk size in any one request (default 3,000,000 bytes)
   * @return {Promise<MoneroBlock[]>} blocks in the given height range
   */
  async getBlocksByRangeChunked(startHeight, endHeight, maxChunkSize) {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Get block hashes as a binary request to the daemon.
   * 
   * @param {string[]} blockHashes - specify block hashes to fetch; first 10 blocks hash goes
   *        sequential, next goes in pow(2,n) offset, like 2, 4, 8, 16, 32, 64
   *        and so on, and the last one is always genesis block
   * @param {number} startHeight - starting height of block hashes to return
   * @return {Promise<string[]>} requested block hashes     
   */
  async getBlockHashes(blockHashes, startHeight) {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Get a transaction by hash.
   * 
   * @param {string} txHash - hash of the transaction to get
   * @param {boolean} [prune] - specifies if the returned tx should be pruned (defaults to false)
   * @return {Promise<MoneroTx>} transaction with the given hash or undefined if not found
   */
  async getTx(txHash, prune = false) {
    return (await this.getTxs([txHash], prune))[0];
  }

  /**
   * Get transactions by hashes.
   * 
   * @param {string[]} txHashes - hashes of transactions to get
   * @param {boolean} [prune] - specifies if the returned txs should be pruned (defaults to false)
   * @return {Promise<MoneroTx[]>} found transactions with the given hashes
   */
  async getTxs(txHashes, prune = false) {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Get a transaction hex by hash.
   * 
   * @param {string} txHash - hash of the transaction to get hex from
   * @param {boolean} [prune] - specifies if the returned tx hex should be pruned (defaults to false)
   * @return {Promise<string>} tx hex with the given hash
   */
  async getTxHex(txHash, prune = false) {
    return (await this.getTxHexes([txHash], prune))[0];
  }

  /**
   * Get transaction hexes by hashes.
   * 
   * @param {string[]} txHashes - hashes of transactions to get hexes from
   * @param {boolean} [prune] - specifies if the returned tx hexes should be pruned (defaults to false)
   * @return {Promise<string[]>} tx hexes
   */
  async getTxHexes(txHashes, prune = false) {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Gets the total emissions and fees from the genesis block to the current height.
   * 
   * @param {number} height - height to start computing the miner sum
   * @param {number} numBlocks - number of blocks to include in the sum
   * @return {Promise<MoneroMinerTxSum>} encapsulates the total emissions and fees since the genesis block
   */
  async getMinerTxSum(height, numBlocks) {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Get mining fee estimates per kB.
   * 
   * @param {number} graceBlocks TODO
   * @return {Promise<MoneroFeeEstimate>} mining fee estimates per kB
   */
  async getFeeEstimate(graceBlocks) {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Submits a transaction to the daemon's pool.
   * 
   * @param {string} txHex - raw transaction hex to submit
   * @param {boolean} doNotRelay specifies if the tx should be relayed (default false, i.e. relay)
   * @return {Promise<MoneroSubmitTxResult>} contains submission results
   */
  async submitTxHex(txHex, doNotRelay = false) {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Relays a transaction by hash.
   * 
   * @param {string} txHash - hash of the transaction to relay
   * @return {Promise<void>}
   */
  async relayTxByHash(txHash) {
    _assert.default.equal(typeof txHash, "string", "Must provide a transaction hash");
    await this.relayTxsByHash([txHash]);
  }

  /**
   * Relays transactions by hash.
   * 
   * @param {string[]} txHashes - hashes of the transactinos to relay
   * @return {Promise<void>}
   */
  async relayTxsByHash(txHashes) {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Get valid transactions seen by the node but not yet mined into a block, as well
   * as spent key image information for the tx pool.
   * 
   * @return {Promise<MoneroTx[]>} are transactions in the transaction pool!
   */
  async getTxPool() {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Get hashes of transactions in the transaction pool.
   * 
   * @return {string[]} are hashes of transactions in the transaction pool
   */
  async getTxPoolHashes() {
    throw new _MoneroError.default("Subclass must implement");
  }

  // /**
  //  * Get all transaction pool backlog.
  //  * 
  //  * @return {Promise<MoneroTxBacklogEntry[]>} backlog entries 
  //  */
  // async getTxPoolBacklog(): Promise<MoneroTxBacklogEntry[]> {
  //   throw new MoneroError("Subclass must implement");
  // }

  /**
   * Get transaction pool statistics.
   * 
   * @return {Promise<MoneroTxPoolStats>} contains statistics about the transaction pool
   */
  async getTxPoolStats() {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Flush transactions from the tx pool.
   * 
   * @param {(string | string[])} [hashes] - specific transactions to flush (defaults to all)
   * @return {Promise<void>}
   */
  async flushTxPool(hashes) {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Get the spent status of the given key image.
   * 
   * @param {string} keyImage - key image hex to get the status of
   * @return {Promise<MoneroKeyImageSpentStatus>} status of the key image
   */
  async getKeyImageSpentStatus(keyImage) {
    return (await this.getKeyImageSpentStatuses([keyImage]))[0];
  }

  /**
   * Get the spent status of each given key image.
   * 
   * @param {string[]} keyImages are hex key images to get the statuses of
   * @return {Promise<MoneroKeyImageSpentStatus[]>} status for each key image
   */
  async getKeyImageSpentStatuses(keyImages) {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Get outputs identified by a list of output amounts and indices as a binary
   * request.
   * 
   * @param {MoneroOutput[]} outputs - identify each output by amount and index
   * @return {Promise<MoneroOutput[]>} identified outputs
   */
  async getOutputs(outputs) {
    throw new _MoneroError.default("Subclass must implement");
  }

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
  async getOutputHistogram(amounts, minCount, maxCount, isUnlocked, recentCutoff) {
    throw new _MoneroError.default("Subclass must implement");
  }

  // /**
  //  * Creates an output distribution.
  //  * 
  //  * @param {bigint[]} amounts - amounts of outputs to make the distribution with
  //  * @param {boolean} [cumulative] - specifies if the results should be cumulative (defaults to TODO)
  //  * @param {number} [startHeight] - start height lower bound inclusive (optional)
  //  * @param {number} [endHeight] - end height upper bound inclusive (optional)
  //  * @return {Promise<MoneroOutputDistributionEntry[]>} are entries meeting the parameters
  //  */
  // async getOutputDistribution(amounts: bigint[], cumulative?: boolean, startHeight?: number, endHeight?: number): Promise<MoneroOutputDistributionEntry[]> {
  //   throw new MoneroError("Subclass must implement");
  // }

  /**
   * Get general information about the state of the node and the network.
   * 
   * @return {Promise<MoneroDaemonInfo>} is general information about the node and network
   */
  async getInfo() {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Get synchronization information.
   * 
   * @return {Promise<MoneroDaemonSyncInfo>} contains sync information
   */
  async getSyncInfo() {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Look up information regarding hard fork voting and readiness.
   * 
   * @return {Promise<MoneroHardForkInfo> } contains hard fork information
   */
  async getHardForkInfo() {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Get alternative chains seen by the node.
   * 
   * @return {Promise<MoneroAltChain[]>} alternative chains
   */
  async getAltChains() {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Get known block hashes which are not on the main chain.
   * 
   * @return {Promise<string[]>} known block hashes which are not on the main chain
   */
  async getAltBlockHashes() {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Get the download bandwidth limit.
   * 
   * @return {Promise<number>} download bandwidth limit
   */
  async getDownloadLimit() {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Set the download bandwidth limit.
   * 
   * @param {number} limit - download limit to set (-1 to reset to default)
   * @return {number} new download limit after setting
   */
  async setDownloadLimit(limit) {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Reset the download bandwidth limit.
   * 
   * @return {Promise<number>} download bandwidth limit after resetting
   */
  async resetDownloadLimit() {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Get the upload bandwidth limit.
   * 
   * @return {Promise<number>} upload bandwidth limit
   */
  async getUploadLimit() {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Set the upload bandwidth limit.
   * 
   * @param limit - upload limit to set (-1 to reset to default)
   * @return {Promise<number>} new upload limit after setting
   */
  async setUploadLimit(limit) {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Reset the upload bandwidth limit.
   * 
   * @return {Promise<number>} upload bandwidth limit after resetting
   */
  async resetUploadLimit() {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Get peers with active incoming or outgoing connections to the node.
   * 
   * @return {Promise<MoneroPeer[]>} the daemon's peers
   */
  async getPeers() {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Get known peers including their last known online status.
   * 
   * @return {MoneroPeer[]} the daemon's known peers
   */
  async getKnownPeers() {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Limit number of outgoing peers.
   * 
   * @param {number} limit - maximum number of outgoing peers
   * @return {Promise<void>}
   */
  async setOutgoingPeerLimit(limit) {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Limit number of incoming peers.
   * 
   * @param {number} limit - maximum number of incoming peers
   * @return {Promise<void>}
   */
  async setIncomingPeerLimit(limit) {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Get peer bans.
   * 
   * @return {Promise<MoneroBan[]>} entries about banned peers
   */
  async getPeerBans() {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Ban a peer node.
   * 
   * @param {MoneroBan} ban - contains information about a node to ban
   * @return {Promise<void>}
   */
  async setPeerBan(ban) {
    return await this.setPeerBans([ban]);
  }

  /**
   * Ban peers nodes.
   * 
   * @param {MoneroBan[]} bans - specify which peers to ban
   * @return {Promise<void>}
   */
  async setPeerBans(bans) {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Start mining.
   * 
   * @param {string} address - address given miner rewards if the daemon mines a block
   * @param {integer} [numThreads] - number of mining threads to run (default 1)
   * @param {boolean} [isBackground] - specifies if the miner should run in the background or not (default false)
   * @param {boolean} [ignoreBattery] - specifies if the battery state (e.g. on laptop) should be ignored or not (default false)
   * @return {Promise<void>}
   */
  async startMining(address, numThreads, isBackground, ignoreBattery) {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Stop mining.
   * 
   * @return {Promise<void>}
   */
  async stopMining() {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Get the daemon's mining status.
   * 
   * @return {Promise<MoneroMiningStatus>} daemon's mining status
   */
  async getMiningStatus() {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Submit a mined block to the network.
   * 
   * @param {string} blockBlob - mined block to submit
   * @return {Promise<void>}
   */
  async submitBlock(blockBlob) {
    await this.submitBlocks([blockBlob]);
  }

  /**
   * Prune the blockchain.
   * 
   * @param {boolean} check specifies to check the pruning (default false)
   * @return {Promise<MoneroPruneResult>} the prune result
   */
  async pruneBlockchain(check) {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Submit mined blocks to the network.
   * 
   * @param {string[]} blockBlobs - mined blocks to submit
   * @return {Promise<void>}
   */
  async submitBlocks(blockBlobs) {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Check for update.
   * 
   * @return {Promise<MoneroDaemonUpdateCheckResult>} the result
   */
  async checkForUpdate() {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Download an update.
   * 
   * @param {string} [path] - path to download the update (optional)
   * @return {Promise<MoneroDaemonUpdateDownloadResult>} the result
   */
  async downloadUpdate(path) {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Safely disconnect and shut down the daemon.
   * 
   * @return {Promise<void>}
   */
  async stop() {
    throw new _MoneroError.default("Subclass must implement");
  }

  /**
   * Get the header of the next block added to the chain.
   * 
   * @return {Promise<MoneroBlockHeader>} header of the next block added to the chain
   */
  async waitForNextBlockHeader() {
    throw new _MoneroError.default("Subclass must implement");
  }
}exports.default = MoneroDaemon;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfTW9uZXJvRXJyb3IiLCJNb25lcm9EYWVtb24iLCJhZGRMaXN0ZW5lciIsImxpc3RlbmVyIiwiTW9uZXJvRXJyb3IiLCJyZW1vdmVMaXN0ZW5lciIsImdldExpc3RlbmVycyIsImlzQ29ubmVjdGVkIiwiZ2V0VmVyc2lvbiIsImlzVHJ1c3RlZCIsImdldEhlaWdodCIsImdldEJsb2NrSGFzaCIsImhlaWdodCIsImdldEJsb2NrVGVtcGxhdGUiLCJ3YWxsZXRBZGRyZXNzIiwicmVzZXJ2ZVNpemUiLCJnZXRMYXN0QmxvY2tIZWFkZXIiLCJnZXRCbG9ja0hlYWRlckJ5SGFzaCIsImJsb2NrSGFzaCIsImdldEJsb2NrSGVhZGVyQnlIZWlnaHQiLCJnZXRCbG9ja0hlYWRlcnNCeVJhbmdlIiwic3RhcnRIZWlnaHQiLCJlbmRIZWlnaHQiLCJnZXRCbG9ja0J5SGFzaCIsImdldEJsb2Nrc0J5SGFzaCIsImJsb2NrSGFzaGVzIiwicHJ1bmUiLCJnZXRCbG9ja0J5SGVpZ2h0IiwiZ2V0QmxvY2tzQnlIZWlnaHQiLCJoZWlnaHRzIiwiZ2V0QmxvY2tzQnlSYW5nZSIsImdldEJsb2Nrc0J5UmFuZ2VDaHVua2VkIiwibWF4Q2h1bmtTaXplIiwiZ2V0QmxvY2tIYXNoZXMiLCJnZXRUeCIsInR4SGFzaCIsImdldFR4cyIsInR4SGFzaGVzIiwiZ2V0VHhIZXgiLCJnZXRUeEhleGVzIiwiZ2V0TWluZXJUeFN1bSIsIm51bUJsb2NrcyIsImdldEZlZUVzdGltYXRlIiwiZ3JhY2VCbG9ja3MiLCJzdWJtaXRUeEhleCIsInR4SGV4IiwiZG9Ob3RSZWxheSIsInJlbGF5VHhCeUhhc2giLCJhc3NlcnQiLCJlcXVhbCIsInJlbGF5VHhzQnlIYXNoIiwiZ2V0VHhQb29sIiwiZ2V0VHhQb29sSGFzaGVzIiwiZ2V0VHhQb29sU3RhdHMiLCJmbHVzaFR4UG9vbCIsImhhc2hlcyIsImdldEtleUltYWdlU3BlbnRTdGF0dXMiLCJrZXlJbWFnZSIsImdldEtleUltYWdlU3BlbnRTdGF0dXNlcyIsImtleUltYWdlcyIsImdldE91dHB1dHMiLCJvdXRwdXRzIiwiZ2V0T3V0cHV0SGlzdG9ncmFtIiwiYW1vdW50cyIsIm1pbkNvdW50IiwibWF4Q291bnQiLCJpc1VubG9ja2VkIiwicmVjZW50Q3V0b2ZmIiwiZ2V0SW5mbyIsImdldFN5bmNJbmZvIiwiZ2V0SGFyZEZvcmtJbmZvIiwiZ2V0QWx0Q2hhaW5zIiwiZ2V0QWx0QmxvY2tIYXNoZXMiLCJnZXREb3dubG9hZExpbWl0Iiwic2V0RG93bmxvYWRMaW1pdCIsImxpbWl0IiwicmVzZXREb3dubG9hZExpbWl0IiwiZ2V0VXBsb2FkTGltaXQiLCJzZXRVcGxvYWRMaW1pdCIsInJlc2V0VXBsb2FkTGltaXQiLCJnZXRQZWVycyIsImdldEtub3duUGVlcnMiLCJzZXRPdXRnb2luZ1BlZXJMaW1pdCIsInNldEluY29taW5nUGVlckxpbWl0IiwiZ2V0UGVlckJhbnMiLCJzZXRQZWVyQmFuIiwiYmFuIiwic2V0UGVlckJhbnMiLCJiYW5zIiwic3RhcnRNaW5pbmciLCJhZGRyZXNzIiwibnVtVGhyZWFkcyIsImlzQmFja2dyb3VuZCIsImlnbm9yZUJhdHRlcnkiLCJzdG9wTWluaW5nIiwiZ2V0TWluaW5nU3RhdHVzIiwic3VibWl0QmxvY2siLCJibG9ja0Jsb2IiLCJzdWJtaXRCbG9ja3MiLCJwcnVuZUJsb2NrY2hhaW4iLCJjaGVjayIsImJsb2NrQmxvYnMiLCJjaGVja0ZvclVwZGF0ZSIsImRvd25sb2FkVXBkYXRlIiwicGF0aCIsInN0b3AiLCJ3YWl0Rm9yTmV4dEJsb2NrSGVhZGVyIiwiZXhwb3J0cyIsImRlZmF1bHQiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy9kYWVtb24vTW9uZXJvRGFlbW9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IE1vbmVyb0FsdENoYWluIGZyb20gXCIuL21vZGVsL01vbmVyb0FsdENoYWluXCI7XG5pbXBvcnQgTW9uZXJvQmFuIGZyb20gXCIuL21vZGVsL01vbmVyb0JhblwiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrIGZyb20gXCIuL21vZGVsL01vbmVyb0Jsb2NrXCI7XG5pbXBvcnQgTW9uZXJvQmxvY2tIZWFkZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQmxvY2tIZWFkZXJcIjtcbmltcG9ydCBNb25lcm9CbG9ja1RlbXBsYXRlIGZyb20gXCIuL21vZGVsL01vbmVyb0Jsb2NrVGVtcGxhdGVcIjtcbmltcG9ydCBNb25lcm9EYWVtb25JbmZvIGZyb20gXCIuL21vZGVsL01vbmVyb0RhZW1vbkluZm9cIjtcbmltcG9ydCBNb25lcm9EYWVtb25MaXN0ZW5lciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9EYWVtb25MaXN0ZW5lclwiO1xuaW1wb3J0IE1vbmVyb0RhZW1vblN5bmNJbmZvIGZyb20gXCIuL21vZGVsL01vbmVyb0RhZW1vblN5bmNJbmZvXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuLi9jb21tb24vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBNb25lcm9GZWVFc3RpbWF0ZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9GZWVFc3RpbWF0ZVwiO1xuaW1wb3J0IE1vbmVyb0hhcmRGb3JrSW5mbyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9IYXJkRm9ya0luZm9cIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzIGZyb20gXCIuL21vZGVsL01vbmVyb0tleUltYWdlU3BlbnRTdGF0dXNcIjtcbmltcG9ydCBNb25lcm9NaW5lclR4U3VtIGZyb20gXCIuL21vZGVsL01vbmVyb01pbmVyVHhTdW1cIjtcbmltcG9ydCBNb25lcm9NaW5pbmdTdGF0dXMgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTWluaW5nU3RhdHVzXCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0IGZyb20gXCIuL21vZGVsL01vbmVyb091dHB1dFwiO1xuLy9pbXBvcnQgTW9uZXJvT3V0cHV0RGlzdHJpYnV0aW9uRW50cnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0RGlzdHJpYnV0aW9uRW50cnlcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeVwiO1xuaW1wb3J0IE1vbmVyb05ldHdvcmtUeXBlIGZyb20gXCIuL21vZGVsL01vbmVyb05ldHdvcmtUeXBlXCI7XG5pbXBvcnQgTW9uZXJvUGVlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9QZWVyXCI7XG5pbXBvcnQgTW9uZXJvUHJ1bmVSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvUHJ1bmVSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9TdWJtaXRUeFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9TdWJtaXRUeFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb1R4IGZyb20gXCIuL21vZGVsL01vbmVyb1R4XCI7XG5pbXBvcnQgTW9uZXJvVHhQb29sU3RhdHMgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhQb29sU3RhdHNcIjtcbmltcG9ydCBNb25lcm9WZXJzaW9uIGZyb20gXCIuL21vZGVsL01vbmVyb1ZlcnNpb25cIjtcblxuLyoqXG4gKiBDb3B5cmlnaHQgKGMpIHdvb2RzZXJcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbi8qKlxuICogTW9uZXJvIGRhZW1vbiBpbnRlcmZhY2UgYW5kIGRlZmF1bHQgaW1wbGVtZW50YXRpb25zLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNb25lcm9EYWVtb24ge1xuICAgIFxuICAvKipcbiAgICogUmVnaXN0ZXIgYSBsaXN0ZW5lciB0byByZWNlaXZlIGRhZW1vbiBub3RpZmljYXRpb25zLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9EYWVtb25MaXN0ZW5lcn0gbGlzdGVuZXIgLSBsaXN0ZW5lciB0byByZWNlaXZlIGRhZW1vbiBub3RpZmljYXRpb25zXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBhZGRMaXN0ZW5lcihsaXN0ZW5lcjogTW9uZXJvRGFlbW9uTGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFVucmVnaXN0ZXIgYSBsaXN0ZW5lciB0byByZWNlaXZlIGRhZW1vbiBub3RpZmljYXRpb25zLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9EYWVtb25MaXN0ZW5lcn0gbGlzdGVuZXIgLSBsaXN0ZW5lciB0byB1bnJlZ2lzdGVyXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcjogTW9uZXJvRGFlbW9uTGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgbGlzdGVuZXJzIHJlZ2lzdGVyZWQgd2l0aCB0aGUgZGFlbW9uLlxuICAgKiBcbiAgICogQHJldHVybiB7TW9uZXJvRGFlbW9uTGlzdGVuZXJbXX0gdGhlIHJlZ2lzdGVyZWQgbGlzdGVuZXJzXG4gICAqL1xuICBnZXRMaXN0ZW5lcnMoKTogTW9uZXJvRGFlbW9uTGlzdGVuZXJbXSB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGNsaWVudCBpcyBjb25uZWN0ZWQgdG8gdGhlIGRhZW1vbiB2aWEgUlBDLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiB0aGUgY2xpZW50IGlzIGNvbm5lY3RlZCB0byB0aGUgZGFlbW9uLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzQ29ubmVjdGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0cyB0aGUgdmVyc2lvbiBvZiB0aGUgZGFlbW9uLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9WZXJzaW9uPn0gdGhlIHZlcnNpb24gb2YgdGhlIGRhZW1vblxuICAgKi9cbiAgYXN5bmMgZ2V0VmVyc2lvbigpOiBQcm9taXNlPE1vbmVyb1ZlcnNpb24+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZGFlbW9uIGlzIHRydXN0ZWQgeG9yIHVudHJ1c3RlZC5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgdGhlIGRhZW1vbiBpcyB0cnVzdGVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzVHJ1c3RlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgbnVtYmVyIG9mIGJsb2NrcyBpbiB0aGUgbG9uZ2VzdCBjaGFpbiBrbm93biB0byB0aGUgbm9kZS5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyPn0gdGhlIG51bWJlciBvZiBibG9ja3MhXG4gICAqL1xuICBhc3luYyBnZXRIZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhIGJsb2NrJ3MgaGFzaCBieSBpdHMgaGVpZ2h0LlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodCAtIGhlaWdodCBvZiB0aGUgYmxvY2sgaGFzaCB0byBnZXRcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgYmxvY2sncyBoYXNoIGF0IHRoZSBnaXZlbiBoZWlnaHRcbiAgICovXG4gIGFzeW5jIGdldEJsb2NrSGFzaChoZWlnaHQ6IG51bWJlcik6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYSBibG9jayB0ZW1wbGF0ZSBmb3IgbWluaW5nIGEgbmV3IGJsb2NrLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHdhbGxldEFkZHJlc3MgLSBhZGRyZXNzIG9mIHRoZSB3YWxsZXQgdG8gcmVjZWl2ZSBtaW5lciB0cmFuc2FjdGlvbnMgaWYgYmxvY2sgaXMgc3VjY2Vzc2Z1bGx5IG1pbmVkXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcmVzZXJ2ZVNpemVdIC0gcmVzZXJ2ZSBzaXplIChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9CbG9ja1RlbXBsYXRlPn0gaXMgYSBibG9jayB0ZW1wbGF0ZSBmb3IgbWluaW5nIGEgbmV3IGJsb2NrXG4gICAqL1xuICBhc3luYyBnZXRCbG9ja1RlbXBsYXRlKHdhbGxldEFkZHJlc3M6IHN0cmluZywgcmVzZXJ2ZVNpemU/OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb0Jsb2NrVGVtcGxhdGU+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgbGFzdCBibG9jaydzIGhlYWRlci5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQmxvY2tIZWFkZXI+fSBsYXN0IGJsb2NrJ3MgaGVhZGVyXG4gICAqL1xuICBhc3luYyBnZXRMYXN0QmxvY2tIZWFkZXIoKTogUHJvbWlzZTxNb25lcm9CbG9ja0hlYWRlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGEgYmxvY2sgaGVhZGVyIGJ5IGl0cyBoYXNoLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGJsb2NrSGFzaCAtIGhhc2ggb2YgdGhlIGJsb2NrIHRvIGdldCB0aGUgaGVhZGVyIG9mXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQmxvY2tIZWFkZXI+fSBibG9jaydzIGhlYWRlclxuICAgKi9cbiAgYXN5bmMgZ2V0QmxvY2tIZWFkZXJCeUhhc2goYmxvY2tIYXNoOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0Jsb2NrSGVhZGVyPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYSBibG9jayBoZWFkZXIgYnkgaXRzIGhlaWdodC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHQgLSBoZWlnaHQgb2YgdGhlIGJsb2NrIHRvIGdldCB0aGUgaGVhZGVyIG9mXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQmxvY2tIZWFkZXI+fSBibG9jaydzIGhlYWRlclxuICAgKi9cbiAgYXN5bmMgZ2V0QmxvY2tIZWFkZXJCeUhlaWdodChoZWlnaHQ6IG51bWJlcik6IFByb21pc2U8TW9uZXJvQmxvY2tIZWFkZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBibG9jayBoZWFkZXJzIGZvciB0aGUgZ2l2ZW4gcmFuZ2UuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gW3N0YXJ0SGVpZ2h0XSAtIHN0YXJ0IGhlaWdodCBsb3dlciBib3VuZCBpbmNsdXNpdmUgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW2VuZEhlaWdodF0gLSBlbmQgaGVpZ2h0IHVwcGVyIGJvdW5kIGluY2x1c2l2ZSAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQmxvY2tIZWFkZXJbXT59IGZvciB0aGUgZ2l2ZW4gcmFuZ2VcbiAgICovXG4gIGFzeW5jIGdldEJsb2NrSGVhZGVyc0J5UmFuZ2Uoc3RhcnRIZWlnaHQ/OiBudW1iZXIsIGVuZEhlaWdodD86IG51bWJlcik6IFByb21pc2U8TW9uZXJvQmxvY2tIZWFkZXJbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGEgYmxvY2sgYnkgaGFzaC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBibG9ja0hhc2ggLSBoYXNoIG9mIHRoZSBibG9jayB0byBnZXRcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9CbG9jaz59IHdpdGggdGhlIGdpdmVuIGhhc2hcbiAgICovXG4gIGFzeW5jIGdldEJsb2NrQnlIYXNoKGJsb2NrSGFzaDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9CbG9jaz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGJsb2NrcyBieSBoYXNoLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gYmxvY2tIYXNoZXMgLSBhcnJheSBvZiBoYXNoZXM7IGZpcnN0IDEwIGJsb2NrcyBoYXNoZXMgZ29lcyBzZXF1ZW50aWFsLFxuICAgKiAgICAgICAgbmV4dCBnb2VzIGluIHBvdygyLG4pIG9mZnNldCwgbGlrZSAyLCA0LCA4LCAxNiwgMzIsIDY0IGFuZCBzbyBvbixcbiAgICogICAgICAgIGFuZCB0aGUgbGFzdCBvbmUgaXMgYWx3YXlzIGdlbmVzaXMgYmxvY2tcbiAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0SGVpZ2h0IC0gc3RhcnQgaGVpZ2h0IHRvIGdldCBibG9ja3MgYnkgaGFzaFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtwcnVuZV0gLSBzcGVjaWZpZXMgaWYgcmV0dXJuZWQgYmxvY2tzIHNob3VsZCBiZSBwcnVuZWQgKGRlZmF1bHRzIHRvIGZhbHNlKSAgLy8gVE9ETzogdGVzdCBkZWZhdWx0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQmxvY2tbXT59IHJldHJpZXZlZCBibG9ja3NcbiAgICovXG4gIGFzeW5jIGdldEJsb2Nrc0J5SGFzaChibG9ja0hhc2hlczogc3RyaW5nW10sIHN0YXJ0SGVpZ2h0OiBudW1iZXIsIHBydW5lID0gZmFsc2UpOiBQcm9taXNlPE1vbmVyb0Jsb2NrW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhIGJsb2NrIGJ5IGhlaWdodC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHQgLSBoZWlnaHQgb2YgdGhlIGJsb2NrIHRvIGdldFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0Jsb2NrPn0gd2l0aCB0aGUgZ2l2ZW4gaGVpZ2h0XG4gICAqL1xuICBhc3luYyBnZXRCbG9ja0J5SGVpZ2h0KGhlaWdodDogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9CbG9jaz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGJsb2NrcyBhdCB0aGUgZ2l2ZW4gaGVpZ2h0cy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyW119IGhlaWdodHMgLSBoZWlnaHRzIG9mIHRoZSBibG9ja3MgdG8gZ2V0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQmxvY2tbXT59IGFyZSBibG9ja3MgYXQgdGhlIGdpdmVuIGhlaWdodHNcbiAgICovXG4gIGFzeW5jIGdldEJsb2Nrc0J5SGVpZ2h0KGhlaWdodHM6IG51bWJlcltdKTogUHJvbWlzZTxNb25lcm9CbG9ja1tdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYmxvY2tzIGluIHRoZSBnaXZlbiBoZWlnaHQgcmFuZ2UuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gW3N0YXJ0SGVpZ2h0XSAtIHN0YXJ0IGhlaWdodCBsb3dlciBib3VuZCBpbmNsdXNpdmUgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW2VuZEhlaWdodF0gLSBlbmQgaGVpZ2h0IHVwcGVyIGJvdW5kIGluY2x1c2l2ZSAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQmxvY2tbXT59IGFyZSBibG9ja3MgaW4gdGhlIGdpdmVuIGhlaWdodCByYW5nZVxuICAgKi9cbiAgYXN5bmMgZ2V0QmxvY2tzQnlSYW5nZShzdGFydEhlaWdodD86IG51bWJlciwgZW5kSGVpZ2h0PzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9CbG9ja1tdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYmxvY2tzIGluIHRoZSBnaXZlbiBoZWlnaHQgcmFuZ2UgYXMgY2h1bmtlZCByZXF1ZXN0cyBzbyB0aGF0IGVhY2ggcmVxdWVzdCBpc1xuICAgKiBub3QgdG9vIGJpZy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbc3RhcnRIZWlnaHRdIC0gc3RhcnQgaGVpZ2h0IGxvd2VyIGJvdW5kIGluY2x1c2l2ZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbZW5kSGVpZ2h0XSAtIGVuZCBoZWlnaHQgdXBwZXIgYm91bmQgaW5jbHVzaXZlIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFttYXhDaHVua1NpemVdIC0gbWF4aW11bSBjaHVuayBzaXplIGluIGFueSBvbmUgcmVxdWVzdCAoZGVmYXVsdCAzLDAwMCwwMDAgYnl0ZXMpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQmxvY2tbXT59IGJsb2NrcyBpbiB0aGUgZ2l2ZW4gaGVpZ2h0IHJhbmdlXG4gICAqL1xuICBhc3luYyBnZXRCbG9ja3NCeVJhbmdlQ2h1bmtlZChzdGFydEhlaWdodD86IG51bWJlciwgZW5kSGVpZ2h0PzogbnVtYmVyLCBtYXhDaHVua1NpemU/OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb0Jsb2NrW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBibG9jayBoYXNoZXMgYXMgYSBiaW5hcnkgcmVxdWVzdCB0byB0aGUgZGFlbW9uLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gYmxvY2tIYXNoZXMgLSBzcGVjaWZ5IGJsb2NrIGhhc2hlcyB0byBmZXRjaDsgZmlyc3QgMTAgYmxvY2tzIGhhc2ggZ29lc1xuICAgKiAgICAgICAgc2VxdWVudGlhbCwgbmV4dCBnb2VzIGluIHBvdygyLG4pIG9mZnNldCwgbGlrZSAyLCA0LCA4LCAxNiwgMzIsIDY0XG4gICAqICAgICAgICBhbmQgc28gb24sIGFuZCB0aGUgbGFzdCBvbmUgaXMgYWx3YXlzIGdlbmVzaXMgYmxvY2tcbiAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0SGVpZ2h0IC0gc3RhcnRpbmcgaGVpZ2h0IG9mIGJsb2NrIGhhc2hlcyB0byByZXR1cm5cbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmdbXT59IHJlcXVlc3RlZCBibG9jayBoYXNoZXMgICAgIFxuICAgKi9cbiAgYXN5bmMgZ2V0QmxvY2tIYXNoZXMoYmxvY2tIYXNoZXM6IHN0cmluZ1tdLCBzdGFydEhlaWdodDogbnVtYmVyKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGEgdHJhbnNhY3Rpb24gYnkgaGFzaC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eEhhc2ggLSBoYXNoIG9mIHRoZSB0cmFuc2FjdGlvbiB0byBnZXRcbiAgICogQHBhcmFtIHtib29sZWFufSBbcHJ1bmVdIC0gc3BlY2lmaWVzIGlmIHRoZSByZXR1cm5lZCB0eCBzaG91bGQgYmUgcHJ1bmVkIChkZWZhdWx0cyB0byBmYWxzZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeD59IHRyYW5zYWN0aW9uIHdpdGggdGhlIGdpdmVuIGhhc2ggb3IgdW5kZWZpbmVkIGlmIG5vdCBmb3VuZFxuICAgKi9cbiAgYXN5bmMgZ2V0VHgodHhIYXNoPzogc3RyaW5nLCBwcnVuZSA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9UeHx1bmRlZmluZWQ+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuZ2V0VHhzKFt0eEhhc2hdLCBwcnVuZSkpWzBdO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRyYW5zYWN0aW9ucyBieSBoYXNoZXMuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSB0eEhhc2hlcyAtIGhhc2hlcyBvZiB0cmFuc2FjdGlvbnMgdG8gZ2V0XG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3BydW5lXSAtIHNwZWNpZmllcyBpZiB0aGUgcmV0dXJuZWQgdHhzIHNob3VsZCBiZSBwcnVuZWQgKGRlZmF1bHRzIHRvIGZhbHNlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1R4W10+fSBmb3VuZCB0cmFuc2FjdGlvbnMgd2l0aCB0aGUgZ2l2ZW4gaGFzaGVzXG4gICAqL1xuICBhc3luYyBnZXRUeHModHhIYXNoZXM6IHN0cmluZ1tdLCBwcnVuZSA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9UeFtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYSB0cmFuc2FjdGlvbiBoZXggYnkgaGFzaC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eEhhc2ggLSBoYXNoIG9mIHRoZSB0cmFuc2FjdGlvbiB0byBnZXQgaGV4IGZyb21cbiAgICogQHBhcmFtIHtib29sZWFufSBbcHJ1bmVdIC0gc3BlY2lmaWVzIGlmIHRoZSByZXR1cm5lZCB0eCBoZXggc2hvdWxkIGJlIHBydW5lZCAoZGVmYXVsdHMgdG8gZmFsc2UpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdHggaGV4IHdpdGggdGhlIGdpdmVuIGhhc2hcbiAgICovXG4gIGFzeW5jIGdldFR4SGV4KHR4SGFzaDogc3RyaW5nLCBwcnVuZSA9IGZhbHNlKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuZ2V0VHhIZXhlcyhbdHhIYXNoXSwgcHJ1bmUpKVswXTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0cmFuc2FjdGlvbiBoZXhlcyBieSBoYXNoZXMuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSB0eEhhc2hlcyAtIGhhc2hlcyBvZiB0cmFuc2FjdGlvbnMgdG8gZ2V0IGhleGVzIGZyb21cbiAgICogQHBhcmFtIHtib29sZWFufSBbcHJ1bmVdIC0gc3BlY2lmaWVzIGlmIHRoZSByZXR1cm5lZCB0eCBoZXhlcyBzaG91bGQgYmUgcHJ1bmVkIChkZWZhdWx0cyB0byBmYWxzZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmdbXT59IHR4IGhleGVzXG4gICAqL1xuICBhc3luYyBnZXRUeEhleGVzKHR4SGFzaGVzOiBzdHJpbmdbXSwgcHJ1bmUgPSBmYWxzZSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldHMgdGhlIHRvdGFsIGVtaXNzaW9ucyBhbmQgZmVlcyBmcm9tIHRoZSBnZW5lc2lzIGJsb2NrIHRvIHRoZSBjdXJyZW50IGhlaWdodC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHQgLSBoZWlnaHQgdG8gc3RhcnQgY29tcHV0aW5nIHRoZSBtaW5lciBzdW1cbiAgICogQHBhcmFtIHtudW1iZXJ9IG51bUJsb2NrcyAtIG51bWJlciBvZiBibG9ja3MgdG8gaW5jbHVkZSBpbiB0aGUgc3VtXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvTWluZXJUeFN1bT59IGVuY2Fwc3VsYXRlcyB0aGUgdG90YWwgZW1pc3Npb25zIGFuZCBmZWVzIHNpbmNlIHRoZSBnZW5lc2lzIGJsb2NrXG4gICAqL1xuICBhc3luYyBnZXRNaW5lclR4U3VtKGhlaWdodDogbnVtYmVyLCBudW1CbG9ja3M6IG51bWJlcik6IFByb21pc2U8TW9uZXJvTWluZXJUeFN1bT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IG1pbmluZyBmZWUgZXN0aW1hdGVzIHBlciBrQi5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBncmFjZUJsb2NrcyBUT0RPXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvRmVlRXN0aW1hdGU+fSBtaW5pbmcgZmVlIGVzdGltYXRlcyBwZXIga0JcbiAgICovXG4gIGFzeW5jIGdldEZlZUVzdGltYXRlKGdyYWNlQmxvY2tzPzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9GZWVFc3RpbWF0ZT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU3VibWl0cyBhIHRyYW5zYWN0aW9uIHRvIHRoZSBkYWVtb24ncyBwb29sLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHR4SGV4IC0gcmF3IHRyYW5zYWN0aW9uIGhleCB0byBzdWJtaXRcbiAgICogQHBhcmFtIHtib29sZWFufSBkb05vdFJlbGF5IHNwZWNpZmllcyBpZiB0aGUgdHggc2hvdWxkIGJlIHJlbGF5ZWQgKGRlZmF1bHQgZmFsc2UsIGkuZS4gcmVsYXkpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvU3VibWl0VHhSZXN1bHQ+fSBjb250YWlucyBzdWJtaXNzaW9uIHJlc3VsdHNcbiAgICovXG4gIGFzeW5jIHN1Ym1pdFR4SGV4KHR4SGV4OiBzdHJpbmcsIGRvTm90UmVsYXkgPSBmYWxzZSk6IFByb21pc2U8TW9uZXJvU3VibWl0VHhSZXN1bHQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFJlbGF5cyBhIHRyYW5zYWN0aW9uIGJ5IGhhc2guXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHhIYXNoIC0gaGFzaCBvZiB0aGUgdHJhbnNhY3Rpb24gdG8gcmVsYXlcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHJlbGF5VHhCeUhhc2godHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhc3NlcnQuZXF1YWwodHlwZW9mIHR4SGFzaCwgXCJzdHJpbmdcIiwgXCJNdXN0IHByb3ZpZGUgYSB0cmFuc2FjdGlvbiBoYXNoXCIpO1xuICAgIGF3YWl0IHRoaXMucmVsYXlUeHNCeUhhc2goW3R4SGFzaF0pO1xuICB9XG4gIFxuICAvKipcbiAgICogUmVsYXlzIHRyYW5zYWN0aW9ucyBieSBoYXNoLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gdHhIYXNoZXMgLSBoYXNoZXMgb2YgdGhlIHRyYW5zYWN0aW5vcyB0byByZWxheVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgcmVsYXlUeHNCeUhhc2godHhIYXNoZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHZhbGlkIHRyYW5zYWN0aW9ucyBzZWVuIGJ5IHRoZSBub2RlIGJ1dCBub3QgeWV0IG1pbmVkIGludG8gYSBibG9jaywgYXMgd2VsbFxuICAgKiBhcyBzcGVudCBrZXkgaW1hZ2UgaW5mb3JtYXRpb24gZm9yIHRoZSB0eCBwb29sLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFtdPn0gYXJlIHRyYW5zYWN0aW9ucyBpbiB0aGUgdHJhbnNhY3Rpb24gcG9vbCFcbiAgICovXG4gIGFzeW5jIGdldFR4UG9vbCgpOiBQcm9taXNlPE1vbmVyb1R4W10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBoYXNoZXMgb2YgdHJhbnNhY3Rpb25zIGluIHRoZSB0cmFuc2FjdGlvbiBwb29sLlxuICAgKiBcbiAgICogQHJldHVybiB7c3RyaW5nW119IGFyZSBoYXNoZXMgb2YgdHJhbnNhY3Rpb25zIGluIHRoZSB0cmFuc2FjdGlvbiBwb29sXG4gICAqL1xuICBhc3luYyBnZXRUeFBvb2xIYXNoZXMoKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvLyAvKipcbiAgLy8gICogR2V0IGFsbCB0cmFuc2FjdGlvbiBwb29sIGJhY2tsb2cuXG4gIC8vICAqIFxuICAvLyAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1R4QmFja2xvZ0VudHJ5W10+fSBiYWNrbG9nIGVudHJpZXMgXG4gIC8vICAqL1xuICAvLyBhc3luYyBnZXRUeFBvb2xCYWNrbG9nKCk6IFByb21pc2U8TW9uZXJvVHhCYWNrbG9nRW50cnlbXT4ge1xuICAvLyAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICAvLyB9XG4gIFxuICAvKipcbiAgICogR2V0IHRyYW5zYWN0aW9uIHBvb2wgc3RhdGlzdGljcy5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvVHhQb29sU3RhdHM+fSBjb250YWlucyBzdGF0aXN0aWNzIGFib3V0IHRoZSB0cmFuc2FjdGlvbiBwb29sXG4gICAqL1xuICBhc3luYyBnZXRUeFBvb2xTdGF0cygpOiBQcm9taXNlPE1vbmVyb1R4UG9vbFN0YXRzPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBGbHVzaCB0cmFuc2FjdGlvbnMgZnJvbSB0aGUgdHggcG9vbC5cbiAgICogXG4gICAqIEBwYXJhbSB7KHN0cmluZyB8IHN0cmluZ1tdKX0gW2hhc2hlc10gLSBzcGVjaWZpYyB0cmFuc2FjdGlvbnMgdG8gZmx1c2ggKGRlZmF1bHRzIHRvIGFsbClcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIGZsdXNoVHhQb29sKGhhc2hlcz86IHN0cmluZyB8IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHNwZW50IHN0YXR1cyBvZiB0aGUgZ2l2ZW4ga2V5IGltYWdlLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleUltYWdlIC0ga2V5IGltYWdlIGhleCB0byBnZXQgdGhlIHN0YXR1cyBvZlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0tleUltYWdlU3BlbnRTdGF0dXM+fSBzdGF0dXMgb2YgdGhlIGtleSBpbWFnZVxuICAgKi9cbiAgYXN5bmMgZ2V0S2V5SW1hZ2VTcGVudFN0YXR1cyhrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldEtleUltYWdlU3BlbnRTdGF0dXNlcyhba2V5SW1hZ2VdKSlbMF07XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHNwZW50IHN0YXR1cyBvZiBlYWNoIGdpdmVuIGtleSBpbWFnZS5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IGtleUltYWdlcyBhcmUgaGV4IGtleSBpbWFnZXMgdG8gZ2V0IHRoZSBzdGF0dXNlcyBvZlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0tleUltYWdlU3BlbnRTdGF0dXNbXT59IHN0YXR1cyBmb3IgZWFjaCBrZXkgaW1hZ2VcbiAgICovXG4gIGFzeW5jIGdldEtleUltYWdlU3BlbnRTdGF0dXNlcyhrZXlJbWFnZXM6IHN0cmluZ1tdKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBvdXRwdXRzIGlkZW50aWZpZWQgYnkgYSBsaXN0IG9mIG91dHB1dCBhbW91bnRzIGFuZCBpbmRpY2VzIGFzIGEgYmluYXJ5XG4gICAqIHJlcXVlc3QuXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb091dHB1dFtdfSBvdXRwdXRzIC0gaWRlbnRpZnkgZWFjaCBvdXRwdXQgYnkgYW1vdW50IGFuZCBpbmRleFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb091dHB1dFtdPn0gaWRlbnRpZmllZCBvdXRwdXRzXG4gICAqL1xuICBhc3luYyBnZXRPdXRwdXRzKG91dHB1dHM6IE1vbmVyb091dHB1dFtdKTogUHJvbWlzZTxNb25lcm9PdXRwdXRbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGEgaGlzdG9ncmFtIG9mIG91dHB1dCBhbW91bnRzLiBGb3IgYWxsIGFtb3VudHMgKHBvc3NpYmx5IGZpbHRlcmVkIGJ5XG4gICAqIHBhcmFtZXRlcnMpLCBnaXZlcyB0aGUgbnVtYmVyIG9mIG91dHB1dHMgb24gdGhlIGNoYWluIGZvciB0aGF0IGFtb3VudC5cbiAgICogUmluZ0NUIG91dHB1dHMgY291bnRzIGFzIDAgYW1vdW50LlxuICAgKiBcbiAgICogQHBhcmFtIHtiaWdpbnRbXX0gW2Ftb3VudHNdIC0gYW1vdW50cyBvZiBvdXRwdXRzIHRvIG1ha2UgdGhlIGhpc3RvZ3JhbSB3aXRoXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbbWluQ291bnRdIC0gVE9ET1xuICAgKiBAcGFyYW0ge251bWJlcn0gW21heENvdW50XSAtIFRPRE9cbiAgICogQHBhcmFtIHtib29sZWFufSBbaXNVbmxvY2tlZF0gLSBtYWtlcyBhIGhpc3RvZ3JhbSB3aXRoIG91dHB1dHMgd2l0aCB0aGUgc3BlY2lmaWVkIGxvY2sgc3RhdGVcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtyZWNlbnRDdXRvZmZdIC0gVE9ET1xuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb091dHB1dEhpc3RvZ3JhbUVudHJ5W10+fSBhcmUgZW50cmllcyBtZWV0aW5nIHRoZSBwYXJhbWV0ZXJzXG4gICAqL1xuICBhc3luYyBnZXRPdXRwdXRIaXN0b2dyYW0oYW1vdW50cz86IGJpZ2ludFtdLCBtaW5Db3VudD86IG51bWJlciwgbWF4Q291bnQ/OiBudW1iZXIsIGlzVW5sb2NrZWQ/OiBib29sZWFuLCByZWNlbnRDdXRvZmY/OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb091dHB1dEhpc3RvZ3JhbUVudHJ5W10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLy8gLyoqXG4gIC8vICAqIENyZWF0ZXMgYW4gb3V0cHV0IGRpc3RyaWJ1dGlvbi5cbiAgLy8gICogXG4gIC8vICAqIEBwYXJhbSB7YmlnaW50W119IGFtb3VudHMgLSBhbW91bnRzIG9mIG91dHB1dHMgdG8gbWFrZSB0aGUgZGlzdHJpYnV0aW9uIHdpdGhcbiAgLy8gICogQHBhcmFtIHtib29sZWFufSBbY3VtdWxhdGl2ZV0gLSBzcGVjaWZpZXMgaWYgdGhlIHJlc3VsdHMgc2hvdWxkIGJlIGN1bXVsYXRpdmUgKGRlZmF1bHRzIHRvIFRPRE8pXG4gIC8vICAqIEBwYXJhbSB7bnVtYmVyfSBbc3RhcnRIZWlnaHRdIC0gc3RhcnQgaGVpZ2h0IGxvd2VyIGJvdW5kIGluY2x1c2l2ZSAob3B0aW9uYWwpXG4gIC8vICAqIEBwYXJhbSB7bnVtYmVyfSBbZW5kSGVpZ2h0XSAtIGVuZCBoZWlnaHQgdXBwZXIgYm91bmQgaW5jbHVzaXZlIChvcHRpb25hbClcbiAgLy8gICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9PdXRwdXREaXN0cmlidXRpb25FbnRyeVtdPn0gYXJlIGVudHJpZXMgbWVldGluZyB0aGUgcGFyYW1ldGVyc1xuICAvLyAgKi9cbiAgLy8gYXN5bmMgZ2V0T3V0cHV0RGlzdHJpYnV0aW9uKGFtb3VudHM6IGJpZ2ludFtdLCBjdW11bGF0aXZlPzogYm9vbGVhbiwgc3RhcnRIZWlnaHQ/OiBudW1iZXIsIGVuZEhlaWdodD86IG51bWJlcik6IFByb21pc2U8TW9uZXJvT3V0cHV0RGlzdHJpYnV0aW9uRW50cnlbXT4ge1xuICAvLyAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICAvLyB9XG4gIFxuICAvKipcbiAgICogR2V0IGdlbmVyYWwgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHN0YXRlIG9mIHRoZSBub2RlIGFuZCB0aGUgbmV0d29yay5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvRGFlbW9uSW5mbz59IGlzIGdlbmVyYWwgaW5mb3JtYXRpb24gYWJvdXQgdGhlIG5vZGUgYW5kIG5ldHdvcmtcbiAgICovXG4gIGFzeW5jIGdldEluZm8oKTogUHJvbWlzZTxNb25lcm9EYWVtb25JbmZvPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgc3luY2hyb25pemF0aW9uIGluZm9ybWF0aW9uLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9EYWVtb25TeW5jSW5mbz59IGNvbnRhaW5zIHN5bmMgaW5mb3JtYXRpb25cbiAgICovXG4gIGFzeW5jIGdldFN5bmNJbmZvKCk6IFByb21pc2U8TW9uZXJvRGFlbW9uU3luY0luZm8+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIExvb2sgdXAgaW5mb3JtYXRpb24gcmVnYXJkaW5nIGhhcmQgZm9yayB2b3RpbmcgYW5kIHJlYWRpbmVzcy5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvSGFyZEZvcmtJbmZvPiB9IGNvbnRhaW5zIGhhcmQgZm9yayBpbmZvcm1hdGlvblxuICAgKi9cbiAgYXN5bmMgZ2V0SGFyZEZvcmtJbmZvKCk6IFByb21pc2U8TW9uZXJvSGFyZEZvcmtJbmZvPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYWx0ZXJuYXRpdmUgY2hhaW5zIHNlZW4gYnkgdGhlIG5vZGUuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0FsdENoYWluW10+fSBhbHRlcm5hdGl2ZSBjaGFpbnNcbiAgICovXG4gIGFzeW5jIGdldEFsdENoYWlucygpOiBQcm9taXNlPE1vbmVyb0FsdENoYWluW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBrbm93biBibG9jayBoYXNoZXMgd2hpY2ggYXJlIG5vdCBvbiB0aGUgbWFpbiBjaGFpbi5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nW10+fSBrbm93biBibG9jayBoYXNoZXMgd2hpY2ggYXJlIG5vdCBvbiB0aGUgbWFpbiBjaGFpblxuICAgKi9cbiAgYXN5bmMgZ2V0QWx0QmxvY2tIYXNoZXMoKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBkb3dubG9hZCBiYW5kd2lkdGggbGltaXQuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlcj59IGRvd25sb2FkIGJhbmR3aWR0aCBsaW1pdFxuICAgKi9cbiAgYXN5bmMgZ2V0RG93bmxvYWRMaW1pdCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU2V0IHRoZSBkb3dubG9hZCBiYW5kd2lkdGggbGltaXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gbGltaXQgLSBkb3dubG9hZCBsaW1pdCB0byBzZXQgKC0xIHRvIHJlc2V0IHRvIGRlZmF1bHQpXG4gICAqIEByZXR1cm4ge251bWJlcn0gbmV3IGRvd25sb2FkIGxpbWl0IGFmdGVyIHNldHRpbmdcbiAgICovXG4gIGFzeW5jIHNldERvd25sb2FkTGltaXQobGltaXQ6IG51bWJlcik6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZXNldCB0aGUgZG93bmxvYWQgYmFuZHdpZHRoIGxpbWl0LlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxudW1iZXI+fSBkb3dubG9hZCBiYW5kd2lkdGggbGltaXQgYWZ0ZXIgcmVzZXR0aW5nXG4gICAqL1xuICBhc3luYyByZXNldERvd25sb2FkTGltaXQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgdXBsb2FkIGJhbmR3aWR0aCBsaW1pdC5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyPn0gdXBsb2FkIGJhbmR3aWR0aCBsaW1pdFxuICAgKi9cbiAgYXN5bmMgZ2V0VXBsb2FkTGltaXQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNldCB0aGUgdXBsb2FkIGJhbmR3aWR0aCBsaW1pdC5cbiAgICogXG4gICAqIEBwYXJhbSBsaW1pdCAtIHVwbG9hZCBsaW1pdCB0byBzZXQgKC0xIHRvIHJlc2V0IHRvIGRlZmF1bHQpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyPn0gbmV3IHVwbG9hZCBsaW1pdCBhZnRlciBzZXR0aW5nXG4gICAqL1xuICBhc3luYyBzZXRVcGxvYWRMaW1pdChsaW1pdDogbnVtYmVyKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFJlc2V0IHRoZSB1cGxvYWQgYmFuZHdpZHRoIGxpbWl0LlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxudW1iZXI+fSB1cGxvYWQgYmFuZHdpZHRoIGxpbWl0IGFmdGVyIHJlc2V0dGluZ1xuICAgKi9cbiAgYXN5bmMgcmVzZXRVcGxvYWRMaW1pdCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHBlZXJzIHdpdGggYWN0aXZlIGluY29taW5nIG9yIG91dGdvaW5nIGNvbm5lY3Rpb25zIHRvIHRoZSBub2RlLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9QZWVyW10+fSB0aGUgZGFlbW9uJ3MgcGVlcnNcbiAgICovXG4gIGFzeW5jIGdldFBlZXJzKCk6IFByb21pc2U8TW9uZXJvUGVlcltdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQga25vd24gcGVlcnMgaW5jbHVkaW5nIHRoZWlyIGxhc3Qga25vd24gb25saW5lIHN0YXR1cy5cbiAgICogXG4gICAqIEByZXR1cm4ge01vbmVyb1BlZXJbXX0gdGhlIGRhZW1vbidzIGtub3duIHBlZXJzXG4gICAqL1xuICBhc3luYyBnZXRLbm93blBlZXJzKCk6IFByb21pc2U8TW9uZXJvUGVlcltdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBMaW1pdCBudW1iZXIgb2Ygb3V0Z29pbmcgcGVlcnMuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gbGltaXQgLSBtYXhpbXVtIG51bWJlciBvZiBvdXRnb2luZyBwZWVyc1xuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc2V0T3V0Z29pbmdQZWVyTGltaXQobGltaXQ6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogTGltaXQgbnVtYmVyIG9mIGluY29taW5nIHBlZXJzLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGxpbWl0IC0gbWF4aW11bSBudW1iZXIgb2YgaW5jb21pbmcgcGVlcnNcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHNldEluY29taW5nUGVlckxpbWl0KGxpbWl0OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBwZWVyIGJhbnMuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0JhbltdPn0gZW50cmllcyBhYm91dCBiYW5uZWQgcGVlcnNcbiAgICovXG4gIGFzeW5jIGdldFBlZXJCYW5zKCk6IFByb21pc2U8TW9uZXJvQmFuW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCYW4gYSBwZWVyIG5vZGUuXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb0Jhbn0gYmFuIC0gY29udGFpbnMgaW5mb3JtYXRpb24gYWJvdXQgYSBub2RlIHRvIGJhblxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc2V0UGVlckJhbihiYW46IE1vbmVyb0Jhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLnNldFBlZXJCYW5zKFtiYW5dKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEJhbiBwZWVycyBub2Rlcy5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvQmFuW119IGJhbnMgLSBzcGVjaWZ5IHdoaWNoIHBlZXJzIHRvIGJhblxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc2V0UGVlckJhbnMoYmFuczogTW9uZXJvQmFuW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN0YXJ0IG1pbmluZy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhZGRyZXNzIC0gYWRkcmVzcyBnaXZlbiBtaW5lciByZXdhcmRzIGlmIHRoZSBkYWVtb24gbWluZXMgYSBibG9ja1xuICAgKiBAcGFyYW0ge2ludGVnZXJ9IFtudW1UaHJlYWRzXSAtIG51bWJlciBvZiBtaW5pbmcgdGhyZWFkcyB0byBydW4gKGRlZmF1bHQgMSlcbiAgICogQHBhcmFtIHtib29sZWFufSBbaXNCYWNrZ3JvdW5kXSAtIHNwZWNpZmllcyBpZiB0aGUgbWluZXIgc2hvdWxkIHJ1biBpbiB0aGUgYmFja2dyb3VuZCBvciBub3QgKGRlZmF1bHQgZmFsc2UpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lnbm9yZUJhdHRlcnldIC0gc3BlY2lmaWVzIGlmIHRoZSBiYXR0ZXJ5IHN0YXRlIChlLmcuIG9uIGxhcHRvcCkgc2hvdWxkIGJlIGlnbm9yZWQgb3Igbm90IChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc3RhcnRNaW5pbmcoYWRkcmVzczogc3RyaW5nLCBudW1UaHJlYWRzPzogbnVtYmVyLCBpc0JhY2tncm91bmQ/OiBib29sZWFuLCBpZ25vcmVCYXR0ZXJ5PzogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU3RvcCBtaW5pbmcuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc3RvcE1pbmluZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgZGFlbW9uJ3MgbWluaW5nIHN0YXR1cy5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvTWluaW5nU3RhdHVzPn0gZGFlbW9uJ3MgbWluaW5nIHN0YXR1c1xuICAgKi9cbiAgYXN5bmMgZ2V0TWluaW5nU3RhdHVzKCk6IFByb21pc2U8TW9uZXJvTWluaW5nU3RhdHVzPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTdWJtaXQgYSBtaW5lZCBibG9jayB0byB0aGUgbmV0d29yay5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBibG9ja0Jsb2IgLSBtaW5lZCBibG9jayB0byBzdWJtaXRcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHN1Ym1pdEJsb2NrKGJsb2NrQmxvYjogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5zdWJtaXRCbG9ja3MoW2Jsb2NrQmxvYl0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFBydW5lIHRoZSBibG9ja2NoYWluLlxuICAgKiBcbiAgICogQHBhcmFtIHtib29sZWFufSBjaGVjayBzcGVjaWZpZXMgdG8gY2hlY2sgdGhlIHBydW5pbmcgKGRlZmF1bHQgZmFsc2UpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvUHJ1bmVSZXN1bHQ+fSB0aGUgcHJ1bmUgcmVzdWx0XG4gICAqL1xuICBhc3luYyBwcnVuZUJsb2NrY2hhaW4oY2hlY2s6IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb1BydW5lUmVzdWx0PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTdWJtaXQgbWluZWQgYmxvY2tzIHRvIHRoZSBuZXR3b3JrLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gYmxvY2tCbG9icyAtIG1pbmVkIGJsb2NrcyB0byBzdWJtaXRcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHN1Ym1pdEJsb2NrcyhibG9ja0Jsb2JzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogQ2hlY2sgZm9yIHVwZGF0ZS5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQ+fSB0aGUgcmVzdWx0XG4gICAqL1xuICBhc3luYyBjaGVja0ZvclVwZGF0ZSgpOiBQcm9taXNlPE1vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEb3dubG9hZCBhbiB1cGRhdGUuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3BhdGhdIC0gcGF0aCB0byBkb3dubG9hZCB0aGUgdXBkYXRlIChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdD59IHRoZSByZXN1bHRcbiAgICovXG4gIGFzeW5jIGRvd25sb2FkVXBkYXRlKHBhdGg/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTYWZlbHkgZGlzY29ubmVjdCBhbmQgc2h1dCBkb3duIHRoZSBkYWVtb24uXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc3RvcCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgaGVhZGVyIG9mIHRoZSBuZXh0IGJsb2NrIGFkZGVkIHRvIHRoZSBjaGFpbi5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQmxvY2tIZWFkZXI+fSBoZWFkZXIgb2YgdGhlIG5leHQgYmxvY2sgYWRkZWQgdG8gdGhlIGNoYWluXG4gICAqL1xuICBhc3luYyB3YWl0Rm9yTmV4dEJsb2NrSGVhZGVyKCk6IFByb21pc2U8TW9uZXJvQmxvY2tIZWFkZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxu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