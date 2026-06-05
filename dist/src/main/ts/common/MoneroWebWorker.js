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

self.setDaemonConnection = async function (walletId, config) {
  return self.WORKER_OBJECTS[walletId].setDaemonConnection(config ? new _MoneroRpcConnection.default(Object.assign(config, { proxyToWorker: false })) : undefined);
};

self.getDaemonConnection = async function (walletId) {
  let connection = await self.WORKER_OBJECTS[walletId].getDaemonConnection();
  return connection ? connection.getConfig() : undefined;
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
  let keyImagesJson = [];
  for (let keyImage of await self.WORKER_OBJECTS[walletId].exportKeyImages(all)) keyImagesJson.push(keyImage.toJson());
  return keyImagesJson;
};

self.importKeyImages = async function (walletId, keyImagesJson) {
  let keyImages = [];
  for (let keyImageJson of keyImagesJson) keyImages.push(new _MoneroKeyImage.default(keyImageJson));
  return (await self.WORKER_OBJECTS[walletId].importKeyImages(keyImages)).toJson();
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

self.close = async function (walletId, save) {
  return self.WORKER_OBJECTS[walletId].close(save);
  delete self.WORKER_OBJECTS[walletId];
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfSHR0cENsaWVudCIsIl9MaWJyYXJ5VXRpbHMiLCJfTW9uZXJvQmFuIiwiX01vbmVyb0Jsb2NrIiwiX01vbmVyb0RhZW1vbkNvbmZpZyIsIl9Nb25lcm9EYWVtb25MaXN0ZW5lciIsIl9Nb25lcm9EYWVtb25ScGMiLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvS2V5SW1hZ2UiLCJfTW9uZXJvUnBjQ29ubmVjdGlvbiIsIl9Nb25lcm9UeENvbmZpZyIsIl9Nb25lcm9UeFNldCIsIl9Nb25lcm9VdGlscyIsIl9Nb25lcm9XYWxsZXRDb25maWciLCJfTW9uZXJvV2FsbGV0TGlzdGVuZXIiLCJfTW9uZXJvV2FsbGV0S2V5cyIsIl9Nb25lcm9XYWxsZXRGdWxsIiwiR2VuVXRpbHMiLCJpc0Rlbm8iLCJzZWxmIiwiZ2xvYmFsVGhpcyIsIkRlZGljYXRlZFdvcmtlckdsb2JhbFNjb3BlIiwicHJvdG90eXBlIiwiaXNQcm90b3R5cGVPZiIsIkh0dHBDbGllbnQiLCJMaWJyYXJ5VXRpbHMiLCJvbm1lc3NhZ2UiLCJlIiwiaW5pdE9uZVRpbWUiLCJvYmplY3RJZCIsImRhdGEiLCJmbk5hbWUiLCJjYWxsYmFja0lkIiwiYXNzZXJ0IiwiRXJyb3IiLCJzcGxpY2UiLCJwb3N0TWVzc2FnZSIsInJlc3VsdCIsImFwcGx5IiwiZXJyb3IiLCJzZXJpYWxpemVFcnJvciIsImlzSW5pdGlhbGl6ZWQiLCJXT1JLRVJfT0JKRUNUUyIsIk1vbmVyb1V0aWxzIiwiUFJPWFlfVE9fV09SS0VSIiwiaHR0cFJlcXVlc3QiLCJvcHRzIiwicmVxdWVzdCIsIk9iamVjdCIsImFzc2lnbiIsInByb3h5VG9Xb3JrZXIiLCJlcnIiLCJzdGF0dXNDb2RlIiwiSlNPTiIsInN0cmluZ2lmeSIsInN0YXR1c01lc3NhZ2UiLCJtZXNzYWdlIiwic2V0TG9nTGV2ZWwiLCJsZXZlbCIsImdldFdhc21NZW1vcnlVc2VkIiwiZ2V0V2FzbU1vZHVsZSIsIkhFQVA4IiwibGVuZ3RoIiwidW5kZWZpbmVkIiwibW9uZXJvVXRpbHNHZXRJbnRlZ3JhdGVkQWRkcmVzcyIsIm5ldHdvcmtUeXBlIiwic3RhbmRhcmRBZGRyZXNzIiwicGF5bWVudElkIiwiZ2V0SW50ZWdyYXRlZEFkZHJlc3MiLCJ0b0pzb24iLCJtb25lcm9VdGlsc1ZhbGlkYXRlQWRkcmVzcyIsImFkZHJlc3MiLCJ2YWxpZGF0ZUFkZHJlc3MiLCJtb25lcm9VdGlsc0pzb25Ub0JpbmFyeSIsImpzb24iLCJqc29uVG9CaW5hcnkiLCJtb25lcm9VdGlsc0JpbmFyeVRvSnNvbiIsInVpbnQ4YXJyIiwiYmluYXJ5VG9Kc29uIiwibW9uZXJvVXRpbHNCaW5hcnlCbG9ja3NUb0pzb24iLCJiaW5hcnlCbG9ja3NUb0pzb24iLCJkYWVtb25BZGRMaXN0ZW5lciIsImRhZW1vbklkIiwibGlzdGVuZXJJZCIsImxpc3RlbmVyIiwiTW9uZXJvRGFlbW9uTGlzdGVuZXIiLCJvbkJsb2NrSGVhZGVyIiwiYmxvY2tIZWFkZXIiLCJkYWVtb25MaXN0ZW5lcnMiLCJhZGRMaXN0ZW5lciIsImRhZW1vblJlbW92ZUxpc3RlbmVyIiwiTW9uZXJvRXJyb3IiLCJyZW1vdmVMaXN0ZW5lciIsImNvbm5lY3REYWVtb25ScGMiLCJjb25maWciLCJNb25lcm9EYWVtb25ScGMiLCJjb25uZWN0VG9EYWVtb25ScGMiLCJNb25lcm9EYWVtb25Db25maWciLCJkYWVtb25HZXRScGNDb25uZWN0aW9uIiwiY29ubmVjdGlvbiIsImdldFJwY0Nvbm5lY3Rpb24iLCJnZXRDb25maWciLCJkYWVtb25Jc0Nvbm5lY3RlZCIsImlzQ29ubmVjdGVkIiwiZGFlbW9uR2V0VmVyc2lvbiIsImdldFZlcnNpb24iLCJkYWVtb25Jc1RydXN0ZWQiLCJpc1RydXN0ZWQiLCJkYWVtb25HZXRIZWlnaHQiLCJnZXRIZWlnaHQiLCJkYWVtb25HZXRCbG9ja0hhc2giLCJoZWlnaHQiLCJnZXRCbG9ja0hhc2giLCJkYWVtb25HZXRCbG9ja1RlbXBsYXRlIiwid2FsbGV0QWRkcmVzcyIsInJlc2VydmVTaXplIiwiZ2V0QmxvY2tUZW1wbGF0ZSIsImRhZW1vbkdldExhc3RCbG9ja0hlYWRlciIsImdldExhc3RCbG9ja0hlYWRlciIsImRhZW1vbkdldEJsb2NrSGVhZGVyQnlIYXNoIiwiaGFzaCIsImdldEJsb2NrSGVhZGVyQnlIYXNoIiwiZGFlbW9uR2V0QmxvY2tIZWFkZXJCeUhlaWdodCIsImdldEJsb2NrSGVhZGVyQnlIZWlnaHQiLCJkYWVtb25HZXRCbG9ja0hlYWRlcnNCeVJhbmdlIiwic3RhcnRIZWlnaHQiLCJlbmRIZWlnaHQiLCJibG9ja0hlYWRlcnNKc29uIiwiZ2V0QmxvY2tIZWFkZXJzQnlSYW5nZSIsInB1c2giLCJkYWVtb25HZXRCbG9ja0J5SGFzaCIsImJsb2NrSGFzaCIsImdldEJsb2NrQnlIYXNoIiwiZGFlbW9uR2V0QmxvY2tzQnlIYXNoIiwiYmxvY2tIYXNoZXMiLCJwcnVuZSIsImJsb2Nrc0pzb24iLCJibG9jayIsImdldEJsb2Nrc0J5SGFzaCIsImRhZW1vbkdldEJsb2NrQnlIZWlnaHQiLCJnZXRCbG9ja0J5SGVpZ2h0IiwiZGFlbW9uR2V0QmxvY2tzQnlIZWlnaHQiLCJoZWlnaHRzIiwiZ2V0QmxvY2tzQnlIZWlnaHQiLCJkYWVtb25HZXRCbG9ja3NCeVJhbmdlIiwiZ2V0QmxvY2tzQnlSYW5nZSIsImRhZW1vbkdldEJsb2Nrc0J5UmFuZ2VDaHVua2VkIiwibWF4Q2h1bmtTaXplIiwiZ2V0QmxvY2tzQnlSYW5nZUNodW5rZWQiLCJkYWVtb25HZXRCbG9ja0hhc2hlcyIsImRhZW1vbkdldFR4cyIsInR4SGFzaGVzIiwidHhzIiwiZ2V0VHhzIiwiYmxvY2tzIiwidW5jb25maXJtZWRCbG9jayIsInNlZW5CbG9ja3MiLCJTZXQiLCJ0eCIsImdldEJsb2NrIiwiTW9uZXJvQmxvY2siLCJzZXRUeHMiLCJzZXRCbG9jayIsImhhcyIsImFkZCIsImkiLCJkYWVtb25HZXRUeEhleGVzIiwiZ2V0VHhIZXhlcyIsImRhZW1vbkdldE1pbmVyVHhTdW0iLCJudW1CbG9ja3MiLCJnZXRNaW5lclR4U3VtIiwiZGFlbW9uR2V0RmVlRXN0aW1hdGUiLCJncmFjZUJsb2NrcyIsImdldEZlZUVzdGltYXRlIiwiZGFlbW9uU3VibWl0VHhIZXgiLCJ0eEhleCIsImRvTm90UmVsYXkiLCJzdWJtaXRUeEhleCIsImRhZW1vblJlbGF5VHhzQnlIYXNoIiwicmVsYXlUeHNCeUhhc2giLCJkYWVtb25HZXRUeFBvb2wiLCJnZXRUeFBvb2wiLCJkYWVtb25HZXRUeFBvb2xIYXNoZXMiLCJnZXRUeFBvb2xIYXNoZXMiLCJkYWVtb25HZXRUeFBvb2xTdGF0cyIsImdldFR4UG9vbFN0YXRzIiwiZGFlbW9uRmx1c2hUeFBvb2wiLCJoYXNoZXMiLCJmbHVzaFR4UG9vbCIsImRhZW1vbkdldEtleUltYWdlU3BlbnRTdGF0dXNlcyIsImtleUltYWdlcyIsImdldEtleUltYWdlU3BlbnRTdGF0dXNlcyIsImRhZW1vbkdldE91dHB1dEhpc3RvZ3JhbSIsImFtb3VudHMiLCJtaW5Db3VudCIsIm1heENvdW50IiwiaXNVbmxvY2tlZCIsInJlY2VudEN1dG9mZiIsImVudHJpZXNKc29uIiwiZW50cnkiLCJnZXRPdXRwdXRIaXN0b2dyYW0iLCJkYWVtb25HZXRJbmZvIiwiZ2V0SW5mbyIsImRhZW1vbkdldFN5bmNJbmZvIiwiZ2V0U3luY0luZm8iLCJkYWVtb25HZXRIYXJkRm9ya0luZm8iLCJnZXRIYXJkRm9ya0luZm8iLCJkYWVtb25HZXRBbHRDaGFpbnMiLCJhbHRDaGFpbnNKc29uIiwiYWx0Q2hhaW4iLCJnZXRBbHRDaGFpbnMiLCJkYWVtb25HZXRBbHRCbG9ja0hhc2hlcyIsImdldEFsdEJsb2NrSGFzaGVzIiwiZGFlbW9uR2V0RG93bmxvYWRMaW1pdCIsImdldERvd25sb2FkTGltaXQiLCJkYWVtb25TZXREb3dubG9hZExpbWl0IiwibGltaXQiLCJzZXREb3dubG9hZExpbWl0IiwiZGFlbW9uUmVzZXREb3dubG9hZExpbWl0IiwicmVzZXREb3dubG9hZExpbWl0IiwiZGFlbW9uR2V0VXBsb2FkTGltaXQiLCJnZXRVcGxvYWRMaW1pdCIsImRhZW1vblNldFVwbG9hZExpbWl0Iiwic2V0VXBsb2FkTGltaXQiLCJkYWVtb25SZXNldFVwbG9hZExpbWl0IiwicmVzZXRVcGxvYWRMaW1pdCIsImRhZW1vbkdldFBlZXJzIiwicGVlcnNKc29uIiwicGVlciIsImdldFBlZXJzIiwiZGFlbW9uR2V0S25vd25QZWVycyIsImdldEtub3duUGVlcnMiLCJkYWVtb25TZXRPdXRnb2luZ1BlZXJMaW1pdCIsInNldE91dGdvaW5nUGVlckxpbWl0IiwiZGFlbW9uU2V0SW5jb21pbmdQZWVyTGltaXQiLCJzZXRJbmNvbWluZ1BlZXJMaW1pdCIsImRhZW1vbkdldFBlZXJCYW5zIiwiYmFuc0pzb24iLCJiYW4iLCJnZXRQZWVyQmFucyIsImRhZW1vblNldFBlZXJCYW5zIiwiYmFucyIsImJhbkpzb24iLCJNb25lcm9CYW4iLCJzZXRQZWVyQmFucyIsImRhZW1vblN0YXJ0TWluaW5nIiwibnVtVGhyZWFkcyIsImlzQmFja2dyb3VuZCIsImlnbm9yZUJhdHRlcnkiLCJzdGFydE1pbmluZyIsImRhZW1vblN0b3BNaW5pbmciLCJzdG9wTWluaW5nIiwiZGFlbW9uR2V0TWluaW5nU3RhdHVzIiwiZ2V0TWluaW5nU3RhdHVzIiwiZGFlbW9uU3VibWl0QmxvY2tzIiwiYmxvY2tCbG9icyIsInN1Ym1pdEJsb2NrcyIsImRhZW1vblBydW5lQmxvY2tjaGFpbiIsImNoZWNrIiwicHJ1bmVCbG9ja2NoYWluIiwiZGFlbW9uU3RvcCIsInN0b3AiLCJkYWVtb25XYWl0Rm9yTmV4dEJsb2NrSGVhZGVyIiwid2FpdEZvck5leHRCbG9ja0hlYWRlciIsIm9wZW5XYWxsZXREYXRhIiwid2FsbGV0SWQiLCJwYXRoIiwicGFzc3dvcmQiLCJrZXlzRGF0YSIsImNhY2hlRGF0YSIsImRhZW1vblVyaU9yQ29uZmlnIiwiZGFlbW9uQ29ubmVjdGlvbiIsIk1vbmVyb1JwY0Nvbm5lY3Rpb24iLCJNb25lcm9XYWxsZXRGdWxsIiwib3BlbldhbGxldCIsInNlcnZlciIsInNldEJyb3dzZXJNYWluUGF0aCIsImNyZWF0ZVdhbGxldEtleXMiLCJjb25maWdKc29uIiwiTW9uZXJvV2FsbGV0Q29uZmlnIiwic2V0UHJveHlUb1dvcmtlciIsIk1vbmVyb1dhbGxldEtleXMiLCJjcmVhdGVXYWxsZXQiLCJjcmVhdGVXYWxsZXRGdWxsIiwiZ2V0UGF0aCIsInNldFBhdGgiLCJpc1ZpZXdPbmx5IiwiZ2V0TmV0d29ya1R5cGUiLCJnZXRTZWVkIiwiZ2V0U2VlZExhbmd1YWdlIiwiZ2V0U2VlZExhbmd1YWdlcyIsImdldFByaXZhdGVTcGVuZEtleSIsImdldFByaXZhdGVWaWV3S2V5IiwiZ2V0UHVibGljVmlld0tleSIsImdldFB1YmxpY1NwZW5kS2V5IiwiZ2V0QWRkcmVzcyIsImFjY291bnRJZHgiLCJzdWJhZGRyZXNzSWR4IiwiZ2V0QWRkcmVzc0luZGV4Iiwic2V0U3ViYWRkcmVzc0xhYmVsIiwibGFiZWwiLCJkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyIsImludGVncmF0ZWRBZGRyZXNzIiwic2V0RGFlbW9uQ29ubmVjdGlvbiIsImdldERhZW1vbkNvbm5lY3Rpb24iLCJpc0Nvbm5lY3RlZFRvRGFlbW9uIiwiZ2V0UmVzdG9yZUhlaWdodCIsInNldFJlc3RvcmVIZWlnaHQiLCJyZXN0b3JlSGVpZ2h0IiwiZ2V0RGFlbW9uSGVpZ2h0IiwiZ2V0RGFlbW9uTWF4UGVlckhlaWdodCIsImdldEhlaWdodEJ5RGF0ZSIsInllYXIiLCJtb250aCIsImRheSIsImlzRGFlbW9uU3luY2VkIiwiV2FsbGV0V29ya2VySGVscGVyTGlzdGVuZXIiLCJNb25lcm9XYWxsZXRMaXN0ZW5lciIsImNvbnN0cnVjdG9yIiwiaWQiLCJ3b3JrZXIiLCJnZXRJZCIsIm9uU3luY1Byb2dyZXNzIiwicGVyY2VudERvbmUiLCJvbk5ld0Jsb2NrIiwib25CYWxhbmNlc0NoYW5nZWQiLCJuZXdCYWxhbmNlIiwibmV3VW5sb2NrZWRCYWxhbmNlIiwidG9TdHJpbmciLCJvbk91dHB1dFJlY2VpdmVkIiwib3V0cHV0IiwiZ2V0VHgiLCJvbk91dHB1dFNwZW50IiwibGlzdGVuZXJzIiwiaXNTeW5jZWQiLCJzeW5jIiwiYWxsb3dDb25jdXJyZW50Q2FsbHMiLCJzdGFydFN5bmNpbmciLCJzeW5jUGVyaW9kSW5NcyIsInN0b3BTeW5jaW5nIiwic2NhblR4cyIsInJlc2NhblNwZW50IiwicmVzY2FuQmxvY2tjaGFpbiIsImdldEJhbGFuY2UiLCJnZXRVbmxvY2tlZEJhbGFuY2UiLCJnZXRBY2NvdW50cyIsImluY2x1ZGVTdWJhZGRyZXNzZXMiLCJ0YWciLCJhY2NvdW50SnNvbnMiLCJhY2NvdW50IiwiZ2V0QWNjb3VudCIsImNyZWF0ZUFjY291bnQiLCJnZXRTdWJhZGRyZXNzZXMiLCJzdWJhZGRyZXNzSW5kaWNlcyIsInN1YmFkZHJlc3NKc29ucyIsInN1YmFkZHJlc3MiLCJjcmVhdGVTdWJhZGRyZXNzIiwiYmxvY2tKc29uUXVlcnkiLCJxdWVyeSIsIkRlc2VyaWFsaXphdGlvblR5cGUiLCJUWF9RVUVSWSIsImdldFRyYW5zZmVycyIsImdldFRyYW5zZmVyUXVlcnkiLCJ0cmFuc2ZlcnMiLCJ0cmFuc2ZlciIsImdldE91dHB1dHMiLCJnZXRPdXRwdXRRdWVyeSIsIm91dHB1dHMiLCJleHBvcnRPdXRwdXRzIiwiYWxsIiwiaW1wb3J0T3V0cHV0cyIsIm91dHB1dHNIZXgiLCJnZXRLZXlJbWFnZXMiLCJrZXlJbWFnZXNKc29uIiwia2V5SW1hZ2UiLCJleHBvcnRLZXlJbWFnZXMiLCJpbXBvcnRLZXlJbWFnZXMiLCJrZXlJbWFnZUpzb24iLCJNb25lcm9LZXlJbWFnZSIsImZyZWV6ZU91dHB1dCIsInRoYXdPdXRwdXQiLCJpc091dHB1dEZyb3plbiIsImdldERlZmF1bHRGZWVQcmlvcml0eSIsImNyZWF0ZVR4cyIsIk1vbmVyb1R4Q29uZmlnIiwiZ2V0VHhTZXQiLCJzd2VlcE91dHB1dCIsInN3ZWVwVW5sb2NrZWQiLCJ0eFNldHMiLCJhcnJheUNvbnRhaW5zIiwidHhTZXRzSnNvbiIsInR4U2V0Iiwic3dlZXBEdXN0IiwicmVsYXkiLCJyZWxheVR4cyIsInR4TWV0YWRhdGFzIiwiZGVzY3JpYmVUeFNldCIsInR4U2V0SnNvbiIsIk1vbmVyb1R4U2V0Iiwic2lnblR4cyIsInVuc2lnbmVkVHhIZXgiLCJzdWJtaXRUeHMiLCJzaWduZWRUeEhleCIsInNpZ25NZXNzYWdlIiwic2lnbmF0dXJlVHlwZSIsInZlcmlmeU1lc3NhZ2UiLCJzaWduYXR1cmUiLCJnZXRUeEtleSIsInR4SGFzaCIsImNoZWNrVHhLZXkiLCJ0eEtleSIsImdldFR4UHJvb2YiLCJjaGVja1R4UHJvb2YiLCJnZXRTcGVuZFByb29mIiwiY2hlY2tTcGVuZFByb29mIiwiZ2V0UmVzZXJ2ZVByb29mV2FsbGV0IiwiZ2V0UmVzZXJ2ZVByb29mQWNjb3VudCIsImFtb3VudFN0ciIsImNoZWNrUmVzZXJ2ZVByb29mIiwiZ2V0VHhOb3RlcyIsInNldFR4Tm90ZXMiLCJ0eE5vdGVzIiwiZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzIiwiZW50cnlJbmRpY2VzIiwiYWRkQWRkcmVzc0Jvb2tFbnRyeSIsImRlc2NyaXB0aW9uIiwiZWRpdEFkZHJlc3NCb29rRW50cnkiLCJpbmRleCIsInNldEFkZHJlc3MiLCJzZXREZXNjcmlwdGlvbiIsImRlbGV0ZUFkZHJlc3NCb29rRW50cnkiLCJ0YWdBY2NvdW50cyIsImFjY291bnRJbmRpY2VzIiwidW50YWdBY2NvdW50cyIsImdldEFjY291bnRUYWdzIiwic2V0QWNjb3VudFRhZ0xhYmVsIiwiZ2V0UGF5bWVudFVyaSIsInBhcnNlUGF5bWVudFVyaSIsInVyaSIsImdldEF0dHJpYnV0ZSIsImtleSIsInNldEF0dHJpYnV0ZSIsInZhbHVlIiwiYmFja2dyb3VuZE1pbmluZyIsImlzTXVsdGlzaWdJbXBvcnROZWVkZWQiLCJpc011bHRpc2lnIiwiZ2V0TXVsdGlzaWdJbmZvIiwicHJlcGFyZU11bHRpc2lnIiwibWFrZU11bHRpc2lnIiwibXVsdGlzaWdIZXhlcyIsInRocmVzaG9sZCIsImV4Y2hhbmdlTXVsdGlzaWdLZXlzIiwiZXhwb3J0TXVsdGlzaWdIZXgiLCJpbXBvcnRNdWx0aXNpZ0hleCIsInJlZnJlc2hBZnRlckltcG9ydCIsInNpZ25NdWx0aXNpZ1R4SGV4IiwibXVsdGlzaWdUeEhleCIsInN1Ym1pdE11bHRpc2lnVHhIZXgiLCJzaWduZWRNdWx0aXNpZ1R4SGV4IiwiZ2V0RGF0YSIsImNoYW5nZVBhc3N3b3JkIiwib2xkUGFzc3dvcmQiLCJuZXdQYXNzd29yZCIsImlzQ2xvc2VkIiwiY2xvc2UiLCJzYXZlIl0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvY29tbW9uL01vbmVyb1dlYldvcmtlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXNzZXJ0IGZyb20gXCJhc3NlcnRcIjtcbmltcG9ydCBHZW5VdGlscyBmcm9tIFwiLi9HZW5VdGlsc1wiO1xuaW1wb3J0IEh0dHBDbGllbnQgZnJvbSBcIi4vSHR0cENsaWVudFwiO1xuaW1wb3J0IExpYnJhcnlVdGlscyBmcm9tIFwiLi9MaWJyYXJ5VXRpbHNcIjtcbmltcG9ydCBNb25lcm9CYW4gZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9CYW5cIjtcbmltcG9ydCBNb25lcm9CbG9jayBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0Jsb2NrXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uQ29uZmlnIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvRGFlbW9uQ29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uTGlzdGVuZXIgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9EYWVtb25MaXN0ZW5lclwiO1xuaW1wb3J0IE1vbmVyb0RhZW1vblJwYyBmcm9tIFwiLi4vZGFlbW9uL01vbmVyb0RhZW1vblJwY1wiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuL01vbmVyb0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2UgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9LZXlJbWFnZVwiO1xuaW1wb3J0IE1vbmVyb1JwY0Nvbm5lY3Rpb24gZnJvbSBcIi4vTW9uZXJvUnBjQ29ubmVjdGlvblwiO1xuaW1wb3J0IE1vbmVyb1R4Q29uZmlnIGZyb20gXCIuLi93YWxsZXQvbW9kZWwvTW9uZXJvVHhDb25maWdcIjtcbmltcG9ydCBNb25lcm9UeFF1ZXJ5IGZyb20gXCIuLi93YWxsZXQvbW9kZWwvTW9uZXJvVHhRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb1R4U2V0IGZyb20gXCIuLi93YWxsZXQvbW9kZWwvTW9uZXJvVHhTZXRcIjtcbmltcG9ydCBNb25lcm9VdGlscyBmcm9tIFwiLi9Nb25lcm9VdGlsc1wiO1xuaW1wb3J0IE1vbmVyb1dhbGxldENvbmZpZyBmcm9tIFwiLi4vd2FsbGV0L21vZGVsL01vbmVyb1dhbGxldENvbmZpZ1wiXG5pbXBvcnQgTW9uZXJvV2FsbGV0TGlzdGVuZXIgZnJvbSBcIi4uL3dhbGxldC9tb2RlbC9Nb25lcm9XYWxsZXRMaXN0ZW5lclwiXG5pbXBvcnQge01vbmVyb1dhbGxldEtleXN9IGZyb20gXCIuLi93YWxsZXQvTW9uZXJvV2FsbGV0S2V5c1wiO1xuaW1wb3J0IE1vbmVyb1dhbGxldEZ1bGwgZnJvbSBcIi4uL3dhbGxldC9Nb25lcm9XYWxsZXRGdWxsXCI7XG5cbmRlY2xhcmUgdmFyIHNlbGY6IGFueTtcblxuLy8gZGVubyBjb25maWd1cmF0aW9uXG5kZWNsYXJlIHZhciBEZWRpY2F0ZWRXb3JrZXJHbG9iYWxTY29wZTogYW55O1xuaWYgKEdlblV0aWxzLmlzRGVubygpICYmIHR5cGVvZiBzZWxmID09PSBcInVuZGVmaW5lZFwiICYmIHR5cGVvZiBnbG9iYWxUaGlzID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBEZWRpY2F0ZWRXb3JrZXJHbG9iYWxTY29wZSA9PT0gXCJmdW5jdGlvblwiICYmIERlZGljYXRlZFdvcmtlckdsb2JhbFNjb3BlLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGdsb2JhbFRoaXMpKSB7XG4gIHNlbGYgPSBnbG9iYWxUaGlzO1xuICAoZ2xvYmFsVGhpcyBhcyBhbnkpLnNlbGYgPSBnbG9iYWxUaGlzO1xufVxuXG4vLyBleHBvc2Ugc29tZSBtb2R1bGVzIHRvIHRoZSB3b3JrZXJcbnNlbGYuSHR0cENsaWVudCA9IEh0dHBDbGllbnQ7XG5zZWxmLkxpYnJhcnlVdGlscyA9IExpYnJhcnlVdGlscztcbnNlbGYuR2VuVXRpbHMgPSBHZW5VdGlscztcblxuLyoqXG4gKiBXb3JrZXIgdG8gbWFuYWdlIGEgZGFlbW9uIGFuZCB3YXNtIHdhbGxldCBvZmYgdGhlIG1haW4gdGhyZWFkIHVzaW5nIG1lc3NhZ2VzLlxuICogXG4gKiBSZXF1aXJlZCBtZXNzYWdlIGZvcm1hdDogZS5kYXRhWzBdID0gb2JqZWN0IGlkLCBlLmRhdGFbMV0gPSBmdW5jdGlvbiBuYW1lLCBlLmRhdGFbMitdID0gZnVuY3Rpb24gYXJnc1xuICpcbiAqIEZvciBicm93c2VyIGFwcGxpY2F0aW9ucywgdGhpcyBmaWxlIG11c3QgYmUgYnJvd3NlcmlmaWVkIGFuZCBwbGFjZWQgaW4gdGhlIHdlYiBhcHAgcm9vdC5cbiAqIFxuICogQHByaXZhdGVcbiAqL1xuc2VsZi5vbm1lc3NhZ2UgPSBhc3luYyBmdW5jdGlvbihlKSB7XG4gIFxuICAvLyBpbml0aWFsaXplIG9uZSB0aW1lXG4gIGF3YWl0IHNlbGYuaW5pdE9uZVRpbWUoKTtcbiAgXG4gIC8vIHZhbGlkYXRlIHBhcmFtc1xuICBsZXQgb2JqZWN0SWQgPSBlLmRhdGFbMF07XG4gIGxldCBmbk5hbWUgPSBlLmRhdGFbMV07XG4gIGxldCBjYWxsYmFja0lkID0gZS5kYXRhWzJdO1xuICBhc3NlcnQoZm5OYW1lLCBcIk11c3QgcHJvdmlkZSBmdW5jdGlvbiBuYW1lIHRvIHdvcmtlclwiKTtcbiAgYXNzZXJ0KGNhbGxiYWNrSWQsIFwiTXVzdCBwcm92aWRlIGNhbGxiYWNrIGlkIHRvIHdvcmtlclwiKTtcbiAgaWYgKCFzZWxmW2ZuTmFtZV0pIHRocm93IG5ldyBFcnJvcihcIk1ldGhvZCAnXCIgKyBmbk5hbWUgKyBcIicgaXMgbm90IHJlZ2lzdGVyZWQgd2l0aCB3b3JrZXJcIik7XG4gIGUuZGF0YS5zcGxpY2UoMSwgMik7IC8vIHJlbW92ZSBmdW5jdGlvbiBuYW1lIGFuZCBjYWxsYmFjayBpZCB0byBhcHBseSBmdW5jdGlvbiB3aXRoIGFyZ3VtZW50c1xuICBcbiAgLy8gZXhlY3V0ZSB3b3JrZXIgZnVuY3Rpb24gYW5kIHBvc3QgcmVzdWx0IHRvIGNhbGxiYWNrXG4gIHRyeSB7XG4gICAgcG9zdE1lc3NhZ2UoW29iamVjdElkLCBjYWxsYmFja0lkLCB7cmVzdWx0OiBhd2FpdCBzZWxmW2ZuTmFtZV0uYXBwbHkobnVsbCwgZS5kYXRhKX1dKTtcbiAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgaWYgKCEoZSBpbnN0YW5jZW9mIEVycm9yKSkgZSA9IG5ldyBFcnJvcihlKTtcbiAgICBwb3N0TWVzc2FnZShbb2JqZWN0SWQsIGNhbGxiYWNrSWQsIHtlcnJvcjogTGlicmFyeVV0aWxzLnNlcmlhbGl6ZUVycm9yKGUpfV0pO1xuICB9XG59XG5cbnNlbGYuaW5pdE9uZVRpbWUgPSBhc3luYyBmdW5jdGlvbigpIHtcbiAgaWYgKCFzZWxmLmlzSW5pdGlhbGl6ZWQpIHtcbiAgICBzZWxmLldPUktFUl9PQkpFQ1RTID0ge307XG4gICAgc2VsZi5pc0luaXRpYWxpemVkID0gdHJ1ZTtcbiAgICBNb25lcm9VdGlscy5QUk9YWV9UT19XT1JLRVIgPSBmYWxzZTtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU1RBVElDIFVUSUxJVElFUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnNlbGYuaHR0cFJlcXVlc3QgPSBhc3luYyBmdW5jdGlvbihvYmplY3RJZCwgb3B0cykge1xuICB0cnkge1xuICAgIHJldHVybiBhd2FpdCBIdHRwQ2xpZW50LnJlcXVlc3QoT2JqZWN0LmFzc2lnbihvcHRzLCB7cHJveHlUb1dvcmtlcjogZmFsc2V9KSk7ICBcbiAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICB0aHJvdyBlcnIuc3RhdHVzQ29kZSA/IG5ldyBFcnJvcihKU09OLnN0cmluZ2lmeSh7c3RhdHVzQ29kZTogZXJyLnN0YXR1c0NvZGUsIHN0YXR1c01lc3NhZ2U6IGVyci5tZXNzYWdlfSkpIDogZXJyO1xuICB9XG59XG5cbnNlbGYuc2V0TG9nTGV2ZWwgPSBhc3luYyBmdW5jdGlvbihvYmplY3RJZCwgbGV2ZWwpIHtcbiAgcmV0dXJuIExpYnJhcnlVdGlscy5zZXRMb2dMZXZlbChsZXZlbCk7XG59XG5cbnNlbGYuZ2V0V2FzbU1lbW9yeVVzZWQgPSBhc3luYyBmdW5jdGlvbihvYmplY3RJZCkge1xuICByZXR1cm4gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKSAmJiBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLkhFQVA4ID8gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5IRUFQOC5sZW5ndGggOiB1bmRlZmluZWQ7XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIE1PTkVSTyBVVElMUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuc2VsZi5tb25lcm9VdGlsc0dldEludGVncmF0ZWRBZGRyZXNzID0gYXN5bmMgZnVuY3Rpb24ob2JqZWN0SWQsIG5ldHdvcmtUeXBlLCBzdGFuZGFyZEFkZHJlc3MsIHBheW1lbnRJZCkge1xuICByZXR1cm4gKGF3YWl0IE1vbmVyb1V0aWxzLmdldEludGVncmF0ZWRBZGRyZXNzKG5ldHdvcmtUeXBlLCBzdGFuZGFyZEFkZHJlc3MsIHBheW1lbnRJZCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLm1vbmVyb1V0aWxzVmFsaWRhdGVBZGRyZXNzID0gYXN5bmMgZnVuY3Rpb24ob2JqZWN0SWQsIGFkZHJlc3MsIG5ldHdvcmtUeXBlKSB7XG4gIHJldHVybiBNb25lcm9VdGlscy52YWxpZGF0ZUFkZHJlc3MoYWRkcmVzcywgbmV0d29ya1R5cGUpO1xufVxuXG5zZWxmLm1vbmVyb1V0aWxzSnNvblRvQmluYXJ5ID0gYXN5bmMgZnVuY3Rpb24ob2JqZWN0SWQsIGpzb24pIHtcbiAgcmV0dXJuIE1vbmVyb1V0aWxzLmpzb25Ub0JpbmFyeShqc29uKTtcbn1cblxuc2VsZi5tb25lcm9VdGlsc0JpbmFyeVRvSnNvbiA9IGFzeW5jIGZ1bmN0aW9uKG9iamVjdElkLCB1aW50OGFycikge1xuICByZXR1cm4gTW9uZXJvVXRpbHMuYmluYXJ5VG9Kc29uKHVpbnQ4YXJyKTtcbn1cblxuc2VsZi5tb25lcm9VdGlsc0JpbmFyeUJsb2Nrc1RvSnNvbiA9IGFzeW5jIGZ1bmN0aW9uKG9iamVjdElkLCB1aW50OGFycikge1xuICByZXR1cm4gTW9uZXJvVXRpbHMuYmluYXJ5QmxvY2tzVG9Kc29uKHVpbnQ4YXJyKTtcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBEQUVNT04gTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5zZWxmLmRhZW1vbkFkZExpc3RlbmVyID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGxpc3RlbmVySWQpIHtcbiAgbGV0IGxpc3RlbmVyID0gbmV3IGNsYXNzIGV4dGVuZHMgTW9uZXJvRGFlbW9uTGlzdGVuZXIge1xuICAgIGFzeW5jIG9uQmxvY2tIZWFkZXIoYmxvY2tIZWFkZXIpIHtcbiAgICAgIHNlbGYucG9zdE1lc3NhZ2UoW2RhZW1vbklkLCBcIm9uQmxvY2tIZWFkZXJfXCIgKyBsaXN0ZW5lcklkLCBibG9ja0hlYWRlci50b0pzb24oKV0pO1xuICAgIH1cbiAgfVxuICBpZiAoIXNlbGYuZGFlbW9uTGlzdGVuZXJzKSBzZWxmLmRhZW1vbkxpc3RlbmVycyA9IHt9O1xuICBzZWxmLmRhZW1vbkxpc3RlbmVyc1tsaXN0ZW5lcklkXSA9IGxpc3RlbmVyO1xuICBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG59XG5cbnNlbGYuZGFlbW9uUmVtb3ZlTGlzdGVuZXIgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgbGlzdGVuZXJJZCkge1xuICBpZiAoIXNlbGYuZGFlbW9uTGlzdGVuZXJzW2xpc3RlbmVySWRdKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJObyBkYWVtb24gd29ya2VyIGxpc3RlbmVyIHJlZ2lzdGVyZWQgd2l0aCBpZDogXCIgKyBsaXN0ZW5lcklkKTtcbiAgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0ucmVtb3ZlTGlzdGVuZXIoc2VsZi5kYWVtb25MaXN0ZW5lcnNbbGlzdGVuZXJJZF0pO1xuICBkZWxldGUgc2VsZi5kYWVtb25MaXN0ZW5lcnNbbGlzdGVuZXJJZF07XG59XG5cbnNlbGYuY29ubmVjdERhZW1vblJwYyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBjb25maWcpIHtcbiAgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0gPSBhd2FpdCBNb25lcm9EYWVtb25ScGMuY29ubmVjdFRvRGFlbW9uUnBjKG5ldyBNb25lcm9EYWVtb25Db25maWcoY29uZmlnKSk7XG59XG5cbnNlbGYuZGFlbW9uR2V0UnBjQ29ubmVjdGlvbiA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIGxldCBjb25uZWN0aW9uID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0UnBjQ29ubmVjdGlvbigpO1xuICByZXR1cm4gY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0Q29uZmlnKCkgOiB1bmRlZmluZWQ7XG59XG5cbnNlbGYuZGFlbW9uSXNDb25uZWN0ZWQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uaXNDb25uZWN0ZWQoKTtcbn1cblxuc2VsZi5kYWVtb25HZXRWZXJzaW9uID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRWZXJzaW9uKCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbklzVHJ1c3RlZCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5pc1RydXN0ZWQoKTtcbn1cblxuc2VsZi5kYWVtb25HZXRIZWlnaHQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0SGVpZ2h0KCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tIYXNoID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGhlaWdodCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tIYXNoKGhlaWdodCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tUZW1wbGF0ZSA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCB3YWxsZXRBZGRyZXNzLCByZXNlcnZlU2l6ZSkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2NrVGVtcGxhdGUod2FsbGV0QWRkcmVzcywgcmVzZXJ2ZVNpemUpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRMYXN0QmxvY2tIZWFkZXIgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldExhc3RCbG9ja0hlYWRlcigpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja0hlYWRlckJ5SGFzaCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBoYXNoKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tIZWFkZXJCeUhhc2goaGFzaCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2NrSGVhZGVyQnlIZWlnaHQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgaGVpZ2h0KSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tIZWFkZXJCeUhlaWdodChoZWlnaHQpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja0hlYWRlcnNCeVJhbmdlID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpIHtcbiAgbGV0IGJsb2NrSGVhZGVyc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgYmxvY2tIZWFkZXIgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tIZWFkZXJzQnlSYW5nZShzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSkgYmxvY2tIZWFkZXJzSnNvbi5wdXNoKGJsb2NrSGVhZGVyLnRvSnNvbigpKTtcbiAgcmV0dXJuIGJsb2NrSGVhZGVyc0pzb247XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tCeUhhc2ggPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgYmxvY2tIYXNoKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tCeUhhc2goYmxvY2tIYXNoKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tzQnlIYXNoID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGJsb2NrSGFzaGVzLCBzdGFydEhlaWdodCwgcHJ1bmUpIHtcbiAgbGV0IGJsb2Nrc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgYmxvY2sgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tzQnlIYXNoKGJsb2NrSGFzaGVzLCBzdGFydEhlaWdodCwgcHJ1bmUpKSBibG9ja3NKc29uLnB1c2goYmxvY2sudG9Kc29uKCkpO1xuICByZXR1cm4gYmxvY2tzSnNvbjtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja0J5SGVpZ2h0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGhlaWdodCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2NrQnlIZWlnaHQoaGVpZ2h0KSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tzQnlIZWlnaHQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgaGVpZ2h0cykge1xuICBsZXQgYmxvY2tzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBibG9jayBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja3NCeUhlaWdodChoZWlnaHRzKSkgYmxvY2tzSnNvbi5wdXNoKGJsb2NrLnRvSnNvbigpKTtcbiAgcmV0dXJuIGJsb2Nrc0pzb247XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tzQnlSYW5nZSA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSB7XG4gIGxldCBibG9ja3NKc29uID0gW107XG4gIGZvciAobGV0IGJsb2NrIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2Nrc0J5UmFuZ2Uoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCkpIGJsb2Nrc0pzb24ucHVzaChibG9jay50b0pzb24oKSk7XG4gIHJldHVybiBibG9ja3NKc29uO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2Nrc0J5UmFuZ2VDaHVua2VkID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIG1heENodW5rU2l6ZSkge1xuICBsZXQgYmxvY2tzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBibG9jayBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja3NCeVJhbmdlQ2h1bmtlZChzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBtYXhDaHVua1NpemUpKSBibG9ja3NKc29uLnB1c2goYmxvY2sudG9Kc29uKCkpO1xuICByZXR1cm4gYmxvY2tzSnNvbjtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja0hhc2hlcyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBibG9ja0hhc2hlcywgc3RhcnRIZWlnaHQpIHtcbiAgdGhyb3cgbmV3IEVycm9yKFwid29ya2VyLmdldEJsb2NrSGFzaGVzIG5vdCBpbXBsZW1lbnRlZFwiKTtcbn1cblxuLy8gVE9ETzogZmFjdG9yIGNvbW1vbiBjb2RlIHdpdGggc2VsZi5nZXRUeHMoKVxuc2VsZi5kYWVtb25HZXRUeHMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgdHhIYXNoZXMsIHBydW5lKSB7XG4gIFxuICAvLyBnZXQgdHhzXG4gIGxldCB0eHMgPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRUeHModHhIYXNoZXMsIHBydW5lKTtcbiAgXG4gIC8vIGNvbGxlY3QgdW5pcXVlIGJsb2NrcyB0byBwcmVzZXJ2ZSBtb2RlbCByZWxhdGlvbnNoaXBzIGFzIHRyZWVzIChiYXNlZCBvbiBtb25lcm9fd2FzbV9icmlkZ2UuY3BwOjpnZXRfdHhzKVxuICBsZXQgYmxvY2tzID0gW107XG4gIGxldCB1bmNvbmZpcm1lZEJsb2NrID0gdW5kZWZpbmVkXG4gIGxldCBzZWVuQmxvY2tzID0gbmV3IFNldCgpO1xuICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICBpZiAoIXR4LmdldEJsb2NrKCkpIHtcbiAgICAgIGlmICghdW5jb25maXJtZWRCbG9jaykgdW5jb25maXJtZWRCbG9jayA9IG5ldyBNb25lcm9CbG9jaygpLnNldFR4cyhbXSk7XG4gICAgICB0eC5zZXRCbG9jayh1bmNvbmZpcm1lZEJsb2NrKTtcbiAgICAgIHVuY29uZmlybWVkQmxvY2suZ2V0VHhzKCkucHVzaCh0eCk7XG4gICAgfVxuICAgIGlmICghc2VlbkJsb2Nrcy5oYXModHguZ2V0QmxvY2soKSkpIHtcbiAgICAgIHNlZW5CbG9ja3MuYWRkKHR4LmdldEJsb2NrKCkpO1xuICAgICAgYmxvY2tzLnB1c2godHguZ2V0QmxvY2soKSk7XG4gICAgfVxuICB9XG4gIFxuICAvLyBzZXJpYWxpemUgYmxvY2tzIHRvIGpzb25cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBibG9ja3MubGVuZ3RoOyBpKyspIGJsb2Nrc1tpXSA9IGJsb2Nrc1tpXS50b0pzb24oKTtcbiAgcmV0dXJuIGJsb2Nrcztcbn1cblxuc2VsZi5kYWVtb25HZXRUeEhleGVzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIHR4SGFzaGVzLCBwcnVuZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0VHhIZXhlcyh0eEhhc2hlcywgcHJ1bmUpO1xufVxuXG5zZWxmLmRhZW1vbkdldE1pbmVyVHhTdW0gPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgaGVpZ2h0LCBudW1CbG9ja3MpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRNaW5lclR4U3VtKGhlaWdodCwgbnVtQmxvY2tzKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0RmVlRXN0aW1hdGUgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgZ3JhY2VCbG9ja3MpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRGZWVFc3RpbWF0ZShncmFjZUJsb2NrcykpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vblN1Ym1pdFR4SGV4ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIHR4SGV4LCBkb05vdFJlbGF5KSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc3VibWl0VHhIZXgodHhIZXgsIGRvTm90UmVsYXkpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25SZWxheVR4c0J5SGFzaCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCB0eEhhc2hlcykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0ucmVsYXlUeHNCeUhhc2godHhIYXNoZXMpO1xufVxuXG5zZWxmLmRhZW1vbkdldFR4UG9vbCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIGxldCB0eHMgPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRUeFBvb2woKTtcbiAgbGV0IGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0VHhzKHR4cyk7XG4gIGZvciAobGV0IHR4IG9mIHR4cykgdHguc2V0QmxvY2soYmxvY2spXG4gIHJldHVybiBibG9jay50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRUeFBvb2xIYXNoZXMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0VHhQb29sSGFzaGVzKCk7XG59XG5cbi8vYXN5bmMgZ2V0VHhQb29sQmFja2xvZygpIHtcbi8vICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4vL31cblxuc2VsZi5kYWVtb25HZXRUeFBvb2xTdGF0cyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0VHhQb29sU3RhdHMoKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uRmx1c2hUeFBvb2wgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgaGFzaGVzKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5mbHVzaFR4UG9vbChoYXNoZXMpO1xufVxuXG5zZWxmLmRhZW1vbkdldEtleUltYWdlU3BlbnRTdGF0dXNlcyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBrZXlJbWFnZXMpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEtleUltYWdlU3BlbnRTdGF0dXNlcyhrZXlJbWFnZXMpO1xufVxuXG4vL1xuLy9hc3luYyBnZXRPdXRwdXRzKG91dHB1dHMpIHtcbi8vICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4vL31cblxuc2VsZi5kYWVtb25HZXRPdXRwdXRIaXN0b2dyYW0gPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgYW1vdW50cywgbWluQ291bnQsIG1heENvdW50LCBpc1VubG9ja2VkLCByZWNlbnRDdXRvZmYpIHtcbiAgbGV0IGVudHJpZXNKc29uID0gW107XG4gIGZvciAobGV0IGVudHJ5IG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldE91dHB1dEhpc3RvZ3JhbShhbW91bnRzLCBtaW5Db3VudCwgbWF4Q291bnQsIGlzVW5sb2NrZWQsIHJlY2VudEN1dG9mZikpIHtcbiAgICBlbnRyaWVzSnNvbi5wdXNoKGVudHJ5LnRvSnNvbigpKTtcbiAgfVxuICByZXR1cm4gZW50cmllc0pzb247XG59XG5cbi8vXG4vL2FzeW5jIGdldE91dHB1dERpc3RyaWJ1dGlvbihhbW91bnRzLCBjdW11bGF0aXZlLCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSB7XG4vLyAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuLy99XG5cbnNlbGYuZGFlbW9uR2V0SW5mbyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0SW5mbygpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRTeW5jSW5mbyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0U3luY0luZm8oKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0SGFyZEZvcmtJbmZvID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRIYXJkRm9ya0luZm8oKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0QWx0Q2hhaW5zID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgbGV0IGFsdENoYWluc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgYWx0Q2hhaW4gb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QWx0Q2hhaW5zKCkpIGFsdENoYWluc0pzb24ucHVzaChhbHRDaGFpbi50b0pzb24oKSk7XG4gIHJldHVybiBhbHRDaGFpbnNKc29uO1xufVxuXG5zZWxmLmRhZW1vbkdldEFsdEJsb2NrSGFzaGVzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEFsdEJsb2NrSGFzaGVzKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0RG93bmxvYWRMaW1pdCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXREb3dubG9hZExpbWl0KCk7XG59XG5cbnNlbGYuZGFlbW9uU2V0RG93bmxvYWRMaW1pdCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBsaW1pdCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc2V0RG93bmxvYWRMaW1pdChsaW1pdCk7XG59XG5cbnNlbGYuZGFlbW9uUmVzZXREb3dubG9hZExpbWl0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnJlc2V0RG93bmxvYWRMaW1pdCgpO1xufVxuXG5zZWxmLmRhZW1vbkdldFVwbG9hZExpbWl0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldFVwbG9hZExpbWl0KCk7XG59XG5cbnNlbGYuZGFlbW9uU2V0VXBsb2FkTGltaXQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgbGltaXQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnNldFVwbG9hZExpbWl0KGxpbWl0KTtcbn1cblxuc2VsZi5kYWVtb25SZXNldFVwbG9hZExpbWl0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnJlc2V0VXBsb2FkTGltaXQoKTtcbn1cblxuc2VsZi5kYWVtb25HZXRQZWVycyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIGxldCBwZWVyc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgcGVlciBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRQZWVycygpKSBwZWVyc0pzb24ucHVzaChwZWVyLnRvSnNvbigpKTtcbiAgcmV0dXJuIHBlZXJzSnNvbjtcbn1cblxuc2VsZi5kYWVtb25HZXRLbm93blBlZXJzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgbGV0IHBlZXJzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBwZWVyIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEtub3duUGVlcnMoKSkgcGVlcnNKc29uLnB1c2gocGVlci50b0pzb24oKSk7XG4gIHJldHVybiBwZWVyc0pzb247XG59XG5cbnNlbGYuZGFlbW9uU2V0T3V0Z29pbmdQZWVyTGltaXQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgbGltaXQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnNldE91dGdvaW5nUGVlckxpbWl0KGxpbWl0KTtcbn1cblxuc2VsZi5kYWVtb25TZXRJbmNvbWluZ1BlZXJMaW1pdCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBsaW1pdCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc2V0SW5jb21pbmdQZWVyTGltaXQobGltaXQpO1xufVxuXG5zZWxmLmRhZW1vbkdldFBlZXJCYW5zID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgbGV0IGJhbnNKc29uID0gW107XG4gIGZvciAobGV0IGJhbiBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRQZWVyQmFucygpKSBiYW5zSnNvbi5wdXNoKGJhbi50b0pzb24oKSk7XG4gIHJldHVybiBiYW5zSnNvbjtcbn1cblxuc2VsZi5kYWVtb25TZXRQZWVyQmFucyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBiYW5zSnNvbikge1xuICBsZXQgYmFucyA9IFtdO1xuICBmb3IgKGxldCBiYW5Kc29uIG9mIGJhbnNKc29uKSBiYW5zLnB1c2gobmV3IE1vbmVyb0JhbihiYW5Kc29uKSk7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5zZXRQZWVyQmFucyhiYW5zKTtcbn1cblxuc2VsZi5kYWVtb25TdGFydE1pbmluZyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBhZGRyZXNzLCBudW1UaHJlYWRzLCBpc0JhY2tncm91bmQsIGlnbm9yZUJhdHRlcnkpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnN0YXJ0TWluaW5nKGFkZHJlc3MsIG51bVRocmVhZHMsIGlzQmFja2dyb3VuZCwgaWdub3JlQmF0dGVyeSk7XG59XG5cbnNlbGYuZGFlbW9uU3RvcE1pbmluZyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5zdG9wTWluaW5nKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0TWluaW5nU3RhdHVzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRNaW5pbmdTdGF0dXMoKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uU3VibWl0QmxvY2tzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGJsb2NrQmxvYnMpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnN1Ym1pdEJsb2NrcyhibG9ja0Jsb2JzKTtcbn1cblxuc2VsZi5kYWVtb25QcnVuZUJsb2NrY2hhaW4gPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgY2hlY2spIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5wcnVuZUJsb2NrY2hhaW4oY2hlY2spKS50b0pzb24oKTtcbn1cblxuLy9hc3luYyBjaGVja0ZvclVwZGF0ZSgpIHtcbi8vICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4vL31cbi8vXG4vL2FzeW5jIGRvd25sb2FkVXBkYXRlKHBhdGgpIHtcbi8vICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4vL31cblxuc2VsZi5kYWVtb25TdG9wID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnN0b3AoKTtcbn1cblxuc2VsZi5kYWVtb25XYWl0Rm9yTmV4dEJsb2NrSGVhZGVyID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS53YWl0Rm9yTmV4dEJsb2NrSGVhZGVyKCkpLnRvSnNvbigpO1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBXQUxMRVQgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnNlbGYub3BlbldhbGxldERhdGEgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgcGF0aCwgcGFzc3dvcmQsIG5ldHdvcmtUeXBlLCBrZXlzRGF0YSwgY2FjaGVEYXRhLCBkYWVtb25VcmlPckNvbmZpZykge1xuICBsZXQgZGFlbW9uQ29ubmVjdGlvbiA9IGRhZW1vblVyaU9yQ29uZmlnID8gbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24oZGFlbW9uVXJpT3JDb25maWcpIDogdW5kZWZpbmVkO1xuICBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXSA9IGF3YWl0IE1vbmVyb1dhbGxldEZ1bGwub3BlbldhbGxldCh7cGF0aDogXCJcIiwgcGFzc3dvcmQ6IHBhc3N3b3JkLCBuZXR3b3JrVHlwZTogbmV0d29ya1R5cGUsIGtleXNEYXRhOiBrZXlzRGF0YSwgY2FjaGVEYXRhOiBjYWNoZURhdGEsIHNlcnZlcjogZGFlbW9uQ29ubmVjdGlvbiwgcHJveHlUb1dvcmtlcjogZmFsc2V9KTtcbiAgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2V0QnJvd3Nlck1haW5QYXRoKHBhdGgpO1xufVxuXG5zZWxmLmNyZWF0ZVdhbGxldEtleXMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgY29uZmlnSnNvbikge1xuICBsZXQgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyhjb25maWdKc29uKTtcbiAgY29uZmlnLnNldFByb3h5VG9Xb3JrZXIoZmFsc2UpO1xuICBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXSA9IGF3YWl0IE1vbmVyb1dhbGxldEtleXMuY3JlYXRlV2FsbGV0KGNvbmZpZyk7XG59XG5cbnNlbGYuY3JlYXRlV2FsbGV0RnVsbCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBjb25maWdKc29uKSB7XG4gIGxldCBjb25maWcgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKGNvbmZpZ0pzb24pO1xuICBsZXQgcGF0aCA9IGNvbmZpZy5nZXRQYXRoKCk7XG4gIGNvbmZpZy5zZXRQYXRoKFwiXCIpO1xuICBjb25maWcuc2V0UHJveHlUb1dvcmtlcihmYWxzZSk7XG4gIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdID0gYXdhaXQgTW9uZXJvV2FsbGV0RnVsbC5jcmVhdGVXYWxsZXQoY29uZmlnKTtcbiAgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2V0QnJvd3Nlck1haW5QYXRoKHBhdGgpO1xufVxuXG5zZWxmLmlzVmlld09ubHkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaXNWaWV3T25seSgpO1xufVxuXG5zZWxmLmdldE5ldHdvcmtUeXBlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldE5ldHdvcmtUeXBlKCk7XG59XG5cbi8vXG4vL2FzeW5jIGdldFZlcnNpb24oKSB7XG4vLyAgdGhyb3cgbmV3IEVycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuLy99XG5cbnNlbGYuZ2V0U2VlZCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRTZWVkKCk7XG59XG5cbnNlbGYuZ2V0U2VlZExhbmd1YWdlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFNlZWRMYW5ndWFnZSgpO1xufVxuXG5zZWxmLmdldFNlZWRMYW5ndWFnZXMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0U2VlZExhbmd1YWdlcygpO1xufVxuXG5zZWxmLmdldFByaXZhdGVTcGVuZEtleSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRQcml2YXRlU3BlbmRLZXkoKTtcbn1cblxuc2VsZi5nZXRQcml2YXRlVmlld0tleSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRQcml2YXRlVmlld0tleSgpO1xufVxuXG5zZWxmLmdldFB1YmxpY1ZpZXdLZXkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0UHVibGljVmlld0tleSgpO1xufVxuXG5zZWxmLmdldFB1YmxpY1NwZW5kS2V5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFB1YmxpY1NwZW5kS2V5KCk7XG59XG5cbnNlbGYuZ2V0QWRkcmVzcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRBZGRyZXNzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpO1xufVxuXG5zZWxmLmdldEFkZHJlc3NJbmRleCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhZGRyZXNzKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0QWRkcmVzc0luZGV4KGFkZHJlc3MpKS50b0pzb24oKTtcbn1cblxuc2VsZi5zZXRTdWJhZGRyZXNzTGFiZWwgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCwgbGFiZWwpIHtcbiAgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2V0U3ViYWRkcmVzc0xhYmVsKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIGxhYmVsKTtcbn1cblxuc2VsZi5nZXRJbnRlZ3JhdGVkQWRkcmVzcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBzdGFuZGFyZEFkZHJlc3MsIHBheW1lbnRJZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldEludGVncmF0ZWRBZGRyZXNzKHN0YW5kYXJkQWRkcmVzcywgcGF5bWVudElkKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgaW50ZWdyYXRlZEFkZHJlc3MpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5kZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyhpbnRlZ3JhdGVkQWRkcmVzcykpLnRvSnNvbigpO1xufVxuXG5zZWxmLnNldERhZW1vbkNvbm5lY3Rpb24gPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgY29uZmlnKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zZXREYWVtb25Db25uZWN0aW9uKGNvbmZpZyA/IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKE9iamVjdC5hc3NpZ24oY29uZmlnLCB7cHJveHlUb1dvcmtlcjogZmFsc2V9KSkgOiB1bmRlZmluZWQpO1xufVxuXG5zZWxmLmdldERhZW1vbkNvbm5lY3Rpb24gPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICBsZXQgY29ubmVjdGlvbiA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldERhZW1vbkNvbm5lY3Rpb24oKTtcbiAgcmV0dXJuIGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldENvbmZpZygpIDogdW5kZWZpbmVkO1xufVxuXG5zZWxmLmlzQ29ubmVjdGVkVG9EYWVtb24gPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaXNDb25uZWN0ZWRUb0RhZW1vbigpO1xufVxuXG5zZWxmLmdldFJlc3RvcmVIZWlnaHQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0UmVzdG9yZUhlaWdodCgpO1xufVxuXG5zZWxmLnNldFJlc3RvcmVIZWlnaHQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgcmVzdG9yZUhlaWdodCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2V0UmVzdG9yZUhlaWdodChyZXN0b3JlSGVpZ2h0KTtcbn1cblxuc2VsZi5nZXREYWVtb25IZWlnaHQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0RGFlbW9uSGVpZ2h0KCk7XG59XG5cbnNlbGYuZ2V0RGFlbW9uTWF4UGVlckhlaWdodCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXREYWVtb25NYXhQZWVySGVpZ2h0KClcbn1cblxuc2VsZi5nZXRIZWlnaHRCeURhdGUgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgeWVhciwgbW9udGgsIGRheSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0SGVpZ2h0QnlEYXRlKHllYXIsIG1vbnRoLCBkYXkpO1xufVxuXG5zZWxmLmlzRGFlbW9uU3luY2VkID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmlzRGFlbW9uU3luY2VkKCk7XG59XG5cbnNlbGYuZ2V0SGVpZ2h0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldEhlaWdodCgpO1xufVxuXG5zZWxmLmFkZExpc3RlbmVyID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGxpc3RlbmVySWQpIHtcbiAgXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBsaXN0ZW5lciB0byBicmlkZ2Ugbm90aWZpY2F0aW9ucyB0byBleHRlcm5hbCBsaXN0ZW5lcnMuXG4gICAqIFxuICAgKiBUT0RPOiBNb25lcm9XYWxsZXRMaXN0ZW5lciBpcyBub3QgZGVmaW5lZCB1bnRpbCBzY3JpcHRzIGltcG9ydGVkXG4gICAqIFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgY2xhc3MgV2FsbGV0V29ya2VySGVscGVyTGlzdGVuZXIgZXh0ZW5kcyBNb25lcm9XYWxsZXRMaXN0ZW5lciB7XG5cbiAgICBwcm90ZWN0ZWQgd2FsbGV0SWQ6IHN0cmluZztcbiAgICBwcm90ZWN0ZWQgaWQ6IHN0cmluZztcbiAgICBwcm90ZWN0ZWQgd29ya2VyOiBXb3JrZXI7XG4gICAgXG4gICAgY29uc3RydWN0b3Iod2FsbGV0SWQsIGlkLCB3b3JrZXIpIHtcbiAgICAgIHN1cGVyKCk7XG4gICAgICB0aGlzLndhbGxldElkID0gd2FsbGV0SWQ7XG4gICAgICB0aGlzLmlkID0gaWQ7XG4gICAgICB0aGlzLndvcmtlciA9IHdvcmtlcjtcbiAgICB9XG4gICAgXG4gICAgZ2V0SWQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5pZDtcbiAgICB9XG4gICAgXG4gICAgYXN5bmMgb25TeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSkge1xuICAgICAgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2UoW3RoaXMud2FsbGV0SWQsIFwib25TeW5jUHJvZ3Jlc3NfXCIgKyB0aGlzLmdldElkKCksIGhlaWdodCwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgcGVyY2VudERvbmUsIG1lc3NhZ2VdKTtcbiAgICB9XG5cbiAgICBhc3luYyBvbk5ld0Jsb2NrKGhlaWdodCkgeyBcbiAgICAgIHRoaXMud29ya2VyLnBvc3RNZXNzYWdlKFt0aGlzLndhbGxldElkLCBcIm9uTmV3QmxvY2tfXCIgKyB0aGlzLmdldElkKCksIGhlaWdodF0pO1xuICAgIH1cbiAgICBcbiAgICBhc3luYyBvbkJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlLCBuZXdVbmxvY2tlZEJhbGFuY2UpIHtcbiAgICAgIHRoaXMud29ya2VyLnBvc3RNZXNzYWdlKFt0aGlzLndhbGxldElkLCBcIm9uQmFsYW5jZXNDaGFuZ2VkX1wiICsgdGhpcy5nZXRJZCgpLCBuZXdCYWxhbmNlLnRvU3RyaW5nKCksIG5ld1VubG9ja2VkQmFsYW5jZS50b1N0cmluZygpXSk7XG4gICAgfVxuXG4gICBhc3luYyBvbk91dHB1dFJlY2VpdmVkKG91dHB1dCkge1xuICAgICAgbGV0IGJsb2NrID0gb3V0cHV0LmdldFR4KCkuZ2V0QmxvY2soKTtcbiAgICAgIGlmIChibG9jayA9PT0gdW5kZWZpbmVkKSBibG9jayA9IG5ldyBNb25lcm9CbG9jaygpLnNldFR4cyhbb3V0cHV0LmdldFR4KCldKTtcbiAgICAgIHRoaXMud29ya2VyLnBvc3RNZXNzYWdlKFt0aGlzLndhbGxldElkLCBcIm9uT3V0cHV0UmVjZWl2ZWRfXCIgKyB0aGlzLmdldElkKCksIGJsb2NrLnRvSnNvbigpXSk7ICAvLyBzZXJpYWxpemUgZnJvbSByb290IGJsb2NrXG4gICAgfVxuICAgIFxuICAgIGFzeW5jIG9uT3V0cHV0U3BlbnQob3V0cHV0KSB7XG4gICAgICBsZXQgYmxvY2sgPSBvdXRwdXQuZ2V0VHgoKS5nZXRCbG9jaygpO1xuICAgICAgaWYgKGJsb2NrID09PSB1bmRlZmluZWQpIGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0VHhzKFtvdXRwdXQuZ2V0VHgoKV0pO1xuICAgICAgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2UoW3RoaXMud2FsbGV0SWQsIFwib25PdXRwdXRTcGVudF9cIiArIHRoaXMuZ2V0SWQoKSwgYmxvY2sudG9Kc29uKCldKTsgICAgIC8vIHNlcmlhbGl6ZSBmcm9tIHJvb3QgYmxvY2tcbiAgICB9XG4gIH1cbiAgXG4gIGxldCBsaXN0ZW5lciA9IG5ldyBXYWxsZXRXb3JrZXJIZWxwZXJMaXN0ZW5lcih3YWxsZXRJZCwgbGlzdGVuZXJJZCwgc2VsZik7XG4gIGlmICghc2VsZi5saXN0ZW5lcnMpIHNlbGYubGlzdGVuZXJzID0gW107XG4gIHNlbGYubGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuICBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG59XG5cbnNlbGYucmVtb3ZlTGlzdGVuZXIgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbGlzdGVuZXJJZCkge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGYubGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHNlbGYubGlzdGVuZXJzW2ldLmdldElkKCkgIT09IGxpc3RlbmVySWQpIGNvbnRpbnVlO1xuICAgIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnJlbW92ZUxpc3RlbmVyKHNlbGYubGlzdGVuZXJzW2ldKTtcbiAgICBzZWxmLmxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkxpc3RlbmVyIGlzIG5vdCByZWdpc3RlcmVkIHdpdGggd2FsbGV0XCIpO1xufVxuXG5zZWxmLmlzU3luY2VkID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmlzU3luY2VkKCk7XG59XG5cbnNlbGYuc3luYyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBzdGFydEhlaWdodCwgYWxsb3dDb25jdXJyZW50Q2FsbHMpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zeW5jKHVuZGVmaW5lZCwgc3RhcnRIZWlnaHQsIGFsbG93Q29uY3VycmVudENhbGxzKSk7XG59XG5cbnNlbGYuc3RhcnRTeW5jaW5nID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHN5bmNQZXJpb2RJbk1zKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zdGFydFN5bmNpbmcoc3luY1BlcmlvZEluTXMpO1xufVxuXG5zZWxmLnN0b3BTeW5jaW5nID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN0b3BTeW5jaW5nKCk7XG59XG5cbnNlbGYuc2NhblR4cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eEhhc2hlcykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2NhblR4cyh0eEhhc2hlcyk7XG59XG5cbnNlbGYucmVzY2FuU3BlbnQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0ucmVzY2FuU3BlbnQoKTtcbn1cblxuc2VsZi5yZXNjYW5CbG9ja2NoYWluID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnJlc2NhbkJsb2NrY2hhaW4oKTtcbn1cblxuc2VsZi5nZXRCYWxhbmNlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRCYWxhbmNlKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpKS50b1N0cmluZygpO1xufVxuXG5zZWxmLmdldFVubG9ja2VkQmFsYW5jZSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0VW5sb2NrZWRCYWxhbmNlKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpKS50b1N0cmluZygpO1xufVxuXG5zZWxmLmdldEFjY291bnRzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGluY2x1ZGVTdWJhZGRyZXNzZXMsIHRhZykge1xuICBsZXQgYWNjb3VudEpzb25zID0gW107XG4gIGZvciAobGV0IGFjY291bnQgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0QWNjb3VudHMoaW5jbHVkZVN1YmFkZHJlc3NlcywgdGFnKSkgYWNjb3VudEpzb25zLnB1c2goYWNjb3VudC50b0pzb24oKSk7XG4gIHJldHVybiBhY2NvdW50SnNvbnM7XG59XG5cbnNlbGYuZ2V0QWNjb3VudCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SWR4LCBpbmNsdWRlU3ViYWRkcmVzc2VzKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0QWNjb3VudChhY2NvdW50SWR4LCBpbmNsdWRlU3ViYWRkcmVzc2VzKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuY3JlYXRlQWNjb3VudCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBsYWJlbCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmNyZWF0ZUFjY291bnQobGFiZWwpKS50b0pzb24oKTtcbn1cblxuc2VsZi5nZXRTdWJhZGRyZXNzZXMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0luZGljZXMpIHtcbiAgbGV0IHN1YmFkZHJlc3NKc29ucyA9IFtdO1xuICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSW5kaWNlcykpIHN1YmFkZHJlc3NKc29ucy5wdXNoKHN1YmFkZHJlc3MudG9Kc29uKCkpO1xuICByZXR1cm4gc3ViYWRkcmVzc0pzb25zO1xufVxuXG5zZWxmLmNyZWF0ZVN1YmFkZHJlc3MgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWNjb3VudElkeCwgbGFiZWwpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jcmVhdGVTdWJhZGRyZXNzKGFjY291bnRJZHgsIGxhYmVsKSkudG9Kc29uKCk7XG59XG5cbi8vIFRPRE86IGVhc2llciBvciBtb3JlIGVmZmljaWVudCB3YXkgdGhhbiBzZXJpYWxpemluZyBmcm9tIHJvb3QgYmxvY2tzP1xuc2VsZi5nZXRUeHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYmxvY2tKc29uUXVlcnkpIHtcbiAgXG4gIC8vIGRlc2VyaWFsaXplIHF1ZXJ5IHdoaWNoIGlzIGpzb24gc3RyaW5nIHJvb3RlZCBhdCBibG9ja1xuICBsZXQgcXVlcnkgPSBuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uUXVlcnksIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFhfUVVFUlkpLmdldFR4cygpWzBdO1xuICBcbiAgLy8gZ2V0IHR4c1xuICBsZXQgdHhzID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0VHhzKHF1ZXJ5KTtcbiAgXG4gIC8vIGNvbGxlY3QgdW5pcXVlIGJsb2NrcyB0byBwcmVzZXJ2ZSBtb2RlbCByZWxhdGlvbnNoaXBzIGFzIHRyZWVzIChiYXNlZCBvbiBtb25lcm9fd2FzbV9icmlkZ2UuY3BwOjpnZXRfdHhzKVxuICBsZXQgc2VlbkJsb2NrcyA9IG5ldyBTZXQoKTtcbiAgbGV0IHVuY29uZmlybWVkQmxvY2sgPSB1bmRlZmluZWQ7XG4gIGxldCBibG9ja3MgPSBbXTtcbiAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgaWYgKCF0eC5nZXRCbG9jaygpKSB7XG4gICAgICBpZiAoIXVuY29uZmlybWVkQmxvY2spIHVuY29uZmlybWVkQmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soKS5zZXRUeHMoW10pO1xuICAgICAgdHguc2V0QmxvY2sodW5jb25maXJtZWRCbG9jayk7XG4gICAgICB1bmNvbmZpcm1lZEJsb2NrLmdldFR4cygpLnB1c2godHgpO1xuICAgIH1cbiAgICBpZiAoIXNlZW5CbG9ja3MuaGFzKHR4LmdldEJsb2NrKCkpKSB7XG4gICAgICBzZWVuQmxvY2tzLmFkZCh0eC5nZXRCbG9jaygpKTtcbiAgICAgIGJsb2Nrcy5wdXNoKHR4LmdldEJsb2NrKCkpO1xuICAgIH1cbiAgfVxuICBcbiAgLy8gc2VyaWFsaXplIGJsb2NrcyB0byBqc29uXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYmxvY2tzLmxlbmd0aDsgaSsrKSBibG9ja3NbaV0gPSBibG9ja3NbaV0udG9Kc29uKCk7XG4gIHJldHVybiB7YmxvY2tzOiBibG9ja3N9O1xufVxuXG5zZWxmLmdldFRyYW5zZmVycyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBibG9ja0pzb25RdWVyeSkge1xuICBcbiAgLy8gZGVzZXJpYWxpemUgcXVlcnkgd2hpY2ggaXMganNvbiBzdHJpbmcgcm9vdGVkIGF0IGJsb2NrXG4gIGxldCBxdWVyeSA9IChuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uUXVlcnksIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFhfUVVFUlkpLmdldFR4cygpWzBdIGFzIE1vbmVyb1R4UXVlcnkpLmdldFRyYW5zZmVyUXVlcnkoKTtcbiAgXG4gIC8vIGdldCB0cmFuc2ZlcnNcbiAgbGV0IHRyYW5zZmVycyA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFRyYW5zZmVycyhxdWVyeSk7XG4gIFxuICAvLyBjb2xsZWN0IHVuaXF1ZSBibG9ja3MgdG8gcHJlc2VydmUgbW9kZWwgcmVsYXRpb25zaGlwcyBhcyB0cmVlXG4gIGxldCB1bmNvbmZpcm1lZEJsb2NrID0gdW5kZWZpbmVkO1xuICBsZXQgYmxvY2tzID0gW107XG4gIGxldCBzZWVuQmxvY2tzID0gbmV3IFNldCgpO1xuICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0cmFuc2ZlcnMpIHtcbiAgICBsZXQgdHggPSB0cmFuc2Zlci5nZXRUeCgpO1xuICAgIGlmICghdHguZ2V0QmxvY2soKSkge1xuICAgICAgaWYgKCF1bmNvbmZpcm1lZEJsb2NrKSB1bmNvbmZpcm1lZEJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0VHhzKFtdKTtcbiAgICAgIHR4LnNldEJsb2NrKHVuY29uZmlybWVkQmxvY2spO1xuICAgICAgdW5jb25maXJtZWRCbG9jay5nZXRUeHMoKS5wdXNoKHR4KTtcbiAgICB9XG4gICAgaWYgKCFzZWVuQmxvY2tzLmhhcyh0eC5nZXRCbG9jaygpKSkge1xuICAgICAgc2VlbkJsb2Nrcy5hZGQodHguZ2V0QmxvY2soKSk7XG4gICAgICBibG9ja3MucHVzaCh0eC5nZXRCbG9jaygpKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIHNlcmlhbGl6ZSBibG9ja3MgdG8ganNvblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGJsb2Nrcy5sZW5ndGg7IGkrKykgYmxvY2tzW2ldID0gYmxvY2tzW2ldLnRvSnNvbigpO1xuICByZXR1cm4gYmxvY2tzO1xufVxuXG5zZWxmLmdldE91dHB1dHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYmxvY2tKc29uUXVlcnkpIHtcblxuICAvLyBkZXNlcmlhbGl6ZSBxdWVyeSB3aGljaCBpcyBqc29uIHN0cmluZyByb290ZWQgYXQgYmxvY2tcbiAgbGV0IHF1ZXJ5ID0gKG5ldyBNb25lcm9CbG9jayhibG9ja0pzb25RdWVyeSwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWF9RVUVSWSkuZ2V0VHhzKClbMF0gYXMgTW9uZXJvVHhRdWVyeSkuZ2V0T3V0cHV0UXVlcnkoKTtcbiAgXG4gIC8vIGdldCBvdXRwdXRzXG4gIGxldCBvdXRwdXRzID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0T3V0cHV0cyhxdWVyeSk7XG4gIFxuICAvLyBjb2xsZWN0IHVuaXF1ZSBibG9ja3MgdG8gcHJlc2VydmUgbW9kZWwgcmVsYXRpb25zaGlwcyBhcyB0cmVlXG4gIGxldCB1bmNvbmZpcm1lZEJsb2NrID0gdW5kZWZpbmVkO1xuICBsZXQgYmxvY2tzID0gW107XG4gIGxldCBzZWVuQmxvY2tzID0gbmV3IFNldCgpO1xuICBmb3IgKGxldCBvdXRwdXQgb2Ygb3V0cHV0cykge1xuICAgIGxldCB0eCA9IG91dHB1dC5nZXRUeCgpO1xuICAgIGlmICghdHguZ2V0QmxvY2soKSkge1xuICAgICAgaWYgKCF1bmNvbmZpcm1lZEJsb2NrKSB1bmNvbmZpcm1lZEJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0VHhzKFtdKTtcbiAgICAgIHR4LnNldEJsb2NrKHVuY29uZmlybWVkQmxvY2spO1xuICAgICAgdW5jb25maXJtZWRCbG9jay5nZXRUeHMoKS5wdXNoKHR4KTtcbiAgICB9XG4gICAgaWYgKCFzZWVuQmxvY2tzLmhhcyh0eC5nZXRCbG9jaygpKSkge1xuICAgICAgc2VlbkJsb2Nrcy5hZGQodHguZ2V0QmxvY2soKSk7XG4gICAgICBibG9ja3MucHVzaCh0eC5nZXRCbG9jaygpKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIHNlcmlhbGl6ZSBibG9ja3MgdG8ganNvblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGJsb2Nrcy5sZW5ndGg7IGkrKykgYmxvY2tzW2ldID0gYmxvY2tzW2ldLnRvSnNvbigpO1xuICByZXR1cm4gYmxvY2tzO1xufVxuXG5zZWxmLmV4cG9ydE91dHB1dHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWxsKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5leHBvcnRPdXRwdXRzKGFsbCk7XG59XG5cbnNlbGYuaW1wb3J0T3V0cHV0cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBvdXRwdXRzSGV4KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pbXBvcnRPdXRwdXRzKG91dHB1dHNIZXgpO1xufVxuXG5zZWxmLmdldEtleUltYWdlcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhbGwpIHtcbiAgbGV0IGtleUltYWdlc0pzb24gPSBbXTtcbiAgZm9yIChsZXQga2V5SW1hZ2Ugb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZXhwb3J0S2V5SW1hZ2VzKGFsbCkpIGtleUltYWdlc0pzb24ucHVzaChrZXlJbWFnZS50b0pzb24oKSk7XG4gIHJldHVybiBrZXlJbWFnZXNKc29uO1xufVxuXG5zZWxmLmltcG9ydEtleUltYWdlcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBrZXlJbWFnZXNKc29uKSB7XG4gIGxldCBrZXlJbWFnZXMgPSBbXTtcbiAgZm9yIChsZXQga2V5SW1hZ2VKc29uIG9mIGtleUltYWdlc0pzb24pIGtleUltYWdlcy5wdXNoKG5ldyBNb25lcm9LZXlJbWFnZShrZXlJbWFnZUpzb24pKTtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pbXBvcnRLZXlJbWFnZXMoa2V5SW1hZ2VzKSkudG9Kc29uKCk7XG59XG5cbi8vYXN5bmMgZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQoKSB7XG4vLyAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuLy99XG5cbnNlbGYuZnJlZXplT3V0cHV0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGtleUltYWdlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5mcmVlemVPdXRwdXQoa2V5SW1hZ2UpO1xufVxuXG5zZWxmLnRoYXdPdXRwdXQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwga2V5SW1hZ2UpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnRoYXdPdXRwdXQoa2V5SW1hZ2UpO1xufVxuXG5zZWxmLmlzT3V0cHV0RnJvemVuID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGtleUltYWdlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pc091dHB1dEZyb3plbihrZXlJbWFnZSk7XG59XG5cbnNlbGYuZ2V0RGVmYXVsdEZlZVByaW9yaXR5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldERlZmF1bHRGZWVQcmlvcml0eSgpO1xufVxuXG5zZWxmLmNyZWF0ZVR4cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBjb25maWcpIHtcbiAgaWYgKHR5cGVvZiBjb25maWcgPT09IFwib2JqZWN0XCIpIGNvbmZpZyA9IG5ldyBNb25lcm9UeENvbmZpZyhjb25maWcpO1xuICBsZXQgdHhzID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uY3JlYXRlVHhzKGNvbmZpZyk7XG4gIHJldHVybiB0eHNbMF0uZ2V0VHhTZXQoKS50b0pzb24oKTtcbn1cblxuc2VsZi5zd2VlcE91dHB1dCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBjb25maWcpIHtcbiAgaWYgKHR5cGVvZiBjb25maWcgPT09IFwib2JqZWN0XCIpIGNvbmZpZyA9IG5ldyBNb25lcm9UeENvbmZpZyhjb25maWcpO1xuICBsZXQgdHggPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zd2VlcE91dHB1dChjb25maWcpO1xuICByZXR1cm4gdHguZ2V0VHhTZXQoKS50b0pzb24oKTtcbn1cblxuc2VsZi5zd2VlcFVubG9ja2VkID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGNvbmZpZykge1xuICBpZiAodHlwZW9mIGNvbmZpZyA9PT0gXCJvYmplY3RcIikgY29uZmlnID0gbmV3IE1vbmVyb1R4Q29uZmlnKGNvbmZpZyk7XG4gIGxldCB0eHMgPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zd2VlcFVubG9ja2VkKGNvbmZpZyk7XG4gIGxldCB0eFNldHMgPSBbXTtcbiAgZm9yIChsZXQgdHggb2YgdHhzKSBpZiAoIUdlblV0aWxzLmFycmF5Q29udGFpbnModHhTZXRzLCB0eC5nZXRUeFNldCgpKSkgdHhTZXRzLnB1c2godHguZ2V0VHhTZXQoKSk7XG4gIGxldCB0eFNldHNKc29uID0gW107XG4gIGZvciAobGV0IHR4U2V0IG9mIHR4U2V0cykgdHhTZXRzSnNvbi5wdXNoKHR4U2V0LnRvSnNvbigpKTtcbiAgcmV0dXJuIHR4U2V0c0pzb247XG59XG5cbnNlbGYuc3dlZXBEdXN0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHJlbGF5KSB7XG4gIGxldCB0eHMgPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zd2VlcER1c3QocmVsYXkpO1xuICByZXR1cm4gdHhzLmxlbmd0aCA9PT0gMCA/IHt9IDogdHhzWzBdLmdldFR4U2V0KCkudG9Kc29uKCk7XG59XG5cbnNlbGYucmVsYXlUeHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdHhNZXRhZGF0YXMpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnJlbGF5VHhzKHR4TWV0YWRhdGFzKTtcbn1cblxuc2VsZi5kZXNjcmliZVR4U2V0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4U2V0SnNvbikge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmRlc2NyaWJlVHhTZXQobmV3IE1vbmVyb1R4U2V0KHR4U2V0SnNvbikpKS50b0pzb24oKTtcbn1cblxuc2VsZi5zaWduVHhzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHVuc2lnbmVkVHhIZXgpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnNpZ25UeHModW5zaWduZWRUeEhleCk7XG59XG5cbnNlbGYuc3VibWl0VHhzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHNpZ25lZFR4SGV4KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zdWJtaXRUeHMoc2lnbmVkVHhIZXgpO1xufVxuXG5zZWxmLnNpZ25NZXNzYWdlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG1lc3NhZ2UsIHNpZ25hdHVyZVR5cGUsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnNpZ25NZXNzYWdlKG1lc3NhZ2UsIHNpZ25hdHVyZVR5cGUsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpO1xufVxuXG5zZWxmLnZlcmlmeU1lc3NhZ2UgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbWVzc2FnZSwgYWRkcmVzcywgc2lnbmF0dXJlKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0udmVyaWZ5TWVzc2FnZShtZXNzYWdlLCBhZGRyZXNzLCBzaWduYXR1cmUpKS50b0pzb24oKTtcbn1cblxuc2VsZi5nZXRUeEtleSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eEhhc2gpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFR4S2V5KHR4SGFzaCk7XG59XG5cbnNlbGYuY2hlY2tUeEtleSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eEhhc2gsIHR4S2V5LCBhZGRyZXNzKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uY2hlY2tUeEtleSh0eEhhc2gsIHR4S2V5LCBhZGRyZXNzKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZ2V0VHhQcm9vZiA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFR4UHJvb2YodHhIYXNoLCBhZGRyZXNzLCBtZXNzYWdlKTtcbn1cblxuc2VsZi5jaGVja1R4UHJvb2YgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdHhIYXNoLCBhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jaGVja1R4UHJvb2YodHhIYXNoLCBhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUpKS50b0pzb24oKTtcbn1cblxuc2VsZi5nZXRTcGVuZFByb29mID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaCwgbWVzc2FnZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0U3BlbmRQcm9vZih0eEhhc2gsIG1lc3NhZ2UpO1xufVxuXG5zZWxmLmNoZWNrU3BlbmRQcm9vZiA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eEhhc2gsIG1lc3NhZ2UsIHNpZ25hdHVyZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uY2hlY2tTcGVuZFByb29mKHR4SGFzaCwgbWVzc2FnZSwgc2lnbmF0dXJlKTtcbn1cblxuc2VsZi5nZXRSZXNlcnZlUHJvb2ZXYWxsZXQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbWVzc2FnZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0UmVzZXJ2ZVByb29mV2FsbGV0KG1lc3NhZ2UpO1xufVxuXG5zZWxmLmdldFJlc2VydmVQcm9vZkFjY291bnQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWNjb3VudElkeCwgYW1vdW50U3RyLCBtZXNzYWdlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRSZXNlcnZlUHJvb2ZBY2NvdW50KGFjY291bnRJZHgsIGFtb3VudFN0ciwgbWVzc2FnZSk7XG59XG5cbnNlbGYuY2hlY2tSZXNlcnZlUHJvb2YgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uY2hlY2tSZXNlcnZlUHJvb2YoYWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZ2V0VHhOb3RlcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eEhhc2hlcykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0VHhOb3Rlcyh0eEhhc2hlcyk7XG59XG5cbnNlbGYuc2V0VHhOb3RlcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eEhhc2hlcywgdHhOb3Rlcykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2V0VHhOb3Rlcyh0eEhhc2hlcywgdHhOb3Rlcyk7XG59XG5cbnNlbGYuZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGVudHJ5SW5kaWNlcykge1xuICBsZXQgZW50cmllc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgZW50cnkgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzKGVudHJ5SW5kaWNlcykpIGVudHJpZXNKc29uLnB1c2goZW50cnkudG9Kc29uKCkpO1xuICByZXR1cm4gZW50cmllc0pzb247XG59XG5cbnNlbGYuYWRkQWRkcmVzc0Jvb2tFbnRyeSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhZGRyZXNzLCBkZXNjcmlwdGlvbikge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uYWRkQWRkcmVzc0Jvb2tFbnRyeShhZGRyZXNzLCBkZXNjcmlwdGlvbik7XG59XG5cbnNlbGYuZWRpdEFkZHJlc3NCb29rRW50cnkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgaW5kZXgsIHNldEFkZHJlc3MsIGFkZHJlc3MsIHNldERlc2NyaXB0aW9uLCBkZXNjcmlwdGlvbikge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZWRpdEFkZHJlc3NCb29rRW50cnkoaW5kZXgsIHNldEFkZHJlc3MsIGFkZHJlc3MsIHNldERlc2NyaXB0aW9uLCBkZXNjcmlwdGlvbik7XG59XG5cbnNlbGYuZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBpbmRleCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeShpbmRleCk7XG59XG5cbnNlbGYudGFnQWNjb3VudHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdGFnLCBhY2NvdW50SW5kaWNlcykge1xuICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG59XG5cbnNlbGYudW50YWdBY2NvdW50cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SW5kaWNlcykge1xuICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG59XG5cbnNlbGYuZ2V0QWNjb3VudFRhZ3MgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG59XG5cbnNlbGYuc2V0QWNjb3VudFRhZ0xhYmVsID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHRhZywgbGFiZWwpIHtcbiAgdGhyb3cgbmV3IEVycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xufVxuXG5zZWxmLmdldFBheW1lbnRVcmkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgY29uZmlnSnNvbikge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0UGF5bWVudFVyaShuZXcgTW9uZXJvVHhDb25maWcoY29uZmlnSnNvbikpO1xufVxuXG5zZWxmLnBhcnNlUGF5bWVudFVyaSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB1cmkpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5wYXJzZVBheW1lbnRVcmkodXJpKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZ2V0QXR0cmlidXRlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGtleSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0QXR0cmlidXRlKGtleSk7XG59XG5cbnNlbGYuc2V0QXR0cmlidXRlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGtleSwgdmFsdWUpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnNldEF0dHJpYnV0ZShrZXksIHZhbHVlKTtcbn1cblxuc2VsZi5zdGFydE1pbmluZyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBudW1UaHJlYWRzLCBiYWNrZ3JvdW5kTWluaW5nLCBpZ25vcmVCYXR0ZXJ5KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zdGFydE1pbmluZyhudW1UaHJlYWRzLCBiYWNrZ3JvdW5kTWluaW5nLCBpZ25vcmVCYXR0ZXJ5KTtcbn1cblxuc2VsZi5zdG9wTWluaW5nID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN0b3BNaW5pbmcoKTtcbn1cblxuc2VsZi5pc011bHRpc2lnSW1wb3J0TmVlZGVkID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmlzTXVsdGlzaWdJbXBvcnROZWVkZWQoKTtcbn1cblxuc2VsZi5pc011bHRpc2lnID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmlzTXVsdGlzaWcoKTtcbn1cblxuc2VsZi5nZXRNdWx0aXNpZ0luZm8gPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldE11bHRpc2lnSW5mbygpKS50b0pzb24oKTtcbn1cblxuc2VsZi5wcmVwYXJlTXVsdGlzaWcgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0ucHJlcGFyZU11bHRpc2lnKCk7XG59XG5cbnNlbGYubWFrZU11bHRpc2lnID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG11bHRpc2lnSGV4ZXMsIHRocmVzaG9sZCwgcGFzc3dvcmQpIHtcbiAgcmV0dXJuIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLm1ha2VNdWx0aXNpZyhtdWx0aXNpZ0hleGVzLCB0aHJlc2hvbGQsIHBhc3N3b3JkKTtcbn1cblxuc2VsZi5leGNoYW5nZU11bHRpc2lnS2V5cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBtdWx0aXNpZ0hleGVzLCBwYXNzd29yZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmV4Y2hhbmdlTXVsdGlzaWdLZXlzKG11bHRpc2lnSGV4ZXMsIHBhc3N3b3JkKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZXhwb3J0TXVsdGlzaWdIZXggPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZXhwb3J0TXVsdGlzaWdIZXgoKTtcbn1cblxuc2VsZi5pbXBvcnRNdWx0aXNpZ0hleCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBtdWx0aXNpZ0hleGVzLCByZWZyZXNoQWZ0ZXJJbXBvcnQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmltcG9ydE11bHRpc2lnSGV4KG11bHRpc2lnSGV4ZXMsIHJlZnJlc2hBZnRlckltcG9ydCk7XG59XG5cbnNlbGYuc2lnbk11bHRpc2lnVHhIZXggPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbXVsdGlzaWdUeEhleCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnNpZ25NdWx0aXNpZ1R4SGV4KG11bHRpc2lnVHhIZXgpKS50b0pzb24oKTtcbn1cblxuc2VsZi5zdWJtaXRNdWx0aXNpZ1R4SGV4ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHNpZ25lZE11bHRpc2lnVHhIZXgpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN1Ym1pdE11bHRpc2lnVHhIZXgoc2lnbmVkTXVsdGlzaWdUeEhleCk7XG59XG5cbnNlbGYuZ2V0RGF0YSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXREYXRhKCk7XG59XG5cbnNlbGYuY2hhbmdlUGFzc3dvcmQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgb2xkUGFzc3dvcmQsIG5ld1Bhc3N3b3JkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jaGFuZ2VQYXNzd29yZChvbGRQYXNzd29yZCwgbmV3UGFzc3dvcmQpO1xufVxuXG5zZWxmLmlzQ2xvc2VkID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuICFzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXSB8fCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pc0Nsb3NlZCgpO1xufVxuXG5zZWxmLmNsb3NlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHNhdmUpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmNsb3NlKHNhdmUpO1xuICBkZWxldGUgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF07XG59Il0sIm1hcHBpbmdzIjoia0dBQUEsSUFBQUEsT0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFB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