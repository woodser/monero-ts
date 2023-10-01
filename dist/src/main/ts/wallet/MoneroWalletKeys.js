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
    let module = await _LibraryUtils.default.loadKeysModule();

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
    let module = await _LibraryUtils.default.loadKeysModule();

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
    let module = await _LibraryUtils.default.loadKeysModule();

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
    let module = await _LibraryUtils.default.loadKeysModule();
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
    this._isClosed = false;
    if (!cppAddress && !walletProxy) throw new _MoneroError.default("Must provide cppAddress or walletProxy");
    if (walletProxy) this.walletProxy = walletProxy;else
    {
      this.cppAddress = cppAddress;
      this.module = _LibraryUtils.default.getWasmModule();
      if (!this.module.create_full_wallet) throw new _MoneroError.default("WASM module not loaded - create wallet instance using static utilities"); // static utilites pre-load wasm module
    }
  }

  async addListener(listener) {
    throw new _MoneroError.default("MoneroWalletKeys does not support adding listeners");
  }

  async removeListener(listener) {
    throw new _MoneroError.default("MoneroWalletKeys does not support removing listeners");
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
    if (this._isClosed) return; // no effect if closed
    if (this.getWalletProxy()) {
      await this.getWalletProxy().close(save);
      this._isClosed = true;
      return;
    }

    // save wallet if requested
    if (save) await this.save();

    // close super
    await super.close();

    // queue task to use wasm module
    return this.module.queueTask(async () => {
      return new Promise((resolve, reject) => {
        if (this._isClosed) {
          resolve(undefined);
          return;
        }

        // close wallet in wasm and invoke callback when done
        this.module.close(this.cppAddress, false, async () => {// saving handled external to webassembly
          delete this.cppAddress;
          this._isClosed = true;
          resolve();
        });
      });
    });
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
    if (save) throw new _MoneroError.default("Cannot save keys-only wallet");
    await this.invokeWorker("close");
    _LibraryUtils.default.removeWorkerObject(this.walletId);
  }

  async isClosed() {
    return this.invokeWorker("isClosed");
  }

  async invokeWorker(fnName, args) {
    return await _LibraryUtils.default.invokeWorker(this.walletId, fnName, args);
  }
}exports.MoneroWalletKeysProxy = MoneroWalletKeysProxy;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX01vbmVyb0Vycm9yIiwiX01vbmVyb0ludGVncmF0ZWRBZGRyZXNzIiwiX01vbmVyb05ldHdvcmtUeXBlIiwiX01vbmVyb1N1YmFkZHJlc3MiLCJfTW9uZXJvVmVyc2lvbiIsIl9Nb25lcm9XYWxsZXQiLCJfTW9uZXJvV2FsbGV0Q29uZmlnIiwiTW9uZXJvV2FsbGV0S2V5cyIsIk1vbmVyb1dhbGxldCIsImNyZWF0ZVdhbGxldCIsImNvbmZpZyIsInVuZGVmaW5lZCIsIk1vbmVyb0Vycm9yIiwiTW9uZXJvV2FsbGV0Q29uZmlnIiwiZ2V0U2VlZCIsImdldFByaW1hcnlBZGRyZXNzIiwiZ2V0UHJpdmF0ZVZpZXdLZXkiLCJnZXRQcml2YXRlU3BlbmRLZXkiLCJnZXROZXR3b3JrVHlwZSIsImdldFNhdmVDdXJyZW50IiwiZ2V0UHJveHlUb1dvcmtlciIsInNldFByb3h5VG9Xb3JrZXIiLCJ3YWxsZXRQcm94eSIsIk1vbmVyb1dhbGxldEtleXNQcm94eSIsImNyZWF0ZVdhbGxldEZyb21TZWVkIiwiY3JlYXRlV2FsbGV0RnJvbUtleXMiLCJjcmVhdGVXYWxsZXRSYW5kb20iLCJjb3B5IiwiZ2V0U2VlZE9mZnNldCIsImdldFJlc3RvcmVIZWlnaHQiLCJNb25lcm9OZXR3b3JrVHlwZSIsInZhbGlkYXRlIiwiZ2V0TGFuZ3VhZ2UiLCJzZXRMYW5ndWFnZSIsIm1vZHVsZSIsIkxpYnJhcnlVdGlscyIsImxvYWRLZXlzTW9kdWxlIiwicXVldWVUYXNrIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJjcmVhdGVfa2V5c193YWxsZXRfcmFuZG9tIiwiSlNPTiIsInN0cmluZ2lmeSIsInRvSnNvbiIsImNwcEFkZHJlc3MiLCJFcnJvciIsInNldFNlZWRPZmZzZXQiLCJjcmVhdGVfa2V5c193YWxsZXRfZnJvbV9zZWVkIiwic2V0UHJpbWFyeUFkZHJlc3MiLCJzZXRQcml2YXRlVmlld0tleSIsInNldFByaXZhdGVTcGVuZEtleSIsImNyZWF0ZV9rZXlzX3dhbGxldF9mcm9tX2tleXMiLCJnZXRTZWVkTGFuZ3VhZ2VzIiwicGFyc2UiLCJnZXRfa2V5c193YWxsZXRfc2VlZF9sYW5ndWFnZXMiLCJsYW5ndWFnZXMiLCJjb25zdHJ1Y3RvciIsIl9pc0Nsb3NlZCIsImdldFdhc21Nb2R1bGUiLCJjcmVhdGVfZnVsbF93YWxsZXQiLCJhZGRMaXN0ZW5lciIsImxpc3RlbmVyIiwicmVtb3ZlTGlzdGVuZXIiLCJpc1ZpZXdPbmx5IiwiZ2V0V2FsbGV0UHJveHkiLCJhc3NlcnROb3RDbG9zZWQiLCJpc192aWV3X29ubHkiLCJpc0Nvbm5lY3RlZFRvRGFlbW9uIiwiZ2V0VmVyc2lvbiIsInZlcnNpb25TdHIiLCJnZXRfdmVyc2lvbiIsInZlcnNpb25Kc29uIiwiTW9uZXJvVmVyc2lvbiIsIm51bWJlciIsImlzUmVsZWFzZSIsImdldFBhdGgiLCJyZXNwIiwiZ2V0X3NlZWQiLCJlcnJvclN0ciIsImluZGV4T2YiLCJzdWJzdHJpbmciLCJsZW5ndGgiLCJnZXRTZWVkTGFuZ3VhZ2UiLCJnZXRfc2VlZF9sYW5ndWFnZSIsImVycm9yS2V5IiwiZ2V0X3ByaXZhdGVfc3BlbmRfa2V5IiwiZ2V0X3ByaXZhdGVfdmlld19rZXkiLCJnZXRQdWJsaWNWaWV3S2V5IiwiZ2V0X3B1YmxpY192aWV3X2tleSIsImdldFB1YmxpY1NwZW5kS2V5IiwiZ2V0X3B1YmxpY19zcGVuZF9rZXkiLCJnZXRBZGRyZXNzIiwiYWNjb3VudElkeCIsInN1YmFkZHJlc3NJZHgiLCJhc3NlcnQiLCJnZXRfYWRkcmVzcyIsImdldEFkZHJlc3NJbmRleCIsImFkZHJlc3MiLCJnZXRfYWRkcmVzc19pbmRleCIsImNoYXJBdCIsIk1vbmVyb1N1YmFkZHJlc3MiLCJnZXRBY2NvdW50cyIsImluY2x1ZGVTdWJhZGRyZXNzZXMiLCJ0YWciLCJjbG9zZSIsInNhdmUiLCJpc0Nsb3NlZCIsImdldFN1YmFkZHJlc3MiLCJzYW5pdGl6ZVN1YmFkZHJlc3MiLCJzdWJhZGRyZXNzIiwiZ2V0TGFiZWwiLCJzZXRMYWJlbCIsImV4cG9ydHMiLCJ3YWxsZXRJZCIsIkdlblV0aWxzIiwiZ2V0VVVJRCIsImludm9rZVdvcmtlciIsImdldFdvcmtlciIsIndvcmtlciIsIkFycmF5IiwiZnJvbSIsImFyZ3VtZW50cyIsInN1YmFkZHJlc3NKc29uIiwiZ2V0SW50ZWdyYXRlZEFkZHJlc3MiLCJzdGFuZGFyZEFkZHJlc3MiLCJwYXltZW50SWQiLCJNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsImRlY29kZUludGVncmF0ZWRBZGRyZXNzIiwiaW50ZWdyYXRlZEFkZHJlc3MiLCJyZW1vdmVXb3JrZXJPYmplY3QiLCJmbk5hbWUiLCJhcmdzIl0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvd2FsbGV0L01vbmVyb1dhbGxldEtleXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XG5pbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9HZW5VdGlsc1wiO1xuaW1wb3J0IExpYnJhcnlVdGlscyBmcm9tIFwiLi4vY29tbW9uL0xpYnJhcnlVdGlsc1wiO1xuaW1wb3J0IE1vbmVyb0FjY291bnQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWNjb3VudFwiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuLi9jb21tb24vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb05ldHdvcmtUeXBlIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvTmV0d29ya1R5cGVcIjtcbmltcG9ydCBNb25lcm9TdWJhZGRyZXNzIGZyb20gXCIuL21vZGVsL01vbmVyb1N1YmFkZHJlc3NcIjtcbmltcG9ydCBNb25lcm9WZXJzaW9uIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvVmVyc2lvblwiO1xuaW1wb3J0IE1vbmVyb1dhbGxldCBmcm9tIFwiLi9Nb25lcm9XYWxsZXRcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRDb25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvV2FsbGV0Q29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0TGlzdGVuZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvV2FsbGV0TGlzdGVuZXJcIjtcblxuLyoqXG4gKiBJbXBsZW1lbnRzIGEgTW9uZXJvV2FsbGV0IHdoaWNoIG9ubHkgbWFuYWdlcyBrZXlzIHVzaW5nIFdlYkFzc2VtYmx5LlxuICovXG5leHBvcnQgY2xhc3MgTW9uZXJvV2FsbGV0S2V5cyBleHRlbmRzIE1vbmVyb1dhbGxldCB7XG5cbiAgLy8gaW5zdGFuY2UgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBjcHBBZGRyZXNzOiBzdHJpbmc7XG4gIHByb3RlY3RlZCBtb2R1bGU6IGFueTtcbiAgcHJvdGVjdGVkIHdhbGxldFByb3h5OiBNb25lcm9XYWxsZXRLZXlzUHJveHk7XG4gIHByb3RlY3RlZCBfaXNDbG9zZWQ6IGJvb2xlYW47XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU1RBVElDIFVUSUxJVElFUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgLyoqXG4gICAqIDxwPkNyZWF0ZSBhIHdhbGxldCB1c2luZyBXZWJBc3NlbWJseSBiaW5kaW5ncyB0byBtb25lcm8tcHJvamVjdC48L3A+XG4gICAqIFxuICAgKiA8cD5FeGFtcGxlOjwvcD5cbiAgICogXG4gICAqIDxjb2RlPlxuICAgKiBsZXQgd2FsbGV0ID0gYXdhaXQgTW9uZXJvV2FsbGV0S2V5cy5jcmVhdGVXYWxsZXQoezxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHBhc3N3b3JkOiBcImFiYzEyM1wiLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IG5ldHdvcmtUeXBlOiBNb25lcm9OZXR3b3JrVHlwZS5TVEFHRU5FVCw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBzZWVkOiBcImNvZXhpc3QgaWdsb28gcGFtcGhsZXQgbGFnb29uLi4uXCI8YnI+XG4gICAqIH0pO1xuICAgKiA8L2NvZGU+XG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1dhbGxldENvbmZpZ30gY29uZmlnIC0gTW9uZXJvV2FsbGV0Q29uZmlnIG9yIGVxdWl2YWxlbnQgY29uZmlnIG9iamVjdFxuICAgKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IGNvbmZpZy5uZXR3b3JrVHlwZSAtIG5ldHdvcmsgdHlwZSBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob25lIG9mIFwibWFpbm5ldFwiLCBcInRlc3RuZXRcIiwgXCJzdGFnZW5ldFwiIG9yIE1vbmVyb05ldHdvcmtUeXBlLk1BSU5ORVR8VEVTVE5FVHxTVEFHRU5FVClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VlZF0gLSBzZWVkIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbCwgcmFuZG9tIHdhbGxldCBjcmVhdGVkIGlmIG5laXRoZXIgc2VlZCBub3Iga2V5cyBnaXZlbilcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VlZE9mZnNldF0gLSB0aGUgb2Zmc2V0IHVzZWQgdG8gZGVyaXZlIGEgbmV3IHNlZWQgZnJvbSB0aGUgZ2l2ZW4gc2VlZCB0byByZWNvdmVyIGEgc2VjcmV0IHdhbGxldCBmcm9tIHRoZSBzZWVkIHBocmFzZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wcmltYXJ5QWRkcmVzc10gLSBwcmltYXJ5IGFkZHJlc3Mgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9ubHkgcHJvdmlkZSBpZiByZXN0b3JpbmcgZnJvbSBrZXlzKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wcml2YXRlVmlld0tleV0gLSBwcml2YXRlIHZpZXcga2V5IG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpdmF0ZVNwZW5kS2V5XSAtIHByaXZhdGUgc3BlbmQga2V5IG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcubGFuZ3VhZ2VdIC0gbGFuZ3VhZ2Ugb2YgdGhlIHdhbGxldCdzIHNlZWQgKGRlZmF1bHRzIHRvIFwiRW5nbGlzaFwiIG9yIGF1dG8tZGV0ZWN0ZWQpXG4gICAqIEByZXR1cm4ge01vbmVyb1dhbGxldEtleXN9IHRoZSBjcmVhdGVkIHdhbGxldFxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGNyZWF0ZVdhbGxldChjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPikge1xuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSBhbmQgdmFsaWRhdGUgY29uZmlnXG4gICAgaWYgKGNvbmZpZyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgY29uZmlnIHRvIGNyZWF0ZSB3YWxsZXRcIik7XG4gICAgY29uZmlnID0gY29uZmlnIGluc3RhbmNlb2YgTW9uZXJvV2FsbGV0Q29uZmlnID8gY29uZmlnIDogbmV3IE1vbmVyb1dhbGxldENvbmZpZyhjb25maWcpO1xuICAgIGlmIChjb25maWcuZ2V0U2VlZCgpICE9PSB1bmRlZmluZWQgJiYgKGNvbmZpZy5nZXRQcmltYXJ5QWRkcmVzcygpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldFByaXZhdGVWaWV3S2V5KCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWcuZ2V0UHJpdmF0ZVNwZW5kS2V5KCkgIT09IHVuZGVmaW5lZCkpIHtcbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBtYXkgYmUgaW5pdGlhbGl6ZWQgd2l0aCBhIHNlZWQgb3Iga2V5cyBidXQgbm90IGJvdGhcIik7XG4gICAgfVxuICAgIGlmIChjb25maWcuZ2V0TmV0d29ya1R5cGUoKSA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgYSBuZXR3b3JrVHlwZTogJ21haW5uZXQnLCAndGVzdG5ldCcgb3IgJ3N0YWdlbmV0J1wiKTtcbiAgICBpZiAoY29uZmlnLmdldFNhdmVDdXJyZW50KCkgPT09IHRydWUpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzYXZlIGN1cnJlbnQgd2FsbGV0IHdoZW4gY3JlYXRpbmcga2V5cy1vbmx5IHdhbGxldFwiKTtcblxuICAgIC8vIGluaXRpYWxpemUgcHJveGllZCB3YWxsZXQgaWYgY29uZmlndXJlZFxuICAgIGlmIChjb25maWcuZ2V0UHJveHlUb1dvcmtlcigpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRQcm94eVRvV29ya2VyKHRydWUpO1xuICAgIGlmIChjb25maWcuZ2V0UHJveHlUb1dvcmtlcigpKSB7XG4gICAgICBsZXQgd2FsbGV0UHJveHkgPSBhd2FpdCBNb25lcm9XYWxsZXRLZXlzUHJveHkuY3JlYXRlV2FsbGV0KGNvbmZpZyk7O1xuICAgICAgcmV0dXJuIG5ldyBNb25lcm9XYWxsZXRLZXlzKHVuZGVmaW5lZCwgd2FsbGV0UHJveHkpO1xuICAgIH1cbiAgICBcbiAgICAvLyBjcmVhdGUgd2FsbGV0XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkKCkgIT09IHVuZGVmaW5lZCkgcmV0dXJuIE1vbmVyb1dhbGxldEtleXMuY3JlYXRlV2FsbGV0RnJvbVNlZWQoY29uZmlnKTtcbiAgICBlbHNlIGlmIChjb25maWcuZ2V0UHJpdmF0ZVNwZW5kS2V5KCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWcuZ2V0UHJpbWFyeUFkZHJlc3MoKSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gTW9uZXJvV2FsbGV0S2V5cy5jcmVhdGVXYWxsZXRGcm9tS2V5cyhjb25maWcpO1xuICAgIGVsc2UgcmV0dXJuIE1vbmVyb1dhbGxldEtleXMuY3JlYXRlV2FsbGV0UmFuZG9tKGNvbmZpZyk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgY3JlYXRlV2FsbGV0UmFuZG9tKGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KSB7XG5cbiAgICAvLyB2YWxpZGF0ZSBhbmQgc2FuaXRpemUgcGFyYW1zXG4gICAgY29uZmlnID0gY29uZmlnLmNvcHkoKTtcbiAgICBpZiAoY29uZmlnLmdldFNlZWRPZmZzZXQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSBzZWVkT2Zmc2V0IHdoZW4gY3JlYXRpbmcgcmFuZG9tIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFJlc3RvcmVIZWlnaHQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSByZXN0b3JlSGVpZ2h0IHdoZW4gY3JlYXRpbmcgcmFuZG9tIHdhbGxldFwiKTtcbiAgICBNb25lcm9OZXR3b3JrVHlwZS52YWxpZGF0ZShjb25maWcuZ2V0TmV0d29ya1R5cGUoKSk7XG4gICAgaWYgKGNvbmZpZy5nZXRMYW5ndWFnZSgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRMYW5ndWFnZShcIkVuZ2xpc2hcIik7XG4gICAgXG4gICAgLy8gbG9hZCB3YXNtIG1vZHVsZVxuICAgIGxldCBtb2R1bGUgPSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZEtleXNNb2R1bGUoKTtcbiAgICBcbiAgICAvLyBxdWV1ZSBjYWxsIHRvIHdhc20gbW9kdWxlXG4gICAgcmV0dXJuIG1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIGNyZWF0ZSB3YWxsZXQgaW4gd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICBtb2R1bGUuY3JlYXRlX2tleXNfd2FsbGV0X3JhbmRvbShKU09OLnN0cmluZ2lmeShjb25maWcudG9Kc29uKCkpLCAoY3BwQWRkcmVzcykgPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgY3BwQWRkcmVzcyA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihjcHBBZGRyZXNzKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9XYWxsZXRLZXlzKGNwcEFkZHJlc3MpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBhc3luYyBjcmVhdGVXYWxsZXRGcm9tU2VlZChjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPikge1xuICAgIFxuICAgIC8vIHZhbGlkYXRlIGFuZCBzYW5pdGl6ZSBwYXJhbXNcbiAgICBNb25lcm9OZXR3b3JrVHlwZS52YWxpZGF0ZShjb25maWcuZ2V0TmV0d29ya1R5cGUoKSk7XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkKCkgPT09IHVuZGVmaW5lZCkgdGhyb3cgRXJyb3IoXCJNdXN0IGRlZmluZSBzZWVkIHRvIGNyZWF0ZSB3YWxsZXQgZnJvbVwiKTtcbiAgICBpZiAoY29uZmlnLmdldFNlZWRPZmZzZXQoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0U2VlZE9mZnNldChcIlwiKTtcbiAgICBpZiAoY29uZmlnLmdldExhbmd1YWdlKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgbGFuZ3VhZ2Ugd2hlbiBjcmVhdGluZyB3YWxsZXQgZnJvbSBzZWVkXCIpO1xuICAgIFxuICAgIC8vIGxvYWQgd2FzbSBtb2R1bGVcbiAgICBsZXQgbW9kdWxlID0gYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRLZXlzTW9kdWxlKCk7XG4gICAgXG4gICAgLy8gcXVldWUgY2FsbCB0byB3YXNtIG1vZHVsZVxuICAgIHJldHVybiBtb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgLy8gY3JlYXRlIHdhbGxldCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIG1vZHVsZS5jcmVhdGVfa2V5c193YWxsZXRfZnJvbV9zZWVkKEpTT04uc3RyaW5naWZ5KGNvbmZpZy50b0pzb24oKSksIChjcHBBZGRyZXNzKSA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBjcHBBZGRyZXNzID09PSBcInN0cmluZ1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKGNwcEFkZHJlc3MpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb1dhbGxldEtleXMoY3BwQWRkcmVzcykpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIGNyZWF0ZVdhbGxldEZyb21LZXlzKGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KSB7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgYW5kIHNhbml0aXplIHBhcmFtc1xuICAgIGlmIChjb25maWcuZ2V0U2VlZE9mZnNldCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHNlZWRPZmZzZXQgd2hlbiBjcmVhdGluZyB3YWxsZXQgZnJvbSBrZXlzXCIpO1xuICAgIE1vbmVyb05ldHdvcmtUeXBlLnZhbGlkYXRlKGNvbmZpZy5nZXROZXR3b3JrVHlwZSgpKTtcbiAgICBpZiAoY29uZmlnLmdldFByaW1hcnlBZGRyZXNzKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFByaW1hcnlBZGRyZXNzKFwiXCIpO1xuICAgIGlmIChjb25maWcuZ2V0UHJpdmF0ZVZpZXdLZXkoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UHJpdmF0ZVZpZXdLZXkoXCJcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQcml2YXRlU3BlbmRLZXkoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UHJpdmF0ZVNwZW5kS2V5KFwiXCIpO1xuICAgIGlmIChjb25maWcuZ2V0TGFuZ3VhZ2UoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0TGFuZ3VhZ2UoXCJFbmdsaXNoXCIpO1xuICAgIFxuICAgIC8vIGxvYWQgd2FzbSBtb2R1bGVcbiAgICBsZXQgbW9kdWxlID0gYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRLZXlzTW9kdWxlKCk7XG4gICAgXG4gICAgLy8gcXVldWUgY2FsbCB0byB3YXNtIG1vZHVsZVxuICAgIHJldHVybiBtb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyBjcmVhdGUgd2FsbGV0IGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgbW9kdWxlLmNyZWF0ZV9rZXlzX3dhbGxldF9mcm9tX2tleXMoSlNPTi5zdHJpbmdpZnkoY29uZmlnLnRvSnNvbigpKSwgKGNwcEFkZHJlc3MpID0+IHtcbiAgICAgICAgICBpZiAodHlwZW9mIGNwcEFkZHJlc3MgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoY3BwQWRkcmVzcykpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvV2FsbGV0S2V5cyhjcHBBZGRyZXNzKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIHN0YXRpYyBhc3luYyBnZXRTZWVkTGFuZ3VhZ2VzKCk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBsZXQgbW9kdWxlID0gYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRLZXlzTW9kdWxlKCk7XG4gICAgcmV0dXJuIG1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgcmV0dXJuIEpTT04ucGFyc2UobW9kdWxlLmdldF9rZXlzX3dhbGxldF9zZWVkX2xhbmd1YWdlcygpKS5sYW5ndWFnZXM7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBJTlNUQU5DRSBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICAvKipcbiAgICogSW50ZXJuYWwgY29uc3RydWN0b3Igd2hpY2ggaXMgZ2l2ZW4gdGhlIG1lbW9yeSBhZGRyZXNzIG9mIGEgQysrIHdhbGxldFxuICAgKiBpbnN0YW5jZS5cbiAgICogXG4gICAqIFRoaXMgbWV0aG9kIHNob3VsZCBub3QgYmUgY2FsbGVkIGV4dGVybmFsbHkgYnV0IHNob3VsZCBiZSBjYWxsZWQgdGhyb3VnaFxuICAgKiBzdGF0aWMgd2FsbGV0IGNyZWF0aW9uIHV0aWxpdGllcyBpbiB0aGlzIGNsYXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGNwcEFkZHJlc3MgLSBhZGRyZXNzIG9mIHRoZSB3YWxsZXQgaW5zdGFuY2UgaW4gQysrXG4gICAqIEBwYXJhbSB7TW9uZXJvV2FsbGV0S2V5c1Byb3h5fSB3YWxsZXRQcm94eSAtIHByb3h5XG4gICAqIFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgY29uc3RydWN0b3IoY3BwQWRkcmVzcywgd2FsbGV0UHJveHk/OiBNb25lcm9XYWxsZXRLZXlzUHJveHkpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX2lzQ2xvc2VkID0gZmFsc2U7XG4gICAgaWYgKCFjcHBBZGRyZXNzICYmICF3YWxsZXRQcm94eSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGNwcEFkZHJlc3Mgb3Igd2FsbGV0UHJveHlcIik7XG4gICAgaWYgKHdhbGxldFByb3h5KSB0aGlzLndhbGxldFByb3h5ID0gd2FsbGV0UHJveHk7XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLmNwcEFkZHJlc3MgPSBjcHBBZGRyZXNzO1xuICAgICAgdGhpcy5tb2R1bGUgPSBMaWJyYXJ5VXRpbHMuZ2V0V2FzbU1vZHVsZSgpO1xuICAgICAgaWYgKCF0aGlzLm1vZHVsZS5jcmVhdGVfZnVsbF93YWxsZXQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldBU00gbW9kdWxlIG5vdCBsb2FkZWQgLSBjcmVhdGUgd2FsbGV0IGluc3RhbmNlIHVzaW5nIHN0YXRpYyB1dGlsaXRpZXNcIik7ICAvLyBzdGF0aWMgdXRpbGl0ZXMgcHJlLWxvYWQgd2FzbSBtb2R1bGVcbiAgICB9XG4gIH1cbiAgXG4gIGFzeW5jIGFkZExpc3RlbmVyKGxpc3RlbmVyOiBNb25lcm9XYWxsZXRMaXN0ZW5lcik6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk1vbmVyb1dhbGxldEtleXMgZG9lcyBub3Qgc3VwcG9ydCBhZGRpbmcgbGlzdGVuZXJzXCIpO1xuICB9XG4gIFxuICBhc3luYyByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk1vbmVyb1dhbGxldEtleXMgZG9lcyBub3Qgc3VwcG9ydCByZW1vdmluZyBsaXN0ZW5lcnNcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGlzVmlld09ubHkoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5pc1ZpZXdPbmx5KCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgcmV0dXJuIHRoaXMubW9kdWxlLmlzX3ZpZXdfb25seSh0aGlzLmNwcEFkZHJlc3MpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBpc0Nvbm5lY3RlZFRvRGFlbW9uKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaXNDb25uZWN0ZWRUb0RhZW1vbigpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGFzeW5jIGdldFZlcnNpb24oKTogUHJvbWlzZTxNb25lcm9WZXJzaW9uPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRWZXJzaW9uKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IHZlcnNpb25TdHIgPSB0aGlzLm1vZHVsZS5nZXRfdmVyc2lvbih0aGlzLmNwcEFkZHJlc3MpO1xuICAgICAgbGV0IHZlcnNpb25Kc29uID0gSlNPTi5wYXJzZSh2ZXJzaW9uU3RyKTtcbiAgICAgIHJldHVybiBuZXcgTW9uZXJvVmVyc2lvbih2ZXJzaW9uSnNvbi5udW1iZXIsIHZlcnNpb25Kc29uLmlzUmVsZWFzZSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBAaWdub3JlXG4gICAqL1xuICBnZXRQYXRoKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTW9uZXJvV2FsbGV0S2V5cyBkb2VzIG5vdCBzdXBwb3J0IGEgcGVyc2lzdGVkIHBhdGhcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFNlZWQoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFNlZWQoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgcmVzcCA9IHRoaXMubW9kdWxlLmdldF9zZWVkKHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgICBjb25zdCBlcnJvclN0ciA9IFwiZXJyb3I6IFwiO1xuICAgICAgaWYgKHJlc3AuaW5kZXhPZihlcnJvclN0cikgPT09IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihyZXNwLnN1YnN0cmluZyhlcnJvclN0ci5sZW5ndGgpKTtcbiAgICAgIHJldHVybiByZXNwID8gcmVzcCA6IHVuZGVmaW5lZDtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0U2VlZExhbmd1YWdlKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRTZWVkTGFuZ3VhZ2UoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgcmVzcCA9IHRoaXMubW9kdWxlLmdldF9zZWVkX2xhbmd1YWdlKHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgICBsZXQgZXJyb3JLZXkgPSBcImVycm9yOiBcIjtcbiAgICAgIGlmIChyZXNwLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IocmVzcC5zdWJzdHJpbmcoZXJyb3JLZXkubGVuZ3RoKSk7XG4gICAgICByZXR1cm4gcmVzcCA/IHJlc3AgOiB1bmRlZmluZWQ7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBnZXRQcml2YXRlU3BlbmRLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFByaXZhdGVTcGVuZEtleSgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCByZXNwID0gdGhpcy5tb2R1bGUuZ2V0X3ByaXZhdGVfc3BlbmRfa2V5KHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgICBsZXQgZXJyb3JLZXkgPSBcImVycm9yOiBcIjtcbiAgICAgIGlmIChyZXNwLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IocmVzcC5zdWJzdHJpbmcoZXJyb3JLZXkubGVuZ3RoKSk7XG4gICAgICByZXR1cm4gcmVzcCA/IHJlc3AgOiB1bmRlZmluZWQ7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFByaXZhdGVWaWV3S2V5KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRQcml2YXRlVmlld0tleSgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCByZXNwID0gdGhpcy5tb2R1bGUuZ2V0X3ByaXZhdGVfdmlld19rZXkodGhpcy5jcHBBZGRyZXNzKTtcbiAgICAgIGxldCBlcnJvcktleSA9IFwiZXJyb3I6IFwiO1xuICAgICAgaWYgKHJlc3AuaW5kZXhPZihlcnJvcktleSkgPT09IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihyZXNwLnN1YnN0cmluZyhlcnJvcktleS5sZW5ndGgpKTtcbiAgICAgIHJldHVybiByZXNwID8gcmVzcCA6IHVuZGVmaW5lZDtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UHVibGljVmlld0tleSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0UHVibGljVmlld0tleSgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCByZXNwID0gdGhpcy5tb2R1bGUuZ2V0X3B1YmxpY192aWV3X2tleSh0aGlzLmNwcEFkZHJlc3MpO1xuICAgICAgbGV0IGVycm9yS2V5ID0gXCJlcnJvcjogXCI7XG4gICAgICBpZiAocmVzcC5pbmRleE9mKGVycm9yS2V5KSA9PT0gMCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHJlc3Auc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCkpO1xuICAgICAgcmV0dXJuIHJlc3AgPyByZXNwIDogdW5kZWZpbmVkO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRQdWJsaWNTcGVuZEtleSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0UHVibGljU3BlbmRLZXkoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgcmVzcCA9IHRoaXMubW9kdWxlLmdldF9wdWJsaWNfc3BlbmRfa2V5KHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgICBsZXQgZXJyb3JLZXkgPSBcImVycm9yOiBcIjtcbiAgICAgIGlmIChyZXNwLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IocmVzcC5zdWJzdHJpbmcoZXJyb3JLZXkubGVuZ3RoKSk7XG4gICAgICByZXR1cm4gcmVzcCA/IHJlc3AgOiB1bmRlZmluZWQ7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFkZHJlc3MoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0QWRkcmVzcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTtcbiAgICBhc3NlcnQodHlwZW9mIGFjY291bnRJZHggPT09IFwibnVtYmVyXCIpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5nZXRfYWRkcmVzcyh0aGlzLmNwcEFkZHJlc3MsIGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRBZGRyZXNzSW5kZXgoYWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRBZGRyZXNzSW5kZXgoYWRkcmVzcyk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IHJlc3AgPSB0aGlzLm1vZHVsZS5nZXRfYWRkcmVzc19pbmRleCh0aGlzLmNwcEFkZHJlc3MsIGFkZHJlc3MpO1xuICAgICAgaWYgKHJlc3AuY2hhckF0KDApICE9PSAneycpIHRocm93IG5ldyBNb25lcm9FcnJvcihyZXNwKTtcbiAgICAgIHJldHVybiBuZXcgTW9uZXJvU3ViYWRkcmVzcyhKU09OLnBhcnNlKHJlc3ApKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWNjb3VudHMoaW5jbHVkZVN1YmFkZHJlc3Nlcz86IGJvb2xlYW4sIHRhZz86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQWNjb3VudFtdPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRBY2NvdW50cygpO1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk1vbmVyb1dhbGxldEtleXMgZG9lcyBub3Qgc3VwcG9ydCBnZXR0aW5nIGFuIGVudW1lcmFibGUgc2V0IG9mIGFjY291bnRzOyBxdWVyeSBzcGVjaWZpYyBhY2NvdW50c1wiKTtcbiAgfVxuICBcbiAgLy8gZ2V0SW50ZWdyYXRlZEFkZHJlc3MocGF5bWVudElkKSAgLy8gVE9ET1xuICAvLyBkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzc1xuICBcbiAgYXN5bmMgY2xvc2Uoc2F2ZSA9IGZhbHNlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuX2lzQ2xvc2VkKSByZXR1cm47IC8vIG5vIGVmZmVjdCBpZiBjbG9zZWRcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSB7XG4gICAgICBhd2FpdCB0aGlzLmdldFdhbGxldFByb3h5KCkuY2xvc2Uoc2F2ZSk7XG4gICAgICB0aGlzLl9pc0Nsb3NlZCA9IHRydWU7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIFxuICAgIC8vIHNhdmUgd2FsbGV0IGlmIHJlcXVlc3RlZFxuICAgIGlmIChzYXZlKSBhd2FpdCB0aGlzLnNhdmUoKTtcblxuICAgIC8vIGNsb3NlIHN1cGVyXG4gICAgYXdhaXQgc3VwZXIuY2xvc2UoKTtcblxuICAgIC8vIHF1ZXVlIHRhc2sgdG8gdXNlIHdhc20gbW9kdWxlXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5faXNDbG9zZWQpIHtcbiAgICAgICAgICByZXNvbHZlKHVuZGVmaW5lZCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBjbG9zZSB3YWxsZXQgaW4gd2FzbSBhbmQgaW52b2tlIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICB0aGlzLm1vZHVsZS5jbG9zZSh0aGlzLmNwcEFkZHJlc3MsIGZhbHNlLCBhc3luYyAoKSA9PiB7IC8vIHNhdmluZyBoYW5kbGVkIGV4dGVybmFsIHRvIHdlYmFzc2VtYmx5XG4gICAgICAgICAgZGVsZXRlIHRoaXMuY3BwQWRkcmVzcztcbiAgICAgICAgICB0aGlzLl9pc0Nsb3NlZCA9IHRydWU7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBpc0Nsb3NlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICByZXR1cm4gdGhpcy5faXNDbG9zZWQ7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tIEFERCBKU0RPQyBGT1IgU1VQUE9SVEVEIERFRkFVTFQgSU1QTEVNRU5UQVRJT05TIC0tLS0tLS0tLS0tLS0tXG4gIFxuICBhc3luYyBnZXRQcmltYXJ5QWRkcmVzcygpOiBQcm9taXNlPHN0cmluZz4geyByZXR1cm4gc3VwZXIuZ2V0UHJpbWFyeUFkZHJlc3MoKTsgfVxuICBhc3luYyBnZXRTdWJhZGRyZXNzKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0lkeDogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7IHJldHVybiBzdXBlci5nZXRTdWJhZGRyZXNzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpOyB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIEhFTFBFUlMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHN0YXRpYyBzYW5pdGl6ZVN1YmFkZHJlc3Moc3ViYWRkcmVzcykge1xuICAgIGlmIChzdWJhZGRyZXNzLmdldExhYmVsKCkgPT09IFwiXCIpIHN1YmFkZHJlc3Muc2V0TGFiZWwodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gc3ViYWRkcmVzc1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXNzZXJ0Tm90Q2xvc2VkKCkge1xuICAgIGlmICh0aGlzLl9pc0Nsb3NlZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGlzIGNsb3NlZFwiKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBnZXRXYWxsZXRQcm94eSgpOiBNb25lcm9XYWxsZXRLZXlzUHJveHkge1xuICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgcmV0dXJuIHRoaXMud2FsbGV0UHJveHk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbXBsZW1lbnRzIGEgTW9uZXJvV2FsbGV0IGJ5IHByb3h5aW5nIHJlcXVlc3RzIHRvIGEgd29ya2VyIHdoaWNoIHJ1bnMgYSBrZXlzLW9ubHkgd2FsbGV0LlxuICogXG4gKiBUT0RPOiBzb3J0IHRoZXNlIG1ldGhvZHMgYWNjb3JkaW5nIHRvIG1hc3RlciBzb3J0IGluIE1vbmVyb1dhbGxldC50c1xuICogVE9ETzogcHJvYmFibHkgb25seSBhbGxvdyBvbmUgbGlzdGVuZXIgdG8gd29ya2VyIHRoZW4gcHJvcG9nYXRlIHRvIHJlZ2lzdGVyZWQgbGlzdGVuZXJzIGZvciBwZXJmb3JtYW5jZVxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnQgY2xhc3MgTW9uZXJvV2FsbGV0S2V5c1Byb3h5IGV4dGVuZHMgTW9uZXJvV2FsbGV0IHtcblxuICAvLyBzdGF0ZSB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIHdhbGxldElkOiBzdHJpbmc7XG4gIHByb3RlY3RlZCB3b3JrZXI6IFdvcmtlcjtcbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFdBTExFVCBTVEFUSUMgVVRJTFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICBzdGF0aWMgYXN5bmMgY3JlYXRlV2FsbGV0KGNvbmZpZykge1xuICAgIGxldCB3YWxsZXRJZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICBhd2FpdCBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKHdhbGxldElkLCBcImNyZWF0ZVdhbGxldEtleXNcIiwgW2NvbmZpZy50b0pzb24oKV0pO1xuICAgIHJldHVybiBuZXcgTW9uZXJvV2FsbGV0S2V5c1Byb3h5KHdhbGxldElkLCBhd2FpdCBMaWJyYXJ5VXRpbHMuZ2V0V29ya2VyKCkpO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gSU5TVEFOQ0UgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICAvKipcbiAgICogSW50ZXJuYWwgY29uc3RydWN0b3Igd2hpY2ggaXMgZ2l2ZW4gYSB3b3JrZXIgdG8gY29tbXVuaWNhdGUgd2l0aCB2aWEgbWVzc2FnZXMuXG4gICAqIFxuICAgKiBUaGlzIG1ldGhvZCBzaG91bGQgbm90IGJlIGNhbGxlZCBleHRlcm5hbGx5IGJ1dCBzaG91bGQgYmUgY2FsbGVkIHRocm91Z2hcbiAgICogc3RhdGljIHdhbGxldCBjcmVhdGlvbiB1dGlsaXRpZXMgaW4gdGhpcyBjbGFzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB3YWxsZXRJZCAtIGlkZW50aWZpZXMgdGhlIHdhbGxldCB3aXRoIHRoZSB3b3JrZXJcbiAgICogQHBhcmFtIHtXb3JrZXJ9IHdvcmtlciAtIHdvcmtlciB0byBjb21tdW5pY2F0ZSB3aXRoIHZpYSBtZXNzYWdlc1xuICAgKiBcbiAgICogQHByb3RlY3RlZFxuICAgKi9cbiAgY29uc3RydWN0b3Iod2FsbGV0SWQsIHdvcmtlcikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy53YWxsZXRJZCA9IHdhbGxldElkO1xuICAgIHRoaXMud29ya2VyID0gd29ya2VyO1xuICB9XG4gIFxuICBhc3luYyBpc1ZpZXdPbmx5KCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImlzVmlld09ubHlcIik7XG4gIH1cblxuICBhc3luYyBnZXRWZXJzaW9uKCk6IFByb21pc2U8TW9uZXJvVmVyc2lvbj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuXG4gIGFzeW5jIGdldFNlZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0U2VlZFwiKSBhcyBQcm9taXNlPHN0cmluZz47XG4gIH1cbiAgXG4gIGFzeW5jIGdldFNlZWRMYW5ndWFnZSgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRTZWVkTGFuZ3VhZ2VcIikgYXMgUHJvbWlzZTxzdHJpbmc+O1xuICB9XG4gIFxuICBhc3luYyBnZXRTZWVkTGFuZ3VhZ2VzKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldFNlZWRMYW5ndWFnZXNcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFByaXZhdGVTcGVuZEtleSgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRQcml2YXRlU3BlbmRLZXlcIikgYXMgUHJvbWlzZTxzdHJpbmc+O1xuICB9XG4gIFxuICBhc3luYyBnZXRQcml2YXRlVmlld0tleSgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRQcml2YXRlVmlld0tleVwiKSBhcyBQcm9taXNlPHN0cmluZz47XG4gIH1cbiAgXG4gIGFzeW5jIGdldFB1YmxpY1ZpZXdLZXkoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0UHVibGljVmlld0tleVwiKSBhcyBQcm9taXNlPHN0cmluZz47XG4gIH1cbiAgXG4gIGFzeW5jIGdldFB1YmxpY1NwZW5kS2V5KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldFB1YmxpY1NwZW5kS2V5XCIpIGFzIFByb21pc2U8c3RyaW5nPjtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWRkcmVzcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0QWRkcmVzc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpIGFzIFByb21pc2U8c3RyaW5nPjtcbiAgfVxuXG4gIGFzeW5jIGdldEFkZHJlc3NJbmRleChhZGRyZXNzKSB7XG4gICAgbGV0IHN1YmFkZHJlc3NKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRBZGRyZXNzSW5kZXhcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0S2V5cy5zYW5pdGl6ZVN1YmFkZHJlc3MobmV3IE1vbmVyb1N1YmFkZHJlc3Moc3ViYWRkcmVzc0pzb24pKTtcbiAgfVxuXG4gIGFzeW5jIGdldEludGVncmF0ZWRBZGRyZXNzKHN0YW5kYXJkQWRkcmVzcywgcGF5bWVudElkKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldEludGVncmF0ZWRBZGRyZXNzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyhpbnRlZ3JhdGVkQWRkcmVzcykge1xuICAgIHJldHVybiBuZXcgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuXG4gIGFzeW5jIGNsb3NlKHNhdmUpIHtcbiAgICBpZiAoc2F2ZSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHNhdmUga2V5cy1vbmx5IHdhbGxldFwiKTtcbiAgICBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImNsb3NlXCIpO1xuICAgIExpYnJhcnlVdGlscy5yZW1vdmVXb3JrZXJPYmplY3QodGhpcy53YWxsZXRJZCk7XG4gIH1cbiAgXG4gIGFzeW5jIGlzQ2xvc2VkKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImlzQ2xvc2VkXCIpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIGludm9rZVdvcmtlcihmbk5hbWU6IHN0cmluZywgYXJncz86IGFueSk6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIGF3YWl0IExpYnJhcnlVdGlscy5pbnZva2VXb3JrZXIodGhpcy53YWxsZXRJZCwgZm5OYW1lLCBhcmdzKTtcbiAg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