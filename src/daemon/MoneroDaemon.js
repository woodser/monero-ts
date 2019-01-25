/**
 * Monero daemon interface and default implementations.
 */
class MoneroDaemon {
  
  /**
   * Get the number of blocks in the longest chain known to the node.
   * 
   * @returns the number of blocks
   */
  async getHeight() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get a block's id by its height.
   * 
   * @param height is the height of the block id to get
   * @returns the block's id at the given height
   */
  async getBlockId(height) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get a block template for mining a new block.
   * 
   * @param walletAddress is the address of the wallet to receive coinbase transactions if block is successfully mined
   * @param reserveSize is the reserve size
   * @return MoneroBlockTemplate is a block template for mining a new block
   */
  async getBlockTemplate(walletAddress, reserveSize) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get the last block's header.
   * 
   * @returns MoneroBlockHeader is the last block's header
   */
  async getLastBlockHeader() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get a block header by its id.
   * 
   * @param blockId is the id of the block to get the header of
   * @return MoneroBlockHeader is the block's header
   */
  async getBlockHeaderById(blockId) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get a block header by its height.
   * 
   * @param height is the height of the block to get the header of
   * @return MoneroBlockHeader is the block's header
   */
  async getBlockHeaderByHeight(height) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get block headers for the given range.
   * 
   * @param startHeight is the start height lower bound inclusive (optional)
   * @param endHeight is the end height upper bound inclusive (optional)
   * @returns List<MoneroBlockHeader> for the given range
   */
  async getBlockHeadersByRange(startHeight, endHeight) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get a block by id.
   * 
   * @param blockId is the id of the block to get
   * @returns MoneroBlock with the given id
   */
  async getBlockById(blockId) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get blocks by id.
   * 
   * @param blockIds are array of hashes; first 10 blocks id goes sequential,
   *        next goes in pow(2,n) offset, like 2, 4, 8, 16, 32, 64 and so on,
   *        and the last one is always genesis block
   * @param startHeight is the start height to get blocks by id
   * @param prune specifies if returned blocks should be pruned
   * @returns {MoneroBlock[]} are the retrieved blocks
   */
  async getBlocksById(blockIds, startHeight, prune) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get a block by height.
   * 
   * @param height is the height of the block to get
   * @returns MoneroBlock with the given height
   */
  async getBlockByHeight(height) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get blocks at the given heights.
   * 
   * @param heights are the heights of the blocks to get
   * @returns List<MoneroBlock> are blocks at the given heights
   */
  async getBlocksByHeight(heights) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get blocks in the given height range.
   * 
   * @param startHeight is the start height lower bound inclusive (optional)
   * @param endHeight is the end height upper bound inclusive (optional)
   * @returns MoneroBlock[] are blocks in the given height range
   */
  async getBlocksByRange(startHeight, endHeight) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get block ids with a binary request to the daemon.
   * 
   * @param blockIds specify block ids to fetch; first 10 blocks id goes
   *        sequential, next goes in pow(2,n) offset, like 2, 4, 8, 16, 32, 64
   *        and so on, and the last one is always genesis block
   * @param startHeight is the starting height of block ids to return       
   */
  async getBlockIds(blockIds, startHeight) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get transactions with the given ids.
   * 
   * @param txIds specifies the transaction ids to get
   * @param decodeAsJson decodes the returned transactions as JSON rather than binary if true
   * @param prune (documentation missing) // TODO: documentation missing
   * @returns {[MoneroTx]} are the transactions with the given ids
   */
  async getTxs(txIds, decodeAsJson, prune) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Gets the total emissions and fees from the genesis block to the current height.
   * 
   * @param height is the height to start computing the coinbase sum
   * @param count are the number of blocks to include in the sum
   * @return {MoneroCoinbaseTxSum} encapsulates the total emissions and fees since the genesis block
   */
  async getCoinbaseTxSum(height, count) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get an estimation on the fees per kB.
   * 
   * @param graceBlocks
   */
  async getFeeEstimate(graceBlocks) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Submits a transaction to the daemon's pool.
   * 
   * @param txHex is the raw transaction hex to submit
   * @param doNotRelay specifies if the tx should be relayed (optional)
   */
  async submitTxHex(txHex, doNotRelay) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Relays a transaction by id.
   * 
   * @param {string} txId identifies the transaction to relay
   * @returns {MoneroDaemonModel} contains response status
   */
  async relayTxById(txId) {
    assert.equal(typeof txId, "string", "Must provide a transaction id");
    return await this.relayTxsById([txId]);
  }
  
