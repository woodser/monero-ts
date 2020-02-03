/**
 * Implements a MoneroWallet by proxying requests to a web worker which runs a core wallet.
 * 
 * TODO: extends MoneroWallet
 * TODO: sort these methods according to master sort in MoneroWallet.js
 * TODO: probably only allow one listener to web worker then propogate to registered listeners for performance
 * TODO: ability to recycle worker for use in another wallet
 * TODO: factor all is*() to common method handler e.g. registerBoolFn("isSynced", "onIsSynced")
 */
class MoneroWalletCoreProxy extends MoneroWallet {
  
  static async openWalletData(password, networkType, keysData, cacheData, daemonUriOrConnection) {
    
    // create a wallet worker
    let worker = new Worker("MoneroWalletCoreWorker.js");
    
    // return promise which resolves when worker opens wallet
    return new Promise(function(resolve, reject) {
      
      // be notified when worker opens wallet
      worker.onmessage = function(e) {
        if (e.data[0] === "onOpenWalletData") resolve(new MoneroWalletCoreProxy(worker));
      }
      
      // create wallet in worker
      let daemonUriOrConfig = daemonUriOrConnection instanceof MoneroRpcConnection ? daemonUriOrConnection.getConfig() : daemonUriOrConnection;
      worker.postMessage(["openWalletData", password, networkType, keysData, cacheData, daemonUriOrConfig]);
    });
  }
  
  static async createWalletRandom(password, networkType, daemonUriOrConnection, language) {
    
    // create a wallet worker
    let worker = new Worker("MoneroWalletCoreWorker.js");
    
    // return promise which resolves when worker creates wallet
    return new Promise(function(resolve, reject) {
      
      // be notified when worker creates wallet
      worker.onmessage = function(e) {
        if (e.data[0] === "onCreateWalletRandom") resolve(new MoneroWalletCoreProxy(worker));
      }
      
      // create wallet in worker
      let daemonUriOrConfig = daemonUriOrConnection instanceof MoneroRpcConnection ? daemonUriOrConnection.getConfig() : daemonUriOrConnection;
      worker.postMessage(["createWalletRandom", password, networkType, daemonUriOrConfig, language]);
    });
  }
  
  static async createWalletFromMnemonic(password, networkType, mnemonic, daemonUriOrConnection, restoreHeight, seedOffset) {
    
    // create a wallet worker
    let worker = new Worker("MoneroWalletCoreWorker.js");
    
    // return promise which resolves when worker creates wallet
    return new Promise(function(resolve, reject) {
      
      // listen worker to create wallet
      worker.onmessage = function(e) {
        if (e.data[0] === "onCreateWalletFromMnemonic") resolve(new MoneroWalletCoreProxy(worker));
      }
      
      // create wallet in worker
      let daemonUriOrConfig = daemonUriOrConnection instanceof MoneroRpcConnection ? daemonUriOrConnection.config : daemonUriOrConnection;
      worker.postMessage(["createWalletFromMnemonic", password, networkType, mnemonic, daemonUriOrConfig, restoreHeight, seedOffset]);
    });
  }
  
  static async createWalletFromKeys(password, networkType, address, viewKey, spendKey, daemonUriOrConnection, restoreHeight, language) {
    
    // create a wallet worker
    let worker = new Worker("MoneroWalletCoreWorker.js");
    
    // return promise which resolves when worker creates wallet
    return new Promise(function(resolve, reject) {
      
      // listen worker to create wallet
      worker.onmessage = function(e) {
        if (e.data[0] === "onCreateWalletFromKeys") resolve(new MoneroWalletCoreProxy(worker));
      }
      
      // create wallet in worker
      let daemonUriOrConfig = daemonUriOrConnection instanceof MoneroRpcConnection ? daemonUriOrConnection.config : daemonUriOrConnection;
      worker.postMessage(["createWalletFromKeys", password, networkType, address, viewKey, spendKey, daemonUriOrConfig, restoreHeight, language]);
    });
  }
  
