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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfSHR0cENsaWVudCIsIl9MaWJyYXJ5VXRpbHMiLCJfTW9uZXJvQmFuIiwiX01vbmVyb0Jsb2NrIiwiX01vbmVyb0RhZW1vbkNvbmZpZyIsIl9Nb25lcm9EYWVtb25MaXN0ZW5lciIsIl9Nb25lcm9EYWVtb25ScGMiLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvS2V5SW1hZ2UiLCJfTW9uZXJvUnBjQ29ubmVjdGlvbiIsIl9Nb25lcm9UeENvbmZpZyIsIl9Nb25lcm9UeFNldCIsIl9Nb25lcm9VdGlscyIsIl9Nb25lcm9XYWxsZXRDb25maWciLCJfTW9uZXJvV2FsbGV0TGlzdGVuZXIiLCJfTW9uZXJvV2FsbGV0S2V5cyIsIl9Nb25lcm9XYWxsZXRGdWxsIiwic2VsZiIsIkh0dHBDbGllbnQiLCJMaWJyYXJ5VXRpbHMiLCJHZW5VdGlscyIsIm9ubWVzc2FnZSIsImUiLCJpbml0T25lVGltZSIsIm9iamVjdElkIiwiZGF0YSIsImZuTmFtZSIsImNhbGxiYWNrSWQiLCJhc3NlcnQiLCJFcnJvciIsInNwbGljZSIsInBvc3RNZXNzYWdlIiwicmVzdWx0IiwiYXBwbHkiLCJlcnJvciIsInNlcmlhbGl6ZUVycm9yIiwiaXNJbml0aWFsaXplZCIsIldPUktFUl9PQkpFQ1RTIiwiTW9uZXJvVXRpbHMiLCJQUk9YWV9UT19XT1JLRVIiLCJodHRwUmVxdWVzdCIsIm9wdHMiLCJyZXF1ZXN0IiwiT2JqZWN0IiwiYXNzaWduIiwicHJveHlUb1dvcmtlciIsImVyciIsInN0YXR1c0NvZGUiLCJKU09OIiwic3RyaW5naWZ5Iiwic3RhdHVzTWVzc2FnZSIsIm1lc3NhZ2UiLCJzZXRMb2dMZXZlbCIsImxldmVsIiwiZ2V0V2FzbU1lbW9yeVVzZWQiLCJnZXRXYXNtTW9kdWxlIiwiSEVBUDgiLCJsZW5ndGgiLCJ1bmRlZmluZWQiLCJtb25lcm9VdGlsc0dldEludGVncmF0ZWRBZGRyZXNzIiwibmV0d29ya1R5cGUiLCJzdGFuZGFyZEFkZHJlc3MiLCJwYXltZW50SWQiLCJnZXRJbnRlZ3JhdGVkQWRkcmVzcyIsInRvSnNvbiIsIm1vbmVyb1V0aWxzVmFsaWRhdGVBZGRyZXNzIiwiYWRkcmVzcyIsInZhbGlkYXRlQWRkcmVzcyIsIm1vbmVyb1V0aWxzSnNvblRvQmluYXJ5IiwianNvbiIsImpzb25Ub0JpbmFyeSIsIm1vbmVyb1V0aWxzQmluYXJ5VG9Kc29uIiwidWludDhhcnIiLCJiaW5hcnlUb0pzb24iLCJtb25lcm9VdGlsc0JpbmFyeUJsb2Nrc1RvSnNvbiIsImJpbmFyeUJsb2Nrc1RvSnNvbiIsImRhZW1vbkFkZExpc3RlbmVyIiwiZGFlbW9uSWQiLCJsaXN0ZW5lcklkIiwibGlzdGVuZXIiLCJNb25lcm9EYWVtb25MaXN0ZW5lciIsIm9uQmxvY2tIZWFkZXIiLCJibG9ja0hlYWRlciIsImRhZW1vbkxpc3RlbmVycyIsImFkZExpc3RlbmVyIiwiZGFlbW9uUmVtb3ZlTGlzdGVuZXIiLCJNb25lcm9FcnJvciIsInJlbW92ZUxpc3RlbmVyIiwiY29ubmVjdERhZW1vblJwYyIsImNvbmZpZyIsIk1vbmVyb0RhZW1vblJwYyIsImNvbm5lY3RUb0RhZW1vblJwYyIsIk1vbmVyb0RhZW1vbkNvbmZpZyIsImRhZW1vbkdldFJwY0Nvbm5lY3Rpb24iLCJjb25uZWN0aW9uIiwiZ2V0UnBjQ29ubmVjdGlvbiIsImdldENvbmZpZyIsImRhZW1vbklzQ29ubmVjdGVkIiwiaXNDb25uZWN0ZWQiLCJkYWVtb25HZXRWZXJzaW9uIiwiZ2V0VmVyc2lvbiIsImRhZW1vbklzVHJ1c3RlZCIsImlzVHJ1c3RlZCIsImRhZW1vbkdldEhlaWdodCIsImdldEhlaWdodCIsImRhZW1vbkdldEJsb2NrSGFzaCIsImhlaWdodCIsImdldEJsb2NrSGFzaCIsImRhZW1vbkdldEJsb2NrVGVtcGxhdGUiLCJ3YWxsZXRBZGRyZXNzIiwicmVzZXJ2ZVNpemUiLCJnZXRCbG9ja1RlbXBsYXRlIiwiZGFlbW9uR2V0TGFzdEJsb2NrSGVhZGVyIiwiZ2V0TGFzdEJsb2NrSGVhZGVyIiwiZGFlbW9uR2V0QmxvY2tIZWFkZXJCeUhhc2giLCJoYXNoIiwiZ2V0QmxvY2tIZWFkZXJCeUhhc2giLCJkYWVtb25HZXRCbG9ja0hlYWRlckJ5SGVpZ2h0IiwiZ2V0QmxvY2tIZWFkZXJCeUhlaWdodCIsImRhZW1vbkdldEJsb2NrSGVhZGVyc0J5UmFuZ2UiLCJzdGFydEhlaWdodCIsImVuZEhlaWdodCIsImJsb2NrSGVhZGVyc0pzb24iLCJnZXRCbG9ja0hlYWRlcnNCeVJhbmdlIiwicHVzaCIsImRhZW1vbkdldEJsb2NrQnlIYXNoIiwiYmxvY2tIYXNoIiwiZ2V0QmxvY2tCeUhhc2giLCJkYWVtb25HZXRCbG9ja3NCeUhhc2giLCJibG9ja0hhc2hlcyIsInBydW5lIiwiYmxvY2tzSnNvbiIsImJsb2NrIiwiZ2V0QmxvY2tzQnlIYXNoIiwiZGFlbW9uR2V0QmxvY2tCeUhlaWdodCIsImdldEJsb2NrQnlIZWlnaHQiLCJkYWVtb25HZXRCbG9ja3NCeUhlaWdodCIsImhlaWdodHMiLCJnZXRCbG9ja3NCeUhlaWdodCIsImRhZW1vbkdldEJsb2Nrc0J5UmFuZ2UiLCJnZXRCbG9ja3NCeVJhbmdlIiwiZGFlbW9uR2V0QmxvY2tzQnlSYW5nZUNodW5rZWQiLCJtYXhDaHVua1NpemUiLCJnZXRCbG9ja3NCeVJhbmdlQ2h1bmtlZCIsImRhZW1vbkdldEJsb2NrSGFzaGVzIiwiZGFlbW9uR2V0VHhzIiwidHhIYXNoZXMiLCJ0eHMiLCJnZXRUeHMiLCJibG9ja3MiLCJ1bmNvbmZpcm1lZEJsb2NrIiwic2VlbkJsb2NrcyIsIlNldCIsInR4IiwiZ2V0QmxvY2siLCJNb25lcm9CbG9jayIsInNldFR4cyIsInNldEJsb2NrIiwiaGFzIiwiYWRkIiwiaSIsImRhZW1vbkdldFR4SGV4ZXMiLCJnZXRUeEhleGVzIiwiZGFlbW9uR2V0TWluZXJUeFN1bSIsIm51bUJsb2NrcyIsImdldE1pbmVyVHhTdW0iLCJkYWVtb25HZXRGZWVFc3RpbWF0ZSIsImdyYWNlQmxvY2tzIiwiZ2V0RmVlRXN0aW1hdGUiLCJkYWVtb25TdWJtaXRUeEhleCIsInR4SGV4IiwiZG9Ob3RSZWxheSIsInN1Ym1pdFR4SGV4IiwiZGFlbW9uUmVsYXlUeHNCeUhhc2giLCJyZWxheVR4c0J5SGFzaCIsImRhZW1vbkdldFR4UG9vbCIsImdldFR4UG9vbCIsImRhZW1vbkdldFR4UG9vbEhhc2hlcyIsImdldFR4UG9vbEhhc2hlcyIsImRhZW1vbkdldFR4UG9vbFN0YXRzIiwiZ2V0VHhQb29sU3RhdHMiLCJkYWVtb25GbHVzaFR4UG9vbCIsImhhc2hlcyIsImZsdXNoVHhQb29sIiwiZGFlbW9uR2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzIiwia2V5SW1hZ2VzIiwiZ2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzIiwiZGFlbW9uR2V0T3V0cHV0SGlzdG9ncmFtIiwiYW1vdW50cyIsIm1pbkNvdW50IiwibWF4Q291bnQiLCJpc1VubG9ja2VkIiwicmVjZW50Q3V0b2ZmIiwiZW50cmllc0pzb24iLCJlbnRyeSIsImdldE91dHB1dEhpc3RvZ3JhbSIsImRhZW1vbkdldEluZm8iLCJnZXRJbmZvIiwiZGFlbW9uR2V0U3luY0luZm8iLCJnZXRTeW5jSW5mbyIsImRhZW1vbkdldEhhcmRGb3JrSW5mbyIsImdldEhhcmRGb3JrSW5mbyIsImRhZW1vbkdldEFsdENoYWlucyIsImFsdENoYWluc0pzb24iLCJhbHRDaGFpbiIsImdldEFsdENoYWlucyIsImRhZW1vbkdldEFsdEJsb2NrSGFzaGVzIiwiZ2V0QWx0QmxvY2tIYXNoZXMiLCJkYWVtb25HZXREb3dubG9hZExpbWl0IiwiZ2V0RG93bmxvYWRMaW1pdCIsImRhZW1vblNldERvd25sb2FkTGltaXQiLCJsaW1pdCIsInNldERvd25sb2FkTGltaXQiLCJkYWVtb25SZXNldERvd25sb2FkTGltaXQiLCJyZXNldERvd25sb2FkTGltaXQiLCJkYWVtb25HZXRVcGxvYWRMaW1pdCIsImdldFVwbG9hZExpbWl0IiwiZGFlbW9uU2V0VXBsb2FkTGltaXQiLCJzZXRVcGxvYWRMaW1pdCIsImRhZW1vblJlc2V0VXBsb2FkTGltaXQiLCJyZXNldFVwbG9hZExpbWl0IiwiZGFlbW9uR2V0UGVlcnMiLCJwZWVyc0pzb24iLCJwZWVyIiwiZ2V0UGVlcnMiLCJkYWVtb25HZXRLbm93blBlZXJzIiwiZ2V0S25vd25QZWVycyIsImRhZW1vblNldE91dGdvaW5nUGVlckxpbWl0Iiwic2V0T3V0Z29pbmdQZWVyTGltaXQiLCJkYWVtb25TZXRJbmNvbWluZ1BlZXJMaW1pdCIsInNldEluY29taW5nUGVlckxpbWl0IiwiZGFlbW9uR2V0UGVlckJhbnMiLCJiYW5zSnNvbiIsImJhbiIsImdldFBlZXJCYW5zIiwiZGFlbW9uU2V0UGVlckJhbnMiLCJiYW5zIiwiYmFuSnNvbiIsIk1vbmVyb0JhbiIsInNldFBlZXJCYW5zIiwiZGFlbW9uU3RhcnRNaW5pbmciLCJudW1UaHJlYWRzIiwiaXNCYWNrZ3JvdW5kIiwiaWdub3JlQmF0dGVyeSIsInN0YXJ0TWluaW5nIiwiZGFlbW9uU3RvcE1pbmluZyIsInN0b3BNaW5pbmciLCJkYWVtb25HZXRNaW5pbmdTdGF0dXMiLCJnZXRNaW5pbmdTdGF0dXMiLCJkYWVtb25TdWJtaXRCbG9ja3MiLCJibG9ja0Jsb2JzIiwic3VibWl0QmxvY2tzIiwiZGFlbW9uUHJ1bmVCbG9ja2NoYWluIiwiY2hlY2siLCJwcnVuZUJsb2NrY2hhaW4iLCJkYWVtb25TdG9wIiwic3RvcCIsImRhZW1vbldhaXRGb3JOZXh0QmxvY2tIZWFkZXIiLCJ3YWl0Rm9yTmV4dEJsb2NrSGVhZGVyIiwib3BlbldhbGxldERhdGEiLCJ3YWxsZXRJZCIsInBhdGgiLCJwYXNzd29yZCIsImtleXNEYXRhIiwiY2FjaGVEYXRhIiwiZGFlbW9uVXJpT3JDb25maWciLCJkYWVtb25Db25uZWN0aW9uIiwiTW9uZXJvUnBjQ29ubmVjdGlvbiIsIk1vbmVyb1dhbGxldEZ1bGwiLCJvcGVuV2FsbGV0Iiwic2VydmVyIiwic2V0QnJvd3Nlck1haW5QYXRoIiwiY3JlYXRlV2FsbGV0S2V5cyIsImNvbmZpZ0pzb24iLCJNb25lcm9XYWxsZXRDb25maWciLCJzZXRQcm94eVRvV29ya2VyIiwiTW9uZXJvV2FsbGV0S2V5cyIsImNyZWF0ZVdhbGxldCIsImNyZWF0ZVdhbGxldEZ1bGwiLCJnZXRQYXRoIiwic2V0UGF0aCIsImlzVmlld09ubHkiLCJnZXROZXR3b3JrVHlwZSIsImdldFNlZWQiLCJnZXRTZWVkTGFuZ3VhZ2UiLCJnZXRTZWVkTGFuZ3VhZ2VzIiwiZ2V0UHJpdmF0ZVNwZW5kS2V5IiwiZ2V0UHJpdmF0ZVZpZXdLZXkiLCJnZXRQdWJsaWNWaWV3S2V5IiwiZ2V0UHVibGljU3BlbmRLZXkiLCJnZXRBZGRyZXNzIiwiYWNjb3VudElkeCIsInN1YmFkZHJlc3NJZHgiLCJnZXRBZGRyZXNzSW5kZXgiLCJzZXRTdWJhZGRyZXNzTGFiZWwiLCJsYWJlbCIsImRlY29kZUludGVncmF0ZWRBZGRyZXNzIiwiaW50ZWdyYXRlZEFkZHJlc3MiLCJzZXREYWVtb25Db25uZWN0aW9uIiwiZ2V0RGFlbW9uQ29ubmVjdGlvbiIsImlzQ29ubmVjdGVkVG9EYWVtb24iLCJnZXRSZXN0b3JlSGVpZ2h0Iiwic2V0UmVzdG9yZUhlaWdodCIsInJlc3RvcmVIZWlnaHQiLCJnZXREYWVtb25IZWlnaHQiLCJnZXREYWVtb25NYXhQZWVySGVpZ2h0IiwiZ2V0SGVpZ2h0QnlEYXRlIiwieWVhciIsIm1vbnRoIiwiZGF5IiwiaXNEYWVtb25TeW5jZWQiLCJXYWxsZXRXb3JrZXJIZWxwZXJMaXN0ZW5lciIsIk1vbmVyb1dhbGxldExpc3RlbmVyIiwiY29uc3RydWN0b3IiLCJpZCIsIndvcmtlciIsImdldElkIiwib25TeW5jUHJvZ3Jlc3MiLCJwZXJjZW50RG9uZSIsIm9uTmV3QmxvY2siLCJvbkJhbGFuY2VzQ2hhbmdlZCIsIm5ld0JhbGFuY2UiLCJuZXdVbmxvY2tlZEJhbGFuY2UiLCJ0b1N0cmluZyIsIm9uT3V0cHV0UmVjZWl2ZWQiLCJvdXRwdXQiLCJnZXRUeCIsIm9uT3V0cHV0U3BlbnQiLCJsaXN0ZW5lcnMiLCJpc1N5bmNlZCIsInN5bmMiLCJhbGxvd0NvbmN1cnJlbnRDYWxscyIsInN0YXJ0U3luY2luZyIsInN5bmNQZXJpb2RJbk1zIiwic3RvcFN5bmNpbmciLCJzY2FuVHhzIiwicmVzY2FuU3BlbnQiLCJyZXNjYW5CbG9ja2NoYWluIiwiZ2V0QmFsYW5jZSIsImdldFVubG9ja2VkQmFsYW5jZSIsImdldEFjY291bnRzIiwiaW5jbHVkZVN1YmFkZHJlc3NlcyIsInRhZyIsImFjY291bnRKc29ucyIsImFjY291bnQiLCJnZXRBY2NvdW50IiwiY3JlYXRlQWNjb3VudCIsImdldFN1YmFkZHJlc3NlcyIsInN1YmFkZHJlc3NJbmRpY2VzIiwic3ViYWRkcmVzc0pzb25zIiwic3ViYWRkcmVzcyIsImNyZWF0ZVN1YmFkZHJlc3MiLCJibG9ja0pzb25RdWVyeSIsInF1ZXJ5IiwiRGVzZXJpYWxpemF0aW9uVHlwZSIsIlRYX1FVRVJZIiwiZ2V0VHJhbnNmZXJzIiwiZ2V0VHJhbnNmZXJRdWVyeSIsInRyYW5zZmVycyIsInRyYW5zZmVyIiwiZ2V0T3V0cHV0cyIsImdldE91dHB1dFF1ZXJ5Iiwib3V0cHV0cyIsImV4cG9ydE91dHB1dHMiLCJhbGwiLCJpbXBvcnRPdXRwdXRzIiwib3V0cHV0c0hleCIsImdldEtleUltYWdlcyIsImtleUltYWdlc0pzb24iLCJrZXlJbWFnZSIsImV4cG9ydEtleUltYWdlcyIsImltcG9ydEtleUltYWdlcyIsImtleUltYWdlSnNvbiIsIk1vbmVyb0tleUltYWdlIiwiZnJlZXplT3V0cHV0IiwidGhhd091dHB1dCIsImlzT3V0cHV0RnJvemVuIiwiY3JlYXRlVHhzIiwiTW9uZXJvVHhDb25maWciLCJnZXRUeFNldCIsInN3ZWVwT3V0cHV0Iiwic3dlZXBVbmxvY2tlZCIsInR4U2V0cyIsImFycmF5Q29udGFpbnMiLCJ0eFNldHNKc29uIiwidHhTZXQiLCJzd2VlcER1c3QiLCJyZWxheSIsInJlbGF5VHhzIiwidHhNZXRhZGF0YXMiLCJkZXNjcmliZVR4U2V0IiwidHhTZXRKc29uIiwiTW9uZXJvVHhTZXQiLCJzaWduVHhzIiwidW5zaWduZWRUeEhleCIsInN1Ym1pdFR4cyIsInNpZ25lZFR4SGV4Iiwic2lnbk1lc3NhZ2UiLCJzaWduYXR1cmVUeXBlIiwidmVyaWZ5TWVzc2FnZSIsInNpZ25hdHVyZSIsImdldFR4S2V5IiwidHhIYXNoIiwiY2hlY2tUeEtleSIsInR4S2V5IiwiZ2V0VHhQcm9vZiIsImNoZWNrVHhQcm9vZiIsImdldFNwZW5kUHJvb2YiLCJjaGVja1NwZW5kUHJvb2YiLCJnZXRSZXNlcnZlUHJvb2ZXYWxsZXQiLCJnZXRSZXNlcnZlUHJvb2ZBY2NvdW50IiwiYW1vdW50U3RyIiwiY2hlY2tSZXNlcnZlUHJvb2YiLCJnZXRUeE5vdGVzIiwic2V0VHhOb3RlcyIsInR4Tm90ZXMiLCJnZXRBZGRyZXNzQm9va0VudHJpZXMiLCJlbnRyeUluZGljZXMiLCJhZGRBZGRyZXNzQm9va0VudHJ5IiwiZGVzY3JpcHRpb24iLCJlZGl0QWRkcmVzc0Jvb2tFbnRyeSIsImluZGV4Iiwic2V0QWRkcmVzcyIsInNldERlc2NyaXB0aW9uIiwiZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeSIsInRhZ0FjY291bnRzIiwiYWNjb3VudEluZGljZXMiLCJ1bnRhZ0FjY291bnRzIiwiZ2V0QWNjb3VudFRhZ3MiLCJzZXRBY2NvdW50VGFnTGFiZWwiLCJnZXRQYXltZW50VXJpIiwicGFyc2VQYXltZW50VXJpIiwidXJpIiwiZ2V0QXR0cmlidXRlIiwia2V5Iiwic2V0QXR0cmlidXRlIiwidmFsdWUiLCJiYWNrZ3JvdW5kTWluaW5nIiwiaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCIsImlzTXVsdGlzaWciLCJnZXRNdWx0aXNpZ0luZm8iLCJwcmVwYXJlTXVsdGlzaWciLCJtYWtlTXVsdGlzaWciLCJtdWx0aXNpZ0hleGVzIiwidGhyZXNob2xkIiwiZXhjaGFuZ2VNdWx0aXNpZ0tleXMiLCJleHBvcnRNdWx0aXNpZ0hleCIsImltcG9ydE11bHRpc2lnSGV4Iiwic2lnbk11bHRpc2lnVHhIZXgiLCJtdWx0aXNpZ1R4SGV4Iiwic3VibWl0TXVsdGlzaWdUeEhleCIsInNpZ25lZE11bHRpc2lnVHhIZXgiLCJnZXREYXRhIiwiY2hhbmdlUGFzc3dvcmQiLCJvbGRQYXNzd29yZCIsIm5ld1Bhc3N3b3JkIiwiaXNDbG9zZWQiLCJjbG9zZSIsInNhdmUiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy9jb21tb24vTW9uZXJvV2ViV29ya2VyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IEdlblV0aWxzIGZyb20gXCIuL0dlblV0aWxzXCI7XG5pbXBvcnQgSHR0cENsaWVudCBmcm9tIFwiLi9IdHRwQ2xpZW50XCI7XG5pbXBvcnQgTGlicmFyeVV0aWxzIGZyb20gXCIuL0xpYnJhcnlVdGlsc1wiO1xuaW1wb3J0IE1vbmVyb0JhbiBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0JhblwiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvQmxvY2tcIjtcbmltcG9ydCBNb25lcm9EYWVtb25Db25maWcgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9EYWVtb25Db25maWdcIjtcbmltcG9ydCBNb25lcm9EYWVtb25MaXN0ZW5lciBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0RhZW1vbkxpc3RlbmVyXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uUnBjIGZyb20gXCIuLi9kYWVtb24vTW9uZXJvRGFlbW9uUnBjXCI7XG5pbXBvcnQgTW9uZXJvRXJyb3IgZnJvbSBcIi4vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZSBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0tleUltYWdlXCI7XG5pbXBvcnQgTW9uZXJvUnBjQ29ubmVjdGlvbiBmcm9tIFwiLi9Nb25lcm9ScGNDb25uZWN0aW9uXCI7XG5pbXBvcnQgTW9uZXJvVHhDb25maWcgZnJvbSBcIi4uL3dhbGxldC9tb2RlbC9Nb25lcm9UeENvbmZpZ1wiO1xuaW1wb3J0IE1vbmVyb1R4UXVlcnkgZnJvbSBcIi4uL3dhbGxldC9tb2RlbC9Nb25lcm9UeFF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvVHhTZXQgZnJvbSBcIi4uL3dhbGxldC9tb2RlbC9Nb25lcm9UeFNldFwiO1xuaW1wb3J0IE1vbmVyb1V0aWxzIGZyb20gXCIuL01vbmVyb1V0aWxzXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0Q29uZmlnIGZyb20gXCIuLi93YWxsZXQvbW9kZWwvTW9uZXJvV2FsbGV0Q29uZmlnXCJcbmltcG9ydCBNb25lcm9XYWxsZXRMaXN0ZW5lciBmcm9tIFwiLi4vd2FsbGV0L21vZGVsL01vbmVyb1dhbGxldExpc3RlbmVyXCJcbmltcG9ydCB7TW9uZXJvV2FsbGV0S2V5c30gZnJvbSBcIi4uL3dhbGxldC9Nb25lcm9XYWxsZXRLZXlzXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0RnVsbCBmcm9tIFwiLi4vd2FsbGV0L01vbmVyb1dhbGxldEZ1bGxcIjtcblxuZGVjbGFyZSBjb25zdCBzZWxmOiBhbnk7XG5cbi8vIGV4cG9zZSBzb21lIG1vZHVsZXMgdG8gdGhlIHdvcmtlclxuc2VsZi5IdHRwQ2xpZW50ID0gSHR0cENsaWVudDtcbnNlbGYuTGlicmFyeVV0aWxzID0gTGlicmFyeVV0aWxzO1xuc2VsZi5HZW5VdGlscyA9IEdlblV0aWxzO1xuXG4vKipcbiAqIFdvcmtlciB0byBtYW5hZ2UgYSBkYWVtb24gYW5kIHdhc20gd2FsbGV0IG9mZiB0aGUgbWFpbiB0aHJlYWQgdXNpbmcgbWVzc2FnZXMuXG4gKiBcbiAqIFJlcXVpcmVkIG1lc3NhZ2UgZm9ybWF0OiBlLmRhdGFbMF0gPSBvYmplY3QgaWQsIGUuZGF0YVsxXSA9IGZ1bmN0aW9uIG5hbWUsIGUuZGF0YVsyK10gPSBmdW5jdGlvbiBhcmdzXG4gKlxuICogRm9yIGJyb3dzZXIgYXBwbGljYXRpb25zLCB0aGlzIGZpbGUgbXVzdCBiZSBicm93c2VyaWZpZWQgYW5kIHBsYWNlZCBpbiB0aGUgd2ViIGFwcCByb290LlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5zZWxmLm9ubWVzc2FnZSA9IGFzeW5jIGZ1bmN0aW9uKGUpIHtcbiAgXG4gIC8vIGluaXRpYWxpemUgb25lIHRpbWVcbiAgYXdhaXQgc2VsZi5pbml0T25lVGltZSgpO1xuICBcbiAgLy8gdmFsaWRhdGUgcGFyYW1zXG4gIGxldCBvYmplY3RJZCA9IGUuZGF0YVswXTtcbiAgbGV0IGZuTmFtZSA9IGUuZGF0YVsxXTtcbiAgbGV0IGNhbGxiYWNrSWQgPSBlLmRhdGFbMl07XG4gIGFzc2VydChmbk5hbWUsIFwiTXVzdCBwcm92aWRlIGZ1bmN0aW9uIG5hbWUgdG8gd29ya2VyXCIpO1xuICBhc3NlcnQoY2FsbGJhY2tJZCwgXCJNdXN0IHByb3ZpZGUgY2FsbGJhY2sgaWQgdG8gd29ya2VyXCIpO1xuICBpZiAoIXNlbGZbZm5OYW1lXSkgdGhyb3cgbmV3IEVycm9yKFwiTWV0aG9kICdcIiArIGZuTmFtZSArIFwiJyBpcyBub3QgcmVnaXN0ZXJlZCB3aXRoIHdvcmtlclwiKTtcbiAgZS5kYXRhLnNwbGljZSgxLCAyKTsgLy8gcmVtb3ZlIGZ1bmN0aW9uIG5hbWUgYW5kIGNhbGxiYWNrIGlkIHRvIGFwcGx5IGZ1bmN0aW9uIHdpdGggYXJndW1lbnRzXG4gIFxuICAvLyBleGVjdXRlIHdvcmtlciBmdW5jdGlvbiBhbmQgcG9zdCByZXN1bHQgdG8gY2FsbGJhY2tcbiAgdHJ5IHtcbiAgICBwb3N0TWVzc2FnZShbb2JqZWN0SWQsIGNhbGxiYWNrSWQsIHtyZXN1bHQ6IGF3YWl0IHNlbGZbZm5OYW1lXS5hcHBseShudWxsLCBlLmRhdGEpfV0pO1xuICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICBpZiAoIShlIGluc3RhbmNlb2YgRXJyb3IpKSBlID0gbmV3IEVycm9yKGUpO1xuICAgIHBvc3RNZXNzYWdlKFtvYmplY3RJZCwgY2FsbGJhY2tJZCwge2Vycm9yOiBMaWJyYXJ5VXRpbHMuc2VyaWFsaXplRXJyb3IoZSl9XSk7XG4gIH1cbn1cblxuc2VsZi5pbml0T25lVGltZSA9IGFzeW5jIGZ1bmN0aW9uKCkge1xuICBpZiAoIXNlbGYuaXNJbml0aWFsaXplZCkge1xuICAgIHNlbGYuV09SS0VSX09CSkVDVFMgPSB7fTtcbiAgICBzZWxmLmlzSW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIE1vbmVyb1V0aWxzLlBST1hZX1RPX1dPUktFUiA9IGZhbHNlO1xuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBTVEFUSUMgVVRJTElUSUVTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuc2VsZi5odHRwUmVxdWVzdCA9IGFzeW5jIGZ1bmN0aW9uKG9iamVjdElkLCBvcHRzKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGF3YWl0IEh0dHBDbGllbnQucmVxdWVzdChPYmplY3QuYXNzaWduKG9wdHMsIHtwcm94eVRvV29ya2VyOiBmYWxzZX0pKTsgIFxuICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgIHRocm93IGVyci5zdGF0dXNDb2RlID8gbmV3IEVycm9yKEpTT04uc3RyaW5naWZ5KHtzdGF0dXNDb2RlOiBlcnIuc3RhdHVzQ29kZSwgc3RhdHVzTWVzc2FnZTogZXJyLm1lc3NhZ2V9KSkgOiBlcnI7XG4gIH1cbn1cblxuc2VsZi5zZXRMb2dMZXZlbCA9IGFzeW5jIGZ1bmN0aW9uKG9iamVjdElkLCBsZXZlbCkge1xuICByZXR1cm4gTGlicmFyeVV0aWxzLnNldExvZ0xldmVsKGxldmVsKTtcbn1cblxuc2VsZi5nZXRXYXNtTWVtb3J5VXNlZCA9IGFzeW5jIGZ1bmN0aW9uKG9iamVjdElkKSB7XG4gIHJldHVybiBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpICYmIExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkuSEVBUDggPyBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLkhFQVA4Lmxlbmd0aCA6IHVuZGVmaW5lZDtcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gTU9ORVJPIFVUSUxTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5zZWxmLm1vbmVyb1V0aWxzR2V0SW50ZWdyYXRlZEFkZHJlc3MgPSBhc3luYyBmdW5jdGlvbihvYmplY3RJZCwgbmV0d29ya1R5cGUsIHN0YW5kYXJkQWRkcmVzcywgcGF5bWVudElkKSB7XG4gIHJldHVybiAoYXdhaXQgTW9uZXJvVXRpbHMuZ2V0SW50ZWdyYXRlZEFkZHJlc3MobmV0d29ya1R5cGUsIHN0YW5kYXJkQWRkcmVzcywgcGF5bWVudElkKSkudG9Kc29uKCk7XG59XG5cbnNlbGYubW9uZXJvVXRpbHNWYWxpZGF0ZUFkZHJlc3MgPSBhc3luYyBmdW5jdGlvbihvYmplY3RJZCwgYWRkcmVzcywgbmV0d29ya1R5cGUpIHtcbiAgcmV0dXJuIE1vbmVyb1V0aWxzLnZhbGlkYXRlQWRkcmVzcyhhZGRyZXNzLCBuZXR3b3JrVHlwZSk7XG59XG5cbnNlbGYubW9uZXJvVXRpbHNKc29uVG9CaW5hcnkgPSBhc3luYyBmdW5jdGlvbihvYmplY3RJZCwganNvbikge1xuICByZXR1cm4gTW9uZXJvVXRpbHMuanNvblRvQmluYXJ5KGpzb24pO1xufVxuXG5zZWxmLm1vbmVyb1V0aWxzQmluYXJ5VG9Kc29uID0gYXN5bmMgZnVuY3Rpb24ob2JqZWN0SWQsIHVpbnQ4YXJyKSB7XG4gIHJldHVybiBNb25lcm9VdGlscy5iaW5hcnlUb0pzb24odWludDhhcnIpO1xufVxuXG5zZWxmLm1vbmVyb1V0aWxzQmluYXJ5QmxvY2tzVG9Kc29uID0gYXN5bmMgZnVuY3Rpb24ob2JqZWN0SWQsIHVpbnQ4YXJyKSB7XG4gIHJldHVybiBNb25lcm9VdGlscy5iaW5hcnlCbG9ja3NUb0pzb24odWludDhhcnIpO1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIERBRU1PTiBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnNlbGYuZGFlbW9uQWRkTGlzdGVuZXIgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgbGlzdGVuZXJJZCkge1xuICBsZXQgbGlzdGVuZXIgPSBuZXcgY2xhc3MgZXh0ZW5kcyBNb25lcm9EYWVtb25MaXN0ZW5lciB7XG4gICAgYXN5bmMgb25CbG9ja0hlYWRlcihibG9ja0hlYWRlcikge1xuICAgICAgc2VsZi5wb3N0TWVzc2FnZShbZGFlbW9uSWQsIFwib25CbG9ja0hlYWRlcl9cIiArIGxpc3RlbmVySWQsIGJsb2NrSGVhZGVyLnRvSnNvbigpXSk7XG4gICAgfVxuICB9XG4gIGlmICghc2VsZi5kYWVtb25MaXN0ZW5lcnMpIHNlbGYuZGFlbW9uTGlzdGVuZXJzID0ge307XG4gIHNlbGYuZGFlbW9uTGlzdGVuZXJzW2xpc3RlbmVySWRdID0gbGlzdGVuZXI7XG4gIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbn1cblxuc2VsZi5kYWVtb25SZW1vdmVMaXN0ZW5lciA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBsaXN0ZW5lcklkKSB7XG4gIGlmICghc2VsZi5kYWVtb25MaXN0ZW5lcnNbbGlzdGVuZXJJZF0pIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vIGRhZW1vbiB3b3JrZXIgbGlzdGVuZXIgcmVnaXN0ZXJlZCB3aXRoIGlkOiBcIiArIGxpc3RlbmVySWQpO1xuICBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5yZW1vdmVMaXN0ZW5lcihzZWxmLmRhZW1vbkxpc3RlbmVyc1tsaXN0ZW5lcklkXSk7XG4gIGRlbGV0ZSBzZWxmLmRhZW1vbkxpc3RlbmVyc1tsaXN0ZW5lcklkXTtcbn1cblxuc2VsZi5jb25uZWN0RGFlbW9uUnBjID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGNvbmZpZykge1xuICBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXSA9IGF3YWl0IE1vbmVyb0RhZW1vblJwYy5jb25uZWN0VG9EYWVtb25ScGMobmV3IE1vbmVyb0RhZW1vbkNvbmZpZyhjb25maWcpKTtcbn1cblxuc2VsZi5kYWVtb25HZXRScGNDb25uZWN0aW9uID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgbGV0IGNvbm5lY3Rpb24gPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRScGNDb25uZWN0aW9uKCk7XG4gIHJldHVybiBjb25uZWN0aW9uID8gY29ubmVjdGlvbi5nZXRDb25maWcoKSA6IHVuZGVmaW5lZDtcbn1cblxuc2VsZi5kYWVtb25Jc0Nvbm5lY3RlZCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5pc0Nvbm5lY3RlZCgpO1xufVxuXG5zZWxmLmRhZW1vbkdldFZlcnNpb24gPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldFZlcnNpb24oKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uSXNUcnVzdGVkID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmlzVHJ1c3RlZCgpO1xufVxuXG5zZWxmLmRhZW1vbkdldEhlaWdodCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRIZWlnaHQoKTtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja0hhc2ggPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgaGVpZ2h0KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja0hhc2goaGVpZ2h0KTtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja1RlbXBsYXRlID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIHdhbGxldEFkZHJlc3MsIHJlc2VydmVTaXplKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tUZW1wbGF0ZSh3YWxsZXRBZGRyZXNzLCByZXNlcnZlU2l6ZSkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbkdldExhc3RCbG9ja0hlYWRlciA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0TGFzdEJsb2NrSGVhZGVyKCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2NrSGVhZGVyQnlIYXNoID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGhhc2gpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja0hlYWRlckJ5SGFzaChoYXNoKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tIZWFkZXJCeUhlaWdodCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBoZWlnaHQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja0hlYWRlckJ5SGVpZ2h0KGhlaWdodCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2NrSGVhZGVyc0J5UmFuZ2UgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCkge1xuICBsZXQgYmxvY2tIZWFkZXJzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBibG9ja0hlYWRlciBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja0hlYWRlcnNCeVJhbmdlKHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpKSBibG9ja0hlYWRlcnNKc29uLnB1c2goYmxvY2tIZWFkZXIudG9Kc29uKCkpO1xuICByZXR1cm4gYmxvY2tIZWFkZXJzSnNvbjtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja0J5SGFzaCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBibG9ja0hhc2gpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja0J5SGFzaChibG9ja0hhc2gpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja3NCeUhhc2ggPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgYmxvY2tIYXNoZXMsIHN0YXJ0SGVpZ2h0LCBwcnVuZSkge1xuICBsZXQgYmxvY2tzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBibG9jayBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja3NCeUhhc2goYmxvY2tIYXNoZXMsIHN0YXJ0SGVpZ2h0LCBwcnVuZSkpIGJsb2Nrc0pzb24ucHVzaChibG9jay50b0pzb24oKSk7XG4gIHJldHVybiBibG9ja3NKc29uO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2NrQnlIZWlnaHQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgaGVpZ2h0KSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tCeUhlaWdodChoZWlnaHQpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja3NCeUhlaWdodCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBoZWlnaHRzKSB7XG4gIGxldCBibG9ja3NKc29uID0gW107XG4gIGZvciAobGV0IGJsb2NrIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2Nrc0J5SGVpZ2h0KGhlaWdodHMpKSBibG9ja3NKc29uLnB1c2goYmxvY2sudG9Kc29uKCkpO1xuICByZXR1cm4gYmxvY2tzSnNvbjtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja3NCeVJhbmdlID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpIHtcbiAgbGV0IGJsb2Nrc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgYmxvY2sgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tzQnlSYW5nZShzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSkgYmxvY2tzSnNvbi5wdXNoKGJsb2NrLnRvSnNvbigpKTtcbiAgcmV0dXJuIGJsb2Nrc0pzb247XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tzQnlSYW5nZUNodW5rZWQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgbWF4Q2h1bmtTaXplKSB7XG4gIGxldCBibG9ja3NKc29uID0gW107XG4gIGZvciAobGV0IGJsb2NrIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2Nrc0J5UmFuZ2VDaHVua2VkKHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIG1heENodW5rU2l6ZSkpIGJsb2Nrc0pzb24ucHVzaChibG9jay50b0pzb24oKSk7XG4gIHJldHVybiBibG9ja3NKc29uO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2NrSGFzaGVzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGJsb2NrSGFzaGVzLCBzdGFydEhlaWdodCkge1xuICB0aHJvdyBuZXcgRXJyb3IoXCJ3b3JrZXIuZ2V0QmxvY2tIYXNoZXMgbm90IGltcGxlbWVudGVkXCIpO1xufVxuXG4vLyBUT0RPOiBmYWN0b3IgY29tbW9uIGNvZGUgd2l0aCBzZWxmLmdldFR4cygpXG5zZWxmLmRhZW1vbkdldFR4cyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCB0eEhhc2hlcywgcHJ1bmUpIHtcbiAgXG4gIC8vIGdldCB0eHNcbiAgbGV0IHR4cyA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldFR4cyh0eEhhc2hlcywgcHJ1bmUpO1xuICBcbiAgLy8gY29sbGVjdCB1bmlxdWUgYmxvY2tzIHRvIHByZXNlcnZlIG1vZGVsIHJlbGF0aW9uc2hpcHMgYXMgdHJlZXMgKGJhc2VkIG9uIG1vbmVyb193YXNtX2JyaWRnZS5jcHA6OmdldF90eHMpXG4gIGxldCBibG9ja3MgPSBbXTtcbiAgbGV0IHVuY29uZmlybWVkQmxvY2sgPSB1bmRlZmluZWRcbiAgbGV0IHNlZW5CbG9ja3MgPSBuZXcgU2V0KCk7XG4gIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgIGlmICghdHguZ2V0QmxvY2soKSkge1xuICAgICAgaWYgKCF1bmNvbmZpcm1lZEJsb2NrKSB1bmNvbmZpcm1lZEJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0VHhzKFtdKTtcbiAgICAgIHR4LnNldEJsb2NrKHVuY29uZmlybWVkQmxvY2spO1xuICAgICAgdW5jb25maXJtZWRCbG9jay5nZXRUeHMoKS5wdXNoKHR4KTtcbiAgICB9XG4gICAgaWYgKCFzZWVuQmxvY2tzLmhhcyh0eC5nZXRCbG9jaygpKSkge1xuICAgICAgc2VlbkJsb2Nrcy5hZGQodHguZ2V0QmxvY2soKSk7XG4gICAgICBibG9ja3MucHVzaCh0eC5nZXRCbG9jaygpKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIHNlcmlhbGl6ZSBibG9ja3MgdG8ganNvblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGJsb2Nrcy5sZW5ndGg7IGkrKykgYmxvY2tzW2ldID0gYmxvY2tzW2ldLnRvSnNvbigpO1xuICByZXR1cm4gYmxvY2tzO1xufVxuXG5zZWxmLmRhZW1vbkdldFR4SGV4ZXMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgdHhIYXNoZXMsIHBydW5lKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRUeEhleGVzKHR4SGFzaGVzLCBwcnVuZSk7XG59XG5cbnNlbGYuZGFlbW9uR2V0TWluZXJUeFN1bSA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBoZWlnaHQsIG51bUJsb2Nrcykge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldE1pbmVyVHhTdW0oaGVpZ2h0LCBudW1CbG9ja3MpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRGZWVFc3RpbWF0ZSA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBncmFjZUJsb2Nrcykge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEZlZUVzdGltYXRlKGdyYWNlQmxvY2tzKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uU3VibWl0VHhIZXggPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgdHhIZXgsIGRvTm90UmVsYXkpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5zdWJtaXRUeEhleCh0eEhleCwgZG9Ob3RSZWxheSkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vblJlbGF5VHhzQnlIYXNoID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIHR4SGFzaGVzKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5yZWxheVR4c0J5SGFzaCh0eEhhc2hlcyk7XG59XG5cbnNlbGYuZGFlbW9uR2V0VHhQb29sID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgbGV0IHR4cyA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldFR4UG9vbCgpO1xuICBsZXQgYmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soKS5zZXRUeHModHhzKTtcbiAgZm9yIChsZXQgdHggb2YgdHhzKSB0eC5zZXRCbG9jayhibG9jaylcbiAgcmV0dXJuIGJsb2NrLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbkdldFR4UG9vbEhhc2hlcyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRUeFBvb2xIYXNoZXMoKTtcbn1cblxuLy9hc3luYyBnZXRUeFBvb2xCYWNrbG9nKCkge1xuLy8gIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbi8vfVxuXG5zZWxmLmRhZW1vbkdldFR4UG9vbFN0YXRzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRUeFBvb2xTdGF0cygpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25GbHVzaFR4UG9vbCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBoYXNoZXMpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmZsdXNoVHhQb29sKGhhc2hlcyk7XG59XG5cbnNlbGYuZGFlbW9uR2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGtleUltYWdlcykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzKGtleUltYWdlcyk7XG59XG5cbi8vXG4vL2FzeW5jIGdldE91dHB1dHMob3V0cHV0cykge1xuLy8gIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbi8vfVxuXG5zZWxmLmRhZW1vbkdldE91dHB1dEhpc3RvZ3JhbSA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBhbW91bnRzLCBtaW5Db3VudCwgbWF4Q291bnQsIGlzVW5sb2NrZWQsIHJlY2VudEN1dG9mZikge1xuICBsZXQgZW50cmllc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgZW50cnkgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0T3V0cHV0SGlzdG9ncmFtKGFtb3VudHMsIG1pbkNvdW50LCBtYXhDb3VudCwgaXNVbmxvY2tlZCwgcmVjZW50Q3V0b2ZmKSkge1xuICAgIGVudHJpZXNKc29uLnB1c2goZW50cnkudG9Kc29uKCkpO1xuICB9XG4gIHJldHVybiBlbnRyaWVzSnNvbjtcbn1cblxuLy9cbi8vYXN5bmMgZ2V0T3V0cHV0RGlzdHJpYnV0aW9uKGFtb3VudHMsIGN1bXVsYXRpdmUsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpIHtcbi8vICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4vL31cblxuc2VsZi5kYWVtb25HZXRJbmZvID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRJbmZvKCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbkdldFN5bmNJbmZvID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRTeW5jSW5mbygpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRIYXJkRm9ya0luZm8gPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEhhcmRGb3JrSW5mbygpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRBbHRDaGFpbnMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICBsZXQgYWx0Q2hhaW5zSnNvbiA9IFtdO1xuICBmb3IgKGxldCBhbHRDaGFpbiBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRBbHRDaGFpbnMoKSkgYWx0Q2hhaW5zSnNvbi5wdXNoKGFsdENoYWluLnRvSnNvbigpKTtcbiAgcmV0dXJuIGFsdENoYWluc0pzb247XG59XG5cbnNlbGYuZGFlbW9uR2V0QWx0QmxvY2tIYXNoZXMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QWx0QmxvY2tIYXNoZXMoKTtcbn1cblxuc2VsZi5kYWVtb25HZXREb3dubG9hZExpbWl0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldERvd25sb2FkTGltaXQoKTtcbn1cblxuc2VsZi5kYWVtb25TZXREb3dubG9hZExpbWl0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGxpbWl0KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5zZXREb3dubG9hZExpbWl0KGxpbWl0KTtcbn1cblxuc2VsZi5kYWVtb25SZXNldERvd25sb2FkTGltaXQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0ucmVzZXREb3dubG9hZExpbWl0KCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0VXBsb2FkTGltaXQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0VXBsb2FkTGltaXQoKTtcbn1cblxuc2VsZi5kYWVtb25TZXRVcGxvYWRMaW1pdCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBsaW1pdCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc2V0VXBsb2FkTGltaXQobGltaXQpO1xufVxuXG5zZWxmLmRhZW1vblJlc2V0VXBsb2FkTGltaXQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0ucmVzZXRVcGxvYWRMaW1pdCgpO1xufVxuXG5zZWxmLmRhZW1vbkdldFBlZXJzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgbGV0IHBlZXJzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBwZWVyIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldFBlZXJzKCkpIHBlZXJzSnNvbi5wdXNoKHBlZXIudG9Kc29uKCkpO1xuICByZXR1cm4gcGVlcnNKc29uO1xufVxuXG5zZWxmLmRhZW1vbkdldEtub3duUGVlcnMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICBsZXQgcGVlcnNKc29uID0gW107XG4gIGZvciAobGV0IHBlZXIgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0S25vd25QZWVycygpKSBwZWVyc0pzb24ucHVzaChwZWVyLnRvSnNvbigpKTtcbiAgcmV0dXJuIHBlZXJzSnNvbjtcbn1cblxuc2VsZi5kYWVtb25TZXRPdXRnb2luZ1BlZXJMaW1pdCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBsaW1pdCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc2V0T3V0Z29pbmdQZWVyTGltaXQobGltaXQpO1xufVxuXG5zZWxmLmRhZW1vblNldEluY29taW5nUGVlckxpbWl0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGxpbWl0KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5zZXRJbmNvbWluZ1BlZXJMaW1pdChsaW1pdCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0UGVlckJhbnMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICBsZXQgYmFuc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgYmFuIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldFBlZXJCYW5zKCkpIGJhbnNKc29uLnB1c2goYmFuLnRvSnNvbigpKTtcbiAgcmV0dXJuIGJhbnNKc29uO1xufVxuXG5zZWxmLmRhZW1vblNldFBlZXJCYW5zID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGJhbnNKc29uKSB7XG4gIGxldCBiYW5zID0gW107XG4gIGZvciAobGV0IGJhbkpzb24gb2YgYmFuc0pzb24pIGJhbnMucHVzaChuZXcgTW9uZXJvQmFuKGJhbkpzb24pKTtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnNldFBlZXJCYW5zKGJhbnMpO1xufVxuXG5zZWxmLmRhZW1vblN0YXJ0TWluaW5nID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGFkZHJlc3MsIG51bVRocmVhZHMsIGlzQmFja2dyb3VuZCwgaWdub3JlQmF0dGVyeSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc3RhcnRNaW5pbmcoYWRkcmVzcywgbnVtVGhyZWFkcywgaXNCYWNrZ3JvdW5kLCBpZ25vcmVCYXR0ZXJ5KTtcbn1cblxuc2VsZi5kYWVtb25TdG9wTWluaW5nID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnN0b3BNaW5pbmcoKTtcbn1cblxuc2VsZi5kYWVtb25HZXRNaW5pbmdTdGF0dXMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldE1pbmluZ1N0YXR1cygpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25TdWJtaXRCbG9ja3MgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgYmxvY2tCbG9icykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc3VibWl0QmxvY2tzKGJsb2NrQmxvYnMpO1xufVxuXG5zZWxmLmRhZW1vblBydW5lQmxvY2tjaGFpbiA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBjaGVjaykge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnBydW5lQmxvY2tjaGFpbihjaGVjaykpLnRvSnNvbigpO1xufVxuXG4vL2FzeW5jIGNoZWNrRm9yVXBkYXRlKCkge1xuLy8gIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbi8vfVxuLy9cbi8vYXN5bmMgZG93bmxvYWRVcGRhdGUocGF0aCkge1xuLy8gIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbi8vfVxuXG5zZWxmLmRhZW1vblN0b3AgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc3RvcCgpO1xufVxuXG5zZWxmLmRhZW1vbldhaXRGb3JOZXh0QmxvY2tIZWFkZXIgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLndhaXRGb3JOZXh0QmxvY2tIZWFkZXIoKSkudG9Kc29uKCk7XG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFdBTExFVCBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuc2VsZi5vcGVuV2FsbGV0RGF0YSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBwYXRoLCBwYXNzd29yZCwgbmV0d29ya1R5cGUsIGtleXNEYXRhLCBjYWNoZURhdGEsIGRhZW1vblVyaU9yQ29uZmlnKSB7XG4gIGxldCBkYWVtb25Db25uZWN0aW9uID0gZGFlbW9uVXJpT3JDb25maWcgPyBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbihkYWVtb25VcmlPckNvbmZpZykgOiB1bmRlZmluZWQ7XG4gIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdID0gYXdhaXQgTW9uZXJvV2FsbGV0RnVsbC5vcGVuV2FsbGV0KHtwYXRoOiBcIlwiLCBwYXNzd29yZDogcGFzc3dvcmQsIG5ldHdvcmtUeXBlOiBuZXR3b3JrVHlwZSwga2V5c0RhdGE6IGtleXNEYXRhLCBjYWNoZURhdGE6IGNhY2hlRGF0YSwgc2VydmVyOiBkYWVtb25Db25uZWN0aW9uLCBwcm94eVRvV29ya2VyOiBmYWxzZX0pO1xuICBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zZXRCcm93c2VyTWFpblBhdGgocGF0aCk7XG59XG5cbnNlbGYuY3JlYXRlV2FsbGV0S2V5cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBjb25maWdKc29uKSB7XG4gIGxldCBjb25maWcgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKGNvbmZpZ0pzb24pO1xuICBjb25maWcuc2V0UHJveHlUb1dvcmtlcihmYWxzZSk7XG4gIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdID0gYXdhaXQgTW9uZXJvV2FsbGV0S2V5cy5jcmVhdGVXYWxsZXQoY29uZmlnKTtcbn1cblxuc2VsZi5jcmVhdGVXYWxsZXRGdWxsID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGNvbmZpZ0pzb24pIHtcbiAgbGV0IGNvbmZpZyA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcoY29uZmlnSnNvbik7XG4gIGxldCBwYXRoID0gY29uZmlnLmdldFBhdGgoKTtcbiAgY29uZmlnLnNldFBhdGgoXCJcIik7XG4gIGNvbmZpZy5zZXRQcm94eVRvV29ya2VyKGZhbHNlKTtcbiAgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0gPSBhd2FpdCBNb25lcm9XYWxsZXRGdWxsLmNyZWF0ZVdhbGxldChjb25maWcpO1xuICBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zZXRCcm93c2VyTWFpblBhdGgocGF0aCk7XG59XG5cbnNlbGYuaXNWaWV3T25seSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pc1ZpZXdPbmx5KCk7XG59XG5cbnNlbGYuZ2V0TmV0d29ya1R5cGUgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0TmV0d29ya1R5cGUoKTtcbn1cblxuLy9cbi8vYXN5bmMgZ2V0VmVyc2lvbigpIHtcbi8vICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4vL31cblxuc2VsZi5nZXRTZWVkID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFNlZWQoKTtcbn1cblxuc2VsZi5nZXRTZWVkTGFuZ3VhZ2UgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0U2VlZExhbmd1YWdlKCk7XG59XG5cbnNlbGYuZ2V0U2VlZExhbmd1YWdlcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRTZWVkTGFuZ3VhZ2VzKCk7XG59XG5cbnNlbGYuZ2V0UHJpdmF0ZVNwZW5kS2V5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFByaXZhdGVTcGVuZEtleSgpO1xufVxuXG5zZWxmLmdldFByaXZhdGVWaWV3S2V5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFByaXZhdGVWaWV3S2V5KCk7XG59XG5cbnNlbGYuZ2V0UHVibGljVmlld0tleSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRQdWJsaWNWaWV3S2V5KCk7XG59XG5cbnNlbGYuZ2V0UHVibGljU3BlbmRLZXkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0UHVibGljU3BlbmRLZXkoKTtcbn1cblxuc2VsZi5nZXRBZGRyZXNzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldEFkZHJlc3MoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG59XG5cbnNlbGYuZ2V0QWRkcmVzc0luZGV4ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFkZHJlc3MpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRBZGRyZXNzSW5kZXgoYWRkcmVzcykpLnRvSnNvbigpO1xufVxuXG5zZWxmLnNldFN1YmFkZHJlc3NMYWJlbCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4LCBsYWJlbCkge1xuICBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zZXRTdWJhZGRyZXNzTGFiZWwoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCwgbGFiZWwpO1xufVxuXG5zZWxmLmdldEludGVncmF0ZWRBZGRyZXNzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHN0YW5kYXJkQWRkcmVzcywgcGF5bWVudElkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0SW50ZWdyYXRlZEFkZHJlc3Moc3RhbmRhcmRBZGRyZXNzLCBwYXltZW50SWQpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBpbnRlZ3JhdGVkQWRkcmVzcykge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmRlY29kZUludGVncmF0ZWRBZGRyZXNzKGludGVncmF0ZWRBZGRyZXNzKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuc2V0RGFlbW9uQ29ubmVjdGlvbiA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBjb25maWcpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnNldERhZW1vbkNvbm5lY3Rpb24oY29uZmlnID8gbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24oT2JqZWN0LmFzc2lnbihjb25maWcsIHtwcm94eVRvV29ya2VyOiBmYWxzZX0pKSA6IHVuZGVmaW5lZCk7XG59XG5cbnNlbGYuZ2V0RGFlbW9uQ29ubmVjdGlvbiA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIGxldCBjb25uZWN0aW9uID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0RGFlbW9uQ29ubmVjdGlvbigpO1xuICByZXR1cm4gY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0Q29uZmlnKCkgOiB1bmRlZmluZWQ7XG59XG5cbnNlbGYuaXNDb25uZWN0ZWRUb0RhZW1vbiA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pc0Nvbm5lY3RlZFRvRGFlbW9uKCk7XG59XG5cbnNlbGYuZ2V0UmVzdG9yZUhlaWdodCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRSZXN0b3JlSGVpZ2h0KCk7XG59XG5cbnNlbGYuc2V0UmVzdG9yZUhlaWdodCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCByZXN0b3JlSGVpZ2h0KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zZXRSZXN0b3JlSGVpZ2h0KHJlc3RvcmVIZWlnaHQpO1xufVxuXG5zZWxmLmdldERhZW1vbkhlaWdodCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXREYWVtb25IZWlnaHQoKTtcbn1cblxuc2VsZi5nZXREYWVtb25NYXhQZWVySGVpZ2h0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldERhZW1vbk1heFBlZXJIZWlnaHQoKVxufVxuXG5zZWxmLmdldEhlaWdodEJ5RGF0ZSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB5ZWFyLCBtb250aCwgZGF5KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRIZWlnaHRCeURhdGUoeWVhciwgbW9udGgsIGRheSk7XG59XG5cbnNlbGYuaXNEYWVtb25TeW5jZWQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaXNEYWVtb25TeW5jZWQoKTtcbn1cblxuc2VsZi5nZXRIZWlnaHQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0SGVpZ2h0KCk7XG59XG5cbnNlbGYuYWRkTGlzdGVuZXIgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbGlzdGVuZXJJZCkge1xuICBcbiAgLyoqXG4gICAqIEludGVybmFsIGxpc3RlbmVyIHRvIGJyaWRnZSBub3RpZmljYXRpb25zIHRvIGV4dGVybmFsIGxpc3RlbmVycy5cbiAgICogXG4gICAqIFRPRE86IE1vbmVyb1dhbGxldExpc3RlbmVyIGlzIG5vdCBkZWZpbmVkIHVudGlsIHNjcmlwdHMgaW1wb3J0ZWRcbiAgICogXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBjbGFzcyBXYWxsZXRXb3JrZXJIZWxwZXJMaXN0ZW5lciBleHRlbmRzIE1vbmVyb1dhbGxldExpc3RlbmVyIHtcblxuICAgIHByb3RlY3RlZCB3YWxsZXRJZDogc3RyaW5nO1xuICAgIHByb3RlY3RlZCBpZDogc3RyaW5nO1xuICAgIHByb3RlY3RlZCB3b3JrZXI6IFdvcmtlcjtcbiAgICBcbiAgICBjb25zdHJ1Y3Rvcih3YWxsZXRJZCwgaWQsIHdvcmtlcikge1xuICAgICAgc3VwZXIoKTtcbiAgICAgIHRoaXMud2FsbGV0SWQgPSB3YWxsZXRJZDtcbiAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICAgIHRoaXMud29ya2VyID0gd29ya2VyO1xuICAgIH1cbiAgICBcbiAgICBnZXRJZCgpIHtcbiAgICAgIHJldHVybiB0aGlzLmlkO1xuICAgIH1cbiAgICBcbiAgICBhc3luYyBvblN5bmNQcm9ncmVzcyhoZWlnaHQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIHBlcmNlbnREb25lLCBtZXNzYWdlKSB7XG4gICAgICB0aGlzLndvcmtlci5wb3N0TWVzc2FnZShbdGhpcy53YWxsZXRJZCwgXCJvblN5bmNQcm9ncmVzc19cIiArIHRoaXMuZ2V0SWQoKSwgaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZV0pO1xuICAgIH1cblxuICAgIGFzeW5jIG9uTmV3QmxvY2soaGVpZ2h0KSB7IFxuICAgICAgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2UoW3RoaXMud2FsbGV0SWQsIFwib25OZXdCbG9ja19cIiArIHRoaXMuZ2V0SWQoKSwgaGVpZ2h0XSk7XG4gICAgfVxuICAgIFxuICAgIGFzeW5jIG9uQmFsYW5jZXNDaGFuZ2VkKG5ld0JhbGFuY2UsIG5ld1VubG9ja2VkQmFsYW5jZSkge1xuICAgICAgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2UoW3RoaXMud2FsbGV0SWQsIFwib25CYWxhbmNlc0NoYW5nZWRfXCIgKyB0aGlzLmdldElkKCksIG5ld0JhbGFuY2UudG9TdHJpbmcoKSwgbmV3VW5sb2NrZWRCYWxhbmNlLnRvU3RyaW5nKCldKTtcbiAgICB9XG5cbiAgIGFzeW5jIG9uT3V0cHV0UmVjZWl2ZWQob3V0cHV0KSB7XG4gICAgICBsZXQgYmxvY2sgPSBvdXRwdXQuZ2V0VHgoKS5nZXRCbG9jaygpO1xuICAgICAgaWYgKGJsb2NrID09PSB1bmRlZmluZWQpIGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0VHhzKFtvdXRwdXQuZ2V0VHgoKV0pO1xuICAgICAgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2UoW3RoaXMud2FsbGV0SWQsIFwib25PdXRwdXRSZWNlaXZlZF9cIiArIHRoaXMuZ2V0SWQoKSwgYmxvY2sudG9Kc29uKCldKTsgIC8vIHNlcmlhbGl6ZSBmcm9tIHJvb3QgYmxvY2tcbiAgICB9XG4gICAgXG4gICAgYXN5bmMgb25PdXRwdXRTcGVudChvdXRwdXQpIHtcbiAgICAgIGxldCBibG9jayA9IG91dHB1dC5nZXRUeCgpLmdldEJsb2NrKCk7XG4gICAgICBpZiAoYmxvY2sgPT09IHVuZGVmaW5lZCkgYmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soKS5zZXRUeHMoW291dHB1dC5nZXRUeCgpXSk7XG4gICAgICB0aGlzLndvcmtlci5wb3N0TWVzc2FnZShbdGhpcy53YWxsZXRJZCwgXCJvbk91dHB1dFNwZW50X1wiICsgdGhpcy5nZXRJZCgpLCBibG9jay50b0pzb24oKV0pOyAgICAgLy8gc2VyaWFsaXplIGZyb20gcm9vdCBibG9ja1xuICAgIH1cbiAgfVxuICBcbiAgbGV0IGxpc3RlbmVyID0gbmV3IFdhbGxldFdvcmtlckhlbHBlckxpc3RlbmVyKHdhbGxldElkLCBsaXN0ZW5lcklkLCBzZWxmKTtcbiAgaWYgKCFzZWxmLmxpc3RlbmVycykgc2VsZi5saXN0ZW5lcnMgPSBbXTtcbiAgc2VsZi5saXN0ZW5lcnMucHVzaChsaXN0ZW5lcik7XG4gIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbn1cblxuc2VsZi5yZW1vdmVMaXN0ZW5lciA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBsaXN0ZW5lcklkKSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZi5saXN0ZW5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoc2VsZi5saXN0ZW5lcnNbaV0uZ2V0SWQoKSAhPT0gbGlzdGVuZXJJZCkgY29udGludWU7XG4gICAgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0ucmVtb3ZlTGlzdGVuZXIoc2VsZi5saXN0ZW5lcnNbaV0pO1xuICAgIHNlbGYubGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICByZXR1cm47XG4gIH1cbiAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTGlzdGVuZXIgaXMgbm90IHJlZ2lzdGVyZWQgd2l0aCB3YWxsZXRcIik7XG59XG5cbnNlbGYuaXNTeW5jZWQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaXNTeW5jZWQoKTtcbn1cblxuc2VsZi5zeW5jID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHN0YXJ0SGVpZ2h0LCBhbGxvd0NvbmN1cnJlbnRDYWxscykge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN5bmModW5kZWZpbmVkLCBzdGFydEhlaWdodCwgYWxsb3dDb25jdXJyZW50Q2FsbHMpKTtcbn1cblxuc2VsZi5zdGFydFN5bmNpbmcgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgc3luY1BlcmlvZEluTXMpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN0YXJ0U3luY2luZyhzeW5jUGVyaW9kSW5Ncyk7XG59XG5cbnNlbGYuc3RvcFN5bmNpbmcgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc3RvcFN5bmNpbmcoKTtcbn1cblxuc2VsZi5zY2FuVHhzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaGVzKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zY2FuVHhzKHR4SGFzaGVzKTtcbn1cblxuc2VsZi5yZXNjYW5TcGVudCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5yZXNjYW5TcGVudCgpO1xufVxuXG5zZWxmLnJlc2NhbkJsb2NrY2hhaW4gPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0ucmVzY2FuQmxvY2tjaGFpbigpO1xufVxuXG5zZWxmLmdldEJhbGFuY2UgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldEJhbGFuY2UoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkpLnRvU3RyaW5nKCk7XG59XG5cbnNlbGYuZ2V0VW5sb2NrZWRCYWxhbmNlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRVbmxvY2tlZEJhbGFuY2UoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkpLnRvU3RyaW5nKCk7XG59XG5cbnNlbGYuZ2V0QWNjb3VudHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgaW5jbHVkZVN1YmFkZHJlc3NlcywgdGFnKSB7XG4gIGxldCBhY2NvdW50SnNvbnMgPSBbXTtcbiAgZm9yIChsZXQgYWNjb3VudCBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRBY2NvdW50cyhpbmNsdWRlU3ViYWRkcmVzc2VzLCB0YWcpKSBhY2NvdW50SnNvbnMucHVzaChhY2NvdW50LnRvSnNvbigpKTtcbiAgcmV0dXJuIGFjY291bnRKc29ucztcbn1cblxuc2VsZi5nZXRBY2NvdW50ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFjY291bnRJZHgsIGluY2x1ZGVTdWJhZGRyZXNzZXMpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRBY2NvdW50KGFjY291bnRJZHgsIGluY2x1ZGVTdWJhZGRyZXNzZXMpKS50b0pzb24oKTtcbn1cblxuc2VsZi5jcmVhdGVBY2NvdW50ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGxhYmVsKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uY3JlYXRlQWNjb3VudChsYWJlbCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmdldFN1YmFkZHJlc3NlcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSW5kaWNlcykge1xuICBsZXQgc3ViYWRkcmVzc0pzb25zID0gW107XG4gIGZvciAobGV0IHN1YmFkZHJlc3Mgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJbmRpY2VzKSkgc3ViYWRkcmVzc0pzb25zLnB1c2goc3ViYWRkcmVzcy50b0pzb24oKSk7XG4gIHJldHVybiBzdWJhZGRyZXNzSnNvbnM7XG59XG5cbnNlbGYuY3JlYXRlU3ViYWRkcmVzcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SWR4LCBsYWJlbCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmNyZWF0ZVN1YmFkZHJlc3MoYWNjb3VudElkeCwgbGFiZWwpKS50b0pzb24oKTtcbn1cblxuLy8gVE9ETzogZWFzaWVyIG9yIG1vcmUgZWZmaWNpZW50IHdheSB0aGFuIHNlcmlhbGl6aW5nIGZyb20gcm9vdCBibG9ja3M/XG5zZWxmLmdldFR4cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBibG9ja0pzb25RdWVyeSkge1xuICBcbiAgLy8gZGVzZXJpYWxpemUgcXVlcnkgd2hpY2ggaXMganNvbiBzdHJpbmcgcm9vdGVkIGF0IGJsb2NrXG4gIGxldCBxdWVyeSA9IG5ldyBNb25lcm9CbG9jayhibG9ja0pzb25RdWVyeSwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWF9RVUVSWSkuZ2V0VHhzKClbMF07XG4gIFxuICAvLyBnZXQgdHhzXG4gIGxldCB0eHMgPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRUeHMocXVlcnkpO1xuICBcbiAgLy8gY29sbGVjdCB1bmlxdWUgYmxvY2tzIHRvIHByZXNlcnZlIG1vZGVsIHJlbGF0aW9uc2hpcHMgYXMgdHJlZXMgKGJhc2VkIG9uIG1vbmVyb193YXNtX2JyaWRnZS5jcHA6OmdldF90eHMpXG4gIGxldCBzZWVuQmxvY2tzID0gbmV3IFNldCgpO1xuICBsZXQgdW5jb25maXJtZWRCbG9jayA9IHVuZGVmaW5lZDtcbiAgbGV0IGJsb2NrcyA9IFtdO1xuICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICBpZiAoIXR4LmdldEJsb2NrKCkpIHtcbiAgICAgIGlmICghdW5jb25maXJtZWRCbG9jaykgdW5jb25maXJtZWRCbG9jayA9IG5ldyBNb25lcm9CbG9jaygpLnNldFR4cyhbXSk7XG4gICAgICB0eC5zZXRCbG9jayh1bmNvbmZpcm1lZEJsb2NrKTtcbiAgICAgIHVuY29uZmlybWVkQmxvY2suZ2V0VHhzKCkucHVzaCh0eCk7XG4gICAgfVxuICAgIGlmICghc2VlbkJsb2Nrcy5oYXModHguZ2V0QmxvY2soKSkpIHtcbiAgICAgIHNlZW5CbG9ja3MuYWRkKHR4LmdldEJsb2NrKCkpO1xuICAgICAgYmxvY2tzLnB1c2godHguZ2V0QmxvY2soKSk7XG4gICAgfVxuICB9XG4gIFxuICAvLyBzZXJpYWxpemUgYmxvY2tzIHRvIGpzb25cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBibG9ja3MubGVuZ3RoOyBpKyspIGJsb2Nrc1tpXSA9IGJsb2Nrc1tpXS50b0pzb24oKTtcbiAgcmV0dXJuIHtibG9ja3M6IGJsb2Nrc307XG59XG5cbnNlbGYuZ2V0VHJhbnNmZXJzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGJsb2NrSnNvblF1ZXJ5KSB7XG4gIFxuICAvLyBkZXNlcmlhbGl6ZSBxdWVyeSB3aGljaCBpcyBqc29uIHN0cmluZyByb290ZWQgYXQgYmxvY2tcbiAgbGV0IHF1ZXJ5ID0gKG5ldyBNb25lcm9CbG9jayhibG9ja0pzb25RdWVyeSwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWF9RVUVSWSkuZ2V0VHhzKClbMF0gYXMgTW9uZXJvVHhRdWVyeSkuZ2V0VHJhbnNmZXJRdWVyeSgpO1xuICBcbiAgLy8gZ2V0IHRyYW5zZmVyc1xuICBsZXQgdHJhbnNmZXJzID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0VHJhbnNmZXJzKHF1ZXJ5KTtcbiAgXG4gIC8vIGNvbGxlY3QgdW5pcXVlIGJsb2NrcyB0byBwcmVzZXJ2ZSBtb2RlbCByZWxhdGlvbnNoaXBzIGFzIHRyZWVcbiAgbGV0IHVuY29uZmlybWVkQmxvY2sgPSB1bmRlZmluZWQ7XG4gIGxldCBibG9ja3MgPSBbXTtcbiAgbGV0IHNlZW5CbG9ja3MgPSBuZXcgU2V0KCk7XG4gIGZvciAobGV0IHRyYW5zZmVyIG9mIHRyYW5zZmVycykge1xuICAgIGxldCB0eCA9IHRyYW5zZmVyLmdldFR4KCk7XG4gICAgaWYgKCF0eC5nZXRCbG9jaygpKSB7XG4gICAgICBpZiAoIXVuY29uZmlybWVkQmxvY2spIHVuY29uZmlybWVkQmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soKS5zZXRUeHMoW10pO1xuICAgICAgdHguc2V0QmxvY2sodW5jb25maXJtZWRCbG9jayk7XG4gICAgICB1bmNvbmZpcm1lZEJsb2NrLmdldFR4cygpLnB1c2godHgpO1xuICAgIH1cbiAgICBpZiAoIXNlZW5CbG9ja3MuaGFzKHR4LmdldEJsb2NrKCkpKSB7XG4gICAgICBzZWVuQmxvY2tzLmFkZCh0eC5nZXRCbG9jaygpKTtcbiAgICAgIGJsb2Nrcy5wdXNoKHR4LmdldEJsb2NrKCkpO1xuICAgIH1cbiAgfVxuICBcbiAgLy8gc2VyaWFsaXplIGJsb2NrcyB0byBqc29uXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYmxvY2tzLmxlbmd0aDsgaSsrKSBibG9ja3NbaV0gPSBibG9ja3NbaV0udG9Kc29uKCk7XG4gIHJldHVybiBibG9ja3M7XG59XG5cbnNlbGYuZ2V0T3V0cHV0cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBibG9ja0pzb25RdWVyeSkge1xuXG4gIC8vIGRlc2VyaWFsaXplIHF1ZXJ5IHdoaWNoIGlzIGpzb24gc3RyaW5nIHJvb3RlZCBhdCBibG9ja1xuICBsZXQgcXVlcnkgPSAobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvblF1ZXJ5LCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYX1FVRVJZKS5nZXRUeHMoKVswXSBhcyBNb25lcm9UeFF1ZXJ5KS5nZXRPdXRwdXRRdWVyeSgpO1xuICBcbiAgLy8gZ2V0IG91dHB1dHNcbiAgbGV0IG91dHB1dHMgPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRPdXRwdXRzKHF1ZXJ5KTtcbiAgXG4gIC8vIGNvbGxlY3QgdW5pcXVlIGJsb2NrcyB0byBwcmVzZXJ2ZSBtb2RlbCByZWxhdGlvbnNoaXBzIGFzIHRyZWVcbiAgbGV0IHVuY29uZmlybWVkQmxvY2sgPSB1bmRlZmluZWQ7XG4gIGxldCBibG9ja3MgPSBbXTtcbiAgbGV0IHNlZW5CbG9ja3MgPSBuZXcgU2V0KCk7XG4gIGZvciAobGV0IG91dHB1dCBvZiBvdXRwdXRzKSB7XG4gICAgbGV0IHR4ID0gb3V0cHV0LmdldFR4KCk7XG4gICAgaWYgKCF0eC5nZXRCbG9jaygpKSB7XG4gICAgICBpZiAoIXVuY29uZmlybWVkQmxvY2spIHVuY29uZmlybWVkQmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soKS5zZXRUeHMoW10pO1xuICAgICAgdHguc2V0QmxvY2sodW5jb25maXJtZWRCbG9jayk7XG4gICAgICB1bmNvbmZpcm1lZEJsb2NrLmdldFR4cygpLnB1c2godHgpO1xuICAgIH1cbiAgICBpZiAoIXNlZW5CbG9ja3MuaGFzKHR4LmdldEJsb2NrKCkpKSB7XG4gICAgICBzZWVuQmxvY2tzLmFkZCh0eC5nZXRCbG9jaygpKTtcbiAgICAgIGJsb2Nrcy5wdXNoKHR4LmdldEJsb2NrKCkpO1xuICAgIH1cbiAgfVxuICBcbiAgLy8gc2VyaWFsaXplIGJsb2NrcyB0byBqc29uXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYmxvY2tzLmxlbmd0aDsgaSsrKSBibG9ja3NbaV0gPSBibG9ja3NbaV0udG9Kc29uKCk7XG4gIHJldHVybiBibG9ja3M7XG59XG5cbnNlbGYuZXhwb3J0T3V0cHV0cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhbGwpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmV4cG9ydE91dHB1dHMoYWxsKTtcbn1cblxuc2VsZi5pbXBvcnRPdXRwdXRzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG91dHB1dHNIZXgpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmltcG9ydE91dHB1dHMob3V0cHV0c0hleCk7XG59XG5cbnNlbGYuZ2V0S2V5SW1hZ2VzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFsbCkge1xuICBsZXQga2V5SW1hZ2VzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBrZXlJbWFnZSBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5leHBvcnRLZXlJbWFnZXMoYWxsKSkga2V5SW1hZ2VzSnNvbi5wdXNoKGtleUltYWdlLnRvSnNvbigpKTtcbiAgcmV0dXJuIGtleUltYWdlc0pzb247XG59XG5cbnNlbGYuaW1wb3J0S2V5SW1hZ2VzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGtleUltYWdlc0pzb24pIHtcbiAgbGV0IGtleUltYWdlcyA9IFtdO1xuICBmb3IgKGxldCBrZXlJbWFnZUpzb24gb2Yga2V5SW1hZ2VzSnNvbikga2V5SW1hZ2VzLnB1c2gobmV3IE1vbmVyb0tleUltYWdlKGtleUltYWdlSnNvbikpO1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmltcG9ydEtleUltYWdlcyhrZXlJbWFnZXMpKS50b0pzb24oKTtcbn1cblxuLy9hc3luYyBnZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCgpIHtcbi8vICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4vL31cblxuc2VsZi5mcmVlemVPdXRwdXQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwga2V5SW1hZ2UpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmZyZWV6ZU91dHB1dChrZXlJbWFnZSk7XG59XG5cbnNlbGYudGhhd091dHB1dCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBrZXlJbWFnZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0udGhhd091dHB1dChrZXlJbWFnZSk7XG59XG5cbnNlbGYuaXNPdXRwdXRGcm96ZW4gPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwga2V5SW1hZ2UpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmlzT3V0cHV0RnJvemVuKGtleUltYWdlKTtcbn1cblxuc2VsZi5jcmVhdGVUeHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgY29uZmlnKSB7XG4gIGlmICh0eXBlb2YgY29uZmlnID09PSBcIm9iamVjdFwiKSBjb25maWcgPSBuZXcgTW9uZXJvVHhDb25maWcoY29uZmlnKTtcbiAgbGV0IHR4cyA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmNyZWF0ZVR4cyhjb25maWcpO1xuICByZXR1cm4gdHhzWzBdLmdldFR4U2V0KCkudG9Kc29uKCk7XG59XG5cbnNlbGYuc3dlZXBPdXRwdXQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgY29uZmlnKSB7XG4gIGlmICh0eXBlb2YgY29uZmlnID09PSBcIm9iamVjdFwiKSBjb25maWcgPSBuZXcgTW9uZXJvVHhDb25maWcoY29uZmlnKTtcbiAgbGV0IHR4ID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc3dlZXBPdXRwdXQoY29uZmlnKTtcbiAgcmV0dXJuIHR4LmdldFR4U2V0KCkudG9Kc29uKCk7XG59XG5cbnNlbGYuc3dlZXBVbmxvY2tlZCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBjb25maWcpIHtcbiAgaWYgKHR5cGVvZiBjb25maWcgPT09IFwib2JqZWN0XCIpIGNvbmZpZyA9IG5ldyBNb25lcm9UeENvbmZpZyhjb25maWcpO1xuICBsZXQgdHhzID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc3dlZXBVbmxvY2tlZChjb25maWcpO1xuICBsZXQgdHhTZXRzID0gW107XG4gIGZvciAobGV0IHR4IG9mIHR4cykgaWYgKCFHZW5VdGlscy5hcnJheUNvbnRhaW5zKHR4U2V0cywgdHguZ2V0VHhTZXQoKSkpIHR4U2V0cy5wdXNoKHR4LmdldFR4U2V0KCkpO1xuICBsZXQgdHhTZXRzSnNvbiA9IFtdO1xuICBmb3IgKGxldCB0eFNldCBvZiB0eFNldHMpIHR4U2V0c0pzb24ucHVzaCh0eFNldC50b0pzb24oKSk7XG4gIHJldHVybiB0eFNldHNKc29uO1xufVxuXG5zZWxmLnN3ZWVwRHVzdCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCByZWxheSkge1xuICBsZXQgdHhzID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc3dlZXBEdXN0KHJlbGF5KTtcbiAgcmV0dXJuIHR4cy5sZW5ndGggPT09IDAgPyB7fSA6IHR4c1swXS5nZXRUeFNldCgpLnRvSnNvbigpO1xufVxuXG5zZWxmLnJlbGF5VHhzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4TWV0YWRhdGFzKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5yZWxheVR4cyh0eE1ldGFkYXRhcyk7XG59XG5cbnNlbGYuZGVzY3JpYmVUeFNldCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eFNldEpzb24pIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5kZXNjcmliZVR4U2V0KG5ldyBNb25lcm9UeFNldCh0eFNldEpzb24pKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuc2lnblR4cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB1bnNpZ25lZFR4SGV4KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zaWduVHhzKHVuc2lnbmVkVHhIZXgpO1xufVxuXG5zZWxmLnN1Ym1pdFR4cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBzaWduZWRUeEhleCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc3VibWl0VHhzKHNpZ25lZFR4SGV4KTtcbn1cblxuc2VsZi5zaWduTWVzc2FnZSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBtZXNzYWdlLCBzaWduYXR1cmVUeXBlLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zaWduTWVzc2FnZShtZXNzYWdlLCBzaWduYXR1cmVUeXBlLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTtcbn1cblxuc2VsZi52ZXJpZnlNZXNzYWdlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG1lc3NhZ2UsIGFkZHJlc3MsIHNpZ25hdHVyZSkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnZlcmlmeU1lc3NhZ2UobWVzc2FnZSwgYWRkcmVzcywgc2lnbmF0dXJlKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZ2V0VHhLZXkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdHhIYXNoKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRUeEtleSh0eEhhc2gpO1xufVxuXG5zZWxmLmNoZWNrVHhLZXkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdHhIYXNoLCB0eEtleSwgYWRkcmVzcykge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmNoZWNrVHhLZXkodHhIYXNoLCB0eEtleSwgYWRkcmVzcykpLnRvSnNvbigpO1xufVxuXG5zZWxmLmdldFR4UHJvb2YgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdHhIYXNoLCBhZGRyZXNzLCBtZXNzYWdlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRUeFByb29mKHR4SGFzaCwgYWRkcmVzcywgbWVzc2FnZSk7XG59XG5cbnNlbGYuY2hlY2tUeFByb29mID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaCwgYWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uY2hlY2tUeFByb29mKHR4SGFzaCwgYWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZ2V0U3BlbmRQcm9vZiA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eEhhc2gsIG1lc3NhZ2UpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFNwZW5kUHJvb2YodHhIYXNoLCBtZXNzYWdlKTtcbn1cblxuc2VsZi5jaGVja1NwZW5kUHJvb2YgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdHhIYXNoLCBtZXNzYWdlLCBzaWduYXR1cmUpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmNoZWNrU3BlbmRQcm9vZih0eEhhc2gsIG1lc3NhZ2UsIHNpZ25hdHVyZSk7XG59XG5cbnNlbGYuZ2V0UmVzZXJ2ZVByb29mV2FsbGV0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG1lc3NhZ2UpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFJlc2VydmVQcm9vZldhbGxldChtZXNzYWdlKTtcbn1cblxuc2VsZi5nZXRSZXNlcnZlUHJvb2ZBY2NvdW50ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFjY291bnRJZHgsIGFtb3VudFN0ciwgbWVzc2FnZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0UmVzZXJ2ZVByb29mQWNjb3VudChhY2NvdW50SWR4LCBhbW91bnRTdHIsIG1lc3NhZ2UpO1xufVxuXG5zZWxmLmNoZWNrUmVzZXJ2ZVByb29mID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmNoZWNrUmVzZXJ2ZVByb29mKGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmdldFR4Tm90ZXMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdHhIYXNoZXMpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFR4Tm90ZXModHhIYXNoZXMpO1xufVxuXG5zZWxmLnNldFR4Tm90ZXMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdHhIYXNoZXMsIHR4Tm90ZXMpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnNldFR4Tm90ZXModHhIYXNoZXMsIHR4Tm90ZXMpO1xufVxuXG5zZWxmLmdldEFkZHJlc3NCb29rRW50cmllcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBlbnRyeUluZGljZXMpIHtcbiAgbGV0IGVudHJpZXNKc29uID0gW107XG4gIGZvciAobGV0IGVudHJ5IG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldEFkZHJlc3NCb29rRW50cmllcyhlbnRyeUluZGljZXMpKSBlbnRyaWVzSnNvbi5wdXNoKGVudHJ5LnRvSnNvbigpKTtcbiAgcmV0dXJuIGVudHJpZXNKc29uO1xufVxuXG5zZWxmLmFkZEFkZHJlc3NCb29rRW50cnkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWRkcmVzcywgZGVzY3JpcHRpb24pIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmFkZEFkZHJlc3NCb29rRW50cnkoYWRkcmVzcywgZGVzY3JpcHRpb24pO1xufVxuXG5zZWxmLmVkaXRBZGRyZXNzQm9va0VudHJ5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGluZGV4LCBzZXRBZGRyZXNzLCBhZGRyZXNzLCBzZXREZXNjcmlwdGlvbiwgZGVzY3JpcHRpb24pIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmVkaXRBZGRyZXNzQm9va0VudHJ5KGluZGV4LCBzZXRBZGRyZXNzLCBhZGRyZXNzLCBzZXREZXNjcmlwdGlvbiwgZGVzY3JpcHRpb24pO1xufVxuXG5zZWxmLmRlbGV0ZUFkZHJlc3NCb29rRW50cnkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgaW5kZXgpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmRlbGV0ZUFkZHJlc3NCb29rRW50cnkoaW5kZXgpO1xufVxuXG5zZWxmLnRhZ0FjY291bnRzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHRhZywgYWNjb3VudEluZGljZXMpIHtcbiAgdGhyb3cgbmV3IEVycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xufVxuXG5zZWxmLnVudGFnQWNjb3VudHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWNjb3VudEluZGljZXMpIHtcbiAgdGhyb3cgbmV3IEVycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xufVxuXG5zZWxmLmdldEFjY291bnRUYWdzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgdGhyb3cgbmV3IEVycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xufVxuXG5zZWxmLnNldEFjY291bnRUYWdMYWJlbCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0YWcsIGxhYmVsKSB7XG4gIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbn1cblxuc2VsZi5nZXRQYXltZW50VXJpID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGNvbmZpZ0pzb24pIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFBheW1lbnRVcmkobmV3IE1vbmVyb1R4Q29uZmlnKGNvbmZpZ0pzb24pKTtcbn1cblxuc2VsZi5wYXJzZVBheW1lbnRVcmkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdXJpKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0ucGFyc2VQYXltZW50VXJpKHVyaSkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmdldEF0dHJpYnV0ZSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBrZXkpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldEF0dHJpYnV0ZShrZXkpO1xufVxuXG5zZWxmLnNldEF0dHJpYnV0ZSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBrZXksIHZhbHVlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zZXRBdHRyaWJ1dGUoa2V5LCB2YWx1ZSk7XG59XG5cbnNlbGYuc3RhcnRNaW5pbmcgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbnVtVGhyZWFkcywgYmFja2dyb3VuZE1pbmluZywgaWdub3JlQmF0dGVyeSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc3RhcnRNaW5pbmcobnVtVGhyZWFkcywgYmFja2dyb3VuZE1pbmluZywgaWdub3JlQmF0dGVyeSk7XG59XG5cbnNlbGYuc3RvcE1pbmluZyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zdG9wTWluaW5nKCk7XG59XG5cbnNlbGYuaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pc011bHRpc2lnSW1wb3J0TmVlZGVkKCk7XG59XG5cbnNlbGYuaXNNdWx0aXNpZyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pc011bHRpc2lnKCk7XG59XG5cbnNlbGYuZ2V0TXVsdGlzaWdJbmZvID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRNdWx0aXNpZ0luZm8oKSkudG9Kc29uKCk7XG59XG5cbnNlbGYucHJlcGFyZU11bHRpc2lnID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnByZXBhcmVNdWx0aXNpZygpO1xufVxuXG5zZWxmLm1ha2VNdWx0aXNpZyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBtdWx0aXNpZ0hleGVzLCB0aHJlc2hvbGQsIHBhc3N3b3JkKSB7XG4gIHJldHVybiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5tYWtlTXVsdGlzaWcobXVsdGlzaWdIZXhlcywgdGhyZXNob2xkLCBwYXNzd29yZCk7XG59XG5cbnNlbGYuZXhjaGFuZ2VNdWx0aXNpZ0tleXMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbXVsdGlzaWdIZXhlcywgcGFzc3dvcmQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5leGNoYW5nZU11bHRpc2lnS2V5cyhtdWx0aXNpZ0hleGVzLCBwYXNzd29yZCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmV4cG9ydE11bHRpc2lnSGV4ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmV4cG9ydE11bHRpc2lnSGV4KCk7XG59XG5cbnNlbGYuaW1wb3J0TXVsdGlzaWdIZXggPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbXVsdGlzaWdIZXhlcykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaW1wb3J0TXVsdGlzaWdIZXgobXVsdGlzaWdIZXhlcyk7XG59XG5cbnNlbGYuc2lnbk11bHRpc2lnVHhIZXggPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbXVsdGlzaWdUeEhleCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnNpZ25NdWx0aXNpZ1R4SGV4KG11bHRpc2lnVHhIZXgpKS50b0pzb24oKTtcbn1cblxuc2VsZi5zdWJtaXRNdWx0aXNpZ1R4SGV4ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHNpZ25lZE11bHRpc2lnVHhIZXgpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN1Ym1pdE11bHRpc2lnVHhIZXgoc2lnbmVkTXVsdGlzaWdUeEhleCk7XG59XG5cbnNlbGYuZ2V0RGF0YSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXREYXRhKCk7XG59XG5cbnNlbGYuY2hhbmdlUGFzc3dvcmQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgb2xkUGFzc3dvcmQsIG5ld1Bhc3N3b3JkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jaGFuZ2VQYXNzd29yZChvbGRQYXNzd29yZCwgbmV3UGFzc3dvcmQpO1xufVxuXG5zZWxmLmlzQ2xvc2VkID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuICFzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXSB8fCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pc0Nsb3NlZCgpO1xufVxuXG5zZWxmLmNsb3NlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHNhdmUpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmNsb3NlKHNhdmUpO1xuICBkZWxldGUgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF07XG59Il0sIm1hcHBpbmdzIjoia0dBQUEsSUFBQUEsT0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMsU0FBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUUsV0FBQSxHQUFBSCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUcsYUFBQSxHQUFBSixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUksVUFBQSxHQUFBTCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUssWUFBQSxHQUFBTixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQU0sbUJBQUEsR0FBQVAsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFPLHFCQUFBLEdBQUFSLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBUSxnQkFBQSxHQUFBVCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVMsWUFBQSxHQUFBVixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVUsZUFBQSxHQUFBWCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVcsb0JBQUEsR0FBQVosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFZLGVBQUEsR0FBQWIsc0JBQUEsQ0FBQUMsT0FBQTs7QUFFQSxJQUFBYSxZQUFBLEdBQUFkLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBYyxZQUFBLEdBQUFmLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBZSxtQkFBQSxHQUFBaEIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFnQixxQkFBQSxHQUFBakIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFpQixpQkFB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