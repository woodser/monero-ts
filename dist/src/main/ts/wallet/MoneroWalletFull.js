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
var _memfs = _interopRequireDefault(require("memfs"));

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
   * @param {any} fs - file system compatible with Node.js `fs.promises` API (defaults to disk or in-memory FS if browser)
   * @return {boolean} true if a wallet exists at the given path, false otherwise
   */
  static async walletExists(path, fs) {
    (0, _assert.default)(path, "Must provide a path to look for a wallet");
    if (!fs) fs = MoneroWalletFull.getFs();
    if (!fs) throw new _MoneroError.default("Must provide file system to check if wallet exists");
    let exists = await _LibraryUtils.default.exists(fs, path + ".keys");
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
    if (config.getFs() === undefined) config.setFs(MoneroWalletFull.getFs());

    // set server from connection manager if provided
    if (config.getConnectionManager()) {
      if (config.getServer()) throw new _MoneroError.default("Wallet can be opened with a server or connection manager but not both");
      config.setServer(config.getConnectionManager().getConnection());
    }

    // read wallet data from disk unless provided
    if (!config.getKeysData()) {
      let fs = config.getFs();
      if (!fs) throw new _MoneroError.default("Must provide file system to read wallet data from");
      if (!(await this.walletExists(config.getPath(), fs))) throw new _MoneroError.default("Wallet does not exist at path: " + config.getPath());
      config.setKeysData(await fs.readFile(config.getPath() + ".keys"));
      config.setCacheData((await _LibraryUtils.default.exists(fs, config.getPath())) ? await fs.readFile(config.getPath()) : "");
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
    if (config.getPath() && (await MoneroWalletFull.walletExists(config.getPath(), config.getFs()))) throw new _MoneroError.default("Wallet already exists: " + config.getPath());
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
    if (!MoneroWalletFull.FS) MoneroWalletFull.FS = _GenUtils.default.isBrowser() ? _memfs.default.fs.promises : _fs.default.promises;
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
          resolve(new MoneroWalletFull(cppAddress, config.path, config.password, config.fs, rejectUnauthorized, rejectUnauthorizedFnId));
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

    // save and return if same path
    if (_path.default.normalize(wallet.path) === _path.default.normalize(path)) {
      return wallet.save();
    }

    return _LibraryUtils.default.queueTask(async () => {
      if (await wallet.isClosed()) throw new _MoneroError.default("Wallet is closed");
      if (!path) throw new _MoneroError.default("Must provide path of destination wallet");

      // create destination directory if it doesn't exist
      let walletDir = _path.default.dirname(path);
      if (!(await _LibraryUtils.default.exists(wallet.fs, walletDir))) {
        try {await wallet.fs.mkdir(walletDir);}
        catch (err) {throw new _MoneroError.default("Destination path " + path + " does not exist and cannot be created: " + err.message);}
      }

      // get wallet data
      const data = await wallet.getData();

      // write wallet files
      await wallet.fs.writeFile(path + ".keys", data[0], "binary");
      await wallet.fs.writeFile(path, data[1], "binary");
      await wallet.fs.writeFile(path + ".address.txt", await wallet.getPrimaryAddress());
      let oldPath = wallet.path;
      wallet.path = path;

      // delete old wallet files
      if (oldPath) {
        await wallet.fs.unlink(oldPath + ".address.txt");
        await wallet.fs.unlink(oldPath + ".keys");
        await wallet.fs.unlink(oldPath);
      }
    });
  }

  static async save(wallet) {
    return _LibraryUtils.default.queueTask(async () => {
      if (await wallet.isClosed()) throw new _MoneroError.default("Wallet is closed");

      // path must be set
      let path = await wallet.getPath();
      if (!path) throw new _MoneroError.default("Cannot save wallet because path is not set");

      // get wallet data
      const data = await wallet.getData();

      // write wallet files to *.new
      let pathNew = path + ".new";
      await wallet.fs.writeFile(pathNew + ".keys", data[0], "binary");
      await wallet.fs.writeFile(pathNew, data[1], "binary");
      await wallet.fs.writeFile(pathNew + ".address.txt", await wallet.getPrimaryAddress());

      // replace old wallet files with new
      await wallet.fs.rename(pathNew + ".keys", path + ".keys");
      await wallet.fs.rename(pathNew, path);
      await wallet.fs.rename(pathNew + ".address.txt", path + ".address.txt");
    });
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
    if (config.getPath() && (await MoneroWalletFull.walletExists(config.getPath(), config.getFs()))) throw new _MoneroError.default("Wallet already exists: " + config.getPath());
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfcGF0aCIsIl9HZW5VdGlscyIsIl9MaWJyYXJ5VXRpbHMiLCJfVGFza0xvb3BlciIsIl9Nb25lcm9BY2NvdW50IiwiX01vbmVyb0FjY291bnRUYWciLCJfTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSIsIl9Nb25lcm9CbG9jayIsIl9Nb25lcm9DaGVja1R4IiwiX01vbmVyb0NoZWNrUmVzZXJ2ZSIsIl9Nb25lcm9EYWVtb25ScGMiLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MiLCJfTW9uZXJvS2V5SW1hZ2UiLCJfTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQiLCJfTW9uZXJvTXVsdGlzaWdJbmZvIiwiX01vbmVyb011bHRpc2lnSW5pdFJlc3VsdCIsIl9Nb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQiLCJfTW9uZXJvTmV0d29ya1R5cGUiLCJfTW9uZXJvT3V0cHV0V2FsbGV0IiwiX01vbmVyb1JwY0Nvbm5lY3Rpb24iLCJfTW9uZXJvU3ViYWRkcmVzcyIsIl9Nb25lcm9TeW5jUmVzdWx0IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4U2V0IiwiX01vbmVyb1R4V2FsbGV0IiwiX01vbmVyb1dhbGxldCIsIl9Nb25lcm9XYWxsZXRDb25maWciLCJfTW9uZXJvV2FsbGV0S2V5cyIsIl9Nb25lcm9XYWxsZXRMaXN0ZW5lciIsIl9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIl9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0IiwiX2ZzIiwiX21lbWZzIiwiTW9uZXJvV2FsbGV0RnVsbCIsIk1vbmVyb1dhbGxldEtleXMiLCJERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TIiwiY29uc3RydWN0b3IiLCJjcHBBZGRyZXNzIiwicGF0aCIsInBhc3N3b3JkIiwiZnMiLCJyZWplY3RVbmF1dGhvcml6ZWQiLCJyZWplY3RVbmF1dGhvcml6ZWRGbklkIiwid2FsbGV0UHJveHkiLCJsaXN0ZW5lcnMiLCJnZXRGcyIsInVuZGVmaW5lZCIsIl9pc0Nsb3NlZCIsIndhc21MaXN0ZW5lciIsIldhbGxldFdhc21MaXN0ZW5lciIsIndhc21MaXN0ZW5lckhhbmRsZSIsInJlamVjdFVuYXV0aG9yaXplZENvbmZpZ0lkIiwic3luY1BlcmlvZEluTXMiLCJMaWJyYXJ5VXRpbHMiLCJzZXRSZWplY3RVbmF1dGhvcml6ZWRGbiIsIndhbGxldEV4aXN0cyIsImFzc2VydCIsIk1vbmVyb0Vycm9yIiwiZXhpc3RzIiwibG9nIiwib3BlbldhbGxldCIsImNvbmZpZyIsIk1vbmVyb1dhbGxldENvbmZpZyIsImdldFByb3h5VG9Xb3JrZXIiLCJzZXRQcm94eVRvV29ya2VyIiwiZ2V0U2VlZCIsImdldFNlZWRPZmZzZXQiLCJnZXRQcmltYXJ5QWRkcmVzcyIsImdldFByaXZhdGVWaWV3S2V5IiwiZ2V0UHJpdmF0ZVNwZW5kS2V5IiwiZ2V0UmVzdG9yZUhlaWdodCIsImdldExhbmd1YWdlIiwiZ2V0U2F2ZUN1cnJlbnQiLCJzZXRGcyIsImdldENvbm5lY3Rpb25NYW5hZ2VyIiwiZ2V0U2VydmVyIiwic2V0U2VydmVyIiwiZ2V0Q29ubmVjdGlvbiIsImdldEtleXNEYXRhIiwiZ2V0UGF0aCIsInNldEtleXNEYXRhIiwicmVhZEZpbGUiLCJzZXRDYWNoZURhdGEiLCJ3YWxsZXQiLCJvcGVuV2FsbGV0RGF0YSIsInNldENvbm5lY3Rpb25NYW5hZ2VyIiwiY3JlYXRlV2FsbGV0IiwiZ2V0TmV0d29ya1R5cGUiLCJNb25lcm9OZXR3b3JrVHlwZSIsInZhbGlkYXRlIiwic2V0UGF0aCIsImdldFBhc3N3b3JkIiwic2V0UGFzc3dvcmQiLCJNb25lcm9XYWxsZXRGdWxsUHJveHkiLCJjcmVhdGVXYWxsZXRGcm9tU2VlZCIsImNyZWF0ZVdhbGxldEZyb21LZXlzIiwiY3JlYXRlV2FsbGV0UmFuZG9tIiwiZGFlbW9uQ29ubmVjdGlvbiIsImdldFJlamVjdFVuYXV0aG9yaXplZCIsInNldFJlc3RvcmVIZWlnaHQiLCJzZXRTZWVkT2Zmc2V0IiwibW9kdWxlIiwibG9hZEZ1bGxNb2R1bGUiLCJxdWV1ZVRhc2siLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsIkdlblV0aWxzIiwiZ2V0VVVJRCIsImNyZWF0ZV9mdWxsX3dhbGxldCIsIkpTT04iLCJzdHJpbmdpZnkiLCJ0b0pzb24iLCJzYXZlIiwic2V0UHJpbWFyeUFkZHJlc3MiLCJzZXRQcml2YXRlVmlld0tleSIsInNldFByaXZhdGVTcGVuZEtleSIsInNldExhbmd1YWdlIiwiZ2V0U2VlZExhbmd1YWdlcyIsInBhcnNlIiwiZ2V0X2tleXNfd2FsbGV0X3NlZWRfbGFuZ3VhZ2VzIiwibGFuZ3VhZ2VzIiwiRlMiLCJpc0Jyb3dzZXIiLCJtZW1mcyIsInByb21pc2VzIiwiZ2V0RGFlbW9uTWF4UGVlckhlaWdodCIsImdldFdhbGxldFByb3h5IiwiYXNzZXJ0Tm90Q2xvc2VkIiwiZ2V0X2RhZW1vbl9tYXhfcGVlcl9oZWlnaHQiLCJyZXNwIiwiaXNEYWVtb25TeW5jZWQiLCJpc19kYWVtb25fc3luY2VkIiwiaXNTeW5jZWQiLCJpc19zeW5jZWQiLCJnZXRfbmV0d29ya190eXBlIiwiZ2V0X3Jlc3RvcmVfaGVpZ2h0IiwicmVzdG9yZUhlaWdodCIsInNldF9yZXN0b3JlX2hlaWdodCIsIm1vdmVUbyIsImFkZExpc3RlbmVyIiwibGlzdGVuZXIiLCJyZWZyZXNoTGlzdGVuaW5nIiwicmVtb3ZlTGlzdGVuZXIiLCJnZXRMaXN0ZW5lcnMiLCJzZXREYWVtb25Db25uZWN0aW9uIiwidXJpT3JDb25uZWN0aW9uIiwiY29ubmVjdGlvbiIsIk1vbmVyb1JwY0Nvbm5lY3Rpb24iLCJ1cmkiLCJnZXRVcmkiLCJ1c2VybmFtZSIsImdldFVzZXJuYW1lIiwic2V0X2RhZW1vbl9jb25uZWN0aW9uIiwiZ2V0RGFlbW9uQ29ubmVjdGlvbiIsImNvbm5lY3Rpb25Db250YWluZXJTdHIiLCJnZXRfZGFlbW9uX2Nvbm5lY3Rpb24iLCJqc29uQ29ubmVjdGlvbiIsImlzQ29ubmVjdGVkVG9EYWVtb24iLCJpc19jb25uZWN0ZWRfdG9fZGFlbW9uIiwiZ2V0VmVyc2lvbiIsImdldEludGVncmF0ZWRBZGRyZXNzIiwic3RhbmRhcmRBZGRyZXNzIiwicGF5bWVudElkIiwicmVzdWx0IiwiZ2V0X2ludGVncmF0ZWRfYWRkcmVzcyIsImNoYXJBdCIsIk1vbmVyb0ludGVncmF0ZWRBZGRyZXNzIiwiZXJyIiwibWVzc2FnZSIsImluY2x1ZGVzIiwiZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MiLCJpbnRlZ3JhdGVkQWRkcmVzcyIsImRlY29kZV9pbnRlZ3JhdGVkX2FkZHJlc3MiLCJnZXRIZWlnaHQiLCJnZXRfaGVpZ2h0IiwiZ2V0RGFlbW9uSGVpZ2h0IiwiZ2V0X2RhZW1vbl9oZWlnaHQiLCJnZXRIZWlnaHRCeURhdGUiLCJ5ZWFyIiwibW9udGgiLCJkYXkiLCJnZXRfaGVpZ2h0X2J5X2RhdGUiLCJzeW5jIiwibGlzdGVuZXJPclN0YXJ0SGVpZ2h0Iiwic3RhcnRIZWlnaHQiLCJhbGxvd0NvbmN1cnJlbnRDYWxscyIsIk1vbmVyb1dhbGxldExpc3RlbmVyIiwiTWF0aCIsIm1heCIsInRoYXQiLCJzeW5jV2FzbSIsInJlc3BKc29uIiwiTW9uZXJvU3luY1Jlc3VsdCIsIm51bUJsb2Nrc0ZldGNoZWQiLCJyZWNlaXZlZE1vbmV5IiwiZSIsInN0YXJ0U3luY2luZyIsInN5bmNMb29wZXIiLCJUYXNrTG9vcGVyIiwiYmFja2dyb3VuZFN5bmMiLCJzdGFydCIsInN0b3BTeW5jaW5nIiwic3RvcCIsInN0b3Bfc3luY2luZyIsInNjYW5UeHMiLCJ0eEhhc2hlcyIsInNjYW5fdHhzIiwicmVzY2FuU3BlbnQiLCJyZXNjYW5fc3BlbnQiLCJyZXNjYW5CbG9ja2NoYWluIiwicmVzY2FuX2Jsb2NrY2hhaW4iLCJnZXRCYWxhbmNlIiwiYWNjb3VudElkeCIsInN1YmFkZHJlc3NJZHgiLCJiYWxhbmNlU3RyIiwiZ2V0X2JhbGFuY2Vfd2FsbGV0IiwiZ2V0X2JhbGFuY2VfYWNjb3VudCIsImdldF9iYWxhbmNlX3N1YmFkZHJlc3MiLCJCaWdJbnQiLCJzdHJpbmdpZnlCaWdJbnRzIiwiYmFsYW5jZSIsImdldFVubG9ja2VkQmFsYW5jZSIsInVubG9ja2VkQmFsYW5jZVN0ciIsImdldF91bmxvY2tlZF9iYWxhbmNlX3dhbGxldCIsImdldF91bmxvY2tlZF9iYWxhbmNlX2FjY291bnQiLCJnZXRfdW5sb2NrZWRfYmFsYW5jZV9zdWJhZGRyZXNzIiwidW5sb2NrZWRCYWxhbmNlIiwiZ2V0QWNjb3VudHMiLCJpbmNsdWRlU3ViYWRkcmVzc2VzIiwidGFnIiwiYWNjb3VudHNTdHIiLCJnZXRfYWNjb3VudHMiLCJhY2NvdW50cyIsImFjY291bnRKc29uIiwicHVzaCIsInNhbml0aXplQWNjb3VudCIsIk1vbmVyb0FjY291bnQiLCJnZXRBY2NvdW50IiwiYWNjb3VudFN0ciIsImdldF9hY2NvdW50IiwiY3JlYXRlQWNjb3VudCIsImxhYmVsIiwiY3JlYXRlX2FjY291bnQiLCJnZXRTdWJhZGRyZXNzZXMiLCJzdWJhZGRyZXNzSW5kaWNlcyIsImFyZ3MiLCJsaXN0aWZ5Iiwic3ViYWRkcmVzc2VzSnNvbiIsImdldF9zdWJhZGRyZXNzZXMiLCJzdWJhZGRyZXNzZXMiLCJzdWJhZGRyZXNzSnNvbiIsInNhbml0aXplU3ViYWRkcmVzcyIsIk1vbmVyb1N1YmFkZHJlc3MiLCJjcmVhdGVTdWJhZGRyZXNzIiwic3ViYWRkcmVzc1N0ciIsImNyZWF0ZV9zdWJhZGRyZXNzIiwic2V0U3ViYWRkcmVzc0xhYmVsIiwic2V0X3N1YmFkZHJlc3NfbGFiZWwiLCJnZXRUeHMiLCJxdWVyeSIsInF1ZXJ5Tm9ybWFsaXplZCIsIk1vbmVyb1dhbGxldCIsIm5vcm1hbGl6ZVR4UXVlcnkiLCJnZXRfdHhzIiwiZ2V0QmxvY2siLCJibG9ja3NKc29uU3RyIiwiZGVzZXJpYWxpemVUeHMiLCJnZXRUcmFuc2ZlcnMiLCJub3JtYWxpemVUcmFuc2ZlclF1ZXJ5IiwiZ2V0X3RyYW5zZmVycyIsImdldFR4UXVlcnkiLCJkZXNlcmlhbGl6ZVRyYW5zZmVycyIsImdldE91dHB1dHMiLCJub3JtYWxpemVPdXRwdXRRdWVyeSIsImdldF9vdXRwdXRzIiwiZGVzZXJpYWxpemVPdXRwdXRzIiwiZXhwb3J0T3V0cHV0cyIsImFsbCIsImV4cG9ydF9vdXRwdXRzIiwib3V0cHV0c0hleCIsImltcG9ydE91dHB1dHMiLCJpbXBvcnRfb3V0cHV0cyIsIm51bUltcG9ydGVkIiwiZXhwb3J0S2V5SW1hZ2VzIiwiZXhwb3J0X2tleV9pbWFnZXMiLCJrZXlJbWFnZXNTdHIiLCJrZXlJbWFnZXMiLCJrZXlJbWFnZUpzb24iLCJNb25lcm9LZXlJbWFnZSIsImltcG9ydEtleUltYWdlcyIsImltcG9ydF9rZXlfaW1hZ2VzIiwibWFwIiwia2V5SW1hZ2UiLCJrZXlJbWFnZUltcG9ydFJlc3VsdFN0ciIsIk1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0IiwiZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQiLCJmcmVlemVPdXRwdXQiLCJmcmVlemVfb3V0cHV0IiwidGhhd091dHB1dCIsInRoYXdfb3V0cHV0IiwiaXNPdXRwdXRGcm96ZW4iLCJpc19vdXRwdXRfZnJvemVuIiwiY3JlYXRlVHhzIiwiY29uZmlnTm9ybWFsaXplZCIsIm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyIsImdldENhblNwbGl0Iiwic2V0Q2FuU3BsaXQiLCJjcmVhdGVfdHhzIiwidHhTZXRKc29uU3RyIiwiTW9uZXJvVHhTZXQiLCJzd2VlcE91dHB1dCIsIm5vcm1hbGl6ZVN3ZWVwT3V0cHV0Q29uZmlnIiwic3dlZXBfb3V0cHV0Iiwic3dlZXBVbmxvY2tlZCIsIm5vcm1hbGl6ZVN3ZWVwVW5sb2NrZWRDb25maWciLCJzd2VlcF91bmxvY2tlZCIsInR4U2V0c0pzb24iLCJ0eFNldHMiLCJ0eFNldEpzb24iLCJ0eHMiLCJ0eFNldCIsInR4Iiwic3dlZXBEdXN0IiwicmVsYXkiLCJzd2VlcF9kdXN0Iiwic2V0VHhzIiwicmVsYXlUeHMiLCJ0eHNPck1ldGFkYXRhcyIsIkFycmF5IiwiaXNBcnJheSIsInR4TWV0YWRhdGFzIiwidHhPck1ldGFkYXRhIiwiTW9uZXJvVHhXYWxsZXQiLCJnZXRNZXRhZGF0YSIsInJlbGF5X3R4cyIsInR4SGFzaGVzSnNvbiIsImRlc2NyaWJlVHhTZXQiLCJ1bnNpZ25lZFR4SGV4IiwiZ2V0VW5zaWduZWRUeEhleCIsInNpZ25lZFR4SGV4IiwiZ2V0U2lnbmVkVHhIZXgiLCJtdWx0aXNpZ1R4SGV4IiwiZ2V0TXVsdGlzaWdUeEhleCIsImRlc2NyaWJlX3R4X3NldCIsImdldF9leGNlcHRpb25fbWVzc2FnZSIsInNpZ25UeHMiLCJzaWduX3R4cyIsInN1Ym1pdFR4cyIsInN1Ym1pdF90eHMiLCJzaWduTWVzc2FnZSIsInNpZ25hdHVyZVR5cGUiLCJNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIlNJR05fV0lUSF9TUEVORF9LRVkiLCJzaWduX21lc3NhZ2UiLCJ2ZXJpZnlNZXNzYWdlIiwiYWRkcmVzcyIsInNpZ25hdHVyZSIsInZlcmlmeV9tZXNzYWdlIiwiaXNHb29kIiwiTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCIsImlzT2xkIiwiU0lHTl9XSVRIX1ZJRVdfS0VZIiwidmVyc2lvbiIsImdldFR4S2V5IiwidHhIYXNoIiwiZ2V0X3R4X2tleSIsImNoZWNrVHhLZXkiLCJ0eEtleSIsImNoZWNrX3R4X2tleSIsInJlc3BKc29uU3RyIiwiTW9uZXJvQ2hlY2tUeCIsImdldFR4UHJvb2YiLCJnZXRfdHhfcHJvb2YiLCJlcnJvcktleSIsImluZGV4T2YiLCJzdWJzdHJpbmciLCJsZW5ndGgiLCJjaGVja1R4UHJvb2YiLCJjaGVja190eF9wcm9vZiIsImdldFNwZW5kUHJvb2YiLCJnZXRfc3BlbmRfcHJvb2YiLCJjaGVja1NwZW5kUHJvb2YiLCJjaGVja19zcGVuZF9wcm9vZiIsImdldFJlc2VydmVQcm9vZldhbGxldCIsImdldF9yZXNlcnZlX3Byb29mX3dhbGxldCIsImdldFJlc2VydmVQcm9vZkFjY291bnQiLCJhbW91bnQiLCJnZXRfcmVzZXJ2ZV9wcm9vZl9hY2NvdW50IiwidG9TdHJpbmciLCJjaGVja1Jlc2VydmVQcm9vZiIsImNoZWNrX3Jlc2VydmVfcHJvb2YiLCJNb25lcm9DaGVja1Jlc2VydmUiLCJnZXRUeE5vdGVzIiwiZ2V0X3R4X25vdGVzIiwidHhOb3RlcyIsInNldFR4Tm90ZXMiLCJub3RlcyIsInNldF90eF9ub3RlcyIsImdldEFkZHJlc3NCb29rRW50cmllcyIsImVudHJ5SW5kaWNlcyIsImVudHJpZXMiLCJlbnRyeUpzb24iLCJnZXRfYWRkcmVzc19ib29rX2VudHJpZXMiLCJNb25lcm9BZGRyZXNzQm9va0VudHJ5IiwiYWRkQWRkcmVzc0Jvb2tFbnRyeSIsImRlc2NyaXB0aW9uIiwiYWRkX2FkZHJlc3NfYm9va19lbnRyeSIsImVkaXRBZGRyZXNzQm9va0VudHJ5IiwiaW5kZXgiLCJzZXRBZGRyZXNzIiwic2V0RGVzY3JpcHRpb24iLCJlZGl0X2FkZHJlc3NfYm9va19lbnRyeSIsImRlbGV0ZUFkZHJlc3NCb29rRW50cnkiLCJlbnRyeUlkeCIsImRlbGV0ZV9hZGRyZXNzX2Jvb2tfZW50cnkiLCJ0YWdBY2NvdW50cyIsImFjY291bnRJbmRpY2VzIiwidGFnX2FjY291bnRzIiwidW50YWdBY2NvdW50cyIsImdldEFjY291bnRUYWdzIiwiYWNjb3VudFRhZ3MiLCJhY2NvdW50VGFnSnNvbiIsImdldF9hY2NvdW50X3RhZ3MiLCJNb25lcm9BY2NvdW50VGFnIiwic2V0QWNjb3VudFRhZ0xhYmVsIiwic2V0X2FjY291bnRfdGFnX2xhYmVsIiwiZ2V0UGF5bWVudFVyaSIsImdldF9wYXltZW50X3VyaSIsInBhcnNlUGF5bWVudFVyaSIsIk1vbmVyb1R4Q29uZmlnIiwicGFyc2VfcGF5bWVudF91cmkiLCJnZXRBdHRyaWJ1dGUiLCJrZXkiLCJ2YWx1ZSIsImdldF9hdHRyaWJ1dGUiLCJzZXRBdHRyaWJ1dGUiLCJ2YWwiLCJzZXRfYXR0cmlidXRlIiwic3RhcnRNaW5pbmciLCJudW1UaHJlYWRzIiwiYmFja2dyb3VuZE1pbmluZyIsImlnbm9yZUJhdHRlcnkiLCJkYWVtb24iLCJNb25lcm9EYWVtb25ScGMiLCJjb25uZWN0VG9EYWVtb25ScGMiLCJzdG9wTWluaW5nIiwiaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCIsImlzX211bHRpc2lnX2ltcG9ydF9uZWVkZWQiLCJpc011bHRpc2lnIiwiaXNfbXVsdGlzaWciLCJnZXRNdWx0aXNpZ0luZm8iLCJNb25lcm9NdWx0aXNpZ0luZm8iLCJnZXRfbXVsdGlzaWdfaW5mbyIsInByZXBhcmVNdWx0aXNpZyIsInByZXBhcmVfbXVsdGlzaWciLCJtYWtlTXVsdGlzaWciLCJtdWx0aXNpZ0hleGVzIiwidGhyZXNob2xkIiwibWFrZV9tdWx0aXNpZyIsImV4Y2hhbmdlTXVsdGlzaWdLZXlzIiwiZXhjaGFuZ2VfbXVsdGlzaWdfa2V5cyIsIk1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCIsImV4cG9ydE11bHRpc2lnSGV4IiwiZXhwb3J0X211bHRpc2lnX2hleCIsImltcG9ydE11bHRpc2lnSGV4IiwiaW1wb3J0X211bHRpc2lnX2hleCIsInNpZ25NdWx0aXNpZ1R4SGV4Iiwic2lnbl9tdWx0aXNpZ190eF9oZXgiLCJNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQiLCJzdWJtaXRNdWx0aXNpZ1R4SGV4Iiwic2lnbmVkTXVsdGlzaWdUeEhleCIsInN1Ym1pdF9tdWx0aXNpZ190eF9oZXgiLCJnZXREYXRhIiwidmlld09ubHkiLCJpc1ZpZXdPbmx5Iiwidmlld3MiLCJjYWNoZUJ1ZmZlckxvYyIsImdldF9jYWNoZV9maWxlX2J1ZmZlciIsInZpZXciLCJEYXRhVmlldyIsIkFycmF5QnVmZmVyIiwiaSIsInNldEludDgiLCJIRUFQVTgiLCJwb2ludGVyIiwiVWludDhBcnJheSIsIkJZVEVTX1BFUl9FTEVNRU5UIiwiX2ZyZWUiLCJCdWZmZXIiLCJmcm9tIiwiYnVmZmVyIiwia2V5c0J1ZmZlckxvYyIsImdldF9rZXlzX2ZpbGVfYnVmZmVyIiwidW5zaGlmdCIsImNoYW5nZVBhc3N3b3JkIiwib2xkUGFzc3dvcmQiLCJuZXdQYXNzd29yZCIsImNoYW5nZV93YWxsZXRfcGFzc3dvcmQiLCJlcnJNc2ciLCJjbG9zZSIsImdldE51bUJsb2Nrc1RvVW5sb2NrIiwiZ2V0VHgiLCJnZXRJbmNvbWluZ1RyYW5zZmVycyIsImdldE91dGdvaW5nVHJhbnNmZXJzIiwiY3JlYXRlVHgiLCJyZWxheVR4IiwiZ2V0VHhOb3RlIiwic2V0VHhOb3RlIiwibm90ZSIsInByb3h5VG9Xb3JrZXIiLCJuZXR3b3JrVHlwZSIsImRhZW1vblVyaSIsImRhZW1vblVzZXJuYW1lIiwiZGFlbW9uUGFzc3dvcmQiLCJvcGVuX3dhbGxldF9mdWxsIiwia2V5c0RhdGEiLCJjYWNoZURhdGEiLCJicm93c2VyTWFpblBhdGgiLCJjb25zb2xlIiwiZXJyb3IiLCJpc0VuYWJsZWQiLCJzZXRfbGlzdGVuZXIiLCJuZXdMaXN0ZW5lckhhbmRsZSIsImhlaWdodCIsImVuZEhlaWdodCIsInBlcmNlbnREb25lIiwib25TeW5jUHJvZ3Jlc3MiLCJvbk5ld0Jsb2NrIiwibmV3QmFsYW5jZVN0ciIsIm5ld1VubG9ja2VkQmFsYW5jZVN0ciIsIm9uQmFsYW5jZXNDaGFuZ2VkIiwiYW1vdW50U3RyIiwidW5sb2NrVGltZSIsImlzTG9ja2VkIiwib25PdXRwdXRSZWNlaXZlZCIsImFjY291bnRJZHhTdHIiLCJzdWJhZGRyZXNzSWR4U3RyIiwib25PdXRwdXRTcGVudCIsInNhbml0aXplQmxvY2siLCJibG9jayIsInNhbml0aXplVHhXYWxsZXQiLCJhY2NvdW50Iiwic3ViYWRkcmVzcyIsImRlc2VyaWFsaXplQmxvY2tzIiwiYmxvY2tzSnNvbiIsImRlc2VyaWFsaXplZEJsb2NrcyIsImJsb2NrcyIsImJsb2NrSnNvbiIsIk1vbmVyb0Jsb2NrIiwiRGVzZXJpYWxpemF0aW9uVHlwZSIsIlRYX1dBTExFVCIsInNldEJsb2NrIiwiZ2V0SGFzaGVzIiwidHhNYXAiLCJNYXAiLCJnZXRIYXNoIiwidHhzU29ydGVkIiwidHJhbnNmZXJzIiwiZ2V0T3V0Z29pbmdUcmFuc2ZlciIsInRyYW5zZmVyIiwib3V0cHV0cyIsIm91dHB1dCIsInNldEJyb3dzZXJNYWluUGF0aCIsIlBhdGgiLCJub3JtYWxpemUiLCJpc0Nsb3NlZCIsIndhbGxldERpciIsImRpcm5hbWUiLCJta2RpciIsImRhdGEiLCJ3cml0ZUZpbGUiLCJvbGRQYXRoIiwidW5saW5rIiwicGF0aE5ldyIsInJlbmFtZSIsImV4cG9ydHMiLCJkZWZhdWx0IiwiTW9uZXJvV2FsbGV0S2V5c1Byb3h5Iiwid2FsbGV0SWQiLCJpbnZva2VXb3JrZXIiLCJnZXRXb3JrZXIiLCJ3b3JrZXIiLCJ3cmFwcGVkTGlzdGVuZXJzIiwiYXJndW1lbnRzIiwidXJpT3JScGNDb25uZWN0aW9uIiwiZ2V0Q29uZmlnIiwicnBjQ29uZmlnIiwid3JhcHBlZExpc3RlbmVyIiwiV2FsbGV0V29ya2VyTGlzdGVuZXIiLCJsaXN0ZW5lcklkIiwiZ2V0SWQiLCJhZGRXb3JrZXJDYWxsYmFjayIsImdldExpc3RlbmVyIiwicmVtb3ZlV29ya2VyQ2FsbGJhY2siLCJzcGxpY2UiLCJyZXN1bHRKc29uIiwiYmxvY2tKc29ucyIsImtleUltYWdlc0pzb24iLCJhbm5vdW5jZVN5bmNQcm9ncmVzcyIsImFubm91bmNlTmV3QmxvY2siLCJhbm5vdW5jZUJhbGFuY2VzQ2hhbmdlZCIsIk1vbmVyb091dHB1dFdhbGxldCIsInNldEFtb3VudCIsInNldEFjY291bnRJbmRleCIsInNldFN1YmFkZHJlc3NJbmRleCIsInNldEhhc2giLCJzZXRWZXJzaW9uIiwic2V0VW5sb2NrVGltZSIsInNldFR4Iiwic2V0T3V0cHV0cyIsInNldElzSW5jb21pbmciLCJzZXRJc0xvY2tlZCIsInNldEhlaWdodCIsInNldElzQ29uZmlybWVkIiwic2V0SW5UeFBvb2wiLCJzZXRJc0ZhaWxlZCIsImFubm91bmNlT3V0cHV0UmVjZWl2ZWQiLCJwYXJzZUludCIsInNldElucHV0cyIsImFubm91bmNlT3V0cHV0U3BlbnQiLCJpZCIsImdldElucHV0cyJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL3dhbGxldC9Nb25lcm9XYWxsZXRGdWxsLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IFBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCBHZW5VdGlscyBmcm9tIFwiLi4vY29tbW9uL0dlblV0aWxzXCI7XG5pbXBvcnQgTGlicmFyeVV0aWxzIGZyb20gXCIuLi9jb21tb24vTGlicmFyeVV0aWxzXCI7XG5pbXBvcnQgVGFza0xvb3BlciBmcm9tIFwiLi4vY29tbW9uL1Rhc2tMb29wZXJcIjtcbmltcG9ydCBNb25lcm9BY2NvdW50IGZyb20gXCIuL21vZGVsL01vbmVyb0FjY291bnRcIjtcbmltcG9ydCBNb25lcm9BY2NvdW50VGFnIGZyb20gXCIuL21vZGVsL01vbmVyb0FjY291bnRUYWdcIjtcbmltcG9ydCBNb25lcm9BZGRyZXNzQm9va0VudHJ5IGZyb20gXCIuL21vZGVsL01vbmVyb0FkZHJlc3NCb29rRW50cnlcIjtcbmltcG9ydCBNb25lcm9CbG9jayBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0Jsb2NrXCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2tUeCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9DaGVja1R4XCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2tSZXNlcnZlIGZyb20gXCIuL21vZGVsL01vbmVyb0NoZWNrUmVzZXJ2ZVwiO1xuaW1wb3J0IE1vbmVyb0RhZW1vblJwYyBmcm9tIFwiLi4vZGFlbW9uL01vbmVyb0RhZW1vblJwY1wiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuLi9jb21tb24vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBNb25lcm9JbmNvbWluZ1RyYW5zZmVyIGZyb20gXCIuL21vZGVsL01vbmVyb0luY29taW5nVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvS2V5SW1hZ2VcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnSW5mbyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ0luZm9cIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnU2lnblJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb05ldHdvcmtUeXBlIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvTmV0d29ya1R5cGVcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRwdXRRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb091dHB1dFdhbGxldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRwdXRXYWxsZXRcIjtcbmltcG9ydCBNb25lcm9ScGNDb25uZWN0aW9uIGZyb20gXCIuLi9jb21tb24vTW9uZXJvUnBjQ29ubmVjdGlvblwiO1xuaW1wb3J0IE1vbmVyb1N1YmFkZHJlc3MgZnJvbSBcIi4vbW9kZWwvTW9uZXJvU3ViYWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb1N5bmNSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvU3luY1Jlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb1RyYW5zZmVyIGZyb20gXCIuL21vZGVsL01vbmVyb1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvVHJhbnNmZXJRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UcmFuc2ZlclF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvVHhDb25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhDb25maWdcIjtcbmltcG9ydCBNb25lcm9UeFF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb1R4UXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeFNldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFNldFwiO1xuaW1wb3J0IE1vbmVyb1R4IGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvVHhcIjtcbmltcG9ydCBNb25lcm9UeFdhbGxldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFdhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1dhbGxldCBmcm9tIFwiLi9Nb25lcm9XYWxsZXRcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRDb25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvV2FsbGV0Q29uZmlnXCI7XG5pbXBvcnQgeyBNb25lcm9XYWxsZXRLZXlzLCBNb25lcm9XYWxsZXRLZXlzUHJveHkgfSBmcm9tIFwiLi9Nb25lcm9XYWxsZXRLZXlzXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0TGlzdGVuZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvV2FsbGV0TGlzdGVuZXJcIjtcbmltcG9ydCBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZVwiO1xuaW1wb3J0IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb1ZlcnNpb24gZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9WZXJzaW9uXCI7XG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgbWVtZnMgZnJvbSBcIm1lbWZzXCI7XG5cbi8qKlxuICogSW1wbGVtZW50cyBhIE1vbmVybyB3YWxsZXQgdXNpbmcgY2xpZW50LXNpZGUgV2ViQXNzZW1ibHkgYmluZGluZ3MgdG8gbW9uZXJvLXByb2plY3QncyB3YWxsZXQyIGluIEMrKy5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTW9uZXJvV2FsbGV0RnVsbCBleHRlbmRzIE1vbmVyb1dhbGxldEtleXMge1xuXG4gIC8vIHN0YXRpYyB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIHN0YXRpYyByZWFkb25seSBERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TID0gMjAwMDA7XG4gIHByb3RlY3RlZCBzdGF0aWMgRlM7XG5cbiAgLy8gaW5zdGFuY2UgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBwYXRoOiBzdHJpbmc7XG4gIHByb3RlY3RlZCBwYXNzd29yZDogc3RyaW5nO1xuICBwcm90ZWN0ZWQgbGlzdGVuZXJzOiBNb25lcm9XYWxsZXRMaXN0ZW5lcltdO1xuICBwcm90ZWN0ZWQgZnM6IGFueTtcbiAgcHJvdGVjdGVkIHdhc21MaXN0ZW5lcjogV2FsbGV0V2FzbUxpc3RlbmVyO1xuICBwcm90ZWN0ZWQgd2FzbUxpc3RlbmVySGFuZGxlOiBudW1iZXI7XG4gIHByb3RlY3RlZCByZWplY3RVbmF1dGhvcml6ZWQ6IGJvb2xlYW47XG4gIHByb3RlY3RlZCByZWplY3RVbmF1dGhvcml6ZWRDb25maWdJZDogc3RyaW5nO1xuICBwcm90ZWN0ZWQgc3luY1BlcmlvZEluTXM6IG51bWJlcjtcbiAgcHJvdGVjdGVkIHN5bmNMb29wZXI6IFRhc2tMb29wZXI7XG4gIHByb3RlY3RlZCBicm93c2VyTWFpblBhdGg6IHN0cmluZztcblxuICAvKipcbiAgICogSW50ZXJuYWwgY29uc3RydWN0b3Igd2hpY2ggaXMgZ2l2ZW4gdGhlIG1lbW9yeSBhZGRyZXNzIG9mIGEgQysrIHdhbGxldCBpbnN0YW5jZS5cbiAgICogXG4gICAqIFRoaXMgY29uc3RydWN0b3Igc2hvdWxkIGJlIGNhbGxlZCB0aHJvdWdoIHN0YXRpYyB3YWxsZXQgY3JlYXRpb24gdXRpbGl0aWVzIGluIHRoaXMgY2xhc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gY3BwQWRkcmVzcyAtIGFkZHJlc3Mgb2YgdGhlIHdhbGxldCBpbnN0YW5jZSBpbiBDKytcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggLSBwYXRoIG9mIHRoZSB3YWxsZXQgaW5zdGFuY2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhc3N3b3JkIC0gcGFzc3dvcmQgb2YgdGhlIHdhbGxldCBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge0ZpbGVTeXN0ZW19IGZzIC0gbm9kZS5qcy1jb21wYXRpYmxlIGZpbGUgc3lzdGVtIHRvIHJlYWQvd3JpdGUgd2FsbGV0IGZpbGVzXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gcmVqZWN0VW5hdXRob3JpemVkIC0gc3BlY2lmaWVzIGlmIHVuYXV0aG9yaXplZCByZXF1ZXN0cyAoZS5nLiBzZWxmLXNpZ25lZCBjZXJ0aWZpY2F0ZXMpIHNob3VsZCBiZSByZWplY3RlZFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcmVqZWN0VW5hdXRob3JpemVkRm5JZCAtIHVuaXF1ZSBpZGVudGlmaWVyIGZvciBodHRwX2NsaWVudF93YXNtIHRvIHF1ZXJ5IHJlamVjdFVuYXV0aG9yaXplZFxuICAgKiBAcGFyYW0ge01vbmVyb1dhbGxldEZ1bGxQcm94eX0gd2FsbGV0UHJveHkgLSBwcm94eSB0byBpbnZva2Ugd2FsbGV0IG9wZXJhdGlvbnMgaW4gYSB3ZWIgd29ya2VyXG4gICAqIFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgY29uc3RydWN0b3IoY3BwQWRkcmVzcywgcGF0aCwgcGFzc3dvcmQsIGZzLCByZWplY3RVbmF1dGhvcml6ZWQsIHJlamVjdFVuYXV0aG9yaXplZEZuSWQsIHdhbGxldFByb3h5PzogTW9uZXJvV2FsbGV0RnVsbFByb3h5KSB7XG4gICAgc3VwZXIoY3BwQWRkcmVzcywgd2FsbGV0UHJveHkpO1xuICAgIGlmICh3YWxsZXRQcm94eSkgcmV0dXJuO1xuICAgIHRoaXMucGF0aCA9IHBhdGg7XG4gICAgdGhpcy5wYXNzd29yZCA9IHBhc3N3b3JkO1xuICAgIHRoaXMubGlzdGVuZXJzID0gW107XG4gICAgdGhpcy5mcyA9IGZzID8gZnMgOiAocGF0aCA/IE1vbmVyb1dhbGxldEZ1bGwuZ2V0RnMoKSA6IHVuZGVmaW5lZCk7XG4gICAgdGhpcy5faXNDbG9zZWQgPSBmYWxzZTtcbiAgICB0aGlzLndhc21MaXN0ZW5lciA9IG5ldyBXYWxsZXRXYXNtTGlzdGVuZXIodGhpcyk7IC8vIHJlY2VpdmVzIG5vdGlmaWNhdGlvbnMgZnJvbSB3YXNtIGMrK1xuICAgIHRoaXMud2FzbUxpc3RlbmVySGFuZGxlID0gMDsgICAgICAgICAgICAgICAgICAgICAgLy8gbWVtb3J5IGFkZHJlc3Mgb2YgdGhlIHdhbGxldCBsaXN0ZW5lciBpbiBjKytcbiAgICB0aGlzLnJlamVjdFVuYXV0aG9yaXplZCA9IHJlamVjdFVuYXV0aG9yaXplZDtcbiAgICB0aGlzLnJlamVjdFVuYXV0aG9yaXplZENvbmZpZ0lkID0gcmVqZWN0VW5hdXRob3JpemVkRm5JZDtcbiAgICB0aGlzLnN5bmNQZXJpb2RJbk1zID0gTW9uZXJvV2FsbGV0RnVsbC5ERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TO1xuICAgIExpYnJhcnlVdGlscy5zZXRSZWplY3RVbmF1dGhvcml6ZWRGbihyZWplY3RVbmF1dGhvcml6ZWRGbklkLCAoKSA9PiB0aGlzLnJlamVjdFVuYXV0aG9yaXplZCk7IC8vIHJlZ2lzdGVyIGZuIGluZm9ybWluZyBpZiB1bmF1dGhvcml6ZWQgcmVxcyBzaG91bGQgYmUgcmVqZWN0ZWRcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBTVEFUSUMgVVRJTElUSUVTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICAvKipcbiAgICogQ2hlY2sgaWYgYSB3YWxsZXQgZXhpc3RzIGF0IGEgZ2l2ZW4gcGF0aC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gcGF0aCBvZiB0aGUgd2FsbGV0IG9uIHRoZSBmaWxlIHN5c3RlbVxuICAgKiBAcGFyYW0ge2FueX0gZnMgLSBmaWxlIHN5c3RlbSBjb21wYXRpYmxlIHdpdGggTm9kZS5qcyBgZnMucHJvbWlzZXNgIEFQSSAoZGVmYXVsdHMgdG8gZGlzayBvciBpbi1tZW1vcnkgRlMgaWYgYnJvd3NlcilcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiBhIHdhbGxldCBleGlzdHMgYXQgdGhlIGdpdmVuIHBhdGgsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHdhbGxldEV4aXN0cyhwYXRoLCBmcykge1xuICAgIGFzc2VydChwYXRoLCBcIk11c3QgcHJvdmlkZSBhIHBhdGggdG8gbG9vayBmb3IgYSB3YWxsZXRcIik7XG4gICAgaWYgKCFmcykgZnMgPSBNb25lcm9XYWxsZXRGdWxsLmdldEZzKCk7XG4gICAgaWYgKCFmcykgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGZpbGUgc3lzdGVtIHRvIGNoZWNrIGlmIHdhbGxldCBleGlzdHNcIik7XG4gICAgbGV0IGV4aXN0cyA9IGF3YWl0IExpYnJhcnlVdGlscy5leGlzdHMoZnMsIHBhdGggKyBcIi5rZXlzXCIpO1xuICAgIExpYnJhcnlVdGlscy5sb2coMSwgXCJXYWxsZXQgZXhpc3RzIGF0IFwiICsgcGF0aCArIFwiOiBcIiArIGV4aXN0cyk7XG4gICAgcmV0dXJuIGV4aXN0cztcbiAgfVxuICBcbiAgc3RhdGljIGFzeW5jIG9wZW5XYWxsZXQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pIHtcblxuICAgIC8vIHZhbGlkYXRlIGNvbmZpZ1xuICAgIGNvbmZpZyA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcoY29uZmlnKTtcbiAgICBpZiAoY29uZmlnLmdldFByb3h5VG9Xb3JrZXIoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UHJveHlUb1dvcmtlcih0cnVlKTtcbiAgICBpZiAoY29uZmlnLmdldFNlZWQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3BlY2lmeSBzZWVkIHdoZW4gb3BlbmluZyB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgc2VlZCBvZmZzZXQgd2hlbiBvcGVuaW5nIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFByaW1hcnlBZGRyZXNzKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgcHJpbWFyeSBhZGRyZXNzIHdoZW4gb3BlbmluZyB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQcml2YXRlVmlld0tleSgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHByaXZhdGUgdmlldyBrZXkgd2hlbiBvcGVuaW5nIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFByaXZhdGVTcGVuZEtleSgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHByaXZhdGUgc3BlbmQga2V5IHdoZW4gb3BlbmluZyB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgcmVzdG9yZSBoZWlnaHQgd2hlbiBvcGVuaW5nIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldExhbmd1YWdlKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgbGFuZ3VhZ2Ugd2hlbiBvcGVuaW5nIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFNhdmVDdXJyZW50KCkgPT09IHRydWUpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzYXZlIGN1cnJlbnQgd2FsbGV0IHdoZW4gb3BlbmluZyBmdWxsIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldEZzKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldEZzKE1vbmVyb1dhbGxldEZ1bGwuZ2V0RnMoKSk7XG5cbiAgICAvLyBzZXQgc2VydmVyIGZyb20gY29ubmVjdGlvbiBtYW5hZ2VyIGlmIHByb3ZpZGVkXG4gICAgaWYgKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpKSB7XG4gICAgICBpZiAoY29uZmlnLmdldFNlcnZlcigpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgY2FuIGJlIG9wZW5lZCB3aXRoIGEgc2VydmVyIG9yIGNvbm5lY3Rpb24gbWFuYWdlciBidXQgbm90IGJvdGhcIik7XG4gICAgICBjb25maWcuc2V0U2VydmVyKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpLmdldENvbm5lY3Rpb24oKSk7XG4gICAgfVxuXG4gICAgLy8gcmVhZCB3YWxsZXQgZGF0YSBmcm9tIGRpc2sgdW5sZXNzIHByb3ZpZGVkXG4gICAgaWYgKCFjb25maWcuZ2V0S2V5c0RhdGEoKSkge1xuICAgICAgbGV0IGZzID0gY29uZmlnLmdldEZzKCk7XG4gICAgICBpZiAoIWZzKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgZmlsZSBzeXN0ZW0gdG8gcmVhZCB3YWxsZXQgZGF0YSBmcm9tXCIpO1xuICAgICAgaWYgKCFhd2FpdCB0aGlzLndhbGxldEV4aXN0cyhjb25maWcuZ2V0UGF0aCgpLCBmcykpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBkb2VzIG5vdCBleGlzdCBhdCBwYXRoOiBcIiArIGNvbmZpZy5nZXRQYXRoKCkpO1xuICAgICAgY29uZmlnLnNldEtleXNEYXRhKGF3YWl0IGZzLnJlYWRGaWxlKGNvbmZpZy5nZXRQYXRoKCkgKyBcIi5rZXlzXCIpKTtcbiAgICAgIGNvbmZpZy5zZXRDYWNoZURhdGEoYXdhaXQgTGlicmFyeVV0aWxzLmV4aXN0cyhmcywgY29uZmlnLmdldFBhdGgoKSkgPyBhd2FpdCBmcy5yZWFkRmlsZShjb25maWcuZ2V0UGF0aCgpKSA6IFwiXCIpO1xuICAgIH1cblxuICAgIC8vIG9wZW4gd2FsbGV0IGZyb20gZGF0YVxuICAgIGNvbnN0IHdhbGxldCA9IGF3YWl0IE1vbmVyb1dhbGxldEZ1bGwub3BlbldhbGxldERhdGEoY29uZmlnKTtcblxuICAgIC8vIHNldCBjb25uZWN0aW9uIG1hbmFnZXJcbiAgICBhd2FpdCB3YWxsZXQuc2V0Q29ubmVjdGlvbk1hbmFnZXIoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpO1xuICAgIHJldHVybiB3YWxsZXQ7XG4gIH1cbiAgXG4gIHN0YXRpYyBhc3luYyBjcmVhdGVXYWxsZXQoY29uZmlnOiBNb25lcm9XYWxsZXRDb25maWcpOiBQcm9taXNlPE1vbmVyb1dhbGxldEZ1bGw+IHtcblxuICAgIC8vIHZhbGlkYXRlIGNvbmZpZ1xuICAgIGlmIChjb25maWcgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGNvbmZpZyB0byBjcmVhdGUgd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0U2VlZCgpICE9PSB1bmRlZmluZWQgJiYgKGNvbmZpZy5nZXRQcmltYXJ5QWRkcmVzcygpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldFByaXZhdGVWaWV3S2V5KCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWcuZ2V0UHJpdmF0ZVNwZW5kS2V5KCkgIT09IHVuZGVmaW5lZCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBtYXkgYmUgaW5pdGlhbGl6ZWQgd2l0aCBhIHNlZWQgb3Iga2V5cyBidXQgbm90IGJvdGhcIik7XG4gICAgaWYgKGNvbmZpZy5nZXROZXR3b3JrVHlwZSgpID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBhIG5ldHdvcmtUeXBlOiAnbWFpbm5ldCcsICd0ZXN0bmV0JyBvciAnc3RhZ2VuZXQnXCIpO1xuICAgIE1vbmVyb05ldHdvcmtUeXBlLnZhbGlkYXRlKGNvbmZpZy5nZXROZXR3b3JrVHlwZSgpKTtcbiAgICBpZiAoY29uZmlnLmdldFNhdmVDdXJyZW50KCkgPT09IHRydWUpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzYXZlIGN1cnJlbnQgd2FsbGV0IHdoZW4gY3JlYXRpbmcgZnVsbCBXQVNNIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFBhdGgoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UGF0aChcIlwiKTtcbiAgICBpZiAoY29uZmlnLmdldFBhdGgoKSAmJiBhd2FpdCBNb25lcm9XYWxsZXRGdWxsLndhbGxldEV4aXN0cyhjb25maWcuZ2V0UGF0aCgpLCBjb25maWcuZ2V0RnMoKSkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBhbHJlYWR5IGV4aXN0czogXCIgKyBjb25maWcuZ2V0UGF0aCgpKTtcbiAgICBpZiAoY29uZmlnLmdldFBhc3N3b3JkKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFBhc3N3b3JkKFwiXCIpO1xuXG4gICAgLy8gc2V0IHNlcnZlciBmcm9tIGNvbm5lY3Rpb24gbWFuYWdlciBpZiBwcm92aWRlZFxuICAgIGlmIChjb25maWcuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSkge1xuICAgICAgaWYgKGNvbmZpZy5nZXRTZXJ2ZXIoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGNhbiBiZSBjcmVhdGVkIHdpdGggYSBzZXJ2ZXIgb3IgY29ubmVjdGlvbiBtYW5hZ2VyIGJ1dCBub3QgYm90aFwiKTtcbiAgICAgIGNvbmZpZy5zZXRTZXJ2ZXIoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkuZ2V0Q29ubmVjdGlvbigpKTtcbiAgICB9XG5cbiAgICAvLyBjcmVhdGUgcHJveGllZCBvciBsb2NhbCB3YWxsZXRcbiAgICBsZXQgd2FsbGV0O1xuICAgIGlmIChjb25maWcuZ2V0UHJveHlUb1dvcmtlcigpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRQcm94eVRvV29ya2VyKHRydWUpO1xuICAgIGlmIChjb25maWcuZ2V0UHJveHlUb1dvcmtlcigpKSB7XG4gICAgICBsZXQgd2FsbGV0UHJveHkgPSBhd2FpdCBNb25lcm9XYWxsZXRGdWxsUHJveHkuY3JlYXRlV2FsbGV0KGNvbmZpZyk7XG4gICAgICB3YWxsZXQgPSBuZXcgTW9uZXJvV2FsbGV0RnVsbCh1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB3YWxsZXRQcm94eSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChjb25maWcuZ2V0U2VlZCgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKGNvbmZpZy5nZXRMYW5ndWFnZSgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIGxhbmd1YWdlIHdoZW4gY3JlYXRpbmcgd2FsbGV0IGZyb20gc2VlZFwiKTtcbiAgICAgICAgd2FsbGV0ID0gYXdhaXQgTW9uZXJvV2FsbGV0RnVsbC5jcmVhdGVXYWxsZXRGcm9tU2VlZChjb25maWcpO1xuICAgICAgfSBlbHNlIGlmIChjb25maWcuZ2V0UHJpdmF0ZVNwZW5kS2V5KCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWcuZ2V0UHJpbWFyeUFkZHJlc3MoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmIChjb25maWcuZ2V0U2VlZE9mZnNldCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHNlZWRPZmZzZXQgd2hlbiBjcmVhdGluZyB3YWxsZXQgZnJvbSBrZXlzXCIpO1xuICAgICAgICB3YWxsZXQgPSBhd2FpdCBNb25lcm9XYWxsZXRGdWxsLmNyZWF0ZVdhbGxldEZyb21LZXlzKGNvbmZpZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoY29uZmlnLmdldFNlZWRPZmZzZXQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSBzZWVkT2Zmc2V0IHdoZW4gY3JlYXRpbmcgcmFuZG9tIHdhbGxldFwiKTtcbiAgICAgICAgaWYgKGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgcmVzdG9yZUhlaWdodCB3aGVuIGNyZWF0aW5nIHJhbmRvbSB3YWxsZXRcIik7XG4gICAgICAgIHdhbGxldCA9IGF3YWl0IE1vbmVyb1dhbGxldEZ1bGwuY3JlYXRlV2FsbGV0UmFuZG9tKGNvbmZpZyk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIHNldCBjb25uZWN0aW9uIG1hbmFnZXJcbiAgICBhd2FpdCB3YWxsZXQuc2V0Q29ubmVjdGlvbk1hbmFnZXIoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpO1xuICAgIHJldHVybiB3YWxsZXQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgY3JlYXRlV2FsbGV0RnJvbVNlZWQoY29uZmlnOiBNb25lcm9XYWxsZXRDb25maWcpOiBQcm9taXNlPE1vbmVyb1dhbGxldEZ1bGw+IHtcblxuICAgIC8vIHZhbGlkYXRlIGFuZCBub3JtYWxpemUgcGFyYW1zXG4gICAgbGV0IGRhZW1vbkNvbm5lY3Rpb24gPSBjb25maWcuZ2V0U2VydmVyKCk7XG4gICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZCA9IGRhZW1vbkNvbm5lY3Rpb24gPyBkYWVtb25Db25uZWN0aW9uLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdHJ1ZTtcbiAgICBpZiAoY29uZmlnLmdldFJlc3RvcmVIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UmVzdG9yZUhlaWdodCgwKTtcbiAgICBpZiAoY29uZmlnLmdldFNlZWRPZmZzZXQoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0U2VlZE9mZnNldChcIlwiKTtcbiAgICBcbiAgICAvLyBsb2FkIGZ1bGwgd2FzbSBtb2R1bGVcbiAgICBsZXQgbW9kdWxlID0gYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRGdWxsTW9kdWxlKCk7XG4gICAgXG4gICAgLy8gY3JlYXRlIHdhbGxldCBpbiBxdWV1ZVxuICAgIGxldCB3YWxsZXQgPSBhd2FpdCBtb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgLy8gcmVnaXN0ZXIgZm4gaW5mb3JtaW5nIGlmIHVuYXV0aG9yaXplZCByZXFzIHNob3VsZCBiZSByZWplY3RlZFxuICAgICAgICBsZXQgcmVqZWN0VW5hdXRob3JpemVkRm5JZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnNldFJlamVjdFVuYXV0aG9yaXplZEZuKHJlamVjdFVuYXV0aG9yaXplZEZuSWQsICgpID0+IHJlamVjdFVuYXV0aG9yaXplZCk7XG4gICAgICAgIFxuICAgICAgICAvLyBjcmVhdGUgd2FsbGV0IGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgbW9kdWxlLmNyZWF0ZV9mdWxsX3dhbGxldChKU09OLnN0cmluZ2lmeShjb25maWcudG9Kc29uKCkpLCByZWplY3RVbmF1dGhvcml6ZWRGbklkLCBhc3luYyAoY3BwQWRkcmVzcykgPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgY3BwQWRkcmVzcyA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihjcHBBZGRyZXNzKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9XYWxsZXRGdWxsKGNwcEFkZHJlc3MsIGNvbmZpZy5nZXRQYXRoKCksIGNvbmZpZy5nZXRQYXNzd29yZCgpLCBjb25maWcuZ2V0RnMoKSwgY29uZmlnLmdldFNlcnZlcigpID8gY29uZmlnLmdldFNlcnZlcigpLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdW5kZWZpbmVkLCByZWplY3RVbmF1dGhvcml6ZWRGbklkKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgXG4gICAgLy8gc2F2ZSB3YWxsZXRcbiAgICBpZiAoY29uZmlnLmdldFBhdGgoKSkgYXdhaXQgd2FsbGV0LnNhdmUoKTtcbiAgICByZXR1cm4gd2FsbGV0O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIGNyZWF0ZVdhbGxldEZyb21LZXlzKGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKTogUHJvbWlzZTxNb25lcm9XYWxsZXRGdWxsPiB7XG5cbiAgICAvLyB2YWxpZGF0ZSBhbmQgbm9ybWFsaXplIHBhcmFtc1xuICAgIE1vbmVyb05ldHdvcmtUeXBlLnZhbGlkYXRlKGNvbmZpZy5nZXROZXR3b3JrVHlwZSgpKTtcbiAgICBpZiAoY29uZmlnLmdldFByaW1hcnlBZGRyZXNzKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFByaW1hcnlBZGRyZXNzKFwiXCIpO1xuICAgIGlmIChjb25maWcuZ2V0UHJpdmF0ZVZpZXdLZXkoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UHJpdmF0ZVZpZXdLZXkoXCJcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQcml2YXRlU3BlbmRLZXkoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UHJpdmF0ZVNwZW5kS2V5KFwiXCIpO1xuICAgIGxldCBkYWVtb25Db25uZWN0aW9uID0gY29uZmlnLmdldFNlcnZlcigpO1xuICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWQgPSBkYWVtb25Db25uZWN0aW9uID8gZGFlbW9uQ29ubmVjdGlvbi5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHRydWU7XG4gICAgaWYgKGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFJlc3RvcmVIZWlnaHQoMCk7XG4gICAgaWYgKGNvbmZpZy5nZXRMYW5ndWFnZSgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRMYW5ndWFnZShcIkVuZ2xpc2hcIik7XG4gICAgXG4gICAgLy8gbG9hZCBmdWxsIHdhc20gbW9kdWxlXG4gICAgbGV0IG1vZHVsZSA9IGF3YWl0IExpYnJhcnlVdGlscy5sb2FkRnVsbE1vZHVsZSgpO1xuICAgIFxuICAgIC8vIGNyZWF0ZSB3YWxsZXQgaW4gcXVldWVcbiAgICBsZXQgd2FsbGV0ID0gYXdhaXQgbW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgLy8gcmVnaXN0ZXIgZm4gaW5mb3JtaW5nIGlmIHVuYXV0aG9yaXplZCByZXFzIHNob3VsZCBiZSByZWplY3RlZFxuICAgICAgICBsZXQgcmVqZWN0VW5hdXRob3JpemVkRm5JZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnNldFJlamVjdFVuYXV0aG9yaXplZEZuKHJlamVjdFVuYXV0aG9yaXplZEZuSWQsICgpID0+IHJlamVjdFVuYXV0aG9yaXplZCk7XG4gICAgICAgIFxuICAgICAgICAvLyBjcmVhdGUgd2FsbGV0IGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgbW9kdWxlLmNyZWF0ZV9mdWxsX3dhbGxldChKU09OLnN0cmluZ2lmeShjb25maWcudG9Kc29uKCkpLCByZWplY3RVbmF1dGhvcml6ZWRGbklkLCBhc3luYyAoY3BwQWRkcmVzcykgPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgY3BwQWRkcmVzcyA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihjcHBBZGRyZXNzKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9XYWxsZXRGdWxsKGNwcEFkZHJlc3MsIGNvbmZpZy5nZXRQYXRoKCksIGNvbmZpZy5nZXRQYXNzd29yZCgpLCBjb25maWcuZ2V0RnMoKSwgY29uZmlnLmdldFNlcnZlcigpID8gY29uZmlnLmdldFNlcnZlcigpLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdW5kZWZpbmVkLCByZWplY3RVbmF1dGhvcml6ZWRGbklkKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgXG4gICAgLy8gc2F2ZSB3YWxsZXRcbiAgICBpZiAoY29uZmlnLmdldFBhdGgoKSkgYXdhaXQgd2FsbGV0LnNhdmUoKTtcbiAgICByZXR1cm4gd2FsbGV0O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIGNyZWF0ZVdhbGxldFJhbmRvbShjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZyk6IFByb21pc2U8TW9uZXJvV2FsbGV0RnVsbD4ge1xuICAgIFxuICAgIC8vIHZhbGlkYXRlIGFuZCBub3JtYWxpemUgcGFyYW1zXG4gICAgaWYgKGNvbmZpZy5nZXRMYW5ndWFnZSgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRMYW5ndWFnZShcIkVuZ2xpc2hcIik7XG4gICAgbGV0IGRhZW1vbkNvbm5lY3Rpb24gPSBjb25maWcuZ2V0U2VydmVyKCk7XG4gICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZCA9IGRhZW1vbkNvbm5lY3Rpb24gPyBkYWVtb25Db25uZWN0aW9uLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdHJ1ZTtcbiAgICBcbiAgICAvLyBsb2FkIHdhc20gbW9kdWxlXG4gICAgbGV0IG1vZHVsZSA9IGF3YWl0IExpYnJhcnlVdGlscy5sb2FkRnVsbE1vZHVsZSgpO1xuICAgIFxuICAgIC8vIGNyZWF0ZSB3YWxsZXQgaW4gcXVldWVcbiAgICBsZXQgd2FsbGV0ID0gYXdhaXQgbW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgLy8gcmVnaXN0ZXIgZm4gaW5mb3JtaW5nIGlmIHVuYXV0aG9yaXplZCByZXFzIHNob3VsZCBiZSByZWplY3RlZFxuICAgICAgICBsZXQgcmVqZWN0VW5hdXRob3JpemVkRm5JZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnNldFJlamVjdFVuYXV0aG9yaXplZEZuKHJlamVjdFVuYXV0aG9yaXplZEZuSWQsICgpID0+IHJlamVjdFVuYXV0aG9yaXplZCk7XG4gICAgICBcbiAgICAgICAgLy8gY3JlYXRlIHdhbGxldCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIG1vZHVsZS5jcmVhdGVfZnVsbF93YWxsZXQoSlNPTi5zdHJpbmdpZnkoY29uZmlnLnRvSnNvbigpKSwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCwgYXN5bmMgKGNwcEFkZHJlc3MpID0+IHtcbiAgICAgICAgICBpZiAodHlwZW9mIGNwcEFkZHJlc3MgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoY3BwQWRkcmVzcykpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvV2FsbGV0RnVsbChjcHBBZGRyZXNzLCBjb25maWcuZ2V0UGF0aCgpLCBjb25maWcuZ2V0UGFzc3dvcmQoKSwgY29uZmlnLmdldEZzKCksIGNvbmZpZy5nZXRTZXJ2ZXIoKSA/IGNvbmZpZy5nZXRTZXJ2ZXIoKS5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHVuZGVmaW5lZCwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIFxuICAgIC8vIHNhdmUgd2FsbGV0XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkpIGF3YWl0IHdhbGxldC5zYXZlKCk7XG4gICAgcmV0dXJuIHdhbGxldDtcbiAgfVxuICBcbiAgc3RhdGljIGFzeW5jIGdldFNlZWRMYW5ndWFnZXMoKSB7XG4gICAgbGV0IG1vZHVsZSA9IGF3YWl0IExpYnJhcnlVdGlscy5sb2FkRnVsbE1vZHVsZSgpO1xuICAgIHJldHVybiBtb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBKU09OLnBhcnNlKG1vZHVsZS5nZXRfa2V5c193YWxsZXRfc2VlZF9sYW5ndWFnZXMoKSkubGFuZ3VhZ2VzO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGdldEZzKCkge1xuICAgIGlmICghTW9uZXJvV2FsbGV0RnVsbC5GUykgTW9uZXJvV2FsbGV0RnVsbC5GUyA9IEdlblV0aWxzLmlzQnJvd3NlcigpID8gbWVtZnMuZnMucHJvbWlzZXMgOiBmcy5wcm9taXNlcztcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5GUztcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tIFdBTExFVCBNRVRIT0RTIFNQRUNJRklDIFRPIFdBU00gSU1QTEVNRU5UQVRJT04gLS0tLS0tLS0tLS0tLS1cblxuICAvLyBUT0RPOiBtb3ZlIHRoZXNlIHRvIE1vbmVyb1dhbGxldC50cywgb3RoZXJzIGNhbiBiZSB1bnN1cHBvcnRlZFxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgbWF4aW11bSBoZWlnaHQgb2YgdGhlIHBlZXJzIHRoZSB3YWxsZXQncyBkYWVtb24gaXMgY29ubmVjdGVkIHRvLlxuICAgKlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlcj59IHRoZSBtYXhpbXVtIGhlaWdodCBvZiB0aGUgcGVlcnMgdGhlIHdhbGxldCdzIGRhZW1vbiBpcyBjb25uZWN0ZWQgdG9cbiAgICovXG4gIGFzeW5jIGdldERhZW1vbk1heFBlZXJIZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldERhZW1vbk1heFBlZXJIZWlnaHQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgXG4gICAgICAgIC8vIGNhbGwgd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfZGFlbW9uX21heF9wZWVyX2hlaWdodCh0aGlzLmNwcEFkZHJlc3MsIChyZXNwKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgd2FsbGV0J3MgZGFlbW9uIGlzIHN5bmNlZCB3aXRoIHRoZSBuZXR3b3JrLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiB0aGUgZGFlbW9uIGlzIHN5bmNlZCB3aXRoIHRoZSBuZXR3b3JrLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzRGFlbW9uU3luY2VkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaXNEYWVtb25TeW5jZWQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgXG4gICAgICAgIC8vIGNhbGwgd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICB0aGlzLm1vZHVsZS5pc19kYWVtb25fc3luY2VkKHRoaXMuY3BwQWRkcmVzcywgKHJlc3ApID0+IHtcbiAgICAgICAgICByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSB3YWxsZXQgaXMgc3luY2VkIHdpdGggdGhlIGRhZW1vbi5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgdGhlIHdhbGxldCBpcyBzeW5jZWQgd2l0aCB0aGUgZGFlbW9uLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzU3luY2VkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaXNTeW5jZWQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5pc19zeW5jZWQodGhpcy5jcHBBZGRyZXNzLCAocmVzcCkgPT4ge1xuICAgICAgICAgIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIG5ldHdvcmsgdHlwZSAobWFpbm5ldCwgdGVzdG5ldCwgb3Igc3RhZ2VuZXQpLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9OZXR3b3JrVHlwZT59IHRoZSB3YWxsZXQncyBuZXR3b3JrIHR5cGVcbiAgICovXG4gIGFzeW5jIGdldE5ldHdvcmtUeXBlKCk6IFByb21pc2U8TW9uZXJvTmV0d29ya1R5cGU+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldE5ldHdvcmtUeXBlKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLmdldF9uZXR3b3JrX3R5cGUodGhpcy5jcHBBZGRyZXNzKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgaGVpZ2h0IG9mIHRoZSBmaXJzdCBibG9jayB0aGF0IHRoZSB3YWxsZXQgc2NhbnMuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlcj59IHRoZSBoZWlnaHQgb2YgdGhlIGZpcnN0IGJsb2NrIHRoYXQgdGhlIHdhbGxldCBzY2Fuc1xuICAgKi9cbiAgYXN5bmMgZ2V0UmVzdG9yZUhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0UmVzdG9yZUhlaWdodCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5nZXRfcmVzdG9yZV9oZWlnaHQodGhpcy5jcHBBZGRyZXNzKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNldCB0aGUgaGVpZ2h0IG9mIHRoZSBmaXJzdCBibG9jayB0aGF0IHRoZSB3YWxsZXQgc2NhbnMuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gcmVzdG9yZUhlaWdodCAtIGhlaWdodCBvZiB0aGUgZmlyc3QgYmxvY2sgdGhhdCB0aGUgd2FsbGV0IHNjYW5zXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzZXRSZXN0b3JlSGVpZ2h0KHJlc3RvcmVIZWlnaHQ6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2V0UmVzdG9yZUhlaWdodChyZXN0b3JlSGVpZ2h0KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0aGlzLm1vZHVsZS5zZXRfcmVzdG9yZV9oZWlnaHQodGhpcy5jcHBBZGRyZXNzLCByZXN0b3JlSGVpZ2h0KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIE1vdmUgdGhlIHdhbGxldCBmcm9tIGl0cyBjdXJyZW50IHBhdGggdG8gdGhlIGdpdmVuIHBhdGguXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIHRoZSB3YWxsZXQncyBkZXN0aW5hdGlvbiBwYXRoXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBtb3ZlVG8ocGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5tb3ZlVG8ocGF0aCk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwubW92ZVRvKHBhdGgsIHRoaXMpO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBDT01NT04gV0FMTEVUIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgYXN5bmMgYWRkTGlzdGVuZXIobGlzdGVuZXI6IE1vbmVyb1dhbGxldExpc3RlbmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgYXdhaXQgc3VwZXIuYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICB9XG4gIFxuICBhc3luYyByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkucmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIGF3YWl0IHN1cGVyLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgfVxuICBcbiAgZ2V0TGlzdGVuZXJzKCk6IE1vbmVyb1dhbGxldExpc3RlbmVyW10ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0TGlzdGVuZXJzKCk7XG4gICAgcmV0dXJuIHN1cGVyLmdldExpc3RlbmVycygpO1xuICB9XG4gIFxuICBhc3luYyBzZXREYWVtb25Db25uZWN0aW9uKHVyaU9yQ29ubmVjdGlvbj86IE1vbmVyb1JwY0Nvbm5lY3Rpb24gfCBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNldERhZW1vbkNvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uKTtcbiAgICBcbiAgICAvLyBub3JtYWxpemUgY29ubmVjdGlvblxuICAgIGxldCBjb25uZWN0aW9uID0gIXVyaU9yQ29ubmVjdGlvbiA/IHVuZGVmaW5lZCA6IHVyaU9yQ29ubmVjdGlvbiBpbnN0YW5jZW9mIE1vbmVyb1JwY0Nvbm5lY3Rpb24gPyB1cmlPckNvbm5lY3Rpb24gOiBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih1cmlPckNvbm5lY3Rpb24pO1xuICAgIGxldCB1cmkgPSBjb25uZWN0aW9uICYmIGNvbm5lY3Rpb24uZ2V0VXJpKCkgPyBjb25uZWN0aW9uLmdldFVyaSgpIDogXCJcIjtcbiAgICBsZXQgdXNlcm5hbWUgPSBjb25uZWN0aW9uICYmIGNvbm5lY3Rpb24uZ2V0VXNlcm5hbWUoKSA/IGNvbm5lY3Rpb24uZ2V0VXNlcm5hbWUoKSA6IFwiXCI7XG4gICAgbGV0IHBhc3N3b3JkID0gY29ubmVjdGlvbiAmJiBjb25uZWN0aW9uLmdldFBhc3N3b3JkKCkgPyBjb25uZWN0aW9uLmdldFBhc3N3b3JkKCkgOiBcIlwiO1xuICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWQgPSBjb25uZWN0aW9uID8gY29ubmVjdGlvbi5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHVuZGVmaW5lZDtcbiAgICB0aGlzLnJlamVjdFVuYXV0aG9yaXplZCA9IHJlamVjdFVuYXV0aG9yaXplZDsgIC8vIHBlcnNpc3QgbG9jYWxseVxuICAgIFxuICAgIC8vIHNldCBjb25uZWN0aW9uIGluIHF1ZXVlXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuc2V0X2RhZW1vbl9jb25uZWN0aW9uKHRoaXMuY3BwQWRkcmVzcywgdXJpLCB1c2VybmFtZSwgcGFzc3dvcmQsIChyZXNwKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXREYWVtb25Db25uZWN0aW9uKCk6IFByb21pc2U8TW9uZXJvUnBjQ29ubmVjdGlvbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0RGFlbW9uQ29ubmVjdGlvbigpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGxldCBjb25uZWN0aW9uQ29udGFpbmVyU3RyID0gdGhpcy5tb2R1bGUuZ2V0X2RhZW1vbl9jb25uZWN0aW9uKHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgICAgIGlmICghY29ubmVjdGlvbkNvbnRhaW5lclN0cikgcmVzb2x2ZSh1bmRlZmluZWQpO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBsZXQganNvbkNvbm5lY3Rpb24gPSBKU09OLnBhcnNlKGNvbm5lY3Rpb25Db250YWluZXJTdHIpO1xuICAgICAgICAgIHJlc29sdmUobmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24oe3VyaToganNvbkNvbm5lY3Rpb24udXJpLCB1c2VybmFtZToganNvbkNvbm5lY3Rpb24udXNlcm5hbWUsIHBhc3N3b3JkOiBqc29uQ29ubmVjdGlvbi5wYXNzd29yZCwgcmVqZWN0VW5hdXRob3JpemVkOiB0aGlzLnJlamVjdFVuYXV0aG9yaXplZH0pKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzQ29ubmVjdGVkVG9EYWVtb24oKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pc0Nvbm5lY3RlZFRvRGFlbW9uKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuaXNfY29ubmVjdGVkX3RvX2RhZW1vbih0aGlzLmNwcEFkZHJlc3MsIChyZXNwKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VmVyc2lvbigpOiBQcm9taXNlPE1vbmVyb1ZlcnNpb24+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFZlcnNpb24oKTtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBhdGgoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFBhdGgoKTtcbiAgICByZXR1cm4gdGhpcy5wYXRoO1xuICB9XG4gIFxuICBhc3luYyBnZXRJbnRlZ3JhdGVkQWRkcmVzcyhzdGFuZGFyZEFkZHJlc3M/OiBzdHJpbmcsIHBheW1lbnRJZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEludGVncmF0ZWRBZGRyZXNzKHN0YW5kYXJkQWRkcmVzcywgcGF5bWVudElkKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gdGhpcy5tb2R1bGUuZ2V0X2ludGVncmF0ZWRfYWRkcmVzcyh0aGlzLmNwcEFkZHJlc3MsIHN0YW5kYXJkQWRkcmVzcyA/IHN0YW5kYXJkQWRkcmVzcyA6IFwiXCIsIHBheW1lbnRJZCA/IHBheW1lbnRJZCA6IFwiXCIpO1xuICAgICAgICBpZiAocmVzdWx0LmNoYXJBdCgwKSAhPT0gXCJ7XCIpIHRocm93IG5ldyBNb25lcm9FcnJvcihyZXN1bHQpO1xuICAgICAgICByZXR1cm4gbmV3IE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzKEpTT04ucGFyc2UocmVzdWx0KSk7XG4gICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICBpZiAoZXJyLm1lc3NhZ2UuaW5jbHVkZXMoXCJJbnZhbGlkIHBheW1lbnQgSURcIikpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkludmFsaWQgcGF5bWVudCBJRDogXCIgKyBwYXltZW50SWQpO1xuICAgICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZXJyLm1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyhpbnRlZ3JhdGVkQWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3MpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGxldCByZXN1bHQgPSB0aGlzLm1vZHVsZS5kZWNvZGVfaW50ZWdyYXRlZF9hZGRyZXNzKHRoaXMuY3BwQWRkcmVzcywgaW50ZWdyYXRlZEFkZHJlc3MpO1xuICAgICAgICBpZiAocmVzdWx0LmNoYXJBdCgwKSAhPT0gXCJ7XCIpIHRocm93IG5ldyBNb25lcm9FcnJvcihyZXN1bHQpO1xuICAgICAgICByZXR1cm4gbmV3IE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzKEpTT04ucGFyc2UocmVzdWx0KSk7XG4gICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZXJyLm1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRIZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEhlaWdodCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmdldF9oZWlnaHQodGhpcy5jcHBBZGRyZXNzLCAocmVzcCkgPT4ge1xuICAgICAgICAgIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldERhZW1vbkhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0RGFlbW9uSGVpZ2h0KCk7XG4gICAgaWYgKCFhd2FpdCB0aGlzLmlzQ29ubmVjdGVkVG9EYWVtb24oKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGlzIG5vdCBjb25uZWN0ZWQgdG8gZGFlbW9uXCIpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmdldF9kYWVtb25faGVpZ2h0KHRoaXMuY3BwQWRkcmVzcywgKHJlc3ApID0+IHtcbiAgICAgICAgICByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRIZWlnaHRCeURhdGUoeWVhcjogbnVtYmVyLCBtb250aDogbnVtYmVyLCBkYXk6IG51bWJlcik6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRIZWlnaHRCeURhdGUoeWVhciwgbW9udGgsIGRheSk7XG4gICAgaWYgKCFhd2FpdCB0aGlzLmlzQ29ubmVjdGVkVG9EYWVtb24oKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGlzIG5vdCBjb25uZWN0ZWQgdG8gZGFlbW9uXCIpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmdldF9oZWlnaHRfYnlfZGF0ZSh0aGlzLmNwcEFkZHJlc3MsIHllYXIsIG1vbnRoLCBkYXksIChyZXNwKSA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiByZXNwID09PSBcInN0cmluZ1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTeW5jaHJvbml6ZSB0aGUgd2FsbGV0IHdpdGggdGhlIGRhZW1vbiBhcyBhIG9uZS10aW1lIHN5bmNocm9ub3VzIHByb2Nlc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1dhbGxldExpc3RlbmVyfG51bWJlcn0gW2xpc3RlbmVyT3JTdGFydEhlaWdodF0gLSBsaXN0ZW5lciB4b3Igc3RhcnQgaGVpZ2h0IChkZWZhdWx0cyB0byBubyBzeW5jIGxpc3RlbmVyLCB0aGUgbGFzdCBzeW5jZWQgYmxvY2spXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbc3RhcnRIZWlnaHRdIC0gc3RhcnRIZWlnaHQgaWYgbm90IGdpdmVuIGluIGZpcnN0IGFyZyAoZGVmYXVsdHMgdG8gbGFzdCBzeW5jZWQgYmxvY2spXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2FsbG93Q29uY3VycmVudENhbGxzXSAtIGFsbG93IG90aGVyIHdhbGxldCBtZXRob2RzIHRvIGJlIHByb2Nlc3NlZCBzaW11bHRhbmVvdXNseSBkdXJpbmcgc3luYyAoZGVmYXVsdCBmYWxzZSk8YnI+PGJyPjxiPldBUk5JTkc8L2I+OiBlbmFibGluZyB0aGlzIG9wdGlvbiB3aWxsIGNyYXNoIHdhbGxldCBleGVjdXRpb24gaWYgYW5vdGhlciBjYWxsIG1ha2VzIGEgc2ltdWx0YW5lb3VzIG5ldHdvcmsgcmVxdWVzdC4gVE9ETzogcG9zc2libGUgdG8gc3luYyB3YXNtIG5ldHdvcmsgcmVxdWVzdHMgaW4gaHR0cF9jbGllbnRfd2FzbS5jcHA/IFxuICAgKi9cbiAgYXN5bmMgc3luYyhsaXN0ZW5lck9yU3RhcnRIZWlnaHQ/OiBNb25lcm9XYWxsZXRMaXN0ZW5lciB8IG51bWJlciwgc3RhcnRIZWlnaHQ/OiBudW1iZXIsIGFsbG93Q29uY3VycmVudENhbGxzID0gZmFsc2UpOiBQcm9taXNlPE1vbmVyb1N5bmNSZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN5bmMobGlzdGVuZXJPclN0YXJ0SGVpZ2h0LCBzdGFydEhlaWdodCwgYWxsb3dDb25jdXJyZW50Q2FsbHMpO1xuICAgIGlmICghYXdhaXQgdGhpcy5pc0Nvbm5lY3RlZFRvRGFlbW9uKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBpcyBub3QgY29ubmVjdGVkIHRvIGRhZW1vblwiKTtcbiAgICBcbiAgICAvLyBub3JtYWxpemUgcGFyYW1zXG4gICAgc3RhcnRIZWlnaHQgPSBsaXN0ZW5lck9yU3RhcnRIZWlnaHQgPT09IHVuZGVmaW5lZCB8fCBsaXN0ZW5lck9yU3RhcnRIZWlnaHQgaW5zdGFuY2VvZiBNb25lcm9XYWxsZXRMaXN0ZW5lciA/IHN0YXJ0SGVpZ2h0IDogbGlzdGVuZXJPclN0YXJ0SGVpZ2h0O1xuICAgIGxldCBsaXN0ZW5lciA9IGxpc3RlbmVyT3JTdGFydEhlaWdodCBpbnN0YW5jZW9mIE1vbmVyb1dhbGxldExpc3RlbmVyID8gbGlzdGVuZXJPclN0YXJ0SGVpZ2h0IDogdW5kZWZpbmVkO1xuICAgIGlmIChzdGFydEhlaWdodCA9PT0gdW5kZWZpbmVkKSBzdGFydEhlaWdodCA9IE1hdGgubWF4KGF3YWl0IHRoaXMuZ2V0SGVpZ2h0KCksIGF3YWl0IHRoaXMuZ2V0UmVzdG9yZUhlaWdodCgpKTtcbiAgICBcbiAgICAvLyByZWdpc3RlciBsaXN0ZW5lciBpZiBnaXZlblxuICAgIGlmIChsaXN0ZW5lcikgYXdhaXQgdGhpcy5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgXG4gICAgLy8gc3luYyB3YWxsZXRcbiAgICBsZXQgZXJyO1xuICAgIGxldCByZXN1bHQ7XG4gICAgdHJ5IHtcbiAgICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICAgIHJlc3VsdCA9IGF3YWl0IChhbGxvd0NvbmN1cnJlbnRDYWxscyA/IHN5bmNXYXNtKCkgOiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4gc3luY1dhc20oKSkpO1xuICAgICAgZnVuY3Rpb24gc3luY1dhc20oKSB7XG4gICAgICAgIHRoYXQuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAgIC8vIHN5bmMgd2FsbGV0IGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgICB0aGF0Lm1vZHVsZS5zeW5jKHRoYXQuY3BwQWRkcmVzcywgc3RhcnRIZWlnaHQsIGFzeW5jIChyZXNwKSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzcC5jaGFyQXQoMCkgIT09IFwie1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKTtcbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBsZXQgcmVzcEpzb24gPSBKU09OLnBhcnNlKHJlc3ApO1xuICAgICAgICAgICAgICByZXNvbHZlKG5ldyBNb25lcm9TeW5jUmVzdWx0KHJlc3BKc29uLm51bUJsb2Nrc0ZldGNoZWQsIHJlc3BKc29uLnJlY2VpdmVkTW9uZXkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZXJyID0gZTtcbiAgICB9XG4gICAgXG4gICAgLy8gdW5yZWdpc3RlciBsaXN0ZW5lclxuICAgIGlmIChsaXN0ZW5lcikgYXdhaXQgdGhpcy5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgXG4gICAgLy8gdGhyb3cgZXJyb3Igb3IgcmV0dXJuXG4gICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgXG4gIGFzeW5jIHN0YXJ0U3luY2luZyhzeW5jUGVyaW9kSW5Ncz86IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3RhcnRTeW5jaW5nKHN5bmNQZXJpb2RJbk1zKTtcbiAgICBpZiAoIWF3YWl0IHRoaXMuaXNDb25uZWN0ZWRUb0RhZW1vbigpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgaXMgbm90IGNvbm5lY3RlZCB0byBkYWVtb25cIik7XG4gICAgdGhpcy5zeW5jUGVyaW9kSW5NcyA9IHN5bmNQZXJpb2RJbk1zID09PSB1bmRlZmluZWQgPyBNb25lcm9XYWxsZXRGdWxsLkRFRkFVTFRfU1lOQ19QRVJJT0RfSU5fTVMgOiBzeW5jUGVyaW9kSW5NcztcbiAgICBpZiAoIXRoaXMuc3luY0xvb3BlcikgdGhpcy5zeW5jTG9vcGVyID0gbmV3IFRhc2tMb29wZXIoYXN5bmMgKCkgPT4gYXdhaXQgdGhpcy5iYWNrZ3JvdW5kU3luYygpKVxuICAgIHRoaXMuc3luY0xvb3Blci5zdGFydCh0aGlzLnN5bmNQZXJpb2RJbk1zKTtcbiAgfVxuICAgIFxuICBhc3luYyBzdG9wU3luY2luZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN0b3BTeW5jaW5nKCk7XG4gICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICBpZiAodGhpcy5zeW5jTG9vcGVyKSB0aGlzLnN5bmNMb29wZXIuc3RvcCgpO1xuICAgIHRoaXMubW9kdWxlLnN0b3Bfc3luY2luZyh0aGlzLmNwcEFkZHJlc3MpOyAvLyB0YXNrIGlzIG5vdCBxdWV1ZWQgc28gd2FsbGV0IHN0b3BzIGltbWVkaWF0ZWx5XG4gIH1cbiAgXG4gIGFzeW5jIHNjYW5UeHModHhIYXNoZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zY2FuVHhzKHR4SGFzaGVzKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5zY2FuX3R4cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHt0eEhhc2hlczogdHhIYXNoZXN9KSwgKGVycikgPT4ge1xuICAgICAgICAgIGlmIChlcnIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoZXJyKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2NhblNwZW50KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkucmVzY2FuU3BlbnQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5yZXNjYW5fc3BlbnQodGhpcy5jcHBBZGRyZXNzLCAoKSA9PiByZXNvbHZlKCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2NhbkJsb2NrY2hhaW4oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5yZXNjYW5CbG9ja2NoYWluKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUucmVzY2FuX2Jsb2NrY2hhaW4odGhpcy5jcHBBZGRyZXNzLCAoKSA9PiByZXNvbHZlKCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJhbGFuY2UoYWNjb3VudElkeD86IG51bWJlciwgc3ViYWRkcmVzc0lkeD86IG51bWJlcik6IFByb21pc2U8YmlnaW50PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRCYWxhbmNlKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIFxuICAgICAgLy8gZ2V0IGJhbGFuY2UgZW5jb2RlZCBpbiBqc29uIHN0cmluZ1xuICAgICAgbGV0IGJhbGFuY2VTdHI7XG4gICAgICBpZiAoYWNjb3VudElkeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGFzc2VydChzdWJhZGRyZXNzSWR4ID09PSB1bmRlZmluZWQsIFwiU3ViYWRkcmVzcyBpbmRleCBtdXN0IGJlIHVuZGVmaW5lZCBpZiBhY2NvdW50IGluZGV4IGlzIHVuZGVmaW5lZFwiKTtcbiAgICAgICAgYmFsYW5jZVN0ciA9IHRoaXMubW9kdWxlLmdldF9iYWxhbmNlX3dhbGxldCh0aGlzLmNwcEFkZHJlc3MpO1xuICAgICAgfSBlbHNlIGlmIChzdWJhZGRyZXNzSWR4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYmFsYW5jZVN0ciA9IHRoaXMubW9kdWxlLmdldF9iYWxhbmNlX2FjY291bnQodGhpcy5jcHBBZGRyZXNzLCBhY2NvdW50SWR4KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJhbGFuY2VTdHIgPSB0aGlzLm1vZHVsZS5nZXRfYmFsYW5jZV9zdWJhZGRyZXNzKHRoaXMuY3BwQWRkcmVzcywgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIHBhcnNlIGpzb24gc3RyaW5nIHRvIGJpZ2ludFxuICAgICAgcmV0dXJuIEJpZ0ludChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMoYmFsYW5jZVN0cikpLmJhbGFuY2UpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRVbmxvY2tlZEJhbGFuY2UoYWNjb3VudElkeD86IG51bWJlciwgc3ViYWRkcmVzc0lkeD86IG51bWJlcik6IFByb21pc2U8YmlnaW50PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRVbmxvY2tlZEJhbGFuY2UoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgXG4gICAgICAvLyBnZXQgYmFsYW5jZSBlbmNvZGVkIGluIGpzb24gc3RyaW5nXG4gICAgICBsZXQgdW5sb2NrZWRCYWxhbmNlU3RyO1xuICAgICAgaWYgKGFjY291bnRJZHggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBhc3NlcnQoc3ViYWRkcmVzc0lkeCA9PT0gdW5kZWZpbmVkLCBcIlN1YmFkZHJlc3MgaW5kZXggbXVzdCBiZSB1bmRlZmluZWQgaWYgYWNjb3VudCBpbmRleCBpcyB1bmRlZmluZWRcIik7XG4gICAgICAgIHVubG9ja2VkQmFsYW5jZVN0ciA9IHRoaXMubW9kdWxlLmdldF91bmxvY2tlZF9iYWxhbmNlX3dhbGxldCh0aGlzLmNwcEFkZHJlc3MpO1xuICAgICAgfSBlbHNlIGlmIChzdWJhZGRyZXNzSWR4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdW5sb2NrZWRCYWxhbmNlU3RyID0gdGhpcy5tb2R1bGUuZ2V0X3VubG9ja2VkX2JhbGFuY2VfYWNjb3VudCh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdW5sb2NrZWRCYWxhbmNlU3RyID0gdGhpcy5tb2R1bGUuZ2V0X3VubG9ja2VkX2JhbGFuY2Vfc3ViYWRkcmVzcyh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBwYXJzZSBqc29uIHN0cmluZyB0byBiaWdpbnRcbiAgICAgIHJldHVybiBCaWdJbnQoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHVubG9ja2VkQmFsYW5jZVN0cikpLnVubG9ja2VkQmFsYW5jZSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFjY291bnRzKGluY2x1ZGVTdWJhZGRyZXNzZXM/OiBib29sZWFuLCB0YWc/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0FjY291bnRbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0QWNjb3VudHMoaW5jbHVkZVN1YmFkZHJlc3NlcywgdGFnKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgYWNjb3VudHNTdHIgPSB0aGlzLm1vZHVsZS5nZXRfYWNjb3VudHModGhpcy5jcHBBZGRyZXNzLCBpbmNsdWRlU3ViYWRkcmVzc2VzID8gdHJ1ZSA6IGZhbHNlLCB0YWcgPyB0YWcgOiBcIlwiKTtcbiAgICAgIGxldCBhY2NvdW50cyA9IFtdO1xuICAgICAgZm9yIChsZXQgYWNjb3VudEpzb24gb2YgSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKGFjY291bnRzU3RyKSkuYWNjb3VudHMpIHtcbiAgICAgICAgYWNjb3VudHMucHVzaChNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplQWNjb3VudChuZXcgTW9uZXJvQWNjb3VudChhY2NvdW50SnNvbikpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhY2NvdW50cztcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudChhY2NvdW50SWR4OiBudW1iZXIsIGluY2x1ZGVTdWJhZGRyZXNzZXM/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9BY2NvdW50PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRBY2NvdW50KGFjY291bnRJZHgsIGluY2x1ZGVTdWJhZGRyZXNzZXMpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCBhY2NvdW50U3RyID0gdGhpcy5tb2R1bGUuZ2V0X2FjY291bnQodGhpcy5jcHBBZGRyZXNzLCBhY2NvdW50SWR4LCBpbmNsdWRlU3ViYWRkcmVzc2VzID8gdHJ1ZSA6IGZhbHNlKTtcbiAgICAgIGxldCBhY2NvdW50SnNvbiA9IEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhhY2NvdW50U3RyKSk7XG4gICAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZUFjY291bnQobmV3IE1vbmVyb0FjY291bnQoYWNjb3VudEpzb24pKTtcbiAgICB9KTtcblxuICB9XG4gIFxuICBhc3luYyBjcmVhdGVBY2NvdW50KGxhYmVsPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9BY2NvdW50PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jcmVhdGVBY2NvdW50KGxhYmVsKTtcbiAgICBpZiAobGFiZWwgPT09IHVuZGVmaW5lZCkgbGFiZWwgPSBcIlwiO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCBhY2NvdW50U3RyID0gdGhpcy5tb2R1bGUuY3JlYXRlX2FjY291bnQodGhpcy5jcHBBZGRyZXNzLCBsYWJlbCk7XG4gICAgICBsZXQgYWNjb3VudEpzb24gPSBKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMoYWNjb3VudFN0cikpO1xuICAgICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuc2FuaXRpemVBY2NvdW50KG5ldyBNb25lcm9BY2NvdW50KGFjY291bnRKc29uKSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJbmRpY2VzPzogbnVtYmVyW10pOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3NbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJbmRpY2VzKTtcbiAgICBsZXQgYXJncyA9IHthY2NvdW50SWR4OiBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSW5kaWNlczogc3ViYWRkcmVzc0luZGljZXMgPT09IHVuZGVmaW5lZCA/IFtdIDogR2VuVXRpbHMubGlzdGlmeShzdWJhZGRyZXNzSW5kaWNlcyl9O1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCBzdWJhZGRyZXNzZXNKc29uID0gSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHRoaXMubW9kdWxlLmdldF9zdWJhZGRyZXNzZXModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeShhcmdzKSkpKS5zdWJhZGRyZXNzZXM7XG4gICAgICBsZXQgc3ViYWRkcmVzc2VzID0gW107XG4gICAgICBmb3IgKGxldCBzdWJhZGRyZXNzSnNvbiBvZiBzdWJhZGRyZXNzZXNKc29uKSBzdWJhZGRyZXNzZXMucHVzaChNb25lcm9XYWxsZXRLZXlzLnNhbml0aXplU3ViYWRkcmVzcyhuZXcgTW9uZXJvU3ViYWRkcmVzcyhzdWJhZGRyZXNzSnNvbikpKTtcbiAgICAgIHJldHVybiBzdWJhZGRyZXNzZXM7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNyZWF0ZVN1YmFkZHJlc3MoYWNjb3VudElkeDogbnVtYmVyLCBsYWJlbD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzcz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuY3JlYXRlU3ViYWRkcmVzcyhhY2NvdW50SWR4LCBsYWJlbCk7XG4gICAgaWYgKGxhYmVsID09PSB1bmRlZmluZWQpIGxhYmVsID0gXCJcIjtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgc3ViYWRkcmVzc1N0ciA9IHRoaXMubW9kdWxlLmNyZWF0ZV9zdWJhZGRyZXNzKHRoaXMuY3BwQWRkcmVzcywgYWNjb3VudElkeCwgbGFiZWwpO1xuICAgICAgbGV0IHN1YmFkZHJlc3NKc29uID0gSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHN1YmFkZHJlc3NTdHIpKTtcbiAgICAgIHJldHVybiBNb25lcm9XYWxsZXRLZXlzLnNhbml0aXplU3ViYWRkcmVzcyhuZXcgTW9uZXJvU3ViYWRkcmVzcyhzdWJhZGRyZXNzSnNvbikpO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgc2V0U3ViYWRkcmVzc0xhYmVsKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0lkeDogbnVtYmVyLCBsYWJlbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zZXRTdWJhZGRyZXNzTGFiZWwoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCwgbGFiZWwpO1xuICAgIGlmIChsYWJlbCA9PT0gdW5kZWZpbmVkKSBsYWJlbCA9IFwiXCI7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdGhpcy5tb2R1bGUuc2V0X3N1YmFkZHJlc3NfbGFiZWwodGhpcy5jcHBBZGRyZXNzLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4LCBsYWJlbCk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4cyhxdWVyeT86IHN0cmluZ1tdIHwgUGFydGlhbDxNb25lcm9UeFF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0VHhzKHF1ZXJ5KTtcblxuICAgIC8vIGNvcHkgYW5kIG5vcm1hbGl6ZSBxdWVyeSB1cCB0byBibG9ja1xuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZCA9IHF1ZXJ5ID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVR4UXVlcnkocXVlcnkpO1xuICAgIFxuICAgIC8vIHNjaGVkdWxlIHRhc2tcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgLy8gY2FsbCB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2tcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X3R4cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHF1ZXJ5Tm9ybWFsaXplZC5nZXRCbG9jaygpLnRvSnNvbigpKSwgKGJsb2Nrc0pzb25TdHIpID0+IHtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBjaGVjayBmb3IgZXJyb3JcbiAgICAgICAgICBpZiAoYmxvY2tzSnNvblN0ci5jaGFyQXQoMCkgIT09IFwie1wiKSB7XG4gICAgICAgICAgICByZWplY3QobmV3IE1vbmVyb0Vycm9yKGJsb2Nrc0pzb25TdHIpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gcmVzb2x2ZSB3aXRoIGRlc2VyaWFsaXplZCB0eHNcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzb2x2ZShNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplVHhzKHF1ZXJ5Tm9ybWFsaXplZCwgYmxvY2tzSnNvblN0cikpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRUcmFuc2ZlcnMocXVlcnk/OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KTogUHJvbWlzZTxNb25lcm9UcmFuc2ZlcltdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRUcmFuc2ZlcnMocXVlcnkpO1xuICAgIFxuICAgIC8vIGNvcHkgYW5kIG5vcm1hbGl6ZSBxdWVyeSB1cCB0byBibG9ja1xuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVUcmFuc2ZlclF1ZXJ5KHF1ZXJ5KTtcbiAgICBcbiAgICAvLyByZXR1cm4gcHJvbWlzZSB3aGljaCByZXNvbHZlcyBvbiBjYWxsYmFja1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyBjYWxsIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFja1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfdHJhbnNmZXJzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkocXVlcnlOb3JtYWxpemVkLmdldFR4UXVlcnkoKS5nZXRCbG9jaygpLnRvSnNvbigpKSwgKGJsb2Nrc0pzb25TdHIpID0+IHtcbiAgICAgICAgICAgIFxuICAgICAgICAgIC8vIGNoZWNrIGZvciBlcnJvclxuICAgICAgICAgIGlmIChibG9ja3NKc29uU3RyLmNoYXJBdCgwKSAhPT0gXCJ7XCIpIHtcbiAgICAgICAgICAgIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoYmxvY2tzSnNvblN0cikpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICAgXG4gICAgICAgICAgLy8gcmVzb2x2ZSB3aXRoIGRlc2VyaWFsaXplZCB0cmFuc2ZlcnMgXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlc29sdmUoTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZVRyYW5zZmVycyhxdWVyeU5vcm1hbGl6ZWQsIGJsb2Nrc0pzb25TdHIpKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0T3V0cHV0cyhxdWVyeT86IFBhcnRpYWw8TW9uZXJvT3V0cHV0UXVlcnk+KTogUHJvbWlzZTxNb25lcm9PdXRwdXRXYWxsZXRbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0T3V0cHV0cyhxdWVyeSk7XG4gICAgXG4gICAgLy8gY29weSBhbmQgbm9ybWFsaXplIHF1ZXJ5IHVwIHRvIGJsb2NrXG4gICAgY29uc3QgcXVlcnlOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZU91dHB1dFF1ZXJ5KHF1ZXJ5KTtcbiAgICBcbiAgICAvLyByZXR1cm4gcHJvbWlzZSB3aGljaCByZXNvbHZlcyBvbiBjYWxsYmFja1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PntcbiAgICAgICAgXG4gICAgICAgIC8vIGNhbGwgd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrXG4gICAgICAgIHRoaXMubW9kdWxlLmdldF9vdXRwdXRzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkocXVlcnlOb3JtYWxpemVkLmdldFR4UXVlcnkoKS5nZXRCbG9jaygpLnRvSnNvbigpKSwgKGJsb2Nrc0pzb25TdHIpID0+IHtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBjaGVjayBmb3IgZXJyb3JcbiAgICAgICAgICBpZiAoYmxvY2tzSnNvblN0ci5jaGFyQXQoMCkgIT09IFwie1wiKSB7XG4gICAgICAgICAgICByZWplY3QobmV3IE1vbmVyb0Vycm9yKGJsb2Nrc0pzb25TdHIpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gcmVzb2x2ZSB3aXRoIGRlc2VyaWFsaXplZCBvdXRwdXRzXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlc29sdmUoTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZU91dHB1dHMocXVlcnlOb3JtYWxpemVkLCBibG9ja3NKc29uU3RyKSk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydE91dHB1dHMoYWxsID0gZmFsc2UpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZXhwb3J0T3V0cHV0cyhhbGwpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmV4cG9ydF9vdXRwdXRzKHRoaXMuY3BwQWRkcmVzcywgYWxsLCAob3V0cHV0c0hleCkgPT4gcmVzb2x2ZShvdXRwdXRzSGV4KSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgaW1wb3J0T3V0cHV0cyhvdXRwdXRzSGV4OiBzdHJpbmcpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaW1wb3J0T3V0cHV0cyhvdXRwdXRzSGV4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5pbXBvcnRfb3V0cHV0cyh0aGlzLmNwcEFkZHJlc3MsIG91dHB1dHNIZXgsIChudW1JbXBvcnRlZCkgPT4gcmVzb2x2ZShudW1JbXBvcnRlZCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydEtleUltYWdlcyhhbGwgPSBmYWxzZSk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZXhwb3J0S2V5SW1hZ2VzKGFsbCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZXhwb3J0X2tleV9pbWFnZXModGhpcy5jcHBBZGRyZXNzLCBhbGwsIChrZXlJbWFnZXNTdHIpID0+IHtcbiAgICAgICAgICBpZiAoa2V5SW1hZ2VzU3RyLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKGtleUltYWdlc1N0cikpOyAvLyBqc29uIGV4cGVjdGVkLCBlbHNlIGVycm9yXG4gICAgICAgICAgbGV0IGtleUltYWdlcyA9IFtdO1xuICAgICAgICAgIGZvciAobGV0IGtleUltYWdlSnNvbiBvZiBKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMoa2V5SW1hZ2VzU3RyKSkua2V5SW1hZ2VzKSBrZXlJbWFnZXMucHVzaChuZXcgTW9uZXJvS2V5SW1hZ2Uoa2V5SW1hZ2VKc29uKSk7XG4gICAgICAgICAgcmVzb2x2ZShrZXlJbWFnZXMpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRLZXlJbWFnZXMoa2V5SW1hZ2VzOiBNb25lcm9LZXlJbWFnZVtdKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaW1wb3J0S2V5SW1hZ2VzKGtleUltYWdlcyk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuaW1wb3J0X2tleV9pbWFnZXModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7a2V5SW1hZ2VzOiBrZXlJbWFnZXMubWFwKGtleUltYWdlID0+IGtleUltYWdlLnRvSnNvbigpKX0pLCAoa2V5SW1hZ2VJbXBvcnRSZXN1bHRTdHIpID0+IHtcbiAgICAgICAgICByZXNvbHZlKG5ldyBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMoa2V5SW1hZ2VJbXBvcnRSZXN1bHRTdHIpKSkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCgpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlW10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0KCk7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBmcmVlemVPdXRwdXQoa2V5SW1hZ2U6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZnJlZXplT3V0cHV0KGtleUltYWdlKTtcbiAgICBpZiAoIWtleUltYWdlKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHNwZWNpZnkga2V5IGltYWdlIHRvIGZyZWV6ZVwiKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5mcmVlemVfb3V0cHV0KHRoaXMuY3BwQWRkcmVzcywga2V5SW1hZ2UsICgpID0+IHJlc29sdmUoKSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgdGhhd091dHB1dChrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS50aGF3T3V0cHV0KGtleUltYWdlKTtcbiAgICBpZiAoIWtleUltYWdlKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHNwZWNpZnkga2V5IGltYWdlIHRvIHRoYXdcIik7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUudGhhd19vdXRwdXQodGhpcy5jcHBBZGRyZXNzLCBrZXlJbWFnZSwgKCkgPT4gcmVzb2x2ZSgpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBpc091dHB1dEZyb3plbihrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pc091dHB1dEZyb3plbihrZXlJbWFnZSk7XG4gICAgaWYgKCFrZXlJbWFnZSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBzcGVjaWZ5IGtleSBpbWFnZSB0byBjaGVjayBpZiBmcm96ZW5cIik7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuaXNfb3V0cHV0X2Zyb3plbih0aGlzLmNwcEFkZHJlc3MsIGtleUltYWdlLCAocmVzdWx0KSA9PiByZXNvbHZlKHJlc3VsdCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNyZWF0ZVR4cyhjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jcmVhdGVUeHMoY29uZmlnKTtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSwgY29weSwgYW5kIG5vcm1hbGl6ZSBjb25maWdcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyhjb25maWcpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnTm9ybWFsaXplZC5zZXRDYW5TcGxpdCh0cnVlKTtcbiAgICBcbiAgICAvLyBjcmVhdGUgdHhzIGluIHF1ZXVlXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIGNyZWF0ZSB0eHMgaW4gd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICB0aGlzLm1vZHVsZS5jcmVhdGVfdHhzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoY29uZmlnTm9ybWFsaXplZC50b0pzb24oKSksICh0eFNldEpzb25TdHIpID0+IHtcbiAgICAgICAgICBpZiAodHhTZXRKc29uU3RyLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHR4U2V0SnNvblN0cikpOyAvLyBqc29uIGV4cGVjdGVkLCBlbHNlIGVycm9yXG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9UeFNldChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHModHhTZXRKc29uU3RyKSkpLmdldFR4cygpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBPdXRwdXQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN3ZWVwT3V0cHV0KGNvbmZpZyk7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIGFuZCB2YWxpZGF0ZSBjb25maWdcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVN3ZWVwT3V0cHV0Q29uZmlnKGNvbmZpZyk7XG4gICAgXG4gICAgLy8gc3dlZXAgb3V0cHV0IGluIHF1ZXVlXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIHN3ZWVwIG91dHB1dCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIHRoaXMubW9kdWxlLnN3ZWVwX291dHB1dCh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KGNvbmZpZ05vcm1hbGl6ZWQudG9Kc29uKCkpLCAodHhTZXRKc29uU3RyKSA9PiB7XG4gICAgICAgICAgaWYgKHR4U2V0SnNvblN0ci5jaGFyQXQoMCkgIT09ICd7JykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcih0eFNldEpzb25TdHIpKTsgLy8ganNvbiBleHBlY3RlZCwgZWxzZSBlcnJvclxuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvVHhTZXQoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHR4U2V0SnNvblN0cikpKS5nZXRUeHMoKVswXSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBzd2VlcFVubG9ja2VkKGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN3ZWVwVW5sb2NrZWQoY29uZmlnKTtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSBhbmQgbm9ybWFsaXplIGNvbmZpZ1xuICAgIGNvbnN0IGNvbmZpZ05vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplU3dlZXBVbmxvY2tlZENvbmZpZyhjb25maWcpO1xuICAgIFxuICAgIC8vIHN3ZWVwIHVubG9ja2VkIGluIHF1ZXVlXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIHN3ZWVwIHVubG9ja2VkIGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgdGhpcy5tb2R1bGUuc3dlZXBfdW5sb2NrZWQodGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeShjb25maWdOb3JtYWxpemVkLnRvSnNvbigpKSwgKHR4U2V0c0pzb24pID0+IHtcbiAgICAgICAgICBpZiAodHhTZXRzSnNvbi5jaGFyQXQoMCkgIT09ICd7JykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcih0eFNldHNKc29uKSk7IC8vIGpzb24gZXhwZWN0ZWQsIGVsc2UgZXJyb3JcbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGxldCB0eFNldHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAobGV0IHR4U2V0SnNvbiBvZiBKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHModHhTZXRzSnNvbikpLnR4U2V0cykgdHhTZXRzLnB1c2gobmV3IE1vbmVyb1R4U2V0KHR4U2V0SnNvbikpO1xuICAgICAgICAgICAgbGV0IHR4cyA9IFtdO1xuICAgICAgICAgICAgZm9yIChsZXQgdHhTZXQgb2YgdHhTZXRzKSBmb3IgKGxldCB0eCBvZiB0eFNldC5nZXRUeHMoKSkgdHhzLnB1c2godHgpO1xuICAgICAgICAgICAgcmVzb2x2ZSh0eHMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBEdXN0KHJlbGF5PzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3dlZXBEdXN0KHJlbGF5KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgLy8gY2FsbCB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIHRoaXMubW9kdWxlLnN3ZWVwX2R1c3QodGhpcy5jcHBBZGRyZXNzLCByZWxheSwgKHR4U2V0SnNvblN0cikgPT4ge1xuICAgICAgICAgIGlmICh0eFNldEpzb25TdHIuY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IodHhTZXRKc29uU3RyKSk7IC8vIGpzb24gZXhwZWN0ZWQsIGVsc2UgZXJyb3JcbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGxldCB0eFNldCA9IG5ldyBNb25lcm9UeFNldChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHModHhTZXRKc29uU3RyKSkpO1xuICAgICAgICAgICAgaWYgKHR4U2V0LmdldFR4cygpID09PSB1bmRlZmluZWQpIHR4U2V0LnNldFR4cyhbXSk7XG4gICAgICAgICAgICByZXNvbHZlKHR4U2V0LmdldFR4cygpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbGF5VHhzKHR4c09yTWV0YWRhdGFzOiAoTW9uZXJvVHhXYWxsZXQgfCBzdHJpbmcpW10pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5yZWxheVR4cyh0eHNPck1ldGFkYXRhcyk7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkodHhzT3JNZXRhZGF0YXMpLCBcIk11c3QgcHJvdmlkZSBhbiBhcnJheSBvZiB0eHMgb3IgdGhlaXIgbWV0YWRhdGEgdG8gcmVsYXlcIik7XG4gICAgbGV0IHR4TWV0YWRhdGFzID0gW107XG4gICAgZm9yIChsZXQgdHhPck1ldGFkYXRhIG9mIHR4c09yTWV0YWRhdGFzKSB0eE1ldGFkYXRhcy5wdXNoKHR4T3JNZXRhZGF0YSBpbnN0YW5jZW9mIE1vbmVyb1R4V2FsbGV0ID8gdHhPck1ldGFkYXRhLmdldE1ldGFkYXRhKCkgOiB0eE9yTWV0YWRhdGEpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnJlbGF5X3R4cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHt0eE1ldGFkYXRhczogdHhNZXRhZGF0YXN9KSwgKHR4SGFzaGVzSnNvbikgPT4ge1xuICAgICAgICAgIGlmICh0eEhhc2hlc0pzb24uY2hhckF0KDApICE9PSBcIntcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcih0eEhhc2hlc0pzb24pKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoSlNPTi5wYXJzZSh0eEhhc2hlc0pzb24pLnR4SGFzaGVzKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZGVzY3JpYmVUeFNldCh0eFNldDogTW9uZXJvVHhTZXQpOiBQcm9taXNlPE1vbmVyb1R4U2V0PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5kZXNjcmliZVR4U2V0KHR4U2V0KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0eFNldCA9IG5ldyBNb25lcm9UeFNldCh7dW5zaWduZWRUeEhleDogdHhTZXQuZ2V0VW5zaWduZWRUeEhleCgpLCBzaWduZWRUeEhleDogdHhTZXQuZ2V0U2lnbmVkVHhIZXgoKSwgbXVsdGlzaWdUeEhleDogdHhTZXQuZ2V0TXVsdGlzaWdUeEhleCgpfSk7XG4gICAgICB0cnkgeyByZXR1cm4gbmV3IE1vbmVyb1R4U2V0KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyh0aGlzLm1vZHVsZS5kZXNjcmliZV90eF9zZXQodGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh0eFNldC50b0pzb24oKSkpKSkpOyB9XG4gICAgICBjYXRjaCAoZXJyKSB7IHRocm93IG5ldyBNb25lcm9FcnJvcih0aGlzLm1vZHVsZS5nZXRfZXhjZXB0aW9uX21lc3NhZ2UoZXJyKSk7IH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc2lnblR4cyh1bnNpZ25lZFR4SGV4OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1R4U2V0PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zaWduVHhzKHVuc2lnbmVkVHhIZXgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7IHJldHVybiBuZXcgTW9uZXJvVHhTZXQoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHRoaXMubW9kdWxlLnNpZ25fdHhzKHRoaXMuY3BwQWRkcmVzcywgdW5zaWduZWRUeEhleCkpKSk7IH1cbiAgICAgIGNhdGNoIChlcnIpIHsgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHRoaXMubW9kdWxlLmdldF9leGNlcHRpb25fbWVzc2FnZShlcnIpKTsgfVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzdWJtaXRUeHMoc2lnbmVkVHhIZXg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN1Ym1pdFR4cyhzaWduZWRUeEhleCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuc3VibWl0X3R4cyh0aGlzLmNwcEFkZHJlc3MsIHNpZ25lZFR4SGV4LCAocmVzcCkgPT4ge1xuICAgICAgICAgIGlmIChyZXNwLmNoYXJBdCgwKSAhPT0gXCJ7XCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcCkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShKU09OLnBhcnNlKHJlc3ApLnR4SGFzaGVzKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc2lnbk1lc3NhZ2UobWVzc2FnZTogc3RyaW5nLCBzaWduYXR1cmVUeXBlID0gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSwgYWNjb3VudElkeCA9IDAsIHN1YmFkZHJlc3NJZHggPSAwKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNpZ25NZXNzYWdlKG1lc3NhZ2UsIHNpZ25hdHVyZVR5cGUsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpO1xuICAgIFxuICAgIC8vIGFzc2lnbiBkZWZhdWx0c1xuICAgIHNpZ25hdHVyZVR5cGUgPSBzaWduYXR1cmVUeXBlIHx8IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9TUEVORF9LRVk7XG4gICAgYWNjb3VudElkeCA9IGFjY291bnRJZHggfHwgMDtcbiAgICBzdWJhZGRyZXNzSWR4ID0gc3ViYWRkcmVzc0lkeCB8fCAwO1xuICAgIFxuICAgIC8vIHF1ZXVlIHRhc2sgdG8gc2lnbiBtZXNzYWdlXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdHJ5IHsgcmV0dXJuIHRoaXMubW9kdWxlLnNpZ25fbWVzc2FnZSh0aGlzLmNwcEFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZVR5cGUgPT09IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9TUEVORF9LRVkgPyAwIDogMSwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7IH1cbiAgICAgIGNhdGNoIChlcnIpIHsgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHRoaXMubW9kdWxlLmdldF9leGNlcHRpb25fbWVzc2FnZShlcnIpKTsgfVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyB2ZXJpZnlNZXNzYWdlKG1lc3NhZ2U6IHN0cmluZywgYWRkcmVzczogc3RyaW5nLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkudmVyaWZ5TWVzc2FnZShtZXNzYWdlLCBhZGRyZXNzLCBzaWduYXR1cmUpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCByZXN1bHQ7XG4gICAgICB0cnkge1xuICAgICAgICByZXN1bHQgPSBKU09OLnBhcnNlKHRoaXMubW9kdWxlLnZlcmlmeV9tZXNzYWdlKHRoaXMuY3BwQWRkcmVzcywgbWVzc2FnZSwgYWRkcmVzcywgc2lnbmF0dXJlKSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgcmVzdWx0ID0ge2lzR29vZDogZmFsc2V9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0KHJlc3VsdC5pc0dvb2QgP1xuICAgICAgICB7aXNHb29kOiByZXN1bHQuaXNHb29kLCBpc09sZDogcmVzdWx0LmlzT2xkLCBzaWduYXR1cmVUeXBlOiByZXN1bHQuc2lnbmF0dXJlVHlwZSA9PT0gXCJzcGVuZFwiID8gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSA6IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9WSUVXX0tFWSwgdmVyc2lvbjogcmVzdWx0LnZlcnNpb259IDpcbiAgICAgICAge2lzR29vZDogZmFsc2V9XG4gICAgICApO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeEtleSh0eEhhc2g6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRUeEtleSh0eEhhc2gpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7IHJldHVybiB0aGlzLm1vZHVsZS5nZXRfdHhfa2V5KHRoaXMuY3BwQWRkcmVzcywgdHhIYXNoKTsgfVxuICAgICAgY2F0Y2ggKGVycikgeyB0aHJvdyBuZXcgTW9uZXJvRXJyb3IodGhpcy5tb2R1bGUuZ2V0X2V4Y2VwdGlvbl9tZXNzYWdlKGVycikpOyB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrVHhLZXkodHhIYXNoOiBzdHJpbmcsIHR4S2V5OiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tUeD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuY2hlY2tUeEtleSh0eEhhc2gsIHR4S2V5LCBhZGRyZXNzKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7IFxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuY2hlY2tfdHhfa2V5KHRoaXMuY3BwQWRkcmVzcywgdHhIYXNoLCB0eEtleSwgYWRkcmVzcywgKHJlc3BKc29uU3RyKSA9PiB7XG4gICAgICAgICAgaWYgKHJlc3BKc29uU3RyLmNoYXJBdCgwKSAhPT0gXCJ7XCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcEpzb25TdHIpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb0NoZWNrVHgoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHJlc3BKc29uU3RyKSkpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhQcm9vZih0eEhhc2g6IHN0cmluZywgYWRkcmVzczogc3RyaW5nLCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFR4UHJvb2YodHhIYXNoLCBhZGRyZXNzLCBtZXNzYWdlKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfdHhfcHJvb2YodGhpcy5jcHBBZGRyZXNzLCB0eEhhc2ggfHwgXCJcIiwgYWRkcmVzcyB8fCBcIlwiLCBtZXNzYWdlIHx8IFwiXCIsIChzaWduYXR1cmUpID0+IHtcbiAgICAgICAgICBsZXQgZXJyb3JLZXkgPSBcImVycm9yOiBcIjtcbiAgICAgICAgICBpZiAoc2lnbmF0dXJlLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHNpZ25hdHVyZS5zdWJzdHJpbmcoZXJyb3JLZXkubGVuZ3RoKSkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShzaWduYXR1cmUpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBjaGVja1R4UHJvb2YodHhIYXNoOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tUeD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuY2hlY2tUeFByb29mKHR4SGFzaCwgYWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7IFxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuY2hlY2tfdHhfcHJvb2YodGhpcy5jcHBBZGRyZXNzLCB0eEhhc2ggfHwgXCJcIiwgYWRkcmVzcyB8fCBcIlwiLCBtZXNzYWdlIHx8IFwiXCIsIHNpZ25hdHVyZSB8fCBcIlwiLCAocmVzcEpzb25TdHIpID0+IHtcbiAgICAgICAgICBpZiAocmVzcEpzb25TdHIuY2hhckF0KDApICE9PSBcIntcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwSnNvblN0cikpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvQ2hlY2tUeChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMocmVzcEpzb25TdHIpKSkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRTcGVuZFByb29mKHR4SGFzaDogc3RyaW5nLCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFNwZW5kUHJvb2YodHhIYXNoLCBtZXNzYWdlKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfc3BlbmRfcHJvb2YodGhpcy5jcHBBZGRyZXNzLCB0eEhhc2ggfHwgXCJcIiwgbWVzc2FnZSB8fCBcIlwiLCAoc2lnbmF0dXJlKSA9PiB7XG4gICAgICAgICAgbGV0IGVycm9yS2V5ID0gXCJlcnJvcjogXCI7XG4gICAgICAgICAgaWYgKHNpZ25hdHVyZS5pbmRleE9mKGVycm9yS2V5KSA9PT0gMCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihzaWduYXR1cmUuc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCkpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoc2lnbmF0dXJlKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tTcGVuZFByb29mKHR4SGFzaDogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jaGVja1NwZW5kUHJvb2YodHhIYXNoLCBtZXNzYWdlLCBzaWduYXR1cmUpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTsgXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5jaGVja19zcGVuZF9wcm9vZih0aGlzLmNwcEFkZHJlc3MsIHR4SGFzaCB8fCBcIlwiLCBtZXNzYWdlIHx8IFwiXCIsIHNpZ25hdHVyZSB8fCBcIlwiLCAocmVzcCkgPT4ge1xuICAgICAgICAgIHR5cGVvZiByZXNwID09PSBcInN0cmluZ1wiID8gcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwKSkgOiByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRSZXNlcnZlUHJvb2ZXYWxsZXQobWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRSZXNlcnZlUHJvb2ZXYWxsZXQobWVzc2FnZSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X3Jlc2VydmVfcHJvb2Zfd2FsbGV0KHRoaXMuY3BwQWRkcmVzcywgbWVzc2FnZSwgKHNpZ25hdHVyZSkgPT4ge1xuICAgICAgICAgIGxldCBlcnJvcktleSA9IFwiZXJyb3I6IFwiO1xuICAgICAgICAgIGlmIChzaWduYXR1cmUuaW5kZXhPZihlcnJvcktleSkgPT09IDApIHJlamVjdChuZXcgTW9uZXJvRXJyb3Ioc2lnbmF0dXJlLnN1YnN0cmluZyhlcnJvcktleS5sZW5ndGgpLCAtMSkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShzaWduYXR1cmUpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRSZXNlcnZlUHJvb2ZBY2NvdW50KGFjY291bnRJZHg6IG51bWJlciwgYW1vdW50OiBiaWdpbnQsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0UmVzZXJ2ZVByb29mQWNjb3VudChhY2NvdW50SWR4LCBhbW91bnQsIG1lc3NhZ2UpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmdldF9yZXNlcnZlX3Byb29mX2FjY291bnQodGhpcy5jcHBBZGRyZXNzLCBhY2NvdW50SWR4LCBhbW91bnQudG9TdHJpbmcoKSwgbWVzc2FnZSwgKHNpZ25hdHVyZSkgPT4ge1xuICAgICAgICAgIGxldCBlcnJvcktleSA9IFwiZXJyb3I6IFwiO1xuICAgICAgICAgIGlmIChzaWduYXR1cmUuaW5kZXhPZihlcnJvcktleSkgPT09IDApIHJlamVjdChuZXcgTW9uZXJvRXJyb3Ioc2lnbmF0dXJlLnN1YnN0cmluZyhlcnJvcktleS5sZW5ndGgpLCAtMSkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShzaWduYXR1cmUpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgY2hlY2tSZXNlcnZlUHJvb2YoYWRkcmVzczogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1Jlc2VydmU+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmNoZWNrUmVzZXJ2ZVByb29mKGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpOyBcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmNoZWNrX3Jlc2VydmVfcHJvb2YodGhpcy5jcHBBZGRyZXNzLCBhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUsIChyZXNwSnNvblN0cikgPT4ge1xuICAgICAgICAgIGlmIChyZXNwSnNvblN0ci5jaGFyQXQoMCkgIT09IFwie1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3BKc29uU3RyLCAtMSkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvQ2hlY2tSZXNlcnZlKEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhyZXNwSnNvblN0cikpKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4Tm90ZXModHhIYXNoZXM6IHN0cmluZ1tdKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0VHhOb3Rlcyh0eEhhc2hlcyk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdHJ5IHsgcmV0dXJuIEpTT04ucGFyc2UodGhpcy5tb2R1bGUuZ2V0X3R4X25vdGVzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe3R4SGFzaGVzOiB0eEhhc2hlc30pKSkudHhOb3RlczsgfVxuICAgICAgY2F0Y2ggKGVycikgeyB0aHJvdyBuZXcgTW9uZXJvRXJyb3IodGhpcy5tb2R1bGUuZ2V0X2V4Y2VwdGlvbl9tZXNzYWdlKGVycikpOyB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNldFR4Tm90ZXModHhIYXNoZXM6IHN0cmluZ1tdLCBub3Rlczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNldFR4Tm90ZXModHhIYXNoZXMsIG5vdGVzKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkgeyB0aGlzLm1vZHVsZS5zZXRfdHhfbm90ZXModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7dHhIYXNoZXM6IHR4SGFzaGVzLCB0eE5vdGVzOiBub3Rlc30pKTsgfVxuICAgICAgY2F0Y2ggKGVycikgeyB0aHJvdyBuZXcgTW9uZXJvRXJyb3IodGhpcy5tb2R1bGUuZ2V0X2V4Y2VwdGlvbl9tZXNzYWdlKGVycikpOyB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFkZHJlc3NCb29rRW50cmllcyhlbnRyeUluZGljZXM/OiBudW1iZXJbXSk6IFByb21pc2U8TW9uZXJvQWRkcmVzc0Jvb2tFbnRyeVtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRBZGRyZXNzQm9va0VudHJpZXMoZW50cnlJbmRpY2VzKTtcbiAgICBpZiAoIWVudHJ5SW5kaWNlcykgZW50cnlJbmRpY2VzID0gW107XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IGVudHJpZXMgPSBbXTtcbiAgICAgIGZvciAobGV0IGVudHJ5SnNvbiBvZiBKU09OLnBhcnNlKHRoaXMubW9kdWxlLmdldF9hZGRyZXNzX2Jvb2tfZW50cmllcyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHtlbnRyeUluZGljZXM6IGVudHJ5SW5kaWNlc30pKSkuZW50cmllcykge1xuICAgICAgICBlbnRyaWVzLnB1c2gobmV3IE1vbmVyb0FkZHJlc3NCb29rRW50cnkoZW50cnlKc29uKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZW50cmllcztcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgYWRkQWRkcmVzc0Jvb2tFbnRyeShhZGRyZXNzOiBzdHJpbmcsIGRlc2NyaXB0aW9uPzogc3RyaW5nKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmFkZEFkZHJlc3NCb29rRW50cnkoYWRkcmVzcywgZGVzY3JpcHRpb24pO1xuICAgIGlmICghYWRkcmVzcykgYWRkcmVzcyA9IFwiXCI7XG4gICAgaWYgKCFkZXNjcmlwdGlvbikgZGVzY3JpcHRpb24gPSBcIlwiO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5hZGRfYWRkcmVzc19ib29rX2VudHJ5KHRoaXMuY3BwQWRkcmVzcywgYWRkcmVzcywgZGVzY3JpcHRpb24pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBlZGl0QWRkcmVzc0Jvb2tFbnRyeShpbmRleDogbnVtYmVyLCBzZXRBZGRyZXNzOiBib29sZWFuLCBhZGRyZXNzOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNldERlc2NyaXB0aW9uOiBib29sZWFuLCBkZXNjcmlwdGlvbjogc3RyaW5nIHwgdW5kZWZpbmVkKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5lZGl0QWRkcmVzc0Jvb2tFbnRyeShpbmRleCwgc2V0QWRkcmVzcywgYWRkcmVzcywgc2V0RGVzY3JpcHRpb24sIGRlc2NyaXB0aW9uKTtcbiAgICBpZiAoIXNldEFkZHJlc3MpIHNldEFkZHJlc3MgPSBmYWxzZTtcbiAgICBpZiAoIWFkZHJlc3MpIGFkZHJlc3MgPSBcIlwiO1xuICAgIGlmICghc2V0RGVzY3JpcHRpb24pIHNldERlc2NyaXB0aW9uID0gZmFsc2U7XG4gICAgaWYgKCFkZXNjcmlwdGlvbikgZGVzY3JpcHRpb24gPSBcIlwiO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRoaXMubW9kdWxlLmVkaXRfYWRkcmVzc19ib29rX2VudHJ5KHRoaXMuY3BwQWRkcmVzcywgaW5kZXgsIHNldEFkZHJlc3MsIGFkZHJlc3MsIHNldERlc2NyaXB0aW9uLCBkZXNjcmlwdGlvbik7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGRlbGV0ZUFkZHJlc3NCb29rRW50cnkoZW50cnlJZHg6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeShlbnRyeUlkeCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdGhpcy5tb2R1bGUuZGVsZXRlX2FkZHJlc3NfYm9va19lbnRyeSh0aGlzLmNwcEFkZHJlc3MsIGVudHJ5SWR4KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgdGFnQWNjb3VudHModGFnOiBzdHJpbmcsIGFjY291bnRJbmRpY2VzOiBudW1iZXJbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkudGFnQWNjb3VudHModGFnLCBhY2NvdW50SW5kaWNlcyk7XG4gICAgaWYgKCF0YWcpIHRhZyA9IFwiXCI7XG4gICAgaWYgKCFhY2NvdW50SW5kaWNlcykgYWNjb3VudEluZGljZXMgPSBbXTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0aGlzLm1vZHVsZS50YWdfYWNjb3VudHModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7dGFnOiB0YWcsIGFjY291bnRJbmRpY2VzOiBhY2NvdW50SW5kaWNlc30pKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIHVudGFnQWNjb3VudHMoYWNjb3VudEluZGljZXM6IG51bWJlcltdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS51bnRhZ0FjY291bnRzKGFjY291bnRJbmRpY2VzKTtcbiAgICBpZiAoIWFjY291bnRJbmRpY2VzKSBhY2NvdW50SW5kaWNlcyA9IFtdO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRoaXMubW9kdWxlLnRhZ19hY2NvdW50cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHthY2NvdW50SW5kaWNlczogYWNjb3VudEluZGljZXN9KSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFjY291bnRUYWdzKCk6IFByb21pc2U8TW9uZXJvQWNjb3VudFRhZ1tdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRBY2NvdW50VGFncygpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCBhY2NvdW50VGFncyA9IFtdO1xuICAgICAgZm9yIChsZXQgYWNjb3VudFRhZ0pzb24gb2YgSlNPTi5wYXJzZSh0aGlzLm1vZHVsZS5nZXRfYWNjb3VudF90YWdzKHRoaXMuY3BwQWRkcmVzcykpLmFjY291bnRUYWdzKSBhY2NvdW50VGFncy5wdXNoKG5ldyBNb25lcm9BY2NvdW50VGFnKGFjY291bnRUYWdKc29uKSk7XG4gICAgICByZXR1cm4gYWNjb3VudFRhZ3M7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBzZXRBY2NvdW50VGFnTGFiZWwodGFnOiBzdHJpbmcsIGxhYmVsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNldEFjY291bnRUYWdMYWJlbCh0YWcsIGxhYmVsKTtcbiAgICBpZiAoIXRhZykgdGFnID0gXCJcIjtcbiAgICBpZiAoIWxhYmVsKSBsYWJlbCA9IFwiXCI7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdGhpcy5tb2R1bGUuc2V0X2FjY291bnRfdGFnX2xhYmVsKHRoaXMuY3BwQWRkcmVzcywgdGFnLCBsYWJlbCk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBheW1lbnRVcmkoY29uZmlnOiBNb25lcm9UeENvbmZpZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRQYXltZW50VXJpKGNvbmZpZyk7XG4gICAgY29uZmlnID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyhjb25maWcpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5nZXRfcGF5bWVudF91cmkodGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeShjb25maWcudG9Kc29uKCkpKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgbWFrZSBVUkkgZnJvbSBzdXBwbGllZCBwYXJhbWV0ZXJzXCIpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBwYXJzZVBheW1lbnRVcmkodXJpOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1R4Q29uZmlnPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5wYXJzZVBheW1lbnRVcmkodXJpKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gbmV3IE1vbmVyb1R4Q29uZmlnKEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyh0aGlzLm1vZHVsZS5wYXJzZV9wYXltZW50X3VyaSh0aGlzLmNwcEFkZHJlc3MsIHVyaSkpKSk7XG4gICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZXJyLm1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRBdHRyaWJ1dGUoa2V5OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0QXR0cmlidXRlKGtleSk7XG4gICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICBhc3NlcnQodHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiwgXCJBdHRyaWJ1dGUga2V5IG11c3QgYmUgYSBzdHJpbmdcIik7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IHZhbHVlID0gdGhpcy5tb2R1bGUuZ2V0X2F0dHJpYnV0ZSh0aGlzLmNwcEFkZHJlc3MsIGtleSk7XG4gICAgICByZXR1cm4gdmFsdWUgPT09IFwiXCIgPyBudWxsIDogdmFsdWU7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNldEF0dHJpYnV0ZShrZXk6IHN0cmluZywgdmFsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNldEF0dHJpYnV0ZShrZXksIHZhbCk7XG4gICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICBhc3NlcnQodHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiwgXCJBdHRyaWJ1dGUga2V5IG11c3QgYmUgYSBzdHJpbmdcIik7XG4gICAgYXNzZXJ0KHR5cGVvZiB2YWwgPT09IFwic3RyaW5nXCIsIFwiQXR0cmlidXRlIHZhbHVlIG11c3QgYmUgYSBzdHJpbmdcIik7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdGhpcy5tb2R1bGUuc2V0X2F0dHJpYnV0ZSh0aGlzLmNwcEFkZHJlc3MsIGtleSwgdmFsKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc3RhcnRNaW5pbmcobnVtVGhyZWFkczogbnVtYmVyLCBiYWNrZ3JvdW5kTWluaW5nPzogYm9vbGVhbiwgaWdub3JlQmF0dGVyeT86IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN0YXJ0TWluaW5nKG51bVRocmVhZHMsIGJhY2tncm91bmRNaW5pbmcsIGlnbm9yZUJhdHRlcnkpO1xuICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgbGV0IGRhZW1vbiA9IGF3YWl0IE1vbmVyb0RhZW1vblJwYy5jb25uZWN0VG9EYWVtb25ScGMoYXdhaXQgdGhpcy5nZXREYWVtb25Db25uZWN0aW9uKCkpO1xuICAgIGF3YWl0IGRhZW1vbi5zdGFydE1pbmluZyhhd2FpdCB0aGlzLmdldFByaW1hcnlBZGRyZXNzKCksIG51bVRocmVhZHMsIGJhY2tncm91bmRNaW5pbmcsIGlnbm9yZUJhdHRlcnkpO1xuICB9XG4gIFxuICBhc3luYyBzdG9wTWluaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3RvcE1pbmluZygpO1xuICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgbGV0IGRhZW1vbiA9IGF3YWl0IE1vbmVyb0RhZW1vblJwYy5jb25uZWN0VG9EYWVtb25ScGMoYXdhaXQgdGhpcy5nZXREYWVtb25Db25uZWN0aW9uKCkpO1xuICAgIGF3YWl0IGRhZW1vbi5zdG9wTWluaW5nKCk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzTXVsdGlzaWdJbXBvcnROZWVkZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pc011bHRpc2lnSW1wb3J0TmVlZGVkKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLmlzX211bHRpc2lnX2ltcG9ydF9uZWVkZWQodGhpcy5jcHBBZGRyZXNzKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgaXNNdWx0aXNpZygpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmlzTXVsdGlzaWcoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gdGhpcy5tb2R1bGUuaXNfbXVsdGlzaWcodGhpcy5jcHBBZGRyZXNzKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TXVsdGlzaWdJbmZvKCk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdJbmZvPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRNdWx0aXNpZ0luZm8oKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IE1vbmVyb011bHRpc2lnSW5mbyhKU09OLnBhcnNlKHRoaXMubW9kdWxlLmdldF9tdWx0aXNpZ19pbmZvKHRoaXMuY3BwQWRkcmVzcykpKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgcHJlcGFyZU11bHRpc2lnKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5wcmVwYXJlTXVsdGlzaWcoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gdGhpcy5tb2R1bGUucHJlcGFyZV9tdWx0aXNpZyh0aGlzLmNwcEFkZHJlc3MpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBtYWtlTXVsdGlzaWcobXVsdGlzaWdIZXhlczogc3RyaW5nW10sIHRocmVzaG9sZDogbnVtYmVyLCBwYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLm1ha2VNdWx0aXNpZyhtdWx0aXNpZ0hleGVzLCB0aHJlc2hvbGQsIHBhc3N3b3JkKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5tYWtlX211bHRpc2lnKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe211bHRpc2lnSGV4ZXM6IG11bHRpc2lnSGV4ZXMsIHRocmVzaG9sZDogdGhyZXNob2xkLCBwYXNzd29yZDogcGFzc3dvcmR9KSwgKHJlc3ApID0+IHtcbiAgICAgICAgICBsZXQgZXJyb3JLZXkgPSBcImVycm9yOiBcIjtcbiAgICAgICAgICBpZiAocmVzcC5pbmRleE9mKGVycm9yS2V5KSA9PT0gMCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwLnN1YnN0cmluZyhlcnJvcktleS5sZW5ndGgpKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBleGNoYW5nZU11bHRpc2lnS2V5cyhtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgcGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5leGNoYW5nZU11bHRpc2lnS2V5cyhtdWx0aXNpZ0hleGVzLCBwYXNzd29yZCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZXhjaGFuZ2VfbXVsdGlzaWdfa2V5cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHttdWx0aXNpZ0hleGVzOiBtdWx0aXNpZ0hleGVzLCBwYXNzd29yZDogcGFzc3dvcmR9KSwgKHJlc3ApID0+IHtcbiAgICAgICAgICBsZXQgZXJyb3JLZXkgPSBcImVycm9yOiBcIjtcbiAgICAgICAgICBpZiAocmVzcC5pbmRleE9mKGVycm9yS2V5KSA9PT0gMCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwLnN1YnN0cmluZyhlcnJvcktleS5sZW5ndGgpKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQoSlNPTi5wYXJzZShyZXNwKSkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBleHBvcnRNdWx0aXNpZ0hleCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZXhwb3J0TXVsdGlzaWdIZXgoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gdGhpcy5tb2R1bGUuZXhwb3J0X211bHRpc2lnX2hleCh0aGlzLmNwcEFkZHJlc3MpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRNdWx0aXNpZ0hleChtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pbXBvcnRNdWx0aXNpZ0hleChtdWx0aXNpZ0hleGVzKTtcbiAgICBpZiAoIUdlblV0aWxzLmlzQXJyYXkobXVsdGlzaWdIZXhlcykpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBzdHJpbmdbXSB0byBpbXBvcnRNdWx0aXNpZ0hleCgpXCIpXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuaW1wb3J0X211bHRpc2lnX2hleCh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHttdWx0aXNpZ0hleGVzOiBtdWx0aXNpZ0hleGVzfSksIChyZXNwKSA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiByZXNwID09PSBcInN0cmluZ1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNpZ25NdWx0aXNpZ1R4SGV4KG11bHRpc2lnVHhIZXg6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zaWduTXVsdGlzaWdUeEhleChtdWx0aXNpZ1R4SGV4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5zaWduX211bHRpc2lnX3R4X2hleCh0aGlzLmNwcEFkZHJlc3MsIG11bHRpc2lnVHhIZXgsIChyZXNwKSA9PiB7XG4gICAgICAgICAgaWYgKHJlc3AuY2hhckF0KDApICE9PSBcIntcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQoSlNPTi5wYXJzZShyZXNwKSkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzdWJtaXRNdWx0aXNpZ1R4SGV4KHNpZ25lZE11bHRpc2lnVHhIZXg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN1Ym1pdE11bHRpc2lnVHhIZXgoc2lnbmVkTXVsdGlzaWdUeEhleCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuc3VibWl0X211bHRpc2lnX3R4X2hleCh0aGlzLmNwcEFkZHJlc3MsIHNpZ25lZE11bHRpc2lnVHhIZXgsIChyZXNwKSA9PiB7XG4gICAgICAgICAgaWYgKHJlc3AuY2hhckF0KDApICE9PSBcIntcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKEpTT04ucGFyc2UocmVzcCkudHhIYXNoZXMpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSB3YWxsZXQncyBrZXlzIGFuZCBjYWNoZSBkYXRhLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxEYXRhVmlld1tdPn0gaXMgdGhlIGtleXMgYW5kIGNhY2hlIGRhdGEsIHJlc3BlY3RpdmVseVxuICAgKi9cbiAgYXN5bmMgZ2V0RGF0YSgpOiBQcm9taXNlPERhdGFWaWV3W10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldERhdGEoKTtcbiAgICBcbiAgICAvLyBxdWV1ZSBjYWxsIHRvIHdhc20gbW9kdWxlXG4gICAgbGV0IHZpZXdPbmx5ID0gYXdhaXQgdGhpcy5pc1ZpZXdPbmx5KCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgXG4gICAgICAvLyBzdG9yZSB2aWV3cyBpbiBhcnJheVxuICAgICAgbGV0IHZpZXdzID0gW107XG4gICAgICBcbiAgICAgIC8vIG1hbGxvYyBjYWNoZSBidWZmZXIgYW5kIGdldCBidWZmZXIgbG9jYXRpb24gaW4gYysrIGhlYXBcbiAgICAgIGxldCBjYWNoZUJ1ZmZlckxvYyA9IEpTT04ucGFyc2UodGhpcy5tb2R1bGUuZ2V0X2NhY2hlX2ZpbGVfYnVmZmVyKHRoaXMuY3BwQWRkcmVzcykpO1xuICAgICAgXG4gICAgICAvLyByZWFkIGJpbmFyeSBkYXRhIGZyb20gaGVhcCB0byBEYXRhVmlld1xuICAgICAgbGV0IHZpZXcgPSBuZXcgRGF0YVZpZXcobmV3IEFycmF5QnVmZmVyKGNhY2hlQnVmZmVyTG9jLmxlbmd0aCkpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjYWNoZUJ1ZmZlckxvYy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2aWV3LnNldEludDgoaSwgdGhpcy5tb2R1bGUuSEVBUFU4W2NhY2hlQnVmZmVyTG9jLnBvaW50ZXIgLyBVaW50OEFycmF5LkJZVEVTX1BFUl9FTEVNRU5UICsgaV0pO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBmcmVlIGJpbmFyeSBvbiBoZWFwXG4gICAgICB0aGlzLm1vZHVsZS5fZnJlZShjYWNoZUJ1ZmZlckxvYy5wb2ludGVyKTtcbiAgICAgIFxuICAgICAgLy8gd3JpdGUgY2FjaGUgZmlsZVxuICAgICAgdmlld3MucHVzaChCdWZmZXIuZnJvbSh2aWV3LmJ1ZmZlcikpO1xuICAgICAgXG4gICAgICAvLyBtYWxsb2Mga2V5cyBidWZmZXIgYW5kIGdldCBidWZmZXIgbG9jYXRpb24gaW4gYysrIGhlYXBcbiAgICAgIGxldCBrZXlzQnVmZmVyTG9jID0gSlNPTi5wYXJzZSh0aGlzLm1vZHVsZS5nZXRfa2V5c19maWxlX2J1ZmZlcih0aGlzLmNwcEFkZHJlc3MsIHRoaXMucGFzc3dvcmQsIHZpZXdPbmx5KSk7XG4gICAgICBcbiAgICAgIC8vIHJlYWQgYmluYXJ5IGRhdGEgZnJvbSBoZWFwIHRvIERhdGFWaWV3XG4gICAgICB2aWV3ID0gbmV3IERhdGFWaWV3KG5ldyBBcnJheUJ1ZmZlcihrZXlzQnVmZmVyTG9jLmxlbmd0aCkpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzQnVmZmVyTG9jLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZpZXcuc2V0SW50OChpLCB0aGlzLm1vZHVsZS5IRUFQVThba2V5c0J1ZmZlckxvYy5wb2ludGVyIC8gVWludDhBcnJheS5CWVRFU19QRVJfRUxFTUVOVCArIGldKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gZnJlZSBiaW5hcnkgb24gaGVhcFxuICAgICAgdGhpcy5tb2R1bGUuX2ZyZWUoa2V5c0J1ZmZlckxvYy5wb2ludGVyKTtcbiAgICAgIFxuICAgICAgLy8gcHJlcGVuZCBrZXlzIGZpbGVcbiAgICAgIHZpZXdzLnVuc2hpZnQoQnVmZmVyLmZyb20odmlldy5idWZmZXIpKTtcbiAgICAgIHJldHVybiB2aWV3cztcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgY2hhbmdlUGFzc3dvcmQob2xkUGFzc3dvcmQ6IHN0cmluZywgbmV3UGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuY2hhbmdlUGFzc3dvcmQob2xkUGFzc3dvcmQsIG5ld1Bhc3N3b3JkKTtcbiAgICBpZiAob2xkUGFzc3dvcmQgIT09IHRoaXMucGFzc3dvcmQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkludmFsaWQgb3JpZ2luYWwgcGFzc3dvcmQuXCIpOyAvLyB3YWxsZXQyIHZlcmlmeV9wYXNzd29yZCBsb2FkcyBmcm9tIGRpc2sgc28gdmVyaWZ5IHBhc3N3b3JkIGhlcmVcbiAgICBpZiAobmV3UGFzc3dvcmQgPT09IHVuZGVmaW5lZCkgbmV3UGFzc3dvcmQgPSBcIlwiO1xuICAgIGF3YWl0IHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuY2hhbmdlX3dhbGxldF9wYXNzd29yZCh0aGlzLmNwcEFkZHJlc3MsIG9sZFBhc3N3b3JkLCBuZXdQYXNzd29yZCwgKGVyck1zZykgPT4ge1xuICAgICAgICAgIGlmIChlcnJNc2cpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoZXJyTXNnKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgdGhpcy5wYXNzd29yZCA9IG5ld1Bhc3N3b3JkO1xuICAgIGlmICh0aGlzLnBhdGgpIGF3YWl0IHRoaXMuc2F2ZSgpOyAvLyBhdXRvIHNhdmVcbiAgfVxuICBcbiAgYXN5bmMgc2F2ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNhdmUoKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5zYXZlKHRoaXMpO1xuICB9XG4gIFxuICBhc3luYyBjbG9zZShzYXZlID0gZmFsc2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5faXNDbG9zZWQpIHJldHVybjsgLy8gbm8gZWZmZWN0IGlmIGNsb3NlZFxuICAgIGlmIChzYXZlKSBhd2FpdCB0aGlzLnNhdmUoKTtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSB7XG4gICAgICBhd2FpdCB0aGlzLmdldFdhbGxldFByb3h5KCkuY2xvc2UoZmFsc2UpO1xuICAgICAgYXdhaXQgc3VwZXIuY2xvc2UoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoTGlzdGVuaW5nKCk7XG4gICAgYXdhaXQgdGhpcy5zdG9wU3luY2luZygpO1xuICAgIGF3YWl0IHN1cGVyLmNsb3NlKCk7XG4gICAgZGVsZXRlIHRoaXMucGF0aDtcbiAgICBkZWxldGUgdGhpcy5wYXNzd29yZDtcbiAgICBkZWxldGUgdGhpcy53YXNtTGlzdGVuZXI7XG4gICAgTGlicmFyeVV0aWxzLnNldFJlamVjdFVuYXV0aG9yaXplZEZuKHRoaXMucmVqZWN0VW5hdXRob3JpemVkQ29uZmlnSWQsIHVuZGVmaW5lZCk7IC8vIHVucmVnaXN0ZXIgZm4gaW5mb3JtaW5nIGlmIHVuYXV0aG9yaXplZCByZXFzIHNob3VsZCBiZSByZWplY3RlZFxuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLSBBREQgSlNET0MgRk9SIFNVUFBPUlRFRCBERUZBVUxUIElNUExFTUVOVEFUSU9OUyAtLS0tLS0tLS0tLS0tLVxuICBcbiAgYXN5bmMgZ2V0TnVtQmxvY2tzVG9VbmxvY2soKTogUHJvbWlzZTxudW1iZXJbXXx1bmRlZmluZWQ+IHsgcmV0dXJuIHN1cGVyLmdldE51bUJsb2Nrc1RvVW5sb2NrKCk7IH1cbiAgYXN5bmMgZ2V0VHgodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0fHVuZGVmaW5lZD4geyByZXR1cm4gc3VwZXIuZ2V0VHgodHhIYXNoKTsgfVxuICBhc3luYyBnZXRJbmNvbWluZ1RyYW5zZmVycyhxdWVyeTogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvSW5jb21pbmdUcmFuc2ZlcltdPiB7IHJldHVybiBzdXBlci5nZXRJbmNvbWluZ1RyYW5zZmVycyhxdWVyeSk7IH1cbiAgYXN5bmMgZ2V0T3V0Z29pbmdUcmFuc2ZlcnMocXVlcnk6IFBhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT4pIHsgcmV0dXJuIHN1cGVyLmdldE91dGdvaW5nVHJhbnNmZXJzKHF1ZXJ5KTsgfVxuICBhc3luYyBjcmVhdGVUeChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldD4geyByZXR1cm4gc3VwZXIuY3JlYXRlVHgoY29uZmlnKTsgfVxuICBhc3luYyByZWxheVR4KHR4T3JNZXRhZGF0YTogTW9uZXJvVHhXYWxsZXQgfCBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4geyByZXR1cm4gc3VwZXIucmVsYXlUeCh0eE9yTWV0YWRhdGEpOyB9XG4gIGFzeW5jIGdldFR4Tm90ZSh0eEhhc2g6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7IHJldHVybiBzdXBlci5nZXRUeE5vdGUodHhIYXNoKTsgfVxuICBhc3luYyBzZXRUeE5vdGUodHhIYXNoOiBzdHJpbmcsIG5vdGU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4geyByZXR1cm4gc3VwZXIuc2V0VHhOb3RlKHR4SGFzaCwgbm90ZSk7IH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUFJJVkFURSBIRUxQRVJTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIG9wZW5XYWxsZXREYXRhKGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KSB7XG4gICAgaWYgKGNvbmZpZy5wcm94eVRvV29ya2VyKSB7XG4gICAgICBsZXQgd2FsbGV0UHJveHkgPSBhd2FpdCBNb25lcm9XYWxsZXRGdWxsUHJveHkub3BlbldhbGxldERhdGEoY29uZmlnKTtcbiAgICAgIHJldHVybiBuZXcgTW9uZXJvV2FsbGV0RnVsbCh1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB3YWxsZXRQcm94eSk7XG4gICAgfVxuICAgIFxuICAgIC8vIHZhbGlkYXRlIGFuZCBub3JtYWxpemUgcGFyYW1ldGVyc1xuICAgIGlmIChjb25maWcubmV0d29ya1R5cGUgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIHRoZSB3YWxsZXQncyBuZXR3b3JrIHR5cGVcIik7XG4gICAgY29uZmlnLm5ldHdvcmtUeXBlID0gTW9uZXJvTmV0d29ya1R5cGUuZnJvbShjb25maWcubmV0d29ya1R5cGUpO1xuICAgIGxldCBkYWVtb25Db25uZWN0aW9uID0gY29uZmlnLmdldFNlcnZlcigpO1xuICAgIGxldCBkYWVtb25VcmkgPSBkYWVtb25Db25uZWN0aW9uICYmIGRhZW1vbkNvbm5lY3Rpb24uZ2V0VXJpKCkgPyBkYWVtb25Db25uZWN0aW9uLmdldFVyaSgpIDogXCJcIjtcbiAgICBsZXQgZGFlbW9uVXNlcm5hbWUgPSBkYWVtb25Db25uZWN0aW9uICYmIGRhZW1vbkNvbm5lY3Rpb24uZ2V0VXNlcm5hbWUoKSA/IGRhZW1vbkNvbm5lY3Rpb24uZ2V0VXNlcm5hbWUoKSA6IFwiXCI7XG4gICAgbGV0IGRhZW1vblBhc3N3b3JkID0gZGFlbW9uQ29ubmVjdGlvbiAmJiBkYWVtb25Db25uZWN0aW9uLmdldFBhc3N3b3JkKCkgPyBkYWVtb25Db25uZWN0aW9uLmdldFBhc3N3b3JkKCkgOiBcIlwiO1xuICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWQgPSBkYWVtb25Db25uZWN0aW9uID8gZGFlbW9uQ29ubmVjdGlvbi5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHRydWU7XG4gICAgXG4gICAgLy8gbG9hZCB3YXNtIG1vZHVsZVxuICAgIGxldCBtb2R1bGUgPSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZEZ1bGxNb2R1bGUoKTtcbiAgICBcbiAgICAvLyBvcGVuIHdhbGxldCBpbiBxdWV1ZVxuICAgIHJldHVybiBtb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyByZWdpc3RlciBmbiBpbmZvcm1pbmcgaWYgdW5hdXRob3JpemVkIHJlcXMgc2hvdWxkIGJlIHJlamVjdGVkXG4gICAgICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWRGbklkID0gR2VuVXRpbHMuZ2V0VVVJRCgpO1xuICAgICAgICBMaWJyYXJ5VXRpbHMuc2V0UmVqZWN0VW5hdXRob3JpemVkRm4ocmVqZWN0VW5hdXRob3JpemVkRm5JZCwgKCkgPT4gcmVqZWN0VW5hdXRob3JpemVkKTtcbiAgICAgIFxuICAgICAgICAvLyBjcmVhdGUgd2FsbGV0IGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgbW9kdWxlLm9wZW5fd2FsbGV0X2Z1bGwoY29uZmlnLnBhc3N3b3JkLCBjb25maWcubmV0d29ya1R5cGUsIGNvbmZpZy5rZXlzRGF0YSA/PyBcIlwiLCBjb25maWcuY2FjaGVEYXRhID8/IFwiXCIsIGRhZW1vblVyaSwgZGFlbW9uVXNlcm5hbWUsIGRhZW1vblBhc3N3b3JkLCByZWplY3RVbmF1dGhvcml6ZWRGbklkLCAoY3BwQWRkcmVzcykgPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgY3BwQWRkcmVzcyA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihjcHBBZGRyZXNzKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9XYWxsZXRGdWxsKGNwcEFkZHJlc3MsIGNvbmZpZy5wYXRoLCBjb25maWcucGFzc3dvcmQsIGNvbmZpZy5mcywgcmVqZWN0VW5hdXRob3JpemVkLCByZWplY3RVbmF1dGhvcml6ZWRGbklkKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgZ2V0V2FsbGV0UHJveHkoKTogTW9uZXJvV2FsbGV0RnVsbFByb3h5IHtcbiAgICByZXR1cm4gc3VwZXIuZ2V0V2FsbGV0UHJveHkoKSBhcyBNb25lcm9XYWxsZXRGdWxsUHJveHk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBiYWNrZ3JvdW5kU3luYygpIHtcbiAgICBsZXQgbGFiZWwgPSB0aGlzLnBhdGggPyB0aGlzLnBhdGggOiAodGhpcy5icm93c2VyTWFpblBhdGggPyB0aGlzLmJyb3dzZXJNYWluUGF0aCA6IFwiaW4tbWVtb3J5IHdhbGxldFwiKTsgLy8gbGFiZWwgZm9yIGxvZ1xuICAgIExpYnJhcnlVdGlscy5sb2coMSwgXCJCYWNrZ3JvdW5kIHN5bmNocm9uaXppbmcgXCIgKyBsYWJlbCk7XG4gICAgdHJ5IHsgYXdhaXQgdGhpcy5zeW5jKCk7IH1cbiAgICBjYXRjaCAoZXJyOiBhbnkpIHsgaWYgKCF0aGlzLl9pc0Nsb3NlZCkgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBiYWNrZ3JvdW5kIHN5bmNocm9uaXplIFwiICsgbGFiZWwgKyBcIjogXCIgKyBlcnIubWVzc2FnZSk7IH1cbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIHJlZnJlc2hMaXN0ZW5pbmcoKSB7XG4gICAgbGV0IGlzRW5hYmxlZCA9IHRoaXMubGlzdGVuZXJzLmxlbmd0aCA+IDA7XG4gICAgaWYgKHRoaXMud2FzbUxpc3RlbmVySGFuZGxlID09PSAwICYmICFpc0VuYWJsZWQgfHwgdGhpcy53YXNtTGlzdGVuZXJIYW5kbGUgPiAwICYmIGlzRW5hYmxlZCkgcmV0dXJuOyAvLyBubyBkaWZmZXJlbmNlXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5zZXRfbGlzdGVuZXIoXG4gICAgICAgICAgdGhpcy5jcHBBZGRyZXNzLFxuICAgICAgICAgIHRoaXMud2FzbUxpc3RlbmVySGFuZGxlLFxuICAgICAgICAgICAgbmV3TGlzdGVuZXJIYW5kbGUgPT4ge1xuICAgICAgICAgICAgICBpZiAodHlwZW9mIG5ld0xpc3RlbmVySGFuZGxlID09PSBcInN0cmluZ1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKG5ld0xpc3RlbmVySGFuZGxlKSk7XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMud2FzbUxpc3RlbmVySGFuZGxlID0gbmV3TGlzdGVuZXJIYW5kbGU7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNFbmFibGVkID8gYXN5bmMgKGhlaWdodCwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgcGVyY2VudERvbmUsIG1lc3NhZ2UpID0+IGF3YWl0IHRoaXMud2FzbUxpc3RlbmVyLm9uU3luY1Byb2dyZXNzKGhlaWdodCwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgcGVyY2VudERvbmUsIG1lc3NhZ2UpIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgaXNFbmFibGVkID8gYXN5bmMgKGhlaWdodCkgPT4gYXdhaXQgdGhpcy53YXNtTGlzdGVuZXIub25OZXdCbG9jayhoZWlnaHQpIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgaXNFbmFibGVkID8gYXN5bmMgKG5ld0JhbGFuY2VTdHIsIG5ld1VubG9ja2VkQmFsYW5jZVN0cikgPT4gYXdhaXQgdGhpcy53YXNtTGlzdGVuZXIub25CYWxhbmNlc0NoYW5nZWQobmV3QmFsYW5jZVN0ciwgbmV3VW5sb2NrZWRCYWxhbmNlU3RyKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGlzRW5hYmxlZCA/IGFzeW5jIChoZWlnaHQsIHR4SGFzaCwgYW1vdW50U3RyLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4LCB2ZXJzaW9uLCB1bmxvY2tUaW1lLCBpc0xvY2tlZCkgPT4gYXdhaXQgdGhpcy53YXNtTGlzdGVuZXIub25PdXRwdXRSZWNlaXZlZChoZWlnaHQsIHR4SGFzaCwgYW1vdW50U3RyLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4LCB2ZXJzaW9uLCB1bmxvY2tUaW1lLCBpc0xvY2tlZCkgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBpc0VuYWJsZWQgPyBhc3luYyAoaGVpZ2h0LCB0eEhhc2gsIGFtb3VudFN0ciwgYWNjb3VudElkeFN0ciwgc3ViYWRkcmVzc0lkeFN0ciwgdmVyc2lvbiwgdW5sb2NrVGltZSwgaXNMb2NrZWQpID0+IGF3YWl0IHRoaXMud2FzbUxpc3RlbmVyLm9uT3V0cHV0U3BlbnQoaGVpZ2h0LCB0eEhhc2gsIGFtb3VudFN0ciwgYWNjb3VudElkeFN0ciwgc3ViYWRkcmVzc0lkeFN0ciwgdmVyc2lvbiwgdW5sb2NrVGltZSwgaXNMb2NrZWQpIDogdW5kZWZpbmVkLFxuICAgICAgICApO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIHN0YXRpYyBzYW5pdGl6ZUJsb2NrKGJsb2NrKSB7XG4gICAgZm9yIChsZXQgdHggb2YgYmxvY2suZ2V0VHhzKCkpIE1vbmVyb1dhbGxldEZ1bGwuc2FuaXRpemVUeFdhbGxldCh0eCk7XG4gICAgcmV0dXJuIGJsb2NrO1xuICB9XG4gIFxuICBzdGF0aWMgc2FuaXRpemVUeFdhbGxldCh0eCkge1xuICAgIGFzc2VydCh0eCBpbnN0YW5jZW9mIE1vbmVyb1R4V2FsbGV0KTtcbiAgICByZXR1cm4gdHg7XG4gIH1cbiAgXG4gIHN0YXRpYyBzYW5pdGl6ZUFjY291bnQoYWNjb3VudCkge1xuICAgIGlmIChhY2NvdW50LmdldFN1YmFkZHJlc3NlcygpKSB7XG4gICAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGFjY291bnQuZ2V0U3ViYWRkcmVzc2VzKCkpIE1vbmVyb1dhbGxldEtleXMuc2FuaXRpemVTdWJhZGRyZXNzKHN1YmFkZHJlc3MpO1xuICAgIH1cbiAgICByZXR1cm4gYWNjb3VudDtcbiAgfVxuICBcbiAgc3RhdGljIGRlc2VyaWFsaXplQmxvY2tzKGJsb2Nrc0pzb25TdHIpIHtcbiAgICBsZXQgYmxvY2tzSnNvbiA9IEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhibG9ja3NKc29uU3RyKSk7XG4gICAgbGV0IGRlc2VyaWFsaXplZEJsb2NrczogYW55ID0ge307XG4gICAgZGVzZXJpYWxpemVkQmxvY2tzLmJsb2NrcyA9IFtdO1xuICAgIGlmIChibG9ja3NKc29uLmJsb2NrcykgZm9yIChsZXQgYmxvY2tKc29uIG9mIGJsb2Nrc0pzb24uYmxvY2tzKSBkZXNlcmlhbGl6ZWRCbG9ja3MuYmxvY2tzLnB1c2goTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZUJsb2NrKG5ldyBNb25lcm9CbG9jayhibG9ja0pzb24sIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFhfV0FMTEVUKSkpO1xuICAgIHJldHVybiBkZXNlcmlhbGl6ZWRCbG9ja3M7XG4gIH1cbiAgXG4gIHN0YXRpYyBkZXNlcmlhbGl6ZVR4cyhxdWVyeSwgYmxvY2tzSnNvblN0cikge1xuICAgIFxuICAgIC8vIGRlc2VyaWFsaXplIGJsb2Nrc1xuICAgIGxldCBkZXNlcmlhbGl6ZWRCbG9ja3MgPSBNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplQmxvY2tzKGJsb2Nrc0pzb25TdHIpO1xuICAgIGxldCBibG9ja3MgPSBkZXNlcmlhbGl6ZWRCbG9ja3MuYmxvY2tzO1xuICAgIFxuICAgIC8vIGNvbGxlY3QgdHhzXG4gICAgbGV0IHR4cyA9IFtdO1xuICAgIGZvciAobGV0IGJsb2NrIG9mIGJsb2Nrcykge1xuICAgICAgTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZUJsb2NrKGJsb2NrKTtcbiAgICAgIGZvciAobGV0IHR4IG9mIGJsb2NrLmdldFR4cygpKSB7XG4gICAgICAgIGlmIChibG9jay5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRCbG9jayh1bmRlZmluZWQpOyAvLyBkZXJlZmVyZW5jZSBwbGFjZWhvbGRlciBibG9jayBmb3IgdW5jb25maXJtZWQgdHhzXG4gICAgICAgIHR4cy5wdXNoKHR4KTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gcmUtc29ydCB0eHMgd2hpY2ggaXMgbG9zdCBvdmVyIHdhc20gc2VyaWFsaXphdGlvbiAgLy8gVE9ETzogY29uZmlybSB0aGF0IG9yZGVyIGlzIGxvc3RcbiAgICBpZiAocXVlcnkuZ2V0SGFzaGVzKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbGV0IHR4TWFwID0gbmV3IE1hcCgpO1xuICAgICAgZm9yIChsZXQgdHggb2YgdHhzKSB0eE1hcFt0eC5nZXRIYXNoKCldID0gdHg7XG4gICAgICBsZXQgdHhzU29ydGVkID0gW107XG4gICAgICBmb3IgKGxldCB0eEhhc2ggb2YgcXVlcnkuZ2V0SGFzaGVzKCkpIGlmICh0eE1hcFt0eEhhc2hdICE9PSB1bmRlZmluZWQpIHR4c1NvcnRlZC5wdXNoKHR4TWFwW3R4SGFzaF0pO1xuICAgICAgdHhzID0gdHhzU29ydGVkO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdHhzO1xuICB9XG4gIFxuICBzdGF0aWMgZGVzZXJpYWxpemVUcmFuc2ZlcnMocXVlcnksIGJsb2Nrc0pzb25TdHIpIHtcbiAgICBcbiAgICAvLyBkZXNlcmlhbGl6ZSBibG9ja3NcbiAgICBsZXQgZGVzZXJpYWxpemVkQmxvY2tzID0gTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZUJsb2NrcyhibG9ja3NKc29uU3RyKTtcbiAgICBsZXQgYmxvY2tzID0gZGVzZXJpYWxpemVkQmxvY2tzLmJsb2NrcztcbiAgICBcbiAgICAvLyBjb2xsZWN0IHRyYW5zZmVyc1xuICAgIGxldCB0cmFuc2ZlcnMgPSBbXTtcbiAgICBmb3IgKGxldCBibG9jayBvZiBibG9ja3MpIHtcbiAgICAgIGZvciAobGV0IHR4IG9mIGJsb2NrLmdldFR4cygpKSB7XG4gICAgICAgIGlmIChibG9jay5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRCbG9jayh1bmRlZmluZWQpOyAvLyBkZXJlZmVyZW5jZSBwbGFjZWhvbGRlciBibG9jayBmb3IgdW5jb25maXJtZWQgdHhzXG4gICAgICAgIGlmICh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkgIT09IHVuZGVmaW5lZCkgdHJhbnNmZXJzLnB1c2godHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpKTtcbiAgICAgICAgaWYgKHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGZvciAobGV0IHRyYW5zZmVyIG9mIHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkpIHRyYW5zZmVycy5wdXNoKHRyYW5zZmVyKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdHJhbnNmZXJzO1xuICB9XG4gIFxuICBzdGF0aWMgZGVzZXJpYWxpemVPdXRwdXRzKHF1ZXJ5LCBibG9ja3NKc29uU3RyKSB7XG4gICAgXG4gICAgLy8gZGVzZXJpYWxpemUgYmxvY2tzXG4gICAgbGV0IGRlc2VyaWFsaXplZEJsb2NrcyA9IE1vbmVyb1dhbGxldEZ1bGwuZGVzZXJpYWxpemVCbG9ja3MoYmxvY2tzSnNvblN0cik7XG4gICAgbGV0IGJsb2NrcyA9IGRlc2VyaWFsaXplZEJsb2Nrcy5ibG9ja3M7XG4gICAgXG4gICAgLy8gY29sbGVjdCBvdXRwdXRzXG4gICAgbGV0IG91dHB1dHMgPSBbXTtcbiAgICBmb3IgKGxldCBibG9jayBvZiBibG9ja3MpIHtcbiAgICAgIGZvciAobGV0IHR4IG9mIGJsb2NrLmdldFR4cygpKSB7XG4gICAgICAgIGZvciAobGV0IG91dHB1dCBvZiB0eC5nZXRPdXRwdXRzKCkpIG91dHB1dHMucHVzaChvdXRwdXQpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gb3V0cHV0cztcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNldCB0aGUgcGF0aCBvZiB0aGUgd2FsbGV0IG9uIHRoZSBicm93c2VyIG1haW4gdGhyZWFkIGlmIHJ1biBhcyBhIHdvcmtlci5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBicm93c2VyTWFpblBhdGggLSBwYXRoIG9mIHRoZSB3YWxsZXQgb24gdGhlIGJyb3dzZXIgbWFpbiB0aHJlYWRcbiAgICovXG4gIHByb3RlY3RlZCBzZXRCcm93c2VyTWFpblBhdGgoYnJvd3Nlck1haW5QYXRoKSB7XG4gICAgdGhpcy5icm93c2VyTWFpblBhdGggPSBicm93c2VyTWFpblBhdGg7XG4gIH1cbiAgXG4gIHN0YXRpYyBhc3luYyBtb3ZlVG8ocGF0aCwgd2FsbGV0KSB7XG5cbiAgICAvLyBzYXZlIGFuZCByZXR1cm4gaWYgc2FtZSBwYXRoXG4gICAgaWYgKFBhdGgubm9ybWFsaXplKHdhbGxldC5wYXRoKSA9PT0gUGF0aC5ub3JtYWxpemUocGF0aCkpIHtcbiAgICAgIHJldHVybiB3YWxsZXQuc2F2ZSgpO1xuICAgIH1cblxuICAgIHJldHVybiBMaWJyYXJ5VXRpbHMucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIGlmIChhd2FpdCB3YWxsZXQuaXNDbG9zZWQoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGlzIGNsb3NlZFwiKTtcbiAgICAgIGlmICghcGF0aCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIHBhdGggb2YgZGVzdGluYXRpb24gd2FsbGV0XCIpO1xuXG4gICAgICAvLyBjcmVhdGUgZGVzdGluYXRpb24gZGlyZWN0b3J5IGlmIGl0IGRvZXNuJ3QgZXhpc3RcbiAgICAgIGxldCB3YWxsZXREaXIgPSBQYXRoLmRpcm5hbWUocGF0aCk7XG4gICAgICBpZiAoIWF3YWl0IExpYnJhcnlVdGlscy5leGlzdHMod2FsbGV0LmZzLCB3YWxsZXREaXIpKSB7XG4gICAgICAgIHRyeSB7IGF3YWl0IHdhbGxldC5mcy5ta2Rpcih3YWxsZXREaXIpOyB9XG4gICAgICAgIGNhdGNoIChlcnI6IGFueSkgeyB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJEZXN0aW5hdGlvbiBwYXRoIFwiICsgcGF0aCArIFwiIGRvZXMgbm90IGV4aXN0IGFuZCBjYW5ub3QgYmUgY3JlYXRlZDogXCIgKyBlcnIubWVzc2FnZSk7IH1cbiAgICAgIH1cblxuICAgICAgLy8gZ2V0IHdhbGxldCBkYXRhXG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgd2FsbGV0LmdldERhdGEoKTtcblxuICAgICAgLy8gd3JpdGUgd2FsbGV0IGZpbGVzXG4gICAgICBhd2FpdCB3YWxsZXQuZnMud3JpdGVGaWxlKHBhdGggKyBcIi5rZXlzXCIsIGRhdGFbMF0sIFwiYmluYXJ5XCIpO1xuICAgICAgYXdhaXQgd2FsbGV0LmZzLndyaXRlRmlsZShwYXRoLCBkYXRhWzFdLCBcImJpbmFyeVwiKTtcbiAgICAgIGF3YWl0IHdhbGxldC5mcy53cml0ZUZpbGUocGF0aCArIFwiLmFkZHJlc3MudHh0XCIsIGF3YWl0IHdhbGxldC5nZXRQcmltYXJ5QWRkcmVzcygpKTtcbiAgICAgIGxldCBvbGRQYXRoID0gd2FsbGV0LnBhdGg7XG4gICAgICB3YWxsZXQucGF0aCA9IHBhdGg7XG5cbiAgICAgIC8vIGRlbGV0ZSBvbGQgd2FsbGV0IGZpbGVzXG4gICAgICBpZiAob2xkUGF0aCkge1xuICAgICAgICBhd2FpdCB3YWxsZXQuZnMudW5saW5rKG9sZFBhdGggKyBcIi5hZGRyZXNzLnR4dFwiKTtcbiAgICAgICAgYXdhaXQgd2FsbGV0LmZzLnVubGluayhvbGRQYXRoICsgXCIua2V5c1wiKTtcbiAgICAgICAgYXdhaXQgd2FsbGV0LmZzLnVubGluayhvbGRQYXRoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBcbiAgc3RhdGljIGFzeW5jIHNhdmUod2FsbGV0OiBhbnkpIHtcbiAgICByZXR1cm4gTGlicmFyeVV0aWxzLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICBpZiAoYXdhaXQgd2FsbGV0LmlzQ2xvc2VkKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBpcyBjbG9zZWRcIik7XG5cbiAgICAgIC8vIHBhdGggbXVzdCBiZSBzZXRcbiAgICAgIGxldCBwYXRoID0gYXdhaXQgd2FsbGV0LmdldFBhdGgoKTtcbiAgICAgIGlmICghcGF0aCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNhdmUgd2FsbGV0IGJlY2F1c2UgcGF0aCBpcyBub3Qgc2V0XCIpO1xuXG4gICAgICAvLyBnZXQgd2FsbGV0IGRhdGFcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB3YWxsZXQuZ2V0RGF0YSgpO1xuXG4gICAgICAvLyB3cml0ZSB3YWxsZXQgZmlsZXMgdG8gKi5uZXdcbiAgICAgIGxldCBwYXRoTmV3ID0gcGF0aCArIFwiLm5ld1wiO1xuICAgICAgYXdhaXQgd2FsbGV0LmZzLndyaXRlRmlsZShwYXRoTmV3ICsgXCIua2V5c1wiLCBkYXRhWzBdLCBcImJpbmFyeVwiKTtcbiAgICAgIGF3YWl0IHdhbGxldC5mcy53cml0ZUZpbGUocGF0aE5ldywgZGF0YVsxXSwgXCJiaW5hcnlcIik7XG4gICAgICBhd2FpdCB3YWxsZXQuZnMud3JpdGVGaWxlKHBhdGhOZXcgKyBcIi5hZGRyZXNzLnR4dFwiLCBhd2FpdCB3YWxsZXQuZ2V0UHJpbWFyeUFkZHJlc3MoKSk7XG5cbiAgICAgIC8vIHJlcGxhY2Ugb2xkIHdhbGxldCBmaWxlcyB3aXRoIG5ld1xuICAgICAgYXdhaXQgd2FsbGV0LmZzLnJlbmFtZShwYXRoTmV3ICsgXCIua2V5c1wiLCBwYXRoICsgXCIua2V5c1wiKTtcbiAgICAgIGF3YWl0IHdhbGxldC5mcy5yZW5hbWUocGF0aE5ldywgcGF0aCk7XG4gICAgICBhd2FpdCB3YWxsZXQuZnMucmVuYW1lKHBhdGhOZXcgKyBcIi5hZGRyZXNzLnR4dFwiLCBwYXRoICsgXCIuYWRkcmVzcy50eHRcIik7XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbXBsZW1lbnRzIGEgTW9uZXJvV2FsbGV0IGJ5IHByb3h5aW5nIHJlcXVlc3RzIHRvIGEgd29ya2VyIHdoaWNoIHJ1bnMgYSBmdWxsIHdhbGxldC5cbiAqIFxuICogQHByaXZhdGVcbiAqL1xuY2xhc3MgTW9uZXJvV2FsbGV0RnVsbFByb3h5IGV4dGVuZHMgTW9uZXJvV2FsbGV0S2V5c1Byb3h5IHtcblxuICAvLyBpbnN0YW5jZSB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIHBhdGg6IGFueTtcbiAgcHJvdGVjdGVkIGZzOiBhbnk7XG4gIHByb3RlY3RlZCB3cmFwcGVkTGlzdGVuZXJzOiBhbnk7XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBXQUxMRVQgU1RBVElDIFVUSUxTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgc3RhdGljIGFzeW5jIG9wZW5XYWxsZXREYXRhKGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KSB7XG4gICAgbGV0IHdhbGxldElkID0gR2VuVXRpbHMuZ2V0VVVJRCgpO1xuICAgIGlmIChjb25maWcucGFzc3dvcmQgPT09IHVuZGVmaW5lZCkgY29uZmlnLnBhc3N3b3JkID0gXCJcIjtcbiAgICBsZXQgZGFlbW9uQ29ubmVjdGlvbiA9IGNvbmZpZy5nZXRTZXJ2ZXIoKTtcbiAgICBhd2FpdCBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKHdhbGxldElkLCBcIm9wZW5XYWxsZXREYXRhXCIsIFtjb25maWcucGF0aCwgY29uZmlnLnBhc3N3b3JkLCBjb25maWcubmV0d29ya1R5cGUsIGNvbmZpZy5rZXlzRGF0YSwgY29uZmlnLmNhY2hlRGF0YSwgZGFlbW9uQ29ubmVjdGlvbiA/IGRhZW1vbkNvbm5lY3Rpb24udG9Kc29uKCkgOiB1bmRlZmluZWRdKTtcbiAgICBsZXQgd2FsbGV0ID0gbmV3IE1vbmVyb1dhbGxldEZ1bGxQcm94eSh3YWxsZXRJZCwgYXdhaXQgTGlicmFyeVV0aWxzLmdldFdvcmtlcigpLCBjb25maWcucGF0aCwgY29uZmlnLmdldEZzKCkpO1xuICAgIGlmIChjb25maWcucGF0aCkgYXdhaXQgd2FsbGV0LnNhdmUoKTtcbiAgICByZXR1cm4gd2FsbGV0O1xuICB9XG4gIFxuICBzdGF0aWMgYXN5bmMgY3JlYXRlV2FsbGV0KGNvbmZpZykge1xuICAgIGlmIChjb25maWcuZ2V0UGF0aCgpICYmIGF3YWl0IE1vbmVyb1dhbGxldEZ1bGwud2FsbGV0RXhpc3RzKGNvbmZpZy5nZXRQYXRoKCksIGNvbmZpZy5nZXRGcygpKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGFscmVhZHkgZXhpc3RzOiBcIiArIGNvbmZpZy5nZXRQYXRoKCkpO1xuICAgIGxldCB3YWxsZXRJZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICBhd2FpdCBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKHdhbGxldElkLCBcImNyZWF0ZVdhbGxldEZ1bGxcIiwgW2NvbmZpZy50b0pzb24oKV0pO1xuICAgIGxldCB3YWxsZXQgPSBuZXcgTW9uZXJvV2FsbGV0RnVsbFByb3h5KHdhbGxldElkLCBhd2FpdCBMaWJyYXJ5VXRpbHMuZ2V0V29ya2VyKCksIGNvbmZpZy5nZXRQYXRoKCksIGNvbmZpZy5nZXRGcygpKTtcbiAgICBpZiAoY29uZmlnLmdldFBhdGgoKSkgYXdhaXQgd2FsbGV0LnNhdmUoKTtcbiAgICByZXR1cm4gd2FsbGV0O1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gSU5TVEFOQ0UgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICAvKipcbiAgICogSW50ZXJuYWwgY29uc3RydWN0b3Igd2hpY2ggaXMgZ2l2ZW4gYSB3b3JrZXIgdG8gY29tbXVuaWNhdGUgd2l0aCB2aWEgbWVzc2FnZXMuXG4gICAqIFxuICAgKiBUaGlzIG1ldGhvZCBzaG91bGQgbm90IGJlIGNhbGxlZCBleHRlcm5hbGx5IGJ1dCBzaG91bGQgYmUgY2FsbGVkIHRocm91Z2hcbiAgICogc3RhdGljIHdhbGxldCBjcmVhdGlvbiB1dGlsaXRpZXMgaW4gdGhpcyBjbGFzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB3YWxsZXRJZCAtIGlkZW50aWZpZXMgdGhlIHdhbGxldCB3aXRoIHRoZSB3b3JrZXJcbiAgICogQHBhcmFtIHtXb3JrZXJ9IHdvcmtlciAtIHdvcmtlciB0byBjb21tdW5pY2F0ZSB3aXRoIHZpYSBtZXNzYWdlc1xuICAgKi9cbiAgY29uc3RydWN0b3Iod2FsbGV0SWQsIHdvcmtlciwgcGF0aCwgZnMpIHtcbiAgICBzdXBlcih3YWxsZXRJZCwgd29ya2VyKTtcbiAgICB0aGlzLnBhdGggPSBwYXRoO1xuICAgIHRoaXMuZnMgPSBmcyA/IGZzIDogKHBhdGggPyBNb25lcm9XYWxsZXRGdWxsLmdldEZzKCkgOiB1bmRlZmluZWQpO1xuICAgIHRoaXMud3JhcHBlZExpc3RlbmVycyA9IFtdO1xuICB9XG5cbiAgZ2V0UGF0aCgpIHtcbiAgICByZXR1cm4gdGhpcy5wYXRoO1xuICB9XG5cbiAgYXN5bmMgZ2V0TmV0d29ya1R5cGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0TmV0d29ya1R5cGVcIik7XG4gIH1cbiAgXG4gIGFzeW5jIHNldFN1YmFkZHJlc3NMYWJlbChhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4LCBsYWJlbCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInNldFN1YmFkZHJlc3NMYWJlbFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpIGFzIFByb21pc2U8dm9pZD47XG4gIH1cbiAgXG4gIGFzeW5jIHNldERhZW1vbkNvbm5lY3Rpb24odXJpT3JScGNDb25uZWN0aW9uKSB7XG4gICAgaWYgKCF1cmlPclJwY0Nvbm5lY3Rpb24pIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwic2V0RGFlbW9uQ29ubmVjdGlvblwiKTtcbiAgICBlbHNlIHtcbiAgICAgIGxldCBjb25uZWN0aW9uID0gIXVyaU9yUnBjQ29ubmVjdGlvbiA/IHVuZGVmaW5lZCA6IHVyaU9yUnBjQ29ubmVjdGlvbiBpbnN0YW5jZW9mIE1vbmVyb1JwY0Nvbm5lY3Rpb24gPyB1cmlPclJwY0Nvbm5lY3Rpb24gOiBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih1cmlPclJwY0Nvbm5lY3Rpb24pO1xuICAgICAgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJzZXREYWVtb25Db25uZWN0aW9uXCIsIGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldENvbmZpZygpIDogdW5kZWZpbmVkKTtcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGdldERhZW1vbkNvbm5lY3Rpb24oKSB7XG4gICAgbGV0IHJwY0NvbmZpZyA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0RGFlbW9uQ29ubmVjdGlvblwiKTtcbiAgICByZXR1cm4gcnBjQ29uZmlnID8gbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24ocnBjQ29uZmlnKSA6IHVuZGVmaW5lZDtcbiAgfVxuICBcbiAgYXN5bmMgaXNDb25uZWN0ZWRUb0RhZW1vbigpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJpc0Nvbm5lY3RlZFRvRGFlbW9uXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRSZXN0b3JlSGVpZ2h0KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldFJlc3RvcmVIZWlnaHRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIHNldFJlc3RvcmVIZWlnaHQocmVzdG9yZUhlaWdodCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInNldFJlc3RvcmVIZWlnaHRcIiwgW3Jlc3RvcmVIZWlnaHRdKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RGFlbW9uSGVpZ2h0KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldERhZW1vbkhlaWdodFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RGFlbW9uTWF4UGVlckhlaWdodCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXREYWVtb25NYXhQZWVySGVpZ2h0XCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRIZWlnaHRCeURhdGUoeWVhciwgbW9udGgsIGRheSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldEhlaWdodEJ5RGF0ZVwiLCBbeWVhciwgbW9udGgsIGRheV0pO1xuICB9XG4gIFxuICBhc3luYyBpc0RhZW1vblN5bmNlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJpc0RhZW1vblN5bmNlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldEhlaWdodFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgYWRkTGlzdGVuZXIobGlzdGVuZXIpIHtcbiAgICBsZXQgd3JhcHBlZExpc3RlbmVyID0gbmV3IFdhbGxldFdvcmtlckxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBsZXQgbGlzdGVuZXJJZCA9IHdyYXBwZWRMaXN0ZW5lci5nZXRJZCgpO1xuICAgIExpYnJhcnlVdGlscy5hZGRXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uU3luY1Byb2dyZXNzX1wiICsgbGlzdGVuZXJJZCwgW3dyYXBwZWRMaXN0ZW5lci5vblN5bmNQcm9ncmVzcywgd3JhcHBlZExpc3RlbmVyXSk7XG4gICAgTGlicmFyeVV0aWxzLmFkZFdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25OZXdCbG9ja19cIiArIGxpc3RlbmVySWQsIFt3cmFwcGVkTGlzdGVuZXIub25OZXdCbG9jaywgd3JhcHBlZExpc3RlbmVyXSk7XG4gICAgTGlicmFyeVV0aWxzLmFkZFdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25CYWxhbmNlc0NoYW5nZWRfXCIgKyBsaXN0ZW5lcklkLCBbd3JhcHBlZExpc3RlbmVyLm9uQmFsYW5jZXNDaGFuZ2VkLCB3cmFwcGVkTGlzdGVuZXJdKTtcbiAgICBMaWJyYXJ5VXRpbHMuYWRkV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvbk91dHB1dFJlY2VpdmVkX1wiICsgbGlzdGVuZXJJZCwgW3dyYXBwZWRMaXN0ZW5lci5vbk91dHB1dFJlY2VpdmVkLCB3cmFwcGVkTGlzdGVuZXJdKTtcbiAgICBMaWJyYXJ5VXRpbHMuYWRkV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvbk91dHB1dFNwZW50X1wiICsgbGlzdGVuZXJJZCwgW3dyYXBwZWRMaXN0ZW5lci5vbk91dHB1dFNwZW50LCB3cmFwcGVkTGlzdGVuZXJdKTtcbiAgICB0aGlzLndyYXBwZWRMaXN0ZW5lcnMucHVzaCh3cmFwcGVkTGlzdGVuZXIpO1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImFkZExpc3RlbmVyXCIsIFtsaXN0ZW5lcklkXSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndyYXBwZWRMaXN0ZW5lcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLndyYXBwZWRMaXN0ZW5lcnNbaV0uZ2V0TGlzdGVuZXIoKSA9PT0gbGlzdGVuZXIpIHtcbiAgICAgICAgbGV0IGxpc3RlbmVySWQgPSB0aGlzLndyYXBwZWRMaXN0ZW5lcnNbaV0uZ2V0SWQoKTtcbiAgICAgICAgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJyZW1vdmVMaXN0ZW5lclwiLCBbbGlzdGVuZXJJZF0pO1xuICAgICAgICBMaWJyYXJ5VXRpbHMucmVtb3ZlV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvblN5bmNQcm9ncmVzc19cIiArIGxpc3RlbmVySWQpO1xuICAgICAgICBMaWJyYXJ5VXRpbHMucmVtb3ZlV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvbk5ld0Jsb2NrX1wiICsgbGlzdGVuZXJJZCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5yZW1vdmVXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uQmFsYW5jZXNDaGFuZ2VkX1wiICsgbGlzdGVuZXJJZCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5yZW1vdmVXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uT3V0cHV0UmVjZWl2ZWRfXCIgKyBsaXN0ZW5lcklkKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnJlbW92ZVdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25PdXRwdXRTcGVudF9cIiArIGxpc3RlbmVySWQpO1xuICAgICAgICB0aGlzLndyYXBwZWRMaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkxpc3RlbmVyIGlzIG5vdCByZWdpc3RlcmVkIHdpdGggd2FsbGV0XCIpO1xuICB9XG4gIFxuICBnZXRMaXN0ZW5lcnMoKSB7XG4gICAgbGV0IGxpc3RlbmVycyA9IFtdO1xuICAgIGZvciAobGV0IHdyYXBwZWRMaXN0ZW5lciBvZiB0aGlzLndyYXBwZWRMaXN0ZW5lcnMpIGxpc3RlbmVycy5wdXNoKHdyYXBwZWRMaXN0ZW5lci5nZXRMaXN0ZW5lcigpKTtcbiAgICByZXR1cm4gbGlzdGVuZXJzO1xuICB9XG4gIFxuICBhc3luYyBpc1N5bmNlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJpc1N5bmNlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgc3luYyhsaXN0ZW5lck9yU3RhcnRIZWlnaHQ/OiBNb25lcm9XYWxsZXRMaXN0ZW5lciB8IG51bWJlciwgc3RhcnRIZWlnaHQ/OiBudW1iZXIsIGFsbG93Q29uY3VycmVudENhbGxzID0gZmFsc2UpOiBQcm9taXNlPE1vbmVyb1N5bmNSZXN1bHQ+IHtcbiAgICBcbiAgICAvLyBub3JtYWxpemUgcGFyYW1zXG4gICAgc3RhcnRIZWlnaHQgPSBsaXN0ZW5lck9yU3RhcnRIZWlnaHQgaW5zdGFuY2VvZiBNb25lcm9XYWxsZXRMaXN0ZW5lciA/IHN0YXJ0SGVpZ2h0IDogbGlzdGVuZXJPclN0YXJ0SGVpZ2h0O1xuICAgIGxldCBsaXN0ZW5lciA9IGxpc3RlbmVyT3JTdGFydEhlaWdodCBpbnN0YW5jZW9mIE1vbmVyb1dhbGxldExpc3RlbmVyID8gbGlzdGVuZXJPclN0YXJ0SGVpZ2h0IDogdW5kZWZpbmVkO1xuICAgIGlmIChzdGFydEhlaWdodCA9PT0gdW5kZWZpbmVkKSBzdGFydEhlaWdodCA9IE1hdGgubWF4KGF3YWl0IHRoaXMuZ2V0SGVpZ2h0KCksIGF3YWl0IHRoaXMuZ2V0UmVzdG9yZUhlaWdodCgpKTtcbiAgICBcbiAgICAvLyByZWdpc3RlciBsaXN0ZW5lciBpZiBnaXZlblxuICAgIGlmIChsaXN0ZW5lcikgYXdhaXQgdGhpcy5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgXG4gICAgLy8gc3luYyB3YWxsZXQgaW4gd29ya2VyIFxuICAgIGxldCBlcnI7XG4gICAgbGV0IHJlc3VsdDtcbiAgICB0cnkge1xuICAgICAgbGV0IHJlc3VsdEpzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInN5bmNcIiwgW3N0YXJ0SGVpZ2h0LCBhbGxvd0NvbmN1cnJlbnRDYWxsc10pO1xuICAgICAgcmVzdWx0ID0gbmV3IE1vbmVyb1N5bmNSZXN1bHQocmVzdWx0SnNvbi5udW1CbG9ja3NGZXRjaGVkLCByZXN1bHRKc29uLnJlY2VpdmVkTW9uZXkpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGVyciA9IGU7XG4gICAgfVxuICAgIFxuICAgIC8vIHVucmVnaXN0ZXIgbGlzdGVuZXJcbiAgICBpZiAobGlzdGVuZXIpIGF3YWl0IHRoaXMucmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIFxuICAgIC8vIHRocm93IGVycm9yIG9yIHJldHVyblxuICAgIGlmIChlcnIpIHRocm93IGVycjtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIFxuICBhc3luYyBzdGFydFN5bmNpbmcoc3luY1BlcmlvZEluTXMpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzdGFydFN5bmNpbmdcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICAgIFxuICBhc3luYyBzdG9wU3luY2luZygpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzdG9wU3luY2luZ1wiKTtcbiAgfVxuICBcbiAgYXN5bmMgc2NhblR4cyh0eEhhc2hlcykge1xuICAgIGFzc2VydChBcnJheS5pc0FycmF5KHR4SGFzaGVzKSwgXCJNdXN0IHByb3ZpZGUgYW4gYXJyYXkgb2YgdHhzIGhhc2hlcyB0byBzY2FuXCIpO1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInNjYW5UeHNcIiwgW3R4SGFzaGVzXSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2NhblNwZW50KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInJlc2NhblNwZW50XCIpO1xuICB9XG4gICAgXG4gIGFzeW5jIHJlc2NhbkJsb2NrY2hhaW4oKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwicmVzY2FuQmxvY2tjaGFpblwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmFsYW5jZShhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSB7XG4gICAgcmV0dXJuIEJpZ0ludChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldEJhbGFuY2VcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFVubG9ja2VkQmFsYW5jZShhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSB7XG4gICAgbGV0IHVubG9ja2VkQmFsYW5jZVN0ciA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0VW5sb2NrZWRCYWxhbmNlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gICAgcmV0dXJuIEJpZ0ludCh1bmxvY2tlZEJhbGFuY2VTdHIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRBY2NvdW50cyhpbmNsdWRlU3ViYWRkcmVzc2VzLCB0YWcpIHtcbiAgICBsZXQgYWNjb3VudHMgPSBbXTtcbiAgICBmb3IgKGxldCBhY2NvdW50SnNvbiBvZiAoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRBY2NvdW50c1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKSkge1xuICAgICAgYWNjb3VudHMucHVzaChNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplQWNjb3VudChuZXcgTW9uZXJvQWNjb3VudChhY2NvdW50SnNvbikpKTtcbiAgICB9XG4gICAgcmV0dXJuIGFjY291bnRzO1xuICB9XG4gIFxuICBhc3luYyBnZXRBY2NvdW50KGFjY291bnRJZHgsIGluY2x1ZGVTdWJhZGRyZXNzZXMpIHtcbiAgICBsZXQgYWNjb3VudEpzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldEFjY291bnRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZUFjY291bnQobmV3IE1vbmVyb0FjY291bnQoYWNjb3VudEpzb24pKTtcbiAgfVxuICBcbiAgYXN5bmMgY3JlYXRlQWNjb3VudChsYWJlbCkge1xuICAgIGxldCBhY2NvdW50SnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiY3JlYXRlQWNjb3VudFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplQWNjb3VudChuZXcgTW9uZXJvQWNjb3VudChhY2NvdW50SnNvbikpO1xuICB9XG4gIFxuICBhc3luYyBnZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgc3ViYWRkcmVzc0luZGljZXMpIHtcbiAgICBsZXQgc3ViYWRkcmVzc2VzID0gW107XG4gICAgZm9yIChsZXQgc3ViYWRkcmVzc0pzb24gb2YgKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0U3ViYWRkcmVzc2VzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpKSB7XG4gICAgICBzdWJhZGRyZXNzZXMucHVzaChNb25lcm9XYWxsZXRLZXlzLnNhbml0aXplU3ViYWRkcmVzcyhuZXcgTW9uZXJvU3ViYWRkcmVzcyhzdWJhZGRyZXNzSnNvbikpKTtcbiAgICB9XG4gICAgcmV0dXJuIHN1YmFkZHJlc3NlcztcbiAgfVxuICBcbiAgYXN5bmMgY3JlYXRlU3ViYWRkcmVzcyhhY2NvdW50SWR4LCBsYWJlbCkge1xuICAgIGxldCBzdWJhZGRyZXNzSnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiY3JlYXRlU3ViYWRkcmVzc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRLZXlzLnNhbml0aXplU3ViYWRkcmVzcyhuZXcgTW9uZXJvU3ViYWRkcmVzcyhzdWJhZGRyZXNzSnNvbikpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeHMocXVlcnkpIHtcbiAgICBxdWVyeSA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVUeFF1ZXJ5KHF1ZXJ5KTtcbiAgICBsZXQgcmVzcEpzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldFR4c1wiLCBbcXVlcnkuZ2V0QmxvY2soKS50b0pzb24oKV0pO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplVHhzKHF1ZXJ5LCBKU09OLnN0cmluZ2lmeSh7YmxvY2tzOiByZXNwSnNvbi5ibG9ja3N9KSk7IC8vIGluaXRpYWxpemUgdHhzIGZyb20gYmxvY2tzIGpzb24gc3RyaW5nIFRPRE86IHRoaXMgc3RyaW5naWZpZXMgdGhlbiB1dGlsaXR5IHBhcnNlcywgYXZvaWRcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHJhbnNmZXJzKHF1ZXJ5KSB7XG4gICAgcXVlcnkgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplVHJhbnNmZXJRdWVyeShxdWVyeSk7XG4gICAgbGV0IGJsb2NrSnNvbnMgPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldFRyYW5zZmVyc1wiLCBbcXVlcnkuZ2V0VHhRdWVyeSgpLmdldEJsb2NrKCkudG9Kc29uKCldKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZVRyYW5zZmVycyhxdWVyeSwgSlNPTi5zdHJpbmdpZnkoe2Jsb2NrczogYmxvY2tKc29uc30pKTsgLy8gaW5pdGlhbGl6ZSB0cmFuc2ZlcnMgZnJvbSBibG9ja3MganNvbiBzdHJpbmcgVE9ETzogdGhpcyBzdHJpbmdpZmllcyB0aGVuIHV0aWxpdHkgcGFyc2VzLCBhdm9pZFxuICB9XG4gIFxuICBhc3luYyBnZXRPdXRwdXRzKHF1ZXJ5KSB7XG4gICAgcXVlcnkgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplT3V0cHV0UXVlcnkocXVlcnkpO1xuICAgIGxldCBibG9ja0pzb25zID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRPdXRwdXRzXCIsIFtxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0QmxvY2soKS50b0pzb24oKV0pO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplT3V0cHV0cyhxdWVyeSwgSlNPTi5zdHJpbmdpZnkoe2Jsb2NrczogYmxvY2tKc29uc30pKTsgLy8gaW5pdGlhbGl6ZSB0cmFuc2ZlcnMgZnJvbSBibG9ja3MganNvbiBzdHJpbmcgVE9ETzogdGhpcyBzdHJpbmdpZmllcyB0aGVuIHV0aWxpdHkgcGFyc2VzLCBhdm9pZFxuICB9XG4gIFxuICBhc3luYyBleHBvcnRPdXRwdXRzKGFsbCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImV4cG9ydE91dHB1dHNcIiwgW2FsbF0pO1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRPdXRwdXRzKG91dHB1dHNIZXgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJpbXBvcnRPdXRwdXRzXCIsIFtvdXRwdXRzSGV4XSk7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydEtleUltYWdlcyhhbGwpIHtcbiAgICBsZXQga2V5SW1hZ2VzID0gW107XG4gICAgZm9yIChsZXQga2V5SW1hZ2VKc29uIG9mIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0S2V5SW1hZ2VzXCIsIFthbGxdKSkga2V5SW1hZ2VzLnB1c2gobmV3IE1vbmVyb0tleUltYWdlKGtleUltYWdlSnNvbikpO1xuICAgIHJldHVybiBrZXlJbWFnZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGltcG9ydEtleUltYWdlcyhrZXlJbWFnZXMpIHtcbiAgICBsZXQga2V5SW1hZ2VzSnNvbiA9IFtdO1xuICAgIGZvciAobGV0IGtleUltYWdlIG9mIGtleUltYWdlcykga2V5SW1hZ2VzSnNvbi5wdXNoKGtleUltYWdlLnRvSnNvbigpKTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiaW1wb3J0S2V5SW1hZ2VzXCIsIFtrZXlJbWFnZXNKc29uXSkpO1xuICB9XG4gIFxuICBhc3luYyBnZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCgpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNb25lcm9XYWxsZXRGdWxsLmdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0KCkgbm90IGltcGxlbWVudGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBmcmVlemVPdXRwdXQoa2V5SW1hZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJmcmVlemVPdXRwdXRcIiwgW2tleUltYWdlXSk7XG4gIH1cbiAgXG4gIGFzeW5jIHRoYXdPdXRwdXQoa2V5SW1hZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJ0aGF3T3V0cHV0XCIsIFtrZXlJbWFnZV0pO1xuICB9XG4gIFxuICBhc3luYyBpc091dHB1dEZyb3plbihrZXlJbWFnZSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImlzT3V0cHV0RnJvemVuXCIsIFtrZXlJbWFnZV0pO1xuICB9XG4gIFxuICBhc3luYyBjcmVhdGVUeHMoY29uZmlnKSB7XG4gICAgY29uZmlnID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyhjb25maWcpO1xuICAgIGxldCB0eFNldEpzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImNyZWF0ZVR4c1wiLCBbY29uZmlnLnRvSnNvbigpXSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9UeFNldCh0eFNldEpzb24pLmdldFR4cygpO1xuICB9XG4gIFxuICBhc3luYyBzd2VlcE91dHB1dChjb25maWcpIHtcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplU3dlZXBPdXRwdXRDb25maWcoY29uZmlnKTtcbiAgICBsZXQgdHhTZXRKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJzd2VlcE91dHB1dFwiLCBbY29uZmlnLnRvSnNvbigpXSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9UeFNldCh0eFNldEpzb24pLmdldFR4cygpWzBdO1xuICB9XG5cbiAgYXN5bmMgc3dlZXBVbmxvY2tlZChjb25maWcpIHtcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplU3dlZXBVbmxvY2tlZENvbmZpZyhjb25maWcpO1xuICAgIGxldCB0eFNldHNKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJzd2VlcFVubG9ja2VkXCIsIFtjb25maWcudG9Kc29uKCldKTtcbiAgICBsZXQgdHhzID0gW107XG4gICAgZm9yIChsZXQgdHhTZXRKc29uIG9mIHR4U2V0c0pzb24pIGZvciAobGV0IHR4IG9mIG5ldyBNb25lcm9UeFNldCh0eFNldEpzb24pLmdldFR4cygpKSB0eHMucHVzaCh0eCk7XG4gICAgcmV0dXJuIHR4cztcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBEdXN0KHJlbGF5KSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9UeFNldChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInN3ZWVwRHVzdFwiLCBbcmVsYXldKSkuZ2V0VHhzKCkgfHwgW107XG4gIH1cbiAgXG4gIGFzeW5jIHJlbGF5VHhzKHR4c09yTWV0YWRhdGFzKSB7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkodHhzT3JNZXRhZGF0YXMpLCBcIk11c3QgcHJvdmlkZSBhbiBhcnJheSBvZiB0eHMgb3IgdGhlaXIgbWV0YWRhdGEgdG8gcmVsYXlcIik7XG4gICAgbGV0IHR4TWV0YWRhdGFzID0gW107XG4gICAgZm9yIChsZXQgdHhPck1ldGFkYXRhIG9mIHR4c09yTWV0YWRhdGFzKSB0eE1ldGFkYXRhcy5wdXNoKHR4T3JNZXRhZGF0YSBpbnN0YW5jZW9mIE1vbmVyb1R4V2FsbGV0ID8gdHhPck1ldGFkYXRhLmdldE1ldGFkYXRhKCkgOiB0eE9yTWV0YWRhdGEpO1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInJlbGF5VHhzXCIsIFt0eE1ldGFkYXRhc10pO1xuICB9XG4gIFxuICBhc3luYyBkZXNjcmliZVR4U2V0KHR4U2V0KSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9UeFNldChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImRlc2NyaWJlVHhTZXRcIiwgW3R4U2V0LnRvSnNvbigpXSkpO1xuICB9XG4gIFxuICBhc3luYyBzaWduVHhzKHVuc2lnbmVkVHhIZXgpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1R4U2V0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwic2lnblR4c1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgc3VibWl0VHhzKHNpZ25lZFR4SGV4KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic3VibWl0VHhzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNpZ25NZXNzYWdlKG1lc3NhZ2UsIHNpZ25hdHVyZVR5cGUsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzaWduTWVzc2FnZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyB2ZXJpZnlNZXNzYWdlKG1lc3NhZ2UsIGFkZHJlc3MsIHNpZ25hdHVyZSkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInZlcmlmeU1lc3NhZ2VcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4S2V5KHR4SGFzaCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldFR4S2V5XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrVHhLZXkodHhIYXNoLCB0eEtleSwgYWRkcmVzcykge1xuICAgIHJldHVybiBuZXcgTW9uZXJvQ2hlY2tUeChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImNoZWNrVHhLZXlcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4UHJvb2YodHhIYXNoLCBhZGRyZXNzLCBtZXNzYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0VHhQcm9vZlwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBjaGVja1R4UHJvb2YodHhIYXNoLCBhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0NoZWNrVHgoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJjaGVja1R4UHJvb2ZcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFNwZW5kUHJvb2YodHhIYXNoLCBtZXNzYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0U3BlbmRQcm9vZlwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBjaGVja1NwZW5kUHJvb2YodHhIYXNoLCBtZXNzYWdlLCBzaWduYXR1cmUpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJjaGVja1NwZW5kUHJvb2ZcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UmVzZXJ2ZVByb29mV2FsbGV0KG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRSZXNlcnZlUHJvb2ZXYWxsZXRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UmVzZXJ2ZVByb29mQWNjb3VudChhY2NvdW50SWR4LCBhbW91bnQsIG1lc3NhZ2UpIHtcbiAgICB0cnkgeyByZXR1cm4gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRSZXNlcnZlUHJvb2ZBY2NvdW50XCIsIFthY2NvdW50SWR4LCBhbW91bnQudG9TdHJpbmcoKSwgbWVzc2FnZV0pOyB9XG4gICAgY2F0Y2ggKGU6IGFueSkgeyB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZS5tZXNzYWdlLCAtMSk7IH1cbiAgfVxuXG4gIGFzeW5jIGNoZWNrUmVzZXJ2ZVByb29mKGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSkge1xuICAgIHRyeSB7IHJldHVybiBuZXcgTW9uZXJvQ2hlY2tSZXNlcnZlKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiY2hlY2tSZXNlcnZlUHJvb2ZcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7IH1cbiAgICBjYXRjaCAoZTogYW55KSB7IHRocm93IG5ldyBNb25lcm9FcnJvcihlLm1lc3NhZ2UsIC0xKTsgfVxuICB9XG4gIFxuICBhc3luYyBnZXRUeE5vdGVzKHR4SGFzaGVzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0VHhOb3Rlc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBzZXRUeE5vdGVzKHR4SGFzaGVzLCBub3Rlcykge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInNldFR4Tm90ZXNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzKGVudHJ5SW5kaWNlcykge1xuICAgIGlmICghZW50cnlJbmRpY2VzKSBlbnRyeUluZGljZXMgPSBbXTtcbiAgICBsZXQgZW50cmllcyA9IFtdO1xuICAgIGZvciAobGV0IGVudHJ5SnNvbiBvZiBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldEFkZHJlc3NCb29rRW50cmllc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKSB7XG4gICAgICBlbnRyaWVzLnB1c2gobmV3IE1vbmVyb0FkZHJlc3NCb29rRW50cnkoZW50cnlKc29uKSk7XG4gICAgfVxuICAgIHJldHVybiBlbnRyaWVzO1xuICB9XG4gIFxuICBhc3luYyBhZGRBZGRyZXNzQm9va0VudHJ5KGFkZHJlc3MsIGRlc2NyaXB0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiYWRkQWRkcmVzc0Jvb2tFbnRyeVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBlZGl0QWRkcmVzc0Jvb2tFbnRyeShpbmRleCwgc2V0QWRkcmVzcywgYWRkcmVzcywgc2V0RGVzY3JpcHRpb24sIGRlc2NyaXB0aW9uKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZWRpdEFkZHJlc3NCb29rRW50cnlcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeShlbnRyeUlkeCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImRlbGV0ZUFkZHJlc3NCb29rRW50cnlcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgdGFnQWNjb3VudHModGFnLCBhY2NvdW50SW5kaWNlcykge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInRhZ0FjY291bnRzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cblxuICBhc3luYyB1bnRhZ0FjY291bnRzKGFjY291bnRJbmRpY2VzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwidW50YWdBY2NvdW50c1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRBY2NvdW50VGFncygpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRBY2NvdW50VGFnc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG5cbiAgYXN5bmMgc2V0QWNjb3VudFRhZ0xhYmVsKHRhZywgbGFiZWwpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzZXRBY2NvdW50VGFnTGFiZWxcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGF5bWVudFVyaShjb25maWcpIHtcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnKGNvbmZpZyk7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0UGF5bWVudFVyaVwiLCBbY29uZmlnLnRvSnNvbigpXSk7XG4gIH1cbiAgXG4gIGFzeW5jIHBhcnNlUGF5bWVudFVyaSh1cmkpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1R4Q29uZmlnKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwicGFyc2VQYXltZW50VXJpXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBnZXRBdHRyaWJ1dGUoa2V5KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0QXR0cmlidXRlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNldEF0dHJpYnV0ZShrZXksIHZhbCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInNldEF0dHJpYnV0ZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBzdGFydE1pbmluZyhudW1UaHJlYWRzLCBiYWNrZ3JvdW5kTWluaW5nLCBpZ25vcmVCYXR0ZXJ5KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic3RhcnRNaW5pbmdcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgc3RvcE1pbmluZygpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzdG9wTWluaW5nXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzTXVsdGlzaWdJbXBvcnROZWVkZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNNdWx0aXNpZygpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJpc011bHRpc2lnXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRNdWx0aXNpZ0luZm8oKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9NdWx0aXNpZ0luZm8oYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRNdWx0aXNpZ0luZm9cIikpO1xuICB9XG4gIFxuICBhc3luYyBwcmVwYXJlTXVsdGlzaWcoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwicHJlcGFyZU11bHRpc2lnXCIpO1xuICB9XG4gIFxuICBhc3luYyBtYWtlTXVsdGlzaWcobXVsdGlzaWdIZXhlcywgdGhyZXNob2xkLCBwYXNzd29yZCkge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcIm1ha2VNdWx0aXNpZ1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBleGNoYW5nZU11bHRpc2lnS2V5cyhtdWx0aXNpZ0hleGVzLCBwYXNzd29yZCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZXhjaGFuZ2VNdWx0aXNpZ0tleXNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydE11bHRpc2lnSGV4KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImV4cG9ydE11bHRpc2lnSGV4XCIpO1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRNdWx0aXNpZ0hleChtdWx0aXNpZ0hleGVzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaW1wb3J0TXVsdGlzaWdIZXhcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgc2lnbk11bHRpc2lnVHhIZXgobXVsdGlzaWdUeEhleCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwic2lnbk11bHRpc2lnVHhIZXhcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdE11bHRpc2lnVHhIZXgoc2lnbmVkTXVsdGlzaWdUeEhleCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInN1Ym1pdE11bHRpc2lnVHhIZXhcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RGF0YSgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXREYXRhXCIpO1xuICB9XG4gIFxuICBhc3luYyBtb3ZlVG8ocGF0aCkge1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLm1vdmVUbyhwYXRoLCB0aGlzKTtcbiAgfVxuICBcbiAgYXN5bmMgY2hhbmdlUGFzc3dvcmQob2xkUGFzc3dvcmQsIG5ld1Bhc3N3b3JkKSB7XG4gICAgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJjaGFuZ2VQYXNzd29yZFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIGlmICh0aGlzLnBhdGgpIGF3YWl0IHRoaXMuc2F2ZSgpOyAvLyBhdXRvIHNhdmVcbiAgfVxuICBcbiAgYXN5bmMgc2F2ZSgpIHtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5zYXZlKHRoaXMpO1xuICB9XG5cbiAgYXN5bmMgY2xvc2Uoc2F2ZSkge1xuICAgIGlmIChhd2FpdCB0aGlzLmlzQ2xvc2VkKCkpIHJldHVybjtcbiAgICBpZiAoc2F2ZSkgYXdhaXQgdGhpcy5zYXZlKCk7XG4gICAgd2hpbGUgKHRoaXMud3JhcHBlZExpc3RlbmVycy5sZW5ndGgpIGF3YWl0IHRoaXMucmVtb3ZlTGlzdGVuZXIodGhpcy53cmFwcGVkTGlzdGVuZXJzWzBdLmdldExpc3RlbmVyKCkpO1xuICAgIGF3YWl0IHN1cGVyLmNsb3NlKGZhbHNlKTtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBMSVNURU5JTkcgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8qKlxuICogUmVjZWl2ZXMgbm90aWZpY2F0aW9ucyBkaXJlY3RseSBmcm9tIHdhc20gYysrLlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBXYWxsZXRXYXNtTGlzdGVuZXIge1xuXG4gIHByb3RlY3RlZCB3YWxsZXQ6IE1vbmVyb1dhbGxldDtcbiAgXG4gIGNvbnN0cnVjdG9yKHdhbGxldCkge1xuICAgIHRoaXMud2FsbGV0ID0gd2FsbGV0O1xuICB9XG4gIFxuICBhc3luYyBvblN5bmNQcm9ncmVzcyhoZWlnaHQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIHBlcmNlbnREb25lLCBtZXNzYWdlKSB7XG4gICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VTeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSk7XG4gIH1cbiAgXG4gIGFzeW5jIG9uTmV3QmxvY2soaGVpZ2h0KSB7XG4gICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VOZXdCbG9jayhoZWlnaHQpO1xuICB9XG4gIFxuICBhc3luYyBvbkJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlU3RyLCBuZXdVbmxvY2tlZEJhbGFuY2VTdHIpIHtcbiAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZUJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlU3RyLCBuZXdVbmxvY2tlZEJhbGFuY2VTdHIpO1xuICB9XG4gIFxuICBhc3luYyBvbk91dHB1dFJlY2VpdmVkKGhlaWdodCwgdHhIYXNoLCBhbW91bnRTdHIsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIHZlcnNpb24sIHVubG9ja1RpbWUsIGlzTG9ja2VkKSB7XG4gICAgXG4gICAgLy8gYnVpbGQgcmVjZWl2ZWQgb3V0cHV0XG4gICAgbGV0IG91dHB1dCA9IG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKTtcbiAgICBvdXRwdXQuc2V0QW1vdW50KEJpZ0ludChhbW91bnRTdHIpKTtcbiAgICBvdXRwdXQuc2V0QWNjb3VudEluZGV4KGFjY291bnRJZHgpO1xuICAgIG91dHB1dC5zZXRTdWJhZGRyZXNzSW5kZXgoc3ViYWRkcmVzc0lkeCk7XG4gICAgbGV0IHR4ID0gbmV3IE1vbmVyb1R4V2FsbGV0KCk7XG4gICAgdHguc2V0SGFzaCh0eEhhc2gpO1xuICAgIHR4LnNldFZlcnNpb24odmVyc2lvbik7XG4gICAgdHguc2V0VW5sb2NrVGltZSh1bmxvY2tUaW1lKTtcbiAgICBvdXRwdXQuc2V0VHgodHgpO1xuICAgIHR4LnNldE91dHB1dHMoW291dHB1dF0pO1xuICAgIHR4LnNldElzSW5jb21pbmcodHJ1ZSk7XG4gICAgdHguc2V0SXNMb2NrZWQoaXNMb2NrZWQpO1xuICAgIGlmIChoZWlnaHQgPiAwKSB7XG4gICAgICBsZXQgYmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soKS5zZXRIZWlnaHQoaGVpZ2h0KTtcbiAgICAgIGJsb2NrLnNldFR4cyhbdHggYXMgTW9uZXJvVHhdKTtcbiAgICAgIHR4LnNldEJsb2NrKGJsb2NrKTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbCh0cnVlKTtcbiAgICB9XG4gICAgXG4gICAgLy8gYW5ub3VuY2Ugb3V0cHV0XG4gICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VPdXRwdXRSZWNlaXZlZChvdXRwdXQpO1xuICB9XG4gIFxuICBhc3luYyBvbk91dHB1dFNwZW50KGhlaWdodCwgdHhIYXNoLCBhbW91bnRTdHIsIGFjY291bnRJZHhTdHIsIHN1YmFkZHJlc3NJZHhTdHIsIHZlcnNpb24sIHVubG9ja1RpbWUsIGlzTG9ja2VkKSB7XG4gICAgXG4gICAgLy8gYnVpbGQgc3BlbnQgb3V0cHV0XG4gICAgbGV0IG91dHB1dCA9IG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKTtcbiAgICBvdXRwdXQuc2V0QW1vdW50KEJpZ0ludChhbW91bnRTdHIpKTtcbiAgICBpZiAoYWNjb3VudElkeFN0cikgb3V0cHV0LnNldEFjY291bnRJbmRleChwYXJzZUludChhY2NvdW50SWR4U3RyKSk7XG4gICAgaWYgKHN1YmFkZHJlc3NJZHhTdHIpIG91dHB1dC5zZXRTdWJhZGRyZXNzSW5kZXgocGFyc2VJbnQoc3ViYWRkcmVzc0lkeFN0cikpO1xuICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgIHR4LnNldEhhc2godHhIYXNoKTtcbiAgICB0eC5zZXRWZXJzaW9uKHZlcnNpb24pO1xuICAgIHR4LnNldFVubG9ja1RpbWUodW5sb2NrVGltZSk7XG4gICAgdHguc2V0SXNMb2NrZWQoaXNMb2NrZWQpO1xuICAgIG91dHB1dC5zZXRUeCh0eCk7XG4gICAgdHguc2V0SW5wdXRzKFtvdXRwdXRdKTtcbiAgICBpZiAoaGVpZ2h0ID4gMCkge1xuICAgICAgbGV0IGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0SGVpZ2h0KGhlaWdodCk7XG4gICAgICBibG9jay5zZXRUeHMoW3R4XSk7XG4gICAgICB0eC5zZXRCbG9jayhibG9jayk7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SW5UeFBvb2wodHJ1ZSk7XG4gICAgfVxuICAgIFxuICAgIC8vIGFubm91bmNlIG91dHB1dFxuICAgIGF3YWl0IHRoaXMud2FsbGV0LmFubm91bmNlT3V0cHV0U3BlbnQob3V0cHV0KTtcbiAgfVxufVxuXG4vKipcbiAqIEludGVybmFsIGxpc3RlbmVyIHRvIGJyaWRnZSBub3RpZmljYXRpb25zIHRvIGV4dGVybmFsIGxpc3RlbmVycy5cbiAqIFxuICogQHByaXZhdGVcbiAqL1xuY2xhc3MgV2FsbGV0V29ya2VyTGlzdGVuZXIge1xuXG4gIHByb3RlY3RlZCBpZDogYW55O1xuICBwcm90ZWN0ZWQgbGlzdGVuZXI6IGFueTtcbiAgXG4gIGNvbnN0cnVjdG9yKGxpc3RlbmVyKSB7XG4gICAgdGhpcy5pZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICB0aGlzLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIH1cbiAgXG4gIGdldElkKCkge1xuICAgIHJldHVybiB0aGlzLmlkO1xuICB9XG4gIFxuICBnZXRMaXN0ZW5lcigpIHtcbiAgICByZXR1cm4gdGhpcy5saXN0ZW5lcjtcbiAgfVxuICBcbiAgb25TeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSkge1xuICAgIHRoaXMubGlzdGVuZXIub25TeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSk7XG4gIH1cblxuICBhc3luYyBvbk5ld0Jsb2NrKGhlaWdodCkge1xuICAgIGF3YWl0IHRoaXMubGlzdGVuZXIub25OZXdCbG9jayhoZWlnaHQpO1xuICB9XG4gIFxuICBhc3luYyBvbkJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlU3RyLCBuZXdVbmxvY2tlZEJhbGFuY2VTdHIpIHtcbiAgICBhd2FpdCB0aGlzLmxpc3RlbmVyLm9uQmFsYW5jZXNDaGFuZ2VkKEJpZ0ludChuZXdCYWxhbmNlU3RyKSwgQmlnSW50KG5ld1VubG9ja2VkQmFsYW5jZVN0cikpO1xuICB9XG5cbiAgYXN5bmMgb25PdXRwdXRSZWNlaXZlZChibG9ja0pzb24pIHtcbiAgICBsZXQgYmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uLCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYX1dBTExFVCk7XG4gICAgYXdhaXQgdGhpcy5saXN0ZW5lci5vbk91dHB1dFJlY2VpdmVkKGJsb2NrLmdldFR4cygpWzBdLmdldE91dHB1dHMoKVswXSk7XG4gIH1cbiAgXG4gIGFzeW5jIG9uT3V0cHV0U3BlbnQoYmxvY2tKc29uKSB7XG4gICAgbGV0IGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWF9XQUxMRVQpO1xuICAgIGF3YWl0IHRoaXMubGlzdGVuZXIub25PdXRwdXRTcGVudChibG9jay5nZXRUeHMoKVswXS5nZXRJbnB1dHMoKVswXSk7XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLEtBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLFNBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFHLGFBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFJLFdBQUEsR0FBQUwsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFLLGNBQUEsR0FBQU4sc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFNLGlCQUFBLEdBQUFQLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTyx1QkFBQSxHQUFBUixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVEsWUFBQSxHQUFBVCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVMsY0FBQSxHQUFBVixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVUsbUJBQUEsR0FBQVgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFXLGdCQUFBLEdBQUFaLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBWSxZQUFBLEdB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