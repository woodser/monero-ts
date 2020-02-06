/**
 * Implements a MoneroDaemon by proxying requests to a web worker.
 */
class MoneroDaemonRpcProxy extends MoneroDaemon {
  
  // --------------------------- STATIC UTILITIES -----------------------------
  
  static async createDaemonRpc(config) {
    let daemonId = GenUtils.uuidv4();
    await MoneroUtils.invokeWorker(daemonId, "createDaemonRpc", Array.from(arguments));
    return new MoneroDaemonRpcProxy(daemonId, MoneroUtils.getWorker());
  }
  
  // ---------------------------- INSTANCE METHODS ----------------------------
  
  constructor(daemonId, worker) {
    super();
    this.daemonId = daemonId;
    this.worker = worker;
  }
  
  async isConnected() {
    throw new MoneroError("Not implemented");
  }
  
  async getVersion() {
    throw new MoneroError("Not implemented");
  }
  
  async isTrusted() {
    throw new MoneroError("Not implemented");
  }
  
  async getHeight() {
    throw new MoneroError("Not implemented");
  }
  
  async getBlockHash(height) {
    throw new MoneroError("Not implemented");
  }
  
  async getBlockTemplate(walletAddress, reserveSize) {
    throw new MoneroError("Not implemented");
  }
  
  async getLastBlockHeader() {
    throw new MoneroError("Not implemented");
  }
  
  async getBlockHeaderByHash(blockHash) {
    throw new MoneroError("Not implemented");
  }
  
  async getBlockHeaderByHeight(height) {
    throw new MoneroError("Not implemented");
  }
  
  async getBlockHeadersByRange(startHeight, endHeight) {
    throw new MoneroError("Not implemented");
  }
  
  async getBlockByHash(blockHash) {
    throw new MoneroError("Not implemented");
  }
  
  async getBlocksByHash(blockHashes, startHeight, prune) {
    throw new MoneroError("Not implemented");
  }
  
  async getBlockByHeight(height) {
    throw new MoneroError("Not implemented");
  }
  
  async getBlocksByHeight(heights) {
    throw new MoneroError("Not implemented");
  }
  
  async getBlocksByRange(startHeight, endHeight) {
    throw new MoneroError("Not implemented");
  }
  
  async getBlocksByRangeChunked(startHeight, endHeight, maxChunkSize) {
    throw new MoneroError("Not implemented");
  }
  
  async getBlockHashes(blockHashes, startHeight) {
    throw new MoneroError("Not implemented");
  }
  
  async getTx(txHash, prune = false) {
    return (await this.getTxs([txHash], prune))[0];
  }
  
  async getTxs(txHashes, prune = false) {
    throw new MoneroError("Not implemented");
  }
  
  async getTxHex(txHash, prune = false) {
    return (await this.getTxHexes([txHash], prune))[0];
  }
  
  async getTxHexes(txHashes, prune = false) {
    throw new MoneroError("Not implemented");
  }
  
  async getMinerTxSum(height, numBlocks) {
    throw new MoneroError("Not implemented");
  }
  
  async getFeeEstimate(graceBlocks) {
    throw new MoneroError("Not implemented");
  }
  
  async submitTxHex(txHex, doNotRelay) {
    throw new MoneroError("Not implemented");
  }
  
  async relayTxByHash(txHash) {
    assert.equal(typeof txHash, "string", "Must provide a transaction hash");
    await this.relayTxsByHash([txHash]);
  }
  
  async relayTxsByHash(txHashes) {
    throw new MoneroError("Not implemented");
  }
  
  async getTxPool() {
    throw new MoneroError("Not implemented");
  }
  
  async getTxPoolHashes() {
    throw new MoneroError("Not implemented");
  }
  
  async getTxPoolBacklog() {
    throw new MoneroError("Not implemented");
  }
  
  async getTxPoolStats() {
    throw new MoneroError("Not implemented");
  }
  
  async flushTxPool(hashes) {
    throw new MoneroError("Not implemented");
  }
  
  async getKeyImageSpentStatus(keyImage) {
    return (await this.getKeyImageSpentStatuses([keyImage]))[0];
  }
  
  async getKeyImageSpentStatuses(keyImages) {
    throw new MoneroError("Not implemented");
  }
  
  async getOutputs(outputs) {
    throw new MoneroError("Not implemented");
  }
  
  async getOutputHistogram(amounts, minCount, maxCount, isUnlocked, recentCutoff) {
    throw new MoneroError("Not implemented");
  }
  
  async getOutputDistribution(amounts, cumulative, startHeight, endHeight) {
    throw new MoneroError("Not implemented");
  }
  
  async getInfo() {
    throw new MoneroError("Not implemented");
  }
  
  async getSyncInfo() {
    throw new MoneroError("Not implemented");
  }
  
  async getHardForkInfo() {
    throw new MoneroError("Not implemented");
  }
  
  async getAltChains() {
    throw new MoneroError("Not implemented");
  }
  
  async getAltBlockIds() {
    throw new MoneroError("Not implemented");
  }
  
  async getDownloadLimit() {
    throw new MoneroError("Not implemented");
  }
  
  async setDownloadLimit(limit) {
    throw new MoneroError("Not implemented");
  }
  
  async resetDownloadLimit() {
    throw new MoneroError("Not implemented");
  }
  
  async getUploadLimit() {
    throw new MoneroError("Not implemented");
  }
  
  async setUploadLimit(limit) {
    throw new MoneroError("Not implemented");
  }
  
  async resetUploadLimit() {
    throw new MoneroError("Not implemented");
  }
  
  async getKnownPeers() {
    throw new MoneroError("Not implemented");
  }
  
  async getConnections() {
    throw new MoneroError("Not implemented");
  }
  
  async setOutgoingPeerLimit(limit) {
    throw new MoneroError("Not implemented");
  }
  
  async setIncomingPeerLimit(limit) {
    throw new MoneroError("Not implemented");
  }
  
  async getPeerBans() {
    throw new MoneroError("Not implemented");
  }

  async setPeerBan(ban) {
    throw new MoneroError("Not implemented");
  }
  
  async setPeerBans(bans) {
    throw new MoneroError("Not implemented");
  }
  
  async startMining(address, numThreads, isBackground, ignoreBattery) {
    throw new MoneroError("Not implemented");
  }
  
  async stopMining() {
    throw new MoneroError("Not implemented");
  }
  
  async getMiningStatus() {
    throw new MoneroError("Not implemented");
  }
  
  async submitBlock(blockBlob) {
    await this.submitBlocks([blockBlob]);
  }
  
  async submitBlocks(blockBlobs) {
    throw new MoneroError("Not implemented");
  }
  
  async checkForUpdate() {
    throw new MoneroError("Not implemented");
  }
  
  async downloadUpdate(path) {
    throw new MoneroError("Not implemented");
  }
  
  async stop() {
    throw new MoneroError("Not implemented");
  }
  
  async getNextBlockHeader() {
    let blockHeaderJson = await this._invokeWorker("getNextBlockHeader");
    console.log("Got next block header:");
    console.log(blockHeaderJson);
    return new MoneroBlockHeader(blockHeaderJson);
  }
  
  addBlockListener(listener) {
    throw new MoneroError("Not implemented");
  }

  removeBlockListener(listener) {
    throw new MoneroError("Not implemented");
  }
  
  // --------------------------- PRIVATE HELPERS ------------------------------
  
  // TODO: duplicated with MoneroWalletCoreProxy
  async _invokeWorker(fnName, args) {
    return MoneroUtils.invokeWorker(this.daemonId, fnName, args);
  }
}

module.exports = MoneroDaemonRpcProxy;