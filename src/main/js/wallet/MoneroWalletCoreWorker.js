/**
 * Web worker to run a core wallet managed by messages.
 * 
 * This file must be copied to the web app root.
 * 
 * Required format for wallet instance methods: e.data[0] = walletId, e.data[1] = function name, e.data[2+] = function args
 * 
 * TODO: refactor try..catches to common method which takes function and args to execute
 */
onmessage = async function(e) {
  await self.initOneTime();
  if (!self[e.data[1]]) throw new Error("Method '" + e.data[1] + "' is not registered with worker");
  let fnName = e.data.splice(1, 1);  // remove function name
  self[fnName].apply(null, e.data);
}

self.initOneTime = async function() {
  if (!self.isInitialized) {
    self.wallets = {};
    self.isInitialized = true;
    console.log("WORKER loading scripts and module");
    self.importScripts('monero-javascript-wasm.js');  // TODO: move to top?
    self.importScripts('worker_imports.js');
    await MoneroUtils.loadWasmModule();
    console.log("done loading scripts and module");
  }
}

//--------------------------- WALLET STATIC UTILS -----------------------------

self.openWalletData = async function(walletId, password, networkType, keysData, cacheData, daemonUriOrConfig) {
  try {
    let daemonConnection = daemonUriOrConfig ? new MoneroRpcConnection(daemonUriOrConfig) : undefined;
    self.wallets[walletId] = await MoneroWalletCore.openWalletData(password, networkType, keysData, cacheData, daemonConnection);
    postMessage([walletId, "onOpenWalletData"]);
  } catch (e) {
    postMessage([walletId, "onOpenWalletData", {error: e.message}]);
  }
}

self.createWalletRandom = async function(walletId, password, networkType, daemonUriOrConfig, language) {
  try {
    let daemonConnection = daemonUriOrConfig ? new MoneroRpcConnection(daemonUriOrConfig) : undefined;
    self.wallets[walletId] = await MoneroWalletCore.createWalletRandom("", password, networkType, daemonConnection, language);
    postMessage([walletId, "onCreateWalletRandom"]);
  } catch (e) {
    postMessage([walletId, "onCreateWalletRandom", {error: e.message}]);
  }
}

self.createWalletFromMnemonic = async function(walletId, password, networkType, mnemonic, daemonUriOrConfig, restoreHeight, seedOffset) {
  try {
    let daemonConnection = daemonUriOrConfig ? new MoneroRpcConnection(daemonUriOrConfig) : undefined;
    self.wallets[walletId] = await MoneroWalletCore.createWalletFromMnemonic("", password, networkType, mnemonic, daemonConnection, restoreHeight, seedOffset);
    postMessage([walletId, "onCreateWalletFromMnemonic"]);
  } catch (e) {
    postMessage([walletId, "onCreateWalletFromMnemonic", {error: e.message}]);
  }
}

self.createWalletFromKeys = async function(walletId, password, networkType, address, viewKey, spendKey, daemonUriOrConfig, restoreHeight, language) {
  try {
    let daemonConnection = daemonUriOrConfig ? new MoneroRpcConnection(daemonUriOrConfig) : undefined;
    self.wallets[walletId] = await MoneroWalletCore.createWalletFromKeys("", password, networkType, address, viewKey, spendKey, daemonConnection, restoreHeight, language);
    postMessage([walletId, "onCreateWalletFromKeys"]);
  } catch (e) {
    postMessage([walletId, "onCreateWalletFromKeys", {error: e.message}]);
  }
}

// ------------------------- WALLET INSTANCE METHODS --------------------------

