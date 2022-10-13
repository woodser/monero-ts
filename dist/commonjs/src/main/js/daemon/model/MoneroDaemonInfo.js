"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/**
 * Monero daemon info.
 */
var MoneroDaemonInfo = /*#__PURE__*/function () {
  function MoneroDaemonInfo(state) {
    (0, _classCallCheck2["default"])(this, MoneroDaemonInfo);
    state = Object.assign({}, state);
    this.state = state; // deserialize BigInts

    if (state.difficulty !== undefined && !(state.difficulty instanceof BigInt)) state.difficulty = BigInt(state.difficulty);
    if (state.cumulativeDifficulty !== undefined && !(state.cumulativeDifficulty instanceof BigInt)) state.cumulativeDifficulty = BigInt(state.cumulativeDifficulty);
    if (state.credits !== undefined && !(state.credits instanceof BigInt)) state.credits = BigInt(state.credits);
  }

  (0, _createClass2["default"])(MoneroDaemonInfo, [{
    key: "toJson",
    value: function toJson() {
      var json = Object.assign([], this.state);
      if (json.difficulty !== undefined) json.difficulty = json.difficulty.toString();
      if (json.cumulativeDifficulty !== undefined) json.cumulativeDifficulty = json.cumulativeDifficulty.toString();
      if (json.credits !== undefined) json.credits = json.credits.toString();
      return json;
    }
  }, {
    key: "getVersion",
    value: function getVersion() {
      return this.state.version;
    }
  }, {
    key: "setVersion",
    value: function setVersion(version) {
      this.state.version = version;
      return this;
    }
  }, {
    key: "getNumAltBlocks",
    value: function getNumAltBlocks() {
      return this.state.numAltBlocks;
    }
  }, {
    key: "setNumAltBlocks",
    value: function setNumAltBlocks(numAltBlocks) {
      this.state.numAltBlocks = numAltBlocks;
      return this;
    }
  }, {
    key: "getBlockSizeLimit",
    value: function getBlockSizeLimit() {
      return this.state.blockSizeLimit;
    }
  }, {
    key: "setBlockSizeLimit",
    value: function setBlockSizeLimit(blockSizeLimit) {
      this.state.blockSizeLimit = blockSizeLimit;
      return this;
    }
  }, {
    key: "getBlockSizeMedian",
    value: function getBlockSizeMedian() {
      return this.state.blockSizeMedian;
    }
  }, {
    key: "setBlockSizeMedian",
    value: function setBlockSizeMedian(blockSizeMedian) {
      this.state.blockSizeMedian = blockSizeMedian;
      return this;
    }
  }, {
    key: "getBlockWeightLimit",
    value: function getBlockWeightLimit() {
      return this.state.blockWeightLimit;
    }
  }, {
    key: "setBlockWeightLimit",
    value: function setBlockWeightLimit(blockWeightLimit) {
      this.state.blockWeightLimit = blockWeightLimit;
      return this;
    }
  }, {
    key: "getBlockWeightMedian",
    value: function getBlockWeightMedian() {
      return this.state.blockWeightMedian;
    }
  }, {
    key: "setBlockWeightMedian",
    value: function setBlockWeightMedian(blockWeightMedian) {
      this.state.blockWeightMedian = blockWeightMedian;
      return this;
    }
  }, {
    key: "getBootstrapDaemonAddress",
    value: function getBootstrapDaemonAddress() {
      return this.state.bootstrapDaemonAddress;
    }
  }, {
    key: "setBootstrapDaemonAddress",
    value: function setBootstrapDaemonAddress(bootstrapDaemonAddress) {
      this.state.bootstrapDaemonAddress = bootstrapDaemonAddress;
      return this;
    }
  }, {
    key: "getDifficulty",
    value: function getDifficulty() {
      return this.state.difficulty;
    }
  }, {
    key: "setDifficulty",
    value: function setDifficulty(difficulty) {
      this.state.difficulty = difficulty;
      return this;
    }
  }, {
    key: "getCumulativeDifficulty",
    value: function getCumulativeDifficulty() {
      return this.state.cumulativeDifficulty;
    }
  }, {
    key: "setCumulativeDifficulty",
    value: function setCumulativeDifficulty(cumulativeDifficulty) {
      this.state.cumulativeDifficulty = cumulativeDifficulty;
      return this;
    }
  }, {
    key: "getFreeSpace",
    value: function getFreeSpace() {
      return this.state.freeSpace;
    }
  }, {
    key: "setFreeSpace",
    value: function setFreeSpace(freeSpace) {
      this.state.freeSpace = freeSpace;
      return this;
    }
  }, {
    key: "getNumOfflinePeers",
    value: function getNumOfflinePeers() {
      return this.state.numOfflinePeers;
    }
  }, {
    key: "setNumOfflinePeers",
    value: function setNumOfflinePeers(numOfflinePeers) {
      this.state.numOfflinePeers = numOfflinePeers;
      return this;
    }
  }, {
    key: "getNumOnlinePeers",
    value: function getNumOnlinePeers() {
      return this.state.numOnlinePeers;
    }
  }, {
    key: "setNumOnlinePeers",
    value: function setNumOnlinePeers(numOnlinePeers) {
      this.state.numOnlinePeers = numOnlinePeers;
      return this;
    }
  }, {
    key: "getHeight",
    value: function getHeight() {
      return this.state.height;
    }
  }, {
    key: "setHeight",
    value: function setHeight(height) {
      this.state.height = height;
      return this;
    }
  }, {
    key: "getHeightWithoutBootstrap",
    value: function getHeightWithoutBootstrap() {
      return this.state.heightWithoutBootstrap;
    }
  }, {
    key: "setHeightWithoutBootstrap",
    value: function setHeightWithoutBootstrap(heightWithoutBootstrap) {
      this.state.heightWithoutBootstrap = heightWithoutBootstrap;
      return this;
    }
  }, {
    key: "getNetworkType",
    value: function getNetworkType() {
      return this.state.networkType;
    }
  }, {
    key: "setNetworkType",
    value: function setNetworkType(networkType) {
      this.state.networkType = networkType;
      return this;
    }
  }, {
    key: "isOffline",
    value: function isOffline() {
      return this.state.isOffline;
    }
  }, {
    key: "setIsOffline",
    value: function setIsOffline(isOffline) {
      this.state.isOffline = isOffline;
      return this;
    }
  }, {
    key: "getNumIncomingConnections",
    value: function getNumIncomingConnections() {
      return this.state.numIncomingConnections;
    }
  }, {
    key: "setNumIncomingConnections",
    value: function setNumIncomingConnections(numIncomingConnections) {
      this.state.numIncomingConnections = numIncomingConnections;
      return this;
    }
  }, {
    key: "getNumOutgoingConnections",
    value: function getNumOutgoingConnections() {
      return this.state.numOutgoingConnections;
    }
  }, {
    key: "setNumOutgoingConnections",
    value: function setNumOutgoingConnections(numOutgoingConnections) {
      this.state.numOutgoingConnections = numOutgoingConnections;
      return this;
    }
  }, {
    key: "getNumRpcConnections",
    value: function getNumRpcConnections() {
      return this.state.numRpcConnections;
    }
  }, {
    key: "setNumRpcConnections",
    value: function setNumRpcConnections(numRpcConnections) {
      this.state.numRpcConnections = numRpcConnections;
      return this;
    }
  }, {
    key: "getStartTimestamp",
    value: function getStartTimestamp() {
      return this.state.startTimestamp;
    }
  }, {
    key: "setStartTimestamp",
    value: function setStartTimestamp(startTimestamp) {
      this.state.startTimestamp = startTimestamp;
      return this;
    }
  }, {
    key: "getAdjustedTimestamp",
    value: function getAdjustedTimestamp() {
      return this.state.adjustedTimestamp;
    }
  }, {
    key: "setAdjustedTimestamp",
    value: function setAdjustedTimestamp(adjustedTimestamp) {
      this.state.adjustedTimestamp = adjustedTimestamp;
      return this;
    }
  }, {
    key: "getTarget",
    value: function getTarget() {
      return this.state.target;
    }
  }, {
    key: "setTarget",
    value: function setTarget(target) {
      this.state.target = target;
      return this;
    }
  }, {
    key: "getTargetHeight",
    value: function getTargetHeight() {
      return this.state.targetHeight;
    }
  }, {
    key: "setTargetHeight",
    value: function setTargetHeight(targetHeight) {
      this.state.targetHeight = targetHeight;
      return this;
    }
  }, {
    key: "getTopBlockHash",
    value: function getTopBlockHash() {
      return this.state.topBlockHash;
    }
  }, {
    key: "setTopBlockHash",
    value: function setTopBlockHash(topBlockHash) {
      this.state.topBlockHash = topBlockHash;
      return this;
    }
  }, {
    key: "getNumTxs",
    value: function getNumTxs() {
      return this.state.numTxs;
    }
  }, {
    key: "setNumTxs",
    value: function setNumTxs(numTxs) {
      this.state.numTxs = numTxs;
      return this;
    }
  }, {
    key: "getNumTxsPool",
    value: function getNumTxsPool() {
      return this.state.numTxsPool;
    }
  }, {
    key: "setNumTxsPool",
    value: function setNumTxsPool(numTxsPool) {
      this.state.numTxsPool = numTxsPool;
      return this;
    }
  }, {
    key: "getWasBootstrapEverUsed",
    value: function getWasBootstrapEverUsed() {
      return this.state.wasBootstrapEverUsed;
    }
  }, {
    key: "setWasBootstrapEverUsed",
    value: function setWasBootstrapEverUsed(wasBootstrapEverUsed) {
      this.state.wasBootstrapEverUsed = wasBootstrapEverUsed;
      return this;
    }
  }, {
    key: "getDatabaseSize",
    value: function getDatabaseSize() {
      return this.state.databaseSize;
    }
  }, {
    key: "setDatabaseSize",
    value: function setDatabaseSize(databaseSize) {
      this.state.databaseSize = databaseSize;
      return this;
    }
  }, {
    key: "getUpdateAvailable",
    value: function getUpdateAvailable() {
      return this.state.updateAvailable;
    }
  }, {
    key: "setUpdateAvailable",
    value: function setUpdateAvailable(updateAvailable) {
      this.state.updateAvailable = updateAvailable;
      return this;
    }
  }, {
    key: "getCredits",
    value: function getCredits() {
      return this.state.credits;
    }
  }, {
    key: "setCredits",
    value: function setCredits(credits) {
      this.state.credits = credits;
      return this;
    }
  }, {
    key: "isBusySyncing",
    value: function isBusySyncing() {
      return this.state.isBusySyncing;
    }
  }, {
    key: "setIsBusySyncing",
    value: function setIsBusySyncing(isBusySyncing) {
      this.state.isBusySyncing = isBusySyncing;
      return this;
    }
  }, {
    key: "isSynchronized",
    value: function isSynchronized() {
      return this.state.isSynchronized;
    }
  }, {
    key: "setIsSynchronized",
    value: function setIsSynchronized(isSynchronized) {
      this.state.isSynchronized = isSynchronized;
      return this;
    }
  }, {
    key: "isRestricted",
    value: function isRestricted() {
      return this.state.isRestricted;
    }
  }, {
    key: "setIsRestricted",
    value: function setIsRestricted(isRestricted) {
      this.state.isRestricted = isRestricted;
      return this;
    }
  }]);
  return MoneroDaemonInfo;
}();

var _default = MoneroDaemonInfo;
exports["default"] = _default;