/**
 * Web worker to run a core wallet managed by messages.
 * 
 * This file must be copied to the web app root.
 */
onmessage = async function(e) {
  await self.initOneTime();
  if (!self[e.data[0]]) throw new Error("Method '" + e.data[0] + "' is not registered with worker");
  self[e.data[0]].apply(null, e.data.slice(1));
}

self.initOneTime = async function() {
  if (!self.isInitialized) {
    self.isInitialized = true;
    console.log("WORKER loading scripts and module");
    self.importScripts('monero-javascript-wasm.js');
    self.importScripts('worker_imports.js');
    await MoneroUtils.loadWasmModule();
    console.log("done loading scripts and module");
  }
}

self.createWalletRandom = async function(password, networkType, daemonUriOrConfig, language) {
  let daemonConnection = new MoneroRpcConnection(daemonUriOrConfig);
  self.wallet = await MoneroWalletCore.createWalletRandom("", password, networkType, daemonConnection, language);
  postMessage(["onCreateWalletRandom"]);
}

self.createWalletFromMnemonic = async function(password, networkType, mnemonic, daemonUriOrConfig, restoreHeight, seedOffset) {
  let daemonConnection = new MoneroRpcConnection(daemonUriOrConfig);
  self.wallet = await MoneroWalletCore.createWalletFromMnemonic("", password, networkType, mnemonic, daemonConnection, restoreHeight, seedOffset);
  postMessage(["onCreateWalletFromMnemonic"]);
}

///**
// * Get the wallet's network type (mainnet, testnet, or stagenet).
// * 
// * @return {MoneroNetworkType} the wallet's network type
// */
//async getNetworkType() {
//  throw new Error("Not implemented");
//}
//
//async getVersion() {
//  throw new Error("Not implemented");
//}
//
//getPath() {
//  throw new Error("Not implemented");
//}

self.getMnemonic = async function() {
  try {
    postMessage(["onGetMnemonic", {result: await self.wallet.getMnemonic()}]);
  } catch (e) {
    postMessage(["onGetMnemonic", {error: e.message}]);
  }
}

//async getMnemonicLanguage() {
//  throw new Error("Not implemented");
//}
//
//async getMnemonicLanguages() {
//  throw new Error("Not implemented");
//}
//
//async getPrivateSpendKey() {
//  throw new Error("Not implemented");
//}
//
//async getPrivateViewKey() {
//  throw new Error("Not implemented");
//}
//
//async getPublicViewKey() {
//  throw new Error("Not implemented");
//}
//
//async getPublicSpendKey() {
//  throw new Error("Not implemented");
//}

self.getAddress = async function(accountIdx, subaddressIdx) {
  try {
    postMessage(["onGetAddress", {result: await self.wallet.getAddress(accountIdx, subaddressIdx)}]);
  } catch (e) {
    postMessage(["onGetAddress", {error: e.message}]);
  }
}

//async getAddressIndex(address) {
//  throw new Error("Not implemented");
//}
//
//getAccounts() {
//  throw new Error("Not implemented");
//}
//
//async setDaemonConnection(uriOrRpcConnection, username, password) {
//  throw new Error("Not implemented");
//}
//
///**
// * Get the wallet's daemon connection.
// * 
// * @return {MoneroRpcConnection} the wallet's daemon connection
// */
//async getDaemonConnection() {
//  throw new Error("Not implemented");
//}

self.getDaemonConnection = async function() {
  try {
    postMessage(["onGetDaemonConnection", {result: (await self.wallet.getDaemonConnection()).getConfig()}]);
  } catch (e) {
    postMessage(["onGetDaemonConnection", {error: e.message}]);
  }
}

//
///**
// * Indicates if the wallet is connected to daemon.
// * 
// * @return {boolean} true if the wallet is connected to a daemon, false otherwise
// */
//async isConnected() {
//  throw new Error("Not implemented");
//}

self.isConnected = async function() {
  try {
    postMessage(["onIsConnected", {result: await self.wallet.isConnected()}]);
  } catch (e) {
    postMessage(["onIsConnected", {error: e.message}]);
  }
}

self.getRestoreHeight = async function() {
  try {
    postMessage(["onGetRestoreHeight", {result: await self.wallet.getRestoreHeight()}]);
  } catch (e) {
    postMessage(["onGetRestoreHeight", {error: e.message}]);
  }
}

self.getDaemonHeight = async function() {
  try {
    postMessage(["onGetDaemonHeight", {result: await self.wallet.getDaemonHeight()}]);
  } catch (e) {
    postMessage(["onGetDaemonHeight", {error: e.message}]);
  }
}

self.getDaemonMaxPeerHeight = async function() {
  try {
    postMessage(["onGetDaemonMaxPeerHeight", {result: await self.wallet.getDaemonMaxPeerHeight()}]);
  } catch (e) {
    postMessage(["onGetDaemonMaxPeerHeight", {error: e.message}]);
  }
}

///**
// * Set the height of the first block that the wallet scans.
// * 
// * @param {number} restoreHeight is the height of the first block that the wallet scans
// */
//async setRestoreHeight(restoreHeight) {
//  throw new Error("Not implemented");
//}
//
///**
// * Get the maximum height of the peers the wallet's daemon is connected to.
// *
// * @return {number} the maximum height of the peers the wallet's daemon is connected to
// */
//async getDaemonMaxPeerHeight() {
//  throw new Error("Not implemented");
//}
//
///**
// * Indicates if the wallet's daemon is synced with the network.
// * 
// * @return {boolean} true if the daemon is synced with the network, false otherwise
// */
//async isDaemonSynced() {
//  throw new Error("Not implemented");
//}

