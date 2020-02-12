require("monero-javascript");

/**
 * Web worker to manage a daemon and core wallet off the main chain with messages.
 * 
 * Required message format: e.data[0] = object id, e.data[1] = function name, e.data[2+] = function args

 * This file must be browserified and placed in the web app root.  // TODO: exportable in MoneroModel.js?
 * 
 * TODO: refactor try..catches to common method which takes function and args to execute
 */
onmessage = async function(e) {
  
  // initialize one time
  await self.initOneTime();
  
  // validate params
  let objectId = e.data[0];
  let fnName = e.data[1];
  assert(objectId, "Must provide object id to apply function to");
  assert(fnName.length >= 2, "Must provide a function name with length >= 2");
  if (!self[fnName]) throw new Error("Method '" + fnName + "' is not registered with worker");
  e.data.splice(1, 1); // remove function name
  
  // execute worker function and post result to callback
  let callbackFn = "on" + fnName.charAt(0).toUpperCase() + fnName.substring(1);
  try {
    postMessage([objectId, callbackFn, {result: await self[fnName].apply(null, e.data)}]);
  } catch (e) {
    postMessage([objectId, callbackFn, {error: e.message}]);
  }
}

self.initOneTime = async function() {
  if (!self.isInitialized) {
    self.WORKER_OBJECTS = {};
    self.isInitialized = true;
  }
}

//----------------------------- DAEMON METHODS --------------------------------

self.createDaemonRpc = async function(daemonId, daemonUriOrConfig) {
  self.WORKER_OBJECTS[daemonId] = new MoneroDaemonRpc(daemonUriOrConfig);
}

self.daemonGetRpcConnection = async function(daemonId) {
  return (await self.WORKER_OBJECTS[daemonId].getRpcConnection()).getConfig();
}

self.daemonIsConnected = async function(daemonId) {
  return self.WORKER_OBJECTS[daemonId].isConnected();
}

self.daemonGetVersion = async function(daemonId) {
  return (await self.WORKER_OBJECTS[daemonId].getVersion()).toJson();
}

self.daemonIsTrusted = async function(daemonId) {
  return self.WORKER_OBJECTS[daemonId].isTrusted();
}

self.daemonGetHeight = async function(daemonId) {
  return self.WORKER_OBJECTS[daemonId].getHeight();
}

self.daemonGetBlockHash = async function(daemonId, height) {
  return self.WORKER_OBJECTS[daemonId].getBlockHash(height);
}

self.daemonGetBlockTemplate = async function(daemonId, walletAddress, reserveSize) {
  return (await self.WORKER_OBJECTS[daemonId].getBlockTemplate(walletAddress, reserveSize)).toJson();
}

self.daemonGetLastBlockHeader = async function(daemonId) {
  return (await self.WORKER_OBJECTS[daemonId].getLastBlockHeader()).toJson();
}

self.daemonGetBlockHeaderByHash = async function(daemonId, hash) {
  return (await self.WORKER_OBJECTS[daemonId].daemonGetBlockHeaderByHash(hash)).toJson();
}

self.daemonGetBlockHeaderByHeight = async function(daemonId, height) {
  return (await self.WORKER_OBJECTS[daemonId].getBlockHeaderByHeight(height)).toJson();
}

self.daemonGetBlockHeadersByRange = async function(daemonId, startHeight, endHeight) {
  let blockHeadersJson = [];
  for (let blockHeader of await self.WORKER_OBJECTS[daemonId].getBlockHeadersByRange(startHeight, endHeight)) blockHeadersJson.push(blockHeader.toJson());
  return blockHeadersJson;
}

self.daemonGetBlockByHash = async function(daemonId, blockHash) {
  return (await self.WORKER_OBJECTS[daemonId].getBlockByHash(blockHash)).toJson();
}

self.daemonGetBlocksByHash = async function(daemonId, blockHashes, startHeight, prune) {
  let blocksJson = [];
  for (let block of await self.WORKER_OBJECTS[daemonId].getBlocksByHash(blockHashes, startHeight, prune)) blocksJson.push(block.toJson());
  return blocksJson;
}

