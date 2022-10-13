"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _construct2 = _interopRequireDefault(require("@babel/runtime/helpers/construct"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _assert = _interopRequireDefault(require("assert"));

var _GenUtils = _interopRequireDefault(require("../common/GenUtils"));

var _LibraryUtils = _interopRequireDefault(require("../common/LibraryUtils"));

var _TaskLooper = _interopRequireDefault(require("../common/TaskLooper"));

var _MoneroAccount = _interopRequireDefault(require("./model/MoneroAccount"));

var _MoneroAccountTag = _interopRequireDefault(require("./model/MoneroAccountTag"));

var _MoneroAddressBookEntry = _interopRequireDefault(require("./model/MoneroAddressBookEntry"));

var _MoneroBlock = _interopRequireDefault(require("../daemon/model/MoneroBlock"));

var _MoneroBlockHeader = _interopRequireDefault(require("../daemon/model/MoneroBlockHeader"));

var _MoneroCheckReserve = _interopRequireDefault(require("./model/MoneroCheckReserve"));

var _MoneroCheckTx = _interopRequireDefault(require("./model/MoneroCheckTx"));

var _MoneroDestination = _interopRequireDefault(require("./model/MoneroDestination"));

var _MoneroError = _interopRequireDefault(require("../common/MoneroError"));

var _MoneroIncomingTransfer = _interopRequireDefault(require("./model/MoneroIncomingTransfer"));

var _MoneroIntegratedAddress = _interopRequireDefault(require("./model/MoneroIntegratedAddress"));

var _MoneroKeyImage = _interopRequireDefault(require("../daemon/model/MoneroKeyImage"));

var _MoneroKeyImageImportResult = _interopRequireDefault(require("./model/MoneroKeyImageImportResult"));

var _MoneroMultisigInfo = _interopRequireDefault(require("./model/MoneroMultisigInfo"));

var _MoneroMultisigInitResult = _interopRequireDefault(require("./model/MoneroMultisigInitResult"));

var _MoneroMultisigSignResult = _interopRequireDefault(require("./model/MoneroMultisigSignResult"));

var _MoneroOutgoingTransfer = _interopRequireDefault(require("./model/MoneroOutgoingTransfer"));

var _MoneroOutputQuery = _interopRequireDefault(require("./model/MoneroOutputQuery"));

var _MoneroOutputWallet = _interopRequireDefault(require("./model/MoneroOutputWallet"));

var _MoneroRpcConnection = _interopRequireDefault(require("../common/MoneroRpcConnection"));

var _MoneroRpcError = _interopRequireDefault(require("../common/MoneroRpcError"));

var _MoneroSubaddress = _interopRequireDefault(require("./model/MoneroSubaddress"));

var _MoneroSyncResult = _interopRequireDefault(require("./model/MoneroSyncResult"));

var _MoneroTransferQuery = _interopRequireDefault(require("./model/MoneroTransferQuery"));

var _MoneroTxConfig = _interopRequireDefault(require("./model/MoneroTxConfig"));

var _MoneroTxQuery = _interopRequireDefault(require("./model/MoneroTxQuery"));

var _MoneroTxSet = _interopRequireDefault(require("./model/MoneroTxSet"));

var _MoneroTxWallet = _interopRequireDefault(require("./model/MoneroTxWallet"));

var _MoneroUtils = _interopRequireDefault(require("../common/MoneroUtils"));

var _MoneroVersion = _interopRequireDefault(require("../daemon/model/MoneroVersion"));

var _MoneroWallet2 = _interopRequireDefault(require("./MoneroWallet"));

var _MoneroWalletConfig = _interopRequireDefault(require("./model/MoneroWalletConfig"));

var _MoneroWalletListener = _interopRequireDefault(require("./model/MoneroWalletListener"));

var _MoneroMessageSignatureType = _interopRequireDefault(require("./model/MoneroMessageSignatureType"));

var _MoneroMessageSignatureResult = _interopRequireDefault(require("./model/MoneroMessageSignatureResult"));

var _ThreadPool = _interopRequireDefault(require("../common/ThreadPool"));

var _SslOptions = _interopRequireDefault(require("../common/SslOptions"));

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * Copyright (c) woodser
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Implements a MoneroWallet as a client of monero-wallet-rpc.
 * 
 * @implements {MoneroWallet}
 * @hideconstructor
 */
