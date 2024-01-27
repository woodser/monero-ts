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
    if (this._isClosed) return; // no effect if closed
    if (this.getWalletProxy()) {
      await this.getWalletProxy().close(save);
      await super.close();
      this._isClosed = true;
      return;
    }

    // save wallet if requested
    if (save) await this.save();

    // close super
    await super.close();
    this._isClosed = true;

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfR2VuVXRpbHMiLCJfTGlicmFyeVV0aWxzIiwiX01vbmVyb0Vycm9yIiwiX01vbmVyb0ludGVncmF0ZWRBZGRyZXNzIiwiX01vbmVyb05ldHdvcmtUeXBlIiwiX01vbmVyb1N1YmFkZHJlc3MiLCJfTW9uZXJvVmVyc2lvbiIsIl9Nb25lcm9XYWxsZXQiLCJfTW9uZXJvV2FsbGV0Q29uZmlnIiwiTW9uZXJvV2FsbGV0S2V5cyIsIk1vbmVyb1dhbGxldCIsImNyZWF0ZVdhbGxldCIsImNvbmZpZyIsInVuZGVmaW5lZCIsIk1vbmVyb0Vycm9yIiwiTW9uZXJvV2FsbGV0Q29uZmlnIiwiZ2V0U2VlZCIsImdldFByaW1hcnlBZGRyZXNzIiwiZ2V0UHJpdmF0ZVZpZXdLZXkiLCJnZXRQcml2YXRlU3BlbmRLZXkiLCJnZXROZXR3b3JrVHlwZSIsImdldFNhdmVDdXJyZW50IiwiZ2V0UHJveHlUb1dvcmtlciIsInNldFByb3h5VG9Xb3JrZXIiLCJ3YWxsZXRQcm94eSIsIk1vbmVyb1dhbGxldEtleXNQcm94eSIsImNyZWF0ZVdhbGxldEZyb21TZWVkIiwiY3JlYXRlV2FsbGV0RnJvbUtleXMiLCJjcmVhdGVXYWxsZXRSYW5kb20iLCJjb3B5IiwiZ2V0U2VlZE9mZnNldCIsImdldFJlc3RvcmVIZWlnaHQiLCJNb25lcm9OZXR3b3JrVHlwZSIsInZhbGlkYXRlIiwiZ2V0TGFuZ3VhZ2UiLCJzZXRMYW5ndWFnZSIsIm1vZHVsZSIsIkxpYnJhcnlVdGlscyIsImxvYWRLZXlzTW9kdWxlIiwicXVldWVUYXNrIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJjcmVhdGVfa2V5c193YWxsZXRfcmFuZG9tIiwiSlNPTiIsInN0cmluZ2lmeSIsInRvSnNvbiIsImNwcEFkZHJlc3MiLCJFcnJvciIsInNldFNlZWRPZmZzZXQiLCJjcmVhdGVfa2V5c193YWxsZXRfZnJvbV9zZWVkIiwic2V0UHJpbWFyeUFkZHJlc3MiLCJzZXRQcml2YXRlVmlld0tleSIsInNldFByaXZhdGVTcGVuZEtleSIsImNyZWF0ZV9rZXlzX3dhbGxldF9mcm9tX2tleXMiLCJnZXRTZWVkTGFuZ3VhZ2VzIiwicGFyc2UiLCJnZXRfa2V5c193YWxsZXRfc2VlZF9sYW5ndWFnZXMiLCJsYW5ndWFnZXMiLCJjb25zdHJ1Y3RvciIsImdldFdhc21Nb2R1bGUiLCJjcmVhdGVfZnVsbF93YWxsZXQiLCJpc1ZpZXdPbmx5IiwiZ2V0V2FsbGV0UHJveHkiLCJhc3NlcnROb3RDbG9zZWQiLCJpc192aWV3X29ubHkiLCJpc0Nvbm5lY3RlZFRvRGFlbW9uIiwiZ2V0VmVyc2lvbiIsInZlcnNpb25TdHIiLCJnZXRfdmVyc2lvbiIsInZlcnNpb25Kc29uIiwiTW9uZXJvVmVyc2lvbiIsIm51bWJlciIsImlzUmVsZWFzZSIsImdldFBhdGgiLCJyZXNwIiwiZ2V0X3NlZWQiLCJlcnJvclN0ciIsImluZGV4T2YiLCJzdWJzdHJpbmciLCJsZW5ndGgiLCJnZXRTZWVkTGFuZ3VhZ2UiLCJnZXRfc2VlZF9sYW5ndWFnZSIsImVycm9yS2V5IiwiZ2V0X3ByaXZhdGVfc3BlbmRfa2V5IiwiZ2V0X3ByaXZhdGVfdmlld19rZXkiLCJnZXRQdWJsaWNWaWV3S2V5IiwiZ2V0X3B1YmxpY192aWV3X2tleSIsImdldFB1YmxpY1NwZW5kS2V5IiwiZ2V0X3B1YmxpY19zcGVuZF9rZXkiLCJnZXRBZGRyZXNzIiwiYWNjb3VudElkeCIsInN1YmFkZHJlc3NJZHgiLCJhc3NlcnQiLCJnZXRfYWRkcmVzcyIsImdldEFkZHJlc3NJbmRleCIsImFkZHJlc3MiLCJnZXRfYWRkcmVzc19pbmRleCIsImNoYXJBdCIsIk1vbmVyb1N1YmFkZHJlc3MiLCJnZXRBY2NvdW50cyIsImluY2x1ZGVTdWJhZGRyZXNzZXMiLCJ0YWciLCJjbG9zZSIsInNhdmUiLCJfaXNDbG9zZWQiLCJpc0Nsb3NlZCIsImdldFN1YmFkZHJlc3MiLCJzYW5pdGl6ZVN1YmFkZHJlc3MiLCJzdWJhZGRyZXNzIiwiZ2V0TGFiZWwiLCJzZXRMYWJlbCIsImV4cG9ydHMiLCJ3YWxsZXRJZCIsIkdlblV0aWxzIiwiZ2V0VVVJRCIsImludm9rZVdvcmtlciIsImdldFdvcmtlciIsIndvcmtlciIsIkFycmF5IiwiZnJvbSIsImFyZ3VtZW50cyIsInN1YmFkZHJlc3NKc29uIiwiZ2V0SW50ZWdyYXRlZEFkZHJlc3MiLCJzdGFuZGFyZEFkZHJlc3MiLCJwYXltZW50SWQiLCJNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsImRlY29kZUludGVncmF0ZWRBZGRyZXNzIiwiaW50ZWdyYXRlZEFkZHJlc3MiLCJyZW1vdmVXb3JrZXJPYmplY3QiLCJmbk5hbWUiLCJhcmdzIl0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvd2FsbGV0L01vbmVyb1dhbGxldEtleXMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XG5pbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9HZW5VdGlsc1wiO1xuaW1wb3J0IExpYnJhcnlVdGlscyBmcm9tIFwiLi4vY29tbW9uL0xpYnJhcnlVdGlsc1wiO1xuaW1wb3J0IE1vbmVyb0FjY291bnQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWNjb3VudFwiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuLi9jb21tb24vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb05ldHdvcmtUeXBlIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvTmV0d29ya1R5cGVcIjtcbmltcG9ydCBNb25lcm9TdWJhZGRyZXNzIGZyb20gXCIuL21vZGVsL01vbmVyb1N1YmFkZHJlc3NcIjtcbmltcG9ydCBNb25lcm9WZXJzaW9uIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvVmVyc2lvblwiO1xuaW1wb3J0IE1vbmVyb1dhbGxldCBmcm9tIFwiLi9Nb25lcm9XYWxsZXRcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRDb25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvV2FsbGV0Q29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0TGlzdGVuZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvV2FsbGV0TGlzdGVuZXJcIjtcblxuLyoqXG4gKiBJbXBsZW1lbnRzIGEgTW9uZXJvV2FsbGV0IHdoaWNoIG9ubHkgbWFuYWdlcyBrZXlzIHVzaW5nIFdlYkFzc2VtYmx5LlxuICovXG5leHBvcnQgY2xhc3MgTW9uZXJvV2FsbGV0S2V5cyBleHRlbmRzIE1vbmVyb1dhbGxldCB7XG5cbiAgLy8gaW5zdGFuY2UgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBjcHBBZGRyZXNzOiBzdHJpbmc7XG4gIHByb3RlY3RlZCBtb2R1bGU6IGFueTtcbiAgcHJvdGVjdGVkIHdhbGxldFByb3h5OiBNb25lcm9XYWxsZXRLZXlzUHJveHk7XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gU1RBVElDIFVUSUxJVElFUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgLyoqXG4gICAqIDxwPkNyZWF0ZSBhIHdhbGxldCB1c2luZyBXZWJBc3NlbWJseSBiaW5kaW5ncyB0byBtb25lcm8tcHJvamVjdC48L3A+XG4gICAqIFxuICAgKiA8cD5FeGFtcGxlOjwvcD5cbiAgICogXG4gICAqIDxjb2RlPlxuICAgKiBsZXQgd2FsbGV0ID0gYXdhaXQgTW9uZXJvV2FsbGV0S2V5cy5jcmVhdGVXYWxsZXQoezxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHBhc3N3b3JkOiBcImFiYzEyM1wiLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IG5ldHdvcmtUeXBlOiBNb25lcm9OZXR3b3JrVHlwZS5TVEFHRU5FVCw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBzZWVkOiBcImNvZXhpc3QgaWdsb28gcGFtcGhsZXQgbGFnb29uLi4uXCI8YnI+XG4gICAqIH0pO1xuICAgKiA8L2NvZGU+XG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1dhbGxldENvbmZpZ30gY29uZmlnIC0gTW9uZXJvV2FsbGV0Q29uZmlnIG9yIGVxdWl2YWxlbnQgY29uZmlnIG9iamVjdFxuICAgKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IGNvbmZpZy5uZXR3b3JrVHlwZSAtIG5ldHdvcmsgdHlwZSBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob25lIG9mIFwibWFpbm5ldFwiLCBcInRlc3RuZXRcIiwgXCJzdGFnZW5ldFwiIG9yIE1vbmVyb05ldHdvcmtUeXBlLk1BSU5ORVR8VEVTVE5FVHxTVEFHRU5FVClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VlZF0gLSBzZWVkIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbCwgcmFuZG9tIHdhbGxldCBjcmVhdGVkIGlmIG5laXRoZXIgc2VlZCBub3Iga2V5cyBnaXZlbilcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VlZE9mZnNldF0gLSB0aGUgb2Zmc2V0IHVzZWQgdG8gZGVyaXZlIGEgbmV3IHNlZWQgZnJvbSB0aGUgZ2l2ZW4gc2VlZCB0byByZWNvdmVyIGEgc2VjcmV0IHdhbGxldCBmcm9tIHRoZSBzZWVkIHBocmFzZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wcmltYXJ5QWRkcmVzc10gLSBwcmltYXJ5IGFkZHJlc3Mgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9ubHkgcHJvdmlkZSBpZiByZXN0b3JpbmcgZnJvbSBrZXlzKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wcml2YXRlVmlld0tleV0gLSBwcml2YXRlIHZpZXcga2V5IG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpdmF0ZVNwZW5kS2V5XSAtIHByaXZhdGUgc3BlbmQga2V5IG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcubGFuZ3VhZ2VdIC0gbGFuZ3VhZ2Ugb2YgdGhlIHdhbGxldCdzIHNlZWQgKGRlZmF1bHRzIHRvIFwiRW5nbGlzaFwiIG9yIGF1dG8tZGV0ZWN0ZWQpXG4gICAqIEByZXR1cm4ge01vbmVyb1dhbGxldEtleXN9IHRoZSBjcmVhdGVkIHdhbGxldFxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGNyZWF0ZVdhbGxldChjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPikge1xuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSBhbmQgdmFsaWRhdGUgY29uZmlnXG4gICAgaWYgKGNvbmZpZyA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgY29uZmlnIHRvIGNyZWF0ZSB3YWxsZXRcIik7XG4gICAgY29uZmlnID0gY29uZmlnIGluc3RhbmNlb2YgTW9uZXJvV2FsbGV0Q29uZmlnID8gY29uZmlnIDogbmV3IE1vbmVyb1dhbGxldENvbmZpZyhjb25maWcpO1xuICAgIGlmIChjb25maWcuZ2V0U2VlZCgpICE9PSB1bmRlZmluZWQgJiYgKGNvbmZpZy5nZXRQcmltYXJ5QWRkcmVzcygpICE9PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldFByaXZhdGVWaWV3S2V5KCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWcuZ2V0UHJpdmF0ZVNwZW5kS2V5KCkgIT09IHVuZGVmaW5lZCkpIHtcbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIldhbGxldCBtYXkgYmUgaW5pdGlhbGl6ZWQgd2l0aCBhIHNlZWQgb3Iga2V5cyBidXQgbm90IGJvdGhcIik7XG4gICAgfVxuICAgIGlmIChjb25maWcuZ2V0TmV0d29ya1R5cGUoKSA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgYSBuZXR3b3JrVHlwZTogJ21haW5uZXQnLCAndGVzdG5ldCcgb3IgJ3N0YWdlbmV0J1wiKTtcbiAgICBpZiAoY29uZmlnLmdldFNhdmVDdXJyZW50KCkgPT09IHRydWUpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBzYXZlIGN1cnJlbnQgd2FsbGV0IHdoZW4gY3JlYXRpbmcga2V5cy1vbmx5IHdhbGxldFwiKTtcblxuICAgIC8vIGluaXRpYWxpemUgcHJveGllZCB3YWxsZXQgaWYgY29uZmlndXJlZFxuICAgIGlmIChjb25maWcuZ2V0UHJveHlUb1dvcmtlcigpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRQcm94eVRvV29ya2VyKHRydWUpO1xuICAgIGlmIChjb25maWcuZ2V0UHJveHlUb1dvcmtlcigpKSB7XG4gICAgICBsZXQgd2FsbGV0UHJveHkgPSBhd2FpdCBNb25lcm9XYWxsZXRLZXlzUHJveHkuY3JlYXRlV2FsbGV0KGNvbmZpZyk7O1xuICAgICAgcmV0dXJuIG5ldyBNb25lcm9XYWxsZXRLZXlzKHVuZGVmaW5lZCwgd2FsbGV0UHJveHkpO1xuICAgIH1cbiAgICBcbiAgICAvLyBjcmVhdGUgd2FsbGV0XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkKCkgIT09IHVuZGVmaW5lZCkgcmV0dXJuIE1vbmVyb1dhbGxldEtleXMuY3JlYXRlV2FsbGV0RnJvbVNlZWQoY29uZmlnKTtcbiAgICBlbHNlIGlmIChjb25maWcuZ2V0UHJpdmF0ZVNwZW5kS2V5KCkgIT09IHVuZGVmaW5lZCB8fCBjb25maWcuZ2V0UHJpbWFyeUFkZHJlc3MoKSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gTW9uZXJvV2FsbGV0S2V5cy5jcmVhdGVXYWxsZXRGcm9tS2V5cyhjb25maWcpO1xuICAgIGVsc2UgcmV0dXJuIE1vbmVyb1dhbGxldEtleXMuY3JlYXRlV2FsbGV0UmFuZG9tKGNvbmZpZyk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgY3JlYXRlV2FsbGV0UmFuZG9tKGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KSB7XG5cbiAgICAvLyB2YWxpZGF0ZSBhbmQgc2FuaXRpemUgcGFyYW1zXG4gICAgY29uZmlnID0gY29uZmlnLmNvcHkoKTtcbiAgICBpZiAoY29uZmlnLmdldFNlZWRPZmZzZXQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSBzZWVkT2Zmc2V0IHdoZW4gY3JlYXRpbmcgcmFuZG9tIHdhbGxldFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFJlc3RvcmVIZWlnaHQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSByZXN0b3JlSGVpZ2h0IHdoZW4gY3JlYXRpbmcgcmFuZG9tIHdhbGxldFwiKTtcbiAgICBNb25lcm9OZXR3b3JrVHlwZS52YWxpZGF0ZShjb25maWcuZ2V0TmV0d29ya1R5cGUoKSk7XG4gICAgaWYgKGNvbmZpZy5nZXRMYW5ndWFnZSgpID09PSB1bmRlZmluZWQpIGNvbmZpZy5zZXRMYW5ndWFnZShcIkVuZ2xpc2hcIik7XG4gICAgXG4gICAgLy8gbG9hZCB3YXNtIG1vZHVsZVxuICAgIGxldCBtb2R1bGUgPSBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZEtleXNNb2R1bGUoKTtcbiAgICBcbiAgICAvLyBxdWV1ZSBjYWxsIHRvIHdhc20gbW9kdWxlXG4gICAgcmV0dXJuIG1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgXG4gICAgICAgIC8vIGNyZWF0ZSB3YWxsZXQgaW4gd2FzbSB3aGljaCBpbnZva2VzIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICBtb2R1bGUuY3JlYXRlX2tleXNfd2FsbGV0X3JhbmRvbShKU09OLnN0cmluZ2lmeShjb25maWcudG9Kc29uKCkpLCAoY3BwQWRkcmVzcykgPT4ge1xuICAgICAgICAgIGlmICh0eXBlb2YgY3BwQWRkcmVzcyA9PT0gXCJzdHJpbmdcIikgcmVqZWN0KG5ldyBNb25lcm9FcnJvcihjcHBBZGRyZXNzKSk7XG4gICAgICAgICAgZWxzZSByZXNvbHZlKG5ldyBNb25lcm9XYWxsZXRLZXlzKGNwcEFkZHJlc3MpKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBhc3luYyBjcmVhdGVXYWxsZXRGcm9tU2VlZChjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPikge1xuICAgIFxuICAgIC8vIHZhbGlkYXRlIGFuZCBzYW5pdGl6ZSBwYXJhbXNcbiAgICBNb25lcm9OZXR3b3JrVHlwZS52YWxpZGF0ZShjb25maWcuZ2V0TmV0d29ya1R5cGUoKSk7XG4gICAgaWYgKGNvbmZpZy5nZXRTZWVkKCkgPT09IHVuZGVmaW5lZCkgdGhyb3cgRXJyb3IoXCJNdXN0IGRlZmluZSBzZWVkIHRvIGNyZWF0ZSB3YWxsZXQgZnJvbVwiKTtcbiAgICBpZiAoY29uZmlnLmdldFNlZWRPZmZzZXQoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0U2VlZE9mZnNldChcIlwiKTtcbiAgICBpZiAoY29uZmlnLmdldExhbmd1YWdlKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgbGFuZ3VhZ2Ugd2hlbiBjcmVhdGluZyB3YWxsZXQgZnJvbSBzZWVkXCIpO1xuICAgIFxuICAgIC8vIGxvYWQgd2FzbSBtb2R1bGVcbiAgICBsZXQgbW9kdWxlID0gYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRLZXlzTW9kdWxlKCk7XG4gICAgXG4gICAgLy8gcXVldWUgY2FsbCB0byB3YXNtIG1vZHVsZVxuICAgIHJldHVybiBtb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgLy8gY3JlYXRlIHdhbGxldCBpbiB3YXNtIHdoaWNoIGludm9rZXMgY2FsbGJhY2sgd2hlbiBkb25lXG4gICAgICAgIG1vZHVsZS5jcmVhdGVfa2V5c193YWxsZXRfZnJvbV9zZWVkKEpTT04uc3RyaW5naWZ5KGNvbmZpZy50b0pzb24oKSksIChjcHBBZGRyZXNzKSA9PiB7XG4gICAgICAgICAgaWYgKHR5cGVvZiBjcHBBZGRyZXNzID09PSBcInN0cmluZ1wiKSByZWplY3QobmV3IE1vbmVyb0Vycm9yKGNwcEFkZHJlc3MpKTtcbiAgICAgICAgICBlbHNlIHJlc29sdmUobmV3IE1vbmVyb1dhbGxldEtleXMoY3BwQWRkcmVzcykpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIGNyZWF0ZVdhbGxldEZyb21LZXlzKGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KSB7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgYW5kIHNhbml0aXplIHBhcmFtc1xuICAgIGlmIChjb25maWcuZ2V0U2VlZE9mZnNldCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIHNlZWRPZmZzZXQgd2hlbiBjcmVhdGluZyB3YWxsZXQgZnJvbSBrZXlzXCIpO1xuICAgIE1vbmVyb05ldHdvcmtUeXBlLnZhbGlkYXRlKGNvbmZpZy5nZXROZXR3b3JrVHlwZSgpKTtcbiAgICBpZiAoY29uZmlnLmdldFByaW1hcnlBZGRyZXNzKCkgPT09IHVuZGVmaW5lZCkgY29uZmlnLnNldFByaW1hcnlBZGRyZXNzKFwiXCIpO1xuICAgIGlmIChjb25maWcuZ2V0UHJpdmF0ZVZpZXdLZXkoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UHJpdmF0ZVZpZXdLZXkoXCJcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRQcml2YXRlU3BlbmRLZXkoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0UHJpdmF0ZVNwZW5kS2V5KFwiXCIpO1xuICAgIGlmIChjb25maWcuZ2V0TGFuZ3VhZ2UoKSA9PT0gdW5kZWZpbmVkKSBjb25maWcuc2V0TGFuZ3VhZ2UoXCJFbmdsaXNoXCIpO1xuICAgIFxuICAgIC8vIGxvYWQgd2FzbSBtb2R1bGVcbiAgICBsZXQgbW9kdWxlID0gYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRLZXlzTW9kdWxlKCk7XG4gICAgXG4gICAgLy8gcXVldWUgY2FsbCB0byB3YXNtIG1vZHVsZVxuICAgIHJldHVybiBtb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIFxuICAgICAgICAvLyBjcmVhdGUgd2FsbGV0IGluIHdhc20gd2hpY2ggaW52b2tlcyBjYWxsYmFjayB3aGVuIGRvbmVcbiAgICAgICAgbW9kdWxlLmNyZWF0ZV9rZXlzX3dhbGxldF9mcm9tX2tleXMoSlNPTi5zdHJpbmdpZnkoY29uZmlnLnRvSnNvbigpKSwgKGNwcEFkZHJlc3MpID0+IHtcbiAgICAgICAgICBpZiAodHlwZW9mIGNwcEFkZHJlc3MgPT09IFwic3RyaW5nXCIpIHJlamVjdChuZXcgTW9uZXJvRXJyb3IoY3BwQWRkcmVzcykpO1xuICAgICAgICAgIGVsc2UgcmVzb2x2ZShuZXcgTW9uZXJvV2FsbGV0S2V5cyhjcHBBZGRyZXNzKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIHN0YXRpYyBhc3luYyBnZXRTZWVkTGFuZ3VhZ2VzKCk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBsZXQgbW9kdWxlID0gYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRLZXlzTW9kdWxlKCk7XG4gICAgcmV0dXJuIG1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgcmV0dXJuIEpTT04ucGFyc2UobW9kdWxlLmdldF9rZXlzX3dhbGxldF9zZWVkX2xhbmd1YWdlcygpKS5sYW5ndWFnZXM7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBJTlNUQU5DRSBNRVRIT0RTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICAvKipcbiAgICogSW50ZXJuYWwgY29uc3RydWN0b3Igd2hpY2ggaXMgZ2l2ZW4gdGhlIG1lbW9yeSBhZGRyZXNzIG9mIGEgQysrIHdhbGxldFxuICAgKiBpbnN0YW5jZS5cbiAgICogXG4gICAqIFRoaXMgbWV0aG9kIHNob3VsZCBub3QgYmUgY2FsbGVkIGV4dGVybmFsbHkgYnV0IHNob3VsZCBiZSBjYWxsZWQgdGhyb3VnaFxuICAgKiBzdGF0aWMgd2FsbGV0IGNyZWF0aW9uIHV0aWxpdGllcyBpbiB0aGlzIGNsYXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGNwcEFkZHJlc3MgLSBhZGRyZXNzIG9mIHRoZSB3YWxsZXQgaW5zdGFuY2UgaW4gQysrXG4gICAqIEBwYXJhbSB7TW9uZXJvV2FsbGV0S2V5c1Byb3h5fSB3YWxsZXRQcm94eSAtIHByb3h5XG4gICAqIFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgY29uc3RydWN0b3IoY3BwQWRkcmVzcywgd2FsbGV0UHJveHk/OiBNb25lcm9XYWxsZXRLZXlzUHJveHkpIHtcbiAgICBzdXBlcigpO1xuICAgIGlmICghY3BwQWRkcmVzcyAmJiAhd2FsbGV0UHJveHkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBjcHBBZGRyZXNzIG9yIHdhbGxldFByb3h5XCIpO1xuICAgIGlmICh3YWxsZXRQcm94eSkgdGhpcy53YWxsZXRQcm94eSA9IHdhbGxldFByb3h5O1xuICAgIGVsc2Uge1xuICAgICAgdGhpcy5jcHBBZGRyZXNzID0gY3BwQWRkcmVzcztcbiAgICAgIHRoaXMubW9kdWxlID0gTGlicmFyeVV0aWxzLmdldFdhc21Nb2R1bGUoKTtcbiAgICAgIGlmICghdGhpcy5tb2R1bGUuY3JlYXRlX2Z1bGxfd2FsbGV0KSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJXQVNNIG1vZHVsZSBub3QgbG9hZGVkIC0gY3JlYXRlIHdhbGxldCBpbnN0YW5jZSB1c2luZyBzdGF0aWMgdXRpbGl0aWVzXCIpOyAgLy8gc3RhdGljIHV0aWxpdGVzIHByZS1sb2FkIHdhc20gbW9kdWxlXG4gICAgfVxuICB9XG4gIFxuICBhc3luYyBpc1ZpZXdPbmx5KCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuaXNWaWV3T25seSgpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIHJldHVybiB0aGlzLm1vZHVsZS5pc192aWV3X29ubHkodGhpcy5jcHBBZGRyZXNzKTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgaXNDb25uZWN0ZWRUb0RhZW1vbigpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmlzQ29ubmVjdGVkVG9EYWVtb24oKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBhc3luYyBnZXRWZXJzaW9uKCk6IFByb21pc2U8TW9uZXJvVmVyc2lvbj4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0VmVyc2lvbigpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCB2ZXJzaW9uU3RyID0gdGhpcy5tb2R1bGUuZ2V0X3ZlcnNpb24odGhpcy5jcHBBZGRyZXNzKTtcbiAgICAgIGxldCB2ZXJzaW9uSnNvbiA9IEpTT04ucGFyc2UodmVyc2lvblN0cik7XG4gICAgICByZXR1cm4gbmV3IE1vbmVyb1ZlcnNpb24odmVyc2lvbkpzb24ubnVtYmVyLCB2ZXJzaW9uSnNvbi5pc1JlbGVhc2UpO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogQGlnbm9yZVxuICAgKi9cbiAgZ2V0UGF0aCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk1vbmVyb1dhbGxldEtleXMgZG9lcyBub3Qgc3VwcG9ydCBhIHBlcnNpc3RlZCBwYXRoXCIpO1xuICB9XG4gIFxuICBhc3luYyBnZXRTZWVkKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRTZWVkKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IHJlc3AgPSB0aGlzLm1vZHVsZS5nZXRfc2VlZCh0aGlzLmNwcEFkZHJlc3MpO1xuICAgICAgY29uc3QgZXJyb3JTdHIgPSBcImVycm9yOiBcIjtcbiAgICAgIGlmIChyZXNwLmluZGV4T2YoZXJyb3JTdHIpID09PSAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IocmVzcC5zdWJzdHJpbmcoZXJyb3JTdHIubGVuZ3RoKSk7XG4gICAgICByZXR1cm4gcmVzcCA/IHJlc3AgOiB1bmRlZmluZWQ7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFNlZWRMYW5ndWFnZSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0U2VlZExhbmd1YWdlKCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IHJlc3AgPSB0aGlzLm1vZHVsZS5nZXRfc2VlZF9sYW5ndWFnZSh0aGlzLmNwcEFkZHJlc3MpO1xuICAgICAgbGV0IGVycm9yS2V5ID0gXCJlcnJvcjogXCI7XG4gICAgICBpZiAocmVzcC5pbmRleE9mKGVycm9yS2V5KSA9PT0gMCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHJlc3Auc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCkpO1xuICAgICAgcmV0dXJuIHJlc3AgPyByZXNwIDogdW5kZWZpbmVkO1xuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgZ2V0UHJpdmF0ZVNwZW5kS2V5KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkgcmV0dXJuIHRoaXMuZ2V0V2FsbGV0UHJveHkoKS5nZXRQcml2YXRlU3BlbmRLZXkoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgcmVzcCA9IHRoaXMubW9kdWxlLmdldF9wcml2YXRlX3NwZW5kX2tleSh0aGlzLmNwcEFkZHJlc3MpO1xuICAgICAgbGV0IGVycm9yS2V5ID0gXCJlcnJvcjogXCI7XG4gICAgICBpZiAocmVzcC5pbmRleE9mKGVycm9yS2V5KSA9PT0gMCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHJlc3Auc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCkpO1xuICAgICAgcmV0dXJuIHJlc3AgPyByZXNwIDogdW5kZWZpbmVkO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRQcml2YXRlVmlld0tleSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0UHJpdmF0ZVZpZXdLZXkoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgcmVzcCA9IHRoaXMubW9kdWxlLmdldF9wcml2YXRlX3ZpZXdfa2V5KHRoaXMuY3BwQWRkcmVzcyk7XG4gICAgICBsZXQgZXJyb3JLZXkgPSBcImVycm9yOiBcIjtcbiAgICAgIGlmIChyZXNwLmluZGV4T2YoZXJyb3JLZXkpID09PSAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IocmVzcC5zdWJzdHJpbmcoZXJyb3JLZXkubGVuZ3RoKSk7XG4gICAgICByZXR1cm4gcmVzcCA/IHJlc3AgOiB1bmRlZmluZWQ7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFB1YmxpY1ZpZXdLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFB1YmxpY1ZpZXdLZXkoKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICBsZXQgcmVzcCA9IHRoaXMubW9kdWxlLmdldF9wdWJsaWNfdmlld19rZXkodGhpcy5jcHBBZGRyZXNzKTtcbiAgICAgIGxldCBlcnJvcktleSA9IFwiZXJyb3I6IFwiO1xuICAgICAgaWYgKHJlc3AuaW5kZXhPZihlcnJvcktleSkgPT09IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihyZXNwLnN1YnN0cmluZyhlcnJvcktleS5sZW5ndGgpKTtcbiAgICAgIHJldHVybiByZXNwID8gcmVzcCA6IHVuZGVmaW5lZDtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0UHVibGljU3BlbmRLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldFB1YmxpY1NwZW5kS2V5KCk7XG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICB0aGlzLmFzc2VydE5vdENsb3NlZCgpO1xuICAgICAgbGV0IHJlc3AgPSB0aGlzLm1vZHVsZS5nZXRfcHVibGljX3NwZW5kX2tleSh0aGlzLmNwcEFkZHJlc3MpO1xuICAgICAgbGV0IGVycm9yS2V5ID0gXCJlcnJvcjogXCI7XG4gICAgICBpZiAocmVzcC5pbmRleE9mKGVycm9yS2V5KSA9PT0gMCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKHJlc3Auc3Vic3RyaW5nKGVycm9yS2V5Lmxlbmd0aCkpO1xuICAgICAgcmV0dXJuIHJlc3AgPyByZXNwIDogdW5kZWZpbmVkO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBnZXRBZGRyZXNzKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0lkeDogbnVtYmVyKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBpZiAodGhpcy5nZXRXYWxsZXRQcm94eSgpKSByZXR1cm4gdGhpcy5nZXRXYWxsZXRQcm94eSgpLmdldEFkZHJlc3MoYWNjb3VudElkeCwgc3ViYWRkcmVzc0lkeCk7XG4gICAgYXNzZXJ0KHR5cGVvZiBhY2NvdW50SWR4ID09PSBcIm51bWJlclwiKTtcbiAgICByZXR1cm4gdGhpcy5tb2R1bGUucXVldWVUYXNrKGFzeW5jICgpID0+IHtcbiAgICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgICByZXR1cm4gdGhpcy5tb2R1bGUuZ2V0X2FkZHJlc3ModGhpcy5jcHBBZGRyZXNzLCBhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWRkcmVzc0luZGV4KGFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzcz4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0QWRkcmVzc0luZGV4KGFkZHJlc3MpO1xuICAgIHJldHVybiB0aGlzLm1vZHVsZS5xdWV1ZVRhc2soYXN5bmMgKCkgPT4ge1xuICAgICAgdGhpcy5hc3NlcnROb3RDbG9zZWQoKTtcbiAgICAgIGxldCByZXNwID0gdGhpcy5tb2R1bGUuZ2V0X2FkZHJlc3NfaW5kZXgodGhpcy5jcHBBZGRyZXNzLCBhZGRyZXNzKTtcbiAgICAgIGlmIChyZXNwLmNoYXJBdCgwKSAhPT0gJ3snKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IocmVzcCk7XG4gICAgICByZXR1cm4gbmV3IE1vbmVyb1N1YmFkZHJlc3MoSlNPTi5wYXJzZShyZXNwKSk7XG4gICAgfSk7XG4gIH1cbiAgXG4gIGFzeW5jIGdldEFjY291bnRzKGluY2x1ZGVTdWJhZGRyZXNzZXM/OiBib29sZWFuLCB0YWc/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0FjY291bnRbXT4ge1xuICAgIGlmICh0aGlzLmdldFdhbGxldFByb3h5KCkpIHJldHVybiB0aGlzLmdldFdhbGxldFByb3h5KCkuZ2V0QWNjb3VudHMoKTtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNb25lcm9XYWxsZXRLZXlzIGRvZXMgbm90IHN1cHBvcnQgZ2V0dGluZyBhbiBlbnVtZXJhYmxlIHNldCBvZiBhY2NvdW50czsgcXVlcnkgc3BlY2lmaWMgYWNjb3VudHNcIik7XG4gIH1cbiAgXG4gIC8vIGdldEludGVncmF0ZWRBZGRyZXNzKHBheW1lbnRJZCkgIC8vIFRPRE9cbiAgLy8gZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3NcbiAgXG4gIGFzeW5jIGNsb3NlKHNhdmUgPSBmYWxzZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLl9pc0Nsb3NlZCkgcmV0dXJuOyAvLyBubyBlZmZlY3QgaWYgY2xvc2VkXG4gICAgaWYgKHRoaXMuZ2V0V2FsbGV0UHJveHkoKSkge1xuICAgICAgYXdhaXQgdGhpcy5nZXRXYWxsZXRQcm94eSgpLmNsb3NlKHNhdmUpO1xuICAgICAgYXdhaXQgc3VwZXIuY2xvc2UoKTtcbiAgICAgIHRoaXMuX2lzQ2xvc2VkID0gdHJ1ZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgXG4gICAgLy8gc2F2ZSB3YWxsZXQgaWYgcmVxdWVzdGVkXG4gICAgaWYgKHNhdmUpIGF3YWl0IHRoaXMuc2F2ZSgpO1xuXG4gICAgLy8gY2xvc2Ugc3VwZXJcbiAgICBhd2FpdCBzdXBlci5jbG9zZSgpO1xuICAgIHRoaXMuX2lzQ2xvc2VkID0gdHJ1ZTtcblxuICAgIC8vIHF1ZXVlIHRhc2sgdG8gdXNlIHdhc20gbW9kdWxlXG4gICAgcmV0dXJuIHRoaXMubW9kdWxlLnF1ZXVlVGFzayhhc3luYyAoKSA9PiB7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5faXNDbG9zZWQpIHtcbiAgICAgICAgICByZXNvbHZlKHVuZGVmaW5lZCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBjbG9zZSB3YWxsZXQgaW4gd2FzbSBhbmQgaW52b2tlIGNhbGxiYWNrIHdoZW4gZG9uZVxuICAgICAgICB0aGlzLm1vZHVsZS5jbG9zZSh0aGlzLmNwcEFkZHJlc3MsIGZhbHNlLCBhc3luYyAoKSA9PiB7IC8vIHNhdmluZyBoYW5kbGVkIGV4dGVybmFsIHRvIHdlYmFzc2VtYmx5XG4gICAgICAgICAgZGVsZXRlIHRoaXMuY3BwQWRkcmVzcztcbiAgICAgICAgICB0aGlzLl9pc0Nsb3NlZCA9IHRydWU7XG4gICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4gIFxuICBhc3luYyBpc0Nsb3NlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICByZXR1cm4gdGhpcy5faXNDbG9zZWQ7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tIEFERCBKU0RPQyBGT1IgU1VQUE9SVEVEIERFRkFVTFQgSU1QTEVNRU5UQVRJT05TIC0tLS0tLS0tLS0tLS0tXG4gIFxuICBhc3luYyBnZXRQcmltYXJ5QWRkcmVzcygpOiBQcm9taXNlPHN0cmluZz4geyByZXR1cm4gc3VwZXIuZ2V0UHJpbWFyeUFkZHJlc3MoKTsgfVxuICBhc3luYyBnZXRTdWJhZGRyZXNzKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0lkeDogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7IHJldHVybiBzdXBlci5nZXRTdWJhZGRyZXNzKGFjY291bnRJZHgsIHN1YmFkZHJlc3NJZHgpOyB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIEhFTFBFUlMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHN0YXRpYyBzYW5pdGl6ZVN1YmFkZHJlc3Moc3ViYWRkcmVzcykge1xuICAgIGlmIChzdWJhZGRyZXNzLmdldExhYmVsKCkgPT09IFwiXCIpIHN1YmFkZHJlc3Muc2V0TGFiZWwodW5kZWZpbmVkKTtcbiAgICByZXR1cm4gc3ViYWRkcmVzc1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgYXNzZXJ0Tm90Q2xvc2VkKCkge1xuICAgIGlmICh0aGlzLl9pc0Nsb3NlZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiV2FsbGV0IGlzIGNsb3NlZFwiKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBnZXRXYWxsZXRQcm94eSgpOiBNb25lcm9XYWxsZXRLZXlzUHJveHkge1xuICAgIHRoaXMuYXNzZXJ0Tm90Q2xvc2VkKCk7XG4gICAgcmV0dXJuIHRoaXMud2FsbGV0UHJveHk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbXBsZW1lbnRzIGEgTW9uZXJvV2FsbGV0IGJ5IHByb3h5aW5nIHJlcXVlc3RzIHRvIGEgd29ya2VyIHdoaWNoIHJ1bnMgYSBrZXlzLW9ubHkgd2FsbGV0LlxuICogXG4gKiBUT0RPOiBzb3J0IHRoZXNlIG1ldGhvZHMgYWNjb3JkaW5nIHRvIG1hc3RlciBzb3J0IGluIE1vbmVyb1dhbGxldC50c1xuICogVE9ETzogcHJvYmFibHkgb25seSBhbGxvdyBvbmUgbGlzdGVuZXIgdG8gd29ya2VyIHRoZW4gcHJvcG9nYXRlIHRvIHJlZ2lzdGVyZWQgbGlzdGVuZXJzIGZvciBwZXJmb3JtYW5jZVxuICogXG4gKiBAcHJpdmF0ZVxuICovXG5leHBvcnQgY2xhc3MgTW9uZXJvV2FsbGV0S2V5c1Byb3h5IGV4dGVuZHMgTW9uZXJvV2FsbGV0IHtcblxuICAvLyBzdGF0ZSB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIHdhbGxldElkOiBzdHJpbmc7XG4gIHByb3RlY3RlZCB3b3JrZXI6IFdvcmtlcjtcbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFdBTExFVCBTVEFUSUMgVVRJTFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICBzdGF0aWMgYXN5bmMgY3JlYXRlV2FsbGV0KGNvbmZpZykge1xuICAgIGxldCB3YWxsZXRJZCA9IEdlblV0aWxzLmdldFVVSUQoKTtcbiAgICBhd2FpdCBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKHdhbGxldElkLCBcImNyZWF0ZVdhbGxldEtleXNcIiwgW2NvbmZpZy50b0pzb24oKV0pO1xuICAgIHJldHVybiBuZXcgTW9uZXJvV2FsbGV0S2V5c1Byb3h5KHdhbGxldElkLCBhd2FpdCBMaWJyYXJ5VXRpbHMuZ2V0V29ya2VyKCkpO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gSU5TVEFOQ0UgTUVUSE9EUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICAvKipcbiAgICogSW50ZXJuYWwgY29uc3RydWN0b3Igd2hpY2ggaXMgZ2l2ZW4gYSB3b3JrZXIgdG8gY29tbXVuaWNhdGUgd2l0aCB2aWEgbWVzc2FnZXMuXG4gICAqIFxuICAgKiBUaGlzIG1ldGhvZCBzaG91bGQgbm90IGJlIGNhbGxlZCBleHRlcm5hbGx5IGJ1dCBzaG91bGQgYmUgY2FsbGVkIHRocm91Z2hcbiAgICogc3RhdGljIHdhbGxldCBjcmVhdGlvbiB1dGlsaXRpZXMgaW4gdGhpcyBjbGFzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB3YWxsZXRJZCAtIGlkZW50aWZpZXMgdGhlIHdhbGxldCB3aXRoIHRoZSB3b3JrZXJcbiAgICogQHBhcmFtIHtXb3JrZXJ9IHdvcmtlciAtIHdvcmtlciB0byBjb21tdW5pY2F0ZSB3aXRoIHZpYSBtZXNzYWdlc1xuICAgKiBcbiAgICogQHByb3RlY3RlZFxuICAgKi9cbiAgY29uc3RydWN0b3Iod2FsbGV0SWQsIHdvcmtlcikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy53YWxsZXRJZCA9IHdhbGxldElkO1xuICAgIHRoaXMud29ya2VyID0gd29ya2VyO1xuICB9XG4gIFxuICBhc3luYyBpc1ZpZXdPbmx5KCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImlzVmlld09ubHlcIik7XG4gIH1cblxuICBhc3luYyBnZXRWZXJzaW9uKCk6IFByb21pc2U8TW9uZXJvVmVyc2lvbj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBpbXBsZW1lbnRlZFwiKTtcbiAgfVxuXG4gIGFzeW5jIGdldFNlZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0U2VlZFwiKSBhcyBQcm9taXNlPHN0cmluZz47XG4gIH1cbiAgXG4gIGFzeW5jIGdldFNlZWRMYW5ndWFnZSgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRTZWVkTGFuZ3VhZ2VcIikgYXMgUHJvbWlzZTxzdHJpbmc+O1xuICB9XG4gIFxuICBhc3luYyBnZXRTZWVkTGFuZ3VhZ2VzKCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldFNlZWRMYW5ndWFnZXNcIik7XG4gIH1cbiAgXG4gIGFzeW5jIGdldFByaXZhdGVTcGVuZEtleSgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRQcml2YXRlU3BlbmRLZXlcIikgYXMgUHJvbWlzZTxzdHJpbmc+O1xuICB9XG4gIFxuICBhc3luYyBnZXRQcml2YXRlVmlld0tleSgpIHtcbiAgICByZXR1cm4gdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRQcml2YXRlVmlld0tleVwiKSBhcyBQcm9taXNlPHN0cmluZz47XG4gIH1cbiAgXG4gIGFzeW5jIGdldFB1YmxpY1ZpZXdLZXkoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0UHVibGljVmlld0tleVwiKSBhcyBQcm9taXNlPHN0cmluZz47XG4gIH1cbiAgXG4gIGFzeW5jIGdldFB1YmxpY1NwZW5kS2V5KCkge1xuICAgIHJldHVybiB0aGlzLmludm9rZVdvcmtlcihcImdldFB1YmxpY1NwZW5kS2V5XCIpIGFzIFByb21pc2U8c3RyaW5nPjtcbiAgfVxuICBcbiAgYXN5bmMgZ2V0QWRkcmVzcyhhY2NvdW50SWR4LCBzdWJhZGRyZXNzSWR4KSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiZ2V0QWRkcmVzc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpIGFzIFByb21pc2U8c3RyaW5nPjtcbiAgfVxuXG4gIGFzeW5jIGdldEFkZHJlc3NJbmRleChhZGRyZXNzKSB7XG4gICAgbGV0IHN1YmFkZHJlc3NKc29uID0gYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJnZXRBZGRyZXNzSW5kZXhcIiwgQXJyYXkuZnJvbShhcmd1bWVudHMpKTtcbiAgICByZXR1cm4gTW9uZXJvV2FsbGV0S2V5cy5zYW5pdGl6ZVN1YmFkZHJlc3MobmV3IE1vbmVyb1N1YmFkZHJlc3Moc3ViYWRkcmVzc0pzb24pKTtcbiAgfVxuXG4gIGFzeW5jIGdldEludGVncmF0ZWRBZGRyZXNzKHN0YW5kYXJkQWRkcmVzcywgcGF5bWVudElkKSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyhhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImdldEludGVncmF0ZWRBZGRyZXNzXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSkpO1xuICB9XG4gIFxuICBhc3luYyBkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyhpbnRlZ3JhdGVkQWRkcmVzcykge1xuICAgIHJldHVybiBuZXcgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MoYXdhaXQgdGhpcy5pbnZva2VXb3JrZXIoXCJkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzc1wiLCBBcnJheS5mcm9tKGFyZ3VtZW50cykpKTtcbiAgfVxuXG4gIGFzeW5jIGNsb3NlKHNhdmUpIHtcbiAgICBhd2FpdCB0aGlzLmludm9rZVdvcmtlcihcImNsb3NlXCIsIEFycmF5LmZyb20oYXJndW1lbnRzKSk7XG4gICAgTGlicmFyeVV0aWxzLnJlbW92ZVdvcmtlck9iamVjdCh0aGlzLndhbGxldElkKTtcbiAgfVxuICBcbiAgYXN5bmMgaXNDbG9zZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaW52b2tlV29ya2VyKFwiaXNDbG9zZWRcIik7XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgaW52b2tlV29ya2VyKGZuTmFtZTogc3RyaW5nLCBhcmdzPzogYW55KTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gYXdhaXQgTGlicmFyeVV0aWxzLmludm9rZVdvcmtlcih0aGlzLndhbGxldElkLCBmbk5hbWUsIGFyZ3MpO1xuICB9XG59XG4iXSwibWFwcGluZ3MiOiJrT0FBQSxJQUFBQSxPQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxTQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxhQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7O0FBRUEsSUFBQUcsWUFBQSxHQUFBSixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUksd0JBQUEsR0FBQUwsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFLLGtCQUFBLEdBQUFOLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTSxpQkFBQSxHQUFBUCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQU8sY0FBQSxHQUFBUixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVEsYUFBQSxHQUFBVCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVMsbUJBQUEsR0FBQVYsc0JBQUEs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