  /**
   * Relays transactions by id.
   * 
   * @param {string[]} txIds identify the transactions to relay
   * @returns {MoneroDaemonResponse} contains response status
   */
  async relayTxsById(txIds) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get valid transactions seen by the node but not yet mined into a block, as well
   * as spent key image information for the tx pool.
   * 
   * @returns {MoneroTxPool} contains tx pool transactions and spent key images
   */
  async getTxPoolTxsAndSpentKeyImages() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get ids of transactions in the transaction pool.
   * 
   * @returns {string[]} are ids of transactions in the transaction pool
   */
  async getTxPoolTxIds() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * TODO.
   */
  async getTxPoolBacklog() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get transaction pool statistics.
   * 
   * @returns {MoneroTxPoolStats} contains statistics about the transaction pool
   */
  async getTxPoolStats() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Flush transactions from the memory pool.
   * 
   * @param {string or string[]} ids are specific transactions to flush (defaults to all)
   * @returns {MoneroDaemonModel} contains response information
   */
  async flushTxPool(ids) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get the spent status of the given key image.
   * 
   * @param {string} keyImage is key image hex to get the status of
   * @returns {MoneroKeyImage.SpentStatus} is the status of the key image
   */
  async getSpentStatus(keyImage) {
    return (await this.getSpentStatuses([keyImage]))[0];
  }
  