self.daemonGetBlockByHeight = async function(daemonId, height) {
  return (await self.WORKER_OBJECTS[daemonId].getBlockByHeight(height)).toJson();
}

self.daemonGetBlocksByHeight = async function(daemonId, heights) {
  let blocksJson = [];
  for (let block of await self.WORKER_OBJECTS[daemonId].getBlocksByHeight(heights)) blocksJson.push(block.toJson());
  return blocksJson;
}

self.daemonGetBlocksByRange = async function(daemonId, startHeight, endHeight) {
  let blocksJson = [];
  for (let block of await self.WORKER_OBJECTS[daemonId].getBlocksByRange(startHeight, endHeight)) blocksJson.push(block.toJson());
  return blocksJson;
}

self.daemonGetBlocksByRangeChuncked = async function(daemonId, startHeight, endHeight, maxChunkSize) {
  let blocksJson = [];
  for (let block of await self.WORKER_OBJECTS[daemonId].daemonGetBlocksByRangeChuncked(startHeight, endHeight, maxChunkSize)) blocksJson.push(block.toJson());
  return blocksJson;
}

self.daemonGetBlockHashes = async function(daemonId, blockHashes, startHeight) {
  throw new Error("worker.getBlockHashes not implemented");
}

self.daemonGetTxs = async function(daemonId, txHashes, prune) {
  
  // get txs
  let txs = await self.WORKER_OBJECTS[daemonId].getTxs(txHashes, prune);
  
  // TODO
  throw new Error("Daemon RPC getTxs() does not return blocks with txs");
}

self.daemonGetTxHashes = async function(daemonId, txHashes, prune) {
  throw new Error("worker.daemonGetTxHashes not implemented");
}

self.daemonGetMinerTxSum = async function(daemonId, height, numBlocks) {
  return (await self.WORKER_OBJECTS[daemonId].getMinerTxSum()).toJson();
}

self.daemonGetFeeEstimate = async function(daemonId, graceBlocks) {
  return (await self.WORKER_OBJECTS[daemonId].getFeeEstimate(graceBlocks())).toString();
}

self.daemonSubmitTxHex = async function(daemonId, txHex, doNotRelay) {
  return (await self.WORKER_OBJECTS[daemonId].submitTxHex(txHex, doNotRelay)).toJson();
}

self.daemonRelayTxsByHash = async function(daemonId, txHashes) {
  return self.WORKER_OBJECTS[daemonId].relayTxsByHash(txHashes);
}

self.daemonGetTxPool = async function(daemonId) {
  let txs = await self.WORKER_OBJECTS[daemonId].getTxPool();
  let block = new MoneroBlock().setTxs(txs);
  for (let tx of txs) tx.setBlock(block)
  return block.toJson();
}

self.daemonGetTxPoolHashes = async function(daemonId) {
  return self.WORKER_OBJECTS[daemonId].getTxPoolHashes();
}

//async getTxPoolBacklog() {
//  throw new MoneroError("Not implemented");
//}
//
//async getTxPoolStats() {
//  throw new MoneroError("Not implemented");
//}

self.daemonFlushTxPool = async function(daemonId, hashes) {
  return self.WORKER_OBJECTS[daemonId].flushTxPool(hashes);
}

//
//async getKeyImageSpentStatuses(keyImages) {
//  throw new MoneroError("Not implemented");
//}
//
//async getOutputs(outputs) {
//  throw new MoneroError("Not implemented");
//}
//
//async getOutputHistogram(amounts, minCount, maxCount, isUnlocked, recentCutoff) {
//  throw new MoneroError("Not implemented");
//}
//
//async getOutputDistribution(amounts, cumulative, startHeight, endHeight) {
//  throw new MoneroError("Not implemented");
//}

self.daemonGetInfo = async function(daemonId) {
  return (await self.WORKER_OBJECTS[daemonId].getDaemonInf()).toJson();
}

