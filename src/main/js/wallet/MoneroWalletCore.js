const FS = require('fs'); 

/**
 * Implements a MoneroWallet using WebAssembly to bridge to monero-project's wallet2.
 * 
 * TODO: add assertNotClosed() per JNI
 */
class MoneroWalletCore extends MoneroWalletKeys {
  
  // --------------------------- STATIC UTILITIES -----------------------------
  
  static async walletExists(path) {
    let temp = FS.existsSync(path);
    console.log("Wallet exists at " + path + ": " + temp);
    return FS.existsSync(path);
  }
  
  // TODO: openWith(<file/zip buffers>)
  
  static async openWallet(path, password, networkType, daemonUriOrConnection) {
    console.log("MoneroWalletCore.openWallet()");
    
    // validate and sanitize parameters
    if (!(await MoneroWalletCore.walletExists(path))) throw new MoneroError("Wallet does not exist at path: " + path);
    if (password === undefined) password = "";
    if (networkType === undefined) throw new MoneroError("Must provide a network type");
    MoneroNetworkType.validate(networkType);
    let daemonConnection = daemonUriOrConnection ? (typeof daemonUriOrConnection === "string" ? new MoneroRpcConnection(daemonUriOrConnection) : daemonUriOrConnection) : undefined;
    let daemonUri = daemonConnection ? daemonConnection.getUri() : "";
    let daemonUsername = daemonConnection ? daemonConnection.getUsername() : "";
    let daemonPassword = daemonConnection ? daemonConnection.getPassword() : "";
    
    // read wallet files
    let keysData = FS.readFileSync(path + ".keys");
    let cacheData = FS.readFileSync(path);
    
    // load wasm module
    let module = await MoneroUtils.loadWasmModule();
    
    // return promise which is resolved on callback
    return new Promise(function(resolve, reject) {
      
      // define callback for wasm
      let callbackFn = async function(cppAddress) {
        let wallet = new MoneroWalletCore(cppAddress, path, password);
        resolve(wallet);
      };
      
      // create wallet in wasm and invoke callback when done
      module.open_core_wallet(password, networkType, keysData, cacheData, daemonUri, daemonUsername, daemonPassword, callbackFn);
    });
  }
  
  static async createWalletRandom(path, password, networkType, daemonConnection, language) {
    
    // validate and sanitize params
    if (path === undefined) path = "";
    if (password === undefined) password = "";
    MoneroNetworkType.validate(networkType);
    if (language === undefined) language = "English";
    let daemonUri = daemonConnection ? daemonConnection.getUri() : "";
    let daemonUsername = daemonConnection ? daemonConnection.getUsername() : "";
    let daemonPassword = daemonConnection ? daemonConnection.getPassword() : "";
    
    // load wasm module
    let module = await MoneroUtils.loadWasmModule();
    
    // return promise which is resolved on callback
    return new Promise(function(resolve, reject) {
      
      // define callback for wasm
      let callbackFn = async function(cppAddress) {
        let wallet = new MoneroWalletCore(cppAddress, path, password);
        //await wallet.save();  // TODO
        resolve(wallet);
      };
      
      // create wallet in wasm and invoke callback when done
      module.create_core_wallet_random(password, networkType, daemonUri, daemonUsername, daemonPassword, language, callbackFn);
    });
  }
  
  static async createWalletFromMnemonic(path, password, networkType, mnemonic, daemonConnection, restoreHeight, seedOffset) {
    
    // validate and sanitize params
    if (path === undefined) path = "";
    if (password === undefined) password = "";
    MoneroNetworkType.validate(networkType);
    let daemonUri = daemonConnection ? daemonConnection.getUri() : "";
    let daemonUsername = daemonConnection ? daemonConnection.getUsername() : "";
    let daemonPassword = daemonConnection ? daemonConnection.getPassword() : "";
    if (restoreHeight === undefined) restoreHeight = 0;
    if (seedOffset === undefined) seedOffset = "";
    
    // load wasm module
    let module = await MoneroUtils.loadWasmModule();
    
    // return promise which is resolved on callback
    return new Promise(function(resolve, reject) {
      
      // define callback for wasm
      let callbackFn = async function(cppAddress) {
        let wallet = new MoneroWalletCore(cppAddress, path, password);
        //await wallet.save();  // TODO
        resolve(wallet);
      };
      
      // create wallet in wasm and invoke callback when done
      module.create_core_wallet_from_mnemonic(password, networkType, mnemonic, daemonUri, daemonUsername, daemonPassword, restoreHeight, seedOffset, callbackFn);
    });
  }
  
