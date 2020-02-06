/**
 * Web worker to manage a core wallet and/or daemon with messages off the main chain.
 * 
 * Required message format: e.data[0] = object id, e.data[1] = function name, e.data[2+] = function args

 * This file must be copied to the web app root.  // TODO: exportable in MoneroModel.js?
 * 
 * TODO: refactor try..catches to common method which takes function and args to execute
 */
onmessage = async function(e) {
  await this.initOneTime();
  assert(e.data[0], "Must provide object id to apply function to");
  if (!this[e.data[1]]) throw new Error("Method '" + e.data[1] + "' is not registered with worker");
  let fnName = e.data.splice(1, 1);  // remove function name
  this[fnName].apply(null, e.data);
}

this.initOneTime = async function() {
  if (!this.isInitialized) {
    this.WORKER_OBJECTS = {};
    this.isInitialized = true;
    console.log("WORKER loading scripts and module");
    this.importScripts('monero-javascript-wasm.js');  // TODO: move to top?
    this.importScripts('worker_imports.js');
    await MoneroUtils.loadWasmModule(); // TODO: only necessary if using wasm, wasteful if using daemon rpc
    console.log("done loading scripts and module");
  }
}

//----------------------------- DAEMON METHODS --------------------------------

this.createDaemonRpc = async function(daemonId, daemonUriOrConfig) {
  try {
    this.WORKER_OBJECTS[daemonId] = new MoneroDaemonRpc(daemonUriOrConfig);
    postMessage([daemonId, "onCreateDaemonRpc"]);
  } catch (e) {
    postMessage([daemonId, "onCreateDaemonRpc", {error: e.message}]);
  }
}

this.getNextBlockHeader = async function(daemonId) {
  try {
    postMessage([daemonId, "onGetNextBlockHeader", {result: (await this.WORKER_OBJECTS[daemonId].getNextBlockHeader()).toJson()}]);
  } catch (e) {
    postMessage([daemonId, "onGetNextBlockHeader", {error: e.message}]);
  }
}

//------------------------------ WALLET METHODS -------------------------------

this.openWalletData = async function(walletId, password, networkType, keysData, cacheData, daemonUriOrConfig) {
  try {
    let daemonConnection = daemonUriOrConfig ? new MoneroRpcConnection(daemonUriOrConfig) : undefined;
    this.WORKER_OBJECTS[walletId] = await MoneroWalletCore.openWalletData(password, networkType, keysData, cacheData, daemonConnection);
    postMessage([walletId, "onOpenWalletData"]);
  } catch (e) {
    postMessage([walletId, "onOpenWalletData", {error: e.message}]);
  }
}

this.createWalletRandom = async function(walletId, password, networkType, daemonUriOrConfig, language) {
  try {
    let daemonConnection = daemonUriOrConfig ? new MoneroRpcConnection(daemonUriOrConfig) : undefined;
    this.WORKER_OBJECTS[walletId] = await MoneroWalletCore.createWalletRandom("", password, networkType, daemonConnection, language);
    postMessage([walletId, "onCreateWalletRandom"]);
  } catch (e) {
    postMessage([walletId, "onCreateWalletRandom", {error: e.message}]);
  }
}

this.createWalletFromMnemonic = async function(walletId, password, networkType, mnemonic, daemonUriOrConfig, restoreHeight, seedOffset) {
  try {
    let daemonConnection = daemonUriOrConfig ? new MoneroRpcConnection(daemonUriOrConfig) : undefined;
    this.WORKER_OBJECTS[walletId] = await MoneroWalletCore.createWalletFromMnemonic("", password, networkType, mnemonic, daemonConnection, restoreHeight, seedOffset);
    postMessage([walletId, "onCreateWalletFromMnemonic"]);
  } catch (e) {
    postMessage([walletId, "onCreateWalletFromMnemonic", {error: e.message}]);
  }
}

this.createWalletFromKeys = async function(walletId, password, networkType, address, viewKey, spendKey, daemonUriOrConfig, restoreHeight, language) {
  try {
    let daemonConnection = daemonUriOrConfig ? new MoneroRpcConnection(daemonUriOrConfig) : undefined;
    this.WORKER_OBJECTS[walletId] = await MoneroWalletCore.createWalletFromKeys("", password, networkType, address, viewKey, spendKey, daemonConnection, restoreHeight, language);
    postMessage([walletId, "onCreateWalletFromKeys"]);
  } catch (e) {
    postMessage([walletId, "onCreateWalletFromKeys", {error: e.message}]);
  }
}

