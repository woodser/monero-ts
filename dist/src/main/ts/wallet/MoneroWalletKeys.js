"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.MoneroWalletKeysProxy = exports.MoneroWalletKeys = void 0;var _assert = _interopRequireDefault(require("assert"));
var _GenUtils = _interopRequireDefault(require("../common/GenUtils"));
var _LibraryUtils = _interopRequireDefault(require("../common/LibraryUtils"));

var _MoneroError = _interopRequireDefault(require("../common/MoneroError"));
var _MoneroIntegratedAddress = _interopRequireDefault(require("./model/MoneroIntegratedAddress"));
var _MoneroNetworkType = _interopRequireDefault(require("../daemon/model/MoneroNetworkType"));
var _MoneroSubaddress = _interopRequireDefault(require("./model/MoneroSubaddress"));
var _MoneroVersion = _interopRequireDefault(require("../daemon/model/MoneroVersion"));
var _MoneroWallet = _interopRequireDefault(require("./MoneroWallet"));
var _MoneroWalletConfig = _interopRequireDefault(require("./model/MoneroWalletConfig"));


/**
 * Implements a MoneroWallet which only manages keys using WebAssembly.
 */
class MoneroWalletKeys extends _MoneroWallet.default {

  // instance variables




  closeCompleted = false;

  // --------------------------- STATIC UTILITIES -----------------------------

  /**
   * <p>Create a wallet using WebAssembly bindings to monero-project.</p>
   * 
   * <p>Example:</p>
   * 
   * <code>
   * let wallet = await MoneroWalletKeys.createWallet({<br>
   * &nbsp;&nbsp; password: "abc123",<br>
   * &nbsp;&nbsp; networkType: MoneroNetworkType.STAGENET,<br>
   * &nbsp;&nbsp; seed: "coexist igloo pamphlet lagoon..."<br>
   * });
   * </code>
   * 
   * @param {MoneroWalletConfig} config - MoneroWalletConfig or equivalent config object
   * @param {string|number} config.networkType - network type of the wallet to create (one of "mainnet", "testnet", "stagenet" or MoneroNetworkType.MAINNET|TESTNET|STAGENET)
   * @param {string} [config.seed] - seed of the wallet to create (optional, random wallet created if neither seed nor keys given)
   * @param {string} [config.seedOffset] - the offset used to derive a new seed from the given seed to recover a secret wallet from the seed phrase
   * @param {string} [config.primaryAddress] - primary address of the wallet to create (only provide if restoring from keys)
   * @param {string} [config.privateViewKey] - private view key of the wallet to create (optional)
   * @param {string} [config.privateSpendKey] - private spend key of the wallet to create (optional)
   * @param {string} [config.language] - language of the wallet's seed (defaults to "English" or auto-detected)
   * @return {MoneroWalletKeys} the created wallet
   */
  static async createWallet(config) {

    // normalize and validate config
    if (config === undefined) throw new _MoneroError.default("Must provide config to create wallet");
    config = config instanceof _MoneroWalletConfig.default ? config : new _MoneroWalletConfig.default(config);
    if (config.getSeed() !== undefined && (config.getPrimaryAddress() !== undefined || config.getPrivateViewKey() !== undefined || config.getPrivateSpendKey() !== undefined)) {
      throw new _MoneroError.default("Wallet may be initialized with a seed or keys but not both");
    }
    if (config.getNetworkType() === undefined) throw new _MoneroError.default("Must provide a networkType: 'mainnet', 'testnet' or 'stagenet'");
    if (config.getSaveCurrent() === true) throw new _MoneroError.default("Cannot save current wallet when creating keys-only wallet");

    // initialize proxied wallet if configured
    if (config.getProxyToWorker() === undefined) config.setProxyToWorker(true);
    if (config.getProxyToWorker()) {
      let walletProxy = await MoneroWalletKeysProxy.createWallet(config);;
      return new MoneroWalletKeys(undefined, walletProxy);
    }

    // disallow server connection
    if (config.getServer() !== undefined) throw new _MoneroError.default("Cannot initialize keys wallet with server connection");

    // create wallet
    if (config.getSeed() !== undefined) return MoneroWalletKeys.createWalletFromSeed(config);else
    if (config.getPrivateSpendKey() !== undefined || config.getPrimaryAddress() !== undefined) return MoneroWalletKeys.createWalletFromKeys(config);else
    return MoneroWalletKeys.createWalletRandom(config);
  }

  static async createWalletRandom(config) {

    // validate and sanitize params
    config = config.copy();
    if (config.getSeedOffset() !== undefined) throw new _MoneroError.default("Cannot provide seedOffset when creating random wallet");
    if (config.getRestoreHeight() !== undefined) throw new _MoneroError.default("Cannot provide restoreHeight when creating random wallet");
    _MoneroNetworkType.default.validate(config.getNetworkType());
    if (config.getLanguage() === undefined) config.setLanguage("English");

    // load wasm module
    let module = await _LibraryUtils.default.loadWasmModule();

    // queue call to wasm module
    return module.queueTask(async () => {
      return new Promise((resolve, reject) => {

        // create wallet in wasm which invokes callback when done
        module.create_keys_wallet_random(JSON.stringify(config.toJson()), (cppAddress) => {
          if (typeof cppAddress === "string") reject(new _MoneroError.default(cppAddress));else
          resolve(new MoneroWalletKeys(cppAddress));
        });
      });
    });
  }

  static async createWalletFromSeed(config) {

    // validate and sanitize params
    _MoneroNetworkType.default.validate(config.getNetworkType());
    if (config.getSeed() === undefined) throw Error("Must define seed to create wallet from");
    if (config.getSeedOffset() === undefined) config.setSeedOffset("");
    if (config.getLanguage() !== undefined) throw new _MoneroError.default("Cannot provide language when creating wallet from seed");

    // load wasm module
    let module = await _LibraryUtils.default.loadWasmModule();

    // queue call to wasm module
    return module.queueTask(async () => {
      return new Promise((resolve, reject) => {

        // create wallet in wasm which invokes callback when done
        module.create_keys_wallet_from_seed(JSON.stringify(config.toJson()), (cppAddress) => {
          if (typeof cppAddress === "string") reject(new _MoneroError.default(cppAddress));else
          resolve(new MoneroWalletKeys(cppAddress));
        });
      });
    });
  }

  static async createWalletFromKeys(config) {

    // validate and sanitize params
    if (config.getSeedOffset() !== undefined) throw new _MoneroError.default("Cannot provide seedOffset when creating wallet from keys");
    _MoneroNetworkType.default.validate(config.getNetworkType());
    if (config.getPrimaryAddress() === undefined) config.setPrimaryAddress("");
    if (config.getPrivateViewKey() === undefined) config.setPrivateViewKey("");
    if (config.getPrivateSpendKey() === undefined) config.setPrivateSpendKey("");
    if (config.getLanguage() === undefined) config.setLanguage("English");

    // load wasm module
    let module = await _LibraryUtils.default.loadWasmModule();

    // queue call to wasm module
    return module.queueTask(async () => {
      return new Promise((resolve, reject) => {

        // create wallet in wasm which invokes callback when done
        module.create_keys_wallet_from_keys(JSON.stringify(config.toJson()), (cppAddress) => {
          if (typeof cppAddress === "string") reject(new _MoneroError.default(cppAddress));else
          resolve(new MoneroWalletKeys(cppAddress));
        });
      });
    });
  }

