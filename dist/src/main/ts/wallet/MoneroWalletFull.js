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
    this.rejectUnauthorized = rejectUnauthorized; // persist locally

    // set connection in queue
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.set_daemon_connection(this.cppAddress, uri, username, password, proxyUri, isTrustedArg, (resp) => {
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
            if (resp.charAt(0) !== '{') reject(new _MoneroError.default(resp));else
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfcGF0aCIsIl9HZW5VdGlscyIsIl9MaWJyYXJ5VXRpbHMiLCJfVGFza0xvb3BlciIsIl9Nb25lcm9BY2NvdW50IiwiX01vbmVyb0FjY291bnRUYWciLCJfTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSIsIl9Nb25lcm9CbG9jayIsIl9Nb25lcm9DaGVja1R4IiwiX01vbmVyb0NoZWNrUmVzZXJ2ZSIsIl9Nb25lcm9EYWVtb25ScGMiLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MiLCJfTW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHQiLCJfTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQiLCJfTW9uZXJvTXVsdGlzaWdJbmZvIiwiX01vbmVyb011bHRpc2lnSW5pdFJlc3VsdCIsIl9Nb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQiLCJfTW9uZXJvTmV0d29ya1R5cGUiLCJfTW9uZXJvT3V0cHV0V2FsbGV0IiwiX01vbmVyb1JwY0Nvbm5lY3Rpb24iLCJfTW9uZXJvU3ViYWRkcmVzcyIsIl9Nb25lcm9TeW5jUmVzdWx0IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4U2V0IiwiX01vbmVyb1R4V2FsbGV0IiwiX01vbmVyb1dhbGxldCIsIl9Nb25lcm9XYWxsZXRDb25maWciLCJfTW9uZXJvV2FsbGV0S2V5cyIsIl9Nb25lcm9XYWxsZXRMaXN0ZW5lciIsIl9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIl9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0IiwiX2ZzIiwiTW9uZXJvV2FsbGV0RnVsbCIsIk1vbmVyb1dhbGxldEtleXMiLCJERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TIiwiY29uc3RydWN0b3IiLCJjcHBBZGRyZXNzIiwicGF0aCIsInBhc3N3b3JkIiwiZnMiLCJyZWplY3RVbmF1dGhvcml6ZWQiLCJyZWplY3RVbmF1dGhvcml6ZWRGbklkIiwid2FsbGV0UHJveHkiLCJsaXN0ZW5lcnMiLCJnZXRGcyIsInVuZGVmaW5lZCIsIl9pc0Nsb3NlZCIsIndhc21MaXN0ZW5lciIsIldhbGxldFdhc21MaXN0ZW5lciIsIndhc21MaXN0ZW5lckhhbmRsZSIsInJlamVjdFVuYXV0aG9yaXplZENvbmZpZ0lkIiwic3luY1BlcmlvZEluTXMiLCJMaWJyYXJ5VXRpbHMiLCJzZXRSZWplY3RVbmF1dGhvcml6ZWRGbiIsIndhbGxldEV4aXN0cyIsImFzc2VydCIsIk1vbmVyb0Vycm9yIiwiZXhpc3RzIiwibG9nIiwib3BlbldhbGxldCIsImNvbmZpZyIsIk1vbmVyb1dhbGxldENvbmZpZyIsImdldFByb3h5VG9Xb3JrZXIiLCJzZXRQcm94eVRvV29ya2VyIiwiZ2V0U2VlZCIsImdldFNlZWRPZmZzZXQiLCJnZXRQcmltYXJ5QWRkcmVzcyIsImdldFByaXZhdGVWaWV3S2V5IiwiZ2V0UHJpdmF0ZVNwZW5kS2V5IiwiZ2V0UmVzdG9yZUhlaWdodCIsImdldExhbmd1YWdlIiwiZ2V0U2F2ZUN1cnJlbnQiLCJzZXRGcyIsImdldENvbm5lY3Rpb25NYW5hZ2VyIiwiZ2V0U2VydmVyIiwic2V0U2VydmVyIiwiZ2V0Q29ubmVjdGlvbiIsImdldEtleXNEYXRhIiwiZ2V0UGF0aCIsInNldEtleXNEYXRhIiwicmVhZEZpbGUiLCJzZXRDYWNoZURhdGEiLCJ3YWxsZXQiLCJvcGVuV2FsbGV0RGF0YSIsImdldElzVHJ1c3RlZERhZW1vbiIsInNldERhZW1vbkNvbm5lY3Rpb24iLCJzZXRDb25uZWN0aW9uTWFuYWdlciIsImNyZWF0ZVdhbGxldCIsImdldE5ldHdvcmtUeXBlIiwiTW9uZXJvTmV0d29ya1R5cGUiLCJ2YWxpZGF0ZSIsInNldFBhdGgiLCJnZXRQYXNzd29yZCIsInNldFBhc3N3b3JkIiwiTW9uZXJvV2FsbGV0RnVsbFByb3h5IiwiY3JlYXRlV2FsbGV0RnJvbVNlZWQiLCJjcmVhdGVXYWxsZXRGcm9tS2V5cyIsImNyZWF0ZVdhbGxldFJhbmRvbSIsImRhZW1vbkNvbm5lY3Rpb24iLCJnZXRSZWplY3RVbmF1dGhvcml6ZWQiLCJzZXRSZXN0b3JlSGVpZ2h0Iiwic2V0U2VlZE9mZnNldCIsIm1vZHVsZSIsImxvYWRXYXNtTW9kdWxlIiwicXVldWVUYXNrIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJHZW5VdGlscyIsImdldFVVSUQiLCJjcmVhdGVfZnVsbF93YWxsZXQiLCJKU09OIiwic3RyaW5naWZ5IiwidG9Kc29uIiwic2F2ZSIsInNldFByaW1hcnlBZGRyZXNzIiwic2V0UHJpdmF0ZVZpZXdLZXkiLCJzZXRQcml2YXRlU3BlbmRLZXkiLCJzZXRMYW5ndWFnZSIsImdldFNlZWRMYW5ndWFnZXMiLCJwYXJzZSIsImdldF9rZXlzX3dhbGxldF9zZWVkX2xhbmd1YWdlcyIsImxhbmd1YWdlcyIsIkZTIiwicHJvbWlzZXMiLCJnZXREYWVtb25NYXhQZWVySGVpZ2h0IiwiZ2V0V2FsbGV0UHJveHkiLCJhc3NlcnROb3RDbG9zZWQiLCJnZXRfZGFlbW9uX21heF9wZWVyX2hlaWdodCIsInJlc3AiLCJpc0RhZW1vblN5bmNlZCIsImlzX2RhZW1vbl9zeW5jZWQiLCJpc1N5bmNlZCIsImlzX3N5bmNlZCIsImdldF9uZXR3b3JrX3R5cGUiLCJnZXRfcmVzdG9yZV9oZWlnaHQiLCJyZXN0b3JlSGVpZ2h0Iiwic2V0X3Jlc3RvcmVfaGVpZ2h0IiwibW92ZVRvIiwiYWRkTGlzdGVuZXIiLCJsaXN0ZW5lciIsInJlZnJlc2hMaXN0ZW5pbmciLCJyZW1vdmVMaXN0ZW5lciIsImdldExpc3RlbmVycyIsInVyaU9yQ29ubmVjdGlvbiIsImlzVHJ1c3RlZCIsImNvbm5lY3Rpb24iLCJNb25lcm9ScGNDb25uZWN0aW9uIiwidXJpIiwiZ2V0VXJpIiwidXNlcm5hbWUiLCJnZXRVc2VybmFtZSIsInByb3h5VXJpIiwiZ2V0UHJveHlVcmkiLCJpc1RydXN0ZWRBcmciLCJzZXRfZGFlbW9uX2Nvbm5lY3Rpb24iLCJpc0RhZW1vblRydXN0ZWQiLCJpc19kYWVtb25fdHJ1c3RlZCIsImdldERhZW1vbkNvbm5lY3Rpb24iLCJjb25uZWN0aW9uQ29udGFpbmVyU3RyIiwiZ2V0X2RhZW1vbl9jb25uZWN0aW9uIiwianNvbkNvbm5lY3Rpb24iLCJpc0Nvbm5lY3RlZFRvRGFlbW9uIiwiaXNfY29ubmVjdGVkX3RvX2RhZW1vbiIsImdldFZlcnNpb24iLCJnZXRJbnRlZ3JhdGVkQWRkcmVzcyIsInN0YW5kYXJkQWRkcmVzcyIsInBheW1lbnRJZCIsInJlc3VsdCIsImdldF9pbnRlZ3JhdGVkX2FkZHJlc3MiLCJjaGFyQXQiLCJNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsImVyciIsIm1lc3NhZ2UiLCJpbmNsdWRlcyIsImRlY29kZUludGVncmF0ZWRBZGRyZXNzIiwiaW50ZWdyYXRlZEFkZHJlc3MiLCJkZWNvZGVfaW50ZWdyYXRlZF9hZGRyZXNzIiwiZ2V0SGVpZ2h0IiwiZ2V0X2hlaWdodCIsImdldERhZW1vbkhlaWdodCIsImdldF9kYWVtb25faGVpZ2h0IiwiZ2V0SGVpZ2h0QnlEYXRlIiwieWVhciIsIm1vbnRoIiwiZGF5IiwiZ2V0X2hlaWdodF9ieV9kYXRlIiwic3luYyIsImxpc3RlbmVyT3JTdGFydEhlaWdodCIsInN0YXJ0SGVpZ2h0IiwiYWxsb3dDb25jdXJyZW50Q2FsbHMiLCJNb25lcm9XYWxsZXRMaXN0ZW5lciIsIk1hdGgiLCJtYXgiLCJ0aGF0Iiwic3luY1dhc20iLCJyZXNwSnNvbiIsIk1vbmVyb1N5bmNSZXN1bHQiLCJudW1CbG9ja3NGZXRjaGVkIiwicmVjZWl2ZWRNb25leSIsImUiLCJzdGFydFN5bmNpbmciLCJzeW5jTG9vcGVyIiwiVGFza0xvb3BlciIsImJhY2tncm91bmRTeW5jIiwic3RhcnQiLCJzdG9wU3luY2luZyIsInN0b3AiLCJzdG9wX3N5bmNpbmciLCJzY2FuVHhzIiwidHhIYXNoZXMiLCJzY2FuX3R4cyIsInJlc2NhblNwZW50IiwicmVzY2FuX3NwZW50IiwicmVzY2FuQmxvY2tjaGFpbiIsInJlc2Nhbl9ibG9ja2NoYWluIiwiZ2V0QmFsYW5jZSIsImFjY291bnRJZHgiLCJzdWJhZGRyZXNzSWR4IiwiYmFsYW5jZVN0ciIsImdldF9iYWxhbmNlX3dhbGxldCIsImdldF9iYWxhbmNlX2FjY291bnQiLCJnZXRfYmFsYW5jZV9zdWJhZGRyZXNzIiwiQmlnSW50Iiwic3RyaW5naWZ5QmlnSW50cyIsImJhbGFuY2UiLCJnZXRVbmxvY2tlZEJhbGFuY2UiLCJ1bmxvY2tlZEJhbGFuY2VTdHIiLCJnZXRfdW5sb2NrZWRfYmFsYW5jZV93YWxsZXQiLCJnZXRfdW5sb2NrZWRfYmFsYW5jZV9hY2NvdW50IiwiZ2V0X3VubG9ja2VkX2JhbGFuY2Vfc3ViYWRkcmVzcyIsInVubG9ja2VkQmFsYW5jZSIsImdldEFjY291bnRzIiwiaW5jbHVkZVN1YmFkZHJlc3NlcyIsInRhZyIsImFjY291bnRzU3RyIiwiZ2V0X2FjY291bnRzIiwiYWNjb3VudHMiLCJhY2NvdW50SnNvbiIsInB1c2giLCJzYW5pdGl6ZUFjY291bnQiLCJNb25lcm9BY2NvdW50IiwiZ2V0QWNjb3VudCIsImFjY291bnRTdHIiLCJnZXRfYWNjb3VudCIsImNyZWF0ZUFjY291bnQiLCJsYWJlbCIsImNyZWF0ZV9hY2NvdW50IiwiZ2V0U3ViYWRkcmVzc2VzIiwic3ViYWRkcmVzc0luZGljZXMiLCJhcmdzIiwibGlzdGlmeSIsInN1YmFkZHJlc3Nlc0pzb24iLCJnZXRfc3ViYWRkcmVzc2VzIiwic3ViYWRkcmVzc2VzIiwic3ViYWRkcmVzc0pzb24iLCJzYW5pdGl6ZVN1YmFkZHJlc3MiLCJNb25lcm9TdWJhZGRyZXNzIiwiY3JlYXRlU3ViYWRkcmVzcyIsInN1YmFkZHJlc3NTdHIiLCJjcmVhdGVfc3ViYWRkcmVzcyIsInNldFN1YmFkZHJlc3NMYWJlbCIsInNldF9zdWJhZGRyZXNzX2xhYmVsIiwiZ2V0VHhzIiwicXVlcnkiLCJxdWVyeU5vcm1hbGl6ZWQiLCJNb25lcm9XYWxsZXQiLCJub3JtYWxpemVUeFF1ZXJ5IiwiZ2V0X3R4cyIsImdldEJsb2NrIiwiYmxvY2tzSnNvblN0ciIsImRlc2VyaWFsaXplVHhzIiwiZ2V0VHJhbnNmZXJzIiwibm9ybWFsaXplVHJhbnNmZXJRdWVyeSIsImdldF90cmFuc2ZlcnMiLCJnZXRUeFF1ZXJ5IiwiZGVzZXJpYWxpemVUcmFuc2ZlcnMiLCJnZXRPdXRwdXRzIiwibm9ybWFsaXplT3V0cHV0UXVlcnkiLCJnZXRfb3V0cHV0cyIsImRlc2VyaWFsaXplT3V0cHV0cyIsImV4cG9ydE91dHB1dHMiLCJhbGwiLCJleHBvcnRfb3V0cHV0cyIsIm91dHB1dHNIZXgiLCJpbXBvcnRPdXRwdXRzIiwiaW1wb3J0X291dHB1dHMiLCJudW1JbXBvcnRlZCIsImV4cG9ydEtleUltYWdlcyIsImV4cG9ydF9rZXlfaW1hZ2VzIiwicmVzdWx0U3RyIiwicmVzdWx0SnNvbiIsImtleUltYWdlcyIsIk1vbmVyb0tleUltYWdlRXhwb3J0UmVzdWx0IiwiaW1wb3J0S2V5SW1hZ2VzIiwib2Zmc2V0IiwiaW1wb3J0X2tleV9pbWFnZXMiLCJtYXAiLCJrZXlJbWFnZSIsImtleUltYWdlSW1wb3J0UmVzdWx0U3RyIiwiTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQiLCJnZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCIsImZyZWV6ZU91dHB1dCIsImZyZWV6ZV9vdXRwdXQiLCJ0aGF3T3V0cHV0IiwidGhhd19vdXRwdXQiLCJpc091dHB1dEZyb3plbiIsImlzX291dHB1dF9mcm96ZW4iLCJnZXREZWZhdWx0RmVlUHJpb3JpdHkiLCJnZXRfZGVmYXVsdF9mZWVfcHJpb3JpdHkiLCJjcmVhdGVUeHMiLCJjb25maWdOb3JtYWxpemVkIiwibm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnIiwiZ2V0Q2FuU3BsaXQiLCJzZXRDYW5TcGxpdCIsImNyZWF0ZV90eHMiLCJ0eFNldEpzb25TdHIiLCJNb25lcm9UeFNldCIsInN3ZWVwT3V0cHV0Iiwibm9ybWFsaXplU3dlZXBPdXRwdXRDb25maWciLCJzd2VlcF9vdXRwdXQiLCJzd2VlcFVubG9ja2VkIiwibm9ybWFsaXplU3dlZXBVbmxvY2tlZENvbmZpZyIsInN3ZWVwX3VubG9ja2VkIiwidHhTZXRzSnNvbiIsInR4U2V0cyIsInR4U2V0SnNvbiIsInR4cyIsInR4U2V0IiwidHgiLCJzd2VlcER1c3QiLCJyZWxheSIsInN3ZWVwX2R1c3QiLCJzZXRUeHMiLCJyZWxheVR4cyIsInR4c09yTWV0YWRhdGFzIiwiQXJyYXkiLCJpc0FycmF5IiwidHhNZXRhZGF0YXMiLCJ0eE9yTWV0YWRhdGEiLCJNb25lcm9UeFdhbGxldCIsImdldE1ldGFkYXRhIiwicmVsYXlfdHhzIiwidHhIYXNoZXNKc29uIiwiZGVzY3JpYmVUeFNldCIsInVuc2lnbmVkVHhIZXgiLCJnZXRVbnNpZ25lZFR4SGV4Iiwic2lnbmVkVHhIZXgiLCJnZXRTaWduZWRUeEhleCIsIm11bHRpc2lnVHhIZXgiLCJnZXRNdWx0aXNpZ1R4SGV4IiwiZGVzY3JpYmVfdHhfc2V0IiwiZ2V0X2V4Y2VwdGlvbl9tZXNzYWdlIiwic2lnblR4cyIsInNpZ25fdHhzIiwic3VibWl0VHhzIiwic3VibWl0X3R4cyIsInNpZ25NZXNzYWdlIiwic2lnbmF0dXJlVHlwZSIsIk1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIiwiU0lHTl9XSVRIX1NQRU5EX0tFWSIsInNpZ25fbWVzc2FnZSIsInZlcmlmeU1lc3NhZ2UiLCJhZGRyZXNzIiwic2lnbmF0dXJlIiwidmVyaWZ5X21lc3NhZ2UiLCJpc0dvb2QiLCJNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0IiwiaXNPbGQiLCJTSUdOX1dJVEhfVklFV19LRVkiLCJ2ZXJzaW9uIiwiZ2V0VHhLZXkiLCJ0eEhhc2giLCJnZXRfdHhfa2V5IiwiY2hlY2tUeEtleSIsInR4S2V5IiwiY2hlY2tfdHhfa2V5IiwicmVzcEpzb25TdHIiLCJNb25lcm9DaGVja1R4IiwiZ2V0VHhQcm9vZiIsImdldF90eF9wcm9vZiIsImVycm9yS2V5IiwiaW5kZXhPZiIsInN1YnN0cmluZyIsImxlbmd0aCIsImNoZWNrVHhQcm9vZiIsImNoZWNrX3R4X3Byb29mIiwiZ2V0U3BlbmRQcm9vZiIsImdldF9zcGVuZF9wcm9vZiIsImNoZWNrU3BlbmRQcm9vZiIsImNoZWNrX3NwZW5kX3Byb29mIiwiZ2V0UmVzZXJ2ZVByb29mV2FsbGV0IiwiZ2V0X3Jlc2VydmVfcHJvb2Zfd2FsbGV0IiwiZ2V0UmVzZXJ2ZVByb29mQWNjb3VudCIsImFtb3VudCIsImdldF9yZXNlcnZlX3Byb29mX2FjY291bnQiLCJ0b1N0cmluZyIsImNoZWNrUmVzZXJ2ZVByb29mIiwiY2hlY2tfcmVzZXJ2ZV9wcm9vZiIsIk1vbmVyb0NoZWNrUmVzZXJ2ZSIsImdldFR4Tm90ZXMiLCJnZXRfdHhfbm90ZXMiLCJ0eE5vdGVzIiwic2V0VHhOb3RlcyIsIm5vdGVzIiwic2V0X3R4X25vdGVzIiwiZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzIiwiZW50cnlJbmRpY2VzIiwiZW50cmllcyIsImVudHJ5SnNvbiIsImdldF9hZGRyZXNzX2Jvb2tfZW50cmllcyIsIk1vbmVyb0FkZHJlc3NCb29rRW50cnkiLCJhZGRBZGRyZXNzQm9va0VudHJ5IiwiZGVzY3JpcHRpb24iLCJhZGRfYWRkcmVzc19ib29rX2VudHJ5IiwiZWRpdEFkZHJlc3NCb29rRW50cnkiLCJpbmRleCIsInNldEFkZHJlc3MiLCJzZXREZXNjcmlwdGlvbiIsImVkaXRfYWRkcmVzc19ib29rX2VudHJ5IiwiZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeSIsImVudHJ5SWR4IiwiZGVsZXRlX2FkZHJlc3NfYm9va19lbnRyeSIsInRhZ0FjY291bnRzIiwiYWNjb3VudEluZGljZXMiLCJ0YWdfYWNjb3VudHMiLCJ1bnRhZ0FjY291bnRzIiwiZ2V0QWNjb3VudFRhZ3MiLCJhY2NvdW50VGFncyIsImFjY291bnRUYWdKc29uIiwiZ2V0X2FjY291bnRfdGFncyIsIk1vbmVyb0FjY291bnRUYWciLCJzZXRBY2NvdW50VGFnTGFiZWwiLCJzZXRfYWNjb3VudF90YWdfbGFiZWwiLCJnZXRQYXltZW50VXJpIiwiZ2V0X3BheW1lbnRfdXJpIiwicGFyc2VQYXltZW50VXJpIiwiTW9uZXJvVHhDb25maWciLCJwYXJzZV9wYXltZW50X3VyaSIsImdldEF0dHJpYnV0ZSIsImtleSIsInZhbHVlIiwiZ2V0X2F0dHJpYnV0ZSIsInNldEF0dHJpYnV0ZSIsInZhbCIsInNldF9hdHRyaWJ1dGUiLCJzdGFydE1pbmluZyIsIm51bVRocmVhZHMiLCJiYWNrZ3JvdW5kTWluaW5nIiwiaWdub3JlQmF0dGVyeSIsImRhZW1vbiIsIk1vbmVyb0RhZW1vblJwYyIsImNvbm5lY3RUb0RhZW1vblJwYyIsInN0b3BNaW5pbmciLCJpc011bHRpc2lnSW1wb3J0TmVlZGVkIiwiaXNfbXVsdGlzaWdfaW1wb3J0X25lZWRlZCIsImlzTXVsdGlzaWciLCJpc19tdWx0aXNpZyIsImdldE11bHRpc2lnSW5mbyIsIk1vbmVyb011bHRpc2lnSW5mbyIsImdldF9tdWx0aXNpZ19pbmZvIiwicHJlcGFyZU11bHRpc2lnIiwicHJlcGFyZV9tdWx0aXNpZyIsIm1ha2VNdWx0aXNpZyIsIm11bHRpc2lnSGV4ZXMiLCJ0aHJlc2hvbGQiLCJtYWtlX211bHRpc2lnIiwiZXhjaGFuZ2VNdWx0aXNpZ0tleXMiLCJleGNoYW5nZV9tdWx0aXNpZ19rZXlzIiwiTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IiwiZXhwb3J0TXVsdGlzaWdIZXgiLCJleHBvcnRfbXVsdGlzaWdfaGV4IiwiaW1wb3J0TXVsdGlzaWdIZXgiLCJyZWZyZXNoQWZ0ZXJJbXBvcnQiLCJpbXBvcnRfbXVsdGlzaWdfaGV4Iiwic2lnbk11bHRpc2lnVHhIZXgiLCJzaWduX211bHRpc2lnX3R4X2hleCIsIk1vbmVyb011bHRpc2lnU2lnblJlc3VsdCIsInN1Ym1pdE11bHRpc2lnVHhIZXgiLCJzaWduZWRNdWx0aXNpZ1R4SGV4Iiwic3VibWl0X211bHRpc2lnX3R4X2hleCIsImdldERhdGEiLCJ2aWV3T25seSIsImlzVmlld09ubHkiLCJ2aWV3cyIsImNhY2hlQnVmZmVyTG9jIiwiZ2V0X2NhY2hlX2ZpbGVfYnVmZmVyIiwidmlldyIsIkRhdGFWaWV3IiwiQXJyYXlCdWZmZXIiLCJpIiwic2V0SW50OCIsIkhFQVBVOCIsInBvaW50ZXIiLCJVaW50OEFycmF5IiwiQllURVNfUEVSX0VMRU1FTlQiLCJfZnJlZSIsIkJ1ZmZlciIsImZyb20iLCJidWZmZXIiLCJrZXlzQnVmZmVyTG9jIiwiZ2V0X2tleXNfZmlsZV9idWZmZXIiLCJ1bnNoaWZ0IiwiY2hhbmdlUGFzc3dvcmQiLCJvbGRQYXNzd29yZCIsIm5ld1Bhc3N3b3JkIiwiY2hhbmdlX3dhbGxldF9wYXNzd29yZCIsImVyck1zZyIsImNsb3NlIiwiZ2V0TnVtQmxvY2tzVG9VbmxvY2siLCJnZXRUeCIsImdldEluY29taW5nVHJhbnNmZXJzIiwiZ2V0T3V0Z29pbmdUcmFuc2ZlcnMiLCJjcmVhdGVUeCIsInJlbGF5VHgiLCJnZXRUeE5vdGUiLCJzZXRUeE5vdGUiLCJub3RlIiwicHJveHlUb1dvcmtlciIsIm5ldHdvcmtUeXBlIiwiZGFlbW9uVXJpIiwiZGFlbW9uVXNlcm5hbWUiLCJkYWVtb25QYXNzd29yZCIsIm9wZW5fd2FsbGV0X2Z1bGwiLCJrZXlzRGF0YSIsImNhY2hlRGF0YSIsImdldFJlZ3Rlc3QiLCJicm93c2VyTWFpblBhdGgiLCJjb25zb2xlIiwiZXJyb3IiLCJpc0VuYWJsZWQiLCJzZXRfbGlzdGVuZXIiLCJuZXdMaXN0ZW5lckhhbmRsZSIsImhlaWdodCIsImVuZEhlaWdodCIsInBlcmNlbnREb25lIiwib25TeW5jUHJvZ3Jlc3MiLCJvbk5ld0Jsb2NrIiwibmV3QmFsYW5jZVN0ciIsIm5ld1VubG9ja2VkQmFsYW5jZVN0ciIsIm9uQmFsYW5jZXNDaGFuZ2VkIiwiYW1vdW50U3RyIiwidW5sb2NrVGltZSIsImlzTG9ja2VkIiwib25PdXRwdXRSZWNlaXZlZCIsImFjY291bnRJZHhTdHIiLCJzdWJhZGRyZXNzSWR4U3RyIiwib25PdXRwdXRTcGVudCIsInNhbml0aXplQmxvY2siLCJibG9jayIsInNhbml0aXplVHhXYWxsZXQiLCJhY2NvdW50Iiwic3ViYWRkcmVzcyIsImRlc2VyaWFsaXplQmxvY2tzIiwiYmxvY2tzSnNvbiIsImRlc2VyaWFsaXplZEJsb2NrcyIsImJsb2NrcyIsImJsb2NrSnNvbiIsIk1vbmVyb0Jsb2NrIiwiRGVzZXJpYWxpemF0aW9uVHlwZSIsIlRYX1dBTExFVCIsInNldEJsb2NrIiwiZ2V0SGFzaGVzIiwidHhNYXAiLCJNYXAiLCJnZXRIYXNoIiwidHhzU29ydGVkIiwidHJhbnNmZXJzIiwiZ2V0T3V0Z29pbmdUcmFuc2ZlciIsInRyYW5zZmVyIiwib3V0cHV0cyIsIm91dHB1dCIsInNldEJyb3dzZXJNYWluUGF0aCIsIlBhdGgiLCJub3JtYWxpemUiLCJpc0Nsb3NlZCIsIndhbGxldERpciIsImRpcm5hbWUiLCJta2RpciIsImRhdGEiLCJ3cml0ZUZpbGUiLCJvbGRQYXRoIiwidW5saW5rIiwicGF0aE5ldyIsInJlbmFtZSIsImV4cG9ydHMiLCJkZWZhdWx0IiwiTW9uZXJvV2FsbGV0S2V5c1Byb3h5Iiwid2FsbGV0SWQiLCJpbnZva2VXb3JrZXIiLCJnZXRXb3JrZXIiLCJ3b3JrZXIiLCJ3cmFwcGVkTGlzdGVuZXJzIiwiYXJndW1lbnRzIiwidXJpT3JScGNDb25uZWN0aW9uIiwiZ2V0Q29uZmlnIiwicnBjQ29uZmlnIiwid3JhcHBlZExpc3RlbmVyIiwiV2FsbGV0V29ya2VyTGlzdGVuZXIiLCJsaXN0ZW5lcklkIiwiZ2V0SWQiLCJhZGRXb3JrZXJDYWxsYmFjayIsImdldExpc3RlbmVyIiwicmVtb3ZlV29ya2VyQ2FsbGJhY2siLCJzcGxpY2UiLCJibG9ja0pzb25zIiwia2V5SW1hZ2VzSnNvbiIsImFubm91bmNlU3luY1Byb2dyZXNzIiwiYW5ub3VuY2VOZXdCbG9jayIsImFubm91bmNlQmFsYW5jZXNDaGFuZ2VkIiwiTW9uZXJvT3V0cHV0V2FsbGV0Iiwic2V0QW1vdW50Iiwic2V0QWNjb3VudEluZGV4Iiwic2V0U3ViYWRkcmVzc0luZGV4Iiwic2V0SGFzaCIsInNldFZlcnNpb24iLCJzZXRVbmxvY2tUaW1lIiwic2V0VHgiLCJzZXRPdXRwdXRzIiwic2V0SXNJbmNvbWluZyIsInNldElzTG9ja2VkIiwic2V0SGVpZ2h0Iiwic2V0SXNDb25maXJtZWQiLCJzZXRJblR4UG9vbCIsInNldElzRmFpbGVkIiwiYW5ub3VuY2VPdXRwdXRSZWNlaXZlZCIsInBhcnNlSW50Iiwic2V0SW5wdXRzIiwiYW5ub3VuY2VPdXRwdXRTcGVudCIsImlkIiwiZ2V0SW5wdXRzIl0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvd2FsbGV0L01vbmVyb1dhbGxldEZ1bGwudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XG5pbXBvcnQgUGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IEdlblV0aWxzIGZyb20gXCIuLi9jb21tb24vR2VuVXRpbHNcIjtcbmltcG9ydCBMaWJyYXJ5VXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9MaWJyYXJ5VXRpbHNcIjtcbmltcG9ydCBUYXNrTG9vcGVyIGZyb20gXCIuLi9jb21tb24vVGFza0xvb3BlclwiO1xuaW1wb3J0IE1vbmVyb0FjY291bnQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWNjb3VudFwiO1xuaW1wb3J0IE1vbmVyb0FjY291bnRUYWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWNjb3VudFRhZ1wiO1xuaW1wb3J0IE1vbmVyb0FkZHJlc3NCb29rRW50cnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeVwiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvQmxvY2tcIjtcbmltcG9ydCBNb25lcm9DaGVja1R4IGZyb20gXCIuL21vZGVsL01vbmVyb0NoZWNrVHhcIjtcbmltcG9ydCBNb25lcm9DaGVja1Jlc2VydmUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQ2hlY2tSZXNlcnZlXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uUnBjIGZyb20gXCIuLi9kYWVtb24vTW9uZXJvRGFlbW9uUnBjXCI7XG5pbXBvcnQgTW9uZXJvRXJyb3IgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9FcnJvclwiO1xuaW1wb3J0IE1vbmVyb0luY29taW5nVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvSW5jb21pbmdUcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzIGZyb20gXCIuL21vZGVsL01vbmVyb0ludGVncmF0ZWRBZGRyZXNzXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2UgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9LZXlJbWFnZVwiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlRXhwb3J0UmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb0tleUltYWdlRXhwb3J0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ0luZm8gZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdJbmZvXCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnSW5pdFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnU2lnblJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHRcIjtcbmltcG9ydCBNb25lcm9OZXR3b3JrVHlwZSBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb05ldHdvcmtUeXBlXCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0UXVlcnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0UXVlcnlcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRXYWxsZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0V2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvUnBjQ29ubmVjdGlvbiBmcm9tIFwiLi4vY29tbW9uL01vbmVyb1JwY0Nvbm5lY3Rpb25cIjtcbmltcG9ydCBNb25lcm9TdWJhZGRyZXNzIGZyb20gXCIuL21vZGVsL01vbmVyb1N1YmFkZHJlc3NcIjtcbmltcG9ydCBNb25lcm9TeW5jUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb1N5bmNSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9UcmFuc2ZlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb1RyYW5zZmVyUXVlcnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHJhbnNmZXJRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb1R4Q29uZmlnIGZyb20gXCIuL21vZGVsL01vbmVyb1R4Q29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvVHhQcmlvcml0eSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFByaW9yaXR5XCI7XG5pbXBvcnQgTW9uZXJvVHhRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvVHhTZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhTZXRcIjtcbmltcG9ydCBNb25lcm9UeCBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb1R4XCI7XG5pbXBvcnQgTW9uZXJvVHhXYWxsZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhXYWxsZXRcIjtcbmltcG9ydCBNb25lcm9XYWxsZXQgZnJvbSBcIi4vTW9uZXJvV2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0Q29uZmlnIGZyb20gXCIuL21vZGVsL01vbmVyb1dhbGxldENvbmZpZ1wiO1xuaW1wb3J0IHsgTW9uZXJvV2FsbGV0S2V5cywgTW9uZXJvV2FsbGV0S2V5c1Byb3h5IH0gZnJvbSBcIi4vTW9uZXJvV2FsbGV0S2V5c1wiO1xuaW1wb3J0IE1vbmVyb1dhbGxldExpc3RlbmVyIGZyb20gXCIuL21vZGVsL01vbmVyb1dhbGxldExpc3RlbmVyXCI7XG5pbXBvcnQgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGVcIjtcbmltcG9ydCBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9WZXJzaW9uIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvVmVyc2lvblwiO1xuaW1wb3J0IGZzIGZyb20gXCJmc1wiO1xuXG4vKipcbiAqIEltcGxlbWVudHMgYSBNb25lcm8gd2FsbGV0IHVzaW5nIGNsaWVudC1zaWRlIFdlYkFzc2VtYmx5IGJpbmRpbmdzIHRvIG1vbmVyby1wcm9qZWN0J3Mgd2FsbGV0MiBpbiBDKysuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1vbmVyb1dhbGxldEZ1bGwgZXh0ZW5kcyBNb25lcm9XYWxsZXRLZXlzIHtcblxuICAvLyBzdGF0aWMgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBzdGF0aWMgcmVhZG9ubHkgREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyA9IDIwMDAwO1xuICBwcm90ZWN0ZWQgc3RhdGljIEZTO1xuXG4gIC8vIGluc3RhbmNlIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgcGF0aDogc3RyaW5nO1xuICBwcm90ZWN0ZWQgcGFzc3dvcmQ6IHN0cmluZztcbiAgcHJvdGVjdGVkIGxpc3RlbmVyczogTW9uZXJvV2FsbGV0TGlzdGVuZXJbXTtcbiAgcHJvdGVjdGVkIGZzOiBhbnk7XG4gIHByb3RlY3RlZCB3YXNtTGlzdGVuZXI6IFdhbGxldFdhc21MaXN0ZW5lcjtcbiAgcHJvdGVjdGVkIHdhc21MaXN0ZW5lckhhbmRsZTogbnVtYmVyO1xuICBwcm90ZWN0ZWQgcmVqZWN0VW5hdXRob3JpemVkOiBib29sZWFuO1xuICBwcm90ZWN0ZWQgcmVqZWN0VW5hdXRob3JpemVkQ29uZmlnSWQ6IHN0cmluZztcbiAgcHJvdGVjdGVkIHN5bmNQZXJpb2RJbk1zOiBudW1iZXI7XG4gIHByb3RlY3RlZCBzeW5jTG9vcGVyOiBUYXNrTG9vcGVyO1xuICBwcm90ZWN0ZWQgYnJvd3Nlck1haW5QYXRoOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIEludGVybmFsIGNvbnN0cnVjdG9yIHdoaWNoIGlzIGdpdmVuIHRoZSBtZW1vcnkgYWRkcmVzcyBvZiBhIEMrKyB3YWxsZXQgaW5zdGFuY2UuXG4gICAqIFxuICAgKiBUaGlzIGNvbnN0cnVjdG9yIHNob3VsZCBiZSBjYWxsZWQgdGhyb3VnaCBzdGF0aWMgd2FsbGV0IGNyZWF0aW9uIHV0aWxpdGllcyBpbiB0aGlzIGNsYXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGNwcEFkZHJlc3MgLSBhZGRyZXNzIG9mIHRoZSB3YWxsZXQgaW5zdGFuY2UgaW4gQysrXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gcGF0aCBvZiB0aGUgd2FsbGV0IGluc3RhbmNlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXNzd29yZCAtIHBhc3N3b3JkIG9mIHRoZSB3YWxsZXQgaW5zdGFuY2VcbiAgICogQHBhcmFtIHtGaWxlU3lzdGVtfSBmcyAtIG5vZGUuanMtY29tcGF0aWJsZSBmaWxlIHN5c3RlbSB0byByZWFkL3dyaXRlIHdhbGxldCBmaWxlc1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHJlamVjdFVuYXV0aG9yaXplZCAtIHNwZWNpZmllcyBpZiB1bmF1dGhvcml6ZWQgcmVxdWVzdHMgKGUuZy4gc2VsZi1zaWduZWQgY2VydGlmaWNhdGVzKSBzaG91bGQgYmUgcmVqZWN0ZWRcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJlamVjdFVuYXV0aG9yaXplZEZuSWQgLSB1bmlxdWUgaWRlbnRpZmllciBmb3IgaHR0cF9jbGllbnRfd2FzbSB0byBxdWVyeSByZWplY3RVbmF1dGhvcml6ZWRcbiAgICogQHBhcmFtIHtNb25lcm9XYWxsZXRGdWxsUHJveHl9IHdhbGxldFByb3h5IC0gcHJveHkgdG8gaW52b2tlIHdhbGxldCBvcGVyYXRpb25zIGluIGEgd2ViIHdvcmtlclxuICAgKiBcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGNvbnN0cnVjdG9yKGNwcEFkZHJlc3MsIHBhdGgsIHBhc3N3b3JkLCBmcywgcmVqZWN0VW5hdXRob3JpemVkLCByZWplY3RVbmF1dGhvcml6ZWRGbklkLCB3YWxsZXRQcm94eT86IE1vbmVyb1dhbGxldEZ1bGxQcm94eSkge1xuICAgIHN1cGVyKGNwcEFkZHJlc3MsIHdhbGxldFByb3h5KTtcbiAgICBpZiAod2FsbGV0UHJveHkpIHJldHVybjtcbiAgICB0aGlzLnBhdGggPSBwYXRoO1xuICAgIHRoaXMucGFzc3dvcmQgPSBwYXNzd29yZDtcbiAgICB0aGlzLmxpc3RlbmVycyA9IFtdO1xuICAgIHRoaXMuZnMgPSBmcyA/IGZzIDogKHBhdGggPyBNb25lcm9XYWxsZXRGdWxsLmdldEZzKCkgOiB1bmRlZmluZWQpO1xuICAgIHRoaXMuX2lzQ2xvc2VkID0gZmFsc2U7XG4gICAgdGhpcy53YXNtTGlzdGVuZXIgPSBuZXcgV2FsbGV0V2FzbUxpc3RlbmVyKHRoaXMpOyAvLyByZWNlaXZlcyBub3RpZmljYXRpb25zIGZyb20gd2FzbSBjKytcbiAgICB0aGlzLndhc21MaXN0ZW5lckhhbmRsZSA9IDA7ICAgICAgICAgICAgICAgICAgICAgIC8vIG1lbW9yeSBhZGRyZXNzIG9mIHRoZSB3YWxsZXQgbGlzdGVuZXIgaW4gYysrXG4gICAgdGhpcy5yZWplY3RVbmF1dGhvcml6ZWQgPSByZWplY3RVbmF1dGhvcml6ZWQ7XG4gICAgdGhpcy5yZWplY3RVbmF1dGhvcml6ZWRDb25maWdJZCA9IHJlamVjdFVuYXV0aG9yaXplZEZuSWQ7XG4gICAgdGhpcy5zeW5jUGVyaW9kSW5NcyA9IE1vbmVyb1dhbGxldEZ1bGwuREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUztcbiAgICBMaWJyYXJ5VXRpbHMuc2V0UmVqZWN0VW5hdXRob3JpemVkRm4ocmVqZWN0VW5hdXRob3JpemVkRm5JZCwgKCkgPT4gdGhpcy5yZWplY3RVbmF1dGhvcml6ZWQpOyAvLyByZWdpc3RlciBmbiBpbmZvcm1pbmcgaWYgdW5hdXRob3JpemVkIHJlcXMgc2hvdWxkIGJlIHJlamVjdGVkXG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU1RBVElDIFVUSUxJVElFUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgLyoqXG4gICAqIENoZWNrIGlmIGEgd2FsbGV0IGV4aXN0cyBhdCBhIGdpdmVuIHBhdGguXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIHBhdGggb2YgdGhlIHdhbGxldCBvbiB0aGUgZmlsZSBzeXN0ZW1cbiAgICogQHBhcmFtIHthbnl9IGZzIC0gZmlsZSBzeXN0ZW0gY29tcGF0aWJsZSB3aXRoIE5vZGUuanMgYGZzLnByb21pc2VzYCBBUEkgKGRlZmF1bHRzIHRvIGRpc2sgb3IgaW4tbWVtb3J5IEZTIGlmIGJyb3dzZXIpXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgYSB3YWxsZXQgZXhpc3RzIGF0IHRoZSBnaXZlbiBwYXRoLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBhc3luYyB3YWxsZXRFeGlzdHMocGF0aCwgZnMpIHtcbiAgICBhc3NlcnQocGF0aCwgXCJNdXN0IHByb3ZpZGUgYSBwYXRoIHRvIGxvb2sgZm9yIGEgd2FsbGV0XCIpO1xuICAgIGlmICghZnMpIGZzID0gTW9uZXJvV2FsbGV0RnVsbC5nZXRGcygpO1xuICAgIGlmICghZnMpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBmaWxlIHN5c3RlbSB0byBjaGVjayBpZiB3YWxsZXQgZXhpc3RzXCIpO1xuICAgIGxldCBleGlzdHMgPSBhd2FpdCBMaWJyYXJ5VXRpbHMuZXhpc3RzKGZzLCBwYXRoICsgXCIua2V5c1wiKTtcbiAgICBMaWJyYXJ5VXRpbHMubG9nKDEsIFwiV2FsbGV0IGV4aXN0cyBhdCBcIiArIHBhdGggKyBcIjogXCIgKyBleGlzdHMpO1xuICAgIHJldHVybiBleGlzdHM7XG4gIH1cbiAgXG4gIHN0YXRpYyBhc3luYyBvcGVuV2FsbGV0KGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KSB7XG5cbiAgICAvLyB2YWxpZGF0ZSBjb25maWdcbiAgICBjb25maWcgPSBuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKGNvbmZpZyk7XG4gICAgaWYgKGNvbmZpZy5nZXRQcm94eVRvV29ya2VyKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFByb3h5VG9Xb3JrZXIodHJ1ZSk7XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgc2VlZCB3aGVuIG9wZW5pbmcgd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0U2VlZE9mZnNldCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHNlZWQgb2Zmc2V0IHdoZW4gb3BlbmluZyB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQcmltYXJ5QWRkcmVzcygpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHByaW1hcnkgYWRkcmVzcyB3aGVuIG9wZW5pbmcgd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0UHJpdmF0ZVZpZXdLZXkoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3BlY2lmeSBwcml2YXRlIHZpZXcga2V5IHdoZW4gb3BlbmluZyB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQcml2YXRlU3BlbmRLZXkoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3BlY2lmeSBwcml2YXRlIHNwZW5kIGtleSB3aGVuIG9wZW5pbmcgd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHJlc3RvcmUgaGVpZ2h0IHdoZW4gb3BlbmluZyB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRMYW5ndWFnZSgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IGxhbmd1YWdlIHdoZW4gb3BlbmluZyB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTYXZlQ3VycmVudCgpID09PSB0cnVlKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc2F2ZSBjdXJyZW50IHdhbGxldCB3aGVuIG9wZW5pbmcgZnVsbCB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRGcygpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRGcyhNb25lcm9XYWxsZXRGdWxsLmdldEZzKCkpO1xuXG4gICAgLy8gc2V0IHNlcnZlciBmcm9tIGNvbm5lY3Rpb24gbWFuYWdlciBpZiBwcm92aWRlZFxuICAgIGlmIChjb25maWcuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSkge1xuICAgICAgaWYgKGNvbmZpZy5nZXRTZXJ2ZXIoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGNhbiBiZSBvcGVuZWQgd2l0aCBhIHNlcnZlciBvciBjb25uZWN0aW9uIG1hbmFnZXIgYnV0IG5vdCBib3RoXCIpO1xuICAgICAgY29uZmlnLnNldFNlcnZlcihjb25maWcuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKS5nZXRDb25uZWN0aW9uKCkpO1xuICAgIH1cblxuICAgIC8vIHJlYWQgd2FsbGV0IGRhdGEgZnJvbSBkaXNrIHVubGVzcyBwcm92aWRlZFxuICAgIGlmICghY29uZmlnLmdldEtleXNEYXRhKCkpIHtcbiAgICAgIGxldCBmcyA9IGNvbmZpZy5nZXRGcygpO1xuICAgICAgaWYgKCFmcykgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGZpbGUgc3lzdGVtIHRvIHJlYWQgd2FsbGV0IGRhdGEgZnJvbVwiKTtcbiAgICAgIGlmICghYXdhaXQgdGhpcy53YWxsZXRFeGlzdHMoY29uZmlnLmdldFBhdGgoKSwgZnMpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgZG9lcyBub3QgZXhpc3QgYXQgcGF0aDogXCIgKyBjb25maWcuZ2V0UGF0aCgpKTtcbiAgICAgIGNvbmZpZy5zZXRLZXlzRGF0YShhd2FpdCBmcy5yZWFkRmlsZShjb25maWcuZ2V0UGF0aCgpICsgXCIua2V5c1wiKSk7XG4gICAgICBjb25maWcuc2V0Q2FjaGVEYXRhKGF3YWl0IExpYnJhcnlVdGlscy5leGlzdHMoZnMsIGNvbmZpZy5nZXRQYXRoKCkpID8gYXdhaXQgZnMucmVhZEZpbGUoY29uZmlnLmdldFBhdGgoKSkgOiBcIlwiKTtcbiAgICB9XG5cbiAgICAvLyBvcGVuIHdhbGxldCBmcm9tIGRhdGFcbiAgICBjb25zdCB3YWxsZXQgPSBhd2FpdCBNb25lcm9XYWxsZXRGdWxsLm9wZW5XYWxsZXREYXRhKGNvbmZpZyk7XG5cbiAgICAvLyBhcHBseSBleHBsaWNpdCBkYWVtb24gdHJ1c3RcbiAgICBpZiAoY29uZmlnLmdldElzVHJ1c3RlZERhZW1vbigpICE9PSB1bmRlZmluZWQgJiYgY29uZmlnLmdldFNlcnZlcigpKSBhd2FpdCB3YWxsZXQuc2V0RGFlbW9uQ29ubmVjdGlvbihjb25maWcuZ2V0U2VydmVyKCksIGNvbmZpZy5nZXRJc1RydXN0ZWREYWVtb24oKSk7XG5cbiAgICAvLyBzZXQgY29ubmVjdGlvbiBtYW5hZ2VyXG4gICAgYXdhaXQgd2FsbGV0LnNldENvbm5lY3Rpb25NYW5hZ2VyKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpKTtcbiAgICByZXR1cm4gd2FsbGV0O1xuICB9XG4gIFxuICBzdGF0aWMgYXN5bmMgY3JlYXRlV2FsbGV0KGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKTogUHJvbWlzZTxNb25lcm9XYWxsZXRGdWxsPiB7XG5cbiAgICAvLyB2YWxpZGF0ZSBjb25maWdcbiAgICBpZiAoY29uZmlnID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBjb25maWcgdG8gY3JlYXRlIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFNlZWQoKSAhPT0gdW5kZWZpbmVkICYmIChjb25maWcuZ2V0UHJpbWFyeUFkZHJlc3MoKSAhPT0gdW5kZWZpbmVkIHx8IGNvbmZpZy5nZXRQcml2YXRlVmlld0tleSgpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldFByaXZhdGVTcGVuZEtleSgpICE9PSB1bmRlZmluZWQpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgbWF5IGJlIGluaXRpYWxpemVkIHdpdGggYSBzZWVkIG9yIGtleXMgYnV0IG5vdCBib3RoXCIpO1xuICAgIGlmIChjb25maWcuZ2V0TmV0d29ya1R5cGUoKSA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgYSBuZXR3b3JrVHlwZTogJ21haW5uZXQnLCAndGVzdG5ldCcgb3IgJ3N0YWdlbmV0J1wiKTtcbiAgICBNb25lcm9OZXR3b3JrVHlwZS52YWxpZGF0ZShjb25maWcuZ2V0TmV0d29ya1R5cGUoKSk7XG4gICAgaWYgKGNvbmZpZy5nZXRTYXZlQ3VycmVudCgpID09PSB0cnVlKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc2F2ZSBjdXJyZW50IHdhbGxldCB3aGVuIGNyZWF0aW5nIGZ1bGwgV0FTTSB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFBhdGgoXCJcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkgJiYgYXdhaXQgTW9uZXJvV2FsbGV0RnVsbC53YWxsZXRFeGlzdHMoY29uZmlnLmdldFBhdGgoKSwgY29uZmlnLmdldEZzKCkpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgYWxyZWFkeSBleGlzdHM6IFwiICsgY29uZmlnLmdldFBhdGgoKSk7XG4gICAgaWYgKGNvbmZpZy5nZXRQYXNzd29yZCgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRQYXNzd29yZChcIlwiKTtcblxuICAgIC8vIHNldCBzZXJ2ZXIgZnJvbSBjb25uZWN0aW9uIG1hbmFnZXIgaWYgcHJvdmlkZWRcbiAgICBpZiAoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpIHtcbiAgICAgIGlmIChjb25maWcuZ2V0U2VydmVyKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBjYW4gYmUgY3JlYXRlZCB3aXRoIGEgc2VydmVyIG9yIGNvbm5lY3Rpb24gbWFuYWdlciBidXQgbm90IGJvdGhcIik7XG4gICAgICBjb25maWcuc2V0U2VydmVyKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpLmdldENvbm5lY3Rpb24oKSk7XG4gICAgfVxuXG4gICAgLy8gY3JlYXRlIHByb3hpZWQgb3IgbG9jYWwgd2FsbGV0XG4gICAgbGV0IHdhbGxldDtcbiAgICBpZiAoY29uZmlnLmdldFByb3h5VG9Xb3JrZXIoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UHJveHlUb1dvcmtlcih0cnVlKTtcbiAgICBpZiAoY29uZmlnLmdldFByb3h5VG9Xb3JrZXIoKSkge1xuICAgICAgbGV0IHdhbGxldFByb3h5ID0gYXdhaXQgTW9uZXJvV2FsbGV0RnVsbFByb3h5LmNyZWF0ZVdhbGxldChjb25maWcpO1xuICAgICAgd2FsbGV0ID0gbmV3IE1vbmVyb1dhbGxldEZ1bGwodW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgd2FsbGV0UHJveHkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoY29uZmlnLmdldFNlZWQoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmIChjb25maWcuZ2V0TGFuZ3VhZ2UoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSBsYW5ndWFnZSB3aGVuIGNyZWF0aW5nIHdhbGxldCBmcm9tIHNlZWRcIik7XG4gICAgICAgIHdhbGxldCA9IGF3YWl0IE1vbmVyb1dhbGxldEZ1bGwuY3JlYXRlV2FsbGV0RnJvbVNlZWQoY29uZmlnKTtcbiAgICAgIH0gZWxzZSBpZiAoY29uZmlnLmdldFByaXZhdGVTcGVuZEtleSgpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldFByaW1hcnlBZGRyZXNzKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAoY29uZmlnLmdldFNlZWRPZmZzZXQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSBzZWVkT2Zmc2V0IHdoZW4gY3JlYXRpbmcgd2FsbGV0IGZyb20ga2V5c1wiKTtcbiAgICAgICAgd2FsbGV0ID0gYXdhaXQgTW9uZXJvV2FsbGV0RnVsbC5jcmVhdGVXYWxsZXRGcm9tS2V5cyhjb25maWcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgc2VlZE9mZnNldCB3aGVuIGNyZWF0aW5nIHJhbmRvbSB3YWxsZXRcIik7XG4gICAgICAgIGlmIChjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHJlc3RvcmVIZWlnaHQgd2hlbiBjcmVhdGluZyByYW5kb20gd2FsbGV0XCIpO1xuICAgICAgICB3YWxsZXQgPSBhd2FpdCBNb25lcm9XYWxsZXRGdWxsLmNyZWF0ZVdhbGxldFJhbmRvbShjb25maWcpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBzZXQgY29ubmVjdGlvbiBtYW5hZ2VyXG4gICAgYXdhaXQgd2FsbGV0LnNldENvbm5lY3Rpb25NYW5hZ2VyKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpKTtcbiAgICByZXR1cm4gd2FsbGV0O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIGNyZWF0ZVdhbGxldEZyb21TZWVkKGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKTogUHJvbWlzZTxNb25lcm9XYWxsZXRGdWxsPiB7XG5cbiAgICAvLyB2YWxpZGF0ZSBhbmQgbm9ybWFsaXplIHBhcmFtc1xuICAgIGxldCBkYWVtb25Db25uZWN0aW9uID0gY29uZmlnLmdldFNlcnZlcigpO1xuICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWQgPSBkYWVtb25Db25uZWN0aW9uID8gZGFlbW9uQ29ubmVjdGlvbi5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHRydWU7XG4gICAgaWYgKGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFJlc3RvcmVIZWlnaHQoMCk7XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFNlZWRPZmZzZXQoXCJcIik7XG4gICAgXG4gICAgLy8gbG9hZCBmdWxsIHdhc20gbW9kdWxlXG4gICAgbGV0IG1vZHVsZSA9IGF3YWl0IExpYnJhcnlVdGlscy5sb2FkV2FzbU1vZHVsZSgpO1xuICAgIFxuICAgIC8vIGNyZWF0ZSB3YWxsZXQgaW4gcXVldWVcbiAgICBsZXQgd2FsbGV0ID0gYXdhaXQgbW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgIC8vIHJlZ2lzdGVyIGZuIGluZm9ybWluZyBpZiB1bmF1dGhvcml6ZWQgcmVxcyBzaG91bGQgYmUgcmVqZWN0ZWRcbiAgICAgICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZEZuSWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5zZXRSZWplY3RVbmF1dGhvcml6ZWRGbihyZWplY3RVbmF1dGhvcml6ZWRGbklkLCAoKSA9PiByZWplY3RVbmF1dGhvcml6ZWQpO1xuICAgICAgICBcbiAgICAgICAgLy8gY3JlYXRlIHdhbGxldCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIG1vZHVsZS5jcmVhdGVfZnVsbF93YWxsZXQoSlNPTi5zdHJpbmdpZnkoY29uZmlnLnRvSnNvbigpKSwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCwgYXN5bmMgKGNwcEFkZHJlc3MpID0+IHtcbiAgICAgICAgICBpZiAodHlwZW9mIGNwcEFkZHJlc3MgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoY3BwQWRkcmVzcykpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvV2FsbGV0RnVsbChjcHBBZGRyZXNzLCBjb25maWcuZ2V0UGF0aCgpLCBjb25maWcuZ2V0UGFzc3dvcmQoKSwgY29uZmlnLmdldEZzKCksIGNvbmZpZy5nZXRTZXJ2ZXIoKSA/IGNvbmZpZy5nZXRTZXJ2ZXIoKS5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHVuZGVmaW5lZCwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIFxuICAgIC8vIHNhdmUgd2FsbGV0XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkpIGF3YWl0IHdhbGxldC5zYXZlKCk7XG4gICAgcmV0dXJuIHdhbGxldDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBhc3luYyBjcmVhdGVXYWxsZXRGcm9tS2V5cyhjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZyk6IFByb21pc2U8TW9uZXJvV2FsbGV0RnVsbD4ge1xuXG4gICAgLy8gdmFsaWRhdGUgYW5kIG5vcm1hbGl6ZSBwYXJhbXNcbiAgICBNb25lcm9OZXR3b3JrVHlwZS52YWxpZGF0ZShjb25maWcuZ2V0TmV0d29ya1R5cGUoKSk7XG4gICAgaWYgKGNvbmZpZy5nZXRQcmltYXJ5QWRkcmVzcygpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRQcmltYXJ5QWRkcmVzcyhcIlwiKTtcbiAgICBpZiAoY29uZmlnLmdldFByaXZhdGVWaWV3S2V5KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFByaXZhdGVWaWV3S2V5KFwiXCIpO1xuICAgIGlmIChjb25maWcuZ2V0UHJpdmF0ZVNwZW5kS2V5KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFByaXZhdGVTcGVuZEtleShcIlwiKTtcbiAgICBsZXQgZGFlbW9uQ29ubmVjdGlvbiA9IGNvbmZpZy5nZXRTZXJ2ZXIoKTtcbiAgICBsZXQgcmVqZWN0VW5hdXRob3JpemVkID0gZGFlbW9uQ29ubmVjdGlvbiA/IGRhZW1vbkNvbm5lY3Rpb24uZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkgOiB0cnVlO1xuICAgIGlmIChjb25maWcuZ2V0UmVzdG9yZUhlaWdodCgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRSZXN0b3JlSGVpZ2h0KDApO1xuICAgIGlmIChjb25maWcuZ2V0TGFuZ3VhZ2UoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0TGFuZ3VhZ2UoXCJFbmdsaXNoXCIpO1xuICAgIFxuICAgIC8vIGxvYWQgZnVsbCB3YXNtIG1vZHVsZVxuICAgIGxldCBtb2R1bGUgPSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZFdhc21Nb2R1bGUoKTtcbiAgICBcbiAgICAvLyBjcmVhdGUgd2FsbGV0IGluIHF1ZXVlXG4gICAgbGV0IHdhbGxldCA9IGF3YWl0IG1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIHJlZ2lzdGVyIGZuIGluZm9ybWluZyBpZiB1bmF1dGhvcml6ZWQgcmVxcyBzaG91bGQgYmUgcmVqZWN0ZWRcbiAgICAgICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZEZuSWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5zZXRSZWplY3RVbmF1dGhvcml6ZWRGbihyZWplY3RVbmF1dGhvcml6ZWRGbklkLCAoKSA9PiByZWplY3RVbmF1dGhvcml6ZWQpO1xuICAgICAgICBcbiAgICAgICAgLy8gY3JlYXRlIHdhbGxldCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIG1vZHVsZS5jcmVhdGVfZnVsbF93YWxsZXQoSlNPTi5zdHJpbmdpZnkoY29uZmlnLnRvSnNvbigpKSwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCwgYXN5bmMgKGNwcEFkZHJlc3MpID0+IHtcbiAgICAgICAgICBpZiAodHlwZW9mIGNwcEFkZHJlc3MgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoY3BwQWRkcmVzcykpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvV2FsbGV0RnVsbChjcHBBZGRyZXNzLCBjb25maWcuZ2V0UGF0aCgpLCBjb25maWcuZ2V0UGFzc3dvcmQoKSwgY29uZmlnLmdldEZzKCksIGNvbmZpZy5nZXRTZXJ2ZXIoKSA/IGNvbmZpZy5nZXRTZXJ2ZXIoKS5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHVuZGVmaW5lZCwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIFxuICAgIC8vIHNhdmUgd2FsbGV0XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkpIGF3YWl0IHdhbGxldC5zYXZlKCk7XG4gICAgcmV0dXJuIHdhbGxldDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBhc3luYyBjcmVhdGVXYWxsZXRSYW5kb20oY29uZmlnOiBNb25lcm9XYWxsZXRDb25maWcpOiBQcm9taXNlPE1vbmVyb1dhbGxldEZ1bGw+IHtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSBhbmQgbm9ybWFsaXplIHBhcmFtc1xuICAgIGlmIChjb25maWcuZ2V0TGFuZ3VhZ2UoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0TGFuZ3VhZ2UoXCJFbmdsaXNoXCIpO1xuICAgIGxldCBkYWVtb25Db25uZWN0aW9uID0gY29uZmlnLmdldFNlcnZlcigpO1xuICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWQgPSBkYWVtb25Db25uZWN0aW9uID8gZGFlbW9uQ29ubmVjdGlvbi5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHRydWU7XG4gICAgXG4gICAgLy8gbG9hZCB3YXNtIG1vZHVsZVxuICAgIGxldCBtb2R1bGUgPSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZFdhc21Nb2R1bGUoKTtcbiAgICBcbiAgICAvLyBjcmVhdGUgd2FsbGV0IGluIHF1ZXVlXG4gICAgbGV0IHdhbGxldCA9IGF3YWl0IG1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIHJlZ2lzdGVyIGZuIGluZm9ybWluZyBpZiB1bmF1dGhvcml6ZWQgcmVxcyBzaG91bGQgYmUgcmVqZWN0ZWRcbiAgICAgICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZEZuSWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5zZXRSZWplY3RVbmF1dGhvcml6ZWRGbihyZWplY3RVbmF1dGhvcml6ZWRGbklkLCAoKSA9PiByZWplY3RVbmF1dGhvcml6ZWQpO1xuICAgICAgXG4gICAgICAgIC8vIGNyZWF0ZSB3YWxsZXQgaW4gd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICBtb2R1bGUuY3JlYXRlX2Z1bGxfd2FsbGV0KEpTT04uc3RyaW5naWZ5KGNvbmZpZy50b0pzb24oKSksIHJlamVjdFVuYXV0aG9yaXplZEZuSWQsIGFzeW5jIChjcHBBZGRyZXNzKSA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBjcHBBZGRyZXNzID09PSBcInN0cmluZ1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKGNwcEFkZHJlc3MpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb1dhbGxldEZ1bGwoY3BwQWRkcmVzcywgY29uZmlnLmdldFBhdGgoKSwgY29uZmlnLmdldFBhc3N3b3JkKCksIGNvbmZpZy5nZXRGcygpLCBjb25maWcuZ2V0U2VydmVyKCkgPyBjb25maWcuZ2V0U2VydmVyKCkuZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkgOiB1bmRlZmluZWQsIHJlamVjdFVuYXV0aG9yaXplZEZuSWQpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBcbiAgICAvLyBzYXZlIHdhbGxldFxuICAgIGlmIChjb25maWcuZ2V0UGF0aCgpKSBhd2FpdCB3YWxsZXQuc2F2ZSgpO1xuICAgIHJldHVybiB3YWxsZXQ7XG4gIH1cbiAgXG4gIHN0YXRpYyBhc3luYyBnZXRTZWVkTGFuZ3VhZ2VzKCkge1xuICAgIGxldCBtb2R1bGUgPSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZFdhc21Nb2R1bGUoKTtcbiAgICByZXR1cm4gbW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShtb2R1bGUuZ2V0X2tleXNfd2FsbGV0X3NlZWRfbGFuZ3VhZ2VzKCkpLmxhbmd1YWdlcztcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBnZXRGcygpIHtcbiAgICBpZiAoIU1vbmVyb1dhbGxldEZ1bGwuRlMpIE1vbmVyb1dhbGxldEZ1bGwuRlMgPSBmcy5wcm9taXNlcztcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5GUztcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tIFdBTExFVCBNRVRIT0RTIFNQRUNJRklDIFRPIFdBU00gSU1QTEVNRU5UQVRJT04gLS0tLS0tLS0tLS0tLS1cblxuICAvLyBUT0RPOiBtb3ZlIHRoZXNlIHRvIE1vbmVyb1dhbGxldC50cywgb3RoZXJzIGNhbiBiZSB1bnN1cHBvcnRlZFxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgbWF4aW11bSBoZWlnaHQgb2YgdGhlIHBlZXJzIHRoZSB3YWxsZXQncyBkYWVtb24gaXMgY29ubmVjdGVkIHRvLlxuICAgKlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlcj59IHRoZSBtYXhpbXVtIGhlaWdodCBvZiB0aGUgcGVlcnMgdGhlIHdhbGxldCdzIGRhZW1vbiBpcyBjb25uZWN0ZWQgdG9cbiAgICovXG4gIGFzeW5jIGdldERhZW1vbk1heFBlZXJIZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldERhZW1vbk1heFBlZXJIZWlnaHQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgXG4gICAgICAgIC8vIGNhbGwgd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfZGFlbW9uX21heF9wZWVyX2hlaWdodCh0aGlzLmNwcEFkZHJlc3MsIChyZXNwKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgd2FsbGV0J3MgZGFlbW9uIGlzIHN5bmNlZCB3aXRoIHRoZSBuZXR3b3JrLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiB0aGUgZGFlbW9uIGlzIHN5bmNlZCB3aXRoIHRoZSBuZXR3b3JrLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzRGFlbW9uU3luY2VkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaXNEYWVtb25TeW5jZWQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgXG4gICAgICAgIC8vIGNhbGwgd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICB0aGlzLm1vZHVsZS5pc19kYWVtb25fc3luY2VkKHRoaXMuY3BwQWRkcmVzcywgKHJlc3ApID0+IHtcbiAgICAgICAgICByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSB3YWxsZXQgaXMgc3luY2VkIHdpdGggdGhlIGRhZW1vbi5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgdGhlIHdhbGxldCBpcyBzeW5jZWQgd2l0aCB0aGUgZGFlbW9uLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzU3luY2VkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaXNTeW5jZWQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5pc19zeW5jZWQodGhpcy5jcHBBZGRyZXNzLCAocmVzcCkgPT4ge1xuICAgICAgICAgIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIG5ldHdvcmsgdHlwZSAobWFpbm5ldCwgdGVzdG5ldCwgb3Igc3RhZ2VuZXQpLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9OZXR3b3JrVHlwZT59IHRoZSB3YWxsZXQncyBuZXR3b3JrIHR5cGVcbiAgICovXG4gIGFzeW5jIGdldE5ldHdvcmtUeXBlKCk6IFByb21pc2U8TW9uZXJvTmV0d29ya1R5cGU+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldE5ldHdvcmtUeXBlKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLmdldF9uZXR3b3JrX3R5cGUodGhpcy5jcHBBZGRyZXNzKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgaGVpZ2h0IG9mIHRoZSBmaXJzdCBibG9jayB0aGF0IHRoZSB3YWxsZXQgc2NhbnMuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlcj59IHRoZSBoZWlnaHQgb2YgdGhlIGZpcnN0IGJsb2NrIHRoYXQgdGhlIHdhbGxldCBzY2Fuc1xuICAgKi9cbiAgYXN5bmMgZ2V0UmVzdG9yZUhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0UmVzdG9yZUhlaWdodCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5nZXRfcmVzdG9yZV9oZWlnaHQodGhpcy5jcHBBZGRyZXNzKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNldCB0aGUgaGVpZ2h0IG9mIHRoZSBmaXJzdCBibG9jayB0aGF0IHRoZSB3YWxsZXQgc2NhbnMuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gcmVzdG9yZUhlaWdodCAtIGhlaWdodCBvZiB0aGUgZmlyc3QgYmxvY2sgdGhhdCB0aGUgd2FsbGV0IHNjYW5zXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzZXRSZXN0b3JlSGVpZ2h0KHJlc3RvcmVIZWlnaHQ6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2V0UmVzdG9yZUhlaWdodChyZXN0b3JlSGVpZ2h0KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0aGlzLm1vZHVsZS5zZXRfcmVzdG9yZV9oZWlnaHQodGhpcy5jcHBBZGRyZXNzLCByZXN0b3JlSGVpZ2h0KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIE1vdmUgdGhlIHdhbGxldCBmcm9tIGl0cyBjdXJyZW50IHBhdGggdG8gdGhlIGdpdmVuIHBhdGguXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIHRoZSB3YWxsZXQncyBkZXN0aW5hdGlvbiBwYXRoXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBtb3ZlVG8ocGF0aDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5tb3ZlVG8ocGF0aCk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwubW92ZVRvKHBhdGgsIHRoaXMpO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBDT01NT04gV0FMTEVUIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgYXN5bmMgYWRkTGlzdGVuZXIobGlzdGVuZXI6IE1vbmVyb1dhbGxldExpc3RlbmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgYXdhaXQgc3VwZXIuYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICB9XG4gIFxuICBhc3luYyByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkucmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIGF3YWl0IHN1cGVyLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgfVxuICBcbiAgZ2V0TGlzdGVuZXJzKCk6IE1vbmVyb1dhbGxldExpc3RlbmVyW10ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0TGlzdGVuZXJzKCk7XG4gICAgcmV0dXJuIHN1cGVyLmdldExpc3RlbmVycygpO1xuICB9XG4gIFxuICBhc3luYyBzZXREYWVtb25Db25uZWN0aW9uKHVyaU9yQ29ubmVjdGlvbj86IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4gfCBzdHJpbmcsIGlzVHJ1c3RlZD86IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNldERhZW1vbkNvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uLCBpc1RydXN0ZWQpO1xuXG4gICAgLy8gbm9ybWFsaXplIGNvbm5lY3Rpb25cbiAgICBsZXQgY29ubmVjdGlvbiA9ICF1cmlPckNvbm5lY3Rpb24gPyB1bmRlZmluZWQgOiB1cmlPckNvbm5lY3Rpb24gaW5zdGFuY2VvZiBNb25lcm9ScGNDb25uZWN0aW9uID8gdXJpT3JDb25uZWN0aW9uIDogbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uKTtcbiAgICBsZXQgdXJpID0gY29ubmVjdGlvbiAmJiBjb25uZWN0aW9uLmdldFVyaSgpID8gY29ubmVjdGlvbi5nZXRVcmkoKSA6IFwiXCI7XG4gICAgbGV0IHVzZXJuYW1lID0gY29ubmVjdGlvbiAmJiBjb25uZWN0aW9uLmdldFVzZXJuYW1lKCkgPyBjb25uZWN0aW9uLmdldFVzZXJuYW1lKCkgOiBcIlwiO1xuICAgIGxldCBwYXNzd29yZCA9IGNvbm5lY3Rpb24gJiYgY29ubmVjdGlvbi5nZXRQYXNzd29yZCgpID8gY29ubmVjdGlvbi5nZXRQYXNzd29yZCgpIDogXCJcIjtcbiAgICBsZXQgcHJveHlVcmkgPSBjb25uZWN0aW9uICYmIGNvbm5lY3Rpb24uZ2V0UHJveHlVcmkoKSA/IGNvbm5lY3Rpb24uZ2V0UHJveHlVcmkoKSA6IFwiXCI7XG4gICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZCA9IGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdW5kZWZpbmVkO1xuICAgIGxldCBpc1RydXN0ZWRBcmcgPSBpc1RydXN0ZWQgPT09IHVuZGVmaW5lZCA/IC0xIDogKGlzVHJ1c3RlZCA/IDEgOiAwKTsgLy8gbmVnYXRpdmUgaWYgdW5zZXRcbiAgICB0aGlzLnJlamVjdFVuYXV0aG9yaXplZCA9IHJlamVjdFVuYXV0aG9yaXplZDsgIC8vIHBlcnNpc3QgbG9jYWxseVxuXG4gICAgLy8gc2V0IGNvbm5lY3Rpb24gaW4gcXVldWVcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5zZXRfZGFlbW9uX2Nvbm5lY3Rpb24odGhpcy5jcHBBZGRyZXNzLCB1cmksIHVzZXJuYW1lLCBwYXNzd29yZCwgcHJveHlVcmksIGlzVHJ1c3RlZEFyZywgKHJlc3ApID0+IHtcbiAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSB3YWxsZXQncyBkYWVtb24gaXMgdHJ1c3RlZC5cbiAgICpcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiB0aGUgZGFlbW9uIGlzIHRydXN0ZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgYXN5bmMgaXNEYWVtb25UcnVzdGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaXNEYWVtb25UcnVzdGVkKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLmlzX2RhZW1vbl90cnVzdGVkKHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBnZXREYWVtb25Db25uZWN0aW9uKCk6IFByb21pc2U8TW9uZXJvUnBjQ29ubmVjdGlvbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0RGFlbW9uQ29ubmVjdGlvbigpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGxldCBjb25uZWN0aW9uQ29udGFpbmVyU3RyID0gdGhpcy5tb2R1bGUuZ2V0X2RhZW1vbl9jb25uZWN0aW9uKHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgICAgIGlmICghY29ubmVjdGlvbkNvbnRhaW5lclN0cikgcmVzb2x2ZSh1bmRlZmluZWQpO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBsZXQganNvbkNvbm5lY3Rpb24gPSBKU09OLnBhcnNlKGNvbm5lY3Rpb25Db250YWluZXJTdHIpO1xuICAgICAgICAgIHJlc29sdmUobmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24oe3VyaToganNvbkNvbm5lY3Rpb24udXJpLCB1c2VybmFtZToganNvbkNvbm5lY3Rpb24udXNlcm5hbWUsIHBhc3N3b3JkOiBqc29uQ29ubmVjdGlvbi5wYXNzd29yZCwgcHJveHlVcmk6IGpzb25Db25uZWN0aW9uLnByb3h5VXJpLCByZWplY3RVbmF1dGhvcml6ZWQ6IHRoaXMucmVqZWN0VW5hdXRob3JpemVkfSkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgaXNDb25uZWN0ZWRUb0RhZW1vbigpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmlzQ29ubmVjdGVkVG9EYWVtb24oKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5pc19jb25uZWN0ZWRfdG9fZGFlbW9uKHRoaXMuY3BwQWRkcmVzcywgKHJlc3ApID0+IHtcbiAgICAgICAgICByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRWZXJzaW9uKCk6IFByb21pc2U8TW9uZXJvVmVyc2lvbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0VmVyc2lvbigpO1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGF0aCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0UGF0aCgpO1xuICAgIHJldHVybiB0aGlzLnBhdGg7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEludGVncmF0ZWRBZGRyZXNzKHN0YW5kYXJkQWRkcmVzcz86IHN0cmluZywgcGF5bWVudElkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0SW50ZWdyYXRlZEFkZHJlc3Moc3RhbmRhcmRBZGRyZXNzLCBwYXltZW50SWQpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGxldCByZXN1bHQgPSB0aGlzLm1vZHVsZS5nZXRfaW50ZWdyYXRlZF9hZGRyZXNzKHRoaXMuY3BwQWRkcmVzcywgc3RhbmRhcmRBZGRyZXNzID8gc3RhbmRhcmRBZGRyZXNzIDogXCJcIiwgcGF5bWVudElkID8gcGF5bWVudElkIDogXCJcIik7XG4gICAgICAgIGlmIChyZXN1bHQuY2hhckF0KDApICE9PSAneycpIHRocm93IG5ldyBNb25lcm9FcnJvcihyZXN1bHQpO1xuICAgICAgICByZXR1cm4gbmV3IE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzKEpTT04ucGFyc2UocmVzdWx0KSk7XG4gICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICBpZiAoZXJyLm1lc3NhZ2UuaW5jbHVkZXMoXCJJbnZhbGlkIHBheW1lbnQgSURcIikpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkludmFsaWQgcGF5bWVudCBJRDogXCIgKyBwYXltZW50SWQpO1xuICAgICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZXJyLm1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyhpbnRlZ3JhdGVkQWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3MpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGxldCByZXN1bHQgPSB0aGlzLm1vZHVsZS5kZWNvZGVfaW50ZWdyYXRlZF9hZGRyZXNzKHRoaXMuY3BwQWRkcmVzcywgaW50ZWdyYXRlZEFkZHJlc3MpO1xuICAgICAgICBpZiAocmVzdWx0LmNoYXJBdCgwKSAhPT0gJ3snKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IocmVzdWx0KTtcbiAgICAgICAgcmV0dXJuIG5ldyBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyhKU09OLnBhcnNlKHJlc3VsdCkpO1xuICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGVyci5tZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRIZWlnaHQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfaGVpZ2h0KHRoaXMuY3BwQWRkcmVzcywgKHJlc3ApID0+IHtcbiAgICAgICAgICByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXREYWVtb25IZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldERhZW1vbkhlaWdodCgpO1xuICAgIGlmICghYXdhaXQgdGhpcy5pc0Nvbm5lY3RlZFRvRGFlbW9uKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBpcyBub3QgY29ubmVjdGVkIHRvIGRhZW1vblwiKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfZGFlbW9uX2hlaWdodCh0aGlzLmNwcEFkZHJlc3MsIChyZXNwKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0QnlEYXRlKHllYXI6IG51bWJlciwgbW9udGg6IG51bWJlciwgZGF5OiBudW1iZXIpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0SGVpZ2h0QnlEYXRlKHllYXIsIG1vbnRoLCBkYXkpO1xuICAgIGlmICghYXdhaXQgdGhpcy5pc0Nvbm5lY3RlZFRvRGFlbW9uKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBpcyBub3QgY29ubmVjdGVkIHRvIGRhZW1vblwiKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfaGVpZ2h0X2J5X2RhdGUodGhpcy5jcHBBZGRyZXNzLCB5ZWFyLCBtb250aCwgZGF5LCAocmVzcCkgPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgcmVzcCA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogU3luY2hyb25pemUgdGhlIHdhbGxldCB3aXRoIHRoZSBkYWVtb24gYXMgYSBvbmUtdGltZSBzeW5jaHJvbm91cyBwcm9jZXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9XYWxsZXRMaXN0ZW5lcnxudW1iZXJ9IFtsaXN0ZW5lck9yU3RhcnRIZWlnaHRdIC0gbGlzdGVuZXIgeG9yIHN0YXJ0IGhlaWdodCAoZGVmYXVsdHMgdG8gbm8gc3luYyBsaXN0ZW5lciwgdGhlIGxhc3Qgc3luY2VkIGJsb2NrKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3N0YXJ0SGVpZ2h0XSAtIHN0YXJ0SGVpZ2h0IGlmIG5vdCBnaXZlbiBpbiBmaXJzdCBhcmcgKGRlZmF1bHRzIHRvIGxhc3Qgc3luY2VkIGJsb2NrKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFthbGxvd0NvbmN1cnJlbnRDYWxsc10gLSBhbGxvdyBvdGhlciB3YWxsZXQgbWV0aG9kcyB0byBiZSBwcm9jZXNzZWQgc2ltdWx0YW5lb3VzbHkgZHVyaW5nIHN5bmMgKGRlZmF1bHQgZmFsc2UpPGJyPjxicj48Yj5XQVJOSU5HPC9iPjogZW5hYmxpbmcgdGhpcyBvcHRpb24gd2lsbCBjcmFzaCB3YWxsZXQgZXhlY3V0aW9uIGlmIGFub3RoZXIgY2FsbCBtYWtlcyBhIHNpbXVsdGFuZW91cyBuZXR3b3JrIHJlcXVlc3QuIFRPRE86IHBvc3NpYmxlIHRvIHN5bmMgd2FzbSBuZXR3b3JrIHJlcXVlc3RzIGluIGh0dHBfY2xpZW50X3dhc20uY3BwPyBcbiAgICovXG4gIGFzeW5jIHN5bmMobGlzdGVuZXJPclN0YXJ0SGVpZ2h0PzogTW9uZXJvV2FsbGV0TGlzdGVuZXIgfCBudW1iZXIsIHN0YXJ0SGVpZ2h0PzogbnVtYmVyLCBhbGxvd0NvbmN1cnJlbnRDYWxscyA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9TeW5jUmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zeW5jKGxpc3RlbmVyT3JTdGFydEhlaWdodCwgc3RhcnRIZWlnaHQsIGFsbG93Q29uY3VycmVudENhbGxzKTtcbiAgICBpZiAoIWF3YWl0IHRoaXMuaXNDb25uZWN0ZWRUb0RhZW1vbigpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgaXMgbm90IGNvbm5lY3RlZCB0byBkYWVtb25cIik7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIHBhcmFtc1xuICAgIHN0YXJ0SGVpZ2h0ID0gbGlzdGVuZXJPclN0YXJ0SGVpZ2h0ID09PSB1bmRlZmluZWQgfHwgbGlzdGVuZXJPclN0YXJ0SGVpZ2h0IGluc3RhbmNlb2YgTW9uZXJvV2FsbGV0TGlzdGVuZXIgPyBzdGFydEhlaWdodCA6IGxpc3RlbmVyT3JTdGFydEhlaWdodDtcbiAgICBsZXQgbGlzdGVuZXIgPSBsaXN0ZW5lck9yU3RhcnRIZWlnaHQgaW5zdGFuY2VvZiBNb25lcm9XYWxsZXRMaXN0ZW5lciA/IGxpc3RlbmVyT3JTdGFydEhlaWdodCA6IHVuZGVmaW5lZDtcbiAgICBpZiAoc3RhcnRIZWlnaHQgPT09IHVuZGVmaW5lZCkgc3RhcnRIZWlnaHQgPSBNYXRoLm1heChhd2FpdCB0aGlzLmdldEhlaWdodCgpLCBhd2FpdCB0aGlzLmdldFJlc3RvcmVIZWlnaHQoKSk7XG4gICAgXG4gICAgLy8gcmVnaXN0ZXIgbGlzdGVuZXIgaWYgZ2l2ZW5cbiAgICBpZiAobGlzdGVuZXIpIGF3YWl0IHRoaXMuYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIFxuICAgIC8vIHN5bmMgd2FsbGV0XG4gICAgbGV0IGVycjtcbiAgICBsZXQgcmVzdWx0O1xuICAgIHRyeSB7XG4gICAgICBsZXQgdGhhdCA9IHRoaXM7XG4gICAgICByZXN1bHQgPSBhd2FpdCAoYWxsb3dDb25jdXJyZW50Q2FsbHMgPyBzeW5jV2FzbSgpIDogdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHN5bmNXYXNtKCkpKTtcbiAgICAgIGZ1bmN0aW9uIHN5bmNXYXNtKCkge1xuICAgICAgICB0aGF0LmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgICAvLyBzeW5jIHdhbGxldCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgICAgdGhhdC5tb2R1bGUuc3luYyh0aGF0LmNwcEFkZHJlc3MsIHN0YXJ0SGVpZ2h0LCBhc3luYyAocmVzcCkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc3AuY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcCkpO1xuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGxldCByZXNwSnNvbiA9IEpTT04ucGFyc2UocmVzcCk7XG4gICAgICAgICAgICAgIHJlc29sdmUobmV3IE1vbmVyb1N5bmNSZXN1bHQocmVzcEpzb24ubnVtQmxvY2tzRmV0Y2hlZCwgcmVzcEpzb24ucmVjZWl2ZWRNb25leSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBlcnIgPSBlO1xuICAgIH1cbiAgICBcbiAgICAvLyB1bnJlZ2lzdGVyIGxpc3RlbmVyXG4gICAgaWYgKGxpc3RlbmVyKSBhd2FpdCB0aGlzLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBcbiAgICAvLyB0aHJvdyBlcnJvciBvciByZXR1cm5cbiAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBcbiAgYXN5bmMgc3RhcnRTeW5jaW5nKHN5bmNQZXJpb2RJbk1zPzogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zdGFydFN5bmNpbmcoc3luY1BlcmlvZEluTXMpO1xuICAgIGlmICghYXdhaXQgdGhpcy5pc0Nvbm5lY3RlZFRvRGFlbW9uKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBpcyBub3QgY29ubmVjdGVkIHRvIGRhZW1vblwiKTtcbiAgICB0aGlzLnN5bmNQZXJpb2RJbk1zID0gc3luY1BlcmlvZEluTXMgPT09IHVuZGVmaW5lZCA/IE1vbmVyb1dhbGxldEZ1bGwuREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyA6IHN5bmNQZXJpb2RJbk1zO1xuICAgIGlmICghdGhpcy5zeW5jTG9vcGVyKSB0aGlzLnN5bmNMb29wZXIgPSBuZXcgVGFza0xvb3Blcihhc3luYyAoKSA9PiBhd2FpdCB0aGlzLmJhY2tncm91bmRTeW5jKCkpXG4gICAgdGhpcy5zeW5jTG9vcGVyLnN0YXJ0KHRoaXMuc3luY1BlcmlvZEluTXMpO1xuICB9XG4gICAgXG4gIGFzeW5jIHN0b3BTeW5jaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3RvcFN5bmNpbmcoKTtcbiAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgIGlmICh0aGlzLnN5bmNMb29wZXIpIHRoaXMuc3luY0xvb3Blci5zdG9wKCk7XG4gICAgdGhpcy5tb2R1bGUuc3RvcF9zeW5jaW5nKHRoaXMuY3BwQWRkcmVzcyk7IC8vIHRhc2sgaXMgbm90IHF1ZXVlZCBzbyB3YWxsZXQgc3RvcHMgaW1tZWRpYXRlbHlcbiAgfVxuICBcbiAgYXN5bmMgc2NhblR4cyh0eEhhc2hlczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNjYW5UeHModHhIYXNoZXMpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnNjYW5fdHhzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe3R4SGFzaGVzOiB0eEhhc2hlc30pLCAoZXJyKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihlcnIpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzY2FuU3BlbnQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5yZXNjYW5TcGVudCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnJlc2Nhbl9zcGVudCh0aGlzLmNwcEFkZHJlc3MsICgpID0+IHJlc29sdmUoKSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzY2FuQmxvY2tjaGFpbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnJlc2NhbkJsb2NrY2hhaW4oKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5yZXNjYW5fYmxvY2tjaGFpbih0aGlzLmNwcEFkZHJlc3MsICgpID0+IHJlc29sdmUoKSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmFsYW5jZShhY2NvdW50SWR4PzogbnVtYmVyLCBzdWJhZGRyZXNzSWR4PzogbnVtYmVyKTogUHJvbWlzZTxiaWdpbnQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEJhbGFuY2UoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgXG4gICAgICAvLyBnZXQgYmFsYW5jZSBlbmNvZGVkIGluIGpzb24gc3RyaW5nXG4gICAgICBsZXQgYmFsYW5jZVN0cjtcbiAgICAgIGlmIChhY2NvdW50SWR4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYXNzZXJ0KHN1YmFkZHJlc3NJZHggPT09IHVuZGVmaW5lZCwgXCJTdWJhZGRyZXNzIGluZGV4IG11c3QgYmUgdW5kZWZpbmVkIGlmIGFjY291bnQgaW5kZXggaXMgdW5kZWZpbmVkXCIpO1xuICAgICAgICBiYWxhbmNlU3RyID0gdGhpcy5tb2R1bGUuZ2V0X2JhbGFuY2Vfd2FsbGV0KHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgICB9IGVsc2UgaWYgKHN1YmFkZHJlc3NJZHggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBiYWxhbmNlU3RyID0gdGhpcy5tb2R1bGUuZ2V0X2JhbGFuY2VfYWNjb3VudCh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYmFsYW5jZVN0ciA9IHRoaXMubW9kdWxlLmdldF9iYWxhbmNlX3N1YmFkZHJlc3ModGhpcy5jcHBBZGRyZXNzLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gcGFyc2UganNvbiBzdHJpbmcgdG8gYmlnaW50XG4gICAgICByZXR1cm4gQmlnSW50KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhiYWxhbmNlU3RyKSkuYmFsYW5jZSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFVubG9ja2VkQmFsYW5jZShhY2NvdW50SWR4PzogbnVtYmVyLCBzdWJhZGRyZXNzSWR4PzogbnVtYmVyKTogUHJvbWlzZTxiaWdpbnQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFVubG9ja2VkQmFsYW5jZShhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBcbiAgICAgIC8vIGdldCBiYWxhbmNlIGVuY29kZWQgaW4ganNvbiBzdHJpbmdcbiAgICAgIGxldCB1bmxvY2tlZEJhbGFuY2VTdHI7XG4gICAgICBpZiAoYWNjb3VudElkeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGFzc2VydChzdWJhZGRyZXNzSWR4ID09PSB1bmRlZmluZWQsIFwiU3ViYWRkcmVzcyBpbmRleCBtdXN0IGJlIHVuZGVmaW5lZCBpZiBhY2NvdW50IGluZGV4IGlzIHVuZGVmaW5lZFwiKTtcbiAgICAgICAgdW5sb2NrZWRCYWxhbmNlU3RyID0gdGhpcy5tb2R1bGUuZ2V0X3VubG9ja2VkX2JhbGFuY2Vfd2FsbGV0KHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgICB9IGVsc2UgaWYgKHN1YmFkZHJlc3NJZHggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB1bmxvY2tlZEJhbGFuY2VTdHIgPSB0aGlzLm1vZHVsZS5nZXRfdW5sb2NrZWRfYmFsYW5jZV9hY2NvdW50KHRoaXMuY3BwQWRkcmVzcywgYWNjb3VudElkeCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1bmxvY2tlZEJhbGFuY2VTdHIgPSB0aGlzLm1vZHVsZS5nZXRfdW5sb2NrZWRfYmFsYW5jZV9zdWJhZGRyZXNzKHRoaXMuY3BwQWRkcmVzcywgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIHBhcnNlIGpzb24gc3RyaW5nIHRvIGJpZ2ludFxuICAgICAgcmV0dXJuIEJpZ0ludChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHModW5sb2NrZWRCYWxhbmNlU3RyKSkudW5sb2NrZWRCYWxhbmNlKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudHMoaW5jbHVkZVN1YmFkZHJlc3Nlcz86IGJvb2xlYW4sIHRhZz86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQWNjb3VudFtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRBY2NvdW50cyhpbmNsdWRlU3ViYWRkcmVzc2VzLCB0YWcpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCBhY2NvdW50c1N0ciA9IHRoaXMubW9kdWxlLmdldF9hY2NvdW50cyh0aGlzLmNwcEFkZHJlc3MsIGluY2x1ZGVTdWJhZGRyZXNzZXMgPyB0cnVlIDogZmFsc2UsIHRhZyA/IHRhZyA6IFwiXCIpO1xuICAgICAgbGV0IGFjY291bnRzID0gW107XG4gICAgICBmb3IgKGxldCBhY2NvdW50SnNvbiBvZiBKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMoYWNjb3VudHNTdHIpKS5hY2NvdW50cykge1xuICAgICAgICBhY2NvdW50cy5wdXNoKE1vbmVyb1dhbGxldEZ1bGwuc2FuaXRpemVBY2NvdW50KG5ldyBNb25lcm9BY2NvdW50KGFjY291bnRKc29uKSkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFjY291bnRzO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRBY2NvdW50KGFjY291bnRJZHg6IG51bWJlciwgaW5jbHVkZVN1YmFkZHJlc3Nlcz86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb0FjY291bnQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEFjY291bnQoYWNjb3VudElkeCwgaW5jbHVkZVN1YmFkZHJlc3Nlcyk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IGFjY291bnRTdHIgPSB0aGlzLm1vZHVsZS5nZXRfYWNjb3VudCh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgsIGluY2x1ZGVTdWJhZGRyZXNzZXMgPyB0cnVlIDogZmFsc2UpO1xuICAgICAgbGV0IGFjY291bnRKc29uID0gSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKGFjY291bnRTdHIpKTtcbiAgICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplQWNjb3VudChuZXcgTW9uZXJvQWNjb3VudChhY2NvdW50SnNvbikpO1xuICAgIH0pO1xuXG4gIH1cbiAgXG4gIGFzeW5jIGNyZWF0ZUFjY291bnQobGFiZWw/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0FjY291bnQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmNyZWF0ZUFjY291bnQobGFiZWwpO1xuICAgIGlmIChsYWJlbCA9PT0gdW5kZWZpbmVkKSBsYWJlbCA9IFwiXCI7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IGFjY291bnRTdHIgPSB0aGlzLm1vZHVsZS5jcmVhdGVfYWNjb3VudCh0aGlzLmNwcEFkZHJlc3MsIGxhYmVsKTtcbiAgICAgIGxldCBhY2NvdW50SnNvbiA9IEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhhY2NvdW50U3RyKSk7XG4gICAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZUFjY291bnQobmV3IE1vbmVyb0FjY291bnQoYWNjb3VudEpzb24pKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0luZGljZXM/OiBudW1iZXJbXSk6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzc1tdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgc3ViYWRkcmVzc0luZGljZXMpO1xuICAgIGxldCBhcmdzID0ge2FjY291bnRJZHg6IGFjY291bnRJZHgsIHN1YmFkZHJlc3NJbmRpY2VzOiBzdWJhZGRyZXNzSW5kaWNlcyA9PT0gdW5kZWZpbmVkID8gW10gOiBHZW5VdGlscy5saXN0aWZ5KHN1YmFkZHJlc3NJbmRpY2VzKX07XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IHN1YmFkZHJlc3Nlc0pzb24gPSBKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHModGhpcy5tb2R1bGUuZ2V0X3N1YmFkZHJlc3Nlcyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KGFyZ3MpKSkpLnN1YmFkZHJlc3NlcztcbiAgICAgIGxldCBzdWJhZGRyZXNzZXMgPSBbXTtcbiAgICAgIGZvciAobGV0IHN1YmFkZHJlc3NKc29uIG9mIHN1YmFkZHJlc3Nlc0pzb24pIHN1YmFkZHJlc3Nlcy5wdXNoKE1vbmVyb1dhbGxldEtleXMuc2FuaXRpemVTdWJhZGRyZXNzKG5ldyBNb25lcm9TdWJhZGRyZXNzKHN1YmFkZHJlc3NKc29uKSkpO1xuICAgICAgcmV0dXJuIHN1YmFkZHJlc3NlcztcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgY3JlYXRlU3ViYWRkcmVzcyhhY2NvdW50SWR4OiBudW1iZXIsIGxhYmVsPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jcmVhdGVTdWJhZGRyZXNzKGFjY291bnRJZHgsIGxhYmVsKTtcbiAgICBpZiAobGFiZWwgPT09IHVuZGVmaW5lZCkgbGFiZWwgPSBcIlwiO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCBzdWJhZGRyZXNzU3RyID0gdGhpcy5tb2R1bGUuY3JlYXRlX3N1YmFkZHJlc3ModGhpcy5jcHBBZGRyZXNzLCBhY2NvdW50SWR4LCBsYWJlbCk7XG4gICAgICBsZXQgc3ViYWRkcmVzc0pzb24gPSBKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMoc3ViYWRkcmVzc1N0cikpO1xuICAgICAgcmV0dXJuIE1vbmVyb1dhbGxldEtleXMuc2FuaXRpemVTdWJhZGRyZXNzKG5ldyBNb25lcm9TdWJhZGRyZXNzKHN1YmFkZHJlc3NKc29uKSk7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBzZXRTdWJhZGRyZXNzTGFiZWwoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIsIGxhYmVsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNldFN1YmFkZHJlc3NMYWJlbChhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4LCBsYWJlbCk7XG4gICAgaWYgKGxhYmVsID09PSB1bmRlZmluZWQpIGxhYmVsID0gXCJcIjtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0aGlzLm1vZHVsZS5zZXRfc3ViYWRkcmVzc19sYWJlbCh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIGxhYmVsKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhzKHF1ZXJ5Pzogc3RyaW5nW10gfCBQYXJ0aWFsPE1vbmVyb1R4UXVlcnk+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRUeHMocXVlcnkpO1xuXG4gICAgLy8gY29weSBhbmQgbm9ybWFsaXplIHF1ZXJ5IHVwIHRvIGJsb2NrXG4gICAgY29uc3QgcXVlcnlOb3JtYWxpemVkID0gcXVlcnkgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplVHhRdWVyeShxdWVyeSk7XG4gICAgXG4gICAgLy8gc2NoZWR1bGUgdGFza1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyBjYWxsIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFja1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfdHhzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkocXVlcnlOb3JtYWxpemVkLmdldEJsb2NrKCkudG9Kc29uKCkpLCAoYmxvY2tzSnNvblN0cikgPT4ge1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIGNoZWNrIGZvciBlcnJvclxuICAgICAgICAgIGlmIChibG9ja3NKc29uU3RyLmNoYXJBdCgwKSAhPT0gJ3snKSB7XG4gICAgICAgICAgICByZWplY3QobmV3IE1vbmVyb0Vycm9yKGJsb2Nrc0pzb25TdHIpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gcmVzb2x2ZSB3aXRoIGRlc2VyaWFsaXplZCB0eHNcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzb2x2ZShNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplVHhzKHF1ZXJ5Tm9ybWFsaXplZCwgYmxvY2tzSnNvblN0cikpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRUcmFuc2ZlcnMocXVlcnk/OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KTogUHJvbWlzZTxNb25lcm9UcmFuc2ZlcltdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRUcmFuc2ZlcnMocXVlcnkpO1xuICAgIFxuICAgIC8vIGNvcHkgYW5kIG5vcm1hbGl6ZSBxdWVyeSB1cCB0byBibG9ja1xuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVUcmFuc2ZlclF1ZXJ5KHF1ZXJ5KTtcbiAgICBcbiAgICAvLyByZXR1cm4gcHJvbWlzZSB3aGljaCByZXNvbHZlcyBvbiBjYWxsYmFja1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyBjYWxsIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFja1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfdHJhbnNmZXJzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkocXVlcnlOb3JtYWxpemVkLmdldFR4UXVlcnkoKS5nZXRCbG9jaygpLnRvSnNvbigpKSwgKGJsb2Nrc0pzb25TdHIpID0+IHtcbiAgICAgICAgICAgIFxuICAgICAgICAgIC8vIGNoZWNrIGZvciBlcnJvclxuICAgICAgICAgIGlmIChibG9ja3NKc29uU3RyLmNoYXJBdCgwKSAhPT0gJ3snKSB7XG4gICAgICAgICAgICByZWplY3QobmV3IE1vbmVyb0Vycm9yKGJsb2Nrc0pzb25TdHIpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgIFxuICAgICAgICAgIC8vIHJlc29sdmUgd2l0aCBkZXNlcmlhbGl6ZWQgdHJhbnNmZXJzIFxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXNvbHZlKE1vbmVyb1dhbGxldEZ1bGwuZGVzZXJpYWxpemVUcmFuc2ZlcnMocXVlcnlOb3JtYWxpemVkLCBibG9ja3NKc29uU3RyKSk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dHMocXVlcnk/OiBQYXJ0aWFsPE1vbmVyb091dHB1dFF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvT3V0cHV0V2FsbGV0W10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldE91dHB1dHMocXVlcnkpO1xuICAgIFxuICAgIC8vIGNvcHkgYW5kIG5vcm1hbGl6ZSBxdWVyeSB1cCB0byBibG9ja1xuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVPdXRwdXRRdWVyeShxdWVyeSk7XG4gICAgXG4gICAgLy8gcmV0dXJuIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgb24gY2FsbGJhY2tcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT57XG4gICAgICAgIFxuICAgICAgICAvLyBjYWxsIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFja1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfb3V0cHV0cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHF1ZXJ5Tm9ybWFsaXplZC5nZXRUeFF1ZXJ5KCkuZ2V0QmxvY2soKS50b0pzb24oKSksIChibG9ja3NKc29uU3RyKSA9PiB7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gY2hlY2sgZm9yIGVycm9yXG4gICAgICAgICAgaWYgKGJsb2Nrc0pzb25TdHIuY2hhckF0KDApICE9PSAneycpIHtcbiAgICAgICAgICAgIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoYmxvY2tzSnNvblN0cikpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICAvLyByZXNvbHZlIHdpdGggZGVzZXJpYWxpemVkIG91dHB1dHNcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzb2x2ZShNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplT3V0cHV0cyhxdWVyeU5vcm1hbGl6ZWQsIGJsb2Nrc0pzb25TdHIpKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0T3V0cHV0cyhhbGwgPSBmYWxzZSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5leHBvcnRPdXRwdXRzKGFsbCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZXhwb3J0X291dHB1dHModGhpcy5jcHBBZGRyZXNzLCBhbGwsIChvdXRwdXRzSGV4KSA9PiByZXNvbHZlKG91dHB1dHNIZXgpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRPdXRwdXRzKG91dHB1dHNIZXg6IHN0cmluZyk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pbXBvcnRPdXRwdXRzKG91dHB1dHNIZXgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmltcG9ydF9vdXRwdXRzKHRoaXMuY3BwQWRkcmVzcywgb3V0cHV0c0hleCwgKG51bUltcG9ydGVkKSA9PiByZXNvbHZlKG51bUltcG9ydGVkKSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0S2V5SW1hZ2VzKGFsbCA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZXhwb3J0S2V5SW1hZ2VzKGFsbCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZXhwb3J0X2tleV9pbWFnZXModGhpcy5jcHBBZGRyZXNzLCBhbGwsIChyZXN1bHRTdHIpID0+IHtcbiAgICAgICAgICBpZiAocmVzdWx0U3RyLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3VsdFN0cikpOyAvLyBqc29uIGV4cGVjdGVkLCBlbHNlIGVycm9yXG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsZXQgcmVzdWx0SnNvbiA9IEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhyZXN1bHRTdHIpKTtcbiAgICAgICAgICAgIGlmICghcmVzdWx0SnNvbi5rZXlJbWFnZXMpIHJlc3VsdEpzb24ua2V5SW1hZ2VzID0gW107XG4gICAgICAgICAgICByZXNvbHZlKG5ldyBNb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdChyZXN1bHRKc29uKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRLZXlJbWFnZXMoa2V5SW1hZ2VzOiBNb25lcm9LZXlJbWFnZVtdLCBvZmZzZXQgPSAwKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaW1wb3J0S2V5SW1hZ2VzKGtleUltYWdlcywgb2Zmc2V0KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5pbXBvcnRfa2V5X2ltYWdlcyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHtvZmZzZXQ6IG9mZnNldCwga2V5SW1hZ2VzOiBrZXlJbWFnZXMubWFwKGtleUltYWdlID0+IGtleUltYWdlLnRvSnNvbigpKX0pLCAoa2V5SW1hZ2VJbXBvcnRSZXN1bHRTdHIpID0+IHtcbiAgICAgICAgICBpZiAoa2V5SW1hZ2VJbXBvcnRSZXN1bHRTdHIuY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3Ioa2V5SW1hZ2VJbXBvcnRSZXN1bHRTdHIpKTsgLy8ganNvbiBleHBlY3RlZCwgZWxzZSBlcnJvclxuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKGtleUltYWdlSW1wb3J0UmVzdWx0U3RyKSkpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQoKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCgpO1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZnJlZXplT3V0cHV0KGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmZyZWV6ZU91dHB1dChrZXlJbWFnZSk7XG4gICAgaWYgKCFrZXlJbWFnZSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBzcGVjaWZ5IGtleSBpbWFnZSB0byBmcmVlemVcIik7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZnJlZXplX291dHB1dCh0aGlzLmNwcEFkZHJlc3MsIGtleUltYWdlLCAoKSA9PiByZXNvbHZlKCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHRoYXdPdXRwdXQoa2V5SW1hZ2U6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkudGhhd091dHB1dChrZXlJbWFnZSk7XG4gICAgaWYgKCFrZXlJbWFnZSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBzcGVjaWZ5IGtleSBpbWFnZSB0byB0aGF3XCIpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnRoYXdfb3V0cHV0KHRoaXMuY3BwQWRkcmVzcywga2V5SW1hZ2UsICgpID0+IHJlc29sdmUoKSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgaXNPdXRwdXRGcm96ZW4oa2V5SW1hZ2U6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaXNPdXRwdXRGcm96ZW4oa2V5SW1hZ2UpO1xuICAgIGlmICgha2V5SW1hZ2UpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3Qgc3BlY2lmeSBrZXkgaW1hZ2UgdG8gY2hlY2sgaWYgZnJvemVuXCIpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmlzX291dHB1dF9mcm96ZW4odGhpcy5jcHBBZGRyZXNzLCBrZXlJbWFnZSwgKHJlc3VsdCkgPT4gcmVzb2x2ZShyZXN1bHQpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgZ2V0RGVmYXVsdEZlZVByaW9yaXR5KCk6IFByb21pc2U8TW9uZXJvVHhQcmlvcml0eT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0RGVmYXVsdEZlZVByaW9yaXR5KCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X2RlZmF1bHRfZmVlX3ByaW9yaXR5KHRoaXMuY3BwQWRkcmVzcywgKHJlc3VsdCkgPT4gcmVzb2x2ZShyZXN1bHQpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBjcmVhdGVUeHMoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuY3JlYXRlVHhzKGNvbmZpZyk7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUsIGNvcHksIGFuZCBub3JtYWxpemUgY29uZmlnXG4gICAgY29uc3QgY29uZmlnTm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVDcmVhdGVUeHNDb25maWcoY29uZmlnKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpID09PSB1bmRlZmluZWQpIGNvbmZpZ05vcm1hbGl6ZWQuc2V0Q2FuU3BsaXQodHJ1ZSk7XG4gICAgXG4gICAgLy8gY3JlYXRlIHR4cyBpbiBxdWV1ZVxuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyBjcmVhdGUgdHhzIGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgdGhpcy5tb2R1bGUuY3JlYXRlX3R4cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KGNvbmZpZ05vcm1hbGl6ZWQudG9Kc29uKCkpLCAodHhTZXRKc29uU3RyKSA9PiB7XG4gICAgICAgICAgaWYgKHR4U2V0SnNvblN0ci5jaGFyQXQoMCkgIT09ICd7JykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcih0eFNldEpzb25TdHIpKTsgLy8ganNvbiBleHBlY3RlZCwgZWxzZSBlcnJvclxuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvVHhTZXQoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHR4U2V0SnNvblN0cikpKS5nZXRUeHMoKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN3ZWVwT3V0cHV0KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zd2VlcE91dHB1dChjb25maWcpO1xuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSBhbmQgdmFsaWRhdGUgY29uZmlnXG4gICAgY29uc3QgY29uZmlnTm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVTd2VlcE91dHB1dENvbmZpZyhjb25maWcpO1xuICAgIFxuICAgIC8vIHN3ZWVwIG91dHB1dCBpbiBxdWV1ZVxuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyBzd2VlcCBvdXRwdXQgaW4gd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICB0aGlzLm1vZHVsZS5zd2VlcF9vdXRwdXQodGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeShjb25maWdOb3JtYWxpemVkLnRvSnNvbigpKSwgKHR4U2V0SnNvblN0cikgPT4ge1xuICAgICAgICAgIGlmICh0eFNldEpzb25TdHIuY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IodHhTZXRKc29uU3RyKSk7IC8vIGpzb24gZXhwZWN0ZWQsIGVsc2UgZXJyb3JcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb1R4U2V0KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyh0eFNldEpzb25TdHIpKSkuZ2V0VHhzKClbMF0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgc3dlZXBVbmxvY2tlZChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zd2VlcFVubG9ja2VkKGNvbmZpZyk7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgYW5kIG5vcm1hbGl6ZSBjb25maWdcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVN3ZWVwVW5sb2NrZWRDb25maWcoY29uZmlnKTtcbiAgICBcbiAgICAvLyBzd2VlcCB1bmxvY2tlZCBpbiBxdWV1ZVxuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyBzd2VlcCB1bmxvY2tlZCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIHRoaXMubW9kdWxlLnN3ZWVwX3VubG9ja2VkKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoY29uZmlnTm9ybWFsaXplZC50b0pzb24oKSksICh0eFNldHNKc29uKSA9PiB7XG4gICAgICAgICAgaWYgKHR4U2V0c0pzb24uY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IodHhTZXRzSnNvbikpOyAvLyBqc29uIGV4cGVjdGVkLCBlbHNlIGVycm9yXG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsZXQgdHhTZXRzID0gW107XG4gICAgICAgICAgICBmb3IgKGxldCB0eFNldEpzb24gb2YgSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHR4U2V0c0pzb24pKS50eFNldHMpIHR4U2V0cy5wdXNoKG5ldyBNb25lcm9UeFNldCh0eFNldEpzb24pKTtcbiAgICAgICAgICAgIGxldCB0eHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAobGV0IHR4U2V0IG9mIHR4U2V0cykgZm9yIChsZXQgdHggb2YgdHhTZXQuZ2V0VHhzKCkpIHR4cy5wdXNoKHR4KTtcbiAgICAgICAgICAgIHJlc29sdmUodHhzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN3ZWVwRHVzdChyZWxheT86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN3ZWVwRHVzdChyZWxheSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIGNhbGwgd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICB0aGlzLm1vZHVsZS5zd2VlcF9kdXN0KHRoaXMuY3BwQWRkcmVzcywgcmVsYXksICh0eFNldEpzb25TdHIpID0+IHtcbiAgICAgICAgICBpZiAodHhTZXRKc29uU3RyLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHR4U2V0SnNvblN0cikpOyAvLyBqc29uIGV4cGVjdGVkLCBlbHNlIGVycm9yXG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsZXQgdHhTZXQgPSBuZXcgTW9uZXJvVHhTZXQoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHR4U2V0SnNvblN0cikpKTtcbiAgICAgICAgICAgIGlmICh0eFNldC5nZXRUeHMoKSA9PT0gdW5kZWZpbmVkKSB0eFNldC5zZXRUeHMoW10pO1xuICAgICAgICAgICAgcmVzb2x2ZSh0eFNldC5nZXRUeHMoKSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyByZWxheVR4cyh0eHNPck1ldGFkYXRhczogKE1vbmVyb1R4V2FsbGV0IHwgc3RyaW5nKVtdKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkucmVsYXlUeHModHhzT3JNZXRhZGF0YXMpO1xuICAgIGFzc2VydChBcnJheS5pc0FycmF5KHR4c09yTWV0YWRhdGFzKSwgXCJNdXN0IHByb3ZpZGUgYW4gYXJyYXkgb2YgdHhzIG9yIHRoZWlyIG1ldGFkYXRhIHRvIHJlbGF5XCIpO1xuICAgIGxldCB0eE1ldGFkYXRhcyA9IFtdO1xuICAgIGZvciAobGV0IHR4T3JNZXRhZGF0YSBvZiB0eHNPck1ldGFkYXRhcykgdHhNZXRhZGF0YXMucHVzaCh0eE9yTWV0YWRhdGEgaW5zdGFuY2VvZiBNb25lcm9UeFdhbGxldCA/IHR4T3JNZXRhZGF0YS5nZXRNZXRhZGF0YSgpIDogdHhPck1ldGFkYXRhKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5yZWxheV90eHModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7dHhNZXRhZGF0YXM6IHR4TWV0YWRhdGFzfSksICh0eEhhc2hlc0pzb24pID0+IHtcbiAgICAgICAgICBpZiAodHhIYXNoZXNKc29uLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHR4SGFzaGVzSnNvbikpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShKU09OLnBhcnNlKHR4SGFzaGVzSnNvbikudHhIYXNoZXMpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBkZXNjcmliZVR4U2V0KHR4U2V0OiBNb25lcm9UeFNldCk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmRlc2NyaWJlVHhTZXQodHhTZXQpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHR4U2V0ID0gbmV3IE1vbmVyb1R4U2V0KHt1bnNpZ25lZFR4SGV4OiB0eFNldC5nZXRVbnNpZ25lZFR4SGV4KCksIHNpZ25lZFR4SGV4OiB0eFNldC5nZXRTaWduZWRUeEhleCgpLCBtdWx0aXNpZ1R4SGV4OiB0eFNldC5nZXRNdWx0aXNpZ1R4SGV4KCl9KTtcbiAgICAgIHRyeSB7IHJldHVybiBuZXcgTW9uZXJvVHhTZXQoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHRoaXMubW9kdWxlLmRlc2NyaWJlX3R4X3NldCh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHR4U2V0LnRvSnNvbigpKSkpKSk7IH1cbiAgICAgIGNhdGNoIChlcnIpIHsgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHRoaXMubW9kdWxlLmdldF9leGNlcHRpb25fbWVzc2FnZShlcnIpKTsgfVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzaWduVHhzKHVuc2lnbmVkVHhIZXg6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNpZ25UeHModW5zaWduZWRUeEhleCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdHJ5IHsgcmV0dXJuIG5ldyBNb25lcm9UeFNldChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHModGhpcy5tb2R1bGUuc2lnbl90eHModGhpcy5jcHBBZGRyZXNzLCB1bnNpZ25lZFR4SGV4KSkpKTsgfVxuICAgICAgY2F0Y2ggKGVycikgeyB0aHJvdyBuZXcgTW9uZXJvRXJyb3IodGhpcy5tb2R1bGUuZ2V0X2V4Y2VwdGlvbl9tZXNzYWdlKGVycikpOyB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdFR4cyhzaWduZWRUeEhleDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3VibWl0VHhzKHNpZ25lZFR4SGV4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5zdWJtaXRfdHhzKHRoaXMuY3BwQWRkcmVzcywgc2lnbmVkVHhIZXgsIChyZXNwKSA9PiB7XG4gICAgICAgICAgaWYgKHJlc3AuY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcCkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShKU09OLnBhcnNlKHJlc3ApLnR4SGFzaGVzKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc2lnbk1lc3NhZ2UobWVzc2FnZTogc3RyaW5nLCBzaWduYXR1cmVUeXBlID0gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSwgYWNjb3VudElkeCA9IDAsIHN1YmFkZHJlc3NJZHggPSAwKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNpZ25NZXNzYWdlKG1lc3NhZ2UsIHNpZ25hdHVyZVR5cGUsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpO1xuICAgIFxuICAgIC8vIGFzc2lnbiBkZWZhdWx0c1xuICAgIHNpZ25hdHVyZVR5cGUgPSBzaWduYXR1cmVUeXBlIHx8IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9TUEVORF9LRVk7XG4gICAgYWNjb3VudElkeCA9IGFjY291bnRJZHggfHwgMDtcbiAgICBzdWJhZGRyZXNzSWR4ID0gc3ViYWRkcmVzc0lkeCB8fCAwO1xuICAgIFxuICAgIC8vIHF1ZXVlIHRhc2sgdG8gc2lnbiBtZXNzYWdlXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdHJ5IHsgcmV0dXJuIHRoaXMubW9kdWxlLnNpZ25fbWVzc2FnZSh0aGlzLmNwcEFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZVR5cGUgPT09IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9TUEVORF9LRVkgPyAwIDogMSwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7IH1cbiAgICAgIGNhdGNoIChlcnIpIHsgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHRoaXMubW9kdWxlLmdldF9leGNlcHRpb25fbWVzc2FnZShlcnIpKTsgfVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyB2ZXJpZnlNZXNzYWdlKG1lc3NhZ2U6IHN0cmluZywgYWRkcmVzczogc3RyaW5nLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkudmVyaWZ5TWVzc2FnZShtZXNzYWdlLCBhZGRyZXNzLCBzaWduYXR1cmUpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCByZXN1bHQ7XG4gICAgICB0cnkge1xuICAgICAgICByZXN1bHQgPSBKU09OLnBhcnNlKHRoaXMubW9kdWxlLnZlcmlmeV9tZXNzYWdlKHRoaXMuY3BwQWRkcmVzcywgbWVzc2FnZSwgYWRkcmVzcywgc2lnbmF0dXJlKSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgcmVzdWx0ID0ge2lzR29vZDogZmFsc2V9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0KHJlc3VsdC5pc0dvb2QgP1xuICAgICAgICB7aXNHb29kOiByZXN1bHQuaXNHb29kLCBpc09sZDogcmVzdWx0LmlzT2xkLCBzaWduYXR1cmVUeXBlOiByZXN1bHQuc2lnbmF0dXJlVHlwZSA9PT0gXCJzcGVuZFwiID8gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSA6IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9WSUVXX0tFWSwgdmVyc2lvbjogcmVzdWx0LnZlcnNpb259IDpcbiAgICAgICAge2lzR29vZDogZmFsc2V9XG4gICAgICApO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeEtleSh0eEhhc2g6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRUeEtleSh0eEhhc2gpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7IHJldHVybiB0aGlzLm1vZHVsZS5nZXRfdHhfa2V5KHRoaXMuY3BwQWRkcmVzcywgdHhIYXNoKTsgfVxuICAgICAgY2F0Y2ggKGVycikgeyB0aHJvdyBuZXcgTW9uZXJvRXJyb3IodGhpcy5tb2R1bGUuZ2V0X2V4Y2VwdGlvbl9tZXNzYWdlKGVycikpOyB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrVHhLZXkodHhIYXNoOiBzdHJpbmcsIHR4S2V5OiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tUeD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuY2hlY2tUeEtleSh0eEhhc2gsIHR4S2V5LCBhZGRyZXNzKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7IFxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuY2hlY2tfdHhfa2V5KHRoaXMuY3BwQWRkcmVzcywgdHhIYXNoLCB0eEtleSwgYWRkcmVzcywgKHJlc3BKc29uU3RyKSA9PiB7XG4gICAgICAgICAgaWYgKHJlc3BKc29uU3RyLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3BKc29uU3RyKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9DaGVja1R4KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhyZXNwSnNvblN0cikpKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4UHJvb2YodHhIYXNoOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRUeFByb29mKHR4SGFzaCwgYWRkcmVzcywgbWVzc2FnZSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X3R4X3Byb29mKHRoaXMuY3BwQWRkcmVzcywgdHhIYXNoIHx8IFwiXCIsIGFkZHJlc3MgfHwgXCJcIiwgbWVzc2FnZSB8fCBcIlwiLCAoc2lnbmF0dXJlKSA9PiB7XG4gICAgICAgICAgbGV0IGVycm9yS2V5ID0gXCJlcnJvcjogXCI7XG4gICAgICAgICAgaWYgKHNpZ25hdHVyZS5pbmRleE9mKGVycm9yS2V5KSA9PT0gMCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihzaWduYXR1cmUuc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCkpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoc2lnbmF0dXJlKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tUeFByb29mKHR4SGFzaDogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrVHg+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmNoZWNrVHhQcm9vZih0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpOyBcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmNoZWNrX3R4X3Byb29mKHRoaXMuY3BwQWRkcmVzcywgdHhIYXNoIHx8IFwiXCIsIGFkZHJlc3MgfHwgXCJcIiwgbWVzc2FnZSB8fCBcIlwiLCBzaWduYXR1cmUgfHwgXCJcIiwgKHJlc3BKc29uU3RyKSA9PiB7XG4gICAgICAgICAgaWYgKHJlc3BKc29uU3RyLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3BKc29uU3RyKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9DaGVja1R4KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhyZXNwSnNvblN0cikpKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFNwZW5kUHJvb2YodHhIYXNoOiBzdHJpbmcsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0U3BlbmRQcm9vZih0eEhhc2gsIG1lc3NhZ2UpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmdldF9zcGVuZF9wcm9vZih0aGlzLmNwcEFkZHJlc3MsIHR4SGFzaCB8fCBcIlwiLCBtZXNzYWdlIHx8IFwiXCIsIChzaWduYXR1cmUpID0+IHtcbiAgICAgICAgICBsZXQgZXJyb3JLZXkgPSBcImVycm9yOiBcIjtcbiAgICAgICAgICBpZiAoc2lnbmF0dXJlLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHNpZ25hdHVyZS5zdWJzdHJpbmcoZXJyb3JLZXkubGVuZ3RoKSkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShzaWduYXR1cmUpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBjaGVja1NwZW5kUHJvb2YodHhIYXNoOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmNoZWNrU3BlbmRQcm9vZih0eEhhc2gsIG1lc3NhZ2UsIHNpZ25hdHVyZSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpOyBcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmNoZWNrX3NwZW5kX3Byb29mKHRoaXMuY3BwQWRkcmVzcywgdHhIYXNoIHx8IFwiXCIsIG1lc3NhZ2UgfHwgXCJcIiwgc2lnbmF0dXJlIHx8IFwiXCIsIChyZXNwKSA9PiB7XG4gICAgICAgICAgdHlwZW9mIHJlc3AgPT09IFwic3RyaW5nXCIgPyByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKSA6IHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFJlc2VydmVQcm9vZldhbGxldChtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFJlc2VydmVQcm9vZldhbGxldChtZXNzYWdlKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfcmVzZXJ2ZV9wcm9vZl93YWxsZXQodGhpcy5jcHBBZGRyZXNzLCBtZXNzYWdlLCAoc2lnbmF0dXJlKSA9PiB7XG4gICAgICAgICAgbGV0IGVycm9yS2V5ID0gXCJlcnJvcjogXCI7XG4gICAgICAgICAgaWYgKHNpZ25hdHVyZS5pbmRleE9mKGVycm9yS2V5KSA9PT0gMCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihzaWduYXR1cmUuc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCksIC0xKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKHNpZ25hdHVyZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFJlc2VydmVQcm9vZkFjY291bnQoYWNjb3VudElkeDogbnVtYmVyLCBhbW91bnQ6IGJpZ2ludCwgbWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRSZXNlcnZlUHJvb2ZBY2NvdW50KGFjY291bnRJZHgsIGFtb3VudCwgbWVzc2FnZSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X3Jlc2VydmVfcHJvb2ZfYWNjb3VudCh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgsIGFtb3VudC50b1N0cmluZygpLCBtZXNzYWdlLCAoc2lnbmF0dXJlKSA9PiB7XG4gICAgICAgICAgbGV0IGVycm9yS2V5ID0gXCJlcnJvcjogXCI7XG4gICAgICAgICAgaWYgKHNpZ25hdHVyZS5pbmRleE9mKGVycm9yS2V5KSA9PT0gMCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihzaWduYXR1cmUuc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCksIC0xKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKHNpZ25hdHVyZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBjaGVja1Jlc2VydmVQcm9vZihhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrUmVzZXJ2ZT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuY2hlY2tSZXNlcnZlUHJvb2YoYWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7IFxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuY2hlY2tfcmVzZXJ2ZV9wcm9vZih0aGlzLmNwcEFkZHJlc3MsIGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSwgKHJlc3BKc29uU3RyKSA9PiB7XG4gICAgICAgICAgaWYgKHJlc3BKc29uU3RyLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3BKc29uU3RyLCAtMSkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvQ2hlY2tSZXNlcnZlKEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhyZXNwSnNvblN0cikpKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4Tm90ZXModHhIYXNoZXM6IHN0cmluZ1tdKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0VHhOb3Rlcyh0eEhhc2hlcyk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdHJ5IHsgcmV0dXJuIEpTT04ucGFyc2UodGhpcy5tb2R1bGUuZ2V0X3R4X25vdGVzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe3R4SGFzaGVzOiB0eEhhc2hlc30pKSkudHhOb3RlczsgfVxuICAgICAgY2F0Y2ggKGVycikgeyB0aHJvdyBuZXcgTW9uZXJvRXJyb3IodGhpcy5tb2R1bGUuZ2V0X2V4Y2VwdGlvbl9tZXNzYWdlKGVycikpOyB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNldFR4Tm90ZXModHhIYXNoZXM6IHN0cmluZ1tdLCBub3Rlczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNldFR4Tm90ZXModHhIYXNoZXMsIG5vdGVzKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkgeyB0aGlzLm1vZHVsZS5zZXRfdHhfbm90ZXModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7dHhIYXNoZXM6IHR4SGFzaGVzLCB0eE5vdGVzOiBub3Rlc30pKTsgfVxuICAgICAgY2F0Y2ggKGVycikgeyB0aHJvdyBuZXcgTW9uZXJvRXJyb3IodGhpcy5tb2R1bGUuZ2V0X2V4Y2VwdGlvbl9tZXNzYWdlKGVycikpOyB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFkZHJlc3NCb29rRW50cmllcyhlbnRyeUluZGljZXM/OiBudW1iZXJbXSk6IFByb21pc2U8TW9uZXJvQWRkcmVzc0Jvb2tFbnRyeVtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRBZGRyZXNzQm9va0VudHJpZXMoZW50cnlJbmRpY2VzKTtcbiAgICBpZiAoIWVudHJ5SW5kaWNlcykgZW50cnlJbmRpY2VzID0gW107XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IGVudHJpZXMgPSBbXTtcbiAgICAgIGZvciAobGV0IGVudHJ5SnNvbiBvZiBKU09OLnBhcnNlKHRoaXMubW9kdWxlLmdldF9hZGRyZXNzX2Jvb2tfZW50cmllcyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHtlbnRyeUluZGljZXM6IGVudHJ5SW5kaWNlc30pKSkuZW50cmllcykge1xuICAgICAgICBlbnRyaWVzLnB1c2gobmV3IE1vbmVyb0FkZHJlc3NCb29rRW50cnkoZW50cnlKc29uKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZW50cmllcztcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgYWRkQWRkcmVzc0Jvb2tFbnRyeShhZGRyZXNzOiBzdHJpbmcsIGRlc2NyaXB0aW9uPzogc3RyaW5nKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmFkZEFkZHJlc3NCb29rRW50cnkoYWRkcmVzcywgZGVzY3JpcHRpb24pO1xuICAgIGlmICghYWRkcmVzcykgYWRkcmVzcyA9IFwiXCI7XG4gICAgaWYgKCFkZXNjcmlwdGlvbikgZGVzY3JpcHRpb24gPSBcIlwiO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5hZGRfYWRkcmVzc19ib29rX2VudHJ5KHRoaXMuY3BwQWRkcmVzcywgYWRkcmVzcywgZGVzY3JpcHRpb24pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBlZGl0QWRkcmVzc0Jvb2tFbnRyeShpbmRleDogbnVtYmVyLCBzZXRBZGRyZXNzOiBib29sZWFuLCBhZGRyZXNzOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNldERlc2NyaXB0aW9uOiBib29sZWFuLCBkZXNjcmlwdGlvbjogc3RyaW5nIHwgdW5kZWZpbmVkKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5lZGl0QWRkcmVzc0Jvb2tFbnRyeShpbmRleCwgc2V0QWRkcmVzcywgYWRkcmVzcywgc2V0RGVzY3JpcHRpb24sIGRlc2NyaXB0aW9uKTtcbiAgICBpZiAoIXNldEFkZHJlc3MpIHNldEFkZHJlc3MgPSBmYWxzZTtcbiAgICBpZiAoIWFkZHJlc3MpIGFkZHJlc3MgPSBcIlwiO1xuICAgIGlmICghc2V0RGVzY3JpcHRpb24pIHNldERlc2NyaXB0aW9uID0gZmFsc2U7XG4gICAgaWYgKCFkZXNjcmlwdGlvbikgZGVzY3JpcHRpb24gPSBcIlwiO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRoaXMubW9kdWxlLmVkaXRfYWRkcmVzc19ib29rX2VudHJ5KHRoaXMuY3BwQWRkcmVzcywgaW5kZXgsIHNldEFkZHJlc3MsIGFkZHJlc3MsIHNldERlc2NyaXB0aW9uLCBkZXNjcmlwdGlvbik7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGRlbGV0ZUFkZHJlc3NCb29rRW50cnkoZW50cnlJZHg6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeShlbnRyeUlkeCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdGhpcy5tb2R1bGUuZGVsZXRlX2FkZHJlc3NfYm9va19lbnRyeSh0aGlzLmNwcEFkZHJlc3MsIGVudHJ5SWR4KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgdGFnQWNjb3VudHModGFnOiBzdHJpbmcsIGFjY291bnRJbmRpY2VzOiBudW1iZXJbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkudGFnQWNjb3VudHModGFnLCBhY2NvdW50SW5kaWNlcyk7XG4gICAgaWYgKCF0YWcpIHRhZyA9IFwiXCI7XG4gICAgaWYgKCFhY2NvdW50SW5kaWNlcykgYWNjb3VudEluZGljZXMgPSBbXTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0aGlzLm1vZHVsZS50YWdfYWNjb3VudHModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7dGFnOiB0YWcsIGFjY291bnRJbmRpY2VzOiBhY2NvdW50SW5kaWNlc30pKTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIHVudGFnQWNjb3VudHMoYWNjb3VudEluZGljZXM6IG51bWJlcltdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS51bnRhZ0FjY291bnRzKGFjY291bnRJbmRpY2VzKTtcbiAgICBpZiAoIWFjY291bnRJbmRpY2VzKSBhY2NvdW50SW5kaWNlcyA9IFtdO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRoaXMubW9kdWxlLnRhZ19hY2NvdW50cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHthY2NvdW50SW5kaWNlczogYWNjb3VudEluZGljZXN9KSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFjY291bnRUYWdzKCk6IFByb21pc2U8TW9uZXJvQWNjb3VudFRhZ1tdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRBY2NvdW50VGFncygpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCBhY2NvdW50VGFncyA9IFtdO1xuICAgICAgZm9yIChsZXQgYWNjb3VudFRhZ0pzb24gb2YgSlNPTi5wYXJzZSh0aGlzLm1vZHVsZS5nZXRfYWNjb3VudF90YWdzKHRoaXMuY3BwQWRkcmVzcykpLmFjY291bnRUYWdzKSBhY2NvdW50VGFncy5wdXNoKG5ldyBNb25lcm9BY2NvdW50VGFnKGFjY291bnRUYWdKc29uKSk7XG4gICAgICByZXR1cm4gYWNjb3VudFRhZ3M7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBzZXRBY2NvdW50VGFnTGFiZWwodGFnOiBzdHJpbmcsIGxhYmVsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNldEFjY291bnRUYWdMYWJlbCh0YWcsIGxhYmVsKTtcbiAgICBpZiAoIXRhZykgdGFnID0gXCJcIjtcbiAgICBpZiAoIWxhYmVsKSBsYWJlbCA9IFwiXCI7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdGhpcy5tb2R1bGUuc2V0X2FjY291bnRfdGFnX2xhYmVsKHRoaXMuY3BwQWRkcmVzcywgdGFnLCBsYWJlbCk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBheW1lbnRVcmkoY29uZmlnOiBNb25lcm9UeENvbmZpZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRQYXltZW50VXJpKGNvbmZpZyk7XG4gICAgY29uZmlnID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyhjb25maWcpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5nZXRfcGF5bWVudF91cmkodGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeShjb25maWcudG9Kc29uKCkpKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgbWFrZSBVUkkgZnJvbSBzdXBwbGllZCBwYXJhbWV0ZXJzXCIpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBwYXJzZVBheW1lbnRVcmkodXJpOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1R4Q29uZmlnPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5wYXJzZVBheW1lbnRVcmkodXJpKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gbmV3IE1vbmVyb1R4Q29uZmlnKEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyh0aGlzLm1vZHVsZS5wYXJzZV9wYXltZW50X3VyaSh0aGlzLmNwcEFkZHJlc3MsIHVyaSkpKSk7XG4gICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZXJyLm1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRBdHRyaWJ1dGUoa2V5OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0QXR0cmlidXRlKGtleSk7XG4gICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICBhc3NlcnQodHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiwgXCJBdHRyaWJ1dGUga2V5IG11c3QgYmUgYSBzdHJpbmdcIik7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IHZhbHVlID0gdGhpcy5tb2R1bGUuZ2V0X2F0dHJpYnV0ZSh0aGlzLmNwcEFkZHJlc3MsIGtleSk7XG4gICAgICByZXR1cm4gdmFsdWUgPT09IFwiXCIgPyBudWxsIDogdmFsdWU7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNldEF0dHJpYnV0ZShrZXk6IHN0cmluZywgdmFsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNldEF0dHJpYnV0ZShrZXksIHZhbCk7XG4gICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICBhc3NlcnQodHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiwgXCJBdHRyaWJ1dGUga2V5IG11c3QgYmUgYSBzdHJpbmdcIik7XG4gICAgYXNzZXJ0KHR5cGVvZiB2YWwgPT09IFwic3RyaW5nXCIsIFwiQXR0cmlidXRlIHZhbHVlIG11c3QgYmUgYSBzdHJpbmdcIik7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdGhpcy5tb2R1bGUuc2V0X2F0dHJpYnV0ZSh0aGlzLmNwcEFkZHJlc3MsIGtleSwgdmFsKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc3RhcnRNaW5pbmcobnVtVGhyZWFkczogbnVtYmVyLCBiYWNrZ3JvdW5kTWluaW5nPzogYm9vbGVhbiwgaWdub3JlQmF0dGVyeT86IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN0YXJ0TWluaW5nKG51bVRocmVhZHMsIGJhY2tncm91bmRNaW5pbmcsIGlnbm9yZUJhdHRlcnkpO1xuICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgbGV0IGRhZW1vbiA9IGF3YWl0IE1vbmVyb0RhZW1vblJwYy5jb25uZWN0VG9EYWVtb25ScGMoYXdhaXQgdGhpcy5nZXREYWVtb25Db25uZWN0aW9uKCkpO1xuICAgIGF3YWl0IGRhZW1vbi5zdGFydE1pbmluZyhhd2FpdCB0aGlzLmdldFByaW1hcnlBZGRyZXNzKCksIG51bVRocmVhZHMsIGJhY2tncm91bmRNaW5pbmcsIGlnbm9yZUJhdHRlcnkpO1xuICB9XG4gIFxuICBhc3luYyBzdG9wTWluaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3RvcE1pbmluZygpO1xuICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgbGV0IGRhZW1vbiA9IGF3YWl0IE1vbmVyb0RhZW1vblJwYy5jb25uZWN0VG9EYWVtb25ScGMoYXdhaXQgdGhpcy5nZXREYWVtb25Db25uZWN0aW9uKCkpO1xuICAgIGF3YWl0IGRhZW1vbi5zdG9wTWluaW5nKCk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzTXVsdGlzaWdJbXBvcnROZWVkZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pc011bHRpc2lnSW1wb3J0TmVlZGVkKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLmlzX211bHRpc2lnX2ltcG9ydF9uZWVkZWQodGhpcy5jcHBBZGRyZXNzKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgaXNNdWx0aXNpZygpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmlzTXVsdGlzaWcoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gdGhpcy5tb2R1bGUuaXNfbXVsdGlzaWcodGhpcy5jcHBBZGRyZXNzKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TXVsdGlzaWdJbmZvKCk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdJbmZvPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRNdWx0aXNpZ0luZm8oKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IE1vbmVyb011bHRpc2lnSW5mbyhKU09OLnBhcnNlKHRoaXMubW9kdWxlLmdldF9tdWx0aXNpZ19pbmZvKHRoaXMuY3BwQWRkcmVzcykpKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgcHJlcGFyZU11bHRpc2lnKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5wcmVwYXJlTXVsdGlzaWcoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gdGhpcy5tb2R1bGUucHJlcGFyZV9tdWx0aXNpZyh0aGlzLmNwcEFkZHJlc3MpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBtYWtlTXVsdGlzaWcobXVsdGlzaWdIZXhlczogc3RyaW5nW10sIHRocmVzaG9sZDogbnVtYmVyLCBwYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLm1ha2VNdWx0aXNpZyhtdWx0aXNpZ0hleGVzLCB0aHJlc2hvbGQsIHBhc3N3b3JkKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5tYWtlX211bHRpc2lnKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe211bHRpc2lnSGV4ZXM6IG11bHRpc2lnSGV4ZXMsIHRocmVzaG9sZDogdGhyZXNob2xkLCBwYXNzd29yZDogcGFzc3dvcmR9KSwgKHJlc3ApID0+IHtcbiAgICAgICAgICBsZXQgZXJyb3JLZXkgPSBcImVycm9yOiBcIjtcbiAgICAgICAgICBpZiAocmVzcC5pbmRleE9mKGVycm9yS2V5KSA9PT0gMCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwLnN1YnN0cmluZyhlcnJvcktleS5sZW5ndGgpKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBleGNoYW5nZU11bHRpc2lnS2V5cyhtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgcGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5leGNoYW5nZU11bHRpc2lnS2V5cyhtdWx0aXNpZ0hleGVzLCBwYXNzd29yZCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZXhjaGFuZ2VfbXVsdGlzaWdfa2V5cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHttdWx0aXNpZ0hleGVzOiBtdWx0aXNpZ0hleGVzLCBwYXNzd29yZDogcGFzc3dvcmR9KSwgKHJlc3ApID0+IHtcbiAgICAgICAgICBsZXQgZXJyb3JLZXkgPSBcImVycm9yOiBcIjtcbiAgICAgICAgICBpZiAocmVzcC5pbmRleE9mKGVycm9yS2V5KSA9PT0gMCkgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwLnN1YnN0cmluZyhlcnJvcktleS5sZW5ndGgpKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQoSlNPTi5wYXJzZShyZXNwKSkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBleHBvcnRNdWx0aXNpZ0hleCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZXhwb3J0TXVsdGlzaWdIZXgoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gdGhpcy5tb2R1bGUuZXhwb3J0X211bHRpc2lnX2hleCh0aGlzLmNwcEFkZHJlc3MpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRNdWx0aXNpZ0hleChtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgcmVmcmVzaEFmdGVySW1wb3J0PzogYm9vbGVhbik6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHJlZnJlc2hBZnRlckltcG9ydCA9PT0gdW5kZWZpbmVkKSByZWZyZXNoQWZ0ZXJJbXBvcnQgPSB0cnVlO1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaW1wb3J0TXVsdGlzaWdIZXgobXVsdGlzaWdIZXhlcywgcmVmcmVzaEFmdGVySW1wb3J0KTtcbiAgICBpZiAoIUdlblV0aWxzLmlzQXJyYXkobXVsdGlzaWdIZXhlcykpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBzdHJpbmdbXSB0byBpbXBvcnRNdWx0aXNpZ0hleCgpXCIpXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuaW1wb3J0X211bHRpc2lnX2hleCh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHttdWx0aXNpZ0hleGVzOiBtdWx0aXNpZ0hleGVzLCByZWZyZXNoQWZ0ZXJJbXBvcnQ6IHJlZnJlc2hBZnRlckltcG9ydH0pLCAocmVzcCkgPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgcmVzcCA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzaWduTXVsdGlzaWdUeEhleChtdWx0aXNpZ1R4SGV4OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb011bHRpc2lnU2lnblJlc3VsdD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2lnbk11bHRpc2lnVHhIZXgobXVsdGlzaWdUeEhleCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuc2lnbl9tdWx0aXNpZ190eF9oZXgodGhpcy5jcHBBZGRyZXNzLCBtdWx0aXNpZ1R4SGV4LCAocmVzcCkgPT4ge1xuICAgICAgICAgIGlmIChyZXNwLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb011bHRpc2lnU2lnblJlc3VsdChKU09OLnBhcnNlKHJlc3ApKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdE11bHRpc2lnVHhIZXgoc2lnbmVkTXVsdGlzaWdUeEhleDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3VibWl0TXVsdGlzaWdUeEhleChzaWduZWRNdWx0aXNpZ1R4SGV4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5zdWJtaXRfbXVsdGlzaWdfdHhfaGV4KHRoaXMuY3BwQWRkcmVzcywgc2lnbmVkTXVsdGlzaWdUeEhleCwgKHJlc3ApID0+IHtcbiAgICAgICAgICBpZiAocmVzcC5jaGFyQXQoMCkgIT09ICd7JykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKEpTT04ucGFyc2UocmVzcCkudHhIYXNoZXMpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSB3YWxsZXQncyBrZXlzIGFuZCBjYWNoZSBkYXRhLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxEYXRhVmlld1tdPn0gaXMgdGhlIGtleXMgYW5kIGNhY2hlIGRhdGEsIHJlc3BlY3RpdmVseVxuICAgKi9cbiAgYXN5bmMgZ2V0RGF0YSgpOiBQcm9taXNlPERhdGFWaWV3W10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldERhdGEoKTtcbiAgICBcbiAgICAvLyBxdWV1ZSBjYWxsIHRvIHdhc20gbW9kdWxlXG4gICAgbGV0IHZpZXdPbmx5ID0gYXdhaXQgdGhpcy5pc1ZpZXdPbmx5KCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgXG4gICAgICAvLyBzdG9yZSB2aWV3cyBpbiBhcnJheVxuICAgICAgbGV0IHZpZXdzID0gW107XG4gICAgICBcbiAgICAgIC8vIG1hbGxvYyBjYWNoZSBidWZmZXIgYW5kIGdldCBidWZmZXIgbG9jYXRpb24gaW4gYysrIGhlYXBcbiAgICAgIGxldCBjYWNoZUJ1ZmZlckxvYyA9IEpTT04ucGFyc2UodGhpcy5tb2R1bGUuZ2V0X2NhY2hlX2ZpbGVfYnVmZmVyKHRoaXMuY3BwQWRkcmVzcykpO1xuICAgICAgXG4gICAgICAvLyByZWFkIGJpbmFyeSBkYXRhIGZyb20gaGVhcCB0byBEYXRhVmlld1xuICAgICAgbGV0IHZpZXcgPSBuZXcgRGF0YVZpZXcobmV3IEFycmF5QnVmZmVyKGNhY2hlQnVmZmVyTG9jLmxlbmd0aCkpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjYWNoZUJ1ZmZlckxvYy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2aWV3LnNldEludDgoaSwgdGhpcy5tb2R1bGUuSEVBUFU4W2NhY2hlQnVmZmVyTG9jLnBvaW50ZXIgLyBVaW50OEFycmF5LkJZVEVTX1BFUl9FTEVNRU5UICsgaV0pO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBmcmVlIGJpbmFyeSBvbiBoZWFwXG4gICAgICB0aGlzLm1vZHVsZS5fZnJlZShjYWNoZUJ1ZmZlckxvYy5wb2ludGVyKTtcbiAgICAgIFxuICAgICAgLy8gd3JpdGUgY2FjaGUgZmlsZVxuICAgICAgdmlld3MucHVzaChCdWZmZXIuZnJvbSh2aWV3LmJ1ZmZlcikpO1xuICAgICAgXG4gICAgICAvLyBtYWxsb2Mga2V5cyBidWZmZXIgYW5kIGdldCBidWZmZXIgbG9jYXRpb24gaW4gYysrIGhlYXBcbiAgICAgIGxldCBrZXlzQnVmZmVyTG9jID0gSlNPTi5wYXJzZSh0aGlzLm1vZHVsZS5nZXRfa2V5c19maWxlX2J1ZmZlcih0aGlzLmNwcEFkZHJlc3MsIHRoaXMucGFzc3dvcmQsIHZpZXdPbmx5KSk7XG4gICAgICBcbiAgICAgIC8vIHJlYWQgYmluYXJ5IGRhdGEgZnJvbSBoZWFwIHRvIERhdGFWaWV3XG4gICAgICB2aWV3ID0gbmV3IERhdGFWaWV3KG5ldyBBcnJheUJ1ZmZlcihrZXlzQnVmZmVyTG9jLmxlbmd0aCkpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzQnVmZmVyTG9jLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZpZXcuc2V0SW50OChpLCB0aGlzLm1vZHVsZS5IRUFQVThba2V5c0J1ZmZlckxvYy5wb2ludGVyIC8gVWludDhBcnJheS5CWVRFU19QRVJfRUxFTUVOVCArIGldKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gZnJlZSBiaW5hcnkgb24gaGVhcFxuICAgICAgdGhpcy5tb2R1bGUuX2ZyZWUoa2V5c0J1ZmZlckxvYy5wb2ludGVyKTtcbiAgICAgIFxuICAgICAgLy8gcHJlcGVuZCBrZXlzIGZpbGVcbiAgICAgIHZpZXdzLnVuc2hpZnQoQnVmZmVyLmZyb20odmlldy5idWZmZXIpKTtcbiAgICAgIHJldHVybiB2aWV3cztcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgY2hhbmdlUGFzc3dvcmQob2xkUGFzc3dvcmQ6IHN0cmluZywgbmV3UGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuY2hhbmdlUGFzc3dvcmQob2xkUGFzc3dvcmQsIG5ld1Bhc3N3b3JkKTtcbiAgICBpZiAob2xkUGFzc3dvcmQgIT09IHRoaXMucGFzc3dvcmQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkludmFsaWQgb3JpZ2luYWwgcGFzc3dvcmQuXCIpOyAvLyB3YWxsZXQyIHZlcmlmeV9wYXNzd29yZCBsb2FkcyBmcm9tIGRpc2sgc28gdmVyaWZ5IHBhc3N3b3JkIGhlcmVcbiAgICBpZiAobmV3UGFzc3dvcmQgPT09IHVuZGVmaW5lZCkgbmV3UGFzc3dvcmQgPSBcIlwiO1xuICAgIGF3YWl0IHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuY2hhbmdlX3dhbGxldF9wYXNzd29yZCh0aGlzLmNwcEFkZHJlc3MsIG9sZFBhc3N3b3JkLCBuZXdQYXNzd29yZCwgKGVyck1zZykgPT4ge1xuICAgICAgICAgIGlmIChlcnJNc2cpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoZXJyTXNnKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgdGhpcy5wYXNzd29yZCA9IG5ld1Bhc3N3b3JkO1xuICAgIGlmICh0aGlzLnBhdGgpIGF3YWl0IHRoaXMuc2F2ZSgpOyAvLyBhdXRvIHNhdmVcbiAgfVxuICBcbiAgYXN5bmMgc2F2ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNhdmUoKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5zYXZlKHRoaXMpO1xuICB9XG4gIFxuICBhc3luYyBjbG9zZShzYXZlID0gZmFsc2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5faXNDbG9zZWQpIHJldHVybjsgLy8gbm8gZWZmZWN0IGlmIGNsb3NlZFxuICAgIGlmIChzYXZlKSBhd2FpdCB0aGlzLnNhdmUoKTtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSB7XG4gICAgICBhd2FpdCB0aGlzLmdldFdhbGxldFByb3h5KCkuY2xvc2UoZmFsc2UpO1xuICAgICAgYXdhaXQgc3VwZXIuY2xvc2UoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoTGlzdGVuaW5nKCk7XG4gICAgYXdhaXQgdGhpcy5zdG9wU3luY2luZygpO1xuICAgIGF3YWl0IHN1cGVyLmNsb3NlKCk7XG4gICAgZGVsZXRlIHRoaXMucGF0aDtcbiAgICBkZWxldGUgdGhpcy5wYXNzd29yZDtcbiAgICBkZWxldGUgdGhpcy53YXNtTGlzdGVuZXI7XG4gICAgTGlicmFyeVV0aWxzLnNldFJlamVjdFVuYXV0aG9yaXplZEZuKHRoaXMucmVqZWN0VW5hdXRob3JpemVkQ29uZmlnSWQsIHVuZGVmaW5lZCk7IC8vIHVucmVnaXN0ZXIgZm4gaW5mb3JtaW5nIGlmIHVuYXV0aG9yaXplZCByZXFzIHNob3VsZCBiZSByZWplY3RlZFxuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLSBBREQgSlNET0MgRk9SIFNVUFBPUlRFRCBERUZBVUxUIElNUExFTUVOVEFUSU9OUyAtLS0tLS0tLS0tLS0tLVxuICBcbiAgYXN5bmMgZ2V0TnVtQmxvY2tzVG9VbmxvY2soKTogUHJvbWlzZTxudW1iZXJbXXx1bmRlZmluZWQ+IHsgcmV0dXJuIHN1cGVyLmdldE51bUJsb2Nrc1RvVW5sb2NrKCk7IH1cbiAgYXN5bmMgZ2V0VHgodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0fHVuZGVmaW5lZD4geyByZXR1cm4gc3VwZXIuZ2V0VHgodHhIYXNoKTsgfVxuICBhc3luYyBnZXRJbmNvbWluZ1RyYW5zZmVycyhxdWVyeTogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvSW5jb21pbmdUcmFuc2ZlcltdPiB7IHJldHVybiBzdXBlci5nZXRJbmNvbWluZ1RyYW5zZmVycyhxdWVyeSk7IH1cbiAgYXN5bmMgZ2V0T3V0Z29pbmdUcmFuc2ZlcnMocXVlcnk6IFBhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT4pIHsgcmV0dXJuIHN1cGVyLmdldE91dGdvaW5nVHJhbnNmZXJzKHF1ZXJ5KTsgfVxuICBhc3luYyBjcmVhdGVUeChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldD4geyByZXR1cm4gc3VwZXIuY3JlYXRlVHgoY29uZmlnKTsgfVxuICBhc3luYyByZWxheVR4KHR4T3JNZXRhZGF0YTogTW9uZXJvVHhXYWxsZXQgfCBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4geyByZXR1cm4gc3VwZXIucmVsYXlUeCh0eE9yTWV0YWRhdGEpOyB9XG4gIGFzeW5jIGdldFR4Tm90ZSh0eEhhc2g6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7IHJldHVybiBzdXBlci5nZXRUeE5vdGUodHhIYXNoKTsgfVxuICBhc3luYyBzZXRUeE5vdGUodHhIYXNoOiBzdHJpbmcsIG5vdGU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4geyByZXR1cm4gc3VwZXIuc2V0VHhOb3RlKHR4SGFzaCwgbm90ZSk7IH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUFJJVkFURSBIRUxQRVJTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIG9wZW5XYWxsZXREYXRhKGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KSB7XG4gICAgaWYgKGNvbmZpZy5wcm94eVRvV29ya2VyKSB7XG4gICAgICBsZXQgd2FsbGV0UHJveHkgPSBhd2FpdCBNb25lcm9XYWxsZXRGdWxsUHJveHkub3BlbldhbGxldERhdGEoY29uZmlnKTtcbiAgICAgIHJldHVybiBuZXcgTW9uZXJvV2FsbGV0RnVsbCh1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB3YWxsZXRQcm94eSk7XG4gICAgfVxuICAgIFxuICAgIC8vIHZhbGlkYXRlIGFuZCBub3JtYWxpemUgcGFyYW1ldGVyc1xuICAgIGlmIChjb25maWcubmV0d29ya1R5cGUgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIHRoZSB3YWxsZXQncyBuZXR3b3JrIHR5cGVcIik7XG4gICAgY29uZmlnLm5ldHdvcmtUeXBlID0gTW9uZXJvTmV0d29ya1R5cGUuZnJvbShjb25maWcubmV0d29ya1R5cGUpO1xuICAgIGxldCBkYWVtb25Db25uZWN0aW9uID0gY29uZmlnLmdldFNlcnZlcigpO1xuICAgIGxldCBkYWVtb25VcmkgPSBkYWVtb25Db25uZWN0aW9uICYmIGRhZW1vbkNvbm5lY3Rpb24uZ2V0VXJpKCkgPyBkYWVtb25Db25uZWN0aW9uLmdldFVyaSgpIDogXCJcIjtcbiAgICBsZXQgZGFlbW9uVXNlcm5hbWUgPSBkYWVtb25Db25uZWN0aW9uICYmIGRhZW1vbkNvbm5lY3Rpb24uZ2V0VXNlcm5hbWUoKSA/IGRhZW1vbkNvbm5lY3Rpb24uZ2V0VXNlcm5hbWUoKSA6IFwiXCI7XG4gICAgbGV0IGRhZW1vblBhc3N3b3JkID0gZGFlbW9uQ29ubmVjdGlvbiAmJiBkYWVtb25Db25uZWN0aW9uLmdldFBhc3N3b3JkKCkgPyBkYWVtb25Db25uZWN0aW9uLmdldFBhc3N3b3JkKCkgOiBcIlwiO1xuICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWQgPSBkYWVtb25Db25uZWN0aW9uID8gZGFlbW9uQ29ubmVjdGlvbi5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHRydWU7XG4gICAgXG4gICAgLy8gbG9hZCB3YXNtIG1vZHVsZVxuICAgIGxldCBtb2R1bGUgPSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZFdhc21Nb2R1bGUoKTtcbiAgICBcbiAgICAvLyBvcGVuIHdhbGxldCBpbiBxdWV1ZVxuICAgIHJldHVybiBtb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyByZWdpc3RlciBmbiBpbmZvcm1pbmcgaWYgdW5hdXRob3JpemVkIHJlcXMgc2hvdWxkIGJlIHJlamVjdGVkXG4gICAgICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWRGbklkID0gR2VuVXRpbHMuZ2V0VVVJRCgpO1xuICAgICAgICBMaWJyYXJ5VXRpbHMuc2V0UmVqZWN0VW5hdXRob3JpemVkRm4ocmVqZWN0VW5hdXRob3JpemVkRm5JZCwgKCkgPT4gcmVqZWN0VW5hdXRob3JpemVkKTtcbiAgICAgIFxuICAgICAgICAvLyBjcmVhdGUgd2FsbGV0IGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgbW9kdWxlLm9wZW5fd2FsbGV0X2Z1bGwoY29uZmlnLnBhc3N3b3JkLCBjb25maWcubmV0d29ya1R5cGUsIGNvbmZpZy5rZXlzRGF0YSA/PyBcIlwiLCBjb25maWcuY2FjaGVEYXRhID8/IFwiXCIsIGRhZW1vblVyaSwgZGFlbW9uVXNlcm5hbWUsIGRhZW1vblBhc3N3b3JkLCByZWplY3RVbmF1dGhvcml6ZWRGbklkLCBjb25maWcuZ2V0UmVndGVzdCgpID09PSB1bmRlZmluZWQgPyBmYWxzZSA6IGNvbmZpZy5nZXRSZWd0ZXN0KCksIChjcHBBZGRyZXNzKSA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBjcHBBZGRyZXNzID09PSBcInN0cmluZ1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKGNwcEFkZHJlc3MpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb1dhbGxldEZ1bGwoY3BwQWRkcmVzcywgY29uZmlnLnBhdGgsIGNvbmZpZy5wYXNzd29yZCwgY29uZmlnLmZzLCByZWplY3RVbmF1dGhvcml6ZWQsIHJlamVjdFVuYXV0aG9yaXplZEZuSWQpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHByb3RlY3RlZCBnZXRXYWxsZXRQcm94eSgpOiBNb25lcm9XYWxsZXRGdWxsUHJveHkge1xuICAgIHJldHVybiBzdXBlci5nZXRXYWxsZXRQcm94eSgpIGFzIE1vbmVyb1dhbGxldEZ1bGxQcm94eTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzeW5jIGJhY2tncm91bmRTeW5jKCkge1xuICAgIGxldCBsYWJlbCA9IHRoaXMucGF0aCA/IHRoaXMucGF0aCA6ICh0aGlzLmJyb3dzZXJNYWluUGF0aCA/IHRoaXMuYnJvd3Nlck1haW5QYXRoIDogXCJpbi1tZW1vcnkgd2FsbGV0XCIpOyAvLyBsYWJlbCBmb3IgbG9nXG4gICAgTGlicmFyeVV0aWxzLmxvZygxLCBcIkJhY2tncm91bmQgc3luY2hyb25pemluZyBcIiArIGxhYmVsKTtcbiAgICB0cnkgeyBhd2FpdCB0aGlzLnN5bmMoKTsgfVxuICAgIGNhdGNoIChlcnI6IGFueSkgeyBpZiAoIXRoaXMuX2lzQ2xvc2VkKSBjb25zb2xlLmVycm9yKFwiRmFpbGVkIHRvIGJhY2tncm91bmQgc3luY2hyb25pemUgXCIgKyBsYWJlbCArIFwiOiBcIiArIGVyci5tZXNzYWdlKTsgfVxuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgcmVmcmVzaExpc3RlbmluZygpIHtcbiAgICBsZXQgaXNFbmFibGVkID0gdGhpcy5saXN0ZW5lcnMubGVuZ3RoID4gMDtcbiAgICBpZiAodGhpcy53YXNtTGlzdGVuZXJIYW5kbGUgPT09IDAgJiYgIWlzRW5hYmxlZCB8fCB0aGlzLndhc21MaXN0ZW5lckhhbmRsZSA+IDAgJiYgaXNFbmFibGVkKSByZXR1cm47IC8vIG5vIGRpZmZlcmVuY2VcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnNldF9saXN0ZW5lcihcbiAgICAgICAgICB0aGlzLmNwcEFkZHJlc3MsXG4gICAgICAgICAgdGhpcy53YXNtTGlzdGVuZXJIYW5kbGUsXG4gICAgICAgICAgICBuZXdMaXN0ZW5lckhhbmRsZSA9PiB7XG4gICAgICAgICAgICAgIGlmICh0eXBlb2YgbmV3TGlzdGVuZXJIYW5kbGUgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IobmV3TGlzdGVuZXJIYW5kbGUpKTtcbiAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy53YXNtTGlzdGVuZXJIYW5kbGUgPSBuZXdMaXN0ZW5lckhhbmRsZTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc0VuYWJsZWQgPyBhc3luYyAoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSkgPT4gYXdhaXQgdGhpcy53YXNtTGlzdGVuZXIub25TeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSkgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBpc0VuYWJsZWQgPyBhc3luYyAoaGVpZ2h0KSA9PiBhd2FpdCB0aGlzLndhc21MaXN0ZW5lci5vbk5ld0Jsb2NrKGhlaWdodCkgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBpc0VuYWJsZWQgPyBhc3luYyAobmV3QmFsYW5jZVN0ciwgbmV3VW5sb2NrZWRCYWxhbmNlU3RyKSA9PiBhd2FpdCB0aGlzLndhc21MaXN0ZW5lci5vbkJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlU3RyLCBuZXdVbmxvY2tlZEJhbGFuY2VTdHIpIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgaXNFbmFibGVkID8gYXN5bmMgKGhlaWdodCwgdHhIYXNoLCBhbW91bnRTdHIsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIHZlcnNpb24sIHVubG9ja1RpbWUsIGlzTG9ja2VkKSA9PiBhd2FpdCB0aGlzLndhc21MaXN0ZW5lci5vbk91dHB1dFJlY2VpdmVkKGhlaWdodCwgdHhIYXNoLCBhbW91bnRTdHIsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIHZlcnNpb24sIHVubG9ja1RpbWUsIGlzTG9ja2VkKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGlzRW5hYmxlZCA/IGFzeW5jIChoZWlnaHQsIHR4SGFzaCwgYW1vdW50U3RyLCBhY2NvdW50SWR4U3RyLCBzdWJhZGRyZXNzSWR4U3RyLCB2ZXJzaW9uLCB1bmxvY2tUaW1lLCBpc0xvY2tlZCkgPT4gYXdhaXQgdGhpcy53YXNtTGlzdGVuZXIub25PdXRwdXRTcGVudChoZWlnaHQsIHR4SGFzaCwgYW1vdW50U3RyLCBhY2NvdW50SWR4U3RyLCBzdWJhZGRyZXNzSWR4U3RyLCB2ZXJzaW9uLCB1bmxvY2tUaW1lLCBpc0xvY2tlZCkgOiB1bmRlZmluZWQsXG4gICAgICAgICk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgc3RhdGljIHNhbml0aXplQmxvY2soYmxvY2spIHtcbiAgICBmb3IgKGxldCB0eCBvZiBibG9jay5nZXRUeHMoKSkgTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZVR4V2FsbGV0KHR4KTtcbiAgICByZXR1cm4gYmxvY2s7XG4gIH1cbiAgXG4gIHN0YXRpYyBzYW5pdGl6ZVR4V2FsbGV0KHR4KSB7XG4gICAgYXNzZXJ0KHR4IGluc3RhbmNlb2YgTW9uZXJvVHhXYWxsZXQpO1xuICAgIHJldHVybiB0eDtcbiAgfVxuICBcbiAgc3RhdGljIHNhbml0aXplQWNjb3VudChhY2NvdW50KSB7XG4gICAgaWYgKGFjY291bnQuZ2V0U3ViYWRkcmVzc2VzKCkpIHtcbiAgICAgIGZvciAobGV0IHN1YmFkZHJlc3Mgb2YgYWNjb3VudC5nZXRTdWJhZGRyZXNzZXMoKSkgTW9uZXJvV2FsbGV0S2V5cy5zYW5pdGl6ZVN1YmFkZHJlc3Moc3ViYWRkcmVzcyk7XG4gICAgfVxuICAgIHJldHVybiBhY2NvdW50O1xuICB9XG4gIFxuICBzdGF0aWMgZGVzZXJpYWxpemVCbG9ja3MoYmxvY2tzSnNvblN0cikge1xuICAgIGxldCBibG9ja3NKc29uID0gSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKGJsb2Nrc0pzb25TdHIpKTtcbiAgICBsZXQgZGVzZXJpYWxpemVkQmxvY2tzOiBhbnkgPSB7fTtcbiAgICBkZXNlcmlhbGl6ZWRCbG9ja3MuYmxvY2tzID0gW107XG4gICAgaWYgKGJsb2Nrc0pzb24uYmxvY2tzKSBmb3IgKGxldCBibG9ja0pzb24gb2YgYmxvY2tzSnNvbi5ibG9ja3MpIGRlc2VyaWFsaXplZEJsb2Nrcy5ibG9ja3MucHVzaChNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplQmxvY2sobmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWF9XQUxMRVQpKSk7XG4gICAgcmV0dXJuIGRlc2VyaWFsaXplZEJsb2NrcztcbiAgfVxuICBcbiAgc3RhdGljIGRlc2VyaWFsaXplVHhzKHF1ZXJ5LCBibG9ja3NKc29uU3RyKSB7XG4gICAgXG4gICAgLy8gZGVzZXJpYWxpemUgYmxvY2tzXG4gICAgbGV0IGRlc2VyaWFsaXplZEJsb2NrcyA9IE1vbmVyb1dhbGxldEZ1bGwuZGVzZXJpYWxpemVCbG9ja3MoYmxvY2tzSnNvblN0cik7XG4gICAgbGV0IGJsb2NrcyA9IGRlc2VyaWFsaXplZEJsb2Nrcy5ibG9ja3M7XG4gICAgXG4gICAgLy8gY29sbGVjdCB0eHNcbiAgICBsZXQgdHhzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2sgb2YgYmxvY2tzKSB7XG4gICAgICBNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplQmxvY2soYmxvY2spO1xuICAgICAgZm9yIChsZXQgdHggb2YgYmxvY2suZ2V0VHhzKCkpIHtcbiAgICAgICAgaWYgKGJsb2NrLmdldEhlaWdodCgpID09PSB1bmRlZmluZWQpIHR4LnNldEJsb2NrKHVuZGVmaW5lZCk7IC8vIGRlcmVmZXJlbmNlIHBsYWNlaG9sZGVyIGJsb2NrIGZvciB1bmNvbmZpcm1lZCB0eHNcbiAgICAgICAgdHhzLnB1c2godHgpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyByZS1zb3J0IHR4cyB3aGljaCBpcyBsb3N0IG92ZXIgd2FzbSBzZXJpYWxpemF0aW9uICAvLyBUT0RPOiBjb25maXJtIHRoYXQgb3JkZXIgaXMgbG9zdFxuICAgIGlmIChxdWVyeS5nZXRIYXNoZXMoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBsZXQgdHhNYXAgPSBuZXcgTWFwKCk7XG4gICAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHR4TWFwW3R4LmdldEhhc2goKV0gPSB0eDtcbiAgICAgIGxldCB0eHNTb3J0ZWQgPSBbXTtcbiAgICAgIGZvciAobGV0IHR4SGFzaCBvZiBxdWVyeS5nZXRIYXNoZXMoKSkgaWYgKHR4TWFwW3R4SGFzaF0gIT09IHVuZGVmaW5lZCkgdHhzU29ydGVkLnB1c2godHhNYXBbdHhIYXNoXSk7XG4gICAgICB0eHMgPSB0eHNTb3J0ZWQ7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0eHM7XG4gIH1cbiAgXG4gIHN0YXRpYyBkZXNlcmlhbGl6ZVRyYW5zZmVycyhxdWVyeSwgYmxvY2tzSnNvblN0cikge1xuICAgIFxuICAgIC8vIGRlc2VyaWFsaXplIGJsb2Nrc1xuICAgIGxldCBkZXNlcmlhbGl6ZWRCbG9ja3MgPSBNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplQmxvY2tzKGJsb2Nrc0pzb25TdHIpO1xuICAgIGxldCBibG9ja3MgPSBkZXNlcmlhbGl6ZWRCbG9ja3MuYmxvY2tzO1xuICAgIFxuICAgIC8vIGNvbGxlY3QgdHJhbnNmZXJzXG4gICAgbGV0IHRyYW5zZmVycyA9IFtdO1xuICAgIGZvciAobGV0IGJsb2NrIG9mIGJsb2Nrcykge1xuICAgICAgZm9yIChsZXQgdHggb2YgYmxvY2suZ2V0VHhzKCkpIHtcbiAgICAgICAgaWYgKGJsb2NrLmdldEhlaWdodCgpID09PSB1bmRlZmluZWQpIHR4LnNldEJsb2NrKHVuZGVmaW5lZCk7IC8vIGRlcmVmZXJlbmNlIHBsYWNlaG9sZGVyIGJsb2NrIGZvciB1bmNvbmZpcm1lZCB0eHNcbiAgICAgICAgaWYgKHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSAhPT0gdW5kZWZpbmVkKSB0cmFuc2ZlcnMucHVzaCh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkpO1xuICAgICAgICBpZiAodHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgZm9yIChsZXQgdHJhbnNmZXIgb2YgdHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSkgdHJhbnNmZXJzLnB1c2godHJhbnNmZXIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0cmFuc2ZlcnM7XG4gIH1cbiAgXG4gIHN0YXRpYyBkZXNlcmlhbGl6ZU91dHB1dHMocXVlcnksIGJsb2Nrc0pzb25TdHIpIHtcbiAgICBcbiAgICAvLyBkZXNlcmlhbGl6ZSBibG9ja3NcbiAgICBsZXQgZGVzZXJpYWxpemVkQmxvY2tzID0gTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZUJsb2NrcyhibG9ja3NKc29uU3RyKTtcbiAgICBsZXQgYmxvY2tzID0gZGVzZXJpYWxpemVkQmxvY2tzLmJsb2NrcztcbiAgICBcbiAgICAvLyBjb2xsZWN0IG91dHB1dHNcbiAgICBsZXQgb3V0cHV0cyA9IFtdO1xuICAgIGZvciAobGV0IGJsb2NrIG9mIGJsb2Nrcykge1xuICAgICAgZm9yIChsZXQgdHggb2YgYmxvY2suZ2V0VHhzKCkpIHtcbiAgICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIHR4LmdldE91dHB1dHMoKSkgb3V0cHV0cy5wdXNoKG91dHB1dCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBvdXRwdXRzO1xuICB9XG4gIFxuICAvKipcbiAgICogU2V0IHRoZSBwYXRoIG9mIHRoZSB3YWxsZXQgb24gdGhlIGJyb3dzZXIgbWFpbiB0aHJlYWQgaWYgcnVuIGFzIGEgd29ya2VyLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGJyb3dzZXJNYWluUGF0aCAtIHBhdGggb2YgdGhlIHdhbGxldCBvbiB0aGUgYnJvd3NlciBtYWluIHRocmVhZFxuICAgKi9cbiAgcHJvdGVjdGVkIHNldEJyb3dzZXJNYWluUGF0aChicm93c2VyTWFpblBhdGgpIHtcbiAgICB0aGlzLmJyb3dzZXJNYWluUGF0aCA9IGJyb3dzZXJNYWluUGF0aDtcbiAgfVxuICBcbiAgc3RhdGljIGFzeW5jIG1vdmVUbyhwYXRoLCB3YWxsZXQpIHtcblxuICAgIC8vIHNhdmUgYW5kIHJldHVybiBpZiBzYW1lIHBhdGhcbiAgICBpZiAoUGF0aC5ub3JtYWxpemUod2FsbGV0LnBhdGgpID09PSBQYXRoLm5vcm1hbGl6ZShwYXRoKSkge1xuICAgICAgcmV0dXJuIHdhbGxldC5zYXZlKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIExpYnJhcnlVdGlscy5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgaWYgKGF3YWl0IHdhbGxldC5pc0Nsb3NlZCgpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgaXMgY2xvc2VkXCIpO1xuICAgICAgaWYgKCFwYXRoKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgcGF0aCBvZiBkZXN0aW5hdGlvbiB3YWxsZXRcIik7XG5cbiAgICAgIC8vIGNyZWF0ZSBkZXN0aW5hdGlvbiBkaXJlY3RvcnkgaWYgaXQgZG9lc24ndCBleGlzdFxuICAgICAgbGV0IHdhbGxldERpciA9IFBhdGguZGlybmFtZShwYXRoKTtcbiAgICAgIGlmICghYXdhaXQgTGlicmFyeVV0aWxzLmV4aXN0cyh3YWxsZXQuZnMsIHdhbGxldERpcikpIHtcbiAgICAgICAgdHJ5IHsgYXdhaXQgd2FsbGV0LmZzLm1rZGlyKHdhbGxldERpcik7IH1cbiAgICAgICAgY2F0Y2ggKGVycjogYW55KSB7IHRocm93IG5ldyBNb25lcm9FcnJvcihcIkRlc3RpbmF0aW9uIHBhdGggXCIgKyBwYXRoICsgXCIgZG9lcyBub3QgZXhpc3QgYW5kIGNhbm5vdCBiZSBjcmVhdGVkOiBcIiArIGVyci5tZXNzYWdlKTsgfVxuICAgICAgfVxuXG4gICAgICAvLyBnZXQgd2FsbGV0IGRhdGFcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB3YWxsZXQuZ2V0RGF0YSgpO1xuXG4gICAgICAvLyB3cml0ZSB3YWxsZXQgZmlsZXNcbiAgICAgIGF3YWl0IHdhbGxldC5mcy53cml0ZUZpbGUocGF0aCArIFwiLmtleXNcIiwgZGF0YVswXSwgXCJiaW5hcnlcIik7XG4gICAgICBhd2FpdCB3YWxsZXQuZnMud3JpdGVGaWxlKHBhdGgsIGRhdGFbMV0sIFwiYmluYXJ5XCIpO1xuICAgICAgYXdhaXQgd2FsbGV0LmZzLndyaXRlRmlsZShwYXRoICsgXCIuYWRkcmVzcy50eHRcIiwgYXdhaXQgd2FsbGV0LmdldFByaW1hcnlBZGRyZXNzKCkpO1xuICAgICAgbGV0IG9sZFBhdGggPSB3YWxsZXQucGF0aDtcbiAgICAgIHdhbGxldC5wYXRoID0gcGF0aDtcblxuICAgICAgLy8gZGVsZXRlIG9sZCB3YWxsZXQgZmlsZXNcbiAgICAgIGlmIChvbGRQYXRoKSB7XG4gICAgICAgIGF3YWl0IHdhbGxldC5mcy51bmxpbmsob2xkUGF0aCArIFwiLmFkZHJlc3MudHh0XCIpO1xuICAgICAgICBhd2FpdCB3YWxsZXQuZnMudW5saW5rKG9sZFBhdGggKyBcIi5rZXlzXCIpO1xuICAgICAgICBhd2FpdCB3YWxsZXQuZnMudW5saW5rKG9sZFBhdGgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIFxuICBzdGF0aWMgYXN5bmMgc2F2ZSh3YWxsZXQ6IGFueSkge1xuICAgIHJldHVybiBMaWJyYXJ5VXRpbHMucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIGlmIChhd2FpdCB3YWxsZXQuaXNDbG9zZWQoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGlzIGNsb3NlZFwiKTtcblxuICAgICAgLy8gcGF0aCBtdXN0IGJlIHNldFxuICAgICAgbGV0IHBhdGggPSBhd2FpdCB3YWxsZXQuZ2V0UGF0aCgpO1xuICAgICAgaWYgKCFwYXRoKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc2F2ZSB3YWxsZXQgYmVjYXVzZSBwYXRoIGlzIG5vdCBzZXRcIik7XG5cbiAgICAgIC8vIGdldCB3YWxsZXQgZGF0YVxuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHdhbGxldC5nZXREYXRhKCk7XG5cbiAgICAgIC8vIHdyaXRlIHdhbGxldCBmaWxlcyB0byAqLm5ld1xuICAgICAgbGV0IHBhdGhOZXcgPSBwYXRoICsgXCIubmV3XCI7XG4gICAgICBhd2FpdCB3YWxsZXQuZnMud3JpdGVGaWxlKHBhdGhOZXcgKyBcIi5rZXlzXCIsIGRhdGFbMF0sIFwiYmluYXJ5XCIpO1xuICAgICAgYXdhaXQgd2FsbGV0LmZzLndyaXRlRmlsZShwYXRoTmV3LCBkYXRhWzFdLCBcImJpbmFyeVwiKTtcbiAgICAgIGF3YWl0IHdhbGxldC5mcy53cml0ZUZpbGUocGF0aE5ldyArIFwiLmFkZHJlc3MudHh0XCIsIGF3YWl0IHdhbGxldC5nZXRQcmltYXJ5QWRkcmVzcygpKTtcblxuICAgICAgLy8gcmVwbGFjZSBvbGQgd2FsbGV0IGZpbGVzIHdpdGggbmV3XG4gICAgICBhd2FpdCB3YWxsZXQuZnMucmVuYW1lKHBhdGhOZXcgKyBcIi5rZXlzXCIsIHBhdGggKyBcIi5rZXlzXCIpO1xuICAgICAgYXdhaXQgd2FsbGV0LmZzLnJlbmFtZShwYXRoTmV3LCBwYXRoKTtcbiAgICAgIGF3YWl0IHdhbGxldC5mcy5yZW5hbWUocGF0aE5ldyArIFwiLmFkZHJlc3MudHh0XCIsIHBhdGggKyBcIi5hZGRyZXNzLnR4dFwiKTtcbiAgICB9KTtcbiAgfVxufVxuXG4vKipcbiAqIEltcGxlbWVudHMgYSBNb25lcm9XYWxsZXQgYnkgcHJveHlpbmcgcmVxdWVzdHMgdG8gYSB3b3JrZXIgd2hpY2ggcnVucyBhIGZ1bGwgd2FsbGV0LlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBNb25lcm9XYWxsZXRGdWxsUHJveHkgZXh0ZW5kcyBNb25lcm9XYWxsZXRLZXlzUHJveHkge1xuXG4gIC8vIGluc3RhbmNlIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgcGF0aDogYW55O1xuICBwcm90ZWN0ZWQgZnM6IGFueTtcbiAgcHJvdGVjdGVkIHdyYXBwZWRMaXN0ZW5lcnM6IGFueTtcbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFdBTExFVCBTVEFUSUMgVVRJTFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICBzdGF0aWMgYXN5bmMgb3BlbldhbGxldERhdGEoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pIHtcbiAgICBsZXQgd2FsbGV0SWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgaWYgKGNvbmZpZy5wYXNzd29yZCA9PT0gdW5kZWZpbmVkKSBjb25maWcucGFzc3dvcmQgPSBcIlwiO1xuICAgIGxldCBkYWVtb25Db25uZWN0aW9uID0gY29uZmlnLmdldFNlcnZlcigpO1xuICAgIGF3YWl0IExpYnJhcnlVdGlscy5pbnZva2VXb3JrZXIod2FsbGV0SWQsIFwib3BlbldhbGxldERhdGFcIiwgW2NvbmZpZy5wYXRoLCBjb25maWcucGFzc3dvcmQsIGNvbmZpZy5uZXR3b3JrVHlwZSwgY29uZmlnLmtleXNEYXRhLCBjb25maWcuY2FjaGVEYXRhLCBkYWVtb25Db25uZWN0aW9uID8gZGFlbW9uQ29ubmVjdGlvbi50b0pzb24oKSA6IHVuZGVmaW5lZF0pO1xuICAgIGxldCB3YWxsZXQgPSBuZXcgTW9uZXJvV2FsbGV0RnVsbFByb3h5KHdhbGxldElkLCBhd2FpdCBMaWJyYXJ5VXRpbHMuZ2V0V29ya2VyKCksIGNvbmZpZy5wYXRoLCBjb25maWcuZ2V0RnMoKSk7XG4gICAgaWYgKGNvbmZpZy5wYXRoKSBhd2FpdCB3YWxsZXQuc2F2ZSgpO1xuICAgIHJldHVybiB3YWxsZXQ7XG4gIH1cbiAgXG4gIHN0YXRpYyBhc3luYyBjcmVhdGVXYWxsZXQoY29uZmlnKSB7XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkgJiYgYXdhaXQgTW9uZXJvV2FsbGV0RnVsbC53YWxsZXRFeGlzdHMoY29uZmlnLmdldFBhdGgoKSwgY29uZmlnLmdldEZzKCkpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgYWxyZWFkeSBleGlzdHM6IFwiICsgY29uZmlnLmdldFBhdGgoKSk7XG4gICAgbGV0IHdhbGxldElkID0gR2VuVXRpbHMuZ2V0VVVJRCgpO1xuICAgIGF3YWl0IExpYnJhcnlVdGlscy5pbnZva2VXb3JrZXIod2FsbGV0SWQsIFwiY3JlYXRlV2FsbGV0RnVsbFwiLCBbY29uZmlnLnRvSnNvbigpXSk7XG4gICAgbGV0IHdhbGxldCA9IG5ldyBNb25lcm9XYWxsZXRGdWxsUHJveHkod2FsbGV0SWQsIGF3YWl0IExpYnJhcnlVdGlscy5nZXRXb3JrZXIoKSwgY29uZmlnLmdldFBhdGgoKSwgY29uZmlnLmdldEZzKCkpO1xuICAgIGlmIChjb25maWcuZ2V0UGF0aCgpKSBhd2FpdCB3YWxsZXQuc2F2ZSgpO1xuICAgIHJldHVybiB3YWxsZXQ7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBJTlNUQU5DRSBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIC8qKlxuICAgKiBJbnRlcm5hbCBjb25zdHJ1Y3RvciB3aGljaCBpcyBnaXZlbiBhIHdvcmtlciB0byBjb21tdW5pY2F0ZSB3aXRoIHZpYSBtZXNzYWdlcy5cbiAgICogXG4gICAqIFRoaXMgbWV0aG9kIHNob3VsZCBub3QgYmUgY2FsbGVkIGV4dGVybmFsbHkgYnV0IHNob3VsZCBiZSBjYWxsZWQgdGhyb3VnaFxuICAgKiBzdGF0aWMgd2FsbGV0IGNyZWF0aW9uIHV0aWxpdGllcyBpbiB0aGlzIGNsYXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHdhbGxldElkIC0gaWRlbnRpZmllcyB0aGUgd2FsbGV0IHdpdGggdGhlIHdvcmtlclxuICAgKiBAcGFyYW0ge1dvcmtlcn0gd29ya2VyIC0gd29ya2VyIHRvIGNvbW11bmljYXRlIHdpdGggdmlhIG1lc3NhZ2VzXG4gICAqL1xuICBjb25zdHJ1Y3Rvcih3YWxsZXRJZCwgd29ya2VyLCBwYXRoLCBmcykge1xuICAgIHN1cGVyKHdhbGxldElkLCB3b3JrZXIpO1xuICAgIHRoaXMucGF0aCA9IHBhdGg7XG4gICAgdGhpcy5mcyA9IGZzID8gZnMgOiAocGF0aCA/IE1vbmVyb1dhbGxldEZ1bGwuZ2V0RnMoKSA6IHVuZGVmaW5lZCk7XG4gICAgdGhpcy53cmFwcGVkTGlzdGVuZXJzID0gW107XG4gIH1cblxuICBnZXRQYXRoKCkge1xuICAgIHJldHVybiB0aGlzLnBhdGg7XG4gIH1cblxuICBhc3luYyBnZXROZXR3b3JrVHlwZSgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXROZXR3b3JrVHlwZVwiKTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0U3ViYWRkcmVzc0xhYmVsKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIGxhYmVsKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic2V0U3ViYWRkcmVzc0xhYmVsXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkgYXMgUHJvbWlzZTx2b2lkPjtcbiAgfVxuICBcbiAgYXN5bmMgc2V0RGFlbW9uQ29ubmVjdGlvbih1cmlPclJwY0Nvbm5lY3Rpb24sIGlzVHJ1c3RlZD8pIHtcbiAgICBpZiAoIXVyaU9yUnBjQ29ubmVjdGlvbikgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJzZXREYWVtb25Db25uZWN0aW9uXCIsIFt1bmRlZmluZWQsIGlzVHJ1c3RlZF0pO1xuICAgIGVsc2Uge1xuICAgICAgbGV0IGNvbm5lY3Rpb24gPSAhdXJpT3JScGNDb25uZWN0aW9uID8gdW5kZWZpbmVkIDogdXJpT3JScGNDb25uZWN0aW9uIGluc3RhbmNlb2YgTW9uZXJvUnBjQ29ubmVjdGlvbiA/IHVyaU9yUnBjQ29ubmVjdGlvbiA6IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHVyaU9yUnBjQ29ubmVjdGlvbik7XG4gICAgICBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInNldERhZW1vbkNvbm5lY3Rpb25cIiwgW2Nvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldENvbmZpZygpIDogdW5kZWZpbmVkLCBpc1RydXN0ZWRdKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBpc0RhZW1vblRydXN0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaXNEYWVtb25UcnVzdGVkXCIpIGFzIFByb21pc2U8Ym9vbGVhbj47XG4gIH1cblxuICBhc3luYyBnZXREYWVtb25Db25uZWN0aW9uKCkge1xuICAgIGxldCBycGNDb25maWcgPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldERhZW1vbkNvbm5lY3Rpb25cIik7XG4gICAgcmV0dXJuIHJwY0NvbmZpZyA/IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHJwY0NvbmZpZykgOiB1bmRlZmluZWQ7XG4gIH1cbiAgXG4gIGFzeW5jIGlzQ29ubmVjdGVkVG9EYWVtb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaXNDb25uZWN0ZWRUb0RhZW1vblwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UmVzdG9yZUhlaWdodCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRSZXN0b3JlSGVpZ2h0XCIpO1xuICB9XG4gIFxuICBhc3luYyBzZXRSZXN0b3JlSGVpZ2h0KHJlc3RvcmVIZWlnaHQpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzZXRSZXN0b3JlSGVpZ2h0XCIsIFtyZXN0b3JlSGVpZ2h0XSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldERhZW1vbkhlaWdodCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXREYWVtb25IZWlnaHRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldERhZW1vbk1heFBlZXJIZWlnaHQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0RGFlbW9uTWF4UGVlckhlaWdodFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0QnlEYXRlKHllYXIsIG1vbnRoLCBkYXkpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRIZWlnaHRCeURhdGVcIiwgW3llYXIsIG1vbnRoLCBkYXldKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNEYWVtb25TeW5jZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaXNEYWVtb25TeW5jZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhlaWdodCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRIZWlnaHRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGFkZExpc3RlbmVyKGxpc3RlbmVyKSB7XG4gICAgbGV0IHdyYXBwZWRMaXN0ZW5lciA9IG5ldyBXYWxsZXRXb3JrZXJMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgbGV0IGxpc3RlbmVySWQgPSB3cmFwcGVkTGlzdGVuZXIuZ2V0SWQoKTtcbiAgICBMaWJyYXJ5VXRpbHMuYWRkV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvblN5bmNQcm9ncmVzc19cIiArIGxpc3RlbmVySWQsIFt3cmFwcGVkTGlzdGVuZXIub25TeW5jUHJvZ3Jlc3MsIHdyYXBwZWRMaXN0ZW5lcl0pO1xuICAgIExpYnJhcnlVdGlscy5hZGRXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uTmV3QmxvY2tfXCIgKyBsaXN0ZW5lcklkLCBbd3JhcHBlZExpc3RlbmVyLm9uTmV3QmxvY2ssIHdyYXBwZWRMaXN0ZW5lcl0pO1xuICAgIExpYnJhcnlVdGlscy5hZGRXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uQmFsYW5jZXNDaGFuZ2VkX1wiICsgbGlzdGVuZXJJZCwgW3dyYXBwZWRMaXN0ZW5lci5vbkJhbGFuY2VzQ2hhbmdlZCwgd3JhcHBlZExpc3RlbmVyXSk7XG4gICAgTGlicmFyeVV0aWxzLmFkZFdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25PdXRwdXRSZWNlaXZlZF9cIiArIGxpc3RlbmVySWQsIFt3cmFwcGVkTGlzdGVuZXIub25PdXRwdXRSZWNlaXZlZCwgd3JhcHBlZExpc3RlbmVyXSk7XG4gICAgTGlicmFyeVV0aWxzLmFkZFdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25PdXRwdXRTcGVudF9cIiArIGxpc3RlbmVySWQsIFt3cmFwcGVkTGlzdGVuZXIub25PdXRwdXRTcGVudCwgd3JhcHBlZExpc3RlbmVyXSk7XG4gICAgdGhpcy53cmFwcGVkTGlzdGVuZXJzLnB1c2god3JhcHBlZExpc3RlbmVyKTtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJhZGRMaXN0ZW5lclwiLCBbbGlzdGVuZXJJZF0pO1xuICB9XG4gIFxuICBhc3luYyByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcikge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53cmFwcGVkTGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodGhpcy53cmFwcGVkTGlzdGVuZXJzW2ldLmdldExpc3RlbmVyKCkgPT09IGxpc3RlbmVyKSB7XG4gICAgICAgIGxldCBsaXN0ZW5lcklkID0gdGhpcy53cmFwcGVkTGlzdGVuZXJzW2ldLmdldElkKCk7XG4gICAgICAgIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwicmVtb3ZlTGlzdGVuZXJcIiwgW2xpc3RlbmVySWRdKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnJlbW92ZVdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25TeW5jUHJvZ3Jlc3NfXCIgKyBsaXN0ZW5lcklkKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnJlbW92ZVdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25OZXdCbG9ja19cIiArIGxpc3RlbmVySWQpO1xuICAgICAgICBMaWJyYXJ5VXRpbHMucmVtb3ZlV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvbkJhbGFuY2VzQ2hhbmdlZF9cIiArIGxpc3RlbmVySWQpO1xuICAgICAgICBMaWJyYXJ5VXRpbHMucmVtb3ZlV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvbk91dHB1dFJlY2VpdmVkX1wiICsgbGlzdGVuZXJJZCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5yZW1vdmVXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uT3V0cHV0U3BlbnRfXCIgKyBsaXN0ZW5lcklkKTtcbiAgICAgICAgdGhpcy53cmFwcGVkTGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJMaXN0ZW5lciBpcyBub3QgcmVnaXN0ZXJlZCB3aXRoIHdhbGxldFwiKTtcbiAgfVxuICBcbiAgZ2V0TGlzdGVuZXJzKCkge1xuICAgIGxldCBsaXN0ZW5lcnMgPSBbXTtcbiAgICBmb3IgKGxldCB3cmFwcGVkTGlzdGVuZXIgb2YgdGhpcy53cmFwcGVkTGlzdGVuZXJzKSBsaXN0ZW5lcnMucHVzaCh3cmFwcGVkTGlzdGVuZXIuZ2V0TGlzdGVuZXIoKSk7XG4gICAgcmV0dXJuIGxpc3RlbmVycztcbiAgfVxuICBcbiAgYXN5bmMgaXNTeW5jZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaXNTeW5jZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIHN5bmMobGlzdGVuZXJPclN0YXJ0SGVpZ2h0PzogTW9uZXJvV2FsbGV0TGlzdGVuZXIgfCBudW1iZXIsIHN0YXJ0SGVpZ2h0PzogbnVtYmVyLCBhbGxvd0NvbmN1cnJlbnRDYWxscyA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9TeW5jUmVzdWx0PiB7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIHBhcmFtc1xuICAgIHN0YXJ0SGVpZ2h0ID0gbGlzdGVuZXJPclN0YXJ0SGVpZ2h0IGluc3RhbmNlb2YgTW9uZXJvV2FsbGV0TGlzdGVuZXIgPyBzdGFydEhlaWdodCA6IGxpc3RlbmVyT3JTdGFydEhlaWdodDtcbiAgICBsZXQgbGlzdGVuZXIgPSBsaXN0ZW5lck9yU3RhcnRIZWlnaHQgaW5zdGFuY2VvZiBNb25lcm9XYWxsZXRMaXN0ZW5lciA/IGxpc3RlbmVyT3JTdGFydEhlaWdodCA6IHVuZGVmaW5lZDtcbiAgICBpZiAoc3RhcnRIZWlnaHQgPT09IHVuZGVmaW5lZCkgc3RhcnRIZWlnaHQgPSBNYXRoLm1heChhd2FpdCB0aGlzLmdldEhlaWdodCgpLCBhd2FpdCB0aGlzLmdldFJlc3RvcmVIZWlnaHQoKSk7XG4gICAgXG4gICAgLy8gcmVnaXN0ZXIgbGlzdGVuZXIgaWYgZ2l2ZW5cbiAgICBpZiAobGlzdGVuZXIpIGF3YWl0IHRoaXMuYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIFxuICAgIC8vIHN5bmMgd2FsbGV0IGluIHdvcmtlciBcbiAgICBsZXQgZXJyO1xuICAgIGxldCByZXN1bHQ7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXN1bHRKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJzeW5jXCIsIFtzdGFydEhlaWdodCwgYWxsb3dDb25jdXJyZW50Q2FsbHNdKTtcbiAgICAgIHJlc3VsdCA9IG5ldyBNb25lcm9TeW5jUmVzdWx0KHJlc3VsdEpzb24ubnVtQmxvY2tzRmV0Y2hlZCwgcmVzdWx0SnNvbi5yZWNlaXZlZE1vbmV5KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBlcnIgPSBlO1xuICAgIH1cbiAgICBcbiAgICAvLyB1bnJlZ2lzdGVyIGxpc3RlbmVyXG4gICAgaWYgKGxpc3RlbmVyKSBhd2FpdCB0aGlzLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBcbiAgICAvLyB0aHJvdyBlcnJvciBvciByZXR1cm5cbiAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBcbiAgYXN5bmMgc3RhcnRTeW5jaW5nKHN5bmNQZXJpb2RJbk1zKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic3RhcnRTeW5jaW5nXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgICBcbiAgYXN5bmMgc3RvcFN5bmNpbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic3RvcFN5bmNpbmdcIik7XG4gIH1cbiAgXG4gIGFzeW5jIHNjYW5UeHModHhIYXNoZXMpIHtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheSh0eEhhc2hlcyksIFwiTXVzdCBwcm92aWRlIGFuIGFycmF5IG9mIHR4cyBoYXNoZXMgdG8gc2NhblwiKTtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzY2FuVHhzXCIsIFt0eEhhc2hlc10pO1xuICB9XG4gIFxuICBhc3luYyByZXNjYW5TcGVudCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJyZXNjYW5TcGVudFwiKTtcbiAgfVxuICAgIFxuICBhc3luYyByZXNjYW5CbG9ja2NoYWluKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInJlc2NhbkJsb2NrY2hhaW5cIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJhbGFuY2UoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkge1xuICAgIHJldHVybiBCaWdJbnQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRCYWxhbmNlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBnZXRVbmxvY2tlZEJhbGFuY2UoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkge1xuICAgIGxldCB1bmxvY2tlZEJhbGFuY2VTdHIgPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldFVubG9ja2VkQmFsYW5jZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIHJldHVybiBCaWdJbnQodW5sb2NrZWRCYWxhbmNlU3RyKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudHMoaW5jbHVkZVN1YmFkZHJlc3NlcywgdGFnKSB7XG4gICAgbGV0IGFjY291bnRzID0gW107XG4gICAgZm9yIChsZXQgYWNjb3VudEpzb24gb2YgKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0QWNjb3VudHNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSkpIHtcbiAgICAgIGFjY291bnRzLnB1c2goTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZUFjY291bnQobmV3IE1vbmVyb0FjY291bnQoYWNjb3VudEpzb24pKSk7XG4gICAgfVxuICAgIHJldHVybiBhY2NvdW50cztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudChhY2NvdW50SWR4LCBpbmNsdWRlU3ViYWRkcmVzc2VzKSB7XG4gICAgbGV0IGFjY291bnRKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRBY2NvdW50XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuc2FuaXRpemVBY2NvdW50KG5ldyBNb25lcm9BY2NvdW50KGFjY291bnRKc29uKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNyZWF0ZUFjY291bnQobGFiZWwpIHtcbiAgICBsZXQgYWNjb3VudEpzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImNyZWF0ZUFjY291bnRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZUFjY291bnQobmV3IE1vbmVyb0FjY291bnQoYWNjb3VudEpzb24pKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJbmRpY2VzKSB7XG4gICAgbGV0IHN1YmFkZHJlc3NlcyA9IFtdO1xuICAgIGZvciAobGV0IHN1YmFkZHJlc3NKc29uIG9mIChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldFN1YmFkZHJlc3Nlc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKSkge1xuICAgICAgc3ViYWRkcmVzc2VzLnB1c2goTW9uZXJvV2FsbGV0S2V5cy5zYW5pdGl6ZVN1YmFkZHJlc3MobmV3IE1vbmVyb1N1YmFkZHJlc3Moc3ViYWRkcmVzc0pzb24pKSk7XG4gICAgfVxuICAgIHJldHVybiBzdWJhZGRyZXNzZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGNyZWF0ZVN1YmFkZHJlc3MoYWNjb3VudElkeCwgbGFiZWwpIHtcbiAgICBsZXQgc3ViYWRkcmVzc0pzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImNyZWF0ZVN1YmFkZHJlc3NcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0S2V5cy5zYW5pdGl6ZVN1YmFkZHJlc3MobmV3IE1vbmVyb1N1YmFkZHJlc3Moc3ViYWRkcmVzc0pzb24pKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhzKHF1ZXJ5KSB7XG4gICAgcXVlcnkgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplVHhRdWVyeShxdWVyeSk7XG4gICAgbGV0IHJlc3BKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRUeHNcIiwgW3F1ZXJ5LmdldEJsb2NrKCkudG9Kc29uKCldKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZVR4cyhxdWVyeSwgSlNPTi5zdHJpbmdpZnkoe2Jsb2NrczogcmVzcEpzb24uYmxvY2tzfSkpOyAvLyBpbml0aWFsaXplIHR4cyBmcm9tIGJsb2NrcyBqc29uIHN0cmluZyBUT0RPOiB0aGlzIHN0cmluZ2lmaWVzIHRoZW4gdXRpbGl0eSBwYXJzZXMsIGF2b2lkXG4gIH1cbiAgXG4gIGFzeW5jIGdldFRyYW5zZmVycyhxdWVyeSkge1xuICAgIHF1ZXJ5ID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVRyYW5zZmVyUXVlcnkocXVlcnkpO1xuICAgIGxldCBibG9ja0pzb25zID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRUcmFuc2ZlcnNcIiwgW3F1ZXJ5LmdldFR4UXVlcnkoKS5nZXRCbG9jaygpLnRvSnNvbigpXSk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuZGVzZXJpYWxpemVUcmFuc2ZlcnMocXVlcnksIEpTT04uc3RyaW5naWZ5KHtibG9ja3M6IGJsb2NrSnNvbnN9KSk7IC8vIGluaXRpYWxpemUgdHJhbnNmZXJzIGZyb20gYmxvY2tzIGpzb24gc3RyaW5nIFRPRE86IHRoaXMgc3RyaW5naWZpZXMgdGhlbiB1dGlsaXR5IHBhcnNlcywgYXZvaWRcbiAgfVxuICBcbiAgYXN5bmMgZ2V0T3V0cHV0cyhxdWVyeSkge1xuICAgIHF1ZXJ5ID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZU91dHB1dFF1ZXJ5KHF1ZXJ5KTtcbiAgICBsZXQgYmxvY2tKc29ucyA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0T3V0cHV0c1wiLCBbcXVlcnkuZ2V0VHhRdWVyeSgpLmdldEJsb2NrKCkudG9Kc29uKCldKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZU91dHB1dHMocXVlcnksIEpTT04uc3RyaW5naWZ5KHtibG9ja3M6IGJsb2NrSnNvbnN9KSk7IC8vIGluaXRpYWxpemUgdHJhbnNmZXJzIGZyb20gYmxvY2tzIGpzb24gc3RyaW5nIFRPRE86IHRoaXMgc3RyaW5naWZpZXMgdGhlbiB1dGlsaXR5IHBhcnNlcywgYXZvaWRcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0T3V0cHV0cyhhbGwpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJleHBvcnRPdXRwdXRzXCIsIFthbGxdKTtcbiAgfVxuICBcbiAgYXN5bmMgaW1wb3J0T3V0cHV0cyhvdXRwdXRzSGV4KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaW1wb3J0T3V0cHV0c1wiLCBbb3V0cHV0c0hleF0pO1xuICB9XG4gIFxuICBhc3luYyBleHBvcnRLZXlJbWFnZXMoYWxsKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldEtleUltYWdlc1wiLCBbYWxsXSkpO1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRLZXlJbWFnZXMoa2V5SW1hZ2VzLCBvZmZzZXQgPSAwKSB7XG4gICAgbGV0IGtleUltYWdlc0pzb24gPSBbXTtcbiAgICBmb3IgKGxldCBrZXlJbWFnZSBvZiBrZXlJbWFnZXMpIGtleUltYWdlc0pzb24ucHVzaChrZXlJbWFnZS50b0pzb24oKSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImltcG9ydEtleUltYWdlc1wiLCBba2V5SW1hZ2VzSnNvbiwgb2Zmc2V0XSkpO1xuICB9XG4gIFxuICBhc3luYyBnZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCgpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNb25lcm9XYWxsZXRGdWxsLmdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0KCkgbm90IGltcGxlbWVudGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBmcmVlemVPdXRwdXQoa2V5SW1hZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJmcmVlemVPdXRwdXRcIiwgW2tleUltYWdlXSk7XG4gIH1cbiAgXG4gIGFzeW5jIHRoYXdPdXRwdXQoa2V5SW1hZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJ0aGF3T3V0cHV0XCIsIFtrZXlJbWFnZV0pO1xuICB9XG4gIFxuICBhc3luYyBpc091dHB1dEZyb3plbihrZXlJbWFnZSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImlzT3V0cHV0RnJvemVuXCIsIFtrZXlJbWFnZV0pO1xuICB9XG5cbiAgYXN5bmMgZ2V0RGVmYXVsdEZlZVByaW9yaXR5KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldERlZmF1bHRGZWVQcmlvcml0eVwiKTtcbiAgfVxuICBcbiAgYXN5bmMgY3JlYXRlVHhzKGNvbmZpZykge1xuICAgIGNvbmZpZyA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVDcmVhdGVUeHNDb25maWcoY29uZmlnKTtcbiAgICBsZXQgdHhTZXRKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJjcmVhdGVUeHNcIiwgW2NvbmZpZy50b0pzb24oKV0pO1xuICAgIHJldHVybiBuZXcgTW9uZXJvVHhTZXQodHhTZXRKc29uKS5nZXRUeHMoKTtcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBPdXRwdXQoY29uZmlnKSB7XG4gICAgY29uZmlnID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVN3ZWVwT3V0cHV0Q29uZmlnKGNvbmZpZyk7XG4gICAgbGV0IHR4U2V0SnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwic3dlZXBPdXRwdXRcIiwgW2NvbmZpZy50b0pzb24oKV0pO1xuICAgIHJldHVybiBuZXcgTW9uZXJvVHhTZXQodHhTZXRKc29uKS5nZXRUeHMoKVswXTtcbiAgfVxuXG4gIGFzeW5jIHN3ZWVwVW5sb2NrZWQoY29uZmlnKSB7XG4gICAgY29uZmlnID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVN3ZWVwVW5sb2NrZWRDb25maWcoY29uZmlnKTtcbiAgICBsZXQgdHhTZXRzSnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwic3dlZXBVbmxvY2tlZFwiLCBbY29uZmlnLnRvSnNvbigpXSk7XG4gICAgbGV0IHR4cyA9IFtdO1xuICAgIGZvciAobGV0IHR4U2V0SnNvbiBvZiB0eFNldHNKc29uKSBmb3IgKGxldCB0eCBvZiBuZXcgTW9uZXJvVHhTZXQodHhTZXRKc29uKS5nZXRUeHMoKSkgdHhzLnB1c2godHgpO1xuICAgIHJldHVybiB0eHM7XG4gIH1cbiAgXG4gIGFzeW5jIHN3ZWVwRHVzdChyZWxheSkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvVHhTZXQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJzd2VlcER1c3RcIiwgW3JlbGF5XSkpLmdldFR4cygpIHx8IFtdO1xuICB9XG4gIFxuICBhc3luYyByZWxheVR4cyh0eHNPck1ldGFkYXRhcykge1xuICAgIGFzc2VydChBcnJheS5pc0FycmF5KHR4c09yTWV0YWRhdGFzKSwgXCJNdXN0IHByb3ZpZGUgYW4gYXJyYXkgb2YgdHhzIG9yIHRoZWlyIG1ldGFkYXRhIHRvIHJlbGF5XCIpO1xuICAgIGxldCB0eE1ldGFkYXRhcyA9IFtdO1xuICAgIGZvciAobGV0IHR4T3JNZXRhZGF0YSBvZiB0eHNPck1ldGFkYXRhcykgdHhNZXRhZGF0YXMucHVzaCh0eE9yTWV0YWRhdGEgaW5zdGFuY2VvZiBNb25lcm9UeFdhbGxldCA/IHR4T3JNZXRhZGF0YS5nZXRNZXRhZGF0YSgpIDogdHhPck1ldGFkYXRhKTtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJyZWxheVR4c1wiLCBbdHhNZXRhZGF0YXNdKTtcbiAgfVxuICBcbiAgYXN5bmMgZGVzY3JpYmVUeFNldCh0eFNldCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvVHhTZXQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkZXNjcmliZVR4U2V0XCIsIFt0eFNldC50b0pzb24oKV0pKTtcbiAgfVxuICBcbiAgYXN5bmMgc2lnblR4cyh1bnNpZ25lZFR4SGV4KSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9UeFNldChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInNpZ25UeHNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdFR4cyhzaWduZWRUeEhleCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInN1Ym1pdFR4c1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBzaWduTWVzc2FnZShtZXNzYWdlLCBzaWduYXR1cmVUeXBlLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic2lnbk1lc3NhZ2VcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgdmVyaWZ5TWVzc2FnZShtZXNzYWdlLCBhZGRyZXNzLCBzaWduYXR1cmUpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJ2ZXJpZnlNZXNzYWdlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeEtleSh0eEhhc2gpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRUeEtleVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBjaGVja1R4S2V5KHR4SGFzaCwgdHhLZXksIGFkZHJlc3MpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0NoZWNrVHgoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJjaGVja1R4S2V5XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBnZXRUeFByb29mKHR4SGFzaCwgYWRkcmVzcywgbWVzc2FnZSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldFR4UHJvb2ZcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tUeFByb29mKHR4SGFzaCwgYWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9DaGVja1R4KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiY2hlY2tUeFByb29mXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBnZXRTcGVuZFByb29mKHR4SGFzaCwgbWVzc2FnZSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldFNwZW5kUHJvb2ZcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tTcGVuZFByb29mKHR4SGFzaCwgbWVzc2FnZSwgc2lnbmF0dXJlKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiY2hlY2tTcGVuZFByb29mXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFJlc2VydmVQcm9vZldhbGxldChtZXNzYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0UmVzZXJ2ZVByb29mV2FsbGV0XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFJlc2VydmVQcm9vZkFjY291bnQoYWNjb3VudElkeCwgYW1vdW50LCBtZXNzYWdlKSB7XG4gICAgdHJ5IHsgcmV0dXJuIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0UmVzZXJ2ZVByb29mQWNjb3VudFwiLCBbYWNjb3VudElkeCwgYW1vdW50LnRvU3RyaW5nKCksIG1lc3NhZ2VdKTsgfVxuICAgIGNhdGNoIChlOiBhbnkpIHsgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGUubWVzc2FnZSwgLTEpOyB9XG4gIH1cblxuICBhc3luYyBjaGVja1Jlc2VydmVQcm9vZihhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUpIHtcbiAgICB0cnkgeyByZXR1cm4gbmV3IE1vbmVyb0NoZWNrUmVzZXJ2ZShhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImNoZWNrUmVzZXJ2ZVByb29mXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpOyB9XG4gICAgY2F0Y2ggKGU6IGFueSkgeyB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZS5tZXNzYWdlLCAtMSk7IH1cbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhOb3Rlcyh0eEhhc2hlcykge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldFR4Tm90ZXNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0VHhOb3Rlcyh0eEhhc2hlcywgbm90ZXMpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzZXRUeE5vdGVzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFkZHJlc3NCb29rRW50cmllcyhlbnRyeUluZGljZXMpIHtcbiAgICBpZiAoIWVudHJ5SW5kaWNlcykgZW50cnlJbmRpY2VzID0gW107XG4gICAgbGV0IGVudHJpZXMgPSBbXTtcbiAgICBmb3IgKGxldCBlbnRyeUpzb24gb2YgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRBZGRyZXNzQm9va0VudHJpZXNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSkge1xuICAgICAgZW50cmllcy5wdXNoKG5ldyBNb25lcm9BZGRyZXNzQm9va0VudHJ5KGVudHJ5SnNvbikpO1xuICAgIH1cbiAgICByZXR1cm4gZW50cmllcztcbiAgfVxuICBcbiAgYXN5bmMgYWRkQWRkcmVzc0Jvb2tFbnRyeShhZGRyZXNzLCBkZXNjcmlwdGlvbikge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImFkZEFkZHJlc3NCb29rRW50cnlcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZWRpdEFkZHJlc3NCb29rRW50cnkoaW5kZXgsIHNldEFkZHJlc3MsIGFkZHJlc3MsIHNldERlc2NyaXB0aW9uLCBkZXNjcmlwdGlvbikge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImVkaXRBZGRyZXNzQm9va0VudHJ5XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGRlbGV0ZUFkZHJlc3NCb29rRW50cnkoZW50cnlJZHgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJkZWxldGVBZGRyZXNzQm9va0VudHJ5XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHRhZ0FjY291bnRzKHRhZywgYWNjb3VudEluZGljZXMpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJ0YWdBY2NvdW50c1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG5cbiAgYXN5bmMgdW50YWdBY2NvdW50cyhhY2NvdW50SW5kaWNlcykge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInVudGFnQWNjb3VudHNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudFRhZ3MoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0QWNjb3VudFRhZ3NcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuXG4gIGFzeW5jIHNldEFjY291bnRUYWdMYWJlbCh0YWcsIGxhYmVsKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic2V0QWNjb3VudFRhZ0xhYmVsXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFBheW1lbnRVcmkoY29uZmlnKSB7XG4gICAgY29uZmlnID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyhjb25maWcpO1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldFBheW1lbnRVcmlcIiwgW2NvbmZpZy50b0pzb24oKV0pO1xuICB9XG4gIFxuICBhc3luYyBwYXJzZVBheW1lbnRVcmkodXJpKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9UeENvbmZpZyhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInBhcnNlUGF5bWVudFVyaVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QXR0cmlidXRlKGtleSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldEF0dHJpYnV0ZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBzZXRBdHRyaWJ1dGUoa2V5LCB2YWwpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzZXRBdHRyaWJ1dGVcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgc3RhcnRNaW5pbmcobnVtVGhyZWFkcywgYmFja2dyb3VuZE1pbmluZywgaWdub3JlQmF0dGVyeSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInN0YXJ0TWluaW5nXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0b3BNaW5pbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic3RvcE1pbmluZ1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBpc011bHRpc2lnSW1wb3J0TmVlZGVkKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImlzTXVsdGlzaWdJbXBvcnROZWVkZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGlzTXVsdGlzaWcoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaXNNdWx0aXNpZ1wiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TXVsdGlzaWdJbmZvKCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvTXVsdGlzaWdJbmZvKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0TXVsdGlzaWdJbmZvXCIpKTtcbiAgfVxuICBcbiAgYXN5bmMgcHJlcGFyZU11bHRpc2lnKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInByZXBhcmVNdWx0aXNpZ1wiKTtcbiAgfVxuICBcbiAgYXN5bmMgbWFrZU11bHRpc2lnKG11bHRpc2lnSGV4ZXMsIHRocmVzaG9sZCwgcGFzc3dvcmQpIHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJtYWtlTXVsdGlzaWdcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZXhjaGFuZ2VNdWx0aXNpZ0tleXMobXVsdGlzaWdIZXhlcywgcGFzc3dvcmQpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImV4Y2hhbmdlTXVsdGlzaWdLZXlzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBleHBvcnRNdWx0aXNpZ0hleCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJleHBvcnRNdWx0aXNpZ0hleFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgaW1wb3J0TXVsdGlzaWdIZXgobXVsdGlzaWdIZXhlcywgcmVmcmVzaEFmdGVySW1wb3J0KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaW1wb3J0TXVsdGlzaWdIZXhcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgc2lnbk11bHRpc2lnVHhIZXgobXVsdGlzaWdUeEhleCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwic2lnbk11bHRpc2lnVHhIZXhcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN1Ym1pdE11bHRpc2lnVHhIZXgoc2lnbmVkTXVsdGlzaWdUeEhleCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInN1Ym1pdE11bHRpc2lnVHhIZXhcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0RGF0YSgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXREYXRhXCIpO1xuICB9XG4gIFxuICBhc3luYyBtb3ZlVG8ocGF0aCkge1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLm1vdmVUbyhwYXRoLCB0aGlzKTtcbiAgfVxuICBcbiAgYXN5bmMgY2hhbmdlUGFzc3dvcmQob2xkUGFzc3dvcmQsIG5ld1Bhc3N3b3JkKSB7XG4gICAgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJjaGFuZ2VQYXNzd29yZFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIGlmICh0aGlzLnBhdGgpIGF3YWl0IHRoaXMuc2F2ZSgpOyAvLyBhdXRvIHNhdmVcbiAgfVxuICBcbiAgYXN5bmMgc2F2ZSgpIHtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5zYXZlKHRoaXMpO1xuICB9XG5cbiAgYXN5bmMgY2xvc2Uoc2F2ZSkge1xuICAgIGlmIChhd2FpdCB0aGlzLmlzQ2xvc2VkKCkpIHJldHVybjtcbiAgICBpZiAoc2F2ZSkgYXdhaXQgdGhpcy5zYXZlKCk7XG4gICAgd2hpbGUgKHRoaXMud3JhcHBlZExpc3RlbmVycy5sZW5ndGgpIGF3YWl0IHRoaXMucmVtb3ZlTGlzdGVuZXIodGhpcy53cmFwcGVkTGlzdGVuZXJzWzBdLmdldExpc3RlbmVyKCkpO1xuICAgIGF3YWl0IHN1cGVyLmNsb3NlKGZhbHNlKTtcbiAgfVxufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBMSVNURU5JTkcgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8qKlxuICogUmVjZWl2ZXMgbm90aWZpY2F0aW9ucyBkaXJlY3RseSBmcm9tIHdhc20gYysrLlxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5jbGFzcyBXYWxsZXRXYXNtTGlzdGVuZXIge1xuXG4gIHByb3RlY3RlZCB3YWxsZXQ6IE1vbmVyb1dhbGxldDtcbiAgXG4gIGNvbnN0cnVjdG9yKHdhbGxldCkge1xuICAgIHRoaXMud2FsbGV0ID0gd2FsbGV0O1xuICB9XG4gIFxuICBhc3luYyBvblN5bmNQcm9ncmVzcyhoZWlnaHQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIHBlcmNlbnREb25lLCBtZXNzYWdlKSB7XG4gICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VTeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSk7XG4gIH1cbiAgXG4gIGFzeW5jIG9uTmV3QmxvY2soaGVpZ2h0KSB7XG4gICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VOZXdCbG9jayhoZWlnaHQpO1xuICB9XG4gIFxuICBhc3luYyBvbkJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlU3RyLCBuZXdVbmxvY2tlZEJhbGFuY2VTdHIpIHtcbiAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZUJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlU3RyLCBuZXdVbmxvY2tlZEJhbGFuY2VTdHIpO1xuICB9XG4gIFxuICBhc3luYyBvbk91dHB1dFJlY2VpdmVkKGhlaWdodCwgdHhIYXNoLCBhbW91bnRTdHIsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIHZlcnNpb24sIHVubG9ja1RpbWUsIGlzTG9ja2VkKSB7XG4gICAgXG4gICAgLy8gYnVpbGQgcmVjZWl2ZWQgb3V0cHV0XG4gICAgbGV0IG91dHB1dCA9IG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKTtcbiAgICBvdXRwdXQuc2V0QW1vdW50KEJpZ0ludChhbW91bnRTdHIpKTtcbiAgICBvdXRwdXQuc2V0QWNjb3VudEluZGV4KGFjY291bnRJZHgpO1xuICAgIG91dHB1dC5zZXRTdWJhZGRyZXNzSW5kZXgoc3ViYWRkcmVzc0lkeCk7XG4gICAgbGV0IHR4ID0gbmV3IE1vbmVyb1R4V2FsbGV0KCk7XG4gICAgdHguc2V0SGFzaCh0eEhhc2gpO1xuICAgIHR4LnNldFZlcnNpb24odmVyc2lvbik7XG4gICAgdHguc2V0VW5sb2NrVGltZSh1bmxvY2tUaW1lKTtcbiAgICBvdXRwdXQuc2V0VHgodHgpO1xuICAgIHR4LnNldE91dHB1dHMoW291dHB1dF0pO1xuICAgIHR4LnNldElzSW5jb21pbmcodHJ1ZSk7XG4gICAgdHguc2V0SXNMb2NrZWQoaXNMb2NrZWQpO1xuICAgIGlmIChoZWlnaHQgPiAwKSB7XG4gICAgICBsZXQgYmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soKS5zZXRIZWlnaHQoaGVpZ2h0KTtcbiAgICAgIGJsb2NrLnNldFR4cyhbdHggYXMgTW9uZXJvVHhdKTtcbiAgICAgIHR4LnNldEJsb2NrKGJsb2NrKTtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKHRydWUpO1xuICAgICAgdHguc2V0SW5UeFBvb2woZmFsc2UpO1xuICAgICAgdHguc2V0SXNGYWlsZWQoZmFsc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZChmYWxzZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbCh0cnVlKTtcbiAgICB9XG4gICAgXG4gICAgLy8gYW5ub3VuY2Ugb3V0cHV0XG4gICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VPdXRwdXRSZWNlaXZlZChvdXRwdXQpO1xuICB9XG4gIFxuICBhc3luYyBvbk91dHB1dFNwZW50KGhlaWdodCwgdHhIYXNoLCBhbW91bnRTdHIsIGFjY291bnRJZHhTdHIsIHN1YmFkZHJlc3NJZHhTdHIsIHZlcnNpb24sIHVubG9ja1RpbWUsIGlzTG9ja2VkKSB7XG4gICAgXG4gICAgLy8gYnVpbGQgc3BlbnQgb3V0cHV0XG4gICAgbGV0IG91dHB1dCA9IG5ldyBNb25lcm9PdXRwdXRXYWxsZXQoKTtcbiAgICBvdXRwdXQuc2V0QW1vdW50KEJpZ0ludChhbW91bnRTdHIpKTtcbiAgICBpZiAoYWNjb3VudElkeFN0cikgb3V0cHV0LnNldEFjY291bnRJbmRleChwYXJzZUludChhY2NvdW50SWR4U3RyKSk7XG4gICAgaWYgKHN1YmFkZHJlc3NJZHhTdHIpIG91dHB1dC5zZXRTdWJhZGRyZXNzSW5kZXgocGFyc2VJbnQoc3ViYWRkcmVzc0lkeFN0cikpO1xuICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgIHR4LnNldEhhc2godHhIYXNoKTtcbiAgICB0eC5zZXRWZXJzaW9uKHZlcnNpb24pO1xuICAgIHR4LnNldFVubG9ja1RpbWUodW5sb2NrVGltZSk7XG4gICAgdHguc2V0SXNMb2NrZWQoaXNMb2NrZWQpO1xuICAgIG91dHB1dC5zZXRUeCh0eCk7XG4gICAgdHguc2V0SW5wdXRzKFtvdXRwdXRdKTtcbiAgICBpZiAoaGVpZ2h0ID4gMCkge1xuICAgICAgbGV0IGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0SGVpZ2h0KGhlaWdodCk7XG4gICAgICBibG9jay5zZXRUeHMoW3R4XSk7XG4gICAgICB0eC5zZXRCbG9jayhibG9jayk7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SW5UeFBvb2wodHJ1ZSk7XG4gICAgfVxuICAgIFxuICAgIC8vIGFubm91bmNlIG91dHB1dFxuICAgIGF3YWl0IHRoaXMud2FsbGV0LmFubm91bmNlT3V0cHV0U3BlbnQob3V0cHV0KTtcbiAgfVxufVxuXG4vKipcbiAqIEludGVybmFsIGxpc3RlbmVyIHRvIGJyaWRnZSBub3RpZmljYXRpb25zIHRvIGV4dGVybmFsIGxpc3RlbmVycy5cbiAqIFxuICogQHByaXZhdGVcbiAqL1xuY2xhc3MgV2FsbGV0V29ya2VyTGlzdGVuZXIge1xuXG4gIHByb3RlY3RlZCBpZDogYW55O1xuICBwcm90ZWN0ZWQgbGlzdGVuZXI6IGFueTtcbiAgXG4gIGNvbnN0cnVjdG9yKGxpc3RlbmVyKSB7XG4gICAgdGhpcy5pZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICB0aGlzLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIH1cbiAgXG4gIGdldElkKCkge1xuICAgIHJldHVybiB0aGlzLmlkO1xuICB9XG4gIFxuICBnZXRMaXN0ZW5lcigpIHtcbiAgICByZXR1cm4gdGhpcy5saXN0ZW5lcjtcbiAgfVxuICBcbiAgb25TeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSkge1xuICAgIHRoaXMubGlzdGVuZXIub25TeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSk7XG4gIH1cblxuICBhc3luYyBvbk5ld0Jsb2NrKGhlaWdodCkge1xuICAgIGF3YWl0IHRoaXMubGlzdGVuZXIub25OZXdCbG9jayhoZWlnaHQpO1xuICB9XG4gIFxuICBhc3luYyBvbkJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlU3RyLCBuZXdVbmxvY2tlZEJhbGFuY2VTdHIpIHtcbiAgICBhd2FpdCB0aGlzLmxpc3RlbmVyLm9uQmFsYW5jZXNDaGFuZ2VkKEJpZ0ludChuZXdCYWxhbmNlU3RyKSwgQmlnSW50KG5ld1VubG9ja2VkQmFsYW5jZVN0cikpO1xuICB9XG5cbiAgYXN5bmMgb25PdXRwdXRSZWNlaXZlZChibG9ja0pzb24pIHtcbiAgICBsZXQgYmxvY2sgPSBuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uLCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYX1dBTExFVCk7XG4gICAgYXdhaXQgdGhpcy5saXN0ZW5lci5vbk91dHB1dFJlY2VpdmVkKGJsb2NrLmdldFR4cygpWzBdLmdldE91dHB1dHMoKVswXSk7XG4gIH1cbiAgXG4gIGFzeW5jIG9uT3V0cHV0U3BlbnQoYmxvY2tKc29uKSB7XG4gICAgbGV0IGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWF9XQUxMRVQpO1xuICAgIGF3YWl0IHRoaXMubGlzdGVuZXIub25PdXRwdXRTcGVudChibG9jay5nZXRUeHMoKVswXS5nZXRJbnB1dHMoKVswXSk7XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLEtBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLFNBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFHLGFBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFJLFdBQUEsR0FBQUwsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFLLGNBQUEsR0FBQU4sc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFNLGlCQUFBLEdBQUFQLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTyx1QkFBQSxHQUFBUixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVEsWUFBQSxHQUFBVCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVMsY0FBQSxHQUFBVixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVUsbUJBQUEsR0FBQVgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFXLGdCQUFBLEdBQUFaLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBWSxZQUFBLEdBQUFiLHNCQUFBLENBQUFDLE9BQUE7O0FBRUEsSUFBQWEsd0JBQUEsR0FBQWQsc0JBQUEsQ0FBQUMsT0FBQTs7QUFFQSxJQUFBYywyQkFBQSxHQUFBZixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWUsMkJBQUEsR0FBQWhCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBZ0IsbUJBQUEsR0FBQWpCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBaUIseUJBQUEsR0FBQWxCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBa0IseUJBQUEsR0FBQW5CLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBbUIsa0JBQUEsR0FBQXBCLHNCQUFBLENBQUFDLE9BQUE7O0FBRUEsSUFBQW9CLG1CQUFBLEdBQUFyQixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQXFCLG9CQUFBLEdBQUF0QixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQXNCLGlCQUFBLEdBQUF2QixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQXVCLGlCQUFBLEdBQUF4QixzQkFBQSxDQUFBQyxPQUFBOzs7QUFHQSxJQUFBd0IsZUFBQSxHQUFBekIsc0JBQUEsQ0FBQUMsT0FBQTs7O0FBR0EsSUFBQXlCLFlBQUEsR0FBQTFCLHNCQUFBLENBQUFDLE9BQUE7O0FBRUEsSUFBQTBCLGVBQUEsR0FBQTNCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBMkIsYUFBQSxHQUFBNUIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUE0QixtQkFBQSxHQUFBN0Isc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUE2QixpQkFBQSxHQUFBN0IsT0FBQTtBQUNBLElBQUE4QixxQkFBQSxHQUFBL0Isc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUErQiwyQkFBQSxHQUFBaEMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFnQyw2QkFBQSxHQUFBakMsc0JBQUEsQ0FBQUMsT0FBQTs7QUFFQSxJQUFBaUMsR0FBQSxHQUFBbEMsc0JBQUEsQ0FBQUMsT0FBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDZSxNQUFNa0MsZ0JBQWdCLFNBQVNDLGtDQUFnQixDQUFDOztFQUU3RDtFQUNBLE9BQTBCQyx5QkFBeUIsR0FBRyxLQUFLOzs7RUFHM0Q7Ozs7Ozs7Ozs7Ozs7RUFhQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRUMsV0FBV0EsQ0FBQ0MsVUFBVSxFQUFFQyxJQUFJLEVBQUVDLFFBQVEsRUFBRUMsRUFBRSxFQUFFQyxrQkFBa0IsRUFBRUMsc0JBQXNCLEVBQUVDLFdBQW1DLEVBQUU7SUFDM0gsS0FBSyxDQUFDTixVQUFVLEVBQUVNLFdBQVcsQ0FBQztJQUM5QixJQUFJQSxXQUFXLEVBQUU7SUFDakIsSUFBSSxDQUFDTCxJQUFJLEdBQUdBLElBQUk7SUFDaEIsSUFBSSxDQUFDQyxRQUFRLEdBQUdBLFFBQVE7SUFDeEIsSUFBSSxDQUFDSyxTQUFTLEdBQUcsRUFBRTtJQUNuQixJQUFJLENBQUNKLEVBQUUsR0FBR0EsRUFBRSxHQUFHQSxFQUFFLEdBQUlGLElBQUksR0FBR0wsZ0JBQWdCLENBQUNZLEtBQUssQ0FBQyxDQUFDLEdBQUdDLFNBQVU7SUFDakUsSUFBSSxDQUFDQyxTQUFTLEdBQUcsS0FBSztJQUN0QixJQUFJLENBQUNDLFlBQVksR0FBRyxJQUFJQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ2xELElBQUksQ0FBQ0Msa0JBQWtCLEdBQUcsQ0FBQyxDQUFDLENBQXNCO0lBQ2xELElBQUksQ0FBQ1Qsa0JBQWtCLEdBQUdBLGtCQUFrQjtJQUM1QyxJQUFJLENBQUNVLDBCQUEwQixHQUFHVCxzQkFBc0I7SUFDeEQsSUFBSSxDQUFDVSxjQUFjLEdBQUduQixnQkFBZ0IsQ0FBQ0UseUJBQXlCO0lBQ2hFa0IscUJBQVksQ0FBQ0MsdUJBQXVCLENBQUNaLHNCQUFzQixFQUFFLE1BQU0sSUFBSSxDQUFDRCxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7RUFDL0Y7O0VBRUE7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxhQUFhYyxZQUFZQSxDQUFDakIsSUFBSSxFQUFFRSxFQUFFLEVBQUU7SUFDbEMsSUFBQWdCLGVBQU0sRUFBQ2xCLElBQUksRUFBRSwwQ0FBMEMsQ0FBQztJQUN4RCxJQUFJLENBQUNFLEVBQUUsRUFBRUEsRUFBRSxHQUFHUCxnQkFBZ0IsQ0FBQ1ksS0FBSyxDQUFDLENBQUM7SUFDdEMsSUFBSSxDQUFDTCxFQUFFLEVBQUUsTUFBTSxJQUFJaUIsb0JBQVcsQ0FBQyxvREFBb0QsQ0FBQztJQUNwRixJQUFJQyxNQUFNLEdBQUcsTUFBTUwscUJBQVksQ0FBQ0ssTUFBTSxDQUFDbEIsRUFBRSxFQUFFRixJQUFJLEdBQUcsT0FBTyxDQUFDO0lBQzFEZSxxQkFBWSxDQUFDTSxHQUFHLENBQUMsQ0FBQyxFQUFFLG1CQUFtQixHQUFHckIsSUFBSSxHQUFHLElBQUksR0FBR29CLE1BQU0sQ0FBQztJQUMvRCxPQUFPQSxNQUFNO0VBQ2Y7O0VBRUEsYUFBYUUsVUFBVUEsQ0FBQ0MsTUFBbUMsRUFBRTs7SUFFM0Q7SUFDQUEsTUFBTSxHQUFHLElBQUlDLDJCQUFrQixDQUFDRCxNQUFNLENBQUM7SUFDdkMsSUFBSUEsTUFBTSxDQUFDRSxnQkFBZ0IsQ0FBQyxDQUFDLEtBQUtqQixTQUFTLEVBQUVlLE1BQU0sQ0FBQ0csZ0JBQWdCLENBQUMsSUFBSSxDQUFDO0lBQzFFLElBQUlILE1BQU0sQ0FBQ0ksT0FBTyxDQUFDLENBQUMsS0FBS25CLFNBQVMsRUFBRSxNQUFNLElBQUlXLG9CQUFXLENBQUMseUNBQXlDLENBQUM7SUFDcEcsSUFBSUksTUFBTSxDQUFDSyxhQUFhLENBQUMsQ0FBQyxLQUFLcEIsU0FBUyxFQUFFLE1BQU0sSUFBSVcsb0JBQVcsQ0FBQyxnREFBZ0QsQ0FBQztJQUNqSCxJQUFJSSxNQUFNLENBQUNNLGlCQUFpQixDQUFDLENBQUMsS0FBS3JCLFNBQVMsRUFBRSxNQUFNLElBQUlXLG9CQUFXLENBQUMsb0RBQW9ELENBQUM7SUFDekgsSUFBSUksTUFBTSxDQUFDTyxpQkFBaUIsQ0FBQyxDQUFDLEtBQUt0QixTQUFTLEVBQUUsTUFBTSxJQUFJVyxvQkFBVyxDQUFDLHFEQUFxRCxDQUFDO0lBQzFILElBQUlJLE1BQU0sQ0FBQ1Esa0JBQWtCLENBQUMsQ0FBQyxLQUFLdkIsU0FBUyxFQUFFLE1BQU0sSUFBSVcsb0JBQVcsQ0FBQyxzREFBc0QsQ0FBQztJQUM1SCxJQUFJSSxNQUFNLENBQUNTLGdCQUFnQixDQUFDLENBQUMsS0FBS3hCLFNBQVMsRUFBRSxNQUFNLElBQUlXLG9CQUFXLENBQUMsbURBQW1ELENBQUM7SUFDdkgsSUFBSUksTUFBTSxDQUFDVSxXQUFXLENBQUMsQ0FBQyxLQUFLekIsU0FBUyxFQUFFLE1BQU0sSUFBSVcsb0JBQVcsQ0FBQyw2Q0FBNkMsQ0FBQztJQUM1RyxJQUFJSSxNQUFNLENBQUNXLGNBQWMsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFLE1BQU0sSUFBSWYsb0JBQVcsQ0FBQyxxREFBcUQsQ0FBQztJQUNsSCxJQUFJSSxNQUFNLENBQUNoQixLQUFLLENBQUMsQ0FBQyxLQUFLQyxTQUFTLEVBQUVlLE1BQU0sQ0FBQ1ksS0FBSyxDQUFDeEMsZ0JBQWdCLENBQUNZLEtBQUssQ0FBQyxDQUFDLENBQUM7O0lBRXhFO0lBQ0EsSUFBSWdCLE1BQU0sQ0FBQ2Esb0JBQW9CLENBQUMsQ0FBQyxFQUFFO01BQ2pDLElBQUliLE1BQU0sQ0FBQ2MsU0FBUyxDQUFDLENBQUMsRUFBRSxNQUFNLElBQUlsQixvQkFBVyxDQUFDLHVFQUF1RSxDQUFDO01BQ3RISSxNQUFNLENBQUNlLFNBQVMsQ0FBQ2YsTUFBTSxDQUFDYSxvQkFBb0IsQ0FBQyxDQUFDLENBQUNHLGFBQWEsQ0FBQyxDQUFDLENBQUM7SUFDakU7O0lBRUE7SUFDQSxJQUFJLENBQUNoQixNQUFNLENBQUNpQixXQUFXLENBQUMsQ0FBQyxFQUFFO01BQ3pCLElBQUl0QyxFQUFFLEdBQUdxQixNQUFNLENBQUNoQixLQUFLLENBQUMsQ0FBQztNQUN2QixJQUFJLENBQUNMLEVBQUUsRUFBRSxNQUFNLElBQUlpQixvQkFBVyxDQUFDLG1EQUFtRCxDQUFDO01BQ25GLElBQUksRUFBQyxNQUFNLElBQUksQ0FBQ0YsWUFBWSxDQUFDTSxNQUFNLENBQUNrQixPQUFPLENBQUMsQ0FBQyxFQUFFdkMsRUFBRSxDQUFDLEdBQUUsTUFBTSxJQUFJaUIsb0JBQVcsQ0FBQyxpQ0FBaUMsR0FBR0ksTUFBTSxDQUFDa0IsT0FBTyxDQUFDLENBQUMsQ0FBQztNQUMvSGxCLE1BQU0sQ0FBQ21CLFdBQVcsQ0FBQyxNQUFNeEMsRUFBRSxDQUFDeUMsUUFBUSxDQUFDcEIsTUFBTSxDQUFDa0IsT0FBTyxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQztNQUNqRWxCLE1BQU0sQ0FBQ3FCLFlBQVksQ0FBQyxPQUFNN0IscUJBQVksQ0FBQ0ssTUFBTSxDQUFDbEIsRUFBRSxFQUFFcUIsTUFBTSxDQUFDa0IsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFHLE1BQU12QyxFQUFFLENBQUN5QyxRQUFRLENBQUNwQixNQUFNLENBQUNrQixPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQ2pIOztJQUVBO0lBQ0EsTUFBTUksTUFBTSxHQUFHLE1BQU1sRCxnQkFBZ0IsQ0FBQ21ELGNBQWMsQ0FBQ3ZCLE1BQU0sQ0FBQzs7SUFFNUQ7SUFDQSxJQUFJQSxNQUFNLENBQUN3QixrQkFBa0IsQ0FBQyxDQUFDLEtBQUt2QyxTQUFTLElBQUllLE1BQU0sQ0FBQ2MsU0FBUyxDQUFDLENBQUMsRUFBRSxNQUFNUSxNQUFNLENBQUNHLG1CQUFtQixDQUFDekIsTUFBTSxDQUFDYyxTQUFTLENBQUMsQ0FBQyxFQUFFZCxNQUFNLENBQUN3QixrQkFBa0IsQ0FBQyxDQUFDLENBQUM7O0lBRXRKO0lBQ0EsTUFBTUYsTUFBTSxDQUFDSSxvQkFBb0IsQ0FBQzFCLE1BQU0sQ0FBQ2Esb0JBQW9CLENBQUMsQ0FBQyxDQUFDO0lBQ2hFLE9BQU9TLE1BQU07RUFDZjs7RUFFQSxhQUFhSyxZQUFZQSxDQUFDM0IsTUFBMEIsRUFBNkI7O0lBRS9FO0lBQ0EsSUFBSUEsTUFBTSxLQUFLZixTQUFTLEVBQUUsTUFBTSxJQUFJVyxvQkFBVyxDQUFDLHNDQUFzQyxDQUFDO0lBQ3ZGLElBQUlJLE1BQU0sQ0FBQ0ksT0FBTyxDQUFDLENBQUMsS0FBS25CLFNBQVMsS0FBS2UsTUFBTSxDQUFDTSxpQkFBaUIsQ0FBQyxDQUFDLEtBQUtyQixTQUFTLElBQUllLE1BQU0sQ0FBQ08saUJBQWlCLENBQUMsQ0FBQyxLQUFLdEIsU0FBUyxJQUFJZSxNQUFNLENBQUNRLGtCQUFrQixDQUFDLENBQUMsS0FBS3ZCLFNBQVMsQ0FBQyxFQUFFLE1BQU0sSUFBSVcsb0JBQVcsQ0FBQyw0REFBNEQsQ0FBQztJQUM5UCxJQUFJSSxNQUFNLENBQUM0QixjQUFjLENBQUMsQ0FBQyxLQUFLM0MsU0FBUyxFQUFFLE1BQU0sSUFBSVcsb0JBQVcsQ0FBQyxnRUFBZ0UsQ0FBQztJQUNsSWlDLDBCQUFpQixDQUFDQyxRQUFRLENBQUM5QixNQUFNLENBQUM0QixjQUFjLENBQUMsQ0FBQyxDQUFDO0lBQ25ELElBQUk1QixNQUFNLENBQUNXLGNBQWMsQ0FBQyxDQUFDLEtBQUssSUFBSSxFQUFFLE1BQU0sSUFBSWYsb0JBQVcsQ0FBQywyREFBMkQsQ0FBQztJQUN4SCxJQUFJSSxNQUFNLENBQUNrQixPQUFPLENBQUMsQ0FBQyxLQUFLakMsU0FBUyxFQUFFZSxNQUFNLENBQUMrQixPQUFPLENBQUMsRUFBRSxDQUFDO0lBQ3RELElBQUkvQixNQUFNLENBQUNrQixPQUFPLENBQUMsQ0FBQyxLQUFJLE1BQU05QyxnQkFBZ0IsQ0FBQ3NCLFlBQVksQ0FBQ00sTUFBTSxDQUFDa0IsT0FBTyxDQUFDLENBQUMsRUFBRWxCLE1BQU0sQ0FBQ2hCLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRSxNQUFNLElBQUlZLG9CQUFXLENBQUMseUJBQXlCLEdBQUdJLE1BQU0sQ0FBQ2tCLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDbEssSUFBSWxCLE1BQU0sQ0FBQ2dDLFdBQVcsQ0FBQyxDQUFDLEtBQUsvQyxTQUFTLEVBQUVlLE1BQU0sQ0FBQ2lDLFdBQVcsQ0FBQyxFQUFFLENBQUM7O0lBRTlEO0lBQ0EsSUFBSWpDLE1BQU0sQ0FBQ2Esb0JBQW9CLENBQUMsQ0FBQyxFQUFFO01BQ2pDLElBQUliLE1BQU0sQ0FBQ2MsU0FBUyxDQUFDLENBQUMsRUFBRSxNQUFNLElBQUlsQixvQkFBVyxDQUFDLHdFQUF3RSxDQUFDO01BQ3ZISSxNQUFNLENBQUNlLFNBQVMsQ0FBQ2YsTUFBTSxDQUFDYSxvQkFBb0IsQ0FBQyxDQUFDLENBQUNHLGFBQWEsQ0FBQyxDQUFDLENBQUM7SUFDakU7O0lBRUE7SUFDQSxJQUFJTSxNQUFNO0lBQ1YsSUFBSXRCLE1BQU0sQ0FBQ0UsZ0JBQWdCLENBQUMsQ0FBQyxLQUFLakIsU0FBUyxFQUFFZSxNQUFNLENBQUNHLGdCQUFnQixDQUFDLElBQUksQ0FBQztJQUMxRSxJQUFJSCxNQUFNLENBQUNFLGdCQUFnQixDQUFDLENBQUMsRUFBRTtNQUM3QixJQUFJcEIsV0FBVyxHQUFHLE1BQU1vRCxxQkFBcUIsQ0FBQ1AsWUFBWSxDQUFDM0IsTUFBTSxDQUFDO01BQ2xFc0IsTUFBTSxHQUFHLElBQUlsRCxnQkFBZ0IsQ0FBQ2EsU0FBUyxFQUFFQSxTQUFTLEVBQUVBLFNBQVMsRUFBRUEsU0FBUyxFQUFFQSxTQUFTLEVBQUVBLFNBQVMsRUFBRUgsV0FBVyxDQUFDO0lBQzlHLENBQUMsTUFBTTtNQUNMLElBQUlrQixNQUFNLENBQUNJLE9BQU8sQ0FBQyxDQUFDLEtBQUtuQixTQUFTLEVBQUU7UUFDbEMsSUFBSWUsTUFBTSxDQUFDVSxXQUFXLENBQUMsQ0FBQyxLQUFLekIsU0FBUyxFQUFFLE1BQU0sSUFBSVcsb0JBQVcsQ0FBQyx3REFBd0QsQ0FBQztRQUN2SDBCLE1BQU0sR0FBRyxNQUFNbEQsZ0JBQWdCLENBQUMrRCxvQkFBb0IsQ0FBQ25DLE1BQU0sQ0FBQztNQUM5RCxDQUFDLE1BQU0sSUFBSUEsTUFBTSxDQUFDUSxrQkFBa0IsQ0FBQyxDQUFDLEtBQUt2QixTQUFTLElBQUllLE1BQU0sQ0FBQ00saUJBQWlCLENBQUMsQ0FBQyxLQUFLckIsU0FBUyxFQUFFO1FBQ2hHLElBQUllLE1BQU0sQ0FBQ0ssYUFBYSxDQUFDLENBQUMsS0FBS3BCLFNBQVMsRUFBRSxNQUFNLElBQUlXLG9CQUFXLENBQUMsMERBQTBELENBQUM7UUFDM0gwQixNQUFNLEdBQUcsTUFBTWxELGdCQUFnQixDQUFDZ0Usb0JBQW9CLENBQUNwQyxNQUFNLENBQUM7TUFDOUQsQ0FBQyxNQUFNO1FBQ0wsSUFBSUEsTUFBTSxDQUFDSyxhQUFhLENBQUMsQ0FBQyxLQUFLcEIsU0FBUyxFQUFFLE1BQU0sSUFBSVcsb0JBQVcsQ0FBQyx1REFBdUQsQ0FBQztRQUN4SCxJQUFJSSxNQUFNLENBQUNTLGdCQUFnQixDQUFDLENBQUMsS0FBS3hCLFNBQVMsRUFBRSxNQUFNLElBQUlXLG9CQUFXLENBQUMsMERBQTBELENBQUM7UUFDOUgwQixNQUFNLEdBQUcsTUFBTWxELGdCQUFnQixDQUFDaUUsa0JBQWtCLENBQUNyQyxNQUFNLENBQUM7TUFDNUQ7SUFDRjs7SUFFQTtJQUNBLE1BQU1zQixNQUFNLENBQUNJLG9CQUFvQixDQUFDMUIsTUFBTSxDQUFDYSxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7SUFDaEUsT0FBT1MsTUFBTTtFQUNmOztFQUVBLGFBQXVCYSxvQkFBb0JBLENBQUNuQyxNQUEwQixFQUE2Qjs7SUFFakc7SUFDQSxJQUFJc0MsZ0JBQWdCLEdBQUd0QyxNQUFNLENBQUNjLFNBQVMsQ0FBQyxDQUFDO0lBQ3pDLElBQUlsQyxrQkFBa0IsR0FBRzBELGdCQUFnQixHQUFHQSxnQkFBZ0IsQ0FBQ0MscUJBQXFCLENBQUMsQ0FBQyxHQUFHLElBQUk7SUFDM0YsSUFBSXZDLE1BQU0sQ0FBQ1MsZ0JBQWdCLENBQUMsQ0FBQyxLQUFLeEIsU0FBUyxFQUFFZSxNQUFNLENBQUN3QyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7SUFDdkUsSUFBSXhDLE1BQU0sQ0FBQ0ssYUFBYSxDQUFDLENBQUMsS0FBS3BCLFNBQVMsRUFBRWUsTUFBTSxDQUFDeUMsYUFBYSxDQUFDLEVBQUUsQ0FBQzs7SUFFbEU7SUFDQSxJQUFJQyxNQUFNLEdBQUcsTUFBTWxELHFCQUFZLENBQUNtRCxjQUFjLENBQUMsQ0FBQzs7SUFFaEQ7SUFDQSxJQUFJckIsTUFBTSxHQUFHLE1BQU1vQixNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQzlDLE9BQU8sSUFBSUMsT0FBTyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLOztRQUV0QztRQUNBLElBQUlsRSxzQkFBc0IsR0FBR21FLGlCQUFRLENBQUNDLE9BQU8sQ0FBQyxDQUFDO1FBQy9DekQscUJBQVksQ0FBQ0MsdUJBQXVCLENBQUNaLHNCQUFzQixFQUFFLE1BQU1ELGtCQUFrQixDQUFDOztRQUV0RjtRQUNBOEQsTUFBTSxDQUFDUSxrQkFBa0IsQ0FBQ0MsSUFBSSxDQUFDQyxTQUFTLENBQUNwRCxNQUFNLENBQUNxRCxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUV4RSxzQkFBc0IsRUFBRSxPQUFPTCxVQUFVLEtBQUs7VUFDdkcsSUFBSSxPQUFPQSxVQUFVLEtBQUssUUFBUSxFQUFFdUUsTUFBTSxDQUFDLElBQUluRCxvQkFBVyxDQUFDcEIsVUFBVSxDQUFDLENBQUMsQ0FBQztVQUNuRXNFLE9BQU8sQ0FBQyxJQUFJMUUsZ0JBQWdCLENBQUNJLFVBQVUsRUFBRXdCLE1BQU0sQ0FBQ2tCLE9BQU8sQ0FBQyxDQUFDLEVBQUVsQixNQUFNLENBQUNnQyxXQUFXLENBQUMsQ0FBQyxFQUFFaEMsTUFBTSxDQUFDaEIsS0FBSyxDQUFDLENBQUMsRUFBRWdCLE1BQU0sQ0FBQ2MsU0FBUyxDQUFDLENBQUMsR0FBR2QsTUFBTSxDQUFDYyxTQUFTLENBQUMsQ0FBQyxDQUFDeUIscUJBQXFCLENBQUMsQ0FBQyxHQUFHdEQsU0FBUyxFQUFFSixzQkFBc0IsQ0FBQyxDQUFDO1FBQzdNLENBQUMsQ0FBQztNQUNKLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQzs7SUFFRjtJQUNBLElBQUltQixNQUFNLENBQUNrQixPQUFPLENBQUMsQ0FBQyxFQUFFLE1BQU1JLE1BQU0sQ0FBQ2dDLElBQUksQ0FBQyxDQUFDO0lBQ3pDLE9BQU9oQyxNQUFNO0VBQ2Y7O0VBRUEsYUFBdUJjLG9CQUFvQkEsQ0FBQ3BDLE1BQTBCLEVBQTZCOztJQUVqRztJQUNBNkIsMEJBQWlCLENBQUNDLFFBQVEsQ0FBQzlCLE1BQU0sQ0FBQzRCLGNBQWMsQ0FBQyxDQUFDLENBQUM7SUFDbkQsSUFBSTVCLE1BQU0sQ0FBQ00saUJBQWlCLENBQUMsQ0FBQyxLQUFLckIsU0FBUyxFQUFFZSxNQUFNLENBQUN1RCxpQkFBaUIsQ0FBQyxFQUFFLENBQUM7SUFDMUUsSUFBSXZELE1BQU0sQ0FBQ08saUJBQWlCLENBQUMsQ0FBQyxLQUFLdEIsU0FBUyxFQUFFZSxNQUFNLENBQUN3RCxpQkFBaUIsQ0FBQyxFQUFFLENBQUM7SUFDMUUsSUFBSXhELE1BQU0sQ0FBQ1Esa0JBQWtCLENBQUMsQ0FBQyxLQUFLdkIsU0FBUyxFQUFFZSxNQUFNLENBQUN5RCxrQkFBa0IsQ0FBQyxFQUFFLENBQUM7SUFDNUUsSUFBSW5CLGdCQUFnQixHQUFHdEMsTUFBTSxDQUFDYyxTQUFTLENBQUMsQ0FBQztJQUN6QyxJQUFJbEMsa0JBQWtCLEdBQUcwRCxnQkFBZ0IsR0FBR0EsZ0JBQWdCLENBQUNDLHFCQUFxQixDQUFDLENBQUMsR0FBRyxJQUFJO0lBQzNGLElBQUl2QyxNQUFNLENBQUNTLGdCQUFnQixDQUFDLENBQUMsS0FBS3hCLFNBQVMsRUFBRWUsTUFBTSxDQUFDd0MsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO0lBQ3ZFLElBQUl4QyxNQUFNLENBQUNVLFdBQVcsQ0FBQyxDQUFDLEtBQUt6QixTQUFTLEVBQUVlLE1BQU0sQ0FBQzBELFdBQVcsQ0FBQyxTQUFTLENBQUM7O0lBRXJFO0lBQ0EsSUFBSWhCLE1BQU0sR0FBRyxNQUFNbEQscUJBQVksQ0FBQ21ELGNBQWMsQ0FBQyxDQUFDOztJQUVoRDtJQUNBLElBQUlyQixNQUFNLEdBQUcsTUFBTW9CLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDOUMsT0FBTyxJQUFJQyxPQUFPLENBQUMsQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7O1FBRXRDO1FBQ0EsSUFBSWxFLHNCQUFzQixHQUFHbUUsaUJBQVEsQ0FBQ0MsT0FBTyxDQUFDLENBQUM7UUFDL0N6RCxxQkFBWSxDQUFDQyx1QkFBdUIsQ0FBQ1osc0JBQXNCLEVBQUUsTUFBTUQsa0JBQWtCLENBQUM7O1FBRXRGO1FBQ0E4RCxNQUFNLENBQUNRLGtCQUFrQixDQUFDQyxJQUFJLENBQUNDLFNBQVMsQ0FBQ3BELE1BQU0sQ0FBQ3FELE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRXhFLHNCQUFzQixFQUFFLE9BQU9MLFVBQVUsS0FBSztVQUN2RyxJQUFJLE9BQU9BLFVBQVUsS0FBSyxRQUFRLEVBQUV1RSxNQUFNLENBQUMsSUFBSW5ELG9CQUFXLENBQUNwQixVQUFVLENBQUMsQ0FBQyxDQUFDO1VBQ25Fc0UsT0FBTyxDQUFDLElBQUkxRSxnQkFBZ0IsQ0FBQ0ksVUFBVSxFQUFFd0IsTUFBTSxDQUFDa0IsT0FBTyxDQUFDLENBQUMsRUFBRWxCLE1BQU0sQ0FBQ2dDLFdBQVcsQ0FBQyxDQUFDLEVBQUVoQyxNQUFNLENBQUNoQixLQUFLLENBQUMsQ0FBQyxFQUFFZ0IsTUFBTSxDQUFDYyxTQUFTLENBQUMsQ0FBQyxHQUFHZCxNQUFNLENBQUNjLFNBQVMsQ0FBQyxDQUFDLENBQUN5QixxQkFBcUIsQ0FBQyxDQUFDLEdBQUd0RCxTQUFTLEVBQUVKLHNCQUFzQixDQUFDLENBQUM7UUFDN00sQ0FBQyxDQUFDO01BQ0osQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDOztJQUVGO0lBQ0EsSUFBSW1CLE1BQU0sQ0FBQ2tCLE9BQU8sQ0FBQyxDQUFDLEVBQUUsTUFBTUksTUFBTSxDQUFDZ0MsSUFBSSxDQUFDLENBQUM7SUFDekMsT0FBT2hDLE1BQU07RUFDZjs7RUFFQSxhQUF1QmUsa0JBQWtCQSxDQUFDckMsTUFBMEIsRUFBNkI7O0lBRS9GO0lBQ0EsSUFBSUEsTUFBTSxDQUFDVSxXQUFXLENBQUMsQ0FBQyxLQUFLekIsU0FBUyxFQUFFZSxNQUFNLENBQUMwRCxXQUFXLENBQUMsU0FBUyxDQUFDO0lBQ3JFLElBQUlwQixnQkFBZ0IsR0FBR3RDLE1BQU0sQ0FBQ2MsU0FBUyxDQUFDLENBQUM7SUFDekMsSUFBSWxDLGtCQUFrQixHQUFHMEQsZ0JBQWdCLEdBQUdBLGdCQUFnQixDQUFDQyxxQkFBcUIsQ0FBQyxDQUFDLEdBQUcsSUFBSTs7SUFFM0Y7SUFDQSxJQUFJRyxNQUFNLEdBQUcsTUFBTWxELHFCQUFZLENBQUNtRCxjQUFjLENBQUMsQ0FBQzs7SUFFaEQ7SUFDQSxJQUFJckIsTUFBTSxHQUFHLE1BQU1vQixNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQzlDLE9BQU8sSUFBSUMsT0FBTyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLOztRQUV0QztRQUNBLElBQUlsRSxzQkFBc0IsR0FBR21FLGlCQUFRLENBQUNDLE9BQU8sQ0FBQyxDQUFDO1FBQy9DekQscUJBQVksQ0FBQ0MsdUJBQXVCLENBQUNaLHNCQUFzQixFQUFFLE1BQU1ELGtCQUFrQixDQUFDOztRQUV0RjtRQUNBOEQsTUFBTSxDQUFDUSxrQkFBa0IsQ0FBQ0MsSUFBSSxDQUFDQyxTQUFTLENBQUNwRCxNQUFNLENBQUNxRCxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUV4RSxzQkFBc0IsRUFBRSxPQUFPTCxVQUFVLEtBQUs7VUFDdkcsSUFBSSxPQUFPQSxVQUFVLEtBQUssUUFBUSxFQUFFdUUsTUFBTSxDQUFDLElBQUluRCxvQkFBVyxDQUFDcEIsVUFBVSxDQUFDLENBQUMsQ0FBQztVQUNuRXNFLE9BQU8sQ0FBQyxJQUFJMUUsZ0JBQWdCLENBQUNJLFVBQVUsRUFBRXdCLE1BQU0sQ0FBQ2tCLE9BQU8sQ0FBQyxDQUFDLEVBQUVsQixNQUFNLENBQUNnQyxXQUFXLENBQUMsQ0FBQyxFQUFFaEMsTUFBTSxDQUFDaEIsS0FBSyxDQUFDLENBQUMsRUFBRWdCLE1BQU0sQ0FBQ2MsU0FBUyxDQUFDLENBQUMsR0FBR2QsTUFBTSxDQUFDYyxTQUFTLENBQUMsQ0FBQyxDQUFDeUIscUJBQXFCLENBQUMsQ0FBQyxHQUFHdEQsU0FBUyxFQUFFSixzQkFBc0IsQ0FBQyxDQUFDO1FBQzdNLENBQUMsQ0FBQztNQUNKLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQzs7SUFFRjtJQUNBLElBQUltQixNQUFNLENBQUNrQixPQUFPLENBQUMsQ0FBQyxFQUFFLE1BQU1JLE1BQU0sQ0FBQ2dDLElBQUksQ0FBQyxDQUFDO0lBQ3pDLE9BQU9oQyxNQUFNO0VBQ2Y7O0VBRUEsYUFBYXFDLGdCQUFnQkEsQ0FBQSxFQUFHO0lBQzlCLElBQUlqQixNQUFNLEdBQUcsTUFBTWxELHFCQUFZLENBQUNtRCxjQUFjLENBQUMsQ0FBQztJQUNoRCxPQUFPRCxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ2xDLE9BQU9PLElBQUksQ0FBQ1MsS0FBSyxDQUFDbEIsTUFBTSxDQUFDbUIsOEJBQThCLENBQUMsQ0FBQyxDQUFDLENBQUNDLFNBQVM7SUFDdEUsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsT0FBTzlFLEtBQUtBLENBQUEsRUFBRztJQUNiLElBQUksQ0FBQ1osZ0JBQWdCLENBQUMyRixFQUFFLEVBQUUzRixnQkFBZ0IsQ0FBQzJGLEVBQUUsR0FBR3BGLFdBQUUsQ0FBQ3FGLFFBQVE7SUFDM0QsT0FBTzVGLGdCQUFnQixDQUFDMkYsRUFBRTtFQUM1Qjs7RUFFQTs7RUFFQTs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsTUFBTUUsc0JBQXNCQSxDQUFBLEVBQW9CO0lBQzlDLElBQUksSUFBSSxDQUFDQyxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDRCxzQkFBc0IsQ0FBQyxDQUFDO0lBQ2hGLE9BQU8sSUFBSSxDQUFDdkIsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUl0QixPQUFPLENBQUMsQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7O1FBRXRDO1FBQ0EsSUFBSSxDQUFDTCxNQUFNLENBQUMwQiwwQkFBMEIsQ0FBQyxJQUFJLENBQUM1RixVQUFVLEVBQUUsQ0FBQzZGLElBQUksS0FBSztVQUNoRXZCLE9BQU8sQ0FBQ3VCLElBQUksQ0FBQztRQUNmLENBQUMsQ0FBQztNQUNKLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7RUFDRSxNQUFNQyxjQUFjQSxDQUFBLEVBQXFCO0lBQ3ZDLElBQUksSUFBSSxDQUFDSixjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDSSxjQUFjLENBQUMsQ0FBQztJQUN4RSxPQUFPLElBQUksQ0FBQzVCLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLOztRQUV0QztRQUNBLElBQUksQ0FBQ0wsTUFBTSxDQUFDNkIsZ0JBQWdCLENBQUMsSUFBSSxDQUFDL0YsVUFBVSxFQUFFLENBQUM2RixJQUFJLEtBQUs7VUFDdER2QixPQUFPLENBQUN1QixJQUFJLENBQUM7UUFDZixDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsTUFBTUcsUUFBUUEsQ0FBQSxFQUFxQjtJQUNqQyxJQUFJLElBQUksQ0FBQ04sY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ00sUUFBUSxDQUFDLENBQUM7SUFDbEUsT0FBTyxJQUFJLENBQUM5QixNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLE9BQU8sSUFBSXRCLE9BQU8sQ0FBQyxDQUFDQyxPQUFPLEVBQUVDLE1BQU0sS0FBSztRQUN0QyxJQUFJLENBQUNMLE1BQU0sQ0FBQytCLFNBQVMsQ0FBQyxJQUFJLENBQUNqRyxVQUFVLEVBQUUsQ0FBQzZGLElBQUksS0FBSztVQUMvQ3ZCLE9BQU8sQ0FBQ3VCLElBQUksQ0FBQztRQUNmLENBQUMsQ0FBQztNQUNKLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7RUFDRSxNQUFNekMsY0FBY0EsQ0FBQSxFQUErQjtJQUNqRCxJQUFJLElBQUksQ0FBQ3NDLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUN0QyxjQUFjLENBQUMsQ0FBQztJQUN4RSxPQUFPLElBQUksQ0FBQ2MsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUksQ0FBQ3pCLE1BQU0sQ0FBQ2dDLGdCQUFnQixDQUFDLElBQUksQ0FBQ2xHLFVBQVUsQ0FBQztJQUN0RCxDQUFDLENBQUM7RUFDSjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsTUFBTWlDLGdCQUFnQkEsQ0FBQSxFQUFvQjtJQUN4QyxJQUFJLElBQUksQ0FBQ3lELGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUN6RCxnQkFBZ0IsQ0FBQyxDQUFDO0lBQzFFLE9BQU8sSUFBSSxDQUFDaUMsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUksQ0FBQ3pCLE1BQU0sQ0FBQ2lDLGtCQUFrQixDQUFDLElBQUksQ0FBQ25HLFVBQVUsQ0FBQztJQUN4RCxDQUFDLENBQUM7RUFDSjs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxNQUFNZ0UsZ0JBQWdCQSxDQUFDb0MsYUFBcUIsRUFBaUI7SUFDM0QsSUFBSSxJQUFJLENBQUNWLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUMxQixnQkFBZ0IsQ0FBQ29DLGFBQWEsQ0FBQztJQUN2RixPQUFPLElBQUksQ0FBQ2xDLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsSUFBSSxDQUFDekIsTUFBTSxDQUFDbUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDckcsVUFBVSxFQUFFb0csYUFBYSxDQUFDO0lBQ2hFLENBQUMsQ0FBQztFQUNKOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE1BQU1FLE1BQU1BLENBQUNyRyxJQUFZLEVBQWlCO0lBQ3hDLElBQUksSUFBSSxDQUFDeUYsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ1ksTUFBTSxDQUFDckcsSUFBSSxDQUFDO0lBQ3BFLE9BQU9MLGdCQUFnQixDQUFDMEcsTUFBTSxDQUFDckcsSUFBSSxFQUFFLElBQUksQ0FBQztFQUM1Qzs7RUFFQTs7RUFFQSxNQUFNc0csV0FBV0EsQ0FBQ0MsUUFBOEIsRUFBaUI7SUFDL0QsSUFBSSxJQUFJLENBQUNkLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUNhLFdBQVcsQ0FBQ0MsUUFBUSxDQUFDO0lBQzdFLE1BQU0sS0FBSyxDQUFDRCxXQUFXLENBQUNDLFFBQVEsQ0FBQztJQUNqQyxNQUFNLElBQUksQ0FBQ0MsZ0JBQWdCLENBQUMsQ0FBQztFQUMvQjs7RUFFQSxNQUFNQyxjQUFjQSxDQUFDRixRQUFRLEVBQWlCO0lBQzVDLElBQUksSUFBSSxDQUFDZCxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDZ0IsY0FBYyxDQUFDRixRQUFRLENBQUM7SUFDaEYsTUFBTSxLQUFLLENBQUNFLGNBQWMsQ0FBQ0YsUUFBUSxDQUFDO0lBQ3BDLE1BQU0sSUFBSSxDQUFDQyxnQkFBZ0IsQ0FBQyxDQUFDO0VBQy9COztFQUVBRSxZQUFZQSxDQUFBLEVBQTJCO0lBQ3JDLElBQUksSUFBSSxDQUFDakIsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ2lCLFlBQVksQ0FBQyxDQUFDO0lBQ3RFLE9BQU8sS0FBSyxDQUFDQSxZQUFZLENBQUMsQ0FBQztFQUM3Qjs7RUFFQSxNQUFNMUQsbUJBQW1CQSxDQUFDMkQsZUFBdUQsRUFBRUMsU0FBbUIsRUFBaUI7SUFDckgsSUFBSSxJQUFJLENBQUNuQixjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDekMsbUJBQW1CLENBQUMyRCxlQUFlLEVBQUVDLFNBQVMsQ0FBQzs7SUFFdkc7SUFDQSxJQUFJQyxVQUFVLEdBQUcsQ0FBQ0YsZUFBZSxHQUFHbkcsU0FBUyxHQUFHbUcsZUFBZSxZQUFZRyw0QkFBbUIsR0FBR0gsZUFBZSxHQUFHLElBQUlHLDRCQUFtQixDQUFDSCxlQUFlLENBQUM7SUFDM0osSUFBSUksR0FBRyxHQUFHRixVQUFVLElBQUlBLFVBQVUsQ0FBQ0csTUFBTSxDQUFDLENBQUMsR0FBR0gsVUFBVSxDQUFDRyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUU7SUFDdEUsSUFBSUMsUUFBUSxHQUFHSixVQUFVLElBQUlBLFVBQVUsQ0FBQ0ssV0FBVyxDQUFDLENBQUMsR0FBR0wsVUFBVSxDQUFDSyxXQUFXLENBQUMsQ0FBQyxHQUFHLEVBQUU7SUFDckYsSUFBSWpILFFBQVEsR0FBRzRHLFVBQVUsSUFBSUEsVUFBVSxDQUFDdEQsV0FBVyxDQUFDLENBQUMsR0FBR3NELFVBQVUsQ0FBQ3RELFdBQVcsQ0FBQyxDQUFDLEdBQUcsRUFBRTtJQUNyRixJQUFJNEQsUUFBUSxHQUFHTixVQUFVLElBQUlBLFVBQVUsQ0FBQ08sV0FBVyxDQUFDLENBQUMsR0FBR1AsVUFBVSxDQUFDTyxXQUFXLENBQUMsQ0FBQyxHQUFHLEVBQUU7SUFDckYsSUFBSWpILGtCQUFrQixHQUFHMEcsVUFBVSxHQUFHQSxVQUFVLENBQUMvQyxxQkFBcUIsQ0FBQyxDQUFDLEdBQUd0RCxTQUFTO0lBQ3BGLElBQUk2RyxZQUFZLEdBQUdULFNBQVMsS0FBS3BHLFNBQVMsR0FBRyxDQUFDLENBQUMsR0FBSW9HLFNBQVMsR0FBRyxDQUFDLEdBQUcsQ0FBRSxDQUFDLENBQUM7SUFDdkUsSUFBSSxDQUFDekcsa0JBQWtCLEdBQUdBLGtCQUFrQixDQUFDLENBQUU7O0lBRS9DO0lBQ0EsT0FBTyxJQUFJLENBQUM4RCxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLE9BQU8sSUFBSXRCLE9BQU8sQ0FBTyxDQUFDQyxPQUFPLEVBQUVDLE1BQU0sS0FBSztRQUM1QyxJQUFJLENBQUNMLE1BQU0sQ0FBQ3FELHFCQUFxQixDQUFDLElBQUksQ0FBQ3ZILFVBQVUsRUFBRWdILEdBQUcsRUFBRUUsUUFBUSxFQUFFaEgsUUFBUSxFQUFFa0gsUUFBUSxFQUFFRSxZQUFZLEVBQUUsQ0FBQ3pCLElBQUksS0FBSztVQUM1R3ZCLE9BQU8sQ0FBQyxDQUFDO1FBQ1gsQ0FBQyxDQUFDO01BQ0osQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0VBQ0o7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtFQUNFLE1BQU1rRCxlQUFlQSxDQUFBLEVBQXFCO0lBQ3hDLElBQUksSUFBSSxDQUFDOUIsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQzhCLGVBQWUsQ0FBQyxDQUFDO0lBQ3pFLE9BQU8sSUFBSSxDQUFDdEQsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUksQ0FBQ3pCLE1BQU0sQ0FBQ3VELGlCQUFpQixDQUFDLElBQUksQ0FBQ3pILFVBQVUsQ0FBQztJQUN2RCxDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNMEgsbUJBQW1CQSxDQUFBLEVBQWlDO0lBQ3hELElBQUksSUFBSSxDQUFDaEMsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ2dDLG1CQUFtQixDQUFDLENBQUM7SUFDN0UsT0FBTyxJQUFJLENBQUN4RCxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLE9BQU8sSUFBSXRCLE9BQU8sQ0FBQyxDQUFDQyxPQUFPLEVBQUVDLE1BQU0sS0FBSztRQUN0QyxJQUFJb0Qsc0JBQXNCLEdBQUcsSUFBSSxDQUFDekQsTUFBTSxDQUFDMEQscUJBQXFCLENBQUMsSUFBSSxDQUFDNUgsVUFBVSxDQUFDO1FBQy9FLElBQUksQ0FBQzJILHNCQUFzQixFQUFFckQsT0FBTyxDQUFDN0QsU0FBUyxDQUFDLENBQUM7UUFDM0M7VUFDSCxJQUFJb0gsY0FBYyxHQUFHbEQsSUFBSSxDQUFDUyxLQUFLLENBQUN1QyxzQkFBc0IsQ0FBQztVQUN2RHJELE9BQU8sQ0FBQyxJQUFJeUMsNEJBQW1CLENBQUMsRUFBQ0MsR0FBRyxFQUFFYSxjQUFjLENBQUNiLEdBQUcsRUFBRUUsUUFBUSxFQUFFVyxjQUFjLENBQUNYLFFBQVEsRUFBRWhILFFBQVEsRUFBRTJILGNBQWMsQ0FBQzNILFFBQVEsRUFBRWtILFFBQVEsRUFBRVMsY0FBYyxDQUFDVCxRQUFRLEVBQUVoSCxrQkFBa0IsRUFBRSxJQUFJLENBQUNBLGtCQUFrQixFQUFDLENBQUMsQ0FBQztRQUNuTjtNQUNGLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU0wSCxtQkFBbUJBLENBQUEsRUFBcUI7SUFDNUMsSUFBSSxJQUFJLENBQUNwQyxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDb0MsbUJBQW1CLENBQUMsQ0FBQztJQUM3RSxPQUFPLElBQUksQ0FBQzVELE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLO1FBQ3RDLElBQUksQ0FBQ0wsTUFBTSxDQUFDNkQsc0JBQXNCLENBQUMsSUFBSSxDQUFDL0gsVUFBVSxFQUFFLENBQUM2RixJQUFJLEtBQUs7VUFDNUR2QixPQUFPLENBQUN1QixJQUFJLENBQUM7UUFDZixDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNbUMsVUFBVUEsQ0FBQSxFQUEyQjtJQUN6QyxJQUFJLElBQUksQ0FBQ3RDLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUNzQyxVQUFVLENBQUMsQ0FBQztJQUNwRSxNQUFNLElBQUk1RyxvQkFBVyxDQUFDLGlCQUFpQixDQUFDO0VBQzFDOztFQUVBLE1BQU1zQixPQUFPQSxDQUFBLEVBQW9CO0lBQy9CLElBQUksSUFBSSxDQUFDZ0QsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ2hELE9BQU8sQ0FBQyxDQUFDO0lBQ2pFLE9BQU8sSUFBSSxDQUFDekMsSUFBSTtFQUNsQjs7RUFFQSxNQUFNZ0ksb0JBQW9CQSxDQUFDQyxlQUF3QixFQUFFQyxTQUFrQixFQUFvQztJQUN6RyxJQUFJLElBQUksQ0FBQ3pDLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUN1QyxvQkFBb0IsQ0FBQ0MsZUFBZSxFQUFFQyxTQUFTLENBQUM7SUFDeEcsT0FBTyxJQUFJLENBQUNqRSxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLElBQUk7UUFDRixJQUFJeUMsTUFBTSxHQUFHLElBQUksQ0FBQ2xFLE1BQU0sQ0FBQ21FLHNCQUFzQixDQUFDLElBQUksQ0FBQ3JJLFVBQVUsRUFBRWtJLGVBQWUsR0FBR0EsZUFBZSxHQUFHLEVBQUUsRUFBRUMsU0FBUyxHQUFHQSxTQUFTLEdBQUcsRUFBRSxDQUFDO1FBQ3BJLElBQUlDLE1BQU0sQ0FBQ0UsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRSxNQUFNLElBQUlsSCxvQkFBVyxDQUFDZ0gsTUFBTSxDQUFDO1FBQzNELE9BQU8sSUFBSUcsZ0NBQXVCLENBQUM1RCxJQUFJLENBQUNTLEtBQUssQ0FBQ2dELE1BQU0sQ0FBQyxDQUFDO01BQ3hELENBQUMsQ0FBQyxPQUFPSSxHQUFRLEVBQUU7UUFDakIsSUFBSUEsR0FBRyxDQUFDQyxPQUFPLENBQUNDLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLE1BQU0sSUFBSXRILG9CQUFXLENBQUMsc0JBQXNCLEdBQUcrRyxTQUFTLENBQUM7UUFDekcsTUFBTSxJQUFJL0csb0JBQVcsQ0FBQ29ILEdBQUcsQ0FBQ0MsT0FBTyxDQUFDO01BQ3BDO0lBQ0YsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTUUsdUJBQXVCQSxDQUFDQyxpQkFBeUIsRUFBb0M7SUFDekYsSUFBSSxJQUFJLENBQUNsRCxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDaUQsdUJBQXVCLENBQUNDLGlCQUFpQixDQUFDO0lBQ2xHLE9BQU8sSUFBSSxDQUFDMUUsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixJQUFJO1FBQ0YsSUFBSXlDLE1BQU0sR0FBRyxJQUFJLENBQUNsRSxNQUFNLENBQUMyRSx5QkFBeUIsQ0FBQyxJQUFJLENBQUM3SSxVQUFVLEVBQUU0SSxpQkFBaUIsQ0FBQztRQUN0RixJQUFJUixNQUFNLENBQUNFLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUUsTUFBTSxJQUFJbEgsb0JBQVcsQ0FBQ2dILE1BQU0sQ0FBQztRQUMzRCxPQUFPLElBQUlHLGdDQUF1QixDQUFDNUQsSUFBSSxDQUFDUyxLQUFLLENBQUNnRCxNQUFNLENBQUMsQ0FBQztNQUN4RCxDQUFDLENBQUMsT0FBT0ksR0FBUSxFQUFFO1FBQ2pCLE1BQU0sSUFBSXBILG9CQUFXLENBQUNvSCxHQUFHLENBQUNDLE9BQU8sQ0FBQztNQUNwQztJQUNGLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1LLFNBQVNBLENBQUEsRUFBb0I7SUFDakMsSUFBSSxJQUFJLENBQUNwRCxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDb0QsU0FBUyxDQUFDLENBQUM7SUFDbkUsT0FBTyxJQUFJLENBQUM1RSxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLE9BQU8sSUFBSXRCLE9BQU8sQ0FBQyxDQUFDQyxPQUFPLEVBQUVDLE1BQU0sS0FBSztRQUN0QyxJQUFJLENBQUNMLE1BQU0sQ0FBQzZFLFVBQVUsQ0FBQyxJQUFJLENBQUMvSSxVQUFVLEVBQUUsQ0FBQzZGLElBQUksS0FBSztVQUNoRHZCLE9BQU8sQ0FBQ3VCLElBQUksQ0FBQztRQUNmLENBQUMsQ0FBQztNQUNKLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1tRCxlQUFlQSxDQUFBLEVBQW9CO0lBQ3ZDLElBQUksSUFBSSxDQUFDdEQsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ3NELGVBQWUsQ0FBQyxDQUFDO0lBQ3pFLElBQUksRUFBQyxNQUFNLElBQUksQ0FBQ2xCLG1CQUFtQixDQUFDLENBQUMsR0FBRSxNQUFNLElBQUkxRyxvQkFBVyxDQUFDLG1DQUFtQyxDQUFDO0lBQ2pHLE9BQU8sSUFBSSxDQUFDOEMsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUl0QixPQUFPLENBQUMsQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7UUFDdEMsSUFBSSxDQUFDTCxNQUFNLENBQUMrRSxpQkFBaUIsQ0FBQyxJQUFJLENBQUNqSixVQUFVLEVBQUUsQ0FBQzZGLElBQUksS0FBSztVQUN2RHZCLE9BQU8sQ0FBQ3VCLElBQUksQ0FBQztRQUNmLENBQUMsQ0FBQztNQUNKLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1xRCxlQUFlQSxDQUFDQyxJQUFZLEVBQUVDLEtBQWEsRUFBRUMsR0FBVyxFQUFtQjtJQUMvRSxJQUFJLElBQUksQ0FBQzNELGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUN3RCxlQUFlLENBQUNDLElBQUksRUFBRUMsS0FBSyxFQUFFQyxHQUFHLENBQUM7SUFDekYsSUFBSSxFQUFDLE1BQU0sSUFBSSxDQUFDdkIsbUJBQW1CLENBQUMsQ0FBQyxHQUFFLE1BQU0sSUFBSTFHLG9CQUFXLENBQUMsbUNBQW1DLENBQUM7SUFDakcsT0FBTyxJQUFJLENBQUM4QyxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLE9BQU8sSUFBSXRCLE9BQU8sQ0FBQyxDQUFDQyxPQUFPLEVBQUVDLE1BQU0sS0FBSztRQUN0QyxJQUFJLENBQUNMLE1BQU0sQ0FBQ29GLGtCQUFrQixDQUFDLElBQUksQ0FBQ3RKLFVBQVUsRUFBRW1KLElBQUksRUFBRUMsS0FBSyxFQUFFQyxHQUFHLEVBQUUsQ0FBQ3hELElBQUksS0FBSztVQUMxRSxJQUFJLE9BQU9BLElBQUksS0FBSyxRQUFRLEVBQUV0QixNQUFNLENBQUMsSUFBSW5ELG9CQUFXLENBQUN5RSxJQUFJLENBQUMsQ0FBQyxDQUFDO1VBQ3ZEdkIsT0FBTyxDQUFDdUIsSUFBSSxDQUFDO1FBQ3BCLENBQUMsQ0FBQztNQUNKLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsTUFBTTBELElBQUlBLENBQUNDLHFCQUFxRCxFQUFFQyxXQUFvQixFQUFFQyxvQkFBb0IsR0FBRyxLQUFLLEVBQTZCO0lBQy9JLElBQUksSUFBSSxDQUFDaEUsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQzZELElBQUksQ0FBQ0MscUJBQXFCLEVBQUVDLFdBQVcsRUFBRUMsb0JBQW9CLENBQUM7SUFDdEgsSUFBSSxFQUFDLE1BQU0sSUFBSSxDQUFDNUIsbUJBQW1CLENBQUMsQ0FBQyxHQUFFLE1BQU0sSUFBSTFHLG9CQUFXLENBQUMsbUNBQW1DLENBQUM7O0lBRWpHO0lBQ0FxSSxXQUFXLEdBQUdELHFCQUFxQixLQUFLL0ksU0FBUyxJQUFJK0kscUJBQXFCLFlBQVlHLDZCQUFvQixHQUFHRixXQUFXLEdBQUdELHFCQUFxQjtJQUNoSixJQUFJaEQsUUFBUSxHQUFHZ0QscUJBQXFCLFlBQVlHLDZCQUFvQixHQUFHSCxxQkFBcUIsR0FBRy9JLFNBQVM7SUFDeEcsSUFBSWdKLFdBQVcsS0FBS2hKLFNBQVMsRUFBRWdKLFdBQVcsR0FBR0csSUFBSSxDQUFDQyxHQUFHLENBQUMsTUFBTSxJQUFJLENBQUNmLFNBQVMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxJQUFJLENBQUM3RyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7O0lBRTVHO0lBQ0EsSUFBSXVFLFFBQVEsRUFBRSxNQUFNLElBQUksQ0FBQ0QsV0FBVyxDQUFDQyxRQUFRLENBQUM7O0lBRTlDO0lBQ0EsSUFBSWdDLEdBQUc7SUFDUCxJQUFJSixNQUFNO0lBQ1YsSUFBSTtNQUNGLElBQUkwQixJQUFJLEdBQUcsSUFBSTtNQUNmMUIsTUFBTSxHQUFHLE9BQU9zQixvQkFBb0IsR0FBR0ssUUFBUSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM3RixNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZMkYsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ2xHLFNBQVNBLFFBQVFBLENBQUEsRUFBRztRQUNsQkQsSUFBSSxDQUFDbkUsZUFBZSxDQUFDLENBQUM7UUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLOztVQUV0QztVQUNBdUYsSUFBSSxDQUFDNUYsTUFBTSxDQUFDcUYsSUFBSSxDQUFDTyxJQUFJLENBQUM5SixVQUFVLEVBQUV5SixXQUFXLEVBQUUsT0FBTzVELElBQUksS0FBSztZQUM3RCxJQUFJQSxJQUFJLENBQUN5QyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFL0QsTUFBTSxDQUFDLElBQUluRCxvQkFBVyxDQUFDeUUsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNyRDtjQUNILElBQUltRSxRQUFRLEdBQUdyRixJQUFJLENBQUNTLEtBQUssQ0FBQ1MsSUFBSSxDQUFDO2NBQy9CdkIsT0FBTyxDQUFDLElBQUkyRix5QkFBZ0IsQ0FBQ0QsUUFBUSxDQUFDRSxnQkFBZ0IsRUFBRUYsUUFBUSxDQUFDRyxhQUFhLENBQUMsQ0FBQztZQUNsRjtVQUNGLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQztNQUNKO0lBQ0YsQ0FBQyxDQUFDLE9BQU9DLENBQUMsRUFBRTtNQUNWNUIsR0FBRyxHQUFHNEIsQ0FBQztJQUNUOztJQUVBO0lBQ0EsSUFBSTVELFFBQVEsRUFBRSxNQUFNLElBQUksQ0FBQ0UsY0FBYyxDQUFDRixRQUFRLENBQUM7O0lBRWpEO0lBQ0EsSUFBSWdDLEdBQUcsRUFBRSxNQUFNQSxHQUFHO0lBQ2xCLE9BQU9KLE1BQU07RUFDZjs7RUFFQSxNQUFNaUMsWUFBWUEsQ0FBQ3RKLGNBQXVCLEVBQWlCO0lBQ3pELElBQUksSUFBSSxDQUFDMkUsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQzJFLFlBQVksQ0FBQ3RKLGNBQWMsQ0FBQztJQUNwRixJQUFJLEVBQUMsTUFBTSxJQUFJLENBQUMrRyxtQkFBbUIsQ0FBQyxDQUFDLEdBQUUsTUFBTSxJQUFJMUcsb0JBQVcsQ0FBQyxtQ0FBbUMsQ0FBQztJQUNqRyxJQUFJLENBQUNMLGNBQWMsR0FBR0EsY0FBYyxLQUFLTixTQUFTLEdBQUdiLGdCQUFnQixDQUFDRSx5QkFBeUIsR0FBR2lCLGNBQWM7SUFDaEgsSUFBSSxDQUFDLElBQUksQ0FBQ3VKLFVBQVUsRUFBRSxJQUFJLENBQUNBLFVBQVUsR0FBRyxJQUFJQyxtQkFBVSxDQUFDLFlBQVksTUFBTSxJQUFJLENBQUNDLGNBQWMsQ0FBQyxDQUFDLENBQUM7SUFDL0YsSUFBSSxDQUFDRixVQUFVLENBQUNHLEtBQUssQ0FBQyxJQUFJLENBQUMxSixjQUFjLENBQUM7RUFDNUM7O0VBRUEsTUFBTTJKLFdBQVdBLENBQUEsRUFBa0I7SUFDakMsSUFBSSxJQUFJLENBQUNoRixjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDZ0YsV0FBVyxDQUFDLENBQUM7SUFDckUsSUFBSSxDQUFDL0UsZUFBZSxDQUFDLENBQUM7SUFDdEIsSUFBSSxJQUFJLENBQUMyRSxVQUFVLEVBQUUsSUFBSSxDQUFDQSxVQUFVLENBQUNLLElBQUksQ0FBQyxDQUFDO0lBQzNDLElBQUksQ0FBQ3pHLE1BQU0sQ0FBQzBHLFlBQVksQ0FBQyxJQUFJLENBQUM1SyxVQUFVLENBQUMsQ0FBQyxDQUFDO0VBQzdDOztFQUVBLE1BQU02SyxPQUFPQSxDQUFDQyxRQUFrQixFQUFpQjtJQUMvQyxJQUFJLElBQUksQ0FBQ3BGLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUNtRixPQUFPLENBQUNDLFFBQVEsQ0FBQztJQUN6RSxPQUFPLElBQUksQ0FBQzVHLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFPLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLO1FBQzVDLElBQUksQ0FBQ0wsTUFBTSxDQUFDNkcsUUFBUSxDQUFDLElBQUksQ0FBQy9LLFVBQVUsRUFBRTJFLElBQUksQ0FBQ0MsU0FBUyxDQUFDLEVBQUNrRyxRQUFRLEVBQUVBLFFBQVEsRUFBQyxDQUFDLEVBQUUsQ0FBQ3RDLEdBQUcsS0FBSztVQUNuRixJQUFJQSxHQUFHLEVBQUVqRSxNQUFNLENBQUMsSUFBSW5ELG9CQUFXLENBQUNvSCxHQUFHLENBQUMsQ0FBQyxDQUFDO1VBQ2pDbEUsT0FBTyxDQUFDLENBQUM7UUFDaEIsQ0FBQyxDQUFDO01BQ0osQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTTBHLFdBQVdBLENBQUEsRUFBa0I7SUFDakMsSUFBSSxJQUFJLENBQUN0RixjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDc0YsV0FBVyxDQUFDLENBQUM7SUFDckUsT0FBTyxJQUFJLENBQUM5RyxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLE9BQU8sSUFBSXRCLE9BQU8sQ0FBTyxDQUFDQyxPQUFPLEVBQUVDLE1BQU0sS0FBSztRQUM1QyxJQUFJLENBQUNMLE1BQU0sQ0FBQytHLFlBQVksQ0FBQyxJQUFJLENBQUNqTCxVQUFVLEVBQUUsTUFBTXNFLE9BQU8sQ0FBQyxDQUFDLENBQUM7TUFDNUQsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTTRHLGdCQUFnQkEsQ0FBQSxFQUFrQjtJQUN0QyxJQUFJLElBQUksQ0FBQ3hGLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUN3RixnQkFBZ0IsQ0FBQyxDQUFDO0lBQzFFLE9BQU8sSUFBSSxDQUFDaEgsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUl0QixPQUFPLENBQU8sQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7UUFDNUMsSUFBSSxDQUFDTCxNQUFNLENBQUNpSCxpQkFBaUIsQ0FBQyxJQUFJLENBQUNuTCxVQUFVLEVBQUUsTUFBTXNFLE9BQU8sQ0FBQyxDQUFDLENBQUM7TUFDakUsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTThHLFVBQVVBLENBQUNDLFVBQW1CLEVBQUVDLGFBQXNCLEVBQW1CO0lBQzdFLElBQUksSUFBSSxDQUFDNUYsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQzBGLFVBQVUsQ0FBQ0MsVUFBVSxFQUFFQyxhQUFhLENBQUM7SUFDN0YsT0FBTyxJQUFJLENBQUNwSCxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDOztNQUV0QjtNQUNBLElBQUk0RixVQUFVO01BQ2QsSUFBSUYsVUFBVSxLQUFLNUssU0FBUyxFQUFFO1FBQzVCLElBQUFVLGVBQU0sRUFBQ21LLGFBQWEsS0FBSzdLLFNBQVMsRUFBRSxrRUFBa0UsQ0FBQztRQUN2RzhLLFVBQVUsR0FBRyxJQUFJLENBQUNySCxNQUFNLENBQUNzSCxrQkFBa0IsQ0FBQyxJQUFJLENBQUN4TCxVQUFVLENBQUM7TUFDOUQsQ0FBQyxNQUFNLElBQUlzTCxhQUFhLEtBQUs3SyxTQUFTLEVBQUU7UUFDdEM4SyxVQUFVLEdBQUcsSUFBSSxDQUFDckgsTUFBTSxDQUFDdUgsbUJBQW1CLENBQUMsSUFBSSxDQUFDekwsVUFBVSxFQUFFcUwsVUFBVSxDQUFDO01BQzNFLENBQUMsTUFBTTtRQUNMRSxVQUFVLEdBQUcsSUFBSSxDQUFDckgsTUFBTSxDQUFDd0gsc0JBQXNCLENBQUMsSUFBSSxDQUFDMUwsVUFBVSxFQUFFcUwsVUFBVSxFQUFFQyxhQUFhLENBQUM7TUFDN0Y7O01BRUE7TUFDQSxPQUFPSyxNQUFNLENBQUNoSCxJQUFJLENBQUNTLEtBQUssQ0FBQ1osaUJBQVEsQ0FBQ29ILGdCQUFnQixDQUFDTCxVQUFVLENBQUMsQ0FBQyxDQUFDTSxPQUFPLENBQUM7SUFDMUUsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTUMsa0JBQWtCQSxDQUFDVCxVQUFtQixFQUFFQyxhQUFzQixFQUFtQjtJQUNyRixJQUFJLElBQUksQ0FBQzVGLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUNvRyxrQkFBa0IsQ0FBQ1QsVUFBVSxFQUFFQyxhQUFhLENBQUM7SUFDckcsT0FBTyxJQUFJLENBQUNwSCxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDOztNQUV0QjtNQUNBLElBQUlvRyxrQkFBa0I7TUFDdEIsSUFBSVYsVUFBVSxLQUFLNUssU0FBUyxFQUFFO1FBQzVCLElBQUFVLGVBQU0sRUFBQ21LLGFBQWEsS0FBSzdLLFNBQVMsRUFBRSxrRUFBa0UsQ0FBQztRQUN2R3NMLGtCQUFrQixHQUFHLElBQUksQ0FBQzdILE1BQU0sQ0FBQzhILDJCQUEyQixDQUFDLElBQUksQ0FBQ2hNLFVBQVUsQ0FBQztNQUMvRSxDQUFDLE1BQU0sSUFBSXNMLGFBQWEsS0FBSzdLLFNBQVMsRUFBRTtRQUN0Q3NMLGtCQUFrQixHQUFHLElBQUksQ0FBQzdILE1BQU0sQ0FBQytILDRCQUE0QixDQUFDLElBQUksQ0FBQ2pNLFVBQVUsRUFBRXFMLFVBQVUsQ0FBQztNQUM1RixDQUFDLE1BQU07UUFDTFUsa0JBQWtCLEdBQUcsSUFBSSxDQUFDN0gsTUFBTSxDQUFDZ0ksK0JBQStCLENBQUMsSUFBSSxDQUFDbE0sVUFBVSxFQUFFcUwsVUFBVSxFQUFFQyxhQUFhLENBQUM7TUFDOUc7O01BRUE7TUFDQSxPQUFPSyxNQUFNLENBQUNoSCxJQUFJLENBQUNTLEtBQUssQ0FBQ1osaUJBQVEsQ0FBQ29ILGdCQUFnQixDQUFDRyxrQkFBa0IsQ0FBQyxDQUFDLENBQUNJLGVBQWUsQ0FBQztJQUMxRixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNQyxXQUFXQSxDQUFDQyxtQkFBNkIsRUFBRUMsR0FBWSxFQUE0QjtJQUN2RixJQUFJLElBQUksQ0FBQzVHLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUMwRyxXQUFXLENBQUNDLG1CQUFtQixFQUFFQyxHQUFHLENBQUM7SUFDN0YsT0FBTyxJQUFJLENBQUNwSSxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLElBQUk0RyxXQUFXLEdBQUcsSUFBSSxDQUFDckksTUFBTSxDQUFDc0ksWUFBWSxDQUFDLElBQUksQ0FBQ3hNLFVBQVUsRUFBRXFNLG1CQUFtQixHQUFHLElBQUksR0FBRyxLQUFLLEVBQUVDLEdBQUcsR0FBR0EsR0FBRyxHQUFHLEVBQUUsQ0FBQztNQUMvRyxJQUFJRyxRQUFRLEdBQUcsRUFBRTtNQUNqQixLQUFLLElBQUlDLFdBQVcsSUFBSS9ILElBQUksQ0FBQ1MsS0FBSyxDQUFDWixpQkFBUSxDQUFDb0gsZ0JBQWdCLENBQUNXLFdBQVcsQ0FBQyxDQUFDLENBQUNFLFFBQVEsRUFBRTtRQUNuRkEsUUFBUSxDQUFDRSxJQUFJLENBQUMvTSxnQkFBZ0IsQ0FBQ2dOLGVBQWUsQ0FBQyxJQUFJQyxzQkFBYSxDQUFDSCxXQUFXLENBQUMsQ0FBQyxDQUFDO01BQ2pGO01BQ0EsT0FBT0QsUUFBUTtJQUNqQixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNSyxVQUFVQSxDQUFDekIsVUFBa0IsRUFBRWdCLG1CQUE2QixFQUEwQjtJQUMxRixJQUFJLElBQUksQ0FBQzNHLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUNvSCxVQUFVLENBQUN6QixVQUFVLEVBQUVnQixtQkFBbUIsQ0FBQztJQUNuRyxPQUFPLElBQUksQ0FBQ25JLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsSUFBSW9ILFVBQVUsR0FBRyxJQUFJLENBQUM3SSxNQUFNLENBQUM4SSxXQUFXLENBQUMsSUFBSSxDQUFDaE4sVUFBVSxFQUFFcUwsVUFBVSxFQUFFZ0IsbUJBQW1CLEdBQUcsSUFBSSxHQUFHLEtBQUssQ0FBQztNQUN6RyxJQUFJSyxXQUFXLEdBQUcvSCxJQUFJLENBQUNTLEtBQUssQ0FBQ1osaUJBQVEsQ0FBQ29ILGdCQUFnQixDQUFDbUIsVUFBVSxDQUFDLENBQUM7TUFDbkUsT0FBT25OLGdCQUFnQixDQUFDZ04sZUFBZSxDQUFDLElBQUlDLHNCQUFhLENBQUNILFdBQVcsQ0FBQyxDQUFDO0lBQ3pFLENBQUMsQ0FBQzs7RUFFSjs7RUFFQSxNQUFNTyxhQUFhQSxDQUFDQyxLQUFjLEVBQTBCO0lBQzFELElBQUksSUFBSSxDQUFDeEgsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ3VILGFBQWEsQ0FBQ0MsS0FBSyxDQUFDO0lBQzVFLElBQUlBLEtBQUssS0FBS3pNLFNBQVMsRUFBRXlNLEtBQUssR0FBRyxFQUFFO0lBQ25DLE9BQU8sSUFBSSxDQUFDaEosTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixJQUFJb0gsVUFBVSxHQUFHLElBQUksQ0FBQzdJLE1BQU0sQ0FBQ2lKLGNBQWMsQ0FBQyxJQUFJLENBQUNuTixVQUFVLEVBQUVrTixLQUFLLENBQUM7TUFDbkUsSUFBSVIsV0FBVyxHQUFHL0gsSUFBSSxDQUFDUyxLQUFLLENBQUNaLGlCQUFRLENBQUNvSCxnQkFBZ0IsQ0FBQ21CLFVBQVUsQ0FBQyxDQUFDO01BQ25FLE9BQU9uTixnQkFBZ0IsQ0FBQ2dOLGVBQWUsQ0FBQyxJQUFJQyxzQkFBYSxDQUFDSCxXQUFXLENBQUMsQ0FBQztJQUN6RSxDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNVSxlQUFlQSxDQUFDL0IsVUFBa0IsRUFBRWdDLGlCQUE0QixFQUErQjtJQUNuRyxJQUFJLElBQUksQ0FBQzNILGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUMwSCxlQUFlLENBQUMvQixVQUFVLEVBQUVnQyxpQkFBaUIsQ0FBQztJQUN0RyxJQUFJQyxJQUFJLEdBQUcsRUFBQ2pDLFVBQVUsRUFBRUEsVUFBVSxFQUFFZ0MsaUJBQWlCLEVBQUVBLGlCQUFpQixLQUFLNU0sU0FBUyxHQUFHLEVBQUUsR0FBRytELGlCQUFRLENBQUMrSSxPQUFPLENBQUNGLGlCQUFpQixDQUFDLEVBQUM7SUFDbEksT0FBTyxJQUFJLENBQUNuSixNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLElBQUk2SCxnQkFBZ0IsR0FBRzdJLElBQUksQ0FBQ1MsS0FBSyxDQUFDWixpQkFBUSxDQUFDb0gsZ0JBQWdCLENBQUMsSUFBSSxDQUFDMUgsTUFBTSxDQUFDdUosZ0JBQWdCLENBQUMsSUFBSSxDQUFDek4sVUFBVSxFQUFFMkUsSUFBSSxDQUFDQyxTQUFTLENBQUMwSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQ0ksWUFBWTtNQUM5SSxJQUFJQSxZQUFZLEdBQUcsRUFBRTtNQUNyQixLQUFLLElBQUlDLGNBQWMsSUFBSUgsZ0JBQWdCLEVBQUVFLFlBQVksQ0FBQ2YsSUFBSSxDQUFDOU0sa0NBQWdCLENBQUMrTixrQkFBa0IsQ0FBQyxJQUFJQyx5QkFBZ0IsQ0FBQ0YsY0FBYyxDQUFDLENBQUMsQ0FBQztNQUN6SSxPQUFPRCxZQUFZO0lBQ3JCLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1JLGdCQUFnQkEsQ0FBQ3pDLFVBQWtCLEVBQUU2QixLQUFjLEVBQTZCO0lBQ3BGLElBQUksSUFBSSxDQUFDeEgsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ29JLGdCQUFnQixDQUFDekMsVUFBVSxFQUFFNkIsS0FBSyxDQUFDO0lBQzNGLElBQUlBLEtBQUssS0FBS3pNLFNBQVMsRUFBRXlNLEtBQUssR0FBRyxFQUFFO0lBQ25DLE9BQU8sSUFBSSxDQUFDaEosTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixJQUFJb0ksYUFBYSxHQUFHLElBQUksQ0FBQzdKLE1BQU0sQ0FBQzhKLGlCQUFpQixDQUFDLElBQUksQ0FBQ2hPLFVBQVUsRUFBRXFMLFVBQVUsRUFBRTZCLEtBQUssQ0FBQztNQUNyRixJQUFJUyxjQUFjLEdBQUdoSixJQUFJLENBQUNTLEtBQUssQ0FBQ1osaUJBQVEsQ0FBQ29ILGdCQUFnQixDQUFDbUMsYUFBYSxDQUFDLENBQUM7TUFDekUsT0FBT2xPLGtDQUFnQixDQUFDK04sa0JBQWtCLENBQUMsSUFBSUMseUJBQWdCLENBQUNGLGNBQWMsQ0FBQyxDQUFDO0lBQ2xGLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1NLGtCQUFrQkEsQ0FBQzVDLFVBQWtCLEVBQUVDLGFBQXFCLEVBQUU0QixLQUFhLEVBQWlCO0lBQ2hHLElBQUksSUFBSSxDQUFDeEgsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ3VJLGtCQUFrQixDQUFDNUMsVUFBVSxFQUFFQyxhQUFhLEVBQUU0QixLQUFLLENBQUM7SUFDNUcsSUFBSUEsS0FBSyxLQUFLek0sU0FBUyxFQUFFeU0sS0FBSyxHQUFHLEVBQUU7SUFDbkMsT0FBTyxJQUFJLENBQUNoSixNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLElBQUksQ0FBQ3pCLE1BQU0sQ0FBQ2dLLG9CQUFvQixDQUFDLElBQUksQ0FBQ2xPLFVBQVUsRUFBRXFMLFVBQVUsRUFBRUMsYUFBYSxFQUFFNEIsS0FBSyxDQUFDO0lBQ3JGLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1pQixNQUFNQSxDQUFDQyxLQUF5QyxFQUE2QjtJQUNqRixJQUFJLElBQUksQ0FBQzFJLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUN5SSxNQUFNLENBQUNDLEtBQUssQ0FBQzs7SUFFckU7SUFDQSxNQUFNQyxlQUFlLEdBQUdELEtBQUssR0FBR0UscUJBQVksQ0FBQ0MsZ0JBQWdCLENBQUNILEtBQUssQ0FBQzs7SUFFcEU7SUFDQSxPQUFPLElBQUksQ0FBQ2xLLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLOztRQUV0QztRQUNBLElBQUksQ0FBQ0wsTUFBTSxDQUFDc0ssT0FBTyxDQUFDLElBQUksQ0FBQ3hPLFVBQVUsRUFBRTJFLElBQUksQ0FBQ0MsU0FBUyxDQUFDeUosZUFBZSxDQUFDSSxRQUFRLENBQUMsQ0FBQyxDQUFDNUosTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM2SixhQUFhLEtBQUs7O1VBRTNHO1VBQ0EsSUFBSUEsYUFBYSxDQUFDcEcsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRTtZQUNuQy9ELE1BQU0sQ0FBQyxJQUFJbkQsb0JBQVcsQ0FBQ3NOLGFBQWEsQ0FBQyxDQUFDO1lBQ3RDO1VBQ0Y7O1VBRUE7VUFDQSxJQUFJO1lBQ0ZwSyxPQUFPLENBQUMxRSxnQkFBZ0IsQ0FBQytPLGNBQWMsQ0FBQ04sZUFBZSxFQUFFSyxhQUFhLENBQUMsQ0FBQztVQUMxRSxDQUFDLENBQUMsT0FBT2xHLEdBQUcsRUFBRTtZQUNaakUsTUFBTSxDQUFDaUUsR0FBRyxDQUFDO1VBQ2I7UUFDRixDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNb0csWUFBWUEsQ0FBQ1IsS0FBb0MsRUFBNkI7SUFDbEYsSUFBSSxJQUFJLENBQUMxSSxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDa0osWUFBWSxDQUFDUixLQUFLLENBQUM7O0lBRTNFO0lBQ0EsTUFBTUMsZUFBZSxHQUFHQyxxQkFBWSxDQUFDTyxzQkFBc0IsQ0FBQ1QsS0FBSyxDQUFDOztJQUVsRTtJQUNBLE9BQU8sSUFBSSxDQUFDbEssTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUl0QixPQUFPLENBQUMsQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7O1FBRXRDO1FBQ0EsSUFBSSxDQUFDTCxNQUFNLENBQUM0SyxhQUFhLENBQUMsSUFBSSxDQUFDOU8sVUFBVSxFQUFFMkUsSUFBSSxDQUFDQyxTQUFTLENBQUN5SixlQUFlLENBQUNVLFVBQVUsQ0FBQyxDQUFDLENBQUNOLFFBQVEsQ0FBQyxDQUFDLENBQUM1SixNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQzZKLGFBQWEsS0FBSzs7VUFFOUg7VUFDQSxJQUFJQSxhQUFhLENBQUNwRyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFO1lBQ25DL0QsTUFBTSxDQUFDLElBQUluRCxvQkFBVyxDQUFDc04sYUFBYSxDQUFDLENBQUM7WUFDdEM7VUFDRjs7VUFFQTtVQUNBLElBQUk7WUFDRnBLLE9BQU8sQ0FBQzFFLGdCQUFnQixDQUFDb1Asb0JBQW9CLENBQUNYLGVBQWUsRUFBRUssYUFBYSxDQUFDLENBQUM7VUFDaEYsQ0FBQyxDQUFDLE9BQU9sRyxHQUFHLEVBQUU7WUFDWmpFLE1BQU0sQ0FBQ2lFLEdBQUcsQ0FBQztVQUNiO1FBQ0YsQ0FBQyxDQUFDO01BQ0osQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTXlHLFVBQVVBLENBQUNiLEtBQWtDLEVBQWlDO0lBQ2xGLElBQUksSUFBSSxDQUFDMUksY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ3VKLFVBQVUsQ0FBQ2IsS0FBSyxDQUFDOztJQUV6RTtJQUNBLE1BQU1DLGVBQWUsR0FBR0MscUJBQVksQ0FBQ1ksb0JBQW9CLENBQUNkLEtBQUssQ0FBQzs7SUFFaEU7SUFDQSxPQUFPLElBQUksQ0FBQ2xLLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFJOztRQUVyQztRQUNBLElBQUksQ0FBQ0wsTUFBTSxDQUFDaUwsV0FBVyxDQUFDLElBQUksQ0FBQ25QLFVBQVUsRUFBRTJFLElBQUksQ0FBQ0MsU0FBUyxDQUFDeUosZUFBZSxDQUFDVSxVQUFVLENBQUMsQ0FBQyxDQUFDTixRQUFRLENBQUMsQ0FBQyxDQUFDNUosTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM2SixhQUFhLEtBQUs7O1VBRTVIO1VBQ0EsSUFBSUEsYUFBYSxDQUFDcEcsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRTtZQUNuQy9ELE1BQU0sQ0FBQyxJQUFJbkQsb0JBQVcsQ0FBQ3NOLGFBQWEsQ0FBQyxDQUFDO1lBQ3RDO1VBQ0Y7O1VBRUE7VUFDQSxJQUFJO1lBQ0ZwSyxPQUFPLENBQUMxRSxnQkFBZ0IsQ0FBQ3dQLGtCQUFrQixDQUFDZixlQUFlLEVBQUVLLGFBQWEsQ0FBQyxDQUFDO1VBQzlFLENBQUMsQ0FBQyxPQUFPbEcsR0FBRyxFQUFFO1lBQ1pqRSxNQUFNLENBQUNpRSxHQUFHLENBQUM7VUFDYjtRQUNGLENBQUMsQ0FBQztNQUNKLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU02RyxhQUFhQSxDQUFDQyxHQUFHLEdBQUcsS0FBSyxFQUFtQjtJQUNoRCxJQUFJLElBQUksQ0FBQzVKLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUMySixhQUFhLENBQUNDLEdBQUcsQ0FBQztJQUMxRSxPQUFPLElBQUksQ0FBQ3BMLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLO1FBQ3RDLElBQUksQ0FBQ0wsTUFBTSxDQUFDcUwsY0FBYyxDQUFDLElBQUksQ0FBQ3ZQLFVBQVUsRUFBRXNQLEdBQUcsRUFBRSxDQUFDRSxVQUFVLEtBQUtsTCxPQUFPLENBQUNrTCxVQUFVLENBQUMsQ0FBQztNQUN2RixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNQyxhQUFhQSxDQUFDRCxVQUFrQixFQUFtQjtJQUN2RCxJQUFJLElBQUksQ0FBQzlKLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUMrSixhQUFhLENBQUNELFVBQVUsQ0FBQztJQUNqRixPQUFPLElBQUksQ0FBQ3RMLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLO1FBQ3RDLElBQUksQ0FBQ0wsTUFBTSxDQUFDd0wsY0FBYyxDQUFDLElBQUksQ0FBQzFQLFVBQVUsRUFBRXdQLFVBQVUsRUFBRSxDQUFDRyxXQUFXLEtBQUtyTCxPQUFPLENBQUNxTCxXQUFXLENBQUMsQ0FBQztNQUNoRyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNQyxlQUFlQSxDQUFDTixHQUFHLEdBQUcsS0FBSyxFQUF1QztJQUN0RSxJQUFJLElBQUksQ0FBQzVKLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUNrSyxlQUFlLENBQUNOLEdBQUcsQ0FBQztJQUM1RSxPQUFPLElBQUksQ0FBQ3BMLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLO1FBQ3RDLElBQUksQ0FBQ0wsTUFBTSxDQUFDMkwsaUJBQWlCLENBQUMsSUFBSSxDQUFDN1AsVUFBVSxFQUFFc1AsR0FBRyxFQUFFLENBQUNRLFNBQVMsS0FBSztVQUNqRSxJQUFJQSxTQUFTLENBQUN4SCxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFL0QsTUFBTSxDQUFDLElBQUluRCxvQkFBVyxDQUFDME8sU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1VBQUEsS0FDaEU7WUFDSCxJQUFJQyxVQUFVLEdBQUdwTCxJQUFJLENBQUNTLEtBQUssQ0FBQ1osaUJBQVEsQ0FBQ29ILGdCQUFnQixDQUFDa0UsU0FBUyxDQUFDLENBQUM7WUFDakUsSUFBSSxDQUFDQyxVQUFVLENBQUNDLFNBQVMsRUFBRUQsVUFBVSxDQUFDQyxTQUFTLEdBQUcsRUFBRTtZQUNwRDFMLE9BQU8sQ0FBQyxJQUFJMkwsbUNBQTBCLENBQUNGLFVBQVUsQ0FBQyxDQUFDO1VBQ3JEO1FBQ0YsQ0FBQyxDQUFDO01BQ0osQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTUcsZUFBZUEsQ0FBQ0YsU0FBMkIsRUFBRUcsTUFBTSxHQUFHLENBQUMsRUFBdUM7SUFDbEcsSUFBSSxJQUFJLENBQUN6SyxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDd0ssZUFBZSxDQUFDRixTQUFTLEVBQUVHLE1BQU0sQ0FBQztJQUMxRixPQUFPLElBQUksQ0FBQ2pNLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLO1FBQ3RDLElBQUksQ0FBQ0wsTUFBTSxDQUFDa00saUJBQWlCLENBQUMsSUFBSSxDQUFDcFEsVUFBVSxFQUFFMkUsSUFBSSxDQUFDQyxTQUFTLENBQUMsRUFBQ3VMLE1BQU0sRUFBRUEsTUFBTSxFQUFFSCxTQUFTLEVBQUVBLFNBQVMsQ0FBQ0ssR0FBRyxDQUFDLENBQUFDLFFBQVEsS0FBSUEsUUFBUSxDQUFDekwsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUMsRUFBRSxDQUFDMEwsdUJBQXVCLEtBQUs7VUFDckssSUFBSUEsdUJBQXVCLENBQUNqSSxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFL0QsTUFBTSxDQUFDLElBQUluRCxvQkFBVyxDQUFDbVAsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLENBQUM7VUFBQSxLQUM1RmpNLE9BQU8sQ0FBQyxJQUFJa00sbUNBQTBCLENBQUM3TCxJQUFJLENBQUNTLEtBQUssQ0FBQ1osaUJBQVEsQ0FBQ29ILGdCQUFnQixDQUFDMkUsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUcsQ0FBQyxDQUFDO01BQ0osQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTUUsNkJBQTZCQSxDQUFBLEVBQThCO0lBQy9ELElBQUksSUFBSSxDQUFDL0ssY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQytLLDZCQUE2QixDQUFDLENBQUM7SUFDdkYsTUFBTSxJQUFJclAsb0JBQVcsQ0FBQyxpQkFBaUIsQ0FBQztFQUMxQzs7RUFFQSxNQUFNc1AsWUFBWUEsQ0FBQ0osUUFBZ0IsRUFBaUI7SUFDbEQsSUFBSSxJQUFJLENBQUM1SyxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDZ0wsWUFBWSxDQUFDSixRQUFRLENBQUM7SUFDOUUsSUFBSSxDQUFDQSxRQUFRLEVBQUUsTUFBTSxJQUFJbFAsb0JBQVcsQ0FBQyxrQ0FBa0MsQ0FBQztJQUN4RSxPQUFPLElBQUksQ0FBQzhDLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFPLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLO1FBQzVDLElBQUksQ0FBQ0wsTUFBTSxDQUFDeU0sYUFBYSxDQUFDLElBQUksQ0FBQzNRLFVBQVUsRUFBRXNRLFFBQVEsRUFBRSxNQUFNaE0sT0FBTyxDQUFDLENBQUMsQ0FBQztNQUN2RSxDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNc00sVUFBVUEsQ0FBQ04sUUFBZ0IsRUFBaUI7SUFDaEQsSUFBSSxJQUFJLENBQUM1SyxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDa0wsVUFBVSxDQUFDTixRQUFRLENBQUM7SUFDNUUsSUFBSSxDQUFDQSxRQUFRLEVBQUUsTUFBTSxJQUFJbFAsb0JBQVcsQ0FBQyxnQ0FBZ0MsQ0FBQztJQUN0RSxPQUFPLElBQUksQ0FBQzhDLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFPLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLO1FBQzVDLElBQUksQ0FBQ0wsTUFBTSxDQUFDMk0sV0FBVyxDQUFDLElBQUksQ0FBQzdRLFVBQVUsRUFBRXNRLFFBQVEsRUFBRSxNQUFNaE0sT0FBTyxDQUFDLENBQUMsQ0FBQztNQUNyRSxDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNd00sY0FBY0EsQ0FBQ1IsUUFBZ0IsRUFBb0I7SUFDdkQsSUFBSSxJQUFJLENBQUM1SyxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDb0wsY0FBYyxDQUFDUixRQUFRLENBQUM7SUFDaEYsSUFBSSxDQUFDQSxRQUFRLEVBQUUsTUFBTSxJQUFJbFAsb0JBQVcsQ0FBQywyQ0FBMkMsQ0FBQztJQUNqRixPQUFPLElBQUksQ0FBQzhDLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLO1FBQ3RDLElBQUksQ0FBQ0wsTUFBTSxDQUFDNk0sZ0JBQWdCLENBQUMsSUFBSSxDQUFDL1EsVUFBVSxFQUFFc1EsUUFBUSxFQUFFLENBQUNsSSxNQUFNLEtBQUs5RCxPQUFPLENBQUM4RCxNQUFNLENBQUMsQ0FBQztNQUN0RixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNNEkscUJBQXFCQSxDQUFBLEVBQThCO0lBQ3ZELElBQUksSUFBSSxDQUFDdEwsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ3NMLHFCQUFxQixDQUFDLENBQUM7SUFDL0UsT0FBTyxJQUFJLENBQUM5TSxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLE9BQU8sSUFBSXRCLE9BQU8sQ0FBQyxDQUFDQyxPQUFPLEVBQUVDLE1BQU0sS0FBSztRQUN0QyxJQUFJLENBQUNMLE1BQU0sQ0FBQytNLHdCQUF3QixDQUFDLElBQUksQ0FBQ2pSLFVBQVUsRUFBRSxDQUFDb0ksTUFBTSxLQUFLOUQsT0FBTyxDQUFDOEQsTUFBTSxDQUFDLENBQUM7TUFDcEYsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTThJLFNBQVNBLENBQUMxUCxNQUErQixFQUE2QjtJQUMxRSxJQUFJLElBQUksQ0FBQ2tFLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUN3TCxTQUFTLENBQUMxUCxNQUFNLENBQUM7O0lBRXpFO0lBQ0EsTUFBTTJQLGdCQUFnQixHQUFHN0MscUJBQVksQ0FBQzhDLHdCQUF3QixDQUFDNVAsTUFBTSxDQUFDO0lBQ3RFLElBQUkyUCxnQkFBZ0IsQ0FBQ0UsV0FBVyxDQUFDLENBQUMsS0FBSzVRLFNBQVMsRUFBRTBRLGdCQUFnQixDQUFDRyxXQUFXLENBQUMsSUFBSSxDQUFDOztJQUVwRjtJQUNBLE9BQU8sSUFBSSxDQUFDcE4sTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUl0QixPQUFPLENBQUMsQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7O1FBRXRDO1FBQ0EsSUFBSSxDQUFDTCxNQUFNLENBQUNxTixVQUFVLENBQUMsSUFBSSxDQUFDdlIsVUFBVSxFQUFFMkUsSUFBSSxDQUFDQyxTQUFTLENBQUN1TSxnQkFBZ0IsQ0FBQ3RNLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDMk0sWUFBWSxLQUFLO1VBQ25HLElBQUlBLFlBQVksQ0FBQ2xKLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUUvRCxNQUFNLENBQUMsSUFBSW5ELG9CQUFXLENBQUNvUSxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7VUFBQSxLQUN0RWxOLE9BQU8sQ0FBQyxJQUFJbU4sb0JBQVcsQ0FBQzlNLElBQUksQ0FBQ1MsS0FBSyxDQUFDWixpQkFBUSxDQUFDb0gsZ0JBQWdCLENBQUM0RixZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUNyRCxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQzdGLENBQUMsQ0FBQztNQUNKLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU11RCxXQUFXQSxDQUFDbFEsTUFBK0IsRUFBMkI7SUFDMUUsSUFBSSxJQUFJLENBQUNrRSxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDZ00sV0FBVyxDQUFDbFEsTUFBTSxDQUFDOztJQUUzRTtJQUNBLE1BQU0yUCxnQkFBZ0IsR0FBRzdDLHFCQUFZLENBQUNxRCwwQkFBMEIsQ0FBQ25RLE1BQU0sQ0FBQzs7SUFFeEU7SUFDQSxPQUFPLElBQUksQ0FBQzBDLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLOztRQUV0QztRQUNBLElBQUksQ0FBQ0wsTUFBTSxDQUFDME4sWUFBWSxDQUFDLElBQUksQ0FBQzVSLFVBQVUsRUFBRTJFLElBQUksQ0FBQ0MsU0FBUyxDQUFDdU0sZ0JBQWdCLENBQUN0TSxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQzJNLFlBQVksS0FBSztVQUNyRyxJQUFJQSxZQUFZLENBQUNsSixNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFL0QsTUFBTSxDQUFDLElBQUluRCxvQkFBVyxDQUFDb1EsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1VBQUEsS0FDdEVsTixPQUFPLENBQUMsSUFBSW1OLG9CQUFXLENBQUM5TSxJQUFJLENBQUNTLEtBQUssQ0FBQ1osaUJBQVEsQ0FBQ29ILGdCQUFnQixDQUFDNEYsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDckQsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoRyxDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNMEQsYUFBYUEsQ0FBQ3JRLE1BQStCLEVBQTZCO0lBQzlFLElBQUksSUFBSSxDQUFDa0UsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ21NLGFBQWEsQ0FBQ3JRLE1BQU0sQ0FBQzs7SUFFN0U7SUFDQSxNQUFNMlAsZ0JBQWdCLEdBQUc3QyxxQkFBWSxDQUFDd0QsNEJBQTRCLENBQUN0USxNQUFNLENBQUM7O0lBRTFFO0lBQ0EsT0FBTyxJQUFJLENBQUMwQyxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLE9BQU8sSUFBSXRCLE9BQU8sQ0FBQyxDQUFDQyxPQUFPLEVBQUVDLE1BQU0sS0FBSzs7UUFFdEM7UUFDQSxJQUFJLENBQUNMLE1BQU0sQ0FBQzZOLGNBQWMsQ0FBQyxJQUFJLENBQUMvUixVQUFVLEVBQUUyRSxJQUFJLENBQUNDLFNBQVMsQ0FBQ3VNLGdCQUFnQixDQUFDdE0sTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUNtTixVQUFVLEtBQUs7VUFDckcsSUFBSUEsVUFBVSxDQUFDMUosTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRS9ELE1BQU0sQ0FBQyxJQUFJbkQsb0JBQVcsQ0FBQzRRLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztVQUFBLEtBQ2xFO1lBQ0gsSUFBSUMsTUFBTSxHQUFHLEVBQUU7WUFDZixLQUFLLElBQUlDLFNBQVMsSUFBSXZOLElBQUksQ0FBQ1MsS0FBSyxDQUFDWixpQkFBUSxDQUFDb0gsZ0JBQWdCLENBQUNvRyxVQUFVLENBQUMsQ0FBQyxDQUFDQyxNQUFNLEVBQUVBLE1BQU0sQ0FBQ3RGLElBQUksQ0FBQyxJQUFJOEUsb0JBQVcsQ0FBQ1MsU0FBUyxDQUFDLENBQUM7WUFDdkgsSUFBSUMsR0FBRyxHQUFHLEVBQUU7WUFDWixLQUFLLElBQUlDLEtBQUssSUFBSUgsTUFBTSxFQUFFLEtBQUssSUFBSUksRUFBRSxJQUFJRCxLQUFLLENBQUNqRSxNQUFNLENBQUMsQ0FBQyxFQUFFZ0UsR0FBRyxDQUFDeEYsSUFBSSxDQUFDMEYsRUFBRSxDQUFDO1lBQ3JFL04sT0FBTyxDQUFDNk4sR0FBRyxDQUFDO1VBQ2Q7UUFDRixDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNRyxTQUFTQSxDQUFDQyxLQUFlLEVBQTZCO0lBQzFELElBQUksSUFBSSxDQUFDN00sY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQzRNLFNBQVMsQ0FBQ0MsS0FBSyxDQUFDO0lBQ3hFLE9BQU8sSUFBSSxDQUFDck8sTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUl0QixPQUFPLENBQUMsQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7O1FBRXRDO1FBQ0EsSUFBSSxDQUFDTCxNQUFNLENBQUNzTyxVQUFVLENBQUMsSUFBSSxDQUFDeFMsVUFBVSxFQUFFdVMsS0FBSyxFQUFFLENBQUNmLFlBQVksS0FBSztVQUMvRCxJQUFJQSxZQUFZLENBQUNsSixNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFL0QsTUFBTSxDQUFDLElBQUluRCxvQkFBVyxDQUFDb1EsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1VBQUEsS0FDdEU7WUFDSCxJQUFJWSxLQUFLLEdBQUcsSUFBSVgsb0JBQVcsQ0FBQzlNLElBQUksQ0FBQ1MsS0FBSyxDQUFDWixpQkFBUSxDQUFDb0gsZ0JBQWdCLENBQUM0RixZQUFZLENBQUMsQ0FBQyxDQUFDO1lBQ2hGLElBQUlZLEtBQUssQ0FBQ2pFLE1BQU0sQ0FBQyxDQUFDLEtBQUsxTixTQUFTLEVBQUUyUixLQUFLLENBQUNLLE1BQU0sQ0FBQyxFQUFFLENBQUM7WUFDbERuTyxPQUFPLENBQUM4TixLQUFLLENBQUNqRSxNQUFNLENBQUMsQ0FBQyxDQUFDO1VBQ3pCO1FBQ0YsQ0FBQyxDQUFDO01BQ0osQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTXVFLFFBQVFBLENBQUNDLGNBQTJDLEVBQXFCO0lBQzdFLElBQUksSUFBSSxDQUFDak4sY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ2dOLFFBQVEsQ0FBQ0MsY0FBYyxDQUFDO0lBQ2hGLElBQUF4UixlQUFNLEVBQUN5UixLQUFLLENBQUNDLE9BQU8sQ0FBQ0YsY0FBYyxDQUFDLEVBQUUseURBQXlELENBQUM7SUFDaEcsSUFBSUcsV0FBVyxHQUFHLEVBQUU7SUFDcEIsS0FBSyxJQUFJQyxZQUFZLElBQUlKLGNBQWMsRUFBRUcsV0FBVyxDQUFDbkcsSUFBSSxDQUFDb0csWUFBWSxZQUFZQyx1QkFBYyxHQUFHRCxZQUFZLENBQUNFLFdBQVcsQ0FBQyxDQUFDLEdBQUdGLFlBQVksQ0FBQztJQUM3SSxPQUFPLElBQUksQ0FBQzdPLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLO1FBQ3RDLElBQUksQ0FBQ0wsTUFBTSxDQUFDZ1AsU0FBUyxDQUFDLElBQUksQ0FBQ2xULFVBQVUsRUFBRTJFLElBQUksQ0FBQ0MsU0FBUyxDQUFDLEVBQUNrTyxXQUFXLEVBQUVBLFdBQVcsRUFBQyxDQUFDLEVBQUUsQ0FBQ0ssWUFBWSxLQUFLO1VBQ25HLElBQUlBLFlBQVksQ0FBQzdLLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUUvRCxNQUFNLENBQUMsSUFBSW5ELG9CQUFXLENBQUMrUixZQUFZLENBQUMsQ0FBQyxDQUFDO1VBQ3JFN08sT0FBTyxDQUFDSyxJQUFJLENBQUNTLEtBQUssQ0FBQytOLFlBQVksQ0FBQyxDQUFDckksUUFBUSxDQUFDO1FBQ2pELENBQUMsQ0FBQztNQUNKLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1zSSxhQUFhQSxDQUFDaEIsS0FBa0IsRUFBd0I7SUFDNUQsSUFBSSxJQUFJLENBQUMxTSxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDME4sYUFBYSxDQUFDaEIsS0FBSyxDQUFDO0lBQzVFLE9BQU8sSUFBSSxDQUFDbE8sTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QnlNLEtBQUssR0FBRyxJQUFJWCxvQkFBVyxDQUFDLEVBQUM0QixhQUFhLEVBQUVqQixLQUFLLENBQUNrQixnQkFBZ0IsQ0FBQyxDQUFDLEVBQUVDLFdBQVcsRUFBRW5CLEtBQUssQ0FBQ29CLGNBQWMsQ0FBQyxDQUFDLEVBQUVDLGFBQWEsRUFBRXJCLEtBQUssQ0FBQ3NCLGdCQUFnQixDQUFDLENBQUMsRUFBQyxDQUFDO01BQ2hKLElBQUksQ0FBRSxPQUFPLElBQUlqQyxvQkFBVyxDQUFDOU0sSUFBSSxDQUFDUyxLQUFLLENBQUNaLGlCQUFRLENBQUNvSCxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMxSCxNQUFNLENBQUN5UCxlQUFlLENBQUMsSUFBSSxDQUFDM1QsVUFBVSxFQUFFMkUsSUFBSSxDQUFDQyxTQUFTLENBQUN3TixLQUFLLENBQUN2TixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBRTtNQUNuSixPQUFPMkQsR0FBRyxFQUFFLENBQUUsTUFBTSxJQUFJcEgsb0JBQVcsQ0FBQyxJQUFJLENBQUM4QyxNQUFNLENBQUMwUCxxQkFBcUIsQ0FBQ3BMLEdBQUcsQ0FBQyxDQUFDLENBQUU7SUFDL0UsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTXFMLE9BQU9BLENBQUNSLGFBQXFCLEVBQXdCO0lBQ3pELElBQUksSUFBSSxDQUFDM04sY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ21PLE9BQU8sQ0FBQ1IsYUFBYSxDQUFDO0lBQzlFLE9BQU8sSUFBSSxDQUFDblAsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixJQUFJLENBQUUsT0FBTyxJQUFJOEwsb0JBQVcsQ0FBQzlNLElBQUksQ0FBQ1MsS0FBSyxDQUFDWixpQkFBUSxDQUFDb0gsZ0JBQWdCLENBQUMsSUFBSSxDQUFDMUgsTUFBTSxDQUFDNFAsUUFBUSxDQUFDLElBQUksQ0FBQzlULFVBQVUsRUFBRXFULGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFFO01BQzNILE9BQU83SyxHQUFHLEVBQUUsQ0FBRSxNQUFNLElBQUlwSCxvQkFBVyxDQUFDLElBQUksQ0FBQzhDLE1BQU0sQ0FBQzBQLHFCQUFxQixDQUFDcEwsR0FBRyxDQUFDLENBQUMsQ0FBRTtJQUMvRSxDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNdUwsU0FBU0EsQ0FBQ1IsV0FBbUIsRUFBcUI7SUFDdEQsSUFBSSxJQUFJLENBQUM3TixjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDcU8sU0FBUyxDQUFDUixXQUFXLENBQUM7SUFDOUUsT0FBTyxJQUFJLENBQUNyUCxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLE9BQU8sSUFBSXRCLE9BQU8sQ0FBQyxDQUFDQyxPQUFPLEVBQUVDLE1BQU0sS0FBSztRQUN0QyxJQUFJLENBQUNMLE1BQU0sQ0FBQzhQLFVBQVUsQ0FBQyxJQUFJLENBQUNoVSxVQUFVLEVBQUV1VCxXQUFXLEVBQUUsQ0FBQzFOLElBQUksS0FBSztVQUM3RCxJQUFJQSxJQUFJLENBQUN5QyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFL0QsTUFBTSxDQUFDLElBQUluRCxvQkFBVyxDQUFDeUUsSUFBSSxDQUFDLENBQUMsQ0FBQztVQUNyRHZCLE9BQU8sQ0FBQ0ssSUFBSSxDQUFDUyxLQUFLLENBQUNTLElBQUksQ0FBQyxDQUFDaUYsUUFBUSxDQUFDO1FBQ3pDLENBQUMsQ0FBQztNQUNKLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1tSixXQUFXQSxDQUFDeEwsT0FBZSxFQUFFeUwsYUFBYSxHQUFHQyxtQ0FBMEIsQ0FBQ0MsbUJBQW1CLEVBQUUvSSxVQUFVLEdBQUcsQ0FBQyxFQUFFQyxhQUFhLEdBQUcsQ0FBQyxFQUFtQjtJQUNySixJQUFJLElBQUksQ0FBQzVGLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUN1TyxXQUFXLENBQUN4TCxPQUFPLEVBQUV5TCxhQUFhLEVBQUU3SSxVQUFVLEVBQUVDLGFBQWEsQ0FBQzs7SUFFdEg7SUFDQTRJLGFBQWEsR0FBR0EsYUFBYSxJQUFJQyxtQ0FBMEIsQ0FBQ0MsbUJBQW1CO0lBQy9FL0ksVUFBVSxHQUFHQSxVQUFVLElBQUksQ0FBQztJQUM1QkMsYUFBYSxHQUFHQSxhQUFhLElBQUksQ0FBQzs7SUFFbEM7SUFDQSxPQUFPLElBQUksQ0FBQ3BILE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsSUFBSSxDQUFFLE9BQU8sSUFBSSxDQUFDekIsTUFBTSxDQUFDbVEsWUFBWSxDQUFDLElBQUksQ0FBQ3JVLFVBQVUsRUFBRXlJLE9BQU8sRUFBRXlMLGFBQWEsS0FBS0MsbUNBQTBCLENBQUNDLG1CQUFtQixHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUvSSxVQUFVLEVBQUVDLGFBQWEsQ0FBQyxDQUFFO01BQ3RLLE9BQU85QyxHQUFHLEVBQUUsQ0FBRSxNQUFNLElBQUlwSCxvQkFBVyxDQUFDLElBQUksQ0FBQzhDLE1BQU0sQ0FBQzBQLHFCQUFxQixDQUFDcEwsR0FBRyxDQUFDLENBQUMsQ0FBRTtJQUMvRSxDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNOEwsYUFBYUEsQ0FBQzdMLE9BQWUsRUFBRThMLE9BQWUsRUFBRUMsU0FBaUIsRUFBeUM7SUFDOUcsSUFBSSxJQUFJLENBQUM5TyxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDNE8sYUFBYSxDQUFDN0wsT0FBTyxFQUFFOEwsT0FBTyxFQUFFQyxTQUFTLENBQUM7SUFDbEcsT0FBTyxJQUFJLENBQUN0USxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLElBQUl5QyxNQUFNO01BQ1YsSUFBSTtRQUNGQSxNQUFNLEdBQUd6RCxJQUFJLENBQUNTLEtBQUssQ0FBQyxJQUFJLENBQUNsQixNQUFNLENBQUN1USxjQUFjLENBQUMsSUFBSSxDQUFDelUsVUFBVSxFQUFFeUksT0FBTyxFQUFFOEwsT0FBTyxFQUFFQyxTQUFTLENBQUMsQ0FBQztNQUMvRixDQUFDLENBQUMsT0FBT2hNLEdBQUcsRUFBRTtRQUNaSixNQUFNLEdBQUcsRUFBQ3NNLE1BQU0sRUFBRSxLQUFLLEVBQUM7TUFDMUI7TUFDQSxPQUFPLElBQUlDLHFDQUE0QixDQUFDdk0sTUFBTSxDQUFDc00sTUFBTTtNQUNuRCxFQUFDQSxNQUFNLEVBQUV0TSxNQUFNLENBQUNzTSxNQUFNLEVBQUVFLEtBQUssRUFBRXhNLE1BQU0sQ0FBQ3dNLEtBQUssRUFBRVYsYUFBYSxFQUFFOUwsTUFBTSxDQUFDOEwsYUFBYSxLQUFLLE9BQU8sR0FBR0MsbUNBQTBCLENBQUNDLG1CQUFtQixHQUFHRCxtQ0FBMEIsQ0FBQ1Usa0JBQWtCLEVBQUVDLE9BQU8sRUFBRTFNLE1BQU0sQ0FBQzBNLE9BQU8sRUFBQztNQUN2TixFQUFDSixNQUFNLEVBQUUsS0FBSztNQUNoQixDQUFDO0lBQ0gsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTUssUUFBUUEsQ0FBQ0MsTUFBYyxFQUFtQjtJQUM5QyxJQUFJLElBQUksQ0FBQ3RQLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUNxUCxRQUFRLENBQUNDLE1BQU0sQ0FBQztJQUN4RSxPQUFPLElBQUksQ0FBQzlRLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsSUFBSSxDQUFFLE9BQU8sSUFBSSxDQUFDekIsTUFBTSxDQUFDK1EsVUFBVSxDQUFDLElBQUksQ0FBQ2pWLFVBQVUsRUFBRWdWLE1BQU0sQ0FBQyxDQUFFO01BQzlELE9BQU94TSxHQUFHLEVBQUUsQ0FBRSxNQUFNLElBQUlwSCxvQkFBVyxDQUFDLElBQUksQ0FBQzhDLE1BQU0sQ0FBQzBQLHFCQUFxQixDQUFDcEwsR0FBRyxDQUFDLENBQUMsQ0FBRTtJQUMvRSxDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNME0sVUFBVUEsQ0FBQ0YsTUFBYyxFQUFFRyxLQUFhLEVBQUVaLE9BQWUsRUFBMEI7SUFDdkYsSUFBSSxJQUFJLENBQUM3TyxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDd1AsVUFBVSxDQUFDRixNQUFNLEVBQUVHLEtBQUssRUFBRVosT0FBTyxDQUFDO0lBQzFGLE9BQU8sSUFBSSxDQUFDclEsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUl0QixPQUFPLENBQUMsQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7UUFDdEMsSUFBSSxDQUFDTCxNQUFNLENBQUNrUixZQUFZLENBQUMsSUFBSSxDQUFDcFYsVUFBVSxFQUFFZ1YsTUFBTSxFQUFFRyxLQUFLLEVBQUVaLE9BQU8sRUFBRSxDQUFDYyxXQUFXLEtBQUs7VUFDakYsSUFBSUEsV0FBVyxDQUFDL00sTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRS9ELE1BQU0sQ0FBQyxJQUFJbkQsb0JBQVcsQ0FBQ2lVLFdBQVcsQ0FBQyxDQUFDLENBQUM7VUFDbkUvUSxPQUFPLENBQUMsSUFBSWdSLHNCQUFhLENBQUMzUSxJQUFJLENBQUNTLEtBQUssQ0FBQ1osaUJBQVEsQ0FBQ29ILGdCQUFnQixDQUFDeUosV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JGLENBQUMsQ0FBQztNQUNKLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1FLFVBQVVBLENBQUNQLE1BQWMsRUFBRVQsT0FBZSxFQUFFOUwsT0FBZ0IsRUFBbUI7SUFDbkYsSUFBSSxJQUFJLENBQUMvQyxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDNlAsVUFBVSxDQUFDUCxNQUFNLEVBQUVULE9BQU8sRUFBRTlMLE9BQU8sQ0FBQztJQUM1RixPQUFPLElBQUksQ0FBQ3ZFLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLO1FBQ3RDLElBQUksQ0FBQ0wsTUFBTSxDQUFDc1IsWUFBWSxDQUFDLElBQUksQ0FBQ3hWLFVBQVUsRUFBRWdWLE1BQU0sSUFBSSxFQUFFLEVBQUVULE9BQU8sSUFBSSxFQUFFLEVBQUU5TCxPQUFPLElBQUksRUFBRSxFQUFFLENBQUMrTCxTQUFTLEtBQUs7VUFDbkcsSUFBSWlCLFFBQVEsR0FBRyxTQUFTO1VBQ3hCLElBQUlqQixTQUFTLENBQUNrQixPQUFPLENBQUNELFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRWxSLE1BQU0sQ0FBQyxJQUFJbkQsb0JBQVcsQ0FBQ29ULFNBQVMsQ0FBQ21CLFNBQVMsQ0FBQ0YsUUFBUSxDQUFDRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7VUFDaEd0UixPQUFPLENBQUNrUSxTQUFTLENBQUM7UUFDekIsQ0FBQyxDQUFDO01BQ0osQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTXFCLFlBQVlBLENBQUNiLE1BQWMsRUFBRVQsT0FBZSxFQUFFOUwsT0FBMkIsRUFBRStMLFNBQWlCLEVBQTBCO0lBQzFILElBQUksSUFBSSxDQUFDOU8sY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ21RLFlBQVksQ0FBQ2IsTUFBTSxFQUFFVCxPQUFPLEVBQUU5TCxPQUFPLEVBQUUrTCxTQUFTLENBQUM7SUFDekcsT0FBTyxJQUFJLENBQUN0USxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLE9BQU8sSUFBSXRCLE9BQU8sQ0FBQyxDQUFDQyxPQUFPLEVBQUVDLE1BQU0sS0FBSztRQUN0QyxJQUFJLENBQUNMLE1BQU0sQ0FBQzRSLGNBQWMsQ0FBQyxJQUFJLENBQUM5VixVQUFVLEVBQUVnVixNQUFNLElBQUksRUFBRSxFQUFFVCxPQUFPLElBQUksRUFBRSxFQUFFOUwsT0FBTyxJQUFJLEVBQUUsRUFBRStMLFNBQVMsSUFBSSxFQUFFLEVBQUUsQ0FBQ2EsV0FBVyxLQUFLO1VBQ3hILElBQUlBLFdBQVcsQ0FBQy9NLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLEVBQUUvRCxNQUFNLENBQUMsSUFBSW5ELG9CQUFXLENBQUNpVSxXQUFXLENBQUMsQ0FBQyxDQUFDO1VBQ25FL1EsT0FBTyxDQUFDLElBQUlnUixzQkFBYSxDQUFDM1EsSUFBSSxDQUFDUyxLQUFLLENBQUNaLGlCQUFRLENBQUNvSCxnQkFBZ0IsQ0FBQ3lKLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyRixDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNVSxhQUFhQSxDQUFDZixNQUFjLEVBQUV2TSxPQUFnQixFQUFtQjtJQUNyRSxJQUFJLElBQUksQ0FBQy9DLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUNxUSxhQUFhLENBQUNmLE1BQU0sRUFBRXZNLE9BQU8sQ0FBQztJQUN0RixPQUFPLElBQUksQ0FBQ3ZFLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLO1FBQ3RDLElBQUksQ0FBQ0wsTUFBTSxDQUFDOFIsZUFBZSxDQUFDLElBQUksQ0FBQ2hXLFVBQVUsRUFBRWdWLE1BQU0sSUFBSSxFQUFFLEVBQUV2TSxPQUFPLElBQUksRUFBRSxFQUFFLENBQUMrTCxTQUFTLEtBQUs7VUFDdkYsSUFBSWlCLFFBQVEsR0FBRyxTQUFTO1VBQ3hCLElBQUlqQixTQUFTLENBQUNrQixPQUFPLENBQUNELFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRWxSLE1BQU0sQ0FBQyxJQUFJbkQsb0JBQVcsQ0FBQ29ULFNBQVMsQ0FBQ21CLFNBQVMsQ0FBQ0YsUUFBUSxDQUFDRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7VUFDaEd0UixPQUFPLENBQUNrUSxTQUFTLENBQUM7UUFDekIsQ0FBQyxDQUFDO01BQ0osQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTXlCLGVBQWVBLENBQUNqQixNQUFjLEVBQUV2TSxPQUEyQixFQUFFK0wsU0FBaUIsRUFBb0I7SUFDdEcsSUFBSSxJQUFJLENBQUM5TyxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDdVEsZUFBZSxDQUFDakIsTUFBTSxFQUFFdk0sT0FBTyxFQUFFK0wsU0FBUyxDQUFDO0lBQ25HLE9BQU8sSUFBSSxDQUFDdFEsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUl0QixPQUFPLENBQUMsQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7UUFDdEMsSUFBSSxDQUFDTCxNQUFNLENBQUNnUyxpQkFBaUIsQ0FBQyxJQUFJLENBQUNsVyxVQUFVLEVBQUVnVixNQUFNLElBQUksRUFBRSxFQUFFdk0sT0FBTyxJQUFJLEVBQUUsRUFBRStMLFNBQVMsSUFBSSxFQUFFLEVBQUUsQ0FBQzNPLElBQUksS0FBSztVQUNyRyxPQUFPQSxJQUFJLEtBQUssUUFBUSxHQUFHdEIsTUFBTSxDQUFDLElBQUluRCxvQkFBVyxDQUFDeUUsSUFBSSxDQUFDLENBQUMsR0FBR3ZCLE9BQU8sQ0FBQ3VCLElBQUksQ0FBQztRQUMxRSxDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNc1EscUJBQXFCQSxDQUFDMU4sT0FBZ0IsRUFBbUI7SUFDN0QsSUFBSSxJQUFJLENBQUMvQyxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDeVEscUJBQXFCLENBQUMxTixPQUFPLENBQUM7SUFDdEYsT0FBTyxJQUFJLENBQUN2RSxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLE9BQU8sSUFBSXRCLE9BQU8sQ0FBQyxDQUFDQyxPQUFPLEVBQUVDLE1BQU0sS0FBSztRQUN0QyxJQUFJLENBQUNMLE1BQU0sQ0FBQ2tTLHdCQUF3QixDQUFDLElBQUksQ0FBQ3BXLFVBQVUsRUFBRXlJLE9BQU8sRUFBRSxDQUFDK0wsU0FBUyxLQUFLO1VBQzVFLElBQUlpQixRQUFRLEdBQUcsU0FBUztVQUN4QixJQUFJakIsU0FBUyxDQUFDa0IsT0FBTyxDQUFDRCxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUVsUixNQUFNLENBQUMsSUFBSW5ELG9CQUFXLENBQUNvVCxTQUFTLENBQUNtQixTQUFTLENBQUNGLFFBQVEsQ0FBQ0csTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1VBQ3BHdFIsT0FBTyxDQUFDa1EsU0FBUyxDQUFDO1FBQ3pCLENBQUMsQ0FBQztNQUNKLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU02QixzQkFBc0JBLENBQUNoTCxVQUFrQixFQUFFaUwsTUFBYyxFQUFFN04sT0FBZ0IsRUFBbUI7SUFDbEcsSUFBSSxJQUFJLENBQUMvQyxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDMlEsc0JBQXNCLENBQUNoTCxVQUFVLEVBQUVpTCxNQUFNLEVBQUU3TixPQUFPLENBQUM7SUFDM0csT0FBTyxJQUFJLENBQUN2RSxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLE9BQU8sSUFBSXRCLE9BQU8sQ0FBQyxDQUFDQyxPQUFPLEVBQUVDLE1BQU0sS0FBSztRQUN0QyxJQUFJLENBQUNMLE1BQU0sQ0FBQ3FTLHlCQUF5QixDQUFDLElBQUksQ0FBQ3ZXLFVBQVUsRUFBRXFMLFVBQVUsRUFBRWlMLE1BQU0sQ0FBQ0UsUUFBUSxDQUFDLENBQUMsRUFBRS9OLE9BQU8sRUFBRSxDQUFDK0wsU0FBUyxLQUFLO1VBQzVHLElBQUlpQixRQUFRLEdBQUcsU0FBUztVQUN4QixJQUFJakIsU0FBUyxDQUFDa0IsT0FBTyxDQUFDRCxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUVsUixNQUFNLENBQUMsSUFBSW5ELG9CQUFXLENBQUNvVCxTQUFTLENBQUNtQixTQUFTLENBQUNGLFFBQVEsQ0FBQ0csTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1VBQ3BHdFIsT0FBTyxDQUFDa1EsU0FBUyxDQUFDO1FBQ3pCLENBQUMsQ0FBQztNQUNKLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1pQyxpQkFBaUJBLENBQUNsQyxPQUFlLEVBQUU5TCxPQUEyQixFQUFFK0wsU0FBaUIsRUFBK0I7SUFDcEgsSUFBSSxJQUFJLENBQUM5TyxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDK1EsaUJBQWlCLENBQUNsQyxPQUFPLEVBQUU5TCxPQUFPLEVBQUUrTCxTQUFTLENBQUM7SUFDdEcsT0FBTyxJQUFJLENBQUN0USxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLE9BQU8sSUFBSXRCLE9BQU8sQ0FBQyxDQUFDQyxPQUFPLEVBQUVDLE1BQU0sS0FBSztRQUN0QyxJQUFJLENBQUNMLE1BQU0sQ0FBQ3dTLG1CQUFtQixDQUFDLElBQUksQ0FBQzFXLFVBQVUsRUFBRXVVLE9BQU8sRUFBRTlMLE9BQU8sRUFBRStMLFNBQVMsRUFBRSxDQUFDYSxXQUFXLEtBQUs7VUFDN0YsSUFBSUEsV0FBVyxDQUFDL00sTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRS9ELE1BQU0sQ0FBQyxJQUFJbkQsb0JBQVcsQ0FBQ2lVLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7VUFDdkUvUSxPQUFPLENBQUMsSUFBSXFTLDJCQUFrQixDQUFDaFMsSUFBSSxDQUFDUyxLQUFLLENBQUNaLGlCQUFRLENBQUNvSCxnQkFBZ0IsQ0FBQ3lKLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxRixDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNdUIsVUFBVUEsQ0FBQzlMLFFBQWtCLEVBQXFCO0lBQ3RELElBQUksSUFBSSxDQUFDcEYsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ2tSLFVBQVUsQ0FBQzlMLFFBQVEsQ0FBQztJQUM1RSxPQUFPLElBQUksQ0FBQzVHLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsSUFBSSxDQUFFLE9BQU9oQixJQUFJLENBQUNTLEtBQUssQ0FBQyxJQUFJLENBQUNsQixNQUFNLENBQUMyUyxZQUFZLENBQUMsSUFBSSxDQUFDN1csVUFBVSxFQUFFMkUsSUFBSSxDQUFDQyxTQUFTLENBQUMsRUFBQ2tHLFFBQVEsRUFBRUEsUUFBUSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUNnTSxPQUFPLENBQUU7TUFDbEgsT0FBT3RPLEdBQUcsRUFBRSxDQUFFLE1BQU0sSUFBSXBILG9CQUFXLENBQUMsSUFBSSxDQUFDOEMsTUFBTSxDQUFDMFAscUJBQXFCLENBQUNwTCxHQUFHLENBQUMsQ0FBQyxDQUFFO0lBQy9FLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU11TyxVQUFVQSxDQUFDak0sUUFBa0IsRUFBRWtNLEtBQWUsRUFBaUI7SUFDbkUsSUFBSSxJQUFJLENBQUN0UixjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDcVIsVUFBVSxDQUFDak0sUUFBUSxFQUFFa00sS0FBSyxDQUFDO0lBQ25GLE9BQU8sSUFBSSxDQUFDOVMsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixJQUFJLENBQUUsSUFBSSxDQUFDekIsTUFBTSxDQUFDK1MsWUFBWSxDQUFDLElBQUksQ0FBQ2pYLFVBQVUsRUFBRTJFLElBQUksQ0FBQ0MsU0FBUyxDQUFDLEVBQUNrRyxRQUFRLEVBQUVBLFFBQVEsRUFBRWdNLE9BQU8sRUFBRUUsS0FBSyxFQUFDLENBQUMsQ0FBQyxDQUFFO01BQ3ZHLE9BQU94TyxHQUFHLEVBQUUsQ0FBRSxNQUFNLElBQUlwSCxvQkFBVyxDQUFDLElBQUksQ0FBQzhDLE1BQU0sQ0FBQzBQLHFCQUFxQixDQUFDcEwsR0FBRyxDQUFDLENBQUMsQ0FBRTtJQUMvRSxDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNME8scUJBQXFCQSxDQUFDQyxZQUF1QixFQUFxQztJQUN0RixJQUFJLElBQUksQ0FBQ3pSLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUN3UixxQkFBcUIsQ0FBQ0MsWUFBWSxDQUFDO0lBQzNGLElBQUksQ0FBQ0EsWUFBWSxFQUFFQSxZQUFZLEdBQUcsRUFBRTtJQUNwQyxPQUFPLElBQUksQ0FBQ2pULE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsSUFBSXlSLE9BQU8sR0FBRyxFQUFFO01BQ2hCLEtBQUssSUFBSUMsU0FBUyxJQUFJMVMsSUFBSSxDQUFDUyxLQUFLLENBQUMsSUFBSSxDQUFDbEIsTUFBTSxDQUFDb1Qsd0JBQXdCLENBQUMsSUFBSSxDQUFDdFgsVUFBVSxFQUFFMkUsSUFBSSxDQUFDQyxTQUFTLENBQUMsRUFBQ3VTLFlBQVksRUFBRUEsWUFBWSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUNDLE9BQU8sRUFBRTtRQUM3SUEsT0FBTyxDQUFDekssSUFBSSxDQUFDLElBQUk0SywrQkFBc0IsQ0FBQ0YsU0FBUyxDQUFDLENBQUM7TUFDckQ7TUFDQSxPQUFPRCxPQUFPO0lBQ2hCLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1JLG1CQUFtQkEsQ0FBQ2pELE9BQWUsRUFBRWtELFdBQW9CLEVBQW1CO0lBQ2hGLElBQUksSUFBSSxDQUFDL1IsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQzhSLG1CQUFtQixDQUFDakQsT0FBTyxFQUFFa0QsV0FBVyxDQUFDO0lBQ2pHLElBQUksQ0FBQ2xELE9BQU8sRUFBRUEsT0FBTyxHQUFHLEVBQUU7SUFDMUIsSUFBSSxDQUFDa0QsV0FBVyxFQUFFQSxXQUFXLEdBQUcsRUFBRTtJQUNsQyxPQUFPLElBQUksQ0FBQ3ZULE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJLENBQUN6QixNQUFNLENBQUN3VCxzQkFBc0IsQ0FBQyxJQUFJLENBQUMxWCxVQUFVLEVBQUV1VSxPQUFPLEVBQUVrRCxXQUFXLENBQUM7SUFDbEYsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTUUsb0JBQW9CQSxDQUFDQyxLQUFhLEVBQUVDLFVBQW1CLEVBQUV0RCxPQUEyQixFQUFFdUQsY0FBdUIsRUFBRUwsV0FBK0IsRUFBaUI7SUFDbkssSUFBSSxJQUFJLENBQUMvUixjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDaVMsb0JBQW9CLENBQUNDLEtBQUssRUFBRUMsVUFBVSxFQUFFdEQsT0FBTyxFQUFFdUQsY0FBYyxFQUFFTCxXQUFXLENBQUM7SUFDckksSUFBSSxDQUFDSSxVQUFVLEVBQUVBLFVBQVUsR0FBRyxLQUFLO0lBQ25DLElBQUksQ0FBQ3RELE9BQU8sRUFBRUEsT0FBTyxHQUFHLEVBQUU7SUFDMUIsSUFBSSxDQUFDdUQsY0FBYyxFQUFFQSxjQUFjLEdBQUcsS0FBSztJQUMzQyxJQUFJLENBQUNMLFdBQVcsRUFBRUEsV0FBVyxHQUFHLEVBQUU7SUFDbEMsT0FBTyxJQUFJLENBQUN2VCxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLElBQUksQ0FBQ3pCLE1BQU0sQ0FBQzZULHVCQUF1QixDQUFDLElBQUksQ0FBQy9YLFVBQVUsRUFBRTRYLEtBQUssRUFBRUMsVUFBVSxFQUFFdEQsT0FBTyxFQUFFdUQsY0FBYyxFQUFFTCxXQUFXLENBQUM7SUFDL0csQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTU8sc0JBQXNCQSxDQUFDQyxRQUFnQixFQUFpQjtJQUM1RCxJQUFJLElBQUksQ0FBQ3ZTLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUNzUyxzQkFBc0IsQ0FBQ0MsUUFBUSxDQUFDO0lBQ3hGLE9BQU8sSUFBSSxDQUFDL1QsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixJQUFJLENBQUN6QixNQUFNLENBQUNnVSx5QkFBeUIsQ0FBQyxJQUFJLENBQUNsWSxVQUFVLEVBQUVpWSxRQUFRLENBQUM7SUFDbEUsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTUUsV0FBV0EsQ0FBQzdMLEdBQVcsRUFBRThMLGNBQXdCLEVBQWlCO0lBQ3RFLElBQUksSUFBSSxDQUFDMVMsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ3lTLFdBQVcsQ0FBQzdMLEdBQUcsRUFBRThMLGNBQWMsQ0FBQztJQUN4RixJQUFJLENBQUM5TCxHQUFHLEVBQUVBLEdBQUcsR0FBRyxFQUFFO0lBQ2xCLElBQUksQ0FBQzhMLGNBQWMsRUFBRUEsY0FBYyxHQUFHLEVBQUU7SUFDeEMsT0FBTyxJQUFJLENBQUNsVSxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLElBQUksQ0FBQ3pCLE1BQU0sQ0FBQ21VLFlBQVksQ0FBQyxJQUFJLENBQUNyWSxVQUFVLEVBQUUyRSxJQUFJLENBQUNDLFNBQVMsQ0FBQyxFQUFDMEgsR0FBRyxFQUFFQSxHQUFHLEVBQUU4TCxjQUFjLEVBQUVBLGNBQWMsRUFBQyxDQUFDLENBQUM7SUFDdkcsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTUUsYUFBYUEsQ0FBQ0YsY0FBd0IsRUFBaUI7SUFDM0QsSUFBSSxJQUFJLENBQUMxUyxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDNFMsYUFBYSxDQUFDRixjQUFjLENBQUM7SUFDckYsSUFBSSxDQUFDQSxjQUFjLEVBQUVBLGNBQWMsR0FBRyxFQUFFO0lBQ3hDLE9BQU8sSUFBSSxDQUFDbFUsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixJQUFJLENBQUN6QixNQUFNLENBQUNtVSxZQUFZLENBQUMsSUFBSSxDQUFDclksVUFBVSxFQUFFMkUsSUFBSSxDQUFDQyxTQUFTLENBQUMsRUFBQ3dULGNBQWMsRUFBRUEsY0FBYyxFQUFDLENBQUMsQ0FBQztJQUM3RixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNRyxjQUFjQSxDQUFBLEVBQWdDO0lBQ2xELElBQUksSUFBSSxDQUFDN1MsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQzZTLGNBQWMsQ0FBQyxDQUFDO0lBQ3hFLE9BQU8sSUFBSSxDQUFDclUsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixJQUFJNlMsV0FBVyxHQUFHLEVBQUU7TUFDcEIsS0FBSyxJQUFJQyxjQUFjLElBQUk5VCxJQUFJLENBQUNTLEtBQUssQ0FBQyxJQUFJLENBQUNsQixNQUFNLENBQUN3VSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMxWSxVQUFVLENBQUMsQ0FBQyxDQUFDd1ksV0FBVyxFQUFFQSxXQUFXLENBQUM3TCxJQUFJLENBQUMsSUFBSWdNLHlCQUFnQixDQUFDRixjQUFjLENBQUMsQ0FBQztNQUN4SixPQUFPRCxXQUFXO0lBQ3BCLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1JLGtCQUFrQkEsQ0FBQ3RNLEdBQVcsRUFBRVksS0FBYSxFQUFpQjtJQUNsRSxJQUFJLElBQUksQ0FBQ3hILGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUNrVCxrQkFBa0IsQ0FBQ3RNLEdBQUcsRUFBRVksS0FBSyxDQUFDO0lBQ3RGLElBQUksQ0FBQ1osR0FBRyxFQUFFQSxHQUFHLEdBQUcsRUFBRTtJQUNsQixJQUFJLENBQUNZLEtBQUssRUFBRUEsS0FBSyxHQUFHLEVBQUU7SUFDdEIsT0FBTyxJQUFJLENBQUNoSixNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLElBQUksQ0FBQ3pCLE1BQU0sQ0FBQzJVLHFCQUFxQixDQUFDLElBQUksQ0FBQzdZLFVBQVUsRUFBRXNNLEdBQUcsRUFBRVksS0FBSyxDQUFDO0lBQ2hFLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU00TCxhQUFhQSxDQUFDdFgsTUFBc0IsRUFBbUI7SUFDM0QsSUFBSSxJQUFJLENBQUNrRSxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDb1QsYUFBYSxDQUFDdFgsTUFBTSxDQUFDO0lBQzdFQSxNQUFNLEdBQUc4TSxxQkFBWSxDQUFDOEMsd0JBQXdCLENBQUM1UCxNQUFNLENBQUM7SUFDdEQsT0FBTyxJQUFJLENBQUMwQyxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLElBQUk7UUFDRixPQUFPLElBQUksQ0FBQ3pCLE1BQU0sQ0FBQzZVLGVBQWUsQ0FBQyxJQUFJLENBQUMvWSxVQUFVLEVBQUUyRSxJQUFJLENBQUNDLFNBQVMsQ0FBQ3BELE1BQU0sQ0FBQ3FELE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztNQUN0RixDQUFDLENBQUMsT0FBTzJELEdBQUcsRUFBRTtRQUNaLE1BQU0sSUFBSXBILG9CQUFXLENBQUMsMENBQTBDLENBQUM7TUFDbkU7SUFDRixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNNFgsZUFBZUEsQ0FBQ2hTLEdBQVcsRUFBMkI7SUFDMUQsSUFBSSxJQUFJLENBQUN0QixjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDc1QsZUFBZSxDQUFDaFMsR0FBRyxDQUFDO0lBQzVFLE9BQU8sSUFBSSxDQUFDOUMsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixJQUFJO1FBQ0YsT0FBTyxJQUFJc1QsdUJBQWMsQ0FBQ3RVLElBQUksQ0FBQ1MsS0FBSyxDQUFDWixpQkFBUSxDQUFDb0gsZ0JBQWdCLENBQUMsSUFBSSxDQUFDMUgsTUFBTSxDQUFDZ1YsaUJBQWlCLENBQUMsSUFBSSxDQUFDbFosVUFBVSxFQUFFZ0gsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO01BQ3ZILENBQUMsQ0FBQyxPQUFPd0IsR0FBUSxFQUFFO1FBQ2pCLE1BQU0sSUFBSXBILG9CQUFXLENBQUNvSCxHQUFHLENBQUNDLE9BQU8sQ0FBQztNQUNwQztJQUNGLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU0wUSxZQUFZQSxDQUFDQyxHQUFXLEVBQW1CO0lBQy9DLElBQUksSUFBSSxDQUFDMVQsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ3lULFlBQVksQ0FBQ0MsR0FBRyxDQUFDO0lBQ3pFLElBQUksQ0FBQ3pULGVBQWUsQ0FBQyxDQUFDO0lBQ3RCLElBQUF4RSxlQUFNLEVBQUMsT0FBT2lZLEdBQUcsS0FBSyxRQUFRLEVBQUUsZ0NBQWdDLENBQUM7SUFDakUsT0FBTyxJQUFJLENBQUNsVixNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLElBQUkwVCxLQUFLLEdBQUcsSUFBSSxDQUFDblYsTUFBTSxDQUFDb1YsYUFBYSxDQUFDLElBQUksQ0FBQ3RaLFVBQVUsRUFBRW9aLEdBQUcsQ0FBQztNQUMzRCxPQUFPQyxLQUFLLEtBQUssRUFBRSxHQUFHLElBQUksR0FBR0EsS0FBSztJQUNwQyxDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNRSxZQUFZQSxDQUFDSCxHQUFXLEVBQUVJLEdBQVcsRUFBaUI7SUFDMUQsSUFBSSxJQUFJLENBQUM5VCxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDNlQsWUFBWSxDQUFDSCxHQUFHLEVBQUVJLEdBQUcsQ0FBQztJQUM5RSxJQUFJLENBQUM3VCxlQUFlLENBQUMsQ0FBQztJQUN0QixJQUFBeEUsZUFBTSxFQUFDLE9BQU9pWSxHQUFHLEtBQUssUUFBUSxFQUFFLGdDQUFnQyxDQUFDO0lBQ2pFLElBQUFqWSxlQUFNLEVBQUMsT0FBT3FZLEdBQUcsS0FBSyxRQUFRLEVBQUUsa0NBQWtDLENBQUM7SUFDbkUsT0FBTyxJQUFJLENBQUN0VixNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLElBQUksQ0FBQ3pCLE1BQU0sQ0FBQ3VWLGFBQWEsQ0FBQyxJQUFJLENBQUN6WixVQUFVLEVBQUVvWixHQUFHLEVBQUVJLEdBQUcsQ0FBQztJQUN0RCxDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNRSxXQUFXQSxDQUFDQyxVQUFrQixFQUFFQyxnQkFBMEIsRUFBRUMsYUFBdUIsRUFBaUI7SUFDeEcsSUFBSSxJQUFJLENBQUNuVSxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDZ1UsV0FBVyxDQUFDQyxVQUFVLEVBQUVDLGdCQUFnQixFQUFFQyxhQUFhLENBQUM7SUFDaEgsSUFBSSxDQUFDbFUsZUFBZSxDQUFDLENBQUM7SUFDdEIsSUFBSW1VLE1BQU0sR0FBRyxNQUFNQyx3QkFBZSxDQUFDQyxrQkFBa0IsQ0FBQyxNQUFNLElBQUksQ0FBQ3RTLG1CQUFtQixDQUFDLENBQUMsQ0FBQztJQUN2RixNQUFNb1MsTUFBTSxDQUFDSixXQUFXLENBQUMsTUFBTSxJQUFJLENBQUM1WCxpQkFBaUIsQ0FBQyxDQUFDLEVBQUU2WCxVQUFVLEVBQUVDLGdCQUFnQixFQUFFQyxhQUFhLENBQUM7RUFDdkc7O0VBRUEsTUFBTUksVUFBVUEsQ0FBQSxFQUFrQjtJQUNoQyxJQUFJLElBQUksQ0FBQ3ZVLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUN1VSxVQUFVLENBQUMsQ0FBQztJQUNwRSxJQUFJLENBQUN0VSxlQUFlLENBQUMsQ0FBQztJQUN0QixJQUFJbVUsTUFBTSxHQUFHLE1BQU1DLHdCQUFlLENBQUNDLGtCQUFrQixDQUFDLE1BQU0sSUFBSSxDQUFDdFMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDO0lBQ3ZGLE1BQU1vUyxNQUFNLENBQUNHLFVBQVUsQ0FBQyxDQUFDO0VBQzNCOztFQUVBLE1BQU1DLHNCQUFzQkEsQ0FBQSxFQUFxQjtJQUMvQyxJQUFJLElBQUksQ0FBQ3hVLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUN3VSxzQkFBc0IsQ0FBQyxDQUFDO0lBQ2hGLE9BQU8sSUFBSSxDQUFDaFcsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUksQ0FBQ3pCLE1BQU0sQ0FBQ2lXLHlCQUF5QixDQUFDLElBQUksQ0FBQ25hLFVBQVUsQ0FBQztJQUMvRCxDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNb2EsVUFBVUEsQ0FBQSxFQUFxQjtJQUNuQyxJQUFJLElBQUksQ0FBQzFVLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUMwVSxVQUFVLENBQUMsQ0FBQztJQUNwRSxPQUFPLElBQUksQ0FBQ2xXLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJLENBQUN6QixNQUFNLENBQUNtVyxXQUFXLENBQUMsSUFBSSxDQUFDcmEsVUFBVSxDQUFDO0lBQ2pELENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU1zYSxlQUFlQSxDQUFBLEVBQWdDO0lBQ25ELElBQUksSUFBSSxDQUFDNVUsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQzRVLGVBQWUsQ0FBQyxDQUFDO0lBQ3pFLE9BQU8sSUFBSSxDQUFDcFcsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUk0VSwyQkFBa0IsQ0FBQzVWLElBQUksQ0FBQ1MsS0FBSyxDQUFDLElBQUksQ0FBQ2xCLE1BQU0sQ0FBQ3NXLGlCQUFpQixDQUFDLElBQUksQ0FBQ3hhLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFDM0YsQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTXlhLGVBQWVBLENBQUEsRUFBb0I7SUFDdkMsSUFBSSxJQUFJLENBQUMvVSxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDK1UsZUFBZSxDQUFDLENBQUM7SUFDekUsT0FBTyxJQUFJLENBQUN2VyxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLElBQUksQ0FBQ3VCLGVBQWUsQ0FBQyxDQUFDO01BQ3RCLE9BQU8sSUFBSSxDQUFDekIsTUFBTSxDQUFDd1csZ0JBQWdCLENBQUMsSUFBSSxDQUFDMWEsVUFBVSxDQUFDO0lBQ3RELENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU0yYSxZQUFZQSxDQUFDQyxhQUF1QixFQUFFQyxTQUFpQixFQUFFM2EsUUFBZ0IsRUFBbUI7SUFDaEcsSUFBSSxJQUFJLENBQUN3RixjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDaVYsWUFBWSxDQUFDQyxhQUFhLEVBQUVDLFNBQVMsRUFBRTNhLFFBQVEsQ0FBQztJQUN4RyxPQUFPLElBQUksQ0FBQ2dFLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLO1FBQ3RDLElBQUksQ0FBQ0wsTUFBTSxDQUFDNFcsYUFBYSxDQUFDLElBQUksQ0FBQzlhLFVBQVUsRUFBRTJFLElBQUksQ0FBQ0MsU0FBUyxDQUFDLEVBQUNnVyxhQUFhLEVBQUVBLGFBQWEsRUFBRUMsU0FBUyxFQUFFQSxTQUFTLEVBQUUzYSxRQUFRLEVBQUVBLFFBQVEsRUFBQyxDQUFDLEVBQUUsQ0FBQzJGLElBQUksS0FBSztVQUM3SSxJQUFJNFAsUUFBUSxHQUFHLFNBQVM7VUFDeEIsSUFBSTVQLElBQUksQ0FBQzZQLE9BQU8sQ0FBQ0QsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFbFIsTUFBTSxDQUFDLElBQUluRCxvQkFBVyxDQUFDeUUsSUFBSSxDQUFDOFAsU0FBUyxDQUFDRixRQUFRLENBQUNHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztVQUN0RnRSLE9BQU8sQ0FBQ3VCLElBQUksQ0FBQztRQUNwQixDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNa1Ysb0JBQW9CQSxDQUFDSCxhQUF1QixFQUFFMWEsUUFBZ0IsRUFBcUM7SUFDdkcsSUFBSSxJQUFJLENBQUN3RixjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDcVYsb0JBQW9CLENBQUNILGFBQWEsRUFBRTFhLFFBQVEsQ0FBQztJQUNyRyxPQUFPLElBQUksQ0FBQ2dFLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLO1FBQ3RDLElBQUksQ0FBQ0wsTUFBTSxDQUFDOFcsc0JBQXNCLENBQUMsSUFBSSxDQUFDaGIsVUFBVSxFQUFFMkUsSUFBSSxDQUFDQyxTQUFTLENBQUMsRUFBQ2dXLGFBQWEsRUFBRUEsYUFBYSxFQUFFMWEsUUFBUSxFQUFFQSxRQUFRLEVBQUMsQ0FBQyxFQUFFLENBQUMyRixJQUFJLEtBQUs7VUFDaEksSUFBSTRQLFFBQVEsR0FBRyxTQUFTO1VBQ3hCLElBQUk1UCxJQUFJLENBQUM2UCxPQUFPLENBQUNELFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRWxSLE1BQU0sQ0FBQyxJQUFJbkQsb0JBQVcsQ0FBQ3lFLElBQUksQ0FBQzhQLFNBQVMsQ0FBQ0YsUUFBUSxDQUFDRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7VUFDdEZ0UixPQUFPLENBQUMsSUFBSTJXLGlDQUF3QixDQUFDdFcsSUFBSSxDQUFDUyxLQUFLLENBQUNTLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDOUQsQ0FBQyxDQUFDO01BQ0osQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTXFWLGlCQUFpQkEsQ0FBQSxFQUFvQjtJQUN6QyxJQUFJLElBQUksQ0FBQ3hWLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUN3VixpQkFBaUIsQ0FBQyxDQUFDO0lBQzNFLE9BQU8sSUFBSSxDQUFDaFgsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUksQ0FBQ3pCLE1BQU0sQ0FBQ2lYLG1CQUFtQixDQUFDLElBQUksQ0FBQ25iLFVBQVUsQ0FBQztJQUN6RCxDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNb2IsaUJBQWlCQSxDQUFDUixhQUF1QixFQUFFUyxrQkFBNEIsRUFBbUI7SUFDOUYsSUFBSUEsa0JBQWtCLEtBQUs1YSxTQUFTLEVBQUU0YSxrQkFBa0IsR0FBRyxJQUFJO0lBQy9ELElBQUksSUFBSSxDQUFDM1YsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQzBWLGlCQUFpQixDQUFDUixhQUFhLEVBQUVTLGtCQUFrQixDQUFDO0lBQzVHLElBQUksQ0FBQzdXLGlCQUFRLENBQUNxTyxPQUFPLENBQUMrSCxhQUFhLENBQUMsRUFBRSxNQUFNLElBQUl4WixvQkFBVyxDQUFDLDhDQUE4QyxDQUFDO0lBQzNHLE9BQU8sSUFBSSxDQUFDOEMsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQztNQUN0QixPQUFPLElBQUl0QixPQUFPLENBQUMsQ0FBQ0MsT0FBTyxFQUFFQyxNQUFNLEtBQUs7UUFDdEMsSUFBSSxDQUFDTCxNQUFNLENBQUNvWCxtQkFBbUIsQ0FBQyxJQUFJLENBQUN0YixVQUFVLEVBQUUyRSxJQUFJLENBQUNDLFNBQVMsQ0FBQyxFQUFDZ1csYUFBYSxFQUFFQSxhQUFhLEVBQUVTLGtCQUFrQixFQUFFQSxrQkFBa0IsRUFBQyxDQUFDLEVBQUUsQ0FBQ3hWLElBQUksS0FBSztVQUNqSixJQUFJLE9BQU9BLElBQUksS0FBSyxRQUFRLEVBQUV0QixNQUFNLENBQUMsSUFBSW5ELG9CQUFXLENBQUN5RSxJQUFJLENBQUMsQ0FBQyxDQUFDO1VBQ3ZEdkIsT0FBTyxDQUFDdUIsSUFBSSxDQUFDO1FBQ3BCLENBQUMsQ0FBQztNQUNKLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKOztFQUVBLE1BQU0wVixpQkFBaUJBLENBQUM5SCxhQUFxQixFQUFxQztJQUNoRixJQUFJLElBQUksQ0FBQy9OLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUM2VixpQkFBaUIsQ0FBQzlILGFBQWEsQ0FBQztJQUN4RixPQUFPLElBQUksQ0FBQ3ZQLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLO1FBQ3RDLElBQUksQ0FBQ0wsTUFBTSxDQUFDc1gsb0JBQW9CLENBQUMsSUFBSSxDQUFDeGIsVUFBVSxFQUFFeVQsYUFBYSxFQUFFLENBQUM1TixJQUFJLEtBQUs7VUFDekUsSUFBSUEsSUFBSSxDQUFDeUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRS9ELE1BQU0sQ0FBQyxJQUFJbkQsb0JBQVcsQ0FBQ3lFLElBQUksQ0FBQyxDQUFDLENBQUM7VUFDckR2QixPQUFPLENBQUMsSUFBSW1YLGlDQUF3QixDQUFDOVcsSUFBSSxDQUFDUyxLQUFLLENBQUNTLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDOUQsQ0FBQyxDQUFDO01BQ0osQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDO0VBQ0o7O0VBRUEsTUFBTTZWLG1CQUFtQkEsQ0FBQ0MsbUJBQTJCLEVBQXFCO0lBQ3hFLElBQUksSUFBSSxDQUFDalcsY0FBYyxDQUFDLENBQUMsRUFBRSxPQUFPLElBQUksQ0FBQ0EsY0FBYyxDQUFDLENBQUMsQ0FBQ2dXLG1CQUFtQixDQUFDQyxtQkFBbUIsQ0FBQztJQUNoRyxPQUFPLElBQUksQ0FBQ3pYLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdkMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLO1FBQ3RDLElBQUksQ0FBQ0wsTUFBTSxDQUFDMFgsc0JBQXNCLENBQUMsSUFBSSxDQUFDNWIsVUFBVSxFQUFFMmIsbUJBQW1CLEVBQUUsQ0FBQzlWLElBQUksS0FBSztVQUNqRixJQUFJQSxJQUFJLENBQUN5QyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFL0QsTUFBTSxDQUFDLElBQUluRCxvQkFBVyxDQUFDeUUsSUFBSSxDQUFDLENBQUMsQ0FBQztVQUNyRHZCLE9BQU8sQ0FBQ0ssSUFBSSxDQUFDUyxLQUFLLENBQUNTLElBQUksQ0FBQyxDQUFDaUYsUUFBUSxDQUFDO1FBQ3pDLENBQUMsQ0FBQztNQUNKLENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7RUFDRSxNQUFNK1EsT0FBT0EsQ0FBQSxFQUF3QjtJQUNuQyxJQUFJLElBQUksQ0FBQ25XLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUNtVyxPQUFPLENBQUMsQ0FBQzs7SUFFakU7SUFDQSxJQUFJQyxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUNDLFVBQVUsQ0FBQyxDQUFDO0lBQ3RDLE9BQU8sSUFBSSxDQUFDN1gsTUFBTSxDQUFDRSxTQUFTLENBQUMsWUFBWTtNQUN2QyxJQUFJLENBQUN1QixlQUFlLENBQUMsQ0FBQzs7TUFFdEI7TUFDQSxJQUFJcVcsS0FBSyxHQUFHLEVBQUU7O01BRWQ7TUFDQSxJQUFJQyxjQUFjLEdBQUd0WCxJQUFJLENBQUNTLEtBQUssQ0FBQyxJQUFJLENBQUNsQixNQUFNLENBQUNnWSxxQkFBcUIsQ0FBQyxJQUFJLENBQUNsYyxVQUFVLENBQUMsQ0FBQzs7TUFFbkY7TUFDQSxJQUFJbWMsSUFBSSxHQUFHLElBQUlDLFFBQVEsQ0FBQyxJQUFJQyxXQUFXLENBQUNKLGNBQWMsQ0FBQ3JHLE1BQU0sQ0FBQyxDQUFDO01BQy9ELEtBQUssSUFBSTBHLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR0wsY0FBYyxDQUFDckcsTUFBTSxFQUFFMEcsQ0FBQyxFQUFFLEVBQUU7UUFDOUNILElBQUksQ0FBQ0ksT0FBTyxDQUFDRCxDQUFDLEVBQUUsSUFBSSxDQUFDcFksTUFBTSxDQUFDc1ksTUFBTSxDQUFDUCxjQUFjLENBQUNRLE9BQU8sR0FBR0MsVUFBVSxDQUFDQyxpQkFBaUIsR0FBR0wsQ0FBQyxDQUFDLENBQUM7TUFDaEc7O01BRUE7TUFDQSxJQUFJLENBQUNwWSxNQUFNLENBQUMwWSxLQUFLLENBQUNYLGNBQWMsQ0FBQ1EsT0FBTyxDQUFDOztNQUV6QztNQUNBVCxLQUFLLENBQUNyUCxJQUFJLENBQUNrUSxNQUFNLENBQUNDLElBQUksQ0FBQ1gsSUFBSSxDQUFDWSxNQUFNLENBQUMsQ0FBQzs7TUFFcEM7TUFDQSxJQUFJQyxhQUFhLEdBQUdyWSxJQUFJLENBQUNTLEtBQUssQ0FBQyxJQUFJLENBQUNsQixNQUFNLENBQUMrWSxvQkFBb0IsQ0FBQyxJQUFJLENBQUNqZCxVQUFVLEVBQUUsSUFBSSxDQUFDRSxRQUFRLEVBQUU0YixRQUFRLENBQUMsQ0FBQzs7TUFFMUc7TUFDQUssSUFBSSxHQUFHLElBQUlDLFFBQVEsQ0FBQyxJQUFJQyxXQUFXLENBQUNXLGFBQWEsQ0FBQ3BILE1BQU0sQ0FBQyxDQUFDO01BQzFELEtBQUssSUFBSTBHLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBR1UsYUFBYSxDQUFDcEgsTUFBTSxFQUFFMEcsQ0FBQyxFQUFFLEVBQUU7UUFDN0NILElBQUksQ0FBQ0ksT0FBTyxDQUFDRCxDQUFDLEVBQUUsSUFBSSxDQUFDcFksTUFBTSxDQUFDc1ksTUFBTSxDQUFDUSxhQUFhLENBQUNQLE9BQU8sR0FBR0MsVUFBVSxDQUFDQyxpQkFBaUIsR0FBR0wsQ0FBQyxDQUFDLENBQUM7TUFDL0Y7O01BRUE7TUFDQSxJQUFJLENBQUNwWSxNQUFNLENBQUMwWSxLQUFLLENBQUNJLGFBQWEsQ0FBQ1AsT0FBTyxDQUFDOztNQUV4QztNQUNBVCxLQUFLLENBQUNrQixPQUFPLENBQUNMLE1BQU0sQ0FBQ0MsSUFBSSxDQUFDWCxJQUFJLENBQUNZLE1BQU0sQ0FBQyxDQUFDO01BQ3ZDLE9BQU9mLEtBQUs7SUFDZCxDQUFDLENBQUM7RUFDSjs7RUFFQSxNQUFNbUIsY0FBY0EsQ0FBQ0MsV0FBbUIsRUFBRUMsV0FBbUIsRUFBaUI7SUFDNUUsSUFBSSxJQUFJLENBQUMzWCxjQUFjLENBQUMsQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDQSxjQUFjLENBQUMsQ0FBQyxDQUFDeVgsY0FBYyxDQUFDQyxXQUFXLEVBQUVDLFdBQVcsQ0FBQztJQUNoRyxJQUFJRCxXQUFXLEtBQUssSUFBSSxDQUFDbGQsUUFBUSxFQUFFLE1BQU0sSUFBSWtCLG9CQUFXLENBQUMsNEJBQTRCLENBQUMsQ0FBQyxDQUFDO0lBQ3hGLElBQUlpYyxXQUFXLEtBQUs1YyxTQUFTLEVBQUU0YyxXQUFXLEdBQUcsRUFBRTtJQUMvQyxNQUFNLElBQUksQ0FBQ25aLE1BQU0sQ0FBQ0UsU0FBUyxDQUFDLFlBQVk7TUFDdEMsSUFBSSxDQUFDdUIsZUFBZSxDQUFDLENBQUM7TUFDdEIsT0FBTyxJQUFJdEIsT0FBTyxDQUFPLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLO1FBQzVDLElBQUksQ0FBQ0wsTUFBTSxDQUFDb1osc0JBQXNCLENBQUMsSUFBSSxDQUFDdGQsVUFBVSxFQUFFb2QsV0FBVyxFQUFFQyxXQUFXLEVBQUUsQ0FBQ0UsTUFBTSxLQUFLO1VBQ3hGLElBQUlBLE1BQU0sRUFBRWhaLE1BQU0sQ0FBQyxJQUFJbkQsb0JBQVcsQ0FBQ21jLE1BQU0sQ0FBQyxDQUFDLENBQUM7VUFDdkNqWixPQUFPLENBQUMsQ0FBQztRQUNoQixDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7SUFDRixJQUFJLENBQUNwRSxRQUFRLEdBQUdtZCxXQUFXO0lBQzNCLElBQUksSUFBSSxDQUFDcGQsSUFBSSxFQUFFLE1BQU0sSUFBSSxDQUFDNkUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3BDOztFQUVBLE1BQU1BLElBQUlBLENBQUEsRUFBa0I7SUFDMUIsSUFBSSxJQUFJLENBQUNZLGNBQWMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUNaLElBQUksQ0FBQyxDQUFDO0lBQzlELE9BQU9sRixnQkFBZ0IsQ0FBQ2tGLElBQUksQ0FBQyxJQUFJLENBQUM7RUFDcEM7O0VBRUEsTUFBTTBZLEtBQUtBLENBQUMxWSxJQUFJLEdBQUcsS0FBSyxFQUFpQjtJQUN2QyxJQUFJLElBQUksQ0FBQ3BFLFNBQVMsRUFBRSxPQUFPLENBQUM7SUFDNUIsSUFBSW9FLElBQUksRUFBRSxNQUFNLElBQUksQ0FBQ0EsSUFBSSxDQUFDLENBQUM7SUFDM0IsSUFBSSxJQUFJLENBQUNZLGNBQWMsQ0FBQyxDQUFDLEVBQUU7TUFDekIsTUFBTSxJQUFJLENBQUNBLGNBQWMsQ0FBQyxDQUFDLENBQUM4WCxLQUFLLENBQUMsS0FBSyxDQUFDO01BQ3hDLE1BQU0sS0FBSyxDQUFDQSxLQUFLLENBQUMsQ0FBQztNQUNuQjtJQUNGO0lBQ0EsTUFBTSxJQUFJLENBQUMvVyxnQkFBZ0IsQ0FBQyxDQUFDO0lBQzdCLE1BQU0sSUFBSSxDQUFDaUUsV0FBVyxDQUFDLENBQUM7SUFDeEIsTUFBTSxLQUFLLENBQUM4UyxLQUFLLENBQUMsQ0FBQztJQUNuQixPQUFPLElBQUksQ0FBQ3ZkLElBQUk7SUFDaEIsT0FBTyxJQUFJLENBQUNDLFFBQVE7SUFDcEIsT0FBTyxJQUFJLENBQUNTLFlBQVk7SUFDeEJLLHFCQUFZLENBQUNDLHVCQUF1QixDQUFDLElBQUksQ0FBQ0gsMEJBQTBCLEVBQUVMLFNBQVMsQ0FBQyxDQUFDLENBQUM7RUFDcEY7O0VBRUE7O0VBRUEsTUFBTWdkLG9CQUFvQkEsQ0FBQSxFQUFnQyxDQUFFLE9BQU8sS0FBSyxDQUFDQSxvQkFBb0IsQ0FBQyxDQUFDLENBQUU7RUFDakcsTUFBTUMsS0FBS0EsQ0FBQzFJLE1BQWMsRUFBcUMsQ0FBRSxPQUFPLEtBQUssQ0FBQzBJLEtBQUssQ0FBQzFJLE1BQU0sQ0FBQyxDQUFFO0VBQzdGLE1BQU0ySSxvQkFBb0JBLENBQUN2UCxLQUFtQyxFQUFxQyxDQUFFLE9BQU8sS0FBSyxDQUFDdVAsb0JBQW9CLENBQUN2UCxLQUFLLENBQUMsQ0FBRTtFQUMvSSxNQUFNd1Asb0JBQW9CQSxDQUFDeFAsS0FBbUMsRUFBRSxDQUFFLE9BQU8sS0FBSyxDQUFDd1Asb0JBQW9CLENBQUN4UCxLQUFLLENBQUMsQ0FBRTtFQUM1RyxNQUFNeVAsUUFBUUEsQ0FBQ3JjLE1BQStCLEVBQTJCLENBQUUsT0FBTyxLQUFLLENBQUNxYyxRQUFRLENBQUNyYyxNQUFNLENBQUMsQ0FBRTtFQUMxRyxNQUFNc2MsT0FBT0EsQ0FBQy9LLFlBQXFDLEVBQW1CLENBQUUsT0FBTyxLQUFLLENBQUMrSyxPQUFPLENBQUMvSyxZQUFZLENBQUMsQ0FBRTtFQUM1RyxNQUFNZ0wsU0FBU0EsQ0FBQy9JLE1BQWMsRUFBbUIsQ0FBRSxPQUFPLEtBQUssQ0FBQytJLFNBQVMsQ0FBQy9JLE1BQU0sQ0FBQyxDQUFFO0VBQ25GLE1BQU1nSixTQUFTQSxDQUFDaEosTUFBYyxFQUFFaUosSUFBWSxFQUFpQixDQUFFLE9BQU8sS0FBSyxDQUFDRCxTQUFTLENBQUNoSixNQUFNLEVBQUVpSixJQUFJLENBQUMsQ0FBRTs7RUFFckc7O0VBRUEsYUFBdUJsYixjQUFjQSxDQUFDdkIsTUFBbUMsRUFBRTtJQUN6RSxJQUFJQSxNQUFNLENBQUMwYyxhQUFhLEVBQUU7TUFDeEIsSUFBSTVkLFdBQVcsR0FBRyxNQUFNb0QscUJBQXFCLENBQUNYLGNBQWMsQ0FBQ3ZCLE1BQU0sQ0FBQztNQUNwRSxPQUFPLElBQUk1QixnQkFBZ0IsQ0FBQ2EsU0FBUyxFQUFFQSxTQUFTLEVBQUVBLFNBQVMsRUFBRUEsU0FBUyxFQUFFQSxTQUFTLEVBQUVBLFNBQVMsRUFBRUgsV0FBVyxDQUFDO0lBQzVHOztJQUVBO0lBQ0EsSUFBSWtCLE1BQU0sQ0FBQzJjLFdBQVcsS0FBSzFkLFNBQVMsRUFBRSxNQUFNLElBQUlXLG9CQUFXLENBQUMsd0NBQXdDLENBQUM7SUFDckdJLE1BQU0sQ0FBQzJjLFdBQVcsR0FBRzlhLDBCQUFpQixDQUFDeVosSUFBSSxDQUFDdGIsTUFBTSxDQUFDMmMsV0FBVyxDQUFDO0lBQy9ELElBQUlyYSxnQkFBZ0IsR0FBR3RDLE1BQU0sQ0FBQ2MsU0FBUyxDQUFDLENBQUM7SUFDekMsSUFBSThiLFNBQVMsR0FBR3RhLGdCQUFnQixJQUFJQSxnQkFBZ0IsQ0FBQ21ELE1BQU0sQ0FBQyxDQUFDLEdBQUduRCxnQkFBZ0IsQ0FBQ21ELE1BQU0sQ0FBQyxDQUFDLEdBQUcsRUFBRTtJQUM5RixJQUFJb1gsY0FBYyxHQUFHdmEsZ0JBQWdCLElBQUlBLGdCQUFnQixDQUFDcUQsV0FBVyxDQUFDLENBQUMsR0FBR3JELGdCQUFnQixDQUFDcUQsV0FBVyxDQUFDLENBQUMsR0FBRyxFQUFFO0lBQzdHLElBQUltWCxjQUFjLEdBQUd4YSxnQkFBZ0IsSUFBSUEsZ0JBQWdCLENBQUNOLFdBQVcsQ0FBQyxDQUFDLEdBQUdNLGdCQUFnQixDQUFDTixXQUFXLENBQUMsQ0FBQyxHQUFHLEVBQUU7SUFDN0csSUFBSXBELGtCQUFrQixHQUFHMEQsZ0JBQWdCLEdBQUdBLGdCQUFnQixDQUFDQyxxQkFBcUIsQ0FBQyxDQUFDLEdBQUcsSUFBSTs7SUFFM0Y7SUFDQSxJQUFJRyxNQUFNLEdBQUcsTUFBTWxELHFCQUFZLENBQUNtRCxjQUFjLENBQUMsQ0FBQzs7SUFFaEQ7SUFDQSxPQUFPRCxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ2xDLE9BQU8sSUFBSUMsT0FBTyxDQUFDLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLOztRQUV0QztRQUNBLElBQUlsRSxzQkFBc0IsR0FBR21FLGlCQUFRLENBQUNDLE9BQU8sQ0FBQyxDQUFDO1FBQy9DekQscUJBQVksQ0FBQ0MsdUJBQXVCLENBQUNaLHNCQUFzQixFQUFFLE1BQU1ELGtCQUFrQixDQUFDOztRQUV0RjtRQUNBOEQsTUFBTSxDQUFDcWEsZ0JBQWdCLENBQUMvYyxNQUFNLENBQUN0QixRQUFRLEVBQUVzQixNQUFNLENBQUMyYyxXQUFXLEVBQUUzYyxNQUFNLENBQUNnZCxRQUFRLElBQUksRUFBRSxFQUFFaGQsTUFBTSxDQUFDaWQsU0FBUyxJQUFJLEVBQUUsRUFBRUwsU0FBUyxFQUFFQyxjQUFjLEVBQUVDLGNBQWMsRUFBRWplLHNCQUFzQixFQUFFbUIsTUFBTSxDQUFDa2QsVUFBVSxDQUFDLENBQUMsS0FBS2plLFNBQVMsR0FBRyxLQUFLLEdBQUdlLE1BQU0sQ0FBQ2tkLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQzFlLFVBQVUsS0FBSztVQUM5UCxJQUFJLE9BQU9BLFVBQVUsS0FBSyxRQUFRLEVBQUV1RSxNQUFNLENBQUMsSUFBSW5ELG9CQUFXLENBQUNwQixVQUFVLENBQUMsQ0FBQyxDQUFDO1VBQ25Fc0UsT0FBTyxDQUFDLElBQUkxRSxnQkFBZ0IsQ0FBQ0ksVUFBVSxFQUFFd0IsTUFBTSxDQUFDdkIsSUFBSSxFQUFFdUIsTUFBTSxDQUFDdEIsUUFBUSxFQUFFc0IsTUFBTSxDQUFDckIsRUFBRSxFQUFFQyxrQkFBa0IsRUFBRUMsc0JBQXNCLENBQUMsQ0FBQztRQUNySSxDQUFDLENBQUM7TUFDSixDQUFDLENBQUM7SUFDSixDQUFDLENBQUM7RUFDSjs7RUFFVXFGLGNBQWNBLENBQUEsRUFBMEI7SUFDaEQsT0FBTyxLQUFLLENBQUNBLGNBQWMsQ0FBQyxDQUFDO0VBQy9COztFQUVBLE1BQWdCOEUsY0FBY0EsQ0FBQSxFQUFHO0lBQy9CLElBQUkwQyxLQUFLLEdBQUcsSUFBSSxDQUFDak4sSUFBSSxHQUFHLElBQUksQ0FBQ0EsSUFBSSxHQUFJLElBQUksQ0FBQzBlLGVBQWUsR0FBRyxJQUFJLENBQUNBLGVBQWUsR0FBRyxrQkFBbUIsQ0FBQyxDQUFDO0lBQ3hHM2QscUJBQVksQ0FBQ00sR0FBRyxDQUFDLENBQUMsRUFBRSwyQkFBMkIsR0FBRzRMLEtBQUssQ0FBQztJQUN4RCxJQUFJLENBQUUsTUFBTSxJQUFJLENBQUMzRCxJQUFJLENBQUMsQ0FBQyxDQUFFO0lBQ3pCLE9BQU9mLEdBQVEsRUFBRSxDQUFFLElBQUksQ0FBQyxJQUFJLENBQUM5SCxTQUFTLEVBQUVrZSxPQUFPLENBQUNDLEtBQUssQ0FBQyxtQ0FBbUMsR0FBRzNSLEtBQUssR0FBRyxJQUFJLEdBQUcxRSxHQUFHLENBQUNDLE9BQU8sQ0FBQyxDQUFFO0VBQzNIOztFQUVBLE1BQWdCaEMsZ0JBQWdCQSxDQUFBLEVBQUc7SUFDakMsSUFBSXFZLFNBQVMsR0FBRyxJQUFJLENBQUN2ZSxTQUFTLENBQUNxVixNQUFNLEdBQUcsQ0FBQztJQUN6QyxJQUFJLElBQUksQ0FBQy9VLGtCQUFrQixLQUFLLENBQUMsSUFBSSxDQUFDaWUsU0FBUyxJQUFJLElBQUksQ0FBQ2plLGtCQUFrQixHQUFHLENBQUMsSUFBSWllLFNBQVMsRUFBRSxPQUFPLENBQUM7SUFDckcsT0FBTyxJQUFJLENBQUM1YSxNQUFNLENBQUNFLFNBQVMsQ0FBQyxZQUFZO01BQ3ZDLE9BQU8sSUFBSUMsT0FBTyxDQUFPLENBQUNDLE9BQU8sRUFBRUMsTUFBTSxLQUFLO1FBQzVDLElBQUksQ0FBQ0wsTUFBTSxDQUFDNmEsWUFBWTtVQUN0QixJQUFJLENBQUMvZSxVQUFVO1VBQ2YsSUFBSSxDQUFDYSxrQkFBa0I7VUFDckIsQ0FBQW1lLGlCQUFpQixLQUFJO1lBQ25CLElBQUksT0FBT0EsaUJBQWlCLEtBQUssUUFBUSxFQUFFemEsTUFBTSxDQUFDLElBQUluRCxvQkFBVyxDQUFDNGQsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO1lBQ2pGO2NBQ0gsSUFBSSxDQUFDbmUsa0JBQWtCLEdBQUdtZSxpQkFBaUI7Y0FDM0MxYSxPQUFPLENBQUMsQ0FBQztZQUNYO1VBQ0YsQ0FBQztVQUNEd2EsU0FBUyxHQUFHLE9BQU9HLE1BQU0sRUFBRXhWLFdBQVcsRUFBRXlWLFNBQVMsRUFBRUMsV0FBVyxFQUFFMVcsT0FBTyxLQUFLLE1BQU0sSUFBSSxDQUFDOUgsWUFBWSxDQUFDeWUsY0FBYyxDQUFDSCxNQUFNLEVBQUV4VixXQUFXLEVBQUV5VixTQUFTLEVBQUVDLFdBQVcsRUFBRTFXLE9BQU8sQ0FBQyxHQUFHaEksU0FBUztVQUNwTHFlLFNBQVMsR0FBRyxPQUFPRyxNQUFNLEtBQUssTUFBTSxJQUFJLENBQUN0ZSxZQUFZLENBQUMwZSxVQUFVLENBQUNKLE1BQU0sQ0FBQyxHQUFHeGUsU0FBUztVQUNwRnFlLFNBQVMsR0FBRyxPQUFPUSxhQUFhLEVBQUVDLHFCQUFxQixLQUFLLE1BQU0sSUFBSSxDQUFDNWUsWUFBWSxDQUFDNmUsaUJBQWlCLENBQUNGLGFBQWEsRUFBRUMscUJBQXFCLENBQUMsR0FBRzllLFNBQVM7VUFDdkpxZSxTQUFTLEdBQUcsT0FBT0csTUFBTSxFQUFFakssTUFBTSxFQUFFeUssU0FBUyxFQUFFcFUsVUFBVSxFQUFFQyxhQUFhLEVBQUV3SixPQUFPLEVBQUU0SyxVQUFVLEVBQUVDLFFBQVEsS0FBSyxNQUFNLElBQUksQ0FBQ2hmLFlBQVksQ0FBQ2lmLGdCQUFnQixDQUFDWCxNQUFNLEVBQUVqSyxNQUFNLEVBQUV5SyxTQUFTLEVBQUVwVSxVQUFVLEVBQUVDLGFBQWEsRUFBRXdKLE9BQU8sRUFBRTRLLFVBQVUsRUFBRUMsUUFBUSxDQUFDLEdBQUdsZixTQUFTO1VBQ3BQcWUsU0FBUyxHQUFHLE9BQU9HLE1BQU0sRUFBRWpLLE1BQU0sRUFBRXlLLFNBQVMsRUFBRUksYUFBYSxFQUFFQyxnQkFBZ0IsRUFBRWhMLE9BQU8sRUFBRTRLLFVBQVUsRUFBRUMsUUFBUSxLQUFLLE1BQU0sSUFBSSxDQUFDaGYsWUFBWSxDQUFDb2YsYUFBYSxDQUFDZCxNQUFNLEVBQUVqSyxNQUFNLEVBQUV5SyxTQUFTLEVBQUVJLGFBQWEsRUFBRUMsZ0JBQWdCLEVBQUVoTCxPQUFPLEVBQUU0SyxVQUFVLEVBQUVDLFFBQVEsQ0FBQyxHQUFHbGY7UUFDeFAsQ0FBQztNQUNILENBQUMsQ0FBQztJQUNKLENBQUMsQ0FBQztFQUNKOztFQUVBLE9BQU91ZixhQUFhQSxDQUFDQyxLQUFLLEVBQUU7SUFDMUIsS0FBSyxJQUFJNU4sRUFBRSxJQUFJNE4sS0FBSyxDQUFDOVIsTUFBTSxDQUFDLENBQUMsRUFBRXZPLGdCQUFnQixDQUFDc2dCLGdCQUFnQixDQUFDN04sRUFBRSxDQUFDO0lBQ3BFLE9BQU80TixLQUFLO0VBQ2Q7O0VBRUEsT0FBT0MsZ0JBQWdCQSxDQUFDN04sRUFBRSxFQUFFO0lBQzFCLElBQUFsUixlQUFNLEVBQUNrUixFQUFFLFlBQVlXLHVCQUFjLENBQUM7SUFDcEMsT0FBT1gsRUFBRTtFQUNYOztFQUVBLE9BQU96RixlQUFlQSxDQUFDdVQsT0FBTyxFQUFFO0lBQzlCLElBQUlBLE9BQU8sQ0FBQy9TLGVBQWUsQ0FBQyxDQUFDLEVBQUU7TUFDN0IsS0FBSyxJQUFJZ1QsVUFBVSxJQUFJRCxPQUFPLENBQUMvUyxlQUFlLENBQUMsQ0FBQyxFQUFFdk4sa0NBQWdCLENBQUMrTixrQkFBa0IsQ0FBQ3dTLFVBQVUsQ0FBQztJQUNuRztJQUNBLE9BQU9ELE9BQU87RUFDaEI7O0VBRUEsT0FBT0UsaUJBQWlCQSxDQUFDM1IsYUFBYSxFQUFFO0lBQ3RDLElBQUk0UixVQUFVLEdBQUczYixJQUFJLENBQUNTLEtBQUssQ0FBQ1osaUJBQVEsQ0FBQ29ILGdCQUFnQixDQUFDOEMsYUFBYSxDQUFDLENBQUM7SUFDckUsSUFBSTZSLGtCQUF1QixHQUFHLENBQUMsQ0FBQztJQUNoQ0Esa0JBQWtCLENBQUNDLE1BQU0sR0FBRyxFQUFFO0lBQzlCLElBQUlGLFVBQVUsQ0FBQ0UsTUFBTSxFQUFFLEtBQUssSUFBSUMsU0FBUyxJQUFJSCxVQUFVLENBQUNFLE1BQU0sRUFBRUQsa0JBQWtCLENBQUNDLE1BQU0sQ0FBQzdULElBQUksQ0FBQy9NLGdCQUFnQixDQUFDb2dCLGFBQWEsQ0FBQyxJQUFJVSxvQkFBVyxDQUFDRCxTQUFTLEVBQUVDLG9CQUFXLENBQUNDLG1CQUFtQixDQUFDQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBQ3JNLE9BQU9MLGtCQUFrQjtFQUMzQjs7RUFFQSxPQUFPNVIsY0FBY0EsQ0FBQ1AsS0FBSyxFQUFFTSxhQUFhLEVBQUU7O0lBRTFDO0lBQ0EsSUFBSTZSLGtCQUFrQixHQUFHM2dCLGdCQUFnQixDQUFDeWdCLGlCQUFpQixDQUFDM1IsYUFBYSxDQUFDO0lBQzFFLElBQUk4UixNQUFNLEdBQUdELGtCQUFrQixDQUFDQyxNQUFNOztJQUV0QztJQUNBLElBQUlyTyxHQUFHLEdBQUcsRUFBRTtJQUNaLEtBQUssSUFBSThOLEtBQUssSUFBSU8sTUFBTSxFQUFFO01BQ3hCNWdCLGdCQUFnQixDQUFDb2dCLGFBQWEsQ0FBQ0MsS0FBSyxDQUFDO01BQ3JDLEtBQUssSUFBSTVOLEVBQUUsSUFBSTROLEtBQUssQ0FBQzlSLE1BQU0sQ0FBQyxDQUFDLEVBQUU7UUFDN0IsSUFBSThSLEtBQUssQ0FBQ25YLFNBQVMsQ0FBQyxDQUFDLEtBQUtySSxTQUFTLEVBQUU0UixFQUFFLENBQUN3TyxRQUFRLENBQUNwZ0IsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUM3RDBSLEdBQUcsQ0FBQ3hGLElBQUksQ0FBQzBGLEVBQUUsQ0FBQztNQUNkO0lBQ0Y7O0lBRUE7SUFDQSxJQUFJakUsS0FBSyxDQUFDMFMsU0FBUyxDQUFDLENBQUMsS0FBS3JnQixTQUFTLEVBQUU7TUFDbkMsSUFBSXNnQixLQUFLLEdBQUcsSUFBSUMsR0FBRyxDQUFDLENBQUM7TUFDckIsS0FBSyxJQUFJM08sRUFBRSxJQUFJRixHQUFHLEVBQUU0TyxLQUFLLENBQUMxTyxFQUFFLENBQUM0TyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUc1TyxFQUFFO01BQzVDLElBQUk2TyxTQUFTLEdBQUcsRUFBRTtNQUNsQixLQUFLLElBQUlsTSxNQUFNLElBQUk1RyxLQUFLLENBQUMwUyxTQUFTLENBQUMsQ0FBQyxFQUFFLElBQUlDLEtBQUssQ0FBQy9MLE1BQU0sQ0FBQyxLQUFLdlUsU0FBUyxFQUFFeWdCLFNBQVMsQ0FBQ3ZVLElBQUksQ0FBQ29VLEtBQUssQ0FBQy9MLE1BQU0sQ0FBQyxDQUFDO01BQ3BHN0MsR0FBRyxHQUFHK08sU0FBUztJQUNqQjs7SUFFQSxPQUFPL08sR0FBRztFQUNaOztFQUVBLE9BQU9uRCxvQkFBb0JBLENBQUNaLEtBQUssRUFBRU0sYUFBYSxFQUFFOztJQUVoRDtJQUNBLElBQUk2UixrQkFBa0IsR0FBRzNnQixnQkFBZ0IsQ0FBQ3lnQixpQkFBaUIsQ0FBQzNSLGFBQWEsQ0FBQztJQUMxRSxJQUFJOFIsTUFBTSxHQUFHRCxrQkFBa0IsQ0FBQ0MsTUFBTTs7SUFFdEM7SUFDQSxJQUFJVyxTQUFTLEdBQUcsRUFBRTtJQUNsQixLQUFLLElBQUlsQixLQUFLLElBQUlPLE1BQU0sRUFBRTtNQUN4QixLQUFLLElBQUluTyxFQUFFLElBQUk0TixLQUFLLENBQUM5UixNQUFNLENBQUMsQ0FBQyxFQUFFO1FBQzdCLElBQUk4UixLQUFLLENBQUNuWCxTQUFTLENBQUMsQ0FBQyxLQUFLckksU0FBUyxFQUFFNFIsRUFBRSxDQUFDd08sUUFBUSxDQUFDcGdCLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDN0QsSUFBSTRSLEVBQUUsQ0FBQytPLG1CQUFtQixDQUFDLENBQUMsS0FBSzNnQixTQUFTLEVBQUUwZ0IsU0FBUyxDQUFDeFUsSUFBSSxDQUFDMEYsRUFBRSxDQUFDK08sbUJBQW1CLENBQUMsQ0FBQyxDQUFDO1FBQ3BGLElBQUkvTyxFQUFFLENBQUNzTCxvQkFBb0IsQ0FBQyxDQUFDLEtBQUtsZCxTQUFTLEVBQUU7VUFDM0MsS0FBSyxJQUFJNGdCLFFBQVEsSUFBSWhQLEVBQUUsQ0FBQ3NMLG9CQUFvQixDQUFDLENBQUMsRUFBRXdELFNBQVMsQ0FBQ3hVLElBQUksQ0FBQzBVLFFBQVEsQ0FBQztRQUMxRTtNQUNGO0lBQ0Y7O0lBRUEsT0FBT0YsU0FBUztFQUNsQjs7RUFFQSxPQUFPL1Isa0JBQWtCQSxDQUFDaEIsS0FBSyxFQUFFTSxhQUFhLEVBQUU7O0lBRTlDO0lBQ0EsSUFBSTZSLGtCQUFrQixHQUFHM2dCLGdCQUFnQixDQUFDeWdCLGlCQUFpQixDQUFDM1IsYUFBYSxDQUFDO0lBQzFFLElBQUk4UixNQUFNLEdBQUdELGtCQUFrQixDQUFDQyxNQUFNOztJQUV0QztJQUNBLElBQUljLE9BQU8sR0FBRyxFQUFFO0lBQ2hCLEtBQUssSUFBSXJCLEtBQUssSUFBSU8sTUFBTSxFQUFFO01BQ3hCLEtBQUssSUFBSW5PLEVBQUUsSUFBSTROLEtBQUssQ0FBQzlSLE1BQU0sQ0FBQyxDQUFDLEVBQUU7UUFDN0IsS0FBSyxJQUFJb1QsTUFBTSxJQUFJbFAsRUFBRSxDQUFDcEQsVUFBVSxDQUFDLENBQUMsRUFBRXFTLE9BQU8sQ0FBQzNVLElBQUksQ0FBQzRVLE1BQU0sQ0FBQztNQUMxRDtJQUNGOztJQUVBLE9BQU9ELE9BQU87RUFDaEI7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtFQUNZRSxrQkFBa0JBLENBQUM3QyxlQUFlLEVBQUU7SUFDNUMsSUFBSSxDQUFDQSxlQUFlLEdBQUdBLGVBQWU7RUFDeEM7O0VBRUEsYUFBYXJZLE1BQU1BLENBQUNyRyxJQUFJLEVBQUU2QyxNQUFNLEVBQUU7O0lBRWhDO0lBQ0EsSUFBSTJlLGFBQUksQ0FBQ0MsU0FBUyxDQUFDNWUsTUFBTSxDQUFDN0MsSUFBSSxDQUFDLEtBQUt3aEIsYUFBSSxDQUFDQyxTQUFTLENBQUN6aEIsSUFBSSxDQUFDLEVBQUU7TUFDeEQsT0FBTzZDLE1BQU0sQ0FBQ2dDLElBQUksQ0FBQyxDQUFDO0lBQ3RCOztJQUVBLE9BQU85RCxxQkFBWSxDQUFDb0QsU0FBUyxDQUFDLFlBQVk7TUFDeEMsSUFBSSxNQUFNdEIsTUFBTSxDQUFDNmUsUUFBUSxDQUFDLENBQUMsRUFBRSxNQUFNLElBQUl2Z0Isb0JBQVcsQ0FBQyxrQkFBa0IsQ0FBQztNQUN0RSxJQUFJLENBQUNuQixJQUFJLEVBQUUsTUFBTSxJQUFJbUIsb0JBQVcsQ0FBQyx5Q0FBeUMsQ0FBQzs7TUFFM0U7TUFDQSxJQUFJd2dCLFNBQVMsR0FBR0gsYUFBSSxDQUFDSSxPQUFPLENBQUM1aEIsSUFBSSxDQUFDO01BQ2xDLElBQUksRUFBQyxNQUFNZSxxQkFBWSxDQUFDSyxNQUFNLENBQUN5QixNQUFNLENBQUMzQyxFQUFFLEVBQUV5aEIsU0FBUyxDQUFDLEdBQUU7UUFDcEQsSUFBSSxDQUFFLE1BQU05ZSxNQUFNLENBQUMzQyxFQUFFLENBQUMyaEIsS0FBSyxDQUFDRixTQUFTLENBQUMsQ0FBRTtRQUN4QyxPQUFPcFosR0FBUSxFQUFFLENBQUUsTUFBTSxJQUFJcEgsb0JBQVcsQ0FBQyxtQkFBbUIsR0FBR25CLElBQUksR0FBRyx5Q0FBeUMsR0FBR3VJLEdBQUcsQ0FBQ0MsT0FBTyxDQUFDLENBQUU7TUFDbEk7O01BRUE7TUFDQSxNQUFNc1osSUFBSSxHQUFHLE1BQU1qZixNQUFNLENBQUMrWSxPQUFPLENBQUMsQ0FBQzs7TUFFbkM7TUFDQSxNQUFNL1ksTUFBTSxDQUFDM0MsRUFBRSxDQUFDNmhCLFNBQVMsQ0FBQy9oQixJQUFJLEdBQUcsT0FBTyxFQUFFOGhCLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUM7TUFDNUQsTUFBTWpmLE1BQU0sQ0FBQzNDLEVBQUUsQ0FBQzZoQixTQUFTLENBQUMvaEIsSUFBSSxFQUFFOGhCLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUM7TUFDbEQsTUFBTWpmLE1BQU0sQ0FBQzNDLEVBQUUsQ0FBQzZoQixTQUFTLENBQUMvaEIsSUFBSSxHQUFHLGNBQWMsRUFBRSxNQUFNNkMsTUFBTSxDQUFDaEIsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO01BQ2xGLElBQUltZ0IsT0FBTyxHQUFHbmYsTUFBTSxDQUFDN0MsSUFBSTtNQUN6QjZDLE1BQU0sQ0FBQzdDLElBQUksR0FBR0EsSUFBSTs7TUFFbEI7TUFDQSxJQUFJZ2lCLE9BQU8sRUFBRTtRQUNYLE1BQU1uZixNQUFNLENBQUMzQyxFQUFFLENBQUMraEIsTUFBTSxDQUFDRCxPQUFPLEdBQUcsY0FBYyxDQUFDO1FBQ2hELE1BQU1uZixNQUFNLENBQUMzQyxFQUFFLENBQUMraEIsTUFBTSxDQUFDRCxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3pDLE1BQU1uZixNQUFNLENBQUMzQyxFQUFFLENBQUMraEIsTUFBTSxDQUFDRCxPQUFPLENBQUM7TUFDakM7SUFDRixDQUFDLENBQUM7RUFDSjs7RUFFQSxhQUFhbmQsSUFBSUEsQ0FBQ2hDLE1BQVcsRUFBRTtJQUM3QixPQUFPOUIscUJBQVksQ0FBQ29ELFNBQVMsQ0FBQyxZQUFZO01BQ3hDLElBQUksTUFBTXRCLE1BQU0sQ0FBQzZlLFFBQVEsQ0FBQyxDQUFDLEVBQUUsTUFBTSxJQUFJdmdCLG9CQUFXLENBQUMsa0JBQWtCLENBQUM7O01BRXRFO01BQ0EsSUFBSW5CLElBQUksR0FBRyxNQUFNNkMsTUFBTSxDQUFDSixPQUFPLENBQUMsQ0FBQztNQUNqQyxJQUFJLENBQUN6QyxJQUFJLEVBQUUsTUFBTSxJQUFJbUIsb0JBQVcsQ0FBQyw0Q0FBNEMsQ0FBQzs7TUFFOUU7TUFDQSxNQUFNMmdCLElBQUksR0FBRyxNQUFNamYsTUFBTSxDQUFDK1ksT0FBTyxDQUFDLENBQUM7O01BRW5DO01BQ0EsSUFBSXNHLE9BQU8sR0FBR2xpQixJQUFJLEdBQUcsTUFBTTtNQUMzQixNQUFNNkMsTUFBTSxDQUFDM0MsRUFBRSxDQUFDNmhCLFNBQVMsQ0FBQ0csT0FBTyxHQUFHLE9BQU8sRUFBRUosSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQztNQUMvRCxNQUFNamYsTUFBTSxDQUFDM0MsRUFBRSxDQUFDNmhCLFNBQVMsQ0FBQ0csT0FBTyxFQUFFSixJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDO01BQ3JELE1BQU1qZixNQUFNLENBQUMzQyxFQUFFLENBQUM2aEIsU0FBUyxDQUFDRyxPQUFPLEdBQUcsY0FBYyxFQUFFLE1BQU1yZixNQUFNLENBQUNoQixpQkFBaUIsQ0FBQyxDQUFDLENBQUM7O01BRXJGO01BQ0EsTUFBTWdCLE1BQU0sQ0FBQzNDLEVBQUUsQ0FBQ2lpQixNQUFNLENBQUNELE9BQU8sR0FBRyxPQUFPLEVBQUVsaUIsSUFBSSxHQUFHLE9BQU8sQ0FBQztNQUN6RCxNQUFNNkMsTUFBTSxDQUFDM0MsRUFBRSxDQUFDaWlCLE1BQU0sQ0FBQ0QsT0FBTyxFQUFFbGlCLElBQUksQ0FBQztNQUNyQyxNQUFNNkMsTUFBTSxDQUFDM0MsRUFBRSxDQUFDaWlCLE1BQU0sQ0FBQ0QsT0FBTyxHQUFHLGNBQWMsRUFBRWxpQixJQUFJLEdBQUcsY0FBYyxDQUFDO0lBQ3pFLENBQUMsQ0FBQztFQUNKO0FBQ0Y7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUpBb2lCLE9BQUEsQ0FBQUMsT0FBQSxHQUFBMWlCLGdCQUFBO0FBS0EsTUFBTThELHFCQUFxQixTQUFTNmUsdUNBQXFCLENBQUM7O0VBRXhEOzs7OztFQUtBOztFQUVBLGFBQWF4ZixjQUFjQSxDQUFDdkIsTUFBbUMsRUFBRTtJQUMvRCxJQUFJZ2hCLFFBQVEsR0FBR2hlLGlCQUFRLENBQUNDLE9BQU8sQ0FBQyxDQUFDO0lBQ2pDLElBQUlqRCxNQUFNLENBQUN0QixRQUFRLEtBQUtPLFNBQVMsRUFBRWUsTUFBTSxDQUFDdEIsUUFBUSxHQUFHLEVBQUU7SUFDdkQsSUFBSTRELGdCQUFnQixHQUFHdEMsTUFBTSxDQUFDYyxTQUFTLENBQUMsQ0FBQztJQUN6QyxNQUFNdEIscUJBQVksQ0FBQ3loQixZQUFZLENBQUNELFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxDQUFDaGhCLE1BQU0sQ0FBQ3ZCLElBQUksRUFBRXVCLE1BQU0sQ0FBQ3RCLFFBQVEsRUFBRXNCLE1BQU0sQ0FBQzJjLFdBQVcsRUFBRTNjLE1BQU0sQ0FBQ2dkLFFBQVEsRUFBRWhkLE1BQU0sQ0FBQ2lkLFNBQVMsRUFBRTNhLGdCQUFnQixHQUFHQSxnQkFBZ0IsQ0FBQ2UsTUFBTSxDQUFDLENBQUMsR0FBR3BFLFNBQVMsQ0FBQyxDQUFDO0lBQzVNLElBQUlxQyxNQUFNLEdBQUcsSUFBSVkscUJBQXFCLENBQUM4ZSxRQUFRLEVBQUUsTUFBTXhoQixxQkFBWSxDQUFDMGhCLFNBQVMsQ0FBQyxDQUFDLEVBQUVsaEIsTUFBTSxDQUFDdkIsSUFBSSxFQUFFdUIsTUFBTSxDQUFDaEIsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUM3RyxJQUFJZ0IsTUFBTSxDQUFDdkIsSUFBSSxFQUFFLE1BQU02QyxNQUFNLENBQUNnQyxJQUFJLENBQUMsQ0FBQztJQUNwQyxPQUFPaEMsTUFBTTtFQUNmOztFQUVBLGFBQWFLLFlBQVlBLENBQUMzQixNQUFNLEVBQUU7SUFDaEMsSUFBSUEsTUFBTSxDQUFDa0IsT0FBTyxDQUFDLENBQUMsS0FBSSxNQUFNOUMsZ0JBQWdCLENBQUNzQixZQUFZLENBQUNNLE1BQU0sQ0FBQ2tCLE9BQU8sQ0FBQyxDQUFDLEVBQUVsQixNQUFNLENBQUNoQixLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUUsTUFBTSxJQUFJWSxvQkFBVyxDQUFDLHlCQUF5QixHQUFHSSxNQUFNLENBQUNrQixPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQ2xLLElBQUk4ZixRQUFRLEdBQUdoZSxpQkFBUSxDQUFDQyxPQUFPLENBQUMsQ0FBQztJQUNqQyxNQUFNekQscUJBQVksQ0FBQ3loQixZQUFZLENBQUNELFFBQVEsRUFBRSxrQkFBa0IsRUFBRSxDQUFDaGhCLE1BQU0sQ0FBQ3FELE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNoRixJQUFJL0IsTUFBTSxHQUFHLElBQUlZLHFCQUFxQixDQUFDOGUsUUFBUSxFQUFFLE1BQU14aEIscUJBQVksQ0FBQzBoQixTQUFTLENBQUMsQ0FBQyxFQUFFbGhCLE1BQU0sQ0FBQ2tCLE9BQU8sQ0FBQyxDQUFDLEVBQUVsQixNQUFNLENBQUNoQixLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQ2xILElBQUlnQixNQUFNLENBQUNrQixPQUFPLENBQUMsQ0FBQyxFQUFFLE1BQU1JLE1BQU0sQ0FBQ2dDLElBQUksQ0FBQyxDQUFDO0lBQ3pDLE9BQU9oQyxNQUFNO0VBQ2Y7O0VBRUE7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UvQyxXQUFXQSxDQUFDeWlCLFFBQVEsRUFBRUcsTUFBTSxFQUFFMWlCLElBQUksRUFBRUUsRUFBRSxFQUFFO0lBQ3RDLEtBQUssQ0FBQ3FpQixRQUFRLEVBQUVHLE1BQU0sQ0FBQztJQUN2QixJQUFJLENBQUMxaUIsSUFBSSxHQUFHQSxJQUFJO0lBQ2hCLElBQUksQ0FBQ0UsRUFBRSxHQUFHQSxFQUFFLEdBQUdBLEVBQUUsR0FBSUYsSUFBSSxHQUFHTCxnQkFBZ0IsQ0FBQ1ksS0FBSyxDQUFDLENBQUMsR0FBR0MsU0FBVTtJQUNqRSxJQUFJLENBQUNtaUIsZ0JBQWdCLEdBQUcsRUFBRTtFQUM1Qjs7RUFFQWxnQixPQUFPQSxDQUFBLEVBQUc7SUFDUixPQUFPLElBQUksQ0FBQ3pDLElBQUk7RUFDbEI7O0VBRUEsTUFBTW1ELGNBQWNBLENBQUEsRUFBRztJQUNyQixPQUFPLElBQUksQ0FBQ3FmLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBQztFQUM1Qzs7RUFFQSxNQUFNeFUsa0JBQWtCQSxDQUFDNUMsVUFBVSxFQUFFQyxhQUFhLEVBQUU0QixLQUFLLEVBQUU7SUFDekQsT0FBTyxJQUFJLENBQUN1VixZQUFZLENBQUMsb0JBQW9CLEVBQUU3UCxLQUFLLENBQUNrSyxJQUFJLENBQUMrRixTQUFTLENBQUMsQ0FBQztFQUN2RTs7RUFFQSxNQUFNNWYsbUJBQW1CQSxDQUFDNmYsa0JBQWtCLEVBQUVqYyxTQUFVLEVBQUU7SUFDeEQsSUFBSSxDQUFDaWMsa0JBQWtCLEVBQUUsTUFBTSxJQUFJLENBQUNMLFlBQVksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDaGlCLFNBQVMsRUFBRW9HLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFDM0Y7TUFDSCxJQUFJQyxVQUFVLEdBQUcsQ0FBQ2djLGtCQUFrQixHQUFHcmlCLFNBQVMsR0FBR3FpQixrQkFBa0IsWUFBWS9iLDRCQUFtQixHQUFHK2Isa0JBQWtCLEdBQUcsSUFBSS9iLDRCQUFtQixDQUFDK2Isa0JBQWtCLENBQUM7TUFDdkssTUFBTSxJQUFJLENBQUNMLFlBQVksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDM2IsVUFBVSxHQUFHQSxVQUFVLENBQUNpYyxTQUFTLENBQUMsQ0FBQyxHQUFHdGlCLFNBQVMsRUFBRW9HLFNBQVMsQ0FBQyxDQUFDO0lBQzlHO0VBQ0Y7O0VBRUEsTUFBTVcsZUFBZUEsQ0FBQSxFQUFHO0lBQ3RCLE9BQU8sSUFBSSxDQUFDaWIsWUFBWSxDQUFDLGlCQUFpQixDQUFDO0VBQzdDOztFQUVBLE1BQU0vYSxtQkFBbUJBLENBQUEsRUFBRztJQUMxQixJQUFJc2IsU0FBUyxHQUFHLE1BQU0sSUFBSSxDQUFDUCxZQUFZLENBQUMscUJBQXFCLENBQUM7SUFDOUQsT0FBT08sU0FBUyxHQUFHLElBQUlqYyw0QkFBbUIsQ0FBQ2ljLFNBQVMsQ0FBQyxHQUFHdmlCLFNBQVM7RUFDbkU7O0VBRUEsTUFBTXFILG1CQUFtQkEsQ0FBQSxFQUFHO0lBQzFCLE9BQU8sSUFBSSxDQUFDMmEsWUFBWSxDQUFDLHFCQUFxQixDQUFDO0VBQ2pEOztFQUVBLE1BQU14Z0IsZ0JBQWdCQSxDQUFBLEVBQUc7SUFDdkIsT0FBTyxJQUFJLENBQUN3Z0IsWUFBWSxDQUFDLGtCQUFrQixDQUFDO0VBQzlDOztFQUVBLE1BQU16ZSxnQkFBZ0JBLENBQUNvQyxhQUFhLEVBQUU7SUFDcEMsT0FBTyxJQUFJLENBQUNxYyxZQUFZLENBQUMsa0JBQWtCLEVBQUUsQ0FBQ3JjLGFBQWEsQ0FBQyxDQUFDO0VBQy9EOztFQUVBLE1BQU00QyxlQUFlQSxDQUFBLEVBQUc7SUFDdEIsT0FBTyxJQUFJLENBQUN5WixZQUFZLENBQUMsaUJBQWlCLENBQUM7RUFDN0M7O0VBRUEsTUFBTWhkLHNCQUFzQkEsQ0FBQSxFQUFHO0lBQzdCLE9BQU8sSUFBSSxDQUFDZ2QsWUFBWSxDQUFDLHdCQUF3QixDQUFDO0VBQ3BEOztFQUVBLE1BQU12WixlQUFlQSxDQUFDQyxJQUFJLEVBQUVDLEtBQUssRUFBRUMsR0FBRyxFQUFFO0lBQ3RDLE9BQU8sSUFBSSxDQUFDb1osWUFBWSxDQUFDLGlCQUFpQixFQUFFLENBQUN0WixJQUFJLEVBQUVDLEtBQUssRUFBRUMsR0FBRyxDQUFDLENBQUM7RUFDakU7O0VBRUEsTUFBTXZELGNBQWNBLENBQUEsRUFBRztJQUNyQixPQUFPLElBQUksQ0FBQzJjLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBQztFQUM1Qzs7RUFFQSxNQUFNM1osU0FBU0EsQ0FBQSxFQUFHO0lBQ2hCLE9BQU8sSUFBSSxDQUFDMlosWUFBWSxDQUFDLFdBQVcsQ0FBQztFQUN2Qzs7RUFFQSxNQUFNbGMsV0FBV0EsQ0FBQ0MsUUFBUSxFQUFFO0lBQzFCLElBQUl5YyxlQUFlLEdBQUcsSUFBSUMsb0JBQW9CLENBQUMxYyxRQUFRLENBQUM7SUFDeEQsSUFBSTJjLFVBQVUsR0FBR0YsZUFBZSxDQUFDRyxLQUFLLENBQUMsQ0FBQztJQUN4Q3BpQixxQkFBWSxDQUFDcWlCLGlCQUFpQixDQUFDLElBQUksQ0FBQ2IsUUFBUSxFQUFFLGlCQUFpQixHQUFHVyxVQUFVLEVBQUUsQ0FBQ0YsZUFBZSxDQUFDN0QsY0FBYyxFQUFFNkQsZUFBZSxDQUFDLENBQUM7SUFDaElqaUIscUJBQVksQ0FBQ3FpQixpQkFBaUIsQ0FBQyxJQUFJLENBQUNiLFFBQVEsRUFBRSxhQUFhLEdBQUdXLFVBQVUsRUFBRSxDQUFDRixlQUFlLENBQUM1RCxVQUFVLEVBQUU0RCxlQUFlLENBQUMsQ0FBQztJQUN4SGppQixxQkFBWSxDQUFDcWlCLGlCQUFpQixDQUFDLElBQUksQ0FBQ2IsUUFBUSxFQUFFLG9CQUFvQixHQUFHVyxVQUFVLEVBQUUsQ0FBQ0YsZUFBZSxDQUFDekQsaUJBQWlCLEVBQUV5RCxlQUFlLENBQUMsQ0FBQztJQUN0SWppQixxQkFBWSxDQUFDcWlCLGlCQUFpQixDQUFDLElBQUksQ0FBQ2IsUUFBUSxFQUFFLG1CQUFtQixHQUFHVyxVQUFVLEVBQUUsQ0FBQ0YsZUFBZSxDQUFDckQsZ0JBQWdCLEVBQUVxRCxlQUFlLENBQUMsQ0FBQztJQUNwSWppQixxQkFBWSxDQUFDcWlCLGlCQUFpQixDQUFDLElBQUksQ0FBQ2IsUUFBUSxFQUFFLGdCQUFnQixHQUFHVyxVQUFVLEVBQUUsQ0FBQ0YsZUFBZSxDQUFDbEQsYUFBYSxFQUFFa0QsZUFBZSxDQUFDLENBQUM7SUFDOUgsSUFBSSxDQUFDTCxnQkFBZ0IsQ0FBQ2pXLElBQUksQ0FBQ3NXLGVBQWUsQ0FBQztJQUMzQyxPQUFPLElBQUksQ0FBQ1IsWUFBWSxDQUFDLGFBQWEsRUFBRSxDQUFDVSxVQUFVLENBQUMsQ0FBQztFQUN2RDs7RUFFQSxNQUFNemMsY0FBY0EsQ0FBQ0YsUUFBUSxFQUFFO0lBQzdCLEtBQUssSUFBSThWLENBQUMsR0FBRyxDQUFDLEVBQUVBLENBQUMsR0FBRyxJQUFJLENBQUNzRyxnQkFBZ0IsQ0FBQ2hOLE1BQU0sRUFBRTBHLENBQUMsRUFBRSxFQUFFO01BQ3JELElBQUksSUFBSSxDQUFDc0csZ0JBQWdCLENBQUN0RyxDQUFDLENBQUMsQ0FBQ2dILFdBQVcsQ0FBQyxDQUFDLEtBQUs5YyxRQUFRLEVBQUU7UUFDdkQsSUFBSTJjLFVBQVUsR0FBRyxJQUFJLENBQUNQLGdCQUFnQixDQUFDdEcsQ0FBQyxDQUFDLENBQUM4RyxLQUFLLENBQUMsQ0FBQztRQUNqRCxNQUFNLElBQUksQ0FBQ1gsWUFBWSxDQUFDLGdCQUFnQixFQUFFLENBQUNVLFVBQVUsQ0FBQyxDQUFDO1FBQ3ZEbmlCLHFCQUFZLENBQUN1aUIsb0JBQW9CLENBQUMsSUFBSSxDQUFDZixRQUFRLEVBQUUsaUJBQWlCLEdBQUdXLFVBQVUsQ0FBQztRQUNoRm5pQixxQkFBWSxDQUFDdWlCLG9CQUFvQixDQUFDLElBQUksQ0FBQ2YsUUFBUSxFQUFFLGFBQWEsR0FBR1csVUFBVSxDQUFDO1FBQzVFbmlCLHFCQUFZLENBQUN1aUIsb0JBQW9CLENBQUMsSUFBSSxDQUFDZixRQUFRLEVBQUUsb0JBQW9CLEdBQUdXLFVBQVUsQ0FBQztRQUNuRm5pQixxQkFBWSxDQUFDdWlCLG9CQUFvQixDQUFDLElBQUksQ0FBQ2YsUUFBUSxFQUFFLG1CQUFtQixHQUFHVyxVQUFVLENBQUM7UUFDbEZuaUIscUJBQVksQ0FBQ3VpQixvQkFBb0IsQ0FBQyxJQUFJLENBQUNmLFFBQVEsRUFBRSxnQkFBZ0IsR0FBR1csVUFBVSxDQUFDO1FBQy9FLElBQUksQ0FBQ1AsZ0JBQWdCLENBQUNZLE1BQU0sQ0FBQ2xILENBQUMsRUFBRSxDQUFDLENBQUM7UUFDbEM7TUFDRjtJQUNGO0lBQ0EsTUFBTSxJQUFJbGIsb0JBQVcsQ0FBQyx3Q0FBd0MsQ0FBQztFQUNqRTs7RUFFQXVGLFlBQVlBLENBQUEsRUFBRztJQUNiLElBQUlwRyxTQUFTLEdBQUcsRUFBRTtJQUNsQixLQUFLLElBQUkwaUIsZUFBZSxJQUFJLElBQUksQ0FBQ0wsZ0JBQWdCLEVBQUVyaUIsU0FBUyxDQUFDb00sSUFBSSxDQUFDc1csZUFBZSxDQUFDSyxXQUFXLENBQUMsQ0FBQyxDQUFDO0lBQ2hHLE9BQU8vaUIsU0FBUztFQUNsQjs7RUFFQSxNQUFNeUYsUUFBUUEsQ0FBQSxFQUFHO0lBQ2YsT0FBTyxJQUFJLENBQUN5YyxZQUFZLENBQUMsVUFBVSxDQUFDO0VBQ3RDOztFQUVBLE1BQU1sWixJQUFJQSxDQUFDQyxxQkFBcUQsRUFBRUMsV0FBb0IsRUFBRUMsb0JBQW9CLEdBQUcsS0FBSyxFQUE2Qjs7SUFFL0k7SUFDQUQsV0FBVyxHQUFHRCxxQkFBcUIsWUFBWUcsNkJBQW9CLEdBQUdGLFdBQVcsR0FBR0QscUJBQXFCO0lBQ3pHLElBQUloRCxRQUFRLEdBQUdnRCxxQkFBcUIsWUFBWUcsNkJBQW9CLEdBQUdILHFCQUFxQixHQUFHL0ksU0FBUztJQUN4RyxJQUFJZ0osV0FBVyxLQUFLaEosU0FBUyxFQUFFZ0osV0FBVyxHQUFHRyxJQUFJLENBQUNDLEdBQUcsQ0FBQyxNQUFNLElBQUksQ0FBQ2YsU0FBUyxDQUFDLENBQUMsRUFBRSxNQUFNLElBQUksQ0FBQzdHLGdCQUFnQixDQUFDLENBQUMsQ0FBQzs7SUFFNUc7SUFDQSxJQUFJdUUsUUFBUSxFQUFFLE1BQU0sSUFBSSxDQUFDRCxXQUFXLENBQUNDLFFBQVEsQ0FBQzs7SUFFOUM7SUFDQSxJQUFJZ0MsR0FBRztJQUNQLElBQUlKLE1BQU07SUFDVixJQUFJO01BQ0YsSUFBSTJILFVBQVUsR0FBRyxNQUFNLElBQUksQ0FBQzBTLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQ2haLFdBQVcsRUFBRUMsb0JBQW9CLENBQUMsQ0FBQztNQUNyRnRCLE1BQU0sR0FBRyxJQUFJNkIseUJBQWdCLENBQUM4RixVQUFVLENBQUM3RixnQkFBZ0IsRUFBRTZGLFVBQVUsQ0FBQzVGLGFBQWEsQ0FBQztJQUN0RixDQUFDLENBQUMsT0FBT0MsQ0FBQyxFQUFFO01BQ1Y1QixHQUFHLEdBQUc0QixDQUFDO0lBQ1Q7O0lBRUE7SUFDQSxJQUFJNUQsUUFBUSxFQUFFLE1BQU0sSUFBSSxDQUFDRSxjQUFjLENBQUNGLFFBQVEsQ0FBQzs7SUFFakQ7SUFDQSxJQUFJZ0MsR0FBRyxFQUFFLE1BQU1BLEdBQUc7SUFDbEIsT0FBT0osTUFBTTtFQUNmOztFQUVBLE1BQU1pQyxZQUFZQSxDQUFDdEosY0FBYyxFQUFFO0lBQ2pDLE9BQU8sSUFBSSxDQUFDMGhCLFlBQVksQ0FBQyxjQUFjLEVBQUU3UCxLQUFLLENBQUNrSyxJQUFJLENBQUMrRixTQUFTLENBQUMsQ0FBQztFQUNqRTs7RUFFQSxNQUFNblksV0FBV0EsQ0FBQSxFQUFHO0lBQ2xCLE9BQU8sSUFBSSxDQUFDK1gsWUFBWSxDQUFDLGFBQWEsQ0FBQztFQUN6Qzs7RUFFQSxNQUFNNVgsT0FBT0EsQ0FBQ0MsUUFBUSxFQUFFO0lBQ3RCLElBQUEzSixlQUFNLEVBQUN5UixLQUFLLENBQUNDLE9BQU8sQ0FBQy9ILFFBQVEsQ0FBQyxFQUFFLDZDQUE2QyxDQUFDO0lBQzlFLE9BQU8sSUFBSSxDQUFDMlgsWUFBWSxDQUFDLFNBQVMsRUFBRSxDQUFDM1gsUUFBUSxDQUFDLENBQUM7RUFDakQ7O0VBRUEsTUFBTUUsV0FBV0EsQ0FBQSxFQUFHO0lBQ2xCLE9BQU8sSUFBSSxDQUFDeVgsWUFBWSxDQUFDLGFBQWEsQ0FBQztFQUN6Qzs7RUFFQSxNQUFNdlgsZ0JBQWdCQSxDQUFBLEVBQUc7SUFDdkIsT0FBTyxJQUFJLENBQUN1WCxZQUFZLENBQUMsa0JBQWtCLENBQUM7RUFDOUM7O0VBRUEsTUFBTXJYLFVBQVVBLENBQUNDLFVBQVUsRUFBRUMsYUFBYSxFQUFFO0lBQzFDLE9BQU9LLE1BQU0sQ0FBQyxNQUFNLElBQUksQ0FBQzhXLFlBQVksQ0FBQyxZQUFZLEVBQUU3UCxLQUFLLENBQUNrSyxJQUFJLENBQUMrRixTQUFTLENBQUMsQ0FBQyxDQUFDO0VBQzdFOztFQUVBLE1BQU0vVyxrQkFBa0JBLENBQUNULFVBQVUsRUFBRUMsYUFBYSxFQUFFO0lBQ2xELElBQUlTLGtCQUFrQixHQUFHLE1BQU0sSUFBSSxDQUFDMFcsWUFBWSxDQUFDLG9CQUFvQixFQUFFN1AsS0FBSyxDQUFDa0ssSUFBSSxDQUFDK0YsU0FBUyxDQUFDLENBQUM7SUFDN0YsT0FBT2xYLE1BQU0sQ0FBQ0ksa0JBQWtCLENBQUM7RUFDbkM7O0VBRUEsTUFBTUssV0FBV0EsQ0FBQ0MsbUJBQW1CLEVBQUVDLEdBQUcsRUFBRTtJQUMxQyxJQUFJRyxRQUFRLEdBQUcsRUFBRTtJQUNqQixLQUFLLElBQUlDLFdBQVcsSUFBSyxNQUFNLElBQUksQ0FBQytWLFlBQVksQ0FBQyxhQUFhLEVBQUU3UCxLQUFLLENBQUNrSyxJQUFJLENBQUMrRixTQUFTLENBQUMsQ0FBQyxFQUFHO01BQ3ZGcFcsUUFBUSxDQUFDRSxJQUFJLENBQUMvTSxnQkFBZ0IsQ0FBQ2dOLGVBQWUsQ0FBQyxJQUFJQyxzQkFBYSxDQUFDSCxXQUFXLENBQUMsQ0FBQyxDQUFDO0lBQ2pGO0lBQ0EsT0FBT0QsUUFBUTtFQUNqQjs7RUFFQSxNQUFNSyxVQUFVQSxDQUFDekIsVUFBVSxFQUFFZ0IsbUJBQW1CLEVBQUU7SUFDaEQsSUFBSUssV0FBVyxHQUFHLE1BQU0sSUFBSSxDQUFDK1YsWUFBWSxDQUFDLFlBQVksRUFBRTdQLEtBQUssQ0FBQ2tLLElBQUksQ0FBQytGLFNBQVMsQ0FBQyxDQUFDO0lBQzlFLE9BQU9qakIsZ0JBQWdCLENBQUNnTixlQUFlLENBQUMsSUFBSUMsc0JBQWEsQ0FBQ0gsV0FBVyxDQUFDLENBQUM7RUFDekU7O0VBRUEsTUFBTU8sYUFBYUEsQ0FBQ0MsS0FBSyxFQUFFO0lBQ3pCLElBQUlSLFdBQVcsR0FBRyxNQUFNLElBQUksQ0FBQytWLFlBQVksQ0FBQyxlQUFlLEVBQUU3UCxLQUFLLENBQUNrSyxJQUFJLENBQUMrRixTQUFTLENBQUMsQ0FBQztJQUNqRixPQUFPampCLGdCQUFnQixDQUFDZ04sZUFBZSxDQUFDLElBQUlDLHNCQUFhLENBQUNILFdBQVcsQ0FBQyxDQUFDO0VBQ3pFOztFQUVBLE1BQU1VLGVBQWVBLENBQUMvQixVQUFVLEVBQUVnQyxpQkFBaUIsRUFBRTtJQUNuRCxJQUFJSyxZQUFZLEdBQUcsRUFBRTtJQUNyQixLQUFLLElBQUlDLGNBQWMsSUFBSyxNQUFNLElBQUksQ0FBQzhVLFlBQVksQ0FBQyxpQkFBaUIsRUFBRTdQLEtBQUssQ0FBQ2tLLElBQUksQ0FBQytGLFNBQVMsQ0FBQyxDQUFDLEVBQUc7TUFDOUZuVixZQUFZLENBQUNmLElBQUksQ0FBQzlNLGtDQUFnQixDQUFDK04sa0JBQWtCLENBQUMsSUFBSUMseUJBQWdCLENBQUNGLGNBQWMsQ0FBQyxDQUFDLENBQUM7SUFDOUY7SUFDQSxPQUFPRCxZQUFZO0VBQ3JCOztFQUVBLE1BQU1JLGdCQUFnQkEsQ0FBQ3pDLFVBQVUsRUFBRTZCLEtBQUssRUFBRTtJQUN4QyxJQUFJUyxjQUFjLEdBQUcsTUFBTSxJQUFJLENBQUM4VSxZQUFZLENBQUMsa0JBQWtCLEVBQUU3UCxLQUFLLENBQUNrSyxJQUFJLENBQUMrRixTQUFTLENBQUMsQ0FBQztJQUN2RixPQUFPaGpCLGtDQUFnQixDQUFDK04sa0JBQWtCLENBQUMsSUFBSUMseUJBQWdCLENBQUNGLGNBQWMsQ0FBQyxDQUFDO0VBQ2xGOztFQUVBLE1BQU1RLE1BQU1BLENBQUNDLEtBQUssRUFBRTtJQUNsQkEsS0FBSyxHQUFHRSxxQkFBWSxDQUFDQyxnQkFBZ0IsQ0FBQ0gsS0FBSyxDQUFDO0lBQzVDLElBQUlwRSxRQUFRLEdBQUcsTUFBTSxJQUFJLENBQUN5WSxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUNyVSxLQUFLLENBQUNLLFFBQVEsQ0FBQyxDQUFDLENBQUM1SixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDN0UsT0FBT2pGLGdCQUFnQixDQUFDK08sY0FBYyxDQUFDUCxLQUFLLEVBQUV6SixJQUFJLENBQUNDLFNBQVMsQ0FBQyxFQUFDNGIsTUFBTSxFQUFFeFcsUUFBUSxDQUFDd1csTUFBTSxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDNUY7O0VBRUEsTUFBTTVSLFlBQVlBLENBQUNSLEtBQUssRUFBRTtJQUN4QkEsS0FBSyxHQUFHRSxxQkFBWSxDQUFDTyxzQkFBc0IsQ0FBQ1QsS0FBSyxDQUFDO0lBQ2xELElBQUlxVixVQUFVLEdBQUcsTUFBTSxJQUFJLENBQUNoQixZQUFZLENBQUMsY0FBYyxFQUFFLENBQUNyVSxLQUFLLENBQUNXLFVBQVUsQ0FBQyxDQUFDLENBQUNOLFFBQVEsQ0FBQyxDQUFDLENBQUM1SixNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEcsT0FBT2pGLGdCQUFnQixDQUFDb1Asb0JBQW9CLENBQUNaLEtBQUssRUFBRXpKLElBQUksQ0FBQ0MsU0FBUyxDQUFDLEVBQUM0YixNQUFNLEVBQUVpRCxVQUFVLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUM3Rjs7RUFFQSxNQUFNeFUsVUFBVUEsQ0FBQ2IsS0FBSyxFQUFFO0lBQ3RCQSxLQUFLLEdBQUdFLHFCQUFZLENBQUNZLG9CQUFvQixDQUFDZCxLQUFLLENBQUM7SUFDaEQsSUFBSXFWLFVBQVUsR0FBRyxNQUFNLElBQUksQ0FBQ2hCLFlBQVksQ0FBQyxZQUFZLEVBQUUsQ0FBQ3JVLEtBQUssQ0FBQ1csVUFBVSxDQUFDLENBQUMsQ0FBQ04sUUFBUSxDQUFDLENBQUMsQ0FBQzVKLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNoRyxPQUFPakYsZ0JBQWdCLENBQUN3UCxrQkFBa0IsQ0FBQ2hCLEtBQUssRUFBRXpKLElBQUksQ0FBQ0MsU0FBUyxDQUFDLEVBQUM0YixNQUFNLEVBQUVpRCxVQUFVLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUMzRjs7RUFFQSxNQUFNcFUsYUFBYUEsQ0FBQ0MsR0FBRyxFQUFFO0lBQ3ZCLE9BQU8sSUFBSSxDQUFDbVQsWUFBWSxDQUFDLGVBQWUsRUFBRSxDQUFDblQsR0FBRyxDQUFDLENBQUM7RUFDbEQ7O0VBRUEsTUFBTUcsYUFBYUEsQ0FBQ0QsVUFBVSxFQUFFO0lBQzlCLE9BQU8sSUFBSSxDQUFDaVQsWUFBWSxDQUFDLGVBQWUsRUFBRSxDQUFDalQsVUFBVSxDQUFDLENBQUM7RUFDekQ7O0VBRUEsTUFBTUksZUFBZUEsQ0FBQ04sR0FBRyxFQUFFO0lBQ3pCLE9BQU8sSUFBSVcsbUNBQTBCLENBQUMsTUFBTSxJQUFJLENBQUN3UyxZQUFZLENBQUMsY0FBYyxFQUFFLENBQUNuVCxHQUFHLENBQUMsQ0FBQyxDQUFDO0VBQ3ZGOztFQUVBLE1BQU1ZLGVBQWVBLENBQUNGLFNBQVMsRUFBRUcsTUFBTSxHQUFHLENBQUMsRUFBRTtJQUMzQyxJQUFJdVQsYUFBYSxHQUFHLEVBQUU7SUFDdEIsS0FBSyxJQUFJcFQsUUFBUSxJQUFJTixTQUFTLEVBQUUwVCxhQUFhLENBQUMvVyxJQUFJLENBQUMyRCxRQUFRLENBQUN6TCxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ3JFLE9BQU8sSUFBSTJMLG1DQUEwQixDQUFDLE1BQU0sSUFBSSxDQUFDaVMsWUFBWSxDQUFDLGlCQUFpQixFQUFFLENBQUNpQixhQUFhLEVBQUV2VCxNQUFNLENBQUMsQ0FBQyxDQUFDO0VBQzVHOztFQUVBLE1BQU1NLDZCQUE2QkEsQ0FBQSxFQUE4QjtJQUMvRCxNQUFNLElBQUlyUCxvQkFBVyxDQUFDLGtFQUFrRSxDQUFDO0VBQzNGOztFQUVBLE1BQU1zUCxZQUFZQSxDQUFDSixRQUFRLEVBQUU7SUFDM0IsT0FBTyxJQUFJLENBQUNtUyxZQUFZLENBQUMsY0FBYyxFQUFFLENBQUNuUyxRQUFRLENBQUMsQ0FBQztFQUN0RDs7RUFFQSxNQUFNTSxVQUFVQSxDQUFDTixRQUFRLEVBQUU7SUFDekIsT0FBTyxJQUFJLENBQUNtUyxZQUFZLENBQUMsWUFBWSxFQUFFLENBQUNuUyxRQUFRLENBQUMsQ0FBQztFQUNwRDs7RUFFQSxNQUFNUSxjQUFjQSxDQUFDUixRQUFRLEVBQUU7SUFDN0IsT0FBTyxJQUFJLENBQUNtUyxZQUFZLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQ25TLFFBQVEsQ0FBQyxDQUFDO0VBQ3hEOztFQUVBLE1BQU1VLHFCQUFxQkEsQ0FBQSxFQUFHO0lBQzVCLE9BQU8sSUFBSSxDQUFDeVIsWUFBWSxDQUFDLHVCQUF1QixDQUFDO0VBQ25EOztFQUVBLE1BQU12UixTQUFTQSxDQUFDMVAsTUFBTSxFQUFFO0lBQ3RCQSxNQUFNLEdBQUc4TSxxQkFBWSxDQUFDOEMsd0JBQXdCLENBQUM1UCxNQUFNLENBQUM7SUFDdEQsSUFBSTBRLFNBQVMsR0FBRyxNQUFNLElBQUksQ0FBQ3VRLFlBQVksQ0FBQyxXQUFXLEVBQUUsQ0FBQ2poQixNQUFNLENBQUNxRCxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdkUsT0FBTyxJQUFJNE0sb0JBQVcsQ0FBQ1MsU0FBUyxDQUFDLENBQUMvRCxNQUFNLENBQUMsQ0FBQztFQUM1Qzs7RUFFQSxNQUFNdUQsV0FBV0EsQ0FBQ2xRLE1BQU0sRUFBRTtJQUN4QkEsTUFBTSxHQUFHOE0scUJBQVksQ0FBQ3FELDBCQUEwQixDQUFDblEsTUFBTSxDQUFDO0lBQ3hELElBQUkwUSxTQUFTLEdBQUcsTUFBTSxJQUFJLENBQUN1USxZQUFZLENBQUMsYUFBYSxFQUFFLENBQUNqaEIsTUFBTSxDQUFDcUQsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3pFLE9BQU8sSUFBSTRNLG9CQUFXLENBQUNTLFNBQVMsQ0FBQyxDQUFDL0QsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDL0M7O0VBRUEsTUFBTTBELGFBQWFBLENBQUNyUSxNQUFNLEVBQUU7SUFDMUJBLE1BQU0sR0FBRzhNLHFCQUFZLENBQUN3RCw0QkFBNEIsQ0FBQ3RRLE1BQU0sQ0FBQztJQUMxRCxJQUFJd1EsVUFBVSxHQUFHLE1BQU0sSUFBSSxDQUFDeVEsWUFBWSxDQUFDLGVBQWUsRUFBRSxDQUFDamhCLE1BQU0sQ0FBQ3FELE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1RSxJQUFJc04sR0FBRyxHQUFHLEVBQUU7SUFDWixLQUFLLElBQUlELFNBQVMsSUFBSUYsVUFBVSxFQUFFLEtBQUssSUFBSUssRUFBRSxJQUFJLElBQUlaLG9CQUFXLENBQUNTLFNBQVMsQ0FBQyxDQUFDL0QsTUFBTSxDQUFDLENBQUMsRUFBRWdFLEdBQUcsQ0FBQ3hGLElBQUksQ0FBQzBGLEVBQUUsQ0FBQztJQUNsRyxPQUFPRixHQUFHO0VBQ1o7O0VBRUEsTUFBTUcsU0FBU0EsQ0FBQ0MsS0FBSyxFQUFFO0lBQ3JCLE9BQU8sSUFBSWQsb0JBQVcsQ0FBQyxNQUFNLElBQUksQ0FBQ2dSLFlBQVksQ0FBQyxXQUFXLEVBQUUsQ0FBQ2xRLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQ3BFLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRTtFQUN0Rjs7RUFFQSxNQUFNdUUsUUFBUUEsQ0FBQ0MsY0FBYyxFQUFFO0lBQzdCLElBQUF4UixlQUFNLEVBQUN5UixLQUFLLENBQUNDLE9BQU8sQ0FBQ0YsY0FBYyxDQUFDLEVBQUUseURBQXlELENBQUM7SUFDaEcsSUFBSUcsV0FBVyxHQUFHLEVBQUU7SUFDcEIsS0FBSyxJQUFJQyxZQUFZLElBQUlKLGNBQWMsRUFBRUcsV0FBVyxDQUFDbkcsSUFBSSxDQUFDb0csWUFBWSxZQUFZQyx1QkFBYyxHQUFHRCxZQUFZLENBQUNFLFdBQVcsQ0FBQyxDQUFDLEdBQUdGLFlBQVksQ0FBQztJQUM3SSxPQUFPLElBQUksQ0FBQzBQLFlBQVksQ0FBQyxVQUFVLEVBQUUsQ0FBQzNQLFdBQVcsQ0FBQyxDQUFDO0VBQ3JEOztFQUVBLE1BQU1NLGFBQWFBLENBQUNoQixLQUFLLEVBQUU7SUFDekIsT0FBTyxJQUFJWCxvQkFBVyxDQUFDLE1BQU0sSUFBSSxDQUFDZ1IsWUFBWSxDQUFDLGVBQWUsRUFBRSxDQUFDclEsS0FBSyxDQUFDdk4sTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEY7O0VBRUEsTUFBTWdQLE9BQU9BLENBQUNSLGFBQWEsRUFBRTtJQUMzQixPQUFPLElBQUk1QixvQkFBVyxDQUFDLE1BQU0sSUFBSSxDQUFDZ1IsWUFBWSxDQUFDLFNBQVMsRUFBRTdQLEtBQUssQ0FBQ2tLLElBQUksQ0FBQytGLFNBQVMsQ0FBQyxDQUFDLENBQUM7RUFDbkY7O0VBRUEsTUFBTTlPLFNBQVNBLENBQUNSLFdBQVcsRUFBRTtJQUMzQixPQUFPLElBQUksQ0FBQ2tQLFlBQVksQ0FBQyxXQUFXLEVBQUU3UCxLQUFLLENBQUNrSyxJQUFJLENBQUMrRixTQUFTLENBQUMsQ0FBQztFQUM5RDs7RUFFQSxNQUFNNU8sV0FBV0EsQ0FBQ3hMLE9BQU8sRUFBRXlMLGFBQWEsRUFBRTdJLFVBQVUsRUFBRUMsYUFBYSxFQUFFO0lBQ25FLE9BQU8sSUFBSSxDQUFDbVgsWUFBWSxDQUFDLGFBQWEsRUFBRTdQLEtBQUssQ0FBQ2tLLElBQUksQ0FBQytGLFNBQVMsQ0FBQyxDQUFDO0VBQ2hFOztFQUVBLE1BQU12TyxhQUFhQSxDQUFDN0wsT0FBTyxFQUFFOEwsT0FBTyxFQUFFQyxTQUFTLEVBQUU7SUFDL0MsT0FBTyxJQUFJRyxxQ0FBNEIsQ0FBQyxNQUFNLElBQUksQ0FBQzhOLFlBQVksQ0FBQyxlQUFlLEVBQUU3UCxLQUFLLENBQUNrSyxJQUFJLENBQUMrRixTQUFTLENBQUMsQ0FBQyxDQUFDO0VBQzFHOztFQUVBLE1BQU05TixRQUFRQSxDQUFDQyxNQUFNLEVBQUU7SUFDckIsT0FBTyxJQUFJLENBQUN5TixZQUFZLENBQUMsVUFBVSxFQUFFN1AsS0FBSyxDQUFDa0ssSUFBSSxDQUFDK0YsU0FBUyxDQUFDLENBQUM7RUFDN0Q7O0VBRUEsTUFBTTNOLFVBQVVBLENBQUNGLE1BQU0sRUFBRUcsS0FBSyxFQUFFWixPQUFPLEVBQUU7SUFDdkMsT0FBTyxJQUFJZSxzQkFBYSxDQUFDLE1BQU0sSUFBSSxDQUFDbU4sWUFBWSxDQUFDLFlBQVksRUFBRTdQLEtBQUssQ0FBQ2tLLElBQUksQ0FBQytGLFNBQVMsQ0FBQyxDQUFDLENBQUM7RUFDeEY7O0VBRUEsTUFBTXROLFVBQVVBLENBQUNQLE1BQU0sRUFBRVQsT0FBTyxFQUFFOUwsT0FBTyxFQUFFO0lBQ3pDLE9BQU8sSUFBSSxDQUFDZ2EsWUFBWSxDQUFDLFlBQVksRUFBRTdQLEtBQUssQ0FBQ2tLLElBQUksQ0FBQytGLFNBQVMsQ0FBQyxDQUFDO0VBQy9EOztFQUVBLE1BQU1oTixZQUFZQSxDQUFDYixNQUFNLEVBQUVULE9BQU8sRUFBRTlMLE9BQU8sRUFBRStMLFNBQVMsRUFBRTtJQUN0RCxPQUFPLElBQUljLHNCQUFhLENBQUMsTUFBTSxJQUFJLENBQUNtTixZQUFZLENBQUMsY0FBYyxFQUFFN1AsS0FBSyxDQUFDa0ssSUFBSSxDQUFDK0YsU0FBUyxDQUFDLENBQUMsQ0FBQztFQUMxRjs7RUFFQSxNQUFNOU0sYUFBYUEsQ0FBQ2YsTUFBTSxFQUFFdk0sT0FBTyxFQUFFO0lBQ25DLE9BQU8sSUFBSSxDQUFDZ2EsWUFBWSxDQUFDLGVBQWUsRUFBRTdQLEtBQUssQ0FBQ2tLLElBQUksQ0FBQytGLFNBQVMsQ0FBQyxDQUFDO0VBQ2xFOztFQUVBLE1BQU01TSxlQUFlQSxDQUFDakIsTUFBTSxFQUFFdk0sT0FBTyxFQUFFK0wsU0FBUyxFQUFFO0lBQ2hELE9BQU8sSUFBSSxDQUFDaU8sWUFBWSxDQUFDLGlCQUFpQixFQUFFN1AsS0FBSyxDQUFDa0ssSUFBSSxDQUFDK0YsU0FBUyxDQUFDLENBQUM7RUFDcEU7O0VBRUEsTUFBTTFNLHFCQUFxQkEsQ0FBQzFOLE9BQU8sRUFBRTtJQUNuQyxPQUFPLElBQUksQ0FBQ2dhLFlBQVksQ0FBQyx1QkFBdUIsRUFBRTdQLEtBQUssQ0FBQ2tLLElBQUksQ0FBQytGLFNBQVMsQ0FBQyxDQUFDO0VBQzFFOztFQUVBLE1BQU14TSxzQkFBc0JBLENBQUNoTCxVQUFVLEVBQUVpTCxNQUFNLEVBQUU3TixPQUFPLEVBQUU7SUFDeEQsSUFBSSxDQUFFLE9BQU8sTUFBTSxJQUFJLENBQUNnYSxZQUFZLENBQUMsd0JBQXdCLEVBQUUsQ0FBQ3BYLFVBQVUsRUFBRWlMLE1BQU0sQ0FBQ0UsUUFBUSxDQUFDLENBQUMsRUFBRS9OLE9BQU8sQ0FBQyxDQUFDLENBQUU7SUFDMUcsT0FBTzJCLENBQU0sRUFBRSxDQUFFLE1BQU0sSUFBSWhKLG9CQUFXLENBQUNnSixDQUFDLENBQUMzQixPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBRTtFQUN6RDs7RUFFQSxNQUFNZ08saUJBQWlCQSxDQUFDbEMsT0FBTyxFQUFFOUwsT0FBTyxFQUFFK0wsU0FBUyxFQUFFO0lBQ25ELElBQUksQ0FBRSxPQUFPLElBQUltQywyQkFBa0IsQ0FBQyxNQUFNLElBQUksQ0FBQzhMLFlBQVksQ0FBQyxtQkFBbUIsRUFBRTdQLEtBQUssQ0FBQ2tLLElBQUksQ0FBQytGLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBRTtJQUMxRyxPQUFPelksQ0FBTSxFQUFFLENBQUUsTUFBTSxJQUFJaEosb0JBQVcsQ0FBQ2dKLENBQUMsQ0FBQzNCLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFFO0VBQ3pEOztFQUVBLE1BQU1tTyxVQUFVQSxDQUFDOUwsUUFBUSxFQUFFO0lBQ3pCLE9BQU8sSUFBSSxDQUFDMlgsWUFBWSxDQUFDLFlBQVksRUFBRTdQLEtBQUssQ0FBQ2tLLElBQUksQ0FBQytGLFNBQVMsQ0FBQyxDQUFDO0VBQy9EOztFQUVBLE1BQU05TCxVQUFVQSxDQUFDak0sUUFBUSxFQUFFa00sS0FBSyxFQUFFO0lBQ2hDLE9BQU8sSUFBSSxDQUFDeUwsWUFBWSxDQUFDLFlBQVksRUFBRTdQLEtBQUssQ0FBQ2tLLElBQUksQ0FBQytGLFNBQVMsQ0FBQyxDQUFDO0VBQy9EOztFQUVBLE1BQU0zTCxxQkFBcUJBLENBQUNDLFlBQVksRUFBRTtJQUN4QyxJQUFJLENBQUNBLFlBQVksRUFBRUEsWUFBWSxHQUFHLEVBQUU7SUFDcEMsSUFBSUMsT0FBTyxHQUFHLEVBQUU7SUFDaEIsS0FBSyxJQUFJQyxTQUFTLElBQUksTUFBTSxJQUFJLENBQUNvTCxZQUFZLENBQUMsdUJBQXVCLEVBQUU3UCxLQUFLLENBQUNrSyxJQUFJLENBQUMrRixTQUFTLENBQUMsQ0FBQyxFQUFFO01BQzdGekwsT0FBTyxDQUFDekssSUFBSSxDQUFDLElBQUk0SywrQkFBc0IsQ0FBQ0YsU0FBUyxDQUFDLENBQUM7SUFDckQ7SUFDQSxPQUFPRCxPQUFPO0VBQ2hCOztFQUVBLE1BQU1JLG1CQUFtQkEsQ0FBQ2pELE9BQU8sRUFBRWtELFdBQVcsRUFBRTtJQUM5QyxPQUFPLElBQUksQ0FBQ2dMLFlBQVksQ0FBQyxxQkFBcUIsRUFBRTdQLEtBQUssQ0FBQ2tLLElBQUksQ0FBQytGLFNBQVMsQ0FBQyxDQUFDO0VBQ3hFOztFQUVBLE1BQU1sTCxvQkFBb0JBLENBQUNDLEtBQUssRUFBRUMsVUFBVSxFQUFFdEQsT0FBTyxFQUFFdUQsY0FBYyxFQUFFTCxXQUFXLEVBQUU7SUFDbEYsT0FBTyxJQUFJLENBQUNnTCxZQUFZLENBQUMsc0JBQXNCLEVBQUU3UCxLQUFLLENBQUNrSyxJQUFJLENBQUMrRixTQUFTLENBQUMsQ0FBQztFQUN6RTs7RUFFQSxNQUFNN0ssc0JBQXNCQSxDQUFDQyxRQUFRLEVBQUU7SUFDckMsT0FBTyxJQUFJLENBQUN3SyxZQUFZLENBQUMsd0JBQXdCLEVBQUU3UCxLQUFLLENBQUNrSyxJQUFJLENBQUMrRixTQUFTLENBQUMsQ0FBQztFQUMzRTs7RUFFQSxNQUFNMUssV0FBV0EsQ0FBQzdMLEdBQUcsRUFBRThMLGNBQWMsRUFBRTtJQUNyQyxPQUFPLElBQUksQ0FBQ3FLLFlBQVksQ0FBQyxhQUFhLEVBQUU3UCxLQUFLLENBQUNrSyxJQUFJLENBQUMrRixTQUFTLENBQUMsQ0FBQztFQUNoRTs7RUFFQSxNQUFNdkssYUFBYUEsQ0FBQ0YsY0FBYyxFQUFFO0lBQ2xDLE9BQU8sSUFBSSxDQUFDcUssWUFBWSxDQUFDLGVBQWUsRUFBRTdQLEtBQUssQ0FBQ2tLLElBQUksQ0FBQytGLFNBQVMsQ0FBQyxDQUFDO0VBQ2xFOztFQUVBLE1BQU10SyxjQUFjQSxDQUFBLEVBQUc7SUFDckIsT0FBTyxJQUFJLENBQUNrSyxZQUFZLENBQUMsZ0JBQWdCLEVBQUU3UCxLQUFLLENBQUNrSyxJQUFJLENBQUMrRixTQUFTLENBQUMsQ0FBQztFQUNuRTs7RUFFQSxNQUFNakssa0JBQWtCQSxDQUFDdE0sR0FBRyxFQUFFWSxLQUFLLEVBQUU7SUFDbkMsT0FBTyxJQUFJLENBQUN1VixZQUFZLENBQUMsb0JBQW9CLEVBQUU3UCxLQUFLLENBQUNrSyxJQUFJLENBQUMrRixTQUFTLENBQUMsQ0FBQztFQUN2RTs7RUFFQSxNQUFNL0osYUFBYUEsQ0FBQ3RYLE1BQU0sRUFBRTtJQUMxQkEsTUFBTSxHQUFHOE0scUJBQVksQ0FBQzhDLHdCQUF3QixDQUFDNVAsTUFBTSxDQUFDO0lBQ3RELE9BQU8sSUFBSSxDQUFDaWhCLFlBQVksQ0FBQyxlQUFlLEVBQUUsQ0FBQ2poQixNQUFNLENBQUNxRCxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDOUQ7O0VBRUEsTUFBTW1VLGVBQWVBLENBQUNoUyxHQUFHLEVBQUU7SUFDekIsT0FBTyxJQUFJaVMsdUJBQWMsQ0FBQyxNQUFNLElBQUksQ0FBQ3dKLFlBQVksQ0FBQyxpQkFBaUIsRUFBRTdQLEtBQUssQ0FBQ2tLLElBQUksQ0FBQytGLFNBQVMsQ0FBQyxDQUFDLENBQUM7RUFDOUY7O0VBRUEsTUFBTTFKLFlBQVlBLENBQUNDLEdBQUcsRUFBRTtJQUN0QixPQUFPLElBQUksQ0FBQ3FKLFlBQVksQ0FBQyxjQUFjLEVBQUU3UCxLQUFLLENBQUNrSyxJQUFJLENBQUMrRixTQUFTLENBQUMsQ0FBQztFQUNqRTs7RUFFQSxNQUFNdEosWUFBWUEsQ0FBQ0gsR0FBRyxFQUFFSSxHQUFHLEVBQUU7SUFDM0IsT0FBTyxJQUFJLENBQUNpSixZQUFZLENBQUMsY0FBYyxFQUFFN1AsS0FBSyxDQUFDa0ssSUFBSSxDQUFDK0YsU0FBUyxDQUFDLENBQUM7RUFDakU7O0VBRUEsTUFBTW5KLFdBQVdBLENBQUNDLFVBQVUsRUFBRUMsZ0JBQWdCLEVBQUVDLGFBQWEsRUFBRTtJQUM3RCxPQUFPLElBQUksQ0FBQzRJLFlBQVksQ0FBQyxhQUFhLEVBQUU3UCxLQUFLLENBQUNrSyxJQUFJLENBQUMrRixTQUFTLENBQUMsQ0FBQztFQUNoRTs7RUFFQSxNQUFNNUksVUFBVUEsQ0FBQSxFQUFHO0lBQ2pCLE9BQU8sSUFBSSxDQUFDd0ksWUFBWSxDQUFDLFlBQVksRUFBRTdQLEtBQUssQ0FBQ2tLLElBQUksQ0FBQytGLFNBQVMsQ0FBQyxDQUFDO0VBQy9EOztFQUVBLE1BQU0zSSxzQkFBc0JBLENBQUEsRUFBRztJQUM3QixPQUFPLElBQUksQ0FBQ3VJLFlBQVksQ0FBQyx3QkFBd0IsQ0FBQztFQUNwRDs7RUFFQSxNQUFNckksVUFBVUEsQ0FBQSxFQUFHO0lBQ2pCLE9BQU8sSUFBSSxDQUFDcUksWUFBWSxDQUFDLFlBQVksQ0FBQztFQUN4Qzs7RUFFQSxNQUFNbkksZUFBZUEsQ0FBQSxFQUFHO0lBQ3RCLE9BQU8sSUFBSUMsMkJBQWtCLENBQUMsTUFBTSxJQUFJLENBQUNrSSxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQztFQUMzRTs7RUFFQSxNQUFNaEksZUFBZUEsQ0FBQSxFQUFHO0lBQ3RCLE9BQU8sSUFBSSxDQUFDZ0ksWUFBWSxDQUFDLGlCQUFpQixDQUFDO0VBQzdDOztFQUVBLE1BQU05SCxZQUFZQSxDQUFDQyxhQUFhLEVBQUVDLFNBQVMsRUFBRTNhLFFBQVEsRUFBRTtJQUNyRCxPQUFPLE1BQU0sSUFBSSxDQUFDdWlCLFlBQVksQ0FBQyxjQUFjLEVBQUU3UCxLQUFLLENBQUNrSyxJQUFJLENBQUMrRixTQUFTLENBQUMsQ0FBQztFQUN2RTs7RUFFQSxNQUFNOUgsb0JBQW9CQSxDQUFDSCxhQUFhLEVBQUUxYSxRQUFRLEVBQUU7SUFDbEQsT0FBTyxJQUFJK2EsaUNBQXdCLENBQUMsTUFBTSxJQUFJLENBQUN3SCxZQUFZLENBQUMsc0JBQXNCLEVBQUU3UCxLQUFLLENBQUNrSyxJQUFJLENBQUMrRixTQUFTLENBQUMsQ0FBQyxDQUFDO0VBQzdHOztFQUVBLE1BQU0zSCxpQkFBaUJBLENBQUEsRUFBRztJQUN4QixPQUFPLElBQUksQ0FBQ3VILFlBQVksQ0FBQyxtQkFBbUIsQ0FBQztFQUMvQzs7RUFFQSxNQUFNckgsaUJBQWlCQSxDQUFDUixhQUFhLEVBQUVTLGtCQUFrQixFQUFFO0lBQ3pELE9BQU8sSUFBSSxDQUFDb0gsWUFBWSxDQUFDLG1CQUFtQixFQUFFN1AsS0FBSyxDQUFDa0ssSUFBSSxDQUFDK0YsU0FBUyxDQUFDLENBQUM7RUFDdEU7O0VBRUEsTUFBTXRILGlCQUFpQkEsQ0FBQzlILGFBQWEsRUFBRTtJQUNyQyxPQUFPLElBQUlnSSxpQ0FBd0IsQ0FBQyxNQUFNLElBQUksQ0FBQ2dILFlBQVksQ0FBQyxtQkFBbUIsRUFBRTdQLEtBQUssQ0FBQ2tLLElBQUksQ0FBQytGLFNBQVMsQ0FBQyxDQUFDLENBQUM7RUFDMUc7O0VBRUEsTUFBTW5ILG1CQUFtQkEsQ0FBQ0MsbUJBQW1CLEVBQUU7SUFDN0MsT0FBTyxJQUFJLENBQUM4RyxZQUFZLENBQUMscUJBQXFCLEVBQUU3UCxLQUFLLENBQUNrSyxJQUFJLENBQUMrRixTQUFTLENBQUMsQ0FBQztFQUN4RTs7RUFFQSxNQUFNaEgsT0FBT0EsQ0FBQSxFQUFHO0lBQ2QsT0FBTyxJQUFJLENBQUM0RyxZQUFZLENBQUMsU0FBUyxDQUFDO0VBQ3JDOztFQUVBLE1BQU1uYyxNQUFNQSxDQUFDckcsSUFBSSxFQUFFO0lBQ2pCLE9BQU9MLGdCQUFnQixDQUFDMEcsTUFBTSxDQUFDckcsSUFBSSxFQUFFLElBQUksQ0FBQztFQUM1Qzs7RUFFQSxNQUFNa2QsY0FBY0EsQ0FBQ0MsV0FBVyxFQUFFQyxXQUFXLEVBQUU7SUFDN0MsTUFBTSxJQUFJLENBQUNvRixZQUFZLENBQUMsZ0JBQWdCLEVBQUU3UCxLQUFLLENBQUNrSyxJQUFJLENBQUMrRixTQUFTLENBQUMsQ0FBQztJQUNoRSxJQUFJLElBQUksQ0FBQzVpQixJQUFJLEVBQUUsTUFBTSxJQUFJLENBQUM2RSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDcEM7O0VBRUEsTUFBTUEsSUFBSUEsQ0FBQSxFQUFHO0lBQ1gsT0FBT2xGLGdCQUFnQixDQUFDa0YsSUFBSSxDQUFDLElBQUksQ0FBQztFQUNwQzs7RUFFQSxNQUFNMFksS0FBS0EsQ0FBQzFZLElBQUksRUFBRTtJQUNoQixJQUFJLE1BQU0sSUFBSSxDQUFDNmMsUUFBUSxDQUFDLENBQUMsRUFBRTtJQUMzQixJQUFJN2MsSUFBSSxFQUFFLE1BQU0sSUFBSSxDQUFDQSxJQUFJLENBQUMsQ0FBQztJQUMzQixPQUFPLElBQUksQ0FBQzhkLGdCQUFnQixDQUFDaE4sTUFBTSxFQUFFLE1BQU0sSUFBSSxDQUFDbFAsY0FBYyxDQUFDLElBQUksQ0FBQ2tjLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDVSxXQUFXLENBQUMsQ0FBQyxDQUFDO0lBQ3RHLE1BQU0sS0FBSyxDQUFDOUYsS0FBSyxDQUFDLEtBQUssQ0FBQztFQUMxQjtBQUNGOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNNWMsa0JBQWtCLENBQUM7Ozs7RUFJdkJiLFdBQVdBLENBQUMrQyxNQUFNLEVBQUU7SUFDbEIsSUFBSSxDQUFDQSxNQUFNLEdBQUdBLE1BQU07RUFDdEI7O0VBRUEsTUFBTXNjLGNBQWNBLENBQUNILE1BQU0sRUFBRXhWLFdBQVcsRUFBRXlWLFNBQVMsRUFBRUMsV0FBVyxFQUFFMVcsT0FBTyxFQUFFO0lBQ3pFLE1BQU0sSUFBSSxDQUFDM0YsTUFBTSxDQUFDNmdCLG9CQUFvQixDQUFDMUUsTUFBTSxFQUFFeFYsV0FBVyxFQUFFeVYsU0FBUyxFQUFFQyxXQUFXLEVBQUUxVyxPQUFPLENBQUM7RUFDOUY7O0VBRUEsTUFBTTRXLFVBQVVBLENBQUNKLE1BQU0sRUFBRTtJQUN2QixNQUFNLElBQUksQ0FBQ25jLE1BQU0sQ0FBQzhnQixnQkFBZ0IsQ0FBQzNFLE1BQU0sQ0FBQztFQUM1Qzs7RUFFQSxNQUFNTyxpQkFBaUJBLENBQUNGLGFBQWEsRUFBRUMscUJBQXFCLEVBQUU7SUFDNUQsTUFBTSxJQUFJLENBQUN6YyxNQUFNLENBQUMrZ0IsdUJBQXVCLENBQUN2RSxhQUFhLEVBQUVDLHFCQUFxQixDQUFDO0VBQ2pGOztFQUVBLE1BQU1LLGdCQUFnQkEsQ0FBQ1gsTUFBTSxFQUFFakssTUFBTSxFQUFFeUssU0FBUyxFQUFFcFUsVUFBVSxFQUFFQyxhQUFhLEVBQUV3SixPQUFPLEVBQUU0SyxVQUFVLEVBQUVDLFFBQVEsRUFBRTs7SUFFMUc7SUFDQSxJQUFJNEIsTUFBTSxHQUFHLElBQUl1QywyQkFBa0IsQ0FBQyxDQUFDO0lBQ3JDdkMsTUFBTSxDQUFDd0MsU0FBUyxDQUFDcFksTUFBTSxDQUFDOFQsU0FBUyxDQUFDLENBQUM7SUFDbkM4QixNQUFNLENBQUN5QyxlQUFlLENBQUMzWSxVQUFVLENBQUM7SUFDbENrVyxNQUFNLENBQUMwQyxrQkFBa0IsQ0FBQzNZLGFBQWEsQ0FBQztJQUN4QyxJQUFJK0csRUFBRSxHQUFHLElBQUlXLHVCQUFjLENBQUMsQ0FBQztJQUM3QlgsRUFBRSxDQUFDNlIsT0FBTyxDQUFDbFAsTUFBTSxDQUFDO0lBQ2xCM0MsRUFBRSxDQUFDOFIsVUFBVSxDQUFDclAsT0FBTyxDQUFDO0lBQ3RCekMsRUFBRSxDQUFDK1IsYUFBYSxDQUFDMUUsVUFBVSxDQUFDO0lBQzVCNkIsTUFBTSxDQUFDOEMsS0FBSyxDQUFDaFMsRUFBRSxDQUFDO0lBQ2hCQSxFQUFFLENBQUNpUyxVQUFVLENBQUMsQ0FBQy9DLE1BQU0sQ0FBQyxDQUFDO0lBQ3ZCbFAsRUFBRSxDQUFDa1MsYUFBYSxDQUFDLElBQUksQ0FBQztJQUN0QmxTLEVBQUUsQ0FBQ21TLFdBQVcsQ0FBQzdFLFFBQVEsQ0FBQztJQUN4QixJQUFJVixNQUFNLEdBQUcsQ0FBQyxFQUFFO01BQ2QsSUFBSWdCLEtBQUssR0FBRyxJQUFJUyxvQkFBVyxDQUFDLENBQUMsQ0FBQytELFNBQVMsQ0FBQ3hGLE1BQU0sQ0FBQztNQUMvQ2dCLEtBQUssQ0FBQ3hOLE1BQU0sQ0FBQyxDQUFDSixFQUFFLENBQWEsQ0FBQztNQUM5QkEsRUFBRSxDQUFDd08sUUFBUSxDQUFDWixLQUFLLENBQUM7TUFDbEI1TixFQUFFLENBQUNxUyxjQUFjLENBQUMsSUFBSSxDQUFDO01BQ3ZCclMsRUFBRSxDQUFDc1MsV0FBVyxDQUFDLEtBQUssQ0FBQztNQUNyQnRTLEVBQUUsQ0FBQ3VTLFdBQVcsQ0FBQyxLQUFLLENBQUM7SUFDdkIsQ0FBQyxNQUFNO01BQ0x2UyxFQUFFLENBQUNxUyxjQUFjLENBQUMsS0FBSyxDQUFDO01BQ3hCclMsRUFBRSxDQUFDc1MsV0FBVyxDQUFDLElBQUksQ0FBQztJQUN0Qjs7SUFFQTtJQUNBLE1BQU0sSUFBSSxDQUFDN2hCLE1BQU0sQ0FBQytoQixzQkFBc0IsQ0FBQ3RELE1BQU0sQ0FBQztFQUNsRDs7RUFFQSxNQUFNeEIsYUFBYUEsQ0FBQ2QsTUFBTSxFQUFFakssTUFBTSxFQUFFeUssU0FBUyxFQUFFSSxhQUFhLEVBQUVDLGdCQUFnQixFQUFFaEwsT0FBTyxFQUFFNEssVUFBVSxFQUFFQyxRQUFRLEVBQUU7O0lBRTdHO0lBQ0EsSUFBSTRCLE1BQU0sR0FBRyxJQUFJdUMsMkJBQWtCLENBQUMsQ0FBQztJQUNyQ3ZDLE1BQU0sQ0FBQ3dDLFNBQVMsQ0FBQ3BZLE1BQU0sQ0FBQzhULFNBQVMsQ0FBQyxDQUFDO0lBQ25DLElBQUlJLGFBQWEsRUFBRTBCLE1BQU0sQ0FBQ3lDLGVBQWUsQ0FBQ2MsUUFBUSxDQUFDakYsYUFBYSxDQUFDLENBQUM7SUFDbEUsSUFBSUMsZ0JBQWdCLEVBQUV5QixNQUFNLENBQUMwQyxrQkFBa0IsQ0FBQ2EsUUFBUSxDQUFDaEYsZ0JBQWdCLENBQUMsQ0FBQztJQUMzRSxJQUFJek4sRUFBRSxHQUFHLElBQUlXLHVCQUFjLENBQUMsQ0FBQztJQUM3QlgsRUFBRSxDQUFDNlIsT0FBTyxDQUFDbFAsTUFBTSxDQUFDO0lBQ2xCM0MsRUFBRSxDQUFDOFIsVUFBVSxDQUFDclAsT0FBTyxDQUFDO0lBQ3RCekMsRUFBRSxDQUFDK1IsYUFBYSxDQUFDMUUsVUFBVSxDQUFDO0lBQzVCck4sRUFBRSxDQUFDbVMsV0FBVyxDQUFDN0UsUUFBUSxDQUFDO0lBQ3hCNEIsTUFBTSxDQUFDOEMsS0FBSyxDQUFDaFMsRUFBRSxDQUFDO0lBQ2hCQSxFQUFFLENBQUMwUyxTQUFTLENBQUMsQ0FBQ3hELE1BQU0sQ0FBQyxDQUFDO0lBQ3RCLElBQUl0QyxNQUFNLEdBQUcsQ0FBQyxFQUFFO01BQ2QsSUFBSWdCLEtBQUssR0FBRyxJQUFJUyxvQkFBVyxDQUFDLENBQUMsQ0FBQytELFNBQVMsQ0FBQ3hGLE1BQU0sQ0FBQztNQUMvQ2dCLEtBQUssQ0FBQ3hOLE1BQU0sQ0FBQyxDQUFDSixFQUFFLENBQUMsQ0FBQztNQUNsQkEsRUFBRSxDQUFDd08sUUFBUSxDQUFDWixLQUFLLENBQUM7TUFDbEI1TixFQUFFLENBQUNxUyxjQUFjLENBQUMsSUFBSSxDQUFDO01BQ3ZCclMsRUFBRSxDQUFDc1MsV0FBVyxDQUFDLEtBQUssQ0FBQztNQUNyQnRTLEVBQUUsQ0FBQ3VTLFdBQVcsQ0FBQyxLQUFLLENBQUM7SUFDdkIsQ0FBQyxNQUFNO01BQ0x2UyxFQUFFLENBQUNxUyxjQUFjLENBQUMsS0FBSyxDQUFDO01BQ3hCclMsRUFBRSxDQUFDc1MsV0FBVyxDQUFDLElBQUksQ0FBQztJQUN0Qjs7SUFFQTtJQUNBLE1BQU0sSUFBSSxDQUFDN2hCLE1BQU0sQ0FBQ2tpQixtQkFBbUIsQ0FBQ3pELE1BQU0sQ0FBQztFQUMvQztBQUNGOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNMkIsb0JBQW9CLENBQUM7Ozs7O0VBS3pCbmpCLFdBQVdBLENBQUN5RyxRQUFRLEVBQUU7SUFDcEIsSUFBSSxDQUFDeWUsRUFBRSxHQUFHemdCLGlCQUFRLENBQUNDLE9BQU8sQ0FBQyxDQUFDO0lBQzVCLElBQUksQ0FBQytCLFFBQVEsR0FBR0EsUUFBUTtFQUMxQjs7RUFFQTRjLEtBQUtBLENBQUEsRUFBRztJQUNOLE9BQU8sSUFBSSxDQUFDNkIsRUFBRTtFQUNoQjs7RUFFQTNCLFdBQVdBLENBQUEsRUFBRztJQUNaLE9BQU8sSUFBSSxDQUFDOWMsUUFBUTtFQUN0Qjs7RUFFQTRZLGNBQWNBLENBQUNILE1BQU0sRUFBRXhWLFdBQVcsRUFBRXlWLFNBQVMsRUFBRUMsV0FBVyxFQUFFMVcsT0FBTyxFQUFFO0lBQ25FLElBQUksQ0FBQ2pDLFFBQVEsQ0FBQzRZLGNBQWMsQ0FBQ0gsTUFBTSxFQUFFeFYsV0FBVyxFQUFFeVYsU0FBUyxFQUFFQyxXQUFXLEVBQUUxVyxPQUFPLENBQUM7RUFDcEY7O0VBRUEsTUFBTTRXLFVBQVVBLENBQUNKLE1BQU0sRUFBRTtJQUN2QixNQUFNLElBQUksQ0FBQ3pZLFFBQVEsQ0FBQzZZLFVBQVUsQ0FBQ0osTUFBTSxDQUFDO0VBQ3hDOztFQUVBLE1BQU1PLGlCQUFpQkEsQ0FBQ0YsYUFBYSxFQUFFQyxxQkFBcUIsRUFBRTtJQUM1RCxNQUFNLElBQUksQ0FBQy9ZLFFBQVEsQ0FBQ2daLGlCQUFpQixDQUFDN1QsTUFBTSxDQUFDMlQsYUFBYSxDQUFDLEVBQUUzVCxNQUFNLENBQUM0VCxxQkFBcUIsQ0FBQyxDQUFDO0VBQzdGOztFQUVBLE1BQU1LLGdCQUFnQkEsQ0FBQ2EsU0FBUyxFQUFFO0lBQ2hDLElBQUlSLEtBQUssR0FBRyxJQUFJUyxvQkFBVyxDQUFDRCxTQUFTLEVBQUVDLG9CQUFXLENBQUNDLG1CQUFtQixDQUFDQyxTQUFTLENBQUM7SUFDakYsTUFBTSxJQUFJLENBQUNwYSxRQUFRLENBQUNvWixnQkFBZ0IsQ0FBQ0ssS0FBSyxDQUFDOVIsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQ2MsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUN6RTs7RUFFQSxNQUFNOFEsYUFBYUEsQ0FBQ1UsU0FBUyxFQUFFO0lBQzdCLElBQUlSLEtBQUssR0FBRyxJQUFJUyxvQkFBVyxDQUFDRCxTQUFTLEVBQUVDLG9CQUFXLENBQUNDLG1CQUFtQixDQUFDQyxTQUFTLENBQUM7SUFDakYsTUFBTSxJQUFJLENBQUNwYSxRQUFRLENBQUN1WixhQUFhLENBQUNFLEtBQUssQ0FBQzlSLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMrVyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3JFO0FBQ0YifQ==