self.isDaemonSynced = async function() {
  try {
    postMessage(["onIsDaemonSynced", {result: await self.wallet.isDaemonSynced()}]);
  } catch (e) {
    postMessage(["onIsDaemonSynced", {error: e.message}]);
  }
}

self.getHeight = async function() {
  try {
    postMessage(["onGetHeight", {result: await self.wallet.getHeight()}]);
  } catch (e) {
    postMessage(["onGetHeight", {error: e.message}]);
  }
}

self.addListener = async function(listenerId) {
  
  /**
   * Internal listener to bridge notifications to external listeners.
   * 
   * TODO: MoneroWalletListener is not defined until scripts imported
   */
  class WalletWorkerHelperListener extends MoneroWalletListener {
    
    constructor(id, worker) {
      super();
      this.id = id;
      this.worker = worker;
    }
    
    getId() {
      return this.id;
    }
    
    onSyncProgress(height, startHeight, endHeight, percentDone, message) {
      this.worker.postMessage(["onSyncProgress_" + this.getId(), height, startHeight, endHeight, percentDone, message]);
    }

    onNewBlock(height) { 
      this.worker.postMessage(["onNewBlock_" + this.getId(), height]);
    }

    onOutputReceived(output) {
      let block = output.getTx().getBlock();
      if (block === undefined) block = new MoneroBlock().setTxs([output.getTx()]);
      this.worker.postMessage(["onOutputReceived_" + this.getId(), block.toJson()]);  // serialize from root block
    }
    
    onOutputSpent(output) {
      let block = output.getTx().getBlock();
      if (block === undefined) block = new MoneroBlock().setTxs([output.getTx()]);
      this.worker.postMessage(["onOutputSpent_" + this.getId(), block.toJson()]);     // serialize from root block
    }
  }
  
  let listener = new WalletWorkerHelperListener(listenerId, self);
  if (!self.listeners) self.listeners = [];
  self.listeners.push(listener);
  await self.wallet.addListener(listener);
}

self.removeListener = async function(listenerId) {
  for (let i = 0; i < self.listeners.length; i++) {
    if (self.listeners[i].getId() !== listenerId) continue;
    await self.wallet.removeListener(self.listeners[i]);
    self.listeners.splice(i, 1);
    return;
  }
  throw new MoneroError("Listener is not registered to wallet");
}

self.isSynced = async function() {
  try {
    postMessage(["onIsSynced", {result: await self.wallet.isSynced()}]);
  } catch (e) {
    postMessage(["onIsSynced", {error: e.message}]);
  }
}

self.sync = async function() {
  try {
    postMessage(["onSync", {result: await self.wallet.sync()}]);
  } catch (e) {
    postMessage(["onSync", {error: e.message}]);
  }
}

self.startSyncing = async function() {
  try {
    await self.wallet.startSyncing()
    postMessage(["onStartSyncing"]);
  } catch (e) {
    assert(e.message);
    postMessage(["onStartSyncing", e.message]);
  }
}

self.stopSyncing = async function() {
  postMessage(["onStopSyncing", await self.wallet.stopSyncing()]);
}

//// rescanSpent
//// rescanBlockchain

self.getBalance = async function() {
  postMessage(["onGetBalance", (await self.wallet.getBalance()).toString()]);
}

self.getUnlockedBalance = async function() {
  postMessage(["onGetUnlockedBalance", (await self.wallet.getUnlockedBalance()).toString()]);
}

//async getAccounts(includeSubaddresses, tag) {
//  throw new MoneroError("Not implemented");
//}
//
//async getAccount(accountIdx, includeSubaddresses) {
//  throw new MoneroError("Not implemented");
//}
//
//async createAccount(label) {
//  throw new MoneroError("Not implemented");
//}
//
//async getSubaddresses(accountIdx, subaddressIndices) {
//  throw new MoneroError("Not implemented");
//}
//
//async createSubaddress(accountIdx, label) {
//  throw new MoneroError("Not implemented");
//}

// TODO: easier or more efficient way than serializing from root blocks?
self.getTxs = async function(blockJsonQuery) {
  let query = new MoneroBlock(blockJsonQuery, MoneroBlock.DeserializationType.TX_QUERY).getTxs()[0];
  let txs = await self.wallet.getTxs(query);
  
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
  
  // wrap and serialize response
  postMessage(["onGetTxs", JSON.stringify({blocks: blocks})]);
}

//async getTransfers(query) {
//  throw new MoneroError("Not implemented");
//}
//
//async getOutputs(query) {
//  throw new MoneroError("Not implemented");
//}
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

self.sendSplit = async function(requestOrAccountIndex, address, amount, priority) {
  if (typeof requestOrAccountIndex === "object") requestOrAccountIndex = new MoneroSendRequest(requestOrAccountIndex);
  postMessage(["onSendSplit", (await self.wallet.sendSplit(requestOrAccountIndex, address, amount, priority)).toJson()]);
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
//
//async getAttribute(key) {
//  throw new MoneroError("Not implemented");
//}
//
//async setAttribute(key, val) {
//  throw new MoneroError("Not implemented");
//}
//
//async startMining(numThreads, backgroundMining, ignoreBattery) {
//  throw new MoneroError("Not implemented");
//}
//
//async stopMining() {
//  throw new MoneroError("Not implemented");
//}
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
//
//async isClosed() {
//  throw new Error("Not implemented");
//}
//
//async close() {
//  throw new Error("Not implemented");
//}