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

self.daemonPruneBlockchain = async function (daemonId, check) {
  return (await self.WORKER_OBJECTS[daemonId].pruneBlockchain(check)).toJson();
};

//
//async submitBlocks(blockBlobs) {
//  throw new MoneroError("Not implemented");
//}
//
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
  return self.WORKER_OBJECTS[walletId].isClosed();
};

self.close = async function (walletId, save) {
  return self.WORKER_OBJECTS[walletId].close(save); // TODO: remove listeners and delete wallet from WORKER_OBJECTS
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfSHR0cENsaWVudCIsIl9MaWJyYXJ5VXRpbHMiLCJfTW9uZXJvQmFuIiwiX01vbmVyb0Jsb2NrIiwiX01vbmVyb0RhZW1vbkNvbmZpZyIsIl9Nb25lcm9EYWVtb25MaXN0ZW5lciIsIl9Nb25lcm9EYWVtb25ScGMiLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvS2V5SW1hZ2UiLCJfTW9uZXJvUnBjQ29ubmVjdGlvbiIsIl9Nb25lcm9UeENvbmZpZyIsIl9Nb25lcm9UeFNldCIsIl9Nb25lcm9VdGlscyIsIl9Nb25lcm9XYWxsZXRDb25maWciLCJfTW9uZXJvV2FsbGV0TGlzdGVuZXIiLCJfTW9uZXJvV2FsbGV0S2V5cyIsIl9Nb25lcm9XYWxsZXRGdWxsIiwic2VsZiIsIm9ubWVzc2FnZSIsImUiLCJpbml0T25lVGltZSIsIm9iamVjdElkIiwiZGF0YSIsImZuTmFtZSIsImNhbGxiYWNrSWQiLCJhc3NlcnQiLCJFcnJvciIsInNwbGljZSIsInBvc3RNZXNzYWdlIiwicmVzdWx0IiwiYXBwbHkiLCJlcnJvciIsIkxpYnJhcnlVdGlscyIsInNlcmlhbGl6ZUVycm9yIiwiaXNJbml0aWFsaXplZCIsIldPUktFUl9PQkpFQ1RTIiwiTW9uZXJvVXRpbHMiLCJQUk9YWV9UT19XT1JLRVIiLCJodHRwUmVxdWVzdCIsIm9wdHMiLCJIdHRwQ2xpZW50IiwicmVxdWVzdCIsIk9iamVjdCIsImFzc2lnbiIsInByb3h5VG9Xb3JrZXIiLCJlcnIiLCJzdGF0dXNDb2RlIiwiSlNPTiIsInN0cmluZ2lmeSIsInN0YXR1c01lc3NhZ2UiLCJtZXNzYWdlIiwic2V0TG9nTGV2ZWwiLCJsZXZlbCIsImdldFdhc21NZW1vcnlVc2VkIiwiZ2V0V2FzbU1vZHVsZSIsIkhFQVA4IiwibGVuZ3RoIiwidW5kZWZpbmVkIiwibW9uZXJvVXRpbHNHZXRJbnRlZ3JhdGVkQWRkcmVzcyIsIm5ldHdvcmtUeXBlIiwic3RhbmRhcmRBZGRyZXNzIiwicGF5bWVudElkIiwiZ2V0SW50ZWdyYXRlZEFkZHJlc3MiLCJ0b0pzb24iLCJtb25lcm9VdGlsc1ZhbGlkYXRlQWRkcmVzcyIsImFkZHJlc3MiLCJ2YWxpZGF0ZUFkZHJlc3MiLCJtb25lcm9VdGlsc0pzb25Ub0JpbmFyeSIsImpzb24iLCJqc29uVG9CaW5hcnkiLCJtb25lcm9VdGlsc0JpbmFyeVRvSnNvbiIsInVpbnQ4YXJyIiwiYmluYXJ5VG9Kc29uIiwibW9uZXJvVXRpbHNCaW5hcnlCbG9ja3NUb0pzb24iLCJiaW5hcnlCbG9ja3NUb0pzb24iLCJkYWVtb25BZGRMaXN0ZW5lciIsImRhZW1vbklkIiwibGlzdGVuZXJJZCIsImxpc3RlbmVyIiwiTW9uZXJvRGFlbW9uTGlzdGVuZXIiLCJvbkJsb2NrSGVhZGVyIiwiYmxvY2tIZWFkZXIiLCJkYWVtb25MaXN0ZW5lcnMiLCJhZGRMaXN0ZW5lciIsImRhZW1vblJlbW92ZUxpc3RlbmVyIiwiTW9uZXJvRXJyb3IiLCJyZW1vdmVMaXN0ZW5lciIsImNvbm5lY3REYWVtb25ScGMiLCJjb25maWciLCJNb25lcm9EYWVtb25ScGMiLCJjb25uZWN0VG9EYWVtb25ScGMiLCJNb25lcm9EYWVtb25Db25maWciLCJkYWVtb25HZXRScGNDb25uZWN0aW9uIiwiY29ubmVjdGlvbiIsImdldFJwY0Nvbm5lY3Rpb24iLCJnZXRDb25maWciLCJkYWVtb25Jc0Nvbm5lY3RlZCIsImlzQ29ubmVjdGVkIiwiZGFlbW9uR2V0VmVyc2lvbiIsImdldFZlcnNpb24iLCJkYWVtb25Jc1RydXN0ZWQiLCJpc1RydXN0ZWQiLCJkYWVtb25HZXRIZWlnaHQiLCJnZXRIZWlnaHQiLCJkYWVtb25HZXRCbG9ja0hhc2giLCJoZWlnaHQiLCJnZXRCbG9ja0hhc2giLCJkYWVtb25HZXRCbG9ja1RlbXBsYXRlIiwid2FsbGV0QWRkcmVzcyIsInJlc2VydmVTaXplIiwiZ2V0QmxvY2tUZW1wbGF0ZSIsImRhZW1vbkdldExhc3RCbG9ja0hlYWRlciIsImdldExhc3RCbG9ja0hlYWRlciIsImRhZW1vbkdldEJsb2NrSGVhZGVyQnlIYXNoIiwiaGFzaCIsImdldEJsb2NrSGVhZGVyQnlIYXNoIiwiZGFlbW9uR2V0QmxvY2tIZWFkZXJCeUhlaWdodCIsImdldEJsb2NrSGVhZGVyQnlIZWlnaHQiLCJkYWVtb25HZXRCbG9ja0hlYWRlcnNCeVJhbmdlIiwic3RhcnRIZWlnaHQiLCJlbmRIZWlnaHQiLCJibG9ja0hlYWRlcnNKc29uIiwiZ2V0QmxvY2tIZWFkZXJzQnlSYW5nZSIsInB1c2giLCJkYWVtb25HZXRCbG9ja0J5SGFzaCIsImJsb2NrSGFzaCIsImdldEJsb2NrQnlIYXNoIiwiZGFlbW9uR2V0QmxvY2tzQnlIYXNoIiwiYmxvY2tIYXNoZXMiLCJwcnVuZSIsImJsb2Nrc0pzb24iLCJibG9jayIsImdldEJsb2Nrc0J5SGFzaCIsImRhZW1vbkdldEJsb2NrQnlIZWlnaHQiLCJnZXRCbG9ja0J5SGVpZ2h0IiwiZGFlbW9uR2V0QmxvY2tzQnlIZWlnaHQiLCJoZWlnaHRzIiwiZ2V0QmxvY2tzQnlIZWlnaHQiLCJkYWVtb25HZXRCbG9ja3NCeVJhbmdlIiwiZ2V0QmxvY2tzQnlSYW5nZSIsImRhZW1vbkdldEJsb2Nrc0J5UmFuZ2VDaHVua2VkIiwibWF4Q2h1bmtTaXplIiwiZ2V0QmxvY2tzQnlSYW5nZUNodW5rZWQiLCJkYWVtb25HZXRCbG9ja0hhc2hlcyIsImRhZW1vbkdldFR4cyIsInR4SGFzaGVzIiwidHhzIiwiZ2V0VHhzIiwiYmxvY2tzIiwidW5jb25maXJtZWRCbG9jayIsInNlZW5CbG9ja3MiLCJTZXQiLCJ0eCIsImdldEJsb2NrIiwiTW9uZXJvQmxvY2siLCJzZXRUeHMiLCJzZXRCbG9jayIsImhhcyIsImFkZCIsImkiLCJkYWVtb25HZXRUeEhleGVzIiwiZ2V0VHhIZXhlcyIsImRhZW1vbkdldE1pbmVyVHhTdW0iLCJudW1CbG9ja3MiLCJnZXRNaW5lclR4U3VtIiwiZGFlbW9uR2V0RmVlRXN0aW1hdGUiLCJncmFjZUJsb2NrcyIsImdldEZlZUVzdGltYXRlIiwiZGFlbW9uU3VibWl0VHhIZXgiLCJ0eEhleCIsImRvTm90UmVsYXkiLCJzdWJtaXRUeEhleCIsImRhZW1vblJlbGF5VHhzQnlIYXNoIiwicmVsYXlUeHNCeUhhc2giLCJkYWVtb25HZXRUeFBvb2wiLCJnZXRUeFBvb2wiLCJkYWVtb25HZXRUeFBvb2xIYXNoZXMiLCJnZXRUeFBvb2xIYXNoZXMiLCJkYWVtb25HZXRUeFBvb2xTdGF0cyIsImdldFR4UG9vbFN0YXRzIiwiZGFlbW9uRmx1c2hUeFBvb2wiLCJoYXNoZXMiLCJmbHVzaFR4UG9vbCIsImRhZW1vbkdldEtleUltYWdlU3BlbnRTdGF0dXNlcyIsImtleUltYWdlcyIsImdldEtleUltYWdlU3BlbnRTdGF0dXNlcyIsImRhZW1vbkdldE91dHB1dEhpc3RvZ3JhbSIsImFtb3VudHMiLCJtaW5Db3VudCIsIm1heENvdW50IiwiaXNVbmxvY2tlZCIsInJlY2VudEN1dG9mZiIsImVudHJpZXNKc29uIiwiZW50cnkiLCJnZXRPdXRwdXRIaXN0b2dyYW0iLCJkYWVtb25HZXRJbmZvIiwiZ2V0SW5mbyIsImRhZW1vbkdldFN5bmNJbmZvIiwiZ2V0U3luY0luZm8iLCJkYWVtb25HZXRIYXJkRm9ya0luZm8iLCJnZXRIYXJkRm9ya0luZm8iLCJkYWVtb25HZXRBbHRDaGFpbnMiLCJhbHRDaGFpbnNKc29uIiwiYWx0Q2hhaW4iLCJnZXRBbHRDaGFpbnMiLCJkYWVtb25HZXRBbHRCbG9ja0hhc2hlcyIsImdldEFsdEJsb2NrSGFzaGVzIiwiZGFlbW9uR2V0RG93bmxvYWRMaW1pdCIsImdldERvd25sb2FkTGltaXQiLCJkYWVtb25TZXREb3dubG9hZExpbWl0IiwibGltaXQiLCJzZXREb3dubG9hZExpbWl0IiwiZGFlbW9uUmVzZXREb3dubG9hZExpbWl0IiwicmVzZXREb3dubG9hZExpbWl0IiwiZGFlbW9uR2V0VXBsb2FkTGltaXQiLCJnZXRVcGxvYWRMaW1pdCIsImRhZW1vblNldFVwbG9hZExpbWl0Iiwic2V0VXBsb2FkTGltaXQiLCJkYWVtb25SZXNldFVwbG9hZExpbWl0IiwicmVzZXRVcGxvYWRMaW1pdCIsImRhZW1vbkdldFBlZXJzIiwicGVlcnNKc29uIiwicGVlciIsImdldFBlZXJzIiwiZGFlbW9uR2V0S25vd25QZWVycyIsImdldEtub3duUGVlcnMiLCJkYWVtb25TZXRPdXRnb2luZ1BlZXJMaW1pdCIsInNldE91dGdvaW5nUGVlckxpbWl0IiwiZGFlbW9uU2V0SW5jb21pbmdQZWVyTGltaXQiLCJzZXRJbmNvbWluZ1BlZXJMaW1pdCIsImRhZW1vbkdldFBlZXJCYW5zIiwiYmFuc0pzb24iLCJiYW4iLCJnZXRQZWVyQmFucyIsImRhZW1vblNldFBlZXJCYW5zIiwiYmFucyIsImJhbkpzb24iLCJNb25lcm9CYW4iLCJzZXRQZWVyQmFucyIsImRhZW1vblN0YXJ0TWluaW5nIiwibnVtVGhyZWFkcyIsImlzQmFja2dyb3VuZCIsImlnbm9yZUJhdHRlcnkiLCJzdGFydE1pbmluZyIsImRhZW1vblN0b3BNaW5pbmciLCJzdG9wTWluaW5nIiwiZGFlbW9uR2V0TWluaW5nU3RhdHVzIiwiZ2V0TWluaW5nU3RhdHVzIiwiZGFlbW9uUHJ1bmVCbG9ja2NoYWluIiwiY2hlY2siLCJwcnVuZUJsb2NrY2hhaW4iLCJkYWVtb25TdG9wIiwic3RvcCIsImRhZW1vbldhaXRGb3JOZXh0QmxvY2tIZWFkZXIiLCJ3YWl0Rm9yTmV4dEJsb2NrSGVhZGVyIiwib3BlbldhbGxldERhdGEiLCJ3YWxsZXRJZCIsInBhdGgiLCJwYXNzd29yZCIsImtleXNEYXRhIiwiY2FjaGVEYXRhIiwiZGFlbW9uVXJpT3JDb25maWciLCJkYWVtb25Db25uZWN0aW9uIiwiTW9uZXJvUnBjQ29ubmVjdGlvbiIsIk1vbmVyb1dhbGxldEZ1bGwiLCJvcGVuV2FsbGV0Iiwic2VydmVyIiwic2V0QnJvd3Nlck1haW5QYXRoIiwiY3JlYXRlV2FsbGV0S2V5cyIsImNvbmZpZ0pzb24iLCJNb25lcm9XYWxsZXRDb25maWciLCJzZXRQcm94eVRvV29ya2VyIiwiTW9uZXJvV2FsbGV0S2V5cyIsImNyZWF0ZVdhbGxldCIsImNyZWF0ZVdhbGxldEZ1bGwiLCJnZXRQYXRoIiwic2V0UGF0aCIsImlzVmlld09ubHkiLCJnZXROZXR3b3JrVHlwZSIsImdldFNlZWQiLCJnZXRTZWVkTGFuZ3VhZ2UiLCJnZXRTZWVkTGFuZ3VhZ2VzIiwiZ2V0UHJpdmF0ZVNwZW5kS2V5IiwiZ2V0UHJpdmF0ZVZpZXdLZXkiLCJnZXRQdWJsaWNWaWV3S2V5IiwiZ2V0UHVibGljU3BlbmRLZXkiLCJnZXRBZGRyZXNzIiwiYWNjb3VudElkeCIsInN1YmFkZHJlc3NJZHgiLCJnZXRBZGRyZXNzSW5kZXgiLCJzZXRTdWJhZGRyZXNzTGFiZWwiLCJsYWJlbCIsImRlY29kZUludGVncmF0ZWRBZGRyZXNzIiwiaW50ZWdyYXRlZEFkZHJlc3MiLCJzZXREYWVtb25Db25uZWN0aW9uIiwiZ2V0RGFlbW9uQ29ubmVjdGlvbiIsImlzQ29ubmVjdGVkVG9EYWVtb24iLCJnZXRSZXN0b3JlSGVpZ2h0Iiwic2V0UmVzdG9yZUhlaWdodCIsInJlc3RvcmVIZWlnaHQiLCJnZXREYWVtb25IZWlnaHQiLCJnZXREYWVtb25NYXhQZWVySGVpZ2h0IiwiZ2V0SGVpZ2h0QnlEYXRlIiwieWVhciIsIm1vbnRoIiwiZGF5IiwiaXNEYWVtb25TeW5jZWQiLCJXYWxsZXRXb3JrZXJIZWxwZXJMaXN0ZW5lciIsIk1vbmVyb1dhbGxldExpc3RlbmVyIiwiY29uc3RydWN0b3IiLCJpZCIsIndvcmtlciIsImdldElkIiwib25TeW5jUHJvZ3Jlc3MiLCJwZXJjZW50RG9uZSIsIm9uTmV3QmxvY2siLCJvbkJhbGFuY2VzQ2hhbmdlZCIsIm5ld0JhbGFuY2UiLCJuZXdVbmxvY2tlZEJhbGFuY2UiLCJ0b1N0cmluZyIsIm9uT3V0cHV0UmVjZWl2ZWQiLCJvdXRwdXQiLCJnZXRUeCIsIm9uT3V0cHV0U3BlbnQiLCJsaXN0ZW5lcnMiLCJpc1N5bmNlZCIsInN5bmMiLCJhbGxvd0NvbmN1cnJlbnRDYWxscyIsInN0YXJ0U3luY2luZyIsInN5bmNQZXJpb2RJbk1zIiwic3RvcFN5bmNpbmciLCJzY2FuVHhzIiwicmVzY2FuU3BlbnQiLCJyZXNjYW5CbG9ja2NoYWluIiwiZ2V0QmFsYW5jZSIsImdldFVubG9ja2VkQmFsYW5jZSIsImdldEFjY291bnRzIiwiaW5jbHVkZVN1YmFkZHJlc3NlcyIsInRhZyIsImFjY291bnRKc29ucyIsImFjY291bnQiLCJnZXRBY2NvdW50IiwiY3JlYXRlQWNjb3VudCIsImdldFN1YmFkZHJlc3NlcyIsInN1YmFkZHJlc3NJbmRpY2VzIiwic3ViYWRkcmVzc0pzb25zIiwic3ViYWRkcmVzcyIsImNyZWF0ZVN1YmFkZHJlc3MiLCJibG9ja0pzb25RdWVyeSIsInF1ZXJ5IiwiRGVzZXJpYWxpemF0aW9uVHlwZSIsIlRYX1FVRVJZIiwiZ2V0VHJhbnNmZXJzIiwiZ2V0VHJhbnNmZXJRdWVyeSIsInRyYW5zZmVycyIsInRyYW5zZmVyIiwiZ2V0T3V0cHV0cyIsImdldE91dHB1dFF1ZXJ5Iiwib3V0cHV0cyIsImV4cG9ydE91dHB1dHMiLCJhbGwiLCJpbXBvcnRPdXRwdXRzIiwib3V0cHV0c0hleCIsImdldEtleUltYWdlcyIsImtleUltYWdlc0pzb24iLCJrZXlJbWFnZSIsImV4cG9ydEtleUltYWdlcyIsImltcG9ydEtleUltYWdlcyIsImtleUltYWdlSnNvbiIsIk1vbmVyb0tleUltYWdlIiwiZnJlZXplT3V0cHV0IiwidGhhd091dHB1dCIsImlzT3V0cHV0RnJvemVuIiwiY3JlYXRlVHhzIiwiTW9uZXJvVHhDb25maWciLCJnZXRUeFNldCIsInN3ZWVwT3V0cHV0Iiwic3dlZXBVbmxvY2tlZCIsInR4U2V0cyIsIkdlblV0aWxzIiwiYXJyYXlDb250YWlucyIsInR4U2V0c0pzb24iLCJ0eFNldCIsInN3ZWVwRHVzdCIsInJlbGF5IiwicmVsYXlUeHMiLCJ0eE1ldGFkYXRhcyIsImRlc2NyaWJlVHhTZXQiLCJ0eFNldEpzb24iLCJNb25lcm9UeFNldCIsInNpZ25UeHMiLCJ1bnNpZ25lZFR4SGV4Iiwic3VibWl0VHhzIiwic2lnbmVkVHhIZXgiLCJzaWduTWVzc2FnZSIsInNpZ25hdHVyZVR5cGUiLCJ2ZXJpZnlNZXNzYWdlIiwic2lnbmF0dXJlIiwiZ2V0VHhLZXkiLCJ0eEhhc2giLCJjaGVja1R4S2V5IiwidHhLZXkiLCJnZXRUeFByb29mIiwiY2hlY2tUeFByb29mIiwiZ2V0U3BlbmRQcm9vZiIsImNoZWNrU3BlbmRQcm9vZiIsImdldFJlc2VydmVQcm9vZldhbGxldCIsImdldFJlc2VydmVQcm9vZkFjY291bnQiLCJhbW91bnRTdHIiLCJjaGVja1Jlc2VydmVQcm9vZiIsImdldFR4Tm90ZXMiLCJzZXRUeE5vdGVzIiwidHhOb3RlcyIsImdldEFkZHJlc3NCb29rRW50cmllcyIsImVudHJ5SW5kaWNlcyIsImFkZEFkZHJlc3NCb29rRW50cnkiLCJkZXNjcmlwdGlvbiIsImVkaXRBZGRyZXNzQm9va0VudHJ5IiwiaW5kZXgiLCJzZXRBZGRyZXNzIiwic2V0RGVzY3JpcHRpb24iLCJkZWxldGVBZGRyZXNzQm9va0VudHJ5IiwidGFnQWNjb3VudHMiLCJhY2NvdW50SW5kaWNlcyIsInVudGFnQWNjb3VudHMiLCJnZXRBY2NvdW50VGFncyIsInNldEFjY291bnRUYWdMYWJlbCIsImdldFBheW1lbnRVcmkiLCJwYXJzZVBheW1lbnRVcmkiLCJ1cmkiLCJnZXRBdHRyaWJ1dGUiLCJrZXkiLCJzZXRBdHRyaWJ1dGUiLCJ2YWx1ZSIsImJhY2tncm91bmRNaW5pbmciLCJpc011bHRpc2lnSW1wb3J0TmVlZGVkIiwiaXNNdWx0aXNpZyIsImdldE11bHRpc2lnSW5mbyIsInByZXBhcmVNdWx0aXNpZyIsIm1ha2VNdWx0aXNpZyIsIm11bHRpc2lnSGV4ZXMiLCJ0aHJlc2hvbGQiLCJleGNoYW5nZU11bHRpc2lnS2V5cyIsImV4cG9ydE11bHRpc2lnSGV4IiwiaW1wb3J0TXVsdGlzaWdIZXgiLCJzaWduTXVsdGlzaWdUeEhleCIsIm11bHRpc2lnVHhIZXgiLCJzdWJtaXRNdWx0aXNpZ1R4SGV4Iiwic2lnbmVkTXVsdGlzaWdUeEhleCIsImdldERhdGEiLCJjaGFuZ2VQYXNzd29yZCIsIm9sZFBhc3N3b3JkIiwibmV3UGFzc3dvcmQiLCJpc0Nsb3NlZCIsImNsb3NlIiwic2F2ZSJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL2NvbW1vbi9Nb25lcm9XZWJXb3JrZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XG5pbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4vR2VuVXRpbHNcIjtcbmltcG9ydCBIdHRwQ2xpZW50IGZyb20gXCIuL0h0dHBDbGllbnRcIjtcbmltcG9ydCBMaWJyYXJ5VXRpbHMgZnJvbSBcIi4vTGlicmFyeVV0aWxzXCI7XG5pbXBvcnQgTW9uZXJvQmFuIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvQmFuXCI7XG5pbXBvcnQgTW9uZXJvQmxvY2sgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9CbG9ja1wiO1xuaW1wb3J0IE1vbmVyb0RhZW1vbkNvbmZpZyBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0RhZW1vbkNvbmZpZ1wiO1xuaW1wb3J0IE1vbmVyb0RhZW1vbkxpc3RlbmVyIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvRGFlbW9uTGlzdGVuZXJcIjtcbmltcG9ydCBNb25lcm9EYWVtb25ScGMgZnJvbSBcIi4uL2RhZW1vbi9Nb25lcm9EYWVtb25ScGNcIjtcbmltcG9ydCBNb25lcm9FcnJvciBmcm9tIFwiLi9Nb25lcm9FcnJvclwiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvS2V5SW1hZ2VcIjtcbmltcG9ydCBNb25lcm9ScGNDb25uZWN0aW9uIGZyb20gXCIuL01vbmVyb1JwY0Nvbm5lY3Rpb25cIjtcbmltcG9ydCBNb25lcm9UeENvbmZpZyBmcm9tIFwiLi4vd2FsbGV0L21vZGVsL01vbmVyb1R4Q29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvVHhRdWVyeSBmcm9tIFwiLi4vd2FsbGV0L21vZGVsL01vbmVyb1R4UXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeFNldCBmcm9tIFwiLi4vd2FsbGV0L21vZGVsL01vbmVyb1R4U2V0XCI7XG5pbXBvcnQgTW9uZXJvVXRpbHMgZnJvbSBcIi4vTW9uZXJvVXRpbHNcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRDb25maWcgZnJvbSBcIi4uL3dhbGxldC9tb2RlbC9Nb25lcm9XYWxsZXRDb25maWdcIlxuaW1wb3J0IE1vbmVyb1dhbGxldExpc3RlbmVyIGZyb20gXCIuLi93YWxsZXQvbW9kZWwvTW9uZXJvV2FsbGV0TGlzdGVuZXJcIlxuaW1wb3J0IHtNb25lcm9XYWxsZXRLZXlzfSBmcm9tIFwiLi4vd2FsbGV0L01vbmVyb1dhbGxldEtleXNcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRGdWxsIGZyb20gXCIuLi93YWxsZXQvTW9uZXJvV2FsbGV0RnVsbFwiO1xuXG5kZWNsYXJlIGNvbnN0IHNlbGY6IGFueTtcblxuLyoqXG4gKiBXb3JrZXIgdG8gbWFuYWdlIGEgZGFlbW9uIGFuZCB3YXNtIHdhbGxldCBvZmYgdGhlIG1haW4gdGhyZWFkIHVzaW5nIG1lc3NhZ2VzLlxuICogXG4gKiBSZXF1aXJlZCBtZXNzYWdlIGZvcm1hdDogZS5kYXRhWzBdID0gb2JqZWN0IGlkLCBlLmRhdGFbMV0gPSBmdW5jdGlvbiBuYW1lLCBlLmRhdGFbMitdID0gZnVuY3Rpb24gYXJnc1xuICpcbiAqIEZvciBicm93c2VyIGFwcGxpY2F0aW9ucywgdGhpcyBmaWxlIG11c3QgYmUgYnJvd3NlcmlmaWVkIGFuZCBwbGFjZWQgaW4gdGhlIHdlYiBhcHAgcm9vdC5cbiAqIFxuICogQHByaXZhdGVcbiAqL1xuc2VsZi5vbm1lc3NhZ2UgPSBhc3luYyBmdW5jdGlvbihlKSB7XG4gIFxuICAvLyBpbml0aWFsaXplIG9uZSB0aW1lXG4gIGF3YWl0IHNlbGYuaW5pdE9uZVRpbWUoKTtcbiAgXG4gIC8vIHZhbGlkYXRlIHBhcmFtc1xuICBsZXQgb2JqZWN0SWQgPSBlLmRhdGFbMF07XG4gIGxldCBmbk5hbWUgPSBlLmRhdGFbMV07XG4gIGxldCBjYWxsYmFja0lkID0gZS5kYXRhWzJdO1xuICBhc3NlcnQoZm5OYW1lLCBcIk11c3QgcHJvdmlkZSBmdW5jdGlvbiBuYW1lIHRvIHdvcmtlclwiKTtcbiAgYXNzZXJ0KGNhbGxiYWNrSWQsIFwiTXVzdCBwcm92aWRlIGNhbGxiYWNrIGlkIHRvIHdvcmtlclwiKTtcbiAgaWYgKCFzZWxmW2ZuTmFtZV0pIHRocm93IG5ldyBFcnJvcihcIk1ldGhvZCAnXCIgKyBmbk5hbWUgKyBcIicgaXMgbm90IHJlZ2lzdGVyZWQgd2l0aCB3b3JrZXJcIik7XG4gIGUuZGF0YS5zcGxpY2UoMSwgMik7IC8vIHJlbW92ZSBmdW5jdGlvbiBuYW1lIGFuZCBjYWxsYmFjayBpZCB0byBhcHBseSBmdW5jdGlvbiB3aXRoIGFyZ3VtZW50c1xuICBcbiAgLy8gZXhlY3V0ZSB3b3JrZXIgZnVuY3Rpb24gYW5kIHBvc3QgcmVzdWx0IHRvIGNhbGxiYWNrXG4gIHRyeSB7XG4gICAgcG9zdE1lc3NhZ2UoW29iamVjdElkLCBjYWxsYmFja0lkLCB7cmVzdWx0OiBhd2FpdCBzZWxmW2ZuTmFtZV0uYXBwbHkobnVsbCwgZS5kYXRhKX1dKTtcbiAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgaWYgKCEoZSBpbnN0YW5jZW9mIEVycm9yKSkgZSA9IG5ldyBFcnJvcihlKTtcbiAgICBwb3N0TWVzc2FnZShbb2JqZWN0SWQsIGNhbGxiYWNrSWQsIHtlcnJvcjogTGlicmFyeVV0aWxzLnNlcmlhbGl6ZUVycm9yKGUpfV0pO1xuICB9XG59XG5cbnNlbGYuaW5pdE9uZVRpbWUgPSBhc3luYyBmdW5jdGlvbigpIHtcbiAgaWYgKCFzZWxmLmlzSW5pdGlhbGl6ZWQpIHtcbiAgICBzZWxmLldPUktFUl9PQkpFQ1RTID0ge307XG4gICAgc2VsZi5pc0luaXRpYWxpemVkID0gdHJ1ZTtcbiAgICBNb25lcm9VdGlscy5QUk9YWV9UT19XT1JLRVIgPSBmYWxzZTtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU1RBVElDIFVUSUxJVElFUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnNlbGYuaHR0cFJlcXVlc3QgPSBhc3luYyBmdW5jdGlvbihvYmplY3RJZCwgb3B0cykge1xuICB0cnkge1xuICAgIHJldHVybiBhd2FpdCBIdHRwQ2xpZW50LnJlcXVlc3QoT2JqZWN0LmFzc2lnbihvcHRzLCB7cHJveHlUb1dvcmtlcjogZmFsc2V9KSk7ICBcbiAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICB0aHJvdyBlcnIuc3RhdHVzQ29kZSA/IG5ldyBFcnJvcihKU09OLnN0cmluZ2lmeSh7c3RhdHVzQ29kZTogZXJyLnN0YXR1c0NvZGUsIHN0YXR1c01lc3NhZ2U6IGVyci5tZXNzYWdlfSkpIDogZXJyO1xuICB9XG59XG5cbnNlbGYuc2V0TG9nTGV2ZWwgPSBhc3luYyBmdW5jdGlvbihvYmplY3RJZCwgbGV2ZWwpIHtcbiAgcmV0dXJuIExpYnJhcnlVdGlscy5zZXRMb2dMZXZlbChsZXZlbCk7XG59XG5cbnNlbGYuZ2V0V2FzbU1lbW9yeVVzZWQgPSBhc3luYyBmdW5jdGlvbihvYmplY3RJZCkge1xuICByZXR1cm4gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKSAmJiBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLkhFQVA4ID8gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5IRUFQOC5sZW5ndGggOiB1bmRlZmluZWQ7XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIE1PTkVSTyBVVElMUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuc2VsZi5tb25lcm9VdGlsc0dldEludGVncmF0ZWRBZGRyZXNzID0gYXN5bmMgZnVuY3Rpb24ob2JqZWN0SWQsIG5ldHdvcmtUeXBlLCBzdGFuZGFyZEFkZHJlc3MsIHBheW1lbnRJZCkge1xuICByZXR1cm4gKGF3YWl0IE1vbmVyb1V0aWxzLmdldEludGVncmF0ZWRBZGRyZXNzKG5ldHdvcmtUeXBlLCBzdGFuZGFyZEFkZHJlc3MsIHBheW1lbnRJZCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLm1vbmVyb1V0aWxzVmFsaWRhdGVBZGRyZXNzID0gYXN5bmMgZnVuY3Rpb24ob2JqZWN0SWQsIGFkZHJlc3MsIG5ldHdvcmtUeXBlKSB7XG4gIHJldHVybiBNb25lcm9VdGlscy52YWxpZGF0ZUFkZHJlc3MoYWRkcmVzcywgbmV0d29ya1R5cGUpO1xufVxuXG5zZWxmLm1vbmVyb1V0aWxzSnNvblRvQmluYXJ5ID0gYXN5bmMgZnVuY3Rpb24ob2JqZWN0SWQsIGpzb24pIHtcbiAgcmV0dXJuIE1vbmVyb1V0aWxzLmpzb25Ub0JpbmFyeShqc29uKTtcbn1cblxuc2VsZi5tb25lcm9VdGlsc0JpbmFyeVRvSnNvbiA9IGFzeW5jIGZ1bmN0aW9uKG9iamVjdElkLCB1aW50OGFycikge1xuICByZXR1cm4gTW9uZXJvVXRpbHMuYmluYXJ5VG9Kc29uKHVpbnQ4YXJyKTtcbn1cblxuc2VsZi5tb25lcm9VdGlsc0JpbmFyeUJsb2Nrc1RvSnNvbiA9IGFzeW5jIGZ1bmN0aW9uKG9iamVjdElkLCB1aW50OGFycikge1xuICByZXR1cm4gTW9uZXJvVXRpbHMuYmluYXJ5QmxvY2tzVG9Kc29uKHVpbnQ4YXJyKTtcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBEQUVNT04gTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5zZWxmLmRhZW1vbkFkZExpc3RlbmVyID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGxpc3RlbmVySWQpIHtcbiAgbGV0IGxpc3RlbmVyID0gbmV3IGNsYXNzIGV4dGVuZHMgTW9uZXJvRGFlbW9uTGlzdGVuZXIge1xuICAgIGFzeW5jIG9uQmxvY2tIZWFkZXIoYmxvY2tIZWFkZXIpIHtcbiAgICAgIHNlbGYucG9zdE1lc3NhZ2UoW2RhZW1vbklkLCBcIm9uQmxvY2tIZWFkZXJfXCIgKyBsaXN0ZW5lcklkLCBibG9ja0hlYWRlci50b0pzb24oKV0pO1xuICAgIH1cbiAgfVxuICBpZiAoIXNlbGYuZGFlbW9uTGlzdGVuZXJzKSBzZWxmLmRhZW1vbkxpc3RlbmVycyA9IHt9O1xuICBzZWxmLmRhZW1vbkxpc3RlbmVyc1tsaXN0ZW5lcklkXSA9IGxpc3RlbmVyO1xuICBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG59XG5cbnNlbGYuZGFlbW9uUmVtb3ZlTGlzdGVuZXIgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgbGlzdGVuZXJJZCkge1xuICBpZiAoIXNlbGYuZGFlbW9uTGlzdGVuZXJzW2xpc3RlbmVySWRdKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJObyBkYWVtb24gd29ya2VyIGxpc3RlbmVyIHJlZ2lzdGVyZWQgd2l0aCBpZDogXCIgKyBsaXN0ZW5lcklkKTtcbiAgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0ucmVtb3ZlTGlzdGVuZXIoc2VsZi5kYWVtb25MaXN0ZW5lcnNbbGlzdGVuZXJJZF0pO1xuICBkZWxldGUgc2VsZi5kYWVtb25MaXN0ZW5lcnNbbGlzdGVuZXJJZF07XG59XG5cbnNlbGYuY29ubmVjdERhZW1vblJwYyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBjb25maWcpIHtcbiAgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0gPSBhd2FpdCBNb25lcm9EYWVtb25ScGMuY29ubmVjdFRvRGFlbW9uUnBjKG5ldyBNb25lcm9EYWVtb25Db25maWcoY29uZmlnKSk7XG59XG5cbnNlbGYuZGFlbW9uR2V0UnBjQ29ubmVjdGlvbiA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIGxldCBjb25uZWN0aW9uID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0UnBjQ29ubmVjdGlvbigpO1xuICByZXR1cm4gY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0Q29uZmlnKCkgOiB1bmRlZmluZWQ7XG59XG5cbnNlbGYuZGFlbW9uSXNDb25uZWN0ZWQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uaXNDb25uZWN0ZWQoKTtcbn1cblxuc2VsZi5kYWVtb25HZXRWZXJzaW9uID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRWZXJzaW9uKCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbklzVHJ1c3RlZCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5pc1RydXN0ZWQoKTtcbn1cblxuc2VsZi5kYWVtb25HZXRIZWlnaHQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0SGVpZ2h0KCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tIYXNoID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGhlaWdodCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tIYXNoKGhlaWdodCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tUZW1wbGF0ZSA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCB3YWxsZXRBZGRyZXNzLCByZXNlcnZlU2l6ZSkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2NrVGVtcGxhdGUod2FsbGV0QWRkcmVzcywgcmVzZXJ2ZVNpemUpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRMYXN0QmxvY2tIZWFkZXIgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldExhc3RCbG9ja0hlYWRlcigpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja0hlYWRlckJ5SGFzaCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBoYXNoKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tIZWFkZXJCeUhhc2goaGFzaCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2NrSGVhZGVyQnlIZWlnaHQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgaGVpZ2h0KSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tIZWFkZXJCeUhlaWdodChoZWlnaHQpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja0hlYWRlcnNCeVJhbmdlID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpIHtcbiAgbGV0IGJsb2NrSGVhZGVyc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgYmxvY2tIZWFkZXIgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tIZWFkZXJzQnlSYW5nZShzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSkgYmxvY2tIZWFkZXJzSnNvbi5wdXNoKGJsb2NrSGVhZGVyLnRvSnNvbigpKTtcbiAgcmV0dXJuIGJsb2NrSGVhZGVyc0pzb247XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tCeUhhc2ggPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgYmxvY2tIYXNoKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tCeUhhc2goYmxvY2tIYXNoKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tzQnlIYXNoID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGJsb2NrSGFzaGVzLCBzdGFydEhlaWdodCwgcHJ1bmUpIHtcbiAgbGV0IGJsb2Nrc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgYmxvY2sgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tzQnlIYXNoKGJsb2NrSGFzaGVzLCBzdGFydEhlaWdodCwgcHJ1bmUpKSBibG9ja3NKc29uLnB1c2goYmxvY2sudG9Kc29uKCkpO1xuICByZXR1cm4gYmxvY2tzSnNvbjtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja0J5SGVpZ2h0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGhlaWdodCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2NrQnlIZWlnaHQoaGVpZ2h0KSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tzQnlIZWlnaHQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgaGVpZ2h0cykge1xuICBsZXQgYmxvY2tzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBibG9jayBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja3NCeUhlaWdodChoZWlnaHRzKSkgYmxvY2tzSnNvbi5wdXNoKGJsb2NrLnRvSnNvbigpKTtcbiAgcmV0dXJuIGJsb2Nrc0pzb247XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tzQnlSYW5nZSA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSB7XG4gIGxldCBibG9ja3NKc29uID0gW107XG4gIGZvciAobGV0IGJsb2NrIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2Nrc0J5UmFuZ2Uoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCkpIGJsb2Nrc0pzb24ucHVzaChibG9jay50b0pzb24oKSk7XG4gIHJldHVybiBibG9ja3NKc29uO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2Nrc0J5UmFuZ2VDaHVua2VkID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIG1heENodW5rU2l6ZSkge1xuICBsZXQgYmxvY2tzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBibG9jayBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja3NCeVJhbmdlQ2h1bmtlZChzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBtYXhDaHVua1NpemUpKSBibG9ja3NKc29uLnB1c2goYmxvY2sudG9Kc29uKCkpO1xuICByZXR1cm4gYmxvY2tzSnNvbjtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja0hhc2hlcyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBibG9ja0hhc2hlcywgc3RhcnRIZWlnaHQpIHtcbiAgdGhyb3cgbmV3IEVycm9yKFwid29ya2VyLmdldEJsb2NrSGFzaGVzIG5vdCBpbXBsZW1lbnRlZFwiKTtcbn1cblxuLy8gVE9ETzogZmFjdG9yIGNvbW1vbiBjb2RlIHdpdGggc2VsZi5nZXRUeHMoKVxuc2VsZi5kYWVtb25HZXRUeHMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgdHhIYXNoZXMsIHBydW5lKSB7XG4gIFxuICAvLyBnZXQgdHhzXG4gIGxldCB0eHMgPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRUeHModHhIYXNoZXMsIHBydW5lKTtcbiAgXG4gIC8vIGNvbGxlY3QgdW5pcXVlIGJsb2NrcyB0byBwcmVzZXJ2ZSBtb2RlbCByZWxhdGlvbnNoaXBzIGFzIHRyZWVzIChiYXNlZCBvbiBtb25lcm9fd2FzbV9icmlkZ2UuY3BwOjpnZXRfdHhzKVxuICBsZXQgYmxvY2tzID0gW107XG4gIGxldCB1bmNvbmZpcm1lZEJsb2NrID0gdW5kZWZpbmVkXG4gIGxldCBzZWVuQmxvY2tzID0gbmV3IFNldCgpO1xuICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICBpZiAoIXR4LmdldEJsb2NrKCkpIHtcbiAgICAgIGlmICghdW5jb25maXJtZWRCbG9jaykgdW5jb25maXJtZWRCbG9jayA9IG5ldyBNb25lcm9CbG9jaygpLnNldFR4cyhbXSk7XG4gICAgICB0eC5zZXRCbG9jayh1bmNvbmZpcm1lZEJsb2NrKTtcbiAgICAgIHVuY29uZmlybWVkQmxvY2suZ2V0VHhzKCkucHVzaCh0eCk7XG4gICAgfVxuICAgIGlmICghc2VlbkJsb2Nrcy5oYXModHguZ2V0QmxvY2soKSkpIHtcbiAgICAgIHNlZW5CbG9ja3MuYWRkKHR4LmdldEJsb2NrKCkpO1xuICAgICAgYmxvY2tzLnB1c2godHguZ2V0QmxvY2soKSk7XG4gICAgfVxuICB9XG4gIFxuICAvLyBzZXJpYWxpemUgYmxvY2tzIHRvIGpzb25cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBibG9ja3MubGVuZ3RoOyBpKyspIGJsb2Nrc1tpXSA9IGJsb2Nrc1tpXS50b0pzb24oKTtcbiAgcmV0dXJuIGJsb2Nrcztcbn1cblxuc2VsZi5kYWVtb25HZXRUeEhleGVzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIHR4SGFzaGVzLCBwcnVuZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0VHhIZXhlcyh0eEhhc2hlcywgcHJ1bmUpO1xufVxuXG5zZWxmLmRhZW1vbkdldE1pbmVyVHhTdW0gPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgaGVpZ2h0LCBudW1CbG9ja3MpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRNaW5lclR4U3VtKGhlaWdodCwgbnVtQmxvY2tzKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0RmVlRXN0aW1hdGUgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgZ3JhY2VCbG9ja3MpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRGZWVFc3RpbWF0ZShncmFjZUJsb2NrcykpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vblN1Ym1pdFR4SGV4ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIHR4SGV4LCBkb05vdFJlbGF5KSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc3VibWl0VHhIZXgodHhIZXgsIGRvTm90UmVsYXkpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25SZWxheVR4c0J5SGFzaCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCB0eEhhc2hlcykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0ucmVsYXlUeHNCeUhhc2godHhIYXNoZXMpO1xufVxuXG5zZWxmLmRhZW1vbkdldFR4UG9vbCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIGxldCB0eHMgPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRUeFBvb2woKTtcbiAgbGV0IGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0VHhzKHR4cyk7XG4gIGZvciAobGV0IHR4IG9mIHR4cykgdHguc2V0QmxvY2soYmxvY2spXG4gIHJldHVybiBibG9jay50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRUeFBvb2xIYXNoZXMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0VHhQb29sSGFzaGVzKCk7XG59XG5cbi8vYXN5bmMgZ2V0VHhQb29sQmFja2xvZygpIHtcbi8vICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4vL31cblxuc2VsZi5kYWVtb25HZXRUeFBvb2xTdGF0cyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0VHhQb29sU3RhdHMoKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uRmx1c2hUeFBvb2wgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgaGFzaGVzKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5mbHVzaFR4UG9vbChoYXNoZXMpO1xufVxuXG5zZWxmLmRhZW1vbkdldEtleUltYWdlU3BlbnRTdGF0dXNlcyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBrZXlJbWFnZXMpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEtleUltYWdlU3BlbnRTdGF0dXNlcyhrZXlJbWFnZXMpO1xufVxuXG4vL1xuLy9hc3luYyBnZXRPdXRwdXRzKG91dHB1dHMpIHtcbi8vICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4vL31cblxuc2VsZi5kYWVtb25HZXRPdXRwdXRIaXN0b2dyYW0gPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgYW1vdW50cywgbWluQ291bnQsIG1heENvdW50LCBpc1VubG9ja2VkLCByZWNlbnRDdXRvZmYpIHtcbiAgbGV0IGVudHJpZXNKc29uID0gW107XG4gIGZvciAobGV0IGVudHJ5IG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldE91dHB1dEhpc3RvZ3JhbShhbW91bnRzLCBtaW5Db3VudCwgbWF4Q291bnQsIGlzVW5sb2NrZWQsIHJlY2VudEN1dG9mZikpIHtcbiAgICBlbnRyaWVzSnNvbi5wdXNoKGVudHJ5LnRvSnNvbigpKTtcbiAgfVxuICByZXR1cm4gZW50cmllc0pzb247XG59XG5cbi8vXG4vL2FzeW5jIGdldE91dHB1dERpc3RyaWJ1dGlvbihhbW91bnRzLCBjdW11bGF0aXZlLCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSB7XG4vLyAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuLy99XG5cbnNlbGYuZGFlbW9uR2V0SW5mbyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0SW5mbygpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRTeW5jSW5mbyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0U3luY0luZm8oKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0SGFyZEZvcmtJbmZvID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRIYXJkRm9ya0luZm8oKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0QWx0Q2hhaW5zID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgbGV0IGFsdENoYWluc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgYWx0Q2hhaW4gb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QWx0Q2hhaW5zKCkpIGFsdENoYWluc0pzb24ucHVzaChhbHRDaGFpbi50b0pzb24oKSk7XG4gIHJldHVybiBhbHRDaGFpbnNKc29uO1xufVxuXG5zZWxmLmRhZW1vbkdldEFsdEJsb2NrSGFzaGVzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEFsdEJsb2NrSGFzaGVzKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0RG93bmxvYWRMaW1pdCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXREb3dubG9hZExpbWl0KCk7XG59XG5cbnNlbGYuZGFlbW9uU2V0RG93bmxvYWRMaW1pdCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBsaW1pdCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc2V0RG93bmxvYWRMaW1pdChsaW1pdCk7XG59XG5cbnNlbGYuZGFlbW9uUmVzZXREb3dubG9hZExpbWl0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnJlc2V0RG93bmxvYWRMaW1pdCgpO1xufVxuXG5zZWxmLmRhZW1vbkdldFVwbG9hZExpbWl0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldFVwbG9hZExpbWl0KCk7XG59XG5cbnNlbGYuZGFlbW9uU2V0VXBsb2FkTGltaXQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgbGltaXQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnNldFVwbG9hZExpbWl0KGxpbWl0KTtcbn1cblxuc2VsZi5kYWVtb25SZXNldFVwbG9hZExpbWl0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnJlc2V0VXBsb2FkTGltaXQoKTtcbn1cblxuc2VsZi5kYWVtb25HZXRQZWVycyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIGxldCBwZWVyc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgcGVlciBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRQZWVycygpKSBwZWVyc0pzb24ucHVzaChwZWVyLnRvSnNvbigpKTtcbiAgcmV0dXJuIHBlZXJzSnNvbjtcbn1cblxuc2VsZi5kYWVtb25HZXRLbm93blBlZXJzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgbGV0IHBlZXJzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBwZWVyIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEtub3duUGVlcnMoKSkgcGVlcnNKc29uLnB1c2gocGVlci50b0pzb24oKSk7XG4gIHJldHVybiBwZWVyc0pzb247XG59XG5cbnNlbGYuZGFlbW9uU2V0T3V0Z29pbmdQZWVyTGltaXQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgbGltaXQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnNldE91dGdvaW5nUGVlckxpbWl0KGxpbWl0KTtcbn1cblxuc2VsZi5kYWVtb25TZXRJbmNvbWluZ1BlZXJMaW1pdCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBsaW1pdCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc2V0SW5jb21pbmdQZWVyTGltaXQobGltaXQpO1xufVxuXG5zZWxmLmRhZW1vbkdldFBlZXJCYW5zID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgbGV0IGJhbnNKc29uID0gW107XG4gIGZvciAobGV0IGJhbiBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRQZWVyQmFucygpKSBiYW5zSnNvbi5wdXNoKGJhbi50b0pzb24oKSk7XG4gIHJldHVybiBiYW5zSnNvbjtcbn1cblxuc2VsZi5kYWVtb25TZXRQZWVyQmFucyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBiYW5zSnNvbikge1xuICBsZXQgYmFucyA9IFtdO1xuICBmb3IgKGxldCBiYW5Kc29uIG9mIGJhbnNKc29uKSBiYW5zLnB1c2gobmV3IE1vbmVyb0JhbihiYW5Kc29uKSk7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5zZXRQZWVyQmFucyhiYW5zKTtcbn1cblxuc2VsZi5kYWVtb25TdGFydE1pbmluZyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBhZGRyZXNzLCBudW1UaHJlYWRzLCBpc0JhY2tncm91bmQsIGlnbm9yZUJhdHRlcnkpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnN0YXJ0TWluaW5nKGFkZHJlc3MsIG51bVRocmVhZHMsIGlzQmFja2dyb3VuZCwgaWdub3JlQmF0dGVyeSk7XG59XG5cbnNlbGYuZGFlbW9uU3RvcE1pbmluZyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5zdG9wTWluaW5nKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0TWluaW5nU3RhdHVzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRNaW5pbmdTdGF0dXMoKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uUHJ1bmVCbG9ja2NoYWluID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGNoZWNrKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0ucHJ1bmVCbG9ja2NoYWluKGNoZWNrKSkudG9Kc29uKCk7XG59XG5cbi8vXG4vL2FzeW5jIHN1Ym1pdEJsb2NrcyhibG9ja0Jsb2JzKSB7XG4vLyAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuLy99XG4vL1xuLy9hc3luYyBjaGVja0ZvclVwZGF0ZSgpIHtcbi8vICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4vL31cbi8vXG4vL2FzeW5jIGRvd25sb2FkVXBkYXRlKHBhdGgpIHtcbi8vICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4vL31cblxuc2VsZi5kYWVtb25TdG9wID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnN0b3AoKTtcbn1cblxuc2VsZi5kYWVtb25XYWl0Rm9yTmV4dEJsb2NrSGVhZGVyID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS53YWl0Rm9yTmV4dEJsb2NrSGVhZGVyKCkpLnRvSnNvbigpO1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBXQUxMRVQgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnNlbGYub3BlbldhbGxldERhdGEgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgcGF0aCwgcGFzc3dvcmQsIG5ldHdvcmtUeXBlLCBrZXlzRGF0YSwgY2FjaGVEYXRhLCBkYWVtb25VcmlPckNvbmZpZykge1xuICBsZXQgZGFlbW9uQ29ubmVjdGlvbiA9IGRhZW1vblVyaU9yQ29uZmlnID8gbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24oZGFlbW9uVXJpT3JDb25maWcpIDogdW5kZWZpbmVkO1xuICBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXSA9IGF3YWl0IE1vbmVyb1dhbGxldEZ1bGwub3BlbldhbGxldCh7cGF0aDogXCJcIiwgcGFzc3dvcmQ6IHBhc3N3b3JkLCBuZXR3b3JrVHlwZTogbmV0d29ya1R5cGUsIGtleXNEYXRhOiBrZXlzRGF0YSwgY2FjaGVEYXRhOiBjYWNoZURhdGEsIHNlcnZlcjogZGFlbW9uQ29ubmVjdGlvbiwgcHJveHlUb1dvcmtlcjogZmFsc2V9KTtcbiAgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2V0QnJvd3Nlck1haW5QYXRoKHBhdGgpO1xufVxuXG5zZWxmLmNyZWF0ZVdhbGxldEtleXMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgY29uZmlnSnNvbikge1xuICBsZXQgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyhjb25maWdKc29uKTtcbiAgY29uZmlnLnNldFByb3h5VG9Xb3JrZXIoZmFsc2UpO1xuICBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXSA9IGF3YWl0IE1vbmVyb1dhbGxldEtleXMuY3JlYXRlV2FsbGV0KGNvbmZpZyk7XG59XG5cbnNlbGYuY3JlYXRlV2FsbGV0RnVsbCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBjb25maWdKc29uKSB7XG4gIGxldCBjb25maWcgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKGNvbmZpZ0pzb24pO1xuICBsZXQgcGF0aCA9IGNvbmZpZy5nZXRQYXRoKCk7XG4gIGNvbmZpZy5zZXRQYXRoKFwiXCIpO1xuICBjb25maWcuc2V0UHJveHlUb1dvcmtlcihmYWxzZSk7XG4gIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdID0gYXdhaXQgTW9uZXJvV2FsbGV0RnVsbC5jcmVhdGVXYWxsZXQoY29uZmlnKTtcbiAgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2V0QnJvd3Nlck1haW5QYXRoKHBhdGgpO1xufVxuXG5zZWxmLmlzVmlld09ubHkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaXNWaWV3T25seSgpO1xufVxuXG5zZWxmLmdldE5ldHdvcmtUeXBlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldE5ldHdvcmtUeXBlKCk7XG59XG5cbi8vXG4vL2FzeW5jIGdldFZlcnNpb24oKSB7XG4vLyAgdGhyb3cgbmV3IEVycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuLy99XG5cbnNlbGYuZ2V0U2VlZCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRTZWVkKCk7XG59XG5cbnNlbGYuZ2V0U2VlZExhbmd1YWdlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFNlZWRMYW5ndWFnZSgpO1xufVxuXG5zZWxmLmdldFNlZWRMYW5ndWFnZXMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0U2VlZExhbmd1YWdlcygpO1xufVxuXG5zZWxmLmdldFByaXZhdGVTcGVuZEtleSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRQcml2YXRlU3BlbmRLZXkoKTtcbn1cblxuc2VsZi5nZXRQcml2YXRlVmlld0tleSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRQcml2YXRlVmlld0tleSgpO1xufVxuXG5zZWxmLmdldFB1YmxpY1ZpZXdLZXkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0UHVibGljVmlld0tleSgpO1xufVxuXG5zZWxmLmdldFB1YmxpY1NwZW5kS2V5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFB1YmxpY1NwZW5kS2V5KCk7XG59XG5cbnNlbGYuZ2V0QWRkcmVzcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRBZGRyZXNzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpO1xufVxuXG5zZWxmLmdldEFkZHJlc3NJbmRleCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhZGRyZXNzKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0QWRkcmVzc0luZGV4KGFkZHJlc3MpKS50b0pzb24oKTtcbn1cblxuc2VsZi5zZXRTdWJhZGRyZXNzTGFiZWwgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCwgbGFiZWwpIHtcbiAgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2V0U3ViYWRkcmVzc0xhYmVsKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIGxhYmVsKTtcbn1cblxuc2VsZi5nZXRJbnRlZ3JhdGVkQWRkcmVzcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBzdGFuZGFyZEFkZHJlc3MsIHBheW1lbnRJZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldEludGVncmF0ZWRBZGRyZXNzKHN0YW5kYXJkQWRkcmVzcywgcGF5bWVudElkKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgaW50ZWdyYXRlZEFkZHJlc3MpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5kZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyhpbnRlZ3JhdGVkQWRkcmVzcykpLnRvSnNvbigpO1xufVxuXG5zZWxmLnNldERhZW1vbkNvbm5lY3Rpb24gPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgY29uZmlnKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zZXREYWVtb25Db25uZWN0aW9uKGNvbmZpZyA/IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKE9iamVjdC5hc3NpZ24oY29uZmlnLCB7cHJveHlUb1dvcmtlcjogZmFsc2V9KSkgOiB1bmRlZmluZWQpO1xufVxuXG5zZWxmLmdldERhZW1vbkNvbm5lY3Rpb24gPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICBsZXQgY29ubmVjdGlvbiA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldERhZW1vbkNvbm5lY3Rpb24oKTtcbiAgcmV0dXJuIGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldENvbmZpZygpIDogdW5kZWZpbmVkO1xufVxuXG5zZWxmLmlzQ29ubmVjdGVkVG9EYWVtb24gPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaXNDb25uZWN0ZWRUb0RhZW1vbigpO1xufVxuXG5zZWxmLmdldFJlc3RvcmVIZWlnaHQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0UmVzdG9yZUhlaWdodCgpO1xufVxuXG5zZWxmLnNldFJlc3RvcmVIZWlnaHQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgcmVzdG9yZUhlaWdodCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2V0UmVzdG9yZUhlaWdodChyZXN0b3JlSGVpZ2h0KTtcbn1cblxuc2VsZi5nZXREYWVtb25IZWlnaHQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0RGFlbW9uSGVpZ2h0KCk7XG59XG5cbnNlbGYuZ2V0RGFlbW9uTWF4UGVlckhlaWdodCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXREYWVtb25NYXhQZWVySGVpZ2h0KClcbn1cblxuc2VsZi5nZXRIZWlnaHRCeURhdGUgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgeWVhciwgbW9udGgsIGRheSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0SGVpZ2h0QnlEYXRlKHllYXIsIG1vbnRoLCBkYXkpO1xufVxuXG5zZWxmLmlzRGFlbW9uU3luY2VkID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmlzRGFlbW9uU3luY2VkKCk7XG59XG5cbnNlbGYuZ2V0SGVpZ2h0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldEhlaWdodCgpO1xufVxuXG5zZWxmLmFkZExpc3RlbmVyID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGxpc3RlbmVySWQpIHtcbiAgXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBsaXN0ZW5lciB0byBicmlkZ2Ugbm90aWZpY2F0aW9ucyB0byBleHRlcm5hbCBsaXN0ZW5lcnMuXG4gICAqIFxuICAgKiBUT0RPOiBNb25lcm9XYWxsZXRMaXN0ZW5lciBpcyBub3QgZGVmaW5lZCB1bnRpbCBzY3JpcHRzIGltcG9ydGVkXG4gICAqIFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgY2xhc3MgV2FsbGV0V29ya2VySGVscGVyTGlzdGVuZXIgZXh0ZW5kcyBNb25lcm9XYWxsZXRMaXN0ZW5lciB7XG5cbiAgICBwcm90ZWN0ZWQgd2FsbGV0SWQ6IHN0cmluZztcbiAgICBwcm90ZWN0ZWQgaWQ6IHN0cmluZztcbiAgICBwcm90ZWN0ZWQgd29ya2VyOiBXb3JrZXI7XG4gICAgXG4gICAgY29uc3RydWN0b3Iod2FsbGV0SWQsIGlkLCB3b3JrZXIpIHtcbiAgICAgIHN1cGVyKCk7XG4gICAgICB0aGlzLndhbGxldElkID0gd2FsbGV0SWQ7XG4gICAgICB0aGlzLmlkID0gaWQ7XG4gICAgICB0aGlzLndvcmtlciA9IHdvcmtlcjtcbiAgICB9XG4gICAgXG4gICAgZ2V0SWQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5pZDtcbiAgICB9XG4gICAgXG4gICAgYXN5bmMgb25TeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSkge1xuICAgICAgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2UoW3RoaXMud2FsbGV0SWQsIFwib25TeW5jUHJvZ3Jlc3NfXCIgKyB0aGlzLmdldElkKCksIGhlaWdodCwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgcGVyY2VudERvbmUsIG1lc3NhZ2VdKTtcbiAgICB9XG5cbiAgICBhc3luYyBvbk5ld0Jsb2NrKGhlaWdodCkgeyBcbiAgICAgIHRoaXMud29ya2VyLnBvc3RNZXNzYWdlKFt0aGlzLndhbGxldElkLCBcIm9uTmV3QmxvY2tfXCIgKyB0aGlzLmdldElkKCksIGhlaWdodF0pO1xuICAgIH1cbiAgICBcbiAgICBhc3luYyBvbkJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlLCBuZXdVbmxvY2tlZEJhbGFuY2UpIHtcbiAgICAgIHRoaXMud29ya2VyLnBvc3RNZXNzYWdlKFt0aGlzLndhbGxldElkLCBcIm9uQmFsYW5jZXNDaGFuZ2VkX1wiICsgdGhpcy5nZXRJZCgpLCBuZXdCYWxhbmNlLnRvU3RyaW5nKCksIG5ld1VubG9ja2VkQmFsYW5jZS50b1N0cmluZygpXSk7XG4gICAgfVxuXG4gICBhc3luYyBvbk91dHB1dFJlY2VpdmVkKG91dHB1dCkge1xuICAgICAgbGV0IGJsb2NrID0gb3V0cHV0LmdldFR4KCkuZ2V0QmxvY2soKTtcbiAgICAgIGlmIChibG9jayA9PT0gdW5kZWZpbmVkKSBibG9jayA9IG5ldyBNb25lcm9CbG9jaygpLnNldFR4cyhbb3V0cHV0LmdldFR4KCldKTtcbiAgICAgIHRoaXMud29ya2VyLnBvc3RNZXNzYWdlKFt0aGlzLndhbGxldElkLCBcIm9uT3V0cHV0UmVjZWl2ZWRfXCIgKyB0aGlzLmdldElkKCksIGJsb2NrLnRvSnNvbigpXSk7ICAvLyBzZXJpYWxpemUgZnJvbSByb290IGJsb2NrXG4gICAgfVxuICAgIFxuICAgIGFzeW5jIG9uT3V0cHV0U3BlbnQob3V0cHV0KSB7XG4gICAgICBsZXQgYmxvY2sgPSBvdXRwdXQuZ2V0VHgoKS5nZXRCbG9jaygpO1xuICAgICAgaWYgKGJsb2NrID09PSB1bmRlZmluZWQpIGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0VHhzKFtvdXRwdXQuZ2V0VHgoKV0pO1xuICAgICAgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2UoW3RoaXMud2FsbGV0SWQsIFwib25PdXRwdXRTcGVudF9cIiArIHRoaXMuZ2V0SWQoKSwgYmxvY2sudG9Kc29uKCldKTsgICAgIC8vIHNlcmlhbGl6ZSBmcm9tIHJvb3QgYmxvY2tcbiAgICB9XG4gIH1cbiAgXG4gIGxldCBsaXN0ZW5lciA9IG5ldyBXYWxsZXRXb3JrZXJIZWxwZXJMaXN0ZW5lcih3YWxsZXRJZCwgbGlzdGVuZXJJZCwgc2VsZik7XG4gIGlmICghc2VsZi5saXN0ZW5lcnMpIHNlbGYubGlzdGVuZXJzID0gW107XG4gIHNlbGYubGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuICBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG59XG5cbnNlbGYucmVtb3ZlTGlzdGVuZXIgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbGlzdGVuZXJJZCkge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGYubGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHNlbGYubGlzdGVuZXJzW2ldLmdldElkKCkgIT09IGxpc3RlbmVySWQpIGNvbnRpbnVlO1xuICAgIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnJlbW92ZUxpc3RlbmVyKHNlbGYubGlzdGVuZXJzW2ldKTtcbiAgICBzZWxmLmxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkxpc3RlbmVyIGlzIG5vdCByZWdpc3RlcmVkIHdpdGggd2FsbGV0XCIpO1xufVxuXG5zZWxmLmlzU3luY2VkID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmlzU3luY2VkKCk7XG59XG5cbnNlbGYuc3luYyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBzdGFydEhlaWdodCwgYWxsb3dDb25jdXJyZW50Q2FsbHMpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zeW5jKHVuZGVmaW5lZCwgc3RhcnRIZWlnaHQsIGFsbG93Q29uY3VycmVudENhbGxzKSk7XG59XG5cbnNlbGYuc3RhcnRTeW5jaW5nID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHN5bmNQZXJpb2RJbk1zKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zdGFydFN5bmNpbmcoc3luY1BlcmlvZEluTXMpO1xufVxuXG5zZWxmLnN0b3BTeW5jaW5nID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN0b3BTeW5jaW5nKCk7XG59XG5cbnNlbGYuc2NhblR4cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eEhhc2hlcykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2NhblR4cyh0eEhhc2hlcyk7XG59XG5cbnNlbGYucmVzY2FuU3BlbnQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0ucmVzY2FuU3BlbnQoKTtcbn1cblxuc2VsZi5yZXNjYW5CbG9ja2NoYWluID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnJlc2NhbkJsb2NrY2hhaW4oKTtcbn1cblxuc2VsZi5nZXRCYWxhbmNlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRCYWxhbmNlKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpKS50b1N0cmluZygpO1xufVxuXG5zZWxmLmdldFVubG9ja2VkQmFsYW5jZSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0VW5sb2NrZWRCYWxhbmNlKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpKS50b1N0cmluZygpO1xufVxuXG5zZWxmLmdldEFjY291bnRzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGluY2x1ZGVTdWJhZGRyZXNzZXMsIHRhZykge1xuICBsZXQgYWNjb3VudEpzb25zID0gW107XG4gIGZvciAobGV0IGFjY291bnQgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0QWNjb3VudHMoaW5jbHVkZVN1YmFkZHJlc3NlcywgdGFnKSkgYWNjb3VudEpzb25zLnB1c2goYWNjb3VudC50b0pzb24oKSk7XG4gIHJldHVybiBhY2NvdW50SnNvbnM7XG59XG5cbnNlbGYuZ2V0QWNjb3VudCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SWR4LCBpbmNsdWRlU3ViYWRkcmVzc2VzKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0QWNjb3VudChhY2NvdW50SWR4LCBpbmNsdWRlU3ViYWRkcmVzc2VzKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuY3JlYXRlQWNjb3VudCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBsYWJlbCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmNyZWF0ZUFjY291bnQobGFiZWwpKS50b0pzb24oKTtcbn1cblxuc2VsZi5nZXRTdWJhZGRyZXNzZXMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0luZGljZXMpIHtcbiAgbGV0IHN1YmFkZHJlc3NKc29ucyA9IFtdO1xuICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSW5kaWNlcykpIHN1YmFkZHJlc3NKc29ucy5wdXNoKHN1YmFkZHJlc3MudG9Kc29uKCkpO1xuICByZXR1cm4gc3ViYWRkcmVzc0pzb25zO1xufVxuXG5zZWxmLmNyZWF0ZVN1YmFkZHJlc3MgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWNjb3VudElkeCwgbGFiZWwpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jcmVhdGVTdWJhZGRyZXNzKGFjY291bnRJZHgsIGxhYmVsKSkudG9Kc29uKCk7XG59XG5cbi8vIFRPRE86IGVhc2llciBvciBtb3JlIGVmZmljaWVudCB3YXkgdGhhbiBzZXJpYWxpemluZyBmcm9tIHJvb3QgYmxvY2tzP1xuc2VsZi5nZXRUeHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYmxvY2tKc29uUXVlcnkpIHtcbiAgXG4gIC8vIGRlc2VyaWFsaXplIHF1ZXJ5IHdoaWNoIGlzIGpzb24gc3RyaW5nIHJvb3RlZCBhdCBibG9ja1xuICBsZXQgcXVlcnkgPSBuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uUXVlcnksIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFhfUVVFUlkpLmdldFR4cygpWzBdO1xuICBcbiAgLy8gZ2V0IHR4c1xuICBsZXQgdHhzID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0VHhzKHF1ZXJ5KTtcbiAgXG4gIC8vIGNvbGxlY3QgdW5pcXVlIGJsb2NrcyB0byBwcmVzZXJ2ZSBtb2RlbCByZWxhdGlvbnNoaXBzIGFzIHRyZWVzIChiYXNlZCBvbiBtb25lcm9fd2FzbV9icmlkZ2UuY3BwOjpnZXRfdHhzKVxuICBsZXQgc2VlbkJsb2NrcyA9IG5ldyBTZXQoKTtcbiAgbGV0IHVuY29uZmlybWVkQmxvY2sgPSB1bmRlZmluZWQ7XG4gIGxldCBibG9ja3MgPSBbXTtcbiAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgaWYgKCF0eC5nZXRCbG9jaygpKSB7XG4gICAgICBpZiAoIXVuY29uZmlybWVkQmxvY2spIHVuY29uZmlybWVkQmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soKS5zZXRUeHMoW10pO1xuICAgICAgdHguc2V0QmxvY2sodW5jb25maXJtZWRCbG9jayk7XG4gICAgICB1bmNvbmZpcm1lZEJsb2NrLmdldFR4cygpLnB1c2godHgpO1xuICAgIH1cbiAgICBpZiAoIXNlZW5CbG9ja3MuaGFzKHR4LmdldEJsb2NrKCkpKSB7XG4gICAgICBzZWVuQmxvY2tzLmFkZCh0eC5nZXRCbG9jaygpKTtcbiAgICAgIGJsb2Nrcy5wdXNoKHR4LmdldEJsb2NrKCkpO1xuICAgIH1cbiAgfVxuICBcbiAgLy8gc2VyaWFsaXplIGJsb2NrcyB0byBqc29uXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYmxvY2tzLmxlbmd0aDsgaSsrKSBibG9ja3NbaV0gPSBibG9ja3NbaV0udG9Kc29uKCk7XG4gIHJldHVybiB7YmxvY2tzOiBibG9ja3N9O1xufVxuXG5zZWxmLmdldFRyYW5zZmVycyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBibG9ja0pzb25RdWVyeSkge1xuICBcbiAgLy8gZGVzZXJpYWxpemUgcXVlcnkgd2hpY2ggaXMganNvbiBzdHJpbmcgcm9vdGVkIGF0IGJsb2NrXG4gIGxldCBxdWVyeSA9IChuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uUXVlcnksIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFhfUVVFUlkpLmdldFR4cygpWzBdIGFzIE1vbmVyb1R4UXVlcnkpLmdldFRyYW5zZmVyUXVlcnkoKTtcbiAgXG4gIC8vIGdldCB0cmFuc2ZlcnNcbiAgbGV0IHRyYW5zZmVycyA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFRyYW5zZmVycyhxdWVyeSk7XG4gIFxuICAvLyBjb2xsZWN0IHVuaXF1ZSBibG9ja3MgdG8gcHJlc2VydmUgbW9kZWwgcmVsYXRpb25zaGlwcyBhcyB0cmVlXG4gIGxldCB1bmNvbmZpcm1lZEJsb2NrID0gdW5kZWZpbmVkO1xuICBsZXQgYmxvY2tzID0gW107XG4gIGxldCBzZWVuQmxvY2tzID0gbmV3IFNldCgpO1xuICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0cmFuc2ZlcnMpIHtcbiAgICBsZXQgdHggPSB0cmFuc2Zlci5nZXRUeCgpO1xuICAgIGlmICghdHguZ2V0QmxvY2soKSkge1xuICAgICAgaWYgKCF1bmNvbmZpcm1lZEJsb2NrKSB1bmNvbmZpcm1lZEJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0VHhzKFtdKTtcbiAgICAgIHR4LnNldEJsb2NrKHVuY29uZmlybWVkQmxvY2spO1xuICAgICAgdW5jb25maXJtZWRCbG9jay5nZXRUeHMoKS5wdXNoKHR4KTtcbiAgICB9XG4gICAgaWYgKCFzZWVuQmxvY2tzLmhhcyh0eC5nZXRCbG9jaygpKSkge1xuICAgICAgc2VlbkJsb2Nrcy5hZGQodHguZ2V0QmxvY2soKSk7XG4gICAgICBibG9ja3MucHVzaCh0eC5nZXRCbG9jaygpKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIHNlcmlhbGl6ZSBibG9ja3MgdG8ganNvblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGJsb2Nrcy5sZW5ndGg7IGkrKykgYmxvY2tzW2ldID0gYmxvY2tzW2ldLnRvSnNvbigpO1xuICByZXR1cm4gYmxvY2tzO1xufVxuXG5zZWxmLmdldE91dHB1dHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYmxvY2tKc29uUXVlcnkpIHtcblxuICAvLyBkZXNlcmlhbGl6ZSBxdWVyeSB3aGljaCBpcyBqc29uIHN0cmluZyByb290ZWQgYXQgYmxvY2tcbiAgbGV0IHF1ZXJ5ID0gKG5ldyBNb25lcm9CbG9jayhibG9ja0pzb25RdWVyeSwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWF9RVUVSWSkuZ2V0VHhzKClbMF0gYXMgTW9uZXJvVHhRdWVyeSkuZ2V0T3V0cHV0UXVlcnkoKTtcbiAgXG4gIC8vIGdldCBvdXRwdXRzXG4gIGxldCBvdXRwdXRzID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0T3V0cHV0cyhxdWVyeSk7XG4gIFxuICAvLyBjb2xsZWN0IHVuaXF1ZSBibG9ja3MgdG8gcHJlc2VydmUgbW9kZWwgcmVsYXRpb25zaGlwcyBhcyB0cmVlXG4gIGxldCB1bmNvbmZpcm1lZEJsb2NrID0gdW5kZWZpbmVkO1xuICBsZXQgYmxvY2tzID0gW107XG4gIGxldCBzZWVuQmxvY2tzID0gbmV3IFNldCgpO1xuICBmb3IgKGxldCBvdXRwdXQgb2Ygb3V0cHV0cykge1xuICAgIGxldCB0eCA9IG91dHB1dC5nZXRUeCgpO1xuICAgIGlmICghdHguZ2V0QmxvY2soKSkge1xuICAgICAgaWYgKCF1bmNvbmZpcm1lZEJsb2NrKSB1bmNvbmZpcm1lZEJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0VHhzKFtdKTtcbiAgICAgIHR4LnNldEJsb2NrKHVuY29uZmlybWVkQmxvY2spO1xuICAgICAgdW5jb25maXJtZWRCbG9jay5nZXRUeHMoKS5wdXNoKHR4KTtcbiAgICB9XG4gICAgaWYgKCFzZWVuQmxvY2tzLmhhcyh0eC5nZXRCbG9jaygpKSkge1xuICAgICAgc2VlbkJsb2Nrcy5hZGQodHguZ2V0QmxvY2soKSk7XG4gICAgICBibG9ja3MucHVzaCh0eC5nZXRCbG9jaygpKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIHNlcmlhbGl6ZSBibG9ja3MgdG8ganNvblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGJsb2Nrcy5sZW5ndGg7IGkrKykgYmxvY2tzW2ldID0gYmxvY2tzW2ldLnRvSnNvbigpO1xuICByZXR1cm4gYmxvY2tzO1xufVxuXG5zZWxmLmV4cG9ydE91dHB1dHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWxsKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5leHBvcnRPdXRwdXRzKGFsbCk7XG59XG5cbnNlbGYuaW1wb3J0T3V0cHV0cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBvdXRwdXRzSGV4KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pbXBvcnRPdXRwdXRzKG91dHB1dHNIZXgpO1xufVxuXG5zZWxmLmdldEtleUltYWdlcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhbGwpIHtcbiAgbGV0IGtleUltYWdlc0pzb24gPSBbXTtcbiAgZm9yIChsZXQga2V5SW1hZ2Ugb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZXhwb3J0S2V5SW1hZ2VzKGFsbCkpIGtleUltYWdlc0pzb24ucHVzaChrZXlJbWFnZS50b0pzb24oKSk7XG4gIHJldHVybiBrZXlJbWFnZXNKc29uO1xufVxuXG5zZWxmLmltcG9ydEtleUltYWdlcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBrZXlJbWFnZXNKc29uKSB7XG4gIGxldCBrZXlJbWFnZXMgPSBbXTtcbiAgZm9yIChsZXQga2V5SW1hZ2VKc29uIG9mIGtleUltYWdlc0pzb24pIGtleUltYWdlcy5wdXNoKG5ldyBNb25lcm9LZXlJbWFnZShrZXlJbWFnZUpzb24pKTtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pbXBvcnRLZXlJbWFnZXMoa2V5SW1hZ2VzKSkudG9Kc29uKCk7XG59XG5cbi8vYXN5bmMgZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQoKSB7XG4vLyAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuLy99XG5cbnNlbGYuZnJlZXplT3V0cHV0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGtleUltYWdlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5mcmVlemVPdXRwdXQoa2V5SW1hZ2UpO1xufVxuXG5zZWxmLnRoYXdPdXRwdXQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwga2V5SW1hZ2UpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnRoYXdPdXRwdXQoa2V5SW1hZ2UpO1xufVxuXG5zZWxmLmlzT3V0cHV0RnJvemVuID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGtleUltYWdlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pc091dHB1dEZyb3plbihrZXlJbWFnZSk7XG59XG5cbnNlbGYuY3JlYXRlVHhzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGNvbmZpZykge1xuICBpZiAodHlwZW9mIGNvbmZpZyA9PT0gXCJvYmplY3RcIikgY29uZmlnID0gbmV3IE1vbmVyb1R4Q29uZmlnKGNvbmZpZyk7XG4gIGxldCB0eHMgPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jcmVhdGVUeHMoY29uZmlnKTtcbiAgcmV0dXJuIHR4c1swXS5nZXRUeFNldCgpLnRvSnNvbigpO1xufVxuXG5zZWxmLnN3ZWVwT3V0cHV0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGNvbmZpZykge1xuICBpZiAodHlwZW9mIGNvbmZpZyA9PT0gXCJvYmplY3RcIikgY29uZmlnID0gbmV3IE1vbmVyb1R4Q29uZmlnKGNvbmZpZyk7XG4gIGxldCB0eCA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN3ZWVwT3V0cHV0KGNvbmZpZyk7XG4gIHJldHVybiB0eC5nZXRUeFNldCgpLnRvSnNvbigpO1xufVxuXG5zZWxmLnN3ZWVwVW5sb2NrZWQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgY29uZmlnKSB7XG4gIGlmICh0eXBlb2YgY29uZmlnID09PSBcIm9iamVjdFwiKSBjb25maWcgPSBuZXcgTW9uZXJvVHhDb25maWcoY29uZmlnKTtcbiAgbGV0IHR4cyA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN3ZWVwVW5sb2NrZWQoY29uZmlnKTtcbiAgbGV0IHR4U2V0cyA9IFtdO1xuICBmb3IgKGxldCB0eCBvZiB0eHMpIGlmICghR2VuVXRpbHMuYXJyYXlDb250YWlucyh0eFNldHMsIHR4LmdldFR4U2V0KCkpKSB0eFNldHMucHVzaCh0eC5nZXRUeFNldCgpKTtcbiAgbGV0IHR4U2V0c0pzb24gPSBbXTtcbiAgZm9yIChsZXQgdHhTZXQgb2YgdHhTZXRzKSB0eFNldHNKc29uLnB1c2godHhTZXQudG9Kc29uKCkpO1xuICByZXR1cm4gdHhTZXRzSnNvbjtcbn1cblxuc2VsZi5zd2VlcER1c3QgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgcmVsYXkpIHtcbiAgbGV0IHR4cyA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN3ZWVwRHVzdChyZWxheSk7XG4gIHJldHVybiB0eHMubGVuZ3RoID09PSAwID8ge30gOiB0eHNbMF0uZ2V0VHhTZXQoKS50b0pzb24oKTtcbn1cblxuc2VsZi5yZWxheVR4cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eE1ldGFkYXRhcykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0ucmVsYXlUeHModHhNZXRhZGF0YXMpO1xufVxuXG5zZWxmLmRlc2NyaWJlVHhTZXQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdHhTZXRKc29uKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZGVzY3JpYmVUeFNldChuZXcgTW9uZXJvVHhTZXQodHhTZXRKc29uKSkpLnRvSnNvbigpO1xufVxuXG5zZWxmLnNpZ25UeHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdW5zaWduZWRUeEhleCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2lnblR4cyh1bnNpZ25lZFR4SGV4KTtcbn1cblxuc2VsZi5zdWJtaXRUeHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgc2lnbmVkVHhIZXgpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN1Ym1pdFR4cyhzaWduZWRUeEhleCk7XG59XG5cbnNlbGYuc2lnbk1lc3NhZ2UgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbWVzc2FnZSwgc2lnbmF0dXJlVHlwZSwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2lnbk1lc3NhZ2UobWVzc2FnZSwgc2lnbmF0dXJlVHlwZSwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG59XG5cbnNlbGYudmVyaWZ5TWVzc2FnZSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBtZXNzYWdlLCBhZGRyZXNzLCBzaWduYXR1cmUpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS52ZXJpZnlNZXNzYWdlKG1lc3NhZ2UsIGFkZHJlc3MsIHNpZ25hdHVyZSkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmdldFR4S2V5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0VHhLZXkodHhIYXNoKTtcbn1cblxuc2VsZi5jaGVja1R4S2V5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaCwgdHhLZXksIGFkZHJlc3MpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jaGVja1R4S2V5KHR4SGFzaCwgdHhLZXksIGFkZHJlc3MpKS50b0pzb24oKTtcbn1cblxuc2VsZi5nZXRUeFByb29mID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaCwgYWRkcmVzcywgbWVzc2FnZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0VHhQcm9vZih0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UpO1xufVxuXG5zZWxmLmNoZWNrVHhQcm9vZiA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmNoZWNrVHhQcm9vZih0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmdldFNwZW5kUHJvb2YgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdHhIYXNoLCBtZXNzYWdlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRTcGVuZFByb29mKHR4SGFzaCwgbWVzc2FnZSk7XG59XG5cbnNlbGYuY2hlY2tTcGVuZFByb29mID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaCwgbWVzc2FnZSwgc2lnbmF0dXJlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jaGVja1NwZW5kUHJvb2YodHhIYXNoLCBtZXNzYWdlLCBzaWduYXR1cmUpO1xufVxuXG5zZWxmLmdldFJlc2VydmVQcm9vZldhbGxldCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBtZXNzYWdlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRSZXNlcnZlUHJvb2ZXYWxsZXQobWVzc2FnZSk7XG59XG5cbnNlbGYuZ2V0UmVzZXJ2ZVByb29mQWNjb3VudCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SWR4LCBhbW91bnRTdHIsIG1lc3NhZ2UpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFJlc2VydmVQcm9vZkFjY291bnQoYWNjb3VudElkeCwgYW1vdW50U3RyLCBtZXNzYWdlKTtcbn1cblxuc2VsZi5jaGVja1Jlc2VydmVQcm9vZiA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jaGVja1Jlc2VydmVQcm9vZihhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUpKS50b0pzb24oKTtcbn1cblxuc2VsZi5nZXRUeE5vdGVzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaGVzKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRUeE5vdGVzKHR4SGFzaGVzKTtcbn1cblxuc2VsZi5zZXRUeE5vdGVzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaGVzLCB0eE5vdGVzKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zZXRUeE5vdGVzKHR4SGFzaGVzLCB0eE5vdGVzKTtcbn1cblxuc2VsZi5nZXRBZGRyZXNzQm9va0VudHJpZXMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgZW50cnlJbmRpY2VzKSB7XG4gIGxldCBlbnRyaWVzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBlbnRyeSBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRBZGRyZXNzQm9va0VudHJpZXMoZW50cnlJbmRpY2VzKSkgZW50cmllc0pzb24ucHVzaChlbnRyeS50b0pzb24oKSk7XG4gIHJldHVybiBlbnRyaWVzSnNvbjtcbn1cblxuc2VsZi5hZGRBZGRyZXNzQm9va0VudHJ5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFkZHJlc3MsIGRlc2NyaXB0aW9uKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5hZGRBZGRyZXNzQm9va0VudHJ5KGFkZHJlc3MsIGRlc2NyaXB0aW9uKTtcbn1cblxuc2VsZi5lZGl0QWRkcmVzc0Jvb2tFbnRyeSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBpbmRleCwgc2V0QWRkcmVzcywgYWRkcmVzcywgc2V0RGVzY3JpcHRpb24sIGRlc2NyaXB0aW9uKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5lZGl0QWRkcmVzc0Jvb2tFbnRyeShpbmRleCwgc2V0QWRkcmVzcywgYWRkcmVzcywgc2V0RGVzY3JpcHRpb24sIGRlc2NyaXB0aW9uKTtcbn1cblxuc2VsZi5kZWxldGVBZGRyZXNzQm9va0VudHJ5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGluZGV4KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5kZWxldGVBZGRyZXNzQm9va0VudHJ5KGluZGV4KTtcbn1cblxuc2VsZi50YWdBY2NvdW50cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0YWcsIGFjY291bnRJbmRpY2VzKSB7XG4gIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbn1cblxuc2VsZi51bnRhZ0FjY291bnRzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFjY291bnRJbmRpY2VzKSB7XG4gIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbn1cblxuc2VsZi5nZXRBY2NvdW50VGFncyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbn1cblxuc2VsZi5zZXRBY2NvdW50VGFnTGFiZWwgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdGFnLCBsYWJlbCkge1xuICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG59XG5cbnNlbGYuZ2V0UGF5bWVudFVyaSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBjb25maWdKc29uKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRQYXltZW50VXJpKG5ldyBNb25lcm9UeENvbmZpZyhjb25maWdKc29uKSk7XG59XG5cbnNlbGYucGFyc2VQYXltZW50VXJpID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHVyaSkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnBhcnNlUGF5bWVudFVyaSh1cmkpKS50b0pzb24oKTtcbn1cblxuc2VsZi5nZXRBdHRyaWJ1dGUgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwga2V5KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRBdHRyaWJ1dGUoa2V5KTtcbn1cblxuc2VsZi5zZXRBdHRyaWJ1dGUgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwga2V5LCB2YWx1ZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpO1xufVxuXG5zZWxmLnN0YXJ0TWluaW5nID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG51bVRocmVhZHMsIGJhY2tncm91bmRNaW5pbmcsIGlnbm9yZUJhdHRlcnkpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN0YXJ0TWluaW5nKG51bVRocmVhZHMsIGJhY2tncm91bmRNaW5pbmcsIGlnbm9yZUJhdHRlcnkpO1xufVxuXG5zZWxmLnN0b3BNaW5pbmcgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc3RvcE1pbmluZygpO1xufVxuXG5zZWxmLmlzTXVsdGlzaWdJbXBvcnROZWVkZWQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCgpO1xufVxuXG5zZWxmLmlzTXVsdGlzaWcgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaXNNdWx0aXNpZygpO1xufVxuXG5zZWxmLmdldE11bHRpc2lnSW5mbyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0TXVsdGlzaWdJbmZvKCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLnByZXBhcmVNdWx0aXNpZyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5wcmVwYXJlTXVsdGlzaWcoKTtcbn1cblxuc2VsZi5tYWtlTXVsdGlzaWcgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbXVsdGlzaWdIZXhlcywgdGhyZXNob2xkLCBwYXNzd29yZCkge1xuICByZXR1cm4gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0ubWFrZU11bHRpc2lnKG11bHRpc2lnSGV4ZXMsIHRocmVzaG9sZCwgcGFzc3dvcmQpO1xufVxuXG5zZWxmLmV4Y2hhbmdlTXVsdGlzaWdLZXlzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG11bHRpc2lnSGV4ZXMsIHBhc3N3b3JkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZXhjaGFuZ2VNdWx0aXNpZ0tleXMobXVsdGlzaWdIZXhlcywgcGFzc3dvcmQpKS50b0pzb24oKTtcbn1cblxuc2VsZi5leHBvcnRNdWx0aXNpZ0hleCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5leHBvcnRNdWx0aXNpZ0hleCgpO1xufVxuXG5zZWxmLmltcG9ydE11bHRpc2lnSGV4ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG11bHRpc2lnSGV4ZXMpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmltcG9ydE11bHRpc2lnSGV4KG11bHRpc2lnSGV4ZXMpO1xufVxuXG5zZWxmLnNpZ25NdWx0aXNpZ1R4SGV4ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG11bHRpc2lnVHhIZXgpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zaWduTXVsdGlzaWdUeEhleChtdWx0aXNpZ1R4SGV4KSkudG9Kc29uKCk7XG59XG5cbnNlbGYuc3VibWl0TXVsdGlzaWdUeEhleCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBzaWduZWRNdWx0aXNpZ1R4SGV4KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zdWJtaXRNdWx0aXNpZ1R4SGV4KHNpZ25lZE11bHRpc2lnVHhIZXgpO1xufVxuXG5zZWxmLmdldERhdGEgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0RGF0YSgpO1xufVxuXG5zZWxmLmNoYW5nZVBhc3N3b3JkID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG9sZFBhc3N3b3JkLCBuZXdQYXNzd29yZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uY2hhbmdlUGFzc3dvcmQob2xkUGFzc3dvcmQsIG5ld1Bhc3N3b3JkKTtcbn1cblxuc2VsZi5pc0Nsb3NlZCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pc0Nsb3NlZCgpO1xufVxuXG5zZWxmLmNsb3NlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHNhdmUpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmNsb3NlKHNhdmUpOyAvLyBUT0RPOiByZW1vdmUgbGlzdGVuZXJzIGFuZCBkZWxldGUgd2FsbGV0IGZyb20gV09SS0VSX09CSkVDVFNcbn0iXSwibWFwcGluZ3MiOiJrR0FBQSxJQUFBQSxPQUFBLEdBQUFD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