  static async createWalletFromKeys(path, password, networkType, address, viewKey, spendKey, daemonConnection, restoreHeight, language) {
    
    // validate and sanitize params
    if (path === undefined) path = "";
    if (password === undefined) password = "";
    MoneroNetworkType.validate(networkType);
    if (address === undefined) address = "";
    if (viewKey === undefined) viewKey = "";
    if (spendKey === undefined) spendKey = "";
    let daemonUri = daemonConnection ? daemonConnection.getUri() : "";
    let daemonUsername = daemonConnection ? daemonConnection.getUsername() : "";
    let daemonPassword = daemonConnection ? daemonConnection.getPassword() : "";
    if (restoreHeight === undefined) restoreHeight = 0;
    if (language === undefined) language = "English";
    
    // load wasm module
    let module = await MoneroUtils.loadWasmModule();
    
    // return promise which is resolved on callback
    return new Promise(function(resolve, reject) {
      
      // define callback for wasm
      let callbackFn = async function(cppAddress) {
        let wallet = new MoneroWalletCore(cppAddress, path, password);
        //await wallet.save();  // TODO
        resolve(wallet);
      };
      
      // create wallet in wasm and invoke callback when done
      module.create_core_wallet_from_keys(password, networkType, address, viewKey, spendKey, daemonUri, daemonUsername, daemonPassword, restoreHeight, language, callbackFn);
    });
  }
  
  static async getMnemonicLanguages() {
    let module = await MoneroUtils.loadWasmModule();  // load wasm module
    return JSON.parse(module.get_keys_wallet_mnemonic_languages()).languages;
  }
  
  // --------------------------- INSTANCE METHODS -----------------------------
  
  /**
   * Internal constructor which is given the memory address of a C++ wallet
   * instance.
   * 
   * This method should not be called externally but should be called through
   * static wallet creation utilities in this class.
   * 
   * @param {int} cppAddress is the address of the wallet instance in C++
   * @param {string} path is the path of the wallet instance
   * @param {string} password is the password of the wallet instance
   */
  constructor(cppAddress, path, password) {
    super(cppAddress);
    this.path = path;
    this.password = password;
    this.listeners = [];
    this.MY_TEST = 5;
    this.wasmListener = new WalletWasmListener(this); // receives notifications from wasm c++
    this.wasmListenerHandle = 0;                      // memory address of the wallet listener in c++
  }
  
  // ------------ WALLET METHODS SPECIFIC TO WASM IMPLEMENTATION --------------
  
  /**
   * Set the wallet's daemon connection.
   * 
   * @param {string|MoneroRpcConnection} uriOrRpcConnection is the daemon's URI or instance of MoneroRpcConnection
   * @param {string} username is the username to authenticate with the daemon (optional)
   * @param {string} password is the password to authenticate with the daemon (optional)
   */
  async setDaemonConnection(uriOrRpcConnection, username, password) {
    this._assertNotClosed();
    
    // normalize uri, username, and password
    let uri;
    if (typeof uriOrRpcConnection == "string") uri = uriOrRpcConnection;
    else if (uriOrRpcConnection instanceof MoneroRpcConnection) {
      if (username || password) throw new MoneroError("Cannot specify username or password if first arg is MoneroRpcConnection");
      uri = uriOrRpcConnection.getUri();
      username = uriOrRpcConnection.getUsername();
      password = uriOrRpcConnection.getPassword();
    }
    if (!uri) uri = "";
    if (!username) username = "";
    if (!password) password = "";
    
    // return promise which resolves on callback
    let that = this;
    return new Promise(function(resolve, reject) {
      
      // define callback for wasm
      let callbackFn = function(resp) {
        resolve(resp);
      }
      
      // sync wallet in wasm and invoke callback when done
      that.module.set_daemon_connection(that.cppAddress, uri, username, password, callbackFn);
    });
  }
  
