"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _assert = _interopRequireDefault(require("assert"));

var _path = _interopRequireDefault(require("path"));

var _GenUtils = _interopRequireDefault(require("../common/GenUtils"));

var _LibraryUtils = _interopRequireDefault(require("../common/LibraryUtils"));

var _TaskLooper = _interopRequireDefault(require("../common/TaskLooper"));

var _MoneroAccount = _interopRequireDefault(require("./model/MoneroAccount"));

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

var _MoneroWallet2 = _interopRequireDefault(require("./MoneroWallet"));

var _MoneroWalletConfig = _interopRequireDefault(require("./model/MoneroWalletConfig"));

var _MoneroWalletKeys2 = _interopRequireDefault(require("./MoneroWalletKeys"));

var _MoneroWalletListener = _interopRequireDefault(require("./model/MoneroWalletListener"));

var _MoneroMessageSignatureType = _interopRequireDefault(require("./model/MoneroMessageSignatureType"));

var _MoneroMessageSignatureResult = _interopRequireDefault(require("./model/MoneroMessageSignatureResult"));

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * Implements a Monero wallet using fully client-side WebAssembly bindings to monero-project's wallet2 in C++.
 * 
 * @extends {MoneroWalletKeys}
 * @implements {MoneroWallet}
 * @hideconstructor
 */
