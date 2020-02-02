/**
 * Implements a MoneroWallet by proxying requests to a web worker which runs a core wallet.
 * 
 * TODO: extends MoneroWallet
 * TODO: sort these methods according to master sort in MoneroWallet.js
 * TODO: probably only allow one listener to web worker then propogate to registered listeners for performance
 * TODO: ability to recycle worker for use in another wallet
 */
class MoneroWalletCoreProxy extends MoneroWallet {
  
  static async createWalletRandom(password, networkType, daemonUriOrConnection, language) {
    
    // create a wallet worker
    let worker = new Worker("MoneroWalletCoreWorker.js");
    
    // return promise which resolves when worker creates wallet
    return new Promise(function(resolve, reject) {
      
      // listen worker to create wallet
      worker.onmessage = function(e) {
        if (e.data[0] === "onCreateWalletRandom") resolve(new MoneroWalletCoreProxy(worker));
      }
      
      // create wallet in worker
      let daemonUriOrConfig = daemonUriOrConnection instanceof MoneroRpcConnection ? daemonUriOrConnection.config : daemonUriOrConnection;
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
  
  /**
   * Get the wallet's network type (mainnet, testnet, or stagenet).
   * 
   * @return {MoneroNetworkType} the wallet's network type
   */
  async getNetworkType() {
    throw new Error("Not implemented");
  }
  
  async getVersion() {
    throw new Error("Not implemented");
  }
  
  getPath() {
    throw new Error("Not implemented");
  }
  
  async getMnemonic() {
    let that = this;
    return new Promise(function(resolve, reject) {
      that.callbacks["onGetMnemonic"] = function(mnemonic) { resolve(mnemonic); }
      that.worker.postMessage(["getMnemonic"]);
    });
  }
  
  async getMnemonicLanguage() {
    throw new Error("Not implemented");
  }
  
  async getMnemonicLanguages() {
    throw new Error("Not implemented");
  }
  
  async getPrivateSpendKey() {
    throw new Error("Not implemented");
  }
  
  async getPrivateViewKey() {
    throw new Error("Not implemented");
  }
  
  async getPublicViewKey() {
    throw new Error("Not implemented");
  }
  
  async getPublicSpendKey() {
    throw new Error("Not implemented");
  }
  
  async getAddress(accountIdx, subaddressIdx) {
    let that = this;
    return new Promise(function(resolve, reject) {
      that.callbacks["onGetAddress"] = function(address) { resolve(address); }
      that.worker.postMessage(["getAddress", accountIdx, subaddressIdx]);
    });
  }
  
  async getAddressIndex(address) {
    throw new Error("Not implemented");
  }
  
  getAccounts() {
    throw new Error("Not implemented");
  }
  
  async setDaemonConnection(uriOrRpcConnection, username, password) {
    throw new Error("Not implemented");
  }
  
  /**
   * Get the wallet's daemon connection.
   * 
   * @return {MoneroRpcConnection} the wallet's daemon connection
   */
  async getDaemonConnection() {
    throw new Error("Not implemented");
  }
  
  /**
   * Indicates if the wallet is connected to daemon.
   * 
   * @return {boolean} true if the wallet is connected to a daemon, false otherwise
   */
  async isConnected() {
    throw new Error("Not implemented");
  }
  
  /**
   * Get the height of the first block that the wallet scans.
   * 
   * @return {number} the height of the first block that the wallet scans
   */
  async getRestoreHeight() {
    let that = this;
    return new Promise(function(resolve, reject) {
      that.callbacks["onGetRestoreHeight"] = function(restoreHeight) { resolve(restoreHeight); }
      that.worker.postMessage(["getRestoreHeight"]);
    });
  }
  
  /**
   * Set the height of the first block that the wallet scans.
   * 
   * @param {number} restoreHeight is the height of the first block that the wallet scans
   */
  async setRestoreHeight(restoreHeight) {
    throw new Error("Not implemented");
  }
  
  async getDaemonHeight() {
    throw new MoneroError("Not implemented");
  }
  
  /**
   * Get the maximum height of the peers the wallet's daemon is connected to.
   *
   * @return {number} the maximum height of the peers the wallet's daemon is connected to
   */
  async getDaemonMaxPeerHeight() {
    throw new Error("Not implemented");
  }
  
  /**
   * Indicates if the wallet's daemon is synced with the network.
   * 
   * @return {boolean} true if the daemon is synced with the network, false otherwise
   */
  async isDaemonSynced() {
    throw new Error("Not implemented");
  }
  
  async getHeight() {
    let that = this;
    return new Promise(function(resolve, reject) {
      that.callbacks["onGetHeight"] = function(height) { resolve(height); }
      that.worker.postMessage(["getHeight"]);
    });
  }
  
  /**
   * Register a listener receive wallet notifications.
   * 
   * @param {MoneroWalletListener} listener is the listener to receive wallet notifications
   */
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
  
  /**
   * Unregister a listener to receive wallet notifications.
   * 
   * @param {MoneroWalletListener} listener is the listener to unregister
   */
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
  
  /**
   * Get the listeners registered with the wallet.
   * 
   * @return {MoneroWalletListener[]} the registered listeners
   */
  getListeners() {
    throw new Error("Not implemented");
  }
  
  /**
   * Indicates if the wallet is synced with the daemon.
   * 
   * @return {boolean} true if the wallet is synced with the daemon, false otherwise
   */
  async isSynced() {
    throw new Error("Not implemented");
  }
  
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
    let that = this;
    let result = await new Promise(function(resolve, reject) {
      that.callbacks["onSync"] = function(result) { resolve(result); }
      that.worker.postMessage(["sync"]);
    });
    
    // unregister sync listener wrapper
    if (syncListenerWrapper !== undefined) {  // TODO: test that this is executed with error e.g. sync an unconnected wallet
      await that.removeListener(syncListenerWrapper); // unregister sync listener
    }
    
    return result;
  }
  
  async startSyncing() {
    let that = this;
    return new Promise(function(resolve, reject) {
      that.callbacks["onStartSyncing"] = function() { resolve(); }
      that.worker.postMessage(["startSyncing"]);
    });
  }
    
  async stopSyncing() {
    let that = this;
    return new Promise(function(resolve, reject) {
      that.callbacks["onStopSyncing"] = function() { resolve(); }
      that.worker.postMessage(["stopSyncing"]);
    });
  }
  
  // rescanSpent
  // rescanBlockchain
  
  async getBalance(accountIdx, subaddressIdx) {
    let that = this;
    return new Promise(function(resolve, reject) {
      that.callbacks["onGetBalance"] = function(balance) { resolve(new BigInteger(balance)); }
      that.worker.postMessage(["getBalance", accountIdx, subaddressIdx]);
    });
  }
  
  async getUnlockedBalance(accountIdx, subaddressIdx) {
    let that = this;
    return new Promise(function(resolve, reject) {
      that.callbacks["onGetUnlockedBalance"] = function(unlockedBalance) { resolve(new BigInteger(unlockedBalance)); }
      that.worker.postMessage(["getUnlockedBalance", accountIdx, subaddressIdx]);
    });
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
    throw new MoneroError("Not implemented");
  }
  
  async setAttribute(key, val) {
    throw new MoneroError("Not implemented");
  }
  
  async startMining(numThreads, backgroundMining, ignoreBattery) {
    throw new MoneroError("Not implemented");
  }
  
  async stopMining() {
    throw new MoneroError("Not implemented");
  }
  
  async isMultisigImportNeeded() {
    throw new MoneroError("Not implemented");
  }
  
  async isMultisig() {
    throw new MoneroError("Not implemented");
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
  
  async isClosed() {
    throw new Error("Not implemented");
  }
  
  async close() {
    throw new Error("Not implemented");
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