  /**
   * Get the wallet's daemon connection.
   * 
   * @return {MoneroRpcConnection} the wallet's daemon connection
   */
  async getDaemonConnection() {
    this._assertNotClosed();
    let connectionContainerStr = this.module.get_daemon_connection(this.cppAddress);
    if (!connectionContainerStr) return undefined;
    let connectionContainer = JSON.parse(connectionContainerStr);
    return new MoneroRpcConnection({  // TODO: reconcile username vs user, password vs pass, then can pass container directly to MoneroRpcConnection (breaking change)
      uri: connectionContainer.uri,
      user: connectionContainer.username,
      pass: connectionContainer.password
    });
  }
  
  /**
   * Indicates if the wallet is connected a daemon.
   * 
   * @return {boolean} true if the wallet is connected to a daemon, false otherwise
   */
  async isConnected() {
    this._assertNotClosed();
    
    // return promise which resolves on callback
    let that = this;
    return new Promise(function(resolve, reject) {
      
      // define callback for wasm
      let callbackFn = function(resp) {
        resolve(resp);
      }
      
      // sync wallet in wasm and invoke callback when done
      that.module.is_connected(that.cppAddress, callbackFn);
    });
  }
  
  /**
   * Get the maximum height of the peers the wallet's daemon is connected to.
   *
   * @return {number} the maximum height of the peers the wallet's daemon is connected to
   */
  async getDaemonMaxPeerHeight() {
    this._assertNotClosed();
    
    // return promise which resolves on callback
    let that = this;
    return new Promise(function(resolve, reject) {
      
      // define callback for wasm
      let callbackFn = function(resp) {
        resolve(resp);
      }
      
      // sync wallet in wasm and invoke callback when done
      that.module.get_daemon_max_peer_height(that.cppAddress, callbackFn);
    });
  }
  
  /**
   * Indicates if the wallet's daemon is synced with the network.
   * 
   * @return {boolean} true if the daemon is synced with the network, false otherwise
   */
  async isDaemonSynced() {
    this._assertNotClosed();
    
    // return promise which resolves on callback
    let that = this;
    return new Promise(function(resolve, reject) {
      
      // define callback for wasm
      let callbackFn = function(resp) {
        resolve(resp);
      }
      
      // sync wallet in wasm and invoke callback when done
      that.module.is_daemon_synced(that.cppAddress, callbackFn);
    });
  }
  
  /**
   * Indicates if the wallet is synced with the daemon.
   * 
   * @return {boolean} true if the wallet is synced with the daemon, false otherwise
   */
  async isSynced() {
    this._assertNotClosed();
    
    // return promise which resolves on callback
    let that = this;
    return new Promise(function(resolve, reject) {
      
      // define callback for wasm
      let callbackFn = function(resp) {
        resolve(resp);
      }
      
      // sync wallet in wasm and invoke callback when done
      that.module.is_synced(that.cppAddress, callbackFn);
    });
  }
  
  /**
   * Get the wallet's network type (mainnet, testnet, or stagenet).
   * 
   * @return {MoneroNetworkType} the wallet's network type
   */
  async getNetworkType() {
    this._assertNotClosed();
    return this.module.get_network_type(this.cppAddress);
  }
  
  /**
   * Get the height of the first block that the wallet scans.
   * 
   * @return {number} the height of the first block that the wallet scans
   */
  async getRestoreHeight() {
    this._assertNotClosed();
    return this.module.get_restore_height(this.cppAddress);
  }
  
  /**
   * Set the height of the first block that the wallet scans.
   * 
   * @param {number} restoreHeight is the height of the first block that the wallet scans
   */
  async setRestoreHeight(restoreHeight) {
    this._assertNotClosed();
    return this.module.get_restore_height(this.cppAddress);
  }
  
  /**
   * Register a listener receive wallet notifications.
   * 
   * @param {MoneroWalletListener} listener is the listener to receive wallet notifications
   */
  addListener(listener) {
    this._assertNotClosed();
    this.listeners.push(listener);
    this._setIsListening(true);
  }
  
  /**
   * Unregister a listener to receive wallet notifications.
   * 
   * @param {MoneroWalletListener} listener is the listener to unregister
   */
  removeListener(listener) {
    this._assertNotClosed();
    let idx = this.listeners.indexOf(listener);
    if (idx > -1) this.listeners.splice(idx, 1);
    else throw new MoneroError("Listener is not registered to wallet");
    if (this.listeners.length === 0) this._setIsListening(false);
  }
  
