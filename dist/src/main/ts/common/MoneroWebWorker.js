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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfSHR0cENsaWVudCIsIl9MaWJyYXJ5VXRpbHMiLCJfTW9uZXJvQmFuIiwiX01vbmVyb0Jsb2NrIiwiX01vbmVyb0RhZW1vbkNvbmZpZyIsIl9Nb25lcm9EYWVtb25MaXN0ZW5lciIsIl9Nb25lcm9EYWVtb25ScGMiLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvS2V5SW1hZ2UiLCJfTW9uZXJvUnBjQ29ubmVjdGlvbiIsIl9Nb25lcm9UeENvbmZpZyIsIl9Nb25lcm9UeFNldCIsIl9Nb25lcm9VdGlscyIsIl9Nb25lcm9XYWxsZXRDb25maWciLCJfTW9uZXJvV2FsbGV0TGlzdGVuZXIiLCJfTW9uZXJvV2FsbGV0S2V5cyIsIl9Nb25lcm9XYWxsZXRGdWxsIiwiR2VuVXRpbHMiLCJpc0Rlbm8iLCJzZWxmIiwiZ2xvYmFsVGhpcyIsIkRlZGljYXRlZFdvcmtlckdsb2JhbFNjb3BlIiwicHJvdG90eXBlIiwiaXNQcm90b3R5cGVPZiIsIkh0dHBDbGllbnQiLCJMaWJyYXJ5VXRpbHMiLCJvbm1lc3NhZ2UiLCJlIiwiaW5pdE9uZVRpbWUiLCJvYmplY3RJZCIsImRhdGEiLCJmbk5hbWUiLCJjYWxsYmFja0lkIiwiYXNzZXJ0IiwiRXJyb3IiLCJzcGxpY2UiLCJwb3N0TWVzc2FnZSIsInJlc3VsdCIsImFwcGx5IiwiZXJyb3IiLCJzZXJpYWxpemVFcnJvciIsImlzSW5pdGlhbGl6ZWQiLCJXT1JLRVJfT0JKRUNUUyIsIk1vbmVyb1V0aWxzIiwiUFJPWFlfVE9fV09SS0VSIiwiaHR0cFJlcXVlc3QiLCJvcHRzIiwicmVxdWVzdCIsIk9iamVjdCIsImFzc2lnbiIsInByb3h5VG9Xb3JrZXIiLCJlcnIiLCJzdGF0dXNDb2RlIiwiSlNPTiIsInN0cmluZ2lmeSIsInN0YXR1c01lc3NhZ2UiLCJtZXNzYWdlIiwic2V0TG9nTGV2ZWwiLCJsZXZlbCIsImdldFdhc21NZW1vcnlVc2VkIiwiZ2V0V2FzbU1vZHVsZSIsIkhFQVA4IiwibGVuZ3RoIiwidW5kZWZpbmVkIiwibW9uZXJvVXRpbHNHZXRJbnRlZ3JhdGVkQWRkcmVzcyIsIm5ldHdvcmtUeXBlIiwic3RhbmRhcmRBZGRyZXNzIiwicGF5bWVudElkIiwiZ2V0SW50ZWdyYXRlZEFkZHJlc3MiLCJ0b0pzb24iLCJtb25lcm9VdGlsc1ZhbGlkYXRlQWRkcmVzcyIsImFkZHJlc3MiLCJ2YWxpZGF0ZUFkZHJlc3MiLCJtb25lcm9VdGlsc0pzb25Ub0JpbmFyeSIsImpzb24iLCJqc29uVG9CaW5hcnkiLCJtb25lcm9VdGlsc0JpbmFyeVRvSnNvbiIsInVpbnQ4YXJyIiwiYmluYXJ5VG9Kc29uIiwibW9uZXJvVXRpbHNCaW5hcnlCbG9ja3NUb0pzb24iLCJiaW5hcnlCbG9ja3NUb0pzb24iLCJkYWVtb25BZGRMaXN0ZW5lciIsImRhZW1vbklkIiwibGlzdGVuZXJJZCIsImxpc3RlbmVyIiwiTW9uZXJvRGFlbW9uTGlzdGVuZXIiLCJvbkJsb2NrSGVhZGVyIiwiYmxvY2tIZWFkZXIiLCJkYWVtb25MaXN0ZW5lcnMiLCJhZGRMaXN0ZW5lciIsImRhZW1vblJlbW92ZUxpc3RlbmVyIiwiTW9uZXJvRXJyb3IiLCJyZW1vdmVMaXN0ZW5lciIsImNvbm5lY3REYWVtb25ScGMiLCJjb25maWciLCJNb25lcm9EYWVtb25ScGMiLCJjb25uZWN0VG9EYWVtb25ScGMiLCJNb25lcm9EYWVtb25Db25maWciLCJkYWVtb25HZXRScGNDb25uZWN0aW9uIiwiY29ubmVjdGlvbiIsImdldFJwY0Nvbm5lY3Rpb24iLCJnZXRDb25maWciLCJkYWVtb25Jc0Nvbm5lY3RlZCIsImlzQ29ubmVjdGVkIiwiZGFlbW9uR2V0VmVyc2lvbiIsImdldFZlcnNpb24iLCJkYWVtb25Jc1RydXN0ZWQiLCJpc1RydXN0ZWQiLCJkYWVtb25HZXRIZWlnaHQiLCJnZXRIZWlnaHQiLCJkYWVtb25HZXRCbG9ja0hhc2giLCJoZWlnaHQiLCJnZXRCbG9ja0hhc2giLCJkYWVtb25HZXRCbG9ja1RlbXBsYXRlIiwid2FsbGV0QWRkcmVzcyIsInJlc2VydmVTaXplIiwiZ2V0QmxvY2tUZW1wbGF0ZSIsImRhZW1vbkdldExhc3RCbG9ja0hlYWRlciIsImdldExhc3RCbG9ja0hlYWRlciIsImRhZW1vbkdldEJsb2NrSGVhZGVyQnlIYXNoIiwiaGFzaCIsImdldEJsb2NrSGVhZGVyQnlIYXNoIiwiZGFlbW9uR2V0QmxvY2tIZWFkZXJCeUhlaWdodCIsImdldEJsb2NrSGVhZGVyQnlIZWlnaHQiLCJkYWVtb25HZXRCbG9ja0hlYWRlcnNCeVJhbmdlIiwic3RhcnRIZWlnaHQiLCJlbmRIZWlnaHQiLCJibG9ja0hlYWRlcnNKc29uIiwiZ2V0QmxvY2tIZWFkZXJzQnlSYW5nZSIsInB1c2giLCJkYWVtb25HZXRCbG9ja0J5SGFzaCIsImJsb2NrSGFzaCIsImdldEJsb2NrQnlIYXNoIiwiZGFlbW9uR2V0QmxvY2tzQnlIYXNoIiwiYmxvY2tIYXNoZXMiLCJwcnVuZSIsImJsb2Nrc0pzb24iLCJibG9jayIsImdldEJsb2Nrc0J5SGFzaCIsImRhZW1vbkdldEJsb2NrQnlIZWlnaHQiLCJnZXRCbG9ja0J5SGVpZ2h0IiwiZGFlbW9uR2V0QmxvY2tzQnlIZWlnaHQiLCJoZWlnaHRzIiwiZ2V0QmxvY2tzQnlIZWlnaHQiLCJkYWVtb25HZXRCbG9ja3NCeVJhbmdlIiwiZ2V0QmxvY2tzQnlSYW5nZSIsImRhZW1vbkdldEJsb2Nrc0J5UmFuZ2VDaHVua2VkIiwibWF4Q2h1bmtTaXplIiwiZ2V0QmxvY2tzQnlSYW5nZUNodW5rZWQiLCJkYWVtb25HZXRCbG9ja0hhc2hlcyIsImRhZW1vbkdldFR4cyIsInR4SGFzaGVzIiwidHhzIiwiZ2V0VHhzIiwiYmxvY2tzIiwidW5jb25maXJtZWRCbG9jayIsInNlZW5CbG9ja3MiLCJTZXQiLCJ0eCIsImdldEJsb2NrIiwiTW9uZXJvQmxvY2siLCJzZXRUeHMiLCJzZXRCbG9jayIsImhhcyIsImFkZCIsImkiLCJkYWVtb25HZXRUeEhleGVzIiwiZ2V0VHhIZXhlcyIsImRhZW1vbkdldE1pbmVyVHhTdW0iLCJudW1CbG9ja3MiLCJnZXRNaW5lclR4U3VtIiwiZGFlbW9uR2V0RmVlRXN0aW1hdGUiLCJncmFjZUJsb2NrcyIsImdldEZlZUVzdGltYXRlIiwiZGFlbW9uU3VibWl0VHhIZXgiLCJ0eEhleCIsImRvTm90UmVsYXkiLCJzdWJtaXRUeEhleCIsImRhZW1vblJlbGF5VHhzQnlIYXNoIiwicmVsYXlUeHNCeUhhc2giLCJkYWVtb25HZXRUeFBvb2wiLCJnZXRUeFBvb2wiLCJkYWVtb25HZXRUeFBvb2xIYXNoZXMiLCJnZXRUeFBvb2xIYXNoZXMiLCJkYWVtb25HZXRUeFBvb2xTdGF0cyIsImdldFR4UG9vbFN0YXRzIiwiZGFlbW9uRmx1c2hUeFBvb2wiLCJoYXNoZXMiLCJmbHVzaFR4UG9vbCIsImRhZW1vbkdldEtleUltYWdlU3BlbnRTdGF0dXNlcyIsImtleUltYWdlcyIsImdldEtleUltYWdlU3BlbnRTdGF0dXNlcyIsImRhZW1vbkdldE91dHB1dEhpc3RvZ3JhbSIsImFtb3VudHMiLCJtaW5Db3VudCIsIm1heENvdW50IiwiaXNVbmxvY2tlZCIsInJlY2VudEN1dG9mZiIsImVudHJpZXNKc29uIiwiZW50cnkiLCJnZXRPdXRwdXRIaXN0b2dyYW0iLCJkYWVtb25HZXRJbmZvIiwiZ2V0SW5mbyIsImRhZW1vbkdldFN5bmNJbmZvIiwiZ2V0U3luY0luZm8iLCJkYWVtb25HZXRIYXJkRm9ya0luZm8iLCJnZXRIYXJkRm9ya0luZm8iLCJkYWVtb25HZXRBbHRDaGFpbnMiLCJhbHRDaGFpbnNKc29uIiwiYWx0Q2hhaW4iLCJnZXRBbHRDaGFpbnMiLCJkYWVtb25HZXRBbHRCbG9ja0hhc2hlcyIsImdldEFsdEJsb2NrSGFzaGVzIiwiZGFlbW9uR2V0RG93bmxvYWRMaW1pdCIsImdldERvd25sb2FkTGltaXQiLCJkYWVtb25TZXREb3dubG9hZExpbWl0IiwibGltaXQiLCJzZXREb3dubG9hZExpbWl0IiwiZGFlbW9uUmVzZXREb3dubG9hZExpbWl0IiwicmVzZXREb3dubG9hZExpbWl0IiwiZGFlbW9uR2V0VXBsb2FkTGltaXQiLCJnZXRVcGxvYWRMaW1pdCIsImRhZW1vblNldFVwbG9hZExpbWl0Iiwic2V0VXBsb2FkTGltaXQiLCJkYWVtb25SZXNldFVwbG9hZExpbWl0IiwicmVzZXRVcGxvYWRMaW1pdCIsImRhZW1vbkdldFBlZXJzIiwicGVlcnNKc29uIiwicGVlciIsImdldFBlZXJzIiwiZGFlbW9uR2V0S25vd25QZWVycyIsImdldEtub3duUGVlcnMiLCJkYWVtb25TZXRPdXRnb2luZ1BlZXJMaW1pdCIsInNldE91dGdvaW5nUGVlckxpbWl0IiwiZGFlbW9uU2V0SW5jb21pbmdQZWVyTGltaXQiLCJzZXRJbmNvbWluZ1BlZXJMaW1pdCIsImRhZW1vbkdldFBlZXJCYW5zIiwiYmFuc0pzb24iLCJiYW4iLCJnZXRQZWVyQmFucyIsImRhZW1vblNldFBlZXJCYW5zIiwiYmFucyIsImJhbkpzb24iLCJNb25lcm9CYW4iLCJzZXRQZWVyQmFucyIsImRhZW1vblN0YXJ0TWluaW5nIiwibnVtVGhyZWFkcyIsImlzQmFja2dyb3VuZCIsImlnbm9yZUJhdHRlcnkiLCJzdGFydE1pbmluZyIsImRhZW1vblN0b3BNaW5pbmciLCJzdG9wTWluaW5nIiwiZGFlbW9uR2V0TWluaW5nU3RhdHVzIiwiZ2V0TWluaW5nU3RhdHVzIiwiZGFlbW9uU3VibWl0QmxvY2tzIiwiYmxvY2tCbG9icyIsInN1Ym1pdEJsb2NrcyIsImRhZW1vblBydW5lQmxvY2tjaGFpbiIsImNoZWNrIiwicHJ1bmVCbG9ja2NoYWluIiwiZGFlbW9uU3RvcCIsInN0b3AiLCJkYWVtb25XYWl0Rm9yTmV4dEJsb2NrSGVhZGVyIiwid2FpdEZvck5leHRCbG9ja0hlYWRlciIsIm9wZW5XYWxsZXREYXRhIiwid2FsbGV0SWQiLCJwYXRoIiwicGFzc3dvcmQiLCJrZXlzRGF0YSIsImNhY2hlRGF0YSIsImRhZW1vblVyaU9yQ29uZmlnIiwicmVndGVzdCIsImRhZW1vbkNvbm5lY3Rpb24iLCJNb25lcm9ScGNDb25uZWN0aW9uIiwiTW9uZXJvV2FsbGV0RnVsbCIsIm9wZW5XYWxsZXQiLCJzZXJ2ZXIiLCJzZXRCcm93c2VyTWFpblBhdGgiLCJjcmVhdGVXYWxsZXRLZXlzIiwiY29uZmlnSnNvbiIsIk1vbmVyb1dhbGxldENvbmZpZyIsInNldFByb3h5VG9Xb3JrZXIiLCJNb25lcm9XYWxsZXRLZXlzIiwiY3JlYXRlV2FsbGV0IiwiY3JlYXRlV2FsbGV0RnVsbCIsImdldFBhdGgiLCJzZXRQYXRoIiwiaXNWaWV3T25seSIsImdldE5ldHdvcmtUeXBlIiwiZ2V0U2VlZCIsImdldFNlZWRMYW5ndWFnZSIsImdldFNlZWRMYW5ndWFnZXMiLCJnZXRQcml2YXRlU3BlbmRLZXkiLCJnZXRQcml2YXRlVmlld0tleSIsImdldFB1YmxpY1ZpZXdLZXkiLCJnZXRQdWJsaWNTcGVuZEtleSIsImdldEFkZHJlc3MiLCJhY2NvdW50SWR4Iiwic3ViYWRkcmVzc0lkeCIsImdldEFkZHJlc3NJbmRleCIsInNldFN1YmFkZHJlc3NMYWJlbCIsImxhYmVsIiwiZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MiLCJpbnRlZ3JhdGVkQWRkcmVzcyIsInNldERhZW1vbkNvbm5lY3Rpb24iLCJnZXREYWVtb25Db25uZWN0aW9uIiwiaXNEYWVtb25UcnVzdGVkIiwiaXNDb25uZWN0ZWRUb0RhZW1vbiIsImdldFJlc3RvcmVIZWlnaHQiLCJzZXRSZXN0b3JlSGVpZ2h0IiwicmVzdG9yZUhlaWdodCIsImdldERhZW1vbkhlaWdodCIsImdldERhZW1vbk1heFBlZXJIZWlnaHQiLCJnZXRIZWlnaHRCeURhdGUiLCJ5ZWFyIiwibW9udGgiLCJkYXkiLCJpc0RhZW1vblN5bmNlZCIsIldhbGxldFdvcmtlckhlbHBlckxpc3RlbmVyIiwiTW9uZXJvV2FsbGV0TGlzdGVuZXIiLCJjb25zdHJ1Y3RvciIsImlkIiwid29ya2VyIiwiZ2V0SWQiLCJvblN5bmNQcm9ncmVzcyIsInBlcmNlbnREb25lIiwib25OZXdCbG9jayIsIm9uQmFsYW5jZXNDaGFuZ2VkIiwibmV3QmFsYW5jZSIsIm5ld1VubG9ja2VkQmFsYW5jZSIsInRvU3RyaW5nIiwib25PdXRwdXRSZWNlaXZlZCIsIm91dHB1dCIsImdldFR4Iiwib25PdXRwdXRTcGVudCIsImxpc3RlbmVycyIsImlzU3luY2VkIiwic3luYyIsImFsbG93Q29uY3VycmVudENhbGxzIiwic3RhcnRTeW5jaW5nIiwic3luY1BlcmlvZEluTXMiLCJzdG9wU3luY2luZyIsInNjYW5UeHMiLCJyZXNjYW5TcGVudCIsInJlc2NhbkJsb2NrY2hhaW4iLCJnZXRCYWxhbmNlIiwiZ2V0VW5sb2NrZWRCYWxhbmNlIiwiZ2V0QWNjb3VudHMiLCJpbmNsdWRlU3ViYWRkcmVzc2VzIiwidGFnIiwiYWNjb3VudEpzb25zIiwiYWNjb3VudCIsImdldEFjY291bnQiLCJjcmVhdGVBY2NvdW50IiwiZ2V0U3ViYWRkcmVzc2VzIiwic3ViYWRkcmVzc0luZGljZXMiLCJzdWJhZGRyZXNzSnNvbnMiLCJzdWJhZGRyZXNzIiwiY3JlYXRlU3ViYWRkcmVzcyIsImJsb2NrSnNvblF1ZXJ5IiwicXVlcnkiLCJEZXNlcmlhbGl6YXRpb25UeXBlIiwiVFhfUVVFUlkiLCJnZXRUcmFuc2ZlcnMiLCJnZXRUcmFuc2ZlclF1ZXJ5IiwidHJhbnNmZXJzIiwidHJhbnNmZXIiLCJnZXRPdXRwdXRzIiwiZ2V0T3V0cHV0UXVlcnkiLCJvdXRwdXRzIiwiZXhwb3J0T3V0cHV0cyIsImFsbCIsImltcG9ydE91dHB1dHMiLCJvdXRwdXRzSGV4IiwiZ2V0S2V5SW1hZ2VzIiwiZXhwb3J0S2V5SW1hZ2VzIiwiaW1wb3J0S2V5SW1hZ2VzIiwia2V5SW1hZ2VzSnNvbiIsIm9mZnNldCIsImtleUltYWdlSnNvbiIsIk1vbmVyb0tleUltYWdlIiwiZnJlZXplT3V0cHV0Iiwia2V5SW1hZ2UiLCJ0aGF3T3V0cHV0IiwiaXNPdXRwdXRGcm96ZW4iLCJnZXREZWZhdWx0RmVlUHJpb3JpdHkiLCJjcmVhdGVUeHMiLCJNb25lcm9UeENvbmZpZyIsImdldFR4U2V0Iiwic3dlZXBPdXRwdXQiLCJzd2VlcFVubG9ja2VkIiwidHhTZXRzIiwiYXJyYXlDb250YWlucyIsInR4U2V0c0pzb24iLCJ0eFNldCIsInN3ZWVwRHVzdCIsInJlbGF5IiwicmVsYXlUeHMiLCJ0eE1ldGFkYXRhcyIsImRlc2NyaWJlVHhTZXQiLCJ0eFNldEpzb24iLCJNb25lcm9UeFNldCIsInNpZ25UeHMiLCJ1bnNpZ25lZFR4SGV4Iiwic3VibWl0VHhzIiwic2lnbmVkVHhIZXgiLCJzaWduTWVzc2FnZSIsInNpZ25hdHVyZVR5cGUiLCJ2ZXJpZnlNZXNzYWdlIiwic2lnbmF0dXJlIiwiZ2V0VHhLZXkiLCJ0eEhhc2giLCJjaGVja1R4S2V5IiwidHhLZXkiLCJnZXRUeFByb29mIiwiY2hlY2tUeFByb29mIiwiZ2V0U3BlbmRQcm9vZiIsImNoZWNrU3BlbmRQcm9vZiIsImdldFJlc2VydmVQcm9vZldhbGxldCIsImdldFJlc2VydmVQcm9vZkFjY291bnQiLCJhbW91bnRTdHIiLCJjaGVja1Jlc2VydmVQcm9vZiIsImdldFR4Tm90ZXMiLCJzZXRUeE5vdGVzIiwidHhOb3RlcyIsImdldEFkZHJlc3NCb29rRW50cmllcyIsImVudHJ5SW5kaWNlcyIsImFkZEFkZHJlc3NCb29rRW50cnkiLCJkZXNjcmlwdGlvbiIsImVkaXRBZGRyZXNzQm9va0VudHJ5IiwiaW5kZXgiLCJzZXRBZGRyZXNzIiwic2V0RGVzY3JpcHRpb24iLCJkZWxldGVBZGRyZXNzQm9va0VudHJ5IiwidGFnQWNjb3VudHMiLCJhY2NvdW50SW5kaWNlcyIsInVudGFnQWNjb3VudHMiLCJnZXRBY2NvdW50VGFncyIsInNldEFjY291bnRUYWdMYWJlbCIsImdldFBheW1lbnRVcmkiLCJwYXJzZVBheW1lbnRVcmkiLCJ1cmkiLCJnZXRBdHRyaWJ1dGUiLCJrZXkiLCJzZXRBdHRyaWJ1dGUiLCJ2YWx1ZSIsImJhY2tncm91bmRNaW5pbmciLCJpc011bHRpc2lnSW1wb3J0TmVlZGVkIiwiaXNNdWx0aXNpZyIsImdldE11bHRpc2lnSW5mbyIsInByZXBhcmVNdWx0aXNpZyIsIm1ha2VNdWx0aXNpZyIsIm11bHRpc2lnSGV4ZXMiLCJ0aHJlc2hvbGQiLCJleGNoYW5nZU11bHRpc2lnS2V5cyIsImV4cG9ydE11bHRpc2lnSGV4IiwiaW1wb3J0TXVsdGlzaWdIZXgiLCJyZWZyZXNoQWZ0ZXJJbXBvcnQiLCJzaWduTXVsdGlzaWdUeEhleCIsIm11bHRpc2lnVHhIZXgiLCJzdWJtaXRNdWx0aXNpZ1R4SGV4Iiwic2lnbmVkTXVsdGlzaWdUeEhleCIsImdldERhdGEiLCJjaGFuZ2VQYXNzd29yZCIsIm9sZFBhc3N3b3JkIiwibmV3UGFzc3dvcmQiLCJpc0Nsb3NlZCIsInByZXBhcmVDbG9zZSIsImdldENsb3NlRGF0YSIsImNsb3NlIiwic2F2ZSIsImZpbHRlciJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL2NvbW1vbi9Nb25lcm9XZWJXb3JrZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XG5pbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4vR2VuVXRpbHNcIjtcbmltcG9ydCBIdHRwQ2xpZW50IGZyb20gXCIuL0h0dHBDbGllbnRcIjtcbmltcG9ydCBMaWJyYXJ5VXRpbHMgZnJvbSBcIi4vTGlicmFyeVV0aWxzXCI7XG5pbXBvcnQgTW9uZXJvQmFuIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvQmFuXCI7XG5pbXBvcnQgTW9uZXJvQmxvY2sgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9CbG9ja1wiO1xuaW1wb3J0IE1vbmVyb0RhZW1vbkNvbmZpZyBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0RhZW1vbkNvbmZpZ1wiO1xuaW1wb3J0IE1vbmVyb0RhZW1vbkxpc3RlbmVyIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvRGFlbW9uTGlzdGVuZXJcIjtcbmltcG9ydCBNb25lcm9EYWVtb25ScGMgZnJvbSBcIi4uL2RhZW1vbi9Nb25lcm9EYWVtb25ScGNcIjtcbmltcG9ydCBNb25lcm9FcnJvciBmcm9tIFwiLi9Nb25lcm9FcnJvclwiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvS2V5SW1hZ2VcIjtcbmltcG9ydCBNb25lcm9ScGNDb25uZWN0aW9uIGZyb20gXCIuL01vbmVyb1JwY0Nvbm5lY3Rpb25cIjtcbmltcG9ydCBNb25lcm9UeENvbmZpZyBmcm9tIFwiLi4vd2FsbGV0L21vZGVsL01vbmVyb1R4Q29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvVHhRdWVyeSBmcm9tIFwiLi4vd2FsbGV0L21vZGVsL01vbmVyb1R4UXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeFNldCBmcm9tIFwiLi4vd2FsbGV0L21vZGVsL01vbmVyb1R4U2V0XCI7XG5pbXBvcnQgTW9uZXJvVXRpbHMgZnJvbSBcIi4vTW9uZXJvVXRpbHNcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRDb25maWcgZnJvbSBcIi4uL3dhbGxldC9tb2RlbC9Nb25lcm9XYWxsZXRDb25maWdcIlxuaW1wb3J0IE1vbmVyb1dhbGxldExpc3RlbmVyIGZyb20gXCIuLi93YWxsZXQvbW9kZWwvTW9uZXJvV2FsbGV0TGlzdGVuZXJcIlxuaW1wb3J0IHtNb25lcm9XYWxsZXRLZXlzfSBmcm9tIFwiLi4vd2FsbGV0L01vbmVyb1dhbGxldEtleXNcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRGdWxsIGZyb20gXCIuLi93YWxsZXQvTW9uZXJvV2FsbGV0RnVsbFwiO1xuXG5kZWNsYXJlIHZhciBzZWxmOiBhbnk7XG5cbi8vIGRlbm8gY29uZmlndXJhdGlvblxuZGVjbGFyZSB2YXIgRGVkaWNhdGVkV29ya2VyR2xvYmFsU2NvcGU6IGFueTtcbmlmIChHZW5VdGlscy5pc0Rlbm8oKSAmJiB0eXBlb2Ygc2VsZiA9PT0gXCJ1bmRlZmluZWRcIiAmJiB0eXBlb2YgZ2xvYmFsVGhpcyA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgRGVkaWNhdGVkV29ya2VyR2xvYmFsU2NvcGUgPT09IFwiZnVuY3Rpb25cIiAmJiBEZWRpY2F0ZWRXb3JrZXJHbG9iYWxTY29wZS5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihnbG9iYWxUaGlzKSkge1xuICBzZWxmID0gZ2xvYmFsVGhpcztcbiAgKGdsb2JhbFRoaXMgYXMgYW55KS5zZWxmID0gZ2xvYmFsVGhpcztcbn1cblxuLy8gZXhwb3NlIHNvbWUgbW9kdWxlcyB0byB0aGUgd29ya2VyXG5zZWxmLkh0dHBDbGllbnQgPSBIdHRwQ2xpZW50O1xuc2VsZi5MaWJyYXJ5VXRpbHMgPSBMaWJyYXJ5VXRpbHM7XG5zZWxmLkdlblV0aWxzID0gR2VuVXRpbHM7XG5cbi8qKlxuICogV29ya2VyIHRvIG1hbmFnZSBhIGRhZW1vbiBhbmQgd2FzbSB3YWxsZXQgb2ZmIHRoZSBtYWluIHRocmVhZCB1c2luZyBtZXNzYWdlcy5cbiAqIFxuICogUmVxdWlyZWQgbWVzc2FnZSBmb3JtYXQ6IGUuZGF0YVswXSA9IG9iamVjdCBpZCwgZS5kYXRhWzFdID0gZnVuY3Rpb24gbmFtZSwgZS5kYXRhWzIrXSA9IGZ1bmN0aW9uIGFyZ3NcbiAqXG4gKiBGb3IgYnJvd3NlciBhcHBsaWNhdGlvbnMsIHRoaXMgZmlsZSBtdXN0IGJlIGJyb3dzZXJpZmllZCBhbmQgcGxhY2VkIGluIHRoZSB3ZWIgYXBwIHJvb3QuXG4gKiBcbiAqIEBwcml2YXRlXG4gKi9cbnNlbGYub25tZXNzYWdlID0gYXN5bmMgZnVuY3Rpb24oZSkge1xuICBcbiAgLy8gaW5pdGlhbGl6ZSBvbmUgdGltZVxuICBhd2FpdCBzZWxmLmluaXRPbmVUaW1lKCk7XG4gIFxuICAvLyB2YWxpZGF0ZSBwYXJhbXNcbiAgbGV0IG9iamVjdElkID0gZS5kYXRhWzBdO1xuICBsZXQgZm5OYW1lID0gZS5kYXRhWzFdO1xuICBsZXQgY2FsbGJhY2tJZCA9IGUuZGF0YVsyXTtcbiAgYXNzZXJ0KGZuTmFtZSwgXCJNdXN0IHByb3ZpZGUgZnVuY3Rpb24gbmFtZSB0byB3b3JrZXJcIik7XG4gIGFzc2VydChjYWxsYmFja0lkLCBcIk11c3QgcHJvdmlkZSBjYWxsYmFjayBpZCB0byB3b3JrZXJcIik7XG4gIGlmICghc2VsZltmbk5hbWVdKSB0aHJvdyBuZXcgRXJyb3IoXCJNZXRob2QgJ1wiICsgZm5OYW1lICsgXCInIGlzIG5vdCByZWdpc3RlcmVkIHdpdGggd29ya2VyXCIpO1xuICBlLmRhdGEuc3BsaWNlKDEsIDIpOyAvLyByZW1vdmUgZnVuY3Rpb24gbmFtZSBhbmQgY2FsbGJhY2sgaWQgdG8gYXBwbHkgZnVuY3Rpb24gd2l0aCBhcmd1bWVudHNcbiAgXG4gIC8vIGV4ZWN1dGUgd29ya2VyIGZ1bmN0aW9uIGFuZCBwb3N0IHJlc3VsdCB0byBjYWxsYmFja1xuICB0cnkge1xuICAgIHBvc3RNZXNzYWdlKFtvYmplY3RJZCwgY2FsbGJhY2tJZCwge3Jlc3VsdDogYXdhaXQgc2VsZltmbk5hbWVdLmFwcGx5KG51bGwsIGUuZGF0YSl9XSk7XG4gIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgIGlmICghKGUgaW5zdGFuY2VvZiBFcnJvcikpIGUgPSBuZXcgRXJyb3IoZSk7XG4gICAgcG9zdE1lc3NhZ2UoW29iamVjdElkLCBjYWxsYmFja0lkLCB7ZXJyb3I6IExpYnJhcnlVdGlscy5zZXJpYWxpemVFcnJvcihlKX1dKTtcbiAgfVxufVxuXG5zZWxmLmluaXRPbmVUaW1lID0gYXN5bmMgZnVuY3Rpb24oKSB7XG4gIGlmICghc2VsZi5pc0luaXRpYWxpemVkKSB7XG4gICAgc2VsZi5XT1JLRVJfT0JKRUNUUyA9IHt9O1xuICAgIHNlbGYuaXNJbml0aWFsaXplZCA9IHRydWU7XG4gICAgTW9uZXJvVXRpbHMuUFJPWFlfVE9fV09SS0VSID0gZmFsc2U7XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFNUQVRJQyBVVElMSVRJRVMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5zZWxmLmh0dHBSZXF1ZXN0ID0gYXN5bmMgZnVuY3Rpb24ob2JqZWN0SWQsIG9wdHMpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gYXdhaXQgSHR0cENsaWVudC5yZXF1ZXN0KE9iamVjdC5hc3NpZ24ob3B0cywge3Byb3h5VG9Xb3JrZXI6IGZhbHNlfSkpOyAgXG4gIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgdGhyb3cgZXJyLnN0YXR1c0NvZGUgPyBuZXcgRXJyb3IoSlNPTi5zdHJpbmdpZnkoe3N0YXR1c0NvZGU6IGVyci5zdGF0dXNDb2RlLCBzdGF0dXNNZXNzYWdlOiBlcnIubWVzc2FnZX0pKSA6IGVycjtcbiAgfVxufVxuXG5zZWxmLnNldExvZ0xldmVsID0gYXN5bmMgZnVuY3Rpb24ob2JqZWN0SWQsIGxldmVsKSB7XG4gIHJldHVybiBMaWJyYXJ5VXRpbHMuc2V0TG9nTGV2ZWwobGV2ZWwpO1xufVxuXG5zZWxmLmdldFdhc21NZW1vcnlVc2VkID0gYXN5bmMgZnVuY3Rpb24ob2JqZWN0SWQpIHtcbiAgcmV0dXJuIExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkgJiYgTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5IRUFQOCA/IExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkuSEVBUDgubGVuZ3RoIDogdW5kZWZpbmVkO1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBNT05FUk8gVVRJTFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnNlbGYubW9uZXJvVXRpbHNHZXRJbnRlZ3JhdGVkQWRkcmVzcyA9IGFzeW5jIGZ1bmN0aW9uKG9iamVjdElkLCBuZXR3b3JrVHlwZSwgc3RhbmRhcmRBZGRyZXNzLCBwYXltZW50SWQpIHtcbiAgcmV0dXJuIChhd2FpdCBNb25lcm9VdGlscy5nZXRJbnRlZ3JhdGVkQWRkcmVzcyhuZXR3b3JrVHlwZSwgc3RhbmRhcmRBZGRyZXNzLCBwYXltZW50SWQpKS50b0pzb24oKTtcbn1cblxuc2VsZi5tb25lcm9VdGlsc1ZhbGlkYXRlQWRkcmVzcyA9IGFzeW5jIGZ1bmN0aW9uKG9iamVjdElkLCBhZGRyZXNzLCBuZXR3b3JrVHlwZSkge1xuICByZXR1cm4gTW9uZXJvVXRpbHMudmFsaWRhdGVBZGRyZXNzKGFkZHJlc3MsIG5ldHdvcmtUeXBlKTtcbn1cblxuc2VsZi5tb25lcm9VdGlsc0pzb25Ub0JpbmFyeSA9IGFzeW5jIGZ1bmN0aW9uKG9iamVjdElkLCBqc29uKSB7XG4gIHJldHVybiBNb25lcm9VdGlscy5qc29uVG9CaW5hcnkoanNvbik7XG59XG5cbnNlbGYubW9uZXJvVXRpbHNCaW5hcnlUb0pzb24gPSBhc3luYyBmdW5jdGlvbihvYmplY3RJZCwgdWludDhhcnIpIHtcbiAgcmV0dXJuIE1vbmVyb1V0aWxzLmJpbmFyeVRvSnNvbih1aW50OGFycik7XG59XG5cbnNlbGYubW9uZXJvVXRpbHNCaW5hcnlCbG9ja3NUb0pzb24gPSBhc3luYyBmdW5jdGlvbihvYmplY3RJZCwgdWludDhhcnIpIHtcbiAgcmV0dXJuIE1vbmVyb1V0aWxzLmJpbmFyeUJsb2Nrc1RvSnNvbih1aW50OGFycik7XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gREFFTU9OIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuc2VsZi5kYWVtb25BZGRMaXN0ZW5lciA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBsaXN0ZW5lcklkKSB7XG4gIGxldCBsaXN0ZW5lciA9IG5ldyBjbGFzcyBleHRlbmRzIE1vbmVyb0RhZW1vbkxpc3RlbmVyIHtcbiAgICBhc3luYyBvbkJsb2NrSGVhZGVyKGJsb2NrSGVhZGVyKSB7XG4gICAgICBzZWxmLnBvc3RNZXNzYWdlKFtkYWVtb25JZCwgXCJvbkJsb2NrSGVhZGVyX1wiICsgbGlzdGVuZXJJZCwgYmxvY2tIZWFkZXIudG9Kc29uKCldKTtcbiAgICB9XG4gIH1cbiAgaWYgKCFzZWxmLmRhZW1vbkxpc3RlbmVycykgc2VsZi5kYWVtb25MaXN0ZW5lcnMgPSB7fTtcbiAgc2VsZi5kYWVtb25MaXN0ZW5lcnNbbGlzdGVuZXJJZF0gPSBsaXN0ZW5lcjtcbiAgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xufVxuXG5zZWxmLmRhZW1vblJlbW92ZUxpc3RlbmVyID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGxpc3RlbmVySWQpIHtcbiAgaWYgKCFzZWxmLmRhZW1vbkxpc3RlbmVyc1tsaXN0ZW5lcklkXSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm8gZGFlbW9uIHdvcmtlciBsaXN0ZW5lciByZWdpc3RlcmVkIHdpdGggaWQ6IFwiICsgbGlzdGVuZXJJZCk7XG4gIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnJlbW92ZUxpc3RlbmVyKHNlbGYuZGFlbW9uTGlzdGVuZXJzW2xpc3RlbmVySWRdKTtcbiAgZGVsZXRlIHNlbGYuZGFlbW9uTGlzdGVuZXJzW2xpc3RlbmVySWRdO1xufVxuXG5zZWxmLmNvbm5lY3REYWVtb25ScGMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgY29uZmlnKSB7XG4gIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdID0gYXdhaXQgTW9uZXJvRGFlbW9uUnBjLmNvbm5lY3RUb0RhZW1vblJwYyhuZXcgTW9uZXJvRGFlbW9uQ29uZmlnKGNvbmZpZykpO1xufVxuXG5zZWxmLmRhZW1vbkdldFJwY0Nvbm5lY3Rpb24gPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICBsZXQgY29ubmVjdGlvbiA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldFJwY0Nvbm5lY3Rpb24oKTtcbiAgcmV0dXJuIGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldENvbmZpZygpIDogdW5kZWZpbmVkO1xufVxuXG5zZWxmLmRhZW1vbklzQ29ubmVjdGVkID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmlzQ29ubmVjdGVkKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0VmVyc2lvbiA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0VmVyc2lvbigpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25Jc1RydXN0ZWQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uaXNUcnVzdGVkKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0SGVpZ2h0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEhlaWdodCgpO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2NrSGFzaCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBoZWlnaHQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2NrSGFzaChoZWlnaHQpO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2NrVGVtcGxhdGUgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgd2FsbGV0QWRkcmVzcywgcmVzZXJ2ZVNpemUpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja1RlbXBsYXRlKHdhbGxldEFkZHJlc3MsIHJlc2VydmVTaXplKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0TGFzdEJsb2NrSGVhZGVyID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRMYXN0QmxvY2tIZWFkZXIoKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tIZWFkZXJCeUhhc2ggPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgaGFzaCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2NrSGVhZGVyQnlIYXNoKGhhc2gpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja0hlYWRlckJ5SGVpZ2h0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGhlaWdodCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2NrSGVhZGVyQnlIZWlnaHQoaGVpZ2h0KSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tIZWFkZXJzQnlSYW5nZSA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSB7XG4gIGxldCBibG9ja0hlYWRlcnNKc29uID0gW107XG4gIGZvciAobGV0IGJsb2NrSGVhZGVyIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2NrSGVhZGVyc0J5UmFuZ2Uoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCkpIGJsb2NrSGVhZGVyc0pzb24ucHVzaChibG9ja0hlYWRlci50b0pzb24oKSk7XG4gIHJldHVybiBibG9ja0hlYWRlcnNKc29uO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2NrQnlIYXNoID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGJsb2NrSGFzaCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2NrQnlIYXNoKGJsb2NrSGFzaCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2Nrc0J5SGFzaCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBibG9ja0hhc2hlcywgc3RhcnRIZWlnaHQsIHBydW5lKSB7XG4gIGxldCBibG9ja3NKc29uID0gW107XG4gIGZvciAobGV0IGJsb2NrIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2Nrc0J5SGFzaChibG9ja0hhc2hlcywgc3RhcnRIZWlnaHQsIHBydW5lKSkgYmxvY2tzSnNvbi5wdXNoKGJsb2NrLnRvSnNvbigpKTtcbiAgcmV0dXJuIGJsb2Nrc0pzb247XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tCeUhlaWdodCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBoZWlnaHQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja0J5SGVpZ2h0KGhlaWdodCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2Nrc0J5SGVpZ2h0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGhlaWdodHMpIHtcbiAgbGV0IGJsb2Nrc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgYmxvY2sgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tzQnlIZWlnaHQoaGVpZ2h0cykpIGJsb2Nrc0pzb24ucHVzaChibG9jay50b0pzb24oKSk7XG4gIHJldHVybiBibG9ja3NKc29uO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2Nrc0J5UmFuZ2UgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCkge1xuICBsZXQgYmxvY2tzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBibG9jayBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja3NCeVJhbmdlKHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpKSBibG9ja3NKc29uLnB1c2goYmxvY2sudG9Kc29uKCkpO1xuICByZXR1cm4gYmxvY2tzSnNvbjtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja3NCeVJhbmdlQ2h1bmtlZCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBtYXhDaHVua1NpemUpIHtcbiAgbGV0IGJsb2Nrc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgYmxvY2sgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tzQnlSYW5nZUNodW5rZWQoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgbWF4Q2h1bmtTaXplKSkgYmxvY2tzSnNvbi5wdXNoKGJsb2NrLnRvSnNvbigpKTtcbiAgcmV0dXJuIGJsb2Nrc0pzb247XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tIYXNoZXMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgYmxvY2tIYXNoZXMsIHN0YXJ0SGVpZ2h0KSB7XG4gIHRocm93IG5ldyBFcnJvcihcIndvcmtlci5nZXRCbG9ja0hhc2hlcyBub3QgaW1wbGVtZW50ZWRcIik7XG59XG5cbi8vIFRPRE86IGZhY3RvciBjb21tb24gY29kZSB3aXRoIHNlbGYuZ2V0VHhzKClcbnNlbGYuZGFlbW9uR2V0VHhzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIHR4SGFzaGVzLCBwcnVuZSkge1xuICBcbiAgLy8gZ2V0IHR4c1xuICBsZXQgdHhzID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0VHhzKHR4SGFzaGVzLCBwcnVuZSk7XG4gIFxuICAvLyBjb2xsZWN0IHVuaXF1ZSBibG9ja3MgdG8gcHJlc2VydmUgbW9kZWwgcmVsYXRpb25zaGlwcyBhcyB0cmVlcyAoYmFzZWQgb24gbW9uZXJvX3dhc21fYnJpZGdlLmNwcDo6Z2V0X3R4cylcbiAgbGV0IGJsb2NrcyA9IFtdO1xuICBsZXQgdW5jb25maXJtZWRCbG9jayA9IHVuZGVmaW5lZFxuICBsZXQgc2VlbkJsb2NrcyA9IG5ldyBTZXQoKTtcbiAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgaWYgKCF0eC5nZXRCbG9jaygpKSB7XG4gICAgICBpZiAoIXVuY29uZmlybWVkQmxvY2spIHVuY29uZmlybWVkQmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soKS5zZXRUeHMoW10pO1xuICAgICAgdHguc2V0QmxvY2sodW5jb25maXJtZWRCbG9jayk7XG4gICAgICB1bmNvbmZpcm1lZEJsb2NrLmdldFR4cygpLnB1c2godHgpO1xuICAgIH1cbiAgICBpZiAoIXNlZW5CbG9ja3MuaGFzKHR4LmdldEJsb2NrKCkpKSB7XG4gICAgICBzZWVuQmxvY2tzLmFkZCh0eC5nZXRCbG9jaygpKTtcbiAgICAgIGJsb2Nrcy5wdXNoKHR4LmdldEJsb2NrKCkpO1xuICAgIH1cbiAgfVxuICBcbiAgLy8gc2VyaWFsaXplIGJsb2NrcyB0byBqc29uXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYmxvY2tzLmxlbmd0aDsgaSsrKSBibG9ja3NbaV0gPSBibG9ja3NbaV0udG9Kc29uKCk7XG4gIHJldHVybiBibG9ja3M7XG59XG5cbnNlbGYuZGFlbW9uR2V0VHhIZXhlcyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCB0eEhhc2hlcywgcHJ1bmUpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldFR4SGV4ZXModHhIYXNoZXMsIHBydW5lKTtcbn1cblxuc2VsZi5kYWVtb25HZXRNaW5lclR4U3VtID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGhlaWdodCwgbnVtQmxvY2tzKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0TWluZXJUeFN1bShoZWlnaHQsIG51bUJsb2NrcykpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbkdldEZlZUVzdGltYXRlID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGdyYWNlQmxvY2tzKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0RmVlRXN0aW1hdGUoZ3JhY2VCbG9ja3MpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25TdWJtaXRUeEhleCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCB0eEhleCwgZG9Ob3RSZWxheSkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnN1Ym1pdFR4SGV4KHR4SGV4LCBkb05vdFJlbGF5KSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uUmVsYXlUeHNCeUhhc2ggPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgdHhIYXNoZXMpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnJlbGF5VHhzQnlIYXNoKHR4SGFzaGVzKTtcbn1cblxuc2VsZi5kYWVtb25HZXRUeFBvb2wgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICBsZXQgdHhzID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0VHhQb29sKCk7XG4gIGxldCBibG9jayA9IG5ldyBNb25lcm9CbG9jaygpLnNldFR4cyh0eHMpO1xuICBmb3IgKGxldCB0eCBvZiB0eHMpIHR4LnNldEJsb2NrKGJsb2NrKVxuICByZXR1cm4gYmxvY2sudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0VHhQb29sSGFzaGVzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldFR4UG9vbEhhc2hlcygpO1xufVxuXG4vL2FzeW5jIGdldFR4UG9vbEJhY2tsb2coKSB7XG4vLyAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuLy99XG5cbnNlbGYuZGFlbW9uR2V0VHhQb29sU3RhdHMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldFR4UG9vbFN0YXRzKCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbkZsdXNoVHhQb29sID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGhhc2hlcykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZmx1c2hUeFBvb2woaGFzaGVzKTtcbn1cblxuc2VsZi5kYWVtb25HZXRLZXlJbWFnZVNwZW50U3RhdHVzZXMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwga2V5SW1hZ2VzKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRLZXlJbWFnZVNwZW50U3RhdHVzZXMoa2V5SW1hZ2VzKTtcbn1cblxuLy9cbi8vYXN5bmMgZ2V0T3V0cHV0cyhvdXRwdXRzKSB7XG4vLyAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuLy99XG5cbnNlbGYuZGFlbW9uR2V0T3V0cHV0SGlzdG9ncmFtID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGFtb3VudHMsIG1pbkNvdW50LCBtYXhDb3VudCwgaXNVbmxvY2tlZCwgcmVjZW50Q3V0b2ZmKSB7XG4gIGxldCBlbnRyaWVzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBlbnRyeSBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRPdXRwdXRIaXN0b2dyYW0oYW1vdW50cywgbWluQ291bnQsIG1heENvdW50LCBpc1VubG9ja2VkLCByZWNlbnRDdXRvZmYpKSB7XG4gICAgZW50cmllc0pzb24ucHVzaChlbnRyeS50b0pzb24oKSk7XG4gIH1cbiAgcmV0dXJuIGVudHJpZXNKc29uO1xufVxuXG4vL1xuLy9hc3luYyBnZXRPdXRwdXREaXN0cmlidXRpb24oYW1vdW50cywgY3VtdWxhdGl2ZSwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCkge1xuLy8gIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbi8vfVxuXG5zZWxmLmRhZW1vbkdldEluZm8gPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEluZm8oKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0U3luY0luZm8gPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldFN5bmNJbmZvKCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbkdldEhhcmRGb3JrSW5mbyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0SGFyZEZvcmtJbmZvKCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbkdldEFsdENoYWlucyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIGxldCBhbHRDaGFpbnNKc29uID0gW107XG4gIGZvciAobGV0IGFsdENoYWluIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEFsdENoYWlucygpKSBhbHRDaGFpbnNKc29uLnB1c2goYWx0Q2hhaW4udG9Kc29uKCkpO1xuICByZXR1cm4gYWx0Q2hhaW5zSnNvbjtcbn1cblxuc2VsZi5kYWVtb25HZXRBbHRCbG9ja0hhc2hlcyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRBbHRCbG9ja0hhc2hlcygpO1xufVxuXG5zZWxmLmRhZW1vbkdldERvd25sb2FkTGltaXQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0RG93bmxvYWRMaW1pdCgpO1xufVxuXG5zZWxmLmRhZW1vblNldERvd25sb2FkTGltaXQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgbGltaXQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnNldERvd25sb2FkTGltaXQobGltaXQpO1xufVxuXG5zZWxmLmRhZW1vblJlc2V0RG93bmxvYWRMaW1pdCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5yZXNldERvd25sb2FkTGltaXQoKTtcbn1cblxuc2VsZi5kYWVtb25HZXRVcGxvYWRMaW1pdCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRVcGxvYWRMaW1pdCgpO1xufVxuXG5zZWxmLmRhZW1vblNldFVwbG9hZExpbWl0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGxpbWl0KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5zZXRVcGxvYWRMaW1pdChsaW1pdCk7XG59XG5cbnNlbGYuZGFlbW9uUmVzZXRVcGxvYWRMaW1pdCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5yZXNldFVwbG9hZExpbWl0KCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0UGVlcnMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICBsZXQgcGVlcnNKc29uID0gW107XG4gIGZvciAobGV0IHBlZXIgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0UGVlcnMoKSkgcGVlcnNKc29uLnB1c2gocGVlci50b0pzb24oKSk7XG4gIHJldHVybiBwZWVyc0pzb247XG59XG5cbnNlbGYuZGFlbW9uR2V0S25vd25QZWVycyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIGxldCBwZWVyc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgcGVlciBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRLbm93blBlZXJzKCkpIHBlZXJzSnNvbi5wdXNoKHBlZXIudG9Kc29uKCkpO1xuICByZXR1cm4gcGVlcnNKc29uO1xufVxuXG5zZWxmLmRhZW1vblNldE91dGdvaW5nUGVlckxpbWl0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGxpbWl0KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5zZXRPdXRnb2luZ1BlZXJMaW1pdChsaW1pdCk7XG59XG5cbnNlbGYuZGFlbW9uU2V0SW5jb21pbmdQZWVyTGltaXQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgbGltaXQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnNldEluY29taW5nUGVlckxpbWl0KGxpbWl0KTtcbn1cblxuc2VsZi5kYWVtb25HZXRQZWVyQmFucyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIGxldCBiYW5zSnNvbiA9IFtdO1xuICBmb3IgKGxldCBiYW4gb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0UGVlckJhbnMoKSkgYmFuc0pzb24ucHVzaChiYW4udG9Kc29uKCkpO1xuICByZXR1cm4gYmFuc0pzb247XG59XG5cbnNlbGYuZGFlbW9uU2V0UGVlckJhbnMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgYmFuc0pzb24pIHtcbiAgbGV0IGJhbnMgPSBbXTtcbiAgZm9yIChsZXQgYmFuSnNvbiBvZiBiYW5zSnNvbikgYmFucy5wdXNoKG5ldyBNb25lcm9CYW4oYmFuSnNvbikpO1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc2V0UGVlckJhbnMoYmFucyk7XG59XG5cbnNlbGYuZGFlbW9uU3RhcnRNaW5pbmcgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgYWRkcmVzcywgbnVtVGhyZWFkcywgaXNCYWNrZ3JvdW5kLCBpZ25vcmVCYXR0ZXJ5KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5zdGFydE1pbmluZyhhZGRyZXNzLCBudW1UaHJlYWRzLCBpc0JhY2tncm91bmQsIGlnbm9yZUJhdHRlcnkpO1xufVxuXG5zZWxmLmRhZW1vblN0b3BNaW5pbmcgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc3RvcE1pbmluZygpO1xufVxuXG5zZWxmLmRhZW1vbkdldE1pbmluZ1N0YXR1cyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0TWluaW5nU3RhdHVzKCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vblN1Ym1pdEJsb2NrcyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBibG9ja0Jsb2JzKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5zdWJtaXRCbG9ja3MoYmxvY2tCbG9icyk7XG59XG5cbnNlbGYuZGFlbW9uUHJ1bmVCbG9ja2NoYWluID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGNoZWNrKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0ucHJ1bmVCbG9ja2NoYWluKGNoZWNrKSkudG9Kc29uKCk7XG59XG5cbi8vYXN5bmMgY2hlY2tGb3JVcGRhdGUoKSB7XG4vLyAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuLy99XG4vL1xuLy9hc3luYyBkb3dubG9hZFVwZGF0ZShwYXRoKSB7XG4vLyAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuLy99XG5cbnNlbGYuZGFlbW9uU3RvcCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5zdG9wKCk7XG59XG5cbnNlbGYuZGFlbW9uV2FpdEZvck5leHRCbG9ja0hlYWRlciA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0ud2FpdEZvck5leHRCbG9ja0hlYWRlcigpKS50b0pzb24oKTtcbn1cblxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gV0FMTEVUIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5zZWxmLm9wZW5XYWxsZXREYXRhID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHBhdGgsIHBhc3N3b3JkLCBuZXR3b3JrVHlwZSwga2V5c0RhdGEsIGNhY2hlRGF0YSwgZGFlbW9uVXJpT3JDb25maWcsIHJlZ3Rlc3QpIHtcbiAgbGV0IGRhZW1vbkNvbm5lY3Rpb24gPSBkYWVtb25VcmlPckNvbmZpZyA/IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKGRhZW1vblVyaU9yQ29uZmlnKSA6IHVuZGVmaW5lZDtcbiAgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0gPSBhd2FpdCBNb25lcm9XYWxsZXRGdWxsLm9wZW5XYWxsZXQoe3BhdGg6IFwiXCIsIHBhc3N3b3JkOiBwYXNzd29yZCwgbmV0d29ya1R5cGU6IG5ldHdvcmtUeXBlLCBrZXlzRGF0YToga2V5c0RhdGEsIGNhY2hlRGF0YTogY2FjaGVEYXRhLCBzZXJ2ZXI6IGRhZW1vbkNvbm5lY3Rpb24sIHByb3h5VG9Xb3JrZXI6IGZhbHNlLCByZWd0ZXN0OiByZWd0ZXN0fSk7XG4gIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnNldEJyb3dzZXJNYWluUGF0aChwYXRoKTtcbn1cblxuc2VsZi5jcmVhdGVXYWxsZXRLZXlzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGNvbmZpZ0pzb24pIHtcbiAgbGV0IGNvbmZpZyA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcoY29uZmlnSnNvbik7XG4gIGNvbmZpZy5zZXRQcm94eVRvV29ya2VyKGZhbHNlKTtcbiAgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0gPSBhd2FpdCBNb25lcm9XYWxsZXRLZXlzLmNyZWF0ZVdhbGxldChjb25maWcpO1xufVxuXG5zZWxmLmNyZWF0ZVdhbGxldEZ1bGwgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgY29uZmlnSnNvbikge1xuICBsZXQgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyhjb25maWdKc29uKTtcbiAgbGV0IHBhdGggPSBjb25maWcuZ2V0UGF0aCgpO1xuICBjb25maWcuc2V0UGF0aChcIlwiKTtcbiAgY29uZmlnLnNldFByb3h5VG9Xb3JrZXIoZmFsc2UpO1xuICBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXSA9IGF3YWl0IE1vbmVyb1dhbGxldEZ1bGwuY3JlYXRlV2FsbGV0KGNvbmZpZyk7XG4gIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnNldEJyb3dzZXJNYWluUGF0aChwYXRoKTtcbn1cblxuc2VsZi5pc1ZpZXdPbmx5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmlzVmlld09ubHkoKTtcbn1cblxuc2VsZi5nZXROZXR3b3JrVHlwZSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXROZXR3b3JrVHlwZSgpO1xufVxuXG4vL1xuLy9hc3luYyBnZXRWZXJzaW9uKCkge1xuLy8gIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbi8vfVxuXG5zZWxmLmdldFNlZWQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0U2VlZCgpO1xufVxuXG5zZWxmLmdldFNlZWRMYW5ndWFnZSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRTZWVkTGFuZ3VhZ2UoKTtcbn1cblxuc2VsZi5nZXRTZWVkTGFuZ3VhZ2VzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFNlZWRMYW5ndWFnZXMoKTtcbn1cblxuc2VsZi5nZXRQcml2YXRlU3BlbmRLZXkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0UHJpdmF0ZVNwZW5kS2V5KCk7XG59XG5cbnNlbGYuZ2V0UHJpdmF0ZVZpZXdLZXkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0UHJpdmF0ZVZpZXdLZXkoKTtcbn1cblxuc2VsZi5nZXRQdWJsaWNWaWV3S2V5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFB1YmxpY1ZpZXdLZXkoKTtcbn1cblxuc2VsZi5nZXRQdWJsaWNTcGVuZEtleSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRQdWJsaWNTcGVuZEtleSgpO1xufVxuXG5zZWxmLmdldEFkZHJlc3MgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0QWRkcmVzcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTtcbn1cblxuc2VsZi5nZXRBZGRyZXNzSW5kZXggPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWRkcmVzcykge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldEFkZHJlc3NJbmRleChhZGRyZXNzKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuc2V0U3ViYWRkcmVzc0xhYmVsID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIGxhYmVsKSB7XG4gIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnNldFN1YmFkZHJlc3NMYWJlbChhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4LCBsYWJlbCk7XG59XG5cbnNlbGYuZ2V0SW50ZWdyYXRlZEFkZHJlc3MgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgc3RhbmRhcmRBZGRyZXNzLCBwYXltZW50SWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRJbnRlZ3JhdGVkQWRkcmVzcyhzdGFuZGFyZEFkZHJlc3MsIHBheW1lbnRJZCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRlY29kZUludGVncmF0ZWRBZGRyZXNzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGludGVncmF0ZWRBZGRyZXNzKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3MpKS50b0pzb24oKTtcbn1cblxuc2VsZi5zZXREYWVtb25Db25uZWN0aW9uID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGNvbmZpZywgaXNUcnVzdGVkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zZXREYWVtb25Db25uZWN0aW9uKGNvbmZpZyA/IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKE9iamVjdC5hc3NpZ24oY29uZmlnLCB7cHJveHlUb1dvcmtlcjogZmFsc2V9KSkgOiB1bmRlZmluZWQsIGlzVHJ1c3RlZCk7XG59XG5cbnNlbGYuZ2V0RGFlbW9uQ29ubmVjdGlvbiA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIGxldCBjb25uZWN0aW9uID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0RGFlbW9uQ29ubmVjdGlvbigpO1xuICByZXR1cm4gY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0Q29uZmlnKCkgOiB1bmRlZmluZWQ7XG59XG5cbnNlbGYuaXNEYWVtb25UcnVzdGVkID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmlzRGFlbW9uVHJ1c3RlZCgpO1xufVxuXG5zZWxmLmlzQ29ubmVjdGVkVG9EYWVtb24gPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaXNDb25uZWN0ZWRUb0RhZW1vbigpO1xufVxuXG5zZWxmLmdldFJlc3RvcmVIZWlnaHQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0UmVzdG9yZUhlaWdodCgpO1xufVxuXG5zZWxmLnNldFJlc3RvcmVIZWlnaHQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgcmVzdG9yZUhlaWdodCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2V0UmVzdG9yZUhlaWdodChyZXN0b3JlSGVpZ2h0KTtcbn1cblxuc2VsZi5nZXREYWVtb25IZWlnaHQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0RGFlbW9uSGVpZ2h0KCk7XG59XG5cbnNlbGYuZ2V0RGFlbW9uTWF4UGVlckhlaWdodCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXREYWVtb25NYXhQZWVySGVpZ2h0KClcbn1cblxuc2VsZi5nZXRIZWlnaHRCeURhdGUgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgeWVhciwgbW9udGgsIGRheSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0SGVpZ2h0QnlEYXRlKHllYXIsIG1vbnRoLCBkYXkpO1xufVxuXG5zZWxmLmlzRGFlbW9uU3luY2VkID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmlzRGFlbW9uU3luY2VkKCk7XG59XG5cbnNlbGYuZ2V0SGVpZ2h0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldEhlaWdodCgpO1xufVxuXG5zZWxmLmFkZExpc3RlbmVyID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGxpc3RlbmVySWQpIHtcbiAgXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBsaXN0ZW5lciB0byBicmlkZ2Ugbm90aWZpY2F0aW9ucyB0byBleHRlcm5hbCBsaXN0ZW5lcnMuXG4gICAqIFxuICAgKiBUT0RPOiBNb25lcm9XYWxsZXRMaXN0ZW5lciBpcyBub3QgZGVmaW5lZCB1bnRpbCBzY3JpcHRzIGltcG9ydGVkXG4gICAqIFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgY2xhc3MgV2FsbGV0V29ya2VySGVscGVyTGlzdGVuZXIgZXh0ZW5kcyBNb25lcm9XYWxsZXRMaXN0ZW5lciB7XG5cbiAgICBwcm90ZWN0ZWQgd2FsbGV0SWQ6IHN0cmluZztcbiAgICBwcm90ZWN0ZWQgaWQ6IHN0cmluZztcbiAgICBwcm90ZWN0ZWQgd29ya2VyOiBXb3JrZXI7XG4gICAgXG4gICAgY29uc3RydWN0b3Iod2FsbGV0SWQsIGlkLCB3b3JrZXIpIHtcbiAgICAgIHN1cGVyKCk7XG4gICAgICB0aGlzLndhbGxldElkID0gd2FsbGV0SWQ7XG4gICAgICB0aGlzLmlkID0gaWQ7XG4gICAgICB0aGlzLndvcmtlciA9IHdvcmtlcjtcbiAgICB9XG4gICAgXG4gICAgZ2V0SWQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5pZDtcbiAgICB9XG4gICAgXG4gICAgYXN5bmMgb25TeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSkge1xuICAgICAgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2UoW3RoaXMud2FsbGV0SWQsIFwib25TeW5jUHJvZ3Jlc3NfXCIgKyB0aGlzLmdldElkKCksIGhlaWdodCwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgcGVyY2VudERvbmUsIG1lc3NhZ2VdKTtcbiAgICB9XG5cbiAgICBhc3luYyBvbk5ld0Jsb2NrKGhlaWdodCkgeyBcbiAgICAgIHRoaXMud29ya2VyLnBvc3RNZXNzYWdlKFt0aGlzLndhbGxldElkLCBcIm9uTmV3QmxvY2tfXCIgKyB0aGlzLmdldElkKCksIGhlaWdodF0pO1xuICAgIH1cbiAgICBcbiAgICBhc3luYyBvbkJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlLCBuZXdVbmxvY2tlZEJhbGFuY2UpIHtcbiAgICAgIHRoaXMud29ya2VyLnBvc3RNZXNzYWdlKFt0aGlzLndhbGxldElkLCBcIm9uQmFsYW5jZXNDaGFuZ2VkX1wiICsgdGhpcy5nZXRJZCgpLCBuZXdCYWxhbmNlLnRvU3RyaW5nKCksIG5ld1VubG9ja2VkQmFsYW5jZS50b1N0cmluZygpXSk7XG4gICAgfVxuXG4gICBhc3luYyBvbk91dHB1dFJlY2VpdmVkKG91dHB1dCkge1xuICAgICAgbGV0IGJsb2NrID0gb3V0cHV0LmdldFR4KCkuZ2V0QmxvY2soKTtcbiAgICAgIGlmIChibG9jayA9PT0gdW5kZWZpbmVkKSBibG9jayA9IG5ldyBNb25lcm9CbG9jaygpLnNldFR4cyhbb3V0cHV0LmdldFR4KCldKTtcbiAgICAgIHRoaXMud29ya2VyLnBvc3RNZXNzYWdlKFt0aGlzLndhbGxldElkLCBcIm9uT3V0cHV0UmVjZWl2ZWRfXCIgKyB0aGlzLmdldElkKCksIGJsb2NrLnRvSnNvbigpXSk7ICAvLyBzZXJpYWxpemUgZnJvbSByb290IGJsb2NrXG4gICAgfVxuICAgIFxuICAgIGFzeW5jIG9uT3V0cHV0U3BlbnQob3V0cHV0KSB7XG4gICAgICBsZXQgYmxvY2sgPSBvdXRwdXQuZ2V0VHgoKS5nZXRCbG9jaygpO1xuICAgICAgaWYgKGJsb2NrID09PSB1bmRlZmluZWQpIGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0VHhzKFtvdXRwdXQuZ2V0VHgoKV0pO1xuICAgICAgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2UoW3RoaXMud2FsbGV0SWQsIFwib25PdXRwdXRTcGVudF9cIiArIHRoaXMuZ2V0SWQoKSwgYmxvY2sudG9Kc29uKCldKTsgICAgIC8vIHNlcmlhbGl6ZSBmcm9tIHJvb3QgYmxvY2tcbiAgICB9XG4gIH1cbiAgXG4gIGxldCBsaXN0ZW5lciA9IG5ldyBXYWxsZXRXb3JrZXJIZWxwZXJMaXN0ZW5lcih3YWxsZXRJZCwgbGlzdGVuZXJJZCwgc2VsZik7XG4gIGlmICghc2VsZi5saXN0ZW5lcnMpIHNlbGYubGlzdGVuZXJzID0gW107XG4gIHNlbGYubGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuICBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG59XG5cbnNlbGYucmVtb3ZlTGlzdGVuZXIgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbGlzdGVuZXJJZCkge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGYubGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHNlbGYubGlzdGVuZXJzW2ldLmdldElkKCkgIT09IGxpc3RlbmVySWQpIGNvbnRpbnVlO1xuICAgIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnJlbW92ZUxpc3RlbmVyKHNlbGYubGlzdGVuZXJzW2ldKTtcbiAgICBzZWxmLmxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkxpc3RlbmVyIGlzIG5vdCByZWdpc3RlcmVkIHdpdGggd2FsbGV0XCIpO1xufVxuXG5zZWxmLmlzU3luY2VkID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmlzU3luY2VkKCk7XG59XG5cbnNlbGYuc3luYyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBzdGFydEhlaWdodCwgYWxsb3dDb25jdXJyZW50Q2FsbHMpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zeW5jKHVuZGVmaW5lZCwgc3RhcnRIZWlnaHQsIGFsbG93Q29uY3VycmVudENhbGxzKSk7XG59XG5cbnNlbGYuc3RhcnRTeW5jaW5nID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHN5bmNQZXJpb2RJbk1zKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zdGFydFN5bmNpbmcoc3luY1BlcmlvZEluTXMpO1xufVxuXG5zZWxmLnN0b3BTeW5jaW5nID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN0b3BTeW5jaW5nKCk7XG59XG5cbnNlbGYuc2NhblR4cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eEhhc2hlcykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2NhblR4cyh0eEhhc2hlcyk7XG59XG5cbnNlbGYucmVzY2FuU3BlbnQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0ucmVzY2FuU3BlbnQoKTtcbn1cblxuc2VsZi5yZXNjYW5CbG9ja2NoYWluID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnJlc2NhbkJsb2NrY2hhaW4oKTtcbn1cblxuc2VsZi5nZXRCYWxhbmNlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRCYWxhbmNlKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpKS50b1N0cmluZygpO1xufVxuXG5zZWxmLmdldFVubG9ja2VkQmFsYW5jZSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0VW5sb2NrZWRCYWxhbmNlKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpKS50b1N0cmluZygpO1xufVxuXG5zZWxmLmdldEFjY291bnRzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGluY2x1ZGVTdWJhZGRyZXNzZXMsIHRhZykge1xuICBsZXQgYWNjb3VudEpzb25zID0gW107XG4gIGZvciAobGV0IGFjY291bnQgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0QWNjb3VudHMoaW5jbHVkZVN1YmFkZHJlc3NlcywgdGFnKSkgYWNjb3VudEpzb25zLnB1c2goYWNjb3VudC50b0pzb24oKSk7XG4gIHJldHVybiBhY2NvdW50SnNvbnM7XG59XG5cbnNlbGYuZ2V0QWNjb3VudCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SWR4LCBpbmNsdWRlU3ViYWRkcmVzc2VzKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0QWNjb3VudChhY2NvdW50SWR4LCBpbmNsdWRlU3ViYWRkcmVzc2VzKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuY3JlYXRlQWNjb3VudCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBsYWJlbCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmNyZWF0ZUFjY291bnQobGFiZWwpKS50b0pzb24oKTtcbn1cblxuc2VsZi5nZXRTdWJhZGRyZXNzZXMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0luZGljZXMpIHtcbiAgbGV0IHN1YmFkZHJlc3NKc29ucyA9IFtdO1xuICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSW5kaWNlcykpIHN1YmFkZHJlc3NKc29ucy5wdXNoKHN1YmFkZHJlc3MudG9Kc29uKCkpO1xuICByZXR1cm4gc3ViYWRkcmVzc0pzb25zO1xufVxuXG5zZWxmLmNyZWF0ZVN1YmFkZHJlc3MgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWNjb3VudElkeCwgbGFiZWwpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jcmVhdGVTdWJhZGRyZXNzKGFjY291bnRJZHgsIGxhYmVsKSkudG9Kc29uKCk7XG59XG5cbi8vIFRPRE86IGVhc2llciBvciBtb3JlIGVmZmljaWVudCB3YXkgdGhhbiBzZXJpYWxpemluZyBmcm9tIHJvb3QgYmxvY2tzP1xuc2VsZi5nZXRUeHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYmxvY2tKc29uUXVlcnkpIHtcbiAgXG4gIC8vIGRlc2VyaWFsaXplIHF1ZXJ5IHdoaWNoIGlzIGpzb24gc3RyaW5nIHJvb3RlZCBhdCBibG9ja1xuICBsZXQgcXVlcnkgPSBuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uUXVlcnksIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFhfUVVFUlkpLmdldFR4cygpWzBdO1xuICBcbiAgLy8gZ2V0IHR4c1xuICBsZXQgdHhzID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0VHhzKHF1ZXJ5KTtcbiAgXG4gIC8vIGNvbGxlY3QgdW5pcXVlIGJsb2NrcyB0byBwcmVzZXJ2ZSBtb2RlbCByZWxhdGlvbnNoaXBzIGFzIHRyZWVzIChiYXNlZCBvbiBtb25lcm9fd2FzbV9icmlkZ2UuY3BwOjpnZXRfdHhzKVxuICBsZXQgc2VlbkJsb2NrcyA9IG5ldyBTZXQoKTtcbiAgbGV0IHVuY29uZmlybWVkQmxvY2sgPSB1bmRlZmluZWQ7XG4gIGxldCBibG9ja3MgPSBbXTtcbiAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgaWYgKCF0eC5nZXRCbG9jaygpKSB7XG4gICAgICBpZiAoIXVuY29uZmlybWVkQmxvY2spIHVuY29uZmlybWVkQmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soKS5zZXRUeHMoW10pO1xuICAgICAgdHguc2V0QmxvY2sodW5jb25maXJtZWRCbG9jayk7XG4gICAgICB1bmNvbmZpcm1lZEJsb2NrLmdldFR4cygpLnB1c2godHgpO1xuICAgIH1cbiAgICBpZiAoIXNlZW5CbG9ja3MuaGFzKHR4LmdldEJsb2NrKCkpKSB7XG4gICAgICBzZWVuQmxvY2tzLmFkZCh0eC5nZXRCbG9jaygpKTtcbiAgICAgIGJsb2Nrcy5wdXNoKHR4LmdldEJsb2NrKCkpO1xuICAgIH1cbiAgfVxuICBcbiAgLy8gc2VyaWFsaXplIGJsb2NrcyB0byBqc29uXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYmxvY2tzLmxlbmd0aDsgaSsrKSBibG9ja3NbaV0gPSBibG9ja3NbaV0udG9Kc29uKCk7XG4gIHJldHVybiB7YmxvY2tzOiBibG9ja3N9O1xufVxuXG5zZWxmLmdldFRyYW5zZmVycyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBibG9ja0pzb25RdWVyeSkge1xuICBcbiAgLy8gZGVzZXJpYWxpemUgcXVlcnkgd2hpY2ggaXMganNvbiBzdHJpbmcgcm9vdGVkIGF0IGJsb2NrXG4gIGxldCBxdWVyeSA9IChuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uUXVlcnksIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFhfUVVFUlkpLmdldFR4cygpWzBdIGFzIE1vbmVyb1R4UXVlcnkpLmdldFRyYW5zZmVyUXVlcnkoKTtcbiAgXG4gIC8vIGdldCB0cmFuc2ZlcnNcbiAgbGV0IHRyYW5zZmVycyA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFRyYW5zZmVycyhxdWVyeSk7XG4gIFxuICAvLyBjb2xsZWN0IHVuaXF1ZSBibG9ja3MgdG8gcHJlc2VydmUgbW9kZWwgcmVsYXRpb25zaGlwcyBhcyB0cmVlXG4gIGxldCB1bmNvbmZpcm1lZEJsb2NrID0gdW5kZWZpbmVkO1xuICBsZXQgYmxvY2tzID0gW107XG4gIGxldCBzZWVuQmxvY2tzID0gbmV3IFNldCgpO1xuICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0cmFuc2ZlcnMpIHtcbiAgICBsZXQgdHggPSB0cmFuc2Zlci5nZXRUeCgpO1xuICAgIGlmICghdHguZ2V0QmxvY2soKSkge1xuICAgICAgaWYgKCF1bmNvbmZpcm1lZEJsb2NrKSB1bmNvbmZpcm1lZEJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0VHhzKFtdKTtcbiAgICAgIHR4LnNldEJsb2NrKHVuY29uZmlybWVkQmxvY2spO1xuICAgICAgdW5jb25maXJtZWRCbG9jay5nZXRUeHMoKS5wdXNoKHR4KTtcbiAgICB9XG4gICAgaWYgKCFzZWVuQmxvY2tzLmhhcyh0eC5nZXRCbG9jaygpKSkge1xuICAgICAgc2VlbkJsb2Nrcy5hZGQodHguZ2V0QmxvY2soKSk7XG4gICAgICBibG9ja3MucHVzaCh0eC5nZXRCbG9jaygpKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIHNlcmlhbGl6ZSBibG9ja3MgdG8ganNvblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGJsb2Nrcy5sZW5ndGg7IGkrKykgYmxvY2tzW2ldID0gYmxvY2tzW2ldLnRvSnNvbigpO1xuICByZXR1cm4gYmxvY2tzO1xufVxuXG5zZWxmLmdldE91dHB1dHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYmxvY2tKc29uUXVlcnkpIHtcblxuICAvLyBkZXNlcmlhbGl6ZSBxdWVyeSB3aGljaCBpcyBqc29uIHN0cmluZyByb290ZWQgYXQgYmxvY2tcbiAgbGV0IHF1ZXJ5ID0gKG5ldyBNb25lcm9CbG9jayhibG9ja0pzb25RdWVyeSwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWF9RVUVSWSkuZ2V0VHhzKClbMF0gYXMgTW9uZXJvVHhRdWVyeSkuZ2V0T3V0cHV0UXVlcnkoKTtcbiAgXG4gIC8vIGdldCBvdXRwdXRzXG4gIGxldCBvdXRwdXRzID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0T3V0cHV0cyhxdWVyeSk7XG4gIFxuICAvLyBjb2xsZWN0IHVuaXF1ZSBibG9ja3MgdG8gcHJlc2VydmUgbW9kZWwgcmVsYXRpb25zaGlwcyBhcyB0cmVlXG4gIGxldCB1bmNvbmZpcm1lZEJsb2NrID0gdW5kZWZpbmVkO1xuICBsZXQgYmxvY2tzID0gW107XG4gIGxldCBzZWVuQmxvY2tzID0gbmV3IFNldCgpO1xuICBmb3IgKGxldCBvdXRwdXQgb2Ygb3V0cHV0cykge1xuICAgIGxldCB0eCA9IG91dHB1dC5nZXRUeCgpO1xuICAgIGlmICghdHguZ2V0QmxvY2soKSkge1xuICAgICAgaWYgKCF1bmNvbmZpcm1lZEJsb2NrKSB1bmNvbmZpcm1lZEJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0VHhzKFtdKTtcbiAgICAgIHR4LnNldEJsb2NrKHVuY29uZmlybWVkQmxvY2spO1xuICAgICAgdW5jb25maXJtZWRCbG9jay5nZXRUeHMoKS5wdXNoKHR4KTtcbiAgICB9XG4gICAgaWYgKCFzZWVuQmxvY2tzLmhhcyh0eC5nZXRCbG9jaygpKSkge1xuICAgICAgc2VlbkJsb2Nrcy5hZGQodHguZ2V0QmxvY2soKSk7XG4gICAgICBibG9ja3MucHVzaCh0eC5nZXRCbG9jaygpKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIHNlcmlhbGl6ZSBibG9ja3MgdG8ganNvblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGJsb2Nrcy5sZW5ndGg7IGkrKykgYmxvY2tzW2ldID0gYmxvY2tzW2ldLnRvSnNvbigpO1xuICByZXR1cm4gYmxvY2tzO1xufVxuXG5zZWxmLmV4cG9ydE91dHB1dHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWxsKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5leHBvcnRPdXRwdXRzKGFsbCk7XG59XG5cbnNlbGYuaW1wb3J0T3V0cHV0cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBvdXRwdXRzSGV4KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pbXBvcnRPdXRwdXRzKG91dHB1dHNIZXgpO1xufVxuXG5zZWxmLmdldEtleUltYWdlcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhbGwpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5leHBvcnRLZXlJbWFnZXMoYWxsKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuaW1wb3J0S2V5SW1hZ2VzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGtleUltYWdlc0pzb24sIG9mZnNldCkge1xuICBsZXQga2V5SW1hZ2VzID0gW107XG4gIGZvciAobGV0IGtleUltYWdlSnNvbiBvZiBrZXlJbWFnZXNKc29uKSBrZXlJbWFnZXMucHVzaChuZXcgTW9uZXJvS2V5SW1hZ2Uoa2V5SW1hZ2VKc29uKSk7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaW1wb3J0S2V5SW1hZ2VzKGtleUltYWdlcywgb2Zmc2V0KSkudG9Kc29uKCk7XG59XG5cbi8vYXN5bmMgZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQoKSB7XG4vLyAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuLy99XG5cbnNlbGYuZnJlZXplT3V0cHV0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGtleUltYWdlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5mcmVlemVPdXRwdXQoa2V5SW1hZ2UpO1xufVxuXG5zZWxmLnRoYXdPdXRwdXQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwga2V5SW1hZ2UpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnRoYXdPdXRwdXQoa2V5SW1hZ2UpO1xufVxuXG5zZWxmLmlzT3V0cHV0RnJvemVuID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGtleUltYWdlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pc091dHB1dEZyb3plbihrZXlJbWFnZSk7XG59XG5cbnNlbGYuZ2V0RGVmYXVsdEZlZVByaW9yaXR5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldERlZmF1bHRGZWVQcmlvcml0eSgpO1xufVxuXG5zZWxmLmNyZWF0ZVR4cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBjb25maWcpIHtcbiAgaWYgKHR5cGVvZiBjb25maWcgPT09IFwib2JqZWN0XCIpIGNvbmZpZyA9IG5ldyBNb25lcm9UeENvbmZpZyhjb25maWcpO1xuICBsZXQgdHhzID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uY3JlYXRlVHhzKGNvbmZpZyk7XG4gIHJldHVybiB0eHNbMF0uZ2V0VHhTZXQoKS50b0pzb24oKTtcbn1cblxuc2VsZi5zd2VlcE91dHB1dCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBjb25maWcpIHtcbiAgaWYgKHR5cGVvZiBjb25maWcgPT09IFwib2JqZWN0XCIpIGNvbmZpZyA9IG5ldyBNb25lcm9UeENvbmZpZyhjb25maWcpO1xuICBsZXQgdHggPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zd2VlcE91dHB1dChjb25maWcpO1xuICByZXR1cm4gdHguZ2V0VHhTZXQoKS50b0pzb24oKTtcbn1cblxuc2VsZi5zd2VlcFVubG9ja2VkID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGNvbmZpZykge1xuICBpZiAodHlwZW9mIGNvbmZpZyA9PT0gXCJvYmplY3RcIikgY29uZmlnID0gbmV3IE1vbmVyb1R4Q29uZmlnKGNvbmZpZyk7XG4gIGxldCB0eHMgPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zd2VlcFVubG9ja2VkKGNvbmZpZyk7XG4gIGxldCB0eFNldHMgPSBbXTtcbiAgZm9yIChsZXQgdHggb2YgdHhzKSBpZiAoIUdlblV0aWxzLmFycmF5Q29udGFpbnModHhTZXRzLCB0eC5nZXRUeFNldCgpKSkgdHhTZXRzLnB1c2godHguZ2V0VHhTZXQoKSk7XG4gIGxldCB0eFNldHNKc29uID0gW107XG4gIGZvciAobGV0IHR4U2V0IG9mIHR4U2V0cykgdHhTZXRzSnNvbi5wdXNoKHR4U2V0LnRvSnNvbigpKTtcbiAgcmV0dXJuIHR4U2V0c0pzb247XG59XG5cbnNlbGYuc3dlZXBEdXN0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHJlbGF5KSB7XG4gIGxldCB0eHMgPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zd2VlcER1c3QocmVsYXkpO1xuICByZXR1cm4gdHhzLmxlbmd0aCA9PT0gMCA/IHt9IDogdHhzWzBdLmdldFR4U2V0KCkudG9Kc29uKCk7XG59XG5cbnNlbGYucmVsYXlUeHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdHhNZXRhZGF0YXMpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnJlbGF5VHhzKHR4TWV0YWRhdGFzKTtcbn1cblxuc2VsZi5kZXNjcmliZVR4U2V0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4U2V0SnNvbikge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmRlc2NyaWJlVHhTZXQobmV3IE1vbmVyb1R4U2V0KHR4U2V0SnNvbikpKS50b0pzb24oKTtcbn1cblxuc2VsZi5zaWduVHhzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHVuc2lnbmVkVHhIZXgpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnNpZ25UeHModW5zaWduZWRUeEhleCk7XG59XG5cbnNlbGYuc3VibWl0VHhzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHNpZ25lZFR4SGV4KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zdWJtaXRUeHMoc2lnbmVkVHhIZXgpO1xufVxuXG5zZWxmLnNpZ25NZXNzYWdlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG1lc3NhZ2UsIHNpZ25hdHVyZVR5cGUsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnNpZ25NZXNzYWdlKG1lc3NhZ2UsIHNpZ25hdHVyZVR5cGUsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpO1xufVxuXG5zZWxmLnZlcmlmeU1lc3NhZ2UgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbWVzc2FnZSwgYWRkcmVzcywgc2lnbmF0dXJlKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0udmVyaWZ5TWVzc2FnZShtZXNzYWdlLCBhZGRyZXNzLCBzaWduYXR1cmUpKS50b0pzb24oKTtcbn1cblxuc2VsZi5nZXRUeEtleSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eEhhc2gpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFR4S2V5KHR4SGFzaCk7XG59XG5cbnNlbGYuY2hlY2tUeEtleSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eEhhc2gsIHR4S2V5LCBhZGRyZXNzKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uY2hlY2tUeEtleSh0eEhhc2gsIHR4S2V5LCBhZGRyZXNzKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZ2V0VHhQcm9vZiA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFR4UHJvb2YodHhIYXNoLCBhZGRyZXNzLCBtZXNzYWdlKTtcbn1cblxuc2VsZi5jaGVja1R4UHJvb2YgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdHhIYXNoLCBhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jaGVja1R4UHJvb2YodHhIYXNoLCBhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUpKS50b0pzb24oKTtcbn1cblxuc2VsZi5nZXRTcGVuZFByb29mID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaCwgbWVzc2FnZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0U3BlbmRQcm9vZih0eEhhc2gsIG1lc3NhZ2UpO1xufVxuXG5zZWxmLmNoZWNrU3BlbmRQcm9vZiA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eEhhc2gsIG1lc3NhZ2UsIHNpZ25hdHVyZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uY2hlY2tTcGVuZFByb29mKHR4SGFzaCwgbWVzc2FnZSwgc2lnbmF0dXJlKTtcbn1cblxuc2VsZi5nZXRSZXNlcnZlUHJvb2ZXYWxsZXQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbWVzc2FnZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0UmVzZXJ2ZVByb29mV2FsbGV0KG1lc3NhZ2UpO1xufVxuXG5zZWxmLmdldFJlc2VydmVQcm9vZkFjY291bnQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWNjb3VudElkeCwgYW1vdW50U3RyLCBtZXNzYWdlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRSZXNlcnZlUHJvb2ZBY2NvdW50KGFjY291bnRJZHgsIGFtb3VudFN0ciwgbWVzc2FnZSk7XG59XG5cbnNlbGYuY2hlY2tSZXNlcnZlUHJvb2YgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uY2hlY2tSZXNlcnZlUHJvb2YoYWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZ2V0VHhOb3RlcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eEhhc2hlcykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0VHhOb3Rlcyh0eEhhc2hlcyk7XG59XG5cbnNlbGYuc2V0VHhOb3RlcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eEhhc2hlcywgdHhOb3Rlcykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2V0VHhOb3Rlcyh0eEhhc2hlcywgdHhOb3Rlcyk7XG59XG5cbnNlbGYuZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGVudHJ5SW5kaWNlcykge1xuICBsZXQgZW50cmllc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgZW50cnkgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzKGVudHJ5SW5kaWNlcykpIGVudHJpZXNKc29uLnB1c2goZW50cnkudG9Kc29uKCkpO1xuICByZXR1cm4gZW50cmllc0pzb247XG59XG5cbnNlbGYuYWRkQWRkcmVzc0Jvb2tFbnRyeSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhZGRyZXNzLCBkZXNjcmlwdGlvbikge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uYWRkQWRkcmVzc0Jvb2tFbnRyeShhZGRyZXNzLCBkZXNjcmlwdGlvbik7XG59XG5cbnNlbGYuZWRpdEFkZHJlc3NCb29rRW50cnkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgaW5kZXgsIHNldEFkZHJlc3MsIGFkZHJlc3MsIHNldERlc2NyaXB0aW9uLCBkZXNjcmlwdGlvbikge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZWRpdEFkZHJlc3NCb29rRW50cnkoaW5kZXgsIHNldEFkZHJlc3MsIGFkZHJlc3MsIHNldERlc2NyaXB0aW9uLCBkZXNjcmlwdGlvbik7XG59XG5cbnNlbGYuZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBpbmRleCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeShpbmRleCk7XG59XG5cbnNlbGYudGFnQWNjb3VudHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdGFnLCBhY2NvdW50SW5kaWNlcykge1xuICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG59XG5cbnNlbGYudW50YWdBY2NvdW50cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SW5kaWNlcykge1xuICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG59XG5cbnNlbGYuZ2V0QWNjb3VudFRhZ3MgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG59XG5cbnNlbGYuc2V0QWNjb3VudFRhZ0xhYmVsID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHRhZywgbGFiZWwpIHtcbiAgdGhyb3cgbmV3IEVycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xufVxuXG5zZWxmLmdldFBheW1lbnRVcmkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgY29uZmlnSnNvbikge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0UGF5bWVudFVyaShuZXcgTW9uZXJvVHhDb25maWcoY29uZmlnSnNvbikpO1xufVxuXG5zZWxmLnBhcnNlUGF5bWVudFVyaSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB1cmkpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5wYXJzZVBheW1lbnRVcmkodXJpKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZ2V0QXR0cmlidXRlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGtleSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0QXR0cmlidXRlKGtleSk7XG59XG5cbnNlbGYuc2V0QXR0cmlidXRlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGtleSwgdmFsdWUpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnNldEF0dHJpYnV0ZShrZXksIHZhbHVlKTtcbn1cblxuc2VsZi5zdGFydE1pbmluZyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBudW1UaHJlYWRzLCBiYWNrZ3JvdW5kTWluaW5nLCBpZ25vcmVCYXR0ZXJ5KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zdGFydE1pbmluZyhudW1UaHJlYWRzLCBiYWNrZ3JvdW5kTWluaW5nLCBpZ25vcmVCYXR0ZXJ5KTtcbn1cblxuc2VsZi5zdG9wTWluaW5nID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN0b3BNaW5pbmcoKTtcbn1cblxuc2VsZi5pc011bHRpc2lnSW1wb3J0TmVlZGVkID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmlzTXVsdGlzaWdJbXBvcnROZWVkZWQoKTtcbn1cblxuc2VsZi5pc011bHRpc2lnID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmlzTXVsdGlzaWcoKTtcbn1cblxuc2VsZi5nZXRNdWx0aXNpZ0luZm8gPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldE11bHRpc2lnSW5mbygpKS50b0pzb24oKTtcbn1cblxuc2VsZi5wcmVwYXJlTXVsdGlzaWcgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0ucHJlcGFyZU11bHRpc2lnKCk7XG59XG5cbnNlbGYubWFrZU11bHRpc2lnID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG11bHRpc2lnSGV4ZXMsIHRocmVzaG9sZCwgcGFzc3dvcmQpIHtcbiAgcmV0dXJuIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLm1ha2VNdWx0aXNpZyhtdWx0aXNpZ0hleGVzLCB0aHJlc2hvbGQsIHBhc3N3b3JkKTtcbn1cblxuc2VsZi5leGNoYW5nZU11bHRpc2lnS2V5cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBtdWx0aXNpZ0hleGVzLCBwYXNzd29yZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmV4Y2hhbmdlTXVsdGlzaWdLZXlzKG11bHRpc2lnSGV4ZXMsIHBhc3N3b3JkKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZXhwb3J0TXVsdGlzaWdIZXggPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZXhwb3J0TXVsdGlzaWdIZXgoKTtcbn1cblxuc2VsZi5pbXBvcnRNdWx0aXNpZ0hleCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBtdWx0aXNpZ0hleGVzLCByZWZyZXNoQWZ0ZXJJbXBvcnQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmltcG9ydE11bHRpc2lnSGV4KG11bHRpc2lnSGV4ZXMsIHJlZnJlc2hBZnRlckltcG9ydCk7XG59XG5cbnNlbGYuc2lnbk11bHRpc2lnVHhIZXggPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbXVsdGlzaWdUeEhleCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnNpZ25NdWx0aXNpZ1R4SGV4KG11bHRpc2lnVHhIZXgpKS50b0pzb24oKTtcbn1cblxuc2VsZi5zdWJtaXRNdWx0aXNpZ1R4SGV4ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHNpZ25lZE11bHRpc2lnVHhIZXgpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN1Ym1pdE11bHRpc2lnVHhIZXgoc2lnbmVkTXVsdGlzaWdUeEhleCk7XG59XG5cbnNlbGYuZ2V0RGF0YSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXREYXRhKCk7XG59XG5cbnNlbGYuY2hhbmdlUGFzc3dvcmQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgb2xkUGFzc3dvcmQsIG5ld1Bhc3N3b3JkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jaGFuZ2VQYXNzd29yZChvbGRQYXNzd29yZCwgbmV3UGFzc3dvcmQpO1xufVxuXG5zZWxmLmlzQ2xvc2VkID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuICFzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXSB8fCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pc0Nsb3NlZCgpO1xufVxuXG5zZWxmLnByZXBhcmVDbG9zZSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5wcmVwYXJlQ2xvc2UoKTtcbn1cblxuc2VsZi5nZXRDbG9zZURhdGEgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0Q2xvc2VEYXRhKCk7XG59XG5cbnNlbGYuY2xvc2UgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgc2F2ZSkge1xuICBpZiAoIXNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdKSByZXR1cm47XG4gIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmNsb3NlKHNhdmUpO1xuICBpZiAoc2VsZi5saXN0ZW5lcnMpIHNlbGYubGlzdGVuZXJzID0gc2VsZi5saXN0ZW5lcnMuZmlsdGVyKGxpc3RlbmVyID0+IGxpc3RlbmVyLndhbGxldElkICE9PSB3YWxsZXRJZCk7XG4gIGRlbGV0ZSBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXTtcbn0iXSwibWFwcGluZ3MiOiJrR0FBQSxJQUFBQSxPQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxTQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxXQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRyxhQUFBLEdBQUFKLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSSxVQUFBLEdBQUFMLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSyxZQUFBLEdBQUFOLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTSxtQkFBQSxHQUFBUCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQU8scUJBQUEsR0FBQVIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFRLGdCQUFBLEdBQUFULHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBUyxZQUFBLEdBQUFWLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBVSxlQUFBLEdBQUFY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