var MoneroWalletRpc = /*#__PURE__*/function (_MoneroWallet) {
  (0, _inherits2["default"])(MoneroWalletRpc, _MoneroWallet);

  var _super = _createSuper(MoneroWalletRpc);

  /**
   * <p>Construct a wallet RPC client (for internal use).</p>
   * 
   * @param {string|object|MoneroRpcConnection|string[]} [uriOrConfig] - uri of monero-wallet-rpc or JS config object or MoneroRpcConnection or command line parameters to run a monero-wallet-rpc process internally
   * @param {string} [uriOrConfig.uri] - uri of monero-wallet-rpc
   * @param {string} [uriOrConfig.username] - username to authenticate with monero-wallet-rpc (optional)
   * @param {string} [uriOrConfig.password] - password to authenticate with monero-wallet-rpc (optional)
   * @param {boolean} [uriOrConfig.rejectUnauthorized] - rejects self-signed certificates if true (default true)
   * @param {string} [username] - username to authenticate with monero-wallet-rpc (optional)
   * @param {string} [password] - password to authenticate with monero-wallet-rpc (optional)
   * @param {boolean} [rejectUnauthorized] - rejects self-signed certificates if true (default true)
   */
  function MoneroWalletRpc(uriOrConfig, username, password, rejectUnauthorized) {
    var _this;

    (0, _classCallCheck2["default"])(this, MoneroWalletRpc);
    _this = _super.call(this);
    if (_GenUtils["default"].isArray(uriOrConfig)) throw new _MoneroError["default"]("Array with command parameters is invalid first parameter, use `await connectToWalletRpc(...)`");
    _this.config = MoneroWalletRpc._normalizeConfig(uriOrConfig, username, password, rejectUnauthorized);
    _this.rpc = new _MoneroRpcConnection["default"](_this.config);
    _this.addressCache = {}; // avoid unecessary requests for addresses

    _this.syncPeriodInMs = MoneroWalletRpc.DEFAULT_SYNC_PERIOD_IN_MS;
    _this.listeners = [];
    return _this;
  }
  /**
   * <p>Create a client connected to monero-wallet-rpc (for internal use).</p>
   * 
   * @param {string|string[]|object|MoneroRpcConnection} uriOrConfig - uri of monero-wallet-rpc or terminal parameters or JS config object or MoneroRpcConnection
   * @param {string} uriOrConfig.uri - uri of monero-wallet-rpc
   * @param {string} [uriOrConfig.username] - username to authenticate with monero-wallet-rpc (optional)
   * @param {string} [uriOrConfig.password] - password to authenticate with monero-wallet-rpc (optional)
   * @param {boolean} [uriOrConfig.rejectUnauthorized] - rejects self-signed certificates if true (default true)
   * @param {string} [username] - username to authenticate with monero-wallet-rpc (optional)
   * @param {string} [password] - password to authenticate with monero-wallet-rpc (optional)
   * @param {boolean} [rejectUnauthorized] - rejects self-signed certificates if true (default true)
   * @return {MoneroWalletRpc} the wallet RPC client
   */


  (0, _createClass2["default"])(MoneroWalletRpc, [{
    key: "getProcess",
    value: // --------------------------- RPC WALLET METHODS ---------------------------

    /**
     * Get the internal process running monero-wallet-rpc.
     * 
     * @return the process running monero-wallet-rpc, undefined if not created from new process
     */
    function getProcess() {
      return this.process;
    }
    /**
     * Stop the internal process running monero-wallet-rpc, if applicable.
     */

  }, {
    key: "stopProcess",
    value: function () {
      var _stopProcess = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
        var listenersCopy, _iterator, _step, listener;

        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(this.process === undefined)) {
                  _context.next = 2;
                  break;
                }

                throw new _MoneroError["default"]("MoneroWalletRpc instance not created from new process");

              case 2:
                listenersCopy = _GenUtils["default"].copyArray(this.getListeners());
                _iterator = _createForOfIteratorHelper(listenersCopy);
                _context.prev = 4;

                _iterator.s();

              case 6:
                if ((_step = _iterator.n()).done) {
                  _context.next = 12;
                  break;
                }

                listener = _step.value;
                _context.next = 10;
                return this.removeListener(listener);

              case 10:
                _context.next = 6;
                break;

              case 12:
                _context.next = 17;
                break;

              case 14:
                _context.prev = 14;
                _context.t0 = _context["catch"](4);

                _iterator.e(_context.t0);

              case 17:
                _context.prev = 17;

                _iterator.f();

                return _context.finish(17);

              case 20:
                return _context.abrupt("return", _GenUtils["default"].killProcess(this.process));

              case 21:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[4, 14, 17, 20]]);
      }));

      function stopProcess() {
        return _stopProcess.apply(this, arguments);
      }

      return stopProcess;
    }()
    /**
     * Get the wallet's RPC connection.
     * 
     * @return {MoneroWalletRpc} the wallet's rpc connection
     */

  }, {
    key: "getRpcConnection",
    value: function getRpcConnection() {
      return this.rpc;
    }
    /**
     * <p>Open an existing wallet on the monero-wallet-rpc server.</p>
     * 
     * <p>Example:<p>
     * 
     * <code>
     * let wallet = new MoneroWalletRpc("http://localhost:38084", "rpc_user", "abc123");<br>
     * await wallet.openWallet("mywallet1", "supersecretpassword");<br>
     * await wallet.openWallet({<br>
     * &nbsp;&nbsp; path: "mywallet2",<br>
     * &nbsp;&nbsp; password: "supersecretpassword",<br>
     * &nbsp;&nbsp; serverUri: "http://locahost:38081",<br>
     * &nbsp;&nbsp; rejectUnauthorized: false<br>
     * });<br>
     * </code>
     * 
     * @param {string|object|MoneroWalletConfig} pathOrConfig  - the wallet's name or configuration to open
     * @param {string} pathOrConfig.path - path of the wallet to create (optional, in-memory wallet if not given)
     * @param {string} pathOrConfig.password - password of the wallet to create
     * @param {string} pathOrConfig.serverUri - uri of a daemon to use (optional, monero-wallet-rpc usually started with daemon config)
     * @param {string} [pathOrConfig.serverUsername] - username to authenticate with the daemon (optional)
     * @param {string} [pathOrConfig.serverPassword] - password to authenticate with the daemon (optional)
     * @param {boolean} [pathOrConfig.rejectUnauthorized] - reject self-signed server certificates if true (defaults to true)
     * @param {MoneroRpcConnection|object} [pathOrConfig.server] - MoneroRpcConnection or equivalent JS object providing daemon configuration (optional)
     * @param {string} password is the wallet's password
     * @return {MoneroWalletRpc} this wallet client
     */

  }, {
    key: "openWallet",
    value: function () {
      var _openWallet = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(pathOrConfig, password) {
        var config;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                // normalize and validate config
                config = new _MoneroWalletConfig["default"](typeof pathOrConfig === "string" ? {
                  path: pathOrConfig,
                  password: password
                } : pathOrConfig); // TODO: ensure other fields are uninitialized?
                // open wallet on rpc server

                if (config.getPath()) {
                  _context2.next = 3;
                  break;
                }

                throw new _MoneroError["default"]("Must provide name of wallet to open");

              case 3:
                if (config.getPassword()) {
                  _context2.next = 5;
                  break;
                }

                throw new _MoneroError["default"]("Must provide password of wallet to open");

              case 5:
                _context2.next = 7;
                return this.rpc.sendJsonRequest("open_wallet", {
                  filename: config.getPath(),
                  password: config.getPassword()
                });

              case 7:
                _context2.next = 9;
                return this._clear();

              case 9:
                this.path = config.getPath(); // set daemon if provided

                if (!config.getServer()) {
                  _context2.next = 12;
                  break;
                }

                return _context2.abrupt("return", this.setDaemonConnection(config.getServer()));

              case 12:
                return _context2.abrupt("return", this);

              case 13:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function openWallet(_x, _x2) {
        return _openWallet.apply(this, arguments);
      }

      return openWallet;
    }()
    /**
     * <p>Create and open a wallet on the monero-wallet-rpc server.<p>
     * 
     * <p>Example:<p>
     * 
     * <code>
     * &sol;&sol; construct client to monero-wallet-rpc<br>
     * let walletRpc = new MoneroWalletRpc("http://localhost:38084", "rpc_user", "abc123");<br><br>
     * 
     * &sol;&sol; create and open wallet on monero-wallet-rpc<br>
     * await walletRpc.createWallet({<br>
     * &nbsp;&nbsp; path: "mywallet",<br>
     * &nbsp;&nbsp; password: "abc123",<br>
     * &nbsp;&nbsp; mnemonic: "coexist igloo pamphlet lagoon...",<br>
     * &nbsp;&nbsp; restoreHeight: 1543218l<br>
     * });
     *  </code>
     * 
     * @param {object|MoneroWalletConfig} config - MoneroWalletConfig or equivalent JS object
     * @param {string} config.path - path of the wallet to create (optional, in-memory wallet if not given)
     * @param {string} config.password - password of the wallet to create
     * @param {string} config.mnemonic - mnemonic of the wallet to create (optional, random wallet created if neither mnemonic nor keys given)
     * @param {string} config.seedOffset - the offset used to derive a new seed from the given mnemonic to recover a secret wallet from the mnemonic phrase
     * @param {string} config.primaryAddress - primary address of the wallet to create (only provide if restoring from keys)
     * @param {string} [config.privateViewKey] - private view key of the wallet to create (optional)
     * @param {string} [config.privateSpendKey] - private spend key of the wallet to create (optional)
     * @param {number} [config.restoreHeight] - block height to start scanning from (defaults to 0 unless generating random wallet)
     * @param {string} [config.language] - language of the wallet's mnemonic phrase (defaults to "English" or auto-detected)
     * @param {string} config.serverUri - uri of a daemon to use (optional, monero-wallet-rpc usually started with daemon config)
     * @param {string} [config.serverUsername] - username to authenticate with the daemon (optional)
     * @param {string} [config.serverPassword] - password to authenticate with the daemon (optional)
     * @param {boolean} [config.rejectUnauthorized] - reject self-signed server certificates if true (defaults to true)
     * @param {MoneroRpcConnection|object} [config.server] - MoneroRpcConnection or equivalent JS object providing daemon configuration (optional)
     * @param {boolean} [config.saveCurrent] - specifies if the current RPC wallet should be saved before being closed (default true)
     * @return {MoneroWalletRpc} this wallet client
     */

  }, {
    key: "createWallet",
    value: function () {
      var _createWallet = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(config) {
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (!(config === undefined)) {
                  _context3.next = 2;
                  break;
                }

                throw new _MoneroError["default"]("Must provide config to create wallet");

              case 2:
                config = config instanceof _MoneroWalletConfig["default"] ? config : new _MoneroWalletConfig["default"](config);

                if (!(config.getMnemonic() !== undefined && (config.getPrimaryAddress() !== undefined || config.getPrivateViewKey() !== undefined || config.getPrivateSpendKey() !== undefined))) {
                  _context3.next = 5;
                  break;
                }

                throw new _MoneroError["default"]("Wallet may be initialized with a mnemonic or keys but not both");

              case 5:
                if (!(config.getNetworkType() !== undefined)) {
                  _context3.next = 7;
                  break;
                }

                throw new _MoneroError["default"]("Cannot provide networkType when creating RPC wallet because server's network type is already set");

              case 7:
                if (!(config.getMnemonic() !== undefined)) {
                  _context3.next = 12;
                  break;
                }

                _context3.next = 10;
                return this._createWalletFromMnemonic(config.getPath(), config.getPassword(), config.getMnemonic(), config.getRestoreHeight(), config.getLanguage(), config.getSeedOffset(), config.getSaveCurrent());

              case 10:
                _context3.next = 27;
                break;

              case 12:
                if (!(config.getPrivateSpendKey() !== undefined || config.getPrimaryAddress() !== undefined)) {
                  _context3.next = 19;
                  break;
                }

                if (!(config.getSeedOffset() !== undefined)) {
                  _context3.next = 15;
                  break;
                }

                throw new _MoneroError["default"]("Cannot provide seedOffset when creating wallet from keys");

              case 15:
                _context3.next = 17;
                return this._createWalletFromKeys(config.getPath(), config.getPassword(), config.getPrimaryAddress(), config.getPrivateViewKey(), config.getPrivateSpendKey(), config.getRestoreHeight(), config.getLanguage(), config.getSaveCurrent());

              case 17:
                _context3.next = 27;
                break;

              case 19:
                if (!(config.getSeedOffset() !== undefined)) {
                  _context3.next = 21;
                  break;
                }

                throw new _MoneroError["default"]("Cannot provide seedOffset when creating random wallet");

              case 21:
                if (!(config.getRestoreHeight() !== undefined)) {
                  _context3.next = 23;
                  break;
                }

                throw new _MoneroError["default"]("Cannot provide restoreHeight when creating random wallet");

              case 23:
                if (!(config.getSaveCurrent() === false)) {
                  _context3.next = 25;
                  break;
                }

                throw new _MoneroError["default"]("Current wallet is saved automatically when creating random wallet");

              case 25:
                _context3.next = 27;
                return this._createWalletRandom(config.getPath(), config.getPassword(), config.getLanguage());

              case 27:
                if (!config.getServer()) {
                  _context3.next = 29;
                  break;
                }

                return _context3.abrupt("return", this.setDaemonConnection(config.getServer()));

              case 29:
                return _context3.abrupt("return", this);

              case 30:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function createWallet(_x3) {
        return _createWallet.apply(this, arguments);
      }

      return createWallet;
    }()
    /**
     * Create and open a new wallet with a randomly generated seed on the RPC server.
     * 
     * @param {string} name - name of the wallet file to create
     * @param {string} password - wallet's password
     * @param {string} language - language for the wallet's mnemonic phrase
     * @return {MoneroWalletRpc} this wallet client
     */

  }, {
    key: "_createWalletRandom",
    value: function () {
      var _createWalletRandom2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(name, password, language) {
        var params;
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (name) {
                  _context4.next = 2;
                  break;
                }

                throw new _MoneroError["default"]("Name is not initialized");

              case 2:
                if (password) {
                  _context4.next = 4;
                  break;
                }

                throw new _MoneroError["default"]("Password is not initialized");

              case 4:
                if (!language) language = _MoneroWallet2["default"].DEFAULT_LANGUAGE;
                params = {
                  filename: name,
                  password: password,
                  language: language
                };
                _context4.prev = 6;
                _context4.next = 9;
                return this.rpc.sendJsonRequest("create_wallet", params);

              case 9:
                _context4.next = 14;
                break;

              case 11:
                _context4.prev = 11;
                _context4.t0 = _context4["catch"](6);

                this._handleCreateWalletError(name, _context4.t0);

              case 14:
                _context4.next = 16;
                return this._clear();

              case 16:
                this.path = name;
                return _context4.abrupt("return", this);

              case 18:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this, [[6, 11]]);
      }));

      function _createWalletRandom(_x4, _x5, _x6) {
        return _createWalletRandom2.apply(this, arguments);
      }

      return _createWalletRandom;
    }()
    /**
     * Create and open a wallet from an existing mnemonic phrase on the RPC server,
     * closing the currently open wallet if applicable.
     * 
     * @param {string} name - name of the wallet to create on the RPC server
     * @param {string} password - wallet's password
     * @param {string} mnemonic - mnemonic of the wallet to construct
     * @param {number} [restoreHeight] - block height to restore from (default = 0)
     * @param {string} language - language of the mnemonic in case the old language is invalid
     * @param {string} seedOffset - offset used to derive a new seed from the given mnemonic to recover a secret wallet from the mnemonic phrase
     * @param {boolean} saveCurrent - specifies if the current RPC wallet should be saved before being closed
     * @return {MoneroWalletRpc} this wallet client
     */

  }, {
    key: "_createWalletFromMnemonic",
    value: function () {
      var _createWalletFromMnemonic2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(name, password, mnemonic, restoreHeight, language, seedOffset, saveCurrent) {
        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.prev = 0;
                _context5.next = 3;
                return this.rpc.sendJsonRequest("restore_deterministic_wallet", {
                  filename: name,
                  password: password,
                  seed: mnemonic,
                  seed_offset: seedOffset,
                  restore_height: restoreHeight,
                  language: language,
                  autosave_current: saveCurrent
                });

              case 3:
                _context5.next = 8;
                break;

              case 5:
                _context5.prev = 5;
                _context5.t0 = _context5["catch"](0);

                this._handleCreateWalletError(name, _context5.t0);

              case 8:
                _context5.next = 10;
                return this._clear();

              case 10:
                this.path = name;
                return _context5.abrupt("return", this);

              case 12:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this, [[0, 5]]);
      }));

      function _createWalletFromMnemonic(_x7, _x8, _x9, _x10, _x11, _x12, _x13) {
        return _createWalletFromMnemonic2.apply(this, arguments);
      }

      return _createWalletFromMnemonic;
    }()
    /**
     * Create a wallet on the RPC server from an address, view key, and (optionally) spend key.
     * 
     * @param name - name of the wallet to create on the RPC server
     * @param password - password encrypt the wallet
     * @param networkType - wallet's network type
     * @param address - address of the wallet to construct
     * @param viewKey - view key of the wallet to construct
     * @param spendKey - spend key of the wallet to construct or null to create a view-only wallet
     * @param restoreHeight - block height to restore (i.e. scan the chain) from (default = 0)
     * @param language - wallet and mnemonic's language (default = "English")
     * @return {MoneroWalletRpc} this wallet client
     */

  }, {
    key: "_createWalletFromKeys",
    value: function () {
      var _createWalletFromKeys2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6(name, password, address, viewKey, spendKey, restoreHeight, language, saveCurrent) {
        return _regenerator["default"].wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                if (restoreHeight === undefined) restoreHeight = 0;
                if (language === undefined) language = _MoneroWallet2["default"].DEFAULT_LANGUAGE;
                _context6.prev = 2;
                _context6.next = 5;
                return this.rpc.sendJsonRequest("generate_from_keys", {
                  filename: name,
                  password: password,
                  address: address,
                  viewkey: viewKey,
                  spendkey: spendKey,
                  restore_height: restoreHeight,
                  autosave_current: saveCurrent
                });

              case 5:
                _context6.next = 10;
                break;

              case 7:
                _context6.prev = 7;
                _context6.t0 = _context6["catch"](2);

                this._handleCreateWalletError(name, _context6.t0);

              case 10:
                _context6.next = 12;
                return this._clear();

              case 12:
                this.path = name;
                return _context6.abrupt("return", this);

              case 14:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this, [[2, 7]]);
      }));

      function _createWalletFromKeys(_x14, _x15, _x16, _x17, _x18, _x19, _x20, _x21) {
        return _createWalletFromKeys2.apply(this, arguments);
      }

      return _createWalletFromKeys;
    }()
  }, {
    key: "_handleCreateWalletError",
    value: function _handleCreateWalletError(name, err) {
      if (err.message === "Cannot create wallet. Already exists.") throw new _MoneroRpcError["default"]("Wallet already exists: " + name, err.getCode(), err.getRpcMethod(), err.getRpcParams());
      if (err.message === "Electrum-style word list failed verification") throw new _MoneroRpcError["default"]("Invalid mnemonic", err.getCode(), err.getRpcMethod(), err.getRpcParams());
      throw err;
    }
  }, {
    key: "isViewOnly",
    value: function () {
      var _isViewOnly = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7() {
        return _regenerator["default"].wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                _context7.prev = 0;
                _context7.next = 3;
                return this.rpc.sendJsonRequest("query_key", {
                  key_type: "mnemonic"
                });

              case 3:
                return _context7.abrupt("return", false);

              case 6:
                _context7.prev = 6;
                _context7.t0 = _context7["catch"](0);

                if (!(_context7.t0.getCode() === -29)) {
                  _context7.next = 10;
                  break;
                }

                return _context7.abrupt("return", true);

              case 10:
                if (!(_context7.t0.getCode() === -1)) {
                  _context7.next = 12;
                  break;
                }

                return _context7.abrupt("return", false);

              case 12:
                throw _context7.t0;

              case 13:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this, [[0, 6]]);
      }));

      function isViewOnly() {
        return _isViewOnly.apply(this, arguments);
      }

      return isViewOnly;
    }()
    /**
     * Set the wallet's daemon connection.
     * 
     * @param {string|MoneroRpcConnection} [uriOrConnection] - the daemon's URI or connection (defaults to offline)
     * @param {boolean} isTrusted - indicates if the daemon in trusted
     * @param {SslOptions} sslOptions - custom SSL configuration
     */

  }, {
    key: "setDaemonConnection",
    value: function () {
      var _setDaemonConnection = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee8(uriOrRpcConnection, isTrusted, sslOptions) {
        var connection, params;
        return _regenerator["default"].wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                connection = !uriOrRpcConnection ? undefined : uriOrRpcConnection instanceof _MoneroRpcConnection["default"] ? uriOrRpcConnection : new _MoneroRpcConnection["default"](uriOrRpcConnection);
                if (!sslOptions) sslOptions = new _SslOptions["default"]();
                params = {};
                params.address = connection ? connection.getUri() : "bad_uri"; // TODO monero-wallet-rpc: bad daemon uri necessary for offline?

                params.username = connection ? connection.getUsername() : "";
                params.password = connection ? connection.getPassword() : "";
                params.trusted = isTrusted;
                params.ssl_support = "autodetect";
                params.ssl_private_key_path = sslOptions.getPrivateKeyPath();
                params.ssl_certificate_path = sslOptions.getCertificatePath();
                params.ssl_ca_file = sslOptions.getCertificateAuthorityFile();
                params.ssl_allowed_fingerprints = sslOptions.getAllowedFingerprints();
                params.ssl_allow_any_cert = sslOptions.getAllowAnyCert();
                _context8.next = 15;
                return this.rpc.sendJsonRequest("set_daemon", params);

              case 15:
                this.daemonConnection = connection;

              case 16:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function setDaemonConnection(_x22, _x23, _x24) {
        return _setDaemonConnection.apply(this, arguments);
      }

      return setDaemonConnection;
    }()
  }, {
    key: "getDaemonConnection",
    value: function () {
      var _getDaemonConnection = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee9() {
        return _regenerator["default"].wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                return _context9.abrupt("return", this.daemonConnection);

              case 1:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function getDaemonConnection() {
        return _getDaemonConnection.apply(this, arguments);
      }

      return getDaemonConnection;
    }() // -------------------------- COMMON WALLET METHODS -------------------------

  }, {
    key: "addListener",
    value: function () {
      var _addListener = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee10(listener) {
        return _regenerator["default"].wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                (0, _assert["default"])(listener instanceof _MoneroWalletListener["default"], "Listener must be instance of MoneroWalletListener");
                this.listeners.push(listener);

                this._refreshListening();

              case 3:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function addListener(_x25) {
        return _addListener.apply(this, arguments);
      }

      return addListener;
    }()
  }, {
    key: "removeListener",
    value: function () {
      var _removeListener = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee11(listener) {
        var idx;
        return _regenerator["default"].wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                idx = this.listeners.indexOf(listener);

                if (!(idx > -1)) {
                  _context11.next = 5;
                  break;
                }

                this.listeners.splice(idx, 1);
                _context11.next = 6;
                break;

              case 5:
                throw new _MoneroError["default"]("Listener is not registered with wallet");

              case 6:
                this._refreshListening();

              case 7:
              case "end":
                return _context11.stop();
            }
          }
        }, _callee11, this);
      }));

      function removeListener(_x26) {
        return _removeListener.apply(this, arguments);
      }

      return removeListener;
    }()
  }, {
    key: "getListeners",
    value: function getListeners() {
      return this.listeners;
    }
  }, {
    key: "isConnectedToDaemon",
    value: function () {
      var _isConnectedToDaemon = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee12() {
        return _regenerator["default"].wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                _context12.prev = 0;
                _context12.t0 = this;
                _context12.next = 4;
                return this.getPrimaryAddress();

              case 4:
                _context12.t1 = _context12.sent;
                _context12.next = 7;
                return _context12.t0.checkReserveProof.call(_context12.t0, _context12.t1, "", "");

              case 7:
                throw new _MoneroError["default"]("check reserve expected to fail");

              case 10:
                _context12.prev = 10;
                _context12.t2 = _context12["catch"](0);
                return _context12.abrupt("return", _context12.t2.message.indexOf("Failed to connect to daemon") < 0);

              case 13:
              case "end":
                return _context12.stop();
            }
          }
        }, _callee12, this, [[0, 10]]);
      }));

      function isConnectedToDaemon() {
        return _isConnectedToDaemon.apply(this, arguments);
      }

      return isConnectedToDaemon;
    }()
  }, {
    key: "getVersion",
    value: function () {
      var _getVersion = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee13() {
        var resp;
        return _regenerator["default"].wrap(function _callee13$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                _context13.next = 2;
                return this.rpc.sendJsonRequest("get_version");

              case 2:
                resp = _context13.sent;
                return _context13.abrupt("return", new _MoneroVersion["default"](resp.result.version, resp.result.release));

              case 4:
              case "end":
                return _context13.stop();
            }
          }
        }, _callee13, this);
      }));

      function getVersion() {
        return _getVersion.apply(this, arguments);
      }

      return getVersion;
    }()
  }, {
    key: "getPath",
    value: function () {
      var _getPath = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee14() {
        return _regenerator["default"].wrap(function _callee14$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                return _context14.abrupt("return", this.path);

              case 1:
              case "end":
                return _context14.stop();
            }
          }
        }, _callee14, this);
      }));

      function getPath() {
        return _getPath.apply(this, arguments);
      }

      return getPath;
    }()
  }, {
    key: "getMnemonic",
    value: function () {
      var _getMnemonic = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee15() {
        var resp;
        return _regenerator["default"].wrap(function _callee15$(_context15) {
          while (1) {
            switch (_context15.prev = _context15.next) {
              case 0:
                _context15.prev = 0;
                _context15.next = 3;
                return this.rpc.sendJsonRequest("query_key", {
                  key_type: "mnemonic"
                });

              case 3:
                resp = _context15.sent;
                return _context15.abrupt("return", resp.result.key);

              case 7:
                _context15.prev = 7;
                _context15.t0 = _context15["catch"](0);

                if (!(_context15.t0.getCode() === -29)) {
                  _context15.next = 11;
                  break;
                }

                return _context15.abrupt("return", undefined);

              case 11:
                throw _context15.t0;

              case 12:
              case "end":
                return _context15.stop();
            }
          }
        }, _callee15, this, [[0, 7]]);
      }));

      function getMnemonic() {
        return _getMnemonic.apply(this, arguments);
      }

      return getMnemonic;
    }()
  }, {
    key: "getMnemonicLanguage",
    value: function () {
      var _getMnemonicLanguage = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee16() {
        return _regenerator["default"].wrap(function _callee16$(_context16) {
          while (1) {
            switch (_context16.prev = _context16.next) {
              case 0:
                _context16.next = 2;
                return this.getMnemonic();

              case 2:
                _context16.t0 = _context16.sent;
                _context16.t1 = undefined;

                if (!(_context16.t0 === _context16.t1)) {
                  _context16.next = 6;
                  break;
                }

                return _context16.abrupt("return", undefined);

              case 6:
                throw new _MoneroError["default"]("MoneroWalletRpc.getMnemonicLanguage() not supported");

              case 7:
              case "end":
                return _context16.stop();
            }
          }
        }, _callee16, this);
      }));

      function getMnemonicLanguage() {
        return _getMnemonicLanguage.apply(this, arguments);
      }

      return getMnemonicLanguage;
    }()
    /**
     * Get a list of available languages for the wallet's mnemonic phrase.
     * 
     * @return {string[]} the available languages for the wallet's mnemonic phrase
     */

  }, {
    key: "getMnemonicLanguages",
    value: function () {
      var _getMnemonicLanguages = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee17() {
        return _regenerator["default"].wrap(function _callee17$(_context17) {
          while (1) {
            switch (_context17.prev = _context17.next) {
              case 0:
                _context17.next = 2;
                return this.rpc.sendJsonRequest("get_languages");

              case 2:
                return _context17.abrupt("return", _context17.sent.result.languages);

              case 3:
              case "end":
                return _context17.stop();
            }
          }
        }, _callee17, this);
      }));

      function getMnemonicLanguages() {
        return _getMnemonicLanguages.apply(this, arguments);
      }

      return getMnemonicLanguages;
    }()
  }, {
    key: "getPrivateViewKey",
    value: function () {
      var _getPrivateViewKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee18() {
        var resp;
        return _regenerator["default"].wrap(function _callee18$(_context18) {
          while (1) {
            switch (_context18.prev = _context18.next) {
              case 0:
                _context18.next = 2;
                return this.rpc.sendJsonRequest("query_key", {
                  key_type: "view_key"
                });

              case 2:
                resp = _context18.sent;
                return _context18.abrupt("return", resp.result.key);

              case 4:
              case "end":
                return _context18.stop();
            }
          }
        }, _callee18, this);
      }));

      function getPrivateViewKey() {
        return _getPrivateViewKey.apply(this, arguments);
      }

      return getPrivateViewKey;
    }()
  }, {
    key: "getPrivateSpendKey",
    value: function () {
      var _getPrivateSpendKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee19() {
        var resp;
        return _regenerator["default"].wrap(function _callee19$(_context19) {
          while (1) {
            switch (_context19.prev = _context19.next) {
              case 0:
                _context19.prev = 0;
                _context19.next = 3;
                return this.rpc.sendJsonRequest("query_key", {
                  key_type: "spend_key"
                });

              case 3:
                resp = _context19.sent;
                return _context19.abrupt("return", resp.result.key);

              case 7:
                _context19.prev = 7;
                _context19.t0 = _context19["catch"](0);

                if (!(_context19.t0.getCode() === -29 && _context19.t0.message.indexOf("watch-only") !== -1)) {
                  _context19.next = 11;
                  break;
                }

                return _context19.abrupt("return", undefined);

              case 11:
                throw _context19.t0;

              case 12:
              case "end":
                return _context19.stop();
            }
          }
        }, _callee19, this, [[0, 7]]);
      }));

      function getPrivateSpendKey() {
        return _getPrivateSpendKey.apply(this, arguments);
      }

      return getPrivateSpendKey;
    }()
  }, {
    key: "getAddress",
    value: function () {
      var _getAddress = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee20(accountIdx, subaddressIdx) {
        var subaddressMap, address;
        return _regenerator["default"].wrap(function _callee20$(_context20) {
          while (1) {
            switch (_context20.prev = _context20.next) {
              case 0:
                subaddressMap = this.addressCache[accountIdx];

                if (subaddressMap) {
                  _context20.next = 5;
                  break;
                }

                _context20.next = 4;
                return this.getSubaddresses(accountIdx, undefined, true);

              case 4:
                return _context20.abrupt("return", this.getAddress(accountIdx, subaddressIdx));

              case 5:
                address = subaddressMap[subaddressIdx];

                if (address) {
                  _context20.next = 10;
                  break;
                }

                _context20.next = 9;
                return this.getSubaddresses(accountIdx, undefined, true);

              case 9:
                return _context20.abrupt("return", this.addressCache[accountIdx][subaddressIdx]);

              case 10:
                return _context20.abrupt("return", address);

              case 11:
              case "end":
                return _context20.stop();
            }
          }
        }, _callee20, this);
      }));

      function getAddress(_x27, _x28) {
        return _getAddress.apply(this, arguments);
      }

      return getAddress;
    }() // TODO: use cache

  }, {
    key: "getAddressIndex",
    value: function () {
      var _getAddressIndex = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee21(address) {
        var resp, subaddress;
        return _regenerator["default"].wrap(function _callee21$(_context21) {
          while (1) {
            switch (_context21.prev = _context21.next) {
              case 0:
                _context21.prev = 0;
                _context21.next = 3;
                return this.rpc.sendJsonRequest("get_address_index", {
                  address: address
                });

              case 3:
                resp = _context21.sent;
                _context21.next = 11;
                break;

              case 6:
                _context21.prev = 6;
                _context21.t0 = _context21["catch"](0);

                if (!(_context21.t0.getCode() === -2)) {
                  _context21.next = 10;
                  break;
                }

                throw new _MoneroError["default"](_context21.t0.message);

              case 10:
                throw _context21.t0;

              case 11:
                // convert rpc response
                subaddress = new _MoneroSubaddress["default"](address);
                subaddress.setAccountIndex(resp.result.index.major);
                subaddress.setIndex(resp.result.index.minor);
                return _context21.abrupt("return", subaddress);

              case 15:
              case "end":
                return _context21.stop();
            }
          }
        }, _callee21, this, [[0, 6]]);
      }));

      function getAddressIndex(_x29) {
        return _getAddressIndex.apply(this, arguments);
      }

      return getAddressIndex;
    }()
  }, {
    key: "getIntegratedAddress",
    value: function () {
      var _getIntegratedAddress = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee22(standardAddress, paymentId) {
        var integratedAddressStr;
        return _regenerator["default"].wrap(function _callee22$(_context22) {
          while (1) {
            switch (_context22.prev = _context22.next) {
              case 0:
                _context22.prev = 0;
                _context22.next = 3;
                return this.rpc.sendJsonRequest("make_integrated_address", {
                  standard_address: standardAddress,
                  payment_id: paymentId
                });

              case 3:
                integratedAddressStr = _context22.sent.result.integrated_address;
                _context22.next = 6;
                return this.decodeIntegratedAddress(integratedAddressStr);

              case 6:
                return _context22.abrupt("return", _context22.sent);

              case 9:
                _context22.prev = 9;
                _context22.t0 = _context22["catch"](0);

                if (!_context22.t0.message.includes("Invalid payment ID")) {
                  _context22.next = 13;
                  break;
                }

                throw new _MoneroError["default"]("Invalid payment ID: " + paymentId);

              case 13:
                throw _context22.t0;

              case 14:
              case "end":
                return _context22.stop();
            }
          }
        }, _callee22, this, [[0, 9]]);
      }));

      function getIntegratedAddress(_x30, _x31) {
        return _getIntegratedAddress.apply(this, arguments);
      }

      return getIntegratedAddress;
    }()
  }, {
    key: "decodeIntegratedAddress",
    value: function () {
      var _decodeIntegratedAddress = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee23(integratedAddress) {
        var resp;
        return _regenerator["default"].wrap(function _callee23$(_context23) {
          while (1) {
            switch (_context23.prev = _context23.next) {
              case 0:
                _context23.next = 2;
                return this.rpc.sendJsonRequest("split_integrated_address", {
                  integrated_address: integratedAddress
                });

              case 2:
                resp = _context23.sent;
                return _context23.abrupt("return", new _MoneroIntegratedAddress["default"]().setStandardAddress(resp.result.standard_address).setPaymentId(resp.result.payment_id).setIntegratedAddress(integratedAddress));

              case 4:
              case "end":
                return _context23.stop();
            }
          }
        }, _callee23, this);
      }));

      function decodeIntegratedAddress(_x32) {
        return _decodeIntegratedAddress.apply(this, arguments);
      }

      return decodeIntegratedAddress;
    }()
  }, {
    key: "getHeight",
    value: function () {
      var _getHeight = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee24() {
        return _regenerator["default"].wrap(function _callee24$(_context24) {
          while (1) {
            switch (_context24.prev = _context24.next) {
              case 0:
                _context24.next = 2;
                return this.rpc.sendJsonRequest("get_height");

              case 2:
                return _context24.abrupt("return", _context24.sent.result.height);

              case 3:
              case "end":
                return _context24.stop();
            }
          }
        }, _callee24, this);
      }));

      function getHeight() {
        return _getHeight.apply(this, arguments);
      }

      return getHeight;
    }()
  }, {
    key: "getDaemonHeight",
    value: function () {
      var _getDaemonHeight = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee25() {
        return _regenerator["default"].wrap(function _callee25$(_context25) {
          while (1) {
            switch (_context25.prev = _context25.next) {
              case 0:
                throw new _MoneroError["default"]("monero-wallet-rpc does not support getting the chain height");

              case 1:
              case "end":
                return _context25.stop();
            }
          }
        }, _callee25);
      }));

      function getDaemonHeight() {
        return _getDaemonHeight.apply(this, arguments);
      }

      return getDaemonHeight;
    }()
  }, {
    key: "getHeightByDate",
    value: function () {
      var _getHeightByDate = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee26(year, month, day) {
        return _regenerator["default"].wrap(function _callee26$(_context26) {
          while (1) {
            switch (_context26.prev = _context26.next) {
              case 0:
                throw new _MoneroError["default"]("monero-wallet-rpc does not support getting a height by date");

              case 1:
              case "end":
                return _context26.stop();
            }
          }
        }, _callee26);
      }));

      function getHeightByDate(_x33, _x34, _x35) {
        return _getHeightByDate.apply(this, arguments);
      }

      return getHeightByDate;
    }()
  }, {
    key: "sync",
    value: function () {
      var _sync = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee27(startHeight, onProgress) {
        var resp;
        return _regenerator["default"].wrap(function _callee27$(_context27) {
          while (1) {
            switch (_context27.prev = _context27.next) {
              case 0:
                (0, _assert["default"])(onProgress === undefined, "Monero Wallet RPC does not support reporting sync progress");
                _context27.prev = 1;
                _context27.next = 4;
                return this.rpc.sendJsonRequest("refresh", {
                  start_height: startHeight
                });

              case 4:
                resp = _context27.sent;
                _context27.next = 7;
                return this._poll();

              case 7:
                return _context27.abrupt("return", new _MoneroSyncResult["default"](resp.result.blocks_fetched, resp.result.received_money));

              case 10:
                _context27.prev = 10;
                _context27.t0 = _context27["catch"](1);

                if (!(_context27.t0.message === "no connection to daemon")) {
                  _context27.next = 14;
                  break;
                }

                throw new _MoneroError["default"]("Wallet is not connected to daemon");

              case 14:
                throw _context27.t0;

              case 15:
              case "end":
                return _context27.stop();
            }
          }
        }, _callee27, this, [[1, 10]]);
      }));

      function sync(_x36, _x37) {
        return _sync.apply(this, arguments);
      }

      return sync;
    }()
  }, {
    key: "startSyncing",
    value: function () {
      var _startSyncing = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee28(syncPeriodInMs) {
        var syncPeriodInSeconds;
        return _regenerator["default"].wrap(function _callee28$(_context28) {
          while (1) {
            switch (_context28.prev = _context28.next) {
              case 0:
                // convert ms to seconds for rpc parameter
                syncPeriodInSeconds = Math.round((syncPeriodInMs === undefined ? MoneroWalletRpc.DEFAULT_SYNC_PERIOD_IN_MS : syncPeriodInMs) / 1000); // send rpc request

                _context28.next = 3;
                return this.rpc.sendJsonRequest("auto_refresh", {
                  enable: true,
                  period: syncPeriodInSeconds
                });

              case 3:
                // update sync period for poller
                this.syncPeriodInMs = syncPeriodInSeconds * 1000;
                if (this.walletPoller !== undefined) this.walletPoller.setPeriodInMs(syncPeriodInMs); // poll if listening

                _context28.next = 7;
                return this._poll();

              case 7:
              case "end":
                return _context28.stop();
            }
          }
        }, _callee28, this);
      }));

      function startSyncing(_x38) {
        return _startSyncing.apply(this, arguments);
      }

      return startSyncing;
    }()
  }, {
    key: "stopSyncing",
    value: function () {
      var _stopSyncing = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee29() {
        return _regenerator["default"].wrap(function _callee29$(_context29) {
          while (1) {
            switch (_context29.prev = _context29.next) {
              case 0:
                return _context29.abrupt("return", this.rpc.sendJsonRequest("auto_refresh", {
                  enable: false
                }));

              case 1:
              case "end":
                return _context29.stop();
            }
          }
        }, _callee29, this);
      }));

      function stopSyncing() {
        return _stopSyncing.apply(this, arguments);
      }

      return stopSyncing;
    }()
  }, {
    key: "scanTxs",
    value: function () {
      var _scanTxs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee30(txHashes) {
        return _regenerator["default"].wrap(function _callee30$(_context30) {
          while (1) {
            switch (_context30.prev = _context30.next) {
              case 0:
                if (!(!txHashes || !txHashes.length)) {
                  _context30.next = 2;
                  break;
                }

                throw new _MoneroError["default"]("No tx hashes given to scan");

              case 2:
                _context30.next = 4;
                return this.rpc.sendJsonRequest("scan_tx", {
                  txids: txHashes
                });

              case 4:
                _context30.next = 6;
                return this._poll();

              case 6:
              case "end":
                return _context30.stop();
            }
          }
        }, _callee30, this);
      }));

      function scanTxs(_x39) {
        return _scanTxs.apply(this, arguments);
      }

      return scanTxs;
    }()
  }, {
    key: "rescanSpent",
    value: function () {
      var _rescanSpent = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee31() {
        return _regenerator["default"].wrap(function _callee31$(_context31) {
          while (1) {
            switch (_context31.prev = _context31.next) {
              case 0:
                _context31.next = 2;
                return this.rpc.sendJsonRequest("rescan_spent");

              case 2:
              case "end":
                return _context31.stop();
            }
          }
        }, _callee31, this);
      }));

      function rescanSpent() {
        return _rescanSpent.apply(this, arguments);
      }

      return rescanSpent;
    }()
  }, {
    key: "rescanBlockchain",
    value: function () {
      var _rescanBlockchain = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee32() {
        return _regenerator["default"].wrap(function _callee32$(_context32) {
          while (1) {
            switch (_context32.prev = _context32.next) {
              case 0:
                _context32.next = 2;
                return this.rpc.sendJsonRequest("rescan_blockchain");

              case 2:
              case "end":
                return _context32.stop();
            }
          }
        }, _callee32, this);
      }));

      function rescanBlockchain() {
        return _rescanBlockchain.apply(this, arguments);
      }

      return rescanBlockchain;
    }()
  }, {
    key: "getBalance",
    value: function () {
      var _getBalance = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee33(accountIdx, subaddressIdx) {
        return _regenerator["default"].wrap(function _callee33$(_context33) {
          while (1) {
            switch (_context33.prev = _context33.next) {
              case 0:
                _context33.next = 2;
                return this._getBalances(accountIdx, subaddressIdx);

              case 2:
                return _context33.abrupt("return", _context33.sent[0]);

              case 3:
              case "end":
                return _context33.stop();
            }
          }
        }, _callee33, this);
      }));

      function getBalance(_x40, _x41) {
        return _getBalance.apply(this, arguments);
      }

      return getBalance;
    }()
  }, {
    key: "getUnlockedBalance",
    value: function () {
      var _getUnlockedBalance = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee34(accountIdx, subaddressIdx) {
        return _regenerator["default"].wrap(function _callee34$(_context34) {
          while (1) {
            switch (_context34.prev = _context34.next) {
              case 0:
                _context34.next = 2;
                return this._getBalances(accountIdx, subaddressIdx);

              case 2:
                return _context34.abrupt("return", _context34.sent[1]);

              case 3:
              case "end":
                return _context34.stop();
            }
          }
        }, _callee34, this);
      }));

      function getUnlockedBalance(_x42, _x43) {
        return _getUnlockedBalance.apply(this, arguments);
      }

      return getUnlockedBalance;
    }()
  }, {
    key: "getAccounts",
    value: function () {
      var _getAccounts = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee35(includeSubaddresses, tag, skipBalances) {
        var resp, accounts, _iterator2, _step2, rpcAccount, _account2, _iterator3, _step3, _account, _iterator5, _step5, _subaddress, _iterator4, _step4, rpcSubaddress, subaddress, account, tgtSubaddress;

        return _regenerator["default"].wrap(function _callee35$(_context35) {
          while (1) {
            switch (_context35.prev = _context35.next) {
              case 0:
                _context35.next = 2;
                return this.rpc.sendJsonRequest("get_accounts", {
                  tag: tag
                });

              case 2:
                resp = _context35.sent;
                // build account objects and fetch subaddresses per account using get_address
                // TODO monero-wallet-rpc: get_address should support all_accounts so not called once per account
                accounts = [];
                _iterator2 = _createForOfIteratorHelper(resp.result.subaddress_accounts);
                _context35.prev = 5;

                _iterator2.s();

              case 7:
                if ((_step2 = _iterator2.n()).done) {
                  _context35.next = 19;
                  break;
                }

                rpcAccount = _step2.value;
                _account2 = MoneroWalletRpc._convertRpcAccount(rpcAccount);

                if (!includeSubaddresses) {
                  _context35.next = 16;
                  break;
                }

                _context35.t0 = _account2;
                _context35.next = 14;
                return this.getSubaddresses(_account2.getIndex(), undefined, true);

              case 14:
                _context35.t1 = _context35.sent;

                _context35.t0.setSubaddresses.call(_context35.t0, _context35.t1);

              case 16:
                accounts.push(_account2);

              case 17:
                _context35.next = 7;
                break;

              case 19:
                _context35.next = 24;
                break;

              case 21:
                _context35.prev = 21;
                _context35.t2 = _context35["catch"](5);

                _iterator2.e(_context35.t2);

              case 24:
                _context35.prev = 24;

                _iterator2.f();

                return _context35.finish(24);

              case 27:
                if (!(includeSubaddresses && !skipBalances)) {
                  _context35.next = 34;
                  break;
                }

                // these fields are not initialized if subaddress is unused and therefore not returned from `get_balance`
                _iterator3 = _createForOfIteratorHelper(accounts);

                try {
                  for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                    _account = _step3.value;
                    _iterator5 = _createForOfIteratorHelper(_account.getSubaddresses());

                    try {
                      for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
                        _subaddress = _step5.value;

                        _subaddress.setBalance(BigInt(0));

                        _subaddress.setUnlockedBalance(BigInt(0));

                        _subaddress.setNumUnspentOutputs(0);

                        _subaddress.setNumBlocksToUnlock(0);
                      }
                    } catch (err) {
                      _iterator5.e(err);
                    } finally {
                      _iterator5.f();
                    }
                  } // fetch and merge info from get_balance

                } catch (err) {
                  _iterator3.e(err);
                } finally {
                  _iterator3.f();
                }

                _context35.next = 32;
                return this.rpc.sendJsonRequest("get_balance", {
                  all_accounts: true
                });

              case 32:
                resp = _context35.sent;

                if (resp.result.per_subaddress) {
                  _iterator4 = _createForOfIteratorHelper(resp.result.per_subaddress);

                  try {
                    for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                      rpcSubaddress = _step4.value;
                      subaddress = MoneroWalletRpc._convertRpcSubaddress(rpcSubaddress); // merge info

                      account = accounts[subaddress.getAccountIndex()];

                      _assert["default"].equal(subaddress.getAccountIndex(), account.getIndex(), "RPC accounts are out of order"); // would need to switch lookup to loop


                      tgtSubaddress = account.getSubaddresses()[subaddress.getIndex()];

                      _assert["default"].equal(subaddress.getIndex(), tgtSubaddress.getIndex(), "RPC subaddresses are out of order");

                      if (subaddress.getBalance() !== undefined) tgtSubaddress.setBalance(subaddress.getBalance());
                      if (subaddress.getUnlockedBalance() !== undefined) tgtSubaddress.setUnlockedBalance(subaddress.getUnlockedBalance());
                      if (subaddress.getNumUnspentOutputs() !== undefined) tgtSubaddress.setNumUnspentOutputs(subaddress.getNumUnspentOutputs());
                    }
                  } catch (err) {
                    _iterator4.e(err);
                  } finally {
                    _iterator4.f();
                  }
                }

              case 34:
                return _context35.abrupt("return", accounts);

              case 35:
              case "end":
                return _context35.stop();
            }
          }
        }, _callee35, this, [[5, 21, 24, 27]]);
      }));

      function getAccounts(_x44, _x45, _x46) {
        return _getAccounts.apply(this, arguments);
      }

      return getAccounts;
    }() // TODO: getAccountByIndex(), getAccountByTag()

  }, {
    key: "getAccount",
    value: function () {
      var _getAccount = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee36(accountIdx, includeSubaddresses, skipBalances) {
        var _iterator6, _step6, account;

        return _regenerator["default"].wrap(function _callee36$(_context36) {
          while (1) {
            switch (_context36.prev = _context36.next) {
              case 0:
                (0, _assert["default"])(accountIdx >= 0);
                _context36.t0 = _createForOfIteratorHelper;
                _context36.next = 4;
                return this.getAccounts();

              case 4:
                _context36.t1 = _context36.sent;
                _iterator6 = (0, _context36.t0)(_context36.t1);
                _context36.prev = 6;

                _iterator6.s();

              case 8:
                if ((_step6 = _iterator6.n()).done) {
                  _context36.next = 20;
                  break;
                }

                account = _step6.value;

                if (!(account.getIndex() === accountIdx)) {
                  _context36.next = 18;
                  break;
                }

                if (!includeSubaddresses) {
                  _context36.next = 17;
                  break;
                }

                _context36.t2 = account;
                _context36.next = 15;
                return this.getSubaddresses(accountIdx, undefined, skipBalances);

              case 15:
                _context36.t3 = _context36.sent;

                _context36.t2.setSubaddresses.call(_context36.t2, _context36.t3);

              case 17:
                return _context36.abrupt("return", account);

              case 18:
                _context36.next = 8;
                break;

              case 20:
                _context36.next = 25;
                break;

              case 22:
                _context36.prev = 22;
                _context36.t4 = _context36["catch"](6);

                _iterator6.e(_context36.t4);

              case 25:
                _context36.prev = 25;

                _iterator6.f();

                return _context36.finish(25);

              case 28:
                throw new Exception("Account with index " + accountIdx + " does not exist");

              case 29:
              case "end":
                return _context36.stop();
            }
          }
        }, _callee36, this, [[6, 22, 25, 28]]);
      }));

      function getAccount(_x47, _x48, _x49) {
        return _getAccount.apply(this, arguments);
      }

      return getAccount;
    }()
  }, {
    key: "createAccount",
    value: function () {
      var _createAccount = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee37(label) {
        var resp;
        return _regenerator["default"].wrap(function _callee37$(_context37) {
          while (1) {
            switch (_context37.prev = _context37.next) {
              case 0:
                label = label ? label : undefined;
                _context37.next = 3;
                return this.rpc.sendJsonRequest("create_account", {
                  label: label
                });

              case 3:
                resp = _context37.sent;
                return _context37.abrupt("return", new _MoneroAccount["default"](resp.result.account_index, resp.result.address, BigInt(0), BigInt(0)));

              case 5:
              case "end":
                return _context37.stop();
            }
          }
        }, _callee37, this);
      }));

      function createAccount(_x50) {
        return _createAccount.apply(this, arguments);
      }

      return createAccount;
    }()
  }, {
    key: "getSubaddresses",
    value: function () {
      var _getSubaddresses = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee38(accountIdx, subaddressIndices, skipBalances) {
        var params, resp, subaddresses, _iterator7, _step7, _rpcSubaddress, _subaddress4, _iterator8, _step8, _subaddress2, _iterator9, _step9, rpcSubaddress, subaddress, _iterator10, _step10, tgtSubaddress, subaddressMap, _i, _subaddresses, _subaddress3;

        return _regenerator["default"].wrap(function _callee38$(_context38) {
          while (1) {
            switch (_context38.prev = _context38.next) {
              case 0:
                // fetch subaddresses
                params = {};
                params.account_index = accountIdx;
                if (subaddressIndices) params.address_index = _GenUtils["default"].listify(subaddressIndices);
                _context38.next = 5;
                return this.rpc.sendJsonRequest("get_address", params);

              case 5:
                resp = _context38.sent;
                // initialize subaddresses
                subaddresses = [];
                _iterator7 = _createForOfIteratorHelper(resp.result.addresses);

                try {
                  for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
                    _rpcSubaddress = _step7.value;
                    _subaddress4 = MoneroWalletRpc._convertRpcSubaddress(_rpcSubaddress);

                    _subaddress4.setAccountIndex(accountIdx);

                    subaddresses.push(_subaddress4);
                  } // fetch and initialize subaddress balances

                } catch (err) {
                  _iterator7.e(err);
                } finally {
                  _iterator7.f();
                }

                if (skipBalances) {
                  _context38.next = 53;
                  break;
                }

                // these fields are not initialized if subaddress is unused and therefore not returned from `get_balance`
                _iterator8 = _createForOfIteratorHelper(subaddresses);

                try {
                  for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
                    _subaddress2 = _step8.value;

                    _subaddress2.setBalance(BigInt(0));

                    _subaddress2.setUnlockedBalance(BigInt(0));

                    _subaddress2.setNumUnspentOutputs(0);

                    _subaddress2.setNumBlocksToUnlock(0);
                  } // fetch and initialize balances

                } catch (err) {
                  _iterator8.e(err);
                } finally {
                  _iterator8.f();
                }

                _context38.next = 14;
                return this.rpc.sendJsonRequest("get_balance", params);

              case 14:
                resp = _context38.sent;

                if (!resp.result.per_subaddress) {
                  _context38.next = 53;
                  break;
                }

                _iterator9 = _createForOfIteratorHelper(resp.result.per_subaddress);
                _context38.prev = 17;

                _iterator9.s();

              case 19:
                if ((_step9 = _iterator9.n()).done) {
                  _context38.next = 45;
                  break;
                }

                rpcSubaddress = _step9.value;
                subaddress = MoneroWalletRpc._convertRpcSubaddress(rpcSubaddress); // transfer info to existing subaddress object

                _iterator10 = _createForOfIteratorHelper(subaddresses);
                _context38.prev = 23;

                _iterator10.s();

              case 25:
                if ((_step10 = _iterator10.n()).done) {
                  _context38.next = 35;
                  break;
                }

                tgtSubaddress = _step10.value;

                if (!(tgtSubaddress.getIndex() !== subaddress.getIndex())) {
                  _context38.next = 29;
                  break;
                }

                return _context38.abrupt("continue", 33);

              case 29:
                // skip to subaddress with same index
                if (subaddress.getBalance() !== undefined) tgtSubaddress.setBalance(subaddress.getBalance());
                if (subaddress.getUnlockedBalance() !== undefined) tgtSubaddress.setUnlockedBalance(subaddress.getUnlockedBalance());
                if (subaddress.getNumUnspentOutputs() !== undefined) tgtSubaddress.setNumUnspentOutputs(subaddress.getNumUnspentOutputs());
                if (subaddress.getNumBlocksToUnlock() !== undefined) tgtSubaddress.setNumBlocksToUnlock(subaddress.getNumBlocksToUnlock());

              case 33:
                _context38.next = 25;
                break;

              case 35:
                _context38.next = 40;
                break;

              case 37:
                _context38.prev = 37;
                _context38.t0 = _context38["catch"](23);

                _iterator10.e(_context38.t0);

              case 40:
                _context38.prev = 40;

                _iterator10.f();

                return _context38.finish(40);

              case 43:
                _context38.next = 19;
                break;

              case 45:
                _context38.next = 50;
                break;

              case 47:
                _context38.prev = 47;
                _context38.t1 = _context38["catch"](17);

                _iterator9.e(_context38.t1);

              case 50:
                _context38.prev = 50;

                _iterator9.f();

                return _context38.finish(50);

              case 53:
                // cache addresses
                subaddressMap = this.addressCache[accountIdx];

                if (!subaddressMap) {
                  subaddressMap = {};
                  this.addressCache[accountIdx] = subaddressMap;
                }

                for (_i = 0, _subaddresses = subaddresses; _i < _subaddresses.length; _i++) {
                  _subaddress3 = _subaddresses[_i];
                  subaddressMap[_subaddress3.getIndex()] = _subaddress3.getAddress();
                } // return results


                return _context38.abrupt("return", subaddresses);

              case 57:
              case "end":
                return _context38.stop();
            }
          }
        }, _callee38, this, [[17, 47, 50, 53], [23, 37, 40, 43]]);
      }));

      function getSubaddresses(_x51, _x52, _x53) {
        return _getSubaddresses.apply(this, arguments);
      }

      return getSubaddresses;
    }()
  }, {
    key: "getSubaddress",
    value: function () {
      var _getSubaddress = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee39(accountIdx, subaddressIdx, skipBalances) {
        return _regenerator["default"].wrap(function _callee39$(_context39) {
          while (1) {
            switch (_context39.prev = _context39.next) {
              case 0:
                (0, _assert["default"])(accountIdx >= 0);
                (0, _assert["default"])(subaddressIdx >= 0);
                _context39.next = 4;
                return this.getSubaddresses(accountIdx, subaddressIdx, skipBalances);

              case 4:
                return _context39.abrupt("return", _context39.sent[0]);

              case 5:
              case "end":
                return _context39.stop();
            }
          }
        }, _callee39, this);
      }));

      function getSubaddress(_x54, _x55, _x56) {
        return _getSubaddress.apply(this, arguments);
      }

      return getSubaddress;
    }()
  }, {
    key: "createSubaddress",
    value: function () {
      var _createSubaddress = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee40(accountIdx, label) {
        var resp, subaddress;
        return _regenerator["default"].wrap(function _callee40$(_context40) {
          while (1) {
            switch (_context40.prev = _context40.next) {
              case 0:
                _context40.next = 2;
                return this.rpc.sendJsonRequest("create_address", {
                  account_index: accountIdx,
                  label: label
                });

              case 2:
                resp = _context40.sent;
                // build subaddress object
                subaddress = new _MoneroSubaddress["default"]();
                subaddress.setAccountIndex(accountIdx);
                subaddress.setIndex(resp.result.address_index);
                subaddress.setAddress(resp.result.address);
                subaddress.setLabel(label ? label : undefined);
                subaddress.setBalance(BigInt(0));
                subaddress.setUnlockedBalance(BigInt(0));
                subaddress.setNumUnspentOutputs(0);
                subaddress.setIsUsed(false);
                subaddress.setNumBlocksToUnlock(0);
                return _context40.abrupt("return", subaddress);

              case 14:
              case "end":
                return _context40.stop();
            }
          }
        }, _callee40, this);
      }));

      function createSubaddress(_x57, _x58) {
        return _createSubaddress.apply(this, arguments);
      }

      return createSubaddress;
    }()
  }, {
    key: "getTxs",
    value: function () {
      var _getTxs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee41(query, missingTxHashes) {
        var transferQuery, inputQuery, outputQuery, transfers, txs, txsSet, _iterator11, _step11, transfer, txMap, blockMap, _i2, _txs, tx, outputQueryAux, outputs, outputTxs, _iterator12, _step12, output, txsQueried, _i3, _txs2, _tx, unfoundTxHashes, _iterator13, _step13, txHash, found, _iterator15, _step15, _tx2, _iterator14, _step14, unfoundTxHash, _i4, _txs3, _tx3, txsById, _iterator16, _step16, _tx4, orderedTxs, _iterator17, _step17, hash;

        return _regenerator["default"].wrap(function _callee41$(_context41) {
          while (1) {
            switch (_context41.prev = _context41.next) {
              case 0:
                // copy query
                query = _MoneroWallet2["default"]._normalizeTxQuery(query); // temporarily disable transfer and output queries in order to collect all tx information

                transferQuery = query.getTransferQuery();
                inputQuery = query.getInputQuery();
                outputQuery = query.getOutputQuery();
                query.setTransferQuery(undefined);
                query.setInputQuery(undefined);
                query.setOutputQuery(undefined); // fetch all transfers that meet tx query

                _context41.next = 9;
                return this._getTransfersAux(new _MoneroTransferQuery["default"]().setTxQuery(MoneroWalletRpc._decontextualize(query.copy())));

              case 9:
                transfers = _context41.sent;
                // collect unique txs from transfers while retaining order
                txs = [];
                txsSet = new Set();
                _iterator11 = _createForOfIteratorHelper(transfers);

                try {
                  for (_iterator11.s(); !(_step11 = _iterator11.n()).done;) {
                    transfer = _step11.value;

                    if (!txsSet.has(transfer.getTx())) {
                      txs.push(transfer.getTx());
                      txsSet.add(transfer.getTx());
                    }
                  } // cache types into maps for merging and lookup

                } catch (err) {
                  _iterator11.e(err);
                } finally {
                  _iterator11.f();
                }

                txMap = {};
                blockMap = {};

                for (_i2 = 0, _txs = txs; _i2 < _txs.length; _i2++) {
                  tx = _txs[_i2];

                  MoneroWalletRpc._mergeTx(tx, txMap, blockMap);
                } // fetch and merge outputs if requested


                if (!(query.getIncludeOutputs() || outputQuery)) {
                  _context41.next = 25;
                  break;
                }

                // fetch outputs
                outputQueryAux = (outputQuery ? outputQuery.copy() : new _MoneroOutputQuery["default"]()).setTxQuery(MoneroWalletRpc._decontextualize(query.copy()));
                _context41.next = 21;
                return this._getOutputsAux(outputQueryAux);

              case 21:
                outputs = _context41.sent;
                // merge output txs one time while retaining order
                outputTxs = [];
                _iterator12 = _createForOfIteratorHelper(outputs);

                try {
                  for (_iterator12.s(); !(_step12 = _iterator12.n()).done;) {
                    output = _step12.value;

                    if (!outputTxs.includes(output.getTx())) {
                      MoneroWalletRpc._mergeTx(output.getTx(), txMap, blockMap);

                      outputTxs.push(output.getTx());
                    }
                  }
                } catch (err) {
                  _iterator12.e(err);
                } finally {
                  _iterator12.f();
                }

              case 25:
                // restore transfer and output queries
                query.setTransferQuery(transferQuery);
                query.setInputQuery(inputQuery);
                query.setOutputQuery(outputQuery); // filter txs that don't meet transfer query

                txsQueried = [];

                for (_i3 = 0, _txs2 = txs; _i3 < _txs2.length; _i3++) {
                  _tx = _txs2[_i3];
                  if (query.meetsCriteria(_tx)) txsQueried.push(_tx);else if (_tx.getBlock() !== undefined) _tx.getBlock().getTxs().splice(_tx.getBlock().getTxs().indexOf(_tx), 1);
                }

                txs = txsQueried; // collect unfound tx hashes

                if (!query.getHashes()) {
                  _context41.next = 75;
                  break;
                }

                unfoundTxHashes = [];
                _iterator13 = _createForOfIteratorHelper(query.getHashes());
                _context41.prev = 34;

                _iterator13.s();

              case 36:
                if ((_step13 = _iterator13.n()).done) {
                  _context41.next = 60;
                  break;
                }

                txHash = _step13.value;
                found = false;
                _iterator15 = _createForOfIteratorHelper(txs);
                _context41.prev = 40;

                _iterator15.s();

              case 42:
                if ((_step15 = _iterator15.n()).done) {
                  _context41.next = 49;
                  break;
                }

                _tx2 = _step15.value;

                if (!(txHash === _tx2.getHash())) {
                  _context41.next = 47;
                  break;
                }

                found = true;
                return _context41.abrupt("break", 49);

              case 47:
                _context41.next = 42;
                break;

              case 49:
                _context41.next = 54;
                break;

              case 51:
                _context41.prev = 51;
                _context41.t0 = _context41["catch"](40);

                _iterator15.e(_context41.t0);

              case 54:
                _context41.prev = 54;

                _iterator15.f();

                return _context41.finish(54);

              case 57:
                if (!found) unfoundTxHashes.push(txHash);

              case 58:
                _context41.next = 36;
                break;

              case 60:
                _context41.next = 65;
                break;

              case 62:
                _context41.prev = 62;
                _context41.t1 = _context41["catch"](34);

                _iterator13.e(_context41.t1);

              case 65:
                _context41.prev = 65;

                _iterator13.f();

                return _context41.finish(65);

              case 68:
                if (!missingTxHashes) {
                  _context41.next = 73;
                  break;
                }

                _iterator14 = _createForOfIteratorHelper(unfoundTxHashes);

                try {
                  for (_iterator14.s(); !(_step14 = _iterator14.n()).done;) {
                    unfoundTxHash = _step14.value;
                    missingTxHashes.push(unfoundTxHash);
                  }
                } catch (err) {
                  _iterator14.e(err);
                } finally {
                  _iterator14.f();
                }

                _context41.next = 75;
                break;

              case 73:
                if (!(unfoundTxHashes.length > 0)) {
                  _context41.next = 75;
                  break;
                }

                throw new _MoneroError["default"]("Wallet missing requested tx hashes: " + unfoundTxHashes);

              case 75:
                _i4 = 0, _txs3 = txs;

              case 76:
                if (!(_i4 < _txs3.length)) {
                  _context41.next = 84;
                  break;
                }

                _tx3 = _txs3[_i4];

                if (!(_tx3.isConfirmed() && _tx3.getBlock() === undefined)) {
                  _context41.next = 81;
                  break;
                }

                console.error("Inconsistency detected building txs from multiple rpc calls, re-fetching txs");
                return _context41.abrupt("return", this.getTxs(query));

              case 81:
                _i4++;
                _context41.next = 76;
                break;

              case 84:
                // order txs if tx hashes given then return
                if (query.getHashes() && query.getHashes().length > 0) {
                  txsById = new Map(); // store txs in temporary map for sorting

                  _iterator16 = _createForOfIteratorHelper(txs);

                  try {
                    for (_iterator16.s(); !(_step16 = _iterator16.n()).done;) {
                      _tx4 = _step16.value;
                      txsById.set(_tx4.getHash(), _tx4);
                    }
                  } catch (err) {
                    _iterator16.e(err);
                  } finally {
                    _iterator16.f();
                  }

                  orderedTxs = [];
                  _iterator17 = _createForOfIteratorHelper(query.getHashes());

                  try {
                    for (_iterator17.s(); !(_step17 = _iterator17.n()).done;) {
                      hash = _step17.value;
                      if (txsById.get(hash)) orderedTxs.push(txsById.get(hash));
                    }
                  } catch (err) {
                    _iterator17.e(err);
                  } finally {
                    _iterator17.f();
                  }

                  txs = orderedTxs;
                }

                return _context41.abrupt("return", txs);

              case 86:
              case "end":
                return _context41.stop();
            }
          }
        }, _callee41, this, [[34, 62, 65, 68], [40, 51, 54, 57]]);
      }));

      function getTxs(_x59, _x60) {
        return _getTxs.apply(this, arguments);
      }

      return getTxs;
    }()
  }, {
    key: "getTransfers",
    value: function () {
      var _getTransfers = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee42(query) {
        var transfers, _iterator18, _step18, tx, _iterator19, _step19, transfer;

        return _regenerator["default"].wrap(function _callee42$(_context42) {
          while (1) {
            switch (_context42.prev = _context42.next) {
              case 0:
                // copy and normalize query up to block
                query = _MoneroWallet2["default"]._normalizeTransferQuery(query); // get transfers directly if query does not require tx context (other transfers, outputs)

                if (MoneroWalletRpc._isContextual(query)) {
                  _context42.next = 3;
                  break;
                }

                return _context42.abrupt("return", this._getTransfersAux(query));

              case 3:
                // otherwise get txs with full models to fulfill query
                transfers = [];
                _context42.t0 = _createForOfIteratorHelper;
                _context42.next = 7;
                return this.getTxs(query.getTxQuery());

              case 7:
                _context42.t1 = _context42.sent;
                _iterator18 = (0, _context42.t0)(_context42.t1);

                try {
                  for (_iterator18.s(); !(_step18 = _iterator18.n()).done;) {
                    tx = _step18.value;
                    _iterator19 = _createForOfIteratorHelper(tx.filterTransfers(query));

                    try {
                      for (_iterator19.s(); !(_step19 = _iterator19.n()).done;) {
                        transfer = _step19.value;
                        transfers.push(transfer);
                      }
                    } catch (err) {
                      _iterator19.e(err);
                    } finally {
                      _iterator19.f();
                    }
                  }
                } catch (err) {
                  _iterator18.e(err);
                } finally {
                  _iterator18.f();
                }

                return _context42.abrupt("return", transfers);

              case 11:
              case "end":
                return _context42.stop();
            }
          }
        }, _callee42, this);
      }));

      function getTransfers(_x61) {
        return _getTransfers.apply(this, arguments);
      }

      return getTransfers;
    }()
  }, {
    key: "getOutputs",
    value: function () {
      var _getOutputs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee43(query) {
        var outputs, _iterator20, _step20, tx, _iterator21, _step21, output;

        return _regenerator["default"].wrap(function _callee43$(_context43) {
          while (1) {
            switch (_context43.prev = _context43.next) {
              case 0:
                // copy and normalize query up to block
                query = _MoneroWallet2["default"]._normalizeOutputQuery(query); // get outputs directly if query does not require tx context (other outputs, transfers)

                if (MoneroWalletRpc._isContextual(query)) {
                  _context43.next = 3;
                  break;
                }

                return _context43.abrupt("return", this._getOutputsAux(query));

              case 3:
                // otherwise get txs with full models to fulfill query
                outputs = [];
                _context43.t0 = _createForOfIteratorHelper;
                _context43.next = 7;
                return this.getTxs(query.getTxQuery());

              case 7:
                _context43.t1 = _context43.sent;
                _iterator20 = (0, _context43.t0)(_context43.t1);

                try {
                  for (_iterator20.s(); !(_step20 = _iterator20.n()).done;) {
                    tx = _step20.value;
                    _iterator21 = _createForOfIteratorHelper(tx.filterOutputs(query));

                    try {
                      for (_iterator21.s(); !(_step21 = _iterator21.n()).done;) {
                        output = _step21.value;
                        outputs.push(output);
                      }
                    } catch (err) {
                      _iterator21.e(err);
                    } finally {
                      _iterator21.f();
                    }
                  }
                } catch (err) {
                  _iterator20.e(err);
                } finally {
                  _iterator20.f();
                }

                return _context43.abrupt("return", outputs);

              case 11:
              case "end":
                return _context43.stop();
            }
          }
        }, _callee43, this);
      }));

      function getOutputs(_x62) {
        return _getOutputs.apply(this, arguments);
      }

      return getOutputs;
    }()
  }, {
    key: "exportOutputs",
    value: function () {
      var _exportOutputs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee44(all) {
        return _regenerator["default"].wrap(function _callee44$(_context44) {
          while (1) {
            switch (_context44.prev = _context44.next) {
              case 0:
                _context44.next = 2;
                return this.rpc.sendJsonRequest("export_outputs", {
                  all: all
                });

              case 2:
                return _context44.abrupt("return", _context44.sent.result.outputs_data_hex);

              case 3:
              case "end":
                return _context44.stop();
            }
          }
        }, _callee44, this);
      }));

      function exportOutputs(_x63) {
        return _exportOutputs.apply(this, arguments);
      }

      return exportOutputs;
    }()
  }, {
    key: "importOutputs",
    value: function () {
      var _importOutputs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee45(outputsHex) {
        var resp;
        return _regenerator["default"].wrap(function _callee45$(_context45) {
          while (1) {
            switch (_context45.prev = _context45.next) {
              case 0:
                _context45.next = 2;
                return this.rpc.sendJsonRequest("import_outputs", {
                  outputs_data_hex: outputsHex
                });

              case 2:
                resp = _context45.sent;
                return _context45.abrupt("return", resp.result.num_imported);

              case 4:
              case "end":
                return _context45.stop();
            }
          }
        }, _callee45, this);
      }));

      function importOutputs(_x64) {
        return _importOutputs.apply(this, arguments);
      }

      return importOutputs;
    }()
  }, {
    key: "exportKeyImages",
    value: function () {
      var _exportKeyImages = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee46(all) {
        return _regenerator["default"].wrap(function _callee46$(_context46) {
          while (1) {
            switch (_context46.prev = _context46.next) {
              case 0:
                _context46.next = 2;
                return this._rpcExportKeyImages(all);

              case 2:
                return _context46.abrupt("return", _context46.sent);

              case 3:
              case "end":
                return _context46.stop();
            }
          }
        }, _callee46, this);
      }));

      function exportKeyImages(_x65) {
        return _exportKeyImages.apply(this, arguments);
      }

      return exportKeyImages;
    }()
  }, {
    key: "importKeyImages",
    value: function () {
      var _importKeyImages = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee47(keyImages) {
        var rpcKeyImages, resp, importResult;
        return _regenerator["default"].wrap(function _callee47$(_context47) {
          while (1) {
            switch (_context47.prev = _context47.next) {
              case 0:
                // convert key images to rpc parameter
                rpcKeyImages = keyImages.map(function (keyImage) {
                  return {
                    key_image: keyImage.getHex(),
                    signature: keyImage.getSignature()
                  };
                }); // send request

                _context47.next = 3;
                return this.rpc.sendJsonRequest("import_key_images", {
                  signed_key_images: rpcKeyImages
                });

              case 3:
                resp = _context47.sent;
                // build and return result
                importResult = new _MoneroKeyImageImportResult["default"]();
                importResult.setHeight(resp.result.height);
                importResult.setSpentAmount(BigInt(resp.result.spent));
                importResult.setUnspentAmount(BigInt(resp.result.unspent));
                return _context47.abrupt("return", importResult);

              case 9:
              case "end":
                return _context47.stop();
            }
          }
        }, _callee47, this);
      }));

      function importKeyImages(_x66) {
        return _importKeyImages.apply(this, arguments);
      }

      return importKeyImages;
    }()
  }, {
    key: "getNewKeyImagesFromLastImport",
    value: function () {
      var _getNewKeyImagesFromLastImport = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee48() {
        return _regenerator["default"].wrap(function _callee48$(_context48) {
          while (1) {
            switch (_context48.prev = _context48.next) {
              case 0:
                _context48.next = 2;
                return this._rpcExportKeyImages(false);

              case 2:
                return _context48.abrupt("return", _context48.sent);

              case 3:
              case "end":
                return _context48.stop();
            }
          }
        }, _callee48, this);
      }));

      function getNewKeyImagesFromLastImport() {
        return _getNewKeyImagesFromLastImport.apply(this, arguments);
      }

      return getNewKeyImagesFromLastImport;
    }()
  }, {
    key: "freezeOutput",
    value: function () {
      var _freezeOutput = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee49(keyImage) {
        return _regenerator["default"].wrap(function _callee49$(_context49) {
          while (1) {
            switch (_context49.prev = _context49.next) {
              case 0:
                return _context49.abrupt("return", this.rpc.sendJsonRequest("freeze", {
                  key_image: keyImage
                }));

              case 1:
              case "end":
                return _context49.stop();
            }
          }
        }, _callee49, this);
      }));

      function freezeOutput(_x67) {
        return _freezeOutput.apply(this, arguments);
      }

      return freezeOutput;
    }()
  }, {
    key: "thawOutput",
    value: function () {
      var _thawOutput = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee50(keyImage) {
        return _regenerator["default"].wrap(function _callee50$(_context50) {
          while (1) {
            switch (_context50.prev = _context50.next) {
              case 0:
                return _context50.abrupt("return", this.rpc.sendJsonRequest("thaw", {
                  key_image: keyImage
                }));

              case 1:
              case "end":
                return _context50.stop();
            }
          }
        }, _callee50, this);
      }));

      function thawOutput(_x68) {
        return _thawOutput.apply(this, arguments);
      }

      return thawOutput;
    }()
  }, {
    key: "isOutputFrozen",
    value: function () {
      var _isOutputFrozen = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee51(keyImage) {
        var resp;
        return _regenerator["default"].wrap(function _callee51$(_context51) {
          while (1) {
            switch (_context51.prev = _context51.next) {
              case 0:
                _context51.next = 2;
                return this.rpc.sendJsonRequest("frozen", {
                  key_image: keyImage
                });

              case 2:
                resp = _context51.sent;
                return _context51.abrupt("return", resp.result.frozen === true);

              case 4:
              case "end":
                return _context51.stop();
            }
          }
        }, _callee51, this);
      }));

      function isOutputFrozen(_x69) {
        return _isOutputFrozen.apply(this, arguments);
      }

      return isOutputFrozen;
    }()
  }, {
    key: "createTxs",
    value: function () {
      var _createTxs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee52(config) {
        var accountIdx, subaddressIndices, params, _iterator22, _step22, destination, result, resp, txs, numTxs, copyDestinations, i, tx;

        return _regenerator["default"].wrap(function _callee52$(_context52) {
          while (1) {
            switch (_context52.prev = _context52.next) {
              case 0:
                // validate, copy, and normalize config
                config = _MoneroWallet2["default"]._normalizeCreateTxsConfig(config);
                if (config.getCanSplit() === undefined) config.setCanSplit(true);
                _context52.t0 = config.getRelay() === true;

                if (!_context52.t0) {
                  _context52.next = 7;
                  break;
                }

                _context52.next = 6;
                return this.isMultisig();

              case 6:
                _context52.t0 = _context52.sent;

              case 7:
                if (!_context52.t0) {
                  _context52.next = 9;
                  break;
                }

                throw new _MoneroError["default"]("Cannot relay multisig transaction until co-signed");

              case 9:
                // determine account and subaddresses to send from
                accountIdx = config.getAccountIndex();

                if (!(accountIdx === undefined)) {
                  _context52.next = 12;
                  break;
                }

                throw new _MoneroError["default"]("Must provide the account index to send from");

              case 12:
                subaddressIndices = config.getSubaddressIndices() === undefined ? undefined : config.getSubaddressIndices().slice(0); // fetch all or copy given indices
                // build config parameters

                params = {};
                params.destinations = [];
                _iterator22 = _createForOfIteratorHelper(config.getDestinations());

                try {
                  for (_iterator22.s(); !(_step22 = _iterator22.n()).done;) {
                    destination = _step22.value;
                    (0, _assert["default"])(destination.getAddress(), "Destination address is not defined");
                    (0, _assert["default"])(destination.getAmount(), "Destination amount is not defined");
                    params.destinations.push({
                      address: destination.getAddress(),
                      amount: destination.getAmount().toString()
                    });
                  }
                } catch (err) {
                  _iterator22.e(err);
                } finally {
                  _iterator22.f();
                }

                params.account_index = accountIdx;
                params.subaddr_indices = subaddressIndices;
                params.payment_id = config.getPaymentId();
                params.unlock_time = config.getUnlockHeight();
                params.do_not_relay = config.getRelay() !== true;
                (0, _assert["default"])(config.getPriority() === undefined || config.getPriority() >= 0 && config.getPriority() <= 3);
                params.priority = config.getPriority();
                params.get_tx_hex = true;
                params.get_tx_metadata = true;
                if (config.getCanSplit()) params.get_tx_keys = true; // param to get tx key(s) depends if split
                else params.get_tx_key = true; // send request

                _context52.prev = 27;
                _context52.next = 30;
                return this.rpc.sendJsonRequest(config.getCanSplit() ? "transfer_split" : "transfer", params);

              case 30:
                resp = _context52.sent;
                result = resp.result;
                _context52.next = 39;
                break;

              case 34:
                _context52.prev = 34;
                _context52.t1 = _context52["catch"](27);

                if (!(_context52.t1.message.indexOf("WALLET_RPC_ERROR_CODE_WRONG_ADDRESS") > -1)) {
                  _context52.next = 38;
                  break;
                }

                throw new _MoneroError["default"]("Invalid destination address");

              case 38:
                throw _context52.t1;

              case 39:
                numTxs = config.getCanSplit() ? result.fee_list !== undefined ? result.fee_list.length : 0 : result.fee !== undefined ? 1 : 0;
                if (numTxs > 0) txs = [];
                copyDestinations = numTxs === 1;

                for (i = 0; i < numTxs; i++) {
                  tx = new _MoneroTxWallet["default"]();

                  MoneroWalletRpc._initSentTxWallet(config, tx, copyDestinations);

                  tx.getOutgoingTransfer().setAccountIndex(accountIdx);
                  if (subaddressIndices !== undefined && subaddressIndices.length === 1) tx.getOutgoingTransfer().setSubaddressIndices(subaddressIndices);
                  txs.push(tx);
                } // notify of changes


                if (!config.getRelay()) {
                  _context52.next = 46;
                  break;
                }

                _context52.next = 46;
                return this._poll();

              case 46:
                if (!config.getCanSplit()) {
                  _context52.next = 50;
                  break;
                }

                return _context52.abrupt("return", MoneroWalletRpc._convertRpcSentTxsToTxSet(result, txs).getTxs());

              case 50:
                return _context52.abrupt("return", MoneroWalletRpc._convertRpcTxToTxSet(result, txs === undefined ? undefined : txs[0], true).getTxs());

              case 51:
              case "end":
                return _context52.stop();
            }
          }
        }, _callee52, this, [[27, 34]]);
      }));

      function createTxs(_x70) {
        return _createTxs.apply(this, arguments);
      }

      return createTxs;
    }()
  }, {
    key: "sweepOutput",
    value: function () {
      var _sweepOutput = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee53(config) {
        var params, resp, result, tx;
        return _regenerator["default"].wrap(function _callee53$(_context53) {
          while (1) {
            switch (_context53.prev = _context53.next) {
              case 0:
                // normalize and validate config
                config = _MoneroWallet2["default"]._normalizeSweepOutputConfig(config); // build config parameters

                params = {};
                params.address = config.getDestinations()[0].getAddress();
                params.account_index = config.getAccountIndex();
                params.subaddr_indices = config.getSubaddressIndices();
                params.key_image = config.getKeyImage();
                params.unlock_time = config.getUnlockHeight();
                params.do_not_relay = config.getRelay() !== true;
                (0, _assert["default"])(config.getPriority() === undefined || config.getPriority() >= 0 && config.getPriority() <= 3);
                params.priority = config.getPriority();
                params.payment_id = config.getPaymentId();
                params.get_tx_key = true;
                params.get_tx_hex = true;
                params.get_tx_metadata = true; // send request

                _context53.next = 16;
                return this.rpc.sendJsonRequest("sweep_single", params);

              case 16:
                resp = _context53.sent;
                result = resp.result; // notify of changes

                if (!config.getRelay()) {
                  _context53.next = 21;
                  break;
                }

                _context53.next = 21;
                return this._poll();

              case 21:
                // build and return tx
                tx = MoneroWalletRpc._initSentTxWallet(config, null, true);

                MoneroWalletRpc._convertRpcTxToTxSet(result, tx, true);

                tx.getOutgoingTransfer().getDestinations()[0].setAmount(tx.getOutgoingTransfer().getAmount()); // initialize destination amount

                return _context53.abrupt("return", tx);

              case 25:
              case "end":
                return _context53.stop();
            }
          }
        }, _callee53, this);
      }));

      function sweepOutput(_x71) {
        return _sweepOutput.apply(this, arguments);
      }

      return sweepOutput;
    }()
  }, {
    key: "sweepUnlocked",
    value: function () {
      var _sweepUnlocked = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee54(config) {
        var indices, subaddressIndices, _iterator23, _step23, subaddress, accounts, _iterator24, _step24, account, _subaddressIndices, _iterator25, _step25, _subaddress5, txs, _iterator26, _step26, accountIdx, copy, _iterator27, _step27, tx, _iterator28, _step28, subaddressIdx, _iterator29, _step29, _tx5;

        return _regenerator["default"].wrap(function _callee54$(_context54) {
          while (1) {
            switch (_context54.prev = _context54.next) {
              case 0:
                // validate and normalize config
                config = _MoneroWallet2["default"]._normalizeSweepUnlockedConfig(config); // determine account and subaddress indices to sweep; default to all with unlocked balance if not specified

                indices = new Map(); // maps each account index to subaddress indices to sweep

                if (!(config.getAccountIndex() !== undefined)) {
                  _context54.next = 17;
                  break;
                }

                if (!(config.getSubaddressIndices() !== undefined)) {
                  _context54.next = 7;
                  break;
                }

                indices.set(config.getAccountIndex(), config.getSubaddressIndices());
                _context54.next = 15;
                break;

              case 7:
                subaddressIndices = [];
                indices.set(config.getAccountIndex(), subaddressIndices);
                _context54.t0 = _createForOfIteratorHelper;
                _context54.next = 12;
                return this.getSubaddresses(config.getAccountIndex());

              case 12:
                _context54.t1 = _context54.sent;
                _iterator23 = (0, _context54.t0)(_context54.t1);

                try {
                  for (_iterator23.s(); !(_step23 = _iterator23.n()).done;) {
                    subaddress = _step23.value;
                    if (_GenUtils["default"].compareBigInt(subaddress.getUnlockedBalance(), BigInt(0)) > 0) subaddressIndices.push(subaddress.getIndex());
                  }
                } catch (err) {
                  _iterator23.e(err);
                } finally {
                  _iterator23.f();
                }

              case 15:
                _context54.next = 22;
                break;

              case 17:
                _context54.next = 19;
                return this.getAccounts(true);

              case 19:
                accounts = _context54.sent;
                _iterator24 = _createForOfIteratorHelper(accounts);

                try {
                  for (_iterator24.s(); !(_step24 = _iterator24.n()).done;) {
                    account = _step24.value;

                    if (_GenUtils["default"].compareBigInt(account.getUnlockedBalance(), BigInt(0)) > 0) {
                      _subaddressIndices = [];
                      indices.set(account.getIndex(), _subaddressIndices);
                      _iterator25 = _createForOfIteratorHelper(account.getSubaddresses());

                      try {
                        for (_iterator25.s(); !(_step25 = _iterator25.n()).done;) {
                          _subaddress5 = _step25.value;
                          if (_GenUtils["default"].compareBigInt(_subaddress5.getUnlockedBalance(), BigInt(0)) > 0) _subaddressIndices.push(_subaddress5.getIndex());
                        }
                      } catch (err) {
                        _iterator25.e(err);
                      } finally {
                        _iterator25.f();
                      }
                    }
                  }
                } catch (err) {
                  _iterator24.e(err);
                } finally {
                  _iterator24.f();
                }

              case 22:
                // sweep from each account and collect resulting tx sets
                txs = [];
                _iterator26 = _createForOfIteratorHelper(indices.keys());
                _context54.prev = 24;

                _iterator26.s();

              case 26:
                if ((_step26 = _iterator26.n()).done) {
                  _context54.next = 65;
                  break;
                }

                accountIdx = _step26.value;
                // copy and modify the original config
                copy = config.copy();
                copy.setAccountIndex(accountIdx);
                copy.setSweepEachSubaddress(false); // sweep all subaddresses together  // TODO monero-project: can this reveal outputs belong to the same wallet?

                if (!(copy.getSweepEachSubaddress() !== true)) {
                  _context54.next = 41;
                  break;
                }

                copy.setSubaddressIndices(indices.get(accountIdx));
                _context54.t2 = _createForOfIteratorHelper;
                _context54.next = 36;
                return this._rpcSweepAccount(copy);

              case 36:
                _context54.t3 = _context54.sent;
                _iterator27 = (0, _context54.t2)(_context54.t3);

                try {
                  for (_iterator27.s(); !(_step27 = _iterator27.n()).done;) {
                    tx = _step27.value;
                    txs.push(tx);
                  }
                } catch (err) {
                  _iterator27.e(err);
                } finally {
                  _iterator27.f();
                }

                _context54.next = 63;
                break;

              case 41:
                _iterator28 = _createForOfIteratorHelper(indices.get(accountIdx));
                _context54.prev = 42;

                _iterator28.s();

              case 44:
                if ((_step28 = _iterator28.n()).done) {
                  _context54.next = 55;
                  break;
                }

                subaddressIdx = _step28.value;
                copy.setSubaddressIndices([subaddressIdx]);
                _context54.t4 = _createForOfIteratorHelper;
                _context54.next = 50;
                return this._rpcSweepAccount(copy);

              case 50:
                _context54.t5 = _context54.sent;
                _iterator29 = (0, _context54.t4)(_context54.t5);

                try {
                  for (_iterator29.s(); !(_step29 = _iterator29.n()).done;) {
                    _tx5 = _step29.value;
                    txs.push(_tx5);
                  }
                } catch (err) {
                  _iterator29.e(err);
                } finally {
                  _iterator29.f();
                }

              case 53:
                _context54.next = 44;
                break;

              case 55:
                _context54.next = 60;
                break;

              case 57:
                _context54.prev = 57;
                _context54.t6 = _context54["catch"](42);

                _iterator28.e(_context54.t6);

              case 60:
                _context54.prev = 60;

                _iterator28.f();

                return _context54.finish(60);

              case 63:
                _context54.next = 26;
                break;

              case 65:
                _context54.next = 70;
                break;

              case 67:
                _context54.prev = 67;
                _context54.t7 = _context54["catch"](24);

                _iterator26.e(_context54.t7);

              case 70:
                _context54.prev = 70;

                _iterator26.f();

                return _context54.finish(70);

              case 73:
                if (!config.getRelay()) {
                  _context54.next = 76;
                  break;
                }

                _context54.next = 76;
                return this._poll();

              case 76:
                return _context54.abrupt("return", txs);

              case 77:
              case "end":
                return _context54.stop();
            }
          }
        }, _callee54, this, [[24, 67, 70, 73], [42, 57, 60, 63]]);
      }));

      function sweepUnlocked(_x72) {
        return _sweepUnlocked.apply(this, arguments);
      }

      return sweepUnlocked;
    }()
  }, {
    key: "sweepDust",
    value: function () {
      var _sweepDust = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee55(relay) {
        var resp, result, txSet, _iterator30, _step30, tx;

        return _regenerator["default"].wrap(function _callee55$(_context55) {
          while (1) {
            switch (_context55.prev = _context55.next) {
              case 0:
                if (relay === undefined) relay = false;
                _context55.next = 3;
                return this.rpc.sendJsonRequest("sweep_dust", {
                  do_not_relay: !relay
                });

              case 3:
                resp = _context55.sent;

                if (!relay) {
                  _context55.next = 7;
                  break;
                }

                _context55.next = 7;
                return this._poll();

              case 7:
                result = resp.result;
                txSet = MoneroWalletRpc._convertRpcSentTxsToTxSet(result);

                if (!(txSet.getTxs() === undefined)) {
                  _context55.next = 11;
                  break;
                }

                return _context55.abrupt("return", []);

              case 11:
                _iterator30 = _createForOfIteratorHelper(txSet.getTxs());

                try {
                  for (_iterator30.s(); !(_step30 = _iterator30.n()).done;) {
                    tx = _step30.value;
                    tx.setIsRelayed(!relay);
                    tx.setInTxPool(tx.isRelayed());
                  }
                } catch (err) {
                  _iterator30.e(err);
                } finally {
                  _iterator30.f();
                }

                return _context55.abrupt("return", txSet.getTxs());

              case 14:
              case "end":
                return _context55.stop();
            }
          }
        }, _callee55, this);
      }));

      function sweepDust(_x73) {
        return _sweepDust.apply(this, arguments);
      }

      return sweepDust;
    }()
  }, {
    key: "relayTxs",
    value: function () {
      var _relayTxs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee56(txsOrMetadatas) {
        var txHashes, _iterator31, _step31, txOrMetadata, metadata, resp;

        return _regenerator["default"].wrap(function _callee56$(_context56) {
          while (1) {
            switch (_context56.prev = _context56.next) {
              case 0:
                (0, _assert["default"])(Array.isArray(txsOrMetadatas), "Must provide an array of txs or their metadata to relay");
                txHashes = [];
                _iterator31 = _createForOfIteratorHelper(txsOrMetadatas);
                _context56.prev = 3;

                _iterator31.s();

              case 5:
                if ((_step31 = _iterator31.n()).done) {
                  _context56.next = 14;
                  break;
                }

                txOrMetadata = _step31.value;
                metadata = txOrMetadata instanceof _MoneroTxWallet["default"] ? txOrMetadata.getMetadata() : txOrMetadata;
                _context56.next = 10;
                return this.rpc.sendJsonRequest("relay_tx", {
                  hex: metadata
                });

              case 10:
                resp = _context56.sent;
                txHashes.push(resp.result.tx_hash);

              case 12:
                _context56.next = 5;
                break;

              case 14:
                _context56.next = 19;
                break;

              case 16:
                _context56.prev = 16;
                _context56.t0 = _context56["catch"](3);

                _iterator31.e(_context56.t0);

              case 19:
                _context56.prev = 19;

                _iterator31.f();

                return _context56.finish(19);

              case 22:
                _context56.next = 24;
                return this._poll();

              case 24:
                return _context56.abrupt("return", txHashes);

              case 25:
              case "end":
                return _context56.stop();
            }
          }
        }, _callee56, this, [[3, 16, 19, 22]]);
      }));

      function relayTxs(_x74) {
        return _relayTxs.apply(this, arguments);
      }

      return relayTxs;
    }()
  }, {
    key: "describeTxSet",
    value: function () {
      var _describeTxSet = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee57(txSet) {
        var resp;
        return _regenerator["default"].wrap(function _callee57$(_context57) {
          while (1) {
            switch (_context57.prev = _context57.next) {
              case 0:
                _context57.next = 2;
                return this.rpc.sendJsonRequest("describe_transfer", {
                  unsigned_txset: txSet.getUnsignedTxHex(),
                  multisig_txset: txSet.getMultisigTxHex()
                });

              case 2:
                resp = _context57.sent;
                return _context57.abrupt("return", MoneroWalletRpc._convertRpcDescribeTransfer(resp.result));

              case 4:
              case "end":
                return _context57.stop();
            }
          }
        }, _callee57, this);
      }));

      function describeTxSet(_x75) {
        return _describeTxSet.apply(this, arguments);
      }

      return describeTxSet;
    }()
  }, {
    key: "signTxs",
    value: function () {
      var _signTxs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee58(unsignedTxHex) {
        var resp;
        return _regenerator["default"].wrap(function _callee58$(_context58) {
          while (1) {
            switch (_context58.prev = _context58.next) {
              case 0:
                _context58.next = 2;
                return this.rpc.sendJsonRequest("sign_transfer", {
                  unsigned_txset: unsignedTxHex,
                  export_raw: false
                });

              case 2:
                resp = _context58.sent;
                _context58.next = 5;
                return this._poll();

              case 5:
                return _context58.abrupt("return", resp.result.signed_txset);

              case 6:
              case "end":
                return _context58.stop();
            }
          }
        }, _callee58, this);
      }));

      function signTxs(_x76) {
        return _signTxs.apply(this, arguments);
      }

      return signTxs;
    }()
  }, {
    key: "submitTxs",
    value: function () {
      var _submitTxs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee59(signedTxHex) {
        var resp;
        return _regenerator["default"].wrap(function _callee59$(_context59) {
          while (1) {
            switch (_context59.prev = _context59.next) {
              case 0:
                _context59.next = 2;
                return this.rpc.sendJsonRequest("submit_transfer", {
                  tx_data_hex: signedTxHex
                });

              case 2:
                resp = _context59.sent;
                _context59.next = 5;
                return this._poll();

              case 5:
                return _context59.abrupt("return", resp.result.tx_hash_list);

              case 6:
              case "end":
                return _context59.stop();
            }
          }
        }, _callee59, this);
      }));

      function submitTxs(_x77) {
        return _submitTxs.apply(this, arguments);
      }

      return submitTxs;
    }()
  }, {
    key: "signMessage",
    value: function () {
      var _signMessage = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee60(message, signatureType, accountIdx, subaddressIdx) {
        var resp;
        return _regenerator["default"].wrap(function _callee60$(_context60) {
          while (1) {
            switch (_context60.prev = _context60.next) {
              case 0:
                _context60.next = 2;
                return this.rpc.sendJsonRequest("sign", {
                  data: message,
                  signature_type: signatureType === _MoneroMessageSignatureType["default"].SIGN_WITH_SPEND_KEY ? "spend" : "view",
                  account_index: accountIdx,
                  address_index: subaddressIdx
                });

              case 2:
                resp = _context60.sent;
                return _context60.abrupt("return", resp.result.signature);

              case 4:
              case "end":
                return _context60.stop();
            }
          }
        }, _callee60, this);
      }));

      function signMessage(_x78, _x79, _x80, _x81) {
        return _signMessage.apply(this, arguments);
      }

      return signMessage;
    }()
  }, {
    key: "verifyMessage",
    value: function () {
      var _verifyMessage = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee61(message, address, signature) {
        var resp, result;
        return _regenerator["default"].wrap(function _callee61$(_context61) {
          while (1) {
            switch (_context61.prev = _context61.next) {
              case 0:
                _context61.prev = 0;
                _context61.next = 3;
                return this.rpc.sendJsonRequest("verify", {
                  data: message,
                  address: address,
                  signature: signature
                });

              case 3:
                resp = _context61.sent;
                result = new _MoneroMessageSignatureResult["default"](resp.result.good, !resp.result.good ? undefined : resp.result.old, !resp.result.good ? undefined : !resp.result.signature_type ? undefined : resp.result.signature_type === "view" ? _MoneroMessageSignatureType["default"].SIGN_WITH_VIEW_KEY : _MoneroMessageSignatureType["default"].SIGN_WITH_SPEND_KEY, !resp.result.good ? undefined : resp.result.version);
                return _context61.abrupt("return", result);

              case 8:
                _context61.prev = 8;
                _context61.t0 = _context61["catch"](0);

                if (!(_context61.t0.getCode() === -2)) {
                  _context61.next = 12;
                  break;
                }

                return _context61.abrupt("return", new _MoneroMessageSignatureResult["default"](false));

              case 12:
                throw _context61.t0;

              case 13:
              case "end":
                return _context61.stop();
            }
          }
        }, _callee61, this, [[0, 8]]);
      }));

      function verifyMessage(_x82, _x83, _x84) {
        return _verifyMessage.apply(this, arguments);
      }

      return verifyMessage;
    }()
  }, {
    key: "getTxKey",
    value: function () {
      var _getTxKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee62(txHash) {
        return _regenerator["default"].wrap(function _callee62$(_context62) {
          while (1) {
            switch (_context62.prev = _context62.next) {
              case 0:
                _context62.prev = 0;
                _context62.next = 3;
                return this.rpc.sendJsonRequest("get_tx_key", {
                  txid: txHash
                });

              case 3:
                return _context62.abrupt("return", _context62.sent.result.tx_key);

              case 6:
                _context62.prev = 6;
                _context62.t0 = _context62["catch"](0);
                if (_context62.t0 instanceof _MoneroRpcError["default"] && _context62.t0.getCode() === -8 && _context62.t0.message.includes("TX ID has invalid format")) _context62.t0 = new _MoneroRpcError["default"]("TX hash has invalid format", _context62.t0.getCode(), _context62.t0.getRpcMethod(), _context62.t0.getRpcParams()); // normalize error message

                throw _context62.t0;

              case 10:
              case "end":
                return _context62.stop();
            }
          }
        }, _callee62, this, [[0, 6]]);
      }));

      function getTxKey(_x85) {
        return _getTxKey.apply(this, arguments);
      }

      return getTxKey;
    }()
  }, {
    key: "checkTxKey",
    value: function () {
      var _checkTxKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee63(txHash, txKey, address) {
        var resp, check;
        return _regenerator["default"].wrap(function _callee63$(_context63) {
          while (1) {
            switch (_context63.prev = _context63.next) {
              case 0:
                _context63.prev = 0;
                _context63.next = 3;
                return this.rpc.sendJsonRequest("check_tx_key", {
                  txid: txHash,
                  tx_key: txKey,
                  address: address
                });

              case 3:
                resp = _context63.sent;
                // interpret result
                check = new _MoneroCheckTx["default"]();
                check.setIsGood(true);
                check.setNumConfirmations(resp.result.confirmations);
                check.setInTxPool(resp.result.in_pool);
                check.setReceivedAmount(BigInt(resp.result.received));
                return _context63.abrupt("return", check);

              case 12:
                _context63.prev = 12;
                _context63.t0 = _context63["catch"](0);
                if (_context63.t0 instanceof _MoneroRpcError["default"] && _context63.t0.getCode() === -8 && _context63.t0.message.includes("TX ID has invalid format")) _context63.t0 = new _MoneroRpcError["default"]("TX hash has invalid format", _context63.t0.getCode(), _context63.t0.getRpcMethod(), _context63.t0.getRpcParams()); // normalize error message

                throw _context63.t0;

              case 16:
              case "end":
                return _context63.stop();
            }
          }
        }, _callee63, this, [[0, 12]]);
      }));

      function checkTxKey(_x86, _x87, _x88) {
        return _checkTxKey.apply(this, arguments);
      }

      return checkTxKey;
    }()
  }, {
    key: "getTxProof",
    value: function () {
      var _getTxProof = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee64(txHash, address, message) {
        var resp;
        return _regenerator["default"].wrap(function _callee64$(_context64) {
          while (1) {
            switch (_context64.prev = _context64.next) {
              case 0:
                _context64.prev = 0;
                _context64.next = 3;
                return this.rpc.sendJsonRequest("get_tx_proof", {
                  txid: txHash,
                  address: address,
                  message: message
                });

              case 3:
                resp = _context64.sent;
                return _context64.abrupt("return", resp.result.signature);

              case 7:
                _context64.prev = 7;
                _context64.t0 = _context64["catch"](0);
                if (_context64.t0 instanceof _MoneroRpcError["default"] && _context64.t0.getCode() === -8 && _context64.t0.message.includes("TX ID has invalid format")) _context64.t0 = new _MoneroRpcError["default"]("TX hash has invalid format", _context64.t0.getCode(), _context64.t0.getRpcMethod(), _context64.t0.getRpcParams()); // normalize error message

                throw _context64.t0;

              case 11:
              case "end":
                return _context64.stop();
            }
          }
        }, _callee64, this, [[0, 7]]);
      }));

      function getTxProof(_x89, _x90, _x91) {
        return _getTxProof.apply(this, arguments);
      }

      return getTxProof;
    }()
  }, {
    key: "checkTxProof",
    value: function () {
      var _checkTxProof = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee65(txHash, address, message, signature) {
        var resp, isGood, check;
        return _regenerator["default"].wrap(function _callee65$(_context65) {
          while (1) {
            switch (_context65.prev = _context65.next) {
              case 0:
                _context65.prev = 0;
                _context65.next = 3;
                return this.rpc.sendJsonRequest("check_tx_proof", {
                  txid: txHash,
                  address: address,
                  message: message,
                  signature: signature
                });

              case 3:
                resp = _context65.sent;
                // interpret response
                isGood = resp.result.good;
                check = new _MoneroCheckTx["default"]();
                check.setIsGood(isGood);

                if (isGood) {
                  check.setNumConfirmations(resp.result.confirmations);
                  check.setInTxPool(resp.result.in_pool);
                  check.setReceivedAmount(BigInt(resp.result.received));
                }

                return _context65.abrupt("return", check);

              case 11:
                _context65.prev = 11;
                _context65.t0 = _context65["catch"](0);
                if (_context65.t0 instanceof _MoneroRpcError["default"] && _context65.t0.getCode() === -1 && _context65.t0.message === "basic_string") _context65.t0 = new _MoneroRpcError["default"]("Must provide signature to check tx proof", -1);
                if (_context65.t0 instanceof _MoneroRpcError["default"] && _context65.t0.getCode() === -8 && _context65.t0.message.includes("TX ID has invalid format")) _context65.t0 = new _MoneroRpcError["default"]("TX hash has invalid format", _context65.t0.getCode(), _context65.t0.getRpcMethod(), _context65.t0.getRpcParams());
                throw _context65.t0;

              case 16:
              case "end":
                return _context65.stop();
            }
          }
        }, _callee65, this, [[0, 11]]);
      }));

      function checkTxProof(_x92, _x93, _x94, _x95) {
        return _checkTxProof.apply(this, arguments);
      }

      return checkTxProof;
    }()
  }, {
    key: "getSpendProof",
    value: function () {
      var _getSpendProof = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee66(txHash, message) {
        var resp;
        return _regenerator["default"].wrap(function _callee66$(_context66) {
          while (1) {
            switch (_context66.prev = _context66.next) {
              case 0:
                _context66.prev = 0;
                _context66.next = 3;
                return this.rpc.sendJsonRequest("get_spend_proof", {
                  txid: txHash,
                  message: message
                });

              case 3:
                resp = _context66.sent;
                return _context66.abrupt("return", resp.result.signature);

              case 7:
                _context66.prev = 7;
                _context66.t0 = _context66["catch"](0);
                if (_context66.t0 instanceof _MoneroRpcError["default"] && _context66.t0.getCode() === -8 && _context66.t0.message.includes("TX ID has invalid format")) _context66.t0 = new _MoneroRpcError["default"]("TX hash has invalid format", _context66.t0.getCode(), _context66.t0.getRpcMethod(), _context66.t0.getRpcParams()); // normalize error message

                throw _context66.t0;

              case 11:
              case "end":
                return _context66.stop();
            }
          }
        }, _callee66, this, [[0, 7]]);
      }));

      function getSpendProof(_x96, _x97) {
        return _getSpendProof.apply(this, arguments);
      }

      return getSpendProof;
    }()
  }, {
    key: "checkSpendProof",
    value: function () {
      var _checkSpendProof = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee67(txHash, message, signature) {
        var resp;
        return _regenerator["default"].wrap(function _callee67$(_context67) {
          while (1) {
            switch (_context67.prev = _context67.next) {
              case 0:
                _context67.prev = 0;
                _context67.next = 3;
                return this.rpc.sendJsonRequest("check_spend_proof", {
                  txid: txHash,
                  message: message,
                  signature: signature
                });

              case 3:
                resp = _context67.sent;
                return _context67.abrupt("return", resp.result.good);

              case 7:
                _context67.prev = 7;
                _context67.t0 = _context67["catch"](0);
                if (_context67.t0 instanceof _MoneroRpcError["default"] && _context67.t0.getCode() === -8 && _context67.t0.message.includes("TX ID has invalid format")) _context67.t0 = new _MoneroRpcError["default"]("TX hash has invalid format", _context67.t0.getCode(), _context67.t0.getRpcMethod(), _context67.t0.getRpcParams()); // normalize error message

                throw _context67.t0;

              case 11:
              case "end":
                return _context67.stop();
            }
          }
        }, _callee67, this, [[0, 7]]);
      }));

      function checkSpendProof(_x98, _x99, _x100) {
        return _checkSpendProof.apply(this, arguments);
      }

      return checkSpendProof;
    }()
  }, {
    key: "getReserveProofWallet",
    value: function () {
      var _getReserveProofWallet = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee68(message) {
        var resp;
        return _regenerator["default"].wrap(function _callee68$(_context68) {
          while (1) {
            switch (_context68.prev = _context68.next) {
              case 0:
                _context68.next = 2;
                return this.rpc.sendJsonRequest("get_reserve_proof", {
                  all: true,
                  message: message
                });

              case 2:
                resp = _context68.sent;
                return _context68.abrupt("return", resp.result.signature);

              case 4:
              case "end":
                return _context68.stop();
            }
          }
        }, _callee68, this);
      }));

      function getReserveProofWallet(_x101) {
        return _getReserveProofWallet.apply(this, arguments);
      }

      return getReserveProofWallet;
    }()
  }, {
    key: "getReserveProofAccount",
    value: function () {
      var _getReserveProofAccount = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee69(accountIdx, amount, message) {
        var resp;
        return _regenerator["default"].wrap(function _callee69$(_context69) {
          while (1) {
            switch (_context69.prev = _context69.next) {
              case 0:
                _context69.next = 2;
                return this.rpc.sendJsonRequest("get_reserve_proof", {
                  account_index: accountIdx,
                  amount: amount.toString(),
                  message: message
                });

              case 2:
                resp = _context69.sent;
                return _context69.abrupt("return", resp.result.signature);

              case 4:
              case "end":
                return _context69.stop();
            }
          }
        }, _callee69, this);
      }));

      function getReserveProofAccount(_x102, _x103, _x104) {
        return _getReserveProofAccount.apply(this, arguments);
      }

      return getReserveProofAccount;
    }()
  }, {
    key: "checkReserveProof",
    value: function () {
      var _checkReserveProof = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee70(address, message, signature) {
        var resp, isGood, check;
        return _regenerator["default"].wrap(function _callee70$(_context70) {
          while (1) {
            switch (_context70.prev = _context70.next) {
              case 0:
                _context70.next = 2;
                return this.rpc.sendJsonRequest("check_reserve_proof", {
                  address: address,
                  message: message,
                  signature: signature
                });

              case 2:
                resp = _context70.sent;
                // interpret results
                isGood = resp.result.good;
                check = new _MoneroCheckReserve["default"]();
                check.setIsGood(isGood);

                if (isGood) {
                  check.setUnconfirmedSpentAmount(BigInt(resp.result.spent));
                  check.setTotalAmount(BigInt(resp.result.total));
                }

                return _context70.abrupt("return", check);

              case 8:
              case "end":
                return _context70.stop();
            }
          }
        }, _callee70, this);
      }));

      function checkReserveProof(_x105, _x106, _x107) {
        return _checkReserveProof.apply(this, arguments);
      }

      return checkReserveProof;
    }()
  }, {
    key: "getTxNotes",
    value: function () {
      var _getTxNotes = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee71(txHashes) {
        return _regenerator["default"].wrap(function _callee71$(_context71) {
          while (1) {
            switch (_context71.prev = _context71.next) {
              case 0:
                _context71.next = 2;
                return this.rpc.sendJsonRequest("get_tx_notes", {
                  txids: txHashes
                });

              case 2:
                return _context71.abrupt("return", _context71.sent.result.notes);

              case 3:
              case "end":
                return _context71.stop();
            }
          }
        }, _callee71, this);
      }));

      function getTxNotes(_x108) {
        return _getTxNotes.apply(this, arguments);
      }

      return getTxNotes;
    }()
  }, {
    key: "setTxNotes",
    value: function () {
      var _setTxNotes = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee72(txHashes, notes) {
        return _regenerator["default"].wrap(function _callee72$(_context72) {
          while (1) {
            switch (_context72.prev = _context72.next) {
              case 0:
                _context72.next = 2;
                return this.rpc.sendJsonRequest("set_tx_notes", {
                  txids: txHashes,
                  notes: notes
                });

              case 2:
              case "end":
                return _context72.stop();
            }
          }
        }, _callee72, this);
      }));

      function setTxNotes(_x109, _x110) {
        return _setTxNotes.apply(this, arguments);
      }

      return setTxNotes;
    }()
  }, {
    key: "getAddressBookEntries",
    value: function () {
      var _getAddressBookEntries = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee73(entryIndices) {
        var resp, entries, _iterator32, _step32, rpcEntry;

        return _regenerator["default"].wrap(function _callee73$(_context73) {
          while (1) {
            switch (_context73.prev = _context73.next) {
              case 0:
                _context73.next = 2;
                return this.rpc.sendJsonRequest("get_address_book", {
                  entries: entryIndices
                });

              case 2:
                resp = _context73.sent;

                if (resp.result.entries) {
                  _context73.next = 5;
                  break;
                }

                return _context73.abrupt("return", []);

              case 5:
                entries = [];
                _iterator32 = _createForOfIteratorHelper(resp.result.entries);

                try {
                  for (_iterator32.s(); !(_step32 = _iterator32.n()).done;) {
                    rpcEntry = _step32.value;
                    entries.push(new _MoneroAddressBookEntry["default"]().setIndex(rpcEntry.index).setAddress(rpcEntry.address).setDescription(rpcEntry.description).setPaymentId(rpcEntry.payment_id));
                  }
                } catch (err) {
                  _iterator32.e(err);
                } finally {
                  _iterator32.f();
                }

                return _context73.abrupt("return", entries);

              case 9:
              case "end":
                return _context73.stop();
            }
          }
        }, _callee73, this);
      }));

      function getAddressBookEntries(_x111) {
        return _getAddressBookEntries.apply(this, arguments);
      }

      return getAddressBookEntries;
    }()
  }, {
    key: "addAddressBookEntry",
    value: function () {
      var _addAddressBookEntry = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee74(address, description) {
        var resp;
        return _regenerator["default"].wrap(function _callee74$(_context74) {
          while (1) {
            switch (_context74.prev = _context74.next) {
              case 0:
                _context74.next = 2;
                return this.rpc.sendJsonRequest("add_address_book", {
                  address: address,
                  description: description
                });

              case 2:
                resp = _context74.sent;
                return _context74.abrupt("return", resp.result.index);

              case 4:
              case "end":
                return _context74.stop();
            }
          }
        }, _callee74, this);
      }));

      function addAddressBookEntry(_x112, _x113) {
        return _addAddressBookEntry.apply(this, arguments);
      }

      return addAddressBookEntry;
    }()
  }, {
    key: "editAddressBookEntry",
    value: function () {
      var _editAddressBookEntry = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee75(index, setAddress, address, setDescription, description) {
        var resp;
        return _regenerator["default"].wrap(function _callee75$(_context75) {
          while (1) {
            switch (_context75.prev = _context75.next) {
              case 0:
                _context75.next = 2;
                return this.rpc.sendJsonRequest("edit_address_book", {
                  index: index,
                  set_address: setAddress,
                  address: address,
                  set_description: setDescription,
                  description: description
                });

              case 2:
                resp = _context75.sent;

              case 3:
              case "end":
                return _context75.stop();
            }
          }
        }, _callee75, this);
      }));

      function editAddressBookEntry(_x114, _x115, _x116, _x117, _x118) {
        return _editAddressBookEntry.apply(this, arguments);
      }

      return editAddressBookEntry;
    }()
  }, {
    key: "deleteAddressBookEntry",
    value: function () {
      var _deleteAddressBookEntry = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee76(entryIdx) {
        return _regenerator["default"].wrap(function _callee76$(_context76) {
          while (1) {
            switch (_context76.prev = _context76.next) {
              case 0:
                _context76.next = 2;
                return this.rpc.sendJsonRequest("delete_address_book", {
                  index: entryIdx
                });

              case 2:
              case "end":
                return _context76.stop();
            }
          }
        }, _callee76, this);
      }));

      function deleteAddressBookEntry(_x119) {
        return _deleteAddressBookEntry.apply(this, arguments);
      }

      return deleteAddressBookEntry;
    }()
  }, {
    key: "tagAccounts",
    value: function () {
      var _tagAccounts = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee77(tag, accountIndices) {
        return _regenerator["default"].wrap(function _callee77$(_context77) {
          while (1) {
            switch (_context77.prev = _context77.next) {
              case 0:
                _context77.next = 2;
                return this.rpc.sendJsonRequest("tag_accounts", {
                  tag: tag,
                  accounts: accountIndices
                });

              case 2:
              case "end":
                return _context77.stop();
            }
          }
        }, _callee77, this);
      }));

      function tagAccounts(_x120, _x121) {
        return _tagAccounts.apply(this, arguments);
      }

      return tagAccounts;
    }()
  }, {
    key: "untagAccounts",
    value: function () {
      var _untagAccounts = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee78(accountIndices) {
        return _regenerator["default"].wrap(function _callee78$(_context78) {
          while (1) {
            switch (_context78.prev = _context78.next) {
              case 0:
                _context78.next = 2;
                return this.rpc.sendJsonRequest("untag_accounts", {
                  accounts: accountIndices
                });

              case 2:
              case "end":
                return _context78.stop();
            }
          }
        }, _callee78, this);
      }));

      function untagAccounts(_x122) {
        return _untagAccounts.apply(this, arguments);
      }

      return untagAccounts;
    }()
  }, {
    key: "getAccountTags",
    value: function () {
      var _getAccountTags = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee79() {
        var tags, resp, _iterator33, _step33, rpcAccountTag;

        return _regenerator["default"].wrap(function _callee79$(_context79) {
          while (1) {
            switch (_context79.prev = _context79.next) {
              case 0:
                tags = [];
                _context79.next = 3;
                return this.rpc.sendJsonRequest("get_account_tags");

              case 3:
                resp = _context79.sent;

                if (resp.result.account_tags) {
                  _iterator33 = _createForOfIteratorHelper(resp.result.account_tags);

                  try {
                    for (_iterator33.s(); !(_step33 = _iterator33.n()).done;) {
                      rpcAccountTag = _step33.value;
                      tags.push(new _MoneroAccountTag["default"](rpcAccountTag.tag ? rpcAccountTag.tag : undefined, rpcAccountTag.label ? rpcAccountTag.label : undefined, rpcAccountTag.accounts));
                    }
                  } catch (err) {
                    _iterator33.e(err);
                  } finally {
                    _iterator33.f();
                  }
                }

                return _context79.abrupt("return", tags);

              case 6:
              case "end":
                return _context79.stop();
            }
          }
        }, _callee79, this);
      }));

      function getAccountTags() {
        return _getAccountTags.apply(this, arguments);
      }

      return getAccountTags;
    }()
  }, {
    key: "setAccountTagLabel",
    value: function () {
      var _setAccountTagLabel = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee80(tag, label) {
        return _regenerator["default"].wrap(function _callee80$(_context80) {
          while (1) {
            switch (_context80.prev = _context80.next) {
              case 0:
                _context80.next = 2;
                return this.rpc.sendJsonRequest("set_account_tag_description", {
                  tag: tag,
                  description: label
                });

              case 2:
              case "end":
                return _context80.stop();
            }
          }
        }, _callee80, this);
      }));

      function setAccountTagLabel(_x123, _x124) {
        return _setAccountTagLabel.apply(this, arguments);
      }

      return setAccountTagLabel;
    }()
  }, {
    key: "getPaymentUri",
    value: function () {
      var _getPaymentUri = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee81(config) {
        var resp;
        return _regenerator["default"].wrap(function _callee81$(_context81) {
          while (1) {
            switch (_context81.prev = _context81.next) {
              case 0:
                config = _MoneroWallet2["default"]._normalizeCreateTxsConfig(config);
                _context81.next = 3;
                return this.rpc.sendJsonRequest("make_uri", {
                  address: config.getDestinations()[0].getAddress(),
                  amount: config.getDestinations()[0].getAmount() ? config.getDestinations()[0].getAmount().toString() : undefined,
                  payment_id: config.getPaymentId(),
                  recipient_name: config.getRecipientName(),
                  tx_description: config.getNote()
                });

              case 3:
                resp = _context81.sent;
                return _context81.abrupt("return", resp.result.uri);

              case 5:
              case "end":
                return _context81.stop();
            }
          }
        }, _callee81, this);
      }));

      function getPaymentUri(_x125) {
        return _getPaymentUri.apply(this, arguments);
      }

      return getPaymentUri;
    }()
  }, {
    key: "parsePaymentUri",
    value: function () {
      var _parsePaymentUri = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee82(uri) {
        var resp, config;
        return _regenerator["default"].wrap(function _callee82$(_context82) {
          while (1) {
            switch (_context82.prev = _context82.next) {
              case 0:
                (0, _assert["default"])(uri, "Must provide URI to parse");
                _context82.next = 3;
                return this.rpc.sendJsonRequest("parse_uri", {
                  uri: uri
                });

              case 3:
                resp = _context82.sent;
                config = new _MoneroTxConfig["default"]({
                  address: resp.result.uri.address,
                  amount: BigInt(resp.result.uri.amount)
                });
                config.setPaymentId(resp.result.uri.payment_id);
                config.setRecipientName(resp.result.uri.recipient_name);
                config.setNote(resp.result.uri.tx_description);
                if ("" === config.getDestinations()[0].getAddress()) config.getDestinations()[0].setAddress(undefined);
                if ("" === config.getPaymentId()) config.setPaymentId(undefined);
                if ("" === config.getRecipientName()) config.setRecipientName(undefined);
                if ("" === config.getNote()) config.setNote(undefined);
                return _context82.abrupt("return", config);

              case 13:
              case "end":
                return _context82.stop();
            }
          }
        }, _callee82, this);
      }));

      function parsePaymentUri(_x126) {
        return _parsePaymentUri.apply(this, arguments);
      }

      return parsePaymentUri;
    }()
  }, {
    key: "getAttribute",
    value: function () {
      var _getAttribute = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee83(key) {
        var resp;
        return _regenerator["default"].wrap(function _callee83$(_context83) {
          while (1) {
            switch (_context83.prev = _context83.next) {
              case 0:
                _context83.prev = 0;
                _context83.next = 3;
                return this.rpc.sendJsonRequest("get_attribute", {
                  key: key
                });

              case 3:
                resp = _context83.sent;
                return _context83.abrupt("return", resp.result.value === "" ? undefined : resp.result.value);

              case 7:
                _context83.prev = 7;
                _context83.t0 = _context83["catch"](0);

                if (!(_context83.t0 instanceof _MoneroRpcError["default"] && _context83.t0.getCode() === -45)) {
                  _context83.next = 11;
                  break;
                }

                return _context83.abrupt("return", undefined);

              case 11:
                throw _context83.t0;

              case 12:
              case "end":
                return _context83.stop();
            }
          }
        }, _callee83, this, [[0, 7]]);
      }));

      function getAttribute(_x127) {
        return _getAttribute.apply(this, arguments);
      }

      return getAttribute;
    }()
  }, {
    key: "setAttribute",
    value: function () {
      var _setAttribute = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee84(key, val) {
        return _regenerator["default"].wrap(function _callee84$(_context84) {
          while (1) {
            switch (_context84.prev = _context84.next) {
              case 0:
                _context84.next = 2;
                return this.rpc.sendJsonRequest("set_attribute", {
                  key: key,
                  value: val
                });

              case 2:
              case "end":
                return _context84.stop();
            }
          }
        }, _callee84, this);
      }));

      function setAttribute(_x128, _x129) {
        return _setAttribute.apply(this, arguments);
      }

      return setAttribute;
    }()
  }, {
    key: "startMining",
    value: function () {
      var _startMining = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee85(numThreads, backgroundMining, ignoreBattery) {
        return _regenerator["default"].wrap(function _callee85$(_context85) {
          while (1) {
            switch (_context85.prev = _context85.next) {
              case 0:
                _context85.next = 2;
                return this.rpc.sendJsonRequest("start_mining", {
                  threads_count: numThreads,
                  do_background_mining: backgroundMining,
                  ignore_battery: ignoreBattery
                });

              case 2:
              case "end":
                return _context85.stop();
            }
          }
        }, _callee85, this);
      }));

      function startMining(_x130, _x131, _x132) {
        return _startMining.apply(this, arguments);
      }

      return startMining;
    }()
  }, {
    key: "stopMining",
    value: function () {
      var _stopMining = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee86() {
        return _regenerator["default"].wrap(function _callee86$(_context86) {
          while (1) {
            switch (_context86.prev = _context86.next) {
              case 0:
                _context86.next = 2;
                return this.rpc.sendJsonRequest("stop_mining");

              case 2:
              case "end":
                return _context86.stop();
            }
          }
        }, _callee86, this);
      }));

      function stopMining() {
        return _stopMining.apply(this, arguments);
      }

      return stopMining;
    }()
  }, {
    key: "isMultisigImportNeeded",
    value: function () {
      var _isMultisigImportNeeded = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee87() {
        var resp;
        return _regenerator["default"].wrap(function _callee87$(_context87) {
          while (1) {
            switch (_context87.prev = _context87.next) {
              case 0:
                _context87.next = 2;
                return this.rpc.sendJsonRequest("get_balance");

              case 2:
                resp = _context87.sent;
                return _context87.abrupt("return", resp.result.multisig_import_needed === true);

              case 4:
              case "end":
                return _context87.stop();
            }
          }
        }, _callee87, this);
      }));

      function isMultisigImportNeeded() {
        return _isMultisigImportNeeded.apply(this, arguments);
      }

      return isMultisigImportNeeded;
    }()
  }, {
    key: "getMultisigInfo",
    value: function () {
      var _getMultisigInfo = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee88() {
        var resp, result, info;
        return _regenerator["default"].wrap(function _callee88$(_context88) {
          while (1) {
            switch (_context88.prev = _context88.next) {
              case 0:
                _context88.next = 2;
                return this.rpc.sendJsonRequest("is_multisig");

              case 2:
                resp = _context88.sent;
                result = resp.result;
                info = new _MoneroMultisigInfo["default"]();
                info.setIsMultisig(result.multisig);
                info.setIsReady(result.ready);
                info.setThreshold(result.threshold);
                info.setNumParticipants(result.total);
                return _context88.abrupt("return", info);

              case 10:
              case "end":
                return _context88.stop();
            }
          }
        }, _callee88, this);
      }));

      function getMultisigInfo() {
        return _getMultisigInfo.apply(this, arguments);
      }

      return getMultisigInfo;
    }()
  }, {
    key: "prepareMultisig",
    value: function () {
      var _prepareMultisig = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee89() {
        var resp, result;
        return _regenerator["default"].wrap(function _callee89$(_context89) {
          while (1) {
            switch (_context89.prev = _context89.next) {
              case 0:
                _context89.next = 2;
                return this.rpc.sendJsonRequest("prepare_multisig", {
                  enable_multisig_experimental: true
                });

              case 2:
                resp = _context89.sent;
                result = resp.result;
                return _context89.abrupt("return", result.multisig_info);

              case 5:
              case "end":
                return _context89.stop();
            }
          }
        }, _callee89, this);
      }));

      function prepareMultisig() {
        return _prepareMultisig.apply(this, arguments);
      }

      return prepareMultisig;
    }()
  }, {
    key: "makeMultisig",
    value: function () {
      var _makeMultisig = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee90(multisigHexes, threshold, password) {
        var resp;
        return _regenerator["default"].wrap(function _callee90$(_context90) {
          while (1) {
            switch (_context90.prev = _context90.next) {
              case 0:
                _context90.next = 2;
                return this.rpc.sendJsonRequest("make_multisig", {
                  multisig_info: multisigHexes,
                  threshold: threshold,
                  password: password
                });

              case 2:
                resp = _context90.sent;
                return _context90.abrupt("return", resp.result.multisig_info);

              case 4:
              case "end":
                return _context90.stop();
            }
          }
        }, _callee90, this);
      }));

      function makeMultisig(_x133, _x134, _x135) {
        return _makeMultisig.apply(this, arguments);
      }

      return makeMultisig;
    }()
  }, {
    key: "exchangeMultisigKeys",
    value: function () {
      var _exchangeMultisigKeys = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee91(multisigHexes, password) {
        var resp, msResult;
        return _regenerator["default"].wrap(function _callee91$(_context91) {
          while (1) {
            switch (_context91.prev = _context91.next) {
              case 0:
                _context91.next = 2;
                return this.rpc.sendJsonRequest("exchange_multisig_keys", {
                  multisig_info: multisigHexes,
                  password: password
                });

              case 2:
                resp = _context91.sent;
                msResult = new _MoneroMultisigInitResult["default"]();
                msResult.setAddress(resp.result.address);
                msResult.setMultisigHex(resp.result.multisig_info);
                if (msResult.getAddress().length === 0) msResult.setAddress(undefined);
                if (msResult.getMultisigHex().length === 0) msResult.setMultisigHex(undefined);
                return _context91.abrupt("return", msResult);

              case 9:
              case "end":
                return _context91.stop();
            }
          }
        }, _callee91, this);
      }));

      function exchangeMultisigKeys(_x136, _x137) {
        return _exchangeMultisigKeys.apply(this, arguments);
      }

      return exchangeMultisigKeys;
    }()
  }, {
    key: "exportMultisigHex",
    value: function () {
      var _exportMultisigHex = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee92() {
        var resp;
        return _regenerator["default"].wrap(function _callee92$(_context92) {
          while (1) {
            switch (_context92.prev = _context92.next) {
              case 0:
                _context92.next = 2;
                return this.rpc.sendJsonRequest("export_multisig_info");

              case 2:
                resp = _context92.sent;
                return _context92.abrupt("return", resp.result.info);

              case 4:
              case "end":
                return _context92.stop();
            }
          }
        }, _callee92, this);
      }));

      function exportMultisigHex() {
        return _exportMultisigHex.apply(this, arguments);
      }

      return exportMultisigHex;
    }()
  }, {
    key: "importMultisigHex",
    value: function () {
      var _importMultisigHex = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee93(multisigHexes) {
        var resp;
        return _regenerator["default"].wrap(function _callee93$(_context93) {
          while (1) {
            switch (_context93.prev = _context93.next) {
              case 0:
                if (_GenUtils["default"].isArray(multisigHexes)) {
                  _context93.next = 2;
                  break;
                }

                throw new _MoneroError["default"]("Must provide string[] to importMultisigHex()");

              case 2:
                _context93.next = 4;
                return this.rpc.sendJsonRequest("import_multisig_info", {
                  info: multisigHexes
                });

              case 4:
                resp = _context93.sent;
                return _context93.abrupt("return", resp.result.n_outputs);

              case 6:
              case "end":
                return _context93.stop();
            }
          }
        }, _callee93, this);
      }));

      function importMultisigHex(_x138) {
        return _importMultisigHex.apply(this, arguments);
      }

      return importMultisigHex;
    }()
  }, {
    key: "signMultisigTxHex",
    value: function () {
      var _signMultisigTxHex = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee94(multisigTxHex) {
        var resp, result, signResult;
        return _regenerator["default"].wrap(function _callee94$(_context94) {
          while (1) {
            switch (_context94.prev = _context94.next) {
              case 0:
                _context94.next = 2;
                return this.rpc.sendJsonRequest("sign_multisig", {
                  tx_data_hex: multisigTxHex
                });

              case 2:
                resp = _context94.sent;
                result = resp.result;
                signResult = new _MoneroMultisigSignResult["default"]();
                signResult.setSignedMultisigTxHex(result.tx_data_hex);
                signResult.setTxHashes(result.tx_hash_list);
                return _context94.abrupt("return", signResult);

              case 8:
              case "end":
                return _context94.stop();
            }
          }
        }, _callee94, this);
      }));

      function signMultisigTxHex(_x139) {
        return _signMultisigTxHex.apply(this, arguments);
      }

      return signMultisigTxHex;
    }()
  }, {
    key: "submitMultisigTxHex",
    value: function () {
      var _submitMultisigTxHex = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee95(signedMultisigTxHex) {
        var resp;
        return _regenerator["default"].wrap(function _callee95$(_context95) {
          while (1) {
            switch (_context95.prev = _context95.next) {
              case 0:
                _context95.next = 2;
                return this.rpc.sendJsonRequest("submit_multisig", {
                  tx_data_hex: signedMultisigTxHex
                });

              case 2:
                resp = _context95.sent;
                return _context95.abrupt("return", resp.result.tx_hash_list);

              case 4:
              case "end":
                return _context95.stop();
            }
          }
        }, _callee95, this);
      }));

      function submitMultisigTxHex(_x140) {
        return _submitMultisigTxHex.apply(this, arguments);
      }

      return submitMultisigTxHex;
    }()
  }, {
    key: "changePassword",
    value: function () {
      var _changePassword = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee96(oldPassword, newPassword) {
        return _regenerator["default"].wrap(function _callee96$(_context96) {
          while (1) {
            switch (_context96.prev = _context96.next) {
              case 0:
                return _context96.abrupt("return", this.rpc.sendJsonRequest("change_wallet_password", {
                  old_password: oldPassword,
                  new_password: newPassword
                }));

              case 1:
              case "end":
                return _context96.stop();
            }
          }
        }, _callee96, this);
      }));

      function changePassword(_x141, _x142) {
        return _changePassword.apply(this, arguments);
      }

      return changePassword;
    }()
  }, {
    key: "save",
    value: function () {
      var _save = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee97() {
        return _regenerator["default"].wrap(function _callee97$(_context97) {
          while (1) {
            switch (_context97.prev = _context97.next) {
              case 0:
                _context97.next = 2;
                return this.rpc.sendJsonRequest("store");

              case 2:
              case "end":
                return _context97.stop();
            }
          }
        }, _callee97, this);
      }));

      function save() {
        return _save.apply(this, arguments);
      }

      return save;
    }()
  }, {
    key: "close",
    value: function () {
      var _close = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee98(save) {
        return _regenerator["default"].wrap(function _callee98$(_context98) {
          while (1) {
            switch (_context98.prev = _context98.next) {
              case 0:
                if (save === undefined) save = false;
                _context98.next = 3;
                return this._clear();

              case 3:
                _context98.next = 5;
                return this.rpc.sendJsonRequest("close_wallet", {
                  autosave_current: save
                });

              case 5:
              case "end":
                return _context98.stop();
            }
          }
        }, _callee98, this);
      }));

      function close(_x143) {
        return _close.apply(this, arguments);
      }

      return close;
    }()
  }, {
    key: "isClosed",
    value: function () {
      var _isClosed = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee99() {
        return _regenerator["default"].wrap(function _callee99$(_context99) {
          while (1) {
            switch (_context99.prev = _context99.next) {
              case 0:
                _context99.prev = 0;
                _context99.next = 3;
                return this.getPrimaryAddress();

              case 3:
                _context99.next = 8;
                break;

              case 5:
                _context99.prev = 5;
                _context99.t0 = _context99["catch"](0);
                return _context99.abrupt("return", _context99.t0 instanceof _MoneroRpcError["default"] && _context99.t0.getCode() === -13 && _context99.t0.message.indexOf("No wallet file") > -1);

              case 8:
                return _context99.abrupt("return", false);

              case 9:
              case "end":
                return _context99.stop();
            }
          }
        }, _callee99, this, [[0, 5]]);
      }));

      function isClosed() {
        return _isClosed.apply(this, arguments);
      }

      return isClosed;
    }()
    /**
     * Save and close the current wallet and stop the RPC server.
     */

  }, {
    key: "stop",
    value: function () {
      var _stop = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee100() {
        return _regenerator["default"].wrap(function _callee100$(_context100) {
          while (1) {
            switch (_context100.prev = _context100.next) {
              case 0:
                _context100.next = 2;
                return this._clear();

              case 2:
                _context100.next = 4;
                return this.rpc.sendJsonRequest("stop_wallet");

              case 4:
              case "end":
                return _context100.stop();
            }
          }
        }, _callee100, this);
      }));

      function stop() {
        return _stop.apply(this, arguments);
      }

      return stop;
    }() // ----------- ADD JSDOC FOR SUPPORTED DEFAULT IMPLEMENTATIONS --------------

  }, {
    key: "getNumBlocksToUnlock",
    value: function () {
      var _getNumBlocksToUnlock = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee101() {
        var _args101 = arguments;
        return _regenerator["default"].wrap(function _callee101$(_context101) {
          while (1) {
            switch (_context101.prev = _context101.next) {
              case 0:
                return _context101.abrupt("return", (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroWalletRpc.prototype), "getNumBlocksToUnlock", this).apply(this, _args101));

              case 1:
              case "end":
                return _context101.stop();
            }
          }
        }, _callee101, this);
      }));

      function getNumBlocksToUnlock() {
        return _getNumBlocksToUnlock.apply(this, arguments);
      }

      return getNumBlocksToUnlock;
    }()
  }, {
    key: "getTx",
    value: function () {
      var _getTx = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee102() {
        var _args102 = arguments;
        return _regenerator["default"].wrap(function _callee102$(_context102) {
          while (1) {
            switch (_context102.prev = _context102.next) {
              case 0:
                return _context102.abrupt("return", (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroWalletRpc.prototype), "getTx", this).apply(this, _args102));

              case 1:
              case "end":
                return _context102.stop();
            }
          }
        }, _callee102, this);
      }));

      function getTx() {
        return _getTx.apply(this, arguments);
      }

      return getTx;
    }()
  }, {
    key: "getIncomingTransfers",
    value: function () {
      var _getIncomingTransfers = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee103() {
        var _args103 = arguments;
        return _regenerator["default"].wrap(function _callee103$(_context103) {
          while (1) {
            switch (_context103.prev = _context103.next) {
              case 0:
                return _context103.abrupt("return", (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroWalletRpc.prototype), "getIncomingTransfers", this).apply(this, _args103));

              case 1:
              case "end":
                return _context103.stop();
            }
          }
        }, _callee103, this);
      }));

      function getIncomingTransfers() {
        return _getIncomingTransfers.apply(this, arguments);
      }

      return getIncomingTransfers;
    }()
  }, {
    key: "getOutgoingTransfers",
    value: function () {
      var _getOutgoingTransfers = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee104() {
        var _args104 = arguments;
        return _regenerator["default"].wrap(function _callee104$(_context104) {
          while (1) {
            switch (_context104.prev = _context104.next) {
              case 0:
                return _context104.abrupt("return", (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroWalletRpc.prototype), "getOutgoingTransfers", this).apply(this, _args104));

              case 1:
              case "end":
                return _context104.stop();
            }
          }
        }, _callee104, this);
      }));

      function getOutgoingTransfers() {
        return _getOutgoingTransfers.apply(this, arguments);
      }

      return getOutgoingTransfers;
    }()
  }, {
    key: "createTx",
    value: function () {
      var _createTx = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee105() {
        var _args105 = arguments;
        return _regenerator["default"].wrap(function _callee105$(_context105) {
          while (1) {
            switch (_context105.prev = _context105.next) {
              case 0:
                return _context105.abrupt("return", (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroWalletRpc.prototype), "createTx", this).apply(this, _args105));

              case 1:
              case "end":
                return _context105.stop();
            }
          }
        }, _callee105, this);
      }));

      function createTx() {
        return _createTx.apply(this, arguments);
      }

      return createTx;
    }()
  }, {
    key: "relayTx",
    value: function () {
      var _relayTx = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee106() {
        var _args106 = arguments;
        return _regenerator["default"].wrap(function _callee106$(_context106) {
          while (1) {
            switch (_context106.prev = _context106.next) {
              case 0:
                return _context106.abrupt("return", (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroWalletRpc.prototype), "relayTx", this).apply(this, _args106));

              case 1:
              case "end":
                return _context106.stop();
            }
          }
        }, _callee106, this);
      }));

      function relayTx() {
        return _relayTx.apply(this, arguments);
      }

      return relayTx;
    }()
  }, {
    key: "getTxNote",
    value: function () {
      var _getTxNote = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee107() {
        var _args107 = arguments;
        return _regenerator["default"].wrap(function _callee107$(_context107) {
          while (1) {
            switch (_context107.prev = _context107.next) {
              case 0:
                return _context107.abrupt("return", (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroWalletRpc.prototype), "getTxNote", this).apply(this, _args107));

              case 1:
              case "end":
                return _context107.stop();
            }
          }
        }, _callee107, this);
      }));

      function getTxNote() {
        return _getTxNote.apply(this, arguments);
      }

      return getTxNote;
    }()
  }, {
    key: "setTxNote",
    value: function () {
      var _setTxNote = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee108() {
        var _args108 = arguments;
        return _regenerator["default"].wrap(function _callee108$(_context108) {
          while (1) {
            switch (_context108.prev = _context108.next) {
              case 0:
                return _context108.abrupt("return", (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroWalletRpc.prototype), "setTxNote", this).apply(this, _args108));

              case 1:
              case "end":
                return _context108.stop();
            }
          }
        }, _callee108, this);
      }));

      function setTxNote() {
        return _setTxNote.apply(this, arguments);
      }

      return setTxNote;
    }() // -------------------------------- PRIVATE ---------------------------------

  }, {
    key: "_clear",
    value: function () {
      var _clear2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee109() {
        return _regenerator["default"].wrap(function _callee109$(_context109) {
          while (1) {
            switch (_context109.prev = _context109.next) {
              case 0:
                this.listeners.splice(0, this.listeners.length);

                this._refreshListening();

                delete this.addressCache;
                this.addressCache = {};
                this.path = undefined;

              case 5:
              case "end":
                return _context109.stop();
            }
          }
        }, _callee109, this);
      }));

      function _clear() {
        return _clear2.apply(this, arguments);
      }

      return _clear;
    }()
  }, {
    key: "_getBalances",
    value: function () {
      var _getBalances2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee110(accountIdx, subaddressIdx) {
        var balance, unlockedBalance, _iterator34, _step34, account, params, resp;

        return _regenerator["default"].wrap(function _callee110$(_context110) {
          while (1) {
            switch (_context110.prev = _context110.next) {
              case 0:
                if (!(accountIdx === undefined)) {
                  _context110.next = 13;
                  break;
                }

                _assert["default"].equal(subaddressIdx, undefined, "Must provide account index with subaddress index");

                balance = BigInt(0);
                unlockedBalance = BigInt(0);
                _context110.t0 = _createForOfIteratorHelper;
                _context110.next = 7;
                return this.getAccounts();

              case 7:
                _context110.t1 = _context110.sent;
                _iterator34 = (0, _context110.t0)(_context110.t1);

                try {
                  for (_iterator34.s(); !(_step34 = _iterator34.n()).done;) {
                    account = _step34.value;
                    balance = balance + account.getBalance();
                    unlockedBalance = unlockedBalance + account.getUnlockedBalance();
                  }
                } catch (err) {
                  _iterator34.e(err);
                } finally {
                  _iterator34.f();
                }

                return _context110.abrupt("return", [balance, unlockedBalance]);

              case 13:
                params = {
                  account_index: accountIdx,
                  address_indices: subaddressIdx === undefined ? undefined : [subaddressIdx]
                };
                _context110.next = 16;
                return this.rpc.sendJsonRequest("get_balance", params);

              case 16:
                resp = _context110.sent;

                if (!(subaddressIdx === undefined)) {
                  _context110.next = 21;
                  break;
                }

                return _context110.abrupt("return", [BigInt(resp.result.balance), BigInt(resp.result.unlocked_balance)]);

              case 21:
                return _context110.abrupt("return", [BigInt(resp.result.per_subaddress[0].balance), BigInt(resp.result.per_subaddress[0].unlocked_balance)]);

              case 22:
              case "end":
                return _context110.stop();
            }
          }
        }, _callee110, this);
      }));

      function _getBalances(_x144, _x145) {
        return _getBalances2.apply(this, arguments);
      }

      return _getBalances;
    }()
  }, {
    key: "_getAccountIndices",
    value: function () {
      var _getAccountIndices2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee111(getSubaddressIndices) {
        var indices, _iterator35, _step35, account;

        return _regenerator["default"].wrap(function _callee111$(_context111) {
          while (1) {
            switch (_context111.prev = _context111.next) {
              case 0:
                indices = new Map();
                _context111.t0 = _createForOfIteratorHelper;
                _context111.next = 4;
                return this.getAccounts();

              case 4:
                _context111.t1 = _context111.sent;
                _iterator35 = (0, _context111.t0)(_context111.t1);
                _context111.prev = 6;

                _iterator35.s();

              case 8:
                if ((_step35 = _iterator35.n()).done) {
                  _context111.next = 23;
                  break;
                }

                account = _step35.value;
                _context111.t2 = indices;
                _context111.t3 = account.getIndex();

                if (!getSubaddressIndices) {
                  _context111.next = 18;
                  break;
                }

                _context111.next = 15;
                return this._getSubaddressIndices(account.getIndex());

              case 15:
                _context111.t4 = _context111.sent;
                _context111.next = 19;
                break;

              case 18:
                _context111.t4 = undefined;

              case 19:
                _context111.t5 = _context111.t4;

                _context111.t2.set.call(_context111.t2, _context111.t3, _context111.t5);

              case 21:
                _context111.next = 8;
                break;

              case 23:
                _context111.next = 28;
                break;

              case 25:
                _context111.prev = 25;
                _context111.t6 = _context111["catch"](6);

                _iterator35.e(_context111.t6);

              case 28:
                _context111.prev = 28;

                _iterator35.f();

                return _context111.finish(28);

              case 31:
                return _context111.abrupt("return", indices);

              case 32:
              case "end":
                return _context111.stop();
            }
          }
        }, _callee111, this, [[6, 25, 28, 31]]);
      }));

      function _getAccountIndices(_x146) {
        return _getAccountIndices2.apply(this, arguments);
      }

      return _getAccountIndices;
    }()
  }, {
    key: "_getSubaddressIndices",
    value: function () {
      var _getSubaddressIndices2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee112(accountIdx) {
        var subaddressIndices, resp, _iterator36, _step36, address;

        return _regenerator["default"].wrap(function _callee112$(_context112) {
          while (1) {
            switch (_context112.prev = _context112.next) {
              case 0:
                subaddressIndices = [];
                _context112.next = 3;
                return this.rpc.sendJsonRequest("get_address", {
                  account_index: accountIdx
                });

              case 3:
                resp = _context112.sent;
                _iterator36 = _createForOfIteratorHelper(resp.result.addresses);

                try {
                  for (_iterator36.s(); !(_step36 = _iterator36.n()).done;) {
                    address = _step36.value;
                    subaddressIndices.push(address.address_index);
                  }
                } catch (err) {
                  _iterator36.e(err);
                } finally {
                  _iterator36.f();
                }

                return _context112.abrupt("return", subaddressIndices);

              case 7:
              case "end":
                return _context112.stop();
            }
          }
        }, _callee112, this);
      }));

      function _getSubaddressIndices(_x147) {
        return _getSubaddressIndices2.apply(this, arguments);
      }

      return _getSubaddressIndices;
    }()
  }, {
    key: "_getTransfersAux",
    value: function () {
      var _getTransfersAux2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee113(query) {
        var isConnectedToDaemon, txQuery, canBeConfirmed, canBeInTxPool, canBeIncoming, canBeOutgoing, params, subaddressIndices, txMap, blockMap, resp, _i5, _Object$keys, key, _iterator37, _step37, rpcTx, tx, outgoingTransfer, transferTotal, _iterator38, _step38, destination, txs, transfers, _i6, _txs4, _tx6, _iterator39, _step39, transfer;

        return _regenerator["default"].wrap(function _callee113$(_context113) {
          while (1) {
            switch (_context113.prev = _context113.next) {
              case 0:
                _context113.next = 2;
                return this.isConnectedToDaemon();

              case 2:
                isConnectedToDaemon = _context113.sent;
                txQuery = query.getTxQuery();

                if (!(txQuery.inTxPool() !== undefined && txQuery.inTxPool() && !isConnectedToDaemon)) {
                  _context113.next = 6;
                  break;
                }

                throw new _MoneroError["default"]("Cannot fetch pool transactions because wallet has no daemon connection");

              case 6:
                // build params for get_transfers rpc call
                canBeConfirmed = txQuery.isConfirmed() !== false && txQuery.inTxPool() !== true && txQuery.isFailed() !== true && txQuery.isRelayed() !== false;
                canBeInTxPool = isConnectedToDaemon && txQuery.isConfirmed() !== true && txQuery.inTxPool() !== false && txQuery.isFailed() !== true && txQuery.isRelayed() !== false && txQuery.getHeight() === undefined && txQuery.getMaxHeight() === undefined && txQuery.isLocked() !== false;
                canBeIncoming = query.isIncoming() !== false && query.isOutgoing() !== true && query.hasDestinations() !== true;
                canBeOutgoing = query.isOutgoing() !== false && query.isIncoming() !== true;
                params = {};
                params["in"] = canBeIncoming && canBeConfirmed;
                params.out = canBeOutgoing && canBeConfirmed;
                params.pool = canBeIncoming && canBeInTxPool;
                params.pending = canBeOutgoing && canBeInTxPool;
                params.failed = txQuery.isFailed() !== false && txQuery.isConfirmed() !== true && txQuery.inTxPool() != true;

                if (txQuery.getMinHeight() !== undefined) {
                  if (txQuery.getMinHeight() > 0) params.min_height = txQuery.getMinHeight() - 1; // TODO monero-project: wallet2::get_payments() min_height is exclusive, so manually offset to match intended range (issues #5751, #5598)
                  else params.min_height = txQuery.getMinHeight();
                }

                if (txQuery.getMaxHeight() !== undefined) params.max_height = txQuery.getMaxHeight();
                params.filter_by_height = txQuery.getMinHeight() !== undefined || txQuery.getMaxHeight() !== undefined;

                if (query.getAccountIndex() === undefined) {
                  (0, _assert["default"])(query.getSubaddressIndex() === undefined && query.getSubaddressIndices() === undefined, "Query specifies a subaddress index but not an account index");
                  params.all_accounts = true;
                } else {
                  params.account_index = query.getAccountIndex(); // set subaddress indices param

                  subaddressIndices = new Set();
                  if (query.getSubaddressIndex() !== undefined) subaddressIndices.add(query.getSubaddressIndex());
                  if (query.getSubaddressIndices() !== undefined) query.getSubaddressIndices().map(function (subaddressIdx) {
                    return subaddressIndices.add(subaddressIdx);
                  });
                  if (subaddressIndices.size) params.subaddr_indices = Array.from(subaddressIndices);
                } // cache unique txs and blocks


                txMap = {};
                blockMap = {}; // build txs using `get_transfers`

                _context113.next = 24;
                return this.rpc.sendJsonRequest("get_transfers", params);

              case 24:
                resp = _context113.sent;

                for (_i5 = 0, _Object$keys = Object.keys(resp.result); _i5 < _Object$keys.length; _i5++) {
                  key = _Object$keys[_i5];
                  _iterator37 = _createForOfIteratorHelper(resp.result[key]);

                  try {
                    for (_iterator37.s(); !(_step37 = _iterator37.n()).done;) {
                      rpcTx = _step37.value;
                      //if (rpcTx.txid === query.debugTxId) console.log(rpcTx);
                      tx = MoneroWalletRpc._convertRpcTxWithTransfer(rpcTx);
                      if (tx.isConfirmed()) (0, _assert["default"])(tx.getBlock().getTxs().indexOf(tx) > -1); // replace transfer amount with destination sum
                      // TODO monero-wallet-rpc: confirmed tx from/to same account has amount 0 but cached transfers

                      if (tx.getOutgoingTransfer() !== undefined && tx.isRelayed() && !tx.isFailed() && tx.getOutgoingTransfer().getDestinations() && _GenUtils["default"].compareBigInt(tx.getOutgoingAmount(), BigInt(0)) === 0) {
                        outgoingTransfer = tx.getOutgoingTransfer();
                        transferTotal = BigInt(0);
                        _iterator38 = _createForOfIteratorHelper(outgoingTransfer.getDestinations());

                        try {
                          for (_iterator38.s(); !(_step38 = _iterator38.n()).done;) {
                            destination = _step38.value;
                            transferTotal = transferTotal + destination.getAmount();
                          }
                        } catch (err) {
                          _iterator38.e(err);
                        } finally {
                          _iterator38.f();
                        }

                        tx.getOutgoingTransfer().setAmount(transferTotal);
                      } // merge tx


                      MoneroWalletRpc._mergeTx(tx, txMap, blockMap);
                    }
                  } catch (err) {
                    _iterator37.e(err);
                  } finally {
                    _iterator37.f();
                  }
                } // sort txs by block height


                txs = Object.values(txMap);
                txs.sort(MoneroWalletRpc._compareTxsByHeight); // filter and return transfers

                transfers = [];

                for (_i6 = 0, _txs4 = txs; _i6 < _txs4.length; _i6++) {
                  _tx6 = _txs4[_i6];
                  // tx is not incoming/outgoing unless already set
                  if (_tx6.isIncoming() === undefined) _tx6.setIsIncoming(false);
                  if (_tx6.isOutgoing() === undefined) _tx6.setIsOutgoing(false); // sort incoming transfers

                  if (_tx6.getIncomingTransfers() !== undefined) _tx6.getIncomingTransfers().sort(MoneroWalletRpc._compareIncomingTransfers); // collect queried transfers, erase if excluded

                  _iterator39 = _createForOfIteratorHelper(_tx6.filterTransfers(query));

                  try {
                    for (_iterator39.s(); !(_step39 = _iterator39.n()).done;) {
                      transfer = _step39.value;
                      transfers.push(transfer);
                    } // remove txs without requested transfer

                  } catch (err) {
                    _iterator39.e(err);
                  } finally {
                    _iterator39.f();
                  }

                  if (_tx6.getBlock() !== undefined && _tx6.getOutgoingTransfer() === undefined && _tx6.getIncomingTransfers() === undefined) {
                    _tx6.getBlock().getTxs().splice(_tx6.getBlock().getTxs().indexOf(_tx6), 1);
                  }
                }

                return _context113.abrupt("return", transfers);

              case 31:
              case "end":
                return _context113.stop();
            }
          }
        }, _callee113, this);
      }));

      function _getTransfersAux(_x148) {
        return _getTransfersAux2.apply(this, arguments);
      }

      return _getTransfersAux;
    }()
  }, {
    key: "_getOutputsAux",
    value: function () {
      var _getOutputsAux2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee114(query) {
        var indices, subaddressIndices, txMap, blockMap, params, _iterator40, _step40, accountIdx, resp, _iterator42, _step42, rpcOutput, _tx7, txs, outputs, _i7, _txs5, tx, _iterator41, _step41, output;

        return _regenerator["default"].wrap(function _callee114$(_context114) {
          while (1) {
            switch (_context114.prev = _context114.next) {
              case 0:
                // determine account and subaddress indices to be queried
                indices = new Map();

                if (!(query.getAccountIndex() !== undefined)) {
                  _context114.next = 8;
                  break;
                }

                subaddressIndices = new Set();
                if (query.getSubaddressIndex() !== undefined) subaddressIndices.add(query.getSubaddressIndex());
                if (query.getSubaddressIndices() !== undefined) query.getSubaddressIndices().map(function (subaddressIdx) {
                  return subaddressIndices.add(subaddressIdx);
                });
                indices.set(query.getAccountIndex(), subaddressIndices.size ? Array.from(subaddressIndices) : undefined); // undefined will fetch from all subaddresses

                _context114.next = 13;
                break;

              case 8:
                _assert["default"].equal(query.getSubaddressIndex(), undefined, "Query specifies a subaddress index but not an account index");

                (0, _assert["default"])(query.getSubaddressIndices() === undefined || query.getSubaddressIndices().length === 0, "Query specifies subaddress indices but not an account index");
                _context114.next = 12;
                return this._getAccountIndices();

              case 12:
                indices = _context114.sent;

              case 13:
                // cache unique txs and blocks
                txMap = {};
                blockMap = {}; // collect txs with outputs for each indicated account using `incoming_transfers` rpc call

                params = {};
                params.transfer_type = query.isSpent() === true ? "unavailable" : query.isSpent() === false ? "available" : "all";
                params.verbose = true;
                _iterator40 = _createForOfIteratorHelper(indices.keys());
                _context114.prev = 19;

                _iterator40.s();

              case 21:
                if ((_step40 = _iterator40.n()).done) {
                  _context114.next = 34;
                  break;
                }

                accountIdx = _step40.value;
                // send request
                params.account_index = accountIdx;
                params.subaddr_indices = indices.get(accountIdx);
                _context114.next = 27;
                return this.rpc.sendJsonRequest("incoming_transfers", params);

              case 27:
                resp = _context114.sent;

                if (!(resp.result.transfers === undefined)) {
                  _context114.next = 30;
                  break;
                }

                return _context114.abrupt("continue", 32);

              case 30:
                _iterator42 = _createForOfIteratorHelper(resp.result.transfers);

                try {
                  for (_iterator42.s(); !(_step42 = _iterator42.n()).done;) {
                    rpcOutput = _step42.value;
                    _tx7 = MoneroWalletRpc._convertRpcTxWalletWithOutput(rpcOutput);

                    MoneroWalletRpc._mergeTx(_tx7, txMap, blockMap);
                  }
                } catch (err) {
                  _iterator42.e(err);
                } finally {
                  _iterator42.f();
                }

              case 32:
                _context114.next = 21;
                break;

              case 34:
                _context114.next = 39;
                break;

              case 36:
                _context114.prev = 36;
                _context114.t0 = _context114["catch"](19);

                _iterator40.e(_context114.t0);

              case 39:
                _context114.prev = 39;

                _iterator40.f();

                return _context114.finish(39);

              case 42:
                // sort txs by block height
                txs = Object.values(txMap);
                txs.sort(MoneroWalletRpc._compareTxsByHeight); // collect queried outputs

                outputs = [];

                for (_i7 = 0, _txs5 = txs; _i7 < _txs5.length; _i7++) {
                  tx = _txs5[_i7];
                  // sort outputs
                  if (tx.getOutputs() !== undefined) tx.getOutputs().sort(MoneroWalletRpc._compareOutputs); // collect queried outputs, erase if excluded

                  _iterator41 = _createForOfIteratorHelper(tx.filterOutputs(query));

                  try {
                    for (_iterator41.s(); !(_step41 = _iterator41.n()).done;) {
                      output = _step41.value;
                      outputs.push(output);
                    } // remove excluded txs from block

                  } catch (err) {
                    _iterator41.e(err);
                  } finally {
                    _iterator41.f();
                  }

                  if (tx.getOutputs() === undefined && tx.getBlock() !== undefined) {
                    tx.getBlock().getTxs().splice(tx.getBlock().getTxs().indexOf(tx), 1);
                  }
                }

                return _context114.abrupt("return", outputs);

              case 47:
              case "end":
                return _context114.stop();
            }
          }
        }, _callee114, this, [[19, 36, 39, 42]]);
      }));

      function _getOutputsAux(_x149) {
        return _getOutputsAux2.apply(this, arguments);
      }

      return _getOutputsAux;
    }()
    /**
     * Common method to get key images.
     * 
     * @param all - pecifies to get all xor only new images from last import
     * @return {MoneroKeyImage[]} are the key images
     */

  }, {
    key: "_rpcExportKeyImages",
    value: function () {
      var _rpcExportKeyImages2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee115(all) {
        var resp;
        return _regenerator["default"].wrap(function _callee115$(_context115) {
          while (1) {
            switch (_context115.prev = _context115.next) {
              case 0:
                _context115.next = 2;
                return this.rpc.sendJsonRequest("export_key_images", {
                  all: all
                });

              case 2:
                resp = _context115.sent;

                if (resp.result.signed_key_images) {
                  _context115.next = 5;
                  break;
                }

                return _context115.abrupt("return", []);

              case 5:
                return _context115.abrupt("return", resp.result.signed_key_images.map(function (rpcImage) {
                  return new _MoneroKeyImage["default"](rpcImage.key_image, rpcImage.signature);
                }));

              case 6:
              case "end":
                return _context115.stop();
            }
          }
        }, _callee115, this);
      }));

      function _rpcExportKeyImages(_x150) {
        return _rpcExportKeyImages2.apply(this, arguments);
      }

      return _rpcExportKeyImages;
    }()
  }, {
    key: "_rpcSweepAccount",
    value: function () {
      var _rpcSweepAccount2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee116(config) {
        var _iterator43, _step43, subaddress, params, relay, resp, result, txSet, _iterator44, _step44, tx, transfer, destination;

        return _regenerator["default"].wrap(function _callee116$(_context116) {
          while (1) {
            switch (_context116.prev = _context116.next) {
              case 0:
                if (!(config === undefined)) {
                  _context116.next = 2;
                  break;
                }

                throw new _MoneroError["default"]("Must provide sweep config");

              case 2:
                if (!(config.getAccountIndex() === undefined)) {
                  _context116.next = 4;
                  break;
                }

                throw new _MoneroError["default"]("Must provide an account index to sweep from");

              case 4:
                if (!(config.getDestinations() === undefined || config.getDestinations().length != 1)) {
                  _context116.next = 6;
                  break;
                }

                throw new _MoneroError["default"]("Must provide exactly one destination to sweep to");

              case 6:
                if (!(config.getDestinations()[0].getAddress() === undefined)) {
                  _context116.next = 8;
                  break;
                }

                throw new _MoneroError["default"]("Must provide destination address to sweep to");

              case 8:
                if (!(config.getDestinations()[0].getAmount() !== undefined)) {
                  _context116.next = 10;
                  break;
                }

                throw new _MoneroError["default"]("Cannot specify amount in sweep config");

              case 10:
                if (!(config.getKeyImage() !== undefined)) {
                  _context116.next = 12;
                  break;
                }

                throw new _MoneroError["default"]("Key image defined; use sweepOutput() to sweep an output by its key image");

              case 12:
                if (!(config.getSubaddressIndices() !== undefined && config.getSubaddressIndices().length === 0)) {
                  _context116.next = 14;
                  break;
                }

                throw new _MoneroError["default"]("Empty list given for subaddresses indices to sweep");

              case 14:
                if (!config.getSweepEachSubaddress()) {
                  _context116.next = 16;
                  break;
                }

                throw new _MoneroError["default"]("Cannot sweep each subaddress with RPC `sweep_all`");

              case 16:
                if (!(config.getSubaddressIndices() === undefined)) {
                  _context116.next = 24;
                  break;
                }

                config.setSubaddressIndices([]);
                _context116.t0 = _createForOfIteratorHelper;
                _context116.next = 21;
                return this.getSubaddresses(config.getAccountIndex());

              case 21:
                _context116.t1 = _context116.sent;
                _iterator43 = (0, _context116.t0)(_context116.t1);

                try {
                  for (_iterator43.s(); !(_step43 = _iterator43.n()).done;) {
                    subaddress = _step43.value;
                    config.getSubaddressIndices().push(subaddress.getIndex());
                  }
                } catch (err) {
                  _iterator43.e(err);
                } finally {
                  _iterator43.f();
                }

              case 24:
                if (!(config.getSubaddressIndices().length === 0)) {
                  _context116.next = 26;
                  break;
                }

                throw new _MoneroError["default"]("No subaddresses to sweep from");

              case 26:
                // common config params
                params = {};
                relay = config.getRelay() === true;
                params.account_index = config.getAccountIndex();
                params.subaddr_indices = config.getSubaddressIndices();
                params.address = config.getDestinations()[0].getAddress();
                (0, _assert["default"])(config.getPriority() === undefined || config.getPriority() >= 0 && config.getPriority() <= 3);
                params.priority = config.getPriority();
                params.unlock_time = config.getUnlockHeight();
                params.payment_id = config.getPaymentId();
                params.do_not_relay = !relay;
                params.below_amount = config.getBelowAmount();
                params.get_tx_keys = true;
                params.get_tx_hex = true;
                params.get_tx_metadata = true; // invoke wallet rpc `sweep_all`

                _context116.next = 42;
                return this.rpc.sendJsonRequest("sweep_all", params);

              case 42:
                resp = _context116.sent;
                result = resp.result; // initialize txs from response

                txSet = MoneroWalletRpc._convertRpcSentTxsToTxSet(result); // initialize remaining known fields

                _iterator44 = _createForOfIteratorHelper(txSet.getTxs());

                try {
                  for (_iterator44.s(); !(_step44 = _iterator44.n()).done;) {
                    tx = _step44.value;
                    tx.setIsLocked(true);
                    tx.setIsConfirmed(false);
                    tx.setNumConfirmations(0);
                    tx.setRelay(relay);
                    tx.setInTxPool(relay);
                    tx.setIsRelayed(relay);
                    tx.setIsMinerTx(false);
                    tx.setIsFailed(false);
                    tx.setRingSize(_MoneroUtils["default"].RING_SIZE);
                    transfer = tx.getOutgoingTransfer();
                    transfer.setAccountIndex(config.getAccountIndex());
                    if (config.getSubaddressIndices().length === 1) transfer.setSubaddressIndices(config.getSubaddressIndices());
                    destination = new _MoneroDestination["default"](config.getDestinations()[0].getAddress(), BigInt(transfer.getAmount()));
                    transfer.setDestinations([destination]);
                    tx.setOutgoingTransfer(transfer);
                    tx.setPaymentId(config.getPaymentId());
                    if (tx.getUnlockHeight() === undefined) tx.setUnlockHeight(config.getUnlockHeight() === undefined ? 0 : config.getUnlockHeight());

                    if (tx.getRelay()) {
                      if (tx.getLastRelayedTimestamp() === undefined) tx.setLastRelayedTimestamp(+new Date().getTime()); // TODO (monero-wallet-rpc): provide timestamp on response; unconfirmed timestamps vary

                      if (tx.isDoubleSpendSeen() === undefined) tx.setIsDoubleSpend(false);
                    }
                  }
                } catch (err) {
                  _iterator44.e(err);
                } finally {
                  _iterator44.f();
                }

                return _context116.abrupt("return", txSet.getTxs());

              case 48:
              case "end":
                return _context116.stop();
            }
          }
        }, _callee116, this);
      }));

      function _rpcSweepAccount(_x151) {
        return _rpcSweepAccount2.apply(this, arguments);
      }

      return _rpcSweepAccount;
    }()
  }, {
    key: "_refreshListening",
    value: function _refreshListening() {
      if (this.walletPoller == undefined && this.listeners.length) this.walletPoller = new WalletPoller(this);
      if (this.walletPoller !== undefined) this.walletPoller.setIsPolling(this.listeners.length > 0);
    }
    /**
     * Poll if listening.
     */

  }, {
    key: "_poll",
    value: function () {
      var _poll2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee117() {
        return _regenerator["default"].wrap(function _callee117$(_context117) {
          while (1) {
            switch (_context117.prev = _context117.next) {
              case 0:
                if (!(this.walletPoller !== undefined && this.walletPoller._isPolling)) {
                  _context117.next = 3;
                  break;
                }

                _context117.next = 3;
                return this.walletPoller.poll();

              case 3:
              case "end":
                return _context117.stop();
            }
          }
        }, _callee117, this);
      }));

      function _poll() {
        return _poll2.apply(this, arguments);
      }

      return _poll;
    }() // ---------------------------- PRIVATE STATIC ------------------------------

  }], [{
    key: "_connectToWalletRpc",
    value: function () {
      var _connectToWalletRpc2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee118(uriOrConfig, username, password, rejectUnauthorized) {
        var _args118 = arguments;
        return _regenerator["default"].wrap(function _callee118$(_context118) {
          while (1) {
            switch (_context118.prev = _context118.next) {
              case 0:
                if (!_GenUtils["default"].isArray(uriOrConfig)) {
                  _context118.next = 4;
                  break;
                }

                return _context118.abrupt("return", MoneroWalletRpc._startWalletRpcProcess(uriOrConfig));

              case 4:
                return _context118.abrupt("return", (0, _construct2["default"])(MoneroWalletRpc, Array.prototype.slice.call(_args118)));

              case 5:
              case "end":
                return _context118.stop();
            }
          }
        }, _callee118);
      }));

      function _connectToWalletRpc(_x152, _x153, _x154, _x155) {
        return _connectToWalletRpc2.apply(this, arguments);
      }

      return _connectToWalletRpc;
    }()
  }, {
    key: "_startWalletRpcProcess",
    value: function () {
      var _startWalletRpcProcess2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee119(cmd) {
        var uri, that, output;
        return _regenerator["default"].wrap(function _callee119$(_context119) {
          while (1) {
            switch (_context119.prev = _context119.next) {
              case 0:
                (0, _assert["default"])(_GenUtils["default"].isArray(cmd), "Must provide string array with command line parameters"); // start process

                this.process = require('child_process').spawn(cmd[0], cmd.slice(1), {});
                this.process.stdout.setEncoding('utf8');
                this.process.stderr.setEncoding('utf8'); // return promise which resolves after starting monero-wallet-rpc

                that = this;
                output = "";
                return _context119.abrupt("return", new Promise(function (resolve, reject) {
                  // handle stdout
                  that.process.stdout.on('data', function (data) {
                    var line = data.toString();

                    _LibraryUtils["default"].log(2, line);

                    output += line + '\n'; // capture output in case of error
                    // extract uri from e.g. "I Binding on 127.0.0.1 (IPv4):38085"

                    var uriLineContains = "Binding on ";
                    var uriLineContainsIdx = line.indexOf(uriLineContains);

                    if (uriLineContainsIdx >= 0) {
                      var host = line.substring(uriLineContainsIdx + uriLineContains.length, line.lastIndexOf(' '));
                      var unformattedLine = line.replace(/\u001b\[.*?m/g, '').trim(); // remove color formatting

                      var port = unformattedLine.substring(unformattedLine.lastIndexOf(':') + 1);
                      var sslIdx = cmd.indexOf("--rpc-ssl");
                      var sslEnabled = sslIdx >= 0 ? "enabled" == cmd[sslIdx + 1].toLowerCase() : false;
                      uri = (sslEnabled ? "https" : "http") + "://" + host + ":" + port;
                    } // read success message


                    if (line.indexOf("Starting wallet RPC server") >= 0) {
                      // get username and password from params
                      var userPassIdx = cmd.indexOf("--rpc-login");
                      var userPass = userPassIdx >= 0 ? cmd[userPassIdx + 1] : undefined;
                      var username = userPass === undefined ? undefined : userPass.substring(0, userPass.indexOf(':'));
                      var password = userPass === undefined ? undefined : userPass.substring(userPass.indexOf(':') + 1); // create client connected to internal process

                      var wallet = new MoneroWalletRpc(uri, username, password);
                      wallet.process = that.process; // resolve promise with client connected to internal process 

                      this.isResolved = true;
                      resolve(wallet);
                    }
                  }); // handle stderr

                  that.process.stderr.on('data', function (data) {
                    if (_LibraryUtils["default"].getLogLevel() >= 2) console.error(data);
                  }); // handle exit

                  that.process.on("exit", function (code) {
                    if (!this.isResolved) reject(new _MoneroError["default"]("monero-wallet-rpc process terminated with exit code " + code + (output ? ":\n\n" + output : "")));
                  }); // handle error

                  that.process.on("error", function (err) {
                    if (err.message.indexOf("ENOENT") >= 0) reject(new _MoneroError["default"]("monero-wallet-rpc does not exist at path '" + cmd[0] + "'"));
                    if (!this.isResolved) reject(err);
                  }); // handle uncaught exception

                  that.process.on("uncaughtException", function (err, origin) {
                    console.error("Uncaught exception in monero-wallet-rpc process: " + err.message);
                    console.error(origin);
                    reject(err);
                  });
                }));

              case 7:
              case "end":
                return _context119.stop();
            }
          }
        }, _callee119, this);
      }));

      function _startWalletRpcProcess(_x156) {
        return _startWalletRpcProcess2.apply(this, arguments);
      }

      return _startWalletRpcProcess;
    }()
  }, {
    key: "_normalizeConfig",
    value: function _normalizeConfig(uriOrConfigOrConnection, username, password, rejectUnauthorized) {
      var config;
      if (typeof uriOrConfigOrConnection === "string") config = {
        uri: uriOrConfigOrConnection,
        username: username,
        password: password,
        rejectUnauthorized: rejectUnauthorized
      };else {
        if ((0, _typeof2["default"])(uriOrConfigOrConnection) !== "object") throw new _MoneroError["default"]("Invalid configuration to create rpc client; must be string, object, or MoneroRpcConnection");
        if (username || password || rejectUnauthorized) throw new _MoneroError["default"]("Can provide config object or params or new MoneroDaemonRpc(...) but not both");
        if (uriOrConfigOrConnection instanceof _MoneroRpcConnection["default"]) config = Object.assign({}, uriOrConfigOrConnection.getConfig());else config = Object.assign({}, uriOrConfigOrConnection);
      }

      if (config.server) {
        config = Object.assign(config, new _MoneroRpcConnection["default"](config.server).getConfig());
        delete config.server;
      }

      return config;
    }
    /**
     * Remove criteria which requires looking up other transfers/outputs to
     * fulfill query.
     * 
     * @param {MoneroTxQuery} query - the query to decontextualize
     * @return {MoneroTxQuery} a reference to the query for convenience
     */

  }, {
    key: "_decontextualize",
    value: function _decontextualize(query) {
      query.setIsIncoming(undefined);
      query.setIsOutgoing(undefined);
      query.setTransferQuery(undefined);
      query.setInputQuery(undefined);
      query.setOutputQuery(undefined);
      return query;
    }
  }, {
    key: "_isContextual",
    value: function _isContextual(query) {
      if (!query) return false;
      if (!query.getTxQuery()) return false;
      if (query.getTxQuery().isIncoming() !== undefined) return true; // requires getting other transfers

      if (query.getTxQuery().isOutgoing() !== undefined) return true;

      if (query instanceof _MoneroTransferQuery["default"]) {
        if (query.getTxQuery().getOutputQuery() !== undefined) return true; // requires getting other outputs
      } else if (query instanceof _MoneroOutputQuery["default"]) {
        if (query.getTxQuery().getTransferQuery() !== undefined) return true; // requires getting other transfers
      } else {
        throw new _MoneroError["default"]("query must be tx or transfer query");
      }

      return false;
    }
  }, {
    key: "_convertRpcAccount",
    value: function _convertRpcAccount(rpcAccount) {
      var account = new _MoneroAccount["default"]();

      for (var _i8 = 0, _Object$keys2 = Object.keys(rpcAccount); _i8 < _Object$keys2.length; _i8++) {
        var key = _Object$keys2[_i8];
        var val = rpcAccount[key];
        if (key === "account_index") account.setIndex(val);else if (key === "balance") account.setBalance(BigInt(val));else if (key === "unlocked_balance") account.setUnlockedBalance(BigInt(val));else if (key === "base_address") account.setPrimaryAddress(val);else if (key === "tag") account.setTag(val);else if (key === "label") {} // label belongs to first subaddress
        else console.log("WARNING: ignoring unexpected account field: " + key + ": " + val);
      }

      if ("" === account.getTag()) account.setTag(undefined);
      return account;
    }
  }, {
    key: "_convertRpcSubaddress",
    value: function _convertRpcSubaddress(rpcSubaddress) {
      var subaddress = new _MoneroSubaddress["default"]();

      for (var _i9 = 0, _Object$keys3 = Object.keys(rpcSubaddress); _i9 < _Object$keys3.length; _i9++) {
        var key = _Object$keys3[_i9];
        var val = rpcSubaddress[key];
        if (key === "account_index") subaddress.setAccountIndex(val);else if (key === "address_index") subaddress.setIndex(val);else if (key === "address") subaddress.setAddress(val);else if (key === "balance") subaddress.setBalance(BigInt(val));else if (key === "unlocked_balance") subaddress.setUnlockedBalance(BigInt(val));else if (key === "num_unspent_outputs") subaddress.setNumUnspentOutputs(val);else if (key === "label") {
          if (val) subaddress.setLabel(val);
        } else if (key === "used") subaddress.setIsUsed(val);else if (key === "blocks_to_unlock") subaddress.setNumBlocksToUnlock(val);else if (key == "time_to_unlock") {} // ignoring
        else console.log("WARNING: ignoring unexpected subaddress field: " + key + ": " + val);
      }

      return subaddress;
    }
    /**
     * Initializes a sent transaction.
     * 
     * @param {MoneroTxConfig} config - send config
     * @param {MoneroTxWallet} [tx] - existing transaction to initialize (optional)
     * @param {boolean} copyDestinations - copies config destinations if true
     * @return {MoneroTxWallet} is the initialized send tx
     */

  }, {
    key: "_initSentTxWallet",
    value: function _initSentTxWallet(config, tx, copyDestinations) {
      if (!tx) tx = new _MoneroTxWallet["default"]();
      var relay = config.getRelay() === true;
      tx.setIsOutgoing(true);
      tx.setIsConfirmed(false);
      tx.setNumConfirmations(0);
      tx.setInTxPool(relay);
      tx.setRelay(relay);
      tx.setIsRelayed(relay);
      tx.setIsMinerTx(false);
      tx.setIsFailed(false);
      tx.setIsLocked(true);
      tx.setRingSize(_MoneroUtils["default"].RING_SIZE);
      var transfer = new _MoneroOutgoingTransfer["default"]().setTx(tx);
      if (config.getSubaddressIndices() && config.getSubaddressIndices().length === 1) transfer.setSubaddressIndices(config.getSubaddressIndices().slice(0)); // we know src subaddress indices iff config specifies 1

      if (copyDestinations) {
        var destCopies = [];

        var _iterator45 = _createForOfIteratorHelper(config.getDestinations()),
            _step45;

        try {
          for (_iterator45.s(); !(_step45 = _iterator45.n()).done;) {
            var dest = _step45.value;
            destCopies.push(dest.copy());
          }
        } catch (err) {
          _iterator45.e(err);
        } finally {
          _iterator45.f();
        }

        transfer.setDestinations(destCopies);
      }

      tx.setOutgoingTransfer(transfer);
      tx.setPaymentId(config.getPaymentId());
      if (tx.getUnlockHeight() === undefined) tx.setUnlockHeight(config.getUnlockHeight() === undefined ? 0 : config.getUnlockHeight());

      if (config.getRelay()) {
        if (tx.getLastRelayedTimestamp() === undefined) tx.setLastRelayedTimestamp(+new Date().getTime()); // TODO (monero-wallet-rpc): provide timestamp on response; unconfirmed timestamps vary

        if (tx.isDoubleSpendSeen() === undefined) tx.setIsDoubleSpend(false);
      }

      return tx;
    }
    /**
     * Initializes a tx set from a RPC map excluding txs.
     * 
     * @param rpcMap - map to initialize the tx set from
     * @return MoneroTxSet - initialized tx set
     * @return the resulting tx set
     */

  }, {
    key: "_convertRpcTxSet",
    value: function _convertRpcTxSet(rpcMap) {
      var txSet = new _MoneroTxSet["default"]();
      txSet.setMultisigTxHex(rpcMap.multisig_txset);
      txSet.setUnsignedTxHex(rpcMap.unsigned_txset);
      txSet.setSignedTxHex(rpcMap.signed_txset);
      if (txSet.getMultisigTxHex() !== undefined && txSet.getMultisigTxHex().length === 0) txSet.setMultisigTxHex(undefined);
      if (txSet.getUnsignedTxHex() !== undefined && txSet.getUnsignedTxHex().length === 0) txSet.setUnsignedTxHex(undefined);
      if (txSet.getSignedTxHex() !== undefined && txSet.getSignedTxHex().length === 0) txSet.setSignedTxHex(undefined);
      return txSet;
    }
    /**
     * Initializes a MoneroTxSet from from a list of rpc txs.
     * 
     * @param rpcTxs - rpc txs to initialize the set from
     * @param txs - existing txs to further initialize (optional)
     * @return the converted tx set
     */

  }, {
    key: "_convertRpcSentTxsToTxSet",
    value: function _convertRpcSentTxsToTxSet(rpcTxs, txs) {
      // build shared tx set
      var txSet = MoneroWalletRpc._convertRpcTxSet(rpcTxs); // get number of txs


      var numTxs = rpcTxs.fee_list ? rpcTxs.fee_list.length : 0; // done if rpc response contains no txs

      if (numTxs === 0) {
        _assert["default"].equal(txs, undefined);

        return txSet;
      } // pre-initialize txs if none given


      if (txs) txSet.setTxs(txs);else {
        txs = [];

        for (var i = 0; i < numTxs; i++) {
          txs.push(new _MoneroTxWallet["default"]());
        }
      }

      var _iterator46 = _createForOfIteratorHelper(txs),
          _step46;

      try {
        for (_iterator46.s(); !(_step46 = _iterator46.n()).done;) {
          var tx = _step46.value;
          tx.setTxSet(txSet);
          tx.setIsOutgoing(true);
        }
      } catch (err) {
        _iterator46.e(err);
      } finally {
        _iterator46.f();
      }

      txSet.setTxs(txs); // initialize txs from rpc lists

      for (var _i10 = 0, _Object$keys4 = Object.keys(rpcTxs); _i10 < _Object$keys4.length; _i10++) {
        var key = _Object$keys4[_i10];
        var val = rpcTxs[key];
        if (key === "tx_hash_list") for (var _i11 = 0; _i11 < val.length; _i11++) {
          txs[_i11].setHash(val[_i11]);
        } else if (key === "tx_key_list") for (var _i12 = 0; _i12 < val.length; _i12++) {
          txs[_i12].setKey(val[_i12]);
        } else if (key === "tx_blob_list") for (var _i13 = 0; _i13 < val.length; _i13++) {
          txs[_i13].setFullHex(val[_i13]);
        } else if (key === "tx_metadata_list") for (var _i14 = 0; _i14 < val.length; _i14++) {
          txs[_i14].setMetadata(val[_i14]);
        } else if (key === "fee_list") for (var _i15 = 0; _i15 < val.length; _i15++) {
          txs[_i15].setFee(BigInt(val[_i15]));
        } else if (key === "weight_list") for (var _i16 = 0; _i16 < val.length; _i16++) {
          txs[_i16].setWeight(val[_i16]);
        } else if (key === "amount_list") {
          for (var _i17 = 0; _i17 < val.length; _i17++) {
            if (txs[_i17].getOutgoingTransfer() !== undefined) txs[_i17].getOutgoingTransfer().setAmount(BigInt(val[_i17]));else txs[_i17].setOutgoingTransfer(new _MoneroOutgoingTransfer["default"]().setTx(txs[_i17]).setAmount(BigInt(val[_i17])));
          }
        } else if (key === "multisig_txset" || key === "unsigned_txset" || key === "signed_txset") {} // handled elsewhere
        else if (key === "spent_key_images_list") {
          var inputKeyImagesList = val;

          for (var _i18 = 0; _i18 < inputKeyImagesList.length; _i18++) {
            _GenUtils["default"].assertTrue(txs[_i18].getInputs() === undefined);

            txs[_i18].setInputs([]);

            var _iterator47 = _createForOfIteratorHelper(inputKeyImagesList[_i18]["key_images"]),
                _step47;

            try {
              for (_iterator47.s(); !(_step47 = _iterator47.n()).done;) {
                var inputKeyImage = _step47.value;

                txs[_i18].getInputs().push(new _MoneroOutputWallet["default"]().setKeyImage(new _MoneroKeyImage["default"]().setHex(inputKeyImage)).setTx(txs[_i18]));
              }
            } catch (err) {
              _iterator47.e(err);
            } finally {
              _iterator47.f();
            }
          }
        } else console.log("WARNING: ignoring unexpected transaction field: " + key + ": " + val);
      }

      return txSet;
    }
    /**
     * Converts a rpc tx with a transfer to a tx set with a tx and transfer.
     * 
     * @param rpcTx - rpc tx to build from
     * @param tx - existing tx to continue initializing (optional)
     * @param isOutgoing - specifies if the tx is outgoing if true, incoming if false, or decodes from type if undefined
     * @returns the initialized tx set with a tx
     */

  }, {
    key: "_convertRpcTxToTxSet",
    value: function _convertRpcTxToTxSet(rpcTx, tx, isOutgoing) {
      var txSet = MoneroWalletRpc._convertRpcTxSet(rpcTx);

      txSet.setTxs([MoneroWalletRpc._convertRpcTxWithTransfer(rpcTx, tx, isOutgoing).setTxSet(txSet)]);
      return txSet;
    }
    /**
     * Builds a MoneroTxWallet from a RPC tx.
     * 
     * @param rpcTx - rpc tx to build from
     * @param tx - existing tx to continue initializing (optional)
     * @param isOutgoing - specifies if the tx is outgoing if true, incoming if false, or decodes from type if undefined
     * @returns {MoneroTxWallet} is the initialized tx
     */

  }, {
    key: "_convertRpcTxWithTransfer",
    value: function _convertRpcTxWithTransfer(rpcTx, tx, isOutgoing) {
      // TODO: change everything to safe set
      // initialize tx to return
      if (!tx) tx = new _MoneroTxWallet["default"](); // initialize tx state from rpc type

      if (rpcTx.type !== undefined) isOutgoing = MoneroWalletRpc._decodeRpcType(rpcTx.type, tx);else _assert["default"].equal((0, _typeof2["default"])(isOutgoing), "boolean", "Must indicate if tx is outgoing (true) xor incoming (false) since unknown"); // TODO: safe set
      // initialize remaining fields  TODO: seems this should be part of common function with DaemonRpc._convertRpcTx

      var header;
      var transfer;

      for (var _i19 = 0, _Object$keys5 = Object.keys(rpcTx); _i19 < _Object$keys5.length; _i19++) {
        var key = _Object$keys5[_i19];
        var val = rpcTx[key];
        if (key === "txid") tx.setHash(val);else if (key === "tx_hash") tx.setHash(val);else if (key === "fee") tx.setFee(BigInt(val));else if (key === "note") {
          if (val) tx.setNote(val);
        } else if (key === "tx_key") tx.setKey(val);else if (key === "type") {} // type already handled
        else if (key === "tx_size") tx.setSize(val);else if (key === "unlock_time") tx.setUnlockHeight(val);else if (key === "weight") tx.setWeight(val);else if (key === "locked") tx.setIsLocked(val);else if (key === "tx_blob") tx.setFullHex(val);else if (key === "tx_metadata") tx.setMetadata(val);else if (key === "double_spend_seen") tx.setIsDoubleSpend(val);else if (key === "block_height" || key === "height") {
          if (tx.isConfirmed()) {
            if (!header) header = new _MoneroBlockHeader["default"]();
            header.setHeight(val);
          }
        } else if (key === "timestamp") {
          if (tx.isConfirmed()) {
            if (!header) header = new _MoneroBlockHeader["default"]();
            header.setTimestamp(val);
          } else {// timestamp of unconfirmed tx is current request time
          }
        } else if (key === "confirmations") tx.setNumConfirmations(val);else if (key === "suggested_confirmations_threshold") {
          if (transfer === undefined) transfer = (isOutgoing ? new _MoneroOutgoingTransfer["default"]() : new _MoneroIncomingTransfer["default"]()).setTx(tx);
          if (!isOutgoing) transfer.setNumSuggestedConfirmations(val);
        } else if (key === "amount") {
          if (transfer === undefined) transfer = (isOutgoing ? new _MoneroOutgoingTransfer["default"]() : new _MoneroIncomingTransfer["default"]()).setTx(tx);
          transfer.setAmount(BigInt(val));
        } else if (key === "amounts") {} // ignoring, amounts sum to amount
        else if (key === "address") {
          if (!isOutgoing) {
            if (!transfer) transfer = new _MoneroIncomingTransfer["default"]().setTx(tx);
            transfer.setAddress(val);
          }
        } else if (key === "payment_id") {
          if ("" !== val && _MoneroTxWallet["default"].DEFAULT_PAYMENT_ID !== val) tx.setPaymentId(val); // default is undefined
        } else if (key === "subaddr_index") (0, _assert["default"])(rpcTx.subaddr_indices); // handled by subaddr_indices
        else if (key === "subaddr_indices") {
          if (!transfer) transfer = (isOutgoing ? new _MoneroOutgoingTransfer["default"]() : new _MoneroIncomingTransfer["default"]()).setTx(tx);
          var rpcIndices = val;
          transfer.setAccountIndex(rpcIndices[0].major);

          if (isOutgoing) {
            var subaddressIndices = [];

            var _iterator48 = _createForOfIteratorHelper(rpcIndices),
                _step48;

            try {
              for (_iterator48.s(); !(_step48 = _iterator48.n()).done;) {
                var rpcIndex = _step48.value;
                subaddressIndices.push(rpcIndex.minor);
              }
            } catch (err) {
              _iterator48.e(err);
            } finally {
              _iterator48.f();
            }

            transfer.setSubaddressIndices(subaddressIndices);
          } else {
            _assert["default"].equal(rpcIndices.length, 1);

            transfer.setSubaddressIndex(rpcIndices[0].minor);
          }
        } else if (key === "destinations" || key == "recipients") {
          (0, _assert["default"])(isOutgoing);
          var destinations = [];

          var _iterator49 = _createForOfIteratorHelper(val),
              _step49;

          try {
            for (_iterator49.s(); !(_step49 = _iterator49.n()).done;) {
              var rpcDestination = _step49.value;
              var destination = new _MoneroDestination["default"]();
              destinations.push(destination);

              for (var _i20 = 0, _Object$keys6 = Object.keys(rpcDestination); _i20 < _Object$keys6.length; _i20++) {
                var destinationKey = _Object$keys6[_i20];
                if (destinationKey === "address") destination.setAddress(rpcDestination[destinationKey]);else if (destinationKey === "amount") destination.setAmount(BigInt(rpcDestination[destinationKey]));else throw new _MoneroError["default"]("Unrecognized transaction destination field: " + destinationKey);
              }
            }
          } catch (err) {
            _iterator49.e(err);
          } finally {
            _iterator49.f();
          }

          if (transfer === undefined) transfer = new _MoneroOutgoingTransfer["default"]({
            tx: tx
          });
          transfer.setDestinations(destinations);
        } else if (key === "multisig_txset" && val !== undefined) {} // handled elsewhere; this method only builds a tx wallet
        else if (key === "unsigned_txset" && val !== undefined) {} // handled elsewhere; this method only builds a tx wallet
        else if (key === "amount_in") tx.setInputSum(BigInt(val));else if (key === "amount_out") tx.setOutputSum(BigInt(val));else if (key === "change_address") tx.setChangeAddress(val === "" ? undefined : val);else if (key === "change_amount") tx.setChangeAmount(BigInt(val));else if (key === "dummy_outputs") tx.setNumDummyOutputs(val);else if (key === "extra") tx.setExtraHex(val);else if (key === "ring_size") tx.setRingSize(val);else if (key === "spent_key_images") {
          var inputKeyImages = val.key_images;

          _GenUtils["default"].assertTrue(tx.getInputs() === undefined);

          tx.setInputs([]);

          var _iterator50 = _createForOfIteratorHelper(inputKeyImages),
              _step50;

          try {
            for (_iterator50.s(); !(_step50 = _iterator50.n()).done;) {
              var inputKeyImage = _step50.value;
              tx.getInputs().push(new _MoneroOutputWallet["default"]().setKeyImage(new _MoneroKeyImage["default"]().setHex(inputKeyImage)).setTx(tx));
            }
          } catch (err) {
            _iterator50.e(err);
          } finally {
            _iterator50.f();
          }
        } else console.log("WARNING: ignoring unexpected transaction field: " + key + ": " + val);
      } // link block and tx


      if (header) tx.setBlock(new _MoneroBlock["default"](header).setTxs([tx])); // initialize final fields

      if (transfer) {
        if (tx.isConfirmed() === undefined) tx.setIsConfirmed(false);
        if (!transfer.getTx().isConfirmed()) tx.setNumConfirmations(0);

        if (isOutgoing) {
          tx.setIsOutgoing(true);
          if (tx.getOutgoingTransfer()) tx.getOutgoingTransfer().merge(transfer);else tx.setOutgoingTransfer(transfer);
        } else {
          tx.setIsIncoming(true);
          tx.setIncomingTransfers([transfer]);
        }
      } // return initialized transaction


      return tx;
    }
  }, {
    key: "_convertRpcTxWalletWithOutput",
    value: function _convertRpcTxWalletWithOutput(rpcOutput) {
      // initialize tx
      var tx = new _MoneroTxWallet["default"]();
      tx.setIsConfirmed(true);
      tx.setIsRelayed(true);
      tx.setIsFailed(false); // initialize output

      var output = new _MoneroOutputWallet["default"]({
        tx: tx
      });

      for (var _i21 = 0, _Object$keys7 = Object.keys(rpcOutput); _i21 < _Object$keys7.length; _i21++) {
        var key = _Object$keys7[_i21];
        var val = rpcOutput[key];
        if (key === "amount") output.setAmount(BigInt(val));else if (key === "spent") output.setIsSpent(val);else if (key === "key_image") {
          if ("" !== val) output.setKeyImage(new _MoneroKeyImage["default"](val));
        } else if (key === "global_index") output.setIndex(val);else if (key === "tx_hash") tx.setHash(val);else if (key === "unlocked") tx.setIsLocked(!val);else if (key === "frozen") output.setIsFrozen(val);else if (key === "pubkey") output.setStealthPublicKey(val);else if (key === "subaddr_index") {
          output.setAccountIndex(val.major);
          output.setSubaddressIndex(val.minor);
        } else if (key === "block_height") tx.setBlock(new _MoneroBlock["default"]().setHeight(val).setTxs([tx]));else console.log("WARNING: ignoring unexpected transaction field: " + key + ": " + val);
      } // initialize tx with output


      tx.setOutputs([output]);
      return tx;
    }
  }, {
    key: "_convertRpcDescribeTransfer",
    value: function _convertRpcDescribeTransfer(rpcDescribeTransferResult) {
      var txSet = new _MoneroTxSet["default"]();

      for (var _i22 = 0, _Object$keys8 = Object.keys(rpcDescribeTransferResult); _i22 < _Object$keys8.length; _i22++) {
        var key = _Object$keys8[_i22];
        var val = rpcDescribeTransferResult[key];

        if (key === "desc") {
          txSet.setTxs([]);

          var _iterator51 = _createForOfIteratorHelper(val),
              _step51;

          try {
            for (_iterator51.s(); !(_step51 = _iterator51.n()).done;) {
              var txMap = _step51.value;

              var tx = MoneroWalletRpc._convertRpcTxWithTransfer(txMap, undefined, true);

              tx.setTxSet(txSet);
              txSet.getTxs().push(tx);
            }
          } catch (err) {
            _iterator51.e(err);
          } finally {
            _iterator51.f();
          }
        } else if (key === "summary") {} // TODO: support tx set summary fields?
        else console.log("WARNING: ignoring unexpected descdribe transfer field: " + key + ": " + val);
      }

      return txSet;
    }
    /**
     * Decodes a "type" from monero-wallet-rpc to initialize type and state
     * fields in the given transaction.
     * 
     * TODO: these should be safe set
     * 
     * @param rpcType is the type to decode
     * @param tx is the transaction to decode known fields to
     * @return {boolean} true if the rpc type indicates outgoing xor incoming
     */

  }, {
    key: "_decodeRpcType",
    value: function _decodeRpcType(rpcType, tx) {
      var isOutgoing;

      if (rpcType === "in") {
        isOutgoing = false;
        tx.setIsConfirmed(true);
        tx.setInTxPool(false);
        tx.setIsRelayed(true);
        tx.setRelay(true);
        tx.setIsFailed(false);
        tx.setIsMinerTx(false);
      } else if (rpcType === "out") {
        isOutgoing = true;
        tx.setIsConfirmed(true);
        tx.setInTxPool(false);
        tx.setIsRelayed(true);
        tx.setRelay(true);
        tx.setIsFailed(false);
        tx.setIsMinerTx(false);
      } else if (rpcType === "pool") {
        isOutgoing = false;
        tx.setIsConfirmed(false);
        tx.setInTxPool(true);
        tx.setIsRelayed(true);
        tx.setRelay(true);
        tx.setIsFailed(false);
        tx.setIsMinerTx(false); // TODO: but could it be?
      } else if (rpcType === "pending") {
        isOutgoing = true;
        tx.setIsConfirmed(false);
        tx.setInTxPool(true);
        tx.setIsRelayed(true);
        tx.setRelay(true);
        tx.setIsFailed(false);
        tx.setIsMinerTx(false);
      } else if (rpcType === "block") {
        isOutgoing = false;
        tx.setIsConfirmed(true);
        tx.setInTxPool(false);
        tx.setIsRelayed(true);
        tx.setRelay(true);
        tx.setIsFailed(false);
        tx.setIsMinerTx(true);
      } else if (rpcType === "failed") {
        isOutgoing = true;
        tx.setIsConfirmed(false);
        tx.setInTxPool(false);
        tx.setIsRelayed(true);
        tx.setRelay(true);
        tx.setIsFailed(true);
        tx.setIsMinerTx(false);
      } else {
        throw new _MoneroError["default"]("Unrecognized transfer type: " + rpcType);
      }

      return isOutgoing;
    }
    /**
     * Merges a transaction into a unique set of transactions.
     *
     * @param {MoneroTxWallet} tx - the transaction to merge into the existing txs
     * @param {Object} txMap - maps tx hashes to txs
     * @param {Object} blockMap - maps block heights to blocks
     */

  }, {
    key: "_mergeTx",
    value: function _mergeTx(tx, txMap, blockMap) {
      (0, _assert["default"])(tx.getHash() !== undefined); // merge tx

      var aTx = txMap[tx.getHash()];
      if (aTx === undefined) txMap[tx.getHash()] = tx; // cache new tx
      else aTx.merge(tx); // merge with existing tx
      // merge tx's block if confirmed

      if (tx.getHeight() !== undefined) {
        var aBlock = blockMap[tx.getHeight()];
        if (aBlock === undefined) blockMap[tx.getHeight()] = tx.getBlock(); // cache new block
        else aBlock.merge(tx.getBlock()); // merge with existing block
      }
    }
    /**
     * Compares two transactions by their height.
     */

  }, {
    key: "_compareTxsByHeight",
    value: function _compareTxsByHeight(tx1, tx2) {
      if (tx1.getHeight() === undefined && tx2.getHeight() === undefined) return 0; // both unconfirmed
      else if (tx1.getHeight() === undefined) return 1; // tx1 is unconfirmed
      else if (tx2.getHeight() === undefined) return -1; // tx2 is unconfirmed

      var diff = tx1.getHeight() - tx2.getHeight();
      if (diff !== 0) return diff;
      return tx1.getBlock().getTxs().indexOf(tx1) - tx2.getBlock().getTxs().indexOf(tx2); // txs are in the same block so retain their original order
    }
    /**
     * Compares two transfers by ascending account and subaddress indices.
     */

  }, {
    key: "_compareIncomingTransfers",
    value: function _compareIncomingTransfers(t1, t2) {
      if (t1.getAccountIndex() < t2.getAccountIndex()) return -1;else if (t1.getAccountIndex() === t2.getAccountIndex()) return t1.getSubaddressIndex() - t2.getSubaddressIndex();
      return 1;
    }
    /**
     * Compares two outputs by ascending account and subaddress indices.
     */

  }, {
    key: "_compareOutputs",
    value: function _compareOutputs(o1, o2) {
      // compare by height
      var heightComparison = MoneroWalletRpc._compareTxsByHeight(o1.getTx(), o2.getTx());

      if (heightComparison !== 0) return heightComparison; // compare by account index, subaddress index, output index, then key image hex

      var compare = o1.getAccountIndex() - o2.getAccountIndex();
      if (compare !== 0) return compare;
      compare = o1.getSubaddressIndex() - o2.getSubaddressIndex();
      if (compare !== 0) return compare;
      compare = o1.getIndex() - o2.getIndex();
      if (compare !== 0) return compare;
      return o1.getKeyImage().getHex().localeCompare(o2.getKeyImage().getHex());
    }
  }]);
  return MoneroWalletRpc;
}(_MoneroWallet2["default"]);
/**
 * Polls monero-wallet-rpc to provide listener notifications.
 * 
 * @class
 * @ignore
 */


