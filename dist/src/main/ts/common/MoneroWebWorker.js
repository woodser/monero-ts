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
  return !self.WORKER_OBJECTS[walletId] || self.WORKER_OBJECTS[walletId].isClosed();
};

self.close = async function (walletId, save) {
  return self.WORKER_OBJECTS[walletId].close(save);
  delete self.WORKER_OBJECTS[walletId];
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfSHR0cENsaWVudCIsIl9MaWJyYXJ5VXRpbHMiLCJfTW9uZXJvQmFuIiwiX01vbmVyb0Jsb2NrIiwiX01vbmVyb0RhZW1vbkNvbmZpZyIsIl9Nb25lcm9EYWVtb25MaXN0ZW5lciIsIl9Nb25lcm9EYWVtb25ScGMiLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvS2V5SW1hZ2UiLCJfTW9uZXJvUnBjQ29ubmVjdGlvbiIsIl9Nb25lcm9UeENvbmZpZyIsIl9Nb25lcm9UeFNldCIsIl9Nb25lcm9VdGlscyIsIl9Nb25lcm9XYWxsZXRDb25maWciLCJfTW9uZXJvV2FsbGV0TGlzdGVuZXIiLCJfTW9uZXJvV2FsbGV0S2V5cyIsIl9Nb25lcm9XYWxsZXRGdWxsIiwic2VsZiIsIm9ubWVzc2FnZSIsImUiLCJpbml0T25lVGltZSIsIm9iamVjdElkIiwiZGF0YSIsImZuTmFtZSIsImNhbGxiYWNrSWQiLCJhc3NlcnQiLCJFcnJvciIsInNwbGljZSIsInBvc3RNZXNzYWdlIiwicmVzdWx0IiwiYXBwbHkiLCJlcnJvciIsIkxpYnJhcnlVdGlscyIsInNlcmlhbGl6ZUVycm9yIiwiaXNJbml0aWFsaXplZCIsIldPUktFUl9PQkpFQ1RTIiwiTW9uZXJvVXRpbHMiLCJQUk9YWV9UT19XT1JLRVIiLCJodHRwUmVxdWVzdCIsIm9wdHMiLCJIdHRwQ2xpZW50IiwicmVxdWVzdCIsIk9iamVjdCIsImFzc2lnbiIsInByb3h5VG9Xb3JrZXIiLCJlcnIiLCJzdGF0dXNDb2RlIiwiSlNPTiIsInN0cmluZ2lmeSIsInN0YXR1c01lc3NhZ2UiLCJtZXNzYWdlIiwic2V0TG9nTGV2ZWwiLCJsZXZlbCIsImdldFdhc21NZW1vcnlVc2VkIiwiZ2V0V2FzbU1vZHVsZSIsIkhFQVA4IiwibGVuZ3RoIiwidW5kZWZpbmVkIiwibW9uZXJvVXRpbHNHZXRJbnRlZ3JhdGVkQWRkcmVzcyIsIm5ldHdvcmtUeXBlIiwic3RhbmRhcmRBZGRyZXNzIiwicGF5bWVudElkIiwiZ2V0SW50ZWdyYXRlZEFkZHJlc3MiLCJ0b0pzb24iLCJtb25lcm9VdGlsc1ZhbGlkYXRlQWRkcmVzcyIsImFkZHJlc3MiLCJ2YWxpZGF0ZUFkZHJlc3MiLCJtb25lcm9VdGlsc0pzb25Ub0JpbmFyeSIsImpzb24iLCJqc29uVG9CaW5hcnkiLCJtb25lcm9VdGlsc0JpbmFyeVRvSnNvbiIsInVpbnQ4YXJyIiwiYmluYXJ5VG9Kc29uIiwibW9uZXJvVXRpbHNCaW5hcnlCbG9ja3NUb0pzb24iLCJiaW5hcnlCbG9ja3NUb0pzb24iLCJkYWVtb25BZGRMaXN0ZW5lciIsImRhZW1vbklkIiwibGlzdGVuZXJJZCIsImxpc3RlbmVyIiwiTW9uZXJvRGFlbW9uTGlzdGVuZXIiLCJvbkJsb2NrSGVhZGVyIiwiYmxvY2tIZWFkZXIiLCJkYWVtb25MaXN0ZW5lcnMiLCJhZGRMaXN0ZW5lciIsImRhZW1vblJlbW92ZUxpc3RlbmVyIiwiTW9uZXJvRXJyb3IiLCJyZW1vdmVMaXN0ZW5lciIsImNvbm5lY3REYWVtb25ScGMiLCJjb25maWciLCJNb25lcm9EYWVtb25ScGMiLCJjb25uZWN0VG9EYWVtb25ScGMiLCJNb25lcm9EYWVtb25Db25maWciLCJkYWVtb25HZXRScGNDb25uZWN0aW9uIiwiY29ubmVjdGlvbiIsImdldFJwY0Nvbm5lY3Rpb24iLCJnZXRDb25maWciLCJkYWVtb25Jc0Nvbm5lY3RlZCIsImlzQ29ubmVjdGVkIiwiZGFlbW9uR2V0VmVyc2lvbiIsImdldFZlcnNpb24iLCJkYWVtb25Jc1RydXN0ZWQiLCJpc1RydXN0ZWQiLCJkYWVtb25HZXRIZWlnaHQiLCJnZXRIZWlnaHQiLCJkYWVtb25HZXRCbG9ja0hhc2giLCJoZWlnaHQiLCJnZXRCbG9ja0hhc2giLCJkYWVtb25HZXRCbG9ja1RlbXBsYXRlIiwid2FsbGV0QWRkcmVzcyIsInJlc2VydmVTaXplIiwiZ2V0QmxvY2tUZW1wbGF0ZSIsImRhZW1vbkdldExhc3RCbG9ja0hlYWRlciIsImdldExhc3RCbG9ja0hlYWRlciIsImRhZW1vbkdldEJsb2NrSGVhZGVyQnlIYXNoIiwiaGFzaCIsImdldEJsb2NrSGVhZGVyQnlIYXNoIiwiZGFlbW9uR2V0QmxvY2tIZWFkZXJCeUhlaWdodCIsImdldEJsb2NrSGVhZGVyQnlIZWlnaHQiLCJkYWVtb25HZXRCbG9ja0hlYWRlcnNCeVJhbmdlIiwic3RhcnRIZWlnaHQiLCJlbmRIZWlnaHQiLCJibG9ja0hlYWRlcnNKc29uIiwiZ2V0QmxvY2tIZWFkZXJzQnlSYW5nZSIsInB1c2giLCJkYWVtb25HZXRCbG9ja0J5SGFzaCIsImJsb2NrSGFzaCIsImdldEJsb2NrQnlIYXNoIiwiZGFlbW9uR2V0QmxvY2tzQnlIYXNoIiwiYmxvY2tIYXNoZXMiLCJwcnVuZSIsImJsb2Nrc0pzb24iLCJibG9jayIsImdldEJsb2Nrc0J5SGFzaCIsImRhZW1vbkdldEJsb2NrQnlIZWlnaHQiLCJnZXRCbG9ja0J5SGVpZ2h0IiwiZGFlbW9uR2V0QmxvY2tzQnlIZWlnaHQiLCJoZWlnaHRzIiwiZ2V0QmxvY2tzQnlIZWlnaHQiLCJkYWVtb25HZXRCbG9ja3NCeVJhbmdlIiwiZ2V0QmxvY2tzQnlSYW5nZSIsImRhZW1vbkdldEJsb2Nrc0J5UmFuZ2VDaHVua2VkIiwibWF4Q2h1bmtTaXplIiwiZ2V0QmxvY2tzQnlSYW5nZUNodW5rZWQiLCJkYWVtb25HZXRCbG9ja0hhc2hlcyIsImRhZW1vbkdldFR4cyIsInR4SGFzaGVzIiwidHhzIiwiZ2V0VHhzIiwiYmxvY2tzIiwidW5jb25maXJtZWRCbG9jayIsInNlZW5CbG9ja3MiLCJTZXQiLCJ0eCIsImdldEJsb2NrIiwiTW9uZXJvQmxvY2siLCJzZXRUeHMiLCJzZXRCbG9jayIsImhhcyIsImFkZCIsImkiLCJkYWVtb25HZXRUeEhleGVzIiwiZ2V0VHhIZXhlcyIsImRhZW1vbkdldE1pbmVyVHhTdW0iLCJudW1CbG9ja3MiLCJnZXRNaW5lclR4U3VtIiwiZGFlbW9uR2V0RmVlRXN0aW1hdGUiLCJncmFjZUJsb2NrcyIsImdldEZlZUVzdGltYXRlIiwiZGFlbW9uU3VibWl0VHhIZXgiLCJ0eEhleCIsImRvTm90UmVsYXkiLCJzdWJtaXRUeEhleCIsImRhZW1vblJlbGF5VHhzQnlIYXNoIiwicmVsYXlUeHNCeUhhc2giLCJkYWVtb25HZXRUeFBvb2wiLCJnZXRUeFBvb2wiLCJkYWVtb25HZXRUeFBvb2xIYXNoZXMiLCJnZXRUeFBvb2xIYXNoZXMiLCJkYWVtb25HZXRUeFBvb2xTdGF0cyIsImdldFR4UG9vbFN0YXRzIiwiZGFlbW9uRmx1c2hUeFBvb2wiLCJoYXNoZXMiLCJmbHVzaFR4UG9vbCIsImRhZW1vbkdldEtleUltYWdlU3BlbnRTdGF0dXNlcyIsImtleUltYWdlcyIsImdldEtleUltYWdlU3BlbnRTdGF0dXNlcyIsImRhZW1vbkdldE91dHB1dEhpc3RvZ3JhbSIsImFtb3VudHMiLCJtaW5Db3VudCIsIm1heENvdW50IiwiaXNVbmxvY2tlZCIsInJlY2VudEN1dG9mZiIsImVudHJpZXNKc29uIiwiZW50cnkiLCJnZXRPdXRwdXRIaXN0b2dyYW0iLCJkYWVtb25HZXRJbmZvIiwiZ2V0SW5mbyIsImRhZW1vbkdldFN5bmNJbmZvIiwiZ2V0U3luY0luZm8iLCJkYWVtb25HZXRIYXJkRm9ya0luZm8iLCJnZXRIYXJkRm9ya0luZm8iLCJkYWVtb25HZXRBbHRDaGFpbnMiLCJhbHRDaGFpbnNKc29uIiwiYWx0Q2hhaW4iLCJnZXRBbHRDaGFpbnMiLCJkYWVtb25HZXRBbHRCbG9ja0hhc2hlcyIsImdldEFsdEJsb2NrSGFzaGVzIiwiZGFlbW9uR2V0RG93bmxvYWRMaW1pdCIsImdldERvd25sb2FkTGltaXQiLCJkYWVtb25TZXREb3dubG9hZExpbWl0IiwibGltaXQiLCJzZXREb3dubG9hZExpbWl0IiwiZGFlbW9uUmVzZXREb3dubG9hZExpbWl0IiwicmVzZXREb3dubG9hZExpbWl0IiwiZGFlbW9uR2V0VXBsb2FkTGltaXQiLCJnZXRVcGxvYWRMaW1pdCIsImRhZW1vblNldFVwbG9hZExpbWl0Iiwic2V0VXBsb2FkTGltaXQiLCJkYWVtb25SZXNldFVwbG9hZExpbWl0IiwicmVzZXRVcGxvYWRMaW1pdCIsImRhZW1vbkdldFBlZXJzIiwicGVlcnNKc29uIiwicGVlciIsImdldFBlZXJzIiwiZGFlbW9uR2V0S25vd25QZWVycyIsImdldEtub3duUGVlcnMiLCJkYWVtb25TZXRPdXRnb2luZ1BlZXJMaW1pdCIsInNldE91dGdvaW5nUGVlckxpbWl0IiwiZGFlbW9uU2V0SW5jb21pbmdQZWVyTGltaXQiLCJzZXRJbmNvbWluZ1BlZXJMaW1pdCIsImRhZW1vbkdldFBlZXJCYW5zIiwiYmFuc0pzb24iLCJiYW4iLCJnZXRQZWVyQmFucyIsImRhZW1vblNldFBlZXJCYW5zIiwiYmFucyIsImJhbkpzb24iLCJNb25lcm9CYW4iLCJzZXRQZWVyQmFucyIsImRhZW1vblN0YXJ0TWluaW5nIiwibnVtVGhyZWFkcyIsImlzQmFja2dyb3VuZCIsImlnbm9yZUJhdHRlcnkiLCJzdGFydE1pbmluZyIsImRhZW1vblN0b3BNaW5pbmciLCJzdG9wTWluaW5nIiwiZGFlbW9uR2V0TWluaW5nU3RhdHVzIiwiZ2V0TWluaW5nU3RhdHVzIiwiZGFlbW9uUHJ1bmVCbG9ja2NoYWluIiwiY2hlY2siLCJwcnVuZUJsb2NrY2hhaW4iLCJkYWVtb25TdG9wIiwic3RvcCIsImRhZW1vbldhaXRGb3JOZXh0QmxvY2tIZWFkZXIiLCJ3YWl0Rm9yTmV4dEJsb2NrSGVhZGVyIiwib3BlbldhbGxldERhdGEiLCJ3YWxsZXRJZCIsInBhdGgiLCJwYXNzd29yZCIsImtleXNEYXRhIiwiY2FjaGVEYXRhIiwiZGFlbW9uVXJpT3JDb25maWciLCJkYWVtb25Db25uZWN0aW9uIiwiTW9uZXJvUnBjQ29ubmVjdGlvbiIsIk1vbmVyb1dhbGxldEZ1bGwiLCJvcGVuV2FsbGV0Iiwic2VydmVyIiwic2V0QnJvd3Nlck1haW5QYXRoIiwiY3JlYXRlV2FsbGV0S2V5cyIsImNvbmZpZ0pzb24iLCJNb25lcm9XYWxsZXRDb25maWciLCJzZXRQcm94eVRvV29ya2VyIiwiTW9uZXJvV2FsbGV0S2V5cyIsImNyZWF0ZVdhbGxldCIsImNyZWF0ZVdhbGxldEZ1bGwiLCJnZXRQYXRoIiwic2V0UGF0aCIsImlzVmlld09ubHkiLCJnZXROZXR3b3JrVHlwZSIsImdldFNlZWQiLCJnZXRTZWVkTGFuZ3VhZ2UiLCJnZXRTZWVkTGFuZ3VhZ2VzIiwiZ2V0UHJpdmF0ZVNwZW5kS2V5IiwiZ2V0UHJpdmF0ZVZpZXdLZXkiLCJnZXRQdWJsaWNWaWV3S2V5IiwiZ2V0UHVibGljU3BlbmRLZXkiLCJnZXRBZGRyZXNzIiwiYWNjb3VudElkeCIsInN1YmFkZHJlc3NJZHgiLCJnZXRBZGRyZXNzSW5kZXgiLCJzZXRTdWJhZGRyZXNzTGFiZWwiLCJsYWJlbCIsImRlY29kZUludGVncmF0ZWRBZGRyZXNzIiwiaW50ZWdyYXRlZEFkZHJlc3MiLCJzZXREYWVtb25Db25uZWN0aW9uIiwiZ2V0RGFlbW9uQ29ubmVjdGlvbiIsImlzQ29ubmVjdGVkVG9EYWVtb24iLCJnZXRSZXN0b3JlSGVpZ2h0Iiwic2V0UmVzdG9yZUhlaWdodCIsInJlc3RvcmVIZWlnaHQiLCJnZXREYWVtb25IZWlnaHQiLCJnZXREYWVtb25NYXhQZWVySGVpZ2h0IiwiZ2V0SGVpZ2h0QnlEYXRlIiwieWVhciIsIm1vbnRoIiwiZGF5IiwiaXNEYWVtb25TeW5jZWQiLCJXYWxsZXRXb3JrZXJIZWxwZXJMaXN0ZW5lciIsIk1vbmVyb1dhbGxldExpc3RlbmVyIiwiY29uc3RydWN0b3IiLCJpZCIsIndvcmtlciIsImdldElkIiwib25TeW5jUHJvZ3Jlc3MiLCJwZXJjZW50RG9uZSIsIm9uTmV3QmxvY2siLCJvbkJhbGFuY2VzQ2hhbmdlZCIsIm5ld0JhbGFuY2UiLCJuZXdVbmxvY2tlZEJhbGFuY2UiLCJ0b1N0cmluZyIsIm9uT3V0cHV0UmVjZWl2ZWQiLCJvdXRwdXQiLCJnZXRUeCIsIm9uT3V0cHV0U3BlbnQiLCJsaXN0ZW5lcnMiLCJpc1N5bmNlZCIsInN5bmMiLCJhbGxvd0NvbmN1cnJlbnRDYWxscyIsInN0YXJ0U3luY2luZyIsInN5bmNQZXJpb2RJbk1zIiwic3RvcFN5bmNpbmciLCJzY2FuVHhzIiwicmVzY2FuU3BlbnQiLCJyZXNjYW5CbG9ja2NoYWluIiwiZ2V0QmFsYW5jZSIsImdldFVubG9ja2VkQmFsYW5jZSIsImdldEFjY291bnRzIiwiaW5jbHVkZVN1YmFkZHJlc3NlcyIsInRhZyIsImFjY291bnRKc29ucyIsImFjY291bnQiLCJnZXRBY2NvdW50IiwiY3JlYXRlQWNjb3VudCIsImdldFN1YmFkZHJlc3NlcyIsInN1YmFkZHJlc3NJbmRpY2VzIiwic3ViYWRkcmVzc0pzb25zIiwic3ViYWRkcmVzcyIsImNyZWF0ZVN1YmFkZHJlc3MiLCJibG9ja0pzb25RdWVyeSIsInF1ZXJ5IiwiRGVzZXJpYWxpemF0aW9uVHlwZSIsIlRYX1FVRVJZIiwiZ2V0VHJhbnNmZXJzIiwiZ2V0VHJhbnNmZXJRdWVyeSIsInRyYW5zZmVycyIsInRyYW5zZmVyIiwiZ2V0T3V0cHV0cyIsImdldE91dHB1dFF1ZXJ5Iiwib3V0cHV0cyIsImV4cG9ydE91dHB1dHMiLCJhbGwiLCJpbXBvcnRPdXRwdXRzIiwib3V0cHV0c0hleCIsImdldEtleUltYWdlcyIsImtleUltYWdlc0pzb24iLCJrZXlJbWFnZSIsImV4cG9ydEtleUltYWdlcyIsImltcG9ydEtleUltYWdlcyIsImtleUltYWdlSnNvbiIsIk1vbmVyb0tleUltYWdlIiwiZnJlZXplT3V0cHV0IiwidGhhd091dHB1dCIsImlzT3V0cHV0RnJvemVuIiwiY3JlYXRlVHhzIiwiTW9uZXJvVHhDb25maWciLCJnZXRUeFNldCIsInN3ZWVwT3V0cHV0Iiwic3dlZXBVbmxvY2tlZCIsInR4U2V0cyIsIkdlblV0aWxzIiwiYXJyYXlDb250YWlucyIsInR4U2V0c0pzb24iLCJ0eFNldCIsInN3ZWVwRHVzdCIsInJlbGF5IiwicmVsYXlUeHMiLCJ0eE1ldGFkYXRhcyIsImRlc2NyaWJlVHhTZXQiLCJ0eFNldEpzb24iLCJNb25lcm9UeFNldCIsInNpZ25UeHMiLCJ1bnNpZ25lZFR4SGV4Iiwic3VibWl0VHhzIiwic2lnbmVkVHhIZXgiLCJzaWduTWVzc2FnZSIsInNpZ25hdHVyZVR5cGUiLCJ2ZXJpZnlNZXNzYWdlIiwic2lnbmF0dXJlIiwiZ2V0VHhLZXkiLCJ0eEhhc2giLCJjaGVja1R4S2V5IiwidHhLZXkiLCJnZXRUeFByb29mIiwiY2hlY2tUeFByb29mIiwiZ2V0U3BlbmRQcm9vZiIsImNoZWNrU3BlbmRQcm9vZiIsImdldFJlc2VydmVQcm9vZldhbGxldCIsImdldFJlc2VydmVQcm9vZkFjY291bnQiLCJhbW91bnRTdHIiLCJjaGVja1Jlc2VydmVQcm9vZiIsImdldFR4Tm90ZXMiLCJzZXRUeE5vdGVzIiwidHhOb3RlcyIsImdldEFkZHJlc3NCb29rRW50cmllcyIsImVudHJ5SW5kaWNlcyIsImFkZEFkZHJlc3NCb29rRW50cnkiLCJkZXNjcmlwdGlvbiIsImVkaXRBZGRyZXNzQm9va0VudHJ5IiwiaW5kZXgiLCJzZXRBZGRyZXNzIiwic2V0RGVzY3JpcHRpb24iLCJkZWxldGVBZGRyZXNzQm9va0VudHJ5IiwidGFnQWNjb3VudHMiLCJhY2NvdW50SW5kaWNlcyIsInVudGFnQWNjb3VudHMiLCJnZXRBY2NvdW50VGFncyIsInNldEFjY291bnRUYWdMYWJlbCIsImdldFBheW1lbnRVcmkiLCJwYXJzZVBheW1lbnRVcmkiLCJ1cmkiLCJnZXRBdHRyaWJ1dGUiLCJrZXkiLCJzZXRBdHRyaWJ1dGUiLCJ2YWx1ZSIsImJhY2tncm91bmRNaW5pbmciLCJpc011bHRpc2lnSW1wb3J0TmVlZGVkIiwiaXNNdWx0aXNpZyIsImdldE11bHRpc2lnSW5mbyIsInByZXBhcmVNdWx0aXNpZyIsIm1ha2VNdWx0aXNpZyIsIm11bHRpc2lnSGV4ZXMiLCJ0aHJlc2hvbGQiLCJleGNoYW5nZU11bHRpc2lnS2V5cyIsImV4cG9ydE11bHRpc2lnSGV4IiwiaW1wb3J0TXVsdGlzaWdIZXgiLCJzaWduTXVsdGlzaWdUeEhleCIsIm11bHRpc2lnVHhIZXgiLCJzdWJtaXRNdWx0aXNpZ1R4SGV4Iiwic2lnbmVkTXVsdGlzaWdUeEhleCIsImdldERhdGEiLCJjaGFuZ2VQYXNzd29yZCIsIm9sZFBhc3N3b3JkIiwibmV3UGFzc3dvcmQiLCJpc0Nsb3NlZCIsImNsb3NlIiwic2F2ZSJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL2NvbW1vbi9Nb25lcm9XZWJXb3JrZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XG5pbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4vR2VuVXRpbHNcIjtcbmltcG9ydCBIdHRwQ2xpZW50IGZyb20gXCIuL0h0dHBDbGllbnRcIjtcbmltcG9ydCBMaWJyYXJ5VXRpbHMgZnJvbSBcIi4vTGlicmFyeVV0aWxzXCI7XG5pbXBvcnQgTW9uZXJvQmFuIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvQmFuXCI7XG5pbXBvcnQgTW9uZXJvQmxvY2sgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9CbG9ja1wiO1xuaW1wb3J0IE1vbmVyb0RhZW1vbkNvbmZpZyBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0RhZW1vbkNvbmZpZ1wiO1xuaW1wb3J0IE1vbmVyb0RhZW1vbkxpc3RlbmVyIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvRGFlbW9uTGlzdGVuZXJcIjtcbmltcG9ydCBNb25lcm9EYWVtb25ScGMgZnJvbSBcIi4uL2RhZW1vbi9Nb25lcm9EYWVtb25ScGNcIjtcbmltcG9ydCBNb25lcm9FcnJvciBmcm9tIFwiLi9Nb25lcm9FcnJvclwiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvS2V5SW1hZ2VcIjtcbmltcG9ydCBNb25lcm9ScGNDb25uZWN0aW9uIGZyb20gXCIuL01vbmVyb1JwY0Nvbm5lY3Rpb25cIjtcbmltcG9ydCBNb25lcm9UeENvbmZpZyBmcm9tIFwiLi4vd2FsbGV0L21vZGVsL01vbmVyb1R4Q29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvVHhRdWVyeSBmcm9tIFwiLi4vd2FsbGV0L21vZGVsL01vbmVyb1R4UXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeFNldCBmcm9tIFwiLi4vd2FsbGV0L21vZGVsL01vbmVyb1R4U2V0XCI7XG5pbXBvcnQgTW9uZXJvVXRpbHMgZnJvbSBcIi4vTW9uZXJvVXRpbHNcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRDb25maWcgZnJvbSBcIi4uL3dhbGxldC9tb2RlbC9Nb25lcm9XYWxsZXRDb25maWdcIlxuaW1wb3J0IE1vbmVyb1dhbGxldExpc3RlbmVyIGZyb20gXCIuLi93YWxsZXQvbW9kZWwvTW9uZXJvV2FsbGV0TGlzdGVuZXJcIlxuaW1wb3J0IHtNb25lcm9XYWxsZXRLZXlzfSBmcm9tIFwiLi4vd2FsbGV0L01vbmVyb1dhbGxldEtleXNcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRGdWxsIGZyb20gXCIuLi93YWxsZXQvTW9uZXJvV2FsbGV0RnVsbFwiO1xuXG5kZWNsYXJlIGNvbnN0IHNlbGY6IGFueTtcblxuLyoqXG4gKiBXb3JrZXIgdG8gbWFuYWdlIGEgZGFlbW9uIGFuZCB3YXNtIHdhbGxldCBvZmYgdGhlIG1haW4gdGhyZWFkIHVzaW5nIG1lc3NhZ2VzLlxuICogXG4gKiBSZXF1aXJlZCBtZXNzYWdlIGZvcm1hdDogZS5kYXRhWzBdID0gb2JqZWN0IGlkLCBlLmRhdGFbMV0gPSBmdW5jdGlvbiBuYW1lLCBlLmRhdGFbMitdID0gZnVuY3Rpb24gYXJnc1xuICpcbiAqIEZvciBicm93c2VyIGFwcGxpY2F0aW9ucywgdGhpcyBmaWxlIG11c3QgYmUgYnJvd3NlcmlmaWVkIGFuZCBwbGFjZWQgaW4gdGhlIHdlYiBhcHAgcm9vdC5cbiAqIFxuICogQHByaXZhdGVcbiAqL1xuc2VsZi5vbm1lc3NhZ2UgPSBhc3luYyBmdW5jdGlvbihlKSB7XG4gIFxuICAvLyBpbml0aWFsaXplIG9uZSB0aW1lXG4gIGF3YWl0IHNlbGYuaW5pdE9uZVRpbWUoKTtcbiAgXG4gIC8vIHZhbGlkYXRlIHBhcmFtc1xuICBsZXQgb2JqZWN0SWQgPSBlLmRhdGFbMF07XG4gIGxldCBmbk5hbWUgPSBlLmRhdGFbMV07XG4gIGxldCBjYWxsYmFja0lkID0gZS5kYXRhWzJdO1xuICBhc3NlcnQoZm5OYW1lLCBcIk11c3QgcHJvdmlkZSBmdW5jdGlvbiBuYW1lIHRvIHdvcmtlclwiKTtcbiAgYXNzZXJ0KGNhbGxiYWNrSWQsIFwiTXVzdCBwcm92aWRlIGNhbGxiYWNrIGlkIHRvIHdvcmtlclwiKTtcbiAgaWYgKCFzZWxmW2ZuTmFtZV0pIHRocm93IG5ldyBFcnJvcihcIk1ldGhvZCAnXCIgKyBmbk5hbWUgKyBcIicgaXMgbm90IHJlZ2lzdGVyZWQgd2l0aCB3b3JrZXJcIik7XG4gIGUuZGF0YS5zcGxpY2UoMSwgMik7IC8vIHJlbW92ZSBmdW5jdGlvbiBuYW1lIGFuZCBjYWxsYmFjayBpZCB0byBhcHBseSBmdW5jdGlvbiB3aXRoIGFyZ3VtZW50c1xuICBcbiAgLy8gZXhlY3V0ZSB3b3JrZXIgZnVuY3Rpb24gYW5kIHBvc3QgcmVzdWx0IHRvIGNhbGxiYWNrXG4gIHRyeSB7XG4gICAgcG9zdE1lc3NhZ2UoW29iamVjdElkLCBjYWxsYmFja0lkLCB7cmVzdWx0OiBhd2FpdCBzZWxmW2ZuTmFtZV0uYXBwbHkobnVsbCwgZS5kYXRhKX1dKTtcbiAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgaWYgKCEoZSBpbnN0YW5jZW9mIEVycm9yKSkgZSA9IG5ldyBFcnJvcihlKTtcbiAgICBwb3N0TWVzc2FnZShbb2JqZWN0SWQsIGNhbGxiYWNrSWQsIHtlcnJvcjogTGlicmFyeVV0aWxzLnNlcmlhbGl6ZUVycm9yKGUpfV0pO1xuICB9XG59XG5cbnNlbGYuaW5pdE9uZVRpbWUgPSBhc3luYyBmdW5jdGlvbigpIHtcbiAgaWYgKCFzZWxmLmlzSW5pdGlhbGl6ZWQpIHtcbiAgICBzZWxmLldPUktFUl9PQkpFQ1RTID0ge307XG4gICAgc2VsZi5pc0luaXRpYWxpemVkID0gdHJ1ZTtcbiAgICBNb25lcm9VdGlscy5QUk9YWV9UT19XT1JLRVIgPSBmYWxzZTtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU1RBVElDIFVUSUxJVElFUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnNlbGYuaHR0cFJlcXVlc3QgPSBhc3luYyBmdW5jdGlvbihvYmplY3RJZCwgb3B0cykge1xuICB0cnkge1xuICAgIHJldHVybiBhd2FpdCBIdHRwQ2xpZW50LnJlcXVlc3QoT2JqZWN0LmFzc2lnbihvcHRzLCB7cHJveHlUb1dvcmtlcjogZmFsc2V9KSk7ICBcbiAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICB0aHJvdyBlcnIuc3RhdHVzQ29kZSA/IG5ldyBFcnJvcihKU09OLnN0cmluZ2lmeSh7c3RhdHVzQ29kZTogZXJyLnN0YXR1c0NvZGUsIHN0YXR1c01lc3NhZ2U6IGVyci5tZXNzYWdlfSkpIDogZXJyO1xuICB9XG59XG5cbnNlbGYuc2V0TG9nTGV2ZWwgPSBhc3luYyBmdW5jdGlvbihvYmplY3RJZCwgbGV2ZWwpIHtcbiAgcmV0dXJuIExpYnJhcnlVdGlscy5zZXRMb2dMZXZlbChsZXZlbCk7XG59XG5cbnNlbGYuZ2V0V2FzbU1lbW9yeVVzZWQgPSBhc3luYyBmdW5jdGlvbihvYmplY3RJZCkge1xuICByZXR1cm4gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKSAmJiBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpLkhFQVA4ID8gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKS5IRUFQOC5sZW5ndGggOiB1bmRlZmluZWQ7XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIE1PTkVSTyBVVElMUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuc2VsZi5tb25lcm9VdGlsc0dldEludGVncmF0ZWRBZGRyZXNzID0gYXN5bmMgZnVuY3Rpb24ob2JqZWN0SWQsIG5ldHdvcmtUeXBlLCBzdGFuZGFyZEFkZHJlc3MsIHBheW1lbnRJZCkge1xuICByZXR1cm4gKGF3YWl0IE1vbmVyb1V0aWxzLmdldEludGVncmF0ZWRBZGRyZXNzKG5ldHdvcmtUeXBlLCBzdGFuZGFyZEFkZHJlc3MsIHBheW1lbnRJZCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLm1vbmVyb1V0aWxzVmFsaWRhdGVBZGRyZXNzID0gYXN5bmMgZnVuY3Rpb24ob2JqZWN0SWQsIGFkZHJlc3MsIG5ldHdvcmtUeXBlKSB7XG4gIHJldHVybiBNb25lcm9VdGlscy52YWxpZGF0ZUFkZHJlc3MoYWRkcmVzcywgbmV0d29ya1R5cGUpO1xufVxuXG5zZWxmLm1vbmVyb1V0aWxzSnNvblRvQmluYXJ5ID0gYXN5bmMgZnVuY3Rpb24ob2JqZWN0SWQsIGpzb24pIHtcbiAgcmV0dXJuIE1vbmVyb1V0aWxzLmpzb25Ub0JpbmFyeShqc29uKTtcbn1cblxuc2VsZi5tb25lcm9VdGlsc0JpbmFyeVRvSnNvbiA9IGFzeW5jIGZ1bmN0aW9uKG9iamVjdElkLCB1aW50OGFycikge1xuICByZXR1cm4gTW9uZXJvVXRpbHMuYmluYXJ5VG9Kc29uKHVpbnQ4YXJyKTtcbn1cblxuc2VsZi5tb25lcm9VdGlsc0JpbmFyeUJsb2Nrc1RvSnNvbiA9IGFzeW5jIGZ1bmN0aW9uKG9iamVjdElkLCB1aW50OGFycikge1xuICByZXR1cm4gTW9uZXJvVXRpbHMuYmluYXJ5QmxvY2tzVG9Kc29uKHVpbnQ4YXJyKTtcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBEQUVNT04gTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5zZWxmLmRhZW1vbkFkZExpc3RlbmVyID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGxpc3RlbmVySWQpIHtcbiAgbGV0IGxpc3RlbmVyID0gbmV3IGNsYXNzIGV4dGVuZHMgTW9uZXJvRGFlbW9uTGlzdGVuZXIge1xuICAgIGFzeW5jIG9uQmxvY2tIZWFkZXIoYmxvY2tIZWFkZXIpIHtcbiAgICAgIHNlbGYucG9zdE1lc3NhZ2UoW2RhZW1vbklkLCBcIm9uQmxvY2tIZWFkZXJfXCIgKyBsaXN0ZW5lcklkLCBibG9ja0hlYWRlci50b0pzb24oKV0pO1xuICAgIH1cbiAgfVxuICBpZiAoIXNlbGYuZGFlbW9uTGlzdGVuZXJzKSBzZWxmLmRhZW1vbkxpc3RlbmVycyA9IHt9O1xuICBzZWxmLmRhZW1vbkxpc3RlbmVyc1tsaXN0ZW5lcklkXSA9IGxpc3RlbmVyO1xuICBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG59XG5cbnNlbGYuZGFlbW9uUmVtb3ZlTGlzdGVuZXIgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgbGlzdGVuZXJJZCkge1xuICBpZiAoIXNlbGYuZGFlbW9uTGlzdGVuZXJzW2xpc3RlbmVySWRdKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJObyBkYWVtb24gd29ya2VyIGxpc3RlbmVyIHJlZ2lzdGVyZWQgd2l0aCBpZDogXCIgKyBsaXN0ZW5lcklkKTtcbiAgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0ucmVtb3ZlTGlzdGVuZXIoc2VsZi5kYWVtb25MaXN0ZW5lcnNbbGlzdGVuZXJJZF0pO1xuICBkZWxldGUgc2VsZi5kYWVtb25MaXN0ZW5lcnNbbGlzdGVuZXJJZF07XG59XG5cbnNlbGYuY29ubmVjdERhZW1vblJwYyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBjb25maWcpIHtcbiAgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0gPSBhd2FpdCBNb25lcm9EYWVtb25ScGMuY29ubmVjdFRvRGFlbW9uUnBjKG5ldyBNb25lcm9EYWVtb25Db25maWcoY29uZmlnKSk7XG59XG5cbnNlbGYuZGFlbW9uR2V0UnBjQ29ubmVjdGlvbiA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIGxldCBjb25uZWN0aW9uID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0UnBjQ29ubmVjdGlvbigpO1xuICByZXR1cm4gY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0Q29uZmlnKCkgOiB1bmRlZmluZWQ7XG59XG5cbnNlbGYuZGFlbW9uSXNDb25uZWN0ZWQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uaXNDb25uZWN0ZWQoKTtcbn1cblxuc2VsZi5kYWVtb25HZXRWZXJzaW9uID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRWZXJzaW9uKCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbklzVHJ1c3RlZCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5pc1RydXN0ZWQoKTtcbn1cblxuc2VsZi5kYWVtb25HZXRIZWlnaHQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0SGVpZ2h0KCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tIYXNoID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGhlaWdodCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tIYXNoKGhlaWdodCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tUZW1wbGF0ZSA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCB3YWxsZXRBZGRyZXNzLCByZXNlcnZlU2l6ZSkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2NrVGVtcGxhdGUod2FsbGV0QWRkcmVzcywgcmVzZXJ2ZVNpemUpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRMYXN0QmxvY2tIZWFkZXIgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldExhc3RCbG9ja0hlYWRlcigpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja0hlYWRlckJ5SGFzaCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBoYXNoKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tIZWFkZXJCeUhhc2goaGFzaCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2NrSGVhZGVyQnlIZWlnaHQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgaGVpZ2h0KSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tIZWFkZXJCeUhlaWdodChoZWlnaHQpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja0hlYWRlcnNCeVJhbmdlID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQpIHtcbiAgbGV0IGJsb2NrSGVhZGVyc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgYmxvY2tIZWFkZXIgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tIZWFkZXJzQnlSYW5nZShzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSkgYmxvY2tIZWFkZXJzSnNvbi5wdXNoKGJsb2NrSGVhZGVyLnRvSnNvbigpKTtcbiAgcmV0dXJuIGJsb2NrSGVhZGVyc0pzb247XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tCeUhhc2ggPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgYmxvY2tIYXNoKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tCeUhhc2goYmxvY2tIYXNoKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tzQnlIYXNoID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGJsb2NrSGFzaGVzLCBzdGFydEhlaWdodCwgcHJ1bmUpIHtcbiAgbGV0IGJsb2Nrc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgYmxvY2sgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QmxvY2tzQnlIYXNoKGJsb2NrSGFzaGVzLCBzdGFydEhlaWdodCwgcHJ1bmUpKSBibG9ja3NKc29uLnB1c2goYmxvY2sudG9Kc29uKCkpO1xuICByZXR1cm4gYmxvY2tzSnNvbjtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja0J5SGVpZ2h0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGhlaWdodCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2NrQnlIZWlnaHQoaGVpZ2h0KSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tzQnlIZWlnaHQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgaGVpZ2h0cykge1xuICBsZXQgYmxvY2tzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBibG9jayBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja3NCeUhlaWdodChoZWlnaHRzKSkgYmxvY2tzSnNvbi5wdXNoKGJsb2NrLnRvSnNvbigpKTtcbiAgcmV0dXJuIGJsb2Nrc0pzb247XG59XG5cbnNlbGYuZGFlbW9uR2V0QmxvY2tzQnlSYW5nZSA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSB7XG4gIGxldCBibG9ja3NKc29uID0gW107XG4gIGZvciAobGV0IGJsb2NrIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEJsb2Nrc0J5UmFuZ2Uoc3RhcnRIZWlnaHQsIGVuZEhlaWdodCkpIGJsb2Nrc0pzb24ucHVzaChibG9jay50b0pzb24oKSk7XG4gIHJldHVybiBibG9ja3NKc29uO1xufVxuXG5zZWxmLmRhZW1vbkdldEJsb2Nrc0J5UmFuZ2VDaHVua2VkID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIG1heENodW5rU2l6ZSkge1xuICBsZXQgYmxvY2tzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBibG9jayBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRCbG9ja3NCeVJhbmdlQ2h1bmtlZChzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBtYXhDaHVua1NpemUpKSBibG9ja3NKc29uLnB1c2goYmxvY2sudG9Kc29uKCkpO1xuICByZXR1cm4gYmxvY2tzSnNvbjtcbn1cblxuc2VsZi5kYWVtb25HZXRCbG9ja0hhc2hlcyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBibG9ja0hhc2hlcywgc3RhcnRIZWlnaHQpIHtcbiAgdGhyb3cgbmV3IEVycm9yKFwid29ya2VyLmdldEJsb2NrSGFzaGVzIG5vdCBpbXBsZW1lbnRlZFwiKTtcbn1cblxuLy8gVE9ETzogZmFjdG9yIGNvbW1vbiBjb2RlIHdpdGggc2VsZi5nZXRUeHMoKVxuc2VsZi5kYWVtb25HZXRUeHMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgdHhIYXNoZXMsIHBydW5lKSB7XG4gIFxuICAvLyBnZXQgdHhzXG4gIGxldCB0eHMgPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRUeHModHhIYXNoZXMsIHBydW5lKTtcbiAgXG4gIC8vIGNvbGxlY3QgdW5pcXVlIGJsb2NrcyB0byBwcmVzZXJ2ZSBtb2RlbCByZWxhdGlvbnNoaXBzIGFzIHRyZWVzIChiYXNlZCBvbiBtb25lcm9fd2FzbV9icmlkZ2UuY3BwOjpnZXRfdHhzKVxuICBsZXQgYmxvY2tzID0gW107XG4gIGxldCB1bmNvbmZpcm1lZEJsb2NrID0gdW5kZWZpbmVkXG4gIGxldCBzZWVuQmxvY2tzID0gbmV3IFNldCgpO1xuICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICBpZiAoIXR4LmdldEJsb2NrKCkpIHtcbiAgICAgIGlmICghdW5jb25maXJtZWRCbG9jaykgdW5jb25maXJtZWRCbG9jayA9IG5ldyBNb25lcm9CbG9jaygpLnNldFR4cyhbXSk7XG4gICAgICB0eC5zZXRCbG9jayh1bmNvbmZpcm1lZEJsb2NrKTtcbiAgICAgIHVuY29uZmlybWVkQmxvY2suZ2V0VHhzKCkucHVzaCh0eCk7XG4gICAgfVxuICAgIGlmICghc2VlbkJsb2Nrcy5oYXModHguZ2V0QmxvY2soKSkpIHtcbiAgICAgIHNlZW5CbG9ja3MuYWRkKHR4LmdldEJsb2NrKCkpO1xuICAgICAgYmxvY2tzLnB1c2godHguZ2V0QmxvY2soKSk7XG4gICAgfVxuICB9XG4gIFxuICAvLyBzZXJpYWxpemUgYmxvY2tzIHRvIGpzb25cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBibG9ja3MubGVuZ3RoOyBpKyspIGJsb2Nrc1tpXSA9IGJsb2Nrc1tpXS50b0pzb24oKTtcbiAgcmV0dXJuIGJsb2Nrcztcbn1cblxuc2VsZi5kYWVtb25HZXRUeEhleGVzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIHR4SGFzaGVzLCBwcnVuZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0VHhIZXhlcyh0eEhhc2hlcywgcHJ1bmUpO1xufVxuXG5zZWxmLmRhZW1vbkdldE1pbmVyVHhTdW0gPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgaGVpZ2h0LCBudW1CbG9ja3MpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRNaW5lclR4U3VtKGhlaWdodCwgbnVtQmxvY2tzKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0RmVlRXN0aW1hdGUgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgZ3JhY2VCbG9ja3MpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRGZWVFc3RpbWF0ZShncmFjZUJsb2NrcykpLnRvSnNvbigpO1xufVxuXG5zZWxmLmRhZW1vblN1Ym1pdFR4SGV4ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIHR4SGV4LCBkb05vdFJlbGF5KSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc3VibWl0VHhIZXgodHhIZXgsIGRvTm90UmVsYXkpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25SZWxheVR4c0J5SGFzaCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCB0eEhhc2hlcykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0ucmVsYXlUeHNCeUhhc2godHhIYXNoZXMpO1xufVxuXG5zZWxmLmRhZW1vbkdldFR4UG9vbCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIGxldCB0eHMgPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRUeFBvb2woKTtcbiAgbGV0IGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0VHhzKHR4cyk7XG4gIGZvciAobGV0IHR4IG9mIHR4cykgdHguc2V0QmxvY2soYmxvY2spXG4gIHJldHVybiBibG9jay50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRUeFBvb2xIYXNoZXMgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0VHhQb29sSGFzaGVzKCk7XG59XG5cbi8vYXN5bmMgZ2V0VHhQb29sQmFja2xvZygpIHtcbi8vICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4vL31cblxuc2VsZi5kYWVtb25HZXRUeFBvb2xTdGF0cyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0VHhQb29sU3RhdHMoKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uRmx1c2hUeFBvb2wgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgaGFzaGVzKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5mbHVzaFR4UG9vbChoYXNoZXMpO1xufVxuXG5zZWxmLmRhZW1vbkdldEtleUltYWdlU3BlbnRTdGF0dXNlcyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBrZXlJbWFnZXMpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEtleUltYWdlU3BlbnRTdGF0dXNlcyhrZXlJbWFnZXMpO1xufVxuXG4vL1xuLy9hc3luYyBnZXRPdXRwdXRzKG91dHB1dHMpIHtcbi8vICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4vL31cblxuc2VsZi5kYWVtb25HZXRPdXRwdXRIaXN0b2dyYW0gPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgYW1vdW50cywgbWluQ291bnQsIG1heENvdW50LCBpc1VubG9ja2VkLCByZWNlbnRDdXRvZmYpIHtcbiAgbGV0IGVudHJpZXNKc29uID0gW107XG4gIGZvciAobGV0IGVudHJ5IG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldE91dHB1dEhpc3RvZ3JhbShhbW91bnRzLCBtaW5Db3VudCwgbWF4Q291bnQsIGlzVW5sb2NrZWQsIHJlY2VudEN1dG9mZikpIHtcbiAgICBlbnRyaWVzSnNvbi5wdXNoKGVudHJ5LnRvSnNvbigpKTtcbiAgfVxuICByZXR1cm4gZW50cmllc0pzb247XG59XG5cbi8vXG4vL2FzeW5jIGdldE91dHB1dERpc3RyaWJ1dGlvbihhbW91bnRzLCBjdW11bGF0aXZlLCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0KSB7XG4vLyAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuLy99XG5cbnNlbGYuZGFlbW9uR2V0SW5mbyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0SW5mbygpKS50b0pzb24oKTtcbn1cblxuc2VsZi5kYWVtb25HZXRTeW5jSW5mbyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0U3luY0luZm8oKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0SGFyZEZvcmtJbmZvID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRIYXJkRm9ya0luZm8oKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0QWx0Q2hhaW5zID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgbGV0IGFsdENoYWluc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgYWx0Q2hhaW4gb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uZ2V0QWx0Q2hhaW5zKCkpIGFsdENoYWluc0pzb24ucHVzaChhbHRDaGFpbi50b0pzb24oKSk7XG4gIHJldHVybiBhbHRDaGFpbnNKc29uO1xufVxuXG5zZWxmLmRhZW1vbkdldEFsdEJsb2NrSGFzaGVzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEFsdEJsb2NrSGFzaGVzKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0RG93bmxvYWRMaW1pdCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXREb3dubG9hZExpbWl0KCk7XG59XG5cbnNlbGYuZGFlbW9uU2V0RG93bmxvYWRMaW1pdCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBsaW1pdCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc2V0RG93bmxvYWRMaW1pdChsaW1pdCk7XG59XG5cbnNlbGYuZGFlbW9uUmVzZXREb3dubG9hZExpbWl0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnJlc2V0RG93bmxvYWRMaW1pdCgpO1xufVxuXG5zZWxmLmRhZW1vbkdldFVwbG9hZExpbWl0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldFVwbG9hZExpbWl0KCk7XG59XG5cbnNlbGYuZGFlbW9uU2V0VXBsb2FkTGltaXQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgbGltaXQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnNldFVwbG9hZExpbWl0KGxpbWl0KTtcbn1cblxuc2VsZi5kYWVtb25SZXNldFVwbG9hZExpbWl0ID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnJlc2V0VXBsb2FkTGltaXQoKTtcbn1cblxuc2VsZi5kYWVtb25HZXRQZWVycyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIGxldCBwZWVyc0pzb24gPSBbXTtcbiAgZm9yIChsZXQgcGVlciBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRQZWVycygpKSBwZWVyc0pzb24ucHVzaChwZWVyLnRvSnNvbigpKTtcbiAgcmV0dXJuIHBlZXJzSnNvbjtcbn1cblxuc2VsZi5kYWVtb25HZXRLbm93blBlZXJzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgbGV0IHBlZXJzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBwZWVyIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLmdldEtub3duUGVlcnMoKSkgcGVlcnNKc29uLnB1c2gocGVlci50b0pzb24oKSk7XG4gIHJldHVybiBwZWVyc0pzb247XG59XG5cbnNlbGYuZGFlbW9uU2V0T3V0Z29pbmdQZWVyTGltaXQgPSBhc3luYyBmdW5jdGlvbihkYWVtb25JZCwgbGltaXQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnNldE91dGdvaW5nUGVlckxpbWl0KGxpbWl0KTtcbn1cblxuc2VsZi5kYWVtb25TZXRJbmNvbWluZ1BlZXJMaW1pdCA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBsaW1pdCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0uc2V0SW5jb21pbmdQZWVyTGltaXQobGltaXQpO1xufVxuXG5zZWxmLmRhZW1vbkdldFBlZXJCYW5zID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgbGV0IGJhbnNKc29uID0gW107XG4gIGZvciAobGV0IGJhbiBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRQZWVyQmFucygpKSBiYW5zSnNvbi5wdXNoKGJhbi50b0pzb24oKSk7XG4gIHJldHVybiBiYW5zSnNvbjtcbn1cblxuc2VsZi5kYWVtb25TZXRQZWVyQmFucyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBiYW5zSnNvbikge1xuICBsZXQgYmFucyA9IFtdO1xuICBmb3IgKGxldCBiYW5Kc29uIG9mIGJhbnNKc29uKSBiYW5zLnB1c2gobmV3IE1vbmVyb0JhbihiYW5Kc29uKSk7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5zZXRQZWVyQmFucyhiYW5zKTtcbn1cblxuc2VsZi5kYWVtb25TdGFydE1pbmluZyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkLCBhZGRyZXNzLCBudW1UaHJlYWRzLCBpc0JhY2tncm91bmQsIGlnbm9yZUJhdHRlcnkpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnN0YXJ0TWluaW5nKGFkZHJlc3MsIG51bVRocmVhZHMsIGlzQmFja2dyb3VuZCwgaWdub3JlQmF0dGVyeSk7XG59XG5cbnNlbGYuZGFlbW9uU3RvcE1pbmluZyA9IGFzeW5jIGZ1bmN0aW9uKGRhZW1vbklkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5zdG9wTWluaW5nKCk7XG59XG5cbnNlbGYuZGFlbW9uR2V0TWluaW5nU3RhdHVzID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS5nZXRNaW5pbmdTdGF0dXMoKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGFlbW9uUHJ1bmVCbG9ja2NoYWluID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQsIGNoZWNrKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1tkYWVtb25JZF0ucHJ1bmVCbG9ja2NoYWluKGNoZWNrKSkudG9Kc29uKCk7XG59XG5cbi8vXG4vL2FzeW5jIHN1Ym1pdEJsb2NrcyhibG9ja0Jsb2JzKSB7XG4vLyAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuLy99XG4vL1xuLy9hc3luYyBjaGVja0ZvclVwZGF0ZSgpIHtcbi8vICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4vL31cbi8vXG4vL2FzeW5jIGRvd25sb2FkVXBkYXRlKHBhdGgpIHtcbi8vICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4vL31cblxuc2VsZi5kYWVtb25TdG9wID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbZGFlbW9uSWRdLnN0b3AoKTtcbn1cblxuc2VsZi5kYWVtb25XYWl0Rm9yTmV4dEJsb2NrSGVhZGVyID0gYXN5bmMgZnVuY3Rpb24oZGFlbW9uSWQpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW2RhZW1vbklkXS53YWl0Rm9yTmV4dEJsb2NrSGVhZGVyKCkpLnRvSnNvbigpO1xufVxuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBXQUxMRVQgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnNlbGYub3BlbldhbGxldERhdGEgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgcGF0aCwgcGFzc3dvcmQsIG5ldHdvcmtUeXBlLCBrZXlzRGF0YSwgY2FjaGVEYXRhLCBkYWVtb25VcmlPckNvbmZpZykge1xuICBsZXQgZGFlbW9uQ29ubmVjdGlvbiA9IGRhZW1vblVyaU9yQ29uZmlnID8gbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24oZGFlbW9uVXJpT3JDb25maWcpIDogdW5kZWZpbmVkO1xuICBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXSA9IGF3YWl0IE1vbmVyb1dhbGxldEZ1bGwub3BlbldhbGxldCh7cGF0aDogXCJcIiwgcGFzc3dvcmQ6IHBhc3N3b3JkLCBuZXR3b3JrVHlwZTogbmV0d29ya1R5cGUsIGtleXNEYXRhOiBrZXlzRGF0YSwgY2FjaGVEYXRhOiBjYWNoZURhdGEsIHNlcnZlcjogZGFlbW9uQ29ubmVjdGlvbiwgcHJveHlUb1dvcmtlcjogZmFsc2V9KTtcbiAgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2V0QnJvd3Nlck1haW5QYXRoKHBhdGgpO1xufVxuXG5zZWxmLmNyZWF0ZVdhbGxldEtleXMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgY29uZmlnSnNvbikge1xuICBsZXQgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyhjb25maWdKc29uKTtcbiAgY29uZmlnLnNldFByb3h5VG9Xb3JrZXIoZmFsc2UpO1xuICBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXSA9IGF3YWl0IE1vbmVyb1dhbGxldEtleXMuY3JlYXRlV2FsbGV0KGNvbmZpZyk7XG59XG5cbnNlbGYuY3JlYXRlV2FsbGV0RnVsbCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBjb25maWdKc29uKSB7XG4gIGxldCBjb25maWcgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKGNvbmZpZ0pzb24pO1xuICBsZXQgcGF0aCA9IGNvbmZpZy5nZXRQYXRoKCk7XG4gIGNvbmZpZy5zZXRQYXRoKFwiXCIpO1xuICBjb25maWcuc2V0UHJveHlUb1dvcmtlcihmYWxzZSk7XG4gIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdID0gYXdhaXQgTW9uZXJvV2FsbGV0RnVsbC5jcmVhdGVXYWxsZXQoY29uZmlnKTtcbiAgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2V0QnJvd3Nlck1haW5QYXRoKHBhdGgpO1xufVxuXG5zZWxmLmlzVmlld09ubHkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaXNWaWV3T25seSgpO1xufVxuXG5zZWxmLmdldE5ldHdvcmtUeXBlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldE5ldHdvcmtUeXBlKCk7XG59XG5cbi8vXG4vL2FzeW5jIGdldFZlcnNpb24oKSB7XG4vLyAgdGhyb3cgbmV3IEVycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuLy99XG5cbnNlbGYuZ2V0U2VlZCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRTZWVkKCk7XG59XG5cbnNlbGYuZ2V0U2VlZExhbmd1YWdlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFNlZWRMYW5ndWFnZSgpO1xufVxuXG5zZWxmLmdldFNlZWRMYW5ndWFnZXMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0U2VlZExhbmd1YWdlcygpO1xufVxuXG5zZWxmLmdldFByaXZhdGVTcGVuZEtleSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRQcml2YXRlU3BlbmRLZXkoKTtcbn1cblxuc2VsZi5nZXRQcml2YXRlVmlld0tleSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRQcml2YXRlVmlld0tleSgpO1xufVxuXG5zZWxmLmdldFB1YmxpY1ZpZXdLZXkgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0UHVibGljVmlld0tleSgpO1xufVxuXG5zZWxmLmdldFB1YmxpY1NwZW5kS2V5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFB1YmxpY1NwZW5kS2V5KCk7XG59XG5cbnNlbGYuZ2V0QWRkcmVzcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRBZGRyZXNzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpO1xufVxuXG5zZWxmLmdldEFkZHJlc3NJbmRleCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhZGRyZXNzKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0QWRkcmVzc0luZGV4KGFkZHJlc3MpKS50b0pzb24oKTtcbn1cblxuc2VsZi5zZXRTdWJhZGRyZXNzTGFiZWwgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCwgbGFiZWwpIHtcbiAgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2V0U3ViYWRkcmVzc0xhYmVsKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIGxhYmVsKTtcbn1cblxuc2VsZi5nZXRJbnRlZ3JhdGVkQWRkcmVzcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBzdGFuZGFyZEFkZHJlc3MsIHBheW1lbnRJZCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldEludGVncmF0ZWRBZGRyZXNzKHN0YW5kYXJkQWRkcmVzcywgcGF5bWVudElkKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgaW50ZWdyYXRlZEFkZHJlc3MpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5kZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyhpbnRlZ3JhdGVkQWRkcmVzcykpLnRvSnNvbigpO1xufVxuXG5zZWxmLnNldERhZW1vbkNvbm5lY3Rpb24gPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgY29uZmlnKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zZXREYWVtb25Db25uZWN0aW9uKGNvbmZpZyA/IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKE9iamVjdC5hc3NpZ24oY29uZmlnLCB7cHJveHlUb1dvcmtlcjogZmFsc2V9KSkgOiB1bmRlZmluZWQpO1xufVxuXG5zZWxmLmdldERhZW1vbkNvbm5lY3Rpb24gPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICBsZXQgY29ubmVjdGlvbiA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldERhZW1vbkNvbm5lY3Rpb24oKTtcbiAgcmV0dXJuIGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldENvbmZpZygpIDogdW5kZWZpbmVkO1xufVxuXG5zZWxmLmlzQ29ubmVjdGVkVG9EYWVtb24gPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaXNDb25uZWN0ZWRUb0RhZW1vbigpO1xufVxuXG5zZWxmLmdldFJlc3RvcmVIZWlnaHQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0UmVzdG9yZUhlaWdodCgpO1xufVxuXG5zZWxmLnNldFJlc3RvcmVIZWlnaHQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgcmVzdG9yZUhlaWdodCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2V0UmVzdG9yZUhlaWdodChyZXN0b3JlSGVpZ2h0KTtcbn1cblxuc2VsZi5nZXREYWVtb25IZWlnaHQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0RGFlbW9uSGVpZ2h0KCk7XG59XG5cbnNlbGYuZ2V0RGFlbW9uTWF4UGVlckhlaWdodCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXREYWVtb25NYXhQZWVySGVpZ2h0KClcbn1cblxuc2VsZi5nZXRIZWlnaHRCeURhdGUgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgeWVhciwgbW9udGgsIGRheSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0SGVpZ2h0QnlEYXRlKHllYXIsIG1vbnRoLCBkYXkpO1xufVxuXG5zZWxmLmlzRGFlbW9uU3luY2VkID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmlzRGFlbW9uU3luY2VkKCk7XG59XG5cbnNlbGYuZ2V0SGVpZ2h0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldEhlaWdodCgpO1xufVxuXG5zZWxmLmFkZExpc3RlbmVyID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGxpc3RlbmVySWQpIHtcbiAgXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBsaXN0ZW5lciB0byBicmlkZ2Ugbm90aWZpY2F0aW9ucyB0byBleHRlcm5hbCBsaXN0ZW5lcnMuXG4gICAqIFxuICAgKiBUT0RPOiBNb25lcm9XYWxsZXRMaXN0ZW5lciBpcyBub3QgZGVmaW5lZCB1bnRpbCBzY3JpcHRzIGltcG9ydGVkXG4gICAqIFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgY2xhc3MgV2FsbGV0V29ya2VySGVscGVyTGlzdGVuZXIgZXh0ZW5kcyBNb25lcm9XYWxsZXRMaXN0ZW5lciB7XG5cbiAgICBwcm90ZWN0ZWQgd2FsbGV0SWQ6IHN0cmluZztcbiAgICBwcm90ZWN0ZWQgaWQ6IHN0cmluZztcbiAgICBwcm90ZWN0ZWQgd29ya2VyOiBXb3JrZXI7XG4gICAgXG4gICAgY29uc3RydWN0b3Iod2FsbGV0SWQsIGlkLCB3b3JrZXIpIHtcbiAgICAgIHN1cGVyKCk7XG4gICAgICB0aGlzLndhbGxldElkID0gd2FsbGV0SWQ7XG4gICAgICB0aGlzLmlkID0gaWQ7XG4gICAgICB0aGlzLndvcmtlciA9IHdvcmtlcjtcbiAgICB9XG4gICAgXG4gICAgZ2V0SWQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5pZDtcbiAgICB9XG4gICAgXG4gICAgYXN5bmMgb25TeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSkge1xuICAgICAgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2UoW3RoaXMud2FsbGV0SWQsIFwib25TeW5jUHJvZ3Jlc3NfXCIgKyB0aGlzLmdldElkKCksIGhlaWdodCwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgcGVyY2VudERvbmUsIG1lc3NhZ2VdKTtcbiAgICB9XG5cbiAgICBhc3luYyBvbk5ld0Jsb2NrKGhlaWdodCkgeyBcbiAgICAgIHRoaXMud29ya2VyLnBvc3RNZXNzYWdlKFt0aGlzLndhbGxldElkLCBcIm9uTmV3QmxvY2tfXCIgKyB0aGlzLmdldElkKCksIGhlaWdodF0pO1xuICAgIH1cbiAgICBcbiAgICBhc3luYyBvbkJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlLCBuZXdVbmxvY2tlZEJhbGFuY2UpIHtcbiAgICAgIHRoaXMud29ya2VyLnBvc3RNZXNzYWdlKFt0aGlzLndhbGxldElkLCBcIm9uQmFsYW5jZXNDaGFuZ2VkX1wiICsgdGhpcy5nZXRJZCgpLCBuZXdCYWxhbmNlLnRvU3RyaW5nKCksIG5ld1VubG9ja2VkQmFsYW5jZS50b1N0cmluZygpXSk7XG4gICAgfVxuXG4gICBhc3luYyBvbk91dHB1dFJlY2VpdmVkKG91dHB1dCkge1xuICAgICAgbGV0IGJsb2NrID0gb3V0cHV0LmdldFR4KCkuZ2V0QmxvY2soKTtcbiAgICAgIGlmIChibG9jayA9PT0gdW5kZWZpbmVkKSBibG9jayA9IG5ldyBNb25lcm9CbG9jaygpLnNldFR4cyhbb3V0cHV0LmdldFR4KCldKTtcbiAgICAgIHRoaXMud29ya2VyLnBvc3RNZXNzYWdlKFt0aGlzLndhbGxldElkLCBcIm9uT3V0cHV0UmVjZWl2ZWRfXCIgKyB0aGlzLmdldElkKCksIGJsb2NrLnRvSnNvbigpXSk7ICAvLyBzZXJpYWxpemUgZnJvbSByb290IGJsb2NrXG4gICAgfVxuICAgIFxuICAgIGFzeW5jIG9uT3V0cHV0U3BlbnQob3V0cHV0KSB7XG4gICAgICBsZXQgYmxvY2sgPSBvdXRwdXQuZ2V0VHgoKS5nZXRCbG9jaygpO1xuICAgICAgaWYgKGJsb2NrID09PSB1bmRlZmluZWQpIGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0VHhzKFtvdXRwdXQuZ2V0VHgoKV0pO1xuICAgICAgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2UoW3RoaXMud2FsbGV0SWQsIFwib25PdXRwdXRTcGVudF9cIiArIHRoaXMuZ2V0SWQoKSwgYmxvY2sudG9Kc29uKCldKTsgICAgIC8vIHNlcmlhbGl6ZSBmcm9tIHJvb3QgYmxvY2tcbiAgICB9XG4gIH1cbiAgXG4gIGxldCBsaXN0ZW5lciA9IG5ldyBXYWxsZXRXb3JrZXJIZWxwZXJMaXN0ZW5lcih3YWxsZXRJZCwgbGlzdGVuZXJJZCwgc2VsZik7XG4gIGlmICghc2VsZi5saXN0ZW5lcnMpIHNlbGYubGlzdGVuZXJzID0gW107XG4gIHNlbGYubGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuICBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG59XG5cbnNlbGYucmVtb3ZlTGlzdGVuZXIgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbGlzdGVuZXJJZCkge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHNlbGYubGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHNlbGYubGlzdGVuZXJzW2ldLmdldElkKCkgIT09IGxpc3RlbmVySWQpIGNvbnRpbnVlO1xuICAgIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnJlbW92ZUxpc3RlbmVyKHNlbGYubGlzdGVuZXJzW2ldKTtcbiAgICBzZWxmLmxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkxpc3RlbmVyIGlzIG5vdCByZWdpc3RlcmVkIHdpdGggd2FsbGV0XCIpO1xufVxuXG5zZWxmLmlzU3luY2VkID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmlzU3luY2VkKCk7XG59XG5cbnNlbGYuc3luYyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBzdGFydEhlaWdodCwgYWxsb3dDb25jdXJyZW50Q2FsbHMpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zeW5jKHVuZGVmaW5lZCwgc3RhcnRIZWlnaHQsIGFsbG93Q29uY3VycmVudENhbGxzKSk7XG59XG5cbnNlbGYuc3RhcnRTeW5jaW5nID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHN5bmNQZXJpb2RJbk1zKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zdGFydFN5bmNpbmcoc3luY1BlcmlvZEluTXMpO1xufVxuXG5zZWxmLnN0b3BTeW5jaW5nID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN0b3BTeW5jaW5nKCk7XG59XG5cbnNlbGYuc2NhblR4cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eEhhc2hlcykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2NhblR4cyh0eEhhc2hlcyk7XG59XG5cbnNlbGYucmVzY2FuU3BlbnQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0ucmVzY2FuU3BlbnQoKTtcbn1cblxuc2VsZi5yZXNjYW5CbG9ja2NoYWluID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnJlc2NhbkJsb2NrY2hhaW4oKTtcbn1cblxuc2VsZi5nZXRCYWxhbmNlID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRCYWxhbmNlKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpKS50b1N0cmluZygpO1xufVxuXG5zZWxmLmdldFVubG9ja2VkQmFsYW5jZSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0VW5sb2NrZWRCYWxhbmNlKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpKS50b1N0cmluZygpO1xufVxuXG5zZWxmLmdldEFjY291bnRzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGluY2x1ZGVTdWJhZGRyZXNzZXMsIHRhZykge1xuICBsZXQgYWNjb3VudEpzb25zID0gW107XG4gIGZvciAobGV0IGFjY291bnQgb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0QWNjb3VudHMoaW5jbHVkZVN1YmFkZHJlc3NlcywgdGFnKSkgYWNjb3VudEpzb25zLnB1c2goYWNjb3VudC50b0pzb24oKSk7XG4gIHJldHVybiBhY2NvdW50SnNvbnM7XG59XG5cbnNlbGYuZ2V0QWNjb3VudCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SWR4LCBpbmNsdWRlU3ViYWRkcmVzc2VzKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0QWNjb3VudChhY2NvdW50SWR4LCBpbmNsdWRlU3ViYWRkcmVzc2VzKSkudG9Kc29uKCk7XG59XG5cbnNlbGYuY3JlYXRlQWNjb3VudCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBsYWJlbCkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmNyZWF0ZUFjY291bnQobGFiZWwpKS50b0pzb24oKTtcbn1cblxuc2VsZi5nZXRTdWJhZGRyZXNzZXMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0luZGljZXMpIHtcbiAgbGV0IHN1YmFkZHJlc3NKc29ucyA9IFtdO1xuICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSW5kaWNlcykpIHN1YmFkZHJlc3NKc29ucy5wdXNoKHN1YmFkZHJlc3MudG9Kc29uKCkpO1xuICByZXR1cm4gc3ViYWRkcmVzc0pzb25zO1xufVxuXG5zZWxmLmNyZWF0ZVN1YmFkZHJlc3MgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWNjb3VudElkeCwgbGFiZWwpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jcmVhdGVTdWJhZGRyZXNzKGFjY291bnRJZHgsIGxhYmVsKSkudG9Kc29uKCk7XG59XG5cbi8vIFRPRE86IGVhc2llciBvciBtb3JlIGVmZmljaWVudCB3YXkgdGhhbiBzZXJpYWxpemluZyBmcm9tIHJvb3QgYmxvY2tzP1xuc2VsZi5nZXRUeHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYmxvY2tKc29uUXVlcnkpIHtcbiAgXG4gIC8vIGRlc2VyaWFsaXplIHF1ZXJ5IHdoaWNoIGlzIGpzb24gc3RyaW5nIHJvb3RlZCBhdCBibG9ja1xuICBsZXQgcXVlcnkgPSBuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uUXVlcnksIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFhfUVVFUlkpLmdldFR4cygpWzBdO1xuICBcbiAgLy8gZ2V0IHR4c1xuICBsZXQgdHhzID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0VHhzKHF1ZXJ5KTtcbiAgXG4gIC8vIGNvbGxlY3QgdW5pcXVlIGJsb2NrcyB0byBwcmVzZXJ2ZSBtb2RlbCByZWxhdGlvbnNoaXBzIGFzIHRyZWVzIChiYXNlZCBvbiBtb25lcm9fd2FzbV9icmlkZ2UuY3BwOjpnZXRfdHhzKVxuICBsZXQgc2VlbkJsb2NrcyA9IG5ldyBTZXQoKTtcbiAgbGV0IHVuY29uZmlybWVkQmxvY2sgPSB1bmRlZmluZWQ7XG4gIGxldCBibG9ja3MgPSBbXTtcbiAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgaWYgKCF0eC5nZXRCbG9jaygpKSB7XG4gICAgICBpZiAoIXVuY29uZmlybWVkQmxvY2spIHVuY29uZmlybWVkQmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soKS5zZXRUeHMoW10pO1xuICAgICAgdHguc2V0QmxvY2sodW5jb25maXJtZWRCbG9jayk7XG4gICAgICB1bmNvbmZpcm1lZEJsb2NrLmdldFR4cygpLnB1c2godHgpO1xuICAgIH1cbiAgICBpZiAoIXNlZW5CbG9ja3MuaGFzKHR4LmdldEJsb2NrKCkpKSB7XG4gICAgICBzZWVuQmxvY2tzLmFkZCh0eC5nZXRCbG9jaygpKTtcbiAgICAgIGJsb2Nrcy5wdXNoKHR4LmdldEJsb2NrKCkpO1xuICAgIH1cbiAgfVxuICBcbiAgLy8gc2VyaWFsaXplIGJsb2NrcyB0byBqc29uXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYmxvY2tzLmxlbmd0aDsgaSsrKSBibG9ja3NbaV0gPSBibG9ja3NbaV0udG9Kc29uKCk7XG4gIHJldHVybiB7YmxvY2tzOiBibG9ja3N9O1xufVxuXG5zZWxmLmdldFRyYW5zZmVycyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBibG9ja0pzb25RdWVyeSkge1xuICBcbiAgLy8gZGVzZXJpYWxpemUgcXVlcnkgd2hpY2ggaXMganNvbiBzdHJpbmcgcm9vdGVkIGF0IGJsb2NrXG4gIGxldCBxdWVyeSA9IChuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uUXVlcnksIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFhfUVVFUlkpLmdldFR4cygpWzBdIGFzIE1vbmVyb1R4UXVlcnkpLmdldFRyYW5zZmVyUXVlcnkoKTtcbiAgXG4gIC8vIGdldCB0cmFuc2ZlcnNcbiAgbGV0IHRyYW5zZmVycyA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFRyYW5zZmVycyhxdWVyeSk7XG4gIFxuICAvLyBjb2xsZWN0IHVuaXF1ZSBibG9ja3MgdG8gcHJlc2VydmUgbW9kZWwgcmVsYXRpb25zaGlwcyBhcyB0cmVlXG4gIGxldCB1bmNvbmZpcm1lZEJsb2NrID0gdW5kZWZpbmVkO1xuICBsZXQgYmxvY2tzID0gW107XG4gIGxldCBzZWVuQmxvY2tzID0gbmV3IFNldCgpO1xuICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0cmFuc2ZlcnMpIHtcbiAgICBsZXQgdHggPSB0cmFuc2Zlci5nZXRUeCgpO1xuICAgIGlmICghdHguZ2V0QmxvY2soKSkge1xuICAgICAgaWYgKCF1bmNvbmZpcm1lZEJsb2NrKSB1bmNvbmZpcm1lZEJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0VHhzKFtdKTtcbiAgICAgIHR4LnNldEJsb2NrKHVuY29uZmlybWVkQmxvY2spO1xuICAgICAgdW5jb25maXJtZWRCbG9jay5nZXRUeHMoKS5wdXNoKHR4KTtcbiAgICB9XG4gICAgaWYgKCFzZWVuQmxvY2tzLmhhcyh0eC5nZXRCbG9jaygpKSkge1xuICAgICAgc2VlbkJsb2Nrcy5hZGQodHguZ2V0QmxvY2soKSk7XG4gICAgICBibG9ja3MucHVzaCh0eC5nZXRCbG9jaygpKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIHNlcmlhbGl6ZSBibG9ja3MgdG8ganNvblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGJsb2Nrcy5sZW5ndGg7IGkrKykgYmxvY2tzW2ldID0gYmxvY2tzW2ldLnRvSnNvbigpO1xuICByZXR1cm4gYmxvY2tzO1xufVxuXG5zZWxmLmdldE91dHB1dHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYmxvY2tKc29uUXVlcnkpIHtcblxuICAvLyBkZXNlcmlhbGl6ZSBxdWVyeSB3aGljaCBpcyBqc29uIHN0cmluZyByb290ZWQgYXQgYmxvY2tcbiAgbGV0IHF1ZXJ5ID0gKG5ldyBNb25lcm9CbG9jayhibG9ja0pzb25RdWVyeSwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWF9RVUVSWSkuZ2V0VHhzKClbMF0gYXMgTW9uZXJvVHhRdWVyeSkuZ2V0T3V0cHV0UXVlcnkoKTtcbiAgXG4gIC8vIGdldCBvdXRwdXRzXG4gIGxldCBvdXRwdXRzID0gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0T3V0cHV0cyhxdWVyeSk7XG4gIFxuICAvLyBjb2xsZWN0IHVuaXF1ZSBibG9ja3MgdG8gcHJlc2VydmUgbW9kZWwgcmVsYXRpb25zaGlwcyBhcyB0cmVlXG4gIGxldCB1bmNvbmZpcm1lZEJsb2NrID0gdW5kZWZpbmVkO1xuICBsZXQgYmxvY2tzID0gW107XG4gIGxldCBzZWVuQmxvY2tzID0gbmV3IFNldCgpO1xuICBmb3IgKGxldCBvdXRwdXQgb2Ygb3V0cHV0cykge1xuICAgIGxldCB0eCA9IG91dHB1dC5nZXRUeCgpO1xuICAgIGlmICghdHguZ2V0QmxvY2soKSkge1xuICAgICAgaWYgKCF1bmNvbmZpcm1lZEJsb2NrKSB1bmNvbmZpcm1lZEJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0VHhzKFtdKTtcbiAgICAgIHR4LnNldEJsb2NrKHVuY29uZmlybWVkQmxvY2spO1xuICAgICAgdW5jb25maXJtZWRCbG9jay5nZXRUeHMoKS5wdXNoKHR4KTtcbiAgICB9XG4gICAgaWYgKCFzZWVuQmxvY2tzLmhhcyh0eC5nZXRCbG9jaygpKSkge1xuICAgICAgc2VlbkJsb2Nrcy5hZGQodHguZ2V0QmxvY2soKSk7XG4gICAgICBibG9ja3MucHVzaCh0eC5nZXRCbG9jaygpKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIHNlcmlhbGl6ZSBibG9ja3MgdG8ganNvblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGJsb2Nrcy5sZW5ndGg7IGkrKykgYmxvY2tzW2ldID0gYmxvY2tzW2ldLnRvSnNvbigpO1xuICByZXR1cm4gYmxvY2tzO1xufVxuXG5zZWxmLmV4cG9ydE91dHB1dHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgYWxsKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5leHBvcnRPdXRwdXRzKGFsbCk7XG59XG5cbnNlbGYuaW1wb3J0T3V0cHV0cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBvdXRwdXRzSGV4KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pbXBvcnRPdXRwdXRzKG91dHB1dHNIZXgpO1xufVxuXG5zZWxmLmdldEtleUltYWdlcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhbGwpIHtcbiAgbGV0IGtleUltYWdlc0pzb24gPSBbXTtcbiAgZm9yIChsZXQga2V5SW1hZ2Ugb2YgYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZXhwb3J0S2V5SW1hZ2VzKGFsbCkpIGtleUltYWdlc0pzb24ucHVzaChrZXlJbWFnZS50b0pzb24oKSk7XG4gIHJldHVybiBrZXlJbWFnZXNKc29uO1xufVxuXG5zZWxmLmltcG9ydEtleUltYWdlcyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBrZXlJbWFnZXNKc29uKSB7XG4gIGxldCBrZXlJbWFnZXMgPSBbXTtcbiAgZm9yIChsZXQga2V5SW1hZ2VKc29uIG9mIGtleUltYWdlc0pzb24pIGtleUltYWdlcy5wdXNoKG5ldyBNb25lcm9LZXlJbWFnZShrZXlJbWFnZUpzb24pKTtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pbXBvcnRLZXlJbWFnZXMoa2V5SW1hZ2VzKSkudG9Kc29uKCk7XG59XG5cbi8vYXN5bmMgZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQoKSB7XG4vLyAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuLy99XG5cbnNlbGYuZnJlZXplT3V0cHV0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGtleUltYWdlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5mcmVlemVPdXRwdXQoa2V5SW1hZ2UpO1xufVxuXG5zZWxmLnRoYXdPdXRwdXQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwga2V5SW1hZ2UpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnRoYXdPdXRwdXQoa2V5SW1hZ2UpO1xufVxuXG5zZWxmLmlzT3V0cHV0RnJvemVuID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGtleUltYWdlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5pc091dHB1dEZyb3plbihrZXlJbWFnZSk7XG59XG5cbnNlbGYuY3JlYXRlVHhzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGNvbmZpZykge1xuICBpZiAodHlwZW9mIGNvbmZpZyA9PT0gXCJvYmplY3RcIikgY29uZmlnID0gbmV3IE1vbmVyb1R4Q29uZmlnKGNvbmZpZyk7XG4gIGxldCB0eHMgPSBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jcmVhdGVUeHMoY29uZmlnKTtcbiAgcmV0dXJuIHR4c1swXS5nZXRUeFNldCgpLnRvSnNvbigpO1xufVxuXG5zZWxmLnN3ZWVwT3V0cHV0ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGNvbmZpZykge1xuICBpZiAodHlwZW9mIGNvbmZpZyA9PT0gXCJvYmplY3RcIikgY29uZmlnID0gbmV3IE1vbmVyb1R4Q29uZmlnKGNvbmZpZyk7XG4gIGxldCB0eCA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN3ZWVwT3V0cHV0KGNvbmZpZyk7XG4gIHJldHVybiB0eC5nZXRUeFNldCgpLnRvSnNvbigpO1xufVxuXG5zZWxmLnN3ZWVwVW5sb2NrZWQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgY29uZmlnKSB7XG4gIGlmICh0eXBlb2YgY29uZmlnID09PSBcIm9iamVjdFwiKSBjb25maWcgPSBuZXcgTW9uZXJvVHhDb25maWcoY29uZmlnKTtcbiAgbGV0IHR4cyA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN3ZWVwVW5sb2NrZWQoY29uZmlnKTtcbiAgbGV0IHR4U2V0cyA9IFtdO1xuICBmb3IgKGxldCB0eCBvZiB0eHMpIGlmICghR2VuVXRpbHMuYXJyYXlDb250YWlucyh0eFNldHMsIHR4LmdldFR4U2V0KCkpKSB0eFNldHMucHVzaCh0eC5nZXRUeFNldCgpKTtcbiAgbGV0IHR4U2V0c0pzb24gPSBbXTtcbiAgZm9yIChsZXQgdHhTZXQgb2YgdHhTZXRzKSB0eFNldHNKc29uLnB1c2godHhTZXQudG9Kc29uKCkpO1xuICByZXR1cm4gdHhTZXRzSnNvbjtcbn1cblxuc2VsZi5zd2VlcER1c3QgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgcmVsYXkpIHtcbiAgbGV0IHR4cyA9IGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN3ZWVwRHVzdChyZWxheSk7XG4gIHJldHVybiB0eHMubGVuZ3RoID09PSAwID8ge30gOiB0eHNbMF0uZ2V0VHhTZXQoKS50b0pzb24oKTtcbn1cblxuc2VsZi5yZWxheVR4cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eE1ldGFkYXRhcykge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0ucmVsYXlUeHModHhNZXRhZGF0YXMpO1xufVxuXG5zZWxmLmRlc2NyaWJlVHhTZXQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdHhTZXRKc29uKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZGVzY3JpYmVUeFNldChuZXcgTW9uZXJvVHhTZXQodHhTZXRKc29uKSkpLnRvSnNvbigpO1xufVxuXG5zZWxmLnNpZ25UeHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdW5zaWduZWRUeEhleCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2lnblR4cyh1bnNpZ25lZFR4SGV4KTtcbn1cblxuc2VsZi5zdWJtaXRUeHMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgc2lnbmVkVHhIZXgpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN1Ym1pdFR4cyhzaWduZWRUeEhleCk7XG59XG5cbnNlbGYuc2lnbk1lc3NhZ2UgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbWVzc2FnZSwgc2lnbmF0dXJlVHlwZSwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2lnbk1lc3NhZ2UobWVzc2FnZSwgc2lnbmF0dXJlVHlwZSwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG59XG5cbnNlbGYudmVyaWZ5TWVzc2FnZSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBtZXNzYWdlLCBhZGRyZXNzLCBzaWduYXR1cmUpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS52ZXJpZnlNZXNzYWdlKG1lc3NhZ2UsIGFkZHJlc3MsIHNpZ25hdHVyZSkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmdldFR4S2V5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0VHhLZXkodHhIYXNoKTtcbn1cblxuc2VsZi5jaGVja1R4S2V5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaCwgdHhLZXksIGFkZHJlc3MpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jaGVja1R4S2V5KHR4SGFzaCwgdHhLZXksIGFkZHJlc3MpKS50b0pzb24oKTtcbn1cblxuc2VsZi5nZXRUeFByb29mID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaCwgYWRkcmVzcywgbWVzc2FnZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0VHhQcm9vZih0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UpO1xufVxuXG5zZWxmLmNoZWNrVHhQcm9vZiA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmNoZWNrVHhQcm9vZih0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSkpLnRvSnNvbigpO1xufVxuXG5zZWxmLmdldFNwZW5kUHJvb2YgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdHhIYXNoLCBtZXNzYWdlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRTcGVuZFByb29mKHR4SGFzaCwgbWVzc2FnZSk7XG59XG5cbnNlbGYuY2hlY2tTcGVuZFByb29mID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaCwgbWVzc2FnZSwgc2lnbmF0dXJlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jaGVja1NwZW5kUHJvb2YodHhIYXNoLCBtZXNzYWdlLCBzaWduYXR1cmUpO1xufVxuXG5zZWxmLmdldFJlc2VydmVQcm9vZldhbGxldCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBtZXNzYWdlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRSZXNlcnZlUHJvb2ZXYWxsZXQobWVzc2FnZSk7XG59XG5cbnNlbGYuZ2V0UmVzZXJ2ZVByb29mQWNjb3VudCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhY2NvdW50SWR4LCBhbW91bnRTdHIsIG1lc3NhZ2UpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmdldFJlc2VydmVQcm9vZkFjY291bnQoYWNjb3VudElkeCwgYW1vdW50U3RyLCBtZXNzYWdlKTtcbn1cblxuc2VsZi5jaGVja1Jlc2VydmVQcm9vZiA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jaGVja1Jlc2VydmVQcm9vZihhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUpKS50b0pzb24oKTtcbn1cblxuc2VsZi5nZXRUeE5vdGVzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaGVzKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRUeE5vdGVzKHR4SGFzaGVzKTtcbn1cblxuc2VsZi5zZXRUeE5vdGVzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHR4SGFzaGVzLCB0eE5vdGVzKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zZXRUeE5vdGVzKHR4SGFzaGVzLCB0eE5vdGVzKTtcbn1cblxuc2VsZi5nZXRBZGRyZXNzQm9va0VudHJpZXMgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgZW50cnlJbmRpY2VzKSB7XG4gIGxldCBlbnRyaWVzSnNvbiA9IFtdO1xuICBmb3IgKGxldCBlbnRyeSBvZiBhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRBZGRyZXNzQm9va0VudHJpZXMoZW50cnlJbmRpY2VzKSkgZW50cmllc0pzb24ucHVzaChlbnRyeS50b0pzb24oKSk7XG4gIHJldHVybiBlbnRyaWVzSnNvbjtcbn1cblxuc2VsZi5hZGRBZGRyZXNzQm9va0VudHJ5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFkZHJlc3MsIGRlc2NyaXB0aW9uKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5hZGRBZGRyZXNzQm9va0VudHJ5KGFkZHJlc3MsIGRlc2NyaXB0aW9uKTtcbn1cblxuc2VsZi5lZGl0QWRkcmVzc0Jvb2tFbnRyeSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBpbmRleCwgc2V0QWRkcmVzcywgYWRkcmVzcywgc2V0RGVzY3JpcHRpb24sIGRlc2NyaXB0aW9uKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5lZGl0QWRkcmVzc0Jvb2tFbnRyeShpbmRleCwgc2V0QWRkcmVzcywgYWRkcmVzcywgc2V0RGVzY3JpcHRpb24sIGRlc2NyaXB0aW9uKTtcbn1cblxuc2VsZi5kZWxldGVBZGRyZXNzQm9va0VudHJ5ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGluZGV4KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5kZWxldGVBZGRyZXNzQm9va0VudHJ5KGluZGV4KTtcbn1cblxuc2VsZi50YWdBY2NvdW50cyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCB0YWcsIGFjY291bnRJbmRpY2VzKSB7XG4gIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbn1cblxuc2VsZi51bnRhZ0FjY291bnRzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIGFjY291bnRJbmRpY2VzKSB7XG4gIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbn1cblxuc2VsZi5nZXRBY2NvdW50VGFncyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHRocm93IG5ldyBFcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbn1cblxuc2VsZi5zZXRBY2NvdW50VGFnTGFiZWwgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgdGFnLCBsYWJlbCkge1xuICB0aHJvdyBuZXcgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG59XG5cbnNlbGYuZ2V0UGF5bWVudFVyaSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBjb25maWdKc29uKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRQYXltZW50VXJpKG5ldyBNb25lcm9UeENvbmZpZyhjb25maWdKc29uKSk7XG59XG5cbnNlbGYucGFyc2VQYXltZW50VXJpID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIHVyaSkge1xuICByZXR1cm4gKGF3YWl0IHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnBhcnNlUGF5bWVudFVyaSh1cmkpKS50b0pzb24oKTtcbn1cblxuc2VsZi5nZXRBdHRyaWJ1dGUgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwga2V5KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5nZXRBdHRyaWJ1dGUoa2V5KTtcbn1cblxuc2VsZi5zZXRBdHRyaWJ1dGUgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwga2V5LCB2YWx1ZSkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpO1xufVxuXG5zZWxmLnN0YXJ0TWluaW5nID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG51bVRocmVhZHMsIGJhY2tncm91bmRNaW5pbmcsIGlnbm9yZUJhdHRlcnkpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLnN0YXJ0TWluaW5nKG51bVRocmVhZHMsIGJhY2tncm91bmRNaW5pbmcsIGlnbm9yZUJhdHRlcnkpO1xufVxuXG5zZWxmLnN0b3BNaW5pbmcgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uc3RvcE1pbmluZygpO1xufVxuXG5zZWxmLmlzTXVsdGlzaWdJbXBvcnROZWVkZWQgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCgpO1xufVxuXG5zZWxmLmlzTXVsdGlzaWcgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaXNNdWx0aXNpZygpO1xufVxuXG5zZWxmLmdldE11bHRpc2lnSW5mbyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0TXVsdGlzaWdJbmZvKCkpLnRvSnNvbigpO1xufVxuXG5zZWxmLnByZXBhcmVNdWx0aXNpZyA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5wcmVwYXJlTXVsdGlzaWcoKTtcbn1cblxuc2VsZi5tYWtlTXVsdGlzaWcgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCwgbXVsdGlzaWdIZXhlcywgdGhyZXNob2xkLCBwYXNzd29yZCkge1xuICByZXR1cm4gYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0ubWFrZU11bHRpc2lnKG11bHRpc2lnSGV4ZXMsIHRocmVzaG9sZCwgcGFzc3dvcmQpO1xufVxuXG5zZWxmLmV4Y2hhbmdlTXVsdGlzaWdLZXlzID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG11bHRpc2lnSGV4ZXMsIHBhc3N3b3JkKSB7XG4gIHJldHVybiAoYXdhaXQgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZXhjaGFuZ2VNdWx0aXNpZ0tleXMobXVsdGlzaWdIZXhlcywgcGFzc3dvcmQpKS50b0pzb24oKTtcbn1cblxuc2VsZi5leHBvcnRNdWx0aXNpZ0hleCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5leHBvcnRNdWx0aXNpZ0hleCgpO1xufVxuXG5zZWxmLmltcG9ydE11bHRpc2lnSGV4ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG11bHRpc2lnSGV4ZXMpIHtcbiAgcmV0dXJuIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdLmltcG9ydE11bHRpc2lnSGV4KG11bHRpc2lnSGV4ZXMpO1xufVxuXG5zZWxmLnNpZ25NdWx0aXNpZ1R4SGV4ID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG11bHRpc2lnVHhIZXgpIHtcbiAgcmV0dXJuIChhd2FpdCBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zaWduTXVsdGlzaWdUeEhleChtdWx0aXNpZ1R4SGV4KSkudG9Kc29uKCk7XG59XG5cbnNlbGYuc3VibWl0TXVsdGlzaWdUeEhleCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBzaWduZWRNdWx0aXNpZ1R4SGV4KSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5zdWJtaXRNdWx0aXNpZ1R4SGV4KHNpZ25lZE11bHRpc2lnVHhIZXgpO1xufVxuXG5zZWxmLmdldERhdGEgPSBhc3luYyBmdW5jdGlvbih3YWxsZXRJZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uZ2V0RGF0YSgpO1xufVxuXG5zZWxmLmNoYW5nZVBhc3N3b3JkID0gYXN5bmMgZnVuY3Rpb24od2FsbGV0SWQsIG9sZFBhc3N3b3JkLCBuZXdQYXNzd29yZCkge1xuICByZXR1cm4gc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uY2hhbmdlUGFzc3dvcmQob2xkUGFzc3dvcmQsIG5ld1Bhc3N3b3JkKTtcbn1cblxuc2VsZi5pc0Nsb3NlZCA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkKSB7XG4gIHJldHVybiAhc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0gfHwgc2VsZi5XT1JLRVJfT0JKRUNUU1t3YWxsZXRJZF0uaXNDbG9zZWQoKTtcbn1cblxuc2VsZi5jbG9zZSA9IGFzeW5jIGZ1bmN0aW9uKHdhbGxldElkLCBzYXZlKSB7XG4gIHJldHVybiBzZWxmLldPUktFUl9PQkpFQ1RTW3dhbGxldElkXS5jbG9zZShzYXZlKTtcbiAgZGVsZXRlIHNlbGYuV09SS0VSX09CSkVDVFNbd2FsbGV0SWRdO1xufSJdLCJtYXBwaW5ncyI6ImtHQUFBLElBQUFBLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLFNBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLFdBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFHLGFBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFJLFVBQUEsR0FBQUwsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFLLFlBQUEsR0FBQU4sc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFNLG1CQUFBLEdBQUFQLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTyxxQkFBQSxHQUFBUixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVEsZ0JBQUEsR0FBQVQsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFTLFlBQUEsR0FBQVYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFVLGVBQUEsR0FBQVgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFXLG9CQUFBLEdBQUFaLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBWSxlQUFBLEdBQUFiLHNCQUFBLENBQUFDLE9BQUE7O0FBRUEsSUFBQWEsWUFBQSxHQUFBZCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWMsWUFBQSxHQUFBZixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWUsbUJBQUEsR0FBQWhCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBZ0IscUJBQUEsR0FBQWpCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBaUIsaUJBQUEsR0FBQWpCLE9BQUE7QUFDQSxJQUFBa0IsaUJBQUEsR0FBQW5CLHNCQUFBLENBQUFDLE9BQUE7Ozs7QUFJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQW1CLElBQUksQ0FBQ0MsU0FBUyxHQUFHLGdCQUFlQyxDQUFDLEVBQUU7O0VBRWpDO0VBQ0EsTUFBTUYsSUFBSSxDQUFDRyxXQUFXLENBQUMsQ0FBQzs7RUFFeEI7RUFDQSxJQUFJQyxRQUFRLEdBQUdGLENBQUMsQ0FBQ0csSUFBSSxDQUFDLENBQUMsQ0FBQztFQUN4QixJQUFJQyxNQUFNLEdBQUdKLENBQUMsQ0FBQ0csSUFBSSxDQUFDLENBQUMsQ0FBQztFQUN0QixJQUFJRSxVQUFVLEdBQUdMLENBQUMsQ0FBQ0csSUFBSSxDQUFDLENBQUMsQ0FBQztFQUMxQixJQUFBRyxlQUFNLEVBQUNGLE1BQU0sRUFBRSxzQ0FBc0MsQ0FBQztFQUN0RCxJQUFBRSxlQUFNLEVBQUNELFVBQVUsRUFBRSxvQ0FBb0MsQ0FBQztFQUN4RCxJQUFJLENBQUNQLElBQUksQ0FBQ00sTUFBTSxDQUFDLEVBQUUsTUFBTSxJQUFJRyxLQUFLLENBQUMsVUFBVSxHQUFHSCxNQUFNLEdBQUcsaUNBQWlDLENBQUM7RUFDM0ZKLENBQUMsQ0FBQ0csSUFBSSxDQUFDSyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7O0VBRXJCO0VBQ0EsSUFBSTtJQUNGQyxXQUFXLENBQUMsQ0FBQ1AsUUFBUSxFQUFFRyxVQUFVLEVBQUUsRUFBQ0ssTUFBTSxFQUFFLE1BQU1aLElBQUksQ0FBQ00sTUFBTSxDQUFDLENBQUNPLEtBQUssQ0FBQyxJQUFJLEVBQUVYLENBQUMsQ0FBQ0csSUFBSSxDQUFDLEVBQUMsQ0FBQyxDQUFDO0VBQ3ZGLENBQUMsQ0FBQyxPQUFPSCxDQUFNLEVBQUU7SUFDZixJQUFJLEVBQUVBLENBQUMsWUFBWU8sS0FBSyxDQUFDLEVBQUVQLENBQUMsR0FBRyxJQUFJTyxLQUFLLENBQUNQLENBQUMsQ0FBQztJQUMzQ1MsV0FBVyxDQUFDLENBQUNQLFFBQVEsRUFBRUcsVUFBVSxFQUFFLEVBQUNPLEtBQUssRUFBRUMscUJBQVksQ0FBQ0MsY0FBYyxDQUFDZCxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUM7RUFDOUU7QUFDRixDQUFDOztBQUVERixJQUFJLENBQUNHLFdBQVcsR0FBRyxrQkFBaUI7RUFDbEMsSUFBSSxDQUFDSCxJQUFJLENBQUNpQixhQUFhLEVBQUU7SUFDdkJqQixJQUFJLENBQUNrQixjQUFjLEdBQUcsQ0FBQyxDQUFDO0lBQ3hCbEIsSUFBSSxDQUFDaUIsYUFBYSxHQUFHLElBQUk7SUFDekJFLG9CQUFXLENBQUNDLGVBQWUsR0FBRyxLQUFLO0VBQ3JDO0FBQ0YsQ0FBQzs7QUFFRDs7QUFFQXBCLElBQUksQ0FBQ3FCLFdBQVcsR0FBRyxnQkFBZWpCLFFBQVEsRUFBRWtCLElBQUksRUFBRTtFQUNoRCxJQUFJO0lBQ0YsT0FBTyxNQUFNQyxtQkFBVSxDQUFDQyxPQUFPLENBQUNDLE1BQU0sQ0FBQ0MsTUFBTSxDQUFDSixJQUFJLEVBQUUsRUFBQ0ssYUFBYSxFQUFFLEtBQUssRUFBQyxDQUFDLENBQUM7RUFDOUUsQ0FBQyxDQUFDLE9BQU9DLEdBQVEsRUFBRTtJQUNqQixNQUFNQSxHQUFHLENBQUNDLFVBQVUsR0FBRyxJQUFJcEIsS0FBSyxDQUFDcUIsSUFBSSxDQUFDQyxTQUFTLENBQUMsRUFBQ0YsVUFBVSxFQUFFRCxHQUFHLENBQUNDLFVBQVUsRUFBRUcsYUFBYSxFQUFFSixHQUFHLENBQUNLLE9BQU8sRUFBQyxDQUFDLENBQUMsR0FBR0wsR0FBRztFQUNsSDtBQUNGLENBQUM7O0FBRUQ1QixJQUFJLENBQUNrQyxXQUFXLEdBQUcsZ0JBQWU5QixRQUFRLEVBQUUrQixLQUFLLEVBQUU7RUFDakQsT0FBT3BCLHFCQUFZLENBQUNtQixXQUFXLENBQUNDLEtBQUssQ0FBQztBQUN4QyxDQUFDOztBQUVEbkMsSUFBSSxDQUFDb0MsaUJBQWlCLEdBQUcsZ0JBQWVoQyxRQUFRLEVBQUU7RUFDaEQsT0FBT1cscUJBQVksQ0FBQ3NCLGFBQWEsQ0FBQyxDQUFDLElBQUl0QixxQkFBWSxDQUFDc0IsYUFBYSxDQUFDLENBQUMsQ0FBQ0MsS0FBSyxHQUFHdkIscUJBQVksQ0FBQ3NCLGFBQWEsQ0FBQyxDQUFDLENBQUNDLEtBQUssQ0FBQ0MsTUFBTSxHQUFHQyxTQUFTO0FBQ25JLENBQUM7O0FBRUQ7O0FBRUF4QyxJQUFJLENBQUN5QywrQkFBK0IsR0FBRyxnQkFBZXJDLFFBQVEsRUFBRXNDLFdBQVcsRUFBRUMsZUFBZSxFQUFFQyxTQUFTLEVBQUU7RUFDdkcsT0FBTyxDQUFDLE1BQU16QixvQkFBVyxDQUFDMEIsb0JBQW9CLENBQUNILFdBQVcsRUFBRUMsZUFBZSxFQUFFQyxTQUFTLENBQUMsRUFBRUUsTUFBTSxDQUFDLENBQUM7QUFDbkcsQ0FBQzs7QUFFRDlDLElBQUksQ0FBQytDLDBCQUEwQixHQUFHLGdCQUFlM0MsUUFBUSxFQUFFNEMsT0FBTyxFQUFFTixXQUFXLEVBQUU7RUFDL0UsT0FBT3ZCLG9CQUFXLENBQUM4QixlQUFlLENBQUNELE9BQU8sRUFBRU4sV0FBVyxDQUFDO0FBQzFELENBQUM7O0FBRUQxQyxJQUFJLENBQUNrRCx1QkFBdUIsR0FBRyxnQkFBZTlDLFFBQVEsRUFBRStDLElBQUksRUFBRTtFQUM1RCxPQUFPaEMsb0JBQVcsQ0FBQ2lDLFlBQVksQ0FBQ0QsSUFBSSxDQUFDO0FBQ3ZDLENBQUM7O0FBRURuRCxJQUFJLENBQUNxRCx1QkFBdUIsR0FBRyxnQkFBZWpELFFBQVEsRUFBRWtELFFBQVEsRUFBRTtFQUNoRSxPQUFPbkMsb0JBQVcsQ0FBQ29DLFlBQVksQ0FBQ0QsUUFBUSxDQUFDO0FBQzNDLENBQUM7O0FBRUR0RCxJQUFJLENBQUN3RCw2QkFBNkIsR0FBRyxnQkFBZXBELFFBQVEsRUFBRWtELFFBQVEsRUFBRTtFQUN0RSxPQUFPbkMsb0JBQVcsQ0FBQ3NDLGtCQUFrQixDQUFDSCxRQUFRLENBQUM7QUFDakQsQ0FBQzs7QUFFRDs7QUFFQXRELElBQUksQ0FBQzBELGlCQUFpQixHQUFHLGdCQUFlQyxRQUFRLEVBQUVDLFVBQVUsRUFBRTtFQUM1RCxJQUFJQyxRQUFRLEdBQUcsSUFBSSxjQUFjQyw2QkFBb0IsQ0FBQztJQUNwRCxNQUFNQyxhQUFhQSxDQUFDQyxXQUFXLEVBQUU7TUFDL0JoRSxJQUFJLENBQUNXLFdBQVcsQ0FBQyxDQUFDZ0QsUUFBUSxFQUFFLGdCQUFnQixHQUFHQyxVQUFVLEVBQUVJLFdBQVcsQ0FBQ2xCLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuRjtFQUNGLENBQUMsQ0FBRCxDQUFDO0VBQ0QsSUFBSSxDQUFDOUMsSUFBSSxDQUFDaUUsZUFBZSxFQUFFakUsSUFBSSxDQUFDaUUsZUFBZSxHQUFHLENBQUMsQ0FBQztFQUNwRGpFLElBQUksQ0FBQ2lFLGVBQWUsQ0FBQ0wsVUFBVSxDQUFDLEdBQUdDLFFBQVE7RUFDM0MsTUFBTTdELElBQUksQ0FBQ2tCLGNBQWMsQ0FBQ3lDLFFBQVEsQ0FBQyxDQUFDTyxXQUFXLENBQUNMLFFBQVEsQ0FBQztBQUMzRCxDQUFDOztBQUVEN0QsSUFBSSxDQUFDbUUsb0JBQW9CLEdBQUcsZ0JBQWVSLFFBQVEsRUFBRUMsVUFBVSxFQUFFO0VBQy9ELElBQUksQ0FBQzVELElBQUksQ0FBQ2lFLGVBQWUsQ0FBQ0wsVUFBVSxDQUFDLEVBQUUsTUFBTSxJQUFJUSxvQkFBVyxDQUFDLGdEQUFnRCxHQUFHUixVQUFVLENBQUM7RUFDM0gsTUFBTTVELElBQUksQ0FBQ2tCLGNBQWMsQ0FBQ3lDLFFBQVEsQ0FBQyxDQUFDVSxjQUFjLENBQUNyRSxJQUFJLENBQUNpRSxlQUFlLENBQUNMLFVBQVUsQ0FBQyxDQUFDO0VBQ3BGLE9BQU81RCxJQUFJLENBQUNpRSxlQUFlLENBQUNMLFVBQVUsQ0FBQztBQUN6QyxDQUFDOztBQUVENUQsSUFBSSxDQUFDc0UsZ0JBQWdCLEdBQUcsZ0JBQWVYLFFBQVEsRUFBRVksTUFBTSxFQUFFO0VBQ3ZEdkUsSUFBSSxDQUFDa0IsY0FBYyxDQUFDeUMsUUFBUSxDQUFDLEdBQUcsTUFBTWEsd0JBQWUsQ0FBQ0Msa0JBQWtCLENBQUMsSUFBSUMsMkJBQWtCLENBQUNILE1BQU0sQ0FBQyxDQUFDO0FBQzFHLENBQUM7O0FBRUR2RSxJQUFJLENBQUMyRSxzQkFBc0IsR0FBRyxnQkFBZWhCLFFBQVEsRUFBRTtFQUNyRCxJQUFJaUIsVUFBVSxHQUFHLE1BQU01RSxJQUFJLENBQUNrQixjQUFjLENBQUN5QyxRQUFRLENBQUMsQ0FBQ2tCLGdCQUFnQixDQUFDLENBQUM7RUFDdkUsT0FBT0QsVUFBVSxHQUFHQSxVQUFVLENBQUNFLFNBQVMsQ0FBQyxDQUFDLEdBQUd0QyxTQUFTO0FBQ3hELENBQUM7O0FBRUR4QyxJQUFJLENBQUMrRSxpQkFBaUIsR0FBRyxnQkFBZXBCLFFBQVEsRUFBRTtFQUNoRCxPQUFPM0QsSUFBSSxDQUFDa0IsY0FBYyxDQUFDeUMsUUFBUSxDQUFDLENBQUNxQixXQUFXLENBQUMsQ0FBQztBQUNwRCxDQUFDOztBQUVEaEYsSUFBSSxDQUFDaUYsZ0JBQWdCLEdBQUcsZ0JBQWV0QixRQUFRLEVBQUU7RUFDL0MsT0FBTyxDQUFDLE1BQU0zRCxJQUFJLENBQUNrQixjQUFjLENBQUN5QyxRQUFRLENBQUMsQ0FBQ3VCLFVBQVUsQ0FBQyxDQUFDLEVBQUVwQyxNQUFNLENBQUMsQ0FBQztBQUNwRSxDQUFDOztBQUVEOUMsSUFBSSxDQUFDbUYsZUFBZSxHQUFHLGdCQUFleEIsUUFBUSxFQUFFO0VBQzlDLE9BQU8zRCxJQUFJLENBQUNrQixjQUFjLENBQUN5QyxRQUFRLENBQUMsQ0FBQ3lCLFNBQVMsQ0FBQyxDQUFDO0FBQ2xELENBQUM7O0FBRURwRixJQUFJLENBQUNxRixlQUFlLEdBQUcsZ0JBQWUxQixRQUFRLEVBQUU7RUFDOUMsT0FBTzNELElBQUksQ0FBQ2tCLGNBQWMsQ0FBQ3lDLFFBQVEsQ0FBQyxDQUFDMkIsU0FBUyxDQUFDLENBQUM7QUFDbEQsQ0FBQzs7QUFFRHRGLElBQUksQ0FBQ3VGLGtCQUFrQixHQUFHLGdCQUFlNUIsUUFBUSxFQUFFNkIsTUFBTSxFQUFFO0VBQ3pELE9BQU94RixJQUFJLENBQUNrQixjQUFjLENBQUN5QyxRQUFRLENBQUMsQ0FBQzhCLFlBQVksQ0FBQ0QsTUFBTSxDQUFDO0FBQzNELENBQUM7O0FBRUR4RixJQUFJLENBQUMwRixzQkFBc0IsR0FBRyxnQkFBZS9CLFFBQVEsRUFBRWdDLGFBQWEsRUFBRUMsV0FBVyxFQUFFO0VBQ2pGLE9BQU8sQ0FBQyxNQUFNNUYsSUFBSSxDQUFDa0IsY0FBYyxDQUFDeUMsUUFBUSxDQUFDLENBQUNrQyxnQkFBZ0IsQ0FBQ0YsYUFBYSxFQUFFQyxXQUFXLENBQUMsRUFBRTlDLE1BQU0sQ0FBQyxDQUFDO0FBQ3BHLENBQUM7O0FBRUQ5QyxJQUFJLENBQUM4Rix3QkFBd0IsR0FBRyxnQkFBZW5DLFFBQVEsRUFBRTtFQUN2RCxPQUFPLENBQUMsTUFBTTNELElBQUksQ0FBQ2tCLGNBQWMsQ0FBQ3lDLFFBQVEsQ0FBQyxDQUFDb0Msa0JBQWtCLENBQUMsQ0FBQyxFQUFFakQsTUFBTSxDQUFDLENBQUM7QUFDNUUsQ0FBQzs7QUFFRDlDLElBQUksQ0FBQ2dHLDBCQUEwQixHQUFHLGdCQUFlckMsUUFBUSxFQUFFc0MsSUFBSSxFQUFFO0VBQy9ELE9BQU8sQ0FBQyxNQUFNakcsSUFBSSxDQUFDa0IsY0FBYyxDQUFDeUMsUUFBUSxDQUFDLENBQUN1QyxvQkFBb0IsQ0FBQ0QsSUFBSSxDQUFDLEVBQUVuRCxNQUFNLENBQUMsQ0FBQztBQUNsRixDQUFDOztBQUVEOUMsSUFBSSxDQUFDbUcsNEJBQTRCLEdBQUcsZ0JBQWV4QyxRQUFRLEVBQUU2QixNQUFNLEVBQUU7RUFDbkUsT0FBTyxDQUFDLE1BQU14RixJQUFJLENBQUNrQixjQUFjLENBQUN5QyxRQUFRLENBQUMsQ0FBQ3lDLHNCQUFzQixDQUFDWixNQUFNLENBQUMsRUFBRTFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3RGLENBQUM7O0FBRUQ5QyxJQUFJLENBQUNxRyw0QkFBNEIsR0FBRyxnQkFBZTFDLFFBQVEsRUFBRTJDLFdBQVcsRUFBRUMsU0FBUyxFQUFFO0VBQ25GLElBQUlDLGdCQUFnQixHQUFHLEVBQUU7RUFDekIsS0FBSyxJQUFJeEMsV0FBVyxJQUFJLE1BQU1oRSxJQUFJLENBQUNrQixjQUFjLENBQUN5QyxRQUFRLENBQUMsQ0FBQzhDLHNCQUFzQixDQUFDSCxXQUFXLEVBQUVDLFNBQVMsQ0FBQyxFQUFFQyxnQkFBZ0IsQ0FBQ0UsSUFBSSxDQUFDMUMsV0FBVyxDQUFDbEIsTUFBTSxDQUFDLENBQUMsQ0FBQztFQUN2SixPQUFPMEQsZ0JBQWdCO0FBQ3pCLENBQUM7O0FBRUR4RyxJQUFJLENBQUMyRyxvQkFBb0IsR0FBRyxnQkFBZWhELFFBQVEsRUFBRWlELFNBQVMsRUFBRTtFQUM5RCxPQUFPLENBQUMsTUFBTTVHLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQ3lDLFFBQVEsQ0FBQyxDQUFDa0QsY0FBYyxDQUFDRCxTQUFTLENBQUMsRUFBRTlELE1BQU0sQ0FBQyxDQUFDO0FBQ2pGLENBQUM7O0FBRUQ5QyxJQUFJLENBQUM4RyxxQkFBcUIsR0FBRyxnQkFBZW5ELFFBQVEsRUFBRW9ELFdBQVcsRUFBRVQsV0FBVyxFQUFFVSxLQUFLLEVBQUU7RUFDckYsSUFBSUMsVUFBVSxHQUFHLEVBQUU7RUFDbkIsS0FBSyxJQUFJQyxLQUFLLElBQUksTUFBTWxILElBQUksQ0FBQ2tCLGNBQWMsQ0FBQ3lDLFFBQVEsQ0FBQyxDQUFDd0QsZUFBZSxDQUFDSixXQUFXLEVBQUVULFdBQVcsRUFBRVUsS0FBSyxDQUFDLEVBQUVDLFVBQVUsQ0FBQ1AsSUFBSSxDQUFDUSxLQUFLLENBQUNwRSxNQUFNLENBQUMsQ0FBQyxDQUFDO0VBQ3ZJLE9BQU9tRSxVQUFVO0FBQ25CLENBQUM7O0FBRURqSCxJQUFJLENBQUNvSCxzQkFBc0IsR0FBRyxnQkFBZXpELFFBQVEsRUFBRTZCLE1BQU0sRUFBRTtFQUM3RCxPQUFPLENBQUMsTUFBTXhGLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQ3lDLFFBQVEsQ0FBQyxDQUFDMEQsZ0JBQWdCLENBQUM3QixNQUFNLENBQUMsRUFBRTFDLE1BQU0sQ0FBQyxDQUFDO0FBQ2hGLENBQUM7O0FBRUQ5QyxJQUFJLENBQUNzSCx1QkFBdUIsR0FBRyxnQkFBZTNELFFBQVEsRUFBRTRELE9BQU8sRUFBRTtFQUMvRCxJQUFJTixVQUFVLEdBQUcsRUFBRTtFQUNuQixLQUFLLElBQUlDLEtBQUssSUFBSSxNQUFNbEgsSUFBSSxDQUFDa0IsY0FBYyxDQUFDeUMsUUFBUSxDQUFDLENBQUM2RCxpQkFBaUIsQ0FBQ0QsT0FBTyxDQUFDLEVBQUVOLFVBQVUsQ0FBQ1AsSUFBSSxDQUFDUSxLQUFLLENBQUNwRSxNQUFNLENBQUMsQ0FBQyxDQUFDO0VBQ2pILE9BQU9tRSxVQUFVO0FBQ25CLENBQUM7O0FBRURqSCxJQUFJLENBQUN5SCxzQkFBc0IsR0FBRyxnQkFBZTlELFFBQVEsRUFBRTJDLFdBQVcsRUFBRUMsU0FBUyxFQUFFO0VBQzdFLElBQUlVLFVBQVUsR0FBRyxFQUFFO0VBQ25CLEtBQUssSUFBSUMsS0FBSyxJQUFJLE1BQU1sSCxJQUFJLENBQUNrQixjQUFjLENBQUN5QyxRQUFRLENBQUMsQ0FBQytELGdCQUFnQixDQUFDcEIsV0FBVyxFQUFFQyxTQUFTLENBQUMsRUFBRVUsVUFBVSxDQUFDUCxJQUFJLENBQUNRLEtBQUssQ0FBQ3BFLE1BQU0sQ0FBQyxDQUFDLENBQUM7RUFDL0gsT0FBT21FLFVBQVU7QUFDbkIsQ0FBQzs7QUFFRGpILElBQUksQ0FBQzJILDZCQUE2QixHQUFHLGdCQUFlaEUsUUFBUSxFQUFFMkMsV0FBVyxFQUFFQyxTQUFTLEVBQUVxQixZQUFZLEVBQUU7RUFDbEcsSUFBSVgsVUFBVSxHQUFHLEVBQUU7RUFDbkIsS0FBSyxJQUFJQyxLQUFLLElBQUksTUFBTWxILElBQUksQ0FBQ2tCLGNBQWMsQ0FBQ3lDLFFBQVEsQ0FBQyxDQUFDa0UsdUJBQXVCLENBQUN2QixXQUFXLEVBQUVDLFNBQVMsRUFBRXFCLFlBQVksQ0FBQyxFQUFFWCxVQUFVLENBQUNQLElBQUksQ0FBQ1EsS0FBSyxDQUFDcEUsTUFBTSxDQUFDLENBQUMsQ0FBQztFQUNwSixPQUFPbUUsVUFBVTtBQUNuQixDQUFDOztBQUVEakgsSUFBSSxDQUFDOEgsb0JBQW9CLEdBQUcsZ0JBQWVuRSxRQUFRLEVBQUVvRCxXQUFXLEVBQUVULFdBQVcsRUFBRTtFQUM3RSxNQUFNLElBQUk3RixLQUFLLENBQUMsdUNBQXVDLENBQUM7QUFDMUQsQ0FBQzs7QUFFRDtBQUNBVCxJQUFJLENBQUMrSCxZQUFZLEdBQUcsZ0JBQWVwRSxRQUFRLEVBQUVxRSxRQUFRLEVBQUVoQixLQUFLLEVBQUU7O0VBRTVEO0VBQ0EsSUFBSWlCLEdBQUcsR0FBRyxNQUFNakksSUFBSSxDQUFDa0IsY0FBYyxDQUFDeUMsUUFBUSxDQUFDLENBQUN1RSxNQUFNLENBQUNGLFFBQVEsRUFBRWhCLEtBQUssQ0FBQzs7RUFFckU7RUFDQSxJQUFJbUIsTUFBTSxHQUFHLEVBQUU7RUFDZixJQUFJQyxnQkFBZ0IsR0FBRzVGLFNBQVM7RUFDaEMsSUFBSTZGLFVBQVUsR0FBRyxJQUFJQyxHQUFHLENBQUMsQ0FBQztFQUMxQixLQUFLLElBQUlDLEVBQUUsSUFBSU4sR0FBRyxFQUFFO0lBQ2xCLElBQUksQ0FBQ00sRUFBRSxDQUFDQyxRQUFRLENBQUMsQ0FBQyxFQUFFO01BQ2xCLElBQUksQ0FBQ0osZ0JBQWdCLEVBQUVBLGdCQUFnQixHQUFHLElBQUlLLG9CQUFXLENBQUMsQ0FBQyxDQUFDQyxNQUFNLENBQUMsRUFBRSxDQUFDO01BQ3RFSCxFQUFFLENBQUNJLFFBQVEsQ0FBQ1AsZ0JBQWdCLENBQUM7TUFDN0JBLGdCQUFnQixDQUFDRixNQUFNLENBQUMsQ0FBQyxDQUFDeEIsSUFBSSxDQUFDNkIsRUFBRSxDQUFDO0lBQ3BDO0lBQ0EsSUFBSSxDQUFDRixVQUFVLENBQUNPLEdBQUcsQ0FBQ0wsRUFBRSxDQUFDQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUU7TUFDbENILFVBQVUsQ0FBQ1EsR0FBRyxDQUFDTixFQUFFLENBQUNDLFFBQVEsQ0FBQyxDQUFDLENBQUM7TUFDN0JMLE1BQU0sQ0FBQ3pCLElBQUksQ0FBQzZCLEVBQUUsQ0FBQ0MsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUM1QjtFQUNGOztFQUVBO0VBQ0EsS0FBSyxJQUFJTSxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUdYLE1BQU0sQ0FBQzVGLE1BQU0sRUFBRXVHLENBQUMsRUFBRSxFQUFFWCxNQUFNLENBQUNXLENBQUMsQ0FBQyxHQUFHWCxNQUFNLENBQUNXLENBQUMsQ0FBQyxDQUFDaEcsTUFBTSxDQUFDLENBQUM7RUFDdEUsT0FBT3FGLE1BQU07QUFDZixDQUFDOztBQUVEbkksSUFBSSxDQUFDK0ksZ0JBQWdCLEdBQUcsZ0JBQWVwRixRQUFRLEVBQUVxRSxRQUFRLEVBQUVoQixLQUFLLEVBQUU7RUFDaEUsT0FBT2hILElBQUksQ0FBQ2tCLGNBQWMsQ0FBQ3lDLFFBQVEsQ0FBQyxDQUFDcUYsVUFBVSxDQUFDaEIsUUFBUSxFQUFFaEIsS0FBSyxDQUFDO0FBQ2xFLENBQUM7O0FBRURoSCxJQUFJLENBQUNpSixtQkFBbUIsR0FBRyxnQkFBZXRGLFFBQVEsRUFBRTZCLE1BQU0sRUFBRTBELFNBQVMsRUFBRTtFQUNyRSxPQUFPLENBQUMsTUFBTWxKLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQ3lDLFFBQVEsQ0FBQyxDQUFDd0YsYUFBYSxDQUFDM0QsTUFBTSxFQUFFMEQsU0FBUyxDQUFDLEVBQUVwRyxNQUFNLENBQUMsQ0FBQztBQUN4RixDQUFDOztBQUVEOUMsSUFBSSxDQUFDb0osb0JBQW9CLEdBQUcsZ0JBQWV6RixRQUFRLEVBQUUwRixXQUFXLEVBQUU7RUFDaEUsT0FBTyxDQUFDLE1BQU1ySixJQUFJLENBQUNrQixjQUFjLENBQUN5QyxRQUFRLENBQUMsQ0FBQzJGLGNBQWMsQ0FBQ0QsV0FBVyxDQUFDLEVBQUV2RyxNQUFNLENBQUMsQ0FBQztBQUNuRixDQUFDOztBQUVEOUMsSUFBSSxDQUFDdUosaUJBQWlCLEdBQUcsZ0JBQWU1RixRQUFRLEVBQUU2RixLQUFLLEVBQUVDLFVBQVUsRUFBRTtFQUNuRSxPQUFPLENBQUMsTUFBTXpKLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQ3lDLFFBQVEsQ0FBQyxDQUFDK0YsV0FBVyxDQUFDRixLQUFLLEVBQUVDLFVBQVUsQ0FBQyxFQUFFM0csTUFBTSxDQUFDLENBQUM7QUFDdEYsQ0FBQzs7QUFFRDlDLElBQUksQ0FBQzJKLG9CQUFvQixHQUFHLGdCQUFlaEcsUUFBUSxFQUFFcUUsUUFBUSxFQUFFO0VBQzdELE9BQU9oSSxJQUFJLENBQUNrQixjQUFjLENBQUN5QyxRQUFRLENBQUMsQ0FBQ2lHLGNBQWMsQ0FBQzVCLFFBQVEsQ0FBQztBQUMvRCxDQUFDOztBQUVEaEksSUFBSSxDQUFDNkosZUFBZSxHQUFHLGdCQUFlbEcsUUFBUSxFQUFFO0VBQzlDLElBQUlzRSxHQUFHLEdBQUcsTUFBTWpJLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQ3lDLFFBQVEsQ0FBQyxDQUFDbUcsU0FBUyxDQUFDLENBQUM7RUFDekQsSUFBSTVDLEtBQUssR0FBRyxJQUFJdUIsb0JBQVcsQ0FBQyxDQUFDLENBQUNDLE1BQU0sQ0FBQ1QsR0FBRyxDQUFDO0VBQ3pDLEtBQUssSUFBSU0sRUFBRSxJQUFJTixHQUFHLEVBQUVNLEVBQUUsQ0FBQ0ksUUFBUSxDQUFDekIsS0FBSyxDQUFDO0VBQ3RDLE9BQU9BLEtBQUssQ0FBQ3BFLE1BQU0sQ0FBQyxDQUFDO0FBQ3ZCLENBQUM7O0FBRUQ5QyxJQUFJLENBQUMrSixxQkFBcUIsR0FBRyxnQkFBZXBHLFFBQVEsRUFBRTtFQUNwRCxPQUFPM0QsSUFBSSxDQUFDa0IsY0FBYyxDQUFDeUMsUUFBUSxDQUFDLENBQUNxRyxlQUFlLENBQUMsQ0FBQztBQUN4RCxDQUFDOztBQUVEO0FBQ0E7QUFDQTs7QUFFQWhLLElBQUksQ0FBQ2lLLG9CQUFvQixHQUFHLGdCQUFldEcsUUFBUSxFQUFFO0VBQ25ELE9BQU8sQ0FBQyxNQUFNM0QsSUFBSSxDQUFDa0IsY0FBYyxDQUFDeUMsUUFBUSxDQUFDLENBQUN1RyxjQUFjLENBQUMsQ0FBQyxFQUFFcEgsTUFBTSxDQUFDLENBQUM7QUFDeEUsQ0FBQzs7QUFFRDlDLElBQUksQ0FBQ21LLGlCQUFpQixHQUFHLGdCQUFleEcsUUFBUSxFQUFFeUcsTUFBTSxFQUFFO0VBQ3hELE9BQU9wSyxJQUFJLENBQUNrQixjQUFjLENBQUN5QyxRQUFRLENBQUMsQ0FBQzBHLFdBQVcsQ0FBQ0QsTUFBTSxDQUFDO0FBQzFELENBQUM7O0FBRURwSyxJQUFJLENBQUNzSyw4QkFBOEIsR0FBRyxnQkFBZTNHLFFBQVEsRUFBRTRHLFNBQVMsRUFBRTtFQUN4RSxPQUFPdkssSUFBSSxDQUFDa0IsY0FBYyxDQUFDeUMsUUFBUSxDQUFDLENBQUM2Ryx3QkFBd0IsQ0FBQ0QsU0FBUyxDQUFDO0FBQzFFLENBQUM7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7O0FBRUF2SyxJQUFJLENBQUN5Syx3QkFBd0IsR0FBRyxnQkFBZTlHLFFBQVEsRUFBRStHLE9BQU8sRUFBRUMsUUFBUSxFQUFFQyxRQUFRLEVBQUVDLFVBQVUsRUFBRUMsWUFBWSxFQUFFO0VBQzlHLElBQUlDLFdBQVcsR0FBRyxFQUFFO0VBQ3BCLEtBQUssSUFBSUMsS0FBSyxJQUFJLE1BQU1oTCxJQUFJLENBQUNrQixjQUFjLENBQUN5QyxRQUFRLENBQUMsQ0FBQ3NILGtCQUFrQixDQUFDUCxPQUFPLEVBQUVDLFFBQVEsRUFBRUMsUUFBUSxFQUFFQyxVQUFVLEVBQUVDLFlBQVksQ0FBQyxFQUFFO0lBQy9IQyxXQUFXLENBQUNyRSxJQUFJLENBQUNzRSxLQUFLLENBQUNsSSxNQUFNLENBQUMsQ0FBQyxDQUFDO0VBQ2xDO0VBQ0EsT0FBT2lJLFdBQVc7QUFDcEIsQ0FBQzs7QUFFRDtBQUNBO0FBQ0E7QUFDQTs7QUFFQS9LLElBQUksQ0FBQ2tMLGFBQWEsR0FBRyxnQkFBZXZILFFBQVEsRUFBRTtFQUM1QyxPQUFPLENBQUMsTUFBTTNELElBQUksQ0FBQ2tCLGNBQWMsQ0FBQ3lDLFFBQVEsQ0FBQyxDQUFDd0gsT0FBTyxDQUFDLENBQUMsRUFBRXJJLE1BQU0sQ0FBQyxDQUFDO0FBQ2pFLENBQUM7O0FBRUQ5QyxJQUFJLENBQUNvTCxpQkFBaUIsR0FBRyxnQkFBZXpILFFBQVEsRUFBRTtFQUNoRCxPQUFPLENBQUMsTUFBTTNELElBQUksQ0FBQ2tCLGNBQWMsQ0FBQ3lDLFFBQVEsQ0FBQyxDQUFDMEgsV0FBVyxDQUFDLENBQUMsRUFBRXZJLE1BQU0sQ0FBQyxDQUFDO0FBQ3JFLENBQUM7O0FBRUQ5QyxJQUFJLENBQUNzTCxxQkFBcUIsR0FBRyxnQkFBZTNILFFBQVEsRUFBRTtFQUNwRCxPQUFPLENBQUMsTUFBTTNELElBQUksQ0FBQ2tCLGNBQWMsQ0FBQ3lDLFFBQVEsQ0FBQyxDQUFDNEgsZUFBZSxDQUFDLENBQUMsRUFBRXpJLE1BQU0sQ0FBQyxDQUFDO0FBQ3pFLENBQUM7O0FBRUQ5QyxJQUFJLENBQUN3TCxrQkFBa0IsR0FBRyxnQkFBZTdILFFBQVEsRUFBRTtFQUNqRCxJQUFJOEgsYUFBYSxHQUFHLEVBQUU7RUFDdEIsS0FBSyxJQUFJQyxRQUFRLElBQUksTUFBTTFMLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQ3lDLFFBQVEsQ0FBQyxDQUFDZ0ksWUFBWSxDQUFDLENBQUMsRUFBRUYsYUFBYSxDQUFDL0UsSUFBSSxDQUFDZ0YsUUFBUSxDQUFDNUksTUFBTSxDQUFDLENBQUMsQ0FBQztFQUM5RyxPQUFPMkksYUFBYTtBQUN0QixDQUFDOztBQUVEekwsSUFBSSxDQUFDNEwsdUJBQXVCLEdBQUcsZ0JBQWVqSSxRQUFRLEVBQUU7RUFDdEQsT0FBTzNELElBQUksQ0FBQ2tCLGNBQWMsQ0FBQ3lDLFFBQVEsQ0FBQyxDQUFDa0ksaUJBQWlCLENBQUMsQ0FBQztBQUMxRCxDQUFDOztBQUVEN0wsSUFBSSxDQUFDOEwsc0JBQXNCLEdBQUcsZ0JBQWVuSSxRQUFRLEVBQUU7RUFDckQsT0FBTzNELElBQUksQ0FBQ2tCLGNBQWMsQ0FBQ3lDLFFBQVEsQ0FBQyxDQUFDb0ksZ0JBQWdCLENBQUMsQ0FBQztBQUN6RCxDQUFDOztBQUVEL0wsSUFBSSxDQUFDZ00sc0JBQXNCLEdBQUcsZ0JBQWVySSxRQUFRLEVBQUVzSSxLQUFLLEVBQUU7RUFDNUQsT0FBT2pNLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQ3lDLFFBQVEsQ0FBQyxDQUFDdUksZ0JBQWdCLENBQUNELEtBQUssQ0FBQztBQUM5RCxDQUFDOztBQUVEak0sSUFBSSxDQUFDbU0sd0JBQXdCLEdBQUcsZ0JBQWV4SSxRQUFRLEVBQUU7RUFDdkQsT0FBTzNELElBQUksQ0FBQ2tCLGNBQWMsQ0FBQ3lDLFFBQVEsQ0FBQyxDQUFDeUksa0JBQWtCLENBQUMsQ0FBQztBQUMzRCxDQUFDOztBQUVEcE0sSUFBSSxDQUFDcU0sb0JBQW9CLEdBQUcsZ0JBQWUxSSxRQUFRLEVBQUU7RUFDbkQsT0FBTzNELElBQUksQ0FBQ2tCLGNBQWMsQ0FBQ3lDLFFBQVEsQ0FBQyxDQUFDMkksY0FBYyxDQUFDLENBQUM7QUFDdkQsQ0FBQzs7QUFFRHRNLElBQUksQ0FBQ3VNLG9CQUFvQixHQUFHLGdCQUFlNUksUUFBUSxFQUFFc0ksS0FBSyxFQUFFO0VBQzFELE9BQU9qTSxJQUFJLENBQUNrQixjQUFjLENBQUN5QyxRQUFRLENBQUMsQ0FBQzZJLGNBQWMsQ0FBQ1AsS0FBSyxDQUFDO0FBQzVELENBQUM7O0FBRURqTSxJQUFJLENBQUN5TSxzQkFBc0IsR0FBRyxnQkFBZTlJLFFBQVEsRUFBRTtFQUNyRCxPQUFPM0QsSUFBSSxDQUFDa0IsY0FBYyxDQUFDeUMsUUFBUSxDQUFDLENBQUMrSSxnQkFBZ0IsQ0FBQyxDQUFDO0FBQ3pELENBQUM7O0FBRUQxTSxJQUFJLENBQUMyTSxjQUFjLEdBQUcsZ0JBQWVoSixRQUFRLEVBQUU7RUFDN0MsSUFBSWlKLFNBQVMsR0FBRyxFQUFFO0VBQ2xCLEtBQUssSUFBSUMsSUFBSSxJQUFJLE1BQU03TSxJQUFJLENBQUNrQixjQUFjLENBQUN5QyxRQUFRLENBQUMsQ0FBQ21KLFFBQVEsQ0FBQyxDQUFDLEVBQUVGLFNBQVMsQ0FBQ2xHLElBQUksQ0FBQ21HLElBQUksQ0FBQy9KLE1BQU0sQ0FBQyxDQUFDLENBQUM7RUFDOUYsT0FBTzhKLFNBQVM7QUFDbEIsQ0FBQzs7QUFFRDVNLElBQUksQ0FBQytNLG1CQUFtQixHQUFHLGdCQUFlcEosUUFBUSxFQUFFO0VBQ2xELElBQUlpSixTQUFTLEdBQUcsRUFBRTtFQUNsQixLQUFLLElBQUlDLElBQUksSUFBSSxNQUFNN00sSUFBSSxDQUFDa0IsY0FBYyxDQUFDeUMsUUFBUSxDQUFDLENBQUNxSixhQUFhLENBQUMsQ0FBQyxFQUFFSixTQUFTLENBQUNsRyxJQUFJLENBQUNtRyxJQUFJLENBQUMvSixNQUFNLENBQUMsQ0FBQyxDQUFDO0VBQ25HLE9BQU84SixTQUFTO0FBQ2xCLENBQUM7O0FBRUQ1TSxJQUFJLENBQUNpTiwwQkFBMEIsR0FBRyxnQkFBZXRKLFFBQVEsRUFBRXNJLEtBQUssRUFBRTtFQUNoRSxPQUFPak0sSUFBSSxDQUFDa0IsY0FBYyxDQUFDeUMsUUFBUSxDQUFDLENBQUN1SixvQkFBb0IsQ0FBQ2pCLEtBQUssQ0FBQztBQUNsRSxDQUFDOztBQUVEak0sSUFBSSxDQUFDbU4sMEJBQTBCLEdBQUcsZ0JBQWV4SixRQUFRLEVBQUVzSSxLQUFLLEVBQUU7RUFDaEUsT0FBT2pNLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQ3lDLFFBQVEsQ0FBQyxDQUFDeUosb0JBQW9CLENBQUNuQixLQUFLLENBQUM7QUFDbEUsQ0FBQzs7QUFFRGpNLElBQUksQ0FBQ3FOLGlCQUFpQixHQUFHLGdCQUFlMUosUUFBUSxFQUFFO0VBQ2hELElBQUkySixRQUFRLEdBQUcsRUFBRTtFQUNqQixLQUFLLElBQUlDLEdBQUcsSUFBSSxNQUFNdk4sSUFBSSxDQUFDa0IsY0FBYyxDQUFDeUMsUUFBUSxDQUFDLENBQUM2SixXQUFXLENBQUMsQ0FBQyxFQUFFRixRQUFRLENBQUM1RyxJQUFJLENBQUM2RyxHQUFHLENBQUN6SyxNQUFNLENBQUMsQ0FBQyxDQUFDO0VBQzlGLE9BQU93SyxRQUFRO0FBQ2pCLENBQUM7O0FBRUR0TixJQUFJLENBQUN5TixpQkFBaUIsR0FBRyxnQkFBZTlKLFFBQVEsRUFBRTJKLFFBQVEsRUFBRTtFQUMxRCxJQUFJSSxJQUFJLEdBQUcsRUFBRTtFQUNiLEtBQUssSUFBSUMsT0FBTyxJQUFJTCxRQUFRLEVBQUVJLElBQUksQ0FBQ2hILElBQUksQ0FBQyxJQUFJa0gsa0JBQVMsQ0FBQ0QsT0FBTyxDQUFDLENBQUM7RUFDL0QsT0FBTzNOLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQ3lDLFFBQVEsQ0FBQyxDQUFDa0ssV0FBVyxDQUFDSCxJQUFJLENBQUM7QUFDeEQsQ0FBQzs7QUFFRDFOLElBQUksQ0FBQzhOLGlCQUFpQixHQUFHLGdCQUFlbkssUUFBUSxFQUFFWCxPQUFPLEVBQUUrSyxVQUFVLEVBQUVDLFlBQVksRUFBRUMsYUFBYSxFQUFFO0VBQ2xHLE9BQU9qTyxJQUFJLENBQUNrQixjQUFjLENBQUN5QyxRQUFRLENBQUMsQ0FBQ3VLLFdBQVcsQ0FBQ2xMLE9BQU8sRUFBRStLLFVBQVUsRUFBRUMsWUFBWSxFQUFFQyxhQUFhLENBQUM7QUFDcEcsQ0FBQzs7QUFFRGpPLElBQUksQ0FBQ21PLGdCQUFnQixHQUFHLGdCQUFleEssUUFBUSxFQUFFO0VBQy9DLE9BQU8zRCxJQUFJLENBQUNrQixjQUFjLENBQUN5QyxRQUFRLENBQUMsQ0FBQ3lLLFVBQVUsQ0FBQyxDQUFDO0FBQ25ELENBQUM7O0FBRURwTyxJQUFJLENBQUNxTyxxQkFBcUIsR0FBRyxnQkFBZTFLLFFBQVEsRUFBRTtFQUNwRCxPQUFPLENBQUMsTUFBTTNELElBQUksQ0FBQ2tCLGNBQWMsQ0FBQ3lDLFFBQVEsQ0FBQyxDQUFDMkssZUFBZSxDQUFDLENBQUMsRUFBRXhMLE1BQU0sQ0FBQyxDQUFDO0FBQ3pFLENBQUM7O0FBRUQ5QyxJQUFJLENBQUN1TyxxQkFBcUIsR0FBRyxnQkFBZTVLLFFBQVEsRUFBRTZLLEtBQUssRUFBRTtFQUMzRCxPQUFPLENBQUMsTUFBTXhPLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQ3lDLFFBQVEsQ0FBQyxDQUFDOEssZUFBZSxDQUFDRCxLQUFLLENBQUMsRUFBRTFMLE1BQU0sQ0FBQyxDQUFDO0FBQzlFLENBQUM7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOUMsSUFBSSxDQUFDME8sVUFBVSxHQUFHLGdCQUFlL0ssUUFBUSxFQUFFO0VBQ3pDLE9BQU8zRCxJQUFJLENBQUNrQixjQUFjLENBQUN5QyxRQUFRLENBQUMsQ0FBQ2dMLElBQUksQ0FBQyxDQUFDO0FBQzdDLENBQUM7O0FBRUQzTyxJQUFJLENBQUM0Tyw0QkFBNEIsR0FBRyxnQkFBZWpMLFFBQVEsRUFBRTtFQUMzRCxPQUFPLENBQUMsTUFBTTNELElBQUksQ0FBQ2tCLGNBQWMsQ0FBQ3lDLFFBQVEsQ0FBQyxDQUFDa0wsc0JBQXNCLENBQUMsQ0FBQyxFQUFFL0wsTUFBTSxDQUFDLENBQUM7QUFDaEYsQ0FBQzs7QUFFRDs7QUFFQTlDLElBQUksQ0FBQzhPLGNBQWMsR0FBRyxnQkFBZUMsUUFBUSxFQUFFQyxJQUFJLEVBQUVDLFFBQVEsRUFBRXZNLFdBQVcsRUFBRXdNLFFBQVEsRUFBRUMsU0FBUyxFQUFFQyxpQkFBaUIsRUFBRTtFQUNsSCxJQUFJQyxnQkFBZ0IsR0FBR0QsaUJBQWlCLEdBQUcsSUFBSUUsNEJBQW1CLENBQUNGLGlCQUFpQixDQUFDLEdBQUc1TSxTQUFTO0VBQ2pHeEMsSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLEdBQUcsTUFBTVEseUJBQWdCLENBQUNDLFVBQVUsQ0FBQyxFQUFDUixJQUFJLEVBQUUsRUFBRSxFQUFFQyxRQUFRLEVBQUVBLFFBQVEsRUFBRXZNLFdBQVcsRUFBRUEsV0FBVyxFQUFFd00sUUFBUSxFQUFFQSxRQUFRLEVBQUVDLFNBQVMsRUFBRUEsU0FBUyxFQUFFTSxNQUFNLEVBQUVKLGdCQUFnQixFQUFFMU4sYUFBYSxFQUFFLEtBQUssRUFBQyxDQUFDO0VBQ3JOM0IsSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUNXLGtCQUFrQixDQUFDVixJQUFJLENBQUM7QUFDeEQsQ0FBQzs7QUFFRGhQLElBQUksQ0FBQzJQLGdCQUFnQixHQUFHLGdCQUFlWixRQUFRLEVBQUVhLFVBQVUsRUFBRTtFQUMzRCxJQUFJckwsTUFBTSxHQUFHLElBQUlzTCwyQkFBa0IsQ0FBQ0QsVUFBVSxDQUFDO0VBQy9DckwsTUFBTSxDQUFDdUwsZ0JBQWdCLENBQUMsS0FBSyxDQUFDO0VBQzlCOVAsSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLEdBQUcsTUFBTWdCLGtDQUFnQixDQUFDQyxZQUFZLENBQUN6TCxNQUFNLENBQUM7QUFDN0UsQ0FBQzs7QUFFRHZFLElBQUksQ0FBQ2lRLGdCQUFnQixHQUFHLGdCQUFlbEIsUUFBUSxFQUFFYSxVQUFVLEVBQUU7RUFDM0QsSUFBSXJMLE1BQU0sR0FBRyxJQUFJc0wsMkJBQWtCLENBQUNELFVBQVUsQ0FBQztFQUMvQyxJQUFJWixJQUFJLEdBQUd6SyxNQUFNLENBQUMyTCxPQUFPLENBQUMsQ0FBQztFQUMzQjNMLE1BQU0sQ0FBQzRMLE9BQU8sQ0FBQyxFQUFFLENBQUM7RUFDbEI1TCxNQUFNLENBQUN1TCxnQkFBZ0IsQ0FBQyxLQUFLLENBQUM7RUFDOUI5UCxJQUFJLENBQUNrQixjQUFjLENBQUM2TixRQUFRLENBQUMsR0FBRyxNQUFNUSx5QkFBZ0IsQ0FBQ1MsWUFBWSxDQUFDekwsTUFBTSxDQUFDO0VBQzNFdkUsSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUNXLGtCQUFrQixDQUFDVixJQUFJLENBQUM7QUFDeEQsQ0FBQzs7QUFFRGhQLElBQUksQ0FBQ29RLFVBQVUsR0FBRyxnQkFBZXJCLFFBQVEsRUFBRTtFQUN6QyxPQUFPL08sSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUNxQixVQUFVLENBQUMsQ0FBQztBQUNuRCxDQUFDOztBQUVEcFEsSUFBSSxDQUFDcVEsY0FBYyxHQUFHLGdCQUFldEIsUUFBUSxFQUFFO0VBQzdDLE9BQU8vTyxJQUFJLENBQUNrQixjQUFjLENBQUM2TixRQUFRLENBQUMsQ0FBQ3NCLGNBQWMsQ0FBQyxDQUFDO0FBQ3ZELENBQUM7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7O0FBRUFyUSxJQUFJLENBQUNzUSxPQUFPLEdBQUcsZ0JBQWV2QixRQUFRLEVBQUU7RUFDdEMsT0FBTy9PLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDdUIsT0FBTyxDQUFDLENBQUM7QUFDaEQsQ0FBQzs7QUFFRHRRLElBQUksQ0FBQ3VRLGVBQWUsR0FBRyxnQkFBZXhCLFFBQVEsRUFBRTtFQUM5QyxPQUFPL08sSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUN3QixlQUFlLENBQUMsQ0FBQztBQUN4RCxDQUFDOztBQUVEdlEsSUFBSSxDQUFDd1EsZ0JBQWdCLEdBQUcsZ0JBQWV6QixRQUFRLEVBQUU7RUFDL0MsT0FBTy9PLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDeUIsZ0JBQWdCLENBQUMsQ0FBQztBQUN6RCxDQUFDOztBQUVEeFEsSUFBSSxDQUFDeVEsa0JBQWtCLEdBQUcsZ0JBQWUxQixRQUFRLEVBQUU7RUFDakQsT0FBTy9PLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDMEIsa0JBQWtCLENBQUMsQ0FBQztBQUMzRCxDQUFDOztBQUVEelEsSUFBSSxDQUFDMFEsaUJBQWlCLEdBQUcsZ0JBQWUzQixRQUFRLEVBQUU7RUFDaEQsT0FBTy9PLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDMkIsaUJBQWlCLENBQUMsQ0FBQztBQUMxRCxDQUFDOztBQUVEMVEsSUFBSSxDQUFDMlEsZ0JBQWdCLEdBQUcsZ0JBQWU1QixRQUFRLEVBQUU7RUFDL0MsT0FBTy9PLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDNEIsZ0JBQWdCLENBQUMsQ0FBQztBQUN6RCxDQUFDOztBQUVEM1EsSUFBSSxDQUFDNFEsaUJBQWlCLEdBQUcsZ0JBQWU3QixRQUFRLEVBQUU7RUFDaEQsT0FBTy9PLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDNkIsaUJBQWlCLENBQUMsQ0FBQztBQUMxRCxDQUFDOztBQUVENVEsSUFBSSxDQUFDNlEsVUFBVSxHQUFHLGdCQUFlOUIsUUFBUSxFQUFFK0IsVUFBVSxFQUFFQyxhQUFhLEVBQUU7RUFDcEUsT0FBTy9RLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDOEIsVUFBVSxDQUFDQyxVQUFVLEVBQUVDLGFBQWEsQ0FBQztBQUM1RSxDQUFDOztBQUVEL1EsSUFBSSxDQUFDZ1IsZUFBZSxHQUFHLGdCQUFlakMsUUFBUSxFQUFFL0wsT0FBTyxFQUFFO0VBQ3ZELE9BQU8sQ0FBQyxNQUFNaEQsSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUNpQyxlQUFlLENBQUNoTyxPQUFPLENBQUMsRUFBRUYsTUFBTSxDQUFDLENBQUM7QUFDaEYsQ0FBQzs7QUFFRDlDLElBQUksQ0FBQ2lSLGtCQUFrQixHQUFHLGdCQUFlbEMsUUFBUSxFQUFFK0IsVUFBVSxFQUFFQyxhQUFhLEVBQUVHLEtBQUssRUFBRTtFQUNuRixNQUFNbFIsSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUNrQyxrQkFBa0IsQ0FBQ0gsVUFBVSxFQUFFQyxhQUFhLEVBQUVHLEtBQUssQ0FBQztBQUMxRixDQUFDOztBQUVEbFIsSUFBSSxDQUFDNkMsb0JBQW9CLEdBQUcsZ0JBQWVrTSxRQUFRLEVBQUVwTSxlQUFlLEVBQUVDLFNBQVMsRUFBRTtFQUMvRSxPQUFPLENBQUMsTUFBTTVDLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDbE0sb0JBQW9CLENBQUNGLGVBQWUsRUFBRUMsU0FBUyxDQUFDLEVBQUVFLE1BQU0sQ0FBQyxDQUFDO0FBQ3hHLENBQUM7O0FBRUQ5QyxJQUFJLENBQUNtUix1QkFBdUIsR0FBRyxnQkFBZXBDLFFBQVEsRUFBRXFDLGlCQUFpQixFQUFFO0VBQ3pFLE9BQU8sQ0FBQyxNQUFNcFIsSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUNvQyx1QkFBdUIsQ0FBQ0MsaUJBQWlCLENBQUMsRUFBRXRPLE1BQU0sQ0FBQyxDQUFDO0FBQ2xHLENBQUM7O0FBRUQ5QyxJQUFJLENBQUNxUixtQkFBbUIsR0FBRyxnQkFBZXRDLFFBQVEsRUFBRXhLLE1BQU0sRUFBRTtFQUMxRCxPQUFPdkUsSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUNzQyxtQkFBbUIsQ0FBQzlNLE1BQU0sR0FBRyxJQUFJK0ssNEJBQW1CLENBQUM3TixNQUFNLENBQUNDLE1BQU0sQ0FBQzZDLE1BQU0sRUFBRSxFQUFDNUMsYUFBYSxFQUFFLEtBQUssRUFBQyxDQUFDLENBQUMsR0FBR2EsU0FBUyxDQUFDO0FBQ3ZKLENBQUM7O0FBRUR4QyxJQUFJLENBQUNzUixtQkFBbUIsR0FBRyxnQkFBZXZDLFFBQVEsRUFBRTtFQUNsRCxJQUFJbkssVUFBVSxHQUFHLE1BQU01RSxJQUFJLENBQUNrQixjQUFjLENBQUM2TixRQUFRLENBQUMsQ0FBQ3VDLG1CQUFtQixDQUFDLENBQUM7RUFDMUUsT0FBTzFNLFVBQVUsR0FBR0EsVUFBVSxDQUFDRSxTQUFTLENBQUMsQ0FBQyxHQUFHdEMsU0FBUztBQUN4RCxDQUFDOztBQUVEeEMsSUFBSSxDQUFDdVIsbUJBQW1CLEdBQUcsZ0JBQWV4QyxRQUFRLEVBQUU7RUFDbEQsT0FBTy9PLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDd0MsbUJBQW1CLENBQUMsQ0FBQztBQUM1RCxDQUFDOztBQUVEdlIsSUFBSSxDQUFDd1IsZ0JBQWdCLEdBQUcsZ0JBQWV6QyxRQUFRLEVBQUU7RUFDL0MsT0FBTy9PLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDeUMsZ0JBQWdCLENBQUMsQ0FBQztBQUN6RCxDQUFDOztBQUVEeFIsSUFBSSxDQUFDeVIsZ0JBQWdCLEdBQUcsZ0JBQWUxQyxRQUFRLEVBQUUyQyxhQUFhLEVBQUU7RUFDOUQsT0FBTzFSLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDMEMsZ0JBQWdCLENBQUNDLGFBQWEsQ0FBQztBQUN0RSxDQUFDOztBQUVEMVIsSUFBSSxDQUFDMlIsZUFBZSxHQUFHLGdCQUFlNUMsUUFBUSxFQUFFO0VBQzlDLE9BQU8vTyxJQUFJLENBQUNrQixjQUFjLENBQUM2TixRQUFRLENBQUMsQ0FBQzRDLGVBQWUsQ0FBQyxDQUFDO0FBQ3hELENBQUM7O0FBRUQzUixJQUFJLENBQUM0UixzQkFBc0IsR0FBRyxnQkFBZTdDLFFBQVEsRUFBRTtFQUNyRCxPQUFPL08sSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUM2QyxzQkFBc0IsQ0FBQyxDQUFDO0FBQy9ELENBQUM7O0FBRUQ1UixJQUFJLENBQUM2UixlQUFlLEdBQUcsZ0JBQWU5QyxRQUFRLEVBQUUrQyxJQUFJLEVBQUVDLEtBQUssRUFBRUMsR0FBRyxFQUFFO0VBQ2hFLE9BQU9oUyxJQUFJLENBQUNrQixjQUFjLENBQUM2TixRQUFRLENBQUMsQ0FBQzhDLGVBQWUsQ0FBQ0MsSUFBSSxFQUFFQyxLQUFLLEVBQUVDLEdBQUcsQ0FBQztBQUN4RSxDQUFDOztBQUVEaFMsSUFBSSxDQUFDaVMsY0FBYyxHQUFHLGdCQUFlbEQsUUFBUSxFQUFFO0VBQzdDLE9BQU8vTyxJQUFJLENBQUNrQixjQUFjLENBQUM2TixRQUFRLENBQUMsQ0FBQ2tELGNBQWMsQ0FBQyxDQUFDO0FBQ3ZELENBQUM7O0FBRURqUyxJQUFJLENBQUNzRixTQUFTLEdBQUcsZ0JBQWV5SixRQUFRLEVBQUU7RUFDeEMsT0FBTy9PLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDekosU0FBUyxDQUFDLENBQUM7QUFDbEQsQ0FBQzs7QUFFRHRGLElBQUksQ0FBQ2tFLFdBQVcsR0FBRyxnQkFBZTZLLFFBQVEsRUFBRW5MLFVBQVUsRUFBRTs7RUFFdEQ7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxNQUFNc08sMEJBQTBCLFNBQVNDLDZCQUFvQixDQUFDOzs7Ozs7SUFNNURDLFdBQVdBLENBQUNyRCxRQUFRLEVBQUVzRCxFQUFFLEVBQUVDLE1BQU0sRUFBRTtNQUNoQyxLQUFLLENBQUMsQ0FBQztNQUNQLElBQUksQ0FBQ3ZELFFBQVEsR0FBR0EsUUFBUTtNQUN4QixJQUFJLENBQUNzRCxFQUFFLEdBQUdBLEVBQUU7TUFDWixJQUFJLENBQUNDLE1BQU0sR0FBR0EsTUFBTTtJQUN0Qjs7SUFFQUMsS0FBS0EsQ0FBQSxFQUFHO01BQ04sT0FBTyxJQUFJLENBQUNGLEVBQUU7SUFDaEI7O0lBRUEsTUFBTUcsY0FBY0EsQ0FBQ2hOLE1BQU0sRUFBRWMsV0FBVyxFQUFFQyxTQUFTLEVBQUVrTSxXQUFXLEVBQUV4USxPQUFPLEVBQUU7TUFDekUsSUFBSSxDQUFDcVEsTUFBTSxDQUFDM1IsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDb08sUUFBUSxFQUFFLGlCQUFpQixHQUFHLElBQUksQ0FBQ3dELEtBQUssQ0FBQyxDQUFDLEVBQUUvTSxNQUFNLEVBQUVjLFdBQVcsRUFBRUMsU0FBUyxFQUFFa00sV0FBVyxFQUFFeFEsT0FBTyxDQUFDLENBQUM7SUFDbEk7O0lBRUEsTUFBTXlRLFVBQVVBLENBQUNsTixNQUFNLEVBQUU7TUFDdkIsSUFBSSxDQUFDOE0sTUFBTSxDQUFDM1IsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDb08sUUFBUSxFQUFFLGFBQWEsR0FBRyxJQUFJLENBQUN3RCxLQUFLLENBQUMsQ0FBQyxFQUFFL00sTUFBTSxDQUFDLENBQUM7SUFDaEY7O0lBRUEsTUFBTW1OLGlCQUFpQkEsQ0FBQ0MsVUFBVSxFQUFFQyxrQkFBa0IsRUFBRTtNQUN0RCxJQUFJLENBQUNQLE1BQU0sQ0FBQzNSLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQ29PLFFBQVEsRUFBRSxvQkFBb0IsR0FBRyxJQUFJLENBQUN3RCxLQUFLLENBQUMsQ0FBQyxFQUFFSyxVQUFVLENBQUNFLFFBQVEsQ0FBQyxDQUFDLEVBQUVELGtCQUFrQixDQUFDQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDckk7O0lBRUQsTUFBTUMsZ0JBQWdCQSxDQUFDQyxNQUFNLEVBQUU7TUFDNUIsSUFBSTlMLEtBQUssR0FBRzhMLE1BQU0sQ0FBQ0MsS0FBSyxDQUFDLENBQUMsQ0FBQ3pLLFFBQVEsQ0FBQyxDQUFDO01BQ3JDLElBQUl0QixLQUFLLEtBQUsxRSxTQUFTLEVBQUUwRSxLQUFLLEdBQUcsSUFBSXVCLG9CQUFXLENBQUMsQ0FBQyxDQUFDQyxNQUFNLENBQUMsQ0FBQ3NLLE1BQU0sQ0FBQ0MsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQzNFLElBQUksQ0FBQ1gsTUFBTSxDQUFDM1IsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDb08sUUFBUSxFQUFFLG1CQUFtQixHQUFHLElBQUksQ0FBQ3dELEtBQUssQ0FBQyxDQUFDLEVBQUVyTCxLQUFLLENBQUNwRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFFO0lBQ2pHOztJQUVBLE1BQU1vUSxhQUFhQSxDQUFDRixNQUFNLEVBQUU7TUFDMUIsSUFBSTlMLEtBQUssR0FBRzhMLE1BQU0sQ0FBQ0MsS0FBSyxDQUFDLENBQUMsQ0FBQ3pLLFFBQVEsQ0FBQyxDQUFDO01BQ3JDLElBQUl0QixLQUFLLEtBQUsxRSxTQUFTLEVBQUUwRSxLQUFLLEdBQUcsSUFBSXVCLG9CQUFXLENBQUMsQ0FBQyxDQUFDQyxNQUFNLENBQUMsQ0FBQ3NLLE1BQU0sQ0FBQ0MsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQzNFLElBQUksQ0FBQ1gsTUFBTSxDQUFDM1IsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDb08sUUFBUSxFQUFFLGdCQUFnQixHQUFHLElBQUksQ0FBQ3dELEtBQUssQ0FBQyxDQUFDLEVBQUVyTCxLQUFLLENBQUNwRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFLO0lBQ2pHO0VBQ0Y7O0VBRUEsSUFBSWUsUUFBUSxHQUFHLElBQUlxTywwQkFBMEIsQ0FBQ25ELFFBQVEsRUFBRW5MLFVBQVUsRUFBRTVELElBQUksQ0FBQztFQUN6RSxJQUFJLENBQUNBLElBQUksQ0FBQ21ULFNBQVMsRUFBRW5ULElBQUksQ0FBQ21ULFNBQVMsR0FBRyxFQUFFO0VBQ3hDblQsSUFBSSxDQUFDbVQsU0FBUyxDQUFDek0sSUFBSSxDQUFDN0MsUUFBUSxDQUFDO0VBQzdCLE1BQU03RCxJQUFJLENBQUNrQixjQUFjLENBQUM2TixRQUFRLENBQUMsQ0FBQzdLLFdBQVcsQ0FBQ0wsUUFBUSxDQUFDO0FBQzNELENBQUM7O0FBRUQ3RCxJQUFJLENBQUNxRSxjQUFjLEdBQUcsZ0JBQWUwSyxRQUFRLEVBQUVuTCxVQUFVLEVBQUU7RUFDekQsS0FBSyxJQUFJa0YsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHOUksSUFBSSxDQUFDbVQsU0FBUyxDQUFDNVEsTUFBTSxFQUFFdUcsQ0FBQyxFQUFFLEVBQUU7SUFDOUMsSUFBSTlJLElBQUksQ0FBQ21ULFNBQVMsQ0FBQ3JLLENBQUMsQ0FBQyxDQUFDeUosS0FBSyxDQUFDLENBQUMsS0FBSzNPLFVBQVUsRUFBRTtJQUM5QyxNQUFNNUQsSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUMxSyxjQUFjLENBQUNyRSxJQUFJLENBQUNtVCxTQUFTLENBQUNySyxDQUFDLENBQUMsQ0FBQztJQUNyRTlJLElBQUksQ0FBQ21ULFNBQVMsQ0FBQ3pTLE1BQU0sQ0FBQ29JLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDM0I7RUFDRjtFQUNBLE1BQU0sSUFBSTFFLG9CQUFXLENBQUMsd0NBQXdDLENBQUM7QUFDakUsQ0FBQzs7QUFFRHBFLElBQUksQ0FBQ29ULFFBQVEsR0FBRyxnQkFBZXJFLFFBQVEsRUFBRTtFQUN2QyxPQUFPL08sSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUNxRSxRQUFRLENBQUMsQ0FBQztBQUNqRCxDQUFDOztBQUVEcFQsSUFBSSxDQUFDcVQsSUFBSSxHQUFHLGdCQUFldEUsUUFBUSxFQUFFekksV0FBVyxFQUFFZ04sb0JBQW9CLEVBQUU7RUFDdEUsT0FBUSxNQUFNdFQsSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUNzRSxJQUFJLENBQUM3USxTQUFTLEVBQUU4RCxXQUFXLEVBQUVnTixvQkFBb0IsQ0FBQztBQUNoRyxDQUFDOztBQUVEdFQsSUFBSSxDQUFDdVQsWUFBWSxHQUFHLGdCQUFleEUsUUFBUSxFQUFFeUUsY0FBYyxFQUFFO0VBQzNELE9BQU94VCxJQUFJLENBQUNrQixjQUFjLENBQUM2TixRQUFRLENBQUMsQ0FBQ3dFLFlBQVksQ0FBQ0MsY0FBYyxDQUFDO0FBQ25FLENBQUM7O0FBRUR4VCxJQUFJLENBQUN5VCxXQUFXLEdBQUcsZ0JBQWUxRSxRQUFRLEVBQUU7RUFDMUMsT0FBTy9PLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDMEUsV0FBVyxDQUFDLENBQUM7QUFDcEQsQ0FBQzs7QUFFRHpULElBQUksQ0FBQzBULE9BQU8sR0FBRyxnQkFBZTNFLFFBQVEsRUFBRS9HLFFBQVEsRUFBRTtFQUNoRCxPQUFPaEksSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUMyRSxPQUFPLENBQUMxTCxRQUFRLENBQUM7QUFDeEQsQ0FBQzs7QUFFRGhJLElBQUksQ0FBQzJULFdBQVcsR0FBRyxnQkFBZTVFLFFBQVEsRUFBRTtFQUMxQyxPQUFPL08sSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUM0RSxXQUFXLENBQUMsQ0FBQztBQUNwRCxDQUFDOztBQUVEM1QsSUFBSSxDQUFDNFQsZ0JBQWdCLEdBQUcsZ0JBQWU3RSxRQUFRLEVBQUU7RUFDL0MsT0FBTy9PLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDNkUsZ0JBQWdCLENBQUMsQ0FBQztBQUN6RCxDQUFDOztBQUVENVQsSUFBSSxDQUFDNlQsVUFBVSxHQUFHLGdCQUFlOUUsUUFBUSxFQUFFK0IsVUFBVSxFQUFFQyxhQUFhLEVBQUU7RUFDcEUsT0FBTyxDQUFDLE1BQU0vUSxJQUFJLENBQUNrQixjQUFjLENBQUM2TixRQUFRLENBQUMsQ0FBQzhFLFVBQVUsQ0FBQy9DLFVBQVUsRUFBRUMsYUFBYSxDQUFDLEVBQUUrQixRQUFRLENBQUMsQ0FBQztBQUMvRixDQUFDOztBQUVEOVMsSUFBSSxDQUFDOFQsa0JBQWtCLEdBQUcsZ0JBQWUvRSxRQUFRLEVBQUUrQixVQUFVLEVBQUVDLGFBQWEsRUFBRTtFQUM1RSxPQUFPLENBQUMsTUFBTS9RLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDK0Usa0JBQWtCLENBQUNoRCxVQUFVLEVBQUVDLGFBQWEsQ0FBQyxFQUFFK0IsUUFBUSxDQUFDLENBQUM7QUFDdkcsQ0FBQzs7QUFFRDlTLElBQUksQ0FBQytULFdBQVcsR0FBRyxnQkFBZWhGLFFBQVEsRUFBRWlGLG1CQUFtQixFQUFFQyxHQUFHLEVBQUU7RUFDcEUsSUFBSUMsWUFBWSxHQUFHLEVBQUU7RUFDckIsS0FBSyxJQUFJQyxPQUFPLElBQUksTUFBTW5VLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDZ0YsV0FBVyxDQUFDQyxtQkFBbUIsRUFBRUMsR0FBRyxDQUFDLEVBQUVDLFlBQVksQ0FBQ3hOLElBQUksQ0FBQ3lOLE9BQU8sQ0FBQ3JSLE1BQU0sQ0FBQyxDQUFDLENBQUM7RUFDbEksT0FBT29SLFlBQVk7QUFDckIsQ0FBQzs7QUFFRGxVLElBQUksQ0FBQ29VLFVBQVUsR0FBRyxnQkFBZXJGLFFBQVEsRUFBRStCLFVBQVUsRUFBRWtELG1CQUFtQixFQUFFO0VBQzFFLE9BQU8sQ0FBQyxNQUFNaFUsSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUNxRixVQUFVLENBQUN0RCxVQUFVLEVBQUVrRCxtQkFBbUIsQ0FBQyxFQUFFbFIsTUFBTSxDQUFDLENBQUM7QUFDbkcsQ0FBQzs7QUFFRDlDLElBQUksQ0FBQ3FVLGFBQWEsR0FBRyxnQkFBZXRGLFFBQVEsRUFBRW1DLEtBQUssRUFBRTtFQUNuRCxPQUFPLENBQUMsTUFBTWxSLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDc0YsYUFBYSxDQUFDbkQsS0FBSyxDQUFDLEVBQUVwTyxNQUFNLENBQUMsQ0FBQztBQUM1RSxDQUFDOztBQUVEOUMsSUFBSSxDQUFDc1UsZUFBZSxHQUFHLGdCQUFldkYsUUFBUSxFQUFFK0IsVUFBVSxFQUFFeUQsaUJBQWlCLEVBQUU7RUFDN0UsSUFBSUMsZUFBZSxHQUFHLEVBQUU7RUFDeEIsS0FBSyxJQUFJQyxVQUFVLElBQUksTUFBTXpVLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDdUYsZUFBZSxDQUFDeEQsVUFBVSxFQUFFeUQsaUJBQWlCLENBQUMsRUFBRUMsZUFBZSxDQUFDOU4sSUFBSSxDQUFDK04sVUFBVSxDQUFDM1IsTUFBTSxDQUFDLENBQUMsQ0FBQztFQUNwSixPQUFPMFIsZUFBZTtBQUN4QixDQUFDOztBQUVEeFUsSUFBSSxDQUFDMFUsZ0JBQWdCLEdBQUcsZ0JBQWUzRixRQUFRLEVBQUUrQixVQUFVLEVBQUVJLEtBQUssRUFBRTtFQUNsRSxPQUFPLENBQUMsTUFBTWxSLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDMkYsZ0JBQWdCLENBQUM1RCxVQUFVLEVBQUVJLEtBQUssQ0FBQyxFQUFFcE8sTUFBTSxDQUFDLENBQUM7QUFDM0YsQ0FBQzs7QUFFRDtBQUNBOUMsSUFBSSxDQUFDa0ksTUFBTSxHQUFHLGdCQUFlNkcsUUFBUSxFQUFFNEYsY0FBYyxFQUFFOztFQUVyRDtFQUNBLElBQUlDLEtBQUssR0FBRyxJQUFJbk0sb0JBQVcsQ0FBQ2tNLGNBQWMsRUFBRWxNLG9CQUFXLENBQUNvTSxtQkFBbUIsQ0FBQ0MsUUFBUSxDQUFDLENBQUM1TSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7RUFFakc7RUFDQSxJQUFJRCxHQUFHLEdBQUcsTUFBTWpJLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDN0csTUFBTSxDQUFDME0sS0FBSyxDQUFDOztFQUUzRDtFQUNBLElBQUl2TSxVQUFVLEdBQUcsSUFBSUMsR0FBRyxDQUFDLENBQUM7RUFDMUIsSUFBSUYsZ0JBQWdCLEdBQUc1RixTQUFTO0VBQ2hDLElBQUkyRixNQUFNLEdBQUcsRUFBRTtFQUNmLEtBQUssSUFBSUksRUFBRSxJQUFJTixHQUFHLEVBQUU7SUFDbEIsSUFBSSxDQUFDTSxFQUFFLENBQUNDLFFBQVEsQ0FBQyxDQUFDLEVBQUU7TUFDbEIsSUFBSSxDQUFDSixnQkFBZ0IsRUFBRUEsZ0JBQWdCLEdBQUcsSUFBSUssb0JBQVcsQ0FBQyxDQUFDLENBQUNDLE1BQU0sQ0FBQyxFQUFFLENBQUM7TUFDdEVILEVBQUUsQ0FBQ0ksUUFBUSxDQUFDUCxnQkFBZ0IsQ0FBQztNQUM3QkEsZ0JBQWdCLENBQUNGLE1BQU0sQ0FBQyxDQUFDLENBQUN4QixJQUFJLENBQUM2QixFQUFFLENBQUM7SUFDcEM7SUFDQSxJQUFJLENBQUNGLFVBQVUsQ0FBQ08sR0FBRyxDQUFDTCxFQUFFLENBQUNDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRTtNQUNsQ0gsVUFBVSxDQUFDUSxHQUFHLENBQUNOLEVBQUUsQ0FBQ0MsUUFBUSxDQUFDLENBQUMsQ0FBQztNQUM3QkwsTUFBTSxDQUFDekIsSUFBSSxDQUFDNkIsRUFBRSxDQUFDQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQzVCO0VBQ0Y7O0VBRUE7RUFDQSxLQUFLLElBQUlNLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR1gsTUFBTSxDQUFDNUYsTUFBTSxFQUFFdUcsQ0FBQyxFQUFFLEVBQUVYLE1BQU0sQ0FBQ1csQ0FBQyxDQUFDLEdBQUdYLE1BQU0sQ0FBQ1csQ0FBQyxDQUFDLENBQUNoRyxNQUFNLENBQUMsQ0FBQztFQUN0RSxPQUFPLEVBQUNxRixNQUFNLEVBQUVBLE1BQU0sRUFBQztBQUN6QixDQUFDOztBQUVEbkksSUFBSSxDQUFDK1UsWUFBWSxHQUFHLGdCQUFlaEcsUUFBUSxFQUFFNEYsY0FBYyxFQUFFOztFQUUzRDtFQUNBLElBQUlDLEtBQUssR0FBSSxJQUFJbk0sb0JBQVcsQ0FBQ2tNLGNBQWMsRUFBRWxNLG9CQUFXLENBQUNvTSxtQkFBbUIsQ0FBQ0MsUUFBUSxDQUFDLENBQUM1TSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFtQjhNLGdCQUFnQixDQUFDLENBQUM7O0VBRXZJO0VBQ0EsSUFBSUMsU0FBUyxHQUFHLE1BQU1qVixJQUFJLENBQUNrQixjQUFjLENBQUM2TixRQUFRLENBQUMsQ0FBQ2dHLFlBQVksQ0FBQ0gsS0FBSyxDQUFDOztFQUV2RTtFQUNBLElBQUl4TSxnQkFBZ0IsR0FBRzVGLFNBQVM7RUFDaEMsSUFBSTJGLE1BQU0sR0FBRyxFQUFFO0VBQ2YsSUFBSUUsVUFBVSxHQUFHLElBQUlDLEdBQUcsQ0FBQyxDQUFDO0VBQzFCLEtBQUssSUFBSTRNLFFBQVEsSUFBSUQsU0FBUyxFQUFFO0lBQzlCLElBQUkxTSxFQUFFLEdBQUcyTSxRQUFRLENBQUNqQyxLQUFLLENBQUMsQ0FBQztJQUN6QixJQUFJLENBQUMxSyxFQUFFLENBQUNDLFFBQVEsQ0FBQyxDQUFDLEVBQUU7TUFDbEIsSUFBSSxDQUFDSixnQkFBZ0IsRUFBRUEsZ0JBQWdCLEdBQUcsSUFBSUssb0JBQVcsQ0FBQyxDQUFDLENBQUNDLE1BQU0sQ0FBQyxFQUFFLENBQUM7TUFDdEVILEVBQUUsQ0FBQ0ksUUFBUSxDQUFDUCxnQkFBZ0IsQ0FBQztNQUM3QkEsZ0JBQWdCLENBQUNGLE1BQU0sQ0FBQyxDQUFDLENBQUN4QixJQUFJLENBQUM2QixFQUFFLENBQUM7SUFDcEM7SUFDQSxJQUFJLENBQUNGLFVBQVUsQ0FBQ08sR0FBRyxDQUFDTCxFQUFFLENBQUNDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRTtNQUNsQ0gsVUFBVSxDQUFDUSxHQUFHLENBQUNOLEVBQUUsQ0FBQ0MsUUFBUSxDQUFDLENBQUMsQ0FBQztNQUM3QkwsTUFBTSxDQUFDekIsSUFBSSxDQUFDNkIsRUFBRSxDQUFDQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQzVCO0VBQ0Y7O0VBRUE7RUFDQSxLQUFLLElBQUlNLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR1gsTUFBTSxDQUFDNUYsTUFBTSxFQUFFdUcsQ0FBQyxFQUFFLEVBQUVYLE1BQU0sQ0FBQ1csQ0FBQyxDQUFDLEdBQUdYLE1BQU0sQ0FBQ1csQ0FBQyxDQUFDLENBQUNoRyxNQUFNLENBQUMsQ0FBQztFQUN0RSxPQUFPcUYsTUFBTTtBQUNmLENBQUM7O0FBRURuSSxJQUFJLENBQUNtVixVQUFVLEdBQUcsZ0JBQWVwRyxRQUFRLEVBQUU0RixjQUFjLEVBQUU7O0VBRXpEO0VBQ0EsSUFBSUMsS0FBSyxHQUFJLElBQUluTSxvQkFBVyxDQUFDa00sY0FBYyxFQUFFbE0sb0JBQVcsQ0FBQ29NLG1CQUFtQixDQUFDQyxRQUFRLENBQUMsQ0FBQzVNLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQW1Ca04sY0FBYyxDQUFDLENBQUM7O0VBRXJJO0VBQ0EsSUFBSUMsT0FBTyxHQUFHLE1BQU1yVixJQUFJLENBQUNrQixjQUFjLENBQUM2TixRQUFRLENBQUMsQ0FBQ29HLFVBQVUsQ0FBQ1AsS0FBSyxDQUFDOztFQUVuRTtFQUNBLElBQUl4TSxnQkFBZ0IsR0FBRzVGLFNBQVM7RUFDaEMsSUFBSTJGLE1BQU0sR0FBRyxFQUFFO0VBQ2YsSUFBSUUsVUFBVSxHQUFHLElBQUlDLEdBQUcsQ0FBQyxDQUFDO0VBQzFCLEtBQUssSUFBSTBLLE1BQU0sSUFBSXFDLE9BQU8sRUFBRTtJQUMxQixJQUFJOU0sRUFBRSxHQUFHeUssTUFBTSxDQUFDQyxLQUFLLENBQUMsQ0FBQztJQUN2QixJQUFJLENBQUMxSyxFQUFFLENBQUNDLFFBQVEsQ0FBQyxDQUFDLEVBQUU7TUFDbEIsSUFBSSxDQUFDSixnQkFBZ0IsRUFBRUEsZ0JBQWdCLEdBQUcsSUFBSUssb0JBQVcsQ0FBQyxDQUFDLENBQUNDLE1BQU0sQ0FBQyxFQUFFLENBQUM7TUFDdEVILEVBQUUsQ0FBQ0ksUUFBUSxDQUFDUCxnQkFBZ0IsQ0FBQztNQUM3QkEsZ0JBQWdCLENBQUNGLE1BQU0sQ0FBQyxDQUFDLENBQUN4QixJQUFJLENBQUM2QixFQUFFLENBQUM7SUFDcEM7SUFDQSxJQUFJLENBQUNGLFVBQVUsQ0FBQ08sR0FBRyxDQUFDTCxFQUFFLENBQUNDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRTtNQUNsQ0gsVUFBVSxDQUFDUSxHQUFHLENBQUNOLEVBQUUsQ0FBQ0MsUUFBUSxDQUFDLENBQUMsQ0FBQztNQUM3QkwsTUFBTSxDQUFDekIsSUFBSSxDQUFDNkIsRUFBRSxDQUFDQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0lBQzVCO0VBQ0Y7O0VBRUE7RUFDQSxLQUFLLElBQUlNLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR1gsTUFBTSxDQUFDNUYsTUFBTSxFQUFFdUcsQ0FBQyxFQUFFLEVBQUVYLE1BQU0sQ0FBQ1csQ0FBQyxDQUFDLEdBQUdYLE1BQU0sQ0FBQ1csQ0FBQyxDQUFDLENBQUNoRyxNQUFNLENBQUMsQ0FBQztFQUN0RSxPQUFPcUYsTUFBTTtBQUNmLENBQUM7O0FBRURuSSxJQUFJLENBQUNzVixhQUFhLEdBQUcsZ0JBQWV2RyxRQUFRLEVBQUV3RyxHQUFHLEVBQUU7RUFDakQsT0FBT3ZWLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDdUcsYUFBYSxDQUFDQyxHQUFHLENBQUM7QUFDekQsQ0FBQzs7QUFFRHZWLElBQUksQ0FBQ3dWLGFBQWEsR0FBRyxnQkFBZXpHLFFBQVEsRUFBRTBHLFVBQVUsRUFBRTtFQUN4RCxPQUFPelYsSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUN5RyxhQUFhLENBQUNDLFVBQVUsQ0FBQztBQUNoRSxDQUFDOztBQUVEelYsSUFBSSxDQUFDMFYsWUFBWSxHQUFHLGdCQUFlM0csUUFBUSxFQUFFd0csR0FBRyxFQUFFO0VBQ2hELElBQUlJLGFBQWEsR0FBRyxFQUFFO0VBQ3RCLEtBQUssSUFBSUMsUUFBUSxJQUFJLE1BQU01VixJQUFJLENBQUNrQixjQUFjLENBQUM2TixRQUFRLENBQUMsQ0FBQzhHLGVBQWUsQ0FBQ04sR0FBRyxDQUFDLEVBQUVJLGFBQWEsQ0FBQ2pQLElBQUksQ0FBQ2tQLFFBQVEsQ0FBQzlTLE1BQU0sQ0FBQyxDQUFDLENBQUM7RUFDcEgsT0FBTzZTLGFBQWE7QUFDdEIsQ0FBQzs7QUFFRDNWLElBQUksQ0FBQzhWLGVBQWUsR0FBRyxnQkFBZS9HLFFBQVEsRUFBRTRHLGFBQWEsRUFBRTtFQUM3RCxJQUFJcEwsU0FBUyxHQUFHLEVBQUU7RUFDbEIsS0FBSyxJQUFJd0wsWUFBWSxJQUFJSixhQUFhLEVBQUVwTCxTQUFTLENBQUM3RCxJQUFJLENBQUMsSUFBSXNQLHVCQUFjLENBQUNELFlBQVksQ0FBQyxDQUFDO0VBQ3hGLE9BQU8sQ0FBQyxNQUFNL1YsSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUMrRyxlQUFlLENBQUN2TCxTQUFTLENBQUMsRUFBRXpILE1BQU0sQ0FBQyxDQUFDO0FBQ2xGLENBQUM7O0FBRUQ7QUFDQTtBQUNBOztBQUVBOUMsSUFBSSxDQUFDaVcsWUFBWSxHQUFHLGdCQUFlbEgsUUFBUSxFQUFFNkcsUUFBUSxFQUFFO0VBQ3JELE9BQU81VixJQUFJLENBQUNrQixjQUFjLENBQUM2TixRQUFRLENBQUMsQ0FBQ2tILFlBQVksQ0FBQ0wsUUFBUSxDQUFDO0FBQzdELENBQUM7O0FBRUQ1VixJQUFJLENBQUNrVyxVQUFVLEdBQUcsZ0JBQWVuSCxRQUFRLEVBQUU2RyxRQUFRLEVBQUU7RUFDbkQsT0FBTzVWLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDbUgsVUFBVSxDQUFDTixRQUFRLENBQUM7QUFDM0QsQ0FBQzs7QUFFRDVWLElBQUksQ0FBQ21XLGNBQWMsR0FBRyxnQkFBZXBILFFBQVEsRUFBRTZHLFFBQVEsRUFBRTtFQUN2RCxPQUFPNVYsSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUNvSCxjQUFjLENBQUNQLFFBQVEsQ0FBQztBQUMvRCxDQUFDOztBQUVENVYsSUFBSSxDQUFDb1csU0FBUyxHQUFHLGdCQUFlckgsUUFBUSxFQUFFeEssTUFBTSxFQUFFO0VBQ2hELElBQUksT0FBT0EsTUFBTSxLQUFLLFFBQVEsRUFBRUEsTUFBTSxHQUFHLElBQUk4Uix1QkFBYyxDQUFDOVIsTUFBTSxDQUFDO0VBQ25FLElBQUkwRCxHQUFHLEdBQUcsTUFBTWpJLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDcUgsU0FBUyxDQUFDN1IsTUFBTSxDQUFDO0VBQy9ELE9BQU8wRCxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUNxTyxRQUFRLENBQUMsQ0FBQyxDQUFDeFQsTUFBTSxDQUFDLENBQUM7QUFDbkMsQ0FBQzs7QUFFRDlDLElBQUksQ0FBQ3VXLFdBQVcsR0FBRyxnQkFBZXhILFFBQVEsRUFBRXhLLE1BQU0sRUFBRTtFQUNsRCxJQUFJLE9BQU9BLE1BQU0sS0FBSyxRQUFRLEVBQUVBLE1BQU0sR0FBRyxJQUFJOFIsdUJBQWMsQ0FBQzlSLE1BQU0sQ0FBQztFQUNuRSxJQUFJZ0UsRUFBRSxHQUFHLE1BQU12SSxJQUFJLENBQUNrQixjQUFjLENBQUM2TixRQUFRLENBQUMsQ0FBQ3dILFdBQVcsQ0FBQ2hTLE1BQU0sQ0FBQztFQUNoRSxPQUFPZ0UsRUFBRSxDQUFDK04sUUFBUSxDQUFDLENBQUMsQ0FBQ3hULE1BQU0sQ0FBQyxDQUFDO0FBQy9CLENBQUM7O0FBRUQ5QyxJQUFJLENBQUN3VyxhQUFhLEdBQUcsZ0JBQWV6SCxRQUFRLEVBQUV4SyxNQUFNLEVBQUU7RUFDcEQsSUFBSSxPQUFPQSxNQUFNLEtBQUssUUFBUSxFQUFFQSxNQUFNLEdBQUcsSUFBSThSLHVCQUFjLENBQUM5UixNQUFNLENBQUM7RUFDbkUsSUFBSTBELEdBQUcsR0FBRyxNQUFNakksSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUN5SCxhQUFhLENBQUNqUyxNQUFNLENBQUM7RUFDbkUsSUFBSWtTLE1BQU0sR0FBRyxFQUFFO0VBQ2YsS0FBSyxJQUFJbE8sRUFBRSxJQUFJTixHQUFHLEVBQUUsSUFBSSxDQUFDeU8saUJBQVEsQ0FBQ0MsYUFBYSxDQUFDRixNQUFNLEVBQUVsTyxFQUFFLENBQUMrTixRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUVHLE1BQU0sQ0FBQy9QLElBQUksQ0FBQzZCLEVBQUUsQ0FBQytOLFFBQVEsQ0FBQyxDQUFDLENBQUM7RUFDbEcsSUFBSU0sVUFBVSxHQUFHLEVBQUU7RUFDbkIsS0FBSyxJQUFJQyxLQUFLLElBQUlKLE1BQU0sRUFBRUcsVUFBVSxDQUFDbFEsSUFBSSxDQUFDbVEsS0FBSyxDQUFDL1QsTUFBTSxDQUFDLENBQUMsQ0FBQztFQUN6RCxPQUFPOFQsVUFBVTtBQUNuQixDQUFDOztBQUVENVcsSUFBSSxDQUFDOFcsU0FBUyxHQUFHLGdCQUFlL0gsUUFBUSxFQUFFZ0ksS0FBSyxFQUFFO0VBQy9DLElBQUk5TyxHQUFHLEdBQUcsTUFBTWpJLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDK0gsU0FBUyxDQUFDQyxLQUFLLENBQUM7RUFDOUQsT0FBTzlPLEdBQUcsQ0FBQzFGLE1BQU0sS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcwRixHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUNxTyxRQUFRLENBQUMsQ0FBQyxDQUFDeFQsTUFBTSxDQUFDLENBQUM7QUFDM0QsQ0FBQzs7QUFFRDlDLElBQUksQ0FBQ2dYLFFBQVEsR0FBRyxnQkFBZWpJLFFBQVEsRUFBRWtJLFdBQVcsRUFBRTtFQUNwRCxPQUFPalgsSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUNpSSxRQUFRLENBQUNDLFdBQVcsQ0FBQztBQUM1RCxDQUFDOztBQUVEalgsSUFBSSxDQUFDa1gsYUFBYSxHQUFHLGdCQUFlbkksUUFBUSxFQUFFb0ksU0FBUyxFQUFFO0VBQ3ZELE9BQU8sQ0FBQyxNQUFNblgsSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUNtSSxhQUFhLENBQUMsSUFBSUUsb0JBQVcsQ0FBQ0QsU0FBUyxDQUFDLENBQUMsRUFBRXJVLE1BQU0sQ0FBQyxDQUFDO0FBQ2pHLENBQUM7O0FBRUQ5QyxJQUFJLENBQUNxWCxPQUFPLEdBQUcsZ0JBQWV0SSxRQUFRLEVBQUV1SSxhQUFhLEVBQUU7RUFDckQsT0FBT3RYLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDc0ksT0FBTyxDQUFDQyxhQUFhLENBQUM7QUFDN0QsQ0FBQzs7QUFFRHRYLElBQUksQ0FBQ3VYLFNBQVMsR0FBRyxnQkFBZXhJLFFBQVEsRUFBRXlJLFdBQVcsRUFBRTtFQUNyRCxPQUFPeFgsSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUN3SSxTQUFTLENBQUNDLFdBQVcsQ0FBQztBQUM3RCxDQUFDOztBQUVEeFgsSUFBSSxDQUFDeVgsV0FBVyxHQUFHLGdCQUFlMUksUUFBUSxFQUFFOU0sT0FBTyxFQUFFeVYsYUFBYSxFQUFFNUcsVUFBVSxFQUFFQyxhQUFhLEVBQUU7RUFDN0YsT0FBTy9RLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDMEksV0FBVyxDQUFDeFYsT0FBTyxFQUFFeVYsYUFBYSxFQUFFNUcsVUFBVSxFQUFFQyxhQUFhLENBQUM7QUFDckcsQ0FBQzs7QUFFRC9RLElBQUksQ0FBQzJYLGFBQWEsR0FBRyxnQkFBZTVJLFFBQVEsRUFBRTlNLE9BQU8sRUFBRWUsT0FBTyxFQUFFNFUsU0FBUyxFQUFFO0VBQ3pFLE9BQU8sQ0FBQyxNQUFNNVgsSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUM0SSxhQUFhLENBQUMxVixPQUFPLEVBQUVlLE9BQU8sRUFBRTRVLFNBQVMsQ0FBQyxFQUFFOVUsTUFBTSxDQUFDLENBQUM7QUFDbEcsQ0FBQzs7QUFFRDlDLElBQUksQ0FBQzZYLFFBQVEsR0FBRyxnQkFBZTlJLFFBQVEsRUFBRStJLE1BQU0sRUFBRTtFQUMvQyxPQUFPOVgsSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUM4SSxRQUFRLENBQUNDLE1BQU0sQ0FBQztBQUN2RCxDQUFDOztBQUVEOVgsSUFBSSxDQUFDK1gsVUFBVSxHQUFHLGdCQUFlaEosUUFBUSxFQUFFK0ksTUFBTSxFQUFFRSxLQUFLLEVBQUVoVixPQUFPLEVBQUU7RUFDakUsT0FBTyxDQUFDLE1BQU1oRCxJQUFJLENBQUNrQixjQUFjLENBQUM2TixRQUFRLENBQUMsQ0FBQ2dKLFVBQVUsQ0FBQ0QsTUFBTSxFQUFFRSxLQUFLLEVBQUVoVixPQUFPLENBQUMsRUFBRUYsTUFBTSxDQUFDLENBQUM7QUFDMUYsQ0FBQzs7QUFFRDlDLElBQUksQ0FBQ2lZLFVBQVUsR0FBRyxnQkFBZWxKLFFBQVEsRUFBRStJLE1BQU0sRUFBRTlVLE9BQU8sRUFBRWYsT0FBTyxFQUFFO0VBQ25FLE9BQU9qQyxJQUFJLENBQUNrQixjQUFjLENBQUM2TixRQUFRLENBQUMsQ0FBQ2tKLFVBQVUsQ0FBQ0gsTUFBTSxFQUFFOVUsT0FBTyxFQUFFZixPQUFPLENBQUM7QUFDM0UsQ0FBQzs7QUFFRGpDLElBQUksQ0FBQ2tZLFlBQVksR0FBRyxnQkFBZW5KLFFBQVEsRUFBRStJLE1BQU0sRUFBRTlVLE9BQU8sRUFBRWYsT0FBTyxFQUFFMlYsU0FBUyxFQUFFO0VBQ2hGLE9BQU8sQ0FBQyxNQUFNNVgsSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUNtSixZQUFZLENBQUNKLE1BQU0sRUFBRTlVLE9BQU8sRUFBRWYsT0FBTyxFQUFFMlYsU0FBUyxDQUFDLEVBQUU5VSxNQUFNLENBQUMsQ0FBQztBQUN6RyxDQUFDOztBQUVEOUMsSUFBSSxDQUFDbVksYUFBYSxHQUFHLGdCQUFlcEosUUFBUSxFQUFFK0ksTUFBTSxFQUFFN1YsT0FBTyxFQUFFO0VBQzdELE9BQU9qQyxJQUFJLENBQUNrQixjQUFjLENBQUM2TixRQUFRLENBQUMsQ0FBQ29KLGFBQWEsQ0FBQ0wsTUFBTSxFQUFFN1YsT0FBTyxDQUFDO0FBQ3JFLENBQUM7O0FBRURqQyxJQUFJLENBQUNvWSxlQUFlLEdBQUcsZ0JBQWVySixRQUFRLEVBQUUrSSxNQUFNLEVBQUU3VixPQUFPLEVBQUUyVixTQUFTLEVBQUU7RUFDMUUsT0FBTzVYLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDcUosZUFBZSxDQUFDTixNQUFNLEVBQUU3VixPQUFPLEVBQUUyVixTQUFTLENBQUM7QUFDbEYsQ0FBQzs7QUFFRDVYLElBQUksQ0FBQ3FZLHFCQUFxQixHQUFHLGdCQUFldEosUUFBUSxFQUFFOU0sT0FBTyxFQUFFO0VBQzdELE9BQU9qQyxJQUFJLENBQUNrQixjQUFjLENBQUM2TixRQUFRLENBQUMsQ0FBQ3NKLHFCQUFxQixDQUFDcFcsT0FBTyxDQUFDO0FBQ3JFLENBQUM7O0FBRURqQyxJQUFJLENBQUNzWSxzQkFBc0IsR0FBRyxnQkFBZXZKLFFBQVEsRUFBRStCLFVBQVUsRUFBRXlILFNBQVMsRUFBRXRXLE9BQU8sRUFBRTtFQUNyRixPQUFPakMsSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUN1SixzQkFBc0IsQ0FBQ3hILFVBQVUsRUFBRXlILFNBQVMsRUFBRXRXLE9BQU8sQ0FBQztBQUM3RixDQUFDOztBQUVEakMsSUFBSSxDQUFDd1ksaUJBQWlCLEdBQUcsZ0JBQWV6SixRQUFRLEVBQUUvTCxPQUFPLEVBQUVmLE9BQU8sRUFBRTJWLFNBQVMsRUFBRTtFQUM3RSxPQUFPLENBQUMsTUFBTTVYLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDeUosaUJBQWlCLENBQUN4VixPQUFPLEVBQUVmLE9BQU8sRUFBRTJWLFNBQVMsQ0FBQyxFQUFFOVUsTUFBTSxDQUFDLENBQUM7QUFDdEcsQ0FBQzs7QUFFRDlDLElBQUksQ0FBQ3lZLFVBQVUsR0FBRyxnQkFBZTFKLFFBQVEsRUFBRS9HLFFBQVEsRUFBRTtFQUNuRCxPQUFPaEksSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUMwSixVQUFVLENBQUN6USxRQUFRLENBQUM7QUFDM0QsQ0FBQzs7QUFFRGhJLElBQUksQ0FBQzBZLFVBQVUsR0FBRyxnQkFBZTNKLFFBQVEsRUFBRS9HLFFBQVEsRUFBRTJRLE9BQU8sRUFBRTtFQUM1RCxPQUFPM1ksSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUMySixVQUFVLENBQUMxUSxRQUFRLEVBQUUyUSxPQUFPLENBQUM7QUFDcEUsQ0FBQzs7QUFFRDNZLElBQUksQ0FBQzRZLHFCQUFxQixHQUFHLGdCQUFlN0osUUFBUSxFQUFFOEosWUFBWSxFQUFFO0VBQ2xFLElBQUk5TixXQUFXLEdBQUcsRUFBRTtFQUNwQixLQUFLLElBQUlDLEtBQUssSUFBSSxNQUFNaEwsSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUM2SixxQkFBcUIsQ0FBQ0MsWUFBWSxDQUFDLEVBQUU5TixXQUFXLENBQUNyRSxJQUFJLENBQUNzRSxLQUFLLENBQUNsSSxNQUFNLENBQUMsQ0FBQyxDQUFDO0VBQzNILE9BQU9pSSxXQUFXO0FBQ3BCLENBQUM7O0FBRUQvSyxJQUFJLENBQUM4WSxtQkFBbUIsR0FBRyxnQkFBZS9KLFFBQVEsRUFBRS9MLE9BQU8sRUFBRStWLFdBQVcsRUFBRTtFQUN4RSxPQUFPL1ksSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUMrSixtQkFBbUIsQ0FBQzlWLE9BQU8sRUFBRStWLFdBQVcsQ0FBQztBQUNoRixDQUFDOztBQUVEL1ksSUFBSSxDQUFDZ1osb0JBQW9CLEdBQUcsZ0JBQWVqSyxRQUFRLEVBQUVrSyxLQUFLLEVBQUVDLFVBQVUsRUFBRWxXLE9BQU8sRUFBRW1XLGNBQWMsRUFBRUosV0FBVyxFQUFFO0VBQzVHLE9BQU8vWSxJQUFJLENBQUNrQixjQUFjLENBQUM2TixRQUFRLENBQUMsQ0FBQ2lLLG9CQUFvQixDQUFDQyxLQUFLLEVBQUVDLFVBQVUsRUFBRWxXLE9BQU8sRUFBRW1XLGNBQWMsRUFBRUosV0FBVyxDQUFDO0FBQ3BILENBQUM7O0FBRUQvWSxJQUFJLENBQUNvWixzQkFBc0IsR0FBRyxnQkFBZXJLLFFBQVEsRUFBRWtLLEtBQUssRUFBRTtFQUM1RCxPQUFPalosSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUNxSyxzQkFBc0IsQ0FBQ0gsS0FBSyxDQUFDO0FBQ3BFLENBQUM7O0FBRURqWixJQUFJLENBQUNxWixXQUFXLEdBQUcsZ0JBQWV0SyxRQUFRLEVBQUVrRixHQUFHLEVBQUVxRixjQUFjLEVBQUU7RUFDL0QsTUFBTSxJQUFJN1ksS0FBSyxDQUFDLGlCQUFpQixDQUFDO0FBQ3BDLENBQUM7O0FBRURULElBQUksQ0FBQ3VaLGFBQWEsR0FBRyxnQkFBZXhLLFFBQVEsRUFBRXVLLGNBQWMsRUFBRTtFQUM1RCxNQUFNLElBQUk3WSxLQUFLLENBQUMsaUJBQWlCLENBQUM7QUFDcEMsQ0FBQzs7QUFFRFQsSUFBSSxDQUFDd1osY0FBYyxHQUFHLGdCQUFlekssUUFBUSxFQUFFO0VBQzdDLE1BQU0sSUFBSXRPLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQztBQUNwQyxDQUFDOztBQUVEVCxJQUFJLENBQUN5WixrQkFBa0IsR0FBRyxnQkFBZTFLLFFBQVEsRUFBRWtGLEdBQUcsRUFBRS9DLEtBQUssRUFBRTtFQUM3RCxNQUFNLElBQUl6USxLQUFLLENBQUMsaUJBQWlCLENBQUM7QUFDcEMsQ0FBQzs7QUFFRFQsSUFBSSxDQUFDMFosYUFBYSxHQUFHLGdCQUFlM0ssUUFBUSxFQUFFYSxVQUFVLEVBQUU7RUFDeEQsT0FBTzVQLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDMkssYUFBYSxDQUFDLElBQUlyRCx1QkFBYyxDQUFDekcsVUFBVSxDQUFDLENBQUM7QUFDcEYsQ0FBQzs7QUFFRDVQLElBQUksQ0FBQzJaLGVBQWUsR0FBRyxnQkFBZTVLLFFBQVEsRUFBRTZLLEdBQUcsRUFBRTtFQUNuRCxPQUFPLENBQUMsTUFBTTVaLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDNEssZUFBZSxDQUFDQyxHQUFHLENBQUMsRUFBRTlXLE1BQU0sQ0FBQyxDQUFDO0FBQzVFLENBQUM7O0FBRUQ5QyxJQUFJLENBQUM2WixZQUFZLEdBQUcsZ0JBQWU5SyxRQUFRLEVBQUUrSyxHQUFHLEVBQUU7RUFDaEQsT0FBTzlaLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDOEssWUFBWSxDQUFDQyxHQUFHLENBQUM7QUFDeEQsQ0FBQzs7QUFFRDlaLElBQUksQ0FBQytaLFlBQVksR0FBRyxnQkFBZWhMLFFBQVEsRUFBRStLLEdBQUcsRUFBRUUsS0FBSyxFQUFFO0VBQ3ZELE9BQU9oYSxJQUFJLENBQUNrQixjQUFjLENBQUM2TixRQUFRLENBQUMsQ0FBQ2dMLFlBQVksQ0FBQ0QsR0FBRyxFQUFFRSxLQUFLLENBQUM7QUFDL0QsQ0FBQzs7QUFFRGhhLElBQUksQ0FBQ2tPLFdBQVcsR0FBRyxnQkFBZWEsUUFBUSxFQUFFaEIsVUFBVSxFQUFFa00sZ0JBQWdCLEVBQUVoTSxhQUFhLEVBQUU7RUFDdkYsT0FBT2pPLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDYixXQUFXLENBQUNILFVBQVUsRUFBRWtNLGdCQUFnQixFQUFFaE0sYUFBYSxDQUFDO0FBQy9GLENBQUM7O0FBRURqTyxJQUFJLENBQUNvTyxVQUFVLEdBQUcsZ0JBQWVXLFFBQVEsRUFBRTtFQUN6QyxPQUFPL08sSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUNYLFVBQVUsQ0FBQyxDQUFDO0FBQ25ELENBQUM7O0FBRURwTyxJQUFJLENBQUNrYSxzQkFBc0IsR0FBRyxnQkFBZW5MLFFBQVEsRUFBRTtFQUNyRCxPQUFPL08sSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUNtTCxzQkFBc0IsQ0FBQyxDQUFDO0FBQy9ELENBQUM7O0FBRURsYSxJQUFJLENBQUNtYSxVQUFVLEdBQUcsZ0JBQWVwTCxRQUFRLEVBQUU7RUFDekMsT0FBTy9PLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDb0wsVUFBVSxDQUFDLENBQUM7QUFDbkQsQ0FBQzs7QUFFRG5hLElBQUksQ0FBQ29hLGVBQWUsR0FBRyxnQkFBZXJMLFFBQVEsRUFBRTtFQUM5QyxPQUFPLENBQUMsTUFBTS9PLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDcUwsZUFBZSxDQUFDLENBQUMsRUFBRXRYLE1BQU0sQ0FBQyxDQUFDO0FBQ3pFLENBQUM7O0FBRUQ5QyxJQUFJLENBQUNxYSxlQUFlLEdBQUcsZ0JBQWV0TCxRQUFRLEVBQUU7RUFDOUMsT0FBTy9PLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDc0wsZUFBZSxDQUFDLENBQUM7QUFDeEQsQ0FBQzs7QUFFRHJhLElBQUksQ0FBQ3NhLFlBQVksR0FBRyxnQkFBZXZMLFFBQVEsRUFBRXdMLGFBQWEsRUFBRUMsU0FBUyxFQUFFdkwsUUFBUSxFQUFFO0VBQy9FLE9BQU8sTUFBTWpQLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDdUwsWUFBWSxDQUFDQyxhQUFhLEVBQUVDLFNBQVMsRUFBRXZMLFFBQVEsQ0FBQztBQUM3RixDQUFDOztBQUVEalAsSUFBSSxDQUFDeWEsb0JBQW9CLEdBQUcsZ0JBQWUxTCxRQUFRLEVBQUV3TCxhQUFhLEVBQUV0TCxRQUFRLEVBQUU7RUFDNUUsT0FBTyxDQUFDLE1BQU1qUCxJQUFJLENBQUNrQixjQUFjLENBQUM2TixRQUFRLENBQUMsQ0FBQzBMLG9CQUFvQixDQUFDRixhQUFhLEVBQUV0TCxRQUFRLENBQUMsRUFBRW5NLE1BQU0sQ0FBQyxDQUFDO0FBQ3JHLENBQUM7O0FBRUQ5QyxJQUFJLENBQUMwYSxpQkFBaUIsR0FBRyxnQkFBZTNMLFFBQVEsRUFBRTtFQUNoRCxPQUFPL08sSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUMyTCxpQkFBaUIsQ0FBQyxDQUFDO0FBQzFELENBQUM7O0FBRUQxYSxJQUFJLENBQUMyYSxpQkFBaUIsR0FBRyxnQkFBZTVMLFFBQVEsRUFBRXdMLGFBQWEsRUFBRTtFQUMvRCxPQUFPdmEsSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUM0TCxpQkFBaUIsQ0FBQ0osYUFBYSxDQUFDO0FBQ3ZFLENBQUM7O0FBRUR2YSxJQUFJLENBQUM0YSxpQkFBaUIsR0FBRyxnQkFBZTdMLFFBQVEsRUFBRThMLGFBQWEsRUFBRTtFQUMvRCxPQUFPLENBQUMsTUFBTTdhLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDNkwsaUJBQWlCLENBQUNDLGFBQWEsQ0FBQyxFQUFFL1gsTUFBTSxDQUFDLENBQUM7QUFDeEYsQ0FBQzs7QUFFRDlDLElBQUksQ0FBQzhhLG1CQUFtQixHQUFHLGdCQUFlL0wsUUFBUSxFQUFFZ00sbUJBQW1CLEVBQUU7RUFDdkUsT0FBTy9hLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDK0wsbUJBQW1CLENBQUNDLG1CQUFtQixDQUFDO0FBQy9FLENBQUM7O0FBRUQvYSxJQUFJLENBQUNnYixPQUFPLEdBQUcsZ0JBQWVqTSxRQUFRLEVBQUU7RUFDdEMsT0FBTy9PLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDaU0sT0FBTyxDQUFDLENBQUM7QUFDaEQsQ0FBQzs7QUFFRGhiLElBQUksQ0FBQ2liLGNBQWMsR0FBRyxnQkFBZWxNLFFBQVEsRUFBRW1NLFdBQVcsRUFBRUMsV0FBVyxFQUFFO0VBQ3ZFLE9BQU9uYixJQUFJLENBQUNrQixjQUFjLENBQUM2TixRQUFRLENBQUMsQ0FBQ2tNLGNBQWMsQ0FBQ0MsV0FBVyxFQUFFQyxXQUFXLENBQUM7QUFDL0UsQ0FBQzs7QUFFRG5iLElBQUksQ0FBQ29iLFFBQVEsR0FBRyxnQkFBZXJNLFFBQVEsRUFBRTtFQUN2QyxPQUFPLENBQUMvTyxJQUFJLENBQUNrQixjQUFjLENBQUM2TixRQUFRLENBQUMsSUFBSS9PLElBQUksQ0FBQ2tCLGNBQWMsQ0FBQzZOLFFBQVEsQ0FBQyxDQUFDcU0sUUFBUSxDQUFDLENBQUM7QUFDbkYsQ0FBQzs7QUFFRHBiLElBQUksQ0FBQ3FiLEtBQUssR0FBRyxnQkFBZXRNLFFBQVEsRUFBRXVNLElBQUksRUFBRTtFQUMxQyxPQUFPdGIsSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDLENBQUNzTSxLQUFLLENBQUNDLElBQUksQ0FBQztFQUNoRCxPQUFPdGIsSUFBSSxDQUFDa0IsY0FBYyxDQUFDNk4sUUFBUSxDQUFDO0FBQ3RDLENBQUMifQ==