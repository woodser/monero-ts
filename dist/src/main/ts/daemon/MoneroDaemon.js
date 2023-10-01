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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfTW9uZXJvRXJyb3IiLCJNb25lcm9EYWVtb24iLCJhZGRMaXN0ZW5lciIsImxpc3RlbmVyIiwiTW9uZXJvRXJyb3IiLCJyZW1vdmVMaXN0ZW5lciIsImdldExpc3RlbmVycyIsImlzQ29ubmVjdGVkIiwiZ2V0VmVyc2lvbiIsImlzVHJ1c3RlZCIsImdldEhlaWdodCIsImdldEJsb2NrSGFzaCIsImhlaWdodCIsImdldEJsb2NrVGVtcGxhdGUiLCJ3YWxsZXRBZGRyZXNzIiwicmVzZXJ2ZVNpemUiLCJnZXRMYXN0QmxvY2tIZWFkZXIiLCJnZXRCbG9ja0hlYWRlckJ5SGFzaCIsImJsb2NrSGFzaCIsImdldEJsb2NrSGVhZGVyQnlIZWlnaHQiLCJnZXRCbG9ja0hlYWRlcnNCeVJhbmdlIiwic3RhcnRIZWlnaHQiLCJlbmRIZWlnaHQiLCJnZXRCbG9ja0J5SGFzaCIsImdldEJsb2Nrc0J5SGFzaCIsImJsb2NrSGFzaGVzIiwicHJ1bmUiLCJnZXRCbG9ja0J5SGVpZ2h0IiwiZ2V0QmxvY2tzQnlIZWlnaHQiLCJoZWlnaHRzIiwiZ2V0QmxvY2tzQnlSYW5nZSIsImdldEJsb2Nrc0J5UmFuZ2VDaHVua2VkIiwibWF4Q2h1bmtTaXplIiwiZ2V0QmxvY2tIYXNoZXMiLCJnZXRUeCIsInR4SGFzaCIsImdldFR4cyIsInR4SGFzaGVzIiwiZ2V0VHhIZXgiLCJnZXRUeEhleGVzIiwiZ2V0TWluZXJUeFN1bSIsIm51bUJsb2NrcyIsImdldEZlZUVzdGltYXRlIiwiZ3JhY2VCbG9ja3MiLCJzdWJtaXRUeEhleCIsInR4SGV4IiwiZG9Ob3RSZWxheSIsInJlbGF5VHhCeUhhc2giLCJhc3NlcnQiLCJlcXVhbCIsInJlbGF5VHhzQnlIYXNoIiwiZ2V0VHhQb29sIiwiZ2V0VHhQb29sSGFzaGVzIiwiZ2V0VHhQb29sU3RhdHMiLCJmbHVzaFR4UG9vbCIsImhhc2hlcyIsImdldEtleUltYWdlU3BlbnRTdGF0dXMiLCJrZXlJbWFnZSIsImdldEtleUltYWdlU3BlbnRTdGF0dXNlcyIsImtleUltYWdlcyIsImdldE91dHB1dHMiLCJvdXRwdXRzIiwiZ2V0T3V0cHV0SGlzdG9ncmFtIiwiYW1vdW50cyIsIm1pbkNvdW50IiwibWF4Q291bnQiLCJpc1VubG9ja2VkIiwicmVjZW50Q3V0b2ZmIiwiZ2V0SW5mbyIsImdldFN5bmNJbmZvIiwiZ2V0SGFyZEZvcmtJbmZvIiwiZ2V0QWx0Q2hhaW5zIiwiZ2V0QWx0QmxvY2tIYXNoZXMiLCJnZXREb3dubG9hZExpbWl0Iiwic2V0RG93bmxvYWRMaW1pdCIsImxpbWl0IiwicmVzZXREb3dubG9hZExpbWl0IiwiZ2V0VXBsb2FkTGltaXQiLCJzZXRVcGxvYWRMaW1pdCIsInJlc2V0VXBsb2FkTGltaXQiLCJnZXRQZWVycyIsImdldEtub3duUGVlcnMiLCJzZXRPdXRnb2luZ1BlZXJMaW1pdCIsInNldEluY29taW5nUGVlckxpbWl0IiwiZ2V0UGVlckJhbnMiLCJzZXRQZWVyQmFuIiwiYmFuIiwic2V0UGVlckJhbnMiLCJiYW5zIiwic3RhcnRNaW5pbmciLCJhZGRyZXNzIiwibnVtVGhyZWFkcyIsImlzQmFja2dyb3VuZCIsImlnbm9yZUJhdHRlcnkiLCJzdG9wTWluaW5nIiwiZ2V0TWluaW5nU3RhdHVzIiwic3VibWl0QmxvY2siLCJibG9ja0Jsb2IiLCJzdWJtaXRCbG9ja3MiLCJwcnVuZUJsb2NrY2hhaW4iLCJjaGVjayIsImJsb2NrQmxvYnMiLCJjaGVja0ZvclVwZGF0ZSIsImRvd25sb2FkVXBkYXRlIiwicGF0aCIsInN0b3AiLCJ3YWl0Rm9yTmV4dEJsb2NrSGVhZGVyIiwiZXhwb3J0cyIsImRlZmF1bHQiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy9kYWVtb24vTW9uZXJvRGFlbW9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IE1vbmVyb0FsdENoYWluIGZyb20gXCIuL21vZGVsL01vbmVyb0FsdENoYWluXCI7XG5pbXBvcnQgTW9uZXJvQmFuIGZyb20gXCIuL21vZGVsL01vbmVyb0JhblwiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrIGZyb20gXCIuL21vZGVsL01vbmVyb0Jsb2NrXCI7XG5pbXBvcnQgTW9uZXJvQmxvY2tIZWFkZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQmxvY2tIZWFkZXJcIjtcbmltcG9ydCBNb25lcm9CbG9ja1RlbXBsYXRlIGZyb20gXCIuL21vZGVsL01vbmVyb0Jsb2NrVGVtcGxhdGVcIjtcbmltcG9ydCBNb25lcm9EYWVtb25JbmZvIGZyb20gXCIuL21vZGVsL01vbmVyb0RhZW1vbkluZm9cIjtcbmltcG9ydCBNb25lcm9EYWVtb25MaXN0ZW5lciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9EYWVtb25MaXN0ZW5lclwiO1xuaW1wb3J0IE1vbmVyb0RhZW1vblN5bmNJbmZvIGZyb20gXCIuL21vZGVsL01vbmVyb0RhZW1vblN5bmNJbmZvXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuLi9jb21tb24vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBNb25lcm9GZWVFc3RpbWF0ZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9GZWVFc3RpbWF0ZVwiO1xuaW1wb3J0IE1vbmVyb0hhcmRGb3JrSW5mbyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9IYXJkRm9ya0luZm9cIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzIGZyb20gXCIuL21vZGVsL01vbmVyb0tleUltYWdlU3BlbnRTdGF0dXNcIjtcbmltcG9ydCBNb25lcm9NaW5lclR4U3VtIGZyb20gXCIuL21vZGVsL01vbmVyb01pbmVyVHhTdW1cIjtcbmltcG9ydCBNb25lcm9NaW5pbmdTdGF0dXMgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTWluaW5nU3RhdHVzXCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0IGZyb20gXCIuL21vZGVsL01vbmVyb091dHB1dFwiO1xuLy9pbXBvcnQgTW9uZXJvT3V0cHV0RGlzdHJpYnV0aW9uRW50cnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0RGlzdHJpYnV0aW9uRW50cnlcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeVwiO1xuaW1wb3J0IE1vbmVyb05ldHdvcmtUeXBlIGZyb20gXCIuL21vZGVsL01vbmVyb05ldHdvcmtUeXBlXCI7XG5pbXBvcnQgTW9uZXJvUGVlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9QZWVyXCI7XG5pbXBvcnQgTW9uZXJvUHJ1bmVSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvUHJ1bmVSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9TdWJtaXRUeFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9TdWJtaXRUeFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb1R4IGZyb20gXCIuL21vZGVsL01vbmVyb1R4XCI7XG5pbXBvcnQgTW9uZXJvVHhQb29sU3RhdHMgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhQb29sU3RhdHNcIjtcbmltcG9ydCBNb25lcm9WZXJzaW9uIGZyb20gXCIuL21vZGVsL01vbmVyb1ZlcnNpb25cIjtcblxuLyoqXG4gKiBDb3B5cmlnaHQgKGMpIHdvb2RzZXJcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbi8qKlxuICogTW9uZXJvIGRhZW1vbiBpbnRlcmZhY2UgYW5kIGRlZmF1bHQgaW1wbGVtZW50YXRpb25zLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNb25lcm9EYWVtb24ge1xuICAgIFxuICAvKipcbiAgICogUmVnaXN0ZXIgYSBsaXN0ZW5lciB0byByZWNlaXZlIGRhZW1vbiBub3RpZmljYXRpb25zLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9EYWVtb25MaXN0ZW5lcn0gbGlzdGVuZXIgLSBsaXN0ZW5lciB0byByZWNlaXZlIGRhZW1vbiBub3RpZmljYXRpb25zXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBhZGRMaXN0ZW5lcihsaXN0ZW5lcjogTW9uZXJvRGFlbW9uTGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFVucmVnaXN0ZXIgYSBsaXN0ZW5lciB0byByZWNlaXZlIGRhZW1vbiBub3RpZmljYXRpb25zLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9EYWVtb25MaXN0ZW5lcn0gbGlzdGVuZXIgLSBsaXN0ZW5lciB0byB1bnJlZ2lzdGVyXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcjogTW9uZXJvRGFlbW9uTGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgbGlzdGVuZXJzIHJlZ2lzdGVyZWQgd2l0aCB0aGUgZGFlbW9uLlxuICAgKiBcbiAgICogQHJldHVybiB7TW9uZXJvRGFlbW9uTGlzdGVuZXJbXX0gdGhlIHJlZ2lzdGVyZWQgbGlzdGVuZXJzXG4gICAqL1xuICBnZXRMaXN0ZW5lcnMoKTogTW9uZXJvRGFlbW9uTGlzdGVuZXJbXSB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGNsaWVudCBpcyBjb25uZWN0ZWQgdG8gdGhlIGRhZW1vbiB2aWEgUlBDLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiB0aGUgY2xpZW50IGlzIGNvbm5lY3RlZCB0byB0aGUgZGFlbW9uLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzQ29ubmVjdGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0cyB0aGUgdmVyc2lvbiBvZiB0aGUgZGFlbW9uLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9WZXJzaW9uPn0gdGhlIHZlcnNpb24gb2YgdGhlIGRhZW1vblxuICAgKi9cbiAgYXN5bmMgZ2V0VmVyc2lvbigpOiBQcm9taXNlPE1vbmVyb1ZlcnNpb24+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZGFlbW9uIGlzIHRydXN0ZWQgeG9yIHVudHJ1c3RlZC5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgdGhlIGRhZW1vbiBpcyB0cnVzdGVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzVHJ1c3RlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgbnVtYmVyIG9mIGJsb2NrcyBpbiB0aGUgbG9uZ2VzdCBjaGFpbiBrbm93biB0byB0aGUgbm9kZS5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyPn0gdGhlIG51bWJlciBvZiBibG9ja3MhXG4gICAqL1xuICBhc3luYyBnZXRIZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhIGJsb2NrJ3MgaGFzaCBieSBpdHMgaGVpZ2h0LlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodCAtIGhlaWdodCBvZiB0aGUgYmxvY2sgaGFzaCB0byBnZXRcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgYmxvY2sncyBoYXNoIGF0IHRoZSBnaXZlbiBoZWlnaHRcbiAgICovXG4gIGFzeW5jIGdldEJsb2NrSGFzaChoZWlnaHQ6IG51bWJlcik6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYSBibG9jayB0ZW1wbGF0ZSBmb3IgbWluaW5nIGEgbmV3IGJsb2NrLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHdhbGxldEFkZHJlc3MgLSBhZGRyZXNzIG9mIHRoZSB3YWxsZXQgdG8gcmVjZWl2ZSBtaW5lciB0cmFuc2FjdGlvbnMgaWYgYmxvY2sgaXMgc3VjY2Vzc2Z1bGx5IG1pbmVkXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcmVzZXJ2ZVNpemVdIC0gcmVzZXJ2ZSBzaXplIChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9CbG9ja1RlbXBsYXRlPn0gaXMgYSBibG9jayB0ZW1wbGF0ZSBmb3IgbWluaW5nIGEgbmV3IGJsb2NrXG4gICAqL1xuICBhc3luYyBnZXRCbG9ja1RlbXBsYXRlKHdhbGxldEFkZHJlc3M6IHN0cmluZywgcmVzZXJ2ZVNpemU/OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb0Jsb2NrVGVtcGxhdGU+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgbGFzdCBibG9jaydzIGhlYWRlci5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQmxvY2tIZWFkZXI+fSBsYXN0IGJsb2NrJ3MgaGVhZGVyXG4gICAqL1xuICBhc3luYyBnZXRMYXN0QmxvY2tIZWFkZXIoKTogUHJvbWlzZTxNb25lcm9CbG9ja0hlYWRlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGEgYmxvY2sgaGVhZGVyIGJ5IGl0cyBoYXNoLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGJsb2NrSGFzaCAtIGhhc2ggb2YgdGhlIGJsb2NrIHRvIGdldCB0aGUgaGVhZGVyIG9mXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQmxvY2tIZWFkZXI+fSBibG9jaydzIGhlYWRlclxuICAgKi9cbiAgYXN5bmMgZ2V0QmxvY2tIZWFkZXJCeUhhc2goYmxvY2tIYXNoOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0Jsb2NrSGVhZGVyPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYSBibG9jayBoZWFkZXIgYnkgaXRzIGhlaWdodC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHQgLSBoZWlnaHQgb2YgdGhlIGJsb2NrIHRvIGdldCB0aGUgaGVhZGVyIG9mXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQmxvY2tIZWFkZXI+fSBibG9jaydzIGhlYWRlclxuICAgKi9cbiAgYXN5bmMgZ2V0QmxvY2tIZWFkZXJCeUhlaWdodChoZWlnaHQ6IG51bWJlcik6IFByb21pc2U8TW9uZXJvQmxvY2tIZWFkZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBibG9jayBoZWFkZXJzIGZvciB0aGUgZ2l2ZW4gcmFuZ2UuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gW3N0YXJ0SGVpZ2h0XSAtIHN0YXJ0IGhlaWdodCBsb3dlciBib3VuZCBpbmNsdXNpdmUgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW2VuZEhlaWdodF0gLSBlbmQgaGVpZ2h0IHVwcGVyIGJvdW5kIGluY2x1c2l2ZSAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQmxvY2tIZWFkZXJbXT59IGZvciB0aGUgZ2l2ZW4gcmFuZ2VcbiAgICovXG4gIGFzeW5jIGdldEJsb2NrSGVhZGVyc0J5UmFuZ2Uoc3RhcnRIZWlnaHQ/OiBudW1iZXIsIGVuZEhlaWdodD86IG51bWJlcik6IFByb21pc2U8TW9uZXJvQmxvY2tIZWFkZXJbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGEgYmxvY2sgYnkgaGFzaC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBibG9ja0hhc2ggLSBoYXNoIG9mIHRoZSBibG9jayB0byBnZXRcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9CbG9jaz59IHdpdGggdGhlIGdpdmVuIGhhc2hcbiAgICovXG4gIGFzeW5jIGdldEJsb2NrQnlIYXNoKGJsb2NrSGFzaDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9CbG9jaz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGJsb2NrcyBieSBoYXNoLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gYmxvY2tIYXNoZXMgLSBhcnJheSBvZiBoYXNoZXM7IGZpcnN0IDEwIGJsb2NrcyBoYXNoZXMgZ29lcyBzZXF1ZW50aWFsLFxuICAgKiAgICAgICAgbmV4dCBnb2VzIGluIHBvdygyLG4pIG9mZnNldCwgbGlrZSAyLCA0LCA4LCAxNiwgMzIsIDY0IGFuZCBzbyBvbixcbiAgICogICAgICAgIGFuZCB0aGUgbGFzdCBvbmUgaXMgYWx3YXlzIGdlbmVzaXMgYmxvY2tcbiAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0SGVpZ2h0IC0gc3RhcnQgaGVpZ2h0IHRvIGdldCBibG9ja3MgYnkgaGFzaFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtwcnVuZV0gLSBzcGVjaWZpZXMgaWYgcmV0dXJuZWQgYmxvY2tzIHNob3VsZCBiZSBwcnVuZWQgKGRlZmF1bHRzIHRvIGZhbHNlKSAgLy8gVE9ETzogdGVzdCBkZWZhdWx0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQmxvY2tbXT59IHJldHJpZXZlZCBibG9ja3NcbiAgICovXG4gIGFzeW5jIGdldEJsb2Nrc0J5SGFzaChibG9ja0hhc2hlczogc3RyaW5nW10sIHN0YXJ0SGVpZ2h0OiBudW1iZXIsIHBydW5lID0gZmFsc2UpOiBQcm9taXNlPE1vbmVyb0Jsb2NrW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhIGJsb2NrIGJ5IGhlaWdodC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHQgLSBoZWlnaHQgb2YgdGhlIGJsb2NrIHRvIGdldFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0Jsb2NrPn0gd2l0aCB0aGUgZ2l2ZW4gaGVpZ2h0XG4gICAqL1xuICBhc3luYyBnZXRCbG9ja0J5SGVpZ2h0KGhlaWdodDogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9CbG9jaz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGJsb2NrcyBhdCB0aGUgZ2l2ZW4gaGVpZ2h0cy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyW119IGhlaWdodHMgLSBoZWlnaHRzIG9mIHRoZSBibG9ja3MgdG8gZ2V0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQmxvY2tbXT59IGFyZSBibG9ja3MgYXQgdGhlIGdpdmVuIGhlaWdodHNcbiAgICovXG4gIGFzeW5jIGdldEJsb2Nrc0J5SGVpZ2h0KGhlaWdodHM6IG51bWJlcltdKTogUHJvbWlzZTxNb25lcm9CbG9ja1tdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYmxvY2tzIGluIHRoZSBnaXZlbiBoZWlnaHQgcmFuZ2UuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gW3N0YXJ0SGVpZ2h0XSAtIHN0YXJ0IGhlaWdodCBsb3dlciBib3VuZCBpbmNsdXNpdmUgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW2VuZEhlaWdodF0gLSBlbmQgaGVpZ2h0IHVwcGVyIGJvdW5kIGluY2x1c2l2ZSAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQmxvY2tbXT59IGFyZSBibG9ja3MgaW4gdGhlIGdpdmVuIGhlaWdodCByYW5nZVxuICAgKi9cbiAgYXN5bmMgZ2V0QmxvY2tzQnlSYW5nZShzdGFydEhlaWdodD86IG51bWJlciwgZW5kSGVpZ2h0PzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9CbG9ja1tdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYmxvY2tzIGluIHRoZSBnaXZlbiBoZWlnaHQgcmFuZ2UgYXMgY2h1bmtlZCByZXF1ZXN0cyBzbyB0aGF0IGVhY2ggcmVxdWVzdCBpc1xuICAgKiBub3QgdG9vIGJpZy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbc3RhcnRIZWlnaHRdIC0gc3RhcnQgaGVpZ2h0IGxvd2VyIGJvdW5kIGluY2x1c2l2ZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbZW5kSGVpZ2h0XSAtIGVuZCBoZWlnaHQgdXBwZXIgYm91bmQgaW5jbHVzaXZlIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFttYXhDaHVua1NpemVdIC0gbWF4aW11bSBjaHVuayBzaXplIGluIGFueSBvbmUgcmVxdWVzdCAoZGVmYXVsdCAzLDAwMCwwMDAgYnl0ZXMpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQmxvY2tbXT59IGJsb2NrcyBpbiB0aGUgZ2l2ZW4gaGVpZ2h0IHJhbmdlXG4gICAqL1xuICBhc3luYyBnZXRCbG9ja3NCeVJhbmdlQ2h1bmtlZChzdGFydEhlaWdodD86IG51bWJlciwgZW5kSGVpZ2h0PzogbnVtYmVyLCBtYXhDaHVua1NpemU/OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb0Jsb2NrW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBibG9jayBoYXNoZXMgYXMgYSBiaW5hcnkgcmVxdWVzdCB0byB0aGUgZGFlbW9uLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gYmxvY2tIYXNoZXMgLSBzcGVjaWZ5IGJsb2NrIGhhc2hlcyB0byBmZXRjaDsgZmlyc3QgMTAgYmxvY2tzIGhhc2ggZ29lc1xuICAgKiAgICAgICAgc2VxdWVudGlhbCwgbmV4dCBnb2VzIGluIHBvdygyLG4pIG9mZnNldCwgbGlrZSAyLCA0LCA4LCAxNiwgMzIsIDY0XG4gICAqICAgICAgICBhbmQgc28gb24sIGFuZCB0aGUgbGFzdCBvbmUgaXMgYWx3YXlzIGdlbmVzaXMgYmxvY2tcbiAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0SGVpZ2h0IC0gc3RhcnRpbmcgaGVpZ2h0IG9mIGJsb2NrIGhhc2hlcyB0byByZXR1cm5cbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmdbXT59IHJlcXVlc3RlZCBibG9jayBoYXNoZXMgICAgIFxuICAgKi9cbiAgYXN5bmMgZ2V0QmxvY2tIYXNoZXMoYmxvY2tIYXNoZXM6IHN0cmluZ1tdLCBzdGFydEhlaWdodDogbnVtYmVyKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGEgdHJhbnNhY3Rpb24gYnkgaGFzaC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eEhhc2ggLSBoYXNoIG9mIHRoZSB0cmFuc2FjdGlvbiB0byBnZXRcbiAgICogQHBhcmFtIHtib29sZWFufSBbcHJ1bmVdIC0gc3BlY2lmaWVzIGlmIHRoZSByZXR1cm5lZCB0eCBzaG91bGQgYmUgcHJ1bmVkIChkZWZhdWx0cyB0byBmYWxzZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeD59IHRyYW5zYWN0aW9uIHdpdGggdGhlIGdpdmVuIGhhc2ggb3IgdW5kZWZpbmVkIGlmIG5vdCBmb3VuZFxuICAgKi9cbiAgYXN5bmMgZ2V0VHgodHhIYXNoPzogc3RyaW5nLCBwcnVuZSA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9UeD4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRUeHMoW3R4SGFzaF0sIHBydW5lKSlbMF07XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdHJhbnNhY3Rpb25zIGJ5IGhhc2hlcy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IHR4SGFzaGVzIC0gaGFzaGVzIG9mIHRyYW5zYWN0aW9ucyB0byBnZXRcbiAgICogQHBhcmFtIHtib29sZWFufSBbcHJ1bmVdIC0gc3BlY2lmaWVzIGlmIHRoZSByZXR1cm5lZCB0eHMgc2hvdWxkIGJlIHBydW5lZCAoZGVmYXVsdHMgdG8gZmFsc2UpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvVHhbXT59IGZvdW5kIHRyYW5zYWN0aW9ucyB3aXRoIHRoZSBnaXZlbiBoYXNoZXNcbiAgICovXG4gIGFzeW5jIGdldFR4cyh0eEhhc2hlczogc3RyaW5nW10sIHBydW5lID0gZmFsc2UpOiBQcm9taXNlPE1vbmVyb1R4W10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhIHRyYW5zYWN0aW9uIGhleCBieSBoYXNoLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHR4SGFzaCAtIGhhc2ggb2YgdGhlIHRyYW5zYWN0aW9uIHRvIGdldCBoZXggZnJvbVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtwcnVuZV0gLSBzcGVjaWZpZXMgaWYgdGhlIHJldHVybmVkIHR4IGhleCBzaG91bGQgYmUgcHJ1bmVkIChkZWZhdWx0cyB0byBmYWxzZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0eCBoZXggd2l0aCB0aGUgZ2l2ZW4gaGFzaFxuICAgKi9cbiAgYXN5bmMgZ2V0VHhIZXgodHhIYXNoOiBzdHJpbmcsIHBydW5lID0gZmFsc2UpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRUeEhleGVzKFt0eEhhc2hdLCBwcnVuZSkpWzBdO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRyYW5zYWN0aW9uIGhleGVzIGJ5IGhhc2hlcy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IHR4SGFzaGVzIC0gaGFzaGVzIG9mIHRyYW5zYWN0aW9ucyB0byBnZXQgaGV4ZXMgZnJvbVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtwcnVuZV0gLSBzcGVjaWZpZXMgaWYgdGhlIHJldHVybmVkIHR4IGhleGVzIHNob3VsZCBiZSBwcnVuZWQgKGRlZmF1bHRzIHRvIGZhbHNlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZ1tdPn0gdHggaGV4ZXNcbiAgICovXG4gIGFzeW5jIGdldFR4SGV4ZXModHhIYXNoZXM6IHN0cmluZ1tdLCBwcnVuZSA9IGZhbHNlKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0cyB0aGUgdG90YWwgZW1pc3Npb25zIGFuZCBmZWVzIGZyb20gdGhlIGdlbmVzaXMgYmxvY2sgdG8gdGhlIGN1cnJlbnQgaGVpZ2h0LlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGhlaWdodCAtIGhlaWdodCB0byBzdGFydCBjb21wdXRpbmcgdGhlIG1pbmVyIHN1bVxuICAgKiBAcGFyYW0ge251bWJlcn0gbnVtQmxvY2tzIC0gbnVtYmVyIG9mIGJsb2NrcyB0byBpbmNsdWRlIGluIHRoZSBzdW1cbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9NaW5lclR4U3VtPn0gZW5jYXBzdWxhdGVzIHRoZSB0b3RhbCBlbWlzc2lvbnMgYW5kIGZlZXMgc2luY2UgdGhlIGdlbmVzaXMgYmxvY2tcbiAgICovXG4gIGFzeW5jIGdldE1pbmVyVHhTdW0oaGVpZ2h0OiBudW1iZXIsIG51bUJsb2NrczogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9NaW5lclR4U3VtPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgbWluaW5nIGZlZSBlc3RpbWF0ZXMgcGVyIGtCLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGdyYWNlQmxvY2tzIFRPRE9cbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9GZWVFc3RpbWF0ZT59IG1pbmluZyBmZWUgZXN0aW1hdGVzIHBlciBrQlxuICAgKi9cbiAgYXN5bmMgZ2V0RmVlRXN0aW1hdGUoZ3JhY2VCbG9ja3M/OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb0ZlZUVzdGltYXRlPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTdWJtaXRzIGEgdHJhbnNhY3Rpb24gdG8gdGhlIGRhZW1vbidzIHBvb2wuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHhIZXggLSByYXcgdHJhbnNhY3Rpb24gaGV4IHRvIHN1Ym1pdFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGRvTm90UmVsYXkgc3BlY2lmaWVzIGlmIHRoZSB0eCBzaG91bGQgYmUgcmVsYXllZCAoZGVmYXVsdCBmYWxzZSwgaS5lLiByZWxheSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9TdWJtaXRUeFJlc3VsdD59IGNvbnRhaW5zIHN1Ym1pc3Npb24gcmVzdWx0c1xuICAgKi9cbiAgYXN5bmMgc3VibWl0VHhIZXgodHhIZXg6IHN0cmluZywgZG9Ob3RSZWxheSA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9TdWJtaXRUeFJlc3VsdD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogUmVsYXlzIGEgdHJhbnNhY3Rpb24gYnkgaGFzaC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eEhhc2ggLSBoYXNoIG9mIHRoZSB0cmFuc2FjdGlvbiB0byByZWxheVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgcmVsYXlUeEJ5SGFzaCh0eEhhc2g6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGFzc2VydC5lcXVhbCh0eXBlb2YgdHhIYXNoLCBcInN0cmluZ1wiLCBcIk11c3QgcHJvdmlkZSBhIHRyYW5zYWN0aW9uIGhhc2hcIik7XG4gICAgYXdhaXQgdGhpcy5yZWxheVR4c0J5SGFzaChbdHhIYXNoXSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZWxheXMgdHJhbnNhY3Rpb25zIGJ5IGhhc2guXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSB0eEhhc2hlcyAtIGhhc2hlcyBvZiB0aGUgdHJhbnNhY3Rpbm9zIHRvIHJlbGF5XG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyByZWxheVR4c0J5SGFzaCh0eEhhc2hlczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdmFsaWQgdHJhbnNhY3Rpb25zIHNlZW4gYnkgdGhlIG5vZGUgYnV0IG5vdCB5ZXQgbWluZWQgaW50byBhIGJsb2NrLCBhcyB3ZWxsXG4gICAqIGFzIHNwZW50IGtleSBpbWFnZSBpbmZvcm1hdGlvbiBmb3IgdGhlIHR4IHBvb2wuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1R4W10+fSBhcmUgdHJhbnNhY3Rpb25zIGluIHRoZSB0cmFuc2FjdGlvbiBwb29sIVxuICAgKi9cbiAgYXN5bmMgZ2V0VHhQb29sKCk6IFByb21pc2U8TW9uZXJvVHhbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGhhc2hlcyBvZiB0cmFuc2FjdGlvbnMgaW4gdGhlIHRyYW5zYWN0aW9uIHBvb2wuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtzdHJpbmdbXX0gYXJlIGhhc2hlcyBvZiB0cmFuc2FjdGlvbnMgaW4gdGhlIHRyYW5zYWN0aW9uIHBvb2xcbiAgICovXG4gIGFzeW5jIGdldFR4UG9vbEhhc2hlcygpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8vIC8qKlxuICAvLyAgKiBHZXQgYWxsIHRyYW5zYWN0aW9uIHBvb2wgYmFja2xvZy5cbiAgLy8gICogXG4gIC8vICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvVHhCYWNrbG9nRW50cnlbXT59IGJhY2tsb2cgZW50cmllcyBcbiAgLy8gICovXG4gIC8vIGFzeW5jIGdldFR4UG9vbEJhY2tsb2coKTogUHJvbWlzZTxNb25lcm9UeEJhY2tsb2dFbnRyeVtdPiB7XG4gIC8vICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIC8vIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdHJhbnNhY3Rpb24gcG9vbCBzdGF0aXN0aWNzLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFBvb2xTdGF0cz59IGNvbnRhaW5zIHN0YXRpc3RpY3MgYWJvdXQgdGhlIHRyYW5zYWN0aW9uIHBvb2xcbiAgICovXG4gIGFzeW5jIGdldFR4UG9vbFN0YXRzKCk6IFByb21pc2U8TW9uZXJvVHhQb29sU3RhdHM+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEZsdXNoIHRyYW5zYWN0aW9ucyBmcm9tIHRoZSB0eCBwb29sLlxuICAgKiBcbiAgICogQHBhcmFtIHsoc3RyaW5nIHwgc3RyaW5nW10pfSBbaGFzaGVzXSAtIHNwZWNpZmljIHRyYW5zYWN0aW9ucyB0byBmbHVzaCAoZGVmYXVsdHMgdG8gYWxsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgZmx1c2hUeFBvb2woaGFzaGVzPzogc3RyaW5nIHwgc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgc3BlbnQgc3RhdHVzIG9mIHRoZSBnaXZlbiBrZXkgaW1hZ2UuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5SW1hZ2UgLSBrZXkgaW1hZ2UgaGV4IHRvIGdldCB0aGUgc3RhdHVzIG9mXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvS2V5SW1hZ2VTcGVudFN0YXR1cz59IHN0YXR1cyBvZiB0aGUga2V5IGltYWdlXG4gICAqL1xuICBhc3luYyBnZXRLZXlJbWFnZVNwZW50U3RhdHVzKGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlU3BlbnRTdGF0dXM+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuZ2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzKFtrZXlJbWFnZV0pKVswXTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgc3BlbnQgc3RhdHVzIG9mIGVhY2ggZ2l2ZW4ga2V5IGltYWdlLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0ga2V5SW1hZ2VzIGFyZSBoZXgga2V5IGltYWdlcyB0byBnZXQgdGhlIHN0YXR1c2VzIG9mXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvS2V5SW1hZ2VTcGVudFN0YXR1c1tdPn0gc3RhdHVzIGZvciBlYWNoIGtleSBpbWFnZVxuICAgKi9cbiAgYXN5bmMgZ2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzKGtleUltYWdlczogc3RyaW5nW10pOiBQcm9taXNlPE1vbmVyb0tleUltYWdlU3BlbnRTdGF0dXNbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IG91dHB1dHMgaWRlbnRpZmllZCBieSBhIGxpc3Qgb2Ygb3V0cHV0IGFtb3VudHMgYW5kIGluZGljZXMgYXMgYSBiaW5hcnlcbiAgICogcmVxdWVzdC5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvT3V0cHV0W119IG91dHB1dHMgLSBpZGVudGlmeSBlYWNoIG91dHB1dCBieSBhbW91bnQgYW5kIGluZGV4XG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvT3V0cHV0W10+fSBpZGVudGlmaWVkIG91dHB1dHNcbiAgICovXG4gIGFzeW5jIGdldE91dHB1dHMob3V0cHV0czogTW9uZXJvT3V0cHV0W10pOiBQcm9taXNlPE1vbmVyb091dHB1dFtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYSBoaXN0b2dyYW0gb2Ygb3V0cHV0IGFtb3VudHMuIEZvciBhbGwgYW1vdW50cyAocG9zc2libHkgZmlsdGVyZWQgYnlcbiAgICogcGFyYW1ldGVycyksIGdpdmVzIHRoZSBudW1iZXIgb2Ygb3V0cHV0cyBvbiB0aGUgY2hhaW4gZm9yIHRoYXQgYW1vdW50LlxuICAgKiBSaW5nQ1Qgb3V0cHV0cyBjb3VudHMgYXMgMCBhbW91bnQuXG4gICAqIFxuICAgKiBAcGFyYW0ge2JpZ2ludFtdfSBbYW1vdW50c10gLSBhbW91bnRzIG9mIG91dHB1dHMgdG8gbWFrZSB0aGUgaGlzdG9ncmFtIHdpdGhcbiAgICogQHBhcmFtIHtudW1iZXJ9IFttaW5Db3VudF0gLSBUT0RPXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbbWF4Q291bnRdIC0gVE9ET1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1VubG9ja2VkXSAtIG1ha2VzIGEgaGlzdG9ncmFtIHdpdGggb3V0cHV0cyB3aXRoIHRoZSBzcGVjaWZpZWQgbG9jayBzdGF0ZVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3JlY2VudEN1dG9mZl0gLSBUT0RPXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnlbXT59IGFyZSBlbnRyaWVzIG1lZXRpbmcgdGhlIHBhcmFtZXRlcnNcbiAgICovXG4gIGFzeW5jIGdldE91dHB1dEhpc3RvZ3JhbShhbW91bnRzPzogYmlnaW50W10sIG1pbkNvdW50PzogbnVtYmVyLCBtYXhDb3VudD86IG51bWJlciwgaXNVbmxvY2tlZD86IGJvb2xlYW4sIHJlY2VudEN1dG9mZj86IG51bWJlcik6IFByb21pc2U8TW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnlbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvLyAvKipcbiAgLy8gICogQ3JlYXRlcyBhbiBvdXRwdXQgZGlzdHJpYnV0aW9uLlxuICAvLyAgKiBcbiAgLy8gICogQHBhcmFtIHtiaWdpbnRbXX0gYW1vdW50cyAtIGFtb3VudHMgb2Ygb3V0cHV0cyB0byBtYWtlIHRoZSBkaXN0cmlidXRpb24gd2l0aFxuICAvLyAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjdW11bGF0aXZlXSAtIHNwZWNpZmllcyBpZiB0aGUgcmVzdWx0cyBzaG91bGQgYmUgY3VtdWxhdGl2ZSAoZGVmYXVsdHMgdG8gVE9ETylcbiAgLy8gICogQHBhcmFtIHtudW1iZXJ9IFtzdGFydEhlaWdodF0gLSBzdGFydCBoZWlnaHQgbG93ZXIgYm91bmQgaW5jbHVzaXZlIChvcHRpb25hbClcbiAgLy8gICogQHBhcmFtIHtudW1iZXJ9IFtlbmRIZWlnaHRdIC0gZW5kIGhlaWdodCB1cHBlciBib3VuZCBpbmNsdXNpdmUgKG9wdGlvbmFsKVxuICAvLyAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb091dHB1dERpc3RyaWJ1dGlvbkVudHJ5W10+fSBhcmUgZW50cmllcyBtZWV0aW5nIHRoZSBwYXJhbWV0ZXJzXG4gIC8vICAqL1xuICAvLyBhc3luYyBnZXRPdXRwdXREaXN0cmlidXRpb24oYW1vdW50czogYmlnaW50W10sIGN1bXVsYXRpdmU/OiBib29sZWFuLCBzdGFydEhlaWdodD86IG51bWJlciwgZW5kSGVpZ2h0PzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9PdXRwdXREaXN0cmlidXRpb25FbnRyeVtdPiB7XG4gIC8vICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIC8vIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgZ2VuZXJhbCBpbmZvcm1hdGlvbiBhYm91dCB0aGUgc3RhdGUgb2YgdGhlIG5vZGUgYW5kIHRoZSBuZXR3b3JrLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9EYWVtb25JbmZvPn0gaXMgZ2VuZXJhbCBpbmZvcm1hdGlvbiBhYm91dCB0aGUgbm9kZSBhbmQgbmV0d29ya1xuICAgKi9cbiAgYXN5bmMgZ2V0SW5mbygpOiBQcm9taXNlPE1vbmVyb0RhZW1vbkluZm8+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBzeW5jaHJvbml6YXRpb24gaW5mb3JtYXRpb24uXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0RhZW1vblN5bmNJbmZvPn0gY29udGFpbnMgc3luYyBpbmZvcm1hdGlvblxuICAgKi9cbiAgYXN5bmMgZ2V0U3luY0luZm8oKTogUHJvbWlzZTxNb25lcm9EYWVtb25TeW5jSW5mbz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogTG9vayB1cCBpbmZvcm1hdGlvbiByZWdhcmRpbmcgaGFyZCBmb3JrIHZvdGluZyBhbmQgcmVhZGluZXNzLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9IYXJkRm9ya0luZm8+IH0gY29udGFpbnMgaGFyZCBmb3JrIGluZm9ybWF0aW9uXG4gICAqL1xuICBhc3luYyBnZXRIYXJkRm9ya0luZm8oKTogUHJvbWlzZTxNb25lcm9IYXJkRm9ya0luZm8+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhbHRlcm5hdGl2ZSBjaGFpbnMgc2VlbiBieSB0aGUgbm9kZS5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQWx0Q2hhaW5bXT59IGFsdGVybmF0aXZlIGNoYWluc1xuICAgKi9cbiAgYXN5bmMgZ2V0QWx0Q2hhaW5zKCk6IFByb21pc2U8TW9uZXJvQWx0Q2hhaW5bXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGtub3duIGJsb2NrIGhhc2hlcyB3aGljaCBhcmUgbm90IG9uIHRoZSBtYWluIGNoYWluLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmdbXT59IGtub3duIGJsb2NrIGhhc2hlcyB3aGljaCBhcmUgbm90IG9uIHRoZSBtYWluIGNoYWluXG4gICAqL1xuICBhc3luYyBnZXRBbHRCbG9ja0hhc2hlcygpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGRvd25sb2FkIGJhbmR3aWR0aCBsaW1pdC5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyPn0gZG93bmxvYWQgYmFuZHdpZHRoIGxpbWl0XG4gICAqL1xuICBhc3luYyBnZXREb3dubG9hZExpbWl0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZXQgdGhlIGRvd25sb2FkIGJhbmR3aWR0aCBsaW1pdC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBsaW1pdCAtIGRvd25sb2FkIGxpbWl0IHRvIHNldCAoLTEgdG8gcmVzZXQgdG8gZGVmYXVsdClcbiAgICogQHJldHVybiB7bnVtYmVyfSBuZXcgZG93bmxvYWQgbGltaXQgYWZ0ZXIgc2V0dGluZ1xuICAgKi9cbiAgYXN5bmMgc2V0RG93bmxvYWRMaW1pdChsaW1pdDogbnVtYmVyKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFJlc2V0IHRoZSBkb3dubG9hZCBiYW5kd2lkdGggbGltaXQuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlcj59IGRvd25sb2FkIGJhbmR3aWR0aCBsaW1pdCBhZnRlciByZXNldHRpbmdcbiAgICovXG4gIGFzeW5jIHJlc2V0RG93bmxvYWRMaW1pdCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSB1cGxvYWQgYmFuZHdpZHRoIGxpbWl0LlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxudW1iZXI+fSB1cGxvYWQgYmFuZHdpZHRoIGxpbWl0XG4gICAqL1xuICBhc3luYyBnZXRVcGxvYWRMaW1pdCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU2V0IHRoZSB1cGxvYWQgYmFuZHdpZHRoIGxpbWl0LlxuICAgKiBcbiAgICogQHBhcmFtIGxpbWl0IC0gdXBsb2FkIGxpbWl0IHRvIHNldCAoLTEgdG8gcmVzZXQgdG8gZGVmYXVsdClcbiAgICogQHJldHVybiB7UHJvbWlzZTxudW1iZXI+fSBuZXcgdXBsb2FkIGxpbWl0IGFmdGVyIHNldHRpbmdcbiAgICovXG4gIGFzeW5jIHNldFVwbG9hZExpbWl0KGxpbWl0OiBudW1iZXIpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogUmVzZXQgdGhlIHVwbG9hZCBiYW5kd2lkdGggbGltaXQuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlcj59IHVwbG9hZCBiYW5kd2lkdGggbGltaXQgYWZ0ZXIgcmVzZXR0aW5nXG4gICAqL1xuICBhc3luYyByZXNldFVwbG9hZExpbWl0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgcGVlcnMgd2l0aCBhY3RpdmUgaW5jb21pbmcgb3Igb3V0Z29pbmcgY29ubmVjdGlvbnMgdG8gdGhlIG5vZGUuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1BlZXJbXT59IHRoZSBkYWVtb24ncyBwZWVyc1xuICAgKi9cbiAgYXN5bmMgZ2V0UGVlcnMoKTogUHJvbWlzZTxNb25lcm9QZWVyW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBrbm93biBwZWVycyBpbmNsdWRpbmcgdGhlaXIgbGFzdCBrbm93biBvbmxpbmUgc3RhdHVzLlxuICAgKiBcbiAgICogQHJldHVybiB7TW9uZXJvUGVlcltdfSB0aGUgZGFlbW9uJ3Mga25vd24gcGVlcnNcbiAgICovXG4gIGFzeW5jIGdldEtub3duUGVlcnMoKTogUHJvbWlzZTxNb25lcm9QZWVyW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIExpbWl0IG51bWJlciBvZiBvdXRnb2luZyBwZWVycy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBsaW1pdCAtIG1heGltdW0gbnVtYmVyIG9mIG91dGdvaW5nIHBlZXJzXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzZXRPdXRnb2luZ1BlZXJMaW1pdChsaW1pdDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBMaW1pdCBudW1iZXIgb2YgaW5jb21pbmcgcGVlcnMuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gbGltaXQgLSBtYXhpbXVtIG51bWJlciBvZiBpbmNvbWluZyBwZWVyc1xuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc2V0SW5jb21pbmdQZWVyTGltaXQobGltaXQ6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHBlZXIgYmFucy5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQmFuW10+fSBlbnRyaWVzIGFib3V0IGJhbm5lZCBwZWVyc1xuICAgKi9cbiAgYXN5bmMgZ2V0UGVlckJhbnMoKTogUHJvbWlzZTxNb25lcm9CYW5bXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEJhbiBhIHBlZXIgbm9kZS5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvQmFufSBiYW4gLSBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCBhIG5vZGUgdG8gYmFuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzZXRQZWVyQmFuKGJhbjogTW9uZXJvQmFuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuc2V0UGVlckJhbnMoW2Jhbl0pO1xuICB9XG4gIFxuICAvKipcbiAgICogQmFuIHBlZXJzIG5vZGVzLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9CYW5bXX0gYmFucyAtIHNwZWNpZnkgd2hpY2ggcGVlcnMgdG8gYmFuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzZXRQZWVyQmFucyhiYW5zOiBNb25lcm9CYW5bXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU3RhcnQgbWluaW5nLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGFkZHJlc3MgLSBhZGRyZXNzIGdpdmVuIG1pbmVyIHJld2FyZHMgaWYgdGhlIGRhZW1vbiBtaW5lcyBhIGJsb2NrXG4gICAqIEBwYXJhbSB7aW50ZWdlcn0gW251bVRocmVhZHNdIC0gbnVtYmVyIG9mIG1pbmluZyB0aHJlYWRzIHRvIHJ1biAoZGVmYXVsdCAxKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc0JhY2tncm91bmRdIC0gc3BlY2lmaWVzIGlmIHRoZSBtaW5lciBzaG91bGQgcnVuIGluIHRoZSBiYWNrZ3JvdW5kIG9yIG5vdCAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHBhcmFtIHtib29sZWFufSBbaWdub3JlQmF0dGVyeV0gLSBzcGVjaWZpZXMgaWYgdGhlIGJhdHRlcnkgc3RhdGUgKGUuZy4gb24gbGFwdG9wKSBzaG91bGQgYmUgaWdub3JlZCBvciBub3QgKGRlZmF1bHQgZmFsc2UpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzdGFydE1pbmluZyhhZGRyZXNzOiBzdHJpbmcsIG51bVRocmVhZHM/OiBudW1iZXIsIGlzQmFja2dyb3VuZD86IGJvb2xlYW4sIGlnbm9yZUJhdHRlcnk/OiBib29sZWFuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTdG9wIG1pbmluZy5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzdG9wTWluaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBkYWVtb24ncyBtaW5pbmcgc3RhdHVzLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9NaW5pbmdTdGF0dXM+fSBkYWVtb24ncyBtaW5pbmcgc3RhdHVzXG4gICAqL1xuICBhc3luYyBnZXRNaW5pbmdTdGF0dXMoKTogUHJvbWlzZTxNb25lcm9NaW5pbmdTdGF0dXM+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN1Ym1pdCBhIG1pbmVkIGJsb2NrIHRvIHRoZSBuZXR3b3JrLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGJsb2NrQmxvYiAtIG1pbmVkIGJsb2NrIHRvIHN1Ym1pdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc3VibWl0QmxvY2soYmxvY2tCbG9iOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLnN1Ym1pdEJsb2NrcyhbYmxvY2tCbG9iXSk7XG4gIH1cblxuICAvKipcbiAgICogUHJ1bmUgdGhlIGJsb2NrY2hhaW4uXG4gICAqIFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGNoZWNrIHNwZWNpZmllcyB0byBjaGVjayB0aGUgcHJ1bmluZyAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9QcnVuZVJlc3VsdD59IHRoZSBwcnVuZSByZXN1bHRcbiAgICovXG4gIGFzeW5jIHBydW5lQmxvY2tjaGFpbihjaGVjazogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvUHJ1bmVSZXN1bHQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN1Ym1pdCBtaW5lZCBibG9ja3MgdG8gdGhlIG5ldHdvcmsuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBibG9ja0Jsb2JzIC0gbWluZWQgYmxvY2tzIHRvIHN1Ym1pdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc3VibWl0QmxvY2tzKGJsb2NrQmxvYnM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3ViY2xhc3MgbXVzdCBpbXBsZW1lbnRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDaGVjayBmb3IgdXBkYXRlLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9EYWVtb25VcGRhdGVDaGVja1Jlc3VsdD59IHRoZSByZXN1bHRcbiAgICovXG4gIGFzeW5jIGNoZWNrRm9yVXBkYXRlKCk6IFByb21pc2U8TW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIERvd25sb2FkIGFuIHVwZGF0ZS5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcGF0aF0gLSBwYXRoIHRvIGRvd25sb2FkIHRoZSB1cGRhdGUgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0Pn0gdGhlIHJlc3VsdFxuICAgKi9cbiAgYXN5bmMgZG93bmxvYWRVcGRhdGUocGF0aD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTdWJjbGFzcyBtdXN0IGltcGxlbWVudFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNhZmVseSBkaXNjb25uZWN0IGFuZCBzaHV0IGRvd24gdGhlIGRhZW1vbi5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzdG9wKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBoZWFkZXIgb2YgdGhlIG5leHQgYmxvY2sgYWRkZWQgdG8gdGhlIGNoYWluLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9CbG9ja0hlYWRlcj59IGhlYWRlciBvZiB0aGUgbmV4dCBibG9jayBhZGRlZCB0byB0aGUgY2hhaW5cbiAgICovXG4gIGFzeW5jIHdhaXRGb3JOZXh0QmxvY2tIZWFkZXIoKTogUHJvbWlzZTxNb25lcm9CbG9ja0hlYWRlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN1YmNsYXNzIG11c3QgaW1wbGVtZW50XCIpO1xuICB9XG59Il0sIm1hcHBp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