var MoneroWalletFull = /*#__PURE__*/function (_MoneroWalletKeys) {
  (0, _inherits2["default"])(MoneroWalletFull, _MoneroWalletKeys);

  var _super = _createSuper(MoneroWalletFull);

  // --------------------------- INSTANCE METHODS -----------------------------

  /**
   * Internal constructor which is given the memory address of a C++ wallet
   * instance.
   * 
   * This method should not be called externally but should be called through
   * static wallet creation utilities in this class.
   * 
   * @param {number} cppAddress - address of the wallet instance in C++
   * @param {string} path - path of the wallet instance
   * @param {string} password - password of the wallet instance
   * @param {FileSystem} fs - node.js-compatible file system to read/write wallet files
   * @param {boolean} rejectUnauthorized - specifies if unauthorized requests (e.g. self-signed certificates) should be rejected
   * @param {string} rejectUnauthorizedFnId - unique identifier for http_client_wasm to query rejectUnauthorized
   */
  function MoneroWalletFull(cppAddress, path, password, fs, rejectUnauthorized, rejectUnauthorizedFnId) {
    var _this;

    (0, _classCallCheck2["default"])(this, MoneroWalletFull);
    _this = _super.call(this, cppAddress);
    _this._path = path;
    _this._password = password;
    _this._listeners = [];
    _this._fs = fs ? fs : path ? MoneroWalletFull._getFs() : undefined;
    _this._isClosed = false;
    _this._fullListener = new WalletFullListener((0, _assertThisInitialized2["default"])(_this)); // receives notifications from wasm c++

    _this._fullListenerHandle = 0; // memory address of the wallet listener in c++

    _this._rejectUnauthorized = rejectUnauthorized;
    _this._rejectUnauthorizedConfigId = rejectUnauthorizedFnId;
    _this._syncPeriodInMs = MoneroWalletFull.DEFAULT_SYNC_PERIOD_IN_MS;
    var that = (0, _assertThisInitialized2["default"])(_this);

    _LibraryUtils["default"].setRejectUnauthorizedFn(rejectUnauthorizedFnId, function () {
      return that._rejectUnauthorized;
    }); // register fn informing if unauthorized reqs should be rejected


    return _this;
  } // ------------ WALLET METHODS SPECIFIC TO WASM IMPLEMENTATION --------------

  /**
   * Get the maximum height of the peers the wallet's daemon is connected to.
   *
   * @return {number} the maximum height of the peers the wallet's daemon is connected to
   */


  (0, _createClass2["default"])(MoneroWalletFull, [{
    key: "getDaemonMaxPeerHeight",
    value: function () {
      var _getDaemonMaxPeerHeight = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
        var that;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                that = this;
                return _context2.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
                  return _regenerator["default"].wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context.abrupt("return", new Promise(function (resolve, reject) {
                            // define callback for wasm
                            var callbackFn = function callbackFn(resp) {
                              resolve(resp);
                            }; // call wasm and invoke callback when done


                            that._module.get_daemon_max_peer_height(that._cppAddress, callbackFn);
                          }));

                        case 2:
                        case "end":
                          return _context.stop();
                      }
                    }
                  }, _callee);
                }))));

              case 2:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function getDaemonMaxPeerHeight() {
        return _getDaemonMaxPeerHeight.apply(this, arguments);
      }

      return getDaemonMaxPeerHeight;
    }()
    /**
     * Indicates if the wallet's daemon is synced with the network.
     * 
     * @return {boolean} true if the daemon is synced with the network, false otherwise
     */

  }, {
    key: "isDaemonSynced",
    value: function () {
      var _isDaemonSynced = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4() {
        var that;
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                that = this;
                return _context4.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3() {
                  return _regenerator["default"].wrap(function _callee3$(_context3) {
                    while (1) {
                      switch (_context3.prev = _context3.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context3.abrupt("return", new Promise(function (resolve, reject) {
                            // define callback for wasm
                            var callbackFn = function callbackFn(resp) {
                              resolve(resp);
                            }; // call wasm and invoke callback when done


                            that._module.is_daemon_synced(that._cppAddress, callbackFn);
                          }));

                        case 2:
                        case "end":
                          return _context3.stop();
                      }
                    }
                  }, _callee3);
                }))));

              case 2:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function isDaemonSynced() {
        return _isDaemonSynced.apply(this, arguments);
      }

      return isDaemonSynced;
    }()
    /**
     * Indicates if the wallet is synced with the daemon.
     * 
     * @return {boolean} true if the wallet is synced with the daemon, false otherwise
     */

  }, {
    key: "isSynced",
    value: function () {
      var _isSynced = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6() {
        var that;
        return _regenerator["default"].wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                that = this;
                return _context6.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5() {
                  return _regenerator["default"].wrap(function _callee5$(_context5) {
                    while (1) {
                      switch (_context5.prev = _context5.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context5.abrupt("return", new Promise(function (resolve, reject) {
                            // define callback for wasm
                            var callbackFn = function callbackFn(resp) {
                              resolve(resp);
                            }; // call wasm and invoke callback when done


                            that._module.is_synced(that._cppAddress, callbackFn);
                          }));

                        case 2:
                        case "end":
                          return _context5.stop();
                      }
                    }
                  }, _callee5);
                }))));

              case 2:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function isSynced() {
        return _isSynced.apply(this, arguments);
      }

      return isSynced;
    }()
    /**
     * Get the wallet's network type (mainnet, testnet, or stagenet).
     * 
     * @return {MoneroNetworkType} the wallet's network type
     */

  }, {
    key: "getNetworkType",
    value: function () {
      var _getNetworkType = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee8() {
        var that;
        return _regenerator["default"].wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                that = this;
                return _context8.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7() {
                  return _regenerator["default"].wrap(function _callee7$(_context7) {
                    while (1) {
                      switch (_context7.prev = _context7.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context7.abrupt("return", that._module.get_network_type(that._cppAddress));

                        case 2:
                        case "end":
                          return _context7.stop();
                      }
                    }
                  }, _callee7);
                }))));

              case 2:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function getNetworkType() {
        return _getNetworkType.apply(this, arguments);
      }

      return getNetworkType;
    }()
    /**
     * Get the height of the first block that the wallet scans.
     * 
     * @return {number} the height of the first block that the wallet scans
     */

  }, {
    key: "getSyncHeight",
    value: function () {
      var _getSyncHeight = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee10() {
        var that;
        return _regenerator["default"].wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                that = this;
                return _context10.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee9() {
                  return _regenerator["default"].wrap(function _callee9$(_context9) {
                    while (1) {
                      switch (_context9.prev = _context9.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context9.abrupt("return", that._module.get_sync_height(that._cppAddress));

                        case 2:
                        case "end":
                          return _context9.stop();
                      }
                    }
                  }, _callee9);
                }))));

              case 2:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function getSyncHeight() {
        return _getSyncHeight.apply(this, arguments);
      }

      return getSyncHeight;
    }()
    /**
     * Set the height of the first block that the wallet scans.
     * 
     * @param {number} syncHeight - height of the first block that the wallet scans
     */

  }, {
    key: "setSyncHeight",
    value: function () {
      var _setSyncHeight = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee12(syncHeight) {
        var that;
        return _regenerator["default"].wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                that = this;
                return _context12.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee11() {
                  return _regenerator["default"].wrap(function _callee11$(_context11) {
                    while (1) {
                      switch (_context11.prev = _context11.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context11.abrupt("return", that._module.set_sync_height(that._cppAddress, syncHeight));

                        case 2:
                        case "end":
                          return _context11.stop();
                      }
                    }
                  }, _callee11);
                }))));

              case 2:
              case "end":
                return _context12.stop();
            }
          }
        }, _callee12, this);
      }));

      function setSyncHeight(_x) {
        return _setSyncHeight.apply(this, arguments);
      }

      return setSyncHeight;
    }()
    /**
     * Move the wallet from its current path to the given path.
     * 
     * @param {string} path - the wallet's destination path
     */

  }, {
    key: "moveTo",
    value: function () {
      var _moveTo2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee13(path) {
        return _regenerator["default"].wrap(function _callee13$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                return _context13.abrupt("return", MoneroWalletFull._moveTo(path, this));

              case 1:
              case "end":
                return _context13.stop();
            }
          }
        }, _callee13, this);
      }));

      function moveTo(_x2) {
        return _moveTo2.apply(this, arguments);
      }

      return moveTo;
    }() // -------------------------- COMMON WALLET METHODS -------------------------

  }, {
    key: "addListener",
    value: function () {
      var _addListener = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee14(listener) {
        return _regenerator["default"].wrap(function _callee14$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                this._assertNotClosed();

                (0, _assert["default"])(listener instanceof _MoneroWalletListener["default"], "Listener must be instance of MoneroWalletListener");

                this._listeners.push(listener);

                _context14.next = 5;
                return this._refreshListening();

              case 5:
              case "end":
                return _context14.stop();
            }
          }
        }, _callee14, this);
      }));

      function addListener(_x3) {
        return _addListener.apply(this, arguments);
      }

      return addListener;
    }()
  }, {
    key: "removeListener",
    value: function () {
      var _removeListener = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee15(listener) {
        var idx;
        return _regenerator["default"].wrap(function _callee15$(_context15) {
          while (1) {
            switch (_context15.prev = _context15.next) {
              case 0:
                this._assertNotClosed();

                idx = this._listeners.indexOf(listener);

                if (!(idx > -1)) {
                  _context15.next = 6;
                  break;
                }

                this._listeners.splice(idx, 1);

                _context15.next = 7;
                break;

              case 6:
                throw new _MoneroError["default"]("Listener is not registered with wallet");

              case 7:
                _context15.next = 9;
                return this._refreshListening();

              case 9:
              case "end":
                return _context15.stop();
            }
          }
        }, _callee15, this);
      }));

      function removeListener(_x4) {
        return _removeListener.apply(this, arguments);
      }

      return removeListener;
    }()
  }, {
    key: "getListeners",
    value: function getListeners() {
      this._assertNotClosed();

      return this._listeners;
    }
  }, {
    key: "setDaemonConnection",
    value: function () {
      var _setDaemonConnection = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee17(uriOrRpcConnection) {
        var connection, uri, username, password, rejectUnauthorized, that;
        return _regenerator["default"].wrap(function _callee17$(_context17) {
          while (1) {
            switch (_context17.prev = _context17.next) {
              case 0:
                this._assertNotClosed(); // normalize connection


                connection = !uriOrRpcConnection ? undefined : uriOrRpcConnection instanceof _MoneroRpcConnection["default"] ? uriOrRpcConnection : new _MoneroRpcConnection["default"](uriOrRpcConnection);
                uri = connection && connection.getUri() ? connection.getUri() : "";
                username = connection && connection.getUsername() ? connection.getUsername() : "";
                password = connection && connection.getPassword() ? connection.getPassword() : "";
                rejectUnauthorized = connection ? connection.getRejectUnauthorized() : undefined;
                this._rejectUnauthorized = rejectUnauthorized; // persist locally
                // set connection in queue

                that = this;
                return _context17.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee16() {
                  return _regenerator["default"].wrap(function _callee16$(_context16) {
                    while (1) {
                      switch (_context16.prev = _context16.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context16.abrupt("return", new Promise(function (resolve, reject) {
                            // define callback for wasm
                            var callbackFn = function callbackFn(resp) {
                              resolve();
                            }; // call wasm and invoke callback when done


                            that._module.set_daemon_connection(that._cppAddress, uri, username, password, callbackFn);
                          }));

                        case 2:
                        case "end":
                          return _context16.stop();
                      }
                    }
                  }, _callee16);
                }))));

              case 9:
              case "end":
                return _context17.stop();
            }
          }
        }, _callee17, this);
      }));

      function setDaemonConnection(_x5) {
        return _setDaemonConnection.apply(this, arguments);
      }

      return setDaemonConnection;
    }()
  }, {
    key: "getDaemonConnection",
    value: function () {
      var _getDaemonConnection = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee19() {
        var that;
        return _regenerator["default"].wrap(function _callee19$(_context19) {
          while (1) {
            switch (_context19.prev = _context19.next) {
              case 0:
                that = this;
                return _context19.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee18() {
                  return _regenerator["default"].wrap(function _callee18$(_context18) {
                    while (1) {
                      switch (_context18.prev = _context18.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context18.abrupt("return", new Promise(function (resolve, reject) {
                            var connectionContainerStr = that._module.get_daemon_connection(that._cppAddress);

                            if (!connectionContainerStr) resolve();else {
                              var jsonConnection = JSON.parse(connectionContainerStr);
                              resolve(new _MoneroRpcConnection["default"](jsonConnection.uri, jsonConnection.username, jsonConnection.password, that._rejectUnauthorized));
                            }
                          }));

                        case 2:
                        case "end":
                          return _context18.stop();
                      }
                    }
                  }, _callee18);
                }))));

              case 2:
              case "end":
                return _context19.stop();
            }
          }
        }, _callee19, this);
      }));

      function getDaemonConnection() {
        return _getDaemonConnection.apply(this, arguments);
      }

      return getDaemonConnection;
    }()
  }, {
    key: "isConnectedToDaemon",
    value: function () {
      var _isConnectedToDaemon = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee21() {
        var that;
        return _regenerator["default"].wrap(function _callee21$(_context21) {
          while (1) {
            switch (_context21.prev = _context21.next) {
              case 0:
                that = this;
                return _context21.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee20() {
                  return _regenerator["default"].wrap(function _callee20$(_context20) {
                    while (1) {
                      switch (_context20.prev = _context20.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context20.abrupt("return", new Promise(function (resolve, reject) {
                            // define callback for wasm
                            var callbackFn = function callbackFn(resp) {
                              resolve(resp);
                            }; // call wasm and invoke callback when done


                            that._module.is_connected_to_daemon(that._cppAddress, callbackFn);
                          }));

                        case 2:
                        case "end":
                          return _context20.stop();
                      }
                    }
                  }, _callee20);
                }))));

              case 2:
              case "end":
                return _context21.stop();
            }
          }
        }, _callee21, this);
      }));

      function isConnectedToDaemon() {
        return _isConnectedToDaemon.apply(this, arguments);
      }

      return isConnectedToDaemon;
    }()
  }, {
    key: "getVersion",
    value: function () {
      var _getVersion = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee22() {
        return _regenerator["default"].wrap(function _callee22$(_context22) {
          while (1) {
            switch (_context22.prev = _context22.next) {
              case 0:
                this._assertNotClosed();

                throw new _MoneroError["default"]("Not implemented");

              case 2:
              case "end":
                return _context22.stop();
            }
          }
        }, _callee22, this);
      }));

      function getVersion() {
        return _getVersion.apply(this, arguments);
      }

      return getVersion;
    }()
  }, {
    key: "getPath",
    value: function () {
      var _getPath = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee23() {
        return _regenerator["default"].wrap(function _callee23$(_context23) {
          while (1) {
            switch (_context23.prev = _context23.next) {
              case 0:
                this._assertNotClosed();

                return _context23.abrupt("return", this._path);

              case 2:
              case "end":
                return _context23.stop();
            }
          }
        }, _callee23, this);
      }));

      function getPath() {
        return _getPath.apply(this, arguments);
      }

      return getPath;
    }()
  }, {
    key: "getIntegratedAddress",
    value: function () {
      var _getIntegratedAddress = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee25(standardAddress, paymentId) {
        var that;
        return _regenerator["default"].wrap(function _callee25$(_context25) {
          while (1) {
            switch (_context25.prev = _context25.next) {
              case 0:
                that = this;
                return _context25.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee24() {
                  var result;
                  return _regenerator["default"].wrap(function _callee24$(_context24) {
                    while (1) {
                      switch (_context24.prev = _context24.next) {
                        case 0:
                          that._assertNotClosed();

                          _context24.prev = 1;
                          result = that._module.get_integrated_address(that._cppAddress, standardAddress ? standardAddress : "", paymentId ? paymentId : "");

                          if (!(result.charAt(0) !== "{")) {
                            _context24.next = 5;
                            break;
                          }

                          throw new _MoneroError["default"](result);

                        case 5:
                          return _context24.abrupt("return", new _MoneroIntegratedAddress["default"](JSON.parse(result)));

                        case 8:
                          _context24.prev = 8;
                          _context24.t0 = _context24["catch"](1);

                          if (!_context24.t0.message.includes("Invalid payment ID")) {
                            _context24.next = 12;
                            break;
                          }

                          throw new _MoneroError["default"]("Invalid payment ID: " + paymentId);

                        case 12:
                          throw new _MoneroError["default"](_context24.t0.message);

                        case 13:
                        case "end":
                          return _context24.stop();
                      }
                    }
                  }, _callee24, null, [[1, 8]]);
                }))));

              case 2:
              case "end":
                return _context25.stop();
            }
          }
        }, _callee25, this);
      }));

      function getIntegratedAddress(_x6, _x7) {
        return _getIntegratedAddress.apply(this, arguments);
      }

      return getIntegratedAddress;
    }()
  }, {
    key: "decodeIntegratedAddress",
    value: function () {
      var _decodeIntegratedAddress = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee27(integratedAddress) {
        var that;
        return _regenerator["default"].wrap(function _callee27$(_context27) {
          while (1) {
            switch (_context27.prev = _context27.next) {
              case 0:
                that = this;
                return _context27.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee26() {
                  var result;
                  return _regenerator["default"].wrap(function _callee26$(_context26) {
                    while (1) {
                      switch (_context26.prev = _context26.next) {
                        case 0:
                          that._assertNotClosed();

                          _context26.prev = 1;
                          result = that._module.decode_integrated_address(that._cppAddress, integratedAddress);

                          if (!(result.charAt(0) !== "{")) {
                            _context26.next = 5;
                            break;
                          }

                          throw new _MoneroError["default"](result);

                        case 5:
                          return _context26.abrupt("return", new _MoneroIntegratedAddress["default"](JSON.parse(result)));

                        case 8:
                          _context26.prev = 8;
                          _context26.t0 = _context26["catch"](1);
                          throw new _MoneroError["default"](_context26.t0.message);

                        case 11:
                        case "end":
                          return _context26.stop();
                      }
                    }
                  }, _callee26, null, [[1, 8]]);
                }))));

              case 2:
              case "end":
                return _context27.stop();
            }
          }
        }, _callee27, this);
      }));

      function decodeIntegratedAddress(_x8) {
        return _decodeIntegratedAddress.apply(this, arguments);
      }

      return decodeIntegratedAddress;
    }()
  }, {
    key: "getHeight",
    value: function () {
      var _getHeight = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee29() {
        var that;
        return _regenerator["default"].wrap(function _callee29$(_context29) {
          while (1) {
            switch (_context29.prev = _context29.next) {
              case 0:
                that = this;
                return _context29.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee28() {
                  return _regenerator["default"].wrap(function _callee28$(_context28) {
                    while (1) {
                      switch (_context28.prev = _context28.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context28.abrupt("return", new Promise(function (resolve, reject) {
                            // define callback for wasm
                            var callbackFn = function callbackFn(resp) {
                              resolve(resp);
                            }; // call wasm and invoke callback when done


                            that._module.get_height(that._cppAddress, callbackFn);
                          }));

                        case 2:
                        case "end":
                          return _context28.stop();
                      }
                    }
                  }, _callee28);
                }))));

              case 2:
              case "end":
                return _context29.stop();
            }
          }
        }, _callee29, this);
      }));

      function getHeight() {
        return _getHeight.apply(this, arguments);
      }

      return getHeight;
    }()
  }, {
    key: "getDaemonHeight",
    value: function () {
      var _getDaemonHeight = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee31() {
        var that;
        return _regenerator["default"].wrap(function _callee31$(_context31) {
          while (1) {
            switch (_context31.prev = _context31.next) {
              case 0:
                this._assertNotClosed();

                _context31.next = 3;
                return this.isConnectedToDaemon();

              case 3:
                if (_context31.sent) {
                  _context31.next = 5;
                  break;
                }

                throw new _MoneroError["default"]("Wallet is not connected to daemon");

              case 5:
                // schedule task
                that = this;
                return _context31.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee30() {
                  return _regenerator["default"].wrap(function _callee30$(_context30) {
                    while (1) {
                      switch (_context30.prev = _context30.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context30.abrupt("return", new Promise(function (resolve, reject) {
                            // define callback for wasm
                            var callbackFn = function callbackFn(resp) {
                              resolve(resp);
                            }; // call wasm and invoke callback when done


                            that._module.get_daemon_height(that._cppAddress, callbackFn);
                          }));

                        case 2:
                        case "end":
                          return _context30.stop();
                      }
                    }
                  }, _callee30);
                }))));

              case 7:
              case "end":
                return _context31.stop();
            }
          }
        }, _callee31, this);
      }));

      function getDaemonHeight() {
        return _getDaemonHeight.apply(this, arguments);
      }

      return getDaemonHeight;
    }()
  }, {
    key: "getHeightByDate",
    value: function () {
      var _getHeightByDate = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee33(year, month, day) {
        var that;
        return _regenerator["default"].wrap(function _callee33$(_context33) {
          while (1) {
            switch (_context33.prev = _context33.next) {
              case 0:
                this._assertNotClosed();

                _context33.next = 3;
                return this.isConnectedToDaemon();

              case 3:
                if (_context33.sent) {
                  _context33.next = 5;
                  break;
                }

                throw new _MoneroError["default"]("Wallet is not connected to daemon");

              case 5:
                // schedule task
                that = this;
                return _context33.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee32() {
                  return _regenerator["default"].wrap(function _callee32$(_context32) {
                    while (1) {
                      switch (_context32.prev = _context32.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context32.abrupt("return", new Promise(function (resolve, reject) {
                            // define callback for wasm
                            var callbackFn = function callbackFn(resp) {
                              if (typeof resp === "string") reject(new _MoneroError["default"](resp));else resolve(resp);
                            }; // call wasm and invoke callback when done


                            that._module.get_height_by_date(that._cppAddress, year, month, day, callbackFn);
                          }));

                        case 2:
                        case "end":
                          return _context32.stop();
                      }
                    }
                  }, _callee32);
                }))));

              case 7:
              case "end":
                return _context33.stop();
            }
          }
        }, _callee33, this);
      }));

      function getHeightByDate(_x9, _x10, _x11) {
        return _getHeightByDate.apply(this, arguments);
      }

      return getHeightByDate;
    }()
    /**
     * Synchronize the wallet with the daemon as a one-time synchronous process.
     * 
     * @param {MoneroWalletListener|number} [listenerOrStartHeight] - listener xor start height (defaults to no sync listener, the last synced block)
     * @param {number} [startHeight] - startHeight if not given in first arg (defaults to last synced block)
     * @param {boolean} [allowConcurrentCalls] - allow other wallet methods to be processed simultaneously during sync (default false)<br><br><b>WARNING</b>: enabling this option will crash wallet execution if another call makes a simultaneous network request. TODO: possible to sync wasm network requests in http_client_wasm.cpp? 
     */

  }, {
    key: "sync",
    value: function () {
      var _sync = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee36(listenerOrStartHeight, startHeight, allowConcurrentCalls) {
        var listener, err, result, syncWasm, that;
        return _regenerator["default"].wrap(function _callee36$(_context36) {
          while (1) {
            switch (_context36.prev = _context36.next) {
              case 0:
                this._assertNotClosed();

                _context36.next = 3;
                return this.isConnectedToDaemon();

              case 3:
                if (_context36.sent) {
                  _context36.next = 5;
                  break;
                }

                throw new _MoneroError["default"]("Wallet is not connected to daemon");

              case 5:
                // normalize params
                startHeight = listenerOrStartHeight === undefined || listenerOrStartHeight instanceof _MoneroWalletListener["default"] ? startHeight : listenerOrStartHeight;
                listener = listenerOrStartHeight instanceof _MoneroWalletListener["default"] ? listenerOrStartHeight : undefined;

                if (!(startHeight === undefined)) {
                  _context36.next = 16;
                  break;
                }

                _context36.t0 = Math;
                _context36.next = 11;
                return this.getHeight();

              case 11:
                _context36.t1 = _context36.sent;
                _context36.next = 14;
                return this.getSyncHeight();

              case 14:
                _context36.t2 = _context36.sent;
                startHeight = _context36.t0.max.call(_context36.t0, _context36.t1, _context36.t2);

              case 16:
                if (!listener) {
                  _context36.next = 19;
                  break;
                }

                _context36.next = 19;
                return this.addListener(listener);

              case 19:
                _context36.prev = 19;

                syncWasm = function syncWasm() {
                  that._assertNotClosed();

                  return new Promise(function (resolve, reject) {
                    // define callback for wasm
                    var callbackFn = /*#__PURE__*/function () {
                      var _ref16 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee35(resp) {
                        var respJson;
                        return _regenerator["default"].wrap(function _callee35$(_context35) {
                          while (1) {
                            switch (_context35.prev = _context35.next) {
                              case 0:
                                if (resp.charAt(0) !== "{") reject(new _MoneroError["default"](resp));else {
                                  respJson = JSON.parse(resp);
                                  resolve(new _MoneroSyncResult["default"](respJson.numBlocksFetched, respJson.receivedMoney));
                                }

                              case 1:
                              case "end":
                                return _context35.stop();
                            }
                          }
                        }, _callee35);
                      }));

                      return function callbackFn(_x15) {
                        return _ref16.apply(this, arguments);
                      };
                    }(); // sync wallet in wasm and invoke callback when done


                    that._module.sync(that._cppAddress, startHeight, callbackFn);
                  });
                };

                that = this;
                _context36.next = 24;
                return allowConcurrentCalls ? syncWasm() : that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee34() {
                  return _regenerator["default"].wrap(function _callee34$(_context34) {
                    while (1) {
                      switch (_context34.prev = _context34.next) {
                        case 0:
                          return _context34.abrupt("return", syncWasm());

                        case 1:
                        case "end":
                          return _context34.stop();
                      }
                    }
                  }, _callee34);
                })));

              case 24:
                result = _context36.sent;
                _context36.next = 30;
                break;

              case 27:
                _context36.prev = 27;
                _context36.t3 = _context36["catch"](19);
                err = _context36.t3;

              case 30:
                if (!listener) {
                  _context36.next = 33;
                  break;
                }

                _context36.next = 33;
                return this.removeListener(listener);

              case 33:
                if (!err) {
                  _context36.next = 35;
                  break;
                }

                throw err;

              case 35:
                return _context36.abrupt("return", result);

              case 36:
              case "end":
                return _context36.stop();
            }
          }
        }, _callee36, this, [[19, 27]]);
      }));

      function sync(_x12, _x13, _x14) {
        return _sync.apply(this, arguments);
      }

      return sync;
    }()
  }, {
    key: "startSyncing",
    value: function () {
      var _startSyncing = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee38(syncPeriodInMs) {
        var that;
        return _regenerator["default"].wrap(function _callee38$(_context38) {
          while (1) {
            switch (_context38.prev = _context38.next) {
              case 0:
                this._assertNotClosed();

                _context38.next = 3;
                return this.isConnectedToDaemon();

              case 3:
                if (_context38.sent) {
                  _context38.next = 5;
                  break;
                }

                throw new _MoneroError["default"]("Wallet is not connected to daemon");

              case 5:
                this._syncPeriodInMs = syncPeriodInMs === undefined ? MoneroWalletFull.DEFAULT_SYNC_PERIOD_IN_MS : syncPeriodInMs;
                that = this;
                if (!this._syncLooper) this._syncLooper = new _TaskLooper["default"]( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee37() {
                  return _regenerator["default"].wrap(function _callee37$(_context37) {
                    while (1) {
                      switch (_context37.prev = _context37.next) {
                        case 0:
                          _context37.next = 2;
                          return that._backgroundSync();

                        case 2:
                        case "end":
                          return _context37.stop();
                      }
                    }
                  }, _callee37);
                })));

                this._syncLooper.start(this._syncPeriodInMs);

              case 9:
              case "end":
                return _context38.stop();
            }
          }
        }, _callee38, this);
      }));

      function startSyncing(_x16) {
        return _startSyncing.apply(this, arguments);
      }

      return startSyncing;
    }()
  }, {
    key: "stopSyncing",
    value: function () {
      var _stopSyncing = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee39() {
        return _regenerator["default"].wrap(function _callee39$(_context39) {
          while (1) {
            switch (_context39.prev = _context39.next) {
              case 0:
                this._assertNotClosed();

                if (this._syncLooper) this._syncLooper.stop();

                this._module.stop_syncing(this._cppAddress); // task is not queued so wallet stops immediately


              case 3:
              case "end":
                return _context39.stop();
            }
          }
        }, _callee39, this);
      }));

      function stopSyncing() {
        return _stopSyncing.apply(this, arguments);
      }

      return stopSyncing;
    }()
  }, {
    key: "scanTxs",
    value: function () {
      var _scanTxs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee41(txHashes) {
        var that;
        return _regenerator["default"].wrap(function _callee41$(_context41) {
          while (1) {
            switch (_context41.prev = _context41.next) {
              case 0:
                that = this;
                return _context41.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee40() {
                  return _regenerator["default"].wrap(function _callee40$(_context40) {
                    while (1) {
                      switch (_context40.prev = _context40.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context40.abrupt("return", new Promise(function (resolve, reject) {
                            var callbackFn = function callbackFn(err) {
                              if (err) reject(new _MoneroError["default"](msg));else resolve();
                            };

                            that._module.scan_txs(that._cppAddress, JSON.stringify({
                              txHashes: txHashes
                            }), callbackFn);
                          }));

                        case 2:
                        case "end":
                          return _context40.stop();
                      }
                    }
                  }, _callee40);
                }))));

              case 2:
              case "end":
                return _context41.stop();
            }
          }
        }, _callee41, this);
      }));

      function scanTxs(_x17) {
        return _scanTxs.apply(this, arguments);
      }

      return scanTxs;
    }()
  }, {
    key: "rescanSpent",
    value: function () {
      var _rescanSpent = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee43() {
        var that;
        return _regenerator["default"].wrap(function _callee43$(_context43) {
          while (1) {
            switch (_context43.prev = _context43.next) {
              case 0:
                that = this;
                return _context43.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee42() {
                  return _regenerator["default"].wrap(function _callee42$(_context42) {
                    while (1) {
                      switch (_context42.prev = _context42.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context42.abrupt("return", new Promise(function (resolve, reject) {
                            var callbackFn = function callbackFn() {
                              resolve();
                            };

                            that._module.rescan_spent(that._cppAddress, callbackFn);
                          }));

                        case 2:
                        case "end":
                          return _context42.stop();
                      }
                    }
                  }, _callee42);
                }))));

              case 2:
              case "end":
                return _context43.stop();
            }
          }
        }, _callee43, this);
      }));

      function rescanSpent() {
        return _rescanSpent.apply(this, arguments);
      }

      return rescanSpent;
    }()
  }, {
    key: "rescanBlockchain",
    value: function () {
      var _rescanBlockchain = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee45() {
        var that;
        return _regenerator["default"].wrap(function _callee45$(_context45) {
          while (1) {
            switch (_context45.prev = _context45.next) {
              case 0:
                that = this;
                return _context45.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee44() {
                  return _regenerator["default"].wrap(function _callee44$(_context44) {
                    while (1) {
                      switch (_context44.prev = _context44.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context44.abrupt("return", new Promise(function (resolve, reject) {
                            var callbackFn = function callbackFn() {
                              resolve();
                            };

                            that._module.rescan_blockchain(that._cppAddress, callbackFn);
                          }));

                        case 2:
                        case "end":
                          return _context44.stop();
                      }
                    }
                  }, _callee44);
                }))));

              case 2:
              case "end":
                return _context45.stop();
            }
          }
        }, _callee45, this);
      }));

      function rescanBlockchain() {
        return _rescanBlockchain.apply(this, arguments);
      }

      return rescanBlockchain;
    }()
  }, {
    key: "getBalance",
    value: function () {
      var _getBalance = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee47(accountIdx, subaddressIdx) {
        var that;
        return _regenerator["default"].wrap(function _callee47$(_context47) {
          while (1) {
            switch (_context47.prev = _context47.next) {
              case 0:
                that = this;
                return _context47.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee46() {
                  var balanceStr;
                  return _regenerator["default"].wrap(function _callee46$(_context46) {
                    while (1) {
                      switch (_context46.prev = _context46.next) {
                        case 0:
                          that._assertNotClosed(); // get balance encoded in json string


                          if (accountIdx === undefined) {
                            (0, _assert["default"])(subaddressIdx === undefined, "Subaddress index must be undefined if account index is undefined");
                            balanceStr = that._module.get_balance_wallet(that._cppAddress);
                          } else if (subaddressIdx === undefined) {
                            balanceStr = that._module.get_balance_account(that._cppAddress, accountIdx);
                          } else {
                            balanceStr = that._module.get_balance_subaddress(that._cppAddress, accountIdx, subaddressIdx);
                          } // parse json string to BigInt


                          return _context46.abrupt("return", BigInt(JSON.parse(_GenUtils["default"].stringifyBIs(balanceStr)).balance));

                        case 3:
                        case "end":
                          return _context46.stop();
                      }
                    }
                  }, _callee46);
                }))));

              case 2:
              case "end":
                return _context47.stop();
            }
          }
        }, _callee47, this);
      }));

      function getBalance(_x18, _x19) {
        return _getBalance.apply(this, arguments);
      }

      return getBalance;
    }()
  }, {
    key: "getUnlockedBalance",
    value: function () {
      var _getUnlockedBalance = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee49(accountIdx, subaddressIdx) {
        var that;
        return _regenerator["default"].wrap(function _callee49$(_context49) {
          while (1) {
            switch (_context49.prev = _context49.next) {
              case 0:
                that = this;
                return _context49.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee48() {
                  var unlockedBalanceStr;
                  return _regenerator["default"].wrap(function _callee48$(_context48) {
                    while (1) {
                      switch (_context48.prev = _context48.next) {
                        case 0:
                          that._assertNotClosed(); // get balance encoded in json string


                          if (accountIdx === undefined) {
                            (0, _assert["default"])(subaddressIdx === undefined, "Subaddress index must be undefined if account index is undefined");
                            unlockedBalanceStr = that._module.get_unlocked_balance_wallet(that._cppAddress);
                          } else if (subaddressIdx === undefined) {
                            unlockedBalanceStr = that._module.get_unlocked_balance_account(that._cppAddress, accountIdx);
                          } else {
                            unlockedBalanceStr = that._module.get_unlocked_balance_subaddress(that._cppAddress, accountIdx, subaddressIdx);
                          } // parse json string to BigInt


                          return _context48.abrupt("return", BigInt(JSON.parse(_GenUtils["default"].stringifyBIs(unlockedBalanceStr)).unlockedBalance));

                        case 3:
                        case "end":
                          return _context48.stop();
                      }
                    }
                  }, _callee48);
                }))));

              case 2:
              case "end":
                return _context49.stop();
            }
          }
        }, _callee49, this);
      }));

      function getUnlockedBalance(_x20, _x21) {
        return _getUnlockedBalance.apply(this, arguments);
      }

      return getUnlockedBalance;
    }()
  }, {
    key: "getAccounts",
    value: function () {
      var _getAccounts = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee51(includeSubaddresses, tag) {
        var that;
        return _regenerator["default"].wrap(function _callee51$(_context51) {
          while (1) {
            switch (_context51.prev = _context51.next) {
              case 0:
                that = this;
                return _context51.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee50() {
                  var accountsStr, accounts, _iterator, _step, accountJson;

                  return _regenerator["default"].wrap(function _callee50$(_context50) {
                    while (1) {
                      switch (_context50.prev = _context50.next) {
                        case 0:
                          that._assertNotClosed();

                          accountsStr = that._module.get_accounts(that._cppAddress, includeSubaddresses ? true : false, tag ? tag : "");
                          accounts = [];
                          _iterator = _createForOfIteratorHelper(JSON.parse(_GenUtils["default"].stringifyBIs(accountsStr)).accounts);

                          try {
                            for (_iterator.s(); !(_step = _iterator.n()).done;) {
                              accountJson = _step.value;
                              accounts.push(MoneroWalletFull._sanitizeAccount(new _MoneroAccount["default"](accountJson)));
                            }
                          } catch (err) {
                            _iterator.e(err);
                          } finally {
                            _iterator.f();
                          }

                          return _context50.abrupt("return", accounts);

                        case 6:
                        case "end":
                          return _context50.stop();
                      }
                    }
                  }, _callee50);
                }))));

              case 2:
              case "end":
                return _context51.stop();
            }
          }
        }, _callee51, this);
      }));

      function getAccounts(_x22, _x23) {
        return _getAccounts.apply(this, arguments);
      }

      return getAccounts;
    }()
  }, {
    key: "getAccount",
    value: function () {
      var _getAccount = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee53(accountIdx, includeSubaddresses) {
        var that;
        return _regenerator["default"].wrap(function _callee53$(_context53) {
          while (1) {
            switch (_context53.prev = _context53.next) {
              case 0:
                that = this;
                return _context53.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee52() {
                  var accountStr, accountJson;
                  return _regenerator["default"].wrap(function _callee52$(_context52) {
                    while (1) {
                      switch (_context52.prev = _context52.next) {
                        case 0:
                          that._assertNotClosed();

                          accountStr = that._module.get_account(that._cppAddress, accountIdx, includeSubaddresses ? true : false);
                          accountJson = JSON.parse(_GenUtils["default"].stringifyBIs(accountStr));
                          return _context52.abrupt("return", MoneroWalletFull._sanitizeAccount(new _MoneroAccount["default"](accountJson)));

                        case 4:
                        case "end":
                          return _context52.stop();
                      }
                    }
                  }, _callee52);
                }))));

              case 2:
              case "end":
                return _context53.stop();
            }
          }
        }, _callee53, this);
      }));

      function getAccount(_x24, _x25) {
        return _getAccount.apply(this, arguments);
      }

      return getAccount;
    }()
  }, {
    key: "createAccount",
    value: function () {
      var _createAccount = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee55(label) {
        var that;
        return _regenerator["default"].wrap(function _callee55$(_context55) {
          while (1) {
            switch (_context55.prev = _context55.next) {
              case 0:
                if (label === undefined) label = "";
                that = this;
                return _context55.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee54() {
                  var accountStr, accountJson;
                  return _regenerator["default"].wrap(function _callee54$(_context54) {
                    while (1) {
                      switch (_context54.prev = _context54.next) {
                        case 0:
                          that._assertNotClosed();

                          accountStr = that._module.create_account(that._cppAddress, label);
                          accountJson = JSON.parse(_GenUtils["default"].stringifyBIs(accountStr));
                          return _context54.abrupt("return", MoneroWalletFull._sanitizeAccount(new _MoneroAccount["default"](accountJson)));

                        case 4:
                        case "end":
                          return _context54.stop();
                      }
                    }
                  }, _callee54);
                }))));

              case 3:
              case "end":
                return _context55.stop();
            }
          }
        }, _callee55, this);
      }));

      function createAccount(_x26) {
        return _createAccount.apply(this, arguments);
      }

      return createAccount;
    }()
  }, {
    key: "getSubaddresses",
    value: function () {
      var _getSubaddresses = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee57(accountIdx, subaddressIndices) {
        var args, that;
        return _regenerator["default"].wrap(function _callee57$(_context57) {
          while (1) {
            switch (_context57.prev = _context57.next) {
              case 0:
                args = {
                  accountIdx: accountIdx,
                  subaddressIndices: subaddressIndices === undefined ? [] : _GenUtils["default"].listify(subaddressIndices)
                };
                that = this;
                return _context57.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee56() {
                  var subaddressesJson, subaddresses, _iterator2, _step2, subaddressJson;

                  return _regenerator["default"].wrap(function _callee56$(_context56) {
                    while (1) {
                      switch (_context56.prev = _context56.next) {
                        case 0:
                          that._assertNotClosed();

                          subaddressesJson = JSON.parse(_GenUtils["default"].stringifyBIs(that._module.get_subaddresses(that._cppAddress, JSON.stringify(args)))).subaddresses;
                          subaddresses = [];
                          _iterator2 = _createForOfIteratorHelper(subaddressesJson);

                          try {
                            for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                              subaddressJson = _step2.value;
                              subaddresses.push(MoneroWalletFull._sanitizeSubaddress(new _MoneroSubaddress["default"](subaddressJson)));
                            }
                          } catch (err) {
                            _iterator2.e(err);
                          } finally {
                            _iterator2.f();
                          }

                          return _context56.abrupt("return", subaddresses);

                        case 6:
                        case "end":
                          return _context56.stop();
                      }
                    }
                  }, _callee56);
                }))));

              case 3:
              case "end":
                return _context57.stop();
            }
          }
        }, _callee57, this);
      }));

      function getSubaddresses(_x27, _x28) {
        return _getSubaddresses.apply(this, arguments);
      }

      return getSubaddresses;
    }()
  }, {
    key: "createSubaddress",
    value: function () {
      var _createSubaddress = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee59(accountIdx, label) {
        var that;
        return _regenerator["default"].wrap(function _callee59$(_context59) {
          while (1) {
            switch (_context59.prev = _context59.next) {
              case 0:
                if (label === undefined) label = "";
                that = this;
                return _context59.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee58() {
                  var subaddressStr, subaddressJson;
                  return _regenerator["default"].wrap(function _callee58$(_context58) {
                    while (1) {
                      switch (_context58.prev = _context58.next) {
                        case 0:
                          that._assertNotClosed();

                          subaddressStr = that._module.create_subaddress(that._cppAddress, accountIdx, label);
                          subaddressJson = JSON.parse(_GenUtils["default"].stringifyBIs(subaddressStr));
                          return _context58.abrupt("return", MoneroWalletFull._sanitizeSubaddress(new _MoneroSubaddress["default"](subaddressJson)));

                        case 4:
                        case "end":
                          return _context58.stop();
                      }
                    }
                  }, _callee58);
                }))));

              case 3:
              case "end":
                return _context59.stop();
            }
          }
        }, _callee59, this);
      }));

      function createSubaddress(_x29, _x30) {
        return _createSubaddress.apply(this, arguments);
      }

      return createSubaddress;
    }()
  }, {
    key: "getTxs",
    value: function () {
      var _getTxs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee61(query, missingTxHashes) {
        var that;
        return _regenerator["default"].wrap(function _callee61$(_context61) {
          while (1) {
            switch (_context61.prev = _context61.next) {
              case 0:
                this._assertNotClosed(); // copy and normalize query up to block


                query = _MoneroWallet2["default"]._normalizeTxQuery(query); // schedule task

                that = this;
                return _context61.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee60() {
                  return _regenerator["default"].wrap(function _callee60$(_context60) {
                    while (1) {
                      switch (_context60.prev = _context60.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context60.abrupt("return", new Promise(function (resolve, reject) {
                            // define callback for wasm
                            var callbackFn = function callbackFn(blocksJsonStr) {
                              // check for error
                              if (blocksJsonStr.charAt(0) !== "{") {
                                reject(new _MoneroError["default"](blocksJsonStr));
                                return;
                              } // resolve with deserialized txs


                              try {
                                resolve(MoneroWalletFull._deserializeTxs(query, blocksJsonStr, missingTxHashes));
                              } catch (err) {
                                reject(err);
                              }
                            }; // call wasm and invoke callback when done


                            that._module.get_txs(that._cppAddress, JSON.stringify(query.getBlock().toJson()), callbackFn);
                          }));

                        case 2:
                        case "end":
                          return _context60.stop();
                      }
                    }
                  }, _callee60);
                }))));

              case 4:
              case "end":
                return _context61.stop();
            }
          }
        }, _callee61, this);
      }));

      function getTxs(_x31, _x32) {
        return _getTxs.apply(this, arguments);
      }

      return getTxs;
    }()
  }, {
    key: "getTransfers",
    value: function () {
      var _getTransfers = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee63(query) {
        var that;
        return _regenerator["default"].wrap(function _callee63$(_context63) {
          while (1) {
            switch (_context63.prev = _context63.next) {
              case 0:
                this._assertNotClosed(); // copy and normalize query up to block


                query = _MoneroWallet2["default"]._normalizeTransferQuery(query); // return promise which resolves on callback

                that = this;
                return _context63.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee62() {
                  return _regenerator["default"].wrap(function _callee62$(_context62) {
                    while (1) {
                      switch (_context62.prev = _context62.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context62.abrupt("return", new Promise(function (resolve, reject) {
                            // define callback for wasm
                            var callbackFn = function callbackFn(blocksJsonStr) {
                              // check for error
                              if (blocksJsonStr.charAt(0) !== "{") {
                                reject(new _MoneroError["default"](blocksJsonStr));
                                return;
                              } // resolve with deserialized transfers 


                              try {
                                resolve(MoneroWalletFull._deserializeTransfers(query, blocksJsonStr));
                              } catch (err) {
                                reject(err);
                              }
                            }; // call wasm and invoke callback when done


                            that._module.get_transfers(that._cppAddress, JSON.stringify(query.getTxQuery().getBlock().toJson()), callbackFn);
                          }));

                        case 2:
                        case "end":
                          return _context62.stop();
                      }
                    }
                  }, _callee62);
                }))));

              case 4:
              case "end":
                return _context63.stop();
            }
          }
        }, _callee63, this);
      }));

      function getTransfers(_x33) {
        return _getTransfers.apply(this, arguments);
      }

      return getTransfers;
    }()
  }, {
    key: "getOutputs",
    value: function () {
      var _getOutputs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee65(query) {
        var that;
        return _regenerator["default"].wrap(function _callee65$(_context65) {
          while (1) {
            switch (_context65.prev = _context65.next) {
              case 0:
                this._assertNotClosed(); // copy and normalize query up to block


                query = _MoneroWallet2["default"]._normalizeOutputQuery(query); // return promise which resolves on callback

                that = this;
                return _context65.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee64() {
                  return _regenerator["default"].wrap(function _callee64$(_context64) {
                    while (1) {
                      switch (_context64.prev = _context64.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context64.abrupt("return", new Promise(function (resolve, reject) {
                            // define callback for wasm
                            var callbackFn = function callbackFn(blocksJsonStr) {
                              // check for error
                              if (blocksJsonStr.charAt(0) !== "{") {
                                reject(new _MoneroError["default"](blocksJsonStr));
                                return;
                              } // resolve with deserialized outputs


                              try {
                                resolve(MoneroWalletFull._deserializeOutputs(query, blocksJsonStr));
                              } catch (err) {
                                reject(err);
                              }
                            }; // call wasm and invoke callback when done


                            that._module.get_outputs(that._cppAddress, JSON.stringify(query.getTxQuery().getBlock().toJson()), callbackFn);
                          }));

                        case 2:
                        case "end":
                          return _context64.stop();
                      }
                    }
                  }, _callee64);
                }))));

              case 4:
              case "end":
                return _context65.stop();
            }
          }
        }, _callee65, this);
      }));

      function getOutputs(_x34) {
        return _getOutputs.apply(this, arguments);
      }

      return getOutputs;
    }()
  }, {
    key: "exportOutputs",
    value: function () {
      var _exportOutputs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee67(all) {
        var that;
        return _regenerator["default"].wrap(function _callee67$(_context67) {
          while (1) {
            switch (_context67.prev = _context67.next) {
              case 0:
                that = this;
                return _context67.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee66() {
                  return _regenerator["default"].wrap(function _callee66$(_context66) {
                    while (1) {
                      switch (_context66.prev = _context66.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context66.abrupt("return", new Promise(function (resolve, reject) {
                            that._module.export_outputs(that._cppAddress, all, function (outputsHex) {
                              resolve(outputsHex);
                            });
                          }));

                        case 2:
                        case "end":
                          return _context66.stop();
                      }
                    }
                  }, _callee66);
                }))));

              case 2:
              case "end":
                return _context67.stop();
            }
          }
        }, _callee67, this);
      }));

      function exportOutputs(_x35) {
        return _exportOutputs.apply(this, arguments);
      }

      return exportOutputs;
    }()
  }, {
    key: "importOutputs",
    value: function () {
      var _importOutputs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee69(outputsHex) {
        var that;
        return _regenerator["default"].wrap(function _callee69$(_context69) {
          while (1) {
            switch (_context69.prev = _context69.next) {
              case 0:
                that = this;
                return _context69.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee68() {
                  return _regenerator["default"].wrap(function _callee68$(_context68) {
                    while (1) {
                      switch (_context68.prev = _context68.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context68.abrupt("return", new Promise(function (resolve, reject) {
                            that._module.import_outputs(that._cppAddress, outputsHex, function (numImported) {
                              resolve(numImported);
                            });
                          }));

                        case 2:
                        case "end":
                          return _context68.stop();
                      }
                    }
                  }, _callee68);
                }))));

              case 2:
              case "end":
                return _context69.stop();
            }
          }
        }, _callee69, this);
      }));

      function importOutputs(_x36) {
        return _importOutputs.apply(this, arguments);
      }

      return importOutputs;
    }()
  }, {
    key: "exportKeyImages",
    value: function () {
      var _exportKeyImages = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee71(all) {
        var that;
        return _regenerator["default"].wrap(function _callee71$(_context71) {
          while (1) {
            switch (_context71.prev = _context71.next) {
              case 0:
                that = this;
                return _context71.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee70() {
                  return _regenerator["default"].wrap(function _callee70$(_context70) {
                    while (1) {
                      switch (_context70.prev = _context70.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context70.abrupt("return", new Promise(function (resolve, reject) {
                            var callback = function callback(keyImagesStr) {
                              var keyImages = [];

                              var _iterator3 = _createForOfIteratorHelper(JSON.parse(_GenUtils["default"].stringifyBIs(keyImagesStr)).keyImages),
                                  _step3;

                              try {
                                for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                                  var keyImageJson = _step3.value;
                                  keyImages.push(new _MoneroKeyImage["default"](keyImageJson));
                                }
                              } catch (err) {
                                _iterator3.e(err);
                              } finally {
                                _iterator3.f();
                              }

                              resolve(keyImages);
                            };

                            that._module.export_key_images(that._cppAddress, all, callback);
                          }));

                        case 2:
                        case "end":
                          return _context70.stop();
                      }
                    }
                  }, _callee70);
                }))));

              case 2:
              case "end":
                return _context71.stop();
            }
          }
        }, _callee71, this);
      }));

      function exportKeyImages(_x37) {
        return _exportKeyImages.apply(this, arguments);
      }

      return exportKeyImages;
    }()
  }, {
    key: "importKeyImages",
    value: function () {
      var _importKeyImages = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee73(keyImages) {
        var that;
        return _regenerator["default"].wrap(function _callee73$(_context73) {
          while (1) {
            switch (_context73.prev = _context73.next) {
              case 0:
                that = this;
                return _context73.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee72() {
                  return _regenerator["default"].wrap(function _callee72$(_context72) {
                    while (1) {
                      switch (_context72.prev = _context72.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context72.abrupt("return", new Promise(function (resolve, reject) {
                            var callback = function callback(keyImageImportResultStr) {
                              resolve(new _MoneroKeyImageImportResult["default"](JSON.parse(_GenUtils["default"].stringifyBIs(keyImageImportResultStr))));
                            };

                            that._module.import_key_images(that._cppAddress, JSON.stringify({
                              keyImages: keyImages.map(function (keyImage) {
                                return keyImage.toJson();
                              })
                            }), callback);
                          }));

                        case 2:
                        case "end":
                          return _context72.stop();
                      }
                    }
                  }, _callee72);
                }))));

              case 2:
              case "end":
                return _context73.stop();
            }
          }
        }, _callee73, this);
      }));

      function importKeyImages(_x38) {
        return _importKeyImages.apply(this, arguments);
      }

      return importKeyImages;
    }()
  }, {
    key: "getNewKeyImagesFromLastImport",
    value: function () {
      var _getNewKeyImagesFromLastImport = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee74() {
        return _regenerator["default"].wrap(function _callee74$(_context74) {
          while (1) {
            switch (_context74.prev = _context74.next) {
              case 0:
                this._assertNotClosed();

                throw new _MoneroError["default"]("Not implemented");

              case 2:
              case "end":
                return _context74.stop();
            }
          }
        }, _callee74, this);
      }));

      function getNewKeyImagesFromLastImport() {
        return _getNewKeyImagesFromLastImport.apply(this, arguments);
      }

      return getNewKeyImagesFromLastImport;
    }()
  }, {
    key: "freezeOutput",
    value: function () {
      var _freezeOutput = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee76(keyImage) {
        var that;
        return _regenerator["default"].wrap(function _callee76$(_context76) {
          while (1) {
            switch (_context76.prev = _context76.next) {
              case 0:
                if (keyImage) {
                  _context76.next = 2;
                  break;
                }

                throw new _MoneroError["default"]("Must specify key image to freeze");

              case 2:
                that = this;
                return _context76.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee75() {
                  return _regenerator["default"].wrap(function _callee75$(_context75) {
                    while (1) {
                      switch (_context75.prev = _context75.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context75.abrupt("return", new Promise(function (resolve, reject) {
                            var callbackFn = function callbackFn() {
                              resolve();
                            };

                            that._module.freeze_output(that._cppAddress, keyImage, callbackFn);
                          }));

                        case 2:
                        case "end":
                          return _context75.stop();
                      }
                    }
                  }, _callee75);
                }))));

              case 4:
              case "end":
                return _context76.stop();
            }
          }
        }, _callee76, this);
      }));

      function freezeOutput(_x39) {
        return _freezeOutput.apply(this, arguments);
      }

      return freezeOutput;
    }()
  }, {
    key: "thawOutput",
    value: function () {
      var _thawOutput = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee78(keyImage) {
        var that;
        return _regenerator["default"].wrap(function _callee78$(_context78) {
          while (1) {
            switch (_context78.prev = _context78.next) {
              case 0:
                if (keyImage) {
                  _context78.next = 2;
                  break;
                }

                throw new _MoneroError["default"]("Must specify key image to thaw");

              case 2:
                that = this;
                return _context78.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee77() {
                  return _regenerator["default"].wrap(function _callee77$(_context77) {
                    while (1) {
                      switch (_context77.prev = _context77.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context77.abrupt("return", new Promise(function (resolve, reject) {
                            var callbackFn = function callbackFn() {
                              resolve();
                            };

                            that._module.thaw_output(that._cppAddress, keyImage, callbackFn);
                          }));

                        case 2:
                        case "end":
                          return _context77.stop();
                      }
                    }
                  }, _callee77);
                }))));

              case 4:
              case "end":
                return _context78.stop();
            }
          }
        }, _callee78, this);
      }));

      function thawOutput(_x40) {
        return _thawOutput.apply(this, arguments);
      }

      return thawOutput;
    }()
  }, {
    key: "isOutputFrozen",
    value: function () {
      var _isOutputFrozen = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee80(keyImage) {
        var that;
        return _regenerator["default"].wrap(function _callee80$(_context80) {
          while (1) {
            switch (_context80.prev = _context80.next) {
              case 0:
                if (keyImage) {
                  _context80.next = 2;
                  break;
                }

                throw new _MoneroError["default"]("Must specify key image to check if frozen");

              case 2:
                that = this;
                return _context80.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee79() {
                  return _regenerator["default"].wrap(function _callee79$(_context79) {
                    while (1) {
                      switch (_context79.prev = _context79.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context79.abrupt("return", new Promise(function (resolve, reject) {
                            var callbackFn = function callbackFn(result) {
                              resolve(result);
                            };

                            that._module.is_output_frozen(that._cppAddress, keyImage, callbackFn);
                          }));

                        case 2:
                        case "end":
                          return _context79.stop();
                      }
                    }
                  }, _callee79);
                }))));

              case 4:
              case "end":
                return _context80.stop();
            }
          }
        }, _callee80, this);
      }));

      function isOutputFrozen(_x41) {
        return _isOutputFrozen.apply(this, arguments);
      }

      return isOutputFrozen;
    }()
  }, {
    key: "createTxs",
    value: function () {
      var _createTxs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee82(config) {
        var that;
        return _regenerator["default"].wrap(function _callee82$(_context82) {
          while (1) {
            switch (_context82.prev = _context82.next) {
              case 0:
                this._assertNotClosed(); // validate, copy, and normalize config


                config = _MoneroWallet2["default"]._normalizeCreateTxsConfig(config);
                if (config.getCanSplit() === undefined) config.setCanSplit(true); // return promise which resolves on callback

                that = this;
                return _context82.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee81() {
                  return _regenerator["default"].wrap(function _callee81$(_context81) {
                    while (1) {
                      switch (_context81.prev = _context81.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context81.abrupt("return", new Promise(function (resolve, reject) {
                            // define callback for wasm
                            var callbackFn = function callbackFn(txSetJsonStr) {
                              if (txSetJsonStr.charAt(0) !== '{') reject(new _MoneroError["default"](txSetJsonStr)); // json expected, else error
                              else resolve(new _MoneroTxSet["default"](JSON.parse(_GenUtils["default"].stringifyBIs(txSetJsonStr))).getTxs());
                            }; // create txs in wasm and invoke callback when done


                            that._module.create_txs(that._cppAddress, JSON.stringify(config.toJson()), callbackFn);
                          }));

                        case 2:
                        case "end":
                          return _context81.stop();
                      }
                    }
                  }, _callee81);
                }))));

              case 5:
              case "end":
                return _context82.stop();
            }
          }
        }, _callee82, this);
      }));

      function createTxs(_x42) {
        return _createTxs.apply(this, arguments);
      }

      return createTxs;
    }()
  }, {
    key: "sweepOutput",
    value: function () {
      var _sweepOutput = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee84(config) {
        var that;
        return _regenerator["default"].wrap(function _callee84$(_context84) {
          while (1) {
            switch (_context84.prev = _context84.next) {
              case 0:
                this._assertNotClosed(); // normalize and validate config


                config = _MoneroWallet2["default"]._normalizeSweepOutputConfig(config); // return promise which resolves on callback

                that = this;
                return _context84.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee83() {
                  return _regenerator["default"].wrap(function _callee83$(_context83) {
                    while (1) {
                      switch (_context83.prev = _context83.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context83.abrupt("return", new Promise(function (resolve, reject) {
                            // define callback for wasm
                            var callbackFn = function callbackFn(txSetJsonStr) {
                              if (txSetJsonStr.charAt(0) !== '{') reject(new _MoneroError["default"](txSetJsonStr)); // json expected, else error
                              else resolve(new _MoneroTxSet["default"](JSON.parse(_GenUtils["default"].stringifyBIs(txSetJsonStr))).getTxs()[0]);
                            }; // sweep output in wasm and invoke callback when done


                            that._module.sweep_output(that._cppAddress, JSON.stringify(config.toJson()), callbackFn);
                          }));

                        case 2:
                        case "end":
                          return _context83.stop();
                      }
                    }
                  }, _callee83);
                }))));

              case 4:
              case "end":
                return _context84.stop();
            }
          }
        }, _callee84, this);
      }));

      function sweepOutput(_x43) {
        return _sweepOutput.apply(this, arguments);
      }

      return sweepOutput;
    }()
  }, {
    key: "sweepUnlocked",
    value: function () {
      var _sweepUnlocked = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee86(config) {
        var that;
        return _regenerator["default"].wrap(function _callee86$(_context86) {
          while (1) {
            switch (_context86.prev = _context86.next) {
              case 0:
                this._assertNotClosed(); // validate and normalize config


                config = _MoneroWallet2["default"]._normalizeSweepUnlockedConfig(config); // return promise which resolves on callback

                that = this;
                return _context86.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee85() {
                  return _regenerator["default"].wrap(function _callee85$(_context85) {
                    while (1) {
                      switch (_context85.prev = _context85.next) {
                        case 0:
                          // TODO: could factor this pattern out, invoked with module params and callback handler
                          that._assertNotClosed();

                          return _context85.abrupt("return", new Promise(function (resolve, reject) {
                            // define callback for wasm
                            var callbackFn = function callbackFn(txSetsJson) {
                              if (txSetsJson.charAt(0) !== '{') reject(new _MoneroError["default"](txSetsJson)); // json expected, else error
                              else {
                                var txSets = [];

                                var _iterator4 = _createForOfIteratorHelper(JSON.parse(_GenUtils["default"].stringifyBIs(txSetsJson)).txSets),
                                    _step4;

                                try {
                                  for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                                    var txSetJson = _step4.value;
                                    txSets.push(new _MoneroTxSet["default"](txSetJson));
                                  }
                                } catch (err) {
                                  _iterator4.e(err);
                                } finally {
                                  _iterator4.f();
                                }

                                var txs = [];

                                for (var _i = 0, _txSets = txSets; _i < _txSets.length; _i++) {
                                  var txSet = _txSets[_i];

                                  var _iterator5 = _createForOfIteratorHelper(txSet.getTxs()),
                                      _step5;

                                  try {
                                    for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
                                      var tx = _step5.value;
                                      txs.push(tx);
                                    }
                                  } catch (err) {
                                    _iterator5.e(err);
                                  } finally {
                                    _iterator5.f();
                                  }
                                }

                                resolve(txs);
                              }
                            }; // sweep unlocked in wasm and invoke callback when done


                            that._module.sweep_unlocked(that._cppAddress, JSON.stringify(config.toJson()), callbackFn);
                          }));

                        case 2:
                        case "end":
                          return _context85.stop();
                      }
                    }
                  }, _callee85);
                }))));

              case 4:
              case "end":
                return _context86.stop();
            }
          }
        }, _callee86, this);
      }));

      function sweepUnlocked(_x44) {
        return _sweepUnlocked.apply(this, arguments);
      }

      return sweepUnlocked;
    }()
  }, {
    key: "sweepDust",
    value: function () {
      var _sweepDust = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee88(relay) {
        var that;
        return _regenerator["default"].wrap(function _callee88$(_context88) {
          while (1) {
            switch (_context88.prev = _context88.next) {
              case 0:
                that = this;
                return _context88.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee87() {
                  return _regenerator["default"].wrap(function _callee87$(_context87) {
                    while (1) {
                      switch (_context87.prev = _context87.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context87.abrupt("return", new Promise(function (resolve, reject) {
                            // define callback for wasm
                            var callbackFn = function callbackFn(txSetJsonStr) {
                              if (txSetJsonStr.charAt(0) !== '{') reject(new _MoneroError["default"](txSetJsonStr)); // json expected, else error
                              else {
                                var txSet = new _MoneroTxSet["default"](JSON.parse(_GenUtils["default"].stringifyBIs(txSetJsonStr)));
                                if (txSet.getTxs() === undefined) txSet.setTxs([]);
                                resolve(txSet.getTxs());
                              }
                            }; // call wasm and invoke callback when done


                            that._module.sweep_dust(that._cppAddress, relay, callbackFn);
                          }));

                        case 2:
                        case "end":
                          return _context87.stop();
                      }
                    }
                  }, _callee87);
                }))));

              case 2:
              case "end":
                return _context88.stop();
            }
          }
        }, _callee88, this);
      }));

      function sweepDust(_x45) {
        return _sweepDust.apply(this, arguments);
      }

      return sweepDust;
    }()
  }, {
    key: "relayTxs",
    value: function () {
      var _relayTxs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee90(txsOrMetadatas) {
        var txMetadatas, _iterator6, _step6, txOrMetadata, that;

        return _regenerator["default"].wrap(function _callee90$(_context90) {
          while (1) {
            switch (_context90.prev = _context90.next) {
              case 0:
                this._assertNotClosed();

                (0, _assert["default"])(Array.isArray(txsOrMetadatas), "Must provide an array of txs or their metadata to relay");
                txMetadatas = [];
                _iterator6 = _createForOfIteratorHelper(txsOrMetadatas);

                try {
                  for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
                    txOrMetadata = _step6.value;
                    txMetadatas.push(txOrMetadata instanceof _MoneroTxWallet["default"] ? txOrMetadata.getMetadata() : txOrMetadata);
                  }
                } catch (err) {
                  _iterator6.e(err);
                } finally {
                  _iterator6.f();
                }

                that = this;
                return _context90.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee89() {
                  return _regenerator["default"].wrap(function _callee89$(_context89) {
                    while (1) {
                      switch (_context89.prev = _context89.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context89.abrupt("return", new Promise(function (resolve, reject) {
                            var callback = function callback(txHashesJson) {
                              if (txHashesJson.charAt(0) !== "{") reject(new _MoneroError["default"](txHashesJson));else resolve(JSON.parse(txHashesJson).txHashes);
                            };

                            that._module.relay_txs(that._cppAddress, JSON.stringify({
                              txMetadatas: txMetadatas
                            }), callback);
                          }));

                        case 2:
                        case "end":
                          return _context89.stop();
                      }
                    }
                  }, _callee89);
                }))));

              case 7:
              case "end":
                return _context90.stop();
            }
          }
        }, _callee90, this);
      }));

      function relayTxs(_x46) {
        return _relayTxs.apply(this, arguments);
      }

      return relayTxs;
    }()
  }, {
    key: "describeTxSet",
    value: function () {
      var _describeTxSet = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee92(txSet) {
        var that;
        return _regenerator["default"].wrap(function _callee92$(_context92) {
          while (1) {
            switch (_context92.prev = _context92.next) {
              case 0:
                that = this;
                return _context92.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee91() {
                  return _regenerator["default"].wrap(function _callee91$(_context91) {
                    while (1) {
                      switch (_context91.prev = _context91.next) {
                        case 0:
                          that._assertNotClosed();

                          txSet = new _MoneroTxSet["default"]().setUnsignedTxHex(txSet.getUnsignedTxHex()).setSignedTxHex(txSet.getSignedTxHex()).setMultisigTxHex(txSet.getMultisigTxHex());
                          _context91.prev = 2;
                          return _context91.abrupt("return", new _MoneroTxSet["default"](JSON.parse(_GenUtils["default"].stringifyBIs(that._module.describe_tx_set(that._cppAddress, JSON.stringify(txSet.toJson()))))));

                        case 6:
                          _context91.prev = 6;
                          _context91.t0 = _context91["catch"](2);
                          throw new _MoneroError["default"](that._module.get_exception_message(_context91.t0));

                        case 9:
                        case "end":
                          return _context91.stop();
                      }
                    }
                  }, _callee91, null, [[2, 6]]);
                }))));

              case 2:
              case "end":
                return _context92.stop();
            }
          }
        }, _callee92, this);
      }));

      function describeTxSet(_x47) {
        return _describeTxSet.apply(this, arguments);
      }

      return describeTxSet;
    }()
  }, {
    key: "signTxs",
    value: function () {
      var _signTxs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee94(unsignedTxHex) {
        var that;
        return _regenerator["default"].wrap(function _callee94$(_context94) {
          while (1) {
            switch (_context94.prev = _context94.next) {
              case 0:
                that = this;
                return _context94.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee93() {
                  return _regenerator["default"].wrap(function _callee93$(_context93) {
                    while (1) {
                      switch (_context93.prev = _context93.next) {
                        case 0:
                          that._assertNotClosed();

                          _context93.prev = 1;
                          return _context93.abrupt("return", that._module.sign_txs(that._cppAddress, unsignedTxHex));

                        case 5:
                          _context93.prev = 5;
                          _context93.t0 = _context93["catch"](1);
                          throw new _MoneroError["default"](that._module.get_exception_message(_context93.t0));

                        case 8:
                        case "end":
                          return _context93.stop();
                      }
                    }
                  }, _callee93, null, [[1, 5]]);
                }))));

              case 2:
              case "end":
                return _context94.stop();
            }
          }
        }, _callee94, this);
      }));

      function signTxs(_x48) {
        return _signTxs.apply(this, arguments);
      }

      return signTxs;
    }()
  }, {
    key: "submitTxs",
    value: function () {
      var _submitTxs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee96(signedTxHex) {
        var that;
        return _regenerator["default"].wrap(function _callee96$(_context96) {
          while (1) {
            switch (_context96.prev = _context96.next) {
              case 0:
                that = this;
                return _context96.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee95() {
                  return _regenerator["default"].wrap(function _callee95$(_context95) {
                    while (1) {
                      switch (_context95.prev = _context95.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context95.abrupt("return", new Promise(function (resolve, reject) {
                            var callbackFn = function callbackFn(resp) {
                              if (resp.charAt(0) !== "{") reject(new _MoneroError["default"](resp));else resolve(JSON.parse(resp).txHashes);
                            };

                            that._module.submit_txs(that._cppAddress, signedTxHex, callbackFn);
                          }));

                        case 2:
                        case "end":
                          return _context95.stop();
                      }
                    }
                  }, _callee95);
                }))));

              case 2:
              case "end":
                return _context96.stop();
            }
          }
        }, _callee96, this);
      }));

      function submitTxs(_x49) {
        return _submitTxs.apply(this, arguments);
      }

      return submitTxs;
    }()
  }, {
    key: "signMessage",
    value: function () {
      var _signMessage = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee98(message, signatureType, accountIdx, subaddressIdx) {
        var that;
        return _regenerator["default"].wrap(function _callee98$(_context98) {
          while (1) {
            switch (_context98.prev = _context98.next) {
              case 0:
                // assign defaults
                signatureType = signatureType || _MoneroMessageSignatureType["default"].SIGN_WITH_SPEND_KEY;
                accountIdx = accountIdx || 0;
                subaddressIdx = subaddressIdx || 0; // queue task to sign message

                that = this;
                return _context98.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee97() {
                  return _regenerator["default"].wrap(function _callee97$(_context97) {
                    while (1) {
                      switch (_context97.prev = _context97.next) {
                        case 0:
                          that._assertNotClosed();

                          _context97.prev = 1;
                          return _context97.abrupt("return", that._module.sign_message(that._cppAddress, message, signatureType === _MoneroMessageSignatureType["default"].SIGN_WITH_SPEND_KEY ? 0 : 1, accountIdx, subaddressIdx));

                        case 5:
                          _context97.prev = 5;
                          _context97.t0 = _context97["catch"](1);
                          throw new _MoneroError["default"](that._module.get_exception_message(_context97.t0));

                        case 8:
                        case "end":
                          return _context97.stop();
                      }
                    }
                  }, _callee97, null, [[1, 5]]);
                }))));

              case 5:
              case "end":
                return _context98.stop();
            }
          }
        }, _callee98, this);
      }));

      function signMessage(_x50, _x51, _x52, _x53) {
        return _signMessage.apply(this, arguments);
      }

      return signMessage;
    }()
  }, {
    key: "verifyMessage",
    value: function () {
      var _verifyMessage = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee100(message, address, signature) {
        var that;
        return _regenerator["default"].wrap(function _callee100$(_context100) {
          while (1) {
            switch (_context100.prev = _context100.next) {
              case 0:
                that = this;
                return _context100.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee99() {
                  var resultJson, result;
                  return _regenerator["default"].wrap(function _callee99$(_context99) {
                    while (1) {
                      switch (_context99.prev = _context99.next) {
                        case 0:
                          that._assertNotClosed();

                          try {
                            resultJson = JSON.parse(that._module.verify_message(that._cppAddress, message, address, signature));
                          } catch (err) {
                            resultJson = {
                              isGood: false
                            };
                          }

                          result = new _MoneroMessageSignatureResult["default"](resultJson.isGood, !resultJson.isGood ? undefined : resultJson.isOld, !resultJson.isGood ? undefined : resultJson.signatureType === "spend" ? _MoneroMessageSignatureType["default"].SIGN_WITH_SPEND_KEY : _MoneroMessageSignatureType["default"].SIGN_WITH_VIEW_KEY, !resultJson.isGood ? undefined : resultJson.version);
                          return _context99.abrupt("return", result);

                        case 4:
                        case "end":
                          return _context99.stop();
                      }
                    }
                  }, _callee99);
                }))));

              case 2:
              case "end":
                return _context100.stop();
            }
          }
        }, _callee100, this);
      }));

      function verifyMessage(_x54, _x55, _x56) {
        return _verifyMessage.apply(this, arguments);
      }

      return verifyMessage;
    }()
  }, {
    key: "getTxKey",
    value: function () {
      var _getTxKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee102(txHash) {
        var that;
        return _regenerator["default"].wrap(function _callee102$(_context102) {
          while (1) {
            switch (_context102.prev = _context102.next) {
              case 0:
                that = this;
                return _context102.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee101() {
                  return _regenerator["default"].wrap(function _callee101$(_context101) {
                    while (1) {
                      switch (_context101.prev = _context101.next) {
                        case 0:
                          that._assertNotClosed();

                          _context101.prev = 1;
                          return _context101.abrupt("return", that._module.get_tx_key(that._cppAddress, txHash));

                        case 5:
                          _context101.prev = 5;
                          _context101.t0 = _context101["catch"](1);
                          throw new _MoneroError["default"](that._module.get_exception_message(_context101.t0));

                        case 8:
                        case "end":
                          return _context101.stop();
                      }
                    }
                  }, _callee101, null, [[1, 5]]);
                }))));

              case 2:
              case "end":
                return _context102.stop();
            }
          }
        }, _callee102, this);
      }));

      function getTxKey(_x57) {
        return _getTxKey.apply(this, arguments);
      }

      return getTxKey;
    }()
  }, {
    key: "checkTxKey",
    value: function () {
      var _checkTxKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee104(txHash, txKey, address) {
        var that;
        return _regenerator["default"].wrap(function _callee104$(_context104) {
          while (1) {
            switch (_context104.prev = _context104.next) {
              case 0:
                that = this;
                return _context104.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee103() {
                  return _regenerator["default"].wrap(function _callee103$(_context103) {
                    while (1) {
                      switch (_context103.prev = _context103.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context103.abrupt("return", new Promise(function (resolve, reject) {
                            that._module.check_tx_key(that._cppAddress, txHash, txKey, address, function (respJsonStr) {
                              if (respJsonStr.charAt(0) !== "{") reject(new _MoneroError["default"](respJsonStr));else resolve(new _MoneroCheckTx["default"](JSON.parse(_GenUtils["default"].stringifyBIs(respJsonStr))));
                            });
                          }));

                        case 2:
                        case "end":
                          return _context103.stop();
                      }
                    }
                  }, _callee103);
                }))));

              case 2:
              case "end":
                return _context104.stop();
            }
          }
        }, _callee104, this);
      }));

      function checkTxKey(_x58, _x59, _x60) {
        return _checkTxKey.apply(this, arguments);
      }

      return checkTxKey;
    }()
  }, {
    key: "getTxProof",
    value: function () {
      var _getTxProof = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee106(txHash, address, message) {
        var that;
        return _regenerator["default"].wrap(function _callee106$(_context106) {
          while (1) {
            switch (_context106.prev = _context106.next) {
              case 0:
                that = this;
                return _context106.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee105() {
                  return _regenerator["default"].wrap(function _callee105$(_context105) {
                    while (1) {
                      switch (_context105.prev = _context105.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context105.abrupt("return", new Promise(function (resolve, reject) {
                            that._module.get_tx_proof(that._cppAddress, txHash || "", address || "", message || "", function (signature) {
                              var errorKey = "error: ";
                              if (signature.indexOf(errorKey) === 0) reject(new _MoneroError["default"](signature.substring(errorKey.length)));else resolve(signature);
                            });
                          }));

                        case 2:
                        case "end":
                          return _context105.stop();
                      }
                    }
                  }, _callee105);
                }))));

              case 2:
              case "end":
                return _context106.stop();
            }
          }
        }, _callee106, this);
      }));

      function getTxProof(_x61, _x62, _x63) {
        return _getTxProof.apply(this, arguments);
      }

      return getTxProof;
    }()
  }, {
    key: "checkTxProof",
    value: function () {
      var _checkTxProof = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee108(txHash, address, message, signature) {
        var that;
        return _regenerator["default"].wrap(function _callee108$(_context108) {
          while (1) {
            switch (_context108.prev = _context108.next) {
              case 0:
                that = this;
                return _context108.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee107() {
                  return _regenerator["default"].wrap(function _callee107$(_context107) {
                    while (1) {
                      switch (_context107.prev = _context107.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context107.abrupt("return", new Promise(function (resolve, reject) {
                            that._module.check_tx_proof(that._cppAddress, txHash || "", address || "", message || "", signature || "", function (respJsonStr) {
                              if (respJsonStr.charAt(0) !== "{") reject(new _MoneroError["default"](respJsonStr));else resolve(new _MoneroCheckTx["default"](JSON.parse(_GenUtils["default"].stringifyBIs(respJsonStr))));
                            });
                          }));

                        case 2:
                        case "end":
                          return _context107.stop();
                      }
                    }
                  }, _callee107);
                }))));

              case 2:
              case "end":
                return _context108.stop();
            }
          }
        }, _callee108, this);
      }));

      function checkTxProof(_x64, _x65, _x66, _x67) {
        return _checkTxProof.apply(this, arguments);
      }

      return checkTxProof;
    }()
  }, {
    key: "getSpendProof",
    value: function () {
      var _getSpendProof = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee110(txHash, message) {
        var that;
        return _regenerator["default"].wrap(function _callee110$(_context110) {
          while (1) {
            switch (_context110.prev = _context110.next) {
              case 0:
                that = this;
                return _context110.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee109() {
                  return _regenerator["default"].wrap(function _callee109$(_context109) {
                    while (1) {
                      switch (_context109.prev = _context109.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context109.abrupt("return", new Promise(function (resolve, reject) {
                            that._module.get_spend_proof(that._cppAddress, txHash || "", message || "", function (signature) {
                              var errorKey = "error: ";
                              if (signature.indexOf(errorKey) === 0) reject(new _MoneroError["default"](signature.substring(errorKey.length)));else resolve(signature);
                            });
                          }));

                        case 2:
                        case "end":
                          return _context109.stop();
                      }
                    }
                  }, _callee109);
                }))));

              case 2:
              case "end":
                return _context110.stop();
            }
          }
        }, _callee110, this);
      }));

      function getSpendProof(_x68, _x69) {
        return _getSpendProof.apply(this, arguments);
      }

      return getSpendProof;
    }()
  }, {
    key: "checkSpendProof",
    value: function () {
      var _checkSpendProof = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee112(txHash, message, signature) {
        var that;
        return _regenerator["default"].wrap(function _callee112$(_context112) {
          while (1) {
            switch (_context112.prev = _context112.next) {
              case 0:
                that = this;
                return _context112.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee111() {
                  return _regenerator["default"].wrap(function _callee111$(_context111) {
                    while (1) {
                      switch (_context111.prev = _context111.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context111.abrupt("return", new Promise(function (resolve, reject) {
                            that._module.check_spend_proof(that._cppAddress, txHash || "", message || "", signature || "", function (resp) {
                              typeof resp === "string" ? reject(new _MoneroError["default"](resp)) : resolve(resp);
                            });
                          }));

                        case 2:
                        case "end":
                          return _context111.stop();
                      }
                    }
                  }, _callee111);
                }))));

              case 2:
              case "end":
                return _context112.stop();
            }
          }
        }, _callee112, this);
      }));

      function checkSpendProof(_x70, _x71, _x72) {
        return _checkSpendProof.apply(this, arguments);
      }

      return checkSpendProof;
    }()
  }, {
    key: "getReserveProofWallet",
    value: function () {
      var _getReserveProofWallet = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee114(message) {
        var that;
        return _regenerator["default"].wrap(function _callee114$(_context114) {
          while (1) {
            switch (_context114.prev = _context114.next) {
              case 0:
                that = this;
                return _context114.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee113() {
                  return _regenerator["default"].wrap(function _callee113$(_context113) {
                    while (1) {
                      switch (_context113.prev = _context113.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context113.abrupt("return", new Promise(function (resolve, reject) {
                            that._module.get_reserve_proof_wallet(that._cppAddress, message, function (signature) {
                              var errorKey = "error: ";
                              if (signature.indexOf(errorKey) === 0) reject(new _MoneroError["default"](signature.substring(errorKey.length), -1));else resolve(signature);
                            });
                          }));

                        case 2:
                        case "end":
                          return _context113.stop();
                      }
                    }
                  }, _callee113);
                }))));

              case 2:
              case "end":
                return _context114.stop();
            }
          }
        }, _callee114, this);
      }));

      function getReserveProofWallet(_x73) {
        return _getReserveProofWallet.apply(this, arguments);
      }

      return getReserveProofWallet;
    }()
  }, {
    key: "getReserveProofAccount",
    value: function () {
      var _getReserveProofAccount = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee116(accountIdx, amount, message) {
        var that;
        return _regenerator["default"].wrap(function _callee116$(_context116) {
          while (1) {
            switch (_context116.prev = _context116.next) {
              case 0:
                that = this;
                return _context116.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee115() {
                  return _regenerator["default"].wrap(function _callee115$(_context115) {
                    while (1) {
                      switch (_context115.prev = _context115.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context115.abrupt("return", new Promise(function (resolve, reject) {
                            that._module.get_reserve_proof_account(that._cppAddress, accountIdx, amount.toString(), message, function (signature) {
                              var errorKey = "error: ";
                              if (signature.indexOf(errorKey) === 0) reject(new _MoneroError["default"](signature.substring(errorKey.length), -1));else resolve(signature);
                            });
                          }));

                        case 2:
                        case "end":
                          return _context115.stop();
                      }
                    }
                  }, _callee115);
                }))));

              case 2:
              case "end":
                return _context116.stop();
            }
          }
        }, _callee116, this);
      }));

      function getReserveProofAccount(_x74, _x75, _x76) {
        return _getReserveProofAccount.apply(this, arguments);
      }

      return getReserveProofAccount;
    }()
  }, {
    key: "checkReserveProof",
    value: function () {
      var _checkReserveProof = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee118(address, message, signature) {
        var that;
        return _regenerator["default"].wrap(function _callee118$(_context118) {
          while (1) {
            switch (_context118.prev = _context118.next) {
              case 0:
                that = this;
                return _context118.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee117() {
                  return _regenerator["default"].wrap(function _callee117$(_context117) {
                    while (1) {
                      switch (_context117.prev = _context117.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context117.abrupt("return", new Promise(function (resolve, reject) {
                            that._module.check_reserve_proof(that._cppAddress, address, message, signature, function (respJsonStr) {
                              if (respJsonStr.charAt(0) !== "{") reject(new _MoneroError["default"](respJsonStr, -1));else resolve(new _MoneroCheckReserve["default"](JSON.parse(_GenUtils["default"].stringifyBIs(respJsonStr))));
                            });
                          }));

                        case 2:
                        case "end":
                          return _context117.stop();
                      }
                    }
                  }, _callee117);
                }))));

              case 2:
              case "end":
                return _context118.stop();
            }
          }
        }, _callee118, this);
      }));

      function checkReserveProof(_x77, _x78, _x79) {
        return _checkReserveProof.apply(this, arguments);
      }

      return checkReserveProof;
    }()
  }, {
    key: "getTxNotes",
    value: function () {
      var _getTxNotes = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee120(txHashes) {
        var that;
        return _regenerator["default"].wrap(function _callee120$(_context120) {
          while (1) {
            switch (_context120.prev = _context120.next) {
              case 0:
                that = this;
                return _context120.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee119() {
                  return _regenerator["default"].wrap(function _callee119$(_context119) {
                    while (1) {
                      switch (_context119.prev = _context119.next) {
                        case 0:
                          that._assertNotClosed();

                          _context119.prev = 1;
                          return _context119.abrupt("return", JSON.parse(that._module.get_tx_notes(that._cppAddress, JSON.stringify({
                            txHashes: txHashes
                          }))).txNotes);

                        case 5:
                          _context119.prev = 5;
                          _context119.t0 = _context119["catch"](1);
                          throw new _MoneroError["default"](that._module.get_exception_message(_context119.t0));

                        case 8:
                        case "end":
                          return _context119.stop();
                      }
                    }
                  }, _callee119, null, [[1, 5]]);
                }))));

              case 2:
              case "end":
                return _context120.stop();
            }
          }
        }, _callee120, this);
      }));

      function getTxNotes(_x80) {
        return _getTxNotes.apply(this, arguments);
      }

      return getTxNotes;
    }()
  }, {
    key: "setTxNotes",
    value: function () {
      var _setTxNotes = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee122(txHashes, notes) {
        var that;
        return _regenerator["default"].wrap(function _callee122$(_context122) {
          while (1) {
            switch (_context122.prev = _context122.next) {
              case 0:
                that = this;
                return _context122.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee121() {
                  return _regenerator["default"].wrap(function _callee121$(_context121) {
                    while (1) {
                      switch (_context121.prev = _context121.next) {
                        case 0:
                          that._assertNotClosed();

                          _context121.prev = 1;

                          that._module.set_tx_notes(that._cppAddress, JSON.stringify({
                            txHashes: txHashes,
                            txNotes: notes
                          }));

                          _context121.next = 8;
                          break;

                        case 5:
                          _context121.prev = 5;
                          _context121.t0 = _context121["catch"](1);
                          throw new _MoneroError["default"](that._module.get_exception_message(_context121.t0));

                        case 8:
                        case "end":
                          return _context121.stop();
                      }
                    }
                  }, _callee121, null, [[1, 5]]);
                }))));

              case 2:
              case "end":
                return _context122.stop();
            }
          }
        }, _callee122, this);
      }));

      function setTxNotes(_x81, _x82) {
        return _setTxNotes.apply(this, arguments);
      }

      return setTxNotes;
    }()
  }, {
    key: "getAddressBookEntries",
    value: function () {
      var _getAddressBookEntries = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee124(entryIndices) {
        var that;
        return _regenerator["default"].wrap(function _callee124$(_context124) {
          while (1) {
            switch (_context124.prev = _context124.next) {
              case 0:
                if (!entryIndices) entryIndices = [];
                that = this;
                return _context124.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee123() {
                  var entries, _iterator7, _step7, entryJson;

                  return _regenerator["default"].wrap(function _callee123$(_context123) {
                    while (1) {
                      switch (_context123.prev = _context123.next) {
                        case 0:
                          that._assertNotClosed();

                          entries = [];
                          _iterator7 = _createForOfIteratorHelper(JSON.parse(that._module.get_address_book_entries(that._cppAddress, JSON.stringify({
                            entryIndices: entryIndices
                          }))).entries);

                          try {
                            for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
                              entryJson = _step7.value;
                              entries.push(new _MoneroAddressBookEntry["default"](entryJson));
                            }
                          } catch (err) {
                            _iterator7.e(err);
                          } finally {
                            _iterator7.f();
                          }

                          return _context123.abrupt("return", entries);

                        case 5:
                        case "end":
                          return _context123.stop();
                      }
                    }
                  }, _callee123);
                }))));

              case 3:
              case "end":
                return _context124.stop();
            }
          }
        }, _callee124, this);
      }));

      function getAddressBookEntries(_x83) {
        return _getAddressBookEntries.apply(this, arguments);
      }

      return getAddressBookEntries;
    }()
  }, {
    key: "addAddressBookEntry",
    value: function () {
      var _addAddressBookEntry = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee126(address, description) {
        var that;
        return _regenerator["default"].wrap(function _callee126$(_context126) {
          while (1) {
            switch (_context126.prev = _context126.next) {
              case 0:
                if (!address) address = "";
                if (!description) description = "";
                that = this;
                return _context126.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee125() {
                  return _regenerator["default"].wrap(function _callee125$(_context125) {
                    while (1) {
                      switch (_context125.prev = _context125.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context125.abrupt("return", that._module.add_address_book_entry(that._cppAddress, address, description));

                        case 2:
                        case "end":
                          return _context125.stop();
                      }
                    }
                  }, _callee125);
                }))));

              case 4:
              case "end":
                return _context126.stop();
            }
          }
        }, _callee126, this);
      }));

      function addAddressBookEntry(_x84, _x85) {
        return _addAddressBookEntry.apply(this, arguments);
      }

      return addAddressBookEntry;
    }()
  }, {
    key: "editAddressBookEntry",
    value: function () {
      var _editAddressBookEntry = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee128(index, setAddress, address, setDescription, description) {
        var that;
        return _regenerator["default"].wrap(function _callee128$(_context128) {
          while (1) {
            switch (_context128.prev = _context128.next) {
              case 0:
                if (!setAddress) setAddress = false;
                if (!address) address = "";
                if (!setDescription) setDescription = false;
                if (!description) description = "";
                that = this;
                return _context128.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee127() {
                  return _regenerator["default"].wrap(function _callee127$(_context127) {
                    while (1) {
                      switch (_context127.prev = _context127.next) {
                        case 0:
                          that._assertNotClosed();

                          that._module.edit_address_book_entry(that._cppAddress, index, setAddress, address, setDescription, description);

                        case 2:
                        case "end":
                          return _context127.stop();
                      }
                    }
                  }, _callee127);
                }))));

              case 6:
              case "end":
                return _context128.stop();
            }
          }
        }, _callee128, this);
      }));

      function editAddressBookEntry(_x86, _x87, _x88, _x89, _x90) {
        return _editAddressBookEntry.apply(this, arguments);
      }

      return editAddressBookEntry;
    }()
  }, {
    key: "deleteAddressBookEntry",
    value: function () {
      var _deleteAddressBookEntry = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee130(entryIdx) {
        var that;
        return _regenerator["default"].wrap(function _callee130$(_context130) {
          while (1) {
            switch (_context130.prev = _context130.next) {
              case 0:
                that = this;
                return _context130.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee129() {
                  return _regenerator["default"].wrap(function _callee129$(_context129) {
                    while (1) {
                      switch (_context129.prev = _context129.next) {
                        case 0:
                          that._assertNotClosed();

                          that._module.delete_address_book_entry(that._cppAddress, entryIdx);

                        case 2:
                        case "end":
                          return _context129.stop();
                      }
                    }
                  }, _callee129);
                }))));

              case 2:
              case "end":
                return _context130.stop();
            }
          }
        }, _callee130, this);
      }));

      function deleteAddressBookEntry(_x91) {
        return _deleteAddressBookEntry.apply(this, arguments);
      }

      return deleteAddressBookEntry;
    }()
  }, {
    key: "tagAccounts",
    value: function () {
      var _tagAccounts = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee132(tag, accountIndices) {
        var that;
        return _regenerator["default"].wrap(function _callee132$(_context132) {
          while (1) {
            switch (_context132.prev = _context132.next) {
              case 0:
                if (!tag) tag = "";
                if (!accountIndices) accountIndices = [];
                that = this;
                return _context132.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee131() {
                  return _regenerator["default"].wrap(function _callee131$(_context131) {
                    while (1) {
                      switch (_context131.prev = _context131.next) {
                        case 0:
                          that._assertNotClosed();

                          that._module.tag_accounts(that._cppAddress, JSON.stringify({
                            tag: tag,
                            accountIndices: accountIndices
                          }));

                        case 2:
                        case "end":
                          return _context131.stop();
                      }
                    }
                  }, _callee131);
                }))));

              case 4:
              case "end":
                return _context132.stop();
            }
          }
        }, _callee132, this);
      }));

      function tagAccounts(_x92, _x93) {
        return _tagAccounts.apply(this, arguments);
      }

      return tagAccounts;
    }()
  }, {
    key: "untagAccounts",
    value: function () {
      var _untagAccounts = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee134(accountIndices) {
        var that;
        return _regenerator["default"].wrap(function _callee134$(_context134) {
          while (1) {
            switch (_context134.prev = _context134.next) {
              case 0:
                if (!accountIndices) accountIndices = [];
                that = this;
                return _context134.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee133() {
                  return _regenerator["default"].wrap(function _callee133$(_context133) {
                    while (1) {
                      switch (_context133.prev = _context133.next) {
                        case 0:
                          that._assertNotClosed();

                          that._module.tag_accounts(that._cppAddress, JSON.stringify({
                            accountIndices: accountIndices
                          }));

                        case 2:
                        case "end":
                          return _context133.stop();
                      }
                    }
                  }, _callee133);
                }))));

              case 3:
              case "end":
                return _context134.stop();
            }
          }
        }, _callee134, this);
      }));

      function untagAccounts(_x94) {
        return _untagAccounts.apply(this, arguments);
      }

      return untagAccounts;
    }()
  }, {
    key: "getAccountTags",
    value: function () {
      var _getAccountTags = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee136() {
        var that;
        return _regenerator["default"].wrap(function _callee136$(_context136) {
          while (1) {
            switch (_context136.prev = _context136.next) {
              case 0:
                that = this;
                return _context136.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee135() {
                  var accountTags, _iterator8, _step8, accountTagJson;

                  return _regenerator["default"].wrap(function _callee135$(_context135) {
                    while (1) {
                      switch (_context135.prev = _context135.next) {
                        case 0:
                          that._assertNotClosed();

                          accountTags = [];
                          _iterator8 = _createForOfIteratorHelper(JSON.parse(that._module.get_account_tags(that._cppAddress)).accountTags);

                          try {
                            for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
                              accountTagJson = _step8.value;
                              accountTags.push(new MoneroAccountTag(accountTagJson));
                            }
                          } catch (err) {
                            _iterator8.e(err);
                          } finally {
                            _iterator8.f();
                          }

                          return _context135.abrupt("return", accountTags);

                        case 5:
                        case "end":
                          return _context135.stop();
                      }
                    }
                  }, _callee135);
                }))));

              case 2:
              case "end":
                return _context136.stop();
            }
          }
        }, _callee136, this);
      }));

      function getAccountTags() {
        return _getAccountTags.apply(this, arguments);
      }

      return getAccountTags;
    }()
  }, {
    key: "setAccountTagLabel",
    value: function () {
      var _setAccountTagLabel = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee138(tag, label) {
        var that;
        return _regenerator["default"].wrap(function _callee138$(_context138) {
          while (1) {
            switch (_context138.prev = _context138.next) {
              case 0:
                if (!tag) tag = "";
                if (!llabel) label = "";
                that = this;
                return _context138.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee137() {
                  return _regenerator["default"].wrap(function _callee137$(_context137) {
                    while (1) {
                      switch (_context137.prev = _context137.next) {
                        case 0:
                          that._assertNotClosed();

                          that._module.set_account_tag_label(that._cppAddress, tag, label);

                        case 2:
                        case "end":
                          return _context137.stop();
                      }
                    }
                  }, _callee137);
                }))));

              case 4:
              case "end":
                return _context138.stop();
            }
          }
        }, _callee138, this);
      }));

      function setAccountTagLabel(_x95, _x96) {
        return _setAccountTagLabel.apply(this, arguments);
      }

      return setAccountTagLabel;
    }()
  }, {
    key: "getPaymentUri",
    value: function () {
      var _getPaymentUri = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee140(config) {
        var that;
        return _regenerator["default"].wrap(function _callee140$(_context140) {
          while (1) {
            switch (_context140.prev = _context140.next) {
              case 0:
                config = _MoneroWallet2["default"]._normalizeCreateTxsConfig(config);
                that = this;
                return _context140.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee139() {
                  return _regenerator["default"].wrap(function _callee139$(_context139) {
                    while (1) {
                      switch (_context139.prev = _context139.next) {
                        case 0:
                          that._assertNotClosed();

                          _context139.prev = 1;
                          return _context139.abrupt("return", that._module.get_payment_uri(that._cppAddress, JSON.stringify(config.toJson())));

                        case 5:
                          _context139.prev = 5;
                          _context139.t0 = _context139["catch"](1);
                          throw new _MoneroError["default"]("Cannot make URI from supplied parameters");

                        case 8:
                        case "end":
                          return _context139.stop();
                      }
                    }
                  }, _callee139, null, [[1, 5]]);
                }))));

              case 3:
              case "end":
                return _context140.stop();
            }
          }
        }, _callee140, this);
      }));

      function getPaymentUri(_x97) {
        return _getPaymentUri.apply(this, arguments);
      }

      return getPaymentUri;
    }()
  }, {
    key: "parsePaymentUri",
    value: function () {
      var _parsePaymentUri = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee142(uri) {
        var that;
        return _regenerator["default"].wrap(function _callee142$(_context142) {
          while (1) {
            switch (_context142.prev = _context142.next) {
              case 0:
                that = this;
                return _context142.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee141() {
                  return _regenerator["default"].wrap(function _callee141$(_context141) {
                    while (1) {
                      switch (_context141.prev = _context141.next) {
                        case 0:
                          that._assertNotClosed();

                          _context141.prev = 1;
                          return _context141.abrupt("return", new _MoneroTxConfig["default"](JSON.parse(_GenUtils["default"].stringifyBIs(that._module.parse_payment_uri(that._cppAddress, uri))), true));

                        case 5:
                          _context141.prev = 5;
                          _context141.t0 = _context141["catch"](1);
                          throw new _MoneroError["default"](_context141.t0.message);

                        case 8:
                        case "end":
                          return _context141.stop();
                      }
                    }
                  }, _callee141, null, [[1, 5]]);
                }))));

              case 2:
              case "end":
                return _context142.stop();
            }
          }
        }, _callee142, this);
      }));

      function parsePaymentUri(_x98) {
        return _parsePaymentUri.apply(this, arguments);
      }

      return parsePaymentUri;
    }()
  }, {
    key: "getAttribute",
    value: function () {
      var _getAttribute = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee144(key) {
        var that;
        return _regenerator["default"].wrap(function _callee144$(_context144) {
          while (1) {
            switch (_context144.prev = _context144.next) {
              case 0:
                this._assertNotClosed();

                (0, _assert["default"])(typeof key === "string", "Attribute key must be a string");
                that = this;
                return _context144.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee143() {
                  var value;
                  return _regenerator["default"].wrap(function _callee143$(_context143) {
                    while (1) {
                      switch (_context143.prev = _context143.next) {
                        case 0:
                          that._assertNotClosed();

                          value = that._module.get_attribute(that._cppAddress, key);
                          return _context143.abrupt("return", value === "" ? null : value);

                        case 3:
                        case "end":
                          return _context143.stop();
                      }
                    }
                  }, _callee143);
                }))));

              case 4:
              case "end":
                return _context144.stop();
            }
          }
        }, _callee144, this);
      }));

      function getAttribute(_x99) {
        return _getAttribute.apply(this, arguments);
      }

      return getAttribute;
    }()
  }, {
    key: "setAttribute",
    value: function () {
      var _setAttribute = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee146(key, val) {
        var that;
        return _regenerator["default"].wrap(function _callee146$(_context146) {
          while (1) {
            switch (_context146.prev = _context146.next) {
              case 0:
                this._assertNotClosed();

                (0, _assert["default"])(typeof key === "string", "Attribute key must be a string");
                (0, _assert["default"])(typeof val === "string", "Attribute value must be a string");
                that = this;
                return _context146.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee145() {
                  return _regenerator["default"].wrap(function _callee145$(_context145) {
                    while (1) {
                      switch (_context145.prev = _context145.next) {
                        case 0:
                          that._assertNotClosed();

                          that._module.set_attribute(that._cppAddress, key, val);

                        case 2:
                        case "end":
                          return _context145.stop();
                      }
                    }
                  }, _callee145);
                }))));

              case 5:
              case "end":
                return _context146.stop();
            }
          }
        }, _callee146, this);
      }));

      function setAttribute(_x100, _x101) {
        return _setAttribute.apply(this, arguments);
      }

      return setAttribute;
    }()
  }, {
    key: "startMining",
    value: function () {
      var _startMining = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee147(numThreads, backgroundMining, ignoreBattery) {
        var daemon;
        return _regenerator["default"].wrap(function _callee147$(_context147) {
          while (1) {
            switch (_context147.prev = _context147.next) {
              case 0:
                this._assertNotClosed();

                _context147.t0 = _MoneroDaemonRpc["default"];
                _context147.t1 = Object;
                _context147.next = 5;
                return this.getDaemonConnection();

              case 5:
                _context147.t2 = _context147.sent.getConfig();
                _context147.t3 = {
                  proxyToWorker: false
                };
                _context147.t4 = _context147.t1.assign.call(_context147.t1, _context147.t2, _context147.t3);
                daemon = new _context147.t0(_context147.t4);
                _context147.t5 = daemon;
                _context147.next = 12;
                return this.getPrimaryAddress();

              case 12:
                _context147.t6 = _context147.sent;
                _context147.t7 = numThreads;
                _context147.t8 = backgroundMining;
                _context147.t9 = ignoreBattery;
                _context147.next = 18;
                return _context147.t5.startMining.call(_context147.t5, _context147.t6, _context147.t7, _context147.t8, _context147.t9);

              case 18:
              case "end":
                return _context147.stop();
            }
          }
        }, _callee147, this);
      }));

      function startMining(_x102, _x103, _x104) {
        return _startMining.apply(this, arguments);
      }

      return startMining;
    }()
  }, {
    key: "stopMining",
    value: function () {
      var _stopMining = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee148() {
        var daemon;
        return _regenerator["default"].wrap(function _callee148$(_context148) {
          while (1) {
            switch (_context148.prev = _context148.next) {
              case 0:
                this._assertNotClosed();

                _context148.t0 = _MoneroDaemonRpc["default"];
                _context148.t1 = Object;
                _context148.next = 5;
                return this.getDaemonConnection();

              case 5:
                _context148.t2 = _context148.sent.getConfig();
                _context148.t3 = {
                  proxyToWorker: false
                };
                _context148.t4 = _context148.t1.assign.call(_context148.t1, _context148.t2, _context148.t3);
                daemon = new _context148.t0(_context148.t4);
                _context148.next = 11;
                return daemon.stopMining();

              case 11:
              case "end":
                return _context148.stop();
            }
          }
        }, _callee148, this);
      }));

      function stopMining() {
        return _stopMining.apply(this, arguments);
      }

      return stopMining;
    }()
  }, {
    key: "isMultisigImportNeeded",
    value: function () {
      var _isMultisigImportNeeded = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee150() {
        var that;
        return _regenerator["default"].wrap(function _callee150$(_context150) {
          while (1) {
            switch (_context150.prev = _context150.next) {
              case 0:
                that = this;
                return _context150.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee149() {
                  return _regenerator["default"].wrap(function _callee149$(_context149) {
                    while (1) {
                      switch (_context149.prev = _context149.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context149.abrupt("return", that._module.is_multisig_import_needed(that._cppAddress));

                        case 2:
                        case "end":
                          return _context149.stop();
                      }
                    }
                  }, _callee149);
                }))));

              case 2:
              case "end":
                return _context150.stop();
            }
          }
        }, _callee150, this);
      }));

      function isMultisigImportNeeded() {
        return _isMultisigImportNeeded.apply(this, arguments);
      }

      return isMultisigImportNeeded;
    }()
  }, {
    key: "isMultisig",
    value: function () {
      var _isMultisig = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee152() {
        var that;
        return _regenerator["default"].wrap(function _callee152$(_context152) {
          while (1) {
            switch (_context152.prev = _context152.next) {
              case 0:
                that = this;
                return _context152.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee151() {
                  return _regenerator["default"].wrap(function _callee151$(_context151) {
                    while (1) {
                      switch (_context151.prev = _context151.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context151.abrupt("return", that._module.is_multisig(that._cppAddress));

                        case 2:
                        case "end":
                          return _context151.stop();
                      }
                    }
                  }, _callee151);
                }))));

              case 2:
              case "end":
                return _context152.stop();
            }
          }
        }, _callee152, this);
      }));

      function isMultisig() {
        return _isMultisig.apply(this, arguments);
      }

      return isMultisig;
    }()
  }, {
    key: "getMultisigInfo",
    value: function () {
      var _getMultisigInfo = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee154() {
        var that;
        return _regenerator["default"].wrap(function _callee154$(_context154) {
          while (1) {
            switch (_context154.prev = _context154.next) {
              case 0:
                that = this;
                return _context154.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee153() {
                  return _regenerator["default"].wrap(function _callee153$(_context153) {
                    while (1) {
                      switch (_context153.prev = _context153.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context153.abrupt("return", new _MoneroMultisigInfo["default"](JSON.parse(that._module.get_multisig_info(that._cppAddress))));

                        case 2:
                        case "end":
                          return _context153.stop();
                      }
                    }
                  }, _callee153);
                }))));

              case 2:
              case "end":
                return _context154.stop();
            }
          }
        }, _callee154, this);
      }));

      function getMultisigInfo() {
        return _getMultisigInfo.apply(this, arguments);
      }

      return getMultisigInfo;
    }()
  }, {
    key: "prepareMultisig",
    value: function () {
      var _prepareMultisig = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee156() {
        var that;
        return _regenerator["default"].wrap(function _callee156$(_context156) {
          while (1) {
            switch (_context156.prev = _context156.next) {
              case 0:
                that = this;
                return _context156.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee155() {
                  return _regenerator["default"].wrap(function _callee155$(_context155) {
                    while (1) {
                      switch (_context155.prev = _context155.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context155.abrupt("return", that._module.prepare_multisig(that._cppAddress));

                        case 2:
                        case "end":
                          return _context155.stop();
                      }
                    }
                  }, _callee155);
                }))));

              case 2:
              case "end":
                return _context156.stop();
            }
          }
        }, _callee156, this);
      }));

      function prepareMultisig() {
        return _prepareMultisig.apply(this, arguments);
      }

      return prepareMultisig;
    }()
  }, {
    key: "makeMultisig",
    value: function () {
      var _makeMultisig = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee158(multisigHexes, threshold, password) {
        var that;
        return _regenerator["default"].wrap(function _callee158$(_context158) {
          while (1) {
            switch (_context158.prev = _context158.next) {
              case 0:
                that = this;
                return _context158.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee157() {
                  return _regenerator["default"].wrap(function _callee157$(_context157) {
                    while (1) {
                      switch (_context157.prev = _context157.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context157.abrupt("return", new Promise(function (resolve, reject) {
                            that._module.make_multisig(that._cppAddress, JSON.stringify({
                              multisigHexes: multisigHexes,
                              threshold: threshold,
                              password: password
                            }), function (resp) {
                              var errorKey = "error: ";
                              if (resp.indexOf(errorKey) === 0) reject(new _MoneroError["default"](resp.substring(errorKey.length)));else resolve(resp);
                            });
                          }));

                        case 2:
                        case "end":
                          return _context157.stop();
                      }
                    }
                  }, _callee157);
                }))));

              case 2:
              case "end":
                return _context158.stop();
            }
          }
        }, _callee158, this);
      }));

      function makeMultisig(_x105, _x106, _x107) {
        return _makeMultisig.apply(this, arguments);
      }

      return makeMultisig;
    }()
  }, {
    key: "exchangeMultisigKeys",
    value: function () {
      var _exchangeMultisigKeys = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee160(multisigHexes, password) {
        var that;
        return _regenerator["default"].wrap(function _callee160$(_context160) {
          while (1) {
            switch (_context160.prev = _context160.next) {
              case 0:
                that = this;
                return _context160.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee159() {
                  return _regenerator["default"].wrap(function _callee159$(_context159) {
                    while (1) {
                      switch (_context159.prev = _context159.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context159.abrupt("return", new Promise(function (resolve, reject) {
                            that._module.exchange_multisig_keys(that._cppAddress, JSON.stringify({
                              multisigHexes: multisigHexes,
                              password: password
                            }), function (resp) {
                              var errorKey = "error: ";
                              if (resp.indexOf(errorKey) === 0) reject(new _MoneroError["default"](resp.substring(errorKey.length)));else resolve(new _MoneroMultisigInitResult["default"](JSON.parse(resp)));
                            });
                          }));

                        case 2:
                        case "end":
                          return _context159.stop();
                      }
                    }
                  }, _callee159);
                }))));

              case 2:
              case "end":
                return _context160.stop();
            }
          }
        }, _callee160, this);
      }));

      function exchangeMultisigKeys(_x108, _x109) {
        return _exchangeMultisigKeys.apply(this, arguments);
      }

      return exchangeMultisigKeys;
    }()
  }, {
    key: "exportMultisigHex",
    value: function () {
      var _exportMultisigHex = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee162() {
        var that;
        return _regenerator["default"].wrap(function _callee162$(_context162) {
          while (1) {
            switch (_context162.prev = _context162.next) {
              case 0:
                that = this;
                return _context162.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee161() {
                  return _regenerator["default"].wrap(function _callee161$(_context161) {
                    while (1) {
                      switch (_context161.prev = _context161.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context161.abrupt("return", that._module.export_multisig_hex(that._cppAddress));

                        case 2:
                        case "end":
                          return _context161.stop();
                      }
                    }
                  }, _callee161);
                }))));

              case 2:
              case "end":
                return _context162.stop();
            }
          }
        }, _callee162, this);
      }));

      function exportMultisigHex() {
        return _exportMultisigHex.apply(this, arguments);
      }

      return exportMultisigHex;
    }()
  }, {
    key: "importMultisigHex",
    value: function () {
      var _importMultisigHex = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee164(multisigHexes) {
        var that;
        return _regenerator["default"].wrap(function _callee164$(_context164) {
          while (1) {
            switch (_context164.prev = _context164.next) {
              case 0:
                if (_GenUtils["default"].isArray(multisigHexes)) {
                  _context164.next = 2;
                  break;
                }

                throw new _MoneroError["default"]("Must provide string[] to importMultisigHex()");

              case 2:
                that = this;
                return _context164.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee163() {
                  return _regenerator["default"].wrap(function _callee163$(_context163) {
                    while (1) {
                      switch (_context163.prev = _context163.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context163.abrupt("return", new Promise(function (resolve, reject) {
                            var callbackFn = function callbackFn(resp) {
                              if (typeof resp === "string") reject(new _MoneroError["default"](resp));else resolve(resp);
                            };

                            that._module.import_multisig_hex(that._cppAddress, JSON.stringify({
                              multisigHexes: multisigHexes
                            }), callbackFn);
                          }));

                        case 2:
                        case "end":
                          return _context163.stop();
                      }
                    }
                  }, _callee163);
                }))));

              case 4:
              case "end":
                return _context164.stop();
            }
          }
        }, _callee164, this);
      }));

      function importMultisigHex(_x110) {
        return _importMultisigHex.apply(this, arguments);
      }

      return importMultisigHex;
    }()
  }, {
    key: "signMultisigTxHex",
    value: function () {
      var _signMultisigTxHex = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee167(multisigTxHex) {
        var that;
        return _regenerator["default"].wrap(function _callee167$(_context167) {
          while (1) {
            switch (_context167.prev = _context167.next) {
              case 0:
                that = this;
                return _context167.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee166() {
                  return _regenerator["default"].wrap(function _callee166$(_context166) {
                    while (1) {
                      switch (_context166.prev = _context166.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context166.abrupt("return", new Promise(function (resolve, reject) {
                            var callbackFn = /*#__PURE__*/function () {
                              var _ref80 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee165(resp) {
                                return _regenerator["default"].wrap(function _callee165$(_context165) {
                                  while (1) {
                                    switch (_context165.prev = _context165.next) {
                                      case 0:
                                        if (resp.charAt(0) !== "{") reject(new _MoneroError["default"](resp));else resolve(new _MoneroMultisigSignResult["default"](JSON.parse(resp)));

                                      case 1:
                                      case "end":
                                        return _context165.stop();
                                    }
                                  }
                                }, _callee165);
                              }));

                              return function callbackFn(_x112) {
                                return _ref80.apply(this, arguments);
                              };
                            }();

                            that._module.sign_multisig_tx_hex(that._cppAddress, multisigTxHex, callbackFn);
                          }));

                        case 2:
                        case "end":
                          return _context166.stop();
                      }
                    }
                  }, _callee166);
                }))));

              case 2:
              case "end":
                return _context167.stop();
            }
          }
        }, _callee167, this);
      }));

      function signMultisigTxHex(_x111) {
        return _signMultisigTxHex.apply(this, arguments);
      }

      return signMultisigTxHex;
    }()
  }, {
    key: "submitMultisigTxHex",
    value: function () {
      var _submitMultisigTxHex = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee169(signedMultisigTxHex) {
        var that;
        return _regenerator["default"].wrap(function _callee169$(_context169) {
          while (1) {
            switch (_context169.prev = _context169.next) {
              case 0:
                that = this;
                return _context169.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee168() {
                  return _regenerator["default"].wrap(function _callee168$(_context168) {
                    while (1) {
                      switch (_context168.prev = _context168.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context168.abrupt("return", new Promise(function (resolve, reject) {
                            var callbackFn = function callbackFn(resp) {
                              resolve(JSON.parse(resp).txHashes);
                            };

                            that._module.submit_multisig_tx_hex(that._cppAddress, signedMultisigTxHex, callbackFn);
                          }));

                        case 2:
                        case "end":
                          return _context168.stop();
                      }
                    }
                  }, _callee168);
                }))));

              case 2:
              case "end":
                return _context169.stop();
            }
          }
        }, _callee169, this);
      }));

      function submitMultisigTxHex(_x113) {
        return _submitMultisigTxHex.apply(this, arguments);
      }

      return submitMultisigTxHex;
    }()
    /**
     * Get the wallet's keys and cache data.
     * 
     * @return {DataView[]} is the keys and cache data respectively
     */

  }, {
    key: "getData",
    value: function () {
      var _getData = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee171() {
        var viewOnly, that;
        return _regenerator["default"].wrap(function _callee171$(_context171) {
          while (1) {
            switch (_context171.prev = _context171.next) {
              case 0:
                this._assertNotClosed(); // queue call to wasm module


                _context171.next = 3;
                return this.isViewOnly();

              case 3:
                viewOnly = _context171.sent;
                that = this;
                return _context171.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee170() {
                  var views, cacheBufferLoc, view, i, keysBufferLoc, _i2;

                  return _regenerator["default"].wrap(function _callee170$(_context170) {
                    while (1) {
                      switch (_context170.prev = _context170.next) {
                        case 0:
                          that._assertNotClosed(); // store views in array


                          views = []; // malloc cache buffer and get buffer location in c++ heap

                          cacheBufferLoc = JSON.parse(that._module.get_cache_file_buffer(that._cppAddress, that._password)); // read binary data from heap to DataView

                          view = new DataView(new ArrayBuffer(cacheBufferLoc.length));

                          for (i = 0; i < cacheBufferLoc.length; i++) {
                            view.setInt8(i, that._module.HEAPU8[cacheBufferLoc.pointer / Uint8Array.BYTES_PER_ELEMENT + i]);
                          } // free binary on heap


                          that._module._free(cacheBufferLoc.pointer); // write cache file


                          views.push(Buffer.from(view.buffer)); // malloc keys buffer and get buffer location in c++ heap

                          keysBufferLoc = JSON.parse(that._module.get_keys_file_buffer(that._cppAddress, that._password, viewOnly)); // read binary data from heap to DataView

                          view = new DataView(new ArrayBuffer(keysBufferLoc.length));

                          for (_i2 = 0; _i2 < keysBufferLoc.length; _i2++) {
                            view.setInt8(_i2, that._module.HEAPU8[keysBufferLoc.pointer / Uint8Array.BYTES_PER_ELEMENT + _i2]);
                          } // free binary on heap


                          that._module._free(keysBufferLoc.pointer); // prepend keys file


                          views.unshift(Buffer.from(view.buffer));
                          return _context170.abrupt("return", views);

                        case 13:
                        case "end":
                          return _context170.stop();
                      }
                    }
                  }, _callee170);
                }))));

              case 6:
              case "end":
                return _context171.stop();
            }
          }
        }, _callee171, this);
      }));

      function getData() {
        return _getData.apply(this, arguments);
      }

      return getData;
    }()
  }, {
    key: "changePassword",
    value: function () {
      var _changePassword = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee174(oldPassword, newPassword) {
        var that;
        return _regenerator["default"].wrap(function _callee174$(_context174) {
          while (1) {
            switch (_context174.prev = _context174.next) {
              case 0:
                if (!(oldPassword !== this._password)) {
                  _context174.next = 2;
                  break;
                }

                throw new _MoneroError["default"]("Invalid original password.");

              case 2:
                // wallet2 verify_password loads from disk so verify password here
                that = this;
                _context174.next = 5;
                return that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee173() {
                  return _regenerator["default"].wrap(function _callee173$(_context173) {
                    while (1) {
                      switch (_context173.prev = _context173.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context173.abrupt("return", new Promise(function (resolve, reject) {
                            that._module.change_wallet_password(that._cppAddress, oldPassword, newPassword, /*#__PURE__*/function () {
                              var _ref84 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee172(errMsg) {
                                return _regenerator["default"].wrap(function _callee172$(_context172) {
                                  while (1) {
                                    switch (_context172.prev = _context172.next) {
                                      case 0:
                                        if (errMsg) reject(new _MoneroError["default"](errMsg));else resolve();

                                      case 1:
                                      case "end":
                                        return _context172.stop();
                                    }
                                  }
                                }, _callee172);
                              }));

                              return function (_x116) {
                                return _ref84.apply(this, arguments);
                              };
                            }());
                          }));

                        case 2:
                        case "end":
                          return _context173.stop();
                      }
                    }
                  }, _callee173);
                })));

              case 5:
                this._password = newPassword;

                if (!this._path) {
                  _context174.next = 9;
                  break;
                }

                _context174.next = 9;
                return this.save();

              case 9:
              case "end":
                return _context174.stop();
            }
          }
        }, _callee174, this);
      }));

      function changePassword(_x114, _x115) {
        return _changePassword.apply(this, arguments);
      }

      return changePassword;
    }()
  }, {
    key: "save",
    value: function () {
      var _save2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee175() {
        return _regenerator["default"].wrap(function _callee175$(_context175) {
          while (1) {
            switch (_context175.prev = _context175.next) {
              case 0:
                return _context175.abrupt("return", MoneroWalletFull._save(this));

              case 1:
              case "end":
                return _context175.stop();
            }
          }
        }, _callee175, this);
      }));

      function save() {
        return _save2.apply(this, arguments);
      }

      return save;
    }()
  }, {
    key: "close",
    value: function () {
      var _close = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee176(save) {
        return _regenerator["default"].wrap(function _callee176$(_context176) {
          while (1) {
            switch (_context176.prev = _context176.next) {
              case 0:
                if (!this._isClosed) {
                  _context176.next = 2;
                  break;
                }

                return _context176.abrupt("return");

              case 2:
                _context176.next = 4;
                return this._refreshListening();

              case 4:
                _context176.next = 6;
                return this.stopSyncing();

              case 6:
                _context176.next = 8;
                return (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroWalletFull.prototype), "close", this).call(this, save);

              case 8:
                delete this._path;
                delete this._password;
                delete this._listeners;
                delete this._fullListener;

                _LibraryUtils["default"].setRejectUnauthorizedFn(this._rejectUnauthorizedConfigId, undefined); // unregister fn informing if unauthorized reqs should be rejected


              case 13:
              case "end":
                return _context176.stop();
            }
          }
        }, _callee176, this);
      }));

      function close(_x117) {
        return _close.apply(this, arguments);
      }

      return close;
    }() // ----------- ADD JSDOC FOR SUPPORTED DEFAULT IMPLEMENTATIONS --------------

  }, {
    key: "getNumBlocksToUnlock",
    value: function () {
      var _getNumBlocksToUnlock = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee177() {
        var _args177 = arguments;
        return _regenerator["default"].wrap(function _callee177$(_context177) {
          while (1) {
            switch (_context177.prev = _context177.next) {
              case 0:
                return _context177.abrupt("return", (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroWalletFull.prototype), "getNumBlocksToUnlock", this).apply(this, _args177));

              case 1:
              case "end":
                return _context177.stop();
            }
          }
        }, _callee177, this);
      }));

      function getNumBlocksToUnlock() {
        return _getNumBlocksToUnlock.apply(this, arguments);
      }

      return getNumBlocksToUnlock;
    }()
  }, {
    key: "getTx",
    value: function () {
      var _getTx = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee178() {
        var _args178 = arguments;
        return _regenerator["default"].wrap(function _callee178$(_context178) {
          while (1) {
            switch (_context178.prev = _context178.next) {
              case 0:
                return _context178.abrupt("return", (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroWalletFull.prototype), "getTx", this).apply(this, _args178));

              case 1:
              case "end":
                return _context178.stop();
            }
          }
        }, _callee178, this);
      }));

      function getTx() {
        return _getTx.apply(this, arguments);
      }

      return getTx;
    }()
  }, {
    key: "getIncomingTransfers",
    value: function () {
      var _getIncomingTransfers = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee179() {
        var _args179 = arguments;
        return _regenerator["default"].wrap(function _callee179$(_context179) {
          while (1) {
            switch (_context179.prev = _context179.next) {
              case 0:
                return _context179.abrupt("return", (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroWalletFull.prototype), "getIncomingTransfers", this).apply(this, _args179));

              case 1:
              case "end":
                return _context179.stop();
            }
          }
        }, _callee179, this);
      }));

      function getIncomingTransfers() {
        return _getIncomingTransfers.apply(this, arguments);
      }

      return getIncomingTransfers;
    }()
  }, {
    key: "getOutgoingTransfers",
    value: function () {
      var _getOutgoingTransfers = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee180() {
        var _args180 = arguments;
        return _regenerator["default"].wrap(function _callee180$(_context180) {
          while (1) {
            switch (_context180.prev = _context180.next) {
              case 0:
                return _context180.abrupt("return", (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroWalletFull.prototype), "getOutgoingTransfers", this).apply(this, _args180));

              case 1:
              case "end":
                return _context180.stop();
            }
          }
        }, _callee180, this);
      }));

      function getOutgoingTransfers() {
        return _getOutgoingTransfers.apply(this, arguments);
      }

      return getOutgoingTransfers;
    }()
  }, {
    key: "createTx",
    value: function () {
      var _createTx = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee181() {
        var _args181 = arguments;
        return _regenerator["default"].wrap(function _callee181$(_context181) {
          while (1) {
            switch (_context181.prev = _context181.next) {
              case 0:
                return _context181.abrupt("return", (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroWalletFull.prototype), "createTx", this).apply(this, _args181));

              case 1:
              case "end":
                return _context181.stop();
            }
          }
        }, _callee181, this);
      }));

      function createTx() {
        return _createTx.apply(this, arguments);
      }

      return createTx;
    }()
  }, {
    key: "relayTx",
    value: function () {
      var _relayTx = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee182() {
        var _args182 = arguments;
        return _regenerator["default"].wrap(function _callee182$(_context182) {
          while (1) {
            switch (_context182.prev = _context182.next) {
              case 0:
                return _context182.abrupt("return", (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroWalletFull.prototype), "relayTx", this).apply(this, _args182));

              case 1:
              case "end":
                return _context182.stop();
            }
          }
        }, _callee182, this);
      }));

      function relayTx() {
        return _relayTx.apply(this, arguments);
      }

      return relayTx;
    }()
  }, {
    key: "getTxNote",
    value: function () {
      var _getTxNote = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee183() {
        var _args183 = arguments;
        return _regenerator["default"].wrap(function _callee183$(_context183) {
          while (1) {
            switch (_context183.prev = _context183.next) {
              case 0:
                return _context183.abrupt("return", (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroWalletFull.prototype), "getTxNote", this).apply(this, _args183));

              case 1:
              case "end":
                return _context183.stop();
            }
          }
        }, _callee183, this);
      }));

      function getTxNote() {
        return _getTxNote.apply(this, arguments);
      }

      return getTxNote;
    }()
  }, {
    key: "setTxNote",
    value: function () {
      var _setTxNote = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee184() {
        var _args184 = arguments;
        return _regenerator["default"].wrap(function _callee184$(_context184) {
          while (1) {
            switch (_context184.prev = _context184.next) {
              case 0:
                return _context184.abrupt("return", (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroWalletFull.prototype), "setTxNote", this).apply(this, _args184));

              case 1:
              case "end":
                return _context184.stop();
            }
          }
        }, _callee184, this);
      }));

      function setTxNote() {
        return _setTxNote.apply(this, arguments);
      }

      return setTxNote;
    }() // ---------------------------- PRIVATE HELPERS ----------------------------

  }, {
    key: "_backgroundSync",
    value: function () {
      var _backgroundSync2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee185() {
        var label;
        return _regenerator["default"].wrap(function _callee185$(_context185) {
          while (1) {
            switch (_context185.prev = _context185.next) {
              case 0:
                label = this._path ? this._path : this._browserMainPath ? this._browserMainPath : "in-memory wallet"; // label for log

                _LibraryUtils["default"].log(1, "Background synchronizing " + label);

                _context185.prev = 2;
                _context185.next = 5;
                return this.sync();

              case 5:
                _context185.next = 10;
                break;

              case 7:
                _context185.prev = 7;
                _context185.t0 = _context185["catch"](2);
                if (!this._isClosed) console.error("Failed to background synchronize " + label + ": " + _context185.t0.message);

              case 10:
              case "end":
                return _context185.stop();
            }
          }
        }, _callee185, this, [[2, 7]]);
      }));

      function _backgroundSync() {
        return _backgroundSync2.apply(this, arguments);
      }

      return _backgroundSync;
    }()
  }, {
    key: "_refreshListening",
    value: function () {
      var _refreshListening2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee192() {
        var isEnabled, that;
        return _regenerator["default"].wrap(function _callee192$(_context192) {
          while (1) {
            switch (_context192.prev = _context192.next) {
              case 0:
                isEnabled = this._listeners.length > 0;
                that = this;

                if (!(that._fullListenerHandle === 0 && !isEnabled || that._fullListenerHandle > 0 && isEnabled)) {
                  _context192.next = 4;
                  break;
                }

                return _context192.abrupt("return");

              case 4:
                return _context192.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee191() {
                  return _regenerator["default"].wrap(function _callee191$(_context191) {
                    while (1) {
                      switch (_context191.prev = _context191.next) {
                        case 0:
                          return _context191.abrupt("return", new Promise(function (resolve, reject) {
                            that._module.set_listener(that._cppAddress, that._fullListenerHandle, function (newListenerHandle) {
                              if (typeof newListenerHandle === "string") reject(new _MoneroError["default"](newListenerHandle));else {
                                that._fullListenerHandle = newListenerHandle;
                                resolve();
                              }
                            }, isEnabled ? /*#__PURE__*/function () {
                              var _ref86 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee186(height, startHeight, endHeight, percentDone, message) {
                                return _regenerator["default"].wrap(function _callee186$(_context186) {
                                  while (1) {
                                    switch (_context186.prev = _context186.next) {
                                      case 0:
                                        _context186.next = 2;
                                        return that._fullListener.onSyncProgress(height, startHeight, endHeight, percentDone, message);

                                      case 2:
                                      case "end":
                                        return _context186.stop();
                                    }
                                  }
                                }, _callee186);
                              }));

                              return function (_x118, _x119, _x120, _x121, _x122) {
                                return _ref86.apply(this, arguments);
                              };
                            }() : undefined, isEnabled ? /*#__PURE__*/function () {
                              var _ref87 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee187(height) {
                                return _regenerator["default"].wrap(function _callee187$(_context187) {
                                  while (1) {
                                    switch (_context187.prev = _context187.next) {
                                      case 0:
                                        _context187.next = 2;
                                        return that._fullListener.onNewBlock(height);

                                      case 2:
                                      case "end":
                                        return _context187.stop();
                                    }
                                  }
                                }, _callee187);
                              }));

                              return function (_x123) {
                                return _ref87.apply(this, arguments);
                              };
                            }() : undefined, isEnabled ? /*#__PURE__*/function () {
                              var _ref88 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee188(newBalanceStr, newUnlockedBalanceStr) {
                                return _regenerator["default"].wrap(function _callee188$(_context188) {
                                  while (1) {
                                    switch (_context188.prev = _context188.next) {
                                      case 0:
                                        _context188.next = 2;
                                        return that._fullListener.onBalancesChanged(newBalanceStr, newUnlockedBalanceStr);

                                      case 2:
                                      case "end":
                                        return _context188.stop();
                                    }
                                  }
                                }, _callee188);
                              }));

                              return function (_x124, _x125) {
                                return _ref88.apply(this, arguments);
                              };
                            }() : undefined, isEnabled ? /*#__PURE__*/function () {
                              var _ref89 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee189(height, txHash, amountStr, accountIdx, subaddressIdx, version, unlockHeight, isLocked) {
                                return _regenerator["default"].wrap(function _callee189$(_context189) {
                                  while (1) {
                                    switch (_context189.prev = _context189.next) {
                                      case 0:
                                        _context189.next = 2;
                                        return that._fullListener.onOutputReceived(height, txHash, amountStr, accountIdx, subaddressIdx, version, unlockHeight, isLocked);

                                      case 2:
                                      case "end":
                                        return _context189.stop();
                                    }
                                  }
                                }, _callee189);
                              }));

                              return function (_x126, _x127, _x128, _x129, _x130, _x131, _x132, _x133) {
                                return _ref89.apply(this, arguments);
                              };
                            }() : undefined, isEnabled ? /*#__PURE__*/function () {
                              var _ref90 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee190(height, txHash, amountStr, accountIdxStr, subaddressIdxStr, version, unlockHeight, isLocked) {
                                return _regenerator["default"].wrap(function _callee190$(_context190) {
                                  while (1) {
                                    switch (_context190.prev = _context190.next) {
                                      case 0:
                                        _context190.next = 2;
                                        return that._fullListener.onOutputSpent(height, txHash, amountStr, accountIdxStr, subaddressIdxStr, version, unlockHeight, isLocked);

                                      case 2:
                                      case "end":
                                        return _context190.stop();
                                    }
                                  }
                                }, _callee190);
                              }));

                              return function (_x134, _x135, _x136, _x137, _x138, _x139, _x140, _x141) {
                                return _ref90.apply(this, arguments);
                              };
                            }() : undefined);
                          }));

                        case 1:
                        case "end":
                          return _context191.stop();
                      }
                    }
                  }, _callee191);
                }))));

              case 5:
              case "end":
                return _context192.stop();
            }
          }
        }, _callee192, this);
      }));

      function _refreshListening() {
        return _refreshListening2.apply(this, arguments);
      }

      return _refreshListening;
    }()
  }, {
    key: "_setBrowserMainPath",
    value:
    /**
     * Set the path of the wallet on the browser main thread if run as a worker.
     * 
     * @param {string} browserMainPath - path of the wallet on the browser main thread
     */
    function _setBrowserMainPath(browserMainPath) {
      this._browserMainPath = browserMainPath;
    }
  }], [{
    key: "walletExists",
    value: // --------------------------- STATIC UTILITIES -----------------------------

    /**
     * Check if a wallet exists at a given path.
     * 
     * @param {string} path - path of the wallet on the file system
     * @param {fs} - Node.js compatible file system to use (optional, defaults to disk if nodejs)
     * @return {boolean} true if a wallet exists at the given path, false otherwise
     */
    function walletExists(path, fs) {
      (0, _assert["default"])(path, "Must provide a path to look for a wallet");
      if (!fs) fs = MoneroWalletFull._getFs();
      if (!fs) throw new _MoneroError["default"]("Must provide file system to check if wallet exists");
      var exists = fs.existsSync(path + ".keys");

      _LibraryUtils["default"].log(1, "Wallet exists at " + path + ": " + exists);

      return exists;
    }
    /**
     * <p>Open an existing wallet using WebAssembly bindings to wallet2.h.</p>
     * 
     * <p>Examples:<p>
     * 
     * <code>
     * let wallet1 = await MoneroWalletFull.openWallet(<br>
     * &nbsp;&nbsp; "./wallets/wallet1",<br>
     * &nbsp;&nbsp; "supersecretpassword",<br>
     * &nbsp;&nbsp; MoneroNetworkType.STAGENET,<br>
     * &nbsp;&nbsp; "http://localhost:38081" // daemon uri<br>
     * );<br><br>
     * 
     * let wallet2 = await MoneroWalletFull.openWallet({<br>
     * &nbsp;&nbsp; path: "./wallets/wallet2",<br>
     * &nbsp;&nbsp; password: "supersecretpassword",<br>
     * &nbsp;&nbsp; networkType: MoneroNetworkType.STAGENET,<br>
     * &nbsp;&nbsp; serverUri: "http://localhost:38081", // daemon configuration<br>
     * &nbsp;&nbsp; serverUsername: "superuser",<br>
     * &nbsp;&nbsp; serverPassword: "abctesting123"<br>
     * });
     * </code>
     * 
     * @param {MoneroWalletConfig|object|string} configOrPath - MoneroWalletConfig or equivalent config object or a path to a wallet to open
     * @param {string} configOrPath.path - path of the wallet to open (optional if 'keysData' provided)
     * @param {string} configOrPath.password - password of the wallet to open
     * @param {string|number} configOrPath.networkType - network type of the wallet to open (one of "mainnet", "testnet", "stagenet" or MoneroNetworkType.MAINNET|TESTNET|STAGENET)
     * @param {Uint8Array} configOrPath.keysData - wallet keys data to open (optional if path provided)
     * @param {Uint8Array} [configOrPath.cacheData] - wallet cache data to open (optional)
     * @param {string} [configOrPath.serverUri] - uri of the wallet's daemon (optional)
     * @param {string} [configOrPath.serverUsername] - username to authenticate with the daemon (optional)
     * @param {string} [configOrPath.serverPassword] - password to authenticate with the daemon (optional)
     * @param {boolean} [configOrPath.rejectUnauthorized] - reject self-signed server certificates if true (default true)
     * @param {MoneroRpcConnection|object} [configOrPath.server] - MoneroRpcConnection or equivalent JS object configuring the daemon connection (optional)
     * @param {boolean} [configOrPath.proxyToWorker] - proxies wallet operations to a worker in order to not block the main thread (default true)
     * @param {fs} [configOrPath.fs] - Node.js compatible file system to use (defaults to disk or in-memory FS if browser)
     * @param {string} password - password of the wallet to open
     * @param {string|number} networkType - network type of the wallet to open
     * @param {string|MoneroRpcConnection} daemonUriOrConnection - daemon URI or MoneroRpcConnection
     * @param {boolean} [proxyToWorker] - proxies wallet operations to a worker in order to not block the main thread (default true)
     * @param {fs} [fs] - Node.js compatible file system to use (defaults to disk or in-memory FS if browser)
     * @return {MoneroWalletFull} the opened wallet
     */

  }, {
    key: "openWallet",
    value: function () {
      var _openWallet = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee193(configOrPath, password, networkType, daemonUriOrConnection, proxyToWorker, fs) {
        var config, _fs;

        return _regenerator["default"].wrap(function _callee193$(_context193) {
          while (1) {
            switch (_context193.prev = _context193.next) {
              case 0:
                if (!((0, _typeof2["default"])(configOrPath) === "object")) {
                  _context193.next = 6;
                  break;
                }

                config = configOrPath instanceof _MoneroWalletConfig["default"] ? configOrPath : new _MoneroWalletConfig["default"](configOrPath);

                if (!(password !== undefined || networkType !== undefined || daemonUriOrConnection !== undefined || proxyToWorker !== undefined || fs !== undefined)) {
                  _context193.next = 4;
                  break;
                }

                throw new _MoneroError["default"]("Can specify config object or params but not both when opening WASM wallet");

              case 4:
                _context193.next = 8;
                break;

              case 6:
                config = new _MoneroWalletConfig["default"]().setPath(configOrPath).setPassword(password).setNetworkType(networkType).setProxyToWorker(proxyToWorker).setFs(fs);
                if ((0, _typeof2["default"])(daemonUriOrConnection) === "object") config.setServer(daemonUriOrConnection);else config.setServerUri(daemonUriOrConnection);

              case 8:
                if (config.getProxyToWorker() === undefined) config.setProxyToWorker(true);

                if (!(config.getMnemonic() !== undefined)) {
                  _context193.next = 11;
                  break;
                }

                throw new _MoneroError["default"]("Cannot specify mnemonic when opening wallet");

              case 11:
                if (!(config.getSeedOffset() !== undefined)) {
                  _context193.next = 13;
                  break;
                }

                throw new _MoneroError["default"]("Cannot specify seed offset when opening wallet");

              case 13:
                if (!(config.getPrimaryAddress() !== undefined)) {
                  _context193.next = 15;
                  break;
                }

                throw new _MoneroError["default"]("Cannot specify primary address when opening wallet");

              case 15:
                if (!(config.getPrivateViewKey() !== undefined)) {
                  _context193.next = 17;
                  break;
                }

                throw new _MoneroError["default"]("Cannot specify private view key when opening wallet");

              case 17:
                if (!(config.getPrivateSpendKey() !== undefined)) {
                  _context193.next = 19;
                  break;
                }

                throw new _MoneroError["default"]("Cannot specify private spend key when opening wallet");

              case 19:
                if (!(config.getRestoreHeight() !== undefined)) {
                  _context193.next = 21;
                  break;
                }

                throw new _MoneroError["default"]("Cannot specify restore height when opening wallet");

              case 21:
                if (!(config.getLanguage() !== undefined)) {
                  _context193.next = 23;
                  break;
                }

                throw new _MoneroError["default"]("Cannot specify language when opening wallet");

              case 23:
                if (!(config.getSaveCurrent() === true)) {
                  _context193.next = 25;
                  break;
                }

                throw new _MoneroError["default"]("Cannot save current wallet when opening JNI wallet");

              case 25:
                if (config.getKeysData()) {
                  _context193.next = 33;
                  break;
                }

                _fs = config.getFs() ? config.getFs() : MoneroWalletFull._getFs();

                if (_fs) {
                  _context193.next = 29;
                  break;
                }

                throw new _MoneroError["default"]("Must provide file system to read wallet data from");

              case 29:
                if (this.walletExists(config.getPath(), _fs)) {
                  _context193.next = 31;
                  break;
                }

                throw new _MoneroError["default"]("Wallet does not exist at path: " + config.getPath());

              case 31:
                config.setKeysData(_fs.readFileSync(config.getPath() + ".keys"));
                config.setCacheData(_fs.existsSync(config.getPath()) ? _fs.readFileSync(config.getPath()) : "");

              case 33:
                return _context193.abrupt("return", MoneroWalletFull._openWalletData(config.getPath(), config.getPassword(), config.getNetworkType(), config.getKeysData(), config.getCacheData(), config.getServer(), config.getProxyToWorker(), config.getFs()));

              case 34:
              case "end":
                return _context193.stop();
            }
          }
        }, _callee193, this);
      }));

      function openWallet(_x142, _x143, _x144, _x145, _x146, _x147) {
        return _openWallet.apply(this, arguments);
      }

      return openWallet;
    }()
    /**
     * <p>Create a wallet using WebAssembly bindings to wallet2.h.<p>
     * 
     * <p>Example:</p>
     * 
     * <code>
     * let wallet = await MoneroWalletFull.createWallet({<br>
     * &nbsp;&nbsp; path: "./test_wallets/wallet1", // leave blank for in-memory wallet<br>
     * &nbsp;&nbsp; password: "supersecretpassword",<br>
     * &nbsp;&nbsp; networkType: MoneroNetworkType.STAGENET,<br>
     * &nbsp;&nbsp; mnemonic: "coexist igloo pamphlet lagoon...",<br>
     * &nbsp;&nbsp; restoreHeight: 1543218,<br>
     * &nbsp;&nbsp; server: new MoneroRpcConnection("http://localhost:38081", "daemon_user", "daemon_password_123"),<br>
     * });
     * </code>
     * 
     * @param {object|MoneroWalletConfig} config - MoneroWalletConfig or equivalent config object
     * @param {string} config.path - path of the wallet to create (optional, in-memory wallet if not given)
     * @param {string} config.password - password of the wallet to create
     * @param {string|number} config.networkType - network type of the wallet to create (one of "mainnet", "testnet", "stagenet" or MoneroNetworkType.MAINNET|TESTNET|STAGENET)
     * @param {string} config.mnemonic - mnemonic of the wallet to create (optional, random wallet created if neither mnemonic nor keys given)
     * @param {string} config.seedOffset - the offset used to derive a new seed from the given mnemonic to recover a secret wallet from the mnemonic phrase
     * @param {string} config.primaryAddress - primary address of the wallet to create (only provide if restoring from keys)
     * @param {string} [config.privateViewKey] - private view key of the wallet to create (optional)
     * @param {string} [config.privateSpendKey] - private spend key of the wallet to create (optional)
     * @param {number} [config.restoreHeight] - block height to start scanning from (defaults to 0 unless generating random wallet)
     * @param {string} [config.language] - language of the wallet's mnemonic phrase (defaults to "English" or auto-detected)
     * @param {string} [config.serverUri] - uri of the wallet's daemon (optional)
     * @param {string} [config.serverUsername] - username to authenticate with the daemon (optional)
     * @param {string} [config.serverPassword] - password to authenticate with the daemon (optional)
     * @param {boolean} [config.rejectUnauthorized] - reject self-signed server certificates if true (defaults to true)
     * @param {MoneroRpcConnection|object} [config.server] - MoneroRpcConnection or equivalent JS object providing daemon configuration (optional)
     * @param {boolean} [config.proxyToWorker] - proxies wallet operations to a worker in order to not block the main thread (default true)
     * @param {fs} [config.fs] - Node.js compatible file system to use (defaults to disk or in-memory FS if browser)
     * @return {MoneroWalletFull} the created wallet
     */

  }, {
    key: "createWallet",
    value: function () {
      var _createWallet = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee194(config) {
        return _regenerator["default"].wrap(function _callee194$(_context194) {
          while (1) {
            switch (_context194.prev = _context194.next) {
              case 0:
                if (!(config === undefined)) {
                  _context194.next = 2;
                  break;
                }

                throw new _MoneroError["default"]("Must provide config to create wallet");

              case 2:
                config = config instanceof _MoneroWalletConfig["default"] ? config : new _MoneroWalletConfig["default"](config);

                if (!(config.getMnemonic() !== undefined && (config.getPrimaryAddress() !== undefined || config.getPrivateViewKey() !== undefined || config.getPrivateSpendKey() !== undefined))) {
                  _context194.next = 5;
                  break;
                }

                throw new _MoneroError["default"]("Wallet may be initialized with a mnemonic or keys but not both");

              case 5:
                if (!(config.getNetworkType() === undefined)) {
                  _context194.next = 7;
                  break;
                }

                throw new _MoneroError["default"]("Must provide a networkType: 'mainnet', 'testnet' or 'stagenet'");

              case 7:
                _MoneroNetworkType["default"].validate(config.getNetworkType());

                if (!(config.getSaveCurrent() === true)) {
                  _context194.next = 10;
                  break;
                }

                throw new _MoneroError["default"]("Cannot save current wallet when creating full WASM wallet");

              case 10:
                if (config.getPath() === undefined) config.setPath("");

                if (!(config.getPath() && MoneroWalletFull.walletExists(config.getPath(), config.getFs()))) {
                  _context194.next = 13;
                  break;
                }

                throw new _MoneroError["default"]("Wallet already exists: " + config.getPath());

              case 13:
                if (config.getPassword()) {
                  _context194.next = 15;
                  break;
                }

                throw new _MoneroError["default"]("Must provide a password to create the wallet with");

              case 15:
                if (!(config.getMnemonic() !== undefined)) {
                  _context194.next = 21;
                  break;
                }

                if (!(config.getLanguage() !== undefined)) {
                  _context194.next = 18;
                  break;
                }

                throw new _MoneroError["default"]("Cannot provide language when creating wallet from mnemonic");

              case 18:
                return _context194.abrupt("return", MoneroWalletFull._createWalletFromMnemonic(config));

              case 21:
                if (!(config.getPrivateSpendKey() !== undefined || config.getPrimaryAddress() !== undefined)) {
                  _context194.next = 27;
                  break;
                }

                if (!(config.getSeedOffset() !== undefined)) {
                  _context194.next = 24;
                  break;
                }

                throw new _MoneroError["default"]("Cannot provide seedOffset when creating wallet from keys");

              case 24:
                return _context194.abrupt("return", MoneroWalletFull._createWalletFromKeys(config));

              case 27:
                if (!(config.getSeedOffset() !== undefined)) {
                  _context194.next = 29;
                  break;
                }

                throw new _MoneroError["default"]("Cannot provide seedOffset when creating random wallet");

              case 29:
                if (!(config.getRestoreHeight() !== undefined)) {
                  _context194.next = 31;
                  break;
                }

                throw new _MoneroError["default"]("Cannot provide restoreHeight when creating random wallet");

              case 31:
                return _context194.abrupt("return", MoneroWalletFull._createWalletRandom(config));

              case 32:
              case "end":
                return _context194.stop();
            }
          }
        }, _callee194);
      }));

      function createWallet(_x148) {
        return _createWallet.apply(this, arguments);
      }

      return createWallet;
    }()
  }, {
    key: "_createWalletFromMnemonic",
    value: function () {
      var _createWalletFromMnemonic2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee197(config) {
        var daemonConnection, rejectUnauthorized, module, wallet;
        return _regenerator["default"].wrap(function _callee197$(_context197) {
          while (1) {
            switch (_context197.prev = _context197.next) {
              case 0:
                if (config.getProxyToWorker() === undefined) config.setProxyToWorker(true);

                if (!config.getProxyToWorker()) {
                  _context197.next = 3;
                  break;
                }

                return _context197.abrupt("return", MoneroWalletFullProxy._createWallet(config));

              case 3:
                // validate and normalize params
                daemonConnection = config.getServer();
                rejectUnauthorized = daemonConnection ? daemonConnection.getRejectUnauthorized() : true;
                if (config.getRestoreHeight() === undefined) config.setRestoreHeight(0);
                if (config.getSeedOffset() === undefined) config.setSeedOffset(""); // load full wasm module

                _context197.next = 9;
                return _LibraryUtils["default"].loadFullModule();

              case 9:
                module = _context197.sent;
                _context197.next = 12;
                return module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee196() {
                  return _regenerator["default"].wrap(function _callee196$(_context196) {
                    while (1) {
                      switch (_context196.prev = _context196.next) {
                        case 0:
                          return _context196.abrupt("return", new Promise(function (resolve, reject) {
                            // register fn informing if unauthorized reqs should be rejected
                            var rejectUnauthorizedFnId = _GenUtils["default"].getUUID();

                            _LibraryUtils["default"].setRejectUnauthorizedFn(rejectUnauthorizedFnId, function () {
                              return rejectUnauthorized;
                            }); // define callback for wasm


                            var callbackFn = /*#__PURE__*/function () {
                              var _ref92 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee195(cppAddress) {
                                return _regenerator["default"].wrap(function _callee195$(_context195) {
                                  while (1) {
                                    switch (_context195.prev = _context195.next) {
                                      case 0:
                                        if (typeof cppAddress === "string") reject(new _MoneroError["default"](cppAddress));else resolve(new MoneroWalletFull(cppAddress, config.getPath(), config.getPassword(), config.getFs(), config.getRejectUnauthorized(), rejectUnauthorizedFnId));

                                      case 1:
                                      case "end":
                                        return _context195.stop();
                                    }
                                  }
                                }, _callee195);
                              }));

                              return function callbackFn(_x150) {
                                return _ref92.apply(this, arguments);
                              };
                            }(); // create wallet in wasm and invoke callback when done


                            module.create_full_wallet(JSON.stringify(config.toJson()), rejectUnauthorizedFnId, callbackFn);
                          }));

                        case 1:
                        case "end":
                          return _context196.stop();
                      }
                    }
                  }, _callee196);
                })));

              case 12:
                wallet = _context197.sent;

                if (!config.getPath()) {
                  _context197.next = 16;
                  break;
                }

                _context197.next = 16;
                return wallet.save();

              case 16:
                return _context197.abrupt("return", wallet);

              case 17:
              case "end":
                return _context197.stop();
            }
          }
        }, _callee197);
      }));

      function _createWalletFromMnemonic(_x149) {
        return _createWalletFromMnemonic2.apply(this, arguments);
      }

      return _createWalletFromMnemonic;
    }()
  }, {
    key: "_createWalletFromKeys",
    value: function () {
      var _createWalletFromKeys2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee200(config) {
        var daemonConnection, rejectUnauthorized, module, wallet;
        return _regenerator["default"].wrap(function _callee200$(_context200) {
          while (1) {
            switch (_context200.prev = _context200.next) {
              case 0:
                if (config.getProxyToWorker() === undefined) config.setProxyToWorker(true);

                if (!config.getProxyToWorker()) {
                  _context200.next = 3;
                  break;
                }

                return _context200.abrupt("return", MoneroWalletFullProxy._createWallet(config));

              case 3:
                // validate and normalize params
                _MoneroNetworkType["default"].validate(config.getNetworkType());

                if (config.getPrimaryAddress() === undefined) config.setPrimaryAddress("");
                if (config.getPrivateViewKey() === undefined) config.setPrivateViewKey("");
                if (config.getPrivateSpendKey() === undefined) config.setPrivateSpendKey("");
                daemonConnection = config.getServer();
                rejectUnauthorized = daemonConnection ? daemonConnection.getRejectUnauthorized() : true;
                if (config.getRestoreHeight() === undefined) config.setRestoreHeight(0);
                if (config.getLanguage() === undefined) config.setLanguage("English"); // load full wasm module

                _context200.next = 13;
                return _LibraryUtils["default"].loadFullModule();

              case 13:
                module = _context200.sent;
                _context200.next = 16;
                return module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee199() {
                  return _regenerator["default"].wrap(function _callee199$(_context199) {
                    while (1) {
                      switch (_context199.prev = _context199.next) {
                        case 0:
                          return _context199.abrupt("return", new Promise(function (resolve, reject) {
                            // register fn informing if unauthorized reqs should be rejected
                            var rejectUnauthorizedFnId = _GenUtils["default"].getUUID();

                            _LibraryUtils["default"].setRejectUnauthorizedFn(rejectUnauthorizedFnId, function () {
                              return rejectUnauthorized;
                            }); // define callback for wasm


                            var callbackFn = /*#__PURE__*/function () {
                              var _ref94 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee198(cppAddress) {
                                return _regenerator["default"].wrap(function _callee198$(_context198) {
                                  while (1) {
                                    switch (_context198.prev = _context198.next) {
                                      case 0:
                                        if (typeof cppAddress === "string") reject(new _MoneroError["default"](cppAddress));else resolve(new MoneroWalletFull(cppAddress, config.getPath(), config.getPassword(), config.getFs(), config.getRejectUnauthorized(), rejectUnauthorizedFnId));

                                      case 1:
                                      case "end":
                                        return _context198.stop();
                                    }
                                  }
                                }, _callee198);
                              }));

                              return function callbackFn(_x152) {
                                return _ref94.apply(this, arguments);
                              };
                            }(); // create wallet in wasm and invoke callback when done


                            module.create_full_wallet(JSON.stringify(config.toJson()), rejectUnauthorizedFnId, callbackFn);
                          }));

                        case 1:
                        case "end":
                          return _context199.stop();
                      }
                    }
                  }, _callee199);
                })));

              case 16:
                wallet = _context200.sent;

                if (!config.getPath()) {
                  _context200.next = 20;
                  break;
                }

                _context200.next = 20;
                return wallet.save();

              case 20:
                return _context200.abrupt("return", wallet);

              case 21:
              case "end":
                return _context200.stop();
            }
          }
        }, _callee200);
      }));

      function _createWalletFromKeys(_x151) {
        return _createWalletFromKeys2.apply(this, arguments);
      }

      return _createWalletFromKeys;
    }()
  }, {
    key: "_createWalletRandom",
    value: function () {
      var _createWalletRandom2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee203(config) {
        var daemonConnection, rejectUnauthorized, module, wallet;
        return _regenerator["default"].wrap(function _callee203$(_context203) {
          while (1) {
            switch (_context203.prev = _context203.next) {
              case 0:
                if (config.getProxyToWorker() === undefined) config.setProxyToWorker(true);

                if (!config.getProxyToWorker()) {
                  _context203.next = 3;
                  break;
                }

                return _context203.abrupt("return", MoneroWalletFullProxy._createWallet(config));

              case 3:
                // validate and normalize params
                if (config.getLanguage() === undefined) config.setLanguage("English");
                daemonConnection = config.getServer();
                rejectUnauthorized = daemonConnection ? daemonConnection.getRejectUnauthorized() : true; // load wasm module

                _context203.next = 8;
                return _LibraryUtils["default"].loadFullModule();

              case 8:
                module = _context203.sent;
                _context203.next = 11;
                return module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee202() {
                  return _regenerator["default"].wrap(function _callee202$(_context202) {
                    while (1) {
                      switch (_context202.prev = _context202.next) {
                        case 0:
                          return _context202.abrupt("return", new Promise(function (resolve, reject) {
                            // register fn informing if unauthorized reqs should be rejected
                            var rejectUnauthorizedFnId = _GenUtils["default"].getUUID();

                            _LibraryUtils["default"].setRejectUnauthorizedFn(rejectUnauthorizedFnId, function () {
                              return rejectUnauthorized;
                            }); // define callback for wasm


                            var callbackFn = /*#__PURE__*/function () {
                              var _ref96 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee201(cppAddress) {
                                return _regenerator["default"].wrap(function _callee201$(_context201) {
                                  while (1) {
                                    switch (_context201.prev = _context201.next) {
                                      case 0:
                                        if (typeof cppAddress === "string") reject(new _MoneroError["default"](cppAddress));else resolve(new MoneroWalletFull(cppAddress, config.getPath(), config.getPassword(), config.getFs(), config.getRejectUnauthorized(), rejectUnauthorizedFnId));

                                      case 1:
                                      case "end":
                                        return _context201.stop();
                                    }
                                  }
                                }, _callee201);
                              }));

                              return function callbackFn(_x154) {
                                return _ref96.apply(this, arguments);
                              };
                            }(); // create wallet in wasm and invoke callback when done


                            module.create_full_wallet(JSON.stringify(config.toJson()), rejectUnauthorizedFnId, callbackFn);
                          }));

                        case 1:
                        case "end":
                          return _context202.stop();
                      }
                    }
                  }, _callee202);
                })));

              case 11:
                wallet = _context203.sent;

                if (!config.getPath()) {
                  _context203.next = 15;
                  break;
                }

                _context203.next = 15;
                return wallet.save();

              case 15:
                return _context203.abrupt("return", wallet);

              case 16:
              case "end":
                return _context203.stop();
            }
          }
        }, _callee203);
      }));

      function _createWalletRandom(_x153) {
        return _createWalletRandom2.apply(this, arguments);
      }

      return _createWalletRandom;
    }()
  }, {
    key: "getMnemonicLanguages",
    value: function () {
      var _getMnemonicLanguages = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee205() {
        var module;
        return _regenerator["default"].wrap(function _callee205$(_context205) {
          while (1) {
            switch (_context205.prev = _context205.next) {
              case 0:
                _context205.next = 2;
                return _LibraryUtils["default"].loadFullModule();

              case 2:
                module = _context205.sent;
                return _context205.abrupt("return", module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee204() {
                  return _regenerator["default"].wrap(function _callee204$(_context204) {
                    while (1) {
                      switch (_context204.prev = _context204.next) {
                        case 0:
                          return _context204.abrupt("return", JSON.parse(module.get_keys_wallet_mnemonic_languages()).languages);

                        case 1:
                        case "end":
                          return _context204.stop();
                      }
                    }
                  }, _callee204);
                }))));

              case 4:
              case "end":
                return _context205.stop();
            }
          }
        }, _callee205);
      }));

      function getMnemonicLanguages() {
        return _getMnemonicLanguages.apply(this, arguments);
      }

      return getMnemonicLanguages;
    }()
  }, {
    key: "_getFs",
    value: function _getFs() {
      if (!MoneroWalletFull.FS) MoneroWalletFull.FS = _GenUtils["default"].isBrowser() ? undefined : require('fs');
      return MoneroWalletFull.FS;
    }
  }, {
    key: "_openWalletData",
    value: function () {
      var _openWalletData2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee208(path, password, networkType, keysData, cacheData, daemonUriOrConnection, proxyToWorker, fs) {
        var daemonConnection, daemonUri, daemonUsername, daemonPassword, rejectUnauthorized, module;
        return _regenerator["default"].wrap(function _callee208$(_context208) {
          while (1) {
            switch (_context208.prev = _context208.next) {
              case 0:
                if (!proxyToWorker) {
                  _context208.next = 2;
                  break;
                }

                return _context208.abrupt("return", MoneroWalletFullProxy.openWalletData(path, password, networkType, keysData, cacheData, daemonUriOrConnection, fs));

              case 2:
                // validate and normalize parameters
                (0, _assert["default"])(password, "Must provide a password to open the wallet");

                if (!(networkType === undefined)) {
                  _context208.next = 5;
                  break;
                }

                throw new _MoneroError["default"]("Must provide the wallet's network type");

              case 5:
                _MoneroNetworkType["default"].validate(networkType);

                daemonConnection = typeof daemonUriOrConnection === "string" ? new _MoneroRpcConnection["default"](daemonUriOrConnection) : daemonUriOrConnection;
                daemonUri = daemonConnection && daemonConnection.getUri() ? daemonConnection.getUri() : "";
                daemonUsername = daemonConnection && daemonConnection.getUsername() ? daemonConnection.getUsername() : "";
                daemonPassword = daemonConnection && daemonConnection.getPassword() ? daemonConnection.getPassword() : "";
                rejectUnauthorized = daemonConnection ? daemonConnection.getRejectUnauthorized() : true; // load wasm module

                _context208.next = 13;
                return _LibraryUtils["default"].loadFullModule();

              case 13:
                module = _context208.sent;
                return _context208.abrupt("return", module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee207() {
                  return _regenerator["default"].wrap(function _callee207$(_context207) {
                    while (1) {
                      switch (_context207.prev = _context207.next) {
                        case 0:
                          return _context207.abrupt("return", new Promise(function (resolve, reject) {
                            // register fn informing if unauthorized reqs should be rejected
                            var rejectUnauthorizedFnId = _GenUtils["default"].getUUID();

                            _LibraryUtils["default"].setRejectUnauthorizedFn(rejectUnauthorizedFnId, function () {
                              return rejectUnauthorized;
                            }); // define callback for wasm


                            var callbackFn = /*#__PURE__*/function () {
                              var _ref99 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee206(cppAddress) {
                                return _regenerator["default"].wrap(function _callee206$(_context206) {
                                  while (1) {
                                    switch (_context206.prev = _context206.next) {
                                      case 0:
                                        if (typeof cppAddress === "string") reject(new _MoneroError["default"](cppAddress));else resolve(new MoneroWalletFull(cppAddress, path, password, fs, rejectUnauthorized, rejectUnauthorizedFnId));

                                      case 1:
                                      case "end":
                                        return _context206.stop();
                                    }
                                  }
                                }, _callee206);
                              }));

                              return function callbackFn(_x163) {
                                return _ref99.apply(this, arguments);
                              };
                            }(); // create wallet in wasm and invoke callback when done


                            module.open_wallet_full(password, networkType, keysData, cacheData, daemonUri, daemonUsername, daemonPassword, rejectUnauthorizedFnId, callbackFn);
                          }));

                        case 1:
                        case "end":
                          return _context207.stop();
                      }
                    }
                  }, _callee207);
                }))));

              case 15:
              case "end":
                return _context208.stop();
            }
          }
        }, _callee208);
      }));

      function _openWalletData(_x155, _x156, _x157, _x158, _x159, _x160, _x161, _x162) {
        return _openWalletData2.apply(this, arguments);
      }

      return _openWalletData;
    }()
  }, {
    key: "_sanitizeBlock",
    value: function _sanitizeBlock(block) {
      var _iterator9 = _createForOfIteratorHelper(block.getTxs()),
          _step9;

      try {
        for (_iterator9.s(); !(_step9 = _iterator9.n()).done;) {
          var tx = _step9.value;

          MoneroWalletFull._sanitizeTxWallet(tx);
        }
      } catch (err) {
        _iterator9.e(err);
      } finally {
        _iterator9.f();
      }

      return block;
    }
  }, {
    key: "_sanitizeTxWallet",
    value: function _sanitizeTxWallet(tx) {
      (0, _assert["default"])(tx instanceof _MoneroTxWallet["default"]);
      return tx;
    }
  }, {
    key: "_sanitizeAccount",
    value: function _sanitizeAccount(account) {
      if (account.getSubaddresses()) {
        var _iterator10 = _createForOfIteratorHelper(account.getSubaddresses()),
            _step10;

        try {
          for (_iterator10.s(); !(_step10 = _iterator10.n()).done;) {
            var subaddress = _step10.value;

            MoneroWalletFull._sanitizeSubaddress(subaddress);
          }
        } catch (err) {
          _iterator10.e(err);
        } finally {
          _iterator10.f();
        }
      }

      return account;
    }
  }, {
    key: "_sanitizeSubaddress",
    value: function _sanitizeSubaddress(subaddress) {
      if (subaddress.getLabel() === "") subaddress.setLabel(undefined);
      return subaddress;
    }
  }, {
    key: "_deserializeBlocks",
    value: function _deserializeBlocks(blocksJsonStr) {
      var blocksJson = JSON.parse(_GenUtils["default"].stringifyBIs(blocksJsonStr));
      var deserializedBlocks = {};
      deserializedBlocks.blocks = [];
      deserializedBlocks.missingTxHashes = [];

      if (blocksJson.blocks) {
        var _iterator11 = _createForOfIteratorHelper(blocksJson.blocks),
            _step11;

        try {
          for (_iterator11.s(); !(_step11 = _iterator11.n()).done;) {
            var blockJson = _step11.value;
            deserializedBlocks.blocks.push(MoneroWalletFull._sanitizeBlock(new _MoneroBlock["default"](blockJson, _MoneroBlock["default"].DeserializationType.TX_WALLET)));
          }
        } catch (err) {
          _iterator11.e(err);
        } finally {
          _iterator11.f();
        }
      }

      if (blocksJson.missingTxHashes) {
        var _iterator12 = _createForOfIteratorHelper(blocksJson.missingTxHashes),
            _step12;

        try {
          for (_iterator12.s(); !(_step12 = _iterator12.n()).done;) {
            var missingTxHash = _step12.value;
            deserializedBlocks.missingTxHashes.push(missingTxHash);
          }
        } catch (err) {
          _iterator12.e(err);
        } finally {
          _iterator12.f();
        }
      }

      return deserializedBlocks;
    }
  }, {
    key: "_deserializeTxs",
    value: function _deserializeTxs(query, blocksJsonStr, missingTxHashes) {
      // deserialize blocks
      var deserializedBlocks = MoneroWalletFull._deserializeBlocks(blocksJsonStr);

      if (missingTxHashes === undefined && deserializedBlocks.missingTxHashes.length > 0) throw new _MoneroError["default"]("Wallet missing requested tx hashes: " + deserializedBlocks.missingTxHashes);

      var _iterator13 = _createForOfIteratorHelper(deserializedBlocks.missingTxHashes),
          _step13;

      try {
        for (_iterator13.s(); !(_step13 = _iterator13.n()).done;) {
          var missingTxHash = _step13.value;
          missingTxHashes.push(missingTxHash);
        }
      } catch (err) {
        _iterator13.e(err);
      } finally {
        _iterator13.f();
      }

      var blocks = deserializedBlocks.blocks; // collect txs

      var txs = [];

      var _iterator14 = _createForOfIteratorHelper(blocks),
          _step14;

      try {
        for (_iterator14.s(); !(_step14 = _iterator14.n()).done;) {
          var block = _step14.value;

          MoneroWalletFull._sanitizeBlock(block);

          var _iterator17 = _createForOfIteratorHelper(block.getTxs()),
              _step17;

          try {
            for (_iterator17.s(); !(_step17 = _iterator17.n()).done;) {
              var _tx = _step17.value;
              if (block.getHeight() === undefined) _tx.setBlock(undefined); // dereference placeholder block for unconfirmed txs

              txs.push(_tx);
            }
          } catch (err) {
            _iterator17.e(err);
          } finally {
            _iterator17.f();
          }
        } // re-sort txs which is lost over wasm serialization  // TODO: confirm that order is lost

      } catch (err) {
        _iterator14.e(err);
      } finally {
        _iterator14.f();
      }

      if (query.getHashes() !== undefined) {
        var txMap = new Map();

        var _iterator15 = _createForOfIteratorHelper(txs),
            _step15;

        try {
          for (_iterator15.s(); !(_step15 = _iterator15.n()).done;) {
            var tx = _step15.value;
            txMap[tx.getHash()] = tx;
          }
        } catch (err) {
          _iterator15.e(err);
        } finally {
          _iterator15.f();
        }

        var txsSorted = [];

        var _iterator16 = _createForOfIteratorHelper(query.getHashes()),
            _step16;

        try {
          for (_iterator16.s(); !(_step16 = _iterator16.n()).done;) {
            var txHash = _step16.value;
            if (txMap[txHash] !== undefined) txsSorted.push(txMap[txHash]);
          }
        } catch (err) {
          _iterator16.e(err);
        } finally {
          _iterator16.f();
        }

        txs = txsSorted;
      }

      return txs;
    }
  }, {
    key: "_deserializeTransfers",
    value: function _deserializeTransfers(query, blocksJsonStr) {
      // deserialize blocks
      var deserializedBlocks = MoneroWalletFull._deserializeBlocks(blocksJsonStr);

      if (deserializedBlocks.missingTxHashes.length > 0) throw new _MoneroError["default"]("Wallet missing requested tx hashes: " + deserializedBlocks.missingTxHashes);
      var blocks = deserializedBlocks.blocks; // collect transfers

      var transfers = [];

      var _iterator18 = _createForOfIteratorHelper(blocks),
          _step18;

      try {
        for (_iterator18.s(); !(_step18 = _iterator18.n()).done;) {
          var block = _step18.value;

          var _iterator19 = _createForOfIteratorHelper(block.getTxs()),
              _step19;

          try {
            for (_iterator19.s(); !(_step19 = _iterator19.n()).done;) {
              var tx = _step19.value;
              if (block.getHeight() === undefined) tx.setBlock(undefined); // dereference placeholder block for unconfirmed txs

              if (tx.getOutgoingTransfer() !== undefined) transfers.push(tx.getOutgoingTransfer());

              if (tx.getIncomingTransfers() !== undefined) {
                var _iterator20 = _createForOfIteratorHelper(tx.getIncomingTransfers()),
                    _step20;

                try {
                  for (_iterator20.s(); !(_step20 = _iterator20.n()).done;) {
                    var transfer = _step20.value;
                    transfers.push(transfer);
                  }
                } catch (err) {
                  _iterator20.e(err);
                } finally {
                  _iterator20.f();
                }
              }
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

      return transfers;
    }
  }, {
    key: "_deserializeOutputs",
    value: function _deserializeOutputs(query, blocksJsonStr) {
      // deserialize blocks
      var deserializedBlocks = MoneroWalletFull._deserializeBlocks(blocksJsonStr);

      if (deserializedBlocks.missingTxHashes.length > 0) throw new _MoneroError["default"]("Wallet missing requested tx hashes: " + deserializedBlocks.missingTxHashes);
      var blocks = deserializedBlocks.blocks; // collect outputs

      var outputs = [];

      var _iterator21 = _createForOfIteratorHelper(blocks),
          _step21;

      try {
        for (_iterator21.s(); !(_step21 = _iterator21.n()).done;) {
          var block = _step21.value;

          var _iterator22 = _createForOfIteratorHelper(block.getTxs()),
              _step22;

          try {
            for (_iterator22.s(); !(_step22 = _iterator22.n()).done;) {
              var tx = _step22.value;

              var _iterator23 = _createForOfIteratorHelper(tx.getOutputs()),
                  _step23;

              try {
                for (_iterator23.s(); !(_step23 = _iterator23.n()).done;) {
                  var output = _step23.value;
                  outputs.push(output);
                }
              } catch (err) {
                _iterator23.e(err);
              } finally {
                _iterator23.f();
              }
            }
          } catch (err) {
            _iterator22.e(err);
          } finally {
            _iterator22.f();
          }
        }
      } catch (err) {
        _iterator21.e(err);
      } finally {
        _iterator21.f();
      }

      return outputs;
    }
  }, {
    key: "_moveTo",
    value: function () {
      var _moveTo3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee209(path, wallet) {
        var walletDir, data, oldPath;
        return _regenerator["default"].wrap(function _callee209$(_context209) {
          while (1) {
            switch (_context209.prev = _context209.next) {
              case 0:
                _context209.next = 2;
                return wallet.isClosed();

              case 2:
                if (!_context209.sent) {
                  _context209.next = 4;
                  break;
                }

                throw new _MoneroError["default"]("Wallet is closed");

              case 4:
                if (path) {
                  _context209.next = 6;
                  break;
                }

                throw new _MoneroError["default"]("Must provide path of destination wallet");

              case 6:
                if (!(_path["default"].normalize(wallet._path) === _path["default"].normalize(path))) {
                  _context209.next = 10;
                  break;
                }

                _context209.next = 9;
                return wallet.save();

              case 9:
                return _context209.abrupt("return");

              case 10:
                // create destination directory if it doesn't exist
                walletDir = _path["default"].dirname(path);

                if (wallet._fs.existsSync(walletDir)) {
                  _context209.next = 19;
                  break;
                }

                _context209.prev = 12;

                wallet._fs.mkdirSync(walletDir);

                _context209.next = 19;
                break;

              case 16:
                _context209.prev = 16;
                _context209.t0 = _context209["catch"](12);
                throw new _MoneroError["default"]("Destination path " + path + " does not exist and cannot be created: " + _context209.t0.message);

              case 19:
                _context209.next = 21;
                return wallet.getData();

              case 21:
                data = _context209.sent;

                wallet._fs.writeFileSync(path + ".keys", data[0], "binary");

                wallet._fs.writeFileSync(path, data[1], "binary");

                _context209.t1 = wallet._fs;
                _context209.t2 = path + ".address.txt";
                _context209.next = 28;
                return wallet.getPrimaryAddress();

              case 28:
                _context209.t3 = _context209.sent;

                _context209.t1.writeFileSync.call(_context209.t1, _context209.t2, _context209.t3);

                oldPath = wallet._path;
                wallet._path = path; // delete old wallet files

                if (oldPath) {
                  wallet._fs.unlinkSync(oldPath + ".address.txt");

                  wallet._fs.unlinkSync(oldPath + ".keys");

                  wallet._fs.unlinkSync(oldPath);
                }

              case 33:
              case "end":
                return _context209.stop();
            }
          }
        }, _callee209, null, [[12, 16]]);
      }));

      function _moveTo(_x164, _x165) {
        return _moveTo3.apply(this, arguments);
      }

      return _moveTo;
    }()
  }, {
    key: "_save",
    value: function () {
      var _save3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee210(wallet) {
        var path, pathNew, data;
        return _regenerator["default"].wrap(function _callee210$(_context210) {
          while (1) {
            switch (_context210.prev = _context210.next) {
              case 0:
                _context210.next = 2;
                return wallet.isClosed();

              case 2:
                if (!_context210.sent) {
                  _context210.next = 4;
                  break;
                }

                throw new _MoneroError["default"]("Wallet is closed");

              case 4:
                _context210.next = 6;
                return wallet.getPath();

              case 6:
                path = _context210.sent;

                if (path) {
                  _context210.next = 9;
                  break;
                }

                throw new _MoneroError["default"]("Cannot save wallet because path is not set");

              case 9:
                // write wallet files to *.new
                pathNew = path + ".new";
                _context210.next = 12;
                return wallet.getData();

              case 12:
                data = _context210.sent;

                wallet._fs.writeFileSync(pathNew + ".keys", data[0], "binary");

                wallet._fs.writeFileSync(pathNew, data[1], "binary");

                _context210.t0 = wallet._fs;
                _context210.t1 = pathNew + ".address.txt";
                _context210.next = 19;
                return wallet.getPrimaryAddress();

              case 19:
                _context210.t2 = _context210.sent;

                _context210.t0.writeFileSync.call(_context210.t0, _context210.t1, _context210.t2);

                // replace old wallet files with new
                wallet._fs.renameSync(pathNew + ".keys", path + ".keys");

                wallet._fs.renameSync(pathNew, path, path + ".keys");

                wallet._fs.renameSync(pathNew + ".address.txt", path + ".address.txt", path + ".keys");

              case 24:
              case "end":
                return _context210.stop();
            }
          }
        }, _callee210);
      }));

      function _save(_x166) {
        return _save3.apply(this, arguments);
      }

      return _save;
    }()
  }]);
  return MoneroWalletFull;
}(_MoneroWalletKeys2["default"]);
/**
 * Implements a MoneroWallet by proxying requests to a worker which runs a full wallet.
 * 
 * TODO: sort these methods according to master sort in MoneroWallet.js
 * TODO: probably only allow one listener to worker then propogate to registered listeners for performance
 * TODO: ability to recycle worker for use in another wallet
 * TODO: using LibraryUtils.WORKER_OBJECTS directly breaks encapsulation
 * 
 * @private
 */