self.daemonGetSyncInfo = async function(daemonId) {
  return (await self.WORKER_OBJECTS[daemonId].daemonGetSyncInfo()).toJson();
}

self.daemonGetHardForkInfo = async function(daemonId) {
  return (await self.WORKER_OBJECTS[daemonId].daemonGetHardForkInfo()).toJson();
}

self.getAltChains = async function(daemonId) {
  let altChainsJson = [];
  for (let altChain of await self.WORKER_OBJECTS[daemonId].getAltChains()) altChainsJson.push(altChain.toJson());
  return altChainsJson;
}

self.daemonGetAltBlockIds = async function(daemonId) {
  return self.WORKER_OBJECTS[daemonId].getAltBlockIds();
}

self.daemonGetDownloadLimit = async function(daemonId) {
  return self.WORKER_OBJECTS[daemonId].getDownloadLimit();
}

self.daemonSetDownloadLimit = async function(daemonId, limit) {
  return self.WORKER_OBJECTS[daemonId].setDownloadLimit(limit);
}

self.resetDownloadLimit = async function(daemonId) {
  return self.WORKER_OBJECTS[daemonId].resetDownloadLimit();
}

self.daemonGetUploadLimit = async function(daemonId) {
  return self.WORKER_OBJECTS[daemonId].getUploadLimit();
}

self.daemonSetUploadLimit = async function(daemonId, limit) {
  return self.WORKER_OBJECTS[daemonId].setUploadLimit(limit);
}

self.resetUploadLimit = async function(daemonId) {
  return self.WORKER_OBJECTS[daemonId].resetUploadLimit();
}

//async getKnownPeers() {
//  throw new MoneroError("Not implemented");
//}
//
//async getConnections() {
//  throw new MoneroError("Not implemented");
//}
//
//async setOutgoingPeerLimit(limit) {
//  throw new MoneroError("Not implemented");
//}
//
//async setIncomingPeerLimit(limit) {
//  throw new MoneroError("Not implemented");
//}
//
//async getPeerBans() {
//  throw new MoneroError("Not implemented");
//}
//
//async setPeerBan(ban) {
//  throw new MoneroError("Not implemented");
//}
//
//async setPeerBans(bans) {
//  throw new MoneroError("Not implemented");
//}

self.daemonStartMining = async function(daemonId, address, numThreads, isBackground, ignoreBattery) {
  return self.WORKER_OBJECTS[daemonId].startMining(address, numThreads, isBackground, ignoreBattery);
}

self.daemonStopMining = async function(daemonId) {
  return self.WORKER_OBJECTS[daemonId].stopMining();
}

self.daemonGetMiningStatus = async function(daemonId) {
  return (await self.WORKER_OBJECTS[daemonId].getMiningStatus()).toJson();
}

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

self.daemonStop = async function(daemonId) {
  return self.WORKER_OBJECTS[daemonId].stop();
}

self.daemonGetNextBlockHeader = async function(daemonId) {
  return (await self.WORKER_OBJECTS[daemonId].getNextBlockHeader()).toJson();
}

//
//addBlockListener(listener) {
//  throw new MoneroError("Not implemented");
//}
//
//removeBlockListener(listener) {
//  throw new MoneroError("Not implemented");
//}

//------------------------------ WALLET METHODS -------------------------------

self.openWalletData = async function(walletId, password, networkType, keysData, cacheData, daemonUriOrConfig) {
  let daemonConnection = daemonUriOrConfig ? new MoneroRpcConnection(daemonUriOrConfig) : undefined;
  self.WORKER_OBJECTS[walletId] = await MoneroWalletCore.openWalletData("", password, networkType, keysData, cacheData, daemonConnection);
}

self.createWalletRandom = async function(walletId, password, networkType, daemonUriOrConfig, language) {
  let daemonConnection = daemonUriOrConfig ? new MoneroRpcConnection(daemonUriOrConfig) : undefined;
  self.WORKER_OBJECTS[walletId] = await MoneroWalletCore.createWalletRandom("", password, networkType, daemonConnection, language);
}