  /**
   * Get the listeners registered with the wallet.
   * 
   * @return {MoneroWalletListener[]} the registered listeners
   */
  getListeners() {
    this._assertNotClosed();
    return this.listeners;
  }
  
  /**
   * Move the wallet from its current path to the given path.
   * 
   * @param {string} path is the new wallet's path
   * @param {string} password is the new wallet's password
   */
  async moveTo(path, password) {
    this._assertNotClosed();
    throw new Error("Not implemented");
  }
  
  /**
   * Indicates if this wallet is closed or not.
   * 
   * @return {boolean} true if the wallet is closed, false otherwise
   */
  async isClosed() {
    return this._isClosed;
  }
  
  // -------------------------- COMMON WALLET METHODS -------------------------
  
  async getVersion() {
    this._assertNotClosed();
    throw new Error("Not implemented");
  }
  
  async getPath() {
    this._assertNotClosed();
    return this.path;
  }
  
  async getHeight() {
    this._assertNotClosed();
    
    // return promise which resolves on callback
    let that = this;
    return new Promise(function(resolve, reject) {
      
      // define callback for wasm
      let callbackFn = function(resp) {
        resolve(resp);
      }
      
      // sync wallet in wasm and invoke callback when done
      that.module.get_height(that.cppAddress, callbackFn);
    });
  }
  
  async getDaemonHeight() {
    this._assertNotClosed();
    if (!(await this.isConnected())) throw new MoneroError("Wallet is not connected to daemon");
    
    // return promise which resolves on callback
    let that = this;
    return new Promise(function(resolve, reject) {
      
      // define callback for wasm
      let callbackFn = function(resp) {
        resolve(resp);
      }
      
      // sync wallet in wasm and invoke callback when done
      that.module.get_daemon_height(that.cppAddress, callbackFn);
    });
  }
  
  async sync() {
    this._assertNotClosed();
    if (!(await this.isConnected())) throw new MoneroError("Wallet is not connected to daemon");
    
    // return promise which resolves on callback
    let that = this;
    return new Promise(function(resolve, reject) {
      
      // define callback for wasm
      let callbackFn = function(resp) {
        let respJson = JSON.parse(resp);
        let result = new MoneroSyncResult(respJson.numBlocksFetched, respJson.receivedMoney);
        resolve(result);
      }
      
      // sync wallet in wasm and invoke callback when done
      that.module.sync(that.cppAddress, callbackFn);
    });
  }
  
//  @Override
//  public MoneroSyncResult sync(Long startHeight, MoneroSyncListener listener) {
//    assertNotClosed();
//    if (startHeight == null) startHeight = Math.max(getHeight(), getRestoreHeight());
//    
//    // wrap and register sync listener as wallet listener if given
//    SyncListenerWrapper syncListenerWrapper = null;
//    if (listener != null) {
//      syncListenerWrapper = new SyncListenerWrapper(listener);
//      addListener(syncListenerWrapper);
//    }
//    
//    // sync wallet and handle exception
//    try {
//      Object[] results = syncJni(startHeight);
//      return new MoneroSyncResult((long) results[0], (boolean) results[1]);
//    } catch (Exception e) {
//      throw new MoneroException(e.getMessage());
//    } finally {
//      if (syncListenerWrapper != null) removeListener(syncListenerWrapper); // unregister sync listener
//    }
//  }
  
  async startSyncing() {
    this._assertNotClosed();
    if (!(await this.isConnected())) throw new MoneroError("Wallet is not connected to daemon");
    throw new Error("Not implemented");
  }
  
  // startSyncing
  // rescanSpent
  // rescanBlockchain
  
  async getBalance(accountIdx, subaddressIdx) {
    this._assertNotClosed();
    
    // get balance encoded in json string
    let balanceStr;
    if (accountIdx === undefined) {
      assert(subaddressIdx === undefined, "Subaddress index must be undefined if account index is undefined");
      balanceStr = this.module.get_balance_wallet(this.cppAddress);
    } else if (subaddressIdx === undefined) {
      balanceStr = this.module.get_balance_account(this.cppAddress, accountIdx);
    } else {
      balanceStr = this.module.get_balance_subaddress(this.cppAddress, accountIdx, subaddressIdx);
    }
    
    // parse json string to BigInteger
    return new BigInteger(JSON.parse(balanceStr).balance);
  }
  
