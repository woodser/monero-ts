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
    this.wasmListener = new WalletWasmListener(this); // receives notifications from wasm c++
    this.wasmListenerHandle = 0; // memory address of the wallet listener in c++
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
    _LibraryUtils.default.log(2, "Wallet exists at " + path + ": " + exists);
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

    // set server from connection manager if provided
    if (config.getConnectionManager()) {
      if (config.getServer()) throw new _MoneroError.default("Wallet can be opened with a server or connection manager but not both");
      config.setServer(config.getConnectionManager().getConnection());
    }

    // read wallet data from disk unless provided
    if (!config.getKeysData()) {
      let fs = config.getFs() ? config.getFs() : MoneroWalletFull.getFs();
      if (!fs) throw new _MoneroError.default("Must provide file system to read wallet data from");
      if (!this.walletExists(config.getPath(), fs)) throw new _MoneroError.default("Wallet does not exist at path: " + config.getPath());
      config.setKeysData(fs.readFileSync(config.getPath() + ".keys"));
      config.setCacheData(fs.existsSync(config.getPath()) ? fs.readFileSync(config.getPath()) : "");
    }

    // open wallet from data
    const wallet = await MoneroWalletFull.openWalletData(config);

    // set connection manager
    await wallet.setConnectionManager(config.getConnectionManager());
    return wallet;
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
      if (config.getServer()) throw new _MoneroError.default("Wallet can be created with a server or connection manager but not both");
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

    // set connection manager
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
    await super.addListener(listener);
    await this.refreshListening();
  }

  async removeListener(listener) {
    if (this.getWalletProxy()) return this.getWalletProxy().removeListener(listener);
    await super.removeListener(listener);
    await this.refreshListening();
  }

  getListeners() {
    if (this.getWalletProxy()) return this.getWalletProxy().getListeners();
    return super.getListeners();
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
    if (save) await this.save();
    if (this.getWalletProxy()) {
      await this.getWalletProxy().close(false);
      await super.close();
      return;
    }
    await this.refreshListening();
    await this.stopSyncing();
    await super.close();
    delete this.path;
    delete this.password;
    delete this.wasmListener;
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
    if (config.proxyToWorker) {
      let walletProxy = await MoneroWalletFullProxy.openWalletData(config);
      return new MoneroWalletFull(undefined, undefined, undefined, undefined, undefined, undefined, walletProxy);
    }

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
        module.open_wallet_full(config.password, config.networkType, config.keysData ?? "", config.cacheData ?? "", daemonUri, daemonUsername, daemonPassword, rejectUnauthorizedFnId, (cppAddress) => {
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
    if (this.wasmListenerHandle === 0 && !isEnabled || this.wasmListenerHandle > 0 && isEnabled) return; // no difference
    return this.module.queueTask(async () => {
      return new Promise((resolve, reject) => {
        this.module.set_listener(
          this.cppAddress,
          this.wasmListenerHandle,
          (newListenerHandle) => {
            if (typeof newListenerHandle === "string") reject(new _MoneroError.default(newListenerHandle));else
            {
              this.wasmListenerHandle = newListenerHandle;
              resolve();
            }
          },
          isEnabled ? async (height, startHeight, endHeight, percentDone, message) => await this.wasmListener.onSyncProgress(height, startHeight, endHeight, percentDone, message) : undefined,
          isEnabled ? async (height) => await this.wasmListener.onNewBlock(height) : undefined,
          isEnabled ? async (newBalanceStr, newUnlockedBalanceStr) => await this.wasmListener.onBalancesChanged(newBalanceStr, newUnlockedBalanceStr) : undefined,
          isEnabled ? async (height, txHash, amountStr, accountIdx, subaddressIdx, version, unlockTime, isLocked) => await this.wasmListener.onOutputReceived(height, txHash, amountStr, accountIdx, subaddressIdx, version, unlockTime, isLocked) : undefined,
          isEnabled ? async (height, txHash, amountStr, accountIdxStr, subaddressIdxStr, version, unlockTime, isLocked) => await this.wasmListener.onOutputSpent(height, txHash, amountStr, accountIdxStr, subaddressIdxStr, version, unlockTime, isLocked) : undefined
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
    if (await this.isClosed()) return;
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
class WalletWasmListener {



  constructor(wallet) {
    this.wallet = wallet;
  }

  async onSyncProgress(height, startHeight, endHeight, percentDone, message) {
    await this.wallet.announceSyncProgress(height, startHeight, endHeight, percentDone, message);
  }

  async onNewBlock(height) {
    await this.wallet.announceNewBlock(height);
  }

  async onBalancesChanged(newBalanceStr, newUnlockedBalanceStr) {
    await this.wallet.announceBalancesChanged(newBalanceStr, newUnlockedBalanceStr);
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
    await this.wallet.announceOutputReceived(output);
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

    // announce output
    await this.wallet.announceOutputSpent(output);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfcGF0aCIsIl9HZW5VdGlscyIsIl9MaWJyYXJ5VXRpbHMiLCJfVGFza0xvb3BlciIsIl9Nb25lcm9BY2NvdW50IiwiX01vbmVyb0FjY291bnRUYWciLCJfTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSIsIl9Nb25lcm9CbG9jayIsIl9Nb25lcm9DaGVja1R4IiwiX01vbmVyb0NoZWNrUmVzZXJ2ZSIsIl9Nb25lcm9EYWVtb25ScGMiLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MiLCJfTW9uZXJvS2V5SW1hZ2UiLCJfTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQiLCJfTW9uZXJvTXVsdGlzaWdJbmZvIiwiX01vbmVyb011bHRpc2lnSW5pdFJlc3VsdCIsIl9Nb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQiLCJfTW9uZXJvTmV0d29ya1R5cGUiLCJfTW9uZXJvT3V0cHV0V2FsbGV0IiwiX01vbmVyb1JwY0Nvbm5lY3Rpb24iLCJfTW9uZXJvU3ViYWRkcmVzcyIsIl9Nb25lcm9TeW5jUmVzdWx0IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4U2V0IiwiX01vbmVyb1R4V2FsbGV0IiwiX01vbmVyb1dhbGxldCIsIl9Nb25lcm9XYWxsZXRDb25maWciLCJfTW9uZXJvV2FsbGV0S2V5cyIsIl9Nb25lcm9XYWxsZXRMaXN0ZW5lciIsIl9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIl9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0IiwiX2ZzIiwiTW9uZXJvV2FsbGV0RnVsbCIsIk1vbmVyb1dhbGxldEtleXMiLCJERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TIiwiY29uc3RydWN0b3IiLCJjcHBBZGRyZXNzIiwicGF0aCIsInBhc3N3b3JkIiwiZnMiLCJyZWplY3RVbmF1dGhvcml6ZWQiLCJyZWplY3RVbmF1dGhvcml6ZWRGbklkIiwid2FsbGV0UHJveHkiLCJsaXN0ZW5lcnMiLCJnZXRGcyIsInVuZGVmaW5lZCIsIl9pc0Nsb3NlZCIsIndhc21MaXN0ZW5lciIsIldhbGxldFdhc21MaXN0ZW5lciIsIndhc21MaXN0ZW5lckhhbmRsZSIsInJlamVjdFVuYXV0aG9yaXplZENvbmZpZ0lkIiwic3luY1BlcmlvZEluTXMiLCJMaWJyYXJ5VXRpbHMiLCJzZXRSZWplY3RVbmF1dGhvcml6ZWRGbiIsIndhbGxldEV4aXN0cyIsImFzc2VydCIsIk1vbmVyb0Vycm9yIiwiZXhpc3RzIiwiZXhpc3RzU3luYyIsImxvZyIsIm9wZW5XYWxsZXQiLCJjb25maWciLCJNb25lcm9XYWxsZXRDb25maWciLCJnZXRQcm94eVRvV29ya2VyIiwic2V0UHJveHlUb1dvcmtlciIsImdldFNlZWQiLCJnZXRTZWVkT2Zmc2V0IiwiZ2V0UHJpbWFyeUFkZHJlc3MiLCJnZXRQcml2YXRlVmlld0tleSIsImdldFByaXZhdGVTcGVuZEtleSIsImdldFJlc3RvcmVIZWlnaHQiLCJnZXRMYW5ndWFnZSIsImdldFNhdmVDdXJyZW50IiwiZ2V0Q29ubmVjdGlvbk1hbmFnZXIiLCJnZXRTZXJ2ZXIiLCJzZXRTZXJ2ZXIiLCJnZXRDb25uZWN0aW9uIiwiZ2V0S2V5c0RhdGEiLCJnZXRQYXRoIiwic2V0S2V5c0RhdGEiLCJyZWFkRmlsZVN5bmMiLCJzZXRDYWNoZURhdGEiLCJ3YWxsZXQiLCJvcGVuV2FsbGV0RGF0YSIsInNldENvbm5lY3Rpb25NYW5hZ2VyIiwiY3JlYXRlV2FsbGV0IiwiZ2V0TmV0d29ya1R5cGUiLCJNb25lcm9OZXR3b3JrVHlwZSIsInZhbGlkYXRlIiwic2V0UGF0aCIsImdldFBhc3N3b3JkIiwic2V0UGFzc3dvcmQiLCJNb25lcm9XYWxsZXRGdWxsUHJveHkiLCJjcmVhdGVXYWxsZXRGcm9tU2VlZCIsImNyZWF0ZVdhbGxldEZyb21LZXlzIiwiY3JlYXRlV2FsbGV0UmFuZG9tIiwiZGFlbW9uQ29ubmVjdGlvbiIsImdldFJlamVjdFVuYXV0aG9yaXplZCIsInNldFJlc3RvcmVIZWlnaHQiLCJzZXRTZWVkT2Zmc2V0IiwibW9kdWxlIiwibG9hZEZ1bGxNb2R1bGUiLCJxdWV1ZVRhc2siLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsIkdlblV0aWxzIiwiZ2V0VVVJRCIsImNyZWF0ZV9mdWxsX3dhbGxldCIsIkpTT04iLCJzdHJpbmdpZnkiLCJ0b0pzb24iLCJzYXZlIiwic2V0UHJpbWFyeUFkZHJlc3MiLCJzZXRQcml2YXRlVmlld0tleSIsInNldFByaXZhdGVTcGVuZEtleSIsInNldExhbmd1YWdlIiwiZ2V0U2VlZExhbmd1YWdlcyIsInBhcnNlIiwiZ2V0X2tleXNfd2FsbGV0X3NlZWRfbGFuZ3VhZ2VzIiwibGFuZ3VhZ2VzIiwiRlMiLCJpc0Jyb3dzZXIiLCJnZXREYWVtb25NYXhQZWVySGVpZ2h0IiwiZ2V0V2FsbGV0UHJveHkiLCJhc3NlcnROb3RDbG9zZWQiLCJnZXRfZGFlbW9uX21heF9wZWVyX2hlaWdodCIsInJlc3AiLCJpc0RhZW1vblN5bmNlZCIsImlzX2RhZW1vbl9zeW5jZWQiLCJpc1N5bmNlZCIsImlzX3N5bmNlZCIsImdldF9uZXR3b3JrX3R5cGUiLCJnZXRfcmVzdG9yZV9oZWlnaHQiLCJyZXN0b3JlSGVpZ2h0Iiwic2V0X3Jlc3RvcmVfaGVpZ2h0IiwibW92ZVRvIiwiYWRkTGlzdGVuZXIiLCJsaXN0ZW5lciIsInJlZnJlc2hMaXN0ZW5pbmciLCJyZW1vdmVMaXN0ZW5lciIsImdldExpc3RlbmVycyIsInNldERhZW1vbkNvbm5lY3Rpb24iLCJ1cmlPckNvbm5lY3Rpb24iLCJjb25uZWN0aW9uIiwiTW9uZXJvUnBjQ29ubmVjdGlvbiIsInVyaSIsImdldFVyaSIsInVzZXJuYW1lIiwiZ2V0VXNlcm5hbWUiLCJzZXRfZGFlbW9uX2Nvbm5lY3Rpb24iLCJnZXREYWVtb25Db25uZWN0aW9uIiwiY29ubmVjdGlvbkNvbnRhaW5lclN0ciIsImdldF9kYWVtb25fY29ubmVjdGlvbiIsImpzb25Db25uZWN0aW9uIiwiaXNDb25uZWN0ZWRUb0RhZW1vbiIsImlzX2Nvbm5lY3RlZF90b19kYWVtb24iLCJnZXRWZXJzaW9uIiwiZ2V0SW50ZWdyYXRlZEFkZHJlc3MiLCJzdGFuZGFyZEFkZHJlc3MiLCJwYXltZW50SWQiLCJyZXN1bHQiLCJnZXRfaW50ZWdyYXRlZF9hZGRyZXNzIiwiY2hhckF0IiwiTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MiLCJlcnIiLCJtZXNzYWdlIiwiaW5jbHVkZXMiLCJkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyIsImludGVncmF0ZWRBZGRyZXNzIiwiZGVjb2RlX2ludGVncmF0ZWRfYWRkcmVzcyIsImdldEhlaWdodCIsImdldF9oZWlnaHQiLCJnZXREYWVtb25IZWlnaHQiLCJnZXRfZGFlbW9uX2hlaWdodCIsImdldEhlaWdodEJ5RGF0ZSIsInllYXIiLCJtb250aCIsImRheSIsImdldF9oZWlnaHRfYnlfZGF0ZSIsInN5bmMiLCJsaXN0ZW5lck9yU3RhcnRIZWlnaHQiLCJzdGFydEhlaWdodCIsImFsbG93Q29uY3VycmVudENhbGxzIiwiTW9uZXJvV2FsbGV0TGlzdGVuZXIiLCJNYXRoIiwibWF4IiwidGhhdCIsInN5bmNXYXNtIiwicmVzcEpzb24iLCJNb25lcm9TeW5jUmVzdWx0IiwibnVtQmxvY2tzRmV0Y2hlZCIsInJlY2VpdmVkTW9uZXkiLCJlIiwic3RhcnRTeW5jaW5nIiwic3luY0xvb3BlciIsIlRhc2tMb29wZXIiLCJiYWNrZ3JvdW5kU3luYyIsInN0YXJ0Iiwic3RvcFN5bmNpbmciLCJzdG9wIiwic3RvcF9zeW5jaW5nIiwic2NhblR4cyIsInR4SGFzaGVzIiwic2Nhbl90eHMiLCJyZXNjYW5TcGVudCIsInJlc2Nhbl9zcGVudCIsInJlc2NhbkJsb2NrY2hhaW4iLCJyZXNjYW5fYmxvY2tjaGFpbiIsImdldEJhbGFuY2UiLCJhY2NvdW50SWR4Iiwic3ViYWRkcmVzc0lkeCIsImJhbGFuY2VTdHIiLCJnZXRfYmFsYW5jZV93YWxsZXQiLCJnZXRfYmFsYW5jZV9hY2NvdW50IiwiZ2V0X2JhbGFuY2Vfc3ViYWRkcmVzcyIsIkJpZ0ludCIsInN0cmluZ2lmeUJpZ0ludHMiLCJiYWxhbmNlIiwiZ2V0VW5sb2NrZWRCYWxhbmNlIiwidW5sb2NrZWRCYWxhbmNlU3RyIiwiZ2V0X3VubG9ja2VkX2JhbGFuY2Vfd2FsbGV0IiwiZ2V0X3VubG9ja2VkX2JhbGFuY2VfYWNjb3VudCIsImdldF91bmxvY2tlZF9iYWxhbmNlX3N1YmFkZHJlc3MiLCJ1bmxvY2tlZEJhbGFuY2UiLCJnZXRBY2NvdW50cyIsImluY2x1ZGVTdWJhZGRyZXNzZXMiLCJ0YWciLCJhY2NvdW50c1N0ciIsImdldF9hY2NvdW50cyIsImFjY291bnRzIiwiYWNjb3VudEpzb24iLCJwdXNoIiwic2FuaXRpemVBY2NvdW50IiwiTW9uZXJvQWNjb3VudCIsImdldEFjY291bnQiLCJhY2NvdW50U3RyIiwiZ2V0X2FjY291bnQiLCJjcmVhdGVBY2NvdW50IiwibGFiZWwiLCJjcmVhdGVfYWNjb3VudCIsImdldFN1YmFkZHJlc3NlcyIsInN1YmFkZHJlc3NJbmRpY2VzIiwiYXJncyIsImxpc3RpZnkiLCJzdWJhZGRyZXNzZXNKc29uIiwiZ2V0X3N1YmFkZHJlc3NlcyIsInN1YmFkZHJlc3NlcyIsInN1YmFkZHJlc3NKc29uIiwic2FuaXRpemVTdWJhZGRyZXNzIiwiTW9uZXJvU3ViYWRkcmVzcyIsImNyZWF0ZVN1YmFkZHJlc3MiLCJzdWJhZGRyZXNzU3RyIiwiY3JlYXRlX3N1YmFkZHJlc3MiLCJzZXRTdWJhZGRyZXNzTGFiZWwiLCJzZXRfc3ViYWRkcmVzc19sYWJlbCIsImdldFR4cyIsInF1ZXJ5IiwicXVlcnlOb3JtYWxpemVkIiwiTW9uZXJvV2FsbGV0Iiwibm9ybWFsaXplVHhRdWVyeSIsImdldF90eHMiLCJnZXRCbG9jayIsImJsb2Nrc0pzb25TdHIiLCJkZXNlcmlhbGl6ZVR4cyIsImdldFRyYW5zZmVycyIsIm5vcm1hbGl6ZVRyYW5zZmVyUXVlcnkiLCJnZXRfdHJhbnNmZXJzIiwiZ2V0VHhRdWVyeSIsImRlc2VyaWFsaXplVHJhbnNmZXJzIiwiZ2V0T3V0cHV0cyIsIm5vcm1hbGl6ZU91dHB1dFF1ZXJ5IiwiZ2V0X291dHB1dHMiLCJkZXNlcmlhbGl6ZU91dHB1dHMiLCJleHBvcnRPdXRwdXRzIiwiYWxsIiwiZXhwb3J0X291dHB1dHMiLCJvdXRwdXRzSGV4IiwiaW1wb3J0T3V0cHV0cyIsImltcG9ydF9vdXRwdXRzIiwibnVtSW1wb3J0ZWQiLCJleHBvcnRLZXlJbWFnZXMiLCJleHBvcnRfa2V5X2ltYWdlcyIsImtleUltYWdlc1N0ciIsImtleUltYWdlcyIsImtleUltYWdlSnNvbiIsIk1vbmVyb0tleUltYWdlIiwiaW1wb3J0S2V5SW1hZ2VzIiwiaW1wb3J0X2tleV9pbWFnZXMiLCJtYXAiLCJrZXlJbWFnZSIsImtleUltYWdlSW1wb3J0UmVzdWx0U3RyIiwiTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQiLCJnZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCIsImZyZWV6ZU91dHB1dCIsImZyZWV6ZV9vdXRwdXQiLCJ0aGF3T3V0cHV0IiwidGhhd19vdXRwdXQiLCJpc091dHB1dEZyb3plbiIsImlzX291dHB1dF9mcm96ZW4iLCJjcmVhdGVUeHMiLCJjb25maWdOb3JtYWxpemVkIiwibm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnIiwiZ2V0Q2FuU3BsaXQiLCJzZXRDYW5TcGxpdCIsImNyZWF0ZV90eHMiLCJ0eFNldEpzb25TdHIiLCJNb25lcm9UeFNldCIsInN3ZWVwT3V0cHV0Iiwibm9ybWFsaXplU3dlZXBPdXRwdXRDb25maWciLCJzd2VlcF9vdXRwdXQiLCJzd2VlcFVubG9ja2VkIiwibm9ybWFsaXplU3dlZXBVbmxvY2tlZENvbmZpZyIsInN3ZWVwX3VubG9ja2VkIiwidHhTZXRzSnNvbiIsInR4U2V0cyIsInR4U2V0SnNvbiIsInR4cyIsInR4U2V0IiwidHgiLCJzd2VlcER1c3QiLCJyZWxheSIsInN3ZWVwX2R1c3QiLCJzZXRUeHMiLCJyZWxheVR4cyIsInR4c09yTWV0YWRhdGFzIiwiQXJyYXkiLCJpc0FycmF5IiwidHhNZXRhZGF0YXMiLCJ0eE9yTWV0YWRhdGEiLCJNb25lcm9UeFdhbGxldCIsImdldE1ldGFkYXRhIiwicmVsYXlfdHhzIiwidHhIYXNoZXNKc29uIiwiZGVzY3JpYmVUeFNldCIsInVuc2lnbmVkVHhIZXgiLCJnZXRVbnNpZ25lZFR4SGV4Iiwic2lnbmVkVHhIZXgiLCJnZXRTaWduZWRUeEhleCIsIm11bHRpc2lnVHhIZXgiLCJnZXRNdWx0aXNpZ1R4SGV4IiwiZGVzY3JpYmVfdHhfc2V0IiwiZ2V0X2V4Y2VwdGlvbl9tZXNzYWdlIiwic2lnblR4cyIsInNpZ25fdHhzIiwic3VibWl0VHhzIiwic3VibWl0X3R4cyIsInNpZ25NZXNzYWdlIiwic2lnbmF0dXJlVHlwZSIsIk1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIiwiU0lHTl9XSVRIX1NQRU5EX0tFWSIsInNpZ25fbWVzc2FnZSIsInZlcmlmeU1lc3NhZ2UiLCJhZGRyZXNzIiwic2lnbmF0dXJlIiwidmVyaWZ5X21lc3NhZ2UiLCJpc0dvb2QiLCJNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0IiwiaXNPbGQiLCJTSUdOX1dJVEhfVklFV19LRVkiLCJ2ZXJzaW9uIiwiZ2V0VHhLZXkiLCJ0eEhhc2giLCJnZXRfdHhfa2V5IiwiY2hlY2tUeEtleSIsInR4S2V5IiwiY2hlY2tfdHhfa2V5IiwicmVzcEpzb25TdHIiLCJNb25lcm9DaGVja1R4IiwiZ2V0VHhQcm9vZiIsImdldF90eF9wcm9vZiIsImVycm9yS2V5IiwiaW5kZXhPZiIsInN1YnN0cmluZyIsImxlbmd0aCIsImNoZWNrVHhQcm9vZiIsImNoZWNrX3R4X3Byb29mIiwiZ2V0U3BlbmRQcm9vZiIsImdldF9zcGVuZF9wcm9vZiIsImNoZWNrU3BlbmRQcm9vZiIsImNoZWNrX3NwZW5kX3Byb29mIiwiZ2V0UmVzZXJ2ZVByb29mV2FsbGV0IiwiZ2V0X3Jlc2VydmVfcHJvb2Zfd2FsbGV0IiwiZ2V0UmVzZXJ2ZVByb29mQWNjb3VudCIsImFtb3VudCIsImdldF9yZXNlcnZlX3Byb29mX2FjY291bnQiLCJ0b1N0cmluZyIsImNoZWNrUmVzZXJ2ZVByb29mIiwiY2hlY2tfcmVzZXJ2ZV9wcm9vZiIsIk1vbmVyb0NoZWNrUmVzZXJ2ZSIsImdldFR4Tm90ZXMiLCJnZXRfdHhfbm90ZXMiLCJ0eE5vdGVzIiwic2V0VHhOb3RlcyIsIm5vdGVzIiwic2V0X3R4X25vdGVzIiwiZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzIiwiZW50cnlJbmRpY2VzIiwiZW50cmllcyIsImVudHJ5SnNvbiIsImdldF9hZGRyZXNzX2Jvb2tfZW50cmllcyIsIk1vbmVyb0FkZHJlc3NCb29rRW50cnkiLCJhZGRBZGRyZXNzQm9va0VudHJ5IiwiZGVzY3JpcHRpb24iLCJhZGRfYWRkcmVzc19ib29rX2VudHJ5IiwiZWRpdEFkZHJlc3NCb29rRW50cnkiLCJpbmRleCIsInNldEFkZHJlc3MiLCJzZXREZXNjcmlwdGlvbiIsImVkaXRfYWRkcmVzc19ib29rX2VudHJ5IiwiZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeSIsImVudHJ5SWR4IiwiZGVsZXRlX2FkZHJlc3NfYm9va19lbnRyeSIsInRhZ0FjY291bnRzIiwiYWNjb3VudEluZGljZXMiLCJ0YWdfYWNjb3VudHMiLCJ1bnRhZ0FjY291bnRzIiwiZ2V0QWNjb3VudFRhZ3MiLCJhY2NvdW50VGFncyIsImFjY291bnRUYWdKc29uIiwiZ2V0X2FjY291bnRfdGFncyIsIk1vbmVyb0FjY291bnRUYWciLCJzZXRBY2NvdW50VGFnTGFiZWwiLCJzZXRfYWNjb3VudF90YWdfbGFiZWwiLCJnZXRQYXltZW50VXJpIiwiZ2V0X3BheW1lbnRfdXJpIiwicGFyc2VQYXltZW50VXJpIiwiTW9uZXJvVHhDb25maWciLCJwYXJzZV9wYXltZW50X3VyaSIsImdldEF0dHJpYnV0ZSIsImtleSIsInZhbHVlIiwiZ2V0X2F0dHJpYnV0ZSIsInNldEF0dHJpYnV0ZSIsInZhbCIsInNldF9hdHRyaWJ1dGUiLCJzdGFydE1pbmluZyIsIm51bVRocmVhZHMiLCJiYWNrZ3JvdW5kTWluaW5nIiwiaWdub3JlQmF0dGVyeSIsImRhZW1vbiIsIk1vbmVyb0RhZW1vblJwYyIsImNvbm5lY3RUb0RhZW1vblJwYyIsInN0b3BNaW5pbmciLCJpc011bHRpc2lnSW1wb3J0TmVlZGVkIiwiaXNfbXVsdGlzaWdfaW1wb3J0X25lZWRlZCIsImlzTXVsdGlzaWciLCJpc19tdWx0aXNpZyIsImdldE11bHRpc2lnSW5mbyIsIk1vbmVyb011bHRpc2lnSW5mbyIsImdldF9tdWx0aXNpZ19pbmZvIiwicHJlcGFyZU11bHRpc2lnIiwicHJlcGFyZV9tdWx0aXNpZyIsIm1ha2VNdWx0aXNpZyIsIm11bHRpc2lnSGV4ZXMiLCJ0aHJlc2hvbGQiLCJtYWtlX211bHRpc2lnIiwiZXhjaGFuZ2VNdWx0aXNpZ0tleXMiLCJleGNoYW5nZV9tdWx0aXNpZ19rZXlzIiwiTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IiwiZXhwb3J0TXVsdGlzaWdIZXgiLCJleHBvcnRfbXVsdGlzaWdfaGV4IiwiaW1wb3J0TXVsdGlzaWdIZXgiLCJpbXBvcnRfbXVsdGlzaWdfaGV4Iiwic2lnbk11bHRpc2lnVHhIZXgiLCJzaWduX211bHRpc2lnX3R4X2hleCIsIk1vbmVyb011bHRpc2lnU2lnblJlc3VsdCIsInN1Ym1pdE11bHRpc2lnVHhIZXgiLCJzaWduZWRNdWx0aXNpZ1R4SGV4Iiwic3VibWl0X211bHRpc2lnX3R4X2hleCIsImdldERhdGEiLCJ2aWV3T25seSIsImlzVmlld09ubHkiLCJ2aWV3cyIsImNhY2hlQnVmZmVyTG9jIiwiZ2V0X2NhY2hlX2ZpbGVfYnVmZmVyIiwidmlldyIsIkRhdGFWaWV3IiwiQXJyYXlCdWZmZXIiLCJpIiwic2V0SW50OCIsIkhFQVBVOCIsInBvaW50ZXIiLCJVaW50OEFycmF5IiwiQllURVNfUEVSX0VMRU1FTlQiLCJfZnJlZSIsIkJ1ZmZlciIsImZyb20iLCJidWZmZXIiLCJrZXlzQnVmZmVyTG9jIiwiZ2V0X2tleXNfZmlsZV9idWZmZXIiLCJ1bnNoaWZ0IiwiY2hhbmdlUGFzc3dvcmQiLCJvbGRQYXNzd29yZCIsIm5ld1Bhc3N3b3JkIiwiY2hhbmdlX3dhbGxldF9wYXNzd29yZCIsImVyck1zZyIsImNsb3NlIiwiZ2V0TnVtQmxvY2tzVG9VbmxvY2siLCJnZXRUeCIsImdldEluY29taW5nVHJhbnNmZXJzIiwiZ2V0T3V0Z29pbmdUcmFuc2ZlcnMiLCJjcmVhdGVUeCIsInJlbGF5VHgiLCJnZXRUeE5vdGUiLCJzZXRUeE5vdGUiLCJub3RlIiwicHJveHlUb1dvcmtlciIsIm5ldHdvcmtUeXBlIiwiZGFlbW9uVXJpIiwiZGFlbW9uVXNlcm5hbWUiLCJkYWVtb25QYXNzd29yZCIsIm9wZW5fd2FsbGV0X2Z1bGwiLCJrZXlzRGF0YSIsImNhY2hlRGF0YSIsImJyb3dzZXJNYWluUGF0aCIsImNvbnNvbGUiLCJlcnJvciIsImlzRW5hYmxlZCIsInNldF9saXN0ZW5lciIsIm5ld0xpc3RlbmVySGFuZGxlIiwiaGVpZ2h0IiwiZW5kSGVpZ2h0IiwicGVyY2VudERvbmUiLCJvblN5bmNQcm9ncmVzcyIsIm9uTmV3QmxvY2siLCJuZXdCYWxhbmNlU3RyIiwibmV3VW5sb2NrZWRCYWxhbmNlU3RyIiwib25CYWxhbmNlc0NoYW5nZWQiLCJhbW91bnRTdHIiLCJ1bmxvY2tUaW1lIiwiaXNMb2NrZWQiLCJvbk91dHB1dFJlY2VpdmVkIiwiYWNjb3VudElkeFN0ciIsInN1YmFkZHJlc3NJZHhTdHIiLCJvbk91dHB1dFNwZW50Iiwic2FuaXRpemVCbG9jayIsImJsb2NrIiwic2FuaXRpemVUeFdhbGxldCIsImFjY291bnQiLCJzdWJhZGRyZXNzIiwiZGVzZXJpYWxpemVCbG9ja3MiLCJibG9ja3NKc29uIiwiZGVzZXJpYWxpemVkQmxvY2tzIiwiYmxvY2tzIiwiYmxvY2tKc29uIiwiTW9uZXJvQmxvY2siLCJEZXNlcmlhbGl6YXRpb25UeXBlIiwiVFhfV0FMTEVUIiwic2V0QmxvY2siLCJnZXRIYXNoZXMiLCJ0eE1hcCIsIk1hcCIsImdldEhhc2giLCJ0eHNTb3J0ZWQiLCJ0cmFuc2ZlcnMiLCJnZXRPdXRnb2luZ1RyYW5zZmVyIiwidHJhbnNmZXIiLCJvdXRwdXRzIiwib3V0cHV0Iiwic2V0QnJvd3Nlck1haW5QYXRoIiwiaXNDbG9zZWQiLCJQYXRoIiwibm9ybWFsaXplIiwid2FsbGV0RGlyIiwiZGlybmFtZSIsIm1rZGlyU3luYyIsImRhdGEiLCJ3cml0ZUZpbGVTeW5jIiwib2xkUGF0aCIsInVubGlua1N5bmMiLCJwYXRoTmV3IiwicmVuYW1lU3luYyIsImV4cG9ydHMiLCJkZWZhdWx0IiwiTW9uZXJvV2FsbGV0S2V5c1Byb3h5Iiwid2FsbGV0SWQiLCJpbnZva2VXb3JrZXIiLCJnZXRXb3JrZXIiLCJ3b3JrZXIiLCJ3cmFwcGVkTGlzdGVuZXJzIiwiYXJndW1lbnRzIiwidXJpT3JScGNDb25uZWN0aW9uIiwiZ2V0Q29uZmlnIiwicnBjQ29uZmlnIiwid3JhcHBlZExpc3RlbmVyIiwiV2FsbGV0V29ya2VyTGlzdGVuZXIiLCJsaXN0ZW5lcklkIiwiZ2V0SWQiLCJhZGRXb3JrZXJDYWxsYmFjayIsImdldExpc3RlbmVyIiwicmVtb3ZlV29ya2VyQ2FsbGJhY2siLCJzcGxpY2UiLCJyZXN1bHRKc29uIiwiYmxvY2tKc29ucyIsImtleUltYWdlc0pzb24iLCJhbm5vdW5jZVN5bmNQcm9ncmVzcyIsImFubm91bmNlTmV3QmxvY2siLCJhbm5vdW5jZUJhbGFuY2VzQ2hhbmdlZCIsIk1vbmVyb091dHB1dFdhbGxldCIsInNldEFtb3VudCIsInNldEFjY291bnRJbmRleCIsInNldFN1YmFkZHJlc3NJbmRleCIsInNldEhhc2giLCJzZXRWZXJzaW9uIiwic2V0VW5sb2NrVGltZSIsInNldFR4Iiwic2V0T3V0cHV0cyIsInNldElzSW5jb21pbmciLCJzZXRJc0xvY2tlZCIsInNldEhlaWdodCIsInNldElzQ29uZmlybWVkIiwic2V0SW5UeFBvb2wiLCJzZXRJc0ZhaWxlZCIsImFubm91bmNlT3V0cHV0UmVjZWl2ZWQiLCJwYXJzZUludCIsInNldElucHV0cyIsImFubm91bmNlT3V0cHV0U3BlbnQiLCJpZCIsImdldElucHV0cyJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL3dhbGxldC9Nb25lcm9XYWxsZXRGdWxsLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IFBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCBHZW5VdGlscyBmcm9tIFwiLi4vY29tbW9uL0dlblV0aWxzXCI7XG5pbXBvcnQgTGlicmFyeVV0aWxzIGZyb20gXCIuLi9jb21tb24vTGlicmFyeVV0aWxzXCI7XG5pbXBvcnQgVGFza0xvb3BlciBmcm9tIFwiLi4vY29tbW9uL1Rhc2tMb29wZXJcIjtcbmltcG9ydCBNb25lcm9BY2NvdW50IGZyb20gXCIuL21vZGVsL01vbmVyb0FjY291bnRcIjtcbmltcG9ydCBNb25lcm9BY2NvdW50VGFnIGZyb20gXCIuL21vZGVsL01vbmVyb0FjY291bnRUYWdcIjtcbmltcG9ydCBNb25lcm9BZGRyZXNzQm9va0VudHJ5IGZyb20gXCIuL21vZGVsL01vbmVyb0FkZHJlc3NCb29rRW50cnlcIjtcbmltcG9ydCBNb25lcm9CbG9jayBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0Jsb2NrXCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2tUeCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9DaGVja1R4XCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2tSZXNlcnZlIGZyb20gXCIuL21vZGVsL01vbmVyb0NoZWNrUmVzZXJ2ZVwiO1xuaW1wb3J0IE1vbmVyb0RhZW1vblJwYyBmcm9tIFwiLi4vZGFlbW9uL01vbmVyb0RhZW1vblJwY1wiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuLi9jb21tb24vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBNb25lcm9JbmNvbWluZ1RyYW5zZmVyIGZyb20gXCIuL21vZGVsL01vbmVyb0luY29taW5nVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvS2V5SW1hZ2VcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnSW5mbyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ0luZm9cIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnU2lnblJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb05ldHdvcmtUeXBlIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvTmV0d29ya1R5cGVcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRwdXRRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb091dHB1dFdhbGxldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRwdXRXYWxsZXRcIjtcbmltcG9ydCBNb25lcm9ScGNDb25uZWN0aW9uIGZyb20gXCIuLi9jb21tb24vTW9uZXJvUnBjQ29ubmVjdGlvblwiO1xuaW1wb3J0IE1vbmVyb1N1YmFkZHJlc3MgZnJvbSBcIi4vbW9kZWwvTW9uZXJvU3ViYWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb1N5bmNSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvU3luY1Jlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb1RyYW5zZmVyIGZyb20gXCIuL21vZGVsL01vbmVyb1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvVHJhbnNmZXJRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UcmFuc2ZlclF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvVHhDb25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhDb25maWdcIjtcbmltcG9ydCBNb25lcm9UeFF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb1R4UXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeFNldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFNldFwiO1xuaW1wb3J0IE1vbmVyb1R4IGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvVHhcIjtcbmltcG9ydCBNb25lcm9UeFdhbGxldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFdhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1dhbGxldCBmcm9tIFwiLi9Nb25lcm9XYWxsZXRcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRDb25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvV2FsbGV0Q29uZmlnXCI7XG5pbXBvcnQgeyBNb25lcm9XYWxsZXRLZXlzLCBNb25lcm9XYWxsZXRLZXlzUHJveHkgfSBmcm9tIFwiLi9Nb25lcm9XYWxsZXRLZXlzXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0TGlzdGVuZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvV2FsbGV0TGlzdGVuZXJcIjtcbmltcG9ydCBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZVwiO1xuaW1wb3J0IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb1ZlcnNpb24gZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9WZXJzaW9uXCI7XG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XG5cbi8qKlxuICogSW1wbGVtZW50cyBhIE1vbmVybyB3YWxsZXQgdXNpbmcgY2xpZW50LXNpZGUgV2ViQXNzZW1ibHkgYmluZGluZ3MgdG8gbW9uZXJvLXByb2plY3QncyB3YWxsZXQyIGluIEMrKy5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTW9uZXJvV2FsbGV0RnVsbCBleHRlbmRzIE1vbmVyb1dhbGxldEtleXMge1xuXG4gIC8vIHN0YXRpYyB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIHN0YXRpYyByZWFkb25seSBERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TID0gMjAwMDA7XG4gIHByb3RlY3RlZCBzdGF0aWMgRlM7XG5cbiAgLy8gaW5zdGFuY2UgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBwYXRoOiBzdHJpbmc7XG4gIHByb3RlY3RlZCBwYXNzd29yZDogc3RyaW5nO1xuICBwcm90ZWN0ZWQgbGlzdGVuZXJzOiBNb25lcm9XYWxsZXRMaXN0ZW5lcltdO1xuICBwcm90ZWN0ZWQgZnM6IGFueTtcbiAgcHJvdGVjdGVkIHdhc21MaXN0ZW5lcjogV2FsbGV0V2FzbUxpc3RlbmVyO1xuICBwcm90ZWN0ZWQgd2FzbUxpc3RlbmVySGFuZGxlOiBudW1iZXI7XG4gIHByb3RlY3RlZCByZWplY3RVbmF1dGhvcml6ZWQ6IGJvb2xlYW47XG4gIHByb3RlY3RlZCByZWplY3RVbmF1dGhvcml6ZWRDb25maWdJZDogc3RyaW5nO1xuICBwcm90ZWN0ZWQgc3luY1BlcmlvZEluTXM6IG51bWJlcjtcbiAgcHJvdGVjdGVkIHN5bmNMb29wZXI6IFRhc2tMb29wZXI7XG4gIHByb3RlY3RlZCBicm93c2VyTWFpblBhdGg6IHN0cmluZztcblxuICAvKipcbiAgICogSW50ZXJuYWwgY29uc3RydWN0b3Igd2hpY2ggaXMgZ2l2ZW4gdGhlIG1lbW9yeSBhZGRyZXNzIG9mIGEgQysrIHdhbGxldCBpbnN0YW5jZS5cbiAgICogXG4gICAqIFRoaXMgY29uc3RydWN0b3Igc2hvdWxkIGJlIGNhbGxlZCB0aHJvdWdoIHN0YXRpYyB3YWxsZXQgY3JlYXRpb24gdXRpbGl0aWVzIGluIHRoaXMgY2xhc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gY3BwQWRkcmVzcyAtIGFkZHJlc3Mgb2YgdGhlIHdhbGxldCBpbnN0YW5jZSBpbiBDKytcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggLSBwYXRoIG9mIHRoZSB3YWxsZXQgaW5zdGFuY2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhc3N3b3JkIC0gcGFzc3dvcmQgb2YgdGhlIHdhbGxldCBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge0ZpbGVTeXN0ZW19IGZzIC0gbm9kZS5qcy1jb21wYXRpYmxlIGZpbGUgc3lzdGVtIHRvIHJlYWQvd3JpdGUgd2FsbGV0IGZpbGVzXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gcmVqZWN0VW5hdXRob3JpemVkIC0gc3BlY2lmaWVzIGlmIHVuYXV0aG9yaXplZCByZXF1ZXN0cyAoZS5nLiBzZWxmLXNpZ25lZCBjZXJ0aWZpY2F0ZXMpIHNob3VsZCBiZSByZWplY3RlZFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcmVqZWN0VW5hdXRob3JpemVkRm5JZCAtIHVuaXF1ZSBpZGVudGlmaWVyIGZvciBodHRwX2NsaWVudF93YXNtIHRvIHF1ZXJ5IHJlamVjdFVuYXV0aG9yaXplZFxuICAgKiBAcGFyYW0ge01vbmVyb1dhbGxldEZ1bGxQcm94eX0gd2FsbGV0UHJveHkgLSBwcm94eSB0byBpbnZva2Ugd2FsbGV0IG9wZXJhdGlvbnMgaW4gYSB3ZWIgd29ya2VyXG4gICAqIFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgY29uc3RydWN0b3IoY3BwQWRkcmVzcywgcGF0aCwgcGFzc3dvcmQsIGZzLCByZWplY3RVbmF1dGhvcml6ZWQsIHJlamVjdFVuYXV0aG9yaXplZEZuSWQsIHdhbGxldFByb3h5PzogTW9uZXJvV2FsbGV0RnVsbFByb3h5KSB7XG4gICAgc3VwZXIoY3BwQWRkcmVzcywgd2FsbGV0UHJveHkpO1xuICAgIGlmICh3YWxsZXRQcm94eSkgcmV0dXJuO1xuICAgIHRoaXMucGF0aCA9IHBhdGg7XG4gICAgdGhpcy5wYXNzd29yZCA9IHBhc3N3b3JkO1xuICAgIHRoaXMubGlzdGVuZXJzID0gW107XG4gICAgdGhpcy5mcyA9IGZzID8gZnMgOiAocGF0aCA/IE1vbmVyb1dhbGxldEZ1bGwuZ2V0RnMoKSA6IHVuZGVmaW5lZCk7XG4gICAgdGhpcy5faXNDbG9zZWQgPSBmYWxzZTtcbiAgICB0aGlzLndhc21MaXN0ZW5lciA9IG5ldyBXYWxsZXRXYXNtTGlzdGVuZXIodGhpcyk7IC8vIHJlY2VpdmVzIG5vdGlmaWNhdGlvbnMgZnJvbSB3YXNtIGMrK1xuICAgIHRoaXMud2FzbUxpc3RlbmVySGFuZGxlID0gMDsgICAgICAgICAgICAgICAgICAgICAgLy8gbWVtb3J5IGFkZHJlc3Mgb2YgdGhlIHdhbGxldCBsaXN0ZW5lciBpbiBjKytcbiAgICB0aGlzLnJlamVjdFVuYXV0aG9yaXplZCA9IHJlamVjdFVuYXV0aG9yaXplZDtcbiAgICB0aGlzLnJlamVjdFVuYXV0aG9yaXplZENvbmZpZ0lkID0gcmVqZWN0VW5hdXRob3JpemVkRm5JZDtcbiAgICB0aGlzLnN5bmNQZXJpb2RJbk1zID0gTW9uZXJvV2FsbGV0RnVsbC5ERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TO1xuICAgIExpYnJhcnlVdGlscy5zZXRSZWplY3RVbmF1dGhvcml6ZWRGbihyZWplY3RVbmF1dGhvcml6ZWRGbklkLCAoKSA9PiB0aGlzLnJlamVjdFVuYXV0aG9yaXplZCk7IC8vIHJlZ2lzdGVyIGZuIGluZm9ybWluZyBpZiB1bmF1dGhvcml6ZWQgcmVxcyBzaG91bGQgYmUgcmVqZWN0ZWRcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBTVEFUSUMgVVRJTElUSUVTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICAvKipcbiAgICogQ2hlY2sgaWYgYSB3YWxsZXQgZXhpc3RzIGF0IGEgZ2l2ZW4gcGF0aC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gcGF0aCBvZiB0aGUgd2FsbGV0IG9uIHRoZSBmaWxlIHN5c3RlbVxuICAgKiBAcGFyYW0ge2ZzfSAtIE5vZGUuanMgY29tcGF0aWJsZSBmaWxlIHN5c3RlbSB0byB1c2UgKG9wdGlvbmFsLCBkZWZhdWx0cyB0byBkaXNrIGlmIG5vZGVqcylcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiBhIHdhbGxldCBleGlzdHMgYXQgdGhlIGdpdmVuIHBhdGgsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIHdhbGxldEV4aXN0cyhwYXRoLCBmcykge1xuICAgIGFzc2VydChwYXRoLCBcIk11c3QgcHJvdmlkZSBhIHBhdGggdG8gbG9vayBmb3IgYSB3YWxsZXRcIik7XG4gICAgaWYgKCFmcykgZnMgPSBNb25lcm9XYWxsZXRGdWxsLmdldEZzKCk7XG4gICAgaWYgKCFmcykgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGZpbGUgc3lzdGVtIHRvIGNoZWNrIGlmIHdhbGxldCBleGlzdHNcIik7XG4gICAgbGV0IGV4aXN0cyA9IGZzLmV4aXN0c1N5bmMocGF0aCArIFwiLmtleXNcIik7XG4gICAgTGlicmFyeVV0aWxzLmxvZygyLCBcIldhbGxldCBleGlzdHMgYXQgXCIgKyBwYXRoICsgXCI6IFwiICsgZXhpc3RzKTtcbiAgICByZXR1cm4gZXhpc3RzO1xuICB9XG4gIFxuICBzdGF0aWMgYXN5bmMgb3BlbldhbGxldChjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPikge1xuXG4gICAgLy8gdmFsaWRhdGUgY29uZmlnXG4gICAgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyhjb25maWcpO1xuICAgIGlmIChjb25maWcuZ2V0UHJveHlUb1dvcmtlcigpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRQcm94eVRvV29ya2VyKHRydWUpO1xuICAgIGlmIChjb25maWcuZ2V0U2VlZCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHNlZWQgd2hlbiBvcGVuaW5nIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFNlZWRPZmZzZXQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3BlY2lmeSBzZWVkIG9mZnNldCB3aGVuIG9wZW5pbmcgd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0UHJpbWFyeUFkZHJlc3MoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3BlY2lmeSBwcmltYXJ5IGFkZHJlc3Mgd2hlbiBvcGVuaW5nIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFByaXZhdGVWaWV3S2V5KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgcHJpdmF0ZSB2aWV3IGtleSB3aGVuIG9wZW5pbmcgd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0UHJpdmF0ZVNwZW5kS2V5KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgcHJpdmF0ZSBzcGVuZCBrZXkgd2hlbiBvcGVuaW5nIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFJlc3RvcmVIZWlnaHQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3BlY2lmeSByZXN0b3JlIGhlaWdodCB3aGVuIG9wZW5pbmcgd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0TGFuZ3VhZ2UoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3BlY2lmeSBsYW5ndWFnZSB3aGVuIG9wZW5pbmcgd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0U2F2ZUN1cnJlbnQoKSA9PT0gdHJ1ZSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNhdmUgY3VycmVudCB3YWxsZXQgd2hlbiBvcGVuaW5nIGZ1bGwgd2FsbGV0XCIpO1xuXG4gICAgLy8gc2V0IHNlcnZlciBmcm9tIGNvbm5lY3Rpb24gbWFuYWdlciBpZiBwcm92aWRlZFxuICAgIGlmIChjb25maWcuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSkge1xuICAgICAgaWYgKGNvbmZpZy5nZXRTZXJ2ZXIoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGNhbiBiZSBvcGVuZWQgd2l0aCBhIHNlcnZlciBvciBjb25uZWN0aW9uIG1hbmFnZXIgYnV0IG5vdCBib3RoXCIpO1xuICAgICAgY29uZmlnLnNldFNlcnZlcihjb25maWcuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKS5nZXRDb25uZWN0aW9uKCkpO1xuICAgIH1cblxuICAgIC8vIHJlYWQgd2FsbGV0IGRhdGEgZnJvbSBkaXNrIHVubGVzcyBwcm92aWRlZFxuICAgIGlmICghY29uZmlnLmdldEtleXNEYXRhKCkpIHtcbiAgICAgIGxldCBmcyA9IGNvbmZpZy5nZXRGcygpID8gY29uZmlnLmdldEZzKCkgOiBNb25lcm9XYWxsZXRGdWxsLmdldEZzKCk7XG4gICAgICBpZiAoIWZzKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgZmlsZSBzeXN0ZW0gdG8gcmVhZCB3YWxsZXQgZGF0YSBmcm9tXCIpO1xuICAgICAgaWYgKCF0aGlzLndhbGxldEV4aXN0cyhjb25maWcuZ2V0UGF0aCgpLCBmcykpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBkb2VzIG5vdCBleGlzdCBhdCBwYXRoOiBcIiArIGNvbmZpZy5nZXRQYXRoKCkpO1xuICAgICAgY29uZmlnLnNldEtleXNEYXRhKGZzLnJlYWRGaWxlU3luYyhjb25maWcuZ2V0UGF0aCgpICsgXCIua2V5c1wiKSk7XG4gICAgICBjb25maWcuc2V0Q2FjaGVEYXRhKGZzLmV4aXN0c1N5bmMoY29uZmlnLmdldFBhdGgoKSkgPyBmcy5yZWFkRmlsZVN5bmMoY29uZmlnLmdldFBhdGgoKSkgOiBcIlwiKTtcbiAgICB9XG5cbiAgICAvLyBvcGVuIHdhbGxldCBmcm9tIGRhdGFcbiAgICBjb25zdCB3YWxsZXQgPSBhd2FpdCBNb25lcm9XYWxsZXRGdWxsLm9wZW5XYWxsZXREYXRhKGNvbmZpZyk7XG5cbiAgICAvLyBzZXQgY29ubmVjdGlvbiBtYW5hZ2VyXG4gICAgYXdhaXQgd2FsbGV0LnNldENvbm5lY3Rpb25NYW5hZ2VyKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpKTtcbiAgICByZXR1cm4gd2FsbGV0O1xuICB9XG4gIFxuICBzdGF0aWMgYXN5bmMgY3JlYXRlV2FsbGV0KGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKTogUHJvbWlzZTxNb25lcm9XYWxsZXRGdWxsPiB7XG5cbiAgICAvLyB2YWxpZGF0ZSBjb25maWdcbiAgICBpZiAoY29uZmlnID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBjb25maWcgdG8gY3JlYXRlIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFNlZWQoKSAhPT0gdW5kZWZpbmVkICYmIChjb25maWcuZ2V0UHJpbWFyeUFkZHJlc3MoKSAhPT0gdW5kZWZpbmVkIHx8IGNvbmZpZy5nZXRQcml2YXRlVmlld0tleSgpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldFByaXZhdGVTcGVuZEtleSgpICE9PSB1bmRlZmluZWQpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgbWF5IGJlIGluaXRpYWxpemVkIHdpdGggYSBzZWVkIG9yIGtleXMgYnV0IG5vdCBib3RoXCIpO1xuICAgIGlmIChjb25maWcuZ2V0TmV0d29ya1R5cGUoKSA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgYSBuZXR3b3JrVHlwZTogJ21haW5uZXQnLCAndGVzdG5ldCcgb3IgJ3N0YWdlbmV0J1wiKTtcbiAgICBNb25lcm9OZXR3b3JrVHlwZS52YWxpZGF0ZShjb25maWcuZ2V0TmV0d29ya1R5cGUoKSk7XG4gICAgaWYgKGNvbmZpZy5nZXRTYXZlQ3VycmVudCgpID09PSB0cnVlKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc2F2ZSBjdXJyZW50IHdhbGxldCB3aGVuIGNyZWF0aW5nIGZ1bGwgV0FTTSB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFBhdGgoXCJcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkgJiYgTW9uZXJvV2FsbGV0RnVsbC53YWxsZXRFeGlzdHMoY29uZmlnLmdldFBhdGgoKSwgY29uZmlnLmdldEZzKCkpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgYWxyZWFkeSBleGlzdHM6IFwiICsgY29uZmlnLmdldFBhdGgoKSk7XG4gICAgaWYgKGNvbmZpZy5nZXRQYXNzd29yZCgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRQYXNzd29yZChcIlwiKTtcblxuICAgIC8vIHNldCBzZXJ2ZXIgZnJvbSBjb25uZWN0aW9uIG1hbmFnZXIgaWYgcHJvdmlkZWRcbiAgICBpZiAoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpIHtcbiAgICAgIGlmIChjb25maWcuZ2V0U2VydmVyKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBjYW4gYmUgY3JlYXRlZCB3aXRoIGEgc2VydmVyIG9yIGNvbm5lY3Rpb24gbWFuYWdlciBidXQgbm90IGJvdGhcIik7XG4gICAgICBjb25maWcuc2V0U2VydmVyKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpLmdldENvbm5lY3Rpb24oKSk7XG4gICAgfVxuXG4gICAgLy8gY3JlYXRlIHByb3hpZWQgb3IgbG9jYWwgd2FsbGV0XG4gICAgbGV0IHdhbGxldDtcbiAgICBpZiAoY29uZmlnLmdldFByb3h5VG9Xb3JrZXIoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UHJveHlUb1dvcmtlcih0cnVlKTtcbiAgICBpZiAoY29uZmlnLmdldFByb3h5VG9Xb3JrZXIoKSkge1xuICAgICAgbGV0IHdhbGxldFByb3h5ID0gYXdhaXQgTW9uZXJvV2FsbGV0RnVsbFByb3h5LmNyZWF0ZVdhbGxldChjb25maWcpO1xuICAgICAgd2FsbGV0ID0gbmV3IE1vbmVyb1dhbGxldEZ1bGwodW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgd2FsbGV0UHJveHkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoY29uZmlnLmdldFNlZWQoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmIChjb25maWcuZ2V0TGFuZ3VhZ2UoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSBsYW5ndWFnZSB3aGVuIGNyZWF0aW5nIHdhbGxldCBmcm9tIHNlZWRcIik7XG4gICAgICAgIHdhbGxldCA9IGF3YWl0IE1vbmVyb1dhbGxldEZ1bGwuY3JlYXRlV2FsbGV0RnJvbVNlZWQoY29uZmlnKTtcbiAgICAgIH0gZWxzZSBpZiAoY29uZmlnLmdldFByaXZhdGVTcGVuZEtleSgpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldFByaW1hcnlBZGRyZXNzKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAoY29uZmlnLmdldFNlZWRPZmZzZXQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSBzZWVkT2Zmc2V0IHdoZW4gY3JlYXRpbmcgd2FsbGV0IGZyb20ga2V5c1wiKTtcbiAgICAgICAgd2FsbGV0ID0gYXdhaXQgTW9uZXJvV2FsbGV0RnVsbC5jcmVhdGVXYWxsZXRGcm9tS2V5cyhjb25maWcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgc2VlZE9mZnNldCB3aGVuIGNyZWF0aW5nIHJhbmRvbSB3YWxsZXRcIik7XG4gICAgICAgIGlmIChjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHJlc3RvcmVIZWlnaHQgd2hlbiBjcmVhdGluZyByYW5kb20gd2FsbGV0XCIpO1xuICAgICAgICB3YWxsZXQgPSBhd2FpdCBNb25lcm9XYWxsZXRGdWxsLmNyZWF0ZVdhbGxldFJhbmRvbShjb25maWcpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBzZXQgY29ubmVjdGlvbiBtYW5hZ2VyXG4gICAgYXdhaXQgd2FsbGV0LnNldENvbm5lY3Rpb25NYW5hZ2VyKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpKTtcbiAgICByZXR1cm4gd2FsbGV0O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIGNyZWF0ZVdhbGxldEZyb21TZWVkKGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKTogUHJvbWlzZTxNb25lcm9XYWxsZXRGdWxsPiB7XG5cbiAgICAvLyB2YWxpZGF0ZSBhbmQgbm9ybWFsaXplIHBhcmFtc1xuICAgIGxldCBkYWVtb25Db25uZWN0aW9uID0gY29uZmlnLmdldFNlcnZlcigpO1xuICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWQgPSBkYWVtb25Db25uZWN0aW9uID8gZGFlbW9uQ29ubmVjdGlvbi5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHRydWU7XG4gICAgaWYgKGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFJlc3RvcmVIZWlnaHQoMCk7XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFNlZWRPZmZzZXQoXCJcIik7XG4gICAgXG4gICAgLy8gbG9hZCBmdWxsIHdhc20gbW9kdWxlXG4gICAgbGV0IG1vZHVsZSA9IGF3YWl0IExpYnJhcnlVdGlscy5sb2FkRnVsbE1vZHVsZSgpO1xuICAgIFxuICAgIC8vIGNyZWF0ZSB3YWxsZXQgaW4gcXVldWVcbiAgICBsZXQgd2FsbGV0ID0gYXdhaXQgbW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgIC8vIHJlZ2lzdGVyIGZuIGluZm9ybWluZyBpZiB1bmF1dGhvcml6ZWQgcmVxcyBzaG91bGQgYmUgcmVqZWN0ZWRcbiAgICAgICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZEZuSWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5zZXRSZWplY3RVbmF1dGhvcml6ZWRGbihyZWplY3RVbmF1dGhvcml6ZWRGbklkLCAoKSA9PiByZWplY3RVbmF1dGhvcml6ZWQpO1xuICAgICAgICBcbiAgICAgICAgLy8gY3JlYXRlIHdhbGxldCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIG1vZHVsZS5jcmVhdGVfZnVsbF93YWxsZXQoSlNPTi5zdHJpbmdpZnkoY29uZmlnLnRvSnNvbigpKSwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCwgYXN5bmMgKGNwcEFkZHJlc3MpID0+IHtcbiAgICAgICAgICBpZiAodHlwZW9mIGNwcEFkZHJlc3MgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoY3BwQWRkcmVzcykpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvV2FsbGV0RnVsbChjcHBBZGRyZXNzLCBjb25maWcuZ2V0UGF0aCgpLCBjb25maWcuZ2V0UGFzc3dvcmQoKSwgY29uZmlnLmdldEZzKCksIGNvbmZpZy5nZXRTZXJ2ZXIoKSA/IGNvbmZpZy5nZXRTZXJ2ZXIoKS5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHVuZGVmaW5lZCwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIFxuICAgIC8vIHNhdmUgd2FsbGV0XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkpIGF3YWl0IHdhbGxldC5zYXZlKCk7XG4gICAgcmV0dXJuIHdhbGxldDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBhc3luYyBjcmVhdGVXYWxsZXRGcm9tS2V5cyhjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZyk6IFByb21pc2U8TW9uZXJvV2FsbGV0RnVsbD4ge1xuXG4gICAgLy8gdmFsaWRhdGUgYW5kIG5vcm1hbGl6ZSBwYXJhbXNcbiAgICBNb25lcm9OZXR3b3JrVHlwZS52YWxpZGF0ZShjb25maWcuZ2V0TmV0d29ya1R5cGUoKSk7XG4gICAgaWYgKGNvbmZpZy5nZXRQcmltYXJ5QWRkcmVzcygpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRQcmltYXJ5QWRkcmVzcyhcIlwiKTtcbiAgICBpZiAoY29uZmlnLmdldFByaXZhdGVWaWV3S2V5KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFByaXZhdGVWaWV3S2V5KFwiXCIpO1xuICAgIGlmIChjb25maWcuZ2V0UHJpdmF0ZVNwZW5kS2V5KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFByaXZhdGVTcGVuZEtleShcIlwiKTtcbiAgICBsZXQgZGFlbW9uQ29ubmVjdGlvbiA9IGNvbmZpZy5nZXRTZXJ2ZXIoKTtcbiAgICBsZXQgcmVqZWN0VW5hdXRob3JpemVkID0gZGFlbW9uQ29ubmVjdGlvbiA/IGRhZW1vbkNvbm5lY3Rpb24uZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkgOiB0cnVlO1xuICAgIGlmIChjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRSZXN0b3JlSGVpZ2h0KDApO1xuICAgIGlmIChjb25maWcuZ2V0TGFuZ3VhZ2UoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0TGFuZ3VhZ2UoXCJFbmdsaXNoXCIpO1xuICAgIFxuICAgIC8vIGxvYWQgZnVsbCB3YXNtIG1vZHVsZVxuICAgIGxldCBtb2R1bGUgPSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZEZ1bGxNb2R1bGUoKTtcbiAgICBcbiAgICAvLyBjcmVhdGUgd2FsbGV0IGluIHF1ZXVlXG4gICAgbGV0IHdhbGxldCA9IGF3YWl0IG1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIHJlZ2lzdGVyIGZuIGluZm9ybWluZyBpZiB1bmF1dGhvcml6ZWQgcmVxcyBzaG91bGQgYmUgcmVqZWN0ZWRcbiAgICAgICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZEZuSWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5zZXRSZWplY3RVbmF1dGhvcml6ZWRGbihyZWplY3RVbmF1dGhvcml6ZWRGbklkLCAoKSA9PiByZWplY3RVbmF1dGhvcml6ZWQpO1xuICAgICAgICBcbiAgICAgICAgLy8gY3JlYXRlIHdhbGxldCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIG1vZHVsZS5jcmVhdGVfZnVsbF93YWxsZXQoSlNPTi5zdHJpbmdpZnkoY29uZmlnLnRvSnNvbigpKSwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCwgYXN5bmMgKGNwcEFkZHJlc3MpID0+IHtcbiAgICAgICAgICBpZiAodHlwZW9mIGNwcEFkZHJlc3MgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoY3BwQWRkcmVzcykpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvV2FsbGV0RnVsbChjcHBBZGRyZXNzLCBjb25maWcuZ2V0UGF0aCgpLCBjb25maWcuZ2V0UGFzc3dvcmQoKSwgY29uZmlnLmdldEZzKCksIGNvbmZpZy5nZXRTZXJ2ZXIoKSA/IGNvbmZpZy5nZXRTZXJ2ZXIoKS5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHVuZGVmaW5lZCwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIFxuICAgIC8vIHNhdmUgd2FsbGV0XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkpIGF3YWl0IHdhbGxldC5zYXZlKCk7XG4gICAgcmV0dXJuIHdhbGxldDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBhc3luYyBjcmVhdGVXYWxsZXRSYW5kb20oY29uZmlnOiBNb25lcm9XYWxsZXRDb25maWcpOiBQcm9taXNlPE1vbmVyb1dhbGxldEZ1bGw+IHtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSBhbmQgbm9ybWFsaXplIHBhcmFtc1xuICAgIGlmIChjb25maWcuZ2V0TGFuZ3VhZ2UoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0TGFuZ3VhZ2UoXCJFbmdsaXNoXCIpO1xuICAgIGxldCBkYWVtb25Db25uZWN0aW9uID0gY29uZmlnLmdldFNlcnZlcigpO1xuICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWQgPSBkYWVtb25Db25uZWN0aW9uID8gZGFlbW9uQ29ubmVjdGlvbi5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHRydWU7XG4gICAgXG4gICAgLy8gbG9hZCB3YXNtIG1vZHVsZVxuICAgIGxldCBtb2R1bGUgPSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZEZ1bGxNb2R1bGUoKTtcbiAgICBcbiAgICAvLyBjcmVhdGUgd2FsbGV0IGluIHF1ZXVlXG4gICAgbGV0IHdhbGxldCA9IGF3YWl0IG1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIHJlZ2lzdGVyIGZuIGluZm9ybWluZyBpZiB1bmF1dGhvcml6ZWQgcmVxcyBzaG91bGQgYmUgcmVqZWN0ZWRcbiAgICAgICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZEZuSWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5zZXRSZWplY3RVbmF1dGhvcml6ZWRGbihyZWplY3RVbmF1dGhvcml6ZWRGbklkLCAoKSA9PiByZWplY3RVbmF1dGhvcml6ZWQpO1xuICAgICAgXG4gICAgICAgIC8vIGNyZWF0ZSB3YWxsZXQgaW4gd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICBtb2R1bGUuY3JlYXRlX2Z1bGxfd2FsbGV0KEpTT04uc3RyaW5naWZ5KGNvbmZpZy50b0pzb24oKSksIHJlamVjdFVuYXV0aG9yaXplZEZuSWQsIGFzeW5jIChjcHBBZGRyZXNzKSA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBjcHBBZGRyZXNzID09PSBcInN0cmluZ1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKGNwcEFkZHJlc3MpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb1dhbGxldEZ1bGwoY3BwQWRkcmVzcywgY29uZmlnLmdldFBhdGgoKSwgY29uZmlnLmdldFBhc3N3b3JkKCksIGNvbmZpZy5nZXRGcygpLCBjb25maWcuZ2V0U2VydmVyKCkgPyBjb25maWcuZ2V0U2VydmVyKCkuZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkgOiB1bmRlZmluZWQsIHJlamVjdFVuYXV0aG9yaXplZEZuSWQpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBcbiAgICAvLyBzYXZlIHdhbGxldFxuICAgIGlmIChjb25maWcuZ2V0UGF0aCgpKSBhd2FpdCB3YWxsZXQuc2F2ZSgpO1xuICAgIHJldHVybiB3YWxsZXQ7XG4gIH1cbiAgXG4gIHN0YXRpYyBhc3luYyBnZXRTZWVkTGFuZ3VhZ2VzKCkge1xuICAgIGxldCBtb2R1bGUgPSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZEZ1bGxNb2R1bGUoKTtcbiAgICByZXR1cm4gbW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShtb2R1bGUuZ2V0X2tleXNfd2FsbGV0X3NlZWRfbGFuZ3VhZ2VzKCkpLmxhbmd1YWdlcztcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBnZXRGcygpIHtcbiAgICBpZiAoIU1vbmVyb1dhbGxldEZ1bGwuRlMpIE1vbmVyb1dhbGxldEZ1bGwuRlMgPSBHZW5VdGlscy5pc0Jyb3dzZXIoKSA/IHVuZGVmaW5lZCA6IGZzO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLkZTO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0gV0FMTEVUIE1FVEhPRFMgU1BFQ0lGSUMgVE8gV0FTTSBJTVBMRU1FTlRBVElPTiAtLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFRPRE86IG1vdmUgdGhlc2UgdG8gTW9uZXJvV2FsbGV0LnRzLCBvdGhlcnMgY2FuIGJlIHVuc3VwcG9ydGVkXG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBtYXhpbXVtIGhlaWdodCBvZiB0aGUgcGVlcnMgdGhlIHdhbGxldCdzIGRhZW1vbiBpcyBjb25uZWN0ZWQgdG8uXG4gICAqXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyPn0gdGhlIG1heGltdW0gaGVpZ2h0IG9mIHRoZSBwZWVycyB0aGUgd2FsbGV0J3MgZGFlbW9uIGlzIGNvbm5lY3RlZCB0b1xuICAgKi9cbiAgYXN5bmMgZ2V0RGFlbW9uTWF4UGVlckhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0RGFlbW9uTWF4UGVlckhlaWdodCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBcbiAgICAgICAgLy8gY2FsbCB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIHRoaXMubW9kdWxlLmdldF9kYWVtb25fbWF4X3BlZXJfaGVpZ2h0KHRoaXMuY3BwQWRkcmVzcywgKHJlc3ApID0+IHtcbiAgICAgICAgICByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSB3YWxsZXQncyBkYWVtb24gaXMgc3luY2VkIHdpdGggdGhlIG5ldHdvcmsuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSB0cnVlIGlmIHRoZSBkYWVtb24gaXMgc3luY2VkIHdpdGggdGhlIG5ldHdvcmssIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgYXN5bmMgaXNEYWVtb25TeW5jZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pc0RhZW1vblN5bmNlZCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBcbiAgICAgICAgLy8gY2FsbCB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIHRoaXMubW9kdWxlLmlzX2RhZW1vbl9zeW5jZWQodGhpcy5jcHBBZGRyZXNzLCAocmVzcCkgPT4ge1xuICAgICAgICAgIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIHdhbGxldCBpcyBzeW5jZWQgd2l0aCB0aGUgZGFlbW9uLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiB0aGUgd2FsbGV0IGlzIHN5bmNlZCB3aXRoIHRoZSBkYWVtb24sIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgYXN5bmMgaXNTeW5jZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pc1N5bmNlZCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmlzX3N5bmNlZCh0aGlzLmNwcEFkZHJlc3MsIChyZXNwKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgd2FsbGV0J3MgbmV0d29yayB0eXBlIChtYWlubmV0LCB0ZXN0bmV0LCBvciBzdGFnZW5ldCkuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb05ldHdvcmtUeXBlPn0gdGhlIHdhbGxldCdzIG5ldHdvcmsgdHlwZVxuICAgKi9cbiAgYXN5bmMgZ2V0TmV0d29ya1R5cGUoKTogUHJvbWlzZTxNb25lcm9OZXR3b3JrVHlwZT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0TmV0d29ya1R5cGUoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gdGhpcy5tb2R1bGUuZ2V0X25ldHdvcmtfdHlwZSh0aGlzLmNwcEFkZHJlc3MpO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBoZWlnaHQgb2YgdGhlIGZpcnN0IGJsb2NrIHRoYXQgdGhlIHdhbGxldCBzY2Fucy5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyPn0gdGhlIGhlaWdodCBvZiB0aGUgZmlyc3QgYmxvY2sgdGhhdCB0aGUgd2FsbGV0IHNjYW5zXG4gICAqL1xuICBhc3luYyBnZXRSZXN0b3JlSGVpZ2h0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRSZXN0b3JlSGVpZ2h0KCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLmdldF9yZXN0b3JlX2hlaWdodCh0aGlzLmNwcEFkZHJlc3MpO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogU2V0IHRoZSBoZWlnaHQgb2YgdGhlIGZpcnN0IGJsb2NrIHRoYXQgdGhlIHdhbGxldCBzY2Fucy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSByZXN0b3JlSGVpZ2h0IC0gaGVpZ2h0IG9mIHRoZSBmaXJzdCBibG9jayB0aGF0IHRoZSB3YWxsZXQgc2NhbnNcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHNldFJlc3RvcmVIZWlnaHQocmVzdG9yZUhlaWdodDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zZXRSZXN0b3JlSGVpZ2h0KHJlc3RvcmVIZWlnaHQpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRoaXMubW9kdWxlLnNldF9yZXN0b3JlX2hlaWdodCh0aGlzLmNwcEFkZHJlc3MsIHJlc3RvcmVIZWlnaHQpO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogTW92ZSB0aGUgd2FsbGV0IGZyb20gaXRzIGN1cnJlbnQgcGF0aCB0byB0aGUgZ2l2ZW4gcGF0aC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gdGhlIHdhbGxldCdzIGRlc3RpbmF0aW9uIHBhdGhcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIG1vdmVUbyhwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLm1vdmVUbyhwYXRoKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5tb3ZlVG8ocGF0aCwgdGhpcyk7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIENPTU1PTiBXQUxMRVQgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICBhc3luYyBhZGRMaXN0ZW5lcihsaXN0ZW5lcjogTW9uZXJvV2FsbGV0TGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBhd2FpdCBzdXBlci5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoTGlzdGVuaW5nKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgYXdhaXQgc3VwZXIucmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICB9XG4gIFxuICBnZXRMaXN0ZW5lcnMoKTogTW9uZXJvV2FsbGV0TGlzdGVuZXJbXSB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRMaXN0ZW5lcnMoKTtcbiAgICByZXR1cm4gc3VwZXIuZ2V0TGlzdGVuZXJzKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHNldERhZW1vbkNvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uPzogTW9uZXJvUnBjQ29ubmVjdGlvbiB8IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2V0RGFlbW9uQ29ubmVjdGlvbih1cmlPckNvbm5lY3Rpb24pO1xuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSBjb25uZWN0aW9uXG4gICAgbGV0IGNvbm5lY3Rpb24gPSAhdXJpT3JDb25uZWN0aW9uID8gdW5kZWZpbmVkIDogdXJpT3JDb25uZWN0aW9uIGluc3RhbmNlb2YgTW9uZXJvUnBjQ29ubmVjdGlvbiA/IHVyaU9yQ29ubmVjdGlvbiA6IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHVyaU9yQ29ubmVjdGlvbik7XG4gICAgbGV0IHVyaSA9IGNvbm5lY3Rpb24gJiYgY29ubmVjdGlvbi5nZXRVcmkoKSA/IGNvbm5lY3Rpb24uZ2V0VXJpKCkgOiBcIlwiO1xuICAgIGxldCB1c2VybmFtZSA9IGNvbm5lY3Rpb24gJiYgY29ubmVjdGlvbi5nZXRVc2VybmFtZSgpID8gY29ubmVjdGlvbi5nZXRVc2VybmFtZSgpIDogXCJcIjtcbiAgICBsZXQgcGFzc3dvcmQgPSBjb25uZWN0aW9uICYmIGNvbm5lY3Rpb24uZ2V0UGFzc3dvcmQoKSA/IGNvbm5lY3Rpb24uZ2V0UGFzc3dvcmQoKSA6IFwiXCI7XG4gICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZCA9IGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdW5kZWZpbmVkO1xuICAgIHRoaXMucmVqZWN0VW5hdXRob3JpemVkID0gcmVqZWN0VW5hdXRob3JpemVkOyAgLy8gcGVyc2lzdCBsb2NhbGx5XG4gICAgXG4gICAgLy8gc2V0IGNvbm5lY3Rpb24gaW4gcXVldWVcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5zZXRfZGFlbW9uX2Nvbm5lY3Rpb24odGhpcy5jcHBBZGRyZXNzLCB1cmksIHVzZXJuYW1lLCBwYXNzd29yZCwgKHJlc3ApID0+IHtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldERhZW1vbkNvbm5lY3Rpb24oKTogUHJvbWlzZTxNb25lcm9ScGNDb25uZWN0aW9uPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXREYWVtb25Db25uZWN0aW9uKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgbGV0IGNvbm5lY3Rpb25Db250YWluZXJTdHIgPSB0aGlzLm1vZHVsZS5nZXRfZGFlbW9uX2Nvbm5lY3Rpb24odGhpcy5jcHBBZGRyZXNzKTtcbiAgICAgICAgaWYgKCFjb25uZWN0aW9uQ29udGFpbmVyU3RyKSByZXNvbHZlKHVuZGVmaW5lZCk7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGxldCBqc29uQ29ubmVjdGlvbiA9IEpTT04ucGFyc2UoY29ubmVjdGlvbkNvbnRhaW5lclN0cik7XG4gICAgICAgICAgcmVzb2x2ZShuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih7dXJpOiBqc29uQ29ubmVjdGlvbi51cmksIHVzZXJuYW1lOiBqc29uQ29ubmVjdGlvbi51c2VybmFtZSwgcGFzc3dvcmQ6IGpzb25Db25uZWN0aW9uLnBhc3N3b3JkLCByZWplY3RVbmF1dGhvcml6ZWQ6IHRoaXMucmVqZWN0VW5hdXRob3JpemVkfSkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgaXNDb25uZWN0ZWRUb0RhZW1vbigpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmlzQ29ubmVjdGVkVG9EYWVtb24oKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5pc19jb25uZWN0ZWRfdG9fZGFlbW9uKHRoaXMuY3BwQWRkcmVzcywgKHJlc3ApID0+IHtcbiAgICAgICAgICByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRWZXJzaW9uKCk6IFByb21pc2U8TW9uZXJvVmVyc2lvbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0VmVyc2lvbigpO1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGF0aCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0UGF0aCgpO1xuICAgIHJldHVybiB0aGlzLnBhdGg7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEludGVncmF0ZWRBZGRyZXNzKHN0YW5kYXJkQWRkcmVzcz86IHN0cmluZywgcGF5bWVudElkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0SW50ZWdyYXRlZEFkZHJlc3Moc3RhbmRhcmRBZGRyZXNzLCBwYXltZW50SWQpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGxldCByZXN1bHQgPSB0aGlzLm1vZHVsZS5nZXRfaW50ZWdyYXRlZF9hZGRyZXNzKHRoaXMuY3BwQWRkcmVzcywgc3RhbmRhcmRBZGRyZXNzID8gc3RhbmRhcmRBZGRyZXNzIDogXCJcIiwgcGF5bWVudElkID8gcGF5bWVudElkIDogXCJcIik7XG4gICAgICAgIGlmIChyZXN1bHQuY2hhckF0KDApICE9PSBcIntcIikgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHJlc3VsdCk7XG4gICAgICAgIHJldHVybiBuZXcgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MoSlNPTi5wYXJzZShyZXN1bHQpKTtcbiAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgIGlmIChlcnIubWVzc2FnZS5pbmNsdWRlcyhcIkludmFsaWQgcGF5bWVudCBJRFwiKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiSW52YWxpZCBwYXltZW50IElEOiBcIiArIHBheW1lbnRJZCk7XG4gICAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihlcnIubWVzc2FnZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGRlY29kZUludGVncmF0ZWRBZGRyZXNzKGludGVncmF0ZWRBZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5kZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyhpbnRlZ3JhdGVkQWRkcmVzcyk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IHRoaXMubW9kdWxlLmRlY29kZV9pbnRlZ3JhdGVkX2FkZHJlc3ModGhpcy5jcHBBZGRyZXNzLCBpbnRlZ3JhdGVkQWRkcmVzcyk7XG4gICAgICAgIGlmIChyZXN1bHQuY2hhckF0KDApICE9PSBcIntcIikgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHJlc3VsdCk7XG4gICAgICAgIHJldHVybiBuZXcgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MoSlNPTi5wYXJzZShyZXN1bHQpKTtcbiAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihlcnIubWVzc2FnZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0SGVpZ2h0KCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X2hlaWdodCh0aGlzLmNwcEFkZHJlc3MsIChyZXNwKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RGFlbW9uSGVpZ2h0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXREYWVtb25IZWlnaHQoKTtcbiAgICBpZiAoIShhd2FpdCB0aGlzLmlzQ29ubmVjdGVkVG9EYWVtb24oKSkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBpcyBub3QgY29ubmVjdGVkIHRvIGRhZW1vblwiKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfZGFlbW9uX2hlaWdodCh0aGlzLmNwcEFkZHJlc3MsIChyZXNwKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0QnlEYXRlKHllYXI6IG51bWJlciwgbW9udGg6IG51bWJlciwgZGF5OiBudW1iZXIpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0SGVpZ2h0QnlEYXRlKHllYXIsIG1vbnRoLCBkYXkpO1xuICAgIGlmICghKGF3YWl0IHRoaXMuaXNDb25uZWN0ZWRUb0RhZW1vbigpKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGlzIG5vdCBjb25uZWN0ZWQgdG8gZGFlbW9uXCIpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmdldF9oZWlnaHRfYnlfZGF0ZSh0aGlzLmNwcEFkZHJlc3MsIHllYXIsIG1vbnRoLCBkYXksIChyZXNwKSA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiByZXNwID09PSBcInN0cmluZ1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTeW5jaHJvbml6ZSB0aGUgd2FsbGV0IHdpdGggdGhlIGRhZW1vbiBhcyBhIG9uZS10aW1lIHN5bmNocm9ub3VzIHByb2Nlc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1dhbGxldExpc3RlbmVyfG51bWJlcn0gW2xpc3RlbmVyT3JTdGFydEhlaWdodF0gLSBsaXN0ZW5lciB4b3Igc3RhcnQgaGVpZ2h0IChkZWZhdWx0cyB0byBubyBzeW5jIGxpc3RlbmVyLCB0aGUgbGFzdCBzeW5jZWQgYmxvY2spXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbc3RhcnRIZWlnaHRdIC0gc3RhcnRIZWlnaHQgaWYgbm90IGdpdmVuIGluIGZpcnN0IGFyZyAoZGVmYXVsdHMgdG8gbGFzdCBzeW5jZWQgYmxvY2spXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2FsbG93Q29uY3VycmVudENhbGxzXSAtIGFsbG93IG90aGVyIHdhbGxldCBtZXRob2RzIHRvIGJlIHByb2Nlc3NlZCBzaW11bHRhbmVvdXNseSBkdXJpbmcgc3luYyAoZGVmYXVsdCBmYWxzZSk8YnI+PGJyPjxiPldBUk5JTkc8L2I+OiBlbmFibGluZyB0aGlzIG9wdGlvbiB3aWxsIGNyYXNoIHdhbGxldCBleGVjdXRpb24gaWYgYW5vdGhlciBjYWxsIG1ha2VzIGEgc2ltdWx0YW5lb3VzIG5ldHdvcmsgcmVxdWVzdC4gVE9ETzogcG9zc2libGUgdG8gc3luYyB3YXNtIG5ldHdvcmsgcmVxdWVzdHMgaW4gaHR0cF9jbGllbnRfd2FzbS5jcHA/IFxuICAgKi9cbiAgYXN5bmMgc3luYyhsaXN0ZW5lck9yU3RhcnRIZWlnaHQ/OiBNb25lcm9XYWxsZXRMaXN0ZW5lciB8IG51bWJlciwgc3RhcnRIZWlnaHQ/OiBudW1iZXIsIGFsbG93Q29uY3VycmVudENhbGxzID0gZmFsc2UpOiBQcm9taXNlPE1vbmVyb1N5bmNSZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN5bmMobGlzdGVuZXJPclN0YXJ0SGVpZ2h0LCBzdGFydEhlaWdodCwgYWxsb3dDb25jdXJyZW50Q2FsbHMpO1xuICAgIGlmICghKGF3YWl0IHRoaXMuaXNDb25uZWN0ZWRUb0RhZW1vbigpKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGlzIG5vdCBjb25uZWN0ZWQgdG8gZGFlbW9uXCIpO1xuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSBwYXJhbXNcbiAgICBzdGFydEhlaWdodCA9IGxpc3RlbmVyT3JTdGFydEhlaWdodCA9PT0gdW5kZWZpbmVkIHx8IGxpc3RlbmVyT3JTdGFydEhlaWdodCBpbnN0YW5jZW9mIE1vbmVyb1dhbGxldExpc3RlbmVyID8gc3RhcnRIZWlnaHQgOiBsaXN0ZW5lck9yU3RhcnRIZWlnaHQ7XG4gICAgbGV0IGxpc3RlbmVyID0gbGlzdGVuZXJPclN0YXJ0SGVpZ2h0IGluc3RhbmNlb2YgTW9uZXJvV2FsbGV0TGlzdGVuZXIgPyBsaXN0ZW5lck9yU3RhcnRIZWlnaHQgOiB1bmRlZmluZWQ7XG4gICAgaWYgKHN0YXJ0SGVpZ2h0ID09PSB1bmRlZmluZWQpIHN0YXJ0SGVpZ2h0ID0gTWF0aC5tYXgoYXdhaXQgdGhpcy5nZXRIZWlnaHQoKSwgYXdhaXQgdGhpcy5nZXRSZXN0b3JlSGVpZ2h0KCkpO1xuICAgIFxuICAgIC8vIHJlZ2lzdGVyIGxpc3RlbmVyIGlmIGdpdmVuXG4gICAgaWYgKGxpc3RlbmVyKSBhd2FpdCB0aGlzLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBcbiAgICAvLyBzeW5jIHdhbGxldFxuICAgIGxldCBlcnI7XG4gICAgbGV0IHJlc3VsdDtcbiAgICB0cnkge1xuICAgICAgbGV0IHRoYXQgPSB0aGlzO1xuICAgICAgcmVzdWx0ID0gYXdhaXQgKGFsbG93Q29uY3VycmVudENhbGxzID8gc3luY1dhc20oKSA6IHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiBzeW5jV2FzbSgpKSk7XG4gICAgICBmdW5jdGlvbiBzeW5jV2FzbSgpIHtcbiAgICAgICAgdGhhdC5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgICAgLy8gc3luYyB3YWxsZXQgaW4gd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICAgIHRoYXQubW9kdWxlLnN5bmModGhhdC5jcHBBZGRyZXNzLCBzdGFydEhlaWdodCwgYXN5bmMgKHJlc3ApID0+IHtcbiAgICAgICAgICAgIGlmIChyZXNwLmNoYXJBdCgwKSAhPT0gXCJ7XCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcCkpO1xuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGxldCByZXNwSnNvbiA9IEpTT04ucGFyc2UocmVzcCk7XG4gICAgICAgICAgICAgIHJlc29sdmUobmV3IE1vbmVyb1N5bmNSZXN1bHQocmVzcEpzb24ubnVtQmxvY2tzRmV0Y2hlZCwgcmVzcEpzb24ucmVjZWl2ZWRNb25leSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBlcnIgPSBlO1xuICAgIH1cbiAgICBcbiAgICAvLyB1bnJlZ2lzdGVyIGxpc3RlbmVyXG4gICAgaWYgKGxpc3RlbmVyKSBhd2FpdCB0aGlzLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBcbiAgICAvLyB0aHJvdyBlcnJvciBvciByZXR1cm5cbiAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBcbiAgYXN5bmMgc3RhcnRTeW5jaW5nKHN5bmNQZXJpb2RJbk1zPzogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zdGFydFN5bmNpbmcoc3luY1BlcmlvZEluTXMpO1xuICAgIGlmICghKGF3YWl0IHRoaXMuaXNDb25uZWN0ZWRUb0RhZW1vbigpKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGlzIG5vdCBjb25uZWN0ZWQgdG8gZGFlbW9uXCIpO1xuICAgIHRoaXMuc3luY1BlcmlvZEluTXMgPSBzeW5jUGVyaW9kSW5NcyA9PT0gdW5kZWZpbmVkID8gTW9uZXJvV2FsbGV0RnVsbC5ERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TIDogc3luY1BlcmlvZEluTXM7XG4gICAgaWYgKCF0aGlzLnN5bmNMb29wZXIpIHRoaXMuc3luY0xvb3BlciA9IG5ldyBUYXNrTG9vcGVyKGFzeW5jICgpID0+IGF3YWl0IHRoaXMuYmFja2dyb3VuZFN5bmMoKSlcbiAgICB0aGlzLnN5bmNMb29wZXIuc3RhcnQodGhpcy5zeW5jUGVyaW9kSW5Ncyk7XG4gIH1cbiAgICBcbiAgYXN5bmMgc3RvcFN5bmNpbmcoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zdG9wU3luY2luZygpO1xuICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgaWYgKHRoaXMuc3luY0xvb3BlcikgdGhpcy5zeW5jTG9vcGVyLnN0b3AoKTtcbiAgICB0aGlzLm1vZHVsZS5zdG9wX3N5bmNpbmcodGhpcy5jcHBBZGRyZXNzKTsgLy8gdGFzayBpcyBub3QgcXVldWVkIHNvIHdhbGxldCBzdG9wcyBpbW1lZGlhdGVseVxuICB9XG4gIFxuICBhc3luYyBzY2FuVHhzKHR4SGFzaGVzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2NhblR4cyh0eEhhc2hlcyk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuc2Nhbl90eHModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7dHhIYXNoZXM6IHR4SGFzaGVzfSksIChlcnIpID0+IHtcbiAgICAgICAgICBpZiAoZXJyKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKGVycikpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyByZXNjYW5TcGVudCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnJlc2NhblNwZW50KCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUucmVzY2FuX3NwZW50KHRoaXMuY3BwQWRkcmVzcywgKCkgPT4gcmVzb2x2ZSgpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyByZXNjYW5CbG9ja2NoYWluKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkucmVzY2FuQmxvY2tjaGFpbigpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnJlc2Nhbl9ibG9ja2NoYWluKHRoaXMuY3BwQWRkcmVzcywgKCkgPT4gcmVzb2x2ZSgpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRCYWxhbmNlKGFjY291bnRJZHg/OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg/OiBudW1iZXIpOiBQcm9taXNlPGJpZ2ludD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0QmFsYW5jZShhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBcbiAgICAgIC8vIGdldCBiYWxhbmNlIGVuY29kZWQgaW4ganNvbiBzdHJpbmdcbiAgICAgIGxldCBiYWxhbmNlU3RyO1xuICAgICAgaWYgKGFjY291bnRJZHggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBhc3NlcnQoc3ViYWRkcmVzc0lkeCA9PT0gdW5kZWZpbmVkLCBcIlN1YmFkZHJlc3MgaW5kZXggbXVzdCBiZSB1bmRlZmluZWQgaWYgYWNjb3VudCBpbmRleCBpcyB1bmRlZmluZWRcIik7XG4gICAgICAgIGJhbGFuY2VTdHIgPSB0aGlzLm1vZHVsZS5nZXRfYmFsYW5jZV93YWxsZXQodGhpcy5jcHBBZGRyZXNzKTtcbiAgICAgIH0gZWxzZSBpZiAoc3ViYWRkcmVzc0lkeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGJhbGFuY2VTdHIgPSB0aGlzLm1vZHVsZS5nZXRfYmFsYW5jZV9hY2NvdW50KHRoaXMuY3BwQWRkcmVzcywgYWNjb3VudElkeCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBiYWxhbmNlU3RyID0gdGhpcy5tb2R1bGUuZ2V0X2JhbGFuY2Vfc3ViYWRkcmVzcyh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBwYXJzZSBqc29uIHN0cmluZyB0byBiaWdpbnRcbiAgICAgIHJldHVybiBCaWdJbnQoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKGJhbGFuY2VTdHIpKS5iYWxhbmNlKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VW5sb2NrZWRCYWxhbmNlKGFjY291bnRJZHg/OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg/OiBudW1iZXIpOiBQcm9taXNlPGJpZ2ludD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0VW5sb2NrZWRCYWxhbmNlKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIFxuICAgICAgLy8gZ2V0IGJhbGFuY2UgZW5jb2RlZCBpbiBqc29uIHN0cmluZ1xuICAgICAgbGV0IHVubG9ja2VkQmFsYW5jZVN0cjtcbiAgICAgIGlmIChhY2NvdW50SWR4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYXNzZXJ0KHN1YmFkZHJlc3NJZHggPT09IHVuZGVmaW5lZCwgXCJTdWJhZGRyZXNzIGluZGV4IG11c3QgYmUgdW5kZWZpbmVkIGlmIGFjY291bnQgaW5kZXggaXMgdW5kZWZpbmVkXCIpO1xuICAgICAgICB1bmxvY2tlZEJhbGFuY2VTdHIgPSB0aGlzLm1vZHVsZS5nZXRfdW5sb2NrZWRfYmFsYW5jZV93YWxsZXQodGhpcy5jcHBBZGRyZXNzKTtcbiAgICAgIH0gZWxzZSBpZiAoc3ViYWRkcmVzc0lkeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHVubG9ja2VkQmFsYW5jZVN0ciA9IHRoaXMubW9kdWxlLmdldF91bmxvY2tlZF9iYWxhbmNlX2FjY291bnQodGhpcy5jcHBBZGRyZXNzLCBhY2NvdW50SWR4KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVubG9ja2VkQmFsYW5jZVN0ciA9IHRoaXMubW9kdWxlLmdldF91bmxvY2tlZF9iYWxhbmNlX3N1YmFkZHJlc3ModGhpcy5jcHBBZGRyZXNzLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gcGFyc2UganNvbiBzdHJpbmcgdG8gYmlnaW50XG4gICAgICByZXR1cm4gQmlnSW50KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyh1bmxvY2tlZEJhbGFuY2VTdHIpKS51bmxvY2tlZEJhbGFuY2UpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRBY2NvdW50cyhpbmNsdWRlU3ViYWRkcmVzc2VzPzogYm9vbGVhbiwgdGFnPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9BY2NvdW50W10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEFjY291bnRzKGluY2x1ZGVTdWJhZGRyZXNzZXMsIHRhZyk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IGFjY291bnRzU3RyID0gdGhpcy5tb2R1bGUuZ2V0X2FjY291bnRzKHRoaXMuY3BwQWRkcmVzcywgaW5jbHVkZVN1YmFkZHJlc3NlcyA/IHRydWUgOiBmYWxzZSwgdGFnID8gdGFnIDogXCJcIik7XG4gICAgICBsZXQgYWNjb3VudHMgPSBbXTtcbiAgICAgIGZvciAobGV0IGFjY291bnRKc29uIG9mIEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhhY2NvdW50c1N0cikpLmFjY291bnRzKSB7XG4gICAgICAgIGFjY291bnRzLnB1c2goTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZUFjY291bnQobmV3IE1vbmVyb0FjY291bnQoYWNjb3VudEpzb24pKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gYWNjb3VudHM7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFjY291bnQoYWNjb3VudElkeDogbnVtYmVyLCBpbmNsdWRlU3ViYWRkcmVzc2VzPzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvQWNjb3VudD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0QWNjb3VudChhY2NvdW50SWR4LCBpbmNsdWRlU3ViYWRkcmVzc2VzKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgYWNjb3VudFN0ciA9IHRoaXMubW9kdWxlLmdldF9hY2NvdW50KHRoaXMuY3BwQWRkcmVzcywgYWNjb3VudElkeCwgaW5jbHVkZVN1YmFkZHJlc3NlcyA/IHRydWUgOiBmYWxzZSk7XG4gICAgICBsZXQgYWNjb3VudEpzb24gPSBKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMoYWNjb3VudFN0cikpO1xuICAgICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuc2FuaXRpemVBY2NvdW50KG5ldyBNb25lcm9BY2NvdW50KGFjY291bnRKc29uKSk7XG4gICAgfSk7XG5cbiAgfVxuICBcbiAgYXN5bmMgY3JlYXRlQWNjb3VudChsYWJlbD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQWNjb3VudD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuY3JlYXRlQWNjb3VudChsYWJlbCk7XG4gICAgaWYgKGxhYmVsID09PSB1bmRlZmluZWQpIGxhYmVsID0gXCJcIjtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgYWNjb3VudFN0ciA9IHRoaXMubW9kdWxlLmNyZWF0ZV9hY2NvdW50KHRoaXMuY3BwQWRkcmVzcywgbGFiZWwpO1xuICAgICAgbGV0IGFjY291bnRKc29uID0gSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKGFjY291bnRTdHIpKTtcbiAgICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplQWNjb3VudChuZXcgTW9uZXJvQWNjb3VudChhY2NvdW50SnNvbikpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSW5kaWNlcz86IG51bWJlcltdKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzW10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSW5kaWNlcyk7XG4gICAgbGV0IGFyZ3MgPSB7YWNjb3VudElkeDogYWNjb3VudElkeCwgc3ViYWRkcmVzc0luZGljZXM6IHN1YmFkZHJlc3NJbmRpY2VzID09PSB1bmRlZmluZWQgPyBbXSA6IEdlblV0aWxzLmxpc3RpZnkoc3ViYWRkcmVzc0luZGljZXMpfTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgc3ViYWRkcmVzc2VzSnNvbiA9IEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyh0aGlzLm1vZHVsZS5nZXRfc3ViYWRkcmVzc2VzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoYXJncykpKSkuc3ViYWRkcmVzc2VzO1xuICAgICAgbGV0IHN1YmFkZHJlc3NlcyA9IFtdO1xuICAgICAgZm9yIChsZXQgc3ViYWRkcmVzc0pzb24gb2Ygc3ViYWRkcmVzc2VzSnNvbikgc3ViYWRkcmVzc2VzLnB1c2goTW9uZXJvV2FsbGV0S2V5cy5zYW5pdGl6ZVN1YmFkZHJlc3MobmV3IE1vbmVyb1N1YmFkZHJlc3Moc3ViYWRkcmVzc0pzb24pKSk7XG4gICAgICByZXR1cm4gc3ViYWRkcmVzc2VzO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBjcmVhdGVTdWJhZGRyZXNzKGFjY291bnRJZHg6IG51bWJlciwgbGFiZWw/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3M+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmNyZWF0ZVN1YmFkZHJlc3MoYWNjb3VudElkeCwgbGFiZWwpO1xuICAgIGlmIChsYWJlbCA9PT0gdW5kZWZpbmVkKSBsYWJlbCA9IFwiXCI7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IHN1YmFkZHJlc3NTdHIgPSB0aGlzLm1vZHVsZS5jcmVhdGVfc3ViYWRkcmVzcyh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgsIGxhYmVsKTtcbiAgICAgIGxldCBzdWJhZGRyZXNzSnNvbiA9IEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhzdWJhZGRyZXNzU3RyKSk7XG4gICAgICByZXR1cm4gTW9uZXJvV2FsbGV0S2V5cy5zYW5pdGl6ZVN1YmFkZHJlc3MobmV3IE1vbmVyb1N1YmFkZHJlc3Moc3ViYWRkcmVzc0pzb24pKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIHNldFN1YmFkZHJlc3NMYWJlbChhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg6IG51bWJlciwgbGFiZWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2V0U3ViYWRkcmVzc0xhYmVsKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIGxhYmVsKTtcbiAgICBpZiAobGFiZWwgPT09IHVuZGVmaW5lZCkgbGFiZWwgPSBcIlwiO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRoaXMubW9kdWxlLnNldF9zdWJhZGRyZXNzX2xhYmVsKHRoaXMuY3BwQWRkcmVzcywgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCwgbGFiZWwpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeHMocXVlcnk/OiBzdHJpbmdbXSB8IFBhcnRpYWw8TW9uZXJvVHhRdWVyeT4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFR4cyhxdWVyeSk7XG5cbiAgICAvLyBjb3B5IGFuZCBub3JtYWxpemUgcXVlcnkgdXAgdG8gYmxvY2tcbiAgICBjb25zdCBxdWVyeU5vcm1hbGl6ZWQgPSBxdWVyeSA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVUeFF1ZXJ5KHF1ZXJ5KTtcbiAgICBcbiAgICAvLyBzY2hlZHVsZSB0YXNrXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIGNhbGwgd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrXG4gICAgICAgIHRoaXMubW9kdWxlLmdldF90eHModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeShxdWVyeU5vcm1hbGl6ZWQuZ2V0QmxvY2soKS50b0pzb24oKSksIChibG9ja3NKc29uU3RyKSA9PiB7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gY2hlY2sgZm9yIGVycm9yXG4gICAgICAgICAgaWYgKGJsb2Nrc0pzb25TdHIuY2hhckF0KDApICE9PSBcIntcIikge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihibG9ja3NKc29uU3RyKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIC8vIHJlc29sdmUgd2l0aCBkZXNlcmlhbGl6ZWQgdHhzXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlc29sdmUoTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZVR4cyhxdWVyeU5vcm1hbGl6ZWQsIGJsb2Nrc0pzb25TdHIpKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHJhbnNmZXJzKHF1ZXJ5PzogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvVHJhbnNmZXJbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0VHJhbnNmZXJzKHF1ZXJ5KTtcbiAgICBcbiAgICAvLyBjb3B5IGFuZCBub3JtYWxpemUgcXVlcnkgdXAgdG8gYmxvY2tcbiAgICBjb25zdCBxdWVyeU5vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplVHJhbnNmZXJRdWVyeShxdWVyeSk7XG4gICAgXG4gICAgLy8gcmV0dXJuIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgb24gY2FsbGJhY2tcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgLy8gY2FsbCB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2tcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X3RyYW5zZmVycyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHF1ZXJ5Tm9ybWFsaXplZC5nZXRUeFF1ZXJ5KCkuZ2V0QmxvY2soKS50b0pzb24oKSksIChibG9ja3NKc29uU3RyKSA9PiB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAvLyBjaGVjayBmb3IgZXJyb3JcbiAgICAgICAgICBpZiAoYmxvY2tzSnNvblN0ci5jaGFyQXQoMCkgIT09IFwie1wiKSB7XG4gICAgICAgICAgICByZWplY3QobmV3IE1vbmVyb0Vycm9yKGJsb2Nrc0pzb25TdHIpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgIFxuICAgICAgICAgIC8vIHJlc29sdmUgd2l0aCBkZXNlcmlhbGl6ZWQgdHJhbnNmZXJzIFxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXNvbHZlKE1vbmVyb1dhbGxldEZ1bGwuZGVzZXJpYWxpemVUcmFuc2ZlcnMocXVlcnlOb3JtYWxpemVkLCBibG9ja3NKc29uU3RyKSk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dHMocXVlcnk/OiBQYXJ0aWFsPE1vbmVyb091dHB1dFF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvT3V0cHV0V2FsbGV0W10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldE91dHB1dHMocXVlcnkpO1xuICAgIFxuICAgIC8vIGNvcHkgYW5kIG5vcm1hbGl6ZSBxdWVyeSB1cCB0byBibG9ja1xuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVPdXRwdXRRdWVyeShxdWVyeSk7XG4gICAgXG4gICAgLy8gcmV0dXJuIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgb24gY2FsbGJhY2tcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT57XG4gICAgICAgIFxuICAgICAgICAvLyBjYWxsIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFja1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfb3V0cHV0cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHF1ZXJ5Tm9ybWFsaXplZC5nZXRUeFF1ZXJ5KCkuZ2V0QmxvY2soKS50b0pzb24oKSksIChibG9ja3NKc29uU3RyKSA9PiB7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gY2hlY2sgZm9yIGVycm9yXG4gICAgICAgICAgaWYgKGJsb2Nrc0pzb25TdHIuY2hhckF0KDApICE9PSBcIntcIikge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihibG9ja3NKc29uU3RyKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIC8vIHJlc29sdmUgd2l0aCBkZXNlcmlhbGl6ZWQgb3V0cHV0c1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXNvbHZlKE1vbmVyb1dhbGxldEZ1bGwuZGVzZXJpYWxpemVPdXRwdXRzKHF1ZXJ5Tm9ybWFsaXplZCwgYmxvY2tzSnNvblN0cikpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBleHBvcnRPdXRwdXRzKGFsbCA9IGZhbHNlKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmV4cG9ydE91dHB1dHMoYWxsKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5leHBvcnRfb3V0cHV0cyh0aGlzLmNwcEFkZHJlc3MsIGFsbCwgKG91dHB1dHNIZXgpID0+IHJlc29sdmUob3V0cHV0c0hleCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGltcG9ydE91dHB1dHMob3V0cHV0c0hleDogc3RyaW5nKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmltcG9ydE91dHB1dHMob3V0cHV0c0hleCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuaW1wb3J0X291dHB1dHModGhpcy5jcHBBZGRyZXNzLCBvdXRwdXRzSGV4LCAobnVtSW1wb3J0ZWQpID0+IHJlc29sdmUobnVtSW1wb3J0ZWQpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBleHBvcnRLZXlJbWFnZXMoYWxsID0gZmFsc2UpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlW10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmV4cG9ydEtleUltYWdlcyhhbGwpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmV4cG9ydF9rZXlfaW1hZ2VzKHRoaXMuY3BwQWRkcmVzcywgYWxsLCAoa2V5SW1hZ2VzU3RyKSA9PiB7XG4gICAgICAgICAgaWYgKGtleUltYWdlc1N0ci5jaGFyQXQoMCkgIT09ICd7JykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihrZXlJbWFnZXNTdHIpKTsgLy8ganNvbiBleHBlY3RlZCwgZWxzZSBlcnJvclxuICAgICAgICAgIGxldCBrZXlJbWFnZXMgPSBbXTtcbiAgICAgICAgICBmb3IgKGxldCBrZXlJbWFnZUpzb24gb2YgSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKGtleUltYWdlc1N0cikpLmtleUltYWdlcykga2V5SW1hZ2VzLnB1c2gobmV3IE1vbmVyb0tleUltYWdlKGtleUltYWdlSnNvbikpO1xuICAgICAgICAgIHJlc29sdmUoa2V5SW1hZ2VzKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgaW1wb3J0S2V5SW1hZ2VzKGtleUltYWdlczogTW9uZXJvS2V5SW1hZ2VbXSk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmltcG9ydEtleUltYWdlcyhrZXlJbWFnZXMpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmltcG9ydF9rZXlfaW1hZ2VzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe2tleUltYWdlczoga2V5SW1hZ2VzLm1hcChrZXlJbWFnZSA9PiBrZXlJbWFnZS50b0pzb24oKSl9KSwgKGtleUltYWdlSW1wb3J0UmVzdWx0U3RyKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShuZXcgTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKGtleUltYWdlSW1wb3J0UmVzdWx0U3RyKSkpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQoKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCgpO1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZnJlZXplT3V0cHV0KGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmZyZWV6ZU91dHB1dChrZXlJbWFnZSk7XG4gICAgaWYgKCFrZXlJbWFnZSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBzcGVjaWZ5IGtleSBpbWFnZSB0byBmcmVlemVcIik7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZnJlZXplX291dHB1dCh0aGlzLmNwcEFkZHJlc3MsIGtleUltYWdlLCAoKSA9PiByZXNvbHZlKCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHRoYXdPdXRwdXQoa2V5SW1hZ2U6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkudGhhd091dHB1dChrZXlJbWFnZSk7XG4gICAgaWYgKCFrZXlJbWFnZSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBzcGVjaWZ5IGtleSBpbWFnZSB0byB0aGF3XCIpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnRoYXdfb3V0cHV0KHRoaXMuY3BwQWRkcmVzcywga2V5SW1hZ2UsICgpID0+IHJlc29sdmUoKSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgaXNPdXRwdXRGcm96ZW4oa2V5SW1hZ2U6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaXNPdXRwdXRGcm96ZW4oa2V5SW1hZ2UpO1xuICAgIGlmICgha2V5SW1hZ2UpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3Qgc3BlY2lmeSBrZXkgaW1hZ2UgdG8gY2hlY2sgaWYgZnJvemVuXCIpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmlzX291dHB1dF9mcm96ZW4odGhpcy5jcHBBZGRyZXNzLCBrZXlJbWFnZSwgKHJlc3VsdCkgPT4gcmVzb2x2ZShyZXN1bHQpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBjcmVhdGVUeHMoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuY3JlYXRlVHhzKGNvbmZpZyk7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUsIGNvcHksIGFuZCBub3JtYWxpemUgY29uZmlnXG4gICAgY29uc3QgY29uZmlnTm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVDcmVhdGVUeHNDb25maWcoY29uZmlnKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpID09PSB1bmRlZmluZWQpIGNvbmZpZ05vcm1hbGl6ZWQuc2V0Q2FuU3BsaXQodHJ1ZSk7XG4gICAgXG4gICAgLy8gY3JlYXRlIHR4cyBpbiBxdWV1ZVxuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyBjcmVhdGUgdHhzIGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgdGhpcy5tb2R1bGUuY3JlYXRlX3R4cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KGNvbmZpZ05vcm1hbGl6ZWQudG9Kc29uKCkpLCAodHhTZXRKc29uU3RyKSA9PiB7XG4gICAgICAgICAgaWYgKHR4U2V0SnNvblN0ci5jaGFyQXQoMCkgIT09ICd7JykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcih0eFNldEpzb25TdHIpKTsgLy8ganNvbiBleHBlY3RlZCwgZWxzZSBlcnJvclxuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvVHhTZXQoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHR4U2V0SnNvblN0cikpKS5nZXRUeHMoKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN3ZWVwT3V0cHV0KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zd2VlcE91dHB1dChjb25maWcpO1xuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSBhbmQgdmFsaWRhdGUgY29uZmlnXG4gICAgY29uc3QgY29uZmlnTm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVTd2VlcE91dHB1dENvbmZpZyhjb25maWcpO1xuICAgIFxuICAgIC8vIHN3ZWVwIG91dHB1dCBpbiBxdWV1ZVxuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyBzd2VlcCBvdXRwdXQgaW4gd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICB0aGlzLm1vZHVsZS5zd2VlcF9vdXRwdXQodGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeShjb25maWdOb3JtYWxpemVkLnRvSnNvbigpKSwgKHR4U2V0SnNvblN0cikgPT4ge1xuICAgICAgICAgIGlmICh0eFNldEpzb25TdHIuY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IodHhTZXRKc29uU3RyKSk7IC8vIGpzb24gZXhwZWN0ZWQsIGVsc2UgZXJyb3JcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb1R4U2V0KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyh0eFNldEpzb25TdHIpKSkuZ2V0VHhzKClbMF0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgc3dlZXBVbmxvY2tlZChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zd2VlcFVubG9ja2VkKGNvbmZpZyk7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgYW5kIG5vcm1hbGl6ZSBjb25maWdcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVN3ZWVwVW5sb2NrZWRDb25maWcoY29uZmlnKTtcbiAgICBcbiAgICAvLyBzd2VlcCB1bmxvY2tlZCBpbiBxdWV1ZVxuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyBzd2VlcCB1bmxvY2tlZCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIHRoaXMubW9kdWxlLnN3ZWVwX3VubG9ja2VkKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoY29uZmlnTm9ybWFsaXplZC50b0pzb24oKSksICh0eFNldHNKc29uKSA9PiB7XG4gICAgICAgICAgaWYgKHR4U2V0c0pzb24uY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IodHhTZXRzSnNvbikpOyAvLyBqc29uIGV4cGVjdGVkLCBlbHNlIGVycm9yXG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsZXQgdHhTZXRzID0gW107XG4gICAgICAgICAgICBmb3IgKGxldCB0eFNldEpzb24gb2YgSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHR4U2V0c0pzb24pKS50eFNldHMpIHR4U2V0cy5wdXNoKG5ldyBNb25lcm9UeFNldCh0eFNldEpzb24pKTtcbiAgICAgICAgICAgIGxldCB0eHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAobGV0IHR4U2V0IG9mIHR4U2V0cykgZm9yIChsZXQgdHggb2YgdHhTZXQuZ2V0VHhzKCkpIHR4cy5wdXNoKHR4KTtcbiAgICAgICAgICAgIHJlc29sdmUodHhzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN3ZWVwRHVzdChyZWxheT86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN3ZWVwRHVzdChyZWxheSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIGNhbGwgd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICB0aGlzLm1vZHVsZS5zd2VlcF9kdXN0KHRoaXMuY3BwQWRkcmVzcywgcmVsYXksICh0eFNldEpzb25TdHIpID0+IHtcbiAgICAgICAgICBpZiAodHhTZXRKc29uU3RyLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHR4U2V0SnNvblN0cikpOyAvLyBqc29uIGV4cGVjdGVkLCBlbHNlIGVycm9yXG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsZXQgdHhTZXQgPSBuZXcgTW9uZXJvVHhTZXQoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHR4U2V0SnNvblN0cikpKTtcbiAgICAgICAgICAgIGlmICh0eFNldC5nZXRUeHMoKSA9PT0gdW5kZWZpbmVkKSB0eFNldC5zZXRUeHMoW10pO1xuICAgICAgICAgICAgcmVzb2x2ZSh0eFNldC5nZXRUeHMoKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyByZWxheVR4cyh0eHNPck1ldGFkYXRhczogKE1vbmVyb1R4V2FsbGV0IHwgc3RyaW5nKVtdKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkucmVsYXlUeHModHhzT3JNZXRhZGF0YXMpO1xuICAgIGFzc2VydChBcnJheS5pc0FycmF5KHR4c09yTWV0YWRhdGFzKSwgXCJNdXN0IHByb3ZpZGUgYW4gYXJyYXkgb2YgdHhzIG9yIHRoZWlyIG1ldGFkYXRhIHRvIHJlbGF5XCIpO1xuICAgIGxldCB0eE1ldGFkYXRhcyA9IFtdO1xuICAgIGZvciAobGV0IHR4T3JNZXRhZGF0YSBvZiB0eHNPck1ldGFkYXRhcykgdHhNZXRhZGF0YXMucHVzaCh0eE9yTWV0YWRhdGEgaW5zdGFuY2VvZiBNb25lcm9UeFdhbGxldCA/IHR4T3JNZXRhZGF0YS5nZXRNZXRhZGF0YSgpIDogdHhPck1ldGFkYXRhKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5yZWxheV90eHModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7dHhNZXRhZGF0YXM6IHR4TWV0YWRhdGFzfSksICh0eEhhc2hlc0pzb24pID0+IHtcbiAgICAgICAgICBpZiAodHhIYXNoZXNKc29uLmNoYXJBdCgwKSAhPT0gXCJ7XCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IodHhIYXNoZXNKc29uKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKEpTT04ucGFyc2UodHhIYXNoZXNKc29uKS50eEhhc2hlcyk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGRlc2NyaWJlVHhTZXQodHhTZXQ6IE1vbmVyb1R4U2V0KTogUHJvbWlzZTxNb25lcm9UeFNldD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZGVzY3JpYmVUeFNldCh0eFNldCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdHhTZXQgPSBuZXcgTW9uZXJvVHhTZXQoe3Vuc2lnbmVkVHhIZXg6IHR4U2V0LmdldFVuc2lnbmVkVHhIZXgoKSwgc2lnbmVkVHhIZXg6IHR4U2V0LmdldFNpZ25lZFR4SGV4KCksIG11bHRpc2lnVHhIZXg6IHR4U2V0LmdldE11bHRpc2lnVHhIZXgoKX0pO1xuICAgICAgdHJ5IHsgcmV0dXJuIG5ldyBNb25lcm9UeFNldChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHModGhpcy5tb2R1bGUuZGVzY3JpYmVfdHhfc2V0KHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkodHhTZXQudG9Kc29uKCkpKSkpKTsgfVxuICAgICAgY2F0Y2ggKGVycikgeyB0aHJvdyBuZXcgTW9uZXJvRXJyb3IodGhpcy5tb2R1bGUuZ2V0X2V4Y2VwdGlvbl9tZXNzYWdlKGVycikpOyB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNpZ25UeHModW5zaWduZWRUeEhleDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeFNldD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2lnblR4cyh1bnNpZ25lZFR4SGV4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkgeyByZXR1cm4gbmV3IE1vbmVyb1R4U2V0KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyh0aGlzLm1vZHVsZS5zaWduX3R4cyh0aGlzLmNwcEFkZHJlc3MsIHVuc2lnbmVkVHhIZXgpKSkpOyB9XG4gICAgICBjYXRjaCAoZXJyKSB7IHRocm93IG5ldyBNb25lcm9FcnJvcih0aGlzLm1vZHVsZS5nZXRfZXhjZXB0aW9uX21lc3NhZ2UoZXJyKSk7IH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc3VibWl0VHhzKHNpZ25lZFR4SGV4OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zdWJtaXRUeHMoc2lnbmVkVHhIZXgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnN1Ym1pdF90eHModGhpcy5jcHBBZGRyZXNzLCBzaWduZWRUeEhleCwgKHJlc3ApID0+IHtcbiAgICAgICAgICBpZiAocmVzcC5jaGFyQXQoMCkgIT09IFwie1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoSlNPTi5wYXJzZShyZXNwKS50eEhhc2hlcyk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNpZ25NZXNzYWdlKG1lc3NhZ2U6IHN0cmluZywgc2lnbmF0dXJlVHlwZSA9IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9TUEVORF9LRVksIGFjY291bnRJZHggPSAwLCBzdWJhZGRyZXNzSWR4ID0gMCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zaWduTWVzc2FnZShtZXNzYWdlLCBzaWduYXR1cmVUeXBlLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTtcbiAgICBcbiAgICAvLyBhc3NpZ24gZGVmYXVsdHNcbiAgICBzaWduYXR1cmVUeXBlID0gc2lnbmF0dXJlVHlwZSB8fCBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfU1BFTkRfS0VZO1xuICAgIGFjY291bnRJZHggPSBhY2NvdW50SWR4IHx8IDA7XG4gICAgc3ViYWRkcmVzc0lkeCA9IHN1YmFkZHJlc3NJZHggfHwgMDtcbiAgICBcbiAgICAvLyBxdWV1ZSB0YXNrIHRvIHNpZ24gbWVzc2FnZVxuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7IHJldHVybiB0aGlzLm1vZHVsZS5zaWduX21lc3NhZ2UodGhpcy5jcHBBZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmVUeXBlID09PSBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfU1BFTkRfS0VZID8gMCA6IDEsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpOyB9XG4gICAgICBjYXRjaCAoZXJyKSB7IHRocm93IG5ldyBNb25lcm9FcnJvcih0aGlzLm1vZHVsZS5nZXRfZXhjZXB0aW9uX21lc3NhZ2UoZXJyKSk7IH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgdmVyaWZ5TWVzc2FnZShtZXNzYWdlOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnZlcmlmeU1lc3NhZ2UobWVzc2FnZSwgYWRkcmVzcywgc2lnbmF0dXJlKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgcmVzdWx0O1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmVzdWx0ID0gSlNPTi5wYXJzZSh0aGlzLm1vZHVsZS52ZXJpZnlfbWVzc2FnZSh0aGlzLmNwcEFkZHJlc3MsIG1lc3NhZ2UsIGFkZHJlc3MsIHNpZ25hdHVyZSkpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHJlc3VsdCA9IHtpc0dvb2Q6IGZhbHNlfTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdChyZXN1bHQuaXNHb29kID9cbiAgICAgICAge2lzR29vZDogcmVzdWx0LmlzR29vZCwgaXNPbGQ6IHJlc3VsdC5pc09sZCwgc2lnbmF0dXJlVHlwZTogcmVzdWx0LnNpZ25hdHVyZVR5cGUgPT09IFwic3BlbmRcIiA/IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9TUEVORF9LRVkgOiBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfVklFV19LRVksIHZlcnNpb246IHJlc3VsdC52ZXJzaW9ufSA6XG4gICAgICAgIHtpc0dvb2Q6IGZhbHNlfVxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhLZXkodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0VHhLZXkodHhIYXNoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkgeyByZXR1cm4gdGhpcy5tb2R1bGUuZ2V0X3R4X2tleSh0aGlzLmNwcEFkZHJlc3MsIHR4SGFzaCk7IH1cbiAgICAgIGNhdGNoIChlcnIpIHsgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHRoaXMubW9kdWxlLmdldF9leGNlcHRpb25fbWVzc2FnZShlcnIpKTsgfVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBjaGVja1R4S2V5KHR4SGFzaDogc3RyaW5nLCB0eEtleTogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrVHg+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmNoZWNrVHhLZXkodHhIYXNoLCB0eEtleSwgYWRkcmVzcyk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpOyBcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmNoZWNrX3R4X2tleSh0aGlzLmNwcEFkZHJlc3MsIHR4SGFzaCwgdHhLZXksIGFkZHJlc3MsIChyZXNwSnNvblN0cikgPT4ge1xuICAgICAgICAgIGlmIChyZXNwSnNvblN0ci5jaGFyQXQoMCkgIT09IFwie1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3BKc29uU3RyKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9DaGVja1R4KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhyZXNwSnNvblN0cikpKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4UHJvb2YodHhIYXNoOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRUeFByb29mKHR4SGFzaCwgYWRkcmVzcywgbWVzc2FnZSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X3R4X3Byb29mKHRoaXMuY3BwQWRkcmVzcywgdHhIYXNoIHx8IFwiXCIsIGFkZHJlc3MgfHwgXCJcIiwgbWVzc2FnZSB8fCBcIlwiLCAoc2lnbmF0dXJlKSA9PiB7XG4gICAgICAgICAgbGV0IGVycm9yS2V5ID0gXCJlcnJvcjogXCI7XG4gICAgICAgICAgaWYgKHNpZ25hdHVyZS5pbmRleE9mKGVycm9yS2V5KSA9PT0gMCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihzaWduYXR1cmUuc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCkpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoc2lnbmF0dXJlKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tUeFByb29mKHR4SGFzaDogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrVHg+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmNoZWNrVHhQcm9vZih0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpOyBcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmNoZWNrX3R4X3Byb29mKHRoaXMuY3BwQWRkcmVzcywgdHhIYXNoIHx8IFwiXCIsIGFkZHJlc3MgfHwgXCJcIiwgbWVzc2FnZSB8fCBcIlwiLCBzaWduYXR1cmUgfHwgXCJcIiwgKHJlc3BKc29uU3RyKSA9PiB7XG4gICAgICAgICAgaWYgKHJlc3BKc29uU3RyLmNoYXJBdCgwKSAhPT0gXCJ7XCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcEpzb25TdHIpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb0NoZWNrVHgoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHJlc3BKc29uU3RyKSkpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U3BlbmRQcm9vZih0eEhhc2g6IHN0cmluZywgbWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRTcGVuZFByb29mKHR4SGFzaCwgbWVzc2FnZSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X3NwZW5kX3Byb29mKHRoaXMuY3BwQWRkcmVzcywgdHhIYXNoIHx8IFwiXCIsIG1lc3NhZ2UgfHwgXCJcIiwgKHNpZ25hdHVyZSkgPT4ge1xuICAgICAgICAgIGxldCBlcnJvcktleSA9IFwiZXJyb3I6IFwiO1xuICAgICAgICAgIGlmIChzaWduYXR1cmUuaW5kZXhPZihlcnJvcktleSkgPT09IDApIHJlamVjdChuZXcgTW9uZXJvRXJyb3Ioc2lnbmF0dXJlLnN1YnN0cmluZyhlcnJvcktleS5sZW5ndGgpKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKHNpZ25hdHVyZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrU3BlbmRQcm9vZih0eEhhc2g6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuY2hlY2tTcGVuZFByb29mKHR4SGFzaCwgbWVzc2FnZSwgc2lnbmF0dXJlKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7IFxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuY2hlY2tfc3BlbmRfcHJvb2YodGhpcy5jcHBBZGRyZXNzLCB0eEhhc2ggfHwgXCJcIiwgbWVzc2FnZSB8fCBcIlwiLCBzaWduYXR1cmUgfHwgXCJcIiwgKHJlc3ApID0+IHtcbiAgICAgICAgICB0eXBlb2YgcmVzcCA9PT0gXCJzdHJpbmdcIiA/IHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcCkpIDogcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UmVzZXJ2ZVByb29mV2FsbGV0KG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0UmVzZXJ2ZVByb29mV2FsbGV0KG1lc3NhZ2UpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmdldF9yZXNlcnZlX3Byb29mX3dhbGxldCh0aGlzLmNwcEFkZHJlc3MsIG1lc3NhZ2UsIChzaWduYXR1cmUpID0+IHtcbiAgICAgICAgICBsZXQgZXJyb3JLZXkgPSBcImVycm9yOiBcIjtcbiAgICAgICAgICBpZiAoc2lnbmF0dXJlLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHNpZ25hdHVyZS5zdWJzdHJpbmcoZXJyb3JLZXkubGVuZ3RoKSwgLTEpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoc2lnbmF0dXJlKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UmVzZXJ2ZVByb29mQWNjb3VudChhY2NvdW50SWR4OiBudW1iZXIsIGFtb3VudDogYmlnaW50LCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFJlc2VydmVQcm9vZkFjY291bnQoYWNjb3VudElkeCwgYW1vdW50LCBtZXNzYWdlKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfcmVzZXJ2ZV9wcm9vZl9hY2NvdW50KHRoaXMuY3BwQWRkcmVzcywgYWNjb3VudElkeCwgYW1vdW50LnRvU3RyaW5nKCksIG1lc3NhZ2UsIChzaWduYXR1cmUpID0+IHtcbiAgICAgICAgICBsZXQgZXJyb3JLZXkgPSBcImVycm9yOiBcIjtcbiAgICAgICAgICBpZiAoc2lnbmF0dXJlLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHNpZ25hdHVyZS5zdWJzdHJpbmcoZXJyb3JLZXkubGVuZ3RoKSwgLTEpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoc2lnbmF0dXJlKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGNoZWNrUmVzZXJ2ZVByb29mKGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tSZXNlcnZlPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jaGVja1Jlc2VydmVQcm9vZihhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTsgXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5jaGVja19yZXNlcnZlX3Byb29mKHRoaXMuY3BwQWRkcmVzcywgYWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlLCAocmVzcEpzb25TdHIpID0+IHtcbiAgICAgICAgICBpZiAocmVzcEpzb25TdHIuY2hhckF0KDApICE9PSBcIntcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwSnNvblN0ciwgLTEpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb0NoZWNrUmVzZXJ2ZShKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMocmVzcEpzb25TdHIpKSkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeE5vdGVzKHR4SGFzaGVzOiBzdHJpbmdbXSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFR4Tm90ZXModHhIYXNoZXMpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7IHJldHVybiBKU09OLnBhcnNlKHRoaXMubW9kdWxlLmdldF90eF9ub3Rlcyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHt0eEhhc2hlczogdHhIYXNoZXN9KSkpLnR4Tm90ZXM7IH1cbiAgICAgIGNhdGNoIChlcnIpIHsgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHRoaXMubW9kdWxlLmdldF9leGNlcHRpb25fbWVzc2FnZShlcnIpKTsgfVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzZXRUeE5vdGVzKHR4SGFzaGVzOiBzdHJpbmdbXSwgbm90ZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zZXRUeE5vdGVzKHR4SGFzaGVzLCBub3Rlcyk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdHJ5IHsgdGhpcy5tb2R1bGUuc2V0X3R4X25vdGVzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe3R4SGFzaGVzOiB0eEhhc2hlcywgdHhOb3Rlczogbm90ZXN9KSk7IH1cbiAgICAgIGNhdGNoIChlcnIpIHsgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHRoaXMubW9kdWxlLmdldF9leGNlcHRpb25fbWVzc2FnZShlcnIpKTsgfVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRBZGRyZXNzQm9va0VudHJpZXMoZW50cnlJbmRpY2VzPzogbnVtYmVyW10pOiBQcm9taXNlPE1vbmVyb0FkZHJlc3NCb29rRW50cnlbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzKGVudHJ5SW5kaWNlcyk7XG4gICAgaWYgKCFlbnRyeUluZGljZXMpIGVudHJ5SW5kaWNlcyA9IFtdO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCBlbnRyaWVzID0gW107XG4gICAgICBmb3IgKGxldCBlbnRyeUpzb24gb2YgSlNPTi5wYXJzZSh0aGlzLm1vZHVsZS5nZXRfYWRkcmVzc19ib29rX2VudHJpZXModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7ZW50cnlJbmRpY2VzOiBlbnRyeUluZGljZXN9KSkpLmVudHJpZXMpIHtcbiAgICAgICAgZW50cmllcy5wdXNoKG5ldyBNb25lcm9BZGRyZXNzQm9va0VudHJ5KGVudHJ5SnNvbikpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGVudHJpZXM7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGFkZEFkZHJlc3NCb29rRW50cnkoYWRkcmVzczogc3RyaW5nLCBkZXNjcmlwdGlvbj86IHN0cmluZyk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5hZGRBZGRyZXNzQm9va0VudHJ5KGFkZHJlc3MsIGRlc2NyaXB0aW9uKTtcbiAgICBpZiAoIWFkZHJlc3MpIGFkZHJlc3MgPSBcIlwiO1xuICAgIGlmICghZGVzY3JpcHRpb24pIGRlc2NyaXB0aW9uID0gXCJcIjtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gdGhpcy5tb2R1bGUuYWRkX2FkZHJlc3NfYm9va19lbnRyeSh0aGlzLmNwcEFkZHJlc3MsIGFkZHJlc3MsIGRlc2NyaXB0aW9uKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZWRpdEFkZHJlc3NCb29rRW50cnkoaW5kZXg6IG51bWJlciwgc2V0QWRkcmVzczogYm9vbGVhbiwgYWRkcmVzczogc3RyaW5nIHwgdW5kZWZpbmVkLCBzZXREZXNjcmlwdGlvbjogYm9vbGVhbiwgZGVzY3JpcHRpb246IHN0cmluZyB8IHVuZGVmaW5lZCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZWRpdEFkZHJlc3NCb29rRW50cnkoaW5kZXgsIHNldEFkZHJlc3MsIGFkZHJlc3MsIHNldERlc2NyaXB0aW9uLCBkZXNjcmlwdGlvbik7XG4gICAgaWYgKCFzZXRBZGRyZXNzKSBzZXRBZGRyZXNzID0gZmFsc2U7XG4gICAgaWYgKCFhZGRyZXNzKSBhZGRyZXNzID0gXCJcIjtcbiAgICBpZiAoIXNldERlc2NyaXB0aW9uKSBzZXREZXNjcmlwdGlvbiA9IGZhbHNlO1xuICAgIGlmICghZGVzY3JpcHRpb24pIGRlc2NyaXB0aW9uID0gXCJcIjtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0aGlzLm1vZHVsZS5lZGl0X2FkZHJlc3NfYm9va19lbnRyeSh0aGlzLmNwcEFkZHJlc3MsIGluZGV4LCBzZXRBZGRyZXNzLCBhZGRyZXNzLCBzZXREZXNjcmlwdGlvbiwgZGVzY3JpcHRpb24pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBkZWxldGVBZGRyZXNzQm9va0VudHJ5KGVudHJ5SWR4OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmRlbGV0ZUFkZHJlc3NCb29rRW50cnkoZW50cnlJZHgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRoaXMubW9kdWxlLmRlbGV0ZV9hZGRyZXNzX2Jvb2tfZW50cnkodGhpcy5jcHBBZGRyZXNzLCBlbnRyeUlkeCk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHRhZ0FjY291bnRzKHRhZzogc3RyaW5nLCBhY2NvdW50SW5kaWNlczogbnVtYmVyW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnRhZ0FjY291bnRzKHRhZywgYWNjb3VudEluZGljZXMpO1xuICAgIGlmICghdGFnKSB0YWcgPSBcIlwiO1xuICAgIGlmICghYWNjb3VudEluZGljZXMpIGFjY291bnRJbmRpY2VzID0gW107XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdGhpcy5tb2R1bGUudGFnX2FjY291bnRzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe3RhZzogdGFnLCBhY2NvdW50SW5kaWNlczogYWNjb3VudEluZGljZXN9KSk7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyB1bnRhZ0FjY291bnRzKGFjY291bnRJbmRpY2VzOiBudW1iZXJbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkudW50YWdBY2NvdW50cyhhY2NvdW50SW5kaWNlcyk7XG4gICAgaWYgKCFhY2NvdW50SW5kaWNlcykgYWNjb3VudEluZGljZXMgPSBbXTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0aGlzLm1vZHVsZS50YWdfYWNjb3VudHModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7YWNjb3VudEluZGljZXM6IGFjY291bnRJbmRpY2VzfSkpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRBY2NvdW50VGFncygpOiBQcm9taXNlPE1vbmVyb0FjY291bnRUYWdbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0QWNjb3VudFRhZ3MoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgYWNjb3VudFRhZ3MgPSBbXTtcbiAgICAgIGZvciAobGV0IGFjY291bnRUYWdKc29uIG9mIEpTT04ucGFyc2UodGhpcy5tb2R1bGUuZ2V0X2FjY291bnRfdGFncyh0aGlzLmNwcEFkZHJlc3MpKS5hY2NvdW50VGFncykgYWNjb3VudFRhZ3MucHVzaChuZXcgTW9uZXJvQWNjb3VudFRhZyhhY2NvdW50VGFnSnNvbikpO1xuICAgICAgcmV0dXJuIGFjY291bnRUYWdzO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgc2V0QWNjb3VudFRhZ0xhYmVsKHRhZzogc3RyaW5nLCBsYWJlbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zZXRBY2NvdW50VGFnTGFiZWwodGFnLCBsYWJlbCk7XG4gICAgaWYgKCF0YWcpIHRhZyA9IFwiXCI7XG4gICAgaWYgKCFsYWJlbCkgbGFiZWwgPSBcIlwiO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRoaXMubW9kdWxlLnNldF9hY2NvdW50X3RhZ19sYWJlbCh0aGlzLmNwcEFkZHJlc3MsIHRhZywgbGFiZWwpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRQYXltZW50VXJpKGNvbmZpZzogTW9uZXJvVHhDb25maWcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0UGF5bWVudFVyaShjb25maWcpO1xuICAgIGNvbmZpZyA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVDcmVhdGVUeHNDb25maWcoY29uZmlnKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb2R1bGUuZ2V0X3BheW1lbnRfdXJpKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoY29uZmlnLnRvSnNvbigpKSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IG1ha2UgVVJJIGZyb20gc3VwcGxpZWQgcGFyYW1ldGVyc1wiKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgcGFyc2VQYXltZW50VXJpKHVyaTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeENvbmZpZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkucGFyc2VQYXltZW50VXJpKHVyaSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIG5ldyBNb25lcm9UeENvbmZpZyhKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHModGhpcy5tb2R1bGUucGFyc2VfcGF5bWVudF91cmkodGhpcy5jcHBBZGRyZXNzLCB1cmkpKSkpO1xuICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGVyci5tZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QXR0cmlidXRlKGtleTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEF0dHJpYnV0ZShrZXkpO1xuICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgYXNzZXJ0KHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIsIFwiQXR0cmlidXRlIGtleSBtdXN0IGJlIGEgc3RyaW5nXCIpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCB2YWx1ZSA9IHRoaXMubW9kdWxlLmdldF9hdHRyaWJ1dGUodGhpcy5jcHBBZGRyZXNzLCBrZXkpO1xuICAgICAgcmV0dXJuIHZhbHVlID09PSBcIlwiID8gbnVsbCA6IHZhbHVlO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzZXRBdHRyaWJ1dGUoa2V5OiBzdHJpbmcsIHZhbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zZXRBdHRyaWJ1dGUoa2V5LCB2YWwpO1xuICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgYXNzZXJ0KHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIsIFwiQXR0cmlidXRlIGtleSBtdXN0IGJlIGEgc3RyaW5nXCIpO1xuICAgIGFzc2VydCh0eXBlb2YgdmFsID09PSBcInN0cmluZ1wiLCBcIkF0dHJpYnV0ZSB2YWx1ZSBtdXN0IGJlIGEgc3RyaW5nXCIpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRoaXMubW9kdWxlLnNldF9hdHRyaWJ1dGUodGhpcy5jcHBBZGRyZXNzLCBrZXksIHZhbCk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0YXJ0TWluaW5nKG51bVRocmVhZHM6IG51bWJlciwgYmFja2dyb3VuZE1pbmluZz86IGJvb2xlYW4sIGlnbm9yZUJhdHRlcnk/OiBib29sZWFuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zdGFydE1pbmluZyhudW1UaHJlYWRzLCBiYWNrZ3JvdW5kTWluaW5nLCBpZ25vcmVCYXR0ZXJ5KTtcbiAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgIGxldCBkYWVtb24gPSBhd2FpdCBNb25lcm9EYWVtb25ScGMuY29ubmVjdFRvRGFlbW9uUnBjKGF3YWl0IHRoaXMuZ2V0RGFlbW9uQ29ubmVjdGlvbigpKTtcbiAgICBhd2FpdCBkYWVtb24uc3RhcnRNaW5pbmcoYXdhaXQgdGhpcy5nZXRQcmltYXJ5QWRkcmVzcygpLCBudW1UaHJlYWRzLCBiYWNrZ3JvdW5kTWluaW5nLCBpZ25vcmVCYXR0ZXJ5KTtcbiAgfVxuICBcbiAgYXN5bmMgc3RvcE1pbmluZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN0b3BNaW5pbmcoKTtcbiAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgIGxldCBkYWVtb24gPSBhd2FpdCBNb25lcm9EYWVtb25ScGMuY29ubmVjdFRvRGFlbW9uUnBjKGF3YWl0IHRoaXMuZ2V0RGFlbW9uQ29ubmVjdGlvbigpKTtcbiAgICBhd2FpdCBkYWVtb24uc3RvcE1pbmluZygpO1xuICB9XG4gIFxuICBhc3luYyBpc011bHRpc2lnSW1wb3J0TmVlZGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5pc19tdWx0aXNpZ19pbXBvcnRfbmVlZGVkKHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzTXVsdGlzaWcoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pc011bHRpc2lnKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLmlzX211bHRpc2lnKHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE11bHRpc2lnSW5mbygpOiBQcm9taXNlPE1vbmVyb011bHRpc2lnSW5mbz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0TXVsdGlzaWdJbmZvKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBNb25lcm9NdWx0aXNpZ0luZm8oSlNPTi5wYXJzZSh0aGlzLm1vZHVsZS5nZXRfbXVsdGlzaWdfaW5mbyh0aGlzLmNwcEFkZHJlc3MpKSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHByZXBhcmVNdWx0aXNpZygpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkucHJlcGFyZU11bHRpc2lnKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLnByZXBhcmVfbXVsdGlzaWcodGhpcy5jcHBBZGRyZXNzKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgbWFrZU11bHRpc2lnKG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdLCB0aHJlc2hvbGQ6IG51bWJlciwgcGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5tYWtlTXVsdGlzaWcobXVsdGlzaWdIZXhlcywgdGhyZXNob2xkLCBwYXNzd29yZCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUubWFrZV9tdWx0aXNpZyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHttdWx0aXNpZ0hleGVzOiBtdWx0aXNpZ0hleGVzLCB0aHJlc2hvbGQ6IHRocmVzaG9sZCwgcGFzc3dvcmQ6IHBhc3N3b3JkfSksIChyZXNwKSA9PiB7XG4gICAgICAgICAgbGV0IGVycm9yS2V5ID0gXCJlcnJvcjogXCI7XG4gICAgICAgICAgaWYgKHJlc3AuaW5kZXhPZihlcnJvcktleSkgPT09IDApIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcC5zdWJzdHJpbmcoZXJyb3JLZXkubGVuZ3RoKSkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZXhjaGFuZ2VNdWx0aXNpZ0tleXMobXVsdGlzaWdIZXhlczogc3RyaW5nW10sIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZXhjaGFuZ2VNdWx0aXNpZ0tleXMobXVsdGlzaWdIZXhlcywgcGFzc3dvcmQpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmV4Y2hhbmdlX211bHRpc2lnX2tleXModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7bXVsdGlzaWdIZXhlczogbXVsdGlzaWdIZXhlcywgcGFzc3dvcmQ6IHBhc3N3b3JkfSksIChyZXNwKSA9PiB7XG4gICAgICAgICAgbGV0IGVycm9yS2V5ID0gXCJlcnJvcjogXCI7XG4gICAgICAgICAgaWYgKHJlc3AuaW5kZXhPZihlcnJvcktleSkgPT09IDApIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcC5zdWJzdHJpbmcoZXJyb3JLZXkubGVuZ3RoKSkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0KEpTT04ucGFyc2UocmVzcCkpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0TXVsdGlzaWdIZXgoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmV4cG9ydE11bHRpc2lnSGV4KCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLmV4cG9ydF9tdWx0aXNpZ19oZXgodGhpcy5jcHBBZGRyZXNzKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgaW1wb3J0TXVsdGlzaWdIZXgobXVsdGlzaWdIZXhlczogc3RyaW5nW10pOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaW1wb3J0TXVsdGlzaWdIZXgobXVsdGlzaWdIZXhlcyk7XG4gICAgaWYgKCFHZW5VdGlscy5pc0FycmF5KG11bHRpc2lnSGV4ZXMpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgc3RyaW5nW10gdG8gaW1wb3J0TXVsdGlzaWdIZXgoKVwiKVxuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmltcG9ydF9tdWx0aXNpZ19oZXgodGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7bXVsdGlzaWdIZXhlczogbXVsdGlzaWdIZXhlc30pLCAocmVzcCkgPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgcmVzcCA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzaWduTXVsdGlzaWdUeEhleChtdWx0aXNpZ1R4SGV4OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb011bHRpc2lnU2lnblJlc3VsdD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2lnbk11bHRpc2lnVHhIZXgobXVsdGlzaWdUeEhleCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuc2lnbl9tdWx0aXNpZ190eF9oZXgodGhpcy5jcHBBZGRyZXNzLCBtdWx0aXNpZ1R4SGV4LCAocmVzcCkgPT4ge1xuICAgICAgICAgIGlmIChyZXNwLmNoYXJBdCgwKSAhPT0gXCJ7XCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcCkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0KEpTT04ucGFyc2UocmVzcCkpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc3VibWl0TXVsdGlzaWdUeEhleChzaWduZWRNdWx0aXNpZ1R4SGV4OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zdWJtaXRNdWx0aXNpZ1R4SGV4KHNpZ25lZE11bHRpc2lnVHhIZXgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnN1Ym1pdF9tdWx0aXNpZ190eF9oZXgodGhpcy5jcHBBZGRyZXNzLCBzaWduZWRNdWx0aXNpZ1R4SGV4LCAocmVzcCkgPT4ge1xuICAgICAgICAgIGlmIChyZXNwLmNoYXJBdCgwKSAhPT0gXCJ7XCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcCkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShKU09OLnBhcnNlKHJlc3ApLnR4SGFzaGVzKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgd2FsbGV0J3Mga2V5cyBhbmQgY2FjaGUgZGF0YS5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8RGF0YVZpZXdbXT59IGlzIHRoZSBrZXlzIGFuZCBjYWNoZSBkYXRhLCByZXNwZWN0aXZlbHlcbiAgICovXG4gIGFzeW5jIGdldERhdGEoKTogUHJvbWlzZTxEYXRhVmlld1tdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXREYXRhKCk7XG4gICAgXG4gICAgLy8gcXVldWUgY2FsbCB0byB3YXNtIG1vZHVsZVxuICAgIGxldCB2aWV3T25seSA9IGF3YWl0IHRoaXMuaXNWaWV3T25seSgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIFxuICAgICAgLy8gc3RvcmUgdmlld3MgaW4gYXJyYXlcbiAgICAgIGxldCB2aWV3cyA9IFtdO1xuICAgICAgXG4gICAgICAvLyBtYWxsb2MgY2FjaGUgYnVmZmVyIGFuZCBnZXQgYnVmZmVyIGxvY2F0aW9uIGluIGMrKyBoZWFwXG4gICAgICBsZXQgY2FjaGVCdWZmZXJMb2MgPSBKU09OLnBhcnNlKHRoaXMubW9kdWxlLmdldF9jYWNoZV9maWxlX2J1ZmZlcih0aGlzLmNwcEFkZHJlc3MpKTtcbiAgICAgIFxuICAgICAgLy8gcmVhZCBiaW5hcnkgZGF0YSBmcm9tIGhlYXAgdG8gRGF0YVZpZXdcbiAgICAgIGxldCB2aWV3ID0gbmV3IERhdGFWaWV3KG5ldyBBcnJheUJ1ZmZlcihjYWNoZUJ1ZmZlckxvYy5sZW5ndGgpKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2FjaGVCdWZmZXJMb2MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmlldy5zZXRJbnQ4KGksIHRoaXMubW9kdWxlLkhFQVBVOFtjYWNoZUJ1ZmZlckxvYy5wb2ludGVyIC8gVWludDhBcnJheS5CWVRFU19QRVJfRUxFTUVOVCArIGldKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gZnJlZSBiaW5hcnkgb24gaGVhcFxuICAgICAgdGhpcy5tb2R1bGUuX2ZyZWUoY2FjaGVCdWZmZXJMb2MucG9pbnRlcik7XG4gICAgICBcbiAgICAgIC8vIHdyaXRlIGNhY2hlIGZpbGVcbiAgICAgIHZpZXdzLnB1c2goQnVmZmVyLmZyb20odmlldy5idWZmZXIpKTtcbiAgICAgIFxuICAgICAgLy8gbWFsbG9jIGtleXMgYnVmZmVyIGFuZCBnZXQgYnVmZmVyIGxvY2F0aW9uIGluIGMrKyBoZWFwXG4gICAgICBsZXQga2V5c0J1ZmZlckxvYyA9IEpTT04ucGFyc2UodGhpcy5tb2R1bGUuZ2V0X2tleXNfZmlsZV9idWZmZXIodGhpcy5jcHBBZGRyZXNzLCB0aGlzLnBhc3N3b3JkLCB2aWV3T25seSkpO1xuICAgICAgXG4gICAgICAvLyByZWFkIGJpbmFyeSBkYXRhIGZyb20gaGVhcCB0byBEYXRhVmlld1xuICAgICAgdmlldyA9IG5ldyBEYXRhVmlldyhuZXcgQXJyYXlCdWZmZXIoa2V5c0J1ZmZlckxvYy5sZW5ndGgpKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwga2V5c0J1ZmZlckxvYy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2aWV3LnNldEludDgoaSwgdGhpcy5tb2R1bGUuSEVBUFU4W2tleXNCdWZmZXJMb2MucG9pbnRlciAvIFVpbnQ4QXJyYXkuQllURVNfUEVSX0VMRU1FTlQgKyBpXSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIGZyZWUgYmluYXJ5IG9uIGhlYXBcbiAgICAgIHRoaXMubW9kdWxlLl9mcmVlKGtleXNCdWZmZXJMb2MucG9pbnRlcik7XG4gICAgICBcbiAgICAgIC8vIHByZXBlbmQga2V5cyBmaWxlXG4gICAgICB2aWV3cy51bnNoaWZ0KEJ1ZmZlci5mcm9tKHZpZXcuYnVmZmVyKSk7XG4gICAgICByZXR1cm4gdmlld3M7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNoYW5nZVBhc3N3b3JkKG9sZFBhc3N3b3JkOiBzdHJpbmcsIG5ld1Bhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmNoYW5nZVBhc3N3b3JkKG9sZFBhc3N3b3JkLCBuZXdQYXNzd29yZCk7XG4gICAgaWYgKG9sZFBhc3N3b3JkICE9PSB0aGlzLnBhc3N3b3JkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJJbnZhbGlkIG9yaWdpbmFsIHBhc3N3b3JkLlwiKTsgLy8gd2FsbGV0MiB2ZXJpZnlfcGFzc3dvcmQgbG9hZHMgZnJvbSBkaXNrIHNvIHZlcmlmeSBwYXNzd29yZCBoZXJlXG4gICAgaWYgKG5ld1Bhc3N3b3JkID09PSB1bmRlZmluZWQpIG5ld1Bhc3N3b3JkID0gXCJcIjtcbiAgICBhd2FpdCB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmNoYW5nZV93YWxsZXRfcGFzc3dvcmQodGhpcy5jcHBBZGRyZXNzLCBvbGRQYXNzd29yZCwgbmV3UGFzc3dvcmQsIChlcnJNc2cpID0+IHtcbiAgICAgICAgICBpZiAoZXJyTXNnKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKGVyck1zZykpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHRoaXMucGFzc3dvcmQgPSBuZXdQYXNzd29yZDtcbiAgICBpZiAodGhpcy5wYXRoKSBhd2FpdCB0aGlzLnNhdmUoKTsgLy8gYXV0byBzYXZlXG4gIH1cbiAgXG4gIGFzeW5jIHNhdmUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zYXZlKCk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuc2F2ZSh0aGlzKTtcbiAgfVxuICBcbiAgYXN5bmMgY2xvc2Uoc2F2ZSA9IGZhbHNlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuX2lzQ2xvc2VkKSByZXR1cm47IC8vIG5vIGVmZmVjdCBpZiBjbG9zZWRcbiAgICBpZiAoc2F2ZSkgYXdhaXQgdGhpcy5zYXZlKCk7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkge1xuICAgICAgYXdhaXQgdGhpcy5nZXRXYWxsZXRQcm94eSgpLmNsb3NlKGZhbHNlKTtcbiAgICAgIGF3YWl0IHN1cGVyLmNsb3NlKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGF3YWl0IHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICAgIGF3YWl0IHRoaXMuc3RvcFN5bmNpbmcoKTtcbiAgICBhd2FpdCBzdXBlci5jbG9zZSgpO1xuICAgIGRlbGV0ZSB0aGlzLnBhdGg7XG4gICAgZGVsZXRlIHRoaXMucGFzc3dvcmQ7XG4gICAgZGVsZXRlIHRoaXMud2FzbUxpc3RlbmVyO1xuICAgIExpYnJhcnlVdGlscy5zZXRSZWplY3RVbmF1dGhvcml6ZWRGbih0aGlzLnJlamVjdFVuYXV0aG9yaXplZENvbmZpZ0lkLCB1bmRlZmluZWQpOyAvLyB1bnJlZ2lzdGVyIGZuIGluZm9ybWluZyBpZiB1bmF1dGhvcml6ZWQgcmVxcyBzaG91bGQgYmUgcmVqZWN0ZWRcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0gQUREIEpTRE9DIEZPUiBTVVBQT1JURUQgREVGQVVMVCBJTVBMRU1FTlRBVElPTlMgLS0tLS0tLS0tLS0tLS1cbiAgXG4gIGFzeW5jIGdldE51bUJsb2Nrc1RvVW5sb2NrKCk6IFByb21pc2U8bnVtYmVyW10+IHsgcmV0dXJuIHN1cGVyLmdldE51bUJsb2Nrc1RvVW5sb2NrKCk7IH1cbiAgYXN5bmMgZ2V0VHgodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7IHJldHVybiBzdXBlci5nZXRUeCh0eEhhc2gpOyB9XG4gIGFzeW5jIGdldEluY29taW5nVHJhbnNmZXJzKHF1ZXJ5OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KTogUHJvbWlzZTxNb25lcm9JbmNvbWluZ1RyYW5zZmVyW10+IHsgcmV0dXJuIHN1cGVyLmdldEluY29taW5nVHJhbnNmZXJzKHF1ZXJ5KTsgfVxuICBhc3luYyBnZXRPdXRnb2luZ1RyYW5zZmVycyhxdWVyeTogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5PikgeyByZXR1cm4gc3VwZXIuZ2V0T3V0Z29pbmdUcmFuc2ZlcnMocXVlcnkpOyB9XG4gIGFzeW5jIGNyZWF0ZVR4KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7IHJldHVybiBzdXBlci5jcmVhdGVUeChjb25maWcpOyB9XG4gIGFzeW5jIHJlbGF5VHgodHhPck1ldGFkYXRhOiBNb25lcm9UeFdhbGxldCB8IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7IHJldHVybiBzdXBlci5yZWxheVR4KHR4T3JNZXRhZGF0YSk7IH1cbiAgYXN5bmMgZ2V0VHhOb3RlKHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHsgcmV0dXJuIHN1cGVyLmdldFR4Tm90ZSh0eEhhc2gpOyB9XG4gIGFzeW5jIHNldFR4Tm90ZSh0eEhhc2g6IHN0cmluZywgbm90ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7IHJldHVybiBzdXBlci5zZXRUeE5vdGUodHhIYXNoLCBub3RlKTsgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIEhFTFBFUlMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgb3BlbldhbGxldERhdGEoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pIHtcbiAgICBpZiAoY29uZmlnLnByb3h5VG9Xb3JrZXIpIHtcbiAgICAgIGxldCB3YWxsZXRQcm94eSA9IGF3YWl0IE1vbmVyb1dhbGxldEZ1bGxQcm94eS5vcGVuV2FsbGV0RGF0YShjb25maWcpO1xuICAgICAgcmV0dXJuIG5ldyBNb25lcm9XYWxsZXRGdWxsKHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHdhbGxldFByb3h5KTtcbiAgICB9XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgYW5kIG5vcm1hbGl6ZSBwYXJhbWV0ZXJzXG4gICAgaWYgKGNvbmZpZy5uZXR3b3JrVHlwZSA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgdGhlIHdhbGxldCdzIG5ldHdvcmsgdHlwZVwiKTtcbiAgICBjb25maWcubmV0d29ya1R5cGUgPSBNb25lcm9OZXR3b3JrVHlwZS5mcm9tKGNvbmZpZy5uZXR3b3JrVHlwZSk7XG4gICAgbGV0IGRhZW1vbkNvbm5lY3Rpb24gPSBjb25maWcuZ2V0U2VydmVyKCk7XG4gICAgbGV0IGRhZW1vblVyaSA9IGRhZW1vbkNvbm5lY3Rpb24gJiYgZGFlbW9uQ29ubmVjdGlvbi5nZXRVcmkoKSA/IGRhZW1vbkNvbm5lY3Rpb24uZ2V0VXJpKCkgOiBcIlwiO1xuICAgIGxldCBkYWVtb25Vc2VybmFtZSA9IGRhZW1vbkNvbm5lY3Rpb24gJiYgZGFlbW9uQ29ubmVjdGlvbi5nZXRVc2VybmFtZSgpID8gZGFlbW9uQ29ubmVjdGlvbi5nZXRVc2VybmFtZSgpIDogXCJcIjtcbiAgICBsZXQgZGFlbW9uUGFzc3dvcmQgPSBkYWVtb25Db25uZWN0aW9uICYmIGRhZW1vbkNvbm5lY3Rpb24uZ2V0UGFzc3dvcmQoKSA/IGRhZW1vbkNvbm5lY3Rpb24uZ2V0UGFzc3dvcmQoKSA6IFwiXCI7XG4gICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZCA9IGRhZW1vbkNvbm5lY3Rpb24gPyBkYWVtb25Db25uZWN0aW9uLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdHJ1ZTtcbiAgICBcbiAgICAvLyBsb2FkIHdhc20gbW9kdWxlXG4gICAgbGV0IG1vZHVsZSA9IGF3YWl0IExpYnJhcnlVdGlscy5sb2FkRnVsbE1vZHVsZSgpO1xuICAgIFxuICAgIC8vIG9wZW4gd2FsbGV0IGluIHF1ZXVlXG4gICAgcmV0dXJuIG1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIHJlZ2lzdGVyIGZuIGluZm9ybWluZyBpZiB1bmF1dGhvcml6ZWQgcmVxcyBzaG91bGQgYmUgcmVqZWN0ZWRcbiAgICAgICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZEZuSWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5zZXRSZWplY3RVbmF1dGhvcml6ZWRGbihyZWplY3RVbmF1dGhvcml6ZWRGbklkLCAoKSA9PiByZWplY3RVbmF1dGhvcml6ZWQpO1xuICAgICAgXG4gICAgICAgIC8vIGNyZWF0ZSB3YWxsZXQgaW4gd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICBtb2R1bGUub3Blbl93YWxsZXRfZnVsbChjb25maWcucGFzc3dvcmQsIGNvbmZpZy5uZXR3b3JrVHlwZSwgY29uZmlnLmtleXNEYXRhID8/IFwiXCIsIGNvbmZpZy5jYWNoZURhdGEgPz8gXCJcIiwgZGFlbW9uVXJpLCBkYWVtb25Vc2VybmFtZSwgZGFlbW9uUGFzc3dvcmQsIHJlamVjdFVuYXV0aG9yaXplZEZuSWQsIChjcHBBZGRyZXNzKSA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBjcHBBZGRyZXNzID09PSBcInN0cmluZ1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKGNwcEFkZHJlc3MpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb1dhbGxldEZ1bGwoY3BwQWRkcmVzcywgY29uZmlnLnBhdGgsIGNvbmZpZy5wYXNzd29yZCwgZnMsIHJlamVjdFVuYXV0aG9yaXplZCwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcHJvdGVjdGVkIGdldFdhbGxldFByb3h5KCk6IE1vbmVyb1dhbGxldEZ1bGxQcm94eSB7XG4gICAgcmV0dXJuIHN1cGVyLmdldFdhbGxldFByb3h5KCkgYXMgTW9uZXJvV2FsbGV0RnVsbFByb3h5O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgYmFja2dyb3VuZFN5bmMoKSB7XG4gICAgbGV0IGxhYmVsID0gdGhpcy5wYXRoID8gdGhpcy5wYXRoIDogKHRoaXMuYnJvd3Nlck1haW5QYXRoID8gdGhpcy5icm93c2VyTWFpblBhdGggOiBcImluLW1lbW9yeSB3YWxsZXRcIik7IC8vIGxhYmVsIGZvciBsb2dcbiAgICBMaWJyYXJ5VXRpbHMubG9nKDEsIFwiQmFja2dyb3VuZCBzeW5jaHJvbml6aW5nIFwiICsgbGFiZWwpO1xuICAgIHRyeSB7IGF3YWl0IHRoaXMuc3luYygpOyB9XG4gICAgY2F0Y2ggKGVycjogYW55KSB7IGlmICghdGhpcy5faXNDbG9zZWQpIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gYmFja2dyb3VuZCBzeW5jaHJvbml6ZSBcIiArIGxhYmVsICsgXCI6IFwiICsgZXJyLm1lc3NhZ2UpOyB9XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyByZWZyZXNoTGlzdGVuaW5nKCkge1xuICAgIGxldCBpc0VuYWJsZWQgPSB0aGlzLmxpc3RlbmVycy5sZW5ndGggPiAwO1xuICAgIGlmICh0aGlzLndhc21MaXN0ZW5lckhhbmRsZSA9PT0gMCAmJiAhaXNFbmFibGVkIHx8IHRoaXMud2FzbUxpc3RlbmVySGFuZGxlID4gMCAmJiBpc0VuYWJsZWQpIHJldHVybjsgLy8gbm8gZGlmZmVyZW5jZVxuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuc2V0X2xpc3RlbmVyKFxuICAgICAgICAgIHRoaXMuY3BwQWRkcmVzcyxcbiAgICAgICAgICB0aGlzLndhc21MaXN0ZW5lckhhbmRsZSxcbiAgICAgICAgICAgIG5ld0xpc3RlbmVySGFuZGxlID0+IHtcbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiBuZXdMaXN0ZW5lckhhbmRsZSA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihuZXdMaXN0ZW5lckhhbmRsZSkpO1xuICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLndhc21MaXN0ZW5lckhhbmRsZSA9IG5ld0xpc3RlbmVySGFuZGxlO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzRW5hYmxlZCA/IGFzeW5jIChoZWlnaHQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIHBlcmNlbnREb25lLCBtZXNzYWdlKSA9PiBhd2FpdCB0aGlzLndhc21MaXN0ZW5lci5vblN5bmNQcm9ncmVzcyhoZWlnaHQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIHBlcmNlbnREb25lLCBtZXNzYWdlKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGlzRW5hYmxlZCA/IGFzeW5jIChoZWlnaHQpID0+IGF3YWl0IHRoaXMud2FzbUxpc3RlbmVyLm9uTmV3QmxvY2soaGVpZ2h0KSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGlzRW5hYmxlZCA/IGFzeW5jIChuZXdCYWxhbmNlU3RyLCBuZXdVbmxvY2tlZEJhbGFuY2VTdHIpID0+IGF3YWl0IHRoaXMud2FzbUxpc3RlbmVyLm9uQmFsYW5jZXNDaGFuZ2VkKG5ld0JhbGFuY2VTdHIsIG5ld1VubG9ja2VkQmFsYW5jZVN0cikgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBpc0VuYWJsZWQgPyBhc3luYyAoaGVpZ2h0LCB0eEhhc2gsIGFtb3VudFN0ciwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCwgdmVyc2lvbiwgdW5sb2NrVGltZSwgaXNMb2NrZWQpID0+IGF3YWl0IHRoaXMud2FzbUxpc3RlbmVyLm9uT3V0cHV0UmVjZWl2ZWQoaGVpZ2h0LCB0eEhhc2gsIGFtb3VudFN0ciwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCwgdmVyc2lvbiwgdW5sb2NrVGltZSwgaXNMb2NrZWQpIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgaXNFbmFibGVkID8gYXN5bmMgKGhlaWdodCwgdHhIYXNoLCBhbW91bnRTdHIsIGFjY291bnRJZHhTdHIsIHN1YmFkZHJlc3NJZHhTdHIsIHZlcnNpb24sIHVubG9ja1RpbWUsIGlzTG9ja2VkKSA9PiBhd2FpdCB0aGlzLndhc21MaXN0ZW5lci5vbk91dHB1dFNwZW50KGhlaWdodCwgdHhIYXNoLCBhbW91bnRTdHIsIGFjY291bnRJZHhTdHIsIHN1YmFkZHJlc3NJZHhTdHIsIHZlcnNpb24sIHVubG9ja1RpbWUsIGlzTG9ja2VkKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBzdGF0aWMgc2FuaXRpemVCbG9jayhibG9jaykge1xuICAgIGZvciAobGV0IHR4IG9mIGJsb2NrLmdldFR4cygpKSBNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplVHhXYWxsZXQodHgpO1xuICAgIHJldHVybiBibG9jaztcbiAgfVxuICBcbiAgc3RhdGljIHNhbml0aXplVHhXYWxsZXQodHgpIHtcbiAgICBhc3NlcnQodHggaW5zdGFuY2VvZiBNb25lcm9UeFdhbGxldCk7XG4gICAgcmV0dXJuIHR4O1xuICB9XG4gIFxuICBzdGF0aWMgc2FuaXRpemVBY2NvdW50KGFjY291bnQpIHtcbiAgICBpZiAoYWNjb3VudC5nZXRTdWJhZGRyZXNzZXMoKSkge1xuICAgICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBhY2NvdW50LmdldFN1YmFkZHJlc3NlcygpKSBNb25lcm9XYWxsZXRLZXlzLnNhbml0aXplU3ViYWRkcmVzcyhzdWJhZGRyZXNzKTtcbiAgICB9XG4gICAgcmV0dXJuIGFjY291bnQ7XG4gIH1cbiAgXG4gIHN0YXRpYyBkZXNlcmlhbGl6ZUJsb2NrcyhibG9ja3NKc29uU3RyKSB7XG4gICAgbGV0IGJsb2Nrc0pzb24gPSBKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMoYmxvY2tzSnNvblN0cikpO1xuICAgIGxldCBkZXNlcmlhbGl6ZWRCbG9ja3M6IGFueSA9IHt9O1xuICAgIGRlc2VyaWFsaXplZEJsb2Nrcy5ibG9ja3MgPSBbXTtcbiAgICBpZiAoYmxvY2tzSnNvbi5ibG9ja3MpIGZvciAobGV0IGJsb2NrSnNvbiBvZiBibG9ja3NKc29uLmJsb2NrcykgZGVzZXJpYWxpemVkQmxvY2tzLmJsb2Nrcy5wdXNoKE1vbmVyb1dhbGxldEZ1bGwuc2FuaXRpemVCbG9jayhuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uLCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYX1dBTExFVCkpKTtcbiAgICByZXR1cm4gZGVzZXJpYWxpemVkQmxvY2tzO1xuICB9XG4gIFxuICBzdGF0aWMgZGVzZXJpYWxpemVUeHMocXVlcnksIGJsb2Nrc0pzb25TdHIpIHtcbiAgICBcbiAgICAvLyBkZXNlcmlhbGl6ZSBibG9ja3NcbiAgICBsZXQgZGVzZXJpYWxpemVkQmxvY2tzID0gTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZUJsb2NrcyhibG9ja3NKc29uU3RyKTtcbiAgICBsZXQgYmxvY2tzID0gZGVzZXJpYWxpemVkQmxvY2tzLmJsb2NrcztcbiAgICBcbiAgICAvLyBjb2xsZWN0IHR4c1xuICAgIGxldCB0eHMgPSBbXTtcbiAgICBmb3IgKGxldCBibG9jayBvZiBibG9ja3MpIHtcbiAgICAgIE1vbmVyb1dhbGxldEZ1bGwuc2FuaXRpemVCbG9jayhibG9jayk7XG4gICAgICBmb3IgKGxldCB0eCBvZiBibG9jay5nZXRUeHMoKSkge1xuICAgICAgICBpZiAoYmxvY2suZ2V0SGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgdHguc2V0QmxvY2sodW5kZWZpbmVkKTsgLy8gZGVyZWZlcmVuY2UgcGxhY2Vob2xkZXIgYmxvY2sgZm9yIHVuY29uZmlybWVkIHR4c1xuICAgICAgICB0eHMucHVzaCh0eCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIHJlLXNvcnQgdHhzIHdoaWNoIGlzIGxvc3Qgb3ZlciB3YXNtIHNlcmlhbGl6YXRpb24gIC8vIFRPRE86IGNvbmZpcm0gdGhhdCBvcmRlciBpcyBsb3N0XG4gICAgaWYgKHF1ZXJ5LmdldEhhc2hlcygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGxldCB0eE1hcCA9IG5ldyBNYXAoKTtcbiAgICAgIGZvciAobGV0IHR4IG9mIHR4cykgdHhNYXBbdHguZ2V0SGFzaCgpXSA9IHR4O1xuICAgICAgbGV0IHR4c1NvcnRlZCA9IFtdO1xuICAgICAgZm9yIChsZXQgdHhIYXNoIG9mIHF1ZXJ5LmdldEhhc2hlcygpKSBpZiAodHhNYXBbdHhIYXNoXSAhPT0gdW5kZWZpbmVkKSB0eHNTb3J0ZWQucHVzaCh0eE1hcFt0eEhhc2hdKTtcbiAgICAgIHR4cyA9IHR4c1NvcnRlZDtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHR4cztcbiAgfVxuICBcbiAgc3RhdGljIGRlc2VyaWFsaXplVHJhbnNmZXJzKHF1ZXJ5LCBibG9ja3NKc29uU3RyKSB7XG4gICAgXG4gICAgLy8gZGVzZXJpYWxpemUgYmxvY2tzXG4gICAgbGV0IGRlc2VyaWFsaXplZEJsb2NrcyA9IE1vbmVyb1dhbGxldEZ1bGwuZGVzZXJpYWxpemVCbG9ja3MoYmxvY2tzSnNvblN0cik7XG4gICAgbGV0IGJsb2NrcyA9IGRlc2VyaWFsaXplZEJsb2Nrcy5ibG9ja3M7XG4gICAgXG4gICAgLy8gY29sbGVjdCB0cmFuc2ZlcnNcbiAgICBsZXQgdHJhbnNmZXJzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2sgb2YgYmxvY2tzKSB7XG4gICAgICBmb3IgKGxldCB0eCBvZiBibG9jay5nZXRUeHMoKSkge1xuICAgICAgICBpZiAoYmxvY2suZ2V0SGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgdHguc2V0QmxvY2sodW5kZWZpbmVkKTsgLy8gZGVyZWZlcmVuY2UgcGxhY2Vob2xkZXIgYmxvY2sgZm9yIHVuY29uZmlybWVkIHR4c1xuICAgICAgICBpZiAodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpICE9PSB1bmRlZmluZWQpIHRyYW5zZmVycy5wdXNoKHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSk7XG4gICAgICAgIGlmICh0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpKSB0cmFuc2ZlcnMucHVzaCh0cmFuc2Zlcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHRyYW5zZmVycztcbiAgfVxuICBcbiAgc3RhdGljIGRlc2VyaWFsaXplT3V0cHV0cyhxdWVyeSwgYmxvY2tzSnNvblN0cikge1xuICAgIFxuICAgIC8vIGRlc2VyaWFsaXplIGJsb2Nrc1xuICAgIGxldCBkZXNlcmlhbGl6ZWRCbG9ja3MgPSBNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplQmxvY2tzKGJsb2Nrc0pzb25TdHIpO1xuICAgIGxldCBibG9ja3MgPSBkZXNlcmlhbGl6ZWRCbG9ja3MuYmxvY2tzO1xuICAgIFxuICAgIC8vIGNvbGxlY3Qgb3V0cHV0c1xuICAgIGxldCBvdXRwdXRzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2sgb2YgYmxvY2tzKSB7XG4gICAgICBmb3IgKGxldCB0eCBvZiBibG9jay5nZXRUeHMoKSkge1xuICAgICAgICBmb3IgKGxldCBvdXRwdXQgb2YgdHguZ2V0T3V0cHV0cygpKSBvdXRwdXRzLnB1c2gob3V0cHV0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIG91dHB1dHM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZXQgdGhlIHBhdGggb2YgdGhlIHdhbGxldCBvbiB0aGUgYnJvd3NlciBtYWluIHRocmVhZCBpZiBydW4gYXMgYSB3b3JrZXIuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gYnJvd3Nlck1haW5QYXRoIC0gcGF0aCBvZiB0aGUgd2FsbGV0IG9uIHRoZSBicm93c2VyIG1haW4gdGhyZWFkXG4gICAqL1xuICBwcm90ZWN0ZWQgc2V0QnJvd3Nlck1haW5QYXRoKGJyb3dzZXJNYWluUGF0aCkge1xuICAgIHRoaXMuYnJvd3Nlck1haW5QYXRoID0gYnJvd3Nlck1haW5QYXRoO1xuICB9XG4gIFxuICBzdGF0aWMgYXN5bmMgbW92ZVRvKHBhdGgsIHdhbGxldCkge1xuICAgIGlmIChhd2FpdCB3YWxsZXQuaXNDbG9zZWQoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGlzIGNsb3NlZFwiKTtcbiAgICBpZiAoIXBhdGgpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBwYXRoIG9mIGRlc3RpbmF0aW9uIHdhbGxldFwiKTtcbiAgICBcbiAgICAvLyBzYXZlIGFuZCByZXR1cm4gaWYgc2FtZSBwYXRoXG4gICAgaWYgKFBhdGgubm9ybWFsaXplKHdhbGxldC5wYXRoKSA9PT0gUGF0aC5ub3JtYWxpemUocGF0aCkpIHtcbiAgICAgIGF3YWl0IHdhbGxldC5zYXZlKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIFxuICAgIC8vIGNyZWF0ZSBkZXN0aW5hdGlvbiBkaXJlY3RvcnkgaWYgaXQgZG9lc24ndCBleGlzdFxuICAgIGxldCB3YWxsZXREaXIgPSBQYXRoLmRpcm5hbWUocGF0aCk7XG4gICAgaWYgKCF3YWxsZXQuZnMuZXhpc3RzU3luYyh3YWxsZXREaXIpKSB7XG4gICAgICB0cnkgeyB3YWxsZXQuZnMubWtkaXJTeW5jKHdhbGxldERpcik7IH1cbiAgICAgIGNhdGNoIChlcnI6IGFueSkgeyB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJEZXN0aW5hdGlvbiBwYXRoIFwiICsgcGF0aCArIFwiIGRvZXMgbm90IGV4aXN0IGFuZCBjYW5ub3QgYmUgY3JlYXRlZDogXCIgKyBlcnIubWVzc2FnZSk7IH1cbiAgICB9XG4gICAgXG4gICAgLy8gd3JpdGUgd2FsbGV0IGZpbGVzXG4gICAgbGV0IGRhdGEgPSBhd2FpdCB3YWxsZXQuZ2V0RGF0YSgpO1xuICAgIHdhbGxldC5mcy53cml0ZUZpbGVTeW5jKHBhdGggKyBcIi5rZXlzXCIsIGRhdGFbMF0sIFwiYmluYXJ5XCIpO1xuICAgIHdhbGxldC5mcy53cml0ZUZpbGVTeW5jKHBhdGgsIGRhdGFbMV0sIFwiYmluYXJ5XCIpO1xuICAgIHdhbGxldC5mcy53cml0ZUZpbGVTeW5jKHBhdGggKyBcIi5hZGRyZXNzLnR4dFwiLCBhd2FpdCB3YWxsZXQuZ2V0UHJpbWFyeUFkZHJlc3MoKSk7XG4gICAgbGV0IG9sZFBhdGggPSB3YWxsZXQucGF0aDtcbiAgICB3YWxsZXQucGF0aCA9IHBhdGg7XG4gICAgXG4gICAgLy8gZGVsZXRlIG9sZCB3YWxsZXQgZmlsZXNcbiAgICBpZiAob2xkUGF0aCkge1xuICAgICAgd2FsbGV0LmZzLnVubGlua1N5bmMob2xkUGF0aCArIFwiLmFkZHJlc3MudHh0XCIpO1xuICAgICAgd2FsbGV0LmZzLnVubGlua1N5bmMob2xkUGF0aCArIFwiLmtleXNcIik7XG4gICAgICB3YWxsZXQuZnMudW5saW5rU3luYyhvbGRQYXRoKTtcbiAgICB9XG4gIH1cbiAgXG4gIHN0YXRpYyBhc3luYyBzYXZlKHdhbGxldDogYW55KSB7XG4gICAgaWYgKGF3YWl0IHdhbGxldC5pc0Nsb3NlZCgpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgaXMgY2xvc2VkXCIpO1xuICAgICAgICBcbiAgICAvLyBwYXRoIG11c3QgYmUgc2V0XG4gICAgbGV0IHBhdGggPSBhd2FpdCB3YWxsZXQuZ2V0UGF0aCgpO1xuICAgIGlmICghcGF0aCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNhdmUgd2FsbGV0IGJlY2F1c2UgcGF0aCBpcyBub3Qgc2V0XCIpO1xuICAgIFxuICAgIC8vIHdyaXRlIHdhbGxldCBmaWxlcyB0byAqLm5ld1xuICAgIGxldCBwYXRoTmV3ID0gcGF0aCArIFwiLm5ld1wiO1xuICAgIGxldCBkYXRhID0gYXdhaXQgd2FsbGV0LmdldERhdGEoKTtcbiAgICB3YWxsZXQuZnMud3JpdGVGaWxlU3luYyhwYXRoTmV3ICsgXCIua2V5c1wiLCBkYXRhWzBdLCBcImJpbmFyeVwiKTtcbiAgICB3YWxsZXQuZnMud3JpdGVGaWxlU3luYyhwYXRoTmV3LCBkYXRhWzFdLCBcImJpbmFyeVwiKTtcbiAgICB3YWxsZXQuZnMud3JpdGVGaWxlU3luYyhwYXRoTmV3ICsgXCIuYWRkcmVzcy50eHRcIiwgYXdhaXQgd2FsbGV0LmdldFByaW1hcnlBZGRyZXNzKCkpO1xuICAgIFxuICAgIC8vIHJlcGxhY2Ugb2xkIHdhbGxldCBmaWxlcyB3aXRoIG5ld1xuICAgIHdhbGxldC5mcy5yZW5hbWVTeW5jKHBhdGhOZXcgKyBcIi5rZXlzXCIsIHBhdGggKyBcIi5rZXlzXCIpO1xuICAgIHdhbGxldC5mcy5yZW5hbWVTeW5jKHBhdGhOZXcsIHBhdGgsIHBhdGggKyBcIi5rZXlzXCIpO1xuICAgIHdhbGxldC5mcy5yZW5hbWVTeW5jKHBhdGhOZXcgKyBcIi5hZGRyZXNzLnR4dFwiLCBwYXRoICsgXCIuYWRkcmVzcy50eHRcIiwgcGF0aCArIFwiLmtleXNcIik7XG4gIH1cbn1cblxuLyoqXG4gKiBJbXBsZW1lbnRzIGEgTW9uZXJvV2FsbGV0IGJ5IHByb3h5aW5nIHJlcXVlc3RzIHRvIGEgd29ya2VyIHdoaWNoIHJ1bnMgYSBmdWxsIHdhbGxldC5cbiAqIFxuICogQHByaXZhdGVcbiAqL1xuY2xhc3MgTW9uZXJvV2FsbGV0RnVsbFByb3h5IGV4dGVuZHMgTW9uZXJvV2FsbGV0S2V5c1Byb3h5IHtcblxuICAvLyBpbnN0YW5jZSB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIHBhdGg6IGFueTtcbiAgcHJvdGVjdGVkIGZzOiBhbnk7XG4gIHByb3RlY3RlZCB3cmFwcGVkTGlzdGVuZXJzOiBhbnk7XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBXQUxMRVQgU1RBVElDIFVUSUxTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgc3RhdGljIGFzeW5jIG9wZW5XYWxsZXREYXRhKGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KSB7XG4gICAgbGV0IHdhbGxldElkID0gR2VuVXRpbHMuZ2V0VVVJRCgpO1xuICAgIGlmIChjb25maWcucGFzc3dvcmQgPT09IHVuZGVmaW5lZCkgY29uZmlnLnBhc3N3b3JkID0gXCJcIjtcbiAgICBsZXQgZGFlbW9uQ29ubmVjdGlvbiA9IGNvbmZpZy5nZXRTZXJ2ZXIoKTtcbiAgICBhd2FpdCBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKHdhbGxldElkLCBcIm9wZW5XYWxsZXREYXRhXCIsIFtjb25maWcucGF0aCwgY29uZmlnLnBhc3N3b3JkLCBjb25maWcubmV0d29ya1R5cGUsIGNvbmZpZy5rZXlzRGF0YSwgY29uZmlnLmNhY2hlRGF0YSwgZGFlbW9uQ29ubmVjdGlvbiA/IGRhZW1vbkNvbm5lY3Rpb24udG9Kc29uKCkgOiB1bmRlZmluZWRdKTtcbiAgICBsZXQgd2FsbGV0ID0gbmV3IE1vbmVyb1dhbGxldEZ1bGxQcm94eSh3YWxsZXRJZCwgYXdhaXQgTGlicmFyeVV0aWxzLmdldFdvcmtlcigpLCBjb25maWcucGF0aCwgY29uZmlnLmdldEZzKCkpO1xuICAgIGlmIChjb25maWcucGF0aCkgYXdhaXQgd2FsbGV0LnNhdmUoKTtcbiAgICByZXR1cm4gd2FsbGV0O1xuICB9XG4gIFxuICBzdGF0aWMgYXN5bmMgY3JlYXRlV2FsbGV0KGNvbmZpZykge1xuICAgIGlmIChjb25maWcuZ2V0UGF0aCgpICYmIE1vbmVyb1dhbGxldEZ1bGwud2FsbGV0RXhpc3RzKGNvbmZpZy5nZXRQYXRoKCksIGNvbmZpZy5nZXRGcygpKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGFscmVhZHkgZXhpc3RzOiBcIiArIGNvbmZpZy5nZXRQYXRoKCkpO1xuICAgIGxldCB3YWxsZXRJZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICBhd2FpdCBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKHdhbGxldElkLCBcImNyZWF0ZVdhbGxldEZ1bGxcIiwgW2NvbmZpZy50b0pzb24oKV0pO1xuICAgIGxldCB3YWxsZXQgPSBuZXcgTW9uZXJvV2FsbGV0RnVsbFByb3h5KHdhbGxldElkLCBhd2FpdCBMaWJyYXJ5VXRpbHMuZ2V0V29ya2VyKCksIGNvbmZpZy5nZXRQYXRoKCksIGNvbmZpZy5nZXRGcygpKTtcbiAgICBpZiAoY29uZmlnLmdldFBhdGgoKSkgYXdhaXQgd2FsbGV0LnNhdmUoKTtcbiAgICByZXR1cm4gd2FsbGV0O1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gSU5TVEFOQ0UgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICAvKipcbiAgICogSW50ZXJuYWwgY29uc3RydWN0b3Igd2hpY2ggaXMgZ2l2ZW4gYSB3b3JrZXIgdG8gY29tbXVuaWNhdGUgd2l0aCB2aWEgbWVzc2FnZXMuXG4gICAqIFxuICAgKiBUaGlzIG1ldGhvZCBzaG91bGQgbm90IGJlIGNhbGxlZCBleHRlcm5hbGx5IGJ1dCBzaG91bGQgYmUgY2FsbGVkIHRocm91Z2hcbiAgICogc3RhdGljIHdhbGxldCBjcmVhdGlvbiB1dGlsaXRpZXMgaW4gdGhpcyBjbGFzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB3YWxsZXRJZCAtIGlkZW50aWZpZXMgdGhlIHdhbGxldCB3aXRoIHRoZSB3b3JrZXJcbiAgICogQHBhcmFtIHtXb3JrZXJ9IHdvcmtlciAtIHdvcmtlciB0byBjb21tdW5pY2F0ZSB3aXRoIHZpYSBtZXNzYWdlc1xuICAgKi9cbiAgY29uc3RydWN0b3Iod2FsbGV0SWQsIHdvcmtlciwgcGF0aCwgZnMpIHtcbiAgICBzdXBlcih3YWxsZXRJZCwgd29ya2VyKTtcbiAgICB0aGlzLnBhdGggPSBwYXRoO1xuICAgIHRoaXMuZnMgPSBmcyA/IGZzIDogKHBhdGggPyBNb25lcm9XYWxsZXRGdWxsLmdldEZzKCkgOiB1bmRlZmluZWQpO1xuICAgIHRoaXMud3JhcHBlZExpc3RlbmVycyA9IFtdO1xuICB9XG5cbiAgZ2V0UGF0aCgpIHtcbiAgICByZXR1cm4gdGhpcy5wYXRoO1xuICB9XG5cbiAgYXN5bmMgZ2V0TmV0d29ya1R5cGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0TmV0d29ya1R5cGVcIik7XG4gIH1cbiAgXG4gIGFzeW5jIHNldFN1YmFkZHJlc3NMYWJlbChhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4LCBsYWJlbCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInNldFN1YmFkZHJlc3NMYWJlbFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpIGFzIFByb21pc2U8dm9pZD47XG4gIH1cbiAgXG4gIGFzeW5jIHNldERhZW1vbkNvbm5lY3Rpb24odXJpT3JScGNDb25uZWN0aW9uKSB7XG4gICAgaWYgKCF1cmlPclJwY0Nvbm5lY3Rpb24pIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwic2V0RGFlbW9uQ29ubmVjdGlvblwiKTtcbiAgICBlbHNlIHtcbiAgICAgIGxldCBjb25uZWN0aW9uID0gIXVyaU9yUnBjQ29ubmVjdGlvbiA/IHVuZGVmaW5lZCA6IHVyaU9yUnBjQ29ubmVjdGlvbiBpbnN0YW5jZW9mIE1vbmVyb1JwY0Nvbm5lY3Rpb24gPyB1cmlPclJwY0Nvbm5lY3Rpb24gOiBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih1cmlPclJwY0Nvbm5lY3Rpb24pO1xuICAgICAgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJzZXREYWVtb25Db25uZWN0aW9uXCIsIGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldENvbmZpZygpIDogdW5kZWZpbmVkKTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGdldERhZW1vbkNvbm5lY3Rpb24oKSB7XG4gICAgbGV0IHJwY0NvbmZpZyA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0RGFlbW9uQ29ubmVjdGlvblwiKTtcbiAgICByZXR1cm4gcnBjQ29uZmlnID8gbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24ocnBjQ29uZmlnKSA6IHVuZGVmaW5lZDtcbiAgfVxuICBcbiAgYXN5bmMgaXNDb25uZWN0ZWRUb0RhZW1vbigpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJpc0Nvbm5lY3RlZFRvRGFlbW9uXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRSZXN0b3JlSGVpZ2h0KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldFJlc3RvcmVIZWlnaHRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIHNldFJlc3RvcmVIZWlnaHQocmVzdG9yZUhlaWdodCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInNldFJlc3RvcmVIZWlnaHRcIiwgW3Jlc3RvcmVIZWlnaHRdKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RGFlbW9uSGVpZ2h0KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldERhZW1vbkhlaWdodFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RGFlbW9uTWF4UGVlckhlaWdodCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXREYWVtb25NYXhQZWVySGVpZ2h0XCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRIZWlnaHRCeURhdGUoeWVhciwgbW9udGgsIGRheSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldEhlaWdodEJ5RGF0ZVwiLCBbeWVhciwgbW9udGgsIGRheV0pO1xuICB9XG4gIFxuICBhc3luYyBpc0RhZW1vblN5bmNlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJpc0RhZW1vblN5bmNlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldEhlaWdodFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgYWRkTGlzdGVuZXIobGlzdGVuZXIpIHtcbiAgICBsZXQgd3JhcHBlZExpc3RlbmVyID0gbmV3IFdhbGxldFdvcmtlckxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBsZXQgbGlzdGVuZXJJZCA9IHdyYXBwZWRMaXN0ZW5lci5nZXRJZCgpO1xuICAgIExpYnJhcnlVdGlscy5hZGRXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uU3luY1Byb2dyZXNzX1wiICsgbGlzdGVuZXJJZCwgW3dyYXBwZWRMaXN0ZW5lci5vblN5bmNQcm9ncmVzcywgd3JhcHBlZExpc3RlbmVyXSk7XG4gICAgTGlicmFyeVV0aWxzLmFkZFdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25OZXdCbG9ja19cIiArIGxpc3RlbmVySWQsIFt3cmFwcGVkTGlzdGVuZXIub25OZXdCbG9jaywgd3JhcHBlZExpc3RlbmVyXSk7XG4gICAgTGlicmFyeVV0aWxzLmFkZFdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25CYWxhbmNlc0NoYW5nZWRfXCIgKyBsaXN0ZW5lcklkLCBbd3JhcHBlZExpc3RlbmVyLm9uQmFsYW5jZXNDaGFuZ2VkLCB3cmFwcGVkTGlzdGVuZXJdKTtcbiAgICBMaWJyYXJ5VXRpbHMuYWRkV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvbk91dHB1dFJlY2VpdmVkX1wiICsgbGlzdGVuZXJJZCwgW3dyYXBwZWRMaXN0ZW5lci5vbk91dHB1dFJlY2VpdmVkLCB3cmFwcGVkTGlzdGVuZXJdKTtcbiAgICBMaWJyYXJ5VXRpbHMuYWRkV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvbk91dHB1dFNwZW50X1wiICsgbGlzdGVuZXJJZCwgW3dyYXBwZWRMaXN0ZW5lci5vbk91dHB1dFNwZW50LCB3cmFwcGVkTGlzdGVuZXJdKTtcbiAgICB0aGlzLndyYXBwZWRMaXN0ZW5lcnMucHVzaCh3cmFwcGVkTGlzdGVuZXIpO1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImFkZExpc3RlbmVyXCIsIFtsaXN0ZW5lcklkXSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndyYXBwZWRMaXN0ZW5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLndyYXBwZWRMaXN0ZW5lcnNbaV0uZ2V0TGlzdGVuZXIoKSA9PT0gbGlzdGVuZXIpIHtcbiAgICAgICAgbGV0IGxpc3RlbmVySWQgPSB0aGlzLndyYXBwZWRMaXN0ZW5lcnNbaV0uZ2V0SWQoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJyZW1vdmVMaXN0ZW5lclwiLCBbbGlzdGVuZXJJZF0pO1xuICAgICAgICBMaWJyYXJ5VXRpbHMucmVtb3ZlV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvblN5bmNQcm9ncmVzc19cIiArIGxpc3RlbmVySWQpO1xuICAgICAgICBMaWJyYXJ5VXRpbHMucmVtb3ZlV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvbk5ld0Jsb2NrX1wiICsgbGlzdGVuZXJJZCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5yZW1vdmVXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uQmFsYW5jZXNDaGFuZ2VkX1wiICsgbGlzdGVuZXJJZCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5yZW1vdmVXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uT3V0cHV0UmVjZWl2ZWRfXCIgKyBsaXN0ZW5lcklkKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnJlbW92ZVdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25PdXRwdXRTcGVudF9cIiArIGxpc3RlbmVySWQpO1xuICAgICAgICB0aGlzLndyYXBwZWRMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkxpc3RlbmVyIGlzIG5vdCByZWdpc3RlcmVkIHdpdGggd2FsbGV0XCIpO1xuICB9XG4gIFxuICBnZXRMaXN0ZW5lcnMoKSB7XG4gICAgbGV0IGxpc3RlbmVycyA9IFtdO1xuICAgIGZvciAobGV0IHdyYXBwZWRMaXN0ZW5lciBvZiB0aGlzLndyYXBwZWRMaXN0ZW5lcnMpIGxpc3RlbmVycy5wdXNoKHdyYXBwZWRMaXN0ZW5lci5nZXRMaXN0ZW5lcigpKTtcbiAgICByZXR1cm4gbGlzdGVuZXJzO1xuICB9XG4gIFxuICBhc3luYyBpc1N5bmNlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJpc1N5bmNlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgc3luYyhsaXN0ZW5lck9yU3RhcnRIZWlnaHQ/OiBNb25lcm9XYWxsZXRMaXN0ZW5lciB8IG51bWJlciwgc3RhcnRIZWlnaHQ/OiBudW1iZXIsIGFsbG93Q29uY3VycmVudENhbGxzID0gZmFsc2UpOiBQcm9taXNlPE1vbmVyb1N5bmNSZXN1bHQ+IHtcbiAgICBcbiAgICAvLyBub3JtYWxpemUgcGFyYW1zXG4gICAgc3RhcnRIZWlnaHQgPSBsaXN0ZW5lck9yU3RhcnRIZWlnaHQgaW5zdGFuY2VvZiBNb25lcm9XYWxsZXRMaXN0ZW5lciA/IHN0YXJ0SGVpZ2h0IDogbGlzdGVuZXJPclN0YXJ0SGVpZ2h0O1xuICAgIGxldCBsaXN0ZW5lciA9IGxpc3RlbmVyT3JTdGFydEhlaWdodCBpbnN0YW5jZW9mIE1vbmVyb1dhbGxldExpc3RlbmVyID8gbGlzdGVuZXJPclN0YXJ0SGVpZ2h0IDogdW5kZWZpbmVkO1xuICAgIGlmIChzdGFydEhlaWdodCA9PT0gdW5kZWZpbmVkKSBzdGFydEhlaWdodCA9IE1hdGgubWF4KGF3YWl0IHRoaXMuZ2V0SGVpZ2h0KCksIGF3YWl0IHRoaXMuZ2V0UmVzdG9yZUhlaWdodCgpKTtcbiAgICBcbiAgICAvLyByZWdpc3RlciBsaXN0ZW5lciBpZiBnaXZlblxuICAgIGlmIChsaXN0ZW5lcikgYXdhaXQgdGhpcy5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgXG4gICAgLy8gc3luYyB3YWxsZXQgaW4gd29ya2VyIFxuICAgIGxldCBlcnI7XG4gICAgbGV0IHJlc3VsdDtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3VsdEpzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInN5bmNcIiwgW3N0YXJ0SGVpZ2h0LCBhbGxvd0NvbmN1cnJlbnRDYWxsc10pO1xuICAgICAgcmVzdWx0ID0gbmV3IE1vbmVyb1N5bmNSZXN1bHQocmVzdWx0SnNvbi5udW1CbG9ja3NGZXRjaGVkLCByZXN1bHRKc29uLnJlY2VpdmVkTW9uZXkpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGVyciA9IGU7XG4gICAgfVxuICAgIFxuICAgIC8vIHVucmVnaXN0ZXIgbGlzdGVuZXJcbiAgICBpZiAobGlzdGVuZXIpIGF3YWl0IHRoaXMucmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIFxuICAgIC8vIHRocm93IGVycm9yIG9yIHJldHVyblxuICAgIGlmIChlcnIpIHRocm93IGVycjtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIFxuICBhc3luYyBzdGFydFN5bmNpbmcoc3luY1BlcmlvZEluTXMpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzdGFydFN5bmNpbmdcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICAgIFxuICBhc3luYyBzdG9wU3luY2luZygpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzdG9wU3luY2luZ1wiKTtcbiAgfVxuICBcbiAgYXN5bmMgc2NhblR4cyh0eEhhc2hlcykge1xuICAgIGFzc2VydChBcnJheS5pc0FycmF5KHR4SGFzaGVzKSwgXCJNdXN0IHByb3ZpZGUgYW4gYXJyYXkgb2YgdHhzIGhhc2hlcyB0byBzY2FuXCIpO1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInNjYW5UeHNcIiwgW3R4SGFzaGVzXSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2NhblNwZW50KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInJlc2NhblNwZW50XCIpO1xuICB9XG4gICAgXG4gIGFzeW5jIHJlc2NhbkJsb2NrY2hhaW4oKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwicmVzY2FuQmxvY2tjaGFpblwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmFsYW5jZShhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSB7XG4gICAgcmV0dXJuIEJpZ0ludChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldEJhbGFuY2VcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFVubG9ja2VkQmFsYW5jZShhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSB7XG4gICAgbGV0IHVubG9ja2VkQmFsYW5jZVN0ciA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0VW5sb2NrZWRCYWxhbmNlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gICAgcmV0dXJuIEJpZ0ludCh1bmxvY2tlZEJhbGFuY2VTdHIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRBY2NvdW50cyhpbmNsdWRlU3ViYWRkcmVzc2VzLCB0YWcpIHtcbiAgICBsZXQgYWNjb3VudHMgPSBbXTtcbiAgICBmb3IgKGxldCBhY2NvdW50SnNvbiBvZiAoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRBY2NvdW50c1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKSkge1xuICAgICAgYWNjb3VudHMucHVzaChNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplQWNjb3VudChuZXcgTW9uZXJvQWNjb3VudChhY2NvdW50SnNvbikpKTtcbiAgICB9XG4gICAgcmV0dXJuIGFjY291bnRzO1xuICB9XG4gIFxuICBhc3luYyBnZXRBY2NvdW50KGFjY291bnRJZHgsIGluY2x1ZGVTdWJhZGRyZXNzZXMpIHtcbiAgICBsZXQgYWNjb3VudEpzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldEFjY291bnRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZUFjY291bnQobmV3IE1vbmVyb0FjY291bnQoYWNjb3VudEpzb24pKTtcbiAgfVxuICBcbiAgYXN5bmMgY3JlYXRlQWNjb3VudChsYWJlbCkge1xuICAgIGxldCBhY2NvdW50SnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiY3JlYXRlQWNjb3VudFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplQWNjb3VudChuZXcgTW9uZXJvQWNjb3VudChhY2NvdW50SnNvbikpO1xuICB9XG4gIFxuICBhc3luYyBnZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgc3ViYWRkcmVzc0luZGljZXMpIHtcbiAgICBsZXQgc3ViYWRkcmVzc2VzID0gW107XG4gICAgZm9yIChsZXQgc3ViYWRkcmVzc0pzb24gb2YgKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0U3ViYWRkcmVzc2VzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpKSB7XG4gICAgICBzdWJhZGRyZXNzZXMucHVzaChNb25lcm9XYWxsZXRLZXlzLnNhbml0aXplU3ViYWRkcmVzcyhuZXcgTW9uZXJvU3ViYWRkcmVzcyhzdWJhZGRyZXNzSnNvbikpKTtcbiAgICB9XG4gICAgcmV0dXJuIHN1YmFkZHJlc3NlcztcbiAgfVxuICBcbiAgYXN5bmMgY3JlYXRlU3ViYWRkcmVzcyhhY2NvdW50SWR4LCBsYWJlbCkge1xuICAgIGxldCBzdWJhZGRyZXNzSnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiY3JlYXRlU3ViYWRkcmVzc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRLZXlzLnNhbml0aXplU3ViYWRkcmVzcyhuZXcgTW9uZXJvU3ViYWRkcmVzcyhzdWJhZGRyZXNzSnNvbikpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeHMocXVlcnkpIHtcbiAgICBxdWVyeSA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVUeFF1ZXJ5KHF1ZXJ5KTtcbiAgICBsZXQgcmVzcEpzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldFR4c1wiLCBbcXVlcnkuZ2V0QmxvY2soKS50b0pzb24oKV0pO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplVHhzKHF1ZXJ5LCBKU09OLnN0cmluZ2lmeSh7YmxvY2tzOiByZXNwSnNvbi5ibG9ja3N9KSk7IC8vIGluaXRpYWxpemUgdHhzIGZyb20gYmxvY2tzIGpzb24gc3RyaW5nIFRPRE86IHRoaXMgc3RyaW5naWZpZXMgdGhlbiB1dGlsaXR5IHBhcnNlcywgYXZvaWRcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHJhbnNmZXJzKHF1ZXJ5KSB7XG4gICAgcXVlcnkgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplVHJhbnNmZXJRdWVyeShxdWVyeSk7XG4gICAgbGV0IGJsb2NrSnNvbnMgPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldFRyYW5zZmVyc1wiLCBbcXVlcnkuZ2V0VHhRdWVyeSgpLmdldEJsb2NrKCkudG9Kc29uKCldKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZVRyYW5zZmVycyhxdWVyeSwgSlNPTi5zdHJpbmdpZnkoe2Jsb2NrczogYmxvY2tKc29uc30pKTsgLy8gaW5pdGlhbGl6ZSB0cmFuc2ZlcnMgZnJvbSBibG9ja3MganNvbiBzdHJpbmcgVE9ETzogdGhpcyBzdHJpbmdpZmllcyB0aGVuIHV0aWxpdHkgcGFyc2VzLCBhdm9pZFxuICB9XG4gIFxuICBhc3luYyBnZXRPdXRwdXRzKHF1ZXJ5KSB7XG4gICAgcXVlcnkgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplT3V0cHV0UXVlcnkocXVlcnkpO1xuICAgIGxldCBibG9ja0pzb25zID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRPdXRwdXRzXCIsIFtxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0QmxvY2soKS50b0pzb24oKV0pO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplT3V0cHV0cyhxdWVyeSwgSlNPTi5zdHJpbmdpZnkoe2Jsb2NrczogYmxvY2tKc29uc30pKTsgLy8gaW5pdGlhbGl6ZSB0cmFuc2ZlcnMgZnJvbSBibG9ja3MganNvbiBzdHJpbmcgVE9ETzogdGhpcyBzdHJpbmdpZmllcyB0aGVuIHV0aWxpdHkgcGFyc2VzLCBhdm9pZFxuICB9XG4gIFxuICBhc3luYyBleHBvcnRPdXRwdXRzKGFsbCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImV4cG9ydE91dHB1dHNcIiwgW2FsbF0pO1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRPdXRwdXRzKG91dHB1dHNIZXgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJpbXBvcnRPdXRwdXRzXCIsIFtvdXRwdXRzSGV4XSk7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydEtleUltYWdlcyhhbGwpIHtcbiAgICBsZXQga2V5SW1hZ2VzID0gW107XG4gICAgZm9yIChsZXQga2V5SW1hZ2VKc29uIG9mIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0S2V5SW1hZ2VzXCIsIFthbGxdKSkga2V5SW1hZ2VzLnB1c2gobmV3IE1vbmVyb0tleUltYWdlKGtleUltYWdlSnNvbikpO1xuICAgIHJldHVybiBrZXlJbWFnZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGltcG9ydEtleUltYWdlcyhrZXlJbWFnZXMpIHtcbiAgICBsZXQga2V5SW1hZ2VzSnNvbiA9IFtdO1xuICAgIGZvciAobGV0IGtleUltYWdlIG9mIGtleUltYWdlcykga2V5SW1hZ2VzSnNvbi5wdXNoKGtleUltYWdlLnRvSnNvbigpKTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiaW1wb3J0S2V5SW1hZ2VzXCIsIFtrZXlJbWFnZXNKc29uXSkpO1xuICB9XG4gIFxuICBhc3luYyBnZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCgpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNb25lcm9XYWxsZXRGdWxsLmdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0KCkgbm90IGltcGxlbWVudGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBmcmVlemVPdXRwdXQoa2V5SW1hZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJmcmVlemVPdXRwdXRcIiwgW2tleUltYWdlXSk7XG4gIH1cbiAgXG4gIGFzeW5jIHRoYXdPdXRwdXQoa2V5SW1hZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJ0aGF3T3V0cHV0XCIsIFtrZXlJbWFnZV0pO1xuICB9XG4gIFxuICBhc3luYyBpc091dHB1dEZyb3plbihrZXlJbWFnZSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImlzT3V0cHV0RnJvemVuXCIsIFtrZXlJbWFnZV0pO1xuICB9XG4gIFxuICBhc3luYyBjcmVhdGVUeHMoY29uZmlnKSB7XG4gICAgY29uZmlnID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyhjb25maWcpO1xuICAgIGxldCB0eFNldEpzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImNyZWF0ZVR4c1wiLCBbY29uZmlnLnRvSnNvbigpXSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9UeFNldCh0eFNldEpzb24pLmdldFR4cygpO1xuICB9XG4gIFxuICBhc3luYyBzd2VlcE91dHB1dChjb25maWcpIHtcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplU3dlZXBPdXRwdXRDb25maWcoY29uZmlnKTtcbiAgICBsZXQgdHhTZXRKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJzd2VlcE91dHB1dFwiLCBbY29uZmlnLnRvSnNvbigpXSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9UeFNldCh0eFNldEpzb24pLmdldFR4cygpWzBdO1xuICB9XG5cbiAgYXN5bmMgc3dlZXBVbmxvY2tlZChjb25maWcpIHtcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplU3dlZXBVbmxvY2tlZENvbmZpZyhjb25maWcpO1xuICAgIGxldCB0eFNldHNKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJzd2VlcFVubG9ja2VkXCIsIFtjb25maWcudG9Kc29uKCldKTtcbiAgICBsZXQgdHhzID0gW107XG4gICAgZm9yIChsZXQgdHhTZXRKc29uIG9mIHR4U2V0c0pzb24pIGZvciAobGV0IHR4IG9mIG5ldyBNb25lcm9UeFNldCh0eFNldEpzb24pLmdldFR4cygpKSB0eHMucHVzaCh0eCk7XG4gICAgcmV0dXJuIHR4cztcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBEdXN0KHJlbGF5KSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9UeFNldChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInN3ZWVwRHVzdFwiLCBbcmVsYXldKSkuZ2V0VHhzKCkgfHwgW107XG4gIH1cbiAgXG4gIGFzeW5jIHJlbGF5VHhzKHR4c09yTWV0YWRhdGFzKSB7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkodHhzT3JNZXRhZGF0YXMpLCBcIk11c3QgcHJvdmlkZSBhbiBhcnJheSBvZiB0eHMgb3IgdGhlaXIgbWV0YWRhdGEgdG8gcmVsYXlcIik7XG4gICAgbGV0IHR4TWV0YWRhdGFzID0gW107XG4gICAgZm9yIChsZXQgdHhPck1ldGFkYXRhIG9mIHR4c09yTWV0YWRhdGFzKSB0eE1ldGFkYXRhcy5wdXNoKHR4T3JNZXRhZGF0YSBpbnN0YW5jZW9mIE1vbmVyb1R4V2FsbGV0ID8gdHhPck1ldGFkYXRhLmdldE1ldGFkYXRhKCkgOiB0eE9yTWV0YWRhdGEpO1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInJlbGF5VHhzXCIsIFt0eE1ldGFkYXRhc10pO1xuICB9XG4gIFxuICBhc3luYyBkZXNjcmliZVR4U2V0KHR4U2V0KSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9UeFNldChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRlc2NyaWJlVHhTZXRcIiwgW3R4U2V0LnRvSnNvbigpXSkpO1xuICB9XG4gIFxuICBhc3luYyBzaWduVHhzKHVuc2lnbmVkVHhIZXgpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1R4U2V0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwic2lnblR4c1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgc3VibWl0VHhzKHNpZ25lZFR4SGV4KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic3VibWl0VHhzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNpZ25NZXNzYWdlKG1lc3NhZ2UsIHNpZ25hdHVyZVR5cGUsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzaWduTWVzc2FnZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyB2ZXJpZnlNZXNzYWdlKG1lc3NhZ2UsIGFkZHJlc3MsIHNpZ25hdHVyZSkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInZlcmlmeU1lc3NhZ2VcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4S2V5KHR4SGFzaCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldFR4S2V5XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrVHhLZXkodHhIYXNoLCB0eEtleSwgYWRkcmVzcykge1xuICAgIHJldHVybiBuZXcgTW9uZXJvQ2hlY2tUeChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImNoZWNrVHhLZXlcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4UHJvb2YodHhIYXNoLCBhZGRyZXNzLCBtZXNzYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0VHhQcm9vZlwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBjaGVja1R4UHJvb2YodHhIYXNoLCBhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0NoZWNrVHgoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJjaGVja1R4UHJvb2ZcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFNwZW5kUHJvb2YodHhIYXNoLCBtZXNzYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0U3BlbmRQcm9vZlwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBjaGVja1NwZW5kUHJvb2YodHhIYXNoLCBtZXNzYWdlLCBzaWduYXR1cmUpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJjaGVja1NwZW5kUHJvb2ZcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UmVzZXJ2ZVByb29mV2FsbGV0KG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRSZXNlcnZlUHJvb2ZXYWxsZXRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UmVzZXJ2ZVByb29mQWNjb3VudChhY2NvdW50SWR4LCBhbW91bnQsIG1lc3NhZ2UpIHtcbiAgICB0cnkgeyByZXR1cm4gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRSZXNlcnZlUHJvb2ZBY2NvdW50XCIsIFthY2NvdW50SWR4LCBhbW91bnQudG9TdHJpbmcoKSwgbWVzc2FnZV0pOyB9XG4gICAgY2F0Y2ggKGU6IGFueSkgeyB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZS5tZXNzYWdlLCAtMSk7IH1cbiAgfVxuXG4gIGFzeW5jIGNoZWNrUmVzZXJ2ZVByb29mKGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSkge1xuICAgIHRyeSB7IHJldHVybiBuZXcgTW9uZXJvQ2hlY2tSZXNlcnZlKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiY2hlY2tSZXNlcnZlUHJvb2ZcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7IH1cbiAgICBjYXRjaCAoZTogYW55KSB7IHRocm93IG5ldyBNb25lcm9FcnJvcihlLm1lc3NhZ2UsIC0xKTsgfVxuICB9XG4gIFxuICBhc3luYyBnZXRUeE5vdGVzKHR4SGFzaGVzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0VHhOb3Rlc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBzZXRUeE5vdGVzKHR4SGFzaGVzLCBub3Rlcykge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInNldFR4Tm90ZXNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzKGVudHJ5SW5kaWNlcykge1xuICAgIGlmICghZW50cnlJbmRpY2VzKSBlbnRyeUluZGljZXMgPSBbXTtcbiAgICBsZXQgZW50cmllcyA9IFtdO1xuICAgIGZvciAobGV0IGVudHJ5SnNvbiBvZiBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldEFkZHJlc3NCb29rRW50cmllc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKSB7XG4gICAgICBlbnRyaWVzLnB1c2gobmV3IE1vbmVyb0FkZHJlc3NCb29rRW50cnkoZW50cnlKc29uKSk7XG4gICAgfVxuICAgIHJldHVybiBlbnRyaWVzO1xuICB9XG4gIFxuICBhc3luYyBhZGRBZGRyZXNzQm9va0VudHJ5KGFkZHJlc3MsIGRlc2NyaXB0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiYWRkQWRkcmVzc0Jvb2tFbnRyeVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBlZGl0QWRkcmVzc0Jvb2tFbnRyeShpbmRleCwgc2V0QWRkcmVzcywgYWRkcmVzcywgc2V0RGVzY3JpcHRpb24sIGRlc2NyaXB0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZWRpdEFkZHJlc3NCb29rRW50cnlcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeShlbnRyeUlkeCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRlbGV0ZUFkZHJlc3NCb29rRW50cnlcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgdGFnQWNjb3VudHModGFnLCBhY2NvdW50SW5kaWNlcykge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInRhZ0FjY291bnRzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cblxuICBhc3luYyB1bnRhZ0FjY291bnRzKGFjY291bnRJbmRpY2VzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwidW50YWdBY2NvdW50c1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRBY2NvdW50VGFncygpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRBY2NvdW50VGFnc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG5cbiAgYXN5bmMgc2V0QWNjb3VudFRhZ0xhYmVsKHRhZywgbGFiZWwpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzZXRBY2NvdW50VGFnTGFiZWxcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGF5bWVudFVyaShjb25maWcpIHtcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnKGNvbmZpZyk7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0UGF5bWVudFVyaVwiLCBbY29uZmlnLnRvSnNvbigpXSk7XG4gIH1cbiAgXG4gIGFzeW5jIHBhcnNlUGF5bWVudFVyaSh1cmkpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1R4Q29uZmlnKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwicGFyc2VQYXltZW50VXJpXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBnZXRBdHRyaWJ1dGUoa2V5KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0QXR0cmlidXRlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNldEF0dHJpYnV0ZShrZXksIHZhbCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInNldEF0dHJpYnV0ZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBzdGFydE1pbmluZyhudW1UaHJlYWRzLCBiYWNrZ3JvdW5kTWluaW5nLCBpZ25vcmVCYXR0ZXJ5KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic3RhcnRNaW5pbmdcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgc3RvcE1pbmluZygpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzdG9wTWluaW5nXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzTXVsdGlzaWdJbXBvcnROZWVkZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNNdWx0aXNpZygpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJpc011bHRpc2lnXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRNdWx0aXNpZ0luZm8oKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9NdWx0aXNpZ0luZm8oYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRNdWx0aXNpZ0luZm9cIikpO1xuICB9XG4gIFxuICBhc3luYyBwcmVwYXJlTXVsdGlzaWcoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwicHJlcGFyZU11bHRpc2lnXCIpO1xuICB9XG4gIFxuICBhc3luYyBtYWtlTXVsdGlzaWcobXVsdGlzaWdIZXhlcywgdGhyZXNob2xkLCBwYXNzd29yZCkge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcIm1ha2VNdWx0aXNpZ1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBleGNoYW5nZU11bHRpc2lnS2V5cyhtdWx0aXNpZ0hleGVzLCBwYXNzd29yZCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZXhjaGFuZ2VNdWx0aXNpZ0tleXNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydE11bHRpc2lnSGV4KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImV4cG9ydE11bHRpc2lnSGV4XCIpO1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRNdWx0aXNpZ0hleChtdWx0aXNpZ0hleGVzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaW1wb3J0TXVsdGlzaWdIZXhcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgc2lnbk11bHRpc2lnVHhIZXgobXVsdGlzaWdUeEhleCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwic2lnbk11bHRpc2lnVHhIZXhcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdE11bHRpc2lnVHhIZXgoc2lnbmVkTXVsdGlzaWdUeEhleCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInN1Ym1pdE11bHRpc2lnVHhIZXhcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RGF0YSgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXREYXRhXCIpO1xuICB9XG4gIFxuICBhc3luYyBtb3ZlVG8ocGF0aCkge1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLm1vdmVUbyhwYXRoLCB0aGlzKTtcbiAgfVxuICBcbiAgYXN5bmMgY2hhbmdlUGFzc3dvcmQob2xkUGFzc3dvcmQsIG5ld1Bhc3N3b3JkKSB7XG4gICAgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJjaGFuZ2VQYXNzd29yZFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIGlmICh0aGlzLnBhdGgpIGF3YWl0IHRoaXMuc2F2ZSgpOyAvLyBhdXRvIHNhdmVcbiAgfVxuICBcbiAgYXN5bmMgc2F2ZSgpIHtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5zYXZlKHRoaXMpO1xuICB9XG5cbiAgYXN5bmMgY2xvc2Uoc2F2ZSkge1xuICAgIGlmIChhd2FpdCB0aGlzLmlzQ2xvc2VkKCkpIHJldHVybjtcbiAgICBpZiAoc2F2ZSkgYXdhaXQgdGhpcy5zYXZlKCk7XG4gICAgd2hpbGUgKHRoaXMud3JhcHBlZExpc3RlbmVycy5sZW5ndGgpIGF3YWl0IHRoaXMucmVtb3ZlTGlzdGVuZXIodGhpcy53cmFwcGVkTGlzdGVuZXJzWzBdLmdldExpc3RlbmVyKCkpO1xuICAgIGF3YWl0IHN1cGVyLmNsb3NlKGZhbHNlKTtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBMSVNURU5JTkcgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8qKlxuICogUmVjZWl2ZXMgbm90aWZpY2F0aW9ucyBkaXJlY3RseSBmcm9tIHdhc20gYysrLlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBXYWxsZXRXYXNtTGlzdGVuZXIge1xuXG4gIHByb3RlY3RlZCB3YWxsZXQ6IE1vbmVyb1dhbGxldDtcbiAgXG4gIGNvbnN0cnVjdG9yKHdhbGxldCkge1xuICAgIHRoaXMud2FsbGV0ID0gd2FsbGV0O1xuICB9XG4gIFxuICBhc3luYyBvblN5bmNQcm9ncmVzcyhoZWlnaHQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIHBlcmNlbnREb25lLCBtZXNzYWdlKSB7XG4gICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VTeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSk7XG4gIH1cbiAgXG4gIGFzeW5jIG9uTmV3QmxvY2soaGVpZ2h0KSB7XG4gICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VOZXdCbG9jayhoZWlnaHQpO1xuICB9XG4gIFxuICBhc3luYyBvbkJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlU3RyLCBuZXdVbmxvY2tlZEJhbGFuY2VTdHIpIHtcbiAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZUJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlU3RyLCBuZXdVbmxvY2tlZEJhbGFuY2VTdHIpO1xuICB9XG4gIFxuICBhc3luYyBvbk91dHB1dFJlY2VpdmVkKGhlaWdodCwgdHhIYXNoLCBhbW91bnRTdHIsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIHZlcnNpb24sIHVubG9ja1RpbWUsIGlzTG9ja2VkKSB7XG4gICAgXG4gICAgLy8gYnVpbGQgcmVjZWl2ZWQgb3V0cHV0XG4gICAgbGV0IG91dHB1dCA9IG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKTtcbiAgICBvdXRwdXQuc2V0QW1vdW50KEJpZ0ludChhbW91bnRTdHIpKTtcbiAgICBvdXRwdXQuc2V0QWNjb3VudEluZGV4KGFjY291bnRJZHgpO1xuICAgIG91dHB1dC5zZXRTdWJhZGRyZXNzSW5kZXgoc3ViYWRkcmVzc0lkeCk7XG4gICAgbGV0IHR4ID0gbmV3IE1vbmVyb1R4V2FsbGV0KCk7XG4gICAgdHguc2V0SGFzaCh0eEhhc2gpO1xuICAgIHR4LnNldFZlcnNpb24odmVyc2lvbik7XG4gICAgdHguc2V0VW5sb2NrVGltZSh1bmxvY2tUaW1lKTtcbiAgICBvdXRwdXQuc2V0VHgodHgpO1xuICAgIHR4LnNldE91dHB1dHMoW291dHB1dF0pO1xuICAgIHR4LnNldElzSW5jb21pbmcodHJ1ZSk7XG4gICAgdHguc2V0SXNMb2NrZWQoaXNMb2NrZWQpO1xuICAgIGlmIChoZWlnaHQgPiAwKSB7XG4gICAgICBsZXQgYmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soKS5zZXRIZWlnaHQoaGVpZ2h0KTtcbiAgICAgIGJsb2NrLnNldFR4cyhbdHggYXMgTW9uZXJvVHhdKTtcbiAgICAgIHR4LnNldEJsb2NrKGJsb2NrKTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbCh0cnVlKTtcbiAgICB9XG4gICAgXG4gICAgLy8gYW5ub3VuY2Ugb3V0cHV0XG4gICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VPdXRwdXRSZWNlaXZlZChvdXRwdXQpO1xuICB9XG4gIFxuICBhc3luYyBvbk91dHB1dFNwZW50KGhlaWdodCwgdHhIYXNoLCBhbW91bnRTdHIsIGFjY291bnRJZHhTdHIsIHN1YmFkZHJlc3NJZHhTdHIsIHZlcnNpb24sIHVubG9ja1RpbWUsIGlzTG9ja2VkKSB7XG4gICAgXG4gICAgLy8gYnVpbGQgc3BlbnQgb3V0cHV0XG4gICAgbGV0IG91dHB1dCA9IG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKTtcbiAgICBvdXRwdXQuc2V0QW1vdW50KEJpZ0ludChhbW91bnRTdHIpKTtcbiAgICBpZiAoYWNjb3VudElkeFN0cikgb3V0cHV0LnNldEFjY291bnRJbmRleChwYXJzZUludChhY2NvdW50SWR4U3RyKSk7XG4gICAgaWYgKHN1YmFkZHJlc3NJZHhTdHIpIG91dHB1dC5zZXRTdWJhZGRyZXNzSW5kZXgocGFyc2VJbnQoc3ViYWRkcmVzc0lkeFN0cikpO1xuICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgIHR4LnNldEhhc2godHhIYXNoKTtcbiAgICB0eC5zZXRWZXJzaW9uKHZlcnNpb24pO1xuICAgIHR4LnNldFVubG9ja1RpbWUodW5sb2NrVGltZSk7XG4gICAgdHguc2V0SXNMb2NrZWQoaXNMb2NrZWQpO1xuICAgIG91dHB1dC5zZXRUeCh0eCk7XG4gICAgdHguc2V0SW5wdXRzKFtvdXRwdXRdKTtcbiAgICBpZiAoaGVpZ2h0ID4gMCkge1xuICAgICAgbGV0IGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0SGVpZ2h0KGhlaWdodCk7XG4gICAgICBibG9jay5zZXRUeHMoW3R4XSk7XG4gICAgICB0eC5zZXRCbG9jayhibG9jayk7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SW5UeFBvb2wodHJ1ZSk7XG4gICAgfVxuICAgIFxuICAgIC8vIGFubm91bmNlIG91dHB1dFxuICAgIGF3YWl0IHRoaXMud2FsbGV0LmFubm91bmNlT3V0cHV0U3BlbnQob3V0cHV0KTtcbiAgfVxufVxuXG4vKipcbiAqIEludGVybmFsIGxpc3RlbmVyIHRvIGJyaWRnZSBub3RpZmljYXRpb25zIHRvIGV4dGVybmFsIGxpc3RlbmVycy5cbiAqIFxuICogQHByaXZhdGVcbiAqL1xuY2xhc3MgV2FsbGV0V29ya2VyTGlzdGVuZXIge1xuXG4gIHByb3RlY3RlZCBpZDogYW55O1xuICBwcm90ZWN0ZWQgbGlzdGVuZXI6IGFueTtcbiAgXG4gIGNvbnN0cnVjdG9yKGxpc3RlbmVyKSB7XG4gICAgdGhpcy5pZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICB0aGlzLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIH1cbiAgXG4gIGdldElkKCkge1xuICAgIHJldHVybiB0aGlzLmlkO1xuICB9XG4gIFxuICBnZXRMaXN0ZW5lcigpIHtcbiAgICByZXR1cm4gdGhpcy5saXN0ZW5lcjtcbiAgfVxuICBcbiAgb25TeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSkge1xuICAgIHRoaXMubGlzdGVuZXIub25TeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSk7XG4gIH1cblxuICBhc3luYyBvbk5ld0Jsb2NrKGhlaWdodCkge1xuICAgIGF3YWl0IHRoaXMubGlzdGVuZXIub25OZXdCbG9jayhoZWlnaHQpO1xuICB9XG4gIFxuICBhc3luYyBvbkJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlU3RyLCBuZXdVbmxvY2tlZEJhbGFuY2VTdHIpIHtcbiAgICBhd2FpdCB0aGlzLmxpc3RlbmVyLm9uQmFsYW5jZXNDaGFuZ2VkKEJpZ0ludChuZXdCYWxhbmNlU3RyKSwgQmlnSW50KG5ld1VubG9ja2VkQmFsYW5jZVN0cikpO1xuICB9XG5cbiAgYXN5bmMgb25PdXRwdXRSZWNlaXZlZChibG9ja0pzb24pIHtcbiAgICBsZXQgYmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uLCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYX1dBTExFVCk7XG4gICAgYXdhaXQgdGhpcy5saXN0ZW5lci5vbk91dHB1dFJlY2VpdmVkKGJsb2NrLmdldFR4cygpWzBdLmdldE91dHB1dHMoKVswXSk7XG4gIH1cbiAgXG4gIGFzeW5jIG9uT3V0cHV0U3BlbnQoYmxvY2tKc29uKSB7XG4gICAgbGV0IGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWF9XQUxMRVQpO1xuICAgIGF3YWl0IHRoaXMubGlzdGVuZXIub25PdXRwdXRTcGVudChibG9jay5nZXRUeHMoKVswXS5nZXRJbnB1dHMoKVswXSk7XG4gIH1cbn1cbiJdLCJt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