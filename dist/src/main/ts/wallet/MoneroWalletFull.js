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
      try {return new _MoneroTxSet.default(JSON.parse(_GenUtils.default.stringifyBigInts(this.module.sign_txs(this.cppAddress, unsignedTxHex))));}
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
    return new _MoneroTxSet.default(await this.invokeWorker("signTxs", Array.from(arguments)));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfcGF0aCIsIl9HZW5VdGlscyIsIl9MaWJyYXJ5VXRpbHMiLCJfVGFza0xvb3BlciIsIl9Nb25lcm9BY2NvdW50IiwiX01vbmVyb0FjY291bnRUYWciLCJfTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSIsIl9Nb25lcm9CbG9jayIsIl9Nb25lcm9DaGVja1R4IiwiX01vbmVyb0NoZWNrUmVzZXJ2ZSIsIl9Nb25lcm9EYWVtb25ScGMiLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MiLCJfTW9uZXJvS2V5SW1hZ2UiLCJfTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQiLCJfTW9uZXJvTXVsdGlzaWdJbmZvIiwiX01vbmVyb011bHRpc2lnSW5pdFJlc3VsdCIsIl9Nb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQiLCJfTW9uZXJvTmV0d29ya1R5cGUiLCJfTW9uZXJvT3V0cHV0V2FsbGV0IiwiX01vbmVyb1JwY0Nvbm5lY3Rpb24iLCJfTW9uZXJvU3ViYWRkcmVzcyIsIl9Nb25lcm9TeW5jUmVzdWx0IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4U2V0IiwiX01vbmVyb1R4V2FsbGV0IiwiX01vbmVyb1dhbGxldCIsIl9Nb25lcm9XYWxsZXRDb25maWciLCJfTW9uZXJvV2FsbGV0S2V5cyIsIl9Nb25lcm9XYWxsZXRMaXN0ZW5lciIsIl9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIl9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0IiwiX2ZzIiwiTW9uZXJvV2FsbGV0RnVsbCIsIk1vbmVyb1dhbGxldEtleXMiLCJERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TIiwiY29uc3RydWN0b3IiLCJjcHBBZGRyZXNzIiwicGF0aCIsInBhc3N3b3JkIiwiZnMiLCJyZWplY3RVbmF1dGhvcml6ZWQiLCJyZWplY3RVbmF1dGhvcml6ZWRGbklkIiwid2FsbGV0UHJveHkiLCJsaXN0ZW5lcnMiLCJnZXRGcyIsInVuZGVmaW5lZCIsIl9pc0Nsb3NlZCIsImZ1bGxMaXN0ZW5lciIsIldhbGxldEZ1bGxMaXN0ZW5lciIsImZ1bGxMaXN0ZW5lckhhbmRsZSIsInJlamVjdFVuYXV0aG9yaXplZENvbmZpZ0lkIiwic3luY1BlcmlvZEluTXMiLCJMaWJyYXJ5VXRpbHMiLCJzZXRSZWplY3RVbmF1dGhvcml6ZWRGbiIsIndhbGxldEV4aXN0cyIsImFzc2VydCIsIk1vbmVyb0Vycm9yIiwiZXhpc3RzIiwiZXhpc3RzU3luYyIsImxvZyIsIm9wZW5XYWxsZXQiLCJjb25maWciLCJNb25lcm9XYWxsZXRDb25maWciLCJnZXRQcm94eVRvV29ya2VyIiwic2V0UHJveHlUb1dvcmtlciIsImdldFNlZWQiLCJnZXRTZWVkT2Zmc2V0IiwiZ2V0UHJpbWFyeUFkZHJlc3MiLCJnZXRQcml2YXRlVmlld0tleSIsImdldFByaXZhdGVTcGVuZEtleSIsImdldFJlc3RvcmVIZWlnaHQiLCJnZXRMYW5ndWFnZSIsImdldFNhdmVDdXJyZW50IiwiZ2V0S2V5c0RhdGEiLCJnZXRQYXRoIiwic2V0S2V5c0RhdGEiLCJyZWFkRmlsZVN5bmMiLCJzZXRDYWNoZURhdGEiLCJvcGVuV2FsbGV0RGF0YSIsImNyZWF0ZVdhbGxldCIsImdldE5ldHdvcmtUeXBlIiwiTW9uZXJvTmV0d29ya1R5cGUiLCJ2YWxpZGF0ZSIsInNldFBhdGgiLCJnZXRQYXNzd29yZCIsInNldFBhc3N3b3JkIiwiZ2V0Q29ubmVjdGlvbk1hbmFnZXIiLCJnZXRTZXJ2ZXIiLCJzZXRTZXJ2ZXIiLCJnZXRDb25uZWN0aW9uIiwid2FsbGV0IiwiTW9uZXJvV2FsbGV0RnVsbFByb3h5IiwiY3JlYXRlV2FsbGV0RnJvbVNlZWQiLCJjcmVhdGVXYWxsZXRGcm9tS2V5cyIsImNyZWF0ZVdhbGxldFJhbmRvbSIsInNldENvbm5lY3Rpb25NYW5hZ2VyIiwiZGFlbW9uQ29ubmVjdGlvbiIsImdldFJlamVjdFVuYXV0aG9yaXplZCIsInNldFJlc3RvcmVIZWlnaHQiLCJzZXRTZWVkT2Zmc2V0IiwibW9kdWxlIiwibG9hZEZ1bGxNb2R1bGUiLCJxdWV1ZVRhc2siLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsIkdlblV0aWxzIiwiZ2V0VVVJRCIsImNyZWF0ZV9mdWxsX3dhbGxldCIsIkpTT04iLCJzdHJpbmdpZnkiLCJ0b0pzb24iLCJzYXZlIiwic2V0UHJpbWFyeUFkZHJlc3MiLCJzZXRQcml2YXRlVmlld0tleSIsInNldFByaXZhdGVTcGVuZEtleSIsInNldExhbmd1YWdlIiwiZ2V0U2VlZExhbmd1YWdlcyIsInBhcnNlIiwiZ2V0X2tleXNfd2FsbGV0X3NlZWRfbGFuZ3VhZ2VzIiwibGFuZ3VhZ2VzIiwiRlMiLCJpc0Jyb3dzZXIiLCJnZXREYWVtb25NYXhQZWVySGVpZ2h0IiwiZ2V0V2FsbGV0UHJveHkiLCJhc3NlcnROb3RDbG9zZWQiLCJnZXRfZGFlbW9uX21heF9wZWVyX2hlaWdodCIsInJlc3AiLCJpc0RhZW1vblN5bmNlZCIsImlzX2RhZW1vbl9zeW5jZWQiLCJpc1N5bmNlZCIsImlzX3N5bmNlZCIsImdldF9uZXR3b3JrX3R5cGUiLCJnZXRfcmVzdG9yZV9oZWlnaHQiLCJyZXN0b3JlSGVpZ2h0Iiwic2V0X3Jlc3RvcmVfaGVpZ2h0IiwibW92ZVRvIiwiYWRkTGlzdGVuZXIiLCJsaXN0ZW5lciIsIk1vbmVyb1dhbGxldExpc3RlbmVyIiwicHVzaCIsInJlZnJlc2hMaXN0ZW5pbmciLCJyZW1vdmVMaXN0ZW5lciIsImlkeCIsImluZGV4T2YiLCJzcGxpY2UiLCJnZXRMaXN0ZW5lcnMiLCJzZXREYWVtb25Db25uZWN0aW9uIiwidXJpT3JDb25uZWN0aW9uIiwiY29ubmVjdGlvbiIsIk1vbmVyb1JwY0Nvbm5lY3Rpb24iLCJ1cmkiLCJnZXRVcmkiLCJ1c2VybmFtZSIsImdldFVzZXJuYW1lIiwic2V0X2RhZW1vbl9jb25uZWN0aW9uIiwiZ2V0RGFlbW9uQ29ubmVjdGlvbiIsImNvbm5lY3Rpb25Db250YWluZXJTdHIiLCJnZXRfZGFlbW9uX2Nvbm5lY3Rpb24iLCJqc29uQ29ubmVjdGlvbiIsImlzQ29ubmVjdGVkVG9EYWVtb24iLCJpc19jb25uZWN0ZWRfdG9fZGFlbW9uIiwiZ2V0VmVyc2lvbiIsImdldEludGVncmF0ZWRBZGRyZXNzIiwic3RhbmRhcmRBZGRyZXNzIiwicGF5bWVudElkIiwicmVzdWx0IiwiZ2V0X2ludGVncmF0ZWRfYWRkcmVzcyIsImNoYXJBdCIsIk1vbmVyb0ludGVncmF0ZWRBZGRyZXNzIiwiZXJyIiwibWVzc2FnZSIsImluY2x1ZGVzIiwiZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MiLCJpbnRlZ3JhdGVkQWRkcmVzcyIsImRlY29kZV9pbnRlZ3JhdGVkX2FkZHJlc3MiLCJnZXRIZWlnaHQiLCJnZXRfaGVpZ2h0IiwiZ2V0RGFlbW9uSGVpZ2h0IiwiZ2V0X2RhZW1vbl9oZWlnaHQiLCJnZXRIZWlnaHRCeURhdGUiLCJ5ZWFyIiwibW9udGgiLCJkYXkiLCJnZXRfaGVpZ2h0X2J5X2RhdGUiLCJzeW5jIiwibGlzdGVuZXJPclN0YXJ0SGVpZ2h0Iiwic3RhcnRIZWlnaHQiLCJhbGxvd0NvbmN1cnJlbnRDYWxscyIsIk1hdGgiLCJtYXgiLCJ0aGF0Iiwic3luY1dhc20iLCJyZXNwSnNvbiIsIk1vbmVyb1N5bmNSZXN1bHQiLCJudW1CbG9ja3NGZXRjaGVkIiwicmVjZWl2ZWRNb25leSIsImUiLCJzdGFydFN5bmNpbmciLCJzeW5jTG9vcGVyIiwiVGFza0xvb3BlciIsImJhY2tncm91bmRTeW5jIiwic3RhcnQiLCJzdG9wU3luY2luZyIsInN0b3AiLCJzdG9wX3N5bmNpbmciLCJzY2FuVHhzIiwidHhIYXNoZXMiLCJzY2FuX3R4cyIsInJlc2NhblNwZW50IiwicmVzY2FuX3NwZW50IiwicmVzY2FuQmxvY2tjaGFpbiIsInJlc2Nhbl9ibG9ja2NoYWluIiwiZ2V0QmFsYW5jZSIsImFjY291bnRJZHgiLCJzdWJhZGRyZXNzSWR4IiwiYmFsYW5jZVN0ciIsImdldF9iYWxhbmNlX3dhbGxldCIsImdldF9iYWxhbmNlX2FjY291bnQiLCJnZXRfYmFsYW5jZV9zdWJhZGRyZXNzIiwiQmlnSW50Iiwic3RyaW5naWZ5QmlnSW50cyIsImJhbGFuY2UiLCJnZXRVbmxvY2tlZEJhbGFuY2UiLCJ1bmxvY2tlZEJhbGFuY2VTdHIiLCJnZXRfdW5sb2NrZWRfYmFsYW5jZV93YWxsZXQiLCJnZXRfdW5sb2NrZWRfYmFsYW5jZV9hY2NvdW50IiwiZ2V0X3VubG9ja2VkX2JhbGFuY2Vfc3ViYWRkcmVzcyIsInVubG9ja2VkQmFsYW5jZSIsImdldEFjY291bnRzIiwiaW5jbHVkZVN1YmFkZHJlc3NlcyIsInRhZyIsImFjY291bnRzU3RyIiwiZ2V0X2FjY291bnRzIiwiYWNjb3VudHMiLCJhY2NvdW50SnNvbiIsInNhbml0aXplQWNjb3VudCIsIk1vbmVyb0FjY291bnQiLCJnZXRBY2NvdW50IiwiYWNjb3VudFN0ciIsImdldF9hY2NvdW50IiwiY3JlYXRlQWNjb3VudCIsImxhYmVsIiwiY3JlYXRlX2FjY291bnQiLCJnZXRTdWJhZGRyZXNzZXMiLCJzdWJhZGRyZXNzSW5kaWNlcyIsImFyZ3MiLCJsaXN0aWZ5Iiwic3ViYWRkcmVzc2VzSnNvbiIsImdldF9zdWJhZGRyZXNzZXMiLCJzdWJhZGRyZXNzZXMiLCJzdWJhZGRyZXNzSnNvbiIsInNhbml0aXplU3ViYWRkcmVzcyIsIk1vbmVyb1N1YmFkZHJlc3MiLCJjcmVhdGVTdWJhZGRyZXNzIiwic3ViYWRkcmVzc1N0ciIsImNyZWF0ZV9zdWJhZGRyZXNzIiwic2V0U3ViYWRkcmVzc0xhYmVsIiwic2V0X3N1YmFkZHJlc3NfbGFiZWwiLCJnZXRUeHMiLCJxdWVyeSIsInF1ZXJ5Tm9ybWFsaXplZCIsIk1vbmVyb1dhbGxldCIsIm5vcm1hbGl6ZVR4UXVlcnkiLCJnZXRfdHhzIiwiZ2V0QmxvY2siLCJibG9ja3NKc29uU3RyIiwiZGVzZXJpYWxpemVUeHMiLCJnZXRUcmFuc2ZlcnMiLCJub3JtYWxpemVUcmFuc2ZlclF1ZXJ5IiwiZ2V0X3RyYW5zZmVycyIsImdldFR4UXVlcnkiLCJkZXNlcmlhbGl6ZVRyYW5zZmVycyIsImdldE91dHB1dHMiLCJub3JtYWxpemVPdXRwdXRRdWVyeSIsImdldF9vdXRwdXRzIiwiZGVzZXJpYWxpemVPdXRwdXRzIiwiZXhwb3J0T3V0cHV0cyIsImFsbCIsImV4cG9ydF9vdXRwdXRzIiwib3V0cHV0c0hleCIsImltcG9ydE91dHB1dHMiLCJpbXBvcnRfb3V0cHV0cyIsIm51bUltcG9ydGVkIiwiZXhwb3J0S2V5SW1hZ2VzIiwiZXhwb3J0X2tleV9pbWFnZXMiLCJrZXlJbWFnZXNTdHIiLCJrZXlJbWFnZXMiLCJrZXlJbWFnZUpzb24iLCJNb25lcm9LZXlJbWFnZSIsImltcG9ydEtleUltYWdlcyIsImltcG9ydF9rZXlfaW1hZ2VzIiwibWFwIiwia2V5SW1hZ2UiLCJrZXlJbWFnZUltcG9ydFJlc3VsdFN0ciIsIk1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0IiwiZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQiLCJmcmVlemVPdXRwdXQiLCJmcmVlemVfb3V0cHV0IiwidGhhd091dHB1dCIsInRoYXdfb3V0cHV0IiwiaXNPdXRwdXRGcm96ZW4iLCJpc19vdXRwdXRfZnJvemVuIiwiY3JlYXRlVHhzIiwiY29uZmlnTm9ybWFsaXplZCIsIm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyIsImdldENhblNwbGl0Iiwic2V0Q2FuU3BsaXQiLCJjcmVhdGVfdHhzIiwidHhTZXRKc29uU3RyIiwiTW9uZXJvVHhTZXQiLCJzd2VlcE91dHB1dCIsIm5vcm1hbGl6ZVN3ZWVwT3V0cHV0Q29uZmlnIiwic3dlZXBfb3V0cHV0Iiwic3dlZXBVbmxvY2tlZCIsIm5vcm1hbGl6ZVN3ZWVwVW5sb2NrZWRDb25maWciLCJzd2VlcF91bmxvY2tlZCIsInR4U2V0c0pzb24iLCJ0eFNldHMiLCJ0eFNldEpzb24iLCJ0eHMiLCJ0eFNldCIsInR4Iiwic3dlZXBEdXN0IiwicmVsYXkiLCJzd2VlcF9kdXN0Iiwic2V0VHhzIiwicmVsYXlUeHMiLCJ0eHNPck1ldGFkYXRhcyIsIkFycmF5IiwiaXNBcnJheSIsInR4TWV0YWRhdGFzIiwidHhPck1ldGFkYXRhIiwiTW9uZXJvVHhXYWxsZXQiLCJnZXRNZXRhZGF0YSIsInJlbGF5X3R4cyIsInR4SGFzaGVzSnNvbiIsImRlc2NyaWJlVHhTZXQiLCJ1bnNpZ25lZFR4SGV4IiwiZ2V0VW5zaWduZWRUeEhleCIsInNpZ25lZFR4SGV4IiwiZ2V0U2lnbmVkVHhIZXgiLCJtdWx0aXNpZ1R4SGV4IiwiZ2V0TXVsdGlzaWdUeEhleCIsImRlc2NyaWJlX3R4X3NldCIsImdldF9leGNlcHRpb25fbWVzc2FnZSIsInNpZ25UeHMiLCJzaWduX3R4cyIsInN1Ym1pdFR4cyIsInN1Ym1pdF90eHMiLCJzaWduTWVzc2FnZSIsInNpZ25hdHVyZVR5cGUiLCJNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIlNJR05fV0lUSF9TUEVORF9LRVkiLCJzaWduX21lc3NhZ2UiLCJ2ZXJpZnlNZXNzYWdlIiwiYWRkcmVzcyIsInNpZ25hdHVyZSIsInZlcmlmeV9tZXNzYWdlIiwiaXNHb29kIiwiTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCIsImlzT2xkIiwiU0lHTl9XSVRIX1ZJRVdfS0VZIiwidmVyc2lvbiIsImdldFR4S2V5IiwidHhIYXNoIiwiZ2V0X3R4X2tleSIsImNoZWNrVHhLZXkiLCJ0eEtleSIsImNoZWNrX3R4X2tleSIsInJlc3BKc29uU3RyIiwiTW9uZXJvQ2hlY2tUeCIsImdldFR4UHJvb2YiLCJnZXRfdHhfcHJvb2YiLCJlcnJvcktleSIsInN1YnN0cmluZyIsImxlbmd0aCIsImNoZWNrVHhQcm9vZiIsImNoZWNrX3R4X3Byb29mIiwiZ2V0U3BlbmRQcm9vZiIsImdldF9zcGVuZF9wcm9vZiIsImNoZWNrU3BlbmRQcm9vZiIsImNoZWNrX3NwZW5kX3Byb29mIiwiZ2V0UmVzZXJ2ZVByb29mV2FsbGV0IiwiZ2V0X3Jlc2VydmVfcHJvb2Zfd2FsbGV0IiwiZ2V0UmVzZXJ2ZVByb29mQWNjb3VudCIsImFtb3VudCIsImdldF9yZXNlcnZlX3Byb29mX2FjY291bnQiLCJ0b1N0cmluZyIsImNoZWNrUmVzZXJ2ZVByb29mIiwiY2hlY2tfcmVzZXJ2ZV9wcm9vZiIsIk1vbmVyb0NoZWNrUmVzZXJ2ZSIsImdldFR4Tm90ZXMiLCJnZXRfdHhfbm90ZXMiLCJ0eE5vdGVzIiwic2V0VHhOb3RlcyIsIm5vdGVzIiwic2V0X3R4X25vdGVzIiwiZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzIiwiZW50cnlJbmRpY2VzIiwiZW50cmllcyIsImVudHJ5SnNvbiIsImdldF9hZGRyZXNzX2Jvb2tfZW50cmllcyIsIk1vbmVyb0FkZHJlc3NCb29rRW50cnkiLCJhZGRBZGRyZXNzQm9va0VudHJ5IiwiZGVzY3JpcHRpb24iLCJhZGRfYWRkcmVzc19ib29rX2VudHJ5IiwiZWRpdEFkZHJlc3NCb29rRW50cnkiLCJpbmRleCIsInNldEFkZHJlc3MiLCJzZXREZXNjcmlwdGlvbiIsImVkaXRfYWRkcmVzc19ib29rX2VudHJ5IiwiZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeSIsImVudHJ5SWR4IiwiZGVsZXRlX2FkZHJlc3NfYm9va19lbnRyeSIsInRhZ0FjY291bnRzIiwiYWNjb3VudEluZGljZXMiLCJ0YWdfYWNjb3VudHMiLCJ1bnRhZ0FjY291bnRzIiwiZ2V0QWNjb3VudFRhZ3MiLCJhY2NvdW50VGFncyIsImFjY291bnRUYWdKc29uIiwiZ2V0X2FjY291bnRfdGFncyIsIk1vbmVyb0FjY291bnRUYWciLCJzZXRBY2NvdW50VGFnTGFiZWwiLCJzZXRfYWNjb3VudF90YWdfbGFiZWwiLCJnZXRQYXltZW50VXJpIiwiZ2V0X3BheW1lbnRfdXJpIiwicGFyc2VQYXltZW50VXJpIiwiTW9uZXJvVHhDb25maWciLCJwYXJzZV9wYXltZW50X3VyaSIsImdldEF0dHJpYnV0ZSIsImtleSIsInZhbHVlIiwiZ2V0X2F0dHJpYnV0ZSIsInNldEF0dHJpYnV0ZSIsInZhbCIsInNldF9hdHRyaWJ1dGUiLCJzdGFydE1pbmluZyIsIm51bVRocmVhZHMiLCJiYWNrZ3JvdW5kTWluaW5nIiwiaWdub3JlQmF0dGVyeSIsImRhZW1vbiIsIk1vbmVyb0RhZW1vblJwYyIsImNvbm5lY3RUb0RhZW1vblJwYyIsInN0b3BNaW5pbmciLCJpc011bHRpc2lnSW1wb3J0TmVlZGVkIiwiaXNfbXVsdGlzaWdfaW1wb3J0X25lZWRlZCIsImlzTXVsdGlzaWciLCJpc19tdWx0aXNpZyIsImdldE11bHRpc2lnSW5mbyIsIk1vbmVyb011bHRpc2lnSW5mbyIsImdldF9tdWx0aXNpZ19pbmZvIiwicHJlcGFyZU11bHRpc2lnIiwicHJlcGFyZV9tdWx0aXNpZyIsIm1ha2VNdWx0aXNpZyIsIm11bHRpc2lnSGV4ZXMiLCJ0aHJlc2hvbGQiLCJtYWtlX211bHRpc2lnIiwiZXhjaGFuZ2VNdWx0aXNpZ0tleXMiLCJleGNoYW5nZV9tdWx0aXNpZ19rZXlzIiwiTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IiwiZXhwb3J0TXVsdGlzaWdIZXgiLCJleHBvcnRfbXVsdGlzaWdfaGV4IiwiaW1wb3J0TXVsdGlzaWdIZXgiLCJpbXBvcnRfbXVsdGlzaWdfaGV4Iiwic2lnbk11bHRpc2lnVHhIZXgiLCJzaWduX211bHRpc2lnX3R4X2hleCIsIk1vbmVyb011bHRpc2lnU2lnblJlc3VsdCIsInN1Ym1pdE11bHRpc2lnVHhIZXgiLCJzaWduZWRNdWx0aXNpZ1R4SGV4Iiwic3VibWl0X211bHRpc2lnX3R4X2hleCIsImdldERhdGEiLCJ2aWV3T25seSIsImlzVmlld09ubHkiLCJ2aWV3cyIsImNhY2hlQnVmZmVyTG9jIiwiZ2V0X2NhY2hlX2ZpbGVfYnVmZmVyIiwidmlldyIsIkRhdGFWaWV3IiwiQXJyYXlCdWZmZXIiLCJpIiwic2V0SW50OCIsIkhFQVBVOCIsInBvaW50ZXIiLCJVaW50OEFycmF5IiwiQllURVNfUEVSX0VMRU1FTlQiLCJfZnJlZSIsIkJ1ZmZlciIsImZyb20iLCJidWZmZXIiLCJrZXlzQnVmZmVyTG9jIiwiZ2V0X2tleXNfZmlsZV9idWZmZXIiLCJ1bnNoaWZ0IiwiY2hhbmdlUGFzc3dvcmQiLCJvbGRQYXNzd29yZCIsIm5ld1Bhc3N3b3JkIiwiY2hhbmdlX3dhbGxldF9wYXNzd29yZCIsImVyck1zZyIsImNsb3NlIiwiZ2V0TnVtQmxvY2tzVG9VbmxvY2siLCJnZXRUeCIsImdldEluY29taW5nVHJhbnNmZXJzIiwiZ2V0T3V0Z29pbmdUcmFuc2ZlcnMiLCJjcmVhdGVUeCIsInJlbGF5VHgiLCJnZXRUeE5vdGUiLCJzZXRUeE5vdGUiLCJub3RlIiwicHJveHlUb1dvcmtlciIsIm5ldHdvcmtUeXBlIiwiZGFlbW9uVXJpIiwiZGFlbW9uVXNlcm5hbWUiLCJkYWVtb25QYXNzd29yZCIsIm9wZW5fd2FsbGV0X2Z1bGwiLCJrZXlzRGF0YSIsImNhY2hlRGF0YSIsImJyb3dzZXJNYWluUGF0aCIsImNvbnNvbGUiLCJlcnJvciIsImlzRW5hYmxlZCIsInNldF9saXN0ZW5lciIsIm5ld0xpc3RlbmVySGFuZGxlIiwiaGVpZ2h0IiwiZW5kSGVpZ2h0IiwicGVyY2VudERvbmUiLCJvblN5bmNQcm9ncmVzcyIsIm9uTmV3QmxvY2siLCJuZXdCYWxhbmNlU3RyIiwibmV3VW5sb2NrZWRCYWxhbmNlU3RyIiwib25CYWxhbmNlc0NoYW5nZWQiLCJhbW91bnRTdHIiLCJ1bmxvY2tUaW1lIiwiaXNMb2NrZWQiLCJvbk91dHB1dFJlY2VpdmVkIiwiYWNjb3VudElkeFN0ciIsInN1YmFkZHJlc3NJZHhTdHIiLCJvbk91dHB1dFNwZW50Iiwic2FuaXRpemVCbG9jayIsImJsb2NrIiwic2FuaXRpemVUeFdhbGxldCIsImFjY291bnQiLCJzdWJhZGRyZXNzIiwiZGVzZXJpYWxpemVCbG9ja3MiLCJibG9ja3NKc29uIiwiZGVzZXJpYWxpemVkQmxvY2tzIiwiYmxvY2tzIiwiYmxvY2tKc29uIiwiTW9uZXJvQmxvY2siLCJEZXNlcmlhbGl6YXRpb25UeXBlIiwiVFhfV0FMTEVUIiwic2V0QmxvY2siLCJnZXRIYXNoZXMiLCJ0eE1hcCIsIk1hcCIsImdldEhhc2giLCJ0eHNTb3J0ZWQiLCJ0cmFuc2ZlcnMiLCJnZXRPdXRnb2luZ1RyYW5zZmVyIiwidHJhbnNmZXIiLCJvdXRwdXRzIiwib3V0cHV0Iiwic2V0QnJvd3Nlck1haW5QYXRoIiwiaXNDbG9zZWQiLCJQYXRoIiwibm9ybWFsaXplIiwid2FsbGV0RGlyIiwiZGlybmFtZSIsIm1rZGlyU3luYyIsImRhdGEiLCJ3cml0ZUZpbGVTeW5jIiwib2xkUGF0aCIsInVubGlua1N5bmMiLCJwYXRoTmV3IiwicmVuYW1lU3luYyIsImV4cG9ydHMiLCJkZWZhdWx0IiwiTW9uZXJvV2FsbGV0S2V5c1Byb3h5Iiwid2FsbGV0SWQiLCJpbnZva2VXb3JrZXIiLCJnZXRXb3JrZXIiLCJ3b3JrZXIiLCJ3cmFwcGVkTGlzdGVuZXJzIiwiYXJndW1lbnRzIiwidXJpT3JScGNDb25uZWN0aW9uIiwiZ2V0Q29uZmlnIiwicnBjQ29uZmlnIiwid3JhcHBlZExpc3RlbmVyIiwiV2FsbGV0V29ya2VyTGlzdGVuZXIiLCJsaXN0ZW5lcklkIiwiZ2V0SWQiLCJhZGRXb3JrZXJDYWxsYmFjayIsImdldExpc3RlbmVyIiwicmVtb3ZlV29ya2VyQ2FsbGJhY2siLCJyZXN1bHRKc29uIiwiYmxvY2tKc29ucyIsImtleUltYWdlc0pzb24iLCJNb25lcm9PdXRwdXRXYWxsZXQiLCJzZXRBbW91bnQiLCJzZXRBY2NvdW50SW5kZXgiLCJzZXRTdWJhZGRyZXNzSW5kZXgiLCJzZXRIYXNoIiwic2V0VmVyc2lvbiIsInNldFVubG9ja1RpbWUiLCJzZXRUeCIsInNldE91dHB1dHMiLCJzZXRJc0luY29taW5nIiwic2V0SXNMb2NrZWQiLCJzZXRIZWlnaHQiLCJzZXRJc0NvbmZpcm1lZCIsInNldEluVHhQb29sIiwic2V0SXNGYWlsZWQiLCJwYXJzZUludCIsInNldElucHV0cyIsImdldElucHV0cyIsImlkIl0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvd2FsbGV0L01vbmVyb1dhbGxldEZ1bGwudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XG5pbXBvcnQgUGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IEdlblV0aWxzIGZyb20gXCIuLi9jb21tb24vR2VuVXRpbHNcIjtcbmltcG9ydCBMaWJyYXJ5VXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9MaWJyYXJ5VXRpbHNcIjtcbmltcG9ydCBUYXNrTG9vcGVyIGZyb20gXCIuLi9jb21tb24vVGFza0xvb3BlclwiO1xuaW1wb3J0IE1vbmVyb0FjY291bnQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWNjb3VudFwiO1xuaW1wb3J0IE1vbmVyb0FjY291bnRUYWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWNjb3VudFRhZ1wiO1xuaW1wb3J0IE1vbmVyb0FkZHJlc3NCb29rRW50cnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeVwiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvQmxvY2tcIjtcbmltcG9ydCBNb25lcm9DaGVja1R4IGZyb20gXCIuL21vZGVsL01vbmVyb0NoZWNrVHhcIjtcbmltcG9ydCBNb25lcm9DaGVja1Jlc2VydmUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQ2hlY2tSZXNlcnZlXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uUnBjIGZyb20gXCIuLi9kYWVtb24vTW9uZXJvRGFlbW9uUnBjXCI7XG5pbXBvcnQgTW9uZXJvRXJyb3IgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9FcnJvclwiO1xuaW1wb3J0IE1vbmVyb0luY29taW5nVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvSW5jb21pbmdUcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzIGZyb20gXCIuL21vZGVsL01vbmVyb0ludGVncmF0ZWRBZGRyZXNzXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2UgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9LZXlJbWFnZVwiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdJbmZvIGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnSW5mb1wiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ0luaXRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTmV0d29ya1R5cGUgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9OZXR3b3JrVHlwZVwiO1xuaW1wb3J0IE1vbmVyb091dHB1dFF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb091dHB1dFF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0V2FsbGV0IGZyb20gXCIuL21vZGVsL01vbmVyb091dHB1dFdhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1JwY0Nvbm5lY3Rpb24gZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9ScGNDb25uZWN0aW9uXCI7XG5pbXBvcnQgTW9uZXJvU3ViYWRkcmVzcyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9TdWJhZGRyZXNzXCI7XG5pbXBvcnQgTW9uZXJvU3luY1Jlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9TeW5jUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9UcmFuc2ZlclF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb1RyYW5zZmVyUXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeENvbmZpZyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeENvbmZpZ1wiO1xuaW1wb3J0IE1vbmVyb1R4UXVlcnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb1R4U2V0IGZyb20gXCIuL21vZGVsL01vbmVyb1R4U2V0XCI7XG5pbXBvcnQgTW9uZXJvVHggZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9UeFwiO1xuaW1wb3J0IE1vbmVyb1R4V2FsbGV0IGZyb20gXCIuL21vZGVsL01vbmVyb1R4V2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0IGZyb20gXCIuL01vbmVyb1dhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1dhbGxldENvbmZpZyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9XYWxsZXRDb25maWdcIjtcbmltcG9ydCB7IE1vbmVyb1dhbGxldEtleXMsIE1vbmVyb1dhbGxldEtleXNQcm94eSB9IGZyb20gXCIuL01vbmVyb1dhbGxldEtleXNcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRMaXN0ZW5lciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9XYWxsZXRMaXN0ZW5lclwiO1xuaW1wb3J0IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIGZyb20gXCIuL21vZGVsL01vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlXCI7XG5pbXBvcnQgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvVmVyc2lvbiBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb1ZlcnNpb25cIjtcbmltcG9ydCBmcyBmcm9tIFwiZnNcIjtcblxuLyoqXG4gKiBJbXBsZW1lbnRzIGEgTW9uZXJvIHdhbGxldCB1c2luZyBjbGllbnQtc2lkZSBXZWJBc3NlbWJseSBiaW5kaW5ncyB0byBtb25lcm8tcHJvamVjdCdzIHdhbGxldDIgaW4gQysrLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNb25lcm9XYWxsZXRGdWxsIGV4dGVuZHMgTW9uZXJvV2FsbGV0S2V5cyB7XG5cbiAgLy8gc3RhdGljIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgc3RhdGljIHJlYWRvbmx5IERFRkFVTFRfU1lOQ19QRVJJT0RfSU5fTVMgPSAyMDAwMDtcbiAgcHJvdGVjdGVkIHN0YXRpYyBGUztcblxuICAvLyBpbnN0YW5jZSB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIHBhdGg6IHN0cmluZztcbiAgcHJvdGVjdGVkIHBhc3N3b3JkOiBzdHJpbmc7XG4gIHByb3RlY3RlZCBsaXN0ZW5lcnM6IE1vbmVyb1dhbGxldExpc3RlbmVyW107XG4gIHByb3RlY3RlZCBmczogYW55O1xuICBwcm90ZWN0ZWQgZnVsbExpc3RlbmVyOiBXYWxsZXRGdWxsTGlzdGVuZXI7XG4gIHByb3RlY3RlZCBmdWxsTGlzdGVuZXJIYW5kbGU6IG51bWJlcjtcbiAgcHJvdGVjdGVkIHJlamVjdFVuYXV0aG9yaXplZDogYm9vbGVhbjtcbiAgcHJvdGVjdGVkIHJlamVjdFVuYXV0aG9yaXplZENvbmZpZ0lkOiBzdHJpbmc7XG4gIHByb3RlY3RlZCBzeW5jUGVyaW9kSW5NczogbnVtYmVyO1xuICBwcm90ZWN0ZWQgc3luY0xvb3BlcjogVGFza0xvb3BlcjtcbiAgcHJvdGVjdGVkIGJyb3dzZXJNYWluUGF0aDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBjb25zdHJ1Y3RvciB3aGljaCBpcyBnaXZlbiB0aGUgbWVtb3J5IGFkZHJlc3Mgb2YgYSBDKysgd2FsbGV0IGluc3RhbmNlLlxuICAgKiBcbiAgICogVGhpcyBjb25zdHJ1Y3RvciBzaG91bGQgYmUgY2FsbGVkIHRocm91Z2ggc3RhdGljIHdhbGxldCBjcmVhdGlvbiB1dGlsaXRpZXMgaW4gdGhpcyBjbGFzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBjcHBBZGRyZXNzIC0gYWRkcmVzcyBvZiB0aGUgd2FsbGV0IGluc3RhbmNlIGluIEMrK1xuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIHBhdGggb2YgdGhlIHdhbGxldCBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGFzc3dvcmQgLSBwYXNzd29yZCBvZiB0aGUgd2FsbGV0IGluc3RhbmNlXG4gICAqIEBwYXJhbSB7RmlsZVN5c3RlbX0gZnMgLSBub2RlLmpzLWNvbXBhdGlibGUgZmlsZSBzeXN0ZW0gdG8gcmVhZC93cml0ZSB3YWxsZXQgZmlsZXNcbiAgICogQHBhcmFtIHtib29sZWFufSByZWplY3RVbmF1dGhvcml6ZWQgLSBzcGVjaWZpZXMgaWYgdW5hdXRob3JpemVkIHJlcXVlc3RzIChlLmcuIHNlbGYtc2lnbmVkIGNlcnRpZmljYXRlcykgc2hvdWxkIGJlIHJlamVjdGVkXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByZWplY3RVbmF1dGhvcml6ZWRGbklkIC0gdW5pcXVlIGlkZW50aWZpZXIgZm9yIGh0dHBfY2xpZW50X3dhc20gdG8gcXVlcnkgcmVqZWN0VW5hdXRob3JpemVkXG4gICAqIEBwYXJhbSB7TW9uZXJvV2FsbGV0RnVsbFByb3h5fSB3YWxsZXRQcm94eSAtIHByb3h5IHRvIGludm9rZSB3YWxsZXQgb3BlcmF0aW9ucyBpbiBhIHdlYiB3b3JrZXJcbiAgICogXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBjb25zdHJ1Y3RvcihjcHBBZGRyZXNzLCBwYXRoLCBwYXNzd29yZCwgZnMsIHJlamVjdFVuYXV0aG9yaXplZCwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCwgd2FsbGV0UHJveHk/OiBNb25lcm9XYWxsZXRGdWxsUHJveHkpIHtcbiAgICBzdXBlcihjcHBBZGRyZXNzLCB3YWxsZXRQcm94eSk7XG4gICAgaWYgKHdhbGxldFByb3h5KSByZXR1cm47XG4gICAgdGhpcy5wYXRoID0gcGF0aDtcbiAgICB0aGlzLnBhc3N3b3JkID0gcGFzc3dvcmQ7XG4gICAgdGhpcy5saXN0ZW5lcnMgPSBbXTtcbiAgICB0aGlzLmZzID0gZnMgPyBmcyA6IChwYXRoID8gTW9uZXJvV2FsbGV0RnVsbC5nZXRGcygpIDogdW5kZWZpbmVkKTtcbiAgICB0aGlzLl9pc0Nsb3NlZCA9IGZhbHNlO1xuICAgIHRoaXMuZnVsbExpc3RlbmVyID0gbmV3IFdhbGxldEZ1bGxMaXN0ZW5lcih0aGlzKTsgLy8gcmVjZWl2ZXMgbm90aWZpY2F0aW9ucyBmcm9tIHdhc20gYysrXG4gICAgdGhpcy5mdWxsTGlzdGVuZXJIYW5kbGUgPSAwOyAgICAgICAgICAgICAgICAgICAgICAvLyBtZW1vcnkgYWRkcmVzcyBvZiB0aGUgd2FsbGV0IGxpc3RlbmVyIGluIGMrK1xuICAgIHRoaXMucmVqZWN0VW5hdXRob3JpemVkID0gcmVqZWN0VW5hdXRob3JpemVkO1xuICAgIHRoaXMucmVqZWN0VW5hdXRob3JpemVkQ29uZmlnSWQgPSByZWplY3RVbmF1dGhvcml6ZWRGbklkO1xuICAgIHRoaXMuc3luY1BlcmlvZEluTXMgPSBNb25lcm9XYWxsZXRGdWxsLkRFRkFVTFRfU1lOQ19QRVJJT0RfSU5fTVM7XG4gICAgTGlicmFyeVV0aWxzLnNldFJlamVjdFVuYXV0aG9yaXplZEZuKHJlamVjdFVuYXV0aG9yaXplZEZuSWQsICgpID0+IHRoaXMucmVqZWN0VW5hdXRob3JpemVkKTsgLy8gcmVnaXN0ZXIgZm4gaW5mb3JtaW5nIGlmIHVuYXV0aG9yaXplZCByZXFzIHNob3VsZCBiZSByZWplY3RlZFxuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFNUQVRJQyBVVElMSVRJRVMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIC8qKlxuICAgKiBDaGVjayBpZiBhIHdhbGxldCBleGlzdHMgYXQgYSBnaXZlbiBwYXRoLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggLSBwYXRoIG9mIHRoZSB3YWxsZXQgb24gdGhlIGZpbGUgc3lzdGVtXG4gICAqIEBwYXJhbSB7ZnN9IC0gTm9kZS5qcyBjb21wYXRpYmxlIGZpbGUgc3lzdGVtIHRvIHVzZSAob3B0aW9uYWwsIGRlZmF1bHRzIHRvIGRpc2sgaWYgbm9kZWpzKVxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIGEgd2FsbGV0IGV4aXN0cyBhdCB0aGUgZ2l2ZW4gcGF0aCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgd2FsbGV0RXhpc3RzKHBhdGgsIGZzKSB7XG4gICAgYXNzZXJ0KHBhdGgsIFwiTXVzdCBwcm92aWRlIGEgcGF0aCB0byBsb29rIGZvciBhIHdhbGxldFwiKTtcbiAgICBpZiAoIWZzKSBmcyA9IE1vbmVyb1dhbGxldEZ1bGwuZ2V0RnMoKTtcbiAgICBpZiAoIWZzKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgZmlsZSBzeXN0ZW0gdG8gY2hlY2sgaWYgd2FsbGV0IGV4aXN0c1wiKTtcbiAgICBsZXQgZXhpc3RzID0gZnMuZXhpc3RzU3luYyhwYXRoICsgXCIua2V5c1wiKTtcbiAgICBMaWJyYXJ5VXRpbHMubG9nKDEsIFwiV2FsbGV0IGV4aXN0cyBhdCBcIiArIHBhdGggKyBcIjogXCIgKyBleGlzdHMpO1xuICAgIHJldHVybiBleGlzdHM7XG4gIH1cbiAgXG4gIHN0YXRpYyBhc3luYyBvcGVuV2FsbGV0KGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KSB7XG5cbiAgICAvLyB2YWxpZGF0ZSBjb25maWdcbiAgICBjb25maWcgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKGNvbmZpZyk7XG4gICAgaWYgKGNvbmZpZy5nZXRQcm94eVRvV29ya2VyKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFByb3h5VG9Xb3JrZXIodHJ1ZSk7XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgc2VlZCB3aGVuIG9wZW5pbmcgd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0U2VlZE9mZnNldCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHNlZWQgb2Zmc2V0IHdoZW4gb3BlbmluZyB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQcmltYXJ5QWRkcmVzcygpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHByaW1hcnkgYWRkcmVzcyB3aGVuIG9wZW5pbmcgd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0UHJpdmF0ZVZpZXdLZXkoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3BlY2lmeSBwcml2YXRlIHZpZXcga2V5IHdoZW4gb3BlbmluZyB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQcml2YXRlU3BlbmRLZXkoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3BlY2lmeSBwcml2YXRlIHNwZW5kIGtleSB3aGVuIG9wZW5pbmcgd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHJlc3RvcmUgaGVpZ2h0IHdoZW4gb3BlbmluZyB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRMYW5ndWFnZSgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IGxhbmd1YWdlIHdoZW4gb3BlbmluZyB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTYXZlQ3VycmVudCgpID09PSB0cnVlKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc2F2ZSBjdXJyZW50IHdhbGxldCB3aGVuIG9wZW5pbmcgZnVsbCB3YWxsZXRcIik7XG5cbiAgICAvLyByZWFkIHdhbGxldCBkYXRhIGZyb20gZGlzayBpZiBub3QgZ2l2ZW5cbiAgICBpZiAoIWNvbmZpZy5nZXRLZXlzRGF0YSgpKSB7XG4gICAgICBsZXQgZnMgPSBjb25maWcuZ2V0RnMoKSA/IGNvbmZpZy5nZXRGcygpIDogTW9uZXJvV2FsbGV0RnVsbC5nZXRGcygpO1xuICAgICAgaWYgKCFmcykgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGZpbGUgc3lzdGVtIHRvIHJlYWQgd2FsbGV0IGRhdGEgZnJvbVwiKTtcbiAgICAgIGlmICghdGhpcy53YWxsZXRFeGlzdHMoY29uZmlnLmdldFBhdGgoKSwgZnMpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgZG9lcyBub3QgZXhpc3QgYXQgcGF0aDogXCIgKyBjb25maWcuZ2V0UGF0aCgpKTtcbiAgICAgIGNvbmZpZy5zZXRLZXlzRGF0YShmcy5yZWFkRmlsZVN5bmMoY29uZmlnLmdldFBhdGgoKSArIFwiLmtleXNcIikpO1xuICAgICAgY29uZmlnLnNldENhY2hlRGF0YShmcy5leGlzdHNTeW5jKGNvbmZpZy5nZXRQYXRoKCkpID8gZnMucmVhZEZpbGVTeW5jKGNvbmZpZy5nZXRQYXRoKCkpIDogXCJcIik7XG4gICAgfVxuXG4gICAgLy8gb3BlbiB3YWxsZXQgZnJvbSBkYXRhXG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwub3BlbldhbGxldERhdGEoY29uZmlnKTtcbiAgfVxuICBcbiAgc3RhdGljIGFzeW5jIGNyZWF0ZVdhbGxldChjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZyk6IFByb21pc2U8TW9uZXJvV2FsbGV0RnVsbD4ge1xuXG4gICAgLy8gdmFsaWRhdGUgY29uZmlnXG4gICAgaWYgKGNvbmZpZyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgY29uZmlnIHRvIGNyZWF0ZSB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkKCkgIT09IHVuZGVmaW5lZCAmJiAoY29uZmlnLmdldFByaW1hcnlBZGRyZXNzKCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWcuZ2V0UHJpdmF0ZVZpZXdLZXkoKSAhPT0gdW5kZWZpbmVkIHx8IGNvbmZpZy5nZXRQcml2YXRlU3BlbmRLZXkoKSAhPT0gdW5kZWZpbmVkKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IG1heSBiZSBpbml0aWFsaXplZCB3aXRoIGEgc2VlZCBvciBrZXlzIGJ1dCBub3QgYm90aFwiKTtcbiAgICBpZiAoY29uZmlnLmdldE5ldHdvcmtUeXBlKCkgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGEgbmV0d29ya1R5cGU6ICdtYWlubmV0JywgJ3Rlc3RuZXQnIG9yICdzdGFnZW5ldCdcIik7XG4gICAgTW9uZXJvTmV0d29ya1R5cGUudmFsaWRhdGUoY29uZmlnLmdldE5ldHdvcmtUeXBlKCkpO1xuICAgIGlmIChjb25maWcuZ2V0U2F2ZUN1cnJlbnQoKSA9PT0gdHJ1ZSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNhdmUgY3VycmVudCB3YWxsZXQgd2hlbiBjcmVhdGluZyBmdWxsIFdBU00gd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0UGF0aCgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRQYXRoKFwiXCIpO1xuICAgIGlmIChjb25maWcuZ2V0UGF0aCgpICYmIE1vbmVyb1dhbGxldEZ1bGwud2FsbGV0RXhpc3RzKGNvbmZpZy5nZXRQYXRoKCksIGNvbmZpZy5nZXRGcygpKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGFscmVhZHkgZXhpc3RzOiBcIiArIGNvbmZpZy5nZXRQYXRoKCkpO1xuICAgIGlmIChjb25maWcuZ2V0UGFzc3dvcmQoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UGFzc3dvcmQoXCJcIik7XG5cbiAgICAvLyBzZXQgc2VydmVyIGZyb20gY29ubmVjdGlvbiBtYW5hZ2VyIGlmIHByb3ZpZGVkXG4gICAgaWYgKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpKSB7XG4gICAgICBpZiAoY29uZmlnLmdldFNlcnZlcigpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgY2FuIGJlIGluaXRpYWxpemVkIHdpdGggYSBzZXJ2ZXIgb3IgY29ubmVjdGlvbiBtYW5hZ2VyIGJ1dCBub3QgYm90aFwiKTtcbiAgICAgIGNvbmZpZy5zZXRTZXJ2ZXIoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkuZ2V0Q29ubmVjdGlvbigpKTtcbiAgICB9XG5cbiAgICAvLyBjcmVhdGUgcHJveGllZCBvciBsb2NhbCB3YWxsZXRcbiAgICBsZXQgd2FsbGV0O1xuICAgIGlmIChjb25maWcuZ2V0UHJveHlUb1dvcmtlcigpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRQcm94eVRvV29ya2VyKHRydWUpO1xuICAgIGlmIChjb25maWcuZ2V0UHJveHlUb1dvcmtlcigpKSB7XG4gICAgICBsZXQgd2FsbGV0UHJveHkgPSBhd2FpdCBNb25lcm9XYWxsZXRGdWxsUHJveHkuY3JlYXRlV2FsbGV0KGNvbmZpZyk7XG4gICAgICB3YWxsZXQgPSBuZXcgTW9uZXJvV2FsbGV0RnVsbCh1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB3YWxsZXRQcm94eSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChjb25maWcuZ2V0U2VlZCgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKGNvbmZpZy5nZXRMYW5ndWFnZSgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIGxhbmd1YWdlIHdoZW4gY3JlYXRpbmcgd2FsbGV0IGZyb20gc2VlZFwiKTtcbiAgICAgICAgd2FsbGV0ID0gYXdhaXQgTW9uZXJvV2FsbGV0RnVsbC5jcmVhdGVXYWxsZXRGcm9tU2VlZChjb25maWcpO1xuICAgICAgfSBlbHNlIGlmIChjb25maWcuZ2V0UHJpdmF0ZVNwZW5kS2V5KCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWcuZ2V0UHJpbWFyeUFkZHJlc3MoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmIChjb25maWcuZ2V0U2VlZE9mZnNldCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHNlZWRPZmZzZXQgd2hlbiBjcmVhdGluZyB3YWxsZXQgZnJvbSBrZXlzXCIpO1xuICAgICAgICB3YWxsZXQgPSBhd2FpdCBNb25lcm9XYWxsZXRGdWxsLmNyZWF0ZVdhbGxldEZyb21LZXlzKGNvbmZpZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoY29uZmlnLmdldFNlZWRPZmZzZXQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSBzZWVkT2Zmc2V0IHdoZW4gY3JlYXRpbmcgcmFuZG9tIHdhbGxldFwiKTtcbiAgICAgICAgaWYgKGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgcmVzdG9yZUhlaWdodCB3aGVuIGNyZWF0aW5nIHJhbmRvbSB3YWxsZXRcIik7XG4gICAgICAgIHdhbGxldCA9IGF3YWl0IE1vbmVyb1dhbGxldEZ1bGwuY3JlYXRlV2FsbGV0UmFuZG9tKGNvbmZpZyk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIHNldCB3YWxsZXQncyBjb25uZWN0aW9uIG1hbmFnZXJcbiAgICBhd2FpdCB3YWxsZXQuc2V0Q29ubmVjdGlvbk1hbmFnZXIoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpO1xuICAgIHJldHVybiB3YWxsZXQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgY3JlYXRlV2FsbGV0RnJvbVNlZWQoY29uZmlnOiBNb25lcm9XYWxsZXRDb25maWcpOiBQcm9taXNlPE1vbmVyb1dhbGxldEZ1bGw+IHtcblxuICAgIC8vIHZhbGlkYXRlIGFuZCBub3JtYWxpemUgcGFyYW1zXG4gICAgbGV0IGRhZW1vbkNvbm5lY3Rpb24gPSBjb25maWcuZ2V0U2VydmVyKCk7XG4gICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZCA9IGRhZW1vbkNvbm5lY3Rpb24gPyBkYWVtb25Db25uZWN0aW9uLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdHJ1ZTtcbiAgICBpZiAoY29uZmlnLmdldFJlc3RvcmVIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UmVzdG9yZUhlaWdodCgwKTtcbiAgICBpZiAoY29uZmlnLmdldFNlZWRPZmZzZXQoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0U2VlZE9mZnNldChcIlwiKTtcbiAgICBcbiAgICAvLyBsb2FkIGZ1bGwgd2FzbSBtb2R1bGVcbiAgICBsZXQgbW9kdWxlID0gYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRGdWxsTW9kdWxlKCk7XG4gICAgXG4gICAgLy8gY3JlYXRlIHdhbGxldCBpbiBxdWV1ZVxuICAgIGxldCB3YWxsZXQgPSBhd2FpdCBtb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgLy8gcmVnaXN0ZXIgZm4gaW5mb3JtaW5nIGlmIHVuYXV0aG9yaXplZCByZXFzIHNob3VsZCBiZSByZWplY3RlZFxuICAgICAgICBsZXQgcmVqZWN0VW5hdXRob3JpemVkRm5JZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnNldFJlamVjdFVuYXV0aG9yaXplZEZuKHJlamVjdFVuYXV0aG9yaXplZEZuSWQsICgpID0+IHJlamVjdFVuYXV0aG9yaXplZCk7XG4gICAgICAgIFxuICAgICAgICAvLyBjcmVhdGUgd2FsbGV0IGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgbW9kdWxlLmNyZWF0ZV9mdWxsX3dhbGxldChKU09OLnN0cmluZ2lmeShjb25maWcudG9Kc29uKCkpLCByZWplY3RVbmF1dGhvcml6ZWRGbklkLCBhc3luYyAoY3BwQWRkcmVzcykgPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgY3BwQWRkcmVzcyA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihjcHBBZGRyZXNzKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9XYWxsZXRGdWxsKGNwcEFkZHJlc3MsIGNvbmZpZy5nZXRQYXRoKCksIGNvbmZpZy5nZXRQYXNzd29yZCgpLCBjb25maWcuZ2V0RnMoKSwgY29uZmlnLmdldFNlcnZlcigpID8gY29uZmlnLmdldFNlcnZlcigpLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdW5kZWZpbmVkLCByZWplY3RVbmF1dGhvcml6ZWRGbklkKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgXG4gICAgLy8gc2F2ZSB3YWxsZXRcbiAgICBpZiAoY29uZmlnLmdldFBhdGgoKSkgYXdhaXQgd2FsbGV0LnNhdmUoKTtcbiAgICByZXR1cm4gd2FsbGV0O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIGNyZWF0ZVdhbGxldEZyb21LZXlzKGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKTogUHJvbWlzZTxNb25lcm9XYWxsZXRGdWxsPiB7XG5cbiAgICAvLyB2YWxpZGF0ZSBhbmQgbm9ybWFsaXplIHBhcmFtc1xuICAgIE1vbmVyb05ldHdvcmtUeXBlLnZhbGlkYXRlKGNvbmZpZy5nZXROZXR3b3JrVHlwZSgpKTtcbiAgICBpZiAoY29uZmlnLmdldFByaW1hcnlBZGRyZXNzKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFByaW1hcnlBZGRyZXNzKFwiXCIpO1xuICAgIGlmIChjb25maWcuZ2V0UHJpdmF0ZVZpZXdLZXkoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UHJpdmF0ZVZpZXdLZXkoXCJcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQcml2YXRlU3BlbmRLZXkoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UHJpdmF0ZVNwZW5kS2V5KFwiXCIpO1xuICAgIGxldCBkYWVtb25Db25uZWN0aW9uID0gY29uZmlnLmdldFNlcnZlcigpO1xuICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWQgPSBkYWVtb25Db25uZWN0aW9uID8gZGFlbW9uQ29ubmVjdGlvbi5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHRydWU7XG4gICAgaWYgKGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFJlc3RvcmVIZWlnaHQoMCk7XG4gICAgaWYgKGNvbmZpZy5nZXRMYW5ndWFnZSgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRMYW5ndWFnZShcIkVuZ2xpc2hcIik7XG4gICAgXG4gICAgLy8gbG9hZCBmdWxsIHdhc20gbW9kdWxlXG4gICAgbGV0IG1vZHVsZSA9IGF3YWl0IExpYnJhcnlVdGlscy5sb2FkRnVsbE1vZHVsZSgpO1xuICAgIFxuICAgIC8vIGNyZWF0ZSB3YWxsZXQgaW4gcXVldWVcbiAgICBsZXQgd2FsbGV0ID0gYXdhaXQgbW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgLy8gcmVnaXN0ZXIgZm4gaW5mb3JtaW5nIGlmIHVuYXV0aG9yaXplZCByZXFzIHNob3VsZCBiZSByZWplY3RlZFxuICAgICAgICBsZXQgcmVqZWN0VW5hdXRob3JpemVkRm5JZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnNldFJlamVjdFVuYXV0aG9yaXplZEZuKHJlamVjdFVuYXV0aG9yaXplZEZuSWQsICgpID0+IHJlamVjdFVuYXV0aG9yaXplZCk7XG4gICAgICAgIFxuICAgICAgICAvLyBjcmVhdGUgd2FsbGV0IGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgbW9kdWxlLmNyZWF0ZV9mdWxsX3dhbGxldChKU09OLnN0cmluZ2lmeShjb25maWcudG9Kc29uKCkpLCByZWplY3RVbmF1dGhvcml6ZWRGbklkLCBhc3luYyAoY3BwQWRkcmVzcykgPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgY3BwQWRkcmVzcyA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihjcHBBZGRyZXNzKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9XYWxsZXRGdWxsKGNwcEFkZHJlc3MsIGNvbmZpZy5nZXRQYXRoKCksIGNvbmZpZy5nZXRQYXNzd29yZCgpLCBjb25maWcuZ2V0RnMoKSwgY29uZmlnLmdldFNlcnZlcigpID8gY29uZmlnLmdldFNlcnZlcigpLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdW5kZWZpbmVkLCByZWplY3RVbmF1dGhvcml6ZWRGbklkKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgXG4gICAgLy8gc2F2ZSB3YWxsZXRcbiAgICBpZiAoY29uZmlnLmdldFBhdGgoKSkgYXdhaXQgd2FsbGV0LnNhdmUoKTtcbiAgICByZXR1cm4gd2FsbGV0O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIGNyZWF0ZVdhbGxldFJhbmRvbShjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZyk6IFByb21pc2U8TW9uZXJvV2FsbGV0RnVsbD4ge1xuICAgIFxuICAgIC8vIHZhbGlkYXRlIGFuZCBub3JtYWxpemUgcGFyYW1zXG4gICAgaWYgKGNvbmZpZy5nZXRMYW5ndWFnZSgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRMYW5ndWFnZShcIkVuZ2xpc2hcIik7XG4gICAgbGV0IGRhZW1vbkNvbm5lY3Rpb24gPSBjb25maWcuZ2V0U2VydmVyKCk7XG4gICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZCA9IGRhZW1vbkNvbm5lY3Rpb24gPyBkYWVtb25Db25uZWN0aW9uLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdHJ1ZTtcbiAgICBcbiAgICAvLyBsb2FkIHdhc20gbW9kdWxlXG4gICAgbGV0IG1vZHVsZSA9IGF3YWl0IExpYnJhcnlVdGlscy5sb2FkRnVsbE1vZHVsZSgpO1xuICAgIFxuICAgIC8vIGNyZWF0ZSB3YWxsZXQgaW4gcXVldWVcbiAgICBsZXQgd2FsbGV0ID0gYXdhaXQgbW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgLy8gcmVnaXN0ZXIgZm4gaW5mb3JtaW5nIGlmIHVuYXV0aG9yaXplZCByZXFzIHNob3VsZCBiZSByZWplY3RlZFxuICAgICAgICBsZXQgcmVqZWN0VW5hdXRob3JpemVkRm5JZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnNldFJlamVjdFVuYXV0aG9yaXplZEZuKHJlamVjdFVuYXV0aG9yaXplZEZuSWQsICgpID0+IHJlamVjdFVuYXV0aG9yaXplZCk7XG4gICAgICBcbiAgICAgICAgLy8gY3JlYXRlIHdhbGxldCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIG1vZHVsZS5jcmVhdGVfZnVsbF93YWxsZXQoSlNPTi5zdHJpbmdpZnkoY29uZmlnLnRvSnNvbigpKSwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCwgYXN5bmMgKGNwcEFkZHJlc3MpID0+IHtcbiAgICAgICAgICBpZiAodHlwZW9mIGNwcEFkZHJlc3MgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoY3BwQWRkcmVzcykpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvV2FsbGV0RnVsbChjcHBBZGRyZXNzLCBjb25maWcuZ2V0UGF0aCgpLCBjb25maWcuZ2V0UGFzc3dvcmQoKSwgY29uZmlnLmdldEZzKCksIGNvbmZpZy5nZXRTZXJ2ZXIoKSA/IGNvbmZpZy5nZXRTZXJ2ZXIoKS5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHVuZGVmaW5lZCwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIFxuICAgIC8vIHNhdmUgd2FsbGV0XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkpIGF3YWl0IHdhbGxldC5zYXZlKCk7XG4gICAgcmV0dXJuIHdhbGxldDtcbiAgfVxuICBcbiAgc3RhdGljIGFzeW5jIGdldFNlZWRMYW5ndWFnZXMoKSB7XG4gICAgbGV0IG1vZHVsZSA9IGF3YWl0IExpYnJhcnlVdGlscy5sb2FkRnVsbE1vZHVsZSgpO1xuICAgIHJldHVybiBtb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBKU09OLnBhcnNlKG1vZHVsZS5nZXRfa2V5c193YWxsZXRfc2VlZF9sYW5ndWFnZXMoKSkubGFuZ3VhZ2VzO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGdldEZzKCkge1xuICAgIGlmICghTW9uZXJvV2FsbGV0RnVsbC5GUykgTW9uZXJvV2FsbGV0RnVsbC5GUyA9IEdlblV0aWxzLmlzQnJvd3NlcigpID8gdW5kZWZpbmVkIDogZnM7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuRlM7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLSBXQUxMRVQgTUVUSE9EUyBTUEVDSUZJQyBUTyBXQVNNIElNUExFTUVOVEFUSU9OIC0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gVE9ETzogbW92ZSB0aGVzZSB0byBNb25lcm9XYWxsZXQudHMsIG90aGVycyBjYW4gYmUgdW5zdXBwb3J0ZWRcbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIG1heGltdW0gaGVpZ2h0IG9mIHRoZSBwZWVycyB0aGUgd2FsbGV0J3MgZGFlbW9uIGlzIGNvbm5lY3RlZCB0by5cbiAgICpcbiAgICogQHJldHVybiB7UHJvbWlzZTxudW1iZXI+fSB0aGUgbWF4aW11bSBoZWlnaHQgb2YgdGhlIHBlZXJzIHRoZSB3YWxsZXQncyBkYWVtb24gaXMgY29ubmVjdGVkIHRvXG4gICAqL1xuICBhc3luYyBnZXREYWVtb25NYXhQZWVySGVpZ2h0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXREYWVtb25NYXhQZWVySGVpZ2h0KCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIFxuICAgICAgICAvLyBjYWxsIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X2RhZW1vbl9tYXhfcGVlcl9oZWlnaHQodGhpcy5jcHBBZGRyZXNzLCAocmVzcCkgPT4ge1xuICAgICAgICAgIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIHdhbGxldCdzIGRhZW1vbiBpcyBzeW5jZWQgd2l0aCB0aGUgbmV0d29yay5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgdGhlIGRhZW1vbiBpcyBzeW5jZWQgd2l0aCB0aGUgbmV0d29yaywgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBhc3luYyBpc0RhZW1vblN5bmNlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmlzRGFlbW9uU3luY2VkKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIFxuICAgICAgICAvLyBjYWxsIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgdGhpcy5tb2R1bGUuaXNfZGFlbW9uX3N5bmNlZCh0aGlzLmNwcEFkZHJlc3MsIChyZXNwKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgd2FsbGV0IGlzIHN5bmNlZCB3aXRoIHRoZSBkYWVtb24uXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSB0cnVlIGlmIHRoZSB3YWxsZXQgaXMgc3luY2VkIHdpdGggdGhlIGRhZW1vbiwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBhc3luYyBpc1N5bmNlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmlzU3luY2VkKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuaXNfc3luY2VkKHRoaXMuY3BwQWRkcmVzcywgKHJlc3ApID0+IHtcbiAgICAgICAgICByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSB3YWxsZXQncyBuZXR3b3JrIHR5cGUgKG1haW5uZXQsIHRlc3RuZXQsIG9yIHN0YWdlbmV0KS5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvTmV0d29ya1R5cGU+fSB0aGUgd2FsbGV0J3MgbmV0d29yayB0eXBlXG4gICAqL1xuICBhc3luYyBnZXROZXR3b3JrVHlwZSgpOiBQcm9taXNlPE1vbmVyb05ldHdvcmtUeXBlPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXROZXR3b3JrVHlwZSgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5nZXRfbmV0d29ya190eXBlKHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGhlaWdodCBvZiB0aGUgZmlyc3QgYmxvY2sgdGhhdCB0aGUgd2FsbGV0IHNjYW5zLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxudW1iZXI+fSB0aGUgaGVpZ2h0IG9mIHRoZSBmaXJzdCBibG9jayB0aGF0IHRoZSB3YWxsZXQgc2NhbnNcbiAgICovXG4gIGFzeW5jIGdldFJlc3RvcmVIZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFJlc3RvcmVIZWlnaHQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gdGhpcy5tb2R1bGUuZ2V0X3Jlc3RvcmVfaGVpZ2h0KHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZXQgdGhlIGhlaWdodCBvZiB0aGUgZmlyc3QgYmxvY2sgdGhhdCB0aGUgd2FsbGV0IHNjYW5zLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IHJlc3RvcmVIZWlnaHQgLSBoZWlnaHQgb2YgdGhlIGZpcnN0IGJsb2NrIHRoYXQgdGhlIHdhbGxldCBzY2Fuc1xuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc2V0UmVzdG9yZUhlaWdodChyZXN0b3JlSGVpZ2h0OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNldFJlc3RvcmVIZWlnaHQocmVzdG9yZUhlaWdodCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdGhpcy5tb2R1bGUuc2V0X3Jlc3RvcmVfaGVpZ2h0KHRoaXMuY3BwQWRkcmVzcywgcmVzdG9yZUhlaWdodCk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBNb3ZlIHRoZSB3YWxsZXQgZnJvbSBpdHMgY3VycmVudCBwYXRoIHRvIHRoZSBnaXZlbiBwYXRoLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggLSB0aGUgd2FsbGV0J3MgZGVzdGluYXRpb24gcGF0aFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgbW92ZVRvKHBhdGg6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkubW92ZVRvKHBhdGgpO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLm1vdmVUbyhwYXRoLCB0aGlzKTtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gQ09NTU9OIFdBTExFVCBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIGFzeW5jIGFkZExpc3RlbmVyKGxpc3RlbmVyOiBNb25lcm9XYWxsZXRMaXN0ZW5lcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIGFzc2VydChsaXN0ZW5lciBpbnN0YW5jZW9mIE1vbmVyb1dhbGxldExpc3RlbmVyLCBcIkxpc3RlbmVyIG11c3QgYmUgaW5zdGFuY2Ugb2YgTW9uZXJvV2FsbGV0TGlzdGVuZXJcIik7XG4gICAgdGhpcy5saXN0ZW5lcnMucHVzaChsaXN0ZW5lcik7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoTGlzdGVuaW5nKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgbGV0IGlkeCA9IHRoaXMubGlzdGVuZXJzLmluZGV4T2YobGlzdGVuZXIpO1xuICAgIGlmIChpZHggPiAtMSkgdGhpcy5saXN0ZW5lcnMuc3BsaWNlKGlkeCwgMSk7XG4gICAgZWxzZSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJMaXN0ZW5lciBpcyBub3QgcmVnaXN0ZXJlZCB3aXRoIHdhbGxldFwiKTtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgfVxuICBcbiAgZ2V0TGlzdGVuZXJzKCk6IE1vbmVyb1dhbGxldExpc3RlbmVyW10ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0TGlzdGVuZXJzKCk7XG4gICAgcmV0dXJuIHRoaXMubGlzdGVuZXJzO1xuICB9XG4gIFxuICBhc3luYyBzZXREYWVtb25Db25uZWN0aW9uKHVyaU9yQ29ubmVjdGlvbj86IE1vbmVyb1JwY0Nvbm5lY3Rpb24gfCBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNldERhZW1vbkNvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uKTtcbiAgICBcbiAgICAvLyBub3JtYWxpemUgY29ubmVjdGlvblxuICAgIGxldCBjb25uZWN0aW9uID0gIXVyaU9yQ29ubmVjdGlvbiA/IHVuZGVmaW5lZCA6IHVyaU9yQ29ubmVjdGlvbiBpbnN0YW5jZW9mIE1vbmVyb1JwY0Nvbm5lY3Rpb24gPyB1cmlPckNvbm5lY3Rpb24gOiBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih1cmlPckNvbm5lY3Rpb24pO1xuICAgIGxldCB1cmkgPSBjb25uZWN0aW9uICYmIGNvbm5lY3Rpb24uZ2V0VXJpKCkgPyBjb25uZWN0aW9uLmdldFVyaSgpIDogXCJcIjtcbiAgICBsZXQgdXNlcm5hbWUgPSBjb25uZWN0aW9uICYmIGNvbm5lY3Rpb24uZ2V0VXNlcm5hbWUoKSA/IGNvbm5lY3Rpb24uZ2V0VXNlcm5hbWUoKSA6IFwiXCI7XG4gICAgbGV0IHBhc3N3b3JkID0gY29ubmVjdGlvbiAmJiBjb25uZWN0aW9uLmdldFBhc3N3b3JkKCkgPyBjb25uZWN0aW9uLmdldFBhc3N3b3JkKCkgOiBcIlwiO1xuICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWQgPSBjb25uZWN0aW9uID8gY29ubmVjdGlvbi5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHVuZGVmaW5lZDtcbiAgICB0aGlzLnJlamVjdFVuYXV0aG9yaXplZCA9IHJlamVjdFVuYXV0aG9yaXplZDsgIC8vIHBlcnNpc3QgbG9jYWxseVxuICAgIFxuICAgIC8vIHNldCBjb25uZWN0aW9uIGluIHF1ZXVlXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuc2V0X2RhZW1vbl9jb25uZWN0aW9uKHRoaXMuY3BwQWRkcmVzcywgdXJpLCB1c2VybmFtZSwgcGFzc3dvcmQsIChyZXNwKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXREYWVtb25Db25uZWN0aW9uKCk6IFByb21pc2U8TW9uZXJvUnBjQ29ubmVjdGlvbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0RGFlbW9uQ29ubmVjdGlvbigpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGxldCBjb25uZWN0aW9uQ29udGFpbmVyU3RyID0gdGhpcy5tb2R1bGUuZ2V0X2RhZW1vbl9jb25uZWN0aW9uKHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgICAgIGlmICghY29ubmVjdGlvbkNvbnRhaW5lclN0cikgcmVzb2x2ZSh1bmRlZmluZWQpO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBsZXQganNvbkNvbm5lY3Rpb24gPSBKU09OLnBhcnNlKGNvbm5lY3Rpb25Db250YWluZXJTdHIpO1xuICAgICAgICAgIHJlc29sdmUobmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24oe3VyaToganNvbkNvbm5lY3Rpb24udXJpLCB1c2VybmFtZToganNvbkNvbm5lY3Rpb24udXNlcm5hbWUsIHBhc3N3b3JkOiBqc29uQ29ubmVjdGlvbi5wYXNzd29yZCwgcmVqZWN0VW5hdXRob3JpemVkOiB0aGlzLnJlamVjdFVuYXV0aG9yaXplZH0pKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzQ29ubmVjdGVkVG9EYWVtb24oKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pc0Nvbm5lY3RlZFRvRGFlbW9uKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuaXNfY29ubmVjdGVkX3RvX2RhZW1vbih0aGlzLmNwcEFkZHJlc3MsIChyZXNwKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VmVyc2lvbigpOiBQcm9taXNlPE1vbmVyb1ZlcnNpb24+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFZlcnNpb24oKTtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBhdGgoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFBhdGgoKTtcbiAgICByZXR1cm4gdGhpcy5wYXRoO1xuICB9XG4gIFxuICBhc3luYyBnZXRJbnRlZ3JhdGVkQWRkcmVzcyhzdGFuZGFyZEFkZHJlc3M/OiBzdHJpbmcsIHBheW1lbnRJZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEludGVncmF0ZWRBZGRyZXNzKHN0YW5kYXJkQWRkcmVzcywgcGF5bWVudElkKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gdGhpcy5tb2R1bGUuZ2V0X2ludGVncmF0ZWRfYWRkcmVzcyh0aGlzLmNwcEFkZHJlc3MsIHN0YW5kYXJkQWRkcmVzcyA/IHN0YW5kYXJkQWRkcmVzcyA6IFwiXCIsIHBheW1lbnRJZCA/IHBheW1lbnRJZCA6IFwiXCIpO1xuICAgICAgICBpZiAocmVzdWx0LmNoYXJBdCgwKSAhPT0gXCJ7XCIpIHRocm93IG5ldyBNb25lcm9FcnJvcihyZXN1bHQpO1xuICAgICAgICByZXR1cm4gbmV3IE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzKEpTT04ucGFyc2UocmVzdWx0KSk7XG4gICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICBpZiAoZXJyLm1lc3NhZ2UuaW5jbHVkZXMoXCJJbnZhbGlkIHBheW1lbnQgSURcIikpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkludmFsaWQgcGF5bWVudCBJRDogXCIgKyBwYXltZW50SWQpO1xuICAgICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZXJyLm1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyhpbnRlZ3JhdGVkQWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3MpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGxldCByZXN1bHQgPSB0aGlzLm1vZHVsZS5kZWNvZGVfaW50ZWdyYXRlZF9hZGRyZXNzKHRoaXMuY3BwQWRkcmVzcywgaW50ZWdyYXRlZEFkZHJlc3MpO1xuICAgICAgICBpZiAocmVzdWx0LmNoYXJBdCgwKSAhPT0gXCJ7XCIpIHRocm93IG5ldyBNb25lcm9FcnJvcihyZXN1bHQpO1xuICAgICAgICByZXR1cm4gbmV3IE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzKEpTT04ucGFyc2UocmVzdWx0KSk7XG4gICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZXJyLm1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRIZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEhlaWdodCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmdldF9oZWlnaHQodGhpcy5jcHBBZGRyZXNzLCAocmVzcCkgPT4ge1xuICAgICAgICAgIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldERhZW1vbkhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0RGFlbW9uSGVpZ2h0KCk7XG4gICAgaWYgKCEoYXdhaXQgdGhpcy5pc0Nvbm5lY3RlZFRvRGFlbW9uKCkpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgaXMgbm90IGNvbm5lY3RlZCB0byBkYWVtb25cIik7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X2RhZW1vbl9oZWlnaHQodGhpcy5jcHBBZGRyZXNzLCAocmVzcCkgPT4ge1xuICAgICAgICAgIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhlaWdodEJ5RGF0ZSh5ZWFyOiBudW1iZXIsIG1vbnRoOiBudW1iZXIsIGRheTogbnVtYmVyKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEhlaWdodEJ5RGF0ZSh5ZWFyLCBtb250aCwgZGF5KTtcbiAgICBpZiAoIShhd2FpdCB0aGlzLmlzQ29ubmVjdGVkVG9EYWVtb24oKSkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBpcyBub3QgY29ubmVjdGVkIHRvIGRhZW1vblwiKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfaGVpZ2h0X2J5X2RhdGUodGhpcy5jcHBBZGRyZXNzLCB5ZWFyLCBtb250aCwgZGF5LCAocmVzcCkgPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgcmVzcCA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogU3luY2hyb25pemUgdGhlIHdhbGxldCB3aXRoIHRoZSBkYWVtb24gYXMgYSBvbmUtdGltZSBzeW5jaHJvbm91cyBwcm9jZXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9XYWxsZXRMaXN0ZW5lcnxudW1iZXJ9IFtsaXN0ZW5lck9yU3RhcnRIZWlnaHRdIC0gbGlzdGVuZXIgeG9yIHN0YXJ0IGhlaWdodCAoZGVmYXVsdHMgdG8gbm8gc3luYyBsaXN0ZW5lciwgdGhlIGxhc3Qgc3luY2VkIGJsb2NrKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3N0YXJ0SGVpZ2h0XSAtIHN0YXJ0SGVpZ2h0IGlmIG5vdCBnaXZlbiBpbiBmaXJzdCBhcmcgKGRlZmF1bHRzIHRvIGxhc3Qgc3luY2VkIGJsb2NrKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFthbGxvd0NvbmN1cnJlbnRDYWxsc10gLSBhbGxvdyBvdGhlciB3YWxsZXQgbWV0aG9kcyB0byBiZSBwcm9jZXNzZWQgc2ltdWx0YW5lb3VzbHkgZHVyaW5nIHN5bmMgKGRlZmF1bHQgZmFsc2UpPGJyPjxicj48Yj5XQVJOSU5HPC9iPjogZW5hYmxpbmcgdGhpcyBvcHRpb24gd2lsbCBjcmFzaCB3YWxsZXQgZXhlY3V0aW9uIGlmIGFub3RoZXIgY2FsbCBtYWtlcyBhIHNpbXVsdGFuZW91cyBuZXR3b3JrIHJlcXVlc3QuIFRPRE86IHBvc3NpYmxlIHRvIHN5bmMgd2FzbSBuZXR3b3JrIHJlcXVlc3RzIGluIGh0dHBfY2xpZW50X3dhc20uY3BwPyBcbiAgICovXG4gIGFzeW5jIHN5bmMobGlzdGVuZXJPclN0YXJ0SGVpZ2h0PzogTW9uZXJvV2FsbGV0TGlzdGVuZXIgfCBudW1iZXIsIHN0YXJ0SGVpZ2h0PzogbnVtYmVyLCBhbGxvd0NvbmN1cnJlbnRDYWxscyA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9TeW5jUmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zeW5jKGxpc3RlbmVyT3JTdGFydEhlaWdodCwgc3RhcnRIZWlnaHQsIGFsbG93Q29uY3VycmVudENhbGxzKTtcbiAgICBpZiAoIShhd2FpdCB0aGlzLmlzQ29ubmVjdGVkVG9EYWVtb24oKSkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBpcyBub3QgY29ubmVjdGVkIHRvIGRhZW1vblwiKTtcbiAgICBcbiAgICAvLyBub3JtYWxpemUgcGFyYW1zXG4gICAgc3RhcnRIZWlnaHQgPSBsaXN0ZW5lck9yU3RhcnRIZWlnaHQgPT09IHVuZGVmaW5lZCB8fCBsaXN0ZW5lck9yU3RhcnRIZWlnaHQgaW5zdGFuY2VvZiBNb25lcm9XYWxsZXRMaXN0ZW5lciA/IHN0YXJ0SGVpZ2h0IDogbGlzdGVuZXJPclN0YXJ0SGVpZ2h0O1xuICAgIGxldCBsaXN0ZW5lciA9IGxpc3RlbmVyT3JTdGFydEhlaWdodCBpbnN0YW5jZW9mIE1vbmVyb1dhbGxldExpc3RlbmVyID8gbGlzdGVuZXJPclN0YXJ0SGVpZ2h0IDogdW5kZWZpbmVkO1xuICAgIGlmIChzdGFydEhlaWdodCA9PT0gdW5kZWZpbmVkKSBzdGFydEhlaWdodCA9IE1hdGgubWF4KGF3YWl0IHRoaXMuZ2V0SGVpZ2h0KCksIGF3YWl0IHRoaXMuZ2V0UmVzdG9yZUhlaWdodCgpKTtcbiAgICBcbiAgICAvLyByZWdpc3RlciBsaXN0ZW5lciBpZiBnaXZlblxuICAgIGlmIChsaXN0ZW5lcikgYXdhaXQgdGhpcy5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgXG4gICAgLy8gc3luYyB3YWxsZXRcbiAgICBsZXQgZXJyO1xuICAgIGxldCByZXN1bHQ7XG4gICAgdHJ5IHtcbiAgICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICAgIHJlc3VsdCA9IGF3YWl0IChhbGxvd0NvbmN1cnJlbnRDYWxscyA/IHN5bmNXYXNtKCkgOiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4gc3luY1dhc20oKSkpO1xuICAgICAgZnVuY3Rpb24gc3luY1dhc20oKSB7XG4gICAgICAgIHRoYXQuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAgIC8vIHN5bmMgd2FsbGV0IGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgICB0aGF0Lm1vZHVsZS5zeW5jKHRoYXQuY3BwQWRkcmVzcywgc3RhcnRIZWlnaHQsIGFzeW5jIChyZXNwKSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzcC5jaGFyQXQoMCkgIT09IFwie1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKTtcbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBsZXQgcmVzcEpzb24gPSBKU09OLnBhcnNlKHJlc3ApO1xuICAgICAgICAgICAgICByZXNvbHZlKG5ldyBNb25lcm9TeW5jUmVzdWx0KHJlc3BKc29uLm51bUJsb2Nrc0ZldGNoZWQsIHJlc3BKc29uLnJlY2VpdmVkTW9uZXkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZXJyID0gZTtcbiAgICB9XG4gICAgXG4gICAgLy8gdW5yZWdpc3RlciBsaXN0ZW5lclxuICAgIGlmIChsaXN0ZW5lcikgYXdhaXQgdGhpcy5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgXG4gICAgLy8gdGhyb3cgZXJyb3Igb3IgcmV0dXJuXG4gICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgXG4gIGFzeW5jIHN0YXJ0U3luY2luZyhzeW5jUGVyaW9kSW5Ncz86IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3RhcnRTeW5jaW5nKHN5bmNQZXJpb2RJbk1zKTtcbiAgICBpZiAoIShhd2FpdCB0aGlzLmlzQ29ubmVjdGVkVG9EYWVtb24oKSkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBpcyBub3QgY29ubmVjdGVkIHRvIGRhZW1vblwiKTtcbiAgICB0aGlzLnN5bmNQZXJpb2RJbk1zID0gc3luY1BlcmlvZEluTXMgPT09IHVuZGVmaW5lZCA/IE1vbmVyb1dhbGxldEZ1bGwuREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyA6IHN5bmNQZXJpb2RJbk1zO1xuICAgIGlmICghdGhpcy5zeW5jTG9vcGVyKSB0aGlzLnN5bmNMb29wZXIgPSBuZXcgVGFza0xvb3Blcihhc3luYyAoKSA9PiBhd2FpdCB0aGlzLmJhY2tncm91bmRTeW5jKCkpXG4gICAgdGhpcy5zeW5jTG9vcGVyLnN0YXJ0KHRoaXMuc3luY1BlcmlvZEluTXMpO1xuICB9XG4gICAgXG4gIGFzeW5jIHN0b3BTeW5jaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3RvcFN5bmNpbmcoKTtcbiAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgIGlmICh0aGlzLnN5bmNMb29wZXIpIHRoaXMuc3luY0xvb3Blci5zdG9wKCk7XG4gICAgdGhpcy5tb2R1bGUuc3RvcF9zeW5jaW5nKHRoaXMuY3BwQWRkcmVzcyk7IC8vIHRhc2sgaXMgbm90IHF1ZXVlZCBzbyB3YWxsZXQgc3RvcHMgaW1tZWRpYXRlbHlcbiAgfVxuICBcbiAgYXN5bmMgc2NhblR4cyh0eEhhc2hlczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNjYW5UeHModHhIYXNoZXMpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnNjYW5fdHhzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe3R4SGFzaGVzOiB0eEhhc2hlc30pLCAoZXJyKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihlcnIpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzY2FuU3BlbnQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5yZXNjYW5TcGVudCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnJlc2Nhbl9zcGVudCh0aGlzLmNwcEFkZHJlc3MsICgpID0+IHJlc29sdmUoKSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzY2FuQmxvY2tjaGFpbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnJlc2NhbkJsb2NrY2hhaW4oKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5yZXNjYW5fYmxvY2tjaGFpbih0aGlzLmNwcEFkZHJlc3MsICgpID0+IHJlc29sdmUoKSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmFsYW5jZShhY2NvdW50SWR4PzogbnVtYmVyLCBzdWJhZGRyZXNzSWR4PzogbnVtYmVyKTogUHJvbWlzZTxiaWdpbnQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEJhbGFuY2UoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgXG4gICAgICAvLyBnZXQgYmFsYW5jZSBlbmNvZGVkIGluIGpzb24gc3RyaW5nXG4gICAgICBsZXQgYmFsYW5jZVN0cjtcbiAgICAgIGlmIChhY2NvdW50SWR4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYXNzZXJ0KHN1YmFkZHJlc3NJZHggPT09IHVuZGVmaW5lZCwgXCJTdWJhZGRyZXNzIGluZGV4IG11c3QgYmUgdW5kZWZpbmVkIGlmIGFjY291bnQgaW5kZXggaXMgdW5kZWZpbmVkXCIpO1xuICAgICAgICBiYWxhbmNlU3RyID0gdGhpcy5tb2R1bGUuZ2V0X2JhbGFuY2Vfd2FsbGV0KHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgICB9IGVsc2UgaWYgKHN1YmFkZHJlc3NJZHggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBiYWxhbmNlU3RyID0gdGhpcy5tb2R1bGUuZ2V0X2JhbGFuY2VfYWNjb3VudCh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYmFsYW5jZVN0ciA9IHRoaXMubW9kdWxlLmdldF9iYWxhbmNlX3N1YmFkZHJlc3ModGhpcy5jcHBBZGRyZXNzLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gcGFyc2UganNvbiBzdHJpbmcgdG8gYmlnaW50XG4gICAgICByZXR1cm4gQmlnSW50KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhiYWxhbmNlU3RyKSkuYmFsYW5jZSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFVubG9ja2VkQmFsYW5jZShhY2NvdW50SWR4PzogbnVtYmVyLCBzdWJhZGRyZXNzSWR4PzogbnVtYmVyKTogUHJvbWlzZTxiaWdpbnQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFVubG9ja2VkQmFsYW5jZShhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBcbiAgICAgIC8vIGdldCBiYWxhbmNlIGVuY29kZWQgaW4ganNvbiBzdHJpbmdcbiAgICAgIGxldCB1bmxvY2tlZEJhbGFuY2VTdHI7XG4gICAgICBpZiAoYWNjb3VudElkeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGFzc2VydChzdWJhZGRyZXNzSWR4ID09PSB1bmRlZmluZWQsIFwiU3ViYWRkcmVzcyBpbmRleCBtdXN0IGJlIHVuZGVmaW5lZCBpZiBhY2NvdW50IGluZGV4IGlzIHVuZGVmaW5lZFwiKTtcbiAgICAgICAgdW5sb2NrZWRCYWxhbmNlU3RyID0gdGhpcy5tb2R1bGUuZ2V0X3VubG9ja2VkX2JhbGFuY2Vfd2FsbGV0KHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgICB9IGVsc2UgaWYgKHN1YmFkZHJlc3NJZHggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB1bmxvY2tlZEJhbGFuY2VTdHIgPSB0aGlzLm1vZHVsZS5nZXRfdW5sb2NrZWRfYmFsYW5jZV9hY2NvdW50KHRoaXMuY3BwQWRkcmVzcywgYWNjb3VudElkeCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1bmxvY2tlZEJhbGFuY2VTdHIgPSB0aGlzLm1vZHVsZS5nZXRfdW5sb2NrZWRfYmFsYW5jZV9zdWJhZGRyZXNzKHRoaXMuY3BwQWRkcmVzcywgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIHBhcnNlIGpzb24gc3RyaW5nIHRvIGJpZ2ludFxuICAgICAgcmV0dXJuIEJpZ0ludChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHModW5sb2NrZWRCYWxhbmNlU3RyKSkudW5sb2NrZWRCYWxhbmNlKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudHMoaW5jbHVkZVN1YmFkZHJlc3Nlcz86IGJvb2xlYW4sIHRhZz86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQWNjb3VudFtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRBY2NvdW50cyhpbmNsdWRlU3ViYWRkcmVzc2VzLCB0YWcpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCBhY2NvdW50c1N0ciA9IHRoaXMubW9kdWxlLmdldF9hY2NvdW50cyh0aGlzLmNwcEFkZHJlc3MsIGluY2x1ZGVTdWJhZGRyZXNzZXMgPyB0cnVlIDogZmFsc2UsIHRhZyA/IHRhZyA6IFwiXCIpO1xuICAgICAgbGV0IGFjY291bnRzID0gW107XG4gICAgICBmb3IgKGxldCBhY2NvdW50SnNvbiBvZiBKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMoYWNjb3VudHNTdHIpKS5hY2NvdW50cykge1xuICAgICAgICBhY2NvdW50cy5wdXNoKE1vbmVyb1dhbGxldEZ1bGwuc2FuaXRpemVBY2NvdW50KG5ldyBNb25lcm9BY2NvdW50KGFjY291bnRKc29uKSkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFjY291bnRzO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRBY2NvdW50KGFjY291bnRJZHg6IG51bWJlciwgaW5jbHVkZVN1YmFkZHJlc3Nlcz86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb0FjY291bnQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEFjY291bnQoYWNjb3VudElkeCwgaW5jbHVkZVN1YmFkZHJlc3Nlcyk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IGFjY291bnRTdHIgPSB0aGlzLm1vZHVsZS5nZXRfYWNjb3VudCh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgsIGluY2x1ZGVTdWJhZGRyZXNzZXMgPyB0cnVlIDogZmFsc2UpO1xuICAgICAgbGV0IGFjY291bnRKc29uID0gSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKGFjY291bnRTdHIpKTtcbiAgICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplQWNjb3VudChuZXcgTW9uZXJvQWNjb3VudChhY2NvdW50SnNvbikpO1xuICAgIH0pO1xuXG4gIH1cbiAgXG4gIGFzeW5jIGNyZWF0ZUFjY291bnQobGFiZWw/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0FjY291bnQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmNyZWF0ZUFjY291bnQobGFiZWwpO1xuICAgIGlmIChsYWJlbCA9PT0gdW5kZWZpbmVkKSBsYWJlbCA9IFwiXCI7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IGFjY291bnRTdHIgPSB0aGlzLm1vZHVsZS5jcmVhdGVfYWNjb3VudCh0aGlzLmNwcEFkZHJlc3MsIGxhYmVsKTtcbiAgICAgIGxldCBhY2NvdW50SnNvbiA9IEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhhY2NvdW50U3RyKSk7XG4gICAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZUFjY291bnQobmV3IE1vbmVyb0FjY291bnQoYWNjb3VudEpzb24pKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0luZGljZXM/OiBudW1iZXJbXSk6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzc1tdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgc3ViYWRkcmVzc0luZGljZXMpO1xuICAgIGxldCBhcmdzID0ge2FjY291bnRJZHg6IGFjY291bnRJZHgsIHN1YmFkZHJlc3NJbmRpY2VzOiBzdWJhZGRyZXNzSW5kaWNlcyA9PT0gdW5kZWZpbmVkID8gW10gOiBHZW5VdGlscy5saXN0aWZ5KHN1YmFkZHJlc3NJbmRpY2VzKX07XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IHN1YmFkZHJlc3Nlc0pzb24gPSBKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHModGhpcy5tb2R1bGUuZ2V0X3N1YmFkZHJlc3Nlcyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KGFyZ3MpKSkpLnN1YmFkZHJlc3NlcztcbiAgICAgIGxldCBzdWJhZGRyZXNzZXMgPSBbXTtcbiAgICAgIGZvciAobGV0IHN1YmFkZHJlc3NKc29uIG9mIHN1YmFkZHJlc3Nlc0pzb24pIHN1YmFkZHJlc3Nlcy5wdXNoKE1vbmVyb1dhbGxldEtleXMuc2FuaXRpemVTdWJhZGRyZXNzKG5ldyBNb25lcm9TdWJhZGRyZXNzKHN1YmFkZHJlc3NKc29uKSkpO1xuICAgICAgcmV0dXJuIHN1YmFkZHJlc3NlcztcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgY3JlYXRlU3ViYWRkcmVzcyhhY2NvdW50SWR4OiBudW1iZXIsIGxhYmVsPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jcmVhdGVTdWJhZGRyZXNzKGFjY291bnRJZHgsIGxhYmVsKTtcbiAgICBpZiAobGFiZWwgPT09IHVuZGVmaW5lZCkgbGFiZWwgPSBcIlwiO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCBzdWJhZGRyZXNzU3RyID0gdGhpcy5tb2R1bGUuY3JlYXRlX3N1YmFkZHJlc3ModGhpcy5jcHBBZGRyZXNzLCBhY2NvdW50SWR4LCBsYWJlbCk7XG4gICAgICBsZXQgc3ViYWRkcmVzc0pzb24gPSBKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMoc3ViYWRkcmVzc1N0cikpO1xuICAgICAgcmV0dXJuIE1vbmVyb1dhbGxldEtleXMuc2FuaXRpemVTdWJhZGRyZXNzKG5ldyBNb25lcm9TdWJhZGRyZXNzKHN1YmFkZHJlc3NKc29uKSk7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBzZXRTdWJhZGRyZXNzTGFiZWwoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIsIGxhYmVsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNldFN1YmFkZHJlc3NMYWJlbChhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4LCBsYWJlbCk7XG4gICAgaWYgKGxhYmVsID09PSB1bmRlZmluZWQpIGxhYmVsID0gXCJcIjtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0aGlzLm1vZHVsZS5zZXRfc3ViYWRkcmVzc19sYWJlbCh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIGxhYmVsKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhzKHF1ZXJ5Pzogc3RyaW5nW10gfCBQYXJ0aWFsPE1vbmVyb1R4UXVlcnk+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRUeHMocXVlcnkpO1xuXG4gICAgLy8gY29weSBhbmQgbm9ybWFsaXplIHF1ZXJ5IHVwIHRvIGJsb2NrXG4gICAgY29uc3QgcXVlcnlOb3JtYWxpemVkID0gcXVlcnkgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplVHhRdWVyeShxdWVyeSk7XG4gICAgXG4gICAgLy8gc2NoZWR1bGUgdGFza1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyBjYWxsIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFja1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfdHhzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkocXVlcnlOb3JtYWxpemVkLmdldEJsb2NrKCkudG9Kc29uKCkpLCAoYmxvY2tzSnNvblN0cikgPT4ge1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIGNoZWNrIGZvciBlcnJvclxuICAgICAgICAgIGlmIChibG9ja3NKc29uU3RyLmNoYXJBdCgwKSAhPT0gXCJ7XCIpIHtcbiAgICAgICAgICAgIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoYmxvY2tzSnNvblN0cikpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICAvLyByZXNvbHZlIHdpdGggZGVzZXJpYWxpemVkIHR4c1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXNvbHZlKE1vbmVyb1dhbGxldEZ1bGwuZGVzZXJpYWxpemVUeHMocXVlcnlOb3JtYWxpemVkLCBibG9ja3NKc29uU3RyKSk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFRyYW5zZmVycyhxdWVyeT86IFBhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT4pOiBQcm9taXNlPE1vbmVyb1RyYW5zZmVyW10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFRyYW5zZmVycyhxdWVyeSk7XG4gICAgXG4gICAgLy8gY29weSBhbmQgbm9ybWFsaXplIHF1ZXJ5IHVwIHRvIGJsb2NrXG4gICAgY29uc3QgcXVlcnlOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVRyYW5zZmVyUXVlcnkocXVlcnkpO1xuICAgIFxuICAgIC8vIHJldHVybiBwcm9taXNlIHdoaWNoIHJlc29sdmVzIG9uIGNhbGxiYWNrXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIGNhbGwgd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrXG4gICAgICAgIHRoaXMubW9kdWxlLmdldF90cmFuc2ZlcnModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeShxdWVyeU5vcm1hbGl6ZWQuZ2V0VHhRdWVyeSgpLmdldEJsb2NrKCkudG9Kc29uKCkpLCAoYmxvY2tzSnNvblN0cikgPT4ge1xuICAgICAgICAgICAgXG4gICAgICAgICAgLy8gY2hlY2sgZm9yIGVycm9yXG4gICAgICAgICAgaWYgKGJsb2Nrc0pzb25TdHIuY2hhckF0KDApICE9PSBcIntcIikge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihibG9ja3NKc29uU3RyKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgICBcbiAgICAgICAgICAvLyByZXNvbHZlIHdpdGggZGVzZXJpYWxpemVkIHRyYW5zZmVycyBcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzb2x2ZShNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplVHJhbnNmZXJzKHF1ZXJ5Tm9ybWFsaXplZCwgYmxvY2tzSnNvblN0cikpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRPdXRwdXRzKHF1ZXJ5PzogUGFydGlhbDxNb25lcm9PdXRwdXRRdWVyeT4pOiBQcm9taXNlPE1vbmVyb091dHB1dFdhbGxldFtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRPdXRwdXRzKHF1ZXJ5KTtcbiAgICBcbiAgICAvLyBjb3B5IGFuZCBub3JtYWxpemUgcXVlcnkgdXAgdG8gYmxvY2tcbiAgICBjb25zdCBxdWVyeU5vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplT3V0cHV0UXVlcnkocXVlcnkpO1xuICAgIFxuICAgIC8vIHJldHVybiBwcm9taXNlIHdoaWNoIHJlc29sdmVzIG9uIGNhbGxiYWNrXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+e1xuICAgICAgICBcbiAgICAgICAgLy8gY2FsbCB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2tcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X291dHB1dHModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeShxdWVyeU5vcm1hbGl6ZWQuZ2V0VHhRdWVyeSgpLmdldEJsb2NrKCkudG9Kc29uKCkpLCAoYmxvY2tzSnNvblN0cikgPT4ge1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIGNoZWNrIGZvciBlcnJvclxuICAgICAgICAgIGlmIChibG9ja3NKc29uU3RyLmNoYXJBdCgwKSAhPT0gXCJ7XCIpIHtcbiAgICAgICAgICAgIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoYmxvY2tzSnNvblN0cikpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICAvLyByZXNvbHZlIHdpdGggZGVzZXJpYWxpemVkIG91dHB1dHNcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzb2x2ZShNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplT3V0cHV0cyhxdWVyeU5vcm1hbGl6ZWQsIGJsb2Nrc0pzb25TdHIpKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0T3V0cHV0cyhhbGwgPSBmYWxzZSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5leHBvcnRPdXRwdXRzKGFsbCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZXhwb3J0X291dHB1dHModGhpcy5jcHBBZGRyZXNzLCBhbGwsIChvdXRwdXRzSGV4KSA9PiByZXNvbHZlKG91dHB1dHNIZXgpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRPdXRwdXRzKG91dHB1dHNIZXg6IHN0cmluZyk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pbXBvcnRPdXRwdXRzKG91dHB1dHNIZXgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmltcG9ydF9vdXRwdXRzKHRoaXMuY3BwQWRkcmVzcywgb3V0cHV0c0hleCwgKG51bUltcG9ydGVkKSA9PiByZXNvbHZlKG51bUltcG9ydGVkKSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0S2V5SW1hZ2VzKGFsbCA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5leHBvcnRLZXlJbWFnZXMoYWxsKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5leHBvcnRfa2V5X2ltYWdlcyh0aGlzLmNwcEFkZHJlc3MsIGFsbCwgKGtleUltYWdlc1N0cikgPT4ge1xuICAgICAgICAgIGlmIChrZXlJbWFnZXNTdHIuY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3Ioa2V5SW1hZ2VzU3RyKSk7IC8vIGpzb24gZXhwZWN0ZWQsIGVsc2UgZXJyb3JcbiAgICAgICAgICBsZXQga2V5SW1hZ2VzID0gW107XG4gICAgICAgICAgZm9yIChsZXQga2V5SW1hZ2VKc29uIG9mIEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhrZXlJbWFnZXNTdHIpKS5rZXlJbWFnZXMpIGtleUltYWdlcy5wdXNoKG5ldyBNb25lcm9LZXlJbWFnZShrZXlJbWFnZUpzb24pKTtcbiAgICAgICAgICByZXNvbHZlKGtleUltYWdlcyk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGltcG9ydEtleUltYWdlcyhrZXlJbWFnZXM6IE1vbmVyb0tleUltYWdlW10pOiBQcm9taXNlPE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pbXBvcnRLZXlJbWFnZXMoa2V5SW1hZ2VzKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5pbXBvcnRfa2V5X2ltYWdlcyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHtrZXlJbWFnZXM6IGtleUltYWdlcy5tYXAoa2V5SW1hZ2UgPT4ga2V5SW1hZ2UudG9Kc29uKCkpfSksIChrZXlJbWFnZUltcG9ydFJlc3VsdFN0cikgPT4ge1xuICAgICAgICAgIHJlc29sdmUobmV3IE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhrZXlJbWFnZUltcG9ydFJlc3VsdFN0cikpKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0KCk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQoKTtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGZyZWV6ZU91dHB1dChrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5mcmVlemVPdXRwdXQoa2V5SW1hZ2UpO1xuICAgIGlmICgha2V5SW1hZ2UpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3Qgc3BlY2lmeSBrZXkgaW1hZ2UgdG8gZnJlZXplXCIpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmZyZWV6ZV9vdXRwdXQodGhpcy5jcHBBZGRyZXNzLCBrZXlJbWFnZSwgKCkgPT4gcmVzb2x2ZSgpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyB0aGF3T3V0cHV0KGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnRoYXdPdXRwdXQoa2V5SW1hZ2UpO1xuICAgIGlmICgha2V5SW1hZ2UpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3Qgc3BlY2lmeSBrZXkgaW1hZ2UgdG8gdGhhd1wiKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS50aGF3X291dHB1dCh0aGlzLmNwcEFkZHJlc3MsIGtleUltYWdlLCAoKSA9PiByZXNvbHZlKCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzT3V0cHV0RnJvemVuKGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmlzT3V0cHV0RnJvemVuKGtleUltYWdlKTtcbiAgICBpZiAoIWtleUltYWdlKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHNwZWNpZnkga2V5IGltYWdlIHRvIGNoZWNrIGlmIGZyb3plblwiKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5pc19vdXRwdXRfZnJvemVuKHRoaXMuY3BwQWRkcmVzcywga2V5SW1hZ2UsIChyZXN1bHQpID0+IHJlc29sdmUocmVzdWx0KSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgY3JlYXRlVHhzKGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmNyZWF0ZVR4cyhjb25maWcpO1xuICAgIFxuICAgIC8vIHZhbGlkYXRlLCBjb3B5LCBhbmQgbm9ybWFsaXplIGNvbmZpZ1xuICAgIGNvbnN0IGNvbmZpZ05vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnKGNvbmZpZyk7XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSA9PT0gdW5kZWZpbmVkKSBjb25maWdOb3JtYWxpemVkLnNldENhblNwbGl0KHRydWUpO1xuICAgIFxuICAgIC8vIGNyZWF0ZSB0eHMgaW4gcXVldWVcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgLy8gY3JlYXRlIHR4cyBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIHRoaXMubW9kdWxlLmNyZWF0ZV90eHModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeShjb25maWdOb3JtYWxpemVkLnRvSnNvbigpKSwgKHR4U2V0SnNvblN0cikgPT4ge1xuICAgICAgICAgIGlmICh0eFNldEpzb25TdHIuY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IodHhTZXRKc29uU3RyKSk7IC8vIGpzb24gZXhwZWN0ZWQsIGVsc2UgZXJyb3JcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb1R4U2V0KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyh0eFNldEpzb25TdHIpKSkuZ2V0VHhzKCkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzd2VlcE91dHB1dChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3dlZXBPdXRwdXQoY29uZmlnKTtcbiAgICBcbiAgICAvLyBub3JtYWxpemUgYW5kIHZhbGlkYXRlIGNvbmZpZ1xuICAgIGNvbnN0IGNvbmZpZ05vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplU3dlZXBPdXRwdXRDb25maWcoY29uZmlnKTtcbiAgICBcbiAgICAvLyBzd2VlcCBvdXRwdXQgaW4gcXVldWVcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgLy8gc3dlZXAgb3V0cHV0IGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgdGhpcy5tb2R1bGUuc3dlZXBfb3V0cHV0KHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoY29uZmlnTm9ybWFsaXplZC50b0pzb24oKSksICh0eFNldEpzb25TdHIpID0+IHtcbiAgICAgICAgICBpZiAodHhTZXRKc29uU3RyLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHR4U2V0SnNvblN0cikpOyAvLyBqc29uIGV4cGVjdGVkLCBlbHNlIGVycm9yXG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9UeFNldChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHModHhTZXRKc29uU3RyKSkpLmdldFR4cygpWzBdKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIHN3ZWVwVW5sb2NrZWQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3dlZXBVbmxvY2tlZChjb25maWcpO1xuICAgIFxuICAgIC8vIHZhbGlkYXRlIGFuZCBub3JtYWxpemUgY29uZmlnXG4gICAgY29uc3QgY29uZmlnTm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVTd2VlcFVubG9ja2VkQ29uZmlnKGNvbmZpZyk7XG4gICAgXG4gICAgLy8gc3dlZXAgdW5sb2NrZWQgaW4gcXVldWVcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgLy8gc3dlZXAgdW5sb2NrZWQgaW4gd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICB0aGlzLm1vZHVsZS5zd2VlcF91bmxvY2tlZCh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KGNvbmZpZ05vcm1hbGl6ZWQudG9Kc29uKCkpLCAodHhTZXRzSnNvbikgPT4ge1xuICAgICAgICAgIGlmICh0eFNldHNKc29uLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHR4U2V0c0pzb24pKTsgLy8ganNvbiBleHBlY3RlZCwgZWxzZSBlcnJvclxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbGV0IHR4U2V0cyA9IFtdO1xuICAgICAgICAgICAgZm9yIChsZXQgdHhTZXRKc29uIG9mIEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyh0eFNldHNKc29uKSkudHhTZXRzKSB0eFNldHMucHVzaChuZXcgTW9uZXJvVHhTZXQodHhTZXRKc29uKSk7XG4gICAgICAgICAgICBsZXQgdHhzID0gW107XG4gICAgICAgICAgICBmb3IgKGxldCB0eFNldCBvZiB0eFNldHMpIGZvciAobGV0IHR4IG9mIHR4U2V0LmdldFR4cygpKSB0eHMucHVzaCh0eCk7XG4gICAgICAgICAgICByZXNvbHZlKHR4cyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzd2VlcER1c3QocmVsYXk/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zd2VlcER1c3QocmVsYXkpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyBjYWxsIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgdGhpcy5tb2R1bGUuc3dlZXBfZHVzdCh0aGlzLmNwcEFkZHJlc3MsIHJlbGF5LCAodHhTZXRKc29uU3RyKSA9PiB7XG4gICAgICAgICAgaWYgKHR4U2V0SnNvblN0ci5jaGFyQXQoMCkgIT09ICd7JykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcih0eFNldEpzb25TdHIpKTsgLy8ganNvbiBleHBlY3RlZCwgZWxzZSBlcnJvclxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbGV0IHR4U2V0ID0gbmV3IE1vbmVyb1R4U2V0KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyh0eFNldEpzb25TdHIpKSk7XG4gICAgICAgICAgICBpZiAodHhTZXQuZ2V0VHhzKCkgPT09IHVuZGVmaW5lZCkgdHhTZXQuc2V0VHhzKFtdKTtcbiAgICAgICAgICAgIHJlc29sdmUodHhTZXQuZ2V0VHhzKCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgcmVsYXlUeHModHhzT3JNZXRhZGF0YXM6IChNb25lcm9UeFdhbGxldCB8IHN0cmluZylbXSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnJlbGF5VHhzKHR4c09yTWV0YWRhdGFzKTtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheSh0eHNPck1ldGFkYXRhcyksIFwiTXVzdCBwcm92aWRlIGFuIGFycmF5IG9mIHR4cyBvciB0aGVpciBtZXRhZGF0YSB0byByZWxheVwiKTtcbiAgICBsZXQgdHhNZXRhZGF0YXMgPSBbXTtcbiAgICBmb3IgKGxldCB0eE9yTWV0YWRhdGEgb2YgdHhzT3JNZXRhZGF0YXMpIHR4TWV0YWRhdGFzLnB1c2godHhPck1ldGFkYXRhIGluc3RhbmNlb2YgTW9uZXJvVHhXYWxsZXQgPyB0eE9yTWV0YWRhdGEuZ2V0TWV0YWRhdGEoKSA6IHR4T3JNZXRhZGF0YSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUucmVsYXlfdHhzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe3R4TWV0YWRhdGFzOiB0eE1ldGFkYXRhc30pLCAodHhIYXNoZXNKc29uKSA9PiB7XG4gICAgICAgICAgaWYgKHR4SGFzaGVzSnNvbi5jaGFyQXQoMCkgIT09IFwie1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHR4SGFzaGVzSnNvbikpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShKU09OLnBhcnNlKHR4SGFzaGVzSnNvbikudHhIYXNoZXMpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBkZXNjcmliZVR4U2V0KHR4U2V0OiBNb25lcm9UeFNldCk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmRlc2NyaWJlVHhTZXQodHhTZXQpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHR4U2V0ID0gbmV3IE1vbmVyb1R4U2V0KHt1bnNpZ25lZFR4SGV4OiB0eFNldC5nZXRVbnNpZ25lZFR4SGV4KCksIHNpZ25lZFR4SGV4OiB0eFNldC5nZXRTaWduZWRUeEhleCgpLCBtdWx0aXNpZ1R4SGV4OiB0eFNldC5nZXRNdWx0aXNpZ1R4SGV4KCl9KTtcbiAgICAgIHRyeSB7IHJldHVybiBuZXcgTW9uZXJvVHhTZXQoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHRoaXMubW9kdWxlLmRlc2NyaWJlX3R4X3NldCh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHR4U2V0LnRvSnNvbigpKSkpKSk7IH1cbiAgICAgIGNhdGNoIChlcnIpIHsgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHRoaXMubW9kdWxlLmdldF9leGNlcHRpb25fbWVzc2FnZShlcnIpKTsgfVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzaWduVHhzKHVuc2lnbmVkVHhIZXg6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNpZ25UeHModW5zaWduZWRUeEhleCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdHJ5IHsgcmV0dXJuIG5ldyBNb25lcm9UeFNldChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHModGhpcy5tb2R1bGUuc2lnbl90eHModGhpcy5jcHBBZGRyZXNzLCB1bnNpZ25lZFR4SGV4KSkpKTsgfVxuICAgICAgY2F0Y2ggKGVycikgeyB0aHJvdyBuZXcgTW9uZXJvRXJyb3IodGhpcy5tb2R1bGUuZ2V0X2V4Y2VwdGlvbl9tZXNzYWdlKGVycikpOyB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdFR4cyhzaWduZWRUeEhleDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3VibWl0VHhzKHNpZ25lZFR4SGV4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5zdWJtaXRfdHhzKHRoaXMuY3BwQWRkcmVzcywgc2lnbmVkVHhIZXgsIChyZXNwKSA9PiB7XG4gICAgICAgICAgaWYgKHJlc3AuY2hhckF0KDApICE9PSBcIntcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKEpTT04ucGFyc2UocmVzcCkudHhIYXNoZXMpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzaWduTWVzc2FnZShtZXNzYWdlOiBzdHJpbmcsIHNpZ25hdHVyZVR5cGUgPSBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfU1BFTkRfS0VZLCBhY2NvdW50SWR4ID0gMCwgc3ViYWRkcmVzc0lkeCA9IDApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2lnbk1lc3NhZ2UobWVzc2FnZSwgc2lnbmF0dXJlVHlwZSwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG4gICAgXG4gICAgLy8gYXNzaWduIGRlZmF1bHRzXG4gICAgc2lnbmF0dXJlVHlwZSA9IHNpZ25hdHVyZVR5cGUgfHwgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWTtcbiAgICBhY2NvdW50SWR4ID0gYWNjb3VudElkeCB8fCAwO1xuICAgIHN1YmFkZHJlc3NJZHggPSBzdWJhZGRyZXNzSWR4IHx8IDA7XG4gICAgXG4gICAgLy8gcXVldWUgdGFzayB0byBzaWduIG1lc3NhZ2VcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkgeyByZXR1cm4gdGhpcy5tb2R1bGUuc2lnbl9tZXNzYWdlKHRoaXMuY3BwQWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlVHlwZSA9PT0gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSA/IDAgOiAxLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTsgfVxuICAgICAgY2F0Y2ggKGVycikgeyB0aHJvdyBuZXcgTW9uZXJvRXJyb3IodGhpcy5tb2R1bGUuZ2V0X2V4Y2VwdGlvbl9tZXNzYWdlKGVycikpOyB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHZlcmlmeU1lc3NhZ2UobWVzc2FnZTogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS52ZXJpZnlNZXNzYWdlKG1lc3NhZ2UsIGFkZHJlc3MsIHNpZ25hdHVyZSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IHJlc3VsdDtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJlc3VsdCA9IEpTT04ucGFyc2UodGhpcy5tb2R1bGUudmVyaWZ5X21lc3NhZ2UodGhpcy5jcHBBZGRyZXNzLCBtZXNzYWdlLCBhZGRyZXNzLCBzaWduYXR1cmUpKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICByZXN1bHQgPSB7aXNHb29kOiBmYWxzZX07XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQocmVzdWx0LmlzR29vZCA/XG4gICAgICAgIHtpc0dvb2Q6IHJlc3VsdC5pc0dvb2QsIGlzT2xkOiByZXN1bHQuaXNPbGQsIHNpZ25hdHVyZVR5cGU6IHJlc3VsdC5zaWduYXR1cmVUeXBlID09PSBcInNwZW5kXCIgPyBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfU1BFTkRfS0VZIDogTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1ZJRVdfS0VZLCB2ZXJzaW9uOiByZXN1bHQudmVyc2lvbn0gOlxuICAgICAgICB7aXNHb29kOiBmYWxzZX1cbiAgICAgICk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4S2V5KHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFR4S2V5KHR4SGFzaCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdHJ5IHsgcmV0dXJuIHRoaXMubW9kdWxlLmdldF90eF9rZXkodGhpcy5jcHBBZGRyZXNzLCB0eEhhc2gpOyB9XG4gICAgICBjYXRjaCAoZXJyKSB7IHRocm93IG5ldyBNb25lcm9FcnJvcih0aGlzLm1vZHVsZS5nZXRfZXhjZXB0aW9uX21lc3NhZ2UoZXJyKSk7IH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tUeEtleSh0eEhhc2g6IHN0cmluZywgdHhLZXk6IHN0cmluZywgYWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1R4PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jaGVja1R4S2V5KHR4SGFzaCwgdHhLZXksIGFkZHJlc3MpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTsgXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5jaGVja190eF9rZXkodGhpcy5jcHBBZGRyZXNzLCB0eEhhc2gsIHR4S2V5LCBhZGRyZXNzLCAocmVzcEpzb25TdHIpID0+IHtcbiAgICAgICAgICBpZiAocmVzcEpzb25TdHIuY2hhckF0KDApICE9PSBcIntcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwSnNvblN0cikpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvQ2hlY2tUeChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMocmVzcEpzb25TdHIpKSkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFByb29mKHR4SGFzaDogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0VHhQcm9vZih0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmdldF90eF9wcm9vZih0aGlzLmNwcEFkZHJlc3MsIHR4SGFzaCB8fCBcIlwiLCBhZGRyZXNzIHx8IFwiXCIsIG1lc3NhZ2UgfHwgXCJcIiwgKHNpZ25hdHVyZSkgPT4ge1xuICAgICAgICAgIGxldCBlcnJvcktleSA9IFwiZXJyb3I6IFwiO1xuICAgICAgICAgIGlmIChzaWduYXR1cmUuaW5kZXhPZihlcnJvcktleSkgPT09IDApIHJlamVjdChuZXcgTW9uZXJvRXJyb3Ioc2lnbmF0dXJlLnN1YnN0cmluZyhlcnJvcktleS5sZW5ndGgpKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKHNpZ25hdHVyZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrVHhQcm9vZih0eEhhc2g6IHN0cmluZywgYWRkcmVzczogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1R4PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jaGVja1R4UHJvb2YodHhIYXNoLCBhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTsgXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5jaGVja190eF9wcm9vZih0aGlzLmNwcEFkZHJlc3MsIHR4SGFzaCB8fCBcIlwiLCBhZGRyZXNzIHx8IFwiXCIsIG1lc3NhZ2UgfHwgXCJcIiwgc2lnbmF0dXJlIHx8IFwiXCIsIChyZXNwSnNvblN0cikgPT4ge1xuICAgICAgICAgIGlmIChyZXNwSnNvblN0ci5jaGFyQXQoMCkgIT09IFwie1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3BKc29uU3RyKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9DaGVja1R4KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhyZXNwSnNvblN0cikpKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFNwZW5kUHJvb2YodHhIYXNoOiBzdHJpbmcsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0U3BlbmRQcm9vZih0eEhhc2gsIG1lc3NhZ2UpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmdldF9zcGVuZF9wcm9vZih0aGlzLmNwcEFkZHJlc3MsIHR4SGFzaCB8fCBcIlwiLCBtZXNzYWdlIHx8IFwiXCIsIChzaWduYXR1cmUpID0+IHtcbiAgICAgICAgICBsZXQgZXJyb3JLZXkgPSBcImVycm9yOiBcIjtcbiAgICAgICAgICBpZiAoc2lnbmF0dXJlLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHNpZ25hdHVyZS5zdWJzdHJpbmcoZXJyb3JLZXkubGVuZ3RoKSkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShzaWduYXR1cmUpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBjaGVja1NwZW5kUHJvb2YodHhIYXNoOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmNoZWNrU3BlbmRQcm9vZih0eEhhc2gsIG1lc3NhZ2UsIHNpZ25hdHVyZSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpOyBcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmNoZWNrX3NwZW5kX3Byb29mKHRoaXMuY3BwQWRkcmVzcywgdHhIYXNoIHx8IFwiXCIsIG1lc3NhZ2UgfHwgXCJcIiwgc2lnbmF0dXJlIHx8IFwiXCIsIChyZXNwKSA9PiB7XG4gICAgICAgICAgdHlwZW9mIHJlc3AgPT09IFwic3RyaW5nXCIgPyByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKSA6IHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFJlc2VydmVQcm9vZldhbGxldChtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFJlc2VydmVQcm9vZldhbGxldChtZXNzYWdlKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfcmVzZXJ2ZV9wcm9vZl93YWxsZXQodGhpcy5jcHBBZGRyZXNzLCBtZXNzYWdlLCAoc2lnbmF0dXJlKSA9PiB7XG4gICAgICAgICAgbGV0IGVycm9yS2V5ID0gXCJlcnJvcjogXCI7XG4gICAgICAgICAgaWYgKHNpZ25hdHVyZS5pbmRleE9mKGVycm9yS2V5KSA9PT0gMCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihzaWduYXR1cmUuc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCksIC0xKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKHNpZ25hdHVyZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFJlc2VydmVQcm9vZkFjY291bnQoYWNjb3VudElkeDogbnVtYmVyLCBhbW91bnQ6IGJpZ2ludCwgbWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRSZXNlcnZlUHJvb2ZBY2NvdW50KGFjY291bnRJZHgsIGFtb3VudCwgbWVzc2FnZSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X3Jlc2VydmVfcHJvb2ZfYWNjb3VudCh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgsIGFtb3VudC50b1N0cmluZygpLCBtZXNzYWdlLCAoc2lnbmF0dXJlKSA9PiB7XG4gICAgICAgICAgbGV0IGVycm9yS2V5ID0gXCJlcnJvcjogXCI7XG4gICAgICAgICAgaWYgKHNpZ25hdHVyZS5pbmRleE9mKGVycm9yS2V5KSA9PT0gMCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihzaWduYXR1cmUuc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCksIC0xKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKHNpZ25hdHVyZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBjaGVja1Jlc2VydmVQcm9vZihhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrUmVzZXJ2ZT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuY2hlY2tSZXNlcnZlUHJvb2YoYWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7IFxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuY2hlY2tfcmVzZXJ2ZV9wcm9vZih0aGlzLmNwcEFkZHJlc3MsIGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSwgKHJlc3BKc29uU3RyKSA9PiB7XG4gICAgICAgICAgaWYgKHJlc3BKc29uU3RyLmNoYXJBdCgwKSAhPT0gXCJ7XCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcEpzb25TdHIsIC0xKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9DaGVja1Jlc2VydmUoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHJlc3BKc29uU3RyKSkpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhOb3Rlcyh0eEhhc2hlczogc3RyaW5nW10pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRUeE5vdGVzKHR4SGFzaGVzKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkgeyByZXR1cm4gSlNPTi5wYXJzZSh0aGlzLm1vZHVsZS5nZXRfdHhfbm90ZXModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7dHhIYXNoZXM6IHR4SGFzaGVzfSkpKS50eE5vdGVzOyB9XG4gICAgICBjYXRjaCAoZXJyKSB7IHRocm93IG5ldyBNb25lcm9FcnJvcih0aGlzLm1vZHVsZS5nZXRfZXhjZXB0aW9uX21lc3NhZ2UoZXJyKSk7IH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0VHhOb3Rlcyh0eEhhc2hlczogc3RyaW5nW10sIG5vdGVzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2V0VHhOb3Rlcyh0eEhhc2hlcywgbm90ZXMpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7IHRoaXMubW9kdWxlLnNldF90eF9ub3Rlcyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHt0eEhhc2hlczogdHhIYXNoZXMsIHR4Tm90ZXM6IG5vdGVzfSkpOyB9XG4gICAgICBjYXRjaCAoZXJyKSB7IHRocm93IG5ldyBNb25lcm9FcnJvcih0aGlzLm1vZHVsZS5nZXRfZXhjZXB0aW9uX21lc3NhZ2UoZXJyKSk7IH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzKGVudHJ5SW5kaWNlcz86IG51bWJlcltdKTogUHJvbWlzZTxNb25lcm9BZGRyZXNzQm9va0VudHJ5W10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEFkZHJlc3NCb29rRW50cmllcyhlbnRyeUluZGljZXMpO1xuICAgIGlmICghZW50cnlJbmRpY2VzKSBlbnRyeUluZGljZXMgPSBbXTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgZW50cmllcyA9IFtdO1xuICAgICAgZm9yIChsZXQgZW50cnlKc29uIG9mIEpTT04ucGFyc2UodGhpcy5tb2R1bGUuZ2V0X2FkZHJlc3NfYm9va19lbnRyaWVzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe2VudHJ5SW5kaWNlczogZW50cnlJbmRpY2VzfSkpKS5lbnRyaWVzKSB7XG4gICAgICAgIGVudHJpZXMucHVzaChuZXcgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeShlbnRyeUpzb24pKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBlbnRyaWVzO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBhZGRBZGRyZXNzQm9va0VudHJ5KGFkZHJlc3M6IHN0cmluZywgZGVzY3JpcHRpb24/OiBzdHJpbmcpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuYWRkQWRkcmVzc0Jvb2tFbnRyeShhZGRyZXNzLCBkZXNjcmlwdGlvbik7XG4gICAgaWYgKCFhZGRyZXNzKSBhZGRyZXNzID0gXCJcIjtcbiAgICBpZiAoIWRlc2NyaXB0aW9uKSBkZXNjcmlwdGlvbiA9IFwiXCI7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLmFkZF9hZGRyZXNzX2Jvb2tfZW50cnkodGhpcy5jcHBBZGRyZXNzLCBhZGRyZXNzLCBkZXNjcmlwdGlvbik7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGVkaXRBZGRyZXNzQm9va0VudHJ5KGluZGV4OiBudW1iZXIsIHNldEFkZHJlc3M6IGJvb2xlYW4sIGFkZHJlc3M6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2V0RGVzY3JpcHRpb246IGJvb2xlYW4sIGRlc2NyaXB0aW9uOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmVkaXRBZGRyZXNzQm9va0VudHJ5KGluZGV4LCBzZXRBZGRyZXNzLCBhZGRyZXNzLCBzZXREZXNjcmlwdGlvbiwgZGVzY3JpcHRpb24pO1xuICAgIGlmICghc2V0QWRkcmVzcykgc2V0QWRkcmVzcyA9IGZhbHNlO1xuICAgIGlmICghYWRkcmVzcykgYWRkcmVzcyA9IFwiXCI7XG4gICAgaWYgKCFzZXREZXNjcmlwdGlvbikgc2V0RGVzY3JpcHRpb24gPSBmYWxzZTtcbiAgICBpZiAoIWRlc2NyaXB0aW9uKSBkZXNjcmlwdGlvbiA9IFwiXCI7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdGhpcy5tb2R1bGUuZWRpdF9hZGRyZXNzX2Jvb2tfZW50cnkodGhpcy5jcHBBZGRyZXNzLCBpbmRleCwgc2V0QWRkcmVzcywgYWRkcmVzcywgc2V0RGVzY3JpcHRpb24sIGRlc2NyaXB0aW9uKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeShlbnRyeUlkeDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5kZWxldGVBZGRyZXNzQm9va0VudHJ5KGVudHJ5SWR4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0aGlzLm1vZHVsZS5kZWxldGVfYWRkcmVzc19ib29rX2VudHJ5KHRoaXMuY3BwQWRkcmVzcywgZW50cnlJZHgpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyB0YWdBY2NvdW50cyh0YWc6IHN0cmluZywgYWNjb3VudEluZGljZXM6IG51bWJlcltdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS50YWdBY2NvdW50cyh0YWcsIGFjY291bnRJbmRpY2VzKTtcbiAgICBpZiAoIXRhZykgdGFnID0gXCJcIjtcbiAgICBpZiAoIWFjY291bnRJbmRpY2VzKSBhY2NvdW50SW5kaWNlcyA9IFtdO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRoaXMubW9kdWxlLnRhZ19hY2NvdW50cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHt0YWc6IHRhZywgYWNjb3VudEluZGljZXM6IGFjY291bnRJbmRpY2VzfSkpO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgdW50YWdBY2NvdW50cyhhY2NvdW50SW5kaWNlczogbnVtYmVyW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnVudGFnQWNjb3VudHMoYWNjb3VudEluZGljZXMpO1xuICAgIGlmICghYWNjb3VudEluZGljZXMpIGFjY291bnRJbmRpY2VzID0gW107XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdGhpcy5tb2R1bGUudGFnX2FjY291bnRzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe2FjY291bnRJbmRpY2VzOiBhY2NvdW50SW5kaWNlc30pKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudFRhZ3MoKTogUHJvbWlzZTxNb25lcm9BY2NvdW50VGFnW10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEFjY291bnRUYWdzKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IGFjY291bnRUYWdzID0gW107XG4gICAgICBmb3IgKGxldCBhY2NvdW50VGFnSnNvbiBvZiBKU09OLnBhcnNlKHRoaXMubW9kdWxlLmdldF9hY2NvdW50X3RhZ3ModGhpcy5jcHBBZGRyZXNzKSkuYWNjb3VudFRhZ3MpIGFjY291bnRUYWdzLnB1c2gobmV3IE1vbmVyb0FjY291bnRUYWcoYWNjb3VudFRhZ0pzb24pKTtcbiAgICAgIHJldHVybiBhY2NvdW50VGFncztcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIHNldEFjY291bnRUYWdMYWJlbCh0YWc6IHN0cmluZywgbGFiZWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2V0QWNjb3VudFRhZ0xhYmVsKHRhZywgbGFiZWwpO1xuICAgIGlmICghdGFnKSB0YWcgPSBcIlwiO1xuICAgIGlmICghbGFiZWwpIGxhYmVsID0gXCJcIjtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0aGlzLm1vZHVsZS5zZXRfYWNjb3VudF90YWdfbGFiZWwodGhpcy5jcHBBZGRyZXNzLCB0YWcsIGxhYmVsKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGF5bWVudFVyaShjb25maWc6IE1vbmVyb1R4Q29uZmlnKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFBheW1lbnRVcmkoY29uZmlnKTtcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnKGNvbmZpZyk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLmdldF9wYXltZW50X3VyaSh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KGNvbmZpZy50b0pzb24oKSkpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBtYWtlIFVSSSBmcm9tIHN1cHBsaWVkIHBhcmFtZXRlcnNcIik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHBhcnNlUGF5bWVudFVyaSh1cmk6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhDb25maWc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnBhcnNlUGF5bWVudFVyaSh1cmkpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBuZXcgTW9uZXJvVHhDb25maWcoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHRoaXMubW9kdWxlLnBhcnNlX3BheW1lbnRfdXJpKHRoaXMuY3BwQWRkcmVzcywgdXJpKSkpKTtcbiAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihlcnIubWVzc2FnZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEF0dHJpYnV0ZShrZXk6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRBdHRyaWJ1dGUoa2V5KTtcbiAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgIGFzc2VydCh0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiLCBcIkF0dHJpYnV0ZSBrZXkgbXVzdCBiZSBhIHN0cmluZ1wiKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgdmFsdWUgPSB0aGlzLm1vZHVsZS5nZXRfYXR0cmlidXRlKHRoaXMuY3BwQWRkcmVzcywga2V5KTtcbiAgICAgIHJldHVybiB2YWx1ZSA9PT0gXCJcIiA/IG51bGwgOiB2YWx1ZTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0QXR0cmlidXRlKGtleTogc3RyaW5nLCB2YWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2V0QXR0cmlidXRlKGtleSwgdmFsKTtcbiAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgIGFzc2VydCh0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiLCBcIkF0dHJpYnV0ZSBrZXkgbXVzdCBiZSBhIHN0cmluZ1wiKTtcbiAgICBhc3NlcnQodHlwZW9mIHZhbCA9PT0gXCJzdHJpbmdcIiwgXCJBdHRyaWJ1dGUgdmFsdWUgbXVzdCBiZSBhIHN0cmluZ1wiKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0aGlzLm1vZHVsZS5zZXRfYXR0cmlidXRlKHRoaXMuY3BwQWRkcmVzcywga2V5LCB2YWwpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzdGFydE1pbmluZyhudW1UaHJlYWRzOiBudW1iZXIsIGJhY2tncm91bmRNaW5pbmc/OiBib29sZWFuLCBpZ25vcmVCYXR0ZXJ5PzogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3RhcnRNaW5pbmcobnVtVGhyZWFkcywgYmFja2dyb3VuZE1pbmluZywgaWdub3JlQmF0dGVyeSk7XG4gICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICBsZXQgZGFlbW9uID0gYXdhaXQgTW9uZXJvRGFlbW9uUnBjLmNvbm5lY3RUb0RhZW1vblJwYyhhd2FpdCB0aGlzLmdldERhZW1vbkNvbm5lY3Rpb24oKSk7XG4gICAgYXdhaXQgZGFlbW9uLnN0YXJ0TWluaW5nKGF3YWl0IHRoaXMuZ2V0UHJpbWFyeUFkZHJlc3MoKSwgbnVtVGhyZWFkcywgYmFja2dyb3VuZE1pbmluZywgaWdub3JlQmF0dGVyeSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0b3BNaW5pbmcoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zdG9wTWluaW5nKCk7XG4gICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICBsZXQgZGFlbW9uID0gYXdhaXQgTW9uZXJvRGFlbW9uUnBjLmNvbm5lY3RUb0RhZW1vblJwYyhhd2FpdCB0aGlzLmdldERhZW1vbkNvbm5lY3Rpb24oKSk7XG4gICAgYXdhaXQgZGFlbW9uLnN0b3BNaW5pbmcoKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmlzTXVsdGlzaWdJbXBvcnROZWVkZWQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gdGhpcy5tb2R1bGUuaXNfbXVsdGlzaWdfaW1wb3J0X25lZWRlZCh0aGlzLmNwcEFkZHJlc3MpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBpc011bHRpc2lnKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaXNNdWx0aXNpZygpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5pc19tdWx0aXNpZyh0aGlzLmNwcEFkZHJlc3MpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRNdWx0aXNpZ0luZm8oKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luZm8+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldE11bHRpc2lnSW5mbygpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgTW9uZXJvTXVsdGlzaWdJbmZvKEpTT04ucGFyc2UodGhpcy5tb2R1bGUuZ2V0X211bHRpc2lnX2luZm8odGhpcy5jcHBBZGRyZXNzKSkpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBwcmVwYXJlTXVsdGlzaWcoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnByZXBhcmVNdWx0aXNpZygpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5wcmVwYXJlX211bHRpc2lnKHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIG1ha2VNdWx0aXNpZyhtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgdGhyZXNob2xkOiBudW1iZXIsIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkubWFrZU11bHRpc2lnKG11bHRpc2lnSGV4ZXMsIHRocmVzaG9sZCwgcGFzc3dvcmQpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLm1ha2VfbXVsdGlzaWcodGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7bXVsdGlzaWdIZXhlczogbXVsdGlzaWdIZXhlcywgdGhyZXNob2xkOiB0aHJlc2hvbGQsIHBhc3N3b3JkOiBwYXNzd29yZH0pLCAocmVzcCkgPT4ge1xuICAgICAgICAgIGxldCBlcnJvcktleSA9IFwiZXJyb3I6IFwiO1xuICAgICAgICAgIGlmIChyZXNwLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3Auc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCkpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGV4Y2hhbmdlTXVsdGlzaWdLZXlzKG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdLCBwYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmV4Y2hhbmdlTXVsdGlzaWdLZXlzKG11bHRpc2lnSGV4ZXMsIHBhc3N3b3JkKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5leGNoYW5nZV9tdWx0aXNpZ19rZXlzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe211bHRpc2lnSGV4ZXM6IG11bHRpc2lnSGV4ZXMsIHBhc3N3b3JkOiBwYXNzd29yZH0pLCAocmVzcCkgPT4ge1xuICAgICAgICAgIGxldCBlcnJvcktleSA9IFwiZXJyb3I6IFwiO1xuICAgICAgICAgIGlmIChyZXNwLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3Auc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCkpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdChKU09OLnBhcnNlKHJlc3ApKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydE11bHRpc2lnSGV4KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5leHBvcnRNdWx0aXNpZ0hleCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5leHBvcnRfbXVsdGlzaWdfaGV4KHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGltcG9ydE11bHRpc2lnSGV4KG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmltcG9ydE11bHRpc2lnSGV4KG11bHRpc2lnSGV4ZXMpO1xuICAgIGlmICghR2VuVXRpbHMuaXNBcnJheShtdWx0aXNpZ0hleGVzKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIHN0cmluZ1tdIHRvIGltcG9ydE11bHRpc2lnSGV4KClcIilcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5pbXBvcnRfbXVsdGlzaWdfaGV4KHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe211bHRpc2lnSGV4ZXM6IG11bHRpc2lnSGV4ZXN9KSwgKHJlc3ApID0+IHtcbiAgICAgICAgICBpZiAodHlwZW9mIHJlc3AgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcCkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc2lnbk11bHRpc2lnVHhIZXgobXVsdGlzaWdUeEhleDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNpZ25NdWx0aXNpZ1R4SGV4KG11bHRpc2lnVHhIZXgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnNpZ25fbXVsdGlzaWdfdHhfaGV4KHRoaXMuY3BwQWRkcmVzcywgbXVsdGlzaWdUeEhleCwgKHJlc3ApID0+IHtcbiAgICAgICAgICBpZiAocmVzcC5jaGFyQXQoMCkgIT09IFwie1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb011bHRpc2lnU2lnblJlc3VsdChKU09OLnBhcnNlKHJlc3ApKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdE11bHRpc2lnVHhIZXgoc2lnbmVkTXVsdGlzaWdUeEhleDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3VibWl0TXVsdGlzaWdUeEhleChzaWduZWRNdWx0aXNpZ1R4SGV4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5zdWJtaXRfbXVsdGlzaWdfdHhfaGV4KHRoaXMuY3BwQWRkcmVzcywgc2lnbmVkTXVsdGlzaWdUeEhleCwgKHJlc3ApID0+IHtcbiAgICAgICAgICBpZiAocmVzcC5jaGFyQXQoMCkgIT09IFwie1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoSlNPTi5wYXJzZShyZXNwKS50eEhhc2hlcyk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIGtleXMgYW5kIGNhY2hlIGRhdGEuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPERhdGFWaWV3W10+fSBpcyB0aGUga2V5cyBhbmQgY2FjaGUgZGF0YSwgcmVzcGVjdGl2ZWx5XG4gICAqL1xuICBhc3luYyBnZXREYXRhKCk6IFByb21pc2U8RGF0YVZpZXdbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0RGF0YSgpO1xuICAgIFxuICAgIC8vIHF1ZXVlIGNhbGwgdG8gd2FzbSBtb2R1bGVcbiAgICBsZXQgdmlld09ubHkgPSBhd2FpdCB0aGlzLmlzVmlld09ubHkoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBcbiAgICAgIC8vIHN0b3JlIHZpZXdzIGluIGFycmF5XG4gICAgICBsZXQgdmlld3MgPSBbXTtcbiAgICAgIFxuICAgICAgLy8gbWFsbG9jIGNhY2hlIGJ1ZmZlciBhbmQgZ2V0IGJ1ZmZlciBsb2NhdGlvbiBpbiBjKysgaGVhcFxuICAgICAgbGV0IGNhY2hlQnVmZmVyTG9jID0gSlNPTi5wYXJzZSh0aGlzLm1vZHVsZS5nZXRfY2FjaGVfZmlsZV9idWZmZXIodGhpcy5jcHBBZGRyZXNzKSk7XG4gICAgICBcbiAgICAgIC8vIHJlYWQgYmluYXJ5IGRhdGEgZnJvbSBoZWFwIHRvIERhdGFWaWV3XG4gICAgICBsZXQgdmlldyA9IG5ldyBEYXRhVmlldyhuZXcgQXJyYXlCdWZmZXIoY2FjaGVCdWZmZXJMb2MubGVuZ3RoKSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNhY2hlQnVmZmVyTG9jLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZpZXcuc2V0SW50OChpLCB0aGlzLm1vZHVsZS5IRUFQVThbY2FjaGVCdWZmZXJMb2MucG9pbnRlciAvIFVpbnQ4QXJyYXkuQllURVNfUEVSX0VMRU1FTlQgKyBpXSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIGZyZWUgYmluYXJ5IG9uIGhlYXBcbiAgICAgIHRoaXMubW9kdWxlLl9mcmVlKGNhY2hlQnVmZmVyTG9jLnBvaW50ZXIpO1xuICAgICAgXG4gICAgICAvLyB3cml0ZSBjYWNoZSBmaWxlXG4gICAgICB2aWV3cy5wdXNoKEJ1ZmZlci5mcm9tKHZpZXcuYnVmZmVyKSk7XG4gICAgICBcbiAgICAgIC8vIG1hbGxvYyBrZXlzIGJ1ZmZlciBhbmQgZ2V0IGJ1ZmZlciBsb2NhdGlvbiBpbiBjKysgaGVhcFxuICAgICAgbGV0IGtleXNCdWZmZXJMb2MgPSBKU09OLnBhcnNlKHRoaXMubW9kdWxlLmdldF9rZXlzX2ZpbGVfYnVmZmVyKHRoaXMuY3BwQWRkcmVzcywgdGhpcy5wYXNzd29yZCwgdmlld09ubHkpKTtcbiAgICAgIFxuICAgICAgLy8gcmVhZCBiaW5hcnkgZGF0YSBmcm9tIGhlYXAgdG8gRGF0YVZpZXdcbiAgICAgIHZpZXcgPSBuZXcgRGF0YVZpZXcobmV3IEFycmF5QnVmZmVyKGtleXNCdWZmZXJMb2MubGVuZ3RoKSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXNCdWZmZXJMb2MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmlldy5zZXRJbnQ4KGksIHRoaXMubW9kdWxlLkhFQVBVOFtrZXlzQnVmZmVyTG9jLnBvaW50ZXIgLyBVaW50OEFycmF5LkJZVEVTX1BFUl9FTEVNRU5UICsgaV0pO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBmcmVlIGJpbmFyeSBvbiBoZWFwXG4gICAgICB0aGlzLm1vZHVsZS5fZnJlZShrZXlzQnVmZmVyTG9jLnBvaW50ZXIpO1xuICAgICAgXG4gICAgICAvLyBwcmVwZW5kIGtleXMgZmlsZVxuICAgICAgdmlld3MudW5zaGlmdChCdWZmZXIuZnJvbSh2aWV3LmJ1ZmZlcikpO1xuICAgICAgcmV0dXJuIHZpZXdzO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBjaGFuZ2VQYXNzd29yZChvbGRQYXNzd29yZDogc3RyaW5nLCBuZXdQYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jaGFuZ2VQYXNzd29yZChvbGRQYXNzd29yZCwgbmV3UGFzc3dvcmQpO1xuICAgIGlmIChvbGRQYXNzd29yZCAhPT0gdGhpcy5wYXNzd29yZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiSW52YWxpZCBvcmlnaW5hbCBwYXNzd29yZC5cIik7IC8vIHdhbGxldDIgdmVyaWZ5X3Bhc3N3b3JkIGxvYWRzIGZyb20gZGlzayBzbyB2ZXJpZnkgcGFzc3dvcmQgaGVyZVxuICAgIGlmIChuZXdQYXNzd29yZCA9PT0gdW5kZWZpbmVkKSBuZXdQYXNzd29yZCA9IFwiXCI7XG4gICAgYXdhaXQgdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5jaGFuZ2Vfd2FsbGV0X3Bhc3N3b3JkKHRoaXMuY3BwQWRkcmVzcywgb2xkUGFzc3dvcmQsIG5ld1Bhc3N3b3JkLCAoZXJyTXNnKSA9PiB7XG4gICAgICAgICAgaWYgKGVyck1zZykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihlcnJNc2cpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICB0aGlzLnBhc3N3b3JkID0gbmV3UGFzc3dvcmQ7XG4gICAgaWYgKHRoaXMucGF0aCkgYXdhaXQgdGhpcy5zYXZlKCk7IC8vIGF1dG8gc2F2ZVxuICB9XG4gIFxuICBhc3luYyBzYXZlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2F2ZSgpO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLnNhdmUodGhpcyk7XG4gIH1cbiAgXG4gIGFzeW5jIGNsb3NlKHNhdmUgPSBmYWxzZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLl9pc0Nsb3NlZCkgcmV0dXJuOyAvLyBubyBlZmZlY3QgaWYgY2xvc2VkXG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkge1xuICAgICAgYXdhaXQgdGhpcy5nZXRXYWxsZXRQcm94eSgpLmNsb3NlKHNhdmUpO1xuICAgICAgdGhpcy5faXNDbG9zZWQgPSB0cnVlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgICBhd2FpdCB0aGlzLnN0b3BTeW5jaW5nKCk7XG4gICAgYXdhaXQgc3VwZXIuY2xvc2Uoc2F2ZSk7XG4gICAgZGVsZXRlIHRoaXMucGF0aDtcbiAgICBkZWxldGUgdGhpcy5wYXNzd29yZDtcbiAgICBkZWxldGUgdGhpcy5saXN0ZW5lcnM7XG4gICAgZGVsZXRlIHRoaXMuZnVsbExpc3RlbmVyO1xuICAgIExpYnJhcnlVdGlscy5zZXRSZWplY3RVbmF1dGhvcml6ZWRGbih0aGlzLnJlamVjdFVuYXV0aG9yaXplZENvbmZpZ0lkLCB1bmRlZmluZWQpOyAvLyB1bnJlZ2lzdGVyIGZuIGluZm9ybWluZyBpZiB1bmF1dGhvcml6ZWQgcmVxcyBzaG91bGQgYmUgcmVqZWN0ZWRcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0gQUREIEpTRE9DIEZPUiBTVVBQT1JURUQgREVGQVVMVCBJTVBMRU1FTlRBVElPTlMgLS0tLS0tLS0tLS0tLS1cbiAgXG4gIGFzeW5jIGdldE51bUJsb2Nrc1RvVW5sb2NrKCk6IFByb21pc2U8bnVtYmVyW10+IHsgcmV0dXJuIHN1cGVyLmdldE51bUJsb2Nrc1RvVW5sb2NrKCk7IH1cbiAgYXN5bmMgZ2V0VHgodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7IHJldHVybiBzdXBlci5nZXRUeCh0eEhhc2gpOyB9XG4gIGFzeW5jIGdldEluY29taW5nVHJhbnNmZXJzKHF1ZXJ5OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KTogUHJvbWlzZTxNb25lcm9JbmNvbWluZ1RyYW5zZmVyW10+IHsgcmV0dXJuIHN1cGVyLmdldEluY29taW5nVHJhbnNmZXJzKHF1ZXJ5KTsgfVxuICBhc3luYyBnZXRPdXRnb2luZ1RyYW5zZmVycyhxdWVyeTogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5PikgeyByZXR1cm4gc3VwZXIuZ2V0T3V0Z29pbmdUcmFuc2ZlcnMocXVlcnkpOyB9XG4gIGFzeW5jIGNyZWF0ZVR4KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7IHJldHVybiBzdXBlci5jcmVhdGVUeChjb25maWcpOyB9XG4gIGFzeW5jIHJlbGF5VHgodHhPck1ldGFkYXRhOiBNb25lcm9UeFdhbGxldCB8IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7IHJldHVybiBzdXBlci5yZWxheVR4KHR4T3JNZXRhZGF0YSk7IH1cbiAgYXN5bmMgZ2V0VHhOb3RlKHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHsgcmV0dXJuIHN1cGVyLmdldFR4Tm90ZSh0eEhhc2gpOyB9XG4gIGFzeW5jIHNldFR4Tm90ZSh0eEhhc2g6IHN0cmluZywgbm90ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7IHJldHVybiBzdXBlci5zZXRUeE5vdGUodHhIYXNoLCBub3RlKTsgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIEhFTFBFUlMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgb3BlbldhbGxldERhdGEoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pIHtcbiAgICBpZiAoY29uZmlnLnByb3h5VG9Xb3JrZXIpIHJldHVybiBNb25lcm9XYWxsZXRGdWxsUHJveHkub3BlbldhbGxldERhdGEoY29uZmlnKTtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSBhbmQgbm9ybWFsaXplIHBhcmFtZXRlcnNcbiAgICBpZiAoY29uZmlnLm5ldHdvcmtUeXBlID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSB0aGUgd2FsbGV0J3MgbmV0d29yayB0eXBlXCIpO1xuICAgIGNvbmZpZy5uZXR3b3JrVHlwZSA9IE1vbmVyb05ldHdvcmtUeXBlLmZyb20oY29uZmlnLm5ldHdvcmtUeXBlKTtcbiAgICBsZXQgZGFlbW9uQ29ubmVjdGlvbiA9IGNvbmZpZy5nZXRTZXJ2ZXIoKTtcbiAgICBsZXQgZGFlbW9uVXJpID0gZGFlbW9uQ29ubmVjdGlvbiAmJiBkYWVtb25Db25uZWN0aW9uLmdldFVyaSgpID8gZGFlbW9uQ29ubmVjdGlvbi5nZXRVcmkoKSA6IFwiXCI7XG4gICAgbGV0IGRhZW1vblVzZXJuYW1lID0gZGFlbW9uQ29ubmVjdGlvbiAmJiBkYWVtb25Db25uZWN0aW9uLmdldFVzZXJuYW1lKCkgPyBkYWVtb25Db25uZWN0aW9uLmdldFVzZXJuYW1lKCkgOiBcIlwiO1xuICAgIGxldCBkYWVtb25QYXNzd29yZCA9IGRhZW1vbkNvbm5lY3Rpb24gJiYgZGFlbW9uQ29ubmVjdGlvbi5nZXRQYXNzd29yZCgpID8gZGFlbW9uQ29ubmVjdGlvbi5nZXRQYXNzd29yZCgpIDogXCJcIjtcbiAgICBsZXQgcmVqZWN0VW5hdXRob3JpemVkID0gZGFlbW9uQ29ubmVjdGlvbiA/IGRhZW1vbkNvbm5lY3Rpb24uZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkgOiB0cnVlO1xuICAgIFxuICAgIC8vIGxvYWQgd2FzbSBtb2R1bGVcbiAgICBsZXQgbW9kdWxlID0gYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRGdWxsTW9kdWxlKCk7XG4gICAgXG4gICAgLy8gb3BlbiB3YWxsZXQgaW4gcXVldWVcbiAgICByZXR1cm4gbW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgLy8gcmVnaXN0ZXIgZm4gaW5mb3JtaW5nIGlmIHVuYXV0aG9yaXplZCByZXFzIHNob3VsZCBiZSByZWplY3RlZFxuICAgICAgICBsZXQgcmVqZWN0VW5hdXRob3JpemVkRm5JZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnNldFJlamVjdFVuYXV0aG9yaXplZEZuKHJlamVjdFVuYXV0aG9yaXplZEZuSWQsICgpID0+IHJlamVjdFVuYXV0aG9yaXplZCk7XG4gICAgICBcbiAgICAgICAgLy8gY3JlYXRlIHdhbGxldCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIG1vZHVsZS5vcGVuX3dhbGxldF9mdWxsKGNvbmZpZy5wYXNzd29yZCwgY29uZmlnLm5ldHdvcmtUeXBlLCBjb25maWcua2V5c0RhdGEsIGNvbmZpZy5jYWNoZURhdGEsIGRhZW1vblVyaSwgZGFlbW9uVXNlcm5hbWUsIGRhZW1vblBhc3N3b3JkLCByZWplY3RVbmF1dGhvcml6ZWRGbklkLCAoY3BwQWRkcmVzcykgPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgY3BwQWRkcmVzcyA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihjcHBBZGRyZXNzKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9XYWxsZXRGdWxsKGNwcEFkZHJlc3MsIGNvbmZpZy5wYXRoLCBjb25maWcucGFzc3dvcmQsIGZzLCByZWplY3RVbmF1dGhvcml6ZWQsIHJlamVjdFVuYXV0aG9yaXplZEZuSWQpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHByb3RlY3RlZCBnZXRXYWxsZXRQcm94eSgpOiBNb25lcm9XYWxsZXRGdWxsUHJveHkge1xuICAgIHJldHVybiBzdXBlci5nZXRXYWxsZXRQcm94eSgpIGFzIE1vbmVyb1dhbGxldEZ1bGxQcm94eTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGJhY2tncm91bmRTeW5jKCkge1xuICAgIGxldCBsYWJlbCA9IHRoaXMucGF0aCA/IHRoaXMucGF0aCA6ICh0aGlzLmJyb3dzZXJNYWluUGF0aCA/IHRoaXMuYnJvd3Nlck1haW5QYXRoIDogXCJpbi1tZW1vcnkgd2FsbGV0XCIpOyAvLyBsYWJlbCBmb3IgbG9nXG4gICAgTGlicmFyeVV0aWxzLmxvZygxLCBcIkJhY2tncm91bmQgc3luY2hyb25pemluZyBcIiArIGxhYmVsKTtcbiAgICB0cnkgeyBhd2FpdCB0aGlzLnN5bmMoKTsgfVxuICAgIGNhdGNoIChlcnI6IGFueSkgeyBpZiAoIXRoaXMuX2lzQ2xvc2VkKSBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGJhY2tncm91bmQgc3luY2hyb25pemUgXCIgKyBsYWJlbCArIFwiOiBcIiArIGVyci5tZXNzYWdlKTsgfVxuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgcmVmcmVzaExpc3RlbmluZygpIHtcbiAgICBsZXQgaXNFbmFibGVkID0gdGhpcy5saXN0ZW5lcnMubGVuZ3RoID4gMDtcbiAgICBpZiAodGhpcy5mdWxsTGlzdGVuZXJIYW5kbGUgPT09IDAgJiYgIWlzRW5hYmxlZCB8fCB0aGlzLmZ1bGxMaXN0ZW5lckhhbmRsZSA+IDAgJiYgaXNFbmFibGVkKSByZXR1cm47IC8vIG5vIGRpZmZlcmVuY2VcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnNldF9saXN0ZW5lcihcbiAgICAgICAgICB0aGlzLmNwcEFkZHJlc3MsXG4gICAgICAgICAgdGhpcy5mdWxsTGlzdGVuZXJIYW5kbGUsXG4gICAgICAgICAgICBuZXdMaXN0ZW5lckhhbmRsZSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgbmV3TGlzdGVuZXJIYW5kbGUgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IobmV3TGlzdGVuZXJIYW5kbGUpKTtcbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5mdWxsTGlzdGVuZXJIYW5kbGUgPSBuZXdMaXN0ZW5lckhhbmRsZTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc0VuYWJsZWQgPyBhc3luYyAoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSkgPT4gYXdhaXQgdGhpcy5mdWxsTGlzdGVuZXIub25TeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSkgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBpc0VuYWJsZWQgPyBhc3luYyAoaGVpZ2h0KSA9PiBhd2FpdCB0aGlzLmZ1bGxMaXN0ZW5lci5vbk5ld0Jsb2NrKGhlaWdodCkgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBpc0VuYWJsZWQgPyBhc3luYyAobmV3QmFsYW5jZVN0ciwgbmV3VW5sb2NrZWRCYWxhbmNlU3RyKSA9PiBhd2FpdCB0aGlzLmZ1bGxMaXN0ZW5lci5vbkJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlU3RyLCBuZXdVbmxvY2tlZEJhbGFuY2VTdHIpIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgaXNFbmFibGVkID8gYXN5bmMgKGhlaWdodCwgdHhIYXNoLCBhbW91bnRTdHIsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIHZlcnNpb24sIHVubG9ja1RpbWUsIGlzTG9ja2VkKSA9PiBhd2FpdCB0aGlzLmZ1bGxMaXN0ZW5lci5vbk91dHB1dFJlY2VpdmVkKGhlaWdodCwgdHhIYXNoLCBhbW91bnRTdHIsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIHZlcnNpb24sIHVubG9ja1RpbWUsIGlzTG9ja2VkKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGlzRW5hYmxlZCA/IGFzeW5jIChoZWlnaHQsIHR4SGFzaCwgYW1vdW50U3RyLCBhY2NvdW50SWR4U3RyLCBzdWJhZGRyZXNzSWR4U3RyLCB2ZXJzaW9uLCB1bmxvY2tUaW1lLCBpc0xvY2tlZCkgPT4gYXdhaXQgdGhpcy5mdWxsTGlzdGVuZXIub25PdXRwdXRTcGVudChoZWlnaHQsIHR4SGFzaCwgYW1vdW50U3RyLCBhY2NvdW50SWR4U3RyLCBzdWJhZGRyZXNzSWR4U3RyLCB2ZXJzaW9uLCB1bmxvY2tUaW1lLCBpc0xvY2tlZCkgOiB1bmRlZmluZWQsXG4gICAgICAgICk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgc3RhdGljIHNhbml0aXplQmxvY2soYmxvY2spIHtcbiAgICBmb3IgKGxldCB0eCBvZiBibG9jay5nZXRUeHMoKSkgTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZVR4V2FsbGV0KHR4KTtcbiAgICByZXR1cm4gYmxvY2s7XG4gIH1cbiAgXG4gIHN0YXRpYyBzYW5pdGl6ZVR4V2FsbGV0KHR4KSB7XG4gICAgYXNzZXJ0KHR4IGluc3RhbmNlb2YgTW9uZXJvVHhXYWxsZXQpO1xuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgc3RhdGljIHNhbml0aXplQWNjb3VudChhY2NvdW50KSB7XG4gICAgaWYgKGFjY291bnQuZ2V0U3ViYWRkcmVzc2VzKCkpIHtcbiAgICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2YgYWNjb3VudC5nZXRTdWJhZGRyZXNzZXMoKSkgTW9uZXJvV2FsbGV0S2V5cy5zYW5pdGl6ZVN1YmFkZHJlc3Moc3ViYWRkcmVzcyk7XG4gICAgfVxuICAgIHJldHVybiBhY2NvdW50O1xuICB9XG4gIFxuICBzdGF0aWMgZGVzZXJpYWxpemVCbG9ja3MoYmxvY2tzSnNvblN0cikge1xuICAgIGxldCBibG9ja3NKc29uID0gSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKGJsb2Nrc0pzb25TdHIpKTtcbiAgICBsZXQgZGVzZXJpYWxpemVkQmxvY2tzOiBhbnkgPSB7fTtcbiAgICBkZXNlcmlhbGl6ZWRCbG9ja3MuYmxvY2tzID0gW107XG4gICAgaWYgKGJsb2Nrc0pzb24uYmxvY2tzKSBmb3IgKGxldCBibG9ja0pzb24gb2YgYmxvY2tzSnNvbi5ibG9ja3MpIGRlc2VyaWFsaXplZEJsb2Nrcy5ibG9ja3MucHVzaChNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplQmxvY2sobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWF9XQUxMRVQpKSk7XG4gICAgcmV0dXJuIGRlc2VyaWFsaXplZEJsb2NrcztcbiAgfVxuICBcbiAgc3RhdGljIGRlc2VyaWFsaXplVHhzKHF1ZXJ5LCBibG9ja3NKc29uU3RyKSB7XG4gICAgXG4gICAgLy8gZGVzZXJpYWxpemUgYmxvY2tzXG4gICAgbGV0IGRlc2VyaWFsaXplZEJsb2NrcyA9IE1vbmVyb1dhbGxldEZ1bGwuZGVzZXJpYWxpemVCbG9ja3MoYmxvY2tzSnNvblN0cik7XG4gICAgbGV0IGJsb2NrcyA9IGRlc2VyaWFsaXplZEJsb2Nrcy5ibG9ja3M7XG4gICAgXG4gICAgLy8gY29sbGVjdCB0eHNcbiAgICBsZXQgdHhzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2sgb2YgYmxvY2tzKSB7XG4gICAgICBNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplQmxvY2soYmxvY2spO1xuICAgICAgZm9yIChsZXQgdHggb2YgYmxvY2suZ2V0VHhzKCkpIHtcbiAgICAgICAgaWYgKGJsb2NrLmdldEhlaWdodCgpID09PSB1bmRlZmluZWQpIHR4LnNldEJsb2NrKHVuZGVmaW5lZCk7IC8vIGRlcmVmZXJlbmNlIHBsYWNlaG9sZGVyIGJsb2NrIGZvciB1bmNvbmZpcm1lZCB0eHNcbiAgICAgICAgdHhzLnB1c2godHgpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyByZS1zb3J0IHR4cyB3aGljaCBpcyBsb3N0IG92ZXIgd2FzbSBzZXJpYWxpemF0aW9uICAvLyBUT0RPOiBjb25maXJtIHRoYXQgb3JkZXIgaXMgbG9zdFxuICAgIGlmIChxdWVyeS5nZXRIYXNoZXMoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBsZXQgdHhNYXAgPSBuZXcgTWFwKCk7XG4gICAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHR4TWFwW3R4LmdldEhhc2goKV0gPSB0eDtcbiAgICAgIGxldCB0eHNTb3J0ZWQgPSBbXTtcbiAgICAgIGZvciAobGV0IHR4SGFzaCBvZiBxdWVyeS5nZXRIYXNoZXMoKSkgaWYgKHR4TWFwW3R4SGFzaF0gIT09IHVuZGVmaW5lZCkgdHhzU29ydGVkLnB1c2godHhNYXBbdHhIYXNoXSk7XG4gICAgICB0eHMgPSB0eHNTb3J0ZWQ7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0eHM7XG4gIH1cbiAgXG4gIHN0YXRpYyBkZXNlcmlhbGl6ZVRyYW5zZmVycyhxdWVyeSwgYmxvY2tzSnNvblN0cikge1xuICAgIFxuICAgIC8vIGRlc2VyaWFsaXplIGJsb2Nrc1xuICAgIGxldCBkZXNlcmlhbGl6ZWRCbG9ja3MgPSBNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplQmxvY2tzKGJsb2Nrc0pzb25TdHIpO1xuICAgIGxldCBibG9ja3MgPSBkZXNlcmlhbGl6ZWRCbG9ja3MuYmxvY2tzO1xuICAgIFxuICAgIC8vIGNvbGxlY3QgdHJhbnNmZXJzXG4gICAgbGV0IHRyYW5zZmVycyA9IFtdO1xuICAgIGZvciAobGV0IGJsb2NrIG9mIGJsb2Nrcykge1xuICAgICAgZm9yIChsZXQgdHggb2YgYmxvY2suZ2V0VHhzKCkpIHtcbiAgICAgICAgaWYgKGJsb2NrLmdldEhlaWdodCgpID09PSB1bmRlZmluZWQpIHR4LnNldEJsb2NrKHVuZGVmaW5lZCk7IC8vIGRlcmVmZXJlbmNlIHBsYWNlaG9sZGVyIGJsb2NrIGZvciB1bmNvbmZpcm1lZCB0eHNcbiAgICAgICAgaWYgKHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSAhPT0gdW5kZWZpbmVkKSB0cmFuc2ZlcnMucHVzaCh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkpO1xuICAgICAgICBpZiAodHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgZm9yIChsZXQgdHJhbnNmZXIgb2YgdHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSkgdHJhbnNmZXJzLnB1c2godHJhbnNmZXIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0cmFuc2ZlcnM7XG4gIH1cbiAgXG4gIHN0YXRpYyBkZXNlcmlhbGl6ZU91dHB1dHMocXVlcnksIGJsb2Nrc0pzb25TdHIpIHtcbiAgICBcbiAgICAvLyBkZXNlcmlhbGl6ZSBibG9ja3NcbiAgICBsZXQgZGVzZXJpYWxpemVkQmxvY2tzID0gTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZUJsb2NrcyhibG9ja3NKc29uU3RyKTtcbiAgICBsZXQgYmxvY2tzID0gZGVzZXJpYWxpemVkQmxvY2tzLmJsb2NrcztcbiAgICBcbiAgICAvLyBjb2xsZWN0IG91dHB1dHNcbiAgICBsZXQgb3V0cHV0cyA9IFtdO1xuICAgIGZvciAobGV0IGJsb2NrIG9mIGJsb2Nrcykge1xuICAgICAgZm9yIChsZXQgdHggb2YgYmxvY2suZ2V0VHhzKCkpIHtcbiAgICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIHR4LmdldE91dHB1dHMoKSkgb3V0cHV0cy5wdXNoKG91dHB1dCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvdXRwdXRzO1xuICB9XG4gIFxuICAvKipcbiAgICogU2V0IHRoZSBwYXRoIG9mIHRoZSB3YWxsZXQgb24gdGhlIGJyb3dzZXIgbWFpbiB0aHJlYWQgaWYgcnVuIGFzIGEgd29ya2VyLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGJyb3dzZXJNYWluUGF0aCAtIHBhdGggb2YgdGhlIHdhbGxldCBvbiB0aGUgYnJvd3NlciBtYWluIHRocmVhZFxuICAgKi9cbiAgcHJvdGVjdGVkIHNldEJyb3dzZXJNYWluUGF0aChicm93c2VyTWFpblBhdGgpIHtcbiAgICB0aGlzLmJyb3dzZXJNYWluUGF0aCA9IGJyb3dzZXJNYWluUGF0aDtcbiAgfVxuICBcbiAgc3RhdGljIGFzeW5jIG1vdmVUbyhwYXRoLCB3YWxsZXQpIHtcbiAgICBpZiAoYXdhaXQgd2FsbGV0LmlzQ2xvc2VkKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBpcyBjbG9zZWRcIik7XG4gICAgaWYgKCFwYXRoKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgcGF0aCBvZiBkZXN0aW5hdGlvbiB3YWxsZXRcIik7XG4gICAgXG4gICAgLy8gc2F2ZSBhbmQgcmV0dXJuIGlmIHNhbWUgcGF0aFxuICAgIGlmIChQYXRoLm5vcm1hbGl6ZSh3YWxsZXQucGF0aCkgPT09IFBhdGgubm9ybWFsaXplKHBhdGgpKSB7XG4gICAgICBhd2FpdCB3YWxsZXQuc2F2ZSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBcbiAgICAvLyBjcmVhdGUgZGVzdGluYXRpb24gZGlyZWN0b3J5IGlmIGl0IGRvZXNuJ3QgZXhpc3RcbiAgICBsZXQgd2FsbGV0RGlyID0gUGF0aC5kaXJuYW1lKHBhdGgpO1xuICAgIGlmICghd2FsbGV0LmZzLmV4aXN0c1N5bmMod2FsbGV0RGlyKSkge1xuICAgICAgdHJ5IHsgd2FsbGV0LmZzLm1rZGlyU3luYyh3YWxsZXREaXIpOyB9XG4gICAgICBjYXRjaCAoZXJyOiBhbnkpIHsgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiRGVzdGluYXRpb24gcGF0aCBcIiArIHBhdGggKyBcIiBkb2VzIG5vdCBleGlzdCBhbmQgY2Fubm90IGJlIGNyZWF0ZWQ6IFwiICsgZXJyLm1lc3NhZ2UpOyB9XG4gICAgfVxuICAgIFxuICAgIC8vIHdyaXRlIHdhbGxldCBmaWxlc1xuICAgIGxldCBkYXRhID0gYXdhaXQgd2FsbGV0LmdldERhdGEoKTtcbiAgICB3YWxsZXQuZnMud3JpdGVGaWxlU3luYyhwYXRoICsgXCIua2V5c1wiLCBkYXRhWzBdLCBcImJpbmFyeVwiKTtcbiAgICB3YWxsZXQuZnMud3JpdGVGaWxlU3luYyhwYXRoLCBkYXRhWzFdLCBcImJpbmFyeVwiKTtcbiAgICB3YWxsZXQuZnMud3JpdGVGaWxlU3luYyhwYXRoICsgXCIuYWRkcmVzcy50eHRcIiwgYXdhaXQgd2FsbGV0LmdldFByaW1hcnlBZGRyZXNzKCkpO1xuICAgIGxldCBvbGRQYXRoID0gd2FsbGV0LnBhdGg7XG4gICAgd2FsbGV0LnBhdGggPSBwYXRoO1xuICAgIFxuICAgIC8vIGRlbGV0ZSBvbGQgd2FsbGV0IGZpbGVzXG4gICAgaWYgKG9sZFBhdGgpIHtcbiAgICAgIHdhbGxldC5mcy51bmxpbmtTeW5jKG9sZFBhdGggKyBcIi5hZGRyZXNzLnR4dFwiKTtcbiAgICAgIHdhbGxldC5mcy51bmxpbmtTeW5jKG9sZFBhdGggKyBcIi5rZXlzXCIpO1xuICAgICAgd2FsbGV0LmZzLnVubGlua1N5bmMob2xkUGF0aCk7XG4gICAgfVxuICB9XG4gIFxuICBzdGF0aWMgYXN5bmMgc2F2ZSh3YWxsZXQ6IGFueSkge1xuICAgIGlmIChhd2FpdCB3YWxsZXQuaXNDbG9zZWQoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGlzIGNsb3NlZFwiKTtcbiAgICAgICAgXG4gICAgLy8gcGF0aCBtdXN0IGJlIHNldFxuICAgIGxldCBwYXRoID0gYXdhaXQgd2FsbGV0LmdldFBhdGgoKTtcbiAgICBpZiAoIXBhdGgpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzYXZlIHdhbGxldCBiZWNhdXNlIHBhdGggaXMgbm90IHNldFwiKTtcbiAgICBcbiAgICAvLyB3cml0ZSB3YWxsZXQgZmlsZXMgdG8gKi5uZXdcbiAgICBsZXQgcGF0aE5ldyA9IHBhdGggKyBcIi5uZXdcIjtcbiAgICBsZXQgZGF0YSA9IGF3YWl0IHdhbGxldC5nZXREYXRhKCk7XG4gICAgd2FsbGV0LmZzLndyaXRlRmlsZVN5bmMocGF0aE5ldyArIFwiLmtleXNcIiwgZGF0YVswXSwgXCJiaW5hcnlcIik7XG4gICAgd2FsbGV0LmZzLndyaXRlRmlsZVN5bmMocGF0aE5ldywgZGF0YVsxXSwgXCJiaW5hcnlcIik7XG4gICAgd2FsbGV0LmZzLndyaXRlRmlsZVN5bmMocGF0aE5ldyArIFwiLmFkZHJlc3MudHh0XCIsIGF3YWl0IHdhbGxldC5nZXRQcmltYXJ5QWRkcmVzcygpKTtcbiAgICBcbiAgICAvLyByZXBsYWNlIG9sZCB3YWxsZXQgZmlsZXMgd2l0aCBuZXdcbiAgICB3YWxsZXQuZnMucmVuYW1lU3luYyhwYXRoTmV3ICsgXCIua2V5c1wiLCBwYXRoICsgXCIua2V5c1wiKTtcbiAgICB3YWxsZXQuZnMucmVuYW1lU3luYyhwYXRoTmV3LCBwYXRoLCBwYXRoICsgXCIua2V5c1wiKTtcbiAgICB3YWxsZXQuZnMucmVuYW1lU3luYyhwYXRoTmV3ICsgXCIuYWRkcmVzcy50eHRcIiwgcGF0aCArIFwiLmFkZHJlc3MudHh0XCIsIHBhdGggKyBcIi5rZXlzXCIpO1xuICB9XG59XG5cbi8qKlxuICogSW1wbGVtZW50cyBhIE1vbmVyb1dhbGxldCBieSBwcm94eWluZyByZXF1ZXN0cyB0byBhIHdvcmtlciB3aGljaCBydW5zIGEgZnVsbCB3YWxsZXQuXG4gKiBcbiAqIEBwcml2YXRlXG4gKi9cbmNsYXNzIE1vbmVyb1dhbGxldEZ1bGxQcm94eSBleHRlbmRzIE1vbmVyb1dhbGxldEtleXNQcm94eSB7XG5cbiAgLy8gaW5zdGFuY2UgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBwYXRoOiBhbnk7XG4gIHByb3RlY3RlZCBmczogYW55O1xuICBwcm90ZWN0ZWQgd3JhcHBlZExpc3RlbmVyczogYW55O1xuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gV0FMTEVUIFNUQVRJQyBVVElMUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIHN0YXRpYyBhc3luYyBvcGVuV2FsbGV0RGF0YShjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPikge1xuICAgIGxldCB3YWxsZXRJZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICBpZiAoY29uZmlnLnBhc3N3b3JkID09PSB1bmRlZmluZWQpIGNvbmZpZy5wYXNzd29yZCA9IFwiXCI7XG4gICAgbGV0IGRhZW1vbkNvbm5lY3Rpb24gPSBjb25maWcuZ2V0U2VydmVyKCk7XG4gICAgYXdhaXQgTGlicmFyeVV0aWxzLmludm9rZVdvcmtlcih3YWxsZXRJZCwgXCJvcGVuV2FsbGV0RGF0YVwiLCBbY29uZmlnLnBhdGgsIGNvbmZpZy5wYXNzd29yZCwgY29uZmlnLm5ldHdvcmtUeXBlLCBjb25maWcua2V5c0RhdGEsIGNvbmZpZy5jYWNoZURhdGEsIGRhZW1vbkNvbm5lY3Rpb24gPyBkYWVtb25Db25uZWN0aW9uLnRvSnNvbigpIDogdW5kZWZpbmVkXSk7XG4gICAgbGV0IHdhbGxldCA9IG5ldyBNb25lcm9XYWxsZXRGdWxsUHJveHkod2FsbGV0SWQsIGF3YWl0IExpYnJhcnlVdGlscy5nZXRXb3JrZXIoKSwgY29uZmlnLnBhdGgsIGNvbmZpZy5nZXRGcygpKTtcbiAgICBpZiAoY29uZmlnLnBhdGgpIGF3YWl0IHdhbGxldC5zYXZlKCk7XG4gICAgcmV0dXJuIHdhbGxldDtcbiAgfVxuICBcbiAgc3RhdGljIGFzeW5jIGNyZWF0ZVdhbGxldChjb25maWcpIHtcbiAgICBpZiAoY29uZmlnLmdldFBhdGgoKSAmJiBNb25lcm9XYWxsZXRGdWxsLndhbGxldEV4aXN0cyhjb25maWcuZ2V0UGF0aCgpLCBjb25maWcuZ2V0RnMoKSkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBhbHJlYWR5IGV4aXN0czogXCIgKyBjb25maWcuZ2V0UGF0aCgpKTtcbiAgICBsZXQgd2FsbGV0SWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgYXdhaXQgTGlicmFyeVV0aWxzLmludm9rZVdvcmtlcih3YWxsZXRJZCwgXCJjcmVhdGVXYWxsZXRGdWxsXCIsIFtjb25maWcudG9Kc29uKCldKTtcbiAgICBsZXQgd2FsbGV0ID0gbmV3IE1vbmVyb1dhbGxldEZ1bGxQcm94eSh3YWxsZXRJZCwgYXdhaXQgTGlicmFyeVV0aWxzLmdldFdvcmtlcigpLCBjb25maWcuZ2V0UGF0aCgpLCBjb25maWcuZ2V0RnMoKSk7XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkpIGF3YWl0IHdhbGxldC5zYXZlKCk7XG4gICAgcmV0dXJuIHdhbGxldDtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIElOU1RBTkNFIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgLyoqXG4gICAqIEludGVybmFsIGNvbnN0cnVjdG9yIHdoaWNoIGlzIGdpdmVuIGEgd29ya2VyIHRvIGNvbW11bmljYXRlIHdpdGggdmlhIG1lc3NhZ2VzLlxuICAgKiBcbiAgICogVGhpcyBtZXRob2Qgc2hvdWxkIG5vdCBiZSBjYWxsZWQgZXh0ZXJuYWxseSBidXQgc2hvdWxkIGJlIGNhbGxlZCB0aHJvdWdoXG4gICAqIHN0YXRpYyB3YWxsZXQgY3JlYXRpb24gdXRpbGl0aWVzIGluIHRoaXMgY2xhc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gd2FsbGV0SWQgLSBpZGVudGlmaWVzIHRoZSB3YWxsZXQgd2l0aCB0aGUgd29ya2VyXG4gICAqIEBwYXJhbSB7V29ya2VyfSB3b3JrZXIgLSB3b3JrZXIgdG8gY29tbXVuaWNhdGUgd2l0aCB2aWEgbWVzc2FnZXNcbiAgICovXG4gIGNvbnN0cnVjdG9yKHdhbGxldElkLCB3b3JrZXIsIHBhdGgsIGZzKSB7XG4gICAgc3VwZXIod2FsbGV0SWQsIHdvcmtlcik7XG4gICAgdGhpcy5wYXRoID0gcGF0aDtcbiAgICB0aGlzLmZzID0gZnMgPyBmcyA6IChwYXRoID8gTW9uZXJvV2FsbGV0RnVsbC5nZXRGcygpIDogdW5kZWZpbmVkKTtcbiAgICB0aGlzLndyYXBwZWRMaXN0ZW5lcnMgPSBbXTtcbiAgfVxuXG4gIGdldFBhdGgoKSB7XG4gICAgcmV0dXJuIHRoaXMucGF0aDtcbiAgfVxuXG4gIGFzeW5jIGdldE5ldHdvcmtUeXBlKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldE5ldHdvcmtUeXBlXCIpO1xuICB9XG4gIFxuICBhc3luYyBzZXRTdWJhZGRyZXNzTGFiZWwoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCwgbGFiZWwpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzZXRTdWJhZGRyZXNzTGFiZWxcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSBhcyBQcm9taXNlPHZvaWQ+O1xuICB9XG4gIFxuICBhc3luYyBzZXREYWVtb25Db25uZWN0aW9uKHVyaU9yUnBjQ29ubmVjdGlvbikge1xuICAgIGlmICghdXJpT3JScGNDb25uZWN0aW9uKSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInNldERhZW1vbkNvbm5lY3Rpb25cIik7XG4gICAgZWxzZSB7XG4gICAgICBsZXQgY29ubmVjdGlvbiA9ICF1cmlPclJwY0Nvbm5lY3Rpb24gPyB1bmRlZmluZWQgOiB1cmlPclJwY0Nvbm5lY3Rpb24gaW5zdGFuY2VvZiBNb25lcm9ScGNDb25uZWN0aW9uID8gdXJpT3JScGNDb25uZWN0aW9uIDogbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24odXJpT3JScGNDb25uZWN0aW9uKTtcbiAgICAgIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwic2V0RGFlbW9uQ29ubmVjdGlvblwiLCBjb25uZWN0aW9uID8gY29ubmVjdGlvbi5nZXRDb25maWcoKSA6IHVuZGVmaW5lZCk7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXREYWVtb25Db25uZWN0aW9uKCkge1xuICAgIGxldCBycGNDb25maWcgPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldERhZW1vbkNvbm5lY3Rpb25cIik7XG4gICAgcmV0dXJuIHJwY0NvbmZpZyA/IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHJwY0NvbmZpZykgOiB1bmRlZmluZWQ7XG4gIH1cbiAgXG4gIGFzeW5jIGlzQ29ubmVjdGVkVG9EYWVtb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaXNDb25uZWN0ZWRUb0RhZW1vblwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UmVzdG9yZUhlaWdodCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRSZXN0b3JlSGVpZ2h0XCIpO1xuICB9XG4gIFxuICBhc3luYyBzZXRSZXN0b3JlSGVpZ2h0KHJlc3RvcmVIZWlnaHQpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzZXRSZXN0b3JlSGVpZ2h0XCIsIFtyZXN0b3JlSGVpZ2h0XSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldERhZW1vbkhlaWdodCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXREYWVtb25IZWlnaHRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldERhZW1vbk1heFBlZXJIZWlnaHQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0RGFlbW9uTWF4UGVlckhlaWdodFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0QnlEYXRlKHllYXIsIG1vbnRoLCBkYXkpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRIZWlnaHRCeURhdGVcIiwgW3llYXIsIG1vbnRoLCBkYXldKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNEYWVtb25TeW5jZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaXNEYWVtb25TeW5jZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhlaWdodCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRIZWlnaHRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGFkZExpc3RlbmVyKGxpc3RlbmVyKSB7XG4gICAgbGV0IHdyYXBwZWRMaXN0ZW5lciA9IG5ldyBXYWxsZXRXb3JrZXJMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgbGV0IGxpc3RlbmVySWQgPSB3cmFwcGVkTGlzdGVuZXIuZ2V0SWQoKTtcbiAgICBMaWJyYXJ5VXRpbHMuYWRkV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvblN5bmNQcm9ncmVzc19cIiArIGxpc3RlbmVySWQsIFt3cmFwcGVkTGlzdGVuZXIub25TeW5jUHJvZ3Jlc3MsIHdyYXBwZWRMaXN0ZW5lcl0pO1xuICAgIExpYnJhcnlVdGlscy5hZGRXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uTmV3QmxvY2tfXCIgKyBsaXN0ZW5lcklkLCBbd3JhcHBlZExpc3RlbmVyLm9uTmV3QmxvY2ssIHdyYXBwZWRMaXN0ZW5lcl0pO1xuICAgIExpYnJhcnlVdGlscy5hZGRXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uQmFsYW5jZXNDaGFuZ2VkX1wiICsgbGlzdGVuZXJJZCwgW3dyYXBwZWRMaXN0ZW5lci5vbkJhbGFuY2VzQ2hhbmdlZCwgd3JhcHBlZExpc3RlbmVyXSk7XG4gICAgTGlicmFyeVV0aWxzLmFkZFdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25PdXRwdXRSZWNlaXZlZF9cIiArIGxpc3RlbmVySWQsIFt3cmFwcGVkTGlzdGVuZXIub25PdXRwdXRSZWNlaXZlZCwgd3JhcHBlZExpc3RlbmVyXSk7XG4gICAgTGlicmFyeVV0aWxzLmFkZFdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25PdXRwdXRTcGVudF9cIiArIGxpc3RlbmVySWQsIFt3cmFwcGVkTGlzdGVuZXIub25PdXRwdXRTcGVudCwgd3JhcHBlZExpc3RlbmVyXSk7XG4gICAgdGhpcy53cmFwcGVkTGlzdGVuZXJzLnB1c2god3JhcHBlZExpc3RlbmVyKTtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJhZGRMaXN0ZW5lclwiLCBbbGlzdGVuZXJJZF0pO1xuICB9XG4gIFxuICBhc3luYyByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcikge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53cmFwcGVkTGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodGhpcy53cmFwcGVkTGlzdGVuZXJzW2ldLmdldExpc3RlbmVyKCkgPT09IGxpc3RlbmVyKSB7XG4gICAgICAgIGxldCBsaXN0ZW5lcklkID0gdGhpcy53cmFwcGVkTGlzdGVuZXJzW2ldLmdldElkKCk7XG4gICAgICAgIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwicmVtb3ZlTGlzdGVuZXJcIiwgW2xpc3RlbmVySWRdKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnJlbW92ZVdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25TeW5jUHJvZ3Jlc3NfXCIgKyBsaXN0ZW5lcklkKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnJlbW92ZVdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25OZXdCbG9ja19cIiArIGxpc3RlbmVySWQpO1xuICAgICAgICBMaWJyYXJ5VXRpbHMucmVtb3ZlV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvbkJhbGFuY2VzQ2hhbmdlZF9cIiArIGxpc3RlbmVySWQpO1xuICAgICAgICBMaWJyYXJ5VXRpbHMucmVtb3ZlV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvbk91dHB1dFJlY2VpdmVkX1wiICsgbGlzdGVuZXJJZCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5yZW1vdmVXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uT3V0cHV0U3BlbnRfXCIgKyBsaXN0ZW5lcklkKTtcbiAgICAgICAgdGhpcy53cmFwcGVkTGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJMaXN0ZW5lciBpcyBub3QgcmVnaXN0ZXJlZCB3aXRoIHdhbGxldFwiKTtcbiAgfVxuICBcbiAgZ2V0TGlzdGVuZXJzKCkge1xuICAgIGxldCBsaXN0ZW5lcnMgPSBbXTtcbiAgICBmb3IgKGxldCB3cmFwcGVkTGlzdGVuZXIgb2YgdGhpcy53cmFwcGVkTGlzdGVuZXJzKSBsaXN0ZW5lcnMucHVzaCh3cmFwcGVkTGlzdGVuZXIuZ2V0TGlzdGVuZXIoKSk7XG4gICAgcmV0dXJuIGxpc3RlbmVycztcbiAgfVxuICBcbiAgYXN5bmMgaXNTeW5jZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaXNTeW5jZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIHN5bmMobGlzdGVuZXJPclN0YXJ0SGVpZ2h0PzogTW9uZXJvV2FsbGV0TGlzdGVuZXIgfCBudW1iZXIsIHN0YXJ0SGVpZ2h0PzogbnVtYmVyLCBhbGxvd0NvbmN1cnJlbnRDYWxscyA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9TeW5jUmVzdWx0PiB7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIHBhcmFtc1xuICAgIHN0YXJ0SGVpZ2h0ID0gbGlzdGVuZXJPclN0YXJ0SGVpZ2h0IGluc3RhbmNlb2YgTW9uZXJvV2FsbGV0TGlzdGVuZXIgPyBzdGFydEhlaWdodCA6IGxpc3RlbmVyT3JTdGFydEhlaWdodDtcbiAgICBsZXQgbGlzdGVuZXIgPSBsaXN0ZW5lck9yU3RhcnRIZWlnaHQgaW5zdGFuY2VvZiBNb25lcm9XYWxsZXRMaXN0ZW5lciA/IGxpc3RlbmVyT3JTdGFydEhlaWdodCA6IHVuZGVmaW5lZDtcbiAgICBpZiAoc3RhcnRIZWlnaHQgPT09IHVuZGVmaW5lZCkgc3RhcnRIZWlnaHQgPSBNYXRoLm1heChhd2FpdCB0aGlzLmdldEhlaWdodCgpLCBhd2FpdCB0aGlzLmdldFJlc3RvcmVIZWlnaHQoKSk7XG4gICAgXG4gICAgLy8gcmVnaXN0ZXIgbGlzdGVuZXIgaWYgZ2l2ZW5cbiAgICBpZiAobGlzdGVuZXIpIGF3YWl0IHRoaXMuYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIFxuICAgIC8vIHN5bmMgd2FsbGV0IGluIHdvcmtlciBcbiAgICBsZXQgZXJyO1xuICAgIGxldCByZXN1bHQ7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXN1bHRKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJzeW5jXCIsIFtzdGFydEhlaWdodCwgYWxsb3dDb25jdXJyZW50Q2FsbHNdKTtcbiAgICAgIHJlc3VsdCA9IG5ldyBNb25lcm9TeW5jUmVzdWx0KHJlc3VsdEpzb24ubnVtQmxvY2tzRmV0Y2hlZCwgcmVzdWx0SnNvbi5yZWNlaXZlZE1vbmV5KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBlcnIgPSBlO1xuICAgIH1cbiAgICBcbiAgICAvLyB1bnJlZ2lzdGVyIGxpc3RlbmVyXG4gICAgaWYgKGxpc3RlbmVyKSBhd2FpdCB0aGlzLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBcbiAgICAvLyB0aHJvdyBlcnJvciBvciByZXR1cm5cbiAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBcbiAgYXN5bmMgc3RhcnRTeW5jaW5nKHN5bmNQZXJpb2RJbk1zKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic3RhcnRTeW5jaW5nXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgICBcbiAgYXN5bmMgc3RvcFN5bmNpbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic3RvcFN5bmNpbmdcIik7XG4gIH1cbiAgXG4gIGFzeW5jIHNjYW5UeHModHhIYXNoZXMpIHtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheSh0eEhhc2hlcyksIFwiTXVzdCBwcm92aWRlIGFuIGFycmF5IG9mIHR4cyBoYXNoZXMgdG8gc2NhblwiKTtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzY2FuVHhzXCIsIFt0eEhhc2hlc10pO1xuICB9XG4gIFxuICBhc3luYyByZXNjYW5TcGVudCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJyZXNjYW5TcGVudFwiKTtcbiAgfVxuICAgIFxuICBhc3luYyByZXNjYW5CbG9ja2NoYWluKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInJlc2NhbkJsb2NrY2hhaW5cIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJhbGFuY2UoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkge1xuICAgIHJldHVybiBCaWdJbnQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRCYWxhbmNlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBnZXRVbmxvY2tlZEJhbGFuY2UoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkge1xuICAgIGxldCB1bmxvY2tlZEJhbGFuY2VTdHIgPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldFVubG9ja2VkQmFsYW5jZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIHJldHVybiBCaWdJbnQodW5sb2NrZWRCYWxhbmNlU3RyKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudHMoaW5jbHVkZVN1YmFkZHJlc3NlcywgdGFnKSB7XG4gICAgbGV0IGFjY291bnRzID0gW107XG4gICAgZm9yIChsZXQgYWNjb3VudEpzb24gb2YgKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0QWNjb3VudHNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSkpIHtcbiAgICAgIGFjY291bnRzLnB1c2goTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZUFjY291bnQobmV3IE1vbmVyb0FjY291bnQoYWNjb3VudEpzb24pKSk7XG4gICAgfVxuICAgIHJldHVybiBhY2NvdW50cztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudChhY2NvdW50SWR4LCBpbmNsdWRlU3ViYWRkcmVzc2VzKSB7XG4gICAgbGV0IGFjY291bnRKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRBY2NvdW50XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuc2FuaXRpemVBY2NvdW50KG5ldyBNb25lcm9BY2NvdW50KGFjY291bnRKc29uKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNyZWF0ZUFjY291bnQobGFiZWwpIHtcbiAgICBsZXQgYWNjb3VudEpzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImNyZWF0ZUFjY291bnRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZUFjY291bnQobmV3IE1vbmVyb0FjY291bnQoYWNjb3VudEpzb24pKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJbmRpY2VzKSB7XG4gICAgbGV0IHN1YmFkZHJlc3NlcyA9IFtdO1xuICAgIGZvciAobGV0IHN1YmFkZHJlc3NKc29uIG9mIChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldFN1YmFkZHJlc3Nlc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKSkge1xuICAgICAgc3ViYWRkcmVzc2VzLnB1c2goTW9uZXJvV2FsbGV0S2V5cy5zYW5pdGl6ZVN1YmFkZHJlc3MobmV3IE1vbmVyb1N1YmFkZHJlc3Moc3ViYWRkcmVzc0pzb24pKSk7XG4gICAgfVxuICAgIHJldHVybiBzdWJhZGRyZXNzZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGNyZWF0ZVN1YmFkZHJlc3MoYWNjb3VudElkeCwgbGFiZWwpIHtcbiAgICBsZXQgc3ViYWRkcmVzc0pzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImNyZWF0ZVN1YmFkZHJlc3NcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0S2V5cy5zYW5pdGl6ZVN1YmFkZHJlc3MobmV3IE1vbmVyb1N1YmFkZHJlc3Moc3ViYWRkcmVzc0pzb24pKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhzKHF1ZXJ5KSB7XG4gICAgcXVlcnkgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplVHhRdWVyeShxdWVyeSk7XG4gICAgbGV0IHJlc3BKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRUeHNcIiwgW3F1ZXJ5LmdldEJsb2NrKCkudG9Kc29uKCldKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZVR4cyhxdWVyeSwgSlNPTi5zdHJpbmdpZnkoe2Jsb2NrczogcmVzcEpzb24uYmxvY2tzfSkpOyAvLyBpbml0aWFsaXplIHR4cyBmcm9tIGJsb2NrcyBqc29uIHN0cmluZyBUT0RPOiB0aGlzIHN0cmluZ2lmaWVzIHRoZW4gdXRpbGl0eSBwYXJzZXMsIGF2b2lkXG4gIH1cbiAgXG4gIGFzeW5jIGdldFRyYW5zZmVycyhxdWVyeSkge1xuICAgIHF1ZXJ5ID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVRyYW5zZmVyUXVlcnkocXVlcnkpO1xuICAgIGxldCBibG9ja0pzb25zID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRUcmFuc2ZlcnNcIiwgW3F1ZXJ5LmdldFR4UXVlcnkoKS5nZXRCbG9jaygpLnRvSnNvbigpXSk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuZGVzZXJpYWxpemVUcmFuc2ZlcnMocXVlcnksIEpTT04uc3RyaW5naWZ5KHtibG9ja3M6IGJsb2NrSnNvbnN9KSk7IC8vIGluaXRpYWxpemUgdHJhbnNmZXJzIGZyb20gYmxvY2tzIGpzb24gc3RyaW5nIFRPRE86IHRoaXMgc3RyaW5naWZpZXMgdGhlbiB1dGlsaXR5IHBhcnNlcywgYXZvaWRcbiAgfVxuICBcbiAgYXN5bmMgZ2V0T3V0cHV0cyhxdWVyeSkge1xuICAgIHF1ZXJ5ID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZU91dHB1dFF1ZXJ5KHF1ZXJ5KTtcbiAgICBsZXQgYmxvY2tKc29ucyA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0T3V0cHV0c1wiLCBbcXVlcnkuZ2V0VHhRdWVyeSgpLmdldEJsb2NrKCkudG9Kc29uKCldKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZU91dHB1dHMocXVlcnksIEpTT04uc3RyaW5naWZ5KHtibG9ja3M6IGJsb2NrSnNvbnN9KSk7IC8vIGluaXRpYWxpemUgdHJhbnNmZXJzIGZyb20gYmxvY2tzIGpzb24gc3RyaW5nIFRPRE86IHRoaXMgc3RyaW5naWZpZXMgdGhlbiB1dGlsaXR5IHBhcnNlcywgYXZvaWRcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0T3V0cHV0cyhhbGwpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJleHBvcnRPdXRwdXRzXCIsIFthbGxdKTtcbiAgfVxuICBcbiAgYXN5bmMgaW1wb3J0T3V0cHV0cyhvdXRwdXRzSGV4KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaW1wb3J0T3V0cHV0c1wiLCBbb3V0cHV0c0hleF0pO1xuICB9XG4gIFxuICBhc3luYyBleHBvcnRLZXlJbWFnZXMoYWxsKSB7XG4gICAgbGV0IGtleUltYWdlcyA9IFtdO1xuICAgIGZvciAobGV0IGtleUltYWdlSnNvbiBvZiBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldEtleUltYWdlc1wiLCBbYWxsXSkpIGtleUltYWdlcy5wdXNoKG5ldyBNb25lcm9LZXlJbWFnZShrZXlJbWFnZUpzb24pKTtcbiAgICByZXR1cm4ga2V5SW1hZ2VzO1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRLZXlJbWFnZXMoa2V5SW1hZ2VzKSB7XG4gICAgbGV0IGtleUltYWdlc0pzb24gPSBbXTtcbiAgICBmb3IgKGxldCBrZXlJbWFnZSBvZiBrZXlJbWFnZXMpIGtleUltYWdlc0pzb24ucHVzaChrZXlJbWFnZS50b0pzb24oKSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImltcG9ydEtleUltYWdlc1wiLCBba2V5SW1hZ2VzSnNvbl0pKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQoKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTW9uZXJvV2FsbGV0RnVsbC5nZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCgpIG5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZnJlZXplT3V0cHV0KGtleUltYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZnJlZXplT3V0cHV0XCIsIFtrZXlJbWFnZV0pO1xuICB9XG4gIFxuICBhc3luYyB0aGF3T3V0cHV0KGtleUltYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwidGhhd091dHB1dFwiLCBba2V5SW1hZ2VdKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNPdXRwdXRGcm96ZW4oa2V5SW1hZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJpc091dHB1dEZyb3plblwiLCBba2V5SW1hZ2VdKTtcbiAgfVxuICBcbiAgYXN5bmMgY3JlYXRlVHhzKGNvbmZpZykge1xuICAgIGNvbmZpZyA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVDcmVhdGVUeHNDb25maWcoY29uZmlnKTtcbiAgICBsZXQgdHhTZXRKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJjcmVhdGVUeHNcIiwgW2NvbmZpZy50b0pzb24oKV0pO1xuICAgIHJldHVybiBuZXcgTW9uZXJvVHhTZXQodHhTZXRKc29uKS5nZXRUeHMoKTtcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBPdXRwdXQoY29uZmlnKSB7XG4gICAgY29uZmlnID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVN3ZWVwT3V0cHV0Q29uZmlnKGNvbmZpZyk7XG4gICAgbGV0IHR4U2V0SnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwic3dlZXBPdXRwdXRcIiwgW2NvbmZpZy50b0pzb24oKV0pO1xuICAgIHJldHVybiBuZXcgTW9uZXJvVHhTZXQodHhTZXRKc29uKS5nZXRUeHMoKVswXTtcbiAgfVxuXG4gIGFzeW5jIHN3ZWVwVW5sb2NrZWQoY29uZmlnKSB7XG4gICAgY29uZmlnID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVN3ZWVwVW5sb2NrZWRDb25maWcoY29uZmlnKTtcbiAgICBsZXQgdHhTZXRzSnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwic3dlZXBVbmxvY2tlZFwiLCBbY29uZmlnLnRvSnNvbigpXSk7XG4gICAgbGV0IHR4cyA9IFtdO1xuICAgIGZvciAobGV0IHR4U2V0SnNvbiBvZiB0eFNldHNKc29uKSBmb3IgKGxldCB0eCBvZiBuZXcgTW9uZXJvVHhTZXQodHhTZXRKc29uKS5nZXRUeHMoKSkgdHhzLnB1c2godHgpO1xuICAgIHJldHVybiB0eHM7XG4gIH1cbiAgXG4gIGFzeW5jIHN3ZWVwRHVzdChyZWxheSkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvVHhTZXQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJzd2VlcER1c3RcIiwgW3JlbGF5XSkpLmdldFR4cygpIHx8IFtdO1xuICB9XG4gIFxuICBhc3luYyByZWxheVR4cyh0eHNPck1ldGFkYXRhcykge1xuICAgIGFzc2VydChBcnJheS5pc0FycmF5KHR4c09yTWV0YWRhdGFzKSwgXCJNdXN0IHByb3ZpZGUgYW4gYXJyYXkgb2YgdHhzIG9yIHRoZWlyIG1ldGFkYXRhIHRvIHJlbGF5XCIpO1xuICAgIGxldCB0eE1ldGFkYXRhcyA9IFtdO1xuICAgIGZvciAobGV0IHR4T3JNZXRhZGF0YSBvZiB0eHNPck1ldGFkYXRhcykgdHhNZXRhZGF0YXMucHVzaCh0eE9yTWV0YWRhdGEgaW5zdGFuY2VvZiBNb25lcm9UeFdhbGxldCA/IHR4T3JNZXRhZGF0YS5nZXRNZXRhZGF0YSgpIDogdHhPck1ldGFkYXRhKTtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJyZWxheVR4c1wiLCBbdHhNZXRhZGF0YXNdKTtcbiAgfVxuICBcbiAgYXN5bmMgZGVzY3JpYmVUeFNldCh0eFNldCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvVHhTZXQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkZXNjcmliZVR4U2V0XCIsIFt0eFNldC50b0pzb24oKV0pKTtcbiAgfVxuICBcbiAgYXN5bmMgc2lnblR4cyh1bnNpZ25lZFR4SGV4KSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9UeFNldChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInNpZ25UeHNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdFR4cyhzaWduZWRUeEhleCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInN1Ym1pdFR4c1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBzaWduTWVzc2FnZShtZXNzYWdlLCBzaWduYXR1cmVUeXBlLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic2lnbk1lc3NhZ2VcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgdmVyaWZ5TWVzc2FnZShtZXNzYWdlLCBhZGRyZXNzLCBzaWduYXR1cmUpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJ2ZXJpZnlNZXNzYWdlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeEtleSh0eEhhc2gpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRUeEtleVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBjaGVja1R4S2V5KHR4SGFzaCwgdHhLZXksIGFkZHJlc3MpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0NoZWNrVHgoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJjaGVja1R4S2V5XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFByb29mKHR4SGFzaCwgYWRkcmVzcywgbWVzc2FnZSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldFR4UHJvb2ZcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tUeFByb29mKHR4SGFzaCwgYWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9DaGVja1R4KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiY2hlY2tUeFByb29mXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBnZXRTcGVuZFByb29mKHR4SGFzaCwgbWVzc2FnZSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldFNwZW5kUHJvb2ZcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tTcGVuZFByb29mKHR4SGFzaCwgbWVzc2FnZSwgc2lnbmF0dXJlKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiY2hlY2tTcGVuZFByb29mXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFJlc2VydmVQcm9vZldhbGxldChtZXNzYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0UmVzZXJ2ZVByb29mV2FsbGV0XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFJlc2VydmVQcm9vZkFjY291bnQoYWNjb3VudElkeCwgYW1vdW50LCBtZXNzYWdlKSB7XG4gICAgdHJ5IHsgcmV0dXJuIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0UmVzZXJ2ZVByb29mQWNjb3VudFwiLCBbYWNjb3VudElkeCwgYW1vdW50LnRvU3RyaW5nKCksIG1lc3NhZ2VdKTsgfVxuICAgIGNhdGNoIChlOiBhbnkpIHsgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGUubWVzc2FnZSwgLTEpOyB9XG4gIH1cblxuICBhc3luYyBjaGVja1Jlc2VydmVQcm9vZihhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUpIHtcbiAgICB0cnkgeyByZXR1cm4gbmV3IE1vbmVyb0NoZWNrUmVzZXJ2ZShhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImNoZWNrUmVzZXJ2ZVByb29mXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpOyB9XG4gICAgY2F0Y2ggKGU6IGFueSkgeyB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZS5tZXNzYWdlLCAtMSk7IH1cbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhOb3Rlcyh0eEhhc2hlcykge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldFR4Tm90ZXNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0VHhOb3Rlcyh0eEhhc2hlcywgbm90ZXMpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzZXRUeE5vdGVzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFkZHJlc3NCb29rRW50cmllcyhlbnRyeUluZGljZXMpIHtcbiAgICBpZiAoIWVudHJ5SW5kaWNlcykgZW50cnlJbmRpY2VzID0gW107XG4gICAgbGV0IGVudHJpZXMgPSBbXTtcbiAgICBmb3IgKGxldCBlbnRyeUpzb24gb2YgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRBZGRyZXNzQm9va0VudHJpZXNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSkge1xuICAgICAgZW50cmllcy5wdXNoKG5ldyBNb25lcm9BZGRyZXNzQm9va0VudHJ5KGVudHJ5SnNvbikpO1xuICAgIH1cbiAgICByZXR1cm4gZW50cmllcztcbiAgfVxuICBcbiAgYXN5bmMgYWRkQWRkcmVzc0Jvb2tFbnRyeShhZGRyZXNzLCBkZXNjcmlwdGlvbikge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImFkZEFkZHJlc3NCb29rRW50cnlcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZWRpdEFkZHJlc3NCb29rRW50cnkoaW5kZXgsIHNldEFkZHJlc3MsIGFkZHJlc3MsIHNldERlc2NyaXB0aW9uLCBkZXNjcmlwdGlvbikge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImVkaXRBZGRyZXNzQm9va0VudHJ5XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGRlbGV0ZUFkZHJlc3NCb29rRW50cnkoZW50cnlJZHgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkZWxldGVBZGRyZXNzQm9va0VudHJ5XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHRhZ0FjY291bnRzKHRhZywgYWNjb3VudEluZGljZXMpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJ0YWdBY2NvdW50c1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG5cbiAgYXN5bmMgdW50YWdBY2NvdW50cyhhY2NvdW50SW5kaWNlcykge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInVudGFnQWNjb3VudHNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudFRhZ3MoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0QWNjb3VudFRhZ3NcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuXG4gIGFzeW5jIHNldEFjY291bnRUYWdMYWJlbCh0YWcsIGxhYmVsKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic2V0QWNjb3VudFRhZ0xhYmVsXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBheW1lbnRVcmkoY29uZmlnKSB7XG4gICAgY29uZmlnID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyhjb25maWcpO1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldFBheW1lbnRVcmlcIiwgW2NvbmZpZy50b0pzb24oKV0pO1xuICB9XG4gIFxuICBhc3luYyBwYXJzZVBheW1lbnRVcmkodXJpKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9UeENvbmZpZyhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInBhcnNlUGF5bWVudFVyaVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QXR0cmlidXRlKGtleSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldEF0dHJpYnV0ZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBzZXRBdHRyaWJ1dGUoa2V5LCB2YWwpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzZXRBdHRyaWJ1dGVcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgc3RhcnRNaW5pbmcobnVtVGhyZWFkcywgYmFja2dyb3VuZE1pbmluZywgaWdub3JlQmF0dGVyeSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInN0YXJ0TWluaW5nXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0b3BNaW5pbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic3RvcE1pbmluZ1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBpc011bHRpc2lnSW1wb3J0TmVlZGVkKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImlzTXVsdGlzaWdJbXBvcnROZWVkZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGlzTXVsdGlzaWcoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaXNNdWx0aXNpZ1wiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TXVsdGlzaWdJbmZvKCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvTXVsdGlzaWdJbmZvKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0TXVsdGlzaWdJbmZvXCIpKTtcbiAgfVxuICBcbiAgYXN5bmMgcHJlcGFyZU11bHRpc2lnKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInByZXBhcmVNdWx0aXNpZ1wiKTtcbiAgfVxuICBcbiAgYXN5bmMgbWFrZU11bHRpc2lnKG11bHRpc2lnSGV4ZXMsIHRocmVzaG9sZCwgcGFzc3dvcmQpIHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJtYWtlTXVsdGlzaWdcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZXhjaGFuZ2VNdWx0aXNpZ0tleXMobXVsdGlzaWdIZXhlcywgcGFzc3dvcmQpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImV4Y2hhbmdlTXVsdGlzaWdLZXlzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBleHBvcnRNdWx0aXNpZ0hleCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJleHBvcnRNdWx0aXNpZ0hleFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgaW1wb3J0TXVsdGlzaWdIZXgobXVsdGlzaWdIZXhlcykge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImltcG9ydE11bHRpc2lnSGV4XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNpZ25NdWx0aXNpZ1R4SGV4KG11bHRpc2lnVHhIZXgpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb011bHRpc2lnU2lnblJlc3VsdChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInNpZ25NdWx0aXNpZ1R4SGV4XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBzdWJtaXRNdWx0aXNpZ1R4SGV4KHNpZ25lZE11bHRpc2lnVHhIZXgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzdWJtaXRNdWx0aXNpZ1R4SGV4XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldERhdGEoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0RGF0YVwiKTtcbiAgfVxuICBcbiAgYXN5bmMgbW92ZVRvKHBhdGgpIHtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5tb3ZlVG8ocGF0aCwgdGhpcyk7XG4gIH1cbiAgXG4gIGFzeW5jIGNoYW5nZVBhc3N3b3JkKG9sZFBhc3N3b3JkLCBuZXdQYXNzd29yZCkge1xuICAgIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiY2hhbmdlUGFzc3dvcmRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgICBpZiAodGhpcy5wYXRoKSBhd2FpdCB0aGlzLnNhdmUoKTsgLy8gYXV0byBzYXZlXG4gIH1cbiAgXG4gIGFzeW5jIHNhdmUoKSB7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuc2F2ZSh0aGlzKTtcbiAgfVxuXG4gIGFzeW5jIGNsb3NlKHNhdmUpIHtcbiAgICBpZiAoc2F2ZSkgYXdhaXQgdGhpcy5zYXZlKCk7XG4gICAgd2hpbGUgKHRoaXMud3JhcHBlZExpc3RlbmVycy5sZW5ndGgpIGF3YWl0IHRoaXMucmVtb3ZlTGlzdGVuZXIodGhpcy53cmFwcGVkTGlzdGVuZXJzWzBdLmdldExpc3RlbmVyKCkpO1xuICAgIGF3YWl0IHN1cGVyLmNsb3NlKGZhbHNlKTtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBMSVNURU5JTkcgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8qKlxuICogUmVjZWl2ZXMgbm90aWZpY2F0aW9ucyBkaXJlY3RseSBmcm9tIHdhc20gYysrLlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBXYWxsZXRGdWxsTGlzdGVuZXIge1xuXG4gIHByb3RlY3RlZCB3YWxsZXQ6IGFueTtcbiAgXG4gIGNvbnN0cnVjdG9yKHdhbGxldCkge1xuICAgIHRoaXMud2FsbGV0ID0gd2FsbGV0O1xuICB9XG4gIFxuICBhc3luYyBvblN5bmNQcm9ncmVzcyhoZWlnaHQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIHBlcmNlbnREb25lLCBtZXNzYWdlKSB7XG4gICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgdGhpcy53YWxsZXQuZ2V0TGlzdGVuZXJzKCkpIGF3YWl0IGxpc3RlbmVyLm9uU3luY1Byb2dyZXNzKGhlaWdodCwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgcGVyY2VudERvbmUsIG1lc3NhZ2UpO1xuICB9XG4gIFxuICBhc3luYyBvbk5ld0Jsb2NrKGhlaWdodCkge1xuICAgIGZvciAobGV0IGxpc3RlbmVyIG9mIHRoaXMud2FsbGV0LmdldExpc3RlbmVycygpKSBhd2FpdCBsaXN0ZW5lci5vbk5ld0Jsb2NrKGhlaWdodCk7XG4gIH1cbiAgXG4gIGFzeW5jIG9uQmFsYW5jZXNDaGFuZ2VkKG5ld0JhbGFuY2VTdHIsIG5ld1VubG9ja2VkQmFsYW5jZVN0cikge1xuICAgIGZvciAobGV0IGxpc3RlbmVyIG9mIHRoaXMud2FsbGV0LmdldExpc3RlbmVycygpKSBhd2FpdCBsaXN0ZW5lci5vbkJhbGFuY2VzQ2hhbmdlZChCaWdJbnQobmV3QmFsYW5jZVN0ciksIEJpZ0ludChuZXdVbmxvY2tlZEJhbGFuY2VTdHIpKTtcbiAgfVxuICBcbiAgYXN5bmMgb25PdXRwdXRSZWNlaXZlZChoZWlnaHQsIHR4SGFzaCwgYW1vdW50U3RyLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4LCB2ZXJzaW9uLCB1bmxvY2tUaW1lLCBpc0xvY2tlZCkge1xuICAgIFxuICAgIC8vIGJ1aWxkIHJlY2VpdmVkIG91dHB1dFxuICAgIGxldCBvdXRwdXQgPSBuZXcgTW9uZXJvT3V0cHV0V2FsbGV0KCk7XG4gICAgb3V0cHV0LnNldEFtb3VudChCaWdJbnQoYW1vdW50U3RyKSk7XG4gICAgb3V0cHV0LnNldEFjY291bnRJbmRleChhY2NvdW50SWR4KTtcbiAgICBvdXRwdXQuc2V0U3ViYWRkcmVzc0luZGV4KHN1YmFkZHJlc3NJZHgpO1xuICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgIHR4LnNldEhhc2godHhIYXNoKTtcbiAgICB0eC5zZXRWZXJzaW9uKHZlcnNpb24pO1xuICAgIHR4LnNldFVubG9ja1RpbWUodW5sb2NrVGltZSk7XG4gICAgb3V0cHV0LnNldFR4KHR4KTtcbiAgICB0eC5zZXRPdXRwdXRzKFtvdXRwdXRdKTtcbiAgICB0eC5zZXRJc0luY29taW5nKHRydWUpO1xuICAgIHR4LnNldElzTG9ja2VkKGlzTG9ja2VkKTtcbiAgICBpZiAoaGVpZ2h0ID4gMCkge1xuICAgICAgbGV0IGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0SGVpZ2h0KGhlaWdodCk7XG4gICAgICBibG9jay5zZXRUeHMoW3R4IGFzIE1vbmVyb1R4XSk7XG4gICAgICB0eC5zZXRCbG9jayhibG9jayk7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SW5UeFBvb2wodHJ1ZSk7XG4gICAgfVxuICAgIFxuICAgIC8vIGFubm91bmNlIG91dHB1dFxuICAgIGZvciAobGV0IGxpc3RlbmVyIG9mIHRoaXMud2FsbGV0LmdldExpc3RlbmVycygpKSBhd2FpdCBsaXN0ZW5lci5vbk91dHB1dFJlY2VpdmVkKHR4LmdldE91dHB1dHMoKVswXSk7XG4gIH1cbiAgXG4gIGFzeW5jIG9uT3V0cHV0U3BlbnQoaGVpZ2h0LCB0eEhhc2gsIGFtb3VudFN0ciwgYWNjb3VudElkeFN0ciwgc3ViYWRkcmVzc0lkeFN0ciwgdmVyc2lvbiwgdW5sb2NrVGltZSwgaXNMb2NrZWQpIHtcbiAgICBcbiAgICAvLyBidWlsZCBzcGVudCBvdXRwdXRcbiAgICBsZXQgb3V0cHV0ID0gbmV3IE1vbmVyb091dHB1dFdhbGxldCgpO1xuICAgIG91dHB1dC5zZXRBbW91bnQoQmlnSW50KGFtb3VudFN0cikpO1xuICAgIGlmIChhY2NvdW50SWR4U3RyKSBvdXRwdXQuc2V0QWNjb3VudEluZGV4KHBhcnNlSW50KGFjY291bnRJZHhTdHIpKTtcbiAgICBpZiAoc3ViYWRkcmVzc0lkeFN0cikgb3V0cHV0LnNldFN1YmFkZHJlc3NJbmRleChwYXJzZUludChzdWJhZGRyZXNzSWR4U3RyKSk7XG4gICAgbGV0IHR4ID0gbmV3IE1vbmVyb1R4V2FsbGV0KCk7XG4gICAgdHguc2V0SGFzaCh0eEhhc2gpO1xuICAgIHR4LnNldFZlcnNpb24odmVyc2lvbik7XG4gICAgdHguc2V0VW5sb2NrVGltZSh1bmxvY2tUaW1lKTtcbiAgICB0eC5zZXRJc0xvY2tlZChpc0xvY2tlZCk7XG4gICAgb3V0cHV0LnNldFR4KHR4KTtcbiAgICB0eC5zZXRJbnB1dHMoW291dHB1dF0pO1xuICAgIGlmIChoZWlnaHQgPiAwKSB7XG4gICAgICBsZXQgYmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soKS5zZXRIZWlnaHQoaGVpZ2h0KTtcbiAgICAgIGJsb2NrLnNldFR4cyhbdHhdKTtcbiAgICAgIHR4LnNldEJsb2NrKGJsb2NrKTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbCh0cnVlKTtcbiAgICB9XG4gICAgXG4gICAgLy8gbm90aWZ5IHdhbGxldCBsaXN0ZW5lcnNcbiAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiB0aGlzLndhbGxldC5nZXRMaXN0ZW5lcnMoKSkgYXdhaXQgbGlzdGVuZXIub25PdXRwdXRTcGVudCh0eC5nZXRJbnB1dHMoKVswXSk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnRlcm5hbCBsaXN0ZW5lciB0byBicmlkZ2Ugbm90aWZpY2F0aW9ucyB0byBleHRlcm5hbCBsaXN0ZW5lcnMuXG4gKiBcbiAqIEBwcml2YXRlXG4gKi9cbmNsYXNzIFdhbGxldFdvcmtlckxpc3RlbmVyIHtcblxuICBwcm90ZWN0ZWQgaWQ6IGFueTtcbiAgcHJvdGVjdGVkIGxpc3RlbmVyOiBhbnk7XG4gIFxuICBjb25zdHJ1Y3RvcihsaXN0ZW5lcikge1xuICAgIHRoaXMuaWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgdGhpcy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB9XG4gIFxuICBnZXRJZCgpIHtcbiAgICByZXR1cm4gdGhpcy5pZDtcbiAgfVxuICBcbiAgZ2V0TGlzdGVuZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMubGlzdGVuZXI7XG4gIH1cbiAgXG4gIG9uU3luY1Byb2dyZXNzKGhlaWdodCwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgcGVyY2VudERvbmUsIG1lc3NhZ2UpIHtcbiAgICB0aGlzLmxpc3RlbmVyLm9uU3luY1Byb2dyZXNzKGhlaWdodCwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgcGVyY2VudERvbmUsIG1lc3NhZ2UpO1xuICB9XG5cbiAgYXN5bmMgb25OZXdCbG9jayhoZWlnaHQpIHtcbiAgICBhd2FpdCB0aGlzLmxpc3RlbmVyLm9uTmV3QmxvY2soaGVpZ2h0KTtcbiAgfVxuICBcbiAgYXN5bmMgb25CYWxhbmNlc0NoYW5nZWQobmV3QmFsYW5jZVN0ciwgbmV3VW5sb2NrZWRCYWxhbmNlU3RyKSB7XG4gICAgYXdhaXQgdGhpcy5saXN0ZW5lci5vbkJhbGFuY2VzQ2hhbmdlZChCaWdJbnQobmV3QmFsYW5jZVN0ciksIEJpZ0ludChuZXdVbmxvY2tlZEJhbGFuY2VTdHIpKTtcbiAgfVxuXG4gIGFzeW5jIG9uT3V0cHV0UmVjZWl2ZWQoYmxvY2tKc29uKSB7XG4gICAgbGV0IGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWF9XQUxMRVQpO1xuICAgIGF3YWl0IHRoaXMubGlzdGVuZXIub25PdXRwdXRSZWNlaXZlZChibG9jay5nZXRUeHMoKVswXS5nZXRPdXRwdXRzKClbMF0pO1xuICB9XG4gIFxuICBhc3luYyBvbk91dHB1dFNwZW50KGJsb2NrSnNvbikge1xuICAgIGxldCBibG9jayA9IG5ldyBNb25lcm9CbG9jayhibG9ja0pzb24sIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFhfV0FMTEVUKTtcbiAgICBhd2FpdCB0aGlzLmxpc3RlbmVyLm9uT3V0cHV0U3BlbnQoYmxvY2suZ2V0VHhzKClbMF0uZ2V0SW5wdXRzKClbMF0pO1xuICB9XG59XG4iXSwibWFwcGluZ3MiOiJ5TEFBQSxJQUFBQSxPQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxLQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxTQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRyxhQUFBLEdBQUFKLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSSxXQUFBLEdBQUFMLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSyxjQUFBLEdBQUFOLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTSxpQkFBQSxHQUFBUCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQU8sdUJBQUEsR0FBQVIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFRLFlBQUEsR0FBQVQsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFTLGNBQUEsR0FBQVYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFVLG1CQUFBLEdBQUFYLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBVyxnQkFBQSxHQUFBWixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVksWUFBQSxHQUFBYixzQkFBQSxDQUFBQyxPQUFBOztBQUVBLElBQUFhLHdCQUFBLEdBQUFkLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBYyxlQUFBLEdBQUFmLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBZSwyQkFBQSxHQUFBaEIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFnQixtQkFBQSxHQUFBakIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFpQix5QkFBQSxHQUFBbEIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFrQix5QkFBQSxHQUFBbkIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFtQixrQkFBQSxHQUFBcEIsc0JBQUEsQ0FBQUMsT0FBQTs7QUFFQSxJQUFBb0IsbUJBQUEsR0FBQXJCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBcUIsb0JBQUEsR0FBQXRCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBc0IsaUJBQUEsR0FBQXZCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBdUIsaUJBQUEsR0FBQXhCLHNCQUFBLENBQUFDLE9BQUE7OztBQUdBLElBQUF3QixlQUFBLEdBQUF6QixzQkFBQSxDQUFBQyxPQUFBOztBQUVBLElBQUF5QixZQUFBLEdBQUExQixzQkFBQSxDQUFBQyxPQUFBOztBQUVBLElBQUEwQixlQUFBLEdBQUEzQixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQTJCLGFBQUEsR0FBQTVCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBNEIsbUJBQUEsR0FBQTdCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBNkIsaUJBQUEsR0FBQTdCLE9BQUE7QUFDQSxJQUFBOEIscUJBQUEsR0FBQS9CLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBK0IsMkJBQUEsR0FBQWhDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBZ0MsNkJBQUEsR0FBQWpDLHNCQUFBLENBQUFDLE9BQUE7O0FBRUEsSUFBQWlDLEdBQUEsR0FBQWxDLHNCQUFBLENBQUFDLE9BQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ2UsTUFBTWtDLGdCQUFnQixTQUFTQyxrQ0FBZ0IsQ0FBQzs7RUFFN0Q7RUFDQSxPQUEwQkMseUJBQXlCLEdBQUcsS0FBSzs7O0VBRzNEOzs7Ozs7Ozs7Ozs7O0VBYUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0VDLFdBQVdBLENBQUNDLFVBQVUsRUFBRUMsSUFBSSxFQUFFQyxRQUFRLEVBQUVDLEVBQUUsRUFBRUMsa0JBQWtCLEVBQUVDLHNCQUFzQixFQUFFQyxXQUFtQyxFQUFFO0lBQzNILEtBQUssQ0FBQ04sVUFBVSxFQUFFTSxXQUFXLENBQUM7SUFDOUIsSUFBSUEsV0FBVyxFQUFFO0lBQ2pCLElBQUksQ0FBQ0wsSUFBSSxHQUFHQSxJQUFJO0lBQ2hCLElBQUksQ0FBQ0MsUUFBUSxHQUFHQSxRQUFRO0lBQ3hCLElBQUksQ0FBQ0ssU0FBUyxHQUFHLEVBQUU7SUFDbkIsSUFBSSxDQUFDSixFQUFFLEdBQUdBLEVBQUUsR0FBR0EsRUFBRSxHQUFJRixJQUFJLEdBQUdMLGdCQUFnQixDQUFDWSxLQUFLLENBQUMsQ0FBQyxHQUFHQyxTQUFVO0lBQ2pFLElBQUksQ0FBQ0MsU0FBUyxHQUFHLEtBQUs7SUFDdEIsSUFBSSxDQUFDQyxZQUFZLEdBQUcsSUFBSUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNsRCxJQUFJLENBQUNDLGtCQUFrQixHQUFHLENBQUMsQ0FBQyxDQUFzQjtJQUNsRCxJQUFJLENBQUNULGtCQUFrQixHQUFHQSxrQkFBa0I7SUFDNUMsSUFBSSxDQUFDVSwwQkFBMEIsR0FBR1Qsc0JBQXNCO0lBQ3hELElBQUksQ0FBQ1UsY0FBYyxHQUFHbkIsZ0JBQWdCLENBQUNFLHlCQUF5QjtJQUNoRWtCLHFCQUFZLENBQUNDLHVCQUF1QixDQUFDWixzQkFBc0IsRUFBRSxNQUFNLElBQUksQ0FBQ0Qsa0JBQWtCLENBQUMsQ0FBQyxDQUFDO0VBQy9GOztFQUVBOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsT0FBT2MsWUFBWUEsQ0FBQ2pCLElBQUksRUFBRUUsRUFBRSxFQUFFO0lBQzVCLElBQUFnQixlQUFNLEVBQUNsQixJQUFJLEVBQUUsMENBQTBDLENBQUM7SUFDeEQsSUFBSSxDQUFDRSxFQUFFLEVBQUVBLEVBQUUsR0FBR1AsZ0JBQWdCLENBQUNZLEtBQUssQ0FBQyxDQUFDO0lBQ3RDLElBQUksQ0FBQ0wsRUFBRSxFQUFFLE1BQU0sSUFBSWlCLG9CQUFXLENBQUMsb0RBQW9ELENBQUM7SUFDcEYsSUFBSUMsTUFBTSxHQUFHbEIsRUFBRSxDQUFDbUIsVUFBVSxDQUFDckIsSUFBSSxHQUFHLE9BQU8sQ0FBQztJQUMxQ2UscUJBQVksQ0FBQ08sR0FBRyxDQUFDLENBQUMsRUFBRSxtQkFBbUIsR0FBR3RCLElBQUksR0FBRyxJQUFJLEdBQUdvQixNQUFNLENBQUM7SUFDL0QsT0FBT0EsTUFBTTtFQUNmOztFQUVBLGFBQWFHLFVBQVVBLENBQUNDLE1BQW1DLEVBQUU7O0lBRTNEO0lBQ0FBLE1BQU0sR0FBRyxJQUFJQywyQkFBa0IsQ0FBQ0QsTUFBTSxDQUFDO0lBQ3ZDLElBQUlBLE1BQU0sQ0FBQ0UsZ0JBQWdCLENBQUMsQ0FBQyxLQUFLbEIsU0FBUyxFQUFFZ0IsTUFBTSxDQUFDRyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUM7SUFDMUUsSUFBSUgsTUFBTSxDQUFDSSxPQUFPLENBQUMsQ0FBQyxLQUFLcEIsU0FBUyxFQUFFLE1BQU0sSUFBSVcsb0JBQVcsQ0FBQyx5Q0FBeUMsQ0FBQztJQUNwRyxJQUFJSyxNQUFNLENBQUNLLGFBQWEsQ0FBQyxDQUFDLEtBQUtyQixTQUFTLEVBQUUsTUFBTSxJQUFJVyxvQkFBVyxDQUFDLGdEQUFnRCxDQUFDO0lBQ2pILElBQUlLLE1BQU0sQ0FBQ00saUJBQWlCLENBQUMsQ0FBQyxLQUFLdEIsU0FBUyxFQUFFLE1BQU0sSUFBSVcsb0JBQVcsQ0FBQyxvREFBb0QsQ0FBQztJQUN6SCxJQUFJSyxNQUFNLENBQUNPLGlCQUFpQixDQUFDLENBQUMsS0FBS3ZCLFNBQVMsRUFBRSxNQUFNLElBQUlXLG9CQUFXLENBQUMscURBQXFELENBQUM7SUFDMUgsSUFBSUssTUFBTSxDQUFDUSxrQkFBa0IsQ0FBQyxDQUFDLEtBQUt4QixTQUFTLEVBQUUsTUFBTSxJQUFJVyxvQkFBVyxDQUFDLHNEQUFzRCxDQUFDO0lBQzVILElBQUlLLE1BQU0sQ0FBQ1MsZ0JBQWdCLENBQUMsQ0FBQyxLQUFLekIsU0FBUyxFQUFFLE1BQU0sSUFBSVcsb0JBQVcsQ0FBQyxtREFBbUQsQ0FBQztJQUN2SCxJQUFJSyxNQUFNLENBQUNVLFdBQVcsQ0FBQyxDQUFDLEtBQUsxQixTQUFTLEVBQUUsTUFBTSxJQUFJVyxvQkFBVyxDQUFDLDZDQUE2QyxDQUFDO0lBQzVHLElBQUlLLE1BQU0sQ0FBQ1csY0FBYyxDQUFDLENBQUMsS0FBSyxJQUFJLEVBQUUsTUFBTSxJQUFJaEIsb0JBQVcsQ0FBQyxxREFBcUQsQ0FBQzs7SUFFbEg7SUFDQSxJQUFJLENBQUNLLE1BQU0sQ0FBQ1ksV0FBVyxDQUFDLENBQUMsRUFBRTtNQUN6QixJQUFJbEMsRUFBRSxHQUFHc0IsTUFBTSxDQUFDakIsS0FBSyxDQUFDLENBQUMsR0FBR2lCLE1BQU0sQ0FBQ2pCLEtBQUssQ0FBQyxDQUFDLEdBQUdaLGdCQUFnQixDQUFDWSxLQUFLLENBQUMsQ0FBQztNQUNuRSxJQUFJLENBQUNMLEVBQUUsRUFBRSxNQUFNLElBQUlpQixvQkFBVyxDQUFDLG1EQUFtRCxDQUFDO01BQ25GLElBQUksQ0FBQyxJQUFJLENBQUNGLFlBQVksQ0FBQ08sTUFBTSxDQUFDYSxPQUFPLENBQUMsQ0FBQyxFQUFFbkMsRUFBRSxDQUFDLEVBQUUsTUFBTSxJQUFJaUIsb0JBQVcsQ0FBQyxpQ0FBaUMsR0FBR0ssTUFBTSxDQUFDYSxPQUFPLENBQUMsQ0FBQyxDQUFDO01BQ3pIYixNQUFNLENBQUNjLFdBQVcsQ0FBQ3BDLEVBQUUsQ0FBQ3FDLFlBQVksQ0FBQ2YsTUFBTSxDQUFDYSxPQUFPLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxDQUFDO01BQy9EYixNQUFNLENBQUNnQixZQUFZLENBQUN0QyxFQUFFLENBQUNtQixVQUFVLENBQUNHLE1BQU0sQ0FBQ2EsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHbkMsRUFBRSxDQUFDcUMsWUFBWSxDQUFDZixNQUFNLENBQUNhLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDL0Y7O0lBRUE7SUFDQSxPQUFPMUMsZ0JBQWdCLENBQUM4QyxjQUFjLENBQUNqQixNQUFNLENBQUM7RUFDaEQ7O0VBRUEsYUFBYWtCLFlBQVlBLENBQUNsQixNQUEwQixFQUE2Qjs7SUFFL0U7SUFDQSxJQUFJQSxNQUFNLEtBQUtoQixTQUFTLEVBQUUsTUFBTSxJQUFJVyxvQkFBVyxDQUFDLHNDQUFzQyxDQUFDO0lBQ3ZGLElBQUlLLE1BQU0sQ0FBQ0ksT0FBTyxDQUFDLENBQUMsS0FBS3BCLFNBQVMsS0FBS2dCLE1BQU0sQ0FBQ00saUJBQWlCLENBQUMsQ0FBQyxLQUFLdEIsU0FBUyxJQUFJZ0IsTUFBTSxDQUFDTyxpQkFBaUIsQ0FBQyxDQUFDLEtBQUt2QixTQUFTLElBQUlnQixNQUFNLENBQUNRLGtCQUFrQixDQUFDLENBQUMsS0FBS3hCLFNBQVMsQ0FBQyxFQUFFLE1BQU0sSUFBSVcsb0JBQVcsQ0FBQyw0REFBNEQsQ0FBQztJQUM5UCxJQUFJSyxNQUFNLENBQUNtQixjQUFjLENBQUMsQ0FBQyxLQUFLbkMsU0FBUyxFQUFFLE1BQU0sSUFBSVcsb0JBQVcsQ0FBQyxnRUFBZ0UsQ0FBQztJQUNsSXlCLDBCQUFpQixDQUFDQyxRQUFRLENBQUNyQixNQUFNLENBQUNtQixjQUFjLENBQUMsQ0FBQyxDQUFDO0lBQ25ELElBQUluQixNQUFNLENBQUNXLGNBQWMsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFLE1BQU0sSUFBSWhCLG9CQUFXLENBQUMsMkRBQTJELENBQUM7SUFDeEgsSUFBSUssTUFBTSxDQUFDYSxPQUFPLENBQUMsQ0FBQyxLQUFLN0IsU0FBUyxFQUFFZ0IsTUFBTSxDQUFDc0IsT0FBTyxDQUFDLEVBQUUsQ0FBQztJQUN0RCxJQUFJdEIsTUFBTSxDQUFDYSxPQUFPLENBQUMsQ0FBQyxJQUFJMUMsZ0JBQWdCLENBQUNzQixZQUFZLENBQUNPLE1BQU0sQ0FBQ2EsT0FBTyxDQUFDLENBQUMsRUFBRWIsTUFBTSxDQUFDakIsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sSUFBSVksb0JBQVcsQ0FBQyx5QkFBeUIsR0FBR0ssTUFBTSxDQUFDYSxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQzVKLElBQUliLE1BQU0sQ0FBQ3VCLFdBQVcsQ0FBQyxDQUFDLEtBQUt2QyxTQUFTLEVBQUVnQixNQUFNLENBQUN3QixXQUFXLENBQUMsRUFBRSxDQUFDOztJQUU5RDtJQUNBLElBQUl4QixNQUFNLENBQUN5QixvQkFBb0IsQ0FBQyxDQUFDLEVBQUU7TUFDakMsSUFBSXpCLE1BQU0sQ0FBQzBCLFNBQVMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxJQUFJL0Isb0JBQVcsQ0FBQyw0RUFBNEUsQ0FBQztNQUMzSEssTUFBTSxDQUFDMkIsU0FBUyxDQUFDM0IsTUFBTSxDQUFDeUIsb0JBQW9CLENBQUMsQ0FBQyxDQUFDRyxhQUFhLENBQUMsQ0FBQyxDQUFDO0lBQ2pFOztJQUVBO0lBQ0EsSUFBSUMsTUFBTTtJQUNWLElBQUk3QixNQUFNLENBQUNFLGdCQUFnQixDQUFDLENBQUMsS0FBS2xCLFNBQVMsRUFBRWdCLE1BQU0sQ0FBQ0csZ0JBQWdCLENBQUMsSUFBSSxDQUFDO0lBQzFFLElBQUlILE1BQU0sQ0FBQ0UsZ0JBQWdCLENBQUMsQ0FBQyxFQUFFO01BQzdCLElBQUlyQixXQUFXLEdBQUcsTUFBTWlELHFCQUFxQixDQUFDWixZQUFZLENBQUNsQixNQUFNLENBQUM7TUFDbEU2QixNQUFNLEdBQUcsSUFBSTFELGdCQUFnQixDQUFDYSxTQUFTLEVBQUVBLFNBQVMsRUFBRUEsU0FBUyxFQUFFQSxTQUFTLEVBQUVBLFNBQVMsRUFBRUEsU0FBUyxFQUFFSCxXQUFXLENBQUM7SUFDOUcsQ0FBQyxNQUFNO01BQ0wsSUFBSW1CLE1BQU0sQ0FBQ0ksT0FBTyxDQUFDLENBQUMsS0FBS3BCLFNBQVMsRUFBRTtRQUNsQyxJQUFJZ0IsTUFBTSxDQUFDVSxXQUFXLENBQUMsQ0FBQyxLQUFLMUIsU0FBUyxFQUFFLE1BQU0sSUFBSVcsb0JBQVcsQ0FBQyx3REFBd0QsQ0FBQztRQUN2SGtDLE1BQU0sR0FBRyxNQUFNMUQsZ0JBQWdCLENBQUM0RCxvQkFBb0IsQ0FBQy9CLE1BQU0sQ0FBQztNQUM5RCxDQUFDLE1BQU0sSUFBSUEsTUFBTSxDQUFDUSxrQkFBa0IsQ0FBQyxDQUFDLEtBQUt4QixTQUFTLElBQUlnQixNQUFNLENBQUNNLGlCQUFpQixDQUFDLENBQUMsS0FBS3RCLFNBQVMsRUFBRTtRQUNoRyxJQUFJZ0IsTUFBTSxDQUFDSyxhQUFhLENBQUMsQ0FBQyxLQUFLckIsU0FBUyxFQUFFLE1BQU0sSUFBSVcsb0JBQVcsQ0FBQywwREFBMEQsQ0FBQztRQUMzSGtDLE1BQU0sR0FBRyxNQUFNMUQsZ0JBQWdCLENBQUM2RCxvQkFBb0IsQ0FBQ2hDLE1BQU0sQ0FBQztNQUM5RCxDQUFDLE1BQU07UUFDTCxJQUFJQSxNQUFNLENBQUNLLGFBQWEsQ0FBQyxDQUFDLEtBQUtyQixTQUFTLEVBQUUsTUFBTSxJQUFJVyxvQkFBVyxDQUFDLHVEQUF1RCxDQUFDO1FBQ3hILElBQUlLLE1BQU0sQ0FBQ1MsZ0JBQWdCLENBQUMsQ0FBQyxLQUFLekIsU0FBUyxFQUFFLE1BQU0sSUFBSVcsb0JBQVcsQ0FBQywwREFBMEQsQ0FBQztRQUM5SGtDLE1BQU0sR0FBRyxNQUFNMUQsZ0JBQWdCLENBQUM4RCxrQkFBa0IsQ0FBQ2pDLE1BQU0sQ0FBQztNQUM1RDtJQUNGOztJQUVBO0lBQ0EsTUFBTTZCLE1BQU0sQ0FBQ0ssb0JBQW9CLENBQUNsQyxNQUFNLENBQUN5QixvQkFBb0IsQ0FBQyxDQUFDLENBQUM7SUFDaEUsT0FBT0ksTUFBTTtFQUNmOztFQUVBLGFBQXVCRSxvQkFBb0JBLENBQUMvQixNQUEwQixFQUE2Qjs7SUFFakc7SUFDQSxJQUFJbUMsZ0JBQWdCLEdBQUduQyxNQUFNLENBQUMwQixTQUFTLENBQUMsQ0FBQztJQUN6QyxJQUFJL0Msa0JBQWtCLEdBQUd3RCxnQkFBZ0IsR0FBR0EsZ0JBQWdCLENBQUNDLHFCQUFxQixDQUFDLENBQUMsR0FBRyxJQUFJO0lBQzNGLElBQUlwQyxNQUFNLENBQUNTLGdCQUFnQixDQUFDLENBQUMsS0FBS3pCLFNBQVMsRUFBRWdCLE1BQU0sQ0FBQ3FDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztJQUN2RSxJQUFJckMsTUFBTSxDQUFDSyxhQUFhLENBQUMsQ0FBQyxLQUFLckIsU0FBUyxFQUFFZ0IsTUFBTSxDQUFDc0MsYUFBYSxDQUFDLEVBQUUsQ0FBQzs7SUFFbEU7SUFDQSxJQUFJQyxNQUFNLEdBQUcsTUFBTWhELHFCQUFZLENBQUNpRCxjQUFjLENBQUMsQ0FBQzs7SUFFaEQ7SUFDQSxJQUFJWCxNQUFNLEdBQUcsTUFBTVUsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUM5QyxPQUFPLElBQUlDLE9BQU8sQ0FBQyxDQUFDQyxPQUFPLEVBQUVDLE1BQU0sS0FBSzs7UUFFdEM7UUFDQSxJQUFJaEUsc0JBQXNCLEdBQUdpRSxpQkFBUSxDQUFDQyxPQUFPLENBQUMsQ0FBQztRQUMvQ3ZELHFCQUFZLENBQUNDLHVCQUF1QixDQUFDWixzQkFBc0IsRUFBRSxNQUFNRCxrQkFBa0IsQ0FBQzs7UUFFdEY7UUFDQTRELE1BQU0sQ0FBQ1Esa0JBQWtCLENBQUNDLElBQUksQ0FBQ0MsU0FBUyxDQUFDakQsTUFBTSxDQUFDa0QsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFdEUsc0JBQXNCLEVBQUUsT0FBT0wsVUFBVSxLQUFLO1VBQ3ZHLElBQUksT0FBT0EsVUFBVSxLQUFLLFFBQVEsRUFBRXFFLE1BQU0sQ0FBQyxJQUFJakQsb0JBQVcsQ0FBQ3BCLFVBQVUsQ0FBQyxDQUFDLENBQUM7VUFDbkVvRSxPQUFPLENBQUMsSUFBSXhFLGdCQUFnQixDQUFDSSxVQUFVLEVBQUV5QixNQUFNLENBQUNhLE9BQU8sQ0FBQyxDQUFDLEVBQUViLE1BQU0sQ0FBQ3VCLFdBQVcsQ0FBQyxDQUFDLEVBQUV2QixNQUFNLENBQUNqQixLQUFLLENBQUMsQ0FBQyxFQUFFaUIsTUFBTSxDQUFDMEIsU0FBUyxDQUFDLENBQUMsR0FBRzFCLE1BQU0sQ0FBQzBCLFNBQVMsQ0FBQyxDQUFDLENBQUNVLHFCQUFxQixDQUFDLENBQUMsR0FBR3BELFNBQVMsRUFBRUosc0JBQXNCLENBQUMsQ0FBQztRQUM3TSxDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7O0lBRUY7SUFDQSxJQUFJb0IsTUFBTSxDQUFDYSxPQUFPLENBQUMsQ0FBQyxFQUFFLE1BQU1nQixNQUFNLENBQUNzQixJQUFJLENBQUMsQ0FBQztJQUN6QyxPQUFPdEIsTUFBTTtFQUNmOztFQUVBLGFBQXVCRyxvQkFBb0JBLENBQUNoQyxNQUEwQixFQUE2Qjs7SUFFakc7SUFDQW9CLDBCQUFpQixDQUFDQyxRQUFRLENBQUNyQixNQUFNLENBQUNtQixjQUFjLENBQUMsQ0FBQyxDQUFDO0lBQ25ELElBQUluQixNQUFNLENBQUNNLGlCQUFpQixDQUFDLENBQUMsS0FBS3RCLFNBQVMsRUFBRWdCLE1BQU0sQ0FBQ29ELGlCQUFpQixDQUFDLEVBQUUsQ0FBQztJQUMxRSxJQUFJcEQsTUFBTSxDQUFDTyxpQkFBaUIsQ0FBQyxDQUFDLEtBQUt2QixTQUFTLEVBQUVnQixNQUFNLENBQUNxRCxpQkFBaUIsQ0FBQyxFQUFFLENBQUM7SUFDMUUsSUFBSXJELE1BQU0sQ0FBQ1Esa0JBQWtCLENBQUMsQ0FBQyxLQUFLeEIsU0FBUyxFQUFFZ0IsTUFBTSxDQUFDc0Qsa0JBQWtCLENBQUMsRUFBRSxDQUFDO0lBQzVFLElBQUluQixnQkFBZ0IsR0FBR25DLE1BQU0sQ0FBQzBCLFNBQVMsQ0FBQyxDQUFDO0lBQ3pDLElBQUkvQyxrQkFBa0IsR0FBR3dELGdCQUFnQixHQUFHQSxnQkFBZ0IsQ0FBQ0MscUJBQXFCLENBQUMsQ0FBQyxHQUFHLElBQUk7SUFDM0YsSUFBSXBDLE1BQU0sQ0FBQ1MsZ0JBQWdCLENBQUMsQ0FBQyxLQUFLekIsU0FBUyxFQUFFZ0IsTUFBTSxDQUFDcUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO0lBQ3ZFLElBQUlyQyxNQUFNLENBQUNVLFdBQVcsQ0FBQyxDQUFDLEtBQUsxQixTQUFTLEVBQUVnQixNQUFNLENBQUN1RCxXQUFXLENBQUMsU0FBUyxDQUFDOztJQUVyRTtJQUNBLElBQUloQixNQUFNLEdBQUcsTUFBTWhELHFCQUFZLENBQUNpRCxjQUFjLENBQUMsQ0FBQzs7SUFFaEQ7SUFDQSxJQUFJWCxNQUFNLEdBQUcsTUFBTVUsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUM5QyxPQUFPLElBQUlDLE9BQU8sQ0FBQyxDQUFDQyxPQUFPLEVBQUVDLE1BQU0sS0FBSzs7UUFFdEM7UUFDQSxJQUFJaEUsc0JBQXNCLEdBQUdpRSxpQkFBUSxDQUFDQyxPQUFPLENBQUMsQ0FBQztRQUMvQ3ZELHFCQUFZLENBQUNDLHVCQUF1QixDQUFDWixzQkFBc0IsRUFBRSxNQUFNRCxrQkFBa0IsQ0FBQzs7UUFFdEY7UUFDQTRELE1BQU0sQ0FBQ1Esa0JBQWtCLENBQUNDLElBQUksQ0FBQ0MsU0FBUyxDQUFDakQsTUFBTSxDQUFDa0QsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFdEUsc0JBQXNCLEVBQUUsT0FBT0wsVUFBVSxLQUFLO1VBQ3ZHLElBQUksT0FBT0EsVUFBVSxLQUFLLFFBQVEsRUFBRXFFLE1BQU0sQ0FBQyxJQUFJakQsb0JBQVcsQ0FBQ3BCLFVBQVUsQ0FBQyxDQUFDLENBQUM7VUFDbkVvRSxPQUFPLENBQUMsSUFBSXhFLGdCQUFnQixDQUFDSSxVQUFVLEVBQUV5QixNQUFNLENBQUNhLE9BQU8sQ0FBQyxDQUFDLEVBQUViLE1BQU0sQ0FBQ3VCLFdBQVcsQ0FBQyxDQUFDLEVBQUV2QixNQUFNLENBQUNqQixLQUFLLENBQUMsQ0FBQyxFQUFFaUIsTUFBTSxDQUFDMEIsU0FBUyxDQUFDLENBQUMsR0FBRzFCLE1BQU0sQ0FBQzBCLFNBQVMsQ0FBQyxDQUFDLENBQUNVLHFCQUFxQixDQUFDLENBQUMsR0FBR3BELFNBQVMsRUFBRUosc0JBQXNCLENBQUMsQ0FBQztRQUM3TSxDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7O0lBRUY7SUFDQSxJQUFJb0IsTUFBTSxDQUFDYSxPQUFPLENBQUMsQ0FBQyxFQUFFLE1BQU1nQixNQUFNLENBQUNzQixJQUFJLENBQUMsQ0FBQztJQUN6QyxPQUFPdEIsTUFBTTtFQUNmOztFQUVBLGFBQXVCSSxrQkFBa0JBLENBQUNqQyxNQUEwQixFQUE2Qjs7SUFFL0Y7SUFDQSxJQUFJQSxNQUFNLENBQUNVLFdBQVcsQ0FBQyxDQUFDLEtBQUsxQixTQUFTLEVBQUVnQixNQUFNLENBQUN1RCxXQUFXLENBQUMsU0FBUyxDQUFDO0lBQ3JFLElBQUlwQixnQkFBZ0IsR0FBR25DLE1BQU0sQ0FBQzBCLFNBQVMsQ0FBQyxDQUFDO0lBQ3pDLElBQUkvQyxrQkFBa0IsR0FBR3dELGdCQUFnQixHQUFHQSxnQkFBZ0IsQ0FBQ0MscUJBQXFCLENBQUMsQ0FBQyxHQUFHLElBQUk7O0lBRTNGO0lBQ0EsSUFBSUcsTUFBTSxHQUFHLE1BQU1oRCxxQkFBWSxDQUFDaUQsY0FBYyxDQUFDLENBQUM7O0lBRWhEO0lBQ0EsSUFBSVgsTUFBTSxHQUFHLE1BQU1VLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDOUMsT0FBTyxJQUFJQyxPQUFPLENBQUMsQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7O1FBRXRDO1FBQ0EsSUFBSWhFLHNCQUFzQixHQUFHaUUsaUJBQVEsQ0FBQ0MsT0FBTyxDQUFDLENBQUM7UUFDL0N2RCxxQkFBWSxDQUFDQyx1QkFBdUIsQ0FBQ1osc0JBQXNCLEVBQUUsTUFBTUQsa0JBQWtCLENBQUM7O1FBRXRGO1FBQ0E0RCxNQUFNLENBQUNRLGtCQUFrQixDQUFDQyxJQUFJLENBQUNDLFNBQVMsQ0FBQ2pELE1BQU0sQ0FBQ2tELE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRXRFLHNCQUFzQixFQUFFLE9BQU9MLFVBQVUsS0FBSztVQUN2RyxJQUFJLE9BQU9BLFVBQVUsS0FBSyxRQUFRLEVBQUVxRSxNQUFNLENBQUMsSUFBSWpELG9CQUFXLENBQUNwQixVQUFVLENBQUMsQ0FBQyxDQUFDO1VBQ25Fb0UsT0FBTyxDQUFDLElBQUl4RSxnQkFBZ0IsQ0FBQ0ksVUFBVSxFQUFFeUIsTUFBTSxDQUFDYSxPQUFPLENBQUMsQ0FBQyxFQUFFYixNQUFNLENBQUN1QixXQUFXLENBQUMsQ0FBQyxFQUFFdkIsTUFBTSxDQUFDakIsS0FBSyxDQUFDLENBQUMsRUFBRWlCLE1BQU0sQ0FBQzBCLFNBQVMsQ0FBQyxDQUFDLEdBQUcxQixNQUFNLENBQUMwQixTQUFTLENBQUMsQ0FBQyxDQUFDVSxxQkFBcUIsQ0FBQyxDQUFDLEdBQUdwRCxTQUFTLEVBQUVKLHNCQUFzQixDQUFDLENBQUM7UUFDN00sQ0FBQyxDQUFDO01BQ0osQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDOztJQUVGO0lBQ0EsSUFBSW9CLE1BQU0sQ0FBQ2EsT0FBTyxDQUFDLENBQUMsRUFBRSxNQUFNZ0IsTUFBTSxDQUFDc0IsSUFBSSxDQUFDLENBQUM7SUFDekMsT0FBT3RCLE1BQU07RUFDZjs7RUFFQSxhQUFhMkIsZ0JBQWdCQSxDQUFBLEVBQUc7SUFDOUIsSUFBSWpCLE1BQU0sR0FBRyxNQUFNaEQscUJBQVksQ0FBQ2lELGNBQWMsQ0FBQyxDQUFDO0lBQ2hELE9BQU9ELE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDbEMsT0FBT08sSUFBSSxDQUFDUyxLQUFLLENBQUNsQixNQUFNLENBQUNtQiw4QkFBOEIsQ0FBQyxDQUFDLENBQUMsQ0FBQ0MsU0FBUztJQUN0RSxDQUFDLENBQUM7RUFDSjs7RUFFQSxPQUFPNUUsS0FBS0EsQ0FBQSxFQUFHO0lBQ2IsSUFBSSxDQUFDWixnQkFBZ0IsQ0FBQ3lGLEVBQUUsRUFBRXpGLGdCQUFnQixDQUFDeUYsRUFBRSxHQUFHZixpQkFBUSxDQUFDZ0IsU0FBUyxDQUFDLENBQUMsR0FBRzdFLFNBQVMsR0FBR04sV0FBRTtJQUNyRixPQUFPUCxnQkFBZ0IsQ0FBQ3lGLEVBQUU7RUFDNUI7O0VBRUE7O0VBRUE7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtFQUNFLE1BQU1FLHNCQUFzQkEsQ0FBQSxFQUFvQjtJQUM5QyxJQUFJLElBQUksQ0FBQ0MsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ0Qsc0JBQXNCLENBQUMsQ0FBQztJQUNoRixPQUFPLElBQUksQ0FBQ3ZCLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLOztRQUV0QztRQUNBLElBQUksQ0FBQ0wsTUFBTSxDQUFDMEIsMEJBQTBCLENBQUMsSUFBSSxDQUFDMUYsVUFBVSxFQUFFLENBQUMyRixJQUFJLEtBQUs7VUFDaEV2QixPQUFPLENBQUN1QixJQUFJLENBQUM7UUFDZixDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsTUFBTUMsY0FBY0EsQ0FBQSxFQUFxQjtJQUN2QyxJQUFJLElBQUksQ0FBQ0osY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ0ksY0FBYyxDQUFDLENBQUM7SUFDeEUsT0FBTyxJQUFJLENBQUM1QixNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLE9BQU8sSUFBSXRCLE9BQU8sQ0FBQyxDQUFDQyxPQUFPLEVBQUVDLE1BQU0sS0FBSzs7UUFFdEM7UUFDQSxJQUFJLENBQUNMLE1BQU0sQ0FBQzZCLGdCQUFnQixDQUFDLElBQUksQ0FBQzdGLFVBQVUsRUFBRSxDQUFDMkYsSUFBSSxLQUFLO1VBQ3REdkIsT0FBTyxDQUFDdUIsSUFBSSxDQUFDO1FBQ2YsQ0FBQyxDQUFDO01BQ0osQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0VBQ0o7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtFQUNFLE1BQU1HLFFBQVFBLENBQUEsRUFBcUI7SUFDakMsSUFBSSxJQUFJLENBQUNOLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUNNLFFBQVEsQ0FBQyxDQUFDO0lBQ2xFLE9BQU8sSUFBSSxDQUFDOUIsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUl0QixPQUFPLENBQUMsQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7UUFDdEMsSUFBSSxDQUFDTCxNQUFNLENBQUMrQixTQUFTLENBQUMsSUFBSSxDQUFDL0YsVUFBVSxFQUFFLENBQUMyRixJQUFJLEtBQUs7VUFDL0N2QixPQUFPLENBQUN1QixJQUFJLENBQUM7UUFDZixDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsTUFBTS9DLGNBQWNBLENBQUEsRUFBK0I7SUFDakQsSUFBSSxJQUFJLENBQUM0QyxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDNUMsY0FBYyxDQUFDLENBQUM7SUFDeEUsT0FBTyxJQUFJLENBQUNvQixNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLE9BQU8sSUFBSSxDQUFDekIsTUFBTSxDQUFDZ0MsZ0JBQWdCLENBQUMsSUFBSSxDQUFDaEcsVUFBVSxDQUFDO0lBQ3RELENBQUMsQ0FBQztFQUNKOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7RUFDRSxNQUFNa0MsZ0JBQWdCQSxDQUFBLEVBQW9CO0lBQ3hDLElBQUksSUFBSSxDQUFDc0QsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ3RELGdCQUFnQixDQUFDLENBQUM7SUFDMUUsT0FBTyxJQUFJLENBQUM4QixNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLE9BQU8sSUFBSSxDQUFDekIsTUFBTSxDQUFDaUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDakcsVUFBVSxDQUFDO0lBQ3hELENBQUMsQ0FBQztFQUNKOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE1BQU04RCxnQkFBZ0JBLENBQUNvQyxhQUFxQixFQUFpQjtJQUMzRCxJQUFJLElBQUksQ0FBQ1YsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQzFCLGdCQUFnQixDQUFDb0MsYUFBYSxDQUFDO0lBQ3ZGLE9BQU8sSUFBSSxDQUFDbEMsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixJQUFJLENBQUN6QixNQUFNLENBQUNtQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUNuRyxVQUFVLEVBQUVrRyxhQUFhLENBQUM7SUFDaEUsQ0FBQyxDQUFDO0VBQ0o7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsTUFBTUUsTUFBTUEsQ0FBQ25HLElBQVksRUFBaUI7SUFDeEMsSUFBSSxJQUFJLENBQUN1RixjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDWSxNQUFNLENBQUNuRyxJQUFJLENBQUM7SUFDcEUsT0FBT0wsZ0JBQWdCLENBQUN3RyxNQUFNLENBQUNuRyxJQUFJLEVBQUUsSUFBSSxDQUFDO0VBQzVDOztFQUVBOztFQUVBLE1BQU1vRyxXQUFXQSxDQUFDQyxRQUE4QixFQUFpQjtJQUMvRCxJQUFJLElBQUksQ0FBQ2QsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ2EsV0FBVyxDQUFDQyxRQUFRLENBQUM7SUFDN0UsSUFBQW5GLGVBQU0sRUFBQ21GLFFBQVEsWUFBWUMsNkJBQW9CLEVBQUUsbURBQW1ELENBQUM7SUFDckcsSUFBSSxDQUFDaEcsU0FBUyxDQUFDaUcsSUFBSSxDQUFDRixRQUFRLENBQUM7SUFDN0IsTUFBTSxJQUFJLENBQUNHLGdCQUFnQixDQUFDLENBQUM7RUFDL0I7O0VBRUEsTUFBTUMsY0FBY0EsQ0FBQ0osUUFBUSxFQUFpQjtJQUM1QyxJQUFJLElBQUksQ0FBQ2QsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ2tCLGNBQWMsQ0FBQ0osUUFBUSxDQUFDO0lBQ2hGLElBQUlLLEdBQUcsR0FBRyxJQUFJLENBQUNwRyxTQUFTLENBQUNxRyxPQUFPLENBQUNOLFFBQVEsQ0FBQztJQUMxQyxJQUFJSyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDcEcsU0FBUyxDQUFDc0csTUFBTSxDQUFDRixHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDdkMsTUFBTSxJQUFJdkYsb0JBQVcsQ0FBQyx3Q0FBd0MsQ0FBQztJQUNwRSxNQUFNLElBQUksQ0FBQ3FGLGdCQUFnQixDQUFDLENBQUM7RUFDL0I7O0VBRUFLLFlBQVlBLENBQUEsRUFBMkI7SUFDckMsSUFBSSxJQUFJLENBQUN0QixjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDc0IsWUFBWSxDQUFDLENBQUM7SUFDdEUsT0FBTyxJQUFJLENBQUN2RyxTQUFTO0VBQ3ZCOztFQUVBLE1BQU13RyxtQkFBbUJBLENBQUNDLGVBQThDLEVBQWlCO0lBQ3ZGLElBQUksSUFBSSxDQUFDeEIsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ3VCLG1CQUFtQixDQUFDQyxlQUFlLENBQUM7O0lBRTVGO0lBQ0EsSUFBSUMsVUFBVSxHQUFHLENBQUNELGVBQWUsR0FBR3ZHLFNBQVMsR0FBR3VHLGVBQWUsWUFBWUUsNEJBQW1CLEdBQUdGLGVBQWUsR0FBRyxJQUFJRSw0QkFBbUIsQ0FBQ0YsZUFBZSxDQUFDO0lBQzNKLElBQUlHLEdBQUcsR0FBR0YsVUFBVSxJQUFJQSxVQUFVLENBQUNHLE1BQU0sQ0FBQyxDQUFDLEdBQUdILFVBQVUsQ0FBQ0csTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFO0lBQ3RFLElBQUlDLFFBQVEsR0FBR0osVUFBVSxJQUFJQSxVQUFVLENBQUNLLFdBQVcsQ0FBQyxDQUFDLEdBQUdMLFVBQVUsQ0FBQ0ssV0FBVyxDQUFDLENBQUMsR0FBRyxFQUFFO0lBQ3JGLElBQUlwSCxRQUFRLEdBQUcrRyxVQUFVLElBQUlBLFVBQVUsQ0FBQ2pFLFdBQVcsQ0FBQyxDQUFDLEdBQUdpRSxVQUFVLENBQUNqRSxXQUFXLENBQUMsQ0FBQyxHQUFHLEVBQUU7SUFDckYsSUFBSTVDLGtCQUFrQixHQUFHNkcsVUFBVSxHQUFHQSxVQUFVLENBQUNwRCxxQkFBcUIsQ0FBQyxDQUFDLEdBQUdwRCxTQUFTO0lBQ3BGLElBQUksQ0FBQ0wsa0JBQWtCLEdBQUdBLGtCQUFrQixDQUFDLENBQUU7O0lBRS9DO0lBQ0EsT0FBTyxJQUFJLENBQUM0RCxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLE9BQU8sSUFBSXRCLE9BQU8sQ0FBTyxDQUFDQyxPQUFPLEVBQUVDLE1BQU0sS0FBSztRQUM1QyxJQUFJLENBQUNMLE1BQU0sQ0FBQ3VELHFCQUFxQixDQUFDLElBQUksQ0FBQ3ZILFVBQVUsRUFBRW1ILEdBQUcsRUFBRUUsUUFBUSxFQUFFbkgsUUFBUSxFQUFFLENBQUN5RixJQUFJLEtBQUs7VUFDcEZ2QixPQUFPLENBQUMsQ0FBQztRQUNYLENBQUMsQ0FBQztNQUNKLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1vRCxtQkFBbUJBLENBQUEsRUFBaUM7SUFDeEQsSUFBSSxJQUFJLENBQUNoQyxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDZ0MsbUJBQW1CLENBQUMsQ0FBQztJQUM3RSxPQUFPLElBQUksQ0FBQ3hELE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLO1FBQ3RDLElBQUlvRCxzQkFBc0IsR0FBRyxJQUFJLENBQUN6RCxNQUFNLENBQUMwRCxxQkFBcUIsQ0FBQyxJQUFJLENBQUMxSCxVQUFVLENBQUM7UUFDL0UsSUFBSSxDQUFDeUgsc0JBQXNCLEVBQUVyRCxPQUFPLENBQUMzRCxTQUFTLENBQUMsQ0FBQztRQUMzQztVQUNILElBQUlrSCxjQUFjLEdBQUdsRCxJQUFJLENBQUNTLEtBQUssQ0FBQ3VDLHNCQUFzQixDQUFDO1VBQ3ZEckQsT0FBTyxDQUFDLElBQUk4Qyw0QkFBbUIsQ0FBQyxFQUFDQyxHQUFHLEVBQUVRLGNBQWMsQ0FBQ1IsR0FBRyxFQUFFRSxRQUFRLEVBQUVNLGNBQWMsQ0FBQ04sUUFBUSxFQUFFbkgsUUFBUSxFQUFFeUgsY0FBYyxDQUFDekgsUUFBUSxFQUFFRSxrQkFBa0IsRUFBRSxJQUFJLENBQUNBLGtCQUFrQixFQUFDLENBQUMsQ0FBQztRQUNoTDtNQUNGLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU13SCxtQkFBbUJBLENBQUEsRUFBcUI7SUFDNUMsSUFBSSxJQUFJLENBQUNwQyxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDb0MsbUJBQW1CLENBQUMsQ0FBQztJQUM3RSxPQUFPLElBQUksQ0FBQzVELE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLO1FBQ3RDLElBQUksQ0FBQ0wsTUFBTSxDQUFDNkQsc0JBQXNCLENBQUMsSUFBSSxDQUFDN0gsVUFBVSxFQUFFLENBQUMyRixJQUFJLEtBQUs7VUFDNUR2QixPQUFPLENBQUN1QixJQUFJLENBQUM7UUFDZixDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNbUMsVUFBVUEsQ0FBQSxFQUEyQjtJQUN6QyxJQUFJLElBQUksQ0FBQ3RDLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUNzQyxVQUFVLENBQUMsQ0FBQztJQUNwRSxNQUFNLElBQUkxRyxvQkFBVyxDQUFDLGlCQUFpQixDQUFDO0VBQzFDOztFQUVBLE1BQU1rQixPQUFPQSxDQUFBLEVBQW9CO0lBQy9CLElBQUksSUFBSSxDQUFDa0QsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ2xELE9BQU8sQ0FBQyxDQUFDO0lBQ2pFLE9BQU8sSUFBSSxDQUFDckMsSUFBSTtFQUNsQjs7RUFFQSxNQUFNOEgsb0JBQW9CQSxDQUFDQyxlQUF3QixFQUFFQyxTQUFrQixFQUFvQztJQUN6RyxJQUFJLElBQUksQ0FBQ3pDLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUN1QyxvQkFBb0IsQ0FBQ0MsZUFBZSxFQUFFQyxTQUFTLENBQUM7SUFDeEcsT0FBTyxJQUFJLENBQUNqRSxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLElBQUk7UUFDRixJQUFJeUMsTUFBTSxHQUFHLElBQUksQ0FBQ2xFLE1BQU0sQ0FBQ21FLHNCQUFzQixDQUFDLElBQUksQ0FBQ25JLFVBQVUsRUFBRWdJLGVBQWUsR0FBR0EsZUFBZSxHQUFHLEVBQUUsRUFBRUMsU0FBUyxHQUFHQSxTQUFTLEdBQUcsRUFBRSxDQUFDO1FBQ3BJLElBQUlDLE1BQU0sQ0FBQ0UsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRSxNQUFNLElBQUloSCxvQkFBVyxDQUFDOEcsTUFBTSxDQUFDO1FBQzNELE9BQU8sSUFBSUcsZ0NBQXVCLENBQUM1RCxJQUFJLENBQUNTLEtBQUssQ0FBQ2dELE1BQU0sQ0FBQyxDQUFDO01BQ3hELENBQUMsQ0FBQyxPQUFPSSxHQUFRLEVBQUU7UUFDakIsSUFBSUEsR0FBRyxDQUFDQyxPQUFPLENBQUNDLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLE1BQU0sSUFBSXBILG9CQUFXLENBQUMsc0JBQXNCLEdBQUc2RyxTQUFTLENBQUM7UUFDekcsTUFBTSxJQUFJN0csb0JBQVcsQ0FBQ2tILEdBQUcsQ0FBQ0MsT0FBTyxDQUFDO01BQ3BDO0lBQ0YsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTUUsdUJBQXVCQSxDQUFDQyxpQkFBeUIsRUFBb0M7SUFDekYsSUFBSSxJQUFJLENBQUNsRCxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDaUQsdUJBQXVCLENBQUNDLGlCQUFpQixDQUFDO0lBQ2xHLE9BQU8sSUFBSSxDQUFDMUUsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixJQUFJO1FBQ0YsSUFBSXlDLE1BQU0sR0FBRyxJQUFJLENBQUNsRSxNQUFNLENBQUMyRSx5QkFBeUIsQ0FBQyxJQUFJLENBQUMzSSxVQUFVLEVBQUUwSSxpQkFBaUIsQ0FBQztRQUN0RixJQUFJUixNQUFNLENBQUNFLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUUsTUFBTSxJQUFJaEgsb0JBQVcsQ0FBQzhHLE1BQU0sQ0FBQztRQUMzRCxPQUFPLElBQUlHLGdDQUF1QixDQUFDNUQsSUFBSSxDQUFDUyxLQUFLLENBQUNnRCxNQUFNLENBQUMsQ0FBQztNQUN4RCxDQUFDLENBQUMsT0FBT0ksR0FBUSxFQUFFO1FBQ2pCLE1BQU0sSUFBSWxILG9CQUFXLENBQUNrSCxHQUFHLENBQUNDLE9BQU8sQ0FBQztNQUNwQztJQUNGLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1LLFNBQVNBLENBQUEsRUFBb0I7SUFDakMsSUFBSSxJQUFJLENBQUNwRCxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDb0QsU0FBUyxDQUFDLENBQUM7SUFDbkUsT0FBTyxJQUFJLENBQUM1RSxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLE9BQU8sSUFBSXRCLE9BQU8sQ0FBQyxDQUFDQyxPQUFPLEVBQUVDLE1BQU0sS0FBSztRQUN0QyxJQUFJLENBQUNMLE1BQU0sQ0FBQzZFLFVBQVUsQ0FBQyxJQUFJLENBQUM3SSxVQUFVLEVBQUUsQ0FBQzJGLElBQUksS0FBSztVQUNoRHZCLE9BQU8sQ0FBQ3VCLElBQUksQ0FBQztRQUNmLENBQUMsQ0FBQztNQUNKLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1tRCxlQUFlQSxDQUFBLEVBQW9CO0lBQ3ZDLElBQUksSUFBSSxDQUFDdEQsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ3NELGVBQWUsQ0FBQyxDQUFDO0lBQ3pFLElBQUksRUFBRSxNQUFNLElBQUksQ0FBQ2xCLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sSUFBSXhHLG9CQUFXLENBQUMsbUNBQW1DLENBQUM7SUFDbkcsT0FBTyxJQUFJLENBQUM0QyxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLE9BQU8sSUFBSXRCLE9BQU8sQ0FBQyxDQUFDQyxPQUFPLEVBQUVDLE1BQU0sS0FBSztRQUN0QyxJQUFJLENBQUNMLE1BQU0sQ0FBQytFLGlCQUFpQixDQUFDLElBQUksQ0FBQy9JLFVBQVUsRUFBRSxDQUFDMkYsSUFBSSxLQUFLO1VBQ3ZEdkIsT0FBTyxDQUFDdUIsSUFBSSxDQUFDO1FBQ2YsQ0FBQyxDQUFDO01BQ0osQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTXFELGVBQWVBLENBQUNDLElBQVksRUFBRUMsS0FBYSxFQUFFQyxHQUFXLEVBQW1CO0lBQy9FLElBQUksSUFBSSxDQUFDM0QsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ3dELGVBQWUsQ0FBQ0MsSUFBSSxFQUFFQyxLQUFLLEVBQUVDLEdBQUcsQ0FBQztJQUN6RixJQUFJLEVBQUUsTUFBTSxJQUFJLENBQUN2QixtQkFBbUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLElBQUl4RyxvQkFBVyxDQUFDLG1DQUFtQyxDQUFDO0lBQ25HLE9BQU8sSUFBSSxDQUFDNEMsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUl0QixPQUFPLENBQUMsQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7UUFDdEMsSUFBSSxDQUFDTCxNQUFNLENBQUNvRixrQkFBa0IsQ0FBQyxJQUFJLENBQUNwSixVQUFVLEVBQUVpSixJQUFJLEVBQUVDLEtBQUssRUFBRUMsR0FBRyxFQUFFLENBQUN4RCxJQUFJLEtBQUs7VUFDMUUsSUFBSSxPQUFPQSxJQUFJLEtBQUssUUFBUSxFQUFFdEIsTUFBTSxDQUFDLElBQUlqRCxvQkFBVyxDQUFDdUUsSUFBSSxDQUFDLENBQUMsQ0FBQztVQUN2RHZCLE9BQU8sQ0FBQ3VCLElBQUksQ0FBQztRQUNwQixDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE1BQU0wRCxJQUFJQSxDQUFDQyxxQkFBcUQsRUFBRUMsV0FBb0IsRUFBRUMsb0JBQW9CLEdBQUcsS0FBSyxFQUE2QjtJQUMvSSxJQUFJLElBQUksQ0FBQ2hFLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUM2RCxJQUFJLENBQUNDLHFCQUFxQixFQUFFQyxXQUFXLEVBQUVDLG9CQUFvQixDQUFDO0lBQ3RILElBQUksRUFBRSxNQUFNLElBQUksQ0FBQzVCLG1CQUFtQixDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sSUFBSXhHLG9CQUFXLENBQUMsbUNBQW1DLENBQUM7O0lBRW5HO0lBQ0FtSSxXQUFXLEdBQUdELHFCQUFxQixLQUFLN0ksU0FBUyxJQUFJNkkscUJBQXFCLFlBQVkvQyw2QkFBb0IsR0FBR2dELFdBQVcsR0FBR0QscUJBQXFCO0lBQ2hKLElBQUloRCxRQUFRLEdBQUdnRCxxQkFBcUIsWUFBWS9DLDZCQUFvQixHQUFHK0MscUJBQXFCLEdBQUc3SSxTQUFTO0lBQ3hHLElBQUk4SSxXQUFXLEtBQUs5SSxTQUFTLEVBQUU4SSxXQUFXLEdBQUdFLElBQUksQ0FBQ0MsR0FBRyxDQUFDLE1BQU0sSUFBSSxDQUFDZCxTQUFTLENBQUMsQ0FBQyxFQUFFLE1BQU0sSUFBSSxDQUFDMUcsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDOztJQUU1RztJQUNBLElBQUlvRSxRQUFRLEVBQUUsTUFBTSxJQUFJLENBQUNELFdBQVcsQ0FBQ0MsUUFBUSxDQUFDOztJQUU5QztJQUNBLElBQUlnQyxHQUFHO0lBQ1AsSUFBSUosTUFBTTtJQUNWLElBQUk7TUFDRixJQUFJeUIsSUFBSSxHQUFHLElBQUk7TUFDZnpCLE1BQU0sR0FBRyxPQUFPc0Isb0JBQW9CLEdBQUdJLFFBQVEsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDNUYsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTBGLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUNsRyxTQUFTQSxRQUFRQSxDQUFBLEVBQUc7UUFDbEJELElBQUksQ0FBQ2xFLGVBQWUsQ0FBQyxDQUFDO1FBQ3RCLE9BQU8sSUFBSXRCLE9BQU8sQ0FBQyxDQUFDQyxPQUFPLEVBQUVDLE1BQU0sS0FBSzs7VUFFdEM7VUFDQXNGLElBQUksQ0FBQzNGLE1BQU0sQ0FBQ3FGLElBQUksQ0FBQ00sSUFBSSxDQUFDM0osVUFBVSxFQUFFdUosV0FBVyxFQUFFLE9BQU81RCxJQUFJLEtBQUs7WUFDN0QsSUFBSUEsSUFBSSxDQUFDeUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRS9ELE1BQU0sQ0FBQyxJQUFJakQsb0JBQVcsQ0FBQ3VFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDckQ7Y0FDSCxJQUFJa0UsUUFBUSxHQUFHcEYsSUFBSSxDQUFDUyxLQUFLLENBQUNTLElBQUksQ0FBQztjQUMvQnZCLE9BQU8sQ0FBQyxJQUFJMEYseUJBQWdCLENBQUNELFFBQVEsQ0FBQ0UsZ0JBQWdCLEVBQUVGLFFBQVEsQ0FBQ0csYUFBYSxDQUFDLENBQUM7WUFDbEY7VUFDRixDQUFDLENBQUM7UUFDSixDQUFDLENBQUM7TUFDSjtJQUNGLENBQUMsQ0FBQyxPQUFPQyxDQUFDLEVBQUU7TUFDVjNCLEdBQUcsR0FBRzJCLENBQUM7SUFDVDs7SUFFQTtJQUNBLElBQUkzRCxRQUFRLEVBQUUsTUFBTSxJQUFJLENBQUNJLGNBQWMsQ0FBQ0osUUFBUSxDQUFDOztJQUVqRDtJQUNBLElBQUlnQyxHQUFHLEVBQUUsTUFBTUEsR0FBRztJQUNsQixPQUFPSixNQUFNO0VBQ2Y7O0VBRUEsTUFBTWdDLFlBQVlBLENBQUNuSixjQUF1QixFQUFpQjtJQUN6RCxJQUFJLElBQUksQ0FBQ3lFLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUMwRSxZQUFZLENBQUNuSixjQUFjLENBQUM7SUFDcEYsSUFBSSxFQUFFLE1BQU0sSUFBSSxDQUFDNkcsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxJQUFJeEcsb0JBQVcsQ0FBQyxtQ0FBbUMsQ0FBQztJQUNuRyxJQUFJLENBQUNMLGNBQWMsR0FBR0EsY0FBYyxLQUFLTixTQUFTLEdBQUdiLGdCQUFnQixDQUFDRSx5QkFBeUIsR0FBR2lCLGNBQWM7SUFDaEgsSUFBSSxDQUFDLElBQUksQ0FBQ29KLFVBQVUsRUFBRSxJQUFJLENBQUNBLFVBQVUsR0FBRyxJQUFJQyxtQkFBVSxDQUFDLFlBQVksTUFBTSxJQUFJLENBQUNDLGNBQWMsQ0FBQyxDQUFDLENBQUM7SUFDL0YsSUFBSSxDQUFDRixVQUFVLENBQUNHLEtBQUssQ0FBQyxJQUFJLENBQUN2SixjQUFjLENBQUM7RUFDNUM7O0VBRUEsTUFBTXdKLFdBQVdBLENBQUEsRUFBa0I7SUFDakMsSUFBSSxJQUFJLENBQUMvRSxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDK0UsV0FBVyxDQUFDLENBQUM7SUFDckUsSUFBSSxDQUFDOUUsZUFBZSxDQUFDLENBQUM7SUFDdEIsSUFBSSxJQUFJLENBQUMwRSxVQUFVLEVBQUUsSUFBSSxDQUFDQSxVQUFVLENBQUNLLElBQUksQ0FBQyxDQUFDO0lBQzNDLElBQUksQ0FBQ3hHLE1BQU0sQ0FBQ3lHLFlBQVksQ0FBQyxJQUFJLENBQUN6SyxVQUFVLENBQUMsQ0FBQyxDQUFDO0VBQzdDOztFQUVBLE1BQU0wSyxPQUFPQSxDQUFDQyxRQUFrQixFQUFpQjtJQUMvQyxJQUFJLElBQUksQ0FBQ25GLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUNrRixPQUFPLENBQUNDLFFBQVEsQ0FBQztJQUN6RSxPQUFPLElBQUksQ0FBQzNHLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFPLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLO1FBQzVDLElBQUksQ0FBQ0wsTUFBTSxDQUFDNEcsUUFBUSxDQUFDLElBQUksQ0FBQzVLLFVBQVUsRUFBRXlFLElBQUksQ0FBQ0MsU0FBUyxDQUFDLEVBQUNpRyxRQUFRLEVBQUVBLFFBQVEsRUFBQyxDQUFDLEVBQUUsQ0FBQ3JDLEdBQUcsS0FBSztVQUNuRixJQUFJQSxHQUFHLEVBQUVqRSxNQUFNLENBQUMsSUFBSWpELG9CQUFXLENBQUNrSCxHQUFHLENBQUMsQ0FBQyxDQUFDO1VBQ2pDbEUsT0FBTyxDQUFDLENBQUM7UUFDaEIsQ0FBQyxDQUFDO01BQ0osQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTXlHLFdBQVdBLENBQUEsRUFBa0I7SUFDakMsSUFBSSxJQUFJLENBQUNyRixjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDcUYsV0FBVyxDQUFDLENBQUM7SUFDckUsT0FBTyxJQUFJLENBQUM3RyxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLE9BQU8sSUFBSXRCLE9BQU8sQ0FBTyxDQUFDQyxPQUFPLEVBQUVDLE1BQU0sS0FBSztRQUM1QyxJQUFJLENBQUNMLE1BQU0sQ0FBQzhHLFlBQVksQ0FBQyxJQUFJLENBQUM5SyxVQUFVLEVBQUUsTUFBTW9FLE9BQU8sQ0FBQyxDQUFDLENBQUM7TUFDNUQsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTTJHLGdCQUFnQkEsQ0FBQSxFQUFrQjtJQUN0QyxJQUFJLElBQUksQ0FBQ3ZGLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUN1RixnQkFBZ0IsQ0FBQyxDQUFDO0lBQzFFLE9BQU8sSUFBSSxDQUFDL0csTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUl0QixPQUFPLENBQU8sQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7UUFDNUMsSUFBSSxDQUFDTCxNQUFNLENBQUNnSCxpQkFBaUIsQ0FBQyxJQUFJLENBQUNoTCxVQUFVLEVBQUUsTUFBTW9FLE9BQU8sQ0FBQyxDQUFDLENBQUM7TUFDakUsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTTZHLFVBQVVBLENBQUNDLFVBQW1CLEVBQUVDLGFBQXNCLEVBQW1CO0lBQzdFLElBQUksSUFBSSxDQUFDM0YsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ3lGLFVBQVUsQ0FBQ0MsVUFBVSxFQUFFQyxhQUFhLENBQUM7SUFDN0YsT0FBTyxJQUFJLENBQUNuSCxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDOztNQUV0QjtNQUNBLElBQUkyRixVQUFVO01BQ2QsSUFBSUYsVUFBVSxLQUFLekssU0FBUyxFQUFFO1FBQzVCLElBQUFVLGVBQU0sRUFBQ2dLLGFBQWEsS0FBSzFLLFNBQVMsRUFBRSxrRUFBa0UsQ0FBQztRQUN2RzJLLFVBQVUsR0FBRyxJQUFJLENBQUNwSCxNQUFNLENBQUNxSCxrQkFBa0IsQ0FBQyxJQUFJLENBQUNyTCxVQUFVLENBQUM7TUFDOUQsQ0FBQyxNQUFNLElBQUltTCxhQUFhLEtBQUsxSyxTQUFTLEVBQUU7UUFDdEMySyxVQUFVLEdBQUcsSUFBSSxDQUFDcEgsTUFBTSxDQUFDc0gsbUJBQW1CLENBQUMsSUFBSSxDQUFDdEwsVUFBVSxFQUFFa0wsVUFBVSxDQUFDO01BQzNFLENBQUMsTUFBTTtRQUNMRSxVQUFVLEdBQUcsSUFBSSxDQUFDcEgsTUFBTSxDQUFDdUgsc0JBQXNCLENBQUMsSUFBSSxDQUFDdkwsVUFBVSxFQUFFa0wsVUFBVSxFQUFFQyxhQUFhLENBQUM7TUFDN0Y7O01BRUE7TUFDQSxPQUFPSyxNQUFNLENBQUMvRyxJQUFJLENBQUNTLEtBQUssQ0FBQ1osaUJBQVEsQ0FBQ21ILGdCQUFnQixDQUFDTCxVQUFVLENBQUMsQ0FBQyxDQUFDTSxPQUFPLENBQUM7SUFDMUUsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTUMsa0JBQWtCQSxDQUFDVCxVQUFtQixFQUFFQyxhQUFzQixFQUFtQjtJQUNyRixJQUFJLElBQUksQ0FBQzNGLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUNtRyxrQkFBa0IsQ0FBQ1QsVUFBVSxFQUFFQyxhQUFhLENBQUM7SUFDckcsT0FBTyxJQUFJLENBQUNuSCxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDOztNQUV0QjtNQUNBLElBQUltRyxrQkFBa0I7TUFDdEIsSUFBSVYsVUFBVSxLQUFLekssU0FBUyxFQUFFO1FBQzVCLElBQUFVLGVBQU0sRUFBQ2dLLGFBQWEsS0FBSzFLLFNBQVMsRUFBRSxrRUFBa0UsQ0FBQztRQUN2R21MLGtCQUFrQixHQUFHLElBQUksQ0FBQzVILE1BQU0sQ0FBQzZILDJCQUEyQixDQUFDLElBQUksQ0FBQzdMLFVBQVUsQ0FBQztNQUMvRSxDQUFDLE1BQU0sSUFBSW1MLGFBQWEsS0FBSzFLLFNBQVMsRUFBRTtRQUN0Q21MLGtCQUFrQixHQUFHLElBQUksQ0FBQzVILE1BQU0sQ0FBQzhILDRCQUE0QixDQUFDLElBQUksQ0FBQzlMLFVBQVUsRUFBRWtMLFVBQVUsQ0FBQztNQUM1RixDQUFDLE1BQU07UUFDTFUsa0JBQWtCLEdBQUcsSUFBSSxDQUFDNUgsTUFBTSxDQUFDK0gsK0JBQStCLENBQUMsSUFBSSxDQUFDL0wsVUFBVSxFQUFFa0wsVUFBVSxFQUFFQyxhQUFhLENBQUM7TUFDOUc7O01BRUE7TUFDQSxPQUFPSyxNQUFNLENBQUMvRyxJQUFJLENBQUNTLEtBQUssQ0FBQ1osaUJBQVEsQ0FBQ21ILGdCQUFnQixDQUFDRyxrQkFBa0IsQ0FBQyxDQUFDLENBQUNJLGVBQWUsQ0FBQztJQUMxRixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNQyxXQUFXQSxDQUFDQyxtQkFBNkIsRUFBRUMsR0FBWSxFQUE0QjtJQUN2RixJQUFJLElBQUksQ0FBQzNHLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUN5RyxXQUFXLENBQUNDLG1CQUFtQixFQUFFQyxHQUFHLENBQUM7SUFDN0YsT0FBTyxJQUFJLENBQUNuSSxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLElBQUkyRyxXQUFXLEdBQUcsSUFBSSxDQUFDcEksTUFBTSxDQUFDcUksWUFBWSxDQUFDLElBQUksQ0FBQ3JNLFVBQVUsRUFBRWtNLG1CQUFtQixHQUFHLElBQUksR0FBRyxLQUFLLEVBQUVDLEdBQUcsR0FBR0EsR0FBRyxHQUFHLEVBQUUsQ0FBQztNQUMvRyxJQUFJRyxRQUFRLEdBQUcsRUFBRTtNQUNqQixLQUFLLElBQUlDLFdBQVcsSUFBSTlILElBQUksQ0FBQ1MsS0FBSyxDQUFDWixpQkFBUSxDQUFDbUgsZ0JBQWdCLENBQUNXLFdBQVcsQ0FBQyxDQUFDLENBQUNFLFFBQVEsRUFBRTtRQUNuRkEsUUFBUSxDQUFDOUYsSUFBSSxDQUFDNUcsZ0JBQWdCLENBQUM0TSxlQUFlLENBQUMsSUFBSUMsc0JBQWEsQ0FBQ0YsV0FBVyxDQUFDLENBQUMsQ0FBQztNQUNqRjtNQUNBLE9BQU9ELFFBQVE7SUFDakIsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTUksVUFBVUEsQ0FBQ3hCLFVBQWtCLEVBQUVnQixtQkFBNkIsRUFBMEI7SUFDMUYsSUFBSSxJQUFJLENBQUMxRyxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDa0gsVUFBVSxDQUFDeEIsVUFBVSxFQUFFZ0IsbUJBQW1CLENBQUM7SUFDbkcsT0FBTyxJQUFJLENBQUNsSSxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLElBQUlrSCxVQUFVLEdBQUcsSUFBSSxDQUFDM0ksTUFBTSxDQUFDNEksV0FBVyxDQUFDLElBQUksQ0FBQzVNLFVBQVUsRUFBRWtMLFVBQVUsRUFBRWdCLG1CQUFtQixHQUFHLElBQUksR0FBRyxLQUFLLENBQUM7TUFDekcsSUFBSUssV0FBVyxHQUFHOUgsSUFBSSxDQUFDUyxLQUFLLENBQUNaLGlCQUFRLENBQUNtSCxnQkFBZ0IsQ0FBQ2tCLFVBQVUsQ0FBQyxDQUFDO01BQ25FLE9BQU8vTSxnQkFBZ0IsQ0FBQzRNLGVBQWUsQ0FBQyxJQUFJQyxzQkFBYSxDQUFDRixXQUFXLENBQUMsQ0FBQztJQUN6RSxDQUFDLENBQUM7O0VBRUo7O0VBRUEsTUFBTU0sYUFBYUEsQ0FBQ0MsS0FBYyxFQUEwQjtJQUMxRCxJQUFJLElBQUksQ0FBQ3RILGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUNxSCxhQUFhLENBQUNDLEtBQUssQ0FBQztJQUM1RSxJQUFJQSxLQUFLLEtBQUtyTSxTQUFTLEVBQUVxTSxLQUFLLEdBQUcsRUFBRTtJQUNuQyxPQUFPLElBQUksQ0FBQzlJLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsSUFBSWtILFVBQVUsR0FBRyxJQUFJLENBQUMzSSxNQUFNLENBQUMrSSxjQUFjLENBQUMsSUFBSSxDQUFDL00sVUFBVSxFQUFFOE0sS0FBSyxDQUFDO01BQ25FLElBQUlQLFdBQVcsR0FBRzlILElBQUksQ0FBQ1MsS0FBSyxDQUFDWixpQkFBUSxDQUFDbUgsZ0JBQWdCLENBQUNrQixVQUFVLENBQUMsQ0FBQztNQUNuRSxPQUFPL00sZ0JBQWdCLENBQUM0TSxlQUFlLENBQUMsSUFBSUMsc0JBQWEsQ0FBQ0YsV0FBVyxDQUFDLENBQUM7SUFDekUsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTVMsZUFBZUEsQ0FBQzlCLFVBQWtCLEVBQUUrQixpQkFBNEIsRUFBK0I7SUFDbkcsSUFBSSxJQUFJLENBQUN6SCxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDd0gsZUFBZSxDQUFDOUIsVUFBVSxFQUFFK0IsaUJBQWlCLENBQUM7SUFDdEcsSUFBSUMsSUFBSSxHQUFHLEVBQUNoQyxVQUFVLEVBQUVBLFVBQVUsRUFBRStCLGlCQUFpQixFQUFFQSxpQkFBaUIsS0FBS3hNLFNBQVMsR0FBRyxFQUFFLEdBQUc2RCxpQkFBUSxDQUFDNkksT0FBTyxDQUFDRixpQkFBaUIsQ0FBQyxFQUFDO0lBQ2xJLE9BQU8sSUFBSSxDQUFDakosTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixJQUFJMkgsZ0JBQWdCLEdBQUczSSxJQUFJLENBQUNTLEtBQUssQ0FBQ1osaUJBQVEsQ0FBQ21ILGdCQUFnQixDQUFDLElBQUksQ0FBQ3pILE1BQU0sQ0FBQ3FKLGdCQUFnQixDQUFDLElBQUksQ0FBQ3JOLFVBQVUsRUFBRXlFLElBQUksQ0FBQ0MsU0FBUyxDQUFDd0ksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUNJLFlBQVk7TUFDOUksSUFBSUEsWUFBWSxHQUFHLEVBQUU7TUFDckIsS0FBSyxJQUFJQyxjQUFjLElBQUlILGdCQUFnQixFQUFFRSxZQUFZLENBQUM5RyxJQUFJLENBQUMzRyxrQ0FBZ0IsQ0FBQzJOLGtCQUFrQixDQUFDLElBQUlDLHlCQUFnQixDQUFDRixjQUFjLENBQUMsQ0FBQyxDQUFDO01BQ3pJLE9BQU9ELFlBQVk7SUFDckIsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTUksZ0JBQWdCQSxDQUFDeEMsVUFBa0IsRUFBRTRCLEtBQWMsRUFBNkI7SUFDcEYsSUFBSSxJQUFJLENBQUN0SCxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDa0ksZ0JBQWdCLENBQUN4QyxVQUFVLEVBQUU0QixLQUFLLENBQUM7SUFDM0YsSUFBSUEsS0FBSyxLQUFLck0sU0FBUyxFQUFFcU0sS0FBSyxHQUFHLEVBQUU7SUFDbkMsT0FBTyxJQUFJLENBQUM5SSxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLElBQUlrSSxhQUFhLEdBQUcsSUFBSSxDQUFDM0osTUFBTSxDQUFDNEosaUJBQWlCLENBQUMsSUFBSSxDQUFDNU4sVUFBVSxFQUFFa0wsVUFBVSxFQUFFNEIsS0FBSyxDQUFDO01BQ3JGLElBQUlTLGNBQWMsR0FBRzlJLElBQUksQ0FBQ1MsS0FBSyxDQUFDWixpQkFBUSxDQUFDbUgsZ0JBQWdCLENBQUNrQyxhQUFhLENBQUMsQ0FBQztNQUN6RSxPQUFPOU4sa0NBQWdCLENBQUMyTixrQkFBa0IsQ0FBQyxJQUFJQyx5QkFBZ0IsQ0FBQ0YsY0FBYyxDQUFDLENBQUM7SUFDbEYsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTU0sa0JBQWtCQSxDQUFDM0MsVUFBa0IsRUFBRUMsYUFBcUIsRUFBRTJCLEtBQWEsRUFBaUI7SUFDaEcsSUFBSSxJQUFJLENBQUN0SCxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDcUksa0JBQWtCLENBQUMzQyxVQUFVLEVBQUVDLGFBQWEsRUFBRTJCLEtBQUssQ0FBQztJQUM1RyxJQUFJQSxLQUFLLEtBQUtyTSxTQUFTLEVBQUVxTSxLQUFLLEdBQUcsRUFBRTtJQUNuQyxPQUFPLElBQUksQ0FBQzlJLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsSUFBSSxDQUFDekIsTUFBTSxDQUFDOEosb0JBQW9CLENBQUMsSUFBSSxDQUFDOU4sVUFBVSxFQUFFa0wsVUFBVSxFQUFFQyxhQUFhLEVBQUUyQixLQUFLLENBQUM7SUFDckYsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTWlCLE1BQU1BLENBQUNDLEtBQXlDLEVBQTZCO0lBQ2pGLElBQUksSUFBSSxDQUFDeEksY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ3VJLE1BQU0sQ0FBQ0MsS0FBSyxDQUFDOztJQUVyRTtJQUNBLE1BQU1DLGVBQWUsR0FBR0QsS0FBSyxHQUFHRSxxQkFBWSxDQUFDQyxnQkFBZ0IsQ0FBQ0gsS0FBSyxDQUFDOztJQUVwRTtJQUNBLE9BQU8sSUFBSSxDQUFDaEssTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUl0QixPQUFPLENBQUMsQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7O1FBRXRDO1FBQ0EsSUFBSSxDQUFDTCxNQUFNLENBQUNvSyxPQUFPLENBQUMsSUFBSSxDQUFDcE8sVUFBVSxFQUFFeUUsSUFBSSxDQUFDQyxTQUFTLENBQUN1SixlQUFlLENBQUNJLFFBQVEsQ0FBQyxDQUFDLENBQUMxSixNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQzJKLGFBQWEsS0FBSzs7VUFFM0c7VUFDQSxJQUFJQSxhQUFhLENBQUNsRyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFO1lBQ25DL0QsTUFBTSxDQUFDLElBQUlqRCxvQkFBVyxDQUFDa04sYUFBYSxDQUFDLENBQUM7WUFDdEM7VUFDRjs7VUFFQTtVQUNBLElBQUk7WUFDRmxLLE9BQU8sQ0FBQ3hFLGdCQUFnQixDQUFDMk8sY0FBYyxDQUFDTixlQUFlLEVBQUVLLGFBQWEsQ0FBQyxDQUFDO1VBQzFFLENBQUMsQ0FBQyxPQUFPaEcsR0FBRyxFQUFFO1lBQ1pqRSxNQUFNLENBQUNpRSxHQUFHLENBQUM7VUFDYjtRQUNGLENBQUMsQ0FBQztNQUNKLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1rRyxZQUFZQSxDQUFDUixLQUFvQyxFQUE2QjtJQUNsRixJQUFJLElBQUksQ0FBQ3hJLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUNnSixZQUFZLENBQUNSLEtBQUssQ0FBQzs7SUFFM0U7SUFDQSxNQUFNQyxlQUFlLEdBQUdDLHFCQUFZLENBQUNPLHNCQUFzQixDQUFDVCxLQUFLLENBQUM7O0lBRWxFO0lBQ0EsT0FBTyxJQUFJLENBQUNoSyxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLE9BQU8sSUFBSXRCLE9BQU8sQ0FBQyxDQUFDQyxPQUFPLEVBQUVDLE1BQU0sS0FBSzs7UUFFdEM7UUFDQSxJQUFJLENBQUNMLE1BQU0sQ0FBQzBLLGFBQWEsQ0FBQyxJQUFJLENBQUMxTyxVQUFVLEVBQUV5RSxJQUFJLENBQUNDLFNBQVMsQ0FBQ3VKLGVBQWUsQ0FBQ1UsVUFBVSxDQUFDLENBQUMsQ0FBQ04sUUFBUSxDQUFDLENBQUMsQ0FBQzFKLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDMkosYUFBYSxLQUFLOztVQUU5SDtVQUNBLElBQUlBLGFBQWEsQ0FBQ2xHLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUU7WUFDbkMvRCxNQUFNLENBQUMsSUFBSWpELG9CQUFXLENBQUNrTixhQUFhLENBQUMsQ0FBQztZQUN0QztVQUNGOztVQUVBO1VBQ0EsSUFBSTtZQUNGbEssT0FBTyxDQUFDeEUsZ0JBQWdCLENBQUNnUCxvQkFBb0IsQ0FBQ1gsZUFBZSxFQUFFSyxhQUFhLENBQUMsQ0FBQztVQUNoRixDQUFDLENBQUMsT0FBT2hHLEdBQUcsRUFBRTtZQUNaakUsTUFBTSxDQUFDaUUsR0FBRyxDQUFDO1VBQ2I7UUFDRixDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNdUcsVUFBVUEsQ0FBQ2IsS0FBa0MsRUFBaUM7SUFDbEYsSUFBSSxJQUFJLENBQUN4SSxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDcUosVUFBVSxDQUFDYixLQUFLLENBQUM7O0lBRXpFO0lBQ0EsTUFBTUMsZUFBZSxHQUFHQyxxQkFBWSxDQUFDWSxvQkFBb0IsQ0FBQ2QsS0FBSyxDQUFDOztJQUVoRTtJQUNBLE9BQU8sSUFBSSxDQUFDaEssTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUl0QixPQUFPLENBQUMsQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUk7O1FBRXJDO1FBQ0EsSUFBSSxDQUFDTCxNQUFNLENBQUMrSyxXQUFXLENBQUMsSUFBSSxDQUFDL08sVUFBVSxFQUFFeUUsSUFBSSxDQUFDQyxTQUFTLENBQUN1SixlQUFlLENBQUNVLFVBQVUsQ0FBQyxDQUFDLENBQUNOLFFBQVEsQ0FBQyxDQUFDLENBQUMxSixNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQzJKLGFBQWEsS0FBSzs7VUFFNUg7VUFDQSxJQUFJQSxhQUFhLENBQUNsRyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFO1lBQ25DL0QsTUFBTSxDQUFDLElBQUlqRCxvQkFBVyxDQUFDa04sYUFBYSxDQUFDLENBQUM7WUFDdEM7VUFDRjs7VUFFQTtVQUNBLElBQUk7WUFDRmxLLE9BQU8sQ0FBQ3hFLGdCQUFnQixDQUFDb1Asa0JBQWtCLENBQUNmLGVBQWUsRUFBRUssYUFBYSxDQUFDLENBQUM7VUFDOUUsQ0FBQyxDQUFDLE9BQU9oRyxHQUFHLEVBQUU7WUFDWmpFLE1BQU0sQ0FBQ2lFLEdBQUcsQ0FBQztVQUNiO1FBQ0YsQ0FBQyxDQUFDO01BQ0osQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTTJHLGFBQWFBLENBQUNDLEdBQUcsR0FBRyxLQUFLLEVBQW1CO0lBQ2hELElBQUksSUFBSSxDQUFDMUosY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ3lKLGFBQWEsQ0FBQ0MsR0FBRyxDQUFDO0lBQzFFLE9BQU8sSUFBSSxDQUFDbEwsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUl0QixPQUFPLENBQUMsQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7UUFDdEMsSUFBSSxDQUFDTCxNQUFNLENBQUNtTCxjQUFjLENBQUMsSUFBSSxDQUFDblAsVUFBVSxFQUFFa1AsR0FBRyxFQUFFLENBQUNFLFVBQVUsS0FBS2hMLE9BQU8sQ0FBQ2dMLFVBQVUsQ0FBQyxDQUFDO01BQ3ZGLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1DLGFBQWFBLENBQUNELFVBQWtCLEVBQW1CO0lBQ3ZELElBQUksSUFBSSxDQUFDNUosY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQzZKLGFBQWEsQ0FBQ0QsVUFBVSxDQUFDO0lBQ2pGLE9BQU8sSUFBSSxDQUFDcEwsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUl0QixPQUFPLENBQUMsQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7UUFDdEMsSUFBSSxDQUFDTCxNQUFNLENBQUNzTCxjQUFjLENBQUMsSUFBSSxDQUFDdFAsVUFBVSxFQUFFb1AsVUFBVSxFQUFFLENBQUNHLFdBQVcsS0FBS25MLE9BQU8sQ0FBQ21MLFdBQVcsQ0FBQyxDQUFDO01BQ2hHLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1DLGVBQWVBLENBQUNOLEdBQUcsR0FBRyxLQUFLLEVBQTZCO0lBQzVELElBQUksSUFBSSxDQUFDMUosY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ2dLLGVBQWUsQ0FBQ04sR0FBRyxDQUFDO0lBQzVFLE9BQU8sSUFBSSxDQUFDbEwsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUl0QixPQUFPLENBQUMsQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7UUFDdEMsSUFBSSxDQUFDTCxNQUFNLENBQUN5TCxpQkFBaUIsQ0FBQyxJQUFJLENBQUN6UCxVQUFVLEVBQUVrUCxHQUFHLEVBQUUsQ0FBQ1EsWUFBWSxLQUFLO1VBQ3BFLElBQUlBLFlBQVksQ0FBQ3RILE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUUvRCxNQUFNLENBQUMsSUFBSWpELG9CQUFXLENBQUNzTyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7VUFDM0UsSUFBSUMsU0FBUyxHQUFHLEVBQUU7VUFDbEIsS0FBSyxJQUFJQyxZQUFZLElBQUluTCxJQUFJLENBQUNTLEtBQUssQ0FBQ1osaUJBQVEsQ0FBQ21ILGdCQUFnQixDQUFDaUUsWUFBWSxDQUFDLENBQUMsQ0FBQ0MsU0FBUyxFQUFFQSxTQUFTLENBQUNuSixJQUFJLENBQUMsSUFBSXFKLHVCQUFjLENBQUNELFlBQVksQ0FBQyxDQUFDO1VBQ3hJeEwsT0FBTyxDQUFDdUwsU0FBUyxDQUFDO1FBQ3BCLENBQUMsQ0FBQztNQUNKLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1HLGVBQWVBLENBQUNILFNBQTJCLEVBQXVDO0lBQ3RGLElBQUksSUFBSSxDQUFDbkssY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ3NLLGVBQWUsQ0FBQ0gsU0FBUyxDQUFDO0lBQ2xGLE9BQU8sSUFBSSxDQUFDM0wsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUl0QixPQUFPLENBQUMsQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7UUFDdEMsSUFBSSxDQUFDTCxNQUFNLENBQUMrTCxpQkFBaUIsQ0FBQyxJQUFJLENBQUMvUCxVQUFVLEVBQUV5RSxJQUFJLENBQUNDLFNBQVMsQ0FBQyxFQUFDaUwsU0FBUyxFQUFFQSxTQUFTLENBQUNLLEdBQUcsQ0FBQyxDQUFBQyxRQUFRLEtBQUlBLFFBQVEsQ0FBQ3RMLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDLEVBQUUsQ0FBQ3VMLHVCQUF1QixLQUFLO1VBQ3JKOUwsT0FBTyxDQUFDLElBQUkrTCxtQ0FBMEIsQ0FBQzFMLElBQUksQ0FBQ1MsS0FBSyxDQUFDWixpQkFBUSxDQUFDbUgsZ0JBQWdCLENBQUN5RSx1QkFBdUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6RyxDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNRSw2QkFBNkJBLENBQUEsRUFBOEI7SUFDL0QsSUFBSSxJQUFJLENBQUM1SyxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDNEssNkJBQTZCLENBQUMsQ0FBQztJQUN2RixNQUFNLElBQUloUCxvQkFBVyxDQUFDLGlCQUFpQixDQUFDO0VBQzFDOztFQUVBLE1BQU1pUCxZQUFZQSxDQUFDSixRQUFnQixFQUFpQjtJQUNsRCxJQUFJLElBQUksQ0FBQ3pLLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUM2SyxZQUFZLENBQUNKLFFBQVEsQ0FBQztJQUM5RSxJQUFJLENBQUNBLFFBQVEsRUFBRSxNQUFNLElBQUk3TyxvQkFBVyxDQUFDLGtDQUFrQyxDQUFDO0lBQ3hFLE9BQU8sSUFBSSxDQUFDNEMsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUl0QixPQUFPLENBQU8sQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7UUFDNUMsSUFBSSxDQUFDTCxNQUFNLENBQUNzTSxhQUFhLENBQUMsSUFBSSxDQUFDdFEsVUFBVSxFQUFFaVEsUUFBUSxFQUFFLE1BQU03TCxPQUFPLENBQUMsQ0FBQyxDQUFDO01BQ3ZFLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1tTSxVQUFVQSxDQUFDTixRQUFnQixFQUFpQjtJQUNoRCxJQUFJLElBQUksQ0FBQ3pLLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUMrSyxVQUFVLENBQUNOLFFBQVEsQ0FBQztJQUM1RSxJQUFJLENBQUNBLFFBQVEsRUFBRSxNQUFNLElBQUk3TyxvQkFBVyxDQUFDLGdDQUFnQyxDQUFDO0lBQ3RFLE9BQU8sSUFBSSxDQUFDNEMsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUl0QixPQUFPLENBQU8sQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7UUFDNUMsSUFBSSxDQUFDTCxNQUFNLENBQUN3TSxXQUFXLENBQUMsSUFBSSxDQUFDeFEsVUFBVSxFQUFFaVEsUUFBUSxFQUFFLE1BQU03TCxPQUFPLENBQUMsQ0FBQyxDQUFDO01BQ3JFLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1xTSxjQUFjQSxDQUFDUixRQUFnQixFQUFvQjtJQUN2RCxJQUFJLElBQUksQ0FBQ3pLLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUNpTCxjQUFjLENBQUNSLFFBQVEsQ0FBQztJQUNoRixJQUFJLENBQUNBLFFBQVEsRUFBRSxNQUFNLElBQUk3TyxvQkFBVyxDQUFDLDJDQUEyQyxDQUFDO0lBQ2pGLE9BQU8sSUFBSSxDQUFDNEMsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUl0QixPQUFPLENBQUMsQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7UUFDdEMsSUFBSSxDQUFDTCxNQUFNLENBQUMwTSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMxUSxVQUFVLEVBQUVpUSxRQUFRLEVBQUUsQ0FBQy9ILE1BQU0sS0FBSzlELE9BQU8sQ0FBQzhELE1BQU0sQ0FBQyxDQUFDO01BQ3RGLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU15SSxTQUFTQSxDQUFDbFAsTUFBK0IsRUFBNkI7SUFDMUUsSUFBSSxJQUFJLENBQUMrRCxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDbUwsU0FBUyxDQUFDbFAsTUFBTSxDQUFDOztJQUV6RTtJQUNBLE1BQU1tUCxnQkFBZ0IsR0FBRzFDLHFCQUFZLENBQUMyQyx3QkFBd0IsQ0FBQ3BQLE1BQU0sQ0FBQztJQUN0RSxJQUFJbVAsZ0JBQWdCLENBQUNFLFdBQVcsQ0FBQyxDQUFDLEtBQUtyUSxTQUFTLEVBQUVtUSxnQkFBZ0IsQ0FBQ0csV0FBVyxDQUFDLElBQUksQ0FBQzs7SUFFcEY7SUFDQSxPQUFPLElBQUksQ0FBQy9NLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLOztRQUV0QztRQUNBLElBQUksQ0FBQ0wsTUFBTSxDQUFDZ04sVUFBVSxDQUFDLElBQUksQ0FBQ2hSLFVBQVUsRUFBRXlFLElBQUksQ0FBQ0MsU0FBUyxDQUFDa00sZ0JBQWdCLENBQUNqTSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQ3NNLFlBQVksS0FBSztVQUNuRyxJQUFJQSxZQUFZLENBQUM3SSxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFL0QsTUFBTSxDQUFDLElBQUlqRCxvQkFBVyxDQUFDNlAsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1VBQUEsS0FDdEU3TSxPQUFPLENBQUMsSUFBSThNLG9CQUFXLENBQUN6TSxJQUFJLENBQUNTLEtBQUssQ0FBQ1osaUJBQVEsQ0FBQ21ILGdCQUFnQixDQUFDd0YsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDbEQsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUM3RixDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNb0QsV0FBV0EsQ0FBQzFQLE1BQStCLEVBQTJCO0lBQzFFLElBQUksSUFBSSxDQUFDK0QsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQzJMLFdBQVcsQ0FBQzFQLE1BQU0sQ0FBQzs7SUFFM0U7SUFDQSxNQUFNbVAsZ0JBQWdCLEdBQUcxQyxxQkFBWSxDQUFDa0QsMEJBQTBCLENBQUMzUCxNQUFNLENBQUM7O0lBRXhFO0lBQ0EsT0FBTyxJQUFJLENBQUN1QyxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLE9BQU8sSUFBSXRCLE9BQU8sQ0FBQyxDQUFDQyxPQUFPLEVBQUVDLE1BQU0sS0FBSzs7UUFFdEM7UUFDQSxJQUFJLENBQUNMLE1BQU0sQ0FBQ3FOLFlBQVksQ0FBQyxJQUFJLENBQUNyUixVQUFVLEVBQUV5RSxJQUFJLENBQUNDLFNBQVMsQ0FBQ2tNLGdCQUFnQixDQUFDak0sTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUNzTSxZQUFZLEtBQUs7VUFDckcsSUFBSUEsWUFBWSxDQUFDN0ksTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRS9ELE1BQU0sQ0FBQyxJQUFJakQsb0JBQVcsQ0FBQzZQLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztVQUFBLEtBQ3RFN00sT0FBTyxDQUFDLElBQUk4TSxvQkFBVyxDQUFDek0sSUFBSSxDQUFDUyxLQUFLLENBQUNaLGlCQUFRLENBQUNtSCxnQkFBZ0IsQ0FBQ3dGLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQ2xELE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEcsQ0FBQyxDQUFDO01BQ0osQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTXVELGFBQWFBLENBQUM3UCxNQUErQixFQUE2QjtJQUM5RSxJQUFJLElBQUksQ0FBQytELGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUM4TCxhQUFhLENBQUM3UCxNQUFNLENBQUM7O0lBRTdFO0lBQ0EsTUFBTW1QLGdCQUFnQixHQUFHMUMscUJBQVksQ0FBQ3FELDRCQUE0QixDQUFDOVAsTUFBTSxDQUFDOztJQUUxRTtJQUNBLE9BQU8sSUFBSSxDQUFDdUMsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUl0QixPQUFPLENBQUMsQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7O1FBRXRDO1FBQ0EsSUFBSSxDQUFDTCxNQUFNLENBQUN3TixjQUFjLENBQUMsSUFBSSxDQUFDeFIsVUFBVSxFQUFFeUUsSUFBSSxDQUFDQyxTQUFTLENBQUNrTSxnQkFBZ0IsQ0FBQ2pNLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDOE0sVUFBVSxLQUFLO1VBQ3JHLElBQUlBLFVBQVUsQ0FBQ3JKLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUUvRCxNQUFNLENBQUMsSUFBSWpELG9CQUFXLENBQUNxUSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7VUFBQSxLQUNsRTtZQUNILElBQUlDLE1BQU0sR0FBRyxFQUFFO1lBQ2YsS0FBSyxJQUFJQyxTQUFTLElBQUlsTixJQUFJLENBQUNTLEtBQUssQ0FBQ1osaUJBQVEsQ0FBQ21ILGdCQUFnQixDQUFDZ0csVUFBVSxDQUFDLENBQUMsQ0FBQ0MsTUFBTSxFQUFFQSxNQUFNLENBQUNsTCxJQUFJLENBQUMsSUFBSTBLLG9CQUFXLENBQUNTLFNBQVMsQ0FBQyxDQUFDO1lBQ3ZILElBQUlDLEdBQUcsR0FBRyxFQUFFO1lBQ1osS0FBSyxJQUFJQyxLQUFLLElBQUlILE1BQU0sRUFBRSxLQUFLLElBQUlJLEVBQUUsSUFBSUQsS0FBSyxDQUFDOUQsTUFBTSxDQUFDLENBQUMsRUFBRTZELEdBQUcsQ0FBQ3BMLElBQUksQ0FBQ3NMLEVBQUUsQ0FBQztZQUNyRTFOLE9BQU8sQ0FBQ3dOLEdBQUcsQ0FBQztVQUNkO1FBQ0YsQ0FBQyxDQUFDO01BQ0osQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTUcsU0FBU0EsQ0FBQ0MsS0FBZSxFQUE2QjtJQUMxRCxJQUFJLElBQUksQ0FBQ3hNLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUN1TSxTQUFTLENBQUNDLEtBQUssQ0FBQztJQUN4RSxPQUFPLElBQUksQ0FBQ2hPLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLOztRQUV0QztRQUNBLElBQUksQ0FBQ0wsTUFBTSxDQUFDaU8sVUFBVSxDQUFDLElBQUksQ0FBQ2pTLFVBQVUsRUFBRWdTLEtBQUssRUFBRSxDQUFDZixZQUFZLEtBQUs7VUFDL0QsSUFBSUEsWUFBWSxDQUFDN0ksTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRS9ELE1BQU0sQ0FBQyxJQUFJakQsb0JBQVcsQ0FBQzZQLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztVQUFBLEtBQ3RFO1lBQ0gsSUFBSVksS0FBSyxHQUFHLElBQUlYLG9CQUFXLENBQUN6TSxJQUFJLENBQUNTLEtBQUssQ0FBQ1osaUJBQVEsQ0FBQ21ILGdCQUFnQixDQUFDd0YsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUNoRixJQUFJWSxLQUFLLENBQUM5RCxNQUFNLENBQUMsQ0FBQyxLQUFLdE4sU0FBUyxFQUFFb1IsS0FBSyxDQUFDSyxNQUFNLENBQUMsRUFBRSxDQUFDO1lBQ2xEOU4sT0FBTyxDQUFDeU4sS0FBSyxDQUFDOUQsTUFBTSxDQUFDLENBQUMsQ0FBQztVQUN6QjtRQUNGLENBQUMsQ0FBQztNQUNKLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1vRSxRQUFRQSxDQUFDQyxjQUEyQyxFQUFxQjtJQUM3RSxJQUFJLElBQUksQ0FBQzVNLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUMyTSxRQUFRLENBQUNDLGNBQWMsQ0FBQztJQUNoRixJQUFBalIsZUFBTSxFQUFDa1IsS0FBSyxDQUFDQyxPQUFPLENBQUNGLGNBQWMsQ0FBQyxFQUFFLHlEQUF5RCxDQUFDO0lBQ2hHLElBQUlHLFdBQVcsR0FBRyxFQUFFO0lBQ3BCLEtBQUssSUFBSUMsWUFBWSxJQUFJSixjQUFjLEVBQUVHLFdBQVcsQ0FBQy9MLElBQUksQ0FBQ2dNLFlBQVksWUFBWUMsdUJBQWMsR0FBR0QsWUFBWSxDQUFDRSxXQUFXLENBQUMsQ0FBQyxHQUFHRixZQUFZLENBQUM7SUFDN0ksT0FBTyxJQUFJLENBQUN4TyxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLE9BQU8sSUFBSXRCLE9BQU8sQ0FBQyxDQUFDQyxPQUFPLEVBQUVDLE1BQU0sS0FBSztRQUN0QyxJQUFJLENBQUNMLE1BQU0sQ0FBQzJPLFNBQVMsQ0FBQyxJQUFJLENBQUMzUyxVQUFVLEVBQUV5RSxJQUFJLENBQUNDLFNBQVMsQ0FBQyxFQUFDNk4sV0FBVyxFQUFFQSxXQUFXLEVBQUMsQ0FBQyxFQUFFLENBQUNLLFlBQVksS0FBSztVQUNuRyxJQUFJQSxZQUFZLENBQUN4SyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFL0QsTUFBTSxDQUFDLElBQUlqRCxvQkFBVyxDQUFDd1IsWUFBWSxDQUFDLENBQUMsQ0FBQztVQUNyRXhPLE9BQU8sQ0FBQ0ssSUFBSSxDQUFDUyxLQUFLLENBQUMwTixZQUFZLENBQUMsQ0FBQ2pJLFFBQVEsQ0FBQztRQUNqRCxDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNa0ksYUFBYUEsQ0FBQ2hCLEtBQWtCLEVBQXdCO0lBQzVELElBQUksSUFBSSxDQUFDck0sY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ3FOLGFBQWEsQ0FBQ2hCLEtBQUssQ0FBQztJQUM1RSxPQUFPLElBQUksQ0FBQzdOLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEJvTSxLQUFLLEdBQUcsSUFBSVgsb0JBQVcsQ0FBQyxFQUFDNEIsYUFBYSxFQUFFakIsS0FBSyxDQUFDa0IsZ0JBQWdCLENBQUMsQ0FBQyxFQUFFQyxXQUFXLEVBQUVuQixLQUFLLENBQUNvQixjQUFjLENBQUMsQ0FBQyxFQUFFQyxhQUFhLEVBQUVyQixLQUFLLENBQUNzQixnQkFBZ0IsQ0FBQyxDQUFDLEVBQUMsQ0FBQztNQUNoSixJQUFJLENBQUUsT0FBTyxJQUFJakMsb0JBQVcsQ0FBQ3pNLElBQUksQ0FBQ1MsS0FBSyxDQUFDWixpQkFBUSxDQUFDbUgsZ0JBQWdCLENBQUMsSUFBSSxDQUFDekgsTUFBTSxDQUFDb1AsZUFBZSxDQUFDLElBQUksQ0FBQ3BULFVBQVUsRUFBRXlFLElBQUksQ0FBQ0MsU0FBUyxDQUFDbU4sS0FBSyxDQUFDbE4sTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUU7TUFDbkosT0FBTzJELEdBQUcsRUFBRSxDQUFFLE1BQU0sSUFBSWxILG9CQUFXLENBQUMsSUFBSSxDQUFDNEMsTUFBTSxDQUFDcVAscUJBQXFCLENBQUMvSyxHQUFHLENBQUMsQ0FBQyxDQUFFO0lBQy9FLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1nTCxPQUFPQSxDQUFDUixhQUFxQixFQUF3QjtJQUN6RCxJQUFJLElBQUksQ0FBQ3ROLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUM4TixPQUFPLENBQUNSLGFBQWEsQ0FBQztJQUM5RSxPQUFPLElBQUksQ0FBQzlPLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsSUFBSSxDQUFFLE9BQU8sSUFBSXlMLG9CQUFXLENBQUN6TSxJQUFJLENBQUNTLEtBQUssQ0FBQ1osaUJBQVEsQ0FBQ21ILGdCQUFnQixDQUFDLElBQUksQ0FBQ3pILE1BQU0sQ0FBQ3VQLFFBQVEsQ0FBQyxJQUFJLENBQUN2VCxVQUFVLEVBQUU4UyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRTtNQUMzSCxPQUFPeEssR0FBRyxFQUFFLENBQUUsTUFBTSxJQUFJbEgsb0JBQVcsQ0FBQyxJQUFJLENBQUM0QyxNQUFNLENBQUNxUCxxQkFBcUIsQ0FBQy9LLEdBQUcsQ0FBQyxDQUFDLENBQUU7SUFDL0UsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTWtMLFNBQVNBLENBQUNSLFdBQW1CLEVBQXFCO0lBQ3RELElBQUksSUFBSSxDQUFDeE4sY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ2dPLFNBQVMsQ0FBQ1IsV0FBVyxDQUFDO0lBQzlFLE9BQU8sSUFBSSxDQUFDaFAsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUl0QixPQUFPLENBQUMsQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7UUFDdEMsSUFBSSxDQUFDTCxNQUFNLENBQUN5UCxVQUFVLENBQUMsSUFBSSxDQUFDelQsVUFBVSxFQUFFZ1QsV0FBVyxFQUFFLENBQUNyTixJQUFJLEtBQUs7VUFDN0QsSUFBSUEsSUFBSSxDQUFDeUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRS9ELE1BQU0sQ0FBQyxJQUFJakQsb0JBQVcsQ0FBQ3VFLElBQUksQ0FBQyxDQUFDLENBQUM7VUFDckR2QixPQUFPLENBQUNLLElBQUksQ0FBQ1MsS0FBSyxDQUFDUyxJQUFJLENBQUMsQ0FBQ2dGLFFBQVEsQ0FBQztRQUN6QyxDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNK0ksV0FBV0EsQ0FBQ25MLE9BQWUsRUFBRW9MLGFBQWEsR0FBR0MsbUNBQTBCLENBQUNDLG1CQUFtQixFQUFFM0ksVUFBVSxHQUFHLENBQUMsRUFBRUMsYUFBYSxHQUFHLENBQUMsRUFBbUI7SUFDckosSUFBSSxJQUFJLENBQUMzRixjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDa08sV0FBVyxDQUFDbkwsT0FBTyxFQUFFb0wsYUFBYSxFQUFFekksVUFBVSxFQUFFQyxhQUFhLENBQUM7O0lBRXRIO0lBQ0F3SSxhQUFhLEdBQUdBLGFBQWEsSUFBSUMsbUNBQTBCLENBQUNDLG1CQUFtQjtJQUMvRTNJLFVBQVUsR0FBR0EsVUFBVSxJQUFJLENBQUM7SUFDNUJDLGFBQWEsR0FBR0EsYUFBYSxJQUFJLENBQUM7O0lBRWxDO0lBQ0EsT0FBTyxJQUFJLENBQUNuSCxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLElBQUksQ0FBRSxPQUFPLElBQUksQ0FBQ3pCLE1BQU0sQ0FBQzhQLFlBQVksQ0FBQyxJQUFJLENBQUM5VCxVQUFVLEVBQUV1SSxPQUFPLEVBQUVvTCxhQUFhLEtBQUtDLG1DQUEwQixDQUFDQyxtQkFBbUIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFM0ksVUFBVSxFQUFFQyxhQUFhLENBQUMsQ0FBRTtNQUN0SyxPQUFPN0MsR0FBRyxFQUFFLENBQUUsTUFBTSxJQUFJbEgsb0JBQVcsQ0FBQyxJQUFJLENBQUM0QyxNQUFNLENBQUNxUCxxQkFBcUIsQ0FBQy9LLEdBQUcsQ0FBQyxDQUFDLENBQUU7SUFDL0UsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTXlMLGFBQWFBLENBQUN4TCxPQUFlLEVBQUV5TCxPQUFlLEVBQUVDLFNBQWlCLEVBQXlDO0lBQzlHLElBQUksSUFBSSxDQUFDek8sY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ3VPLGFBQWEsQ0FBQ3hMLE9BQU8sRUFBRXlMLE9BQU8sRUFBRUMsU0FBUyxDQUFDO0lBQ2xHLE9BQU8sSUFBSSxDQUFDalEsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixJQUFJeUMsTUFBTTtNQUNWLElBQUk7UUFDRkEsTUFBTSxHQUFHekQsSUFBSSxDQUFDUyxLQUFLLENBQUMsSUFBSSxDQUFDbEIsTUFBTSxDQUFDa1EsY0FBYyxDQUFDLElBQUksQ0FBQ2xVLFVBQVUsRUFBRXVJLE9BQU8sRUFBRXlMLE9BQU8sRUFBRUMsU0FBUyxDQUFDLENBQUM7TUFDL0YsQ0FBQyxDQUFDLE9BQU8zTCxHQUFHLEVBQUU7UUFDWkosTUFBTSxHQUFHLEVBQUNpTSxNQUFNLEVBQUUsS0FBSyxFQUFDO01BQzFCO01BQ0EsT0FBTyxJQUFJQyxxQ0FBNEIsQ0FBQ2xNLE1BQU0sQ0FBQ2lNLE1BQU07TUFDbkQsRUFBQ0EsTUFBTSxFQUFFak0sTUFBTSxDQUFDaU0sTUFBTSxFQUFFRSxLQUFLLEVBQUVuTSxNQUFNLENBQUNtTSxLQUFLLEVBQUVWLGFBQWEsRUFBRXpMLE1BQU0sQ0FBQ3lMLGFBQWEsS0FBSyxPQUFPLEdBQUdDLG1DQUEwQixDQUFDQyxtQkFBbUIsR0FBR0QsbUNBQTBCLENBQUNVLGtCQUFrQixFQUFFQyxPQUFPLEVBQUVyTSxNQUFNLENBQUNxTSxPQUFPLEVBQUM7TUFDdk4sRUFBQ0osTUFBTSxFQUFFLEtBQUs7TUFDaEIsQ0FBQztJQUNILENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1LLFFBQVFBLENBQUNDLE1BQWMsRUFBbUI7SUFDOUMsSUFBSSxJQUFJLENBQUNqUCxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDZ1AsUUFBUSxDQUFDQyxNQUFNLENBQUM7SUFDeEUsT0FBTyxJQUFJLENBQUN6USxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLElBQUksQ0FBRSxPQUFPLElBQUksQ0FBQ3pCLE1BQU0sQ0FBQzBRLFVBQVUsQ0FBQyxJQUFJLENBQUMxVSxVQUFVLEVBQUV5VSxNQUFNLENBQUMsQ0FBRTtNQUM5RCxPQUFPbk0sR0FBRyxFQUFFLENBQUUsTUFBTSxJQUFJbEgsb0JBQVcsQ0FBQyxJQUFJLENBQUM0QyxNQUFNLENBQUNxUCxxQkFBcUIsQ0FBQy9LLEdBQUcsQ0FBQyxDQUFDLENBQUU7SUFDL0UsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTXFNLFVBQVVBLENBQUNGLE1BQWMsRUFBRUcsS0FBYSxFQUFFWixPQUFlLEVBQTBCO0lBQ3ZGLElBQUksSUFBSSxDQUFDeE8sY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ21QLFVBQVUsQ0FBQ0YsTUFBTSxFQUFFRyxLQUFLLEVBQUVaLE9BQU8sQ0FBQztJQUMxRixPQUFPLElBQUksQ0FBQ2hRLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLO1FBQ3RDLElBQUksQ0FBQ0wsTUFBTSxDQUFDNlEsWUFBWSxDQUFDLElBQUksQ0FBQzdVLFVBQVUsRUFBRXlVLE1BQU0sRUFBRUcsS0FBSyxFQUFFWixPQUFPLEVBQUUsQ0FBQ2MsV0FBVyxLQUFLO1VBQ2pGLElBQUlBLFdBQVcsQ0FBQzFNLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUUvRCxNQUFNLENBQUMsSUFBSWpELG9CQUFXLENBQUMwVCxXQUFXLENBQUMsQ0FBQyxDQUFDO1VBQ25FMVEsT0FBTyxDQUFDLElBQUkyUSxzQkFBYSxDQUFDdFEsSUFBSSxDQUFDUyxLQUFLLENBQUNaLGlCQUFRLENBQUNtSCxnQkFBZ0IsQ0FBQ3FKLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyRixDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNRSxVQUFVQSxDQUFDUCxNQUFjLEVBQUVULE9BQWUsRUFBRXpMLE9BQWdCLEVBQW1CO0lBQ25GLElBQUksSUFBSSxDQUFDL0MsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ3dQLFVBQVUsQ0FBQ1AsTUFBTSxFQUFFVCxPQUFPLEVBQUV6TCxPQUFPLENBQUM7SUFDNUYsT0FBTyxJQUFJLENBQUN2RSxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLE9BQU8sSUFBSXRCLE9BQU8sQ0FBQyxDQUFDQyxPQUFPLEVBQUVDLE1BQU0sS0FBSztRQUN0QyxJQUFJLENBQUNMLE1BQU0sQ0FBQ2lSLFlBQVksQ0FBQyxJQUFJLENBQUNqVixVQUFVLEVBQUV5VSxNQUFNLElBQUksRUFBRSxFQUFFVCxPQUFPLElBQUksRUFBRSxFQUFFekwsT0FBTyxJQUFJLEVBQUUsRUFBRSxDQUFDMEwsU0FBUyxLQUFLO1VBQ25HLElBQUlpQixRQUFRLEdBQUcsU0FBUztVQUN4QixJQUFJakIsU0FBUyxDQUFDck4sT0FBTyxDQUFDc08sUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFN1EsTUFBTSxDQUFDLElBQUlqRCxvQkFBVyxDQUFDNlMsU0FBUyxDQUFDa0IsU0FBUyxDQUFDRCxRQUFRLENBQUNFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztVQUNoR2hSLE9BQU8sQ0FBQzZQLFNBQVMsQ0FBQztRQUN6QixDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNb0IsWUFBWUEsQ0FBQ1osTUFBYyxFQUFFVCxPQUFlLEVBQUV6TCxPQUEyQixFQUFFMEwsU0FBaUIsRUFBMEI7SUFDMUgsSUFBSSxJQUFJLENBQUN6TyxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDNlAsWUFBWSxDQUFDWixNQUFNLEVBQUVULE9BQU8sRUFBRXpMLE9BQU8sRUFBRTBMLFNBQVMsQ0FBQztJQUN6RyxPQUFPLElBQUksQ0FBQ2pRLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLO1FBQ3RDLElBQUksQ0FBQ0wsTUFBTSxDQUFDc1IsY0FBYyxDQUFDLElBQUksQ0FBQ3RWLFVBQVUsRUFBRXlVLE1BQU0sSUFBSSxFQUFFLEVBQUVULE9BQU8sSUFBSSxFQUFFLEVBQUV6TCxPQUFPLElBQUksRUFBRSxFQUFFMEwsU0FBUyxJQUFJLEVBQUUsRUFBRSxDQUFDYSxXQUFXLEtBQUs7VUFDeEgsSUFBSUEsV0FBVyxDQUFDMU0sTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRS9ELE1BQU0sQ0FBQyxJQUFJakQsb0JBQVcsQ0FBQzBULFdBQVcsQ0FBQyxDQUFDLENBQUM7VUFDbkUxUSxPQUFPLENBQUMsSUFBSTJRLHNCQUFhLENBQUN0USxJQUFJLENBQUNTLEtBQUssQ0FBQ1osaUJBQVEsQ0FBQ21ILGdCQUFnQixDQUFDcUosV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JGLENBQUMsQ0FBQztNQUNKLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1TLGFBQWFBLENBQUNkLE1BQWMsRUFBRWxNLE9BQWdCLEVBQW1CO0lBQ3JFLElBQUksSUFBSSxDQUFDL0MsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQytQLGFBQWEsQ0FBQ2QsTUFBTSxFQUFFbE0sT0FBTyxDQUFDO0lBQ3RGLE9BQU8sSUFBSSxDQUFDdkUsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUl0QixPQUFPLENBQUMsQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7UUFDdEMsSUFBSSxDQUFDTCxNQUFNLENBQUN3UixlQUFlLENBQUMsSUFBSSxDQUFDeFYsVUFBVSxFQUFFeVUsTUFBTSxJQUFJLEVBQUUsRUFBRWxNLE9BQU8sSUFBSSxFQUFFLEVBQUUsQ0FBQzBMLFNBQVMsS0FBSztVQUN2RixJQUFJaUIsUUFBUSxHQUFHLFNBQVM7VUFDeEIsSUFBSWpCLFNBQVMsQ0FBQ3JOLE9BQU8sQ0FBQ3NPLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRTdRLE1BQU0sQ0FBQyxJQUFJakQsb0JBQVcsQ0FBQzZTLFNBQVMsQ0FBQ2tCLFNBQVMsQ0FBQ0QsUUFBUSxDQUFDRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7VUFDaEdoUixPQUFPLENBQUM2UCxTQUFTLENBQUM7UUFDekIsQ0FBQyxDQUFDO01BQ0osQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTXdCLGVBQWVBLENBQUNoQixNQUFjLEVBQUVsTSxPQUEyQixFQUFFMEwsU0FBaUIsRUFBb0I7SUFDdEcsSUFBSSxJQUFJLENBQUN6TyxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDaVEsZUFBZSxDQUFDaEIsTUFBTSxFQUFFbE0sT0FBTyxFQUFFMEwsU0FBUyxDQUFDO0lBQ25HLE9BQU8sSUFBSSxDQUFDalEsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUl0QixPQUFPLENBQUMsQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7UUFDdEMsSUFBSSxDQUFDTCxNQUFNLENBQUMwUixpQkFBaUIsQ0FBQyxJQUFJLENBQUMxVixVQUFVLEVBQUV5VSxNQUFNLElBQUksRUFBRSxFQUFFbE0sT0FBTyxJQUFJLEVBQUUsRUFBRTBMLFNBQVMsSUFBSSxFQUFFLEVBQUUsQ0FBQ3RPLElBQUksS0FBSztVQUNyRyxPQUFPQSxJQUFJLEtBQUssUUFBUSxHQUFHdEIsTUFBTSxDQUFDLElBQUlqRCxvQkFBVyxDQUFDdUUsSUFBSSxDQUFDLENBQUMsR0FBR3ZCLE9BQU8sQ0FBQ3VCLElBQUksQ0FBQztRQUMxRSxDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNZ1EscUJBQXFCQSxDQUFDcE4sT0FBZ0IsRUFBbUI7SUFDN0QsSUFBSSxJQUFJLENBQUMvQyxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDbVEscUJBQXFCLENBQUNwTixPQUFPLENBQUM7SUFDdEYsT0FBTyxJQUFJLENBQUN2RSxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLE9BQU8sSUFBSXRCLE9BQU8sQ0FBQyxDQUFDQyxPQUFPLEVBQUVDLE1BQU0sS0FBSztRQUN0QyxJQUFJLENBQUNMLE1BQU0sQ0FBQzRSLHdCQUF3QixDQUFDLElBQUksQ0FBQzVWLFVBQVUsRUFBRXVJLE9BQU8sRUFBRSxDQUFDMEwsU0FBUyxLQUFLO1VBQzVFLElBQUlpQixRQUFRLEdBQUcsU0FBUztVQUN4QixJQUFJakIsU0FBUyxDQUFDck4sT0FBTyxDQUFDc08sUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFN1EsTUFBTSxDQUFDLElBQUlqRCxvQkFBVyxDQUFDNlMsU0FBUyxDQUFDa0IsU0FBUyxDQUFDRCxRQUFRLENBQUNFLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztVQUNwR2hSLE9BQU8sQ0FBQzZQLFNBQVMsQ0FBQztRQUN6QixDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNNEIsc0JBQXNCQSxDQUFDM0ssVUFBa0IsRUFBRTRLLE1BQWMsRUFBRXZOLE9BQWdCLEVBQW1CO0lBQ2xHLElBQUksSUFBSSxDQUFDL0MsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ3FRLHNCQUFzQixDQUFDM0ssVUFBVSxFQUFFNEssTUFBTSxFQUFFdk4sT0FBTyxDQUFDO0lBQzNHLE9BQU8sSUFBSSxDQUFDdkUsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUl0QixPQUFPLENBQUMsQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7UUFDdEMsSUFBSSxDQUFDTCxNQUFNLENBQUMrUix5QkFBeUIsQ0FBQyxJQUFJLENBQUMvVixVQUFVLEVBQUVrTCxVQUFVLEVBQUU0SyxNQUFNLENBQUNFLFFBQVEsQ0FBQyxDQUFDLEVBQUV6TixPQUFPLEVBQUUsQ0FBQzBMLFNBQVMsS0FBSztVQUM1RyxJQUFJaUIsUUFBUSxHQUFHLFNBQVM7VUFDeEIsSUFBSWpCLFNBQVMsQ0FBQ3JOLE9BQU8sQ0FBQ3NPLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRTdRLE1BQU0sQ0FBQyxJQUFJakQsb0JBQVcsQ0FBQzZTLFNBQVMsQ0FBQ2tCLFNBQVMsQ0FBQ0QsUUFBUSxDQUFDRSxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7VUFDcEdoUixPQUFPLENBQUM2UCxTQUFTLENBQUM7UUFDekIsQ0FBQyxDQUFDO01BQ0osQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTWdDLGlCQUFpQkEsQ0FBQ2pDLE9BQWUsRUFBRXpMLE9BQTJCLEVBQUUwTCxTQUFpQixFQUErQjtJQUNwSCxJQUFJLElBQUksQ0FBQ3pPLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUN5USxpQkFBaUIsQ0FBQ2pDLE9BQU8sRUFBRXpMLE9BQU8sRUFBRTBMLFNBQVMsQ0FBQztJQUN0RyxPQUFPLElBQUksQ0FBQ2pRLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLO1FBQ3RDLElBQUksQ0FBQ0wsTUFBTSxDQUFDa1MsbUJBQW1CLENBQUMsSUFBSSxDQUFDbFcsVUFBVSxFQUFFZ1UsT0FBTyxFQUFFekwsT0FBTyxFQUFFMEwsU0FBUyxFQUFFLENBQUNhLFdBQVcsS0FBSztVQUM3RixJQUFJQSxXQUFXLENBQUMxTSxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFL0QsTUFBTSxDQUFDLElBQUlqRCxvQkFBVyxDQUFDMFQsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztVQUN2RTFRLE9BQU8sQ0FBQyxJQUFJK1IsMkJBQWtCLENBQUMxUixJQUFJLENBQUNTLEtBQUssQ0FBQ1osaUJBQVEsQ0FBQ21ILGdCQUFnQixDQUFDcUosV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFGLENBQUMsQ0FBQztNQUNKLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1zQixVQUFVQSxDQUFDekwsUUFBa0IsRUFBcUI7SUFDdEQsSUFBSSxJQUFJLENBQUNuRixjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDNFEsVUFBVSxDQUFDekwsUUFBUSxDQUFDO0lBQzVFLE9BQU8sSUFBSSxDQUFDM0csTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixJQUFJLENBQUUsT0FBT2hCLElBQUksQ0FBQ1MsS0FBSyxDQUFDLElBQUksQ0FBQ2xCLE1BQU0sQ0FBQ3FTLFlBQVksQ0FBQyxJQUFJLENBQUNyVyxVQUFVLEVBQUV5RSxJQUFJLENBQUNDLFNBQVMsQ0FBQyxFQUFDaUcsUUFBUSxFQUFFQSxRQUFRLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzJMLE9BQU8sQ0FBRTtNQUNsSCxPQUFPaE8sR0FBRyxFQUFFLENBQUUsTUFBTSxJQUFJbEgsb0JBQVcsQ0FBQyxJQUFJLENBQUM0QyxNQUFNLENBQUNxUCxxQkFBcUIsQ0FBQy9LLEdBQUcsQ0FBQyxDQUFDLENBQUU7SUFDL0UsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTWlPLFVBQVVBLENBQUM1TCxRQUFrQixFQUFFNkwsS0FBZSxFQUFpQjtJQUNuRSxJQUFJLElBQUksQ0FBQ2hSLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUMrUSxVQUFVLENBQUM1TCxRQUFRLEVBQUU2TCxLQUFLLENBQUM7SUFDbkYsT0FBTyxJQUFJLENBQUN4UyxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLElBQUksQ0FBRSxJQUFJLENBQUN6QixNQUFNLENBQUN5UyxZQUFZLENBQUMsSUFBSSxDQUFDelcsVUFBVSxFQUFFeUUsSUFBSSxDQUFDQyxTQUFTLENBQUMsRUFBQ2lHLFFBQVEsRUFBRUEsUUFBUSxFQUFFMkwsT0FBTyxFQUFFRSxLQUFLLEVBQUMsQ0FBQyxDQUFDLENBQUU7TUFDdkcsT0FBT2xPLEdBQUcsRUFBRSxDQUFFLE1BQU0sSUFBSWxILG9CQUFXLENBQUMsSUFBSSxDQUFDNEMsTUFBTSxDQUFDcVAscUJBQXFCLENBQUMvSyxHQUFHLENBQUMsQ0FBQyxDQUFFO0lBQy9FLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1vTyxxQkFBcUJBLENBQUNDLFlBQXVCLEVBQXFDO0lBQ3RGLElBQUksSUFBSSxDQUFDblIsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ2tSLHFCQUFxQixDQUFDQyxZQUFZLENBQUM7SUFDM0YsSUFBSSxDQUFDQSxZQUFZLEVBQUVBLFlBQVksR0FBRyxFQUFFO0lBQ3BDLE9BQU8sSUFBSSxDQUFDM1MsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixJQUFJbVIsT0FBTyxHQUFHLEVBQUU7TUFDaEIsS0FBSyxJQUFJQyxTQUFTLElBQUlwUyxJQUFJLENBQUNTLEtBQUssQ0FBQyxJQUFJLENBQUNsQixNQUFNLENBQUM4Uyx3QkFBd0IsQ0FBQyxJQUFJLENBQUM5VyxVQUFVLEVBQUV5RSxJQUFJLENBQUNDLFNBQVMsQ0FBQyxFQUFDaVMsWUFBWSxFQUFFQSxZQUFZLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQ0MsT0FBTyxFQUFFO1FBQzdJQSxPQUFPLENBQUNwUSxJQUFJLENBQUMsSUFBSXVRLCtCQUFzQixDQUFDRixTQUFTLENBQUMsQ0FBQztNQUNyRDtNQUNBLE9BQU9ELE9BQU87SUFDaEIsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTUksbUJBQW1CQSxDQUFDaEQsT0FBZSxFQUFFaUQsV0FBb0IsRUFBbUI7SUFDaEYsSUFBSSxJQUFJLENBQUN6UixjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDd1IsbUJBQW1CLENBQUNoRCxPQUFPLEVBQUVpRCxXQUFXLENBQUM7SUFDakcsSUFBSSxDQUFDakQsT0FBTyxFQUFFQSxPQUFPLEdBQUcsRUFBRTtJQUMxQixJQUFJLENBQUNpRCxXQUFXLEVBQUVBLFdBQVcsR0FBRyxFQUFFO0lBQ2xDLE9BQU8sSUFBSSxDQUFDalQsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUksQ0FBQ3pCLE1BQU0sQ0FBQ2tULHNCQUFzQixDQUFDLElBQUksQ0FBQ2xYLFVBQVUsRUFBRWdVLE9BQU8sRUFBRWlELFdBQVcsQ0FBQztJQUNsRixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNRSxvQkFBb0JBLENBQUNDLEtBQWEsRUFBRUMsVUFBbUIsRUFBRXJELE9BQTJCLEVBQUVzRCxjQUF1QixFQUFFTCxXQUErQixFQUFpQjtJQUNuSyxJQUFJLElBQUksQ0FBQ3pSLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUMyUixvQkFBb0IsQ0FBQ0MsS0FBSyxFQUFFQyxVQUFVLEVBQUVyRCxPQUFPLEVBQUVzRCxjQUFjLEVBQUVMLFdBQVcsQ0FBQztJQUNySSxJQUFJLENBQUNJLFVBQVUsRUFBRUEsVUFBVSxHQUFHLEtBQUs7SUFDbkMsSUFBSSxDQUFDckQsT0FBTyxFQUFFQSxPQUFPLEdBQUcsRUFBRTtJQUMxQixJQUFJLENBQUNzRCxjQUFjLEVBQUVBLGNBQWMsR0FBRyxLQUFLO0lBQzNDLElBQUksQ0FBQ0wsV0FBVyxFQUFFQSxXQUFXLEdBQUcsRUFBRTtJQUNsQyxPQUFPLElBQUksQ0FBQ2pULE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsSUFBSSxDQUFDekIsTUFBTSxDQUFDdVQsdUJBQXVCLENBQUMsSUFBSSxDQUFDdlgsVUFBVSxFQUFFb1gsS0FBSyxFQUFFQyxVQUFVLEVBQUVyRCxPQUFPLEVBQUVzRCxjQUFjLEVBQUVMLFdBQVcsQ0FBQztJQUMvRyxDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNTyxzQkFBc0JBLENBQUNDLFFBQWdCLEVBQWlCO0lBQzVELElBQUksSUFBSSxDQUFDalMsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ2dTLHNCQUFzQixDQUFDQyxRQUFRLENBQUM7SUFDeEYsT0FBTyxJQUFJLENBQUN6VCxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLElBQUksQ0FBQ3pCLE1BQU0sQ0FBQzBULHlCQUF5QixDQUFDLElBQUksQ0FBQzFYLFVBQVUsRUFBRXlYLFFBQVEsQ0FBQztJQUNsRSxDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNRSxXQUFXQSxDQUFDeEwsR0FBVyxFQUFFeUwsY0FBd0IsRUFBaUI7SUFDdEUsSUFBSSxJQUFJLENBQUNwUyxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDbVMsV0FBVyxDQUFDeEwsR0FBRyxFQUFFeUwsY0FBYyxDQUFDO0lBQ3hGLElBQUksQ0FBQ3pMLEdBQUcsRUFBRUEsR0FBRyxHQUFHLEVBQUU7SUFDbEIsSUFBSSxDQUFDeUwsY0FBYyxFQUFFQSxjQUFjLEdBQUcsRUFBRTtJQUN4QyxPQUFPLElBQUksQ0FBQzVULE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsSUFBSSxDQUFDekIsTUFBTSxDQUFDNlQsWUFBWSxDQUFDLElBQUksQ0FBQzdYLFVBQVUsRUFBRXlFLElBQUksQ0FBQ0MsU0FBUyxDQUFDLEVBQUN5SCxHQUFHLEVBQUVBLEdBQUcsRUFBRXlMLGNBQWMsRUFBRUEsY0FBYyxFQUFDLENBQUMsQ0FBQztJQUN2RyxDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNRSxhQUFhQSxDQUFDRixjQUF3QixFQUFpQjtJQUMzRCxJQUFJLElBQUksQ0FBQ3BTLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUNzUyxhQUFhLENBQUNGLGNBQWMsQ0FBQztJQUNyRixJQUFJLENBQUNBLGNBQWMsRUFBRUEsY0FBYyxHQUFHLEVBQUU7SUFDeEMsT0FBTyxJQUFJLENBQUM1VCxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLElBQUksQ0FBQ3pCLE1BQU0sQ0FBQzZULFlBQVksQ0FBQyxJQUFJLENBQUM3WCxVQUFVLEVBQUV5RSxJQUFJLENBQUNDLFNBQVMsQ0FBQyxFQUFDa1QsY0FBYyxFQUFFQSxjQUFjLEVBQUMsQ0FBQyxDQUFDO0lBQzdGLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1HLGNBQWNBLENBQUEsRUFBZ0M7SUFDbEQsSUFBSSxJQUFJLENBQUN2UyxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDdVMsY0FBYyxDQUFDLENBQUM7SUFDeEUsT0FBTyxJQUFJLENBQUMvVCxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLElBQUl1UyxXQUFXLEdBQUcsRUFBRTtNQUNwQixLQUFLLElBQUlDLGNBQWMsSUFBSXhULElBQUksQ0FBQ1MsS0FBSyxDQUFDLElBQUksQ0FBQ2xCLE1BQU0sQ0FBQ2tVLGdCQUFnQixDQUFDLElBQUksQ0FBQ2xZLFVBQVUsQ0FBQyxDQUFDLENBQUNnWSxXQUFXLEVBQUVBLFdBQVcsQ0FBQ3hSLElBQUksQ0FBQyxJQUFJMlIseUJBQWdCLENBQUNGLGNBQWMsQ0FBQyxDQUFDO01BQ3hKLE9BQU9ELFdBQVc7SUFDcEIsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTUksa0JBQWtCQSxDQUFDak0sR0FBVyxFQUFFVyxLQUFhLEVBQWlCO0lBQ2xFLElBQUksSUFBSSxDQUFDdEgsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQzRTLGtCQUFrQixDQUFDak0sR0FBRyxFQUFFVyxLQUFLLENBQUM7SUFDdEYsSUFBSSxDQUFDWCxHQUFHLEVBQUVBLEdBQUcsR0FBRyxFQUFFO0lBQ2xCLElBQUksQ0FBQ1csS0FBSyxFQUFFQSxLQUFLLEdBQUcsRUFBRTtJQUN0QixPQUFPLElBQUksQ0FBQzlJLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsSUFBSSxDQUFDekIsTUFBTSxDQUFDcVUscUJBQXFCLENBQUMsSUFBSSxDQUFDclksVUFBVSxFQUFFbU0sR0FBRyxFQUFFVyxLQUFLLENBQUM7SUFDaEUsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTXdMLGFBQWFBLENBQUM3VyxNQUFzQixFQUFtQjtJQUMzRCxJQUFJLElBQUksQ0FBQytELGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUM4UyxhQUFhLENBQUM3VyxNQUFNLENBQUM7SUFDN0VBLE1BQU0sR0FBR3lNLHFCQUFZLENBQUMyQyx3QkFBd0IsQ0FBQ3BQLE1BQU0sQ0FBQztJQUN0RCxPQUFPLElBQUksQ0FBQ3VDLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsSUFBSTtRQUNGLE9BQU8sSUFBSSxDQUFDekIsTUFBTSxDQUFDdVUsZUFBZSxDQUFDLElBQUksQ0FBQ3ZZLFVBQVUsRUFBRXlFLElBQUksQ0FBQ0MsU0FBUyxDQUFDakQsTUFBTSxDQUFDa0QsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ3RGLENBQUMsQ0FBQyxPQUFPMkQsR0FBRyxFQUFFO1FBQ1osTUFBTSxJQUFJbEgsb0JBQVcsQ0FBQywwQ0FBMEMsQ0FBQztNQUNuRTtJQUNGLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1vWCxlQUFlQSxDQUFDclIsR0FBVyxFQUEyQjtJQUMxRCxJQUFJLElBQUksQ0FBQzNCLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUNnVCxlQUFlLENBQUNyUixHQUFHLENBQUM7SUFDNUUsT0FBTyxJQUFJLENBQUNuRCxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLElBQUk7UUFDRixPQUFPLElBQUlnVCx1QkFBYyxDQUFDaFUsSUFBSSxDQUFDUyxLQUFLLENBQUNaLGlCQUFRLENBQUNtSCxnQkFBZ0IsQ0FBQyxJQUFJLENBQUN6SCxNQUFNLENBQUMwVSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMxWSxVQUFVLEVBQUVtSCxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7TUFDdkgsQ0FBQyxDQUFDLE9BQU9tQixHQUFRLEVBQUU7UUFDakIsTUFBTSxJQUFJbEgsb0JBQVcsQ0FBQ2tILEdBQUcsQ0FBQ0MsT0FBTyxDQUFDO01BQ3BDO0lBQ0YsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTW9RLFlBQVlBLENBQUNDLEdBQVcsRUFBbUI7SUFDL0MsSUFBSSxJQUFJLENBQUNwVCxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDbVQsWUFBWSxDQUFDQyxHQUFHLENBQUM7SUFDekUsSUFBSSxDQUFDblQsZUFBZSxDQUFDLENBQUM7SUFDdEIsSUFBQXRFLGVBQU0sRUFBQyxPQUFPeVgsR0FBRyxLQUFLLFFBQVEsRUFBRSxnQ0FBZ0MsQ0FBQztJQUNqRSxPQUFPLElBQUksQ0FBQzVVLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsSUFBSW9ULEtBQUssR0FBRyxJQUFJLENBQUM3VSxNQUFNLENBQUM4VSxhQUFhLENBQUMsSUFBSSxDQUFDOVksVUFBVSxFQUFFNFksR0FBRyxDQUFDO01BQzNELE9BQU9DLEtBQUssS0FBSyxFQUFFLEdBQUcsSUFBSSxHQUFHQSxLQUFLO0lBQ3BDLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1FLFlBQVlBLENBQUNILEdBQVcsRUFBRUksR0FBVyxFQUFpQjtJQUMxRCxJQUFJLElBQUksQ0FBQ3hULGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUN1VCxZQUFZLENBQUNILEdBQUcsRUFBRUksR0FBRyxDQUFDO0lBQzlFLElBQUksQ0FBQ3ZULGVBQWUsQ0FBQyxDQUFDO0lBQ3RCLElBQUF0RSxlQUFNLEVBQUMsT0FBT3lYLEdBQUcsS0FBSyxRQUFRLEVBQUUsZ0NBQWdDLENBQUM7SUFDakUsSUFBQXpYLGVBQU0sRUFBQyxPQUFPNlgsR0FBRyxLQUFLLFFBQVEsRUFBRSxrQ0FBa0MsQ0FBQztJQUNuRSxPQUFPLElBQUksQ0FBQ2hWLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsSUFBSSxDQUFDekIsTUFBTSxDQUFDaVYsYUFBYSxDQUFDLElBQUksQ0FBQ2paLFVBQVUsRUFBRTRZLEdBQUcsRUFBRUksR0FBRyxDQUFDO0lBQ3RELENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1FLFdBQVdBLENBQUNDLFVBQWtCLEVBQUVDLGdCQUEwQixFQUFFQyxhQUF1QixFQUFpQjtJQUN4RyxJQUFJLElBQUksQ0FBQzdULGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUMwVCxXQUFXLENBQUNDLFVBQVUsRUFBRUMsZ0JBQWdCLEVBQUVDLGFBQWEsQ0FBQztJQUNoSCxJQUFJLENBQUM1VCxlQUFlLENBQUMsQ0FBQztJQUN0QixJQUFJNlQsTUFBTSxHQUFHLE1BQU1DLHdCQUFlLENBQUNDLGtCQUFrQixDQUFDLE1BQU0sSUFBSSxDQUFDaFMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO0lBQ3ZGLE1BQU04UixNQUFNLENBQUNKLFdBQVcsQ0FBQyxNQUFNLElBQUksQ0FBQ25YLGlCQUFpQixDQUFDLENBQUMsRUFBRW9YLFVBQVUsRUFBRUMsZ0JBQWdCLEVBQUVDLGFBQWEsQ0FBQztFQUN2Rzs7RUFFQSxNQUFNSSxVQUFVQSxDQUFBLEVBQWtCO0lBQ2hDLElBQUksSUFBSSxDQUFDalUsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ2lVLFVBQVUsQ0FBQyxDQUFDO0lBQ3BFLElBQUksQ0FBQ2hVLGVBQWUsQ0FBQyxDQUFDO0lBQ3RCLElBQUk2VCxNQUFNLEdBQUcsTUFBTUMsd0JBQWUsQ0FBQ0Msa0JBQWtCLENBQUMsTUFBTSxJQUFJLENBQUNoUyxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7SUFDdkYsTUFBTThSLE1BQU0sQ0FBQ0csVUFBVSxDQUFDLENBQUM7RUFDM0I7O0VBRUEsTUFBTUMsc0JBQXNCQSxDQUFBLEVBQXFCO0lBQy9DLElBQUksSUFBSSxDQUFDbFUsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ2tVLHNCQUFzQixDQUFDLENBQUM7SUFDaEYsT0FBTyxJQUFJLENBQUMxVixNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLE9BQU8sSUFBSSxDQUFDekIsTUFBTSxDQUFDMlYseUJBQXlCLENBQUMsSUFBSSxDQUFDM1osVUFBVSxDQUFDO0lBQy9ELENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU00WixVQUFVQSxDQUFBLEVBQXFCO0lBQ25DLElBQUksSUFBSSxDQUFDcFUsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ29VLFVBQVUsQ0FBQyxDQUFDO0lBQ3BFLE9BQU8sSUFBSSxDQUFDNVYsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUksQ0FBQ3pCLE1BQU0sQ0FBQzZWLFdBQVcsQ0FBQyxJQUFJLENBQUM3WixVQUFVLENBQUM7SUFDakQsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTThaLGVBQWVBLENBQUEsRUFBZ0M7SUFDbkQsSUFBSSxJQUFJLENBQUN0VSxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDc1UsZUFBZSxDQUFDLENBQUM7SUFDekUsT0FBTyxJQUFJLENBQUM5VixNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLE9BQU8sSUFBSXNVLDJCQUFrQixDQUFDdFYsSUFBSSxDQUFDUyxLQUFLLENBQUMsSUFBSSxDQUFDbEIsTUFBTSxDQUFDZ1csaUJBQWlCLENBQUMsSUFBSSxDQUFDaGEsVUFBVSxDQUFDLENBQUMsQ0FBQztJQUMzRixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNaWEsZUFBZUEsQ0FBQSxFQUFvQjtJQUN2QyxJQUFJLElBQUksQ0FBQ3pVLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUN5VSxlQUFlLENBQUMsQ0FBQztJQUN6RSxPQUFPLElBQUksQ0FBQ2pXLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJLENBQUN6QixNQUFNLENBQUNrVyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUNsYSxVQUFVLENBQUM7SUFDdEQsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTW1hLFlBQVlBLENBQUNDLGFBQXVCLEVBQUVDLFNBQWlCLEVBQUVuYSxRQUFnQixFQUFtQjtJQUNoRyxJQUFJLElBQUksQ0FBQ3NGLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUMyVSxZQUFZLENBQUNDLGFBQWEsRUFBRUMsU0FBUyxFQUFFbmEsUUFBUSxDQUFDO0lBQ3hHLE9BQU8sSUFBSSxDQUFDOEQsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUl0QixPQUFPLENBQUMsQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7UUFDdEMsSUFBSSxDQUFDTCxNQUFNLENBQUNzVyxhQUFhLENBQUMsSUFBSSxDQUFDdGEsVUFBVSxFQUFFeUUsSUFBSSxDQUFDQyxTQUFTLENBQUMsRUFBQzBWLGFBQWEsRUFBRUEsYUFBYSxFQUFFQyxTQUFTLEVBQUVBLFNBQVMsRUFBRW5hLFFBQVEsRUFBRUEsUUFBUSxFQUFDLENBQUMsRUFBRSxDQUFDeUYsSUFBSSxLQUFLO1VBQzdJLElBQUl1UCxRQUFRLEdBQUcsU0FBUztVQUN4QixJQUFJdlAsSUFBSSxDQUFDaUIsT0FBTyxDQUFDc08sUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFN1EsTUFBTSxDQUFDLElBQUlqRCxvQkFBVyxDQUFDdUUsSUFBSSxDQUFDd1AsU0FBUyxDQUFDRCxRQUFRLENBQUNFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztVQUN0RmhSLE9BQU8sQ0FBQ3VCLElBQUksQ0FBQztRQUNwQixDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNNFUsb0JBQW9CQSxDQUFDSCxhQUF1QixFQUFFbGEsUUFBZ0IsRUFBcUM7SUFDdkcsSUFBSSxJQUFJLENBQUNzRixjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDK1Usb0JBQW9CLENBQUNILGFBQWEsRUFBRWxhLFFBQVEsQ0FBQztJQUNyRyxPQUFPLElBQUksQ0FBQzhELE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLO1FBQ3RDLElBQUksQ0FBQ0wsTUFBTSxDQUFDd1csc0JBQXNCLENBQUMsSUFBSSxDQUFDeGEsVUFBVSxFQUFFeUUsSUFBSSxDQUFDQyxTQUFTLENBQUMsRUFBQzBWLGFBQWEsRUFBRUEsYUFBYSxFQUFFbGEsUUFBUSxFQUFFQSxRQUFRLEVBQUMsQ0FBQyxFQUFFLENBQUN5RixJQUFJLEtBQUs7VUFDaEksSUFBSXVQLFFBQVEsR0FBRyxTQUFTO1VBQ3hCLElBQUl2UCxJQUFJLENBQUNpQixPQUFPLENBQUNzTyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUU3USxNQUFNLENBQUMsSUFBSWpELG9CQUFXLENBQUN1RSxJQUFJLENBQUN3UCxTQUFTLENBQUNELFFBQVEsQ0FBQ0UsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1VBQ3RGaFIsT0FBTyxDQUFDLElBQUlxVyxpQ0FBd0IsQ0FBQ2hXLElBQUksQ0FBQ1MsS0FBSyxDQUFDUyxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQzlELENBQUMsQ0FBQztNQUNKLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU0rVSxpQkFBaUJBLENBQUEsRUFBb0I7SUFDekMsSUFBSSxJQUFJLENBQUNsVixjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDa1YsaUJBQWlCLENBQUMsQ0FBQztJQUMzRSxPQUFPLElBQUksQ0FBQzFXLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJLENBQUN6QixNQUFNLENBQUMyVyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMzYSxVQUFVLENBQUM7SUFDekQsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTTRhLGlCQUFpQkEsQ0FBQ1IsYUFBdUIsRUFBbUI7SUFDaEUsSUFBSSxJQUFJLENBQUM1VSxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDb1YsaUJBQWlCLENBQUNSLGFBQWEsQ0FBQztJQUN4RixJQUFJLENBQUM5VixpQkFBUSxDQUFDZ08sT0FBTyxDQUFDOEgsYUFBYSxDQUFDLEVBQUUsTUFBTSxJQUFJaFosb0JBQVcsQ0FBQyw4Q0FBOEMsQ0FBQztJQUMzRyxPQUFPLElBQUksQ0FBQzRDLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLO1FBQ3RDLElBQUksQ0FBQ0wsTUFBTSxDQUFDNlcsbUJBQW1CLENBQUMsSUFBSSxDQUFDN2EsVUFBVSxFQUFFeUUsSUFBSSxDQUFDQyxTQUFTLENBQUMsRUFBQzBWLGFBQWEsRUFBRUEsYUFBYSxFQUFDLENBQUMsRUFBRSxDQUFDelUsSUFBSSxLQUFLO1VBQ3pHLElBQUksT0FBT0EsSUFBSSxLQUFLLFFBQVEsRUFBRXRCLE1BQU0sQ0FBQyxJQUFJakQsb0JBQVcsQ0FBQ3VFLElBQUksQ0FBQyxDQUFDLENBQUM7VUFDdkR2QixPQUFPLENBQUN1QixJQUFJLENBQUM7UUFDcEIsQ0FBQyxDQUFDO01BQ0osQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTW1WLGlCQUFpQkEsQ0FBQzVILGFBQXFCLEVBQXFDO0lBQ2hGLElBQUksSUFBSSxDQUFDMU4sY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ3NWLGlCQUFpQixDQUFDNUgsYUFBYSxDQUFDO0lBQ3hGLE9BQU8sSUFBSSxDQUFDbFAsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUl0QixPQUFPLENBQUMsQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7UUFDdEMsSUFBSSxDQUFDTCxNQUFNLENBQUMrVyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMvYSxVQUFVLEVBQUVrVCxhQUFhLEVBQUUsQ0FBQ3ZOLElBQUksS0FBSztVQUN6RSxJQUFJQSxJQUFJLENBQUN5QyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFL0QsTUFBTSxDQUFDLElBQUlqRCxvQkFBVyxDQUFDdUUsSUFBSSxDQUFDLENBQUMsQ0FBQztVQUNyRHZCLE9BQU8sQ0FBQyxJQUFJNFcsaUNBQXdCLENBQUN2VyxJQUFJLENBQUNTLEtBQUssQ0FBQ1MsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM5RCxDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNc1YsbUJBQW1CQSxDQUFDQyxtQkFBMkIsRUFBcUI7SUFDeEUsSUFBSSxJQUFJLENBQUMxVixjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDeVYsbUJBQW1CLENBQUNDLG1CQUFtQixDQUFDO0lBQ2hHLE9BQU8sSUFBSSxDQUFDbFgsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUl0QixPQUFPLENBQUMsQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7UUFDdEMsSUFBSSxDQUFDTCxNQUFNLENBQUNtWCxzQkFBc0IsQ0FBQyxJQUFJLENBQUNuYixVQUFVLEVBQUVrYixtQkFBbUIsRUFBRSxDQUFDdlYsSUFBSSxLQUFLO1VBQ2pGLElBQUlBLElBQUksQ0FBQ3lDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUUvRCxNQUFNLENBQUMsSUFBSWpELG9CQUFXLENBQUN1RSxJQUFJLENBQUMsQ0FBQyxDQUFDO1VBQ3JEdkIsT0FBTyxDQUFDSyxJQUFJLENBQUNTLEtBQUssQ0FBQ1MsSUFBSSxDQUFDLENBQUNnRixRQUFRLENBQUM7UUFDekMsQ0FBQyxDQUFDO01BQ0osQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0VBQ0o7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtFQUNFLE1BQU15USxPQUFPQSxDQUFBLEVBQXdCO0lBQ25DLElBQUksSUFBSSxDQUFDNVYsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQzRWLE9BQU8sQ0FBQyxDQUFDOztJQUVqRTtJQUNBLElBQUlDLFFBQVEsR0FBRyxNQUFNLElBQUksQ0FBQ0MsVUFBVSxDQUFDLENBQUM7SUFDdEMsT0FBTyxJQUFJLENBQUN0WCxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDOztNQUV0QjtNQUNBLElBQUk4VixLQUFLLEdBQUcsRUFBRTs7TUFFZDtNQUNBLElBQUlDLGNBQWMsR0FBRy9XLElBQUksQ0FBQ1MsS0FBSyxDQUFDLElBQUksQ0FBQ2xCLE1BQU0sQ0FBQ3lYLHFCQUFxQixDQUFDLElBQUksQ0FBQ3piLFVBQVUsQ0FBQyxDQUFDOztNQUVuRjtNQUNBLElBQUkwYixJQUFJLEdBQUcsSUFBSUMsUUFBUSxDQUFDLElBQUlDLFdBQVcsQ0FBQ0osY0FBYyxDQUFDcEcsTUFBTSxDQUFDLENBQUM7TUFDL0QsS0FBSyxJQUFJeUcsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHTCxjQUFjLENBQUNwRyxNQUFNLEVBQUV5RyxDQUFDLEVBQUUsRUFBRTtRQUM5Q0gsSUFBSSxDQUFDSSxPQUFPLENBQUNELENBQUMsRUFBRSxJQUFJLENBQUM3WCxNQUFNLENBQUMrWCxNQUFNLENBQUNQLGNBQWMsQ0FBQ1EsT0FBTyxHQUFHQyxVQUFVLENBQUNDLGlCQUFpQixHQUFHTCxDQUFDLENBQUMsQ0FBQztNQUNoRzs7TUFFQTtNQUNBLElBQUksQ0FBQzdYLE1BQU0sQ0FBQ21ZLEtBQUssQ0FBQ1gsY0FBYyxDQUFDUSxPQUFPLENBQUM7O01BRXpDO01BQ0FULEtBQUssQ0FBQy9VLElBQUksQ0FBQzRWLE1BQU0sQ0FBQ0MsSUFBSSxDQUFDWCxJQUFJLENBQUNZLE1BQU0sQ0FBQyxDQUFDOztNQUVwQztNQUNBLElBQUlDLGFBQWEsR0FBRzlYLElBQUksQ0FBQ1MsS0FBSyxDQUFDLElBQUksQ0FBQ2xCLE1BQU0sQ0FBQ3dZLG9CQUFvQixDQUFDLElBQUksQ0FBQ3hjLFVBQVUsRUFBRSxJQUFJLENBQUNFLFFBQVEsRUFBRW1iLFFBQVEsQ0FBQyxDQUFDOztNQUUxRztNQUNBSyxJQUFJLEdBQUcsSUFBSUMsUUFBUSxDQUFDLElBQUlDLFdBQVcsQ0FBQ1csYUFBYSxDQUFDbkgsTUFBTSxDQUFDLENBQUM7TUFDMUQsS0FBSyxJQUFJeUcsQ0FBQyxHQUFHLENBQUMsRUFBRUEsQ0FBQyxHQUFHVSxhQUFhLENBQUNuSCxNQUFNLEVBQUV5RyxDQUFDLEVBQUUsRUFBRTtRQUM3Q0gsSUFBSSxDQUFDSSxPQUFPLENBQUNELENBQUMsRUFBRSxJQUFJLENBQUM3WCxNQUFNLENBQUMrWCxNQUFNLENBQUNRLGFBQWEsQ0FBQ1AsT0FBTyxHQUFHQyxVQUFVLENBQUNDLGlCQUFpQixHQUFHTCxDQUFDLENBQUMsQ0FBQztNQUMvRjs7TUFFQTtNQUNBLElBQUksQ0FBQzdYLE1BQU0sQ0FBQ21ZLEtBQUssQ0FBQ0ksYUFBYSxDQUFDUCxPQUFPLENBQUM7O01BRXhDO01BQ0FULEtBQUssQ0FBQ2tCLE9BQU8sQ0FBQ0wsTUFBTSxDQUFDQyxJQUFJLENBQUNYLElBQUksQ0FBQ1ksTUFBTSxDQUFDLENBQUM7TUFDdkMsT0FBT2YsS0FBSztJQUNkLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1tQixjQUFjQSxDQUFDQyxXQUFtQixFQUFFQyxXQUFtQixFQUFpQjtJQUM1RSxJQUFJLElBQUksQ0FBQ3BYLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUNrWCxjQUFjLENBQUNDLFdBQVcsRUFBRUMsV0FBVyxDQUFDO0lBQ2hHLElBQUlELFdBQVcsS0FBSyxJQUFJLENBQUN6YyxRQUFRLEVBQUUsTUFBTSxJQUFJa0Isb0JBQVcsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDLENBQUM7SUFDeEYsSUFBSXdiLFdBQVcsS0FBS25jLFNBQVMsRUFBRW1jLFdBQVcsR0FBRyxFQUFFO0lBQy9DLE1BQU0sSUFBSSxDQUFDNVksTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN0QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUl0QixPQUFPLENBQU8sQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7UUFDNUMsSUFBSSxDQUFDTCxNQUFNLENBQUM2WSxzQkFBc0IsQ0FBQyxJQUFJLENBQUM3YyxVQUFVLEVBQUUyYyxXQUFXLEVBQUVDLFdBQVcsRUFBRSxDQUFDRSxNQUFNLEtBQUs7VUFDeEYsSUFBSUEsTUFBTSxFQUFFelksTUFBTSxDQUFDLElBQUlqRCxvQkFBVyxDQUFDMGIsTUFBTSxDQUFDLENBQUMsQ0FBQztVQUN2QzFZLE9BQU8sQ0FBQyxDQUFDO1FBQ2hCLENBQUMsQ0FBQztNQUNKLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztJQUNGLElBQUksQ0FBQ2xFLFFBQVEsR0FBRzBjLFdBQVc7SUFDM0IsSUFBSSxJQUFJLENBQUMzYyxJQUFJLEVBQUUsTUFBTSxJQUFJLENBQUMyRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEM7O0VBRUEsTUFBTUEsSUFBSUEsQ0FBQSxFQUFrQjtJQUMxQixJQUFJLElBQUksQ0FBQ1ksY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ1osSUFBSSxDQUFDLENBQUM7SUFDOUQsT0FBT2hGLGdCQUFnQixDQUFDZ0YsSUFBSSxDQUFDLElBQUksQ0FBQztFQUNwQzs7RUFFQSxNQUFNbVksS0FBS0EsQ0FBQ25ZLElBQUksR0FBRyxLQUFLLEVBQWlCO0lBQ3ZDLElBQUksSUFBSSxDQUFDbEUsU0FBUyxFQUFFLE9BQU8sQ0FBQztJQUM1QixJQUFJLElBQUksQ0FBQzhFLGNBQWMsQ0FBQyxDQUFDLEVBQUU7TUFDekIsTUFBTSxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUN1WCxLQUFLLENBQUNuWSxJQUFJLENBQUM7TUFDdkMsSUFBSSxDQUFDbEUsU0FBUyxHQUFHLElBQUk7TUFDckI7SUFDRjtJQUNBLE1BQU0sSUFBSSxDQUFDK0YsZ0JBQWdCLENBQUMsQ0FBQztJQUM3QixNQUFNLElBQUksQ0FBQzhELFdBQVcsQ0FBQyxDQUFDO0lBQ3hCLE1BQU0sS0FBSyxDQUFDd1MsS0FBSyxDQUFDblksSUFBSSxDQUFDO0lBQ3ZCLE9BQU8sSUFBSSxDQUFDM0UsSUFBSTtJQUNoQixPQUFPLElBQUksQ0FBQ0MsUUFBUTtJQUNwQixPQUFPLElBQUksQ0FBQ0ssU0FBUztJQUNyQixPQUFPLElBQUksQ0FBQ0ksWUFBWTtJQUN4QksscUJBQVksQ0FBQ0MsdUJBQXVCLENBQUMsSUFBSSxDQUFDSCwwQkFBMEIsRUFBRUwsU0FBUyxDQUFDLENBQUMsQ0FBQztFQUNwRjs7RUFFQTs7RUFFQSxNQUFNdWMsb0JBQW9CQSxDQUFBLEVBQXNCLENBQUUsT0FBTyxLQUFLLENBQUNBLG9CQUFvQixDQUFDLENBQUMsQ0FBRTtFQUN2RixNQUFNQyxLQUFLQSxDQUFDeEksTUFBYyxFQUEyQixDQUFFLE9BQU8sS0FBSyxDQUFDd0ksS0FBSyxDQUFDeEksTUFBTSxDQUFDLENBQUU7RUFDbkYsTUFBTXlJLG9CQUFvQkEsQ0FBQ2xQLEtBQW1DLEVBQXFDLENBQUUsT0FBTyxLQUFLLENBQUNrUCxvQkFBb0IsQ0FBQ2xQLEtBQUssQ0FBQyxDQUFFO0VBQy9JLE1BQU1tUCxvQkFBb0JBLENBQUNuUCxLQUFtQyxFQUFFLENBQUUsT0FBTyxLQUFLLENBQUNtUCxvQkFBb0IsQ0FBQ25QLEtBQUssQ0FBQyxDQUFFO0VBQzVHLE1BQU1vUCxRQUFRQSxDQUFDM2IsTUFBK0IsRUFBMkIsQ0FBRSxPQUFPLEtBQUssQ0FBQzJiLFFBQVEsQ0FBQzNiLE1BQU0sQ0FBQyxDQUFFO0VBQzFHLE1BQU00YixPQUFPQSxDQUFDN0ssWUFBcUMsRUFBbUIsQ0FBRSxPQUFPLEtBQUssQ0FBQzZLLE9BQU8sQ0FBQzdLLFlBQVksQ0FBQyxDQUFFO0VBQzVHLE1BQU04SyxTQUFTQSxDQUFDN0ksTUFBYyxFQUFtQixDQUFFLE9BQU8sS0FBSyxDQUFDNkksU0FBUyxDQUFDN0ksTUFBTSxDQUFDLENBQUU7RUFDbkYsTUFBTThJLFNBQVNBLENBQUM5SSxNQUFjLEVBQUUrSSxJQUFZLEVBQWlCLENBQUUsT0FBTyxLQUFLLENBQUNELFNBQVMsQ0FBQzlJLE1BQU0sRUFBRStJLElBQUksQ0FBQyxDQUFFOztFQUVyRzs7RUFFQSxhQUF1QjlhLGNBQWNBLENBQUNqQixNQUFtQyxFQUFFO0lBQ3pFLElBQUlBLE1BQU0sQ0FBQ2djLGFBQWEsRUFBRSxPQUFPbGEscUJBQXFCLENBQUNiLGNBQWMsQ0FBQ2pCLE1BQU0sQ0FBQzs7SUFFN0U7SUFDQSxJQUFJQSxNQUFNLENBQUNpYyxXQUFXLEtBQUtqZCxTQUFTLEVBQUUsTUFBTSxJQUFJVyxvQkFBVyxDQUFDLHdDQUF3QyxDQUFDO0lBQ3JHSyxNQUFNLENBQUNpYyxXQUFXLEdBQUc3YSwwQkFBaUIsQ0FBQ3daLElBQUksQ0FBQzVhLE1BQU0sQ0FBQ2ljLFdBQVcsQ0FBQztJQUMvRCxJQUFJOVosZ0JBQWdCLEdBQUduQyxNQUFNLENBQUMwQixTQUFTLENBQUMsQ0FBQztJQUN6QyxJQUFJd2EsU0FBUyxHQUFHL1osZ0JBQWdCLElBQUlBLGdCQUFnQixDQUFDd0QsTUFBTSxDQUFDLENBQUMsR0FBR3hELGdCQUFnQixDQUFDd0QsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFO0lBQzlGLElBQUl3VyxjQUFjLEdBQUdoYSxnQkFBZ0IsSUFBSUEsZ0JBQWdCLENBQUMwRCxXQUFXLENBQUMsQ0FBQyxHQUFHMUQsZ0JBQWdCLENBQUMwRCxXQUFXLENBQUMsQ0FBQyxHQUFHLEVBQUU7SUFDN0csSUFBSXVXLGNBQWMsR0FBR2phLGdCQUFnQixJQUFJQSxnQkFBZ0IsQ0FBQ1osV0FBVyxDQUFDLENBQUMsR0FBR1ksZ0JBQWdCLENBQUNaLFdBQVcsQ0FBQyxDQUFDLEdBQUcsRUFBRTtJQUM3RyxJQUFJNUMsa0JBQWtCLEdBQUd3RCxnQkFBZ0IsR0FBR0EsZ0JBQWdCLENBQUNDLHFCQUFxQixDQUFDLENBQUMsR0FBRyxJQUFJOztJQUUzRjtJQUNBLElBQUlHLE1BQU0sR0FBRyxNQUFNaEQscUJBQVksQ0FBQ2lELGNBQWMsQ0FBQyxDQUFDOztJQUVoRDtJQUNBLE9BQU9ELE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDbEMsT0FBTyxJQUFJQyxPQUFPLENBQUMsQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7O1FBRXRDO1FBQ0EsSUFBSWhFLHNCQUFzQixHQUFHaUUsaUJBQVEsQ0FBQ0MsT0FBTyxDQUFDLENBQUM7UUFDL0N2RCxxQkFBWSxDQUFDQyx1QkFBdUIsQ0FBQ1osc0JBQXNCLEVBQUUsTUFBTUQsa0JBQWtCLENBQUM7O1FBRXRGO1FBQ0E0RCxNQUFNLENBQUM4WixnQkFBZ0IsQ0FBQ3JjLE1BQU0sQ0FBQ3ZCLFFBQVEsRUFBRXVCLE1BQU0sQ0FBQ2ljLFdBQVcsRUFBRWpjLE1BQU0sQ0FBQ3NjLFFBQVEsRUFBRXRjLE1BQU0sQ0FBQ3VjLFNBQVMsRUFBRUwsU0FBUyxFQUFFQyxjQUFjLEVBQUVDLGNBQWMsRUFBRXhkLHNCQUFzQixFQUFFLENBQUNMLFVBQVUsS0FBSztVQUNqTCxJQUFJLE9BQU9BLFVBQVUsS0FBSyxRQUFRLEVBQUVxRSxNQUFNLENBQUMsSUFBSWpELG9CQUFXLENBQUNwQixVQUFVLENBQUMsQ0FBQyxDQUFDO1VBQ25Fb0UsT0FBTyxDQUFDLElBQUl4RSxnQkFBZ0IsQ0FBQ0ksVUFBVSxFQUFFeUIsTUFBTSxDQUFDeEIsSUFBSSxFQUFFd0IsTUFBTSxDQUFDdkIsUUFBUSxFQUFFQyxXQUFFLEVBQUVDLGtCQUFrQixFQUFFQyxzQkFBc0IsQ0FBQyxDQUFDO1FBQzlILENBQUMsQ0FBQztNQUNKLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKOztFQUVVbUYsY0FBY0EsQ0FBQSxFQUEwQjtJQUNoRCxPQUFPLEtBQUssQ0FBQ0EsY0FBYyxDQUFDLENBQUM7RUFDL0I7O0VBRUEsTUFBZ0I2RSxjQUFjQSxDQUFBLEVBQUc7SUFDL0IsSUFBSXlDLEtBQUssR0FBRyxJQUFJLENBQUM3TSxJQUFJLEdBQUcsSUFBSSxDQUFDQSxJQUFJLEdBQUksSUFBSSxDQUFDZ2UsZUFBZSxHQUFHLElBQUksQ0FBQ0EsZUFBZSxHQUFHLGtCQUFtQixDQUFDLENBQUM7SUFDeEdqZCxxQkFBWSxDQUFDTyxHQUFHLENBQUMsQ0FBQyxFQUFFLDJCQUEyQixHQUFHdUwsS0FBSyxDQUFDO0lBQ3hELElBQUksQ0FBRSxNQUFNLElBQUksQ0FBQ3pELElBQUksQ0FBQyxDQUFDLENBQUU7SUFDekIsT0FBT2YsR0FBUSxFQUFFLENBQUUsSUFBSSxDQUFDLElBQUksQ0FBQzVILFNBQVMsRUFBRXdkLE9BQU8sQ0FBQ0MsS0FBSyxDQUFDLG1DQUFtQyxHQUFHclIsS0FBSyxHQUFHLElBQUksR0FBR3hFLEdBQUcsQ0FBQ0MsT0FBTyxDQUFDLENBQUU7RUFDM0g7O0VBRUEsTUFBZ0I5QixnQkFBZ0JBLENBQUEsRUFBRztJQUNqQyxJQUFJMlgsU0FBUyxHQUFHLElBQUksQ0FBQzdkLFNBQVMsQ0FBQzZVLE1BQU0sR0FBRyxDQUFDO0lBQ3pDLElBQUksSUFBSSxDQUFDdlUsa0JBQWtCLEtBQUssQ0FBQyxJQUFJLENBQUN1ZCxTQUFTLElBQUksSUFBSSxDQUFDdmQsa0JBQWtCLEdBQUcsQ0FBQyxJQUFJdWQsU0FBUyxFQUFFLE9BQU8sQ0FBQztJQUNyRyxPQUFPLElBQUksQ0FBQ3BhLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsT0FBTyxJQUFJQyxPQUFPLENBQU8sQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7UUFDNUMsSUFBSSxDQUFDTCxNQUFNLENBQUNxYSxZQUFZO1VBQ3RCLElBQUksQ0FBQ3JlLFVBQVU7VUFDZixJQUFJLENBQUNhLGtCQUFrQjtVQUNyQixDQUFBeWQsaUJBQWlCLEtBQUk7WUFDbkIsSUFBSSxPQUFPQSxpQkFBaUIsS0FBSyxRQUFRLEVBQUVqYSxNQUFNLENBQUMsSUFBSWpELG9CQUFXLENBQUNrZCxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7WUFDakY7Y0FDSCxJQUFJLENBQUN6ZCxrQkFBa0IsR0FBR3lkLGlCQUFpQjtjQUMzQ2xhLE9BQU8sQ0FBQyxDQUFDO1lBQ1g7VUFDRixDQUFDO1VBQ0RnYSxTQUFTLEdBQUcsT0FBT0csTUFBTSxFQUFFaFYsV0FBVyxFQUFFaVYsU0FBUyxFQUFFQyxXQUFXLEVBQUVsVyxPQUFPLEtBQUssTUFBTSxJQUFJLENBQUM1SCxZQUFZLENBQUMrZCxjQUFjLENBQUNILE1BQU0sRUFBRWhWLFdBQVcsRUFBRWlWLFNBQVMsRUFBRUMsV0FBVyxFQUFFbFcsT0FBTyxDQUFDLEdBQUc5SCxTQUFTO1VBQ3BMMmQsU0FBUyxHQUFHLE9BQU9HLE1BQU0sS0FBSyxNQUFNLElBQUksQ0FBQzVkLFlBQVksQ0FBQ2dlLFVBQVUsQ0FBQ0osTUFBTSxDQUFDLEdBQUc5ZCxTQUFTO1VBQ3BGMmQsU0FBUyxHQUFHLE9BQU9RLGFBQWEsRUFBRUMscUJBQXFCLEtBQUssTUFBTSxJQUFJLENBQUNsZSxZQUFZLENBQUNtZSxpQkFBaUIsQ0FBQ0YsYUFBYSxFQUFFQyxxQkFBcUIsQ0FBQyxHQUFHcGUsU0FBUztVQUN2SjJkLFNBQVMsR0FBRyxPQUFPRyxNQUFNLEVBQUU5SixNQUFNLEVBQUVzSyxTQUFTLEVBQUU3VCxVQUFVLEVBQUVDLGFBQWEsRUFBRW9KLE9BQU8sRUFBRXlLLFVBQVUsRUFBRUMsUUFBUSxLQUFLLE1BQU0sSUFBSSxDQUFDdGUsWUFBWSxDQUFDdWUsZ0JBQWdCLENBQUNYLE1BQU0sRUFBRTlKLE1BQU0sRUFBRXNLLFNBQVMsRUFBRTdULFVBQVUsRUFBRUMsYUFBYSxFQUFFb0osT0FBTyxFQUFFeUssVUFBVSxFQUFFQyxRQUFRLENBQUMsR0FBR3hlLFNBQVM7VUFDcFAyZCxTQUFTLEdBQUcsT0FBT0csTUFBTSxFQUFFOUosTUFBTSxFQUFFc0ssU0FBUyxFQUFFSSxhQUFhLEVBQUVDLGdCQUFnQixFQUFFN0ssT0FBTyxFQUFFeUssVUFBVSxFQUFFQyxRQUFRLEtBQUssTUFBTSxJQUFJLENBQUN0ZSxZQUFZLENBQUMwZSxhQUFhLENBQUNkLE1BQU0sRUFBRTlKLE1BQU0sRUFBRXNLLFNBQVMsRUFBRUksYUFBYSxFQUFFQyxnQkFBZ0IsRUFBRTdLLE9BQU8sRUFBRXlLLFVBQVUsRUFBRUMsUUFBUSxDQUFDLEdBQUd4ZTtRQUN4UCxDQUFDO01BQ0gsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsT0FBTzZlLGFBQWFBLENBQUNDLEtBQUssRUFBRTtJQUMxQixLQUFLLElBQUl6TixFQUFFLElBQUl5TixLQUFLLENBQUN4UixNQUFNLENBQUMsQ0FBQyxFQUFFbk8sZ0JBQWdCLENBQUM0ZixnQkFBZ0IsQ0FBQzFOLEVBQUUsQ0FBQztJQUNwRSxPQUFPeU4sS0FBSztFQUNkOztFQUVBLE9BQU9DLGdCQUFnQkEsQ0FBQzFOLEVBQUUsRUFBRTtJQUMxQixJQUFBM1EsZUFBTSxFQUFDMlEsRUFBRSxZQUFZVyx1QkFBYyxDQUFDO0lBQ3BDLE9BQU9YLEVBQUU7RUFDWDs7RUFFQSxPQUFPdEYsZUFBZUEsQ0FBQ2lULE9BQU8sRUFBRTtJQUM5QixJQUFJQSxPQUFPLENBQUN6UyxlQUFlLENBQUMsQ0FBQyxFQUFFO01BQzdCLEtBQUssSUFBSTBTLFVBQVUsSUFBSUQsT0FBTyxDQUFDelMsZUFBZSxDQUFDLENBQUMsRUFBRW5OLGtDQUFnQixDQUFDMk4sa0JBQWtCLENBQUNrUyxVQUFVLENBQUM7SUFDbkc7SUFDQSxPQUFPRCxPQUFPO0VBQ2hCOztFQUVBLE9BQU9FLGlCQUFpQkEsQ0FBQ3JSLGFBQWEsRUFBRTtJQUN0QyxJQUFJc1IsVUFBVSxHQUFHbmIsSUFBSSxDQUFDUyxLQUFLLENBQUNaLGlCQUFRLENBQUNtSCxnQkFBZ0IsQ0FBQzZDLGFBQWEsQ0FBQyxDQUFDO0lBQ3JFLElBQUl1UixrQkFBdUIsR0FBRyxDQUFDLENBQUM7SUFDaENBLGtCQUFrQixDQUFDQyxNQUFNLEdBQUcsRUFBRTtJQUM5QixJQUFJRixVQUFVLENBQUNFLE1BQU0sRUFBRSxLQUFLLElBQUlDLFNBQVMsSUFBSUgsVUFBVSxDQUFDRSxNQUFNLEVBQUVELGtCQUFrQixDQUFDQyxNQUFNLENBQUN0WixJQUFJLENBQUM1RyxnQkFBZ0IsQ0FBQzBmLGFBQWEsQ0FBQyxJQUFJVSxvQkFBVyxDQUFDRCxTQUFTLEVBQUVDLG9CQUFXLENBQUNDLG1CQUFtQixDQUFDQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBQ3JNLE9BQU9MLGtCQUFrQjtFQUMzQjs7RUFFQSxPQUFPdFIsY0FBY0EsQ0FBQ1AsS0FBSyxFQUFFTSxhQUFhLEVBQUU7O0lBRTFDO0lBQ0EsSUFBSXVSLGtCQUFrQixHQUFHamdCLGdCQUFnQixDQUFDK2YsaUJBQWlCLENBQUNyUixhQUFhLENBQUM7SUFDMUUsSUFBSXdSLE1BQU0sR0FBR0Qsa0JBQWtCLENBQUNDLE1BQU07O0lBRXRDO0lBQ0EsSUFBSWxPLEdBQUcsR0FBRyxFQUFFO0lBQ1osS0FBSyxJQUFJMk4sS0FBSyxJQUFJTyxNQUFNLEVBQUU7TUFDeEJsZ0IsZ0JBQWdCLENBQUMwZixhQUFhLENBQUNDLEtBQUssQ0FBQztNQUNyQyxLQUFLLElBQUl6TixFQUFFLElBQUl5TixLQUFLLENBQUN4UixNQUFNLENBQUMsQ0FBQyxFQUFFO1FBQzdCLElBQUl3UixLQUFLLENBQUMzVyxTQUFTLENBQUMsQ0FBQyxLQUFLbkksU0FBUyxFQUFFcVIsRUFBRSxDQUFDcU8sUUFBUSxDQUFDMWYsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUM3RG1SLEdBQUcsQ0FBQ3BMLElBQUksQ0FBQ3NMLEVBQUUsQ0FBQztNQUNkO0lBQ0Y7O0lBRUE7SUFDQSxJQUFJOUQsS0FBSyxDQUFDb1MsU0FBUyxDQUFDLENBQUMsS0FBSzNmLFNBQVMsRUFBRTtNQUNuQyxJQUFJNGYsS0FBSyxHQUFHLElBQUlDLEdBQUcsQ0FBQyxDQUFDO01BQ3JCLEtBQUssSUFBSXhPLEVBQUUsSUFBSUYsR0FBRyxFQUFFeU8sS0FBSyxDQUFDdk8sRUFBRSxDQUFDeU8sT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHek8sRUFBRTtNQUM1QyxJQUFJME8sU0FBUyxHQUFHLEVBQUU7TUFDbEIsS0FBSyxJQUFJL0wsTUFBTSxJQUFJekcsS0FBSyxDQUFDb1MsU0FBUyxDQUFDLENBQUMsRUFBRSxJQUFJQyxLQUFLLENBQUM1TCxNQUFNLENBQUMsS0FBS2hVLFNBQVMsRUFBRStmLFNBQVMsQ0FBQ2hhLElBQUksQ0FBQzZaLEtBQUssQ0FBQzVMLE1BQU0sQ0FBQyxDQUFDO01BQ3BHN0MsR0FBRyxHQUFHNE8sU0FBUztJQUNqQjs7SUFFQSxPQUFPNU8sR0FBRztFQUNaOztFQUVBLE9BQU9oRCxvQkFBb0JBLENBQUNaLEtBQUssRUFBRU0sYUFBYSxFQUFFOztJQUVoRDtJQUNBLElBQUl1UixrQkFBa0IsR0FBR2pnQixnQkFBZ0IsQ0FBQytmLGlCQUFpQixDQUFDclIsYUFBYSxDQUFDO0lBQzFFLElBQUl3UixNQUFNLEdBQUdELGtCQUFrQixDQUFDQyxNQUFNOztJQUV0QztJQUNBLElBQUlXLFNBQVMsR0FBRyxFQUFFO0lBQ2xCLEtBQUssSUFBSWxCLEtBQUssSUFBSU8sTUFBTSxFQUFFO01BQ3hCLEtBQUssSUFBSWhPLEVBQUUsSUFBSXlOLEtBQUssQ0FBQ3hSLE1BQU0sQ0FBQyxDQUFDLEVBQUU7UUFDN0IsSUFBSXdSLEtBQUssQ0FBQzNXLFNBQVMsQ0FBQyxDQUFDLEtBQUtuSSxTQUFTLEVBQUVxUixFQUFFLENBQUNxTyxRQUFRLENBQUMxZixTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQzdELElBQUlxUixFQUFFLENBQUM0TyxtQkFBbUIsQ0FBQyxDQUFDLEtBQUtqZ0IsU0FBUyxFQUFFZ2dCLFNBQVMsQ0FBQ2phLElBQUksQ0FBQ3NMLEVBQUUsQ0FBQzRPLG1CQUFtQixDQUFDLENBQUMsQ0FBQztRQUNwRixJQUFJNU8sRUFBRSxDQUFDb0wsb0JBQW9CLENBQUMsQ0FBQyxLQUFLemMsU0FBUyxFQUFFO1VBQzNDLEtBQUssSUFBSWtnQixRQUFRLElBQUk3TyxFQUFFLENBQUNvTCxvQkFBb0IsQ0FBQyxDQUFDLEVBQUV1RCxTQUFTLENBQUNqYSxJQUFJLENBQUNtYSxRQUFRLENBQUM7UUFDMUU7TUFDRjtJQUNGOztJQUVBLE9BQU9GLFNBQVM7RUFDbEI7O0VBRUEsT0FBT3pSLGtCQUFrQkEsQ0FBQ2hCLEtBQUssRUFBRU0sYUFBYSxFQUFFOztJQUU5QztJQUNBLElBQUl1UixrQkFBa0IsR0FBR2pnQixnQkFBZ0IsQ0FBQytmLGlCQUFpQixDQUFDclIsYUFBYSxDQUFDO0lBQzFFLElBQUl3UixNQUFNLEdBQUdELGtCQUFrQixDQUFDQyxNQUFNOztJQUV0QztJQUNBLElBQUljLE9BQU8sR0FBRyxFQUFFO0lBQ2hCLEtBQUssSUFBSXJCLEtBQUssSUFBSU8sTUFBTSxFQUFFO01BQ3hCLEtBQUssSUFBSWhPLEVBQUUsSUFBSXlOLEtBQUssQ0FBQ3hSLE1BQU0sQ0FBQyxDQUFDLEVBQUU7UUFDN0IsS0FBSyxJQUFJOFMsTUFBTSxJQUFJL08sRUFBRSxDQUFDakQsVUFBVSxDQUFDLENBQUMsRUFBRStSLE9BQU8sQ0FBQ3BhLElBQUksQ0FBQ3FhLE1BQU0sQ0FBQztNQUMxRDtJQUNGOztJQUVBLE9BQU9ELE9BQU87RUFDaEI7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtFQUNZRSxrQkFBa0JBLENBQUM3QyxlQUFlLEVBQUU7SUFDNUMsSUFBSSxDQUFDQSxlQUFlLEdBQUdBLGVBQWU7RUFDeEM7O0VBRUEsYUFBYTdYLE1BQU1BLENBQUNuRyxJQUFJLEVBQUVxRCxNQUFNLEVBQUU7SUFDaEMsSUFBSSxNQUFNQSxNQUFNLENBQUN5ZCxRQUFRLENBQUMsQ0FBQyxFQUFFLE1BQU0sSUFBSTNmLG9CQUFXLENBQUMsa0JBQWtCLENBQUM7SUFDdEUsSUFBSSxDQUFDbkIsSUFBSSxFQUFFLE1BQU0sSUFBSW1CLG9CQUFXLENBQUMseUNBQXlDLENBQUM7O0lBRTNFO0lBQ0EsSUFBSTRmLGFBQUksQ0FBQ0MsU0FBUyxDQUFDM2QsTUFBTSxDQUFDckQsSUFBSSxDQUFDLEtBQUsrZ0IsYUFBSSxDQUFDQyxTQUFTLENBQUNoaEIsSUFBSSxDQUFDLEVBQUU7TUFDeEQsTUFBTXFELE1BQU0sQ0FBQ3NCLElBQUksQ0FBQyxDQUFDO01BQ25CO0lBQ0Y7O0lBRUE7SUFDQSxJQUFJc2MsU0FBUyxHQUFHRixhQUFJLENBQUNHLE9BQU8sQ0FBQ2xoQixJQUFJLENBQUM7SUFDbEMsSUFBSSxDQUFDcUQsTUFBTSxDQUFDbkQsRUFBRSxDQUFDbUIsVUFBVSxDQUFDNGYsU0FBUyxDQUFDLEVBQUU7TUFDcEMsSUFBSSxDQUFFNWQsTUFBTSxDQUFDbkQsRUFBRSxDQUFDaWhCLFNBQVMsQ0FBQ0YsU0FBUyxDQUFDLENBQUU7TUFDdEMsT0FBTzVZLEdBQVEsRUFBRSxDQUFFLE1BQU0sSUFBSWxILG9CQUFXLENBQUMsbUJBQW1CLEdBQUduQixJQUFJLEdBQUcseUNBQXlDLEdBQUdxSSxHQUFHLENBQUNDLE9BQU8sQ0FBQyxDQUFFO0lBQ2xJOztJQUVBO0lBQ0EsSUFBSThZLElBQUksR0FBRyxNQUFNL2QsTUFBTSxDQUFDOFgsT0FBTyxDQUFDLENBQUM7SUFDakM5WCxNQUFNLENBQUNuRCxFQUFFLENBQUNtaEIsYUFBYSxDQUFDcmhCLElBQUksR0FBRyxPQUFPLEVBQUVvaEIsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQztJQUMxRC9kLE1BQU0sQ0FBQ25ELEVBQUUsQ0FBQ21oQixhQUFhLENBQUNyaEIsSUFBSSxFQUFFb2hCLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUM7SUFDaEQvZCxNQUFNLENBQUNuRCxFQUFFLENBQUNtaEIsYUFBYSxDQUFDcmhCLElBQUksR0FBRyxjQUFjLEVBQUUsTUFBTXFELE1BQU0sQ0FBQ3ZCLGlCQUFpQixDQUFDLENBQUMsQ0FBQztJQUNoRixJQUFJd2YsT0FBTyxHQUFHamUsTUFBTSxDQUFDckQsSUFBSTtJQUN6QnFELE1BQU0sQ0FBQ3JELElBQUksR0FBR0EsSUFBSTs7SUFFbEI7SUFDQSxJQUFJc2hCLE9BQU8sRUFBRTtNQUNYamUsTUFBTSxDQUFDbkQsRUFBRSxDQUFDcWhCLFVBQVUsQ0FBQ0QsT0FBTyxHQUFHLGNBQWMsQ0FBQztNQUM5Q2plLE1BQU0sQ0FBQ25ELEVBQUUsQ0FBQ3FoQixVQUFVLENBQUNELE9BQU8sR0FBRyxPQUFPLENBQUM7TUFDdkNqZSxNQUFNLENBQUNuRCxFQUFFLENBQUNxaEIsVUFBVSxDQUFDRCxPQUFPLENBQUM7SUFDL0I7RUFDRjs7RUFFQSxhQUFhM2MsSUFBSUEsQ0FBQ3RCLE1BQVcsRUFBRTtJQUM3QixJQUFJLE1BQU1BLE1BQU0sQ0FBQ3lkLFFBQVEsQ0FBQyxDQUFDLEVBQUUsTUFBTSxJQUFJM2Ysb0JBQVcsQ0FBQyxrQkFBa0IsQ0FBQzs7SUFFdEU7SUFDQSxJQUFJbkIsSUFBSSxHQUFHLE1BQU1xRCxNQUFNLENBQUNoQixPQUFPLENBQUMsQ0FBQztJQUNqQyxJQUFJLENBQUNyQyxJQUFJLEVBQUUsTUFBTSxJQUFJbUIsb0JBQVcsQ0FBQyw0Q0FBNEMsQ0FBQzs7SUFFOUU7SUFDQSxJQUFJcWdCLE9BQU8sR0FBR3hoQixJQUFJLEdBQUcsTUFBTTtJQUMzQixJQUFJb2hCLElBQUksR0FBRyxNQUFNL2QsTUFBTSxDQUFDOFgsT0FBTyxDQUFDLENBQUM7SUFDakM5WCxNQUFNLENBQUNuRCxFQUFFLENBQUNtaEIsYUFBYSxDQUFDRyxPQUFPLEdBQUcsT0FBTyxFQUFFSixJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDO0lBQzdEL2QsTUFBTSxDQUFDbkQsRUFBRSxDQUFDbWhCLGFBQWEsQ0FBQ0csT0FBTyxFQUFFSixJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDO0lBQ25EL2QsTUFBTSxDQUFDbkQsRUFBRSxDQUFDbWhCLGFBQWEsQ0FBQ0csT0FBTyxHQUFHLGNBQWMsRUFBRSxNQUFNbmUsTUFBTSxDQUFDdkIsaUJBQWlCLENBQUMsQ0FBQyxDQUFDOztJQUVuRjtJQUNBdUIsTUFBTSxDQUFDbkQsRUFBRSxDQUFDdWhCLFVBQVUsQ0FBQ0QsT0FBTyxHQUFHLE9BQU8sRUFBRXhoQixJQUFJLEdBQUcsT0FBTyxDQUFDO0lBQ3ZEcUQsTUFBTSxDQUFDbkQsRUFBRSxDQUFDdWhCLFVBQVUsQ0FBQ0QsT0FBTyxFQUFFeGhCLElBQUksRUFBRUEsSUFBSSxHQUFHLE9BQU8sQ0FBQztJQUNuRHFELE1BQU0sQ0FBQ25ELEVBQUUsQ0FBQ3VoQixVQUFVLENBQUNELE9BQU8sR0FBRyxjQUFjLEVBQUV4aEIsSUFBSSxHQUFHLGNBQWMsRUFBRUEsSUFBSSxHQUFHLE9BQU8sQ0FBQztFQUN2RjtBQUNGOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsR0FKQTBoQixPQUFBLENBQUFDLE9BQUEsR0FBQWhpQixnQkFBQTtBQUtBLE1BQU0yRCxxQkFBcUIsU0FBU3NlLHVDQUFxQixDQUFDOztFQUV4RDs7Ozs7RUFLQTs7RUFFQSxhQUFhbmYsY0FBY0EsQ0FBQ2pCLE1BQW1DLEVBQUU7SUFDL0QsSUFBSXFnQixRQUFRLEdBQUd4ZCxpQkFBUSxDQUFDQyxPQUFPLENBQUMsQ0FBQztJQUNqQyxJQUFJOUMsTUFBTSxDQUFDdkIsUUFBUSxLQUFLTyxTQUFTLEVBQUVnQixNQUFNLENBQUN2QixRQUFRLEdBQUcsRUFBRTtJQUN2RCxJQUFJMEQsZ0JBQWdCLEdBQUduQyxNQUFNLENBQUMwQixTQUFTLENBQUMsQ0FBQztJQUN6QyxNQUFNbkMscUJBQVksQ0FBQytnQixZQUFZLENBQUNELFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxDQUFDcmdCLE1BQU0sQ0FBQ3hCLElBQUksRUFBRXdCLE1BQU0sQ0FBQ3ZCLFFBQVEsRUFBRXVCLE1BQU0sQ0FBQ2ljLFdBQVcsRUFBRWpjLE1BQU0sQ0FBQ3NjLFFBQVEsRUFBRXRjLE1BQU0sQ0FBQ3VjLFNBQVMsRUFBRXBhLGdCQUFnQixHQUFHQSxnQkFBZ0IsQ0FBQ2UsTUFBTSxDQUFDLENBQUMsR0FBR2xFLFNBQVMsQ0FBQyxDQUFDO0lBQzVNLElBQUk2QyxNQUFNLEdBQUcsSUFBSUMscUJBQXFCLENBQUN1ZSxRQUFRLEVBQUUsTUFBTTlnQixxQkFBWSxDQUFDZ2hCLFNBQVMsQ0FBQyxDQUFDLEVBQUV2Z0IsTUFBTSxDQUFDeEIsSUFBSSxFQUFFd0IsTUFBTSxDQUFDakIsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUM3RyxJQUFJaUIsTUFBTSxDQUFDeEIsSUFBSSxFQUFFLE1BQU1xRCxNQUFNLENBQUNzQixJQUFJLENBQUMsQ0FBQztJQUNwQyxPQUFPdEIsTUFBTTtFQUNmOztFQUVBLGFBQWFYLFlBQVlBLENBQUNsQixNQUFNLEVBQUU7SUFDaEMsSUFBSUEsTUFBTSxDQUFDYSxPQUFPLENBQUMsQ0FBQyxJQUFJMUMsZ0JBQWdCLENBQUNzQixZQUFZLENBQUNPLE1BQU0sQ0FBQ2EsT0FBTyxDQUFDLENBQUMsRUFBRWIsTUFBTSxDQUFDakIsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sSUFBSVksb0JBQVcsQ0FBQyx5QkFBeUIsR0FBR0ssTUFBTSxDQUFDYSxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQzVKLElBQUl3ZixRQUFRLEdBQUd4ZCxpQkFBUSxDQUFDQyxPQUFPLENBQUMsQ0FBQztJQUNqQyxNQUFNdkQscUJBQVksQ0FBQytnQixZQUFZLENBQUNELFFBQVEsRUFBRSxrQkFBa0IsRUFBRSxDQUFDcmdCLE1BQU0sQ0FBQ2tELE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNoRixJQUFJckIsTUFBTSxHQUFHLElBQUlDLHFCQUFxQixDQUFDdWUsUUFBUSxFQUFFLE1BQU05Z0IscUJBQVksQ0FBQ2doQixTQUFTLENBQUMsQ0FBQyxFQUFFdmdCLE1BQU0sQ0FBQ2EsT0FBTyxDQUFDLENBQUMsRUFBRWIsTUFBTSxDQUFDakIsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUNsSCxJQUFJaUIsTUFBTSxDQUFDYSxPQUFPLENBQUMsQ0FBQyxFQUFFLE1BQU1nQixNQUFNLENBQUNzQixJQUFJLENBQUMsQ0FBQztJQUN6QyxPQUFPdEIsTUFBTTtFQUNmOztFQUVBOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFdkQsV0FBV0EsQ0FBQytoQixRQUFRLEVBQUVHLE1BQU0sRUFBRWhpQixJQUFJLEVBQUVFLEVBQUUsRUFBRTtJQUN0QyxLQUFLLENBQUMyaEIsUUFBUSxFQUFFRyxNQUFNLENBQUM7SUFDdkIsSUFBSSxDQUFDaGlCLElBQUksR0FBR0EsSUFBSTtJQUNoQixJQUFJLENBQUNFLEVBQUUsR0FBR0EsRUFBRSxHQUFHQSxFQUFFLEdBQUlGLElBQUksR0FBR0wsZ0JBQWdCLENBQUNZLEtBQUssQ0FBQyxDQUFDLEdBQUdDLFNBQVU7SUFDakUsSUFBSSxDQUFDeWhCLGdCQUFnQixHQUFHLEVBQUU7RUFDNUI7O0VBRUE1ZixPQUFPQSxDQUFBLEVBQUc7SUFDUixPQUFPLElBQUksQ0FBQ3JDLElBQUk7RUFDbEI7O0VBRUEsTUFBTTJDLGNBQWNBLENBQUEsRUFBRztJQUNyQixPQUFPLElBQUksQ0FBQ21mLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBQztFQUM1Qzs7RUFFQSxNQUFNbFUsa0JBQWtCQSxDQUFDM0MsVUFBVSxFQUFFQyxhQUFhLEVBQUUyQixLQUFLLEVBQUU7SUFDekQsT0FBTyxJQUFJLENBQUNpVixZQUFZLENBQUMsb0JBQW9CLEVBQUUxUCxLQUFLLENBQUNnSyxJQUFJLENBQUM4RixTQUFTLENBQUMsQ0FBQztFQUN2RTs7RUFFQSxNQUFNcGIsbUJBQW1CQSxDQUFDcWIsa0JBQWtCLEVBQUU7SUFDNUMsSUFBSSxDQUFDQSxrQkFBa0IsRUFBRSxNQUFNLElBQUksQ0FBQ0wsWUFBWSxDQUFDLHFCQUFxQixDQUFDLENBQUM7SUFDbkU7TUFDSCxJQUFJOWEsVUFBVSxHQUFHLENBQUNtYixrQkFBa0IsR0FBRzNoQixTQUFTLEdBQUcyaEIsa0JBQWtCLFlBQVlsYiw0QkFBbUIsR0FBR2tiLGtCQUFrQixHQUFHLElBQUlsYiw0QkFBbUIsQ0FBQ2tiLGtCQUFrQixDQUFDO01BQ3ZLLE1BQU0sSUFBSSxDQUFDTCxZQUFZLENBQUMscUJBQXFCLEVBQUU5YSxVQUFVLEdBQUdBLFVBQVUsQ0FBQ29iLFNBQVMsQ0FBQyxDQUFDLEdBQUc1aEIsU0FBUyxDQUFDO0lBQ2pHO0VBQ0Y7O0VBRUEsTUFBTStHLG1CQUFtQkEsQ0FBQSxFQUFHO0lBQzFCLElBQUk4YSxTQUFTLEdBQUcsTUFBTSxJQUFJLENBQUNQLFlBQVksQ0FBQyxxQkFBcUIsQ0FBQztJQUM5RCxPQUFPTyxTQUFTLEdBQUcsSUFBSXBiLDRCQUFtQixDQUFDb2IsU0FBUyxDQUFDLEdBQUc3aEIsU0FBUztFQUNuRTs7RUFFQSxNQUFNbUgsbUJBQW1CQSxDQUFBLEVBQUc7SUFDMUIsT0FBTyxJQUFJLENBQUNtYSxZQUFZLENBQUMscUJBQXFCLENBQUM7RUFDakQ7O0VBRUEsTUFBTTdmLGdCQUFnQkEsQ0FBQSxFQUFHO0lBQ3ZCLE9BQU8sSUFBSSxDQUFDNmYsWUFBWSxDQUFDLGtCQUFrQixDQUFDO0VBQzlDOztFQUVBLE1BQU1qZSxnQkFBZ0JBLENBQUNvQyxhQUFhLEVBQUU7SUFDcEMsT0FBTyxJQUFJLENBQUM2YixZQUFZLENBQUMsa0JBQWtCLEVBQUUsQ0FBQzdiLGFBQWEsQ0FBQyxDQUFDO0VBQy9EOztFQUVBLE1BQU00QyxlQUFlQSxDQUFBLEVBQUc7SUFDdEIsT0FBTyxJQUFJLENBQUNpWixZQUFZLENBQUMsaUJBQWlCLENBQUM7RUFDN0M7O0VBRUEsTUFBTXhjLHNCQUFzQkEsQ0FBQSxFQUFHO0lBQzdCLE9BQU8sSUFBSSxDQUFDd2MsWUFBWSxDQUFDLHdCQUF3QixDQUFDO0VBQ3BEOztFQUVBLE1BQU0vWSxlQUFlQSxDQUFDQyxJQUFJLEVBQUVDLEtBQUssRUFBRUMsR0FBRyxFQUFFO0lBQ3RDLE9BQU8sSUFBSSxDQUFDNFksWUFBWSxDQUFDLGlCQUFpQixFQUFFLENBQUM5WSxJQUFJLEVBQUVDLEtBQUssRUFBRUMsR0FBRyxDQUFDLENBQUM7RUFDakU7O0VBRUEsTUFBTXZELGNBQWNBLENBQUEsRUFBRztJQUNyQixPQUFPLElBQUksQ0FBQ21jLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBQztFQUM1Qzs7RUFFQSxNQUFNblosU0FBU0EsQ0FBQSxFQUFHO0lBQ2hCLE9BQU8sSUFBSSxDQUFDbVosWUFBWSxDQUFDLFdBQVcsQ0FBQztFQUN2Qzs7RUFFQSxNQUFNMWIsV0FBV0EsQ0FBQ0MsUUFBUSxFQUFFO0lBQzFCLElBQUlpYyxlQUFlLEdBQUcsSUFBSUMsb0JBQW9CLENBQUNsYyxRQUFRLENBQUM7SUFDeEQsSUFBSW1jLFVBQVUsR0FBR0YsZUFBZSxDQUFDRyxLQUFLLENBQUMsQ0FBQztJQUN4QzFoQixxQkFBWSxDQUFDMmhCLGlCQUFpQixDQUFDLElBQUksQ0FBQ2IsUUFBUSxFQUFFLGlCQUFpQixHQUFHVyxVQUFVLEVBQUUsQ0FBQ0YsZUFBZSxDQUFDN0QsY0FBYyxFQUFFNkQsZUFBZSxDQUFDLENBQUM7SUFDaEl2aEIscUJBQVksQ0FBQzJoQixpQkFBaUIsQ0FBQyxJQUFJLENBQUNiLFFBQVEsRUFBRSxhQUFhLEdBQUdXLFVBQVUsRUFBRSxDQUFDRixlQUFlLENBQUM1RCxVQUFVLEVBQUU0RCxlQUFlLENBQUMsQ0FBQztJQUN4SHZoQixxQkFBWSxDQUFDMmhCLGlCQUFpQixDQUFDLElBQUksQ0FBQ2IsUUFBUSxFQUFFLG9CQUFvQixHQUFHVyxVQUFVLEVBQUUsQ0FBQ0YsZUFBZSxDQUFDekQsaUJBQWlCLEVBQUV5RCxlQUFlLENBQUMsQ0FBQztJQUN0SXZoQixxQkFBWSxDQUFDMmhCLGlCQUFpQixDQUFDLElBQUksQ0FBQ2IsUUFBUSxFQUFFLG1CQUFtQixHQUFHVyxVQUFVLEVBQUUsQ0FBQ0YsZUFBZSxDQUFDckQsZ0JBQWdCLEVBQUVxRCxlQUFlLENBQUMsQ0FBQztJQUNwSXZoQixxQkFBWSxDQUFDMmhCLGlCQUFpQixDQUFDLElBQUksQ0FBQ2IsUUFBUSxFQUFFLGdCQUFnQixHQUFHVyxVQUFVLEVBQUUsQ0FBQ0YsZUFBZSxDQUFDbEQsYUFBYSxFQUFFa0QsZUFBZSxDQUFDLENBQUM7SUFDOUgsSUFBSSxDQUFDTCxnQkFBZ0IsQ0FBQzFiLElBQUksQ0FBQytiLGVBQWUsQ0FBQztJQUMzQyxPQUFPLElBQUksQ0FBQ1IsWUFBWSxDQUFDLGFBQWEsRUFBRSxDQUFDVSxVQUFVLENBQUMsQ0FBQztFQUN2RDs7RUFFQSxNQUFNL2IsY0FBY0EsQ0FBQ0osUUFBUSxFQUFFO0lBQzdCLEtBQUssSUFBSXVWLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBRyxJQUFJLENBQUNxRyxnQkFBZ0IsQ0FBQzlNLE1BQU0sRUFBRXlHLENBQUMsRUFBRSxFQUFFO01BQ3JELElBQUksSUFBSSxDQUFDcUcsZ0JBQWdCLENBQUNyRyxDQUFDLENBQUMsQ0FBQytHLFdBQVcsQ0FBQyxDQUFDLEtBQUt0YyxRQUFRLEVBQUU7UUFDdkQsSUFBSW1jLFVBQVUsR0FBRyxJQUFJLENBQUNQLGdCQUFnQixDQUFDckcsQ0FBQyxDQUFDLENBQUM2RyxLQUFLLENBQUMsQ0FBQztRQUNqRCxNQUFNLElBQUksQ0FBQ1gsWUFBWSxDQUFDLGdCQUFnQixFQUFFLENBQUNVLFVBQVUsQ0FBQyxDQUFDO1FBQ3ZEemhCLHFCQUFZLENBQUM2aEIsb0JBQW9CLENBQUMsSUFBSSxDQUFDZixRQUFRLEVBQUUsaUJBQWlCLEdBQUdXLFVBQVUsQ0FBQztRQUNoRnpoQixxQkFBWSxDQUFDNmhCLG9CQUFvQixDQUFDLElBQUksQ0FBQ2YsUUFBUSxFQUFFLGFBQWEsR0FBR1csVUFBVSxDQUFDO1FBQzVFemhCLHFCQUFZLENBQUM2aEIsb0JBQW9CLENBQUMsSUFBSSxDQUFDZixRQUFRLEVBQUUsb0JBQW9CLEdBQUdXLFVBQVUsQ0FBQztRQUNuRnpoQixxQkFBWSxDQUFDNmhCLG9CQUFvQixDQUFDLElBQUksQ0FBQ2YsUUFBUSxFQUFFLG1CQUFtQixHQUFHVyxVQUFVLENBQUM7UUFDbEZ6aEIscUJBQVksQ0FBQzZoQixvQkFBb0IsQ0FBQyxJQUFJLENBQUNmLFFBQVEsRUFBRSxnQkFBZ0IsR0FBR1csVUFBVSxDQUFDO1FBQy9FLElBQUksQ0FBQ1AsZ0JBQWdCLENBQUNyYixNQUFNLENBQUNnVixDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2xDO01BQ0Y7SUFDRjtJQUNBLE1BQU0sSUFBSXphLG9CQUFXLENBQUMsd0NBQXdDLENBQUM7RUFDakU7O0VBRUEwRixZQUFZQSxDQUFBLEVBQUc7SUFDYixJQUFJdkcsU0FBUyxHQUFHLEVBQUU7SUFDbEIsS0FBSyxJQUFJZ2lCLGVBQWUsSUFBSSxJQUFJLENBQUNMLGdCQUFnQixFQUFFM2hCLFNBQVMsQ0FBQ2lHLElBQUksQ0FBQytiLGVBQWUsQ0FBQ0ssV0FBVyxDQUFDLENBQUMsQ0FBQztJQUNoRyxPQUFPcmlCLFNBQVM7RUFDbEI7O0VBRUEsTUFBTXVGLFFBQVFBLENBQUEsRUFBRztJQUNmLE9BQU8sSUFBSSxDQUFDaWMsWUFBWSxDQUFDLFVBQVUsQ0FBQztFQUN0Qzs7RUFFQSxNQUFNMVksSUFBSUEsQ0FBQ0MscUJBQXFELEVBQUVDLFdBQW9CLEVBQUVDLG9CQUFvQixHQUFHLEtBQUssRUFBNkI7O0lBRS9JO0lBQ0FELFdBQVcsR0FBR0QscUJBQXFCLFlBQVkvQyw2QkFBb0IsR0FBR2dELFdBQVcsR0FBR0QscUJBQXFCO0lBQ3pHLElBQUloRCxRQUFRLEdBQUdnRCxxQkFBcUIsWUFBWS9DLDZCQUFvQixHQUFHK0MscUJBQXFCLEdBQUc3SSxTQUFTO0lBQ3hHLElBQUk4SSxXQUFXLEtBQUs5SSxTQUFTLEVBQUU4SSxXQUFXLEdBQUdFLElBQUksQ0FBQ0MsR0FBRyxDQUFDLE1BQU0sSUFBSSxDQUFDZCxTQUFTLENBQUMsQ0FBQyxFQUFFLE1BQU0sSUFBSSxDQUFDMUcsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDOztJQUU1RztJQUNBLElBQUlvRSxRQUFRLEVBQUUsTUFBTSxJQUFJLENBQUNELFdBQVcsQ0FBQ0MsUUFBUSxDQUFDOztJQUU5QztJQUNBLElBQUlnQyxHQUFHO0lBQ1AsSUFBSUosTUFBTTtJQUNWLElBQUk7TUFDRixJQUFJNGEsVUFBVSxHQUFHLE1BQU0sSUFBSSxDQUFDZixZQUFZLENBQUMsTUFBTSxFQUFFLENBQUN4WSxXQUFXLEVBQUVDLG9CQUFvQixDQUFDLENBQUM7TUFDckZ0QixNQUFNLEdBQUcsSUFBSTRCLHlCQUFnQixDQUFDZ1osVUFBVSxDQUFDL1ksZ0JBQWdCLEVBQUUrWSxVQUFVLENBQUM5WSxhQUFhLENBQUM7SUFDdEYsQ0FBQyxDQUFDLE9BQU9DLENBQUMsRUFBRTtNQUNWM0IsR0FBRyxHQUFHMkIsQ0FBQztJQUNUOztJQUVBO0lBQ0EsSUFBSTNELFFBQVEsRUFBRSxNQUFNLElBQUksQ0FBQ0ksY0FBYyxDQUFDSixRQUFRLENBQUM7O0lBRWpEO0lBQ0EsSUFBSWdDLEdBQUcsRUFBRSxNQUFNQSxHQUFHO0lBQ2xCLE9BQU9KLE1BQU07RUFDZjs7RUFFQSxNQUFNZ0MsWUFBWUEsQ0FBQ25KLGNBQWMsRUFBRTtJQUNqQyxPQUFPLElBQUksQ0FBQ2doQixZQUFZLENBQUMsY0FBYyxFQUFFMVAsS0FBSyxDQUFDZ0ssSUFBSSxDQUFDOEYsU0FBUyxDQUFDLENBQUM7RUFDakU7O0VBRUEsTUFBTTVYLFdBQVdBLENBQUEsRUFBRztJQUNsQixPQUFPLElBQUksQ0FBQ3dYLFlBQVksQ0FBQyxhQUFhLENBQUM7RUFDekM7O0VBRUEsTUFBTXJYLE9BQU9BLENBQUNDLFFBQVEsRUFBRTtJQUN0QixJQUFBeEosZUFBTSxFQUFDa1IsS0FBSyxDQUFDQyxPQUFPLENBQUMzSCxRQUFRLENBQUMsRUFBRSw2Q0FBNkMsQ0FBQztJQUM5RSxPQUFPLElBQUksQ0FBQ29YLFlBQVksQ0FBQyxTQUFTLEVBQUUsQ0FBQ3BYLFFBQVEsQ0FBQyxDQUFDO0VBQ2pEOztFQUVBLE1BQU1FLFdBQVdBLENBQUEsRUFBRztJQUNsQixPQUFPLElBQUksQ0FBQ2tYLFlBQVksQ0FBQyxhQUFhLENBQUM7RUFDekM7O0VBRUEsTUFBTWhYLGdCQUFnQkEsQ0FBQSxFQUFHO0lBQ3ZCLE9BQU8sSUFBSSxDQUFDZ1gsWUFBWSxDQUFDLGtCQUFrQixDQUFDO0VBQzlDOztFQUVBLE1BQU05VyxVQUFVQSxDQUFDQyxVQUFVLEVBQUVDLGFBQWEsRUFBRTtJQUMxQyxPQUFPSyxNQUFNLENBQUMsTUFBTSxJQUFJLENBQUN1VyxZQUFZLENBQUMsWUFBWSxFQUFFMVAsS0FBSyxDQUFDZ0ssSUFBSSxDQUFDOEYsU0FBUyxDQUFDLENBQUMsQ0FBQztFQUM3RTs7RUFFQSxNQUFNeFcsa0JBQWtCQSxDQUFDVCxVQUFVLEVBQUVDLGFBQWEsRUFBRTtJQUNsRCxJQUFJUyxrQkFBa0IsR0FBRyxNQUFNLElBQUksQ0FBQ21XLFlBQVksQ0FBQyxvQkFBb0IsRUFBRTFQLEtBQUssQ0FBQ2dLLElBQUksQ0FBQzhGLFNBQVMsQ0FBQyxDQUFDO0lBQzdGLE9BQU8zVyxNQUFNLENBQUNJLGtCQUFrQixDQUFDO0VBQ25DOztFQUVBLE1BQU1LLFdBQVdBLENBQUNDLG1CQUFtQixFQUFFQyxHQUFHLEVBQUU7SUFDMUMsSUFBSUcsUUFBUSxHQUFHLEVBQUU7SUFDakIsS0FBSyxJQUFJQyxXQUFXLElBQUssTUFBTSxJQUFJLENBQUN3VixZQUFZLENBQUMsYUFBYSxFQUFFMVAsS0FBSyxDQUFDZ0ssSUFBSSxDQUFDOEYsU0FBUyxDQUFDLENBQUMsRUFBRztNQUN2RjdWLFFBQVEsQ0FBQzlGLElBQUksQ0FBQzVHLGdCQUFnQixDQUFDNE0sZUFBZSxDQUFDLElBQUlDLHNCQUFhLENBQUNGLFdBQVcsQ0FBQyxDQUFDLENBQUM7SUFDakY7SUFDQSxPQUFPRCxRQUFRO0VBQ2pCOztFQUVBLE1BQU1JLFVBQVVBLENBQUN4QixVQUFVLEVBQUVnQixtQkFBbUIsRUFBRTtJQUNoRCxJQUFJSyxXQUFXLEdBQUcsTUFBTSxJQUFJLENBQUN3VixZQUFZLENBQUMsWUFBWSxFQUFFMVAsS0FBSyxDQUFDZ0ssSUFBSSxDQUFDOEYsU0FBUyxDQUFDLENBQUM7SUFDOUUsT0FBT3ZpQixnQkFBZ0IsQ0FBQzRNLGVBQWUsQ0FBQyxJQUFJQyxzQkFBYSxDQUFDRixXQUFXLENBQUMsQ0FBQztFQUN6RTs7RUFFQSxNQUFNTSxhQUFhQSxDQUFDQyxLQUFLLEVBQUU7SUFDekIsSUFBSVAsV0FBVyxHQUFHLE1BQU0sSUFBSSxDQUFDd1YsWUFBWSxDQUFDLGVBQWUsRUFBRTFQLEtBQUssQ0FBQ2dLLElBQUksQ0FBQzhGLFNBQVMsQ0FBQyxDQUFDO0lBQ2pGLE9BQU92aUIsZ0JBQWdCLENBQUM0TSxlQUFlLENBQUMsSUFBSUMsc0JBQWEsQ0FBQ0YsV0FBVyxDQUFDLENBQUM7RUFDekU7O0VBRUEsTUFBTVMsZUFBZUEsQ0FBQzlCLFVBQVUsRUFBRStCLGlCQUFpQixFQUFFO0lBQ25ELElBQUlLLFlBQVksR0FBRyxFQUFFO0lBQ3JCLEtBQUssSUFBSUMsY0FBYyxJQUFLLE1BQU0sSUFBSSxDQUFDd1UsWUFBWSxDQUFDLGlCQUFpQixFQUFFMVAsS0FBSyxDQUFDZ0ssSUFBSSxDQUFDOEYsU0FBUyxDQUFDLENBQUMsRUFBRztNQUM5RjdVLFlBQVksQ0FBQzlHLElBQUksQ0FBQzNHLGtDQUFnQixDQUFDMk4sa0JBQWtCLENBQUMsSUFBSUMseUJBQWdCLENBQUNGLGNBQWMsQ0FBQyxDQUFDLENBQUM7SUFDOUY7SUFDQSxPQUFPRCxZQUFZO0VBQ3JCOztFQUVBLE1BQU1JLGdCQUFnQkEsQ0FBQ3hDLFVBQVUsRUFBRTRCLEtBQUssRUFBRTtJQUN4QyxJQUFJUyxjQUFjLEdBQUcsTUFBTSxJQUFJLENBQUN3VSxZQUFZLENBQUMsa0JBQWtCLEVBQUUxUCxLQUFLLENBQUNnSyxJQUFJLENBQUM4RixTQUFTLENBQUMsQ0FBQztJQUN2RixPQUFPdGlCLGtDQUFnQixDQUFDMk4sa0JBQWtCLENBQUMsSUFBSUMseUJBQWdCLENBQUNGLGNBQWMsQ0FBQyxDQUFDO0VBQ2xGOztFQUVBLE1BQU1RLE1BQU1BLENBQUNDLEtBQUssRUFBRTtJQUNsQkEsS0FBSyxHQUFHRSxxQkFBWSxDQUFDQyxnQkFBZ0IsQ0FBQ0gsS0FBSyxDQUFDO0lBQzVDLElBQUluRSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUNrWSxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUMvVCxLQUFLLENBQUNLLFFBQVEsQ0FBQyxDQUFDLENBQUMxSixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDN0UsT0FBTy9FLGdCQUFnQixDQUFDMk8sY0FBYyxDQUFDUCxLQUFLLEVBQUV2SixJQUFJLENBQUNDLFNBQVMsQ0FBQyxFQUFDb2IsTUFBTSxFQUFFalcsUUFBUSxDQUFDaVcsTUFBTSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDNUY7O0VBRUEsTUFBTXRSLFlBQVlBLENBQUNSLEtBQUssRUFBRTtJQUN4QkEsS0FBSyxHQUFHRSxxQkFBWSxDQUFDTyxzQkFBc0IsQ0FBQ1QsS0FBSyxDQUFDO0lBQ2xELElBQUkrVSxVQUFVLEdBQUcsTUFBTSxJQUFJLENBQUNoQixZQUFZLENBQUMsY0FBYyxFQUFFLENBQUMvVCxLQUFLLENBQUNXLFVBQVUsQ0FBQyxDQUFDLENBQUNOLFFBQVEsQ0FBQyxDQUFDLENBQUMxSixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEcsT0FBTy9FLGdCQUFnQixDQUFDZ1Asb0JBQW9CLENBQUNaLEtBQUssRUFBRXZKLElBQUksQ0FBQ0MsU0FBUyxDQUFDLEVBQUNvYixNQUFNLEVBQUVpRCxVQUFVLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM3Rjs7RUFFQSxNQUFNbFUsVUFBVUEsQ0FBQ2IsS0FBSyxFQUFFO0lBQ3RCQSxLQUFLLEdBQUdFLHFCQUFZLENBQUNZLG9CQUFvQixDQUFDZCxLQUFLLENBQUM7SUFDaEQsSUFBSStVLFVBQVUsR0FBRyxNQUFNLElBQUksQ0FBQ2hCLFlBQVksQ0FBQyxZQUFZLEVBQUUsQ0FBQy9ULEtBQUssQ0FBQ1csVUFBVSxDQUFDLENBQUMsQ0FBQ04sUUFBUSxDQUFDLENBQUMsQ0FBQzFKLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNoRyxPQUFPL0UsZ0JBQWdCLENBQUNvUCxrQkFBa0IsQ0FBQ2hCLEtBQUssRUFBRXZKLElBQUksQ0FBQ0MsU0FBUyxDQUFDLEVBQUNvYixNQUFNLEVBQUVpRCxVQUFVLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUMzRjs7RUFFQSxNQUFNOVQsYUFBYUEsQ0FBQ0MsR0FBRyxFQUFFO0lBQ3ZCLE9BQU8sSUFBSSxDQUFDNlMsWUFBWSxDQUFDLGVBQWUsRUFBRSxDQUFDN1MsR0FBRyxDQUFDLENBQUM7RUFDbEQ7O0VBRUEsTUFBTUcsYUFBYUEsQ0FBQ0QsVUFBVSxFQUFFO0lBQzlCLE9BQU8sSUFBSSxDQUFDMlMsWUFBWSxDQUFDLGVBQWUsRUFBRSxDQUFDM1MsVUFBVSxDQUFDLENBQUM7RUFDekQ7O0VBRUEsTUFBTUksZUFBZUEsQ0FBQ04sR0FBRyxFQUFFO0lBQ3pCLElBQUlTLFNBQVMsR0FBRyxFQUFFO0lBQ2xCLEtBQUssSUFBSUMsWUFBWSxJQUFJLE1BQU0sSUFBSSxDQUFDbVMsWUFBWSxDQUFDLGNBQWMsRUFBRSxDQUFDN1MsR0FBRyxDQUFDLENBQUMsRUFBRVMsU0FBUyxDQUFDbkosSUFBSSxDQUFDLElBQUlxSix1QkFBYyxDQUFDRCxZQUFZLENBQUMsQ0FBQztJQUN6SCxPQUFPRCxTQUFTO0VBQ2xCOztFQUVBLE1BQU1HLGVBQWVBLENBQUNILFNBQVMsRUFBRTtJQUMvQixJQUFJcVQsYUFBYSxHQUFHLEVBQUU7SUFDdEIsS0FBSyxJQUFJL1MsUUFBUSxJQUFJTixTQUFTLEVBQUVxVCxhQUFhLENBQUN4YyxJQUFJLENBQUN5SixRQUFRLENBQUN0TCxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ3JFLE9BQU8sSUFBSXdMLG1DQUEwQixDQUFDLE1BQU0sSUFBSSxDQUFDNFIsWUFBWSxDQUFDLGlCQUFpQixFQUFFLENBQUNpQixhQUFhLENBQUMsQ0FBQyxDQUFDO0VBQ3BHOztFQUVBLE1BQU01Uyw2QkFBNkJBLENBQUEsRUFBOEI7SUFDL0QsTUFBTSxJQUFJaFAsb0JBQVcsQ0FBQyxrRUFBa0UsQ0FBQztFQUMzRjs7RUFFQSxNQUFNaVAsWUFBWUEsQ0FBQ0osUUFBUSxFQUFFO0lBQzNCLE9BQU8sSUFBSSxDQUFDOFIsWUFBWSxDQUFDLGNBQWMsRUFBRSxDQUFDOVIsUUFBUSxDQUFDLENBQUM7RUFDdEQ7O0VBRUEsTUFBTU0sVUFBVUEsQ0FBQ04sUUFBUSxFQUFFO0lBQ3pCLE9BQU8sSUFBSSxDQUFDOFIsWUFBWSxDQUFDLFlBQVksRUFBRSxDQUFDOVIsUUFBUSxDQUFDLENBQUM7RUFDcEQ7O0VBRUEsTUFBTVEsY0FBY0EsQ0FBQ1IsUUFBUSxFQUFFO0lBQzdCLE9BQU8sSUFBSSxDQUFDOFIsWUFBWSxDQUFDLGdCQUFnQixFQUFFLENBQUM5UixRQUFRLENBQUMsQ0FBQztFQUN4RDs7RUFFQSxNQUFNVSxTQUFTQSxDQUFDbFAsTUFBTSxFQUFFO0lBQ3RCQSxNQUFNLEdBQUd5TSxxQkFBWSxDQUFDMkMsd0JBQXdCLENBQUNwUCxNQUFNLENBQUM7SUFDdEQsSUFBSWtRLFNBQVMsR0FBRyxNQUFNLElBQUksQ0FBQ29RLFlBQVksQ0FBQyxXQUFXLEVBQUUsQ0FBQ3RnQixNQUFNLENBQUNrRCxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdkUsT0FBTyxJQUFJdU0sb0JBQVcsQ0FBQ1MsU0FBUyxDQUFDLENBQUM1RCxNQUFNLENBQUMsQ0FBQztFQUM1Qzs7RUFFQSxNQUFNb0QsV0FBV0EsQ0FBQzFQLE1BQU0sRUFBRTtJQUN4QkEsTUFBTSxHQUFHeU0scUJBQVksQ0FBQ2tELDBCQUEwQixDQUFDM1AsTUFBTSxDQUFDO0lBQ3hELElBQUlrUSxTQUFTLEdBQUcsTUFBTSxJQUFJLENBQUNvUSxZQUFZLENBQUMsYUFBYSxFQUFFLENBQUN0Z0IsTUFBTSxDQUFDa0QsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3pFLE9BQU8sSUFBSXVNLG9CQUFXLENBQUNTLFNBQVMsQ0FBQyxDQUFDNUQsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDL0M7O0VBRUEsTUFBTXVELGFBQWFBLENBQUM3UCxNQUFNLEVBQUU7SUFDMUJBLE1BQU0sR0FBR3lNLHFCQUFZLENBQUNxRCw0QkFBNEIsQ0FBQzlQLE1BQU0sQ0FBQztJQUMxRCxJQUFJZ1EsVUFBVSxHQUFHLE1BQU0sSUFBSSxDQUFDc1EsWUFBWSxDQUFDLGVBQWUsRUFBRSxDQUFDdGdCLE1BQU0sQ0FBQ2tELE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1RSxJQUFJaU4sR0FBRyxHQUFHLEVBQUU7SUFDWixLQUFLLElBQUlELFNBQVMsSUFBSUYsVUFBVSxFQUFFLEtBQUssSUFBSUssRUFBRSxJQUFJLElBQUlaLG9CQUFXLENBQUNTLFNBQVMsQ0FBQyxDQUFDNUQsTUFBTSxDQUFDLENBQUMsRUFBRTZELEdBQUcsQ0FBQ3BMLElBQUksQ0FBQ3NMLEVBQUUsQ0FBQztJQUNsRyxPQUFPRixHQUFHO0VBQ1o7O0VBRUEsTUFBTUcsU0FBU0EsQ0FBQ0MsS0FBSyxFQUFFO0lBQ3JCLE9BQU8sSUFBSWQsb0JBQVcsQ0FBQyxNQUFNLElBQUksQ0FBQzZRLFlBQVksQ0FBQyxXQUFXLEVBQUUsQ0FBQy9QLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQ2pFLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRTtFQUN0Rjs7RUFFQSxNQUFNb0UsUUFBUUEsQ0FBQ0MsY0FBYyxFQUFFO0lBQzdCLElBQUFqUixlQUFNLEVBQUNrUixLQUFLLENBQUNDLE9BQU8sQ0FBQ0YsY0FBYyxDQUFDLEVBQUUseURBQXlELENBQUM7SUFDaEcsSUFBSUcsV0FBVyxHQUFHLEVBQUU7SUFDcEIsS0FBSyxJQUFJQyxZQUFZLElBQUlKLGNBQWMsRUFBRUcsV0FBVyxDQUFDL0wsSUFBSSxDQUFDZ00sWUFBWSxZQUFZQyx1QkFBYyxHQUFHRCxZQUFZLENBQUNFLFdBQVcsQ0FBQyxDQUFDLEdBQUdGLFlBQVksQ0FBQztJQUM3SSxPQUFPLElBQUksQ0FBQ3VQLFlBQVksQ0FBQyxVQUFVLEVBQUUsQ0FBQ3hQLFdBQVcsQ0FBQyxDQUFDO0VBQ3JEOztFQUVBLE1BQU1NLGFBQWFBLENBQUNoQixLQUFLLEVBQUU7SUFDekIsT0FBTyxJQUFJWCxvQkFBVyxDQUFDLE1BQU0sSUFBSSxDQUFDNlEsWUFBWSxDQUFDLGVBQWUsRUFBRSxDQUFDbFEsS0FBSyxDQUFDbE4sTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEY7O0VBRUEsTUFBTTJPLE9BQU9BLENBQUNSLGFBQWEsRUFBRTtJQUMzQixPQUFPLElBQUk1QixvQkFBVyxDQUFDLE1BQU0sSUFBSSxDQUFDNlEsWUFBWSxDQUFDLFNBQVMsRUFBRTFQLEtBQUssQ0FBQ2dLLElBQUksQ0FBQzhGLFNBQVMsQ0FBQyxDQUFDLENBQUM7RUFDbkY7O0VBRUEsTUFBTTNPLFNBQVNBLENBQUNSLFdBQVcsRUFBRTtJQUMzQixPQUFPLElBQUksQ0FBQytPLFlBQVksQ0FBQyxXQUFXLEVBQUUxUCxLQUFLLENBQUNnSyxJQUFJLENBQUM4RixTQUFTLENBQUMsQ0FBQztFQUM5RDs7RUFFQSxNQUFNek8sV0FBV0EsQ0FBQ25MLE9BQU8sRUFBRW9MLGFBQWEsRUFBRXpJLFVBQVUsRUFBRUMsYUFBYSxFQUFFO0lBQ25FLE9BQU8sSUFBSSxDQUFDNFcsWUFBWSxDQUFDLGFBQWEsRUFBRTFQLEtBQUssQ0FBQ2dLLElBQUksQ0FBQzhGLFNBQVMsQ0FBQyxDQUFDO0VBQ2hFOztFQUVBLE1BQU1wTyxhQUFhQSxDQUFDeEwsT0FBTyxFQUFFeUwsT0FBTyxFQUFFQyxTQUFTLEVBQUU7SUFDL0MsT0FBTyxJQUFJRyxxQ0FBNEIsQ0FBQyxNQUFNLElBQUksQ0FBQzJOLFlBQVksQ0FBQyxlQUFlLEVBQUUxUCxLQUFLLENBQUNnSyxJQUFJLENBQUM4RixTQUFTLENBQUMsQ0FBQyxDQUFDO0VBQzFHOztFQUVBLE1BQU0zTixRQUFRQSxDQUFDQyxNQUFNLEVBQUU7SUFDckIsT0FBTyxJQUFJLENBQUNzTixZQUFZLENBQUMsVUFBVSxFQUFFMVAsS0FBSyxDQUFDZ0ssSUFBSSxDQUFDOEYsU0FBUyxDQUFDLENBQUM7RUFDN0Q7O0VBRUEsTUFBTXhOLFVBQVVBLENBQUNGLE1BQU0sRUFBRUcsS0FBSyxFQUFFWixPQUFPLEVBQUU7SUFDdkMsT0FBTyxJQUFJZSxzQkFBYSxDQUFDLE1BQU0sSUFBSSxDQUFDZ04sWUFBWSxDQUFDLFlBQVksRUFBRTFQLEtBQUssQ0FBQ2dLLElBQUksQ0FBQzhGLFNBQVMsQ0FBQyxDQUFDLENBQUM7RUFDeEY7O0VBRUEsTUFBTW5OLFVBQVVBLENBQUNQLE1BQU0sRUFBRVQsT0FBTyxFQUFFekwsT0FBTyxFQUFFO0lBQ3pDLE9BQU8sSUFBSSxDQUFDd1osWUFBWSxDQUFDLFlBQVksRUFBRTFQLEtBQUssQ0FBQ2dLLElBQUksQ0FBQzhGLFNBQVMsQ0FBQyxDQUFDO0VBQy9EOztFQUVBLE1BQU05TSxZQUFZQSxDQUFDWixNQUFNLEVBQUVULE9BQU8sRUFBRXpMLE9BQU8sRUFBRTBMLFNBQVMsRUFBRTtJQUN0RCxPQUFPLElBQUljLHNCQUFhLENBQUMsTUFBTSxJQUFJLENBQUNnTixZQUFZLENBQUMsY0FBYyxFQUFFMVAsS0FBSyxDQUFDZ0ssSUFBSSxDQUFDOEYsU0FBUyxDQUFDLENBQUMsQ0FBQztFQUMxRjs7RUFFQSxNQUFNNU0sYUFBYUEsQ0FBQ2QsTUFBTSxFQUFFbE0sT0FBTyxFQUFFO0lBQ25DLE9BQU8sSUFBSSxDQUFDd1osWUFBWSxDQUFDLGVBQWUsRUFBRTFQLEtBQUssQ0FBQ2dLLElBQUksQ0FBQzhGLFNBQVMsQ0FBQyxDQUFDO0VBQ2xFOztFQUVBLE1BQU0xTSxlQUFlQSxDQUFDaEIsTUFBTSxFQUFFbE0sT0FBTyxFQUFFMEwsU0FBUyxFQUFFO0lBQ2hELE9BQU8sSUFBSSxDQUFDOE4sWUFBWSxDQUFDLGlCQUFpQixFQUFFMVAsS0FBSyxDQUFDZ0ssSUFBSSxDQUFDOEYsU0FBUyxDQUFDLENBQUM7RUFDcEU7O0VBRUEsTUFBTXhNLHFCQUFxQkEsQ0FBQ3BOLE9BQU8sRUFBRTtJQUNuQyxPQUFPLElBQUksQ0FBQ3daLFlBQVksQ0FBQyx1QkFBdUIsRUFBRTFQLEtBQUssQ0FBQ2dLLElBQUksQ0FBQzhGLFNBQVMsQ0FBQyxDQUFDO0VBQzFFOztFQUVBLE1BQU10TSxzQkFBc0JBLENBQUMzSyxVQUFVLEVBQUU0SyxNQUFNLEVBQUV2TixPQUFPLEVBQUU7SUFDeEQsSUFBSSxDQUFFLE9BQU8sTUFBTSxJQUFJLENBQUN3WixZQUFZLENBQUMsd0JBQXdCLEVBQUUsQ0FBQzdXLFVBQVUsRUFBRTRLLE1BQU0sQ0FBQ0UsUUFBUSxDQUFDLENBQUMsRUFBRXpOLE9BQU8sQ0FBQyxDQUFDLENBQUU7SUFDMUcsT0FBTzBCLENBQU0sRUFBRSxDQUFFLE1BQU0sSUFBSTdJLG9CQUFXLENBQUM2SSxDQUFDLENBQUMxQixPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBRTtFQUN6RDs7RUFFQSxNQUFNME4saUJBQWlCQSxDQUFDakMsT0FBTyxFQUFFekwsT0FBTyxFQUFFMEwsU0FBUyxFQUFFO0lBQ25ELElBQUksQ0FBRSxPQUFPLElBQUlrQywyQkFBa0IsQ0FBQyxNQUFNLElBQUksQ0FBQzRMLFlBQVksQ0FBQyxtQkFBbUIsRUFBRTFQLEtBQUssQ0FBQ2dLLElBQUksQ0FBQzhGLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBRTtJQUMxRyxPQUFPbFksQ0FBTSxFQUFFLENBQUUsTUFBTSxJQUFJN0ksb0JBQVcsQ0FBQzZJLENBQUMsQ0FBQzFCLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFFO0VBQ3pEOztFQUVBLE1BQU02TixVQUFVQSxDQUFDekwsUUFBUSxFQUFFO0lBQ3pCLE9BQU8sSUFBSSxDQUFDb1gsWUFBWSxDQUFDLFlBQVksRUFBRTFQLEtBQUssQ0FBQ2dLLElBQUksQ0FBQzhGLFNBQVMsQ0FBQyxDQUFDO0VBQy9EOztFQUVBLE1BQU01TCxVQUFVQSxDQUFDNUwsUUFBUSxFQUFFNkwsS0FBSyxFQUFFO0lBQ2hDLE9BQU8sSUFBSSxDQUFDdUwsWUFBWSxDQUFDLFlBQVksRUFBRTFQLEtBQUssQ0FBQ2dLLElBQUksQ0FBQzhGLFNBQVMsQ0FBQyxDQUFDO0VBQy9EOztFQUVBLE1BQU16TCxxQkFBcUJBLENBQUNDLFlBQVksRUFBRTtJQUN4QyxJQUFJLENBQUNBLFlBQVksRUFBRUEsWUFBWSxHQUFHLEVBQUU7SUFDcEMsSUFBSUMsT0FBTyxHQUFHLEVBQUU7SUFDaEIsS0FBSyxJQUFJQyxTQUFTLElBQUksTUFBTSxJQUFJLENBQUNrTCxZQUFZLENBQUMsdUJBQXVCLEVBQUUxUCxLQUFLLENBQUNnSyxJQUFJLENBQUM4RixTQUFTLENBQUMsQ0FBQyxFQUFFO01BQzdGdkwsT0FBTyxDQUFDcFEsSUFBSSxDQUFDLElBQUl1USwrQkFBc0IsQ0FBQ0YsU0FBUyxDQUFDLENBQUM7SUFDckQ7SUFDQSxPQUFPRCxPQUFPO0VBQ2hCOztFQUVBLE1BQU1JLG1CQUFtQkEsQ0FBQ2hELE9BQU8sRUFBRWlELFdBQVcsRUFBRTtJQUM5QyxPQUFPLElBQUksQ0FBQzhLLFlBQVksQ0FBQyxxQkFBcUIsRUFBRTFQLEtBQUssQ0FBQ2dLLElBQUksQ0FBQzhGLFNBQVMsQ0FBQyxDQUFDO0VBQ3hFOztFQUVBLE1BQU1oTCxvQkFBb0JBLENBQUNDLEtBQUssRUFBRUMsVUFBVSxFQUFFckQsT0FBTyxFQUFFc0QsY0FBYyxFQUFFTCxXQUFXLEVBQUU7SUFDbEYsT0FBTyxJQUFJLENBQUM4SyxZQUFZLENBQUMsc0JBQXNCLEVBQUUxUCxLQUFLLENBQUNnSyxJQUFJLENBQUM4RixTQUFTLENBQUMsQ0FBQztFQUN6RTs7RUFFQSxNQUFNM0ssc0JBQXNCQSxDQUFDQyxRQUFRLEVBQUU7SUFDckMsT0FBTyxJQUFJLENBQUNzSyxZQUFZLENBQUMsd0JBQXdCLEVBQUUxUCxLQUFLLENBQUNnSyxJQUFJLENBQUM4RixTQUFTLENBQUMsQ0FBQztFQUMzRTs7RUFFQSxNQUFNeEssV0FBV0EsQ0FBQ3hMLEdBQUcsRUFBRXlMLGNBQWMsRUFBRTtJQUNyQyxPQUFPLElBQUksQ0FBQ21LLFlBQVksQ0FBQyxhQUFhLEVBQUUxUCxLQUFLLENBQUNnSyxJQUFJLENBQUM4RixTQUFTLENBQUMsQ0FBQztFQUNoRTs7RUFFQSxNQUFNckssYUFBYUEsQ0FBQ0YsY0FBYyxFQUFFO0lBQ2xDLE9BQU8sSUFBSSxDQUFDbUssWUFBWSxDQUFDLGVBQWUsRUFBRTFQLEtBQUssQ0FBQ2dLLElBQUksQ0FBQzhGLFNBQVMsQ0FBQyxDQUFDO0VBQ2xFOztFQUVBLE1BQU1wSyxjQUFjQSxDQUFBLEVBQUc7SUFDckIsT0FBTyxJQUFJLENBQUNnSyxZQUFZLENBQUMsZ0JBQWdCLEVBQUUxUCxLQUFLLENBQUNnSyxJQUFJLENBQUM4RixTQUFTLENBQUMsQ0FBQztFQUNuRTs7RUFFQSxNQUFNL0osa0JBQWtCQSxDQUFDak0sR0FBRyxFQUFFVyxLQUFLLEVBQUU7SUFDbkMsT0FBTyxJQUFJLENBQUNpVixZQUFZLENBQUMsb0JBQW9CLEVBQUUxUCxLQUFLLENBQUNnSyxJQUFJLENBQUM4RixTQUFTLENBQUMsQ0FBQztFQUN2RTs7RUFFQSxNQUFNN0osYUFBYUEsQ0FBQzdXLE1BQU0sRUFBRTtJQUMxQkEsTUFBTSxHQUFHeU0scUJBQVksQ0FBQzJDLHdCQUF3QixDQUFDcFAsTUFBTSxDQUFDO0lBQ3RELE9BQU8sSUFBSSxDQUFDc2dCLFlBQVksQ0FBQyxlQUFlLEVBQUUsQ0FBQ3RnQixNQUFNLENBQUNrRCxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUQ7O0VBRUEsTUFBTTZULGVBQWVBLENBQUNyUixHQUFHLEVBQUU7SUFDekIsT0FBTyxJQUFJc1IsdUJBQWMsQ0FBQyxNQUFNLElBQUksQ0FBQ3NKLFlBQVksQ0FBQyxpQkFBaUIsRUFBRTFQLEtBQUssQ0FBQ2dLLElBQUksQ0FBQzhGLFNBQVMsQ0FBQyxDQUFDLENBQUM7RUFDOUY7O0VBRUEsTUFBTXhKLFlBQVlBLENBQUNDLEdBQUcsRUFBRTtJQUN0QixPQUFPLElBQUksQ0FBQ21KLFlBQVksQ0FBQyxjQUFjLEVBQUUxUCxLQUFLLENBQUNnSyxJQUFJLENBQUM4RixTQUFTLENBQUMsQ0FBQztFQUNqRTs7RUFFQSxNQUFNcEosWUFBWUEsQ0FBQ0gsR0FBRyxFQUFFSSxHQUFHLEVBQUU7SUFDM0IsT0FBTyxJQUFJLENBQUMrSSxZQUFZLENBQUMsY0FBYyxFQUFFMVAsS0FBSyxDQUFDZ0ssSUFBSSxDQUFDOEYsU0FBUyxDQUFDLENBQUM7RUFDakU7O0VBRUEsTUFBTWpKLFdBQVdBLENBQUNDLFVBQVUsRUFBRUMsZ0JBQWdCLEVBQUVDLGFBQWEsRUFBRTtJQUM3RCxPQUFPLElBQUksQ0FBQzBJLFlBQVksQ0FBQyxhQUFhLEVBQUUxUCxLQUFLLENBQUNnSyxJQUFJLENBQUM4RixTQUFTLENBQUMsQ0FBQztFQUNoRTs7RUFFQSxNQUFNMUksVUFBVUEsQ0FBQSxFQUFHO0lBQ2pCLE9BQU8sSUFBSSxDQUFDc0ksWUFBWSxDQUFDLFlBQVksRUFBRTFQLEtBQUssQ0FBQ2dLLElBQUksQ0FBQzhGLFNBQVMsQ0FBQyxDQUFDO0VBQy9EOztFQUVBLE1BQU16SSxzQkFBc0JBLENBQUEsRUFBRztJQUM3QixPQUFPLElBQUksQ0FBQ3FJLFlBQVksQ0FBQyx3QkFBd0IsQ0FBQztFQUNwRDs7RUFFQSxNQUFNbkksVUFBVUEsQ0FBQSxFQUFHO0lBQ2pCLE9BQU8sSUFBSSxDQUFDbUksWUFBWSxDQUFDLFlBQVksQ0FBQztFQUN4Qzs7RUFFQSxNQUFNakksZUFBZUEsQ0FBQSxFQUFHO0lBQ3RCLE9BQU8sSUFBSUMsMkJBQWtCLENBQUMsTUFBTSxJQUFJLENBQUNnSSxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQztFQUMzRTs7RUFFQSxNQUFNOUgsZUFBZUEsQ0FBQSxFQUFHO0lBQ3RCLE9BQU8sSUFBSSxDQUFDOEgsWUFBWSxDQUFDLGlCQUFpQixDQUFDO0VBQzdDOztFQUVBLE1BQU01SCxZQUFZQSxDQUFDQyxhQUFhLEVBQUVDLFNBQVMsRUFBRW5hLFFBQVEsRUFBRTtJQUNyRCxPQUFPLE1BQU0sSUFBSSxDQUFDNmhCLFlBQVksQ0FBQyxjQUFjLEVBQUUxUCxLQUFLLENBQUNnSyxJQUFJLENBQUM4RixTQUFTLENBQUMsQ0FBQztFQUN2RTs7RUFFQSxNQUFNNUgsb0JBQW9CQSxDQUFDSCxhQUFhLEVBQUVsYSxRQUFRLEVBQUU7SUFDbEQsT0FBTyxJQUFJdWEsaUNBQXdCLENBQUMsTUFBTSxJQUFJLENBQUNzSCxZQUFZLENBQUMsc0JBQXNCLEVBQUUxUCxLQUFLLENBQUNnSyxJQUFJLENBQUM4RixTQUFTLENBQUMsQ0FBQyxDQUFDO0VBQzdHOztFQUVBLE1BQU16SCxpQkFBaUJBLENBQUEsRUFBRztJQUN4QixPQUFPLElBQUksQ0FBQ3FILFlBQVksQ0FBQyxtQkFBbUIsQ0FBQztFQUMvQzs7RUFFQSxNQUFNbkgsaUJBQWlCQSxDQUFDUixhQUFhLEVBQUU7SUFDckMsT0FBTyxJQUFJLENBQUMySCxZQUFZLENBQUMsbUJBQW1CLEVBQUUxUCxLQUFLLENBQUNnSyxJQUFJLENBQUM4RixTQUFTLENBQUMsQ0FBQztFQUN0RTs7RUFFQSxNQUFNckgsaUJBQWlCQSxDQUFDNUgsYUFBYSxFQUFFO0lBQ3JDLE9BQU8sSUFBSThILGlDQUF3QixDQUFDLE1BQU0sSUFBSSxDQUFDK0csWUFBWSxDQUFDLG1CQUFtQixFQUFFMVAsS0FBSyxDQUFDZ0ssSUFBSSxDQUFDOEYsU0FBUyxDQUFDLENBQUMsQ0FBQztFQUMxRzs7RUFFQSxNQUFNbEgsbUJBQW1CQSxDQUFDQyxtQkFBbUIsRUFBRTtJQUM3QyxPQUFPLElBQUksQ0FBQzZHLFlBQVksQ0FBQyxxQkFBcUIsRUFBRTFQLEtBQUssQ0FBQ2dLLElBQUksQ0FBQzhGLFNBQVMsQ0FBQyxDQUFDO0VBQ3hFOztFQUVBLE1BQU0vRyxPQUFPQSxDQUFBLEVBQUc7SUFDZCxPQUFPLElBQUksQ0FBQzJHLFlBQVksQ0FBQyxTQUFTLENBQUM7RUFDckM7O0VBRUEsTUFBTTNiLE1BQU1BLENBQUNuRyxJQUFJLEVBQUU7SUFDakIsT0FBT0wsZ0JBQWdCLENBQUN3RyxNQUFNLENBQUNuRyxJQUFJLEVBQUUsSUFBSSxDQUFDO0VBQzVDOztFQUVBLE1BQU15YyxjQUFjQSxDQUFDQyxXQUFXLEVBQUVDLFdBQVcsRUFBRTtJQUM3QyxNQUFNLElBQUksQ0FBQ21GLFlBQVksQ0FBQyxnQkFBZ0IsRUFBRTFQLEtBQUssQ0FBQ2dLLElBQUksQ0FBQzhGLFNBQVMsQ0FBQyxDQUFDO0lBQ2hFLElBQUksSUFBSSxDQUFDbGlCLElBQUksRUFBRSxNQUFNLElBQUksQ0FBQzJFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNwQzs7RUFFQSxNQUFNQSxJQUFJQSxDQUFBLEVBQUc7SUFDWCxPQUFPaEYsZ0JBQWdCLENBQUNnRixJQUFJLENBQUMsSUFBSSxDQUFDO0VBQ3BDOztFQUVBLE1BQU1tWSxLQUFLQSxDQUFDblksSUFBSSxFQUFFO0lBQ2hCLElBQUlBLElBQUksRUFBRSxNQUFNLElBQUksQ0FBQ0EsSUFBSSxDQUFDLENBQUM7SUFDM0IsT0FBTyxJQUFJLENBQUNzZCxnQkFBZ0IsQ0FBQzlNLE1BQU0sRUFBRSxNQUFNLElBQUksQ0FBQzFPLGNBQWMsQ0FBQyxJQUFJLENBQUN3YixnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQ1UsV0FBVyxDQUFDLENBQUMsQ0FBQztJQUN0RyxNQUFNLEtBQUssQ0FBQzdGLEtBQUssQ0FBQyxLQUFLLENBQUM7RUFDMUI7QUFDRjs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTW5jLGtCQUFrQixDQUFDOzs7O0VBSXZCYixXQUFXQSxDQUFDdUQsTUFBTSxFQUFFO0lBQ2xCLElBQUksQ0FBQ0EsTUFBTSxHQUFHQSxNQUFNO0VBQ3RCOztFQUVBLE1BQU1vYixjQUFjQSxDQUFDSCxNQUFNLEVBQUVoVixXQUFXLEVBQUVpVixTQUFTLEVBQUVDLFdBQVcsRUFBRWxXLE9BQU8sRUFBRTtJQUN6RSxLQUFLLElBQUlqQyxRQUFRLElBQUksSUFBSSxDQUFDaEQsTUFBTSxDQUFDd0QsWUFBWSxDQUFDLENBQUMsRUFBRSxNQUFNUixRQUFRLENBQUNvWSxjQUFjLENBQUNILE1BQU0sRUFBRWhWLFdBQVcsRUFBRWlWLFNBQVMsRUFBRUMsV0FBVyxFQUFFbFcsT0FBTyxDQUFDO0VBQ3RJOztFQUVBLE1BQU1vVyxVQUFVQSxDQUFDSixNQUFNLEVBQUU7SUFDdkIsS0FBSyxJQUFJalksUUFBUSxJQUFJLElBQUksQ0FBQ2hELE1BQU0sQ0FBQ3dELFlBQVksQ0FBQyxDQUFDLEVBQUUsTUFBTVIsUUFBUSxDQUFDcVksVUFBVSxDQUFDSixNQUFNLENBQUM7RUFDcEY7O0VBRUEsTUFBTU8saUJBQWlCQSxDQUFDRixhQUFhLEVBQUVDLHFCQUFxQixFQUFFO0lBQzVELEtBQUssSUFBSXZZLFFBQVEsSUFBSSxJQUFJLENBQUNoRCxNQUFNLENBQUN3RCxZQUFZLENBQUMsQ0FBQyxFQUFFLE1BQU1SLFFBQVEsQ0FBQ3dZLGlCQUFpQixDQUFDdFQsTUFBTSxDQUFDb1QsYUFBYSxDQUFDLEVBQUVwVCxNQUFNLENBQUNxVCxxQkFBcUIsQ0FBQyxDQUFDO0VBQ3pJOztFQUVBLE1BQU1LLGdCQUFnQkEsQ0FBQ1gsTUFBTSxFQUFFOUosTUFBTSxFQUFFc0ssU0FBUyxFQUFFN1QsVUFBVSxFQUFFQyxhQUFhLEVBQUVvSixPQUFPLEVBQUV5SyxVQUFVLEVBQUVDLFFBQVEsRUFBRTs7SUFFMUc7SUFDQSxJQUFJNEIsTUFBTSxHQUFHLElBQUlvQywyQkFBa0IsQ0FBQyxDQUFDO0lBQ3JDcEMsTUFBTSxDQUFDcUMsU0FBUyxDQUFDMVgsTUFBTSxDQUFDdVQsU0FBUyxDQUFDLENBQUM7SUFDbkM4QixNQUFNLENBQUNzQyxlQUFlLENBQUNqWSxVQUFVLENBQUM7SUFDbEMyVixNQUFNLENBQUN1QyxrQkFBa0IsQ0FBQ2pZLGFBQWEsQ0FBQztJQUN4QyxJQUFJMkcsRUFBRSxHQUFHLElBQUlXLHVCQUFjLENBQUMsQ0FBQztJQUM3QlgsRUFBRSxDQUFDdVIsT0FBTyxDQUFDNU8sTUFBTSxDQUFDO0lBQ2xCM0MsRUFBRSxDQUFDd1IsVUFBVSxDQUFDL08sT0FBTyxDQUFDO0lBQ3RCekMsRUFBRSxDQUFDeVIsYUFBYSxDQUFDdkUsVUFBVSxDQUFDO0lBQzVCNkIsTUFBTSxDQUFDMkMsS0FBSyxDQUFDMVIsRUFBRSxDQUFDO0lBQ2hCQSxFQUFFLENBQUMyUixVQUFVLENBQUMsQ0FBQzVDLE1BQU0sQ0FBQyxDQUFDO0lBQ3ZCL08sRUFBRSxDQUFDNFIsYUFBYSxDQUFDLElBQUksQ0FBQztJQUN0QjVSLEVBQUUsQ0FBQzZSLFdBQVcsQ0FBQzFFLFFBQVEsQ0FBQztJQUN4QixJQUFJVixNQUFNLEdBQUcsQ0FBQyxFQUFFO01BQ2QsSUFBSWdCLEtBQUssR0FBRyxJQUFJUyxvQkFBVyxDQUFDLENBQUMsQ0FBQzRELFNBQVMsQ0FBQ3JGLE1BQU0sQ0FBQztNQUMvQ2dCLEtBQUssQ0FBQ3JOLE1BQU0sQ0FBQyxDQUFDSixFQUFFLENBQWEsQ0FBQztNQUM5QkEsRUFBRSxDQUFDcU8sUUFBUSxDQUFDWixLQUFLLENBQUM7TUFDbEJ6TixFQUFFLENBQUMrUixjQUFjLENBQUMsSUFBSSxDQUFDO01BQ3ZCL1IsRUFBRSxDQUFDZ1MsV0FBVyxDQUFDLEtBQUssQ0FBQztNQUNyQmhTLEVBQUUsQ0FBQ2lTLFdBQVcsQ0FBQyxLQUFLLENBQUM7SUFDdkIsQ0FBQyxNQUFNO01BQ0xqUyxFQUFFLENBQUMrUixjQUFjLENBQUMsS0FBSyxDQUFDO01BQ3hCL1IsRUFBRSxDQUFDZ1MsV0FBVyxDQUFDLElBQUksQ0FBQztJQUN0Qjs7SUFFQTtJQUNBLEtBQUssSUFBSXhkLFFBQVEsSUFBSSxJQUFJLENBQUNoRCxNQUFNLENBQUN3RCxZQUFZLENBQUMsQ0FBQyxFQUFFLE1BQU1SLFFBQVEsQ0FBQzRZLGdCQUFnQixDQUFDcE4sRUFBRSxDQUFDakQsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUN0Rzs7RUFFQSxNQUFNd1EsYUFBYUEsQ0FBQ2QsTUFBTSxFQUFFOUosTUFBTSxFQUFFc0ssU0FBUyxFQUFFSSxhQUFhLEVBQUVDLGdCQUFnQixFQUFFN0ssT0FBTyxFQUFFeUssVUFBVSxFQUFFQyxRQUFRLEVBQUU7O0lBRTdHO0lBQ0EsSUFBSTRCLE1BQU0sR0FBRyxJQUFJb0MsMkJBQWtCLENBQUMsQ0FBQztJQUNyQ3BDLE1BQU0sQ0FBQ3FDLFNBQVMsQ0FBQzFYLE1BQU0sQ0FBQ3VULFNBQVMsQ0FBQyxDQUFDO0lBQ25DLElBQUlJLGFBQWEsRUFBRTBCLE1BQU0sQ0FBQ3NDLGVBQWUsQ0FBQ2EsUUFBUSxDQUFDN0UsYUFBYSxDQUFDLENBQUM7SUFDbEUsSUFBSUMsZ0JBQWdCLEVBQUV5QixNQUFNLENBQUN1QyxrQkFBa0IsQ0FBQ1ksUUFBUSxDQUFDNUUsZ0JBQWdCLENBQUMsQ0FBQztJQUMzRSxJQUFJdE4sRUFBRSxHQUFHLElBQUlXLHVCQUFjLENBQUMsQ0FBQztJQUM3QlgsRUFBRSxDQUFDdVIsT0FBTyxDQUFDNU8sTUFBTSxDQUFDO0lBQ2xCM0MsRUFBRSxDQUFDd1IsVUFBVSxDQUFDL08sT0FBTyxDQUFDO0lBQ3RCekMsRUFBRSxDQUFDeVIsYUFBYSxDQUFDdkUsVUFBVSxDQUFDO0lBQzVCbE4sRUFBRSxDQUFDNlIsV0FBVyxDQUFDMUUsUUFBUSxDQUFDO0lBQ3hCNEIsTUFBTSxDQUFDMkMsS0FBSyxDQUFDMVIsRUFBRSxDQUFDO0lBQ2hCQSxFQUFFLENBQUNtUyxTQUFTLENBQUMsQ0FBQ3BELE1BQU0sQ0FBQyxDQUFDO0lBQ3RCLElBQUl0QyxNQUFNLEdBQUcsQ0FBQyxFQUFFO01BQ2QsSUFBSWdCLEtBQUssR0FBRyxJQUFJUyxvQkFBVyxDQUFDLENBQUMsQ0FBQzRELFNBQVMsQ0FBQ3JGLE1BQU0sQ0FBQztNQUMvQ2dCLEtBQUssQ0FBQ3JOLE1BQU0sQ0FBQyxDQUFDSixFQUFFLENBQUMsQ0FBQztNQUNsQkEsRUFBRSxDQUFDcU8sUUFBUSxDQUFDWixLQUFLLENBQUM7TUFDbEJ6TixFQUFFLENBQUMrUixjQUFjLENBQUMsSUFBSSxDQUFDO01BQ3ZCL1IsRUFBRSxDQUFDZ1MsV0FBVyxDQUFDLEtBQUssQ0FBQztNQUNyQmhTLEVBQUUsQ0FBQ2lTLFdBQVcsQ0FBQyxLQUFLLENBQUM7SUFDdkIsQ0FBQyxNQUFNO01BQ0xqUyxFQUFFLENBQUMrUixjQUFjLENBQUMsS0FBSyxDQUFDO01BQ3hCL1IsRUFBRSxDQUFDZ1MsV0FBVyxDQUFDLElBQUksQ0FBQztJQUN0Qjs7SUFFQTtJQUNBLEtBQUssSUFBSXhkLFFBQVEsSUFBSSxJQUFJLENBQUNoRCxNQUFNLENBQUN3RCxZQUFZLENBQUMsQ0FBQyxFQUFFLE1BQU1SLFFBQVEsQ0FBQytZLGFBQWEsQ0FBQ3ZOLEVBQUUsQ0FBQ29TLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDbEc7QUFDRjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTFCLG9CQUFvQixDQUFDOzs7OztFQUt6QnppQixXQUFXQSxDQUFDdUcsUUFBUSxFQUFFO0lBQ3BCLElBQUksQ0FBQzZkLEVBQUUsR0FBRzdmLGlCQUFRLENBQUNDLE9BQU8sQ0FBQyxDQUFDO0lBQzVCLElBQUksQ0FBQytCLFFBQVEsR0FBR0EsUUFBUTtFQUMxQjs7RUFFQW9jLEtBQUtBLENBQUEsRUFBRztJQUNOLE9BQU8sSUFBSSxDQUFDeUIsRUFBRTtFQUNoQjs7RUFFQXZCLFdBQVdBLENBQUEsRUFBRztJQUNaLE9BQU8sSUFBSSxDQUFDdGMsUUFBUTtFQUN0Qjs7RUFFQW9ZLGNBQWNBLENBQUNILE1BQU0sRUFBRWhWLFdBQVcsRUFBRWlWLFNBQVMsRUFBRUMsV0FBVyxFQUFFbFcsT0FBTyxFQUFFO0lBQ25FLElBQUksQ0FBQ2pDLFFBQVEsQ0FBQ29ZLGNBQWMsQ0FBQ0gsTUFBTSxFQUFFaFYsV0FBVyxFQUFFaVYsU0FBUyxFQUFFQyxXQUFXLEVBQUVsVyxPQUFPLENBQUM7RUFDcEY7O0VBRUEsTUFBTW9XLFVBQVVBLENBQUNKLE1BQU0sRUFBRTtJQUN2QixNQUFNLElBQUksQ0FBQ2pZLFFBQVEsQ0FBQ3FZLFVBQVUsQ0FBQ0osTUFBTSxDQUFDO0VBQ3hDOztFQUVBLE1BQU1PLGlCQUFpQkEsQ0FBQ0YsYUFBYSxFQUFFQyxxQkFBcUIsRUFBRTtJQUM1RCxNQUFNLElBQUksQ0FBQ3ZZLFFBQVEsQ0FBQ3dZLGlCQUFpQixDQUFDdFQsTUFBTSxDQUFDb1QsYUFBYSxDQUFDLEVBQUVwVCxNQUFNLENBQUNxVCxxQkFBcUIsQ0FBQyxDQUFDO0VBQzdGOztFQUVBLE1BQU1LLGdCQUFnQkEsQ0FBQ2EsU0FBUyxFQUFFO0lBQ2hDLElBQUlSLEtBQUssR0FBRyxJQUFJUyxvQkFBVyxDQUFDRCxTQUFTLEVBQUVDLG9CQUFXLENBQUNDLG1CQUFtQixDQUFDQyxTQUFTLENBQUM7SUFDakYsTUFBTSxJQUFJLENBQUM1WixRQUFRLENBQUM0WSxnQkFBZ0IsQ0FBQ0ssS0FBSyxDQUFDeFIsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQ2MsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUN6RTs7RUFFQSxNQUFNd1EsYUFBYUEsQ0FBQ1UsU0FBUyxFQUFFO0lBQzdCLElBQUlSLEtBQUssR0FBRyxJQUFJUyxvQkFBVyxDQUFDRCxTQUFTLEVBQUVDLG9CQUFXLENBQUNDLG1CQUFtQixDQUFDQyxTQUFTLENBQUM7SUFDakYsTUFBTSxJQUFJLENBQUM1WixRQUFRLENBQUMrWSxhQUFhLENBQUNFLEtBQUssQ0FBQ3hSLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUNtVyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3JFO0FBQ0YifQ==