  async getUnlockedBalance(accountIdx, subaddressIdx) {
    this._assertNotClosed();
    
    // get balance encoded in json string
    let unlockedBalanceStr;
    if (accountIdx === undefined) {
      assert(subaddressIdx === undefined, "Subaddress index must be undefined if account index is undefined");
      unlockedBalanceStr = this.module.get_unlocked_balance_wallet(this.cppAddress);
    } else if (subaddressIdx === undefined) {
      unlockedBalanceStr = this.module.get_unlocked_balance_account(this.cppAddress, accountIdx);
    } else {
      unlockedBalanceStr = this.module.get_unlocked_balance_subaddress(this.cppAddress, accountIdx, subaddressIdx);
    }
    
    // parse json string to BigInteger
    return new BigInteger(JSON.parse(unlockedBalanceStr).unlockedBalance);
  }
  
  async getAccounts(includeSubaddresses, tag) {
    this._assertNotClosed();
    let accountsStr = this.module.get_accounts(this.cppAddress, includeSubaddresses ? true : false, tag ? tag : "");
    let accounts = [];
    for (let accountJson of JSON.parse(accountsStr).accounts) {
      accounts.push(MoneroWalletCore._sanitizeAccount(new MoneroAccount(accountJson)));
//      console.log("Account balance: " + accountJson.balance);
//      console.log("Account unlocked balance: " + accountJson.unlockedBalance);
//      console.log("Account balance BI: " + new BigInteger(accountJson.balance));
//      console.log("Account unlocked balance BI: " + new BigInteger(accountJson.unlockedBalance));
    }
    return accounts;
  }
  
  async getAccount(accountIdx, includeSubaddresses) {
    this._assertNotClosed();
    let accountStr = this.module.get_account(this.cppAddress, accountIdx, includeSubaddresses ? true : false);
    let accountJson = JSON.parse(accountStr);
    return MoneroWalletCore._sanitizeAccount(new MoneroAccount(accountJson));
  }
  
  async createAccount(label) {
    this._assertNotClosed();
    if (label === undefined) label = "";
    let accountStr = this.module.create_account(this.cppAddress, label);
    let accountJson = JSON.parse(accountStr);
    return MoneroWalletCore._sanitizeAccount(new MoneroAccount(accountJson));
  }
  
  async getSubaddresses(accountIdx, subaddressIndices) {
    this._assertNotClosed();
    let args = {accountIdx: accountIdx, subaddressIndices: subaddressIndices === undefined ? [] : GenUtils.listify(subaddressIndices)};
    let subaddressesJson = JSON.parse(this.module.get_subaddresses(this.cppAddress, JSON.stringify(args))).subaddresses;
    let subaddresses = [];
    for (let subaddressJson of subaddressesJson) subaddresses.push(MoneroWalletCore._sanitizeSubaddress(new MoneroSubaddress(subaddressJson)));
    return subaddresses;
  }
  
  async createSubaddress(accountIdx, label) {
    this._assertNotClosed();
    if (label === undefined) label = "";
    let subaddressStr = this.module.create_subaddress(this.cppAddress, accountIdx, label);
    let subaddressJson = JSON.parse(subaddressStr);
    return MoneroWalletCore._sanitizeSubaddress(new MoneroSubaddress(subaddressJson));
  }
  
