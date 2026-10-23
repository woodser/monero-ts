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

var _MoneroKeyImageExportResult = _interopRequireDefault(require("./model/MoneroKeyImageExportResult"));
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











  syncCalls = new Set();

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

    // apply explicit daemon trust
    if (config.getIsTrustedDaemon() !== undefined && config.getServer()) await wallet.setDaemonConnection(config.getServer(), config.getIsTrustedDaemon());

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
    let module = await _LibraryUtils.default.loadWasmModule();

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
    let module = await _LibraryUtils.default.loadWasmModule();

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
    let module = await _LibraryUtils.default.loadWasmModule();

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
    let module = await _LibraryUtils.default.loadWasmModule();
    return module.queueTask(async () => {
      return JSON.parse(module.get_keys_wallet_seed_languages()).languages;
    });
  }

  static getFs() {
    if (!MoneroWalletFull.FS) MoneroWalletFull.FS = _fs.default.promises;
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
          if (typeof resp === "string") reject(new _MoneroError.default(resp));else
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
          if (typeof resp === "string") reject(new _MoneroError.default(resp));else
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

  async setConnectionManager(connectionManager) {
    this.assertNotClosed();
    return super.setConnectionManager(connectionManager);
  }

  async setDaemonConnection(uriOrConnection, isTrusted) {
    if (this.getWalletProxy()) return this.getWalletProxy().setDaemonConnection(uriOrConnection, isTrusted);

    // normalize connection
    let connection = !uriOrConnection ? undefined : uriOrConnection instanceof _MoneroRpcConnection.default ? uriOrConnection : new _MoneroRpcConnection.default(uriOrConnection);
    let uri = connection && connection.getUri() ? connection.getUri() : "";
    let username = connection && connection.getUsername() ? connection.getUsername() : "";
    let password = connection && connection.getPassword() ? connection.getPassword() : "";
    let proxyUri = connection && connection.getProxyUri() ? connection.getProxyUri() : "";
    let rejectUnauthorized = connection ? connection.getRejectUnauthorized() : undefined;
    let isTrustedArg = isTrusted === undefined ? -1 : isTrusted ? 1 : 0; // negative if unset

    // set connection in queue
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.set_daemon_connection(this.cppAddress, uri, username, password, proxyUri, isTrustedArg, (resp) => {
          this.rejectUnauthorized = rejectUnauthorized; // persist locally
          resolve();
        });
      });
    });
  }

  /**
   * Indicates if the wallet's daemon is trusted.
   *
   * @return {Promise<boolean>} true if the daemon is trusted, false otherwise
   */
  async isDaemonTrusted() {
    if (this.getWalletProxy()) return this.getWalletProxy().isDaemonTrusted();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return this.module.is_daemon_trusted(this.cppAddress);
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
          resolve(new _MoneroRpcConnection.default({ uri: jsonConnection.uri, username: jsonConnection.username, password: jsonConnection.password, proxyUri: jsonConnection.proxyUri, rejectUnauthorized: this.rejectUnauthorized }));
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
        if (result.charAt(0) !== '{') throw new _MoneroError.default(result);
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
        if (result.charAt(0) !== '{') throw new _MoneroError.default(result);
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
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.get_daemon_height(this.cppAddress, (resp) => {
          if (typeof resp === "string") reject(new _MoneroError.default(resp));else
          resolve(resp);
        });
      });
    });
  }

  async getHeightByDate(year, month, day) {
    if (this.getWalletProxy()) return this.getWalletProxy().getHeightByDate(year, month, day);
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
        let resolveCall;
        let rejectCall;
        const call = new Promise((resolve, reject) => {resolveCall = resolve;rejectCall = reject;});
        that.syncCalls.add(call);
        try {
          // sync wallet in wasm which invokes callback when done
          that.module.sync(that.cppAddress, startHeight, (resp) => {
            if (resp.charAt(0) !== '{') rejectCall(new _MoneroError.default(resp));else
            {
              let respJson = JSON.parse(resp);
              resolveCall(new _MoneroSyncResult.default(respJson.numBlocksFetched, respJson.receivedMoney));
            }
          });
        } catch (err) {
          rejectCall(err);
        }
        return call.finally(() => that.syncCalls.delete(call));
      }
    } catch (e) {
      err = e;
    }

    // unregister listener
    if (listener && !this._isClosed) await this.removeListener(listener);

    // throw error or return
    if (err) throw err;
    return result;
  }

  async startSyncing(syncPeriodInMs) {
    if (this.getWalletProxy()) return this.getWalletProxy().startSyncing(syncPeriodInMs);
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
        this.module.rescan_spent(this.cppAddress, (err) => {
          if (err) reject(new _MoneroError.default(err));else
          resolve();
        });
      });
    });
  }

  async rescanBlockchain() {
    if (this.getWalletProxy()) return this.getWalletProxy().rescanBlockchain();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.rescan_blockchain(this.cppAddress, (err) => {
          if (err) reject(new _MoneroError.default(err));else
          resolve();
        });
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
          if (blocksJsonStr.charAt(0) !== '{') {
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
          if (blocksJsonStr.charAt(0) !== '{') {
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
          if (blocksJsonStr.charAt(0) !== '{') {
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
        this.module.export_key_images(this.cppAddress, all, (resultStr) => {
          if (resultStr.charAt(0) !== '{') reject(new _MoneroError.default(resultStr)); // json expected, else error
          else {
            let resultJson = JSON.parse(_GenUtils.default.stringifyBigInts(resultStr));
            if (!resultJson.keyImages) resultJson.keyImages = [];
            resolve(new _MoneroKeyImageExportResult.default(resultJson));
          }
        });
      });
    });
  }

  async importKeyImages(keyImages, offset = 0) {
    if (this.getWalletProxy()) return this.getWalletProxy().importKeyImages(keyImages, offset);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.import_key_images(this.cppAddress, JSON.stringify({ offset: offset, keyImages: keyImages.map((keyImage) => keyImage.toJson()) }), (keyImageImportResultStr) => {
          if (keyImageImportResultStr.charAt(0) !== '{') reject(new _MoneroError.default(keyImageImportResultStr)); // json expected, else error
          else resolve(new _MoneroKeyImageImportResult.default(JSON.parse(_GenUtils.default.stringifyBigInts(keyImageImportResultStr))));
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

  async getDefaultFeePriority() {
    if (this.getWalletProxy()) return this.getWalletProxy().getDefaultFeePriority();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.get_default_fee_priority(this.cppAddress, (result) => resolve(result));
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
          if (txHashesJson.charAt(0) !== '{') reject(new _MoneroError.default(txHashesJson));else
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
          if (resp.charAt(0) !== '{') reject(new _MoneroError.default(resp));else
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
          if (respJsonStr.charAt(0) !== '{') reject(new _MoneroError.default(respJsonStr));else
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
          if (respJsonStr.charAt(0) !== '{') reject(new _MoneroError.default(respJsonStr));else
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
          if (respJsonStr.charAt(0) !== '{') reject(new _MoneroError.default(respJsonStr, -1));else
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
    notes = notes.map((note) => _GenUtils.default.isInitialized(note) ? note : ""); // the bridge would store json null as text
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

  async importMultisigHex(multisigHexes, refreshAfterImport) {
    if (refreshAfterImport === undefined) refreshAfterImport = true;
    if (this.getWalletProxy()) return this.getWalletProxy().importMultisigHex(multisigHexes, refreshAfterImport);
    if (!_GenUtils.default.isArray(multisigHexes)) throw new _MoneroError.default("Must provide string[] to importMultisigHex()");
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.import_multisig_hex(this.cppAddress, JSON.stringify({ multisigHexes: multisigHexes, refreshAfterImport: refreshAfterImport }), (resp) => {
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
          if (resp.charAt(0) !== '{') reject(new _MoneroError.default(resp));else
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
          if (resp.charAt(0) !== '{') reject(new _MoneroError.default(resp));else
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

    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return this.getDataWasm();
    });
  }

  getDataWasm() {
    let viewOnly = this.module.is_view_only(this.cppAddress);

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

  async closeInternal(save) {
    if (this.walletProxy) {
      await super.closeInternal(save);
      return;
    }
    await this.prepareClose();
    if (save) {
      await _LibraryUtils.default.queueTask(async () => {
        const snapshot = await this.getCloseData();
        await MoneroWalletFull.writeWalletData(this, snapshot.data, snapshot.primaryAddress);
      });
    }
    await super.closeInternal(false, this.wasmListenerHandle);
    this.wasmListenerHandle = 0;
    delete this.path;
    delete this.password;
    delete this.wasmListener;
    _LibraryUtils.default.setRejectUnauthorizedFn(this.rejectUnauthorizedConfigId, undefined); // unregister fn informing if unauthorized reqs should be rejected
  }

  // cancel outside the module queue so a blocked request can release it
  async prepareClose() {
    this._isClosed = true;
    if (this.syncLooper) this.syncLooper.stop();
    this.module._request_wallet_shutdown(this.cppAddress);
    if (this.connectionManager && this.connectionManager.getListeners().includes(this.connectionManagerListener)) this.connectionManager.removeListener(this.connectionManagerListener);
    this.connectionManager = undefined;
    this.connectionManagerListener = undefined;
    await Promise.all(Array.from(this.syncCalls, (call) => call.catch(() => {})));
    await this.module.queueTask(async () => {});
  }

  // serialize a stopped wallet for saving on this thread or the worker's caller
  async getCloseData() {
    return this.module.queueTask(async () => ({
      data: this.getDataWasm(),
      primaryAddress: this.module.get_address(this.cppAddress, 0, 0)
    }));
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
    let module = await _LibraryUtils.default.loadWasmModule();

    // open wallet in queue
    return module.queueTask(async () => {
      return new Promise((resolve, reject) => {

        // register fn informing if unauthorized reqs should be rejected
        let rejectUnauthorizedFnId = _GenUtils.default.getUUID();
        _LibraryUtils.default.setRejectUnauthorizedFn(rejectUnauthorizedFnId, () => rejectUnauthorized);

        // create wallet in wasm which invokes callback when done
        module.open_wallet_full(config.password, config.networkType, config.keysData ?? "", config.cacheData ?? "", daemonUri, daemonUsername, daemonPassword, rejectUnauthorizedFnId, config.getRegtest() === undefined ? false : config.getRegtest(), (cppAddress) => {
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
    if (this._isClosed) return;
    let isEnabled = this.listeners.length > 0;
    if (this.wasmListenerHandle === 0 && !isEnabled || this.wasmListenerHandle > 0 && isEnabled) return; // no difference
    return this.module.queueTask(async () => {
      if (this._isClosed) return;
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

      if (!(await wallet.getPath())) throw new _MoneroError.default("Cannot save wallet because path is not set");
      await MoneroWalletFull.writeWalletData(wallet, await wallet.getData(), await wallet.getPrimaryAddress());
    });
  }

  static async writeWalletData(wallet, data, primaryAddress) {
    let path = wallet.path;
    if (!path) throw new _MoneroError.default("Cannot save wallet because path is not set");

    // write wallet files to *.new
    let pathNew = path + ".new";
    await wallet.fs.writeFile(pathNew + ".keys", data[0], "binary");
    await wallet.fs.writeFile(pathNew, data[1], "binary");
    await wallet.fs.writeFile(pathNew + ".address.txt", primaryAddress);

    // replace old wallet files with new
    await wallet.fs.rename(pathNew + ".keys", path + ".keys");
    await wallet.fs.rename(pathNew, path);
    await wallet.fs.rename(pathNew + ".address.txt", path + ".address.txt");
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

  async setDaemonConnection(uriOrRpcConnection, isTrusted) {
    if (!uriOrRpcConnection) await this.invokeWorker("setDaemonConnection", [undefined, isTrusted]);else
    {
      let connection = !uriOrRpcConnection ? undefined : uriOrRpcConnection instanceof _MoneroRpcConnection.default ? uriOrRpcConnection : new _MoneroRpcConnection.default(uriOrRpcConnection);
      await this.invokeWorker("setDaemonConnection", [connection ? connection.getConfig() : undefined, isTrusted]);
    }
  }

  async isDaemonTrusted() {
    return this.invokeWorker("isDaemonTrusted");
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
    let wrappedListener = new WalletWorkerListener(listener, () => this._isClosed);
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
    if (listener && !this._isClosed) await this.removeListener(listener);

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
    return new _MoneroKeyImageExportResult.default(await this.invokeWorker("getKeyImages", [all]));
  }

  async importKeyImages(keyImages, offset = 0) {
    let keyImagesJson = [];
    for (let keyImage of keyImages) keyImagesJson.push(keyImage.toJson());
    return new _MoneroKeyImageImportResult.default(await this.invokeWorker("importKeyImages", [keyImagesJson, offset]));
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

  async getDefaultFeePriority() {
    return this.invokeWorker("getDefaultFeePriority");
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

  async importMultisigHex(multisigHexes, refreshAfterImport) {
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

  async isClosed() {
    return this._isClosed || super.isClosed();
  }

  async close(save) {
    this._isClosed = true;
    await this.invokeWorker("prepareClose");
    if (save) {
      await _LibraryUtils.default.queueTask(async () => {
        const snapshot = await this.invokeWorker("getCloseData");
        await MoneroWalletFull.writeWalletData(this, snapshot.data, snapshot.primaryAddress);
      });
    }
    await super.close(false);
    this.wrappedListeners.length = 0;
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





  constructor(listener, isClosed) {
    this.id = _GenUtils.default.getUUID();
    this.listener = listener;
    this.isClosed = isClosed;
  }

  getId() {
    return this.id;
  }

  getListener() {
    return this.listener;
  }

  onSyncProgress(height, startHeight, endHeight, percentDone, message) {
    if (this.isClosed()) return;
    this.listener.onSyncProgress(height, startHeight, endHeight, percentDone, message);
  }

  async onNewBlock(height) {
    if (this.isClosed()) return;
    await this.listener.onNewBlock(height);
  }

  async onBalancesChanged(newBalanceStr, newUnlockedBalanceStr) {
    if (this.isClosed()) return;
    await this.listener.onBalancesChanged(BigInt(newBalanceStr), BigInt(newUnlockedBalanceStr));
  }

  async onOutputReceived(blockJson) {
    if (this.isClosed()) return;
    let block = new _MoneroBlock.default(blockJson, _MoneroBlock.default.DeserializationType.TX_WALLET);
    await this.listener.onOutputReceived(block.getTxs()[0].getOutputs()[0]);
  }

  async onOutputSpent(blockJson) {
    if (this.isClosed()) return;
    let block = new _MoneroBlock.default(blockJson, _MoneroBlock.default.DeserializationType.TX_WALLET);
    await this.listener.onOutputSpent(block.getTxs()[0].getInputs()[0]);
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfcGF0aCIsIl9HZW5VdGlscyIsIl9MaWJyYXJ5VXRpbHMiLCJfVGFza0xvb3BlciIsIl9Nb25lcm9BY2NvdW50IiwiX01vbmVyb0FjY291bnRUYWciLCJfTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSIsIl9Nb25lcm9CbG9jayIsIl9Nb25lcm9DaGVja1R4IiwiX01vbmVyb0NoZWNrUmVzZXJ2ZSIsIl9Nb25lcm9EYWVtb25ScGMiLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MiLCJfTW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHQiLCJfTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQiLCJfTW9uZXJvTXVsdGlzaWdJbmZvIiwiX01vbmVyb011bHRpc2lnSW5pdFJlc3VsdCIsIl9Nb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQiLCJfTW9uZXJvTmV0d29ya1R5cGUiLCJfTW9uZXJvT3V0cHV0V2FsbGV0IiwiX01vbmVyb1JwY0Nvbm5lY3Rpb24iLCJfTW9uZXJvU3ViYWRkcmVzcyIsIl9Nb25lcm9TeW5jUmVzdWx0IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4U2V0IiwiX01vbmVyb1R4V2FsbGV0IiwiX01vbmVyb1dhbGxldCIsIl9Nb25lcm9XYWxsZXRDb25maWciLCJfTW9uZXJvV2FsbGV0S2V5cyIsIl9Nb25lcm9XYWxsZXRMaXN0ZW5lciIsIl9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIl9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0IiwiX2ZzIiwiTW9uZXJvV2FsbGV0RnVsbCIsIk1vbmVyb1dhbGxldEtleXMiLCJERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TIiwic3luY0NhbGxzIiwiU2V0IiwiY29uc3RydWN0b3IiLCJjcHBBZGRyZXNzIiwicGF0aCIsInBhc3N3b3JkIiwiZnMiLCJyZWplY3RVbmF1dGhvcml6ZWQiLCJyZWplY3RVbmF1dGhvcml6ZWRGbklkIiwid2FsbGV0UHJveHkiLCJsaXN0ZW5lcnMiLCJnZXRGcyIsInVuZGVmaW5lZCIsIl9pc0Nsb3NlZCIsIndhc21MaXN0ZW5lciIsIldhbGxldFdhc21MaXN0ZW5lciIsIndhc21MaXN0ZW5lckhhbmRsZSIsInJlamVjdFVuYXV0aG9yaXplZENvbmZpZ0lkIiwic3luY1BlcmlvZEluTXMiLCJMaWJyYXJ5VXRpbHMiLCJzZXRSZWplY3RVbmF1dGhvcml6ZWRGbiIsIndhbGxldEV4aXN0cyIsImFzc2VydCIsIk1vbmVyb0Vycm9yIiwiZXhpc3RzIiwibG9nIiwib3BlbldhbGxldCIsImNvbmZpZyIsIk1vbmVyb1dhbGxldENvbmZpZyIsImdldFByb3h5VG9Xb3JrZXIiLCJzZXRQcm94eVRvV29ya2VyIiwiZ2V0U2VlZCIsImdldFNlZWRPZmZzZXQiLCJnZXRQcmltYXJ5QWRkcmVzcyIsImdldFByaXZhdGVWaWV3S2V5IiwiZ2V0UHJpdmF0ZVNwZW5kS2V5IiwiZ2V0UmVzdG9yZUhlaWdodCIsImdldExhbmd1YWdlIiwiZ2V0U2F2ZUN1cnJlbnQiLCJzZXRGcyIsImdldENvbm5lY3Rpb25NYW5hZ2VyIiwiZ2V0U2VydmVyIiwic2V0U2VydmVyIiwiZ2V0Q29ubmVjdGlvbiIsImdldEtleXNEYXRhIiwiZ2V0UGF0aCIsInNldEtleXNEYXRhIiwicmVhZEZpbGUiLCJzZXRDYWNoZURhdGEiLCJ3YWxsZXQiLCJvcGVuV2FsbGV0RGF0YSIsImdldElzVHJ1c3RlZERhZW1vbiIsInNldERhZW1vbkNvbm5lY3Rpb24iLCJzZXRDb25uZWN0aW9uTWFuYWdlciIsImNyZWF0ZVdhbGxldCIsImdldE5ldHdvcmtUeXBlIiwiTW9uZXJvTmV0d29ya1R5cGUiLCJ2YWxpZGF0ZSIsInNldFBhdGgiLCJnZXRQYXNzd29yZCIsInNldFBhc3N3b3JkIiwiTW9uZXJvV2FsbGV0RnVsbFByb3h5IiwiY3JlYXRlV2FsbGV0RnJvbVNlZWQiLCJjcmVhdGVXYWxsZXRGcm9tS2V5cyIsImNyZWF0ZVdhbGxldFJhbmRvbSIsImRhZW1vbkNvbm5lY3Rpb24iLCJnZXRSZWplY3RVbmF1dGhvcml6ZWQiLCJzZXRSZXN0b3JlSGVpZ2h0Iiwic2V0U2VlZE9mZnNldCIsIm1vZHVsZSIsImxvYWRXYXNtTW9kdWxlIiwicXVldWVUYXNrIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJHZW5VdGlscyIsImdldFVVSUQiLCJjcmVhdGVfZnVsbF93YWxsZXQiLCJKU09OIiwic3RyaW5naWZ5IiwidG9Kc29uIiwic2F2ZSIsInNldFByaW1hcnlBZGRyZXNzIiwic2V0UHJpdmF0ZVZpZXdLZXkiLCJzZXRQcml2YXRlU3BlbmRLZXkiLCJzZXRMYW5ndWFnZSIsImdldFNlZWRMYW5ndWFnZXMiLCJwYXJzZSIsImdldF9rZXlzX3dhbGxldF9zZWVkX2xhbmd1YWdlcyIsImxhbmd1YWdlcyIsIkZTIiwicHJvbWlzZXMiLCJnZXREYWVtb25NYXhQZWVySGVpZ2h0IiwiZ2V0V2FsbGV0UHJveHkiLCJhc3NlcnROb3RDbG9zZWQiLCJnZXRfZGFlbW9uX21heF9wZWVyX2hlaWdodCIsInJlc3AiLCJpc0RhZW1vblN5bmNlZCIsImlzX2RhZW1vbl9zeW5jZWQiLCJpc1N5bmNlZCIsImlzX3N5bmNlZCIsImdldF9uZXR3b3JrX3R5cGUiLCJnZXRfcmVzdG9yZV9oZWlnaHQiLCJyZXN0b3JlSGVpZ2h0Iiwic2V0X3Jlc3RvcmVfaGVpZ2h0IiwibW92ZVRvIiwiYWRkTGlzdGVuZXIiLCJsaXN0ZW5lciIsInJlZnJlc2hMaXN0ZW5pbmciLCJyZW1vdmVMaXN0ZW5lciIsImdldExpc3RlbmVycyIsImNvbm5lY3Rpb25NYW5hZ2VyIiwidXJpT3JDb25uZWN0aW9uIiwiaXNUcnVzdGVkIiwiY29ubmVjdGlvbiIsIk1vbmVyb1JwY0Nvbm5lY3Rpb24iLCJ1cmkiLCJnZXRVcmkiLCJ1c2VybmFtZSIsImdldFVzZXJuYW1lIiwicHJveHlVcmkiLCJnZXRQcm94eVVyaSIsImlzVHJ1c3RlZEFyZyIsInNldF9kYWVtb25fY29ubmVjdGlvbiIsImlzRGFlbW9uVHJ1c3RlZCIsImlzX2RhZW1vbl90cnVzdGVkIiwiZ2V0RGFlbW9uQ29ubmVjdGlvbiIsImNvbm5lY3Rpb25Db250YWluZXJTdHIiLCJnZXRfZGFlbW9uX2Nvbm5lY3Rpb24iLCJqc29uQ29ubmVjdGlvbiIsImlzQ29ubmVjdGVkVG9EYWVtb24iLCJpc19jb25uZWN0ZWRfdG9fZGFlbW9uIiwiZ2V0VmVyc2lvbiIsImdldEludGVncmF0ZWRBZGRyZXNzIiwic3RhbmRhcmRBZGRyZXNzIiwicGF5bWVudElkIiwicmVzdWx0IiwiZ2V0X2ludGVncmF0ZWRfYWRkcmVzcyIsImNoYXJBdCIsIk1vbmVyb0ludGVncmF0ZWRBZGRyZXNzIiwiZXJyIiwibWVzc2FnZSIsImluY2x1ZGVzIiwiZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MiLCJpbnRlZ3JhdGVkQWRkcmVzcyIsImRlY29kZV9pbnRlZ3JhdGVkX2FkZHJlc3MiLCJnZXRIZWlnaHQiLCJnZXRfaGVpZ2h0IiwiZ2V0RGFlbW9uSGVpZ2h0IiwiZ2V0X2RhZW1vbl9oZWlnaHQiLCJnZXRIZWlnaHRCeURhdGUiLCJ5ZWFyIiwibW9udGgiLCJkYXkiLCJnZXRfaGVpZ2h0X2J5X2RhdGUiLCJzeW5jIiwibGlzdGVuZXJPclN0YXJ0SGVpZ2h0Iiwic3RhcnRIZWlnaHQiLCJhbGxvd0NvbmN1cnJlbnRDYWxscyIsIk1vbmVyb1dhbGxldExpc3RlbmVyIiwiTWF0aCIsIm1heCIsInRoYXQiLCJzeW5jV2FzbSIsInJlc29sdmVDYWxsIiwicmVqZWN0Q2FsbCIsImNhbGwiLCJhZGQiLCJyZXNwSnNvbiIsIk1vbmVyb1N5bmNSZXN1bHQiLCJudW1CbG9ja3NGZXRjaGVkIiwicmVjZWl2ZWRNb25leSIsImZpbmFsbHkiLCJkZWxldGUiLCJlIiwic3RhcnRTeW5jaW5nIiwic3luY0xvb3BlciIsIlRhc2tMb29wZXIiLCJiYWNrZ3JvdW5kU3luYyIsInN0YXJ0Iiwic3RvcFN5bmNpbmciLCJzdG9wIiwic3RvcF9zeW5jaW5nIiwic2NhblR4cyIsInR4SGFzaGVzIiwic2Nhbl90eHMiLCJyZXNjYW5TcGVudCIsInJlc2Nhbl9zcGVudCIsInJlc2NhbkJsb2NrY2hhaW4iLCJyZXNjYW5fYmxvY2tjaGFpbiIsImdldEJhbGFuY2UiLCJhY2NvdW50SWR4Iiwic3ViYWRkcmVzc0lkeCIsImJhbGFuY2VTdHIiLCJnZXRfYmFsYW5jZV93YWxsZXQiLCJnZXRfYmFsYW5jZV9hY2NvdW50IiwiZ2V0X2JhbGFuY2Vfc3ViYWRkcmVzcyIsIkJpZ0ludCIsInN0cmluZ2lmeUJpZ0ludHMiLCJiYWxhbmNlIiwiZ2V0VW5sb2NrZWRCYWxhbmNlIiwidW5sb2NrZWRCYWxhbmNlU3RyIiwiZ2V0X3VubG9ja2VkX2JhbGFuY2Vfd2FsbGV0IiwiZ2V0X3VubG9ja2VkX2JhbGFuY2VfYWNjb3VudCIsImdldF91bmxvY2tlZF9iYWxhbmNlX3N1YmFkZHJlc3MiLCJ1bmxvY2tlZEJhbGFuY2UiLCJnZXRBY2NvdW50cyIsImluY2x1ZGVTdWJhZGRyZXNzZXMiLCJ0YWciLCJhY2NvdW50c1N0ciIsImdldF9hY2NvdW50cyIsImFjY291bnRzIiwiYWNjb3VudEpzb24iLCJwdXNoIiwic2FuaXRpemVBY2NvdW50IiwiTW9uZXJvQWNjb3VudCIsImdldEFjY291bnQiLCJhY2NvdW50U3RyIiwiZ2V0X2FjY291bnQiLCJjcmVhdGVBY2NvdW50IiwibGFiZWwiLCJjcmVhdGVfYWNjb3VudCIsImdldFN1YmFkZHJlc3NlcyIsInN1YmFkZHJlc3NJbmRpY2VzIiwiYXJncyIsImxpc3RpZnkiLCJzdWJhZGRyZXNzZXNKc29uIiwiZ2V0X3N1YmFkZHJlc3NlcyIsInN1YmFkZHJlc3NlcyIsInN1YmFkZHJlc3NKc29uIiwic2FuaXRpemVTdWJhZGRyZXNzIiwiTW9uZXJvU3ViYWRkcmVzcyIsImNyZWF0ZVN1YmFkZHJlc3MiLCJzdWJhZGRyZXNzU3RyIiwiY3JlYXRlX3N1YmFkZHJlc3MiLCJzZXRTdWJhZGRyZXNzTGFiZWwiLCJzZXRfc3ViYWRkcmVzc19sYWJlbCIsImdldFR4cyIsInF1ZXJ5IiwicXVlcnlOb3JtYWxpemVkIiwiTW9uZXJvV2FsbGV0Iiwibm9ybWFsaXplVHhRdWVyeSIsImdldF90eHMiLCJnZXRCbG9jayIsImJsb2Nrc0pzb25TdHIiLCJkZXNlcmlhbGl6ZVR4cyIsImdldFRyYW5zZmVycyIsIm5vcm1hbGl6ZVRyYW5zZmVyUXVlcnkiLCJnZXRfdHJhbnNmZXJzIiwiZ2V0VHhRdWVyeSIsImRlc2VyaWFsaXplVHJhbnNmZXJzIiwiZ2V0T3V0cHV0cyIsIm5vcm1hbGl6ZU91dHB1dFF1ZXJ5IiwiZ2V0X291dHB1dHMiLCJkZXNlcmlhbGl6ZU91dHB1dHMiLCJleHBvcnRPdXRwdXRzIiwiYWxsIiwiZXhwb3J0X291dHB1dHMiLCJvdXRwdXRzSGV4IiwiaW1wb3J0T3V0cHV0cyIsImltcG9ydF9vdXRwdXRzIiwibnVtSW1wb3J0ZWQiLCJleHBvcnRLZXlJbWFnZXMiLCJleHBvcnRfa2V5X2ltYWdlcyIsInJlc3VsdFN0ciIsInJlc3VsdEpzb24iLCJrZXlJbWFnZXMiLCJNb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdCIsImltcG9ydEtleUltYWdlcyIsIm9mZnNldCIsImltcG9ydF9rZXlfaW1hZ2VzIiwibWFwIiwia2V5SW1hZ2UiLCJrZXlJbWFnZUltcG9ydFJlc3VsdFN0ciIsIk1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0IiwiZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQiLCJmcmVlemVPdXRwdXQiLCJmcmVlemVfb3V0cHV0IiwidGhhd091dHB1dCIsInRoYXdfb3V0cHV0IiwiaXNPdXRwdXRGcm96ZW4iLCJpc19vdXRwdXRfZnJvemVuIiwiZ2V0RGVmYXVsdEZlZVByaW9yaXR5IiwiZ2V0X2RlZmF1bHRfZmVlX3ByaW9yaXR5IiwiY3JlYXRlVHhzIiwiY29uZmlnTm9ybWFsaXplZCIsIm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyIsImdldENhblNwbGl0Iiwic2V0Q2FuU3BsaXQiLCJjcmVhdGVfdHhzIiwidHhTZXRKc29uU3RyIiwiTW9uZXJvVHhTZXQiLCJzd2VlcE91dHB1dCIsIm5vcm1hbGl6ZVN3ZWVwT3V0cHV0Q29uZmlnIiwic3dlZXBfb3V0cHV0Iiwic3dlZXBVbmxvY2tlZCIsIm5vcm1hbGl6ZVN3ZWVwVW5sb2NrZWRDb25maWciLCJzd2VlcF91bmxvY2tlZCIsInR4U2V0c0pzb24iLCJ0eFNldHMiLCJ0eFNldEpzb24iLCJ0eHMiLCJ0eFNldCIsInR4Iiwic3dlZXBEdXN0IiwicmVsYXkiLCJzd2VlcF9kdXN0Iiwic2V0VHhzIiwicmVsYXlUeHMiLCJ0eHNPck1ldGFkYXRhcyIsIkFycmF5IiwiaXNBcnJheSIsInR4TWV0YWRhdGFzIiwidHhPck1ldGFkYXRhIiwiTW9uZXJvVHhXYWxsZXQiLCJnZXRNZXRhZGF0YSIsInJlbGF5X3R4cyIsInR4SGFzaGVzSnNvbiIsImRlc2NyaWJlVHhTZXQiLCJ1bnNpZ25lZFR4SGV4IiwiZ2V0VW5zaWduZWRUeEhleCIsInNpZ25lZFR4SGV4IiwiZ2V0U2lnbmVkVHhIZXgiLCJtdWx0aXNpZ1R4SGV4IiwiZ2V0TXVsdGlzaWdUeEhleCIsImRlc2NyaWJlX3R4X3NldCIsImdldF9leGNlcHRpb25fbWVzc2FnZSIsInNpZ25UeHMiLCJzaWduX3R4cyIsInN1Ym1pdFR4cyIsInN1Ym1pdF90eHMiLCJzaWduTWVzc2FnZSIsInNpZ25hdHVyZVR5cGUiLCJNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIlNJR05fV0lUSF9TUEVORF9LRVkiLCJzaWduX21lc3NhZ2UiLCJ2ZXJpZnlNZXNzYWdlIiwiYWRkcmVzcyIsInNpZ25hdHVyZSIsInZlcmlmeV9tZXNzYWdlIiwiaXNHb29kIiwiTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCIsImlzT2xkIiwiU0lHTl9XSVRIX1ZJRVdfS0VZIiwidmVyc2lvbiIsImdldFR4S2V5IiwidHhIYXNoIiwiZ2V0X3R4X2tleSIsImNoZWNrVHhLZXkiLCJ0eEtleSIsImNoZWNrX3R4X2tleSIsInJlc3BKc29uU3RyIiwiTW9uZXJvQ2hlY2tUeCIsImdldFR4UHJvb2YiLCJnZXRfdHhfcHJvb2YiLCJlcnJvcktleSIsImluZGV4T2YiLCJzdWJzdHJpbmciLCJsZW5ndGgiLCJjaGVja1R4UHJvb2YiLCJjaGVja190eF9wcm9vZiIsImdldFNwZW5kUHJvb2YiLCJnZXRfc3BlbmRfcHJvb2YiLCJjaGVja1NwZW5kUHJvb2YiLCJjaGVja19zcGVuZF9wcm9vZiIsImdldFJlc2VydmVQcm9vZldhbGxldCIsImdldF9yZXNlcnZlX3Byb29mX3dhbGxldCIsImdldFJlc2VydmVQcm9vZkFjY291bnQiLCJhbW91bnQiLCJnZXRfcmVzZXJ2ZV9wcm9vZl9hY2NvdW50IiwidG9TdHJpbmciLCJjaGVja1Jlc2VydmVQcm9vZiIsImNoZWNrX3Jlc2VydmVfcHJvb2YiLCJNb25lcm9DaGVja1Jlc2VydmUiLCJnZXRUeE5vdGVzIiwiZ2V0X3R4X25vdGVzIiwidHhOb3RlcyIsInNldFR4Tm90ZXMiLCJub3RlcyIsIm5vdGUiLCJpc0luaXRpYWxpemVkIiwic2V0X3R4X25vdGVzIiwiZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzIiwiZW50cnlJbmRpY2VzIiwiZW50cmllcyIsImVudHJ5SnNvbiIsImdldF9hZGRyZXNzX2Jvb2tfZW50cmllcyIsIk1vbmVyb0FkZHJlc3NCb29rRW50cnkiLCJhZGRBZGRyZXNzQm9va0VudHJ5IiwiZGVzY3JpcHRpb24iLCJhZGRfYWRkcmVzc19ib29rX2VudHJ5IiwiZWRpdEFkZHJlc3NCb29rRW50cnkiLCJpbmRleCIsInNldEFkZHJlc3MiLCJzZXREZXNjcmlwdGlvbiIsImVkaXRfYWRkcmVzc19ib29rX2VudHJ5IiwiZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeSIsImVudHJ5SWR4IiwiZGVsZXRlX2FkZHJlc3NfYm9va19lbnRyeSIsInRhZ0FjY291bnRzIiwiYWNjb3VudEluZGljZXMiLCJ0YWdfYWNjb3VudHMiLCJ1bnRhZ0FjY291bnRzIiwiZ2V0QWNjb3VudFRhZ3MiLCJhY2NvdW50VGFncyIsImFjY291bnRUYWdKc29uIiwiZ2V0X2FjY291bnRfdGFncyIsIk1vbmVyb0FjY291bnRUYWciLCJzZXRBY2NvdW50VGFnTGFiZWwiLCJzZXRfYWNjb3VudF90YWdfbGFiZWwiLCJnZXRQYXltZW50VXJpIiwiZ2V0X3BheW1lbnRfdXJpIiwicGFyc2VQYXltZW50VXJpIiwiTW9uZXJvVHhDb25maWciLCJwYXJzZV9wYXltZW50X3VyaSIsImdldEF0dHJpYnV0ZSIsImtleSIsInZhbHVlIiwiZ2V0X2F0dHJpYnV0ZSIsInNldEF0dHJpYnV0ZSIsInZhbCIsInNldF9hdHRyaWJ1dGUiLCJzdGFydE1pbmluZyIsIm51bVRocmVhZHMiLCJiYWNrZ3JvdW5kTWluaW5nIiwiaWdub3JlQmF0dGVyeSIsImRhZW1vbiIsIk1vbmVyb0RhZW1vblJwYyIsImNvbm5lY3RUb0RhZW1vblJwYyIsInN0b3BNaW5pbmciLCJpc011bHRpc2lnSW1wb3J0TmVlZGVkIiwiaXNfbXVsdGlzaWdfaW1wb3J0X25lZWRlZCIsImlzTXVsdGlzaWciLCJpc19tdWx0aXNpZyIsImdldE11bHRpc2lnSW5mbyIsIk1vbmVyb011bHRpc2lnSW5mbyIsImdldF9tdWx0aXNpZ19pbmZvIiwicHJlcGFyZU11bHRpc2lnIiwicHJlcGFyZV9tdWx0aXNpZyIsIm1ha2VNdWx0aXNpZyIsIm11bHRpc2lnSGV4ZXMiLCJ0aHJlc2hvbGQiLCJtYWtlX211bHRpc2lnIiwiZXhjaGFuZ2VNdWx0aXNpZ0tleXMiLCJleGNoYW5nZV9tdWx0aXNpZ19rZXlzIiwiTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IiwiZXhwb3J0TXVsdGlzaWdIZXgiLCJleHBvcnRfbXVsdGlzaWdfaGV4IiwiaW1wb3J0TXVsdGlzaWdIZXgiLCJyZWZyZXNoQWZ0ZXJJbXBvcnQiLCJpbXBvcnRfbXVsdGlzaWdfaGV4Iiwic2lnbk11bHRpc2lnVHhIZXgiLCJzaWduX211bHRpc2lnX3R4X2hleCIsIk1vbmVyb011bHRpc2lnU2lnblJlc3VsdCIsInN1Ym1pdE11bHRpc2lnVHhIZXgiLCJzaWduZWRNdWx0aXNpZ1R4SGV4Iiwic3VibWl0X211bHRpc2lnX3R4X2hleCIsImdldERhdGEiLCJnZXREYXRhV2FzbSIsInZpZXdPbmx5IiwiaXNfdmlld19vbmx5Iiwidmlld3MiLCJjYWNoZUJ1ZmZlckxvYyIsImdldF9jYWNoZV9maWxlX2J1ZmZlciIsInZpZXciLCJEYXRhVmlldyIsIkFycmF5QnVmZmVyIiwiaSIsInNldEludDgiLCJIRUFQVTgiLCJwb2ludGVyIiwiVWludDhBcnJheSIsIkJZVEVTX1BFUl9FTEVNRU5UIiwiX2ZyZWUiLCJCdWZmZXIiLCJmcm9tIiwiYnVmZmVyIiwia2V5c0J1ZmZlckxvYyIsImdldF9rZXlzX2ZpbGVfYnVmZmVyIiwidW5zaGlmdCIsImNoYW5nZVBhc3N3b3JkIiwib2xkUGFzc3dvcmQiLCJuZXdQYXNzd29yZCIsImNoYW5nZV93YWxsZXRfcGFzc3dvcmQiLCJlcnJNc2ciLCJjbG9zZUludGVybmFsIiwicHJlcGFyZUNsb3NlIiwic25hcHNob3QiLCJnZXRDbG9zZURhdGEiLCJ3cml0ZVdhbGxldERhdGEiLCJkYXRhIiwicHJpbWFyeUFkZHJlc3MiLCJfcmVxdWVzdF93YWxsZXRfc2h1dGRvd24iLCJjb25uZWN0aW9uTWFuYWdlckxpc3RlbmVyIiwiY2F0Y2giLCJnZXRfYWRkcmVzcyIsImdldE51bUJsb2Nrc1RvVW5sb2NrIiwiZ2V0VHgiLCJnZXRJbmNvbWluZ1RyYW5zZmVycyIsImdldE91dGdvaW5nVHJhbnNmZXJzIiwiY3JlYXRlVHgiLCJyZWxheVR4IiwiZ2V0VHhOb3RlIiwic2V0VHhOb3RlIiwicHJveHlUb1dvcmtlciIsIm5ldHdvcmtUeXBlIiwiZGFlbW9uVXJpIiwiZGFlbW9uVXNlcm5hbWUiLCJkYWVtb25QYXNzd29yZCIsIm9wZW5fd2FsbGV0X2Z1bGwiLCJrZXlzRGF0YSIsImNhY2hlRGF0YSIsImdldFJlZ3Rlc3QiLCJicm93c2VyTWFpblBhdGgiLCJjb25zb2xlIiwiZXJyb3IiLCJpc0VuYWJsZWQiLCJzZXRfbGlzdGVuZXIiLCJuZXdMaXN0ZW5lckhhbmRsZSIsImhlaWdodCIsImVuZEhlaWdodCIsInBlcmNlbnREb25lIiwib25TeW5jUHJvZ3Jlc3MiLCJvbk5ld0Jsb2NrIiwibmV3QmFsYW5jZVN0ciIsIm5ld1VubG9ja2VkQmFsYW5jZVN0ciIsIm9uQmFsYW5jZXNDaGFuZ2VkIiwiYW1vdW50U3RyIiwidW5sb2NrVGltZSIsImlzTG9ja2VkIiwib25PdXRwdXRSZWNlaXZlZCIsImFjY291bnRJZHhTdHIiLCJzdWJhZGRyZXNzSWR4U3RyIiwib25PdXRwdXRTcGVudCIsInNhbml0aXplQmxvY2siLCJibG9jayIsInNhbml0aXplVHhXYWxsZXQiLCJhY2NvdW50Iiwic3ViYWRkcmVzcyIsImRlc2VyaWFsaXplQmxvY2tzIiwiYmxvY2tzSnNvbiIsImRlc2VyaWFsaXplZEJsb2NrcyIsImJsb2NrcyIsImJsb2NrSnNvbiIsIk1vbmVyb0Jsb2NrIiwiRGVzZXJpYWxpemF0aW9uVHlwZSIsIlRYX1dBTExFVCIsInNldEJsb2NrIiwiZ2V0SGFzaGVzIiwidHhNYXAiLCJNYXAiLCJnZXRIYXNoIiwidHhzU29ydGVkIiwidHJhbnNmZXJzIiwiZ2V0T3V0Z29pbmdUcmFuc2ZlciIsInRyYW5zZmVyIiwib3V0cHV0cyIsIm91dHB1dCIsInNldEJyb3dzZXJNYWluUGF0aCIsIlBhdGgiLCJub3JtYWxpemUiLCJpc0Nsb3NlZCIsIndhbGxldERpciIsImRpcm5hbWUiLCJta2RpciIsIndyaXRlRmlsZSIsIm9sZFBhdGgiLCJ1bmxpbmsiLCJwYXRoTmV3IiwicmVuYW1lIiwiZXhwb3J0cyIsImRlZmF1bHQiLCJNb25lcm9XYWxsZXRLZXlzUHJveHkiLCJ3YWxsZXRJZCIsImludm9rZVdvcmtlciIsImdldFdvcmtlciIsIndvcmtlciIsIndyYXBwZWRMaXN0ZW5lcnMiLCJhcmd1bWVudHMiLCJ1cmlPclJwY0Nvbm5lY3Rpb24iLCJnZXRDb25maWciLCJycGNDb25maWciLCJ3cmFwcGVkTGlzdGVuZXIiLCJXYWxsZXRXb3JrZXJMaXN0ZW5lciIsImxpc3RlbmVySWQiLCJnZXRJZCIsImFkZFdvcmtlckNhbGxiYWNrIiwiZ2V0TGlzdGVuZXIiLCJyZW1vdmVXb3JrZXJDYWxsYmFjayIsInNwbGljZSIsImJsb2NrSnNvbnMiLCJrZXlJbWFnZXNKc29uIiwiY2xvc2UiLCJhbm5vdW5jZVN5bmNQcm9ncmVzcyIsImFubm91bmNlTmV3QmxvY2siLCJhbm5vdW5jZUJhbGFuY2VzQ2hhbmdlZCIsIk1vbmVyb091dHB1dFdhbGxldCIsInNldEFtb3VudCIsInNldEFjY291bnRJbmRleCIsInNldFN1YmFkZHJlc3NJbmRleCIsInNldEhhc2giLCJzZXRWZXJzaW9uIiwic2V0VW5sb2NrVGltZSIsInNldFR4Iiwic2V0T3V0cHV0cyIsInNldElzSW5jb21pbmciLCJzZXRJc0xvY2tlZCIsInNldEhlaWdodCIsInNldElzQ29uZmlybWVkIiwic2V0SW5UeFBvb2wiLCJzZXRJc0ZhaWxlZCIsImFubm91bmNlT3V0cHV0UmVjZWl2ZWQiLCJwYXJzZUludCIsInNldElucHV0cyIsImFubm91bmNlT3V0cHV0U3BlbnQiLCJpZCIsImdldElucHV0cyJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL3dhbGxldC9Nb25lcm9XYWxsZXRGdWxsLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IFBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCBHZW5VdGlscyBmcm9tIFwiLi4vY29tbW9uL0dlblV0aWxzXCI7XG5pbXBvcnQgTGlicmFyeVV0aWxzIGZyb20gXCIuLi9jb21tb24vTGlicmFyeVV0aWxzXCI7XG5pbXBvcnQgVGFza0xvb3BlciBmcm9tIFwiLi4vY29tbW9uL1Rhc2tMb29wZXJcIjtcbmltcG9ydCBNb25lcm9BY2NvdW50IGZyb20gXCIuL21vZGVsL01vbmVyb0FjY291bnRcIjtcbmltcG9ydCBNb25lcm9BY2NvdW50VGFnIGZyb20gXCIuL21vZGVsL01vbmVyb0FjY291bnRUYWdcIjtcbmltcG9ydCBNb25lcm9BZGRyZXNzQm9va0VudHJ5IGZyb20gXCIuL21vZGVsL01vbmVyb0FkZHJlc3NCb29rRW50cnlcIjtcbmltcG9ydCBNb25lcm9CbG9jayBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0Jsb2NrXCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2tUeCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9DaGVja1R4XCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2tSZXNlcnZlIGZyb20gXCIuL21vZGVsL01vbmVyb0NoZWNrUmVzZXJ2ZVwiO1xuaW1wb3J0IE1vbmVyb0RhZW1vblJwYyBmcm9tIFwiLi4vZGFlbW9uL01vbmVyb0RhZW1vblJwY1wiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuLi9jb21tb24vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBNb25lcm9JbmNvbWluZ1RyYW5zZmVyIGZyb20gXCIuL21vZGVsL01vbmVyb0luY29taW5nVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvS2V5SW1hZ2VcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdJbmZvIGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnSW5mb1wiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ0luaXRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTmV0d29ya1R5cGUgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9OZXR3b3JrVHlwZVwiO1xuaW1wb3J0IE1vbmVyb091dHB1dFF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb091dHB1dFF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0V2FsbGV0IGZyb20gXCIuL21vZGVsL01vbmVyb091dHB1dFdhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1JwY0Nvbm5lY3Rpb24gZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9ScGNDb25uZWN0aW9uXCI7XG5pbXBvcnQgTW9uZXJvU3ViYWRkcmVzcyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9TdWJhZGRyZXNzXCI7XG5pbXBvcnQgTW9uZXJvU3luY1Jlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9TeW5jUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9UcmFuc2ZlclF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb1RyYW5zZmVyUXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeENvbmZpZyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeENvbmZpZ1wiO1xuaW1wb3J0IE1vbmVyb1R4UHJpb3JpdHkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhQcmlvcml0eVwiO1xuaW1wb3J0IE1vbmVyb1R4UXVlcnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb1R4U2V0IGZyb20gXCIuL21vZGVsL01vbmVyb1R4U2V0XCI7XG5pbXBvcnQgTW9uZXJvVHggZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9UeFwiO1xuaW1wb3J0IE1vbmVyb1R4V2FsbGV0IGZyb20gXCIuL21vZGVsL01vbmVyb1R4V2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0IGZyb20gXCIuL01vbmVyb1dhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1dhbGxldENvbmZpZyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9XYWxsZXRDb25maWdcIjtcbmltcG9ydCB7IE1vbmVyb1dhbGxldEtleXMsIE1vbmVyb1dhbGxldEtleXNQcm94eSB9IGZyb20gXCIuL01vbmVyb1dhbGxldEtleXNcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRMaXN0ZW5lciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9XYWxsZXRMaXN0ZW5lclwiO1xuaW1wb3J0IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIGZyb20gXCIuL21vZGVsL01vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlXCI7XG5pbXBvcnQgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvVmVyc2lvbiBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb1ZlcnNpb25cIjtcbmltcG9ydCBmcyBmcm9tIFwiZnNcIjtcbmltcG9ydCBNb25lcm9Db25uZWN0aW9uTWFuYWdlciBmcm9tIFwiLi4vY29tbW9uL01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyXCI7XG5cbi8qKlxuICogSW1wbGVtZW50cyBhIE1vbmVybyB3YWxsZXQgdXNpbmcgY2xpZW50LXNpZGUgV2ViQXNzZW1ibHkgYmluZGluZ3MgdG8gbW9uZXJvLXByb2plY3QncyB3YWxsZXQyIGluIEMrKy5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTW9uZXJvV2FsbGV0RnVsbCBleHRlbmRzIE1vbmVyb1dhbGxldEtleXMge1xuXG4gIC8vIHN0YXRpYyB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIHN0YXRpYyByZWFkb25seSBERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TID0gMjAwMDA7XG4gIHByb3RlY3RlZCBzdGF0aWMgRlM7XG5cbiAgLy8gaW5zdGFuY2UgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBwYXRoOiBzdHJpbmc7XG4gIHByb3RlY3RlZCBwYXNzd29yZDogc3RyaW5nO1xuICBwcm90ZWN0ZWQgbGlzdGVuZXJzOiBNb25lcm9XYWxsZXRMaXN0ZW5lcltdO1xuICBwcm90ZWN0ZWQgZnM6IGFueTtcbiAgcHJvdGVjdGVkIHdhc21MaXN0ZW5lcjogV2FsbGV0V2FzbUxpc3RlbmVyO1xuICBwcm90ZWN0ZWQgd2FzbUxpc3RlbmVySGFuZGxlOiBudW1iZXI7XG4gIHByb3RlY3RlZCByZWplY3RVbmF1dGhvcml6ZWQ6IGJvb2xlYW47XG4gIHByb3RlY3RlZCByZWplY3RVbmF1dGhvcml6ZWRDb25maWdJZDogc3RyaW5nO1xuICBwcm90ZWN0ZWQgc3luY1BlcmlvZEluTXM6IG51bWJlcjtcbiAgcHJvdGVjdGVkIHN5bmNMb29wZXI6IFRhc2tMb29wZXI7XG4gIHByb3RlY3RlZCBicm93c2VyTWFpblBhdGg6IHN0cmluZztcbiAgcHJvdGVjdGVkIHN5bmNDYWxscyA9IG5ldyBTZXQ8UHJvbWlzZTxhbnk+PigpO1xuXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBjb25zdHJ1Y3RvciB3aGljaCBpcyBnaXZlbiB0aGUgbWVtb3J5IGFkZHJlc3Mgb2YgYSBDKysgd2FsbGV0IGluc3RhbmNlLlxuICAgKiBcbiAgICogVGhpcyBjb25zdHJ1Y3RvciBzaG91bGQgYmUgY2FsbGVkIHRocm91Z2ggc3RhdGljIHdhbGxldCBjcmVhdGlvbiB1dGlsaXRpZXMgaW4gdGhpcyBjbGFzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBjcHBBZGRyZXNzIC0gYWRkcmVzcyBvZiB0aGUgd2FsbGV0IGluc3RhbmNlIGluIEMrK1xuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIHBhdGggb2YgdGhlIHdhbGxldCBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGFzc3dvcmQgLSBwYXNzd29yZCBvZiB0aGUgd2FsbGV0IGluc3RhbmNlXG4gICAqIEBwYXJhbSB7RmlsZVN5c3RlbX0gZnMgLSBub2RlLmpzLWNvbXBhdGlibGUgZmlsZSBzeXN0ZW0gdG8gcmVhZC93cml0ZSB3YWxsZXQgZmlsZXNcbiAgICogQHBhcmFtIHtib29sZWFufSByZWplY3RVbmF1dGhvcml6ZWQgLSBzcGVjaWZpZXMgaWYgdW5hdXRob3JpemVkIHJlcXVlc3RzIChlLmcuIHNlbGYtc2lnbmVkIGNlcnRpZmljYXRlcykgc2hvdWxkIGJlIHJlamVjdGVkXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByZWplY3RVbmF1dGhvcml6ZWRGbklkIC0gdW5pcXVlIGlkZW50aWZpZXIgZm9yIGh0dHBfY2xpZW50X3dhc20gdG8gcXVlcnkgcmVqZWN0VW5hdXRob3JpemVkXG4gICAqIEBwYXJhbSB7TW9uZXJvV2FsbGV0RnVsbFByb3h5fSB3YWxsZXRQcm94eSAtIHByb3h5IHRvIGludm9rZSB3YWxsZXQgb3BlcmF0aW9ucyBpbiBhIHdlYiB3b3JrZXJcbiAgICogXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBjb25zdHJ1Y3RvcihjcHBBZGRyZXNzLCBwYXRoLCBwYXNzd29yZCwgZnMsIHJlamVjdFVuYXV0aG9yaXplZCwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCwgd2FsbGV0UHJveHk/OiBNb25lcm9XYWxsZXRGdWxsUHJveHkpIHtcbiAgICBzdXBlcihjcHBBZGRyZXNzLCB3YWxsZXRQcm94eSk7XG4gICAgaWYgKHdhbGxldFByb3h5KSByZXR1cm47XG4gICAgdGhpcy5wYXRoID0gcGF0aDtcbiAgICB0aGlzLnBhc3N3b3JkID0gcGFzc3dvcmQ7XG4gICAgdGhpcy5saXN0ZW5lcnMgPSBbXTtcbiAgICB0aGlzLmZzID0gZnMgPyBmcyA6IChwYXRoID8gTW9uZXJvV2FsbGV0RnVsbC5nZXRGcygpIDogdW5kZWZpbmVkKTtcbiAgICB0aGlzLl9pc0Nsb3NlZCA9IGZhbHNlO1xuICAgIHRoaXMud2FzbUxpc3RlbmVyID0gbmV3IFdhbGxldFdhc21MaXN0ZW5lcih0aGlzKTsgLy8gcmVjZWl2ZXMgbm90aWZpY2F0aW9ucyBmcm9tIHdhc20gYysrXG4gICAgdGhpcy53YXNtTGlzdGVuZXJIYW5kbGUgPSAwOyAgICAgICAgICAgICAgICAgICAgICAvLyBtZW1vcnkgYWRkcmVzcyBvZiB0aGUgd2FsbGV0IGxpc3RlbmVyIGluIGMrK1xuICAgIHRoaXMucmVqZWN0VW5hdXRob3JpemVkID0gcmVqZWN0VW5hdXRob3JpemVkO1xuICAgIHRoaXMucmVqZWN0VW5hdXRob3JpemVkQ29uZmlnSWQgPSByZWplY3RVbmF1dGhvcml6ZWRGbklkO1xuICAgIHRoaXMuc3luY1BlcmlvZEluTXMgPSBNb25lcm9XYWxsZXRGdWxsLkRFRkFVTFRfU1lOQ19QRVJJT0RfSU5fTVM7XG4gICAgTGlicmFyeVV0aWxzLnNldFJlamVjdFVuYXV0aG9yaXplZEZuKHJlamVjdFVuYXV0aG9yaXplZEZuSWQsICgpID0+IHRoaXMucmVqZWN0VW5hdXRob3JpemVkKTsgLy8gcmVnaXN0ZXIgZm4gaW5mb3JtaW5nIGlmIHVuYXV0aG9yaXplZCByZXFzIHNob3VsZCBiZSByZWplY3RlZFxuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFNUQVRJQyBVVElMSVRJRVMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIC8qKlxuICAgKiBDaGVjayBpZiBhIHdhbGxldCBleGlzdHMgYXQgYSBnaXZlbiBwYXRoLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggLSBwYXRoIG9mIHRoZSB3YWxsZXQgb24gdGhlIGZpbGUgc3lzdGVtXG4gICAqIEBwYXJhbSB7YW55fSBmcyAtIGZpbGUgc3lzdGVtIGNvbXBhdGlibGUgd2l0aCBOb2RlLmpzIGBmcy5wcm9taXNlc2AgQVBJIChkZWZhdWx0cyB0byBkaXNrIG9yIGluLW1lbW9yeSBGUyBpZiBicm93c2VyKVxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIGEgd2FsbGV0IGV4aXN0cyBhdCB0aGUgZ2l2ZW4gcGF0aCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgd2FsbGV0RXhpc3RzKHBhdGgsIGZzKSB7XG4gICAgYXNzZXJ0KHBhdGgsIFwiTXVzdCBwcm92aWRlIGEgcGF0aCB0byBsb29rIGZvciBhIHdhbGxldFwiKTtcbiAgICBpZiAoIWZzKSBmcyA9IE1vbmVyb1dhbGxldEZ1bGwuZ2V0RnMoKTtcbiAgICBpZiAoIWZzKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgZmlsZSBzeXN0ZW0gdG8gY2hlY2sgaWYgd2FsbGV0IGV4aXN0c1wiKTtcbiAgICBsZXQgZXhpc3RzID0gYXdhaXQgTGlicmFyeVV0aWxzLmV4aXN0cyhmcywgcGF0aCArIFwiLmtleXNcIik7XG4gICAgTGlicmFyeVV0aWxzLmxvZygxLCBcIldhbGxldCBleGlzdHMgYXQgXCIgKyBwYXRoICsgXCI6IFwiICsgZXhpc3RzKTtcbiAgICByZXR1cm4gZXhpc3RzO1xuICB9XG4gIFxuICBzdGF0aWMgYXN5bmMgb3BlbldhbGxldChjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPikge1xuXG4gICAgLy8gdmFsaWRhdGUgY29uZmlnXG4gICAgY29uZmlnID0gbmV3IE1vbmVyb1dhbGxldENvbmZpZyhjb25maWcpO1xuICAgIGlmIChjb25maWcuZ2V0UHJveHlUb1dvcmtlcigpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRQcm94eVRvV29ya2VyKHRydWUpO1xuICAgIGlmIChjb25maWcuZ2V0U2VlZCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHNlZWQgd2hlbiBvcGVuaW5nIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFNlZWRPZmZzZXQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3BlY2lmeSBzZWVkIG9mZnNldCB3aGVuIG9wZW5pbmcgd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0UHJpbWFyeUFkZHJlc3MoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3BlY2lmeSBwcmltYXJ5IGFkZHJlc3Mgd2hlbiBvcGVuaW5nIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFByaXZhdGVWaWV3S2V5KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgcHJpdmF0ZSB2aWV3IGtleSB3aGVuIG9wZW5pbmcgd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0UHJpdmF0ZVNwZW5kS2V5KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgcHJpdmF0ZSBzcGVuZCBrZXkgd2hlbiBvcGVuaW5nIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFJlc3RvcmVIZWlnaHQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3BlY2lmeSByZXN0b3JlIGhlaWdodCB3aGVuIG9wZW5pbmcgd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0TGFuZ3VhZ2UoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3BlY2lmeSBsYW5ndWFnZSB3aGVuIG9wZW5pbmcgd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0U2F2ZUN1cnJlbnQoKSA9PT0gdHJ1ZSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNhdmUgY3VycmVudCB3YWxsZXQgd2hlbiBvcGVuaW5nIGZ1bGwgd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0RnMoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0RnMoTW9uZXJvV2FsbGV0RnVsbC5nZXRGcygpKTtcblxuICAgIC8vIHNldCBzZXJ2ZXIgZnJvbSBjb25uZWN0aW9uIG1hbmFnZXIgaWYgcHJvdmlkZWRcbiAgICBpZiAoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpIHtcbiAgICAgIGlmIChjb25maWcuZ2V0U2VydmVyKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBjYW4gYmUgb3BlbmVkIHdpdGggYSBzZXJ2ZXIgb3IgY29ubmVjdGlvbiBtYW5hZ2VyIGJ1dCBub3QgYm90aFwiKTtcbiAgICAgIGNvbmZpZy5zZXRTZXJ2ZXIoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkuZ2V0Q29ubmVjdGlvbigpKTtcbiAgICB9XG5cbiAgICAvLyByZWFkIHdhbGxldCBkYXRhIGZyb20gZGlzayB1bmxlc3MgcHJvdmlkZWRcbiAgICBpZiAoIWNvbmZpZy5nZXRLZXlzRGF0YSgpKSB7XG4gICAgICBsZXQgZnMgPSBjb25maWcuZ2V0RnMoKTtcbiAgICAgIGlmICghZnMpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBmaWxlIHN5c3RlbSB0byByZWFkIHdhbGxldCBkYXRhIGZyb21cIik7XG4gICAgICBpZiAoIWF3YWl0IHRoaXMud2FsbGV0RXhpc3RzKGNvbmZpZy5nZXRQYXRoKCksIGZzKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGRvZXMgbm90IGV4aXN0IGF0IHBhdGg6IFwiICsgY29uZmlnLmdldFBhdGgoKSk7XG4gICAgICBjb25maWcuc2V0S2V5c0RhdGEoYXdhaXQgZnMucmVhZEZpbGUoY29uZmlnLmdldFBhdGgoKSArIFwiLmtleXNcIikpO1xuICAgICAgY29uZmlnLnNldENhY2hlRGF0YShhd2FpdCBMaWJyYXJ5VXRpbHMuZXhpc3RzKGZzLCBjb25maWcuZ2V0UGF0aCgpKSA/IGF3YWl0IGZzLnJlYWRGaWxlKGNvbmZpZy5nZXRQYXRoKCkpIDogXCJcIik7XG4gICAgfVxuXG4gICAgLy8gb3BlbiB3YWxsZXQgZnJvbSBkYXRhXG4gICAgY29uc3Qgd2FsbGV0ID0gYXdhaXQgTW9uZXJvV2FsbGV0RnVsbC5vcGVuV2FsbGV0RGF0YShjb25maWcpO1xuXG4gICAgLy8gYXBwbHkgZXhwbGljaXQgZGFlbW9uIHRydXN0XG4gICAgaWYgKGNvbmZpZy5nZXRJc1RydXN0ZWREYWVtb24oKSAhPT0gdW5kZWZpbmVkICYmIGNvbmZpZy5nZXRTZXJ2ZXIoKSkgYXdhaXQgd2FsbGV0LnNldERhZW1vbkNvbm5lY3Rpb24oY29uZmlnLmdldFNlcnZlcigpLCBjb25maWcuZ2V0SXNUcnVzdGVkRGFlbW9uKCkpO1xuXG4gICAgLy8gc2V0IGNvbm5lY3Rpb24gbWFuYWdlclxuICAgIGF3YWl0IHdhbGxldC5zZXRDb25uZWN0aW9uTWFuYWdlcihjb25maWcuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSk7XG4gICAgcmV0dXJuIHdhbGxldDtcbiAgfVxuICBcbiAgc3RhdGljIGFzeW5jIGNyZWF0ZVdhbGxldChjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZyk6IFByb21pc2U8TW9uZXJvV2FsbGV0RnVsbD4ge1xuXG4gICAgLy8gdmFsaWRhdGUgY29uZmlnXG4gICAgaWYgKGNvbmZpZyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgY29uZmlnIHRvIGNyZWF0ZSB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkKCkgIT09IHVuZGVmaW5lZCAmJiAoY29uZmlnLmdldFByaW1hcnlBZGRyZXNzKCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWcuZ2V0UHJpdmF0ZVZpZXdLZXkoKSAhPT0gdW5kZWZpbmVkIHx8IGNvbmZpZy5nZXRQcml2YXRlU3BlbmRLZXkoKSAhPT0gdW5kZWZpbmVkKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IG1heSBiZSBpbml0aWFsaXplZCB3aXRoIGEgc2VlZCBvciBrZXlzIGJ1dCBub3QgYm90aFwiKTtcbiAgICBpZiAoY29uZmlnLmdldE5ldHdvcmtUeXBlKCkgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGEgbmV0d29ya1R5cGU6ICdtYWlubmV0JywgJ3Rlc3RuZXQnIG9yICdzdGFnZW5ldCdcIik7XG4gICAgTW9uZXJvTmV0d29ya1R5cGUudmFsaWRhdGUoY29uZmlnLmdldE5ldHdvcmtUeXBlKCkpO1xuICAgIGlmIChjb25maWcuZ2V0U2F2ZUN1cnJlbnQoKSA9PT0gdHJ1ZSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNhdmUgY3VycmVudCB3YWxsZXQgd2hlbiBjcmVhdGluZyBmdWxsIFdBU00gd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0UGF0aCgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRQYXRoKFwiXCIpO1xuICAgIGlmIChjb25maWcuZ2V0UGF0aCgpICYmIGF3YWl0IE1vbmVyb1dhbGxldEZ1bGwud2FsbGV0RXhpc3RzKGNvbmZpZy5nZXRQYXRoKCksIGNvbmZpZy5nZXRGcygpKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGFscmVhZHkgZXhpc3RzOiBcIiArIGNvbmZpZy5nZXRQYXRoKCkpO1xuICAgIGlmIChjb25maWcuZ2V0UGFzc3dvcmQoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UGFzc3dvcmQoXCJcIik7XG5cbiAgICAvLyBzZXQgc2VydmVyIGZyb20gY29ubmVjdGlvbiBtYW5hZ2VyIGlmIHByb3ZpZGVkXG4gICAgaWYgKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpKSB7XG4gICAgICBpZiAoY29uZmlnLmdldFNlcnZlcigpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgY2FuIGJlIGNyZWF0ZWQgd2l0aCBhIHNlcnZlciBvciBjb25uZWN0aW9uIG1hbmFnZXIgYnV0IG5vdCBib3RoXCIpO1xuICAgICAgY29uZmlnLnNldFNlcnZlcihjb25maWcuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKS5nZXRDb25uZWN0aW9uKCkpO1xuICAgIH1cblxuICAgIC8vIGNyZWF0ZSBwcm94aWVkIG9yIGxvY2FsIHdhbGxldFxuICAgIGxldCB3YWxsZXQ7XG4gICAgaWYgKGNvbmZpZy5nZXRQcm94eVRvV29ya2VyKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFByb3h5VG9Xb3JrZXIodHJ1ZSk7XG4gICAgaWYgKGNvbmZpZy5nZXRQcm94eVRvV29ya2VyKCkpIHtcbiAgICAgIGxldCB3YWxsZXRQcm94eSA9IGF3YWl0IE1vbmVyb1dhbGxldEZ1bGxQcm94eS5jcmVhdGVXYWxsZXQoY29uZmlnKTtcbiAgICAgIHdhbGxldCA9IG5ldyBNb25lcm9XYWxsZXRGdWxsKHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHdhbGxldFByb3h5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGNvbmZpZy5nZXRTZWVkKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAoY29uZmlnLmdldExhbmd1YWdlKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgbGFuZ3VhZ2Ugd2hlbiBjcmVhdGluZyB3YWxsZXQgZnJvbSBzZWVkXCIpO1xuICAgICAgICB3YWxsZXQgPSBhd2FpdCBNb25lcm9XYWxsZXRGdWxsLmNyZWF0ZVdhbGxldEZyb21TZWVkKGNvbmZpZyk7XG4gICAgICB9IGVsc2UgaWYgKGNvbmZpZy5nZXRQcml2YXRlU3BlbmRLZXkoKSAhPT0gdW5kZWZpbmVkIHx8IGNvbmZpZy5nZXRQcmltYXJ5QWRkcmVzcygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgc2VlZE9mZnNldCB3aGVuIGNyZWF0aW5nIHdhbGxldCBmcm9tIGtleXNcIik7XG4gICAgICAgIHdhbGxldCA9IGF3YWl0IE1vbmVyb1dhbGxldEZ1bGwuY3JlYXRlV2FsbGV0RnJvbUtleXMoY29uZmlnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChjb25maWcuZ2V0U2VlZE9mZnNldCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHNlZWRPZmZzZXQgd2hlbiBjcmVhdGluZyByYW5kb20gd2FsbGV0XCIpO1xuICAgICAgICBpZiAoY29uZmlnLmdldFJlc3RvcmVIZWlnaHQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSByZXN0b3JlSGVpZ2h0IHdoZW4gY3JlYXRpbmcgcmFuZG9tIHdhbGxldFwiKTtcbiAgICAgICAgd2FsbGV0ID0gYXdhaXQgTW9uZXJvV2FsbGV0RnVsbC5jcmVhdGVXYWxsZXRSYW5kb20oY29uZmlnKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gc2V0IGNvbm5lY3Rpb24gbWFuYWdlclxuICAgIGF3YWl0IHdhbGxldC5zZXRDb25uZWN0aW9uTWFuYWdlcihjb25maWcuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSk7XG4gICAgcmV0dXJuIHdhbGxldDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBhc3luYyBjcmVhdGVXYWxsZXRGcm9tU2VlZChjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZyk6IFByb21pc2U8TW9uZXJvV2FsbGV0RnVsbD4ge1xuXG4gICAgLy8gdmFsaWRhdGUgYW5kIG5vcm1hbGl6ZSBwYXJhbXNcbiAgICBsZXQgZGFlbW9uQ29ubmVjdGlvbiA9IGNvbmZpZy5nZXRTZXJ2ZXIoKTtcbiAgICBsZXQgcmVqZWN0VW5hdXRob3JpemVkID0gZGFlbW9uQ29ubmVjdGlvbiA/IGRhZW1vbkNvbm5lY3Rpb24uZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkgOiB0cnVlO1xuICAgIGlmIChjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRSZXN0b3JlSGVpZ2h0KDApO1xuICAgIGlmIChjb25maWcuZ2V0U2VlZE9mZnNldCgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRTZWVkT2Zmc2V0KFwiXCIpO1xuICAgIFxuICAgIC8vIGxvYWQgZnVsbCB3YXNtIG1vZHVsZVxuICAgIGxldCBtb2R1bGUgPSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZFdhc21Nb2R1bGUoKTtcbiAgICBcbiAgICAvLyBjcmVhdGUgd2FsbGV0IGluIHF1ZXVlXG4gICAgbGV0IHdhbGxldCA9IGF3YWl0IG1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAvLyByZWdpc3RlciBmbiBpbmZvcm1pbmcgaWYgdW5hdXRob3JpemVkIHJlcXMgc2hvdWxkIGJlIHJlamVjdGVkXG4gICAgICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWRGbklkID0gR2VuVXRpbHMuZ2V0VVVJRCgpO1xuICAgICAgICBMaWJyYXJ5VXRpbHMuc2V0UmVqZWN0VW5hdXRob3JpemVkRm4ocmVqZWN0VW5hdXRob3JpemVkRm5JZCwgKCkgPT4gcmVqZWN0VW5hdXRob3JpemVkKTtcbiAgICAgICAgXG4gICAgICAgIC8vIGNyZWF0ZSB3YWxsZXQgaW4gd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICBtb2R1bGUuY3JlYXRlX2Z1bGxfd2FsbGV0KEpTT04uc3RyaW5naWZ5KGNvbmZpZy50b0pzb24oKSksIHJlamVjdFVuYXV0aG9yaXplZEZuSWQsIGFzeW5jIChjcHBBZGRyZXNzKSA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBjcHBBZGRyZXNzID09PSBcInN0cmluZ1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKGNwcEFkZHJlc3MpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb1dhbGxldEZ1bGwoY3BwQWRkcmVzcywgY29uZmlnLmdldFBhdGgoKSwgY29uZmlnLmdldFBhc3N3b3JkKCksIGNvbmZpZy5nZXRGcygpLCBjb25maWcuZ2V0U2VydmVyKCkgPyBjb25maWcuZ2V0U2VydmVyKCkuZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkgOiB1bmRlZmluZWQsIHJlamVjdFVuYXV0aG9yaXplZEZuSWQpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBcbiAgICAvLyBzYXZlIHdhbGxldFxuICAgIGlmIChjb25maWcuZ2V0UGF0aCgpKSBhd2FpdCB3YWxsZXQuc2F2ZSgpO1xuICAgIHJldHVybiB3YWxsZXQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgY3JlYXRlV2FsbGV0RnJvbUtleXMoY29uZmlnOiBNb25lcm9XYWxsZXRDb25maWcpOiBQcm9taXNlPE1vbmVyb1dhbGxldEZ1bGw+IHtcblxuICAgIC8vIHZhbGlkYXRlIGFuZCBub3JtYWxpemUgcGFyYW1zXG4gICAgTW9uZXJvTmV0d29ya1R5cGUudmFsaWRhdGUoY29uZmlnLmdldE5ldHdvcmtUeXBlKCkpO1xuICAgIGlmIChjb25maWcuZ2V0UHJpbWFyeUFkZHJlc3MoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UHJpbWFyeUFkZHJlc3MoXCJcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQcml2YXRlVmlld0tleSgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRQcml2YXRlVmlld0tleShcIlwiKTtcbiAgICBpZiAoY29uZmlnLmdldFByaXZhdGVTcGVuZEtleSgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRQcml2YXRlU3BlbmRLZXkoXCJcIik7XG4gICAgbGV0IGRhZW1vbkNvbm5lY3Rpb24gPSBjb25maWcuZ2V0U2VydmVyKCk7XG4gICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZCA9IGRhZW1vbkNvbm5lY3Rpb24gPyBkYWVtb25Db25uZWN0aW9uLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdHJ1ZTtcbiAgICBpZiAoY29uZmlnLmdldFJlc3RvcmVIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UmVzdG9yZUhlaWdodCgwKTtcbiAgICBpZiAoY29uZmlnLmdldExhbmd1YWdlKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldExhbmd1YWdlKFwiRW5nbGlzaFwiKTtcbiAgICBcbiAgICAvLyBsb2FkIGZ1bGwgd2FzbSBtb2R1bGVcbiAgICBsZXQgbW9kdWxlID0gYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRXYXNtTW9kdWxlKCk7XG4gICAgXG4gICAgLy8gY3JlYXRlIHdhbGxldCBpbiBxdWV1ZVxuICAgIGxldCB3YWxsZXQgPSBhd2FpdCBtb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyByZWdpc3RlciBmbiBpbmZvcm1pbmcgaWYgdW5hdXRob3JpemVkIHJlcXMgc2hvdWxkIGJlIHJlamVjdGVkXG4gICAgICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWRGbklkID0gR2VuVXRpbHMuZ2V0VVVJRCgpO1xuICAgICAgICBMaWJyYXJ5VXRpbHMuc2V0UmVqZWN0VW5hdXRob3JpemVkRm4ocmVqZWN0VW5hdXRob3JpemVkRm5JZCwgKCkgPT4gcmVqZWN0VW5hdXRob3JpemVkKTtcbiAgICAgICAgXG4gICAgICAgIC8vIGNyZWF0ZSB3YWxsZXQgaW4gd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICBtb2R1bGUuY3JlYXRlX2Z1bGxfd2FsbGV0KEpTT04uc3RyaW5naWZ5KGNvbmZpZy50b0pzb24oKSksIHJlamVjdFVuYXV0aG9yaXplZEZuSWQsIGFzeW5jIChjcHBBZGRyZXNzKSA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBjcHBBZGRyZXNzID09PSBcInN0cmluZ1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKGNwcEFkZHJlc3MpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb1dhbGxldEZ1bGwoY3BwQWRkcmVzcywgY29uZmlnLmdldFBhdGgoKSwgY29uZmlnLmdldFBhc3N3b3JkKCksIGNvbmZpZy5nZXRGcygpLCBjb25maWcuZ2V0U2VydmVyKCkgPyBjb25maWcuZ2V0U2VydmVyKCkuZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkgOiB1bmRlZmluZWQsIHJlamVjdFVuYXV0aG9yaXplZEZuSWQpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBcbiAgICAvLyBzYXZlIHdhbGxldFxuICAgIGlmIChjb25maWcuZ2V0UGF0aCgpKSBhd2FpdCB3YWxsZXQuc2F2ZSgpO1xuICAgIHJldHVybiB3YWxsZXQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgY3JlYXRlV2FsbGV0UmFuZG9tKGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKTogUHJvbWlzZTxNb25lcm9XYWxsZXRGdWxsPiB7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgYW5kIG5vcm1hbGl6ZSBwYXJhbXNcbiAgICBpZiAoY29uZmlnLmdldExhbmd1YWdlKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldExhbmd1YWdlKFwiRW5nbGlzaFwiKTtcbiAgICBsZXQgZGFlbW9uQ29ubmVjdGlvbiA9IGNvbmZpZy5nZXRTZXJ2ZXIoKTtcbiAgICBsZXQgcmVqZWN0VW5hdXRob3JpemVkID0gZGFlbW9uQ29ubmVjdGlvbiA/IGRhZW1vbkNvbm5lY3Rpb24uZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkgOiB0cnVlO1xuICAgIFxuICAgIC8vIGxvYWQgd2FzbSBtb2R1bGVcbiAgICBsZXQgbW9kdWxlID0gYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRXYXNtTW9kdWxlKCk7XG4gICAgXG4gICAgLy8gY3JlYXRlIHdhbGxldCBpbiBxdWV1ZVxuICAgIGxldCB3YWxsZXQgPSBhd2FpdCBtb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyByZWdpc3RlciBmbiBpbmZvcm1pbmcgaWYgdW5hdXRob3JpemVkIHJlcXMgc2hvdWxkIGJlIHJlamVjdGVkXG4gICAgICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWRGbklkID0gR2VuVXRpbHMuZ2V0VVVJRCgpO1xuICAgICAgICBMaWJyYXJ5VXRpbHMuc2V0UmVqZWN0VW5hdXRob3JpemVkRm4ocmVqZWN0VW5hdXRob3JpemVkRm5JZCwgKCkgPT4gcmVqZWN0VW5hdXRob3JpemVkKTtcbiAgICAgIFxuICAgICAgICAvLyBjcmVhdGUgd2FsbGV0IGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgbW9kdWxlLmNyZWF0ZV9mdWxsX3dhbGxldChKU09OLnN0cmluZ2lmeShjb25maWcudG9Kc29uKCkpLCByZWplY3RVbmF1dGhvcml6ZWRGbklkLCBhc3luYyAoY3BwQWRkcmVzcykgPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgY3BwQWRkcmVzcyA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihjcHBBZGRyZXNzKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9XYWxsZXRGdWxsKGNwcEFkZHJlc3MsIGNvbmZpZy5nZXRQYXRoKCksIGNvbmZpZy5nZXRQYXNzd29yZCgpLCBjb25maWcuZ2V0RnMoKSwgY29uZmlnLmdldFNlcnZlcigpID8gY29uZmlnLmdldFNlcnZlcigpLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdW5kZWZpbmVkLCByZWplY3RVbmF1dGhvcml6ZWRGbklkKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgXG4gICAgLy8gc2F2ZSB3YWxsZXRcbiAgICBpZiAoY29uZmlnLmdldFBhdGgoKSkgYXdhaXQgd2FsbGV0LnNhdmUoKTtcbiAgICByZXR1cm4gd2FsbGV0O1xuICB9XG4gIFxuICBzdGF0aWMgYXN5bmMgZ2V0U2VlZExhbmd1YWdlcygpIHtcbiAgICBsZXQgbW9kdWxlID0gYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRXYXNtTW9kdWxlKCk7XG4gICAgcmV0dXJuIG1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgcmV0dXJuIEpTT04ucGFyc2UobW9kdWxlLmdldF9rZXlzX3dhbGxldF9zZWVkX2xhbmd1YWdlcygpKS5sYW5ndWFnZXM7XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgZ2V0RnMoKSB7XG4gICAgaWYgKCFNb25lcm9XYWxsZXRGdWxsLkZTKSBNb25lcm9XYWxsZXRGdWxsLkZTID0gZnMucHJvbWlzZXM7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuRlM7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLSBXQUxMRVQgTUVUSE9EUyBTUEVDSUZJQyBUTyBXQVNNIElNUExFTUVOVEFUSU9OIC0tLS0tLS0tLS0tLS0tXG5cbiAgLy8gVE9ETzogbW92ZSB0aGVzZSB0byBNb25lcm9XYWxsZXQudHMsIG90aGVycyBjYW4gYmUgdW5zdXBwb3J0ZWRcbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIG1heGltdW0gaGVpZ2h0IG9mIHRoZSBwZWVycyB0aGUgd2FsbGV0J3MgZGFlbW9uIGlzIGNvbm5lY3RlZCB0by5cbiAgICpcbiAgICogQHJldHVybiB7UHJvbWlzZTxudW1iZXI+fSB0aGUgbWF4aW11bSBoZWlnaHQgb2YgdGhlIHBlZXJzIHRoZSB3YWxsZXQncyBkYWVtb24gaXMgY29ubmVjdGVkIHRvXG4gICAqL1xuICBhc3luYyBnZXREYWVtb25NYXhQZWVySGVpZ2h0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXREYWVtb25NYXhQZWVySGVpZ2h0KCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIFxuICAgICAgICAvLyBjYWxsIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X2RhZW1vbl9tYXhfcGVlcl9oZWlnaHQodGhpcy5jcHBBZGRyZXNzLCAocmVzcCkgPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgcmVzcCA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSB3YWxsZXQncyBkYWVtb24gaXMgc3luY2VkIHdpdGggdGhlIG5ldHdvcmsuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSB0cnVlIGlmIHRoZSBkYWVtb24gaXMgc3luY2VkIHdpdGggdGhlIG5ldHdvcmssIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgYXN5bmMgaXNEYWVtb25TeW5jZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pc0RhZW1vblN5bmNlZCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBcbiAgICAgICAgLy8gY2FsbCB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIHRoaXMubW9kdWxlLmlzX2RhZW1vbl9zeW5jZWQodGhpcy5jcHBBZGRyZXNzLCAocmVzcCkgPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgcmVzcCA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSB3YWxsZXQgaXMgc3luY2VkIHdpdGggdGhlIGRhZW1vbi5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgdGhlIHdhbGxldCBpcyBzeW5jZWQgd2l0aCB0aGUgZGFlbW9uLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzU3luY2VkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaXNTeW5jZWQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5pc19zeW5jZWQodGhpcy5jcHBBZGRyZXNzLCAocmVzcCkgPT4ge1xuICAgICAgICAgIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIG5ldHdvcmsgdHlwZSAobWFpbm5ldCwgdGVzdG5ldCwgb3Igc3RhZ2VuZXQpLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9OZXR3b3JrVHlwZT59IHRoZSB3YWxsZXQncyBuZXR3b3JrIHR5cGVcbiAgICovXG4gIGFzeW5jIGdldE5ldHdvcmtUeXBlKCk6IFByb21pc2U8TW9uZXJvTmV0d29ya1R5cGU+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldE5ldHdvcmtUeXBlKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLmdldF9uZXR3b3JrX3R5cGUodGhpcy5jcHBBZGRyZXNzKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgaGVpZ2h0IG9mIHRoZSBmaXJzdCBibG9jayB0aGF0IHRoZSB3YWxsZXQgc2NhbnMuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlcj59IHRoZSBoZWlnaHQgb2YgdGhlIGZpcnN0IGJsb2NrIHRoYXQgdGhlIHdhbGxldCBzY2Fuc1xuICAgKi9cbiAgYXN5bmMgZ2V0UmVzdG9yZUhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0UmVzdG9yZUhlaWdodCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5nZXRfcmVzdG9yZV9oZWlnaHQodGhpcy5jcHBBZGRyZXNzKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNldCB0aGUgaGVpZ2h0IG9mIHRoZSBmaXJzdCBibG9jayB0aGF0IHRoZSB3YWxsZXQgc2NhbnMuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gcmVzdG9yZUhlaWdodCAtIGhlaWdodCBvZiB0aGUgZmlyc3QgYmxvY2sgdGhhdCB0aGUgd2FsbGV0IHNjYW5zXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzZXRSZXN0b3JlSGVpZ2h0KHJlc3RvcmVIZWlnaHQ6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2V0UmVzdG9yZUhlaWdodChyZXN0b3JlSGVpZ2h0KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0aGlzLm1vZHVsZS5zZXRfcmVzdG9yZV9oZWlnaHQodGhpcy5jcHBBZGRyZXNzLCByZXN0b3JlSGVpZ2h0KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIE1vdmUgdGhlIHdhbGxldCBmcm9tIGl0cyBjdXJyZW50IHBhdGggdG8gdGhlIGdpdmVuIHBhdGguXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIHRoZSB3YWxsZXQncyBkZXN0aW5hdGlvbiBwYXRoXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBtb3ZlVG8ocGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5tb3ZlVG8ocGF0aCk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwubW92ZVRvKHBhdGgsIHRoaXMpO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBDT01NT04gV0FMTEVUIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgYXN5bmMgYWRkTGlzdGVuZXIobGlzdGVuZXI6IE1vbmVyb1dhbGxldExpc3RlbmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgYXdhaXQgc3VwZXIuYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICB9XG4gIFxuICBhc3luYyByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkucmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIGF3YWl0IHN1cGVyLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgfVxuICBcbiAgZ2V0TGlzdGVuZXJzKCk6IE1vbmVyb1dhbGxldExpc3RlbmVyW10ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0TGlzdGVuZXJzKCk7XG4gICAgcmV0dXJuIHN1cGVyLmdldExpc3RlbmVycygpO1xuICB9XG4gIFxuICBhc3luYyBzZXRDb25uZWN0aW9uTWFuYWdlcihjb25uZWN0aW9uTWFuYWdlcj86IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICByZXR1cm4gc3VwZXIuc2V0Q29ubmVjdGlvbk1hbmFnZXIoY29ubmVjdGlvbk1hbmFnZXIpO1xuICB9XG5cbiAgYXN5bmMgc2V0RGFlbW9uQ29ubmVjdGlvbih1cmlPckNvbm5lY3Rpb24/OiBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHwgc3RyaW5nLCBpc1RydXN0ZWQ/OiBib29sZWFuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zZXREYWVtb25Db25uZWN0aW9uKHVyaU9yQ29ubmVjdGlvbiwgaXNUcnVzdGVkKTtcblxuICAgIC8vIG5vcm1hbGl6ZSBjb25uZWN0aW9uXG4gICAgbGV0IGNvbm5lY3Rpb24gPSAhdXJpT3JDb25uZWN0aW9uID8gdW5kZWZpbmVkIDogdXJpT3JDb25uZWN0aW9uIGluc3RhbmNlb2YgTW9uZXJvUnBjQ29ubmVjdGlvbiA/IHVyaU9yQ29ubmVjdGlvbiA6IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHVyaU9yQ29ubmVjdGlvbik7XG4gICAgbGV0IHVyaSA9IGNvbm5lY3Rpb24gJiYgY29ubmVjdGlvbi5nZXRVcmkoKSA/IGNvbm5lY3Rpb24uZ2V0VXJpKCkgOiBcIlwiO1xuICAgIGxldCB1c2VybmFtZSA9IGNvbm5lY3Rpb24gJiYgY29ubmVjdGlvbi5nZXRVc2VybmFtZSgpID8gY29ubmVjdGlvbi5nZXRVc2VybmFtZSgpIDogXCJcIjtcbiAgICBsZXQgcGFzc3dvcmQgPSBjb25uZWN0aW9uICYmIGNvbm5lY3Rpb24uZ2V0UGFzc3dvcmQoKSA/IGNvbm5lY3Rpb24uZ2V0UGFzc3dvcmQoKSA6IFwiXCI7XG4gICAgbGV0IHByb3h5VXJpID0gY29ubmVjdGlvbiAmJiBjb25uZWN0aW9uLmdldFByb3h5VXJpKCkgPyBjb25uZWN0aW9uLmdldFByb3h5VXJpKCkgOiBcIlwiO1xuICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWQgPSBjb25uZWN0aW9uID8gY29ubmVjdGlvbi5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHVuZGVmaW5lZDtcbiAgICBsZXQgaXNUcnVzdGVkQXJnID0gaXNUcnVzdGVkID09PSB1bmRlZmluZWQgPyAtMSA6IChpc1RydXN0ZWQgPyAxIDogMCk7IC8vIG5lZ2F0aXZlIGlmIHVuc2V0XG5cbiAgICAvLyBzZXQgY29ubmVjdGlvbiBpbiBxdWV1ZVxuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnNldF9kYWVtb25fY29ubmVjdGlvbih0aGlzLmNwcEFkZHJlc3MsIHVyaSwgdXNlcm5hbWUsIHBhc3N3b3JkLCBwcm94eVVyaSwgaXNUcnVzdGVkQXJnLCAocmVzcCkgPT4ge1xuICAgICAgICAgIHRoaXMucmVqZWN0VW5hdXRob3JpemVkID0gcmVqZWN0VW5hdXRob3JpemVkOyAgLy8gcGVyc2lzdCBsb2NhbGx5XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgd2FsbGV0J3MgZGFlbW9uIGlzIHRydXN0ZWQuXG4gICAqXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgdGhlIGRhZW1vbiBpcyB0cnVzdGVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzRGFlbW9uVHJ1c3RlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmlzRGFlbW9uVHJ1c3RlZCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5pc19kYWVtb25fdHJ1c3RlZCh0aGlzLmNwcEFkZHJlc3MpO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgZ2V0RGFlbW9uQ29ubmVjdGlvbigpOiBQcm9taXNlPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldERhZW1vbkNvbm5lY3Rpb24oKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBsZXQgY29ubmVjdGlvbkNvbnRhaW5lclN0ciA9IHRoaXMubW9kdWxlLmdldF9kYWVtb25fY29ubmVjdGlvbih0aGlzLmNwcEFkZHJlc3MpO1xuICAgICAgICBpZiAoIWNvbm5lY3Rpb25Db250YWluZXJTdHIpIHJlc29sdmUodW5kZWZpbmVkKTtcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgbGV0IGpzb25Db25uZWN0aW9uID0gSlNPTi5wYXJzZShjb25uZWN0aW9uQ29udGFpbmVyU3RyKTtcbiAgICAgICAgICByZXNvbHZlKG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHt1cmk6IGpzb25Db25uZWN0aW9uLnVyaSwgdXNlcm5hbWU6IGpzb25Db25uZWN0aW9uLnVzZXJuYW1lLCBwYXNzd29yZDoganNvbkNvbm5lY3Rpb24ucGFzc3dvcmQsIHByb3h5VXJpOiBqc29uQ29ubmVjdGlvbi5wcm94eVVyaSwgcmVqZWN0VW5hdXRob3JpemVkOiB0aGlzLnJlamVjdFVuYXV0aG9yaXplZH0pKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzQ29ubmVjdGVkVG9EYWVtb24oKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pc0Nvbm5lY3RlZFRvRGFlbW9uKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuaXNfY29ubmVjdGVkX3RvX2RhZW1vbih0aGlzLmNwcEFkZHJlc3MsIChyZXNwKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VmVyc2lvbigpOiBQcm9taXNlPE1vbmVyb1ZlcnNpb24+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFZlcnNpb24oKTtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBhdGgoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFBhdGgoKTtcbiAgICByZXR1cm4gdGhpcy5wYXRoO1xuICB9XG4gIFxuICBhc3luYyBnZXRJbnRlZ3JhdGVkQWRkcmVzcyhzdGFuZGFyZEFkZHJlc3M/OiBzdHJpbmcsIHBheW1lbnRJZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEludGVncmF0ZWRBZGRyZXNzKHN0YW5kYXJkQWRkcmVzcywgcGF5bWVudElkKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gdGhpcy5tb2R1bGUuZ2V0X2ludGVncmF0ZWRfYWRkcmVzcyh0aGlzLmNwcEFkZHJlc3MsIHN0YW5kYXJkQWRkcmVzcyA/IHN0YW5kYXJkQWRkcmVzcyA6IFwiXCIsIHBheW1lbnRJZCA/IHBheW1lbnRJZCA6IFwiXCIpO1xuICAgICAgICBpZiAocmVzdWx0LmNoYXJBdCgwKSAhPT0gJ3snKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IocmVzdWx0KTtcbiAgICAgICAgcmV0dXJuIG5ldyBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyhKU09OLnBhcnNlKHJlc3VsdCkpO1xuICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgaWYgKGVyci5tZXNzYWdlLmluY2x1ZGVzKFwiSW52YWxpZCBwYXltZW50IElEXCIpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJJbnZhbGlkIHBheW1lbnQgSUQ6IFwiICsgcGF5bWVudElkKTtcbiAgICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGVyci5tZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmRlY29kZUludGVncmF0ZWRBZGRyZXNzKGludGVncmF0ZWRBZGRyZXNzKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gdGhpcy5tb2R1bGUuZGVjb2RlX2ludGVncmF0ZWRfYWRkcmVzcyh0aGlzLmNwcEFkZHJlc3MsIGludGVncmF0ZWRBZGRyZXNzKTtcbiAgICAgICAgaWYgKHJlc3VsdC5jaGFyQXQoMCkgIT09ICd7JykgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHJlc3VsdCk7XG4gICAgICAgIHJldHVybiBuZXcgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MoSlNPTi5wYXJzZShyZXN1bHQpKTtcbiAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihlcnIubWVzc2FnZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0SGVpZ2h0KCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X2hlaWdodCh0aGlzLmNwcEFkZHJlc3MsIChyZXNwKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RGFlbW9uSGVpZ2h0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXREYWVtb25IZWlnaHQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfZGFlbW9uX2hlaWdodCh0aGlzLmNwcEFkZHJlc3MsIChyZXNwKSA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiByZXNwID09PSBcInN0cmluZ1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhlaWdodEJ5RGF0ZSh5ZWFyOiBudW1iZXIsIG1vbnRoOiBudW1iZXIsIGRheTogbnVtYmVyKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEhlaWdodEJ5RGF0ZSh5ZWFyLCBtb250aCwgZGF5KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfaGVpZ2h0X2J5X2RhdGUodGhpcy5jcHBBZGRyZXNzLCB5ZWFyLCBtb250aCwgZGF5LCAocmVzcCkgPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgcmVzcCA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogU3luY2hyb25pemUgdGhlIHdhbGxldCB3aXRoIHRoZSBkYWVtb24gYXMgYSBvbmUtdGltZSBzeW5jaHJvbm91cyBwcm9jZXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9XYWxsZXRMaXN0ZW5lcnxudW1iZXJ9IFtsaXN0ZW5lck9yU3RhcnRIZWlnaHRdIC0gbGlzdGVuZXIgeG9yIHN0YXJ0IGhlaWdodCAoZGVmYXVsdHMgdG8gbm8gc3luYyBsaXN0ZW5lciwgdGhlIGxhc3Qgc3luY2VkIGJsb2NrKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3N0YXJ0SGVpZ2h0XSAtIHN0YXJ0SGVpZ2h0IGlmIG5vdCBnaXZlbiBpbiBmaXJzdCBhcmcgKGRlZmF1bHRzIHRvIGxhc3Qgc3luY2VkIGJsb2NrKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFthbGxvd0NvbmN1cnJlbnRDYWxsc10gLSBhbGxvdyBvdGhlciB3YWxsZXQgbWV0aG9kcyB0byBiZSBwcm9jZXNzZWQgc2ltdWx0YW5lb3VzbHkgZHVyaW5nIHN5bmMgKGRlZmF1bHQgZmFsc2UpPGJyPjxicj48Yj5XQVJOSU5HPC9iPjogZW5hYmxpbmcgdGhpcyBvcHRpb24gd2lsbCBjcmFzaCB3YWxsZXQgZXhlY3V0aW9uIGlmIGFub3RoZXIgY2FsbCBtYWtlcyBhIHNpbXVsdGFuZW91cyBuZXR3b3JrIHJlcXVlc3QuIFRPRE86IHBvc3NpYmxlIHRvIHN5bmMgd2FzbSBuZXR3b3JrIHJlcXVlc3RzIGluIGh0dHBfY2xpZW50X3dhc20uY3BwPyBcbiAgICovXG4gIGFzeW5jIHN5bmMobGlzdGVuZXJPclN0YXJ0SGVpZ2h0PzogTW9uZXJvV2FsbGV0TGlzdGVuZXIgfCBudW1iZXIsIHN0YXJ0SGVpZ2h0PzogbnVtYmVyLCBhbGxvd0NvbmN1cnJlbnRDYWxscyA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9TeW5jUmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zeW5jKGxpc3RlbmVyT3JTdGFydEhlaWdodCwgc3RhcnRIZWlnaHQsIGFsbG93Q29uY3VycmVudENhbGxzKTtcbiAgICBcbiAgICAvLyBub3JtYWxpemUgcGFyYW1zXG4gICAgc3RhcnRIZWlnaHQgPSBsaXN0ZW5lck9yU3RhcnRIZWlnaHQgPT09IHVuZGVmaW5lZCB8fCBsaXN0ZW5lck9yU3RhcnRIZWlnaHQgaW5zdGFuY2VvZiBNb25lcm9XYWxsZXRMaXN0ZW5lciA/IHN0YXJ0SGVpZ2h0IDogbGlzdGVuZXJPclN0YXJ0SGVpZ2h0O1xuICAgIGxldCBsaXN0ZW5lciA9IGxpc3RlbmVyT3JTdGFydEhlaWdodCBpbnN0YW5jZW9mIE1vbmVyb1dhbGxldExpc3RlbmVyID8gbGlzdGVuZXJPclN0YXJ0SGVpZ2h0IDogdW5kZWZpbmVkO1xuICAgIGlmIChzdGFydEhlaWdodCA9PT0gdW5kZWZpbmVkKSBzdGFydEhlaWdodCA9IE1hdGgubWF4KGF3YWl0IHRoaXMuZ2V0SGVpZ2h0KCksIGF3YWl0IHRoaXMuZ2V0UmVzdG9yZUhlaWdodCgpKTtcbiAgICBcbiAgICAvLyByZWdpc3RlciBsaXN0ZW5lciBpZiBnaXZlblxuICAgIGlmIChsaXN0ZW5lcikgYXdhaXQgdGhpcy5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgXG4gICAgLy8gc3luYyB3YWxsZXRcbiAgICBsZXQgZXJyO1xuICAgIGxldCByZXN1bHQ7XG4gICAgdHJ5IHtcbiAgICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICAgIHJlc3VsdCA9IGF3YWl0IChhbGxvd0NvbmN1cnJlbnRDYWxscyA/IHN5bmNXYXNtKCkgOiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4gc3luY1dhc20oKSkpO1xuICAgICAgZnVuY3Rpb24gc3luY1dhc20oKSB7XG4gICAgICAgIHRoYXQuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICAgIGxldCByZXNvbHZlQ2FsbDtcbiAgICAgICAgbGV0IHJlamVjdENhbGw7XG4gICAgICAgIGNvbnN0IGNhbGwgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7IHJlc29sdmVDYWxsID0gcmVzb2x2ZTsgcmVqZWN0Q2FsbCA9IHJlamVjdDsgfSk7XG4gICAgICAgIHRoYXQuc3luY0NhbGxzLmFkZChjYWxsKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAvLyBzeW5jIHdhbGxldCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgICAgdGhhdC5tb2R1bGUuc3luYyh0aGF0LmNwcEFkZHJlc3MsIHN0YXJ0SGVpZ2h0LCAocmVzcCkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc3AuY2hhckF0KDApICE9PSAneycpIHJlamVjdENhbGwobmV3IE1vbmVyb0Vycm9yKHJlc3ApKTtcbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBsZXQgcmVzcEpzb24gPSBKU09OLnBhcnNlKHJlc3ApO1xuICAgICAgICAgICAgICByZXNvbHZlQ2FsbChuZXcgTW9uZXJvU3luY1Jlc3VsdChyZXNwSnNvbi5udW1CbG9ja3NGZXRjaGVkLCByZXNwSnNvbi5yZWNlaXZlZE1vbmV5KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIHJlamVjdENhbGwoZXJyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2FsbC5maW5hbGx5KCgpID0+IHRoYXQuc3luY0NhbGxzLmRlbGV0ZShjYWxsKSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgZXJyID0gZTtcbiAgICB9XG4gICAgXG4gICAgLy8gdW5yZWdpc3RlciBsaXN0ZW5lclxuICAgIGlmIChsaXN0ZW5lciAmJiAhdGhpcy5faXNDbG9zZWQpIGF3YWl0IHRoaXMucmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIFxuICAgIC8vIHRocm93IGVycm9yIG9yIHJldHVyblxuICAgIGlmIChlcnIpIHRocm93IGVycjtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG4gIFxuICBhc3luYyBzdGFydFN5bmNpbmcoc3luY1BlcmlvZEluTXM/OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN0YXJ0U3luY2luZyhzeW5jUGVyaW9kSW5Ncyk7XG4gICAgdGhpcy5zeW5jUGVyaW9kSW5NcyA9IHN5bmNQZXJpb2RJbk1zID09PSB1bmRlZmluZWQgPyBNb25lcm9XYWxsZXRGdWxsLkRFRkFVTFRfU1lOQ19QRVJJT0RfSU5fTVMgOiBzeW5jUGVyaW9kSW5NcztcbiAgICBpZiAoIXRoaXMuc3luY0xvb3BlcikgdGhpcy5zeW5jTG9vcGVyID0gbmV3IFRhc2tMb29wZXIoYXN5bmMgKCkgPT4gYXdhaXQgdGhpcy5iYWNrZ3JvdW5kU3luYygpKVxuICAgIHRoaXMuc3luY0xvb3Blci5zdGFydCh0aGlzLnN5bmNQZXJpb2RJbk1zKTtcbiAgfVxuICAgIFxuICBhc3luYyBzdG9wU3luY2luZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN0b3BTeW5jaW5nKCk7XG4gICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICBpZiAodGhpcy5zeW5jTG9vcGVyKSB0aGlzLnN5bmNMb29wZXIuc3RvcCgpO1xuICAgIHRoaXMubW9kdWxlLnN0b3Bfc3luY2luZyh0aGlzLmNwcEFkZHJlc3MpOyAvLyB0YXNrIGlzIG5vdCBxdWV1ZWQgc28gd2FsbGV0IHN0b3BzIGltbWVkaWF0ZWx5XG4gIH1cbiAgXG4gIGFzeW5jIHNjYW5UeHModHhIYXNoZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zY2FuVHhzKHR4SGFzaGVzKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5zY2FuX3R4cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHt0eEhhc2hlczogdHhIYXNoZXN9KSwgKGVycikgPT4ge1xuICAgICAgICAgIGlmIChlcnIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoZXJyKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlc2NhblNwZW50KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkucmVzY2FuU3BlbnQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5yZXNjYW5fc3BlbnQodGhpcy5jcHBBZGRyZXNzLCAoZXJyKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihlcnIpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzY2FuQmxvY2tjaGFpbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnJlc2NhbkJsb2NrY2hhaW4oKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5yZXNjYW5fYmxvY2tjaGFpbih0aGlzLmNwcEFkZHJlc3MsIChlcnIpID0+IHtcbiAgICAgICAgICBpZiAoZXJyKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKGVycikpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRCYWxhbmNlKGFjY291bnRJZHg/OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg/OiBudW1iZXIpOiBQcm9taXNlPGJpZ2ludD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0QmFsYW5jZShhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBcbiAgICAgIC8vIGdldCBiYWxhbmNlIGVuY29kZWQgaW4ganNvbiBzdHJpbmdcbiAgICAgIGxldCBiYWxhbmNlU3RyO1xuICAgICAgaWYgKGFjY291bnRJZHggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBhc3NlcnQoc3ViYWRkcmVzc0lkeCA9PT0gdW5kZWZpbmVkLCBcIlN1YmFkZHJlc3MgaW5kZXggbXVzdCBiZSB1bmRlZmluZWQgaWYgYWNjb3VudCBpbmRleCBpcyB1bmRlZmluZWRcIik7XG4gICAgICAgIGJhbGFuY2VTdHIgPSB0aGlzLm1vZHVsZS5nZXRfYmFsYW5jZV93YWxsZXQodGhpcy5jcHBBZGRyZXNzKTtcbiAgICAgIH0gZWxzZSBpZiAoc3ViYWRkcmVzc0lkeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGJhbGFuY2VTdHIgPSB0aGlzLm1vZHVsZS5nZXRfYmFsYW5jZV9hY2NvdW50KHRoaXMuY3BwQWRkcmVzcywgYWNjb3VudElkeCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBiYWxhbmNlU3RyID0gdGhpcy5tb2R1bGUuZ2V0X2JhbGFuY2Vfc3ViYWRkcmVzcyh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBwYXJzZSBqc29uIHN0cmluZyB0byBiaWdpbnRcbiAgICAgIHJldHVybiBCaWdJbnQoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKGJhbGFuY2VTdHIpKS5iYWxhbmNlKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VW5sb2NrZWRCYWxhbmNlKGFjY291bnRJZHg/OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg/OiBudW1iZXIpOiBQcm9taXNlPGJpZ2ludD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0VW5sb2NrZWRCYWxhbmNlKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIFxuICAgICAgLy8gZ2V0IGJhbGFuY2UgZW5jb2RlZCBpbiBqc29uIHN0cmluZ1xuICAgICAgbGV0IHVubG9ja2VkQmFsYW5jZVN0cjtcbiAgICAgIGlmIChhY2NvdW50SWR4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYXNzZXJ0KHN1YmFkZHJlc3NJZHggPT09IHVuZGVmaW5lZCwgXCJTdWJhZGRyZXNzIGluZGV4IG11c3QgYmUgdW5kZWZpbmVkIGlmIGFjY291bnQgaW5kZXggaXMgdW5kZWZpbmVkXCIpO1xuICAgICAgICB1bmxvY2tlZEJhbGFuY2VTdHIgPSB0aGlzLm1vZHVsZS5nZXRfdW5sb2NrZWRfYmFsYW5jZV93YWxsZXQodGhpcy5jcHBBZGRyZXNzKTtcbiAgICAgIH0gZWxzZSBpZiAoc3ViYWRkcmVzc0lkeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHVubG9ja2VkQmFsYW5jZVN0ciA9IHRoaXMubW9kdWxlLmdldF91bmxvY2tlZF9iYWxhbmNlX2FjY291bnQodGhpcy5jcHBBZGRyZXNzLCBhY2NvdW50SWR4KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVubG9ja2VkQmFsYW5jZVN0ciA9IHRoaXMubW9kdWxlLmdldF91bmxvY2tlZF9iYWxhbmNlX3N1YmFkZHJlc3ModGhpcy5jcHBBZGRyZXNzLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gcGFyc2UganNvbiBzdHJpbmcgdG8gYmlnaW50XG4gICAgICByZXR1cm4gQmlnSW50KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyh1bmxvY2tlZEJhbGFuY2VTdHIpKS51bmxvY2tlZEJhbGFuY2UpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRBY2NvdW50cyhpbmNsdWRlU3ViYWRkcmVzc2VzPzogYm9vbGVhbiwgdGFnPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9BY2NvdW50W10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEFjY291bnRzKGluY2x1ZGVTdWJhZGRyZXNzZXMsIHRhZyk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IGFjY291bnRzU3RyID0gdGhpcy5tb2R1bGUuZ2V0X2FjY291bnRzKHRoaXMuY3BwQWRkcmVzcywgaW5jbHVkZVN1YmFkZHJlc3NlcyA/IHRydWUgOiBmYWxzZSwgdGFnID8gdGFnIDogXCJcIik7XG4gICAgICBsZXQgYWNjb3VudHMgPSBbXTtcbiAgICAgIGZvciAobGV0IGFjY291bnRKc29uIG9mIEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhhY2NvdW50c1N0cikpLmFjY291bnRzKSB7XG4gICAgICAgIGFjY291bnRzLnB1c2goTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZUFjY291bnQobmV3IE1vbmVyb0FjY291bnQoYWNjb3VudEpzb24pKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gYWNjb3VudHM7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFjY291bnQoYWNjb3VudElkeDogbnVtYmVyLCBpbmNsdWRlU3ViYWRkcmVzc2VzPzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvQWNjb3VudD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0QWNjb3VudChhY2NvdW50SWR4LCBpbmNsdWRlU3ViYWRkcmVzc2VzKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgYWNjb3VudFN0ciA9IHRoaXMubW9kdWxlLmdldF9hY2NvdW50KHRoaXMuY3BwQWRkcmVzcywgYWNjb3VudElkeCwgaW5jbHVkZVN1YmFkZHJlc3NlcyA/IHRydWUgOiBmYWxzZSk7XG4gICAgICBsZXQgYWNjb3VudEpzb24gPSBKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMoYWNjb3VudFN0cikpO1xuICAgICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuc2FuaXRpemVBY2NvdW50KG5ldyBNb25lcm9BY2NvdW50KGFjY291bnRKc29uKSk7XG4gICAgfSk7XG5cbiAgfVxuICBcbiAgYXN5bmMgY3JlYXRlQWNjb3VudChsYWJlbD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQWNjb3VudD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuY3JlYXRlQWNjb3VudChsYWJlbCk7XG4gICAgaWYgKGxhYmVsID09PSB1bmRlZmluZWQpIGxhYmVsID0gXCJcIjtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgYWNjb3VudFN0ciA9IHRoaXMubW9kdWxlLmNyZWF0ZV9hY2NvdW50KHRoaXMuY3BwQWRkcmVzcywgbGFiZWwpO1xuICAgICAgbGV0IGFjY291bnRKc29uID0gSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKGFjY291bnRTdHIpKTtcbiAgICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplQWNjb3VudChuZXcgTW9uZXJvQWNjb3VudChhY2NvdW50SnNvbikpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSW5kaWNlcz86IG51bWJlcltdKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzW10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSW5kaWNlcyk7XG4gICAgbGV0IGFyZ3MgPSB7YWNjb3VudElkeDogYWNjb3VudElkeCwgc3ViYWRkcmVzc0luZGljZXM6IHN1YmFkZHJlc3NJbmRpY2VzID09PSB1bmRlZmluZWQgPyBbXSA6IEdlblV0aWxzLmxpc3RpZnkoc3ViYWRkcmVzc0luZGljZXMpfTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgc3ViYWRkcmVzc2VzSnNvbiA9IEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyh0aGlzLm1vZHVsZS5nZXRfc3ViYWRkcmVzc2VzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoYXJncykpKSkuc3ViYWRkcmVzc2VzO1xuICAgICAgbGV0IHN1YmFkZHJlc3NlcyA9IFtdO1xuICAgICAgZm9yIChsZXQgc3ViYWRkcmVzc0pzb24gb2Ygc3ViYWRkcmVzc2VzSnNvbikgc3ViYWRkcmVzc2VzLnB1c2goTW9uZXJvV2FsbGV0S2V5cy5zYW5pdGl6ZVN1YmFkZHJlc3MobmV3IE1vbmVyb1N1YmFkZHJlc3Moc3ViYWRkcmVzc0pzb24pKSk7XG4gICAgICByZXR1cm4gc3ViYWRkcmVzc2VzO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBjcmVhdGVTdWJhZGRyZXNzKGFjY291bnRJZHg6IG51bWJlciwgbGFiZWw/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3M+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmNyZWF0ZVN1YmFkZHJlc3MoYWNjb3VudElkeCwgbGFiZWwpO1xuICAgIGlmIChsYWJlbCA9PT0gdW5kZWZpbmVkKSBsYWJlbCA9IFwiXCI7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IHN1YmFkZHJlc3NTdHIgPSB0aGlzLm1vZHVsZS5jcmVhdGVfc3ViYWRkcmVzcyh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgsIGxhYmVsKTtcbiAgICAgIGxldCBzdWJhZGRyZXNzSnNvbiA9IEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhzdWJhZGRyZXNzU3RyKSk7XG4gICAgICByZXR1cm4gTW9uZXJvV2FsbGV0S2V5cy5zYW5pdGl6ZVN1YmFkZHJlc3MobmV3IE1vbmVyb1N1YmFkZHJlc3Moc3ViYWRkcmVzc0pzb24pKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIHNldFN1YmFkZHJlc3NMYWJlbChhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg6IG51bWJlciwgbGFiZWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2V0U3ViYWRkcmVzc0xhYmVsKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIGxhYmVsKTtcbiAgICBpZiAobGFiZWwgPT09IHVuZGVmaW5lZCkgbGFiZWwgPSBcIlwiO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRoaXMubW9kdWxlLnNldF9zdWJhZGRyZXNzX2xhYmVsKHRoaXMuY3BwQWRkcmVzcywgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCwgbGFiZWwpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeHMocXVlcnk/OiBzdHJpbmdbXSB8IFBhcnRpYWw8TW9uZXJvVHhRdWVyeT4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFR4cyhxdWVyeSk7XG5cbiAgICAvLyBjb3B5IGFuZCBub3JtYWxpemUgcXVlcnkgdXAgdG8gYmxvY2tcbiAgICBjb25zdCBxdWVyeU5vcm1hbGl6ZWQgPSBxdWVyeSA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVUeFF1ZXJ5KHF1ZXJ5KTtcbiAgICBcbiAgICAvLyBzY2hlZHVsZSB0YXNrXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIGNhbGwgd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrXG4gICAgICAgIHRoaXMubW9kdWxlLmdldF90eHModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeShxdWVyeU5vcm1hbGl6ZWQuZ2V0QmxvY2soKS50b0pzb24oKSksIChibG9ja3NKc29uU3RyKSA9PiB7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gY2hlY2sgZm9yIGVycm9yXG4gICAgICAgICAgaWYgKGJsb2Nrc0pzb25TdHIuY2hhckF0KDApICE9PSAneycpIHtcbiAgICAgICAgICAgIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoYmxvY2tzSnNvblN0cikpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICAvLyByZXNvbHZlIHdpdGggZGVzZXJpYWxpemVkIHR4c1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXNvbHZlKE1vbmVyb1dhbGxldEZ1bGwuZGVzZXJpYWxpemVUeHMocXVlcnlOb3JtYWxpemVkLCBibG9ja3NKc29uU3RyKSk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFRyYW5zZmVycyhxdWVyeT86IFBhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT4pOiBQcm9taXNlPE1vbmVyb1RyYW5zZmVyW10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFRyYW5zZmVycyhxdWVyeSk7XG4gICAgXG4gICAgLy8gY29weSBhbmQgbm9ybWFsaXplIHF1ZXJ5IHVwIHRvIGJsb2NrXG4gICAgY29uc3QgcXVlcnlOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVRyYW5zZmVyUXVlcnkocXVlcnkpO1xuICAgIFxuICAgIC8vIHJldHVybiBwcm9taXNlIHdoaWNoIHJlc29sdmVzIG9uIGNhbGxiYWNrXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIGNhbGwgd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrXG4gICAgICAgIHRoaXMubW9kdWxlLmdldF90cmFuc2ZlcnModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeShxdWVyeU5vcm1hbGl6ZWQuZ2V0VHhRdWVyeSgpLmdldEJsb2NrKCkudG9Kc29uKCkpLCAoYmxvY2tzSnNvblN0cikgPT4ge1xuICAgICAgICAgICAgXG4gICAgICAgICAgLy8gY2hlY2sgZm9yIGVycm9yXG4gICAgICAgICAgaWYgKGJsb2Nrc0pzb25TdHIuY2hhckF0KDApICE9PSAneycpIHtcbiAgICAgICAgICAgIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoYmxvY2tzSnNvblN0cikpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICAgXG4gICAgICAgICAgLy8gcmVzb2x2ZSB3aXRoIGRlc2VyaWFsaXplZCB0cmFuc2ZlcnMgXG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlc29sdmUoTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZVRyYW5zZmVycyhxdWVyeU5vcm1hbGl6ZWQsIGJsb2Nrc0pzb25TdHIpKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0T3V0cHV0cyhxdWVyeT86IFBhcnRpYWw8TW9uZXJvT3V0cHV0UXVlcnk+KTogUHJvbWlzZTxNb25lcm9PdXRwdXRXYWxsZXRbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0T3V0cHV0cyhxdWVyeSk7XG4gICAgXG4gICAgLy8gY29weSBhbmQgbm9ybWFsaXplIHF1ZXJ5IHVwIHRvIGJsb2NrXG4gICAgY29uc3QgcXVlcnlOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZU91dHB1dFF1ZXJ5KHF1ZXJ5KTtcbiAgICBcbiAgICAvLyByZXR1cm4gcHJvbWlzZSB3aGljaCByZXNvbHZlcyBvbiBjYWxsYmFja1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PntcbiAgICAgICAgXG4gICAgICAgIC8vIGNhbGwgd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrXG4gICAgICAgIHRoaXMubW9kdWxlLmdldF9vdXRwdXRzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkocXVlcnlOb3JtYWxpemVkLmdldFR4UXVlcnkoKS5nZXRCbG9jaygpLnRvSnNvbigpKSwgKGJsb2Nrc0pzb25TdHIpID0+IHtcbiAgICAgICAgICBcbiAgICAgICAgICAvLyBjaGVjayBmb3IgZXJyb3JcbiAgICAgICAgICBpZiAoYmxvY2tzSnNvblN0ci5jaGFyQXQoMCkgIT09ICd7Jykge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihibG9ja3NKc29uU3RyKSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIC8vIHJlc29sdmUgd2l0aCBkZXNlcmlhbGl6ZWQgb3V0cHV0c1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXNvbHZlKE1vbmVyb1dhbGxldEZ1bGwuZGVzZXJpYWxpemVPdXRwdXRzKHF1ZXJ5Tm9ybWFsaXplZCwgYmxvY2tzSnNvblN0cikpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBleHBvcnRPdXRwdXRzKGFsbCA9IGZhbHNlKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmV4cG9ydE91dHB1dHMoYWxsKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5leHBvcnRfb3V0cHV0cyh0aGlzLmNwcEFkZHJlc3MsIGFsbCwgKG91dHB1dHNIZXgpID0+IHJlc29sdmUob3V0cHV0c0hleCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGltcG9ydE91dHB1dHMob3V0cHV0c0hleDogc3RyaW5nKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmltcG9ydE91dHB1dHMob3V0cHV0c0hleCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuaW1wb3J0X291dHB1dHModGhpcy5jcHBBZGRyZXNzLCBvdXRwdXRzSGV4LCAobnVtSW1wb3J0ZWQpID0+IHJlc29sdmUobnVtSW1wb3J0ZWQpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBleHBvcnRLZXlJbWFnZXMoYWxsID0gZmFsc2UpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlRXhwb3J0UmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5leHBvcnRLZXlJbWFnZXMoYWxsKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5leHBvcnRfa2V5X2ltYWdlcyh0aGlzLmNwcEFkZHJlc3MsIGFsbCwgKHJlc3VsdFN0cikgPT4ge1xuICAgICAgICAgIGlmIChyZXN1bHRTdHIuY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzdWx0U3RyKSk7IC8vIGpzb24gZXhwZWN0ZWQsIGVsc2UgZXJyb3JcbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGxldCByZXN1bHRKc29uID0gSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHJlc3VsdFN0cikpO1xuICAgICAgICAgICAgaWYgKCFyZXN1bHRKc29uLmtleUltYWdlcykgcmVzdWx0SnNvbi5rZXlJbWFnZXMgPSBbXTtcbiAgICAgICAgICAgIHJlc29sdmUobmV3IE1vbmVyb0tleUltYWdlRXhwb3J0UmVzdWx0KHJlc3VsdEpzb24pKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGltcG9ydEtleUltYWdlcyhrZXlJbWFnZXM6IE1vbmVyb0tleUltYWdlW10sIG9mZnNldCA9IDApOiBQcm9taXNlPE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pbXBvcnRLZXlJbWFnZXMoa2V5SW1hZ2VzLCBvZmZzZXQpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmltcG9ydF9rZXlfaW1hZ2VzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe29mZnNldDogb2Zmc2V0LCBrZXlJbWFnZXM6IGtleUltYWdlcy5tYXAoa2V5SW1hZ2UgPT4ga2V5SW1hZ2UudG9Kc29uKCkpfSksIChrZXlJbWFnZUltcG9ydFJlc3VsdFN0cikgPT4ge1xuICAgICAgICAgIGlmIChrZXlJbWFnZUltcG9ydFJlc3VsdFN0ci5jaGFyQXQoMCkgIT09ICd7JykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihrZXlJbWFnZUltcG9ydFJlc3VsdFN0cikpOyAvLyBqc29uIGV4cGVjdGVkLCBlbHNlIGVycm9yXG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMoa2V5SW1hZ2VJbXBvcnRSZXN1bHRTdHIpKSkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCgpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlW10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0KCk7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBmcmVlemVPdXRwdXQoa2V5SW1hZ2U6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZnJlZXplT3V0cHV0KGtleUltYWdlKTtcbiAgICBpZiAoIWtleUltYWdlKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHNwZWNpZnkga2V5IGltYWdlIHRvIGZyZWV6ZVwiKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5mcmVlemVfb3V0cHV0KHRoaXMuY3BwQWRkcmVzcywga2V5SW1hZ2UsICgpID0+IHJlc29sdmUoKSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgdGhhd091dHB1dChrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS50aGF3T3V0cHV0KGtleUltYWdlKTtcbiAgICBpZiAoIWtleUltYWdlKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHNwZWNpZnkga2V5IGltYWdlIHRvIHRoYXdcIik7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUudGhhd19vdXRwdXQodGhpcy5jcHBBZGRyZXNzLCBrZXlJbWFnZSwgKCkgPT4gcmVzb2x2ZSgpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBpc091dHB1dEZyb3plbihrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pc091dHB1dEZyb3plbihrZXlJbWFnZSk7XG4gICAgaWYgKCFrZXlJbWFnZSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBzcGVjaWZ5IGtleSBpbWFnZSB0byBjaGVjayBpZiBmcm96ZW5cIik7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuaXNfb3V0cHV0X2Zyb3plbih0aGlzLmNwcEFkZHJlc3MsIGtleUltYWdlLCAocmVzdWx0KSA9PiByZXNvbHZlKHJlc3VsdCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBnZXREZWZhdWx0RmVlUHJpb3JpdHkoKTogUHJvbWlzZTxNb25lcm9UeFByaW9yaXR5PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXREZWZhdWx0RmVlUHJpb3JpdHkoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfZGVmYXVsdF9mZWVfcHJpb3JpdHkodGhpcy5jcHBBZGRyZXNzLCAocmVzdWx0KSA9PiByZXNvbHZlKHJlc3VsdCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNyZWF0ZVR4cyhjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jcmVhdGVUeHMoY29uZmlnKTtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSwgY29weSwgYW5kIG5vcm1hbGl6ZSBjb25maWdcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyhjb25maWcpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnTm9ybWFsaXplZC5zZXRDYW5TcGxpdCh0cnVlKTtcbiAgICBcbiAgICAvLyBjcmVhdGUgdHhzIGluIHF1ZXVlXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIGNyZWF0ZSB0eHMgaW4gd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICB0aGlzLm1vZHVsZS5jcmVhdGVfdHhzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoY29uZmlnTm9ybWFsaXplZC50b0pzb24oKSksICh0eFNldEpzb25TdHIpID0+IHtcbiAgICAgICAgICBpZiAodHhTZXRKc29uU3RyLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHR4U2V0SnNvblN0cikpOyAvLyBqc29uIGV4cGVjdGVkLCBlbHNlIGVycm9yXG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9UeFNldChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHModHhTZXRKc29uU3RyKSkpLmdldFR4cygpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBPdXRwdXQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN3ZWVwT3V0cHV0KGNvbmZpZyk7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIGFuZCB2YWxpZGF0ZSBjb25maWdcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVN3ZWVwT3V0cHV0Q29uZmlnKGNvbmZpZyk7XG4gICAgXG4gICAgLy8gc3dlZXAgb3V0cHV0IGluIHF1ZXVlXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIHN3ZWVwIG91dHB1dCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIHRoaXMubW9kdWxlLnN3ZWVwX291dHB1dCh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KGNvbmZpZ05vcm1hbGl6ZWQudG9Kc29uKCkpLCAodHhTZXRKc29uU3RyKSA9PiB7XG4gICAgICAgICAgaWYgKHR4U2V0SnNvblN0ci5jaGFyQXQoMCkgIT09ICd7JykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcih0eFNldEpzb25TdHIpKTsgLy8ganNvbiBleHBlY3RlZCwgZWxzZSBlcnJvclxuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvVHhTZXQoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHR4U2V0SnNvblN0cikpKS5nZXRUeHMoKVswXSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBzd2VlcFVubG9ja2VkKGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN3ZWVwVW5sb2NrZWQoY29uZmlnKTtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSBhbmQgbm9ybWFsaXplIGNvbmZpZ1xuICAgIGNvbnN0IGNvbmZpZ05vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplU3dlZXBVbmxvY2tlZENvbmZpZyhjb25maWcpO1xuICAgIFxuICAgIC8vIHN3ZWVwIHVubG9ja2VkIGluIHF1ZXVlXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIHN3ZWVwIHVubG9ja2VkIGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgdGhpcy5tb2R1bGUuc3dlZXBfdW5sb2NrZWQodGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeShjb25maWdOb3JtYWxpemVkLnRvSnNvbigpKSwgKHR4U2V0c0pzb24pID0+IHtcbiAgICAgICAgICBpZiAodHhTZXRzSnNvbi5jaGFyQXQoMCkgIT09ICd7JykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcih0eFNldHNKc29uKSk7IC8vIGpzb24gZXhwZWN0ZWQsIGVsc2UgZXJyb3JcbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGxldCB0eFNldHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAobGV0IHR4U2V0SnNvbiBvZiBKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHModHhTZXRzSnNvbikpLnR4U2V0cykgdHhTZXRzLnB1c2gobmV3IE1vbmVyb1R4U2V0KHR4U2V0SnNvbikpO1xuICAgICAgICAgICAgbGV0IHR4cyA9IFtdO1xuICAgICAgICAgICAgZm9yIChsZXQgdHhTZXQgb2YgdHhTZXRzKSBmb3IgKGxldCB0eCBvZiB0eFNldC5nZXRUeHMoKSkgdHhzLnB1c2godHgpO1xuICAgICAgICAgICAgcmVzb2x2ZSh0eHMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBEdXN0KHJlbGF5PzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3dlZXBEdXN0KHJlbGF5KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgLy8gY2FsbCB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIHRoaXMubW9kdWxlLnN3ZWVwX2R1c3QodGhpcy5jcHBBZGRyZXNzLCByZWxheSwgKHR4U2V0SnNvblN0cikgPT4ge1xuICAgICAgICAgIGlmICh0eFNldEpzb25TdHIuY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IodHhTZXRKc29uU3RyKSk7IC8vIGpzb24gZXhwZWN0ZWQsIGVsc2UgZXJyb3JcbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGxldCB0eFNldCA9IG5ldyBNb25lcm9UeFNldChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHModHhTZXRKc29uU3RyKSkpO1xuICAgICAgICAgICAgaWYgKHR4U2V0LmdldFR4cygpID09PSB1bmRlZmluZWQpIHR4U2V0LnNldFR4cyhbXSk7XG4gICAgICAgICAgICByZXNvbHZlKHR4U2V0LmdldFR4cygpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbGF5VHhzKHR4c09yTWV0YWRhdGFzOiAoTW9uZXJvVHhXYWxsZXQgfCBzdHJpbmcpW10pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5yZWxheVR4cyh0eHNPck1ldGFkYXRhcyk7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkodHhzT3JNZXRhZGF0YXMpLCBcIk11c3QgcHJvdmlkZSBhbiBhcnJheSBvZiB0eHMgb3IgdGhlaXIgbWV0YWRhdGEgdG8gcmVsYXlcIik7XG4gICAgbGV0IHR4TWV0YWRhdGFzID0gW107XG4gICAgZm9yIChsZXQgdHhPck1ldGFkYXRhIG9mIHR4c09yTWV0YWRhdGFzKSB0eE1ldGFkYXRhcy5wdXNoKHR4T3JNZXRhZGF0YSBpbnN0YW5jZW9mIE1vbmVyb1R4V2FsbGV0ID8gdHhPck1ldGFkYXRhLmdldE1ldGFkYXRhKCkgOiB0eE9yTWV0YWRhdGEpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnJlbGF5X3R4cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHt0eE1ldGFkYXRhczogdHhNZXRhZGF0YXN9KSwgKHR4SGFzaGVzSnNvbikgPT4ge1xuICAgICAgICAgIGlmICh0eEhhc2hlc0pzb24uY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IodHhIYXNoZXNKc29uKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKEpTT04ucGFyc2UodHhIYXNoZXNKc29uKS50eEhhc2hlcyk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGRlc2NyaWJlVHhTZXQodHhTZXQ6IE1vbmVyb1R4U2V0KTogUHJvbWlzZTxNb25lcm9UeFNldD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZGVzY3JpYmVUeFNldCh0eFNldCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdHhTZXQgPSBuZXcgTW9uZXJvVHhTZXQoe3Vuc2lnbmVkVHhIZXg6IHR4U2V0LmdldFVuc2lnbmVkVHhIZXgoKSwgc2lnbmVkVHhIZXg6IHR4U2V0LmdldFNpZ25lZFR4SGV4KCksIG11bHRpc2lnVHhIZXg6IHR4U2V0LmdldE11bHRpc2lnVHhIZXgoKX0pO1xuICAgICAgdHJ5IHsgcmV0dXJuIG5ldyBNb25lcm9UeFNldChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHModGhpcy5tb2R1bGUuZGVzY3JpYmVfdHhfc2V0KHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkodHhTZXQudG9Kc29uKCkpKSkpKTsgfVxuICAgICAgY2F0Y2ggKGVycikgeyB0aHJvdyBuZXcgTW9uZXJvRXJyb3IodGhpcy5tb2R1bGUuZ2V0X2V4Y2VwdGlvbl9tZXNzYWdlKGVycikpOyB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNpZ25UeHModW5zaWduZWRUeEhleDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeFNldD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2lnblR4cyh1bnNpZ25lZFR4SGV4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkgeyByZXR1cm4gbmV3IE1vbmVyb1R4U2V0KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyh0aGlzLm1vZHVsZS5zaWduX3R4cyh0aGlzLmNwcEFkZHJlc3MsIHVuc2lnbmVkVHhIZXgpKSkpOyB9XG4gICAgICBjYXRjaCAoZXJyKSB7IHRocm93IG5ldyBNb25lcm9FcnJvcih0aGlzLm1vZHVsZS5nZXRfZXhjZXB0aW9uX21lc3NhZ2UoZXJyKSk7IH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc3VibWl0VHhzKHNpZ25lZFR4SGV4OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zdWJtaXRUeHMoc2lnbmVkVHhIZXgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnN1Ym1pdF90eHModGhpcy5jcHBBZGRyZXNzLCBzaWduZWRUeEhleCwgKHJlc3ApID0+IHtcbiAgICAgICAgICBpZiAocmVzcC5jaGFyQXQoMCkgIT09ICd7JykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKEpTT04ucGFyc2UocmVzcCkudHhIYXNoZXMpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzaWduTWVzc2FnZShtZXNzYWdlOiBzdHJpbmcsIHNpZ25hdHVyZVR5cGUgPSBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfU1BFTkRfS0VZLCBhY2NvdW50SWR4ID0gMCwgc3ViYWRkcmVzc0lkeCA9IDApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2lnbk1lc3NhZ2UobWVzc2FnZSwgc2lnbmF0dXJlVHlwZSwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG4gICAgXG4gICAgLy8gYXNzaWduIGRlZmF1bHRzXG4gICAgc2lnbmF0dXJlVHlwZSA9IHNpZ25hdHVyZVR5cGUgfHwgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWTtcbiAgICBhY2NvdW50SWR4ID0gYWNjb3VudElkeCB8fCAwO1xuICAgIHN1YmFkZHJlc3NJZHggPSBzdWJhZGRyZXNzSWR4IHx8IDA7XG4gICAgXG4gICAgLy8gcXVldWUgdGFzayB0byBzaWduIG1lc3NhZ2VcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkgeyByZXR1cm4gdGhpcy5tb2R1bGUuc2lnbl9tZXNzYWdlKHRoaXMuY3BwQWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlVHlwZSA9PT0gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSA/IDAgOiAxLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTsgfVxuICAgICAgY2F0Y2ggKGVycikgeyB0aHJvdyBuZXcgTW9uZXJvRXJyb3IodGhpcy5tb2R1bGUuZ2V0X2V4Y2VwdGlvbl9tZXNzYWdlKGVycikpOyB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHZlcmlmeU1lc3NhZ2UobWVzc2FnZTogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS52ZXJpZnlNZXNzYWdlKG1lc3NhZ2UsIGFkZHJlc3MsIHNpZ25hdHVyZSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IHJlc3VsdDtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJlc3VsdCA9IEpTT04ucGFyc2UodGhpcy5tb2R1bGUudmVyaWZ5X21lc3NhZ2UodGhpcy5jcHBBZGRyZXNzLCBtZXNzYWdlLCBhZGRyZXNzLCBzaWduYXR1cmUpKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICByZXN1bHQgPSB7aXNHb29kOiBmYWxzZX07XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQocmVzdWx0LmlzR29vZCA/XG4gICAgICAgIHtpc0dvb2Q6IHJlc3VsdC5pc0dvb2QsIGlzT2xkOiByZXN1bHQuaXNPbGQsIHNpZ25hdHVyZVR5cGU6IHJlc3VsdC5zaWduYXR1cmVUeXBlID09PSBcInNwZW5kXCIgPyBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfU1BFTkRfS0VZIDogTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1ZJRVdfS0VZLCB2ZXJzaW9uOiByZXN1bHQudmVyc2lvbn0gOlxuICAgICAgICB7aXNHb29kOiBmYWxzZX1cbiAgICAgICk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4S2V5KHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFR4S2V5KHR4SGFzaCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdHJ5IHsgcmV0dXJuIHRoaXMubW9kdWxlLmdldF90eF9rZXkodGhpcy5jcHBBZGRyZXNzLCB0eEhhc2gpOyB9XG4gICAgICBjYXRjaCAoZXJyKSB7IHRocm93IG5ldyBNb25lcm9FcnJvcih0aGlzLm1vZHVsZS5nZXRfZXhjZXB0aW9uX21lc3NhZ2UoZXJyKSk7IH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tUeEtleSh0eEhhc2g6IHN0cmluZywgdHhLZXk6IHN0cmluZywgYWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1R4PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jaGVja1R4S2V5KHR4SGFzaCwgdHhLZXksIGFkZHJlc3MpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTsgXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5jaGVja190eF9rZXkodGhpcy5jcHBBZGRyZXNzLCB0eEhhc2gsIHR4S2V5LCBhZGRyZXNzLCAocmVzcEpzb25TdHIpID0+IHtcbiAgICAgICAgICBpZiAocmVzcEpzb25TdHIuY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcEpzb25TdHIpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb0NoZWNrVHgoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHJlc3BKc29uU3RyKSkpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhQcm9vZih0eEhhc2g6IHN0cmluZywgYWRkcmVzczogc3RyaW5nLCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFR4UHJvb2YodHhIYXNoLCBhZGRyZXNzLCBtZXNzYWdlKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfdHhfcHJvb2YodGhpcy5jcHBBZGRyZXNzLCB0eEhhc2ggfHwgXCJcIiwgYWRkcmVzcyB8fCBcIlwiLCBtZXNzYWdlIHx8IFwiXCIsIChzaWduYXR1cmUpID0+IHtcbiAgICAgICAgICBsZXQgZXJyb3JLZXkgPSBcImVycm9yOiBcIjtcbiAgICAgICAgICBpZiAoc2lnbmF0dXJlLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHNpZ25hdHVyZS5zdWJzdHJpbmcoZXJyb3JLZXkubGVuZ3RoKSkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShzaWduYXR1cmUpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBjaGVja1R4UHJvb2YodHhIYXNoOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tUeD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuY2hlY2tUeFByb29mKHR4SGFzaCwgYWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7IFxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuY2hlY2tfdHhfcHJvb2YodGhpcy5jcHBBZGRyZXNzLCB0eEhhc2ggfHwgXCJcIiwgYWRkcmVzcyB8fCBcIlwiLCBtZXNzYWdlIHx8IFwiXCIsIHNpZ25hdHVyZSB8fCBcIlwiLCAocmVzcEpzb25TdHIpID0+IHtcbiAgICAgICAgICBpZiAocmVzcEpzb25TdHIuY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcEpzb25TdHIpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb0NoZWNrVHgoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHJlc3BKc29uU3RyKSkpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U3BlbmRQcm9vZih0eEhhc2g6IHN0cmluZywgbWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRTcGVuZFByb29mKHR4SGFzaCwgbWVzc2FnZSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X3NwZW5kX3Byb29mKHRoaXMuY3BwQWRkcmVzcywgdHhIYXNoIHx8IFwiXCIsIG1lc3NhZ2UgfHwgXCJcIiwgKHNpZ25hdHVyZSkgPT4ge1xuICAgICAgICAgIGxldCBlcnJvcktleSA9IFwiZXJyb3I6IFwiO1xuICAgICAgICAgIGlmIChzaWduYXR1cmUuaW5kZXhPZihlcnJvcktleSkgPT09IDApIHJlamVjdChuZXcgTW9uZXJvRXJyb3Ioc2lnbmF0dXJlLnN1YnN0cmluZyhlcnJvcktleS5sZW5ndGgpKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKHNpZ25hdHVyZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrU3BlbmRQcm9vZih0eEhhc2g6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuY2hlY2tTcGVuZFByb29mKHR4SGFzaCwgbWVzc2FnZSwgc2lnbmF0dXJlKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7IFxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuY2hlY2tfc3BlbmRfcHJvb2YodGhpcy5jcHBBZGRyZXNzLCB0eEhhc2ggfHwgXCJcIiwgbWVzc2FnZSB8fCBcIlwiLCBzaWduYXR1cmUgfHwgXCJcIiwgKHJlc3ApID0+IHtcbiAgICAgICAgICB0eXBlb2YgcmVzcCA9PT0gXCJzdHJpbmdcIiA/IHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcCkpIDogcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UmVzZXJ2ZVByb29mV2FsbGV0KG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0UmVzZXJ2ZVByb29mV2FsbGV0KG1lc3NhZ2UpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmdldF9yZXNlcnZlX3Byb29mX3dhbGxldCh0aGlzLmNwcEFkZHJlc3MsIG1lc3NhZ2UsIChzaWduYXR1cmUpID0+IHtcbiAgICAgICAgICBsZXQgZXJyb3JLZXkgPSBcImVycm9yOiBcIjtcbiAgICAgICAgICBpZiAoc2lnbmF0dXJlLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHNpZ25hdHVyZS5zdWJzdHJpbmcoZXJyb3JLZXkubGVuZ3RoKSwgLTEpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoc2lnbmF0dXJlKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UmVzZXJ2ZVByb29mQWNjb3VudChhY2NvdW50SWR4OiBudW1iZXIsIGFtb3VudDogYmlnaW50LCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFJlc2VydmVQcm9vZkFjY291bnQoYWNjb3VudElkeCwgYW1vdW50LCBtZXNzYWdlKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfcmVzZXJ2ZV9wcm9vZl9hY2NvdW50KHRoaXMuY3BwQWRkcmVzcywgYWNjb3VudElkeCwgYW1vdW50LnRvU3RyaW5nKCksIG1lc3NhZ2UsIChzaWduYXR1cmUpID0+IHtcbiAgICAgICAgICBsZXQgZXJyb3JLZXkgPSBcImVycm9yOiBcIjtcbiAgICAgICAgICBpZiAoc2lnbmF0dXJlLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHNpZ25hdHVyZS5zdWJzdHJpbmcoZXJyb3JLZXkubGVuZ3RoKSwgLTEpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoc2lnbmF0dXJlKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGNoZWNrUmVzZXJ2ZVByb29mKGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tSZXNlcnZlPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jaGVja1Jlc2VydmVQcm9vZihhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTsgXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5jaGVja19yZXNlcnZlX3Byb29mKHRoaXMuY3BwQWRkcmVzcywgYWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlLCAocmVzcEpzb25TdHIpID0+IHtcbiAgICAgICAgICBpZiAocmVzcEpzb25TdHIuY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcEpzb25TdHIsIC0xKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9DaGVja1Jlc2VydmUoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHJlc3BKc29uU3RyKSkpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhOb3Rlcyh0eEhhc2hlczogc3RyaW5nW10pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRUeE5vdGVzKHR4SGFzaGVzKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkgeyByZXR1cm4gSlNPTi5wYXJzZSh0aGlzLm1vZHVsZS5nZXRfdHhfbm90ZXModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7dHhIYXNoZXM6IHR4SGFzaGVzfSkpKS50eE5vdGVzOyB9XG4gICAgICBjYXRjaCAoZXJyKSB7IHRocm93IG5ldyBNb25lcm9FcnJvcih0aGlzLm1vZHVsZS5nZXRfZXhjZXB0aW9uX21lc3NhZ2UoZXJyKSk7IH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0VHhOb3Rlcyh0eEhhc2hlczogc3RyaW5nW10sIG5vdGVzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2V0VHhOb3Rlcyh0eEhhc2hlcywgbm90ZXMpO1xuICAgIG5vdGVzID0gbm90ZXMubWFwKG5vdGUgPT4gR2VuVXRpbHMuaXNJbml0aWFsaXplZChub3RlKSA/IG5vdGUgOiBcIlwiKTsgLy8gdGhlIGJyaWRnZSB3b3VsZCBzdG9yZSBqc29uIG51bGwgYXMgdGV4dFxuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7IHRoaXMubW9kdWxlLnNldF90eF9ub3Rlcyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHt0eEhhc2hlczogdHhIYXNoZXMsIHR4Tm90ZXM6IG5vdGVzfSkpOyB9XG4gICAgICBjYXRjaCAoZXJyKSB7IHRocm93IG5ldyBNb25lcm9FcnJvcih0aGlzLm1vZHVsZS5nZXRfZXhjZXB0aW9uX21lc3NhZ2UoZXJyKSk7IH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzKGVudHJ5SW5kaWNlcz86IG51bWJlcltdKTogUHJvbWlzZTxNb25lcm9BZGRyZXNzQm9va0VudHJ5W10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEFkZHJlc3NCb29rRW50cmllcyhlbnRyeUluZGljZXMpO1xuICAgIGlmICghZW50cnlJbmRpY2VzKSBlbnRyeUluZGljZXMgPSBbXTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgZW50cmllcyA9IFtdO1xuICAgICAgZm9yIChsZXQgZW50cnlKc29uIG9mIEpTT04ucGFyc2UodGhpcy5tb2R1bGUuZ2V0X2FkZHJlc3NfYm9va19lbnRyaWVzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe2VudHJ5SW5kaWNlczogZW50cnlJbmRpY2VzfSkpKS5lbnRyaWVzKSB7XG4gICAgICAgIGVudHJpZXMucHVzaChuZXcgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeShlbnRyeUpzb24pKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBlbnRyaWVzO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBhZGRBZGRyZXNzQm9va0VudHJ5KGFkZHJlc3M6IHN0cmluZywgZGVzY3JpcHRpb24/OiBzdHJpbmcpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuYWRkQWRkcmVzc0Jvb2tFbnRyeShhZGRyZXNzLCBkZXNjcmlwdGlvbik7XG4gICAgaWYgKCFhZGRyZXNzKSBhZGRyZXNzID0gXCJcIjtcbiAgICBpZiAoIWRlc2NyaXB0aW9uKSBkZXNjcmlwdGlvbiA9IFwiXCI7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLmFkZF9hZGRyZXNzX2Jvb2tfZW50cnkodGhpcy5jcHBBZGRyZXNzLCBhZGRyZXNzLCBkZXNjcmlwdGlvbik7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGVkaXRBZGRyZXNzQm9va0VudHJ5KGluZGV4OiBudW1iZXIsIHNldEFkZHJlc3M6IGJvb2xlYW4sIGFkZHJlc3M6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2V0RGVzY3JpcHRpb246IGJvb2xlYW4sIGRlc2NyaXB0aW9uOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmVkaXRBZGRyZXNzQm9va0VudHJ5KGluZGV4LCBzZXRBZGRyZXNzLCBhZGRyZXNzLCBzZXREZXNjcmlwdGlvbiwgZGVzY3JpcHRpb24pO1xuICAgIGlmICghc2V0QWRkcmVzcykgc2V0QWRkcmVzcyA9IGZhbHNlO1xuICAgIGlmICghYWRkcmVzcykgYWRkcmVzcyA9IFwiXCI7XG4gICAgaWYgKCFzZXREZXNjcmlwdGlvbikgc2V0RGVzY3JpcHRpb24gPSBmYWxzZTtcbiAgICBpZiAoIWRlc2NyaXB0aW9uKSBkZXNjcmlwdGlvbiA9IFwiXCI7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdGhpcy5tb2R1bGUuZWRpdF9hZGRyZXNzX2Jvb2tfZW50cnkodGhpcy5jcHBBZGRyZXNzLCBpbmRleCwgc2V0QWRkcmVzcywgYWRkcmVzcywgc2V0RGVzY3JpcHRpb24sIGRlc2NyaXB0aW9uKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeShlbnRyeUlkeDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5kZWxldGVBZGRyZXNzQm9va0VudHJ5KGVudHJ5SWR4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0aGlzLm1vZHVsZS5kZWxldGVfYWRkcmVzc19ib29rX2VudHJ5KHRoaXMuY3BwQWRkcmVzcywgZW50cnlJZHgpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyB0YWdBY2NvdW50cyh0YWc6IHN0cmluZywgYWNjb3VudEluZGljZXM6IG51bWJlcltdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS50YWdBY2NvdW50cyh0YWcsIGFjY291bnRJbmRpY2VzKTtcbiAgICBpZiAoIXRhZykgdGFnID0gXCJcIjtcbiAgICBpZiAoIWFjY291bnRJbmRpY2VzKSBhY2NvdW50SW5kaWNlcyA9IFtdO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRoaXMubW9kdWxlLnRhZ19hY2NvdW50cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHt0YWc6IHRhZywgYWNjb3VudEluZGljZXM6IGFjY291bnRJbmRpY2VzfSkpO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgdW50YWdBY2NvdW50cyhhY2NvdW50SW5kaWNlczogbnVtYmVyW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnVudGFnQWNjb3VudHMoYWNjb3VudEluZGljZXMpO1xuICAgIGlmICghYWNjb3VudEluZGljZXMpIGFjY291bnRJbmRpY2VzID0gW107XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdGhpcy5tb2R1bGUudGFnX2FjY291bnRzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe2FjY291bnRJbmRpY2VzOiBhY2NvdW50SW5kaWNlc30pKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudFRhZ3MoKTogUHJvbWlzZTxNb25lcm9BY2NvdW50VGFnW10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEFjY291bnRUYWdzKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IGFjY291bnRUYWdzID0gW107XG4gICAgICBmb3IgKGxldCBhY2NvdW50VGFnSnNvbiBvZiBKU09OLnBhcnNlKHRoaXMubW9kdWxlLmdldF9hY2NvdW50X3RhZ3ModGhpcy5jcHBBZGRyZXNzKSkuYWNjb3VudFRhZ3MpIGFjY291bnRUYWdzLnB1c2gobmV3IE1vbmVyb0FjY291bnRUYWcoYWNjb3VudFRhZ0pzb24pKTtcbiAgICAgIHJldHVybiBhY2NvdW50VGFncztcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIHNldEFjY291bnRUYWdMYWJlbCh0YWc6IHN0cmluZywgbGFiZWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2V0QWNjb3VudFRhZ0xhYmVsKHRhZywgbGFiZWwpO1xuICAgIGlmICghdGFnKSB0YWcgPSBcIlwiO1xuICAgIGlmICghbGFiZWwpIGxhYmVsID0gXCJcIjtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0aGlzLm1vZHVsZS5zZXRfYWNjb3VudF90YWdfbGFiZWwodGhpcy5jcHBBZGRyZXNzLCB0YWcsIGxhYmVsKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGF5bWVudFVyaShjb25maWc6IE1vbmVyb1R4Q29uZmlnKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFBheW1lbnRVcmkoY29uZmlnKTtcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnKGNvbmZpZyk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLmdldF9wYXltZW50X3VyaSh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KGNvbmZpZy50b0pzb24oKSkpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBtYWtlIFVSSSBmcm9tIHN1cHBsaWVkIHBhcmFtZXRlcnNcIik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHBhcnNlUGF5bWVudFVyaSh1cmk6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhDb25maWc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnBhcnNlUGF5bWVudFVyaSh1cmkpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBuZXcgTW9uZXJvVHhDb25maWcoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHRoaXMubW9kdWxlLnBhcnNlX3BheW1lbnRfdXJpKHRoaXMuY3BwQWRkcmVzcywgdXJpKSkpKTtcbiAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihlcnIubWVzc2FnZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEF0dHJpYnV0ZShrZXk6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRBdHRyaWJ1dGUoa2V5KTtcbiAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgIGFzc2VydCh0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiLCBcIkF0dHJpYnV0ZSBrZXkgbXVzdCBiZSBhIHN0cmluZ1wiKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgdmFsdWUgPSB0aGlzLm1vZHVsZS5nZXRfYXR0cmlidXRlKHRoaXMuY3BwQWRkcmVzcywga2V5KTtcbiAgICAgIHJldHVybiB2YWx1ZSA9PT0gXCJcIiA/IG51bGwgOiB2YWx1ZTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0QXR0cmlidXRlKGtleTogc3RyaW5nLCB2YWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2V0QXR0cmlidXRlKGtleSwgdmFsKTtcbiAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgIGFzc2VydCh0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiLCBcIkF0dHJpYnV0ZSBrZXkgbXVzdCBiZSBhIHN0cmluZ1wiKTtcbiAgICBhc3NlcnQodHlwZW9mIHZhbCA9PT0gXCJzdHJpbmdcIiwgXCJBdHRyaWJ1dGUgdmFsdWUgbXVzdCBiZSBhIHN0cmluZ1wiKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0aGlzLm1vZHVsZS5zZXRfYXR0cmlidXRlKHRoaXMuY3BwQWRkcmVzcywga2V5LCB2YWwpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzdGFydE1pbmluZyhudW1UaHJlYWRzOiBudW1iZXIsIGJhY2tncm91bmRNaW5pbmc/OiBib29sZWFuLCBpZ25vcmVCYXR0ZXJ5PzogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3RhcnRNaW5pbmcobnVtVGhyZWFkcywgYmFja2dyb3VuZE1pbmluZywgaWdub3JlQmF0dGVyeSk7XG4gICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICBsZXQgZGFlbW9uID0gYXdhaXQgTW9uZXJvRGFlbW9uUnBjLmNvbm5lY3RUb0RhZW1vblJwYyhhd2FpdCB0aGlzLmdldERhZW1vbkNvbm5lY3Rpb24oKSk7XG4gICAgYXdhaXQgZGFlbW9uLnN0YXJ0TWluaW5nKGF3YWl0IHRoaXMuZ2V0UHJpbWFyeUFkZHJlc3MoKSwgbnVtVGhyZWFkcywgYmFja2dyb3VuZE1pbmluZywgaWdub3JlQmF0dGVyeSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0b3BNaW5pbmcoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zdG9wTWluaW5nKCk7XG4gICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICBsZXQgZGFlbW9uID0gYXdhaXQgTW9uZXJvRGFlbW9uUnBjLmNvbm5lY3RUb0RhZW1vblJwYyhhd2FpdCB0aGlzLmdldERhZW1vbkNvbm5lY3Rpb24oKSk7XG4gICAgYXdhaXQgZGFlbW9uLnN0b3BNaW5pbmcoKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmlzTXVsdGlzaWdJbXBvcnROZWVkZWQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gdGhpcy5tb2R1bGUuaXNfbXVsdGlzaWdfaW1wb3J0X25lZWRlZCh0aGlzLmNwcEFkZHJlc3MpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBpc011bHRpc2lnKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaXNNdWx0aXNpZygpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5pc19tdWx0aXNpZyh0aGlzLmNwcEFkZHJlc3MpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRNdWx0aXNpZ0luZm8oKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luZm8+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldE11bHRpc2lnSW5mbygpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgTW9uZXJvTXVsdGlzaWdJbmZvKEpTT04ucGFyc2UodGhpcy5tb2R1bGUuZ2V0X211bHRpc2lnX2luZm8odGhpcy5jcHBBZGRyZXNzKSkpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBwcmVwYXJlTXVsdGlzaWcoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnByZXBhcmVNdWx0aXNpZygpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5wcmVwYXJlX211bHRpc2lnKHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIG1ha2VNdWx0aXNpZyhtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgdGhyZXNob2xkOiBudW1iZXIsIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkubWFrZU11bHRpc2lnKG11bHRpc2lnSGV4ZXMsIHRocmVzaG9sZCwgcGFzc3dvcmQpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLm1ha2VfbXVsdGlzaWcodGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7bXVsdGlzaWdIZXhlczogbXVsdGlzaWdIZXhlcywgdGhyZXNob2xkOiB0aHJlc2hvbGQsIHBhc3N3b3JkOiBwYXNzd29yZH0pLCAocmVzcCkgPT4ge1xuICAgICAgICAgIGxldCBlcnJvcktleSA9IFwiZXJyb3I6IFwiO1xuICAgICAgICAgIGlmIChyZXNwLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3Auc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCkpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGV4Y2hhbmdlTXVsdGlzaWdLZXlzKG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdLCBwYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmV4Y2hhbmdlTXVsdGlzaWdLZXlzKG11bHRpc2lnSGV4ZXMsIHBhc3N3b3JkKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5leGNoYW5nZV9tdWx0aXNpZ19rZXlzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe211bHRpc2lnSGV4ZXM6IG11bHRpc2lnSGV4ZXMsIHBhc3N3b3JkOiBwYXNzd29yZH0pLCAocmVzcCkgPT4ge1xuICAgICAgICAgIGxldCBlcnJvcktleSA9IFwiZXJyb3I6IFwiO1xuICAgICAgICAgIGlmIChyZXNwLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3Auc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCkpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdChKU09OLnBhcnNlKHJlc3ApKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydE11bHRpc2lnSGV4KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5leHBvcnRNdWx0aXNpZ0hleCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5leHBvcnRfbXVsdGlzaWdfaGV4KHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGltcG9ydE11bHRpc2lnSGV4KG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdLCByZWZyZXNoQWZ0ZXJJbXBvcnQ/OiBib29sZWFuKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAocmVmcmVzaEFmdGVySW1wb3J0ID09PSB1bmRlZmluZWQpIHJlZnJlc2hBZnRlckltcG9ydCA9IHRydWU7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pbXBvcnRNdWx0aXNpZ0hleChtdWx0aXNpZ0hleGVzLCByZWZyZXNoQWZ0ZXJJbXBvcnQpO1xuICAgIGlmICghR2VuVXRpbHMuaXNBcnJheShtdWx0aXNpZ0hleGVzKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIHN0cmluZ1tdIHRvIGltcG9ydE11bHRpc2lnSGV4KClcIilcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5pbXBvcnRfbXVsdGlzaWdfaGV4KHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe211bHRpc2lnSGV4ZXM6IG11bHRpc2lnSGV4ZXMsIHJlZnJlc2hBZnRlckltcG9ydDogcmVmcmVzaEFmdGVySW1wb3J0fSksIChyZXNwKSA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiByZXNwID09PSBcInN0cmluZ1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNpZ25NdWx0aXNpZ1R4SGV4KG11bHRpc2lnVHhIZXg6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zaWduTXVsdGlzaWdUeEhleChtdWx0aXNpZ1R4SGV4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5zaWduX211bHRpc2lnX3R4X2hleCh0aGlzLmNwcEFkZHJlc3MsIG11bHRpc2lnVHhIZXgsIChyZXNwKSA9PiB7XG4gICAgICAgICAgaWYgKHJlc3AuY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcCkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0KEpTT04ucGFyc2UocmVzcCkpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc3VibWl0TXVsdGlzaWdUeEhleChzaWduZWRNdWx0aXNpZ1R4SGV4OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zdWJtaXRNdWx0aXNpZ1R4SGV4KHNpZ25lZE11bHRpc2lnVHhIZXgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnN1Ym1pdF9tdWx0aXNpZ190eF9oZXgodGhpcy5jcHBBZGRyZXNzLCBzaWduZWRNdWx0aXNpZ1R4SGV4LCAocmVzcCkgPT4ge1xuICAgICAgICAgIGlmIChyZXNwLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoSlNPTi5wYXJzZShyZXNwKS50eEhhc2hlcyk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIGtleXMgYW5kIGNhY2hlIGRhdGEuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPERhdGFWaWV3W10+fSBpcyB0aGUga2V5cyBhbmQgY2FjaGUgZGF0YSwgcmVzcGVjdGl2ZWx5XG4gICAqL1xuICBhc3luYyBnZXREYXRhKCk6IFByb21pc2U8RGF0YVZpZXdbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0RGF0YSgpO1xuICAgIFxuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLmdldERhdGFXYXNtKCk7XG4gICAgfSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgZ2V0RGF0YVdhc20oKTogRGF0YVZpZXdbXSB7XG4gICAgbGV0IHZpZXdPbmx5ID0gdGhpcy5tb2R1bGUuaXNfdmlld19vbmx5KHRoaXMuY3BwQWRkcmVzcyk7XG5cbiAgICAvLyBzdG9yZSB2aWV3cyBpbiBhcnJheVxuICAgIGxldCB2aWV3cyA9IFtdO1xuXG4gICAgLy8gbWFsbG9jIGNhY2hlIGJ1ZmZlciBhbmQgZ2V0IGJ1ZmZlciBsb2NhdGlvbiBpbiBjKysgaGVhcFxuICAgIGxldCBjYWNoZUJ1ZmZlckxvYyA9IEpTT04ucGFyc2UodGhpcy5tb2R1bGUuZ2V0X2NhY2hlX2ZpbGVfYnVmZmVyKHRoaXMuY3BwQWRkcmVzcykpO1xuXG4gICAgLy8gcmVhZCBiaW5hcnkgZGF0YSBmcm9tIGhlYXAgdG8gRGF0YVZpZXdcbiAgICBsZXQgdmlldyA9IG5ldyBEYXRhVmlldyhuZXcgQXJyYXlCdWZmZXIoY2FjaGVCdWZmZXJMb2MubGVuZ3RoKSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjYWNoZUJ1ZmZlckxvYy5sZW5ndGg7IGkrKykge1xuICAgICAgdmlldy5zZXRJbnQ4KGksIHRoaXMubW9kdWxlLkhFQVBVOFtjYWNoZUJ1ZmZlckxvYy5wb2ludGVyIC8gVWludDhBcnJheS5CWVRFU19QRVJfRUxFTUVOVCArIGldKTtcbiAgICB9XG5cbiAgICAvLyBmcmVlIGJpbmFyeSBvbiBoZWFwXG4gICAgdGhpcy5tb2R1bGUuX2ZyZWUoY2FjaGVCdWZmZXJMb2MucG9pbnRlcik7XG5cbiAgICAvLyB3cml0ZSBjYWNoZSBmaWxlXG4gICAgdmlld3MucHVzaChCdWZmZXIuZnJvbSh2aWV3LmJ1ZmZlcikpO1xuXG4gICAgLy8gbWFsbG9jIGtleXMgYnVmZmVyIGFuZCBnZXQgYnVmZmVyIGxvY2F0aW9uIGluIGMrKyBoZWFwXG4gICAgbGV0IGtleXNCdWZmZXJMb2MgPSBKU09OLnBhcnNlKHRoaXMubW9kdWxlLmdldF9rZXlzX2ZpbGVfYnVmZmVyKHRoaXMuY3BwQWRkcmVzcywgdGhpcy5wYXNzd29yZCwgdmlld09ubHkpKTtcblxuICAgIC8vIHJlYWQgYmluYXJ5IGRhdGEgZnJvbSBoZWFwIHRvIERhdGFWaWV3XG4gICAgdmlldyA9IG5ldyBEYXRhVmlldyhuZXcgQXJyYXlCdWZmZXIoa2V5c0J1ZmZlckxvYy5sZW5ndGgpKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXNCdWZmZXJMb2MubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZpZXcuc2V0SW50OChpLCB0aGlzLm1vZHVsZS5IRUFQVThba2V5c0J1ZmZlckxvYy5wb2ludGVyIC8gVWludDhBcnJheS5CWVRFU19QRVJfRUxFTUVOVCArIGldKTtcbiAgICB9XG5cbiAgICAvLyBmcmVlIGJpbmFyeSBvbiBoZWFwXG4gICAgdGhpcy5tb2R1bGUuX2ZyZWUoa2V5c0J1ZmZlckxvYy5wb2ludGVyKTtcblxuICAgIC8vIHByZXBlbmQga2V5cyBmaWxlXG4gICAgdmlld3MudW5zaGlmdChCdWZmZXIuZnJvbSh2aWV3LmJ1ZmZlcikpO1xuICAgIHJldHVybiB2aWV3cztcbiAgfVxuXG4gIGFzeW5jIGNoYW5nZVBhc3N3b3JkKG9sZFBhc3N3b3JkOiBzdHJpbmcsIG5ld1Bhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmNoYW5nZVBhc3N3b3JkKG9sZFBhc3N3b3JkLCBuZXdQYXNzd29yZCk7XG4gICAgaWYgKG9sZFBhc3N3b3JkICE9PSB0aGlzLnBhc3N3b3JkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJJbnZhbGlkIG9yaWdpbmFsIHBhc3N3b3JkLlwiKTsgLy8gd2FsbGV0MiB2ZXJpZnlfcGFzc3dvcmQgbG9hZHMgZnJvbSBkaXNrIHNvIHZlcmlmeSBwYXNzd29yZCBoZXJlXG4gICAgaWYgKG5ld1Bhc3N3b3JkID09PSB1bmRlZmluZWQpIG5ld1Bhc3N3b3JkID0gXCJcIjtcbiAgICBhd2FpdCB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmNoYW5nZV93YWxsZXRfcGFzc3dvcmQodGhpcy5jcHBBZGRyZXNzLCBvbGRQYXNzd29yZCwgbmV3UGFzc3dvcmQsIChlcnJNc2cpID0+IHtcbiAgICAgICAgICBpZiAoZXJyTXNnKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKGVyck1zZykpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHRoaXMucGFzc3dvcmQgPSBuZXdQYXNzd29yZDtcbiAgICBpZiAodGhpcy5wYXRoKSBhd2FpdCB0aGlzLnNhdmUoKTsgLy8gYXV0byBzYXZlXG4gIH1cbiAgXG4gIGFzeW5jIHNhdmUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zYXZlKCk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuc2F2ZSh0aGlzKTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGNsb3NlSW50ZXJuYWwoc2F2ZTogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLndhbGxldFByb3h5KSB7XG4gICAgICBhd2FpdCBzdXBlci5jbG9zZUludGVybmFsKHNhdmUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLnByZXBhcmVDbG9zZSgpO1xuICAgIGlmIChzYXZlKSB7XG4gICAgICBhd2FpdCBMaWJyYXJ5VXRpbHMucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3Qgc25hcHNob3QgPSBhd2FpdCB0aGlzLmdldENsb3NlRGF0YSgpO1xuICAgICAgICBhd2FpdCBNb25lcm9XYWxsZXRGdWxsLndyaXRlV2FsbGV0RGF0YSh0aGlzLCBzbmFwc2hvdC5kYXRhLCBzbmFwc2hvdC5wcmltYXJ5QWRkcmVzcyk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgYXdhaXQgc3VwZXIuY2xvc2VJbnRlcm5hbChmYWxzZSwgdGhpcy53YXNtTGlzdGVuZXJIYW5kbGUpO1xuICAgIHRoaXMud2FzbUxpc3RlbmVySGFuZGxlID0gMDtcbiAgICBkZWxldGUgdGhpcy5wYXRoO1xuICAgIGRlbGV0ZSB0aGlzLnBhc3N3b3JkO1xuICAgIGRlbGV0ZSB0aGlzLndhc21MaXN0ZW5lcjtcbiAgICBMaWJyYXJ5VXRpbHMuc2V0UmVqZWN0VW5hdXRob3JpemVkRm4odGhpcy5yZWplY3RVbmF1dGhvcml6ZWRDb25maWdJZCwgdW5kZWZpbmVkKTsgLy8gdW5yZWdpc3RlciBmbiBpbmZvcm1pbmcgaWYgdW5hdXRob3JpemVkIHJlcXMgc2hvdWxkIGJlIHJlamVjdGVkXG4gIH1cblxuICAvLyBjYW5jZWwgb3V0c2lkZSB0aGUgbW9kdWxlIHF1ZXVlIHNvIGEgYmxvY2tlZCByZXF1ZXN0IGNhbiByZWxlYXNlIGl0XG4gIHByb3RlY3RlZCBhc3luYyBwcmVwYXJlQ2xvc2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5faXNDbG9zZWQgPSB0cnVlO1xuICAgIGlmICh0aGlzLnN5bmNMb29wZXIpIHRoaXMuc3luY0xvb3Blci5zdG9wKCk7XG4gICAgdGhpcy5tb2R1bGUuX3JlcXVlc3Rfd2FsbGV0X3NodXRkb3duKHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgaWYgKHRoaXMuY29ubmVjdGlvbk1hbmFnZXIgJiYgdGhpcy5jb25uZWN0aW9uTWFuYWdlci5nZXRMaXN0ZW5lcnMoKS5pbmNsdWRlcyh0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIpKSB0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyLnJlbW92ZUxpc3RlbmVyKHRoaXMuY29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lcik7XG4gICAgdGhpcy5jb25uZWN0aW9uTWFuYWdlciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIgPSB1bmRlZmluZWQ7XG4gICAgYXdhaXQgUHJvbWlzZS5hbGwoQXJyYXkuZnJvbSh0aGlzLnN5bmNDYWxscywgY2FsbCA9PiBjYWxsLmNhdGNoKCgpID0+IHt9KSkpO1xuICAgIGF3YWl0IHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7fSk7XG4gIH1cblxuICAvLyBzZXJpYWxpemUgYSBzdG9wcGVkIHdhbGxldCBmb3Igc2F2aW5nIG9uIHRoaXMgdGhyZWFkIG9yIHRoZSB3b3JrZXIncyBjYWxsZXJcbiAgcHJvdGVjdGVkIGFzeW5jIGdldENsb3NlRGF0YSgpIHtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+ICh7XG4gICAgICBkYXRhOiB0aGlzLmdldERhdGFXYXNtKCksXG4gICAgICBwcmltYXJ5QWRkcmVzczogdGhpcy5tb2R1bGUuZ2V0X2FkZHJlc3ModGhpcy5jcHBBZGRyZXNzLCAwLCAwKVxuICAgIH0pKTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tIEFERCBKU0RPQyBGT1IgU1VQUE9SVEVEIERFRkFVTFQgSU1QTEVNRU5UQVRJT05TIC0tLS0tLS0tLS0tLS0tXG4gIFxuICBhc3luYyBnZXROdW1CbG9ja3NUb1VubG9jaygpOiBQcm9taXNlPG51bWJlcltdfHVuZGVmaW5lZD4geyByZXR1cm4gc3VwZXIuZ2V0TnVtQmxvY2tzVG9VbmxvY2soKTsgfVxuICBhc3luYyBnZXRUeCh0eEhhc2g6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhXYWxsZXR8dW5kZWZpbmVkPiB7IHJldHVybiBzdXBlci5nZXRUeCh0eEhhc2gpOyB9XG4gIGFzeW5jIGdldEluY29taW5nVHJhbnNmZXJzKHF1ZXJ5OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KTogUHJvbWlzZTxNb25lcm9JbmNvbWluZ1RyYW5zZmVyW10+IHsgcmV0dXJuIHN1cGVyLmdldEluY29taW5nVHJhbnNmZXJzKHF1ZXJ5KTsgfVxuICBhc3luYyBnZXRPdXRnb2luZ1RyYW5zZmVycyhxdWVyeTogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5PikgeyByZXR1cm4gc3VwZXIuZ2V0T3V0Z29pbmdUcmFuc2ZlcnMocXVlcnkpOyB9XG4gIGFzeW5jIGNyZWF0ZVR4KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7IHJldHVybiBzdXBlci5jcmVhdGVUeChjb25maWcpOyB9XG4gIGFzeW5jIHJlbGF5VHgodHhPck1ldGFkYXRhOiBNb25lcm9UeFdhbGxldCB8IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7IHJldHVybiBzdXBlci5yZWxheVR4KHR4T3JNZXRhZGF0YSk7IH1cbiAgYXN5bmMgZ2V0VHhOb3RlKHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHsgcmV0dXJuIHN1cGVyLmdldFR4Tm90ZSh0eEhhc2gpOyB9XG4gIGFzeW5jIHNldFR4Tm90ZSh0eEhhc2g6IHN0cmluZywgbm90ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7IHJldHVybiBzdXBlci5zZXRUeE5vdGUodHhIYXNoLCBub3RlKTsgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIEhFTFBFUlMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgb3BlbldhbGxldERhdGEoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pIHtcbiAgICBpZiAoY29uZmlnLnByb3h5VG9Xb3JrZXIpIHtcbiAgICAgIGxldCB3YWxsZXRQcm94eSA9IGF3YWl0IE1vbmVyb1dhbGxldEZ1bGxQcm94eS5vcGVuV2FsbGV0RGF0YShjb25maWcpO1xuICAgICAgcmV0dXJuIG5ldyBNb25lcm9XYWxsZXRGdWxsKHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHdhbGxldFByb3h5KTtcbiAgICB9XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgYW5kIG5vcm1hbGl6ZSBwYXJhbWV0ZXJzXG4gICAgaWYgKGNvbmZpZy5uZXR3b3JrVHlwZSA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgdGhlIHdhbGxldCdzIG5ldHdvcmsgdHlwZVwiKTtcbiAgICBjb25maWcubmV0d29ya1R5cGUgPSBNb25lcm9OZXR3b3JrVHlwZS5mcm9tKGNvbmZpZy5uZXR3b3JrVHlwZSk7XG4gICAgbGV0IGRhZW1vbkNvbm5lY3Rpb24gPSBjb25maWcuZ2V0U2VydmVyKCk7XG4gICAgbGV0IGRhZW1vblVyaSA9IGRhZW1vbkNvbm5lY3Rpb24gJiYgZGFlbW9uQ29ubmVjdGlvbi5nZXRVcmkoKSA/IGRhZW1vbkNvbm5lY3Rpb24uZ2V0VXJpKCkgOiBcIlwiO1xuICAgIGxldCBkYWVtb25Vc2VybmFtZSA9IGRhZW1vbkNvbm5lY3Rpb24gJiYgZGFlbW9uQ29ubmVjdGlvbi5nZXRVc2VybmFtZSgpID8gZGFlbW9uQ29ubmVjdGlvbi5nZXRVc2VybmFtZSgpIDogXCJcIjtcbiAgICBsZXQgZGFlbW9uUGFzc3dvcmQgPSBkYWVtb25Db25uZWN0aW9uICYmIGRhZW1vbkNvbm5lY3Rpb24uZ2V0UGFzc3dvcmQoKSA/IGRhZW1vbkNvbm5lY3Rpb24uZ2V0UGFzc3dvcmQoKSA6IFwiXCI7XG4gICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZCA9IGRhZW1vbkNvbm5lY3Rpb24gPyBkYWVtb25Db25uZWN0aW9uLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdHJ1ZTtcbiAgICBcbiAgICAvLyBsb2FkIHdhc20gbW9kdWxlXG4gICAgbGV0IG1vZHVsZSA9IGF3YWl0IExpYnJhcnlVdGlscy5sb2FkV2FzbU1vZHVsZSgpO1xuICAgIFxuICAgIC8vIG9wZW4gd2FsbGV0IGluIHF1ZXVlXG4gICAgcmV0dXJuIG1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIHJlZ2lzdGVyIGZuIGluZm9ybWluZyBpZiB1bmF1dGhvcml6ZWQgcmVxcyBzaG91bGQgYmUgcmVqZWN0ZWRcbiAgICAgICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZEZuSWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5zZXRSZWplY3RVbmF1dGhvcml6ZWRGbihyZWplY3RVbmF1dGhvcml6ZWRGbklkLCAoKSA9PiByZWplY3RVbmF1dGhvcml6ZWQpO1xuICAgICAgXG4gICAgICAgIC8vIGNyZWF0ZSB3YWxsZXQgaW4gd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICBtb2R1bGUub3Blbl93YWxsZXRfZnVsbChjb25maWcucGFzc3dvcmQsIGNvbmZpZy5uZXR3b3JrVHlwZSwgY29uZmlnLmtleXNEYXRhID8/IFwiXCIsIGNvbmZpZy5jYWNoZURhdGEgPz8gXCJcIiwgZGFlbW9uVXJpLCBkYWVtb25Vc2VybmFtZSwgZGFlbW9uUGFzc3dvcmQsIHJlamVjdFVuYXV0aG9yaXplZEZuSWQsIGNvbmZpZy5nZXRSZWd0ZXN0KCkgPT09IHVuZGVmaW5lZCA/IGZhbHNlIDogY29uZmlnLmdldFJlZ3Rlc3QoKSwgKGNwcEFkZHJlc3MpID0+IHtcbiAgICAgICAgICBpZiAodHlwZW9mIGNwcEFkZHJlc3MgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoY3BwQWRkcmVzcykpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvV2FsbGV0RnVsbChjcHBBZGRyZXNzLCBjb25maWcucGF0aCwgY29uZmlnLnBhc3N3b3JkLCBjb25maWcuZnMsIHJlamVjdFVuYXV0aG9yaXplZCwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcHJvdGVjdGVkIGdldFdhbGxldFByb3h5KCk6IE1vbmVyb1dhbGxldEZ1bGxQcm94eSB7XG4gICAgcmV0dXJuIHN1cGVyLmdldFdhbGxldFByb3h5KCkgYXMgTW9uZXJvV2FsbGV0RnVsbFByb3h5O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgYmFja2dyb3VuZFN5bmMoKSB7XG4gICAgbGV0IGxhYmVsID0gdGhpcy5wYXRoID8gdGhpcy5wYXRoIDogKHRoaXMuYnJvd3Nlck1haW5QYXRoID8gdGhpcy5icm93c2VyTWFpblBhdGggOiBcImluLW1lbW9yeSB3YWxsZXRcIik7IC8vIGxhYmVsIGZvciBsb2dcbiAgICBMaWJyYXJ5VXRpbHMubG9nKDEsIFwiQmFja2dyb3VuZCBzeW5jaHJvbml6aW5nIFwiICsgbGFiZWwpO1xuICAgIHRyeSB7IGF3YWl0IHRoaXMuc3luYygpOyB9XG4gICAgY2F0Y2ggKGVycjogYW55KSB7IGlmICghdGhpcy5faXNDbG9zZWQpIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gYmFja2dyb3VuZCBzeW5jaHJvbml6ZSBcIiArIGxhYmVsICsgXCI6IFwiICsgZXJyLm1lc3NhZ2UpOyB9XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyByZWZyZXNoTGlzdGVuaW5nKCkge1xuICAgIGlmICh0aGlzLl9pc0Nsb3NlZCkgcmV0dXJuO1xuICAgIGxldCBpc0VuYWJsZWQgPSB0aGlzLmxpc3RlbmVycy5sZW5ndGggPiAwO1xuICAgIGlmICh0aGlzLndhc21MaXN0ZW5lckhhbmRsZSA9PT0gMCAmJiAhaXNFbmFibGVkIHx8IHRoaXMud2FzbUxpc3RlbmVySGFuZGxlID4gMCAmJiBpc0VuYWJsZWQpIHJldHVybjsgLy8gbm8gZGlmZmVyZW5jZVxuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuX2lzQ2xvc2VkKSByZXR1cm47XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5zZXRfbGlzdGVuZXIoXG4gICAgICAgICAgdGhpcy5jcHBBZGRyZXNzLFxuICAgICAgICAgIHRoaXMud2FzbUxpc3RlbmVySGFuZGxlLFxuICAgICAgICAgICAgbmV3TGlzdGVuZXJIYW5kbGUgPT4ge1xuICAgICAgICAgICAgICBpZiAodHlwZW9mIG5ld0xpc3RlbmVySGFuZGxlID09PSBcInN0cmluZ1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKG5ld0xpc3RlbmVySGFuZGxlKSk7XG4gICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMud2FzbUxpc3RlbmVySGFuZGxlID0gbmV3TGlzdGVuZXJIYW5kbGU7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXNFbmFibGVkID8gYXN5bmMgKGhlaWdodCwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgcGVyY2VudERvbmUsIG1lc3NhZ2UpID0+IGF3YWl0IHRoaXMud2FzbUxpc3RlbmVyLm9uU3luY1Byb2dyZXNzKGhlaWdodCwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgcGVyY2VudERvbmUsIG1lc3NhZ2UpIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgaXNFbmFibGVkID8gYXN5bmMgKGhlaWdodCkgPT4gYXdhaXQgdGhpcy53YXNtTGlzdGVuZXIub25OZXdCbG9jayhoZWlnaHQpIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgaXNFbmFibGVkID8gYXN5bmMgKG5ld0JhbGFuY2VTdHIsIG5ld1VubG9ja2VkQmFsYW5jZVN0cikgPT4gYXdhaXQgdGhpcy53YXNtTGlzdGVuZXIub25CYWxhbmNlc0NoYW5nZWQobmV3QmFsYW5jZVN0ciwgbmV3VW5sb2NrZWRCYWxhbmNlU3RyKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGlzRW5hYmxlZCA/IGFzeW5jIChoZWlnaHQsIHR4SGFzaCwgYW1vdW50U3RyLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4LCB2ZXJzaW9uLCB1bmxvY2tUaW1lLCBpc0xvY2tlZCkgPT4gYXdhaXQgdGhpcy53YXNtTGlzdGVuZXIub25PdXRwdXRSZWNlaXZlZChoZWlnaHQsIHR4SGFzaCwgYW1vdW50U3RyLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4LCB2ZXJzaW9uLCB1bmxvY2tUaW1lLCBpc0xvY2tlZCkgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBpc0VuYWJsZWQgPyBhc3luYyAoaGVpZ2h0LCB0eEhhc2gsIGFtb3VudFN0ciwgYWNjb3VudElkeFN0ciwgc3ViYWRkcmVzc0lkeFN0ciwgdmVyc2lvbiwgdW5sb2NrVGltZSwgaXNMb2NrZWQpID0+IGF3YWl0IHRoaXMud2FzbUxpc3RlbmVyLm9uT3V0cHV0U3BlbnQoaGVpZ2h0LCB0eEhhc2gsIGFtb3VudFN0ciwgYWNjb3VudElkeFN0ciwgc3ViYWRkcmVzc0lkeFN0ciwgdmVyc2lvbiwgdW5sb2NrVGltZSwgaXNMb2NrZWQpIDogdW5kZWZpbmVkLFxuICAgICAgICApO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIHN0YXRpYyBzYW5pdGl6ZUJsb2NrKGJsb2NrKSB7XG4gICAgZm9yIChsZXQgdHggb2YgYmxvY2suZ2V0VHhzKCkpIE1vbmVyb1dhbGxldEZ1bGwuc2FuaXRpemVUeFdhbGxldCh0eCk7XG4gICAgcmV0dXJuIGJsb2NrO1xuICB9XG4gIFxuICBzdGF0aWMgc2FuaXRpemVUeFdhbGxldCh0eCkge1xuICAgIGFzc2VydCh0eCBpbnN0YW5jZW9mIE1vbmVyb1R4V2FsbGV0KTtcbiAgICByZXR1cm4gdHg7XG4gIH1cbiAgXG4gIHN0YXRpYyBzYW5pdGl6ZUFjY291bnQoYWNjb3VudCkge1xuICAgIGlmIChhY2NvdW50LmdldFN1YmFkZHJlc3NlcygpKSB7XG4gICAgICBmb3IgKGxldCBzdWJhZGRyZXNzIG9mIGFjY291bnQuZ2V0U3ViYWRkcmVzc2VzKCkpIE1vbmVyb1dhbGxldEtleXMuc2FuaXRpemVTdWJhZGRyZXNzKHN1YmFkZHJlc3MpO1xuICAgIH1cbiAgICByZXR1cm4gYWNjb3VudDtcbiAgfVxuICBcbiAgc3RhdGljIGRlc2VyaWFsaXplQmxvY2tzKGJsb2Nrc0pzb25TdHIpIHtcbiAgICBsZXQgYmxvY2tzSnNvbiA9IEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhibG9ja3NKc29uU3RyKSk7XG4gICAgbGV0IGRlc2VyaWFsaXplZEJsb2NrczogYW55ID0ge307XG4gICAgZGVzZXJpYWxpemVkQmxvY2tzLmJsb2NrcyA9IFtdO1xuICAgIGlmIChibG9ja3NKc29uLmJsb2NrcykgZm9yIChsZXQgYmxvY2tKc29uIG9mIGJsb2Nrc0pzb24uYmxvY2tzKSBkZXNlcmlhbGl6ZWRCbG9ja3MuYmxvY2tzLnB1c2goTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZUJsb2NrKG5ldyBNb25lcm9CbG9jayhibG9ja0pzb24sIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFhfV0FMTEVUKSkpO1xuICAgIHJldHVybiBkZXNlcmlhbGl6ZWRCbG9ja3M7XG4gIH1cbiAgXG4gIHN0YXRpYyBkZXNlcmlhbGl6ZVR4cyhxdWVyeSwgYmxvY2tzSnNvblN0cikge1xuICAgIFxuICAgIC8vIGRlc2VyaWFsaXplIGJsb2Nrc1xuICAgIGxldCBkZXNlcmlhbGl6ZWRCbG9ja3MgPSBNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplQmxvY2tzKGJsb2Nrc0pzb25TdHIpO1xuICAgIGxldCBibG9ja3MgPSBkZXNlcmlhbGl6ZWRCbG9ja3MuYmxvY2tzO1xuICAgIFxuICAgIC8vIGNvbGxlY3QgdHhzXG4gICAgbGV0IHR4cyA9IFtdO1xuICAgIGZvciAobGV0IGJsb2NrIG9mIGJsb2Nrcykge1xuICAgICAgTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZUJsb2NrKGJsb2NrKTtcbiAgICAgIGZvciAobGV0IHR4IG9mIGJsb2NrLmdldFR4cygpKSB7XG4gICAgICAgIGlmIChibG9jay5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRCbG9jayh1bmRlZmluZWQpOyAvLyBkZXJlZmVyZW5jZSBwbGFjZWhvbGRlciBibG9jayBmb3IgdW5jb25maXJtZWQgdHhzXG4gICAgICAgIHR4cy5wdXNoKHR4KTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gcmUtc29ydCB0eHMgd2hpY2ggaXMgbG9zdCBvdmVyIHdhc20gc2VyaWFsaXphdGlvbiAgLy8gVE9ETzogY29uZmlybSB0aGF0IG9yZGVyIGlzIGxvc3RcbiAgICBpZiAocXVlcnkuZ2V0SGFzaGVzKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbGV0IHR4TWFwID0gbmV3IE1hcCgpO1xuICAgICAgZm9yIChsZXQgdHggb2YgdHhzKSB0eE1hcFt0eC5nZXRIYXNoKCldID0gdHg7XG4gICAgICBsZXQgdHhzU29ydGVkID0gW107XG4gICAgICBmb3IgKGxldCB0eEhhc2ggb2YgcXVlcnkuZ2V0SGFzaGVzKCkpIGlmICh0eE1hcFt0eEhhc2hdICE9PSB1bmRlZmluZWQpIHR4c1NvcnRlZC5wdXNoKHR4TWFwW3R4SGFzaF0pO1xuICAgICAgdHhzID0gdHhzU29ydGVkO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdHhzO1xuICB9XG4gIFxuICBzdGF0aWMgZGVzZXJpYWxpemVUcmFuc2ZlcnMocXVlcnksIGJsb2Nrc0pzb25TdHIpIHtcbiAgICBcbiAgICAvLyBkZXNlcmlhbGl6ZSBibG9ja3NcbiAgICBsZXQgZGVzZXJpYWxpemVkQmxvY2tzID0gTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZUJsb2NrcyhibG9ja3NKc29uU3RyKTtcbiAgICBsZXQgYmxvY2tzID0gZGVzZXJpYWxpemVkQmxvY2tzLmJsb2NrcztcbiAgICBcbiAgICAvLyBjb2xsZWN0IHRyYW5zZmVyc1xuICAgIGxldCB0cmFuc2ZlcnMgPSBbXTtcbiAgICBmb3IgKGxldCBibG9jayBvZiBibG9ja3MpIHtcbiAgICAgIGZvciAobGV0IHR4IG9mIGJsb2NrLmdldFR4cygpKSB7XG4gICAgICAgIGlmIChibG9jay5nZXRIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSB0eC5zZXRCbG9jayh1bmRlZmluZWQpOyAvLyBkZXJlZmVyZW5jZSBwbGFjZWhvbGRlciBibG9jayBmb3IgdW5jb25maXJtZWQgdHhzXG4gICAgICAgIGlmICh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkgIT09IHVuZGVmaW5lZCkgdHJhbnNmZXJzLnB1c2godHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpKTtcbiAgICAgICAgaWYgKHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGZvciAobGV0IHRyYW5zZmVyIG9mIHR4LmdldEluY29taW5nVHJhbnNmZXJzKCkpIHRyYW5zZmVycy5wdXNoKHRyYW5zZmVyKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdHJhbnNmZXJzO1xuICB9XG4gIFxuICBzdGF0aWMgZGVzZXJpYWxpemVPdXRwdXRzKHF1ZXJ5LCBibG9ja3NKc29uU3RyKSB7XG4gICAgXG4gICAgLy8gZGVzZXJpYWxpemUgYmxvY2tzXG4gICAgbGV0IGRlc2VyaWFsaXplZEJsb2NrcyA9IE1vbmVyb1dhbGxldEZ1bGwuZGVzZXJpYWxpemVCbG9ja3MoYmxvY2tzSnNvblN0cik7XG4gICAgbGV0IGJsb2NrcyA9IGRlc2VyaWFsaXplZEJsb2Nrcy5ibG9ja3M7XG4gICAgXG4gICAgLy8gY29sbGVjdCBvdXRwdXRzXG4gICAgbGV0IG91dHB1dHMgPSBbXTtcbiAgICBmb3IgKGxldCBibG9jayBvZiBibG9ja3MpIHtcbiAgICAgIGZvciAobGV0IHR4IG9mIGJsb2NrLmdldFR4cygpKSB7XG4gICAgICAgIGZvciAobGV0IG91dHB1dCBvZiB0eC5nZXRPdXRwdXRzKCkpIG91dHB1dHMucHVzaChvdXRwdXQpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gb3V0cHV0cztcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNldCB0aGUgcGF0aCBvZiB0aGUgd2FsbGV0IG9uIHRoZSBicm93c2VyIG1haW4gdGhyZWFkIGlmIHJ1biBhcyBhIHdvcmtlci5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBicm93c2VyTWFpblBhdGggLSBwYXRoIG9mIHRoZSB3YWxsZXQgb24gdGhlIGJyb3dzZXIgbWFpbiB0aHJlYWRcbiAgICovXG4gIHByb3RlY3RlZCBzZXRCcm93c2VyTWFpblBhdGgoYnJvd3Nlck1haW5QYXRoKSB7XG4gICAgdGhpcy5icm93c2VyTWFpblBhdGggPSBicm93c2VyTWFpblBhdGg7XG4gIH1cbiAgXG4gIHN0YXRpYyBhc3luYyBtb3ZlVG8ocGF0aCwgd2FsbGV0KSB7XG5cbiAgICAvLyBzYXZlIGFuZCByZXR1cm4gaWYgc2FtZSBwYXRoXG4gICAgaWYgKFBhdGgubm9ybWFsaXplKHdhbGxldC5wYXRoKSA9PT0gUGF0aC5ub3JtYWxpemUocGF0aCkpIHtcbiAgICAgIHJldHVybiB3YWxsZXQuc2F2ZSgpO1xuICAgIH1cblxuICAgIHJldHVybiBMaWJyYXJ5VXRpbHMucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIGlmIChhd2FpdCB3YWxsZXQuaXNDbG9zZWQoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGlzIGNsb3NlZFwiKTtcbiAgICAgIGlmICghcGF0aCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIHBhdGggb2YgZGVzdGluYXRpb24gd2FsbGV0XCIpO1xuXG4gICAgICAvLyBjcmVhdGUgZGVzdGluYXRpb24gZGlyZWN0b3J5IGlmIGl0IGRvZXNuJ3QgZXhpc3RcbiAgICAgIGxldCB3YWxsZXREaXIgPSBQYXRoLmRpcm5hbWUocGF0aCk7XG4gICAgICBpZiAoIWF3YWl0IExpYnJhcnlVdGlscy5leGlzdHMod2FsbGV0LmZzLCB3YWxsZXREaXIpKSB7XG4gICAgICAgIHRyeSB7IGF3YWl0IHdhbGxldC5mcy5ta2Rpcih3YWxsZXREaXIpOyB9XG4gICAgICAgIGNhdGNoIChlcnI6IGFueSkgeyB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJEZXN0aW5hdGlvbiBwYXRoIFwiICsgcGF0aCArIFwiIGRvZXMgbm90IGV4aXN0IGFuZCBjYW5ub3QgYmUgY3JlYXRlZDogXCIgKyBlcnIubWVzc2FnZSk7IH1cbiAgICAgIH1cblxuICAgICAgLy8gZ2V0IHdhbGxldCBkYXRhXG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgd2FsbGV0LmdldERhdGEoKTtcblxuICAgICAgLy8gd3JpdGUgd2FsbGV0IGZpbGVzXG4gICAgICBhd2FpdCB3YWxsZXQuZnMud3JpdGVGaWxlKHBhdGggKyBcIi5rZXlzXCIsIGRhdGFbMF0sIFwiYmluYXJ5XCIpO1xuICAgICAgYXdhaXQgd2FsbGV0LmZzLndyaXRlRmlsZShwYXRoLCBkYXRhWzFdLCBcImJpbmFyeVwiKTtcbiAgICAgIGF3YWl0IHdhbGxldC5mcy53cml0ZUZpbGUocGF0aCArIFwiLmFkZHJlc3MudHh0XCIsIGF3YWl0IHdhbGxldC5nZXRQcmltYXJ5QWRkcmVzcygpKTtcbiAgICAgIGxldCBvbGRQYXRoID0gd2FsbGV0LnBhdGg7XG4gICAgICB3YWxsZXQucGF0aCA9IHBhdGg7XG5cbiAgICAgIC8vIGRlbGV0ZSBvbGQgd2FsbGV0IGZpbGVzXG4gICAgICBpZiAob2xkUGF0aCkge1xuICAgICAgICBhd2FpdCB3YWxsZXQuZnMudW5saW5rKG9sZFBhdGggKyBcIi5hZGRyZXNzLnR4dFwiKTtcbiAgICAgICAgYXdhaXQgd2FsbGV0LmZzLnVubGluayhvbGRQYXRoICsgXCIua2V5c1wiKTtcbiAgICAgICAgYXdhaXQgd2FsbGV0LmZzLnVubGluayhvbGRQYXRoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBcbiAgc3RhdGljIGFzeW5jIHNhdmUod2FsbGV0OiBhbnkpIHtcbiAgICByZXR1cm4gTGlicmFyeVV0aWxzLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICBpZiAoYXdhaXQgd2FsbGV0LmlzQ2xvc2VkKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBpcyBjbG9zZWRcIik7XG5cbiAgICAgIGlmICghYXdhaXQgd2FsbGV0LmdldFBhdGgoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNhdmUgd2FsbGV0IGJlY2F1c2UgcGF0aCBpcyBub3Qgc2V0XCIpO1xuICAgICAgYXdhaXQgTW9uZXJvV2FsbGV0RnVsbC53cml0ZVdhbGxldERhdGEod2FsbGV0LCBhd2FpdCB3YWxsZXQuZ2V0RGF0YSgpLCBhd2FpdCB3YWxsZXQuZ2V0UHJpbWFyeUFkZHJlc3MoKSk7XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgYXN5bmMgd3JpdGVXYWxsZXREYXRhKHdhbGxldDogYW55LCBkYXRhOiBEYXRhVmlld1tdLCBwcmltYXJ5QWRkcmVzczogc3RyaW5nKSB7XG4gICAgbGV0IHBhdGggPSB3YWxsZXQucGF0aDtcbiAgICBpZiAoIXBhdGgpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzYXZlIHdhbGxldCBiZWNhdXNlIHBhdGggaXMgbm90IHNldFwiKTtcblxuICAgIC8vIHdyaXRlIHdhbGxldCBmaWxlcyB0byAqLm5ld1xuICAgIGxldCBwYXRoTmV3ID0gcGF0aCArIFwiLm5ld1wiO1xuICAgIGF3YWl0IHdhbGxldC5mcy53cml0ZUZpbGUocGF0aE5ldyArIFwiLmtleXNcIiwgZGF0YVswXSwgXCJiaW5hcnlcIik7XG4gICAgYXdhaXQgd2FsbGV0LmZzLndyaXRlRmlsZShwYXRoTmV3LCBkYXRhWzFdLCBcImJpbmFyeVwiKTtcbiAgICBhd2FpdCB3YWxsZXQuZnMud3JpdGVGaWxlKHBhdGhOZXcgKyBcIi5hZGRyZXNzLnR4dFwiLCBwcmltYXJ5QWRkcmVzcyk7XG5cbiAgICAvLyByZXBsYWNlIG9sZCB3YWxsZXQgZmlsZXMgd2l0aCBuZXdcbiAgICBhd2FpdCB3YWxsZXQuZnMucmVuYW1lKHBhdGhOZXcgKyBcIi5rZXlzXCIsIHBhdGggKyBcIi5rZXlzXCIpO1xuICAgIGF3YWl0IHdhbGxldC5mcy5yZW5hbWUocGF0aE5ldywgcGF0aCk7XG4gICAgYXdhaXQgd2FsbGV0LmZzLnJlbmFtZShwYXRoTmV3ICsgXCIuYWRkcmVzcy50eHRcIiwgcGF0aCArIFwiLmFkZHJlc3MudHh0XCIpO1xuICB9XG59XG5cbi8qKlxuICogSW1wbGVtZW50cyBhIE1vbmVyb1dhbGxldCBieSBwcm94eWluZyByZXF1ZXN0cyB0byBhIHdvcmtlciB3aGljaCBydW5zIGEgZnVsbCB3YWxsZXQuXG4gKiBcbiAqIEBwcml2YXRlXG4gKi9cbmNsYXNzIE1vbmVyb1dhbGxldEZ1bGxQcm94eSBleHRlbmRzIE1vbmVyb1dhbGxldEtleXNQcm94eSB7XG5cbiAgLy8gaW5zdGFuY2UgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBwYXRoOiBhbnk7XG4gIHByb3RlY3RlZCBmczogYW55O1xuICBwcm90ZWN0ZWQgd3JhcHBlZExpc3RlbmVyczogYW55O1xuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gV0FMTEVUIFNUQVRJQyBVVElMUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIHN0YXRpYyBhc3luYyBvcGVuV2FsbGV0RGF0YShjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPikge1xuICAgIGxldCB3YWxsZXRJZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICBpZiAoY29uZmlnLnBhc3N3b3JkID09PSB1bmRlZmluZWQpIGNvbmZpZy5wYXNzd29yZCA9IFwiXCI7XG4gICAgbGV0IGRhZW1vbkNvbm5lY3Rpb24gPSBjb25maWcuZ2V0U2VydmVyKCk7XG4gICAgYXdhaXQgTGlicmFyeVV0aWxzLmludm9rZVdvcmtlcih3YWxsZXRJZCwgXCJvcGVuV2FsbGV0RGF0YVwiLCBbY29uZmlnLnBhdGgsIGNvbmZpZy5wYXNzd29yZCwgY29uZmlnLm5ldHdvcmtUeXBlLCBjb25maWcua2V5c0RhdGEsIGNvbmZpZy5jYWNoZURhdGEsIGRhZW1vbkNvbm5lY3Rpb24gPyBkYWVtb25Db25uZWN0aW9uLnRvSnNvbigpIDogdW5kZWZpbmVkXSk7XG4gICAgbGV0IHdhbGxldCA9IG5ldyBNb25lcm9XYWxsZXRGdWxsUHJveHkod2FsbGV0SWQsIGF3YWl0IExpYnJhcnlVdGlscy5nZXRXb3JrZXIoKSwgY29uZmlnLnBhdGgsIGNvbmZpZy5nZXRGcygpKTtcbiAgICBpZiAoY29uZmlnLnBhdGgpIGF3YWl0IHdhbGxldC5zYXZlKCk7XG4gICAgcmV0dXJuIHdhbGxldDtcbiAgfVxuICBcbiAgc3RhdGljIGFzeW5jIGNyZWF0ZVdhbGxldChjb25maWcpIHtcbiAgICBpZiAoY29uZmlnLmdldFBhdGgoKSAmJiBhd2FpdCBNb25lcm9XYWxsZXRGdWxsLndhbGxldEV4aXN0cyhjb25maWcuZ2V0UGF0aCgpLCBjb25maWcuZ2V0RnMoKSkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBhbHJlYWR5IGV4aXN0czogXCIgKyBjb25maWcuZ2V0UGF0aCgpKTtcbiAgICBsZXQgd2FsbGV0SWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgYXdhaXQgTGlicmFyeVV0aWxzLmludm9rZVdvcmtlcih3YWxsZXRJZCwgXCJjcmVhdGVXYWxsZXRGdWxsXCIsIFtjb25maWcudG9Kc29uKCldKTtcbiAgICBsZXQgd2FsbGV0ID0gbmV3IE1vbmVyb1dhbGxldEZ1bGxQcm94eSh3YWxsZXRJZCwgYXdhaXQgTGlicmFyeVV0aWxzLmdldFdvcmtlcigpLCBjb25maWcuZ2V0UGF0aCgpLCBjb25maWcuZ2V0RnMoKSk7XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkpIGF3YWl0IHdhbGxldC5zYXZlKCk7XG4gICAgcmV0dXJuIHdhbGxldDtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIElOU1RBTkNFIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgLyoqXG4gICAqIEludGVybmFsIGNvbnN0cnVjdG9yIHdoaWNoIGlzIGdpdmVuIGEgd29ya2VyIHRvIGNvbW11bmljYXRlIHdpdGggdmlhIG1lc3NhZ2VzLlxuICAgKiBcbiAgICogVGhpcyBtZXRob2Qgc2hvdWxkIG5vdCBiZSBjYWxsZWQgZXh0ZXJuYWxseSBidXQgc2hvdWxkIGJlIGNhbGxlZCB0aHJvdWdoXG4gICAqIHN0YXRpYyB3YWxsZXQgY3JlYXRpb24gdXRpbGl0aWVzIGluIHRoaXMgY2xhc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gd2FsbGV0SWQgLSBpZGVudGlmaWVzIHRoZSB3YWxsZXQgd2l0aCB0aGUgd29ya2VyXG4gICAqIEBwYXJhbSB7V29ya2VyfSB3b3JrZXIgLSB3b3JrZXIgdG8gY29tbXVuaWNhdGUgd2l0aCB2aWEgbWVzc2FnZXNcbiAgICovXG4gIGNvbnN0cnVjdG9yKHdhbGxldElkLCB3b3JrZXIsIHBhdGgsIGZzKSB7XG4gICAgc3VwZXIod2FsbGV0SWQsIHdvcmtlcik7XG4gICAgdGhpcy5wYXRoID0gcGF0aDtcbiAgICB0aGlzLmZzID0gZnMgPyBmcyA6IChwYXRoID8gTW9uZXJvV2FsbGV0RnVsbC5nZXRGcygpIDogdW5kZWZpbmVkKTtcbiAgICB0aGlzLndyYXBwZWRMaXN0ZW5lcnMgPSBbXTtcbiAgfVxuXG4gIGdldFBhdGgoKSB7XG4gICAgcmV0dXJuIHRoaXMucGF0aDtcbiAgfVxuXG4gIGFzeW5jIGdldE5ldHdvcmtUeXBlKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldE5ldHdvcmtUeXBlXCIpO1xuICB9XG4gIFxuICBhc3luYyBzZXRTdWJhZGRyZXNzTGFiZWwoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCwgbGFiZWwpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzZXRTdWJhZGRyZXNzTGFiZWxcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSBhcyBQcm9taXNlPHZvaWQ+O1xuICB9XG4gIFxuICBhc3luYyBzZXREYWVtb25Db25uZWN0aW9uKHVyaU9yUnBjQ29ubmVjdGlvbiwgaXNUcnVzdGVkPykge1xuICAgIGlmICghdXJpT3JScGNDb25uZWN0aW9uKSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInNldERhZW1vbkNvbm5lY3Rpb25cIiwgW3VuZGVmaW5lZCwgaXNUcnVzdGVkXSk7XG4gICAgZWxzZSB7XG4gICAgICBsZXQgY29ubmVjdGlvbiA9ICF1cmlPclJwY0Nvbm5lY3Rpb24gPyB1bmRlZmluZWQgOiB1cmlPclJwY0Nvbm5lY3Rpb24gaW5zdGFuY2VvZiBNb25lcm9ScGNDb25uZWN0aW9uID8gdXJpT3JScGNDb25uZWN0aW9uIDogbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24odXJpT3JScGNDb25uZWN0aW9uKTtcbiAgICAgIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwic2V0RGFlbW9uQ29ubmVjdGlvblwiLCBbY29ubmVjdGlvbiA/IGNvbm5lY3Rpb24uZ2V0Q29uZmlnKCkgOiB1bmRlZmluZWQsIGlzVHJ1c3RlZF0pO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGlzRGFlbW9uVHJ1c3RlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJpc0RhZW1vblRydXN0ZWRcIikgYXMgUHJvbWlzZTxib29sZWFuPjtcbiAgfVxuXG4gIGFzeW5jIGdldERhZW1vbkNvbm5lY3Rpb24oKSB7XG4gICAgbGV0IHJwY0NvbmZpZyA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0RGFlbW9uQ29ubmVjdGlvblwiKTtcbiAgICByZXR1cm4gcnBjQ29uZmlnID8gbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24ocnBjQ29uZmlnKSA6IHVuZGVmaW5lZDtcbiAgfVxuICBcbiAgYXN5bmMgaXNDb25uZWN0ZWRUb0RhZW1vbigpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJpc0Nvbm5lY3RlZFRvRGFlbW9uXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRSZXN0b3JlSGVpZ2h0KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldFJlc3RvcmVIZWlnaHRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIHNldFJlc3RvcmVIZWlnaHQocmVzdG9yZUhlaWdodCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInNldFJlc3RvcmVIZWlnaHRcIiwgW3Jlc3RvcmVIZWlnaHRdKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RGFlbW9uSGVpZ2h0KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldERhZW1vbkhlaWdodFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RGFlbW9uTWF4UGVlckhlaWdodCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXREYWVtb25NYXhQZWVySGVpZ2h0XCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRIZWlnaHRCeURhdGUoeWVhciwgbW9udGgsIGRheSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldEhlaWdodEJ5RGF0ZVwiLCBbeWVhciwgbW9udGgsIGRheV0pO1xuICB9XG4gIFxuICBhc3luYyBpc0RhZW1vblN5bmNlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJpc0RhZW1vblN5bmNlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldEhlaWdodFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgYWRkTGlzdGVuZXIobGlzdGVuZXIpIHtcbiAgICBsZXQgd3JhcHBlZExpc3RlbmVyID0gbmV3IFdhbGxldFdvcmtlckxpc3RlbmVyKGxpc3RlbmVyLCAoKSA9PiB0aGlzLl9pc0Nsb3NlZCk7XG4gICAgbGV0IGxpc3RlbmVySWQgPSB3cmFwcGVkTGlzdGVuZXIuZ2V0SWQoKTtcbiAgICBMaWJyYXJ5VXRpbHMuYWRkV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvblN5bmNQcm9ncmVzc19cIiArIGxpc3RlbmVySWQsIFt3cmFwcGVkTGlzdGVuZXIub25TeW5jUHJvZ3Jlc3MsIHdyYXBwZWRMaXN0ZW5lcl0pO1xuICAgIExpYnJhcnlVdGlscy5hZGRXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uTmV3QmxvY2tfXCIgKyBsaXN0ZW5lcklkLCBbd3JhcHBlZExpc3RlbmVyLm9uTmV3QmxvY2ssIHdyYXBwZWRMaXN0ZW5lcl0pO1xuICAgIExpYnJhcnlVdGlscy5hZGRXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uQmFsYW5jZXNDaGFuZ2VkX1wiICsgbGlzdGVuZXJJZCwgW3dyYXBwZWRMaXN0ZW5lci5vbkJhbGFuY2VzQ2hhbmdlZCwgd3JhcHBlZExpc3RlbmVyXSk7XG4gICAgTGlicmFyeVV0aWxzLmFkZFdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25PdXRwdXRSZWNlaXZlZF9cIiArIGxpc3RlbmVySWQsIFt3cmFwcGVkTGlzdGVuZXIub25PdXRwdXRSZWNlaXZlZCwgd3JhcHBlZExpc3RlbmVyXSk7XG4gICAgTGlicmFyeVV0aWxzLmFkZFdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25PdXRwdXRTcGVudF9cIiArIGxpc3RlbmVySWQsIFt3cmFwcGVkTGlzdGVuZXIub25PdXRwdXRTcGVudCwgd3JhcHBlZExpc3RlbmVyXSk7XG4gICAgdGhpcy53cmFwcGVkTGlzdGVuZXJzLnB1c2god3JhcHBlZExpc3RlbmVyKTtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJhZGRMaXN0ZW5lclwiLCBbbGlzdGVuZXJJZF0pO1xuICB9XG4gIFxuICBhc3luYyByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcikge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53cmFwcGVkTGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodGhpcy53cmFwcGVkTGlzdGVuZXJzW2ldLmdldExpc3RlbmVyKCkgPT09IGxpc3RlbmVyKSB7XG4gICAgICAgIGxldCBsaXN0ZW5lcklkID0gdGhpcy53cmFwcGVkTGlzdGVuZXJzW2ldLmdldElkKCk7XG4gICAgICAgIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwicmVtb3ZlTGlzdGVuZXJcIiwgW2xpc3RlbmVySWRdKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnJlbW92ZVdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25TeW5jUHJvZ3Jlc3NfXCIgKyBsaXN0ZW5lcklkKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnJlbW92ZVdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25OZXdCbG9ja19cIiArIGxpc3RlbmVySWQpO1xuICAgICAgICBMaWJyYXJ5VXRpbHMucmVtb3ZlV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvbkJhbGFuY2VzQ2hhbmdlZF9cIiArIGxpc3RlbmVySWQpO1xuICAgICAgICBMaWJyYXJ5VXRpbHMucmVtb3ZlV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvbk91dHB1dFJlY2VpdmVkX1wiICsgbGlzdGVuZXJJZCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5yZW1vdmVXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uT3V0cHV0U3BlbnRfXCIgKyBsaXN0ZW5lcklkKTtcbiAgICAgICAgdGhpcy53cmFwcGVkTGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJMaXN0ZW5lciBpcyBub3QgcmVnaXN0ZXJlZCB3aXRoIHdhbGxldFwiKTtcbiAgfVxuICBcbiAgZ2V0TGlzdGVuZXJzKCkge1xuICAgIGxldCBsaXN0ZW5lcnMgPSBbXTtcbiAgICBmb3IgKGxldCB3cmFwcGVkTGlzdGVuZXIgb2YgdGhpcy53cmFwcGVkTGlzdGVuZXJzKSBsaXN0ZW5lcnMucHVzaCh3cmFwcGVkTGlzdGVuZXIuZ2V0TGlzdGVuZXIoKSk7XG4gICAgcmV0dXJuIGxpc3RlbmVycztcbiAgfVxuICBcbiAgYXN5bmMgaXNTeW5jZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaXNTeW5jZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIHN5bmMobGlzdGVuZXJPclN0YXJ0SGVpZ2h0PzogTW9uZXJvV2FsbGV0TGlzdGVuZXIgfCBudW1iZXIsIHN0YXJ0SGVpZ2h0PzogbnVtYmVyLCBhbGxvd0NvbmN1cnJlbnRDYWxscyA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9TeW5jUmVzdWx0PiB7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIHBhcmFtc1xuICAgIHN0YXJ0SGVpZ2h0ID0gbGlzdGVuZXJPclN0YXJ0SGVpZ2h0IGluc3RhbmNlb2YgTW9uZXJvV2FsbGV0TGlzdGVuZXIgPyBzdGFydEhlaWdodCA6IGxpc3RlbmVyT3JTdGFydEhlaWdodDtcbiAgICBsZXQgbGlzdGVuZXIgPSBsaXN0ZW5lck9yU3RhcnRIZWlnaHQgaW5zdGFuY2VvZiBNb25lcm9XYWxsZXRMaXN0ZW5lciA/IGxpc3RlbmVyT3JTdGFydEhlaWdodCA6IHVuZGVmaW5lZDtcbiAgICBpZiAoc3RhcnRIZWlnaHQgPT09IHVuZGVmaW5lZCkgc3RhcnRIZWlnaHQgPSBNYXRoLm1heChhd2FpdCB0aGlzLmdldEhlaWdodCgpLCBhd2FpdCB0aGlzLmdldFJlc3RvcmVIZWlnaHQoKSk7XG4gICAgXG4gICAgLy8gcmVnaXN0ZXIgbGlzdGVuZXIgaWYgZ2l2ZW5cbiAgICBpZiAobGlzdGVuZXIpIGF3YWl0IHRoaXMuYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIFxuICAgIC8vIHN5bmMgd2FsbGV0IGluIHdvcmtlciBcbiAgICBsZXQgZXJyO1xuICAgIGxldCByZXN1bHQ7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXN1bHRKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJzeW5jXCIsIFtzdGFydEhlaWdodCwgYWxsb3dDb25jdXJyZW50Q2FsbHNdKTtcbiAgICAgIHJlc3VsdCA9IG5ldyBNb25lcm9TeW5jUmVzdWx0KHJlc3VsdEpzb24ubnVtQmxvY2tzRmV0Y2hlZCwgcmVzdWx0SnNvbi5yZWNlaXZlZE1vbmV5KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBlcnIgPSBlO1xuICAgIH1cbiAgICBcbiAgICAvLyB1bnJlZ2lzdGVyIGxpc3RlbmVyXG4gICAgaWYgKGxpc3RlbmVyICYmICF0aGlzLl9pc0Nsb3NlZCkgYXdhaXQgdGhpcy5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgXG4gICAgLy8gdGhyb3cgZXJyb3Igb3IgcmV0dXJuXG4gICAgaWYgKGVycikgdGhyb3cgZXJyO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbiAgXG4gIGFzeW5jIHN0YXJ0U3luY2luZyhzeW5jUGVyaW9kSW5Ncykge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInN0YXJ0U3luY2luZ1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gICAgXG4gIGFzeW5jIHN0b3BTeW5jaW5nKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInN0b3BTeW5jaW5nXCIpO1xuICB9XG4gIFxuICBhc3luYyBzY2FuVHhzKHR4SGFzaGVzKSB7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkodHhIYXNoZXMpLCBcIk11c3QgcHJvdmlkZSBhbiBhcnJheSBvZiB0eHMgaGFzaGVzIHRvIHNjYW5cIik7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic2NhblR4c1wiLCBbdHhIYXNoZXNdKTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzY2FuU3BlbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwicmVzY2FuU3BlbnRcIik7XG4gIH1cbiAgICBcbiAgYXN5bmMgcmVzY2FuQmxvY2tjaGFpbigpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJyZXNjYW5CbG9ja2NoYWluXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRCYWxhbmNlKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpIHtcbiAgICByZXR1cm4gQmlnSW50KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0QmFsYW5jZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VW5sb2NrZWRCYWxhbmNlKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpIHtcbiAgICBsZXQgdW5sb2NrZWRCYWxhbmNlU3RyID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRVbmxvY2tlZEJhbGFuY2VcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgICByZXR1cm4gQmlnSW50KHVubG9ja2VkQmFsYW5jZVN0cik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFjY291bnRzKGluY2x1ZGVTdWJhZGRyZXNzZXMsIHRhZykge1xuICAgIGxldCBhY2NvdW50cyA9IFtdO1xuICAgIGZvciAobGV0IGFjY291bnRKc29uIG9mIChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldEFjY291bnRzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpKSB7XG4gICAgICBhY2NvdW50cy5wdXNoKE1vbmVyb1dhbGxldEZ1bGwuc2FuaXRpemVBY2NvdW50KG5ldyBNb25lcm9BY2NvdW50KGFjY291bnRKc29uKSkpO1xuICAgIH1cbiAgICByZXR1cm4gYWNjb3VudHM7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFjY291bnQoYWNjb3VudElkeCwgaW5jbHVkZVN1YmFkZHJlc3Nlcykge1xuICAgIGxldCBhY2NvdW50SnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0QWNjb3VudFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplQWNjb3VudChuZXcgTW9uZXJvQWNjb3VudChhY2NvdW50SnNvbikpO1xuICB9XG4gIFxuICBhc3luYyBjcmVhdGVBY2NvdW50KGxhYmVsKSB7XG4gICAgbGV0IGFjY291bnRKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJjcmVhdGVBY2NvdW50XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuc2FuaXRpemVBY2NvdW50KG5ldyBNb25lcm9BY2NvdW50KGFjY291bnRKc29uKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSW5kaWNlcykge1xuICAgIGxldCBzdWJhZGRyZXNzZXMgPSBbXTtcbiAgICBmb3IgKGxldCBzdWJhZGRyZXNzSnNvbiBvZiAoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRTdWJhZGRyZXNzZXNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSkpIHtcbiAgICAgIHN1YmFkZHJlc3Nlcy5wdXNoKE1vbmVyb1dhbGxldEtleXMuc2FuaXRpemVTdWJhZGRyZXNzKG5ldyBNb25lcm9TdWJhZGRyZXNzKHN1YmFkZHJlc3NKc29uKSkpO1xuICAgIH1cbiAgICByZXR1cm4gc3ViYWRkcmVzc2VzO1xuICB9XG4gIFxuICBhc3luYyBjcmVhdGVTdWJhZGRyZXNzKGFjY291bnRJZHgsIGxhYmVsKSB7XG4gICAgbGV0IHN1YmFkZHJlc3NKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJjcmVhdGVTdWJhZGRyZXNzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEtleXMuc2FuaXRpemVTdWJhZGRyZXNzKG5ldyBNb25lcm9TdWJhZGRyZXNzKHN1YmFkZHJlc3NKc29uKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4cyhxdWVyeSkge1xuICAgIHF1ZXJ5ID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVR4UXVlcnkocXVlcnkpO1xuICAgIGxldCByZXNwSnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0VHhzXCIsIFtxdWVyeS5nZXRCbG9jaygpLnRvSnNvbigpXSk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuZGVzZXJpYWxpemVUeHMocXVlcnksIEpTT04uc3RyaW5naWZ5KHtibG9ja3M6IHJlc3BKc29uLmJsb2Nrc30pKTsgLy8gaW5pdGlhbGl6ZSB0eHMgZnJvbSBibG9ja3MganNvbiBzdHJpbmcgVE9ETzogdGhpcyBzdHJpbmdpZmllcyB0aGVuIHV0aWxpdHkgcGFyc2VzLCBhdm9pZFxuICB9XG4gIFxuICBhc3luYyBnZXRUcmFuc2ZlcnMocXVlcnkpIHtcbiAgICBxdWVyeSA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVUcmFuc2ZlclF1ZXJ5KHF1ZXJ5KTtcbiAgICBsZXQgYmxvY2tKc29ucyA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0VHJhbnNmZXJzXCIsIFtxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0QmxvY2soKS50b0pzb24oKV0pO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplVHJhbnNmZXJzKHF1ZXJ5LCBKU09OLnN0cmluZ2lmeSh7YmxvY2tzOiBibG9ja0pzb25zfSkpOyAvLyBpbml0aWFsaXplIHRyYW5zZmVycyBmcm9tIGJsb2NrcyBqc29uIHN0cmluZyBUT0RPOiB0aGlzIHN0cmluZ2lmaWVzIHRoZW4gdXRpbGl0eSBwYXJzZXMsIGF2b2lkXG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dHMocXVlcnkpIHtcbiAgICBxdWVyeSA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVPdXRwdXRRdWVyeShxdWVyeSk7XG4gICAgbGV0IGJsb2NrSnNvbnMgPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldE91dHB1dHNcIiwgW3F1ZXJ5LmdldFR4UXVlcnkoKS5nZXRCbG9jaygpLnRvSnNvbigpXSk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuZGVzZXJpYWxpemVPdXRwdXRzKHF1ZXJ5LCBKU09OLnN0cmluZ2lmeSh7YmxvY2tzOiBibG9ja0pzb25zfSkpOyAvLyBpbml0aWFsaXplIHRyYW5zZmVycyBmcm9tIGJsb2NrcyBqc29uIHN0cmluZyBUT0RPOiB0aGlzIHN0cmluZ2lmaWVzIHRoZW4gdXRpbGl0eSBwYXJzZXMsIGF2b2lkXG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydE91dHB1dHMoYWxsKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZXhwb3J0T3V0cHV0c1wiLCBbYWxsXSk7XG4gIH1cbiAgXG4gIGFzeW5jIGltcG9ydE91dHB1dHMob3V0cHV0c0hleCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImltcG9ydE91dHB1dHNcIiwgW291dHB1dHNIZXhdKTtcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0S2V5SW1hZ2VzKGFsbCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRLZXlJbWFnZXNcIiwgW2FsbF0pKTtcbiAgfVxuICBcbiAgYXN5bmMgaW1wb3J0S2V5SW1hZ2VzKGtleUltYWdlcywgb2Zmc2V0ID0gMCkge1xuICAgIGxldCBrZXlJbWFnZXNKc29uID0gW107XG4gICAgZm9yIChsZXQga2V5SW1hZ2Ugb2Yga2V5SW1hZ2VzKSBrZXlJbWFnZXNKc29uLnB1c2goa2V5SW1hZ2UudG9Kc29uKCkpO1xuICAgIHJldHVybiBuZXcgTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJpbXBvcnRLZXlJbWFnZXNcIiwgW2tleUltYWdlc0pzb24sIG9mZnNldF0pKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQoKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTW9uZXJvV2FsbGV0RnVsbC5nZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCgpIG5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZnJlZXplT3V0cHV0KGtleUltYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZnJlZXplT3V0cHV0XCIsIFtrZXlJbWFnZV0pO1xuICB9XG4gIFxuICBhc3luYyB0aGF3T3V0cHV0KGtleUltYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwidGhhd091dHB1dFwiLCBba2V5SW1hZ2VdKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNPdXRwdXRGcm96ZW4oa2V5SW1hZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJpc091dHB1dEZyb3plblwiLCBba2V5SW1hZ2VdKTtcbiAgfVxuXG4gIGFzeW5jIGdldERlZmF1bHRGZWVQcmlvcml0eSgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXREZWZhdWx0RmVlUHJpb3JpdHlcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGNyZWF0ZVR4cyhjb25maWcpIHtcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnKGNvbmZpZyk7XG4gICAgbGV0IHR4U2V0SnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiY3JlYXRlVHhzXCIsIFtjb25maWcudG9Kc29uKCldKTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1R4U2V0KHR4U2V0SnNvbikuZ2V0VHhzKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHN3ZWVwT3V0cHV0KGNvbmZpZykge1xuICAgIGNvbmZpZyA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVTd2VlcE91dHB1dENvbmZpZyhjb25maWcpO1xuICAgIGxldCB0eFNldEpzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInN3ZWVwT3V0cHV0XCIsIFtjb25maWcudG9Kc29uKCldKTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1R4U2V0KHR4U2V0SnNvbikuZ2V0VHhzKClbMF07XG4gIH1cblxuICBhc3luYyBzd2VlcFVubG9ja2VkKGNvbmZpZykge1xuICAgIGNvbmZpZyA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVTd2VlcFVubG9ja2VkQ29uZmlnKGNvbmZpZyk7XG4gICAgbGV0IHR4U2V0c0pzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInN3ZWVwVW5sb2NrZWRcIiwgW2NvbmZpZy50b0pzb24oKV0pO1xuICAgIGxldCB0eHMgPSBbXTtcbiAgICBmb3IgKGxldCB0eFNldEpzb24gb2YgdHhTZXRzSnNvbikgZm9yIChsZXQgdHggb2YgbmV3IE1vbmVyb1R4U2V0KHR4U2V0SnNvbikuZ2V0VHhzKCkpIHR4cy5wdXNoKHR4KTtcbiAgICByZXR1cm4gdHhzO1xuICB9XG4gIFxuICBhc3luYyBzd2VlcER1c3QocmVsYXkpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1R4U2V0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwic3dlZXBEdXN0XCIsIFtyZWxheV0pKS5nZXRUeHMoKSB8fCBbXTtcbiAgfVxuICBcbiAgYXN5bmMgcmVsYXlUeHModHhzT3JNZXRhZGF0YXMpIHtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheSh0eHNPck1ldGFkYXRhcyksIFwiTXVzdCBwcm92aWRlIGFuIGFycmF5IG9mIHR4cyBvciB0aGVpciBtZXRhZGF0YSB0byByZWxheVwiKTtcbiAgICBsZXQgdHhNZXRhZGF0YXMgPSBbXTtcbiAgICBmb3IgKGxldCB0eE9yTWV0YWRhdGEgb2YgdHhzT3JNZXRhZGF0YXMpIHR4TWV0YWRhdGFzLnB1c2godHhPck1ldGFkYXRhIGluc3RhbmNlb2YgTW9uZXJvVHhXYWxsZXQgPyB0eE9yTWV0YWRhdGEuZ2V0TWV0YWRhdGEoKSA6IHR4T3JNZXRhZGF0YSk7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwicmVsYXlUeHNcIiwgW3R4TWV0YWRhdGFzXSk7XG4gIH1cbiAgXG4gIGFzeW5jIGRlc2NyaWJlVHhTZXQodHhTZXQpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1R4U2V0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGVzY3JpYmVUeFNldFwiLCBbdHhTZXQudG9Kc29uKCldKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNpZ25UeHModW5zaWduZWRUeEhleCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvVHhTZXQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJzaWduVHhzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBzdWJtaXRUeHMoc2lnbmVkVHhIZXgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzdWJtaXRUeHNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgc2lnbk1lc3NhZ2UobWVzc2FnZSwgc2lnbmF0dXJlVHlwZSwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInNpZ25NZXNzYWdlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHZlcmlmeU1lc3NhZ2UobWVzc2FnZSwgYWRkcmVzcywgc2lnbmF0dXJlKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwidmVyaWZ5TWVzc2FnZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhLZXkodHhIYXNoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0VHhLZXlcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tUeEtleSh0eEhhc2gsIHR4S2V5LCBhZGRyZXNzKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9DaGVja1R4KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiY2hlY2tUeEtleVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhQcm9vZih0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRUeFByb29mXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrVHhQcm9vZih0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvQ2hlY2tUeChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImNoZWNrVHhQcm9vZlwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U3BlbmRQcm9vZih0eEhhc2gsIG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRTcGVuZFByb29mXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrU3BlbmRQcm9vZih0eEhhc2gsIG1lc3NhZ2UsIHNpZ25hdHVyZSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImNoZWNrU3BlbmRQcm9vZlwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRSZXNlcnZlUHJvb2ZXYWxsZXQobWVzc2FnZSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldFJlc2VydmVQcm9vZldhbGxldFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRSZXNlcnZlUHJvb2ZBY2NvdW50KGFjY291bnRJZHgsIGFtb3VudCwgbWVzc2FnZSkge1xuICAgIHRyeSB7IHJldHVybiBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldFJlc2VydmVQcm9vZkFjY291bnRcIiwgW2FjY291bnRJZHgsIGFtb3VudC50b1N0cmluZygpLCBtZXNzYWdlXSk7IH1cbiAgICBjYXRjaCAoZTogYW55KSB7IHRocm93IG5ldyBNb25lcm9FcnJvcihlLm1lc3NhZ2UsIC0xKTsgfVxuICB9XG5cbiAgYXN5bmMgY2hlY2tSZXNlcnZlUHJvb2YoYWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlKSB7XG4gICAgdHJ5IHsgcmV0dXJuIG5ldyBNb25lcm9DaGVja1Jlc2VydmUoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJjaGVja1Jlc2VydmVQcm9vZlwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTsgfVxuICAgIGNhdGNoIChlOiBhbnkpIHsgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGUubWVzc2FnZSwgLTEpOyB9XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4Tm90ZXModHhIYXNoZXMpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRUeE5vdGVzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNldFR4Tm90ZXModHhIYXNoZXMsIG5vdGVzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic2V0VHhOb3Rlc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRBZGRyZXNzQm9va0VudHJpZXMoZW50cnlJbmRpY2VzKSB7XG4gICAgaWYgKCFlbnRyeUluZGljZXMpIGVudHJ5SW5kaWNlcyA9IFtdO1xuICAgIGxldCBlbnRyaWVzID0gW107XG4gICAgZm9yIChsZXQgZW50cnlKc29uIG9mIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpIHtcbiAgICAgIGVudHJpZXMucHVzaChuZXcgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeShlbnRyeUpzb24pKTtcbiAgICB9XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGFkZEFkZHJlc3NCb29rRW50cnkoYWRkcmVzcywgZGVzY3JpcHRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJhZGRBZGRyZXNzQm9va0VudHJ5XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGVkaXRBZGRyZXNzQm9va0VudHJ5KGluZGV4LCBzZXRBZGRyZXNzLCBhZGRyZXNzLCBzZXREZXNjcmlwdGlvbiwgZGVzY3JpcHRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJlZGl0QWRkcmVzc0Jvb2tFbnRyeVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBkZWxldGVBZGRyZXNzQm9va0VudHJ5KGVudHJ5SWR4KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyB0YWdBY2NvdW50cyh0YWcsIGFjY291bnRJbmRpY2VzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwidGFnQWNjb3VudHNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuXG4gIGFzeW5jIHVudGFnQWNjb3VudHMoYWNjb3VudEluZGljZXMpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJ1bnRhZ0FjY291bnRzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFjY291bnRUYWdzKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldEFjY291bnRUYWdzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cblxuICBhc3luYyBzZXRBY2NvdW50VGFnTGFiZWwodGFnLCBsYWJlbCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInNldEFjY291bnRUYWdMYWJlbFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRQYXltZW50VXJpKGNvbmZpZykge1xuICAgIGNvbmZpZyA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVDcmVhdGVUeHNDb25maWcoY29uZmlnKTtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRQYXltZW50VXJpXCIsIFtjb25maWcudG9Kc29uKCldKTtcbiAgfVxuICBcbiAgYXN5bmMgcGFyc2VQYXltZW50VXJpKHVyaSkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvVHhDb25maWcoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJwYXJzZVBheW1lbnRVcmlcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEF0dHJpYnV0ZShrZXkpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRBdHRyaWJ1dGVcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0QXR0cmlidXRlKGtleSwgdmFsKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic2V0QXR0cmlidXRlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0YXJ0TWluaW5nKG51bVRocmVhZHMsIGJhY2tncm91bmRNaW5pbmcsIGlnbm9yZUJhdHRlcnkpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzdGFydE1pbmluZ1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBzdG9wTWluaW5nKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInN0b3BNaW5pbmdcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJpc011bHRpc2lnSW1wb3J0TmVlZGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBpc011bHRpc2lnKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImlzTXVsdGlzaWdcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE11bHRpc2lnSW5mbygpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb011bHRpc2lnSW5mbyhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldE11bHRpc2lnSW5mb1wiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHByZXBhcmVNdWx0aXNpZygpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJwcmVwYXJlTXVsdGlzaWdcIik7XG4gIH1cbiAgXG4gIGFzeW5jIG1ha2VNdWx0aXNpZyhtdWx0aXNpZ0hleGVzLCB0aHJlc2hvbGQsIHBhc3N3b3JkKSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwibWFrZU11bHRpc2lnXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGV4Y2hhbmdlTXVsdGlzaWdLZXlzKG11bHRpc2lnSGV4ZXMsIHBhc3N3b3JkKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJleGNoYW5nZU11bHRpc2lnS2V5c1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0TXVsdGlzaWdIZXgoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZXhwb3J0TXVsdGlzaWdIZXhcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGltcG9ydE11bHRpc2lnSGV4KG11bHRpc2lnSGV4ZXMsIHJlZnJlc2hBZnRlckltcG9ydCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImltcG9ydE11bHRpc2lnSGV4XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNpZ25NdWx0aXNpZ1R4SGV4KG11bHRpc2lnVHhIZXgpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb011bHRpc2lnU2lnblJlc3VsdChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInNpZ25NdWx0aXNpZ1R4SGV4XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBzdWJtaXRNdWx0aXNpZ1R4SGV4KHNpZ25lZE11bHRpc2lnVHhIZXgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzdWJtaXRNdWx0aXNpZ1R4SGV4XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldERhdGEoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0RGF0YVwiKTtcbiAgfVxuICBcbiAgYXN5bmMgbW92ZVRvKHBhdGgpIHtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5tb3ZlVG8ocGF0aCwgdGhpcyk7XG4gIH1cbiAgXG4gIGFzeW5jIGNoYW5nZVBhc3N3b3JkKG9sZFBhc3N3b3JkLCBuZXdQYXNzd29yZCkge1xuICAgIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiY2hhbmdlUGFzc3dvcmRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgICBpZiAodGhpcy5wYXRoKSBhd2FpdCB0aGlzLnNhdmUoKTsgLy8gYXV0byBzYXZlXG4gIH1cbiAgXG4gIGFzeW5jIHNhdmUoKSB7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuc2F2ZSh0aGlzKTtcbiAgfVxuXG4gIGFzeW5jIGlzQ2xvc2VkKCkge1xuICAgIHJldHVybiB0aGlzLl9pc0Nsb3NlZCB8fCBzdXBlci5pc0Nsb3NlZCgpO1xuICB9XG5cbiAgYXN5bmMgY2xvc2Uoc2F2ZSkge1xuICAgIHRoaXMuX2lzQ2xvc2VkID0gdHJ1ZTtcbiAgICBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInByZXBhcmVDbG9zZVwiKTtcbiAgICBpZiAoc2F2ZSkge1xuICAgICAgYXdhaXQgTGlicmFyeVV0aWxzLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IHNuYXBzaG90ID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRDbG9zZURhdGFcIik7XG4gICAgICAgIGF3YWl0IE1vbmVyb1dhbGxldEZ1bGwud3JpdGVXYWxsZXREYXRhKHRoaXMsIHNuYXBzaG90LmRhdGEsIHNuYXBzaG90LnByaW1hcnlBZGRyZXNzKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBhd2FpdCBzdXBlci5jbG9zZShmYWxzZSk7XG4gICAgdGhpcy53cmFwcGVkTGlzdGVuZXJzLmxlbmd0aCA9IDA7XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gTElTVEVOSU5HIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vKipcbiAqIFJlY2VpdmVzIG5vdGlmaWNhdGlvbnMgZGlyZWN0bHkgZnJvbSB3YXNtIGMrKy5cbiAqIFxuICogQHByaXZhdGVcbiAqL1xuY2xhc3MgV2FsbGV0V2FzbUxpc3RlbmVyIHtcblxuICBwcm90ZWN0ZWQgd2FsbGV0OiBNb25lcm9XYWxsZXQ7XG4gIFxuICBjb25zdHJ1Y3Rvcih3YWxsZXQpIHtcbiAgICB0aGlzLndhbGxldCA9IHdhbGxldDtcbiAgfVxuICBcbiAgYXN5bmMgb25TeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSkge1xuICAgIGF3YWl0IHRoaXMud2FsbGV0LmFubm91bmNlU3luY1Byb2dyZXNzKGhlaWdodCwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgcGVyY2VudERvbmUsIG1lc3NhZ2UpO1xuICB9XG4gIFxuICBhc3luYyBvbk5ld0Jsb2NrKGhlaWdodCkge1xuICAgIGF3YWl0IHRoaXMud2FsbGV0LmFubm91bmNlTmV3QmxvY2soaGVpZ2h0KTtcbiAgfVxuICBcbiAgYXN5bmMgb25CYWxhbmNlc0NoYW5nZWQobmV3QmFsYW5jZVN0ciwgbmV3VW5sb2NrZWRCYWxhbmNlU3RyKSB7XG4gICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VCYWxhbmNlc0NoYW5nZWQobmV3QmFsYW5jZVN0ciwgbmV3VW5sb2NrZWRCYWxhbmNlU3RyKTtcbiAgfVxuICBcbiAgYXN5bmMgb25PdXRwdXRSZWNlaXZlZChoZWlnaHQsIHR4SGFzaCwgYW1vdW50U3RyLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4LCB2ZXJzaW9uLCB1bmxvY2tUaW1lLCBpc0xvY2tlZCkge1xuICAgIFxuICAgIC8vIGJ1aWxkIHJlY2VpdmVkIG91dHB1dFxuICAgIGxldCBvdXRwdXQgPSBuZXcgTW9uZXJvT3V0cHV0V2FsbGV0KCk7XG4gICAgb3V0cHV0LnNldEFtb3VudChCaWdJbnQoYW1vdW50U3RyKSk7XG4gICAgb3V0cHV0LnNldEFjY291bnRJbmRleChhY2NvdW50SWR4KTtcbiAgICBvdXRwdXQuc2V0U3ViYWRkcmVzc0luZGV4KHN1YmFkZHJlc3NJZHgpO1xuICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgIHR4LnNldEhhc2godHhIYXNoKTtcbiAgICB0eC5zZXRWZXJzaW9uKHZlcnNpb24pO1xuICAgIHR4LnNldFVubG9ja1RpbWUodW5sb2NrVGltZSk7XG4gICAgb3V0cHV0LnNldFR4KHR4KTtcbiAgICB0eC5zZXRPdXRwdXRzKFtvdXRwdXRdKTtcbiAgICB0eC5zZXRJc0luY29taW5nKHRydWUpO1xuICAgIHR4LnNldElzTG9ja2VkKGlzTG9ja2VkKTtcbiAgICBpZiAoaGVpZ2h0ID4gMCkge1xuICAgICAgbGV0IGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0SGVpZ2h0KGhlaWdodCk7XG4gICAgICBibG9jay5zZXRUeHMoW3R4IGFzIE1vbmVyb1R4XSk7XG4gICAgICB0eC5zZXRCbG9jayhibG9jayk7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SW5UeFBvb2wodHJ1ZSk7XG4gICAgfVxuICAgIFxuICAgIC8vIGFubm91bmNlIG91dHB1dFxuICAgIGF3YWl0IHRoaXMud2FsbGV0LmFubm91bmNlT3V0cHV0UmVjZWl2ZWQob3V0cHV0KTtcbiAgfVxuICBcbiAgYXN5bmMgb25PdXRwdXRTcGVudChoZWlnaHQsIHR4SGFzaCwgYW1vdW50U3RyLCBhY2NvdW50SWR4U3RyLCBzdWJhZGRyZXNzSWR4U3RyLCB2ZXJzaW9uLCB1bmxvY2tUaW1lLCBpc0xvY2tlZCkge1xuICAgIFxuICAgIC8vIGJ1aWxkIHNwZW50IG91dHB1dFxuICAgIGxldCBvdXRwdXQgPSBuZXcgTW9uZXJvT3V0cHV0V2FsbGV0KCk7XG4gICAgb3V0cHV0LnNldEFtb3VudChCaWdJbnQoYW1vdW50U3RyKSk7XG4gICAgaWYgKGFjY291bnRJZHhTdHIpIG91dHB1dC5zZXRBY2NvdW50SW5kZXgocGFyc2VJbnQoYWNjb3VudElkeFN0cikpO1xuICAgIGlmIChzdWJhZGRyZXNzSWR4U3RyKSBvdXRwdXQuc2V0U3ViYWRkcmVzc0luZGV4KHBhcnNlSW50KHN1YmFkZHJlc3NJZHhTdHIpKTtcbiAgICBsZXQgdHggPSBuZXcgTW9uZXJvVHhXYWxsZXQoKTtcbiAgICB0eC5zZXRIYXNoKHR4SGFzaCk7XG4gICAgdHguc2V0VmVyc2lvbih2ZXJzaW9uKTtcbiAgICB0eC5zZXRVbmxvY2tUaW1lKHVubG9ja1RpbWUpO1xuICAgIHR4LnNldElzTG9ja2VkKGlzTG9ja2VkKTtcbiAgICBvdXRwdXQuc2V0VHgodHgpO1xuICAgIHR4LnNldElucHV0cyhbb3V0cHV0XSk7XG4gICAgaWYgKGhlaWdodCA+IDApIHtcbiAgICAgIGxldCBibG9jayA9IG5ldyBNb25lcm9CbG9jaygpLnNldEhlaWdodChoZWlnaHQpO1xuICAgICAgYmxvY2suc2V0VHhzKFt0eF0pO1xuICAgICAgdHguc2V0QmxvY2soYmxvY2spO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKHRydWUpO1xuICAgIH1cbiAgICBcbiAgICAvLyBhbm5vdW5jZSBvdXRwdXRcbiAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZU91dHB1dFNwZW50KG91dHB1dCk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnRlcm5hbCBsaXN0ZW5lciB0byBicmlkZ2Ugbm90aWZpY2F0aW9ucyB0byBleHRlcm5hbCBsaXN0ZW5lcnMuXG4gKiBcbiAqIEBwcml2YXRlXG4gKi9cbmNsYXNzIFdhbGxldFdvcmtlckxpc3RlbmVyIHtcblxuICBwcm90ZWN0ZWQgaWQ6IGFueTtcbiAgcHJvdGVjdGVkIGxpc3RlbmVyOiBhbnk7XG4gIHByb3RlY3RlZCBpc0Nsb3NlZDogKCkgPT4gYm9vbGVhbjtcbiAgXG4gIGNvbnN0cnVjdG9yKGxpc3RlbmVyLCBpc0Nsb3NlZCkge1xuICAgIHRoaXMuaWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgdGhpcy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICAgIHRoaXMuaXNDbG9zZWQgPSBpc0Nsb3NlZDtcbiAgfVxuICBcbiAgZ2V0SWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaWQ7XG4gIH1cbiAgXG4gIGdldExpc3RlbmVyKCkge1xuICAgIHJldHVybiB0aGlzLmxpc3RlbmVyO1xuICB9XG4gIFxuICBvblN5bmNQcm9ncmVzcyhoZWlnaHQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIHBlcmNlbnREb25lLCBtZXNzYWdlKSB7XG4gICAgaWYgKHRoaXMuaXNDbG9zZWQoKSkgcmV0dXJuO1xuICAgIHRoaXMubGlzdGVuZXIub25TeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSk7XG4gIH1cblxuICBhc3luYyBvbk5ld0Jsb2NrKGhlaWdodCkge1xuICAgIGlmICh0aGlzLmlzQ2xvc2VkKCkpIHJldHVybjtcbiAgICBhd2FpdCB0aGlzLmxpc3RlbmVyLm9uTmV3QmxvY2soaGVpZ2h0KTtcbiAgfVxuICBcbiAgYXN5bmMgb25CYWxhbmNlc0NoYW5nZWQobmV3QmFsYW5jZVN0ciwgbmV3VW5sb2NrZWRCYWxhbmNlU3RyKSB7XG4gICAgaWYgKHRoaXMuaXNDbG9zZWQoKSkgcmV0dXJuO1xuICAgIGF3YWl0IHRoaXMubGlzdGVuZXIub25CYWxhbmNlc0NoYW5nZWQoQmlnSW50KG5ld0JhbGFuY2VTdHIpLCBCaWdJbnQobmV3VW5sb2NrZWRCYWxhbmNlU3RyKSk7XG4gIH1cblxuICBhc3luYyBvbk91dHB1dFJlY2VpdmVkKGJsb2NrSnNvbikge1xuICAgIGlmICh0aGlzLmlzQ2xvc2VkKCkpIHJldHVybjtcbiAgICBsZXQgYmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uLCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYX1dBTExFVCk7XG4gICAgYXdhaXQgdGhpcy5saXN0ZW5lci5vbk91dHB1dFJlY2VpdmVkKGJsb2NrLmdldFR4cygpWzBdLmdldE91dHB1dHMoKVswXSk7XG4gIH1cbiAgXG4gIGFzeW5jIG9uT3V0cHV0U3BlbnQoYmxvY2tKc29uKSB7XG4gICAgaWYgKHRoaXMuaXNDbG9zZWQoKSkgcmV0dXJuO1xuICAgIGxldCBibG9jayA9IG5ldyBNb25lcm9CbG9jayhibG9ja0pzb24sIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFhfV0FMTEVUKTtcbiAgICBhd2FpdCB0aGlzLmxpc3RlbmVyLm9uT3V0cHV0U3BlbnQoYmxvY2suZ2V0VHhz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