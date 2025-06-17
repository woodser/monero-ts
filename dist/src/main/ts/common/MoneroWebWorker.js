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

self.importMultisigHex = async function (walletId, multisigHexes) {
  return self.WORKER_OBJECTS[walletId].importMultisigHex(multisigHexes);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfSHR0cENsaWVudCIsIl9MaWJyYXJ5VXRpbHMiLCJfTW9uZXJvQmFuIiwiX01vbmVyb0Jsb2NrIiwiX01vbmVyb0RhZW1vbkNvbmZpZyIsIl9Nb25lcm9EYWVtb25MaXN0ZW5lciIsIl9Nb25lcm9EYWVtb25ScGMiLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvS2V5SW1hZ2UiLCJfTW9uZXJvUnBjQ29ubmVjdGlvbiIsIl9Nb25lcm9UeENvbmZpZyIsIl9Nb25lcm9UeFNldCIsIl9Nb25lcm9VdGlscyIsIl9Nb25lcm9XYWxsZXRDb25maWciLCJfTW9uZXJvV2FsbGV0TGlzdGVuZXIiLCJfTW9uZXJvV2FsbGV0S2V5cyIsIl9Nb25lcm9XYWxsZXRGdWxsIiwiR2VuVXRpbHMiLCJpc0Rlbm8iLCJzZWxmIiwiZ2xvYmFsVGhpcyIsIkRlZGljYXRlZFdvcmtlckdsb2JhbFNjb3BlIiwicHJvdG90eXBlIiwiaXNQcm90b3R5cGVPZiIsIkh0dHBDbGllbnQiLCJMaWJyYXJ5VXRpbHMiLCJvbm1lc3NhZ2UiLCJlIiwiaW5pdE9uZVRpbWUiLCJvYmplY3RJZCIsImRhdGEiLCJmbk5hbWUiLCJjYWxsYmFja0lkIiwiYXNzZXJ0IiwiRXJyb3IiLCJzcGxpY2UiLCJwb3N0TWVzc2FnZSIsInJlc3VsdCIsImFwcGx5IiwiZXJyb3IiLCJzZXJpYWxpemVFcnJvciIsImlzSW5pdGlhbGl6ZWQiLCJXT1JLRVJfT0JKRUNUUyIsIk1vbmVyb1V0aWxzIiwiUFJPWFlfVE9fV09SS0VSIiwiaHR0cFJlcXVlc3QiLCJvcHRzIiwicmVxdWVzdCIsIk9iamVjdCIsImFzc2lnbiIsInByb3h5VG9Xb3JrZXIiLCJlcnIiLCJzdGF0dXNDb2RlIiwiSlNPTiIsInN0cmluZ2lmeSIsInN0YXR1c01lc3NhZ2UiLCJtZXNzYWdlIiwic2V0TG9nTGV2ZWwiLCJsZXZlbCIsImdldFdhc21NZW1vcnlVc2VkIiwiZ2V0V2FzbU1vZHVsZSIsIkhFQVA4IiwibGVuZ3RoIiwidW5kZWZpbmVkIiwibW9uZXJvVXRpbHNHZXRJbnRlZ3JhdGVkQWRkcmVzcyIsIm5ldHdvcmtUeXBlIiwic3RhbmRhcmRBZGRyZXNzIiwicGF5bWVudElkIiwiZ2V0SW50ZWdyYXRlZEFkZHJlc3MiLCJ0b0pzb24iLCJtb25lcm9VdGlsc1ZhbGlkYXRlQWRkcmVzcyIsImFkZHJlc3MiLCJ2YWxpZGF0ZUFkZHJlc3MiLCJtb25lcm9VdGlsc0pzb25Ub0JpbmFyeSIsImpzb24iLCJqc29uVG9CaW5hcnkiLCJtb25lcm9VdGlsc0JpbmFyeVRvSnNvbiIsInVpbnQ4YXJyIiwiYmluYXJ5VG9Kc29uIiwibW9uZXJvVXRpbHNCaW5hcnlCbG9ja3NUb0pzb24iLCJiaW5hcnlCbG9ja3NUb0pzb24iLCJkYWVtb25BZGRMaXN0ZW5lciIsImRhZW1vbklkIiwibGlzdGVuZXJJZCIsImxpc3RlbmVyIiwiTW9uZXJvRGFlbW9uTGlzdGVuZXIiLCJvbkJsb2NrSGVhZGVyIiwiYmxvY2tIZWFkZXIiLCJkYWVtb25MaXN0ZW5lcnMiLCJhZGRMaXN0ZW5lciIsImRhZW1vblJlbW92ZUxpc3RlbmVyIiwiTW9uZXJvRXJyb3IiLCJyZW1vdmVMaXN0ZW5lciIsImNvbm5lY3REYWVtb25ScGMiLCJjb25maWciLCJNb25lcm9EYWVtb25ScGMiLCJjb25uZWN0VG9EYWVtb25ScGMiLCJNb25lcm9EYWVtb25Db25maWciLCJkYWVtb25HZXRScGNDb25uZWN0aW9uIiwiY29ubmVjdGlvbiIsImdldFJwY0Nvbm5lY3Rpb24iLCJnZXRDb25maWciLCJkYWVtb25Jc0Nvbm5lY3RlZCIsImlzQ29ubmVjdGVkIiwiZGFlbW9uR2V0VmVyc2lvbiIsImdldFZlcnNpb24iLCJkYWVtb25Jc1RydXN0ZWQiLCJpc1RydXN0ZWQiLCJkYWVtb25HZXRIZWlnaHQiLCJnZXRIZWlnaHQiLCJkYWVtb25HZXRCbG9ja0hhc2giLCJoZWlnaHQiLCJnZXRCbG9ja0hhc2giLCJkYWVtb25HZXRCbG9ja1RlbXBsYXRlIiwid2FsbGV0QWRkcmVzcyIsInJlc2VydmVTaXplIiwiZ2V0QmxvY2tUZW1wbGF0ZSIsImRhZW1vbkdldExhc3RCbG9ja0hlYWRlciIsImdldExhc3RCbG9ja0hlYWRlciIsImRhZW1vbkdldEJsb2NrSGVhZGVyQnlIYXNoIiwiaGFzaCIsImdldEJsb2NrSGVhZGVyQnlIYXNoIiwiZGFlbW9uR2V0QmxvY2tIZWFkZXJCeUhlaWdodCIsImdldEJsb2NrSGVhZGVyQnlIZWlnaHQiLCJkYWVtb25HZXRCbG9ja0hlYWRlcnNCeVJhbmdlIiwic3RhcnRIZWlnaHQiLCJlbmRIZWlnaHQiLCJibG9ja0hlYWRlcnNKc29uIiwiZ2V0QmxvY2tIZWFkZXJzQnlSYW5nZSIsInB1c2giLCJkYWVtb25HZXRCbG9ja0J5SGFzaCIsImJsb2NrSGFzaCIsImdldEJsb2NrQnlIYXNoIiwiZGFlbW9uR2V0QmxvY2tzQnlIYXNoIiwiYmxvY2tIYXNoZXMiLCJwcnVuZSIsImJsb2Nrc0pzb24iLCJibG9jayIsImdldEJsb2Nrc0J5SGFzaCIsImRhZW1vbkdldEJsb2NrQnlIZWlnaHQiLCJnZXRCbG9ja0J5SGVpZ2h0IiwiZGFlbW9uR2V0QmxvY2tzQnlIZWlnaHQiLCJoZWlnaHRzIiwiZ2V0QmxvY2tzQnlIZWlnaHQiLCJkYWVtb25HZXRCbG9ja3NCeVJhbmdlIiwiZ2V0QmxvY2tzQnlSYW5nZSIsImRhZW1vbkdldEJsb2Nrc0J5UmFuZ2VDaHVua2VkIiwibWF4Q2h1bmtTaXplIiwiZ2V0QmxvY2tzQnlSYW5nZUNodW5rZWQiLCJkYWVtb25HZXRCbG9ja0hhc2hlcyIsImRhZW1vbkdldFR4cyIsInR4SGFzaGVzIiwidHhzIiwiZ2V0VHhzIiwiYmxvY2tzIiwidW5jb25maXJtZWRCbG9jayIsInNlZW5CbG9ja3MiLCJTZXQiLCJ0eCIsImdldEJsb2NrIiwiTW9uZXJvQmxvY2siLCJzZXRUeHMiLCJzZXRCbG9jayIsImhhcyIsImFkZCIsImkiLCJkYWVtb25HZXRUeEhleGVzIiwiZ2V0VHhIZXhlcyIsImRhZW1vbkdldE1pbmVyVHhTdW0iLCJudW1CbG9ja3MiLCJnZXRNaW5lclR4U3VtIiwiZGFlbW9uR2V0RmVlRXN0aW1hdGUiLCJncmFjZUJsb2NrcyIsImdldEZlZUVzdGltYXRlIiwiZGFlbW9uU3VibWl0VHhIZXgiLCJ0eEhleCIsImRvTm90UmVsYXkiLCJzdWJtaXRUeEhleCIsImRhZW1vblJlbGF5VHhzQnlIYXNoIiwicmVsYXlUeHNCeUhhc2giLCJkYWVtb25HZXRUeFBvb2wiLCJnZXRUeFBvb2wiLCJkYWVtb25HZXRUeFBvb2xIYXNoZXMiLCJnZXRUeFBvb2xIYXNoZXMiLCJkYWVtb25HZXRUeFBvb2xTdGF0cyIsImdldFR4UG9vbFN0YXRzIiwiZGFlbW9uRmx1c2hUeFBvb2wiLCJoYXNoZXMiLCJmbHVzaFR4UG9vbCIsImRhZW1vbkdldEtleUltYWdlU3BlbnRTdGF0dXNlcyIsImtleUltYWdlcyIsImdldEtleUltYWdlU3BlbnRTdGF0dXNlcyIsImRhZW1vbkdldE91dHB1dEhpc3RvZ3JhbSIsImFtb3VudHMiLCJtaW5Db3VudCIsIm1heENvdW50IiwiaXNVbmxvY2tlZCIsInJlY2VudEN1dG9mZiIsImVudHJpZXNKc29uIiwiZW50cnkiLCJnZXRPdXRwdXRIaXN0b2dyYW0iLCJkYWVtb25HZXRJbmZvIiwiZ2V0SW5mbyIsImRhZW1vbkdldFN5bmNJbmZvIiwiZ2V0U3luY0luZm8iLCJkYWVtb25HZXRIYXJkRm9ya0luZm8iLCJnZXRIYXJkRm9ya0luZm8iLCJkYWVtb25HZXRBbHRDaGFpbnMiLCJhbHRDaGFpbnNKc29uIiwiYWx0Q2hhaW4iLCJnZXRBbHRDaGFpbnMiLCJkYWVtb25HZXRBbHRCbG9ja0hhc2hlcyIsImdldEFsdEJsb2NrSGFzaGVzIiwiZGFlbW9uR2V0RG93bmxvYWRMaW1pdCIsImdldERvd25sb2FkTGltaXQiLCJkYWVtb25TZXREb3dubG9hZExpbWl0IiwibGltaXQiLCJzZXREb3dubG9hZExpbWl0IiwiZGFlbW9uUmVzZXREb3dubG9hZExpbWl0IiwicmVzZXREb3dubG9hZExpbWl0IiwiZGFlbW9uR2V0VXBsb2FkTGltaXQiLCJnZXRVcGxvYWRMaW1pdCIsImRhZW1vblNldFVwbG9hZExpbWl0Iiwic2V0VXBsb2FkTGltaXQiLCJkYWVtb25SZXNldFVwbG9hZExpbWl0IiwicmVzZXRVcGxvYWRMaW1pdCIsImRhZW1vbkdldFBlZXJzIiwicGVlcnNKc29uIiwicGVlciIsImdldFBlZXJzIiwiZGFlbW9uR2V0S25vd25QZWVycyIsImdldEtub3duUGVlcnMiLCJkYWVtb25TZXRPdXRnb2luZ1BlZXJMaW1pdCIsInNldE91dGdvaW5nUGVlckxpbWl0IiwiZGFlbW9uU2V0SW5jb21pbmdQZWVyTGltaXQiLCJzZXRJbmNvbWluZ1BlZXJMaW1pdCIsImRhZW1vbkdldFBlZXJCYW5zIiwiYmFuc0pzb24iLCJiYW4iLCJnZXRQZWVyQmFucyIsImRhZW1vblNldFBlZXJCYW5zIiwiYmFucyIsImJhbkpzb24iLCJNb25lcm9CYW4iLCJzZXRQZWVyQmFucyIsImRhZW1vblN0YXJ0TWluaW5nIiwibnVtVGhyZWFkcyIsImlzQmFja2dyb3VuZCIsImlnbm9yZUJhdHRlcnkiLCJzdGFydE1pbmluZyIsImRhZW1vblN0b3BNaW5pbmciLCJzdG9wTWluaW5nIiwiZGFlbW9uR2V0TWluaW5nU3RhdHVzIiwiZ2V0TWluaW5nU3RhdHVzIiwiZGFlbW9uU3VibWl0QmxvY2tzIiwiYmxvY2tCbG9icyIsInN1Ym1pdEJsb2NrcyIsImRhZW1vblBydW5lQmxvY2tjaGFpbiIsImNoZWNrIiwicHJ1bmVCbG9ja2NoYWluIiwiZGFlbW9uU3RvcCIsInN0b3AiLCJkYWVtb25XYWl0Rm9yTmV4dEJsb2NrSGVhZGVyIiwid2FpdEZvck5leHRCbG9ja0hlYWRlciIsIm9wZW5XYWxsZXREYXRhIiwid2FsbGV0SWQiLCJwYXRoIiwicGFzc3dvcmQiLCJrZXlzRGF0YSIsImNhY2hlRGF0YSIsImRhZW1vblVyaU9yQ29uZmlnIiwiZGFlbW9uQ29ubmVjdGlvbiIsIk1vbmVyb1JwY0Nvbm5lY3Rpb24iLCJNb25lcm9XYWxsZXRGdWxsIiwib3BlbldhbGxldCIsInNlcnZlciIsInNldEJyb3dzZXJNYWluUGF0aCIsImNyZWF0ZVdhbGxldEtleXMiLCJjb25maWdKc29uIiwiTW9uZXJvV2FsbGV0Q29uZmlnIiwic2V0UHJveHlUb1dvcmtlciIsIk1vbmVyb1dhbGxldEtleXMiLCJjcmVhdGVXYWxsZXQiLCJjcmVhdGVXYWxsZXRGdWxsIiwiZ2V0UGF0aCIsInNldFBhdGgiLCJpc1ZpZXdPbmx5IiwiZ2V0TmV0d29ya1R5cGUiLCJnZXRTZWVkIiwiZ2V0U2VlZExhbmd1YWdlIiwiZ2V0U2VlZExhbmd1YWdlcyIsImdldFByaXZhdGVTcGVuZEtleSIsImdldFByaXZhdGVWaWV3S2V5IiwiZ2V0UHVibGljVmlld0tleSIsImdldFB1YmxpY1NwZW5kS2V5IiwiZ2V0QWRkcmVzcyIsImFjY291bnRJZHgiLCJzdWJhZGRyZXNzSWR4IiwiZ2V0QWRkcmVzc0luZGV4Iiwic2V0U3ViYWRkcmVzc0xhYmVsIiwibGFiZWwiLCJkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyIsImludGVncmF0ZWRBZGRyZXNzIiwic2V0RGFlbW9uQ29ubmVjdGlvbiIsImdldERhZW1vbkNvbm5lY3Rpb24iLCJpc0Nvbm5lY3RlZFRvRGFlbW9uIiwiZ2V0UmVzdG9yZUhlaWdodCIsInNldFJlc3RvcmVIZWlnaHQiLCJyZXN0b3JlSGVpZ2h0IiwiZ2V0RGFlbW9uSGVpZ2h0IiwiZ2V0RGFlbW9uTWF4UGVlckhlaWdodCIsImdldEhlaWdodEJ5RGF0ZSIsInllYXIiLCJtb250aCIsImRheSIsImlzRGFlbW9uU3luY2VkIiwiV2FsbGV0V29ya2VySGVscGVyTGlzdGVuZXIiLCJNb25lcm9XYWxsZXRMaXN0ZW5lciIsImNvbnN0cnVjdG9yIiwiaWQiLCJ3b3JrZXIiLCJnZXRJZCIsIm9uU3luY1Byb2dyZXNzIiwicGVyY2VudERvbmUiLCJvbk5ld0Jsb2NrIiwib25CYWxhbmNlc0NoYW5nZWQiLCJuZXdCYWxhbmNlIiwibmV3VW5sb2NrZWRCYWxhbmNlIiwidG9TdHJpbmciLCJvbk91dHB1dFJlY2VpdmVkIiwib3V0cHV0IiwiZ2V0VHgiLCJvbk91dHB1dFNwZW50IiwibGlzdGVuZXJzIiwiaXNTeW5jZWQiLCJzeW5jIiwiYWxsb3dDb25jdXJyZW50Q2FsbHMiLCJzdGFydFN5bmNpbmciLCJzeW5jUGVyaW9kSW5NcyIsInN0b3BTeW5jaW5nIiwic2NhblR4cyIsInJlc2NhblNwZW50IiwicmVzY2FuQmxvY2tjaGFpbiIsImdldEJhbGFuY2UiLCJnZXRVbmxvY2tlZEJhbGFuY2UiLCJnZXRBY2NvdW50cyIsImluY2x1ZGVTdWJhZGRyZXNzZXMiLCJ0YWciLCJhY2NvdW50SnNvbnMiLCJhY2NvdW50IiwiZ2V0QWNjb3VudCIsImNyZWF0ZUFjY291bnQiLCJnZXRTdWJhZGRyZXNzZXMiLCJzdWJhZGRyZXNzSW5kaWNlcyIsInN1YmFkZHJlc3NKc29ucyIsInN1YmFkZHJlc3MiLCJjcmVhdGVTdWJhZGRyZXNzIiwiYmxvY2tKc29uUXVlcnkiLCJxdWVyeSIsIkRlc2VyaWFsaXphdGlvblR5cGUiLCJUWF9RVUVSWSIsImdldFRyYW5zZmVycyIsImdldFRyYW5zZmVyUXVlcnkiLCJ0cmFuc2ZlcnMiLCJ0cmFuc2ZlciIsImdldE91dHB1dHMiLCJnZXRPdXRwdXRRdWVyeSIsIm91dHB1dHMiLCJleHBvcnRPdXRwdXRzIiwiYWxsIiwiaW1wb3J0T3V0cHV0cyIsIm91dHB1dHNIZXgiLCJnZXRLZXlJbWFnZXMiLCJrZXlJbWFnZXNKc29uIiwia2V5SW1hZ2UiLCJleHBvcnRLZXlJbWFnZXMiLCJpbXBvcnRLZXlJbWFnZXMiLCJrZXlJbWFnZUpzb24iLCJNb25lcm9LZXlJbWFnZSIsImZyZWV6ZU91dHB1dCIsInRoYXdPdXRwdXQiLCJpc091dHB1dEZyb3plbiIsImdldERlZmF1bHRGZWVQcmlvcml0eSIsImNyZWF0ZVR4cyIsIk1vbmVyb1R4Q29uZmlnIiwiZ2V0VHhTZXQiLCJzd2VlcE91dHB1dCIsInN3ZWVwVW5sb2NrZWQiLCJ0eFNldHMiLCJhcnJheUNvbnRhaW5zIiwidHhTZXRzSnNvbiIsInR4U2V0Iiwic3dlZXBEdXN0IiwicmVsYXkiLCJyZWxheVR4cyIsInR4TWV0YWRhdGFzIiwiZGVzY3JpYmVUeFNldCIsInR4U2V0SnNvbiIsIk1vbmVyb1R4U2V0Iiwic2lnblR4cyIsInVuc2lnbmVkVHhIZXgiLCJzdWJtaXRUeHMiLCJzaWduZWRUeEhleCIsInNpZ25NZXNzYWdlIiwic2lnbmF0dXJlVHlwZSIsInZlcmlmeU1lc3NhZ2UiLCJzaWduYXR1cmUiLCJnZXRUeEtleSIsInR4SGFzaCIsImNoZWNrVHhLZXkiLCJ0eEtleSIsImdldFR4UHJvb2YiLCJjaGVja1R4UHJvb2YiLCJnZXRTcGVuZFByb29mIiwiY2hlY2tTcGVuZFByb29mIiwiZ2V0UmVzZXJ2ZVByb29mV2FsbGV0IiwiZ2V0UmVzZXJ2ZVByb29mQWNjb3VudCIsImFtb3VudFN0ciIsImNoZWNrUmVzZXJ2ZVByb29mIiwiZ2V0VHhOb3RlcyIsInNldFR4Tm90ZXMiLCJ0eE5vdGVzIiwiZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzIiwiZW50cnlJbmRpY2VzIiwiYWRkQWRkcmVzc0Jvb2tFbnRyeSIsImRlc2NyaXB0aW9uIiwiZWRpdEFkZHJlc3NCb29rRW50cnkiLCJpbmRleCIsInNldEFkZHJlc3MiLCJzZXREZXNjcmlwdGlvbiIsImRlbGV0ZUFkZHJlc3NCb29rRW50cnkiLCJ0YWdBY2NvdW50cyIsImFjY291bnRJbmRpY2VzIiwidW50YWdBY2NvdW50cyIsImdldEFjY291bnRUYWdzIiwic2V0QWNjb3VudFRhZ0xhYmVsIiwiZ2V0UGF5bWVudFVyaSIsInBhcnNlUGF5bWVudFVyaSIsInVyaSIsImdldEF0dHJpYnV0ZSIsImtleSIsInNldEF0dHJpYnV0ZSIsInZhbHVlIiwiYmFja2dyb3VuZE1pbmluZyIsImlzTXVsdGlzaWdJbXBvcnROZWVkZWQiLCJpc011bHRpc2lnIiwiZ2V0TXVsdGlzaWdJbmZvIiwicHJlcGFyZU11bHRpc2lnIiwibWFrZU11bHRpc2lnIiwibXVsdGlzaWdIZXhlcyIsInRocmVzaG9sZCIsImV4Y2hhbmdlTXVsdGlzaWdLZXlzIiwiZXhwb3J0TXVsdGlzaWdIZXgiLCJpbXBvcnRNdWx0aXNpZ0hleCIsInNpZ25NdWx0aXNpZ1R4SGV4IiwibXVsdGlzaWdUeEhleCIsInN1Ym1pdE11bHRpc2lnVHhIZXgiLCJzaWduZWRNdWx0aXNpZ1R4SGV4IiwiZ2V0RGF0YSIsImNoYW5nZVBhc3N3b3JkIiwib2xkUGFzc3dvcmQiLCJuZXdQYXNzd29yZCIsImlzQ2xvc2VkIiwiY2xvc2UiLCJzYXZlIl0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvY29tbW9uL01vbmVyb1dlYldvcmtlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXNzZXJ0IGZyb20gXCJhc3NlcnRcIjtcbmltcG9ydCBHZW5VdGlscyBmcm9tIFwiLi9HZW5VdGlsc1wiO1xuaW1wb3J0IEh0dHBDbGllbnQgZnJvbSBcIi4vSHR0cENsaWVudFwiO1xuaW1wb3J0IExpYnJhcnlVdGlscyBmcm9tIFwiLi9MaWJyYXJ5VXRpbHNcIjtcbmltcG9ydCBNb25lcm9CYW4gZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9CYW5cIjtcbmltcG9ydCBNb25lcm9CbG9jayBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0Jsb2NrXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uQ29uZmlnIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvRGFlbW9uQ29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uTGlzdGVuZXIgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9EYWVtb25MaXN0ZW5lclwiO1xuaW1wb3J0IE1vbmVyb0RhZW1vblJwYyBmcm9tIFwiLi4vZGFlbW9uL01vbmVyb0RhZW1vblJwY1wiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuL01vbmVyb0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2UgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9LZXlJbWFnZVwiO1xuaW1wb3J0IE1vbmVyb1JwY0Nvbm5lY3Rpb24gZnJvbSBcIi4vTW9uZXJvUnBjQ29ubmVjdGlvblwiO1xuaW1wb3J0IE1vbmVyb1R4Q29uZmlnIGZyb20gXCIuLi93YWxsZXQvbW9kZWwvTW9uZXJvVHhDb25maWdcIjtcbmltcG9ydCBNb25lcm9UeFF1ZXJ5IGZyb20gXCIuLi93YWxsZXQvbW9kZWwvTW9uZXJvVHhRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb1R4U2V0IGZyb20gXCIuLi93YWxsZXQvbW9kZWwvTW9uZXJvVHhTZXRcIjtcbmltcG9ydCBNb25lcm9VdGlscyBmcm9tIFwiLi9Nb25lcm9VdGlsc1wiO1xuaW1wb3J0IE1vbmVyb1dhbGxldENvbmZpZyBmcm9tIFwiLi4vd2FsbGV0L21vZGVsL01vbmVyb1dhbGxldENvbmZpZ1wiXG5pbXBvcnQgTW9uZXJvV2FsbGV0TGlzdGVuZXIgZnJvbSBcIi4uL3dhbGxldC9tb2RlbC9Nb25lcm9XYWxsZXRMaXN0ZW5lclwiXG5pbXBvcnQge01vbmVyb1dhbGxldEtleXN9IGZyb20gXCIuLi93YWxsZXQvTW9uZXJvV2FsbGV0S2V5c1wiO1xuaW1wb3J0IE1vbmVyb1dhbGxldEZ1bGwgZnJvbSBcIi4uL3dhbGxldC9Nb25lcm9XYWxsZXRGdWxsXCI7XG5cbmRlY2xhcmUgdmFyIHNlbGY6IGFueTtcblxuLy8gZGVubyBjb25maWd1cmF0aW9uXG5kZWNsYXJlIHZhciBEZWRpY2F0ZWRXb3JrZXJHbG9iYWxTY29wZTogYW55O1xuaWYgKEdlblV0aWxzLmlzRGVubygpICYmIHR5cGVvZiBzZWxmID09PSBcInVuZGVmaW5lZFwiICYmIHR5cGVvZiBnbG9iYWxUaGlzID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBEZWRpY2F0ZWRXb3JrZXJHbG9iYWxTY29wZSA9PT0gXCJmdW5jdGlvblwiICYmIERlZGljYXRlZFdvcmtlckdsb2JhbFNjb3BlLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGdsb2JhbFRoaXMpKSB7XG4gIHNlbGYgPSBnbG9iYWxUaGlzO1xuICAoZ2xvYmFsVGhpcyBhcyBhbnkpLnNlbGYgPSBnbG9iYWxUaGlzO1xufVxuXG4vLyBleHBvc2Ugc29tZSBtb2R1bGVzIHRvIHRoZSB3b3JrZXJcbnNlbGYuSHR0cENsaWVudCA9IEh0dHBDbGllbnQ7XG5zZWxmLkxpYnJhcnlVdGlscyA9IExpYnJhcnlVdGlscztcbnNlbGYuR2VuVXRpbHMgPSBHZW5VdGlscztcblxuLyoqXG4gKiBXb3JrZXIgdG8gbWFuYWdlIGEgZGFlbW9uIGFuZCB3YXNtIHdhbGxldCBvZmYgdGhlIG1haW4gdGhyZWFkIHVzaW5nIG1lc3NhZ2VzLlxuICogXG4gKiBSZXF1aXJlZCBtZXNzYWdlIGZvcm1hdDogZS5kYXRhWzBdID0gb2JqZWN0IGlkLCBlLmRhdGFbMV0gPSBmdW5jdGlvbiBuYW1lLCBlLmRhdGFbMitdID0gZnVuY3Rpb24gYXJnc1xuICpcbiAqIEZvciBicm93c2VyIGFwcGxpY2F0aW9ucywgdGhpcyBmaWxlIG11c3QgYmUgYnJvd3NlcmlmaWVkIGFuZCBwbGFjZWQgaW4gdGhlIHdlYiBhcHAgcm9vdC5cbiAqIFxuICogQHByaXZhdGVcbiAqL1xuc2VsZi5vbm1lc3NhZ2UgPSBhc3luYyBmdW5jdGlvbihlKSB7XG4gIFxuICAvLyBpbml0aWFsaXplIG9uZSB0aW1lXG4gIGF3YWl0IHNlbGYuaW5pdE9uZVRpbWUoKTtcbiAgXG4gIC8vIHZhbGlkYXRlIHBhcmFtc1xuICBsZXQgb2JqZWN0SWQgPSBlLmRhdGFbMF07XG4gIGxldCBmbk5hbWUgPSBlLmRhdGFbMV07XG4gIGxldCBjYWxsYmFja0lkID0gZS5kYXRhWzJdO1xuICBhc3NlcnQoZm5OYW1lLCBcIk11c3QgcHJvdmlkZSBmdW5jdGlvbiBuYW1lIHRvIHdvcmtlclwiKTtcbiAgYXNzZXJ0KGNhbGxiYWNrSWQsIFwiTXVzdCBwcm92aWRlIGNhbGxiYWNrIGlkIHRvIHdvcmtlclwiKTtcbiAgaWYgKCFzZWxmW2ZuTmFtZV0pIHRocm93IG5ldyBFcnJvcihcIk1ldGhvZCAnXCIgKyBmbk5hbWUgKyBcIicgaXMgbm90IHJlZ2lzdGVyZWQgd2l0aCB3b3JrZXJcIik7XG4gIGUuZGF0YS5zcGxpY2UoMSwgMik7IC8vIHJlbW92ZSBmdW5jdGlvbiBuYW1lIGFuZCBjYWxsYmFjayBpZCB0byBhcHBseSBmdW5jdGlvbiB3aXRoIGFyZ3VtZW50c1xuICBcbiAgLy8gZXhlY3V0ZSB3b3JrZXIgZnVuY3Rpb24gYW5kIHBvc3QgcmVzdWx0IHRvIGNhbGxiYWNrXG4gIHRyeSB7XG4gICAgcG9zdE1lc3NhZ2UoW29iamVjdElkLCBjYWxsYmFja0lkLCB7cmVzdWx0OiBhd2FpdCBzZWxmW2ZuTmFtZV0uYXBwbHkobnVsbCwgZS5kYXRhKX1dKTtcbiAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgaWYgKCEoZSBpbnN0YW5jZW9mIEVycm9yKSkgZSA9IG5ldyBFcnJvcihlKTtcbiAgICBwb3N0TWVzc2FnZShbb2JqZWN0SWQsIGNhbGxiYWNrSWQsIHtlcnJvcjogTGlicmFyeVV0aWxzLnNlcmlhbGl6ZUVycm9yKGUpfV0pO1xuICB9XG59XG5cbnNlbGYuaW5pdE9uZVRpbWUgPSBhc3luYyBmdW5jdGlvbigpIHtcbiAgaWYgKCFzZWxmLmlzSW5pdGlhbGl6ZWQpIHtcbiAgICBzZWxmLldPUktFUl9PQkpFQ1RTID0ge307XG4gICAgc2VsZi5pc0luaXRpYWxpemVkID0gdHJ1ZTtcbiAgICBNb25lcm9VdGlscy5QUk9YWV9UT19XT1JLRVIgPSBmYWxzZTtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU1RBVElDIFVUSUxJVElFUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnNlbGYuaHR0cFJlcXVlc3QgPSBhc3luYyBmdW5jdGlvbihvYmplY3RJZCwgb3B0cykge1xuICB0cnkge1xuICAgIHJldHVybiBhd2FpdCBIdHRwQ2xpZW50LnJlcXVlc3QoT2JqZWN0LmFzc2lnbihvcHRzLCB7cHJveHlUb1dvcmtlcjogZmFsc2V9KSk7ICBcbiAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICB0aHJvdyBlcnIuc3RhdHVzQ29kZSA/IG5ldyBFcnJvcihKU09OLnN0cmluZ2lmeSh7c3RhdHVzQ29kZTogZXJyLnN0YXR1c0NvZGUsIHN0YXR1c01lc3NhZ2U6IGVyci5tZXNzYWdlfSkpIDogZXJyO1xuICB9XG59XG5cbnNlbGYuc2V0TG9nTGV2ZWwgPSBhc3luYyBmdW5jdGlvbihvYmplY3RJZCwgbGV2ZWwpIHtcbiAgcmV0dXJuIExpYnJhcnlVdGlscy5zZXRMb2dMZXZlbChsZXZlbCk7XG59XG5cbnNlbGYuZ2V0V2FzbU1lbW9yeVVzZWQgPSBhc3luYyBmdW5jdGlvbihvYmplY3RJZCkge1xuICByZXR1cm4gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKSAmJiBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLkhFQVA4ID8gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5IRUFQOC5sZW5ndGggOiB1bmRlZmluZWQ7XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIE1PTkVSTyBVVElMUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuc2VsZi5tb25lcm9VdGlsc0dldEludGVncmF0ZWRBZGRyZXNzID0gYXN5bmMgZnVuY3Rpb24ob2JqZWN0SWQsIG5ldHdvcmtUeXBlLCBzdGFuZGFyZEFkZHJlc3MsIHBheW1lbnRJZCkge1xuICByZXR1cm4gKGF3YWl0IE1vbmVyb1V0aWxzLmdldEludGVncmF0ZWRBZGRyZXNzKG5ldHdvcmtUeXBlLCBzdGFuZGFyZEFkZHJlc3MsIHBheW1lbnRJZCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLm1vbmVyb1V0aWxzVmFsaWRhdGVBZGRyZXNzID0gYXN5bmMgZnVuY3Rpb24ob2JqZWN0SWQsIGFkZHJlc3MsIG5ldHdvcmtUeXBlKSB7XG4gIHJldHVybiBNb25lcm9VdGlscy52YWxpZGF0ZUFkZHJlc3MoYWRkcmVzcywgbmV0d29ya1R5cGUpO1xufVxuXG5zZWxmLm1vbmVyb1V0aWxzSnNvblRvQmluYXJ5ID0gYXN5bmMgZnVuY3Rpb24ob2JqZWN0SWQsIGpzb24pIHtcbiAgcmV0dXJuIE1vbmVyb1V0aWxzLmpzb25Ub0JpbmFyeShqc29uKTtcbn1cblxuc2VsZi5tb25lcm9VdGlsc0JpbmFyeVRvSnNvbiA9IGFzeW5jIGZ1bmN0aW9uKG9iamVjdElkLCB1aW50OGFycikge1xuICByZXR1cm4gTW9uZXJvVXRpbHMuYmluYXJ5VG9Kc29uKHVpbnQ4YXJyKTtcbn1cblxuc2VsZi5tb25lcm9VdGlsc0JpbmFyeUJsb2Nrc1RvSnNvbiA9IGFzeW5jIGZ1bmN0aW9uKG9iamVjdElkLCB1aW50OGFycikge1xuICByZXR1cm4gTW9uZXJvVXRpbHMuYmluYXJ5QmxvY2tzVG9Kc29uKHVpbnQ4YXJyKTtcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBEQUVNT04gTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5zZWxmLmRhZW1vbkFkZExpc3RlbmVyID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGxpc3RlbmVySWQpIHtcbiAgbGV0IGxpc3RlbmVyID0gbmV3IGNsYXNzIGV4dGVuZHMgTW9uZXJvRGFlbW9uTGlzdGVuZXIge1xuICAgIGFzeW5jIG9uQmxvY2tIZWFkZXIoYmxvY2tIZWFkZXIpIHtcbiAgICAgIHNlbGYucG9zdE1lc3NhZ2UoW2RhZW1vbklkLCBcIm9uQmxvY2tIZWFkZXJfXCIgKyBsaXN0ZW5lcklkLCBibG9ja0hlYWRlci50b0pzb24oKV0pO1xuICAgIH1cbiAgfVxuICBpZiAoIXNlbGYuZGFlbW9uTGlzdGVuZXJzKSBzZWxmLmRhZW1vbkxpc3RlbmVycyA9IHt9O1xuICBzZWxmLmRhZW1vbkxpc3RlbmVyc1tsaXN0ZW5lcklkXSA9IGxpc3RlbmVyO1xuICBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG59XG5cbnNlbGYuZGFlbW9uUmVtb3ZlTGlzdGVuZXIgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgbGlzdGVuZXJJZCkge1xuICBpZiAoIXNlbGYuZGFlbW9uTGlzdGVuZXJzW2xpc3RlbmVySWRdKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJObyBkYWVtb24gd29ya2VyIGxpc3RlbmVyIHJlZ2lzdGVyZWQgd2l0aCBpZDogXCIgKyBsaXN0ZW5lcklkKTtcbiAgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0ucmVtb3ZlTGlzdGVuZXIoc2VsZi5kYWVtb25MaXN0ZW5lcnNbbGlzdGVuZXJJZF0pO1xuICBkZWxldGUgc2VsZi5kYWVtb25MaXN0ZW5lcnNbbGlzdGVuZXJJZF07XG59XG5cbnNlbGYuY29ubmVjdERhZW1vblJwYyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBjb25maWcpIHtcbiAgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0gPSBhd2FpdCBNb25lcm9EYWVtb25ScGMuY29ubmVjdFRvRGFlbW9uUnBjKG5ldyBNb25lcm9EYWVtb25Db25maWcoY29uZmlnKSk7XG59XG5cbnNlbGYuZGFlbW9uR2V0UnBjQ29ubmVjdGlvbiA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIGxldCBjb25uZWN0aW9uID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0UnBjQ29ubmVjdGlvbigpO1xuICByZXR1cm4gY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0Q29uZmlnKCkgOiB1bmRlZmluZWQ7XG59XG5cbnNlbGYuZGFlbW9uSXNDb25uZWN0ZWQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uaXNDb25uZWN0ZWQoKTtcbn1cblxuc2VsZi5kYWVtb25HZXRWZXJzaW9uID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRWZXJzaW9uKCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbklzVHJ1c3RlZCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5pc1RydXN0ZWQoKTtcbn1cblxuc2VsZi5kYWVtb25HZXRIZWlnaHQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0SGVpZ2h0KCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tIYXNoID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGhlaWdodCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tIYXNoKGhlaWdodCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tUZW1wbGF0ZSA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCB3YWxsZXRBZGRyZXNzLCByZXNlcnZlU2l6ZSkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2NrVGVtcGxhdGUod2FsbGV0QWRkcmVzcywgcmVzZXJ2ZVNpemUpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRMYXN0QmxvY2tIZWFkZXIgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldExhc3RCbG9ja0hlYWRlcigpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja0hlYWRlckJ5SGFzaCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBoYXNoKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tIZWFkZXJCeUhhc2goaGFzaCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2NrSGVhZGVyQnlIZWlnaHQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgaGVpZ2h0KSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tIZWFkZXJCeUhlaWdodChoZWlnaHQpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja0hlYWRlcnNCeVJhbmdlID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpIHtcbiAgbGV0IGJsb2NrSGVhZGVyc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgYmxvY2tIZWFkZXIgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tIZWFkZXJzQnlSYW5nZShzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSkgYmxvY2tIZWFkZXJzSnNvbi5wdXNoKGJsb2NrSGVhZGVyLnRvSnNvbigpKTtcbiAgcmV0dXJuIGJsb2NrSGVhZGVyc0pzb247XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tCeUhhc2ggPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgYmxvY2tIYXNoKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tCeUhhc2goYmxvY2tIYXNoKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tzQnlIYXNoID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGJsb2NrSGFzaGVzLCBzdGFydEhlaWdodCwgcHJ1bmUpIHtcbiAgbGV0IGJsb2Nrc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgYmxvY2sgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tzQnlIYXNoKGJsb2NrSGFzaGVzLCBzdGFydEhlaWdodCwgcHJ1bmUpKSBibG9ja3NKc29uLnB1c2goYmxvY2sudG9Kc29uKCkpO1xuICByZXR1cm4gYmxvY2tzSnNvbjtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja0J5SGVpZ2h0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGhlaWdodCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2NrQnlIZWlnaHQoaGVpZ2h0KSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tzQnlIZWlnaHQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgaGVpZ2h0cykge1xuICBsZXQgYmxvY2tzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBibG9jayBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja3NCeUhlaWdodChoZWlnaHRzKSkgYmxvY2tzSnNvbi5wdXNoKGJsb2NrLnRvSnNvbigpKTtcbiAgcmV0dXJuIGJsb2Nrc0pzb247XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tzQnlSYW5nZSA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSB7XG4gIGxldCBibG9ja3NKc29uID0gW107XG4gIGZvciAobGV0IGJsb2NrIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2Nrc0J5UmFuZ2Uoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCkpIGJsb2Nrc0pzb24ucHVzaChibG9jay50b0pzb24oKSk7XG4gIHJldHVybiBibG9ja3NKc29uO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2Nrc0J5UmFuZ2VDaHVua2VkID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIG1heENodW5rU2l6ZSkge1xuICBsZXQgYmxvY2tzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBibG9jayBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja3NCeVJhbmdlQ2h1bmtlZChzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBtYXhDaHVua1NpemUpKSBibG9ja3NKc29uLnB1c2goYmxvY2sudG9Kc29uKCkpO1xuICByZXR1cm4gYmxvY2tzSnNvbjtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja0hhc2hlcyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBibG9ja0hhc2hlcywgc3RhcnRIZWlnaHQpIHtcbiAgdGhyb3cgbmV3IEVycm9yKFwid29ya2VyLmdldEJsb2NrSGFzaGVzIG5vdCBpbXBsZW1lbnRlZFwiKTtcbn1cblxuLy8gVE9ETzogZmFjdG9yIGNvbW1vbiBjb2RlIHdpdGggc2VsZi5nZXRUeHMoKVxuc2VsZi5kYWVtb25HZXRUeHMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgdHhIYXNoZXMsIHBydW5lKSB7XG4gIFxuICAvLyBnZXQgdHhzXG4gIGxldCB0eHMgPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRUeHModHhIYXNoZXMsIHBydW5lKTtcbiAgXG4gIC8vIGNvbGxlY3QgdW5pcXVlIGJsb2NrcyB0byBwcmVzZXJ2ZSBtb2RlbCByZWxhdGlvbnNoaXBzIGFzIHRyZWVzIChiYXNlZCBvbiBtb25lcm9fd2FzbV9icmlkZ2UuY3BwOjpnZXRfdHhzKVxuICBsZXQgYmxvY2tzID0gW107XG4gIGxldCB1bmNvbmZpcm1lZEJsb2NrID0gdW5kZWZpbmVkXG4gIGxldCBzZWVuQmxvY2tzID0gbmV3IFNldCgpO1xuICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICBpZiAoIXR4LmdldEJsb2NrKCkpIHtcbiAgICAgIGlmICghdW5jb25maXJtZWRCbG9jaykgdW5jb25maXJtZWRCbG9jayA9IG5ldyBNb25lcm9CbG9jaygpLnNldFR4cyhbXSk7XG4gICAgICB0eC5zZXRCbG9jayh1bmNvbmZpcm1lZEJsb2NrKTtcbiAgICAgIHVuY29uZmlybWVkQmxvY2suZ2V0VHhzKCkucHVzaCh0eCk7XG4gICAgfVxuICAgIGlmICghc2VlbkJsb2Nrcy5oYXModHguZ2V0QmxvY2soKSkpIHtcbiAgICAgIHNlZW5CbG9ja3MuYWRkKHR4LmdldEJsb2NrKCkpO1xuICAgICAgYmxvY2tzLnB1c2godHguZ2V0QmxvY2soKSk7XG4gICAgfVxuICB9XG4gIFxuICAvLyBzZXJpYWxpemUgYmxvY2tzIHRvIGpzb25cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBibG9ja3MubGVuZ3RoOyBpKyspIGJsb2Nrc1tpXSA9IGJsb2Nrc1tpXS50b0pzb24oKTtcbiAgcmV0dXJuIGJsb2Nrcztcbn1cblxuc2VsZi5kYWVtb25HZXRUeEhleGVzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIHR4SGFzaGVzLCBwcnVuZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0VHhIZXhlcyh0eEhhc2hlcywgcHJ1bmUpO1xufVxuXG5zZWxmLmRhZW1vbkdldE1pbmVyVHhTdW0gPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgaGVpZ2h0LCBudW1CbG9ja3MpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRNaW5lclR4U3VtKGhlaWdodCwgbnVtQmxvY2tzKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0RmVlRXN0aW1hdGUgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgZ3JhY2VCbG9ja3MpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRGZWVFc3RpbWF0ZShncmFjZUJsb2NrcykpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vblN1Ym1pdFR4SGV4ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIHR4SGV4LCBkb05vdFJlbGF5KSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc3VibWl0VHhIZXgodHhIZXgsIGRvTm90UmVsYXkpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25SZWxheVR4c0J5SGFzaCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCB0eEhhc2hlcykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0ucmVsYXlUeHNCeUhhc2godHhIYXNoZXMpO1xufVxuXG5zZWxmLmRhZW1vbkdldFR4UG9vbCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIGxldCB0eHMgPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRUeFBvb2woKTtcbiAgbGV0IGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0VHhzKHR4cyk7XG4gIGZvciAobGV0IHR4IG9mIHR4cykgdHguc2V0QmxvY2soYmxvY2spXG4gIHJldHVybiBibG9jay50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRUeFBvb2xIYXNoZXMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0VHhQb29sSGFzaGVzKCk7XG59XG5cbi8vYXN5bmMgZ2V0VHhQb29sQmFja2xvZygpIHtcbi8vICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4vL31cblxuc2VsZi5kYWVtb25HZXRUeFBvb2xTdGF0cyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0VHhQb29sU3RhdHMoKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uRmx1c2hUeFBvb2wgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgaGFzaGVzKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5mbHVzaFR4UG9vbChoYXNoZXMpO1xufVxuXG5zZWxmLmRhZW1vbkdldEtleUltYWdlU3BlbnRTdGF0dXNlcyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBrZXlJbWFnZXMpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEtleUltYWdlU3BlbnRTdGF0dXNlcyhrZXlJbWFnZXMpO1xufVxuXG4vL1xuLy9hc3luYyBnZXRPdXRwdXRzKG91dHB1dHMpIHtcbi8vICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4vL31cblxuc2VsZi5kYWVtb25HZXRPdXRwdXRIaXN0b2dyYW0gPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgYW1vdW50cywgbWluQ291bnQsIG1heENvdW50LCBpc1VubG9ja2VkLCByZWNlbnRDdXRvZmYpIHtcbiAgbGV0IGVudHJpZXNKc29uID0gW107XG4gIGZvciAobGV0IGVudHJ5IG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldE91dHB1dEhpc3RvZ3JhbShhbW91bnRzLCBtaW5Db3VudCwgbWF4Q291bnQsIGlzVW5sb2NrZWQsIHJlY2VudEN1dG9mZikpIHtcbiAgICBlbnRyaWVzSnNvbi5wdXNoKGVudHJ5LnRvSnNvbigpKTtcbiAgfVxuICByZXR1cm4gZW50cmllc0pzb247XG59XG5cbi8vXG4vL2FzeW5jIGdldE91dHB1dERpc3RyaWJ1dGlvbihhbW91bnRzLCBjdW11bGF0aXZlLCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSB7XG4vLyAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuLy99XG5cbnNlbGYuZGFlbW9uR2V0SW5mbyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0SW5mbygpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRTeW5jSW5mbyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0U3luY0luZm8oKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0SGFyZEZvcmtJbmZvID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRIYXJkRm9ya0luZm8oKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0QWx0Q2hhaW5zID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgbGV0IGFsdENoYWluc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgYWx0Q2hhaW4gb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QWx0Q2hhaW5zKCkpIGFsdENoYWluc0pzb24ucHVzaChhbHRDaGFpbi50b0pzb24oKSk7XG4gIHJldHVybiBhbHRDaGFpbnNKc29uO1xufVxuXG5zZWxmLmRhZW1vbkdldEFsdEJsb2NrSGFzaGVzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEFsdEJsb2NrSGFzaGVzKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0RG93bmxvYWRMaW1pdCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXREb3dubG9hZExpbWl0KCk7XG59XG5cbnNlbGYuZGFlbW9uU2V0RG93bmxvYWRMaW1pdCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBsaW1pdCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc2V0RG93bmxvYWRMaW1pdChsaW1pdCk7XG59XG5cbnNlbGYuZGFlbW9uUmVzZXREb3dubG9hZExpbWl0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnJlc2V0RG93bmxvYWRMaW1pdCgpO1xufVxuXG5zZWxmLmRhZW1vbkdldFVwbG9hZExpbWl0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldFVwbG9hZExpbWl0KCk7XG59XG5cbnNlbGYuZGFlbW9uU2V0VXBsb2FkTGltaXQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgbGltaXQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnNldFVwbG9hZExpbWl0KGxpbWl0KTtcbn1cblxuc2VsZi5kYWVtb25SZXNldFVwbG9hZExpbWl0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnJlc2V0VXBsb2FkTGltaXQoKTtcbn1cblxuc2VsZi5kYWVtb25HZXRQZWVycyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIGxldCBwZWVyc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgcGVlciBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRQZWVycygpKSBwZWVyc0pzb24ucHVzaChwZWVyLnRvSnNvbigpKTtcbiAgcmV0dXJuIHBlZXJzSnNvbjtcbn1cblxuc2VsZi5kYWVtb25HZXRLbm93blBlZXJzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgbGV0IHBlZXJzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBwZWVyIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEtub3duUGVlcnMoKSkgcGVlcnNKc29uLnB1c2gocGVlci50b0pzb24oKSk7XG4gIHJldHVybiBwZWVyc0pzb247XG59XG5cbnNlbGYuZGFlbW9uU2V0T3V0Z29pbmdQZWVyTGltaXQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgbGltaXQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnNldE91dGdvaW5nUGVlckxpbWl0KGxpbWl0KTtcbn1cblxuc2VsZi5kYWVtb25TZXRJbmNvbWluZ1BlZXJMaW1pdCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBsaW1pdCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc2V0SW5jb21pbmdQZWVyTGltaXQobGltaXQpO1xufVxuXG5zZWxmLmRhZW1vbkdldFBlZXJCYW5zID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgbGV0IGJhbnNKc29uID0gW107XG4gIGZvciAobGV0IGJhbiBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRQZWVyQmFucygpKSBiYW5zSnNvbi5wdXNoKGJhbi50b0pzb24oKSk7XG4gIHJldHVybiBiYW5zSnNvbjtcbn1cblxuc2VsZi5kYWVtb25TZXRQZWVyQmFucyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBiYW5zSnNvbikge1xuICBsZXQgYmFucyA9IFtdO1xuICBmb3IgKGxldCBiYW5Kc29uIG9mIGJhbnNKc29uKSBiYW5zLnB1c2gobmV3IE1vbmVyb0JhbihiYW5Kc29uKSk7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5zZXRQZWVyQmFucyhiYW5zKTtcbn1cblxuc2VsZi5kYWVtb25TdGFydE1pbmluZyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBhZGRyZXNzLCBudW1UaHJlYWRzLCBpc0JhY2tncm91bmQsIGlnbm9yZUJhdHRlcnkpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnN0YXJ0TWluaW5nKGFkZHJlc3MsIG51bVRocmVhZHMsIGlzQmFja2dyb3VuZCwgaWdub3JlQmF0dGVyeSk7XG59XG5cbnNlbGYuZGFlbW9uU3RvcE1pbmluZyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5zdG9wTWluaW5nKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0TWluaW5nU3RhdHVzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRNaW5pbmdTdGF0dXMoKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uU3VibWl0QmxvY2tzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGJsb2NrQmxvYnMpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnN1Ym1pdEJsb2NrcyhibG9ja0Jsb2JzKTtcbn1cblxuc2VsZi5kYWVtb25QcnVuZUJsb2NrY2hhaW4gPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgY2hlY2spIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5wcnVuZUJsb2NrY2hhaW4oY2hlY2spKS50b0pzb24oKTtcbn1cblxuLy9hc3luYyBjaGVja0ZvclVwZGF0ZSgpIHtcbi8vICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4vL31cbi8vXG4vL2FzeW5jIGRvd25sb2FkVXBkYXRlKHBhdGgpIHtcbi8vICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4vL31cblxuc2VsZi5kYWVtb25TdG9wID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnN0b3AoKTtcbn1cblxuc2VsZi5kYWVtb25XYWl0Rm9yTmV4dEJsb2NrSGVhZGVyID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS53YWl0Rm9yTmV4dEJsb2NrSGVhZGVyKCkpLnRvSnNvbigpO1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBXQUxMRVQgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnNlbGYub3BlbldhbGxldERhdGEgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgcGF0aCwgcGFzc3dvcmQsIG5ldHdvcmtUeXBlLCBrZXlzRGF0YSwgY2FjaGVEYXRhLCBkYWVtb25VcmlPckNvbmZpZykge1xuICBsZXQgZGFlbW9uQ29ubmVjdGlvbiA9IGRhZW1vblVyaU9yQ29uZmlnID8gbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24oZGFlbW9uVXJpT3JDb25maWcpIDogdW5kZWZpbmVkO1xuICBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXSA9IGF3YWl0IE1vbmVyb1dhbGxldEZ1bGwub3BlbldhbGxldCh7cGF0aDogXCJcIiwgcGFzc3dvcmQ6IHBhc3N3b3JkLCBuZXR3b3JrVHlwZTogbmV0d29ya1R5cGUsIGtleXNEYXRhOiBrZXlzRGF0YSwgY2FjaGVEYXRhOiBjYWNoZURhdGEsIHNlcnZlcjogZGFlbW9uQ29ubmVjdGlvbiwgcHJveHlUb1dvcmtlcjogZmFsc2V9KTtcbiAgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2V0QnJvd3Nlck1haW5QYXRoKHBhdGgpO1xufVxuXG5zZWxmLmNyZWF0ZVdhbGxldEtleXMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgY29uZmlnSnNvbikge1xuICBsZXQgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyhjb25maWdKc29uKTtcbiAgY29uZmlnLnNldFByb3h5VG9Xb3JrZXIoZmFsc2UpO1xuICBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXSA9IGF3YWl0IE1vbmVyb1dhbGxldEtleXMuY3JlYXRlV2FsbGV0KGNvbmZpZyk7XG59XG5cbnNlbGYuY3JlYXRlV2FsbGV0RnVsbCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBjb25maWdKc29uKSB7XG4gIGxldCBjb25maWcgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKGNvbmZpZ0pzb24pO1xuICBsZXQgcGF0aCA9IGNvbmZpZy5nZXRQYXRoKCk7XG4gIGNvbmZpZy5zZXRQYXRoKFwiXCIpO1xuICBjb25maWcuc2V0UHJveHlUb1dvcmtlcihmYWxzZSk7XG4gIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdID0gYXdhaXQgTW9uZXJvV2FsbGV0RnVsbC5jcmVhdGVXYWxsZXQoY29uZmlnKTtcbiAgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2V0QnJvd3Nlck1haW5QYXRoKHBhdGgpO1xufVxuXG5zZWxmLmlzVmlld09ubHkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaXNWaWV3T25seSgpO1xufVxuXG5zZWxmLmdldE5ldHdvcmtUeXBlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldE5ldHdvcmtUeXBlKCk7XG59XG5cbi8vXG4vL2FzeW5jIGdldFZlcnNpb24oKSB7XG4vLyAgdGhyb3cgbmV3IEVycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuLy99XG5cbnNlbGYuZ2V0U2VlZCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRTZWVkKCk7XG59XG5cbnNlbGYuZ2V0U2VlZExhbmd1YWdlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFNlZWRMYW5ndWFnZSgpO1xufVxuXG5zZWxmLmdldFNlZWRMYW5ndWFnZXMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0U2VlZExhbmd1YWdlcygpO1xufVxuXG5zZWxmLmdldFByaXZhdGVTcGVuZEtleSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRQcml2YXRlU3BlbmRLZXkoKTtcbn1cblxuc2VsZi5nZXRQcml2YXRlVmlld0tleSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRQcml2YXRlVmlld0tleSgpO1xufVxuXG5zZWxmLmdldFB1YmxpY1ZpZXdLZXkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0UHVibGljVmlld0tleSgpO1xufVxuXG5zZWxmLmdldFB1YmxpY1NwZW5kS2V5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFB1YmxpY1NwZW5kS2V5KCk7XG59XG5cbnNlbGYuZ2V0QWRkcmVzcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRBZGRyZXNzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpO1xufVxuXG5zZWxmLmdldEFkZHJlc3NJbmRleCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhZGRyZXNzKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0QWRkcmVzc0luZGV4KGFkZHJlc3MpKS50b0pzb24oKTtcbn1cblxuc2VsZi5zZXRTdWJhZGRyZXNzTGFiZWwgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCwgbGFiZWwpIHtcbiAgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2V0U3ViYWRkcmVzc0xhYmVsKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIGxhYmVsKTtcbn1cblxuc2VsZi5nZXRJbnRlZ3JhdGVkQWRkcmVzcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBzdGFuZGFyZEFkZHJlc3MsIHBheW1lbnRJZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldEludGVncmF0ZWRBZGRyZXNzKHN0YW5kYXJkQWRkcmVzcywgcGF5bWVudElkKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgaW50ZWdyYXRlZEFkZHJlc3MpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5kZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyhpbnRlZ3JhdGVkQWRkcmVzcykpLnRvSnNvbigpO1xufVxuXG5zZWxmLnNldERhZW1vbkNvbm5lY3Rpb24gPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgY29uZmlnKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zZXREYWVtb25Db25uZWN0aW9uKGNvbmZpZyA/IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKE9iamVjdC5hc3NpZ24oY29uZmlnLCB7cHJveHlUb1dvcmtlcjogZmFsc2V9KSkgOiB1bmRlZmluZWQpO1xufVxuXG5zZWxmLmdldERhZW1vbkNvbm5lY3Rpb24gPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICBsZXQgY29ubmVjdGlvbiA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldERhZW1vbkNvbm5lY3Rpb24oKTtcbiAgcmV0dXJuIGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldENvbmZpZygpIDogdW5kZWZpbmVkO1xufVxuXG5zZWxmLmlzQ29ubmVjdGVkVG9EYWVtb24gPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaXNDb25uZWN0ZWRUb0RhZW1vbigpO1xufVxuXG5zZWxmLmdldFJlc3RvcmVIZWlnaHQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0UmVzdG9yZUhlaWdodCgpO1xufVxuXG5zZWxmLnNldFJlc3RvcmVIZWlnaHQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgcmVzdG9yZUhlaWdodCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2V0UmVzdG9yZUhlaWdodChyZXN0b3JlSGVpZ2h0KTtcbn1cblxuc2VsZi5nZXREYWVtb25IZWlnaHQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0RGFlbW9uSGVpZ2h0KCk7XG59XG5cbnNlbGYuZ2V0RGFlbW9uTWF4UGVlckhlaWdodCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXREYWVtb25NYXhQZWVySGVpZ2h0KClcbn1cblxuc2VsZi5nZXRIZWlnaHRCeURhdGUgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgeWVhciwgbW9udGgsIGRheSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0SGVpZ2h0QnlEYXRlKHllYXIsIG1vbnRoLCBkYXkpO1xufVxuXG5zZWxmLmlzRGFlbW9uU3luY2VkID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmlzRGFlbW9uU3luY2VkKCk7XG59XG5cbnNlbGYuZ2V0SGVpZ2h0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldEhlaWdodCgpO1xufVxuXG5zZWxmLmFkZExpc3RlbmVyID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGxpc3RlbmVySWQpIHtcbiAgXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBsaXN0ZW5lciB0byBicmlkZ2Ugbm90aWZpY2F0aW9ucyB0byBleHRlcm5hbCBsaXN0ZW5lcnMuXG4gICAqIFxuICAgKiBUT0RPOiBNb25lcm9XYWxsZXRMaXN0ZW5lciBpcyBub3QgZGVmaW5lZCB1bnRpbCBzY3JpcHRzIGltcG9ydGVkXG4gICAqIFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgY2xhc3MgV2FsbGV0V29ya2VySGVscGVyTGlzdGVuZXIgZXh0ZW5kcyBNb25lcm9XYWxsZXRMaXN0ZW5lciB7XG5cbiAgICBwcm90ZWN0ZWQgd2FsbGV0SWQ6IHN0cmluZztcbiAgICBwcm90ZWN0ZWQgaWQ6IHN0cmluZztcbiAgICBwcm90ZWN0ZWQgd29ya2VyOiBXb3JrZXI7XG4gICAgXG4gICAgY29uc3RydWN0b3Iod2FsbGV0SWQsIGlkLCB3b3JrZXIpIHtcbiAgICAgIHN1cGVyKCk7XG4gICAgICB0aGlzLndhbGxldElkID0gd2FsbGV0SWQ7XG4gICAgICB0aGlzLmlkID0gaWQ7XG4gICAgICB0aGlzLndvcmtlciA9IHdvcmtlcjtcbiAgICB9XG4gICAgXG4gICAgZ2V0SWQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5pZDtcbiAgICB9XG4gICAgXG4gICAgYXN5bmMgb25TeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSkge1xuICAgICAgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2UoW3RoaXMud2FsbGV0SWQsIFwib25TeW5jUHJvZ3Jlc3NfXCIgKyB0aGlzLmdldElkKCksIGhlaWdodCwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgcGVyY2VudERvbmUsIG1lc3NhZ2VdKTtcbiAgICB9XG5cbiAgICBhc3luYyBvbk5ld0Jsb2NrKGhlaWdodCkgeyBcbiAgICAgIHRoaXMud29ya2VyLnBvc3RNZXNzYWdlKFt0aGlzLndhbGxldElkLCBcIm9uTmV3QmxvY2tfXCIgKyB0aGlzLmdldElkKCksIGhlaWdodF0pO1xuICAgIH1cbiAgICBcbiAgICBhc3luYyBvbkJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlLCBuZXdVbmxvY2tlZEJhbGFuY2UpIHtcbiAgICAgIHRoaXMud29ya2VyLnBvc3RNZXNzYWdlKFt0aGlzLndhbGxldElkLCBcIm9uQmFsYW5jZXNDaGFuZ2VkX1wiICsgdGhpcy5nZXRJZCgpLCBuZXdCYWxhbmNlLnRvU3RyaW5nKCksIG5ld1VubG9ja2VkQmFsYW5jZS50b1N0cmluZygpXSk7XG4gICAgfVxuXG4gICBhc3luYyBvbk91dHB1dFJlY2VpdmVkKG91dHB1dCkge1xuICAgICAgbGV0IGJsb2NrID0gb3V0cHV0LmdldFR4KCkuZ2V0QmxvY2soKTtcbiAgICAgIGlmIChibG9jayA9PT0gdW5kZWZpbmVkKSBibG9jayA9IG5ldyBNb25lcm9CbG9jaygpLnNldFR4cyhbb3V0cHV0LmdldFR4KCldKTtcbiAgICAgIHRoaXMud29ya2VyLnBvc3RNZXNzYWdlKFt0aGlzLndhbGxldElkLCBcIm9uT3V0cHV0UmVjZWl2ZWRfXCIgKyB0aGlzLmdldElkKCksIGJsb2NrLnRvSnNvbigpXSk7ICAvLyBzZXJpYWxpemUgZnJvbSByb290IGJsb2NrXG4gICAgfVxuICAgIFxuICAgIGFzeW5jIG9uT3V0cHV0U3BlbnQob3V0cHV0KSB7XG4gICAgICBsZXQgYmxvY2sgPSBvdXRwdXQuZ2V0VHgoKS5nZXRCbG9jaygpO1xuICAgICAgaWYgKGJsb2NrID09PSB1bmRlZmluZWQpIGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0VHhzKFtvdXRwdXQuZ2V0VHgoKV0pO1xuICAgICAgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2UoW3RoaXMud2FsbGV0SWQsIFwib25PdXRwdXRTcGVudF9cIiArIHRoaXMuZ2V0SWQoKSwgYmxvY2sudG9Kc29uKCldKTsgICAgIC8vIHNlcmlhbGl6ZSBmcm9tIHJvb3QgYmxvY2tcbiAgICB9XG4gIH1cbiAgXG4gIGxldCBsaXN0ZW5lciA9IG5ldyBXYWxsZXRXb3JrZXJIZWxwZXJMaXN0ZW5lcih3YWxsZXRJZCwgbGlzdGVuZXJJZCwgc2VsZik7XG4gIGlmICghc2VsZi5saXN0ZW5lcnMpIHNlbGYubGlzdGVuZXJzID0gW107XG4gIHNlbGYubGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuICBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG59XG5cbnNlbGYucmVtb3ZlTGlzdGVuZXIgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbGlzdGVuZXJJZCkge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGYubGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHNlbGYubGlzdGVuZXJzW2ldLmdldElkKCkgIT09IGxpc3RlbmVySWQpIGNvbnRpbnVlO1xuICAgIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnJlbW92ZUxpc3RlbmVyKHNlbGYubGlzdGVuZXJzW2ldKTtcbiAgICBzZWxmLmxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkxpc3RlbmVyIGlzIG5vdCByZWdpc3RlcmVkIHdpdGggd2FsbGV0XCIpO1xufVxuXG5zZWxmLmlzU3luY2VkID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmlzU3luY2VkKCk7XG59XG5cbnNlbGYuc3luYyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBzdGFydEhlaWdodCwgYWxsb3dDb25jdXJyZW50Q2FsbHMpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zeW5jKHVuZGVmaW5lZCwgc3RhcnRIZWlnaHQsIGFsbG93Q29uY3VycmVudENhbGxzKSk7XG59XG5cbnNlbGYuc3RhcnRTeW5jaW5nID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHN5bmNQZXJpb2RJbk1zKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zdGFydFN5bmNpbmcoc3luY1BlcmlvZEluTXMpO1xufVxuXG5zZWxmLnN0b3BTeW5jaW5nID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN0b3BTeW5jaW5nKCk7XG59XG5cbnNlbGYuc2NhblR4cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eEhhc2hlcykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2NhblR4cyh0eEhhc2hlcyk7XG59XG5cbnNlbGYucmVzY2FuU3BlbnQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0ucmVzY2FuU3BlbnQoKTtcbn1cblxuc2VsZi5yZXNjYW5CbG9ja2NoYWluID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnJlc2NhbkJsb2NrY2hhaW4oKTtcbn1cblxuc2VsZi5nZXRCYWxhbmNlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRCYWxhbmNlKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpKS50b1N0cmluZygpO1xufVxuXG5zZWxmLmdldFVubG9ja2VkQmFsYW5jZSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0VW5sb2NrZWRCYWxhbmNlKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpKS50b1N0cmluZygpO1xufVxuXG5zZWxmLmdldEFjY291bnRzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGluY2x1ZGVTdWJhZGRyZXNzZXMsIHRhZykge1xuICBsZXQgYWNjb3VudEpzb25zID0gW107XG4gIGZvciAobGV0IGFjY291bnQgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0QWNjb3VudHMoaW5jbHVkZVN1YmFkZHJlc3NlcywgdGFnKSkgYWNjb3VudEpzb25zLnB1c2goYWNjb3VudC50b0pzb24oKSk7XG4gIHJldHVybiBhY2NvdW50SnNvbnM7XG59XG5cbnNlbGYuZ2V0QWNjb3VudCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SWR4LCBpbmNsdWRlU3ViYWRkcmVzc2VzKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0QWNjb3VudChhY2NvdW50SWR4LCBpbmNsdWRlU3ViYWRkcmVzc2VzKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuY3JlYXRlQWNjb3VudCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBsYWJlbCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmNyZWF0ZUFjY291bnQobGFiZWwpKS50b0pzb24oKTtcbn1cblxuc2VsZi5nZXRTdWJhZGRyZXNzZXMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0luZGljZXMpIHtcbiAgbGV0IHN1YmFkZHJlc3NKc29ucyA9IFtdO1xuICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSW5kaWNlcykpIHN1YmFkZHJlc3NKc29ucy5wdXNoKHN1YmFkZHJlc3MudG9Kc29uKCkpO1xuICByZXR1cm4gc3ViYWRkcmVzc0pzb25zO1xufVxuXG5zZWxmLmNyZWF0ZVN1YmFkZHJlc3MgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWNjb3VudElkeCwgbGFiZWwpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jcmVhdGVTdWJhZGRyZXNzKGFjY291bnRJZHgsIGxhYmVsKSkudG9Kc29uKCk7XG59XG5cbi8vIFRPRE86IGVhc2llciBvciBtb3JlIGVmZmljaWVudCB3YXkgdGhhbiBzZXJpYWxpemluZyBmcm9tIHJvb3QgYmxvY2tzP1xuc2VsZi5nZXRUeHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYmxvY2tKc29uUXVlcnkpIHtcbiAgXG4gIC8vIGRlc2VyaWFsaXplIHF1ZXJ5IHdoaWNoIGlzIGpzb24gc3RyaW5nIHJvb3RlZCBhdCBibG9ja1xuICBsZXQgcXVlcnkgPSBuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uUXVlcnksIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFhfUVVFUlkpLmdldFR4cygpWzBdO1xuICBcbiAgLy8gZ2V0IHR4c1xuICBsZXQgdHhzID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0VHhzKHF1ZXJ5KTtcbiAgXG4gIC8vIGNvbGxlY3QgdW5pcXVlIGJsb2NrcyB0byBwcmVzZXJ2ZSBtb2RlbCByZWxhdGlvbnNoaXBzIGFzIHRyZWVzIChiYXNlZCBvbiBtb25lcm9fd2FzbV9icmlkZ2UuY3BwOjpnZXRfdHhzKVxuICBsZXQgc2VlbkJsb2NrcyA9IG5ldyBTZXQoKTtcbiAgbGV0IHVuY29uZmlybWVkQmxvY2sgPSB1bmRlZmluZWQ7XG4gIGxldCBibG9ja3MgPSBbXTtcbiAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgaWYgKCF0eC5nZXRCbG9jaygpKSB7XG4gICAgICBpZiAoIXVuY29uZmlybWVkQmxvY2spIHVuY29uZmlybWVkQmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soKS5zZXRUeHMoW10pO1xuICAgICAgdHguc2V0QmxvY2sodW5jb25maXJtZWRCbG9jayk7XG4gICAgICB1bmNvbmZpcm1lZEJsb2NrLmdldFR4cygpLnB1c2godHgpO1xuICAgIH1cbiAgICBpZiAoIXNlZW5CbG9ja3MuaGFzKHR4LmdldEJsb2NrKCkpKSB7XG4gICAgICBzZWVuQmxvY2tzLmFkZCh0eC5nZXRCbG9jaygpKTtcbiAgICAgIGJsb2Nrcy5wdXNoKHR4LmdldEJsb2NrKCkpO1xuICAgIH1cbiAgfVxuICBcbiAgLy8gc2VyaWFsaXplIGJsb2NrcyB0byBqc29uXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYmxvY2tzLmxlbmd0aDsgaSsrKSBibG9ja3NbaV0gPSBibG9ja3NbaV0udG9Kc29uKCk7XG4gIHJldHVybiB7YmxvY2tzOiBibG9ja3N9O1xufVxuXG5zZWxmLmdldFRyYW5zZmVycyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBibG9ja0pzb25RdWVyeSkge1xuICBcbiAgLy8gZGVzZXJpYWxpemUgcXVlcnkgd2hpY2ggaXMganNvbiBzdHJpbmcgcm9vdGVkIGF0IGJsb2NrXG4gIGxldCBxdWVyeSA9IChuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uUXVlcnksIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFhfUVVFUlkpLmdldFR4cygpWzBdIGFzIE1vbmVyb1R4UXVlcnkpLmdldFRyYW5zZmVyUXVlcnkoKTtcbiAgXG4gIC8vIGdldCB0cmFuc2ZlcnNcbiAgbGV0IHRyYW5zZmVycyA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFRyYW5zZmVycyhxdWVyeSk7XG4gIFxuICAvLyBjb2xsZWN0IHVuaXF1ZSBibG9ja3MgdG8gcHJlc2VydmUgbW9kZWwgcmVsYXRpb25zaGlwcyBhcyB0cmVlXG4gIGxldCB1bmNvbmZpcm1lZEJsb2NrID0gdW5kZWZpbmVkO1xuICBsZXQgYmxvY2tzID0gW107XG4gIGxldCBzZWVuQmxvY2tzID0gbmV3IFNldCgpO1xuICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0cmFuc2ZlcnMpIHtcbiAgICBsZXQgdHggPSB0cmFuc2Zlci5nZXRUeCgpO1xuICAgIGlmICghdHguZ2V0QmxvY2soKSkge1xuICAgICAgaWYgKCF1bmNvbmZpcm1lZEJsb2NrKSB1bmNvbmZpcm1lZEJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0VHhzKFtdKTtcbiAgICAgIHR4LnNldEJsb2NrKHVuY29uZmlybWVkQmxvY2spO1xuICAgICAgdW5jb25maXJtZWRCbG9jay5nZXRUeHMoKS5wdXNoKHR4KTtcbiAgICB9XG4gICAgaWYgKCFzZWVuQmxvY2tzLmhhcyh0eC5nZXRCbG9jaygpKSkge1xuICAgICAgc2VlbkJsb2Nrcy5hZGQodHguZ2V0QmxvY2soKSk7XG4gICAgICBibG9ja3MucHVzaCh0eC5nZXRCbG9jaygpKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIHNlcmlhbGl6ZSBibG9ja3MgdG8ganNvblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGJsb2Nrcy5sZW5ndGg7IGkrKykgYmxvY2tzW2ldID0gYmxvY2tzW2ldLnRvSnNvbigpO1xuICByZXR1cm4gYmxvY2tzO1xufVxuXG5zZWxmLmdldE91dHB1dHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYmxvY2tKc29uUXVlcnkpIHtcblxuICAvLyBkZXNlcmlhbGl6ZSBxdWVyeSB3aGljaCBpcyBqc29uIHN0cmluZyByb290ZWQgYXQgYmxvY2tcbiAgbGV0IHF1ZXJ5ID0gKG5ldyBNb25lcm9CbG9jayhibG9ja0pzb25RdWVyeSwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWF9RVUVSWSkuZ2V0VHhzKClbMF0gYXMgTW9uZXJvVHhRdWVyeSkuZ2V0T3V0cHV0UXVlcnkoKTtcbiAgXG4gIC8vIGdldCBvdXRwdXRzXG4gIGxldCBvdXRwdXRzID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0T3V0cHV0cyhxdWVyeSk7XG4gIFxuICAvLyBjb2xsZWN0IHVuaXF1ZSBibG9ja3MgdG8gcHJlc2VydmUgbW9kZWwgcmVsYXRpb25zaGlwcyBhcyB0cmVlXG4gIGxldCB1bmNvbmZpcm1lZEJsb2NrID0gdW5kZWZpbmVkO1xuICBsZXQgYmxvY2tzID0gW107XG4gIGxldCBzZWVuQmxvY2tzID0gbmV3IFNldCgpO1xuICBmb3IgKGxldCBvdXRwdXQgb2Ygb3V0cHV0cykge1xuICAgIGxldCB0eCA9IG91dHB1dC5nZXRUeCgpO1xuICAgIGlmICghdHguZ2V0QmxvY2soKSkge1xuICAgICAgaWYgKCF1bmNvbmZpcm1lZEJsb2NrKSB1bmNvbmZpcm1lZEJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0VHhzKFtdKTtcbiAgICAgIHR4LnNldEJsb2NrKHVuY29uZmlybWVkQmxvY2spO1xuICAgICAgdW5jb25maXJtZWRCbG9jay5nZXRUeHMoKS5wdXNoKHR4KTtcbiAgICB9XG4gICAgaWYgKCFzZWVuQmxvY2tzLmhhcyh0eC5nZXRCbG9jaygpKSkge1xuICAgICAgc2VlbkJsb2Nrcy5hZGQodHguZ2V0QmxvY2soKSk7XG4gICAgICBibG9ja3MucHVzaCh0eC5nZXRCbG9jaygpKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIHNlcmlhbGl6ZSBibG9ja3MgdG8ganNvblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGJsb2Nrcy5sZW5ndGg7IGkrKykgYmxvY2tzW2ldID0gYmxvY2tzW2ldLnRvSnNvbigpO1xuICByZXR1cm4gYmxvY2tzO1xufVxuXG5zZWxmLmV4cG9ydE91dHB1dHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWxsKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5leHBvcnRPdXRwdXRzKGFsbCk7XG59XG5cbnNlbGYuaW1wb3J0T3V0cHV0cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBvdXRwdXRzSGV4KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pbXBvcnRPdXRwdXRzKG91dHB1dHNIZXgpO1xufVxuXG5zZWxmLmdldEtleUltYWdlcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhbGwpIHtcbiAgbGV0IGtleUltYWdlc0pzb24gPSBbXTtcbiAgZm9yIChsZXQga2V5SW1hZ2Ugb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZXhwb3J0S2V5SW1hZ2VzKGFsbCkpIGtleUltYWdlc0pzb24ucHVzaChrZXlJbWFnZS50b0pzb24oKSk7XG4gIHJldHVybiBrZXlJbWFnZXNKc29uO1xufVxuXG5zZWxmLmltcG9ydEtleUltYWdlcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBrZXlJbWFnZXNKc29uKSB7XG4gIGxldCBrZXlJbWFnZXMgPSBbXTtcbiAgZm9yIChsZXQga2V5SW1hZ2VKc29uIG9mIGtleUltYWdlc0pzb24pIGtleUltYWdlcy5wdXNoKG5ldyBNb25lcm9LZXlJbWFnZShrZXlJbWFnZUpzb24pKTtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pbXBvcnRLZXlJbWFnZXMoa2V5SW1hZ2VzKSkudG9Kc29uKCk7XG59XG5cbi8vYXN5bmMgZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQoKSB7XG4vLyAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuLy99XG5cbnNlbGYuZnJlZXplT3V0cHV0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGtleUltYWdlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5mcmVlemVPdXRwdXQoa2V5SW1hZ2UpO1xufVxuXG5zZWxmLnRoYXdPdXRwdXQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwga2V5SW1hZ2UpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnRoYXdPdXRwdXQoa2V5SW1hZ2UpO1xufVxuXG5zZWxmLmlzT3V0cHV0RnJvemVuID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGtleUltYWdlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pc091dHB1dEZyb3plbihrZXlJbWFnZSk7XG59XG5cbnNlbGYuZ2V0RGVmYXVsdEZlZVByaW9yaXR5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldERlZmF1bHRGZWVQcmlvcml0eSgpO1xufVxuXG5zZWxmLmNyZWF0ZVR4cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBjb25maWcpIHtcbiAgaWYgKHR5cGVvZiBjb25maWcgPT09IFwib2JqZWN0XCIpIGNvbmZpZyA9IG5ldyBNb25lcm9UeENvbmZpZyhjb25maWcpO1xuICBsZXQgdHhzID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uY3JlYXRlVHhzKGNvbmZpZyk7XG4gIHJldHVybiB0eHNbMF0uZ2V0VHhTZXQoKS50b0pzb24oKTtcbn1cblxuc2VsZi5zd2VlcE91dHB1dCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBjb25maWcpIHtcbiAgaWYgKHR5cGVvZiBjb25maWcgPT09IFwib2JqZWN0XCIpIGNvbmZpZyA9IG5ldyBNb25lcm9UeENvbmZpZyhjb25maWcpO1xuICBsZXQgdHggPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zd2VlcE91dHB1dChjb25maWcpO1xuICByZXR1cm4gdHguZ2V0VHhTZXQoKS50b0pzb24oKTtcbn1cblxuc2VsZi5zd2VlcFVubG9ja2VkID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGNvbmZpZykge1xuICBpZiAodHlwZW9mIGNvbmZpZyA9PT0gXCJvYmplY3RcIikgY29uZmlnID0gbmV3IE1vbmVyb1R4Q29uZmlnKGNvbmZpZyk7XG4gIGxldCB0eHMgPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zd2VlcFVubG9ja2VkKGNvbmZpZyk7XG4gIGxldCB0eFNldHMgPSBbXTtcbiAgZm9yIChsZXQgdHggb2YgdHhzKSBpZiAoIUdlblV0aWxzLmFycmF5Q29udGFpbnModHhTZXRzLCB0eC5nZXRUeFNldCgpKSkgdHhTZXRzLnB1c2godHguZ2V0VHhTZXQoKSk7XG4gIGxldCB0eFNldHNKc29uID0gW107XG4gIGZvciAobGV0IHR4U2V0IG9mIHR4U2V0cykgdHhTZXRzSnNvbi5wdXNoKHR4U2V0LnRvSnNvbigpKTtcbiAgcmV0dXJuIHR4U2V0c0pzb247XG59XG5cbnNlbGYuc3dlZXBEdXN0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHJlbGF5KSB7XG4gIGxldCB0eHMgPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zd2VlcER1c3QocmVsYXkpO1xuICByZXR1cm4gdHhzLmxlbmd0aCA9PT0gMCA/IHt9IDogdHhzWzBdLmdldFR4U2V0KCkudG9Kc29uKCk7XG59XG5cbnNlbGYucmVsYXlUeHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdHhNZXRhZGF0YXMpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnJlbGF5VHhzKHR4TWV0YWRhdGFzKTtcbn1cblxuc2VsZi5kZXNjcmliZVR4U2V0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4U2V0SnNvbikge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmRlc2NyaWJlVHhTZXQobmV3IE1vbmVyb1R4U2V0KHR4U2V0SnNvbikpKS50b0pzb24oKTtcbn1cblxuc2VsZi5zaWduVHhzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHVuc2lnbmVkVHhIZXgpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnNpZ25UeHModW5zaWduZWRUeEhleCk7XG59XG5cbnNlbGYuc3VibWl0VHhzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHNpZ25lZFR4SGV4KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zdWJtaXRUeHMoc2lnbmVkVHhIZXgpO1xufVxuXG5zZWxmLnNpZ25NZXNzYWdlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG1lc3NhZ2UsIHNpZ25hdHVyZVR5cGUsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnNpZ25NZXNzYWdlKG1lc3NhZ2UsIHNpZ25hdHVyZVR5cGUsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpO1xufVxuXG5zZWxmLnZlcmlmeU1lc3NhZ2UgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbWVzc2FnZSwgYWRkcmVzcywgc2lnbmF0dXJlKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0udmVyaWZ5TWVzc2FnZShtZXNzYWdlLCBhZGRyZXNzLCBzaWduYXR1cmUpKS50b0pzb24oKTtcbn1cblxuc2VsZi5nZXRUeEtleSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eEhhc2gpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFR4S2V5KHR4SGFzaCk7XG59XG5cbnNlbGYuY2hlY2tUeEtleSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eEhhc2gsIHR4S2V5LCBhZGRyZXNzKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uY2hlY2tUeEtleSh0eEhhc2gsIHR4S2V5LCBhZGRyZXNzKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZ2V0VHhQcm9vZiA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFR4UHJvb2YodHhIYXNoLCBhZGRyZXNzLCBtZXNzYWdlKTtcbn1cblxuc2VsZi5jaGVja1R4UHJvb2YgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdHhIYXNoLCBhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jaGVja1R4UHJvb2YodHhIYXNoLCBhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUpKS50b0pzb24oKTtcbn1cblxuc2VsZi5nZXRTcGVuZFByb29mID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaCwgbWVzc2FnZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0U3BlbmRQcm9vZih0eEhhc2gsIG1lc3NhZ2UpO1xufVxuXG5zZWxmLmNoZWNrU3BlbmRQcm9vZiA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eEhhc2gsIG1lc3NhZ2UsIHNpZ25hdHVyZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uY2hlY2tTcGVuZFByb29mKHR4SGFzaCwgbWVzc2FnZSwgc2lnbmF0dXJlKTtcbn1cblxuc2VsZi5nZXRSZXNlcnZlUHJvb2ZXYWxsZXQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbWVzc2FnZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0UmVzZXJ2ZVByb29mV2FsbGV0KG1lc3NhZ2UpO1xufVxuXG5zZWxmLmdldFJlc2VydmVQcm9vZkFjY291bnQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWNjb3VudElkeCwgYW1vdW50U3RyLCBtZXNzYWdlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRSZXNlcnZlUHJvb2ZBY2NvdW50KGFjY291bnRJZHgsIGFtb3VudFN0ciwgbWVzc2FnZSk7XG59XG5cbnNlbGYuY2hlY2tSZXNlcnZlUHJvb2YgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uY2hlY2tSZXNlcnZlUHJvb2YoYWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZ2V0VHhOb3RlcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eEhhc2hlcykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0VHhOb3Rlcyh0eEhhc2hlcyk7XG59XG5cbnNlbGYuc2V0VHhOb3RlcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eEhhc2hlcywgdHhOb3Rlcykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2V0VHhOb3Rlcyh0eEhhc2hlcywgdHhOb3Rlcyk7XG59XG5cbnNlbGYuZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGVudHJ5SW5kaWNlcykge1xuICBsZXQgZW50cmllc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgZW50cnkgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzKGVudHJ5SW5kaWNlcykpIGVudHJpZXNKc29uLnB1c2goZW50cnkudG9Kc29uKCkpO1xuICByZXR1cm4gZW50cmllc0pzb247XG59XG5cbnNlbGYuYWRkQWRkcmVzc0Jvb2tFbnRyeSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhZGRyZXNzLCBkZXNjcmlwdGlvbikge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uYWRkQWRkcmVzc0Jvb2tFbnRyeShhZGRyZXNzLCBkZXNjcmlwdGlvbik7XG59XG5cbnNlbGYuZWRpdEFkZHJlc3NCb29rRW50cnkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgaW5kZXgsIHNldEFkZHJlc3MsIGFkZHJlc3MsIHNldERlc2NyaXB0aW9uLCBkZXNjcmlwdGlvbikge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZWRpdEFkZHJlc3NCb29rRW50cnkoaW5kZXgsIHNldEFkZHJlc3MsIGFkZHJlc3MsIHNldERlc2NyaXB0aW9uLCBkZXNjcmlwdGlvbik7XG59XG5cbnNlbGYuZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBpbmRleCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeShpbmRleCk7XG59XG5cbnNlbGYudGFnQWNjb3VudHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdGFnLCBhY2NvdW50SW5kaWNlcykge1xuICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG59XG5cbnNlbGYudW50YWdBY2NvdW50cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SW5kaWNlcykge1xuICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG59XG5cbnNlbGYuZ2V0QWNjb3VudFRhZ3MgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG59XG5cbnNlbGYuc2V0QWNjb3VudFRhZ0xhYmVsID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHRhZywgbGFiZWwpIHtcbiAgdGhyb3cgbmV3IEVycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xufVxuXG5zZWxmLmdldFBheW1lbnRVcmkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgY29uZmlnSnNvbikge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0UGF5bWVudFVyaShuZXcgTW9uZXJvVHhDb25maWcoY29uZmlnSnNvbikpO1xufVxuXG5zZWxmLnBhcnNlUGF5bWVudFVyaSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB1cmkpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5wYXJzZVBheW1lbnRVcmkodXJpKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZ2V0QXR0cmlidXRlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGtleSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0QXR0cmlidXRlKGtleSk7XG59XG5cbnNlbGYuc2V0QXR0cmlidXRlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGtleSwgdmFsdWUpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnNldEF0dHJpYnV0ZShrZXksIHZhbHVlKTtcbn1cblxuc2VsZi5zdGFydE1pbmluZyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBudW1UaHJlYWRzLCBiYWNrZ3JvdW5kTWluaW5nLCBpZ25vcmVCYXR0ZXJ5KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zdGFydE1pbmluZyhudW1UaHJlYWRzLCBiYWNrZ3JvdW5kTWluaW5nLCBpZ25vcmVCYXR0ZXJ5KTtcbn1cblxuc2VsZi5zdG9wTWluaW5nID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN0b3BNaW5pbmcoKTtcbn1cblxuc2VsZi5pc011bHRpc2lnSW1wb3J0TmVlZGVkID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmlzTXVsdGlzaWdJbXBvcnROZWVkZWQoKTtcbn1cblxuc2VsZi5pc011bHRpc2lnID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmlzTXVsdGlzaWcoKTtcbn1cblxuc2VsZi5nZXRNdWx0aXNpZ0luZm8gPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldE11bHRpc2lnSW5mbygpKS50b0pzb24oKTtcbn1cblxuc2VsZi5wcmVwYXJlTXVsdGlzaWcgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0ucHJlcGFyZU11bHRpc2lnKCk7XG59XG5cbnNlbGYubWFrZU11bHRpc2lnID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG11bHRpc2lnSGV4ZXMsIHRocmVzaG9sZCwgcGFzc3dvcmQpIHtcbiAgcmV0dXJuIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLm1ha2VNdWx0aXNpZyhtdWx0aXNpZ0hleGVzLCB0aHJlc2hvbGQsIHBhc3N3b3JkKTtcbn1cblxuc2VsZi5leGNoYW5nZU11bHRpc2lnS2V5cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBtdWx0aXNpZ0hleGVzLCBwYXNzd29yZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmV4Y2hhbmdlTXVsdGlzaWdLZXlzKG11bHRpc2lnSGV4ZXMsIHBhc3N3b3JkKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZXhwb3J0TXVsdGlzaWdIZXggPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZXhwb3J0TXVsdGlzaWdIZXgoKTtcbn1cblxuc2VsZi5pbXBvcnRNdWx0aXNpZ0hleCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBtdWx0aXNpZ0hleGVzKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pbXBvcnRNdWx0aXNpZ0hleChtdWx0aXNpZ0hleGVzKTtcbn1cblxuc2VsZi5zaWduTXVsdGlzaWdUeEhleCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBtdWx0aXNpZ1R4SGV4KSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2lnbk11bHRpc2lnVHhIZXgobXVsdGlzaWdUeEhleCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLnN1Ym1pdE11bHRpc2lnVHhIZXggPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgc2lnbmVkTXVsdGlzaWdUeEhleCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc3VibWl0TXVsdGlzaWdUeEhleChzaWduZWRNdWx0aXNpZ1R4SGV4KTtcbn1cblxuc2VsZi5nZXREYXRhID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldERhdGEoKTtcbn1cblxuc2VsZi5jaGFuZ2VQYXNzd29yZCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBvbGRQYXNzd29yZCwgbmV3UGFzc3dvcmQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmNoYW5nZVBhc3N3b3JkKG9sZFBhc3N3b3JkLCBuZXdQYXNzd29yZCk7XG59XG5cbnNlbGYuaXNDbG9zZWQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gIXNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdIHx8IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmlzQ2xvc2VkKCk7XG59XG5cbnNlbGYuY2xvc2UgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgc2F2ZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uY2xvc2Uoc2F2ZSk7XG4gIGRlbGV0ZSBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXTtcbn0iXSwibWFwcGluZ3MiOiJrR0FBQSxJQUFBQSxPQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxTQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxXQUFBLEdBQUFILHNCQUFBLENB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