var MoneroWalletFullProxy = /*#__PURE__*/function (_MoneroWallet) {
  (0, _inherits2["default"])(MoneroWalletFullProxy, _MoneroWallet);

  var _super2 = _createSuper(MoneroWalletFullProxy);

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
  function MoneroWalletFullProxy(walletId, worker, path, fs) {
    var _this2;

    (0, _classCallCheck2["default"])(this, MoneroWalletFullProxy);
    _this2 = _super2.call(this);
    _this2._walletId = walletId;
    _this2._worker = worker;
    _this2._path = path;
    _this2._fs = fs ? fs : path ? MoneroWalletFull._getFs() : undefined;
    _this2._wrappedListeners = [];
    return _this2;
  }

  (0, _createClass2["default"])(MoneroWalletFullProxy, [{
    key: "isViewOnly",
    value: function () {
      var _isViewOnly = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee211() {
        return _regenerator["default"].wrap(function _callee211$(_context211) {
          while (1) {
            switch (_context211.prev = _context211.next) {
              case 0:
                return _context211.abrupt("return", this._invokeWorker("isViewOnly"));

              case 1:
              case "end":
                return _context211.stop();
            }
          }
        }, _callee211, this);
      }));

      function isViewOnly() {
        return _isViewOnly.apply(this, arguments);
      }

      return isViewOnly;
    }()
  }, {
    key: "getNetworkType",
    value: function () {
      var _getNetworkType2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee212() {
        return _regenerator["default"].wrap(function _callee212$(_context212) {
          while (1) {
            switch (_context212.prev = _context212.next) {
              case 0:
                return _context212.abrupt("return", this._invokeWorker("getNetworkType"));

              case 1:
              case "end":
                return _context212.stop();
            }
          }
        }, _callee212, this);
      }));

      function getNetworkType() {
        return _getNetworkType2.apply(this, arguments);
      }

      return getNetworkType;
    }()
  }, {
    key: "getVersion",
    value: function () {
      var _getVersion2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee213() {
        return _regenerator["default"].wrap(function _callee213$(_context213) {
          while (1) {
            switch (_context213.prev = _context213.next) {
              case 0:
                throw new _MoneroError["default"]("Not implemented");

              case 1:
              case "end":
                return _context213.stop();
            }
          }
        }, _callee213);
      }));

      function getVersion() {
        return _getVersion2.apply(this, arguments);
      }

      return getVersion;
    }()
  }, {
    key: "getPath",
    value: function getPath() {
      return this._path;
    }
  }, {
    key: "getMnemonic",
    value: function () {
      var _getMnemonic = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee214() {
        return _regenerator["default"].wrap(function _callee214$(_context214) {
          while (1) {
            switch (_context214.prev = _context214.next) {
              case 0:
                return _context214.abrupt("return", this._invokeWorker("getMnemonic"));

              case 1:
              case "end":
                return _context214.stop();
            }
          }
        }, _callee214, this);
      }));

      function getMnemonic() {
        return _getMnemonic.apply(this, arguments);
      }

      return getMnemonic;
    }()
  }, {
    key: "getMnemonicLanguage",
    value: function () {
      var _getMnemonicLanguage = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee215() {
        return _regenerator["default"].wrap(function _callee215$(_context215) {
          while (1) {
            switch (_context215.prev = _context215.next) {
              case 0:
                return _context215.abrupt("return", this._invokeWorker("getMnemonicLanguage"));

              case 1:
              case "end":
                return _context215.stop();
            }
          }
        }, _callee215, this);
      }));

      function getMnemonicLanguage() {
        return _getMnemonicLanguage.apply(this, arguments);
      }

      return getMnemonicLanguage;
    }()
  }, {
    key: "getMnemonicLanguages",
    value: function () {
      var _getMnemonicLanguages2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee216() {
        return _regenerator["default"].wrap(function _callee216$(_context216) {
          while (1) {
            switch (_context216.prev = _context216.next) {
              case 0:
                return _context216.abrupt("return", this._invokeWorker("getMnemonicLanguages"));

              case 1:
              case "end":
                return _context216.stop();
            }
          }
        }, _callee216, this);
      }));

      function getMnemonicLanguages() {
        return _getMnemonicLanguages2.apply(this, arguments);
      }

      return getMnemonicLanguages;
    }()
  }, {
    key: "getPrivateSpendKey",
    value: function () {
      var _getPrivateSpendKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee217() {
        return _regenerator["default"].wrap(function _callee217$(_context217) {
          while (1) {
            switch (_context217.prev = _context217.next) {
              case 0:
                return _context217.abrupt("return", this._invokeWorker("getPrivateSpendKey"));

              case 1:
              case "end":
                return _context217.stop();
            }
          }
        }, _callee217, this);
      }));

      function getPrivateSpendKey() {
        return _getPrivateSpendKey.apply(this, arguments);
      }

      return getPrivateSpendKey;
    }()
  }, {
    key: "getPrivateViewKey",
    value: function () {
      var _getPrivateViewKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee218() {
        return _regenerator["default"].wrap(function _callee218$(_context218) {
          while (1) {
            switch (_context218.prev = _context218.next) {
              case 0:
                return _context218.abrupt("return", this._invokeWorker("getPrivateViewKey"));

              case 1:
              case "end":
                return _context218.stop();
            }
          }
        }, _callee218, this);
      }));

      function getPrivateViewKey() {
        return _getPrivateViewKey.apply(this, arguments);
      }

      return getPrivateViewKey;
    }()
  }, {
    key: "getPublicViewKey",
    value: function () {
      var _getPublicViewKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee219() {
        return _regenerator["default"].wrap(function _callee219$(_context219) {
          while (1) {
            switch (_context219.prev = _context219.next) {
              case 0:
                return _context219.abrupt("return", this._invokeWorker("getPublicViewKey"));

              case 1:
              case "end":
                return _context219.stop();
            }
          }
        }, _callee219, this);
      }));

      function getPublicViewKey() {
        return _getPublicViewKey.apply(this, arguments);
      }

      return getPublicViewKey;
    }()
  }, {
    key: "getPublicSpendKey",
    value: function () {
      var _getPublicSpendKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee220() {
        return _regenerator["default"].wrap(function _callee220$(_context220) {
          while (1) {
            switch (_context220.prev = _context220.next) {
              case 0:
                return _context220.abrupt("return", this._invokeWorker("getPublicSpendKey"));

              case 1:
              case "end":
                return _context220.stop();
            }
          }
        }, _callee220, this);
      }));

      function getPublicSpendKey() {
        return _getPublicSpendKey.apply(this, arguments);
      }

      return getPublicSpendKey;
    }()
  }, {
    key: "getAddress",
    value: function () {
      var _getAddress = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee221(accountIdx, subaddressIdx) {
        var _args221 = arguments;
        return _regenerator["default"].wrap(function _callee221$(_context221) {
          while (1) {
            switch (_context221.prev = _context221.next) {
              case 0:
                return _context221.abrupt("return", this._invokeWorker("getAddress", Array.from(_args221)));

              case 1:
              case "end":
                return _context221.stop();
            }
          }
        }, _callee221, this);
      }));

      function getAddress(_x167, _x168) {
        return _getAddress.apply(this, arguments);
      }

      return getAddress;
    }()
  }, {
    key: "getAddressIndex",
    value: function () {
      var _getAddressIndex = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee222(address) {
        var subaddressJson,
            _args222 = arguments;
        return _regenerator["default"].wrap(function _callee222$(_context222) {
          while (1) {
            switch (_context222.prev = _context222.next) {
              case 0:
                _context222.next = 2;
                return this._invokeWorker("getAddressIndex", Array.from(_args222));

              case 2:
                subaddressJson = _context222.sent;
                return _context222.abrupt("return", MoneroWalletFull._sanitizeSubaddress(new _MoneroSubaddress["default"](subaddressJson)));

              case 4:
              case "end":
                return _context222.stop();
            }
          }
        }, _callee222, this);
      }));

      function getAddressIndex(_x169) {
        return _getAddressIndex.apply(this, arguments);
      }

      return getAddressIndex;
    }()
  }, {
    key: "getIntegratedAddress",
    value: function () {
      var _getIntegratedAddress2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee223(standardAddress, paymentId) {
        var _args223 = arguments;
        return _regenerator["default"].wrap(function _callee223$(_context223) {
          while (1) {
            switch (_context223.prev = _context223.next) {
              case 0:
                _context223.t0 = _MoneroIntegratedAddress["default"];
                _context223.next = 3;
                return this._invokeWorker("getIntegratedAddress", Array.from(_args223));

              case 3:
                _context223.t1 = _context223.sent;
                return _context223.abrupt("return", new _context223.t0(_context223.t1));

              case 5:
              case "end":
                return _context223.stop();
            }
          }
        }, _callee223, this);
      }));

      function getIntegratedAddress(_x170, _x171) {
        return _getIntegratedAddress2.apply(this, arguments);
      }

      return getIntegratedAddress;
    }()
  }, {
    key: "decodeIntegratedAddress",
    value: function () {
      var _decodeIntegratedAddress2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee224(integratedAddress) {
        var _args224 = arguments;
        return _regenerator["default"].wrap(function _callee224$(_context224) {
          while (1) {
            switch (_context224.prev = _context224.next) {
              case 0:
                _context224.t0 = _MoneroIntegratedAddress["default"];
                _context224.next = 3;
                return this._invokeWorker("decodeIntegratedAddress", Array.from(_args224));

              case 3:
                _context224.t1 = _context224.sent;
                return _context224.abrupt("return", new _context224.t0(_context224.t1));

              case 5:
              case "end":
                return _context224.stop();
            }
          }
        }, _callee224, this);
      }));

      function decodeIntegratedAddress(_x172) {
        return _decodeIntegratedAddress2.apply(this, arguments);
      }

      return decodeIntegratedAddress;
    }()
  }, {
    key: "setDaemonConnection",
    value: function () {
      var _setDaemonConnection2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee225(uriOrRpcConnection) {
        var connection;
        return _regenerator["default"].wrap(function _callee225$(_context225) {
          while (1) {
            switch (_context225.prev = _context225.next) {
              case 0:
                if (uriOrRpcConnection) {
                  _context225.next = 5;
                  break;
                }

                _context225.next = 3;
                return this._invokeWorker("setDaemonConnection");

              case 3:
                _context225.next = 8;
                break;

              case 5:
                connection = !uriOrRpcConnection ? undefined : uriOrRpcConnection instanceof _MoneroRpcConnection["default"] ? uriOrRpcConnection : new _MoneroRpcConnection["default"](uriOrRpcConnection);
                _context225.next = 8;
                return this._invokeWorker("setDaemonConnection", connection ? connection.getConfig() : undefined);

              case 8:
              case "end":
                return _context225.stop();
            }
          }
        }, _callee225, this);
      }));

      function setDaemonConnection(_x173) {
        return _setDaemonConnection2.apply(this, arguments);
      }

      return setDaemonConnection;
    }()
  }, {
    key: "getDaemonConnection",
    value: function () {
      var _getDaemonConnection2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee226() {
        var rpcConfig;
        return _regenerator["default"].wrap(function _callee226$(_context226) {
          while (1) {
            switch (_context226.prev = _context226.next) {
              case 0:
                _context226.next = 2;
                return this._invokeWorker("getDaemonConnection");

              case 2:
                rpcConfig = _context226.sent;
                return _context226.abrupt("return", rpcConfig ? new _MoneroRpcConnection["default"](rpcConfig) : undefined);

              case 4:
              case "end":
                return _context226.stop();
            }
          }
        }, _callee226, this);
      }));

      function getDaemonConnection() {
        return _getDaemonConnection2.apply(this, arguments);
      }

      return getDaemonConnection;
    }()
  }, {
    key: "isConnectedToDaemon",
    value: function () {
      var _isConnectedToDaemon2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee227() {
        return _regenerator["default"].wrap(function _callee227$(_context227) {
          while (1) {
            switch (_context227.prev = _context227.next) {
              case 0:
                return _context227.abrupt("return", this._invokeWorker("isConnectedToDaemon"));

              case 1:
              case "end":
                return _context227.stop();
            }
          }
        }, _callee227, this);
      }));

      function isConnectedToDaemon() {
        return _isConnectedToDaemon2.apply(this, arguments);
      }

      return isConnectedToDaemon;
    }()
  }, {
    key: "getSyncHeight",
    value: function () {
      var _getSyncHeight2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee228() {
        return _regenerator["default"].wrap(function _callee228$(_context228) {
          while (1) {
            switch (_context228.prev = _context228.next) {
              case 0:
                return _context228.abrupt("return", this._invokeWorker("getSyncHeight"));

              case 1:
              case "end":
                return _context228.stop();
            }
          }
        }, _callee228, this);
      }));

      function getSyncHeight() {
        return _getSyncHeight2.apply(this, arguments);
      }

      return getSyncHeight;
    }()
  }, {
    key: "setSyncHeight",
    value: function () {
      var _setSyncHeight2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee229(syncHeight) {
        return _regenerator["default"].wrap(function _callee229$(_context229) {
          while (1) {
            switch (_context229.prev = _context229.next) {
              case 0:
                return _context229.abrupt("return", this._invokeWorker("setSyncHeight", [syncHeight]));

              case 1:
              case "end":
                return _context229.stop();
            }
          }
        }, _callee229, this);
      }));

      function setSyncHeight(_x174) {
        return _setSyncHeight2.apply(this, arguments);
      }

      return setSyncHeight;
    }()
  }, {
    key: "getDaemonHeight",
    value: function () {
      var _getDaemonHeight2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee230() {
        return _regenerator["default"].wrap(function _callee230$(_context230) {
          while (1) {
            switch (_context230.prev = _context230.next) {
              case 0:
                return _context230.abrupt("return", this._invokeWorker("getDaemonHeight"));

              case 1:
              case "end":
                return _context230.stop();
            }
          }
        }, _callee230, this);
      }));

      function getDaemonHeight() {
        return _getDaemonHeight2.apply(this, arguments);
      }

      return getDaemonHeight;
    }()
  }, {
    key: "getDaemonMaxPeerHeight",
    value: function () {
      var _getDaemonMaxPeerHeight2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee231() {
        return _regenerator["default"].wrap(function _callee231$(_context231) {
          while (1) {
            switch (_context231.prev = _context231.next) {
              case 0:
                return _context231.abrupt("return", this._invokeWorker("getDaemonMaxPeerHeight"));

              case 1:
              case "end":
                return _context231.stop();
            }
          }
        }, _callee231, this);
      }));

      function getDaemonMaxPeerHeight() {
        return _getDaemonMaxPeerHeight2.apply(this, arguments);
      }

      return getDaemonMaxPeerHeight;
    }()
  }, {
    key: "getHeightByDate",
    value: function () {
      var _getHeightByDate2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee232(year, month, day) {
        return _regenerator["default"].wrap(function _callee232$(_context232) {
          while (1) {
            switch (_context232.prev = _context232.next) {
              case 0:
                return _context232.abrupt("return", this._invokeWorker("getHeightByDate", [year, month, day]));

              case 1:
              case "end":
                return _context232.stop();
            }
          }
        }, _callee232, this);
      }));

      function getHeightByDate(_x175, _x176, _x177) {
        return _getHeightByDate2.apply(this, arguments);
      }

      return getHeightByDate;
    }()
  }, {
    key: "isDaemonSynced",
    value: function () {
      var _isDaemonSynced2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee233() {
        return _regenerator["default"].wrap(function _callee233$(_context233) {
          while (1) {
            switch (_context233.prev = _context233.next) {
              case 0:
                return _context233.abrupt("return", this._invokeWorker("isDaemonSynced"));

              case 1:
              case "end":
                return _context233.stop();
            }
          }
        }, _callee233, this);
      }));

      function isDaemonSynced() {
        return _isDaemonSynced2.apply(this, arguments);
      }

      return isDaemonSynced;
    }()
  }, {
    key: "getHeight",
    value: function () {
      var _getHeight2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee234() {
        return _regenerator["default"].wrap(function _callee234$(_context234) {
          while (1) {
            switch (_context234.prev = _context234.next) {
              case 0:
                return _context234.abrupt("return", this._invokeWorker("getHeight"));

              case 1:
              case "end":
                return _context234.stop();
            }
          }
        }, _callee234, this);
      }));

      function getHeight() {
        return _getHeight2.apply(this, arguments);
      }

      return getHeight;
    }()
  }, {
    key: "addListener",
    value: function () {
      var _addListener2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee235(listener) {
        var wrappedListener, listenerId;
        return _regenerator["default"].wrap(function _callee235$(_context235) {
          while (1) {
            switch (_context235.prev = _context235.next) {
              case 0:
                wrappedListener = new WalletWorkerListener(listener);
                listenerId = wrappedListener.getId();
                _LibraryUtils["default"].WORKER_OBJECTS[this._walletId].callbacks["onSyncProgress_" + listenerId] = [wrappedListener.onSyncProgress, wrappedListener];
                _LibraryUtils["default"].WORKER_OBJECTS[this._walletId].callbacks["onNewBlock_" + listenerId] = [wrappedListener.onNewBlock, wrappedListener];
                _LibraryUtils["default"].WORKER_OBJECTS[this._walletId].callbacks["onBalancesChanged_" + listenerId] = [wrappedListener.onBalancesChanged, wrappedListener];
                _LibraryUtils["default"].WORKER_OBJECTS[this._walletId].callbacks["onOutputReceived_" + listenerId] = [wrappedListener.onOutputReceived, wrappedListener];
                _LibraryUtils["default"].WORKER_OBJECTS[this._walletId].callbacks["onOutputSpent_" + listenerId] = [wrappedListener.onOutputSpent, wrappedListener];

                this._wrappedListeners.push(wrappedListener);

                return _context235.abrupt("return", this._invokeWorker("addListener", [listenerId]));

              case 9:
              case "end":
                return _context235.stop();
            }
          }
        }, _callee235, this);
      }));

      function addListener(_x178) {
        return _addListener2.apply(this, arguments);
      }

      return addListener;
    }()
  }, {
    key: "removeListener",
    value: function () {
      var _removeListener2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee236(listener) {
        var i, listenerId;
        return _regenerator["default"].wrap(function _callee236$(_context236) {
          while (1) {
            switch (_context236.prev = _context236.next) {
              case 0:
                i = 0;

              case 1:
                if (!(i < this._wrappedListeners.length)) {
                  _context236.next = 16;
                  break;
                }

                if (!(this._wrappedListeners[i].getListener() === listener)) {
                  _context236.next = 13;
                  break;
                }

                listenerId = this._wrappedListeners[i].getId();
                _context236.next = 6;
                return this._invokeWorker("removeListener", [listenerId]);

              case 6:
                delete _LibraryUtils["default"].WORKER_OBJECTS[this._walletId].callbacks["onSyncProgress_" + listenerId];
                delete _LibraryUtils["default"].WORKER_OBJECTS[this._walletId].callbacks["onNewBlock_" + listenerId];
                delete _LibraryUtils["default"].WORKER_OBJECTS[this._walletId].callbacks["onBalancesChanged_" + listenerId];
                delete _LibraryUtils["default"].WORKER_OBJECTS[this._walletId].callbacks["onOutputReceived_" + listenerId];
                delete _LibraryUtils["default"].WORKER_OBJECTS[this._walletId].callbacks["onOutputSpent_" + listenerId];

                this._wrappedListeners.splice(i, 1);

                return _context236.abrupt("return");

              case 13:
                i++;
                _context236.next = 1;
                break;

              case 16:
                throw new _MoneroError["default"]("Listener is not registered with wallet");

              case 17:
              case "end":
                return _context236.stop();
            }
          }
        }, _callee236, this);
      }));

      function removeListener(_x179) {
        return _removeListener2.apply(this, arguments);
      }

      return removeListener;
    }()
  }, {
    key: "getListeners",
    value: function getListeners() {
      var listeners = [];

      var _iterator24 = _createForOfIteratorHelper(this._wrappedListeners),
          _step24;

      try {
        for (_iterator24.s(); !(_step24 = _iterator24.n()).done;) {
          var wrappedListener = _step24.value;
          listeners.push(wrappedListener.getListener());
        }
      } catch (err) {
        _iterator24.e(err);
      } finally {
        _iterator24.f();
      }

      return listeners;
    }
  }, {
    key: "isSynced",
    value: function () {
      var _isSynced2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee237() {
        return _regenerator["default"].wrap(function _callee237$(_context237) {
          while (1) {
            switch (_context237.prev = _context237.next) {
              case 0:
                return _context237.abrupt("return", this._invokeWorker("isSynced"));

              case 1:
              case "end":
                return _context237.stop();
            }
          }
        }, _callee237, this);
      }));

      function isSynced() {
        return _isSynced2.apply(this, arguments);
      }

      return isSynced;
    }()
  }, {
    key: "sync",
    value: function () {
      var _sync2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee238(listenerOrStartHeight, startHeight, allowConcurrentCalls) {
        var listener, err, result, resultJson;
        return _regenerator["default"].wrap(function _callee238$(_context238) {
          while (1) {
            switch (_context238.prev = _context238.next) {
              case 0:
                // normalize params
                startHeight = listenerOrStartHeight instanceof _MoneroWalletListener["default"] ? startHeight : listenerOrStartHeight;
                listener = listenerOrStartHeight instanceof _MoneroWalletListener["default"] ? listenerOrStartHeight : undefined;

                if (!(startHeight === undefined)) {
                  _context238.next = 11;
                  break;
                }

                _context238.t0 = Math;
                _context238.next = 6;
                return this.getHeight();

              case 6:
                _context238.t1 = _context238.sent;
                _context238.next = 9;
                return this.getSyncHeight();

              case 9:
                _context238.t2 = _context238.sent;
                startHeight = _context238.t0.max.call(_context238.t0, _context238.t1, _context238.t2);

              case 11:
                if (!listener) {
                  _context238.next = 14;
                  break;
                }

                _context238.next = 14;
                return this.addListener(listener);

              case 14:
                _context238.prev = 14;
                _context238.next = 17;
                return this._invokeWorker("sync", [startHeight, allowConcurrentCalls]);

              case 17:
                resultJson = _context238.sent;
                result = new _MoneroSyncResult["default"](resultJson.numBlocksFetched, resultJson.receivedMoney);
                _context238.next = 24;
                break;

              case 21:
                _context238.prev = 21;
                _context238.t3 = _context238["catch"](14);
                err = _context238.t3;

              case 24:
                if (!listener) {
                  _context238.next = 27;
                  break;
                }

                _context238.next = 27;
                return this.removeListener(listener);

              case 27:
                if (!err) {
                  _context238.next = 29;
                  break;
                }

                throw err;

              case 29:
                return _context238.abrupt("return", result);

              case 30:
              case "end":
                return _context238.stop();
            }
          }
        }, _callee238, this, [[14, 21]]);
      }));

      function sync(_x180, _x181, _x182) {
        return _sync2.apply(this, arguments);
      }

      return sync;
    }()
  }, {
    key: "startSyncing",
    value: function () {
      var _startSyncing2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee239(syncPeriodInMs) {
        var _args239 = arguments;
        return _regenerator["default"].wrap(function _callee239$(_context239) {
          while (1) {
            switch (_context239.prev = _context239.next) {
              case 0:
                return _context239.abrupt("return", this._invokeWorker("startSyncing", Array.from(_args239)));

              case 1:
              case "end":
                return _context239.stop();
            }
          }
        }, _callee239, this);
      }));

      function startSyncing(_x183) {
        return _startSyncing2.apply(this, arguments);
      }

      return startSyncing;
    }()
  }, {
    key: "stopSyncing",
    value: function () {
      var _stopSyncing2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee240() {
        return _regenerator["default"].wrap(function _callee240$(_context240) {
          while (1) {
            switch (_context240.prev = _context240.next) {
              case 0:
                return _context240.abrupt("return", this._invokeWorker("stopSyncing"));

              case 1:
              case "end":
                return _context240.stop();
            }
          }
        }, _callee240, this);
      }));

      function stopSyncing() {
        return _stopSyncing2.apply(this, arguments);
      }

      return stopSyncing;
    }()
  }, {
    key: "scanTxs",
    value: function () {
      var _scanTxs2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee241(txHashes) {
        return _regenerator["default"].wrap(function _callee241$(_context241) {
          while (1) {
            switch (_context241.prev = _context241.next) {
              case 0:
                (0, _assert["default"])(Array.isArray(txHashes), "Must provide an array of txs hashes to scan");
                return _context241.abrupt("return", this._invokeWorker("scanTxs", [txHashes]));

              case 2:
              case "end":
                return _context241.stop();
            }
          }
        }, _callee241, this);
      }));

      function scanTxs(_x184) {
        return _scanTxs2.apply(this, arguments);
      }

      return scanTxs;
    }()
  }, {
    key: "rescanSpent",
    value: function () {
      var _rescanSpent2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee242() {
        return _regenerator["default"].wrap(function _callee242$(_context242) {
          while (1) {
            switch (_context242.prev = _context242.next) {
              case 0:
                return _context242.abrupt("return", this._invokeWorker("rescanSpent"));

              case 1:
              case "end":
                return _context242.stop();
            }
          }
        }, _callee242, this);
      }));

      function rescanSpent() {
        return _rescanSpent2.apply(this, arguments);
      }

      return rescanSpent;
    }()
  }, {
    key: "rescanBlockchain",
    value: function () {
      var _rescanBlockchain2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee243() {
        return _regenerator["default"].wrap(function _callee243$(_context243) {
          while (1) {
            switch (_context243.prev = _context243.next) {
              case 0:
                return _context243.abrupt("return", this._invokeWorker("rescanBlockchain"));

              case 1:
              case "end":
                return _context243.stop();
            }
          }
        }, _callee243, this);
      }));

      function rescanBlockchain() {
        return _rescanBlockchain2.apply(this, arguments);
      }

      return rescanBlockchain;
    }()
  }, {
    key: "getBalance",
    value: function () {
      var _getBalance2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee244(accountIdx, subaddressIdx) {
        var _args244 = arguments;
        return _regenerator["default"].wrap(function _callee244$(_context244) {
          while (1) {
            switch (_context244.prev = _context244.next) {
              case 0:
                _context244.t0 = BigInt;
                _context244.next = 3;
                return this._invokeWorker("getBalance", Array.from(_args244));

              case 3:
                _context244.t1 = _context244.sent;
                return _context244.abrupt("return", (0, _context244.t0)(_context244.t1));

              case 5:
              case "end":
                return _context244.stop();
            }
          }
        }, _callee244, this);
      }));

      function getBalance(_x185, _x186) {
        return _getBalance2.apply(this, arguments);
      }

      return getBalance;
    }()
  }, {
    key: "getUnlockedBalance",
    value: function () {
      var _getUnlockedBalance2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee245(accountIdx, subaddressIdx) {
        var unlockedBalanceStr,
            _args245 = arguments;
        return _regenerator["default"].wrap(function _callee245$(_context245) {
          while (1) {
            switch (_context245.prev = _context245.next) {
              case 0:
                _context245.next = 2;
                return this._invokeWorker("getUnlockedBalance", Array.from(_args245));

              case 2:
                unlockedBalanceStr = _context245.sent;
                return _context245.abrupt("return", BigInt(unlockedBalanceStr));

              case 4:
              case "end":
                return _context245.stop();
            }
          }
        }, _callee245, this);
      }));

      function getUnlockedBalance(_x187, _x188) {
        return _getUnlockedBalance2.apply(this, arguments);
      }

      return getUnlockedBalance;
    }()
  }, {
    key: "getAccounts",
    value: function () {
      var _getAccounts2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee246(includeSubaddresses, tag) {
        var accounts,
            _iterator25,
            _step25,
            accountJson,
            _args246 = arguments;

        return _regenerator["default"].wrap(function _callee246$(_context246) {
          while (1) {
            switch (_context246.prev = _context246.next) {
              case 0:
                accounts = [];
                _context246.t0 = _createForOfIteratorHelper;
                _context246.next = 4;
                return this._invokeWorker("getAccounts", Array.from(_args246));

              case 4:
                _context246.t1 = _context246.sent;
                _iterator25 = (0, _context246.t0)(_context246.t1);

                try {
                  for (_iterator25.s(); !(_step25 = _iterator25.n()).done;) {
                    accountJson = _step25.value;
                    accounts.push(MoneroWalletFull._sanitizeAccount(new _MoneroAccount["default"](accountJson)));
                  }
                } catch (err) {
                  _iterator25.e(err);
                } finally {
                  _iterator25.f();
                }

                return _context246.abrupt("return", accounts);

              case 8:
              case "end":
                return _context246.stop();
            }
          }
        }, _callee246, this);
      }));

      function getAccounts(_x189, _x190) {
        return _getAccounts2.apply(this, arguments);
      }

      return getAccounts;
    }()
  }, {
    key: "getAccount",
    value: function () {
      var _getAccount2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee247(accountIdx, includeSubaddresses) {
        var accountJson,
            _args247 = arguments;
        return _regenerator["default"].wrap(function _callee247$(_context247) {
          while (1) {
            switch (_context247.prev = _context247.next) {
              case 0:
                _context247.next = 2;
                return this._invokeWorker("getAccount", Array.from(_args247));

              case 2:
                accountJson = _context247.sent;
                return _context247.abrupt("return", MoneroWalletFull._sanitizeAccount(new _MoneroAccount["default"](accountJson)));

              case 4:
              case "end":
                return _context247.stop();
            }
          }
        }, _callee247, this);
      }));

      function getAccount(_x191, _x192) {
        return _getAccount2.apply(this, arguments);
      }

      return getAccount;
    }()
  }, {
    key: "createAccount",
    value: function () {
      var _createAccount2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee248(label) {
        var accountJson,
            _args248 = arguments;
        return _regenerator["default"].wrap(function _callee248$(_context248) {
          while (1) {
            switch (_context248.prev = _context248.next) {
              case 0:
                _context248.next = 2;
                return this._invokeWorker("createAccount", Array.from(_args248));

              case 2:
                accountJson = _context248.sent;
                return _context248.abrupt("return", MoneroWalletFull._sanitizeAccount(new _MoneroAccount["default"](accountJson)));

              case 4:
              case "end":
                return _context248.stop();
            }
          }
        }, _callee248, this);
      }));

      function createAccount(_x193) {
        return _createAccount2.apply(this, arguments);
      }

      return createAccount;
    }()
  }, {
    key: "getSubaddresses",
    value: function () {
      var _getSubaddresses2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee249(accountIdx, subaddressIndices) {
        var subaddresses,
            _iterator26,
            _step26,
            subaddressJson,
            _args249 = arguments;

        return _regenerator["default"].wrap(function _callee249$(_context249) {
          while (1) {
            switch (_context249.prev = _context249.next) {
              case 0:
                subaddresses = [];
                _context249.t0 = _createForOfIteratorHelper;
                _context249.next = 4;
                return this._invokeWorker("getSubaddresses", Array.from(_args249));

              case 4:
                _context249.t1 = _context249.sent;
                _iterator26 = (0, _context249.t0)(_context249.t1);

                try {
                  for (_iterator26.s(); !(_step26 = _iterator26.n()).done;) {
                    subaddressJson = _step26.value;
                    subaddresses.push(MoneroWalletFull._sanitizeSubaddress(new _MoneroSubaddress["default"](subaddressJson)));
                  }
                } catch (err) {
                  _iterator26.e(err);
                } finally {
                  _iterator26.f();
                }

                return _context249.abrupt("return", subaddresses);

              case 8:
              case "end":
                return _context249.stop();
            }
          }
        }, _callee249, this);
      }));

      function getSubaddresses(_x194, _x195) {
        return _getSubaddresses2.apply(this, arguments);
      }

      return getSubaddresses;
    }()
  }, {
    key: "createSubaddress",
    value: function () {
      var _createSubaddress2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee250(accountIdx, label) {
        var subaddressJson,
            _args250 = arguments;
        return _regenerator["default"].wrap(function _callee250$(_context250) {
          while (1) {
            switch (_context250.prev = _context250.next) {
              case 0:
                _context250.next = 2;
                return this._invokeWorker("createSubaddress", Array.from(_args250));

              case 2:
                subaddressJson = _context250.sent;
                return _context250.abrupt("return", MoneroWalletFull._sanitizeSubaddress(new _MoneroSubaddress["default"](subaddressJson)));

              case 4:
              case "end":
                return _context250.stop();
            }
          }
        }, _callee250, this);
      }));

      function createSubaddress(_x196, _x197) {
        return _createSubaddress2.apply(this, arguments);
      }

      return createSubaddress;
    }()
  }, {
    key: "getTxs",
    value: function () {
      var _getTxs2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee251(query, missingTxHashes) {
        var respJson;
        return _regenerator["default"].wrap(function _callee251$(_context251) {
          while (1) {
            switch (_context251.prev = _context251.next) {
              case 0:
                query = _MoneroWallet2["default"]._normalizeTxQuery(query);
                _context251.next = 3;
                return this._invokeWorker("getTxs", [query.getBlock().toJson(), missingTxHashes]);

              case 3:
                respJson = _context251.sent;
                return _context251.abrupt("return", MoneroWalletFull._deserializeTxs(query, JSON.stringify({
                  blocks: respJson.blocks,
                  missingTxHashes: respJson.missingTxHashes
                }), missingTxHashes));

              case 5:
              case "end":
                return _context251.stop();
            }
          }
        }, _callee251, this);
      }));

      function getTxs(_x198, _x199) {
        return _getTxs2.apply(this, arguments);
      }

      return getTxs;
    }()
  }, {
    key: "getTransfers",
    value: function () {
      var _getTransfers2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee252(query) {
        var blockJsons;
        return _regenerator["default"].wrap(function _callee252$(_context252) {
          while (1) {
            switch (_context252.prev = _context252.next) {
              case 0:
                query = _MoneroWallet2["default"]._normalizeTransferQuery(query);
                _context252.next = 3;
                return this._invokeWorker("getTransfers", [query.getTxQuery().getBlock().toJson()]);

              case 3:
                blockJsons = _context252.sent;
                return _context252.abrupt("return", MoneroWalletFull._deserializeTransfers(query, JSON.stringify({
                  blocks: blockJsons
                })));

              case 5:
              case "end":
                return _context252.stop();
            }
          }
        }, _callee252, this);
      }));

      function getTransfers(_x200) {
        return _getTransfers2.apply(this, arguments);
      }

      return getTransfers;
    }()
  }, {
    key: "getOutputs",
    value: function () {
      var _getOutputs2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee253(query) {
        var blockJsons;
        return _regenerator["default"].wrap(function _callee253$(_context253) {
          while (1) {
            switch (_context253.prev = _context253.next) {
              case 0:
                query = _MoneroWallet2["default"]._normalizeOutputQuery(query);
                _context253.next = 3;
                return this._invokeWorker("getOutputs", [query.getTxQuery().getBlock().toJson()]);

              case 3:
                blockJsons = _context253.sent;
                return _context253.abrupt("return", MoneroWalletFull._deserializeOutputs(query, JSON.stringify({
                  blocks: blockJsons
                })));

              case 5:
              case "end":
                return _context253.stop();
            }
          }
        }, _callee253, this);
      }));

      function getOutputs(_x201) {
        return _getOutputs2.apply(this, arguments);
      }

      return getOutputs;
    }()
  }, {
    key: "exportOutputs",
    value: function () {
      var _exportOutputs2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee254(all) {
        return _regenerator["default"].wrap(function _callee254$(_context254) {
          while (1) {
            switch (_context254.prev = _context254.next) {
              case 0:
                return _context254.abrupt("return", this._invokeWorker("exportOutputs", [all]));

              case 1:
              case "end":
                return _context254.stop();
            }
          }
        }, _callee254, this);
      }));

      function exportOutputs(_x202) {
        return _exportOutputs2.apply(this, arguments);
      }

      return exportOutputs;
    }()
  }, {
    key: "importOutputs",
    value: function () {
      var _importOutputs2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee255(outputsHex) {
        return _regenerator["default"].wrap(function _callee255$(_context255) {
          while (1) {
            switch (_context255.prev = _context255.next) {
              case 0:
                return _context255.abrupt("return", this._invokeWorker("importOutputs", [outputsHex]));

              case 1:
              case "end":
                return _context255.stop();
            }
          }
        }, _callee255, this);
      }));

      function importOutputs(_x203) {
        return _importOutputs2.apply(this, arguments);
      }

      return importOutputs;
    }()
  }, {
    key: "exportKeyImages",
    value: function () {
      var _exportKeyImages2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee256(all) {
        var keyImages, _iterator27, _step27, keyImageJson;

        return _regenerator["default"].wrap(function _callee256$(_context256) {
          while (1) {
            switch (_context256.prev = _context256.next) {
              case 0:
                keyImages = [];
                _context256.t0 = _createForOfIteratorHelper;
                _context256.next = 4;
                return this._invokeWorker("getKeyImages", [all]);

              case 4:
                _context256.t1 = _context256.sent;
                _iterator27 = (0, _context256.t0)(_context256.t1);

                try {
                  for (_iterator27.s(); !(_step27 = _iterator27.n()).done;) {
                    keyImageJson = _step27.value;
                    keyImages.push(new _MoneroKeyImage["default"](keyImageJson));
                  }
                } catch (err) {
                  _iterator27.e(err);
                } finally {
                  _iterator27.f();
                }

                return _context256.abrupt("return", keyImages);

              case 8:
              case "end":
                return _context256.stop();
            }
          }
        }, _callee256, this);
      }));

      function exportKeyImages(_x204) {
        return _exportKeyImages2.apply(this, arguments);
      }

      return exportKeyImages;
    }()
  }, {
    key: "importKeyImages",
    value: function () {
      var _importKeyImages2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee257(keyImages) {
        var keyImagesJson, _iterator28, _step28, keyImage;

        return _regenerator["default"].wrap(function _callee257$(_context257) {
          while (1) {
            switch (_context257.prev = _context257.next) {
              case 0:
                keyImagesJson = [];
                _iterator28 = _createForOfIteratorHelper(keyImages);

                try {
                  for (_iterator28.s(); !(_step28 = _iterator28.n()).done;) {
                    keyImage = _step28.value;
                    keyImagesJson.push(keyImage.toJson());
                  }
                } catch (err) {
                  _iterator28.e(err);
                } finally {
                  _iterator28.f();
                }

                _context257.t0 = _MoneroKeyImageImportResult["default"];
                _context257.next = 6;
                return this._invokeWorker("importKeyImages", [keyImagesJson]);

              case 6:
                _context257.t1 = _context257.sent;
                return _context257.abrupt("return", new _context257.t0(_context257.t1));

              case 8:
              case "end":
                return _context257.stop();
            }
          }
        }, _callee257, this);
      }));

      function importKeyImages(_x205) {
        return _importKeyImages2.apply(this, arguments);
      }

      return importKeyImages;
    }()
  }, {
    key: "getNewKeyImagesFromLastImport",
    value: function () {
      var _getNewKeyImagesFromLastImport2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee258() {
        return _regenerator["default"].wrap(function _callee258$(_context258) {
          while (1) {
            switch (_context258.prev = _context258.next) {
              case 0:
                throw new _MoneroError["default"]("MoneroWalletFull.getNewKeyImagesFromLastImport() not implemented");

              case 1:
              case "end":
                return _context258.stop();
            }
          }
        }, _callee258);
      }));

      function getNewKeyImagesFromLastImport() {
        return _getNewKeyImagesFromLastImport2.apply(this, arguments);
      }

      return getNewKeyImagesFromLastImport;
    }()
  }, {
    key: "freezeOutput",
    value: function () {
      var _freezeOutput2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee259(keyImage) {
        return _regenerator["default"].wrap(function _callee259$(_context259) {
          while (1) {
            switch (_context259.prev = _context259.next) {
              case 0:
                return _context259.abrupt("return", this._invokeWorker("freezeOutput", [keyImage]));

              case 1:
              case "end":
                return _context259.stop();
            }
          }
        }, _callee259, this);
      }));

      function freezeOutput(_x206) {
        return _freezeOutput2.apply(this, arguments);
      }

      return freezeOutput;
    }()
  }, {
    key: "thawOutput",
    value: function () {
      var _thawOutput2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee260(keyImage) {
        return _regenerator["default"].wrap(function _callee260$(_context260) {
          while (1) {
            switch (_context260.prev = _context260.next) {
              case 0:
                return _context260.abrupt("return", this._invokeWorker("thawOutput", [keyImage]));

              case 1:
              case "end":
                return _context260.stop();
            }
          }
        }, _callee260, this);
      }));

      function thawOutput(_x207) {
        return _thawOutput2.apply(this, arguments);
      }

      return thawOutput;
    }()
  }, {
    key: "isOutputFrozen",
    value: function () {
      var _isOutputFrozen2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee261(keyImage) {
        return _regenerator["default"].wrap(function _callee261$(_context261) {
          while (1) {
            switch (_context261.prev = _context261.next) {
              case 0:
                return _context261.abrupt("return", this._invokeWorker("isOutputFrozen", [keyImage]));

              case 1:
              case "end":
                return _context261.stop();
            }
          }
        }, _callee261, this);
      }));

      function isOutputFrozen(_x208) {
        return _isOutputFrozen2.apply(this, arguments);
      }

      return isOutputFrozen;
    }()
  }, {
    key: "createTxs",
    value: function () {
      var _createTxs2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee262(config) {
        var txSetJson;
        return _regenerator["default"].wrap(function _callee262$(_context262) {
          while (1) {
            switch (_context262.prev = _context262.next) {
              case 0:
                config = _MoneroWallet2["default"]._normalizeCreateTxsConfig(config);
                _context262.next = 3;
                return this._invokeWorker("createTxs", [config.toJson()]);

              case 3:
                txSetJson = _context262.sent;
                return _context262.abrupt("return", new _MoneroTxSet["default"](txSetJson).getTxs());

              case 5:
              case "end":
                return _context262.stop();
            }
          }
        }, _callee262, this);
      }));

      function createTxs(_x209) {
        return _createTxs2.apply(this, arguments);
      }

      return createTxs;
    }()
  }, {
    key: "sweepOutput",
    value: function () {
      var _sweepOutput2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee263(config) {
        var txSetJson;
        return _regenerator["default"].wrap(function _callee263$(_context263) {
          while (1) {
            switch (_context263.prev = _context263.next) {
              case 0:
                config = _MoneroWallet2["default"]._normalizeSweepOutputConfig(config);
                _context263.next = 3;
                return this._invokeWorker("sweepOutput", [config.toJson()]);

              case 3:
                txSetJson = _context263.sent;
                return _context263.abrupt("return", new _MoneroTxSet["default"](txSetJson).getTxs()[0]);

              case 5:
              case "end":
                return _context263.stop();
            }
          }
        }, _callee263, this);
      }));

      function sweepOutput(_x210) {
        return _sweepOutput2.apply(this, arguments);
      }

      return sweepOutput;
    }()
  }, {
    key: "sweepUnlocked",
    value: function () {
      var _sweepUnlocked2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee264(config) {
        var txSetsJson, txs, _iterator29, _step29, txSetJson, _iterator30, _step30, tx;

        return _regenerator["default"].wrap(function _callee264$(_context264) {
          while (1) {
            switch (_context264.prev = _context264.next) {
              case 0:
                config = _MoneroWallet2["default"]._normalizeSweepUnlockedConfig(config);
                _context264.next = 3;
                return this._invokeWorker("sweepUnlocked", [config.toJson()]);

              case 3:
                txSetsJson = _context264.sent;
                txs = [];
                _iterator29 = _createForOfIteratorHelper(txSetsJson);

                try {
                  for (_iterator29.s(); !(_step29 = _iterator29.n()).done;) {
                    txSetJson = _step29.value;
                    _iterator30 = _createForOfIteratorHelper(new _MoneroTxSet["default"](txSetJson).getTxs());

                    try {
                      for (_iterator30.s(); !(_step30 = _iterator30.n()).done;) {
                        tx = _step30.value;
                        txs.push(tx);
                      }
                    } catch (err) {
                      _iterator30.e(err);
                    } finally {
                      _iterator30.f();
                    }
                  }
                } catch (err) {
                  _iterator29.e(err);
                } finally {
                  _iterator29.f();
                }

                return _context264.abrupt("return", txs);

              case 8:
              case "end":
                return _context264.stop();
            }
          }
        }, _callee264, this);
      }));

      function sweepUnlocked(_x211) {
        return _sweepUnlocked2.apply(this, arguments);
      }

      return sweepUnlocked;
    }()
  }, {
    key: "sweepDust",
    value: function () {
      var _sweepDust2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee265(relay) {
        return _regenerator["default"].wrap(function _callee265$(_context265) {
          while (1) {
            switch (_context265.prev = _context265.next) {
              case 0:
                _context265.t1 = _MoneroTxSet["default"];
                _context265.next = 3;
                return this._invokeWorker("sweepDust", [relay]);

              case 3:
                _context265.t2 = _context265.sent;
                _context265.t0 = new _context265.t1(_context265.t2).getTxs();

                if (_context265.t0) {
                  _context265.next = 7;
                  break;
                }

                _context265.t0 = [];

              case 7:
                return _context265.abrupt("return", _context265.t0);

              case 8:
              case "end":
                return _context265.stop();
            }
          }
        }, _callee265, this);
      }));

      function sweepDust(_x212) {
        return _sweepDust2.apply(this, arguments);
      }

      return sweepDust;
    }()
  }, {
    key: "relayTxs",
    value: function () {
      var _relayTxs2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee266(txsOrMetadatas) {
        var txMetadatas, _iterator31, _step31, txOrMetadata;

        return _regenerator["default"].wrap(function _callee266$(_context266) {
          while (1) {
            switch (_context266.prev = _context266.next) {
              case 0:
                (0, _assert["default"])(Array.isArray(txsOrMetadatas), "Must provide an array of txs or their metadata to relay");
                txMetadatas = [];
                _iterator31 = _createForOfIteratorHelper(txsOrMetadatas);

                try {
                  for (_iterator31.s(); !(_step31 = _iterator31.n()).done;) {
                    txOrMetadata = _step31.value;
                    txMetadatas.push(txOrMetadata instanceof _MoneroTxWallet["default"] ? txOrMetadata.getMetadata() : txOrMetadata);
                  }
                } catch (err) {
                  _iterator31.e(err);
                } finally {
                  _iterator31.f();
                }

                return _context266.abrupt("return", this._invokeWorker("relayTxs", [txMetadatas]));

              case 5:
              case "end":
                return _context266.stop();
            }
          }
        }, _callee266, this);
      }));

      function relayTxs(_x213) {
        return _relayTxs2.apply(this, arguments);
      }

      return relayTxs;
    }()
  }, {
    key: "describeTxSet",
    value: function () {
      var _describeTxSet2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee267(txSet) {
        return _regenerator["default"].wrap(function _callee267$(_context267) {
          while (1) {
            switch (_context267.prev = _context267.next) {
              case 0:
                _context267.t0 = _MoneroTxSet["default"];
                _context267.next = 3;
                return this._invokeWorker("describeTxSet", [txSet.toJson()]);

              case 3:
                _context267.t1 = _context267.sent;
                return _context267.abrupt("return", new _context267.t0(_context267.t1));

              case 5:
              case "end":
                return _context267.stop();
            }
          }
        }, _callee267, this);
      }));

      function describeTxSet(_x214) {
        return _describeTxSet2.apply(this, arguments);
      }

      return describeTxSet;
    }()
  }, {
    key: "signTxs",
    value: function () {
      var _signTxs2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee268(unsignedTxHex) {
        var _args268 = arguments;
        return _regenerator["default"].wrap(function _callee268$(_context268) {
          while (1) {
            switch (_context268.prev = _context268.next) {
              case 0:
                return _context268.abrupt("return", this._invokeWorker("signTxs", Array.from(_args268)));

              case 1:
              case "end":
                return _context268.stop();
            }
          }
        }, _callee268, this);
      }));

      function signTxs(_x215) {
        return _signTxs2.apply(this, arguments);
      }

      return signTxs;
    }()
  }, {
    key: "submitTxs",
    value: function () {
      var _submitTxs2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee269(signedTxHex) {
        var _args269 = arguments;
        return _regenerator["default"].wrap(function _callee269$(_context269) {
          while (1) {
            switch (_context269.prev = _context269.next) {
              case 0:
                return _context269.abrupt("return", this._invokeWorker("submitTxs", Array.from(_args269)));

              case 1:
              case "end":
                return _context269.stop();
            }
          }
        }, _callee269, this);
      }));

      function submitTxs(_x216) {
        return _submitTxs2.apply(this, arguments);
      }

      return submitTxs;
    }()
  }, {
    key: "signMessage",
    value: function () {
      var _signMessage2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee270(message, signatureType, accountIdx, subaddressIdx) {
        var _args270 = arguments;
        return _regenerator["default"].wrap(function _callee270$(_context270) {
          while (1) {
            switch (_context270.prev = _context270.next) {
              case 0:
                return _context270.abrupt("return", this._invokeWorker("signMessage", Array.from(_args270)));

              case 1:
              case "end":
                return _context270.stop();
            }
          }
        }, _callee270, this);
      }));

      function signMessage(_x217, _x218, _x219, _x220) {
        return _signMessage2.apply(this, arguments);
      }

      return signMessage;
    }()
  }, {
    key: "verifyMessage",
    value: function () {
      var _verifyMessage2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee271(message, address, signature) {
        var _args271 = arguments;
        return _regenerator["default"].wrap(function _callee271$(_context271) {
          while (1) {
            switch (_context271.prev = _context271.next) {
              case 0:
                _context271.t0 = _MoneroMessageSignatureResult["default"];
                _context271.next = 3;
                return this._invokeWorker("verifyMessage", Array.from(_args271));

              case 3:
                _context271.t1 = _context271.sent;
                return _context271.abrupt("return", new _context271.t0(_context271.t1));

              case 5:
              case "end":
                return _context271.stop();
            }
          }
        }, _callee271, this);
      }));

      function verifyMessage(_x221, _x222, _x223) {
        return _verifyMessage2.apply(this, arguments);
      }

      return verifyMessage;
    }()
  }, {
    key: "getTxKey",
    value: function () {
      var _getTxKey2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee272(txHash) {
        var _args272 = arguments;
        return _regenerator["default"].wrap(function _callee272$(_context272) {
          while (1) {
            switch (_context272.prev = _context272.next) {
              case 0:
                return _context272.abrupt("return", this._invokeWorker("getTxKey", Array.from(_args272)));

              case 1:
              case "end":
                return _context272.stop();
            }
          }
        }, _callee272, this);
      }));

      function getTxKey(_x224) {
        return _getTxKey2.apply(this, arguments);
      }

      return getTxKey;
    }()
  }, {
    key: "checkTxKey",
    value: function () {
      var _checkTxKey2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee273(txHash, txKey, address) {
        var _args273 = arguments;
        return _regenerator["default"].wrap(function _callee273$(_context273) {
          while (1) {
            switch (_context273.prev = _context273.next) {
              case 0:
                _context273.t0 = _MoneroCheckTx["default"];
                _context273.next = 3;
                return this._invokeWorker("checkTxKey", Array.from(_args273));

              case 3:
                _context273.t1 = _context273.sent;
                return _context273.abrupt("return", new _context273.t0(_context273.t1));

              case 5:
              case "end":
                return _context273.stop();
            }
          }
        }, _callee273, this);
      }));

      function checkTxKey(_x225, _x226, _x227) {
        return _checkTxKey2.apply(this, arguments);
      }

      return checkTxKey;
    }()
  }, {
    key: "getTxProof",
    value: function () {
      var _getTxProof2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee274(txHash, address, message) {
        var _args274 = arguments;
        return _regenerator["default"].wrap(function _callee274$(_context274) {
          while (1) {
            switch (_context274.prev = _context274.next) {
              case 0:
                return _context274.abrupt("return", this._invokeWorker("getTxProof", Array.from(_args274)));

              case 1:
              case "end":
                return _context274.stop();
            }
          }
        }, _callee274, this);
      }));

      function getTxProof(_x228, _x229, _x230) {
        return _getTxProof2.apply(this, arguments);
      }

      return getTxProof;
    }()
  }, {
    key: "checkTxProof",
    value: function () {
      var _checkTxProof2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee275(txHash, address, message, signature) {
        var _args275 = arguments;
        return _regenerator["default"].wrap(function _callee275$(_context275) {
          while (1) {
            switch (_context275.prev = _context275.next) {
              case 0:
                _context275.t0 = _MoneroCheckTx["default"];
                _context275.next = 3;
                return this._invokeWorker("checkTxProof", Array.from(_args275));

              case 3:
                _context275.t1 = _context275.sent;
                return _context275.abrupt("return", new _context275.t0(_context275.t1));

              case 5:
              case "end":
                return _context275.stop();
            }
          }
        }, _callee275, this);
      }));

      function checkTxProof(_x231, _x232, _x233, _x234) {
        return _checkTxProof2.apply(this, arguments);
      }

      return checkTxProof;
    }()
  }, {
    key: "getSpendProof",
    value: function () {
      var _getSpendProof2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee276(txHash, message) {
        var _args276 = arguments;
        return _regenerator["default"].wrap(function _callee276$(_context276) {
          while (1) {
            switch (_context276.prev = _context276.next) {
              case 0:
                return _context276.abrupt("return", this._invokeWorker("getSpendProof", Array.from(_args276)));

              case 1:
              case "end":
                return _context276.stop();
            }
          }
        }, _callee276, this);
      }));

      function getSpendProof(_x235, _x236) {
        return _getSpendProof2.apply(this, arguments);
      }

      return getSpendProof;
    }()
  }, {
    key: "checkSpendProof",
    value: function () {
      var _checkSpendProof2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee277(txHash, message, signature) {
        var _args277 = arguments;
        return _regenerator["default"].wrap(function _callee277$(_context277) {
          while (1) {
            switch (_context277.prev = _context277.next) {
              case 0:
                return _context277.abrupt("return", this._invokeWorker("checkSpendProof", Array.from(_args277)));

              case 1:
              case "end":
                return _context277.stop();
            }
          }
        }, _callee277, this);
      }));

      function checkSpendProof(_x237, _x238, _x239) {
        return _checkSpendProof2.apply(this, arguments);
      }

      return checkSpendProof;
    }()
  }, {
    key: "getReserveProofWallet",
    value: function () {
      var _getReserveProofWallet2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee278(message) {
        var _args278 = arguments;
        return _regenerator["default"].wrap(function _callee278$(_context278) {
          while (1) {
            switch (_context278.prev = _context278.next) {
              case 0:
                return _context278.abrupt("return", this._invokeWorker("getReserveProofWallet", Array.from(_args278)));

              case 1:
              case "end":
                return _context278.stop();
            }
          }
        }, _callee278, this);
      }));

      function getReserveProofWallet(_x240) {
        return _getReserveProofWallet2.apply(this, arguments);
      }

      return getReserveProofWallet;
    }()
  }, {
    key: "getReserveProofAccount",
    value: function () {
      var _getReserveProofAccount2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee279(accountIdx, amount, message) {
        return _regenerator["default"].wrap(function _callee279$(_context279) {
          while (1) {
            switch (_context279.prev = _context279.next) {
              case 0:
                _context279.prev = 0;
                _context279.next = 3;
                return this._invokeWorker("getReserveProofAccount", [accountIdx, amount.toString(), message]);

              case 3:
                return _context279.abrupt("return", _context279.sent);

              case 6:
                _context279.prev = 6;
                _context279.t0 = _context279["catch"](0);
                throw new _MoneroError["default"](_context279.t0.message, -1);

              case 9:
              case "end":
                return _context279.stop();
            }
          }
        }, _callee279, this, [[0, 6]]);
      }));

      function getReserveProofAccount(_x241, _x242, _x243) {
        return _getReserveProofAccount2.apply(this, arguments);
      }

      return getReserveProofAccount;
    }()
  }, {
    key: "checkReserveProof",
    value: function () {
      var _checkReserveProof2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee280(address, message, signature) {
        var _args280 = arguments;
        return _regenerator["default"].wrap(function _callee280$(_context280) {
          while (1) {
            switch (_context280.prev = _context280.next) {
              case 0:
                _context280.prev = 0;
                _context280.t0 = _MoneroCheckReserve["default"];
                _context280.next = 4;
                return this._invokeWorker("checkReserveProof", Array.from(_args280));

              case 4:
                _context280.t1 = _context280.sent;
                return _context280.abrupt("return", new _context280.t0(_context280.t1));

              case 8:
                _context280.prev = 8;
                _context280.t2 = _context280["catch"](0);
                throw new _MoneroError["default"](_context280.t2.message, -1);

              case 11:
              case "end":
                return _context280.stop();
            }
          }
        }, _callee280, this, [[0, 8]]);
      }));

      function checkReserveProof(_x244, _x245, _x246) {
        return _checkReserveProof2.apply(this, arguments);
      }

      return checkReserveProof;
    }()
  }, {
    key: "getTxNotes",
    value: function () {
      var _getTxNotes2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee281(txHashes) {
        var _args281 = arguments;
        return _regenerator["default"].wrap(function _callee281$(_context281) {
          while (1) {
            switch (_context281.prev = _context281.next) {
              case 0:
                return _context281.abrupt("return", this._invokeWorker("getTxNotes", Array.from(_args281)));

              case 1:
              case "end":
                return _context281.stop();
            }
          }
        }, _callee281, this);
      }));

      function getTxNotes(_x247) {
        return _getTxNotes2.apply(this, arguments);
      }

      return getTxNotes;
    }()
  }, {
    key: "setTxNotes",
    value: function () {
      var _setTxNotes2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee282(txHashes, notes) {
        var _args282 = arguments;
        return _regenerator["default"].wrap(function _callee282$(_context282) {
          while (1) {
            switch (_context282.prev = _context282.next) {
              case 0:
                return _context282.abrupt("return", this._invokeWorker("setTxNotes", Array.from(_args282)));

              case 1:
              case "end":
                return _context282.stop();
            }
          }
        }, _callee282, this);
      }));

      function setTxNotes(_x248, _x249) {
        return _setTxNotes2.apply(this, arguments);
      }

      return setTxNotes;
    }()
  }, {
    key: "getAddressBookEntries",
    value: function () {
      var _getAddressBookEntries2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee283(entryIndices) {
        var entries,
            _iterator32,
            _step32,
            entryJson,
            _args283 = arguments;

        return _regenerator["default"].wrap(function _callee283$(_context283) {
          while (1) {
            switch (_context283.prev = _context283.next) {
              case 0:
                if (!entryIndices) entryIndices = [];
                entries = [];
                _context283.t0 = _createForOfIteratorHelper;
                _context283.next = 5;
                return this._invokeWorker("getAddressBookEntries", Array.from(_args283));

              case 5:
                _context283.t1 = _context283.sent;
                _iterator32 = (0, _context283.t0)(_context283.t1);

                try {
                  for (_iterator32.s(); !(_step32 = _iterator32.n()).done;) {
                    entryJson = _step32.value;
                    entries.push(new _MoneroAddressBookEntry["default"](entryJson));
                  }
                } catch (err) {
                  _iterator32.e(err);
                } finally {
                  _iterator32.f();
                }

                return _context283.abrupt("return", entries);

              case 9:
              case "end":
                return _context283.stop();
            }
          }
        }, _callee283, this);
      }));

      function getAddressBookEntries(_x250) {
        return _getAddressBookEntries2.apply(this, arguments);
      }

      return getAddressBookEntries;
    }()
  }, {
    key: "addAddressBookEntry",
    value: function () {
      var _addAddressBookEntry2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee284(address, description) {
        var _args284 = arguments;
        return _regenerator["default"].wrap(function _callee284$(_context284) {
          while (1) {
            switch (_context284.prev = _context284.next) {
              case 0:
                return _context284.abrupt("return", this._invokeWorker("addAddressBookEntry", Array.from(_args284)));

              case 1:
              case "end":
                return _context284.stop();
            }
          }
        }, _callee284, this);
      }));

      function addAddressBookEntry(_x251, _x252) {
        return _addAddressBookEntry2.apply(this, arguments);
      }

      return addAddressBookEntry;
    }()
  }, {
    key: "editAddressBookEntry",
    value: function () {
      var _editAddressBookEntry2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee285(index, setAddress, address, setDescription, description) {
        var _args285 = arguments;
        return _regenerator["default"].wrap(function _callee285$(_context285) {
          while (1) {
            switch (_context285.prev = _context285.next) {
              case 0:
                return _context285.abrupt("return", this._invokeWorker("editAddressBookEntry", Array.from(_args285)));

              case 1:
              case "end":
                return _context285.stop();
            }
          }
        }, _callee285, this);
      }));

      function editAddressBookEntry(_x253, _x254, _x255, _x256, _x257) {
        return _editAddressBookEntry2.apply(this, arguments);
      }

      return editAddressBookEntry;
    }()
  }, {
    key: "deleteAddressBookEntry",
    value: function () {
      var _deleteAddressBookEntry2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee286(entryIdx) {
        var _args286 = arguments;
        return _regenerator["default"].wrap(function _callee286$(_context286) {
          while (1) {
            switch (_context286.prev = _context286.next) {
              case 0:
                return _context286.abrupt("return", this._invokeWorker("deleteAddressBookEntry", Array.from(_args286)));

              case 1:
              case "end":
                return _context286.stop();
            }
          }
        }, _callee286, this);
      }));

      function deleteAddressBookEntry(_x258) {
        return _deleteAddressBookEntry2.apply(this, arguments);
      }

      return deleteAddressBookEntry;
    }()
  }, {
    key: "tagAccounts",
    value: function () {
      var _tagAccounts2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee287(tag, accountIndices) {
        var _args287 = arguments;
        return _regenerator["default"].wrap(function _callee287$(_context287) {
          while (1) {
            switch (_context287.prev = _context287.next) {
              case 0:
                return _context287.abrupt("return", this._invokeWorker("tagAccounts", Array.from(_args287)));

              case 1:
              case "end":
                return _context287.stop();
            }
          }
        }, _callee287, this);
      }));

      function tagAccounts(_x259, _x260) {
        return _tagAccounts2.apply(this, arguments);
      }

      return tagAccounts;
    }()
  }, {
    key: "untagAccounts",
    value: function () {
      var _untagAccounts2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee288(accountIndices) {
        var _args288 = arguments;
        return _regenerator["default"].wrap(function _callee288$(_context288) {
          while (1) {
            switch (_context288.prev = _context288.next) {
              case 0:
                return _context288.abrupt("return", this._invokeWorker("untagAccounts", Array.from(_args288)));

              case 1:
              case "end":
                return _context288.stop();
            }
          }
        }, _callee288, this);
      }));

      function untagAccounts(_x261) {
        return _untagAccounts2.apply(this, arguments);
      }

      return untagAccounts;
    }()
  }, {
    key: "getAccountTags",
    value: function () {
      var _getAccountTags2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee289() {
        var _args289 = arguments;
        return _regenerator["default"].wrap(function _callee289$(_context289) {
          while (1) {
            switch (_context289.prev = _context289.next) {
              case 0:
                return _context289.abrupt("return", this._invokeWorker("getAccountTags", Array.from(_args289)));

              case 1:
              case "end":
                return _context289.stop();
            }
          }
        }, _callee289, this);
      }));

      function getAccountTags() {
        return _getAccountTags2.apply(this, arguments);
      }

      return getAccountTags;
    }()
  }, {
    key: "setAccountTagLabel",
    value: function () {
      var _setAccountTagLabel2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee290(tag, label) {
        var _args290 = arguments;
        return _regenerator["default"].wrap(function _callee290$(_context290) {
          while (1) {
            switch (_context290.prev = _context290.next) {
              case 0:
                return _context290.abrupt("return", this._invokeWorker("setAccountTagLabel", Array.from(_args290)));

              case 1:
              case "end":
                return _context290.stop();
            }
          }
        }, _callee290, this);
      }));

      function setAccountTagLabel(_x262, _x263) {
        return _setAccountTagLabel2.apply(this, arguments);
      }

      return setAccountTagLabel;
    }()
  }, {
    key: "getPaymentUri",
    value: function () {
      var _getPaymentUri2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee291(config) {
        return _regenerator["default"].wrap(function _callee291$(_context291) {
          while (1) {
            switch (_context291.prev = _context291.next) {
              case 0:
                config = _MoneroWallet2["default"]._normalizeCreateTxsConfig(config);
                return _context291.abrupt("return", this._invokeWorker("getPaymentUri", [config.toJson()]));

              case 2:
              case "end":
                return _context291.stop();
            }
          }
        }, _callee291, this);
      }));

      function getPaymentUri(_x264) {
        return _getPaymentUri2.apply(this, arguments);
      }

      return getPaymentUri;
    }()
  }, {
    key: "parsePaymentUri",
    value: function () {
      var _parsePaymentUri2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee292(uri) {
        var _args292 = arguments;
        return _regenerator["default"].wrap(function _callee292$(_context292) {
          while (1) {
            switch (_context292.prev = _context292.next) {
              case 0:
                _context292.t0 = _MoneroTxConfig["default"];
                _context292.next = 3;
                return this._invokeWorker("parsePaymentUri", Array.from(_args292));

              case 3:
                _context292.t1 = _context292.sent;
                return _context292.abrupt("return", new _context292.t0(_context292.t1));

              case 5:
              case "end":
                return _context292.stop();
            }
          }
        }, _callee292, this);
      }));

      function parsePaymentUri(_x265) {
        return _parsePaymentUri2.apply(this, arguments);
      }

      return parsePaymentUri;
    }()
  }, {
    key: "getAttribute",
    value: function () {
      var _getAttribute2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee293(key) {
        var _args293 = arguments;
        return _regenerator["default"].wrap(function _callee293$(_context293) {
          while (1) {
            switch (_context293.prev = _context293.next) {
              case 0:
                return _context293.abrupt("return", this._invokeWorker("getAttribute", Array.from(_args293)));

              case 1:
              case "end":
                return _context293.stop();
            }
          }
        }, _callee293, this);
      }));

      function getAttribute(_x266) {
        return _getAttribute2.apply(this, arguments);
      }

      return getAttribute;
    }()
  }, {
    key: "setAttribute",
    value: function () {
      var _setAttribute2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee294(key, val) {
        var _args294 = arguments;
        return _regenerator["default"].wrap(function _callee294$(_context294) {
          while (1) {
            switch (_context294.prev = _context294.next) {
              case 0:
                return _context294.abrupt("return", this._invokeWorker("setAttribute", Array.from(_args294)));

              case 1:
              case "end":
                return _context294.stop();
            }
          }
        }, _callee294, this);
      }));

      function setAttribute(_x267, _x268) {
        return _setAttribute2.apply(this, arguments);
      }

      return setAttribute;
    }()
  }, {
    key: "startMining",
    value: function () {
      var _startMining2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee295(numThreads, backgroundMining, ignoreBattery) {
        var _args295 = arguments;
        return _regenerator["default"].wrap(function _callee295$(_context295) {
          while (1) {
            switch (_context295.prev = _context295.next) {
              case 0:
                return _context295.abrupt("return", this._invokeWorker("startMining", Array.from(_args295)));

              case 1:
              case "end":
                return _context295.stop();
            }
          }
        }, _callee295, this);
      }));

      function startMining(_x269, _x270, _x271) {
        return _startMining2.apply(this, arguments);
      }

      return startMining;
    }()
  }, {
    key: "stopMining",
    value: function () {
      var _stopMining2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee296() {
        var _args296 = arguments;
        return _regenerator["default"].wrap(function _callee296$(_context296) {
          while (1) {
            switch (_context296.prev = _context296.next) {
              case 0:
                return _context296.abrupt("return", this._invokeWorker("stopMining", Array.from(_args296)));

              case 1:
              case "end":
                return _context296.stop();
            }
          }
        }, _callee296, this);
      }));

      function stopMining() {
        return _stopMining2.apply(this, arguments);
      }

      return stopMining;
    }()
  }, {
    key: "isMultisigImportNeeded",
    value: function () {
      var _isMultisigImportNeeded2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee297() {
        return _regenerator["default"].wrap(function _callee297$(_context297) {
          while (1) {
            switch (_context297.prev = _context297.next) {
              case 0:
                return _context297.abrupt("return", this._invokeWorker("isMultisigImportNeeded"));

              case 1:
              case "end":
                return _context297.stop();
            }
          }
        }, _callee297, this);
      }));

      function isMultisigImportNeeded() {
        return _isMultisigImportNeeded2.apply(this, arguments);
      }

      return isMultisigImportNeeded;
    }()
  }, {
    key: "isMultisig",
    value: function () {
      var _isMultisig2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee298() {
        return _regenerator["default"].wrap(function _callee298$(_context298) {
          while (1) {
            switch (_context298.prev = _context298.next) {
              case 0:
                return _context298.abrupt("return", this._invokeWorker("isMultisig"));

              case 1:
              case "end":
                return _context298.stop();
            }
          }
        }, _callee298, this);
      }));

      function isMultisig() {
        return _isMultisig2.apply(this, arguments);
      }

      return isMultisig;
    }()
  }, {
    key: "getMultisigInfo",
    value: function () {
      var _getMultisigInfo2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee299() {
        return _regenerator["default"].wrap(function _callee299$(_context299) {
          while (1) {
            switch (_context299.prev = _context299.next) {
              case 0:
                _context299.t0 = _MoneroMultisigInfo["default"];
                _context299.next = 3;
                return this._invokeWorker("getMultisigInfo");

              case 3:
                _context299.t1 = _context299.sent;
                return _context299.abrupt("return", new _context299.t0(_context299.t1));

              case 5:
              case "end":
                return _context299.stop();
            }
          }
        }, _callee299, this);
      }));

      function getMultisigInfo() {
        return _getMultisigInfo2.apply(this, arguments);
      }

      return getMultisigInfo;
    }()
  }, {
    key: "prepareMultisig",
    value: function () {
      var _prepareMultisig2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee300() {
        return _regenerator["default"].wrap(function _callee300$(_context300) {
          while (1) {
            switch (_context300.prev = _context300.next) {
              case 0:
                return _context300.abrupt("return", this._invokeWorker("prepareMultisig"));

              case 1:
              case "end":
                return _context300.stop();
            }
          }
        }, _callee300, this);
      }));

      function prepareMultisig() {
        return _prepareMultisig2.apply(this, arguments);
      }

      return prepareMultisig;
    }()
  }, {
    key: "makeMultisig",
    value: function () {
      var _makeMultisig2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee301(multisigHexes, threshold, password) {
        var _args301 = arguments;
        return _regenerator["default"].wrap(function _callee301$(_context301) {
          while (1) {
            switch (_context301.prev = _context301.next) {
              case 0:
                _context301.next = 2;
                return this._invokeWorker("makeMultisig", Array.from(_args301));

              case 2:
                return _context301.abrupt("return", _context301.sent);

              case 3:
              case "end":
                return _context301.stop();
            }
          }
        }, _callee301, this);
      }));

      function makeMultisig(_x272, _x273, _x274) {
        return _makeMultisig2.apply(this, arguments);
      }

      return makeMultisig;
    }()
  }, {
    key: "exchangeMultisigKeys",
    value: function () {
      var _exchangeMultisigKeys2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee302(multisigHexes, password) {
        var _args302 = arguments;
        return _regenerator["default"].wrap(function _callee302$(_context302) {
          while (1) {
            switch (_context302.prev = _context302.next) {
              case 0:
                _context302.t0 = _MoneroMultisigInitResult["default"];
                _context302.next = 3;
                return this._invokeWorker("exchangeMultisigKeys", Array.from(_args302));

              case 3:
                _context302.t1 = _context302.sent;
                return _context302.abrupt("return", new _context302.t0(_context302.t1));

              case 5:
              case "end":
                return _context302.stop();
            }
          }
        }, _callee302, this);
      }));

      function exchangeMultisigKeys(_x275, _x276) {
        return _exchangeMultisigKeys2.apply(this, arguments);
      }

      return exchangeMultisigKeys;
    }()
  }, {
    key: "exportMultisigHex",
    value: function () {
      var _exportMultisigHex2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee303() {
        return _regenerator["default"].wrap(function _callee303$(_context303) {
          while (1) {
            switch (_context303.prev = _context303.next) {
              case 0:
                return _context303.abrupt("return", this._invokeWorker("exportMultisigHex"));

              case 1:
              case "end":
                return _context303.stop();
            }
          }
        }, _callee303, this);
      }));

      function exportMultisigHex() {
        return _exportMultisigHex2.apply(this, arguments);
      }

      return exportMultisigHex;
    }()
  }, {
    key: "importMultisigHex",
    value: function () {
      var _importMultisigHex2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee304(multisigHexes) {
        var _args304 = arguments;
        return _regenerator["default"].wrap(function _callee304$(_context304) {
          while (1) {
            switch (_context304.prev = _context304.next) {
              case 0:
                return _context304.abrupt("return", this._invokeWorker("importMultisigHex", Array.from(_args304)));

              case 1:
              case "end":
                return _context304.stop();
            }
          }
        }, _callee304, this);
      }));

      function importMultisigHex(_x277) {
        return _importMultisigHex2.apply(this, arguments);
      }

      return importMultisigHex;
    }()
  }, {
    key: "signMultisigTxHex",
    value: function () {
      var _signMultisigTxHex2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee305(multisigTxHex) {
        var _args305 = arguments;
        return _regenerator["default"].wrap(function _callee305$(_context305) {
          while (1) {
            switch (_context305.prev = _context305.next) {
              case 0:
                _context305.t0 = _MoneroMultisigSignResult["default"];
                _context305.next = 3;
                return this._invokeWorker("signMultisigTxHex", Array.from(_args305));

              case 3:
                _context305.t1 = _context305.sent;
                return _context305.abrupt("return", new _context305.t0(_context305.t1));

              case 5:
              case "end":
                return _context305.stop();
            }
          }
        }, _callee305, this);
      }));

      function signMultisigTxHex(_x278) {
        return _signMultisigTxHex2.apply(this, arguments);
      }

      return signMultisigTxHex;
    }()
  }, {
    key: "submitMultisigTxHex",
    value: function () {
      var _submitMultisigTxHex2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee306(signedMultisigTxHex) {
        var _args306 = arguments;
        return _regenerator["default"].wrap(function _callee306$(_context306) {
          while (1) {
            switch (_context306.prev = _context306.next) {
              case 0:
                return _context306.abrupt("return", this._invokeWorker("submitMultisigTxHex", Array.from(_args306)));

              case 1:
              case "end":
                return _context306.stop();
            }
          }
        }, _callee306, this);
      }));

      function submitMultisigTxHex(_x279) {
        return _submitMultisigTxHex2.apply(this, arguments);
      }

      return submitMultisigTxHex;
    }()
  }, {
    key: "getData",
    value: function () {
      var _getData2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee307() {
        return _regenerator["default"].wrap(function _callee307$(_context307) {
          while (1) {
            switch (_context307.prev = _context307.next) {
              case 0:
                return _context307.abrupt("return", this._invokeWorker("getData"));

              case 1:
              case "end":
                return _context307.stop();
            }
          }
        }, _callee307, this);
      }));

      function getData() {
        return _getData2.apply(this, arguments);
      }

      return getData;
    }()
  }, {
    key: "moveTo",
    value: function () {
      var _moveTo4 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee308(path) {
        return _regenerator["default"].wrap(function _callee308$(_context308) {
          while (1) {
            switch (_context308.prev = _context308.next) {
              case 0:
                return _context308.abrupt("return", MoneroWalletFull._moveTo(path, this));

              case 1:
              case "end":
                return _context308.stop();
            }
          }
        }, _callee308, this);
      }));

      function moveTo(_x280) {
        return _moveTo4.apply(this, arguments);
      }

      return moveTo;
    }()
  }, {
    key: "changePassword",
    value: function () {
      var _changePassword2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee309(oldPassword, newPassword) {
        var _args309 = arguments;
        return _regenerator["default"].wrap(function _callee309$(_context309) {
          while (1) {
            switch (_context309.prev = _context309.next) {
              case 0:
                _context309.next = 2;
                return this._invokeWorker("changePassword", Array.from(_args309));

              case 2:
                if (!this._path) {
                  _context309.next = 5;
                  break;
                }

                _context309.next = 5;
                return this.save();

              case 5:
              case "end":
                return _context309.stop();
            }
          }
        }, _callee309, this);
      }));

      function changePassword(_x281, _x282) {
        return _changePassword2.apply(this, arguments);
      }

      return changePassword;
    }()
  }, {
    key: "save",
    value: function () {
      var _save4 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee310() {
        return _regenerator["default"].wrap(function _callee310$(_context310) {
          while (1) {
            switch (_context310.prev = _context310.next) {
              case 0:
                return _context310.abrupt("return", MoneroWalletFull._save(this));

              case 1:
              case "end":
                return _context310.stop();
            }
          }
        }, _callee310, this);
      }));

      function save() {
        return _save4.apply(this, arguments);
      }

      return save;
    }()
  }, {
    key: "close",
    value: function () {
      var _close2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee311(save) {
        return _regenerator["default"].wrap(function _callee311$(_context311) {
          while (1) {
            switch (_context311.prev = _context311.next) {
              case 0:
                if (!save) {
                  _context311.next = 3;
                  break;
                }

                _context311.next = 3;
                return this.save();

              case 3:
                if (!this._wrappedListeners.length) {
                  _context311.next = 8;
                  break;
                }

                _context311.next = 6;
                return this.removeListener(this._wrappedListeners[0].getListener());

              case 6:
                _context311.next = 3;
                break;

              case 8:
                _context311.next = 10;
                return this._invokeWorker("close");

              case 10:
                delete _LibraryUtils["default"].WORKER_OBJECTS[this._walletId];

              case 11:
              case "end":
                return _context311.stop();
            }
          }
        }, _callee311, this);
      }));

      function close(_x283) {
        return _close2.apply(this, arguments);
      }

      return close;
    }()
  }, {
    key: "isClosed",
    value: function () {
      var _isClosed = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee312() {
        return _regenerator["default"].wrap(function _callee312$(_context312) {
          while (1) {
            switch (_context312.prev = _context312.next) {
              case 0:
                return _context312.abrupt("return", this._invokeWorker("isClosed"));

              case 1:
              case "end":
                return _context312.stop();
            }
          }
        }, _callee312, this);
      }));

      function isClosed() {
        return _isClosed.apply(this, arguments);
      }

      return isClosed;
    }() // --------------------------- PRIVATE HELPERS ------------------------------

  }, {
    key: "_invokeWorker",
    value: function () {
      var _invokeWorker2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee313(fnName, args) {
        return _regenerator["default"].wrap(function _callee313$(_context313) {
          while (1) {
            switch (_context313.prev = _context313.next) {
              case 0:
                return _context313.abrupt("return", _LibraryUtils["default"].invokeWorker(this._walletId, fnName, args));

              case 1:
              case "end":
                return _context313.stop();
            }
          }
        }, _callee313, this);
      }));

      function _invokeWorker(_x284, _x285) {
        return _invokeWorker2.apply(this, arguments);
      }

      return _invokeWorker;
    }()
  }], [{
    key: "openWalletData",
    value: // -------------------------- WALLET STATIC UTILS ---------------------------
    function () {
      var _openWalletData3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee314(path, password, networkType, keysData, cacheData, daemonUriOrConnection, fs) {
        var walletId, daemonUriOrConfig, wallet;
        return _regenerator["default"].wrap(function _callee314$(_context314) {
          while (1) {
            switch (_context314.prev = _context314.next) {
              case 0:
                walletId = _GenUtils["default"].getUUID();
                daemonUriOrConfig = daemonUriOrConnection instanceof _MoneroRpcConnection["default"] ? daemonUriOrConnection.getConfig() : daemonUriOrConnection;
                _context314.next = 4;
                return _LibraryUtils["default"].invokeWorker(walletId, "openWalletData", [path, password, networkType, keysData, cacheData, daemonUriOrConfig]);

              case 4:
                _context314.t0 = MoneroWalletFullProxy;
                _context314.t1 = walletId;
                _context314.next = 8;
                return _LibraryUtils["default"].getWorker();

              case 8:
                _context314.t2 = _context314.sent;
                _context314.t3 = path;
                _context314.t4 = fs;
                wallet = new _context314.t0(_context314.t1, _context314.t2, _context314.t3, _context314.t4);

                if (!path) {
                  _context314.next = 15;
                  break;
                }

                _context314.next = 15;
                return wallet.save();

              case 15:
                return _context314.abrupt("return", wallet);

              case 16:
              case "end":
                return _context314.stop();
            }
          }
        }, _callee314);
      }));

      function openWalletData(_x286, _x287, _x288, _x289, _x290, _x291, _x292) {
        return _openWalletData3.apply(this, arguments);
      }

      return openWalletData;
    }()
  }, {
    key: "_createWallet",
    value: function () {
      var _createWallet2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee315(config) {
        var walletId, wallet;
        return _regenerator["default"].wrap(function _callee315$(_context315) {
          while (1) {
            switch (_context315.prev = _context315.next) {
              case 0:
                if (!(config.getPath() && MoneroWalletFull.walletExists(config.getPath(), config.getFs()))) {
                  _context315.next = 2;
                  break;
                }

                throw new _MoneroError["default"]("Wallet already exists: " + path);

              case 2:
                walletId = _GenUtils["default"].getUUID();
                _context315.next = 5;
                return _LibraryUtils["default"].invokeWorker(walletId, "_createWallet", [config.toJson()]);

              case 5:
                _context315.t0 = MoneroWalletFullProxy;
                _context315.t1 = walletId;
                _context315.next = 9;
                return _LibraryUtils["default"].getWorker();

              case 9:
                _context315.t2 = _context315.sent;
                _context315.t3 = config.getPath();
                _context315.t4 = config.getFs();
                wallet = new _context315.t0(_context315.t1, _context315.t2, _context315.t3, _context315.t4);

                if (!config.getPath()) {
                  _context315.next = 16;
                  break;
                }

                _context315.next = 16;
                return wallet.save();

              case 16:
                return _context315.abrupt("return", wallet);

              case 17:
              case "end":
                return _context315.stop();
            }
          }
        }, _callee315);
      }));

      function _createWallet(_x293) {
        return _createWallet2.apply(this, arguments);
      }

      return _createWallet;
    }()
  }]);
  return MoneroWalletFullProxy;
}(_MoneroWallet2["default"]); // -------------------------------- LISTENING ---------------------------------