this.getNetworkType = async function(walletId) {
  try {
    postMessage([walletId, "onGetNetworkType", {result: await this.WORKER_OBJECTS[walletId].getNetworkType()}]);
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

this.getMnemonic = async function(walletId) {
  try {
    postMessage([walletId, "onGetMnemonic", {result: await this.WORKER_OBJECTS[walletId].getMnemonic()}]);
  } catch (e) {
    postMessage([walletId, "onGetMnemonic", {error: e.message}]);
  }
}

this.getMnemonicLanguage = async function(walletId) {
  try {
    postMessage([walletId, "onGetMnemonicLanguage", {result: await this.WORKER_OBJECTS[walletId].getMnemonicLanguage()}]);
  } catch (e) {
    postMessage([walletId, "onGetMnemonicLanguage", {error: e.message}]);
  }
}

this.getMnemonicLanguages = async function(walletId) {
  try {
    postMessage([walletId, "onGetMnemonicLanguages", {result: await this.WORKER_OBJECTS[walletId].getMnemonicLanguages()}]);
  } catch (e) {
    postMessage([walletId, "onGetMnemonicLanguages", {error: e.message}]);
  }
}

this.getPrivateSpendKey = async function(walletId) {
  try {
    postMessage([walletId, "onGetPrivateSpendKey", {result: await this.WORKER_OBJECTS[walletId].getPrivateSpendKey()}]);
  } catch (e) {
    postMessage([walletId, "onGetPrivateSpendKey", {error: e.message}]);
  }
}

this.getPrivateViewKey = async function(walletId) {
  try {
    postMessage([walletId, "onGetPrivateViewKey", {result: await this.WORKER_OBJECTS[walletId].getPrivateViewKey()}]);
  } catch (e) {
    postMessage([walletId, "onGetPrivateViewKey", {error: e.message}]);
  }
}

this.getPublicViewKey = async function(walletId) {
  try {
    postMessage([walletId, "onGetPublicViewKey", {result: await this.WORKER_OBJECTS[walletId].getPublicViewKey()}]);
  } catch (e) {
    postMessage([walletId, "onGetPublicViewKey", {error: e.message}]);
  }
}

this.getPublicSpendKey = async function(walletId) {
  try {
    postMessage([walletId, "onGetPublicSpendKey", {result: await this.WORKER_OBJECTS[walletId].getPublicSpendKey()}]);
  } catch (e) {
    postMessage([walletId, "onGetPublicSpendKey", {error: e.message}]);
  }
}

this.getAddress = async function(walletId, accountIdx, subaddressIdx) {
  try {
    postMessage([walletId, "onGetAddress", {result: await this.WORKER_OBJECTS[walletId].getAddress(accountIdx, subaddressIdx)}]);
  } catch (e) {
    postMessage([walletId, "onGetAddress", {error: e.message}]);
  }
}

this.getAddressIndex = async function(walletId, address) {
  try {
    postMessage([walletId, "onGetAddressIndex", {result: await this.WORKER_OBJECTS[walletId].getAddressIndex(address)}]);
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

this.setDaemonConnection = async function(walletId, config) {
  try {
    postMessage([walletId, "onSetDaemonConnection", {result: await this.WORKER_OBJECTS[walletId].setDaemonConnection(config ? new MoneroRpcConnection(config) : undefined)}]);
  } catch (e) {
    postMessage([walletId, "onSetDaemonConnection", {error: e.message}]);
  }
}

this.getDaemonConnection = async function(walletId) {
  try {
    let connection = await this.WORKER_OBJECTS[walletId].getDaemonConnection();
    postMessage([walletId, "onGetDaemonConnection", {result: connection ? connection.getConfig() : undefined}]);
  } catch (e) {
    postMessage([walletId, "onGetDaemonConnection", {error: e.message}]);
  }
}

this.isConnected = async function(walletId) {
  try {
    postMessage([walletId, "onIsConnected", {result: await this.WORKER_OBJECTS[walletId].isConnected()}]);
  } catch (e) {
    postMessage([walletId, "onIsConnected", {error: e.message}]);
  }
}

this.getRestoreHeight = async function(walletId) {
  try {
    postMessage([walletId, "onGetRestoreHeight", {result: await this.WORKER_OBJECTS[walletId].getRestoreHeight()}]);
  } catch (e) {
    postMessage([walletId, "onGetRestoreHeight", {error: e.message}]);
  }
}

this.setRestoreHeight = async function(walletId, restoreHeight) {
  try {
    postMessage([walletId, "onSetRestoreHeight", {result: await this.WORKER_OBJECTS[walletId].setRestoreHeight(restoreHeight)}]);
  } catch (e) {
    postMessage([walletId, "onSetRestoreHeight", {error: e.message}]);
  }
}

this.getDaemonHeight = async function(walletId) {
  try {
    postMessage([walletId, "onGetDaemonHeight", {result: await this.WORKER_OBJECTS[walletId].getDaemonHeight()}]);
  } catch (e) {
    postMessage([walletId, "onGetDaemonHeight", {error: e.message}]);
  }
}

this.getDaemonMaxPeerHeight = async function(walletId) {
  try {
    postMessage([walletId, "onGetDaemonMaxPeerHeight", {result: await this.WORKER_OBJECTS[walletId].getDaemonMaxPeerHeight()}]);
  } catch (e) {
    postMessage([walletId, "onGetDaemonMaxPeerHeight", {error: e.message}]);
  }
}

this.isDaemonSynced = async function(walletId) {
  try {
    postMessage([walletId, "onIsDaemonSynced", {result: await this.WORKER_OBJECTS[walletId].isDaemonSynced()}]);
  } catch (e) {
    postMessage([walletId, "onIsDaemonSynced", {error: e.message}]);
  }
}

this.getHeight = async function(walletId) {
  try {
    postMessage([walletId, "onGetHeight", {result: await this.WORKER_OBJECTS[walletId].getHeight()}]);
  } catch (e) {
    postMessage([walletId, "onGetHeight", {error: e.message}]);
  }
}

this.addListener = async function(walletId, listenerId) {
  
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
  
  let listener = new WalletWorkerHelperListener(walletId, listenerId, this);
  if (!this.listeners) this.listeners = [];
  this.listeners.push(listener);
  await this.WORKER_OBJECTS[walletId].addListener(listener);
}

this.removeListener = async function(walletId, listenerId) {
  for (let i = 0; i < this.listeners.length; i++) {
    if (this.listeners[i].getId() !== listenerId) continue;
    await this.WORKER_OBJECTS[walletId].removeListener(this.listeners[i]);
    this.listeners.splice(i, 1);
    return;
  }
  throw new MoneroError("Listener is not registered to wallet");  // TODO: call onAddListener, onRemoveListener which can catch exception
}

this.isSynced = async function(walletId) {
  try {
    postMessage([walletId, "onIsSynced", {result: await this.WORKER_OBJECTS[walletId].isSynced()}]);
  } catch (e) {
    postMessage([walletId, "onIsSynced", {error: e.message}]);
  }
}

this.sync = async function(walletId, startHeight) {
  try {
    postMessage([walletId, "onSync", {result: await this.WORKER_OBJECTS[walletId].sync(startHeight)}]);
  } catch (e) {
    postMessage([walletId, "onSync", {error: e.message}]);
  }
}

this.startSyncing = async function(walletId) {
  try {
    postMessage([walletId, "onStartSyncing", {result: await this.WORKER_OBJECTS[walletId].startSyncing()}]);
  } catch (e) {
    postMessage([walletId, "onStartSyncing", {error: e.message}]);
  }
}

this.stopSyncing = async function(walletId) {
  try {
    postMessage([walletId, "onStopSyncing", {result: await this.WORKER_OBJECTS[walletId].stopSyncing()}]);
  } catch (e) {
    postMessage([walletId, "onStopSyncing", {error: e.message}]);
  }
}

//// rescanSpent
//// rescanBlockchain

this.getBalance = async function(walletId, accountIdx, subaddressIdx) {
  try {
    postMessage([walletId, "onGetBalance", {result: (await this.WORKER_OBJECTS[walletId].getBalance(accountIdx, subaddressIdx)).toString()}]);
  } catch (e) {
    postMessage([walletId, "onGetBalance", {error: e.message}]);
  }
}

this.getUnlockedBalance = async function(walletId, accountIdx, subaddressIdx) {
  try {
    postMessage([walletId, "onGetUnlockedBalance", {result: (await this.WORKER_OBJECTS[walletId].getUnlockedBalance(accountIdx, subaddressIdx)).toString()}]);
  } catch (e) {
    postMessage([walletId, "onGetUnlockedBalance", {error: e.message}]);
  }
}

this.getAccounts = async function(walletId, includeSubaddresses, tag) {
  try {
    let accountJsons = [];
    for (let account of await this.WORKER_OBJECTS[walletId].getAccounts(includeSubaddresses, tag)) accountJsons.push(account.toJson());
    postMessage([walletId, "onGetAccounts", {result: accountJsons}]);
  } catch (e) {
    postMessage([walletId, "onGetAccounts", {error: e.message}]);
  }
}

this.getAccount = async function(walletId, accountIdx, includeSubaddresses) {
  try {
    postMessage([walletId, "onGetAccount", {result: (await this.WORKER_OBJECTS[walletId].getAccount(accountIdx, includeSubaddresses)).toJson()}]);
  } catch (e) {
    postMessage([walletId, "onGetAccount", {error: e.message}]);
  }
}

this.createAccount = async function(walletId, label) {
  try {
    postMessage([walletId, "onCreateAccount", {result: (await this.WORKER_OBJECTS[walletId].createAccount(label)).toJson()}]);
  } catch (e) {
    postMessage([walletId, "onCreateAccount", {error: e.message}]);
  }
}

this.getSubaddresses = async function(walletId, accountIdx, subaddressIndices) {
  try {
    let subaddressJsons = [];
    for (let subaddress of await this.WORKER_OBJECTS[walletId].getSubaddresses(accountIdx, subaddressIndices)) subaddressJsons.push(subaddress.toJson());
    postMessage([walletId, "onGetSubaddresses", {result: subaddressJsons}]);
  } catch (e) {
    postMessage([walletId, "onGetSubaddresses", {error: e.message}]);
  }
}

this.createSubaddress = async function(walletId, accountIdx, label) {
  try {
    postMessage([walletId, "onCreateSubaddress", {result: (await this.WORKER_OBJECTS[walletId].createSubaddress(accountIdx, label)).toJson()}]);
  } catch (e) {
    postMessage([walletId, "onCreateSubaddress", {error: e.message}]);
  }
}

// TODO: easier or more efficient way than serializing from root blocks?
this.getTxs = async function(walletId, blockJsonQuery) {
  try {
    
    // deserialize query which is json string rooted at block
    let query = new MoneroBlock(blockJsonQuery, MoneroBlock.DeserializationType.TX_QUERY).getTxs()[0];
    
    // get txs
    let txs = await this.WORKER_OBJECTS[walletId].getTxs(query);
    
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

this.getTransfers = async function(walletId, blockJsonQuery) {
  try {
    
    // deserialize query which is json string rooted at block
    let query = new MoneroBlock(blockJsonQuery, MoneroBlock.DeserializationType.TX_QUERY).getTxs()[0].getTransferQuery();
    
    // get transfers
    let transfers = await this.WORKER_OBJECTS[walletId].getTransfers(query);
    
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

this.getOutputs = async function(walletId, blockJsonQuery) {
  try {
    
    // deserialize query which is json string rooted at block
    let query = new MoneroBlock(blockJsonQuery, MoneroBlock.DeserializationType.TX_QUERY).getTxs()[0].getOutputQuery();
    
    // get outputs
    let outputs = await this.WORKER_OBJECTS[walletId].getOutputs(query);
    
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

this.sendSplit = async function(walletId, requestOrAccountIndex, address, amount, priority) {
  try {
    if (typeof requestOrAccountIndex === "object") requestOrAccountIndex = new MoneroSendRequest(requestOrAccountIndex);
    postMessage([walletId, "onSendSplit", {result: (await this.WORKER_OBJECTS[walletId].sendSplit(requestOrAccountIndex, address, amount, priority)).toJson()}]);
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


this.getAttribute = async function(walletId, key) {
  try {
    postMessage([walletId, "onGetAttribute", {result: await this.WORKER_OBJECTS[walletId].getAttribute(key)}]);
  } catch (e) {
    postMessage([walletId, "onGetAttribute", {error: e.message}]);
  }
}

this.setAttribute = async function(walletId, key, value) {
  try {
    postMessage([walletId, "onSetAttribute", {result: await this.WORKER_OBJECTS[walletId].setAttribute(key, value)}]);
  } catch (e) {
    postMessage([walletId, "onSetAttribute", {error: e.message}]);
  }
}

this.startMining = async function(walletId, numThreads, backgroundMining, ignoreBattery) {
  try {
    postMessage([walletId, "onStartMining", {result: await this.WORKER_OBJECTS[walletId].startMining(numThreads, backgroundMining, ignoreBattery)}]);
  } catch (e) {
    postMessage([walletId, "onStartMining", {error: e.message}]);
  }
}

this.stopMining = async function(walletId) {
  try {
    postMessage([walletId, "onStopMining", {result: await this.WORKER_OBJECTS[walletId].stopMining()}]);
  } catch (e) {
    postMessage([walletId, "onStopMining", {error: e.message}]);
  }
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

this.getData = async function(walletId) {
  try {
    postMessage([walletId, "onGetData", {result: await this.WORKER_OBJECTS[walletId].getData()}]);
  } catch (e) {
    postMessage([walletId, "onGetData", {error: e.message}]);
  }
}

this.isClosed = async function(walletId) {
  try {
    postMessage([walletId, "onIsClosed", {result: await this.WORKER_OBJECTS[walletId].isClosed()}]);
  } catch (e) {
    postMessage([walletId, "onIsClosed", {error: e.message}]);
  }
}

this.close = async function(walletId, save) {
  try {
    postMessage([walletId, "onClose", {result: await this.WORKER_OBJECTS[walletId].close(save)}]);
  } catch (e) {
    postMessage([walletId, "onClose", {error: e.message}]);
  }
}