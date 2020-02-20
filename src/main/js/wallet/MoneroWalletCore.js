/**
 * Implements a MoneroWallet using WebAssembly to bridge to monero-project's wallet2.
 * 
 * TODO: add assertNotClosed() per JNI
 */
class MoneroWalletCore extends MoneroWalletKeys {
  
  // --------------------------- STATIC UTILITIES -----------------------------
  
  // TODO: look for keys file
  static async walletExists(path, fs) {
    assert(path, "Must provide a path to look for a wallet");
    if (!fs) fs = require('fs');
    let exists = fs.existsSync(path);
    console.log("Wallet exists at " + path + ": " + exists);
    return exists;
  }
  
  static async openWallet(path, password, networkType, daemonUriOrConnection, proxyToWorker, fs) {
    if (!await this.walletExists(path, fs)) throw new MoneroError("Wallet does not exist at path: " + path);
    
    // read wallet files
    let keysData = fs.readFileSync(path + ".keys");
    let cacheData = fs.readFileSync(path);
    
    // open wallet data
    return this._openWalletData(path, password, networkType, keysData, cacheData, daemonUriOrConnection, proxyToWorker, fs);
  }
  
  static async openWalletData(path, password, networkType, keysData, cacheData, daemonUriOrConnection, proxyToWorker, fs) {
    return MoneroWalletCore._openWalletData(path, password, networkType, keysData, cacheData, daemonUriOrConnection, proxyToWorker, fs);
  }
  
  // private helper
  static async _openWalletData(path, password, networkType, keysData, cacheData, daemonUriOrConnection, proxyToWorker, fs) {
    if (proxyToWorker) return MoneroWalletCoreProxy.openWalletData(path, password, networkType, keysData, cacheData, daemonUriOrConnection, fs);
    
    // validate and normalize parameters
    assert(password, "Must provide a password to open the wallet");
    if (networkType === undefined) throw new MoneroError("Must provide the wallet's network type");
    MoneroNetworkType.validate(networkType);
    let daemonConnection = typeof daemonUriOrConnection === "string" ? new MoneroRpcConnection(daemonUriOrConnection) : daemonUriOrConnection;
    let daemonUri = daemonConnection && daemonConnection.getUri() ? daemonConnection.getUri() : "";
    let daemonUsername = daemonConnection && daemonConnection.getUsername() ? daemonConnection.getUsername() : "";
    let daemonPassword = daemonConnection && daemonConnection.getPassword() ? daemonConnection.getPassword() : "";
    
    // load wasm module
    let module = await MoneroUtils.loadWasmModule();
    
    // open wallet in queue
    return module.queueTask(async function() {
      return new Promise(function(resolve, reject) {
      
        // define callback for wasm
        let callbackFn = async function(cppAddress) {
          let wallet = new MoneroWalletCore(cppAddress, path, password, fs);
          resolve(wallet);
        };
        
        // create wallet in wasm and invoke callback when done
        module.open_core_wallet(password, networkType, keysData, cacheData, daemonUri, daemonUsername, daemonPassword, callbackFn);
      });
    });
  }
  
  static async createWalletRandom(path, password, networkType, daemonUriOrConnection, language, proxyToWorker, fs) {
    if (proxyToWorker) return MoneroWalletCoreProxy.createWalletRandom(path, password, networkType, daemonUriOrConnection, language, fs);
    
    // validate and normalize params
    if (path && !fs) fs = require('fs');
    if (path === undefined) path = "";
    assert(password, "Must provide a password to create the wallet with");
    MoneroNetworkType.validate(networkType);
    if (language === undefined) language = "English";
    let daemonConnection = typeof daemonUriOrConnection === "string" ? new MoneroRpcConnection(daemonUriOrConnection) : daemonUriOrConnection;
    let daemonUri = daemonConnection && daemonConnection.getUri() ? daemonConnection.getUri() : "";
    let daemonUsername = daemonConnection && daemonConnection.getUsername() ? daemonConnection.getUsername() : "";
    let daemonPassword = daemonConnection && daemonConnection.getPassword() ? daemonConnection.getPassword() : "";
    
    // load wasm module
    let module = await MoneroUtils.loadWasmModule();
    
    // create wallet in queue
    let wallet = await module.queueTask(async function() {
      return new Promise(function(resolve, reject) {
      
        // define callback for wasm
        let callbackFn = async function(cppAddress) {
          let wallet = new MoneroWalletCore(cppAddress, path, password, fs);
          resolve(wallet);
        };
        
        // create wallet in wasm and invoke callback when done
        module.create_core_wallet_random(password, networkType, daemonUri, daemonUsername, daemonPassword, language, callbackFn);
      });
    });
    
    // save wallet
    if (path) await wallet.save();
    return wallet;
  }
  
