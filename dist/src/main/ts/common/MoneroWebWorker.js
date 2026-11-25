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

self.openWalletData = async function (walletId, path, password, networkType, keysData, cacheData, daemonUriOrConfig, regtest) {
  let daemonConnection = daemonUriOrConfig ? new _MoneroRpcConnection.default(daemonUriOrConfig) : undefined;
  self.WORKER_OBJECTS[walletId] = await _MoneroWalletFull.default.openWallet({ path: "", password: password, networkType: networkType, keysData: keysData, cacheData: cacheData, server: daemonConnection, proxyToWorker: false, regtest: regtest });
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
  return self.WORKER_OBJECTS[walletId].tagAccounts(tag, accountIndices);
};

self.untagAccounts = async function (walletId, accountIndices) {
  return self.WORKER_OBJECTS[walletId].untagAccounts(accountIndices);
};

self.getAccountTags = async function (walletId) {
  let accountTagsJson = [];
  for (let accountTag of await self.WORKER_OBJECTS[walletId].getAccountTags()) accountTagsJson.push(accountTag.toJson());
  return accountTagsJson;
};

self.setAccountTagLabel = async function (walletId, tag, label) {
  return self.WORKER_OBJECTS[walletId].setAccountTagLabel(tag, label);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfSHR0cENsaWVudCIsIl9MaWJyYXJ5VXRpbHMiLCJfTW9uZXJvQmFuIiwiX01vbmVyb0Jsb2NrIiwiX01vbmVyb0RhZW1vbkNvbmZpZyIsIl9Nb25lcm9EYWVtb25MaXN0ZW5lciIsIl9Nb25lcm9EYWVtb25ScGMiLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvS2V5SW1hZ2UiLCJfTW9uZXJvUnBjQ29ubmVjdGlvbiIsIl9Nb25lcm9UeENvbmZpZyIsIl9Nb25lcm9UeFNldCIsIl9Nb25lcm9VdGlscyIsIl9Nb25lcm9XYWxsZXRDb25maWciLCJfTW9uZXJvV2FsbGV0TGlzdGVuZXIiLCJfTW9uZXJvV2FsbGV0S2V5cyIsIl9Nb25lcm9XYWxsZXRGdWxsIiwiR2VuVXRpbHMiLCJpc0Rlbm8iLCJzZWxmIiwiZ2xvYmFsVGhpcyIsIkRlZGljYXRlZFdvcmtlckdsb2JhbFNjb3BlIiwicHJvdG90eXBlIiwiaXNQcm90b3R5cGVPZiIsIkh0dHBDbGllbnQiLCJMaWJyYXJ5VXRpbHMiLCJvbm1lc3NhZ2UiLCJlIiwiaW5pdE9uZVRpbWUiLCJvYmplY3RJZCIsImRhdGEiLCJmbk5hbWUiLCJjYWxsYmFja0lkIiwiYXNzZXJ0IiwiRXJyb3IiLCJzcGxpY2UiLCJwb3N0TWVzc2FnZSIsInJlc3VsdCIsImFwcGx5IiwiZXJyb3IiLCJzZXJpYWxpemVFcnJvciIsImlzSW5pdGlhbGl6ZWQiLCJXT1JLRVJfT0JKRUNUUyIsIk1vbmVyb1V0aWxzIiwiUFJPWFlfVE9fV09SS0VSIiwiaHR0cFJlcXVlc3QiLCJvcHRzIiwicmVxdWVzdCIsIk9iamVjdCIsImFzc2lnbiIsInByb3h5VG9Xb3JrZXIiLCJlcnIiLCJzdGF0dXNDb2RlIiwiSlNPTiIsInN0cmluZ2lmeSIsInN0YXR1c01lc3NhZ2UiLCJtZXNzYWdlIiwic2V0TG9nTGV2ZWwiLCJsZXZlbCIsImdldFdhc21NZW1vcnlVc2VkIiwiZ2V0V2FzbU1vZHVsZSIsIkhFQVA4IiwibGVuZ3RoIiwidW5kZWZpbmVkIiwibW9uZXJvVXRpbHNHZXRJbnRlZ3JhdGVkQWRkcmVzcyIsIm5ldHdvcmtUeXBlIiwic3RhbmRhcmRBZGRyZXNzIiwicGF5bWVudElkIiwiZ2V0SW50ZWdyYXRlZEFkZHJlc3MiLCJ0b0pzb24iLCJtb25lcm9VdGlsc1ZhbGlkYXRlQWRkcmVzcyIsImFkZHJlc3MiLCJ2YWxpZGF0ZUFkZHJlc3MiLCJtb25lcm9VdGlsc0pzb25Ub0JpbmFyeSIsImpzb24iLCJqc29uVG9CaW5hcnkiLCJtb25lcm9VdGlsc0JpbmFyeVRvSnNvbiIsInVpbnQ4YXJyIiwiYmluYXJ5VG9Kc29uIiwibW9uZXJvVXRpbHNCaW5hcnlCbG9ja3NUb0pzb24iLCJiaW5hcnlCbG9ja3NUb0pzb24iLCJkYWVtb25BZGRMaXN0ZW5lciIsImRhZW1vbklkIiwibGlzdGVuZXJJZCIsImxpc3RlbmVyIiwiTW9uZXJvRGFlbW9uTGlzdGVuZXIiLCJvbkJsb2NrSGVhZGVyIiwiYmxvY2tIZWFkZXIiLCJkYWVtb25MaXN0ZW5lcnMiLCJhZGRMaXN0ZW5lciIsImRhZW1vblJlbW92ZUxpc3RlbmVyIiwiTW9uZXJvRXJyb3IiLCJyZW1vdmVMaXN0ZW5lciIsImNvbm5lY3REYWVtb25ScGMiLCJjb25maWciLCJNb25lcm9EYWVtb25ScGMiLCJjb25uZWN0VG9EYWVtb25ScGMiLCJNb25lcm9EYWVtb25Db25maWciLCJkYWVtb25HZXRScGNDb25uZWN0aW9uIiwiY29ubmVjdGlvbiIsImdldFJwY0Nvbm5lY3Rpb24iLCJnZXRDb25maWciLCJkYWVtb25Jc0Nvbm5lY3RlZCIsImlzQ29ubmVjdGVkIiwiZGFlbW9uR2V0VmVyc2lvbiIsImdldFZlcnNpb24iLCJkYWVtb25Jc1RydXN0ZWQiLCJpc1RydXN0ZWQiLCJkYWVtb25HZXRIZWlnaHQiLCJnZXRIZWlnaHQiLCJkYWVtb25HZXRCbG9ja0hhc2giLCJoZWlnaHQiLCJnZXRCbG9ja0hhc2giLCJkYWVtb25HZXRCbG9ja1RlbXBsYXRlIiwid2FsbGV0QWRkcmVzcyIsInJlc2VydmVTaXplIiwiZ2V0QmxvY2tUZW1wbGF0ZSIsImRhZW1vbkdldExhc3RCbG9ja0hlYWRlciIsImdldExhc3RCbG9ja0hlYWRlciIsImRhZW1vbkdldEJsb2NrSGVhZGVyQnlIYXNoIiwiaGFzaCIsImdldEJsb2NrSGVhZGVyQnlIYXNoIiwiZGFlbW9uR2V0QmxvY2tIZWFkZXJCeUhlaWdodCIsImdldEJsb2NrSGVhZGVyQnlIZWlnaHQiLCJkYWVtb25HZXRCbG9ja0hlYWRlcnNCeVJhbmdlIiwic3RhcnRIZWlnaHQiLCJlbmRIZWlnaHQiLCJibG9ja0hlYWRlcnNKc29uIiwiZ2V0QmxvY2tIZWFkZXJzQnlSYW5nZSIsInB1c2giLCJkYWVtb25HZXRCbG9ja0J5SGFzaCIsImJsb2NrSGFzaCIsImdldEJsb2NrQnlIYXNoIiwiZGFlbW9uR2V0QmxvY2tzQnlIYXNoIiwiYmxvY2tIYXNoZXMiLCJwcnVuZSIsImJsb2Nrc0pzb24iLCJibG9jayIsImdldEJsb2Nrc0J5SGFzaCIsImRhZW1vbkdldEJsb2NrQnlIZWlnaHQiLCJnZXRCbG9ja0J5SGVpZ2h0IiwiZGFlbW9uR2V0QmxvY2tzQnlIZWlnaHQiLCJoZWlnaHRzIiwiZ2V0QmxvY2tzQnlIZWlnaHQiLCJkYWVtb25HZXRCbG9ja3NCeVJhbmdlIiwiZ2V0QmxvY2tzQnlSYW5nZSIsImRhZW1vbkdldEJsb2Nrc0J5UmFuZ2VDaHVua2VkIiwibWF4Q2h1bmtTaXplIiwiZ2V0QmxvY2tzQnlSYW5nZUNodW5rZWQiLCJkYWVtb25HZXRCbG9ja0hhc2hlcyIsImRhZW1vbkdldFR4cyIsInR4SGFzaGVzIiwidHhzIiwiZ2V0VHhzIiwiYmxvY2tzIiwidW5jb25maXJtZWRCbG9jayIsInNlZW5CbG9ja3MiLCJTZXQiLCJ0eCIsImdldEJsb2NrIiwiTW9uZXJvQmxvY2siLCJzZXRUeHMiLCJzZXRCbG9jayIsImhhcyIsImFkZCIsImkiLCJkYWVtb25HZXRUeEhleGVzIiwiZ2V0VHhIZXhlcyIsImRhZW1vbkdldE1pbmVyVHhTdW0iLCJudW1CbG9ja3MiLCJnZXRNaW5lclR4U3VtIiwiZGFlbW9uR2V0RmVlRXN0aW1hdGUiLCJncmFjZUJsb2NrcyIsImdldEZlZUVzdGltYXRlIiwiZGFlbW9uU3VibWl0VHhIZXgiLCJ0eEhleCIsImRvTm90UmVsYXkiLCJzdWJtaXRUeEhleCIsImRhZW1vblJlbGF5VHhzQnlIYXNoIiwicmVsYXlUeHNCeUhhc2giLCJkYWVtb25HZXRUeFBvb2wiLCJnZXRUeFBvb2wiLCJkYWVtb25HZXRUeFBvb2xIYXNoZXMiLCJnZXRUeFBvb2xIYXNoZXMiLCJkYWVtb25HZXRUeFBvb2xTdGF0cyIsImdldFR4UG9vbFN0YXRzIiwiZGFlbW9uRmx1c2hUeFBvb2wiLCJoYXNoZXMiLCJmbHVzaFR4UG9vbCIsImRhZW1vbkdldEtleUltYWdlU3BlbnRTdGF0dXNlcyIsImtleUltYWdlcyIsImdldEtleUltYWdlU3BlbnRTdGF0dXNlcyIsImRhZW1vbkdldE91dHB1dEhpc3RvZ3JhbSIsImFtb3VudHMiLCJtaW5Db3VudCIsIm1heENvdW50IiwiaXNVbmxvY2tlZCIsInJlY2VudEN1dG9mZiIsImVudHJpZXNKc29uIiwiZW50cnkiLCJnZXRPdXRwdXRIaXN0b2dyYW0iLCJkYWVtb25HZXRJbmZvIiwiZ2V0SW5mbyIsImRhZW1vbkdldFN5bmNJbmZvIiwiZ2V0U3luY0luZm8iLCJkYWVtb25HZXRIYXJkRm9ya0luZm8iLCJnZXRIYXJkRm9ya0luZm8iLCJkYWVtb25HZXRBbHRDaGFpbnMiLCJhbHRDaGFpbnNKc29uIiwiYWx0Q2hhaW4iLCJnZXRBbHRDaGFpbnMiLCJkYWVtb25HZXRBbHRCbG9ja0hhc2hlcyIsImdldEFsdEJsb2NrSGFzaGVzIiwiZGFlbW9uR2V0RG93bmxvYWRMaW1pdCIsImdldERvd25sb2FkTGltaXQiLCJkYWVtb25TZXREb3dubG9hZExpbWl0IiwibGltaXQiLCJzZXREb3dubG9hZExpbWl0IiwiZGFlbW9uUmVzZXREb3dubG9hZExpbWl0IiwicmVzZXREb3dubG9hZExpbWl0IiwiZGFlbW9uR2V0VXBsb2FkTGltaXQiLCJnZXRVcGxvYWRMaW1pdCIsImRhZW1vblNldFVwbG9hZExpbWl0Iiwic2V0VXBsb2FkTGltaXQiLCJkYWVtb25SZXNldFVwbG9hZExpbWl0IiwicmVzZXRVcGxvYWRMaW1pdCIsImRhZW1vbkdldFBlZXJzIiwicGVlcnNKc29uIiwicGVlciIsImdldFBlZXJzIiwiZGFlbW9uR2V0S25vd25QZWVycyIsImdldEtub3duUGVlcnMiLCJkYWVtb25TZXRPdXRnb2luZ1BlZXJMaW1pdCIsInNldE91dGdvaW5nUGVlckxpbWl0IiwiZGFlbW9uU2V0SW5jb21pbmdQZWVyTGltaXQiLCJzZXRJbmNvbWluZ1BlZXJMaW1pdCIsImRhZW1vbkdldFBlZXJCYW5zIiwiYmFuc0pzb24iLCJiYW4iLCJnZXRQZWVyQmFucyIsImRhZW1vblNldFBlZXJCYW5zIiwiYmFucyIsImJhbkpzb24iLCJNb25lcm9CYW4iLCJzZXRQZWVyQmFucyIsImRhZW1vblN0YXJ0TWluaW5nIiwibnVtVGhyZWFkcyIsImlzQmFja2dyb3VuZCIsImlnbm9yZUJhdHRlcnkiLCJzdGFydE1pbmluZyIsImRhZW1vblN0b3BNaW5pbmciLCJzdG9wTWluaW5nIiwiZGFlbW9uR2V0TWluaW5nU3RhdHVzIiwiZ2V0TWluaW5nU3RhdHVzIiwiZGFlbW9uU3VibWl0QmxvY2tzIiwiYmxvY2tCbG9icyIsInN1Ym1pdEJsb2NrcyIsImRhZW1vblBydW5lQmxvY2tjaGFpbiIsImNoZWNrIiwicHJ1bmVCbG9ja2NoYWluIiwiZGFlbW9uU3RvcCIsInN0b3AiLCJkYWVtb25XYWl0Rm9yTmV4dEJsb2NrSGVhZGVyIiwid2FpdEZvck5leHRCbG9ja0hlYWRlciIsIm9wZW5XYWxsZXREYXRhIiwid2FsbGV0SWQiLCJwYXRoIiwicGFzc3dvcmQiLCJrZXlzRGF0YSIsImNhY2hlRGF0YSIsImRhZW1vblVyaU9yQ29uZmlnIiwicmVndGVzdCIsImRhZW1vbkNvbm5lY3Rpb24iLCJNb25lcm9ScGNDb25uZWN0aW9uIiwiTW9uZXJvV2FsbGV0RnVsbCIsIm9wZW5XYWxsZXQiLCJzZXJ2ZXIiLCJzZXRCcm93c2VyTWFpblBhdGgiLCJjcmVhdGVXYWxsZXRLZXlzIiwiY29uZmlnSnNvbiIsIk1vbmVyb1dhbGxldENvbmZpZyIsInNldFByb3h5VG9Xb3JrZXIiLCJNb25lcm9XYWxsZXRLZXlzIiwiY3JlYXRlV2FsbGV0IiwiY3JlYXRlV2FsbGV0RnVsbCIsImdldFBhdGgiLCJzZXRQYXRoIiwiaXNWaWV3T25seSIsImdldE5ldHdvcmtUeXBlIiwiZ2V0U2VlZCIsImdldFNlZWRMYW5ndWFnZSIsImdldFNlZWRMYW5ndWFnZXMiLCJnZXRQcml2YXRlU3BlbmRLZXkiLCJnZXRQcml2YXRlVmlld0tleSIsImdldFB1YmxpY1ZpZXdLZXkiLCJnZXRQdWJsaWNTcGVuZEtleSIsImdldEFkZHJlc3MiLCJhY2NvdW50SWR4Iiwic3ViYWRkcmVzc0lkeCIsImdldEFkZHJlc3NJbmRleCIsInNldFN1YmFkZHJlc3NMYWJlbCIsImxhYmVsIiwiZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MiLCJpbnRlZ3JhdGVkQWRkcmVzcyIsInNldERhZW1vbkNvbm5lY3Rpb24iLCJnZXREYWVtb25Db25uZWN0aW9uIiwiaXNEYWVtb25UcnVzdGVkIiwiaXNDb25uZWN0ZWRUb0RhZW1vbiIsImdldFJlc3RvcmVIZWlnaHQiLCJzZXRSZXN0b3JlSGVpZ2h0IiwicmVzdG9yZUhlaWdodCIsImdldERhZW1vbkhlaWdodCIsImdldERhZW1vbk1heFBlZXJIZWlnaHQiLCJnZXRIZWlnaHRCeURhdGUiLCJ5ZWFyIiwibW9udGgiLCJkYXkiLCJpc0RhZW1vblN5bmNlZCIsIldhbGxldFdvcmtlckhlbHBlckxpc3RlbmVyIiwiTW9uZXJvV2FsbGV0TGlzdGVuZXIiLCJjb25zdHJ1Y3RvciIsImlkIiwid29ya2VyIiwiZ2V0SWQiLCJvblN5bmNQcm9ncmVzcyIsInBlcmNlbnREb25lIiwib25OZXdCbG9jayIsIm9uQmFsYW5jZXNDaGFuZ2VkIiwibmV3QmFsYW5jZSIsIm5ld1VubG9ja2VkQmFsYW5jZSIsInRvU3RyaW5nIiwib25PdXRwdXRSZWNlaXZlZCIsIm91dHB1dCIsImdldFR4Iiwib25PdXRwdXRTcGVudCIsImxpc3RlbmVycyIsImlzU3luY2VkIiwic3luYyIsImFsbG93Q29uY3VycmVudENhbGxzIiwic3RhcnRTeW5jaW5nIiwic3luY1BlcmlvZEluTXMiLCJzdG9wU3luY2luZyIsInNjYW5UeHMiLCJyZXNjYW5TcGVudCIsInJlc2NhbkJsb2NrY2hhaW4iLCJnZXRCYWxhbmNlIiwiZ2V0VW5sb2NrZWRCYWxhbmNlIiwiZ2V0QWNjb3VudHMiLCJpbmNsdWRlU3ViYWRkcmVzc2VzIiwidGFnIiwiYWNjb3VudEpzb25zIiwiYWNjb3VudCIsImdldEFjY291bnQiLCJjcmVhdGVBY2NvdW50IiwiZ2V0U3ViYWRkcmVzc2VzIiwic3ViYWRkcmVzc0luZGljZXMiLCJzdWJhZGRyZXNzSnNvbnMiLCJzdWJhZGRyZXNzIiwiY3JlYXRlU3ViYWRkcmVzcyIsImJsb2NrSnNvblF1ZXJ5IiwicXVlcnkiLCJEZXNlcmlhbGl6YXRpb25UeXBlIiwiVFhfUVVFUlkiLCJnZXRUcmFuc2ZlcnMiLCJnZXRUcmFuc2ZlclF1ZXJ5IiwidHJhbnNmZXJzIiwidHJhbnNmZXIiLCJnZXRPdXRwdXRzIiwiZ2V0T3V0cHV0UXVlcnkiLCJvdXRwdXRzIiwiZXhwb3J0T3V0cHV0cyIsImFsbCIsImltcG9ydE91dHB1dHMiLCJvdXRwdXRzSGV4IiwiZ2V0S2V5SW1hZ2VzIiwiZXhwb3J0S2V5SW1hZ2VzIiwiaW1wb3J0S2V5SW1hZ2VzIiwia2V5SW1hZ2VzSnNvbiIsIm9mZnNldCIsImtleUltYWdlSnNvbiIsIk1vbmVyb0tleUltYWdlIiwiZnJlZXplT3V0cHV0Iiwia2V5SW1hZ2UiLCJ0aGF3T3V0cHV0IiwiaXNPdXRwdXRGcm96ZW4iLCJnZXREZWZhdWx0RmVlUHJpb3JpdHkiLCJjcmVhdGVUeHMiLCJNb25lcm9UeENvbmZpZyIsImdldFR4U2V0Iiwic3dlZXBPdXRwdXQiLCJzd2VlcFVubG9ja2VkIiwidHhTZXRzIiwiYXJyYXlDb250YWlucyIsInR4U2V0c0pzb24iLCJ0eFNldCIsInN3ZWVwRHVzdCIsInJlbGF5IiwicmVsYXlUeHMiLCJ0eE1ldGFkYXRhcyIsImRlc2NyaWJlVHhTZXQiLCJ0eFNldEpzb24iLCJNb25lcm9UeFNldCIsInNpZ25UeHMiLCJ1bnNpZ25lZFR4SGV4Iiwic3VibWl0VHhzIiwic2lnbmVkVHhIZXgiLCJzaWduTWVzc2FnZSIsInNpZ25hdHVyZVR5cGUiLCJ2ZXJpZnlNZXNzYWdlIiwic2lnbmF0dXJlIiwiZ2V0VHhLZXkiLCJ0eEhhc2giLCJjaGVja1R4S2V5IiwidHhLZXkiLCJnZXRUeFByb29mIiwiY2hlY2tUeFByb29mIiwiZ2V0U3BlbmRQcm9vZiIsImNoZWNrU3BlbmRQcm9vZiIsImdldFJlc2VydmVQcm9vZldhbGxldCIsImdldFJlc2VydmVQcm9vZkFjY291bnQiLCJhbW91bnRTdHIiLCJjaGVja1Jlc2VydmVQcm9vZiIsImdldFR4Tm90ZXMiLCJzZXRUeE5vdGVzIiwidHhOb3RlcyIsImdldEFkZHJlc3NCb29rRW50cmllcyIsImVudHJ5SW5kaWNlcyIsImFkZEFkZHJlc3NCb29rRW50cnkiLCJkZXNjcmlwdGlvbiIsImVkaXRBZGRyZXNzQm9va0VudHJ5IiwiaW5kZXgiLCJzZXRBZGRyZXNzIiwic2V0RGVzY3JpcHRpb24iLCJkZWxldGVBZGRyZXNzQm9va0VudHJ5IiwidGFnQWNjb3VudHMiLCJhY2NvdW50SW5kaWNlcyIsInVudGFnQWNjb3VudHMiLCJnZXRBY2NvdW50VGFncyIsImFjY291bnRUYWdzSnNvbiIsImFjY291bnRUYWciLCJzZXRBY2NvdW50VGFnTGFiZWwiLCJnZXRQYXltZW50VXJpIiwicGFyc2VQYXltZW50VXJpIiwidXJpIiwiZ2V0QXR0cmlidXRlIiwia2V5Iiwic2V0QXR0cmlidXRlIiwidmFsdWUiLCJiYWNrZ3JvdW5kTWluaW5nIiwiaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCIsImlzTXVsdGlzaWciLCJnZXRNdWx0aXNpZ0luZm8iLCJwcmVwYXJlTXVsdGlzaWciLCJtYWtlTXVsdGlzaWciLCJtdWx0aXNpZ0hleGVzIiwidGhyZXNob2xkIiwiZXhjaGFuZ2VNdWx0aXNpZ0tleXMiLCJleHBvcnRNdWx0aXNpZ0hleCIsImltcG9ydE11bHRpc2lnSGV4IiwicmVmcmVzaEFmdGVySW1wb3J0Iiwic2lnbk11bHRpc2lnVHhIZXgiLCJtdWx0aXNpZ1R4SGV4Iiwic3VibWl0TXVsdGlzaWdUeEhleCIsInNpZ25lZE11bHRpc2lnVHhIZXgiLCJnZXREYXRhIiwiY2hhbmdlUGFzc3dvcmQiLCJvbGRQYXNzd29yZCIsIm5ld1Bhc3N3b3JkIiwiaXNDbG9zZWQiLCJwcmVwYXJlQ2xvc2UiLCJnZXRDbG9zZURhdGEiLCJjbG9zZSIsInNhdmUiLCJmaWx0ZXIiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy9jb21tb24vTW9uZXJvV2ViV29ya2VyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IEdlblV0aWxzIGZyb20gXCIuL0dlblV0aWxzXCI7XG5pbXBvcnQgSHR0cENsaWVudCBmcm9tIFwiLi9IdHRwQ2xpZW50XCI7XG5pbXBvcnQgTGlicmFyeVV0aWxzIGZyb20gXCIuL0xpYnJhcnlVdGlsc1wiO1xuaW1wb3J0IE1vbmVyb0JhbiBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0JhblwiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvQmxvY2tcIjtcbmltcG9ydCBNb25lcm9EYWVtb25Db25maWcgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9EYWVtb25Db25maWdcIjtcbmltcG9ydCBNb25lcm9EYWVtb25MaXN0ZW5lciBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0RhZW1vbkxpc3RlbmVyXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uUnBjIGZyb20gXCIuLi9kYWVtb24vTW9uZXJvRGFlbW9uUnBjXCI7XG5pbXBvcnQgTW9uZXJvRXJyb3IgZnJvbSBcIi4vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZSBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0tleUltYWdlXCI7XG5pbXBvcnQgTW9uZXJvUnBjQ29ubmVjdGlvbiBmcm9tIFwiLi9Nb25lcm9ScGNDb25uZWN0aW9uXCI7XG5pbXBvcnQgTW9uZXJvVHhDb25maWcgZnJvbSBcIi4uL3dhbGxldC9tb2RlbC9Nb25lcm9UeENvbmZpZ1wiO1xuaW1wb3J0IE1vbmVyb1R4UXVlcnkgZnJvbSBcIi4uL3dhbGxldC9tb2RlbC9Nb25lcm9UeFF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvVHhTZXQgZnJvbSBcIi4uL3dhbGxldC9tb2RlbC9Nb25lcm9UeFNldFwiO1xuaW1wb3J0IE1vbmVyb1V0aWxzIGZyb20gXCIuL01vbmVyb1V0aWxzXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0Q29uZmlnIGZyb20gXCIuLi93YWxsZXQvbW9kZWwvTW9uZXJvV2FsbGV0Q29uZmlnXCJcbmltcG9ydCBNb25lcm9XYWxsZXRMaXN0ZW5lciBmcm9tIFwiLi4vd2FsbGV0L21vZGVsL01vbmVyb1dhbGxldExpc3RlbmVyXCJcbmltcG9ydCB7TW9uZXJvV2FsbGV0S2V5c30gZnJvbSBcIi4uL3dhbGxldC9Nb25lcm9XYWxsZXRLZXlzXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0RnVsbCBmcm9tIFwiLi4vd2FsbGV0L01vbmVyb1dhbGxldEZ1bGxcIjtcblxuZGVjbGFyZSB2YXIgc2VsZjogYW55O1xuXG4vLyBkZW5vIGNvbmZpZ3VyYXRpb25cbmRlY2xhcmUgdmFyIERlZGljYXRlZFdvcmtlckdsb2JhbFNjb3BlOiBhbnk7XG5pZiAoR2VuVXRpbHMuaXNEZW5vKCkgJiYgdHlwZW9mIHNlbGYgPT09IFwidW5kZWZpbmVkXCIgJiYgdHlwZW9mIGdsb2JhbFRoaXMgPT09IFwib2JqZWN0XCIgJiYgdHlwZW9mIERlZGljYXRlZFdvcmtlckdsb2JhbFNjb3BlID09PSBcImZ1bmN0aW9uXCIgJiYgRGVkaWNhdGVkV29ya2VyR2xvYmFsU2NvcGUucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoZ2xvYmFsVGhpcykpIHtcbiAgc2VsZiA9IGdsb2JhbFRoaXM7XG4gIChnbG9iYWxUaGlzIGFzIGFueSkuc2VsZiA9IGdsb2JhbFRoaXM7XG59XG5cbi8vIGV4cG9zZSBzb21lIG1vZHVsZXMgdG8gdGhlIHdvcmtlclxuc2VsZi5IdHRwQ2xpZW50ID0gSHR0cENsaWVudDtcbnNlbGYuTGlicmFyeVV0aWxzID0gTGlicmFyeVV0aWxzO1xuc2VsZi5HZW5VdGlscyA9IEdlblV0aWxzO1xuXG4vKipcbiAqIFdvcmtlciB0byBtYW5hZ2UgYSBkYWVtb24gYW5kIHdhc20gd2FsbGV0IG9mZiB0aGUgbWFpbiB0aHJlYWQgdXNpbmcgbWVzc2FnZXMuXG4gKiBcbiAqIFJlcXVpcmVkIG1lc3NhZ2UgZm9ybWF0OiBlLmRhdGFbMF0gPSBvYmplY3QgaWQsIGUuZGF0YVsxXSA9IGZ1bmN0aW9uIG5hbWUsIGUuZGF0YVsyK10gPSBmdW5jdGlvbiBhcmdzXG4gKlxuICogRm9yIGJyb3dzZXIgYXBwbGljYXRpb25zLCB0aGlzIGZpbGUgbXVzdCBiZSBicm93c2VyaWZpZWQgYW5kIHBsYWNlZCBpbiB0aGUgd2ViIGFwcCByb290LlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5zZWxmLm9ubWVzc2FnZSA9IGFzeW5jIGZ1bmN0aW9uKGUpIHtcbiAgXG4gIC8vIGluaXRpYWxpemUgb25lIHRpbWVcbiAgYXdhaXQgc2VsZi5pbml0T25lVGltZSgpO1xuICBcbiAgLy8gdmFsaWRhdGUgcGFyYW1zXG4gIGxldCBvYmplY3RJZCA9IGUuZGF0YVswXTtcbiAgbGV0IGZuTmFtZSA9IGUuZGF0YVsxXTtcbiAgbGV0IGNhbGxiYWNrSWQgPSBlLmRhdGFbMl07XG4gIGFzc2VydChmbk5hbWUsIFwiTXVzdCBwcm92aWRlIGZ1bmN0aW9uIG5hbWUgdG8gd29ya2VyXCIpO1xuICBhc3NlcnQoY2FsbGJhY2tJZCwgXCJNdXN0IHByb3ZpZGUgY2FsbGJhY2sgaWQgdG8gd29ya2VyXCIpO1xuICBpZiAoIXNlbGZbZm5OYW1lXSkgdGhyb3cgbmV3IEVycm9yKFwiTWV0aG9kICdcIiArIGZuTmFtZSArIFwiJyBpcyBub3QgcmVnaXN0ZXJlZCB3aXRoIHdvcmtlclwiKTtcbiAgZS5kYXRhLnNwbGljZSgxLCAyKTsgLy8gcmVtb3ZlIGZ1bmN0aW9uIG5hbWUgYW5kIGNhbGxiYWNrIGlkIHRvIGFwcGx5IGZ1bmN0aW9uIHdpdGggYXJndW1lbnRzXG4gIFxuICAvLyBleGVjdXRlIHdvcmtlciBmdW5jdGlvbiBhbmQgcG9zdCByZXN1bHQgdG8gY2FsbGJhY2tcbiAgdHJ5IHtcbiAgICBwb3N0TWVzc2FnZShbb2JqZWN0SWQsIGNhbGxiYWNrSWQsIHtyZXN1bHQ6IGF3YWl0IHNlbGZbZm5OYW1lXS5hcHBseShudWxsLCBlLmRhdGEpfV0pO1xuICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICBpZiAoIShlIGluc3RhbmNlb2YgRXJyb3IpKSBlID0gbmV3IEVycm9yKGUpO1xuICAgIHBvc3RNZXNzYWdlKFtvYmplY3RJZCwgY2FsbGJhY2tJZCwge2Vycm9yOiBMaWJyYXJ5VXRpbHMuc2VyaWFsaXplRXJyb3IoZSl9XSk7XG4gIH1cbn1cblxuc2VsZi5pbml0T25lVGltZSA9IGFzeW5jIGZ1bmN0aW9uKCkge1xuICBpZiAoIXNlbGYuaXNJbml0aWFsaXplZCkge1xuICAgIHNlbGYuV09SS0VSX09CSkVDVFMgPSB7fTtcbiAgICBzZWxmLmlzSW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIE1vbmVyb1V0aWxzLlBST1hZX1RPX1dPUktFUiA9IGZhbHNlO1xuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBTVEFUSUMgVVRJTElUSUVTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuc2VsZi5odHRwUmVxdWVzdCA9IGFzeW5jIGZ1bmN0aW9uKG9iamVjdElkLCBvcHRzKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGF3YWl0IEh0dHBDbGllbnQucmVxdWVzdChPYmplY3QuYXNzaWduKG9wdHMsIHtwcm94eVRvV29ya2VyOiBmYWxzZX0pKTsgIFxuICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgIHRocm93IGVyci5zdGF0dXNDb2RlID8gbmV3IEVycm9yKEpTT04uc3RyaW5naWZ5KHtzdGF0dXNDb2RlOiBlcnIuc3RhdHVzQ29kZSwgc3RhdHVzTWVzc2FnZTogZXJyLm1lc3NhZ2V9KSkgOiBlcnI7XG4gIH1cbn1cblxuc2VsZi5zZXRMb2dMZXZlbCA9IGFzeW5jIGZ1bmN0aW9uKG9iamVjdElkLCBsZXZlbCkge1xuICByZXR1cm4gTGlicmFyeVV0aWxzLnNldExvZ0xldmVsKGxldmVsKTtcbn1cblxuc2VsZi5nZXRXYXNtTWVtb3J5VXNlZCA9IGFzeW5jIGZ1bmN0aW9uKG9iamVjdElkKSB7XG4gIHJldHVybiBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpICYmIExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkuSEVBUDggPyBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLkhFQVA4Lmxlbmd0aCA6IHVuZGVmaW5lZDtcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gTU9ORVJPIFVUSUxTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5zZWxmLm1vbmVyb1V0aWxzR2V0SW50ZWdyYXRlZEFkZHJlc3MgPSBhc3luYyBmdW5jdGlvbihvYmplY3RJZCwgbmV0d29ya1R5cGUsIHN0YW5kYXJkQWRkcmVzcywgcGF5bWVudElkKSB7XG4gIHJldHVybiAoYXdhaXQgTW9uZXJvVXRpbHMuZ2V0SW50ZWdyYXRlZEFkZHJlc3MobmV0d29ya1R5cGUsIHN0YW5kYXJkQWRkcmVzcywgcGF5bWVudElkKSkudG9Kc29uKCk7XG59XG5cbnNlbGYubW9uZXJvVXRpbHNWYWxpZGF0ZUFkZHJlc3MgPSBhc3luYyBmdW5jdGlvbihvYmplY3RJZCwgYWRkcmVzcywgbmV0d29ya1R5cGUpIHtcbiAgcmV0dXJuIE1vbmVyb1V0aWxzLnZhbGlkYXRlQWRkcmVzcyhhZGRyZXNzLCBuZXR3b3JrVHlwZSk7XG59XG5cbnNlbGYubW9uZXJvVXRpbHNKc29uVG9CaW5hcnkgPSBhc3luYyBmdW5jdGlvbihvYmplY3RJZCwganNvbikge1xuICByZXR1cm4gTW9uZXJvVXRpbHMuanNvblRvQmluYXJ5KGpzb24pO1xufVxuXG5zZWxmLm1vbmVyb1V0aWxzQmluYXJ5VG9Kc29uID0gYXN5bmMgZnVuY3Rpb24ob2JqZWN0SWQsIHVpbnQ4YXJyKSB7XG4gIHJldHVybiBNb25lcm9VdGlscy5iaW5hcnlUb0pzb24odWludDhhcnIpO1xufVxuXG5zZWxmLm1vbmVyb1V0aWxzQmluYXJ5QmxvY2tzVG9Kc29uID0gYXN5bmMgZnVuY3Rpb24ob2JqZWN0SWQsIHVpbnQ4YXJyKSB7XG4gIHJldHVybiBNb25lcm9VdGlscy5iaW5hcnlCbG9ja3NUb0pzb24odWludDhhcnIpO1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIERBRU1PTiBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnNlbGYuZGFlbW9uQWRkTGlzdGVuZXIgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgbGlzdGVuZXJJZCkge1xuICBsZXQgbGlzdGVuZXIgPSBuZXcgY2xhc3MgZXh0ZW5kcyBNb25lcm9EYWVtb25MaXN0ZW5lciB7XG4gICAgYXN5bmMgb25CbG9ja0hlYWRlcihibG9ja0hlYWRlcikge1xuICAgICAgc2VsZi5wb3N0TWVzc2FnZShbZGFlbW9uSWQsIFwib25CbG9ja0hlYWRlcl9cIiArIGxpc3RlbmVySWQsIGJsb2NrSGVhZGVyLnRvSnNvbigpXSk7XG4gICAgfVxuICB9XG4gIGlmICghc2VsZi5kYWVtb25MaXN0ZW5lcnMpIHNlbGYuZGFlbW9uTGlzdGVuZXJzID0ge307XG4gIHNlbGYuZGFlbW9uTGlzdGVuZXJzW2xpc3RlbmVySWRdID0gbGlzdGVuZXI7XG4gIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbn1cblxuc2VsZi5kYWVtb25SZW1vdmVMaXN0ZW5lciA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBsaXN0ZW5lcklkKSB7XG4gIGlmICghc2VsZi5kYWVtb25MaXN0ZW5lcnNbbGlzdGVuZXJJZF0pIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vIGRhZW1vbiB3b3JrZXIgbGlzdGVuZXIgcmVnaXN0ZXJlZCB3aXRoIGlkOiBcIiArIGxpc3RlbmVySWQpO1xuICBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5yZW1vdmVMaXN0ZW5lcihzZWxmLmRhZW1vbkxpc3RlbmVyc1tsaXN0ZW5lcklkXSk7XG4gIGRlbGV0ZSBzZWxmLmRhZW1vbkxpc3RlbmVyc1tsaXN0ZW5lcklkXTtcbn1cblxuc2VsZi5jb25uZWN0RGFlbW9uUnBjID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGNvbmZpZykge1xuICBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXSA9IGF3YWl0IE1vbmVyb0RhZW1vblJwYy5jb25uZWN0VG9EYWVtb25ScGMobmV3IE1vbmVyb0RhZW1vbkNvbmZpZyhjb25maWcpKTtcbn1cblxuc2VsZi5kYWVtb25HZXRScGNDb25uZWN0aW9uID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgbGV0IGNvbm5lY3Rpb24gPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRScGNDb25uZWN0aW9uKCk7XG4gIHJldHVybiBjb25uZWN0aW9uID8gY29ubmVjdGlvbi5nZXRDb25maWcoKSA6IHVuZGVmaW5lZDtcbn1cblxuc2VsZi5kYWVtb25Jc0Nvbm5lY3RlZCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5pc0Nvbm5lY3RlZCgpO1xufVxuXG5zZWxmLmRhZW1vbkdldFZlcnNpb24gPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldFZlcnNpb24oKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uSXNUcnVzdGVkID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmlzVHJ1c3RlZCgpO1xufVxuXG5zZWxmLmRhZW1vbkdldEhlaWdodCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRIZWlnaHQoKTtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja0hhc2ggPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgaGVpZ2h0KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja0hhc2goaGVpZ2h0KTtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja1RlbXBsYXRlID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIHdhbGxldEFkZHJlc3MsIHJlc2VydmVTaXplKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tUZW1wbGF0ZSh3YWxsZXRBZGRyZXNzLCByZXNlcnZlU2l6ZSkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbkdldExhc3RCbG9ja0hlYWRlciA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0TGFzdEJsb2NrSGVhZGVyKCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2NrSGVhZGVyQnlIYXNoID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGhhc2gpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja0hlYWRlckJ5SGFzaChoYXNoKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tIZWFkZXJCeUhlaWdodCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBoZWlnaHQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja0hlYWRlckJ5SGVpZ2h0KGhlaWdodCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2NrSGVhZGVyc0J5UmFuZ2UgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCkge1xuICBsZXQgYmxvY2tIZWFkZXJzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBibG9ja0hlYWRlciBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja0hlYWRlcnNCeVJhbmdlKHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpKSBibG9ja0hlYWRlcnNKc29uLnB1c2goYmxvY2tIZWFkZXIudG9Kc29uKCkpO1xuICByZXR1cm4gYmxvY2tIZWFkZXJzSnNvbjtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja0J5SGFzaCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBibG9ja0hhc2gpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja0J5SGFzaChibG9ja0hhc2gpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja3NCeUhhc2ggPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgYmxvY2tIYXNoZXMsIHN0YXJ0SGVpZ2h0LCBwcnVuZSkge1xuICBsZXQgYmxvY2tzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBibG9jayBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja3NCeUhhc2goYmxvY2tIYXNoZXMsIHN0YXJ0SGVpZ2h0LCBwcnVuZSkpIGJsb2Nrc0pzb24ucHVzaChibG9jay50b0pzb24oKSk7XG4gIHJldHVybiBibG9ja3NKc29uO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2NrQnlIZWlnaHQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgaGVpZ2h0KSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tCeUhlaWdodChoZWlnaHQpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja3NCeUhlaWdodCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBoZWlnaHRzKSB7XG4gIGxldCBibG9ja3NKc29uID0gW107XG4gIGZvciAobGV0IGJsb2NrIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2Nrc0J5SGVpZ2h0KGhlaWdodHMpKSBibG9ja3NKc29uLnB1c2goYmxvY2sudG9Kc29uKCkpO1xuICByZXR1cm4gYmxvY2tzSnNvbjtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja3NCeVJhbmdlID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpIHtcbiAgbGV0IGJsb2Nrc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgYmxvY2sgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tzQnlSYW5nZShzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSkgYmxvY2tzSnNvbi5wdXNoKGJsb2NrLnRvSnNvbigpKTtcbiAgcmV0dXJuIGJsb2Nrc0pzb247XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tzQnlSYW5nZUNodW5rZWQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgbWF4Q2h1bmtTaXplKSB7XG4gIGxldCBibG9ja3NKc29uID0gW107XG4gIGZvciAobGV0IGJsb2NrIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2Nrc0J5UmFuZ2VDaHVua2VkKHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIG1heENodW5rU2l6ZSkpIGJsb2Nrc0pzb24ucHVzaChibG9jay50b0pzb24oKSk7XG4gIHJldHVybiBibG9ja3NKc29uO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2NrSGFzaGVzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGJsb2NrSGFzaGVzLCBzdGFydEhlaWdodCkge1xuICB0aHJvdyBuZXcgRXJyb3IoXCJ3b3JrZXIuZ2V0QmxvY2tIYXNoZXMgbm90IGltcGxlbWVudGVkXCIpO1xufVxuXG4vLyBUT0RPOiBmYWN0b3IgY29tbW9uIGNvZGUgd2l0aCBzZWxmLmdldFR4cygpXG5zZWxmLmRhZW1vbkdldFR4cyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCB0eEhhc2hlcywgcHJ1bmUpIHtcbiAgXG4gIC8vIGdldCB0eHNcbiAgbGV0IHR4cyA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldFR4cyh0eEhhc2hlcywgcHJ1bmUpO1xuICBcbiAgLy8gY29sbGVjdCB1bmlxdWUgYmxvY2tzIHRvIHByZXNlcnZlIG1vZGVsIHJlbGF0aW9uc2hpcHMgYXMgdHJlZXMgKGJhc2VkIG9uIG1vbmVyb193YXNtX2JyaWRnZS5jcHA6OmdldF90eHMpXG4gIGxldCBibG9ja3MgPSBbXTtcbiAgbGV0IHVuY29uZmlybWVkQmxvY2sgPSB1bmRlZmluZWRcbiAgbGV0IHNlZW5CbG9ja3MgPSBuZXcgU2V0KCk7XG4gIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgIGlmICghdHguZ2V0QmxvY2soKSkge1xuICAgICAgaWYgKCF1bmNvbmZpcm1lZEJsb2NrKSB1bmNvbmZpcm1lZEJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0VHhzKFtdKTtcbiAgICAgIHR4LnNldEJsb2NrKHVuY29uZmlybWVkQmxvY2spO1xuICAgICAgdW5jb25maXJtZWRCbG9jay5nZXRUeHMoKS5wdXNoKHR4KTtcbiAgICB9XG4gICAgaWYgKCFzZWVuQmxvY2tzLmhhcyh0eC5nZXRCbG9jaygpKSkge1xuICAgICAgc2VlbkJsb2Nrcy5hZGQodHguZ2V0QmxvY2soKSk7XG4gICAgICBibG9ja3MucHVzaCh0eC5nZXRCbG9jaygpKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIHNlcmlhbGl6ZSBibG9ja3MgdG8ganNvblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGJsb2Nrcy5sZW5ndGg7IGkrKykgYmxvY2tzW2ldID0gYmxvY2tzW2ldLnRvSnNvbigpO1xuICByZXR1cm4gYmxvY2tzO1xufVxuXG5zZWxmLmRhZW1vbkdldFR4SGV4ZXMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgdHhIYXNoZXMsIHBydW5lKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRUeEhleGVzKHR4SGFzaGVzLCBwcnVuZSk7XG59XG5cbnNlbGYuZGFlbW9uR2V0TWluZXJUeFN1bSA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBoZWlnaHQsIG51bUJsb2Nrcykge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldE1pbmVyVHhTdW0oaGVpZ2h0LCBudW1CbG9ja3MpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRGZWVFc3RpbWF0ZSA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBncmFjZUJsb2Nrcykge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEZlZUVzdGltYXRlKGdyYWNlQmxvY2tzKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uU3VibWl0VHhIZXggPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgdHhIZXgsIGRvTm90UmVsYXkpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5zdWJtaXRUeEhleCh0eEhleCwgZG9Ob3RSZWxheSkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vblJlbGF5VHhzQnlIYXNoID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIHR4SGFzaGVzKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5yZWxheVR4c0J5SGFzaCh0eEhhc2hlcyk7XG59XG5cbnNlbGYuZGFlbW9uR2V0VHhQb29sID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgbGV0IHR4cyA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldFR4UG9vbCgpO1xuICBsZXQgYmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soKS5zZXRUeHModHhzKTtcbiAgZm9yIChsZXQgdHggb2YgdHhzKSB0eC5zZXRCbG9jayhibG9jaylcbiAgcmV0dXJuIGJsb2NrLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbkdldFR4UG9vbEhhc2hlcyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRUeFBvb2xIYXNoZXMoKTtcbn1cblxuLy9hc3luYyBnZXRUeFBvb2xCYWNrbG9nKCkge1xuLy8gIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbi8vfVxuXG5zZWxmLmRhZW1vbkdldFR4UG9vbFN0YXRzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRUeFBvb2xTdGF0cygpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25GbHVzaFR4UG9vbCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBoYXNoZXMpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmZsdXNoVHhQb29sKGhhc2hlcyk7XG59XG5cbnNlbGYuZGFlbW9uR2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGtleUltYWdlcykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzKGtleUltYWdlcyk7XG59XG5cbi8vXG4vL2FzeW5jIGdldE91dHB1dHMob3V0cHV0cykge1xuLy8gIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbi8vfVxuXG5zZWxmLmRhZW1vbkdldE91dHB1dEhpc3RvZ3JhbSA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBhbW91bnRzLCBtaW5Db3VudCwgbWF4Q291bnQsIGlzVW5sb2NrZWQsIHJlY2VudEN1dG9mZikge1xuICBsZXQgZW50cmllc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgZW50cnkgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0T3V0cHV0SGlzdG9ncmFtKGFtb3VudHMsIG1pbkNvdW50LCBtYXhDb3VudCwgaXNVbmxvY2tlZCwgcmVjZW50Q3V0b2ZmKSkge1xuICAgIGVudHJpZXNKc29uLnB1c2goZW50cnkudG9Kc29uKCkpO1xuICB9XG4gIHJldHVybiBlbnRyaWVzSnNvbjtcbn1cblxuLy9cbi8vYXN5bmMgZ2V0T3V0cHV0RGlzdHJpYnV0aW9uKGFtb3VudHMsIGN1bXVsYXRpdmUsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpIHtcbi8vICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4vL31cblxuc2VsZi5kYWVtb25HZXRJbmZvID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRJbmZvKCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbkdldFN5bmNJbmZvID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRTeW5jSW5mbygpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRIYXJkRm9ya0luZm8gPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEhhcmRGb3JrSW5mbygpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRBbHRDaGFpbnMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICBsZXQgYWx0Q2hhaW5zSnNvbiA9IFtdO1xuICBmb3IgKGxldCBhbHRDaGFpbiBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRBbHRDaGFpbnMoKSkgYWx0Q2hhaW5zSnNvbi5wdXNoKGFsdENoYWluLnRvSnNvbigpKTtcbiAgcmV0dXJuIGFsdENoYWluc0pzb247XG59XG5cbnNlbGYuZGFlbW9uR2V0QWx0QmxvY2tIYXNoZXMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QWx0QmxvY2tIYXNoZXMoKTtcbn1cblxuc2VsZi5kYWVtb25HZXREb3dubG9hZExpbWl0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldERvd25sb2FkTGltaXQoKTtcbn1cblxuc2VsZi5kYWVtb25TZXREb3dubG9hZExpbWl0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGxpbWl0KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5zZXREb3dubG9hZExpbWl0KGxpbWl0KTtcbn1cblxuc2VsZi5kYWVtb25SZXNldERvd25sb2FkTGltaXQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0ucmVzZXREb3dubG9hZExpbWl0KCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0VXBsb2FkTGltaXQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0VXBsb2FkTGltaXQoKTtcbn1cblxuc2VsZi5kYWVtb25TZXRVcGxvYWRMaW1pdCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBsaW1pdCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc2V0VXBsb2FkTGltaXQobGltaXQpO1xufVxuXG5zZWxmLmRhZW1vblJlc2V0VXBsb2FkTGltaXQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0ucmVzZXRVcGxvYWRMaW1pdCgpO1xufVxuXG5zZWxmLmRhZW1vbkdldFBlZXJzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgbGV0IHBlZXJzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBwZWVyIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldFBlZXJzKCkpIHBlZXJzSnNvbi5wdXNoKHBlZXIudG9Kc29uKCkpO1xuICByZXR1cm4gcGVlcnNKc29uO1xufVxuXG5zZWxmLmRhZW1vbkdldEtub3duUGVlcnMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICBsZXQgcGVlcnNKc29uID0gW107XG4gIGZvciAobGV0IHBlZXIgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0S25vd25QZWVycygpKSBwZWVyc0pzb24ucHVzaChwZWVyLnRvSnNvbigpKTtcbiAgcmV0dXJuIHBlZXJzSnNvbjtcbn1cblxuc2VsZi5kYWVtb25TZXRPdXRnb2luZ1BlZXJMaW1pdCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBsaW1pdCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc2V0T3V0Z29pbmdQZWVyTGltaXQobGltaXQpO1xufVxuXG5zZWxmLmRhZW1vblNldEluY29taW5nUGVlckxpbWl0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGxpbWl0KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5zZXRJbmNvbWluZ1BlZXJMaW1pdChsaW1pdCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0UGVlckJhbnMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICBsZXQgYmFuc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgYmFuIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldFBlZXJCYW5zKCkpIGJhbnNKc29uLnB1c2goYmFuLnRvSnNvbigpKTtcbiAgcmV0dXJuIGJhbnNKc29uO1xufVxuXG5zZWxmLmRhZW1vblNldFBlZXJCYW5zID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGJhbnNKc29uKSB7XG4gIGxldCBiYW5zID0gW107XG4gIGZvciAobGV0IGJhbkpzb24gb2YgYmFuc0pzb24pIGJhbnMucHVzaChuZXcgTW9uZXJvQmFuKGJhbkpzb24pKTtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnNldFBlZXJCYW5zKGJhbnMpO1xufVxuXG5zZWxmLmRhZW1vblN0YXJ0TWluaW5nID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGFkZHJlc3MsIG51bVRocmVhZHMsIGlzQmFja2dyb3VuZCwgaWdub3JlQmF0dGVyeSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc3RhcnRNaW5pbmcoYWRkcmVzcywgbnVtVGhyZWFkcywgaXNCYWNrZ3JvdW5kLCBpZ25vcmVCYXR0ZXJ5KTtcbn1cblxuc2VsZi5kYWVtb25TdG9wTWluaW5nID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnN0b3BNaW5pbmcoKTtcbn1cblxuc2VsZi5kYWVtb25HZXRNaW5pbmdTdGF0dXMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldE1pbmluZ1N0YXR1cygpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25TdWJtaXRCbG9ja3MgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgYmxvY2tCbG9icykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc3VibWl0QmxvY2tzKGJsb2NrQmxvYnMpO1xufVxuXG5zZWxmLmRhZW1vblBydW5lQmxvY2tjaGFpbiA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBjaGVjaykge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnBydW5lQmxvY2tjaGFpbihjaGVjaykpLnRvSnNvbigpO1xufVxuXG4vL2FzeW5jIGNoZWNrRm9yVXBkYXRlKCkge1xuLy8gIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbi8vfVxuLy9cbi8vYXN5bmMgZG93bmxvYWRVcGRhdGUocGF0aCkge1xuLy8gIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbi8vfVxuXG5zZWxmLmRhZW1vblN0b3AgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc3RvcCgpO1xufVxuXG5zZWxmLmRhZW1vbldhaXRGb3JOZXh0QmxvY2tIZWFkZXIgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLndhaXRGb3JOZXh0QmxvY2tIZWFkZXIoKSkudG9Kc29uKCk7XG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFdBTExFVCBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuc2VsZi5vcGVuV2FsbGV0RGF0YSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBwYXRoLCBwYXNzd29yZCwgbmV0d29ya1R5cGUsIGtleXNEYXRhLCBjYWNoZURhdGEsIGRhZW1vblVyaU9yQ29uZmlnLCByZWd0ZXN0KSB7XG4gIGxldCBkYWVtb25Db25uZWN0aW9uID0gZGFlbW9uVXJpT3JDb25maWcgPyBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbihkYWVtb25VcmlPckNvbmZpZykgOiB1bmRlZmluZWQ7XG4gIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdID0gYXdhaXQgTW9uZXJvV2FsbGV0RnVsbC5vcGVuV2FsbGV0KHtwYXRoOiBcIlwiLCBwYXNzd29yZDogcGFzc3dvcmQsIG5ldHdvcmtUeXBlOiBuZXR3b3JrVHlwZSwga2V5c0RhdGE6IGtleXNEYXRhLCBjYWNoZURhdGE6IGNhY2hlRGF0YSwgc2VydmVyOiBkYWVtb25Db25uZWN0aW9uLCBwcm94eVRvV29ya2VyOiBmYWxzZSwgcmVndGVzdDogcmVndGVzdH0pO1xuICBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zZXRCcm93c2VyTWFpblBhdGgocGF0aCk7XG59XG5cbnNlbGYuY3JlYXRlV2FsbGV0S2V5cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBjb25maWdKc29uKSB7XG4gIGxldCBjb25maWcgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKGNvbmZpZ0pzb24pO1xuICBjb25maWcuc2V0UHJveHlUb1dvcmtlcihmYWxzZSk7XG4gIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdID0gYXdhaXQgTW9uZXJvV2FsbGV0S2V5cy5jcmVhdGVXYWxsZXQoY29uZmlnKTtcbn1cblxuc2VsZi5jcmVhdGVXYWxsZXRGdWxsID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGNvbmZpZ0pzb24pIHtcbiAgbGV0IGNvbmZpZyA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcoY29uZmlnSnNvbik7XG4gIGxldCBwYXRoID0gY29uZmlnLmdldFBhdGgoKTtcbiAgY29uZmlnLnNldFBhdGgoXCJcIik7XG4gIGNvbmZpZy5zZXRQcm94eVRvV29ya2VyKGZhbHNlKTtcbiAgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0gPSBhd2FpdCBNb25lcm9XYWxsZXRGdWxsLmNyZWF0ZVdhbGxldChjb25maWcpO1xuICBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zZXRCcm93c2VyTWFpblBhdGgocGF0aCk7XG59XG5cbnNlbGYuaXNWaWV3T25seSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pc1ZpZXdPbmx5KCk7XG59XG5cbnNlbGYuZ2V0TmV0d29ya1R5cGUgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0TmV0d29ya1R5cGUoKTtcbn1cblxuLy9cbi8vYXN5bmMgZ2V0VmVyc2lvbigpIHtcbi8vICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4vL31cblxuc2VsZi5nZXRTZWVkID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFNlZWQoKTtcbn1cblxuc2VsZi5nZXRTZWVkTGFuZ3VhZ2UgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0U2VlZExhbmd1YWdlKCk7XG59XG5cbnNlbGYuZ2V0U2VlZExhbmd1YWdlcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRTZWVkTGFuZ3VhZ2VzKCk7XG59XG5cbnNlbGYuZ2V0UHJpdmF0ZVNwZW5kS2V5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFByaXZhdGVTcGVuZEtleSgpO1xufVxuXG5zZWxmLmdldFByaXZhdGVWaWV3S2V5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFByaXZhdGVWaWV3S2V5KCk7XG59XG5cbnNlbGYuZ2V0UHVibGljVmlld0tleSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRQdWJsaWNWaWV3S2V5KCk7XG59XG5cbnNlbGYuZ2V0UHVibGljU3BlbmRLZXkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0UHVibGljU3BlbmRLZXkoKTtcbn1cblxuc2VsZi5nZXRBZGRyZXNzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldEFkZHJlc3MoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG59XG5cbnNlbGYuZ2V0QWRkcmVzc0luZGV4ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFkZHJlc3MpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRBZGRyZXNzSW5kZXgoYWRkcmVzcykpLnRvSnNvbigpO1xufVxuXG5zZWxmLnNldFN1YmFkZHJlc3NMYWJlbCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4LCBsYWJlbCkge1xuICBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zZXRTdWJhZGRyZXNzTGFiZWwoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCwgbGFiZWwpO1xufVxuXG5zZWxmLmdldEludGVncmF0ZWRBZGRyZXNzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHN0YW5kYXJkQWRkcmVzcywgcGF5bWVudElkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0SW50ZWdyYXRlZEFkZHJlc3Moc3RhbmRhcmRBZGRyZXNzLCBwYXltZW50SWQpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBpbnRlZ3JhdGVkQWRkcmVzcykge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmRlY29kZUludGVncmF0ZWRBZGRyZXNzKGludGVncmF0ZWRBZGRyZXNzKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuc2V0RGFlbW9uQ29ubmVjdGlvbiA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBjb25maWcsIGlzVHJ1c3RlZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2V0RGFlbW9uQ29ubmVjdGlvbihjb25maWcgPyBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbihPYmplY3QuYXNzaWduKGNvbmZpZywge3Byb3h5VG9Xb3JrZXI6IGZhbHNlfSkpIDogdW5kZWZpbmVkLCBpc1RydXN0ZWQpO1xufVxuXG5zZWxmLmdldERhZW1vbkNvbm5lY3Rpb24gPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICBsZXQgY29ubmVjdGlvbiA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldERhZW1vbkNvbm5lY3Rpb24oKTtcbiAgcmV0dXJuIGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldENvbmZpZygpIDogdW5kZWZpbmVkO1xufVxuXG5zZWxmLmlzRGFlbW9uVHJ1c3RlZCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pc0RhZW1vblRydXN0ZWQoKTtcbn1cblxuc2VsZi5pc0Nvbm5lY3RlZFRvRGFlbW9uID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmlzQ29ubmVjdGVkVG9EYWVtb24oKTtcbn1cblxuc2VsZi5nZXRSZXN0b3JlSGVpZ2h0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFJlc3RvcmVIZWlnaHQoKTtcbn1cblxuc2VsZi5zZXRSZXN0b3JlSGVpZ2h0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHJlc3RvcmVIZWlnaHQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnNldFJlc3RvcmVIZWlnaHQocmVzdG9yZUhlaWdodCk7XG59XG5cbnNlbGYuZ2V0RGFlbW9uSGVpZ2h0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldERhZW1vbkhlaWdodCgpO1xufVxuXG5zZWxmLmdldERhZW1vbk1heFBlZXJIZWlnaHQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0RGFlbW9uTWF4UGVlckhlaWdodCgpXG59XG5cbnNlbGYuZ2V0SGVpZ2h0QnlEYXRlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHllYXIsIG1vbnRoLCBkYXkpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldEhlaWdodEJ5RGF0ZSh5ZWFyLCBtb250aCwgZGF5KTtcbn1cblxuc2VsZi5pc0RhZW1vblN5bmNlZCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pc0RhZW1vblN5bmNlZCgpO1xufVxuXG5zZWxmLmdldEhlaWdodCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRIZWlnaHQoKTtcbn1cblxuc2VsZi5hZGRMaXN0ZW5lciA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBsaXN0ZW5lcklkKSB7XG4gIFxuICAvKipcbiAgICogSW50ZXJuYWwgbGlzdGVuZXIgdG8gYnJpZGdlIG5vdGlmaWNhdGlvbnMgdG8gZXh0ZXJuYWwgbGlzdGVuZXJzLlxuICAgKiBcbiAgICogVE9ETzogTW9uZXJvV2FsbGV0TGlzdGVuZXIgaXMgbm90IGRlZmluZWQgdW50aWwgc2NyaXB0cyBpbXBvcnRlZFxuICAgKiBcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGNsYXNzIFdhbGxldFdvcmtlckhlbHBlckxpc3RlbmVyIGV4dGVuZHMgTW9uZXJvV2FsbGV0TGlzdGVuZXIge1xuXG4gICAgcHJvdGVjdGVkIHdhbGxldElkOiBzdHJpbmc7XG4gICAgcHJvdGVjdGVkIGlkOiBzdHJpbmc7XG4gICAgcHJvdGVjdGVkIHdvcmtlcjogV29ya2VyO1xuICAgIFxuICAgIGNvbnN0cnVjdG9yKHdhbGxldElkLCBpZCwgd29ya2VyKSB7XG4gICAgICBzdXBlcigpO1xuICAgICAgdGhpcy53YWxsZXRJZCA9IHdhbGxldElkO1xuICAgICAgdGhpcy5pZCA9IGlkO1xuICAgICAgdGhpcy53b3JrZXIgPSB3b3JrZXI7XG4gICAgfVxuICAgIFxuICAgIGdldElkKCkge1xuICAgICAgcmV0dXJuIHRoaXMuaWQ7XG4gICAgfVxuICAgIFxuICAgIGFzeW5jIG9uU3luY1Byb2dyZXNzKGhlaWdodCwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgcGVyY2VudERvbmUsIG1lc3NhZ2UpIHtcbiAgICAgIHRoaXMud29ya2VyLnBvc3RNZXNzYWdlKFt0aGlzLndhbGxldElkLCBcIm9uU3luY1Byb2dyZXNzX1wiICsgdGhpcy5nZXRJZCgpLCBoZWlnaHQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIHBlcmNlbnREb25lLCBtZXNzYWdlXSk7XG4gICAgfVxuXG4gICAgYXN5bmMgb25OZXdCbG9jayhoZWlnaHQpIHsgXG4gICAgICB0aGlzLndvcmtlci5wb3N0TWVzc2FnZShbdGhpcy53YWxsZXRJZCwgXCJvbk5ld0Jsb2NrX1wiICsgdGhpcy5nZXRJZCgpLCBoZWlnaHRdKTtcbiAgICB9XG4gICAgXG4gICAgYXN5bmMgb25CYWxhbmNlc0NoYW5nZWQobmV3QmFsYW5jZSwgbmV3VW5sb2NrZWRCYWxhbmNlKSB7XG4gICAgICB0aGlzLndvcmtlci5wb3N0TWVzc2FnZShbdGhpcy53YWxsZXRJZCwgXCJvbkJhbGFuY2VzQ2hhbmdlZF9cIiArIHRoaXMuZ2V0SWQoKSwgbmV3QmFsYW5jZS50b1N0cmluZygpLCBuZXdVbmxvY2tlZEJhbGFuY2UudG9TdHJpbmcoKV0pO1xuICAgIH1cblxuICAgYXN5bmMgb25PdXRwdXRSZWNlaXZlZChvdXRwdXQpIHtcbiAgICAgIGxldCBibG9jayA9IG91dHB1dC5nZXRUeCgpLmdldEJsb2NrKCk7XG4gICAgICBpZiAoYmxvY2sgPT09IHVuZGVmaW5lZCkgYmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soKS5zZXRUeHMoW291dHB1dC5nZXRUeCgpXSk7XG4gICAgICB0aGlzLndvcmtlci5wb3N0TWVzc2FnZShbdGhpcy53YWxsZXRJZCwgXCJvbk91dHB1dFJlY2VpdmVkX1wiICsgdGhpcy5nZXRJZCgpLCBibG9jay50b0pzb24oKV0pOyAgLy8gc2VyaWFsaXplIGZyb20gcm9vdCBibG9ja1xuICAgIH1cbiAgICBcbiAgICBhc3luYyBvbk91dHB1dFNwZW50KG91dHB1dCkge1xuICAgICAgbGV0IGJsb2NrID0gb3V0cHV0LmdldFR4KCkuZ2V0QmxvY2soKTtcbiAgICAgIGlmIChibG9jayA9PT0gdW5kZWZpbmVkKSBibG9jayA9IG5ldyBNb25lcm9CbG9jaygpLnNldFR4cyhbb3V0cHV0LmdldFR4KCldKTtcbiAgICAgIHRoaXMud29ya2VyLnBvc3RNZXNzYWdlKFt0aGlzLndhbGxldElkLCBcIm9uT3V0cHV0U3BlbnRfXCIgKyB0aGlzLmdldElkKCksIGJsb2NrLnRvSnNvbigpXSk7ICAgICAvLyBzZXJpYWxpemUgZnJvbSByb290IGJsb2NrXG4gICAgfVxuICB9XG4gIFxuICBsZXQgbGlzdGVuZXIgPSBuZXcgV2FsbGV0V29ya2VySGVscGVyTGlzdGVuZXIod2FsbGV0SWQsIGxpc3RlbmVySWQsIHNlbGYpO1xuICBpZiAoIXNlbGYubGlzdGVuZXJzKSBzZWxmLmxpc3RlbmVycyA9IFtdO1xuICBzZWxmLmxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcbiAgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xufVxuXG5zZWxmLnJlbW92ZUxpc3RlbmVyID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGxpc3RlbmVySWQpIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzZWxmLmxpc3RlbmVycy5sZW5ndGg7IGkrKykge1xuICAgIGlmIChzZWxmLmxpc3RlbmVyc1tpXS5nZXRJZCgpICE9PSBsaXN0ZW5lcklkKSBjb250aW51ZTtcbiAgICBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5yZW1vdmVMaXN0ZW5lcihzZWxmLmxpc3RlbmVyc1tpXSk7XG4gICAgc2VsZi5saXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgIHJldHVybjtcbiAgfVxuICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJMaXN0ZW5lciBpcyBub3QgcmVnaXN0ZXJlZCB3aXRoIHdhbGxldFwiKTtcbn1cblxuc2VsZi5pc1N5bmNlZCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pc1N5bmNlZCgpO1xufVxuXG5zZWxmLnN5bmMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgc3RhcnRIZWlnaHQsIGFsbG93Q29uY3VycmVudENhbGxzKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc3luYyh1bmRlZmluZWQsIHN0YXJ0SGVpZ2h0LCBhbGxvd0NvbmN1cnJlbnRDYWxscykpO1xufVxuXG5zZWxmLnN0YXJ0U3luY2luZyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBzeW5jUGVyaW9kSW5Ncykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc3RhcnRTeW5jaW5nKHN5bmNQZXJpb2RJbk1zKTtcbn1cblxuc2VsZi5zdG9wU3luY2luZyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zdG9wU3luY2luZygpO1xufVxuXG5zZWxmLnNjYW5UeHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdHhIYXNoZXMpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnNjYW5UeHModHhIYXNoZXMpO1xufVxuXG5zZWxmLnJlc2NhblNwZW50ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnJlc2NhblNwZW50KCk7XG59XG5cbnNlbGYucmVzY2FuQmxvY2tjaGFpbiA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5yZXNjYW5CbG9ja2NoYWluKCk7XG59XG5cbnNlbGYuZ2V0QmFsYW5jZSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0QmFsYW5jZShhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSkudG9TdHJpbmcoKTtcbn1cblxuc2VsZi5nZXRVbmxvY2tlZEJhbGFuY2UgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFVubG9ja2VkQmFsYW5jZShhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSkudG9TdHJpbmcoKTtcbn1cblxuc2VsZi5nZXRBY2NvdW50cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBpbmNsdWRlU3ViYWRkcmVzc2VzLCB0YWcpIHtcbiAgbGV0IGFjY291bnRKc29ucyA9IFtdO1xuICBmb3IgKGxldCBhY2NvdW50IG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldEFjY291bnRzKGluY2x1ZGVTdWJhZGRyZXNzZXMsIHRhZykpIGFjY291bnRKc29ucy5wdXNoKGFjY291bnQudG9Kc29uKCkpO1xuICByZXR1cm4gYWNjb3VudEpzb25zO1xufVxuXG5zZWxmLmdldEFjY291bnQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWNjb3VudElkeCwgaW5jbHVkZVN1YmFkZHJlc3Nlcykge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldEFjY291bnQoYWNjb3VudElkeCwgaW5jbHVkZVN1YmFkZHJlc3NlcykpLnRvSnNvbigpO1xufVxuXG5zZWxmLmNyZWF0ZUFjY291bnQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbGFiZWwpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jcmVhdGVBY2NvdW50KGxhYmVsKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZ2V0U3ViYWRkcmVzc2VzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJbmRpY2VzKSB7XG4gIGxldCBzdWJhZGRyZXNzSnNvbnMgPSBbXTtcbiAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgc3ViYWRkcmVzc0luZGljZXMpKSBzdWJhZGRyZXNzSnNvbnMucHVzaChzdWJhZGRyZXNzLnRvSnNvbigpKTtcbiAgcmV0dXJuIHN1YmFkZHJlc3NKc29ucztcbn1cblxuc2VsZi5jcmVhdGVTdWJhZGRyZXNzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFjY291bnRJZHgsIGxhYmVsKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uY3JlYXRlU3ViYWRkcmVzcyhhY2NvdW50SWR4LCBsYWJlbCkpLnRvSnNvbigpO1xufVxuXG4vLyBUT0RPOiBlYXNpZXIgb3IgbW9yZSBlZmZpY2llbnQgd2F5IHRoYW4gc2VyaWFsaXppbmcgZnJvbSByb290IGJsb2Nrcz9cbnNlbGYuZ2V0VHhzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGJsb2NrSnNvblF1ZXJ5KSB7XG4gIFxuICAvLyBkZXNlcmlhbGl6ZSBxdWVyeSB3aGljaCBpcyBqc29uIHN0cmluZyByb290ZWQgYXQgYmxvY2tcbiAgbGV0IHF1ZXJ5ID0gbmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvblF1ZXJ5LCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYX1FVRVJZKS5nZXRUeHMoKVswXTtcbiAgXG4gIC8vIGdldCB0eHNcbiAgbGV0IHR4cyA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFR4cyhxdWVyeSk7XG4gIFxuICAvLyBjb2xsZWN0IHVuaXF1ZSBibG9ja3MgdG8gcHJlc2VydmUgbW9kZWwgcmVsYXRpb25zaGlwcyBhcyB0cmVlcyAoYmFzZWQgb24gbW9uZXJvX3dhc21fYnJpZGdlLmNwcDo6Z2V0X3R4cylcbiAgbGV0IHNlZW5CbG9ja3MgPSBuZXcgU2V0KCk7XG4gIGxldCB1bmNvbmZpcm1lZEJsb2NrID0gdW5kZWZpbmVkO1xuICBsZXQgYmxvY2tzID0gW107XG4gIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgIGlmICghdHguZ2V0QmxvY2soKSkge1xuICAgICAgaWYgKCF1bmNvbmZpcm1lZEJsb2NrKSB1bmNvbmZpcm1lZEJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0VHhzKFtdKTtcbiAgICAgIHR4LnNldEJsb2NrKHVuY29uZmlybWVkQmxvY2spO1xuICAgICAgdW5jb25maXJtZWRCbG9jay5nZXRUeHMoKS5wdXNoKHR4KTtcbiAgICB9XG4gICAgaWYgKCFzZWVuQmxvY2tzLmhhcyh0eC5nZXRCbG9jaygpKSkge1xuICAgICAgc2VlbkJsb2Nrcy5hZGQodHguZ2V0QmxvY2soKSk7XG4gICAgICBibG9ja3MucHVzaCh0eC5nZXRCbG9jaygpKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIHNlcmlhbGl6ZSBibG9ja3MgdG8ganNvblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGJsb2Nrcy5sZW5ndGg7IGkrKykgYmxvY2tzW2ldID0gYmxvY2tzW2ldLnRvSnNvbigpO1xuICByZXR1cm4ge2Jsb2NrczogYmxvY2tzfTtcbn1cblxuc2VsZi5nZXRUcmFuc2ZlcnMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYmxvY2tKc29uUXVlcnkpIHtcbiAgXG4gIC8vIGRlc2VyaWFsaXplIHF1ZXJ5IHdoaWNoIGlzIGpzb24gc3RyaW5nIHJvb3RlZCBhdCBibG9ja1xuICBsZXQgcXVlcnkgPSAobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvblF1ZXJ5LCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYX1FVRVJZKS5nZXRUeHMoKVswXSBhcyBNb25lcm9UeFF1ZXJ5KS5nZXRUcmFuc2ZlclF1ZXJ5KCk7XG4gIFxuICAvLyBnZXQgdHJhbnNmZXJzXG4gIGxldCB0cmFuc2ZlcnMgPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRUcmFuc2ZlcnMocXVlcnkpO1xuICBcbiAgLy8gY29sbGVjdCB1bmlxdWUgYmxvY2tzIHRvIHByZXNlcnZlIG1vZGVsIHJlbGF0aW9uc2hpcHMgYXMgdHJlZVxuICBsZXQgdW5jb25maXJtZWRCbG9jayA9IHVuZGVmaW5lZDtcbiAgbGV0IGJsb2NrcyA9IFtdO1xuICBsZXQgc2VlbkJsb2NrcyA9IG5ldyBTZXQoKTtcbiAgZm9yIChsZXQgdHJhbnNmZXIgb2YgdHJhbnNmZXJzKSB7XG4gICAgbGV0IHR4ID0gdHJhbnNmZXIuZ2V0VHgoKTtcbiAgICBpZiAoIXR4LmdldEJsb2NrKCkpIHtcbiAgICAgIGlmICghdW5jb25maXJtZWRCbG9jaykgdW5jb25maXJtZWRCbG9jayA9IG5ldyBNb25lcm9CbG9jaygpLnNldFR4cyhbXSk7XG4gICAgICB0eC5zZXRCbG9jayh1bmNvbmZpcm1lZEJsb2NrKTtcbiAgICAgIHVuY29uZmlybWVkQmxvY2suZ2V0VHhzKCkucHVzaCh0eCk7XG4gICAgfVxuICAgIGlmICghc2VlbkJsb2Nrcy5oYXModHguZ2V0QmxvY2soKSkpIHtcbiAgICAgIHNlZW5CbG9ja3MuYWRkKHR4LmdldEJsb2NrKCkpO1xuICAgICAgYmxvY2tzLnB1c2godHguZ2V0QmxvY2soKSk7XG4gICAgfVxuICB9XG4gIFxuICAvLyBzZXJpYWxpemUgYmxvY2tzIHRvIGpzb25cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBibG9ja3MubGVuZ3RoOyBpKyspIGJsb2Nrc1tpXSA9IGJsb2Nrc1tpXS50b0pzb24oKTtcbiAgcmV0dXJuIGJsb2Nrcztcbn1cblxuc2VsZi5nZXRPdXRwdXRzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGJsb2NrSnNvblF1ZXJ5KSB7XG5cbiAgLy8gZGVzZXJpYWxpemUgcXVlcnkgd2hpY2ggaXMganNvbiBzdHJpbmcgcm9vdGVkIGF0IGJsb2NrXG4gIGxldCBxdWVyeSA9IChuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uUXVlcnksIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFhfUVVFUlkpLmdldFR4cygpWzBdIGFzIE1vbmVyb1R4UXVlcnkpLmdldE91dHB1dFF1ZXJ5KCk7XG4gIFxuICAvLyBnZXQgb3V0cHV0c1xuICBsZXQgb3V0cHV0cyA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldE91dHB1dHMocXVlcnkpO1xuICBcbiAgLy8gY29sbGVjdCB1bmlxdWUgYmxvY2tzIHRvIHByZXNlcnZlIG1vZGVsIHJlbGF0aW9uc2hpcHMgYXMgdHJlZVxuICBsZXQgdW5jb25maXJtZWRCbG9jayA9IHVuZGVmaW5lZDtcbiAgbGV0IGJsb2NrcyA9IFtdO1xuICBsZXQgc2VlbkJsb2NrcyA9IG5ldyBTZXQoKTtcbiAgZm9yIChsZXQgb3V0cHV0IG9mIG91dHB1dHMpIHtcbiAgICBsZXQgdHggPSBvdXRwdXQuZ2V0VHgoKTtcbiAgICBpZiAoIXR4LmdldEJsb2NrKCkpIHtcbiAgICAgIGlmICghdW5jb25maXJtZWRCbG9jaykgdW5jb25maXJtZWRCbG9jayA9IG5ldyBNb25lcm9CbG9jaygpLnNldFR4cyhbXSk7XG4gICAgICB0eC5zZXRCbG9jayh1bmNvbmZpcm1lZEJsb2NrKTtcbiAgICAgIHVuY29uZmlybWVkQmxvY2suZ2V0VHhzKCkucHVzaCh0eCk7XG4gICAgfVxuICAgIGlmICghc2VlbkJsb2Nrcy5oYXModHguZ2V0QmxvY2soKSkpIHtcbiAgICAgIHNlZW5CbG9ja3MuYWRkKHR4LmdldEJsb2NrKCkpO1xuICAgICAgYmxvY2tzLnB1c2godHguZ2V0QmxvY2soKSk7XG4gICAgfVxuICB9XG4gIFxuICAvLyBzZXJpYWxpemUgYmxvY2tzIHRvIGpzb25cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBibG9ja3MubGVuZ3RoOyBpKyspIGJsb2Nrc1tpXSA9IGJsb2Nrc1tpXS50b0pzb24oKTtcbiAgcmV0dXJuIGJsb2Nrcztcbn1cblxuc2VsZi5leHBvcnRPdXRwdXRzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFsbCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZXhwb3J0T3V0cHV0cyhhbGwpO1xufVxuXG5zZWxmLmltcG9ydE91dHB1dHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgb3V0cHV0c0hleCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaW1wb3J0T3V0cHV0cyhvdXRwdXRzSGV4KTtcbn1cblxuc2VsZi5nZXRLZXlJbWFnZXMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWxsKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZXhwb3J0S2V5SW1hZ2VzKGFsbCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmltcG9ydEtleUltYWdlcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBrZXlJbWFnZXNKc29uLCBvZmZzZXQpIHtcbiAgbGV0IGtleUltYWdlcyA9IFtdO1xuICBmb3IgKGxldCBrZXlJbWFnZUpzb24gb2Yga2V5SW1hZ2VzSnNvbikga2V5SW1hZ2VzLnB1c2gobmV3IE1vbmVyb0tleUltYWdlKGtleUltYWdlSnNvbikpO1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmltcG9ydEtleUltYWdlcyhrZXlJbWFnZXMsIG9mZnNldCkpLnRvSnNvbigpO1xufVxuXG4vL2FzeW5jIGdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0KCkge1xuLy8gIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbi8vfVxuXG5zZWxmLmZyZWV6ZU91dHB1dCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBrZXlJbWFnZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZnJlZXplT3V0cHV0KGtleUltYWdlKTtcbn1cblxuc2VsZi50aGF3T3V0cHV0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGtleUltYWdlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS50aGF3T3V0cHV0KGtleUltYWdlKTtcbn1cblxuc2VsZi5pc091dHB1dEZyb3plbiA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBrZXlJbWFnZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaXNPdXRwdXRGcm96ZW4oa2V5SW1hZ2UpO1xufVxuXG5zZWxmLmdldERlZmF1bHRGZWVQcmlvcml0eSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXREZWZhdWx0RmVlUHJpb3JpdHkoKTtcbn1cblxuc2VsZi5jcmVhdGVUeHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgY29uZmlnKSB7XG4gIGlmICh0eXBlb2YgY29uZmlnID09PSBcIm9iamVjdFwiKSBjb25maWcgPSBuZXcgTW9uZXJvVHhDb25maWcoY29uZmlnKTtcbiAgbGV0IHR4cyA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmNyZWF0ZVR4cyhjb25maWcpO1xuICByZXR1cm4gdHhzWzBdLmdldFR4U2V0KCkudG9Kc29uKCk7XG59XG5cbnNlbGYuc3dlZXBPdXRwdXQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgY29uZmlnKSB7XG4gIGlmICh0eXBlb2YgY29uZmlnID09PSBcIm9iamVjdFwiKSBjb25maWcgPSBuZXcgTW9uZXJvVHhDb25maWcoY29uZmlnKTtcbiAgbGV0IHR4ID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc3dlZXBPdXRwdXQoY29uZmlnKTtcbiAgcmV0dXJuIHR4LmdldFR4U2V0KCkudG9Kc29uKCk7XG59XG5cbnNlbGYuc3dlZXBVbmxvY2tlZCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBjb25maWcpIHtcbiAgaWYgKHR5cGVvZiBjb25maWcgPT09IFwib2JqZWN0XCIpIGNvbmZpZyA9IG5ldyBNb25lcm9UeENvbmZpZyhjb25maWcpO1xuICBsZXQgdHhzID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc3dlZXBVbmxvY2tlZChjb25maWcpO1xuICBsZXQgdHhTZXRzID0gW107XG4gIGZvciAobGV0IHR4IG9mIHR4cykgaWYgKCFHZW5VdGlscy5hcnJheUNvbnRhaW5zKHR4U2V0cywgdHguZ2V0VHhTZXQoKSkpIHR4U2V0cy5wdXNoKHR4LmdldFR4U2V0KCkpO1xuICBsZXQgdHhTZXRzSnNvbiA9IFtdO1xuICBmb3IgKGxldCB0eFNldCBvZiB0eFNldHMpIHR4U2V0c0pzb24ucHVzaCh0eFNldC50b0pzb24oKSk7XG4gIHJldHVybiB0eFNldHNKc29uO1xufVxuXG5zZWxmLnN3ZWVwRHVzdCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCByZWxheSkge1xuICBsZXQgdHhzID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc3dlZXBEdXN0KHJlbGF5KTtcbiAgcmV0dXJuIHR4cy5sZW5ndGggPT09IDAgPyB7fSA6IHR4c1swXS5nZXRUeFNldCgpLnRvSnNvbigpO1xufVxuXG5zZWxmLnJlbGF5VHhzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4TWV0YWRhdGFzKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5yZWxheVR4cyh0eE1ldGFkYXRhcyk7XG59XG5cbnNlbGYuZGVzY3JpYmVUeFNldCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eFNldEpzb24pIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5kZXNjcmliZVR4U2V0KG5ldyBNb25lcm9UeFNldCh0eFNldEpzb24pKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuc2lnblR4cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB1bnNpZ25lZFR4SGV4KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zaWduVHhzKHVuc2lnbmVkVHhIZXgpO1xufVxuXG5zZWxmLnN1Ym1pdFR4cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBzaWduZWRUeEhleCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc3VibWl0VHhzKHNpZ25lZFR4SGV4KTtcbn1cblxuc2VsZi5zaWduTWVzc2FnZSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBtZXNzYWdlLCBzaWduYXR1cmVUeXBlLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zaWduTWVzc2FnZShtZXNzYWdlLCBzaWduYXR1cmVUeXBlLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTtcbn1cblxuc2VsZi52ZXJpZnlNZXNzYWdlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG1lc3NhZ2UsIGFkZHJlc3MsIHNpZ25hdHVyZSkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnZlcmlmeU1lc3NhZ2UobWVzc2FnZSwgYWRkcmVzcywgc2lnbmF0dXJlKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZ2V0VHhLZXkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdHhIYXNoKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRUeEtleSh0eEhhc2gpO1xufVxuXG5zZWxmLmNoZWNrVHhLZXkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdHhIYXNoLCB0eEtleSwgYWRkcmVzcykge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmNoZWNrVHhLZXkodHhIYXNoLCB0eEtleSwgYWRkcmVzcykpLnRvSnNvbigpO1xufVxuXG5zZWxmLmdldFR4UHJvb2YgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdHhIYXNoLCBhZGRyZXNzLCBtZXNzYWdlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRUeFByb29mKHR4SGFzaCwgYWRkcmVzcywgbWVzc2FnZSk7XG59XG5cbnNlbGYuY2hlY2tUeFByb29mID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaCwgYWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uY2hlY2tUeFByb29mKHR4SGFzaCwgYWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZ2V0U3BlbmRQcm9vZiA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eEhhc2gsIG1lc3NhZ2UpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFNwZW5kUHJvb2YodHhIYXNoLCBtZXNzYWdlKTtcbn1cblxuc2VsZi5jaGVja1NwZW5kUHJvb2YgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdHhIYXNoLCBtZXNzYWdlLCBzaWduYXR1cmUpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmNoZWNrU3BlbmRQcm9vZih0eEhhc2gsIG1lc3NhZ2UsIHNpZ25hdHVyZSk7XG59XG5cbnNlbGYuZ2V0UmVzZXJ2ZVByb29mV2FsbGV0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG1lc3NhZ2UpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFJlc2VydmVQcm9vZldhbGxldChtZXNzYWdlKTtcbn1cblxuc2VsZi5nZXRSZXNlcnZlUHJvb2ZBY2NvdW50ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFjY291bnRJZHgsIGFtb3VudFN0ciwgbWVzc2FnZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0UmVzZXJ2ZVByb29mQWNjb3VudChhY2NvdW50SWR4LCBhbW91bnRTdHIsIG1lc3NhZ2UpO1xufVxuXG5zZWxmLmNoZWNrUmVzZXJ2ZVByb29mID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmNoZWNrUmVzZXJ2ZVByb29mKGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmdldFR4Tm90ZXMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdHhIYXNoZXMpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFR4Tm90ZXModHhIYXNoZXMpO1xufVxuXG5zZWxmLnNldFR4Tm90ZXMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdHhIYXNoZXMsIHR4Tm90ZXMpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnNldFR4Tm90ZXModHhIYXNoZXMsIHR4Tm90ZXMpO1xufVxuXG5zZWxmLmdldEFkZHJlc3NCb29rRW50cmllcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBlbnRyeUluZGljZXMpIHtcbiAgbGV0IGVudHJpZXNKc29uID0gW107XG4gIGZvciAobGV0IGVudHJ5IG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldEFkZHJlc3NCb29rRW50cmllcyhlbnRyeUluZGljZXMpKSBlbnRyaWVzSnNvbi5wdXNoKGVudHJ5LnRvSnNvbigpKTtcbiAgcmV0dXJuIGVudHJpZXNKc29uO1xufVxuXG5zZWxmLmFkZEFkZHJlc3NCb29rRW50cnkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWRkcmVzcywgZGVzY3JpcHRpb24pIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmFkZEFkZHJlc3NCb29rRW50cnkoYWRkcmVzcywgZGVzY3JpcHRpb24pO1xufVxuXG5zZWxmLmVkaXRBZGRyZXNzQm9va0VudHJ5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGluZGV4LCBzZXRBZGRyZXNzLCBhZGRyZXNzLCBzZXREZXNjcmlwdGlvbiwgZGVzY3JpcHRpb24pIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmVkaXRBZGRyZXNzQm9va0VudHJ5KGluZGV4LCBzZXRBZGRyZXNzLCBhZGRyZXNzLCBzZXREZXNjcmlwdGlvbiwgZGVzY3JpcHRpb24pO1xufVxuXG5zZWxmLmRlbGV0ZUFkZHJlc3NCb29rRW50cnkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgaW5kZXgpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmRlbGV0ZUFkZHJlc3NCb29rRW50cnkoaW5kZXgpO1xufVxuXG5zZWxmLnRhZ0FjY291bnRzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHRhZywgYWNjb3VudEluZGljZXMpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnRhZ0FjY291bnRzKHRhZywgYWNjb3VudEluZGljZXMpO1xufVxuXG5zZWxmLnVudGFnQWNjb3VudHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWNjb3VudEluZGljZXMpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnVudGFnQWNjb3VudHMoYWNjb3VudEluZGljZXMpO1xufVxuXG5zZWxmLmdldEFjY291bnRUYWdzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgbGV0IGFjY291bnRUYWdzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBhY2NvdW50VGFnIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldEFjY291bnRUYWdzKCkpIGFjY291bnRUYWdzSnNvbi5wdXNoKGFjY291bnRUYWcudG9Kc29uKCkpO1xuICByZXR1cm4gYWNjb3VudFRhZ3NKc29uO1xufVxuXG5zZWxmLnNldEFjY291bnRUYWdMYWJlbCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0YWcsIGxhYmVsKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zZXRBY2NvdW50VGFnTGFiZWwodGFnLCBsYWJlbCk7XG59XG5cbnNlbGYuZ2V0UGF5bWVudFVyaSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBjb25maWdKc29uKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRQYXltZW50VXJpKG5ldyBNb25lcm9UeENvbmZpZyhjb25maWdKc29uKSk7XG59XG5cbnNlbGYucGFyc2VQYXltZW50VXJpID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHVyaSkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnBhcnNlUGF5bWVudFVyaSh1cmkpKS50b0pzb24oKTtcbn1cblxuc2VsZi5nZXRBdHRyaWJ1dGUgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwga2V5KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRBdHRyaWJ1dGUoa2V5KTtcbn1cblxuc2VsZi5zZXRBdHRyaWJ1dGUgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwga2V5LCB2YWx1ZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpO1xufVxuXG5zZWxmLnN0YXJ0TWluaW5nID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG51bVRocmVhZHMsIGJhY2tncm91bmRNaW5pbmcsIGlnbm9yZUJhdHRlcnkpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN0YXJ0TWluaW5nKG51bVRocmVhZHMsIGJhY2tncm91bmRNaW5pbmcsIGlnbm9yZUJhdHRlcnkpO1xufVxuXG5zZWxmLnN0b3BNaW5pbmcgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc3RvcE1pbmluZygpO1xufVxuXG5zZWxmLmlzTXVsdGlzaWdJbXBvcnROZWVkZWQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCgpO1xufVxuXG5zZWxmLmlzTXVsdGlzaWcgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaXNNdWx0aXNpZygpO1xufVxuXG5zZWxmLmdldE11bHRpc2lnSW5mbyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0TXVsdGlzaWdJbmZvKCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLnByZXBhcmVNdWx0aXNpZyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5wcmVwYXJlTXVsdGlzaWcoKTtcbn1cblxuc2VsZi5tYWtlTXVsdGlzaWcgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbXVsdGlzaWdIZXhlcywgdGhyZXNob2xkLCBwYXNzd29yZCkge1xuICByZXR1cm4gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0ubWFrZU11bHRpc2lnKG11bHRpc2lnSGV4ZXMsIHRocmVzaG9sZCwgcGFzc3dvcmQpO1xufVxuXG5zZWxmLmV4Y2hhbmdlTXVsdGlzaWdLZXlzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG11bHRpc2lnSGV4ZXMsIHBhc3N3b3JkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZXhjaGFuZ2VNdWx0aXNpZ0tleXMobXVsdGlzaWdIZXhlcywgcGFzc3dvcmQpKS50b0pzb24oKTtcbn1cblxuc2VsZi5leHBvcnRNdWx0aXNpZ0hleCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5leHBvcnRNdWx0aXNpZ0hleCgpO1xufVxuXG5zZWxmLmltcG9ydE11bHRpc2lnSGV4ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG11bHRpc2lnSGV4ZXMsIHJlZnJlc2hBZnRlckltcG9ydCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaW1wb3J0TXVsdGlzaWdIZXgobXVsdGlzaWdIZXhlcywgcmVmcmVzaEFmdGVySW1wb3J0KTtcbn1cblxuc2VsZi5zaWduTXVsdGlzaWdUeEhleCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBtdWx0aXNpZ1R4SGV4KSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2lnbk11bHRpc2lnVHhIZXgobXVsdGlzaWdUeEhleCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLnN1Ym1pdE11bHRpc2lnVHhIZXggPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgc2lnbmVkTXVsdGlzaWdUeEhleCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc3VibWl0TXVsdGlzaWdUeEhleChzaWduZWRNdWx0aXNpZ1R4SGV4KTtcbn1cblxuc2VsZi5nZXREYXRhID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldERhdGEoKTtcbn1cblxuc2VsZi5jaGFuZ2VQYXNzd29yZCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBvbGRQYXNzd29yZCwgbmV3UGFzc3dvcmQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmNoYW5nZVBhc3N3b3JkKG9sZFBhc3N3b3JkLCBuZXdQYXNzd29yZCk7XG59XG5cbnNlbGYuaXNDbG9zZWQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gIXNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdIHx8IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmlzQ2xvc2VkKCk7XG59XG5cbnNlbGYucHJlcGFyZUNsb3NlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnByZXBhcmVDbG9zZSgpO1xufVxuXG5zZWxmLmdldENsb3NlRGF0YSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRDbG9zZURhdGEoKTtcbn1cblxuc2VsZi5jbG9zZSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBzYXZlKSB7XG4gIGlmICghc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0pIHJldHVybjtcbiAgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uY2xvc2Uoc2F2ZSk7XG4gIGlmIChzZWxmLmxpc3RlbmVycykgc2VsZi5saXN0ZW5lcnMgPSBzZWxmLmxpc3RlbmVycy5maWx0ZXIobGlzdGVuZXIgPT4gbGlzdGVuZXIud2FsbGV0SWQgIT09IHdhbGxldElkKTtcbiAgZGVsZXRlIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdO1xufSJdLCJtYXBwaW5ncyI6ImtHQUFBLElBQUFBLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLFNBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLFdBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFHLGFBQUEsR0FBQUosc0JBQUEsQ0FBQUMs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