  /**
   * Internal constructor which is given a worker to communicate with via messages.
   * 
   * This method should not be called externally but should be called through
   * static wallet creation utilities in this class.
   * 
   * @param {Worker} worker is a web worker to communicate with via messages
   */
  constructor(worker) {
    super();
    this.worker = worker;
    this.callbacks = {};
    let that = this;
    this.wrappedListeners = [];
    this.worker.onmessage = function(e) {
      
      // lookup callback function and this arg
      let thisArg = null;
      let callbackFn = that.callbacks[e.data[0]];
      if (callbackFn === undefined) throw new Error("No worker callback function defined for key '" + e.data[0] + "'");
      if (callbackFn instanceof Array) {  // this arg may be stored with callback function
        thisArg = callbackFn[1];
        callbackFn = callbackFn[0];
      }
      
      // invoke callback function with this arg and arguments
      callbackFn.apply(thisArg, e.data.slice(1));
    }
  }
  
  async getNetworkType() {
    return await this._invokeWorker("getNetworkType");
  }
  
  async getVersion() {
    throw new Error("Not implemented");
  }
  
  getPath() {
    throw new Error("Proxied wallets in the browser have no path");
  }
  
  async getMnemonic() {
    return await this._invokeWorker("getMnemonic");
  }
  
  async getMnemonicLanguage() {
    return await this._invokeWorker("getMnemonicLanguage");
  }
  
  async getMnemonicLanguages() {
    return await this._invokeWorker("getMnemonicLanguages");
  }
  
  async getPrivateSpendKey() {
    return await this._invokeWorker("getPrivateSpendKey");
  }
  
  async getPrivateViewKey() {
    return await this._invokeWorker("getPrivateViewKey");
  }
  
  async getPublicViewKey() {
    return await this._invokeWorker("getPublicViewKey");
  }
  
  async getPublicSpendKey() {
    return await this._invokeWorker("getPublicSpendKey");
  }
  
  async getAddress(accountIdx, subaddressIdx) {
    return await this._invokeWorker("getAddress", Array.from(arguments));
  }
  
  async getAddressIndex(address) {
    return await this._invokeWorker("getAddressIndex", Array.from(arguments));
  }
  
  getAccounts() {
    throw new Error("Not implemented");
  }
  
  async setDaemonConnection(uriOrRpcConnection, username, password) {
    if (!uriOrRpcConnection) await this._invokeWorker("setDaemonConnection");
    else {
      let connection = uriOrRpcConnection instanceof MoneroRpcConnection? uriOrRpcConnection : new MoneroRpcConnection({uri: uriOrRpcConnection, user: username, pass: password});
      await this._invokeWorker("setDaemonConnection", connection.getConfig());
    }
  }
  
  async getDaemonConnection() {
    let rpcConfig = await this._invokeWorker("getDaemonConnection");
    return rpcConfig ? new MoneroRpcConnection(rpcConfig) : undefined;
  }
  
  async isConnected() {
    return await this._invokeWorker("isConnected");
  }
  
  async getRestoreHeight() {
    return await this._invokeWorker("getRestoreHeight");
  }
  
  async setRestoreHeight(restoreHeight) {
    return await this._invokeWorker("setRestoreHeight", [restoreHeight]);
  }
  
  async getDaemonHeight() {
    return await this._invokeWorker("getDaemonHeight");
  }
  
  async getDaemonMaxPeerHeight() {
    return await this._invokeWorker("getDaemonMaxPeerHeight");
  }
  
  async isDaemonSynced() {
    return await this._invokeWorker("isDaemonSynced");
  }
  
  async getHeight() {
    return await this._invokeWorker("getHeight");
  }
  
  async addListener(listener) {
    let wrappedListener = new WalletWorkerListener(listener);
    let listenerId = wrappedListener.getId();
    this.callbacks["onSyncProgress_" + listenerId] = [wrappedListener.onSyncProgress, wrappedListener];
    this.callbacks["onNewBlock_" + listenerId] = [wrappedListener.onNewBlock, wrappedListener];
    this.callbacks["onOutputReceived_" + listenerId] = [wrappedListener.onOutputReceived, wrappedListener];
    this.callbacks["onOutputSpent_" + listenerId] = [wrappedListener.onOutputSpent, wrappedListener];
    this.wrappedListeners.push(wrappedListener);
    this.worker.postMessage(["addListener", listenerId]);
  }
  