  static async createWalletFromMnemonic(path, password, networkType, mnemonic, daemonUriOrConnection, restoreHeight, seedOffset, proxyToWorker, fs) {
    if (proxyToWorker) return MoneroWalletCoreProxy.createWalletFromMnemonic(path, password, networkType, mnemonic, daemonUriOrConnection, restoreHeight, seedOffset, fs);
    
    // validate and normalize params
    if (path === undefined) path = "";
    assert(password, "Must provide a password to create the wallet with");
    MoneroNetworkType.validate(networkType);
    let daemonConnection = typeof daemonUriOrConnection === "string" ? new MoneroRpcConnection(daemonUriOrConnection) : daemonUriOrConnection;
    let daemonUri = daemonConnection && daemonConnection.getUri() ? daemonConnection.getUri() : "";
    let daemonUsername = daemonConnection && daemonConnection.getUsername() ? daemonConnection.getUsername() : "";
    let daemonPassword = daemonConnection && daemonConnection.getPassword() ? daemonConnection.getPassword() : "";
    if (restoreHeight === undefined) restoreHeight = 0;
    if (seedOffset === undefined) seedOffset = "";
    
    // load wasm module
    let module = await MoneroUtils.loadWasmModule();
    
    // create wallet in queue
    let wallet = await module.queueTask(async function() {
      return new Promise(function(resolve, reject) {
      
        // define callback for wasm
        let callbackFn = async function(cppAddress) {
          let wallet = new MoneroWalletCore(cppAddress, path, password, fs);
          resolve(wallet);
        };
        
        // create wallet in wasm and invoke callback when done
        module.create_core_wallet_from_mnemonic(password, networkType, mnemonic, daemonUri, daemonUsername, daemonPassword, restoreHeight, seedOffset, callbackFn);
      });
    });
    
    // save wallet
    if (path) await wallet.save();
    return wallet;
  }
  
  static async createWalletFromKeys(path, password, networkType, address, viewKey, spendKey, daemonUriOrConnection, restoreHeight, language, proxyToWorker, fs) {
    if (proxyToWorker) return MoneroWalletCoreProxy.createWalletFromKeys(path, password, networkType, address, viewKey, spendKey, daemonUriOrConnection, restoreHeight, language, fs);
    
    // validate and normalize params
    if (path === undefined) path = "";
    assert(password, "Must provide a password to create the wallet with");
    MoneroNetworkType.validate(networkType);
    if (address === undefined) address = "";
    if (viewKey === undefined) viewKey = "";
    if (spendKey === undefined) spendKey = "";
    let daemonConnection = typeof daemonUriOrConnection === "string" ? new MoneroRpcConnection(daemonUriOrConnection) : daemonUriOrConnection;
    let daemonUri = daemonConnection && daemonConnection.getUri() ? daemonConnection.getUri() : "";
    let daemonUsername = daemonConnection && daemonConnection.getUsername() ? daemonConnection.getUsername() : "";
    let daemonPassword = daemonConnection && daemonConnection.getPassword() ? daemonConnection.getPassword() : "";
    if (restoreHeight === undefined) restoreHeight = 0;
    if (language === undefined) language = "English";
    
    // load wasm module
    let module = await MoneroUtils.loadWasmModule();
    
    // create wallet in queue
    let wallet = await module.queueTask(async function() {
      return new Promise(function(resolve, reject) {
      
        // define callback for wasm
        let callbackFn = async function(cppAddress) {
          let wallet = new MoneroWalletCore(cppAddress, path, password, fs);
          resolve(wallet);
        };
        
        // create wallet in wasm and invoke callback when done
        module.create_core_wallet_from_keys(password, networkType, address, viewKey, spendKey, daemonUri, daemonUsername, daemonPassword, restoreHeight, language, callbackFn);
      });
    });
    
    // save wallet
    if (path) await wallet.save();
    return wallet;
  }
  
