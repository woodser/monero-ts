"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _assert = _interopRequireDefault(require("assert"));
var _path = _interopRequireDefault(require("path"));
var _GenUtils = _interopRequireDefault(require("../common/GenUtils"));
var _LibraryUtils = _interopRequireDefault(require("../common/LibraryUtils"));
var _TaskLooper = _interopRequireDefault(require("../common/TaskLooper"));
var _MoneroAccount = _interopRequireDefault(require("./model/MoneroAccount"));
var _MoneroAccountTag = _interopRequireDefault(require("./model/MoneroAccountTag"));
var _MoneroAddressBookEntry = _interopRequireDefault(require("./model/MoneroAddressBookEntry"));
var _MoneroBlock = _interopRequireDefault(require("../daemon/model/MoneroBlock"));
var _MoneroCheckTx = _interopRequireDefault(require("./model/MoneroCheckTx"));
var _MoneroCheckReserve = _interopRequireDefault(require("./model/MoneroCheckReserve"));
var _MoneroDaemonRpc = _interopRequireDefault(require("../daemon/MoneroDaemonRpc"));
var _MoneroError = _interopRequireDefault(require("../common/MoneroError"));

var _MoneroIntegratedAddress = _interopRequireDefault(require("./model/MoneroIntegratedAddress"));
var _MoneroKeyImage = _interopRequireDefault(require("../daemon/model/MoneroKeyImage"));
var _MoneroKeyImageImportResult = _interopRequireDefault(require("./model/MoneroKeyImageImportResult"));
var _MoneroMultisigInfo = _interopRequireDefault(require("./model/MoneroMultisigInfo"));
var _MoneroMultisigInitResult = _interopRequireDefault(require("./model/MoneroMultisigInitResult"));
var _MoneroMultisigSignResult = _interopRequireDefault(require("./model/MoneroMultisigSignResult"));
var _MoneroNetworkType = _interopRequireDefault(require("../daemon/model/MoneroNetworkType"));

var _MoneroOutputWallet = _interopRequireDefault(require("./model/MoneroOutputWallet"));
var _MoneroRpcConnection = _interopRequireDefault(require("../common/MoneroRpcConnection"));
var _MoneroSubaddress = _interopRequireDefault(require("./model/MoneroSubaddress"));
var _MoneroSyncResult = _interopRequireDefault(require("./model/MoneroSyncResult"));


var _MoneroTxConfig = _interopRequireDefault(require("./model/MoneroTxConfig"));

var _MoneroTxSet = _interopRequireDefault(require("./model/MoneroTxSet"));

var _MoneroTxWallet = _interopRequireDefault(require("./model/MoneroTxWallet"));
var _MoneroWallet = _interopRequireDefault(require("./MoneroWallet"));
var _MoneroWalletConfig = _interopRequireDefault(require("./model/MoneroWalletConfig"));
var _MoneroWalletKeys = require("./MoneroWalletKeys");
var _MoneroWalletListener = _interopRequireDefault(require("./model/MoneroWalletListener"));
var _MoneroMessageSignatureType = _interopRequireDefault(require("./model/MoneroMessageSignatureType"));
var _MoneroMessageSignatureResult = _interopRequireDefault(require("./model/MoneroMessageSignatureResult"));

var _fs = _interopRequireDefault(require("fs"));

/**
 * Implements a Monero wallet using client-side WebAssembly bindings to monero-project's wallet2 in C++.
 */
class MoneroWalletFull extends _MoneroWalletKeys.MoneroWalletKeys {

  // static variables
  static DEFAULT_SYNC_PERIOD_IN_MS = 20000;


  // instance variables












  /**
   * Internal constructor which is given the memory address of a C++ wallet instance.
   * 
   * This constructor should be called through static wallet creation utilities in this class.
   * 
   * @param {number} cppAddress - address of the wallet instance in C++
   * @param {string} path - path of the wallet instance
   * @param {string} password - password of the wallet instance
   * @param {FileSystem} fs - node.js-compatible file system to read/write wallet files
   * @param {boolean} rejectUnauthorized - specifies if unauthorized requests (e.g. self-signed certificates) should be rejected
   * @param {string} rejectUnauthorizedFnId - unique identifier for http_client_wasm to query rejectUnauthorized
   * @param {MoneroWalletFullProxy} walletProxy - proxy to invoke wallet operations in a web worker
   * 
   * @private
   */
  constructor(cppAddress, path, password, fs, rejectUnauthorized, rejectUnauthorizedFnId, walletProxy) {
    super(cppAddress, walletProxy);
    if (walletProxy) return;
    this.path = path;
    this.password = password;
    this.listeners = [];
    this.fs = fs ? fs : path ? MoneroWalletFull.getFs() : undefined;
    this._isClosed = false;
    this.fullListener = new WalletFullListener(this); // receives notifications from wasm c++
    this.fullListenerHandle = 0; // memory address of the wallet listener in c++
    this.rejectUnauthorized = rejectUnauthorized;
    this.rejectUnauthorizedConfigId = rejectUnauthorizedFnId;
    this.syncPeriodInMs = MoneroWalletFull.DEFAULT_SYNC_PERIOD_IN_MS;
    _LibraryUtils.default.setRejectUnauthorizedFn(rejectUnauthorizedFnId, () => this.rejectUnauthorized); // register fn informing if unauthorized reqs should be rejected
  }

  // --------------------------- STATIC UTILITIES -----------------------------

  /**
   * Check if a wallet exists at a given path.
   * 
   * @param {string} path - path of the wallet on the file system
   * @param {fs} - Node.js compatible file system to use (optional, defaults to disk if nodejs)
   * @return {boolean} true if a wallet exists at the given path, false otherwise
   */
  static walletExists(path, fs) {
    (0, _assert.default)(path, "Must provide a path to look for a wallet");
    if (!fs) fs = MoneroWalletFull.getFs();
    if (!fs) throw new _MoneroError.default("Must provide file system to check if wallet exists");
    let exists = fs.existsSync(path + ".keys");
    _LibraryUtils.default.log(1, "Wallet exists at " + path + ": " + exists);
    return exists;
  }

  static async openWallet(config) {

    // validate config
    config = new _MoneroWalletConfig.default(config);
    if (config.getProxyToWorker() === undefined) config.setProxyToWorker(true);
    if (config.getSeed() !== undefined) throw new _MoneroError.default("Cannot specify seed when opening wallet");
    if (config.getSeedOffset() !== undefined) throw new _MoneroError.default("Cannot specify seed offset when opening wallet");
    if (config.getPrimaryAddress() !== undefined) throw new _MoneroError.default("Cannot specify primary address when opening wallet");
    if (config.getPrivateViewKey() !== undefined) throw new _MoneroError.default("Cannot specify private view key when opening wallet");
    if (config.getPrivateSpendKey() !== undefined) throw new _MoneroError.default("Cannot specify private spend key when opening wallet");
    if (config.getRestoreHeight() !== undefined) throw new _MoneroError.default("Cannot specify restore height when opening wallet");
    if (config.getLanguage() !== undefined) throw new _MoneroError.default("Cannot specify language when opening wallet");
    if (config.getSaveCurrent() === true) throw new _MoneroError.default("Cannot save current wallet when opening full wallet");

    // read wallet data from disk if not given
    if (!config.getKeysData()) {
      let fs = config.getFs() ? config.getFs() : MoneroWalletFull.getFs();
      if (!fs) throw new _MoneroError.default("Must provide file system to read wallet data from");
      if (!this.walletExists(config.getPath(), fs)) throw new _MoneroError.default("Wallet does not exist at path: " + config.getPath());
      config.setKeysData(fs.readFileSync(config.getPath() + ".keys"));
      config.setCacheData(fs.existsSync(config.getPath()) ? fs.readFileSync(config.getPath()) : "");
    }

    // open wallet from data
    return MoneroWalletFull.openWalletData(config);
  }

  static async createWallet(config) {

    // validate config
    if (config === undefined) throw new _MoneroError.default("Must provide config to create wallet");
    if (config.getSeed() !== undefined && (config.getPrimaryAddress() !== undefined || config.getPrivateViewKey() !== undefined || config.getPrivateSpendKey() !== undefined)) throw new _MoneroError.default("Wallet may be initialized with a seed or keys but not both");
    if (config.getNetworkType() === undefined) throw new _MoneroError.default("Must provide a networkType: 'mainnet', 'testnet' or 'stagenet'");
    _MoneroNetworkType.default.validate(config.getNetworkType());
    if (config.getSaveCurrent() === true) throw new _MoneroError.default("Cannot save current wallet when creating full WASM wallet");
    if (config.getPath() === undefined) config.setPath("");
    if (config.getPath() && MoneroWalletFull.walletExists(config.getPath(), config.getFs())) throw new _MoneroError.default("Wallet already exists: " + config.getPath());
    if (config.getPassword() === undefined) config.setPassword("");

    // set server from connection manager if provided
    if (config.getConnectionManager()) {
      if (config.getServer()) throw new _MoneroError.default("Wallet can be initialized with a server or connection manager but not both");
      config.setServer(config.getConnectionManager().getConnection());
    }

    // create proxied or local wallet
    let wallet;
    if (config.getProxyToWorker() === undefined) config.setProxyToWorker(true);
    if (config.getProxyToWorker()) {
      let walletProxy = await MoneroWalletFullProxy.createWallet(config);
      wallet = new MoneroWalletFull(undefined, undefined, undefined, undefined, undefined, undefined, walletProxy);
    } else {
      if (config.getSeed() !== undefined) {
        if (config.getLanguage() !== undefined) throw new _MoneroError.default("Cannot provide language when creating wallet from seed");
        wallet = await MoneroWalletFull.createWalletFromSeed(config);
      } else if (config.getPrivateSpendKey() !== undefined || config.getPrimaryAddress() !== undefined) {
        if (config.getSeedOffset() !== undefined) throw new _MoneroError.default("Cannot provide seedOffset when creating wallet from keys");
        wallet = await MoneroWalletFull.createWalletFromKeys(config);
      } else {
        if (config.getSeedOffset() !== undefined) throw new _MoneroError.default("Cannot provide seedOffset when creating random wallet");
        if (config.getRestoreHeight() !== undefined) throw new _MoneroError.default("Cannot provide restoreHeight when creating random wallet");
        wallet = await MoneroWalletFull.createWalletRandom(config);
      }
    }

    // set wallet's connection manager
    await wallet.setConnectionManager(config.getConnectionManager());
    return wallet;
  }

  static async createWalletFromSeed(config) {

    // validate and normalize params
    let daemonConnection = config.getServer();
    let rejectUnauthorized = daemonConnection ? daemonConnection.getRejectUnauthorized() : true;
    if (config.getRestoreHeight() === undefined) config.setRestoreHeight(0);
    if (config.getSeedOffset() === undefined) config.setSeedOffset("");

    // load full wasm module
    let module = await _LibraryUtils.default.loadFullModule();

    // create wallet in queue
    let wallet = await module.queueTask(async () => {
      return new Promise((resolve, reject) => {

        // register fn informing if unauthorized reqs should be rejected
        let rejectUnauthorizedFnId = _GenUtils.default.getUUID();
        _LibraryUtils.default.setRejectUnauthorizedFn(rejectUnauthorizedFnId, () => rejectUnauthorized);

        // create wallet in wasm which invokes callback when done
        module.create_full_wallet(JSON.stringify(config.toJson()), rejectUnauthorizedFnId, async (cppAddress) => {
          if (typeof cppAddress === "string") reject(new _MoneroError.default(cppAddress));else
          resolve(new MoneroWalletFull(cppAddress, config.getPath(), config.getPassword(), config.getFs(), config.getServer() ? config.getServer().getRejectUnauthorized() : undefined, rejectUnauthorizedFnId));
        });
      });
    });

    // save wallet
    if (config.getPath()) await wallet.save();
    return wallet;
  }

  static async createWalletFromKeys(config) {

    // validate and normalize params
    _MoneroNetworkType.default.validate(config.getNetworkType());
    if (config.getPrimaryAddress() === undefined) config.setPrimaryAddress("");
    if (config.getPrivateViewKey() === undefined) config.setPrivateViewKey("");
    if (config.getPrivateSpendKey() === undefined) config.setPrivateSpendKey("");
    let daemonConnection = config.getServer();
    let rejectUnauthorized = daemonConnection ? daemonConnection.getRejectUnauthorized() : true;
    if (config.getRestoreHeight() === undefined) config.setRestoreHeight(0);
    if (config.getLanguage() === undefined) config.setLanguage("English");

    // load full wasm module
    let module = await _LibraryUtils.default.loadFullModule();

    // create wallet in queue
    let wallet = await module.queueTask(async () => {
      return new Promise((resolve, reject) => {

        // register fn informing if unauthorized reqs should be rejected
        let rejectUnauthorizedFnId = _GenUtils.default.getUUID();
        _LibraryUtils.default.setRejectUnauthorizedFn(rejectUnauthorizedFnId, () => rejectUnauthorized);

        // create wallet in wasm which invokes callback when done
        module.create_full_wallet(JSON.stringify(config.toJson()), rejectUnauthorizedFnId, async (cppAddress) => {
          if (typeof cppAddress === "string") reject(new _MoneroError.default(cppAddress));else
          resolve(new MoneroWalletFull(cppAddress, config.getPath(), config.getPassword(), config.getFs(), config.getServer() ? config.getServer().getRejectUnauthorized() : undefined, rejectUnauthorizedFnId));
        });
      });
    });

    // save wallet
    if (config.getPath()) await wallet.save();
    return wallet;
  }

  static async createWalletRandom(config) {

    // validate and normalize params
    if (config.getLanguage() === undefined) config.setLanguage("English");
    let daemonConnection = config.getServer();
    let rejectUnauthorized = daemonConnection ? daemonConnection.getRejectUnauthorized() : true;

    // load wasm module
    let module = await _LibraryUtils.default.loadFullModule();

    // create wallet in queue
    let wallet = await module.queueTask(async () => {
      return new Promise((resolve, reject) => {

        // register fn informing if unauthorized reqs should be rejected
        let rejectUnauthorizedFnId = _GenUtils.default.getUUID();
        _LibraryUtils.default.setRejectUnauthorizedFn(rejectUnauthorizedFnId, () => rejectUnauthorized);

        // create wallet in wasm which invokes callback when done
        module.create_full_wallet(JSON.stringify(config.toJson()), rejectUnauthorizedFnId, async (cppAddress) => {
          if (typeof cppAddress === "string") reject(new _MoneroError.default(cppAddress));else
          resolve(new MoneroWalletFull(cppAddress, config.getPath(), config.getPassword(), config.getFs(), config.getServer() ? config.getServer().getRejectUnauthorized() : undefined, rejectUnauthorizedFnId));
        });
      });
    });

    // save wallet
    if (config.getPath()) await wallet.save();
    return wallet;
  }

  static async getSeedLanguages() {
    let module = await _LibraryUtils.default.loadFullModule();
    return module.queueTask(async () => {
      return JSON.parse(module.get_keys_wallet_seed_languages()).languages;
    });
  }

  static getFs() {
    if (!MoneroWalletFull.FS) MoneroWalletFull.FS = _GenUtils.default.isBrowser() ? undefined : _fs.default;
    return MoneroWalletFull.FS;
  }

  // ------------ WALLET METHODS SPECIFIC TO WASM IMPLEMENTATION --------------

  // TODO: move these to MoneroWallet.ts, others can be unsupported