  async removeListener(listener) {
    for (let i = 0; i < this.wrappedListeners.length; i++) {
      if (this.wrappedListeners[i].getListener() === listener) {
        let listenerId = this.wrappedListeners[i].getId();
        this.worker.postMessage(["removeListener", listenerId]);
        delete this.callbacks["onSyncProgress_" + listenerId];
        delete this.callbacks["onNewBlock_" + listenerId];
        delete this.callbacks["onOutputSpent_" + listenerId];
        delete this.callbacks["onOutputReceived_" + listenerId];
        this.wrappedListeners.splice(i, 1);
        return;
      }
    }
    throw new MoneroError("Listener is not registered to wallet");
  }
  
  getListeners() {
    return this.wrappedListeners;
  }
  
  async isSynced() {
    return await this._invokeWorker("isSynced");
  }
  
  // TODO: handle startHeight
  async sync(listenerOrStartHeight, startHeight) {
    
    // normalize params
    startHeight = listenerOrStartHeight instanceof MoneroSyncListener ? startHeight : listenerOrStartHeight;
    let listener = listenerOrStartHeight instanceof MoneroSyncListener ? listenerOrStartHeight : undefined;
    if (startHeight === undefined) startHeight = Math.max(await this.getHeight(), await this.getRestoreHeight());
    
    // wrap and register sync listener as wallet listener if given
    let syncListenerWrapper = undefined;
    if (listener !== undefined) {
      syncListenerWrapper = new SyncListenerWrapper(listener);
      await this.addListener(syncListenerWrapper);
    }
    
    // sync the wallet in worker
    let result = await this._invokeWorker("sync");
    
    // unregister sync listener wrapper
    if (syncListenerWrapper !== undefined) {  // TODO: test that this is executed with error e.g. sync an unconnected wallet
      await this.removeListener(syncListenerWrapper); // unregister sync listener
    }
    
    return result;
  }
  
  async startSyncing() {
    return await this._invokeWorker("startSyncing");  // TODO: don't need to await
  }
    
  async stopSyncing() {
    return await this._invokeWorker("stopSyncing");
  }
  
  // rescanSpent
  // rescanBlockchain
  
  async getBalance(accountIdx, subaddressIdx) {
    let balanceStr = await this._invokeWorker("getBalance", Array.from(arguments));
    return new BigInteger(balanceStr);
  }
  
  async getUnlockedBalance(accountIdx, subaddressIdx) {
    let unlockedBalanceStr = await this._invokeWorker("getUnlockedBalance", Array.from(arguments));
    return new BigInteger(unlockedBalanceStr);
  }
  
  async getAccounts(includeSubaddresses, tag) {
    throw new MoneroError("Not implemented");
  }
  
  async getAccount(accountIdx, includeSubaddresses) {
    throw new MoneroError("Not implemented");
  }
  
  async createAccount(label) {
    throw new MoneroError("Not implemented");
  }
  
  async getSubaddresses(accountIdx, subaddressIndices) {
    throw new MoneroError("Not implemented");
  }
  
  async createSubaddress(accountIdx, label) {
    throw new MoneroError("Not implemented");
  }
  
  async getTxs(query) {
    let that = this;
    query = MoneroWalletCore._normalizeTxQuery(query);
    return new Promise(function(resolve, reject) {
      that.callbacks["onGetTxs"] = function(blocksJsonStr) {
        let txs = MoneroWalletCore._blocksJsonToTxs(query, blocksJsonStr); // initialize txs from blocks json string // TODO: using internal private method, make public?
        resolve(txs);
      }
      that.worker.postMessage(["getTxs", query.getBlock().toJson()]);
    });
  }
  
  async getTransfers(query) {
    throw new MoneroError("Not implemented");
  }
  
