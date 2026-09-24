"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");var _assert = _interopRequireDefault(require("assert"));
var _GenUtils = _interopRequireDefault(require("./GenUtils"));
var _HttpClient = _interopRequireDefault(require("./HttpClient"));
var _LibraryUtils = _interopRequireDefault(require("./LibraryUtils"));
var _MoneroBan = _interopRequireDefault(require("../daemon/model/MoneroBan"));
var _MoneroBlock = _interopRequireDefault(require("../daemon/model/MoneroBlock"));
var _MoneroDaemonConfig = _interopRequireDefault(require("../daemon/model/MoneroDaemonConfig"));
var _MoneroDaemonListener = _interopRequireDefault(require("../daemon/model/MoneroDaemonListener"));
var _MoneroDaemonRpc = _interopRequireDefault(require("../daemon/MoneroDaemonRpc"));
var _MoneroError = _interopRequireDefault(require("./MoneroError"));
var _MoneroKeyImage = _interopRequireDefault(require("../daemon/model/MoneroKeyImage"));
var _MoneroRpcConnection = _interopRequireDefault(require("./MoneroRpcConnection"));
var _MoneroTxConfig = _interopRequireDefault(require("../wallet/model/MoneroTxConfig"));

var _MoneroTxSet = _interopRequireDefault(require("../wallet/model/MoneroTxSet"));
var _MoneroUtils = _interopRequireDefault(require("./MoneroUtils"));
var _MoneroWalletConfig = _interopRequireDefault(require("../wallet/model/MoneroWalletConfig"));
var _MoneroWalletListener = _interopRequireDefault(require("../wallet/model/MoneroWalletListener"));
var _MoneroWalletKeys = require("../wallet/MoneroWalletKeys");
var _MoneroWalletFull = _interopRequireDefault(require("../wallet/MoneroWalletFull"));



// deno configuration

if (_GenUtils.default.isDeno() && typeof self === "undefined" && typeof globalThis === "object" && typeof DedicatedWorkerGlobalScope === "function" && DedicatedWorkerGlobalScope.prototype.isPrototypeOf(globalThis)) {
  self = globalThis;
  globalThis.self = globalThis;
}

// expose some modules to the worker
self.HttpClient = _HttpClient.default;
self.LibraryUtils = _LibraryUtils.default;
self.GenUtils = _GenUtils.default;

/**
 * Worker to manage a daemon and wasm wallet off the main thread using messages.
 * 
 * Required message format: e.data[0] = object id, e.data[1] = function name, e.data[2+] = function args
 *
 * For browser applications, this file must be browserified and placed in the web app root.
 * 
 * @private
 */
self.onmessage = async function (e) {

  // initialize one time
  await self.initOneTime();

  // validate params
  let objectId = e.data[0];
  let fnName = e.data[1];
  let callbackId = e.data[2];
  (0, _assert.default)(fnName, "Must provide function name to worker");
  (0, _assert.default)(callbackId, "Must provide callback id to worker");
  if (!self[fnName]) throw new Error("Method '" + fnName + "' is not registered with worker");
  e.data.splice(1, 2); // remove function name and callback id to apply function with arguments

  // execute worker function and post result to callback
  try {
    postMessage([objectId, callbackId, { result: await self[fnName].apply(null, e.data) }]);
  } catch (e) {
    if (!(e instanceof Error)) e = new Error(e);
    postMessage([objectId, callbackId, { error: _LibraryUtils.default.serializeError(e) }]);
  }
};

self.initOneTime = async function () {
  if (!self.isInitialized) {
    self.WORKER_OBJECTS = {};
    self.isInitialized = true;
    _MoneroUtils.default.PROXY_TO_WORKER = false;
  }
};

// --------------------------- STATIC UTILITIES -------------------------------

self.httpRequest = async function (objectId, opts) {
  try {
    return await _HttpClient.default.request(Object.assign(opts, { proxyToWorker: false }));
  } catch (err) {
    throw err.statusCode ? new Error(JSON.stringify({ statusCode: err.statusCode, statusMessage: err.message })) : err;
  }
};

self.setLogLevel = async function (objectId, level) {
  return _LibraryUtils.default.setLogLevel(level);
};

self.getWasmMemoryUsed = async function (objectId) {
  return _LibraryUtils.default.getWasmModule() && _LibraryUtils.default.getWasmModule().HEAP8 ? _LibraryUtils.default.getWasmModule().HEAP8.length : undefined;
};

// ----------------------------- MONERO UTILS ---------------------------------

self.moneroUtilsGetIntegratedAddress = async function (objectId, networkType, standardAddress, paymentId) {
  return (await _MoneroUtils.default.getIntegratedAddress(networkType, standardAddress, paymentId)).toJson();
};

self.moneroUtilsValidateAddress = async function (objectId, address, networkType) {
  return _MoneroUtils.default.validateAddress(address, networkType);
};

self.moneroUtilsJsonToBinary = async function (objectId, json) {
  return _MoneroUtils.default.jsonToBinary(json);
};

self.moneroUtilsBinaryToJson = async function (objectId, uint8arr) {
  return _MoneroUtils.default.binaryToJson(uint8arr);
};

self.moneroUtilsBinaryBlocksToJson = async function (objectId, uint8arr) {
  return _MoneroUtils.default.binaryBlocksToJson(uint8arr);
};

// ---------------------------- DAEMON METHODS --------------------------------

self.daemonAddListener = async function (daemonId, listenerId) {
  let listener = new class extends _MoneroDaemonListener.default {
    async onBlockHeader(blockHeader) {
      self.postMessage([daemonId, "onBlockHeader_" + listenerId, blockHeader.toJson()]);
    }
  }();
  if (!self.daemonListeners) self.daemonListeners = {};
  self.daemonListeners[listenerId] = listener;
  await self.WORKER_OBJECTS[daemonId].addListener(listener);
};

self.daemonRemoveListener = async function (daemonId, listenerId) {
  if (!self.daemonListeners[listenerId]) throw new _MoneroError.default("No daemon worker listener registered with id: " + listenerId);
  await self.WORKER_OBJECTS[daemonId].removeListener(self.daemonListeners[listenerId]);
  delete self.daemonListeners[listenerId];
};

self.connectDaemonRpc = async function (daemonId, config) {
  self.WORKER_OBJECTS[daemonId] = await _MoneroDaemonRpc.default.connectToDaemonRpc(new _MoneroDaemonConfig.default(config));
};

self.daemonGetRpcConnection = async function (daemonId) {
  let connection = await self.WORKER_OBJECTS[daemonId].getRpcConnection();
  return connection ? connection.getConfig() : undefined;
};

self.daemonIsConnected = async function (daemonId) {
  return self.WORKER_OBJECTS[daemonId].isConnected();
};

self.daemonGetVersion = async function (daemonId) {
  return (await self.WORKER_OBJECTS[daemonId].getVersion()).toJson();
};

self.daemonIsTrusted = async function (daemonId) {
  return self.WORKER_OBJECTS[daemonId].isTrusted();
};

self.daemonGetHeight = async function (daemonId) {
  return self.WORKER_OBJECTS[daemonId].getHeight();
};

self.daemonGetBlockHash = async function (daemonId, height) {
  return self.WORKER_OBJECTS[daemonId].getBlockHash(height);
};

self.daemonGetBlockTemplate = async function (daemonId, walletAddress, reserveSize) {
  return (await self.WORKER_OBJECTS[daemonId].getBlockTemplate(walletAddress, reserveSize)).toJson();
};

self.daemonGetLastBlockHeader = async function (daemonId) {
  return (await self.WORKER_OBJECTS[daemonId].getLastBlockHeader()).toJson();
};

self.daemonGetBlockHeaderByHash = async function (daemonId, hash) {
  return (await self.WORKER_OBJECTS[daemonId].getBlockHeaderByHash(hash)).toJson();
};

self.daemonGetBlockHeaderByHeight = async function (daemonId, height) {
  return (await self.WORKER_OBJECTS[daemonId].getBlockHeaderByHeight(height)).toJson();
};

self.daemonGetBlockHeadersByRange = async function (daemonId, startHeight, endHeight) {
  let blockHeadersJson = [];
  for (let blockHeader of await self.WORKER_OBJECTS[daemonId].getBlockHeadersByRange(startHeight, endHeight)) blockHeadersJson.push(blockHeader.toJson());
  return blockHeadersJson;
};

self.daemonGetBlockByHash = async function (daemonId, blockHash) {
  return (await self.WORKER_OBJECTS[daemonId].getBlockByHash(blockHash)).toJson();
};

self.daemonGetBlocksByHash = async function (daemonId, blockHashes, startHeight, prune) {
  let blocksJson = [];
  for (let block of await self.WORKER_OBJECTS[daemonId].getBlocksByHash(blockHashes, startHeight, prune)) blocksJson.push(block.toJson());
  return blocksJson;
};

self.daemonGetBlockByHeight = async function (daemonId, height) {
  return (await self.WORKER_OBJECTS[daemonId].getBlockByHeight(height)).toJson();
};

self.daemonGetBlocksByHeight = async function (daemonId, heights) {
  let blocksJson = [];
  for (let block of await self.WORKER_OBJECTS[daemonId].getBlocksByHeight(heights)) blocksJson.push(block.toJson());
  return blocksJson;
};

self.daemonGetBlocksByRange = async function (daemonId, startHeight, endHeight) {
  let blocksJson = [];
  for (let block of await self.WORKER_OBJECTS[daemonId].getBlocksByRange(startHeight, endHeight)) blocksJson.push(block.toJson());
  return blocksJson;
};

self.daemonGetBlocksByRangeChunked = async function (daemonId, startHeight, endHeight, maxChunkSize) {
  let blocksJson = [];
  for (let block of await self.WORKER_OBJECTS[daemonId].getBlocksByRangeChunked(startHeight, endHeight, maxChunkSize)) blocksJson.push(block.toJson());
  return blocksJson;
};

self.daemonGetBlockHashes = async function (daemonId, blockHashes, startHeight) {
  throw new Error("worker.getBlockHashes not implemented");
};

// TODO: factor common code with self.getTxs()
self.daemonGetTxs = async function (daemonId, txHashes, prune) {

  // get txs
  let txs = await self.WORKER_OBJECTS[daemonId].getTxs(txHashes, prune);

  // collect unique blocks to preserve model relationships as trees (based on monero_wasm_bridge.cpp::get_txs)
  let blocks = [];
  let unconfirmedBlock = undefined;
  let seenBlocks = new Set();
  for (let tx of txs) {
    if (!tx.getBlock()) {
      if (!unconfirmedBlock) unconfirmedBlock = new _MoneroBlock.default().setTxs([]);
      tx.setBlock(unconfirmedBlock);
      unconfirmedBlock.getTxs().push(tx);
    }
    if (!seenBlocks.has(tx.getBlock())) {
      seenBlocks.add(tx.getBlock());
      blocks.push(tx.getBlock());
    }
  }

  // serialize blocks to json
  for (let i = 0; i < blocks.length; i++) blocks[i] = blocks[i].toJson();
  return blocks;
};

self.daemonGetTxHexes = async function (daemonId, txHashes, prune) {
  return self.WORKER_OBJECTS[daemonId].getTxHexes(txHashes, prune);
};

self.daemonGetMinerTxSum = async function (daemonId, height, numBlocks) {
  return (await self.WORKER_OBJECTS[daemonId].getMinerTxSum(height, numBlocks)).toJson();
};

self.daemonGetFeeEstimate = async function (daemonId, graceBlocks) {
  return (await self.WORKER_OBJECTS[daemonId].getFeeEstimate(graceBlocks)).toJson();
};

self.daemonSubmitTxHex = async function (daemonId, txHex, doNotRelay) {
  return (await self.WORKER_OBJECTS[daemonId].submitTxHex(txHex, doNotRelay)).toJson();
};

self.daemonRelayTxsByHash = async function (daemonId, txHashes) {
  return self.WORKER_OBJECTS[daemonId].relayTxsByHash(txHashes);
};

self.daemonGetTxPool = async function (daemonId) {
  let txs = await self.WORKER_OBJECTS[daemonId].getTxPool();
  let block = new _MoneroBlock.default().setTxs(txs);
  for (let tx of txs) tx.setBlock(block);
  return block.toJson();
};

self.daemonGetTxPoolHashes = async function (daemonId) {
  return self.WORKER_OBJECTS[daemonId].getTxPoolHashes();
};

//async getTxPoolBacklog() {
//  throw new MoneroError("Not implemented");
//}

self.daemonGetTxPoolStats = async function (daemonId) {
  return (await self.WORKER_OBJECTS[daemonId].getTxPoolStats()).toJson();
};

self.daemonFlushTxPool = async function (daemonId, hashes) {
  return self.WORKER_OBJECTS[daemonId].flushTxPool(hashes);
};

self.daemonGetKeyImageSpentStatuses = async function (daemonId, keyImages) {
  return self.WORKER_OBJECTS[daemonId].getKeyImageSpentStatuses(keyImages);
};

//
//async getOutputs(outputs) {
//  throw new MoneroError("Not implemented");
//}

self.daemonGetOutputHistogram = async function (daemonId, amounts, minCount, maxCount, isUnlocked, recentCutoff) {
  let entriesJson = [];
  for (let entry of await self.WORKER_OBJECTS[daemonId].getOutputHistogram(amounts, minCount, maxCount, isUnlocked, recentCutoff)) {
    entriesJson.push(entry.toJson());
  }
  return entriesJson;
};

//
//async getOutputDistribution(amounts, cumulative, startHeight, endHeight) {
//  throw new MoneroError("Not implemented");
//}

self.daemonGetInfo = async function (daemonId) {
  return (await self.WORKER_OBJECTS[daemonId].getInfo()).toJson();
};

self.daemonGetSyncInfo = async function (daemonId) {
  return (await self.WORKER_OBJECTS[daemonId].getSyncInfo()).toJson();
};

self.daemonGetHardForkInfo = async function (daemonId) {
  return (await self.WORKER_OBJECTS[daemonId].getHardForkInfo()).toJson();
};

self.daemonGetAltChains = async function (daemonId) {
  let altChainsJson = [];
  for (let altChain of await self.WORKER_OBJECTS[daemonId].getAltChains()) altChainsJson.push(altChain.toJson());
  return altChainsJson;
};

self.daemonGetAltBlockHashes = async function (daemonId) {
  return self.WORKER_OBJECTS[daemonId].getAltBlockHashes();
};

self.daemonGetDownloadLimit = async function (daemonId) {
  return self.WORKER_OBJECTS[daemonId].getDownloadLimit();
};

self.daemonSetDownloadLimit = async function (daemonId, limit) {
  return self.WORKER_OBJECTS[daemonId].setDownloadLimit(limit);
};

self.daemonResetDownloadLimit = async function (daemonId) {
  return self.WORKER_OBJECTS[daemonId].resetDownloadLimit();
};

self.daemonGetUploadLimit = async function (daemonId) {
  return self.WORKER_OBJECTS[daemonId].getUploadLimit();
};

self.daemonSetUploadLimit = async function (daemonId, limit) {
  return self.WORKER_OBJECTS[daemonId].setUploadLimit(limit);
};

self.daemonResetUploadLimit = async function (daemonId) {
  return self.WORKER_OBJECTS[daemonId].resetUploadLimit();
};

self.daemonGetPeers = async function (daemonId) {
  let peersJson = [];
  for (let peer of await self.WORKER_OBJECTS[daemonId].getPeers()) peersJson.push(peer.toJson());
  return peersJson;
};

self.daemonGetKnownPeers = async function (daemonId) {
  let peersJson = [];
  for (let peer of await self.WORKER_OBJECTS[daemonId].getKnownPeers()) peersJson.push(peer.toJson());
  return peersJson;
};

self.daemonSetOutgoingPeerLimit = async function (daemonId, limit) {
  return self.WORKER_OBJECTS[daemonId].setOutgoingPeerLimit(limit);
};

self.daemonSetIncomingPeerLimit = async function (daemonId, limit) {
  return self.WORKER_OBJECTS[daemonId].setIncomingPeerLimit(limit);
};

self.daemonGetPeerBans = async function (daemonId) {
  let bansJson = [];
  for (let ban of await self.WORKER_OBJECTS[daemonId].getPeerBans()) bansJson.push(ban.toJson());
  return bansJson;
};

self.daemonSetPeerBans = async function (daemonId, bansJson) {
  let bans = [];
  for (let banJson of bansJson) bans.push(new _MoneroBan.default(banJson));
  return self.WORKER_OBJECTS[daemonId].setPeerBans(bans);
};