var WalletPoller = /*#__PURE__*/function () {
  function WalletPoller(wallet) {
    (0, _classCallCheck2["default"])(this, WalletPoller);
    var that = this;
    this._wallet = wallet;
    this._looper = new _TaskLooper["default"]( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee120() {
      return _regenerator["default"].wrap(function _callee120$(_context120) {
        while (1) {
          switch (_context120.prev = _context120.next) {
            case 0:
              _context120.next = 2;
              return that.poll();

            case 2:
            case "end":
              return _context120.stop();
          }
        }
      }, _callee120);
    })));
    this._prevLockedTxs = [];
    this._prevUnconfirmedNotifications = new Set(); // tx hashes of previous notifications

    this._prevConfirmedNotifications = new Set(); // tx hashes of previously confirmed but not yet unlocked notifications

    this._threadPool = new _ThreadPool["default"](1); // synchronize polls

    this._numPolling = 0;
  }

  (0, _createClass2["default"])(WalletPoller, [{
    key: "setIsPolling",
    value: function setIsPolling(isPolling) {
      this._isPolling = isPolling;
      if (isPolling) this._looper.start(this._wallet.syncPeriodInMs);else this._looper.stop();
    }
  }, {
    key: "setPeriodInMs",
    value: function setPeriodInMs(periodInMs) {
      this._looper.setPeriodInMs(periodInMs);
    }
  }, {
    key: "poll",
    value: function () {
      var _poll3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee122() {
        var that;
        return _regenerator["default"].wrap(function _callee122$(_context122) {
          while (1) {
            switch (_context122.prev = _context122.next) {
              case 0:
                // synchronize polls
                that = this;
                return _context122.abrupt("return", this._threadPool.submit( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee121() {
                  var height, i, minHeight, lockedTxs, noLongerLockedHashes, _iterator52, _step52, prevLockedTx, unlockedTxs, _iterator53, _step53, lockedTx, searchSet, unannounced, _iterator54, _step54, unlockedTx;

                  return _regenerator["default"].wrap(function _callee121$(_context121) {
                    while (1) {
                      switch (_context121.prev = _context121.next) {
                        case 0:
                          _context121.prev = 0;

                          if (!(that._numPolling > 1)) {
                            _context121.next = 3;
                            break;
                          }

                          return _context121.abrupt("return");

                        case 3:
                          that._numPolling++; // skip if wallet is closed

                          _context121.next = 6;
                          return that._wallet.isClosed();

                        case 6:
                          if (!_context121.sent) {
                            _context121.next = 8;
                            break;
                          }

                          return _context121.abrupt("return");

                        case 8:
                          if (!(that._prevHeight === undefined)) {
                            _context121.next = 20;
                            break;
                          }

                          _context121.next = 11;
                          return that._wallet.getHeight();

                        case 11:
                          that._prevHeight = _context121.sent;
                          _context121.next = 14;
                          return that._wallet.getTxs(new _MoneroTxQuery["default"]().setIsLocked(true));

                        case 14:
                          that._prevLockedTxs = _context121.sent;
                          _context121.next = 17;
                          return that._wallet._getBalances();

                        case 17:
                          that._prevBalances = _context121.sent;
                          that._numPolling--;
                          return _context121.abrupt("return");

                        case 20:
                          _context121.next = 22;
                          return that._wallet.getHeight();

                        case 22:
                          height = _context121.sent;

                          if (!(that._prevHeight !== height)) {
                            _context121.next = 32;
                            break;
                          }

                          i = that._prevHeight;

                        case 25:
                          if (!(i < height)) {
                            _context121.next = 31;
                            break;
                          }

                          _context121.next = 28;
                          return that._onNewBlock(i);

                        case 28:
                          i++;
                          _context121.next = 25;
                          break;

                        case 31:
                          that._prevHeight = height;

                        case 32:
                          // get locked txs for comparison to previous
                          minHeight = Math.max(0, height - 70); // only monitor recent txs

                          _context121.next = 35;
                          return that._wallet.getTxs(new _MoneroTxQuery["default"]().setIsLocked(true).setMinHeight(minHeight).setIncludeOutputs(true));

                        case 35:
                          lockedTxs = _context121.sent;
                          // collect hashes of txs no longer locked
                          noLongerLockedHashes = [];
                          _iterator52 = _createForOfIteratorHelper(that._prevLockedTxs);

                          try {
                            for (_iterator52.s(); !(_step52 = _iterator52.n()).done;) {
                              prevLockedTx = _step52.value;

                              if (that._getTx(lockedTxs, prevLockedTx.getHash()) === undefined) {
                                noLongerLockedHashes.push(prevLockedTx.getHash());
                              }
                            } // save locked txs for next comparison

                          } catch (err) {
                            _iterator52.e(err);
                          } finally {
                            _iterator52.f();
                          }

                          that._prevLockedTxs = lockedTxs; // fetch txs which are no longer locked

                          if (!(noLongerLockedHashes.length === 0)) {
                            _context121.next = 44;
                            break;
                          }

                          _context121.t0 = [];
                          _context121.next = 47;
                          break;

                        case 44:
                          _context121.next = 46;
                          return that._wallet.getTxs(new _MoneroTxQuery["default"]().setIsLocked(false).setMinHeight(minHeight).setHashes(noLongerLockedHashes).setIncludeOutputs(true), []);

                        case 46:
                          _context121.t0 = _context121.sent;

                        case 47:
                          unlockedTxs = _context121.t0;
                          // ignore missing tx hashes which could be removed due to re-org
                          // announce new unconfirmed and confirmed outputs
                          _iterator53 = _createForOfIteratorHelper(lockedTxs);
                          _context121.prev = 49;

                          _iterator53.s();

                        case 51:
                          if ((_step53 = _iterator53.n()).done) {
                            _context121.next = 61;
                            break;
                          }

                          lockedTx = _step53.value;
                          searchSet = lockedTx.isConfirmed() ? that._prevConfirmedNotifications : that._prevUnconfirmedNotifications;
                          unannounced = !searchSet.has(lockedTx.getHash());
                          searchSet.add(lockedTx.getHash());

                          if (!unannounced) {
                            _context121.next = 59;
                            break;
                          }

                          _context121.next = 59;
                          return that._notifyOutputs(lockedTx);

                        case 59:
                          _context121.next = 51;
                          break;

                        case 61:
                          _context121.next = 66;
                          break;

                        case 63:
                          _context121.prev = 63;
                          _context121.t1 = _context121["catch"](49);

                          _iterator53.e(_context121.t1);

                        case 66:
                          _context121.prev = 66;

                          _iterator53.f();

                          return _context121.finish(66);

                        case 69:
                          // announce new unlocked outputs
                          _iterator54 = _createForOfIteratorHelper(unlockedTxs);
                          _context121.prev = 70;

                          _iterator54.s();

                        case 72:
                          if ((_step54 = _iterator54.n()).done) {
                            _context121.next = 80;
                            break;
                          }

                          unlockedTx = _step54.value;

                          that._prevUnconfirmedNotifications["delete"](unlockedTx.getHash());

                          that._prevConfirmedNotifications["delete"](unlockedTx.getHash());

                          _context121.next = 78;
                          return that._notifyOutputs(unlockedTx);

                        case 78:
                          _context121.next = 72;
                          break;

                        case 80:
                          _context121.next = 85;
                          break;

                        case 82:
                          _context121.prev = 82;
                          _context121.t2 = _context121["catch"](70);

                          _iterator54.e(_context121.t2);

                        case 85:
                          _context121.prev = 85;

                          _iterator54.f();

                          return _context121.finish(85);

                        case 88:
                          _context121.next = 90;
                          return that._checkForChangedBalances();

                        case 90:
                          that._numPolling--;
                          _context121.next = 103;
                          break;

                        case 93:
                          _context121.prev = 93;
                          _context121.t3 = _context121["catch"](0);
                          that._numPolling--;
                          _context121.t4 = console;
                          _context121.next = 99;
                          return that._wallet.getPath();

                        case 99:
                          _context121.t5 = _context121.sent;
                          _context121.t6 = "Failed to background poll " + _context121.t5;

                          _context121.t4.error.call(_context121.t4, _context121.t6);

                          console.error(_context121.t3);

                        case 103:
                        case "end":
                          return _context121.stop();
                      }
                    }
                  }, _callee121, null, [[0, 93], [49, 63, 66, 69], [70, 82, 85, 88]]);
                }))));

              case 2:
              case "end":
                return _context122.stop();
            }
          }
        }, _callee122, this);
      }));

      function poll() {
        return _poll3.apply(this, arguments);
      }

      return poll;
    }()
  }, {
    key: "_onNewBlock",
    value: function () {
      var _onNewBlock2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee123(height) {
        var _iterator55, _step55, listener;

        return _regenerator["default"].wrap(function _callee123$(_context123) {
          while (1) {
            switch (_context123.prev = _context123.next) {
              case 0:
                _iterator55 = _createForOfIteratorHelper(this._wallet.getListeners());
                _context123.prev = 1;

                _iterator55.s();

              case 3:
                if ((_step55 = _iterator55.n()).done) {
                  _context123.next = 9;
                  break;
                }

                listener = _step55.value;
                _context123.next = 7;
                return listener.onNewBlock(height);

              case 7:
                _context123.next = 3;
                break;

              case 9:
                _context123.next = 14;
                break;

              case 11:
                _context123.prev = 11;
                _context123.t0 = _context123["catch"](1);

                _iterator55.e(_context123.t0);

              case 14:
                _context123.prev = 14;

                _iterator55.f();

                return _context123.finish(14);

              case 17:
              case "end":
                return _context123.stop();
            }
          }
        }, _callee123, this, [[1, 11, 14, 17]]);
      }));

      function _onNewBlock(_x157) {
        return _onNewBlock2.apply(this, arguments);
      }

      return _onNewBlock;
    }()
  }, {
    key: "_notifyOutputs",
    value: function () {
      var _notifyOutputs2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee124(tx) {
        var output, _iterator56, _step56, listener, _iterator57, _step57, _output, _iterator58, _step58, _listener, outputs, _iterator59, _step59, transfer, _iterator60, _step60, _listener2, _iterator61, _step61, _output2;

        return _regenerator["default"].wrap(function _callee124$(_context124) {
          while (1) {
            switch (_context124.prev = _context124.next) {
              case 0:
                if (!(tx.getOutgoingTransfer() !== undefined)) {
                  _context124.next = 21;
                  break;
                }

                (0, _assert["default"])(tx.getInputs() === undefined);
                output = new _MoneroOutputWallet["default"]().setAmount(tx.getOutgoingTransfer().getAmount() + tx.getFee()).setAccountIndex(tx.getOutgoingTransfer().getAccountIndex()).setSubaddressIndex(tx.getOutgoingTransfer().getSubaddressIndices().length === 1 ? tx.getOutgoingTransfer().getSubaddressIndices()[0] : undefined) // initialize if transfer sourced from single subaddress
                .setTx(tx);
                tx.setInputs([output]);
                _iterator56 = _createForOfIteratorHelper(this._wallet.getListeners());
                _context124.prev = 5;

                _iterator56.s();

              case 7:
                if ((_step56 = _iterator56.n()).done) {
                  _context124.next = 13;
                  break;
                }

                listener = _step56.value;
                _context124.next = 11;
                return listener.onOutputSpent(output);

              case 11:
                _context124.next = 7;
                break;

              case 13:
                _context124.next = 18;
                break;

              case 15:
                _context124.prev = 15;
                _context124.t0 = _context124["catch"](5);

                _iterator56.e(_context124.t0);

              case 18:
                _context124.prev = 18;

                _iterator56.f();

                return _context124.finish(18);

              case 21:
                if (!(tx.getIncomingTransfers() !== undefined)) {
                  _context124.next = 93;
                  break;
                }

                if (!(tx.getOutputs() !== undefined && tx.getOutputs().length > 0)) {
                  _context124.next = 57;
                  break;
                }

                // TODO (monero-project): outputs only returned for confirmed txs
                _iterator57 = _createForOfIteratorHelper(tx.getOutputs());
                _context124.prev = 24;

                _iterator57.s();

              case 26:
                if ((_step57 = _iterator57.n()).done) {
                  _context124.next = 47;
                  break;
                }

                _output = _step57.value;
                _iterator58 = _createForOfIteratorHelper(this._wallet.getListeners());
                _context124.prev = 29;

                _iterator58.s();

              case 31:
                if ((_step58 = _iterator58.n()).done) {
                  _context124.next = 37;
                  break;
                }

                _listener = _step58.value;
                _context124.next = 35;
                return _listener.onOutputReceived(_output);

              case 35:
                _context124.next = 31;
                break;

              case 37:
                _context124.next = 42;
                break;

              case 39:
                _context124.prev = 39;
                _context124.t1 = _context124["catch"](29);

                _iterator58.e(_context124.t1);

              case 42:
                _context124.prev = 42;

                _iterator58.f();

                return _context124.finish(42);

              case 45:
                _context124.next = 26;
                break;

              case 47:
                _context124.next = 52;
                break;

              case 49:
                _context124.prev = 49;
                _context124.t2 = _context124["catch"](24);

                _iterator57.e(_context124.t2);

              case 52:
                _context124.prev = 52;

                _iterator57.f();

                return _context124.finish(52);

              case 55:
                _context124.next = 93;
                break;

              case 57:
                // TODO (monero-project): monero-wallet-rpc does not allow scrape of unconfirmed received outputs so using incoming transfer values
                outputs = [];
                _iterator59 = _createForOfIteratorHelper(tx.getIncomingTransfers());

                try {
                  for (_iterator59.s(); !(_step59 = _iterator59.n()).done;) {
                    transfer = _step59.value;
                    outputs.push(new _MoneroOutputWallet["default"]().setAccountIndex(transfer.getAccountIndex()).setSubaddressIndex(transfer.getSubaddressIndex()).setAmount(transfer.getAmount()).setTx(tx));
                  }
                } catch (err) {
                  _iterator59.e(err);
                } finally {
                  _iterator59.f();
                }

                tx.setOutputs(outputs);
                _iterator60 = _createForOfIteratorHelper(this._wallet.getListeners());
                _context124.prev = 62;

                _iterator60.s();

              case 64:
                if ((_step60 = _iterator60.n()).done) {
                  _context124.next = 85;
                  break;
                }

                _listener2 = _step60.value;
                _iterator61 = _createForOfIteratorHelper(tx.getOutputs());
                _context124.prev = 67;

                _iterator61.s();

              case 69:
                if ((_step61 = _iterator61.n()).done) {
                  _context124.next = 75;
                  break;
                }

                _output2 = _step61.value;
                _context124.next = 73;
                return _listener2.onOutputReceived(_output2);

              case 73:
                _context124.next = 69;
                break;

              case 75:
                _context124.next = 80;
                break;

              case 77:
                _context124.prev = 77;
                _context124.t3 = _context124["catch"](67);

                _iterator61.e(_context124.t3);

              case 80:
                _context124.prev = 80;

                _iterator61.f();

                return _context124.finish(80);

              case 83:
                _context124.next = 64;
                break;

              case 85:
                _context124.next = 90;
                break;

              case 87:
                _context124.prev = 87;
                _context124.t4 = _context124["catch"](62);

                _iterator60.e(_context124.t4);

              case 90:
                _context124.prev = 90;

                _iterator60.f();

                return _context124.finish(90);

              case 93:
              case "end":
                return _context124.stop();
            }
          }
        }, _callee124, this, [[5, 15, 18, 21], [24, 49, 52, 55], [29, 39, 42, 45], [62, 87, 90, 93], [67, 77, 80, 83]]);
      }));

      function _notifyOutputs(_x158) {
        return _notifyOutputs2.apply(this, arguments);
      }

      return _notifyOutputs;
    }()
  }, {
    key: "_getTx",
    value: function _getTx(txs, txHash) {
      var _iterator62 = _createForOfIteratorHelper(txs),
          _step62;

      try {
        for (_iterator62.s(); !(_step62 = _iterator62.n()).done;) {
          var tx = _step62.value;
          if (txHash === tx.getHash()) return tx;
        }
      } catch (err) {
        _iterator62.e(err);
      } finally {
        _iterator62.f();
      }

      return undefined;
    }
  }, {
    key: "_checkForChangedBalances",
    value: function () {
      var _checkForChangedBalances2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee125() {
        var balances, _iterator63, _step63, listener;

        return _regenerator["default"].wrap(function _callee125$(_context125) {
          while (1) {
            switch (_context125.prev = _context125.next) {
              case 0:
                _context125.next = 2;
                return this._wallet._getBalances();

              case 2:
                balances = _context125.sent;

                if (!(_GenUtils["default"].compareBigInt(balances[0], this._prevBalances[0]) !== 0 || _GenUtils["default"].compareBigInt(balances[1], this._prevBalances[1]) !== 0)) {
                  _context125.next = 27;
                  break;
                }

                this._prevBalances = balances;
                _context125.t0 = _createForOfIteratorHelper;
                _context125.next = 8;
                return this._wallet.getListeners();

              case 8:
                _context125.t1 = _context125.sent;
                _iterator63 = (0, _context125.t0)(_context125.t1);
                _context125.prev = 10;

                _iterator63.s();

              case 12:
                if ((_step63 = _iterator63.n()).done) {
                  _context125.next = 18;
                  break;
                }

                listener = _step63.value;
                _context125.next = 16;
                return listener.onBalancesChanged(balances[0], balances[1]);

              case 16:
                _context125.next = 12;
                break;

              case 18:
                _context125.next = 23;
                break;

              case 20:
                _context125.prev = 20;
                _context125.t2 = _context125["catch"](10);

                _iterator63.e(_context125.t2);

              case 23:
                _context125.prev = 23;

                _iterator63.f();

                return _context125.finish(23);

              case 26:
                return _context125.abrupt("return", true);

              case 27:
                return _context125.abrupt("return", false);

              case 28:
              case "end":
                return _context125.stop();
            }
          }
        }, _callee125, this, [[10, 20, 23, 26]]);
      }));

      function _checkForChangedBalances() {
        return _checkForChangedBalances2.apply(this, arguments);
      }

      return _checkForChangedBalances;
    }()
  }]);
  return WalletPoller;
}();

MoneroWalletRpc.DEFAULT_SYNC_PERIOD_IN_MS = 20000; // default period between syncs in ms (defined by DEFAULT_AUTO_REFRESH_PERIOD in wallet_rpc_server.cpp)

var _default = MoneroWalletRpc;
exports["default"] = _default;