  async getOutputs(query) {
    throw new MoneroError("Not implemented");
  }
  
  async getOutputsHex() {
    throw new MoneroError("Not implemented");
  }
  
  async importOutputsHex(outputsHex) {
    throw new MoneroError("Not implemented");
  }
  
  async getKeyImages() {
    throw new MoneroError("Not implemented");
  }
  
  async importKeyImages(keyImages) {
    throw new MoneroError("Not implemented");
  }
  
  async getNewKeyImagesFromLastImport() {
    throw new MoneroError("Not implemented");
  }
  
  async relayTxs(txsOrMetadatas) {
    throw new MoneroError("Not implemented");
  }
  
  async sendSplit(requestOrAccountIndex, address, amount, priority) {
    let that = this;
    return new Promise(function(resolve, reject) {
      that.callbacks["onSendSplit"] = function(txSet) { resolve(new MoneroTxSet(txSet)); }
      requestOrAccountIndex = requestOrAccountIndex instanceof MoneroSendRequest ? requestOrAccountIndex.toJson() : requestOrAccountIndex;
      that.worker.postMessage(["sendSplit", requestOrAccountIndex, address, amount, priority]);
    });
  }
  
  async sweepOutput(requestOrAddress, keyImage, priority) {
    throw new MoneroError("Not implemented");
  }

  async sweepUnlocked(request) {
    throw new MoneroError("Not implemented");
  }
  
  async sweepDust() {
    throw new MoneroError("Not implemented");
  }
  
  async sweepDust(doNotRelay) {
    throw new MoneroError("Not implemented");
  }
  
  async sign(message) {
    throw new MoneroError("Not implemented");
  }
  
  async verify(message, address, signature) {
    throw new MoneroError("Not implemented");
  }
  
  async getTxKey(txHash) {
    throw new MoneroError("Not implemented");
  }
  
  async checkTxKey(txHash, txKey, address) {
    throw new MoneroError("Not implemented");
  }
  
  async getTxProof(txHash, address, message) {
    throw new MoneroError("Not implemented");
  }
  
  async checkTxProof(txHash, address, message, signature) {
    throw new MoneroError("Not implemented");
  }
  
  async getSpendProof(txHash, message) {
    throw new MoneroError("Not implemented");
  }
  
  async checkSpendProof(txHash, message, signature) {
    throw new MoneroError("Not implemented");
  }
  
  async getReserveProofWallet(message) {
    throw new MoneroError("Not implemented");
  }
  
  async getReserveProofAccount(accountIdx, amount, message) {
    throw new MoneroError("Not implemented");
  }

  async checkReserveProof(address, message, signature) {
    throw new MoneroError("Not implemented");
  }
  
  async getTxNotes(txHashes) {
    throw new MoneroError("Not implemented");
  }
  
  async setTxNotes(txHashes, notes) {
    throw new MoneroError("Not implemented");
  }
  
  async getAddressBookEntries() {
    throw new MoneroError("Not implemented");
  }
  
  async getAddressBookEntries(entryIndices) {
    throw new MoneroError("Not implemented");
  }
  
  async addAddressBookEntry(address, description) {
    throw new MoneroError("Not implemented");
  }
  
  async addAddressBookEntry(address, description, paymentId) {
    throw new MoneroError("Not implemented");
  }
  
  async deleteAddressBookEntry(entryIdx) {
    throw new MoneroError("Not implemented");
  }
  
  async tagAccounts(tag, accountIndices) {
    throw new MoneroError("Not implemented");
  }

  async untagAccounts(accountIndices) {
    throw new MoneroError("Not implemented");
  }
  
  async getAccountTags() {
    throw new MoneroError("Not implemented");
  }

  async setAccountTagLabel(tag, label) {
    throw new MoneroError("Not implemented");
  }
  
  async createPaymentUri(request) {
    throw new MoneroError("Not implemented");
  }
  
  async parsePaymentUri(uri) {
    throw new MoneroError("Not implemented");
  }
  