  async getTxs(query) {
    this._assertNotClosed();
    
    // copy and normalize tx query up to block
    if (query instanceof MoneroTxQuery) query = query.copy();
    else if (Array.isArray(query)) query = new MoneroTxQuery().setTxHashes(query);
    else {
      query = Object.assign({}, query);
      query = new MoneroTxQuery(query);
    }
    if (query.getBlock() === undefined) query.setBlock(new MoneroBlock().setTxs([query]));
    if (query.getTransferQuery() === undefined) query.setTransferQuery(new MoneroTransferQuery());
    if (query.getOutputQuery() === undefined) query.setOutputQuery(new MoneroOutputQuery());
    
    // return promise which resolves on callback
    let that = this;
    return new Promise(function(resolve, reject) {
      
      // define callback for wasm
      let callbackFn = function(blocksJsonStr) {
        
        // check for error  // TODO: return {blocks: [...], errorMsg: "..."} then parse and check for it
        if (blocksJsonStr.charAt(0) !== "{") {
          reject(new MoneroError(blocksJsonStr));
          return;
        }
        
        // deserialize blocks
        let blocks = MoneroWalletCore._deserializeBlocks(blocksJsonStr);
        
        // collect txs
        let txs = [];
        for (let block of blocks) {
            MoneroWalletCore._sanitizeBlock(block); // TODO: this should be part of deserializeBlocks()
            for (let tx of block.getTxs()) {
            if (block.getHeight() === undefined) tx.setBlock(undefined); // dereference placeholder block for unconfirmed txs
            txs.push(tx);
          }
        }
      
        // re-sort txs which is lost over wasm serialization
        if (query.getTxHashes() !== undefined) {
          let txMap = new Map();
          for (let tx of txs) txMap[tx.getHash()] = tx;
          let txsSorted = [];
          for (let txHash of query.getTxHashes()) txsSorted.push(txMap[txHash]);
          txs = txsSorted;
        }
        
        // resolve promise with txs
        resolve(txs);
      }
      
      // sync wallet in wasm and invoke callback when done
      that.module.get_txs(that.cppAddress, JSON.stringify(query.getBlock().toJson()), callbackFn);
    });
  }
  
