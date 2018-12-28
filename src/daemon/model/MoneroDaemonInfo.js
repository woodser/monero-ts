const MoneroDaemonModel = require("./MoneroDaemonModel");

/**
 * Monero daemon info.
 */
class MoneroDaemonInfo extends MoneroDaemonModel {
  
  getVersion() {
    return this.version;
  }
  
  setVersion(version) {
    this.version = version;
  }
  
  getAltBlocksCount() {
    return this.altBlocksCount;
  }
  
  setAltBlocksCount(altBlocksCount) {
    this.altBlocksCount = altBlocksCount;
  }
  
  getBlockSizeLimit() {
    return this.blockSizeLimit;
  }
  
  setBlockSizeLimit(blockSizeLimit) {
    this.blockSizeLimit = blockSizeLimit;
  }
  
  getBlockSizeMedian() {
    return this.blockSizeMedian;
  }
  
  setBlockSizeMedian(blockSizeMedian) {
    this.blockSizeMedian = blockSizeMedian;
  }
  
  getBlockWeightLimit() {
    return this.blockWeightLimit;
  }
  
  setBlockWeightLimit(blockWeightLimit) {
    this.blockWeightLimit = blockWeightLimit;
  }
  
  getBlockWeightMedian() {
    return this.blockWeightMedian;
  }
  
  setBlockWeightMedian(blockWeightMedian) {
    this.blockWeightMedian = blockWeightMedian;
  }
  
  getBootstrapDaemonAddress() {
    return this.bootstrapDaemonAddress;
  }
  
  setBootstrapDaemonAddress(bootstrapDaemonAddress) {
    this.bootstrapDaemonAddress = bootstrapDaemonAddress;
  }
  
  getCumulativeDifficulty() {
    return this.cumulativeDifficulty;
  }
  
  setCumulativeDifficulty(cumulativeDifficulty) {
    this.cumulativeDifficulty = cumulativeDifficulty;
  }
  
  getDifficulty() {
    return this.difficulty;
  }
  
  setDifficulty(difficulty) {
    this.difficulty = difficulty;
  }
  
  getFreeSpace() {
    return this.freeSpace;
  }
  
  setFreeSpace(freeSpace) {
    this.freeSpace = freeSpace;
  }
  
  getGreyPeerlistSize() {
    return this.greyPeerlistSize;
  }
  
  setGreyPeerlistSize(greyPeerlistSize) {
    this.greyPeerlistSize = greyPeerlistSize;
  }
  
  getWhitePeerlistSize() {
    return this.whitePeerlistSize;
  }
  
  setWhitePeerlistSize(whitePeerlistSize) {
    this.whitePeerlistSize = whitePeerlistSize;
  }
  
  getHeight() {
    return this.height;
  }
  
  setHeight(height) {
    this.height = height;
  }
  
  getHeightWithoutBootstrap() {
    return this.heightWithoutBootstrap;
  }
  
  setHeightWithoutBootstrap(heightWithoutBootstrap) {
    this.heightWithoutBootstrap = heightWithoutBootstrap;
  }
  
  getNetworkType() {
    return this.networkType;
  }

  setNetworkType(networkType) {
    this.networkType = networkType;
  }

  getIsOffline() {
    return this.isOffline;
  }
  
  setIsOffline(isOffline) {
    this.isOffline = isOffline;
  }
  
  getIncomingConnectionsCount() {
    return this.incomingConnectionsCount;
  }
  
  setIncomingConnectionsCount(incomingConnectionsCount) {
    this.incomingConnectionsCount = incomingConnectionsCount;
  }
  
  getOutgoingConnectionsCount() {
    return this.outgoingConnectionsCount;
  }
  
  setOutgoingConnectionsCount(outgoingConnectionsCount) {
    this.outgoingConnectionsCount = outgoingConnectionsCount;
  }
  
  getRpcConnectionsCount() {
    return this.rpcConnectionsCount;
  }
  
  setRpcConnectionsCount(rpcConnectionsCount) {
    this.rpcConnectionsCount = rpcConnectionsCount;
  }
  
  getStartTime() {
    return this.startTime;
  }
  
  setStartTime(startTime) {
    this.startTime = startTime;
  }
  
  getTarget() {
    return this.target;
  }
  
  setTarget(target) {
    this.target = target;
  }
  
  getTargetHeight() {
    return this.targetHeight;
  }
  
  setTargetHeight(targetHeight) {
    this.targetHeight = targetHeight;
  }
  
  getTopBlockHash() {
    return this.topBlockHash;
  }
  
  setTopBlockHash(topBlockHash) {
    this.topBlockHash = topBlockHash;
  }
  
  getTxCount() {
    return this.txCount;
  }
  
  setTxCount(txCount) {
    this.txCount = txCount;
  }
  
  getTxPoolSize() {
    return this.txPoolSize;
  }
  
  setTxPoolSize(txPoolSize) {
    this.txPoolSize = txPoolSize;
  }
  
  getWasBootstrapEverUsed() {
    return this.wasBootstrapEverUsed;
  }
  
  setWasBootstrapEverUsed(wasBootstrapEverUsed) {
    this.wasBootstrapEverUsed = wasBootstrapEverUsed;
  }
  
  getDatabaseSize() {
    return this.databaseSize;
  }
  
  setDatabaseSize(databaseSize) {
    this.databaseSize = databaseSize;
  }
  
  getUpdateAvailable() {
    return this.updateAvailable;
  }
  
  setUpdateAvailable(updateAvailable) {
    this.updateAvailable = updateAvailable;
  }
}

module.exports = MoneroDaemonInfo;