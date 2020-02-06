/**
 * Implements a MoneroWallet by proxying requests to a web worker which runs a core wallet.
 * 
 * TODO: extends MoneroWallet
 * TODO: sort these methods according to master sort in MoneroWallet.js
 * TODO: probably only allow one listener to web worker then propogate to registered listeners for performance
 * TODO: ability to recycle worker for use in another wallet
 * TODO: factor all is*() to common method handler e.g. registerBoolFn("isSynced", "onIsSynced")
 * TODO: on* callbacks only need to be defined once, instead they are defined once per call
 * TODO: using MoneroUtils.WORKER_OBJECTS directly
 */
class MoneroWalletCoreProxy extends MoneroWallet {
  
  
  // -------------------------- WALLET STATIC UTILS ---------------------------
  
  static async openWalletData(password, networkType, keysData, cacheData, daemonUriOrConnection) {
    let walletId = GenUtils.uuidv4();
    let daemonUriOrConfig = daemonUriOrConnection instanceof MoneroRpcConnection ? daemonUriOrConnection.getConfig() : daemonUriOrConnection;
    await MoneroUtils.invokeWorker(walletId, "openWalletData", [password, networkType, keysData, cacheData, daemonUriOrConfig]);
    return new MoneroWalletCoreProxy(walletId, MoneroUtils.getWorker());
  }
  
  static async createWalletRandom(password, networkType, daemonUriOrConnection, language) {
    let walletId = GenUtils.uuidv4();
    let daemonUriOrConfig = daemonUriOrConnection instanceof MoneroRpcConnection ? daemonUriOrConnection.getConfig() : daemonUriOrConnection;
    await MoneroUtils.invokeWorker(walletId, "createWalletRandom", [password, networkType, daemonUriOrConfig, language]);
    return new MoneroWalletCoreProxy(walletId, MoneroUtils.getWorker());
  }
  
  static async createWalletFromMnemonic(password, networkType, mnemonic, daemonUriOrConnection, restoreHeight, seedOffset) {
    let walletId = GenUtils.uuidv4();
    let daemonUriOrConfig = daemonUriOrConnection instanceof MoneroRpcConnection ? daemonUriOrConnection.getConfig() : daemonUriOrConnection;
    await MoneroUtils.invokeWorker(walletId, "createWalletFromMnemonic", [password, networkType, mnemonic, daemonUriOrConfig, restoreHeight, seedOffset]);
    return new MoneroWalletCoreProxy(walletId, MoneroUtils.getWorker());
  }
  
  static async createWalletFromKeys(password, networkType, address, viewKey, spendKey, daemonUriOrConnection, restoreHeight, language) {
    let walletId = GenUtils.uuidv4();
    let daemonUriOrConfig = daemonUriOrConnection instanceof MoneroRpcConnection ? daemonUriOrConnection.getConfig() : daemonUriOrConnection;
    await MoneroUtils.invokeWorker(walletId, "createWalletFromKeys", [password, networkType, address, viewKey, spendKey, daemonUriOrConfig, restoreHeight, language]);
    return new MoneroWalletCoreProxy(walletId, MoneroUtils.getWorker());
  }
  
  // --------------------------- INSTANCE METHODS ----------------------------
  
  /**
   * Internal constructor which is given a worker to communicate with via messages.
   * 
   * This method should not be called externally but should be called through
   * static wallet creation utilities in this class.
   * 
   * @param {string} walletId identifies the wallet with the worker
   * @param {Worker} worker is a web worker to communicate with via messages
   */
  constructor(walletId, worker) {
    super();
    this.walletId = walletId;
    this.worker = worker;
    this.wrappedListeners = [];
    assert(walletId); // TODO: remove this (bad wallet ids will be part of error message)
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
    MoneroUtils.WORKER_OBJECTS[this.walletId].callbacks["onSyncProgress_" + listenerId] = [wrappedListener.onSyncProgress, wrappedListener];
    MoneroUtils.WORKER_OBJECTS[this.walletId].callbacks["onNewBlock_" + listenerId] = [wrappedListener.onNewBlock, wrappedListener];
    MoneroUtils.WORKER_OBJECTS[this.walletId].callbacks["onOutputReceived_" + listenerId] = [wrappedListener.onOutputReceived, wrappedListener];
    MoneroUtils.WORKER_OBJECTS[this.walletId].callbacks["onOutputSpent_" + listenerId] = [wrappedListener.onOutputSpent, wrappedListener];
    this.wrappedListeners.push(wrappedListener);
    this.worker.postMessage([this.walletId, "addListener", listenerId]);
  }
  