  static async getSeedLanguages() {
    let module = await _LibraryUtils.default.loadWasmModule();
    return module.queueTask(async () => {
      return JSON.parse(module.get_keys_wallet_seed_languages()).languages;
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
   * @param {number} cppAddress - address of the wallet instance in C++
   * @param {MoneroWalletKeysProxy} walletProxy - proxy
   * 
   * @private
   */
  constructor(cppAddress, walletProxy) {
    super();
    if (!cppAddress && !walletProxy) throw new _MoneroError.default("Must provide cppAddress or walletProxy");
    if (walletProxy) this.walletProxy = walletProxy;else
    {
      this.cppAddress = cppAddress;
      this.module = _LibraryUtils.default.getWasmModule();
      if (!this.module.create_full_wallet) throw new _MoneroError.default("WASM module not loaded - create wallet instance using static utilities"); // static utilites pre-load wasm module
    }
  }

  async isViewOnly() {
    if (this.getWalletProxy()) return this.getWalletProxy().isViewOnly();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return this.module.is_view_only(this.cppAddress);
    });
  }

  async isConnectedToDaemon() {
    if (this.getWalletProxy()) return this.getWalletProxy().isConnectedToDaemon();
    return false;
  }

  async getVersion() {
    if (this.getWalletProxy()) return this.getWalletProxy().getVersion();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let versionStr = this.module.get_version(this.cppAddress);
      let versionJson = JSON.parse(versionStr);
      return new _MoneroVersion.default(versionJson.number, versionJson.isRelease);
    });
  }

  /**
   * @ignore
   */
  getPath() {
    throw new _MoneroError.default("MoneroWalletKeys does not support a persisted path");
  }

  async getSeed() {
    if (this.getWalletProxy()) return this.getWalletProxy().getSeed();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let resp = this.module.get_seed(this.cppAddress);
      const errorStr = "error: ";
      if (resp.indexOf(errorStr) === 0) throw new _MoneroError.default(resp.substring(errorStr.length));
      return resp ? resp : undefined;
    });
  }

  async getSeedLanguage() {
    if (this.getWalletProxy()) return this.getWalletProxy().getSeedLanguage();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let resp = this.module.get_seed_language(this.cppAddress);
      let errorKey = "error: ";
      if (resp.indexOf(errorKey) === 0) throw new _MoneroError.default(resp.substring(errorKey.length));
      return resp ? resp : undefined;
    });
  }

  async getPrivateSpendKey() {
    if (this.getWalletProxy()) return this.getWalletProxy().getPrivateSpendKey();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let resp = this.module.get_private_spend_key(this.cppAddress);
      let errorKey = "error: ";
      if (resp.indexOf(errorKey) === 0) throw new _MoneroError.default(resp.substring(errorKey.length));
      return resp ? resp : undefined;
    });
  }

  async getPrivateViewKey() {
    if (this.getWalletProxy()) return this.getWalletProxy().getPrivateViewKey();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let resp = this.module.get_private_view_key(this.cppAddress);
      let errorKey = "error: ";
      if (resp.indexOf(errorKey) === 0) throw new _MoneroError.default(resp.substring(errorKey.length));
      return resp ? resp : undefined;
    });
  }

  async getPublicViewKey() {
    if (this.getWalletProxy()) return this.getWalletProxy().getPublicViewKey();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let resp = this.module.get_public_view_key(this.cppAddress);
      let errorKey = "error: ";
      if (resp.indexOf(errorKey) === 0) throw new _MoneroError.default(resp.substring(errorKey.length));
      return resp ? resp : undefined;
    });
  }

  async getPublicSpendKey() {
    if (this.getWalletProxy()) return this.getWalletProxy().getPublicSpendKey();
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let resp = this.module.get_public_spend_key(this.cppAddress);
      let errorKey = "error: ";
      if (resp.indexOf(errorKey) === 0) throw new _MoneroError.default(resp.substring(errorKey.length));
      return resp ? resp : undefined;
    });
  }

  async getAddress(accountIdx, subaddressIdx) {
    if (this.getWalletProxy()) return this.getWalletProxy().getAddress(accountIdx, subaddressIdx);
    (0, _assert.default)(typeof accountIdx === "number");
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      return this.module.get_address(this.cppAddress, accountIdx, subaddressIdx);
    });
  }

  async getAddressIndex(address) {
    if (this.getWalletProxy()) return this.getWalletProxy().getAddressIndex(address);
    return this.module.queueTask(async () => {
      this.assertNotClosed();
      let resp = this.module.get_address_index(this.cppAddress, address);
      if (resp.charAt(0) !== '{') throw new _MoneroError.default(resp);
      return new _MoneroSubaddress.default(JSON.parse(resp));
    });
  }

  async getAccounts(includeSubaddresses, tag) {
    if (this.getWalletProxy()) return this.getWalletProxy().getAccounts();
    throw new _MoneroError.default("MoneroWalletKeys does not support getting an enumerable set of accounts; query specific accounts");
  }

  // getIntegratedAddress(paymentId)  // TODO
  // decodeIntegratedAddress

  async close(save = false) {
    if (this.closePromise) return this.closePromise;
    if (this.closeCompleted) return;
    this.closePromise = this.closeInternal(save);
    try {
      await this.closePromise;
      this.closeCompleted = true;
    } finally {
      this.closePromise = undefined; // keep native resources available for retry after failure
    }
  }

  async closeInternal(save, listenerHandle = 0) {
    if (this.connectionManager && this.connectionManager.getListeners().includes(this.connectionManagerListener)) this.connectionManager.removeListener(this.connectionManagerListener);
    this.connectionManager = undefined;
    this.connectionManagerListener = undefined;
    if (this.walletProxy) {
      this._isClosed = true;
      await this.walletProxy.close(save);
    } else {
      if (save) await this.save();
      this._isClosed = true;
      await this.module.queueTask(async () => {
        return new Promise((resolve, reject) => {
          this.module.close(this.cppAddress, false, listenerHandle, (errMsg) => {// saving handled external to webassembly
            if (errMsg) reject(new _MoneroError.default(errMsg));else
            {
              delete this.cppAddress;
              resolve();
            }
          });
        });
      });
    }
    await super.close();
  }

  async isClosed() {
    return this._isClosed;
  }

  // ----------- ADD JSDOC FOR SUPPORTED DEFAULT IMPLEMENTATIONS --------------

  async getPrimaryAddress() {return super.getPrimaryAddress();}
  async getSubaddress(accountIdx, subaddressIdx) {return super.getSubaddress(accountIdx, subaddressIdx);}

  // ----------------------------- PRIVATE HELPERS ----------------------------

  static sanitizeSubaddress(subaddress) {
    if (subaddress.getLabel() === "") subaddress.setLabel(undefined);
    return subaddress;
  }

  assertNotClosed() {
    if (this._isClosed) throw new _MoneroError.default("Wallet is closed");
  }

  getWalletProxy() {
    this.assertNotClosed();
    return this.walletProxy;
  }
}

/**
 * Implements a MoneroWallet by proxying requests to a worker which runs a keys-only wallet.
 * 
 * TODO: sort these methods according to master sort in MoneroWallet.ts
 * TODO: probably only allow one listener to worker then propogate to registered listeners for performance
 * 
 * @private
 */exports.MoneroWalletKeys = MoneroWalletKeys;
class MoneroWalletKeysProxy extends _MoneroWallet.default {

  // state variables



  // -------------------------- WALLET STATIC UTILS ---------------------------