  async getAttribute(key) {
    return await this._invokeWorker("getAttribute", Array.from(arguments));
  }
  
  async setAttribute(key, val) {
    return await this._invokeWorker("setAttribute", Array.from(arguments));
  }
  
  async startMining(numThreads, backgroundMining, ignoreBattery) {
    throw new MoneroError("Not implemented");
  }
  
  async stopMining() {
    throw new MoneroError("Not implemented");
  }
  
  async isMultisigImportNeeded() {
    return await this._invokeWorker("isMultisigImportNeeded");
  }
  
  async isMultisig() {
    return await this._invokeWorker("isMultisig");
  }
  
  async getMultisigInfo() {
    throw new MoneroError("Not implemented");
  }
  
  async prepareMultisig() {
    throw new MoneroError("Not implemented");
  }
  
  async makeMultisig(multisigHexes, threshold, password) {
    throw new MoneroError("Not implemented");
  }
  
  async exchangeMultisigKeys(multisigHexes, password) {
    throw new MoneroError("Not implemented");
  }
  
  async getMultisigHex() {
    throw new MoneroError("Not implemented");
  }
  
  async importMultisigHex(multisigHexes) {
    throw new MoneroError("Not implemented");
  }
  
  async signMultisigTxHex(multisigTxHex) {
    throw new MoneroError("Not implemented");
  }
  
  async submitMultisigTxHex(signedMultisigTxHex) {
    throw new MoneroError("Not implemented");
  }
  
  async getData() {
    return await this._invokeWorker("getData");
  }
  
  async isClosed() {
    return await this._invokeWorker("isClosed");
  }
  
  async close(save) {
    await this._invokeWorker("close", save);
    this.worker.terminate();
    delete this.callbacks;
    delete this.wrappedListeners;
  }
  
  // --------------------------- PRIVATE HELPERS ------------------------------
  
  /**
   * Invoke a wallet worker function and get the result with error handling.
   * 
   * @param {string} fnName is the name of the function
   * @param {[]} args are arguments to pass to the worker
   */
  async _invokeWorker(fnName, args) {
    assert(fnName.length >= 2);
    let that = this;
    return new Promise(function(resolve, reject) {
      that.callbacks["on" + fnName.charAt(0).toUpperCase() + fnName.substring(1)] = function(resp) {
        resp.error ? reject(new MoneroError(resp.error)) : resolve(resp.result);
      }
      that.worker.postMessage([fnName].concat(args === undefined ? [] : GenUtils.listify(args)));
    });
  }
}

/**
 * Internal listener to bridge notifications to external listeners.
 */
class WalletWorkerListener {
  
  constructor(listener) {
    this.id = GenUtils.uuidv4();
    this.listener = listener;
  }
  
  getId() {
    return this.id;
  }
  
  getListener() {
    return this.listener;
  }
  
  onSyncProgress(height, startHeight, endHeight, percentDone, message) {
    this.listener.onSyncProgress(height, startHeight, endHeight, percentDone, message);
  }

  onNewBlock(height) {
    this.listener.onNewBlock(height);
  }

  onOutputReceived(blockJson) {
    let block = new MoneroBlock(blockJson);
    this.listener.onOutputReceived(block.getTxs()[0].getOutputs()[0]);
  }
  
  onOutputSpent(blockJson) {
    let block = new MoneroBlock(blockJson);
    this.listener.onOutputSpent(block.getTxs()[0].getInputs()[0]);
  }
}
  
/**
 * Wraps a sync listener as a general wallet listener.
 * 
 * TODO: is this type necessary in JS?
 * TODO: this type is duplicated in MoneroWalletCore - either refactor or collapse sync listener and wallet listener
 */
class SyncListenerWrapper extends MoneroWalletListener {
  
  constructor(listener) {
    super();
    this.listener = listener;
  }
  
  onSyncProgress(height, startHeight, endHeight, percentDone, message) {
    this.listener.onSyncProgress(height, startHeight, endHeight, percentDone, message);
  }
}

module.exports = MoneroWalletCoreProxy;