self.createWalletFromMnemonic = async function(walletId, password, networkType, mnemonic, daemonUriOrConfig, restoreHeight, seedOffset) {
  let daemonConnection = daemonUriOrConfig ? new MoneroRpcConnection(daemonUriOrConfig) : undefined;
  self.WORKER_OBJECTS[walletId] = await MoneroWalletCore.createWalletFromMnemonic("", password, networkType, mnemonic, daemonConnection, restoreHeight, seedOffset);
}

self.createWalletFromKeys = async function(walletId, password, networkType, address, viewKey, spendKey, daemonUriOrConfig, restoreHeight, language) {
  let daemonConnection = daemonUriOrConfig ? new MoneroRpcConnection(daemonUriOrConfig) : undefined;
  self.WORKER_OBJECTS[walletId] = await MoneroWalletCore.createWalletFromKeys("", password, networkType, address, viewKey, spendKey, daemonConnection, restoreHeight, language);
}

self.getNetworkType = async function(walletId) {
  return self.WORKER_OBJECTS[walletId].getNetworkType();
}

//
//async getVersion() {
//  throw new Error("Not implemented");
//}
//
//getPath() {
//  throw new Error("Not implemented");
//}

self.getMnemonic = async function(walletId) {
  return self.WORKER_OBJECTS[walletId].getMnemonic();
}

self.getMnemonicLanguage = async function(walletId) {
  return self.WORKER_OBJECTS[walletId].getMnemonicLanguage();
}

self.getMnemonicLanguages = async function(walletId) {
  return self.WORKER_OBJECTS[walletId].getMnemonicLanguages();
}

self.getPrivateSpendKey = async function(walletId) {
  return self.WORKER_OBJECTS[walletId].getPrivateSpendKey();
}

self.getPrivateViewKey = async function(walletId) {
  return self.WORKER_OBJECTS[walletId].getPrivateViewKey();
}

self.getPublicViewKey = async function(walletId) {
  return self.WORKER_OBJECTS[walletId].getPublicViewKey();
}

self.getPublicSpendKey = async function(walletId) {
  return self.WORKER_OBJECTS[walletId].getPublicSpendKey();
}

self.getAddress = async function(walletId, accountIdx, subaddressIdx) {
  return self.WORKER_OBJECTS[walletId].getAddress(accountIdx, subaddressIdx);
}

self.getAddressIndex = async function(walletId, address) {
  return self.WORKER_OBJECTS[walletId].getAddressIndex(address).toJson();
}

//getAccounts() {
//  throw new Error("Not implemented");
//}
//
//async setDaemonConnection(uriOrRpcConnection, username, password) {
//  throw new Error("Not implemented");
//}

self.setDaemonConnection = async function(walletId, config) {
  return self.WORKER_OBJECTS[walletId].setDaemonConnection(config ? new MoneroRpcConnection(config) : undefined);
}

self.getDaemonConnection = async function(walletId) {
  return (await self.WORKER_OBJECTS[walletId].getDaemonConnection()).getConfig();
}

self.isConnected = async function(walletId) {
  return self.WORKER_OBJECTS[walletId].isConnected();
}

self.getRestoreHeight = async function(walletId) {
  return self.WORKER_OBJECTS[walletId].getRestoreHeight();
}

self.setRestoreHeight = async function(walletId, restoreHeight) {
  return self.WORKER_OBJECTS[walletId].setRestoreHeight(restoreHeight);
}

self.getDaemonHeight = async function(walletId) {
  return self.WORKER_OBJECTS[walletId].getDaemonHeight();
}

self.getDaemonMaxPeerHeight = async function(walletId) {
  return self.WORKER_OBJECTS[walletId].getDaemonMaxPeerHeight()
}

self.isDaemonSynced = async function(walletId) {
  return self.WORKER_OBJECTS[walletId].isDaemonSynced();
}

self.getHeight = async function(walletId) {
  return self.WORKER_OBJECTS[walletId].getHeight();
}