  static async createWallet(config) {
    let walletId = _GenUtils.default.getUUID();
    await _LibraryUtils.default.invokeWorker(walletId, "createWalletKeys", [config.toJson()]);
    return new MoneroWalletKeysProxy(walletId, await _LibraryUtils.default.getWorker());
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
   * 
   * @protected
   */
  constructor(walletId, worker) {
    super();
    this.walletId = walletId;
    this.worker = worker;
  }

  async isViewOnly() {
    return this.invokeWorker("isViewOnly");
  }

  async getVersion() {
    throw new _MoneroError.default("Not implemented");
  }

  async getSeed() {
    return this.invokeWorker("getSeed");
  }

  async getSeedLanguage() {
    return this.invokeWorker("getSeedLanguage");
  }

  async getSeedLanguages() {
    return this.invokeWorker("getSeedLanguages");
  }

  async getPrivateSpendKey() {
    return this.invokeWorker("getPrivateSpendKey");
  }

  async getPrivateViewKey() {
    return this.invokeWorker("getPrivateViewKey");
  }

  async getPublicViewKey() {
    return this.invokeWorker("getPublicViewKey");
  }

  async getPublicSpendKey() {
    return this.invokeWorker("getPublicSpendKey");
  }

  async getAddress(accountIdx, subaddressIdx) {
    return this.invokeWorker("getAddress", Array.from(arguments));
  }

  async getAddressIndex(address) {
    let subaddressJson = await this.invokeWorker("getAddressIndex", Array.from(arguments));
    return MoneroWalletKeys.sanitizeSubaddress(new _MoneroSubaddress.default(subaddressJson));
  }

  async getIntegratedAddress(standardAddress, paymentId) {
    return new _MoneroIntegratedAddress.default(await this.invokeWorker("getIntegratedAddress", Array.from(arguments)));
  }

  async decodeIntegratedAddress(integratedAddress) {
    return new _MoneroIntegratedAddress.default(await this.invokeWorker("decodeIntegratedAddress", Array.from(arguments)));
  }

  async close(save) {
    await this.invokeWorker("close", Array.from(arguments));
    _LibraryUtils.default.removeWorkerObject(this.walletId);
  }

  async isClosed() {
    return this.invokeWorker("isClosed");
  }

  async invokeWorker(fnName, args) {
    return await _LibraryUtils.default.invokeWorker(this.walletId, fnName, args);
  }
}exports.MoneroWalletKeysProxy = MoneroWalletKeysProxy;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX01vbmVyb0Vycm9yIiwiX01vbmVyb0ludGVncmF0ZWRBZGRyZXNzIiwiX01vbmVyb05ldHdvcmtUeXBlIiwiX01vbmVyb1N1YmFkZHJlc3MiLCJfTW9uZXJvVmVyc2lvbiIsIl9Nb25lcm9XYWxsZXQiLCJfTW9uZXJvV2FsbGV0Q29uZmlnIiwiTW9uZXJvV2FsbGV0S2V5cyIsIk1vbmVyb1dhbGxldCIsImNsb3NlQ29tcGxldGVkIiwiY3JlYXRlV2FsbGV0IiwiY29uZmlnIiwidW5kZWZpbmVkIiwiTW9uZXJvRXJyb3IiLCJNb25lcm9XYWxsZXRDb25maWciLCJnZXRTZWVkIiwiZ2V0UHJpbWFyeUFkZHJlc3MiLCJnZXRQcml2YXRlVmlld0tleSIsImdldFByaXZhdGVTcGVuZEtleSIsImdldE5ldHdvcmtUeXBlIiwiZ2V0U2F2ZUN1cnJlbnQiLCJnZXRQcm94eVRvV29ya2VyIiwic2V0UHJveHlUb1dvcmtlciIsIndhbGxldFByb3h5IiwiTW9uZXJvV2FsbGV0S2V5c1Byb3h5IiwiZ2V0U2VydmVyIiwiY3JlYXRlV2FsbGV0RnJvbVNlZWQiLCJjcmVhdGVXYWxsZXRGcm9tS2V5cyIsImNyZWF0ZVdhbGxldFJhbmRvbSIsImNvcHkiLCJnZXRTZWVkT2Zmc2V0IiwiZ2V0UmVzdG9yZUhlaWdodCIsIk1vbmVyb05ldHdvcmtUeXBlIiwidmFsaWRhdGUiLCJnZXRMYW5ndWFnZSIsInNldExhbmd1YWdlIiwibW9kdWxlIiwiTGlicmFyeVV0aWxzIiwibG9hZFdhc21Nb2R1bGUiLCJxdWV1ZVRhc2siLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsImNyZWF0ZV9rZXlzX3dhbGxldF9yYW5kb20iLCJKU09OIiwic3RyaW5naWZ5IiwidG9Kc29uIiwiY3BwQWRkcmVzcyIsIkVycm9yIiwic2V0U2VlZE9mZnNldCIsImNyZWF0ZV9rZXlzX3dhbGxldF9mcm9tX3NlZWQiLCJzZXRQcmltYXJ5QWRkcmVzcyIsInNldFByaXZhdGVWaWV3S2V5Iiwic2V0UHJpdmF0ZVNwZW5kS2V5IiwiY3JlYXRlX2tleXNfd2FsbGV0X2Zyb21fa2V5cyIsImdldFNlZWRMYW5ndWFnZXMiLCJwYXJzZSIsImdldF9rZXlzX3dhbGxldF9zZWVkX2xhbmd1YWdlcyIsImxhbmd1YWdlcyIsImNvbnN0cnVjdG9yIiwiZ2V0V2FzbU1vZHVsZSIsImNyZWF0ZV9mdWxsX3dhbGxldCIsImlzVmlld09ubHkiLCJnZXRXYWxsZXRQcm94eSIsImFzc2VydE5vdENsb3NlZCIsImlzX3ZpZXdfb25seSIsImlzQ29ubmVjdGVkVG9EYWVtb24iLCJnZXRWZXJzaW9uIiwidmVyc2lvblN0ciIsImdldF92ZXJzaW9uIiwidmVyc2lvbkpzb24iLCJNb25lcm9WZXJzaW9uIiwibnVtYmVyIiwiaXNSZWxlYXNlIiwiZ2V0UGF0aCIsInJlc3AiLCJnZXRfc2VlZCIsImVycm9yU3RyIiwiaW5kZXhPZiIsInN1YnN0cmluZyIsImxlbmd0aCIsImdldFNlZWRMYW5ndWFnZSIsImdldF9zZWVkX2xhbmd1YWdlIiwiZXJyb3JLZXkiLCJnZXRfcHJpdmF0ZV9zcGVuZF9rZXkiLCJnZXRfcHJpdmF0ZV92aWV3X2tleSIsImdldFB1YmxpY1ZpZXdLZXkiLCJnZXRfcHVibGljX3ZpZXdfa2V5IiwiZ2V0UHVibGljU3BlbmRLZXkiLCJnZXRfcHVibGljX3NwZW5kX2tleSIsImdldEFkZHJlc3MiLCJhY2NvdW50SWR4Iiwic3ViYWRkcmVzc0lkeCIsImFzc2VydCIsImdldF9hZGRyZXNzIiwiZ2V0QWRkcmVzc0luZGV4IiwiYWRkcmVzcyIsImdldF9hZGRyZXNzX2luZGV4IiwiY2hhckF0IiwiTW9uZXJvU3ViYWRkcmVzcyIsImdldEFjY291bnRzIiwiaW5jbHVkZVN1YmFkZHJlc3NlcyIsInRhZyIsImNsb3NlIiwic2F2ZSIsImNsb3NlUHJvbWlzZSIsImNsb3NlSW50ZXJuYWwiLCJsaXN0ZW5lckhhbmRsZSIsImNvbm5lY3Rpb25NYW5hZ2VyIiwiZ2V0TGlzdGVuZXJzIiwiaW5jbHVkZXMiLCJjb25uZWN0aW9uTWFuYWdlckxpc3RlbmVyIiwicmVtb3ZlTGlzdGVuZXIiLCJfaXNDbG9zZWQiLCJlcnJNc2ciLCJpc0Nsb3NlZCIsImdldFN1YmFkZHJlc3MiLCJzYW5pdGl6ZVN1YmFkZHJlc3MiLCJzdWJhZGRyZXNzIiwiZ2V0TGFiZWwiLCJzZXRMYWJlbCIsImV4cG9ydHMiLCJ3YWxsZXRJZCIsIkdlblV0aWxzIiwiZ2V0VVVJRCIsImludm9rZVdvcmtlciIsImdldFdvcmtlciIsIndvcmtlciIsIkFycmF5IiwiZnJvbSIsImFyZ3VtZW50cyIsInN1YmFkZHJlc3NKc29uIiwiZ2V0SW50ZWdyYXRlZEFkZHJlc3MiLCJzdGFuZGFyZEFkZHJlc3MiLCJwYXltZW50SWQiLCJNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsImRlY29kZUludGVncmF0ZWRBZGRyZXNzIiwiaW50ZWdyYXRlZEFkZHJlc3MiLCJyZW1vdmVXb3JrZXJPYmplY3QiLCJmbk5hbWUiLCJhcmdzIl0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvd2FsbGV0L01vbmVyb1dhbGxldEtleXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XG5pbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9HZW5VdGlsc1wiO1xuaW1wb3J0IExpYnJhcnlVdGlscyBmcm9tIFwiLi4vY29tbW9uL0xpYnJhcnlVdGlsc1wiO1xuaW1wb3J0IE1vbmVyb0FjY291bnQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWNjb3VudFwiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuLi9jb21tb24vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb05ldHdvcmtUeXBlIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvTmV0d29ya1R5cGVcIjtcbmltcG9ydCBNb25lcm9TdWJhZGRyZXNzIGZyb20gXCIuL21vZGVsL01vbmVyb1N1YmFkZHJlc3NcIjtcbmltcG9ydCBNb25lcm9WZXJzaW9uIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvVmVyc2lvblwiO1xuaW1wb3J0IE1vbmVyb1dhbGxldCBmcm9tIFwiLi9Nb25lcm9XYWxsZXRcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRDb25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvV2FsbGV0Q29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0TGlzdGVuZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvV2FsbGV0TGlzdGVuZXJcIjtcblxuLyoqXG4gKiBJbXBsZW1lbnRzIGEgTW9uZXJvV2FsbGV0IHdoaWNoIG9ubHkgbWFuYWdlcyBrZXlzIHVzaW5nIFdlYkFzc2VtYmx5LlxuICovXG5leHBvcnQgY2xhc3MgTW9uZXJvV2FsbGV0S2V5cyBleHRlbmRzIE1vbmVyb1dhbGxldCB7XG5cbiAgLy8gaW5zdGFuY2UgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBjcHBBZGRyZXNzOiBzdHJpbmc7XG4gIHByb3RlY3RlZCBtb2R1bGU6IGFueTtcbiAgcHJvdGVjdGVkIHdhbGxldFByb3h5OiBNb25lcm9XYWxsZXRLZXlzUHJveHk7XG4gIHByb3RlY3RlZCBjbG9zZVByb21pc2U6IFByb21pc2U8dm9pZD47XG4gIHByb3RlY3RlZCBjbG9zZUNvbXBsZXRlZCA9IGZhbHNlO1xuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFNUQVRJQyBVVElMSVRJRVMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIC8qKlxuICAgKiA8cD5DcmVhdGUgYSB3YWxsZXQgdXNpbmcgV2ViQXNzZW1ibHkgYmluZGluZ3MgdG8gbW9uZXJvLXByb2plY3QuPC9wPlxuICAgKiBcbiAgICogPHA+RXhhbXBsZTo8L3A+XG4gICAqIFxuICAgKiA8Y29kZT5cbiAgICogbGV0IHdhbGxldCA9IGF3YWl0IE1vbmVyb1dhbGxldEtleXMuY3JlYXRlV2FsbGV0KHs8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBwYXNzd29yZDogXCJhYmMxMjNcIiw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBuZXR3b3JrVHlwZTogTW9uZXJvTmV0d29ya1R5cGUuU1RBR0VORVQsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgc2VlZDogXCJjb2V4aXN0IGlnbG9vIHBhbXBobGV0IGxhZ29vbi4uLlwiPGJyPlxuICAgKiB9KTtcbiAgICogPC9jb2RlPlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9XYWxsZXRDb25maWd9IGNvbmZpZyAtIE1vbmVyb1dhbGxldENvbmZpZyBvciBlcXVpdmFsZW50IGNvbmZpZyBvYmplY3RcbiAgICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBjb25maWcubmV0d29ya1R5cGUgLSBuZXR3b3JrIHR5cGUgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9uZSBvZiBcIm1haW5uZXRcIiwgXCJ0ZXN0bmV0XCIsIFwic3RhZ2VuZXRcIiBvciBNb25lcm9OZXR3b3JrVHlwZS5NQUlOTkVUfFRFU1RORVR8U1RBR0VORVQpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlZWRdIC0gc2VlZCBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwsIHJhbmRvbSB3YWxsZXQgY3JlYXRlZCBpZiBuZWl0aGVyIHNlZWQgbm9yIGtleXMgZ2l2ZW4pXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlZWRPZmZzZXRdIC0gdGhlIG9mZnNldCB1c2VkIHRvIGRlcml2ZSBhIG5ldyBzZWVkIGZyb20gdGhlIGdpdmVuIHNlZWQgdG8gcmVjb3ZlciBhIHNlY3JldCB3YWxsZXQgZnJvbSB0aGUgc2VlZCBwaHJhc2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpbWFyeUFkZHJlc3NdIC0gcHJpbWFyeSBhZGRyZXNzIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvbmx5IHByb3ZpZGUgaWYgcmVzdG9yaW5nIGZyb20ga2V5cylcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpdmF0ZVZpZXdLZXldIC0gcHJpdmF0ZSB2aWV3IGtleSBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnByaXZhdGVTcGVuZEtleV0gLSBwcml2YXRlIHNwZW5kIGtleSBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLmxhbmd1YWdlXSAtIGxhbmd1YWdlIG9mIHRoZSB3YWxsZXQncyBzZWVkIChkZWZhdWx0cyB0byBcIkVuZ2xpc2hcIiBvciBhdXRvLWRldGVjdGVkKVxuICAgKiBAcmV0dXJuIHtNb25lcm9XYWxsZXRLZXlzfSB0aGUgY3JlYXRlZCB3YWxsZXRcbiAgICovXG4gIHN0YXRpYyBhc3luYyBjcmVhdGVXYWxsZXQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pIHtcbiAgICBcbiAgICAvLyBub3JtYWxpemUgYW5kIHZhbGlkYXRlIGNvbmZpZ1xuICAgIGlmIChjb25maWcgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGNvbmZpZyB0byBjcmVhdGUgd2FsbGV0XCIpO1xuICAgIGNvbmZpZyA9IGNvbmZpZyBpbnN0YW5jZW9mIE1vbmVyb1dhbGxldENvbmZpZyA/IGNvbmZpZyA6IG5ldyBNb25lcm9XYWxsZXRDb25maWcoY29uZmlnKTtcbiAgICBpZiAoY29uZmlnLmdldFNlZWQoKSAhPT0gdW5kZWZpbmVkICYmIChjb25maWcuZ2V0UHJpbWFyeUFkZHJlc3MoKSAhPT0gdW5kZWZpbmVkIHx8IGNvbmZpZy5nZXRQcml2YXRlVmlld0tleSgpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldFByaXZhdGVTcGVuZEtleSgpICE9PSB1bmRlZmluZWQpKSB7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXYWxsZXQgbWF5IGJlIGluaXRpYWxpemVkIHdpdGggYSBzZWVkIG9yIGtleXMgYnV0IG5vdCBib3RoXCIpO1xuICAgIH1cbiAgICBpZiAoY29uZmlnLmdldE5ldHdvcmtUeXBlKCkgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGEgbmV0d29ya1R5cGU6ICdtYWlubmV0JywgJ3Rlc3RuZXQnIG9yICdzdGFnZW5ldCdcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTYXZlQ3VycmVudCgpID09PSB0cnVlKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3Qgc2F2ZSBjdXJyZW50IHdhbGxldCB3aGVuIGNyZWF0aW5nIGtleXMtb25seSB3YWxsZXRcIik7XG5cbiAgICAvLyBpbml0aWFsaXplIHByb3hpZWQgd2FsbGV0IGlmIGNvbmZpZ3VyZWRcbiAgICBpZiAoY29uZmlnLmdldFByb3h5VG9Xb3JrZXIoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UHJveHlUb1dvcmtlcih0cnVlKTtcbiAgICBpZiAoY29uZmlnLmdldFByb3h5VG9Xb3JrZXIoKSkge1xuICAgICAgbGV0IHdhbGxldFByb3h5ID0gYXdhaXQgTW9uZXJvV2FsbGV0S2V5c1Byb3h5LmNyZWF0ZVdhbGxldChjb25maWcpOztcbiAgICAgIHJldHVybiBuZXcgTW9uZXJvV2FsbGV0S2V5cyh1bmRlZmluZWQsIHdhbGxldFByb3h5KTtcbiAgICB9XG5cbiAgICAvLyBkaXNhbGxvdyBzZXJ2ZXIgY29ubmVjdGlvblxuICAgIGlmIChjb25maWcuZ2V0U2VydmVyKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IGluaXRpYWxpemUga2V5cyB3YWxsZXQgd2l0aCBzZXJ2ZXIgY29ubmVjdGlvblwiKTtcbiAgICBcbiAgICAvLyBjcmVhdGUgd2FsbGV0XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkKCkgIT09IHVuZGVmaW5lZCkgcmV0dXJuIE1vbmVyb1dhbGxldEtleXMuY3JlYXRlV2FsbGV0RnJvbVNlZWQoY29uZmlnKTtcbiAgICBlbHNlIGlmIChjb25maWcuZ2V0UHJpdmF0ZVNwZW5kS2V5KCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWcuZ2V0UHJpbWFyeUFkZHJlc3MoKSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gTW9uZXJvV2FsbGV0S2V5cy5jcmVhdGVXYWxsZXRGcm9tS2V5cyhjb25maWcpO1xuICAgIGVsc2UgcmV0dXJuIE1vbmVyb1dhbGxldEtleXMuY3JlYXRlV2FsbGV0UmFuZG9tKGNvbmZpZyk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgY3JlYXRlV2FsbGV0UmFuZG9tKGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KSB7XG5cbiAgICAvLyB2YWxpZGF0ZSBhbmQgc2FuaXRpemUgcGFyYW1zXG4gICAgY29uZmlnID0gY29uZmlnLmNvcHkoKTtcbiAgICBpZiAoY29uZmlnLmdldFNlZWRPZmZzZXQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSBzZWVkT2Zmc2V0IHdoZW4gY3JlYXRpbmcgcmFuZG9tIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFJlc3RvcmVIZWlnaHQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSByZXN0b3JlSGVpZ2h0IHdoZW4gY3JlYXRpbmcgcmFuZG9tIHdhbGxldFwiKTtcbiAgICBNb25lcm9OZXR3b3JrVHlwZS52YWxpZGF0ZShjb25maWcuZ2V0TmV0d29ya1R5cGUoKSk7XG4gICAgaWYgKGNvbmZpZy5nZXRMYW5ndWFnZSgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRMYW5ndWFnZShcIkVuZ2xpc2hcIik7XG4gICAgXG4gICAgLy8gbG9hZCB3YXNtIG1vZHVsZVxuICAgIGxldCBtb2R1bGUgPSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZFdhc21Nb2R1bGUoKTtcbiAgICBcbiAgICAvLyBxdWV1ZSBjYWxsIHRvIHdhc20gbW9kdWxlXG4gICAgcmV0dXJuIG1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIGNyZWF0ZSB3YWxsZXQgaW4gd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICBtb2R1bGUuY3JlYXRlX2tleXNfd2FsbGV0X3JhbmRvbShKU09OLnN0cmluZ2lmeShjb25maWcudG9Kc29uKCkpLCAoY3BwQWRkcmVzcykgPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgY3BwQWRkcmVzcyA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihjcHBBZGRyZXNzKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9XYWxsZXRLZXlzKGNwcEFkZHJlc3MpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBhc3luYyBjcmVhdGVXYWxsZXRGcm9tU2VlZChjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPikge1xuICAgIFxuICAgIC8vIHZhbGlkYXRlIGFuZCBzYW5pdGl6ZSBwYXJhbXNcbiAgICBNb25lcm9OZXR3b3JrVHlwZS52YWxpZGF0ZShjb25maWcuZ2V0TmV0d29ya1R5cGUoKSk7XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkKCkgPT09IHVuZGVmaW5lZCkgdGhyb3cgRXJyb3IoXCJNdXN0IGRlZmluZSBzZWVkIHRvIGNyZWF0ZSB3YWxsZXQgZnJvbVwiKTtcbiAgICBpZiAoY29uZmlnLmdldFNlZWRPZmZzZXQoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0U2VlZE9mZnNldChcIlwiKTtcbiAgICBpZiAoY29uZmlnLmdldExhbmd1YWdlKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgbGFuZ3VhZ2Ugd2hlbiBjcmVhdGluZyB3YWxsZXQgZnJvbSBzZWVkXCIpO1xuICAgIFxuICAgIC8vIGxvYWQgd2FzbSBtb2R1bGVcbiAgICBsZXQgbW9kdWxlID0gYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRXYXNtTW9kdWxlKCk7XG4gICAgXG4gICAgLy8gcXVldWUgY2FsbCB0byB3YXNtIG1vZHVsZVxuICAgIHJldHVybiBtb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgLy8gY3JlYXRlIHdhbGxldCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIG1vZHVsZS5jcmVhdGVfa2V5c193YWxsZXRfZnJvbV9zZWVkKEpTT04uc3RyaW5naWZ5KGNvbmZpZy50b0pzb24oKSksIChjcHBBZGRyZXNzKSA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBjcHBBZGRyZXNzID09PSBcInN0cmluZ1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKGNwcEFkZHJlc3MpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb1dhbGxldEtleXMoY3BwQWRkcmVzcykpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIGNyZWF0ZVdhbGxldEZyb21LZXlzKGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KSB7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgYW5kIHNhbml0aXplIHBhcmFtc1xuICAgIGlmIChjb25maWcuZ2V0U2VlZE9mZnNldCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHNlZWRPZmZzZXQgd2hlbiBjcmVhdGluZyB3YWxsZXQgZnJvbSBrZXlzXCIpO1xuICAgIE1vbmVyb05ldHdvcmtUeXBlLnZhbGlkYXRlKGNvbmZpZy5nZXROZXR3b3JrVHlwZSgpKTtcbiAgICBpZiAoY29uZmlnLmdldFByaW1hcnlBZGRyZXNzKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFByaW1hcnlBZGRyZXNzKFwiXCIpO1xuICAgIGlmIChjb25maWcuZ2V0UHJpdmF0ZVZpZXdLZXkoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UHJpdmF0ZVZpZXdLZXkoXCJcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQcml2YXRlU3BlbmRLZXkoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UHJpdmF0ZVNwZW5kS2V5KFwiXCIpO1xuICAgIGlmIChjb25maWcuZ2V0TGFuZ3VhZ2UoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0TGFuZ3VhZ2UoXCJFbmdsaXNoXCIpO1xuICAgIFxuICAgIC8vIGxvYWQgd2FzbSBtb2R1bGVcbiAgICBsZXQgbW9kdWxlID0gYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRXYXNtTW9kdWxlKCk7XG4gICAgXG4gICAgLy8gcXVldWUgY2FsbCB0byB3YXNtIG1vZHVsZVxuICAgIHJldHVybiBtb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyBjcmVhdGUgd2FsbGV0IGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgbW9kdWxlLmNyZWF0ZV9rZXlzX3dhbGxldF9mcm9tX2tleXMoSlNPTi5zdHJpbmdpZnkoY29uZmlnLnRvSnNvbigpKSwgKGNwcEFkZHJlc3MpID0+IHtcbiAgICAgICAgICBpZiAodHlwZW9mIGNwcEFkZHJlc3MgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoY3BwQWRkcmVzcykpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvV2FsbGV0S2V5cyhjcHBBZGRyZXNzKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIHN0YXRpYyBhc3luYyBnZXRTZWVkTGFuZ3VhZ2VzKCk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBsZXQgbW9kdWxlID0gYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRXYXNtTW9kdWxlKCk7XG4gICAgcmV0dXJuIG1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgcmV0dXJuIEpTT04ucGFyc2UobW9kdWxlLmdldF9rZXlzX3dhbGxldF9zZWVkX2xhbmd1YWdlcygpKS5sYW5ndWFnZXM7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBJTlNUQU5DRSBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICAvKipcbiAgICogSW50ZXJuYWwgY29uc3RydWN0b3Igd2hpY2ggaXMgZ2l2ZW4gdGhlIG1lbW9yeSBhZGRyZXNzIG9mIGEgQysrIHdhbGxldFxuICAgKiBpbnN0YW5jZS5cbiAgICogXG4gICAqIFRoaXMgbWV0aG9kIHNob3VsZCBub3QgYmUgY2FsbGVkIGV4dGVybmFsbHkgYnV0IHNob3VsZCBiZSBjYWxsZWQgdGhyb3VnaFxuICAgKiBzdGF0aWMgd2FsbGV0IGNyZWF0aW9uIHV0aWxpdGllcyBpbiB0aGlzIGNsYXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGNwcEFkZHJlc3MgLSBhZGRyZXNzIG9mIHRoZSB3YWxsZXQgaW5zdGFuY2UgaW4gQysrXG4gICAqIEBwYXJhbSB7TW9uZXJvV2FsbGV0S2V5c1Byb3h5fSB3YWxsZXRQcm94eSAtIHByb3h5XG4gICAqIFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgY29uc3RydWN0b3IoY3BwQWRkcmVzcywgd2FsbGV0UHJveHk/OiBNb25lcm9XYWxsZXRLZXlzUHJveHkpIHtcbiAgICBzdXBlcigpO1xuICAgIGlmICghY3BwQWRkcmVzcyAmJiAhd2FsbGV0UHJveHkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBjcHBBZGRyZXNzIG9yIHdhbGxldFByb3h5XCIpO1xuICAgIGlmICh3YWxsZXRQcm94eSkgdGhpcy53YWxsZXRQcm94eSA9IHdhbGxldFByb3h5O1xuICAgIGVsc2Uge1xuICAgICAgdGhpcy5jcHBBZGRyZXNzID0gY3BwQWRkcmVzcztcbiAgICAgIHRoaXMubW9kdWxlID0gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKTtcbiAgICAgIGlmICghdGhpcy5tb2R1bGUuY3JlYXRlX2Z1bGxfd2FsbGV0KSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXQVNNIG1vZHVsZSBub3QgbG9hZGVkIC0gY3JlYXRlIHdhbGxldCBpbnN0YW5jZSB1c2luZyBzdGF0aWMgdXRpbGl0aWVzXCIpOyAgLy8gc3RhdGljIHV0aWxpdGVzIHByZS1sb2FkIHdhc20gbW9kdWxlXG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBpc1ZpZXdPbmx5KCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaXNWaWV3T25seSgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5pc192aWV3X29ubHkodGhpcy5jcHBBZGRyZXNzKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgaXNDb25uZWN0ZWRUb0RhZW1vbigpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmlzQ29ubmVjdGVkVG9EYWVtb24oKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBhc3luYyBnZXRWZXJzaW9uKCk6IFByb21pc2U8TW9uZXJvVmVyc2lvbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0VmVyc2lvbigpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCB2ZXJzaW9uU3RyID0gdGhpcy5tb2R1bGUuZ2V0X3ZlcnNpb24odGhpcy5jcHBBZGRyZXNzKTtcbiAgICAgIGxldCB2ZXJzaW9uSnNvbiA9IEpTT04ucGFyc2UodmVyc2lvblN0cik7XG4gICAgICByZXR1cm4gbmV3IE1vbmVyb1ZlcnNpb24odmVyc2lvbkpzb24ubnVtYmVyLCB2ZXJzaW9uSnNvbi5pc1JlbGVhc2UpO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogQGlnbm9yZVxuICAgKi9cbiAgZ2V0UGF0aCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk1vbmVyb1dhbGxldEtleXMgZG9lcyBub3Qgc3VwcG9ydCBhIHBlcnNpc3RlZCBwYXRoXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRTZWVkKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRTZWVkKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IHJlc3AgPSB0aGlzLm1vZHVsZS5nZXRfc2VlZCh0aGlzLmNwcEFkZHJlc3MpO1xuICAgICAgY29uc3QgZXJyb3JTdHIgPSBcImVycm9yOiBcIjtcbiAgICAgIGlmIChyZXNwLmluZGV4T2YoZXJyb3JTdHIpID09PSAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IocmVzcC5zdWJzdHJpbmcoZXJyb3JTdHIubGVuZ3RoKSk7XG4gICAgICByZXR1cm4gcmVzcCA/IHJlc3AgOiB1bmRlZmluZWQ7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFNlZWRMYW5ndWFnZSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0U2VlZExhbmd1YWdlKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IHJlc3AgPSB0aGlzLm1vZHVsZS5nZXRfc2VlZF9sYW5ndWFnZSh0aGlzLmNwcEFkZHJlc3MpO1xuICAgICAgbGV0IGVycm9yS2V5ID0gXCJlcnJvcjogXCI7XG4gICAgICBpZiAocmVzcC5pbmRleE9mKGVycm9yS2V5KSA9PT0gMCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHJlc3Auc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCkpO1xuICAgICAgcmV0dXJuIHJlc3AgPyByZXNwIDogdW5kZWZpbmVkO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgZ2V0UHJpdmF0ZVNwZW5kS2V5KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRQcml2YXRlU3BlbmRLZXkoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgcmVzcCA9IHRoaXMubW9kdWxlLmdldF9wcml2YXRlX3NwZW5kX2tleSh0aGlzLmNwcEFkZHJlc3MpO1xuICAgICAgbGV0IGVycm9yS2V5ID0gXCJlcnJvcjogXCI7XG4gICAgICBpZiAocmVzcC5pbmRleE9mKGVycm9yS2V5KSA9PT0gMCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHJlc3Auc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCkpO1xuICAgICAgcmV0dXJuIHJlc3AgPyByZXNwIDogdW5kZWZpbmVkO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRQcml2YXRlVmlld0tleSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0UHJpdmF0ZVZpZXdLZXkoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgcmVzcCA9IHRoaXMubW9kdWxlLmdldF9wcml2YXRlX3ZpZXdfa2V5KHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgICBsZXQgZXJyb3JLZXkgPSBcImVycm9yOiBcIjtcbiAgICAgIGlmIChyZXNwLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IocmVzcC5zdWJzdHJpbmcoZXJyb3JLZXkubGVuZ3RoKSk7XG4gICAgICByZXR1cm4gcmVzcCA/IHJlc3AgOiB1bmRlZmluZWQ7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFB1YmxpY1ZpZXdLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFB1YmxpY1ZpZXdLZXkoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgcmVzcCA9IHRoaXMubW9kdWxlLmdldF9wdWJsaWNfdmlld19rZXkodGhpcy5jcHBBZGRyZXNzKTtcbiAgICAgIGxldCBlcnJvcktleSA9IFwiZXJyb3I6IFwiO1xuICAgICAgaWYgKHJlc3AuaW5kZXhPZihlcnJvcktleSkgPT09IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihyZXNwLnN1YnN0cmluZyhlcnJvcktleS5sZW5ndGgpKTtcbiAgICAgIHJldHVybiByZXNwID8gcmVzcCA6IHVuZGVmaW5lZDtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UHVibGljU3BlbmRLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFB1YmxpY1NwZW5kS2V5KCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IHJlc3AgPSB0aGlzLm1vZHVsZS5nZXRfcHVibGljX3NwZW5kX2tleSh0aGlzLmNwcEFkZHJlc3MpO1xuICAgICAgbGV0IGVycm9yS2V5ID0gXCJlcnJvcjogXCI7XG4gICAgICBpZiAocmVzcC5pbmRleE9mKGVycm9yS2V5KSA9PT0gMCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHJlc3Auc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCkpO1xuICAgICAgcmV0dXJuIHJlc3AgPyByZXNwIDogdW5kZWZpbmVkO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRBZGRyZXNzKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0lkeDogbnVtYmVyKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEFkZHJlc3MoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG4gICAgYXNzZXJ0KHR5cGVvZiBhY2NvdW50SWR4ID09PSBcIm51bWJlclwiKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gdGhpcy5tb2R1bGUuZ2V0X2FkZHJlc3ModGhpcy5jcHBBZGRyZXNzLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWRkcmVzc0luZGV4KGFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzcz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0QWRkcmVzc0luZGV4KGFkZHJlc3MpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCByZXNwID0gdGhpcy5tb2R1bGUuZ2V0X2FkZHJlc3NfaW5kZXgodGhpcy5jcHBBZGRyZXNzLCBhZGRyZXNzKTtcbiAgICAgIGlmIChyZXNwLmNoYXJBdCgwKSAhPT0gJ3snKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IocmVzcCk7XG4gICAgICByZXR1cm4gbmV3IE1vbmVyb1N1YmFkZHJlc3MoSlNPTi5wYXJzZShyZXNwKSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFjY291bnRzKGluY2x1ZGVTdWJhZGRyZXNzZXM/OiBib29sZWFuLCB0YWc/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0FjY291bnRbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0QWNjb3VudHMoKTtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNb25lcm9XYWxsZXRLZXlzIGRvZXMgbm90IHN1cHBvcnQgZ2V0dGluZyBhbiBlbnVtZXJhYmxlIHNldCBvZiBhY2NvdW50czsgcXVlcnkgc3BlY2lmaWMgYWNjb3VudHNcIik7XG4gIH1cbiAgXG4gIC8vIGdldEludGVncmF0ZWRBZGRyZXNzKHBheW1lbnRJZCkgIC8vIFRPRE9cbiAgLy8gZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3NcbiAgXG4gIGFzeW5jIGNsb3NlKHNhdmUgPSBmYWxzZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNsb3NlUHJvbWlzZSkgcmV0dXJuIHRoaXMuY2xvc2VQcm9taXNlO1xuICAgIGlmICh0aGlzLmNsb3NlQ29tcGxldGVkKSByZXR1cm47XG4gICAgdGhpcy5jbG9zZVByb21pc2UgPSB0aGlzLmNsb3NlSW50ZXJuYWwoc2F2ZSk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHRoaXMuY2xvc2VQcm9taXNlO1xuICAgICAgdGhpcy5jbG9zZUNvbXBsZXRlZCA9IHRydWU7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuY2xvc2VQcm9taXNlID0gdW5kZWZpbmVkOyAvLyBrZWVwIG5hdGl2ZSByZXNvdXJjZXMgYXZhaWxhYmxlIGZvciByZXRyeSBhZnRlciBmYWlsdXJlXG4gICAgfVxuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIGNsb3NlSW50ZXJuYWwoc2F2ZTogYm9vbGVhbiwgbGlzdGVuZXJIYW5kbGUgPSAwKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29ubmVjdGlvbk1hbmFnZXIgJiYgdGhpcy5jb25uZWN0aW9uTWFuYWdlci5nZXRMaXN0ZW5lcnMoKS5pbmNsdWRlcyh0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIpKSB0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyLnJlbW92ZUxpc3RlbmVyKHRoaXMuY29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lcik7XG4gICAgdGhpcy5jb25uZWN0aW9uTWFuYWdlciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIgPSB1bmRlZmluZWQ7XG4gICAgaWYgKHRoaXMud2FsbGV0UHJveHkpIHtcbiAgICAgIHRoaXMuX2lzQ2xvc2VkID0gdHJ1ZTtcbiAgICAgIGF3YWl0IHRoaXMud2FsbGV0UHJveHkuY2xvc2Uoc2F2ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChzYXZlKSBhd2FpdCB0aGlzLnNhdmUoKTtcbiAgICAgIHRoaXMuX2lzQ2xvc2VkID0gdHJ1ZTtcbiAgICAgIGF3YWl0IHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgdGhpcy5tb2R1bGUuY2xvc2UodGhpcy5jcHBBZGRyZXNzLCBmYWxzZSwgbGlzdGVuZXJIYW5kbGUsIChlcnJNc2cpID0+IHsgLy8gc2F2aW5nIGhhbmRsZWQgZXh0ZXJuYWwgdG8gd2ViYXNzZW1ibHlcbiAgICAgICAgICAgIGlmIChlcnJNc2cpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoZXJyTXNnKSk7XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuY3BwQWRkcmVzcztcbiAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBhd2FpdCBzdXBlci5jbG9zZSgpO1xuICB9XG5cbiAgYXN5bmMgaXNDbG9zZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIHRoaXMuX2lzQ2xvc2VkO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLSBBREQgSlNET0MgRk9SIFNVUFBPUlRFRCBERUZBVUxUIElNUExFTUVOVEFUSU9OUyAtLS0tLS0tLS0tLS0tLVxuICBcbiAgYXN5bmMgZ2V0UHJpbWFyeUFkZHJlc3MoKTogUHJvbWlzZTxzdHJpbmc+IHsgcmV0dXJuIHN1cGVyLmdldFByaW1hcnlBZGRyZXNzKCk7IH1cbiAgYXN5bmMgZ2V0U3ViYWRkcmVzcyhhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg6IG51bWJlcik6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzcz4geyByZXR1cm4gc3VwZXIuZ2V0U3ViYWRkcmVzcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTsgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUFJJVkFURSBIRUxQRVJTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBzdGF0aWMgc2FuaXRpemVTdWJhZGRyZXNzKHN1YmFkZHJlc3MpIHtcbiAgICBpZiAoc3ViYWRkcmVzcy5nZXRMYWJlbCgpID09PSBcIlwiKSBzdWJhZGRyZXNzLnNldExhYmVsKHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIHN1YmFkZHJlc3NcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGFzc2VydE5vdENsb3NlZCgpIHtcbiAgICBpZiAodGhpcy5faXNDbG9zZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBpcyBjbG9zZWRcIik7XG4gIH1cblxuICBwcm90ZWN0ZWQgZ2V0V2FsbGV0UHJveHkoKTogTW9uZXJvV2FsbGV0S2V5c1Byb3h5IHtcbiAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgIHJldHVybiB0aGlzLndhbGxldFByb3h5O1xuICB9XG59XG5cbi8qKlxuICogSW1wbGVtZW50cyBhIE1vbmVyb1dhbGxldCBieSBwcm94eWluZyByZXF1ZXN0cyB0byBhIHdvcmtlciB3aGljaCBydW5zIGEga2V5cy1vbmx5IHdhbGxldC5cbiAqIFxuICogVE9ETzogc29ydCB0aGVzZSBtZXRob2RzIGFjY29yZGluZyB0byBtYXN0ZXIgc29ydCBpbiBNb25lcm9XYWxsZXQudHNcbiAqIFRPRE86IHByb2JhYmx5IG9ubHkgYWxsb3cgb25lIGxpc3RlbmVyIHRvIHdvcmtlciB0aGVuIHByb3BvZ2F0ZSB0byByZWdpc3RlcmVkIGxpc3RlbmVycyBmb3IgcGVyZm9ybWFuY2VcbiAqIFxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0IGNsYXNzIE1vbmVyb1dhbGxldEtleXNQcm94eSBleHRlbmRzIE1vbmVyb1dhbGxldCB7XG5cbiAgLy8gc3RhdGUgdmFyaWFibGVzXG4gIHByb3RlY3RlZCB3YWxsZXRJZDogc3RyaW5nO1xuICBwcm90ZWN0ZWQgd29ya2VyOiBXb3JrZXI7XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBXQUxMRVQgU1RBVElDIFVUSUxTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgc3RhdGljIGFzeW5jIGNyZWF0ZVdhbGxldChjb25maWcpIHtcbiAgICBsZXQgd2FsbGV0SWQgPSBHZW5VdGlscy5nZXRVVUlEKCk7XG4gICAgYXdhaXQgTGlicmFyeVV0aWxzLmludm9rZVdvcmtlcih3YWxsZXRJZCwgXCJjcmVhdGVXYWxsZXRLZXlzXCIsIFtjb25maWcudG9Kc29uKCldKTtcbiAgICByZXR1cm4gbmV3IE1vbmVyb1dhbGxldEtleXNQcm94eSh3YWxsZXRJZCwgYXdhaXQgTGlicmFyeVV0aWxzLmdldFdvcmtlcigpKTtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIElOU1RBTkNFIE1FVEhPRFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgLyoqXG4gICAqIEludGVybmFsIGNvbnN0cnVjdG9yIHdoaWNoIGlzIGdpdmVuIGEgd29ya2VyIHRvIGNvbW11bmljYXRlIHdpdGggdmlhIG1lc3NhZ2VzLlxuICAgKiBcbiAgICogVGhpcyBtZXRob2Qgc2hvdWxkIG5vdCBiZSBjYWxsZWQgZXh0ZXJuYWxseSBidXQgc2hvdWxkIGJlIGNhbGxlZCB0aHJvdWdoXG4gICAqIHN0YXRpYyB3YWxsZXQgY3JlYXRpb24gdXRpbGl0aWVzIGluIHRoaXMgY2xhc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gd2FsbGV0SWQgLSBpZGVudGlmaWVzIHRoZSB3YWxsZXQgd2l0aCB0aGUgd29ya2VyXG4gICAqIEBwYXJhbSB7V29ya2VyfSB3b3JrZXIgLSB3b3JrZXIgdG8gY29tbXVuaWNhdGUgd2l0aCB2aWEgbWVzc2FnZXNcbiAgICogXG4gICAqIEBwcm90ZWN0ZWRcbiAgICovXG4gIGNvbnN0cnVjdG9yKHdhbGxldElkLCB3b3JrZXIpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMud2FsbGV0SWQgPSB3YWxsZXRJZDtcbiAgICB0aGlzLndvcmtlciA9IHdvcmtlcjtcbiAgfVxuICBcbiAgYXN5bmMgaXNWaWV3T25seSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJpc1ZpZXdPbmx5XCIpO1xuICB9XG5cbiAgYXN5bmMgZ2V0VmVyc2lvbigpOiBQcm9taXNlPE1vbmVyb1ZlcnNpb24+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cblxuICBhc3luYyBnZXRTZWVkKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldFNlZWRcIikgYXMgUHJvbWlzZTxzdHJpbmc+O1xuICB9XG4gIFxuICBhc3luYyBnZXRTZWVkTGFuZ3VhZ2UoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0U2VlZExhbmd1YWdlXCIpIGFzIFByb21pc2U8c3RyaW5nPjtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U2VlZExhbmd1YWdlcygpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRTZWVkTGFuZ3VhZ2VzXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRQcml2YXRlU3BlbmRLZXkoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0UHJpdmF0ZVNwZW5kS2V5XCIpIGFzIFByb21pc2U8c3RyaW5nPjtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UHJpdmF0ZVZpZXdLZXkoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0UHJpdmF0ZVZpZXdLZXlcIikgYXMgUHJvbWlzZTxzdHJpbmc+O1xuICB9XG4gIFxuICBhc3luYyBnZXRQdWJsaWNWaWV3S2V5KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldFB1YmxpY1ZpZXdLZXlcIikgYXMgUHJvbWlzZTxzdHJpbmc+O1xuICB9XG4gIFxuICBhc3luYyBnZXRQdWJsaWNTcGVuZEtleSgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRQdWJsaWNTcGVuZEtleVwiKSBhcyBQcm9taXNlPHN0cmluZz47XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFkZHJlc3MoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldEFkZHJlc3NcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSBhcyBQcm9taXNlPHN0cmluZz47XG4gIH1cblxuICBhc3luYyBnZXRBZGRyZXNzSW5kZXgoYWRkcmVzcykge1xuICAgIGxldCBzdWJhZGRyZXNzSnNvbiA9IGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0QWRkcmVzc0luZGV4XCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gICAgcmV0dXJuIE1vbmVyb1dhbGxldEtleXMuc2FuaXRpemVTdWJhZGRyZXNzKG5ldyBNb25lcm9TdWJhZGRyZXNzKHN1YmFkZHJlc3NKc29uKSk7XG4gIH1cblxuICBhc3luYyBnZXRJbnRlZ3JhdGVkQWRkcmVzcyhzdGFuZGFyZEFkZHJlc3MsIHBheW1lbnRJZCkge1xuICAgIHJldHVybiBuZXcgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRJbnRlZ3JhdGVkQWRkcmVzc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuICBcbiAgYXN5bmMgZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3MpIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzKGF3YWl0IHRoaXMuaW52b2tlV29ya2VyKFwiZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3NcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKSk7XG4gIH1cblxuICBhc3luYyBjbG9zZShzYXZlKSB7XG4gICAgYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJjbG9zZVwiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpO1xuICAgIExpYnJhcnlVdGlscy5yZW1vdmVXb3JrZXJPYmplY3QodGhpcy53YWxsZXRJZCk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzQ2xvc2VkKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImlzQ2xvc2VkXCIpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIGludm9rZVdvcmtlcihmbk5hbWU6IHN0cmluZywgYXJncz86IGFueSk6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIGF3YWl0IExpYnJhcnlVdGlscy5pbnZva2VXb3JrZXIodGhpcy53YWxsZXRJZCwgZm5OYW1lLCBhcmdzKTtcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoia09BQUEsSUFBQUEsT0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMsU0FBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUUsYUFBQSxHQUFBSCxzQkFBQSxDQUFBQyxPQUFBOztBQUVBLElBQUFHLFlBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFJLHdCQUFBLEdBQUFMLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSyxrQkFBQSxHQUFBTixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQU0saUJBQUEsR0FBQVAsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFPLGNBQUEsR0FBQVIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFRLGFBQUEsR0FBQVQsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFTLG1CQUFBLEdBQUFWLHNCQUFBLENBQUFDLE9BQUE7OztBQUdBO0FBQ0E7QUFDQTtBQUNPLE1BQU1V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