  /**
   * Get the spent status of each given key image.
   * 
   * @param {[string]} keyImages are hex key images to get the statuses of
   * @return {[MoneroKeyImage.SpentStatus]} is the status for each key image
   */
  async getSpentStatuses(keyImages) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get global outputs given a list of transaction ids using a binary request.
   * 
   * @param txIds identify the transactions to get global outputs within
   * @returns {string[]} are global output indices within the given transactions
   */
  async getGlobalOutputs() {  // TODO: name outdated
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get outputs identified by a list of output amounts and indices using a
   * binary request.
   * 
   * @param {[MoneroOutput]} identify each output by amount and index
   * @returns {[MoneroOutput]} are the identified outputs
   */
  async getOutputs(outputs) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get a histogram of output amounts. For all amounts (possibly filtered by
   * parameters), gives the number of outputs on the chain for that amount.
   * RingCT outputs counts as 0 amount.
   * 
   * @param amounts TODO
   * @param minCount TODO
   * @param maxCount TODO
   * @param isUnlocked TODO
   * @param recentCutoff TODO
   * @returns {MoneroOutputHistogramEntry[]} are entries meeting the parameters
   */
  async getOutputHistogram(amounts, minCount, maxCount, isUnlocked, recentCutoff) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * TODO.
   */
  async getOutputDistribution(amounts, cumulative, startHeight, endHeight) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get general information about the state of the node and the network.
   * 
   * @returns MoneroDaemonInfo is general information about the node and network
   */
  async getInfo() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get synchronization information.
   */
  async getSyncInfo() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Look up information regarding hard fork voting and readiness.
   * 
   * @returns {MoneroHardForkInfo} contains hard fork information
   */
  async getHardForkInfo() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get alternative chains seen by the node.
   * 
   * @return {[MoneroAltChain]} are the alternative chains
   */
  async getAltChains() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get known block ids which are not on the main chain.
   * 
   * @return {[string]} are the known block ids which are not on the main chain
   */
  async getAltBlockIds() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get the download bandwidth limit.
   * 
   * @return {number} is the download bandwidth limit
   */
  async getDownloadLimit() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Set the download bandwidth limit.
   * 
   * @param limit is the download bandwidth limit to set
   */
  async setDownloadLimit(limit) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Reset the download bandwidth limit.
   * 
   * @return {number} is the download bandwidth limit after resetting
   */
  async resetDownloadLimit() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get the upload bandwidth limit.
   * 
   * @return {number} is the upload bandwidth limit
   */
  async getUploadLimit() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Set the upload bandwidth limit.
   * 
   * @param limit is the upload bandwidth limit to set
   */
  async setUploadLimit(limit) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Reset the upload bandwidth limit.
   * 
   * @return {number} is the upload bandwidth limit after resetting
   */
  async resetUploadLimit() {
    throw new Error("Subclass must implement");
  }
  
  // getPeers()
  // getPeerConnections()
  // setOutgoingPeerLimit()
  // setIncomingPeerLimit() // TODO
  
  /**
   * Get known peers including their last known online status.
   */
  async getPeers() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get incoming and outgoing connections to the node.
   * 
   * @returns {[MoneroDaemonConnection]} are the daemon's peer connections
   */
  async getConnections() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Limit number of outgoing peers.
   * 
   * @param limit is the maximum number of peers outgoing peers
   */
  async setOutgoingPeerLimit(limit) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Limit number of incoming peers.
   * 
   * @param limit is the maximum number of peers incoming peers
   */
  async setIncomingPeerLimit(limit) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * TODO
   */
  async getPeerBans() {
    throw new Error("Subclass must implement");
  }

  /**
   * Bans another node by IP.
   * 
   * @param {MoneroBan} ban contains information about a node to ban
   */
  async setPeerBan(ban) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Bans nodes by IP.
   * 
   * @param {MoneroBan[]} contain information about nodes to ban
   */
  async setPeerBans(bans) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Start mining.
   * 
   * @param {string} address is the address given miner rewards if the daemon mines a block
   * @param {integer} threadCount is the number of mining threads to run
   * @param {boolean} isBackground specifies if the miner should run in the background or not
   * @param {boolean} ignoreBattery specifies if the battery state (e.g. on laptop) should be ignored or not
   * @returns {MoneroDaemonModel} contains response status
   */
  async startMining(address, threadCount, isBackground, ignoreBattery) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Stop mining.
   * 
   * @returns {MoneroDaemonModel} contains response status
   */
  async stopMining() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get the daemon's mining status.
   * 
   * @return {MoneroMiningStatus} is the daemon's mining status
   */
  async getMiningStatus() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Submit a mined block to the network.
   * 
   * @param blockBlob is the mined block to submit
   * @return MoneroDaemonModel contains response status
   */
  async submitBlock(blockBlob) {
    return await this.submitBlocks([blockBlob]);
  }
  
  /**
   * Submit mined blocks to the network.
   * 
   * @param blockBlobs are the mined blocks to submit
   * @return MoneroDaemonModel contains response status
   */
  async submitBlocks(blockBlobs) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Return the next block's header when detected.
   * 
   * @returns {MoneroBlockHeader} is the next block's header when detected
   */
  async nextBlockHeader() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Register a listener who is invoked with new block headers when detected.
   * 
   * @param listener(header) is invoked with new block headers when detected
   */
  addBlockHeaderListener(listener) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Unregister a listener to invoke when new blocks are detected.
   * 
   * @param listener is the listener to no longer invoke when new blocks are detected
   */
  removeBlockHeaderListener(listener) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Check for update.
   * 
   * @param {string} path is the path to check for an update (optional)
   * @return {MoneroDaemonUpdateCheckResult} is the result
   */
  async checkForUpdate(path) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Download an update.
   * 
   * @param {string} path is the path to download the update (optional)
   * @return {MoneroDaemonDownloadUpdateResult} is the result
   */
  async downloadUpdate(path) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Stops the daemon.
   */
  async stop() {
    throw new Error("Subclass must implement");
  }
  
  // ----------------------------- STATIC UTILITIES ---------------------------
  
  /**
   * Parses a network string to an enumerated type.
   * 
   * @param network is the network string to parse
   * @returns MoneroDaemon.NetworkType is the enumerated network type
   */
  static parseNetworkType(network) {
    if (network === "mainnet") return MoneroDaemon.MAINNET;
    if (network === "testnet") return MoneroDaemon.TESTNET;
    if (network === "stagenet") return MoneroDaemon.STAGENET;
    throw new Error("Invalid network type to parse: " + network);
  }
}

/**
 * Enumerate network types.
 */
MoneroDaemon.NetworkType = {
    MAINNET: 0,
    TESTNET: 1,
    STAGENET: 2
}

module.exports = MoneroDaemon;