  async removeListener(listener) {
    for (let i = 0; i < this.wrappedListeners.length; i++) {
      if (this.wrappedListeners[i].getListener() === listener) {
        let listenerId = this.wrappedListeners[i].getId();
        this.worker.postMessage([this.walletId, "removeListener", listenerId]);
        delete MoneroUtils.WORKER_OBJECTS[this.walletId].callbacks["onSyncProgress_" + listenerId];
        delete MoneroUtils.WORKER_OBJECTS[this.walletId].callbacks["onNewBlock_" + listenerId];
        delete MoneroUtils.WORKER_OBJECTS[this.walletId].callbacks["onOutputReceived_" + listenerId];
        delete MoneroUtils.WORKER_OBJECTS[this.walletId].callbacks["onOutputSpent_" + listenerId];
        this.wrappedListeners.splice(i, 1);
        return;
      }
    }
    throw new MoneroError("Listener is not registered to wallet");
  }
  
  getListeners() {
    let listeners = [];
    for (let wrappedListener of this.wrappedListeners) listeners.push(wrappedListener.getListener());
    return listeners;
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
    let resultJson = await this._invokeWorker("sync", [startHeight]);
    let result = new MoneroSyncResult(resultJson.numBlocksFetched, resultJson.receivedMoney);
    
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
    let accounts = [];
    for (let accountJson of (await this._invokeWorker("getAccounts", Array.from(arguments)))) {
      accounts.push(MoneroWalletCore._sanitizeAccount(new MoneroAccount(accountJson)));
    }
    return accounts;
  }
  
  async getAccount(accountIdx, includeSubaddresses) {
    let accountJson = await this._invokeWorker("getAccount", Array.from(arguments));
    return MoneroWalletCore._sanitizeAccount(new MoneroAccount(accountJson));
  }
  
  async createAccount(label) {
    let accountJson = await this._invokeWorker("createAccount", Array.from(arguments));
    return MoneroWalletCore._sanitizeAccount(new MoneroAccount(accountJson));
  }
  
  async getSubaddresses(accountIdx, subaddressIndices) {
    let subaddresses = [];
    for (let subaddressJson of (await this._invokeWorker("getSubaddresses", Array.from(arguments)))) {
      subaddresses.push(MoneroWalletCore._sanitizeSubaddress(new MoneroSubaddress(subaddressJson)));
    }
    return subaddresses;
  }
  
  async createSubaddress(accountIdx, label) {
    let subaddressJson = await this._invokeWorker("createSubaddress", Array.from(arguments));
    return MoneroWalletCore._sanitizeSubaddress(new MoneroSubaddress(subaddressJson));
  }
  
  async getTxs(query) {
    query = MoneroWalletCore._normalizeTxQuery(query);
    let blockJsons = await this._invokeWorker("getTxs", [query.getBlock().toJson()]);
    return MoneroWalletCore._blocksJsonToTxs(query, JSON.stringify({blocks: blockJsons})); // initialize txs from blocks json string // TODO: using internal private method, make public? TODO: this stringifies then utility parses, avoid
  }
  
  async getTransfers(query) {
    query = MoneroWalletCore._normalizeTransferQuery(query);
    let blockJsons = await this._invokeWorker("getTransfers", [query.getTxQuery().getBlock().toJson()]);
    return MoneroWalletCore._blocksJsonToTransfers(query, JSON.stringify({blocks: blockJsons})); // initialize transfers from blocks json string // TODO: using internal private method, make public? TODO: this stringifies then utility parses, avoid
  }
  
  async getOutputs(query) {
    query = MoneroWalletCore._normalizeOutputQuery(query);
    let blockJsons = await this._invokeWorker("getOutputs", [query.getTxQuery().getBlock().toJson()]);
    return MoneroWalletCore._blocksJsonToOutputs(query, JSON.stringify({blocks: blockJsons})); // initialize transfers from blocks json string // TODO: using internal private method, make public? TODO: this stringifies then utility parses, avoid
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
    requestOrAccountIndex = requestOrAccountIndex instanceof MoneroSendRequest ? requestOrAccountIndex.toJson() : requestOrAccountIndex;
    let txSetJson = await this._invokeWorker("sendSplit", [requestOrAccountIndex, address, amount, priority]);
    return new MoneroTxSet(txSetJson);
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
    return await this._invokeWorker("startMining", Array.from(arguments));
  }
  
  async stopMining() {
    return await this._invokeWorker("stopMining", Array.from(arguments));
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
    delete this.wrappedListeners;
    delete MoneroUtils.WORKER_OBJECTS[this.walletId];
  }
  
  // --------------------------- PRIVATE HELPERS ------------------------------
  
  async _invokeWorker(fnName, args) {
    return MoneroUtils.invokeWorker(this.walletId, fnName, args);
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
    let block = new MoneroBlock(blockJson, MoneroBlock.DeserializationType.TX_WALLET);
    this.listener.onOutputReceived(block.getTxs()[0].getOutputs()[0]);
  }
  
  onOutputSpent(blockJson) {
    let block = new MoneroBlock(blockJson, MoneroBlock.DeserializationType.TX_WALLET);
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