/**
 * Receives notifications directly from wasm c++.
 * 
 * @private
 */


var WalletFullListener = /*#__PURE__*/function () {
  function WalletFullListener(wallet) {
    (0, _classCallCheck2["default"])(this, WalletFullListener);
    this._wallet = wallet;
  }

  (0, _createClass2["default"])(WalletFullListener, [{
    key: "onSyncProgress",
    value: function () {
      var _onSyncProgress = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee316(height, startHeight, endHeight, percentDone, message) {
        var _iterator33, _step33, listener;

        return _regenerator["default"].wrap(function _callee316$(_context316) {
          while (1) {
            switch (_context316.prev = _context316.next) {
              case 0:
                _iterator33 = _createForOfIteratorHelper(this._wallet.getListeners());
                _context316.prev = 1;

                _iterator33.s();

              case 3:
                if ((_step33 = _iterator33.n()).done) {
                  _context316.next = 9;
                  break;
                }

                listener = _step33.value;
                _context316.next = 7;
                return listener.onSyncProgress(height, startHeight, endHeight, percentDone, message);

              case 7:
                _context316.next = 3;
                break;

              case 9:
                _context316.next = 14;
                break;

              case 11:
                _context316.prev = 11;
                _context316.t0 = _context316["catch"](1);

                _iterator33.e(_context316.t0);

              case 14:
                _context316.prev = 14;

                _iterator33.f();

                return _context316.finish(14);

              case 17:
              case "end":
                return _context316.stop();
            }
          }
        }, _callee316, this, [[1, 11, 14, 17]]);
      }));

      function onSyncProgress(_x294, _x295, _x296, _x297, _x298) {
        return _onSyncProgress.apply(this, arguments);
      }

      return onSyncProgress;
    }()
  }, {
    key: "onNewBlock",
    value: function () {
      var _onNewBlock = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee317(height) {
        var _iterator34, _step34, listener;

        return _regenerator["default"].wrap(function _callee317$(_context317) {
          while (1) {
            switch (_context317.prev = _context317.next) {
              case 0:
                _iterator34 = _createForOfIteratorHelper(this._wallet.getListeners());
                _context317.prev = 1;

                _iterator34.s();

              case 3:
                if ((_step34 = _iterator34.n()).done) {
                  _context317.next = 9;
                  break;
                }

                listener = _step34.value;
                _context317.next = 7;
                return listener.onNewBlock(height);

              case 7:
                _context317.next = 3;
                break;

              case 9:
                _context317.next = 14;
                break;

              case 11:
                _context317.prev = 11;
                _context317.t0 = _context317["catch"](1);

                _iterator34.e(_context317.t0);

              case 14:
                _context317.prev = 14;

                _iterator34.f();

                return _context317.finish(14);

              case 17:
              case "end":
                return _context317.stop();
            }
          }
        }, _callee317, this, [[1, 11, 14, 17]]);
      }));

      function onNewBlock(_x299) {
        return _onNewBlock.apply(this, arguments);
      }

      return onNewBlock;
    }()
  }, {
    key: "onBalancesChanged",
    value: function () {
      var _onBalancesChanged = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee318(newBalanceStr, newUnlockedBalanceStr) {
        var _iterator35, _step35, listener;

        return _regenerator["default"].wrap(function _callee318$(_context318) {
          while (1) {
            switch (_context318.prev = _context318.next) {
              case 0:
                _iterator35 = _createForOfIteratorHelper(this._wallet.getListeners());
                _context318.prev = 1;

                _iterator35.s();

              case 3:
                if ((_step35 = _iterator35.n()).done) {
                  _context318.next = 9;
                  break;
                }

                listener = _step35.value;
                _context318.next = 7;
                return listener.onBalancesChanged(BigInt(newBalanceStr), BigInt(newUnlockedBalanceStr));

              case 7:
                _context318.next = 3;
                break;

              case 9:
                _context318.next = 14;
                break;

              case 11:
                _context318.prev = 11;
                _context318.t0 = _context318["catch"](1);

                _iterator35.e(_context318.t0);

              case 14:
                _context318.prev = 14;

                _iterator35.f();

                return _context318.finish(14);

              case 17:
              case "end":
                return _context318.stop();
            }
          }
        }, _callee318, this, [[1, 11, 14, 17]]);
      }));

      function onBalancesChanged(_x300, _x301) {
        return _onBalancesChanged.apply(this, arguments);
      }

      return onBalancesChanged;
    }()
  }, {
    key: "onOutputReceived",
    value: function () {
      var _onOutputReceived = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee319(height, txHash, amountStr, accountIdx, subaddressIdx, version, unlockHeight, isLocked) {
        var output, tx, block, _iterator36, _step36, listener;

        return _regenerator["default"].wrap(function _callee319$(_context319) {
          while (1) {
            switch (_context319.prev = _context319.next) {
              case 0:
                // build received output
                output = new _MoneroOutputWallet["default"]();
                output.setAmount(BigInt(amountStr));
                output.setAccountIndex(accountIdx);
                output.setSubaddressIndex(subaddressIdx);
                tx = new _MoneroTxWallet["default"]();
                tx.setHash(txHash);
                tx.setVersion(version);
                tx.setUnlockHeight(unlockHeight);
                output.setTx(tx);
                tx.setOutputs([output]);
                tx.setIsIncoming(true);
                tx.setIsLocked(isLocked);

                if (height > 0) {
                  block = new _MoneroBlock["default"]().setHeight(height);
                  block.setTxs([tx]);
                  tx.setBlock(block);
                  tx.setIsConfirmed(true);
                  tx.setInTxPool(false);
                  tx.setIsFailed(false);
                } else {
                  tx.setIsConfirmed(false);
                  tx.setInTxPool(true);
                } // announce output


                _iterator36 = _createForOfIteratorHelper(this._wallet.getListeners());
                _context319.prev = 14;

                _iterator36.s();

              case 16:
                if ((_step36 = _iterator36.n()).done) {
                  _context319.next = 22;
                  break;
                }

                listener = _step36.value;
                _context319.next = 20;
                return listener.onOutputReceived(tx.getOutputs()[0]);

              case 20:
                _context319.next = 16;
                break;

              case 22:
                _context319.next = 27;
                break;

              case 24:
                _context319.prev = 24;
                _context319.t0 = _context319["catch"](14);

                _iterator36.e(_context319.t0);

              case 27:
                _context319.prev = 27;

                _iterator36.f();

                return _context319.finish(27);

              case 30:
              case "end":
                return _context319.stop();
            }
          }
        }, _callee319, this, [[14, 24, 27, 30]]);
      }));

      function onOutputReceived(_x302, _x303, _x304, _x305, _x306, _x307, _x308, _x309) {
        return _onOutputReceived.apply(this, arguments);
      }

      return onOutputReceived;
    }()
  }, {
    key: "onOutputSpent",
    value: function () {
      var _onOutputSpent = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee320(height, txHash, amountStr, accountIdxStr, subaddressIdxStr, version, unlockHeight, isLocked) {
        var output, tx, block, _iterator37, _step37, listener;

        return _regenerator["default"].wrap(function _callee320$(_context320) {
          while (1) {
            switch (_context320.prev = _context320.next) {
              case 0:
                // build spent output
                output = new _MoneroOutputWallet["default"]();
                output.setAmount(BigInt(amountStr));
                if (accountIdxStr) output.setAccountIndex(parseInt(accountIdxStr));
                if (subaddressIdxStr) output.setSubaddressIndex(parseInt(subaddressIdxStr));
                tx = new _MoneroTxWallet["default"]();
                tx.setHash(txHash);
                tx.setVersion(version);
                tx.setUnlockHeight(unlockHeight);
                tx.setIsLocked(isLocked);
                output.setTx(tx);
                tx.setInputs([output]);

                if (height > 0) {
                  block = new _MoneroBlock["default"]().setHeight(height);
                  block.setTxs([tx]);
                  tx.setBlock(block);
                  tx.setIsConfirmed(true);
                  tx.setInTxPool(false);
                  tx.setIsFailed(false);
                } else {
                  tx.setIsConfirmed(false);
                  tx.setInTxPool(true);
                } // notify wallet listeners


                _iterator37 = _createForOfIteratorHelper(this._wallet.getListeners());
                _context320.prev = 13;

                _iterator37.s();

              case 15:
                if ((_step37 = _iterator37.n()).done) {
                  _context320.next = 21;
                  break;
                }

                listener = _step37.value;
                _context320.next = 19;
                return listener.onOutputSpent(tx.getInputs()[0]);

              case 19:
                _context320.next = 15;
                break;

              case 21:
                _context320.next = 26;
                break;

              case 23:
                _context320.prev = 23;
                _context320.t0 = _context320["catch"](13);

                _iterator37.e(_context320.t0);

              case 26:
                _context320.prev = 26;

                _iterator37.f();

                return _context320.finish(26);

              case 29:
              case "end":
                return _context320.stop();
            }
          }
        }, _callee320, this, [[13, 23, 26, 29]]);
      }));

      function onOutputSpent(_x310, _x311, _x312, _x313, _x314, _x315, _x316, _x317) {
        return _onOutputSpent.apply(this, arguments);
      }

      return onOutputSpent;
    }()
  }]);
  return WalletFullListener;
}();
/**
 * Internal listener to bridge notifications to external listeners.
 * 
 * @private
 */