self.addListener = async function(walletId, listenerId) {
  
  /**
   * Internal listener to bridge notifications to external listeners.
   * 
   * TODO: MoneroWalletListener is not defined until scripts imported
   */
  class WalletWorkerHelperListener extends MoneroWalletListener {
    
    constructor(walletId, id, worker) {
      super();
      this.walletId = walletId;
      this.id = id;
      this.worker = worker;
    }
    
    getId() {
      return this.id;
    }
    
    onSyncProgress(height, startHeight, endHeight, percentDone, message) {
      this.worker.postMessage([this.walletId, "onSyncProgress_" + this.getId(), height, startHeight, endHeight, percentDone, message]);
    }

    onNewBlock(height) { 
      this.worker.postMessage([this.walletId, "onNewBlock_" + this.getId(), height]);
    }

    onOutputReceived(output) {
      let block = output.getTx().getBlock();
      if (block === undefined) block = new MoneroBlock().setTxs([output.getTx()]);
      this.worker.postMessage([this.walletId, "onOutputReceived_" + this.getId(), block.toJson()]);  // serialize from root block
    }
    
    onOutputSpent(output) {
      let block = output.getTx().getBlock();
      if (block === undefined) block = new MoneroBlock().setTxs([output.getTx()]);
      this.worker.postMessage([this.walletId, "onOutputSpent_" + this.getId(), block.toJson()]);     // serialize from root block
    }
  }
  
  let listener = new WalletWorkerHelperListener(walletId, listenerId, self);
  if (!self.listeners) self.listeners = [];
  self.listeners.push(listener);
  await self.WORKER_OBJECTS[walletId].addListener(listener);
}

self.removeListener = async function(walletId, listenerId) {
  for (let i = 0; i < self.listeners.length; i++) {
    if (self.listeners[i].getId() !== listenerId) continue;
    await self.WORKER_OBJECTS[walletId].removeListener(self.listeners[i]);
    self.listeners.splice(i, 1);
    return;
  }
  throw new MoneroError("Listener is not registered to wallet");  // TODO: call onAddListener, onRemoveListener which can catch exception
}

self.isSynced = async function(walletId) {
  return self.WORKER_OBJECTS[walletId].isSynced();
}

self.sync = async function(walletId, startHeight) {
  return await self.WORKER_OBJECTS[walletId].sync(startHeight);
}

self.startSyncing = async function(walletId) {
  return self.WORKER_OBJECTS[walletId].startSyncing();
}

self.stopSyncing = async function(walletId) {
  return self.WORKER_OBJECTS[walletId].stopSyncing();
}

//// rescanSpent
//// rescanBlockchain

self.getBalance = async function(walletId, accountIdx, subaddressIdx) {
  return (await self.WORKER_OBJECTS[walletId].getBalance(accountIdx, subaddressIdx)).toString();
}

self.getUnlockedBalance = async function(walletId, accountIdx, subaddressIdx) {
  return (await self.WORKER_OBJECTS[walletId].getUnlockedBalance(accountIdx, subaddressIdx)).toString();
}

self.getAccounts = async function(walletId, includeSubaddresses, tag) {
  let accountJsons = [];
  for (let account of await self.WORKER_OBJECTS[walletId].getAccounts(includeSubaddresses, tag)) accountJsons.push(account.toJson());
  return accountJsons;
}

self.getAccount = async function(walletId, accountIdx, includeSubaddresses) {
  return (await self.WORKER_OBJECTS[walletId].getAccount(accountIdx, includeSubaddresses)).toJson();
}

self.createAccount = async function(walletId, label) {
  return (await self.WORKER_OBJECTS[walletId].createAccount(label)).toJson();
}

self.getSubaddresses = async function(walletId, accountIdx, subaddressIndices) {
  let subaddressJsons = [];
  for (let subaddress of await self.WORKER_OBJECTS[walletId].getSubaddresses(accountIdx, subaddressIndices)) subaddressJsons.push(subaddress.toJson());
  return subaddressJsons;
}

self.createSubaddress = async function(walletId, accountIdx, label) {
  return;(await self.WORKER_OBJECTS[walletId].createSubaddress(accountIdx, label)).toJson();
}