self.daemonStartMining = async function (daemonId, address, numThreads, isBackground, ignoreBattery) {
  return self.WORKER_OBJECTS[daemonId].startMining(address, numThreads, isBackground, ignoreBattery);
};

self.daemonStopMining = async function (daemonId) {
  return self.WORKER_OBJECTS[daemonId].stopMining();
};

self.daemonGetMiningStatus = async function (daemonId) {
  return (await self.WORKER_OBJECTS[daemonId].getMiningStatus()).toJson();
};

self.daemonSubmitBlocks = async function (daemonId, blockBlobs) {
  return self.WORKER_OBJECTS[daemonId].submitBlocks(blockBlobs);
};

self.daemonPruneBlockchain = async function (daemonId, check) {
  return (await self.WORKER_OBJECTS[daemonId].pruneBlockchain(check)).toJson();
};

//async checkForUpdate() {
//  throw new MoneroError("Not implemented");
//}
//
//async downloadUpdate(path) {
//  throw new MoneroError("Not implemented");
//}

self.daemonStop = async function (daemonId) {
  return self.WORKER_OBJECTS[daemonId].stop();
};

self.daemonWaitForNextBlockHeader = async function (daemonId) {
  return (await self.WORKER_OBJECTS[daemonId].waitForNextBlockHeader()).toJson();
};

//------------------------------ WALLET METHODS -------------------------------

self.openWalletData = async function (walletId, path, password, networkType, keysData, cacheData, daemonUriOrConfig) {
  let daemonConnection = daemonUriOrConfig ? new _MoneroRpcConnection.default(daemonUriOrConfig) : undefined;
  self.WORKER_OBJECTS[walletId] = await _MoneroWalletFull.default.openWallet({ path: "", password: password, networkType: networkType, keysData: keysData, cacheData: cacheData, server: daemonConnection, proxyToWorker: false });
  self.WORKER_OBJECTS[walletId].setBrowserMainPath(path);
};

self.createWalletKeys = async function (walletId, configJson) {
  let config = new _MoneroWalletConfig.default(configJson);
  config.setProxyToWorker(false);
  self.WORKER_OBJECTS[walletId] = await _MoneroWalletKeys.MoneroWalletKeys.createWallet(config);
};

self.createWalletFull = async function (walletId, configJson) {
  let config = new _MoneroWalletConfig.default(configJson);
  let path = config.getPath();
  config.setPath("");
  config.setProxyToWorker(false);
  self.WORKER_OBJECTS[walletId] = await _MoneroWalletFull.default.createWallet(config);
  self.WORKER_OBJECTS[walletId].setBrowserMainPath(path);
};

self.isViewOnly = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].isViewOnly();
};

self.getNetworkType = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].getNetworkType();
};

//
//async getVersion() {
//  throw new Error("Not implemented");
//}

self.getSeed = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].getSeed();
};

self.getSeedLanguage = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].getSeedLanguage();
};

self.getSeedLanguages = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].getSeedLanguages();
};

self.getPrivateSpendKey = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].getPrivateSpendKey();
};

self.getPrivateViewKey = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].getPrivateViewKey();
};

self.getPublicViewKey = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].getPublicViewKey();
};

self.getPublicSpendKey = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].getPublicSpendKey();
};

self.getAddress = async function (walletId, accountIdx, subaddressIdx) {
  return self.WORKER_OBJECTS[walletId].getAddress(accountIdx, subaddressIdx);
};

self.getAddressIndex = async function (walletId, address) {
  return (await self.WORKER_OBJECTS[walletId].getAddressIndex(address)).toJson();
};

self.setSubaddressLabel = async function (walletId, accountIdx, subaddressIdx, label) {
  await self.WORKER_OBJECTS[walletId].setSubaddressLabel(accountIdx, subaddressIdx, label);
};

self.getIntegratedAddress = async function (walletId, standardAddress, paymentId) {
  return (await self.WORKER_OBJECTS[walletId].getIntegratedAddress(standardAddress, paymentId)).toJson();
};

self.decodeIntegratedAddress = async function (walletId, integratedAddress) {
  return (await self.WORKER_OBJECTS[walletId].decodeIntegratedAddress(integratedAddress)).toJson();
};

self.setDaemonConnection = async function (walletId, config, isTrusted) {
  return self.WORKER_OBJECTS[walletId].setDaemonConnection(config ? new _MoneroRpcConnection.default(Object.assign(config, { proxyToWorker: false })) : undefined, isTrusted);
};

self.getDaemonConnection = async function (walletId) {
  let connection = await self.WORKER_OBJECTS[walletId].getDaemonConnection();
  return connection ? connection.getConfig() : undefined;
};

self.isDaemonTrusted = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].isDaemonTrusted();
};

self.isConnectedToDaemon = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].isConnectedToDaemon();
};

self.getRestoreHeight = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].getRestoreHeight();
};

self.setRestoreHeight = async function (walletId, restoreHeight) {
  return self.WORKER_OBJECTS[walletId].setRestoreHeight(restoreHeight);
};

self.getDaemonHeight = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].getDaemonHeight();
};

self.getDaemonMaxPeerHeight = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].getDaemonMaxPeerHeight();
};

self.getHeightByDate = async function (walletId, year, month, day) {
  return self.WORKER_OBJECTS[walletId].getHeightByDate(year, month, day);
};

self.isDaemonSynced = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].isDaemonSynced();
};

self.getHeight = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].getHeight();
};

self.addListener = async function (walletId, listenerId) {

  /**
   * Internal listener to bridge notifications to external listeners.
   * 
   * TODO: MoneroWalletListener is not defined until scripts imported
   * 
   * @private
   */
  class WalletWorkerHelperListener extends _MoneroWalletListener.default {





    constructor(walletId, id, worker) {
      super();
      this.walletId = walletId;
      this.id = id;
      this.worker = worker;
    }

    getId() {
      return this.id;
    }

    async onSyncProgress(height, startHeight, endHeight, percentDone, message) {
      this.worker.postMessage([this.walletId, "onSyncProgress_" + this.getId(), height, startHeight, endHeight, percentDone, message]);
    }

    async onNewBlock(height) {
      this.worker.postMessage([this.walletId, "onNewBlock_" + this.getId(), height]);
    }

    async onBalancesChanged(newBalance, newUnlockedBalance) {
      this.worker.postMessage([this.walletId, "onBalancesChanged_" + this.getId(), newBalance.toString(), newUnlockedBalance.toString()]);
    }

    async onOutputReceived(output) {
      let block = output.getTx().getBlock();
      if (block === undefined) block = new _MoneroBlock.default().setTxs([output.getTx()]);
      this.worker.postMessage([this.walletId, "onOutputReceived_" + this.getId(), block.toJson()]); // serialize from root block
    }

    async onOutputSpent(output) {
      let block = output.getTx().getBlock();
      if (block === undefined) block = new _MoneroBlock.default().setTxs([output.getTx()]);
      this.worker.postMessage([this.walletId, "onOutputSpent_" + this.getId(), block.toJson()]); // serialize from root block
    }
  }

  let listener = new WalletWorkerHelperListener(walletId, listenerId, self);
  if (!self.listeners) self.listeners = [];
  self.listeners.push(listener);
  await self.WORKER_OBJECTS[walletId].addListener(listener);
};

self.removeListener = async function (walletId, listenerId) {
  for (let i = 0; i < self.listeners.length; i++) {
    if (self.listeners[i].getId() !== listenerId) continue;
    await self.WORKER_OBJECTS[walletId].removeListener(self.listeners[i]);
    self.listeners.splice(i, 1);
    return;
  }
  throw new _MoneroError.default("Listener is not registered with wallet");
};

self.isSynced = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].isSynced();
};

self.sync = async function (walletId, startHeight, allowConcurrentCalls) {
  return await self.WORKER_OBJECTS[walletId].sync(undefined, startHeight, allowConcurrentCalls);
};

self.startSyncing = async function (walletId, syncPeriodInMs) {
  return self.WORKER_OBJECTS[walletId].startSyncing(syncPeriodInMs);
};

self.stopSyncing = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].stopSyncing();
};

self.scanTxs = async function (walletId, txHashes) {
  return self.WORKER_OBJECTS[walletId].scanTxs(txHashes);
};

self.rescanSpent = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].rescanSpent();
};

self.rescanBlockchain = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].rescanBlockchain();
};

self.getBalance = async function (walletId, accountIdx, subaddressIdx) {
  return (await self.WORKER_OBJECTS[walletId].getBalance(accountIdx, subaddressIdx)).toString();
};

self.getUnlockedBalance = async function (walletId, accountIdx, subaddressIdx) {
  return (await self.WORKER_OBJECTS[walletId].getUnlockedBalance(accountIdx, subaddressIdx)).toString();
};

self.getAccounts = async function (walletId, includeSubaddresses, tag) {
  let accountJsons = [];
  for (let account of await self.WORKER_OBJECTS[walletId].getAccounts(includeSubaddresses, tag)) accountJsons.push(account.toJson());
  return accountJsons;
};

self.getAccount = async function (walletId, accountIdx, includeSubaddresses) {
  return (await self.WORKER_OBJECTS[walletId].getAccount(accountIdx, includeSubaddresses)).toJson();
};

self.createAccount = async function (walletId, label) {
  return (await self.WORKER_OBJECTS[walletId].createAccount(label)).toJson();
};

self.getSubaddresses = async function (walletId, accountIdx, subaddressIndices) {
  let subaddressJsons = [];
  for (let subaddress of await self.WORKER_OBJECTS[walletId].getSubaddresses(accountIdx, subaddressIndices)) subaddressJsons.push(subaddress.toJson());
  return subaddressJsons;
};

self.createSubaddress = async function (walletId, accountIdx, label) {
  return (await self.WORKER_OBJECTS[walletId].createSubaddress(accountIdx, label)).toJson();
};

// TODO: easier or more efficient way than serializing from root blocks?
self.getTxs = async function (walletId, blockJsonQuery) {

  // deserialize query which is json string rooted at block
  let query = new _MoneroBlock.default(blockJsonQuery, _MoneroBlock.default.DeserializationType.TX_QUERY).getTxs()[0];

  // get txs
  let txs = await self.WORKER_OBJECTS[walletId].getTxs(query);

  // collect unique blocks to preserve model relationships as trees (based on monero_wasm_bridge.cpp::get_txs)
  let seenBlocks = new Set();
  let unconfirmedBlock = undefined;
  let blocks = [];
  for (let tx of txs) {
    if (!tx.getBlock()) {
      if (!unconfirmedBlock) unconfirmedBlock = new _MoneroBlock.default().setTxs([]);
      tx.setBlock(unconfirmedBlock);
      unconfirmedBlock.getTxs().push(tx);
    }
    if (!seenBlocks.has(tx.getBlock())) {
      seenBlocks.add(tx.getBlock());
      blocks.push(tx.getBlock());
    }
  }

  // serialize blocks to json
  for (let i = 0; i < blocks.length; i++) blocks[i] = blocks[i].toJson();
  return { blocks: blocks };
};

self.getTransfers = async function (walletId, blockJsonQuery) {

  // deserialize query which is json string rooted at block
  let query = new _MoneroBlock.default(blockJsonQuery, _MoneroBlock.default.DeserializationType.TX_QUERY).getTxs()[0].getTransferQuery();

  // get transfers
  let transfers = await self.WORKER_OBJECTS[walletId].getTransfers(query);

  // collect unique blocks to preserve model relationships as tree
  let unconfirmedBlock = undefined;
  let blocks = [];
  let seenBlocks = new Set();
  for (let transfer of transfers) {
    let tx = transfer.getTx();
    if (!tx.getBlock()) {
      if (!unconfirmedBlock) unconfirmedBlock = new _MoneroBlock.default().setTxs([]);
      tx.setBlock(unconfirmedBlock);
      unconfirmedBlock.getTxs().push(tx);
    }
    if (!seenBlocks.has(tx.getBlock())) {
      seenBlocks.add(tx.getBlock());
      blocks.push(tx.getBlock());
    }
  }

  // serialize blocks to json
  for (let i = 0; i < blocks.length; i++) blocks[i] = blocks[i].toJson();
  return blocks;
};

self.getOutputs = async function (walletId, blockJsonQuery) {

  // deserialize query which is json string rooted at block
  let query = new _MoneroBlock.default(blockJsonQuery, _MoneroBlock.default.DeserializationType.TX_QUERY).getTxs()[0].getOutputQuery();

  // get outputs
  let outputs = await self.WORKER_OBJECTS[walletId].getOutputs(query);

  // collect unique blocks to preserve model relationships as tree
  let unconfirmedBlock = undefined;
  let blocks = [];
  let seenBlocks = new Set();
  for (let output of outputs) {
    let tx = output.getTx();
    if (!tx.getBlock()) {
      if (!unconfirmedBlock) unconfirmedBlock = new _MoneroBlock.default().setTxs([]);
      tx.setBlock(unconfirmedBlock);
      unconfirmedBlock.getTxs().push(tx);
    }
    if (!seenBlocks.has(tx.getBlock())) {
      seenBlocks.add(tx.getBlock());
      blocks.push(tx.getBlock());
    }
  }

  // serialize blocks to json
  for (let i = 0; i < blocks.length; i++) blocks[i] = blocks[i].toJson();
  return blocks;
};

self.exportOutputs = async function (walletId, all) {
  return self.WORKER_OBJECTS[walletId].exportOutputs(all);
};

self.importOutputs = async function (walletId, outputsHex) {
  return self.WORKER_OBJECTS[walletId].importOutputs(outputsHex);
};

self.getKeyImages = async function (walletId, all) {
  return (await self.WORKER_OBJECTS[walletId].exportKeyImages(all)).toJson();
};

self.importKeyImages = async function (walletId, keyImagesJson, offset) {
  let keyImages = [];
  for (let keyImageJson of keyImagesJson) keyImages.push(new _MoneroKeyImage.default(keyImageJson));
  return (await self.WORKER_OBJECTS[walletId].importKeyImages(keyImages, offset)).toJson();
};

//async getNewKeyImagesFromLastImport() {
//  throw new MoneroError("Not implemented");
//}

self.freezeOutput = async function (walletId, keyImage) {
  return self.WORKER_OBJECTS[walletId].freezeOutput(keyImage);
};

self.thawOutput = async function (walletId, keyImage) {
  return self.WORKER_OBJECTS[walletId].thawOutput(keyImage);
};

self.isOutputFrozen = async function (walletId, keyImage) {
  return self.WORKER_OBJECTS[walletId].isOutputFrozen(keyImage);
};

self.getDefaultFeePriority = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].getDefaultFeePriority();
};

self.createTxs = async function (walletId, config) {
  if (typeof config === "object") config = new _MoneroTxConfig.default(config);
  let txs = await self.WORKER_OBJECTS[walletId].createTxs(config);
  return txs[0].getTxSet().toJson();
};

self.sweepOutput = async function (walletId, config) {
  if (typeof config === "object") config = new _MoneroTxConfig.default(config);
  let tx = await self.WORKER_OBJECTS[walletId].sweepOutput(config);
  return tx.getTxSet().toJson();
};

self.sweepUnlocked = async function (walletId, config) {
  if (typeof config === "object") config = new _MoneroTxConfig.default(config);
  let txs = await self.WORKER_OBJECTS[walletId].sweepUnlocked(config);
  let txSets = [];
  for (let tx of txs) if (!_GenUtils.default.arrayContains(txSets, tx.getTxSet())) txSets.push(tx.getTxSet());
  let txSetsJson = [];
  for (let txSet of txSets) txSetsJson.push(txSet.toJson());
  return txSetsJson;
};

self.sweepDust = async function (walletId, relay) {
  let txs = await self.WORKER_OBJECTS[walletId].sweepDust(relay);
  return txs.length === 0 ? {} : txs[0].getTxSet().toJson();
};

self.relayTxs = async function (walletId, txMetadatas) {
  return self.WORKER_OBJECTS[walletId].relayTxs(txMetadatas);
};

self.describeTxSet = async function (walletId, txSetJson) {
  return (await self.WORKER_OBJECTS[walletId].describeTxSet(new _MoneroTxSet.default(txSetJson))).toJson();
};

self.signTxs = async function (walletId, unsignedTxHex) {
  return self.WORKER_OBJECTS[walletId].signTxs(unsignedTxHex);
};

self.submitTxs = async function (walletId, signedTxHex) {
  return self.WORKER_OBJECTS[walletId].submitTxs(signedTxHex);
};

self.signMessage = async function (walletId, message, signatureType, accountIdx, subaddressIdx) {
  return self.WORKER_OBJECTS[walletId].signMessage(message, signatureType, accountIdx, subaddressIdx);
};