self.getNetworkType = async function(walletId) {
  try {
    postMessage([walletId, "onGetNetworkType", {result: await self.wallets[walletId].getNetworkType()}]);
  } catch (e) {
    postMessage([walletId, "onGetNetworkType", {error: e.message}]);
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

self.getMnemonic = async function(walletId) {
  try {
    postMessage([walletId, "onGetMnemonic", {result: await self.wallets[walletId].getMnemonic()}]);
  } catch (e) {
    postMessage([walletId, "onGetMnemonic", {error: e.message}]);
  }
}

self.getMnemonicLanguage = async function(walletId) {
  try {
    postMessage([walletId, "onGetMnemonicLanguage", {result: await self.wallets[walletId].getMnemonicLanguage()}]);
  } catch (e) {
    postMessage([walletId, "onGetMnemonicLanguage", {error: e.message}]);
  }
}

self.getMnemonicLanguages = async function(walletId) {
  try {
    postMessage([walletId, "onGetMnemonicLanguages", {result: await self.wallets[walletId].getMnemonicLanguages()}]);
  } catch (e) {
    postMessage([walletId, "onGetMnemonicLanguages", {error: e.message}]);
  }
}

self.getPrivateSpendKey = async function(walletId) {
  try {
    postMessage([walletId, "onGetPrivateSpendKey", {result: await self.wallets[walletId].getPrivateSpendKey()}]);
  } catch (e) {
    postMessage([walletId, "onGetPrivateSpendKey", {error: e.message}]);
  }
}

self.getPrivateViewKey = async function(walletId) {
  try {
    postMessage([walletId, "onGetPrivateViewKey", {result: await self.wallets[walletId].getPrivateViewKey()}]);
  } catch (e) {
    postMessage([walletId, "onGetPrivateViewKey", {error: e.message}]);
  }
}

self.getPublicViewKey = async function(walletId) {
  try {
    postMessage([walletId, "onGetPublicViewKey", {result: await self.wallets[walletId].getPublicViewKey()}]);
  } catch (e) {
    postMessage([walletId, "onGetPublicViewKey", {error: e.message}]);
  }
}

self.getPublicSpendKey = async function(walletId) {
  try {
    postMessage([walletId, "onGetPublicSpendKey", {result: await self.wallets[walletId].getPublicSpendKey()}]);
  } catch (e) {
    postMessage([walletId, "onGetPublicSpendKey", {error: e.message}]);
  }
}

self.getAddress = async function(walletId, accountIdx, subaddressIdx) {
  try {
    postMessage([walletId, "onGetAddress", {result: await self.wallets[walletId].getAddress(accountIdx, subaddressIdx)}]);
  } catch (e) {
    postMessage([walletId, "onGetAddress", {error: e.message}]);
  }
}

self.getAddressIndex = async function(walletId, address) {
  try {
    postMessage([walletId, "onGetAddressIndex", {result: await self.wallets[walletId].getAddressIndex(address)}]);
  } catch (e) {
    postMessage([walletId, "onGetAddressIndex", {error: e.message}]);
  }
}

//getAccounts() {
//  throw new Error("Not implemented");
//}
//
//async setDaemonConnection(uriOrRpcConnection, username, password) {
//  throw new Error("Not implemented");
//}

self.setDaemonConnection = async function(walletId, config) {
  try {
    postMessage([walletId, "onSetDaemonConnection", {result: await self.wallets[walletId].setDaemonConnection(config ? new MoneroRpcConnection(config) : undefined)}]);
  } catch (e) {
    postMessage([walletId, "onSetDaemonConnection", {error: e.message}]);
  }
}

self.getDaemonConnection = async function(walletId) {
  try {
    let connection = await self.wallets[walletId].getDaemonConnection();
    postMessage([walletId, "onGetDaemonConnection", {result: connection ? connection.getConfig() : undefined}]);
  } catch (e) {
    postMessage([walletId, "onGetDaemonConnection", {error: e.message}]);
  }
}

self.isConnected = async function(walletId) {
  try {
    postMessage([walletId, "onIsConnected", {result: await self.wallets[walletId].isConnected()}]);
  } catch (e) {
    postMessage([walletId, "onIsConnected", {error: e.message}]);
  }
}

self.getRestoreHeight = async function(walletId) {
  try {
    postMessage([walletId, "onGetRestoreHeight", {result: await self.wallets[walletId].getRestoreHeight()}]);
  } catch (e) {
    postMessage([walletId, "onGetRestoreHeight", {error: e.message}]);
  }
}

self.setRestoreHeight = async function(walletId, restoreHeight) {
  try {
    postMessage([walletId, "onSetRestoreHeight", {result: await self.wallets[walletId].setRestoreHeight(restoreHeight)}]);
  } catch (e) {
    postMessage([walletId, "onSetRestoreHeight", {error: e.message}]);
  }
}

self.getDaemonHeight = async function(walletId) {
  try {
    postMessage([walletId, "onGetDaemonHeight", {result: await self.wallets[walletId].getDaemonHeight()}]);
  } catch (e) {
    postMessage([walletId, "onGetDaemonHeight", {error: e.message}]);
  }
}

self.getDaemonMaxPeerHeight = async function(walletId) {
  try {
    postMessage([walletId, "onGetDaemonMaxPeerHeight", {result: await self.wallets[walletId].getDaemonMaxPeerHeight()}]);
  } catch (e) {
    postMessage([walletId, "onGetDaemonMaxPeerHeight", {error: e.message}]);
  }
}

self.isDaemonSynced = async function(walletId) {
  try {
    postMessage([walletId, "onIsDaemonSynced", {result: await self.wallets[walletId].isDaemonSynced()}]);
  } catch (e) {
    postMessage([walletId, "onIsDaemonSynced", {error: e.message}]);
  }
}

self.getHeight = async function(walletId) {
  try {
    postMessage([walletId, "onGetHeight", {result: await self.wallets[walletId].getHeight()}]);
  } catch (e) {
    postMessage([walletId, "onGetHeight", {error: e.message}]);
  }
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
  await self.wallets[walletId].addListener(listener);
}

self.removeListener = async function(walletId, listenerId) {
  for (let i = 0; i < self.listeners.length; i++) {
    if (self.listeners[i].getId() !== listenerId) continue;
    await self.wallets[walletId].removeListener(self.listeners[i]);
    self.listeners.splice(i, 1);
    return;
  }
  throw new MoneroError("Listener is not registered to wallet");  // TODO: call onAddListener, onRemoveListener which can catch exception
}

self.isSynced = async function(walletId) {
  try {
    postMessage([walletId, "onIsSynced", {result: await self.wallets[walletId].isSynced()}]);
  } catch (e) {
    postMessage([walletId, "onIsSynced", {error: e.message}]);
  }
}

self.sync = async function(walletId, startHeight) {
  try {
    postMessage([walletId, "onSync", {result: await self.wallets[walletId].sync(startHeight)}]);
  } catch (e) {
    postMessage([walletId, "onSync", {error: e.message}]);
  }
}

self.startSyncing = async function(walletId) {
  try {
    postMessage([walletId, "onStartSyncing", {result: await self.wallets[walletId].startSyncing()}]);
  } catch (e) {
    postMessage([walletId, "onStartSyncing", {error: e.message}]);
  }
}

self.stopSyncing = async function(walletId) {
  try {
    postMessage([walletId, "onStopSyncing", {result: await self.wallets[walletId].stopSyncing()}]);
  } catch (e) {
    postMessage([walletId, "onStopSyncing", {error: e.message}]);
  }
}

//// rescanSpent
//// rescanBlockchain

self.getBalance = async function(walletId, accountIdx, subaddressIdx) {
  try {
    postMessage([walletId, "onGetBalance", {result: (await self.wallets[walletId].getBalance(accountIdx, subaddressIdx)).toString()}]);
  } catch (e) {
    postMessage([walletId, "onGetBalance", {error: e.message}]);
  }
}

self.getUnlockedBalance = async function(walletId, accountIdx, subaddressIdx) {
  try {
    postMessage([walletId, "onGetUnlockedBalance", {result: (await self.wallets[walletId].getUnlockedBalance(accountIdx, subaddressIdx)).toString()}]);
  } catch (e) {
    postMessage([walletId, "onGetUnlockedBalance", {error: e.message}]);
  }
}

self.getAccounts = async function(walletId, includeSubaddresses, tag) {
  try {
    let accountJsons = [];
    for (let account of await self.wallets[walletId].getAccounts(includeSubaddresses, tag)) accountJsons.push(account.toJson());
    postMessage([walletId, "onGetAccounts", {result: accountJsons}]);
  } catch (e) {
    postMessage([walletId, "onGetAccounts", {error: e.message}]);
  }
}

self.getAccount = async function(walletId, accountIdx, includeSubaddresses) {
  try {
    postMessage([walletId, "onGetAccount", {result: (await self.wallets[walletId].getAccount(accountIdx, includeSubaddresses)).toJson()}]);
  } catch (e) {
    postMessage([walletId, "onGetAccount", {error: e.message}]);
  }
}

self.createAccount = async function(walletId, label) {
  try {
    postMessage([walletId, "onCreateAccount", {result: (await self.wallets[walletId].createAccount(label)).toJson()}]);
  } catch (e) {
    postMessage([walletId, "onCreateAccount", {error: e.message}]);
  }
}

self.getSubaddresses = async function(walletId, accountIdx, subaddressIndices) {
  try {
    let subaddressJsons = [];
    for (let subaddress of await self.wallets[walletId].getSubaddresses(accountIdx, subaddressIndices)) subaddressJsons.push(subaddress.toJson());
    postMessage([walletId, "onGetSubaddresses", {result: subaddressJsons}]);
  } catch (e) {
    postMessage([walletId, "onGetSubaddresses", {error: e.message}]);
  }
}

self.createSubaddress = async function(walletId, accountIdx, label) {
  try {
    postMessage([walletId, "onCreateSubaddress", {result: (await self.wallets[walletId].createSubaddress(accountIdx, label)).toJson()}]);
  } catch (e) {
    postMessage([walletId, "onCreateSubaddress", {error: e.message}]);
  }
}

// TODO: easier or more efficient way than serializing from root blocks?
self.getTxs = async function(walletId, blockJsonQuery) {
  try {
    
    // deserialize query which is json string rooted at block
    let query = new MoneroBlock(blockJsonQuery, MoneroBlock.DeserializationType.TX_QUERY).getTxs()[0];
    
    // get txs
    let txs = await self.wallets[walletId].getTxs(query);
    
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
    postMessage([walletId, "onGetTxs", {result: blocks}]);
  } catch (e) {
    postMessage([walletId, "onGetTxs", {error: e.message}]);
  }
}

self.getTransfers = async function(walletId, blockJsonQuery) {
  try {
    
    // deserialize query which is json string rooted at block
    let query = new MoneroBlock(blockJsonQuery, MoneroBlock.DeserializationType.TX_QUERY).getTxs()[0].getTransferQuery();
    
    // get transfers
    let transfers = await self.wallets[walletId].getTransfers(query);
    
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
    
    // wrap and serialize response
    postMessage([walletId, "onGetTransfers", {result: blocks}]);
  } catch (e) {
    postMessage([walletId, "onGetTransfers", {error: e.message}]);
  }
}

self.getOutputs = async function(walletId, blockJsonQuery) {
  try {
    
    // deserialize query which is json string rooted at block
    let query = new MoneroBlock(blockJsonQuery, MoneroBlock.DeserializationType.TX_QUERY).getTxs()[0].getOutputQuery();
    
    // get outputs
    let outputs = await self.wallets[walletId].getOutputs(query);
    
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
    
    // wrap and serialize response
    postMessage([walletId, "onGetOutputs", {result: blocks}]);
  } catch (e) {
    postMessage([walletId, "onGetOutputs", {error: e.message}]);
  }
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
  try {
    if (typeof requestOrAccountIndex === "object") requestOrAccountIndex = new MoneroSendRequest(requestOrAccountIndex);
    postMessage([walletId, "onSendSplit", {result: (await self.wallets[walletId].sendSplit(requestOrAccountIndex, address, amount, priority)).toJson()}]);
  } catch (e) {
    postMessage([walletId, "onSendSplit", {error: e.message}]);
  }
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
  try {
    postMessage([walletId, "onGetAttribute", {result: await self.wallets[walletId].getAttribute(key)}]);
  } catch (e) {
    postMessage([walletId, "onGetAttribute", {error: e.message}]);
  }
}

self.setAttribute = async function(walletId, key, value) {
  try {
    postMessage([walletId, "onSetAttribute", {result: await self.wallets[walletId].setAttribute(key, value)}]);
  } catch (e) {
    postMessage([walletId, "onSetAttribute", {error: e.message}]);
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

self.getData = async function(walletId) {
  try {
    postMessage([walletId, "onGetData", {result: await self.wallets[walletId].getData()}]);
  } catch (e) {
    postMessage([walletId, "onGetData", {error: e.message}]);
  }
}

self.isClosed = async function(walletId) {
  try {
    postMessage([walletId, "onIsClosed", {result: await self.wallets[walletId].isClosed()}]);
  } catch (e) {
    postMessage([walletId, "onIsClosed", {error: e.message}]);
  }
}

self.close = async function(walletId, save) {
  try {
    postMessage([walletId, "onClose", {result: await self.wallets[walletId].close(save)}]);
  } catch (e) {
    postMessage([walletId, "onClose", {error: e.message}]);
  }
}