  /**
   * Get the maximum height of the peers the wallet's daemon is connected to.
   *
   * @return {Promise<number>} the maximum height of the peers the wallet's daemon is connected to
   */
  async getDaemonMaxPeerHeight() {
    if (this.getWalletProxy()) return this.getWalletProxy().getDaemonMaxPeerHeight();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {

        // call wasm which invokes callback when done
        this.module.get_daemon_max_peer_height(this.cppAddress, (resp) => {
          resolve(resp);
        });
      });
    });
  }

  /**
   * Indicates if the wallet's daemon is synced with the network.
   * 
   * @return {Promise<boolean>} true if the daemon is synced with the network, false otherwise
   */
  async isDaemonSynced() {
    if (this.getWalletProxy()) return this.getWalletProxy().isDaemonSynced();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {

        // call wasm which invokes callback when done
        this.module.is_daemon_synced(this.cppAddress, (resp) => {
          resolve(resp);
        });
      });
    });
  }

  /**
   * Indicates if the wallet is synced with the daemon.
   * 
   * @return {Promise<boolean>} true if the wallet is synced with the daemon, false otherwise
   */
  async isSynced() {
    if (this.getWalletProxy()) return this.getWalletProxy().isSynced();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.is_synced(this.cppAddress, (resp) => {
          resolve(resp);
        });
      });
    });
  }

  /**
   * Get the wallet's network type (mainnet, testnet, or stagenet).
   * 
   * @return {Promise<MoneroNetworkType>} the wallet's network type
   */
  async getNetworkType() {
    if (this.getWalletProxy()) return this.getWalletProxy().getNetworkType();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return this.module.get_network_type(this.cppAddress);
    });
  }

  /**
   * Get the height of the first block that the wallet scans.
   * 
   * @return {Promise<number>} the height of the first block that the wallet scans
   */
  async getRestoreHeight() {
    if (this.getWalletProxy()) return this.getWalletProxy().getRestoreHeight();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return this.module.get_restore_height(this.cppAddress);
    });
  }

  /**
   * Set the height of the first block that the wallet scans.
   * 
   * @param {number} restoreHeight - height of the first block that the wallet scans
   * @return {Promise<void>}
   */
  async setRestoreHeight(restoreHeight) {
    if (this.getWalletProxy()) return this.getWalletProxy().setRestoreHeight(restoreHeight);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      this.module.set_restore_height(this.cppAddress, restoreHeight);
    });
  }

  /**
   * Move the wallet from its current path to the given path.
   * 
   * @param {string} path - the wallet's destination path
   * @return {Promise<void>}
   */
  async moveTo(path) {
    if (this.getWalletProxy()) return this.getWalletProxy().moveTo(path);
    return MoneroWalletFull.moveTo(path, this);
  }

  // -------------------------- COMMON WALLET METHODS -------------------------

  async addListener(listener) {
    if (this.getWalletProxy()) return this.getWalletProxy().addListener(listener);
    (0, _assert.default)(listener instanceof _MoneroWalletListener.default, "Listener must be instance of MoneroWalletListener");
    this.listeners.push(listener);
    await this.refreshListening();
  }

  async removeListener(listener) {
    if (this.getWalletProxy()) return this.getWalletProxy().removeListener(listener);
    let idx = this.listeners.indexOf(listener);
    if (idx > -1) this.listeners.splice(idx, 1);else
    throw new _MoneroError.default("Listener is not registered with wallet");
    await this.refreshListening();
  }

  getListeners() {
    if (this.getWalletProxy()) return this.getWalletProxy().getListeners();
    return this.listeners;
  }

  async setDaemonConnection(uriOrConnection) {
    if (this.getWalletProxy()) return this.getWalletProxy().setDaemonConnection(uriOrConnection);

    // normalize connection
    let connection = !uriOrConnection ? undefined : uriOrConnection instanceof _MoneroRpcConnection.default ? uriOrConnection : new _MoneroRpcConnection.default(uriOrConnection);
    let uri = connection && connection.getUri() ? connection.getUri() : "";
    let username = connection && connection.getUsername() ? connection.getUsername() : "";
    let password = connection && connection.getPassword() ? connection.getPassword() : "";
    let rejectUnauthorized = connection ? connection.getRejectUnauthorized() : undefined;
    this.rejectUnauthorized = rejectUnauthorized; // persist locally

    // set connection in queue
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.set_daemon_connection(this.cppAddress, uri, username, password, (resp) => {
          resolve();
        });
      });
    });
  }

  async getDaemonConnection() {
    if (this.getWalletProxy()) return this.getWalletProxy().getDaemonConnection();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        let connectionContainerStr = this.module.get_daemon_connection(this.cppAddress);
        if (!connectionContainerStr) resolve(undefined);else
        {
          let jsonConnection = JSON.parse(connectionContainerStr);
          resolve(new _MoneroRpcConnection.default({ uri: jsonConnection.uri, username: jsonConnection.username, password: jsonConnection.password, rejectUnauthorized: this.rejectUnauthorized }));
        }
      });
    });
  }

  async isConnectedToDaemon() {
    if (this.getWalletProxy()) return this.getWalletProxy().isConnectedToDaemon();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.is_connected_to_daemon(this.cppAddress, (resp) => {
          resolve(resp);
        });
      });
    });
  }

  async getVersion() {
    if (this.getWalletProxy()) return this.getWalletProxy().getVersion();
    throw new _MoneroError.default("Not implemented");
  }

  async getPath() {
    if (this.getWalletProxy()) return this.getWalletProxy().getPath();
    return this.path;
  }

  async getIntegratedAddress(standardAddress, paymentId) {
    if (this.getWalletProxy()) return this.getWalletProxy().getIntegratedAddress(standardAddress, paymentId);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      try {
        let result = this.module.get_integrated_address(this.cppAddress, standardAddress ? standardAddress : "", paymentId ? paymentId : "");
        if (result.charAt(0) !== "{") throw new _MoneroError.default(result);
        return new _MoneroIntegratedAddress.default(JSON.parse(result));
      } catch (err) {
        if (err.message.includes("Invalid payment ID")) throw new _MoneroError.default("Invalid payment ID: " + paymentId);
        throw new _MoneroError.default(err.message);
      }
    });
  }

  async decodeIntegratedAddress(integratedAddress) {
    if (this.getWalletProxy()) return this.getWalletProxy().decodeIntegratedAddress(integratedAddress);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      try {
        let result = this.module.decode_integrated_address(this.cppAddress, integratedAddress);
        if (result.charAt(0) !== "{") throw new _MoneroError.default(result);
        return new _MoneroIntegratedAddress.default(JSON.parse(result));
      } catch (err) {
        throw new _MoneroError.default(err.message);
      }
    });
  }

  async getHeight() {
    if (this.getWalletProxy()) return this.getWalletProxy().getHeight();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.get_height(this.cppAddress, (resp) => {
          resolve(resp);
        });
      });
    });
  }

  async getDaemonHeight() {
    if (this.getWalletProxy()) return this.getWalletProxy().getDaemonHeight();
    if (!(await this.isConnectedToDaemon())) throw new _MoneroError.default("Wallet is not connected to daemon");
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.get_daemon_height(this.cppAddress, (resp) => {
          resolve(resp);
        });
      });
    });
  }

  async getHeightByDate(year, month, day) {
    if (this.getWalletProxy()) return this.getWalletProxy().getHeightByDate(year, month, day);
    if (!(await this.isConnectedToDaemon())) throw new _MoneroError.default("Wallet is not connected to daemon");
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.get_height_by_date(this.cppAddress, year, month, day, (resp) => {
          if (typeof resp === "string") reject(new _MoneroError.default(resp));else
          resolve(resp);
        });
      });
    });
  }

  /**
   * Synchronize the wallet with the daemon as a one-time synchronous process.
   * 
   * @param {MoneroWalletListener|number} [listenerOrStartHeight] - listener xor start height (defaults to no sync listener, the last synced block)
   * @param {number} [startHeight] - startHeight if not given in first arg (defaults to last synced block)
   * @param {boolean} [allowConcurrentCalls] - allow other wallet methods to be processed simultaneously during sync (default false)<br><br><b>WARNING</b>: enabling this option will crash wallet execution if another call makes a simultaneous network request. TODO: possible to sync wasm network requests in http_client_wasm.cpp? 
   */
  async sync(listenerOrStartHeight, startHeight, allowConcurrentCalls = false) {
    if (this.getWalletProxy()) return this.getWalletProxy().sync(listenerOrStartHeight, startHeight, allowConcurrentCalls);
    if (!(await this.isConnectedToDaemon())) throw new _MoneroError.default("Wallet is not connected to daemon");

    if (true) throw new Error("My test error");

    // normalize params
    startHeight = listenerOrStartHeight === undefined || listenerOrStartHeight instanceof _MoneroWalletListener.default ? startHeight : listenerOrStartHeight;
    let listener = listenerOrStartHeight instanceof _MoneroWalletListener.default ? listenerOrStartHeight : undefined;
    if (startHeight === undefined) startHeight = Math.max(await this.getHeight(), await this.getRestoreHeight());

    // register listener if given
    if (listener) await this.addListener(listener);

    // sync wallet
    let err;
    let result;
    try {
      let that = this;
      result = await (allowConcurrentCalls ? syncWasm() : this.module.queueTask(async () => syncWasm()));
      function syncWasm() {
        that.assertNotClosed();
        return new Promise((resolve, reject) => {

          // sync wallet in wasm which invokes callback when done
          that.module.sync(that.cppAddress, startHeight, async (resp) => {
            if (resp.charAt(0) !== "{") reject(new _MoneroError.default(resp));else
            {
              let respJson = JSON.parse(resp);
              resolve(new _MoneroSyncResult.default(respJson.numBlocksFetched, respJson.receivedMoney));
            }
          });
        });
      }
    } catch (e) {
      err = e;
    }

    // unregister listener
    if (listener) await this.removeListener(listener);

    // throw error or return
    if (err) throw err;
    return result;
  }

  async startSyncing(syncPeriodInMs) {
    if (this.getWalletProxy()) return this.getWalletProxy().startSyncing(syncPeriodInMs);
    if (!(await this.isConnectedToDaemon())) throw new _MoneroError.default("Wallet is not connected to daemon");
    this.syncPeriodInMs = syncPeriodInMs === undefined ? MoneroWalletFull.DEFAULT_SYNC_PERIOD_IN_MS : syncPeriodInMs;
    if (!this.syncLooper) this.syncLooper = new _TaskLooper.default(async () => await this.backgroundSync());
    this.syncLooper.start(this.syncPeriodInMs);
  }

  async stopSyncing() {
    if (this.getWalletProxy()) return this.getWalletProxy().stopSyncing();
    this.assertNotClosed();
    if (this.syncLooper) this.syncLooper.stop();
    this.module.stop_syncing(this.cppAddress); // task is not queued so wallet stops immediately
  }

  async scanTxs(txHashes) {
    if (this.getWalletProxy()) return this.getWalletProxy().scanTxs(txHashes);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.scan_txs(this.cppAddress, JSON.stringify({ txHashes: txHashes }), (err) => {
          if (err) reject(new _MoneroError.default(err));else
          resolve();
        });
      });
    });
  }

  async rescanSpent() {
    if (this.getWalletProxy()) return this.getWalletProxy().rescanSpent();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.rescan_spent(this.cppAddress, () => resolve());
      });
    });
  }

  async rescanBlockchain() {
    if (this.getWalletProxy()) return this.getWalletProxy().rescanBlockchain();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.rescan_blockchain(this.cppAddress, () => resolve());
      });
    });
  }

  async getBalance(accountIdx, subaddressIdx) {
    if (this.getWalletProxy()) return this.getWalletProxy().getBalance(accountIdx, subaddressIdx);
    return this.module.queueTask(async () => {
      this.assertNotClosed();

      // get balance encoded in json string
      let balanceStr;
      if (accountIdx === undefined) {
        (0, _assert.default)(subaddressIdx === undefined, "Subaddress index must be undefined if account index is undefined");
        balanceStr = this.module.get_balance_wallet(this.cppAddress);
      } else if (subaddressIdx === undefined) {
        balanceStr = this.module.get_balance_account(this.cppAddress, accountIdx);
      } else {
        balanceStr = this.module.get_balance_subaddress(this.cppAddress, accountIdx, subaddressIdx);
      }

      // parse json string to bigint
      return BigInt(JSON.parse(_GenUtils.default.stringifyBigInts(balanceStr)).balance);
    });
  }

  async getUnlockedBalance(accountIdx, subaddressIdx) {
    if (this.getWalletProxy()) return this.getWalletProxy().getUnlockedBalance(accountIdx, subaddressIdx);
    return this.module.queueTask(async () => {
      this.assertNotClosed();

      // get balance encoded in json string
      let unlockedBalanceStr;
      if (accountIdx === undefined) {
        (0, _assert.default)(subaddressIdx === undefined, "Subaddress index must be undefined if account index is undefined");
        unlockedBalanceStr = this.module.get_unlocked_balance_wallet(this.cppAddress);
      } else if (subaddressIdx === undefined) {
        unlockedBalanceStr = this.module.get_unlocked_balance_account(this.cppAddress, accountIdx);
      } else {
        unlockedBalanceStr = this.module.get_unlocked_balance_subaddress(this.cppAddress, accountIdx, subaddressIdx);
      }

      // parse json string to bigint
      return BigInt(JSON.parse(_GenUtils.default.stringifyBigInts(unlockedBalanceStr)).unlockedBalance);
    });
  }

  async getAccounts(includeSubaddresses, tag) {
    if (this.getWalletProxy()) return this.getWalletProxy().getAccounts(includeSubaddresses, tag);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let accountsStr = this.module.get_accounts(this.cppAddress, includeSubaddresses ? true : false, tag ? tag : "");
      let accounts = [];
      for (let accountJson of JSON.parse(_GenUtils.default.stringifyBigInts(accountsStr)).accounts) {
        accounts.push(MoneroWalletFull.sanitizeAccount(new _MoneroAccount.default(accountJson)));
      }
      return accounts;
    });
  }

  async getAccount(accountIdx, includeSubaddresses) {
    if (this.getWalletProxy()) return this.getWalletProxy().getAccount(accountIdx, includeSubaddresses);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let accountStr = this.module.get_account(this.cppAddress, accountIdx, includeSubaddresses ? true : false);
      let accountJson = JSON.parse(_GenUtils.default.stringifyBigInts(accountStr));
      return MoneroWalletFull.sanitizeAccount(new _MoneroAccount.default(accountJson));
    });

  }

  async createAccount(label) {
    if (this.getWalletProxy()) return this.getWalletProxy().createAccount(label);
    if (label === undefined) label = "";
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let accountStr = this.module.create_account(this.cppAddress, label);
      let accountJson = JSON.parse(_GenUtils.default.stringifyBigInts(accountStr));
      return MoneroWalletFull.sanitizeAccount(new _MoneroAccount.default(accountJson));
    });
  }

  async getSubaddresses(accountIdx, subaddressIndices) {
    if (this.getWalletProxy()) return this.getWalletProxy().getSubaddresses(accountIdx, subaddressIndices);
    let args = { accountIdx: accountIdx, subaddressIndices: subaddressIndices === undefined ? [] : _GenUtils.default.listify(subaddressIndices) };
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let subaddressesJson = JSON.parse(_GenUtils.default.stringifyBigInts(this.module.get_subaddresses(this.cppAddress, JSON.stringify(args)))).subaddresses;
      let subaddresses = [];
      for (let subaddressJson of subaddressesJson) subaddresses.push(_MoneroWalletKeys.MoneroWalletKeys.sanitizeSubaddress(new _MoneroSubaddress.default(subaddressJson)));
      return subaddresses;
    });
  }

  async createSubaddress(accountIdx, label) {
    if (this.getWalletProxy()) return this.getWalletProxy().createSubaddress(accountIdx, label);
    if (label === undefined) label = "";
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let subaddressStr = this.module.create_subaddress(this.cppAddress, accountIdx, label);
      let subaddressJson = JSON.parse(_GenUtils.default.stringifyBigInts(subaddressStr));
      return _MoneroWalletKeys.MoneroWalletKeys.sanitizeSubaddress(new _MoneroSubaddress.default(subaddressJson));
    });
  }

  async setSubaddressLabel(accountIdx, subaddressIdx, label) {
    if (this.getWalletProxy()) return this.getWalletProxy().setSubaddressLabel(accountIdx, subaddressIdx, label);
    if (label === undefined) label = "";
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      this.module.set_subaddress_label(this.cppAddress, accountIdx, subaddressIdx, label);
    });
  }

  async getTxs(query) {
    if (this.getWalletProxy()) return this.getWalletProxy().getTxs(query);

    // copy and normalize query up to block
    const queryNormalized = query = _MoneroWallet.default.normalizeTxQuery(query);

    // schedule task
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {

        // call wasm which invokes callback
        this.module.get_txs(this.cppAddress, JSON.stringify(queryNormalized.getBlock().toJson()), (blocksJsonStr) => {

          // check for error
          if (blocksJsonStr.charAt(0) !== "{") {
            reject(new _MoneroError.default(blocksJsonStr));
            return;
          }

          // resolve with deserialized txs
          try {
            resolve(MoneroWalletFull.deserializeTxs(queryNormalized, blocksJsonStr));
          } catch (err) {
            reject(err);
          }
        });
      });
    });
  }

  async getTransfers(query) {
    if (this.getWalletProxy()) return this.getWalletProxy().getTransfers(query);

    // copy and normalize query up to block
    const queryNormalized = _MoneroWallet.default.normalizeTransferQuery(query);

    // return promise which resolves on callback
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {

        // call wasm which invokes callback
        this.module.get_transfers(this.cppAddress, JSON.stringify(queryNormalized.getTxQuery().getBlock().toJson()), (blocksJsonStr) => {

          // check for error
          if (blocksJsonStr.charAt(0) !== "{") {
            reject(new _MoneroError.default(blocksJsonStr));
            return;
          }

          // resolve with deserialized transfers 
          try {
            resolve(MoneroWalletFull.deserializeTransfers(queryNormalized, blocksJsonStr));
          } catch (err) {
            reject(err);
          }
        });
      });
    });
  }

  async getOutputs(query) {
    if (this.getWalletProxy()) return this.getWalletProxy().getOutputs(query);

    // copy and normalize query up to block
    const queryNormalized = _MoneroWallet.default.normalizeOutputQuery(query);

    // return promise which resolves on callback
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {

        // call wasm which invokes callback
        this.module.get_outputs(this.cppAddress, JSON.stringify(queryNormalized.getTxQuery().getBlock().toJson()), (blocksJsonStr) => {

          // check for error
          if (blocksJsonStr.charAt(0) !== "{") {
            reject(new _MoneroError.default(blocksJsonStr));
            return;
          }

          // resolve with deserialized outputs
          try {
            resolve(MoneroWalletFull.deserializeOutputs(queryNormalized, blocksJsonStr));
          } catch (err) {
            reject(err);
          }
        });
      });
    });
  }

  async exportOutputs(all = false) {
    if (this.getWalletProxy()) return this.getWalletProxy().exportOutputs(all);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.export_outputs(this.cppAddress, all, (outputsHex) => resolve(outputsHex));
      });
    });
  }

  async importOutputs(outputsHex) {
    if (this.getWalletProxy()) return this.getWalletProxy().importOutputs(outputsHex);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.import_outputs(this.cppAddress, outputsHex, (numImported) => resolve(numImported));
      });
    });
  }

  async exportKeyImages(all = false) {
    if (this.getWalletProxy()) return this.getWalletProxy().exportKeyImages(all);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.export_key_images(this.cppAddress, all, (keyImagesStr) => {
          if (keyImagesStr.charAt(0) !== '{') reject(new _MoneroError.default(keyImagesStr)); // json expected, else error
          let keyImages = [];
          for (let keyImageJson of JSON.parse(_GenUtils.default.stringifyBigInts(keyImagesStr)).keyImages) keyImages.push(new _MoneroKeyImage.default(keyImageJson));
          resolve(keyImages);
        });
      });
    });
  }

  async importKeyImages(keyImages) {
    if (this.getWalletProxy()) return this.getWalletProxy().importKeyImages(keyImages);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.import_key_images(this.cppAddress, JSON.stringify({ keyImages: keyImages.map((keyImage) => keyImage.toJson()) }), (keyImageImportResultStr) => {
          resolve(new _MoneroKeyImageImportResult.default(JSON.parse(_GenUtils.default.stringifyBigInts(keyImageImportResultStr))));
        });
      });
    });
  }

  async getNewKeyImagesFromLastImport() {
    if (this.getWalletProxy()) return this.getWalletProxy().getNewKeyImagesFromLastImport();
    throw new _MoneroError.default("Not implemented");
  }

  async freezeOutput(keyImage) {
    if (this.getWalletProxy()) return this.getWalletProxy().freezeOutput(keyImage);
    if (!keyImage) throw new _MoneroError.default("Must specify key image to freeze");
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.freeze_output(this.cppAddress, keyImage, () => resolve());
      });
    });
  }

  async thawOutput(keyImage) {
    if (this.getWalletProxy()) return this.getWalletProxy().thawOutput(keyImage);
    if (!keyImage) throw new _MoneroError.default("Must specify key image to thaw");
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.thaw_output(this.cppAddress, keyImage, () => resolve());
      });
    });
  }

  async isOutputFrozen(keyImage) {
    if (this.getWalletProxy()) return this.getWalletProxy().isOutputFrozen(keyImage);
    if (!keyImage) throw new _MoneroError.default("Must specify key image to check if frozen");
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.is_output_frozen(this.cppAddress, keyImage, (result) => resolve(result));
      });
    });
  }

  async createTxs(config) {
    if (this.getWalletProxy()) return this.getWalletProxy().createTxs(config);

    // validate, copy, and normalize config
    const configNormalized = _MoneroWallet.default.normalizeCreateTxsConfig(config);
    if (configNormalized.getCanSplit() === undefined) configNormalized.setCanSplit(true);

    // create txs in queue
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {

        // create txs in wasm which invokes callback when done
        this.module.create_txs(this.cppAddress, JSON.stringify(configNormalized.toJson()), (txSetJsonStr) => {
          if (txSetJsonStr.charAt(0) !== '{') reject(new _MoneroError.default(txSetJsonStr)); // json expected, else error
          else resolve(new _MoneroTxSet.default(JSON.parse(_GenUtils.default.stringifyBigInts(txSetJsonStr))).getTxs());
        });
      });
    });
  }

  async sweepOutput(config) {
    if (this.getWalletProxy()) return this.getWalletProxy().sweepOutput(config);

    // normalize and validate config
    const configNormalized = _MoneroWallet.default.normalizeSweepOutputConfig(config);

    // sweep output in queue
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {

        // sweep output in wasm which invokes callback when done
        this.module.sweep_output(this.cppAddress, JSON.stringify(configNormalized.toJson()), (txSetJsonStr) => {
          if (txSetJsonStr.charAt(0) !== '{') reject(new _MoneroError.default(txSetJsonStr)); // json expected, else error
          else resolve(new _MoneroTxSet.default(JSON.parse(_GenUtils.default.stringifyBigInts(txSetJsonStr))).getTxs()[0]);
        });
      });
    });
  }

  async sweepUnlocked(config) {
    if (this.getWalletProxy()) return this.getWalletProxy().sweepUnlocked(config);

    // validate and normalize config
    const configNormalized = _MoneroWallet.default.normalizeSweepUnlockedConfig(config);

    // sweep unlocked in queue
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {

        // sweep unlocked in wasm which invokes callback when done
        this.module.sweep_unlocked(this.cppAddress, JSON.stringify(configNormalized.toJson()), (txSetsJson) => {
          if (txSetsJson.charAt(0) !== '{') reject(new _MoneroError.default(txSetsJson)); // json expected, else error
          else {
            let txSets = [];
            for (let txSetJson of JSON.parse(_GenUtils.default.stringifyBigInts(txSetsJson)).txSets) txSets.push(new _MoneroTxSet.default(txSetJson));
            let txs = [];
            for (let txSet of txSets) for (let tx of txSet.getTxs()) txs.push(tx);
            resolve(txs);
          }
        });
      });
    });
  }

  async sweepDust(relay) {
    if (this.getWalletProxy()) return this.getWalletProxy().sweepDust(relay);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {

        // call wasm which invokes callback when done
        this.module.sweep_dust(this.cppAddress, relay, (txSetJsonStr) => {
          if (txSetJsonStr.charAt(0) !== '{') reject(new _MoneroError.default(txSetJsonStr)); // json expected, else error
          else {
            let txSet = new _MoneroTxSet.default(JSON.parse(_GenUtils.default.stringifyBigInts(txSetJsonStr)));
            if (txSet.getTxs() === undefined) txSet.setTxs([]);
            resolve(txSet.getTxs());
          }
        });
      });
    });
  }

  async relayTxs(txsOrMetadatas) {
    if (this.getWalletProxy()) return this.getWalletProxy().relayTxs(txsOrMetadatas);
    (0, _assert.default)(Array.isArray(txsOrMetadatas), "Must provide an array of txs or their metadata to relay");
    let txMetadatas = [];
    for (let txOrMetadata of txsOrMetadatas) txMetadatas.push(txOrMetadata instanceof _MoneroTxWallet.default ? txOrMetadata.getMetadata() : txOrMetadata);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.relay_txs(this.cppAddress, JSON.stringify({ txMetadatas: txMetadatas }), (txHashesJson) => {
          if (txHashesJson.charAt(0) !== "{") reject(new _MoneroError.default(txHashesJson));else
          resolve(JSON.parse(txHashesJson).txHashes);
        });
      });
    });
  }

  async describeTxSet(txSet) {
    if (this.getWalletProxy()) return this.getWalletProxy().describeTxSet(txSet);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      txSet = new _MoneroTxSet.default({ unsignedTxHex: txSet.getUnsignedTxHex(), signedTxHex: txSet.getSignedTxHex(), multisigTxHex: txSet.getMultisigTxHex() });
      try {return new _MoneroTxSet.default(JSON.parse(_GenUtils.default.stringifyBigInts(this.module.describe_tx_set(this.cppAddress, JSON.stringify(txSet.toJson())))));}
      catch (err) {throw new _MoneroError.default(this.module.get_exception_message(err));}
    });
  }

  async signTxs(unsignedTxHex) {
    if (this.getWalletProxy()) return this.getWalletProxy().signTxs(unsignedTxHex);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      try {return this.module.sign_txs(this.cppAddress, unsignedTxHex);}
      catch (err) {throw new _MoneroError.default(this.module.get_exception_message(err));}
    });
  }

  async submitTxs(signedTxHex) {
    if (this.getWalletProxy()) return this.getWalletProxy().submitTxs(signedTxHex);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.submit_txs(this.cppAddress, signedTxHex, (resp) => {
          if (resp.charAt(0) !== "{") reject(new _MoneroError.default(resp));else
          resolve(JSON.parse(resp).txHashes);
        });
      });
    });
  }

  async signMessage(message, signatureType = _MoneroMessageSignatureType.default.SIGN_WITH_SPEND_KEY, accountIdx = 0, subaddressIdx = 0) {
    if (this.getWalletProxy()) return this.getWalletProxy().signMessage(message, signatureType, accountIdx, subaddressIdx);

    // assign defaults
    signatureType = signatureType || _MoneroMessageSignatureType.default.SIGN_WITH_SPEND_KEY;
    accountIdx = accountIdx || 0;
    subaddressIdx = subaddressIdx || 0;

    // queue task to sign message
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      try {return this.module.sign_message(this.cppAddress, message, signatureType === _MoneroMessageSignatureType.default.SIGN_WITH_SPEND_KEY ? 0 : 1, accountIdx, subaddressIdx);}
      catch (err) {throw new _MoneroError.default(this.module.get_exception_message(err));}
    });
  }

  async verifyMessage(message, address, signature) {
    if (this.getWalletProxy()) return this.getWalletProxy().verifyMessage(message, address, signature);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let result;
      try {
        result = JSON.parse(this.module.verify_message(this.cppAddress, message, address, signature));
      } catch (err) {
        result = { isGood: false };
      }
      return new _MoneroMessageSignatureResult.default(result.isGood ?
      { isGood: result.isGood, isOld: result.isOld, signatureType: result.signatureType === "spend" ? _MoneroMessageSignatureType.default.SIGN_WITH_SPEND_KEY : _MoneroMessageSignatureType.default.SIGN_WITH_VIEW_KEY, version: result.version } :
      { isGood: false }
      );
    });
  }

  async getTxKey(txHash) {
    if (this.getWalletProxy()) return this.getWalletProxy().getTxKey(txHash);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      try {return this.module.get_tx_key(this.cppAddress, txHash);}
      catch (err) {throw new _MoneroError.default(this.module.get_exception_message(err));}
    });
  }

  async checkTxKey(txHash, txKey, address) {
    if (this.getWalletProxy()) return this.getWalletProxy().checkTxKey(txHash, txKey, address);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.check_tx_key(this.cppAddress, txHash, txKey, address, (respJsonStr) => {
          if (respJsonStr.charAt(0) !== "{") reject(new _MoneroError.default(respJsonStr));else
          resolve(new _MoneroCheckTx.default(JSON.parse(_GenUtils.default.stringifyBigInts(respJsonStr))));
        });
      });
    });
  }

  async getTxProof(txHash, address, message) {
    if (this.getWalletProxy()) return this.getWalletProxy().getTxProof(txHash, address, message);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.get_tx_proof(this.cppAddress, txHash || "", address || "", message || "", (signature) => {
          let errorKey = "error: ";
          if (signature.indexOf(errorKey) === 0) reject(new _MoneroError.default(signature.substring(errorKey.length)));else
          resolve(signature);
        });
      });
    });
  }

  async checkTxProof(txHash, address, message, signature) {
    if (this.getWalletProxy()) return this.getWalletProxy().checkTxProof(txHash, address, message, signature);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.check_tx_proof(this.cppAddress, txHash || "", address || "", message || "", signature || "", (respJsonStr) => {
          if (respJsonStr.charAt(0) !== "{") reject(new _MoneroError.default(respJsonStr));else
          resolve(new _MoneroCheckTx.default(JSON.parse(_GenUtils.default.stringifyBigInts(respJsonStr))));
        });
      });
    });
  }

  async getSpendProof(txHash, message) {
    if (this.getWalletProxy()) return this.getWalletProxy().getSpendProof(txHash, message);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.get_spend_proof(this.cppAddress, txHash || "", message || "", (signature) => {
          let errorKey = "error: ";
          if (signature.indexOf(errorKey) === 0) reject(new _MoneroError.default(signature.substring(errorKey.length)));else
          resolve(signature);
        });
      });
    });
  }

  async checkSpendProof(txHash, message, signature) {
    if (this.getWalletProxy()) return this.getWalletProxy().checkSpendProof(txHash, message, signature);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.check_spend_proof(this.cppAddress, txHash || "", message || "", signature || "", (resp) => {
          typeof resp === "string" ? reject(new _MoneroError.default(resp)) : resolve(resp);
        });
      });
    });
  }

  async getReserveProofWallet(message) {
    if (this.getWalletProxy()) return this.getWalletProxy().getReserveProofWallet(message);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.get_reserve_proof_wallet(this.cppAddress, message, (signature) => {
          let errorKey = "error: ";
          if (signature.indexOf(errorKey) === 0) reject(new _MoneroError.default(signature.substring(errorKey.length), -1));else
          resolve(signature);
        });
      });
    });
  }

  async getReserveProofAccount(accountIdx, amount, message) {
    if (this.getWalletProxy()) return this.getWalletProxy().getReserveProofAccount(accountIdx, amount, message);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.get_reserve_proof_account(this.cppAddress, accountIdx, amount.toString(), message, (signature) => {
          let errorKey = "error: ";
          if (signature.indexOf(errorKey) === 0) reject(new _MoneroError.default(signature.substring(errorKey.length), -1));else
          resolve(signature);
        });
      });
    });
  }

  async checkReserveProof(address, message, signature) {
    if (this.getWalletProxy()) return this.getWalletProxy().checkReserveProof(address, message, signature);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.check_reserve_proof(this.cppAddress, address, message, signature, (respJsonStr) => {
          if (respJsonStr.charAt(0) !== "{") reject(new _MoneroError.default(respJsonStr, -1));else
          resolve(new _MoneroCheckReserve.default(JSON.parse(_GenUtils.default.stringifyBigInts(respJsonStr))));
        });
      });
    });
  }

  async getTxNotes(txHashes) {
    if (this.getWalletProxy()) return this.getWalletProxy().getTxNotes(txHashes);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      try {return JSON.parse(this.module.get_tx_notes(this.cppAddress, JSON.stringify({ txHashes: txHashes }))).txNotes;}
      catch (err) {throw new _MoneroError.default(this.module.get_exception_message(err));}
    });
  }

  async setTxNotes(txHashes, notes) {
    if (this.getWalletProxy()) return this.getWalletProxy().setTxNotes(txHashes, notes);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      try {this.module.set_tx_notes(this.cppAddress, JSON.stringify({ txHashes: txHashes, txNotes: notes }));}
      catch (err) {throw new _MoneroError.default(this.module.get_exception_message(err));}
    });
  }

  async getAddressBookEntries(entryIndices) {
    if (this.getWalletProxy()) return this.getWalletProxy().getAddressBookEntries(entryIndices);
    if (!entryIndices) entryIndices = [];
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let entries = [];
      for (let entryJson of JSON.parse(this.module.get_address_book_entries(this.cppAddress, JSON.stringify({ entryIndices: entryIndices }))).entries) {
        entries.push(new _MoneroAddressBookEntry.default(entryJson));
      }
      return entries;
    });
  }

  async addAddressBookEntry(address, description) {
    if (this.getWalletProxy()) return this.getWalletProxy().addAddressBookEntry(address, description);
    if (!address) address = "";
    if (!description) description = "";
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return this.module.add_address_book_entry(this.cppAddress, address, description);
    });
  }

  async editAddressBookEntry(index, setAddress, address, setDescription, description) {
    if (this.getWalletProxy()) return this.getWalletProxy().editAddressBookEntry(index, setAddress, address, setDescription, description);
    if (!setAddress) setAddress = false;
    if (!address) address = "";
    if (!setDescription) setDescription = false;
    if (!description) description = "";
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      this.module.edit_address_book_entry(this.cppAddress, index, setAddress, address, setDescription, description);
    });
  }

  async deleteAddressBookEntry(entryIdx) {
    if (this.getWalletProxy()) return this.getWalletProxy().deleteAddressBookEntry(entryIdx);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      this.module.delete_address_book_entry(this.cppAddress, entryIdx);
    });
  }

  async tagAccounts(tag, accountIndices) {
    if (this.getWalletProxy()) return this.getWalletProxy().tagAccounts(tag, accountIndices);
    if (!tag) tag = "";
    if (!accountIndices) accountIndices = [];
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      this.module.tag_accounts(this.cppAddress, JSON.stringify({ tag: tag, accountIndices: accountIndices }));
    });
  }

  async untagAccounts(accountIndices) {
    if (this.getWalletProxy()) return this.getWalletProxy().untagAccounts(accountIndices);
    if (!accountIndices) accountIndices = [];
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      this.module.tag_accounts(this.cppAddress, JSON.stringify({ accountIndices: accountIndices }));
    });
  }

  async getAccountTags() {
    if (this.getWalletProxy()) return this.getWalletProxy().getAccountTags();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let accountTags = [];
      for (let accountTagJson of JSON.parse(this.module.get_account_tags(this.cppAddress)).accountTags) accountTags.push(new _MoneroAccountTag.default(accountTagJson));
      return accountTags;
    });
  }

  async setAccountTagLabel(tag, label) {
    if (this.getWalletProxy()) return this.getWalletProxy().setAccountTagLabel(tag, label);
    if (!tag) tag = "";
    if (!label) label = "";
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      this.module.set_account_tag_label(this.cppAddress, tag, label);
    });
  }

  async getPaymentUri(config) {
    if (this.getWalletProxy()) return this.getWalletProxy().getPaymentUri(config);
    config = _MoneroWallet.default.normalizeCreateTxsConfig(config);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      try {
        return this.module.get_payment_uri(this.cppAddress, JSON.stringify(config.toJson()));
      } catch (err) {
        throw new _MoneroError.default("Cannot make URI from supplied parameters");
      }
    });
  }

  async parsePaymentUri(uri) {
    if (this.getWalletProxy()) return this.getWalletProxy().parsePaymentUri(uri);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      try {
        return new _MoneroTxConfig.default(JSON.parse(_GenUtils.default.stringifyBigInts(this.module.parse_payment_uri(this.cppAddress, uri))));
      } catch (err) {
        throw new _MoneroError.default(err.message);
      }
    });
  }

  async getAttribute(key) {
    if (this.getWalletProxy()) return this.getWalletProxy().getAttribute(key);
    this.assertNotClosed();
    (0, _assert.default)(typeof key === "string", "Attribute key must be a string");
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let value = this.module.get_attribute(this.cppAddress, key);
      return value === "" ? null : value;
    });
  }

  async setAttribute(key, val) {
    if (this.getWalletProxy()) return this.getWalletProxy().setAttribute(key, val);
    this.assertNotClosed();
    (0, _assert.default)(typeof key === "string", "Attribute key must be a string");
    (0, _assert.default)(typeof val === "string", "Attribute value must be a string");
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      this.module.set_attribute(this.cppAddress, key, val);
    });
  }

  async startMining(numThreads, backgroundMining, ignoreBattery) {
    if (this.getWalletProxy()) return this.getWalletProxy().startMining(numThreads, backgroundMining, ignoreBattery);
    this.assertNotClosed();
    let daemon = await _MoneroDaemonRpc.default.connectToDaemonRpc(await this.getDaemonConnection());
    await daemon.startMining(await this.getPrimaryAddress(), numThreads, backgroundMining, ignoreBattery);
  }

  async stopMining() {
    if (this.getWalletProxy()) return this.getWalletProxy().stopMining();
    this.assertNotClosed();
    let daemon = await _MoneroDaemonRpc.default.connectToDaemonRpc(await this.getDaemonConnection());
    await daemon.stopMining();
  }

  async isMultisigImportNeeded() {
    if (this.getWalletProxy()) return this.getWalletProxy().isMultisigImportNeeded();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return this.module.is_multisig_import_needed(this.cppAddress);
    });
  }

  async isMultisig() {
    if (this.getWalletProxy()) return this.getWalletProxy().isMultisig();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return this.module.is_multisig(this.cppAddress);
    });
  }

  async getMultisigInfo() {
    if (this.getWalletProxy()) return this.getWalletProxy().getMultisigInfo();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new _MoneroMultisigInfo.default(JSON.parse(this.module.get_multisig_info(this.cppAddress)));
    });
  }

  async prepareMultisig() {
    if (this.getWalletProxy()) return this.getWalletProxy().prepareMultisig();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return this.module.prepare_multisig(this.cppAddress);
    });
  }

  async makeMultisig(multisigHexes, threshold, password) {
    if (this.getWalletProxy()) return this.getWalletProxy().makeMultisig(multisigHexes, threshold, password);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.make_multisig(this.cppAddress, JSON.stringify({ multisigHexes: multisigHexes, threshold: threshold, password: password }), (resp) => {
          let errorKey = "error: ";
          if (resp.indexOf(errorKey) === 0) reject(new _MoneroError.default(resp.substring(errorKey.length)));else
          resolve(resp);
        });
      });
    });
  }

  async exchangeMultisigKeys(multisigHexes, password) {
    if (this.getWalletProxy()) return this.getWalletProxy().exchangeMultisigKeys(multisigHexes, password);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.exchange_multisig_keys(this.cppAddress, JSON.stringify({ multisigHexes: multisigHexes, password: password }), (resp) => {
          let errorKey = "error: ";
          if (resp.indexOf(errorKey) === 0) reject(new _MoneroError.default(resp.substring(errorKey.length)));else
          resolve(new _MoneroMultisigInitResult.default(JSON.parse(resp)));
        });
      });
    });
  }

  async exportMultisigHex() {
    if (this.getWalletProxy()) return this.getWalletProxy().exportMultisigHex();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return this.module.export_multisig_hex(this.cppAddress);
    });
  }

  async importMultisigHex(multisigHexes) {
    if (this.getWalletProxy()) return this.getWalletProxy().importMultisigHex(multisigHexes);
    if (!_GenUtils.default.isArray(multisigHexes)) throw new _MoneroError.default("Must provide string[] to importMultisigHex()");
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.import_multisig_hex(this.cppAddress, JSON.stringify({ multisigHexes: multisigHexes }), (resp) => {
          if (typeof resp === "string") reject(new _MoneroError.default(resp));else
          resolve(resp);
        });
      });
    });
  }

  async signMultisigTxHex(multisigTxHex) {
    if (this.getWalletProxy()) return this.getWalletProxy().signMultisigTxHex(multisigTxHex);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.sign_multisig_tx_hex(this.cppAddress, multisigTxHex, (resp) => {
          if (resp.charAt(0) !== "{") reject(new _MoneroError.default(resp));else
          resolve(new _MoneroMultisigSignResult.default(JSON.parse(resp)));
        });
      });
    });
  }

  async submitMultisigTxHex(signedMultisigTxHex) {
    if (this.getWalletProxy()) return this.getWalletProxy().submitMultisigTxHex(signedMultisigTxHex);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.submit_multisig_tx_hex(this.cppAddress, signedMultisigTxHex, (resp) => {
          if (resp.charAt(0) !== "{") reject(new _MoneroError.default(resp));else
          resolve(JSON.parse(resp).txHashes);
        });
      });
    });
  }

  /**
   * Get the wallet's keys and cache data.
   * 
   * @return {Promise<DataView[]>} is the keys and cache data, respectively
   */
  async getData() {
    if (this.getWalletProxy()) return this.getWalletProxy().getData();

    // queue call to wasm module
    let viewOnly = await this.isViewOnly();
    return this.module.queueTask(async () => {
      this.assertNotClosed();

      // store views in array
      let views = [];

      // malloc cache buffer and get buffer location in c++ heap
      let cacheBufferLoc = JSON.parse(this.module.get_cache_file_buffer(this.cppAddress));

      // read binary data from heap to DataView
      let view = new DataView(new ArrayBuffer(cacheBufferLoc.length));
      for (let i = 0; i < cacheBufferLoc.length; i++) {
        view.setInt8(i, this.module.HEAPU8[cacheBufferLoc.pointer / Uint8Array.BYTES_PER_ELEMENT + i]);
      }

      // free binary on heap
      this.module._free(cacheBufferLoc.pointer);

      // write cache file
      views.push(Buffer.from(view.buffer));

      // malloc keys buffer and get buffer location in c++ heap
      let keysBufferLoc = JSON.parse(this.module.get_keys_file_buffer(this.cppAddress, this.password, viewOnly));

      // read binary data from heap to DataView
      view = new DataView(new ArrayBuffer(keysBufferLoc.length));
      for (let i = 0; i < keysBufferLoc.length; i++) {
        view.setInt8(i, this.module.HEAPU8[keysBufferLoc.pointer / Uint8Array.BYTES_PER_ELEMENT + i]);
      }

      // free binary on heap
      this.module._free(keysBufferLoc.pointer);

      // prepend keys file
      views.unshift(Buffer.from(view.buffer));
      return views;
    });
  }

  async changePassword(oldPassword, newPassword) {
    if (this.getWalletProxy()) return this.getWalletProxy().changePassword(oldPassword, newPassword);
    if (oldPassword !== this.password) throw new _MoneroError.default("Invalid original password."); // wallet2 verify_password loads from disk so verify password here
    if (newPassword === undefined) newPassword = "";
    await this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.change_wallet_password(this.cppAddress, oldPassword, newPassword, (errMsg) => {
          if (errMsg) reject(new _MoneroError.default(errMsg));else
          resolve();
        });
      });
    });
    this.password = newPassword;
    if (this.path) await this.save(); // auto save
  }

  async save() {
    if (this.getWalletProxy()) return this.getWalletProxy().save();
    return MoneroWalletFull.save(this);
  }

  async close(save = false) {
    if (this._isClosed) return; // no effect if closed
    if (this.getWalletProxy()) {
      await this.getWalletProxy().close(save);
      this._isClosed = true;
      return;
    }
    await this.refreshListening();
    await this.stopSyncing();
    await super.close(save);
    delete this.path;
    delete this.password;
    delete this.listeners;
    delete this.fullListener;
    _LibraryUtils.default.setRejectUnauthorizedFn(this.rejectUnauthorizedConfigId, undefined); // unregister fn informing if unauthorized reqs should be rejected
  }

  // ----------- ADD JSDOC FOR SUPPORTED DEFAULT IMPLEMENTATIONS --------------

  async getNumBlocksToUnlock() {return super.getNumBlocksToUnlock();}
  async getTx(txHash) {return super.getTx(txHash);}
  async getIncomingTransfers(query) {return super.getIncomingTransfers(query);}
  async getOutgoingTransfers(query) {return super.getOutgoingTransfers(query);}
  async createTx(config) {return super.createTx(config);}
  async relayTx(txOrMetadata) {return super.relayTx(txOrMetadata);}
  async getTxNote(txHash) {return super.getTxNote(txHash);}
  async setTxNote(txHash, note) {return super.setTxNote(txHash, note);}

  // ---------------------------- PRIVATE HELPERS ----------------------------

  static async openWalletData(config) {
    if (config.proxyToWorker) return MoneroWalletFullProxy.openWalletData(config);

    // validate and normalize parameters
    if (config.networkType === undefined) throw new _MoneroError.default("Must provide the wallet's network type");
    config.networkType = _MoneroNetworkType.default.from(config.networkType);
    let daemonConnection = config.getServer();
    let daemonUri = daemonConnection && daemonConnection.getUri() ? daemonConnection.getUri() : "";
    let daemonUsername = daemonConnection && daemonConnection.getUsername() ? daemonConnection.getUsername() : "";
    let daemonPassword = daemonConnection && daemonConnection.getPassword() ? daemonConnection.getPassword() : "";
    let rejectUnauthorized = daemonConnection ? daemonConnection.getRejectUnauthorized() : true;

    // load wasm module
    let module = await _LibraryUtils.default.loadFullModule();

    // open wallet in queue
    return module.queueTask(async () => {
      return new Promise((resolve, reject) => {

        // register fn informing if unauthorized reqs should be rejected
        let rejectUnauthorizedFnId = _GenUtils.default.getUUID();
        _LibraryUtils.default.setRejectUnauthorizedFn(rejectUnauthorizedFnId, () => rejectUnauthorized);

        // create wallet in wasm which invokes callback when done
        module.open_wallet_full(config.password, config.networkType, config.keysData, config.cacheData, daemonUri, daemonUsername, daemonPassword, rejectUnauthorizedFnId, (cppAddress) => {
          if (typeof cppAddress === "string") reject(new _MoneroError.default(cppAddress));else
          resolve(new MoneroWalletFull(cppAddress, config.path, config.password, _fs.default, rejectUnauthorized, rejectUnauthorizedFnId));
        });
      });
    });
  }

  getWalletProxy() {
    return super.getWalletProxy();
  }

  async backgroundSync() {
    let label = this.path ? this.path : this.browserMainPath ? this.browserMainPath : "in-memory wallet"; // label for log
    _LibraryUtils.default.log(1, "Background synchronizing " + label);
    try {await this.sync();}
    catch (err) {if (!this._isClosed) console.error("Failed to background synchronize " + label + ": " + err.message);}
  }

  async refreshListening() {
    let isEnabled = this.listeners.length > 0;
    if (this.fullListenerHandle === 0 && !isEnabled || this.fullListenerHandle > 0 && isEnabled) return; // no difference
    return this.module.queueTask(async () => {
      return new Promise((resolve, reject) => {
        this.module.set_listener(
          this.cppAddress,
          this.fullListenerHandle,
          (newListenerHandle) => {
            if (typeof newListenerHandle === "string") reject(new _MoneroError.default(newListenerHandle));else
            {
              this.fullListenerHandle = newListenerHandle;
              resolve();
            }
          },
          isEnabled ? async (height, startHeight, endHeight, percentDone, message) => await this.fullListener.onSyncProgress(height, startHeight, endHeight, percentDone, message) : undefined,
          isEnabled ? async (height) => await this.fullListener.onNewBlock(height) : undefined,
          isEnabled ? async (newBalanceStr, newUnlockedBalanceStr) => await this.fullListener.onBalancesChanged(newBalanceStr, newUnlockedBalanceStr) : undefined,
          isEnabled ? async (height, txHash, amountStr, accountIdx, subaddressIdx, version, unlockTime, isLocked) => await this.fullListener.onOutputReceived(height, txHash, amountStr, accountIdx, subaddressIdx, version, unlockTime, isLocked) : undefined,
          isEnabled ? async (height, txHash, amountStr, accountIdxStr, subaddressIdxStr, version, unlockTime, isLocked) => await this.fullListener.onOutputSpent(height, txHash, amountStr, accountIdxStr, subaddressIdxStr, version, unlockTime, isLocked) : undefined
        );
      });
    });
  }

  static sanitizeBlock(block) {
    for (let tx of block.getTxs()) MoneroWalletFull.sanitizeTxWallet(tx);
    return block;
  }

  static sanitizeTxWallet(tx) {
    (0, _assert.default)(tx instanceof _MoneroTxWallet.default);
    return tx;
  }

  static sanitizeAccount(account) {
    if (account.getSubaddresses()) {
      for (let subaddress of account.getSubaddresses()) _MoneroWalletKeys.MoneroWalletKeys.sanitizeSubaddress(subaddress);
    }
    return account;
  }

  static deserializeBlocks(blocksJsonStr) {
    let blocksJson = JSON.parse(_GenUtils.default.stringifyBigInts(blocksJsonStr));
    let deserializedBlocks = {};
    deserializedBlocks.blocks = [];
    if (blocksJson.blocks) for (let blockJson of blocksJson.blocks) deserializedBlocks.blocks.push(MoneroWalletFull.sanitizeBlock(new _MoneroBlock.default(blockJson, _MoneroBlock.default.DeserializationType.TX_WALLET)));
    return deserializedBlocks;
  }

  static deserializeTxs(query, blocksJsonStr) {

    // deserialize blocks
    let deserializedBlocks = MoneroWalletFull.deserializeBlocks(blocksJsonStr);
    let blocks = deserializedBlocks.blocks;

    // collect txs
    let txs = [];
    for (let block of blocks) {
      MoneroWalletFull.sanitizeBlock(block);
      for (let tx of block.getTxs()) {
        if (block.getHeight() === undefined) tx.setBlock(undefined); // dereference placeholder block for unconfirmed txs
        txs.push(tx);
      }
    }

    // re-sort txs which is lost over wasm serialization  // TODO: confirm that order is lost
    if (query.getHashes() !== undefined) {
      let txMap = new Map();
      for (let tx of txs) txMap[tx.getHash()] = tx;
      let txsSorted = [];
      for (let txHash of query.getHashes()) if (txMap[txHash] !== undefined) txsSorted.push(txMap[txHash]);
      txs = txsSorted;
    }

    return txs;
  }

  static deserializeTransfers(query, blocksJsonStr) {

    // deserialize blocks
    let deserializedBlocks = MoneroWalletFull.deserializeBlocks(blocksJsonStr);
    let blocks = deserializedBlocks.blocks;

    // collect transfers
    let transfers = [];
    for (let block of blocks) {
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

  static deserializeOutputs(query, blocksJsonStr) {

    // deserialize blocks
    let deserializedBlocks = MoneroWalletFull.deserializeBlocks(blocksJsonStr);
    let blocks = deserializedBlocks.blocks;

    // collect outputs
    let outputs = [];
    for (let block of blocks) {
      for (let tx of block.getTxs()) {
        for (let output of tx.getOutputs()) outputs.push(output);
      }
    }

    return outputs;
  }

  /**
   * Set the path of the wallet on the browser main thread if run as a worker.
   * 
   * @param {string} browserMainPath - path of the wallet on the browser main thread
   */
  setBrowserMainPath(browserMainPath) {
    this.browserMainPath = browserMainPath;
  }

  static async moveTo(path, wallet) {
    if (await wallet.isClosed()) throw new _MoneroError.default("Wallet is closed");
    if (!path) throw new _MoneroError.default("Must provide path of destination wallet");

    // save and return if same path
    if (_path.default.normalize(wallet.path) === _path.default.normalize(path)) {
      await wallet.save();
      return;
    }

    // create destination directory if it doesn't exist
    let walletDir = _path.default.dirname(path);
    if (!wallet.fs.existsSync(walletDir)) {
      try {wallet.fs.mkdirSync(walletDir);}
      catch (err) {throw new _MoneroError.default("Destination path " + path + " does not exist and cannot be created: " + err.message);}
    }

    // write wallet files
    let data = await wallet.getData();
    wallet.fs.writeFileSync(path + ".keys", data[0], "binary");
    wallet.fs.writeFileSync(path, data[1], "binary");
    wallet.fs.writeFileSync(path + ".address.txt", await wallet.getPrimaryAddress());
    let oldPath = wallet.path;
    wallet.path = path;

    // delete old wallet files
    if (oldPath) {
      wallet.fs.unlinkSync(oldPath + ".address.txt");
      wallet.fs.unlinkSync(oldPath + ".keys");
      wallet.fs.unlinkSync(oldPath);
    }
  }

  static async save(wallet) {
    if (await wallet.isClosed()) throw new _MoneroError.default("Wallet is closed");

    // path must be set
    let path = await wallet.getPath();
    if (!path) throw new _MoneroError.default("Cannot save wallet because path is not set");

    // write wallet files to *.new
    let pathNew = path + ".new";
    let data = await wallet.getData();
    wallet.fs.writeFileSync(pathNew + ".keys", data[0], "binary");
    wallet.fs.writeFileSync(pathNew, data[1], "binary");
    wallet.fs.writeFileSync(pathNew + ".address.txt", await wallet.getPrimaryAddress());

    // replace old wallet files with new
    wallet.fs.renameSync(pathNew + ".keys", path + ".keys");
    wallet.fs.renameSync(pathNew, path, path + ".keys");
    wallet.fs.renameSync(pathNew + ".address.txt", path + ".address.txt", path + ".keys");
  }
}

/**
 * Implements a MoneroWallet by proxying requests to a worker which runs a full wallet.
 * 
 * @private
 */exports.default = MoneroWalletFull;
class MoneroWalletFullProxy extends _MoneroWalletKeys.MoneroWalletKeysProxy {

  // instance variables




  // -------------------------- WALLET STATIC UTILS ---------------------------

  static async openWalletData(config) {
    let walletId = _GenUtils.default.getUUID();
    if (config.password === undefined) config.password = "";
    let daemonConnection = config.getServer();
    await _LibraryUtils.default.invokeWorker(walletId, "openWalletData", [config.path, config.password, config.networkType, config.keysData, config.cacheData, daemonConnection ? daemonConnection.toJson() : undefined]);
    let wallet = new MoneroWalletFullProxy(walletId, await _LibraryUtils.default.getWorker(), config.path, config.getFs());
    if (config.path) await wallet.save();
    return wallet;
  }

  static async createWallet(config) {
    if (config.getPath() && MoneroWalletFull.walletExists(config.getPath(), config.getFs())) throw new _MoneroError.default("Wallet already exists: " + config.getPath());
    let walletId = _GenUtils.default.getUUID();
    await _LibraryUtils.default.invokeWorker(walletId, "createWalletFull", [config.toJson()]);
    let wallet = new MoneroWalletFullProxy(walletId, await _LibraryUtils.default.getWorker(), config.getPath(), config.getFs());
    if (config.getPath()) await wallet.save();
    return wallet;
  }

  // --------------------------- INSTANCE METHODS ----------------------------

  /**
   * Internal constructor which is given a worker to communicate with via messages.
   * 
   * This method should not be called externally but should be called through
   * static wallet creation utilities in this class.
   * 
   * @param {string} walletId - identifies the wallet with the worker
   * @param {Worker} worker - worker to communicate with via messages
   */
  constructor(walletId, worker, path, fs) {
    super(walletId, worker);
    this.path = path;
    this.fs = fs ? fs : path ? MoneroWalletFull.getFs() : undefined;
    this.wrappedListeners = [];
  }

  getPath() {
    return this.path;
  }

  async getNetworkType() {
    return this.invokeWorker("getNetworkType");
  }

  async setSubaddressLabel(accountIdx, subaddressIdx, label) {
    return this.invokeWorker("setSubaddressLabel", Array.from(arguments));
  }

  async setDaemonConnection(uriOrRpcConnection) {
    if (!uriOrRpcConnection) await this.invokeWorker("setDaemonConnection");else
    {
      let connection = !uriOrRpcConnection ? undefined : uriOrRpcConnection instanceof _MoneroRpcConnection.default ? uriOrRpcConnection : new _MoneroRpcConnection.default(uriOrRpcConnection);
      await this.invokeWorker("setDaemonConnection", connection ? connection.getConfig() : undefined);
    }
  }

  async getDaemonConnection() {
    let rpcConfig = await this.invokeWorker("getDaemonConnection");
    return rpcConfig ? new _MoneroRpcConnection.default(rpcConfig) : undefined;
  }

  async isConnectedToDaemon() {
    return this.invokeWorker("isConnectedToDaemon");
  }

  async getRestoreHeight() {
    return this.invokeWorker("getRestoreHeight");
  }

  async setRestoreHeight(restoreHeight) {
    return this.invokeWorker("setRestoreHeight", [restoreHeight]);
  }

  async getDaemonHeight() {
    return this.invokeWorker("getDaemonHeight");
  }

  async getDaemonMaxPeerHeight() {
    return this.invokeWorker("getDaemonMaxPeerHeight");
  }

  async getHeightByDate(year, month, day) {
    return this.invokeWorker("getHeightByDate", [year, month, day]);
  }

  async isDaemonSynced() {
    return this.invokeWorker("isDaemonSynced");
  }

  async getHeight() {
    return this.invokeWorker("getHeight");
  }

  async addListener(listener) {
    let wrappedListener = new WalletWorkerListener(listener);
    let listenerId = wrappedListener.getId();
    _LibraryUtils.default.addWorkerCallback(this.walletId, "onSyncProgress_" + listenerId, [wrappedListener.onSyncProgress, wrappedListener]);
    _LibraryUtils.default.addWorkerCallback(this.walletId, "onNewBlock_" + listenerId, [wrappedListener.onNewBlock, wrappedListener]);
    _LibraryUtils.default.addWorkerCallback(this.walletId, "onBalancesChanged_" + listenerId, [wrappedListener.onBalancesChanged, wrappedListener]);
    _LibraryUtils.default.addWorkerCallback(this.walletId, "onOutputReceived_" + listenerId, [wrappedListener.onOutputReceived, wrappedListener]);
    _LibraryUtils.default.addWorkerCallback(this.walletId, "onOutputSpent_" + listenerId, [wrappedListener.onOutputSpent, wrappedListener]);
    this.wrappedListeners.push(wrappedListener);
    return this.invokeWorker("addListener", [listenerId]);
  }

  async removeListener(listener) {
    for (let i = 0; i < this.wrappedListeners.length; i++) {
      if (this.wrappedListeners[i].getListener() === listener) {
        let listenerId = this.wrappedListeners[i].getId();
        await this.invokeWorker("removeListener", [listenerId]);
        _LibraryUtils.default.removeWorkerCallback(this.walletId, "onSyncProgress_" + listenerId);
        _LibraryUtils.default.removeWorkerCallback(this.walletId, "onNewBlock_" + listenerId);
        _LibraryUtils.default.removeWorkerCallback(this.walletId, "onBalancesChanged_" + listenerId);
        _LibraryUtils.default.removeWorkerCallback(this.walletId, "onOutputReceived_" + listenerId);
        _LibraryUtils.default.removeWorkerCallback(this.walletId, "onOutputSpent_" + listenerId);
        this.wrappedListeners.splice(i, 1);
        return;
      }
    }
    throw new _MoneroError.default("Listener is not registered with wallet");
  }

  getListeners() {
    let listeners = [];
    for (let wrappedListener of this.wrappedListeners) listeners.push(wrappedListener.getListener());
    return listeners;
  }

  async isSynced() {
    return this.invokeWorker("isSynced");
  }

  async sync(listenerOrStartHeight, startHeight, allowConcurrentCalls = false) {

    // normalize params
    startHeight = listenerOrStartHeight instanceof _MoneroWalletListener.default ? startHeight : listenerOrStartHeight;
    let listener = listenerOrStartHeight instanceof _MoneroWalletListener.default ? listenerOrStartHeight : undefined;
    if (startHeight === undefined) startHeight = Math.max(await this.getHeight(), await this.getRestoreHeight());

    // register listener if given
    if (listener) await this.addListener(listener);

    // sync wallet in worker 
    let err;
    let result;
    try {
      let resultJson = await this.invokeWorker("sync", [startHeight, allowConcurrentCalls]);
      result = new _MoneroSyncResult.default(resultJson.numBlocksFetched, resultJson.receivedMoney);
    } catch (e) {
      err = e;
    }

    // unregister listener
    if (listener) await this.removeListener(listener);

    // throw error or return
    if (err) throw err;
    return result;
  }

  async startSyncing(syncPeriodInMs) {
    return this.invokeWorker("startSyncing", Array.from(arguments));
  }

  async stopSyncing() {
    return this.invokeWorker("stopSyncing");
  }

  async scanTxs(txHashes) {
    (0, _assert.default)(Array.isArray(txHashes), "Must provide an array of txs hashes to scan");
    return this.invokeWorker("scanTxs", [txHashes]);
  }

  async rescanSpent() {
    return this.invokeWorker("rescanSpent");
  }

  async rescanBlockchain() {
    return this.invokeWorker("rescanBlockchain");
  }

  async getBalance(accountIdx, subaddressIdx) {
    return BigInt(await this.invokeWorker("getBalance", Array.from(arguments)));
  }

  async getUnlockedBalance(accountIdx, subaddressIdx) {
    let unlockedBalanceStr = await this.invokeWorker("getUnlockedBalance", Array.from(arguments));
    return BigInt(unlockedBalanceStr);
  }

  async getAccounts(includeSubaddresses, tag) {
    let accounts = [];
    for (let accountJson of await this.invokeWorker("getAccounts", Array.from(arguments))) {
      accounts.push(MoneroWalletFull.sanitizeAccount(new _MoneroAccount.default(accountJson)));
    }
    return accounts;
  }

  async getAccount(accountIdx, includeSubaddresses) {
    let accountJson = await this.invokeWorker("getAccount", Array.from(arguments));
    return MoneroWalletFull.sanitizeAccount(new _MoneroAccount.default(accountJson));
  }

  async createAccount(label) {
    let accountJson = await this.invokeWorker("createAccount", Array.from(arguments));
    return MoneroWalletFull.sanitizeAccount(new _MoneroAccount.default(accountJson));
  }

  async getSubaddresses(accountIdx, subaddressIndices) {
    let subaddresses = [];
    for (let subaddressJson of await this.invokeWorker("getSubaddresses", Array.from(arguments))) {
      subaddresses.push(_MoneroWalletKeys.MoneroWalletKeys.sanitizeSubaddress(new _MoneroSubaddress.default(subaddressJson)));
    }
    return subaddresses;
  }

  async createSubaddress(accountIdx, label) {
    let subaddressJson = await this.invokeWorker("createSubaddress", Array.from(arguments));
    return _MoneroWalletKeys.MoneroWalletKeys.sanitizeSubaddress(new _MoneroSubaddress.default(subaddressJson));
  }

  async getTxs(query) {
    query = _MoneroWallet.default.normalizeTxQuery(query);
    let respJson = await this.invokeWorker("getTxs", [query.getBlock().toJson()]);
    return MoneroWalletFull.deserializeTxs(query, JSON.stringify({ blocks: respJson.blocks })); // initialize txs from blocks json string TODO: this stringifies then utility parses, avoid
  }

  async getTransfers(query) {
    query = _MoneroWallet.default.normalizeTransferQuery(query);
    let blockJsons = await this.invokeWorker("getTransfers", [query.getTxQuery().getBlock().toJson()]);
    return MoneroWalletFull.deserializeTransfers(query, JSON.stringify({ blocks: blockJsons })); // initialize transfers from blocks json string TODO: this stringifies then utility parses, avoid
  }

  async getOutputs(query) {
    query = _MoneroWallet.default.normalizeOutputQuery(query);
    let blockJsons = await this.invokeWorker("getOutputs", [query.getTxQuery().getBlock().toJson()]);
    return MoneroWalletFull.deserializeOutputs(query, JSON.stringify({ blocks: blockJsons })); // initialize transfers from blocks json string TODO: this stringifies then utility parses, avoid
  }

  async exportOutputs(all) {
    return this.invokeWorker("exportOutputs", [all]);
  }

  async importOutputs(outputsHex) {
    return this.invokeWorker("importOutputs", [outputsHex]);
  }

  async exportKeyImages(all) {
    let keyImages = [];
    for (let keyImageJson of await this.invokeWorker("getKeyImages", [all])) keyImages.push(new _MoneroKeyImage.default(keyImageJson));
    return keyImages;
  }

  async importKeyImages(keyImages) {
    let keyImagesJson = [];
    for (let keyImage of keyImages) keyImagesJson.push(keyImage.toJson());
    return new _MoneroKeyImageImportResult.default(await this.invokeWorker("importKeyImages", [keyImagesJson]));
  }

  async getNewKeyImagesFromLastImport() {
    throw new _MoneroError.default("MoneroWalletFull.getNewKeyImagesFromLastImport() not implemented");
  }

  async freezeOutput(keyImage) {
    return this.invokeWorker("freezeOutput", [keyImage]);
  }

  async thawOutput(keyImage) {
    return this.invokeWorker("thawOutput", [keyImage]);
  }

  async isOutputFrozen(keyImage) {
    return this.invokeWorker("isOutputFrozen", [keyImage]);
  }

  async createTxs(config) {
    config = _MoneroWallet.default.normalizeCreateTxsConfig(config);
    let txSetJson = await this.invokeWorker("createTxs", [config.toJson()]);
    return new _MoneroTxSet.default(txSetJson).getTxs();
  }

  async sweepOutput(config) {
    config = _MoneroWallet.default.normalizeSweepOutputConfig(config);
    let txSetJson = await this.invokeWorker("sweepOutput", [config.toJson()]);
    return new _MoneroTxSet.default(txSetJson).getTxs()[0];
  }

  async sweepUnlocked(config) {
    config = _MoneroWallet.default.normalizeSweepUnlockedConfig(config);
    let txSetsJson = await this.invokeWorker("sweepUnlocked", [config.toJson()]);
    let txs = [];
    for (let txSetJson of txSetsJson) for (let tx of new _MoneroTxSet.default(txSetJson).getTxs()) txs.push(tx);
    return txs;
  }

  async sweepDust(relay) {
    return new _MoneroTxSet.default(await this.invokeWorker("sweepDust", [relay])).getTxs() || [];
  }

  async relayTxs(txsOrMetadatas) {
    (0, _assert.default)(Array.isArray(txsOrMetadatas), "Must provide an array of txs or their metadata to relay");
    let txMetadatas = [];
    for (let txOrMetadata of txsOrMetadatas) txMetadatas.push(txOrMetadata instanceof _MoneroTxWallet.default ? txOrMetadata.getMetadata() : txOrMetadata);
    return this.invokeWorker("relayTxs", [txMetadatas]);
  }

  async describeTxSet(txSet) {
    return new _MoneroTxSet.default(await this.invokeWorker("describeTxSet", [txSet.toJson()]));
  }

  async signTxs(unsignedTxHex) {
    return this.invokeWorker("signTxs", Array.from(arguments));
  }

  async submitTxs(signedTxHex) {
    return this.invokeWorker("submitTxs", Array.from(arguments));
  }

  async signMessage(message, signatureType, accountIdx, subaddressIdx) {
    return this.invokeWorker("signMessage", Array.from(arguments));
  }

  async verifyMessage(message, address, signature) {
    return new _MoneroMessageSignatureResult.default(await this.invokeWorker("verifyMessage", Array.from(arguments)));
  }

  async getTxKey(txHash) {
    return this.invokeWorker("getTxKey", Array.from(arguments));
  }

  async checkTxKey(txHash, txKey, address) {
    return new _MoneroCheckTx.default(await this.invokeWorker("checkTxKey", Array.from(arguments)));
  }

  async getTxProof(txHash, address, message) {
    return this.invokeWorker("getTxProof", Array.from(arguments));
  }

  async checkTxProof(txHash, address, message, signature) {
    return new _MoneroCheckTx.default(await this.invokeWorker("checkTxProof", Array.from(arguments)));
  }

  async getSpendProof(txHash, message) {
    return this.invokeWorker("getSpendProof", Array.from(arguments));
  }

  async checkSpendProof(txHash, message, signature) {
    return this.invokeWorker("checkSpendProof", Array.from(arguments));
  }

  async getReserveProofWallet(message) {
    return this.invokeWorker("getReserveProofWallet", Array.from(arguments));
  }

  async getReserveProofAccount(accountIdx, amount, message) {
    try {return await this.invokeWorker("getReserveProofAccount", [accountIdx, amount.toString(), message]);}
    catch (e) {throw new _MoneroError.default(e.message, -1);}
  }

  async checkReserveProof(address, message, signature) {
    try {return new _MoneroCheckReserve.default(await this.invokeWorker("checkReserveProof", Array.from(arguments)));}
    catch (e) {throw new _MoneroError.default(e.message, -1);}
  }

  async getTxNotes(txHashes) {
    return this.invokeWorker("getTxNotes", Array.from(arguments));
  }

  async setTxNotes(txHashes, notes) {
    return this.invokeWorker("setTxNotes", Array.from(arguments));
  }

  async getAddressBookEntries(entryIndices) {
    if (!entryIndices) entryIndices = [];
    let entries = [];
    for (let entryJson of await this.invokeWorker("getAddressBookEntries", Array.from(arguments))) {
      entries.push(new _MoneroAddressBookEntry.default(entryJson));
    }
    return entries;
  }

  async addAddressBookEntry(address, description) {
    return this.invokeWorker("addAddressBookEntry", Array.from(arguments));
  }

  async editAddressBookEntry(index, setAddress, address, setDescription, description) {
    return this.invokeWorker("editAddressBookEntry", Array.from(arguments));
  }

  async deleteAddressBookEntry(entryIdx) {
    return this.invokeWorker("deleteAddressBookEntry", Array.from(arguments));
  }

  async tagAccounts(tag, accountIndices) {
    return this.invokeWorker("tagAccounts", Array.from(arguments));
  }

  async untagAccounts(accountIndices) {
    return this.invokeWorker("untagAccounts", Array.from(arguments));
  }

  async getAccountTags() {
    return this.invokeWorker("getAccountTags", Array.from(arguments));
  }

  async setAccountTagLabel(tag, label) {
    return this.invokeWorker("setAccountTagLabel", Array.from(arguments));
  }

  async getPaymentUri(config) {
    config = _MoneroWallet.default.normalizeCreateTxsConfig(config);
    return this.invokeWorker("getPaymentUri", [config.toJson()]);
  }

  async parsePaymentUri(uri) {
    return new _MoneroTxConfig.default(await this.invokeWorker("parsePaymentUri", Array.from(arguments)));
  }

  async getAttribute(key) {
    return this.invokeWorker("getAttribute", Array.from(arguments));
  }

  async setAttribute(key, val) {
    return this.invokeWorker("setAttribute", Array.from(arguments));
  }

  async startMining(numThreads, backgroundMining, ignoreBattery) {
    return this.invokeWorker("startMining", Array.from(arguments));
  }

  async stopMining() {
    return this.invokeWorker("stopMining", Array.from(arguments));
  }

  async isMultisigImportNeeded() {
    return this.invokeWorker("isMultisigImportNeeded");
  }

  async isMultisig() {
    return this.invokeWorker("isMultisig");
  }

  async getMultisigInfo() {
    return new _MoneroMultisigInfo.default(await this.invokeWorker("getMultisigInfo"));
  }

  async prepareMultisig() {
    return this.invokeWorker("prepareMultisig");
  }

  async makeMultisig(multisigHexes, threshold, password) {
    return await this.invokeWorker("makeMultisig", Array.from(arguments));
  }

  async exchangeMultisigKeys(multisigHexes, password) {
    return new _MoneroMultisigInitResult.default(await this.invokeWorker("exchangeMultisigKeys", Array.from(arguments)));
  }

  async exportMultisigHex() {
    return this.invokeWorker("exportMultisigHex");
  }

  async importMultisigHex(multisigHexes) {
    return this.invokeWorker("importMultisigHex", Array.from(arguments));
  }

  async signMultisigTxHex(multisigTxHex) {
    return new _MoneroMultisigSignResult.default(await this.invokeWorker("signMultisigTxHex", Array.from(arguments)));
  }

  async submitMultisigTxHex(signedMultisigTxHex) {
    return this.invokeWorker("submitMultisigTxHex", Array.from(arguments));
  }

  async getData() {
    return this.invokeWorker("getData");
  }

  async moveTo(path) {
    return MoneroWalletFull.moveTo(path, this);
  }

  async changePassword(oldPassword, newPassword) {
    await this.invokeWorker("changePassword", Array.from(arguments));
    if (this.path) await this.save(); // auto save
  }

  async save() {
    return MoneroWalletFull.save(this);
  }

  async close(save) {
    if (save) await this.save();
    while (this.wrappedListeners.length) await this.removeListener(this.wrappedListeners[0].getListener());
    await super.close(false);
  }
}

// -------------------------------- LISTENING ---------------------------------

/**
 * Receives notifications directly from wasm c++.
 * 
 * @private
 */
class WalletFullListener {



  constructor(wallet) {
    this.wallet = wallet;
  }

  async onSyncProgress(height, startHeight, endHeight, percentDone, message) {
    for (let listener of this.wallet.getListeners()) await listener.onSyncProgress(height, startHeight, endHeight, percentDone, message);
  }

  async onNewBlock(height) {
    for (let listener of this.wallet.getListeners()) await listener.onNewBlock(height);
  }

  async onBalancesChanged(newBalanceStr, newUnlockedBalanceStr) {
    for (let listener of this.wallet.getListeners()) await listener.onBalancesChanged(BigInt(newBalanceStr), BigInt(newUnlockedBalanceStr));
  }

  async onOutputReceived(height, txHash, amountStr, accountIdx, subaddressIdx, version, unlockTime, isLocked) {

    // build received output
    let output = new _MoneroOutputWallet.default();
    output.setAmount(BigInt(amountStr));
    output.setAccountIndex(accountIdx);
    output.setSubaddressIndex(subaddressIdx);
    let tx = new _MoneroTxWallet.default();
    tx.setHash(txHash);
    tx.setVersion(version);
    tx.setUnlockTime(unlockTime);
    output.setTx(tx);
    tx.setOutputs([output]);
    tx.setIsIncoming(true);
    tx.setIsLocked(isLocked);
    if (height > 0) {
      let block = new _MoneroBlock.default().setHeight(height);
      block.setTxs([tx]);
      tx.setBlock(block);
      tx.setIsConfirmed(true);
      tx.setInTxPool(false);
      tx.setIsFailed(false);
    } else {
      tx.setIsConfirmed(false);
      tx.setInTxPool(true);
    }

    // announce output
    for (let listener of this.wallet.getListeners()) await listener.onOutputReceived(tx.getOutputs()[0]);
  }

  async onOutputSpent(height, txHash, amountStr, accountIdxStr, subaddressIdxStr, version, unlockTime, isLocked) {

    // build spent output
    let output = new _MoneroOutputWallet.default();
    output.setAmount(BigInt(amountStr));
    if (accountIdxStr) output.setAccountIndex(parseInt(accountIdxStr));
    if (subaddressIdxStr) output.setSubaddressIndex(parseInt(subaddressIdxStr));
    let tx = new _MoneroTxWallet.default();
    tx.setHash(txHash);
    tx.setVersion(version);
    tx.setUnlockTime(unlockTime);
    tx.setIsLocked(isLocked);
    output.setTx(tx);
    tx.setInputs([output]);
    if (height > 0) {
      let block = new _MoneroBlock.default().setHeight(height);
      block.setTxs([tx]);
      tx.setBlock(block);
      tx.setIsConfirmed(true);
      tx.setInTxPool(false);
      tx.setIsFailed(false);
    } else {
      tx.setIsConfirmed(false);
      tx.setInTxPool(true);
    }

    // notify wallet listeners
    for (let listener of this.wallet.getListeners()) await listener.onOutputSpent(tx.getInputs()[0]);
  }
}

/**
 * Internal listener to bridge notifications to external listeners.
 * 
 * @private
 */
class WalletWorkerListener {




  constructor(listener) {
    this.id = _GenUtils.default.getUUID();
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

  async onNewBlock(height) {
    await this.listener.onNewBlock(height);
  }

  async onBalancesChanged(newBalanceStr, newUnlockedBalanceStr) {
    await this.listener.onBalancesChanged(BigInt(newBalanceStr), BigInt(newUnlockedBalanceStr));
  }

  async onOutputReceived(blockJson) {
    let block = new _MoneroBlock.default(blockJson, _MoneroBlock.default.DeserializationType.TX_WALLET);
    await this.listener.onOutputReceived(block.getTxs()[0].getOutputs()[0]);
  }

  async onOutputSpent(blockJson) {
    let block = new _MoneroBlock.default(blockJson, _MoneroBlock.default.DeserializationType.TX_WALLET);
    await this.listener.onOutputSpent(block.getTxs()[0].getInputs()[0]);
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfcGF0aCIsIl9HZW5VdGlscyIsIl9MaWJyYXJ5VXRpbHMiLCJfVGFza0xvb3BlciIsIl9Nb25lcm9BY2NvdW50IiwiX01vbmVyb0FjY291bnRUYWciLCJfTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSIsIl9Nb25lcm9CbG9jayIsIl9Nb25lcm9DaGVja1R4IiwiX01vbmVyb0NoZWNrUmVzZXJ2ZSIsIl9Nb25lcm9EYWVtb25ScGMiLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MiLCJfTW9uZXJvS2V5SW1hZ2UiLCJfTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQiLCJfTW9uZXJvTXVsdGlzaWdJbmZvIiwiX01vbmVyb011bHRpc2lnSW5pdFJlc3VsdCIsIl9Nb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQiLCJfTW9uZXJvTmV0d29ya1R5cGUiLCJfTW9uZXJvT3V0cHV0V2FsbGV0IiwiX01vbmVyb1JwY0Nvbm5lY3Rpb24iLCJfTW9uZXJvU3ViYWRkcmVzcyIsIl9Nb25lcm9TeW5jUmVzdWx0IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4U2V0IiwiX01vbmVyb1R4V2FsbGV0IiwiX01vbmVyb1dhbGxldCIsIl9Nb25lcm9XYWxsZXRDb25maWciLCJfTW9uZXJvV2FsbGV0S2V5cyIsIl9Nb25lcm9XYWxsZXRMaXN0ZW5lciIsIl9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIl9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0IiwiX2ZzIiwiTW9uZXJvV2FsbGV0RnVsbCIsIk1vbmVyb1dhbGxldEtleXMiLCJERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TIiwiY29uc3RydWN0b3IiLCJjcHBBZGRyZXNzIiwicGF0aCIsInBhc3N3b3JkIiwiZnMiLCJyZWplY3RVbmF1dGhvcml6ZWQiLCJyZWplY3RVbmF1dGhvcml6ZWRGbklkIiwid2FsbGV0UHJveHkiLCJsaXN0ZW5lcnMiLCJnZXRGcyIsInVuZGVmaW5lZCIsIl9pc0Nsb3NlZCIsImZ1bGxMaXN0ZW5lciIsIldhbGxldEZ1bGxMaXN0ZW5lciIsImZ1bGxMaXN0ZW5lckhhbmRsZSIsInJlamVjdFVuYXV0aG9yaXplZENvbmZpZ0lkIiwic3luY1BlcmlvZEluTXMiLCJMaWJyYXJ5VXRpbHMiLCJzZXRSZWplY3RVbmF1dGhvcml6ZWRGbiIsIndhbGxldEV4aXN0cyIsImFzc2VydCIsIk1vbmVyb0Vycm9yIiwiZXhpc3RzIiwiZXhpc3RzU3luYyIsImxvZyIsIm9wZW5XYWxsZXQiLCJjb25maWciLCJNb25lcm9XYWxsZXRDb25maWciLCJnZXRQcm94eVRvV29ya2VyIiwic2V0UHJveHlUb1dvcmtlciIsImdldFNlZWQiLCJnZXRTZWVkT2Zmc2V0IiwiZ2V0UHJpbWFyeUFkZHJlc3MiLCJnZXRQcml2YXRlVmlld0tleSIsImdldFByaXZhdGVTcGVuZEtleSIsImdldFJlc3RvcmVIZWlnaHQiLCJnZXRMYW5ndWFnZSIsImdldFNhdmVDdXJyZW50IiwiZ2V0S2V5c0RhdGEiLCJnZXRQYXRoIiwic2V0S2V5c0RhdGEiLCJyZWFkRmlsZVN5bmMiLCJzZXRDYWNoZURhdGEiLCJvcGVuV2FsbGV0RGF0YSIsImNyZWF0ZVdhbGxldCIsImdldE5ldHdvcmtUeXBlIiwiTW9uZXJvTmV0d29ya1R5cGUiLCJ2YWxpZGF0ZSIsInNldFBhdGgiLCJnZXRQYXNzd29yZCIsInNldFBhc3N3b3JkIiwiZ2V0Q29ubmVjdGlvbk1hbmFnZXIiLCJnZXRTZXJ2ZXIiLCJzZXRTZXJ2ZXIiLCJnZXRDb25uZWN0aW9uIiwid2FsbGV0IiwiTW9uZXJvV2FsbGV0RnVsbFByb3h5IiwiY3JlYXRlV2FsbGV0RnJvbVNlZWQiLCJjcmVhdGVXYWxsZXRGcm9tS2V5cyIsImNyZWF0ZVdhbGxldFJhbmRvbSIsInNldENvbm5lY3Rpb25NYW5hZ2VyIiwiZGFlbW9uQ29ubmVjdGlvbiIsImdldFJlamVjdFVuYXV0aG9yaXplZCIsInNldFJlc3RvcmVIZWlnaHQiLCJzZXRTZWVkT2Zmc2V0IiwibW9kdWxlIiwibG9hZEZ1bGxNb2R1bGUiLCJxdWV1ZVRhc2siLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsIkdlblV0aWxzIiwiZ2V0VVVJRCIsImNyZWF0ZV9mdWxsX3dhbGxldCIsIkpTT04iLCJzdHJpbmdpZnkiLCJ0b0pzb24iLCJzYXZlIiwic2V0UHJpbWFyeUFkZHJlc3MiLCJzZXRQcml2YXRlVmlld0tleSIsInNldFByaXZhdGVTcGVuZEtleSIsInNldExhbmd1YWdlIiwiZ2V0U2VlZExhbmd1YWdlcyIsInBhcnNlIiwiZ2V0X2tleXNfd2FsbGV0X3NlZWRfbGFuZ3VhZ2VzIiwibGFuZ3VhZ2VzIiwiRlMiLCJpc0Jyb3dzZXIiLCJnZXREYWVtb25NYXhQZWVySGVpZ2h0IiwiZ2V0V2FsbGV0UHJveHkiLCJhc3NlcnROb3RDbG9zZWQiLCJnZXRfZGFlbW9uX21heF9wZWVyX2hlaWdodCIsInJlc3AiLCJpc0RhZW1vblN5bmNlZCIsImlzX2RhZW1vbl9zeW5jZWQiLCJpc1N5bmNlZCIsImlzX3N5bmNlZCIsImdldF9uZXR3b3JrX3R5cGUiLCJnZXRfcmVzdG9yZV9oZWlnaHQiLCJyZXN0b3JlSGVpZ2h0Iiwic2V0X3Jlc3RvcmVfaGVpZ2h0IiwibW92ZVRvIiwiYWRkTGlzdGVuZXIiLCJsaXN0ZW5lciIsIk1vbmVyb1dhbGxldExpc3RlbmVyIiwicHVzaCIsInJlZnJlc2hMaXN0ZW5pbmciLCJyZW1vdmVMaXN0ZW5lciIsImlkeCIsImluZGV4T2YiLCJzcGxpY2UiLCJnZXRMaXN0ZW5lcnMiLCJzZXREYWVtb25Db25uZWN0aW9uIiwidXJpT3JDb25uZWN0aW9uIiwiY29ubmVjdGlvbiIsIk1vbmVyb1JwY0Nvbm5lY3Rpb24iLCJ1cmkiLCJnZXRVcmkiLCJ1c2VybmFtZSIsImdldFVzZXJuYW1lIiwic2V0X2RhZW1vbl9jb25uZWN0aW9uIiwiZ2V0RGFlbW9uQ29ubmVjdGlvbiIsImNvbm5lY3Rpb25Db250YWluZXJTdHIiLCJnZXRfZGFlbW9uX2Nvbm5lY3Rpb24iLCJqc29uQ29ubmVjdGlvbiIsImlzQ29ubmVjdGVkVG9EYWVtb24iLCJpc19jb25uZWN0ZWRfdG9fZGFlbW9uIiwiZ2V0VmVyc2lvbiIsImdldEludGVncmF0ZWRBZGRyZXNzIiwic3RhbmRhcmRBZGRyZXNzIiwicGF5bWVudElkIiwicmVzdWx0IiwiZ2V0X2ludGVncmF0ZWRfYWRkcmVzcyIsImNoYXJBdCIsIk1vbmVyb0ludGVncmF0ZWRBZGRyZXNzIiwiZXJyIiwibWVzc2FnZSIsImluY2x1ZGVzIiwiZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MiLCJpbnRlZ3JhdGVkQWRkcmVzcyIsImRlY29kZV9pbnRlZ3JhdGVkX2FkZHJlc3MiLCJnZXRIZWlnaHQiLCJnZXRfaGVpZ2h0IiwiZ2V0RGFlbW9uSGVpZ2h0IiwiZ2V0X2RhZW1vbl9oZWlnaHQiLCJnZXRIZWlnaHRCeURhdGUiLCJ5ZWFyIiwibW9udGgiLCJkYXkiLCJnZXRfaGVpZ2h0X2J5X2RhdGUiLCJzeW5jIiwibGlzdGVuZXJPclN0YXJ0SGVpZ2h0Iiwic3RhcnRIZWlnaHQiLCJhbGxvd0NvbmN1cnJlbnRDYWxscyIsIkVycm9yIiwiTWF0aCIsIm1heCIsInRoYXQiLCJzeW5jV2FzbSIsInJlc3BKc29uIiwiTW9uZXJvU3luY1Jlc3VsdCIsIm51bUJsb2Nrc0ZldGNoZWQiLCJyZWNlaXZlZE1vbmV5IiwiZSIsInN0YXJ0U3luY2luZyIsInN5bmNMb29wZXIiLCJUYXNrTG9vcGVyIiwiYmFja2dyb3VuZFN5bmMiLCJzdGFydCIsInN0b3BTeW5jaW5nIiwic3RvcCIsInN0b3Bfc3luY2luZyIsInNjYW5UeHMiLCJ0eEhhc2hlcyIsInNjYW5fdHhzIiwicmVzY2FuU3BlbnQiLCJyZXNjYW5fc3BlbnQiLCJyZXNjYW5CbG9ja2NoYWluIiwicmVzY2FuX2Jsb2NrY2hhaW4iLCJnZXRCYWxhbmNlIiwiYWNjb3VudElkeCIsInN1YmFkZHJlc3NJZHgiLCJiYWxhbmNlU3RyIiwiZ2V0X2JhbGFuY2Vfd2FsbGV0IiwiZ2V0X2JhbGFuY2VfYWNjb3VudCIsImdldF9iYWxhbmNlX3N1YmFkZHJlc3MiLCJCaWdJbnQiLCJzdHJpbmdpZnlCaWdJbnRzIiwiYmFsYW5jZSIsImdldFVubG9ja2VkQmFsYW5jZSIsInVubG9ja2VkQmFsYW5jZVN0ciIsImdldF91bmxvY2tlZF9iYWxhbmNlX3dhbGxldCIsImdldF91bmxvY2tlZF9iYWxhbmNlX2FjY291bnQiLCJnZXRfdW5sb2NrZWRfYmFsYW5jZV9zdWJhZGRyZXNzIiwidW5sb2NrZWRCYWxhbmNlIiwiZ2V0QWNjb3VudHMiLCJpbmNsdWRlU3ViYWRkcmVzc2VzIiwidGFnIiwiYWNjb3VudHNTdHIiLCJnZXRfYWNjb3VudHMiLCJhY2NvdW50cyIsImFjY291bnRKc29uIiwic2FuaXRpemVBY2NvdW50IiwiTW9uZXJvQWNjb3VudCIsImdldEFjY291bnQiLCJhY2NvdW50U3RyIiwiZ2V0X2FjY291bnQiLCJjcmVhdGVBY2NvdW50IiwibGFiZWwiLCJjcmVhdGVfYWNjb3VudCIsImdldFN1YmFkZHJlc3NlcyIsInN1YmFkZHJlc3NJbmRpY2VzIiwiYXJncyIsImxpc3RpZnkiLCJzdWJhZGRyZXNzZXNKc29uIiwiZ2V0X3N1YmFkZHJlc3NlcyIsInN1YmFkZHJlc3NlcyIsInN1YmFkZHJlc3NKc29uIiwic2FuaXRpemVTdWJhZGRyZXNzIiwiTW9uZXJvU3ViYWRkcmVzcyIsImNyZWF0ZVN1YmFkZHJlc3MiLCJzdWJhZGRyZXNzU3RyIiwiY3JlYXRlX3N1YmFkZHJlc3MiLCJzZXRTdWJhZGRyZXNzTGFiZWwiLCJzZXRfc3ViYWRkcmVzc19sYWJlbCIsImdldFR4cyIsInF1ZXJ5IiwicXVlcnlOb3JtYWxpemVkIiwiTW9uZXJvV2FsbGV0Iiwibm9ybWFsaXplVHhRdWVyeSIsImdldF90eHMiLCJnZXRCbG9jayIsImJsb2Nrc0pzb25TdHIiLCJkZXNlcmlhbGl6ZVR4cyIsImdldFRyYW5zZmVycyIsIm5vcm1hbGl6ZVRyYW5zZmVyUXVlcnkiLCJnZXRfdHJhbnNmZXJzIiwiZ2V0VHhRdWVyeSIsImRlc2VyaWFsaXplVHJhbnNmZXJzIiwiZ2V0T3V0cHV0cyIsIm5vcm1hbGl6ZU91dHB1dFF1ZXJ5IiwiZ2V0X291dHB1dHMiLCJkZXNlcmlhbGl6ZU91dHB1dHMiLCJleHBvcnRPdXRwdXRzIiwiYWxsIiwiZXhwb3J0X291dHB1dHMiLCJvdXRwdXRzSGV4IiwiaW1wb3J0T3V0cHV0cyIsImltcG9ydF9vdXRwdXRzIiwibnVtSW1wb3J0ZWQiLCJleHBvcnRLZXlJbWFnZXMiLCJleHBvcnRfa2V5X2ltYWdlcyIsImtleUltYWdlc1N0ciIsImtleUltYWdlcyIsImtleUltYWdlSnNvbiIsIk1vbmVyb0tleUltYWdlIiwiaW1wb3J0S2V5SW1hZ2VzIiwiaW1wb3J0X2tleV9pbWFnZXMiLCJtYXAiLCJrZXlJbWFnZSIsImtleUltYWdlSW1wb3J0UmVzdWx0U3RyIiwiTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQiLCJnZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCIsImZyZWV6ZU91dHB1dCIsImZyZWV6ZV9vdXRwdXQiLCJ0aGF3T3V0cHV0IiwidGhhd19vdXRwdXQiLCJpc091dHB1dEZyb3plbiIsImlzX291dHB1dF9mcm96ZW4iLCJjcmVhdGVUeHMiLCJjb25maWdOb3JtYWxpemVkIiwibm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnIiwiZ2V0Q2FuU3BsaXQiLCJzZXRDYW5TcGxpdCIsImNyZWF0ZV90eHMiLCJ0eFNldEpzb25TdHIiLCJNb25lcm9UeFNldCIsInN3ZWVwT3V0cHV0Iiwibm9ybWFsaXplU3dlZXBPdXRwdXRDb25maWciLCJzd2VlcF9vdXRwdXQiLCJzd2VlcFVubG9ja2VkIiwibm9ybWFsaXplU3dlZXBVbmxvY2tlZENvbmZpZyIsInN3ZWVwX3VubG9ja2VkIiwidHhTZXRzSnNvbiIsInR4U2V0cyIsInR4U2V0SnNvbiIsInR4cyIsInR4U2V0IiwidHgiLCJzd2VlcER1c3QiLCJyZWxheSIsInN3ZWVwX2R1c3QiLCJzZXRUeHMiLCJyZWxheVR4cyIsInR4c09yTWV0YWRhdGFzIiwiQXJyYXkiLCJpc0FycmF5IiwidHhNZXRhZGF0YXMiLCJ0eE9yTWV0YWRhdGEiLCJNb25lcm9UeFdhbGxldCIsImdldE1ldGFkYXRhIiwicmVsYXlfdHhzIiwidHhIYXNoZXNKc29uIiwiZGVzY3JpYmVUeFNldCIsInVuc2lnbmVkVHhIZXgiLCJnZXRVbnNpZ25lZFR4SGV4Iiwic2lnbmVkVHhIZXgiLCJnZXRTaWduZWRUeEhleCIsIm11bHRpc2lnVHhIZXgiLCJnZXRNdWx0aXNpZ1R4SGV4IiwiZGVzY3JpYmVfdHhfc2V0IiwiZ2V0X2V4Y2VwdGlvbl9tZXNzYWdlIiwic2lnblR4cyIsInNpZ25fdHhzIiwic3VibWl0VHhzIiwic3VibWl0X3R4cyIsInNpZ25NZXNzYWdlIiwic2lnbmF0dXJlVHlwZSIsIk1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIiwiU0lHTl9XSVRIX1NQRU5EX0tFWSIsInNpZ25fbWVzc2FnZSIsInZlcmlmeU1lc3NhZ2UiLCJhZGRyZXNzIiwic2lnbmF0dXJlIiwidmVyaWZ5X21lc3NhZ2UiLCJpc0dvb2QiLCJNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0IiwiaXNPbGQiLCJTSUdOX1dJVEhfVklFV19LRVkiLCJ2ZXJzaW9uIiwiZ2V0VHhLZXkiLCJ0eEhhc2giLCJnZXRfdHhfa2V5IiwiY2hlY2tUeEtleSIsInR4S2V5IiwiY2hlY2tfdHhfa2V5IiwicmVzcEpzb25TdHIiLCJNb25lcm9DaGVja1R4IiwiZ2V0VHhQcm9vZiIsImdldF90eF9wcm9vZiIsImVycm9yS2V5Iiwic3Vic3RyaW5nIiwibGVuZ3RoIiwiY2hlY2tUeFByb29mIiwiY2hlY2tfdHhfcHJvb2YiLCJnZXRTcGVuZFByb29mIiwiZ2V0X3NwZW5kX3Byb29mIiwiY2hlY2tTcGVuZFByb29mIiwiY2hlY2tfc3BlbmRfcHJvb2YiLCJnZXRSZXNlcnZlUHJvb2ZXYWxsZXQiLCJnZXRfcmVzZXJ2ZV9wcm9vZl93YWxsZXQiLCJnZXRSZXNlcnZlUHJvb2ZBY2NvdW50IiwiYW1vdW50IiwiZ2V0X3Jlc2VydmVfcHJvb2ZfYWNjb3VudCIsInRvU3RyaW5nIiwiY2hlY2tSZXNlcnZlUHJvb2YiLCJjaGVja19yZXNlcnZlX3Byb29mIiwiTW9uZXJvQ2hlY2tSZXNlcnZlIiwiZ2V0VHhOb3RlcyIsImdldF90eF9ub3RlcyIsInR4Tm90ZXMiLCJzZXRUeE5vdGVzIiwibm90ZXMiLCJzZXRfdHhfbm90ZXMiLCJnZXRBZGRyZXNzQm9va0VudHJpZXMiLCJlbnRyeUluZGljZXMiLCJlbnRyaWVzIiwiZW50cnlKc29uIiwiZ2V0X2FkZHJlc3NfYm9va19lbnRyaWVzIiwiTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSIsImFkZEFkZHJlc3NCb29rRW50cnkiLCJkZXNjcmlwdGlvbiIsImFkZF9hZGRyZXNzX2Jvb2tfZW50cnkiLCJlZGl0QWRkcmVzc0Jvb2tFbnRyeSIsImluZGV4Iiwic2V0QWRkcmVzcyIsInNldERlc2NyaXB0aW9uIiwiZWRpdF9hZGRyZXNzX2Jvb2tfZW50cnkiLCJkZWxldGVBZGRyZXNzQm9va0VudHJ5IiwiZW50cnlJZHgiLCJkZWxldGVfYWRkcmVzc19ib29rX2VudHJ5IiwidGFnQWNjb3VudHMiLCJhY2NvdW50SW5kaWNlcyIsInRhZ19hY2NvdW50cyIsInVudGFnQWNjb3VudHMiLCJnZXRBY2NvdW50VGFncyIsImFjY291bnRUYWdzIiwiYWNjb3VudFRhZ0pzb24iLCJnZXRfYWNjb3VudF90YWdzIiwiTW9uZXJvQWNjb3VudFRhZyIsInNldEFjY291bnRUYWdMYWJlbCIsInNldF9hY2NvdW50X3RhZ19sYWJlbCIsImdldFBheW1lbnRVcmkiLCJnZXRfcGF5bWVudF91cmkiLCJwYXJzZVBheW1lbnRVcmkiLCJNb25lcm9UeENvbmZpZyIsInBhcnNlX3BheW1lbnRfdXJpIiwiZ2V0QXR0cmlidXRlIiwia2V5IiwidmFsdWUiLCJnZXRfYXR0cmlidXRlIiwic2V0QXR0cmlidXRlIiwidmFsIiwic2V0X2F0dHJpYnV0ZSIsInN0YXJ0TWluaW5nIiwibnVtVGhyZWFkcyIsImJhY2tncm91bmRNaW5pbmciLCJpZ25vcmVCYXR0ZXJ5IiwiZGFlbW9uIiwiTW9uZXJvRGFlbW9uUnBjIiwiY29ubmVjdFRvRGFlbW9uUnBjIiwic3RvcE1pbmluZyIsImlzTXVsdGlzaWdJbXBvcnROZWVkZWQiLCJpc19tdWx0aXNpZ19pbXBvcnRfbmVlZGVkIiwiaXNNdWx0aXNpZyIsImlzX211bHRpc2lnIiwiZ2V0TXVsdGlzaWdJbmZvIiwiTW9uZXJvTXVsdGlzaWdJbmZvIiwiZ2V0X211bHRpc2lnX2luZm8iLCJwcmVwYXJlTXVsdGlzaWciLCJwcmVwYXJlX211bHRpc2lnIiwibWFrZU11bHRpc2lnIiwibXVsdGlzaWdIZXhlcyIsInRocmVzaG9sZCIsIm1ha2VfbXVsdGlzaWciLCJleGNoYW5nZU11bHRpc2lnS2V5cyIsImV4Y2hhbmdlX211bHRpc2lnX2tleXMiLCJNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQiLCJleHBvcnRNdWx0aXNpZ0hleCIsImV4cG9ydF9tdWx0aXNpZ19oZXgiLCJpbXBvcnRNdWx0aXNpZ0hleCIsImltcG9ydF9tdWx0aXNpZ19oZXgiLCJzaWduTXVsdGlzaWdUeEhleCIsInNpZ25fbXVsdGlzaWdfdHhfaGV4IiwiTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0Iiwic3VibWl0TXVsdGlzaWdUeEhleCIsInNpZ25lZE11bHRpc2lnVHhIZXgiLCJzdWJtaXRfbXVsdGlzaWdfdHhfaGV4IiwiZ2V0RGF0YSIsInZpZXdPbmx5IiwiaXNWaWV3T25seSIsInZpZXdzIiwiY2FjaGVCdWZmZXJMb2MiLCJnZXRfY2FjaGVfZmlsZV9idWZmZXIiLCJ2aWV3IiwiRGF0YVZpZXciLCJBcnJheUJ1ZmZlciIsImkiLCJzZXRJbnQ4IiwiSEVBUFU4IiwicG9pbnRlciIsIlVpbnQ4QXJyYXkiLCJCWVRFU19QRVJfRUxFTUVOVCIsIl9mcmVlIiwiQnVmZmVyIiwiZnJvbSIsImJ1ZmZlciIsImtleXNCdWZmZXJMb2MiLCJnZXRfa2V5c19maWxlX2J1ZmZlciIsInVuc2hpZnQiLCJjaGFuZ2VQYXNzd29yZCIsIm9sZFBhc3N3b3JkIiwibmV3UGFzc3dvcmQiLCJjaGFuZ2Vfd2FsbGV0X3Bhc3N3b3JkIiwiZXJyTXNnIiwiY2xvc2UiLCJnZXROdW1CbG9ja3NUb1VubG9jayIsImdldFR4IiwiZ2V0SW5jb21pbmdUcmFuc2ZlcnMiLCJnZXRPdXRnb2luZ1RyYW5zZmVycyIsImNyZWF0ZVR4IiwicmVsYXlUeCIsImdldFR4Tm90ZSIsInNldFR4Tm90ZSIsIm5vdGUiLCJwcm94eVRvV29ya2VyIiwibmV0d29ya1R5cGUiLCJkYWVtb25VcmkiLCJkYWVtb25Vc2VybmFtZSIsImRhZW1vblBhc3N3b3JkIiwib3Blbl93YWxsZXRfZnVsbCIsImtleXNEYXRhIiwiY2FjaGVEYXRhIiwiYnJvd3Nlck1haW5QYXRoIiwiY29uc29sZSIsImVycm9yIiwiaXNFbmFibGVkIiwic2V0X2xpc3RlbmVyIiwibmV3TGlzdGVuZXJIYW5kbGUiLCJoZWlnaHQiLCJlbmRIZWlnaHQiLCJwZXJjZW50RG9uZSIsIm9uU3luY1Byb2dyZXNzIiwib25OZXdCbG9jayIsIm5ld0JhbGFuY2VTdHIiLCJuZXdVbmxvY2tlZEJhbGFuY2VTdHIiLCJvbkJhbGFuY2VzQ2hhbmdlZCIsImFtb3VudFN0ciIsInVubG9ja1RpbWUiLCJpc0xvY2tlZCIsIm9uT3V0cHV0UmVjZWl2ZWQiLCJhY2NvdW50SWR4U3RyIiwic3ViYWRkcmVzc0lkeFN0ciIsIm9uT3V0cHV0U3BlbnQiLCJzYW5pdGl6ZUJsb2NrIiwiYmxvY2siLCJzYW5pdGl6ZVR4V2FsbGV0IiwiYWNjb3VudCIsInN1YmFkZHJlc3MiLCJkZXNlcmlhbGl6ZUJsb2NrcyIsImJsb2Nrc0pzb24iLCJkZXNlcmlhbGl6ZWRCbG9ja3MiLCJibG9ja3MiLCJibG9ja0pzb24iLCJNb25lcm9CbG9jayIsIkRlc2VyaWFsaXphdGlvblR5cGUiLCJUWF9XQUxMRVQiLCJzZXRCbG9jayIsImdldEhhc2hlcyIsInR4TWFwIiwiTWFwIiwiZ2V0SGFzaCIsInR4c1NvcnRlZCIsInRyYW5zZmVycyIsImdldE91dGdvaW5nVHJhbnNmZXIiLCJ0cmFuc2ZlciIsIm91dHB1dHMiLCJvdXRwdXQiLCJzZXRCcm93c2VyTWFpblBhdGgiLCJpc0Nsb3NlZCIsIlBhdGgiLCJub3JtYWxpemUiLCJ3YWxsZXREaXIiLCJkaXJuYW1lIiwibWtkaXJTeW5jIiwiZGF0YSIsIndyaXRlRmlsZVN5bmMiLCJvbGRQYXRoIiwidW5saW5rU3luYyIsInBhdGhOZXciLCJyZW5hbWVTeW5jIiwiZXhwb3J0cyIsImRlZmF1bHQiLCJNb25lcm9XYWxsZXRLZXlzUHJveHkiLCJ3YWxsZXRJZCIsImludm9rZVdvcmtlciIsImdldFdvcmtlciIsIndvcmtlciIsIndyYXBwZWRMaXN0ZW5lcnMiLCJhcmd1bWVudHMiLCJ1cmlPclJwY0Nvbm5lY3Rpb24iLCJnZXRDb25maWciLCJycGNDb25maWciLCJ3cmFwcGVkTGlzdGVuZXIiLCJXYWxsZXRXb3JrZXJMaXN0ZW5lciIsImxpc3RlbmVySWQiLCJnZXRJZCIsImFkZFdvcmtlckNhbGxiYWNrIiwiZ2V0TGlzdGVuZXIiLCJyZW1vdmVXb3JrZXJDYWxsYmFjayIsInJlc3VsdEpzb24iLCJibG9ja0pzb25zIiwia2V5SW1hZ2VzSnNvbiIsIk1vbmVyb091dHB1dFdhbGxldCIsInNldEFtb3VudCIsInNldEFjY291bnRJbmRleCIsInNldFN1YmFkZHJlc3NJbmRleCIsInNldEhhc2giLCJzZXRWZXJzaW9uIiwic2V0VW5sb2NrVGltZSIsInNldFR4Iiwic2V0T3V0cHV0cyIsInNldElzSW5jb21pbmciLCJzZXRJc0xvY2tlZCIsInNldEhlaWdodCIsInNldElzQ29uZmlybWVkIiwic2V0SW5UeFBvb2wiLCJzZXRJc0ZhaWxlZCIsInBhcnNlSW50Iiwic2V0SW5wdXRzIiwiZ2V0SW5wdXRzIiwiaWQiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy93YWxsZXQvTW9uZXJvV2FsbGV0RnVsbC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXNzZXJ0IGZyb20gXCJhc3NlcnRcIjtcbmltcG9ydCBQYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9HZW5VdGlsc1wiO1xuaW1wb3J0IExpYnJhcnlVdGlscyBmcm9tIFwiLi4vY29tbW9uL0xpYnJhcnlVdGlsc1wiO1xuaW1wb3J0IFRhc2tMb29wZXIgZnJvbSBcIi4uL2NvbW1vbi9UYXNrTG9vcGVyXCI7XG5pbXBvcnQgTW9uZXJvQWNjb3VudCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BY2NvdW50XCI7XG5pbXBvcnQgTW9uZXJvQWNjb3VudFRhZyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BY2NvdW50VGFnXCI7XG5pbXBvcnQgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BZGRyZXNzQm9va0VudHJ5XCI7XG5pbXBvcnQgTW9uZXJvQmxvY2sgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9CbG9ja1wiO1xuaW1wb3J0IE1vbmVyb0NoZWNrVHggZnJvbSBcIi4vbW9kZWwvTW9uZXJvQ2hlY2tUeFwiO1xuaW1wb3J0IE1vbmVyb0NoZWNrUmVzZXJ2ZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9DaGVja1Jlc2VydmVcIjtcbmltcG9ydCBNb25lcm9EYWVtb25ScGMgZnJvbSBcIi4uL2RhZW1vbi9Nb25lcm9EYWVtb25ScGNcIjtcbmltcG9ydCBNb25lcm9FcnJvciBmcm9tIFwiLi4vY29tbW9uL01vbmVyb0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvSW5jb21pbmdUcmFuc2ZlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9JbmNvbWluZ1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MgZnJvbSBcIi4vbW9kZWwvTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3NcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZSBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0tleUltYWdlXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ0luZm8gZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdJbmZvXCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnSW5pdFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnU2lnblJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHRcIjtcbmltcG9ydCBNb25lcm9OZXR3b3JrVHlwZSBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb05ldHdvcmtUeXBlXCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0UXVlcnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0UXVlcnlcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRXYWxsZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0V2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvUnBjQ29ubmVjdGlvbiBmcm9tIFwiLi4vY29tbW9uL01vbmVyb1JwY0Nvbm5lY3Rpb25cIjtcbmltcG9ydCBNb25lcm9TdWJhZGRyZXNzIGZyb20gXCIuL21vZGVsL01vbmVyb1N1YmFkZHJlc3NcIjtcbmltcG9ydCBNb25lcm9TeW5jUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb1N5bmNSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9UcmFuc2ZlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb1RyYW5zZmVyUXVlcnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHJhbnNmZXJRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb1R4Q29uZmlnIGZyb20gXCIuL21vZGVsL01vbmVyb1R4Q29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvVHhRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvVHhTZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhTZXRcIjtcbmltcG9ydCBNb25lcm9UeCBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb1R4XCI7XG5pbXBvcnQgTW9uZXJvVHhXYWxsZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhXYWxsZXRcIjtcbmltcG9ydCBNb25lcm9XYWxsZXQgZnJvbSBcIi4vTW9uZXJvV2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0Q29uZmlnIGZyb20gXCIuL21vZGVsL01vbmVyb1dhbGxldENvbmZpZ1wiO1xuaW1wb3J0IHsgTW9uZXJvV2FsbGV0S2V5cywgTW9uZXJvV2FsbGV0S2V5c1Byb3h5IH0gZnJvbSBcIi4vTW9uZXJvV2FsbGV0S2V5c1wiO1xuaW1wb3J0IE1vbmVyb1dhbGxldExpc3RlbmVyIGZyb20gXCIuL21vZGVsL01vbmVyb1dhbGxldExpc3RlbmVyXCI7XG5pbXBvcnQgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGVcIjtcbmltcG9ydCBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9WZXJzaW9uIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvVmVyc2lvblwiO1xuaW1wb3J0IGZzIGZyb20gXCJmc1wiO1xuXG4vKipcbiAqIEltcGxlbWVudHMgYSBNb25lcm8gd2FsbGV0IHVzaW5nIGNsaWVudC1zaWRlIFdlYkFzc2VtYmx5IGJpbmRpbmdzIHRvIG1vbmVyby1wcm9qZWN0J3Mgd2FsbGV0MiBpbiBDKysuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1vbmVyb1dhbGxldEZ1bGwgZXh0ZW5kcyBNb25lcm9XYWxsZXRLZXlzIHtcblxuICAvLyBzdGF0aWMgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBzdGF0aWMgcmVhZG9ubHkgREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyA9IDIwMDAwO1xuICBwcm90ZWN0ZWQgc3RhdGljIEZTO1xuXG4gIC8vIGluc3RhbmNlIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgcGF0aDogc3RyaW5nO1xuICBwcm90ZWN0ZWQgcGFzc3dvcmQ6IHN0cmluZztcbiAgcHJvdGVjdGVkIGxpc3RlbmVyczogTW9uZXJvV2FsbGV0TGlzdGVuZXJbXTtcbiAgcHJvdGVjdGVkIGZzOiBhbnk7XG4gIHByb3RlY3RlZCBmdWxsTGlzdGVuZXI6IFdhbGxldEZ1bGxMaXN0ZW5lcjtcbiAgcHJvdGVjdGVkIGZ1bGxMaXN0ZW5lckhhbmRsZTogbnVtYmVyO1xuICBwcm90ZWN0ZWQgcmVqZWN0VW5hdXRob3JpemVkOiBib29sZWFuO1xuICBwcm90ZWN0ZWQgcmVqZWN0VW5hdXRob3JpemVkQ29uZmlnSWQ6IHN0cmluZztcbiAgcHJvdGVjdGVkIHN5bmNQZXJpb2RJbk1zOiBudW1iZXI7XG4gIHByb3RlY3RlZCBzeW5jTG9vcGVyOiBUYXNrTG9vcGVyO1xuICBwcm90ZWN0ZWQgYnJvd3Nlck1haW5QYXRoOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEludGVybmFsIGNvbnN0cnVjdG9yIHdoaWNoIGlzIGdpdmVuIHRoZSBtZW1vcnkgYWRkcmVzcyBvZiBhIEMrKyB3YWxsZXQgaW5zdGFuY2UuXG4gICAqIFxuICAgKiBUaGlzIGNvbnN0cnVjdG9yIHNob3VsZCBiZSBjYWxsZWQgdGhyb3VnaCBzdGF0aWMgd2FsbGV0IGNyZWF0aW9uIHV0aWxpdGllcyBpbiB0aGlzIGNsYXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGNwcEFkZHJlc3MgLSBhZGRyZXNzIG9mIHRoZSB3YWxsZXQgaW5zdGFuY2UgaW4gQysrXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gcGF0aCBvZiB0aGUgd2FsbGV0IGluc3RhbmNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXNzd29yZCAtIHBhc3N3b3JkIG9mIHRoZSB3YWxsZXQgaW5zdGFuY2VcbiAgICogQHBhcmFtIHtGaWxlU3lzdGVtfSBmcyAtIG5vZGUuanMtY29tcGF0aWJsZSBmaWxlIHN5c3RlbSB0byByZWFkL3dyaXRlIHdhbGxldCBmaWxlc1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHJlamVjdFVuYXV0aG9yaXplZCAtIHNwZWNpZmllcyBpZiB1bmF1dGhvcml6ZWQgcmVxdWVzdHMgKGUuZy4gc2VsZi1zaWduZWQgY2VydGlmaWNhdGVzKSBzaG91bGQgYmUgcmVqZWN0ZWRcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJlamVjdFVuYXV0aG9yaXplZEZuSWQgLSB1bmlxdWUgaWRlbnRpZmllciBmb3IgaHR0cF9jbGllbnRfd2FzbSB0byBxdWVyeSByZWplY3RVbmF1dGhvcml6ZWRcbiAgICogQHBhcmFtIHtNb25lcm9XYWxsZXRGdWxsUHJveHl9IHdhbGxldFByb3h5IC0gcHJveHkgdG8gaW52b2tlIHdhbGxldCBvcGVyYXRpb25zIGluIGEgd2ViIHdvcmtlclxuICAgKiBcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGNvbnN0cnVjdG9yKGNwcEFkZHJlc3MsIHBhdGgsIHBhc3N3b3JkLCBmcywgcmVqZWN0VW5hdXRob3JpemVkLCByZWplY3RVbmF1dGhvcml6ZWRGbklkLCB3YWxsZXRQcm94eT86IE1vbmVyb1dhbGxldEZ1bGxQcm94eSkge1xuICAgIHN1cGVyKGNwcEFkZHJlc3MsIHdhbGxldFByb3h5KTtcbiAgICBpZiAod2FsbGV0UHJveHkpIHJldHVybjtcbiAgICB0aGlzLnBhdGggPSBwYXRoO1xuICAgIHRoaXMucGFzc3dvcmQgPSBwYXNzd29yZDtcbiAgICB0aGlzLmxpc3RlbmVycyA9IFtdO1xuICAgIHRoaXMuZnMgPSBmcyA/IGZzIDogKHBhdGggPyBNb25lcm9XYWxsZXRGdWxsLmdldEZzKCkgOiB1bmRlZmluZWQpO1xuICAgIHRoaXMuX2lzQ2xvc2VkID0gZmFsc2U7XG4gICAgdGhpcy5mdWxsTGlzdGVuZXIgPSBuZXcgV2FsbGV0RnVsbExpc3RlbmVyKHRoaXMpOyAvLyByZWNlaXZlcyBub3RpZmljYXRpb25zIGZyb20gd2FzbSBjKytcbiAgICB0aGlzLmZ1bGxMaXN0ZW5lckhhbmRsZSA9IDA7ICAgICAgICAgICAgICAgICAgICAgIC8vIG1lbW9yeSBhZGRyZXNzIG9mIHRoZSB3YWxsZXQgbGlzdGVuZXIgaW4gYysrXG4gICAgdGhpcy5yZWplY3RVbmF1dGhvcml6ZWQgPSByZWplY3RVbmF1dGhvcml6ZWQ7XG4gICAgdGhpcy5yZWplY3RVbmF1dGhvcml6ZWRDb25maWdJZCA9IHJlamVjdFVuYXV0aG9yaXplZEZuSWQ7XG4gICAgdGhpcy5zeW5jUGVyaW9kSW5NcyA9IE1vbmVyb1dhbGxldEZ1bGwuREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUztcbiAgICBMaWJyYXJ5VXRpbHMuc2V0UmVqZWN0VW5hdXRob3JpemVkRm4ocmVqZWN0VW5hdXRob3JpemVkRm5JZCwgKCkgPT4gdGhpcy5yZWplY3RVbmF1dGhvcml6ZWQpOyAvLyByZWdpc3RlciBmbiBpbmZvcm1pbmcgaWYgdW5hdXRob3JpemVkIHJlcXMgc2hvdWxkIGJlIHJlamVjdGVkXG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU1RBVElDIFVUSUxJVElFUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgLyoqXG4gICAqIENoZWNrIGlmIGEgd2FsbGV0IGV4aXN0cyBhdCBhIGdpdmVuIHBhdGguXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIHBhdGggb2YgdGhlIHdhbGxldCBvbiB0aGUgZmlsZSBzeXN0ZW1cbiAgICogQHBhcmFtIHtmc30gLSBOb2RlLmpzIGNvbXBhdGlibGUgZmlsZSBzeXN0ZW0gdG8gdXNlIChvcHRpb25hbCwgZGVmYXVsdHMgdG8gZGlzayBpZiBub2RlanMpXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgYSB3YWxsZXQgZXhpc3RzIGF0IHRoZSBnaXZlbiBwYXRoLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyB3YWxsZXRFeGlzdHMocGF0aCwgZnMpIHtcbiAgICBhc3NlcnQocGF0aCwgXCJNdXN0IHByb3ZpZGUgYSBwYXRoIHRvIGxvb2sgZm9yIGEgd2FsbGV0XCIpO1xuICAgIGlmICghZnMpIGZzID0gTW9uZXJvV2FsbGV0RnVsbC5nZXRGcygpO1xuICAgIGlmICghZnMpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBmaWxlIHN5c3RlbSB0byBjaGVjayBpZiB3YWxsZXQgZXhpc3RzXCIpO1xuICAgIGxldCBleGlzdHMgPSBmcy5leGlzdHNTeW5jKHBhdGggKyBcIi5rZXlzXCIpO1xuICAgIExpYnJhcnlVdGlscy5sb2coMSwgXCJXYWxsZXQgZXhpc3RzIGF0IFwiICsgcGF0aCArIFwiOiBcIiArIGV4aXN0cyk7XG4gICAgcmV0dXJuIGV4aXN0cztcbiAgfVxuICBcbiAgc3RhdGljIGFzeW5jIG9wZW5XYWxsZXQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pIHtcblxuICAgIC8vIHZhbGlkYXRlIGNvbmZpZ1xuICAgIGNvbmZpZyA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcoY29uZmlnKTtcbiAgICBpZiAoY29uZmlnLmdldFByb3h5VG9Xb3JrZXIoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UHJveHlUb1dvcmtlcih0cnVlKTtcbiAgICBpZiAoY29uZmlnLmdldFNlZWQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3BlY2lmeSBzZWVkIHdoZW4gb3BlbmluZyB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgc2VlZCBvZmZzZXQgd2hlbiBvcGVuaW5nIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFByaW1hcnlBZGRyZXNzKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgcHJpbWFyeSBhZGRyZXNzIHdoZW4gb3BlbmluZyB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQcml2YXRlVmlld0tleSgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHByaXZhdGUgdmlldyBrZXkgd2hlbiBvcGVuaW5nIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFByaXZhdGVTcGVuZEtleSgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHByaXZhdGUgc3BlbmQga2V5IHdoZW4gb3BlbmluZyB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgcmVzdG9yZSBoZWlnaHQgd2hlbiBvcGVuaW5nIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldExhbmd1YWdlKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgbGFuZ3VhZ2Ugd2hlbiBvcGVuaW5nIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFNhdmVDdXJyZW50KCkgPT09IHRydWUpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzYXZlIGN1cnJlbnQgd2FsbGV0IHdoZW4gb3BlbmluZyBmdWxsIHdhbGxldFwiKTtcblxuICAgIC8vIHJlYWQgd2FsbGV0IGRhdGEgZnJvbSBkaXNrIGlmIG5vdCBnaXZlblxuICAgIGlmICghY29uZmlnLmdldEtleXNEYXRhKCkpIHtcbiAgICAgIGxldCBmcyA9IGNvbmZpZy5nZXRGcygpID8gY29uZmlnLmdldEZzKCkgOiBNb25lcm9XYWxsZXRGdWxsLmdldEZzKCk7XG4gICAgICBpZiAoIWZzKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgZmlsZSBzeXN0ZW0gdG8gcmVhZCB3YWxsZXQgZGF0YSBmcm9tXCIpO1xuICAgICAgaWYgKCF0aGlzLndhbGxldEV4aXN0cyhjb25maWcuZ2V0UGF0aCgpLCBmcykpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBkb2VzIG5vdCBleGlzdCBhdCBwYXRoOiBcIiArIGNvbmZpZy5nZXRQYXRoKCkpO1xuICAgICAgY29uZmlnLnNldEtleXNEYXRhKGZzLnJlYWRGaWxlU3luYyhjb25maWcuZ2V0UGF0aCgpICsgXCIua2V5c1wiKSk7XG4gICAgICBjb25maWcuc2V0Q2FjaGVEYXRhKGZzLmV4aXN0c1N5bmMoY29uZmlnLmdldFBhdGgoKSkgPyBmcy5yZWFkRmlsZVN5bmMoY29uZmlnLmdldFBhdGgoKSkgOiBcIlwiKTtcbiAgICB9XG5cbiAgICAvLyBvcGVuIHdhbGxldCBmcm9tIGRhdGFcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5vcGVuV2FsbGV0RGF0YShjb25maWcpO1xuICB9XG4gIFxuICBzdGF0aWMgYXN5bmMgY3JlYXRlV2FsbGV0KGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKTogUHJvbWlzZTxNb25lcm9XYWxsZXRGdWxsPiB7XG5cbiAgICAvLyB2YWxpZGF0ZSBjb25maWdcbiAgICBpZiAoY29uZmlnID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBjb25maWcgdG8gY3JlYXRlIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFNlZWQoKSAhPT0gdW5kZWZpbmVkICYmIChjb25maWcuZ2V0UHJpbWFyeUFkZHJlc3MoKSAhPT0gdW5kZWZpbmVkIHx8IGNvbmZpZy5nZXRQcml2YXRlVmlld0tleSgpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldFByaXZhdGVTcGVuZEtleSgpICE9PSB1bmRlZmluZWQpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgbWF5IGJlIGluaXRpYWxpemVkIHdpdGggYSBzZWVkIG9yIGtleXMgYnV0IG5vdCBib3RoXCIpO1xuICAgIGlmIChjb25maWcuZ2V0TmV0d29ya1R5cGUoKSA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgYSBuZXR3b3JrVHlwZTogJ21haW5uZXQnLCAndGVzdG5ldCcgb3IgJ3N0YWdlbmV0J1wiKTtcbiAgICBNb25lcm9OZXR3b3JrVHlwZS52YWxpZGF0ZShjb25maWcuZ2V0TmV0d29ya1R5cGUoKSk7XG4gICAgaWYgKGNvbmZpZy5nZXRTYXZlQ3VycmVudCgpID09PSB0cnVlKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc2F2ZSBjdXJyZW50IHdhbGxldCB3aGVuIGNyZWF0aW5nIGZ1bGwgV0FTTSB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFBhdGgoXCJcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkgJiYgTW9uZXJvV2FsbGV0RnVsbC53YWxsZXRFeGlzdHMoY29uZmlnLmdldFBhdGgoKSwgY29uZmlnLmdldEZzKCkpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgYWxyZWFkeSBleGlzdHM6IFwiICsgY29uZmlnLmdldFBhdGgoKSk7XG4gICAgaWYgKGNvbmZpZy5nZXRQYXNzd29yZCgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRQYXNzd29yZChcIlwiKTtcblxuICAgIC8vIHNldCBzZXJ2ZXIgZnJvbSBjb25uZWN0aW9uIG1hbmFnZXIgaWYgcHJvdmlkZWRcbiAgICBpZiAoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpIHtcbiAgICAgIGlmIChjb25maWcuZ2V0U2VydmVyKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBjYW4gYmUgaW5pdGlhbGl6ZWQgd2l0aCBhIHNlcnZlciBvciBjb25uZWN0aW9uIG1hbmFnZXIgYnV0IG5vdCBib3RoXCIpO1xuICAgICAgY29uZmlnLnNldFNlcnZlcihjb25maWcuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKS5nZXRDb25uZWN0aW9uKCkpO1xuICAgIH1cblxuICAgIC8vIGNyZWF0ZSBwcm94aWVkIG9yIGxvY2FsIHdhbGxldFxuICAgIGxldCB3YWxsZXQ7XG4gICAgaWYgKGNvbmZpZy5nZXRQcm94eVRvV29ya2VyKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFByb3h5VG9Xb3JrZXIodHJ1ZSk7XG4gICAgaWYgKGNvbmZpZy5nZXRQcm94eVRvV29ya2VyKCkpIHtcbiAgICAgIGxldCB3YWxsZXRQcm94eSA9IGF3YWl0IE1vbmVyb1dhbGxldEZ1bGxQcm94eS5jcmVhdGVXYWxsZXQoY29uZmlnKTtcbiAgICAgIHdhbGxldCA9IG5ldyBNb25lcm9XYWxsZXRGdWxsKHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHdhbGxldFByb3h5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGNvbmZpZy5nZXRTZWVkKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAoY29uZmlnLmdldExhbmd1YWdlKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgbGFuZ3VhZ2Ugd2hlbiBjcmVhdGluZyB3YWxsZXQgZnJvbSBzZWVkXCIpO1xuICAgICAgICB3YWxsZXQgPSBhd2FpdCBNb25lcm9XYWxsZXRGdWxsLmNyZWF0ZVdhbGxldEZyb21TZWVkKGNvbmZpZyk7XG4gICAgICB9IGVsc2UgaWYgKGNvbmZpZy5nZXRQcml2YXRlU3BlbmRLZXkoKSAhPT0gdW5kZWZpbmVkIHx8IGNvbmZpZy5nZXRQcmltYXJ5QWRkcmVzcygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgc2VlZE9mZnNldCB3aGVuIGNyZWF0aW5nIHdhbGxldCBmcm9tIGtleXNcIik7XG4gICAgICAgIHdhbGxldCA9IGF3YWl0IE1vbmVyb1dhbGxldEZ1bGwuY3JlYXRlV2FsbGV0RnJvbUtleXMoY29uZmlnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChjb25maWcuZ2V0U2VlZE9mZnNldCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHNlZWRPZmZzZXQgd2hlbiBjcmVhdGluZyByYW5kb20gd2FsbGV0XCIpO1xuICAgICAgICBpZiAoY29uZmlnLmdldFJlc3RvcmVIZWlnaHQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSByZXN0b3JlSGVpZ2h0IHdoZW4gY3JlYXRpbmcgcmFuZG9tIHdhbGxldFwiKTtcbiAgICAgICAgd2FsbGV0ID0gYXdhaXQgTW9uZXJvV2FsbGV0RnVsbC5jcmVhdGVXYWxsZXRSYW5kb20oY29uZmlnKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gc2V0IHdhbGxldCdzIGNvbm5lY3Rpb24gbWFuYWdlclxuICAgIGF3YWl0IHdhbGxldC5zZXRDb25uZWN0aW9uTWFuYWdlcihjb25maWcuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSk7XG4gICAgcmV0dXJuIHdhbGxldDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBhc3luYyBjcmVhdGVXYWxsZXRGcm9tU2VlZChjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZyk6IFByb21pc2U8TW9uZXJvV2FsbGV0RnVsbD4ge1xuXG4gICAgLy8gdmFsaWRhdGUgYW5kIG5vcm1hbGl6ZSBwYXJhbXNcbiAgICBsZXQgZGFlbW9uQ29ubmVjdGlvbiA9IGNvbmZpZy5nZXRTZXJ2ZXIoKTtcbiAgICBsZXQgcmVqZWN0VW5hdXRob3JpemVkID0gZGFlbW9uQ29ubmVjdGlvbiA/IGRhZW1vbkNvbm5lY3Rpb24uZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkgOiB0cnVlO1xuICAgIGlmIChjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRSZXN0b3JlSGVpZ2h0KDApO1xuICAgIGlmIChjb25maWcuZ2V0U2VlZE9mZnNldCgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRTZWVkT2Zmc2V0KFwiXCIpO1xuICAgIFxuICAgIC8vIGxvYWQgZnVsbCB3YXNtIG1vZHVsZVxuICAgIGxldCBtb2R1bGUgPSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZEZ1bGxNb2R1bGUoKTtcbiAgICBcbiAgICAvLyBjcmVhdGUgd2FsbGV0IGluIHF1ZXVlXG4gICAgbGV0IHdhbGxldCA9IGF3YWl0IG1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAvLyByZWdpc3RlciBmbiBpbmZvcm1pbmcgaWYgdW5hdXRob3JpemVkIHJlcXMgc2hvdWxkIGJlIHJlamVjdGVkXG4gICAgICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWRGbklkID0gR2VuVXRpbHMuZ2V0VVVJRCgpO1xuICAgICAgICBMaWJyYXJ5VXRpbHMuc2V0UmVqZWN0VW5hdXRob3JpemVkRm4ocmVqZWN0VW5hdXRob3JpemVkRm5JZCwgKCkgPT4gcmVqZWN0VW5hdXRob3JpemVkKTtcbiAgICAgICAgXG4gICAgICAgIC8vIGNyZWF0ZSB3YWxsZXQgaW4gd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICBtb2R1bGUuY3JlYXRlX2Z1bGxfd2FsbGV0KEpTT04uc3RyaW5naWZ5KGNvbmZpZy50b0pzb24oKSksIHJlamVjdFVuYXV0aG9yaXplZEZuSWQsIGFzeW5jIChjcHBBZGRyZXNzKSA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBjcHBBZGRyZXNzID09PSBcInN0cmluZ1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKGNwcEFkZHJlc3MpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb1dhbGxldEZ1bGwoY3BwQWRkcmVzcywgY29uZmlnLmdldFBhdGgoKSwgY29uZmlnLmdldFBhc3N3b3JkKCksIGNvbmZpZy5nZXRGcygpLCBjb25maWcuZ2V0U2VydmVyKCkgPyBjb25maWcuZ2V0U2VydmVyKCkuZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkgOiB1bmRlZmluZWQsIHJlamVjdFVuYXV0aG9yaXplZEZuSWQpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBcbiAgICAvLyBzYXZlIHdhbGxldFxuICAgIGlmIChjb25maWcuZ2V0UGF0aCgpKSBhd2FpdCB3YWxsZXQuc2F2ZSgpO1xuICAgIHJldHVybiB3YWxsZXQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgY3JlYXRlV2FsbGV0RnJvbUtleXMoY29uZmlnOiBNb25lcm9XYWxsZXRDb25maWcpOiBQcm9taXNlPE1vbmVyb1dhbGxldEZ1bGw+IHtcblxuICAgIC8vIHZhbGlkYXRlIGFuZCBub3JtYWxpemUgcGFyYW1zXG4gICAgTW9uZXJvTmV0d29ya1R5cGUudmFsaWRhdGUoY29uZmlnLmdldE5ldHdvcmtUeXBlKCkpO1xuICAgIGlmIChjb25maWcuZ2V0UHJpbWFyeUFkZHJlc3MoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UHJpbWFyeUFkZHJlc3MoXCJcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQcml2YXRlVmlld0tleSgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRQcml2YXRlVmlld0tleShcIlwiKTtcbiAgICBpZiAoY29uZmlnLmdldFByaXZhdGVTcGVuZEtleSgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRQcml2YXRlU3BlbmRLZXkoXCJcIik7XG4gICAgbGV0IGRhZW1vbkNvbm5lY3Rpb24gPSBjb25maWcuZ2V0U2VydmVyKCk7XG4gICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZCA9IGRhZW1vbkNvbm5lY3Rpb24gPyBkYWVtb25Db25uZWN0aW9uLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdHJ1ZTtcbiAgICBpZiAoY29uZmlnLmdldFJlc3RvcmVIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UmVzdG9yZUhlaWdodCgwKTtcbiAgICBpZiAoY29uZmlnLmdldExhbmd1YWdlKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldExhbmd1YWdlKFwiRW5nbGlzaFwiKTtcbiAgICBcbiAgICAvLyBsb2FkIGZ1bGwgd2FzbSBtb2R1bGVcbiAgICBsZXQgbW9kdWxlID0gYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRGdWxsTW9kdWxlKCk7XG4gICAgXG4gICAgLy8gY3JlYXRlIHdhbGxldCBpbiBxdWV1ZVxuICAgIGxldCB3YWxsZXQgPSBhd2FpdCBtb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyByZWdpc3RlciBmbiBpbmZvcm1pbmcgaWYgdW5hdXRob3JpemVkIHJlcXMgc2hvdWxkIGJlIHJlamVjdGVkXG4gICAgICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWRGbklkID0gR2VuVXRpbHMuZ2V0VVVJRCgpO1xuICAgICAgICBMaWJyYXJ5VXRpbHMuc2V0UmVqZWN0VW5hdXRob3JpemVkRm4ocmVqZWN0VW5hdXRob3JpemVkRm5JZCwgKCkgPT4gcmVqZWN0VW5hdXRob3JpemVkKTtcbiAgICAgICAgXG4gICAgICAgIC8vIGNyZWF0ZSB3YWxsZXQgaW4gd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICBtb2R1bGUuY3JlYXRlX2Z1bGxfd2FsbGV0KEpTT04uc3RyaW5naWZ5KGNvbmZpZy50b0pzb24oKSksIHJlamVjdFVuYXV0aG9yaXplZEZuSWQsIGFzeW5jIChjcHBBZGRyZXNzKSA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBjcHBBZGRyZXNzID09PSBcInN0cmluZ1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKGNwcEFkZHJlc3MpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb1dhbGxldEZ1bGwoY3BwQWRkcmVzcywgY29uZmlnLmdldFBhdGgoKSwgY29uZmlnLmdldFBhc3N3b3JkKCksIGNvbmZpZy5nZXRGcygpLCBjb25maWcuZ2V0U2VydmVyKCkgPyBjb25maWcuZ2V0U2VydmVyKCkuZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkgOiB1bmRlZmluZWQsIHJlamVjdFVuYXV0aG9yaXplZEZuSWQpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBcbiAgICAvLyBzYXZlIHdhbGxldFxuICAgIGlmIChjb25maWcuZ2V0UGF0aCgpKSBhd2FpdCB3YWxsZXQuc2F2ZSgpO1xuICAgIHJldHVybiB3YWxsZXQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgY3JlYXRlV2FsbGV0UmFuZG9tKGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKTogUHJvbWlzZTxNb25lcm9XYWxsZXRGdWxsPiB7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgYW5kIG5vcm1hbGl6ZSBwYXJhbXNcbiAgICBpZiAoY29uZmlnLmdldExhbmd1YWdlKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldExhbmd1YWdlKFwiRW5nbGlzaFwiKTtcbiAgICBsZXQgZGFlbW9uQ29ubmVjdGlvbiA9IGNvbmZpZy5nZXRTZXJ2ZXIoKTtcbiAgICBsZXQgcmVqZWN0VW5hdXRob3JpemVkID0gZGFlbW9uQ29ubmVjdGlvbiA/IGRhZW1vbkNvbm5lY3Rpb24uZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkgOiB0cnVlO1xuICAgIFxuICAgIC8vIGxvYWQgd2FzbSBtb2R1bGVcbiAgICBsZXQgbW9kdWxlID0gYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRGdWxsTW9kdWxlKCk7XG4gICAgXG4gICAgLy8gY3JlYXRlIHdhbGxldCBpbiBxdWV1ZVxuICAgIGxldCB3YWxsZXQgPSBhd2FpdCBtb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyByZWdpc3RlciBmbiBpbmZvcm1pbmcgaWYgdW5hdXRob3JpemVkIHJlcXMgc2hvdWxkIGJlIHJlamVjdGVkXG4gICAgICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWRGbklkID0gR2VuVXRpbHMuZ2V0VVVJRCgpO1xuICAgICAgICBMaWJyYXJ5VXRpbHMuc2V0UmVqZWN0VW5hdXRob3JpemVkRm4ocmVqZWN0VW5hdXRob3JpemVkRm5JZCwgKCkgPT4gcmVqZWN0VW5hdXRob3JpemVkKTtcbiAgICAgIFxuICAgICAgICAvLyBjcmVhdGUgd2FsbGV0IGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgbW9kdWxlLmNyZWF0ZV9mdWxsX3dhbGxldChKU09OLnN0cmluZ2lmeShjb25maWcudG9Kc29uKCkpLCByZWplY3RVbmF1dGhvcml6ZWRGbklkLCBhc3luYyAoY3BwQWRkcmVzcykgPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgY3BwQWRkcmVzcyA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihjcHBBZGRyZXNzKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9XYWxsZXRGdWxsKGNwcEFkZHJlc3MsIGNvbmZpZy5nZXRQYXRoKCksIGNvbmZpZy5nZXRQYXNzd29yZCgpLCBjb25maWcuZ2V0RnMoKSwgY29uZmlnLmdldFNlcnZlcigpID8gY29uZmlnLmdldFNlcnZlcigpLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdW5kZWZpbmVkLCByZWplY3RVbmF1dGhvcml6ZWRGbklkKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgXG4gICAgLy8gc2F2ZSB3YWxsZXRcbiAgICBpZiAoY29uZmlnLmdldFBhdGgoKSkgYXdhaXQgd2FsbGV0LnNhdmUoKTtcbiAgICByZXR1cm4gd2FsbGV0O1xuICB9XG4gIFxuICBzdGF0aWMgYXN5bmMgZ2V0U2VlZExhbmd1YWdlcygpIHtcbiAgICBsZXQgbW9kdWxlID0gYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRGdWxsTW9kdWxlKCk7XG4gICAgcmV0dXJuIG1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgcmV0dXJuIEpTT04ucGFyc2UobW9kdWxlLmdldF9rZXlzX3dhbGxldF9zZWVkX2xhbmd1YWdlcygpKS5sYW5ndWFnZXM7XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgZ2V0RnMoKSB7XG4gICAgaWYgKCFNb25lcm9XYWxsZXRGdWxsLkZTKSBNb25lcm9XYWxsZXRGdWxsLkZTID0gR2VuVXRpbHMuaXNCcm93c2VyKCkgPyB1bmRlZmluZWQgOiBmcztcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5GUztcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tIFdBTExFVCBNRVRIT0RTIFNQRUNJRklDIFRPIFdBU00gSU1QTEVNRU5UQVRJT04gLS0tLS0tLS0tLS0tLS1cblxuICAvLyBUT0RPOiBtb3ZlIHRoZXNlIHRvIE1vbmVyb1dhbGxldC50cywgb3RoZXJzIGNhbiBiZSB1bnN1cHBvcnRlZFxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgbWF4aW11bSBoZWlnaHQgb2YgdGhlIHBlZXJzIHRoZSB3YWxsZXQncyBkYWVtb24gaXMgY29ubmVjdGVkIHRvLlxuICAgKlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlcj59IHRoZSBtYXhpbXVtIGhlaWdodCBvZiB0aGUgcGVlcnMgdGhlIHdhbGxldCdzIGRhZW1vbiBpcyBjb25uZWN0ZWQgdG9cbiAgICovXG4gIGFzeW5jIGdldERhZW1vbk1heFBlZXJIZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldERhZW1vbk1heFBlZXJIZWlnaHQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgXG4gICAgICAgIC8vIGNhbGwgd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfZGFlbW9uX21heF9wZWVyX2hlaWdodCh0aGlzLmNwcEFkZHJlc3MsIChyZXNwKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgd2FsbGV0J3MgZGFlbW9uIGlzIHN5bmNlZCB3aXRoIHRoZSBuZXR3b3JrLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiB0aGUgZGFlbW9uIGlzIHN5bmNlZCB3aXRoIHRoZSBuZXR3b3JrLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzRGFlbW9uU3luY2VkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaXNEYWVtb25TeW5jZWQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgXG4gICAgICAgIC8vIGNhbGwgd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICB0aGlzLm1vZHVsZS5pc19kYWVtb25fc3luY2VkKHRoaXMuY3BwQWRkcmVzcywgKHJlc3ApID0+IHtcbiAgICAgICAgICByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSB3YWxsZXQgaXMgc3luY2VkIHdpdGggdGhlIGRhZW1vbi5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgdGhlIHdhbGxldCBpcyBzeW5jZWQgd2l0aCB0aGUgZGFlbW9uLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzU3luY2VkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaXNTeW5jZWQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5pc19zeW5jZWQodGhpcy5jcHBBZGRyZXNzLCAocmVzcCkgPT4ge1xuICAgICAgICAgIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIG5ldHdvcmsgdHlwZSAobWFpbm5ldCwgdGVzdG5ldCwgb3Igc3RhZ2VuZXQpLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9OZXR3b3JrVHlwZT59IHRoZSB3YWxsZXQncyBuZXR3b3JrIHR5cGVcbiAgICovXG4gIGFzeW5jIGdldE5ldHdvcmtUeXBlKCk6IFByb21pc2U8TW9uZXJvTmV0d29ya1R5cGU+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldE5ldHdvcmtUeXBlKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLmdldF9uZXR3b3JrX3R5cGUodGhpcy5jcHBBZGRyZXNzKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgaGVpZ2h0IG9mIHRoZSBmaXJzdCBibG9jayB0aGF0IHRoZSB3YWxsZXQgc2NhbnMuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlcj59IHRoZSBoZWlnaHQgb2YgdGhlIGZpcnN0IGJsb2NrIHRoYXQgdGhlIHdhbGxldCBzY2Fuc1xuICAgKi9cbiAgYXN5bmMgZ2V0UmVzdG9yZUhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0UmVzdG9yZUhlaWdodCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5nZXRfcmVzdG9yZV9oZWlnaHQodGhpcy5jcHBBZGRyZXNzKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNldCB0aGUgaGVpZ2h0IG9mIHRoZSBmaXJzdCBibG9jayB0aGF0IHRoZSB3YWxsZXQgc2NhbnMuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gcmVzdG9yZUhlaWdodCAtIGhlaWdodCBvZiB0aGUgZmlyc3QgYmxvY2sgdGhhdCB0aGUgd2FsbGV0IHNjYW5zXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzZXRSZXN0b3JlSGVpZ2h0KHJlc3RvcmVIZWlnaHQ6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2V0UmVzdG9yZUhlaWdodChyZXN0b3JlSGVpZ2h0KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0aGlzLm1vZHVsZS5zZXRfcmVzdG9yZV9oZWlnaHQodGhpcy5jcHBBZGRyZXNzLCByZXN0b3JlSGVpZ2h0KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIE1vdmUgdGhlIHdhbGxldCBmcm9tIGl0cyBjdXJyZW50IHBhdGggdG8gdGhlIGdpdmVuIHBhdGguXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIHRoZSB3YWxsZXQncyBkZXN0aW5hdGlvbiBwYXRoXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBtb3ZlVG8ocGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5tb3ZlVG8ocGF0aCk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwubW92ZVRvKHBhdGgsIHRoaXMpO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBDT01NT04gV0FMTEVUIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgYXN5bmMgYWRkTGlzdGVuZXIobGlzdGVuZXI6IE1vbmVyb1dhbGxldExpc3RlbmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgYXNzZXJ0KGxpc3RlbmVyIGluc3RhbmNlb2YgTW9uZXJvV2FsbGV0TGlzdGVuZXIsIFwiTGlzdGVuZXIgbXVzdCBiZSBpbnN0YW5jZSBvZiBNb25lcm9XYWxsZXRMaXN0ZW5lclwiKTtcbiAgICB0aGlzLmxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBsZXQgaWR4ID0gdGhpcy5saXN0ZW5lcnMuaW5kZXhPZihsaXN0ZW5lcik7XG4gICAgaWYgKGlkeCA+IC0xKSB0aGlzLmxpc3RlbmVycy5zcGxpY2UoaWR4LCAxKTtcbiAgICBlbHNlIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkxpc3RlbmVyIGlzIG5vdCByZWdpc3RlcmVkIHdpdGggd2FsbGV0XCIpO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICB9XG4gIFxuICBnZXRMaXN0ZW5lcnMoKTogTW9uZXJvV2FsbGV0TGlzdGVuZXJbXSB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRMaXN0ZW5lcnMoKTtcbiAgICByZXR1cm4gdGhpcy5saXN0ZW5lcnM7XG4gIH1cbiAgXG4gIGFzeW5jIHNldERhZW1vbkNvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uPzogTW9uZXJvUnBjQ29ubmVjdGlvbiB8IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2V0RGFlbW9uQ29ubmVjdGlvbih1cmlPckNvbm5lY3Rpb24pO1xuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSBjb25uZWN0aW9uXG4gICAgbGV0IGNvbm5lY3Rpb24gPSAhdXJpT3JDb25uZWN0aW9uID8gdW5kZWZpbmVkIDogdXJpT3JDb25uZWN0aW9uIGluc3RhbmNlb2YgTW9uZXJvUnBjQ29ubmVjdGlvbiA/IHVyaU9yQ29ubmVjdGlvbiA6IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHVyaU9yQ29ubmVjdGlvbik7XG4gICAgbGV0IHVyaSA9IGNvbm5lY3Rpb24gJiYgY29ubmVjdGlvbi5nZXRVcmkoKSA/IGNvbm5lY3Rpb24uZ2V0VXJpKCkgOiBcIlwiO1xuICAgIGxldCB1c2VybmFtZSA9IGNvbm5lY3Rpb24gJiYgY29ubmVjdGlvbi5nZXRVc2VybmFtZSgpID8gY29ubmVjdGlvbi5nZXRVc2VybmFtZSgpIDogXCJcIjtcbiAgICBsZXQgcGFzc3dvcmQgPSBjb25uZWN0aW9uICYmIGNvbm5lY3Rpb24uZ2V0UGFzc3dvcmQoKSA/IGNvbm5lY3Rpb24uZ2V0UGFzc3dvcmQoKSA6IFwiXCI7XG4gICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZCA9IGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdW5kZWZpbmVkO1xuICAgIHRoaXMucmVqZWN0VW5hdXRob3JpemVkID0gcmVqZWN0VW5hdXRob3JpemVkOyAgLy8gcGVyc2lzdCBsb2NhbGx5XG4gICAgXG4gICAgLy8gc2V0IGNvbm5lY3Rpb24gaW4gcXVldWVcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5zZXRfZGFlbW9uX2Nvbm5lY3Rpb24odGhpcy5jcHBBZGRyZXNzLCB1cmksIHVzZXJuYW1lLCBwYXNzd29yZCwgKHJlc3ApID0+IHtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldERhZW1vbkNvbm5lY3Rpb24oKTogUHJvbWlzZTxNb25lcm9ScGNDb25uZWN0aW9uPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXREYWVtb25Db25uZWN0aW9uKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgbGV0IGNvbm5lY3Rpb25Db250YWluZXJTdHIgPSB0aGlzLm1vZHVsZS5nZXRfZGFlbW9uX2Nvbm5lY3Rpb24odGhpcy5jcHBBZGRyZXNzKTtcbiAgICAgICAgaWYgKCFjb25uZWN0aW9uQ29udGFpbmVyU3RyKSByZXNvbHZlKHVuZGVmaW5lZCk7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGxldCBqc29uQ29ubmVjdGlvbiA9IEpTT04ucGFyc2UoY29ubmVjdGlvbkNvbnRhaW5lclN0cik7XG4gICAgICAgICAgcmVzb2x2ZShuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih7dXJpOiBqc29uQ29ubmVjdGlvbi51cmksIHVzZXJuYW1lOiBqc29uQ29ubmVjdGlvbi51c2VybmFtZSwgcGFzc3dvcmQ6IGpzb25Db25uZWN0aW9uLnBhc3N3b3JkLCByZWplY3RVbmF1dGhvcml6ZWQ6IHRoaXMucmVqZWN0VW5hdXRob3JpemVkfSkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgaXNDb25uZWN0ZWRUb0RhZW1vbigpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmlzQ29ubmVjdGVkVG9EYWVtb24oKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5pc19jb25uZWN0ZWRfdG9fZGFlbW9uKHRoaXMuY3BwQWRkcmVzcywgKHJlc3ApID0+IHtcbiAgICAgICAgICByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRWZXJzaW9uKCk6IFByb21pc2U8TW9uZXJvVmVyc2lvbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0VmVyc2lvbigpO1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGF0aCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0UGF0aCgpO1xuICAgIHJldHVybiB0aGlzLnBhdGg7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEludGVncmF0ZWRBZGRyZXNzKHN0YW5kYXJkQWRkcmVzcz86IHN0cmluZywgcGF5bWVudElkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0SW50ZWdyYXRlZEFkZHJlc3Moc3RhbmRhcmRBZGRyZXNzLCBwYXltZW50SWQpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGxldCByZXN1bHQgPSB0aGlzLm1vZHVsZS5nZXRfaW50ZWdyYXRlZF9hZGRyZXNzKHRoaXMuY3BwQWRkcmVzcywgc3RhbmRhcmRBZGRyZXNzID8gc3RhbmRhcmRBZGRyZXNzIDogXCJcIiwgcGF5bWVudElkID8gcGF5bWVudElkIDogXCJcIik7XG4gICAgICAgIGlmIChyZXN1bHQuY2hhckF0KDApICE9PSBcIntcIikgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHJlc3VsdCk7XG4gICAgICAgIHJldHVybiBuZXcgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MoSlNPTi5wYXJzZShyZXN1bHQpKTtcbiAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgIGlmIChlcnIubWVzc2FnZS5pbmNsdWRlcyhcIkludmFsaWQgcGF5bWVudCBJRFwiKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiSW52YWxpZCBwYXltZW50IElEOiBcIiArIHBheW1lbnRJZCk7XG4gICAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihlcnIubWVzc2FnZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGRlY29kZUludGVncmF0ZWRBZGRyZXNzKGludGVncmF0ZWRBZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5kZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyhpbnRlZ3JhdGVkQWRkcmVzcyk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IHRoaXMubW9kdWxlLmRlY29kZV9pbnRlZ3JhdGVkX2FkZHJlc3ModGhpcy5jcHBBZGRyZXNzLCBpbnRlZ3JhdGVkQWRkcmVzcyk7XG4gICAgICAgIGlmIChyZXN1bHQuY2hhckF0KDApICE9PSBcIntcIikgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHJlc3VsdCk7XG4gICAgICAgIHJldHVybiBuZXcgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MoSlNPTi5wYXJzZShyZXN1bHQpKTtcbiAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihlcnIubWVzc2FnZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0SGVpZ2h0KCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X2hlaWdodCh0aGlzLmNwcEFkZHJlc3MsIChyZXNwKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RGFlbW9uSGVpZ2h0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXREYWVtb25IZWlnaHQoKTtcbiAgICBpZiAoIShhd2FpdCB0aGlzLmlzQ29ubmVjdGVkVG9EYWVtb24oKSkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBpcyBub3QgY29ubmVjdGVkIHRvIGRhZW1vblwiKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfZGFlbW9uX2hlaWdodCh0aGlzLmNwcEFkZHJlc3MsIChyZXNwKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0QnlEYXRlKHllYXI6IG51bWJlciwgbW9udGg6IG51bWJlciwgZGF5OiBudW1iZXIpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0SGVpZ2h0QnlEYXRlKHllYXIsIG1vbnRoLCBkYXkpO1xuICAgIGlmICghKGF3YWl0IHRoaXMuaXNDb25uZWN0ZWRUb0RhZW1vbigpKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGlzIG5vdCBjb25uZWN0ZWQgdG8gZGFlbW9uXCIpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmdldF9oZWlnaHRfYnlfZGF0ZSh0aGlzLmNwcEFkZHJlc3MsIHllYXIsIG1vbnRoLCBkYXksIChyZXNwKSA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiByZXNwID09PSBcInN0cmluZ1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTeW5jaHJvbml6ZSB0aGUgd2FsbGV0IHdpdGggdGhlIGRhZW1vbiBhcyBhIG9uZS10aW1lIHN5bmNocm9ub3VzIHByb2Nlc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1dhbGxldExpc3RlbmVyfG51bWJlcn0gW2xpc3RlbmVyT3JTdGFydEhlaWdodF0gLSBsaXN0ZW5lciB4b3Igc3RhcnQgaGVpZ2h0IChkZWZhdWx0cyB0byBubyBzeW5jIGxpc3RlbmVyLCB0aGUgbGFzdCBzeW5jZWQgYmxvY2spXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbc3RhcnRIZWlnaHRdIC0gc3RhcnRIZWlnaHQgaWYgbm90IGdpdmVuIGluIGZpcnN0IGFyZyAoZGVmYXVsdHMgdG8gbGFzdCBzeW5jZWQgYmxvY2spXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2FsbG93Q29uY3VycmVudENhbGxzXSAtIGFsbG93IG90aGVyIHdhbGxldCBtZXRob2RzIHRvIGJlIHByb2Nlc3NlZCBzaW11bHRhbmVvdXNseSBkdXJpbmcgc3luYyAoZGVmYXVsdCBmYWxzZSk8YnI+PGJyPjxiPldBUk5JTkc8L2I+OiBlbmFibGluZyB0aGlzIG9wdGlvbiB3aWxsIGNyYXNoIHdhbGxldCBleGVjdXRpb24gaWYgYW5vdGhlciBjYWxsIG1ha2VzIGEgc2ltdWx0YW5lb3VzIG5ldHdvcmsgcmVxdWVzdC4gVE9ETzogcG9zc2libGUgdG8gc3luYyB3YXNtIG5ldHdvcmsgcmVxdWVzdHMgaW4gaHR0cF9jbGllbnRfd2FzbS5jcHA/IFxuICAgKi9cbiAgYXN5bmMgc3luYyhsaXN0ZW5lck9yU3RhcnRIZWlnaHQ/OiBNb25lcm9XYWxsZXRMaXN0ZW5lciB8IG51bWJlciwgc3RhcnRIZWlnaHQ/OiBudW1iZXIsIGFsbG93Q29uY3VycmVudENhbGxzID0gZmFsc2UpOiBQcm9taXNlPE1vbmVyb1N5bmNSZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN5bmMobGlzdGVuZXJPclN0YXJ0SGVpZ2h0LCBzdGFydEhlaWdodCwgYWxsb3dDb25jdXJyZW50Q2FsbHMpO1xuICAgIGlmICghKGF3YWl0IHRoaXMuaXNDb25uZWN0ZWRUb0RhZW1vbigpKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGlzIG5vdCBjb25uZWN0ZWQgdG8gZGFlbW9uXCIpO1xuXG4gICAgaWYgKHRydWUpIHRocm93IG5ldyBFcnJvcihcIk15IHRlc3QgZXJyb3JcIik7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIHBhcmFtc1xuICAgIHN0YXJ0SGVpZ2h0ID0gbGlzdGVuZXJPclN0YXJ0SGVpZ2h0ID09PSB1bmRlZmluZWQgfHwgbGlzdGVuZXJPclN0YXJ0SGVpZ2h0IGluc3RhbmNlb2YgTW9uZXJvV2FsbGV0TGlzdGVuZXIgPyBzdGFydEhlaWdodCA6IGxpc3RlbmVyT3JTdGFydEhlaWdodDtcbiAgICBsZXQgbGlzdGVuZXIgPSBsaXN0ZW5lck9yU3RhcnRIZWlnaHQgaW5zdGFuY2VvZiBNb25lcm9XYWxsZXRMaXN0ZW5lciA/IGxpc3RlbmVyT3JTdGFydEhlaWdodCA6IHVuZGVmaW5lZDtcbiAgICBpZiAoc3RhcnRIZWlnaHQgPT09IHVuZGVmaW5lZCkgc3RhcnRIZWlnaHQgPSBNYXRoLm1heChhd2FpdCB0aGlzLmdldEhlaWdodCgpLCBhd2FpdCB0aGlzLmdldFJlc3RvcmVIZWlnaHQoKSk7XG4gICAgXG4gICAgLy8gcmVnaXN0ZXIgbGlzdGVuZXIgaWYgZ2l2ZW5cbiAgICBpZiAobGlzdGVuZXIpIGF3YWl0IHRoaXMuYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIFxuICAgIC8vIHN5bmMgd2FsbGV0XG4gICAgbGV0IGVycjtcbiAgICBsZXQgcmVzdWx0O1xuICAgIHRyeSB7XG4gICAgICBsZXQgdGhhdCA9IHRoaXM7XG4gICAgICByZXN1bHQgPSBhd2FpdCAoYWxsb3dDb25jdXJyZW50Q2FsbHMgPyBzeW5jV2FzbSgpIDogdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHN5bmNXYXNtKCkpKTtcbiAgICAgIGZ1bmN0aW9uIHN5bmNXYXNtKCkge1xuICAgICAgICB0aGF0LmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgICAvLyBzeW5jIHdhbGxldCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgICAgdGhhdC5tb2R1bGUuc3luYyh0aGF0LmNwcEFkZHJlc3MsIHN0YXJ0SGVpZ2h0LCBhc3luYyAocmVzcCkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc3AuY2hhckF0KDApICE9PSBcIntcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwKSk7XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgbGV0IHJlc3BKc29uID0gSlNPTi5wYXJzZShyZXNwKTtcbiAgICAgICAgICAgICAgcmVzb2x2ZShuZXcgTW9uZXJvU3luY1Jlc3VsdChyZXNwSnNvbi5udW1CbG9ja3NGZXRjaGVkLCByZXNwSnNvbi5yZWNlaXZlZE1vbmV5KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGVyciA9IGU7XG4gICAgfVxuICAgIFxuICAgIC8vIHVucmVnaXN0ZXIgbGlzdGVuZXJcbiAgICBpZiAobGlzdGVuZXIpIGF3YWl0IHRoaXMucmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIFxuICAgIC8vIHRocm93IGVycm9yIG9yIHJldHVyblxuICAgIGlmIChlcnIpIHRocm93IGVycjtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIFxuICBhc3luYyBzdGFydFN5bmNpbmcoc3luY1BlcmlvZEluTXM/OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN0YXJ0U3luY2luZyhzeW5jUGVyaW9kSW5Ncyk7XG4gICAgaWYgKCEoYXdhaXQgdGhpcy5pc0Nvbm5lY3RlZFRvRGFlbW9uKCkpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgaXMgbm90IGNvbm5lY3RlZCB0byBkYWVtb25cIik7XG4gICAgdGhpcy5zeW5jUGVyaW9kSW5NcyA9IHN5bmNQZXJpb2RJbk1zID09PSB1bmRlZmluZWQgPyBNb25lcm9XYWxsZXRGdWxsLkRFRkFVTFRfU1lOQ19QRVJJT0RfSU5fTVMgOiBzeW5jUGVyaW9kSW5NcztcbiAgICBpZiAoIXRoaXMuc3luY0xvb3BlcikgdGhpcy5zeW5jTG9vcGVyID0gbmV3IFRhc2tMb29wZXIoYXN5bmMgKCkgPT4gYXdhaXQgdGhpcy5iYWNrZ3JvdW5kU3luYygpKVxuICAgIHRoaXMuc3luY0xvb3Blci5zdGFydCh0aGlzLnN5bmNQZXJpb2RJbk1zKTtcbiAgfVxuICAgIFxuICBhc3luYyBzdG9wU3luY2luZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN0b3BTeW5jaW5nKCk7XG4gICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICBpZiAodGhpcy5zeW5jTG9vcGVyKSB0aGlzLnN5bmNMb29wZXIuc3RvcCgpO1xuICAgIHRoaXMubW9kdWxlLnN0b3Bfc3luY2luZyh0aGlzLmNwcEFkZHJlc3MpOyAvLyB0YXNrIGlzIG5vdCBxdWV1ZWQgc28gd2FsbGV0IHN0b3BzIGltbWVkaWF0ZWx5XG4gIH1cbiAgXG4gIGFzeW5jIHNjYW5UeHModHhIYXNoZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zY2FuVHhzKHR4SGFzaGVzKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5zY2FuX3R4cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHt0eEhhc2hlczogdHhIYXNoZXN9KSwgKGVycikgPT4ge1xuICAgICAgICAgIGlmIChlcnIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoZXJyKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2NhblNwZW50KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkucmVzY2FuU3BlbnQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5yZXNjYW5fc3BlbnQodGhpcy5jcHBBZGRyZXNzLCAoKSA9PiByZXNvbHZlKCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2NhbkJsb2NrY2hhaW4oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5yZXNjYW5CbG9ja2NoYWluKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUucmVzY2FuX2Jsb2NrY2hhaW4odGhpcy5jcHBBZGRyZXNzLCAoKSA9PiByZXNvbHZlKCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJhbGFuY2UoYWNjb3VudElkeD86IG51bWJlciwgc3ViYWRkcmVzc0lkeD86IG51bWJlcik6IFByb21pc2U8YmlnaW50PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRCYWxhbmNlKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIFxuICAgICAgLy8gZ2V0IGJhbGFuY2UgZW5jb2RlZCBpbiBqc29uIHN0cmluZ1xuICAgICAgbGV0IGJhbGFuY2VTdHI7XG4gICAgICBpZiAoYWNjb3VudElkeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGFzc2VydChzdWJhZGRyZXNzSWR4ID09PSB1bmRlZmluZWQsIFwiU3ViYWRkcmVzcyBpbmRleCBtdXN0IGJlIHVuZGVmaW5lZCBpZiBhY2NvdW50IGluZGV4IGlzIHVuZGVmaW5lZFwiKTtcbiAgICAgICAgYmFsYW5jZVN0ciA9IHRoaXMubW9kdWxlLmdldF9iYWxhbmNlX3dhbGxldCh0aGlzLmNwcEFkZHJlc3MpO1xuICAgICAgfSBlbHNlIGlmIChzdWJhZGRyZXNzSWR4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYmFsYW5jZVN0ciA9IHRoaXMubW9kdWxlLmdldF9iYWxhbmNlX2FjY291bnQodGhpcy5jcHBBZGRyZXNzLCBhY2NvdW50SWR4KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJhbGFuY2VTdHIgPSB0aGlzLm1vZHVsZS5nZXRfYmFsYW5jZV9zdWJhZGRyZXNzKHRoaXMuY3BwQWRkcmVzcywgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIHBhcnNlIGpzb24gc3RyaW5nIHRvIGJpZ2ludFxuICAgICAgcmV0dXJuIEJpZ0ludChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMoYmFsYW5jZVN0cikpLmJhbGFuY2UpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRVbmxvY2tlZEJhbGFuY2UoYWNjb3VudElkeD86IG51bWJlciwgc3ViYWRkcmVzc0lkeD86IG51bWJlcik6IFByb21pc2U8YmlnaW50PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRVbmxvY2tlZEJhbGFuY2UoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgXG4gICAgICAvLyBnZXQgYmFsYW5jZSBlbmNvZGVkIGluIGpzb24gc3RyaW5nXG4gICAgICBsZXQgdW5sb2NrZWRCYWxhbmNlU3RyO1xuICAgICAgaWYgKGFjY291bnRJZHggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBhc3NlcnQoc3ViYWRkcmVzc0lkeCA9PT0gdW5kZWZpbmVkLCBcIlN1YmFkZHJlc3MgaW5kZXggbXVzdCBiZSB1bmRlZmluZWQgaWYgYWNjb3VudCBpbmRleCBpcyB1bmRlZmluZWRcIik7XG4gICAgICAgIHVubG9ja2VkQmFsYW5jZVN0ciA9IHRoaXMubW9kdWxlLmdldF91bmxvY2tlZF9iYWxhbmNlX3dhbGxldCh0aGlzLmNwcEFkZHJlc3MpO1xuICAgICAgfSBlbHNlIGlmIChzdWJhZGRyZXNzSWR4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdW5sb2NrZWRCYWxhbmNlU3RyID0gdGhpcy5tb2R1bGUuZ2V0X3VubG9ja2VkX2JhbGFuY2VfYWNjb3VudCh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdW5sb2NrZWRCYWxhbmNlU3RyID0gdGhpcy5tb2R1bGUuZ2V0X3VubG9ja2VkX2JhbGFuY2Vfc3ViYWRkcmVzcyh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBwYXJzZSBqc29uIHN0cmluZyB0byBiaWdpbnRcbiAgICAgIHJldHVybiBCaWdJbnQoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHVubG9ja2VkQmFsYW5jZVN0cikpLnVubG9ja2VkQmFsYW5jZSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFjY291bnRzKGluY2x1ZGVTdWJhZGRyZXNzZXM/OiBib29sZWFuLCB0YWc/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0FjY291bnRbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0QWNjb3VudHMoaW5jbHVkZVN1YmFkZHJlc3NlcywgdGFnKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgYWNjb3VudHNTdHIgPSB0aGlzLm1vZHVsZS5nZXRfYWNjb3VudHModGhpcy5jcHBBZGRyZXNzLCBpbmNsdWRlU3ViYWRkcmVzc2VzID8gdHJ1ZSA6IGZhbHNlLCB0YWcgPyB0YWcgOiBcIlwiKTtcbiAgICAgIGxldCBhY2NvdW50cyA9IFtdO1xuICAgICAgZm9yIChsZXQgYWNjb3VudEpzb24gb2YgSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKGFjY291bnRzU3RyKSkuYWNjb3VudHMpIHtcbiAgICAgICAgYWNjb3VudHMucHVzaChNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplQWNjb3VudChuZXcgTW9uZXJvQWNjb3VudChhY2NvdW50SnNvbikpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhY2NvdW50cztcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudChhY2NvdW50SWR4OiBudW1iZXIsIGluY2x1ZGVTdWJhZGRyZXNzZXM/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9BY2NvdW50PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRBY2NvdW50KGFjY291bnRJZHgsIGluY2x1ZGVTdWJhZGRyZXNzZXMpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCBhY2NvdW50U3RyID0gdGhpcy5tb2R1bGUuZ2V0X2FjY291bnQodGhpcy5jcHBBZGRyZXNzLCBhY2NvdW50SWR4LCBpbmNsdWRlU3ViYWRkcmVzc2VzID8gdHJ1ZSA6IGZhbHNlKTtcbiAgICAgIGxldCBhY2NvdW50SnNvbiA9IEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhhY2NvdW50U3RyKSk7XG4gICAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZUFjY291bnQobmV3IE1vbmVyb0FjY291bnQoYWNjb3VudEpzb24pKTtcbiAgICB9KTtcblxuICB9XG4gIFxuICBhc3luYyBjcmVhdGVBY2NvdW50KGxhYmVsPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9BY2NvdW50PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jcmVhdGVBY2NvdW50KGxhYmVsKTtcbiAgICBpZiAobGFiZWwgPT09IHVuZGVmaW5lZCkgbGFiZWwgPSBcIlwiO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCBhY2NvdW50U3RyID0gdGhpcy5tb2R1bGUuY3JlYXRlX2FjY291bnQodGhpcy5jcHBBZGRyZXNzLCBsYWJlbCk7XG4gICAgICBsZXQgYWNjb3VudEpzb24gPSBKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMoYWNjb3VudFN0cikpO1xuICAgICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuc2FuaXRpemVBY2NvdW50KG5ldyBNb25lcm9BY2NvdW50KGFjY291bnRKc29uKSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJbmRpY2VzPzogbnVtYmVyW10pOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3NbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICBsZXQgYXJncyA9IHthY2NvdW50SWR4OiBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSW5kaWNlczogc3ViYWRkcmVzc0luZGljZXMgPT09IHVuZGVmaW5lZCA/IFtdIDogR2VuVXRpbHMubGlzdGlmeShzdWJhZGRyZXNzSW5kaWNlcyl9O1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCBzdWJhZGRyZXNzZXNKc29uID0gSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHRoaXMubW9kdWxlLmdldF9zdWJhZGRyZXNzZXModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeShhcmdzKSkpKS5zdWJhZGRyZXNzZXM7XG4gICAgICBsZXQgc3ViYWRkcmVzc2VzID0gW107XG4gICAgICBmb3IgKGxldCBzdWJhZGRyZXNzSnNvbiBvZiBzdWJhZGRyZXNzZXNKc29uKSBzdWJhZGRyZXNzZXMucHVzaChNb25lcm9XYWxsZXRLZXlzLnNhbml0aXplU3ViYWRkcmVzcyhuZXcgTW9uZXJvU3ViYWRkcmVzcyhzdWJhZGRyZXNzSnNvbikpKTtcbiAgICAgIHJldHVybiBzdWJhZGRyZXNzZXM7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNyZWF0ZVN1YmFkZHJlc3MoYWNjb3VudElkeDogbnVtYmVyLCBsYWJlbD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzcz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuY3JlYXRlU3ViYWRkcmVzcyhhY2NvdW50SWR4LCBsYWJlbCk7XG4gICAgaWYgKGxhYmVsID09PSB1bmRlZmluZWQpIGxhYmVsID0gXCJcIjtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgc3ViYWRkcmVzc1N0ciA9IHRoaXMubW9kdWxlLmNyZWF0ZV9zdWJhZGRyZXNzKHRoaXMuY3BwQWRkcmVzcywgYWNjb3VudElkeCwgbGFiZWwpO1xuICAgICAgbGV0IHN1YmFkZHJlc3NKc29uID0gSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHN1YmFkZHJlc3NTdHIpKTtcbiAgICAgIHJldHVybiBNb25lcm9XYWxsZXRLZXlzLnNhbml0aXplU3ViYWRkcmVzcyhuZXcgTW9uZXJvU3ViYWRkcmVzcyhzdWJhZGRyZXNzSnNvbikpO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgc2V0U3ViYWRkcmVzc0xhYmVsKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0lkeDogbnVtYmVyLCBsYWJlbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zZXRTdWJhZGRyZXNzTGFiZWwoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCwgbGFiZWwpO1xuICAgIGlmIChsYWJlbCA9PT0gdW5kZWZpbmVkKSBsYWJlbCA9IFwiXCI7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdGhpcy5tb2R1bGUuc2V0X3N1YmFkZHJlc3NfbGFiZWwodGhpcy5jcHBBZGRyZXNzLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4LCBsYWJlbCk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4cyhxdWVyeT86IHN0cmluZ1tdIHwgUGFydGlhbDxNb25lcm9UeFF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0VHhzKHF1ZXJ5KTtcblxuICAgIC8vIGNvcHkgYW5kIG5vcm1hbGl6ZSBxdWVyeSB1cCB0byBibG9ja1xuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZCA9IHF1ZXJ5ID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVR4UXVlcnkocXVlcnkpO1xuICAgIFxuICAgIC8vIHNjaGVkdWxlIHRhc2tcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgLy8gY2FsbCB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2tcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X3R4cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHF1ZXJ5Tm9ybWFsaXplZC5nZXRCbG9jaygpLnRvSnNvbigpKSwgKGJsb2Nrc0pzb25TdHIpID0+IHtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBjaGVjayBmb3IgZXJyb3JcbiAgICAgICAgICBpZiAoYmxvY2tzSnNvblN0ci5jaGFyQXQoMCkgIT09IFwie1wiKSB7XG4gICAgICAgICAgICByZWplY3QobmV3IE1vbmVyb0Vycm9yKGJsb2Nrc0pzb25TdHIpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gcmVzb2x2ZSB3aXRoIGRlc2VyaWFsaXplZCB0eHNcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzb2x2ZShNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplVHhzKHF1ZXJ5Tm9ybWFsaXplZCwgYmxvY2tzSnNvblN0cikpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRUcmFuc2ZlcnMocXVlcnk/OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KTogUHJvbWlzZTxNb25lcm9UcmFuc2ZlcltdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRUcmFuc2ZlcnMocXVlcnkpO1xuICAgIFxuICAgIC8vIGNvcHkgYW5kIG5vcm1hbGl6ZSBxdWVyeSB1cCB0byBibG9ja1xuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVUcmFuc2ZlclF1ZXJ5KHF1ZXJ5KTtcbiAgICBcbiAgICAvLyByZXR1cm4gcHJvbWlzZSB3aGljaCByZXNvbHZlcyBvbiBjYWxsYmFja1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyBjYWxsIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFja1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfdHJhbnNmZXJzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkocXVlcnlOb3JtYWxpemVkLmdldFR4UXVlcnkoKS5nZXRCbG9jaygpLnRvSnNvbigpKSwgKGJsb2Nrc0pzb25TdHIpID0+IHtcbiAgICAgICAgICAgIFxuICAgICAgICAgIC8vIGNoZWNrIGZvciBlcnJvclxuICAgICAgICAgIGlmIChibG9ja3NKc29uU3RyLmNoYXJBdCgwKSAhPT0gXCJ7XCIpIHtcbiAgICAgICAgICAgIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoYmxvY2tzSnNvblN0cikpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICAgXG4gICAgICAgICAgLy8gcmVzb2x2ZSB3aXRoIGRlc2VyaWFsaXplZCB0cmFuc2ZlcnMgXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlc29sdmUoTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZVRyYW5zZmVycyhxdWVyeU5vcm1hbGl6ZWQsIGJsb2Nrc0pzb25TdHIpKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0T3V0cHV0cyhxdWVyeT86IFBhcnRpYWw8TW9uZXJvT3V0cHV0UXVlcnk+KTogUHJvbWlzZTxNb25lcm9PdXRwdXRXYWxsZXRbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0T3V0cHV0cyhxdWVyeSk7XG4gICAgXG4gICAgLy8gY29weSBhbmQgbm9ybWFsaXplIHF1ZXJ5IHVwIHRvIGJsb2NrXG4gICAgY29uc3QgcXVlcnlOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZU91dHB1dFF1ZXJ5KHF1ZXJ5KTtcbiAgICBcbiAgICAvLyByZXR1cm4gcHJvbWlzZSB3aGljaCByZXNvbHZlcyBvbiBjYWxsYmFja1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PntcbiAgICAgICAgXG4gICAgICAgIC8vIGNhbGwgd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrXG4gICAgICAgIHRoaXMubW9kdWxlLmdldF9vdXRwdXRzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkocXVlcnlOb3JtYWxpemVkLmdldFR4UXVlcnkoKS5nZXRCbG9jaygpLnRvSnNvbigpKSwgKGJsb2Nrc0pzb25TdHIpID0+IHtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBjaGVjayBmb3IgZXJyb3JcbiAgICAgICAgICBpZiAoYmxvY2tzSnNvblN0ci5jaGFyQXQoMCkgIT09IFwie1wiKSB7XG4gICAgICAgICAgICByZWplY3QobmV3IE1vbmVyb0Vycm9yKGJsb2Nrc0pzb25TdHIpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gcmVzb2x2ZSB3aXRoIGRlc2VyaWFsaXplZCBvdXRwdXRzXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlc29sdmUoTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZU91dHB1dHMocXVlcnlOb3JtYWxpemVkLCBibG9ja3NKc29uU3RyKSk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydE91dHB1dHMoYWxsID0gZmFsc2UpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZXhwb3J0T3V0cHV0cyhhbGwpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmV4cG9ydF9vdXRwdXRzKHRoaXMuY3BwQWRkcmVzcywgYWxsLCAob3V0cHV0c0hleCkgPT4gcmVzb2x2ZShvdXRwdXRzSGV4KSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgaW1wb3J0T3V0cHV0cyhvdXRwdXRzSGV4OiBzdHJpbmcpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaW1wb3J0T3V0cHV0cyhvdXRwdXRzSGV4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5pbXBvcnRfb3V0cHV0cyh0aGlzLmNwcEFkZHJlc3MsIG91dHB1dHNIZXgsIChudW1JbXBvcnRlZCkgPT4gcmVzb2x2ZShudW1JbXBvcnRlZCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydEtleUltYWdlcyhhbGwgPSBmYWxzZSk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZXhwb3J0S2V5SW1hZ2VzKGFsbCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZXhwb3J0X2tleV9pbWFnZXModGhpcy5jcHBBZGRyZXNzLCBhbGwsIChrZXlJbWFnZXNTdHIpID0+IHtcbiAgICAgICAgICBpZiAoa2V5SW1hZ2VzU3RyLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKGtleUltYWdlc1N0cikpOyAvLyBqc29uIGV4cGVjdGVkLCBlbHNlIGVycm9yXG4gICAgICAgICAgbGV0IGtleUltYWdlcyA9IFtdO1xuICAgICAgICAgIGZvciAobGV0IGtleUltYWdlSnNvbiBvZiBKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMoa2V5SW1hZ2VzU3RyKSkua2V5SW1hZ2VzKSBrZXlJbWFnZXMucHVzaChuZXcgTW9uZXJvS2V5SW1hZ2Uoa2V5SW1hZ2VKc29uKSk7XG4gICAgICAgICAgcmVzb2x2ZShrZXlJbWFnZXMpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRLZXlJbWFnZXMoa2V5SW1hZ2VzOiBNb25lcm9LZXlJbWFnZVtdKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaW1wb3J0S2V5SW1hZ2VzKGtleUltYWdlcyk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuaW1wb3J0X2tleV9pbWFnZXModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7a2V5SW1hZ2VzOiBrZXlJbWFnZXMubWFwKGtleUltYWdlID0+IGtleUltYWdlLnRvSnNvbigpKX0pLCAoa2V5SW1hZ2VJbXBvcnRSZXN1bHRTdHIpID0+IHtcbiAgICAgICAgICByZXNvbHZlKG5ldyBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMoa2V5SW1hZ2VJbXBvcnRSZXN1bHRTdHIpKSkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCgpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlW10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0KCk7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBmcmVlemVPdXRwdXQoa2V5SW1hZ2U6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZnJlZXplT3V0cHV0KGtleUltYWdlKTtcbiAgICBpZiAoIWtleUltYWdlKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHNwZWNpZnkga2V5IGltYWdlIHRvIGZyZWV6ZVwiKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5mcmVlemVfb3V0cHV0KHRoaXMuY3BwQWRkcmVzcywga2V5SW1hZ2UsICgpID0+IHJlc29sdmUoKSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgdGhhd091dHB1dChrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS50aGF3T3V0cHV0KGtleUltYWdlKTtcbiAgICBpZiAoIWtleUltYWdlKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHNwZWNpZnkga2V5IGltYWdlIHRvIHRoYXdcIik7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUudGhhd19vdXRwdXQodGhpcy5jcHBBZGRyZXNzLCBrZXlJbWFnZSwgKCkgPT4gcmVzb2x2ZSgpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBpc091dHB1dEZyb3plbihrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pc091dHB1dEZyb3plbihrZXlJbWFnZSk7XG4gICAgaWYgKCFrZXlJbWFnZSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBzcGVjaWZ5IGtleSBpbWFnZSB0byBjaGVjayBpZiBmcm96ZW5cIik7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuaXNfb3V0cHV0X2Zyb3plbih0aGlzLmNwcEFkZHJlc3MsIGtleUltYWdlLCAocmVzdWx0KSA9PiByZXNvbHZlKHJlc3VsdCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNyZWF0ZVR4cyhjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jcmVhdGVUeHMoY29uZmlnKTtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSwgY29weSwgYW5kIG5vcm1hbGl6ZSBjb25maWdcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyhjb25maWcpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnTm9ybWFsaXplZC5zZXRDYW5TcGxpdCh0cnVlKTtcbiAgICBcbiAgICAvLyBjcmVhdGUgdHhzIGluIHF1ZXVlXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIGNyZWF0ZSB0eHMgaW4gd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICB0aGlzLm1vZHVsZS5jcmVhdGVfdHhzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoY29uZmlnTm9ybWFsaXplZC50b0pzb24oKSksICh0eFNldEpzb25TdHIpID0+IHtcbiAgICAgICAgICBpZiAodHhTZXRKc29uU3RyLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHR4U2V0SnNvblN0cikpOyAvLyBqc29uIGV4cGVjdGVkLCBlbHNlIGVycm9yXG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9UeFNldChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHModHhTZXRKc29uU3RyKSkpLmdldFR4cygpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBPdXRwdXQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN3ZWVwT3V0cHV0KGNvbmZpZyk7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIGFuZCB2YWxpZGF0ZSBjb25maWdcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVN3ZWVwT3V0cHV0Q29uZmlnKGNvbmZpZyk7XG4gICAgXG4gICAgLy8gc3dlZXAgb3V0cHV0IGluIHF1ZXVlXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIHN3ZWVwIG91dHB1dCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIHRoaXMubW9kdWxlLnN3ZWVwX291dHB1dCh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KGNvbmZpZ05vcm1hbGl6ZWQudG9Kc29uKCkpLCAodHhTZXRKc29uU3RyKSA9PiB7XG4gICAgICAgICAgaWYgKHR4U2V0SnNvblN0ci5jaGFyQXQoMCkgIT09ICd7JykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcih0eFNldEpzb25TdHIpKTsgLy8ganNvbiBleHBlY3RlZCwgZWxzZSBlcnJvclxuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvVHhTZXQoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHR4U2V0SnNvblN0cikpKS5nZXRUeHMoKVswXSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBzd2VlcFVubG9ja2VkKGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN3ZWVwVW5sb2NrZWQoY29uZmlnKTtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSBhbmQgbm9ybWFsaXplIGNvbmZpZ1xuICAgIGNvbnN0IGNvbmZpZ05vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplU3dlZXBVbmxvY2tlZENvbmZpZyhjb25maWcpO1xuICAgIFxuICAgIC8vIHN3ZWVwIHVubG9ja2VkIGluIHF1ZXVlXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIHN3ZWVwIHVubG9ja2VkIGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgdGhpcy5tb2R1bGUuc3dlZXBfdW5sb2NrZWQodGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeShjb25maWdOb3JtYWxpemVkLnRvSnNvbigpKSwgKHR4U2V0c0pzb24pID0+IHtcbiAgICAgICAgICBpZiAodHhTZXRzSnNvbi5jaGFyQXQoMCkgIT09ICd7JykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcih0eFNldHNKc29uKSk7IC8vIGpzb24gZXhwZWN0ZWQsIGVsc2UgZXJyb3JcbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGxldCB0eFNldHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAobGV0IHR4U2V0SnNvbiBvZiBKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHModHhTZXRzSnNvbikpLnR4U2V0cykgdHhTZXRzLnB1c2gobmV3IE1vbmVyb1R4U2V0KHR4U2V0SnNvbikpO1xuICAgICAgICAgICAgbGV0IHR4cyA9IFtdO1xuICAgICAgICAgICAgZm9yIChsZXQgdHhTZXQgb2YgdHhTZXRzKSBmb3IgKGxldCB0eCBvZiB0eFNldC5nZXRUeHMoKSkgdHhzLnB1c2godHgpO1xuICAgICAgICAgICAgcmVzb2x2ZSh0eHMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBEdXN0KHJlbGF5PzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3dlZXBEdXN0KHJlbGF5KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgLy8gY2FsbCB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIHRoaXMubW9kdWxlLnN3ZWVwX2R1c3QodGhpcy5jcHBBZGRyZXNzLCByZWxheSwgKHR4U2V0SnNvblN0cikgPT4ge1xuICAgICAgICAgIGlmICh0eFNldEpzb25TdHIuY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IodHhTZXRKc29uU3RyKSk7IC8vIGpzb24gZXhwZWN0ZWQsIGVsc2UgZXJyb3JcbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGxldCB0eFNldCA9IG5ldyBNb25lcm9UeFNldChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHModHhTZXRKc29uU3RyKSkpO1xuICAgICAgICAgICAgaWYgKHR4U2V0LmdldFR4cygpID09PSB1bmRlZmluZWQpIHR4U2V0LnNldFR4cyhbXSk7XG4gICAgICAgICAgICByZXNvbHZlKHR4U2V0LmdldFR4cygpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbGF5VHhzKHR4c09yTWV0YWRhdGFzOiAoTW9uZXJvVHhXYWxsZXQgfCBzdHJpbmcpW10pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5yZWxheVR4cyh0eHNPck1ldGFkYXRhcyk7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkodHhzT3JNZXRhZGF0YXMpLCBcIk11c3QgcHJvdmlkZSBhbiBhcnJheSBvZiB0eHMgb3IgdGhlaXIgbWV0YWRhdGEgdG8gcmVsYXlcIik7XG4gICAgbGV0IHR4TWV0YWRhdGFzID0gW107XG4gICAgZm9yIChsZXQgdHhPck1ldGFkYXRhIG9mIHR4c09yTWV0YWRhdGFzKSB0eE1ldGFkYXRhcy5wdXNoKHR4T3JNZXRhZGF0YSBpbnN0YW5jZW9mIE1vbmVyb1R4V2FsbGV0ID8gdHhPck1ldGFkYXRhLmdldE1ldGFkYXRhKCkgOiB0eE9yTWV0YWRhdGEpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnJlbGF5X3R4cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHt0eE1ldGFkYXRhczogdHhNZXRhZGF0YXN9KSwgKHR4SGFzaGVzSnNvbikgPT4ge1xuICAgICAgICAgIGlmICh0eEhhc2hlc0pzb24uY2hhckF0KDApICE9PSBcIntcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcih0eEhhc2hlc0pzb24pKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoSlNPTi5wYXJzZSh0eEhhc2hlc0pzb24pLnR4SGFzaGVzKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZGVzY3JpYmVUeFNldCh0eFNldDogTW9uZXJvVHhTZXQpOiBQcm9taXNlPE1vbmVyb1R4U2V0PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5kZXNjcmliZVR4U2V0KHR4U2V0KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0eFNldCA9IG5ldyBNb25lcm9UeFNldCh7dW5zaWduZWRUeEhleDogdHhTZXQuZ2V0VW5zaWduZWRUeEhleCgpLCBzaWduZWRUeEhleDogdHhTZXQuZ2V0U2lnbmVkVHhIZXgoKSwgbXVsdGlzaWdUeEhleDogdHhTZXQuZ2V0TXVsdGlzaWdUeEhleCgpfSk7XG4gICAgICB0cnkgeyByZXR1cm4gbmV3IE1vbmVyb1R4U2V0KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyh0aGlzLm1vZHVsZS5kZXNjcmliZV90eF9zZXQodGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh0eFNldC50b0pzb24oKSkpKSkpOyB9XG4gICAgICBjYXRjaCAoZXJyKSB7IHRocm93IG5ldyBNb25lcm9FcnJvcih0aGlzLm1vZHVsZS5nZXRfZXhjZXB0aW9uX21lc3NhZ2UoZXJyKSk7IH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc2lnblR4cyh1bnNpZ25lZFR4SGV4OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2lnblR4cyh1bnNpZ25lZFR4SGV4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkgeyByZXR1cm4gdGhpcy5tb2R1bGUuc2lnbl90eHModGhpcy5jcHBBZGRyZXNzLCB1bnNpZ25lZFR4SGV4KTsgfVxuICAgICAgY2F0Y2ggKGVycikgeyB0aHJvdyBuZXcgTW9uZXJvRXJyb3IodGhpcy5tb2R1bGUuZ2V0X2V4Y2VwdGlvbl9tZXNzYWdlKGVycikpOyB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdFR4cyhzaWduZWRUeEhleDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3VibWl0VHhzKHNpZ25lZFR4SGV4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5zdWJtaXRfdHhzKHRoaXMuY3BwQWRkcmVzcywgc2lnbmVkVHhIZXgsIChyZXNwKSA9PiB7XG4gICAgICAgICAgaWYgKHJlc3AuY2hhckF0KDApICE9PSBcIntcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKEpTT04ucGFyc2UocmVzcCkudHhIYXNoZXMpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzaWduTWVzc2FnZShtZXNzYWdlOiBzdHJpbmcsIHNpZ25hdHVyZVR5cGUgPSBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfU1BFTkRfS0VZLCBhY2NvdW50SWR4ID0gMCwgc3ViYWRkcmVzc0lkeCA9IDApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2lnbk1lc3NhZ2UobWVzc2FnZSwgc2lnbmF0dXJlVHlwZSwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG4gICAgXG4gICAgLy8gYXNzaWduIGRlZmF1bHRzXG4gICAgc2lnbmF0dXJlVHlwZSA9IHNpZ25hdHVyZVR5cGUgfHwgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWTtcbiAgICBhY2NvdW50SWR4ID0gYWNjb3VudElkeCB8fCAwO1xuICAgIHN1YmFkZHJlc3NJZHggPSBzdWJhZGRyZXNzSWR4IHx8IDA7XG4gICAgXG4gICAgLy8gcXVldWUgdGFzayB0byBzaWduIG1lc3NhZ2VcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkgeyByZXR1cm4gdGhpcy5tb2R1bGUuc2lnbl9tZXNzYWdlKHRoaXMuY3BwQWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlVHlwZSA9PT0gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSA/IDAgOiAxLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTsgfVxuICAgICAgY2F0Y2ggKGVycikgeyB0aHJvdyBuZXcgTW9uZXJvRXJyb3IodGhpcy5tb2R1bGUuZ2V0X2V4Y2VwdGlvbl9tZXNzYWdlKGVycikpOyB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHZlcmlmeU1lc3NhZ2UobWVzc2FnZTogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS52ZXJpZnlNZXNzYWdlKG1lc3NhZ2UsIGFkZHJlc3MsIHNpZ25hdHVyZSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IHJlc3VsdDtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJlc3VsdCA9IEpTT04ucGFyc2UodGhpcy5tb2R1bGUudmVyaWZ5X21lc3NhZ2UodGhpcy5jcHBBZGRyZXNzLCBtZXNzYWdlLCBhZGRyZXNzLCBzaWduYXR1cmUpKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICByZXN1bHQgPSB7aXNHb29kOiBmYWxzZX07XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQocmVzdWx0LmlzR29vZCA/XG4gICAgICAgIHtpc0dvb2Q6IHJlc3VsdC5pc0dvb2QsIGlzT2xkOiByZXN1bHQuaXNPbGQsIHNpZ25hdHVyZVR5cGU6IHJlc3VsdC5zaWduYXR1cmVUeXBlID09PSBcInNwZW5kXCIgPyBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfU1BFTkRfS0VZIDogTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1ZJRVdfS0VZLCB2ZXJzaW9uOiByZXN1bHQudmVyc2lvbn0gOlxuICAgICAgICB7aXNHb29kOiBmYWxzZX1cbiAgICAgICk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4S2V5KHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFR4S2V5KHR4SGFzaCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdHJ5IHsgcmV0dXJuIHRoaXMubW9kdWxlLmdldF90eF9rZXkodGhpcy5jcHBBZGRyZXNzLCB0eEhhc2gpOyB9XG4gICAgICBjYXRjaCAoZXJyKSB7IHRocm93IG5ldyBNb25lcm9FcnJvcih0aGlzLm1vZHVsZS5nZXRfZXhjZXB0aW9uX21lc3NhZ2UoZXJyKSk7IH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tUeEtleSh0eEhhc2g6IHN0cmluZywgdHhLZXk6IHN0cmluZywgYWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1R4PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jaGVja1R4S2V5KHR4SGFzaCwgdHhLZXksIGFkZHJlc3MpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTsgXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5jaGVja190eF9rZXkodGhpcy5jcHBBZGRyZXNzLCB0eEhhc2gsIHR4S2V5LCBhZGRyZXNzLCAocmVzcEpzb25TdHIpID0+IHtcbiAgICAgICAgICBpZiAocmVzcEpzb25TdHIuY2hhckF0KDApICE9PSBcIntcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwSnNvblN0cikpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvQ2hlY2tUeChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMocmVzcEpzb25TdHIpKSkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFByb29mKHR4SGFzaDogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0VHhQcm9vZih0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmdldF90eF9wcm9vZih0aGlzLmNwcEFkZHJlc3MsIHR4SGFzaCB8fCBcIlwiLCBhZGRyZXNzIHx8IFwiXCIsIG1lc3NhZ2UgfHwgXCJcIiwgKHNpZ25hdHVyZSkgPT4ge1xuICAgICAgICAgIGxldCBlcnJvcktleSA9IFwiZXJyb3I6IFwiO1xuICAgICAgICAgIGlmIChzaWduYXR1cmUuaW5kZXhPZihlcnJvcktleSkgPT09IDApIHJlamVjdChuZXcgTW9uZXJvRXJyb3Ioc2lnbmF0dXJlLnN1YnN0cmluZyhlcnJvcktleS5sZW5ndGgpKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKHNpZ25hdHVyZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrVHhQcm9vZih0eEhhc2g6IHN0cmluZywgYWRkcmVzczogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1R4PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jaGVja1R4UHJvb2YodHhIYXNoLCBhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTsgXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5jaGVja190eF9wcm9vZih0aGlzLmNwcEFkZHJlc3MsIHR4SGFzaCB8fCBcIlwiLCBhZGRyZXNzIHx8IFwiXCIsIG1lc3NhZ2UgfHwgXCJcIiwgc2lnbmF0dXJlIHx8IFwiXCIsIChyZXNwSnNvblN0cikgPT4ge1xuICAgICAgICAgIGlmIChyZXNwSnNvblN0ci5jaGFyQXQoMCkgIT09IFwie1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3BKc29uU3RyKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9DaGVja1R4KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhyZXNwSnNvblN0cikpKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFNwZW5kUHJvb2YodHhIYXNoOiBzdHJpbmcsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0U3BlbmRQcm9vZih0eEhhc2gsIG1lc3NhZ2UpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmdldF9zcGVuZF9wcm9vZih0aGlzLmNwcEFkZHJlc3MsIHR4SGFzaCB8fCBcIlwiLCBtZXNzYWdlIHx8IFwiXCIsIChzaWduYXR1cmUpID0+IHtcbiAgICAgICAgICBsZXQgZXJyb3JLZXkgPSBcImVycm9yOiBcIjtcbiAgICAgICAgICBpZiAoc2lnbmF0dXJlLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHNpZ25hdHVyZS5zdWJzdHJpbmcoZXJyb3JLZXkubGVuZ3RoKSkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShzaWduYXR1cmUpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBjaGVja1NwZW5kUHJvb2YodHhIYXNoOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmNoZWNrU3BlbmRQcm9vZih0eEhhc2gsIG1lc3NhZ2UsIHNpZ25hdHVyZSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpOyBcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmNoZWNrX3NwZW5kX3Byb29mKHRoaXMuY3BwQWRkcmVzcywgdHhIYXNoIHx8IFwiXCIsIG1lc3NhZ2UgfHwgXCJcIiwgc2lnbmF0dXJlIHx8IFwiXCIsIChyZXNwKSA9PiB7XG4gICAgICAgICAgdHlwZW9mIHJlc3AgPT09IFwic3RyaW5nXCIgPyByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKSA6IHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFJlc2VydmVQcm9vZldhbGxldChtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFJlc2VydmVQcm9vZldhbGxldChtZXNzYWdlKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfcmVzZXJ2ZV9wcm9vZl93YWxsZXQodGhpcy5jcHBBZGRyZXNzLCBtZXNzYWdlLCAoc2lnbmF0dXJlKSA9PiB7XG4gICAgICAgICAgbGV0IGVycm9yS2V5ID0gXCJlcnJvcjogXCI7XG4gICAgICAgICAgaWYgKHNpZ25hdHVyZS5pbmRleE9mKGVycm9yS2V5KSA9PT0gMCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihzaWduYXR1cmUuc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCksIC0xKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKHNpZ25hdHVyZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFJlc2VydmVQcm9vZkFjY291bnQoYWNjb3VudElkeDogbnVtYmVyLCBhbW91bnQ6IGJpZ2ludCwgbWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRSZXNlcnZlUHJvb2ZBY2NvdW50KGFjY291bnRJZHgsIGFtb3VudCwgbWVzc2FnZSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X3Jlc2VydmVfcHJvb2ZfYWNjb3VudCh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgsIGFtb3VudC50b1N0cmluZygpLCBtZXNzYWdlLCAoc2lnbmF0dXJlKSA9PiB7XG4gICAgICAgICAgbGV0IGVycm9yS2V5ID0gXCJlcnJvcjogXCI7XG4gICAgICAgICAgaWYgKHNpZ25hdHVyZS5pbmRleE9mKGVycm9yS2V5KSA9PT0gMCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihzaWduYXR1cmUuc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCksIC0xKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKHNpZ25hdHVyZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBjaGVja1Jlc2VydmVQcm9vZihhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrUmVzZXJ2ZT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuY2hlY2tSZXNlcnZlUHJvb2YoYWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7IFxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuY2hlY2tfcmVzZXJ2ZV9wcm9vZih0aGlzLmNwcEFkZHJlc3MsIGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSwgKHJlc3BKc29uU3RyKSA9PiB7XG4gICAgICAgICAgaWYgKHJlc3BKc29uU3RyLmNoYXJBdCgwKSAhPT0gXCJ7XCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcEpzb25TdHIsIC0xKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9DaGVja1Jlc2VydmUoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHJlc3BKc29uU3RyKSkpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhOb3Rlcyh0eEhhc2hlczogc3RyaW5nW10pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRUeE5vdGVzKHR4SGFzaGVzKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkgeyByZXR1cm4gSlNPTi5wYXJzZSh0aGlzLm1vZHVsZS5nZXRfdHhfbm90ZXModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7dHhIYXNoZXM6IHR4SGFzaGVzfSkpKS50eE5vdGVzOyB9XG4gICAgICBjYXRjaCAoZXJyKSB7IHRocm93IG5ldyBNb25lcm9FcnJvcih0aGlzLm1vZHVsZS5nZXRfZXhjZXB0aW9uX21lc3NhZ2UoZXJyKSk7IH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0VHhOb3Rlcyh0eEhhc2hlczogc3RyaW5nW10sIG5vdGVzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2V0VHhOb3Rlcyh0eEhhc2hlcywgbm90ZXMpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7IHRoaXMubW9kdWxlLnNldF90eF9ub3Rlcyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHt0eEhhc2hlczogdHhIYXNoZXMsIHR4Tm90ZXM6IG5vdGVzfSkpOyB9XG4gICAgICBjYXRjaCAoZXJyKSB7IHRocm93IG5ldyBNb25lcm9FcnJvcih0aGlzLm1vZHVsZS5nZXRfZXhjZXB0aW9uX21lc3NhZ2UoZXJyKSk7IH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzKGVudHJ5SW5kaWNlcz86IG51bWJlcltdKTogUHJvbWlzZTxNb25lcm9BZGRyZXNzQm9va0VudHJ5W10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEFkZHJlc3NCb29rRW50cmllcyhlbnRyeUluZGljZXMpO1xuICAgIGlmICghZW50cnlJbmRpY2VzKSBlbnRyeUluZGljZXMgPSBbXTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgZW50cmllcyA9IFtdO1xuICAgICAgZm9yIChsZXQgZW50cnlKc29uIG9mIEpTT04ucGFyc2UodGhpcy5tb2R1bGUuZ2V0X2FkZHJlc3NfYm9va19lbnRyaWVzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe2VudHJ5SW5kaWNlczogZW50cnlJbmRpY2VzfSkpKS5lbnRyaWVzKSB7XG4gICAgICAgIGVudHJpZXMucHVzaChuZXcgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeShlbnRyeUpzb24pKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBlbnRyaWVzO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBhZGRBZGRyZXNzQm9va0VudHJ5KGFkZHJlc3M6IHN0cmluZywgZGVzY3JpcHRpb24/OiBzdHJpbmcpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuYWRkQWRkcmVzc0Jvb2tFbnRyeShhZGRyZXNzLCBkZXNjcmlwdGlvbik7XG4gICAgaWYgKCFhZGRyZXNzKSBhZGRyZXNzID0gXCJcIjtcbiAgICBpZiAoIWRlc2NyaXB0aW9uKSBkZXNjcmlwdGlvbiA9IFwiXCI7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLmFkZF9hZGRyZXNzX2Jvb2tfZW50cnkodGhpcy5jcHBBZGRyZXNzLCBhZGRyZXNzLCBkZXNjcmlwdGlvbik7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGVkaXRBZGRyZXNzQm9va0VudHJ5KGluZGV4OiBudW1iZXIsIHNldEFkZHJlc3M6IGJvb2xlYW4sIGFkZHJlc3M6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2V0RGVzY3JpcHRpb246IGJvb2xlYW4sIGRlc2NyaXB0aW9uOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmVkaXRBZGRyZXNzQm9va0VudHJ5KGluZGV4LCBzZXRBZGRyZXNzLCBhZGRyZXNzLCBzZXREZXNjcmlwdGlvbiwgZGVzY3JpcHRpb24pO1xuICAgIGlmICghc2V0QWRkcmVzcykgc2V0QWRkcmVzcyA9IGZhbHNlO1xuICAgIGlmICghYWRkcmVzcykgYWRkcmVzcyA9IFwiXCI7XG4gICAgaWYgKCFzZXREZXNjcmlwdGlvbikgc2V0RGVzY3JpcHRpb24gPSBmYWxzZTtcbiAgICBpZiAoIWRlc2NyaXB0aW9uKSBkZXNjcmlwdGlvbiA9IFwiXCI7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdGhpcy5tb2R1bGUuZWRpdF9hZGRyZXNzX2Jvb2tfZW50cnkodGhpcy5jcHBBZGRyZXNzLCBpbmRleCwgc2V0QWRkcmVzcywgYWRkcmVzcywgc2V0RGVzY3JpcHRpb24sIGRlc2NyaXB0aW9uKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeShlbnRyeUlkeDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5kZWxldGVBZGRyZXNzQm9va0VudHJ5KGVudHJ5SWR4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0aGlzLm1vZHVsZS5kZWxldGVfYWRkcmVzc19ib29rX2VudHJ5KHRoaXMuY3BwQWRkcmVzcywgZW50cnlJZHgpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyB0YWdBY2NvdW50cyh0YWc6IHN0cmluZywgYWNjb3VudEluZGljZXM6IG51bWJlcltdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS50YWdBY2NvdW50cyh0YWcsIGFjY291bnRJbmRpY2VzKTtcbiAgICBpZiAoIXRhZykgdGFnID0gXCJcIjtcbiAgICBpZiAoIWFjY291bnRJbmRpY2VzKSBhY2NvdW50SW5kaWNlcyA9IFtdO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRoaXMubW9kdWxlLnRhZ19hY2NvdW50cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHt0YWc6IHRhZywgYWNjb3VudEluZGljZXM6IGFjY291bnRJbmRpY2VzfSkpO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgdW50YWdBY2NvdW50cyhhY2NvdW50SW5kaWNlczogbnVtYmVyW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnVudGFnQWNjb3VudHMoYWNjb3VudEluZGljZXMpO1xuICAgIGlmICghYWNjb3VudEluZGljZXMpIGFjY291bnRJbmRpY2VzID0gW107XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdGhpcy5tb2R1bGUudGFnX2FjY291bnRzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe2FjY291bnRJbmRpY2VzOiBhY2NvdW50SW5kaWNlc30pKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudFRhZ3MoKTogUHJvbWlzZTxNb25lcm9BY2NvdW50VGFnW10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEFjY291bnRUYWdzKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IGFjY291bnRUYWdzID0gW107XG4gICAgICBmb3IgKGxldCBhY2NvdW50VGFnSnNvbiBvZiBKU09OLnBhcnNlKHRoaXMubW9kdWxlLmdldF9hY2NvdW50X3RhZ3ModGhpcy5jcHBBZGRyZXNzKSkuYWNjb3VudFRhZ3MpIGFjY291bnRUYWdzLnB1c2gobmV3IE1vbmVyb0FjY291bnRUYWcoYWNjb3VudFRhZ0pzb24pKTtcbiAgICAgIHJldHVybiBhY2NvdW50VGFncztcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIHNldEFjY291bnRUYWdMYWJlbCh0YWc6IHN0cmluZywgbGFiZWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2V0QWNjb3VudFRhZ0xhYmVsKHRhZywgbGFiZWwpO1xuICAgIGlmICghdGFnKSB0YWcgPSBcIlwiO1xuICAgIGlmICghbGFiZWwpIGxhYmVsID0gXCJcIjtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0aGlzLm1vZHVsZS5zZXRfYWNjb3VudF90YWdfbGFiZWwodGhpcy5jcHBBZGRyZXNzLCB0YWcsIGxhYmVsKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGF5bWVudFVyaShjb25maWc6IE1vbmVyb1R4Q29uZmlnKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFBheW1lbnRVcmkoY29uZmlnKTtcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnKGNvbmZpZyk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLmdldF9wYXltZW50X3VyaSh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KGNvbmZpZy50b0pzb24oKSkpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBtYWtlIFVSSSBmcm9tIHN1cHBsaWVkIHBhcmFtZXRlcnNcIik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHBhcnNlUGF5bWVudFVyaSh1cmk6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhDb25maWc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnBhcnNlUGF5bWVudFVyaSh1cmkpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBuZXcgTW9uZXJvVHhDb25maWcoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHRoaXMubW9kdWxlLnBhcnNlX3BheW1lbnRfdXJpKHRoaXMuY3BwQWRkcmVzcywgdXJpKSkpKTtcbiAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihlcnIubWVzc2FnZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEF0dHJpYnV0ZShrZXk6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRBdHRyaWJ1dGUoa2V5KTtcbiAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgIGFzc2VydCh0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiLCBcIkF0dHJpYnV0ZSBrZXkgbXVzdCBiZSBhIHN0cmluZ1wiKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgdmFsdWUgPSB0aGlzLm1vZHVsZS5nZXRfYXR0cmlidXRlKHRoaXMuY3BwQWRkcmVzcywga2V5KTtcbiAgICAgIHJldHVybiB2YWx1ZSA9PT0gXCJcIiA/IG51bGwgOiB2YWx1ZTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0QXR0cmlidXRlKGtleTogc3RyaW5nLCB2YWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2V0QXR0cmlidXRlKGtleSwgdmFsKTtcbiAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgIGFzc2VydCh0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiLCBcIkF0dHJpYnV0ZSBrZXkgbXVzdCBiZSBhIHN0cmluZ1wiKTtcbiAgICBhc3NlcnQodHlwZW9mIHZhbCA9PT0gXCJzdHJpbmdcIiwgXCJBdHRyaWJ1dGUgdmFsdWUgbXVzdCBiZSBhIHN0cmluZ1wiKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0aGlzLm1vZHVsZS5zZXRfYXR0cmlidXRlKHRoaXMuY3BwQWRkcmVzcywga2V5LCB2YWwpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzdGFydE1pbmluZyhudW1UaHJlYWRzOiBudW1iZXIsIGJhY2tncm91bmRNaW5pbmc/OiBib29sZWFuLCBpZ25vcmVCYXR0ZXJ5PzogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3RhcnRNaW5pbmcobnVtVGhyZWFkcywgYmFja2dyb3VuZE1pbmluZywgaWdub3JlQmF0dGVyeSk7XG4gICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICBsZXQgZGFlbW9uID0gYXdhaXQgTW9uZXJvRGFlbW9uUnBjLmNvbm5lY3RUb0RhZW1vblJwYyhhd2FpdCB0aGlzLmdldERhZW1vbkNvbm5lY3Rpb24oKSk7XG4gICAgYXdhaXQgZGFlbW9uLnN0YXJ0TWluaW5nKGF3YWl0IHRoaXMuZ2V0UHJpbWFyeUFkZHJlc3MoKSwgbnVtVGhyZWFkcywgYmFja2dyb3VuZE1pbmluZywgaWdub3JlQmF0dGVyeSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0b3BNaW5pbmcoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zdG9wTWluaW5nKCk7XG4gICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICBsZXQgZGFlbW9uID0gYXdhaXQgTW9uZXJvRGFlbW9uUnBjLmNvbm5lY3RUb0RhZW1vblJwYyhhd2FpdCB0aGlzLmdldERhZW1vbkNvbm5lY3Rpb24oKSk7XG4gICAgYXdhaXQgZGFlbW9uLnN0b3BNaW5pbmcoKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmlzTXVsdGlzaWdJbXBvcnROZWVkZWQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gdGhpcy5tb2R1bGUuaXNfbXVsdGlzaWdfaW1wb3J0X25lZWRlZCh0aGlzLmNwcEFkZHJlc3MpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBpc011bHRpc2lnKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaXNNdWx0aXNpZygpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5pc19tdWx0aXNpZyh0aGlzLmNwcEFkZHJlc3MpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRNdWx0aXNpZ0luZm8oKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luZm8+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldE11bHRpc2lnSW5mbygpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgTW9uZXJvTXVsdGlzaWdJbmZvKEpTT04ucGFyc2UodGhpcy5tb2R1bGUuZ2V0X211bHRpc2lnX2luZm8odGhpcy5jcHBBZGRyZXNzKSkpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBwcmVwYXJlTXVsdGlzaWcoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnByZXBhcmVNdWx0aXNpZygpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5wcmVwYXJlX211bHRpc2lnKHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIG1ha2VNdWx0aXNpZyhtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgdGhyZXNob2xkOiBudW1iZXIsIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkubWFrZU11bHRpc2lnKG11bHRpc2lnSGV4ZXMsIHRocmVzaG9sZCwgcGFzc3dvcmQpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLm1ha2VfbXVsdGlzaWcodGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7bXVsdGlzaWdIZXhlczogbXVsdGlzaWdIZXhlcywgdGhyZXNob2xkOiB0aHJlc2hvbGQsIHBhc3N3b3JkOiBwYXNzd29yZH0pLCAocmVzcCkgPT4ge1xuICAgICAgICAgIGxldCBlcnJvcktleSA9IFwiZXJyb3I6IFwiO1xuICAgICAgICAgIGlmIChyZXNwLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3Auc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCkpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGV4Y2hhbmdlTXVsdGlzaWdLZXlzKG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdLCBwYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmV4Y2hhbmdlTXVsdGlzaWdLZXlzKG11bHRpc2lnSGV4ZXMsIHBhc3N3b3JkKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5leGNoYW5nZV9tdWx0aXNpZ19rZXlzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe211bHRpc2lnSGV4ZXM6IG11bHRpc2lnSGV4ZXMsIHBhc3N3b3JkOiBwYXNzd29yZH0pLCAocmVzcCkgPT4ge1xuICAgICAgICAgIGxldCBlcnJvcktleSA9IFwiZXJyb3I6IFwiO1xuICAgICAgICAgIGlmIChyZXNwLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3Auc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCkpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdChKU09OLnBhcnNlKHJlc3ApKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydE11bHRpc2lnSGV4KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5leHBvcnRNdWx0aXNpZ0hleCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5leHBvcnRfbXVsdGlzaWdfaGV4KHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGltcG9ydE11bHRpc2lnSGV4KG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmltcG9ydE11bHRpc2lnSGV4KG11bHRpc2lnSGV4ZXMpO1xuICAgIGlmICghR2VuVXRpbHMuaXNBcnJheShtdWx0aXNpZ0hleGVzKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIHN0cmluZ1tdIHRvIGltcG9ydE11bHRpc2lnSGV4KClcIilcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5pbXBvcnRfbXVsdGlzaWdfaGV4KHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe211bHRpc2lnSGV4ZXM6IG11bHRpc2lnSGV4ZXN9KSwgKHJlc3ApID0+IHtcbiAgICAgICAgICBpZiAodHlwZW9mIHJlc3AgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcCkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc2lnbk11bHRpc2lnVHhIZXgobXVsdGlzaWdUeEhleDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNpZ25NdWx0aXNpZ1R4SGV4KG11bHRpc2lnVHhIZXgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnNpZ25fbXVsdGlzaWdfdHhfaGV4KHRoaXMuY3BwQWRkcmVzcywgbXVsdGlzaWdUeEhleCwgKHJlc3ApID0+IHtcbiAgICAgICAgICBpZiAocmVzcC5jaGFyQXQoMCkgIT09IFwie1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb011bHRpc2lnU2lnblJlc3VsdChKU09OLnBhcnNlKHJlc3ApKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdE11bHRpc2lnVHhIZXgoc2lnbmVkTXVsdGlzaWdUeEhleDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3VibWl0TXVsdGlzaWdUeEhleChzaWduZWRNdWx0aXNpZ1R4SGV4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5zdWJtaXRfbXVsdGlzaWdfdHhfaGV4KHRoaXMuY3BwQWRkcmVzcywgc2lnbmVkTXVsdGlzaWdUeEhleCwgKHJlc3ApID0+IHtcbiAgICAgICAgICBpZiAocmVzcC5jaGFyQXQoMCkgIT09IFwie1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoSlNPTi5wYXJzZShyZXNwKS50eEhhc2hlcyk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIGtleXMgYW5kIGNhY2hlIGRhdGEuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPERhdGFWaWV3W10+fSBpcyB0aGUga2V5cyBhbmQgY2FjaGUgZGF0YSwgcmVzcGVjdGl2ZWx5XG4gICAqL1xuICBhc3luYyBnZXREYXRhKCk6IFByb21pc2U8RGF0YVZpZXdbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0RGF0YSgpO1xuICAgIFxuICAgIC8vIHF1ZXVlIGNhbGwgdG8gd2FzbSBtb2R1bGVcbiAgICBsZXQgdmlld09ubHkgPSBhd2FpdCB0aGlzLmlzVmlld09ubHkoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBcbiAgICAgIC8vIHN0b3JlIHZpZXdzIGluIGFycmF5XG4gICAgICBsZXQgdmlld3MgPSBbXTtcbiAgICAgIFxuICAgICAgLy8gbWFsbG9jIGNhY2hlIGJ1ZmZlciBhbmQgZ2V0IGJ1ZmZlciBsb2NhdGlvbiBpbiBjKysgaGVhcFxuICAgICAgbGV0IGNhY2hlQnVmZmVyTG9jID0gSlNPTi5wYXJzZSh0aGlzLm1vZHVsZS5nZXRfY2FjaGVfZmlsZV9idWZmZXIodGhpcy5jcHBBZGRyZXNzKSk7XG4gICAgICBcbiAgICAgIC8vIHJlYWQgYmluYXJ5IGRhdGEgZnJvbSBoZWFwIHRvIERhdGFWaWV3XG4gICAgICBsZXQgdmlldyA9IG5ldyBEYXRhVmlldyhuZXcgQXJyYXlCdWZmZXIoY2FjaGVCdWZmZXJMb2MubGVuZ3RoKSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNhY2hlQnVmZmVyTG9jLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZpZXcuc2V0SW50OChpLCB0aGlzLm1vZHVsZS5IRUFQVThbY2FjaGVCdWZmZXJMb2MucG9pbnRlciAvIFVpbnQ4QXJyYXkuQllURVNfUEVSX0VMRU1FTlQgKyBpXSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIGZyZWUgYmluYXJ5IG9uIGhlYXBcbiAgICAgIHRoaXMubW9kdWxlLl9mcmVlKGNhY2hlQnVmZmVyTG9jLnBvaW50ZXIpO1xuICAgICAgXG4gICAgICAvLyB3cml0ZSBjYWNoZSBmaWxlXG4gICAgICB2aWV3cy5wdXNoKEJ1ZmZlci5mcm9tKHZpZXcuYnVmZmVyKSk7XG4gICAgICBcbiAgICAgIC8vIG1hbGxvYyBrZXlzIGJ1ZmZlciBhbmQgZ2V0IGJ1ZmZlciBsb2NhdGlvbiBpbiBjKysgaGVhcFxuICAgICAgbGV0IGtleXNCdWZmZXJMb2MgPSBKU09OLnBhcnNlKHRoaXMubW9kdWxlLmdldF9rZXlzX2ZpbGVfYnVmZmVyKHRoaXMuY3BwQWRkcmVzcywgdGhpcy5wYXNzd29yZCwgdmlld09ubHkpKTtcbiAgICAgIFxuICAgICAgLy8gcmVhZCBiaW5hcnkgZGF0YSBmcm9tIGhlYXAgdG8gRGF0YVZpZXdcbiAgICAgIHZpZXcgPSBuZXcgRGF0YVZpZXcobmV3IEFycmF5QnVmZmVyKGtleXNCdWZmZXJMb2MubGVuZ3RoKSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXNCdWZmZXJMb2MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmlldy5zZXRJbnQ4KGksIHRoaXMubW9kdWxlLkhFQVBVOFtrZXlzQnVmZmVyTG9jLnBvaW50ZXIgLyBVaW50OEFycmF5LkJZVEVTX1BFUl9FTEVNRU5UICsgaV0pO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBmcmVlIGJpbmFyeSBvbiBoZWFwXG4gICAgICB0aGlzLm1vZHVsZS5fZnJlZShrZXlzQnVmZmVyTG9jLnBvaW50ZXIpO1xuICAgICAgXG4gICAgICAvLyBwcmVwZW5kIGtleXMgZmlsZVxuICAgICAgdmlld3MudW5zaGlmdChCdWZmZXIuZnJvbSh2aWV3LmJ1ZmZlcikpO1xuICAgICAgcmV0dXJuIHZpZXdzO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBjaGFuZ2VQYXNzd29yZChvbGRQYXNzd29yZDogc3RyaW5nLCBuZXdQYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jaGFuZ2VQYXNzd29yZChvbGRQYXNzd29yZCwgbmV3UGFzc3dvcmQpO1xuICAgIGlmIChvbGRQYXNzd29yZCAhPT0gdGhpcy5wYXNzd29yZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiSW52YWxpZCBvcmlnaW5hbCBwYXNzd29yZC5cIik7IC8vIHdhbGxldDIgdmVyaWZ5X3Bhc3N3b3JkIGxvYWRzIGZyb20gZGlzayBzbyB2ZXJpZnkgcGFzc3dvcmQgaGVyZVxuICAgIGlmIChuZXdQYXNzd29yZCA9PT0gdW5kZWZpbmVkKSBuZXdQYXNzd29yZCA9IFwiXCI7XG4gICAgYXdhaXQgdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5jaGFuZ2Vfd2FsbGV0X3Bhc3N3b3JkKHRoaXMuY3BwQWRkcmVzcywgb2xkUGFzc3dvcmQsIG5ld1Bhc3N3b3JkLCAoZXJyTXNnKSA9PiB7XG4gICAgICAgICAgaWYgKGVyck1zZykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihlcnJNc2cpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICB0aGlzLnBhc3N3b3JkID0gbmV3UGFzc3dvcmQ7XG4gICAgaWYgKHRoaXMucGF0aCkgYXdhaXQgdGhpcy5zYXZlKCk7IC8vIGF1dG8gc2F2ZVxuICB9XG4gIFxuICBhc3luYyBzYXZlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2F2ZSgpO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLnNhdmUodGhpcyk7XG4gIH1cbiAgXG4gIGFzeW5jIGNsb3NlKHNhdmUgPSBmYWxzZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLl9pc0Nsb3NlZCkgcmV0dXJuOyAvLyBubyBlZmZlY3QgaWYgY2xvc2VkXG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkge1xuICAgICAgYXdhaXQgdGhpcy5nZXRXYWxsZXRQcm94eSgpLmNsb3NlKHNhdmUpO1xuICAgICAgdGhpcy5faXNDbG9zZWQgPSB0cnVlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgICBhd2FpdCB0aGlzLnN0b3BTeW5jaW5nKCk7XG4gICAgYXdhaXQgc3VwZXIuY2xvc2Uoc2F2ZSk7XG4gICAgZGVsZXRlIHRoaXMucGF0aDtcbiAgICBkZWxldGUgdGhpcy5wYXNzd29yZDtcbiAgICBkZWxldGUgdGhpcy5saXN0ZW5lcnM7XG4gICAgZGVsZXRlIHRoaXMuZnVsbExpc3RlbmVyO1xuICAgIExpYnJhcnlVdGlscy5zZXRSZWplY3RVbmF1dGhvcml6ZWRGbih0aGlzLnJlamVjdFVuYXV0aG9yaXplZENvbmZpZ0lkLCB1bmRlZmluZWQpOyAvLyB1bnJlZ2lzdGVyIGZuIGluZm9ybWluZyBpZiB1bmF1dGhvcml6ZWQgcmVxcyBzaG91bGQgYmUgcmVqZWN0ZWRcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0gQUREIEpTRE9DIEZPUiBTVVBQT1JURUQgREVGQVVMVCBJTVBMRU1FTlRBVElPTlMgLS0tLS0tLS0tLS0tLS1cbiAgXG4gIGFzeW5jIGdldE51bUJsb2Nrc1RvVW5sb2NrKCk6IFByb21pc2U8bnVtYmVyW10+IHsgcmV0dXJuIHN1cGVyLmdldE51bUJsb2Nrc1RvVW5sb2NrKCk7IH1cbiAgYXN5bmMgZ2V0VHgodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7IHJldHVybiBzdXBlci5nZXRUeCh0eEhhc2gpOyB9XG4gIGFzeW5jIGdldEluY29taW5nVHJhbnNmZXJzKHF1ZXJ5OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KTogUHJvbWlzZTxNb25lcm9JbmNvbWluZ1RyYW5zZmVyW10+IHsgcmV0dXJuIHN1cGVyLmdldEluY29taW5nVHJhbnNmZXJzKHF1ZXJ5KTsgfVxuICBhc3luYyBnZXRPdXRnb2luZ1RyYW5zZmVycyhxdWVyeTogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5PikgeyByZXR1cm4gc3VwZXIuZ2V0T3V0Z29pbmdUcmFuc2ZlcnMocXVlcnkpOyB9XG4gIGFzeW5jIGNyZWF0ZVR4KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7IHJldHVybiBzdXBlci5jcmVhdGVUeChjb25maWcpOyB9XG4gIGFzeW5jIHJlbGF5VHgodHhPck1ldGFkYXRhOiBNb25lcm9UeFdhbGxldCB8IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7IHJldHVybiBzdXBlci5yZWxheVR4KHR4T3JNZXRhZGF0YSk7IH1cbiAgYXN5bmMgZ2V0VHhOb3RlKHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHsgcmV0dXJuIHN1cGVyLmdldFR4Tm90ZSh0eEhhc2gpOyB9XG4gIGFzeW5jIHNldFR4Tm90ZSh0eEhhc2g6IHN0cmluZywgbm90ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7IHJldHVybiBzdXBlci5zZXRUeE5vdGUodHhIYXNoLCBub3RlKTsgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIEhFTFBFUlMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgb3BlbldhbGxldERhdGEoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pIHtcbiAgICBpZiAoY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiBNb25lcm9XYWxsZXRGdWxsUHJveHkub3BlbldhbGxldERhdGEoY29uZmlnKTtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSBhbmQgbm9ybWFsaXplIHBhcmFtZXRlcnNcbiAgICBpZiAoY29uZmlnLm5ldHdvcmtUeXBlID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSB0aGUgd2FsbGV0J3MgbmV0d29yayB0eXBlXCIpO1xuICAgIGNvbmZpZy5uZXR3b3JrVHlwZSA9IE1vbmVyb05ldHdvcmtUeXBlLmZyb20oY29uZmlnLm5ldHdvcmtUeXBlKTtcbiAgICBsZXQgZGFlbW9uQ29ubmVjdGlvbiA9IGNvbmZpZy5nZXRTZXJ2ZXIoKTtcbiAgICBsZXQgZGFlbW9uVXJpID0gZGFlbW9uQ29ubmVjdGlvbiAmJiBkYWVtb25Db25uZWN0aW9uLmdldFVyaSgpID8gZGFlbW9uQ29ubmVjdGlvbi5nZXRVcmkoKSA6IFwiXCI7XG4gICAgbGV0IGRhZW1vblVzZXJuYW1lID0gZGFlbW9uQ29ubmVjdGlvbiAmJiBkYWVtb25Db25uZWN0aW9uLmdldFVzZXJuYW1lKCkgPyBkYWVtb25Db25uZWN0aW9uLmdldFVzZXJuYW1lKCkgOiBcIlwiO1xuICAgIGxldCBkYWVtb25QYXNzd29yZCA9IGRhZW1vbkNvbm5lY3Rpb24gJiYgZGFlbW9uQ29ubmVjdGlvbi5nZXRQYXNzd29yZCgpID8gZGFlbW9uQ29ubmVjdGlvbi5nZXRQYXNzd29yZCgpIDogXCJcIjtcbiAgICBsZXQgcmVqZWN0VW5hdXRob3JpemVkID0gZGFlbW9uQ29ubmVjdGlvbiA/IGRhZW1vbkNvbm5lY3Rpb24uZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkgOiB0cnVlO1xuICAgIFxuICAgIC8vIGxvYWQgd2FzbSBtb2R1bGVcbiAgICBsZXQgbW9kdWxlID0gYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRGdWxsTW9kdWxlKCk7XG4gICAgXG4gICAgLy8gb3BlbiB3YWxsZXQgaW4gcXVldWVcbiAgICByZXR1cm4gbW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgLy8gcmVnaXN0ZXIgZm4gaW5mb3JtaW5nIGlmIHVuYXV0aG9yaXplZCByZXFzIHNob3VsZCBiZSByZWplY3RlZFxuICAgICAgICBsZXQgcmVqZWN0VW5hdXRob3JpemVkRm5JZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnNldFJlamVjdFVuYXV0aG9yaXplZEZuKHJlamVjdFVuYXV0aG9yaXplZEZuSWQsICgpID0+IHJlamVjdFVuYXV0aG9yaXplZCk7XG4gICAgICBcbiAgICAgICAgLy8gY3JlYXRlIHdhbGxldCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIG1vZHVsZS5vcGVuX3dhbGxldF9mdWxsKGNvbmZpZy5wYXNzd29yZCwgY29uZmlnLm5ldHdvcmtUeXBlLCBjb25maWcua2V5c0RhdGEsIGNvbmZpZy5jYWNoZURhdGEsIGRhZW1vblVyaSwgZGFlbW9uVXNlcm5hbWUsIGRhZW1vblBhc3N3b3JkLCByZWplY3RVbmF1dGhvcml6ZWRGbklkLCAoY3BwQWRkcmVzcykgPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgY3BwQWRkcmVzcyA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihjcHBBZGRyZXNzKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9XYWxsZXRGdWxsKGNwcEFkZHJlc3MsIGNvbmZpZy5wYXRoLCBjb25maWcucGFzc3dvcmQsIGZzLCByZWplY3RVbmF1dGhvcml6ZWQsIHJlamVjdFVuYXV0aG9yaXplZEZuSWQpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHByb3RlY3RlZCBnZXRXYWxsZXRQcm94eSgpOiBNb25lcm9XYWxsZXRGdWxsUHJveHkge1xuICAgIHJldHVybiBzdXBlci5nZXRXYWxsZXRQcm94eSgpIGFzIE1vbmVyb1dhbGxldEZ1bGxQcm94eTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGJhY2tncm91bmRTeW5jKCkge1xuICAgIGxldCBsYWJlbCA9IHRoaXMucGF0aCA/IHRoaXMucGF0aCA6ICh0aGlzLmJyb3dzZXJNYWluUGF0aCA/IHRoaXMuYnJvd3Nlck1haW5QYXRoIDogXCJpbi1tZW1vcnkgd2FsbGV0XCIpOyAvLyBsYWJlbCBmb3IgbG9nXG4gICAgTGlicmFyeVV0aWxzLmxvZygxLCBcIkJhY2tncm91bmQgc3luY2hyb25pemluZyBcIiArIGxhYmVsKTtcbiAgICB0cnkgeyBhd2FpdCB0aGlzLnN5bmMoKTsgfVxuICAgIGNhdGNoIChlcnI6IGFueSkgeyBpZiAoIXRoaXMuX2lzQ2xvc2VkKSBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGJhY2tncm91bmQgc3luY2hyb25pemUgXCIgKyBsYWJlbCArIFwiOiBcIiArIGVyci5tZXNzYWdlKTsgfVxuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgcmVmcmVzaExpc3RlbmluZygpIHtcbiAgICBsZXQgaXNFbmFibGVkID0gdGhpcy5saXN0ZW5lcnMubGVuZ3RoID4gMDtcbiAgICBpZiAodGhpcy5mdWxsTGlzdGVuZXJIYW5kbGUgPT09IDAgJiYgIWlzRW5hYmxlZCB8fCB0aGlzLmZ1bGxMaXN0ZW5lckhhbmRsZSA+IDAgJiYgaXNFbmFibGVkKSByZXR1cm47IC8vIG5vIGRpZmZlcmVuY2VcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnNldF9saXN0ZW5lcihcbiAgICAgICAgICB0aGlzLmNwcEFkZHJlc3MsXG4gICAgICAgICAgdGhpcy5mdWxsTGlzdGVuZXJIYW5kbGUsXG4gICAgICAgICAgICBuZXdMaXN0ZW5lckhhbmRsZSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgbmV3TGlzdGVuZXJIYW5kbGUgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IobmV3TGlzdGVuZXJIYW5kbGUpKTtcbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mdWxsTGlzdGVuZXJIYW5kbGUgPSBuZXdMaXN0ZW5lckhhbmRsZTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc0VuYWJsZWQgPyBhc3luYyAoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSkgPT4gYXdhaXQgdGhpcy5mdWxsTGlzdGVuZXIub25TeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSkgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBpc0VuYWJsZWQgPyBhc3luYyAoaGVpZ2h0KSA9PiBhd2FpdCB0aGlzLmZ1bGxMaXN0ZW5lci5vbk5ld0Jsb2NrKGhlaWdodCkgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBpc0VuYWJsZWQgPyBhc3luYyAobmV3QmFsYW5jZVN0ciwgbmV3VW5sb2NrZWRCYWxhbmNlU3RyKSA9PiBhd2FpdCB0aGlzLmZ1bGxMaXN0ZW5lci5vbkJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlU3RyLCBuZXdVbmxvY2tlZEJhbGFuY2VTdHIpIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgaXNFbmFibGVkID8gYXN5bmMgKGhlaWdodCwgdHhIYXNoLCBhbW91bnRTdHIsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIHZlcnNpb24sIHVubG9ja1RpbWUsIGlzTG9ja2VkKSA9PiBhd2FpdCB0aGlzLmZ1bGxMaXN0ZW5lci5vbk91dHB1dFJlY2VpdmVkKGhlaWdodCwgdHhIYXNoLCBhbW91bnRTdHIsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIHZlcnNpb24sIHVubG9ja1RpbWUsIGlzTG9ja2VkKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGlzRW5hYmxlZCA/IGFzeW5jIChoZWlnaHQsIHR4SGFzaCwgYW1vdW50U3RyLCBhY2NvdW50SWR4U3RyLCBzdWJhZGRyZXNzSWR4U3RyLCB2ZXJzaW9uLCB1bmxvY2tUaW1lLCBpc0xvY2tlZCkgPT4gYXdhaXQgdGhpcy5mdWxsTGlzdGVuZXIub25PdXRwdXRTcGVudChoZWlnaHQsIHR4SGFzaCwgYW1vdW50U3RyLCBhY2NvdW50SWR4U3RyLCBzdWJhZGRyZXNzSWR4U3RyLCB2ZXJzaW9uLCB1bmxvY2tUaW1lLCBpc0xvY2tlZCkgOiB1bmRlZmluZWQsXG4gICAgICAgICk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgc3RhdGljIHNhbml0aXplQmxvY2soYmxvY2spIHtcbiAgICBmb3IgKGxldCB0eCBvZiBibG9jay5nZXRUeHMoKSkgTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZVR4V2FsbGV0KHR4KTtcbiAgICByZXR1cm4gYmxvY2s7XG4gIH1cbiAgXG4gIHN0YXRpYyBzYW5pdGl6ZVR4V2FsbGV0KHR4KSB7XG4gICAgYXNzZXJ0KHR4IGluc3RhbmNlb2YgTW9uZXJvVHhXYWxsZXQpO1xuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgc3RhdGljIHNhbml0aXplQWNjb3VudChhY2NvdW50KSB7XG4gICAgaWYgKGFjY291bnQuZ2V0U3ViYWRkcmVzc2VzKCkpIHtcbiAgICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2YgYWNjb3VudC5nZXRTdWJhZGRyZXNzZXMoKSkgTW9uZXJvV2FsbGV0S2V5cy5zYW5pdGl6ZVN1YmFkZHJlc3Moc3ViYWRkcmVzcyk7XG4gICAgfVxuICAgIHJldHVybiBhY2NvdW50O1xuICB9XG4gIFxuICBzdGF0aWMgZGVzZXJpYWxpemVCbG9ja3MoYmxvY2tzSnNvblN0cikge1xuICAgIGxldCBibG9ja3NKc29uID0gSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKGJsb2Nrc0pzb25TdHIpKTtcbiAgICBsZXQgZGVzZXJpYWxpemVkQmxvY2tzOiBhbnkgPSB7fTtcbiAgICBkZXNlcmlhbGl6ZWRCbG9ja3MuYmxvY2tzID0gW107XG4gICAgaWYgKGJsb2Nrc0pzb24uYmxvY2tzKSBmb3IgKGxldCBibG9ja0pzb24gb2YgYmxvY2tzSnNvbi5ibG9ja3MpIGRlc2VyaWFsaXplZEJsb2Nrcy5ibG9ja3MucHVzaChNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplQmxvY2sobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWF9XQUxMRVQpKSk7XG4gICAgcmV0dXJuIGRlc2VyaWFsaXplZEJsb2NrcztcbiAgfVxuICBcbiAgc3RhdGljIGRlc2VyaWFsaXplVHhzKHF1ZXJ5LCBibG9ja3NKc29uU3RyKSB7XG4gICAgXG4gICAgLy8gZGVzZXJpYWxpemUgYmxvY2tzXG4gICAgbGV0IGRlc2VyaWFsaXplZEJsb2NrcyA9IE1vbmVyb1dhbGxldEZ1bGwuZGVzZXJpYWxpemVCbG9ja3MoYmxvY2tzSnNvblN0cik7XG4gICAgbGV0IGJsb2NrcyA9IGRlc2VyaWFsaXplZEJsb2Nrcy5ibG9ja3M7XG4gICAgXG4gICAgLy8gY29sbGVjdCB0eHNcbiAgICBsZXQgdHhzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2sgb2YgYmxvY2tzKSB7XG4gICAgICBNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplQmxvY2soYmxvY2spO1xuICAgICAgZm9yIChsZXQgdHggb2YgYmxvY2suZ2V0VHhzKCkpIHtcbiAgICAgICAgaWYgKGJsb2NrLmdldEhlaWdodCgpID09PSB1bmRlZmluZWQpIHR4LnNldEJsb2NrKHVuZGVmaW5lZCk7IC8vIGRlcmVmZXJlbmNlIHBsYWNlaG9sZGVyIGJsb2NrIGZvciB1bmNvbmZpcm1lZCB0eHNcbiAgICAgICAgdHhzLnB1c2godHgpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyByZS1zb3J0IHR4cyB3aGljaCBpcyBsb3N0IG92ZXIgd2FzbSBzZXJpYWxpemF0aW9uICAvLyBUT0RPOiBjb25maXJtIHRoYXQgb3JkZXIgaXMgbG9zdFxuICAgIGlmIChxdWVyeS5nZXRIYXNoZXMoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBsZXQgdHhNYXAgPSBuZXcgTWFwKCk7XG4gICAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHR4TWFwW3R4LmdldEhhc2goKV0gPSB0eDtcbiAgICAgIGxldCB0eHNTb3J0ZWQgPSBbXTtcbiAgICAgIGZvciAobGV0IHR4SGFzaCBvZiBxdWVyeS5nZXRIYXNoZXMoKSkgaWYgKHR4TWFwW3R4SGFzaF0gIT09IHVuZGVmaW5lZCkgdHhzU29ydGVkLnB1c2godHhNYXBbdHhIYXNoXSk7XG4gICAgICB0eHMgPSB0eHNTb3J0ZWQ7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0eHM7XG4gIH1cbiAgXG4gIHN0YXRpYyBkZXNlcmlhbGl6ZVRyYW5zZmVycyhxdWVyeSwgYmxvY2tzSnNvblN0cikge1xuICAgIFxuICAgIC8vIGRlc2VyaWFsaXplIGJsb2Nrc1xuICAgIGxldCBkZXNlcmlhbGl6ZWRCbG9ja3MgPSBNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplQmxvY2tzKGJsb2Nrc0pzb25TdHIpO1xuICAgIGxldCBibG9ja3MgPSBkZXNlcmlhbGl6ZWRCbG9ja3MuYmxvY2tzO1xuICAgIFxuICAgIC8vIGNvbGxlY3QgdHJhbnNmZXJzXG4gICAgbGV0IHRyYW5zZmVycyA9IFtdO1xuICAgIGZvciAobGV0IGJsb2NrIG9mIGJsb2Nrcykge1xuICAgICAgZm9yIChsZXQgdHggb2YgYmxvY2suZ2V0VHhzKCkpIHtcbiAgICAgICAgaWYgKGJsb2NrLmdldEhlaWdodCgpID09PSB1bmRlZmluZWQpIHR4LnNldEJsb2NrKHVuZGVmaW5lZCk7IC8vIGRlcmVmZXJlbmNlIHBsYWNlaG9sZGVyIGJsb2NrIGZvciB1bmNvbmZpcm1lZCB0eHNcbiAgICAgICAgaWYgKHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSAhPT0gdW5kZWZpbmVkKSB0cmFuc2ZlcnMucHVzaCh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkpO1xuICAgICAgICBpZiAodHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgZm9yIChsZXQgdHJhbnNmZXIgb2YgdHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSkgdHJhbnNmZXJzLnB1c2godHJhbnNmZXIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0cmFuc2ZlcnM7XG4gIH1cbiAgXG4gIHN0YXRpYyBkZXNlcmlhbGl6ZU91dHB1dHMocXVlcnksIGJsb2Nrc0pzb25TdHIpIHtcbiAgICBcbiAgICAvLyBkZXNlcmlhbGl6ZSBibG9ja3NcbiAgICBsZXQgZGVzZXJpYWxpemVkQmxvY2tzID0gTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZUJsb2NrcyhibG9ja3NKc29uU3RyKTtcbiAgICBsZXQgYmxvY2tzID0gZGVzZXJpYWxpemVkQmxvY2tzLmJsb2NrcztcbiAgICBcbiAgICAvLyBjb2xsZWN0IG91dHB1dHNcbiAgICBsZXQgb3V0cHV0cyA9IFtdO1xuICAgIGZvciAobGV0IGJsb2NrIG9mIGJsb2Nrcykge1xuICAgICAgZm9yIChsZXQgdHggb2YgYmxvY2suZ2V0VHhzKCkpIHtcbiAgICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIHR4LmdldE91dHB1dHMoKSkgb3V0cHV0cy5wdXNoKG91dHB1dCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvdXRwdXRzO1xuICB9XG4gIFxuICAvKipcbiAgICogU2V0IHRoZSBwYXRoIG9mIHRoZSB3YWxsZXQgb24gdGhlIGJyb3dzZXIgbWFpbiB0aHJlYWQgaWYgcnVuIGFzIGEgd29ya2VyLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGJyb3dzZXJNYWluUGF0aCAtIHBhdGggb2YgdGhlIHdhbGxldCBvbiB0aGUgYnJvd3NlciBtYWluIHRocmVhZFxuICAgKi9cbiAgcHJvdGVjdGVkIHNldEJyb3dzZXJNYWluUGF0aChicm93c2VyTWFpblBhdGgpIHtcbiAgICB0aGlzLmJyb3dzZXJNYWluUGF0aCA9IGJyb3dzZXJNYWluUGF0aDtcbiAgfVxuICBcbiAgc3RhdGljIGFzeW5jIG1vdmVUbyhwYXRoLCB3YWxsZXQpIHtcbiAgICBpZiAoYXdhaXQgd2FsbGV0LmlzQ2xvc2VkKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBpcyBjbG9zZWRcIik7XG4gICAgaWYgKCFwYXRoKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgcGF0aCBvZiBkZXN0aW5hdGlvbiB3YWxsZXRcIik7XG4gICAgXG4gICAgLy8gc2F2ZSBhbmQgcmV0dXJuIGlmIHNhbWUgcGF0aFxuICAgIGlmIChQYXRoLm5vcm1hbGl6ZSh3YWxsZXQucGF0aCkgPT09IFBhdGgubm9ybWFsaXplKHBhdGgpKSB7XG4gICAgICBhd2FpdCB3YWxsZXQuc2F2ZSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBcbiAgICAvLyBjcmVhdGUgZGVzdGluYXRpb24gZGlyZWN0b3J5IGlmIGl0IGRvZXNuJ3QgZXhpc3RcbiAgICBsZXQgd2FsbGV0RGlyID0gUGF0aC5kaXJuYW1lKHBhdGgpO1xuICAgIGlmICghd2FsbGV0LmZzLmV4aXN0c1N5bmMod2FsbGV0RGlyKSkge1xuICAgICAgdHJ5IHsgd2FsbGV0LmZzLm1rZGlyU3luYyh3YWxsZXREaXIpOyB9XG4gICAgICBjYXRjaCAoZXJyOiBhbnkpIHsgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiRGVzdGluYXRpb24gcGF0aCBcIiArIHBhdGggKyBcIiBkb2VzIG5vdCBleGlzdCBhbmQgY2Fubm90IGJlIGNyZWF0ZWQ6IFwiICsgZXJyLm1lc3NhZ2UpOyB9XG4gICAgfVxuICAgIFxuICAgIC8vIHdyaXRlIHdhbGxldCBmaWxlc1xuICAgIGxldCBkYXRhID0gYXdhaXQgd2FsbGV0LmdldERhdGEoKTtcbiAgICB3YWxsZXQuZnMud3JpdGVGaWxlU3luYyhwYXRoICsgXCIua2V5c1wiLCBkYXRhWzBdLCBcImJpbmFyeVwiKTtcbiAgICB3YWxsZXQuZnMud3JpdGVGaWxlU3luYyhwYXRoLCBkYXRhWzFdLCBcImJpbmFyeVwiKTtcbiAgICB3YWxsZXQuZnMud3JpdGVGaWxlU3luYyhwYXRoICsgXCIuYWRkcmVzcy50eHRcIiwgYXdhaXQgd2FsbGV0LmdldFByaW1hcnlBZGRyZXNzKCkpO1xuICAgIGxldCBvbGRQYXRoID0gd2FsbGV0LnBhdGg7XG4gICAgd2FsbGV0LnBhdGggPSBwYXRoO1xuICAgIFxuICAgIC8vIGRlbGV0ZSBvbGQgd2FsbGV0IGZpbGVzXG4gICAgaWYgKG9sZFBhdGgpIHtcbiAgICAgIHdhbGxldC5mcy51bmxpbmtTeW5jKG9sZFBhdGggKyBcIi5hZGRyZXNzLnR4dFwiKTtcbiAgICAgIHdhbGxldC5mcy51bmxpbmtTeW5jKG9sZFBhdGggKyBcIi5rZXlzXCIpO1xuICAgICAgd2FsbGV0LmZzLnVubGlua1N5bmMob2xkUGF0aCk7XG4gICAgfVxuICB9XG4gIFxuICBzdGF0aWMgYXN5bmMgc2F2ZSh3YWxsZXQ6IGFueSkge1xuICAgIGlmIChhd2FpdCB3YWxsZXQuaXNDbG9zZWQoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGlzIGNsb3NlZFwiKTtcbiAgICAgICAgXG4gICAgLy8gcGF0aCBtdXN0IGJlIHNldFxuICAgIGxldCBwYXRoID0gYXdhaXQgd2FsbGV0LmdldFBhdGgoKTtcbiAgICBpZiAoIXBhdGgpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzYXZlIHdhbGxldCBiZWNhdXNlIHBhdGggaXMgbm90IHNldFwiKTtcbiAgICBcbiAgICAvLyB3cml0ZSB3YWxsZXQgZmlsZXMgdG8gKi5uZXdcbiAgICBsZXQgcGF0aE5ldyA9IHBhdGggKyBcIi5uZXdcIjtcbiAgICBsZXQgZGF0YSA9IGF3YWl0IHdhbGxldC5nZXREYXRhKCk7XG4gICAgd2FsbGV0LmZzLndyaXRlRmlsZVN5bmMocGF0aE5ldyArIFwiLmtleXNcIiwgZGF0YVswXSwgXCJiaW5hcnlcIik7XG4gICAgd2FsbGV0LmZzLndyaXRlRmlsZVN5bmMocGF0aE5ldywgZGF0YVsxXSwgXCJiaW5hcnlcIik7XG4gICAgd2FsbGV0LmZzLndyaXRlRmlsZVN5bmMocGF0aE5ldyArIFwiLmFkZHJlc3MudHh0XCIsIGF3YWl0IHdhbGxldC5nZXRQcmltYXJ5QWRkcmVzcygpKTtcbiAgICBcbiAgICAvLyByZXBsYWNlIG9sZCB3YWxsZXQgZmlsZXMgd2l0aCBuZXdcbiAgICB3YWxsZXQuZnMucmVuYW1lU3luYyhwYXRoTmV3ICsgXCIua2V5c1wiLCBwYXRoICsgXCIua2V5c1wiKTtcbiAgICB3YWxsZXQuZnMucmVuYW1lU3luYyhwYXRoTmV3LCBwYXRoLCBwYXRoICsgXCIua2V5c1wiKTtcbiAgICB3YWxsZXQuZnMucmVuYW1lU3luYyhwYXRoTmV3ICsgXCIuYWRkcmVzcy50eHRcIiwgcGF0aCArIFwiLmFkZHJlc3MudHh0XCIsIHBhdGggKyBcIi5rZXlzXCIpO1xuICB9XG59XG5cbi8qKlxuICogSW1wbGVtZW50cyBhIE1vbmVyb1dhbGxldCBieSBwcm94eWluZyByZXF1ZXN0cyB0byBhIHdvcmtlciB3aGljaCBydW5zIGEgZnVsbCB3YWxsZXQuXG4gKiBcbiAqIEBwcml2YXRlXG4gKi9cbmNsYXNzIE1vbmVyb1dhbGxldEZ1bGxQcm94eSBleHRlbmRzIE1vbmVyb1dhbGxldEtleXNQcm94eSB7XG5cbiAgLy8gaW5zdGFuY2UgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBwYXRoOiBhbnk7XG4gIHByb3RlY3RlZCBmczogYW55O1xuICBwcm90ZWN0ZWQgd3JhcHBlZExpc3RlbmVyczogYW55O1xuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gV0FMTEVUIFNUQVRJQyBVVElMUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIHN0YXRpYyBhc3luYyBvcGVuV2FsbGV0RGF0YShjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPikge1xuICAgIGxldCB3YWxsZXRJZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICBpZiAoY29uZmlnLnBhc3N3b3JkID09PSB1bmRlZmluZWQpIGNvbmZpZy5wYXNzd29yZCA9IFwiXCI7XG4gICAgbGV0IGRhZW1vbkNvbm5lY3Rpb24gPSBjb25maWcuZ2V0U2VydmVyKCk7XG4gICAgYXdhaXQgTGlicmFyeVV0aWxzLmludm9rZVdvcmtlcih3YWxsZXRJZCwgXCJvcGVuV2FsbGV0RGF0YVwiLCBbY29uZmlnLnBhdGgsIGNvbmZpZy5wYXNzd29yZCwgY29uZmlnLm5ldHdvcmtUeXBlLCBjb25maWcua2V5c0RhdGEsIGNvbmZpZy5jYWNoZURhdGEsIGRhZW1vbkNvbm5lY3Rpb24gPyBkYWVtb25Db25uZWN0aW9uLnRvSnNvbigpIDogdW5kZWZpbmVkXSk7XG4gICAgbGV0IHdhbGxldCA9IG5ldyBNb25lcm9XYWxsZXRGdWxsUHJveHkod2FsbGV0SWQsIGF3YWl0IExpYnJhcnlVdGlscy5nZXRXb3JrZXIoKSwgY29uZmlnLnBhdGgsIGNvbmZpZy5nZXRGcygpKTtcbiAgICBpZiAoY29uZmlnLnBhdGgpIGF3YWl0IHdhbGxldC5zYXZlKCk7XG4gICAgcmV0dXJuIHdhbGxldDtcbiAgfVxuICBcbiAgc3RhdGljIGFzeW5jIGNyZWF0ZVdhbGxldChjb25maWcpIHtcbiAgICBpZiAoY29uZmlnLmdldFBhdGgoKSAmJiBNb25lcm9XYWxsZXRGdWxsLndhbGxldEV4aXN0cyhjb25maWcuZ2V0UGF0aCgpLCBjb25maWcuZ2V0RnMoKSkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBhbHJlYWR5IGV4aXN0czogXCIgKyBjb25maWcuZ2V0UGF0aCgpKTtcbiAgICBsZXQgd2FsbGV0SWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgYXdhaXQgTGlicmFyeVV0aWxzLmludm9rZVdvcmtlcih3YWxsZXRJZCwgXCJjcmVhdGVXYWxsZXRGdWxsXCIsIFtjb25maWcudG9Kc29uKCldKTtcbiAgICBsZXQgd2FsbGV0ID0gbmV3IE1vbmVyb1dhbGxldEZ1bGxQcm94eSh3YWxsZXRJZCwgYXdhaXQgTGlicmFyeVV0aWxzLmdldFdvcmtlcigpLCBjb25maWcuZ2V0UGF0aCgpLCBjb25maWcuZ2V0RnMoKSk7XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkpIGF3YWl0IHdhbGxldC5zYXZlKCk7XG4gICAgcmV0dXJuIHdhbGxldDtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIElOU1RBTkNFIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgLyoqXG4gICAqIEludGVybmFsIGNvbnN0cnVjdG9yIHdoaWNoIGlzIGdpdmVuIGEgd29ya2VyIHRvIGNvbW11bmljYXRlIHdpdGggdmlhIG1lc3NhZ2VzLlxuICAgKiBcbiAgICogVGhpcyBtZXRob2Qgc2hvdWxkIG5vdCBiZSBjYWxsZWQgZXh0ZXJuYWxseSBidXQgc2hvdWxkIGJlIGNhbGxlZCB0aHJvdWdoXG4gICAqIHN0YXRpYyB3YWxsZXQgY3JlYXRpb24gdXRpbGl0aWVzIGluIHRoaXMgY2xhc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gd2FsbGV0SWQgLSBpZGVudGlmaWVzIHRoZSB3YWxsZXQgd2l0aCB0aGUgd29ya2VyXG4gICAqIEBwYXJhbSB7V29ya2VyfSB3b3JrZXIgLSB3b3JrZXIgdG8gY29tbXVuaWNhdGUgd2l0aCB2aWEgbWVzc2FnZXNcbiAgICovXG4gIGNvbnN0cnVjdG9yKHdhbGxldElkLCB3b3JrZXIsIHBhdGgsIGZzKSB7XG4gICAgc3VwZXIod2FsbGV0SWQsIHdvcmtlcik7XG4gICAgdGhpcy5wYXRoID0gcGF0aDtcbiAgICB0aGlzLmZzID0gZnMgPyBmcyA6IChwYXRoID8gTW9uZXJvV2FsbGV0RnVsbC5nZXRGcygpIDogdW5kZWZpbmVkKTtcbiAgICB0aGlzLndyYXBwZWRMaXN0ZW5lcnMgPSBbXTtcbiAgfVxuXG4gIGdldFBhdGgoKSB7XG4gICAgcmV0dXJuIHRoaXMucGF0aDtcbiAgfVxuXG4gIGFzeW5jIGdldE5ldHdvcmtUeXBlKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldE5ldHdvcmtUeXBlXCIpO1xuICB9XG4gIFxuICBhc3luYyBzZXRTdWJhZGRyZXNzTGFiZWwoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCwgbGFiZWwpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzZXRTdWJhZGRyZXNzTGFiZWxcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSBhcyBQcm9taXNlPHZvaWQ+O1xuICB9XG4gIFxuICBhc3luYyBzZXREYWVtb25Db25uZWN0aW9uKHVyaU9yUnBjQ29ubmVjdGlvbikge1xuICAgIGlmICghdXJpT3JScGNDb25uZWN0aW9uKSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInNldERhZW1vbkNvbm5lY3Rpb25cIik7XG4gICAgZWxzZSB7XG4gICAgICBsZXQgY29ubmVjdGlvbiA9ICF1cmlPclJwY0Nvbm5lY3Rpb24gPyB1bmRlZmluZWQgOiB1cmlPclJwY0Nvbm5lY3Rpb24gaW5zdGFuY2VvZiBNb25lcm9ScGNDb25uZWN0aW9uID8gdXJpT3JScGNDb25uZWN0aW9uIDogbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24odXJpT3JScGNDb25uZWN0aW9uKTtcbiAgICAgIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwic2V0RGFlbW9uQ29ubmVjdGlvblwiLCBjb25uZWN0aW9uID8gY29ubmVjdGlvbi5nZXRDb25maWcoKSA6IHVuZGVmaW5lZCk7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXREYWVtb25Db25uZWN0aW9uKCkge1xuICAgIGxldCBycGNDb25maWcgPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldERhZW1vbkNvbm5lY3Rpb25cIik7XG4gICAgcmV0dXJuIHJwY0NvbmZpZyA/IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHJwY0NvbmZpZykgOiB1bmRlZmluZWQ7XG4gIH1cbiAgXG4gIGFzeW5jIGlzQ29ubmVjdGVkVG9EYWVtb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaXNDb25uZWN0ZWRUb0RhZW1vblwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UmVzdG9yZUhlaWdodCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRSZXN0b3JlSGVpZ2h0XCIpO1xuICB9XG4gIFxuICBhc3luYyBzZXRSZXN0b3JlSGVpZ2h0KHJlc3RvcmVIZWlnaHQpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzZXRSZXN0b3JlSGVpZ2h0XCIsIFtyZXN0b3JlSGVpZ2h0XSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldERhZW1vbkhlaWdodCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXREYWVtb25IZWlnaHRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldERhZW1vbk1heFBlZXJIZWlnaHQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0RGFlbW9uTWF4UGVlckhlaWdodFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0QnlEYXRlKHllYXIsIG1vbnRoLCBkYXkpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRIZWlnaHRCeURhdGVcIiwgW3llYXIsIG1vbnRoLCBkYXldKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNEYWVtb25TeW5jZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaXNEYWVtb25TeW5jZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhlaWdodCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRIZWlnaHRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGFkZExpc3RlbmVyKGxpc3RlbmVyKSB7XG4gICAgbGV0IHdyYXBwZWRMaXN0ZW5lciA9IG5ldyBXYWxsZXRXb3JrZXJMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgbGV0IGxpc3RlbmVySWQgPSB3cmFwcGVkTGlzdGVuZXIuZ2V0SWQoKTtcbiAgICBMaWJyYXJ5VXRpbHMuYWRkV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvblN5bmNQcm9ncmVzc19cIiArIGxpc3RlbmVySWQsIFt3cmFwcGVkTGlzdGVuZXIub25TeW5jUHJvZ3Jlc3MsIHdyYXBwZWRMaXN0ZW5lcl0pO1xuICAgIExpYnJhcnlVdGlscy5hZGRXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uTmV3QmxvY2tfXCIgKyBsaXN0ZW5lcklkLCBbd3JhcHBlZExpc3RlbmVyLm9uTmV3QmxvY2ssIHdyYXBwZWRMaXN0ZW5lcl0pO1xuICAgIExpYnJhcnlVdGlscy5hZGRXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uQmFsYW5jZXNDaGFuZ2VkX1wiICsgbGlzdGVuZXJJZCwgW3dyYXBwZWRMaXN0ZW5lci5vbkJhbGFuY2VzQ2hhbmdlZCwgd3JhcHBlZExpc3RlbmVyXSk7XG4gICAgTGlicmFyeVV0aWxzLmFkZFdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25PdXRwdXRSZWNlaXZlZF9cIiArIGxpc3RlbmVySWQsIFt3cmFwcGVkTGlzdGVuZXIub25PdXRwdXRSZWNlaXZlZCwgd3JhcHBlZExpc3RlbmVyXSk7XG4gICAgTGlicmFyeVV0aWxzLmFkZFdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25PdXRwdXRTcGVudF9cIiArIGxpc3RlbmVySWQsIFt3cmFwcGVkTGlzdGVuZXIub25PdXRwdXRTcGVudCwgd3JhcHBlZExpc3RlbmVyXSk7XG4gICAgdGhpcy53cmFwcGVkTGlzdGVuZXJzLnB1c2god3JhcHBlZExpc3RlbmVyKTtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJhZGRMaXN0ZW5lclwiLCBbbGlzdGVuZXJJZF0pO1xuICB9XG4gIFxuICBhc3luYyByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcikge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53cmFwcGVkTGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodGhpcy53cmFwcGVkTGlzdGVuZXJzW2ldLmdldExpc3RlbmVyKCkgPT09IGxpc3RlbmVyKSB7XG4gICAgICAgIGxldCBsaXN0ZW5lcklkID0gdGhpcy53cmFwcGVkTGlzdGVuZXJzW2ldLmdldElkKCk7XG4gICAgICAgIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwicmVtb3ZlTGlzdGVuZXJcIiwgW2xpc3RlbmVySWRdKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnJlbW92ZVdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25TeW5jUHJvZ3Jlc3NfXCIgKyBsaXN0ZW5lcklkKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnJlbW92ZVdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25OZXdCbG9ja19cIiArIGxpc3RlbmVySWQpO1xuICAgICAgICBMaWJyYXJ5VXRpbHMucmVtb3ZlV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvbkJhbGFuY2VzQ2hhbmdlZF9cIiArIGxpc3RlbmVySWQpO1xuICAgICAgICBMaWJyYXJ5VXRpbHMucmVtb3ZlV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvbk91dHB1dFJlY2VpdmVkX1wiICsgbGlzdGVuZXJJZCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5yZW1vdmVXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uT3V0cHV0U3BlbnRfXCIgKyBsaXN0ZW5lcklkKTtcbiAgICAgICAgdGhpcy53cmFwcGVkTGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJMaXN0ZW5lciBpcyBub3QgcmVnaXN0ZXJlZCB3aXRoIHdhbGxldFwiKTtcbiAgfVxuICBcbiAgZ2V0TGlzdGVuZXJzKCkge1xuICAgIGxldCBsaXN0ZW5lcnMgPSBbXTtcbiAgICBmb3IgKGxldCB3cmFwcGVkTGlzdGVuZXIgb2YgdGhpcy53cmFwcGVkTGlzdGVuZXJzKSBsaXN0ZW5lcnMucHVzaCh3cmFwcGVkTGlzdGVuZXIuZ2V0TGlzdGVuZXIoKSk7XG4gICAgcmV0dXJuIGxpc3RlbmVycztcbiAgfVxuICBcbiAgYXN5bmMgaXNTeW5jZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaXNTeW5jZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIHN5bmMobGlzdGVuZXJPclN0YXJ0SGVpZ2h0PzogTW9uZXJvV2FsbGV0TGlzdGVuZXIgfCBudW1iZXIsIHN0YXJ0SGVpZ2h0PzogbnVtYmVyLCBhbGxvd0NvbmN1cnJlbnRDYWxscyA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9TeW5jUmVzdWx0PiB7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIHBhcmFtc1xuICAgIHN0YXJ0SGVpZ2h0ID0gbGlzdGVuZXJPclN0YXJ0SGVpZ2h0IGluc3RhbmNlb2YgTW9uZXJvV2FsbGV0TGlzdGVuZXIgPyBzdGFydEhlaWdodCA6IGxpc3RlbmVyT3JTdGFydEhlaWdodDtcbiAgICBsZXQgbGlzdGVuZXIgPSBsaXN0ZW5lck9yU3RhcnRIZWlnaHQgaW5zdGFuY2VvZiBNb25lcm9XYWxsZXRMaXN0ZW5lciA/IGxpc3RlbmVyT3JTdGFydEhlaWdodCA6IHVuZGVmaW5lZDtcbiAgICBpZiAoc3RhcnRIZWlnaHQgPT09IHVuZGVmaW5lZCkgc3RhcnRIZWlnaHQgPSBNYXRoLm1heChhd2FpdCB0aGlzLmdldEhlaWdodCgpLCBhd2FpdCB0aGlzLmdldFJlc3RvcmVIZWlnaHQoKSk7XG4gICAgXG4gICAgLy8gcmVnaXN0ZXIgbGlzdGVuZXIgaWYgZ2l2ZW5cbiAgICBpZiAobGlzdGVuZXIpIGF3YWl0IHRoaXMuYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIFxuICAgIC8vIHN5bmMgd2FsbGV0IGluIHdvcmtlciBcbiAgICBsZXQgZXJyO1xuICAgIGxldCByZXN1bHQ7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXN1bHRKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJzeW5jXCIsIFtzdGFydEhlaWdodCwgYWxsb3dDb25jdXJyZW50Q2FsbHNdKTtcbiAgICAgIHJlc3VsdCA9IG5ldyBNb25lcm9TeW5jUmVzdWx0KHJlc3VsdEpzb24ubnVtQmxvY2tzRmV0Y2hlZCwgcmVzdWx0SnNvbi5yZWNlaXZlZE1vbmV5KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBlcnIgPSBlO1xuICAgIH1cbiAgICBcbiAgICAvLyB1bnJlZ2lzdGVyIGxpc3RlbmVyXG4gICAgaWYgKGxpc3RlbmVyKSBhd2FpdCB0aGlzLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBcbiAgICAvLyB0aHJvdyBlcnJvciBvciByZXR1cm5cbiAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBcbiAgYXN5bmMgc3RhcnRTeW5jaW5nKHN5bmNQZXJpb2RJbk1zKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic3RhcnRTeW5jaW5nXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgICBcbiAgYXN5bmMgc3RvcFN5bmNpbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic3RvcFN5bmNpbmdcIik7XG4gIH1cbiAgXG4gIGFzeW5jIHNjYW5UeHModHhIYXNoZXMpIHtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheSh0eEhhc2hlcyksIFwiTXVzdCBwcm92aWRlIGFuIGFycmF5IG9mIHR4cyBoYXNoZXMgdG8gc2NhblwiKTtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzY2FuVHhzXCIsIFt0eEhhc2hlc10pO1xuICB9XG4gIFxuICBhc3luYyByZXNjYW5TcGVudCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJyZXNjYW5TcGVudFwiKTtcbiAgfVxuICAgIFxuICBhc3luYyByZXNjYW5CbG9ja2NoYWluKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInJlc2NhbkJsb2NrY2hhaW5cIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJhbGFuY2UoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkge1xuICAgIHJldHVybiBCaWdJbnQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRCYWxhbmNlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBnZXRVbmxvY2tlZEJhbGFuY2UoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkge1xuICAgIGxldCB1bmxvY2tlZEJhbGFuY2VTdHIgPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldFVubG9ja2VkQmFsYW5jZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIHJldHVybiBCaWdJbnQodW5sb2NrZWRCYWxhbmNlU3RyKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudHMoaW5jbHVkZVN1YmFkZHJlc3NlcywgdGFnKSB7XG4gICAgbGV0IGFjY291bnRzID0gW107XG4gICAgZm9yIChsZXQgYWNjb3VudEpzb24gb2YgKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0QWNjb3VudHNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSkpIHtcbiAgICAgIGFjY291bnRzLnB1c2goTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZUFjY291bnQobmV3IE1vbmVyb0FjY291bnQoYWNjb3VudEpzb24pKSk7XG4gICAgfVxuICAgIHJldHVybiBhY2NvdW50cztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudChhY2NvdW50SWR4LCBpbmNsdWRlU3ViYWRkcmVzc2VzKSB7XG4gICAgbGV0IGFjY291bnRKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRBY2NvdW50XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuc2FuaXRpemVBY2NvdW50KG5ldyBNb25lcm9BY2NvdW50KGFjY291bnRKc29uKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNyZWF0ZUFjY291bnQobGFiZWwpIHtcbiAgICBsZXQgYWNjb3VudEpzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImNyZWF0ZUFjY291bnRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZUFjY291bnQobmV3IE1vbmVyb0FjY291bnQoYWNjb3VudEpzb24pKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJbmRpY2VzKSB7XG4gICAgbGV0IHN1YmFkZHJlc3NlcyA9IFtdO1xuICAgIGZvciAobGV0IHN1YmFkZHJlc3NKc29uIG9mIChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldFN1YmFkZHJlc3Nlc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKSkge1xuICAgICAgc3ViYWRkcmVzc2VzLnB1c2goTW9uZXJvV2FsbGV0S2V5cy5zYW5pdGl6ZVN1YmFkZHJlc3MobmV3IE1vbmVyb1N1YmFkZHJlc3Moc3ViYWRkcmVzc0pzb24pKSk7XG4gICAgfVxuICAgIHJldHVybiBzdWJhZGRyZXNzZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGNyZWF0ZVN1YmFkZHJlc3MoYWNjb3VudElkeCwgbGFiZWwpIHtcbiAgICBsZXQgc3ViYWRkcmVzc0pzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImNyZWF0ZVN1YmFkZHJlc3NcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0S2V5cy5zYW5pdGl6ZVN1YmFkZHJlc3MobmV3IE1vbmVyb1N1YmFkZHJlc3Moc3ViYWRkcmVzc0pzb24pKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhzKHF1ZXJ5KSB7XG4gICAgcXVlcnkgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplVHhRdWVyeShxdWVyeSk7XG4gICAgbGV0IHJlc3BKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRUeHNcIiwgW3F1ZXJ5LmdldEJsb2NrKCkudG9Kc29uKCldKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZVR4cyhxdWVyeSwgSlNPTi5zdHJpbmdpZnkoe2Jsb2NrczogcmVzcEpzb24uYmxvY2tzfSkpOyAvLyBpbml0aWFsaXplIHR4cyBmcm9tIGJsb2NrcyBqc29uIHN0cmluZyBUT0RPOiB0aGlzIHN0cmluZ2lmaWVzIHRoZW4gdXRpbGl0eSBwYXJzZXMsIGF2b2lkXG4gIH1cbiAgXG4gIGFzeW5jIGdldFRyYW5zZmVycyhxdWVyeSkge1xuICAgIHF1ZXJ5ID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVRyYW5zZmVyUXVlcnkocXVlcnkpO1xuICAgIGxldCBibG9ja0pzb25zID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRUcmFuc2ZlcnNcIiwgW3F1ZXJ5LmdldFR4UXVlcnkoKS5nZXRCbG9jaygpLnRvSnNvbigpXSk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuZGVzZXJpYWxpemVUcmFuc2ZlcnMocXVlcnksIEpTT04uc3RyaW5naWZ5KHtibG9ja3M6IGJsb2NrSnNvbnN9KSk7IC8vIGluaXRpYWxpemUgdHJhbnNmZXJzIGZyb20gYmxvY2tzIGpzb24gc3RyaW5nIFRPRE86IHRoaXMgc3RyaW5naWZpZXMgdGhlbiB1dGlsaXR5IHBhcnNlcywgYXZvaWRcbiAgfVxuICBcbiAgYXN5bmMgZ2V0T3V0cHV0cyhxdWVyeSkge1xuICAgIHF1ZXJ5ID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZU91dHB1dFF1ZXJ5KHF1ZXJ5KTtcbiAgICBsZXQgYmxvY2tKc29ucyA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0T3V0cHV0c1wiLCBbcXVlcnkuZ2V0VHhRdWVyeSgpLmdldEJsb2NrKCkudG9Kc29uKCldKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZU91dHB1dHMocXVlcnksIEpTT04uc3RyaW5naWZ5KHtibG9ja3M6IGJsb2NrSnNvbnN9KSk7IC8vIGluaXRpYWxpemUgdHJhbnNmZXJzIGZyb20gYmxvY2tzIGpzb24gc3RyaW5nIFRPRE86IHRoaXMgc3RyaW5naWZpZXMgdGhlbiB1dGlsaXR5IHBhcnNlcywgYXZvaWRcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0T3V0cHV0cyhhbGwpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJleHBvcnRPdXRwdXRzXCIsIFthbGxdKTtcbiAgfVxuICBcbiAgYXN5bmMgaW1wb3J0T3V0cHV0cyhvdXRwdXRzSGV4KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaW1wb3J0T3V0cHV0c1wiLCBbb3V0cHV0c0hleF0pO1xuICB9XG4gIFxuICBhc3luYyBleHBvcnRLZXlJbWFnZXMoYWxsKSB7XG4gICAgbGV0IGtleUltYWdlcyA9IFtdO1xuICAgIGZvciAobGV0IGtleUltYWdlSnNvbiBvZiBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldEtleUltYWdlc1wiLCBbYWxsXSkpIGtleUltYWdlcy5wdXNoKG5ldyBNb25lcm9LZXlJbWFnZShrZXlJbWFnZUpzb24pKTtcbiAgICByZXR1cm4ga2V5SW1hZ2VzO1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRLZXlJbWFnZXMoa2V5SW1hZ2VzKSB7XG4gICAgbGV0IGtleUltYWdlc0pzb24gPSBbXTtcbiAgICBmb3IgKGxldCBrZXlJbWFnZSBvZiBrZXlJbWFnZXMpIGtleUltYWdlc0pzb24ucHVzaChrZXlJbWFnZS50b0pzb24oKSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImltcG9ydEtleUltYWdlc1wiLCBba2V5SW1hZ2VzSnNvbl0pKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQoKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTW9uZXJvV2FsbGV0RnVsbC5nZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCgpIG5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZnJlZXplT3V0cHV0KGtleUltYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZnJlZXplT3V0cHV0XCIsIFtrZXlJbWFnZV0pO1xuICB9XG4gIFxuICBhc3luYyB0aGF3T3V0cHV0KGtleUltYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwidGhhd091dHB1dFwiLCBba2V5SW1hZ2VdKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNPdXRwdXRGcm96ZW4oa2V5SW1hZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJpc091dHB1dEZyb3plblwiLCBba2V5SW1hZ2VdKTtcbiAgfVxuICBcbiAgYXN5bmMgY3JlYXRlVHhzKGNvbmZpZykge1xuICAgIGNvbmZpZyA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVDcmVhdGVUeHNDb25maWcoY29uZmlnKTtcbiAgICBsZXQgdHhTZXRKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJjcmVhdGVUeHNcIiwgW2NvbmZpZy50b0pzb24oKV0pO1xuICAgIHJldHVybiBuZXcgTW9uZXJvVHhTZXQodHhTZXRKc29uKS5nZXRUeHMoKTtcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBPdXRwdXQoY29uZmlnKSB7XG4gICAgY29uZmlnID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVN3ZWVwT3V0cHV0Q29uZmlnKGNvbmZpZyk7XG4gICAgbGV0IHR4U2V0SnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwic3dlZXBPdXRwdXRcIiwgW2NvbmZpZy50b0pzb24oKV0pO1xuICAgIHJldHVybiBuZXcgTW9uZXJvVHhTZXQodHhTZXRKc29uKS5nZXRUeHMoKVswXTtcbiAgfVxuXG4gIGFzeW5jIHN3ZWVwVW5sb2NrZWQoY29uZmlnKSB7XG4gICAgY29uZmlnID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVN3ZWVwVW5sb2NrZWRDb25maWcoY29uZmlnKTtcbiAgICBsZXQgdHhTZXRzSnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwic3dlZXBVbmxvY2tlZFwiLCBbY29uZmlnLnRvSnNvbigpXSk7XG4gICAgbGV0IHR4cyA9IFtdO1xuICAgIGZvciAobGV0IHR4U2V0SnNvbiBvZiB0eFNldHNKc29uKSBmb3IgKGxldCB0eCBvZiBuZXcgTW9uZXJvVHhTZXQodHhTZXRKc29uKS5nZXRUeHMoKSkgdHhzLnB1c2godHgpO1xuICAgIHJldHVybiB0eHM7XG4gIH1cbiAgXG4gIGFzeW5jIHN3ZWVwRHVzdChyZWxheSkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvVHhTZXQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJzd2VlcER1c3RcIiwgW3JlbGF5XSkpLmdldFR4cygpIHx8IFtdO1xuICB9XG4gIFxuICBhc3luYyByZWxheVR4cyh0eHNPck1ldGFkYXRhcykge1xuICAgIGFzc2VydChBcnJheS5pc0FycmF5KHR4c09yTWV0YWRhdGFzKSwgXCJNdXN0IHByb3ZpZGUgYW4gYXJyYXkgb2YgdHhzIG9yIHRoZWlyIG1ldGFkYXRhIHRvIHJlbGF5XCIpO1xuICAgIGxldCB0eE1ldGFkYXRhcyA9IFtdO1xuICAgIGZvciAobGV0IHR4T3JNZXRhZGF0YSBvZiB0eHNPck1ldGFkYXRhcykgdHhNZXRhZGF0YXMucHVzaCh0eE9yTWV0YWRhdGEgaW5zdGFuY2VvZiBNb25lcm9UeFdhbGxldCA/IHR4T3JNZXRhZGF0YS5nZXRNZXRhZGF0YSgpIDogdHhPck1ldGFkYXRhKTtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJyZWxheVR4c1wiLCBbdHhNZXRhZGF0YXNdKTtcbiAgfVxuICBcbiAgYXN5bmMgZGVzY3JpYmVUeFNldCh0eFNldCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvVHhTZXQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkZXNjcmliZVR4U2V0XCIsIFt0eFNldC50b0pzb24oKV0pKTtcbiAgfVxuICBcbiAgYXN5bmMgc2lnblR4cyh1bnNpZ25lZFR4SGV4KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic2lnblR4c1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBzdWJtaXRUeHMoc2lnbmVkVHhIZXgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzdWJtaXRUeHNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgc2lnbk1lc3NhZ2UobWVzc2FnZSwgc2lnbmF0dXJlVHlwZSwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInNpZ25NZXNzYWdlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHZlcmlmeU1lc3NhZ2UobWVzc2FnZSwgYWRkcmVzcywgc2lnbmF0dXJlKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwidmVyaWZ5TWVzc2FnZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhLZXkodHhIYXNoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0VHhLZXlcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tUeEtleSh0eEhhc2gsIHR4S2V5LCBhZGRyZXNzKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9DaGVja1R4KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiY2hlY2tUeEtleVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhQcm9vZih0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRUeFByb29mXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrVHhQcm9vZih0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvQ2hlY2tUeChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImNoZWNrVHhQcm9vZlwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U3BlbmRQcm9vZih0eEhhc2gsIG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRTcGVuZFByb29mXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrU3BlbmRQcm9vZih0eEhhc2gsIG1lc3NhZ2UsIHNpZ25hdHVyZSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImNoZWNrU3BlbmRQcm9vZlwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRSZXNlcnZlUHJvb2ZXYWxsZXQobWVzc2FnZSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldFJlc2VydmVQcm9vZldhbGxldFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRSZXNlcnZlUHJvb2ZBY2NvdW50KGFjY291bnRJZHgsIGFtb3VudCwgbWVzc2FnZSkge1xuICAgIHRyeSB7IHJldHVybiBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldFJlc2VydmVQcm9vZkFjY291bnRcIiwgW2FjY291bnRJZHgsIGFtb3VudC50b1N0cmluZygpLCBtZXNzYWdlXSk7IH1cbiAgICBjYXRjaCAoZTogYW55KSB7IHRocm93IG5ldyBNb25lcm9FcnJvcihlLm1lc3NhZ2UsIC0xKTsgfVxuICB9XG5cbiAgYXN5bmMgY2hlY2tSZXNlcnZlUHJvb2YoYWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlKSB7XG4gICAgdHJ5IHsgcmV0dXJuIG5ldyBNb25lcm9DaGVja1Jlc2VydmUoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJjaGVja1Jlc2VydmVQcm9vZlwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTsgfVxuICAgIGNhdGNoIChlOiBhbnkpIHsgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGUubWVzc2FnZSwgLTEpOyB9XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4Tm90ZXModHhIYXNoZXMpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRUeE5vdGVzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNldFR4Tm90ZXModHhIYXNoZXMsIG5vdGVzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic2V0VHhOb3Rlc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRBZGRyZXNzQm9va0VudHJpZXMoZW50cnlJbmRpY2VzKSB7XG4gICAgaWYgKCFlbnRyeUluZGljZXMpIGVudHJ5SW5kaWNlcyA9IFtdO1xuICAgIGxldCBlbnRyaWVzID0gW107XG4gICAgZm9yIChsZXQgZW50cnlKc29uIG9mIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpIHtcbiAgICAgIGVudHJpZXMucHVzaChuZXcgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeShlbnRyeUpzb24pKTtcbiAgICB9XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGFkZEFkZHJlc3NCb29rRW50cnkoYWRkcmVzcywgZGVzY3JpcHRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJhZGRBZGRyZXNzQm9va0VudHJ5XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGVkaXRBZGRyZXNzQm9va0VudHJ5KGluZGV4LCBzZXRBZGRyZXNzLCBhZGRyZXNzLCBzZXREZXNjcmlwdGlvbiwgZGVzY3JpcHRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJlZGl0QWRkcmVzc0Jvb2tFbnRyeVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBkZWxldGVBZGRyZXNzQm9va0VudHJ5KGVudHJ5SWR4KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyB0YWdBY2NvdW50cyh0YWcsIGFjY291bnRJbmRpY2VzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwidGFnQWNjb3VudHNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuXG4gIGFzeW5jIHVudGFnQWNjb3VudHMoYWNjb3VudEluZGljZXMpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJ1bnRhZ0FjY291bnRzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFjY291bnRUYWdzKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldEFjY291bnRUYWdzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cblxuICBhc3luYyBzZXRBY2NvdW50VGFnTGFiZWwodGFnLCBsYWJlbCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInNldEFjY291bnRUYWdMYWJlbFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRQYXltZW50VXJpKGNvbmZpZykge1xuICAgIGNvbmZpZyA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVDcmVhdGVUeHNDb25maWcoY29uZmlnKTtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRQYXltZW50VXJpXCIsIFtjb25maWcudG9Kc29uKCldKTtcbiAgfVxuICBcbiAgYXN5bmMgcGFyc2VQYXltZW50VXJpKHVyaSkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvVHhDb25maWcoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJwYXJzZVBheW1lbnRVcmlcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEF0dHJpYnV0ZShrZXkpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRBdHRyaWJ1dGVcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0QXR0cmlidXRlKGtleSwgdmFsKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic2V0QXR0cmlidXRlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0YXJ0TWluaW5nKG51bVRocmVhZHMsIGJhY2tncm91bmRNaW5pbmcsIGlnbm9yZUJhdHRlcnkpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzdGFydE1pbmluZ1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBzdG9wTWluaW5nKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInN0b3BNaW5pbmdcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJpc011bHRpc2lnSW1wb3J0TmVlZGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBpc011bHRpc2lnKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImlzTXVsdGlzaWdcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE11bHRpc2lnSW5mbygpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb011bHRpc2lnSW5mbyhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldE11bHRpc2lnSW5mb1wiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHByZXBhcmVNdWx0aXNpZygpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJwcmVwYXJlTXVsdGlzaWdcIik7XG4gIH1cbiAgXG4gIGFzeW5jIG1ha2VNdWx0aXNpZyhtdWx0aXNpZ0hleGVzLCB0aHJlc2hvbGQsIHBhc3N3b3JkKSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwibWFrZU11bHRpc2lnXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGV4Y2hhbmdlTXVsdGlzaWdLZXlzKG11bHRpc2lnSGV4ZXMsIHBhc3N3b3JkKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJleGNoYW5nZU11bHRpc2lnS2V5c1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0TXVsdGlzaWdIZXgoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZXhwb3J0TXVsdGlzaWdIZXhcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGltcG9ydE11bHRpc2lnSGV4KG11bHRpc2lnSGV4ZXMpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJpbXBvcnRNdWx0aXNpZ0hleFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBzaWduTXVsdGlzaWdUeEhleChtdWx0aXNpZ1R4SGV4KSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJzaWduTXVsdGlzaWdUeEhleFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgc3VibWl0TXVsdGlzaWdUeEhleChzaWduZWRNdWx0aXNpZ1R4SGV4KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic3VibWl0TXVsdGlzaWdUeEhleFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXREYXRhKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldERhdGFcIik7XG4gIH1cbiAgXG4gIGFzeW5jIG1vdmVUbyhwYXRoKSB7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwubW92ZVRvKHBhdGgsIHRoaXMpO1xuICB9XG4gIFxuICBhc3luYyBjaGFuZ2VQYXNzd29yZChvbGRQYXNzd29yZCwgbmV3UGFzc3dvcmQpIHtcbiAgICBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImNoYW5nZVBhc3N3b3JkXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gICAgaWYgKHRoaXMucGF0aCkgYXdhaXQgdGhpcy5zYXZlKCk7IC8vIGF1dG8gc2F2ZVxuICB9XG4gIFxuICBhc3luYyBzYXZlKCkge1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLnNhdmUodGhpcyk7XG4gIH1cblxuICBhc3luYyBjbG9zZShzYXZlKSB7XG4gICAgaWYgKHNhdmUpIGF3YWl0IHRoaXMuc2F2ZSgpO1xuICAgIHdoaWxlICh0aGlzLndyYXBwZWRMaXN0ZW5lcnMubGVuZ3RoKSBhd2FpdCB0aGlzLnJlbW92ZUxpc3RlbmVyKHRoaXMud3JhcHBlZExpc3RlbmVyc1swXS5nZXRMaXN0ZW5lcigpKTtcbiAgICBhd2FpdCBzdXBlci5jbG9zZShmYWxzZSk7XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gTElTVEVOSU5HIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vKipcbiAqIFJlY2VpdmVzIG5vdGlmaWNhdGlvbnMgZGlyZWN0bHkgZnJvbSB3YXNtIGMrKy5cbiAqIFxuICogQHByaXZhdGVcbiAqL1xuY2xhc3MgV2FsbGV0RnVsbExpc3RlbmVyIHtcblxuICBwcm90ZWN0ZWQgd2FsbGV0OiBhbnk7XG4gIFxuICBjb25zdHJ1Y3Rvcih3YWxsZXQpIHtcbiAgICB0aGlzLndhbGxldCA9IHdhbGxldDtcbiAgfVxuICBcbiAgYXN5bmMgb25TeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSkge1xuICAgIGZvciAobGV0IGxpc3RlbmVyIG9mIHRoaXMud2FsbGV0LmdldExpc3RlbmVycygpKSBhd2FpdCBsaXN0ZW5lci5vblN5bmNQcm9ncmVzcyhoZWlnaHQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIHBlcmNlbnREb25lLCBtZXNzYWdlKTtcbiAgfVxuICBcbiAgYXN5bmMgb25OZXdCbG9jayhoZWlnaHQpIHtcbiAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiB0aGlzLndhbGxldC5nZXRMaXN0ZW5lcnMoKSkgYXdhaXQgbGlzdGVuZXIub25OZXdCbG9jayhoZWlnaHQpO1xuICB9XG4gIFxuICBhc3luYyBvbkJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlU3RyLCBuZXdVbmxvY2tlZEJhbGFuY2VTdHIpIHtcbiAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiB0aGlzLndhbGxldC5nZXRMaXN0ZW5lcnMoKSkgYXdhaXQgbGlzdGVuZXIub25CYWxhbmNlc0NoYW5nZWQoQmlnSW50KG5ld0JhbGFuY2VTdHIpLCBCaWdJbnQobmV3VW5sb2NrZWRCYWxhbmNlU3RyKSk7XG4gIH1cbiAgXG4gIGFzeW5jIG9uT3V0cHV0UmVjZWl2ZWQoaGVpZ2h0LCB0eEhhc2gsIGFtb3VudFN0ciwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCwgdmVyc2lvbiwgdW5sb2NrVGltZSwgaXNMb2NrZWQpIHtcbiAgICBcbiAgICAvLyBidWlsZCByZWNlaXZlZCBvdXRwdXRcbiAgICBsZXQgb3V0cHV0ID0gbmV3IE1vbmVyb091dHB1dFdhbGxldCgpO1xuICAgIG91dHB1dC5zZXRBbW91bnQoQmlnSW50KGFtb3VudFN0cikpO1xuICAgIG91dHB1dC5zZXRBY2NvdW50SW5kZXgoYWNjb3VudElkeCk7XG4gICAgb3V0cHV0LnNldFN1YmFkZHJlc3NJbmRleChzdWJhZGRyZXNzSWR4KTtcbiAgICBsZXQgdHggPSBuZXcgTW9uZXJvVHhXYWxsZXQoKTtcbiAgICB0eC5zZXRIYXNoKHR4SGFzaCk7XG4gICAgdHguc2V0VmVyc2lvbih2ZXJzaW9uKTtcbiAgICB0eC5zZXRVbmxvY2tUaW1lKHVubG9ja1RpbWUpO1xuICAgIG91dHB1dC5zZXRUeCh0eCk7XG4gICAgdHguc2V0T3V0cHV0cyhbb3V0cHV0XSk7XG4gICAgdHguc2V0SXNJbmNvbWluZyh0cnVlKTtcbiAgICB0eC5zZXRJc0xvY2tlZChpc0xvY2tlZCk7XG4gICAgaWYgKGhlaWdodCA+IDApIHtcbiAgICAgIGxldCBibG9jayA9IG5ldyBNb25lcm9CbG9jaygpLnNldEhlaWdodChoZWlnaHQpO1xuICAgICAgYmxvY2suc2V0VHhzKFt0eCBhcyBNb25lcm9UeF0pO1xuICAgICAgdHguc2V0QmxvY2soYmxvY2spO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKHRydWUpO1xuICAgIH1cbiAgICBcbiAgICAvLyBhbm5vdW5jZSBvdXRwdXRcbiAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiB0aGlzLndhbGxldC5nZXRMaXN0ZW5lcnMoKSkgYXdhaXQgbGlzdGVuZXIub25PdXRwdXRSZWNlaXZlZCh0eC5nZXRPdXRwdXRzKClbMF0pO1xuICB9XG4gIFxuICBhc3luYyBvbk91dHB1dFNwZW50KGhlaWdodCwgdHhIYXNoLCBhbW91bnRTdHIsIGFjY291bnRJZHhTdHIsIHN1YmFkZHJlc3NJZHhTdHIsIHZlcnNpb24sIHVubG9ja1RpbWUsIGlzTG9ja2VkKSB7XG4gICAgXG4gICAgLy8gYnVpbGQgc3BlbnQgb3V0cHV0XG4gICAgbGV0IG91dHB1dCA9IG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKTtcbiAgICBvdXRwdXQuc2V0QW1vdW50KEJpZ0ludChhbW91bnRTdHIpKTtcbiAgICBpZiAoYWNjb3VudElkeFN0cikgb3V0cHV0LnNldEFjY291bnRJbmRleChwYXJzZUludChhY2NvdW50SWR4U3RyKSk7XG4gICAgaWYgKHN1YmFkZHJlc3NJZHhTdHIpIG91dHB1dC5zZXRTdWJhZGRyZXNzSW5kZXgocGFyc2VJbnQoc3ViYWRkcmVzc0lkeFN0cikpO1xuICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgIHR4LnNldEhhc2godHhIYXNoKTtcbiAgICB0eC5zZXRWZXJzaW9uKHZlcnNpb24pO1xuICAgIHR4LnNldFVubG9ja1RpbWUodW5sb2NrVGltZSk7XG4gICAgdHguc2V0SXNMb2NrZWQoaXNMb2NrZWQpO1xuICAgIG91dHB1dC5zZXRUeCh0eCk7XG4gICAgdHguc2V0SW5wdXRzKFtvdXRwdXRdKTtcbiAgICBpZiAoaGVpZ2h0ID4gMCkge1xuICAgICAgbGV0IGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0SGVpZ2h0KGhlaWdodCk7XG4gICAgICBibG9jay5zZXRUeHMoW3R4XSk7XG4gICAgICB0eC5zZXRCbG9jayhibG9jayk7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SW5UeFBvb2wodHJ1ZSk7XG4gICAgfVxuICAgIFxuICAgIC8vIG5vdGlmeSB3YWxsZXQgbGlzdGVuZXJzXG4gICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgdGhpcy53YWxsZXQuZ2V0TGlzdGVuZXJzKCkpIGF3YWl0IGxpc3RlbmVyLm9uT3V0cHV0U3BlbnQodHguZ2V0SW5wdXRzKClbMF0pO1xuICB9XG59XG5cbi8qKlxuICogSW50ZXJuYWwgbGlzdGVuZXIgdG8gYnJpZGdlIG5vdGlmaWNhdGlvbnMgdG8gZXh0ZXJuYWwgbGlzdGVuZXJzLlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBXYWxsZXRXb3JrZXJMaXN0ZW5lciB7XG5cbiAgcHJvdGVjdGVkIGlkOiBhbnk7XG4gIHByb3RlY3RlZCBsaXN0ZW5lcjogYW55O1xuICBcbiAgY29uc3RydWN0b3IobGlzdGVuZXIpIHtcbiAgICB0aGlzLmlkID0gR2VuVXRpbHMuZ2V0VVVJRCgpO1xuICAgIHRoaXMubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgfVxuICBcbiAgZ2V0SWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaWQ7XG4gIH1cbiAgXG4gIGdldExpc3RlbmVyKCkge1xuICAgIHJldHVybiB0aGlzLmxpc3RlbmVyO1xuICB9XG4gIFxuICBvblN5bmNQcm9ncmVzcyhoZWlnaHQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIHBlcmNlbnREb25lLCBtZXNzYWdlKSB7XG4gICAgdGhpcy5saXN0ZW5lci5vblN5bmNQcm9ncmVzcyhoZWlnaHQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIHBlcmNlbnREb25lLCBtZXNzYWdlKTtcbiAgfVxuXG4gIGFzeW5jIG9uTmV3QmxvY2soaGVpZ2h0KSB7XG4gICAgYXdhaXQgdGhpcy5saXN0ZW5lci5vbk5ld0Jsb2NrKGhlaWdodCk7XG4gIH1cbiAgXG4gIGFzeW5jIG9uQmFsYW5jZXNDaGFuZ2VkKG5ld0JhbGFuY2VTdHIsIG5ld1VubG9ja2VkQmFsYW5jZVN0cikge1xuICAgIGF3YWl0IHRoaXMubGlzdGVuZXIub25CYWxhbmNlc0NoYW5nZWQoQmlnSW50KG5ld0JhbGFuY2VTdHIpLCBCaWdJbnQobmV3VW5sb2NrZWRCYWxhbmNlU3RyKSk7XG4gIH1cblxuICBhc3luYyBvbk91dHB1dFJlY2VpdmVkKGJsb2NrSnNvbikge1xuICAgIGxldCBibG9jayA9IG5ldyBNb25lcm9CbG9jayhibG9ja0pzb24sIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFhfV0FMTEVUKTtcbiAgICBhd2FpdCB0aGlzLmxpc3RlbmVyLm9uT3V0cHV0UmVjZWl2ZWQoYmxvY2suZ2V0VHhzKClbMF0uZ2V0T3V0cHV0cygpWzBdKTtcbiAgfVxuICBcbiAgYXN5bmMgb25PdXRwdXRTcGVudChibG9ja0pzb24pIHtcbiAgICBsZXQgYmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uLCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYX1dBTExFVCk7XG4gICAgYXdhaXQgdGhpcy5saXN0ZW5lci5vbk91dHB1dFNwZW50KGJsb2NrLmdldFR4cygpWzBdLmdldElucHV0cygpWzBdKTtcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoieUxBQUEsSUFBQUEsT0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMsS0FBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUUsU0FBQSxHQUFBSCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUcsYUFBQSxHQUFBSixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUksV0FBQSxHQUFBTCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUssY0FBQSxHQUFBTixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQU0saUJBQUEsR0FBQVAsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFPLHVCQUFB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