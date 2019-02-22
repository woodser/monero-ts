/**
 * Monero daemon info.
 */
class MoneroDaemonInfo {
  
  getVersion() {
    return this.version;
  }
  
  setVersion(version) {
    this.version = version;
    return this;
  }
  
  getNumAltBlocks() {
    return this.numAltBlocks;
  }
  
  setNumAltBlocks(numAltBlocks) {
    this.numAltBlocks = numAltBlocks;
    return this;
  }
  
  getBlockSizeLimit() {
    return this.blockSizeLimit;
  }
  
  setBlockSizeLimit(blockSizeLimit) {
    this.blockSizeLimit = blockSizeLimit;
    return this;
  }
  
  getBlockSizeMedian() {
    return this.blockSizeMedian;
  }
  
  setBlockSizeMedian(blockSizeMedian) {
    this.blockSizeMedian = blockSizeMedian;
    return this;
  }
  
  getBlockWeightLimit() {
    return this.blockWeightLimit;
  }
  
  setBlockWeightLimit(blockWeightLimit) {
    this.blockWeightLimit = blockWeightLimit;
    return this;
  }
  
  getBlockWeightMedian() {
    return this.blockWeightMedian;
  }
  
  setBlockWeightMedian(blockWeightMedian) {
    this.blockWeightMedian = blockWeightMedian;
    return this;
  }
  
  getBootstrapDaemonAddress() {
    return this.bootstrapDaemonAddress;
  }
  
  setBootstrapDaemonAddress(bootstrapDaemonAddress) {
    this.bootstrapDaemonAddress = bootstrapDaemonAddress;
    return this;
  }
  
  getDifficulty() {
    return this.difficulty;
  }
  
  setDifficulty(difficulty) {
    this.difficulty = difficulty;
    return this;
  }
  
  getCumulativeDifficulty() {
    return this.cumulativeDifficulty;
  }
  
  setCumulativeDifficulty(cumulativeDifficulty) {
    this.cumulativeDifficulty = cumulativeDifficulty;
    return this;
  }
  
  getFreeSpace() {
    return this.freeSpace;
  }
  
  setFreeSpace(freeSpace) {
    this.freeSpace = freeSpace;
    return this;
  }
  
  getNumOfflinePeers() {
    return this.numOfflinePeers;
  }
  
  setNumOfflinePeers(numOfflinePeers) {
    this.numOfflinePeers = numOfflinePeers;
    return this;
  }
  
  getNumOnlinePeers() {
    return this.numOnlinePeers;
  }
  
  setNumOnlinePeers(numOnlinePeers) {
    this.numOnlinePeers = numOnlinePeers;
    return this;
  }
  
  getHeight() {
    return this.height;
  }
  
  setHeight(height) {
    this.height = height;
    return this;
  }
  
  getHeightWithoutBootstrap() {
    return this.heightWithoutBootstrap;
  }
  
  setHeightWithoutBootstrap(heightWithoutBootstrap) {
    this.heightWithoutBootstrap = heightWithoutBootstrap;
    return this;
  }
  
  getNetworkType() {
    return this.networkType;
  }

  setNetworkType(networkType) {
    this.networkType = networkType;
    return this;
  }

  getIsOffline() {
    return this.isOffline;
  }
  
  setIsOffline(isOffline) {
    this.isOffline = isOffline;
    return this;
  }
  
  getNumIncomingConnections() {
    return this.numIncomingConnections;
  }
  
  setNumIncomingConnections(numIncomingConnections) {
    this.numIncomingConnections = numIncomingConnections;
    return this;
  }
  
  getNumOutgoingConnections() {
    return this.numOutgoingConnections;
  }
  
  setNumOutgoingConnections(numOutgoingConnections) {
    this.numOutgoingConnections = numOutgoingConnections;
    return this;
  }
  
  getNumRpcConnections() {
    return this.numRpcConnections;
  }
  
  setNumRpcConnections(numRpcConnections) {
    this.numRpcConnections = numRpcConnections;
    return this;
  }
  
  getStartTimestamp() {
    return this.startTimestamp;
  }
  
  setStartTimestamp(startTimestamp) {
    this.startTimestamp = startTimestamp;
    return this;
  }
  
  getTarget() {
    return this.target;
  }
  
  setTarget(target) {
    this.target = target;
    return this;
  }
  
  getTargetHeight() {
    return this.targetHeight;
  }
  
  setTargetHeight(targetHeight) {
    this.targetHeight = targetHeight;
    return this;
  }
  
  getTopBlockId() {
    return this.topBlockId;
  }
  
  setTopBlockId(topBlockId) {
    this.topBlockId = topBlockId;
    return this;
  }
  
  getNumTxs() {
    return this.numTxs;
  }
  
  setNumTxs(numTxs) {
    this.numTxs = numTxs;
    return this;
  }
  
  getNumTxsPool() {
    return this.numTxsPool;
  }
  
  setNumTxsPool(numTxsPool) {
    this.numTxsPool = numTxsPool;
    return this;
  }
  
  getWasBootstrapEverUsed() {
    return this.wasBootstrapEverUsed;
  }
  
  setWasBootstrapEverUsed(wasBootstrapEverUsed) {
    this.wasBootstrapEverUsed = wasBootstrapEverUsed;
    return this;
  }
  
  getDatabaseSize() {
    return this.databaseSize;
  }
  
  setDatabaseSize(databaseSize) {
    this.databaseSize = databaseSize;
    return this;
  }
  
  getUpdateAvailable() {
    return this.updateAvailable;
  }
  
  setUpdateAvailable(updateAvailable) {
    this.updateAvailable = updateAvailable;
    return this;
  }
}

module.exports = MoneroDaemonInfo;