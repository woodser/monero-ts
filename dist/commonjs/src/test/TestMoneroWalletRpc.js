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

var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _assert = _interopRequireDefault(require("assert"));

var _TestUtils = _interopRequireDefault(require("./utils/TestUtils"));

var _TestMoneroWalletCommon = _interopRequireDefault(require("./TestMoneroWalletCommon"));

var _TestMoneroWalletFull = _interopRequireDefault(require("./TestMoneroWalletFull"));

var _index = require("../../index");

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * Tests the Monero Wallet RPC client and server.
 */
var TestMoneroWalletRpc = /*#__PURE__*/function (_TestMoneroWalletComm) {
  (0, _inherits2["default"])(TestMoneroWalletRpc, _TestMoneroWalletComm);

  var _super = _createSuper(TestMoneroWalletRpc);

  function TestMoneroWalletRpc(testConfig) {
    (0, _classCallCheck2["default"])(this, TestMoneroWalletRpc);
    return _super.call(this, testConfig);
  }

  (0, _createClass2["default"])(TestMoneroWalletRpc, [{
    key: "beforeAll",
    value: function () {
      var _beforeAll = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
        var walletFull;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return (0, _get2["default"])((0, _getPrototypeOf2["default"])(TestMoneroWalletRpc.prototype), "beforeAll", this).call(this);

              case 2:
                if (!_TestMoneroWalletFull["default"].FULL_TESTS_RUN) {
                  _context.next = 10;
                  break;
                }

                _context.next = 5;
                return _TestUtils["default"].getWalletFull();

              case 5:
                walletFull = _context.sent;
                _context.next = 8;
                return _TestUtils["default"].WALLET_TX_TRACKER.waitForWalletTxsToClearPool(walletFull);

              case 8:
                _context.next = 10;
                return walletFull.close(true);

              case 10:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function beforeAll() {
        return _beforeAll.apply(this, arguments);
      }

      return beforeAll;
    }()
  }, {
    key: "beforeEach",
    value: function () {
      var _beforeEach = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(currentTest) {
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return (0, _get2["default"])((0, _getPrototypeOf2["default"])(TestMoneroWalletRpc.prototype), "beforeEach", this).call(this, currentTest);

              case 2:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function beforeEach(_x) {
        return _beforeEach.apply(this, arguments);
      }

      return beforeEach;
    }()
  }, {
    key: "afterAll",
    value: function () {
      var _afterAll = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3() {
        var _i, _Object$keys, portOffset;

        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return (0, _get2["default"])((0, _getPrototypeOf2["default"])(TestMoneroWalletRpc.prototype), "afterAll", this).call(this);

              case 2:
                _i = 0, _Object$keys = Object.keys(_TestUtils["default"].WALLET_PORT_OFFSETS);

              case 3:
                if (!(_i < _Object$keys.length)) {
                  _context3.next = 11;
                  break;
                }

                portOffset = _Object$keys[_i];
                // TODO: this breaks encapsulation, use MoneroWalletRpcManager
                console.error("WARNING: Wallet RPC process on port " + (_TestUtils["default"].WALLET_RPC_PORT_START + Number(portOffset)) + " was not stopped after all tests, stopping");
                _context3.next = 8;
                return _TestUtils["default"].stopWalletRpcProcess(_TestUtils["default"].WALLET_PORT_OFFSETS[portOffset]);

              case 8:
                _i++;
                _context3.next = 3;
                break;

              case 11:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function afterAll() {
        return _afterAll.apply(this, arguments);
      }

      return afterAll;
    }()
  }, {
    key: "afterEach",
    value: function () {
      var _afterEach = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(currentTest) {
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return (0, _get2["default"])((0, _getPrototypeOf2["default"])(TestMoneroWalletRpc.prototype), "afterEach", this).call(this, currentTest);

              case 2:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function afterEach(_x2) {
        return _afterEach.apply(this, arguments);
      }

      return afterEach;
    }()
  }, {
    key: "getTestWallet",
    value: function () {
      var _getTestWallet = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5() {
        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                return _context5.abrupt("return", _TestUtils["default"].getWalletRpc());

              case 1:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5);
      }));

      function getTestWallet() {
        return _getTestWallet.apply(this, arguments);
      }

      return getTestWallet;
    }()
  }, {
    key: "getTestDaemon",
    value: function () {
      var _getTestDaemon = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6() {
        return _regenerator["default"].wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                return _context6.abrupt("return", _TestUtils["default"].getDaemonRpc());

              case 1:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6);
      }));

      function getTestDaemon() {
        return _getTestDaemon.apply(this, arguments);
      }

      return getTestDaemon;
    }()
  }, {
    key: "openWallet",
    value: function () {
      var _openWallet = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7(config) {
        var offline, wallet;
        return _regenerator["default"].wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                // assign defaults
                config = new _index.MoneroWalletConfig(config);
                if (!config.getPassword()) config.setPassword(_TestUtils["default"].WALLET_PASSWORD);

                if (config.getServer()) {
                  _context7.next = 8;
                  break;
                }

                _context7.t0 = config;
                _context7.next = 6;
                return this.daemon.getRpcConnection();

              case 6:
                _context7.t1 = _context7.sent;

                _context7.t0.setServer.call(_context7.t0, _context7.t1);

              case 8:
                // create client connected to internal monero-wallet-rpc executable
                offline = _TestUtils["default"].OFFLINE_SERVER_URI === config.getServerUri();
                _context7.next = 11;
                return _TestUtils["default"].startWalletRpcProcess(offline);

              case 11:
                wallet = _context7.sent;
                _context7.prev = 12;
                _context7.next = 15;
                return wallet.openWallet(config);

              case 15:
                _context7.next = 17;
                return wallet.setDaemonConnection(config.getServer(), true, undefined);

              case 17:
                _context7.next = 19;
                return wallet.isConnectedToDaemon();

              case 19:
                if (!_context7.sent) {
                  _context7.next = 22;
                  break;
                }

                _context7.next = 22;
                return wallet.startSyncing(_TestUtils["default"].SYNC_PERIOD_IN_MS);

              case 22:
                return _context7.abrupt("return", wallet);

              case 25:
                _context7.prev = 25;
                _context7.t2 = _context7["catch"](12);
                _context7.next = 29;
                return _TestUtils["default"].stopWalletRpcProcess(wallet);

              case 29:
                throw _context7.t2;

              case 30:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this, [[12, 25]]);
      }));

      function openWallet(_x3) {
        return _openWallet.apply(this, arguments);
      }

      return openWallet;
    }()
  }, {
    key: "createWallet",
    value: function () {
      var _createWallet = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee8(config) {
        var random, offline, wallet;
        return _regenerator["default"].wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                // assign defaults
                config = new _index.MoneroWalletConfig(config);
                random = !config.getMnemonic() && !config.getPrimaryAddress();
                if (!config.getPath()) config.setPath(_index.GenUtils.getUUID());
                if (!config.getPassword()) config.setPassword(_TestUtils["default"].WALLET_PASSWORD);
                if (!config.getRestoreHeight() && !random) config.setRestoreHeight(0);

                if (config.getServer()) {
                  _context8.next = 11;
                  break;
                }

                _context8.t0 = config;
                _context8.next = 9;
                return this.daemon.getRpcConnection();

              case 9:
                _context8.t1 = _context8.sent;

                _context8.t0.setServer.call(_context8.t0, _context8.t1);

              case 11:
                // create client connected to internal monero-wallet-rpc executable
                offline = _TestUtils["default"].OFFLINE_SERVER_URI === config.getServerUri();
                _context8.next = 14;
                return _TestUtils["default"].startWalletRpcProcess(offline);

              case 14:
                wallet = _context8.sent;
                _context8.prev = 15;
                _context8.next = 18;
                return wallet.createWallet(config);

              case 18:
                _context8.next = 20;
                return wallet.setDaemonConnection(config.getServer(), true, undefined);

              case 20:
                _context8.next = 22;
                return wallet.isConnectedToDaemon();

              case 22:
                if (!_context8.sent) {
                  _context8.next = 25;
                  break;
                }

                _context8.next = 25;
                return wallet.startSyncing(_TestUtils["default"].SYNC_PERIOD_IN_MS);

              case 25:
                return _context8.abrupt("return", wallet);

              case 28:
                _context8.prev = 28;
                _context8.t2 = _context8["catch"](15);
                _context8.next = 32;
                return _TestUtils["default"].stopWalletRpcProcess(wallet);

              case 32:
                throw _context8.t2;

              case 33:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8, this, [[15, 28]]);
      }));

      function createWallet(_x4) {
        return _createWallet.apply(this, arguments);
      }

      return createWallet;
    }()
  }, {
    key: "closeWallet",
    value: function () {
      var _closeWallet = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee9(wallet, save) {
        return _regenerator["default"].wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                _context9.next = 2;
                return wallet.close(save);

              case 2:
                _context9.next = 4;
                return _TestUtils["default"].stopWalletRpcProcess(wallet);

              case 4:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee9);
      }));

      function closeWallet(_x5, _x6) {
        return _closeWallet.apply(this, arguments);
      }

      return closeWallet;
    }()
  }, {
    key: "getMnemonicLanguages",
    value: function () {
      var _getMnemonicLanguages = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee10() {
        return _regenerator["default"].wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                _context10.next = 2;
                return this.wallet.getMnemonicLanguages();

              case 2:
                return _context10.abrupt("return", _context10.sent);

              case 3:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function getMnemonicLanguages() {
        return _getMnemonicLanguages.apply(this, arguments);
      }

      return getMnemonicLanguages;
    }()
  }, {
    key: "runTests",
    value: function runTests() {
      var that = this;
      var testConfig = this.testConfig;
      describe("TEST MONERO WALLET RPC", function () {
        // register handlers to run before and after tests
        before( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee11() {
          return _regenerator["default"].wrap(function _callee11$(_context11) {
            while (1) {
              switch (_context11.prev = _context11.next) {
                case 0:
                  _context11.next = 2;
                  return that.beforeAll();

                case 2:
                case "end":
                  return _context11.stop();
              }
            }
          }, _callee11);
        })));
        beforeEach( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee12() {
          return _regenerator["default"].wrap(function _callee12$(_context12) {
            while (1) {
              switch (_context12.prev = _context12.next) {
                case 0:
                  _context12.next = 2;
                  return that.beforeEach(this.currentTest);

                case 2:
                case "end":
                  return _context12.stop();
              }
            }
          }, _callee12, this);
        })));
        after( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee13() {
          return _regenerator["default"].wrap(function _callee13$(_context13) {
            while (1) {
              switch (_context13.prev = _context13.next) {
                case 0:
                  _context13.next = 2;
                  return that.afterAll();

                case 2:
                case "end":
                  return _context13.stop();
              }
            }
          }, _callee13);
        })));
        afterEach( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee14() {
          return _regenerator["default"].wrap(function _callee14$(_context14) {
            while (1) {
              switch (_context14.prev = _context14.next) {
                case 0:
                  _context14.next = 2;
                  return that.afterEach(this.currentTest);

                case 2:
                case "end":
                  return _context14.stop();
              }
            }
          }, _callee14, this);
        }))); // run tests specific to wallet rpc

        that._testWalletRpc(testConfig); // run common tests


        that.runCommonTests(testConfig);
      });
    } // ---------------------------------- PRIVATE -------------------------------
    // rpc-specific tx test

  }, {
    key: "_testTxWallet",
    value: function () {
      var _testTxWallet2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee15(tx, ctx) {
        return _regenerator["default"].wrap(function _callee15$(_context15) {
          while (1) {
            switch (_context15.prev = _context15.next) {
              case 0:
                ctx = Object.assign({}, ctx); // run common tests

                _context15.next = 3;
                return (0, _get2["default"])((0, _getPrototypeOf2["default"])(TestMoneroWalletRpc.prototype), "_testTxWallet", this).call(this, tx, ctx);

              case 3:
              case "end":
                return _context15.stop();
            }
          }
        }, _callee15, this);
      }));

      function _testTxWallet(_x7, _x8) {
        return _testTxWallet2.apply(this, arguments);
      }

      return _testTxWallet;
    }() // rpc-specific out-of-range subaddress test

  }, {
    key: "_testGetSubaddressAddressOutOfRange",
    value: function () {
      var _testGetSubaddressAddressOutOfRange2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee16() {
        var accounts, accountIdx, subaddressIdx, address;
        return _regenerator["default"].wrap(function _callee16$(_context16) {
          while (1) {
            switch (_context16.prev = _context16.next) {
              case 0:
                _context16.next = 2;
                return this.wallet.getAccounts(true);

              case 2:
                accounts = _context16.sent;
                accountIdx = accounts.length - 1;
                subaddressIdx = accounts[accountIdx].getSubaddresses().length;
                _context16.next = 7;
                return this.wallet.getAddress(accountIdx, subaddressIdx);

              case 7:
                address = _context16.sent;

                _assert["default"].equal(address, undefined);

              case 9:
              case "end":
                return _context16.stop();
            }
          }
        }, _callee16, this);
      }));

      function _testGetSubaddressAddressOutOfRange() {
        return _testGetSubaddressAddressOutOfRange2.apply(this, arguments);
      }

      return _testGetSubaddressAddressOutOfRange;
    }()
  }, {
    key: "_testInvalidAddressError",
    value: function _testInvalidAddressError(err) {
      (0, _get2["default"])((0, _getPrototypeOf2["default"])(TestMoneroWalletRpc.prototype), "_testInvalidAddressError", this).call(this, err);

      _assert["default"].equal(-2, err.getCode());
    }
  }, {
    key: "_testInvalidTxHashError",
    value: function _testInvalidTxHashError(err) {
      (0, _get2["default"])((0, _getPrototypeOf2["default"])(TestMoneroWalletRpc.prototype), "_testInvalidTxHashError", this).call(this, err);

      _assert["default"].equal(-8, err.getCode());
    }
  }, {
    key: "_testInvalidTxKeyError",
    value: function _testInvalidTxKeyError(err) {
      (0, _get2["default"])((0, _getPrototypeOf2["default"])(TestMoneroWalletRpc.prototype), "_testInvalidTxKeyError", this).call(this, err);

      _assert["default"].equal(-25, err.getCode());
    }
  }, {
    key: "_testInvalidSignatureError",
    value: function _testInvalidSignatureError(err) {
      (0, _get2["default"])((0, _getPrototypeOf2["default"])(TestMoneroWalletRpc.prototype), "_testInvalidSignatureError", this).call(this, err);

      _assert["default"].equal(-1, err.getCode());
    }
  }, {
    key: "_testNoSubaddressError",
    value: function _testNoSubaddressError(err) {
      (0, _get2["default"])((0, _getPrototypeOf2["default"])(TestMoneroWalletRpc.prototype), "_testNoSubaddressError", this).call(this, err);

      _assert["default"].equal(-1, err.getCode());
    }
  }, {
    key: "_testSignatureHeaderCheckError",
    value: function _testSignatureHeaderCheckError(err) {
      (0, _get2["default"])((0, _getPrototypeOf2["default"])(TestMoneroWalletRpc.prototype), "_testSignatureHeaderCheckError", this).call(this, err);

      _assert["default"].equal(-1, err.getCode());
    }
  }, {
    key: "_testWalletRpc",
    value: function _testWalletRpc(testConfig) {
      var that = this;
      describe("Tests specific to RPC wallet", function () {
        // ---------------------------- BEGIN TESTS ---------------------------------
        if (testConfig.testNonRelays) it("Can create a wallet with a randomly generated mnemonic", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee17() {
          var path, wallet, mnemonic;
          return _regenerator["default"].wrap(function _callee17$(_context17) {
            while (1) {
              switch (_context17.prev = _context17.next) {
                case 0:
                  // create random wallet with defaults
                  path = _index.GenUtils.getUUID();
                  _context17.next = 3;
                  return that.createWallet({
                    path: path
                  });

                case 3:
                  wallet = _context17.sent;
                  _context17.next = 6;
                  return wallet.getMnemonic();

                case 6:
                  mnemonic = _context17.sent;
                  _context17.next = 9;
                  return _index.MoneroUtils.validateMnemonic(mnemonic);

                case 9:
                  _assert["default"].notEqual(mnemonic, _TestUtils["default"].MNEMONIC);

                  _context17.t0 = _index.MoneroUtils;
                  _context17.next = 13;
                  return wallet.getPrimaryAddress();

                case 13:
                  _context17.t1 = _context17.sent;
                  _context17.t2 = _TestUtils["default"].NETWORK_TYPE;
                  _context17.next = 17;
                  return _context17.t0.validateAddress.call(_context17.t0, _context17.t1, _context17.t2);

                case 17:
                  _context17.next = 19;
                  return wallet.sync();

                case 19:
                  _context17.next = 21;
                  return that.closeWallet(wallet);

                case 21:
                  // create random wallet with non defaults
                  path = _index.GenUtils.getUUID();
                  _context17.next = 24;
                  return that.createWallet({
                    path: path,
                    language: "Spanish"
                  });

                case 24:
                  wallet = _context17.sent;
                  _context17.t3 = _index.MoneroUtils;
                  _context17.next = 28;
                  return wallet.getMnemonic();

                case 28:
                  _context17.t4 = _context17.sent;
                  _context17.next = 31;
                  return _context17.t3.validateMnemonic.call(_context17.t3, _context17.t4);

                case 31:
                  _context17.t5 = _assert["default"];
                  _context17.next = 34;
                  return wallet.getMnemonic();

                case 34:
                  _context17.t6 = _context17.sent;
                  _context17.t7 = mnemonic;

                  _context17.t5.notEqual.call(_context17.t5, _context17.t6, _context17.t7);

                  _context17.next = 39;
                  return wallet.getMnemonic();

                case 39:
                  mnemonic = _context17.sent;
                  _context17.t8 = _index.MoneroUtils;
                  _context17.next = 43;
                  return wallet.getPrimaryAddress();

                case 43:
                  _context17.t9 = _context17.sent;
                  _context17.t10 = _TestUtils["default"].NETWORK_TYPE;
                  _context17.next = 47;
                  return _context17.t8.validateAddress.call(_context17.t8, _context17.t9, _context17.t10);

                case 47:
                  _context17.prev = 47;
                  _context17.next = 50;
                  return that.createWallet({
                    path: path,
                    language: "Spanish"
                  });

                case 50:
                  _context17.next = 62;
                  break;

                case 52:
                  _context17.prev = 52;
                  _context17.t11 = _context17["catch"](47);

                  _assert["default"].equal(_context17.t11.message, "Wallet already exists: " + path);

                  _assert["default"].equal(-21, _context17.t11.getCode());

                  _context17.t12 = _assert["default"];
                  _context17.t13 = mnemonic;
                  _context17.next = 60;
                  return wallet.getMnemonic();

                case 60:
                  _context17.t14 = _context17.sent;

                  _context17.t12.equal.call(_context17.t12, _context17.t13, _context17.t14);

                case 62:
                  _context17.next = 64;
                  return that.closeWallet(wallet);

                case 64:
                case "end":
                  return _context17.stop();
              }
            }
          }, _callee17, null, [[47, 52]]);
        })));
        if (testConfig.testNonRelays) it("Can create a RPC wallet from a mnemonic phrase", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee18() {
          var path, wallet, txs;
          return _regenerator["default"].wrap(function _callee18$(_context18) {
            while (1) {
              switch (_context18.prev = _context18.next) {
                case 0:
                  // create wallet with mnemonic and defaults
                  path = _index.GenUtils.getUUID();
                  _context18.next = 3;
                  return that.createWallet({
                    path: path,
                    password: _TestUtils["default"].WALLET_PASSWORD,
                    mnemonic: _TestUtils["default"].MNEMONIC,
                    restoreHeight: _TestUtils["default"].FIRST_RECEIVE_HEIGHT
                  });

                case 3:
                  wallet = _context18.sent;
                  _context18.t0 = _assert["default"];
                  _context18.next = 7;
                  return wallet.getMnemonic();

                case 7:
                  _context18.t1 = _context18.sent;
                  _context18.t2 = _TestUtils["default"].MNEMONIC;

                  _context18.t0.equal.call(_context18.t0, _context18.t1, _context18.t2);

                  _context18.t3 = _assert["default"];
                  _context18.next = 13;
                  return wallet.getPrimaryAddress();

                case 13:
                  _context18.t4 = _context18.sent;
                  _context18.t5 = _TestUtils["default"].ADDRESS;

                  _context18.t3.equal.call(_context18.t3, _context18.t4, _context18.t5);

                  _context18.next = 18;
                  return wallet.sync();

                case 18:
                  _context18.t6 = _assert["default"];
                  _context18.next = 21;
                  return wallet.getHeight();

                case 21:
                  _context18.t7 = _context18.sent;
                  _context18.next = 24;
                  return that.daemon.getHeight();

                case 24:
                  _context18.t8 = _context18.sent;

                  _context18.t6.equal.call(_context18.t6, _context18.t7, _context18.t8);

                  _context18.next = 28;
                  return wallet.getTxs();

                case 28:
                  txs = _context18.sent;
                  (0, _assert["default"])(txs.length > 0); // wallet is used

                  _assert["default"].equal(txs[0].getHeight(), _TestUtils["default"].FIRST_RECEIVE_HEIGHT);

                  _context18.next = 33;
                  return that.closeWallet(wallet);

                case 33:
                  // create wallet with non-defaults
                  path = _index.GenUtils.getUUID();
                  _context18.next = 36;
                  return that.createWallet({
                    path: path,
                    password: _TestUtils["default"].WALLET_PASSWORD,
                    mnemonic: _TestUtils["default"].MNEMONIC,
                    restoreHeight: _TestUtils["default"].FIRST_RECEIVE_HEIGHT,
                    language: "German",
                    seedOffset: "my offset!",
                    saveCurrent: false
                  });

                case 36:
                  wallet = _context18.sent;
                  _context18.t9 = _index.MoneroUtils;
                  _context18.next = 40;
                  return wallet.getMnemonic();

                case 40:
                  _context18.t10 = _context18.sent;
                  _context18.next = 43;
                  return _context18.t9.validateMnemonic.call(_context18.t9, _context18.t10);

                case 43:
                  _context18.t11 = _assert["default"];
                  _context18.next = 46;
                  return wallet.getMnemonic();

                case 46:
                  _context18.t12 = _context18.sent;
                  _context18.t13 = _TestUtils["default"].MNEMONIC;

                  _context18.t11.notEqual.call(_context18.t11, _context18.t12, _context18.t13);

                  _context18.t14 = _assert["default"];
                  _context18.next = 52;
                  return wallet.getPrimaryAddress();

                case 52:
                  _context18.t15 = _context18.sent;
                  _context18.t16 = _TestUtils["default"].ADDRESS;

                  _context18.t14.notEqual.call(_context18.t14, _context18.t15, _context18.t16);

                  _context18.next = 57;
                  return that.closeWallet(wallet);

                case 57:
                case "end":
                  return _context18.stop();
              }
            }
          }, _callee18);
        })));
        if (testConfig.testNonRelays) it("Can open wallets", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee19() {
          var numTestWallets, names, i, mnemonics, _i2, _names, name, wallet, wallets, _i3, _wallet, _i4, _wallets, _wallet2;

          return _regenerator["default"].wrap(function _callee19$(_context19) {
            while (1) {
              switch (_context19.prev = _context19.next) {
                case 0:
                  // create names of test wallets
                  numTestWallets = 3;
                  names = [];

                  for (i = 0; i < numTestWallets; i++) {
                    names.push(_index.GenUtils.getUUID());
                  } // create test wallets


                  mnemonics = [];
                  _i2 = 0, _names = names;

                case 5:
                  if (!(_i2 < _names.length)) {
                    _context19.next = 20;
                    break;
                  }

                  name = _names[_i2];
                  _context19.next = 9;
                  return that.createWallet({
                    path: name,
                    password: _TestUtils["default"].WALLET_PASSWORD
                  });

                case 9:
                  wallet = _context19.sent;
                  _context19.t0 = mnemonics;
                  _context19.next = 13;
                  return wallet.getMnemonic();

                case 13:
                  _context19.t1 = _context19.sent;

                  _context19.t0.push.call(_context19.t0, _context19.t1);

                  _context19.next = 17;
                  return that.closeWallet(wallet, true);

                case 17:
                  _i2++;
                  _context19.next = 5;
                  break;

                case 20:
                  // open test wallets
                  wallets = [];
                  _i3 = 0;

                case 22:
                  if (!(_i3 < numTestWallets)) {
                    _context19.next = 36;
                    break;
                  }

                  _context19.next = 25;
                  return that.openWallet({
                    path: names[_i3],
                    password: _TestUtils["default"].WALLET_PASSWORD
                  });

                case 25:
                  _wallet = _context19.sent;
                  _context19.t2 = _assert["default"];
                  _context19.next = 29;
                  return _wallet.getMnemonic();

                case 29:
                  _context19.t3 = _context19.sent;
                  _context19.t4 = mnemonics[_i3];

                  _context19.t2.equal.call(_context19.t2, _context19.t3, _context19.t4);

                  wallets.push(_wallet);

                case 33:
                  _i3++;
                  _context19.next = 22;
                  break;

                case 36:
                  _context19.prev = 36;
                  _context19.next = 39;
                  return that.openWallet({
                    path: names[numTestWallets - 1],
                    password: _TestUtils["default"].WALLET_PASSWORD
                  });

                case 39:
                  _context19.next = 44;
                  break;

                case 41:
                  _context19.prev = 41;
                  _context19.t5 = _context19["catch"](36);

                  _assert["default"].equal(_context19.t5.getCode(), -1);

                case 44:
                  _context19.prev = 44;
                  _context19.next = 47;
                  return that.openWallet({
                    path: "btc_integrity",
                    password: _TestUtils["default"].WALLET_PASSWORD
                  });

                case 47:
                  throw new Error("Cannot open wallet which is already open");

                case 50:
                  _context19.prev = 50;
                  _context19.t6 = _context19["catch"](44);
                  (0, _assert["default"])(_context19.t6 instanceof _index.MoneroError);

                  _assert["default"].equal(_context19.t6.getCode(), -1); // -1 indicates wallet does not exist (or is open by another app)


                case 54:
                  _i4 = 0, _wallets = wallets;

                case 55:
                  if (!(_i4 < _wallets.length)) {
                    _context19.next = 62;
                    break;
                  }

                  _wallet2 = _wallets[_i4];
                  _context19.next = 59;
                  return that.closeWallet(_wallet2);

                case 59:
                  _i4++;
                  _context19.next = 55;
                  break;

                case 62:
                case "end":
                  return _context19.stop();
              }
            }
          }, _callee19, null, [[36, 41], [44, 50]]);
        })));
        if (testConfig.testNonRelays) it("Can indicate if multisig import is needed for correct balance information", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee20() {
          return _regenerator["default"].wrap(function _callee20$(_context20) {
            while (1) {
              switch (_context20.prev = _context20.next) {
                case 0:
                  _context20.t0 = _assert["default"];
                  _context20.next = 3;
                  return that.wallet.isMultisigImportNeeded();

                case 3:
                  _context20.t1 = _context20.sent;

                  _context20.t0.equal.call(_context20.t0, _context20.t1, false);

                case 5:
                case "end":
                  return _context20.stop();
              }
            }
          }, _callee20);
        })));
        if (testConfig.testNonRelays) it("Can tag accounts and query accounts by tag", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee21() {
          var accounts, tag, taggedAccounts, tags, tag2, taggedAccounts2;
          return _regenerator["default"].wrap(function _callee21$(_context21) {
            while (1) {
              switch (_context21.prev = _context21.next) {
                case 0:
                  _context21.next = 2;
                  return that.wallet.getAccounts();

                case 2:
                  accounts = _context21.sent;
                  (0, _assert["default"])(accounts.length >= 3, "Not enough accounts to test; run create account test"); // tag some of the accounts

                  tag = new _index.MoneroAccountTag("my_tag_" + _index.GenUtils.getUUID(), "my tag label", [0, 1]);
                  _context21.next = 7;
                  return that.wallet.tagAccounts(tag.getTag(), tag.getAccountIndices());

                case 7:
                  _context21.next = 9;
                  return that.wallet.getAccounts(undefined, tag.getTag());

                case 9:
                  taggedAccounts = _context21.sent;

                  _assert["default"].equal(taggedAccounts.length, 2);

                  _assert["default"].equal(taggedAccounts[0].getIndex(), 0);

                  _assert["default"].equal(taggedAccounts[0].getTag(), tag.getTag());

                  _assert["default"].equal(taggedAccounts[1].getIndex(), 1);

                  _assert["default"].equal(taggedAccounts[1].getTag(), tag.getTag()); // set tag label


                  _context21.next = 17;
                  return that.wallet.setAccountTagLabel(tag.getTag(), tag.getLabel());

                case 17:
                  _context21.next = 19;
                  return that.wallet.getAccountTags();

                case 19:
                  tags = _context21.sent;
                  (0, _assert["default"])(_index.GenUtils.arrayContains(tags, tag)); // re-tag an account

                  tag2 = new _index.MoneroAccountTag("my_tag_" + _index.GenUtils.getUUID(), "my tag label 2", [1]);
                  _context21.next = 24;
                  return that.wallet.tagAccounts(tag2.getTag(), tag2.getAccountIndices());

                case 24:
                  _context21.next = 26;
                  return that.wallet.getAccounts(undefined, tag2.getTag());

                case 26:
                  taggedAccounts2 = _context21.sent;

                  _assert["default"].equal(taggedAccounts2.length, 1);

                  _assert["default"].equal(taggedAccounts2[0].getIndex(), 1);

                  _assert["default"].equal(taggedAccounts2[0].getTag(), tag2.getTag()); // re-query original tag which only applies to one account now


                  _context21.next = 32;
                  return that.wallet.getAccounts(undefined, tag.getTag());

                case 32:
                  taggedAccounts = _context21.sent;

                  _assert["default"].equal(taggedAccounts.length, 1);

                  _assert["default"].equal(taggedAccounts[0].getIndex(), 0);

                  _assert["default"].equal(taggedAccounts[0].getTag(), tag.getTag()); // untag and query accounts


                  _context21.next = 38;
                  return that.wallet.untagAccounts([0, 1]);

                case 38:
                  _context21.t0 = _assert["default"];
                  _context21.next = 41;
                  return that.wallet.getAccountTags();

                case 41:
                  _context21.t1 = _context21.sent.length;

                  _context21.t0.equal.call(_context21.t0, _context21.t1, 0);

                  _context21.prev = 43;
                  _context21.next = 46;
                  return that.wallet.getAccounts(undefined, tag.getTag());

                case 46:
                  fail("Should have thrown exception with unregistered tag");
                  _context21.next = 52;
                  break;

                case 49:
                  _context21.prev = 49;
                  _context21.t2 = _context21["catch"](43);

                  _assert["default"].equal(_context21.t2.getCode(), -1);

                case 52:
                  _context21.prev = 52;
                  _context21.next = 55;
                  return that.wallet.getAccounts(undefined, "non_existing_tag");

                case 55:
                  fail("Should have thrown exception with unregistered tag");
                  _context21.next = 61;
                  break;

                case 58:
                  _context21.prev = 58;
                  _context21.t3 = _context21["catch"](52);

                  _assert["default"].equal(_context21.t3.getCode(), -1);

                case 61:
                case "end":
                  return _context21.stop();
              }
            }
          }, _callee21, null, [[43, 49], [52, 58]]);
        })));
        if (testConfig.testNonRelays) it("Can fetch accounts and subaddresses without balance info because this is another RPC call", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee22() {
          var accounts, _iterator, _step, account, _iterator2, _step2, subaddress;

          return _regenerator["default"].wrap(function _callee22$(_context22) {
            while (1) {
              switch (_context22.prev = _context22.next) {
                case 0:
                  _context22.next = 2;
                  return that.wallet.getAccounts(true, undefined, true);

                case 2:
                  accounts = _context22.sent;
                  (0, _assert["default"])(accounts.length > 0);
                  _iterator = _createForOfIteratorHelper(accounts);

                  try {
                    for (_iterator.s(); !(_step = _iterator.n()).done;) {
                      account = _step.value;
                      (0, _assert["default"])(account.getSubaddresses().length > 0);
                      _iterator2 = _createForOfIteratorHelper(account.getSubaddresses());

                      try {
                        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                          subaddress = _step2.value;

                          _assert["default"].equal((0, _typeof2["default"])(subaddress.getAddress()), "string");

                          (0, _assert["default"])(subaddress.getAddress().length > 0);
                          (0, _assert["default"])(subaddress.getAccountIndex() >= 0);
                          (0, _assert["default"])(subaddress.getIndex() >= 0);
                          (0, _assert["default"])(subaddress.getLabel() === undefined || typeof subaddress.getLabel() === "string");
                          if (typeof subaddress.getLabel() === "string") (0, _assert["default"])(subaddress.getLabel().length > 0);

                          _assert["default"].equal((0, _typeof2["default"])(subaddress.isUsed()), "boolean");

                          _assert["default"].equal(subaddress.getNumUnspentOutputs(), undefined);

                          _assert["default"].equal(subaddress.getBalance(), undefined);

                          _assert["default"].equal(subaddress.getUnlockedBalance(), undefined);
                        }
                      } catch (err) {
                        _iterator2.e(err);
                      } finally {
                        _iterator2.f();
                      }
                    }
                  } catch (err) {
                    _iterator.e(err);
                  } finally {
                    _iterator.f();
                  }

                case 6:
                case "end":
                  return _context22.stop();
              }
            }
          }, _callee22);
        })));
        if (testConfig.testNonRelays) it("Can rescan spent", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee23() {
          return _regenerator["default"].wrap(function _callee23$(_context23) {
            while (1) {
              switch (_context23.prev = _context23.next) {
                case 0:
                  _context23.next = 2;
                  return that.wallet.rescanSpent();

                case 2:
                case "end":
                  return _context23.stop();
              }
            }
          }, _callee23);
        })));
        if (testConfig.testNonRelays) it("Can save the wallet file", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee24() {
          return _regenerator["default"].wrap(function _callee24$(_context24) {
            while (1) {
              switch (_context24.prev = _context24.next) {
                case 0:
                  _context24.next = 2;
                  return that.wallet.save();

                case 2:
                case "end":
                  return _context24.stop();
              }
            }
          }, _callee24);
        })));
        if (testConfig.testNonRelays) it("Can close a wallet", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee25() {
          var path, wallet;
          return _regenerator["default"].wrap(function _callee25$(_context25) {
            while (1) {
              switch (_context25.prev = _context25.next) {
                case 0:
                  // create a test wallet
                  path = _index.GenUtils.getUUID();
                  _context25.next = 3;
                  return that.createWallet({
                    path: path,
                    password: _TestUtils["default"].WALLET_PASSWORD
                  });

                case 3:
                  wallet = _context25.sent;
                  _context25.next = 6;
                  return wallet.sync();

                case 6:
                  _context25.t0 = _assert["default"];
                  _context25.next = 9;
                  return wallet.getHeight();

                case 9:
                  _context25.t1 = _context25.sent;
                  _context25.t2 = _context25.t1 > 1;
                  (0, _context25.t0)(_context25.t2);
                  _context25.next = 14;
                  return wallet.close();

                case 14:
                  _context25.prev = 14;
                  _context25.next = 17;
                  return wallet.getHeight();

                case 17:
                  _context25.next = 23;
                  break;

                case 19:
                  _context25.prev = 19;
                  _context25.t3 = _context25["catch"](14);

                  _assert["default"].equal(_context25.t3.getCode(), -13);

                  _assert["default"].equal(_context25.t3.message, "No wallet file");

                case 23:
                  _context25.prev = 23;
                  _context25.next = 26;
                  return wallet.getMnemonic();

                case 26:
                  _context25.next = 32;
                  break;

                case 28:
                  _context25.prev = 28;
                  _context25.t4 = _context25["catch"](23);

                  _assert["default"].equal(_context25.t4.getCode(), -13);

                  _assert["default"].equal(_context25.t4.message, "No wallet file");

                case 32:
                  _context25.prev = 32;
                  _context25.next = 35;
                  return wallet.sync();

                case 35:
                  _context25.next = 41;
                  break;

                case 37:
                  _context25.prev = 37;
                  _context25.t5 = _context25["catch"](32);

                  _assert["default"].equal(_context25.t5.getCode(), -13);

                  _assert["default"].equal(_context25.t5.message, "No wallet file");

                case 41:
                  _context25.next = 43;
                  return wallet.openWallet(path, _TestUtils["default"].WALLET_PASSWORD);

                case 43:
                  _context25.next = 45;
                  return wallet.sync();

                case 45:
                  _context25.t6 = _assert["default"];
                  _context25.next = 48;
                  return wallet.getHeight();

                case 48:
                  _context25.t7 = _context25.sent;
                  _context25.next = 51;
                  return that.daemon.getHeight();

                case 51:
                  _context25.t8 = _context25.sent;

                  _context25.t6.equal.call(_context25.t6, _context25.t7, _context25.t8);

                  _context25.next = 55;
                  return that.closeWallet(wallet, true);

                case 55:
                case "end":
                  return _context25.stop();
              }
            }
          }, _callee25, null, [[14, 19], [23, 28], [32, 37]]);
        })));
        if (false && testConfig.testNonRelays) // disabled so server not actually stopped
          it("Can stop the RPC server", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee26() {
            return _regenerator["default"].wrap(function _callee26$(_context26) {
              while (1) {
                switch (_context26.prev = _context26.next) {
                  case 0:
                    _context26.next = 2;
                    return that.wallet.stop();

                  case 2:
                  case "end":
                    return _context26.stop();
                }
              }
            }, _callee26);
          })));
      });
    }
  }]);
  return TestMoneroWalletRpc;
}(_TestMoneroWalletCommon["default"]);

var _default = TestMoneroWalletRpc;
exports["default"] = _default;

function testAddressBookEntry(entry) {
  (0, _assert["default"])(entry.getIndex() >= 0);
  (0, _assert["default"])(entry.getAddress());
  (0, _assert["default"])(entry.getDescription());
}