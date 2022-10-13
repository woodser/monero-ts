"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _GenUtils = _interopRequireDefault(require("../../common/GenUtils"));

var _MoneroError = _interopRequireDefault(require("../../common/MoneroError"));

var _MoneroNetworkType = _interopRequireDefault(require("../../daemon/model/MoneroNetworkType"));

var _MoneroRpcConnection = _interopRequireDefault(require("../../common/MoneroRpcConnection"));

/**
 * Configuration to create a Monero wallet.
 */
var MoneroWalletConfig = /*#__PURE__*/function () {
  /**
   * Construct a configuration to open or create a wallet.
   * 
   * @param {object|MoneroWalletConfig} config - MoneroWalletConfig or equivalent config object
   * @param {string} config.path - path of the wallet to open or create
   * @param {string} config.password - password of the wallet to open
   * @param {string|number} config.networkType - network type of the wallet to open (one of "mainnet", "testnet", "stagenet" or MoneroNetworkType.MAINNET|TESTNET|STAGENET)
   * @param {string} [config.serverUri] - uri of the wallet's server (optional)
   * @param {string} [config.serverUsername] - username of the wallet's server (optional)
   * @param {string} [config.serverPassword] - password of the wallet's server (optional)
   * @param {boolean} [config.rejectUnauthorized] - reject self-signed server certificates if true (default true)
   * @param {MoneroRpcConnection|object} [config.server] - MoneroRpcConnection or equivalent JS object configuring the server connection (optional)
   * @param {Uint8Array} [config.keysData] - wallet keys data to open (optional)
   * @param {Uint8Array} [config.cacheData] - wallet cache data to open (optional)
   * @param {boolean} [config.proxyToWorker] - proxies wallet operations to a worker in order to not block the main thread (default true)
   * @param {fs} [config.fs] - Node.js compatible file system to use (defaults to disk or in-memory FS if browser)
   * @param {boolean} config.saveCurrent - specifies if the current RPC wallet should be saved before being closed
   * @param {number} config.accountLookahead - number of accounts to scan (optional)
   * @param {number} config.subaddressLookahead - number of subaddresses to scan per account (optional)
   */
  function MoneroWalletConfig(config) {
    (0, _classCallCheck2["default"])(this, MoneroWalletConfig);
    // initialize internal config
    if (!config) config = {};else if (config instanceof MoneroWalletConfig) config = config.toJson();else if ((0, _typeof2["default"])(config) === "object") config = Object.assign({}, config);else throw new _MoneroError["default"]("config must be a MoneroWalletConfig or JavaScript object");
    this.config = config; // normalize config

    this.setNetworkType(config.networkType);
    if (config.server) this.setServer(config.server);
    delete this.config.server; // check for unsupported fields

    for (var _i = 0, _Object$keys = Object.keys(this.config); _i < _Object$keys.length; _i++) {
      var key = _Object$keys[_i];

      if (!_GenUtils["default"].arrayContains(MoneroWalletConfig.SUPPORTED_FIELDS, key)) {
        throw new _MoneroError["default"]("Wallet config includes unsupported field: '" + key + "'");
      }
    }
  }

  (0, _createClass2["default"])(MoneroWalletConfig, [{
    key: "toJson",
    value: function toJson() {
      var json = Object.assign({}, this.config);
      json.fs = undefined; // remove filesystem

      return json;
    }
  }, {
    key: "getPath",
    value: function getPath() {
      return this.config.path;
    }
  }, {
    key: "setPath",
    value: function setPath(path) {
      this.config.path = path;
      return this;
    }
  }, {
    key: "getPassword",
    value: function getPassword() {
      return this.config.password;
    }
  }, {
    key: "setPassword",
    value: function setPassword(password) {
      this.config.password = password;
      return this;
    }
  }, {
    key: "getNetworkType",
    value: function getNetworkType() {
      return this.config.networkType;
    }
  }, {
    key: "setNetworkType",
    value: function setNetworkType(networkTypeOrStr) {
      this.config.networkType = typeof networkTypeOrStr === "string" ? _MoneroNetworkType["default"].parse(networkTypeOrStr) : networkTypeOrStr;
      return this;
    }
  }, {
    key: "getServer",
    value: function getServer() {
      return !this.config.serverUri ? undefined : new _MoneroRpcConnection["default"]({
        uri: this.config.serverUri,
        username: this.config.serverUsername,
        password: this.config.serverPassword,
        rejectUnauthorized: this.config.rejectUnauthorized
      });
    }
  }, {
    key: "setServer",
    value: function setServer(server) {
      if (server && !(server instanceof _MoneroRpcConnection["default"])) server = new _MoneroRpcConnection["default"](server);
      this.config.serverUri = server === undefined ? undefined : server.getUri();
      this.config.serverUsername = server === undefined ? undefined : server.getUsername();
      this.config.serverPassword = server === undefined ? undefined : server.getPassword();
      this.config.rejectUnauthorized = server === undefined ? undefined : server.getRejectUnauthorized();
      return this;
    }
  }, {
    key: "getServerUri",
    value: function getServerUri() {
      return this.config.serverUri;
    }
  }, {
    key: "setServerUri",
    value: function setServerUri(serverUri) {
      this.config.serverUri = serverUri;
      return this;
    }
  }, {
    key: "getServerUsername",
    value: function getServerUsername() {
      return this.config.serverUsername;
    }
  }, {
    key: "setServerUsername",
    value: function setServerUsername(serverUsername) {
      this.config.serverUsername = serverUsername;
      return this;
    }
  }, {
    key: "getServerPassword",
    value: function getServerPassword() {
      return this.config.serverPassword;
    }
  }, {
    key: "setServerPassword",
    value: function setServerPassword(serverPassword) {
      this.config.serverPassword = serverPassword;
      return this;
    }
  }, {
    key: "getRejectUnauthorized",
    value: function getRejectUnauthorized() {
      return this.config.rejectUnauthorized;
    }
  }, {
    key: "setRejectUnauthorized",
    value: function setRejectUnauthorized(rejectUnauthorized) {
      this.config.rejectUnauthorized = rejectUnauthorized;
      return this;
    }
  }, {
    key: "getMnemonic",
    value: function getMnemonic() {
      return this.config.mnemonic;
    }
  }, {
    key: "setMnemonic",
    value: function setMnemonic(mnemonic) {
      this.config.mnemonic = mnemonic;
      return this;
    }
  }, {
    key: "getSeedOffset",
    value: function getSeedOffset() {
      return this.config.seedOffset;
    }
  }, {
    key: "setSeedOffset",
    value: function setSeedOffset(seedOffset) {
      this.config.seedOffset = seedOffset;
      return this;
    }
  }, {
    key: "getPrimaryAddress",
    value: function getPrimaryAddress() {
      return this.config.primaryAddress;
    }
  }, {
    key: "setPrimaryAddress",
    value: function setPrimaryAddress(primaryAddress) {
      this.config.primaryAddress = primaryAddress;
      return this;
    }
  }, {
    key: "getPrivateViewKey",
    value: function getPrivateViewKey() {
      return this.config.privateViewKey;
    }
  }, {
    key: "setPrivateViewKey",
    value: function setPrivateViewKey(privateViewKey) {
      this.config.privateViewKey = privateViewKey;
      return this;
    }
  }, {
    key: "getPrivateSpendKey",
    value: function getPrivateSpendKey() {
      return this.config.privateSpendKey;
    }
  }, {
    key: "setPrivateSpendKey",
    value: function setPrivateSpendKey(privateSpendKey) {
      this.config.privateSpendKey = privateSpendKey;
      return this;
    }
  }, {
    key: "getRestoreHeight",
    value: function getRestoreHeight() {
      return this.config.restoreHeight;
    }
  }, {
    key: "setRestoreHeight",
    value: function setRestoreHeight(restoreHeight) {
      this.config.restoreHeight = restoreHeight;
      return this;
    }
  }, {
    key: "getLanguage",
    value: function getLanguage() {
      return this.config.language;
    }
  }, {
    key: "setLanguage",
    value: function setLanguage(language) {
      this.config.language = language;
      return this;
    }
  }, {
    key: "getSaveCurrent",
    value: function getSaveCurrent() {
      return this.config.saveCurrent;
    }
  }, {
    key: "setSaveCurrent",
    value: function setSaveCurrent(saveCurrent) {
      this.config.saveCurrent = saveCurrent;
      return this;
    }
  }, {
    key: "getProxyToWorker",
    value: function getProxyToWorker() {
      return this.config.proxyToWorker;
    }
  }, {
    key: "setProxyToWorker",
    value: function setProxyToWorker(proxyToWorker) {
      this.config.proxyToWorker = proxyToWorker;
      return this;
    }
  }, {
    key: "getFs",
    value: function getFs() {
      return this.config.fs;
    }
  }, {
    key: "setFs",
    value: function setFs(fs) {
      this.config.fs = fs;
      return this;
    }
  }, {
    key: "getKeysData",
    value: function getKeysData() {
      return this.config.keysData;
    }
  }, {
    key: "setKeysData",
    value: function setKeysData(keysData) {
      this.config.keysData = keysData;
      return this;
    }
  }, {
    key: "getCacheData",
    value: function getCacheData() {
      return this.config.cacheData;
    }
  }, {
    key: "setCacheData",
    value: function setCacheData(cacheData) {
      this.config.cacheData = cacheData;
      return this;
    }
  }, {
    key: "getAccountLookahead",
    value: function getAccountLookahead() {
      return this.state.accountLookahead;
    }
  }, {
    key: "setAccountLookahead",
    value: function setAccountLookahead(accountLookahead) {
      this.state.accountLookahead = accountLookahead;
      return this;
    }
  }, {
    key: "getSubaddressLookahead",
    value: function getSubaddressLookahead() {
      return this.state.subaddressLookahead;
    }
  }, {
    key: "setSubaddressLookahead",
    value: function setSubaddressLookahead(subaddressLookahead) {
      this.state.subaddressLookahead = subaddressLookahead;
      return this;
    }
  }]);
  return MoneroWalletConfig;
}();

MoneroWalletConfig.SUPPORTED_FIELDS = ["path", "password", "networkType", "serverUri", "serverUsername", "serverPassword", "rejectUnauthorized", "mnemonic", "seedOffset", "primaryAddress", "privateViewKey", "privateSpendKey", "restoreHeight", "language", "saveCurrent", "proxyToWorker", "fs", "keysData", "cacheData", "accountLookahead", "subaddressLookahead"];
var _default = MoneroWalletConfig;
exports["default"] = _default;