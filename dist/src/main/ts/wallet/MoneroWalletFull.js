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

  async setDaemonConnection(uriOrConnection) {
    if (this.getWalletProxy()) return this.getWalletProxy().setDaemonConnection(uriOrConnection);

    // normalize connection
    let connection = !uriOrConnection ? undefined : uriOrConnection instanceof _MoneroRpcConnection.default ? uriOrConnection : new _MoneroRpcConnection.default(uriOrConnection);
    let uri = connection && connection.getUri() ? connection.getUri() : "";
    let username = connection && connection.getUsername() ? connection.getUsername() : "";
    let password = connection && connection.getPassword() ? connection.getPassword() : "";
    let proxyUri = connection && connection.getProxyUri() ? connection.getProxyUri() : "";
    let rejectUnauthorized = connection ? connection.getRejectUnauthorized() : undefined;
    this.rejectUnauthorized = rejectUnauthorized; // persist locally

    // set connection in queue
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return new Promise((resolve, reject) => {
        this.module.set_daemon_connection(this.cppAddress, uri, username, password, proxyUri, (resp) => {
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
        this.module.export_key_images(this.cppAddress, all, (keyImagesStr) => {
          if (keyImagesStr.charAt(0) !== '{') reject(new _MoneroError.default(keyImagesStr)); // json expected, else error
          else {
            let keyImages = [];
            for (let keyImageJson of JSON.parse(_GenUtils.default.stringifyBigInts(keyImagesStr)).keyImages) keyImages.push(new _MoneroKeyImage.default(keyImageJson));
            resolve(keyImages);
          }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfcGF0aCIsIl9HZW5VdGlscyIsIl9MaWJyYXJ5VXRpbHMiLCJfVGFza0xvb3BlciIsIl9Nb25lcm9BY2NvdW50IiwiX01vbmVyb0FjY291bnRUYWciLCJfTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSIsIl9Nb25lcm9CbG9jayIsIl9Nb25lcm9DaGVja1R4IiwiX01vbmVyb0NoZWNrUmVzZXJ2ZSIsIl9Nb25lcm9EYWVtb25ScGMiLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MiLCJfTW9uZXJvS2V5SW1hZ2UiLCJfTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQiLCJfTW9uZXJvTXVsdGlzaWdJbmZvIiwiX01vbmVyb011bHRpc2lnSW5pdFJlc3VsdCIsIl9Nb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQiLCJfTW9uZXJvTmV0d29ya1R5cGUiLCJfTW9uZXJvT3V0cHV0V2FsbGV0IiwiX01vbmVyb1JwY0Nvbm5lY3Rpb24iLCJfTW9uZXJvU3ViYWRkcmVzcyIsIl9Nb25lcm9TeW5jUmVzdWx0IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4U2V0IiwiX01vbmVyb1R4V2FsbGV0IiwiX01vbmVyb1dhbGxldCIsIl9Nb25lcm9XYWxsZXRDb25maWciLCJfTW9uZXJvV2FsbGV0S2V5cyIsIl9Nb25lcm9XYWxsZXRMaXN0ZW5lciIsIl9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIl9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0IiwiX2ZzIiwiTW9uZXJvV2FsbGV0RnVsbCIsIk1vbmVyb1dhbGxldEtleXMiLCJERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TIiwiY29uc3RydWN0b3IiLCJjcHBBZGRyZXNzIiwicGF0aCIsInBhc3N3b3JkIiwiZnMiLCJyZWplY3RVbmF1dGhvcml6ZWQiLCJyZWplY3RVbmF1dGhvcml6ZWRGbklkIiwid2FsbGV0UHJveHkiLCJsaXN0ZW5lcnMiLCJnZXRGcyIsInVuZGVmaW5lZCIsIl9pc0Nsb3NlZCIsIndhc21MaXN0ZW5lciIsIldhbGxldFdhc21MaXN0ZW5lciIsIndhc21MaXN0ZW5lckhhbmRsZSIsInJlamVjdFVuYXV0aG9yaXplZENvbmZpZ0lkIiwic3luY1BlcmlvZEluTXMiLCJMaWJyYXJ5VXRpbHMiLCJzZXRSZWplY3RVbmF1dGhvcml6ZWRGbiIsIndhbGxldEV4aXN0cyIsImFzc2VydCIsIk1vbmVyb0Vycm9yIiwiZXhpc3RzIiwibG9nIiwib3BlbldhbGxldCIsImNvbmZpZyIsIk1vbmVyb1dhbGxldENvbmZpZyIsImdldFByb3h5VG9Xb3JrZXIiLCJzZXRQcm94eVRvV29ya2VyIiwiZ2V0U2VlZCIsImdldFNlZWRPZmZzZXQiLCJnZXRQcmltYXJ5QWRkcmVzcyIsImdldFByaXZhdGVWaWV3S2V5IiwiZ2V0UHJpdmF0ZVNwZW5kS2V5IiwiZ2V0UmVzdG9yZUhlaWdodCIsImdldExhbmd1YWdlIiwiZ2V0U2F2ZUN1cnJlbnQiLCJzZXRGcyIsImdldENvbm5lY3Rpb25NYW5hZ2VyIiwiZ2V0U2VydmVyIiwic2V0U2VydmVyIiwiZ2V0Q29ubmVjdGlvbiIsImdldEtleXNEYXRhIiwiZ2V0UGF0aCIsInNldEtleXNEYXRhIiwicmVhZEZpbGUiLCJzZXRDYWNoZURhdGEiLCJ3YWxsZXQiLCJvcGVuV2FsbGV0RGF0YSIsInNldENvbm5lY3Rpb25NYW5hZ2VyIiwiY3JlYXRlV2FsbGV0IiwiZ2V0TmV0d29ya1R5cGUiLCJNb25lcm9OZXR3b3JrVHlwZSIsInZhbGlkYXRlIiwic2V0UGF0aCIsImdldFBhc3N3b3JkIiwic2V0UGFzc3dvcmQiLCJNb25lcm9XYWxsZXRGdWxsUHJveHkiLCJjcmVhdGVXYWxsZXRGcm9tU2VlZCIsImNyZWF0ZVdhbGxldEZyb21LZXlzIiwiY3JlYXRlV2FsbGV0UmFuZG9tIiwiZGFlbW9uQ29ubmVjdGlvbiIsImdldFJlamVjdFVuYXV0aG9yaXplZCIsInNldFJlc3RvcmVIZWlnaHQiLCJzZXRTZWVkT2Zmc2V0IiwibW9kdWxlIiwibG9hZFdhc21Nb2R1bGUiLCJxdWV1ZVRhc2siLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsIkdlblV0aWxzIiwiZ2V0VVVJRCIsImNyZWF0ZV9mdWxsX3dhbGxldCIsIkpTT04iLCJzdHJpbmdpZnkiLCJ0b0pzb24iLCJzYXZlIiwic2V0UHJpbWFyeUFkZHJlc3MiLCJzZXRQcml2YXRlVmlld0tleSIsInNldFByaXZhdGVTcGVuZEtleSIsInNldExhbmd1YWdlIiwiZ2V0U2VlZExhbmd1YWdlcyIsInBhcnNlIiwiZ2V0X2tleXNfd2FsbGV0X3NlZWRfbGFuZ3VhZ2VzIiwibGFuZ3VhZ2VzIiwiRlMiLCJwcm9taXNlcyIsImdldERhZW1vbk1heFBlZXJIZWlnaHQiLCJnZXRXYWxsZXRQcm94eSIsImFzc2VydE5vdENsb3NlZCIsImdldF9kYWVtb25fbWF4X3BlZXJfaGVpZ2h0IiwicmVzcCIsImlzRGFlbW9uU3luY2VkIiwiaXNfZGFlbW9uX3N5bmNlZCIsImlzU3luY2VkIiwiaXNfc3luY2VkIiwiZ2V0X25ldHdvcmtfdHlwZSIsImdldF9yZXN0b3JlX2hlaWdodCIsInJlc3RvcmVIZWlnaHQiLCJzZXRfcmVzdG9yZV9oZWlnaHQiLCJtb3ZlVG8iLCJhZGRMaXN0ZW5lciIsImxpc3RlbmVyIiwicmVmcmVzaExpc3RlbmluZyIsInJlbW92ZUxpc3RlbmVyIiwiZ2V0TGlzdGVuZXJzIiwic2V0RGFlbW9uQ29ubmVjdGlvbiIsInVyaU9yQ29ubmVjdGlvbiIsImNvbm5lY3Rpb24iLCJNb25lcm9ScGNDb25uZWN0aW9uIiwidXJpIiwiZ2V0VXJpIiwidXNlcm5hbWUiLCJnZXRVc2VybmFtZSIsInByb3h5VXJpIiwiZ2V0UHJveHlVcmkiLCJzZXRfZGFlbW9uX2Nvbm5lY3Rpb24iLCJnZXREYWVtb25Db25uZWN0aW9uIiwiY29ubmVjdGlvbkNvbnRhaW5lclN0ciIsImdldF9kYWVtb25fY29ubmVjdGlvbiIsImpzb25Db25uZWN0aW9uIiwiaXNDb25uZWN0ZWRUb0RhZW1vbiIsImlzX2Nvbm5lY3RlZF90b19kYWVtb24iLCJnZXRWZXJzaW9uIiwiZ2V0SW50ZWdyYXRlZEFkZHJlc3MiLCJzdGFuZGFyZEFkZHJlc3MiLCJwYXltZW50SWQiLCJyZXN1bHQiLCJnZXRfaW50ZWdyYXRlZF9hZGRyZXNzIiwiY2hhckF0IiwiTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MiLCJlcnIiLCJtZXNzYWdlIiwiaW5jbHVkZXMiLCJkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyIsImludGVncmF0ZWRBZGRyZXNzIiwiZGVjb2RlX2ludGVncmF0ZWRfYWRkcmVzcyIsImdldEhlaWdodCIsImdldF9oZWlnaHQiLCJnZXREYWVtb25IZWlnaHQiLCJnZXRfZGFlbW9uX2hlaWdodCIsImdldEhlaWdodEJ5RGF0ZSIsInllYXIiLCJtb250aCIsImRheSIsImdldF9oZWlnaHRfYnlfZGF0ZSIsInN5bmMiLCJsaXN0ZW5lck9yU3RhcnRIZWlnaHQiLCJzdGFydEhlaWdodCIsImFsbG93Q29uY3VycmVudENhbGxzIiwiTW9uZXJvV2FsbGV0TGlzdGVuZXIiLCJNYXRoIiwibWF4IiwidGhhdCIsInN5bmNXYXNtIiwicmVzcEpzb24iLCJNb25lcm9TeW5jUmVzdWx0IiwibnVtQmxvY2tzRmV0Y2hlZCIsInJlY2VpdmVkTW9uZXkiLCJlIiwic3RhcnRTeW5jaW5nIiwic3luY0xvb3BlciIsIlRhc2tMb29wZXIiLCJiYWNrZ3JvdW5kU3luYyIsInN0YXJ0Iiwic3RvcFN5bmNpbmciLCJzdG9wIiwic3RvcF9zeW5jaW5nIiwic2NhblR4cyIsInR4SGFzaGVzIiwic2Nhbl90eHMiLCJyZXNjYW5TcGVudCIsInJlc2Nhbl9zcGVudCIsInJlc2NhbkJsb2NrY2hhaW4iLCJyZXNjYW5fYmxvY2tjaGFpbiIsImdldEJhbGFuY2UiLCJhY2NvdW50SWR4Iiwic3ViYWRkcmVzc0lkeCIsImJhbGFuY2VTdHIiLCJnZXRfYmFsYW5jZV93YWxsZXQiLCJnZXRfYmFsYW5jZV9hY2NvdW50IiwiZ2V0X2JhbGFuY2Vfc3ViYWRkcmVzcyIsIkJpZ0ludCIsInN0cmluZ2lmeUJpZ0ludHMiLCJiYWxhbmNlIiwiZ2V0VW5sb2NrZWRCYWxhbmNlIiwidW5sb2NrZWRCYWxhbmNlU3RyIiwiZ2V0X3VubG9ja2VkX2JhbGFuY2Vfd2FsbGV0IiwiZ2V0X3VubG9ja2VkX2JhbGFuY2VfYWNjb3VudCIsImdldF91bmxvY2tlZF9iYWxhbmNlX3N1YmFkZHJlc3MiLCJ1bmxvY2tlZEJhbGFuY2UiLCJnZXRBY2NvdW50cyIsImluY2x1ZGVTdWJhZGRyZXNzZXMiLCJ0YWciLCJhY2NvdW50c1N0ciIsImdldF9hY2NvdW50cyIsImFjY291bnRzIiwiYWNjb3VudEpzb24iLCJwdXNoIiwic2FuaXRpemVBY2NvdW50IiwiTW9uZXJvQWNjb3VudCIsImdldEFjY291bnQiLCJhY2NvdW50U3RyIiwiZ2V0X2FjY291bnQiLCJjcmVhdGVBY2NvdW50IiwibGFiZWwiLCJjcmVhdGVfYWNjb3VudCIsImdldFN1YmFkZHJlc3NlcyIsInN1YmFkZHJlc3NJbmRpY2VzIiwiYXJncyIsImxpc3RpZnkiLCJzdWJhZGRyZXNzZXNKc29uIiwiZ2V0X3N1YmFkZHJlc3NlcyIsInN1YmFkZHJlc3NlcyIsInN1YmFkZHJlc3NKc29uIiwic2FuaXRpemVTdWJhZGRyZXNzIiwiTW9uZXJvU3ViYWRkcmVzcyIsImNyZWF0ZVN1YmFkZHJlc3MiLCJzdWJhZGRyZXNzU3RyIiwiY3JlYXRlX3N1YmFkZHJlc3MiLCJzZXRTdWJhZGRyZXNzTGFiZWwiLCJzZXRfc3ViYWRkcmVzc19sYWJlbCIsImdldFR4cyIsInF1ZXJ5IiwicXVlcnlOb3JtYWxpemVkIiwiTW9uZXJvV2FsbGV0Iiwibm9ybWFsaXplVHhRdWVyeSIsImdldF90eHMiLCJnZXRCbG9jayIsImJsb2Nrc0pzb25TdHIiLCJkZXNlcmlhbGl6ZVR4cyIsImdldFRyYW5zZmVycyIsIm5vcm1hbGl6ZVRyYW5zZmVyUXVlcnkiLCJnZXRfdHJhbnNmZXJzIiwiZ2V0VHhRdWVyeSIsImRlc2VyaWFsaXplVHJhbnNmZXJzIiwiZ2V0T3V0cHV0cyIsIm5vcm1hbGl6ZU91dHB1dFF1ZXJ5IiwiZ2V0X291dHB1dHMiLCJkZXNlcmlhbGl6ZU91dHB1dHMiLCJleHBvcnRPdXRwdXRzIiwiYWxsIiwiZXhwb3J0X291dHB1dHMiLCJvdXRwdXRzSGV4IiwiaW1wb3J0T3V0cHV0cyIsImltcG9ydF9vdXRwdXRzIiwibnVtSW1wb3J0ZWQiLCJleHBvcnRLZXlJbWFnZXMiLCJleHBvcnRfa2V5X2ltYWdlcyIsImtleUltYWdlc1N0ciIsImtleUltYWdlcyIsImtleUltYWdlSnNvbiIsIk1vbmVyb0tleUltYWdlIiwiaW1wb3J0S2V5SW1hZ2VzIiwiaW1wb3J0X2tleV9pbWFnZXMiLCJtYXAiLCJrZXlJbWFnZSIsImtleUltYWdlSW1wb3J0UmVzdWx0U3RyIiwiTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQiLCJnZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCIsImZyZWV6ZU91dHB1dCIsImZyZWV6ZV9vdXRwdXQiLCJ0aGF3T3V0cHV0IiwidGhhd19vdXRwdXQiLCJpc091dHB1dEZyb3plbiIsImlzX291dHB1dF9mcm96ZW4iLCJnZXREZWZhdWx0RmVlUHJpb3JpdHkiLCJnZXRfZGVmYXVsdF9mZWVfcHJpb3JpdHkiLCJjcmVhdGVUeHMiLCJjb25maWdOb3JtYWxpemVkIiwibm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnIiwiZ2V0Q2FuU3BsaXQiLCJzZXRDYW5TcGxpdCIsImNyZWF0ZV90eHMiLCJ0eFNldEpzb25TdHIiLCJNb25lcm9UeFNldCIsInN3ZWVwT3V0cHV0Iiwibm9ybWFsaXplU3dlZXBPdXRwdXRDb25maWciLCJzd2VlcF9vdXRwdXQiLCJzd2VlcFVubG9ja2VkIiwibm9ybWFsaXplU3dlZXBVbmxvY2tlZENvbmZpZyIsInN3ZWVwX3VubG9ja2VkIiwidHhTZXRzSnNvbiIsInR4U2V0cyIsInR4U2V0SnNvbiIsInR4cyIsInR4U2V0IiwidHgiLCJzd2VlcER1c3QiLCJyZWxheSIsInN3ZWVwX2R1c3QiLCJzZXRUeHMiLCJyZWxheVR4cyIsInR4c09yTWV0YWRhdGFzIiwiQXJyYXkiLCJpc0FycmF5IiwidHhNZXRhZGF0YXMiLCJ0eE9yTWV0YWRhdGEiLCJNb25lcm9UeFdhbGxldCIsImdldE1ldGFkYXRhIiwicmVsYXlfdHhzIiwidHhIYXNoZXNKc29uIiwiZGVzY3JpYmVUeFNldCIsInVuc2lnbmVkVHhIZXgiLCJnZXRVbnNpZ25lZFR4SGV4Iiwic2lnbmVkVHhIZXgiLCJnZXRTaWduZWRUeEhleCIsIm11bHRpc2lnVHhIZXgiLCJnZXRNdWx0aXNpZ1R4SGV4IiwiZGVzY3JpYmVfdHhfc2V0IiwiZ2V0X2V4Y2VwdGlvbl9tZXNzYWdlIiwic2lnblR4cyIsInNpZ25fdHhzIiwic3VibWl0VHhzIiwic3VibWl0X3R4cyIsInNpZ25NZXNzYWdlIiwic2lnbmF0dXJlVHlwZSIsIk1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIiwiU0lHTl9XSVRIX1NQRU5EX0tFWSIsInNpZ25fbWVzc2FnZSIsInZlcmlmeU1lc3NhZ2UiLCJhZGRyZXNzIiwic2lnbmF0dXJlIiwidmVyaWZ5X21lc3NhZ2UiLCJpc0dvb2QiLCJNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0IiwiaXNPbGQiLCJTSUdOX1dJVEhfVklFV19LRVkiLCJ2ZXJzaW9uIiwiZ2V0VHhLZXkiLCJ0eEhhc2giLCJnZXRfdHhfa2V5IiwiY2hlY2tUeEtleSIsInR4S2V5IiwiY2hlY2tfdHhfa2V5IiwicmVzcEpzb25TdHIiLCJNb25lcm9DaGVja1R4IiwiZ2V0VHhQcm9vZiIsImdldF90eF9wcm9vZiIsImVycm9yS2V5IiwiaW5kZXhPZiIsInN1YnN0cmluZyIsImxlbmd0aCIsImNoZWNrVHhQcm9vZiIsImNoZWNrX3R4X3Byb29mIiwiZ2V0U3BlbmRQcm9vZiIsImdldF9zcGVuZF9wcm9vZiIsImNoZWNrU3BlbmRQcm9vZiIsImNoZWNrX3NwZW5kX3Byb29mIiwiZ2V0UmVzZXJ2ZVByb29mV2FsbGV0IiwiZ2V0X3Jlc2VydmVfcHJvb2Zfd2FsbGV0IiwiZ2V0UmVzZXJ2ZVByb29mQWNjb3VudCIsImFtb3VudCIsImdldF9yZXNlcnZlX3Byb29mX2FjY291bnQiLCJ0b1N0cmluZyIsImNoZWNrUmVzZXJ2ZVByb29mIiwiY2hlY2tfcmVzZXJ2ZV9wcm9vZiIsIk1vbmVyb0NoZWNrUmVzZXJ2ZSIsImdldFR4Tm90ZXMiLCJnZXRfdHhfbm90ZXMiLCJ0eE5vdGVzIiwic2V0VHhOb3RlcyIsIm5vdGVzIiwic2V0X3R4X25vdGVzIiwiZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzIiwiZW50cnlJbmRpY2VzIiwiZW50cmllcyIsImVudHJ5SnNvbiIsImdldF9hZGRyZXNzX2Jvb2tfZW50cmllcyIsIk1vbmVyb0FkZHJlc3NCb29rRW50cnkiLCJhZGRBZGRyZXNzQm9va0VudHJ5IiwiZGVzY3JpcHRpb24iLCJhZGRfYWRkcmVzc19ib29rX2VudHJ5IiwiZWRpdEFkZHJlc3NCb29rRW50cnkiLCJpbmRleCIsInNldEFkZHJlc3MiLCJzZXREZXNjcmlwdGlvbiIsImVkaXRfYWRkcmVzc19ib29rX2VudHJ5IiwiZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeSIsImVudHJ5SWR4IiwiZGVsZXRlX2FkZHJlc3NfYm9va19lbnRyeSIsInRhZ0FjY291bnRzIiwiYWNjb3VudEluZGljZXMiLCJ0YWdfYWNjb3VudHMiLCJ1bnRhZ0FjY291bnRzIiwiZ2V0QWNjb3VudFRhZ3MiLCJhY2NvdW50VGFncyIsImFjY291bnRUYWdKc29uIiwiZ2V0X2FjY291bnRfdGFncyIsIk1vbmVyb0FjY291bnRUYWciLCJzZXRBY2NvdW50VGFnTGFiZWwiLCJzZXRfYWNjb3VudF90YWdfbGFiZWwiLCJnZXRQYXltZW50VXJpIiwiZ2V0X3BheW1lbnRfdXJpIiwicGFyc2VQYXltZW50VXJpIiwiTW9uZXJvVHhDb25maWciLCJwYXJzZV9wYXltZW50X3VyaSIsImdldEF0dHJpYnV0ZSIsImtleSIsInZhbHVlIiwiZ2V0X2F0dHJpYnV0ZSIsInNldEF0dHJpYnV0ZSIsInZhbCIsInNldF9hdHRyaWJ1dGUiLCJzdGFydE1pbmluZyIsIm51bVRocmVhZHMiLCJiYWNrZ3JvdW5kTWluaW5nIiwiaWdub3JlQmF0dGVyeSIsImRhZW1vbiIsIk1vbmVyb0RhZW1vblJwYyIsImNvbm5lY3RUb0RhZW1vblJwYyIsInN0b3BNaW5pbmciLCJpc011bHRpc2lnSW1wb3J0TmVlZGVkIiwiaXNfbXVsdGlzaWdfaW1wb3J0X25lZWRlZCIsImlzTXVsdGlzaWciLCJpc19tdWx0aXNpZyIsImdldE11bHRpc2lnSW5mbyIsIk1vbmVyb011bHRpc2lnSW5mbyIsImdldF9tdWx0aXNpZ19pbmZvIiwicHJlcGFyZU11bHRpc2lnIiwicHJlcGFyZV9tdWx0aXNpZyIsIm1ha2VNdWx0aXNpZyIsIm11bHRpc2lnSGV4ZXMiLCJ0aHJlc2hvbGQiLCJtYWtlX211bHRpc2lnIiwiZXhjaGFuZ2VNdWx0aXNpZ0tleXMiLCJleGNoYW5nZV9tdWx0aXNpZ19rZXlzIiwiTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IiwiZXhwb3J0TXVsdGlzaWdIZXgiLCJleHBvcnRfbXVsdGlzaWdfaGV4IiwiaW1wb3J0TXVsdGlzaWdIZXgiLCJyZWZyZXNoQWZ0ZXJJbXBvcnQiLCJpbXBvcnRfbXVsdGlzaWdfaGV4Iiwic2lnbk11bHRpc2lnVHhIZXgiLCJzaWduX211bHRpc2lnX3R4X2hleCIsIk1vbmVyb011bHRpc2lnU2lnblJlc3VsdCIsInN1Ym1pdE11bHRpc2lnVHhIZXgiLCJzaWduZWRNdWx0aXNpZ1R4SGV4Iiwic3VibWl0X211bHRpc2lnX3R4X2hleCIsImdldERhdGEiLCJ2aWV3T25seSIsImlzVmlld09ubHkiLCJ2aWV3cyIsImNhY2hlQnVmZmVyTG9jIiwiZ2V0X2NhY2hlX2ZpbGVfYnVmZmVyIiwidmlldyIsIkRhdGFWaWV3IiwiQXJyYXlCdWZmZXIiLCJpIiwic2V0SW50OCIsIkhFQVBVOCIsInBvaW50ZXIiLCJVaW50OEFycmF5IiwiQllURVNfUEVSX0VMRU1FTlQiLCJfZnJlZSIsIkJ1ZmZlciIsImZyb20iLCJidWZmZXIiLCJrZXlzQnVmZmVyTG9jIiwiZ2V0X2tleXNfZmlsZV9idWZmZXIiLCJ1bnNoaWZ0IiwiY2hhbmdlUGFzc3dvcmQiLCJvbGRQYXNzd29yZCIsIm5ld1Bhc3N3b3JkIiwiY2hhbmdlX3dhbGxldF9wYXNzd29yZCIsImVyck1zZyIsImNsb3NlIiwiZ2V0TnVtQmxvY2tzVG9VbmxvY2siLCJnZXRUeCIsImdldEluY29taW5nVHJhbnNmZXJzIiwiZ2V0T3V0Z29pbmdUcmFuc2ZlcnMiLCJjcmVhdGVUeCIsInJlbGF5VHgiLCJnZXRUeE5vdGUiLCJzZXRUeE5vdGUiLCJub3RlIiwicHJveHlUb1dvcmtlciIsIm5ldHdvcmtUeXBlIiwiZGFlbW9uVXJpIiwiZGFlbW9uVXNlcm5hbWUiLCJkYWVtb25QYXNzd29yZCIsIm9wZW5fd2FsbGV0X2Z1bGwiLCJrZXlzRGF0YSIsImNhY2hlRGF0YSIsImdldFJlZ3Rlc3QiLCJicm93c2VyTWFpblBhdGgiLCJjb25zb2xlIiwiZXJyb3IiLCJpc0VuYWJsZWQiLCJzZXRfbGlzdGVuZXIiLCJuZXdMaXN0ZW5lckhhbmRsZSIsImhlaWdodCIsImVuZEhlaWdodCIsInBlcmNlbnREb25lIiwib25TeW5jUHJvZ3Jlc3MiLCJvbk5ld0Jsb2NrIiwibmV3QmFsYW5jZVN0ciIsIm5ld1VubG9ja2VkQmFsYW5jZVN0ciIsIm9uQmFsYW5jZXNDaGFuZ2VkIiwiYW1vdW50U3RyIiwidW5sb2NrVGltZSIsImlzTG9ja2VkIiwib25PdXRwdXRSZWNlaXZlZCIsImFjY291bnRJZHhTdHIiLCJzdWJhZGRyZXNzSWR4U3RyIiwib25PdXRwdXRTcGVudCIsInNhbml0aXplQmxvY2siLCJibG9jayIsInNhbml0aXplVHhXYWxsZXQiLCJhY2NvdW50Iiwic3ViYWRkcmVzcyIsImRlc2VyaWFsaXplQmxvY2tzIiwiYmxvY2tzSnNvbiIsImRlc2VyaWFsaXplZEJsb2NrcyIsImJsb2NrcyIsImJsb2NrSnNvbiIsIk1vbmVyb0Jsb2NrIiwiRGVzZXJpYWxpemF0aW9uVHlwZSIsIlRYX1dBTExFVCIsInNldEJsb2NrIiwiZ2V0SGFzaGVzIiwidHhNYXAiLCJNYXAiLCJnZXRIYXNoIiwidHhzU29ydGVkIiwidHJhbnNmZXJzIiwiZ2V0T3V0Z29pbmdUcmFuc2ZlciIsInRyYW5zZmVyIiwib3V0cHV0cyIsIm91dHB1dCIsInNldEJyb3dzZXJNYWluUGF0aCIsIlBhdGgiLCJub3JtYWxpemUiLCJpc0Nsb3NlZCIsIndhbGxldERpciIsImRpcm5hbWUiLCJta2RpciIsImRhdGEiLCJ3cml0ZUZpbGUiLCJvbGRQYXRoIiwidW5saW5rIiwicGF0aE5ldyIsInJlbmFtZSIsImV4cG9ydHMiLCJkZWZhdWx0IiwiTW9uZXJvV2FsbGV0S2V5c1Byb3h5Iiwid2FsbGV0SWQiLCJpbnZva2VXb3JrZXIiLCJnZXRXb3JrZXIiLCJ3b3JrZXIiLCJ3cmFwcGVkTGlzdGVuZXJzIiwiYXJndW1lbnRzIiwidXJpT3JScGNDb25uZWN0aW9uIiwiZ2V0Q29uZmlnIiwicnBjQ29uZmlnIiwid3JhcHBlZExpc3RlbmVyIiwiV2FsbGV0V29ya2VyTGlzdGVuZXIiLCJsaXN0ZW5lcklkIiwiZ2V0SWQiLCJhZGRXb3JrZXJDYWxsYmFjayIsImdldExpc3RlbmVyIiwicmVtb3ZlV29ya2VyQ2FsbGJhY2siLCJzcGxpY2UiLCJyZXN1bHRKc29uIiwiYmxvY2tKc29ucyIsImtleUltYWdlc0pzb24iLCJhbm5vdW5jZVN5bmNQcm9ncmVzcyIsImFubm91bmNlTmV3QmxvY2siLCJhbm5vdW5jZUJhbGFuY2VzQ2hhbmdlZCIsIk1vbmVyb091dHB1dFdhbGxldCIsInNldEFtb3VudCIsInNldEFjY291bnRJbmRleCIsInNldFN1YmFkZHJlc3NJbmRleCIsInNldEhhc2giLCJzZXRWZXJzaW9uIiwic2V0VW5sb2NrVGltZSIsInNldFR4Iiwic2V0T3V0cHV0cyIsInNldElzSW5jb21pbmciLCJzZXRJc0xvY2tlZCIsInNldEhlaWdodCIsInNldElzQ29uZmlybWVkIiwic2V0SW5UeFBvb2wiLCJzZXRJc0ZhaWxlZCIsImFubm91bmNlT3V0cHV0UmVjZWl2ZWQiLCJwYXJzZUludCIsInNldElucHV0cyIsImFubm91bmNlT3V0cHV0U3BlbnQiLCJpZCIsImdldElucHV0cyJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL3dhbGxldC9Nb25lcm9XYWxsZXRGdWxsLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IFBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCBHZW5VdGlscyBmcm9tIFwiLi4vY29tbW9uL0dlblV0aWxzXCI7XG5pbXBvcnQgTGlicmFyeVV0aWxzIGZyb20gXCIuLi9jb21tb24vTGlicmFyeVV0aWxzXCI7XG5pbXBvcnQgVGFza0xvb3BlciBmcm9tIFwiLi4vY29tbW9uL1Rhc2tMb29wZXJcIjtcbmltcG9ydCBNb25lcm9BY2NvdW50IGZyb20gXCIuL21vZGVsL01vbmVyb0FjY291bnRcIjtcbmltcG9ydCBNb25lcm9BY2NvdW50VGFnIGZyb20gXCIuL21vZGVsL01vbmVyb0FjY291bnRUYWdcIjtcbmltcG9ydCBNb25lcm9BZGRyZXNzQm9va0VudHJ5IGZyb20gXCIuL21vZGVsL01vbmVyb0FkZHJlc3NCb29rRW50cnlcIjtcbmltcG9ydCBNb25lcm9CbG9jayBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0Jsb2NrXCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2tUeCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9DaGVja1R4XCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2tSZXNlcnZlIGZyb20gXCIuL21vZGVsL01vbmVyb0NoZWNrUmVzZXJ2ZVwiO1xuaW1wb3J0IE1vbmVyb0RhZW1vblJwYyBmcm9tIFwiLi4vZGFlbW9uL01vbmVyb0RhZW1vblJwY1wiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuLi9jb21tb24vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBNb25lcm9JbmNvbWluZ1RyYW5zZmVyIGZyb20gXCIuL21vZGVsL01vbmVyb0luY29taW5nVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvS2V5SW1hZ2VcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnSW5mbyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ0luZm9cIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnU2lnblJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb05ldHdvcmtUeXBlIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvTmV0d29ya1R5cGVcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRwdXRRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb091dHB1dFdhbGxldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRwdXRXYWxsZXRcIjtcbmltcG9ydCBNb25lcm9ScGNDb25uZWN0aW9uIGZyb20gXCIuLi9jb21tb24vTW9uZXJvUnBjQ29ubmVjdGlvblwiO1xuaW1wb3J0IE1vbmVyb1N1YmFkZHJlc3MgZnJvbSBcIi4vbW9kZWwvTW9uZXJvU3ViYWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb1N5bmNSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvU3luY1Jlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb1RyYW5zZmVyIGZyb20gXCIuL21vZGVsL01vbmVyb1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvVHJhbnNmZXJRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UcmFuc2ZlclF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvVHhDb25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhDb25maWdcIjtcbmltcG9ydCBNb25lcm9UeFByaW9yaXR5IGZyb20gXCIuL21vZGVsL01vbmVyb1R4UHJpb3JpdHlcIjtcbmltcG9ydCBNb25lcm9UeFF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb1R4UXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeFNldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFNldFwiO1xuaW1wb3J0IE1vbmVyb1R4IGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvVHhcIjtcbmltcG9ydCBNb25lcm9UeFdhbGxldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFdhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1dhbGxldCBmcm9tIFwiLi9Nb25lcm9XYWxsZXRcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRDb25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvV2FsbGV0Q29uZmlnXCI7XG5pbXBvcnQgeyBNb25lcm9XYWxsZXRLZXlzLCBNb25lcm9XYWxsZXRLZXlzUHJveHkgfSBmcm9tIFwiLi9Nb25lcm9XYWxsZXRLZXlzXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0TGlzdGVuZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvV2FsbGV0TGlzdGVuZXJcIjtcbmltcG9ydCBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZVwiO1xuaW1wb3J0IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb1ZlcnNpb24gZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9WZXJzaW9uXCI7XG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XG5cbi8qKlxuICogSW1wbGVtZW50cyBhIE1vbmVybyB3YWxsZXQgdXNpbmcgY2xpZW50LXNpZGUgV2ViQXNzZW1ibHkgYmluZGluZ3MgdG8gbW9uZXJvLXByb2plY3QncyB3YWxsZXQyIGluIEMrKy5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTW9uZXJvV2FsbGV0RnVsbCBleHRlbmRzIE1vbmVyb1dhbGxldEtleXMge1xuXG4gIC8vIHN0YXRpYyB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIHN0YXRpYyByZWFkb25seSBERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TID0gMjAwMDA7XG4gIHByb3RlY3RlZCBzdGF0aWMgRlM7XG5cbiAgLy8gaW5zdGFuY2UgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBwYXRoOiBzdHJpbmc7XG4gIHByb3RlY3RlZCBwYXNzd29yZDogc3RyaW5nO1xuICBwcm90ZWN0ZWQgbGlzdGVuZXJzOiBNb25lcm9XYWxsZXRMaXN0ZW5lcltdO1xuICBwcm90ZWN0ZWQgZnM6IGFueTtcbiAgcHJvdGVjdGVkIHdhc21MaXN0ZW5lcjogV2FsbGV0V2FzbUxpc3RlbmVyO1xuICBwcm90ZWN0ZWQgd2FzbUxpc3RlbmVySGFuZGxlOiBudW1iZXI7XG4gIHByb3RlY3RlZCByZWplY3RVbmF1dGhvcml6ZWQ6IGJvb2xlYW47XG4gIHByb3RlY3RlZCByZWplY3RVbmF1dGhvcml6ZWRDb25maWdJZDogc3RyaW5nO1xuICBwcm90ZWN0ZWQgc3luY1BlcmlvZEluTXM6IG51bWJlcjtcbiAgcHJvdGVjdGVkIHN5bmNMb29wZXI6IFRhc2tMb29wZXI7XG4gIHByb3RlY3RlZCBicm93c2VyTWFpblBhdGg6IHN0cmluZztcblxuICAvKipcbiAgICogSW50ZXJuYWwgY29uc3RydWN0b3Igd2hpY2ggaXMgZ2l2ZW4gdGhlIG1lbW9yeSBhZGRyZXNzIG9mIGEgQysrIHdhbGxldCBpbnN0YW5jZS5cbiAgICogXG4gICAqIFRoaXMgY29uc3RydWN0b3Igc2hvdWxkIGJlIGNhbGxlZCB0aHJvdWdoIHN0YXRpYyB3YWxsZXQgY3JlYXRpb24gdXRpbGl0aWVzIGluIHRoaXMgY2xhc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gY3BwQWRkcmVzcyAtIGFkZHJlc3Mgb2YgdGhlIHdhbGxldCBpbnN0YW5jZSBpbiBDKytcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggLSBwYXRoIG9mIHRoZSB3YWxsZXQgaW5zdGFuY2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhc3N3b3JkIC0gcGFzc3dvcmQgb2YgdGhlIHdhbGxldCBpbnN0YW5jZVxuICAgKiBAcGFyYW0ge0ZpbGVTeXN0ZW19IGZzIC0gbm9kZS5qcy1jb21wYXRpYmxlIGZpbGUgc3lzdGVtIHRvIHJlYWQvd3JpdGUgd2FsbGV0IGZpbGVzXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gcmVqZWN0VW5hdXRob3JpemVkIC0gc3BlY2lmaWVzIGlmIHVuYXV0aG9yaXplZCByZXF1ZXN0cyAoZS5nLiBzZWxmLXNpZ25lZCBjZXJ0aWZpY2F0ZXMpIHNob3VsZCBiZSByZWplY3RlZFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcmVqZWN0VW5hdXRob3JpemVkRm5JZCAtIHVuaXF1ZSBpZGVudGlmaWVyIGZvciBodHRwX2NsaWVudF93YXNtIHRvIHF1ZXJ5IHJlamVjdFVuYXV0aG9yaXplZFxuICAgKiBAcGFyYW0ge01vbmVyb1dhbGxldEZ1bGxQcm94eX0gd2FsbGV0UHJveHkgLSBwcm94eSB0byBpbnZva2Ugd2FsbGV0IG9wZXJhdGlvbnMgaW4gYSB3ZWIgd29ya2VyXG4gICAqIFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgY29uc3RydWN0b3IoY3BwQWRkcmVzcywgcGF0aCwgcGFzc3dvcmQsIGZzLCByZWplY3RVbmF1dGhvcml6ZWQsIHJlamVjdFVuYXV0aG9yaXplZEZuSWQsIHdhbGxldFByb3h5PzogTW9uZXJvV2FsbGV0RnVsbFByb3h5KSB7XG4gICAgc3VwZXIoY3BwQWRkcmVzcywgd2FsbGV0UHJveHkpO1xuICAgIGlmICh3YWxsZXRQcm94eSkgcmV0dXJuO1xuICAgIHRoaXMucGF0aCA9IHBhdGg7XG4gICAgdGhpcy5wYXNzd29yZCA9IHBhc3N3b3JkO1xuICAgIHRoaXMubGlzdGVuZXJzID0gW107XG4gICAgdGhpcy5mcyA9IGZzID8gZnMgOiAocGF0aCA/IE1vbmVyb1dhbGxldEZ1bGwuZ2V0RnMoKSA6IHVuZGVmaW5lZCk7XG4gICAgdGhpcy5faXNDbG9zZWQgPSBmYWxzZTtcbiAgICB0aGlzLndhc21MaXN0ZW5lciA9IG5ldyBXYWxsZXRXYXNtTGlzdGVuZXIodGhpcyk7IC8vIHJlY2VpdmVzIG5vdGlmaWNhdGlvbnMgZnJvbSB3YXNtIGMrK1xuICAgIHRoaXMud2FzbUxpc3RlbmVySGFuZGxlID0gMDsgICAgICAgICAgICAgICAgICAgICAgLy8gbWVtb3J5IGFkZHJlc3Mgb2YgdGhlIHdhbGxldCBsaXN0ZW5lciBpbiBjKytcbiAgICB0aGlzLnJlamVjdFVuYXV0aG9yaXplZCA9IHJlamVjdFVuYXV0aG9yaXplZDtcbiAgICB0aGlzLnJlamVjdFVuYXV0aG9yaXplZENvbmZpZ0lkID0gcmVqZWN0VW5hdXRob3JpemVkRm5JZDtcbiAgICB0aGlzLnN5bmNQZXJpb2RJbk1zID0gTW9uZXJvV2FsbGV0RnVsbC5ERUZBVUxUX1NZTkNfUEVSSU9EX0lOX01TO1xuICAgIExpYnJhcnlVdGlscy5zZXRSZWplY3RVbmF1dGhvcml6ZWRGbihyZWplY3RVbmF1dGhvcml6ZWRGbklkLCAoKSA9PiB0aGlzLnJlamVjdFVuYXV0aG9yaXplZCk7IC8vIHJlZ2lzdGVyIGZuIGluZm9ybWluZyBpZiB1bmF1dGhvcml6ZWQgcmVxcyBzaG91bGQgYmUgcmVqZWN0ZWRcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBTVEFUSUMgVVRJTElUSUVTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICAvKipcbiAgICogQ2hlY2sgaWYgYSB3YWxsZXQgZXhpc3RzIGF0IGEgZ2l2ZW4gcGF0aC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gcGF0aCBvZiB0aGUgd2FsbGV0IG9uIHRoZSBmaWxlIHN5c3RlbVxuICAgKiBAcGFyYW0ge2FueX0gZnMgLSBmaWxlIHN5c3RlbSBjb21wYXRpYmxlIHdpdGggTm9kZS5qcyBgZnMucHJvbWlzZXNgIEFQSSAoZGVmYXVsdHMgdG8gZGlzayBvciBpbi1tZW1vcnkgRlMgaWYgYnJvd3NlcilcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiBhIHdhbGxldCBleGlzdHMgYXQgdGhlIGdpdmVuIHBhdGgsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIHdhbGxldEV4aXN0cyhwYXRoLCBmcykge1xuICAgIGFzc2VydChwYXRoLCBcIk11c3QgcHJvdmlkZSBhIHBhdGggdG8gbG9vayBmb3IgYSB3YWxsZXRcIik7XG4gICAgaWYgKCFmcykgZnMgPSBNb25lcm9XYWxsZXRGdWxsLmdldEZzKCk7XG4gICAgaWYgKCFmcykgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGZpbGUgc3lzdGVtIHRvIGNoZWNrIGlmIHdhbGxldCBleGlzdHNcIik7XG4gICAgbGV0IGV4aXN0cyA9IGF3YWl0IExpYnJhcnlVdGlscy5leGlzdHMoZnMsIHBhdGggKyBcIi5rZXlzXCIpO1xuICAgIExpYnJhcnlVdGlscy5sb2coMSwgXCJXYWxsZXQgZXhpc3RzIGF0IFwiICsgcGF0aCArIFwiOiBcIiArIGV4aXN0cyk7XG4gICAgcmV0dXJuIGV4aXN0cztcbiAgfVxuICBcbiAgc3RhdGljIGFzeW5jIG9wZW5XYWxsZXQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pIHtcblxuICAgIC8vIHZhbGlkYXRlIGNvbmZpZ1xuICAgIGNvbmZpZyA9IG5ldyBNb25lcm9XYWxsZXRDb25maWcoY29uZmlnKTtcbiAgICBpZiAoY29uZmlnLmdldFByb3h5VG9Xb3JrZXIoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UHJveHlUb1dvcmtlcih0cnVlKTtcbiAgICBpZiAoY29uZmlnLmdldFNlZWQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc3BlY2lmeSBzZWVkIHdoZW4gb3BlbmluZyB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkT2Zmc2V0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgc2VlZCBvZmZzZXQgd2hlbiBvcGVuaW5nIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFByaW1hcnlBZGRyZXNzKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgcHJpbWFyeSBhZGRyZXNzIHdoZW4gb3BlbmluZyB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQcml2YXRlVmlld0tleSgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHByaXZhdGUgdmlldyBrZXkgd2hlbiBvcGVuaW5nIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFByaXZhdGVTcGVuZEtleSgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzcGVjaWZ5IHByaXZhdGUgc3BlbmQga2V5IHdoZW4gb3BlbmluZyB3YWxsZXRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgcmVzdG9yZSBoZWlnaHQgd2hlbiBvcGVuaW5nIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldExhbmd1YWdlKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNwZWNpZnkgbGFuZ3VhZ2Ugd2hlbiBvcGVuaW5nIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFNhdmVDdXJyZW50KCkgPT09IHRydWUpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzYXZlIGN1cnJlbnQgd2FsbGV0IHdoZW4gb3BlbmluZyBmdWxsIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldEZzKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldEZzKE1vbmVyb1dhbGxldEZ1bGwuZ2V0RnMoKSk7XG5cbiAgICAvLyBzZXQgc2VydmVyIGZyb20gY29ubmVjdGlvbiBtYW5hZ2VyIGlmIHByb3ZpZGVkXG4gICAgaWYgKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpKSB7XG4gICAgICBpZiAoY29uZmlnLmdldFNlcnZlcigpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgY2FuIGJlIG9wZW5lZCB3aXRoIGEgc2VydmVyIG9yIGNvbm5lY3Rpb24gbWFuYWdlciBidXQgbm90IGJvdGhcIik7XG4gICAgICBjb25maWcuc2V0U2VydmVyKGNvbmZpZy5nZXRDb25uZWN0aW9uTWFuYWdlcigpLmdldENvbm5lY3Rpb24oKSk7XG4gICAgfVxuXG4gICAgLy8gcmVhZCB3YWxsZXQgZGF0YSBmcm9tIGRpc2sgdW5sZXNzIHByb3ZpZGVkXG4gICAgaWYgKCFjb25maWcuZ2V0S2V5c0RhdGEoKSkge1xuICAgICAgbGV0IGZzID0gY29uZmlnLmdldEZzKCk7XG4gICAgICBpZiAoIWZzKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgZmlsZSBzeXN0ZW0gdG8gcmVhZCB3YWxsZXQgZGF0YSBmcm9tXCIpO1xuICAgICAgaWYgKCFhd2FpdCB0aGlzLndhbGxldEV4aXN0cyhjb25maWcuZ2V0UGF0aCgpLCBmcykpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBkb2VzIG5vdCBleGlzdCBhdCBwYXRoOiBcIiArIGNvbmZpZy5nZXRQYXRoKCkpO1xuICAgICAgY29uZmlnLnNldEtleXNEYXRhKGF3YWl0IGZzLnJlYWRGaWxlKGNvbmZpZy5nZXRQYXRoKCkgKyBcIi5rZXlzXCIpKTtcbiAgICAgIGNvbmZpZy5zZXRDYWNoZURhdGEoYXdhaXQgTGlicmFyeVV0aWxzLmV4aXN0cyhmcywgY29uZmlnLmdldFBhdGgoKSkgPyBhd2FpdCBmcy5yZWFkRmlsZShjb25maWcuZ2V0UGF0aCgpKSA6IFwiXCIpO1xuICAgIH1cblxuICAgIC8vIG9wZW4gd2FsbGV0IGZyb20gZGF0YVxuICAgIGNvbnN0IHdhbGxldCA9IGF3YWl0IE1vbmVyb1dhbGxldEZ1bGwub3BlbldhbGxldERhdGEoY29uZmlnKTtcblxuICAgIC8vIHNldCBjb25uZWN0aW9uIG1hbmFnZXJcbiAgICBhd2FpdCB3YWxsZXQuc2V0Q29ubmVjdGlvbk1hbmFnZXIoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpO1xuICAgIHJldHVybiB3YWxsZXQ7XG4gIH1cbiAgXG4gIHN0YXRpYyBhc3luYyBjcmVhdGVXYWxsZXQoY29uZmlnOiBNb25lcm9XYWxsZXRDb25maWcpOiBQcm9taXNlPE1vbmVyb1dhbGxldEZ1bGw+IHtcblxuICAgIC8vIHZhbGlkYXRlIGNvbmZpZ1xuICAgIGlmIChjb25maWcgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGNvbmZpZyB0byBjcmVhdGUgd2FsbGV0XCIpO1xuICAgIGlmIChjb25maWcuZ2V0U2VlZCgpICE9PSB1bmRlZmluZWQgJiYgKGNvbmZpZy5nZXRQcmltYXJ5QWRkcmVzcygpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldFByaXZhdGVWaWV3S2V5KCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWcuZ2V0UHJpdmF0ZVNwZW5kS2V5KCkgIT09IHVuZGVmaW5lZCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBtYXkgYmUgaW5pdGlhbGl6ZWQgd2l0aCBhIHNlZWQgb3Iga2V5cyBidXQgbm90IGJvdGhcIik7XG4gICAgaWYgKGNvbmZpZy5nZXROZXR3b3JrVHlwZSgpID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBhIG5ldHdvcmtUeXBlOiAnbWFpbm5ldCcsICd0ZXN0bmV0JyBvciAnc3RhZ2VuZXQnXCIpO1xuICAgIE1vbmVyb05ldHdvcmtUeXBlLnZhbGlkYXRlKGNvbmZpZy5nZXROZXR3b3JrVHlwZSgpKTtcbiAgICBpZiAoY29uZmlnLmdldFNhdmVDdXJyZW50KCkgPT09IHRydWUpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzYXZlIGN1cnJlbnQgd2FsbGV0IHdoZW4gY3JlYXRpbmcgZnVsbCBXQVNNIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFBhdGgoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UGF0aChcIlwiKTtcbiAgICBpZiAoY29uZmlnLmdldFBhdGgoKSAmJiBhd2FpdCBNb25lcm9XYWxsZXRGdWxsLndhbGxldEV4aXN0cyhjb25maWcuZ2V0UGF0aCgpLCBjb25maWcuZ2V0RnMoKSkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBhbHJlYWR5IGV4aXN0czogXCIgKyBjb25maWcuZ2V0UGF0aCgpKTtcbiAgICBpZiAoY29uZmlnLmdldFBhc3N3b3JkKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFBhc3N3b3JkKFwiXCIpO1xuXG4gICAgLy8gc2V0IHNlcnZlciBmcm9tIGNvbm5lY3Rpb24gbWFuYWdlciBpZiBwcm92aWRlZFxuICAgIGlmIChjb25maWcuZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKSkge1xuICAgICAgaWYgKGNvbmZpZy5nZXRTZXJ2ZXIoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGNhbiBiZSBjcmVhdGVkIHdpdGggYSBzZXJ2ZXIgb3IgY29ubmVjdGlvbiBtYW5hZ2VyIGJ1dCBub3QgYm90aFwiKTtcbiAgICAgIGNvbmZpZy5zZXRTZXJ2ZXIoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkuZ2V0Q29ubmVjdGlvbigpKTtcbiAgICB9XG5cbiAgICAvLyBjcmVhdGUgcHJveGllZCBvciBsb2NhbCB3YWxsZXRcbiAgICBsZXQgd2FsbGV0O1xuICAgIGlmIChjb25maWcuZ2V0UHJveHlUb1dvcmtlcigpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRQcm94eVRvV29ya2VyKHRydWUpO1xuICAgIGlmIChjb25maWcuZ2V0UHJveHlUb1dvcmtlcigpKSB7XG4gICAgICBsZXQgd2FsbGV0UHJveHkgPSBhd2FpdCBNb25lcm9XYWxsZXRGdWxsUHJveHkuY3JlYXRlV2FsbGV0KGNvbmZpZyk7XG4gICAgICB3YWxsZXQgPSBuZXcgTW9uZXJvV2FsbGV0RnVsbCh1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB3YWxsZXRQcm94eSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChjb25maWcuZ2V0U2VlZCgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKGNvbmZpZy5nZXRMYW5ndWFnZSgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIGxhbmd1YWdlIHdoZW4gY3JlYXRpbmcgd2FsbGV0IGZyb20gc2VlZFwiKTtcbiAgICAgICAgd2FsbGV0ID0gYXdhaXQgTW9uZXJvV2FsbGV0RnVsbC5jcmVhdGVXYWxsZXRGcm9tU2VlZChjb25maWcpO1xuICAgICAgfSBlbHNlIGlmIChjb25maWcuZ2V0UHJpdmF0ZVNwZW5kS2V5KCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWcuZ2V0UHJpbWFyeUFkZHJlc3MoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmIChjb25maWcuZ2V0U2VlZE9mZnNldCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHNlZWRPZmZzZXQgd2hlbiBjcmVhdGluZyB3YWxsZXQgZnJvbSBrZXlzXCIpO1xuICAgICAgICB3YWxsZXQgPSBhd2FpdCBNb25lcm9XYWxsZXRGdWxsLmNyZWF0ZVdhbGxldEZyb21LZXlzKGNvbmZpZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoY29uZmlnLmdldFNlZWRPZmZzZXQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSBzZWVkT2Zmc2V0IHdoZW4gY3JlYXRpbmcgcmFuZG9tIHdhbGxldFwiKTtcbiAgICAgICAgaWYgKGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgcmVzdG9yZUhlaWdodCB3aGVuIGNyZWF0aW5nIHJhbmRvbSB3YWxsZXRcIik7XG4gICAgICAgIHdhbGxldCA9IGF3YWl0IE1vbmVyb1dhbGxldEZ1bGwuY3JlYXRlV2FsbGV0UmFuZG9tKGNvbmZpZyk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIHNldCBjb25uZWN0aW9uIG1hbmFnZXJcbiAgICBhd2FpdCB3YWxsZXQuc2V0Q29ubmVjdGlvbk1hbmFnZXIoY29uZmlnLmdldENvbm5lY3Rpb25NYW5hZ2VyKCkpO1xuICAgIHJldHVybiB3YWxsZXQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgY3JlYXRlV2FsbGV0RnJvbVNlZWQoY29uZmlnOiBNb25lcm9XYWxsZXRDb25maWcpOiBQcm9taXNlPE1vbmVyb1dhbGxldEZ1bGw+IHtcblxuICAgIC8vIHZhbGlkYXRlIGFuZCBub3JtYWxpemUgcGFyYW1zXG4gICAgbGV0IGRhZW1vbkNvbm5lY3Rpb24gPSBjb25maWcuZ2V0U2VydmVyKCk7XG4gICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZCA9IGRhZW1vbkNvbm5lY3Rpb24gPyBkYWVtb25Db25uZWN0aW9uLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdHJ1ZTtcbiAgICBpZiAoY29uZmlnLmdldFJlc3RvcmVIZWlnaHQoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UmVzdG9yZUhlaWdodCgwKTtcbiAgICBpZiAoY29uZmlnLmdldFNlZWRPZmZzZXQoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0U2VlZE9mZnNldChcIlwiKTtcbiAgICBcbiAgICAvLyBsb2FkIGZ1bGwgd2FzbSBtb2R1bGVcbiAgICBsZXQgbW9kdWxlID0gYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRXYXNtTW9kdWxlKCk7XG4gICAgXG4gICAgLy8gY3JlYXRlIHdhbGxldCBpbiBxdWV1ZVxuICAgIGxldCB3YWxsZXQgPSBhd2FpdCBtb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgLy8gcmVnaXN0ZXIgZm4gaW5mb3JtaW5nIGlmIHVuYXV0aG9yaXplZCByZXFzIHNob3VsZCBiZSByZWplY3RlZFxuICAgICAgICBsZXQgcmVqZWN0VW5hdXRob3JpemVkRm5JZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnNldFJlamVjdFVuYXV0aG9yaXplZEZuKHJlamVjdFVuYXV0aG9yaXplZEZuSWQsICgpID0+IHJlamVjdFVuYXV0aG9yaXplZCk7XG4gICAgICAgIFxuICAgICAgICAvLyBjcmVhdGUgd2FsbGV0IGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgbW9kdWxlLmNyZWF0ZV9mdWxsX3dhbGxldChKU09OLnN0cmluZ2lmeShjb25maWcudG9Kc29uKCkpLCByZWplY3RVbmF1dGhvcml6ZWRGbklkLCBhc3luYyAoY3BwQWRkcmVzcykgPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgY3BwQWRkcmVzcyA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihjcHBBZGRyZXNzKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9XYWxsZXRGdWxsKGNwcEFkZHJlc3MsIGNvbmZpZy5nZXRQYXRoKCksIGNvbmZpZy5nZXRQYXNzd29yZCgpLCBjb25maWcuZ2V0RnMoKSwgY29uZmlnLmdldFNlcnZlcigpID8gY29uZmlnLmdldFNlcnZlcigpLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdW5kZWZpbmVkLCByZWplY3RVbmF1dGhvcml6ZWRGbklkKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgXG4gICAgLy8gc2F2ZSB3YWxsZXRcbiAgICBpZiAoY29uZmlnLmdldFBhdGgoKSkgYXdhaXQgd2FsbGV0LnNhdmUoKTtcbiAgICByZXR1cm4gd2FsbGV0O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIGNyZWF0ZVdhbGxldEZyb21LZXlzKGNvbmZpZzogTW9uZXJvV2FsbGV0Q29uZmlnKTogUHJvbWlzZTxNb25lcm9XYWxsZXRGdWxsPiB7XG5cbiAgICAvLyB2YWxpZGF0ZSBhbmQgbm9ybWFsaXplIHBhcmFtc1xuICAgIE1vbmVyb05ldHdvcmtUeXBlLnZhbGlkYXRlKGNvbmZpZy5nZXROZXR3b3JrVHlwZSgpKTtcbiAgICBpZiAoY29uZmlnLmdldFByaW1hcnlBZGRyZXNzKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFByaW1hcnlBZGRyZXNzKFwiXCIpO1xuICAgIGlmIChjb25maWcuZ2V0UHJpdmF0ZVZpZXdLZXkoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UHJpdmF0ZVZpZXdLZXkoXCJcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQcml2YXRlU3BlbmRLZXkoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UHJpdmF0ZVNwZW5kS2V5KFwiXCIpO1xuICAgIGxldCBkYWVtb25Db25uZWN0aW9uID0gY29uZmlnLmdldFNlcnZlcigpO1xuICAgIGxldCByZWplY3RVbmF1dGhvcml6ZWQgPSBkYWVtb25Db25uZWN0aW9uID8gZGFlbW9uQ29ubmVjdGlvbi5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHRydWU7XG4gICAgaWYgKGNvbmZpZy5nZXRSZXN0b3JlSGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFJlc3RvcmVIZWlnaHQoMCk7XG4gICAgaWYgKGNvbmZpZy5nZXRMYW5ndWFnZSgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRMYW5ndWFnZShcIkVuZ2xpc2hcIik7XG4gICAgXG4gICAgLy8gbG9hZCBmdWxsIHdhc20gbW9kdWxlXG4gICAgbGV0IG1vZHVsZSA9IGF3YWl0IExpYnJhcnlVdGlscy5sb2FkV2FzbU1vZHVsZSgpO1xuICAgIFxuICAgIC8vIGNyZWF0ZSB3YWxsZXQgaW4gcXVldWVcbiAgICBsZXQgd2FsbGV0ID0gYXdhaXQgbW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgLy8gcmVnaXN0ZXIgZm4gaW5mb3JtaW5nIGlmIHVuYXV0aG9yaXplZCByZXFzIHNob3VsZCBiZSByZWplY3RlZFxuICAgICAgICBsZXQgcmVqZWN0VW5hdXRob3JpemVkRm5JZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnNldFJlamVjdFVuYXV0aG9yaXplZEZuKHJlamVjdFVuYXV0aG9yaXplZEZuSWQsICgpID0+IHJlamVjdFVuYXV0aG9yaXplZCk7XG4gICAgICAgIFxuICAgICAgICAvLyBjcmVhdGUgd2FsbGV0IGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgbW9kdWxlLmNyZWF0ZV9mdWxsX3dhbGxldChKU09OLnN0cmluZ2lmeShjb25maWcudG9Kc29uKCkpLCByZWplY3RVbmF1dGhvcml6ZWRGbklkLCBhc3luYyAoY3BwQWRkcmVzcykgPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgY3BwQWRkcmVzcyA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihjcHBBZGRyZXNzKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9XYWxsZXRGdWxsKGNwcEFkZHJlc3MsIGNvbmZpZy5nZXRQYXRoKCksIGNvbmZpZy5nZXRQYXNzd29yZCgpLCBjb25maWcuZ2V0RnMoKSwgY29uZmlnLmdldFNlcnZlcigpID8gY29uZmlnLmdldFNlcnZlcigpLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdW5kZWZpbmVkLCByZWplY3RVbmF1dGhvcml6ZWRGbklkKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgXG4gICAgLy8gc2F2ZSB3YWxsZXRcbiAgICBpZiAoY29uZmlnLmdldFBhdGgoKSkgYXdhaXQgd2FsbGV0LnNhdmUoKTtcbiAgICByZXR1cm4gd2FsbGV0O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIGNyZWF0ZVdhbGxldFJhbmRvbShjb25maWc6IE1vbmVyb1dhbGxldENvbmZpZyk6IFByb21pc2U8TW9uZXJvV2FsbGV0RnVsbD4ge1xuICAgIFxuICAgIC8vIHZhbGlkYXRlIGFuZCBub3JtYWxpemUgcGFyYW1zXG4gICAgaWYgKGNvbmZpZy5nZXRMYW5ndWFnZSgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRMYW5ndWFnZShcIkVuZ2xpc2hcIik7XG4gICAgbGV0IGRhZW1vbkNvbm5lY3Rpb24gPSBjb25maWcuZ2V0U2VydmVyKCk7XG4gICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZCA9IGRhZW1vbkNvbm5lY3Rpb24gPyBkYWVtb25Db25uZWN0aW9uLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdHJ1ZTtcbiAgICBcbiAgICAvLyBsb2FkIHdhc20gbW9kdWxlXG4gICAgbGV0IG1vZHVsZSA9IGF3YWl0IExpYnJhcnlVdGlscy5sb2FkV2FzbU1vZHVsZSgpO1xuICAgIFxuICAgIC8vIGNyZWF0ZSB3YWxsZXQgaW4gcXVldWVcbiAgICBsZXQgd2FsbGV0ID0gYXdhaXQgbW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgLy8gcmVnaXN0ZXIgZm4gaW5mb3JtaW5nIGlmIHVuYXV0aG9yaXplZCByZXFzIHNob3VsZCBiZSByZWplY3RlZFxuICAgICAgICBsZXQgcmVqZWN0VW5hdXRob3JpemVkRm5JZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnNldFJlamVjdFVuYXV0aG9yaXplZEZuKHJlamVjdFVuYXV0aG9yaXplZEZuSWQsICgpID0+IHJlamVjdFVuYXV0aG9yaXplZCk7XG4gICAgICBcbiAgICAgICAgLy8gY3JlYXRlIHdhbGxldCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIG1vZHVsZS5jcmVhdGVfZnVsbF93YWxsZXQoSlNPTi5zdHJpbmdpZnkoY29uZmlnLnRvSnNvbigpKSwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCwgYXN5bmMgKGNwcEFkZHJlc3MpID0+IHtcbiAgICAgICAgICBpZiAodHlwZW9mIGNwcEFkZHJlc3MgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoY3BwQWRkcmVzcykpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvV2FsbGV0RnVsbChjcHBBZGRyZXNzLCBjb25maWcuZ2V0UGF0aCgpLCBjb25maWcuZ2V0UGFzc3dvcmQoKSwgY29uZmlnLmdldEZzKCksIGNvbmZpZy5nZXRTZXJ2ZXIoKSA/IGNvbmZpZy5nZXRTZXJ2ZXIoKS5nZXRSZWplY3RVbmF1dGhvcml6ZWQoKSA6IHVuZGVmaW5lZCwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIFxuICAgIC8vIHNhdmUgd2FsbGV0XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkpIGF3YWl0IHdhbGxldC5zYXZlKCk7XG4gICAgcmV0dXJuIHdhbGxldDtcbiAgfVxuICBcbiAgc3RhdGljIGFzeW5jIGdldFNlZWRMYW5ndWFnZXMoKSB7XG4gICAgbGV0IG1vZHVsZSA9IGF3YWl0IExpYnJhcnlVdGlscy5sb2FkV2FzbU1vZHVsZSgpO1xuICAgIHJldHVybiBtb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBKU09OLnBhcnNlKG1vZHVsZS5nZXRfa2V5c193YWxsZXRfc2VlZF9sYW5ndWFnZXMoKSkubGFuZ3VhZ2VzO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGdldEZzKCkge1xuICAgIGlmICghTW9uZXJvV2FsbGV0RnVsbC5GUykgTW9uZXJvV2FsbGV0RnVsbC5GUyA9IGZzLnByb21pc2VzO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLkZTO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0gV0FMTEVUIE1FVEhPRFMgU1BFQ0lGSUMgVE8gV0FTTSBJTVBMRU1FTlRBVElPTiAtLS0tLS0tLS0tLS0tLVxuXG4gIC8vIFRPRE86IG1vdmUgdGhlc2UgdG8gTW9uZXJvV2FsbGV0LnRzLCBvdGhlcnMgY2FuIGJlIHVuc3VwcG9ydGVkXG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBtYXhpbXVtIGhlaWdodCBvZiB0aGUgcGVlcnMgdGhlIHdhbGxldCdzIGRhZW1vbiBpcyBjb25uZWN0ZWQgdG8uXG4gICAqXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyPn0gdGhlIG1heGltdW0gaGVpZ2h0IG9mIHRoZSBwZWVycyB0aGUgd2FsbGV0J3MgZGFlbW9uIGlzIGNvbm5lY3RlZCB0b1xuICAgKi9cbiAgYXN5bmMgZ2V0RGFlbW9uTWF4UGVlckhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0RGFlbW9uTWF4UGVlckhlaWdodCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBcbiAgICAgICAgLy8gY2FsbCB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIHRoaXMubW9kdWxlLmdldF9kYWVtb25fbWF4X3BlZXJfaGVpZ2h0KHRoaXMuY3BwQWRkcmVzcywgKHJlc3ApID0+IHtcbiAgICAgICAgICByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSB3YWxsZXQncyBkYWVtb24gaXMgc3luY2VkIHdpdGggdGhlIG5ldHdvcmsuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSB0cnVlIGlmIHRoZSBkYWVtb24gaXMgc3luY2VkIHdpdGggdGhlIG5ldHdvcmssIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgYXN5bmMgaXNEYWVtb25TeW5jZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pc0RhZW1vblN5bmNlZCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBcbiAgICAgICAgLy8gY2FsbCB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIHRoaXMubW9kdWxlLmlzX2RhZW1vbl9zeW5jZWQodGhpcy5jcHBBZGRyZXNzLCAocmVzcCkgPT4ge1xuICAgICAgICAgIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIHdhbGxldCBpcyBzeW5jZWQgd2l0aCB0aGUgZGFlbW9uLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiB0aGUgd2FsbGV0IGlzIHN5bmNlZCB3aXRoIHRoZSBkYWVtb24sIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgYXN5bmMgaXNTeW5jZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pc1N5bmNlZCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmlzX3N5bmNlZCh0aGlzLmNwcEFkZHJlc3MsIChyZXNwKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgd2FsbGV0J3MgbmV0d29yayB0eXBlIChtYWlubmV0LCB0ZXN0bmV0LCBvciBzdGFnZW5ldCkuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb05ldHdvcmtUeXBlPn0gdGhlIHdhbGxldCdzIG5ldHdvcmsgdHlwZVxuICAgKi9cbiAgYXN5bmMgZ2V0TmV0d29ya1R5cGUoKTogUHJvbWlzZTxNb25lcm9OZXR3b3JrVHlwZT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0TmV0d29ya1R5cGUoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gdGhpcy5tb2R1bGUuZ2V0X25ldHdvcmtfdHlwZSh0aGlzLmNwcEFkZHJlc3MpO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBoZWlnaHQgb2YgdGhlIGZpcnN0IGJsb2NrIHRoYXQgdGhlIHdhbGxldCBzY2Fucy5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyPn0gdGhlIGhlaWdodCBvZiB0aGUgZmlyc3QgYmxvY2sgdGhhdCB0aGUgd2FsbGV0IHNjYW5zXG4gICAqL1xuICBhc3luYyBnZXRSZXN0b3JlSGVpZ2h0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRSZXN0b3JlSGVpZ2h0KCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLmdldF9yZXN0b3JlX2hlaWdodCh0aGlzLmNwcEFkZHJlc3MpO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogU2V0IHRoZSBoZWlnaHQgb2YgdGhlIGZpcnN0IGJsb2NrIHRoYXQgdGhlIHdhbGxldCBzY2Fucy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSByZXN0b3JlSGVpZ2h0IC0gaGVpZ2h0IG9mIHRoZSBmaXJzdCBibG9jayB0aGF0IHRoZSB3YWxsZXQgc2NhbnNcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHNldFJlc3RvcmVIZWlnaHQocmVzdG9yZUhlaWdodDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zZXRSZXN0b3JlSGVpZ2h0KHJlc3RvcmVIZWlnaHQpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRoaXMubW9kdWxlLnNldF9yZXN0b3JlX2hlaWdodCh0aGlzLmNwcEFkZHJlc3MsIHJlc3RvcmVIZWlnaHQpO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogTW92ZSB0aGUgd2FsbGV0IGZyb20gaXRzIGN1cnJlbnQgcGF0aCB0byB0aGUgZ2l2ZW4gcGF0aC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gdGhlIHdhbGxldCdzIGRlc3RpbmF0aW9uIHBhdGhcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIG1vdmVUbyhwYXRoOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLm1vdmVUbyhwYXRoKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5tb3ZlVG8ocGF0aCwgdGhpcyk7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIENPTU1PTiBXQUxMRVQgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICBhc3luYyBhZGRMaXN0ZW5lcihsaXN0ZW5lcjogTW9uZXJvV2FsbGV0TGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBhd2FpdCBzdXBlci5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgYXdhaXQgdGhpcy5yZWZyZXNoTGlzdGVuaW5nKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgYXdhaXQgc3VwZXIucmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIGF3YWl0IHRoaXMucmVmcmVzaExpc3RlbmluZygpO1xuICB9XG4gIFxuICBnZXRMaXN0ZW5lcnMoKTogTW9uZXJvV2FsbGV0TGlzdGVuZXJbXSB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRMaXN0ZW5lcnMoKTtcbiAgICByZXR1cm4gc3VwZXIuZ2V0TGlzdGVuZXJzKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHNldERhZW1vbkNvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uPzogUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPiB8IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2V0RGFlbW9uQ29ubmVjdGlvbih1cmlPckNvbm5lY3Rpb24pO1xuXG4gICAgLy8gbm9ybWFsaXplIGNvbm5lY3Rpb25cbiAgICBsZXQgY29ubmVjdGlvbiA9ICF1cmlPckNvbm5lY3Rpb24gPyB1bmRlZmluZWQgOiB1cmlPckNvbm5lY3Rpb24gaW5zdGFuY2VvZiBNb25lcm9ScGNDb25uZWN0aW9uID8gdXJpT3JDb25uZWN0aW9uIDogbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uKTtcbiAgICBsZXQgdXJpID0gY29ubmVjdGlvbiAmJiBjb25uZWN0aW9uLmdldFVyaSgpID8gY29ubmVjdGlvbi5nZXRVcmkoKSA6IFwiXCI7XG4gICAgbGV0IHVzZXJuYW1lID0gY29ubmVjdGlvbiAmJiBjb25uZWN0aW9uLmdldFVzZXJuYW1lKCkgPyBjb25uZWN0aW9uLmdldFVzZXJuYW1lKCkgOiBcIlwiO1xuICAgIGxldCBwYXNzd29yZCA9IGNvbm5lY3Rpb24gJiYgY29ubmVjdGlvbi5nZXRQYXNzd29yZCgpID8gY29ubmVjdGlvbi5nZXRQYXNzd29yZCgpIDogXCJcIjtcbiAgICBsZXQgcHJveHlVcmkgPSBjb25uZWN0aW9uICYmIGNvbm5lY3Rpb24uZ2V0UHJveHlVcmkoKSA/IGNvbm5lY3Rpb24uZ2V0UHJveHlVcmkoKSA6IFwiXCI7XG4gICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZCA9IGNvbm5lY3Rpb24gPyBjb25uZWN0aW9uLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdW5kZWZpbmVkO1xuICAgIHRoaXMucmVqZWN0VW5hdXRob3JpemVkID0gcmVqZWN0VW5hdXRob3JpemVkOyAgLy8gcGVyc2lzdCBsb2NhbGx5XG4gICAgXG4gICAgLy8gc2V0IGNvbm5lY3Rpb24gaW4gcXVldWVcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5zZXRfZGFlbW9uX2Nvbm5lY3Rpb24odGhpcy5jcHBBZGRyZXNzLCB1cmksIHVzZXJuYW1lLCBwYXNzd29yZCwgcHJveHlVcmksIChyZXNwKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXREYWVtb25Db25uZWN0aW9uKCk6IFByb21pc2U8TW9uZXJvUnBjQ29ubmVjdGlvbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0RGFlbW9uQ29ubmVjdGlvbigpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIGxldCBjb25uZWN0aW9uQ29udGFpbmVyU3RyID0gdGhpcy5tb2R1bGUuZ2V0X2RhZW1vbl9jb25uZWN0aW9uKHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgICAgIGlmICghY29ubmVjdGlvbkNvbnRhaW5lclN0cikgcmVzb2x2ZSh1bmRlZmluZWQpO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBsZXQganNvbkNvbm5lY3Rpb24gPSBKU09OLnBhcnNlKGNvbm5lY3Rpb25Db250YWluZXJTdHIpO1xuICAgICAgICAgIHJlc29sdmUobmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24oe3VyaToganNvbkNvbm5lY3Rpb24udXJpLCB1c2VybmFtZToganNvbkNvbm5lY3Rpb24udXNlcm5hbWUsIHBhc3N3b3JkOiBqc29uQ29ubmVjdGlvbi5wYXNzd29yZCwgcHJveHlVcmk6IGpzb25Db25uZWN0aW9uLnByb3h5VXJpLCByZWplY3RVbmF1dGhvcml6ZWQ6IHRoaXMucmVqZWN0VW5hdXRob3JpemVkfSkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgaXNDb25uZWN0ZWRUb0RhZW1vbigpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmlzQ29ubmVjdGVkVG9EYWVtb24oKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5pc19jb25uZWN0ZWRfdG9fZGFlbW9uKHRoaXMuY3BwQWRkcmVzcywgKHJlc3ApID0+IHtcbiAgICAgICAgICByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRWZXJzaW9uKCk6IFByb21pc2U8TW9uZXJvVmVyc2lvbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0VmVyc2lvbigpO1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGF0aCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0UGF0aCgpO1xuICAgIHJldHVybiB0aGlzLnBhdGg7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEludGVncmF0ZWRBZGRyZXNzKHN0YW5kYXJkQWRkcmVzcz86IHN0cmluZywgcGF5bWVudElkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0SW50ZWdyYXRlZEFkZHJlc3Moc3RhbmRhcmRBZGRyZXNzLCBwYXltZW50SWQpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGxldCByZXN1bHQgPSB0aGlzLm1vZHVsZS5nZXRfaW50ZWdyYXRlZF9hZGRyZXNzKHRoaXMuY3BwQWRkcmVzcywgc3RhbmRhcmRBZGRyZXNzID8gc3RhbmRhcmRBZGRyZXNzIDogXCJcIiwgcGF5bWVudElkID8gcGF5bWVudElkIDogXCJcIik7XG4gICAgICAgIGlmIChyZXN1bHQuY2hhckF0KDApICE9PSAneycpIHRocm93IG5ldyBNb25lcm9FcnJvcihyZXN1bHQpO1xuICAgICAgICByZXR1cm4gbmV3IE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzKEpTT04ucGFyc2UocmVzdWx0KSk7XG4gICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICBpZiAoZXJyLm1lc3NhZ2UuaW5jbHVkZXMoXCJJbnZhbGlkIHBheW1lbnQgSURcIikpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkludmFsaWQgcGF5bWVudCBJRDogXCIgKyBwYXltZW50SWQpO1xuICAgICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZXJyLm1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyhpbnRlZ3JhdGVkQWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3MpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGxldCByZXN1bHQgPSB0aGlzLm1vZHVsZS5kZWNvZGVfaW50ZWdyYXRlZF9hZGRyZXNzKHRoaXMuY3BwQWRkcmVzcywgaW50ZWdyYXRlZEFkZHJlc3MpO1xuICAgICAgICBpZiAocmVzdWx0LmNoYXJBdCgwKSAhPT0gJ3snKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IocmVzdWx0KTtcbiAgICAgICAgcmV0dXJuIG5ldyBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyhKU09OLnBhcnNlKHJlc3VsdCkpO1xuICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGVyci5tZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRIZWlnaHQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfaGVpZ2h0KHRoaXMuY3BwQWRkcmVzcywgKHJlc3ApID0+IHtcbiAgICAgICAgICByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXREYWVtb25IZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldERhZW1vbkhlaWdodCgpO1xuICAgIGlmICghYXdhaXQgdGhpcy5pc0Nvbm5lY3RlZFRvRGFlbW9uKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBpcyBub3QgY29ubmVjdGVkIHRvIGRhZW1vblwiKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfZGFlbW9uX2hlaWdodCh0aGlzLmNwcEFkZHJlc3MsIChyZXNwKSA9PiB7XG4gICAgICAgICAgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0QnlEYXRlKHllYXI6IG51bWJlciwgbW9udGg6IG51bWJlciwgZGF5OiBudW1iZXIpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0SGVpZ2h0QnlEYXRlKHllYXIsIG1vbnRoLCBkYXkpO1xuICAgIGlmICghYXdhaXQgdGhpcy5pc0Nvbm5lY3RlZFRvRGFlbW9uKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBpcyBub3QgY29ubmVjdGVkIHRvIGRhZW1vblwiKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfaGVpZ2h0X2J5X2RhdGUodGhpcy5jcHBBZGRyZXNzLCB5ZWFyLCBtb250aCwgZGF5LCAocmVzcCkgPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgcmVzcCA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogU3luY2hyb25pemUgdGhlIHdhbGxldCB3aXRoIHRoZSBkYWVtb24gYXMgYSBvbmUtdGltZSBzeW5jaHJvbm91cyBwcm9jZXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9XYWxsZXRMaXN0ZW5lcnxudW1iZXJ9IFtsaXN0ZW5lck9yU3RhcnRIZWlnaHRdIC0gbGlzdGVuZXIgeG9yIHN0YXJ0IGhlaWdodCAoZGVmYXVsdHMgdG8gbm8gc3luYyBsaXN0ZW5lciwgdGhlIGxhc3Qgc3luY2VkIGJsb2NrKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3N0YXJ0SGVpZ2h0XSAtIHN0YXJ0SGVpZ2h0IGlmIG5vdCBnaXZlbiBpbiBmaXJzdCBhcmcgKGRlZmF1bHRzIHRvIGxhc3Qgc3luY2VkIGJsb2NrKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFthbGxvd0NvbmN1cnJlbnRDYWxsc10gLSBhbGxvdyBvdGhlciB3YWxsZXQgbWV0aG9kcyB0byBiZSBwcm9jZXNzZWQgc2ltdWx0YW5lb3VzbHkgZHVyaW5nIHN5bmMgKGRlZmF1bHQgZmFsc2UpPGJyPjxicj48Yj5XQVJOSU5HPC9iPjogZW5hYmxpbmcgdGhpcyBvcHRpb24gd2lsbCBjcmFzaCB3YWxsZXQgZXhlY3V0aW9uIGlmIGFub3RoZXIgY2FsbCBtYWtlcyBhIHNpbXVsdGFuZW91cyBuZXR3b3JrIHJlcXVlc3QuIFRPRE86IHBvc3NpYmxlIHRvIHN5bmMgd2FzbSBuZXR3b3JrIHJlcXVlc3RzIGluIGh0dHBfY2xpZW50X3dhc20uY3BwPyBcbiAgICovXG4gIGFzeW5jIHN5bmMobGlzdGVuZXJPclN0YXJ0SGVpZ2h0PzogTW9uZXJvV2FsbGV0TGlzdGVuZXIgfCBudW1iZXIsIHN0YXJ0SGVpZ2h0PzogbnVtYmVyLCBhbGxvd0NvbmN1cnJlbnRDYWxscyA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9TeW5jUmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zeW5jKGxpc3RlbmVyT3JTdGFydEhlaWdodCwgc3RhcnRIZWlnaHQsIGFsbG93Q29uY3VycmVudENhbGxzKTtcbiAgICBpZiAoIWF3YWl0IHRoaXMuaXNDb25uZWN0ZWRUb0RhZW1vbigpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgaXMgbm90IGNvbm5lY3RlZCB0byBkYWVtb25cIik7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIHBhcmFtc1xuICAgIHN0YXJ0SGVpZ2h0ID0gbGlzdGVuZXJPclN0YXJ0SGVpZ2h0ID09PSB1bmRlZmluZWQgfHwgbGlzdGVuZXJPclN0YXJ0SGVpZ2h0IGluc3RhbmNlb2YgTW9uZXJvV2FsbGV0TGlzdGVuZXIgPyBzdGFydEhlaWdodCA6IGxpc3RlbmVyT3JTdGFydEhlaWdodDtcbiAgICBsZXQgbGlzdGVuZXIgPSBsaXN0ZW5lck9yU3RhcnRIZWlnaHQgaW5zdGFuY2VvZiBNb25lcm9XYWxsZXRMaXN0ZW5lciA/IGxpc3RlbmVyT3JTdGFydEhlaWdodCA6IHVuZGVmaW5lZDtcbiAgICBpZiAoc3RhcnRIZWlnaHQgPT09IHVuZGVmaW5lZCkgc3RhcnRIZWlnaHQgPSBNYXRoLm1heChhd2FpdCB0aGlzLmdldEhlaWdodCgpLCBhd2FpdCB0aGlzLmdldFJlc3RvcmVIZWlnaHQoKSk7XG4gICAgXG4gICAgLy8gcmVnaXN0ZXIgbGlzdGVuZXIgaWYgZ2l2ZW5cbiAgICBpZiAobGlzdGVuZXIpIGF3YWl0IHRoaXMuYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIFxuICAgIC8vIHN5bmMgd2FsbGV0XG4gICAgbGV0IGVycjtcbiAgICBsZXQgcmVzdWx0O1xuICAgIHRyeSB7XG4gICAgICBsZXQgdGhhdCA9IHRoaXM7XG4gICAgICByZXN1bHQgPSBhd2FpdCAoYWxsb3dDb25jdXJyZW50Q2FsbHMgPyBzeW5jV2FzbSgpIDogdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHN5bmNXYXNtKCkpKTtcbiAgICAgIGZ1bmN0aW9uIHN5bmNXYXNtKCkge1xuICAgICAgICB0aGF0LmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgICAvLyBzeW5jIHdhbGxldCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgICAgdGhhdC5tb2R1bGUuc3luYyh0aGF0LmNwcEFkZHJlc3MsIHN0YXJ0SGVpZ2h0LCBhc3luYyAocmVzcCkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc3AuY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcCkpO1xuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGxldCByZXNwSnNvbiA9IEpTT04ucGFyc2UocmVzcCk7XG4gICAgICAgICAgICAgIHJlc29sdmUobmV3IE1vbmVyb1N5bmNSZXN1bHQocmVzcEpzb24ubnVtQmxvY2tzRmV0Y2hlZCwgcmVzcEpzb24ucmVjZWl2ZWRNb25leSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBlcnIgPSBlO1xuICAgIH1cbiAgICBcbiAgICAvLyB1bnJlZ2lzdGVyIGxpc3RlbmVyXG4gICAgaWYgKGxpc3RlbmVyKSBhd2FpdCB0aGlzLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBcbiAgICAvLyB0aHJvdyBlcnJvciBvciByZXR1cm5cbiAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBcbiAgYXN5bmMgc3RhcnRTeW5jaW5nKHN5bmNQZXJpb2RJbk1zPzogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zdGFydFN5bmNpbmcoc3luY1BlcmlvZEluTXMpO1xuICAgIGlmICghYXdhaXQgdGhpcy5pc0Nvbm5lY3RlZFRvRGFlbW9uKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBpcyBub3QgY29ubmVjdGVkIHRvIGRhZW1vblwiKTtcbiAgICB0aGlzLnN5bmNQZXJpb2RJbk1zID0gc3luY1BlcmlvZEluTXMgPT09IHVuZGVmaW5lZCA/IE1vbmVyb1dhbGxldEZ1bGwuREVGQVVMVF9TWU5DX1BFUklPRF9JTl9NUyA6IHN5bmNQZXJpb2RJbk1zO1xuICAgIGlmICghdGhpcy5zeW5jTG9vcGVyKSB0aGlzLnN5bmNMb29wZXIgPSBuZXcgVGFza0xvb3Blcihhc3luYyAoKSA9PiBhd2FpdCB0aGlzLmJhY2tncm91bmRTeW5jKCkpXG4gICAgdGhpcy5zeW5jTG9vcGVyLnN0YXJ0KHRoaXMuc3luY1BlcmlvZEluTXMpO1xuICB9XG4gICAgXG4gIGFzeW5jIHN0b3BTeW5jaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3RvcFN5bmNpbmcoKTtcbiAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgIGlmICh0aGlzLnN5bmNMb29wZXIpIHRoaXMuc3luY0xvb3Blci5zdG9wKCk7XG4gICAgdGhpcy5tb2R1bGUuc3RvcF9zeW5jaW5nKHRoaXMuY3BwQWRkcmVzcyk7IC8vIHRhc2sgaXMgbm90IHF1ZXVlZCBzbyB3YWxsZXQgc3RvcHMgaW1tZWRpYXRlbHlcbiAgfVxuICBcbiAgYXN5bmMgc2NhblR4cyh0eEhhc2hlczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNjYW5UeHModHhIYXNoZXMpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnNjYW5fdHhzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe3R4SGFzaGVzOiB0eEhhc2hlc30pLCAoZXJyKSA9PiB7XG4gICAgICAgICAgaWYgKGVycikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihlcnIpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzY2FuU3BlbnQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5yZXNjYW5TcGVudCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnJlc2Nhbl9zcGVudCh0aGlzLmNwcEFkZHJlc3MsICgpID0+IHJlc29sdmUoKSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgcmVzY2FuQmxvY2tjaGFpbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnJlc2NhbkJsb2NrY2hhaW4oKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5yZXNjYW5fYmxvY2tjaGFpbih0aGlzLmNwcEFkZHJlc3MsICgpID0+IHJlc29sdmUoKSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QmFsYW5jZShhY2NvdW50SWR4PzogbnVtYmVyLCBzdWJhZGRyZXNzSWR4PzogbnVtYmVyKTogUHJvbWlzZTxiaWdpbnQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEJhbGFuY2UoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgXG4gICAgICAvLyBnZXQgYmFsYW5jZSBlbmNvZGVkIGluIGpzb24gc3RyaW5nXG4gICAgICBsZXQgYmFsYW5jZVN0cjtcbiAgICAgIGlmIChhY2NvdW50SWR4ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYXNzZXJ0KHN1YmFkZHJlc3NJZHggPT09IHVuZGVmaW5lZCwgXCJTdWJhZGRyZXNzIGluZGV4IG11c3QgYmUgdW5kZWZpbmVkIGlmIGFjY291bnQgaW5kZXggaXMgdW5kZWZpbmVkXCIpO1xuICAgICAgICBiYWxhbmNlU3RyID0gdGhpcy5tb2R1bGUuZ2V0X2JhbGFuY2Vfd2FsbGV0KHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgICB9IGVsc2UgaWYgKHN1YmFkZHJlc3NJZHggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBiYWxhbmNlU3RyID0gdGhpcy5tb2R1bGUuZ2V0X2JhbGFuY2VfYWNjb3VudCh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYmFsYW5jZVN0ciA9IHRoaXMubW9kdWxlLmdldF9iYWxhbmNlX3N1YmFkZHJlc3ModGhpcy5jcHBBZGRyZXNzLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gcGFyc2UganNvbiBzdHJpbmcgdG8gYmlnaW50XG4gICAgICByZXR1cm4gQmlnSW50KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhiYWxhbmNlU3RyKSkuYmFsYW5jZSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFVubG9ja2VkQmFsYW5jZShhY2NvdW50SWR4PzogbnVtYmVyLCBzdWJhZGRyZXNzSWR4PzogbnVtYmVyKTogUHJvbWlzZTxiaWdpbnQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFVubG9ja2VkQmFsYW5jZShhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBcbiAgICAgIC8vIGdldCBiYWxhbmNlIGVuY29kZWQgaW4ganNvbiBzdHJpbmdcbiAgICAgIGxldCB1bmxvY2tlZEJhbGFuY2VTdHI7XG4gICAgICBpZiAoYWNjb3VudElkeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGFzc2VydChzdWJhZGRyZXNzSWR4ID09PSB1bmRlZmluZWQsIFwiU3ViYWRkcmVzcyBpbmRleCBtdXN0IGJlIHVuZGVmaW5lZCBpZiBhY2NvdW50IGluZGV4IGlzIHVuZGVmaW5lZFwiKTtcbiAgICAgICAgdW5sb2NrZWRCYWxhbmNlU3RyID0gdGhpcy5tb2R1bGUuZ2V0X3VubG9ja2VkX2JhbGFuY2Vfd2FsbGV0KHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgICB9IGVsc2UgaWYgKHN1YmFkZHJlc3NJZHggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICB1bmxvY2tlZEJhbGFuY2VTdHIgPSB0aGlzLm1vZHVsZS5nZXRfdW5sb2NrZWRfYmFsYW5jZV9hY2NvdW50KHRoaXMuY3BwQWRkcmVzcywgYWNjb3VudElkeCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1bmxvY2tlZEJhbGFuY2VTdHIgPSB0aGlzLm1vZHVsZS5nZXRfdW5sb2NrZWRfYmFsYW5jZV9zdWJhZGRyZXNzKHRoaXMuY3BwQWRkcmVzcywgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIHBhcnNlIGpzb24gc3RyaW5nIHRvIGJpZ2ludFxuICAgICAgcmV0dXJuIEJpZ0ludChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHModW5sb2NrZWRCYWxhbmNlU3RyKSkudW5sb2NrZWRCYWxhbmNlKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudHMoaW5jbHVkZVN1YmFkZHJlc3Nlcz86IGJvb2xlYW4sIHRhZz86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQWNjb3VudFtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRBY2NvdW50cyhpbmNsdWRlU3ViYWRkcmVzc2VzLCB0YWcpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCBhY2NvdW50c1N0ciA9IHRoaXMubW9kdWxlLmdldF9hY2NvdW50cyh0aGlzLmNwcEFkZHJlc3MsIGluY2x1ZGVTdWJhZGRyZXNzZXMgPyB0cnVlIDogZmFsc2UsIHRhZyA/IHRhZyA6IFwiXCIpO1xuICAgICAgbGV0IGFjY291bnRzID0gW107XG4gICAgICBmb3IgKGxldCBhY2NvdW50SnNvbiBvZiBKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMoYWNjb3VudHNTdHIpKS5hY2NvdW50cykge1xuICAgICAgICBhY2NvdW50cy5wdXNoKE1vbmVyb1dhbGxldEZ1bGwuc2FuaXRpemVBY2NvdW50KG5ldyBNb25lcm9BY2NvdW50KGFjY291bnRKc29uKSkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFjY291bnRzO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRBY2NvdW50KGFjY291bnRJZHg6IG51bWJlciwgaW5jbHVkZVN1YmFkZHJlc3Nlcz86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb0FjY291bnQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEFjY291bnQoYWNjb3VudElkeCwgaW5jbHVkZVN1YmFkZHJlc3Nlcyk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IGFjY291bnRTdHIgPSB0aGlzLm1vZHVsZS5nZXRfYWNjb3VudCh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgsIGluY2x1ZGVTdWJhZGRyZXNzZXMgPyB0cnVlIDogZmFsc2UpO1xuICAgICAgbGV0IGFjY291bnRKc29uID0gSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKGFjY291bnRTdHIpKTtcbiAgICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplQWNjb3VudChuZXcgTW9uZXJvQWNjb3VudChhY2NvdW50SnNvbikpO1xuICAgIH0pO1xuXG4gIH1cbiAgXG4gIGFzeW5jIGNyZWF0ZUFjY291bnQobGFiZWw/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0FjY291bnQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmNyZWF0ZUFjY291bnQobGFiZWwpO1xuICAgIGlmIChsYWJlbCA9PT0gdW5kZWZpbmVkKSBsYWJlbCA9IFwiXCI7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IGFjY291bnRTdHIgPSB0aGlzLm1vZHVsZS5jcmVhdGVfYWNjb3VudCh0aGlzLmNwcEFkZHJlc3MsIGxhYmVsKTtcbiAgICAgIGxldCBhY2NvdW50SnNvbiA9IEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhhY2NvdW50U3RyKSk7XG4gICAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZUFjY291bnQobmV3IE1vbmVyb0FjY291bnQoYWNjb3VudEpzb24pKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0luZGljZXM/OiBudW1iZXJbXSk6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzc1tdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgc3ViYWRkcmVzc0luZGljZXMpO1xuICAgIGxldCBhcmdzID0ge2FjY291bnRJZHg6IGFjY291bnRJZHgsIHN1YmFkZHJlc3NJbmRpY2VzOiBzdWJhZGRyZXNzSW5kaWNlcyA9PT0gdW5kZWZpbmVkID8gW10gOiBHZW5VdGlscy5saXN0aWZ5KHN1YmFkZHJlc3NJbmRpY2VzKX07XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IHN1YmFkZHJlc3Nlc0pzb24gPSBKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHModGhpcy5tb2R1bGUuZ2V0X3N1YmFkZHJlc3Nlcyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KGFyZ3MpKSkpLnN1YmFkZHJlc3NlcztcbiAgICAgIGxldCBzdWJhZGRyZXNzZXMgPSBbXTtcbiAgICAgIGZvciAobGV0IHN1YmFkZHJlc3NKc29uIG9mIHN1YmFkZHJlc3Nlc0pzb24pIHN1YmFkZHJlc3Nlcy5wdXNoKE1vbmVyb1dhbGxldEtleXMuc2FuaXRpemVTdWJhZGRyZXNzKG5ldyBNb25lcm9TdWJhZGRyZXNzKHN1YmFkZHJlc3NKc29uKSkpO1xuICAgICAgcmV0dXJuIHN1YmFkZHJlc3NlcztcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgY3JlYXRlU3ViYWRkcmVzcyhhY2NvdW50SWR4OiBudW1iZXIsIGxhYmVsPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jcmVhdGVTdWJhZGRyZXNzKGFjY291bnRJZHgsIGxhYmVsKTtcbiAgICBpZiAobGFiZWwgPT09IHVuZGVmaW5lZCkgbGFiZWwgPSBcIlwiO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCBzdWJhZGRyZXNzU3RyID0gdGhpcy5tb2R1bGUuY3JlYXRlX3N1YmFkZHJlc3ModGhpcy5jcHBBZGRyZXNzLCBhY2NvdW50SWR4LCBsYWJlbCk7XG4gICAgICBsZXQgc3ViYWRkcmVzc0pzb24gPSBKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMoc3ViYWRkcmVzc1N0cikpO1xuICAgICAgcmV0dXJuIE1vbmVyb1dhbGxldEtleXMuc2FuaXRpemVTdWJhZGRyZXNzKG5ldyBNb25lcm9TdWJhZGRyZXNzKHN1YmFkZHJlc3NKc29uKSk7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBzZXRTdWJhZGRyZXNzTGFiZWwoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIsIGxhYmVsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnNldFN1YmFkZHJlc3NMYWJlbChhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4LCBsYWJlbCk7XG4gICAgaWYgKGxhYmVsID09PSB1bmRlZmluZWQpIGxhYmVsID0gXCJcIjtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0aGlzLm1vZHVsZS5zZXRfc3ViYWRkcmVzc19sYWJlbCh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgsIGxhYmVsKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhzKHF1ZXJ5Pzogc3RyaW5nW10gfCBQYXJ0aWFsPE1vbmVyb1R4UXVlcnk+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRUeHMocXVlcnkpO1xuXG4gICAgLy8gY29weSBhbmQgbm9ybWFsaXplIHF1ZXJ5IHVwIHRvIGJsb2NrXG4gICAgY29uc3QgcXVlcnlOb3JtYWxpemVkID0gcXVlcnkgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplVHhRdWVyeShxdWVyeSk7XG4gICAgXG4gICAgLy8gc2NoZWR1bGUgdGFza1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyBjYWxsIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFja1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfdHhzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkocXVlcnlOb3JtYWxpemVkLmdldEJsb2NrKCkudG9Kc29uKCkpLCAoYmxvY2tzSnNvblN0cikgPT4ge1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIGNoZWNrIGZvciBlcnJvclxuICAgICAgICAgIGlmIChibG9ja3NKc29uU3RyLmNoYXJBdCgwKSAhPT0gJ3snKSB7XG4gICAgICAgICAgICByZWplY3QobmV3IE1vbmVyb0Vycm9yKGJsb2Nrc0pzb25TdHIpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gcmVzb2x2ZSB3aXRoIGRlc2VyaWFsaXplZCB0eHNcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzb2x2ZShNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplVHhzKHF1ZXJ5Tm9ybWFsaXplZCwgYmxvY2tzSnNvblN0cikpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRUcmFuc2ZlcnMocXVlcnk/OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KTogUHJvbWlzZTxNb25lcm9UcmFuc2ZlcltdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRUcmFuc2ZlcnMocXVlcnkpO1xuICAgIFxuICAgIC8vIGNvcHkgYW5kIG5vcm1hbGl6ZSBxdWVyeSB1cCB0byBibG9ja1xuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVUcmFuc2ZlclF1ZXJ5KHF1ZXJ5KTtcbiAgICBcbiAgICAvLyByZXR1cm4gcHJvbWlzZSB3aGljaCByZXNvbHZlcyBvbiBjYWxsYmFja1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyBjYWxsIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFja1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfdHJhbnNmZXJzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkocXVlcnlOb3JtYWxpemVkLmdldFR4UXVlcnkoKS5nZXRCbG9jaygpLnRvSnNvbigpKSwgKGJsb2Nrc0pzb25TdHIpID0+IHtcbiAgICAgICAgICAgIFxuICAgICAgICAgIC8vIGNoZWNrIGZvciBlcnJvclxuICAgICAgICAgIGlmIChibG9ja3NKc29uU3RyLmNoYXJBdCgwKSAhPT0gJ3snKSB7XG4gICAgICAgICAgICByZWplY3QobmV3IE1vbmVyb0Vycm9yKGJsb2Nrc0pzb25TdHIpKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgIFxuICAgICAgICAgIC8vIHJlc29sdmUgd2l0aCBkZXNlcmlhbGl6ZWQgdHJhbnNmZXJzIFxuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXNvbHZlKE1vbmVyb1dhbGxldEZ1bGwuZGVzZXJpYWxpemVUcmFuc2ZlcnMocXVlcnlOb3JtYWxpemVkLCBibG9ja3NKc29uU3RyKSk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE91dHB1dHMocXVlcnk/OiBQYXJ0aWFsPE1vbmVyb091dHB1dFF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvT3V0cHV0V2FsbGV0W10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldE91dHB1dHMocXVlcnkpO1xuICAgIFxuICAgIC8vIGNvcHkgYW5kIG5vcm1hbGl6ZSBxdWVyeSB1cCB0byBibG9ja1xuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZCA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVPdXRwdXRRdWVyeShxdWVyeSk7XG4gICAgXG4gICAgLy8gcmV0dXJuIHByb21pc2Ugd2hpY2ggcmVzb2x2ZXMgb24gY2FsbGJhY2tcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT57XG4gICAgICAgIFxuICAgICAgICAvLyBjYWxsIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFja1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfb3V0cHV0cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHF1ZXJ5Tm9ybWFsaXplZC5nZXRUeFF1ZXJ5KCkuZ2V0QmxvY2soKS50b0pzb24oKSksIChibG9ja3NKc29uU3RyKSA9PiB7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gY2hlY2sgZm9yIGVycm9yXG4gICAgICAgICAgaWYgKGJsb2Nrc0pzb25TdHIuY2hhckF0KDApICE9PSAneycpIHtcbiAgICAgICAgICAgIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoYmxvY2tzSnNvblN0cikpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICAvLyByZXNvbHZlIHdpdGggZGVzZXJpYWxpemVkIG91dHB1dHNcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzb2x2ZShNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplT3V0cHV0cyhxdWVyeU5vcm1hbGl6ZWQsIGJsb2Nrc0pzb25TdHIpKTtcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0T3V0cHV0cyhhbGwgPSBmYWxzZSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5leHBvcnRPdXRwdXRzKGFsbCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZXhwb3J0X291dHB1dHModGhpcy5jcHBBZGRyZXNzLCBhbGwsIChvdXRwdXRzSGV4KSA9PiByZXNvbHZlKG91dHB1dHNIZXgpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRPdXRwdXRzKG91dHB1dHNIZXg6IHN0cmluZyk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pbXBvcnRPdXRwdXRzKG91dHB1dHNIZXgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmltcG9ydF9vdXRwdXRzKHRoaXMuY3BwQWRkcmVzcywgb3V0cHV0c0hleCwgKG51bUltcG9ydGVkKSA9PiByZXNvbHZlKG51bUltcG9ydGVkKSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0S2V5SW1hZ2VzKGFsbCA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5leHBvcnRLZXlJbWFnZXMoYWxsKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5leHBvcnRfa2V5X2ltYWdlcyh0aGlzLmNwcEFkZHJlc3MsIGFsbCwgKGtleUltYWdlc1N0cikgPT4ge1xuICAgICAgICAgIGlmIChrZXlJbWFnZXNTdHIuY2hhckF0KDApICE9PSAneycpcmVqZWN0KG5ldyBNb25lcm9FcnJvcihrZXlJbWFnZXNTdHIpKTsgLy8ganNvbiBleHBlY3RlZCwgZWxzZSBlcnJvclxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbGV0IGtleUltYWdlcyA9IFtdO1xuICAgICAgICAgICAgZm9yIChsZXQga2V5SW1hZ2VKc29uIG9mIEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyhrZXlJbWFnZXNTdHIpKS5rZXlJbWFnZXMpIGtleUltYWdlcy5wdXNoKG5ldyBNb25lcm9LZXlJbWFnZShrZXlJbWFnZUpzb24pKTtcbiAgICAgICAgICAgIHJlc29sdmUoa2V5SW1hZ2VzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGltcG9ydEtleUltYWdlcyhrZXlJbWFnZXM6IE1vbmVyb0tleUltYWdlW10pOiBQcm9taXNlPE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pbXBvcnRLZXlJbWFnZXMoa2V5SW1hZ2VzKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5pbXBvcnRfa2V5X2ltYWdlcyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHtrZXlJbWFnZXM6IGtleUltYWdlcy5tYXAoa2V5SW1hZ2UgPT4ga2V5SW1hZ2UudG9Kc29uKCkpfSksIChrZXlJbWFnZUltcG9ydFJlc3VsdFN0cikgPT4ge1xuICAgICAgICAgIGlmIChrZXlJbWFnZUltcG9ydFJlc3VsdFN0ci5jaGFyQXQoMCkgIT09ICd7JykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihrZXlJbWFnZUltcG9ydFJlc3VsdFN0cikpOyAvLyBqc29uIGV4cGVjdGVkLCBlbHNlIGVycm9yXG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMoa2V5SW1hZ2VJbXBvcnRSZXN1bHRTdHIpKSkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCgpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlW10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0KCk7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBmcmVlemVPdXRwdXQoa2V5SW1hZ2U6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZnJlZXplT3V0cHV0KGtleUltYWdlKTtcbiAgICBpZiAoIWtleUltYWdlKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHNwZWNpZnkga2V5IGltYWdlIHRvIGZyZWV6ZVwiKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5mcmVlemVfb3V0cHV0KHRoaXMuY3BwQWRkcmVzcywga2V5SW1hZ2UsICgpID0+IHJlc29sdmUoKSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgdGhhd091dHB1dChrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS50aGF3T3V0cHV0KGtleUltYWdlKTtcbiAgICBpZiAoIWtleUltYWdlKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHNwZWNpZnkga2V5IGltYWdlIHRvIHRoYXdcIik7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUudGhhd19vdXRwdXQodGhpcy5jcHBBZGRyZXNzLCBrZXlJbWFnZSwgKCkgPT4gcmVzb2x2ZSgpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBpc091dHB1dEZyb3plbihrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pc091dHB1dEZyb3plbihrZXlJbWFnZSk7XG4gICAgaWYgKCFrZXlJbWFnZSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBzcGVjaWZ5IGtleSBpbWFnZSB0byBjaGVjayBpZiBmcm96ZW5cIik7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuaXNfb3V0cHV0X2Zyb3plbih0aGlzLmNwcEFkZHJlc3MsIGtleUltYWdlLCAocmVzdWx0KSA9PiByZXNvbHZlKHJlc3VsdCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBnZXREZWZhdWx0RmVlUHJpb3JpdHkoKTogUHJvbWlzZTxNb25lcm9UeFByaW9yaXR5PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXREZWZhdWx0RmVlUHJpb3JpdHkoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfZGVmYXVsdF9mZWVfcHJpb3JpdHkodGhpcy5jcHBBZGRyZXNzLCAocmVzdWx0KSA9PiByZXNvbHZlKHJlc3VsdCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNyZWF0ZVR4cyhjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jcmVhdGVUeHMoY29uZmlnKTtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSwgY29weSwgYW5kIG5vcm1hbGl6ZSBjb25maWdcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyhjb25maWcpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkgPT09IHVuZGVmaW5lZCkgY29uZmlnTm9ybWFsaXplZC5zZXRDYW5TcGxpdCh0cnVlKTtcbiAgICBcbiAgICAvLyBjcmVhdGUgdHhzIGluIHF1ZXVlXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIGNyZWF0ZSB0eHMgaW4gd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICB0aGlzLm1vZHVsZS5jcmVhdGVfdHhzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoY29uZmlnTm9ybWFsaXplZC50b0pzb24oKSksICh0eFNldEpzb25TdHIpID0+IHtcbiAgICAgICAgICBpZiAodHhTZXRKc29uU3RyLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHR4U2V0SnNvblN0cikpOyAvLyBqc29uIGV4cGVjdGVkLCBlbHNlIGVycm9yXG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9UeFNldChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHModHhTZXRKc29uU3RyKSkpLmdldFR4cygpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBPdXRwdXQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN3ZWVwT3V0cHV0KGNvbmZpZyk7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIGFuZCB2YWxpZGF0ZSBjb25maWdcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVN3ZWVwT3V0cHV0Q29uZmlnKGNvbmZpZyk7XG4gICAgXG4gICAgLy8gc3dlZXAgb3V0cHV0IGluIHF1ZXVlXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIHN3ZWVwIG91dHB1dCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIHRoaXMubW9kdWxlLnN3ZWVwX291dHB1dCh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KGNvbmZpZ05vcm1hbGl6ZWQudG9Kc29uKCkpLCAodHhTZXRKc29uU3RyKSA9PiB7XG4gICAgICAgICAgaWYgKHR4U2V0SnNvblN0ci5jaGFyQXQoMCkgIT09ICd7JykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcih0eFNldEpzb25TdHIpKTsgLy8ganNvbiBleHBlY3RlZCwgZWxzZSBlcnJvclxuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvVHhTZXQoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHR4U2V0SnNvblN0cikpKS5nZXRUeHMoKVswXSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBzd2VlcFVubG9ja2VkKGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnN3ZWVwVW5sb2NrZWQoY29uZmlnKTtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSBhbmQgbm9ybWFsaXplIGNvbmZpZ1xuICAgIGNvbnN0IGNvbmZpZ05vcm1hbGl6ZWQgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplU3dlZXBVbmxvY2tlZENvbmZpZyhjb25maWcpO1xuICAgIFxuICAgIC8vIHN3ZWVwIHVubG9ja2VkIGluIHF1ZXVlXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIHN3ZWVwIHVubG9ja2VkIGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgdGhpcy5tb2R1bGUuc3dlZXBfdW5sb2NrZWQodGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeShjb25maWdOb3JtYWxpemVkLnRvSnNvbigpKSwgKHR4U2V0c0pzb24pID0+IHtcbiAgICAgICAgICBpZiAodHhTZXRzSnNvbi5jaGFyQXQoMCkgIT09ICd7JykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcih0eFNldHNKc29uKSk7IC8vIGpzb24gZXhwZWN0ZWQsIGVsc2UgZXJyb3JcbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGxldCB0eFNldHMgPSBbXTtcbiAgICAgICAgICAgIGZvciAobGV0IHR4U2V0SnNvbiBvZiBKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHModHhTZXRzSnNvbikpLnR4U2V0cykgdHhTZXRzLnB1c2gobmV3IE1vbmVyb1R4U2V0KHR4U2V0SnNvbikpO1xuICAgICAgICAgICAgbGV0IHR4cyA9IFtdO1xuICAgICAgICAgICAgZm9yIChsZXQgdHhTZXQgb2YgdHhTZXRzKSBmb3IgKGxldCB0eCBvZiB0eFNldC5nZXRUeHMoKSkgdHhzLnB1c2godHgpO1xuICAgICAgICAgICAgcmVzb2x2ZSh0eHMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc3dlZXBEdXN0KHJlbGF5PzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3dlZXBEdXN0KHJlbGF5KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBcbiAgICAgICAgLy8gY2FsbCB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIHRoaXMubW9kdWxlLnN3ZWVwX2R1c3QodGhpcy5jcHBBZGRyZXNzLCByZWxheSwgKHR4U2V0SnNvblN0cikgPT4ge1xuICAgICAgICAgIGlmICh0eFNldEpzb25TdHIuY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IodHhTZXRKc29uU3RyKSk7IC8vIGpzb24gZXhwZWN0ZWQsIGVsc2UgZXJyb3JcbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGxldCB0eFNldCA9IG5ldyBNb25lcm9UeFNldChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHModHhTZXRKc29uU3RyKSkpO1xuICAgICAgICAgICAgaWYgKHR4U2V0LmdldFR4cygpID09PSB1bmRlZmluZWQpIHR4U2V0LnNldFR4cyhbXSk7XG4gICAgICAgICAgICByZXNvbHZlKHR4U2V0LmdldFR4cygpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHJlbGF5VHhzKHR4c09yTWV0YWRhdGFzOiAoTW9uZXJvVHhXYWxsZXQgfCBzdHJpbmcpW10pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5yZWxheVR4cyh0eHNPck1ldGFkYXRhcyk7XG4gICAgYXNzZXJ0KEFycmF5LmlzQXJyYXkodHhzT3JNZXRhZGF0YXMpLCBcIk11c3QgcHJvdmlkZSBhbiBhcnJheSBvZiB0eHMgb3IgdGhlaXIgbWV0YWRhdGEgdG8gcmVsYXlcIik7XG4gICAgbGV0IHR4TWV0YWRhdGFzID0gW107XG4gICAgZm9yIChsZXQgdHhPck1ldGFkYXRhIG9mIHR4c09yTWV0YWRhdGFzKSB0eE1ldGFkYXRhcy5wdXNoKHR4T3JNZXRhZGF0YSBpbnN0YW5jZW9mIE1vbmVyb1R4V2FsbGV0ID8gdHhPck1ldGFkYXRhLmdldE1ldGFkYXRhKCkgOiB0eE9yTWV0YWRhdGEpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnJlbGF5X3R4cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHt0eE1ldGFkYXRhczogdHhNZXRhZGF0YXN9KSwgKHR4SGFzaGVzSnNvbikgPT4ge1xuICAgICAgICAgIGlmICh0eEhhc2hlc0pzb24uY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IodHhIYXNoZXNKc29uKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKEpTT04ucGFyc2UodHhIYXNoZXNKc29uKS50eEhhc2hlcyk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGRlc2NyaWJlVHhTZXQodHhTZXQ6IE1vbmVyb1R4U2V0KTogUHJvbWlzZTxNb25lcm9UeFNldD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZGVzY3JpYmVUeFNldCh0eFNldCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdHhTZXQgPSBuZXcgTW9uZXJvVHhTZXQoe3Vuc2lnbmVkVHhIZXg6IHR4U2V0LmdldFVuc2lnbmVkVHhIZXgoKSwgc2lnbmVkVHhIZXg6IHR4U2V0LmdldFNpZ25lZFR4SGV4KCksIG11bHRpc2lnVHhIZXg6IHR4U2V0LmdldE11bHRpc2lnVHhIZXgoKX0pO1xuICAgICAgdHJ5IHsgcmV0dXJuIG5ldyBNb25lcm9UeFNldChKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHModGhpcy5tb2R1bGUuZGVzY3JpYmVfdHhfc2V0KHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkodHhTZXQudG9Kc29uKCkpKSkpKTsgfVxuICAgICAgY2F0Y2ggKGVycikgeyB0aHJvdyBuZXcgTW9uZXJvRXJyb3IodGhpcy5tb2R1bGUuZ2V0X2V4Y2VwdGlvbl9tZXNzYWdlKGVycikpOyB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNpZ25UeHModW5zaWduZWRUeEhleDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeFNldD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2lnblR4cyh1bnNpZ25lZFR4SGV4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkgeyByZXR1cm4gbmV3IE1vbmVyb1R4U2V0KEpTT04ucGFyc2UoR2VuVXRpbHMuc3RyaW5naWZ5QmlnSW50cyh0aGlzLm1vZHVsZS5zaWduX3R4cyh0aGlzLmNwcEFkZHJlc3MsIHVuc2lnbmVkVHhIZXgpKSkpOyB9XG4gICAgICBjYXRjaCAoZXJyKSB7IHRocm93IG5ldyBNb25lcm9FcnJvcih0aGlzLm1vZHVsZS5nZXRfZXhjZXB0aW9uX21lc3NhZ2UoZXJyKSk7IH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc3VibWl0VHhzKHNpZ25lZFR4SGV4OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zdWJtaXRUeHMoc2lnbmVkVHhIZXgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnN1Ym1pdF90eHModGhpcy5jcHBBZGRyZXNzLCBzaWduZWRUeEhleCwgKHJlc3ApID0+IHtcbiAgICAgICAgICBpZiAocmVzcC5jaGFyQXQoMCkgIT09ICd7JykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihyZXNwKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKEpTT04ucGFyc2UocmVzcCkudHhIYXNoZXMpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzaWduTWVzc2FnZShtZXNzYWdlOiBzdHJpbmcsIHNpZ25hdHVyZVR5cGUgPSBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfU1BFTkRfS0VZLCBhY2NvdW50SWR4ID0gMCwgc3ViYWRkcmVzc0lkeCA9IDApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2lnbk1lc3NhZ2UobWVzc2FnZSwgc2lnbmF0dXJlVHlwZSwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG4gICAgXG4gICAgLy8gYXNzaWduIGRlZmF1bHRzXG4gICAgc2lnbmF0dXJlVHlwZSA9IHNpZ25hdHVyZVR5cGUgfHwgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWTtcbiAgICBhY2NvdW50SWR4ID0gYWNjb3VudElkeCB8fCAwO1xuICAgIHN1YmFkZHJlc3NJZHggPSBzdWJhZGRyZXNzSWR4IHx8IDA7XG4gICAgXG4gICAgLy8gcXVldWUgdGFzayB0byBzaWduIG1lc3NhZ2VcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkgeyByZXR1cm4gdGhpcy5tb2R1bGUuc2lnbl9tZXNzYWdlKHRoaXMuY3BwQWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlVHlwZSA9PT0gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSA/IDAgOiAxLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTsgfVxuICAgICAgY2F0Y2ggKGVycikgeyB0aHJvdyBuZXcgTW9uZXJvRXJyb3IodGhpcy5tb2R1bGUuZ2V0X2V4Y2VwdGlvbl9tZXNzYWdlKGVycikpOyB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHZlcmlmeU1lc3NhZ2UobWVzc2FnZTogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS52ZXJpZnlNZXNzYWdlKG1lc3NhZ2UsIGFkZHJlc3MsIHNpZ25hdHVyZSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IHJlc3VsdDtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJlc3VsdCA9IEpTT04ucGFyc2UodGhpcy5tb2R1bGUudmVyaWZ5X21lc3NhZ2UodGhpcy5jcHBBZGRyZXNzLCBtZXNzYWdlLCBhZGRyZXNzLCBzaWduYXR1cmUpKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICByZXN1bHQgPSB7aXNHb29kOiBmYWxzZX07XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQocmVzdWx0LmlzR29vZCA/XG4gICAgICAgIHtpc0dvb2Q6IHJlc3VsdC5pc0dvb2QsIGlzT2xkOiByZXN1bHQuaXNPbGQsIHNpZ25hdHVyZVR5cGU6IHJlc3VsdC5zaWduYXR1cmVUeXBlID09PSBcInNwZW5kXCIgPyBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfU1BFTkRfS0VZIDogTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1ZJRVdfS0VZLCB2ZXJzaW9uOiByZXN1bHQudmVyc2lvbn0gOlxuICAgICAgICB7aXNHb29kOiBmYWxzZX1cbiAgICAgICk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4S2V5KHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFR4S2V5KHR4SGFzaCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdHJ5IHsgcmV0dXJuIHRoaXMubW9kdWxlLmdldF90eF9rZXkodGhpcy5jcHBBZGRyZXNzLCB0eEhhc2gpOyB9XG4gICAgICBjYXRjaCAoZXJyKSB7IHRocm93IG5ldyBNb25lcm9FcnJvcih0aGlzLm1vZHVsZS5nZXRfZXhjZXB0aW9uX21lc3NhZ2UoZXJyKSk7IH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tUeEtleSh0eEhhc2g6IHN0cmluZywgdHhLZXk6IHN0cmluZywgYWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1R4PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jaGVja1R4S2V5KHR4SGFzaCwgdHhLZXksIGFkZHJlc3MpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTsgXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5jaGVja190eF9rZXkodGhpcy5jcHBBZGRyZXNzLCB0eEhhc2gsIHR4S2V5LCBhZGRyZXNzLCAocmVzcEpzb25TdHIpID0+IHtcbiAgICAgICAgICBpZiAocmVzcEpzb25TdHIuY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcEpzb25TdHIpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb0NoZWNrVHgoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHJlc3BKc29uU3RyKSkpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhQcm9vZih0eEhhc2g6IHN0cmluZywgYWRkcmVzczogc3RyaW5nLCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFR4UHJvb2YodHhIYXNoLCBhZGRyZXNzLCBtZXNzYWdlKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfdHhfcHJvb2YodGhpcy5jcHBBZGRyZXNzLCB0eEhhc2ggfHwgXCJcIiwgYWRkcmVzcyB8fCBcIlwiLCBtZXNzYWdlIHx8IFwiXCIsIChzaWduYXR1cmUpID0+IHtcbiAgICAgICAgICBsZXQgZXJyb3JLZXkgPSBcImVycm9yOiBcIjtcbiAgICAgICAgICBpZiAoc2lnbmF0dXJlLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHNpZ25hdHVyZS5zdWJzdHJpbmcoZXJyb3JLZXkubGVuZ3RoKSkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShzaWduYXR1cmUpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBjaGVja1R4UHJvb2YodHhIYXNoOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tUeD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuY2hlY2tUeFByb29mKHR4SGFzaCwgYWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7IFxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuY2hlY2tfdHhfcHJvb2YodGhpcy5jcHBBZGRyZXNzLCB0eEhhc2ggfHwgXCJcIiwgYWRkcmVzcyB8fCBcIlwiLCBtZXNzYWdlIHx8IFwiXCIsIHNpZ25hdHVyZSB8fCBcIlwiLCAocmVzcEpzb25TdHIpID0+IHtcbiAgICAgICAgICBpZiAocmVzcEpzb25TdHIuY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcEpzb25TdHIpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb0NoZWNrVHgoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHJlc3BKc29uU3RyKSkpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U3BlbmRQcm9vZih0eEhhc2g6IHN0cmluZywgbWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRTcGVuZFByb29mKHR4SGFzaCwgbWVzc2FnZSk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuZ2V0X3NwZW5kX3Byb29mKHRoaXMuY3BwQWRkcmVzcywgdHhIYXNoIHx8IFwiXCIsIG1lc3NhZ2UgfHwgXCJcIiwgKHNpZ25hdHVyZSkgPT4ge1xuICAgICAgICAgIGxldCBlcnJvcktleSA9IFwiZXJyb3I6IFwiO1xuICAgICAgICAgIGlmIChzaWduYXR1cmUuaW5kZXhPZihlcnJvcktleSkgPT09IDApIHJlamVjdChuZXcgTW9uZXJvRXJyb3Ioc2lnbmF0dXJlLnN1YnN0cmluZyhlcnJvcktleS5sZW5ndGgpKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKHNpZ25hdHVyZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrU3BlbmRQcm9vZih0eEhhc2g6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuY2hlY2tTcGVuZFByb29mKHR4SGFzaCwgbWVzc2FnZSwgc2lnbmF0dXJlKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7IFxuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuY2hlY2tfc3BlbmRfcHJvb2YodGhpcy5jcHBBZGRyZXNzLCB0eEhhc2ggfHwgXCJcIiwgbWVzc2FnZSB8fCBcIlwiLCBzaWduYXR1cmUgfHwgXCJcIiwgKHJlc3ApID0+IHtcbiAgICAgICAgICB0eXBlb2YgcmVzcCA9PT0gXCJzdHJpbmdcIiA/IHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcCkpIDogcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UmVzZXJ2ZVByb29mV2FsbGV0KG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0UmVzZXJ2ZVByb29mV2FsbGV0KG1lc3NhZ2UpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLmdldF9yZXNlcnZlX3Byb29mX3dhbGxldCh0aGlzLmNwcEFkZHJlc3MsIG1lc3NhZ2UsIChzaWduYXR1cmUpID0+IHtcbiAgICAgICAgICBsZXQgZXJyb3JLZXkgPSBcImVycm9yOiBcIjtcbiAgICAgICAgICBpZiAoc2lnbmF0dXJlLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHNpZ25hdHVyZS5zdWJzdHJpbmcoZXJyb3JLZXkubGVuZ3RoKSwgLTEpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoc2lnbmF0dXJlKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UmVzZXJ2ZVByb29mQWNjb3VudChhY2NvdW50SWR4OiBudW1iZXIsIGFtb3VudDogYmlnaW50LCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFJlc2VydmVQcm9vZkFjY291bnQoYWNjb3VudElkeCwgYW1vdW50LCBtZXNzYWdlKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5nZXRfcmVzZXJ2ZV9wcm9vZl9hY2NvdW50KHRoaXMuY3BwQWRkcmVzcywgYWNjb3VudElkeCwgYW1vdW50LnRvU3RyaW5nKCksIG1lc3NhZ2UsIChzaWduYXR1cmUpID0+IHtcbiAgICAgICAgICBsZXQgZXJyb3JLZXkgPSBcImVycm9yOiBcIjtcbiAgICAgICAgICBpZiAoc2lnbmF0dXJlLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHNpZ25hdHVyZS5zdWJzdHJpbmcoZXJyb3JLZXkubGVuZ3RoKSwgLTEpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoc2lnbmF0dXJlKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGNoZWNrUmVzZXJ2ZVByb29mKGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tSZXNlcnZlPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jaGVja1Jlc2VydmVQcm9vZihhZGRyZXNzLCBtZXNzYWdlLCBzaWduYXR1cmUpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTsgXG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5jaGVja19yZXNlcnZlX3Byb29mKHRoaXMuY3BwQWRkcmVzcywgYWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlLCAocmVzcEpzb25TdHIpID0+IHtcbiAgICAgICAgICBpZiAocmVzcEpzb25TdHIuY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcEpzb25TdHIsIC0xKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9DaGVja1Jlc2VydmUoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHJlc3BKc29uU3RyKSkpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhOb3Rlcyh0eEhhc2hlczogc3RyaW5nW10pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRUeE5vdGVzKHR4SGFzaGVzKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0cnkgeyByZXR1cm4gSlNPTi5wYXJzZSh0aGlzLm1vZHVsZS5nZXRfdHhfbm90ZXModGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7dHhIYXNoZXM6IHR4SGFzaGVzfSkpKS50eE5vdGVzOyB9XG4gICAgICBjYXRjaCAoZXJyKSB7IHRocm93IG5ldyBNb25lcm9FcnJvcih0aGlzLm1vZHVsZS5nZXRfZXhjZXB0aW9uX21lc3NhZ2UoZXJyKSk7IH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0VHhOb3Rlcyh0eEhhc2hlczogc3RyaW5nW10sIG5vdGVzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2V0VHhOb3Rlcyh0eEhhc2hlcywgbm90ZXMpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7IHRoaXMubW9kdWxlLnNldF90eF9ub3Rlcyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHt0eEhhc2hlczogdHhIYXNoZXMsIHR4Tm90ZXM6IG5vdGVzfSkpOyB9XG4gICAgICBjYXRjaCAoZXJyKSB7IHRocm93IG5ldyBNb25lcm9FcnJvcih0aGlzLm1vZHVsZS5nZXRfZXhjZXB0aW9uX21lc3NhZ2UoZXJyKSk7IH1cbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzKGVudHJ5SW5kaWNlcz86IG51bWJlcltdKTogUHJvbWlzZTxNb25lcm9BZGRyZXNzQm9va0VudHJ5W10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEFkZHJlc3NCb29rRW50cmllcyhlbnRyeUluZGljZXMpO1xuICAgIGlmICghZW50cnlJbmRpY2VzKSBlbnRyeUluZGljZXMgPSBbXTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgZW50cmllcyA9IFtdO1xuICAgICAgZm9yIChsZXQgZW50cnlKc29uIG9mIEpTT04ucGFyc2UodGhpcy5tb2R1bGUuZ2V0X2FkZHJlc3NfYm9va19lbnRyaWVzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe2VudHJ5SW5kaWNlczogZW50cnlJbmRpY2VzfSkpKS5lbnRyaWVzKSB7XG4gICAgICAgIGVudHJpZXMucHVzaChuZXcgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeShlbnRyeUpzb24pKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBlbnRyaWVzO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBhZGRBZGRyZXNzQm9va0VudHJ5KGFkZHJlc3M6IHN0cmluZywgZGVzY3JpcHRpb24/OiBzdHJpbmcpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuYWRkQWRkcmVzc0Jvb2tFbnRyeShhZGRyZXNzLCBkZXNjcmlwdGlvbik7XG4gICAgaWYgKCFhZGRyZXNzKSBhZGRyZXNzID0gXCJcIjtcbiAgICBpZiAoIWRlc2NyaXB0aW9uKSBkZXNjcmlwdGlvbiA9IFwiXCI7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLmFkZF9hZGRyZXNzX2Jvb2tfZW50cnkodGhpcy5jcHBBZGRyZXNzLCBhZGRyZXNzLCBkZXNjcmlwdGlvbik7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGVkaXRBZGRyZXNzQm9va0VudHJ5KGluZGV4OiBudW1iZXIsIHNldEFkZHJlc3M6IGJvb2xlYW4sIGFkZHJlc3M6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2V0RGVzY3JpcHRpb246IGJvb2xlYW4sIGRlc2NyaXB0aW9uOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmVkaXRBZGRyZXNzQm9va0VudHJ5KGluZGV4LCBzZXRBZGRyZXNzLCBhZGRyZXNzLCBzZXREZXNjcmlwdGlvbiwgZGVzY3JpcHRpb24pO1xuICAgIGlmICghc2V0QWRkcmVzcykgc2V0QWRkcmVzcyA9IGZhbHNlO1xuICAgIGlmICghYWRkcmVzcykgYWRkcmVzcyA9IFwiXCI7XG4gICAgaWYgKCFzZXREZXNjcmlwdGlvbikgc2V0RGVzY3JpcHRpb24gPSBmYWxzZTtcbiAgICBpZiAoIWRlc2NyaXB0aW9uKSBkZXNjcmlwdGlvbiA9IFwiXCI7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdGhpcy5tb2R1bGUuZWRpdF9hZGRyZXNzX2Jvb2tfZW50cnkodGhpcy5jcHBBZGRyZXNzLCBpbmRleCwgc2V0QWRkcmVzcywgYWRkcmVzcywgc2V0RGVzY3JpcHRpb24sIGRlc2NyaXB0aW9uKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeShlbnRyeUlkeDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5kZWxldGVBZGRyZXNzQm9va0VudHJ5KGVudHJ5SWR4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0aGlzLm1vZHVsZS5kZWxldGVfYWRkcmVzc19ib29rX2VudHJ5KHRoaXMuY3BwQWRkcmVzcywgZW50cnlJZHgpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyB0YWdBY2NvdW50cyh0YWc6IHN0cmluZywgYWNjb3VudEluZGljZXM6IG51bWJlcltdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS50YWdBY2NvdW50cyh0YWcsIGFjY291bnRJbmRpY2VzKTtcbiAgICBpZiAoIXRhZykgdGFnID0gXCJcIjtcbiAgICBpZiAoIWFjY291bnRJbmRpY2VzKSBhY2NvdW50SW5kaWNlcyA9IFtdO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRoaXMubW9kdWxlLnRhZ19hY2NvdW50cyh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KHt0YWc6IHRhZywgYWNjb3VudEluZGljZXM6IGFjY291bnRJbmRpY2VzfSkpO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgdW50YWdBY2NvdW50cyhhY2NvdW50SW5kaWNlczogbnVtYmVyW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnVudGFnQWNjb3VudHMoYWNjb3VudEluZGljZXMpO1xuICAgIGlmICghYWNjb3VudEluZGljZXMpIGFjY291bnRJbmRpY2VzID0gW107XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdGhpcy5tb2R1bGUudGFnX2FjY291bnRzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe2FjY291bnRJbmRpY2VzOiBhY2NvdW50SW5kaWNlc30pKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudFRhZ3MoKTogUHJvbWlzZTxNb25lcm9BY2NvdW50VGFnW10+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEFjY291bnRUYWdzKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IGFjY291bnRUYWdzID0gW107XG4gICAgICBmb3IgKGxldCBhY2NvdW50VGFnSnNvbiBvZiBKU09OLnBhcnNlKHRoaXMubW9kdWxlLmdldF9hY2NvdW50X3RhZ3ModGhpcy5jcHBBZGRyZXNzKSkuYWNjb3VudFRhZ3MpIGFjY291bnRUYWdzLnB1c2gobmV3IE1vbmVyb0FjY291bnRUYWcoYWNjb3VudFRhZ0pzb24pKTtcbiAgICAgIHJldHVybiBhY2NvdW50VGFncztcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIHNldEFjY291bnRUYWdMYWJlbCh0YWc6IHN0cmluZywgbGFiZWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2V0QWNjb3VudFRhZ0xhYmVsKHRhZywgbGFiZWwpO1xuICAgIGlmICghdGFnKSB0YWcgPSBcIlwiO1xuICAgIGlmICghbGFiZWwpIGxhYmVsID0gXCJcIjtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0aGlzLm1vZHVsZS5zZXRfYWNjb3VudF90YWdfbGFiZWwodGhpcy5jcHBBZGRyZXNzLCB0YWcsIGxhYmVsKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UGF5bWVudFVyaShjb25maWc6IE1vbmVyb1R4Q29uZmlnKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFBheW1lbnRVcmkoY29uZmlnKTtcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnKGNvbmZpZyk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLmdldF9wYXltZW50X3VyaSh0aGlzLmNwcEFkZHJlc3MsIEpTT04uc3RyaW5naWZ5KGNvbmZpZy50b0pzb24oKSkpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBtYWtlIFVSSSBmcm9tIHN1cHBsaWVkIHBhcmFtZXRlcnNcIik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHBhcnNlUGF5bWVudFVyaSh1cmk6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhDb25maWc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnBhcnNlUGF5bWVudFVyaSh1cmkpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBuZXcgTW9uZXJvVHhDb25maWcoSlNPTi5wYXJzZShHZW5VdGlscy5zdHJpbmdpZnlCaWdJbnRzKHRoaXMubW9kdWxlLnBhcnNlX3BheW1lbnRfdXJpKHRoaXMuY3BwQWRkcmVzcywgdXJpKSkpKTtcbiAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihlcnIubWVzc2FnZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEF0dHJpYnV0ZShrZXk6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRBdHRyaWJ1dGUoa2V5KTtcbiAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgIGFzc2VydCh0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiLCBcIkF0dHJpYnV0ZSBrZXkgbXVzdCBiZSBhIHN0cmluZ1wiKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgdmFsdWUgPSB0aGlzLm1vZHVsZS5nZXRfYXR0cmlidXRlKHRoaXMuY3BwQWRkcmVzcywga2V5KTtcbiAgICAgIHJldHVybiB2YWx1ZSA9PT0gXCJcIiA/IG51bGwgOiB2YWx1ZTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0QXR0cmlidXRlKGtleTogc3RyaW5nLCB2YWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2V0QXR0cmlidXRlKGtleSwgdmFsKTtcbiAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgIGFzc2VydCh0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiLCBcIkF0dHJpYnV0ZSBrZXkgbXVzdCBiZSBhIHN0cmluZ1wiKTtcbiAgICBhc3NlcnQodHlwZW9mIHZhbCA9PT0gXCJzdHJpbmdcIiwgXCJBdHRyaWJ1dGUgdmFsdWUgbXVzdCBiZSBhIHN0cmluZ1wiKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICB0aGlzLm1vZHVsZS5zZXRfYXR0cmlidXRlKHRoaXMuY3BwQWRkcmVzcywga2V5LCB2YWwpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBzdGFydE1pbmluZyhudW1UaHJlYWRzOiBudW1iZXIsIGJhY2tncm91bmRNaW5pbmc/OiBib29sZWFuLCBpZ25vcmVCYXR0ZXJ5PzogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc3RhcnRNaW5pbmcobnVtVGhyZWFkcywgYmFja2dyb3VuZE1pbmluZywgaWdub3JlQmF0dGVyeSk7XG4gICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICBsZXQgZGFlbW9uID0gYXdhaXQgTW9uZXJvRGFlbW9uUnBjLmNvbm5lY3RUb0RhZW1vblJwYyhhd2FpdCB0aGlzLmdldERhZW1vbkNvbm5lY3Rpb24oKSk7XG4gICAgYXdhaXQgZGFlbW9uLnN0YXJ0TWluaW5nKGF3YWl0IHRoaXMuZ2V0UHJpbWFyeUFkZHJlc3MoKSwgbnVtVGhyZWFkcywgYmFja2dyb3VuZE1pbmluZywgaWdub3JlQmF0dGVyeSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0b3BNaW5pbmcoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zdG9wTWluaW5nKCk7XG4gICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICBsZXQgZGFlbW9uID0gYXdhaXQgTW9uZXJvRGFlbW9uUnBjLmNvbm5lY3RUb0RhZW1vblJwYyhhd2FpdCB0aGlzLmdldERhZW1vbkNvbm5lY3Rpb24oKSk7XG4gICAgYXdhaXQgZGFlbW9uLnN0b3BNaW5pbmcoKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmlzTXVsdGlzaWdJbXBvcnROZWVkZWQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gdGhpcy5tb2R1bGUuaXNfbXVsdGlzaWdfaW1wb3J0X25lZWRlZCh0aGlzLmNwcEFkZHJlc3MpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBpc011bHRpc2lnKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaXNNdWx0aXNpZygpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5pc19tdWx0aXNpZyh0aGlzLmNwcEFkZHJlc3MpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRNdWx0aXNpZ0luZm8oKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luZm8+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldE11bHRpc2lnSW5mbygpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgTW9uZXJvTXVsdGlzaWdJbmZvKEpTT04ucGFyc2UodGhpcy5tb2R1bGUuZ2V0X211bHRpc2lnX2luZm8odGhpcy5jcHBBZGRyZXNzKSkpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBwcmVwYXJlTXVsdGlzaWcoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLnByZXBhcmVNdWx0aXNpZygpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5wcmVwYXJlX211bHRpc2lnKHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIG1ha2VNdWx0aXNpZyhtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgdGhyZXNob2xkOiBudW1iZXIsIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkubWFrZU11bHRpc2lnKG11bHRpc2lnSGV4ZXMsIHRocmVzaG9sZCwgcGFzc3dvcmQpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLm1ha2VfbXVsdGlzaWcodGhpcy5jcHBBZGRyZXNzLCBKU09OLnN0cmluZ2lmeSh7bXVsdGlzaWdIZXhlczogbXVsdGlzaWdIZXhlcywgdGhyZXNob2xkOiB0aHJlc2hvbGQsIHBhc3N3b3JkOiBwYXNzd29yZH0pLCAocmVzcCkgPT4ge1xuICAgICAgICAgIGxldCBlcnJvcktleSA9IFwiZXJyb3I6IFwiO1xuICAgICAgICAgIGlmIChyZXNwLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3Auc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCkpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGV4Y2hhbmdlTXVsdGlzaWdLZXlzKG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdLCBwYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQ+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmV4Y2hhbmdlTXVsdGlzaWdLZXlzKG11bHRpc2lnSGV4ZXMsIHBhc3N3b3JkKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5leGNoYW5nZV9tdWx0aXNpZ19rZXlzKHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe211bHRpc2lnSGV4ZXM6IG11bHRpc2lnSGV4ZXMsIHBhc3N3b3JkOiBwYXNzd29yZH0pLCAocmVzcCkgPT4ge1xuICAgICAgICAgIGxldCBlcnJvcktleSA9IFwiZXJyb3I6IFwiO1xuICAgICAgICAgIGlmIChyZXNwLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3Auc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCkpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdChKU09OLnBhcnNlKHJlc3ApKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGV4cG9ydE11bHRpc2lnSGV4KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5leHBvcnRNdWx0aXNpZ0hleCgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5leHBvcnRfbXVsdGlzaWdfaGV4KHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGltcG9ydE11bHRpc2lnSGV4KG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdLCByZWZyZXNoQWZ0ZXJJbXBvcnQ/OiBib29sZWFuKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICBpZiAocmVmcmVzaEFmdGVySW1wb3J0ID09PSB1bmRlZmluZWQpIHJlZnJlc2hBZnRlckltcG9ydCA9IHRydWU7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pbXBvcnRNdWx0aXNpZ0hleChtdWx0aXNpZ0hleGVzLCByZWZyZXNoQWZ0ZXJJbXBvcnQpO1xuICAgIGlmICghR2VuVXRpbHMuaXNBcnJheShtdWx0aXNpZ0hleGVzKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIHN0cmluZ1tdIHRvIGltcG9ydE11bHRpc2lnSGV4KClcIilcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5pbXBvcnRfbXVsdGlzaWdfaGV4KHRoaXMuY3BwQWRkcmVzcywgSlNPTi5zdHJpbmdpZnkoe211bHRpc2lnSGV4ZXM6IG11bHRpc2lnSGV4ZXMsIHJlZnJlc2hBZnRlckltcG9ydDogcmVmcmVzaEFmdGVySW1wb3J0fSksIChyZXNwKSA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiByZXNwID09PSBcInN0cmluZ1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUocmVzcCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNpZ25NdWx0aXNpZ1R4SGV4KG11bHRpc2lnVHhIZXg6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0PiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zaWduTXVsdGlzaWdUeEhleChtdWx0aXNpZ1R4SGV4KTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5zaWduX211bHRpc2lnX3R4X2hleCh0aGlzLmNwcEFkZHJlc3MsIG11bHRpc2lnVHhIZXgsIChyZXNwKSA9PiB7XG4gICAgICAgICAgaWYgKHJlc3AuY2hhckF0KDApICE9PSAneycpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IocmVzcCkpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0KEpTT04ucGFyc2UocmVzcCkpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgc3VibWl0TXVsdGlzaWdUeEhleChzaWduZWRNdWx0aXNpZ1R4SGV4OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5zdWJtaXRNdWx0aXNpZ1R4SGV4KHNpZ25lZE11bHRpc2lnVHhIZXgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIHRoaXMubW9kdWxlLnN1Ym1pdF9tdWx0aXNpZ190eF9oZXgodGhpcy5jcHBBZGRyZXNzLCBzaWduZWRNdWx0aXNpZ1R4SGV4LCAocmVzcCkgPT4ge1xuICAgICAgICAgIGlmIChyZXNwLmNoYXJBdCgwKSAhPT0gJ3snKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKHJlc3ApKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoSlNPTi5wYXJzZShyZXNwKS50eEhhc2hlcyk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIGtleXMgYW5kIGNhY2hlIGRhdGEuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPERhdGFWaWV3W10+fSBpcyB0aGUga2V5cyBhbmQgY2FjaGUgZGF0YSwgcmVzcGVjdGl2ZWx5XG4gICAqL1xuICBhc3luYyBnZXREYXRhKCk6IFByb21pc2U8RGF0YVZpZXdbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0RGF0YSgpO1xuICAgIFxuICAgIC8vIHF1ZXVlIGNhbGwgdG8gd2FzbSBtb2R1bGVcbiAgICBsZXQgdmlld09ubHkgPSBhd2FpdCB0aGlzLmlzVmlld09ubHkoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBcbiAgICAgIC8vIHN0b3JlIHZpZXdzIGluIGFycmF5XG4gICAgICBsZXQgdmlld3MgPSBbXTtcbiAgICAgIFxuICAgICAgLy8gbWFsbG9jIGNhY2hlIGJ1ZmZlciBhbmQgZ2V0IGJ1ZmZlciBsb2NhdGlvbiBpbiBjKysgaGVhcFxuICAgICAgbGV0IGNhY2hlQnVmZmVyTG9jID0gSlNPTi5wYXJzZSh0aGlzLm1vZHVsZS5nZXRfY2FjaGVfZmlsZV9idWZmZXIodGhpcy5jcHBBZGRyZXNzKSk7XG4gICAgICBcbiAgICAgIC8vIHJlYWQgYmluYXJ5IGRhdGEgZnJvbSBoZWFwIHRvIERhdGFWaWV3XG4gICAgICBsZXQgdmlldyA9IG5ldyBEYXRhVmlldyhuZXcgQXJyYXlCdWZmZXIoY2FjaGVCdWZmZXJMb2MubGVuZ3RoKSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNhY2hlQnVmZmVyTG9jLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZpZXcuc2V0SW50OChpLCB0aGlzLm1vZHVsZS5IRUFQVThbY2FjaGVCdWZmZXJMb2MucG9pbnRlciAvIFVpbnQ4QXJyYXkuQllURVNfUEVSX0VMRU1FTlQgKyBpXSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIGZyZWUgYmluYXJ5IG9uIGhlYXBcbiAgICAgIHRoaXMubW9kdWxlLl9mcmVlKGNhY2hlQnVmZmVyTG9jLnBvaW50ZXIpO1xuICAgICAgXG4gICAgICAvLyB3cml0ZSBjYWNoZSBmaWxlXG4gICAgICB2aWV3cy5wdXNoKEJ1ZmZlci5mcm9tKHZpZXcuYnVmZmVyKSk7XG4gICAgICBcbiAgICAgIC8vIG1hbGxvYyBrZXlzIGJ1ZmZlciBhbmQgZ2V0IGJ1ZmZlciBsb2NhdGlvbiBpbiBjKysgaGVhcFxuICAgICAgbGV0IGtleXNCdWZmZXJMb2MgPSBKU09OLnBhcnNlKHRoaXMubW9kdWxlLmdldF9rZXlzX2ZpbGVfYnVmZmVyKHRoaXMuY3BwQWRkcmVzcywgdGhpcy5wYXNzd29yZCwgdmlld09ubHkpKTtcbiAgICAgIFxuICAgICAgLy8gcmVhZCBiaW5hcnkgZGF0YSBmcm9tIGhlYXAgdG8gRGF0YVZpZXdcbiAgICAgIHZpZXcgPSBuZXcgRGF0YVZpZXcobmV3IEFycmF5QnVmZmVyKGtleXNCdWZmZXJMb2MubGVuZ3RoKSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXNCdWZmZXJMb2MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmlldy5zZXRJbnQ4KGksIHRoaXMubW9kdWxlLkhFQVBVOFtrZXlzQnVmZmVyTG9jLnBvaW50ZXIgLyBVaW50OEFycmF5LkJZVEVTX1BFUl9FTEVNRU5UICsgaV0pO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBmcmVlIGJpbmFyeSBvbiBoZWFwXG4gICAgICB0aGlzLm1vZHVsZS5fZnJlZShrZXlzQnVmZmVyTG9jLnBvaW50ZXIpO1xuICAgICAgXG4gICAgICAvLyBwcmVwZW5kIGtleXMgZmlsZVxuICAgICAgdmlld3MudW5zaGlmdChCdWZmZXIuZnJvbSh2aWV3LmJ1ZmZlcikpO1xuICAgICAgcmV0dXJuIHZpZXdzO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBjaGFuZ2VQYXNzd29yZChvbGRQYXNzd29yZDogc3RyaW5nLCBuZXdQYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jaGFuZ2VQYXNzd29yZChvbGRQYXNzd29yZCwgbmV3UGFzc3dvcmQpO1xuICAgIGlmIChvbGRQYXNzd29yZCAhPT0gdGhpcy5wYXNzd29yZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiSW52YWxpZCBvcmlnaW5hbCBwYXNzd29yZC5cIik7IC8vIHdhbGxldDIgdmVyaWZ5X3Bhc3N3b3JkIGxvYWRzIGZyb20gZGlzayBzbyB2ZXJpZnkgcGFzc3dvcmQgaGVyZVxuICAgIGlmIChuZXdQYXNzd29yZCA9PT0gdW5kZWZpbmVkKSBuZXdQYXNzd29yZCA9IFwiXCI7XG4gICAgYXdhaXQgdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICB0aGlzLm1vZHVsZS5jaGFuZ2Vfd2FsbGV0X3Bhc3N3b3JkKHRoaXMuY3BwQWRkcmVzcywgb2xkUGFzc3dvcmQsIG5ld1Bhc3N3b3JkLCAoZXJyTXNnKSA9PiB7XG4gICAgICAgICAgaWYgKGVyck1zZykgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihlcnJNc2cpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICB0aGlzLnBhc3N3b3JkID0gbmV3UGFzc3dvcmQ7XG4gICAgaWYgKHRoaXMucGF0aCkgYXdhaXQgdGhpcy5zYXZlKCk7IC8vIGF1dG8gc2F2ZVxuICB9XG4gIFxuICBhc3luYyBzYXZlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuc2F2ZSgpO1xuICAgIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLnNhdmUodGhpcyk7XG4gIH1cbiAgXG4gIGFzeW5jIGNsb3NlKHNhdmUgPSBmYWxzZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLl9pc0Nsb3NlZCkgcmV0dXJuOyAvLyBubyBlZmZlY3QgaWYgY2xvc2VkXG4gICAgaWYgKHNhdmUpIGF3YWl0IHRoaXMuc2F2ZSgpO1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHtcbiAgICAgIGF3YWl0IHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5jbG9zZShmYWxzZSk7XG4gICAgICBhd2FpdCBzdXBlci5jbG9zZSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBhd2FpdCB0aGlzLnJlZnJlc2hMaXN0ZW5pbmcoKTtcbiAgICBhd2FpdCB0aGlzLnN0b3BTeW5jaW5nKCk7XG4gICAgYXdhaXQgc3VwZXIuY2xvc2UoKTtcbiAgICBkZWxldGUgdGhpcy5wYXRoO1xuICAgIGRlbGV0ZSB0aGlzLnBhc3N3b3JkO1xuICAgIGRlbGV0ZSB0aGlzLndhc21MaXN0ZW5lcjtcbiAgICBMaWJyYXJ5VXRpbHMuc2V0UmVqZWN0VW5hdXRob3JpemVkRm4odGhpcy5yZWplY3RVbmF1dGhvcml6ZWRDb25maWdJZCwgdW5kZWZpbmVkKTsgLy8gdW5yZWdpc3RlciBmbiBpbmZvcm1pbmcgaWYgdW5hdXRob3JpemVkIHJlcXMgc2hvdWxkIGJlIHJlamVjdGVkXG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tIEFERCBKU0RPQyBGT1IgU1VQUE9SVEVEIERFRkFVTFQgSU1QTEVNRU5UQVRJT05TIC0tLS0tLS0tLS0tLS0tXG4gIFxuICBhc3luYyBnZXROdW1CbG9ja3NUb1VubG9jaygpOiBQcm9taXNlPG51bWJlcltdfHVuZGVmaW5lZD4geyByZXR1cm4gc3VwZXIuZ2V0TnVtQmxvY2tzVG9VbmxvY2soKTsgfVxuICBhc3luYyBnZXRUeCh0eEhhc2g6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhXYWxsZXR8dW5kZWZpbmVkPiB7IHJldHVybiBzdXBlci5nZXRUeCh0eEhhc2gpOyB9XG4gIGFzeW5jIGdldEluY29taW5nVHJhbnNmZXJzKHF1ZXJ5OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KTogUHJvbWlzZTxNb25lcm9JbmNvbWluZ1RyYW5zZmVyW10+IHsgcmV0dXJuIHN1cGVyLmdldEluY29taW5nVHJhbnNmZXJzKHF1ZXJ5KTsgfVxuICBhc3luYyBnZXRPdXRnb2luZ1RyYW5zZmVycyhxdWVyeTogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5PikgeyByZXR1cm4gc3VwZXIuZ2V0T3V0Z29pbmdUcmFuc2ZlcnMocXVlcnkpOyB9XG4gIGFzeW5jIGNyZWF0ZVR4KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7IHJldHVybiBzdXBlci5jcmVhdGVUeChjb25maWcpOyB9XG4gIGFzeW5jIHJlbGF5VHgodHhPck1ldGFkYXRhOiBNb25lcm9UeFdhbGxldCB8IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7IHJldHVybiBzdXBlci5yZWxheVR4KHR4T3JNZXRhZGF0YSk7IH1cbiAgYXN5bmMgZ2V0VHhOb3RlKHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHsgcmV0dXJuIHN1cGVyLmdldFR4Tm90ZSh0eEhhc2gpOyB9XG4gIGFzeW5jIHNldFR4Tm90ZSh0eEhhc2g6IHN0cmluZywgbm90ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7IHJldHVybiBzdXBlci5zZXRUeE5vdGUodHhIYXNoLCBub3RlKTsgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIEhFTFBFUlMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgb3BlbldhbGxldERhdGEoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pIHtcbiAgICBpZiAoY29uZmlnLnByb3h5VG9Xb3JrZXIpIHtcbiAgICAgIGxldCB3YWxsZXRQcm94eSA9IGF3YWl0IE1vbmVyb1dhbGxldEZ1bGxQcm94eS5vcGVuV2FsbGV0RGF0YShjb25maWcpO1xuICAgICAgcmV0dXJuIG5ldyBNb25lcm9XYWxsZXRGdWxsKHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHdhbGxldFByb3h5KTtcbiAgICB9XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgYW5kIG5vcm1hbGl6ZSBwYXJhbWV0ZXJzXG4gICAgaWYgKGNvbmZpZy5uZXR3b3JrVHlwZSA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgdGhlIHdhbGxldCdzIG5ldHdvcmsgdHlwZVwiKTtcbiAgICBjb25maWcubmV0d29ya1R5cGUgPSBNb25lcm9OZXR3b3JrVHlwZS5mcm9tKGNvbmZpZy5uZXR3b3JrVHlwZSk7XG4gICAgbGV0IGRhZW1vbkNvbm5lY3Rpb24gPSBjb25maWcuZ2V0U2VydmVyKCk7XG4gICAgbGV0IGRhZW1vblVyaSA9IGRhZW1vbkNvbm5lY3Rpb24gJiYgZGFlbW9uQ29ubmVjdGlvbi5nZXRVcmkoKSA/IGRhZW1vbkNvbm5lY3Rpb24uZ2V0VXJpKCkgOiBcIlwiO1xuICAgIGxldCBkYWVtb25Vc2VybmFtZSA9IGRhZW1vbkNvbm5lY3Rpb24gJiYgZGFlbW9uQ29ubmVjdGlvbi5nZXRVc2VybmFtZSgpID8gZGFlbW9uQ29ubmVjdGlvbi5nZXRVc2VybmFtZSgpIDogXCJcIjtcbiAgICBsZXQgZGFlbW9uUGFzc3dvcmQgPSBkYWVtb25Db25uZWN0aW9uICYmIGRhZW1vbkNvbm5lY3Rpb24uZ2V0UGFzc3dvcmQoKSA/IGRhZW1vbkNvbm5lY3Rpb24uZ2V0UGFzc3dvcmQoKSA6IFwiXCI7XG4gICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZCA9IGRhZW1vbkNvbm5lY3Rpb24gPyBkYWVtb25Db25uZWN0aW9uLmdldFJlamVjdFVuYXV0aG9yaXplZCgpIDogdHJ1ZTtcbiAgICBcbiAgICAvLyBsb2FkIHdhc20gbW9kdWxlXG4gICAgbGV0IG1vZHVsZSA9IGF3YWl0IExpYnJhcnlVdGlscy5sb2FkV2FzbU1vZHVsZSgpO1xuICAgIFxuICAgIC8vIG9wZW4gd2FsbGV0IGluIHF1ZXVlXG4gICAgcmV0dXJuIG1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIHJlZ2lzdGVyIGZuIGluZm9ybWluZyBpZiB1bmF1dGhvcml6ZWQgcmVxcyBzaG91bGQgYmUgcmVqZWN0ZWRcbiAgICAgICAgbGV0IHJlamVjdFVuYXV0aG9yaXplZEZuSWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5zZXRSZWplY3RVbmF1dGhvcml6ZWRGbihyZWplY3RVbmF1dGhvcml6ZWRGbklkLCAoKSA9PiByZWplY3RVbmF1dGhvcml6ZWQpO1xuICAgICAgXG4gICAgICAgIC8vIGNyZWF0ZSB3YWxsZXQgaW4gd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICBtb2R1bGUub3Blbl93YWxsZXRfZnVsbChjb25maWcucGFzc3dvcmQsIGNvbmZpZy5uZXR3b3JrVHlwZSwgY29uZmlnLmtleXNEYXRhID8/IFwiXCIsIGNvbmZpZy5jYWNoZURhdGEgPz8gXCJcIiwgZGFlbW9uVXJpLCBkYWVtb25Vc2VybmFtZSwgZGFlbW9uUGFzc3dvcmQsIHJlamVjdFVuYXV0aG9yaXplZEZuSWQsIGNvbmZpZy5nZXRSZWd0ZXN0KCkgPT09IHVuZGVmaW5lZCA/IGZhbHNlIDogY29uZmlnLmdldFJlZ3Rlc3QoKSwgKGNwcEFkZHJlc3MpID0+IHtcbiAgICAgICAgICBpZiAodHlwZW9mIGNwcEFkZHJlc3MgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoY3BwQWRkcmVzcykpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvV2FsbGV0RnVsbChjcHBBZGRyZXNzLCBjb25maWcucGF0aCwgY29uZmlnLnBhc3N3b3JkLCBjb25maWcuZnMsIHJlamVjdFVuYXV0aG9yaXplZCwgcmVqZWN0VW5hdXRob3JpemVkRm5JZCkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcHJvdGVjdGVkIGdldFdhbGxldFByb3h5KCk6IE1vbmVyb1dhbGxldEZ1bGxQcm94eSB7XG4gICAgcmV0dXJuIHN1cGVyLmdldFdhbGxldFByb3h5KCkgYXMgTW9uZXJvV2FsbGV0RnVsbFByb3h5O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgYmFja2dyb3VuZFN5bmMoKSB7XG4gICAgbGV0IGxhYmVsID0gdGhpcy5wYXRoID8gdGhpcy5wYXRoIDogKHRoaXMuYnJvd3Nlck1haW5QYXRoID8gdGhpcy5icm93c2VyTWFpblBhdGggOiBcImluLW1lbW9yeSB3YWxsZXRcIik7IC8vIGxhYmVsIGZvciBsb2dcbiAgICBMaWJyYXJ5VXRpbHMubG9nKDEsIFwiQmFja2dyb3VuZCBzeW5jaHJvbml6aW5nIFwiICsgbGFiZWwpO1xuICAgIHRyeSB7IGF3YWl0IHRoaXMuc3luYygpOyB9XG4gICAgY2F0Y2ggKGVycjogYW55KSB7IGlmICghdGhpcy5faXNDbG9zZWQpIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gYmFja2dyb3VuZCBzeW5jaHJvbml6ZSBcIiArIGxhYmVsICsgXCI6IFwiICsgZXJyLm1lc3NhZ2UpOyB9XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyByZWZyZXNoTGlzdGVuaW5nKCkge1xuICAgIGxldCBpc0VuYWJsZWQgPSB0aGlzLmxpc3RlbmVycy5sZW5ndGggPiAwO1xuICAgIGlmICh0aGlzLndhc21MaXN0ZW5lckhhbmRsZSA9PT0gMCAmJiAhaXNFbmFibGVkIHx8IHRoaXMud2FzbUxpc3RlbmVySGFuZGxlID4gMCAmJiBpc0VuYWJsZWQpIHJldHVybjsgLy8gbm8gZGlmZmVyZW5jZVxuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgdGhpcy5tb2R1bGUuc2V0X2xpc3RlbmVyKFxuICAgICAgICAgIHRoaXMuY3BwQWRkcmVzcyxcbiAgICAgICAgICB0aGlzLndhc21MaXN0ZW5lckhhbmRsZSxcbiAgICAgICAgICAgIG5ld0xpc3RlbmVySGFuZGxlID0+IHtcbiAgICAgICAgICAgICAgaWYgKHR5cGVvZiBuZXdMaXN0ZW5lckhhbmRsZSA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihuZXdMaXN0ZW5lckhhbmRsZSkpO1xuICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLndhc21MaXN0ZW5lckhhbmRsZSA9IG5ld0xpc3RlbmVySGFuZGxlO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGlzRW5hYmxlZCA/IGFzeW5jIChoZWlnaHQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIHBlcmNlbnREb25lLCBtZXNzYWdlKSA9PiBhd2FpdCB0aGlzLndhc21MaXN0ZW5lci5vblN5bmNQcm9ncmVzcyhoZWlnaHQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIHBlcmNlbnREb25lLCBtZXNzYWdlKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGlzRW5hYmxlZCA/IGFzeW5jIChoZWlnaHQpID0+IGF3YWl0IHRoaXMud2FzbUxpc3RlbmVyLm9uTmV3QmxvY2soaGVpZ2h0KSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGlzRW5hYmxlZCA/IGFzeW5jIChuZXdCYWxhbmNlU3RyLCBuZXdVbmxvY2tlZEJhbGFuY2VTdHIpID0+IGF3YWl0IHRoaXMud2FzbUxpc3RlbmVyLm9uQmFsYW5jZXNDaGFuZ2VkKG5ld0JhbGFuY2VTdHIsIG5ld1VubG9ja2VkQmFsYW5jZVN0cikgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICBpc0VuYWJsZWQgPyBhc3luYyAoaGVpZ2h0LCB0eEhhc2gsIGFtb3VudFN0ciwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCwgdmVyc2lvbiwgdW5sb2NrVGltZSwgaXNMb2NrZWQpID0+IGF3YWl0IHRoaXMud2FzbUxpc3RlbmVyLm9uT3V0cHV0UmVjZWl2ZWQoaGVpZ2h0LCB0eEhhc2gsIGFtb3VudFN0ciwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCwgdmVyc2lvbiwgdW5sb2NrVGltZSwgaXNMb2NrZWQpIDogdW5kZWZpbmVkLFxuICAgICAgICAgICAgaXNFbmFibGVkID8gYXN5bmMgKGhlaWdodCwgdHhIYXNoLCBhbW91bnRTdHIsIGFjY291bnRJZHhTdHIsIHN1YmFkZHJlc3NJZHhTdHIsIHZlcnNpb24sIHVubG9ja1RpbWUsIGlzTG9ja2VkKSA9PiBhd2FpdCB0aGlzLndhc21MaXN0ZW5lci5vbk91dHB1dFNwZW50KGhlaWdodCwgdHhIYXNoLCBhbW91bnRTdHIsIGFjY291bnRJZHhTdHIsIHN1YmFkZHJlc3NJZHhTdHIsIHZlcnNpb24sIHVubG9ja1RpbWUsIGlzTG9ja2VkKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBzdGF0aWMgc2FuaXRpemVCbG9jayhibG9jaykge1xuICAgIGZvciAobGV0IHR4IG9mIGJsb2NrLmdldFR4cygpKSBNb25lcm9XYWxsZXRGdWxsLnNhbml0aXplVHhXYWxsZXQodHgpO1xuICAgIHJldHVybiBibG9jaztcbiAgfVxuICBcbiAgc3RhdGljIHNhbml0aXplVHhXYWxsZXQodHgpIHtcbiAgICBhc3NlcnQodHggaW5zdGFuY2VvZiBNb25lcm9UeFdhbGxldCk7XG4gICAgcmV0dXJuIHR4O1xuICB9XG4gIFxuICBzdGF0aWMgc2FuaXRpemVBY2NvdW50KGFjY291bnQpIHtcbiAgICBpZiAoYWNjb3VudC5nZXRTdWJhZGRyZXNzZXMoKSkge1xuICAgICAgZm9yIChsZXQgc3ViYWRkcmVzcyBvZiBhY2NvdW50LmdldFN1YmFkZHJlc3NlcygpKSBNb25lcm9XYWxsZXRLZXlzLnNhbml0aXplU3ViYWRkcmVzcyhzdWJhZGRyZXNzKTtcbiAgICB9XG4gICAgcmV0dXJuIGFjY291bnQ7XG4gIH1cbiAgXG4gIHN0YXRpYyBkZXNlcmlhbGl6ZUJsb2NrcyhibG9ja3NKc29uU3RyKSB7XG4gICAgbGV0IGJsb2Nrc0pzb24gPSBKU09OLnBhcnNlKEdlblV0aWxzLnN0cmluZ2lmeUJpZ0ludHMoYmxvY2tzSnNvblN0cikpO1xuICAgIGxldCBkZXNlcmlhbGl6ZWRCbG9ja3M6IGFueSA9IHt9O1xuICAgIGRlc2VyaWFsaXplZEJsb2Nrcy5ibG9ja3MgPSBbXTtcbiAgICBpZiAoYmxvY2tzSnNvbi5ibG9ja3MpIGZvciAobGV0IGJsb2NrSnNvbiBvZiBibG9ja3NKc29uLmJsb2NrcykgZGVzZXJpYWxpemVkQmxvY2tzLmJsb2Nrcy5wdXNoKE1vbmVyb1dhbGxldEZ1bGwuc2FuaXRpemVCbG9jayhuZXcgTW9uZXJvQmxvY2soYmxvY2tKc29uLCBNb25lcm9CbG9jay5EZXNlcmlhbGl6YXRpb25UeXBlLlRYX1dBTExFVCkpKTtcbiAgICByZXR1cm4gZGVzZXJpYWxpemVkQmxvY2tzO1xuICB9XG4gIFxuICBzdGF0aWMgZGVzZXJpYWxpemVUeHMocXVlcnksIGJsb2Nrc0pzb25TdHIpIHtcbiAgICBcbiAgICAvLyBkZXNlcmlhbGl6ZSBibG9ja3NcbiAgICBsZXQgZGVzZXJpYWxpemVkQmxvY2tzID0gTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZUJsb2NrcyhibG9ja3NKc29uU3RyKTtcbiAgICBsZXQgYmxvY2tzID0gZGVzZXJpYWxpemVkQmxvY2tzLmJsb2NrcztcbiAgICBcbiAgICAvLyBjb2xsZWN0IHR4c1xuICAgIGxldCB0eHMgPSBbXTtcbiAgICBmb3IgKGxldCBibG9jayBvZiBibG9ja3MpIHtcbiAgICAgIE1vbmVyb1dhbGxldEZ1bGwuc2FuaXRpemVCbG9jayhibG9jayk7XG4gICAgICBmb3IgKGxldCB0eCBvZiBibG9jay5nZXRUeHMoKSkge1xuICAgICAgICBpZiAoYmxvY2suZ2V0SGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgdHguc2V0QmxvY2sodW5kZWZpbmVkKTsgLy8gZGVyZWZlcmVuY2UgcGxhY2Vob2xkZXIgYmxvY2sgZm9yIHVuY29uZmlybWVkIHR4c1xuICAgICAgICB0eHMucHVzaCh0eCk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIHJlLXNvcnQgdHhzIHdoaWNoIGlzIGxvc3Qgb3ZlciB3YXNtIHNlcmlhbGl6YXRpb24gIC8vIFRPRE86IGNvbmZpcm0gdGhhdCBvcmRlciBpcyBsb3N0XG4gICAgaWYgKHF1ZXJ5LmdldEhhc2hlcygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGxldCB0eE1hcCA9IG5ldyBNYXAoKTtcbiAgICAgIGZvciAobGV0IHR4IG9mIHR4cykgdHhNYXBbdHguZ2V0SGFzaCgpXSA9IHR4O1xuICAgICAgbGV0IHR4c1NvcnRlZCA9IFtdO1xuICAgICAgZm9yIChsZXQgdHhIYXNoIG9mIHF1ZXJ5LmdldEhhc2hlcygpKSBpZiAodHhNYXBbdHhIYXNoXSAhPT0gdW5kZWZpbmVkKSB0eHNTb3J0ZWQucHVzaCh0eE1hcFt0eEhhc2hdKTtcbiAgICAgIHR4cyA9IHR4c1NvcnRlZDtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHR4cztcbiAgfVxuICBcbiAgc3RhdGljIGRlc2VyaWFsaXplVHJhbnNmZXJzKHF1ZXJ5LCBibG9ja3NKc29uU3RyKSB7XG4gICAgXG4gICAgLy8gZGVzZXJpYWxpemUgYmxvY2tzXG4gICAgbGV0IGRlc2VyaWFsaXplZEJsb2NrcyA9IE1vbmVyb1dhbGxldEZ1bGwuZGVzZXJpYWxpemVCbG9ja3MoYmxvY2tzSnNvblN0cik7XG4gICAgbGV0IGJsb2NrcyA9IGRlc2VyaWFsaXplZEJsb2Nrcy5ibG9ja3M7XG4gICAgXG4gICAgLy8gY29sbGVjdCB0cmFuc2ZlcnNcbiAgICBsZXQgdHJhbnNmZXJzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2sgb2YgYmxvY2tzKSB7XG4gICAgICBmb3IgKGxldCB0eCBvZiBibG9jay5nZXRUeHMoKSkge1xuICAgICAgICBpZiAoYmxvY2suZ2V0SGVpZ2h0KCkgPT09IHVuZGVmaW5lZCkgdHguc2V0QmxvY2sodW5kZWZpbmVkKTsgLy8gZGVyZWZlcmVuY2UgcGxhY2Vob2xkZXIgYmxvY2sgZm9yIHVuY29uZmlybWVkIHR4c1xuICAgICAgICBpZiAodHguZ2V0T3V0Z29pbmdUcmFuc2ZlcigpICE9PSB1bmRlZmluZWQpIHRyYW5zZmVycy5wdXNoKHR4LmdldE91dGdvaW5nVHJhbnNmZXIoKSk7XG4gICAgICAgIGlmICh0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBmb3IgKGxldCB0cmFuc2ZlciBvZiB0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpKSB0cmFuc2ZlcnMucHVzaCh0cmFuc2Zlcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHRyYW5zZmVycztcbiAgfVxuICBcbiAgc3RhdGljIGRlc2VyaWFsaXplT3V0cHV0cyhxdWVyeSwgYmxvY2tzSnNvblN0cikge1xuICAgIFxuICAgIC8vIGRlc2VyaWFsaXplIGJsb2Nrc1xuICAgIGxldCBkZXNlcmlhbGl6ZWRCbG9ja3MgPSBNb25lcm9XYWxsZXRGdWxsLmRlc2VyaWFsaXplQmxvY2tzKGJsb2Nrc0pzb25TdHIpO1xuICAgIGxldCBibG9ja3MgPSBkZXNlcmlhbGl6ZWRCbG9ja3MuYmxvY2tzO1xuICAgIFxuICAgIC8vIGNvbGxlY3Qgb3V0cHV0c1xuICAgIGxldCBvdXRwdXRzID0gW107XG4gICAgZm9yIChsZXQgYmxvY2sgb2YgYmxvY2tzKSB7XG4gICAgICBmb3IgKGxldCB0eCBvZiBibG9jay5nZXRUeHMoKSkge1xuICAgICAgICBmb3IgKGxldCBvdXRwdXQgb2YgdHguZ2V0T3V0cHV0cygpKSBvdXRwdXRzLnB1c2gob3V0cHV0KTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIG91dHB1dHM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZXQgdGhlIHBhdGggb2YgdGhlIHdhbGxldCBvbiB0aGUgYnJvd3NlciBtYWluIHRocmVhZCBpZiBydW4gYXMgYSB3b3JrZXIuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gYnJvd3Nlck1haW5QYXRoIC0gcGF0aCBvZiB0aGUgd2FsbGV0IG9uIHRoZSBicm93c2VyIG1haW4gdGhyZWFkXG4gICAqL1xuICBwcm90ZWN0ZWQgc2V0QnJvd3Nlck1haW5QYXRoKGJyb3dzZXJNYWluUGF0aCkge1xuICAgIHRoaXMuYnJvd3Nlck1haW5QYXRoID0gYnJvd3Nlck1haW5QYXRoO1xuICB9XG4gIFxuICBzdGF0aWMgYXN5bmMgbW92ZVRvKHBhdGgsIHdhbGxldCkge1xuXG4gICAgLy8gc2F2ZSBhbmQgcmV0dXJuIGlmIHNhbWUgcGF0aFxuICAgIGlmIChQYXRoLm5vcm1hbGl6ZSh3YWxsZXQucGF0aCkgPT09IFBhdGgubm9ybWFsaXplKHBhdGgpKSB7XG4gICAgICByZXR1cm4gd2FsbGV0LnNhdmUoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gTGlicmFyeVV0aWxzLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICBpZiAoYXdhaXQgd2FsbGV0LmlzQ2xvc2VkKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBpcyBjbG9zZWRcIik7XG4gICAgICBpZiAoIXBhdGgpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBwYXRoIG9mIGRlc3RpbmF0aW9uIHdhbGxldFwiKTtcblxuICAgICAgLy8gY3JlYXRlIGRlc3RpbmF0aW9uIGRpcmVjdG9yeSBpZiBpdCBkb2Vzbid0IGV4aXN0XG4gICAgICBsZXQgd2FsbGV0RGlyID0gUGF0aC5kaXJuYW1lKHBhdGgpO1xuICAgICAgaWYgKCFhd2FpdCBMaWJyYXJ5VXRpbHMuZXhpc3RzKHdhbGxldC5mcywgd2FsbGV0RGlyKSkge1xuICAgICAgICB0cnkgeyBhd2FpdCB3YWxsZXQuZnMubWtkaXIod2FsbGV0RGlyKTsgfVxuICAgICAgICBjYXRjaCAoZXJyOiBhbnkpIHsgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiRGVzdGluYXRpb24gcGF0aCBcIiArIHBhdGggKyBcIiBkb2VzIG5vdCBleGlzdCBhbmQgY2Fubm90IGJlIGNyZWF0ZWQ6IFwiICsgZXJyLm1lc3NhZ2UpOyB9XG4gICAgICB9XG5cbiAgICAgIC8vIGdldCB3YWxsZXQgZGF0YVxuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHdhbGxldC5nZXREYXRhKCk7XG5cbiAgICAgIC8vIHdyaXRlIHdhbGxldCBmaWxlc1xuICAgICAgYXdhaXQgd2FsbGV0LmZzLndyaXRlRmlsZShwYXRoICsgXCIua2V5c1wiLCBkYXRhWzBdLCBcImJpbmFyeVwiKTtcbiAgICAgIGF3YWl0IHdhbGxldC5mcy53cml0ZUZpbGUocGF0aCwgZGF0YVsxXSwgXCJiaW5hcnlcIik7XG4gICAgICBhd2FpdCB3YWxsZXQuZnMud3JpdGVGaWxlKHBhdGggKyBcIi5hZGRyZXNzLnR4dFwiLCBhd2FpdCB3YWxsZXQuZ2V0UHJpbWFyeUFkZHJlc3MoKSk7XG4gICAgICBsZXQgb2xkUGF0aCA9IHdhbGxldC5wYXRoO1xuICAgICAgd2FsbGV0LnBhdGggPSBwYXRoO1xuXG4gICAgICAvLyBkZWxldGUgb2xkIHdhbGxldCBmaWxlc1xuICAgICAgaWYgKG9sZFBhdGgpIHtcbiAgICAgICAgYXdhaXQgd2FsbGV0LmZzLnVubGluayhvbGRQYXRoICsgXCIuYWRkcmVzcy50eHRcIik7XG4gICAgICAgIGF3YWl0IHdhbGxldC5mcy51bmxpbmsob2xkUGF0aCArIFwiLmtleXNcIik7XG4gICAgICAgIGF3YWl0IHdhbGxldC5mcy51bmxpbmsob2xkUGF0aCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIHN0YXRpYyBhc3luYyBzYXZlKHdhbGxldDogYW55KSB7XG4gICAgcmV0dXJuIExpYnJhcnlVdGlscy5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgaWYgKGF3YWl0IHdhbGxldC5pc0Nsb3NlZCgpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgaXMgY2xvc2VkXCIpO1xuXG4gICAgICAvLyBwYXRoIG11c3QgYmUgc2V0XG4gICAgICBsZXQgcGF0aCA9IGF3YWl0IHdhbGxldC5nZXRQYXRoKCk7XG4gICAgICBpZiAoIXBhdGgpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzYXZlIHdhbGxldCBiZWNhdXNlIHBhdGggaXMgbm90IHNldFwiKTtcblxuICAgICAgLy8gZ2V0IHdhbGxldCBkYXRhXG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgd2FsbGV0LmdldERhdGEoKTtcblxuICAgICAgLy8gd3JpdGUgd2FsbGV0IGZpbGVzIHRvICoubmV3XG4gICAgICBsZXQgcGF0aE5ldyA9IHBhdGggKyBcIi5uZXdcIjtcbiAgICAgIGF3YWl0IHdhbGxldC5mcy53cml0ZUZpbGUocGF0aE5ldyArIFwiLmtleXNcIiwgZGF0YVswXSwgXCJiaW5hcnlcIik7XG4gICAgICBhd2FpdCB3YWxsZXQuZnMud3JpdGVGaWxlKHBhdGhOZXcsIGRhdGFbMV0sIFwiYmluYXJ5XCIpO1xuICAgICAgYXdhaXQgd2FsbGV0LmZzLndyaXRlRmlsZShwYXRoTmV3ICsgXCIuYWRkcmVzcy50eHRcIiwgYXdhaXQgd2FsbGV0LmdldFByaW1hcnlBZGRyZXNzKCkpO1xuXG4gICAgICAvLyByZXBsYWNlIG9sZCB3YWxsZXQgZmlsZXMgd2l0aCBuZXdcbiAgICAgIGF3YWl0IHdhbGxldC5mcy5yZW5hbWUocGF0aE5ldyArIFwiLmtleXNcIiwgcGF0aCArIFwiLmtleXNcIik7XG4gICAgICBhd2FpdCB3YWxsZXQuZnMucmVuYW1lKHBhdGhOZXcsIHBhdGgpO1xuICAgICAgYXdhaXQgd2FsbGV0LmZzLnJlbmFtZShwYXRoTmV3ICsgXCIuYWRkcmVzcy50eHRcIiwgcGF0aCArIFwiLmFkZHJlc3MudHh0XCIpO1xuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogSW1wbGVtZW50cyBhIE1vbmVyb1dhbGxldCBieSBwcm94eWluZyByZXF1ZXN0cyB0byBhIHdvcmtlciB3aGljaCBydW5zIGEgZnVsbCB3YWxsZXQuXG4gKiBcbiAqIEBwcml2YXRlXG4gKi9cbmNsYXNzIE1vbmVyb1dhbGxldEZ1bGxQcm94eSBleHRlbmRzIE1vbmVyb1dhbGxldEtleXNQcm94eSB7XG5cbiAgLy8gaW5zdGFuY2UgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBwYXRoOiBhbnk7XG4gIHByb3RlY3RlZCBmczogYW55O1xuICBwcm90ZWN0ZWQgd3JhcHBlZExpc3RlbmVyczogYW55O1xuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gV0FMTEVUIFNUQVRJQyBVVElMUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIHN0YXRpYyBhc3luYyBvcGVuV2FsbGV0RGF0YShjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPikge1xuICAgIGxldCB3YWxsZXRJZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICBpZiAoY29uZmlnLnBhc3N3b3JkID09PSB1bmRlZmluZWQpIGNvbmZpZy5wYXNzd29yZCA9IFwiXCI7XG4gICAgbGV0IGRhZW1vbkNvbm5lY3Rpb24gPSBjb25maWcuZ2V0U2VydmVyKCk7XG4gICAgYXdhaXQgTGlicmFyeVV0aWxzLmludm9rZVdvcmtlcih3YWxsZXRJZCwgXCJvcGVuV2FsbGV0RGF0YVwiLCBbY29uZmlnLnBhdGgsIGNvbmZpZy5wYXNzd29yZCwgY29uZmlnLm5ldHdvcmtUeXBlLCBjb25maWcua2V5c0RhdGEsIGNvbmZpZy5jYWNoZURhdGEsIGRhZW1vbkNvbm5lY3Rpb24gPyBkYWVtb25Db25uZWN0aW9uLnRvSnNvbigpIDogdW5kZWZpbmVkXSk7XG4gICAgbGV0IHdhbGxldCA9IG5ldyBNb25lcm9XYWxsZXRGdWxsUHJveHkod2FsbGV0SWQsIGF3YWl0IExpYnJhcnlVdGlscy5nZXRXb3JrZXIoKSwgY29uZmlnLnBhdGgsIGNvbmZpZy5nZXRGcygpKTtcbiAgICBpZiAoY29uZmlnLnBhdGgpIGF3YWl0IHdhbGxldC5zYXZlKCk7XG4gICAgcmV0dXJuIHdhbGxldDtcbiAgfVxuICBcbiAgc3RhdGljIGFzeW5jIGNyZWF0ZVdhbGxldChjb25maWcpIHtcbiAgICBpZiAoY29uZmlnLmdldFBhdGgoKSAmJiBhd2FpdCBNb25lcm9XYWxsZXRGdWxsLndhbGxldEV4aXN0cyhjb25maWcuZ2V0UGF0aCgpLCBjb25maWcuZ2V0RnMoKSkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBhbHJlYWR5IGV4aXN0czogXCIgKyBjb25maWcuZ2V0UGF0aCgpKTtcbiAgICBsZXQgd2FsbGV0SWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgYXdhaXQgTGlicmFyeVV0aWxzLmludm9rZVdvcmtlcih3YWxsZXRJZCwgXCJjcmVhdGVXYWxsZXRGdWxsXCIsIFtjb25maWcudG9Kc29uKCldKTtcbiAgICBsZXQgd2FsbGV0ID0gbmV3IE1vbmVyb1dhbGxldEZ1bGxQcm94eSh3YWxsZXRJZCwgYXdhaXQgTGlicmFyeVV0aWxzLmdldFdvcmtlcigpLCBjb25maWcuZ2V0UGF0aCgpLCBjb25maWcuZ2V0RnMoKSk7XG4gICAgaWYgKGNvbmZpZy5nZXRQYXRoKCkpIGF3YWl0IHdhbGxldC5zYXZlKCk7XG4gICAgcmV0dXJuIHdhbGxldDtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIElOU1RBTkNFIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgLyoqXG4gICAqIEludGVybmFsIGNvbnN0cnVjdG9yIHdoaWNoIGlzIGdpdmVuIGEgd29ya2VyIHRvIGNvbW11bmljYXRlIHdpdGggdmlhIG1lc3NhZ2VzLlxuICAgKiBcbiAgICogVGhpcyBtZXRob2Qgc2hvdWxkIG5vdCBiZSBjYWxsZWQgZXh0ZXJuYWxseSBidXQgc2hvdWxkIGJlIGNhbGxlZCB0aHJvdWdoXG4gICAqIHN0YXRpYyB3YWxsZXQgY3JlYXRpb24gdXRpbGl0aWVzIGluIHRoaXMgY2xhc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gd2FsbGV0SWQgLSBpZGVudGlmaWVzIHRoZSB3YWxsZXQgd2l0aCB0aGUgd29ya2VyXG4gICAqIEBwYXJhbSB7V29ya2VyfSB3b3JrZXIgLSB3b3JrZXIgdG8gY29tbXVuaWNhdGUgd2l0aCB2aWEgbWVzc2FnZXNcbiAgICovXG4gIGNvbnN0cnVjdG9yKHdhbGxldElkLCB3b3JrZXIsIHBhdGgsIGZzKSB7XG4gICAgc3VwZXIod2FsbGV0SWQsIHdvcmtlcik7XG4gICAgdGhpcy5wYXRoID0gcGF0aDtcbiAgICB0aGlzLmZzID0gZnMgPyBmcyA6IChwYXRoID8gTW9uZXJvV2FsbGV0RnVsbC5nZXRGcygpIDogdW5kZWZpbmVkKTtcbiAgICB0aGlzLndyYXBwZWRMaXN0ZW5lcnMgPSBbXTtcbiAgfVxuXG4gIGdldFBhdGgoKSB7XG4gICAgcmV0dXJuIHRoaXMucGF0aDtcbiAgfVxuXG4gIGFzeW5jIGdldE5ldHdvcmtUeXBlKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldE5ldHdvcmtUeXBlXCIpO1xuICB9XG4gIFxuICBhc3luYyBzZXRTdWJhZGRyZXNzTGFiZWwoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCwgbGFiZWwpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzZXRTdWJhZGRyZXNzTGFiZWxcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSBhcyBQcm9taXNlPHZvaWQ+O1xuICB9XG4gIFxuICBhc3luYyBzZXREYWVtb25Db25uZWN0aW9uKHVyaU9yUnBjQ29ubmVjdGlvbikge1xuICAgIGlmICghdXJpT3JScGNDb25uZWN0aW9uKSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInNldERhZW1vbkNvbm5lY3Rpb25cIik7XG4gICAgZWxzZSB7XG4gICAgICBsZXQgY29ubmVjdGlvbiA9ICF1cmlPclJwY0Nvbm5lY3Rpb24gPyB1bmRlZmluZWQgOiB1cmlPclJwY0Nvbm5lY3Rpb24gaW5zdGFuY2VvZiBNb25lcm9ScGNDb25uZWN0aW9uID8gdXJpT3JScGNDb25uZWN0aW9uIDogbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24odXJpT3JScGNDb25uZWN0aW9uKTtcbiAgICAgIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwic2V0RGFlbW9uQ29ubmVjdGlvblwiLCBjb25uZWN0aW9uID8gY29ubmVjdGlvbi5nZXRDb25maWcoKSA6IHVuZGVmaW5lZCk7XG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBnZXREYWVtb25Db25uZWN0aW9uKCkge1xuICAgIGxldCBycGNDb25maWcgPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldERhZW1vbkNvbm5lY3Rpb25cIik7XG4gICAgcmV0dXJuIHJwY0NvbmZpZyA/IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHJwY0NvbmZpZykgOiB1bmRlZmluZWQ7XG4gIH1cbiAgXG4gIGFzeW5jIGlzQ29ubmVjdGVkVG9EYWVtb24oKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaXNDb25uZWN0ZWRUb0RhZW1vblwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UmVzdG9yZUhlaWdodCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRSZXN0b3JlSGVpZ2h0XCIpO1xuICB9XG4gIFxuICBhc3luYyBzZXRSZXN0b3JlSGVpZ2h0KHJlc3RvcmVIZWlnaHQpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzZXRSZXN0b3JlSGVpZ2h0XCIsIFtyZXN0b3JlSGVpZ2h0XSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldERhZW1vbkhlaWdodCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXREYWVtb25IZWlnaHRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldERhZW1vbk1heFBlZXJIZWlnaHQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0RGFlbW9uTWF4UGVlckhlaWdodFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0SGVpZ2h0QnlEYXRlKHllYXIsIG1vbnRoLCBkYXkpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRIZWlnaHRCeURhdGVcIiwgW3llYXIsIG1vbnRoLCBkYXldKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNEYWVtb25TeW5jZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaXNEYWVtb25TeW5jZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEhlaWdodCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRIZWlnaHRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGFkZExpc3RlbmVyKGxpc3RlbmVyKSB7XG4gICAgbGV0IHdyYXBwZWRMaXN0ZW5lciA9IG5ldyBXYWxsZXRXb3JrZXJMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgbGV0IGxpc3RlbmVySWQgPSB3cmFwcGVkTGlzdGVuZXIuZ2V0SWQoKTtcbiAgICBMaWJyYXJ5VXRpbHMuYWRkV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvblN5bmNQcm9ncmVzc19cIiArIGxpc3RlbmVySWQsIFt3cmFwcGVkTGlzdGVuZXIub25TeW5jUHJvZ3Jlc3MsIHdyYXBwZWRMaXN0ZW5lcl0pO1xuICAgIExpYnJhcnlVdGlscy5hZGRXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uTmV3QmxvY2tfXCIgKyBsaXN0ZW5lcklkLCBbd3JhcHBlZExpc3RlbmVyLm9uTmV3QmxvY2ssIHdyYXBwZWRMaXN0ZW5lcl0pO1xuICAgIExpYnJhcnlVdGlscy5hZGRXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uQmFsYW5jZXNDaGFuZ2VkX1wiICsgbGlzdGVuZXJJZCwgW3dyYXBwZWRMaXN0ZW5lci5vbkJhbGFuY2VzQ2hhbmdlZCwgd3JhcHBlZExpc3RlbmVyXSk7XG4gICAgTGlicmFyeVV0aWxzLmFkZFdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25PdXRwdXRSZWNlaXZlZF9cIiArIGxpc3RlbmVySWQsIFt3cmFwcGVkTGlzdGVuZXIub25PdXRwdXRSZWNlaXZlZCwgd3JhcHBlZExpc3RlbmVyXSk7XG4gICAgTGlicmFyeVV0aWxzLmFkZFdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25PdXRwdXRTcGVudF9cIiArIGxpc3RlbmVySWQsIFt3cmFwcGVkTGlzdGVuZXIub25PdXRwdXRTcGVudCwgd3JhcHBlZExpc3RlbmVyXSk7XG4gICAgdGhpcy53cmFwcGVkTGlzdGVuZXJzLnB1c2god3JhcHBlZExpc3RlbmVyKTtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJhZGRMaXN0ZW5lclwiLCBbbGlzdGVuZXJJZF0pO1xuICB9XG4gIFxuICBhc3luYyByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcikge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53cmFwcGVkTGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodGhpcy53cmFwcGVkTGlzdGVuZXJzW2ldLmdldExpc3RlbmVyKCkgPT09IGxpc3RlbmVyKSB7XG4gICAgICAgIGxldCBsaXN0ZW5lcklkID0gdGhpcy53cmFwcGVkTGlzdGVuZXJzW2ldLmdldElkKCk7XG4gICAgICAgIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwicmVtb3ZlTGlzdGVuZXJcIiwgW2xpc3RlbmVySWRdKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnJlbW92ZVdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25TeW5jUHJvZ3Jlc3NfXCIgKyBsaXN0ZW5lcklkKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLnJlbW92ZVdvcmtlckNhbGxiYWNrKHRoaXMud2FsbGV0SWQsIFwib25OZXdCbG9ja19cIiArIGxpc3RlbmVySWQpO1xuICAgICAgICBMaWJyYXJ5VXRpbHMucmVtb3ZlV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvbkJhbGFuY2VzQ2hhbmdlZF9cIiArIGxpc3RlbmVySWQpO1xuICAgICAgICBMaWJyYXJ5VXRpbHMucmVtb3ZlV29ya2VyQ2FsbGJhY2sodGhpcy53YWxsZXRJZCwgXCJvbk91dHB1dFJlY2VpdmVkX1wiICsgbGlzdGVuZXJJZCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5yZW1vdmVXb3JrZXJDYWxsYmFjayh0aGlzLndhbGxldElkLCBcIm9uT3V0cHV0U3BlbnRfXCIgKyBsaXN0ZW5lcklkKTtcbiAgICAgICAgdGhpcy53cmFwcGVkTGlzdGVuZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJMaXN0ZW5lciBpcyBub3QgcmVnaXN0ZXJlZCB3aXRoIHdhbGxldFwiKTtcbiAgfVxuICBcbiAgZ2V0TGlzdGVuZXJzKCkge1xuICAgIGxldCBsaXN0ZW5lcnMgPSBbXTtcbiAgICBmb3IgKGxldCB3cmFwcGVkTGlzdGVuZXIgb2YgdGhpcy53cmFwcGVkTGlzdGVuZXJzKSBsaXN0ZW5lcnMucHVzaCh3cmFwcGVkTGlzdGVuZXIuZ2V0TGlzdGVuZXIoKSk7XG4gICAgcmV0dXJuIGxpc3RlbmVycztcbiAgfVxuICBcbiAgYXN5bmMgaXNTeW5jZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaXNTeW5jZWRcIik7XG4gIH1cbiAgXG4gIGFzeW5jIHN5bmMobGlzdGVuZXJPclN0YXJ0SGVpZ2h0PzogTW9uZXJvV2FsbGV0TGlzdGVuZXIgfCBudW1iZXIsIHN0YXJ0SGVpZ2h0PzogbnVtYmVyLCBhbGxvd0NvbmN1cnJlbnRDYWxscyA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9TeW5jUmVzdWx0PiB7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIHBhcmFtc1xuICAgIHN0YXJ0SGVpZ2h0ID0gbGlzdGVuZXJPclN0YXJ0SGVpZ2h0IGluc3RhbmNlb2YgTW9uZXJvV2FsbGV0TGlzdGVuZXIgPyBzdGFydEhlaWdodCA6IGxpc3RlbmVyT3JTdGFydEhlaWdodDtcbiAgICBsZXQgbGlzdGVuZXIgPSBsaXN0ZW5lck9yU3RhcnRIZWlnaHQgaW5zdGFuY2VvZiBNb25lcm9XYWxsZXRMaXN0ZW5lciA/IGxpc3RlbmVyT3JTdGFydEhlaWdodCA6IHVuZGVmaW5lZDtcbiAgICBpZiAoc3RhcnRIZWlnaHQgPT09IHVuZGVmaW5lZCkgc3RhcnRIZWlnaHQgPSBNYXRoLm1heChhd2FpdCB0aGlzLmdldEhlaWdodCgpLCBhd2FpdCB0aGlzLmdldFJlc3RvcmVIZWlnaHQoKSk7XG4gICAgXG4gICAgLy8gcmVnaXN0ZXIgbGlzdGVuZXIgaWYgZ2l2ZW5cbiAgICBpZiAobGlzdGVuZXIpIGF3YWl0IHRoaXMuYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIFxuICAgIC8vIHN5bmMgd2FsbGV0IGluIHdvcmtlciBcbiAgICBsZXQgZXJyO1xuICAgIGxldCByZXN1bHQ7XG4gICAgdHJ5IHtcbiAgICAgIGxldCByZXN1bHRKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJzeW5jXCIsIFtzdGFydEhlaWdodCwgYWxsb3dDb25jdXJyZW50Q2FsbHNdKTtcbiAgICAgIHJlc3VsdCA9IG5ldyBNb25lcm9TeW5jUmVzdWx0KHJlc3VsdEpzb24ubnVtQmxvY2tzRmV0Y2hlZCwgcmVzdWx0SnNvbi5yZWNlaXZlZE1vbmV5KTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBlcnIgPSBlO1xuICAgIH1cbiAgICBcbiAgICAvLyB1bnJlZ2lzdGVyIGxpc3RlbmVyXG4gICAgaWYgKGxpc3RlbmVyKSBhd2FpdCB0aGlzLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICBcbiAgICAvLyB0aHJvdyBlcnJvciBvciByZXR1cm5cbiAgICBpZiAoZXJyKSB0aHJvdyBlcnI7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuICBcbiAgYXN5bmMgc3RhcnRTeW5jaW5nKHN5bmNQZXJpb2RJbk1zKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic3RhcnRTeW5jaW5nXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgICBcbiAgYXN5bmMgc3RvcFN5bmNpbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic3RvcFN5bmNpbmdcIik7XG4gIH1cbiAgXG4gIGFzeW5jIHNjYW5UeHModHhIYXNoZXMpIHtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheSh0eEhhc2hlcyksIFwiTXVzdCBwcm92aWRlIGFuIGFycmF5IG9mIHR4cyBoYXNoZXMgdG8gc2NhblwiKTtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzY2FuVHhzXCIsIFt0eEhhc2hlc10pO1xuICB9XG4gIFxuICBhc3luYyByZXNjYW5TcGVudCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJyZXNjYW5TcGVudFwiKTtcbiAgfVxuICAgIFxuICBhc3luYyByZXNjYW5CbG9ja2NoYWluKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInJlc2NhbkJsb2NrY2hhaW5cIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEJhbGFuY2UoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkge1xuICAgIHJldHVybiBCaWdJbnQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRCYWxhbmNlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBnZXRVbmxvY2tlZEJhbGFuY2UoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkge1xuICAgIGxldCB1bmxvY2tlZEJhbGFuY2VTdHIgPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldFVubG9ja2VkQmFsYW5jZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIHJldHVybiBCaWdJbnQodW5sb2NrZWRCYWxhbmNlU3RyKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudHMoaW5jbHVkZVN1YmFkZHJlc3NlcywgdGFnKSB7XG4gICAgbGV0IGFjY291bnRzID0gW107XG4gICAgZm9yIChsZXQgYWNjb3VudEpzb24gb2YgKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0QWNjb3VudHNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSkpIHtcbiAgICAgIGFjY291bnRzLnB1c2goTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZUFjY291bnQobmV3IE1vbmVyb0FjY291bnQoYWNjb3VudEpzb24pKSk7XG4gICAgfVxuICAgIHJldHVybiBhY2NvdW50cztcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudChhY2NvdW50SWR4LCBpbmNsdWRlU3ViYWRkcmVzc2VzKSB7XG4gICAgbGV0IGFjY291bnRKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRBY2NvdW50XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuc2FuaXRpemVBY2NvdW50KG5ldyBNb25lcm9BY2NvdW50KGFjY291bnRKc29uKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNyZWF0ZUFjY291bnQobGFiZWwpIHtcbiAgICBsZXQgYWNjb3VudEpzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImNyZWF0ZUFjY291bnRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5zYW5pdGl6ZUFjY291bnQobmV3IE1vbmVyb0FjY291bnQoYWNjb3VudEpzb24pKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJbmRpY2VzKSB7XG4gICAgbGV0IHN1YmFkZHJlc3NlcyA9IFtdO1xuICAgIGZvciAobGV0IHN1YmFkZHJlc3NKc29uIG9mIChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldFN1YmFkZHJlc3Nlc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKSkge1xuICAgICAgc3ViYWRkcmVzc2VzLnB1c2goTW9uZXJvV2FsbGV0S2V5cy5zYW5pdGl6ZVN1YmFkZHJlc3MobmV3IE1vbmVyb1N1YmFkZHJlc3Moc3ViYWRkcmVzc0pzb24pKSk7XG4gICAgfVxuICAgIHJldHVybiBzdWJhZGRyZXNzZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGNyZWF0ZVN1YmFkZHJlc3MoYWNjb3VudElkeCwgbGFiZWwpIHtcbiAgICBsZXQgc3ViYWRkcmVzc0pzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImNyZWF0ZVN1YmFkZHJlc3NcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0S2V5cy5zYW5pdGl6ZVN1YmFkZHJlc3MobmV3IE1vbmVyb1N1YmFkZHJlc3Moc3ViYWRkcmVzc0pzb24pKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhzKHF1ZXJ5KSB7XG4gICAgcXVlcnkgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplVHhRdWVyeShxdWVyeSk7XG4gICAgbGV0IHJlc3BKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRUeHNcIiwgW3F1ZXJ5LmdldEJsb2NrKCkudG9Kc29uKCldKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZVR4cyhxdWVyeSwgSlNPTi5zdHJpbmdpZnkoe2Jsb2NrczogcmVzcEpzb24uYmxvY2tzfSkpOyAvLyBpbml0aWFsaXplIHR4cyBmcm9tIGJsb2NrcyBqc29uIHN0cmluZyBUT0RPOiB0aGlzIHN0cmluZ2lmaWVzIHRoZW4gdXRpbGl0eSBwYXJzZXMsIGF2b2lkXG4gIH1cbiAgXG4gIGFzeW5jIGdldFRyYW5zZmVycyhxdWVyeSkge1xuICAgIHF1ZXJ5ID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVRyYW5zZmVyUXVlcnkocXVlcnkpO1xuICAgIGxldCBibG9ja0pzb25zID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRUcmFuc2ZlcnNcIiwgW3F1ZXJ5LmdldFR4UXVlcnkoKS5nZXRCbG9jaygpLnRvSnNvbigpXSk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuZGVzZXJpYWxpemVUcmFuc2ZlcnMocXVlcnksIEpTT04uc3RyaW5naWZ5KHtibG9ja3M6IGJsb2NrSnNvbnN9KSk7IC8vIGluaXRpYWxpemUgdHJhbnNmZXJzIGZyb20gYmxvY2tzIGpzb24gc3RyaW5nIFRPRE86IHRoaXMgc3RyaW5naWZpZXMgdGhlbiB1dGlsaXR5IHBhcnNlcywgYXZvaWRcbiAgfVxuICBcbiAgYXN5bmMgZ2V0T3V0cHV0cyhxdWVyeSkge1xuICAgIHF1ZXJ5ID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZU91dHB1dFF1ZXJ5KHF1ZXJ5KTtcbiAgICBsZXQgYmxvY2tKc29ucyA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0T3V0cHV0c1wiLCBbcXVlcnkuZ2V0VHhRdWVyeSgpLmdldEJsb2NrKCkudG9Kc29uKCldKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5kZXNlcmlhbGl6ZU91dHB1dHMocXVlcnksIEpTT04uc3RyaW5naWZ5KHtibG9ja3M6IGJsb2NrSnNvbnN9KSk7IC8vIGluaXRpYWxpemUgdHJhbnNmZXJzIGZyb20gYmxvY2tzIGpzb24gc3RyaW5nIFRPRE86IHRoaXMgc3RyaW5naWZpZXMgdGhlbiB1dGlsaXR5IHBhcnNlcywgYXZvaWRcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0T3V0cHV0cyhhbGwpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJleHBvcnRPdXRwdXRzXCIsIFthbGxdKTtcbiAgfVxuICBcbiAgYXN5bmMgaW1wb3J0T3V0cHV0cyhvdXRwdXRzSGV4KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaW1wb3J0T3V0cHV0c1wiLCBbb3V0cHV0c0hleF0pO1xuICB9XG4gIFxuICBhc3luYyBleHBvcnRLZXlJbWFnZXMoYWxsKSB7XG4gICAgbGV0IGtleUltYWdlcyA9IFtdO1xuICAgIGZvciAobGV0IGtleUltYWdlSnNvbiBvZiBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldEtleUltYWdlc1wiLCBbYWxsXSkpIGtleUltYWdlcy5wdXNoKG5ldyBNb25lcm9LZXlJbWFnZShrZXlJbWFnZUpzb24pKTtcbiAgICByZXR1cm4ga2V5SW1hZ2VzO1xuICB9XG4gIFxuICBhc3luYyBpbXBvcnRLZXlJbWFnZXMoa2V5SW1hZ2VzKSB7XG4gICAgbGV0IGtleUltYWdlc0pzb24gPSBbXTtcbiAgICBmb3IgKGxldCBrZXlJbWFnZSBvZiBrZXlJbWFnZXMpIGtleUltYWdlc0pzb24ucHVzaChrZXlJbWFnZS50b0pzb24oKSk7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImltcG9ydEtleUltYWdlc1wiLCBba2V5SW1hZ2VzSnNvbl0pKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQoKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTW9uZXJvV2FsbGV0RnVsbC5nZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCgpIG5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuICBcbiAgYXN5bmMgZnJlZXplT3V0cHV0KGtleUltYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZnJlZXplT3V0cHV0XCIsIFtrZXlJbWFnZV0pO1xuICB9XG4gIFxuICBhc3luYyB0aGF3T3V0cHV0KGtleUltYWdlKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwidGhhd091dHB1dFwiLCBba2V5SW1hZ2VdKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNPdXRwdXRGcm96ZW4oa2V5SW1hZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJpc091dHB1dEZyb3plblwiLCBba2V5SW1hZ2VdKTtcbiAgfVxuXG4gIGFzeW5jIGdldERlZmF1bHRGZWVQcmlvcml0eSgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXREZWZhdWx0RmVlUHJpb3JpdHlcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGNyZWF0ZVR4cyhjb25maWcpIHtcbiAgICBjb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnKGNvbmZpZyk7XG4gICAgbGV0IHR4U2V0SnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiY3JlYXRlVHhzXCIsIFtjb25maWcudG9Kc29uKCldKTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1R4U2V0KHR4U2V0SnNvbikuZ2V0VHhzKCk7XG4gIH1cbiAgXG4gIGFzeW5jIHN3ZWVwT3V0cHV0KGNvbmZpZykge1xuICAgIGNvbmZpZyA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVTd2VlcE91dHB1dENvbmZpZyhjb25maWcpO1xuICAgIGxldCB0eFNldEpzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInN3ZWVwT3V0cHV0XCIsIFtjb25maWcudG9Kc29uKCldKTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1R4U2V0KHR4U2V0SnNvbikuZ2V0VHhzKClbMF07XG4gIH1cblxuICBhc3luYyBzd2VlcFVubG9ja2VkKGNvbmZpZykge1xuICAgIGNvbmZpZyA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVTd2VlcFVubG9ja2VkQ29uZmlnKGNvbmZpZyk7XG4gICAgbGV0IHR4U2V0c0pzb24gPSBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInN3ZWVwVW5sb2NrZWRcIiwgW2NvbmZpZy50b0pzb24oKV0pO1xuICAgIGxldCB0eHMgPSBbXTtcbiAgICBmb3IgKGxldCB0eFNldEpzb24gb2YgdHhTZXRzSnNvbikgZm9yIChsZXQgdHggb2YgbmV3IE1vbmVyb1R4U2V0KHR4U2V0SnNvbikuZ2V0VHhzKCkpIHR4cy5wdXNoKHR4KTtcbiAgICByZXR1cm4gdHhzO1xuICB9XG4gIFxuICBhc3luYyBzd2VlcER1c3QocmVsYXkpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1R4U2V0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwic3dlZXBEdXN0XCIsIFtyZWxheV0pKS5nZXRUeHMoKSB8fCBbXTtcbiAgfVxuICBcbiAgYXN5bmMgcmVsYXlUeHModHhzT3JNZXRhZGF0YXMpIHtcbiAgICBhc3NlcnQoQXJyYXkuaXNBcnJheSh0eHNPck1ldGFkYXRhcyksIFwiTXVzdCBwcm92aWRlIGFuIGFycmF5IG9mIHR4cyBvciB0aGVpciBtZXRhZGF0YSB0byByZWxheVwiKTtcbiAgICBsZXQgdHhNZXRhZGF0YXMgPSBbXTtcbiAgICBmb3IgKGxldCB0eE9yTWV0YWRhdGEgb2YgdHhzT3JNZXRhZGF0YXMpIHR4TWV0YWRhdGFzLnB1c2godHhPck1ldGFkYXRhIGluc3RhbmNlb2YgTW9uZXJvVHhXYWxsZXQgPyB0eE9yTWV0YWRhdGEuZ2V0TWV0YWRhdGEoKSA6IHR4T3JNZXRhZGF0YSk7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwicmVsYXlUeHNcIiwgW3R4TWV0YWRhdGFzXSk7XG4gIH1cbiAgXG4gIGFzeW5jIGRlc2NyaWJlVHhTZXQodHhTZXQpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1R4U2V0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGVzY3JpYmVUeFNldFwiLCBbdHhTZXQudG9Kc29uKCldKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNpZ25UeHModW5zaWduZWRUeEhleCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvVHhTZXQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJzaWduVHhzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBzdWJtaXRUeHMoc2lnbmVkVHhIZXgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzdWJtaXRUeHNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgc2lnbk1lc3NhZ2UobWVzc2FnZSwgc2lnbmF0dXJlVHlwZSwgYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInNpZ25NZXNzYWdlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHZlcmlmeU1lc3NhZ2UobWVzc2FnZSwgYWRkcmVzcywgc2lnbmF0dXJlKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwidmVyaWZ5TWVzc2FnZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhLZXkodHhIYXNoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0VHhLZXlcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgY2hlY2tUeEtleSh0eEhhc2gsIHR4S2V5LCBhZGRyZXNzKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9DaGVja1R4KGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiY2hlY2tUeEtleVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0VHhQcm9vZih0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRUeFByb29mXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrVHhQcm9vZih0eEhhc2gsIGFkZHJlc3MsIG1lc3NhZ2UsIHNpZ25hdHVyZSkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvQ2hlY2tUeChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImNoZWNrVHhQcm9vZlwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U3BlbmRQcm9vZih0eEhhc2gsIG1lc3NhZ2UpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRTcGVuZFByb29mXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGNoZWNrU3BlbmRQcm9vZih0eEhhc2gsIG1lc3NhZ2UsIHNpZ25hdHVyZSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImNoZWNrU3BlbmRQcm9vZlwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRSZXNlcnZlUHJvb2ZXYWxsZXQobWVzc2FnZSkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldFJlc2VydmVQcm9vZldhbGxldFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRSZXNlcnZlUHJvb2ZBY2NvdW50KGFjY291bnRJZHgsIGFtb3VudCwgbWVzc2FnZSkge1xuICAgIHRyeSB7IHJldHVybiBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldFJlc2VydmVQcm9vZkFjY291bnRcIiwgW2FjY291bnRJZHgsIGFtb3VudC50b1N0cmluZygpLCBtZXNzYWdlXSk7IH1cbiAgICBjYXRjaCAoZTogYW55KSB7IHRocm93IG5ldyBNb25lcm9FcnJvcihlLm1lc3NhZ2UsIC0xKTsgfVxuICB9XG5cbiAgYXN5bmMgY2hlY2tSZXNlcnZlUHJvb2YoYWRkcmVzcywgbWVzc2FnZSwgc2lnbmF0dXJlKSB7XG4gICAgdHJ5IHsgcmV0dXJuIG5ldyBNb25lcm9DaGVja1Jlc2VydmUoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJjaGVja1Jlc2VydmVQcm9vZlwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTsgfVxuICAgIGNhdGNoIChlOiBhbnkpIHsgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGUubWVzc2FnZSwgLTEpOyB9XG4gIH1cbiAgXG4gIGFzeW5jIGdldFR4Tm90ZXModHhIYXNoZXMpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRUeE5vdGVzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNldFR4Tm90ZXModHhIYXNoZXMsIG5vdGVzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic2V0VHhOb3Rlc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRBZGRyZXNzQm9va0VudHJpZXMoZW50cnlJbmRpY2VzKSB7XG4gICAgaWYgKCFlbnRyeUluZGljZXMpIGVudHJ5SW5kaWNlcyA9IFtdO1xuICAgIGxldCBlbnRyaWVzID0gW107XG4gICAgZm9yIChsZXQgZW50cnlKc29uIG9mIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpIHtcbiAgICAgIGVudHJpZXMucHVzaChuZXcgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeShlbnRyeUpzb24pKTtcbiAgICB9XG4gICAgcmV0dXJuIGVudHJpZXM7XG4gIH1cbiAgXG4gIGFzeW5jIGFkZEFkZHJlc3NCb29rRW50cnkoYWRkcmVzcywgZGVzY3JpcHRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJhZGRBZGRyZXNzQm9va0VudHJ5XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGVkaXRBZGRyZXNzQm9va0VudHJ5KGluZGV4LCBzZXRBZGRyZXNzLCBhZGRyZXNzLCBzZXREZXNjcmlwdGlvbiwgZGVzY3JpcHRpb24pIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJlZGl0QWRkcmVzc0Jvb2tFbnRyeVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBkZWxldGVBZGRyZXNzQm9va0VudHJ5KGVudHJ5SWR4KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyB0YWdBY2NvdW50cyh0YWcsIGFjY291bnRJbmRpY2VzKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwidGFnQWNjb3VudHNcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuXG4gIGFzeW5jIHVudGFnQWNjb3VudHMoYWNjb3VudEluZGljZXMpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJ1bnRhZ0FjY291bnRzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFjY291bnRUYWdzKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldEFjY291bnRUYWdzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cblxuICBhc3luYyBzZXRBY2NvdW50VGFnTGFiZWwodGFnLCBsYWJlbCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInNldEFjY291bnRUYWdMYWJlbFwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBnZXRQYXltZW50VXJpKGNvbmZpZykge1xuICAgIGNvbmZpZyA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVDcmVhdGVUeHNDb25maWcoY29uZmlnKTtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRQYXltZW50VXJpXCIsIFtjb25maWcudG9Kc29uKCldKTtcbiAgfVxuICBcbiAgYXN5bmMgcGFyc2VQYXltZW50VXJpKHVyaSkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvVHhDb25maWcoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJwYXJzZVBheW1lbnRVcmlcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEF0dHJpYnV0ZShrZXkpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRBdHRyaWJ1dGVcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgc2V0QXR0cmlidXRlKGtleSwgdmFsKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwic2V0QXR0cmlidXRlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHN0YXJ0TWluaW5nKG51bVRocmVhZHMsIGJhY2tncm91bmRNaW5pbmcsIGlnbm9yZUJhdHRlcnkpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzdGFydE1pbmluZ1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICB9XG4gIFxuICBhc3luYyBzdG9wTWluaW5nKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcInN0b3BNaW5pbmdcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJpc011bHRpc2lnSW1wb3J0TmVlZGVkXCIpO1xuICB9XG4gIFxuICBhc3luYyBpc011bHRpc2lnKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImlzTXVsdGlzaWdcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldE11bHRpc2lnSW5mbygpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb011bHRpc2lnSW5mbyhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldE11bHRpc2lnSW5mb1wiKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHByZXBhcmVNdWx0aXNpZygpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJwcmVwYXJlTXVsdGlzaWdcIik7XG4gIH1cbiAgXG4gIGFzeW5jIG1ha2VNdWx0aXNpZyhtdWx0aXNpZ0hleGVzLCB0aHJlc2hvbGQsIHBhc3N3b3JkKSB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwibWFrZU11bHRpc2lnXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGV4Y2hhbmdlTXVsdGlzaWdLZXlzKG11bHRpc2lnSGV4ZXMsIHBhc3N3b3JkKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJleGNoYW5nZU11bHRpc2lnS2V5c1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZXhwb3J0TXVsdGlzaWdIZXgoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZXhwb3J0TXVsdGlzaWdIZXhcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGltcG9ydE11bHRpc2lnSGV4KG11bHRpc2lnSGV4ZXMsIHJlZnJlc2hBZnRlckltcG9ydCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImltcG9ydE11bHRpc2lnSGV4XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIHNpZ25NdWx0aXNpZ1R4SGV4KG11bHRpc2lnVHhIZXgpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb011bHRpc2lnU2lnblJlc3VsdChhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcInNpZ25NdWx0aXNpZ1R4SGV4XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBzdWJtaXRNdWx0aXNpZ1R4SGV4KHNpZ25lZE11bHRpc2lnVHhIZXgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJzdWJtaXRNdWx0aXNpZ1R4SGV4XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldERhdGEoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0RGF0YVwiKTtcbiAgfVxuICBcbiAgYXN5bmMgbW92ZVRvKHBhdGgpIHtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5tb3ZlVG8ocGF0aCwgdGhpcyk7XG4gIH1cbiAgXG4gIGFzeW5jIGNoYW5nZVBhc3N3b3JkKG9sZFBhc3N3b3JkLCBuZXdQYXNzd29yZCkge1xuICAgIGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiY2hhbmdlUGFzc3dvcmRcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgICBpZiAodGhpcy5wYXRoKSBhd2FpdCB0aGlzLnNhdmUoKTsgLy8gYXV0byBzYXZlXG4gIH1cbiAgXG4gIGFzeW5jIHNhdmUoKSB7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuc2F2ZSh0aGlzKTtcbiAgfVxuXG4gIGFzeW5jIGNsb3NlKHNhdmUpIHtcbiAgICBpZiAoYXdhaXQgdGhpcy5pc0Nsb3NlZCgpKSByZXR1cm47XG4gICAgaWYgKHNhdmUpIGF3YWl0IHRoaXMuc2F2ZSgpO1xuICAgIHdoaWxlICh0aGlzLndyYXBwZWRMaXN0ZW5lcnMubGVuZ3RoKSBhd2FpdCB0aGlzLnJlbW92ZUxpc3RlbmVyKHRoaXMud3JhcHBlZExpc3RlbmVyc1swXS5nZXRMaXN0ZW5lcigpKTtcbiAgICBhd2FpdCBzdXBlci5jbG9zZShmYWxzZSk7XG4gIH1cbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gTElTVEVOSU5HIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vKipcbiAqIFJlY2VpdmVzIG5vdGlmaWNhdGlvbnMgZGlyZWN0bHkgZnJvbSB3YXNtIGMrKy5cbiAqIFxuICogQHByaXZhdGVcbiAqL1xuY2xhc3MgV2FsbGV0V2FzbUxpc3RlbmVyIHtcblxuICBwcm90ZWN0ZWQgd2FsbGV0OiBNb25lcm9XYWxsZXQ7XG4gIFxuICBjb25zdHJ1Y3Rvcih3YWxsZXQpIHtcbiAgICB0aGlzLndhbGxldCA9IHdhbGxldDtcbiAgfVxuICBcbiAgYXN5bmMgb25TeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSkge1xuICAgIGF3YWl0IHRoaXMud2FsbGV0LmFubm91bmNlU3luY1Byb2dyZXNzKGhlaWdodCwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgcGVyY2VudERvbmUsIG1lc3NhZ2UpO1xuICB9XG4gIFxuICBhc3luYyBvbk5ld0Jsb2NrKGhlaWdodCkge1xuICAgIGF3YWl0IHRoaXMud2FsbGV0LmFubm91bmNlTmV3QmxvY2soaGVpZ2h0KTtcbiAgfVxuICBcbiAgYXN5bmMgb25CYWxhbmNlc0NoYW5nZWQobmV3QmFsYW5jZVN0ciwgbmV3VW5sb2NrZWRCYWxhbmNlU3RyKSB7XG4gICAgYXdhaXQgdGhpcy53YWxsZXQuYW5ub3VuY2VCYWxhbmNlc0NoYW5nZWQobmV3QmFsYW5jZVN0ciwgbmV3VW5sb2NrZWRCYWxhbmNlU3RyKTtcbiAgfVxuICBcbiAgYXN5bmMgb25PdXRwdXRSZWNlaXZlZChoZWlnaHQsIHR4SGFzaCwgYW1vdW50U3RyLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4LCB2ZXJzaW9uLCB1bmxvY2tUaW1lLCBpc0xvY2tlZCkge1xuICAgIFxuICAgIC8vIGJ1aWxkIHJlY2VpdmVkIG91dHB1dFxuICAgIGxldCBvdXRwdXQgPSBuZXcgTW9uZXJvT3V0cHV0V2FsbGV0KCk7XG4gICAgb3V0cHV0LnNldEFtb3VudChCaWdJbnQoYW1vdW50U3RyKSk7XG4gICAgb3V0cHV0LnNldEFjY291bnRJbmRleChhY2NvdW50SWR4KTtcbiAgICBvdXRwdXQuc2V0U3ViYWRkcmVzc0luZGV4KHN1YmFkZHJlc3NJZHgpO1xuICAgIGxldCB0eCA9IG5ldyBNb25lcm9UeFdhbGxldCgpO1xuICAgIHR4LnNldEhhc2godHhIYXNoKTtcbiAgICB0eC5zZXRWZXJzaW9uKHZlcnNpb24pO1xuICAgIHR4LnNldFVubG9ja1RpbWUodW5sb2NrVGltZSk7XG4gICAgb3V0cHV0LnNldFR4KHR4KTtcbiAgICB0eC5zZXRPdXRwdXRzKFtvdXRwdXRdKTtcbiAgICB0eC5zZXRJc0luY29taW5nKHRydWUpO1xuICAgIHR4LnNldElzTG9ja2VkKGlzTG9ja2VkKTtcbiAgICBpZiAoaGVpZ2h0ID4gMCkge1xuICAgICAgbGV0IGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKCkuc2V0SGVpZ2h0KGhlaWdodCk7XG4gICAgICBibG9jay5zZXRUeHMoW3R4IGFzIE1vbmVyb1R4XSk7XG4gICAgICB0eC5zZXRCbG9jayhibG9jayk7XG4gICAgICB0eC5zZXRJc0NvbmZpcm1lZCh0cnVlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKGZhbHNlKTtcbiAgICAgIHR4LnNldElzRmFpbGVkKGZhbHNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdHguc2V0SXNDb25maXJtZWQoZmFsc2UpO1xuICAgICAgdHguc2V0SW5UeFBvb2wodHJ1ZSk7XG4gICAgfVxuICAgIFxuICAgIC8vIGFubm91bmNlIG91dHB1dFxuICAgIGF3YWl0IHRoaXMud2FsbGV0LmFubm91bmNlT3V0cHV0UmVjZWl2ZWQob3V0cHV0KTtcbiAgfVxuICBcbiAgYXN5bmMgb25PdXRwdXRTcGVudChoZWlnaHQsIHR4SGFzaCwgYW1vdW50U3RyLCBhY2NvdW50SWR4U3RyLCBzdWJhZGRyZXNzSWR4U3RyLCB2ZXJzaW9uLCB1bmxvY2tUaW1lLCBpc0xvY2tlZCkge1xuICAgIFxuICAgIC8vIGJ1aWxkIHNwZW50IG91dHB1dFxuICAgIGxldCBvdXRwdXQgPSBuZXcgTW9uZXJvT3V0cHV0V2FsbGV0KCk7XG4gICAgb3V0cHV0LnNldEFtb3VudChCaWdJbnQoYW1vdW50U3RyKSk7XG4gICAgaWYgKGFjY291bnRJZHhTdHIpIG91dHB1dC5zZXRBY2NvdW50SW5kZXgocGFyc2VJbnQoYWNjb3VudElkeFN0cikpO1xuICAgIGlmIChzdWJhZGRyZXNzSWR4U3RyKSBvdXRwdXQuc2V0U3ViYWRkcmVzc0luZGV4KHBhcnNlSW50KHN1YmFkZHJlc3NJZHhTdHIpKTtcbiAgICBsZXQgdHggPSBuZXcgTW9uZXJvVHhXYWxsZXQoKTtcbiAgICB0eC5zZXRIYXNoKHR4SGFzaCk7XG4gICAgdHguc2V0VmVyc2lvbih2ZXJzaW9uKTtcbiAgICB0eC5zZXRVbmxvY2tUaW1lKHVubG9ja1RpbWUpO1xuICAgIHR4LnNldElzTG9ja2VkKGlzTG9ja2VkKTtcbiAgICBvdXRwdXQuc2V0VHgodHgpO1xuICAgIHR4LnNldElucHV0cyhbb3V0cHV0XSk7XG4gICAgaWYgKGhlaWdodCA+IDApIHtcbiAgICAgIGxldCBibG9jayA9IG5ldyBNb25lcm9CbG9jaygpLnNldEhlaWdodChoZWlnaHQpO1xuICAgICAgYmxvY2suc2V0VHhzKFt0eF0pO1xuICAgICAgdHguc2V0QmxvY2soYmxvY2spO1xuICAgICAgdHguc2V0SXNDb25maXJtZWQodHJ1ZSk7XG4gICAgICB0eC5zZXRJblR4UG9vbChmYWxzZSk7XG4gICAgICB0eC5zZXRJc0ZhaWxlZChmYWxzZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHR4LnNldElzQ29uZmlybWVkKGZhbHNlKTtcbiAgICAgIHR4LnNldEluVHhQb29sKHRydWUpO1xuICAgIH1cbiAgICBcbiAgICAvLyBhbm5vdW5jZSBvdXRwdXRcbiAgICBhd2FpdCB0aGlzLndhbGxldC5hbm5vdW5jZU91dHB1dFNwZW50KG91dHB1dCk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnRlcm5hbCBsaXN0ZW5lciB0byBicmlkZ2Ugbm90aWZpY2F0aW9ucyB0byBleHRlcm5hbCBsaXN0ZW5lcnMuXG4gKiBcbiAqIEBwcml2YXRlXG4gKi9cbmNsYXNzIFdhbGxldFdvcmtlckxpc3RlbmVyIHtcblxuICBwcm90ZWN0ZWQgaWQ6IGFueTtcbiAgcHJvdGVjdGVkIGxpc3RlbmVyOiBhbnk7XG4gIFxuICBjb25zdHJ1Y3RvcihsaXN0ZW5lcikge1xuICAgIHRoaXMuaWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgdGhpcy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB9XG4gIFxuICBnZXRJZCgpIHtcbiAgICByZXR1cm4gdGhpcy5pZDtcbiAgfVxuICBcbiAgZ2V0TGlzdGVuZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMubGlzdGVuZXI7XG4gIH1cbiAgXG4gIG9uU3luY1Byb2dyZXNzKGhlaWdodCwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgcGVyY2VudERvbmUsIG1lc3NhZ2UpIHtcbiAgICB0aGlzLmxpc3RlbmVyLm9uU3luY1Byb2dyZXNzKGhlaWdodCwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgcGVyY2VudERvbmUsIG1lc3NhZ2UpO1xuICB9XG5cbiAgYXN5bmMgb25OZXdCbG9jayhoZWlnaHQpIHtcbiAgICBhd2FpdCB0aGlzLmxpc3RlbmVyLm9uTmV3QmxvY2soaGVpZ2h0KTtcbiAgfVxuICBcbiAgYXN5bmMgb25CYWxhbmNlc0NoYW5nZWQobmV3QmFsYW5jZVN0ciwgbmV3VW5sb2NrZWRCYWxhbmNlU3RyKSB7XG4gICAgYXdhaXQgdGhpcy5saXN0ZW5lci5vbkJhbGFuY2VzQ2hhbmdlZChCaWdJbnQobmV3QmFsYW5jZVN0ciksIEJpZ0ludChuZXdVbmxvY2tlZEJhbGFuY2VTdHIpKTtcbiAgfVxuXG4gIGFzeW5jIG9uT3V0cHV0UmVjZWl2ZWQoYmxvY2tKc29uKSB7XG4gICAgbGV0IGJsb2NrID0gbmV3IE1vbmVyb0Jsb2NrKGJsb2NrSnNvbiwgTW9uZXJvQmxvY2suRGVzZXJpYWxpemF0aW9uVHlwZS5UWF9XQUxMRVQpO1xuICAgIGF3YWl0IHRoaXMubGlzdGVuZXIub25PdXRwdXRSZWNlaXZlZChibG9jay5nZXRUeHMoKVswXS5nZXRPdXRwdXRzKClbMF0pO1xuICB9XG4gIFxuICBhc3luYyBvbk91dHB1dFNwZW50KGJsb2NrSnNvbikge1xuICAgIGxldCBibG9jayA9IG5ldyBNb25lcm9CbG9jayhibG9ja0pzb24sIE1vbmVyb0Jsb2NrLkRlc2VyaWFsaXphdGlvblR5cGUuVFhfV0FMTEVUKTtcbiAgICBhd2FpdCB0aGlzLmxpc3RlbmVyLm9uT3V0cHV0U3BlbnQoYmxvY2suZ2V0VHhzKClbMF0uZ2V0SW5wdXRzKClbMF0pO1xuICB9XG59XG4iXSwibWFwcGluZ3MiOiJ5TEFBQSxJQUFBQSxPQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxLQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxTQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRyxhQUFBLEdBQUFKLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSSxXQUFBLEdBQUFMLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSyxjQUFBLEdBQUFOLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTSxpQkFBQSxHQUFBUCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQU8s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