var WalletWorkerListener = /*#__PURE__*/function () {
  function WalletWorkerListener(listener) {
    (0, _classCallCheck2["default"])(this, WalletWorkerListener);
    this._id = _GenUtils["default"].getUUID();
    this._listener = listener;
  }

  (0, _createClass2["default"])(WalletWorkerListener, [{
    key: "getId",
    value: function getId() {
      return this._id;
    }
  }, {
    key: "getListener",
    value: function getListener() {
      return this._listener;
    }
  }, {
    key: "onSyncProgress",
    value: function onSyncProgress(height, startHeight, endHeight, percentDone, message) {
      this._listener.onSyncProgress(height, startHeight, endHeight, percentDone, message);
    }
  }, {
    key: "onNewBlock",
    value: function () {
      var _onNewBlock2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee321(height) {
        return _regenerator["default"].wrap(function _callee321$(_context321) {
          while (1) {
            switch (_context321.prev = _context321.next) {
              case 0:
                _context321.next = 2;
                return this._listener.onNewBlock(height);

              case 2:
              case "end":
                return _context321.stop();
            }
          }
        }, _callee321, this);
      }));

      function onNewBlock(_x318) {
        return _onNewBlock2.apply(this, arguments);
      }

      return onNewBlock;
    }()
  }, {
    key: "onBalancesChanged",
    value: function () {
      var _onBalancesChanged2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee322(newBalanceStr, newUnlockedBalanceStr) {
        return _regenerator["default"].wrap(function _callee322$(_context322) {
          while (1) {
            switch (_context322.prev = _context322.next) {
              case 0:
                _context322.next = 2;
                return this._listener.onBalancesChanged(BigInt(newBalanceStr), BigInt(newUnlockedBalanceStr));

              case 2:
              case "end":
                return _context322.stop();
            }
          }
        }, _callee322, this);
      }));

      function onBalancesChanged(_x319, _x320) {
        return _onBalancesChanged2.apply(this, arguments);
      }

      return onBalancesChanged;
    }()
  }, {
    key: "onOutputReceived",
    value: function () {
      var _onOutputReceived2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee323(blockJson) {
        var block;
        return _regenerator["default"].wrap(function _callee323$(_context323) {
          while (1) {
            switch (_context323.prev = _context323.next) {
              case 0:
                block = new _MoneroBlock["default"](blockJson, _MoneroBlock["default"].DeserializationType.TX_WALLET);
                _context323.next = 3;
                return this._listener.onOutputReceived(block.getTxs()[0].getOutputs()[0]);

              case 3:
              case "end":
                return _context323.stop();
            }
          }
        }, _callee323, this);
      }));

      function onOutputReceived(_x321) {
        return _onOutputReceived2.apply(this, arguments);
      }

      return onOutputReceived;
    }()
  }, {
    key: "onOutputSpent",
    value: function () {
      var _onOutputSpent2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee324(blockJson) {
        var block;
        return _regenerator["default"].wrap(function _callee324$(_context324) {
          while (1) {
            switch (_context324.prev = _context324.next) {
              case 0:
                block = new _MoneroBlock["default"](blockJson, _MoneroBlock["default"].DeserializationType.TX_WALLET);
                _context324.next = 3;
                return this._listener.onOutputSpent(block.getTxs()[0].getInputs()[0]);

              case 3:
              case "end":
                return _context324.stop();
            }
          }
        }, _callee324, this);
      }));

      function onOutputSpent(_x322) {
        return _onOutputSpent2.apply(this, arguments);
      }

      return onOutputSpent;
    }()
  }]);
  return WalletWorkerListener;
}();

MoneroWalletFull.DEFAULT_SYNC_PERIOD_IN_MS = 10000; // 10 second sync period by default

var _default = MoneroWalletFull;
exports["default"] = _default;