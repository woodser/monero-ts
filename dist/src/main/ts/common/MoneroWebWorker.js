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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfSHR0cENsaWVudCIsIl9MaWJyYXJ5VXRpbHMiLCJfTW9uZXJvQmFuIiwiX01vbmVyb0Jsb2NrIiwiX01vbmVyb0RhZW1vbkNvbmZpZyIsIl9Nb25lcm9EYWVtb25MaXN0ZW5lciIsIl9Nb25lcm9EYWVtb25ScGMiLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvS2V5SW1hZ2UiLCJfTW9uZXJvUnBjQ29ubmVjdGlvbiIsIl9Nb25lcm9UeENvbmZpZyIsIl9Nb25lcm9UeFNldCIsIl9Nb25lcm9VdGlscyIsIl9Nb25lcm9XYWxsZXRDb25maWciLCJfTW9uZXJvV2FsbGV0TGlzdGVuZXIiLCJfTW9uZXJvV2FsbGV0S2V5cyIsIl9Nb25lcm9XYWxsZXRGdWxsIiwic2VsZiIsIkh0dHBDbGllbnQiLCJMaWJyYXJ5VXRpbHMiLCJHZW5VdGlscyIsIm9ubWVzc2FnZSIsImUiLCJpbml0T25lVGltZSIsIm9iamVjdElkIiwiZGF0YSIsImZuTmFtZSIsImNhbGxiYWNrSWQiLCJhc3NlcnQiLCJFcnJvciIsInNwbGljZSIsInBvc3RNZXNzYWdlIiwicmVzdWx0IiwiYXBwbHkiLCJlcnJvciIsInNlcmlhbGl6ZUVycm9yIiwiaXNJbml0aWFsaXplZCIsIldPUktFUl9PQkpFQ1RTIiwiTW9uZXJvVXRpbHMiLCJQUk9YWV9UT19XT1JLRVIiLCJodHRwUmVxdWVzdCIsIm9wdHMiLCJyZXF1ZXN0IiwiT2JqZWN0IiwiYXNzaWduIiwicHJveHlUb1dvcmtlciIsImVyciIsInN0YXR1c0NvZGUiLCJKU09OIiwic3RyaW5naWZ5Iiwic3RhdHVzTWVzc2FnZSIsIm1lc3NhZ2UiLCJzZXRMb2dMZXZlbCIsImxldmVsIiwiZ2V0V2FzbU1lbW9yeVVzZWQiLCJnZXRXYXNtTW9kdWxlIiwiSEVBUDgiLCJsZW5ndGgiLCJ1bmRlZmluZWQiLCJtb25lcm9VdGlsc0dldEludGVncmF0ZWRBZGRyZXNzIiwibmV0d29ya1R5cGUiLCJzdGFuZGFyZEFkZHJlc3MiLCJwYXltZW50SWQiLCJnZXRJbnRlZ3JhdGVkQWRkcmVzcyIsInRvSnNvbiIsIm1vbmVyb1V0aWxzVmFsaWRhdGVBZGRyZXNzIiwiYWRkcmVzcyIsInZhbGlkYXRlQWRkcmVzcyIsIm1vbmVyb1V0aWxzSnNvblRvQmluYXJ5IiwianNvbiIsImpzb25Ub0JpbmFyeSIsIm1vbmVyb1V0aWxzQmluYXJ5VG9Kc29uIiwidWludDhhcnIiLCJiaW5hcnlUb0pzb24iLCJtb25lcm9VdGlsc0JpbmFyeUJsb2Nrc1RvSnNvbiIsImJpbmFyeUJsb2Nrc1RvSnNvbiIsImRhZW1vbkFkZExpc3RlbmVyIiwiZGFlbW9uSWQiLCJsaXN0ZW5lcklkIiwibGlzdGVuZXIiLCJNb25lcm9EYWVtb25MaXN0ZW5lciIsIm9uQmxvY2tIZWFkZXIiLCJibG9ja0hlYWRlciIsImRhZW1vbkxpc3RlbmVycyIsImFkZExpc3RlbmVyIiwiZGFlbW9uUmVtb3ZlTGlzdGVuZXIiLCJNb25lcm9FcnJvciIsInJlbW92ZUxpc3RlbmVyIiwiY29ubmVjdERhZW1vblJwYyIsImNvbmZpZyIsIk1vbmVyb0RhZW1vblJwYyIsImNvbm5lY3RUb0RhZW1vblJwYyIsIk1vbmVyb0RhZW1vbkNvbmZpZyIsImRhZW1vbkdldFJwY0Nvbm5lY3Rpb24iLCJjb25uZWN0aW9uIiwiZ2V0UnBjQ29ubmVjdGlvbiIsImdldENvbmZpZyIsImRhZW1vbklzQ29ubmVjdGVkIiwiaXNDb25uZWN0ZWQiLCJkYWVtb25HZXRWZXJzaW9uIiwiZ2V0VmVyc2lvbiIsImRhZW1vbklzVHJ1c3RlZCIsImlzVHJ1c3RlZCIsImRhZW1vbkdldEhlaWdodCIsImdldEhlaWdodCIsImRhZW1vbkdldEJsb2NrSGFzaCIsImhlaWdodCIsImdldEJsb2NrSGFzaCIsImRhZW1vbkdldEJsb2NrVGVtcGxhdGUiLCJ3YWxsZXRBZGRyZXNzIiwicmVzZXJ2ZVNpemUiLCJnZXRCbG9ja1RlbXBsYXRlIiwiZGFlbW9uR2V0TGFzdEJsb2NrSGVhZGVyIiwiZ2V0TGFzdEJsb2NrSGVhZGVyIiwiZGFlbW9uR2V0QmxvY2tIZWFkZXJCeUhhc2giLCJoYXNoIiwiZ2V0QmxvY2tIZWFkZXJCeUhhc2giLCJkYWVtb25HZXRCbG9ja0hlYWRlckJ5SGVpZ2h0IiwiZ2V0QmxvY2tIZWFkZXJCeUhlaWdodCIsImRhZW1vbkdldEJsb2NrSGVhZGVyc0J5UmFuZ2UiLCJzdGFydEhlaWdodCIsImVuZEhlaWdodCIsImJsb2NrSGVhZGVyc0pzb24iLCJnZXRCbG9ja0hlYWRlcnNCeVJhbmdlIiwicHVzaCIsImRhZW1vbkdldEJsb2NrQnlIYXNoIiwiYmxvY2tIYXNoIiwiZ2V0QmxvY2tCeUhhc2giLCJkYWVtb25HZXRCbG9ja3NCeUhhc2giLCJibG9ja0hhc2hlcyIsInBydW5lIiwiYmxvY2tzSnNvbiIsImJsb2NrIiwiZ2V0QmxvY2tzQnlIYXNoIiwiZGFlbW9uR2V0QmxvY2tCeUhlaWdodCIsImdldEJsb2NrQnlIZWlnaHQiLCJkYWVtb25HZXRCbG9ja3NCeUhlaWdodCIsImhlaWdodHMiLCJnZXRCbG9ja3NCeUhlaWdodCIsImRhZW1vbkdldEJsb2Nrc0J5UmFuZ2UiLCJnZXRCbG9ja3NCeVJhbmdlIiwiZGFlbW9uR2V0QmxvY2tzQnlSYW5nZUNodW5rZWQiLCJtYXhDaHVua1NpemUiLCJnZXRCbG9ja3NCeVJhbmdlQ2h1bmtlZCIsImRhZW1vbkdldEJsb2NrSGFzaGVzIiwiZGFlbW9uR2V0VHhzIiwidHhIYXNoZXMiLCJ0eHMiLCJnZXRUeHMiLCJibG9ja3MiLCJ1bmNvbmZpcm1lZEJsb2NrIiwic2VlbkJsb2NrcyIsIlNldCIsInR4IiwiZ2V0QmxvY2siLCJNb25lcm9CbG9jayIsInNldFR4cyIsInNldEJsb2NrIiwiaGFzIiwiYWRkIiwiaSIsImRhZW1vbkdldFR4SGV4ZXMiLCJnZXRUeEhleGVzIiwiZGFlbW9uR2V0TWluZXJUeFN1bSIsIm51bUJsb2NrcyIsImdldE1pbmVyVHhTdW0iLCJkYWVtb25HZXRGZWVFc3RpbWF0ZSIsImdyYWNlQmxvY2tzIiwiZ2V0RmVlRXN0aW1hdGUiLCJkYWVtb25TdWJtaXRUeEhleCIsInR4SGV4IiwiZG9Ob3RSZWxheSIsInN1Ym1pdFR4SGV4IiwiZGFlbW9uUmVsYXlUeHNCeUhhc2giLCJyZWxheVR4c0J5SGFzaCIsImRhZW1vbkdldFR4UG9vbCIsImdldFR4UG9vbCIsImRhZW1vbkdldFR4UG9vbEhhc2hlcyIsImdldFR4UG9vbEhhc2hlcyIsImRhZW1vbkdldFR4UG9vbFN0YXRzIiwiZ2V0VHhQb29sU3RhdHMiLCJkYWVtb25GbHVzaFR4UG9vbCIsImhhc2hlcyIsImZsdXNoVHhQb29sIiwiZGFlbW9uR2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzIiwia2V5SW1hZ2VzIiwiZ2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzIiwiZGFlbW9uR2V0T3V0cHV0SGlzdG9ncmFtIiwiYW1vdW50cyIsIm1pbkNvdW50IiwibWF4Q291bnQiLCJpc1VubG9ja2VkIiwicmVjZW50Q3V0b2ZmIiwiZW50cmllc0pzb24iLCJlbnRyeSIsImdldE91dHB1dEhpc3RvZ3JhbSIsImRhZW1vbkdldEluZm8iLCJnZXRJbmZvIiwiZGFlbW9uR2V0U3luY0luZm8iLCJnZXRTeW5jSW5mbyIsImRhZW1vbkdldEhhcmRGb3JrSW5mbyIsImdldEhhcmRGb3JrSW5mbyIsImRhZW1vbkdldEFsdENoYWlucyIsImFsdENoYWluc0pzb24iLCJhbHRDaGFpbiIsImdldEFsdENoYWlucyIsImRhZW1vbkdldEFsdEJsb2NrSGFzaGVzIiwiZ2V0QWx0QmxvY2tIYXNoZXMiLCJkYWVtb25HZXREb3dubG9hZExpbWl0IiwiZ2V0RG93bmxvYWRMaW1pdCIsImRhZW1vblNldERvd25sb2FkTGltaXQiLCJsaW1pdCIsInNldERvd25sb2FkTGltaXQiLCJkYWVtb25SZXNldERvd25sb2FkTGltaXQiLCJyZXNldERvd25sb2FkTGltaXQiLCJkYWVtb25HZXRVcGxvYWRMaW1pdCIsImdldFVwbG9hZExpbWl0IiwiZGFlbW9uU2V0VXBsb2FkTGltaXQiLCJzZXRVcGxvYWRMaW1pdCIsImRhZW1vblJlc2V0VXBsb2FkTGltaXQiLCJyZXNldFVwbG9hZExpbWl0IiwiZGFlbW9uR2V0UGVlcnMiLCJwZWVyc0pzb24iLCJwZWVyIiwiZ2V0UGVlcnMiLCJkYWVtb25HZXRLbm93blBlZXJzIiwiZ2V0S25vd25QZWVycyIsImRhZW1vblNldE91dGdvaW5nUGVlckxpbWl0Iiwic2V0T3V0Z29pbmdQZWVyTGltaXQiLCJkYWVtb25TZXRJbmNvbWluZ1BlZXJMaW1pdCIsInNldEluY29taW5nUGVlckxpbWl0IiwiZGFlbW9uR2V0UGVlckJhbnMiLCJiYW5zSnNvbiIsImJhbiIsImdldFBlZXJCYW5zIiwiZGFlbW9uU2V0UGVlckJhbnMiLCJiYW5zIiwiYmFuSnNvbiIsIk1vbmVyb0JhbiIsInNldFBlZXJCYW5zIiwiZGFlbW9uU3RhcnRNaW5pbmciLCJudW1UaHJlYWRzIiwiaXNCYWNrZ3JvdW5kIiwiaWdub3JlQmF0dGVyeSIsInN0YXJ0TWluaW5nIiwiZGFlbW9uU3RvcE1pbmluZyIsInN0b3BNaW5pbmciLCJkYWVtb25HZXRNaW5pbmdTdGF0dXMiLCJnZXRNaW5pbmdTdGF0dXMiLCJkYWVtb25TdWJtaXRCbG9ja3MiLCJibG9ja0Jsb2JzIiwic3VibWl0QmxvY2tzIiwiZGFlbW9uUHJ1bmVCbG9ja2NoYWluIiwiY2hlY2siLCJwcnVuZUJsb2NrY2hhaW4iLCJkYWVtb25TdG9wIiwic3RvcCIsImRhZW1vbldhaXRGb3JOZXh0QmxvY2tIZWFkZXIiLCJ3YWl0Rm9yTmV4dEJsb2NrSGVhZGVyIiwib3BlbldhbGxldERhdGEiLCJ3YWxsZXRJZCIsInBhdGgiLCJwYXNzd29yZCIsImtleXNEYXRhIiwiY2FjaGVEYXRhIiwiZGFlbW9uVXJpT3JDb25maWciLCJkYWVtb25Db25uZWN0aW9uIiwiTW9uZXJvUnBjQ29ubmVjdGlvbiIsIk1vbmVyb1dhbGxldEZ1bGwiLCJvcGVuV2FsbGV0Iiwic2VydmVyIiwic2V0QnJvd3Nlck1haW5QYXRoIiwiY3JlYXRlV2FsbGV0S2V5cyIsImNvbmZpZ0pzb24iLCJNb25lcm9XYWxsZXRDb25maWciLCJzZXRQcm94eVRvV29ya2VyIiwiTW9uZXJvV2FsbGV0S2V5cyIsImNyZWF0ZVdhbGxldCIsImNyZWF0ZVdhbGxldEZ1bGwiLCJnZXRQYXRoIiwic2V0UGF0aCIsImlzVmlld09ubHkiLCJnZXROZXR3b3JrVHlwZSIsImdldFNlZWQiLCJnZXRTZWVkTGFuZ3VhZ2UiLCJnZXRTZWVkTGFuZ3VhZ2VzIiwiZ2V0UHJpdmF0ZVNwZW5kS2V5IiwiZ2V0UHJpdmF0ZVZpZXdLZXkiLCJnZXRQdWJsaWNWaWV3S2V5IiwiZ2V0UHVibGljU3BlbmRLZXkiLCJnZXRBZGRyZXNzIiwiYWNjb3VudElkeCIsInN1YmFkZHJlc3NJZHgiLCJnZXRBZGRyZXNzSW5kZXgiLCJzZXRTdWJhZGRyZXNzTGFiZWwiLCJsYWJlbCIsImRlY29kZUludGVncmF0ZWRBZGRyZXNzIiwiaW50ZWdyYXRlZEFkZHJlc3MiLCJzZXREYWVtb25Db25uZWN0aW9uIiwiZ2V0RGFlbW9uQ29ubmVjdGlvbiIsImlzQ29ubmVjdGVkVG9EYWVtb24iLCJnZXRSZXN0b3JlSGVpZ2h0Iiwic2V0UmVzdG9yZUhlaWdodCIsInJlc3RvcmVIZWlnaHQiLCJnZXREYWVtb25IZWlnaHQiLCJnZXREYWVtb25NYXhQZWVySGVpZ2h0IiwiZ2V0SGVpZ2h0QnlEYXRlIiwieWVhciIsIm1vbnRoIiwiZGF5IiwiaXNEYWVtb25TeW5jZWQiLCJXYWxsZXRXb3JrZXJIZWxwZXJMaXN0ZW5lciIsIk1vbmVyb1dhbGxldExpc3RlbmVyIiwiY29uc3RydWN0b3IiLCJpZCIsIndvcmtlciIsImdldElkIiwib25TeW5jUHJvZ3Jlc3MiLCJwZXJjZW50RG9uZSIsIm9uTmV3QmxvY2siLCJvbkJhbGFuY2VzQ2hhbmdlZCIsIm5ld0JhbGFuY2UiLCJuZXdVbmxvY2tlZEJhbGFuY2UiLCJ0b1N0cmluZyIsIm9uT3V0cHV0UmVjZWl2ZWQiLCJvdXRwdXQiLCJnZXRUeCIsIm9uT3V0cHV0U3BlbnQiLCJsaXN0ZW5lcnMiLCJpc1N5bmNlZCIsInN5bmMiLCJhbGxvd0NvbmN1cnJlbnRDYWxscyIsInN0YXJ0U3luY2luZyIsInN5bmNQZXJpb2RJbk1zIiwic3RvcFN5bmNpbmciLCJzY2FuVHhzIiwicmVzY2FuU3BlbnQiLCJyZXNjYW5CbG9ja2NoYWluIiwiZ2V0QmFsYW5jZSIsImdldFVubG9ja2VkQmFsYW5jZSIsImdldEFjY291bnRzIiwiaW5jbHVkZVN1YmFkZHJlc3NlcyIsInRhZyIsImFjY291bnRKc29ucyIsImFjY291bnQiLCJnZXRBY2NvdW50IiwiY3JlYXRlQWNjb3VudCIsImdldFN1YmFkZHJlc3NlcyIsInN1YmFkZHJlc3NJbmRpY2VzIiwic3ViYWRkcmVzc0pzb25zIiwic3ViYWRkcmVzcyIsImNyZWF0ZVN1YmFkZHJlc3MiLCJibG9ja0pzb25RdWVyeSIsInF1ZXJ5IiwiRGVzZXJpYWxpemF0aW9uVHlwZSIsIlRYX1FVRVJZIiwiZ2V0VHJhbnNmZXJzIiwiZ2V0VHJhbnNmZXJRdWVyeSIsInRyYW5zZmVycyIsInRyYW5zZmVyIiwiZ2V0T3V0cHV0cyIsImdldE91dHB1dFF1ZXJ5Iiwib3V0cHV0cyIsImV4cG9ydE91dHB1dHMiLCJhbGwiLCJpbXBvcnRPdXRwdXRzIiwib3V0cHV0c0hleCIsImdldEtleUltYWdlcyIsImtleUltYWdlc0pzb24iLCJrZXlJbWFnZSIsImV4cG9ydEtleUltYWdlcyIsImltcG9ydEtleUltYWdlcyIsImtleUltYWdlSnNvbiIsIk1vbmVyb0tleUltYWdlIiwiZnJlZXplT3V0cHV0IiwidGhhd091dHB1dCIsImlzT3V0cHV0RnJvemVuIiwiZ2V0RGVmYXVsdEZlZVByaW9yaXR5IiwiY3JlYXRlVHhzIiwiTW9uZXJvVHhDb25maWciLCJnZXRUeFNldCIsInN3ZWVwT3V0cHV0Iiwic3dlZXBVbmxvY2tlZCIsInR4U2V0cyIsImFycmF5Q29udGFpbnMiLCJ0eFNldHNKc29uIiwidHhTZXQiLCJzd2VlcER1c3QiLCJyZWxheSIsInJlbGF5VHhzIiwidHhNZXRhZGF0YXMiLCJkZXNjcmliZVR4U2V0IiwidHhTZXRKc29uIiwiTW9uZXJvVHhTZXQiLCJzaWduVHhzIiwidW5zaWduZWRUeEhleCIsInN1Ym1pdFR4cyIsInNpZ25lZFR4SGV4Iiwic2lnbk1lc3NhZ2UiLCJzaWduYXR1cmVUeXBlIiwidmVyaWZ5TWVzc2FnZSIsInNpZ25hdHVyZSIsImdldFR4S2V5IiwidHhIYXNoIiwiY2hlY2tUeEtleSIsInR4S2V5IiwiZ2V0VHhQcm9vZiIsImNoZWNrVHhQcm9vZiIsImdldFNwZW5kUHJvb2YiLCJjaGVja1NwZW5kUHJvb2YiLCJnZXRSZXNlcnZlUHJvb2ZXYWxsZXQiLCJnZXRSZXNlcnZlUHJvb2ZBY2NvdW50IiwiYW1vdW50U3RyIiwiY2hlY2tSZXNlcnZlUHJvb2YiLCJnZXRUeE5vdGVzIiwic2V0VHhOb3RlcyIsInR4Tm90ZXMiLCJnZXRBZGRyZXNzQm9va0VudHJpZXMiLCJlbnRyeUluZGljZXMiLCJhZGRBZGRyZXNzQm9va0VudHJ5IiwiZGVzY3JpcHRpb24iLCJlZGl0QWRkcmVzc0Jvb2tFbnRyeSIsImluZGV4Iiwic2V0QWRkcmVzcyIsInNldERlc2NyaXB0aW9uIiwiZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeSIsInRhZ0FjY291bnRzIiwiYWNjb3VudEluZGljZXMiLCJ1bnRhZ0FjY291bnRzIiwiZ2V0QWNjb3VudFRhZ3MiLCJzZXRBY2NvdW50VGFnTGFiZWwiLCJnZXRQYXltZW50VXJpIiwicGFyc2VQYXltZW50VXJpIiwidXJpIiwiZ2V0QXR0cmlidXRlIiwia2V5Iiwic2V0QXR0cmlidXRlIiwidmFsdWUiLCJiYWNrZ3JvdW5kTWluaW5nIiwiaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCIsImlzTXVsdGlzaWciLCJnZXRNdWx0aXNpZ0luZm8iLCJwcmVwYXJlTXVsdGlzaWciLCJtYWtlTXVsdGlzaWciLCJtdWx0aXNpZ0hleGVzIiwidGhyZXNob2xkIiwiZXhjaGFuZ2VNdWx0aXNpZ0tleXMiLCJleHBvcnRNdWx0aXNpZ0hleCIsImltcG9ydE11bHRpc2lnSGV4Iiwic2lnbk11bHRpc2lnVHhIZXgiLCJtdWx0aXNpZ1R4SGV4Iiwic3VibWl0TXVsdGlzaWdUeEhleCIsInNpZ25lZE11bHRpc2lnVHhIZXgiLCJnZXREYXRhIiwiY2hhbmdlUGFzc3dvcmQiLCJvbGRQYXNzd29yZCIsIm5ld1Bhc3N3b3JkIiwiaXNDbG9zZWQiLCJjbG9zZSIsInNhdmUiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy9jb21tb24vTW9uZXJvV2ViV29ya2VyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IEdlblV0aWxzIGZyb20gXCIuL0dlblV0aWxzXCI7XG5pbXBvcnQgSHR0cENsaWVudCBmcm9tIFwiLi9IdHRwQ2xpZW50XCI7XG5pbXBvcnQgTGlicmFyeVV0aWxzIGZyb20gXCIuL0xpYnJhcnlVdGlsc1wiO1xuaW1wb3J0IE1vbmVyb0JhbiBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0JhblwiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvQmxvY2tcIjtcbmltcG9ydCBNb25lcm9EYWVtb25Db25maWcgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9EYWVtb25Db25maWdcIjtcbmltcG9ydCBNb25lcm9EYWVtb25MaXN0ZW5lciBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0RhZW1vbkxpc3RlbmVyXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uUnBjIGZyb20gXCIuLi9kYWVtb24vTW9uZXJvRGFlbW9uUnBjXCI7XG5pbXBvcnQgTW9uZXJvRXJyb3IgZnJvbSBcIi4vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZSBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0tleUltYWdlXCI7XG5pbXBvcnQgTW9uZXJvUnBjQ29ubmVjdGlvbiBmcm9tIFwiLi9Nb25lcm9ScGNDb25uZWN0aW9uXCI7XG5pbXBvcnQgTW9uZXJvVHhDb25maWcgZnJvbSBcIi4uL3dhbGxldC9tb2RlbC9Nb25lcm9UeENvbmZpZ1wiO1xuaW1wb3J0IE1vbmVyb1R4UXVlcnkgZnJvbSBcIi4uL3dhbGxldC9tb2RlbC9Nb25lcm9UeFF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvVHhTZXQgZnJvbSBcIi4uL3dhbGxldC9tb2RlbC9Nb25lcm9UeFNldFwiO1xuaW1wb3J0IE1vbmVyb1V0aWxzIGZyb20gXCIuL01vbmVyb1V0aWxzXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0Q29uZmlnIGZyb20gXCIuLi93YWxsZXQvbW9kZWwvTW9uZXJvV2FsbGV0Q29uZmlnXCJcbmltcG9ydCBNb25lcm9XYWxsZXRMaXN0ZW5lciBmcm9tIFwiLi4vd2FsbGV0L21vZGVsL01vbmVyb1dhbGxldExpc3RlbmVyXCJcbmltcG9ydCB7TW9uZXJvV2FsbGV0S2V5c30gZnJvbSBcIi4uL3dhbGxldC9Nb25lcm9XYWxsZXRLZXlzXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0RnVsbCBmcm9tIFwiLi4vd2FsbGV0L01vbmVyb1dhbGxldEZ1bGxcIjtcblxuZGVjbGFyZSBjb25zdCBzZWxmOiBhbnk7XG5cbi8vIGV4cG9zZSBzb21lIG1vZHVsZXMgdG8gdGhlIHdvcmtlclxuc2VsZi5IdHRwQ2xpZW50ID0gSHR0cENsaWVudDtcbnNlbGYuTGlicmFyeVV0aWxzID0gTGlicmFyeVV0aWxzO1xuc2VsZi5HZW5VdGlscyA9IEdlblV0aWxzO1xuXG4vKipcbiAqIFdvcmtlciB0byBtYW5hZ2UgYSBkYWVtb24gYW5kIHdhc20gd2FsbGV0IG9mZiB0aGUgbWFpbiB0aHJlYWQgdXNpbmcgbWVzc2FnZXMuXG4gKiBcbiAqIFJlcXVpcmVkIG1lc3NhZ2UgZm9ybWF0OiBlLmRhdGFbMF0gPSBvYmplY3QgaWQsIGUuZGF0YVsxXSA9IGZ1bmN0aW9uIG5hbWUsIGUuZGF0YVsyK10gPSBmdW5jdGlvbiBhcmdzXG4gKlxuICogRm9yIGJyb3dzZXIgYXBwbGljYXRpb25zLCB0aGlzIGZpbGUgbXVzdCBiZSBicm93c2VyaWZpZWQgYW5kIHBsYWNlZCBpbiB0aGUgd2ViIGFwcCByb290LlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5zZWxmLm9ubWVzc2FnZSA9IGFzeW5jIGZ1bmN0aW9uKGUpIHtcbiAgXG4gIC8vIGluaXRpYWxpemUgb25lIHRpbWVcbiAgYXdhaXQgc2VsZi5pbml0T25lVGltZSgpO1xuICBcbiAgLy8gdmFsaWRhdGUgcGFyYW1zXG4gIGxldCBvYmplY3RJZCA9IGUuZGF0YVswXTtcbiAgbGV0IGZuTmFtZSA9IGUuZGF0YVsxXTtcbiAgbGV0IGNhbGxiYWNrSWQgPSBlLmRhdGFbMl07XG4gIGFzc2VydChmbk5hbWUsIFwiTXVzdCBwcm92aWRlIGZ1bmN0aW9uIG5hbWUgdG8gd29ya2VyXCIpO1xuICBhc3NlcnQoY2FsbGJhY2tJZCwgXCJNdXN0IHByb3ZpZGUgY2FsbGJhY2sgaWQgdG8gd29ya2VyXCIpO1xuICBpZiAoIXNlbGZbZm5OYW1lXSkgdGhyb3cgbmV3IEVycm9yKFwiTWV0aG9kICdcIiArIGZuTmFtZSArIFwiJyBpcyBub3QgcmVnaXN0ZXJlZCB3aXRoIHdvcmtlclwiKTtcbiAgZS5kYXRhLnNwbGljZSgxLCAyKTsgLy8gcmVtb3ZlIGZ1bmN0aW9uIG5hbWUgYW5kIGNhbGxiYWNrIGlkIHRvIGFwcGx5IGZ1bmN0aW9uIHdpdGggYXJndW1lbnRzXG4gIFxuICAvLyBleGVjdXRlIHdvcmtlciBmdW5jdGlvbiBhbmQgcG9zdCByZXN1bHQgdG8gY2FsbGJhY2tcbiAgdHJ5IHtcbiAgICBwb3N0TWVzc2FnZShbb2JqZWN0SWQsIGNhbGxiYWNrSWQsIHtyZXN1bHQ6IGF3YWl0IHNlbGZbZm5OYW1lXS5hcHBseShudWxsLCBlLmRhdGEpfV0pO1xuICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICBpZiAoIShlIGluc3RhbmNlb2YgRXJyb3IpKSBlID0gbmV3IEVycm9yKGUpO1xuICAgIHBvc3RNZXNzYWdlKFtvYmplY3RJZCwgY2FsbGJhY2tJZCwge2Vycm9yOiBMaWJyYXJ5VXRpbHMuc2VyaWFsaXplRXJyb3IoZSl9XSk7XG4gIH1cbn1cblxuc2VsZi5pbml0T25lVGltZSA9IGFzeW5jIGZ1bmN0aW9uKCkge1xuICBpZiAoIXNlbGYuaXNJbml0aWFsaXplZCkge1xuICAgIHNlbGYuV09SS0VSX09CSkVDVFMgPSB7fTtcbiAgICBzZWxmLmlzSW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgIE1vbmVyb1V0aWxzLlBST1hZX1RPX1dPUktFUiA9IGZhbHNlO1xuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBTVEFUSUMgVVRJTElUSUVTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuc2VsZi5odHRwUmVxdWVzdCA9IGFzeW5jIGZ1bmN0aW9uKG9iamVjdElkLCBvcHRzKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGF3YWl0IEh0dHBDbGllbnQucmVxdWVzdChPYmplY3QuYXNzaWduKG9wdHMsIHtwcm94eVRvV29ya2VyOiBmYWxzZX0pKTsgIFxuICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgIHRocm93IGVyci5zdGF0dXNDb2RlID8gbmV3IEVycm9yKEpTT04uc3RyaW5naWZ5KHtzdGF0dXNDb2RlOiBlcnIuc3RhdHVzQ29kZSwgc3RhdHVzTWVzc2FnZTogZXJyLm1lc3NhZ2V9KSkgOiBlcnI7XG4gIH1cbn1cblxuc2VsZi5zZXRMb2dMZXZlbCA9IGFzeW5jIGZ1bmN0aW9uKG9iamVjdElkLCBsZXZlbCkge1xuICByZXR1cm4gTGlicmFyeVV0aWxzLnNldExvZ0xldmVsKGxldmVsKTtcbn1cblxuc2VsZi5nZXRXYXNtTWVtb3J5VXNlZCA9IGFzeW5jIGZ1bmN0aW9uKG9iamVjdElkKSB7XG4gIHJldHVybiBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpICYmIExpYnJhcnlVdGlscy5nZXRXYXNtTW9kdWxlKCkuSEVBUDggPyBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLkhFQVA4Lmxlbmd0aCA6IHVuZGVmaW5lZDtcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gTU9ORVJPIFVUSUxTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5zZWxmLm1vbmVyb1V0aWxzR2V0SW50ZWdyYXRlZEFkZHJlc3MgPSBhc3luYyBmdW5jdGlvbihvYmplY3RJZCwgbmV0d29ya1R5cGUsIHN0YW5kYXJkQWRkcmVzcywgcGF5bWVudElkKSB7XG4gIHJldHVybiAoYXdhaXQgTW9uZXJvVXRpbHMuZ2V0SW50ZWdyYXRlZEFkZHJlc3MobmV0d29ya1R5cGUsIHN0YW5kYXJkQWRkcmVzcywgcGF5bWVudElkKSkudG9Kc29uKCk7XG59XG5cbnNlbGYubW9uZXJvVXRpbHNWYWxpZGF0ZUFkZHJlc3MgPSBhc3luYyBmdW5jdGlvbihvYmplY3RJZCwgYWRkcmVzcywgbmV0d29ya1R5cGUpIHtcbiAgcmV0dXJuIE1vbmVyb1V0aWxzLnZhbGlkYXRlQWRkcmVzcyhhZGRyZXNzLCBuZXR3b3JrVHlwZSk7XG59XG5cbnNlbGYubW9uZXJvVXRpbHNKc29uVG9CaW5hcnkgPSBhc3luYyBmdW5jdGlvbihvYmplY3RJZCwganNvbikge1xuICByZXR1cm4gTW9uZXJvVXRpbHMuanNvblRvQmluYXJ5KGpzb24pO1xufVxuXG5zZWxmLm1vbmVyb1V0aWxzQmluYXJ5VG9Kc29uID0gYXN5bmMgZnVuY3Rpb24ob2JqZWN0SWQsIHVpbnQ4YXJyKSB7XG4gIHJldHVybiBNb25lcm9VdGlscy5iaW5hcnlUb0pzb24odWludDhhcnIpO1xufVxuXG5zZWxmLm1vbmVyb1V0aWxzQmluYXJ5QmxvY2tzVG9Kc29uID0gYXN5bmMgZnVuY3Rpb24ob2JqZWN0SWQsIHVpbnQ4YXJyKSB7XG4gIHJldHVybiBNb25lcm9VdGlscy5iaW5hcnlCbG9ja3NUb0pzb24odWludDhhcnIpO1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIERBRU1PTiBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnNlbGYuZGFlbW9uQWRkTGlzdGVuZXIgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgbGlzdGVuZXJJZCkge1xuICBsZXQgbGlzdGVuZXIgPSBuZXcgY2xhc3MgZXh0ZW5kcyBNb25lcm9EYWVtb25MaXN0ZW5lciB7XG4gICAgYXN5bmMgb25CbG9ja0hlYWRlcihibG9ja0hlYWRlcikge1xuICAgICAgc2VsZi5wb3N0TWVzc2FnZShbZGFlbW9uSWQsIFwib25CbG9ja0hlYWRlcl9cIiArIGxpc3RlbmVySWQsIGJsb2NrSGVhZGVyLnRvSnNvbigpXSk7XG4gICAgfVxuICB9XG4gIGlmICghc2VsZi5kYWVtb25MaXN0ZW5lcnMpIHNlbGYuZGFlbW9uTGlzdGVuZXJzID0ge307XG4gIHNlbGYuZGFlbW9uTGlzdGVuZXJzW2xpc3RlbmVySWRdID0gbGlzdGVuZXI7XG4gIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbn1cblxuc2VsZi5kYWVtb25SZW1vdmVMaXN0ZW5lciA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBsaXN0ZW5lcklkKSB7XG4gIGlmICghc2VsZi5kYWVtb25MaXN0ZW5lcnNbbGlzdGVuZXJJZF0pIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vIGRhZW1vbiB3b3JrZXIgbGlzdGVuZXIgcmVnaXN0ZXJlZCB3aXRoIGlkOiBcIiArIGxpc3RlbmVySWQpO1xuICBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5yZW1vdmVMaXN0ZW5lcihzZWxmLmRhZW1vbkxpc3RlbmVyc1tsaXN0ZW5lcklkXSk7XG4gIGRlbGV0ZSBzZWxmLmRhZW1vbkxpc3RlbmVyc1tsaXN0ZW5lcklkXTtcbn1cblxuc2VsZi5jb25uZWN0RGFlbW9uUnBjID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGNvbmZpZykge1xuICBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXSA9IGF3YWl0IE1vbmVyb0RhZW1vblJwYy5jb25uZWN0VG9EYWVtb25ScGMobmV3IE1vbmVyb0RhZW1vbkNvbmZpZyhjb25maWcpKTtcbn1cblxuc2VsZi5kYWVtb25HZXRScGNDb25uZWN0aW9uID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgbGV0IGNvbm5lY3Rpb24gPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRScGNDb25uZWN0aW9uKCk7XG4gIHJldHVybiBjb25uZWN0aW9uID8gY29ubmVjdGlvbi5nZXRDb25maWcoKSA6IHVuZGVmaW5lZDtcbn1cblxuc2VsZi5kYWVtb25Jc0Nvbm5lY3RlZCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5pc0Nvbm5lY3RlZCgpO1xufVxuXG5zZWxmLmRhZW1vbkdldFZlcnNpb24gPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldFZlcnNpb24oKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uSXNUcnVzdGVkID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmlzVHJ1c3RlZCgpO1xufVxuXG5zZWxmLmRhZW1vbkdldEhlaWdodCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRIZWlnaHQoKTtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja0hhc2ggPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgaGVpZ2h0KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja0hhc2goaGVpZ2h0KTtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja1RlbXBsYXRlID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIHdhbGxldEFkZHJlc3MsIHJlc2VydmVTaXplKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tUZW1wbGF0ZSh3YWxsZXRBZGRyZXNzLCByZXNlcnZlU2l6ZSkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbkdldExhc3RCbG9ja0hlYWRlciA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0TGFzdEJsb2NrSGVhZGVyKCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2NrSGVhZGVyQnlIYXNoID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGhhc2gpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja0hlYWRlckJ5SGFzaChoYXNoKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tIZWFkZXJCeUhlaWdodCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBoZWlnaHQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja0hlYWRlckJ5SGVpZ2h0KGhlaWdodCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2NrSGVhZGVyc0J5UmFuZ2UgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCkge1xuICBsZXQgYmxvY2tIZWFkZXJzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBibG9ja0hlYWRlciBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja0hlYWRlcnNCeVJhbmdlKHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpKSBibG9ja0hlYWRlcnNKc29uLnB1c2goYmxvY2tIZWFkZXIudG9Kc29uKCkpO1xuICByZXR1cm4gYmxvY2tIZWFkZXJzSnNvbjtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja0J5SGFzaCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBibG9ja0hhc2gpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja0J5SGFzaChibG9ja0hhc2gpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja3NCeUhhc2ggPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgYmxvY2tIYXNoZXMsIHN0YXJ0SGVpZ2h0LCBwcnVuZSkge1xuICBsZXQgYmxvY2tzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBibG9jayBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja3NCeUhhc2goYmxvY2tIYXNoZXMsIHN0YXJ0SGVpZ2h0LCBwcnVuZSkpIGJsb2Nrc0pzb24ucHVzaChibG9jay50b0pzb24oKSk7XG4gIHJldHVybiBibG9ja3NKc29uO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2NrQnlIZWlnaHQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgaGVpZ2h0KSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tCeUhlaWdodChoZWlnaHQpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja3NCeUhlaWdodCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBoZWlnaHRzKSB7XG4gIGxldCBibG9ja3NKc29uID0gW107XG4gIGZvciAobGV0IGJsb2NrIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2Nrc0J5SGVpZ2h0KGhlaWdodHMpKSBibG9ja3NKc29uLnB1c2goYmxvY2sudG9Kc29uKCkpO1xuICByZXR1cm4gYmxvY2tzSnNvbjtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja3NCeVJhbmdlID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpIHtcbiAgbGV0IGJsb2Nrc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgYmxvY2sgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tzQnlSYW5nZShzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSkgYmxvY2tzSnNvbi5wdXNoKGJsb2NrLnRvSnNvbigpKTtcbiAgcmV0dXJuIGJsb2Nrc0pzb247XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tzQnlSYW5nZUNodW5rZWQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgbWF4Q2h1bmtTaXplKSB7XG4gIGxldCBibG9ja3NKc29uID0gW107XG4gIGZvciAobGV0IGJsb2NrIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2Nrc0J5UmFuZ2VDaHVua2VkKHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIG1heENodW5rU2l6ZSkpIGJsb2Nrc0pzb24ucHVzaChibG9jay50b0pzb24oKSk7XG4gIHJldHVybiBibG9ja3NKc29uO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2NrSGFzaGVzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGJsb2NrSGFzaGVzLCBzdGFydEhlaWdodCkge1xuICB0aHJvdyBuZXcgRXJyb3IoXCJ3b3JrZXIuZ2V0QmxvY2tIYXNoZXMgbm90IGltcGxlbWVudGVkXCIpO1xufVxuXG4vLyBUT0RPOiBmYWN0b3IgY29tbW9uIGNvZGUgd2l0aCBzZWxmLmdldFR4cygpXG5zZWxmLmRhZW1vbkdldFR4cyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCB0eEhhc2hlcywgcHJ1bmUpIHtcbiAgXG4gIC8vIGdldCB0eHNcbiAgbGV0IHR4cyA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldFR4cyh0eEhhc2hlcywgcHJ1bmUpO1xuICBcbiAgLy8gY29sbGVjdCB1bmlxdWUgYmxvY2tzIHRvIHByZXNlcnZlIG1vZGVsIHJlbGF0aW9uc2hpcHMgYXMgdHJlZXMgKGJhc2VkIG9uIG1vbmVyb193YXNtX2JyaWRnZS5jcHA6OmdldF90eHMpXG4gIGxldCBibG9ja3MgPSBbXTtcbiAgbGV0IHVuY29uZmlybWVkQmxvY2sgPSB1bmRlZmluZWRcbiAgbGV0IHNlZW5CbG9ja3MgPSBuZXcgU2V0KCk7XG4gIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgIGlmICghdHguZ2V0QmxvY2soKSkge1xuICAgICAgaWYgKCF1bmNvbmZpcm1lZEJsb2NrKSB1bmNvbmZpcm1lZEJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0VHhzKFtdKTtcbiAgICAgIHR4LnNldEJsb2NrKHVuY29uZmlybWVkQmxvY2spO1xuICAgICAgdW5jb25maXJtZWRCbG9jay5nZXRUeHMoKS5wdXNoKHR4KTtcbiAgICB9XG4gICAgaWYgKCFzZWVuQmxvY2tzLmhhcyh0eC5nZXRCbG9jaygpKSkge1xuICAgICAgc2VlbkJsb2Nrcy5hZGQodHguZ2V0QmxvY2soKSk7XG4gICAgICBibG9ja3MucHVzaCh0eC5nZXRCbG9jaygpKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIHNlcmlhbGl6ZSBibG9ja3MgdG8ganNvblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGJsb2Nrcy5sZW5ndGg7IGkrKykgYmxvY2tzW2ldID0gYmxvY2tzW2ldLnRvSnNvbigpO1xuICByZXR1cm4gYmxvY2tzO1xufVxuXG5zZWxmLmRhZW1vbkdldFR4SGV4ZXMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgdHhIYXNoZXMsIHBydW5lKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRUeEhleGVzKHR4SGFzaGVzLCBwcnVuZSk7XG59XG5cbnNlbGYuZGFlbW9uR2V0TWluZXJUeFN1bSA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBoZWlnaHQsIG51bUJsb2Nrcykge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldE1pbmVyVHhTdW0oaGVpZ2h0LCBudW1CbG9ja3MpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRGZWVFc3RpbWF0ZSA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBncmFjZUJsb2Nrcykge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEZlZUVzdGltYXRlKGdyYWNlQmxvY2tzKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uU3VibWl0VHhIZXggPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgdHhIZXgsIGRvTm90UmVsYXkpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5zdWJtaXRUeEhleCh0eEhleCwgZG9Ob3RSZWxheSkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vblJlbGF5VHhzQnlIYXNoID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIHR4SGFzaGVzKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5yZWxheVR4c0J5SGFzaCh0eEhhc2hlcyk7XG59XG5cbnNlbGYuZGFlbW9uR2V0VHhQb29sID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgbGV0IHR4cyA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldFR4UG9vbCgpO1xuICBsZXQgYmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soKS5zZXRUeHModHhzKTtcbiAgZm9yIChsZXQgdHggb2YgdHhzKSB0eC5zZXRCbG9jayhibG9jaylcbiAgcmV0dXJuIGJsb2NrLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbkdldFR4UG9vbEhhc2hlcyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRUeFBvb2xIYXNoZXMoKTtcbn1cblxuLy9hc3luYyBnZXRUeFBvb2xCYWNrbG9nKCkge1xuLy8gIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbi8vfVxuXG5zZWxmLmRhZW1vbkdldFR4UG9vbFN0YXRzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRUeFBvb2xTdGF0cygpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25GbHVzaFR4UG9vbCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBoYXNoZXMpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmZsdXNoVHhQb29sKGhhc2hlcyk7XG59XG5cbnNlbGYuZGFlbW9uR2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGtleUltYWdlcykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0S2V5SW1hZ2VTcGVudFN0YXR1c2VzKGtleUltYWdlcyk7XG59XG5cbi8vXG4vL2FzeW5jIGdldE91dHB1dHMob3V0cHV0cykge1xuLy8gIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbi8vfVxuXG5zZWxmLmRhZW1vbkdldE91dHB1dEhpc3RvZ3JhbSA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBhbW91bnRzLCBtaW5Db3VudCwgbWF4Q291bnQsIGlzVW5sb2NrZWQsIHJlY2VudEN1dG9mZikge1xuICBsZXQgZW50cmllc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgZW50cnkgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0T3V0cHV0SGlzdG9ncmFtKGFtb3VudHMsIG1pbkNvdW50LCBtYXhDb3VudCwgaXNVbmxvY2tlZCwgcmVjZW50Q3V0b2ZmKSkge1xuICAgIGVudHJpZXNKc29uLnB1c2goZW50cnkudG9Kc29uKCkpO1xuICB9XG4gIHJldHVybiBlbnRyaWVzSnNvbjtcbn1cblxuLy9cbi8vYXN5bmMgZ2V0T3V0cHV0RGlzdHJpYnV0aW9uKGFtb3VudHMsIGN1bXVsYXRpdmUsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpIHtcbi8vICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4vL31cblxuc2VsZi5kYWVtb25HZXRJbmZvID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRJbmZvKCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbkdldFN5bmNJbmZvID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRTeW5jSW5mbygpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRIYXJkRm9ya0luZm8gPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEhhcmRGb3JrSW5mbygpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRBbHRDaGFpbnMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICBsZXQgYWx0Q2hhaW5zSnNvbiA9IFtdO1xuICBmb3IgKGxldCBhbHRDaGFpbiBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRBbHRDaGFpbnMoKSkgYWx0Q2hhaW5zSnNvbi5wdXNoKGFsdENoYWluLnRvSnNvbigpKTtcbiAgcmV0dXJuIGFsdENoYWluc0pzb247XG59XG5cbnNlbGYuZGFlbW9uR2V0QWx0QmxvY2tIYXNoZXMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QWx0QmxvY2tIYXNoZXMoKTtcbn1cblxuc2VsZi5kYWVtb25HZXREb3dubG9hZExpbWl0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldERvd25sb2FkTGltaXQoKTtcbn1cblxuc2VsZi5kYWVtb25TZXREb3dubG9hZExpbWl0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGxpbWl0KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5zZXREb3dubG9hZExpbWl0KGxpbWl0KTtcbn1cblxuc2VsZi5kYWVtb25SZXNldERvd25sb2FkTGltaXQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0ucmVzZXREb3dubG9hZExpbWl0KCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0VXBsb2FkTGltaXQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0VXBsb2FkTGltaXQoKTtcbn1cblxuc2VsZi5kYWVtb25TZXRVcGxvYWRMaW1pdCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBsaW1pdCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc2V0VXBsb2FkTGltaXQobGltaXQpO1xufVxuXG5zZWxmLmRhZW1vblJlc2V0VXBsb2FkTGltaXQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0ucmVzZXRVcGxvYWRMaW1pdCgpO1xufVxuXG5zZWxmLmRhZW1vbkdldFBlZXJzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgbGV0IHBlZXJzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBwZWVyIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldFBlZXJzKCkpIHBlZXJzSnNvbi5wdXNoKHBlZXIudG9Kc29uKCkpO1xuICByZXR1cm4gcGVlcnNKc29uO1xufVxuXG5zZWxmLmRhZW1vbkdldEtub3duUGVlcnMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICBsZXQgcGVlcnNKc29uID0gW107XG4gIGZvciAobGV0IHBlZXIgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0S25vd25QZWVycygpKSBwZWVyc0pzb24ucHVzaChwZWVyLnRvSnNvbigpKTtcbiAgcmV0dXJuIHBlZXJzSnNvbjtcbn1cblxuc2VsZi5kYWVtb25TZXRPdXRnb2luZ1BlZXJMaW1pdCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBsaW1pdCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc2V0T3V0Z29pbmdQZWVyTGltaXQobGltaXQpO1xufVxuXG5zZWxmLmRhZW1vblNldEluY29taW5nUGVlckxpbWl0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGxpbWl0KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5zZXRJbmNvbWluZ1BlZXJMaW1pdChsaW1pdCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0UGVlckJhbnMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICBsZXQgYmFuc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgYmFuIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldFBlZXJCYW5zKCkpIGJhbnNKc29uLnB1c2goYmFuLnRvSnNvbigpKTtcbiAgcmV0dXJuIGJhbnNKc29uO1xufVxuXG5zZWxmLmRhZW1vblNldFBlZXJCYW5zID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGJhbnNKc29uKSB7XG4gIGxldCBiYW5zID0gW107XG4gIGZvciAobGV0IGJhbkpzb24gb2YgYmFuc0pzb24pIGJhbnMucHVzaChuZXcgTW9uZXJvQmFuKGJhbkpzb24pKTtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnNldFBlZXJCYW5zKGJhbnMpO1xufVxuXG5zZWxmLmRhZW1vblN0YXJ0TWluaW5nID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGFkZHJlc3MsIG51bVRocmVhZHMsIGlzQmFja2dyb3VuZCwgaWdub3JlQmF0dGVyeSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc3RhcnRNaW5pbmcoYWRkcmVzcywgbnVtVGhyZWFkcywgaXNCYWNrZ3JvdW5kLCBpZ25vcmVCYXR0ZXJ5KTtcbn1cblxuc2VsZi5kYWVtb25TdG9wTWluaW5nID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnN0b3BNaW5pbmcoKTtcbn1cblxuc2VsZi5kYWVtb25HZXRNaW5pbmdTdGF0dXMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldE1pbmluZ1N0YXR1cygpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25TdWJtaXRCbG9ja3MgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgYmxvY2tCbG9icykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc3VibWl0QmxvY2tzKGJsb2NrQmxvYnMpO1xufVxuXG5zZWxmLmRhZW1vblBydW5lQmxvY2tjaGFpbiA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBjaGVjaykge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnBydW5lQmxvY2tjaGFpbihjaGVjaykpLnRvSnNvbigpO1xufVxuXG4vL2FzeW5jIGNoZWNrRm9yVXBkYXRlKCkge1xuLy8gIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbi8vfVxuLy9cbi8vYXN5bmMgZG93bmxvYWRVcGRhdGUocGF0aCkge1xuLy8gIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbi8vfVxuXG5zZWxmLmRhZW1vblN0b3AgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc3RvcCgpO1xufVxuXG5zZWxmLmRhZW1vbldhaXRGb3JOZXh0QmxvY2tIZWFkZXIgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLndhaXRGb3JOZXh0QmxvY2tIZWFkZXIoKSkudG9Kc29uKCk7XG59XG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFdBTExFVCBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuc2VsZi5vcGVuV2FsbGV0RGF0YSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBwYXRoLCBwYXNzd29yZCwgbmV0d29ya1R5cGUsIGtleXNEYXRhLCBjYWNoZURhdGEsIGRhZW1vblVyaU9yQ29uZmlnKSB7XG4gIGxldCBkYWVtb25Db25uZWN0aW9uID0gZGFlbW9uVXJpT3JDb25maWcgPyBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbihkYWVtb25VcmlPckNvbmZpZykgOiB1bmRlZmluZWQ7XG4gIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdID0gYXdhaXQgTW9uZXJvV2FsbGV0RnVsbC5vcGVuV2FsbGV0KHtwYXRoOiBcIlwiLCBwYXNzd29yZDogcGFzc3dvcmQsIG5ldHdvcmtUeXBlOiBuZXR3b3JrVHlwZSwga2V5c0RhdGE6IGtleXNEYXRhLCBjYWNoZURhdGE6IGNhY2hlRGF0YSwgc2VydmVyOiBkYWVtb25Db25uZWN0aW9uLCBwcm94eVRvV29ya2VyOiBmYWxzZX0pO1xuICBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zZXRCcm93c2VyTWFpblBhdGgocGF0aCk7XG59XG5cbnNlbGYuY3JlYXRlV2FsbGV0S2V5cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBjb25maWdKc29uKSB7XG4gIGxldCBjb25maWcgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKGNvbmZpZ0pzb24pO1xuICBjb25maWcuc2V0UHJveHlUb1dvcmtlcihmYWxzZSk7XG4gIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdID0gYXdhaXQgTW9uZXJvV2FsbGV0S2V5cy5jcmVhdGVXYWxsZXQoY29uZmlnKTtcbn1cblxuc2VsZi5jcmVhdGVXYWxsZXRGdWxsID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGNvbmZpZ0pzb24pIHtcbiAgbGV0IGNvbmZpZyA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcoY29uZmlnSnNvbik7XG4gIGxldCBwYXRoID0gY29uZmlnLmdldFBhdGgoKTtcbiAgY29uZmlnLnNldFBhdGgoXCJcIik7XG4gIGNvbmZpZy5zZXRQcm94eVRvV29ya2VyKGZhbHNlKTtcbiAgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0gPSBhd2FpdCBNb25lcm9XYWxsZXRGdWxsLmNyZWF0ZVdhbGxldChjb25maWcpO1xuICBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zZXRCcm93c2VyTWFpblBhdGgocGF0aCk7XG59XG5cbnNlbGYuaXNWaWV3T25seSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pc1ZpZXdPbmx5KCk7XG59XG5cbnNlbGYuZ2V0TmV0d29ya1R5cGUgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0TmV0d29ya1R5cGUoKTtcbn1cblxuLy9cbi8vYXN5bmMgZ2V0VmVyc2lvbigpIHtcbi8vICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4vL31cblxuc2VsZi5nZXRTZWVkID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFNlZWQoKTtcbn1cblxuc2VsZi5nZXRTZWVkTGFuZ3VhZ2UgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0U2VlZExhbmd1YWdlKCk7XG59XG5cbnNlbGYuZ2V0U2VlZExhbmd1YWdlcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRTZWVkTGFuZ3VhZ2VzKCk7XG59XG5cbnNlbGYuZ2V0UHJpdmF0ZVNwZW5kS2V5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFByaXZhdGVTcGVuZEtleSgpO1xufVxuXG5zZWxmLmdldFByaXZhdGVWaWV3S2V5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFByaXZhdGVWaWV3S2V5KCk7XG59XG5cbnNlbGYuZ2V0UHVibGljVmlld0tleSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRQdWJsaWNWaWV3S2V5KCk7XG59XG5cbnNlbGYuZ2V0UHVibGljU3BlbmRLZXkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0UHVibGljU3BlbmRLZXkoKTtcbn1cblxuc2VsZi5nZXRBZGRyZXNzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldEFkZHJlc3MoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG59XG5cbnNlbGYuZ2V0QWRkcmVzc0luZGV4ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFkZHJlc3MpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRBZGRyZXNzSW5kZXgoYWRkcmVzcykpLnRvSnNvbigpO1xufVxuXG5zZWxmLnNldFN1YmFkZHJlc3NMYWJlbCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4LCBsYWJlbCkge1xuICBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zZXRTdWJhZGRyZXNzTGFiZWwoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCwgbGFiZWwpO1xufVxuXG5zZWxmLmdldEludGVncmF0ZWRBZGRyZXNzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHN0YW5kYXJkQWRkcmVzcywgcGF5bWVudElkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0SW50ZWdyYXRlZEFkZHJlc3Moc3RhbmRhcmRBZGRyZXNzLCBwYXltZW50SWQpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBpbnRlZ3JhdGVkQWRkcmVzcykge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmRlY29kZUludGVncmF0ZWRBZGRyZXNzKGludGVncmF0ZWRBZGRyZXNzKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuc2V0RGFlbW9uQ29ubmVjdGlvbiA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBjb25maWcpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnNldERhZW1vbkNvbm5lY3Rpb24oY29uZmlnID8gbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24oT2JqZWN0LmFzc2lnbihjb25maWcsIHtwcm94eVRvV29ya2VyOiBmYWxzZX0pKSA6IHVuZGVmaW5lZCk7XG59XG5cbnNlbGYuZ2V0RGFlbW9uQ29ubmVjdGlvbiA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIGxldCBjb25uZWN0aW9uID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0RGFlbW9uQ29ubmVjdGlvbigpO1xuICByZXR1cm4gY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0Q29uZmlnKCkgOiB1bmRlZmluZWQ7XG59XG5cbnNlbGYuaXNDb25uZWN0ZWRUb0RhZW1vbiA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pc0Nvbm5lY3RlZFRvRGFlbW9uKCk7XG59XG5cbnNlbGYuZ2V0UmVzdG9yZUhlaWdodCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRSZXN0b3JlSGVpZ2h0KCk7XG59XG5cbnNlbGYuc2V0UmVzdG9yZUhlaWdodCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCByZXN0b3JlSGVpZ2h0KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zZXRSZXN0b3JlSGVpZ2h0KHJlc3RvcmVIZWlnaHQpO1xufVxuXG5zZWxmLmdldERhZW1vbkhlaWdodCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXREYWVtb25IZWlnaHQoKTtcbn1cblxuc2VsZi5nZXREYWVtb25NYXhQZWVySGVpZ2h0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldERhZW1vbk1heFBlZXJIZWlnaHQoKVxufVxuXG5zZWxmLmdldEhlaWdodEJ5RGF0ZSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB5ZWFyLCBtb250aCwgZGF5KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRIZWlnaHRCeURhdGUoeWVhciwgbW9udGgsIGRheSk7XG59XG5cbnNlbGYuaXNEYWVtb25TeW5jZWQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaXNEYWVtb25TeW5jZWQoKTtcbn1cblxuc2VsZi5nZXRIZWlnaHQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0SGVpZ2h0KCk7XG59XG5cbnNlbGYuYWRkTGlzdGVuZXIgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbGlzdGVuZXJJZCkge1xuICBcbiAgLyoqXG4gICAqIEludGVybmFsIGxpc3RlbmVyIHRvIGJyaWRnZSBub3RpZmljYXRpb25zIHRvIGV4dGVybmFsIGxpc3RlbmVycy5cbiAgICogXG4gICAqIFRPRE86IE1vbmVyb1dhbGxldExpc3RlbmVyIGlzIG5vdCBkZWZpbmVkIHVudGlsIHNjcmlwdHMgaW1wb3J0ZWRcbiAgICogXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBjbGFzcyBXYWxsZXRXb3JrZXJIZWxwZXJMaXN0ZW5lciBleHRlbmRzIE1vbmVyb1dhbGxldExpc3RlbmVyIHtcblxuICAgIHByb3RlY3RlZCB3YWxsZXRJZDogc3RyaW5nO1xuICAgIHByb3RlY3RlZCBpZDogc3RyaW5nO1xuICAgIHByb3RlY3RlZCB3b3JrZXI6IFdvcmtlcjtcbiAgICBcbiAgICBjb25zdHJ1Y3Rvcih3YWxsZXRJZCwgaWQsIHdvcmtlcikge1xuICAgICAgc3VwZXIoKTtcbiAgICAgIHRoaXMud2FsbGV0SWQgPSB3YWxsZXRJZDtcbiAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICAgIHRoaXMud29ya2VyID0gd29ya2VyO1xuICAgIH1cbiAgICBcbiAgICBnZXRJZCgpIHtcbiAgICAgIHJldHVybiB0aGlzLmlkO1xuICAgIH1cbiAgICBcbiAgICBhc3luYyBvblN5bmNQcm9ncmVzcyhoZWlnaHQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIHBlcmNlbnREb25lLCBtZXNzYWdlKSB7XG4gICAgICB0aGlzLndvcmtlci5wb3N0TWVzc2FnZShbdGhpcy53YWxsZXRJZCwgXCJvblN5bmNQcm9ncmVzc19cIiArIHRoaXMuZ2V0SWQoKSwgaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZV0pO1xuICAgIH1cblxuICAgIGFzeW5jIG9uTmV3QmxvY2soaGVpZ2h0KSB7IFxuICAgICAgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2UoW3RoaXMud2FsbGV0SWQsIFwib25OZXdCbG9ja19cIiArIHRoaXMuZ2V0SWQoKSwgaGVpZ2h0XSk7XG4gICAgfVxuICAgIFxuICAgIGFzeW5jIG9uQmFsYW5jZXNDaGFuZ2VkKG5ld0JhbGFuY2UsIG5ld1VubG9ja2VkQmFsYW5jZSkge1xuICAgICAgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2UoW3RoaXMud2FsbGV0SWQsIFwib25CYWxhbmNlc0NoYW5nZWRfXCIgKyB0aGlzLmdldElkKCksIG5ld0JhbGFuY2UudG9TdHJpbmcoKSwgbmV3VW5sb2NrZWRCYWxhbmNlLnRvU3RyaW5nKCldKTtcbiAgICB9XG5cbiAgIGFzeW5jIG9uT3V0cHV0UmVjZWl2ZWQob3V0cHV0KSB7XG4gICAgICBsZXQgYmxvY2sgPSBvdXRwdXQuZ2V0VHgoKS5nZXRCbG9jaygpO1xuICAgICAgaWYgKGJsb2NrID09PSB1bmRlZmluZWQpIGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0VHhzKFtvdXRwdXQuZ2V0VHgoKV0pO1xuICAgICAgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2UoW3RoaXMud2FsbGV0SWQsIFwib25PdXRwdXRSZWNlaXZlZF9cIiArIHRoaXMuZ2V0SWQoKSwgYmxvY2sudG9Kc29uKCldKTsgIC8vIHNlcmlhbGl6ZSBmcm9tIHJvb3QgYmxvY2tcbiAgICB9XG4gICAgXG4gICAgYXN5bmMgb25PdXRwdXRTcGVudChvdXRwdXQpIHtcbiAgICAgIGxldCBibG9jayA9IG91dHB1dC5nZXRUeCgpLmdldEJsb2NrKCk7XG4gICAgICBpZiAoYmxvY2sgPT09IHVuZGVmaW5lZCkgYmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soKS5zZXRUeHMoW291dHB1dC5nZXRUeCgpXSk7XG4gICAgICB0aGlzLndvcmtlci5wb3N0TWVzc2FnZShbdGhpcy53YWxsZXRJZCwgXCJvbk91dHB1dFNwZW50X1wiICsgdGhpcy5nZXRJZCgpLCBibG9jay50b0pzb24oKV0pOyAgICAgLy8gc2VyaWFsaXplIGZyb20gcm9vdCBibG9ja1xuICAgIH1cbiAgfVxuICBcbiAgbGV0IGxpc3RlbmVyID0gbmV3IFdhbGxldFdvcmtlckhlbHBlckxpc3RlbmVyKHdhbGxldElkLCBsaXN0ZW5lcklkLCBzZWxmKTtcbiAgaWYgKCFzZWxmLmxpc3RlbmVycykgc2VsZi5saXN0ZW5lcnMgPSBbXTtcbiAgc2VsZi5saXN0ZW5lcnMucHVzaChsaXN0ZW5lcik7XG4gIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbn1cblxuc2VsZi5yZW1vdmVMaXN0ZW5lciA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBsaXN0ZW5lcklkKSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc2VsZi5saXN0ZW5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoc2VsZi5saXN0ZW5lcnNbaV0uZ2V0SWQoKSAhPT0gbGlzdGVuZXJJZCkgY29udGludWU7XG4gICAgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0ucmVtb3ZlTGlzdGVuZXIoc2VsZi5saXN0ZW5lcnNbaV0pO1xuICAgIHNlbGYubGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICByZXR1cm47XG4gIH1cbiAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTGlzdGVuZXIgaXMgbm90IHJlZ2lzdGVyZWQgd2l0aCB3YWxsZXRcIik7XG59XG5cbnNlbGYuaXNTeW5jZWQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaXNTeW5jZWQoKTtcbn1cblxuc2VsZi5zeW5jID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHN0YXJ0SGVpZ2h0LCBhbGxvd0NvbmN1cnJlbnRDYWxscykge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN5bmModW5kZWZpbmVkLCBzdGFydEhlaWdodCwgYWxsb3dDb25jdXJyZW50Q2FsbHMpKTtcbn1cblxuc2VsZi5zdGFydFN5bmNpbmcgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgc3luY1BlcmlvZEluTXMpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN0YXJ0U3luY2luZyhzeW5jUGVyaW9kSW5Ncyk7XG59XG5cbnNlbGYuc3RvcFN5bmNpbmcgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc3RvcFN5bmNpbmcoKTtcbn1cblxuc2VsZi5zY2FuVHhzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaGVzKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zY2FuVHhzKHR4SGFzaGVzKTtcbn1cblxuc2VsZi5yZXNjYW5TcGVudCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5yZXNjYW5TcGVudCgpO1xufVxuXG5zZWxmLnJlc2NhbkJsb2NrY2hhaW4gPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0ucmVzY2FuQmxvY2tjaGFpbigpO1xufVxuXG5zZWxmLmdldEJhbGFuY2UgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldEJhbGFuY2UoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkpLnRvU3RyaW5nKCk7XG59XG5cbnNlbGYuZ2V0VW5sb2NrZWRCYWxhbmNlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRVbmxvY2tlZEJhbGFuY2UoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkpLnRvU3RyaW5nKCk7XG59XG5cbnNlbGYuZ2V0QWNjb3VudHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgaW5jbHVkZVN1YmFkZHJlc3NlcywgdGFnKSB7XG4gIGxldCBhY2NvdW50SnNvbnMgPSBbXTtcbiAgZm9yIChsZXQgYWNjb3VudCBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRBY2NvdW50cyhpbmNsdWRlU3ViYWRkcmVzc2VzLCB0YWcpKSBhY2NvdW50SnNvbnMucHVzaChhY2NvdW50LnRvSnNvbigpKTtcbiAgcmV0dXJuIGFjY291bnRKc29ucztcbn1cblxuc2VsZi5nZXRBY2NvdW50ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFjY291bnRJZHgsIGluY2x1ZGVTdWJhZGRyZXNzZXMpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRBY2NvdW50KGFjY291bnRJZHgsIGluY2x1ZGVTdWJhZGRyZXNzZXMpKS50b0pzb24oKTtcbn1cblxuc2VsZi5jcmVhdGVBY2NvdW50ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGxhYmVsKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uY3JlYXRlQWNjb3VudChsYWJlbCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmdldFN1YmFkZHJlc3NlcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSW5kaWNlcykge1xuICBsZXQgc3ViYWRkcmVzc0pzb25zID0gW107XG4gIGZvciAobGV0IHN1YmFkZHJlc3Mgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJbmRpY2VzKSkgc3ViYWRkcmVzc0pzb25zLnB1c2goc3ViYWRkcmVzcy50b0pzb24oKSk7XG4gIHJldHVybiBzdWJhZGRyZXNzSnNvbnM7XG59XG5cbnNlbGYuY3JlYXRlU3ViYWRkcmVzcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SWR4LCBsYWJlbCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmNyZWF0ZVN1YmFkZHJlc3MoYWNjb3VudElkeCwgbGFiZWwpKS50b0pzb24oKTtcbn1cblxuLy8gVE9ETzogZWFzaWVyIG9yIG1vcmUgZWZmaWNpZW50IHdheSB0aGFuIHNlcmlhbGl6aW5nIGZyb20gcm9vdCBibG9ja3M/XG5zZWxmLmdldFR4cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBibG9ja0pzb25RdWVyeSkge1xuICBcbiAgLy8gZGVzZXJpYWxpemUgcXVlcnkgd2hpY2ggaXMganNvbiBzdHJpbmcgcm9vdGVkIGF0IGJsb2NrXG4gIGxldCBxdWVyeSA9IG5ldyBNb25lcm9CbG9jayhibG9ja0pzb25RdWVyeSwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWF9RVUVSWSkuZ2V0VHhzKClbMF07XG4gIFxuICAvLyBnZXQgdHhzXG4gIGxldCB0eHMgPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRUeHMocXVlcnkpO1xuICBcbiAgLy8gY29sbGVjdCB1bmlxdWUgYmxvY2tzIHRvIHByZXNlcnZlIG1vZGVsIHJlbGF0aW9uc2hpcHMgYXMgdHJlZXMgKGJhc2VkIG9uIG1vbmVyb193YXNtX2JyaWRnZS5jcHA6OmdldF90eHMpXG4gIGxldCBzZWVuQmxvY2tzID0gbmV3IFNldCgpO1xuICBsZXQgdW5jb25maXJtZWRCbG9jayA9IHVuZGVmaW5lZDtcbiAgbGV0IGJsb2NrcyA9IFtdO1xuICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICBpZiAoIXR4LmdldEJsb2NrKCkpIHtcbiAgICAgIGlmICghdW5jb25maXJtZWRCbG9jaykgdW5jb25maXJtZWRCbG9jayA9IG5ldyBNb25lcm9CbG9jaygpLnNldFR4cyhbXSk7XG4gICAgICB0eC5zZXRCbG9jayh1bmNvbmZpcm1lZEJsb2NrKTtcbiAgICAgIHVuY29uZmlybWVkQmxvY2suZ2V0VHhzKCkucHVzaCh0eCk7XG4gICAgfVxuICAgIGlmICghc2VlbkJsb2Nrcy5oYXModHguZ2V0QmxvY2soKSkpIHtcbiAgICAgIHNlZW5CbG9ja3MuYWRkKHR4LmdldEJsb2NrKCkpO1xuICAgICAgYmxvY2tzLnB1c2godHguZ2V0QmxvY2soKSk7XG4gICAgfVxuICB9XG4gIFxuICAvLyBzZXJpYWxpemUgYmxvY2tzIHRvIGpzb25cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBibG9ja3MubGVuZ3RoOyBpKyspIGJsb2Nrc1tpXSA9IGJsb2Nrc1tpXS50b0pzb24oKTtcbiAgcmV0dXJuIHtibG9ja3M6IGJsb2Nrc307XG59XG5cbnNlbGYuZ2V0VHJhbnNmZXJzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGJsb2NrSnNvblF1ZXJ5KSB7XG4gIFxuICAvLyBkZXNlcmlhbGl6ZSBxdWVyeSB3aGljaCBpcyBqc29uIHN0cmluZyByb290ZWQgYXQgYmxvY2tcbiAgbGV0IHF1ZXJ5ID0gKG5ldyBNb25lcm9CbG9jayhibG9ja0pzb25RdWVyeSwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWF9RVUVSWSkuZ2V0VHhzKClbMF0gYXMgTW9uZXJvVHhRdWVyeSkuZ2V0VHJhbnNmZXJRdWVyeSgpO1xuICBcbiAgLy8gZ2V0IHRyYW5zZmVyc1xuICBsZXQgdHJhbnNmZXJzID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0VHJhbnNmZXJzKHF1ZXJ5KTtcbiAgXG4gIC8vIGNvbGxlY3QgdW5pcXVlIGJsb2NrcyB0byBwcmVzZXJ2ZSBtb2RlbCByZWxhdGlvbnNoaXBzIGFzIHRyZWVcbiAgbGV0IHVuY29uZmlybWVkQmxvY2sgPSB1bmRlZmluZWQ7XG4gIGxldCBibG9ja3MgPSBbXTtcbiAgbGV0IHNlZW5CbG9ja3MgPSBuZXcgU2V0KCk7XG4gIGZvciAobGV0IHRyYW5zZmVyIG9mIHRyYW5zZmVycykge1xuICAgIGxldCB0eCA9IHRyYW5zZmVyLmdldFR4KCk7XG4gICAgaWYgKCF0eC5nZXRCbG9jaygpKSB7XG4gICAgICBpZiAoIXVuY29uZmlybWVkQmxvY2spIHVuY29uZmlybWVkQmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soKS5zZXRUeHMoW10pO1xuICAgICAgdHguc2V0QmxvY2sodW5jb25maXJtZWRCbG9jayk7XG4gICAgICB1bmNvbmZpcm1lZEJsb2NrLmdldFR4cygpLnB1c2godHgpO1xuICAgIH1cbiAgICBpZiAoIXNlZW5CbG9ja3MuaGFzKHR4LmdldEJsb2NrKCkpKSB7XG4gICAgICBzZWVuQmxvY2tzLmFkZCh0eC5nZXRCbG9jaygpKTtcbiAgICAgIGJsb2Nrcy5wdXNoKHR4LmdldEJsb2NrKCkpO1xuICAgIH1cbiAgfVxuICBcbiAgLy8gc2VyaWFsaXplIGJsb2NrcyB0byBqc29uXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYmxvY2tzLmxlbmd0aDsgaSsrKSBibG9ja3NbaV0gPSBibG9ja3NbaV0udG9Kc29uKCk7XG4gIHJldHVybiBibG9ja3M7XG59XG5cbnNlbGYuZ2V0T3V0cHV0cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBibG9ja0pzb25RdWVyeSkge1xuXG4gIC8vIGRlc2VyaWFsaXplIHF1ZXJ5IHdoaWNoIGlzIGpzb24gc3RyaW5nIHJvb3RlZCBhdCBibG9ja1xuICBsZXQgcXVlcnkgPSAobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvblF1ZXJ5LCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYX1FVRVJZKS5nZXRUeHMoKVswXSBhcyBNb25lcm9UeFF1ZXJ5KS5nZXRPdXRwdXRRdWVyeSgpO1xuICBcbiAgLy8gZ2V0IG91dHB1dHNcbiAgbGV0IG91dHB1dHMgPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRPdXRwdXRzKHF1ZXJ5KTtcbiAgXG4gIC8vIGNvbGxlY3QgdW5pcXVlIGJsb2NrcyB0byBwcmVzZXJ2ZSBtb2RlbCByZWxhdGlvbnNoaXBzIGFzIHRyZWVcbiAgbGV0IHVuY29uZmlybWVkQmxvY2sgPSB1bmRlZmluZWQ7XG4gIGxldCBibG9ja3MgPSBbXTtcbiAgbGV0IHNlZW5CbG9ja3MgPSBuZXcgU2V0KCk7XG4gIGZvciAobGV0IG91dHB1dCBvZiBvdXRwdXRzKSB7XG4gICAgbGV0IHR4ID0gb3V0cHV0LmdldFR4KCk7XG4gICAgaWYgKCF0eC5nZXRCbG9jaygpKSB7XG4gICAgICBpZiAoIXVuY29uZmlybWVkQmxvY2spIHVuY29uZmlybWVkQmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soKS5zZXRUeHMoW10pO1xuICAgICAgdHguc2V0QmxvY2sodW5jb25maXJtZWRCbG9jayk7XG4gICAgICB1bmNvbmZpcm1lZEJsb2NrLmdldFR4cygpLnB1c2godHgpO1xuICAgIH1cbiAgICBpZiAoIXNlZW5CbG9ja3MuaGFzKHR4LmdldEJsb2NrKCkpKSB7XG4gICAgICBzZWVuQmxvY2tzLmFkZCh0eC5nZXRCbG9jaygpKTtcbiAgICAgIGJsb2Nrcy5wdXNoKHR4LmdldEJsb2NrKCkpO1xuICAgIH1cbiAgfVxuICBcbiAgLy8gc2VyaWFsaXplIGJsb2NrcyB0byBqc29uXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYmxvY2tzLmxlbmd0aDsgaSsrKSBibG9ja3NbaV0gPSBibG9ja3NbaV0udG9Kc29uKCk7XG4gIHJldHVybiBibG9ja3M7XG59XG5cbnNlbGYuZXhwb3J0T3V0cHV0cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhbGwpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmV4cG9ydE91dHB1dHMoYWxsKTtcbn1cblxuc2VsZi5pbXBvcnRPdXRwdXRzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG91dHB1dHNIZXgpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmltcG9ydE91dHB1dHMob3V0cHV0c0hleCk7XG59XG5cbnNlbGYuZ2V0S2V5SW1hZ2VzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFsbCkge1xuICBsZXQga2V5SW1hZ2VzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBrZXlJbWFnZSBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5leHBvcnRLZXlJbWFnZXMoYWxsKSkga2V5SW1hZ2VzSnNvbi5wdXNoKGtleUltYWdlLnRvSnNvbigpKTtcbiAgcmV0dXJuIGtleUltYWdlc0pzb247XG59XG5cbnNlbGYuaW1wb3J0S2V5SW1hZ2VzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGtleUltYWdlc0pzb24pIHtcbiAgbGV0IGtleUltYWdlcyA9IFtdO1xuICBmb3IgKGxldCBrZXlJbWFnZUpzb24gb2Yga2V5SW1hZ2VzSnNvbikga2V5SW1hZ2VzLnB1c2gobmV3IE1vbmVyb0tleUltYWdlKGtleUltYWdlSnNvbikpO1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmltcG9ydEtleUltYWdlcyhrZXlJbWFnZXMpKS50b0pzb24oKTtcbn1cblxuLy9hc3luYyBnZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCgpIHtcbi8vICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4vL31cblxuc2VsZi5mcmVlemVPdXRwdXQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwga2V5SW1hZ2UpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmZyZWV6ZU91dHB1dChrZXlJbWFnZSk7XG59XG5cbnNlbGYudGhhd091dHB1dCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBrZXlJbWFnZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0udGhhd091dHB1dChrZXlJbWFnZSk7XG59XG5cbnNlbGYuaXNPdXRwdXRGcm96ZW4gPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwga2V5SW1hZ2UpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmlzT3V0cHV0RnJvemVuKGtleUltYWdlKTtcbn1cblxuc2VsZi5nZXREZWZhdWx0RmVlUHJpb3JpdHkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0RGVmYXVsdEZlZVByaW9yaXR5KCk7XG59XG5cbnNlbGYuY3JlYXRlVHhzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGNvbmZpZykge1xuICBpZiAodHlwZW9mIGNvbmZpZyA9PT0gXCJvYmplY3RcIikgY29uZmlnID0gbmV3IE1vbmVyb1R4Q29uZmlnKGNvbmZpZyk7XG4gIGxldCB0eHMgPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jcmVhdGVUeHMoY29uZmlnKTtcbiAgcmV0dXJuIHR4c1swXS5nZXRUeFNldCgpLnRvSnNvbigpO1xufVxuXG5zZWxmLnN3ZWVwT3V0cHV0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGNvbmZpZykge1xuICBpZiAodHlwZW9mIGNvbmZpZyA9PT0gXCJvYmplY3RcIikgY29uZmlnID0gbmV3IE1vbmVyb1R4Q29uZmlnKGNvbmZpZyk7XG4gIGxldCB0eCA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN3ZWVwT3V0cHV0KGNvbmZpZyk7XG4gIHJldHVybiB0eC5nZXRUeFNldCgpLnRvSnNvbigpO1xufVxuXG5zZWxmLnN3ZWVwVW5sb2NrZWQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgY29uZmlnKSB7XG4gIGlmICh0eXBlb2YgY29uZmlnID09PSBcIm9iamVjdFwiKSBjb25maWcgPSBuZXcgTW9uZXJvVHhDb25maWcoY29uZmlnKTtcbiAgbGV0IHR4cyA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN3ZWVwVW5sb2NrZWQoY29uZmlnKTtcbiAgbGV0IHR4U2V0cyA9IFtdO1xuICBmb3IgKGxldCB0eCBvZiB0eHMpIGlmICghR2VuVXRpbHMuYXJyYXlDb250YWlucyh0eFNldHMsIHR4LmdldFR4U2V0KCkpKSB0eFNldHMucHVzaCh0eC5nZXRUeFNldCgpKTtcbiAgbGV0IHR4U2V0c0pzb24gPSBbXTtcbiAgZm9yIChsZXQgdHhTZXQgb2YgdHhTZXRzKSB0eFNldHNKc29uLnB1c2godHhTZXQudG9Kc29uKCkpO1xuICByZXR1cm4gdHhTZXRzSnNvbjtcbn1cblxuc2VsZi5zd2VlcER1c3QgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgcmVsYXkpIHtcbiAgbGV0IHR4cyA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN3ZWVwRHVzdChyZWxheSk7XG4gIHJldHVybiB0eHMubGVuZ3RoID09PSAwID8ge30gOiB0eHNbMF0uZ2V0VHhTZXQoKS50b0pzb24oKTtcbn1cblxuc2VsZi5yZWxheVR4cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eE1ldGFkYXRhcykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0ucmVsYXlUeHModHhNZXRhZGF0YXMpO1xufVxuXG5zZWxmLmRlc2NyaWJlVHhTZXQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdHhTZXRKc29uKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZGVzY3JpYmVUeFNldChuZXcgTW9uZXJvVHhTZXQodHhTZXRKc29uKSkpLnRvSnNvbigpO1xufVxuXG5zZWxmLnNpZ25UeHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdW5zaWduZWRUeEhleCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2lnblR4cyh1bnNpZ25lZFR4SGV4KTtcbn1cblxuc2VsZi5zdWJtaXRUeHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgc2lnbmVkVHhIZXgpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN1Ym1pdFR4cyhzaWduZWRUeEhleCk7XG59XG5cbnNlbGYuc2lnbk1lc3NhZ2UgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbWVzc2FnZSwgc2lnbmF0dXJlVHlwZSwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2lnbk1lc3NhZ2UobWVzc2FnZSwgc2lnbmF0dXJlVHlwZSwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG59XG5cbnNlbGYudmVyaWZ5TWVzc2FnZSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBtZXNzYWdlLCBhZGRyZXNzLCBzaWduYXR1cmUpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS52ZXJpZnlNZXNzYWdlKG1lc3NhZ2UsIGFkZHJlc3MsIHNpZ25hdHVyZSkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmdldFR4S2V5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0VHhLZXkodHhIYXNoKTtcbn1cblxuc2VsZi5jaGVja1R4S2V5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaCwgdHhLZXksIGFkZHJlc3MpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jaGVja1R4S2V5KHR4SGFzaCwgdHhLZXksIGFkZHJlc3MpKS50b0pzb24oKTtcbn1cblxuc2VsZi5nZXRUeFByb29mID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaCwgYWRkcmVzcywgbWVzc2FnZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0VHhQcm9vZih0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UpO1xufVxuXG5zZWxmLmNoZWNrVHhQcm9vZiA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmNoZWNrVHhQcm9vZih0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmdldFNwZW5kUHJvb2YgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdHhIYXNoLCBtZXNzYWdlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRTcGVuZFByb29mKHR4SGFzaCwgbWVzc2FnZSk7XG59XG5cbnNlbGYuY2hlY2tTcGVuZFByb29mID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaCwgbWVzc2FnZSwgc2lnbmF0dXJlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jaGVja1NwZW5kUHJvb2YodHhIYXNoLCBtZXNzYWdlLCBzaWduYXR1cmUpO1xufVxuXG5zZWxmLmdldFJlc2VydmVQcm9vZldhbGxldCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBtZXNzYWdlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRSZXNlcnZlUHJvb2ZXYWxsZXQobWVzc2FnZSk7XG59XG5cbnNlbGYuZ2V0UmVzZXJ2ZVByb29mQWNjb3VudCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SWR4LCBhbW91bnRTdHIsIG1lc3NhZ2UpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFJlc2VydmVQcm9vZkFjY291bnQoYWNjb3VudElkeCwgYW1vdW50U3RyLCBtZXNzYWdlKTtcbn1cblxuc2VsZi5jaGVja1Jlc2VydmVQcm9vZiA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jaGVja1Jlc2VydmVQcm9vZihhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUpKS50b0pzb24oKTtcbn1cblxuc2VsZi5nZXRUeE5vdGVzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaGVzKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRUeE5vdGVzKHR4SGFzaGVzKTtcbn1cblxuc2VsZi5zZXRUeE5vdGVzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaGVzLCB0eE5vdGVzKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zZXRUeE5vdGVzKHR4SGFzaGVzLCB0eE5vdGVzKTtcbn1cblxuc2VsZi5nZXRBZGRyZXNzQm9va0VudHJpZXMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgZW50cnlJbmRpY2VzKSB7XG4gIGxldCBlbnRyaWVzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBlbnRyeSBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRBZGRyZXNzQm9va0VudHJpZXMoZW50cnlJbmRpY2VzKSkgZW50cmllc0pzb24ucHVzaChlbnRyeS50b0pzb24oKSk7XG4gIHJldHVybiBlbnRyaWVzSnNvbjtcbn1cblxuc2VsZi5hZGRBZGRyZXNzQm9va0VudHJ5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFkZHJlc3MsIGRlc2NyaXB0aW9uKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5hZGRBZGRyZXNzQm9va0VudHJ5KGFkZHJlc3MsIGRlc2NyaXB0aW9uKTtcbn1cblxuc2VsZi5lZGl0QWRkcmVzc0Jvb2tFbnRyeSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBpbmRleCwgc2V0QWRkcmVzcywgYWRkcmVzcywgc2V0RGVzY3JpcHRpb24sIGRlc2NyaXB0aW9uKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5lZGl0QWRkcmVzc0Jvb2tFbnRyeShpbmRleCwgc2V0QWRkcmVzcywgYWRkcmVzcywgc2V0RGVzY3JpcHRpb24sIGRlc2NyaXB0aW9uKTtcbn1cblxuc2VsZi5kZWxldGVBZGRyZXNzQm9va0VudHJ5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGluZGV4KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5kZWxldGVBZGRyZXNzQm9va0VudHJ5KGluZGV4KTtcbn1cblxuc2VsZi50YWdBY2NvdW50cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0YWcsIGFjY291bnRJbmRpY2VzKSB7XG4gIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbn1cblxuc2VsZi51bnRhZ0FjY291bnRzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFjY291bnRJbmRpY2VzKSB7XG4gIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbn1cblxuc2VsZi5nZXRBY2NvdW50VGFncyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbn1cblxuc2VsZi5zZXRBY2NvdW50VGFnTGFiZWwgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdGFnLCBsYWJlbCkge1xuICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG59XG5cbnNlbGYuZ2V0UGF5bWVudFVyaSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBjb25maWdKc29uKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRQYXltZW50VXJpKG5ldyBNb25lcm9UeENvbmZpZyhjb25maWdKc29uKSk7XG59XG5cbnNlbGYucGFyc2VQYXltZW50VXJpID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHVyaSkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnBhcnNlUGF5bWVudFVyaSh1cmkpKS50b0pzb24oKTtcbn1cblxuc2VsZi5nZXRBdHRyaWJ1dGUgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwga2V5KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRBdHRyaWJ1dGUoa2V5KTtcbn1cblxuc2VsZi5zZXRBdHRyaWJ1dGUgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwga2V5LCB2YWx1ZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpO1xufVxuXG5zZWxmLnN0YXJ0TWluaW5nID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG51bVRocmVhZHMsIGJhY2tncm91bmRNaW5pbmcsIGlnbm9yZUJhdHRlcnkpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN0YXJ0TWluaW5nKG51bVRocmVhZHMsIGJhY2tncm91bmRNaW5pbmcsIGlnbm9yZUJhdHRlcnkpO1xufVxuXG5zZWxmLnN0b3BNaW5pbmcgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc3RvcE1pbmluZygpO1xufVxuXG5zZWxmLmlzTXVsdGlzaWdJbXBvcnROZWVkZWQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCgpO1xufVxuXG5zZWxmLmlzTXVsdGlzaWcgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaXNNdWx0aXNpZygpO1xufVxuXG5zZWxmLmdldE11bHRpc2lnSW5mbyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0TXVsdGlzaWdJbmZvKCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLnByZXBhcmVNdWx0aXNpZyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5wcmVwYXJlTXVsdGlzaWcoKTtcbn1cblxuc2VsZi5tYWtlTXVsdGlzaWcgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbXVsdGlzaWdIZXhlcywgdGhyZXNob2xkLCBwYXNzd29yZCkge1xuICByZXR1cm4gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0ubWFrZU11bHRpc2lnKG11bHRpc2lnSGV4ZXMsIHRocmVzaG9sZCwgcGFzc3dvcmQpO1xufVxuXG5zZWxmLmV4Y2hhbmdlTXVsdGlzaWdLZXlzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG11bHRpc2lnSGV4ZXMsIHBhc3N3b3JkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZXhjaGFuZ2VNdWx0aXNpZ0tleXMobXVsdGlzaWdIZXhlcywgcGFzc3dvcmQpKS50b0pzb24oKTtcbn1cblxuc2VsZi5leHBvcnRNdWx0aXNpZ0hleCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5leHBvcnRNdWx0aXNpZ0hleCgpO1xufVxuXG5zZWxmLmltcG9ydE11bHRpc2lnSGV4ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG11bHRpc2lnSGV4ZXMpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmltcG9ydE11bHRpc2lnSGV4KG11bHRpc2lnSGV4ZXMpO1xufVxuXG5zZWxmLnNpZ25NdWx0aXNpZ1R4SGV4ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG11bHRpc2lnVHhIZXgpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zaWduTXVsdGlzaWdUeEhleChtdWx0aXNpZ1R4SGV4KSkudG9Kc29uKCk7XG59XG5cbnNlbGYuc3VibWl0TXVsdGlzaWdUeEhleCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBzaWduZWRNdWx0aXNpZ1R4SGV4KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zdWJtaXRNdWx0aXNpZ1R4SGV4KHNpZ25lZE11bHRpc2lnVHhIZXgpO1xufVxuXG5zZWxmLmdldERhdGEgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0RGF0YSgpO1xufVxuXG5zZWxmLmNoYW5nZVBhc3N3b3JkID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG9sZFBhc3N3b3JkLCBuZXdQYXNzd29yZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uY2hhbmdlUGFzc3dvcmQob2xkUGFzc3dvcmQsIG5ld1Bhc3N3b3JkKTtcbn1cblxuc2VsZi5pc0Nsb3NlZCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiAhc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0gfHwgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaXNDbG9zZWQoKTtcbn1cblxuc2VsZi5jbG9zZSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBzYXZlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jbG9zZShzYXZlKTtcbiAgZGVsZXRlIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdO1xufSJdLCJtYXBwaW5ncyI6ImtHQUFBLElBQUFBLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLFNBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLFdBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFHLGFBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFJLFVBQUEsR0FBQUwsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFLLFlBQUEsR0FBQU4sc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFNLG1CQUFBLEdBQUFQLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTyxxQkFBQSxHQUFBUixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVEsZ0JBQUEsR0FBQVQsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFTLFlBQUEsR0FBQVYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFVLGVBQUEsR0FBQVgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFXLG9CQUFBLEdBQUFaLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBWSxlQUFBLEdBQUFiLHNCQUFBLENBQUFDLE9BQUE7O0FBRUEsSUFBQWEsWUFBQSxHQUFBZCxzQkFB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