  async getTransfers(config) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async getIncomingTransfers(config) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async getOutgoingTransfers(config) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async getOutputs(config) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async getOutputsHex() {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async importOutputsHex(outputsHex) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async getKeyImages() {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async importKeyImages(keyImages) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async getNewKeyImagesFromLastImport() {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async relayTxs(txsOrMetadatas) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async sendSplit(requestOrAccountIndex, address, amount, priority) {
    this._assertNotClosed();
    
    // validate, copy, and normalize request  // TODO: this is copied from MoneroWalletRpc.sendSplit(), factor to super class which calls this with normalized request?
    let request;
    if (requestOrAccountIndex instanceof MoneroSendRequest) {
      assert.equal(arguments.length, 1, "Sending requires a send request or parameters but not both");
      request = requestOrAccountIndex;
    } else {
      if (requestOrAccountIndex instanceof Object) request = new MoneroSendRequest(requestOrAccountIndex);
      else request = new MoneroSendRequest(requestOrAccountIndex, address, amount, priority);
    }
    assert.notEqual(request.getDestinations(), undefined, "Must specify destinations");
    assert.equal(request.getSweepEachSubaddress(), undefined);
    assert.equal(request.getBelowAmount(), undefined);
    if (request.getCanSplit() === undefined) {
      request = request.copy();
      request.setCanSplit(true);
    }
    
    // return promise which resolves on callback
    let that = this;
    return new Promise(function(resolve, reject) {
      
      // define callback for wasm
      let callbackFn = function(txSetJsonStr) {
        
        // json string expected // TODO: use error handling when supported in wasm
        if (txSetJsonStr.charAt(0) !== '{') throw new Error(txSetJsonStr);
        
        // deserialize tx set
        let txSet = new MoneroTxSet(JSON.parse(txSetJsonStr));
        resolve(txSet);
      }
      
      // sync wallet in wasm and invoke callback when done
      that.module.send_split(that.cppAddress, JSON.stringify(request.toJson()), callbackFn);
    });
  }
  
  async sweepOutput(requestOrAddress, keyImage, priority) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }

  async sweepUnlocked(request) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async sweepDust() {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async sweepDust(doNotRelay) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async sign(message) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async verify(message, address, signature) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async getTxKey(txHash) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async checkTxKey(txHash, txKey, address) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async getTxProof(txHash, address, message) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async checkTxProof(txHash, address, message, signature) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async getSpendProof(txHash, message) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async checkSpendProof(txHash, message, signature) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async getReserveProofWallet(message) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async getReserveProofAccount(accountIdx, amount, message) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }

  async checkReserveProof(address, message, signature) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async getTxNotes(txHashes) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async setTxNotes(txHashes, notes) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async getAddressBookEntries() {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async getAddressBookEntries(entryIndices) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async addAddressBookEntry(address, description) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async addAddressBookEntry(address, description, paymentId) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async deleteAddressBookEntry(entryIdx) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async tagAccounts(tag, accountIndices) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }

  async untagAccounts(accountIndices) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async getAccountTags() {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }

  async setAccountTagLabel(tag, label) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async createPaymentUri(request) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async parsePaymentUri(uri) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async getAttribute(key) {
    this._assertNotClosed();
    assert(typeof key === "string", "Attribute key must be a string");
    let value = this.module.get_attribute(this.cppAddress, key);
    return value === "" ? undefined : value;
  }
  
  async setAttribute(key, val) {
    this._assertNotClosed();
    assert(typeof key === "string", "Attribute key must be a string");
    assert(typeof val === "string", "Attribute value must be a string");
    this.module.set_attribute(this.cppAddress, key, val);
  }
  
  async startMining(numThreads, backgroundMining, ignoreBattery) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async stopMining() {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async isMultisigImportNeeded() {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async isMultisig() {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async getMultisigInfo() {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async prepareMultisig() {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async makeMultisig(multisigHexes, threshold, password) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async exchangeMultisigKeys(multisigHexes, password) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async getMultisigHex() {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async importMultisigHex(multisigHexes) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async signMultisigTxHex(multisigTxHex) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }
  
  async submitMultisigTxHex(signedMultisigTxHex) {
    this._assertNotClosed();
    throw new MoneroError("Not implemented");
  }

  async save() {
    this._assertNotClosed();
        
    // path must be set
    let path = await this.getPath();
    if (path === "") throw new MoneroError("Wallet path is not set");
    
    // write address file
    FS.writeFileSync(path + ".address.txt", await this.getPrimaryAddress());
    
    // malloc cache buffer and get buffer location in c++ heap
    let cacheBufferLoc = JSON.parse(this.module.get_cache_file_buffer(this.cppAddress, this.password));
    
    // read binary data from heap to DataView
    let view = new DataView(new ArrayBuffer(cacheBufferLoc.length));
    for (let i = 0; i < cacheBufferLoc.length; i++) {
      view.setInt8(i, this.module.HEAPU8[cacheBufferLoc.pointer / Uint8Array.BYTES_PER_ELEMENT + i]);
    }
    
    // free binary on heap
    this.module._free(cacheBufferLoc.pointer);
    
    // write cache file
    FS.writeFileSync(path, view, "binary");
    
    // malloc keys buffer and get buffer location in c++ heap
    let keysBufferLoc = JSON.parse(this.module.get_keys_file_buffer(this.cppAddress, this.password, false));
    
    // read binary data from heap to DataView
    view = new DataView(new ArrayBuffer(keysBufferLoc.length)); // TODO: improve performance using DataView instead of Uint8Array?, TODO: rename to length
    for (let i = 0; i < keysBufferLoc.length; i++) {
      view.setInt8(i, this.module.HEAPU8[keysBufferLoc.pointer / Uint8Array.BYTES_PER_ELEMENT + i]);
    }
    
    // free binary on heap
    this.module._free(keysBufferLoc.pointer);
    
    // write keys file
    FS.writeFileSync(path + ".keys", view, "binary"); // TODO: make async with callback?
  }
  
  async close(save) {
    if (this._isClosed) return; // closing a closed wallet has no effect
    await super.close(save);
    delete this.path;
    delete this.password;
    this._isClosed = true;
  }
  
  // ---------------------------- PRIVATE HELPERS ----------------------------
  
  /**
   * Enables or disables listening in the c++ wallet.
   */
  _setIsListening(isEnabled) {
    console.log("setIsListening(" + isEnabled + ")");
    if (isEnabled) {
      let that = this;
      this.wasmListenerHandle = this.module.set_listener(
          this.cppAddress,
          this.wasmListenerHandle,
          function(height, startHeight, endHeight, percentDone, message) { that.wasmListener.onSyncProgress(height, startHeight, endHeight, percentDone, message); },
          function(height) { that.wasmListener.onNewBlock(height); },
          function(height, txHash, amountStr, accountIdx, subaddressIdx, version, unlockTime) { that.wasmListener.onOutputReceived(height, txHash, amountStr, accountIdx, subaddressIdx, version, unlockTime); },
          function(height, txHash, amountStr, accountIdx, subaddressIdx, version) { that.wasmListener.onOutputSpent(height, txHash, amountStr, accountIdx, subaddressIdx, version); });
    } else {
      this.wasmListenerHandle = this.module.set_listener(this.cppAddress, this.wasmListenerHandle);
    }
  }
  
  _assertNotClosed() {
    if (this._isClosed) throw new MoneroError("Wallet is closed");
  }
  
  static _sanitizeBlock(block) {
    for (let tx of block.getTxs()) MoneroWalletCore._sanitizeTxWallet(tx);
    return block;
  }
  
  static _sanitizeTxWallet(tx) {
    assert(tx instanceof MoneroTxWallet);
    return tx;
  }
  
  static _sanitizeAccount(account) {
    if (account.getSubaddresses()) {
      for (let subaddress of account.getSubaddresses()) MoneroWalletCore._sanitizeSubaddress(subaddress);
    }
    return account;
  }
  
  static _sanitizeSubaddress(subaddress) {
    if (subaddress.getLabel() === "") subaddress.setLabel(undefined);
    return subaddress
  }
  
  static _deserializeBlocks(blocksJsonStr) {
    
    // parse string to json
    let blocksJson = JSON.parse(blocksJsonStr);
    
    // initialize blocks
    let blocks = [];
    for (let blockJson of blocksJson.blocks) {
      blocks.push(new MoneroBlock(blockJson, true));
    }
    return blocks
  }
}

// ------------------------------- LISTENERS --------------------------------

/**
 * Receives notifications directly from wasm c++.
 */
class WalletWasmListener {
  
  constructor(wallet) {
    this.wallet = wallet;
  }
  
  onSyncProgress(height, startHeight, endHeight, percentDone, message) {
    for (let listener of this.wallet.getListeners()) {
      listener.onSyncProgress(height, startHeight, endHeight, percentDone, message);
    }
  }
  
  onNewBlock(height) {
    for (let listener of this.wallet.getListeners()) listener.onNewBlock(height);
  }
  
  onOutputReceived(height, txHash, amountStr, accountIdx, subaddressIdx, version, unlockTime) {
    
    // build received output
    let output = new MoneroOutputWallet();
    output.setAmount(new BigInteger(amountStr));
    output.setAccountIndex(accountIdx);
    output.setSubaddressIndex(subaddressIdx);
    let tx = new MoneroTxWallet();
    tx.setHash(txHash);
    tx.setVersion(version);
    tx.setUnlockTime(unlockTime);
    output.setTx(tx);
    tx.setOutputs([output]);
    if (height > 0) {
      let block = new MoneroBlock().setHeight(height);
      block.setTxs([tx]);
      tx.setBlock(block);
    }
    
    // notify wallet listeners
    for (let listener of this.wallet.getListeners()) listener.onOutputReceived(tx.getOutputs()[0]);
  }
  
  onOutputSpent(height, txHash, amountStr, accountIdx, subaddressIdx, version) {
    
    // build spent output
    let output = new MoneroOutputWallet();
    output.setAmount(new BigInteger(amountStr));
    output.setAccountIndex(accountIdx);
    output.setSubaddressIndex(subaddressIdx);
    let tx = new MoneroTxWallet();
    tx.setHash(txHash);
    tx.setVersion(version);
    output.setTx(tx);
    tx.setInputs([output]);
    if (height > 0) {
      let block = new MoneroBlock().setHeight(height);
      block.setTxs([tx]);
      tx.setBlock(block);
    }
    
    // notify wallet listeners
    for (let listener of this.wallet.getListeners()) listener.onOutputSpent(tx.getInputs()[0]);
  }
}

/**
 * Wraps a sync listener as a general wallet listener.
 * 
 * TODO: is this type necessary in JS?
 */
class SyncListenerWrapper extends MoneroWalletListener {
  
  constructor(listener) {
    this.listener = listener;
  }
  
  onSyncProgress(height, startHeight, endHeight, percentDone, message) {
    listener.onSyncProgress(height, startHeight, endHeight, percentDone, message);
  }
}

module.exports = MoneroWalletCore;