  static async getMnemonicLanguages() {
    let module = await MoneroUtils.loadWasmModule();  // load wasm module
    return module.queueTask(async function() {
      return JSON.parse(module.get_keys_wallet_mnemonic_languages()).languages;
    });
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
   * @param {FileSystem} fs provides a minimal file system interface (read, write, delete, exists) (defaults to require('fs'))
   */
  constructor(cppAddress, path, password, fs) {
    super(cppAddress);
    this.path = path;
    this.password = password;
    this.listeners = [];
    this.fs = fs ? fs : require('fs');
    this._isClosed = false; // TODO: rename other member variables with "_*", be consistent
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
    
    // set connection in queue
    let that = this;
    return that.module.queueTask(async function() {
      return new Promise(function(resolve, reject) {
      
        // define callback for wasm
        let callbackFn = function(resp) {
          resolve();
        }
        
        // sync wallet in wasm and invoke callback when done
        that.module.set_daemon_connection(that.cppAddress, uri, username, password, callbackFn);
      });
    });
  }
  
  /**
   * Get the wallet's daemon connection.
   * 
   * @return {MoneroRpcConnection} the wallet's daemon connection
   */
  async getDaemonConnection() {
    this._assertNotClosed();
    let that = this;
    return that.module.queueTask(async function() {
      return new Promise(function(resolve, reject) {
        let connectionContainerStr = that.module.get_daemon_connection(that.cppAddress);
        if (!connectionContainerStr) {
          resolve();
          return; // TODO: switch to await new Promise
        }
        let connectionContainer = JSON.parse(connectionContainerStr);
        resolve(new MoneroRpcConnection({  // TODO: reconcile username vs user, password vs pass, then can pass container directly to MoneroRpcConnection (breaking change)
          uri: connectionContainer.uri,
          user: connectionContainer.username,
          pass: connectionContainer.password
        }));
      });
    });
  }
  
  /**
   * Indicates if the wallet is connected to daemon.
   * 
   * @return {boolean} true if the wallet is connected to a daemon, false otherwise
   */
  async isConnected() {
    this._assertNotClosed();
    let that = this;
    return that.module.queueTask(async function() {
      return new Promise(function(resolve, reject) {
      
        // define callback for wasm
        let callbackFn = function(resp) {
          resolve(resp);
        }
        
        // sync wallet in wasm and invoke callback when done
        that.module.is_connected(that.cppAddress, callbackFn);
      });
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
    return that.module.queueTask(async function() {
      return new Promise(function(resolve, reject) {
      
        // define callback for wasm
        let callbackFn = function(resp) {
          resolve(resp);
        }
        
        // sync wallet in wasm and invoke callback when done
        that.module.get_daemon_max_peer_height(that.cppAddress, callbackFn);
      });
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
    return that.module.queueTask(async function() {
      return new Promise(function(resolve, reject) {
      
        // define callback for wasm
        let callbackFn = function(resp) {
          resolve(resp);
        }
        
        // sync wallet in wasm and invoke callback when done
        that.module.is_daemon_synced(that.cppAddress, callbackFn);
      });
    });
  }
  
  /**
   * Indicates if the wallet is synced with the daemon.
   * 
   * @return {boolean} true if the wallet is synced with the daemon, false otherwise
   */
  async isSynced() {
    this._assertNotClosed();
    
    // schedule task
    let that = this;
    return that.module.queueTask(async function() {
      return new Promise(function(resolve, reject) {
      
        // define callback for wasm
        let callbackFn = function(resp) {
          resolve(resp);
        }
        
        // sync wallet in wasm and invoke callback when done
        that.module.is_synced(that.cppAddress, callbackFn);
      });
    });
  }
  
  /**
   * Get the wallet's network type (mainnet, testnet, or stagenet).
   * 
   * @return {MoneroNetworkType} the wallet's network type
   */
  async getNetworkType() {
    this._assertNotClosed();
    let that = this;
    return that.module.queueTask(async function() {
      return that.module.get_network_type(that.cppAddress);
    });
  }
  
  /**
   * Get the height of the first block that the wallet scans.
   * 
   * @return {number} the height of the first block that the wallet scans
   */
  async getRestoreHeight() {
    this._assertNotClosed();
    let that = this;
    return that.module.queueTask(async function() {
      return that.module.get_restore_height(that.cppAddress);
    });
  }
  
  /**
   * Set the height of the first block that the wallet scans.
   * 
   * @param {number} restoreHeight is the height of the first block that the wallet scans
   */
  async setRestoreHeight(restoreHeight) {
    this._assertNotClosed();
    let that = this;
    return that.module.queueTask(async function() {
      return that.module.set_restore_height(that.cppAddress, restoreHeight);
    });
  }
  
  /**
   * Register a listener receive wallet notifications.
   * 
   * @param {MoneroWalletListener} listener is the listener to receive wallet notifications
   */
  async addListener(listener) {
    this._assertNotClosed();
    assert(listener instanceof MoneroWalletListener);
    this.listeners.push(listener);
    await this._setIsListening(true);
  }
  
  /**
   * Unregister a listener to receive wallet notifications.
   * 
   * @param {MoneroWalletListener} listener is the listener to unregister
   */
  async removeListener(listener) {
    this._assertNotClosed();
    let idx = this.listeners.indexOf(listener);
    if (idx > -1) this.listeners.splice(idx, 1);
    else throw new MoneroError("Listener is not registered to wallet");
    if (this.listeners.length === 0) await this._setIsListening(false);
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
    let that = this;
    return that.module.queueTask(async function() {
      return new Promise(function(resolve, reject) {
        
        // define callback for wasm
        let callbackFn = function(resp) {
          resolve(resp);
        }
        
        // sync wallet in wasm and invoke callback when done
        that.module.get_height(that.cppAddress, callbackFn);
      });
    });
  }
  
  async getDaemonHeight() {
    this._assertNotClosed();
    if (!(await this.isConnected())) throw new MoneroError("Wallet is not connected to daemon");
    
    // schedule task
    let that = this;
    return that.module.queueTask(async function() {
      return new Promise(function(resolve, reject) {
        
        // define callback for wasm
        let callbackFn = function(resp) {
          resolve(resp);
        }
        
        // sync wallet in wasm and invoke callback when done
        that.module.get_daemon_height(that.cppAddress, callbackFn);
      });
    });
  }
  
  async sync(listenerOrStartHeight, startHeight) {
    this._assertNotClosed();
    if (!(await this.isConnected())) throw new MoneroError("Wallet is not connected to daemon");
    
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
    
    // sync wallet
    let that = this;
    let result = await that.module.queueTask(async function() {
      return new Promise(function(resolve, reject) {
      
        // define callback for wasm
        let callbackFn = async function(resp) {
          let respJson = JSON.parse(resp);
          let result = new MoneroSyncResult(respJson.numBlocksFetched, respJson.receivedMoney);
          let err;
          try {
            resolve(result);
          } catch (e) {
            reject(e);
          }
        }
        
        // sync wallet in wasm and invoke callback when done
        that.module.sync(that.cppAddress, startHeight, callbackFn);
      });
    });
    
    // unregister sync listener wrapper
    if (syncListenerWrapper !== undefined) {  // TODO: test that this is executed with error e.g. sync an unconnected wallet
      await that.removeListener(syncListenerWrapper); // unregister sync listener
    }
    
    return result;
  }
  
  async startSyncing() {
    this._assertNotClosed();
    if (!(await this.isConnected())) throw new MoneroError("Wallet is not connected to daemon");
    if (!this._syncingEnabled) {
      this._syncingEnabled = true;
      if (!this._syncLoopStarted) this._startSyncLoop();  // start loop to auto-sync wallet when enabled
    }
  }
    
  async stopSyncing() {
    this._assertNotClosed();
    if (!this._syncingThreadDone) {
      this._syncingEnabled = false;
    }
  }
  
  // rescanSpent
  // rescanBlockchain
  
  async getBalance(accountIdx, subaddressIdx) {
    this._assertNotClosed();
    
    // schedule task
    let that = this;
    return that.module.queueTask(async function() {
      
      // get balance encoded in json string
      let balanceStr;
      if (accountIdx === undefined) {
        assert(subaddressIdx === undefined, "Subaddress index must be undefined if account index is undefined");
        balanceStr = that.module.get_balance_wallet(that.cppAddress);
      } else if (subaddressIdx === undefined) {
        balanceStr = that.module.get_balance_account(that.cppAddress, accountIdx);
      } else {
        balanceStr = that.module.get_balance_subaddress(that.cppAddress, accountIdx, subaddressIdx);
      }
      
      // parse json string to BigInteger
      return BigInteger.parse(JSON.parse(balanceStr).balance);
    });
  }
  
  async getUnlockedBalance(accountIdx, subaddressIdx) {
    this._assertNotClosed();
    
    // schedule task
    let that = this;
    return that.module.queueTask(async function() {
      
      // get balance encoded in json string
      let unlockedBalanceStr;
      if (accountIdx === undefined) {
        assert(subaddressIdx === undefined, "Subaddress index must be undefined if account index is undefined");
        unlockedBalanceStr = that.module.get_unlocked_balance_wallet(that.cppAddress);
      } else if (subaddressIdx === undefined) {
        unlockedBalanceStr = that.module.get_unlocked_balance_account(that.cppAddress, accountIdx);
      } else {
        unlockedBalanceStr = that.module.get_unlocked_balance_subaddress(that.cppAddress, accountIdx, subaddressIdx);
      }
      
      // parse json string to BigInteger
      return BigInteger.parse(JSON.parse(unlockedBalanceStr).unlockedBalance);
    });
  }
  
  async getAccounts(includeSubaddresses, tag) {
    this._assertNotClosed();
    let that = this;
    return that.module.queueTask(async function() {
      let accountsStr = that.module.get_accounts(that.cppAddress, includeSubaddresses ? true : false, tag ? tag : "");
      let accounts = [];
      for (let accountJson of JSON.parse(accountsStr).accounts) {
        accounts.push(MoneroWalletCore._sanitizeAccount(new MoneroAccount(accountJson)));
      }
      return accounts;
    });
  }
  
  async getAccount(accountIdx, includeSubaddresses) {
    this._assertNotClosed();
    let that = this;
    return that.module.queueTask(async function() {
      let accountStr = that.module.get_account(that.cppAddress, accountIdx, includeSubaddresses ? true : false);
      let accountJson = JSON.parse(accountStr);
      return MoneroWalletCore._sanitizeAccount(new MoneroAccount(accountJson));
    });

  }
  
  async createAccount(label) {
    this._assertNotClosed();
    if (label === undefined) label = "";
    let that = this;
    return that.module.queueTask(async function() {
      let accountStr = that.module.create_account(that.cppAddress, label);
      let accountJson = JSON.parse(accountStr);
      return MoneroWalletCore._sanitizeAccount(new MoneroAccount(accountJson));
    });
  }
  
  async getSubaddresses(accountIdx, subaddressIndices) {
    this._assertNotClosed();
    let args = {accountIdx: accountIdx, subaddressIndices: subaddressIndices === undefined ? [] : GenUtils.listify(subaddressIndices)};
    let that = this;
    return that.module.queueTask(async function() {
      let subaddressesJson = JSON.parse(that.module.get_subaddresses(that.cppAddress, JSON.stringify(args))).subaddresses;
      let subaddresses = [];
      for (let subaddressJson of subaddressesJson) subaddresses.push(MoneroWalletCore._sanitizeSubaddress(new MoneroSubaddress(subaddressJson)));
      return subaddresses;
    });
  }
  
  async createSubaddress(accountIdx, label) {
    this._assertNotClosed();
    if (label === undefined) label = "";
    let that = this;
    return that.module.queueTask(async function() {
      let subaddressStr = that.module.create_subaddress(that.cppAddress, accountIdx, label);
      let subaddressJson = JSON.parse(subaddressStr);
      return MoneroWalletCore._sanitizeSubaddress(new MoneroSubaddress(subaddressJson));
    });
  }
  
  async getTxs(query) {
    this._assertNotClosed();
    
    // copy and normalize query up to block
    query = MoneroWalletCore._normalizeTxQuery(query);
    
    // schedule task
    let that = this;
    return that.module.queueTask(async function() {
      return new Promise(function(resolve, reject) {
        
        // define callback for wasm
        let callbackFn = function(blocksJsonStr) {
          
          // check for error  // TODO: return {blocks: [...], errorMsg: "..."} then parse and check for it
          if (blocksJsonStr.charAt(0) !== "{") {
            reject(new MoneroError(blocksJsonStr));
            return;
          }
          
          // initialize txs from blocks json string
          let txs = MoneroWalletCore._blocksJsonToTxs(query, blocksJsonStr);
          
          // resolve promise with txs
          resolve(txs);
        }
        
        // sync wallet in wasm and invoke callback when done
        that.module.get_txs(that.cppAddress, JSON.stringify(query.getBlock().toJson()), callbackFn);
      });
    });
  }
  
  async getTransfers(query) {
    this._assertNotClosed();
    
    // copy and normalize query up to block
    query = MoneroWalletCore._normalizeTransferQuery(query);
    
    // minimal validation // TODO: validate all uints for c++
    if (query.getAccountIndex() !== undefined) assert(query.getAccountIndex() >= 0);
    if (query.getSubaddressIndex() !== undefined) assert(query.getSubaddressIndex() >= 0);
    if (query.getSubaddressIndices() !== undefined) for (let subaddressIdx of query.getSubaddressIndices()) assert(subaddressIdx >= 0);
    
    // return promise which resolves on callback
    let that = this;
    return that.module.queueTask(async function() {
      return new Promise(function(resolve, reject) {
        
        // define callback for wasm
        let callbackFn = function(blocksJsonStr) {
          
          // check for error  // TODO: return {blocks: [...], errorMsg: "..."} then parse and check for it
          if (blocksJsonStr.charAt(0) !== "{") {
            reject(new MoneroError(blocksJsonStr));
            return;
          }
          
          // initialize transfers from blocks json string
          let transfers = MoneroWalletCore._blocksJsonToTransfers(query, blocksJsonStr)
          
          // resolve promise with transfers
          resolve(transfers);
        }
        
        // sync wallet in wasm and invoke callback when done
        that.module.get_transfers(that.cppAddress, JSON.stringify(query.getTxQuery().getBlock().toJson()), callbackFn);
      });
    });
  }
  
  async getOutputs(query) {
    this._assertNotClosed();
    
    // copy and normalize query up to block
    query = MoneroWalletCore._normalizeOutputQuery(query);
    
    // return promise which resolves on callback
    let that = this;
    return that.module.queueTask(async function() {
      return new Promise(function(resolve, reject) {
        
        // define callback for wasm
        let callbackFn = function(blocksJsonStr) {
          
          // check for error  // TODO: return {blocks: [...], errorMsg: "..."} then parse and check for it
          if (blocksJsonStr.charAt(0) !== "{") {
            reject(new MoneroError(blocksJsonStr));
            return;
          }
          
          // initialize outputs from blocks json string
          let outputs = MoneroWalletCore._blocksJsonToOutputs(query, blocksJsonStr);
          
          // resolve promise with outputs
          resolve(outputs);
        }
        
        // sync wallet in wasm and invoke callback when done
        that.module.get_outputs(that.cppAddress, JSON.stringify(query.getTxQuery().getBlock().toJson()), callbackFn);
      });
    });
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
      assert(address === undefined && amount === undefined && priority === undefined, "Sending requires a send request or parameters but not both");
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
    return that.module.queueTask(async function() {
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
    let that = this;
    return that.module.queueTask(async function() {
      let value = that.module.get_attribute(that.cppAddress, key);
      return value === "" ? null : value;
    });
  }
  
  async setAttribute(key, val) {
    this._assertNotClosed();
    assert(typeof key === "string", "Attribute key must be a string");
    assert(typeof val === "string", "Attribute value must be a string");
    let that = this;
    return that.module.queueTask(async function() {
      that.module.set_attribute(that.cppAddress, key, val);
    });
  }
  
  async startMining(numThreads, backgroundMining, ignoreBattery) {
    this._assertNotClosed();
    let daemon = new MoneroDaemonRpc((await this.getDaemonConnection()).getConfig()); // TODO: accept daemon connection
    await daemon.startMining(await this.getPrimaryAddress(), numThreads, backgroundMining, ignoreBattery);
  }
  
  async stopMining() {
    this._assertNotClosed();
    let daemon = new MoneroDaemonRpc((await this.getDaemonConnection()).getConfig()); // TODO: accept daemon connection
    await daemon.stopMining();
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
  
  /**
   * Get the wallet's keys and cache data.
   * 
   * @return {DataView[]} is the keys and cache data respectively
   */
  async getData() {
    
    // queue call to wasm module
    let that = this;
    return that.module.queueTask(async function() {

      // store views in array
      let views = [];
      
      // malloc cache buffer and get buffer location in c++ heap
      let cacheBufferLoc = JSON.parse(that.module.get_cache_file_buffer(that.cppAddress, that.password));
      
      // read binary data from heap to DataView
      let view = new DataView(new ArrayBuffer(cacheBufferLoc.length));
      for (let i = 0; i < cacheBufferLoc.length; i++) {
        view.setInt8(i, that.module.HEAPU8[cacheBufferLoc.pointer / Uint8Array.BYTES_PER_ELEMENT + i]);
      }
      
      // free binary on heap
      that.module._free(cacheBufferLoc.pointer);
      
      // write cache file
      views.push(Buffer.from(view.buffer));
      
      // malloc keys buffer and get buffer location in c++ heap
      let keysBufferLoc = JSON.parse(that.module.get_keys_file_buffer(that.cppAddress, that.password, false));
      
      // read binary data from heap to DataView
      view = new DataView(new ArrayBuffer(keysBufferLoc.length)); // TODO: improve performance using DataView instead of Uint8Array?, TODO: rename to length
      for (let i = 0; i < keysBufferLoc.length; i++) {
        view.setInt8(i, that.module.HEAPU8[keysBufferLoc.pointer / Uint8Array.BYTES_PER_ELEMENT + i]);
      }
      
      // free binary on heap
      that.module._free(keysBufferLoc.pointer);
      
      // prepend keys file
      views.unshift(Buffer.from(view.buffer));
      return views;
    });
  }

  async save() {
    this._assertNotClosed();
        
    // path must be set
    let path = await this.getPath();
    if (path === "") throw new MoneroError("Wallet path is not set");
    
    // write address file
    this.fs.writeFileSync(path + ".address.txt", await this.getPrimaryAddress());
    
    // write keys and cache data
    let data = await this.getData();
    this.fs.writeFileSync(path + ".keys", data[0], "binary");
    this.fs.writeFileSync(path, data[1], "binary");
  }
  
  async close(save) {
    if (this._isClosed) return; // closing a closed wallet has no effect
    if (!this._syncingThreadDone) {
      this._syncingEnabled = false;
      this._syncingThreadDone = true;
    }
    await this._setIsListening(false);  // TODO: port to jni
    await this.stopSyncing();
    await super.close(save);
    delete this.path;
    delete this.password;
    delete this.listeners;
    delete this.wasmListener;
  }
  
  // ---------------------------- PRIVATE HELPERS ----------------------------
  
  /**
   * Loop until this._syncingThreadDone = true.
   */
  async _startSyncLoop() {
    if (this._syncLoopStarted) return;
    this._syncLoopStarted = true;
    while (true) {
      if (this._syncingThreadDone) break;
      await new Promise(function(resolve) { setTimeout(resolve, MoneroUtils.WALLET_REFRESH_RATE); });
      if (this._syncingEnabled) {
        console.log("Background synchronizing " + await this.getPath());
        await this.sync();
      }
    }
  }
  
  /**
   * Enables or disables listening in the c++ wallet.
   */
  async _setIsListening(isEnabled) {
    let that = this;
    return that.module.queueTask(async function() {
      if (isEnabled) {
        that.wasmListenerHandle = that.module.set_listener(
            that.cppAddress,
            that.wasmListenerHandle,
            function(height, startHeight, endHeight, percentDone, message) { that.wasmListener.onSyncProgress(height, startHeight, endHeight, percentDone, message); },
            function(height) { that.wasmListener.onNewBlock(height); },
            function(height, txHash, amountStr, accountIdx, subaddressIdx, version, unlockTime) { that.wasmListener.onOutputReceived(height, txHash, amountStr, accountIdx, subaddressIdx, version, unlockTime); },
            function(height, txHash, amountStr, accountIdx, subaddressIdx, version) { that.wasmListener.onOutputSpent(height, txHash, amountStr, accountIdx, subaddressIdx, version); });
      } else {
        that.wasmListenerHandle = that.module.set_listener(that.cppAddress, that.wasmListenerHandle, undefined, undefined, undefined, undefined);
      }
    });
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
  
  static _deserializeBlocks(blocksJsonStr, txType) {
    if (txType === undefined) txType = MoneroBlock.DeserializationType.TX_WALLET;
    
    // parse string to json
    let blocksJson = JSON.parse(blocksJsonStr);
    
    // initialize blocks
    let blocks = [];
    for (let blockJson of blocksJson.blocks) {
      blocks.push(new MoneroBlock(blockJson, txType));
    }
    return blocks
  }
  
  static _normalizeTxQuery(query) {
    if (query instanceof MoneroTxQuery) query = query.copy();
    else if (Array.isArray(query)) query = new MoneroTxQuery().setTxHashes(query);
    else {
      query = Object.assign({}, query);
      query = new MoneroTxQuery(query);
    }
    if (query.getBlock() === undefined) query.setBlock(new MoneroBlock().setTxs([query]));
    if (query.getTransferQuery() === undefined) query.setTransferQuery(new MoneroTransferQuery());
    if (query.getOutputQuery() === undefined) query.setOutputQuery(new MoneroOutputQuery());
    return query;
  }
  
  static _normalizeTransferQuery(query) {
    if (query === undefined) query = new MoneroTransferQuery();
    else if (query instanceof MoneroTransferQuery) {
      if (query.getTxQuery() === undefined) query = query.copy();
      else {
        let txQuery = query.getTxQuery().copy();
        if (query.getTxQuery().getTransferQuery() === query) query = txQuery.getTransferQuery();
        else {
          assert.equal(query.getTxQuery().getTransferQuery(), undefined, "Transfer query's tx query must be circular reference or null");
          query = query.copy();
          query.setTxQuery(txQuery);
        }
      }
    } else {
      query = Object.assign({}, query);
      query = new MoneroTransferQuery(query).setTxQuery(new MoneroTxQuery(query));
    }
    if (query.getTxQuery() === undefined) query.setTxQuery(new MoneroTxQuery());
    query.getTxQuery().setTransferQuery(query);
    if (query.getTxQuery().getBlock() === undefined) query.getTxQuery().setBlock(new MoneroBlock().setTxs([query.getTxQuery()]));
    return query;
  }
  
  static _normalizeOutputQuery(query) {
    if (query === undefined) query = new MoneroOutputQuery();
    else if (query instanceof MoneroOutputQuery) {
      if (query.getTxQuery() === undefined) query = query.copy();
      else {
        let txQuery = query.getTxQuery().copy();
        if (query.getTxQuery().getOutputQuery() === query) query = txQuery.getOutputQuery();
        else {
          assert.equal(query.getTxQuery().getOutputQuery(), undefined, "Output query's tx query must be circular reference or null");
          query = query.copy();
          query.setTxQuery(txQuery);
        }
      }
    } else {
      query = Object.assign({}, query);
      query = new MoneroOutputQuery(query).setTxQuery(new MoneroTxQuery(query));
    }
    if (query.getTxQuery() === undefined) query.setTxQuery(new MoneroTxQuery());
    query.getTxQuery().setOutputQuery(query);
    if (query.getTxQuery().getBlock() === undefined) query.getTxQuery().setBlock(new MoneroBlock().setTxs([query.getTxQuery()]));
    return query;
  }
  
  static _blocksJsonToTxs(query, blocksJsonStr) {
    
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
  
    // re-sort txs which is lost over wasm serialization  // TODO: why would order be lost? confirm
    if (query.getTxHashes() !== undefined) {
      let txMap = new Map();
      for (let tx of txs) txMap[tx.getHash()] = tx;
      let txsSorted = [];
      for (let txHash of query.getTxHashes()) txsSorted.push(txMap[txHash]);
      txs = txsSorted;
    }
    
    return txs;
  }
  
  static _blocksJsonToTransfers(query, blocksJsonStr) {
    
    // deserialize blocks
    let blocks = MoneroWalletCore._deserializeBlocks(blocksJsonStr);
    
    // collect transfers
    let transfers = [];
    for (let block of blocks) {
      MoneroWalletCore._sanitizeBlock(block);
      for (let tx of block.getTxs()) {
        if (block.getHeight() === undefined) tx.setBlock(undefined); // dereference placeholder block for unconfirmed txs
        if (tx.getOutgoingTransfer() !== undefined) transfers.push(tx.getOutgoingTransfer());
        if (tx.getIncomingTransfers() !== undefined) {
          for (let transfer of tx.getIncomingTransfers()) transfers.push(transfer);
        }
      }
    }
    
    return transfers;
  }
  
  static _blocksJsonToOutputs(query, blocksJsonStr) {
    
    // deserialize blocks
    let blocks = MoneroWalletCore._deserializeBlocks(blocksJsonStr);
    
    // collect outputs
    let outputs = [];
    for (let block of blocks) {
      MoneroWalletCore._sanitizeBlock(block);
      for (let tx of block.getTxs()) {
        for (let output of tx.getOutputs()) outputs.push(output);
      }
    }
    
    return outputs;
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
    output.setAmount(BigInteger.parse(amountStr));
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
    output.setAmount(BigInteger.parse(amountStr));
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
    super();
    this.listener = listener;
  }
  
  onSyncProgress(height, startHeight, endHeight, percentDone, message) {
    this.listener.onSyncProgress(height, startHeight, endHeight, percentDone, message);
  }
}

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
 * TODO: format some methods as single lines?
 */
class MoneroWalletCoreProxy extends MoneroWallet {
  
  // -------------------------- WALLET STATIC UTILS ---------------------------
  
  static async openWalletData(path, password, networkType, keysData, cacheData, daemonUriOrConnection, fs) {
    let walletId = GenUtils.uuidv4();
    let daemonUriOrConfig = daemonUriOrConnection instanceof MoneroRpcConnection ? daemonUriOrConnection.getConfig() : daemonUriOrConnection;
    await MoneroUtils.invokeWorker(walletId, "openWalletData", [password, networkType, keysData, cacheData, daemonUriOrConfig]);
    let wallet = new MoneroWalletCoreProxy(walletId, MoneroUtils.getWorker(), path, fs);
    if (path) await wallet.save();
    return wallet;
  }
  
  static async createWalletRandom(path, password, networkType, daemonUriOrConnection, language, fs) {
    let walletId = GenUtils.uuidv4();
    let daemonUriOrConfig = daemonUriOrConnection instanceof MoneroRpcConnection ? daemonUriOrConnection.getConfig() : daemonUriOrConnection;
    await MoneroUtils.invokeWorker(walletId, "createWalletRandom", [password, networkType, daemonUriOrConfig, language]);
    let wallet = new MoneroWalletCoreProxy(walletId, MoneroUtils.getWorker(), path, fs);
    if (path) await wallet.save();
    return wallet;
  }
  
  static async createWalletFromMnemonic(path, password, networkType, mnemonic, daemonUriOrConnection, restoreHeight, seedOffset, fs) {
    let walletId = GenUtils.uuidv4();
    let daemonUriOrConfig = daemonUriOrConnection instanceof MoneroRpcConnection ? daemonUriOrConnection.getConfig() : daemonUriOrConnection;
    await MoneroUtils.invokeWorker(walletId, "createWalletFromMnemonic", [password, networkType, mnemonic, daemonUriOrConfig, restoreHeight, seedOffset]);
    let wallet = new MoneroWalletCoreProxy(walletId, MoneroUtils.getWorker(), path, fs);
    if (path) await wallet.save();
    return wallet;
  }
  
  static async createWalletFromKeys(path, password, networkType, address, viewKey, spendKey, daemonUriOrConnection, restoreHeight, language, fs) {
    let walletId = GenUtils.uuidv4();
    let daemonUriOrConfig = daemonUriOrConnection instanceof MoneroRpcConnection ? daemonUriOrConnection.getConfig() : daemonUriOrConnection;
    await MoneroUtils.invokeWorker(walletId, "createWalletFromKeys", [password, networkType, address, viewKey, spendKey, daemonUriOrConfig, restoreHeight, language]);
    let wallet = new MoneroWalletCoreProxy(walletId, MoneroUtils.getWorker(), path, fs);
    if (path) await wallet.save();
    return wallet;
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
  constructor(walletId, worker, path, fs) {
    super();
    this.walletId = walletId;
    this.worker = worker;
    this.path = path;
    this.fs = fs;
    this.wrappedListeners = [];
    assert(walletId); // TODO: remove this (bad wallet ids will be part of error message)
  }
  
  async getNetworkType() {
    return this._invokeWorker("getNetworkType");
  }
  
  async getVersion() {
    throw new Error("Not implemented");
  }
  
  getPath() {
    return this.path;
  }
  
  async getMnemonic() {
    return this._invokeWorker("getMnemonic");
  }
  
  async getMnemonicLanguage() {
    return this._invokeWorker("getMnemonicLanguage");
  }
  
  async getMnemonicLanguages() {
    return this._invokeWorker("getMnemonicLanguages");
  }
  
  async getPrivateSpendKey() {
    return this._invokeWorker("getPrivateSpendKey");
  }
  
  async getPrivateViewKey() {
    return this._invokeWorker("getPrivateViewKey");
  }
  
  async getPublicViewKey() {
    return this._invokeWorker("getPublicViewKey");
  }
  
  async getPublicSpendKey() {
    return this._invokeWorker("getPublicSpendKey");
  }
  
  async getAddress(accountIdx, subaddressIdx) {
    return this._invokeWorker("getAddress", Array.from(arguments));
  }
  
  async getAddressIndex(address) {
    let subaddressJson = await this._invokeWorker("getAddressIndex", Array.from(arguments));
    return MoneroWalletCore._sanitizeSubaddress(new MoneroSubaddress(subaddressJson));
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
    return this._invokeWorker("isConnected");
  }
  
  async getRestoreHeight() {
    return this._invokeWorker("getRestoreHeight");
  }
  
  async setRestoreHeight(restoreHeight) {
    return this._invokeWorker("setRestoreHeight", [restoreHeight]);
  }
  
  async getDaemonHeight() {
    return this._invokeWorker("getDaemonHeight");
  }
  
  async getDaemonMaxPeerHeight() {
    return this._invokeWorker("getDaemonMaxPeerHeight");
  }
  
  async isDaemonSynced() {
    return this._invokeWorker("isDaemonSynced");
  }
  
  async getHeight() {
    return this._invokeWorker("getHeight");
  }
  
  async addListener(listener) {
    let wrappedListener = new WalletWorkerListener(listener);
    let listenerId = wrappedListener.getId();
    MoneroUtils.WORKER_OBJECTS[this.walletId].callbacks["onSyncProgress_" + listenerId] = [wrappedListener.onSyncProgress, wrappedListener];
    MoneroUtils.WORKER_OBJECTS[this.walletId].callbacks["onNewBlock_" + listenerId] = [wrappedListener.onNewBlock, wrappedListener];
    MoneroUtils.WORKER_OBJECTS[this.walletId].callbacks["onOutputReceived_" + listenerId] = [wrappedListener.onOutputReceived, wrappedListener];
    MoneroUtils.WORKER_OBJECTS[this.walletId].callbacks["onOutputSpent_" + listenerId] = [wrappedListener.onOutputSpent, wrappedListener];
    this.wrappedListeners.push(wrappedListener);
    return this._invokeWorker("addListener", [listenerId]);
  }
  
  async removeListener(listener) {
    for (let i = 0; i < this.wrappedListeners.length; i++) {
      if (this.wrappedListeners[i].getListener() === listener) {
        let listenerId = this.wrappedListeners[i].getId();
        await this._invokeWorker("removeListener", [listenerId]);
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
    return this._invokeWorker("isSynced");
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
    let resultJson = await this._invokeWorker("sync", [startHeight]);
    let result = new MoneroSyncResult(resultJson.numBlocksFetched, resultJson.receivedMoney);
    
    // unregister sync listener wrapper
    if (syncListenerWrapper !== undefined) {  // TODO: test that this is executed with error e.g. sync an unconnected wallet
      await this.removeListener(syncListenerWrapper); // unregister sync listener
    }
    
    return result;
  }
  
  async startSyncing() {
    return this._invokeWorker("startSyncing");  // TODO: don't need to await
  }
    
  async stopSyncing() {
    return this._invokeWorker("stopSyncing");
  }
  
  // rescanSpent
  // rescanBlockchain
  
  async getBalance(accountIdx, subaddressIdx) {
    return BigInteger.parse(await this._invokeWorker("getBalance", Array.from(arguments)));
  }
  
  async getUnlockedBalance(accountIdx, subaddressIdx) {
    let unlockedBalanceStr = await this._invokeWorker("getUnlockedBalance", Array.from(arguments));
    return BigInteger.parse(unlockedBalanceStr);
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
    return MoneroWalletCore._blocksJsonToTxs(query, JSON.stringify({blocks: blockJsons})); // initialize txs from blocks json string TODO: this stringifies then utility parses, avoid
  }
  
  async getTransfers(query) {
    query = MoneroWalletCore._normalizeTransferQuery(query);
    let blockJsons = await this._invokeWorker("getTransfers", [query.getTxQuery().getBlock().toJson()]);
    return MoneroWalletCore._blocksJsonToTransfers(query, JSON.stringify({blocks: blockJsons})); // initialize transfers from blocks json string TODO: this stringifies then utility parses, avoid
  }
  
  async getOutputs(query) {
    query = MoneroWalletCore._normalizeOutputQuery(query);
    let blockJsons = await this._invokeWorker("getOutputs", [query.getTxQuery().getBlock().toJson()]);
    return MoneroWalletCore._blocksJsonToOutputs(query, JSON.stringify({blocks: blockJsons})); // initialize transfers from blocks json string TODO: this stringifies then utility parses, avoid
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
    return this._invokeWorker("getAttribute", Array.from(arguments));
  }
  
  async setAttribute(key, val) {
    return this._invokeWorker("setAttribute", Array.from(arguments));
  }
  
  async startMining(numThreads, backgroundMining, ignoreBattery) {
    return this._invokeWorker("startMining", Array.from(arguments));
  }
  
  async stopMining() {
    return this._invokeWorker("stopMining", Array.from(arguments));
  }
  
  async isMultisigImportNeeded() {
    return this._invokeWorker("isMultisigImportNeeded");
  }
  
  async isMultisig() {
    return this._invokeWorker("isMultisig");
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
    return this._invokeWorker("getData");
  }
  
  async moveTo(path, password) {
    throw new Error("MoneroWalletCoreProxy.moveTo() not implemented");
  }
  
  // TODO: better way than all but duplicating MoneroWalletCore class save()?
  async save() {
    assert(!await this.isClosed(), "Wallet is closed");
    
    // path must be set
    let path = await this.getPath();
    if (path === "") throw new MoneroError("Wallet path is not set");
    
    // write address file
    this.fs.writeFileSync(path + ".address.txt", await this.getPrimaryAddress());
    
    // write keys and cache data
    let data = await this.getData();
    this.fs.writeFileSync(path + ".keys", data[0], "binary");
    this.fs.writeFileSync(path, data[1], "binary");
  }
  
  async isClosed() {
    return this._invokeWorker("isClosed");
  }
  
  async close(save) {
    if (save) await this.save();
    await this._invokeWorker("close");
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

module.exports = MoneroWalletCore;