// TODO: easier or more efficient way than serializing from root blocks?
self.getTxs = async function(walletId, blockJsonQuery) {
  
  // deserialize query which is json string rooted at block
  let query = new MoneroBlock(blockJsonQuery, MoneroBlock.DeserializationType.TX_QUERY).getTxs()[0];
  
  // get txs
  let txs = await self.WORKER_OBJECTS[walletId].getTxs(query);
  
  // collect unique blocks to preserve model relationships as trees (based on monero_wasm_bridge.cpp::get_txs)
  let unconfirmedBlock = undefined;
  let blocks = [];
  let seenBlocks = new Set();
  for (let tx of txs) {
    if (!tx.getBlock()) {
      if (!unconfirmedBlock) unconfirmedBlock = new MoneroBlock().setTxs([]);
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
}

self.getTransfers = async function(walletId, blockJsonQuery) {
  
  // deserialize query which is json string rooted at block
  let query = new MoneroBlock(blockJsonQuery, MoneroBlock.DeserializationType.TX_QUERY).getTxs()[0].getTransferQuery();
  
  // get transfers
  let transfers = await self.WORKER_OBJECTS[walletId].getTransfers(query);
  
  // collect unique blocks to preserve model relationships as tree
  let unconfirmedBlock = undefined;
  let blocks = [];
  let seenBlocks = new Set();
  for (let transfer of transfers) {
    let tx = transfer.getTx();
    if (!tx.getBlock()) {
      if (!unconfirmedBlock) unconfirmedBlock = new MoneroBlock().setTxs([]);
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
}

self.getOutputs = async function(walletId, blockJsonQuery) {

  // deserialize query which is json string rooted at block
  let query = new MoneroBlock(blockJsonQuery, MoneroBlock.DeserializationType.TX_QUERY).getTxs()[0].getOutputQuery();
  
  // get outputs
  let outputs = await self.WORKER_OBJECTS[walletId].getOutputs(query);
  
  // collect unique blocks to preserve model relationships as tree
  let unconfirmedBlock = undefined;
  let blocks = [];
  let seenBlocks = new Set();
  for (let output of outputs) {
    let tx = output.getTx();
    if (!tx.getBlock()) {
      if (!unconfirmedBlock) unconfirmedBlock = new MoneroBlock().setTxs([]);
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
}

//
//async getOutputsHex() {
//  throw new MoneroError("Not implemented");
//}
//
//async importOutputsHex(outputsHex) {
//  throw new MoneroError("Not implemented");
//}
//
//async getKeyImages() {
//  throw new MoneroError("Not implemented");
//}
//
//async importKeyImages(keyImages) {
//  throw new MoneroError("Not implemented");
//}
//
//async getNewKeyImagesFromLastImport() {
//  throw new MoneroError("Not implemented");
//}
//
//async relayTxs(txsOrMetadatas) {
//  throw new MoneroError("Not implemented");
//}

self.sendSplit = async function(walletId, requestOrAccountIndex, address, amount, priority) {
  if (typeof requestOrAccountIndex === "object") requestOrAccountIndex = new MoneroSendRequest(requestOrAccountIndex);
  return (await self.WORKER_OBJECTS[walletId].sendSplit(requestOrAccountIndex, address, amount, priority)).toJson();
}

//async sweepOutput(requestOrAddress, keyImage, priority) {
//  throw new MoneroError("Not implemented");
//}
//
//async sweepUnlocked(request) {
//  throw new MoneroError("Not implemented");
//}
//
//async sweepDust() {
//  throw new MoneroError("Not implemented");
//}
//
//async sweepDust(doNotRelay) {
//  throw new MoneroError("Not implemented");
//}
//
//async sign(message) {
//  throw new MoneroError("Not implemented");
//}
//
//async verify(message, address, signature) {
//  throw new MoneroError("Not implemented");
//}
//
//async getTxKey(txHash) {
//  throw new MoneroError("Not implemented");
//}
//
//async checkTxKey(txHash, txKey, address) {
//  throw new MoneroError("Not implemented");
//}
//
//async getTxProof(txHash, address, message) {
//  throw new MoneroError("Not implemented");
//}
//
//async checkTxProof(txHash, address, message, signature) {
//  throw new MoneroError("Not implemented");
//}
//
//async getSpendProof(txHash, message) {
//  throw new MoneroError("Not implemented");
//}
//
//async checkSpendProof(txHash, message, signature) {
//  throw new MoneroError("Not implemented");
//}
//
//async getReserveProofWallet(message) {
//  throw new MoneroError("Not implemented");
//}
//
//async getReserveProofAccount(accountIdx, amount, message) {
//  throw new MoneroError("Not implemented");
//}
//
//async checkReserveProof(address, message, signature) {
//  throw new MoneroError("Not implemented");
//}
//
//async getTxNotes(txHashes) {
//  throw new MoneroError("Not implemented");
//}
//
//async setTxNotes(txHashes, notes) {
//  throw new MoneroError("Not implemented");
//}
//
//async getAddressBookEntries() {
//  throw new MoneroError("Not implemented");
//}
//
//async getAddressBookEntries(entryIndices) {
//  throw new MoneroError("Not implemented");
//}
//
//async addAddressBookEntry(address, description) {
//  throw new MoneroError("Not implemented");
//}
//
//async addAddressBookEntry(address, description, paymentId) {
//  throw new MoneroError("Not implemented");
//}
//
//async deleteAddressBookEntry(entryIdx) {
//  throw new MoneroError("Not implemented");
//}
//
//async tagAccounts(tag, accountIndices) {
//  throw new MoneroError("Not implemented");
//}
//
//async untagAccounts(accountIndices) {
//  throw new MoneroError("Not implemented");
//}
//
//async getAccountTags() {
//  throw new MoneroError("Not implemented");
//}
//
//async setAccountTagLabel(tag, label) {
//  throw new MoneroError("Not implemented");
//}
//
//async createPaymentUri(request) {
//  throw new MoneroError("Not implemented");
//}
//
//async parsePaymentUri(uri) {
//  throw new MoneroError("Not implemented");
//}


self.getAttribute = async function(walletId, key) {
  return self.WORKER_OBJECTS[walletId].getAttribute(key);
}

self.setAttribute = async function(walletId, key, value) {
  return self.WORKER_OBJECTS[walletId].setAttribute(key, value);
}

self.startMining = async function(walletId, numThreads, backgroundMining, ignoreBattery) {
  return self.WORKER_OBJECTS[walletId].startMining(numThreads, backgroundMining, ignoreBattery);
}

self.stopMining = async function(walletId) {
  return self.WORKER_OBJECTS[walletId].stopMining();
}

//
//async isMultisigImportNeeded() {
//  throw new MoneroError("Not implemented");
//}
//
//async isMultisig() {
//  throw new MoneroError("Not implemented");
//}
//
//async getMultisigInfo() {
//  throw new MoneroError("Not implemented");
//}
//
//async prepareMultisig() {
//  throw new MoneroError("Not implemented");
//}
//
//async makeMultisig(multisigHexes, threshold, password) {
//  throw new MoneroError("Not implemented");
//}
//
//async exchangeMultisigKeys(multisigHexes, password) {
//  throw new MoneroError("Not implemented");
//}
//
//async getMultisigHex() {
//  throw new MoneroError("Not implemented");
//}
//
//async importMultisigHex(multisigHexes) {
//  throw new MoneroError("Not implemented");
//}
//
//async signMultisigTxHex(multisigTxHex) {
//  throw new MoneroError("Not implemented");
//}
//
//async submitMultisigTxHex(signedMultisigTxHex) {
//  throw new MoneroError("Not implemented");
//}

self.getData = async function(walletId) {
  return self.WORKER_OBJECTS[walletId].getData();
}

self.isClosed = async function(walletId) {
  return self.WORKER_OBJECTS[walletId].isClosed();
}

self.close = async function(walletId, save) {
  return self.WORKER_OBJECTS[walletId].close(save);
}