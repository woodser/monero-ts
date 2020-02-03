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
  let daemonConnection = daemonUriOrConfig ? new MoneroRpcConnection(daemonUriOrConfig) : undefined;
  self.wallet = await MoneroWalletCore.createWalletRandom("", password, networkType, daemonConnection, language);
  postMessage(["onCreateWalletRandom"]);
}

self.createWalletFromMnemonic = async function(password, networkType, mnemonic, daemonUriOrConfig, restoreHeight, seedOffset) {
  let daemonConnection = daemonUriOrConfig ? new MoneroRpcConnection(daemonUriOrConfig) : undefined;
  self.wallet = await MoneroWalletCore.createWalletFromMnemonic("", password, networkType, mnemonic, daemonConnection, restoreHeight, seedOffset);
  postMessage(["onCreateWalletFromMnemonic"]);
}

self.getNetworkType = async function() {
  try {
    postMessage(["onGetNetworkType", {result: await self.wallet.getNetworkType()}]);
  } catch (e) {
    postMessage(["onGetNetworkType", {error: e.message}]);
  }
}

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

self.getMnemonicLanguage = async function() {
  try {
    postMessage(["onGetMnemonicLanguage", {result: await self.wallet.getMnemonicLanguage()}]);
  } catch (e) {
    postMessage(["onGetMnemonicLanguage", {error: e.message}]);
  }
}

self.getMnemonicLanguages = async function() {
  try {
    postMessage(["onGetMnemonicLanguages", {result: await self.wallet.getMnemonicLanguages()}]);
  } catch (e) {
    postMessage(["onGetMnemonicLanguages", {error: e.message}]);
  }
}

self.getPrivateSpendKey = async function() {
  try {
    postMessage(["onGetPrivateSpendKey", {result: await self.wallet.getPrivateSpendKey()}]);
  } catch (e) {
    postMessage(["onGetPrivateSpendKey", {error: e.message}]);
  }
}

self.getPrivateViewKey = async function() {
  try {
    postMessage(["onGetPrivateViewKey", {result: await self.wallet.getPrivateViewKey()}]);
  } catch (e) {
    postMessage(["onGetPrivateViewKey", {error: e.message}]);
  }
}

self.getPublicViewKey = async function() {
  try {
    postMessage(["onGetPublicViewKey", {result: await self.wallet.getPublicViewKey()}]);
  } catch (e) {
    postMessage(["onGetPublicViewKey", {error: e.message}]);
  }
}

self.getPublicSpendKey = async function() {
  try {
    postMessage(["onGetPublicSpendKey", {result: await self.wallet.getPublicSpendKey()}]);
  } catch (e) {
    postMessage(["onGetPublicSpendKey", {error: e.message}]);
  }
}

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

self.setDaemonConnection = async function(config) {
  try {
    postMessage(["onSetDaemonConnection", {result: await self.wallet.setDaemonConnection(config ? new MoneroRpcConnection(config) : undefined)}]);
  } catch (e) {
    postMessage(["onSetDaemonConnection", {error: e.message}]);
  }
}

self.getDaemonConnection = async function() {
  try {
    let connection = await self.wallet.getDaemonConnection();
    postMessage(["onGetDaemonConnection", {result: connection ? connection.getConfig() : undefined}]);
  } catch (e) {
    postMessage(["onGetDaemonConnection", {error: e.message}]);
  }
}

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

self.setRestoreHeight = async function(restoreHeight) {
  try {
    postMessage(["onSetRestoreHeight", {result: await self.wallet.setRestoreHeight(restoreHeight)}]);
  } catch (e) {
    postMessage(["onSetRestoreHeight", {error: e.message}]);
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
  throw new MoneroError("Listener is not registered to wallet");  // TODO: call onAddListener, onRemoveListener which can catch exception
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
    postMessage(["onStartSyncing", {result: await self.wallet.startSyncing()}]);
  } catch (e) {
    postMessage(["onStartSyncing", {error: e.message}]);
  }
}

self.stopSyncing = async function() {
  try {
    postMessage(["onStopSyncing", {result: await self.wallet.stopSyncing()}]);
  } catch (e) {
    postMessage(["onStopSyncing", {error: e.message}]);
  }
}

//// rescanSpent
//// rescanBlockchain

self.getBalance = async function(accountIdx, subaddressIdx) {
  try {
    postMessage(["onGetBalance", {result: (await self.wallet.getBalance(accountIdx, subaddressIdx)).toString()}]);
  } catch (e) {
    postMessage(["onGetBalance", {error: e.message}]);
  }
}

self.getUnlockedBalance = async function(accountIdx, subaddressIdx) {
  try {
    postMessage(["onGetUnlockedBalance", {result: (await self.wallet.getUnlockedBalance(accountIdx, subaddressIdx)).toString()}]);
  } catch (e) {
    postMessage(["onGetUnlockedBalance", {error: e.message}]);
  }
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


self.getAttribute = async function(key) {
  try {
    postMessage(["onGetAttribute", {result: await self.wallet.getAttribute(key)}]);
  } catch (e) {
    postMessage(["onGetAttribute", {error: e.message}]);
  }
}

self.setAttribute = async function(key, value) {
  try {
    postMessage(["onSetAttribute", {result: await self.wallet.setAttribute(key, value)}]);
  } catch (e) {
    postMessage(["onSetAttribute", {error: e.message}]);
  }
}

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

self.getData = async function() {
  try {
    postMessage(["onGetData", {result: await self.wallet.getData()}]);
  } catch (e) {
    postMessage(["onGetData", {error: e.message}]);
  }
}

self.isClosed = async function() {
  try {
    postMessage(["onIsClosed", {result: await self.wallet.isClosed()}]);
  } catch (e) {
    postMessage(["onIsClosed", {error: e.message}]);
  }
}

self.close = async function(save) {
  try {
    postMessage(["onClose", {result: await self.wallet.close(save)}]);
  } catch (e) {
    postMessage(["onClose", {error: e.message}]);
  }
}