self.verifyMessage = async function (walletId, message, address, signature) {
  return (await self.WORKER_OBJECTS[walletId].verifyMessage(message, address, signature)).toJson();
};

self.getTxKey = async function (walletId, txHash) {
  return self.WORKER_OBJECTS[walletId].getTxKey(txHash);
};

self.checkTxKey = async function (walletId, txHash, txKey, address) {
  return (await self.WORKER_OBJECTS[walletId].checkTxKey(txHash, txKey, address)).toJson();
};

self.getTxProof = async function (walletId, txHash, address, message) {
  return self.WORKER_OBJECTS[walletId].getTxProof(txHash, address, message);
};

self.checkTxProof = async function (walletId, txHash, address, message, signature) {
  return (await self.WORKER_OBJECTS[walletId].checkTxProof(txHash, address, message, signature)).toJson();
};

self.getSpendProof = async function (walletId, txHash, message) {
  return self.WORKER_OBJECTS[walletId].getSpendProof(txHash, message);
};

self.checkSpendProof = async function (walletId, txHash, message, signature) {
  return self.WORKER_OBJECTS[walletId].checkSpendProof(txHash, message, signature);
};

self.getReserveProofWallet = async function (walletId, message) {
  return self.WORKER_OBJECTS[walletId].getReserveProofWallet(message);
};

self.getReserveProofAccount = async function (walletId, accountIdx, amountStr, message) {
  return self.WORKER_OBJECTS[walletId].getReserveProofAccount(accountIdx, amountStr, message);
};

self.checkReserveProof = async function (walletId, address, message, signature) {
  return (await self.WORKER_OBJECTS[walletId].checkReserveProof(address, message, signature)).toJson();
};

self.getTxNotes = async function (walletId, txHashes) {
  return self.WORKER_OBJECTS[walletId].getTxNotes(txHashes);
};

self.setTxNotes = async function (walletId, txHashes, txNotes) {
  return self.WORKER_OBJECTS[walletId].setTxNotes(txHashes, txNotes);
};

self.getAddressBookEntries = async function (walletId, entryIndices) {
  let entriesJson = [];
  for (let entry of await self.WORKER_OBJECTS[walletId].getAddressBookEntries(entryIndices)) entriesJson.push(entry.toJson());
  return entriesJson;
};

self.addAddressBookEntry = async function (walletId, address, description) {
  return self.WORKER_OBJECTS[walletId].addAddressBookEntry(address, description);
};

self.editAddressBookEntry = async function (walletId, index, setAddress, address, setDescription, description) {
  return self.WORKER_OBJECTS[walletId].editAddressBookEntry(index, setAddress, address, setDescription, description);
};

self.deleteAddressBookEntry = async function (walletId, index) {
  return self.WORKER_OBJECTS[walletId].deleteAddressBookEntry(index);
};

self.tagAccounts = async function (walletId, tag, accountIndices) {
  throw new Error("Not implemented");
};

self.untagAccounts = async function (walletId, accountIndices) {
  throw new Error("Not implemented");
};

self.getAccountTags = async function (walletId) {
  throw new Error("Not implemented");
};

self.setAccountTagLabel = async function (walletId, tag, label) {
  throw new Error("Not implemented");
};

self.getPaymentUri = async function (walletId, configJson) {
  return self.WORKER_OBJECTS[walletId].getPaymentUri(new _MoneroTxConfig.default(configJson));
};

self.parsePaymentUri = async function (walletId, uri) {
  return (await self.WORKER_OBJECTS[walletId].parsePaymentUri(uri)).toJson();
};

self.getAttribute = async function (walletId, key) {
  return self.WORKER_OBJECTS[walletId].getAttribute(key);
};

self.setAttribute = async function (walletId, key, value) {
  return self.WORKER_OBJECTS[walletId].setAttribute(key, value);
};

self.startMining = async function (walletId, numThreads, backgroundMining, ignoreBattery) {
  return self.WORKER_OBJECTS[walletId].startMining(numThreads, backgroundMining, ignoreBattery);
};

self.stopMining = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].stopMining();
};

self.isMultisigImportNeeded = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].isMultisigImportNeeded();
};

self.isMultisig = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].isMultisig();
};

self.getMultisigInfo = async function (walletId) {
  return (await self.WORKER_OBJECTS[walletId].getMultisigInfo()).toJson();
};

self.prepareMultisig = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].prepareMultisig();
};

self.makeMultisig = async function (walletId, multisigHexes, threshold, password) {
  return await self.WORKER_OBJECTS[walletId].makeMultisig(multisigHexes, threshold, password);
};

self.exchangeMultisigKeys = async function (walletId, multisigHexes, password) {
  return (await self.WORKER_OBJECTS[walletId].exchangeMultisigKeys(multisigHexes, password)).toJson();
};

self.exportMultisigHex = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].exportMultisigHex();
};

self.importMultisigHex = async function (walletId, multisigHexes, refreshAfterImport) {
  return self.WORKER_OBJECTS[walletId].importMultisigHex(multisigHexes, refreshAfterImport);
};

self.signMultisigTxHex = async function (walletId, multisigTxHex) {
  return (await self.WORKER_OBJECTS[walletId].signMultisigTxHex(multisigTxHex)).toJson();
};

self.submitMultisigTxHex = async function (walletId, signedMultisigTxHex) {
  return self.WORKER_OBJECTS[walletId].submitMultisigTxHex(signedMultisigTxHex);
};

self.getData = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].getData();
};

self.changePassword = async function (walletId, oldPassword, newPassword) {
  return self.WORKER_OBJECTS[walletId].changePassword(oldPassword, newPassword);
};

self.isClosed = async function (walletId) {
  return !self.WORKER_OBJECTS[walletId] || self.WORKER_OBJECTS[walletId].isClosed();
};

self.prepareClose = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].prepareClose();
};

self.getCloseData = async function (walletId) {
  return self.WORKER_OBJECTS[walletId].getCloseData();
};

self.close = async function (walletId, save) {
  if (!self.WORKER_OBJECTS[walletId]) return;
  await self.WORKER_OBJECTS[walletId].close(save);
  if (self.listeners) self.listeners = self.listeners.filter((listener) => listener.walletId !== walletId);
  delete self.WORKER_OBJECTS[walletId];
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfSHR0cENsaWVudCIsIl9MaWJyYXJ5VXRpbHMiLCJfTW9uZXJvQmFuIiwiX01vbmVyb0Jsb2NrIiwiX01vbmVyb0RhZW1vbkNvbmZpZyIsIl9Nb25lcm9EYWVtb25MaXN0ZW5lciIsIl9Nb25lcm9EYWVtb25ScGMiLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvS2V5SW1hZ2UiLCJfTW9uZXJvUnBjQ29ubmVjdGlvbiIsIl9Nb25lcm9UeENvbmZpZyIsIl9Nb25lcm9UeFNldCIsIl9Nb25lcm9VdGlscyIsIl9Nb25lcm9XYWxsZXRDb25maWciLCJfTW9uZXJvV2FsbGV0TGlzdGVuZXIiLCJfTW9uZXJvV2FsbGV0S2V5cyIsIl9Nb25lcm9XYWxsZXRGdWxsIiwiR2VuVXRpbHMiLCJpc0Rlbm8iLCJzZWxmIiwiZ2xvYmFsVGhpcyIsIkRlZGljYXRlZFdvcmtlckdsb2JhbFNjb3BlIiwicHJvdG90eXBlIiwiaXNQcm90b3R5cGVPZiIsIkh0dHBDbGllbnQiLCJMaWJyYXJ5VXRpbHMiLCJvbm1lc3NhZ2UiLCJlIiwiaW5pdE9uZVRpbWUiLCJvYmplY3RJZCIsImRhdGEiLCJmbk5hbWUiLCJjYWxsYmFja0lkIiwiYXNzZXJ0IiwiRXJyb3IiLCJzcGxpY2UiLCJwb3N0TWVzc2FnZSIsInJlc3VsdCIsImFwcGx5IiwiZXJyb3IiLCJzZXJpYWxpemVFcnJvciIsImlzSW5pdGlhbGl6ZWQiLCJXT1JLRVJfT0JKRUNUUyIsIk1vbmVyb1V0aWxzIiwiUFJPWFlfVE9fV09SS0VSIiwiaHR0cFJlcXVlc3QiLCJvcHRzIiwicmVxdWVzdCIsIk9iamVjdCIsImFzc2lnbiIsInByb3h5VG9Xb3JrZXIiLCJlcnIiLCJzdGF0dXNDb2RlIiwiSlNPTiIsInN0cmluZ2lmeSIsInN0YXR1c01lc3NhZ2UiLCJtZXNzYWdlIiwic2V0TG9nTGV2ZWwiLCJsZXZlbCIsImdldFdhc21NZW1vcnlVc2VkIiwiZ2V0V2FzbU1vZHVsZSIsIkhFQVA4IiwibGVuZ3RoIiwidW5kZWZpbmVkIiwibW9uZXJvVXRpbHNHZXRJbnRlZ3JhdGVkQWRkcmVzcyIsIm5ldHdvcmtUeXBlIiwic3RhbmRhcmRBZGRyZXNzIiwicGF5bWVudElkIiwiZ2V0SW50ZWdyYXRlZEFkZHJlc3MiLCJ0b0pzb24iLCJtb25lcm9VdGlsc1ZhbGlkYXRlQWRkcmVzcyIsImFkZHJlc3MiLCJ2YWxpZGF0ZUFkZHJlc3MiLCJtb25lcm9VdGlsc0pzb25Ub0JpbmFyeSIsImpzb24iLCJqc29uVG9CaW5hcnkiLCJtb25lcm9VdGlsc0JpbmFyeVRvSnNvbiIsInVpbnQ4YXJyIiwiYmluYXJ5VG9Kc29uIiwibW9uZXJvVXRpbHNCaW5hcnlCbG9ja3NUb0pzb24iLCJiaW5hcnlCbG9ja3NUb0pzb24iLCJkYWVtb25BZGRMaXN0ZW5lciIsImRhZW1vbklkIiwibGlzdGVuZXJJZCIsImxpc3RlbmVyIiwiTW9uZXJvRGFlbW9uTGlzdGVuZXIiLCJvbkJsb2NrSGVhZGVyIiwiYmxvY2tIZWFkZXIiLCJkYWVtb25MaXN0ZW5lcnMiLCJhZGRMaXN0ZW5lciIsImRhZW1vblJlbW92ZUxpc3RlbmVyIiwiTW9uZXJvRXJyb3IiLCJyZW1vdmVMaXN0ZW5lciIsImNvbm5lY3REYWVtb25ScGMiLCJjb25maWciLCJNb25lcm9EYWVtb25ScGMiLCJjb25uZWN0VG9EYWVtb25ScGMiLCJNb25lcm9EYWVtb25Db25maWciLCJkYWVtb25HZXRScGNDb25uZWN0aW9uIiwiY29ubmVjdGlvbiIsImdldFJwY0Nvbm5lY3Rpb24iLCJnZXRDb25maWciLCJkYWVtb25Jc0Nvbm5lY3RlZCIsImlzQ29ubmVjdGVkIiwiZGFlbW9uR2V0VmVyc2lvbiIsImdldFZlcnNpb24iLCJkYWVtb25Jc1RydXN0ZWQiLCJpc1RydXN0ZWQiLCJkYWVtb25HZXRIZWlnaHQiLCJnZXRIZWlnaHQiLCJkYWVtb25HZXRCbG9ja0hhc2giLCJoZWlnaHQiLCJnZXRCbG9ja0hhc2giLCJkYWVtb25HZXRCbG9ja1RlbXBsYXRlIiwid2FsbGV0QWRkcmVzcyIsInJlc2VydmVTaXplIiwiZ2V0QmxvY2tUZW1wbGF0ZSIsImRhZW1vbkdldExhc3RCbG9ja0hlYWRlciIsImdldExhc3RCbG9ja0hlYWRlciIsImRhZW1vbkdldEJsb2NrSGVhZGVyQnlIYXNoIiwiaGFzaCIsImdldEJsb2NrSGVhZGVyQnlIYXNoIiwiZGFlbW9uR2V0QmxvY2tIZWFkZXJCeUhlaWdodCIsImdldEJsb2NrSGVhZGVyQnlIZWlnaHQiLCJkYWVtb25HZXRCbG9ja0hlYWRlcnNCeVJhbmdlIiwic3RhcnRIZWlnaHQiLCJlbmRIZWlnaHQiLCJibG9ja0hlYWRlcnNKc29uIiwiZ2V0QmxvY2tIZWFkZXJzQnlSYW5nZSIsInB1c2giLCJkYWVtb25HZXRCbG9ja0J5SGFzaCIsImJsb2NrSGFzaCIsImdldEJsb2NrQnlIYXNoIiwiZGFlbW9uR2V0QmxvY2tzQnlIYXNoIiwiYmxvY2tIYXNoZXMiLCJwcnVuZSIsImJsb2Nrc0pzb24iLCJibG9jayIsImdldEJsb2Nrc0J5SGFzaCIsImRhZW1vbkdldEJsb2NrQnlIZWlnaHQiLCJnZXRCbG9ja0J5SGVpZ2h0IiwiZGFlbW9uR2V0QmxvY2tzQnlIZWlnaHQiLCJoZWlnaHRzIiwiZ2V0QmxvY2tzQnlIZWlnaHQiLCJkYWVtb25HZXRCbG9ja3NCeVJhbmdlIiwiZ2V0QmxvY2tzQnlSYW5nZSIsImRhZW1vbkdldEJsb2Nrc0J5UmFuZ2VDaHVua2VkIiwibWF4Q2h1bmtTaXplIiwiZ2V0QmxvY2tzQnlSYW5nZUNodW5rZWQiLCJkYWVtb25HZXRCbG9ja0hhc2hlcyIsImRhZW1vbkdldFR4cyIsInR4SGFzaGVzIiwidHhzIiwiZ2V0VHhzIiwiYmxvY2tzIiwidW5jb25maXJtZWRCbG9jayIsInNlZW5CbG9ja3MiLCJTZXQiLCJ0eCIsImdldEJsb2NrIiwiTW9uZXJvQmxvY2siLCJzZXRUeHMiLCJzZXRCbG9jayIsImhhcyIsImFkZCIsImkiLCJkYWVtb25HZXRUeEhleGVzIiwiZ2V0VHhIZXhlcyIsImRhZW1vbkdldE1pbmVyVHhTdW0iLCJudW1CbG9ja3MiLCJnZXRNaW5lclR4U3VtIiwiZGFlbW9uR2V0RmVlRXN0aW1hdGUiLCJncmFjZUJsb2NrcyIsImdldEZlZUVzdGltYXRlIiwiZGFlbW9uU3VibWl0VHhIZXgiLCJ0eEhleCIsImRvTm90UmVsYXkiLCJzdWJtaXRUeEhleCIsImRhZW1vblJlbGF5VHhzQnlIYXNoIiwicmVsYXlUeHNCeUhhc2giLCJkYWVtb25HZXRUeFBvb2wiLCJnZXRUeFBvb2wiLCJkYWVtb25HZXRUeFBvb2xIYXNoZXMiLCJnZXRUeFBvb2xIYXNoZXMiLCJkYWVtb25HZXRUeFBvb2xTdGF0cyIsImdldFR4UG9vbFN0YXRzIiwiZGFlbW9uRmx1c2hUeFBvb2wiLCJoYXNoZXMiLCJmbHVzaFR4UG9vbCIsImRhZW1vbkdldEtleUltYWdlU3BlbnRTdGF0dXNlcyIsImtleUltYWdlcyIsImdldEtleUltYWdlU3BlbnRTdGF0dXNlcyIsImRhZW1vbkdldE91dHB1dEhpc3RvZ3JhbSIsImFtb3VudHMiLCJtaW5Db3VudCIsIm1heENvdW50IiwiaXNVbmxvY2tlZCIsInJlY2VudEN1dG9mZiIsImVudHJpZXNKc29uIiwiZW50cnkiLCJnZXRPdXRwdXRIaXN0b2dyYW0iLCJkYWVtb25HZXRJbmZvIiwiZ2V0SW5mbyIsImRhZW1vbkdldFN5bmNJbmZvIiwiZ2V0U3luY0luZm8iLCJkYWVtb25HZXRIYXJkRm9ya0luZm8iLCJnZXRIYXJkRm9ya0luZm8iLCJkYWVtb25HZXRBbHRDaGFpbnMiLCJhbHRDaGFpbnNKc29uIiwiYWx0Q2hhaW4iLCJnZXRBbHRDaGFpbnMiLCJkYWVtb25HZXRBbHRCbG9ja0hhc2hlcyIsImdldEFsdEJsb2NrSGFzaGVzIiwiZGFlbW9uR2V0RG93bmxvYWRMaW1pdCIsImdldERvd25sb2FkTGltaXQiLCJkYWVtb25TZXREb3dubG9hZExpbWl0IiwibGltaXQiLCJzZXREb3dubG9hZExpbWl0IiwiZGFlbW9uUmVzZXREb3dubG9hZExpbWl0IiwicmVzZXREb3dubG9hZExpbWl0IiwiZGFlbW9uR2V0VXBsb2FkTGltaXQiLCJnZXRVcGxvYWRMaW1pdCIsImRhZW1vblNldFVwbG9hZExpbWl0Iiwic2V0VXBsb2FkTGltaXQiLCJkYWVtb25SZXNldFVwbG9hZExpbWl0IiwicmVzZXRVcGxvYWRMaW1pdCIsImRhZW1vbkdldFBlZXJzIiwicGVlcnNKc29uIiwicGVlciIsImdldFBlZXJzIiwiZGFlbW9uR2V0S25vd25QZWVycyIsImdldEtub3duUGVlcnMiLCJkYWVtb25TZXRPdXRnb2luZ1BlZXJMaW1pdCIsInNldE91dGdvaW5nUGVlckxpbWl0IiwiZGFlbW9uU2V0SW5jb21pbmdQZWVyTGltaXQiLCJzZXRJbmNvbWluZ1BlZXJMaW1pdCIsImRhZW1vbkdldFBlZXJCYW5zIiwiYmFuc0pzb24iLCJiYW4iLCJnZXRQZWVyQmFucyIsImRhZW1vblNldFBlZXJCYW5zIiwiYmFucyIsImJhbkpzb24iLCJNb25lcm9CYW4iLCJzZXRQZWVyQmFucyIsImRhZW1vblN0YXJ0TWluaW5nIiwibnVtVGhyZWFkcyIsImlzQmFja2dyb3VuZCIsImlnbm9yZUJhdHRlcnkiLCJzdGFydE1pbmluZyIsImRhZW1vblN0b3BNaW5pbmciLCJzdG9wTWluaW5nIiwiZGFlbW9uR2V0TWluaW5nU3RhdHVzIiwiZ2V0TWluaW5nU3RhdHVzIiwiZGFlbW9uU3VibWl0QmxvY2tzIiwiYmxvY2tCbG9icyIsInN1Ym1pdEJsb2NrcyIsImRhZW1vblBydW5lQmxvY2tjaGFpbiIsImNoZWNrIiwicHJ1bmVCbG9ja2NoYWluIiwiZGFlbW9uU3RvcCIsInN0b3AiLCJkYWVtb25XYWl0Rm9yTmV4dEJsb2NrSGVhZGVyIiwid2FpdEZvck5leHRCbG9ja0hlYWRlciIsIm9wZW5XYWxsZXREYXRhIiwid2FsbGV0SWQiLCJwYXRoIiwicGFzc3dvcmQiLCJrZXlzRGF0YSIsImNhY2hlRGF0YSIsImRhZW1vblVyaU9yQ29uZmlnIiwiZGFlbW9uQ29ubmVjdGlvbiIsIk1vbmVyb1JwY0Nvbm5lY3Rpb24iLCJNb25lcm9XYWxsZXRGdWxsIiwib3BlbldhbGxldCIsInNlcnZlciIsInNldEJyb3dzZXJNYWluUGF0aCIsImNyZWF0ZVdhbGxldEtleXMiLCJjb25maWdKc29uIiwiTW9uZXJvV2FsbGV0Q29uZmlnIiwic2V0UHJveHlUb1dvcmtlciIsIk1vbmVyb1dhbGxldEtleXMiLCJjcmVhdGVXYWxsZXQiLCJjcmVhdGVXYWxsZXRGdWxsIiwiZ2V0UGF0aCIsInNldFBhdGgiLCJpc1ZpZXdPbmx5IiwiZ2V0TmV0d29ya1R5cGUiLCJnZXRTZWVkIiwiZ2V0U2VlZExhbmd1YWdlIiwiZ2V0U2VlZExhbmd1YWdlcyIsImdldFByaXZhdGVTcGVuZEtleSIsImdldFByaXZhdGVWaWV3S2V5IiwiZ2V0UHVibGljVmlld0tleSIsImdldFB1YmxpY1NwZW5kS2V5IiwiZ2V0QWRkcmVzcyIsImFjY291bnRJZHgiLCJzdWJhZGRyZXNzSWR4IiwiZ2V0QWRkcmVzc0luZGV4Iiwic2V0U3ViYWRkcmVzc0xhYmVsIiwibGFiZWwiLCJkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyIsImludGVncmF0ZWRBZGRyZXNzIiwic2V0RGFlbW9uQ29ubmVjdGlvbiIsImdldERhZW1vbkNvbm5lY3Rpb24iLCJpc0RhZW1vblRydXN0ZWQiLCJpc0Nvbm5lY3RlZFRvRGFlbW9uIiwiZ2V0UmVzdG9yZUhlaWdodCIsInNldFJlc3RvcmVIZWlnaHQiLCJyZXN0b3JlSGVpZ2h0IiwiZ2V0RGFlbW9uSGVpZ2h0IiwiZ2V0RGFlbW9uTWF4UGVlckhlaWdodCIsImdldEhlaWdodEJ5RGF0ZSIsInllYXIiLCJtb250aCIsImRheSIsImlzRGFlbW9uU3luY2VkIiwiV2FsbGV0V29ya2VySGVscGVyTGlzdGVuZXIiLCJNb25lcm9XYWxsZXRMaXN0ZW5lciIsImNvbnN0cnVjdG9yIiwiaWQiLCJ3b3JrZXIiLCJnZXRJZCIsIm9uU3luY1Byb2dyZXNzIiwicGVyY2VudERvbmUiLCJvbk5ld0Jsb2NrIiwib25CYWxhbmNlc0NoYW5nZWQiLCJuZXdCYWxhbmNlIiwibmV3VW5sb2NrZWRCYWxhbmNlIiwidG9TdHJpbmciLCJvbk91dHB1dFJlY2VpdmVkIiwib3V0cHV0IiwiZ2V0VHgiLCJvbk91dHB1dFNwZW50IiwibGlzdGVuZXJzIiwiaXNTeW5jZWQiLCJzeW5jIiwiYWxsb3dDb25jdXJyZW50Q2FsbHMiLCJzdGFydFN5bmNpbmciLCJzeW5jUGVyaW9kSW5NcyIsInN0b3BTeW5jaW5nIiwic2NhblR4cyIsInJlc2NhblNwZW50IiwicmVzY2FuQmxvY2tjaGFpbiIsImdldEJhbGFuY2UiLCJnZXRVbmxvY2tlZEJhbGFuY2UiLCJnZXRBY2NvdW50cyIsImluY2x1ZGVTdWJhZGRyZXNzZXMiLCJ0YWciLCJhY2NvdW50SnNvbnMiLCJhY2NvdW50IiwiZ2V0QWNjb3VudCIsImNyZWF0ZUFjY291bnQiLCJnZXRTdWJhZGRyZXNzZXMiLCJzdWJhZGRyZXNzSW5kaWNlcyIsInN1YmFkZHJlc3NKc29ucyIsInN1YmFkZHJlc3MiLCJjcmVhdGVTdWJhZGRyZXNzIiwiYmxvY2tKc29uUXVlcnkiLCJxdWVyeSIsIkRlc2VyaWFsaXphdGlvblR5cGUiLCJUWF9RVUVSWSIsImdldFRyYW5zZmVycyIsImdldFRyYW5zZmVyUXVlcnkiLCJ0cmFuc2ZlcnMiLCJ0cmFuc2ZlciIsImdldE91dHB1dHMiLCJnZXRPdXRwdXRRdWVyeSIsIm91dHB1dHMiLCJleHBvcnRPdXRwdXRzIiwiYWxsIiwiaW1wb3J0T3V0cHV0cyIsIm91dHB1dHNIZXgiLCJnZXRLZXlJbWFnZXMiLCJleHBvcnRLZXlJbWFnZXMiLCJpbXBvcnRLZXlJbWFnZXMiLCJrZXlJbWFnZXNKc29uIiwib2Zmc2V0Iiwia2V5SW1hZ2VKc29uIiwiTW9uZXJvS2V5SW1hZ2UiLCJmcmVlemVPdXRwdXQiLCJrZXlJbWFnZSIsInRoYXdPdXRwdXQiLCJpc091dHB1dEZyb3plbiIsImdldERlZmF1bHRGZWVQcmlvcml0eSIsImNyZWF0ZVR4cyIsIk1vbmVyb1R4Q29uZmlnIiwiZ2V0VHhTZXQiLCJzd2VlcE91dHB1dCIsInN3ZWVwVW5sb2NrZWQiLCJ0eFNldHMiLCJhcnJheUNvbnRhaW5zIiwidHhTZXRzSnNvbiIsInR4U2V0Iiwic3dlZXBEdXN0IiwicmVsYXkiLCJyZWxheVR4cyIsInR4TWV0YWRhdGFzIiwiZGVzY3JpYmVUeFNldCIsInR4U2V0SnNvbiIsIk1vbmVyb1R4U2V0Iiwic2lnblR4cyIsInVuc2lnbmVkVHhIZXgiLCJzdWJtaXRUeHMiLCJzaWduZWRUeEhleCIsInNpZ25NZXNzYWdlIiwic2lnbmF0dXJlVHlwZSIsInZlcmlmeU1lc3NhZ2UiLCJzaWduYXR1cmUiLCJnZXRUeEtleSIsInR4SGFzaCIsImNoZWNrVHhLZXkiLCJ0eEtleSIsImdldFR4UHJvb2YiLCJjaGVja1R4UHJvb2YiLCJnZXRTcGVuZFByb29mIiwiY2hlY2tTcGVuZFByb29mIiwiZ2V0UmVzZXJ2ZVByb29mV2FsbGV0IiwiZ2V0UmVzZXJ2ZVByb29mQWNjb3VudCIsImFtb3VudFN0ciIsImNoZWNrUmVzZXJ2ZVByb29mIiwiZ2V0VHhOb3RlcyIsInNldFR4Tm90ZXMiLCJ0eE5vdGVzIiwiZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzIiwiZW50cnlJbmRpY2VzIiwiYWRkQWRkcmVzc0Jvb2tFbnRyeSIsImRlc2NyaXB0aW9uIiwiZWRpdEFkZHJlc3NCb29rRW50cnkiLCJpbmRleCIsInNldEFkZHJlc3MiLCJzZXREZXNjcmlwdGlvbiIsImRlbGV0ZUFkZHJlc3NCb29rRW50cnkiLCJ0YWdBY2NvdW50cyIsImFjY291bnRJbmRpY2VzIiwidW50YWdBY2NvdW50cyIsImdldEFjY291bnRUYWdzIiwic2V0QWNjb3VudFRhZ0xhYmVsIiwiZ2V0UGF5bWVudFVyaSIsInBhcnNlUGF5bWVudFVyaSIsInVyaSIsImdldEF0dHJpYnV0ZSIsImtleSIsInNldEF0dHJpYnV0ZSIsInZhbHVlIiwiYmFja2dyb3VuZE1pbmluZyIsImlzTXVsdGlzaWdJbXBvcnROZWVkZWQiLCJpc011bHRpc2lnIiwiZ2V0TXVsdGlzaWdJbmZvIiwicHJlcGFyZU11bHRpc2lnIiwibWFrZU11bHRpc2lnIiwibXVsdGlzaWdIZXhlcyIsInRocmVzaG9sZCIsImV4Y2hhbmdlTXVsdGlzaWdLZXlzIiwiZXhwb3J0TXVsdGlzaWdIZXgiLCJpbXBvcnRNdWx0aXNpZ0hleCIsInJlZnJlc2hBZnRlckltcG9ydCIsInNpZ25NdWx0aXNpZ1R4SGV4IiwibXVsdGlzaWdUeEhleCIsInN1Ym1pdE11bHRpc2lnVHhIZXgiLCJzaWduZWRNdWx0aXNpZ1R4SGV4IiwiZ2V0RGF0YSIsImNoYW5nZVBhc3N3b3JkIiwib2xkUGFzc3dvcmQiLCJuZXdQYXNzd29yZCIsImlzQ2xvc2VkIiwicHJlcGFyZUNsb3NlIiwiZ2V0Q2xvc2VEYXRhIiwiY2xvc2UiLCJzYXZlIiwiZmlsdGVyIl0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvY29tbW9uL01vbmVyb1dlYldvcmtlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXNzZXJ0IGZyb20gXCJhc3NlcnRcIjtcbmltcG9ydCBHZW5VdGlscyBmcm9tIFwiLi9HZW5VdGlsc1wiO1xuaW1wb3J0IEh0dHBDbGllbnQgZnJvbSBcIi4vSHR0cENsaWVudFwiO1xuaW1wb3J0IExpYnJhcnlVdGlscyBmcm9tIFwiLi9MaWJyYXJ5VXRpbHNcIjtcbmltcG9ydCBNb25lcm9CYW4gZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9CYW5cIjtcbmltcG9ydCBNb25lcm9CbG9jayBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0Jsb2NrXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uQ29uZmlnIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvRGFlbW9uQ29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uTGlzdGVuZXIgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9EYWVtb25MaXN0ZW5lclwiO1xuaW1wb3J0IE1vbmVyb0RhZW1vblJwYyBmcm9tIFwiLi4vZGFlbW9uL01vbmVyb0RhZW1vblJwY1wiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuL01vbmVyb0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2UgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9LZXlJbWFnZVwiO1xuaW1wb3J0IE1vbmVyb1JwY0Nvbm5lY3Rpb24gZnJvbSBcIi4vTW9uZXJvUnBjQ29ubmVjdGlvblwiO1xuaW1wb3J0IE1vbmVyb1R4Q29uZmlnIGZyb20gXCIuLi93YWxsZXQvbW9kZWwvTW9uZXJvVHhDb25maWdcIjtcbmltcG9ydCBNb25lcm9UeFF1ZXJ5IGZyb20gXCIuLi93YWxsZXQvbW9kZWwvTW9uZXJvVHhRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb1R4U2V0IGZyb20gXCIuLi93YWxsZXQvbW9kZWwvTW9uZXJvVHhTZXRcIjtcbmltcG9ydCBNb25lcm9VdGlscyBmcm9tIFwiLi9Nb25lcm9VdGlsc1wiO1xuaW1wb3J0IE1vbmVyb1dhbGxldENvbmZpZyBmcm9tIFwiLi4vd2FsbGV0L21vZGVsL01vbmVyb1dhbGxldENvbmZpZ1wiXG5pbXBvcnQgTW9uZXJvV2FsbGV0TGlzdGVuZXIgZnJvbSBcIi4uL3dhbGxldC9tb2RlbC9Nb25lcm9XYWxsZXRMaXN0ZW5lclwiXG5pbXBvcnQge01vbmVyb1dhbGxldEtleXN9IGZyb20gXCIuLi93YWxsZXQvTW9uZXJvV2FsbGV0S2V5c1wiO1xuaW1wb3J0IE1vbmVyb1dhbGxldEZ1bGwgZnJvbSBcIi4uL3dhbGxldC9Nb25lcm9XYWxsZXRGdWxsXCI7XG5cbmRlY2xhcmUgdmFyIHNlbGY6IGFueTtcblxuLy8gZGVubyBjb25maWd1cmF0aW9uXG5kZWNsYXJlIHZhciBEZWRpY2F0ZWRXb3JrZXJHbG9iYWxTY29wZTogYW55O1xuaWYgKEdlblV0aWxzLmlzRGVubygpICYmIHR5cGVvZiBzZWxmID09PSBcInVuZGVmaW5lZFwiICYmIHR5cGVvZiBnbG9iYWxUaGlzID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBEZWRpY2F0ZWRXb3JrZXJHbG9iYWxTY29wZSA9PT0gXCJmdW5jdGlvblwiICYmIERlZGljYXRlZFdvcmtlckdsb2JhbFNjb3BlLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGdsb2JhbFRoaXMpKSB7XG4gIHNlbGYgPSBnbG9iYWxUaGlzO1xuICAoZ2xvYmFsVGhpcyBhcyBhbnkpLnNlbGYgPSBnbG9iYWxUaGlzO1xufVxuXG4vLyBleHBvc2Ugc29tZSBtb2R1bGVzIHRvIHRoZSB3b3JrZXJcbnNlbGYuSHR0cENsaWVudCA9IEh0dHBDbGllbnQ7XG5zZWxmLkxpYnJhcnlVdGlscyA9IExpYnJhcnlVdGlscztcbnNlbGYuR2VuVXRpbHMgPSBHZW5VdGlscztcblxuLyoqXG4gKiBXb3JrZXIgdG8gbWFuYWdlIGEgZGFlbW9uIGFuZCB3YXNtIHdhbGxldCBvZmYgdGhlIG1haW4gdGhyZWFkIHVzaW5nIG1lc3NhZ2VzLlxuICogXG4gKiBSZXF1aXJlZCBtZXNzYWdlIGZvcm1hdDogZS5kYXRhWzBdID0gb2JqZWN0IGlkLCBlLmRhdGFbMV0gPSBmdW5jdGlvbiBuYW1lLCBlLmRhdGFbMitdID0gZnVuY3Rpb24gYXJnc1xuICpcbiAqIEZvciBicm93c2VyIGFwcGxpY2F0aW9ucywgdGhpcyBmaWxlIG11c3QgYmUgYnJvd3NlcmlmaWVkIGFuZCBwbGFjZWQgaW4gdGhlIHdlYiBhcHAgcm9vdC5cbiAqIFxuICogQHByaXZhdGVcbiAqL1xuc2VsZi5vbm1lc3NhZ2UgPSBhc3luYyBmdW5jdGlvbihlKSB7XG4gIFxuICAvLyBpbml0aWFsaXplIG9uZSB0aW1lXG4gIGF3YWl0IHNlbGYuaW5pdE9uZVRpbWUoKTtcbiAgXG4gIC8vIHZhbGlkYXRlIHBhcmFtc1xuICBsZXQgb2JqZWN0SWQgPSBlLmRhdGFbMF07XG4gIGxldCBmbk5hbWUgPSBlLmRhdGFbMV07XG4gIGxldCBjYWxsYmFja0lkID0gZS5kYXRhWzJdO1xuICBhc3NlcnQoZm5OYW1lLCBcIk11c3QgcHJvdmlkZSBmdW5jdGlvbiBuYW1lIHRvIHdvcmtlclwiKTtcbiAgYXNzZXJ0KGNhbGxiYWNrSWQsIFwiTXVzdCBwcm92aWRlIGNhbGxiYWNrIGlkIHRvIHdvcmtlclwiKTtcbiAgaWYgKCFzZWxmW2ZuTmFtZV0pIHRocm93IG5ldyBFcnJvcihcIk1ldGhvZCAnXCIgKyBmbk5hbWUgKyBcIicgaXMgbm90IHJlZ2lzdGVyZWQgd2l0aCB3b3JrZXJcIik7XG4gIGUuZGF0YS5zcGxpY2UoMSwgMik7IC8vIHJlbW92ZSBmdW5jdGlvbiBuYW1lIGFuZCBjYWxsYmFjayBpZCB0byBhcHBseSBmdW5jdGlvbiB3aXRoIGFyZ3VtZW50c1xuICBcbiAgLy8gZXhlY3V0ZSB3b3JrZXIgZnVuY3Rpb24gYW5kIHBvc3QgcmVzdWx0IHRvIGNhbGxiYWNrXG4gIHRyeSB7XG4gICAgcG9zdE1lc3NhZ2UoW29iamVjdElkLCBjYWxsYmFja0lkLCB7cmVzdWx0OiBhd2FpdCBzZWxmW2ZuTmFtZV0uYXBwbHkobnVsbCwgZS5kYXRhKX1dKTtcbiAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgaWYgKCEoZSBpbnN0YW5jZW9mIEVycm9yKSkgZSA9IG5ldyBFcnJvcihlKTtcbiAgICBwb3N0TWVzc2FnZShbb2JqZWN0SWQsIGNhbGxiYWNrSWQsIHtlcnJvcjogTGlicmFyeVV0aWxzLnNlcmlhbGl6ZUVycm9yKGUpfV0pO1xuICB9XG59XG5cbnNlbGYuaW5pdE9uZVRpbWUgPSBhc3luYyBmdW5jdGlvbigpIHtcbiAgaWYgKCFzZWxmLmlzSW5pdGlhbGl6ZWQpIHtcbiAgICBzZWxmLldPUktFUl9PQkpFQ1RTID0ge307XG4gICAgc2VsZi5pc0luaXRpYWxpemVkID0gdHJ1ZTtcbiAgICBNb25lcm9VdGlscy5QUk9YWV9UT19XT1JLRVIgPSBmYWxzZTtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU1RBVElDIFVUSUxJVElFUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnNlbGYuaHR0cFJlcXVlc3QgPSBhc3luYyBmdW5jdGlvbihvYmplY3RJZCwgb3B0cykge1xuICB0cnkge1xuICAgIHJldHVybiBhd2FpdCBIdHRwQ2xpZW50LnJlcXVlc3QoT2JqZWN0LmFzc2lnbihvcHRzLCB7cHJveHlUb1dvcmtlcjogZmFsc2V9KSk7ICBcbiAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICB0aHJvdyBlcnIuc3RhdHVzQ29kZSA/IG5ldyBFcnJvcihKU09OLnN0cmluZ2lmeSh7c3RhdHVzQ29kZTogZXJyLnN0YXR1c0NvZGUsIHN0YXR1c01lc3NhZ2U6IGVyci5tZXNzYWdlfSkpIDogZXJyO1xuICB9XG59XG5cbnNlbGYuc2V0TG9nTGV2ZWwgPSBhc3luYyBmdW5jdGlvbihvYmplY3RJZCwgbGV2ZWwpIHtcbiAgcmV0dXJuIExpYnJhcnlVdGlscy5zZXRMb2dMZXZlbChsZXZlbCk7XG59XG5cbnNlbGYuZ2V0V2FzbU1lbW9yeVVzZWQgPSBhc3luYyBmdW5jdGlvbihvYmplY3RJZCkge1xuICByZXR1cm4gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKSAmJiBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLkhFQVA4ID8gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5IRUFQOC5sZW5ndGggOiB1bmRlZmluZWQ7XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIE1PTkVSTyBVVElMUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuc2VsZi5tb25lcm9VdGlsc0dldEludGVncmF0ZWRBZGRyZXNzID0gYXN5bmMgZnVuY3Rpb24ob2JqZWN0SWQsIG5ldHdvcmtUeXBlLCBzdGFuZGFyZEFkZHJlc3MsIHBheW1lbnRJZCkge1xuICByZXR1cm4gKGF3YWl0IE1vbmVyb1V0aWxzLmdldEludGVncmF0ZWRBZGRyZXNzKG5ldHdvcmtUeXBlLCBzdGFuZGFyZEFkZHJlc3MsIHBheW1lbnRJZCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLm1vbmVyb1V0aWxzVmFsaWRhdGVBZGRyZXNzID0gYXN5bmMgZnVuY3Rpb24ob2JqZWN0SWQsIGFkZHJlc3MsIG5ldHdvcmtUeXBlKSB7XG4gIHJldHVybiBNb25lcm9VdGlscy52YWxpZGF0ZUFkZHJlc3MoYWRkcmVzcywgbmV0d29ya1R5cGUpO1xufVxuXG5zZWxmLm1vbmVyb1V0aWxzSnNvblRvQmluYXJ5ID0gYXN5bmMgZnVuY3Rpb24ob2JqZWN0SWQsIGpzb24pIHtcbiAgcmV0dXJuIE1vbmVyb1V0aWxzLmpzb25Ub0JpbmFyeShqc29uKTtcbn1cblxuc2VsZi5tb25lcm9VdGlsc0JpbmFyeVRvSnNvbiA9IGFzeW5jIGZ1bmN0aW9uKG9iamVjdElkLCB1aW50OGFycikge1xuICByZXR1cm4gTW9uZXJvVXRpbHMuYmluYXJ5VG9Kc29uKHVpbnQ4YXJyKTtcbn1cblxuc2VsZi5tb25lcm9VdGlsc0JpbmFyeUJsb2Nrc1RvSnNvbiA9IGFzeW5jIGZ1bmN0aW9uKG9iamVjdElkLCB1aW50OGFycikge1xuICByZXR1cm4gTW9uZXJvVXRpbHMuYmluYXJ5QmxvY2tzVG9Kc29uKHVpbnQ4YXJyKTtcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBEQUVNT04gTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5zZWxmLmRhZW1vbkFkZExpc3RlbmVyID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGxpc3RlbmVySWQpIHtcbiAgbGV0IGxpc3RlbmVyID0gbmV3IGNsYXNzIGV4dGVuZHMgTW9uZXJvRGFlbW9uTGlzdGVuZXIge1xuICAgIGFzeW5jIG9uQmxvY2tIZWFkZXIoYmxvY2tIZWFkZXIpIHtcbiAgICAgIHNlbGYucG9zdE1lc3NhZ2UoW2RhZW1vbklkLCBcIm9uQmxvY2tIZWFkZXJfXCIgKyBsaXN0ZW5lcklkLCBibG9ja0hlYWRlci50b0pzb24oKV0pO1xuICAgIH1cbiAgfVxuICBpZiAoIXNlbGYuZGFlbW9uTGlzdGVuZXJzKSBzZWxmLmRhZW1vbkxpc3RlbmVycyA9IHt9O1xuICBzZWxmLmRhZW1vbkxpc3RlbmVyc1tsaXN0ZW5lcklkXSA9IGxpc3RlbmVyO1xuICBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG59XG5cbnNlbGYuZGFlbW9uUmVtb3ZlTGlzdGVuZXIgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgbGlzdGVuZXJJZCkge1xuICBpZiAoIXNlbGYuZGFlbW9uTGlzdGVuZXJzW2xpc3RlbmVySWRdKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJObyBkYWVtb24gd29ya2VyIGxpc3RlbmVyIHJlZ2lzdGVyZWQgd2l0aCBpZDogXCIgKyBsaXN0ZW5lcklkKTtcbiAgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0ucmVtb3ZlTGlzdGVuZXIoc2VsZi5kYWVtb25MaXN0ZW5lcnNbbGlzdGVuZXJJZF0pO1xuICBkZWxldGUgc2VsZi5kYWVtb25MaXN0ZW5lcnNbbGlzdGVuZXJJZF07XG59XG5cbnNlbGYuY29ubmVjdERhZW1vblJwYyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBjb25maWcpIHtcbiAgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0gPSBhd2FpdCBNb25lcm9EYWVtb25ScGMuY29ubmVjdFRvRGFlbW9uUnBjKG5ldyBNb25lcm9EYWVtb25Db25maWcoY29uZmlnKSk7XG59XG5cbnNlbGYuZGFlbW9uR2V0UnBjQ29ubmVjdGlvbiA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIGxldCBjb25uZWN0aW9uID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0UnBjQ29ubmVjdGlvbigpO1xuICByZXR1cm4gY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0Q29uZmlnKCkgOiB1bmRlZmluZWQ7XG59XG5cbnNlbGYuZGFlbW9uSXNDb25uZWN0ZWQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uaXNDb25uZWN0ZWQoKTtcbn1cblxuc2VsZi5kYWVtb25HZXRWZXJzaW9uID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRWZXJzaW9uKCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbklzVHJ1c3RlZCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5pc1RydXN0ZWQoKTtcbn1cblxuc2VsZi5kYWVtb25HZXRIZWlnaHQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0SGVpZ2h0KCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tIYXNoID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGhlaWdodCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tIYXNoKGhlaWdodCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tUZW1wbGF0ZSA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCB3YWxsZXRBZGRyZXNzLCByZXNlcnZlU2l6ZSkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2NrVGVtcGxhdGUod2FsbGV0QWRkcmVzcywgcmVzZXJ2ZVNpemUpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRMYXN0QmxvY2tIZWFkZXIgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldExhc3RCbG9ja0hlYWRlcigpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja0hlYWRlckJ5SGFzaCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBoYXNoKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tIZWFkZXJCeUhhc2goaGFzaCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2NrSGVhZGVyQnlIZWlnaHQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgaGVpZ2h0KSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tIZWFkZXJCeUhlaWdodChoZWlnaHQpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja0hlYWRlcnNCeVJhbmdlID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpIHtcbiAgbGV0IGJsb2NrSGVhZGVyc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgYmxvY2tIZWFkZXIgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tIZWFkZXJzQnlSYW5nZShzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSkgYmxvY2tIZWFkZXJzSnNvbi5wdXNoKGJsb2NrSGVhZGVyLnRvSnNvbigpKTtcbiAgcmV0dXJuIGJsb2NrSGVhZGVyc0pzb247XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tCeUhhc2ggPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgYmxvY2tIYXNoKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tCeUhhc2goYmxvY2tIYXNoKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tzQnlIYXNoID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGJsb2NrSGFzaGVzLCBzdGFydEhlaWdodCwgcHJ1bmUpIHtcbiAgbGV0IGJsb2Nrc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgYmxvY2sgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tzQnlIYXNoKGJsb2NrSGFzaGVzLCBzdGFydEhlaWdodCwgcHJ1bmUpKSBibG9ja3NKc29uLnB1c2goYmxvY2sudG9Kc29uKCkpO1xuICByZXR1cm4gYmxvY2tzSnNvbjtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja0J5SGVpZ2h0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGhlaWdodCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2NrQnlIZWlnaHQoaGVpZ2h0KSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tzQnlIZWlnaHQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgaGVpZ2h0cykge1xuICBsZXQgYmxvY2tzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBibG9jayBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja3NCeUhlaWdodChoZWlnaHRzKSkgYmxvY2tzSnNvbi5wdXNoKGJsb2NrLnRvSnNvbigpKTtcbiAgcmV0dXJuIGJsb2Nrc0pzb247XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tzQnlSYW5nZSA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSB7XG4gIGxldCBibG9ja3NKc29uID0gW107XG4gIGZvciAobGV0IGJsb2NrIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2Nrc0J5UmFuZ2Uoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCkpIGJsb2Nrc0pzb24ucHVzaChibG9jay50b0pzb24oKSk7XG4gIHJldHVybiBibG9ja3NKc29uO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2Nrc0J5UmFuZ2VDaHVua2VkID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIG1heENodW5rU2l6ZSkge1xuICBsZXQgYmxvY2tzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBibG9jayBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja3NCeVJhbmdlQ2h1bmtlZChzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBtYXhDaHVua1NpemUpKSBibG9ja3NKc29uLnB1c2goYmxvY2sudG9Kc29uKCkpO1xuICByZXR1cm4gYmxvY2tzSnNvbjtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja0hhc2hlcyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBibG9ja0hhc2hlcywgc3RhcnRIZWlnaHQpIHtcbiAgdGhyb3cgbmV3IEVycm9yKFwid29ya2VyLmdldEJsb2NrSGFzaGVzIG5vdCBpbXBsZW1lbnRlZFwiKTtcbn1cblxuLy8gVE9ETzogZmFjdG9yIGNvbW1vbiBjb2RlIHdpdGggc2VsZi5nZXRUeHMoKVxuc2VsZi5kYWVtb25HZXRUeHMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgdHhIYXNoZXMsIHBydW5lKSB7XG4gIFxuICAvLyBnZXQgdHhzXG4gIGxldCB0eHMgPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRUeHModHhIYXNoZXMsIHBydW5lKTtcbiAgXG4gIC8vIGNvbGxlY3QgdW5pcXVlIGJsb2NrcyB0byBwcmVzZXJ2ZSBtb2RlbCByZWxhdGlvbnNoaXBzIGFzIHRyZWVzIChiYXNlZCBvbiBtb25lcm9fd2FzbV9icmlkZ2UuY3BwOjpnZXRfdHhzKVxuICBsZXQgYmxvY2tzID0gW107XG4gIGxldCB1bmNvbmZpcm1lZEJsb2NrID0gdW5kZWZpbmVkXG4gIGxldCBzZWVuQmxvY2tzID0gbmV3IFNldCgpO1xuICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICBpZiAoIXR4LmdldEJsb2NrKCkpIHtcbiAgICAgIGlmICghdW5jb25maXJtZWRCbG9jaykgdW5jb25maXJtZWRCbG9jayA9IG5ldyBNb25lcm9CbG9jaygpLnNldFR4cyhbXSk7XG4gICAgICB0eC5zZXRCbG9jayh1bmNvbmZpcm1lZEJsb2NrKTtcbiAgICAgIHVuY29uZmlybWVkQmxvY2suZ2V0VHhzKCkucHVzaCh0eCk7XG4gICAgfVxuICAgIGlmICghc2VlbkJsb2Nrcy5oYXModHguZ2V0QmxvY2soKSkpIHtcbiAgICAgIHNlZW5CbG9ja3MuYWRkKHR4LmdldEJsb2NrKCkpO1xuICAgICAgYmxvY2tzLnB1c2godHguZ2V0QmxvY2soKSk7XG4gICAgfVxuICB9XG4gIFxuICAvLyBzZXJpYWxpemUgYmxvY2tzIHRvIGpzb25cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBibG9ja3MubGVuZ3RoOyBpKyspIGJsb2Nrc1tpXSA9IGJsb2Nrc1tpXS50b0pzb24oKTtcbiAgcmV0dXJuIGJsb2Nrcztcbn1cblxuc2VsZi5kYWVtb25HZXRUeEhleGVzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIHR4SGFzaGVzLCBwcnVuZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0VHhIZXhlcyh0eEhhc2hlcywgcHJ1bmUpO1xufVxuXG5zZWxmLmRhZW1vbkdldE1pbmVyVHhTdW0gPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgaGVpZ2h0LCBudW1CbG9ja3MpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRNaW5lclR4U3VtKGhlaWdodCwgbnVtQmxvY2tzKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0RmVlRXN0aW1hdGUgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgZ3JhY2VCbG9ja3MpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRGZWVFc3RpbWF0ZShncmFjZUJsb2NrcykpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vblN1Ym1pdFR4SGV4ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIHR4SGV4LCBkb05vdFJlbGF5KSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc3VibWl0VHhIZXgodHhIZXgsIGRvTm90UmVsYXkpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25SZWxheVR4c0J5SGFzaCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCB0eEhhc2hlcykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0ucmVsYXlUeHNCeUhhc2godHhIYXNoZXMpO1xufVxuXG5zZWxmLmRhZW1vbkdldFR4UG9vbCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIGxldCB0eHMgPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRUeFBvb2woKTtcbiAgbGV0IGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0VHhzKHR4cyk7XG4gIGZvciAobGV0IHR4IG9mIHR4cykgdHguc2V0QmxvY2soYmxvY2spXG4gIHJldHVybiBibG9jay50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRUeFBvb2xIYXNoZXMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0VHhQb29sSGFzaGVzKCk7XG59XG5cbi8vYXN5bmMgZ2V0VHhQb29sQmFja2xvZygpIHtcbi8vICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4vL31cblxuc2VsZi5kYWVtb25HZXRUeFBvb2xTdGF0cyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0VHhQb29sU3RhdHMoKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uRmx1c2hUeFBvb2wgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgaGFzaGVzKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5mbHVzaFR4UG9vbChoYXNoZXMpO1xufVxuXG5zZWxmLmRhZW1vbkdldEtleUltYWdlU3BlbnRTdGF0dXNlcyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBrZXlJbWFnZXMpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEtleUltYWdlU3BlbnRTdGF0dXNlcyhrZXlJbWFnZXMpO1xufVxuXG4vL1xuLy9hc3luYyBnZXRPdXRwdXRzKG91dHB1dHMpIHtcbi8vICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4vL31cblxuc2VsZi5kYWVtb25HZXRPdXRwdXRIaXN0b2dyYW0gPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgYW1vdW50cywgbWluQ291bnQsIG1heENvdW50LCBpc1VubG9ja2VkLCByZWNlbnRDdXRvZmYpIHtcbiAgbGV0IGVudHJpZXNKc29uID0gW107XG4gIGZvciAobGV0IGVudHJ5IG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldE91dHB1dEhpc3RvZ3JhbShhbW91bnRzLCBtaW5Db3VudCwgbWF4Q291bnQsIGlzVW5sb2NrZWQsIHJlY2VudEN1dG9mZikpIHtcbiAgICBlbnRyaWVzSnNvbi5wdXNoKGVudHJ5LnRvSnNvbigpKTtcbiAgfVxuICByZXR1cm4gZW50cmllc0pzb247XG59XG5cbi8vXG4vL2FzeW5jIGdldE91dHB1dERpc3RyaWJ1dGlvbihhbW91bnRzLCBjdW11bGF0aXZlLCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSB7XG4vLyAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuLy99XG5cbnNlbGYuZGFlbW9uR2V0SW5mbyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0SW5mbygpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRTeW5jSW5mbyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0U3luY0luZm8oKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0SGFyZEZvcmtJbmZvID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRIYXJkRm9ya0luZm8oKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0QWx0Q2hhaW5zID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgbGV0IGFsdENoYWluc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgYWx0Q2hhaW4gb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QWx0Q2hhaW5zKCkpIGFsdENoYWluc0pzb24ucHVzaChhbHRDaGFpbi50b0pzb24oKSk7XG4gIHJldHVybiBhbHRDaGFpbnNKc29uO1xufVxuXG5zZWxmLmRhZW1vbkdldEFsdEJsb2NrSGFzaGVzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEFsdEJsb2NrSGFzaGVzKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0RG93bmxvYWRMaW1pdCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXREb3dubG9hZExpbWl0KCk7XG59XG5cbnNlbGYuZGFlbW9uU2V0RG93bmxvYWRMaW1pdCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBsaW1pdCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc2V0RG93bmxvYWRMaW1pdChsaW1pdCk7XG59XG5cbnNlbGYuZGFlbW9uUmVzZXREb3dubG9hZExpbWl0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnJlc2V0RG93bmxvYWRMaW1pdCgpO1xufVxuXG5zZWxmLmRhZW1vbkdldFVwbG9hZExpbWl0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldFVwbG9hZExpbWl0KCk7XG59XG5cbnNlbGYuZGFlbW9uU2V0VXBsb2FkTGltaXQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgbGltaXQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnNldFVwbG9hZExpbWl0KGxpbWl0KTtcbn1cblxuc2VsZi5kYWVtb25SZXNldFVwbG9hZExpbWl0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnJlc2V0VXBsb2FkTGltaXQoKTtcbn1cblxuc2VsZi5kYWVtb25HZXRQZWVycyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIGxldCBwZWVyc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgcGVlciBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRQZWVycygpKSBwZWVyc0pzb24ucHVzaChwZWVyLnRvSnNvbigpKTtcbiAgcmV0dXJuIHBlZXJzSnNvbjtcbn1cblxuc2VsZi5kYWVtb25HZXRLbm93blBlZXJzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgbGV0IHBlZXJzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBwZWVyIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEtub3duUGVlcnMoKSkgcGVlcnNKc29uLnB1c2gocGVlci50b0pzb24oKSk7XG4gIHJldHVybiBwZWVyc0pzb247XG59XG5cbnNlbGYuZGFlbW9uU2V0T3V0Z29pbmdQZWVyTGltaXQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgbGltaXQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnNldE91dGdvaW5nUGVlckxpbWl0KGxpbWl0KTtcbn1cblxuc2VsZi5kYWVtb25TZXRJbmNvbWluZ1BlZXJMaW1pdCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBsaW1pdCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc2V0SW5jb21pbmdQZWVyTGltaXQobGltaXQpO1xufVxuXG5zZWxmLmRhZW1vbkdldFBlZXJCYW5zID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgbGV0IGJhbnNKc29uID0gW107XG4gIGZvciAobGV0IGJhbiBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRQZWVyQmFucygpKSBiYW5zSnNvbi5wdXNoKGJhbi50b0pzb24oKSk7XG4gIHJldHVybiBiYW5zSnNvbjtcbn1cblxuc2VsZi5kYWVtb25TZXRQZWVyQmFucyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBiYW5zSnNvbikge1xuICBsZXQgYmFucyA9IFtdO1xuICBmb3IgKGxldCBiYW5Kc29uIG9mIGJhbnNKc29uKSBiYW5zLnB1c2gobmV3IE1vbmVyb0JhbihiYW5Kc29uKSk7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5zZXRQZWVyQmFucyhiYW5zKTtcbn1cblxuc2VsZi5kYWVtb25TdGFydE1pbmluZyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBhZGRyZXNzLCBudW1UaHJlYWRzLCBpc0JhY2tncm91bmQsIGlnbm9yZUJhdHRlcnkpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnN0YXJ0TWluaW5nKGFkZHJlc3MsIG51bVRocmVhZHMsIGlzQmFja2dyb3VuZCwgaWdub3JlQmF0dGVyeSk7XG59XG5cbnNlbGYuZGFlbW9uU3RvcE1pbmluZyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5zdG9wTWluaW5nKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0TWluaW5nU3RhdHVzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRNaW5pbmdTdGF0dXMoKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uU3VibWl0QmxvY2tzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGJsb2NrQmxvYnMpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnN1Ym1pdEJsb2NrcyhibG9ja0Jsb2JzKTtcbn1cblxuc2VsZi5kYWVtb25QcnVuZUJsb2NrY2hhaW4gPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgY2hlY2spIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5wcnVuZUJsb2NrY2hhaW4oY2hlY2spKS50b0pzb24oKTtcbn1cblxuLy9hc3luYyBjaGVja0ZvclVwZGF0ZSgpIHtcbi8vICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4vL31cbi8vXG4vL2FzeW5jIGRvd25sb2FkVXBkYXRlKHBhdGgpIHtcbi8vICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4vL31cblxuc2VsZi5kYWVtb25TdG9wID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnN0b3AoKTtcbn1cblxuc2VsZi5kYWVtb25XYWl0Rm9yTmV4dEJsb2NrSGVhZGVyID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS53YWl0Rm9yTmV4dEJsb2NrSGVhZGVyKCkpLnRvSnNvbigpO1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBXQUxMRVQgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnNlbGYub3BlbldhbGxldERhdGEgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgcGF0aCwgcGFzc3dvcmQsIG5ldHdvcmtUeXBlLCBrZXlzRGF0YSwgY2FjaGVEYXRhLCBkYWVtb25VcmlPckNvbmZpZykge1xuICBsZXQgZGFlbW9uQ29ubmVjdGlvbiA9IGRhZW1vblVyaU9yQ29uZmlnID8gbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24oZGFlbW9uVXJpT3JDb25maWcpIDogdW5kZWZpbmVkO1xuICBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXSA9IGF3YWl0IE1vbmVyb1dhbGxldEZ1bGwub3BlbldhbGxldCh7cGF0aDogXCJcIiwgcGFzc3dvcmQ6IHBhc3N3b3JkLCBuZXR3b3JrVHlwZTogbmV0d29ya1R5cGUsIGtleXNEYXRhOiBrZXlzRGF0YSwgY2FjaGVEYXRhOiBjYWNoZURhdGEsIHNlcnZlcjogZGFlbW9uQ29ubmVjdGlvbiwgcHJveHlUb1dvcmtlcjogZmFsc2V9KTtcbiAgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2V0QnJvd3Nlck1haW5QYXRoKHBhdGgpO1xufVxuXG5zZWxmLmNyZWF0ZVdhbGxldEtleXMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgY29uZmlnSnNvbikge1xuICBsZXQgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyhjb25maWdKc29uKTtcbiAgY29uZmlnLnNldFByb3h5VG9Xb3JrZXIoZmFsc2UpO1xuICBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXSA9IGF3YWl0IE1vbmVyb1dhbGxldEtleXMuY3JlYXRlV2FsbGV0KGNvbmZpZyk7XG59XG5cbnNlbGYuY3JlYXRlV2FsbGV0RnVsbCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBjb25maWdKc29uKSB7XG4gIGxldCBjb25maWcgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKGNvbmZpZ0pzb24pO1xuICBsZXQgcGF0aCA9IGNvbmZpZy5nZXRQYXRoKCk7XG4gIGNvbmZpZy5zZXRQYXRoKFwiXCIpO1xuICBjb25maWcuc2V0UHJveHlUb1dvcmtlcihmYWxzZSk7XG4gIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdID0gYXdhaXQgTW9uZXJvV2FsbGV0RnVsbC5jcmVhdGVXYWxsZXQoY29uZmlnKTtcbiAgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2V0QnJvd3Nlck1haW5QYXRoKHBhdGgpO1xufVxuXG5zZWxmLmlzVmlld09ubHkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaXNWaWV3T25seSgpO1xufVxuXG5zZWxmLmdldE5ldHdvcmtUeXBlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldE5ldHdvcmtUeXBlKCk7XG59XG5cbi8vXG4vL2FzeW5jIGdldFZlcnNpb24oKSB7XG4vLyAgdGhyb3cgbmV3IEVycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuLy99XG5cbnNlbGYuZ2V0U2VlZCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRTZWVkKCk7XG59XG5cbnNlbGYuZ2V0U2VlZExhbmd1YWdlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFNlZWRMYW5ndWFnZSgpO1xufVxuXG5zZWxmLmdldFNlZWRMYW5ndWFnZXMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0U2VlZExhbmd1YWdlcygpO1xufVxuXG5zZWxmLmdldFByaXZhdGVTcGVuZEtleSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRQcml2YXRlU3BlbmRLZXkoKTtcbn1cblxuc2VsZi5nZXRQcml2YXRlVmlld0tleSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRQcml2YXRlVmlld0tleSgpO1xufVxuXG5zZWxmLmdldFB1YmxpY1ZpZXdLZXkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0UHVibGljVmlld0tleSgpO1xufVxuXG5zZWxmLmdldFB1YmxpY1NwZW5kS2V5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFB1YmxpY1NwZW5kS2V5KCk7XG59XG5cbnNlbGYuZ2V0QWRkcmVzcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRBZGRyZXNzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpO1xufVxuXG5zZWxmLmdldEFkZHJlc3NJbmRleCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhZGRyZXNzKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0QWRkcmVzc0luZGV4KGFkZHJlc3MpKS50b0pzb24oKTtcbn1cblxuc2VsZi5zZXRTdWJhZGRyZXNzTGFiZWwgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCwgbGFiZWwpIHtcbiAgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2V0U3ViYWRkcmVzc0xhYmVsKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIGxhYmVsKTtcbn1cblxuc2VsZi5nZXRJbnRlZ3JhdGVkQWRkcmVzcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBzdGFuZGFyZEFkZHJlc3MsIHBheW1lbnRJZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldEludGVncmF0ZWRBZGRyZXNzKHN0YW5kYXJkQWRkcmVzcywgcGF5bWVudElkKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgaW50ZWdyYXRlZEFkZHJlc3MpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5kZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyhpbnRlZ3JhdGVkQWRkcmVzcykpLnRvSnNvbigpO1xufVxuXG5zZWxmLnNldERhZW1vbkNvbm5lY3Rpb24gPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgY29uZmlnLCBpc1RydXN0ZWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnNldERhZW1vbkNvbm5lY3Rpb24oY29uZmlnID8gbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24oT2JqZWN0LmFzc2lnbihjb25maWcsIHtwcm94eVRvV29ya2VyOiBmYWxzZX0pKSA6IHVuZGVmaW5lZCwgaXNUcnVzdGVkKTtcbn1cblxuc2VsZi5nZXREYWVtb25Db25uZWN0aW9uID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgbGV0IGNvbm5lY3Rpb24gPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXREYWVtb25Db25uZWN0aW9uKCk7XG4gIHJldHVybiBjb25uZWN0aW9uID8gY29ubmVjdGlvbi5nZXRDb25maWcoKSA6IHVuZGVmaW5lZDtcbn1cblxuc2VsZi5pc0RhZW1vblRydXN0ZWQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaXNEYWVtb25UcnVzdGVkKCk7XG59XG5cbnNlbGYuaXNDb25uZWN0ZWRUb0RhZW1vbiA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pc0Nvbm5lY3RlZFRvRGFlbW9uKCk7XG59XG5cbnNlbGYuZ2V0UmVzdG9yZUhlaWdodCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRSZXN0b3JlSGVpZ2h0KCk7XG59XG5cbnNlbGYuc2V0UmVzdG9yZUhlaWdodCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCByZXN0b3JlSGVpZ2h0KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zZXRSZXN0b3JlSGVpZ2h0KHJlc3RvcmVIZWlnaHQpO1xufVxuXG5zZWxmLmdldERhZW1vbkhlaWdodCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXREYWVtb25IZWlnaHQoKTtcbn1cblxuc2VsZi5nZXREYWVtb25NYXhQZWVySGVpZ2h0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldERhZW1vbk1heFBlZXJIZWlnaHQoKVxufVxuXG5zZWxmLmdldEhlaWdodEJ5RGF0ZSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB5ZWFyLCBtb250aCwgZGF5KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRIZWlnaHRCeURhdGUoeWVhciwgbW9udGgsIGRheSk7XG59XG5cbnNlbGYuaXNEYWVtb25TeW5jZWQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaXNEYWVtb25TeW5jZWQoKTtcbn1cblxuc2VsZi5nZXRIZWlnaHQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0SGVpZ2h0KCk7XG59XG5cbnNlbGYuYWRkTGlzdGVuZXIgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbGlzdGVuZXJJZCkge1xuICBcbiAgLyoqXG4gICAqIEludGVybmFsIGxpc3RlbmVyIHRvIGJyaWRnZSBub3RpZmljYXRpb25zIHRvIGV4dGVybmFsIGxpc3RlbmVycy5cbiAgICogXG4gICAqIFRPRE86IE1vbmVyb1dhbGxldExpc3RlbmVyIGlzIG5vdCBkZWZpbmVkIHVudGlsIHNjcmlwdHMgaW1wb3J0ZWRcbiAgICogXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBjbGFzcyBXYWxsZXRXb3JrZXJIZWxwZXJMaXN0ZW5lciBleHRlbmRzIE1vbmVyb1dhbGxldExpc3RlbmVyIHtcblxuICAgIHByb3RlY3RlZCB3YWxsZXRJZDogc3RyaW5nO1xuICAgIHByb3RlY3RlZCBpZDogc3RyaW5nO1xuICAgIHByb3RlY3RlZCB3b3JrZXI6IFdvcmtlcjtcbiAgICBcbiAgICBjb25zdHJ1Y3Rvcih3YWxsZXRJZCwgaWQsIHdvcmtlcikge1xuICAgICAgc3VwZXIoKTtcbiAgICAgIHRoaXMud2FsbGV0SWQgPSB3YWxsZXRJZDtcbiAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICAgIHRoaXMud29ya2VyID0gd29ya2VyO1xuICAgIH1cbiAgICBcbiAgICBnZXRJZCgpIHtcbiAgICAgIHJldHVybiB0aGlzLmlkO1xuICAgIH1cbiAgICBcbiAgICBhc3luYyBvblN5bmNQcm9ncmVzcyhoZWlnaHQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIHBlcmNlbnREb25lLCBtZXNzYWdlKSB7XG4gICAgICB0aGlzLndvcmtlci5wb3N0TWVzc2FnZShbdGhpcy53YWxsZXRJZCwgXCJvblN5bmNQcm9ncmVzc19cIiArIHRoaXMuZ2V0SWQoKSwgaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZV0pO1xuICAgIH1cblxuICAgIGFzeW5jIG9uTmV3QmxvY2soaGVpZ2h0KSB7IFxuICAgICAgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2UoW3RoaXMud2FsbGV0SWQsIFwib25OZXdCbG9ja19cIiArIHRoaXMuZ2V0SWQoKSwgaGVpZ2h0XSk7XG4gICAgfVxuICAgIFxuICAgIGFzeW5jIG9uQmFsYW5jZXNDaGFuZ2VkKG5ld0JhbGFuY2UsIG5ld1VubG9ja2VkQmFsYW5jZSkge1xuICAgICAgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2UoW3RoaXMud2FsbGV0SWQsIFwib25CYWxhbmNlc0NoYW5nZWRfXCIgKyB0aGlzLmdldElkKCksIG5ld0JhbGFuY2UudG9TdHJpbmcoKSwgbmV3VW5sb2NrZWRCYWxhbmNlLnRvU3RyaW5nKCldKTtcbiAgICB9XG5cbiAgIGFzeW5jIG9uT3V0cHV0UmVjZWl2ZWQob3V0cHV0KSB7XG4gICAgICBsZXQgYmxvY2sgPSBvdXRwdXQuZ2V0VHgoKS5nZXRCbG9jaygpO1xuICAgICAgaWYgKGJsb2NrID09PSB1bmRlZmluZWQpIGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0VHhzKFtvdXRwdXQuZ2V0VHgoKV0pO1xuICAgICAgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2UoW3RoaXMud2FsbGV0SWQsIFwib25PdXRwdXRSZWNlaXZlZF9cIiArIHRoaXMuZ2V0SWQoKSwgYmxvY2sudG9Kc29uKCldKTsgIC8vIHNlcmlhbGl6ZSBmcm9tIHJvb3QgYmxvY2tcbiAgICB9XG4gICAgXG4gICAgYXN5bmMgb25PdXRwdXRTcGVudChvdXRwdXQpIHtcbiAgICAgIGxldCBibG9jayA9IG91dHB1dC5nZXRUeCgpLmdldEJsb2NrKCk7XG4gICAgICBpZiAoYmxvY2sgPT09IHVuZGVmaW5lZCkgYmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soKS5zZXRUeHMoW291dHB1dC5nZXRUeCgpXSk7XG4gICAgICB0aGlzLndvcmtlci5wb3N0TWVzc2FnZShbdGhpcy53YWxsZXRJZCwgXCJvbk91dHB1dFNwZW50X1wiICsgdGhpcy5nZXRJZCgpLCBibG9jay50b0pzb24oKV0pOyAgICAgLy8gc2VyaWFsaXplIGZyb20gcm9vdCBibG9ja1xuICAgIH1cbiAgfVxuICBcbiAgbGV0IGxpc3RlbmVyID0gbmV3IFdhbGxldFdvcmtlckhlbHBlckxpc3RlbmVyKHdhbGxldElkLCBsaXN0ZW5lcklkLCBzZWxmKTtcbiAgaWYgKCFzZWxmLmxpc3RlbmVycykgc2VsZi5saXN0ZW5lcnMgPSBbXTtcbiAgc2VsZi5saXN0ZW5lcnMucHVzaChsaXN0ZW5lcik7XG4gIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbn1cblxuc2VsZi5yZW1vdmVMaXN0ZW5lciA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBsaXN0ZW5lcklkKSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZi5saXN0ZW5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoc2VsZi5saXN0ZW5lcnNbaV0uZ2V0SWQoKSAhPT0gbGlzdGVuZXJJZCkgY29udGludWU7XG4gICAgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0ucmVtb3ZlTGlzdGVuZXIoc2VsZi5saXN0ZW5lcnNbaV0pO1xuICAgIHNlbGYubGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICByZXR1cm47XG4gIH1cbiAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTGlzdGVuZXIgaXMgbm90IHJlZ2lzdGVyZWQgd2l0aCB3YWxsZXRcIik7XG59XG5cbnNlbGYuaXNTeW5jZWQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaXNTeW5jZWQoKTtcbn1cblxuc2VsZi5zeW5jID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHN0YXJ0SGVpZ2h0LCBhbGxvd0NvbmN1cnJlbnRDYWxscykge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN5bmModW5kZWZpbmVkLCBzdGFydEhlaWdodCwgYWxsb3dDb25jdXJyZW50Q2FsbHMpKTtcbn1cblxuc2VsZi5zdGFydFN5bmNpbmcgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgc3luY1BlcmlvZEluTXMpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN0YXJ0U3luY2luZyhzeW5jUGVyaW9kSW5Ncyk7XG59XG5cbnNlbGYuc3RvcFN5bmNpbmcgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc3RvcFN5bmNpbmcoKTtcbn1cblxuc2VsZi5zY2FuVHhzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaGVzKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zY2FuVHhzKHR4SGFzaGVzKTtcbn1cblxuc2VsZi5yZXNjYW5TcGVudCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5yZXNjYW5TcGVudCgpO1xufVxuXG5zZWxmLnJlc2NhbkJsb2NrY2hhaW4gPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0ucmVzY2FuQmxvY2tjaGFpbigpO1xufVxuXG5zZWxmLmdldEJhbGFuY2UgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldEJhbGFuY2UoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkpLnRvU3RyaW5nKCk7XG59XG5cbnNlbGYuZ2V0VW5sb2NrZWRCYWxhbmNlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRVbmxvY2tlZEJhbGFuY2UoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkpLnRvU3RyaW5nKCk7XG59XG5cbnNlbGYuZ2V0QWNjb3VudHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgaW5jbHVkZVN1YmFkZHJlc3NlcywgdGFnKSB7XG4gIGxldCBhY2NvdW50SnNvbnMgPSBbXTtcbiAgZm9yIChsZXQgYWNjb3VudCBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRBY2NvdW50cyhpbmNsdWRlU3ViYWRkcmVzc2VzLCB0YWcpKSBhY2NvdW50SnNvbnMucHVzaChhY2NvdW50LnRvSnNvbigpKTtcbiAgcmV0dXJuIGFjY291bnRKc29ucztcbn1cblxuc2VsZi5nZXRBY2NvdW50ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFjY291bnRJZHgsIGluY2x1ZGVTdWJhZGRyZXNzZXMpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRBY2NvdW50KGFjY291bnRJZHgsIGluY2x1ZGVTdWJhZGRyZXNzZXMpKS50b0pzb24oKTtcbn1cblxuc2VsZi5jcmVhdGVBY2NvdW50ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGxhYmVsKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uY3JlYXRlQWNjb3VudChsYWJlbCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmdldFN1YmFkZHJlc3NlcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSW5kaWNlcykge1xuICBsZXQgc3ViYWRkcmVzc0pzb25zID0gW107XG4gIGZvciAobGV0IHN1YmFkZHJlc3Mgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJbmRpY2VzKSkgc3ViYWRkcmVzc0pzb25zLnB1c2goc3ViYWRkcmVzcy50b0pzb24oKSk7XG4gIHJldHVybiBzdWJhZGRyZXNzSnNvbnM7XG59XG5cbnNlbGYuY3JlYXRlU3ViYWRkcmVzcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SWR4LCBsYWJlbCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmNyZWF0ZVN1YmFkZHJlc3MoYWNjb3VudElkeCwgbGFiZWwpKS50b0pzb24oKTtcbn1cblxuLy8gVE9ETzogZWFzaWVyIG9yIG1vcmUgZWZmaWNpZW50IHdheSB0aGFuIHNlcmlhbGl6aW5nIGZyb20gcm9vdCBibG9ja3M/XG5zZWxmLmdldFR4cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBibG9ja0pzb25RdWVyeSkge1xuICBcbiAgLy8gZGVzZXJpYWxpemUgcXVlcnkgd2hpY2ggaXMganNvbiBzdHJpbmcgcm9vdGVkIGF0IGJsb2NrXG4gIGxldCBxdWVyeSA9IG5ldyBNb25lcm9CbG9jayhibG9ja0pzb25RdWVyeSwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWF9RVUVSWSkuZ2V0VHhzKClbMF07XG4gIFxuICAvLyBnZXQgdHhzXG4gIGxldCB0eHMgPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRUeHMocXVlcnkpO1xuICBcbiAgLy8gY29sbGVjdCB1bmlxdWUgYmxvY2tzIHRvIHByZXNlcnZlIG1vZGVsIHJlbGF0aW9uc2hpcHMgYXMgdHJlZXMgKGJhc2VkIG9uIG1vbmVyb193YXNtX2JyaWRnZS5jcHA6OmdldF90eHMpXG4gIGxldCBzZWVuQmxvY2tzID0gbmV3IFNldCgpO1xuICBsZXQgdW5jb25maXJtZWRCbG9jayA9IHVuZGVmaW5lZDtcbiAgbGV0IGJsb2NrcyA9IFtdO1xuICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICBpZiAoIXR4LmdldEJsb2NrKCkpIHtcbiAgICAgIGlmICghdW5jb25maXJtZWRCbG9jaykgdW5jb25maXJtZWRCbG9jayA9IG5ldyBNb25lcm9CbG9jaygpLnNldFR4cyhbXSk7XG4gICAgICB0eC5zZXRCbG9jayh1bmNvbmZpcm1lZEJsb2NrKTtcbiAgICAgIHVuY29uZmlybWVkQmxvY2suZ2V0VHhzKCkucHVzaCh0eCk7XG4gICAgfVxuICAgIGlmICghc2VlbkJsb2Nrcy5oYXModHguZ2V0QmxvY2soKSkpIHtcbiAgICAgIHNlZW5CbG9ja3MuYWRkKHR4LmdldEJsb2NrKCkpO1xuICAgICAgYmxvY2tzLnB1c2godHguZ2V0QmxvY2soKSk7XG4gICAgfVxuICB9XG4gIFxuICAvLyBzZXJpYWxpemUgYmxvY2tzIHRvIGpzb25cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBibG9ja3MubGVuZ3RoOyBpKyspIGJsb2Nrc1tpXSA9IGJsb2Nrc1tpXS50b0pzb24oKTtcbiAgcmV0dXJuIHtibG9ja3M6IGJsb2Nrc307XG59XG5cbnNlbGYuZ2V0VHJhbnNmZXJzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGJsb2NrSnNvblF1ZXJ5KSB7XG4gIFxuICAvLyBkZXNlcmlhbGl6ZSBxdWVyeSB3aGljaCBpcyBqc29uIHN0cmluZyByb290ZWQgYXQgYmxvY2tcbiAgbGV0IHF1ZXJ5ID0gKG5ldyBNb25lcm9CbG9jayhibG9ja0pzb25RdWVyeSwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWF9RVUVSWSkuZ2V0VHhzKClbMF0gYXMgTW9uZXJvVHhRdWVyeSkuZ2V0VHJhbnNmZXJRdWVyeSgpO1xuICBcbiAgLy8gZ2V0IHRyYW5zZmVyc1xuICBsZXQgdHJhbnNmZXJzID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0VHJhbnNmZXJzKHF1ZXJ5KTtcbiAgXG4gIC8vIGNvbGxlY3QgdW5pcXVlIGJsb2NrcyB0byBwcmVzZXJ2ZSBtb2RlbCByZWxhdGlvbnNoaXBzIGFzIHRyZWVcbiAgbGV0IHVuY29uZmlybWVkQmxvY2sgPSB1bmRlZmluZWQ7XG4gIGxldCBibG9ja3MgPSBbXTtcbiAgbGV0IHNlZW5CbG9ja3MgPSBuZXcgU2V0KCk7XG4gIGZvciAobGV0IHRyYW5zZmVyIG9mIHRyYW5zZmVycykge1xuICAgIGxldCB0eCA9IHRyYW5zZmVyLmdldFR4KCk7XG4gICAgaWYgKCF0eC5nZXRCbG9jaygpKSB7XG4gICAgICBpZiAoIXVuY29uZmlybWVkQmxvY2spIHVuY29uZmlybWVkQmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soKS5zZXRUeHMoW10pO1xuICAgICAgdHguc2V0QmxvY2sodW5jb25maXJtZWRCbG9jayk7XG4gICAgICB1bmNvbmZpcm1lZEJsb2NrLmdldFR4cygpLnB1c2godHgpO1xuICAgIH1cbiAgICBpZiAoIXNlZW5CbG9ja3MuaGFzKHR4LmdldEJsb2NrKCkpKSB7XG4gICAgICBzZWVuQmxvY2tzLmFkZCh0eC5nZXRCbG9jaygpKTtcbiAgICAgIGJsb2Nrcy5wdXNoKHR4LmdldEJsb2NrKCkpO1xuICAgIH1cbiAgfVxuICBcbiAgLy8gc2VyaWFsaXplIGJsb2NrcyB0byBqc29uXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYmxvY2tzLmxlbmd0aDsgaSsrKSBibG9ja3NbaV0gPSBibG9ja3NbaV0udG9Kc29uKCk7XG4gIHJldHVybiBibG9ja3M7XG59XG5cbnNlbGYuZ2V0T3V0cHV0cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBibG9ja0pzb25RdWVyeSkge1xuXG4gIC8vIGRlc2VyaWFsaXplIHF1ZXJ5IHdoaWNoIGlzIGpzb24gc3RyaW5nIHJvb3RlZCBhdCBibG9ja1xuICBsZXQgcXVlcnkgPSAobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvblF1ZXJ5LCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYX1FVRVJZKS5nZXRUeHMoKVswXSBhcyBNb25lcm9UeFF1ZXJ5KS5nZXRPdXRwdXRRdWVyeSgpO1xuICBcbiAgLy8gZ2V0IG91dHB1dHNcbiAgbGV0IG91dHB1dHMgPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRPdXRwdXRzKHF1ZXJ5KTtcbiAgXG4gIC8vIGNvbGxlY3QgdW5pcXVlIGJsb2NrcyB0byBwcmVzZXJ2ZSBtb2RlbCByZWxhdGlvbnNoaXBzIGFzIHRyZWVcbiAgbGV0IHVuY29uZmlybWVkQmxvY2sgPSB1bmRlZmluZWQ7XG4gIGxldCBibG9ja3MgPSBbXTtcbiAgbGV0IHNlZW5CbG9ja3MgPSBuZXcgU2V0KCk7XG4gIGZvciAobGV0IG91dHB1dCBvZiBvdXRwdXRzKSB7XG4gICAgbGV0IHR4ID0gb3V0cHV0LmdldFR4KCk7XG4gICAgaWYgKCF0eC5nZXRCbG9jaygpKSB7XG4gICAgICBpZiAoIXVuY29uZmlybWVkQmxvY2spIHVuY29uZmlybWVkQmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soKS5zZXRUeHMoW10pO1xuICAgICAgdHguc2V0QmxvY2sodW5jb25maXJtZWRCbG9jayk7XG4gICAgICB1bmNvbmZpcm1lZEJsb2NrLmdldFR4cygpLnB1c2godHgpO1xuICAgIH1cbiAgICBpZiAoIXNlZW5CbG9ja3MuaGFzKHR4LmdldEJsb2NrKCkpKSB7XG4gICAgICBzZWVuQmxvY2tzLmFkZCh0eC5nZXRCbG9jaygpKTtcbiAgICAgIGJsb2Nrcy5wdXNoKHR4LmdldEJsb2NrKCkpO1xuICAgIH1cbiAgfVxuICBcbiAgLy8gc2VyaWFsaXplIGJsb2NrcyB0byBqc29uXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYmxvY2tzLmxlbmd0aDsgaSsrKSBibG9ja3NbaV0gPSBibG9ja3NbaV0udG9Kc29uKCk7XG4gIHJldHVybiBibG9ja3M7XG59XG5cbnNlbGYuZXhwb3J0T3V0cHV0cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhbGwpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmV4cG9ydE91dHB1dHMoYWxsKTtcbn1cblxuc2VsZi5pbXBvcnRPdXRwdXRzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG91dHB1dHNIZXgpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmltcG9ydE91dHB1dHMob3V0cHV0c0hleCk7XG59XG5cbnNlbGYuZ2V0S2V5SW1hZ2VzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFsbCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmV4cG9ydEtleUltYWdlcyhhbGwpKS50b0pzb24oKTtcbn1cblxuc2VsZi5pbXBvcnRLZXlJbWFnZXMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwga2V5SW1hZ2VzSnNvbiwgb2Zmc2V0KSB7XG4gIGxldCBrZXlJbWFnZXMgPSBbXTtcbiAgZm9yIChsZXQga2V5SW1hZ2VKc29uIG9mIGtleUltYWdlc0pzb24pIGtleUltYWdlcy5wdXNoKG5ldyBNb25lcm9LZXlJbWFnZShrZXlJbWFnZUpzb24pKTtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pbXBvcnRLZXlJbWFnZXMoa2V5SW1hZ2VzLCBvZmZzZXQpKS50b0pzb24oKTtcbn1cblxuLy9hc3luYyBnZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCgpIHtcbi8vICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4vL31cblxuc2VsZi5mcmVlemVPdXRwdXQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwga2V5SW1hZ2UpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmZyZWV6ZU91dHB1dChrZXlJbWFnZSk7XG59XG5cbnNlbGYudGhhd091dHB1dCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBrZXlJbWFnZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0udGhhd091dHB1dChrZXlJbWFnZSk7XG59XG5cbnNlbGYuaXNPdXRwdXRGcm96ZW4gPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwga2V5SW1hZ2UpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmlzT3V0cHV0RnJvemVuKGtleUltYWdlKTtcbn1cblxuc2VsZi5nZXREZWZhdWx0RmVlUHJpb3JpdHkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0RGVmYXVsdEZlZVByaW9yaXR5KCk7XG59XG5cbnNlbGYuY3JlYXRlVHhzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGNvbmZpZykge1xuICBpZiAodHlwZW9mIGNvbmZpZyA9PT0gXCJvYmplY3RcIikgY29uZmlnID0gbmV3IE1vbmVyb1R4Q29uZmlnKGNvbmZpZyk7XG4gIGxldCB0eHMgPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jcmVhdGVUeHMoY29uZmlnKTtcbiAgcmV0dXJuIHR4c1swXS5nZXRUeFNldCgpLnRvSnNvbigpO1xufVxuXG5zZWxmLnN3ZWVwT3V0cHV0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGNvbmZpZykge1xuICBpZiAodHlwZW9mIGNvbmZpZyA9PT0gXCJvYmplY3RcIikgY29uZmlnID0gbmV3IE1vbmVyb1R4Q29uZmlnKGNvbmZpZyk7XG4gIGxldCB0eCA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN3ZWVwT3V0cHV0KGNvbmZpZyk7XG4gIHJldHVybiB0eC5nZXRUeFNldCgpLnRvSnNvbigpO1xufVxuXG5zZWxmLnN3ZWVwVW5sb2NrZWQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgY29uZmlnKSB7XG4gIGlmICh0eXBlb2YgY29uZmlnID09PSBcIm9iamVjdFwiKSBjb25maWcgPSBuZXcgTW9uZXJvVHhDb25maWcoY29uZmlnKTtcbiAgbGV0IHR4cyA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN3ZWVwVW5sb2NrZWQoY29uZmlnKTtcbiAgbGV0IHR4U2V0cyA9IFtdO1xuICBmb3IgKGxldCB0eCBvZiB0eHMpIGlmICghR2VuVXRpbHMuYXJyYXlDb250YWlucyh0eFNldHMsIHR4LmdldFR4U2V0KCkpKSB0eFNldHMucHVzaCh0eC5nZXRUeFNldCgpKTtcbiAgbGV0IHR4U2V0c0pzb24gPSBbXTtcbiAgZm9yIChsZXQgdHhTZXQgb2YgdHhTZXRzKSB0eFNldHNKc29uLnB1c2godHhTZXQudG9Kc29uKCkpO1xuICByZXR1cm4gdHhTZXRzSnNvbjtcbn1cblxuc2VsZi5zd2VlcER1c3QgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgcmVsYXkpIHtcbiAgbGV0IHR4cyA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN3ZWVwRHVzdChyZWxheSk7XG4gIHJldHVybiB0eHMubGVuZ3RoID09PSAwID8ge30gOiB0eHNbMF0uZ2V0VHhTZXQoKS50b0pzb24oKTtcbn1cblxuc2VsZi5yZWxheVR4cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eE1ldGFkYXRhcykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0ucmVsYXlUeHModHhNZXRhZGF0YXMpO1xufVxuXG5zZWxmLmRlc2NyaWJlVHhTZXQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdHhTZXRKc29uKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZGVzY3JpYmVUeFNldChuZXcgTW9uZXJvVHhTZXQodHhTZXRKc29uKSkpLnRvSnNvbigpO1xufVxuXG5zZWxmLnNpZ25UeHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdW5zaWduZWRUeEhleCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2lnblR4cyh1bnNpZ25lZFR4SGV4KTtcbn1cblxuc2VsZi5zdWJtaXRUeHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgc2lnbmVkVHhIZXgpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN1Ym1pdFR4cyhzaWduZWRUeEhleCk7XG59XG5cbnNlbGYuc2lnbk1lc3NhZ2UgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbWVzc2FnZSwgc2lnbmF0dXJlVHlwZSwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2lnbk1lc3NhZ2UobWVzc2FnZSwgc2lnbmF0dXJlVHlwZSwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG59XG5cbnNlbGYudmVyaWZ5TWVzc2FnZSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBtZXNzYWdlLCBhZGRyZXNzLCBzaWduYXR1cmUpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS52ZXJpZnlNZXNzYWdlKG1lc3NhZ2UsIGFkZHJlc3MsIHNpZ25hdHVyZSkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmdldFR4S2V5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0VHhLZXkodHhIYXNoKTtcbn1cblxuc2VsZi5jaGVja1R4S2V5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaCwgdHhLZXksIGFkZHJlc3MpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jaGVja1R4S2V5KHR4SGFzaCwgdHhLZXksIGFkZHJlc3MpKS50b0pzb24oKTtcbn1cblxuc2VsZi5nZXRUeFByb29mID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaCwgYWRkcmVzcywgbWVzc2FnZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0VHhQcm9vZih0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UpO1xufVxuXG5zZWxmLmNoZWNrVHhQcm9vZiA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmNoZWNrVHhQcm9vZih0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmdldFNwZW5kUHJvb2YgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdHhIYXNoLCBtZXNzYWdlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRTcGVuZFByb29mKHR4SGFzaCwgbWVzc2FnZSk7XG59XG5cbnNlbGYuY2hlY2tTcGVuZFByb29mID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaCwgbWVzc2FnZSwgc2lnbmF0dXJlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jaGVja1NwZW5kUHJvb2YodHhIYXNoLCBtZXNzYWdlLCBzaWduYXR1cmUpO1xufVxuXG5zZWxmLmdldFJlc2VydmVQcm9vZldhbGxldCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBtZXNzYWdlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRSZXNlcnZlUHJvb2ZXYWxsZXQobWVzc2FnZSk7XG59XG5cbnNlbGYuZ2V0UmVzZXJ2ZVByb29mQWNjb3VudCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SWR4LCBhbW91bnRTdHIsIG1lc3NhZ2UpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFJlc2VydmVQcm9vZkFjY291bnQoYWNjb3VudElkeCwgYW1vdW50U3RyLCBtZXNzYWdlKTtcbn1cblxuc2VsZi5jaGVja1Jlc2VydmVQcm9vZiA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jaGVja1Jlc2VydmVQcm9vZihhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUpKS50b0pzb24oKTtcbn1cblxuc2VsZi5nZXRUeE5vdGVzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaGVzKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRUeE5vdGVzKHR4SGFzaGVzKTtcbn1cblxuc2VsZi5zZXRUeE5vdGVzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaGVzLCB0eE5vdGVzKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zZXRUeE5vdGVzKHR4SGFzaGVzLCB0eE5vdGVzKTtcbn1cblxuc2VsZi5nZXRBZGRyZXNzQm9va0VudHJpZXMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgZW50cnlJbmRpY2VzKSB7XG4gIGxldCBlbnRyaWVzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBlbnRyeSBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRBZGRyZXNzQm9va0VudHJpZXMoZW50cnlJbmRpY2VzKSkgZW50cmllc0pzb24ucHVzaChlbnRyeS50b0pzb24oKSk7XG4gIHJldHVybiBlbnRyaWVzSnNvbjtcbn1cblxuc2VsZi5hZGRBZGRyZXNzQm9va0VudHJ5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFkZHJlc3MsIGRlc2NyaXB0aW9uKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5hZGRBZGRyZXNzQm9va0VudHJ5KGFkZHJlc3MsIGRlc2NyaXB0aW9uKTtcbn1cblxuc2VsZi5lZGl0QWRkcmVzc0Jvb2tFbnRyeSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBpbmRleCwgc2V0QWRkcmVzcywgYWRkcmVzcywgc2V0RGVzY3JpcHRpb24sIGRlc2NyaXB0aW9uKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5lZGl0QWRkcmVzc0Jvb2tFbnRyeShpbmRleCwgc2V0QWRkcmVzcywgYWRkcmVzcywgc2V0RGVzY3JpcHRpb24sIGRlc2NyaXB0aW9uKTtcbn1cblxuc2VsZi5kZWxldGVBZGRyZXNzQm9va0VudHJ5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGluZGV4KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5kZWxldGVBZGRyZXNzQm9va0VudHJ5KGluZGV4KTtcbn1cblxuc2VsZi50YWdBY2NvdW50cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0YWcsIGFjY291bnRJbmRpY2VzKSB7XG4gIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbn1cblxuc2VsZi51bnRhZ0FjY291bnRzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFjY291bnRJbmRpY2VzKSB7XG4gIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbn1cblxuc2VsZi5nZXRBY2NvdW50VGFncyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbn1cblxuc2VsZi5zZXRBY2NvdW50VGFnTGFiZWwgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdGFnLCBsYWJlbCkge1xuICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG59XG5cbnNlbGYuZ2V0UGF5bWVudFVyaSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBjb25maWdKc29uKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRQYXltZW50VXJpKG5ldyBNb25lcm9UeENvbmZpZyhjb25maWdKc29uKSk7XG59XG5cbnNlbGYucGFyc2VQYXltZW50VXJpID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHVyaSkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnBhcnNlUGF5bWVudFVyaSh1cmkpKS50b0pzb24oKTtcbn1cblxuc2VsZi5nZXRBdHRyaWJ1dGUgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwga2V5KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRBdHRyaWJ1dGUoa2V5KTtcbn1cblxuc2VsZi5zZXRBdHRyaWJ1dGUgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwga2V5LCB2YWx1ZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpO1xufVxuXG5zZWxmLnN0YXJ0TWluaW5nID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG51bVRocmVhZHMsIGJhY2tncm91bmRNaW5pbmcsIGlnbm9yZUJhdHRlcnkpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN0YXJ0TWluaW5nKG51bVRocmVhZHMsIGJhY2tncm91bmRNaW5pbmcsIGlnbm9yZUJhdHRlcnkpO1xufVxuXG5zZWxmLnN0b3BNaW5pbmcgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc3RvcE1pbmluZygpO1xufVxuXG5zZWxmLmlzTXVsdGlzaWdJbXBvcnROZWVkZWQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCgpO1xufVxuXG5zZWxmLmlzTXVsdGlzaWcgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaXNNdWx0aXNpZygpO1xufVxuXG5zZWxmLmdldE11bHRpc2lnSW5mbyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0TXVsdGlzaWdJbmZvKCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLnByZXBhcmVNdWx0aXNpZyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5wcmVwYXJlTXVsdGlzaWcoKTtcbn1cblxuc2VsZi5tYWtlTXVsdGlzaWcgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbXVsdGlzaWdIZXhlcywgdGhyZXNob2xkLCBwYXNzd29yZCkge1xuICByZXR1cm4gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0ubWFrZU11bHRpc2lnKG11bHRpc2lnSGV4ZXMsIHRocmVzaG9sZCwgcGFzc3dvcmQpO1xufVxuXG5zZWxmLmV4Y2hhbmdlTXVsdGlzaWdLZXlzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG11bHRpc2lnSGV4ZXMsIHBhc3N3b3JkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZXhjaGFuZ2VNdWx0aXNpZ0tleXMobXVsdGlzaWdIZXhlcywgcGFzc3dvcmQpKS50b0pzb24oKTtcbn1cblxuc2VsZi5leHBvcnRNdWx0aXNpZ0hleCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5leHBvcnRNdWx0aXNpZ0hleCgpO1xufVxuXG5zZWxmLmltcG9ydE11bHRpc2lnSGV4ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG11bHRpc2lnSGV4ZXMsIHJlZnJlc2hBZnRlckltcG9ydCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaW1wb3J0TXVsdGlzaWdIZXgobXVsdGlzaWdIZXhlcywgcmVmcmVzaEFmdGVySW1wb3J0KTtcbn1cblxuc2VsZi5zaWduTXVsdGlzaWdUeEhleCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBtdWx0aXNpZ1R4SGV4KSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2lnbk11bHRpc2lnVHhIZXgobXVsdGlzaWdUeEhleCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLnN1Ym1pdE11bHRpc2lnVHhIZXggPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgc2lnbmVkTXVsdGlzaWdUeEhleCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc3VibWl0TXVsdGlzaWdUeEhleChzaWduZWRNdWx0aXNpZ1R4SGV4KTtcbn1cblxuc2VsZi5nZXREYXRhID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldERhdGEoKTtcbn1cblxuc2VsZi5jaGFuZ2VQYXNzd29yZCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBvbGRQYXNzd29yZCwgbmV3UGFzc3dvcmQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmNoYW5nZVBhc3N3b3JkKG9sZFBhc3N3b3JkLCBuZXdQYXNzd29yZCk7XG59XG5cbnNlbGYuaXNDbG9zZWQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gIXNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdIHx8IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmlzQ2xvc2VkKCk7XG59XG5cbnNlbGYucHJlcGFyZUNsb3NlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnByZXBhcmVDbG9zZSgpO1xufVxuXG5zZWxmLmdldENsb3NlRGF0YSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRDbG9zZURhdGEoKTtcbn1cblxuc2VsZi5jbG9zZSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBzYXZlKSB7XG4gIGlmICghc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0pIHJldHVybjtcbiAgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uY2xvc2Uoc2F2ZSk7XG4gIGlmIChzZWxmLmxpc3RlbmVycykgc2VsZi5saXN0ZW5lcnMgPSBzZWxmLmxpc3RlbmVycy5maWx0ZXIobGlzdGVuZXIgPT4gbGlzdGVuZXIud2FsbGV0SWQgIT09IHdhbGxldElkKTtcbiAgZGVsZXRlIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdO1xufSJdLCJtYXBwaW5ncyI6ImtHQUFBLElBQUFBLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLFNBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLFdBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFHLGFBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFJLFVBQUEsR0FBQUwsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFLLFlBQUEsR0FBQU4sc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFNLG1CQUFBLEdBQUFQLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTyxxQkFBQSxHQUFBUixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVEsZ0JBQUEsR0FBQVQsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFTLFlBQUEsR0FBQVYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFVLGVBQUEsR0FBQVgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFXLG9CQUFBLEdB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