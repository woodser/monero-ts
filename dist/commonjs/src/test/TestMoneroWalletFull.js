"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

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

var _StartMining = _interopRequireDefault(require("./utils/StartMining"));

var _WalletSyncPrinter2 = _interopRequireDefault(require("./utils/WalletSyncPrinter"));

var _WalletEqualityUtils = _interopRequireDefault(require("./utils/WalletEqualityUtils"));

var _index = require("../../index");

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * Tests a Monero wallet using WebAssembly to bridge to monero-project's wallet2.
 */
var TestMoneroWalletFull = /*#__PURE__*/function (_TestMoneroWalletComm) {
  (0, _inherits2["default"])(TestMoneroWalletFull, _TestMoneroWalletComm);

  var _super = _createSuper(TestMoneroWalletFull);

  function TestMoneroWalletFull(testConfig) {
    (0, _classCallCheck2["default"])(this, TestMoneroWalletFull);
    return _super.call(this, testConfig);
  }

  (0, _createClass2["default"])(TestMoneroWalletFull, [{
    key: "beforeAll",
    value: function () {
      var _beforeAll = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(currentTest) {
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return (0, _get2["default"])((0, _getPrototypeOf2["default"])(TestMoneroWalletFull.prototype), "beforeAll", this).call(this, currentTest);

              case 2:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function beforeAll(_x) {
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
                return (0, _get2["default"])((0, _getPrototypeOf2["default"])(TestMoneroWalletFull.prototype), "beforeEach", this).call(this, currentTest);

              case 2:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function beforeEach(_x2) {
        return _beforeEach.apply(this, arguments);
      }

      return beforeEach;
    }()
  }, {
    key: "afterAll",
    value: function () {
      var _afterAll = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3() {
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return (0, _get2["default"])((0, _getPrototypeOf2["default"])(TestMoneroWalletFull.prototype), "afterAll", this).call(this);

              case 2:
                TestMoneroWalletFull.FULL_TESTS_RUN = true;

              case 3:
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
        var whitelist, items, _iterator, _step, item, found, _iterator2, _step2, whitelisted;

        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return (0, _get2["default"])((0, _getPrototypeOf2["default"])(TestMoneroWalletFull.prototype), "afterEach", this).call(this, currentTest);

              case 2:
                _context4.t0 = console;
                _context4.next = 5;
                return _index.LibraryUtils.getWasmMemoryUsed();

              case 5:
                _context4.t1 = _context4.sent;
                _context4.t2 = "WASM memory usage: " + _context4.t1;

                _context4.t0.log.call(_context4.t0, _context4.t2);

                //console.log(process.memoryUsage());
                // remove non-whitelisted wallets
                whitelist = [_TestUtils["default"].WALLET_NAME, "ground_truth"];
                items = _TestUtils["default"].getDefaultFs().readdirSync(_TestUtils["default"].TEST_WALLETS_DIR);
                _iterator = _createForOfIteratorHelper(items);
                _context4.prev = 11;

                _iterator.s();

              case 13:
                if ((_step = _iterator.n()).done) {
                  _context4.next = 37;
                  break;
                }

                item = _step.value;
                found = false;
                _iterator2 = _createForOfIteratorHelper(whitelist);
                _context4.prev = 17;

                _iterator2.s();

              case 19:
                if ((_step2 = _iterator2.n()).done) {
                  _context4.next = 26;
                  break;
                }

                whitelisted = _step2.value;

                if (!(item === whitelisted || item === whitelisted + ".keys" || item === whitelisted + " + ress.txt")) {
                  _context4.next = 24;
                  break;
                }

                found = true;
                return _context4.abrupt("break", 26);

              case 24:
                _context4.next = 19;
                break;

              case 26:
                _context4.next = 31;
                break;

              case 28:
                _context4.prev = 28;
                _context4.t3 = _context4["catch"](17);

                _iterator2.e(_context4.t3);

              case 31:
                _context4.prev = 31;

                _iterator2.f();

                return _context4.finish(31);

              case 34:
                if (!found) _TestUtils["default"].getDefaultFs().unlinkSync(_TestUtils["default"].TEST_WALLETS_DIR + "/" + item);

              case 35:
                _context4.next = 13;
                break;

              case 37:
                _context4.next = 42;
                break;

              case 39:
                _context4.prev = 39;
                _context4.t4 = _context4["catch"](11);

                _iterator.e(_context4.t4);

              case 42:
                _context4.prev = 42;

                _iterator.f();

                return _context4.finish(42);

              case 45:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this, [[11, 39, 42, 45], [17, 28, 31, 34]]);
      }));

      function afterEach(_x3) {
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
                _context5.next = 2;
                return _TestUtils["default"].getWalletFull();

              case 2:
                return _context5.abrupt("return", _context5.sent);

              case 3:
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
                _context6.next = 2;
                return _TestUtils["default"].getDaemonRpc();

              case 2:
                return _context6.abrupt("return", _context6.sent);

              case 3:
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
      var _openWallet = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7(config, startSyncing) {
        var wallet;
        return _regenerator["default"].wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                // assign defaults
                config = new _index.MoneroWalletConfig(config);
                if (config.getPassword() === undefined) config.setPassword(_TestUtils["default"].WALLET_PASSWORD);
                if (config.getNetworkType() === undefined) config.setNetworkType(_TestUtils["default"].NETWORK_TYPE);
                if (config.getProxyToWorker() === undefined) config.setProxyToWorker(_TestUtils["default"].PROXY_TO_WORKER);
                if (config.getServer() === undefined && config.getServerUri() === undefined) config.setServer(_TestUtils["default"].getDaemonRpcConnection());
                if (config.getFs() === undefined) config.setFs(_TestUtils["default"].getDefaultFs()); // open wallet

                _context7.next = 8;
                return openWalletFull(config);

              case 8:
                wallet = _context7.sent;
                _context7.t0 = startSyncing !== false;

                if (!_context7.t0) {
                  _context7.next = 14;
                  break;
                }

                _context7.next = 13;
                return wallet.isConnectedToDaemon();

              case 13:
                _context7.t0 = _context7.sent;

              case 14:
                if (!_context7.t0) {
                  _context7.next = 17;
                  break;
                }

                _context7.next = 17;
                return wallet.startSyncing(_TestUtils["default"].SYNC_PERIOD_IN_MS);

              case 17:
                return _context7.abrupt("return", wallet);

              case 18:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7);
      }));

      function openWallet(_x4, _x5) {
        return _openWallet.apply(this, arguments);
      }

      return openWallet;
    }()
  }, {
    key: "createWallet",
    value: function () {
      var _createWallet = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee8(config, startSyncing) {
        var random, wallet;
        return _regenerator["default"].wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                // assign defaults
                config = new _index.MoneroWalletConfig(config);
                random = config.getMnemonic() === undefined && config.getPrimaryAddress() === undefined;
                if (config.getPath() === undefined) config.setPath(_TestUtils["default"].TEST_WALLETS_DIR + "/" + _index.GenUtils.getUUID());
                if (config.getPassword() === undefined) config.setPassword(_TestUtils["default"].WALLET_PASSWORD);
                if (config.getNetworkType() === undefined) config.setNetworkType(_TestUtils["default"].NETWORK_TYPE);
                if (!config.getRestoreHeight() && !random) config.setRestoreHeight(0);
                if (!config.getServer() && config.getServerUri() === undefined) config.setServer(_TestUtils["default"].getDaemonRpcConnection());
                if (config.getProxyToWorker() === undefined) config.setProxyToWorker(_TestUtils["default"].PROXY_TO_WORKER);
                if (config.getFs() === undefined) config.setFs(_TestUtils["default"].getDefaultFs()); // create wallet

                _context8.next = 11;
                return createWalletFull(config);

              case 11:
                wallet = _context8.sent;

                if (random) {
                  _context8.next = 19;
                  break;
                }

                _context8.t0 = _assert["default"];
                _context8.next = 16;
                return wallet.getSyncHeight();

              case 16:
                _context8.t1 = _context8.sent;
                _context8.t2 = config.getRestoreHeight() === undefined ? 0 : config.getRestoreHeight();

                _context8.t0.equal.call(_context8.t0, _context8.t1, _context8.t2);

              case 19:
                _context8.t3 = startSyncing !== false;

                if (!_context8.t3) {
                  _context8.next = 24;
                  break;
                }

                _context8.next = 23;
                return wallet.isConnectedToDaemon();

              case 23:
                _context8.t3 = _context8.sent;

              case 24:
                if (!_context8.t3) {
                  _context8.next = 27;
                  break;
                }

                _context8.next = 27;
                return wallet.startSyncing(_TestUtils["default"].SYNC_PERIOD_IN_MS);

              case 27:
                return _context8.abrupt("return", wallet);

              case 28:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8);
      }));

      function createWallet(_x6, _x7) {
        return _createWallet.apply(this, arguments);
      }

      return createWallet;
    }()
  }, {
    key: "getWalletGt",
    value: function () {
      var _getWalletGt = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee9() {
        var path, wallet;
        return _regenerator["default"].wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                path = _TestUtils["default"].TEST_WALLETS_DIR + "/ground_truth";
                _context9.next = 3;
                return _index.MoneroWalletFull.walletExists(path, _TestUtils["default"].getDefaultFs());

              case 3:
                if (!_context9.sent) {
                  _context9.next = 9;
                  break;
                }

                _context9.next = 6;
                return this.openWallet({
                  path: path
                });

              case 6:
                _context9.t0 = _context9.sent;
                _context9.next = 12;
                break;

              case 9:
                _context9.next = 11;
                return this.createWallet({
                  path: path,
                  mnemonic: _TestUtils["default"].MNEMONIC,
                  restoreHeight: _TestUtils["default"].FIRST_RECEIVE_HEIGHT,
                  proxyToWorker: _TestUtils["default"].PROXY_TO_WORKER
                });

              case 11:
                _context9.t0 = _context9.sent;

              case 12:
                wallet = _context9.t0;
                _context9.next = 15;
                return wallet.sync();

              case 15:
                return _context9.abrupt("return", wallet);

              case 16:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function getWalletGt() {
        return _getWalletGt.apply(this, arguments);
      }

      return getWalletGt;
    }()
  }, {
    key: "closeWallet",
    value: function () {
      var _closeWallet = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee10(wallet, save) {
        return _regenerator["default"].wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                _context10.next = 2;
                return wallet.close(save);

              case 2:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee10);
      }));

      function closeWallet(_x8, _x9) {
        return _closeWallet.apply(this, arguments);
      }

      return closeWallet;
    }()
  }, {
    key: "getMnemonicLanguages",
    value: function () {
      var _getMnemonicLanguages = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee11() {
        return _regenerator["default"].wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                _context11.next = 2;
                return _index.MoneroWalletFull.getMnemonicLanguages();

              case 2:
                return _context11.abrupt("return", _context11.sent);

              case 3:
              case "end":
                return _context11.stop();
            }
          }
        }, _callee11);
      }));

      function getMnemonicLanguages() {
        return _getMnemonicLanguages.apply(this, arguments);
      }

      return getMnemonicLanguages;
    }() // ------------------------------- BEGIN TESTS ------------------------------

  }, {
    key: "runTests",
    value: function runTests() {
      var that = this;
      var testConfig = this.testConfig;
      describe("TEST MONERO WALLET FULL", function () {
        // register handlers to run before and after tests
        before( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee12() {
          return _regenerator["default"].wrap(function _callee12$(_context12) {
            while (1) {
              switch (_context12.prev = _context12.next) {
                case 0:
                  _context12.next = 2;
                  return that.beforeAll();

                case 2:
                case "end":
                  return _context12.stop();
              }
            }
          }, _callee12);
        })));
        beforeEach( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee13() {
          return _regenerator["default"].wrap(function _callee13$(_context13) {
            while (1) {
              switch (_context13.prev = _context13.next) {
                case 0:
                  _context13.next = 2;
                  return that.beforeEach(this.currentTest);

                case 2:
                case "end":
                  return _context13.stop();
              }
            }
          }, _callee13, this);
        })));
        after( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee14() {
          return _regenerator["default"].wrap(function _callee14$(_context14) {
            while (1) {
              switch (_context14.prev = _context14.next) {
                case 0:
                  _context14.next = 2;
                  return that.afterAll();

                case 2:
                case "end":
                  return _context14.stop();
              }
            }
          }, _callee14);
        })));
        afterEach( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee15() {
          return _regenerator["default"].wrap(function _callee15$(_context15) {
            while (1) {
              switch (_context15.prev = _context15.next) {
                case 0:
                  _context15.next = 2;
                  return that.afterEach(this.currentTest);

                case 2:
                case "end":
                  return _context15.stop();
              }
            }
          }, _callee15, this);
        }))); // run tests specific to full wallet

        that._testWalletFull(); // run common tests


        that.runCommonTests();
      });
    }
  }, {
    key: "_testWalletFull",
    value: function _testWalletFull() {
      var that = this;
      var testConfig = this.testConfig;
      describe("Tests specific to WebAssembly wallet", function () {
        if (false && testConfig.testNonRelays) it("Does not leak memory", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee16() {
          var restoreHeight, i;
          return _regenerator["default"].wrap(function _callee16$(_context16) {
            while (1) {
              switch (_context16.prev = _context16.next) {
                case 0:
                  restoreHeight = _TestUtils["default"].FIRST_RECEIVE_HEIGHT; //let wallet = await that.createWallet({mnemonic: TestUtils.MNEMONIC, restoreHeight: restoreHeight}, false);

                  i = 0;

                case 2:
                  if (!(i < 100)) {
                    _context16.next = 9;
                    break;
                  }

                  console.log(process.memoryUsage());
                  _context16.next = 6;
                  return _testSyncMnemonic(_TestUtils["default"].FIRST_RECEIVE_HEIGHT, undefined, false, true);

                case 6:
                  i++;
                  _context16.next = 2;
                  break;

                case 9:
                case "end":
                  return _context16.stop();
              }
            }
          }, _callee16);
        })));
        if (testConfig.testNonRelays) it("Can get the daemon's height", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee17() {
          var daemonHeight;
          return _regenerator["default"].wrap(function _callee17$(_context17) {
            while (1) {
              switch (_context17.prev = _context17.next) {
                case 0:
                  _context17.t0 = _assert["default"];
                  _context17.next = 3;
                  return that.wallet.isConnectedToDaemon();

                case 3:
                  _context17.t1 = _context17.sent;
                  (0, _context17.t0)(_context17.t1);
                  _context17.next = 7;
                  return that.wallet.getDaemonHeight();

                case 7:
                  daemonHeight = _context17.sent;
                  (0, _assert["default"])(daemonHeight > 0);

                case 9:
                case "end":
                  return _context17.stop();
              }
            }
          }, _callee17);
        })));
        if (testConfig.testNonRelays && !testConfig.liteMode) it("Can open, sync, and close wallets repeatedly", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee18() {
          var wallets, i, wallet, _i, _wallets, _wallet;

          return _regenerator["default"].wrap(function _callee18$(_context18) {
            while (1) {
              switch (_context18.prev = _context18.next) {
                case 0:
                  wallets = [];
                  i = 0;

                case 2:
                  if (!(i < 4)) {
                    _context18.next = 12;
                    break;
                  }

                  _context18.next = 5;
                  return that.createWallet({
                    mnemonic: _TestUtils["default"].MNEMONIC,
                    restoreHeight: _TestUtils["default"].FIRST_RECEIVE_HEIGHT
                  });

                case 5:
                  wallet = _context18.sent;
                  _context18.next = 8;
                  return wallet.startSyncing();

                case 8:
                  wallets.push(wallet);

                case 9:
                  i++;
                  _context18.next = 2;
                  break;

                case 12:
                  _i = 0, _wallets = wallets;

                case 13:
                  if (!(_i < _wallets.length)) {
                    _context18.next = 20;
                    break;
                  }

                  _wallet = _wallets[_i];
                  _context18.next = 17;
                  return _wallet.close();

                case 17:
                  _i++;
                  _context18.next = 13;
                  break;

                case 20:
                case "end":
                  return _context18.stop();
              }
            }
          }, _callee18);
        })));
        if (testConfig.testNonRelays) it("Can get the daemon's max peer height", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee19() {
          var height;
          return _regenerator["default"].wrap(function _callee19$(_context19) {
            while (1) {
              switch (_context19.prev = _context19.next) {
                case 0:
                  _context19.next = 2;
                  return that.wallet.getDaemonMaxPeerHeight();

                case 2:
                  height = _context19.sent;
                  (0, _assert["default"])(height > 0);

                case 4:
                case "end":
                  return _context19.stop();
              }
            }
          }, _callee19);
        })));
        if (testConfig.testNonRelays) it("Can create a random full wallet", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee20() {
          var wallet;
          return _regenerator["default"].wrap(function _callee20$(_context20) {
            while (1) {
              switch (_context20.prev = _context20.next) {
                case 0:
                  _context20.next = 2;
                  return that.createWallet({
                    networkType: _index.MoneroNetworkType.MAINNET,
                    serverUri: _TestUtils["default"].OFFLINE_SERVER_URI
                  });

                case 2:
                  wallet = _context20.sent;
                  _context20.t0 = _index.MoneroUtils;
                  _context20.next = 6;
                  return wallet.getMnemonic();

                case 6:
                  _context20.t1 = _context20.sent;
                  _context20.next = 9;
                  return _context20.t0.validateMnemonic.call(_context20.t0, _context20.t1);

                case 9:
                  _context20.t2 = _index.MoneroUtils;
                  _context20.next = 12;
                  return wallet.getPrimaryAddress();

                case 12:
                  _context20.t3 = _context20.sent;
                  _context20.t4 = _index.MoneroNetworkType.MAINNET;
                  _context20.next = 16;
                  return _context20.t2.validateAddress.call(_context20.t2, _context20.t3, _context20.t4);

                case 16:
                  _context20.t5 = _assert["default"];
                  _context20.next = 19;
                  return wallet.getNetworkType();

                case 19:
                  _context20.t6 = _context20.sent;
                  _context20.t7 = _index.MoneroNetworkType.MAINNET;

                  _context20.t5.equal.call(_context20.t5, _context20.t6, _context20.t7);

                  _context20.t8 = _assert["default"];
                  _context20.next = 25;
                  return wallet.getDaemonConnection();

                case 25:
                  _context20.t9 = _context20.sent;
                  _context20.t10 = new MoneroRpcConnection(_TestUtils["default"].OFFLINE_SERVER_URI);

                  _context20.t8.deepEqual.call(_context20.t8, _context20.t9, _context20.t10);

                  _context20.t11 = _assert["default"];
                  _context20.next = 31;
                  return wallet.isConnectedToDaemon();

                case 31:
                  _context20.t12 = !_context20.sent;
                  (0, _context20.t11)(_context20.t12);
                  _context20.t13 = _assert["default"];
                  _context20.next = 36;
                  return wallet.getMnemonicLanguage();

                case 36:
                  _context20.t14 = _context20.sent;

                  _context20.t13.equal.call(_context20.t13, _context20.t14, "English");

                  _context20.t15 = _assert["default"];
                  _context20.next = 41;
                  return wallet.isSynced();

                case 41:
                  _context20.t16 = !_context20.sent;
                  (0, _context20.t15)(_context20.t16);
                  _context20.t17 = _assert["default"];
                  _context20.next = 46;
                  return wallet.getHeight();

                case 46:
                  _context20.t18 = _context20.sent;

                  _context20.t17.equal.call(_context20.t17, _context20.t18, 1);

                  _context20.t19 = _assert["default"];
                  _context20.next = 51;
                  return wallet.getSyncHeight();

                case 51:
                  _context20.t20 = _context20.sent;
                  _context20.t21 = _context20.t20 >= 0;
                  (0, _context20.t19)(_context20.t21);
                  _context20.prev = 54;
                  _context20.next = 57;
                  return wallet.getDaemonHeight();

                case 57:
                  _context20.next = 62;
                  break;

                case 59:
                  _context20.prev = 59;
                  _context20.t22 = _context20["catch"](54);

                  _assert["default"].equal(_context20.t22.message, "Wallet is not connected to daemon");

                case 62:
                  _context20.t23 = wallet;
                  _context20.next = 65;
                  return that.daemon.getRpcConnection();

                case 65:
                  _context20.t24 = _context20.sent;
                  _context20.next = 68;
                  return _context20.t23.setDaemonConnection.call(_context20.t23, _context20.t24);

                case 68:
                  _context20.t25 = _assert["default"];
                  _context20.next = 71;
                  return wallet.getDaemonHeight();

                case 71:
                  _context20.t26 = _context20.sent;
                  _context20.next = 74;
                  return that.daemon.getHeight();

                case 74:
                  _context20.t27 = _context20.sent;

                  _context20.t25.equal.call(_context20.t25, _context20.t26, _context20.t27);

                  _context20.next = 78;
                  return wallet.close();

                case 78:
                  _context20.next = 80;
                  return that.createWallet({
                    networkType: _index.MoneroNetworkType.TESTNET,
                    language: "Spanish"
                  }, false);

                case 80:
                  wallet = _context20.sent;
                  _context20.t28 = _index.MoneroUtils;
                  _context20.next = 84;
                  return wallet.getMnemonic();

                case 84:
                  _context20.t29 = _context20.sent;
                  _context20.next = 87;
                  return _context20.t28.validateMnemonic.call(_context20.t28, _context20.t29);

                case 87:
                  _context20.t30 = _index.MoneroUtils;
                  _context20.next = 90;
                  return wallet.getPrimaryAddress();

                case 90:
                  _context20.t31 = _context20.sent;
                  _context20.t32 = _index.MoneroNetworkType.TESTNET;
                  _context20.next = 94;
                  return _context20.t30.validateAddress.call(_context20.t30, _context20.t31, _context20.t32);

                case 94:
                  _context20.t33 = _assert["default"];
                  _context20.next = 97;
                  return wallet.getNetworkType();

                case 97:
                  _context20.t34 = _context20.sent;
                  _context20.next = 100;
                  return _index.MoneroNetworkType.TESTNET;

                case 100:
                  _context20.t35 = _context20.sent;

                  _context20.t33.equal.call(_context20.t33, _context20.t34, _context20.t35);

                  _context20.t36 = _assert["default"];
                  _context20.next = 105;
                  return wallet.getDaemonConnection();

                case 105:
                  _context20.t37 = _context20.sent;
                  (0, _context20.t36)(_context20.t37);
                  _context20.t38 = _assert["default"];
                  _context20.next = 110;
                  return that.daemon.getRpcConnection();

                case 110:
                  _context20.t39 = _context20.sent.getConfig();
                  _context20.next = 113;
                  return wallet.getDaemonConnection();

                case 113:
                  _context20.t40 = _context20.sent.getConfig();
                  _context20.t41 = _context20.t39 !== _context20.t40;
                  (0, _context20.t38)(_context20.t41);
                  _context20.t42 = _assert["default"];
                  _context20.next = 119;
                  return wallet.getDaemonConnection();

                case 119:
                  _context20.t43 = _context20.sent.getUri();
                  _context20.next = 122;
                  return that.daemon.getRpcConnection();

                case 122:
                  _context20.t44 = _context20.sent.getUri();

                  _context20.t42.equal.call(_context20.t42, _context20.t43, _context20.t44);

                  _context20.t45 = _assert["default"];
                  _context20.next = 127;
                  return wallet.getDaemonConnection();

                case 127:
                  _context20.t46 = _context20.sent.getUsername();
                  _context20.next = 130;
                  return that.daemon.getRpcConnection();

                case 130:
                  _context20.t47 = _context20.sent.getUsername();

                  _context20.t45.equal.call(_context20.t45, _context20.t46, _context20.t47);

                  _context20.t48 = _assert["default"];
                  _context20.next = 135;
                  return wallet.getDaemonConnection();

                case 135:
                  _context20.t49 = _context20.sent.getPassword();
                  _context20.next = 138;
                  return that.daemon.getRpcConnection();

                case 138:
                  _context20.t50 = _context20.sent.getPassword();

                  _context20.t48.equal.call(_context20.t48, _context20.t49, _context20.t50);

                  _context20.t51 = _assert["default"];
                  _context20.next = 143;
                  return wallet.isConnectedToDaemon();

                case 143:
                  _context20.t52 = _context20.sent;
                  (0, _context20.t51)(_context20.t52);
                  _context20.t53 = _assert["default"];
                  _context20.next = 148;
                  return wallet.getMnemonicLanguage();

                case 148:
                  _context20.t54 = _context20.sent;

                  _context20.t53.equal.call(_context20.t53, _context20.t54, "Spanish");

                  _context20.t55 = _assert["default"];
                  _context20.next = 153;
                  return wallet.isSynced();

                case 153:
                  _context20.t56 = !_context20.sent;
                  (0, _context20.t55)(_context20.t56);
                  _context20.t57 = _assert["default"];
                  _context20.next = 158;
                  return wallet.getHeight();

                case 158:
                  _context20.t58 = _context20.sent;

                  _context20.t57.equal.call(_context20.t57, _context20.t58, 1);

                  _context20.next = 162;
                  return that.daemon.isConnected();

                case 162:
                  if (!_context20.sent) {
                    _context20.next = 173;
                    break;
                  }

                  _context20.t59 = _assert["default"];
                  _context20.next = 166;
                  return wallet.getSyncHeight();

                case 166:
                  _context20.t60 = _context20.sent;
                  _context20.next = 169;
                  return that.daemon.getHeight();

                case 169:
                  _context20.t61 = _context20.sent;

                  _context20.t59.equal.call(_context20.t59, _context20.t60, _context20.t61);

                  _context20.next = 179;
                  break;

                case 173:
                  _context20.t62 = _assert["default"];
                  _context20.next = 176;
                  return wallet.getSyncHeight();

                case 176:
                  _context20.t63 = _context20.sent;
                  _context20.t64 = _context20.t63 >= 0;
                  (0, _context20.t62)(_context20.t64);

                case 179:
                  _context20.next = 181;
                  return wallet.close();

                case 181:
                case "end":
                  return _context20.stop();
              }
            }
          }, _callee20, null, [[54, 59]]);
        })));
        if (testConfig.testNonRelays) it("Can create a full wallet from mnemonic", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee21() {
          var wallet, restoreHeight, path;
          return _regenerator["default"].wrap(function _callee21$(_context21) {
            while (1) {
              switch (_context21.prev = _context21.next) {
                case 0:
                  _context21.next = 2;
                  return that.createWallet({
                    mnemonic: _TestUtils["default"].MNEMONIC,
                    serverUri: _TestUtils["default"].OFFLINE_SERVER_URI
                  });

                case 2:
                  wallet = _context21.sent;
                  _context21.t0 = _assert["default"];
                  _context21.next = 6;
                  return wallet.getMnemonic();

                case 6:
                  _context21.t1 = _context21.sent;
                  _context21.t2 = _TestUtils["default"].MNEMONIC;

                  _context21.t0.equal.call(_context21.t0, _context21.t1, _context21.t2);

                  _context21.t3 = _assert["default"];
                  _context21.next = 12;
                  return wallet.getPrimaryAddress();

                case 12:
                  _context21.t4 = _context21.sent;
                  _context21.t5 = TestUtilsADDRESS;

                  _context21.t3.equal.call(_context21.t3, _context21.t4, _context21.t5);

                  _context21.t6 = _assert["default"];
                  _context21.next = 18;
                  return wallet.getNetworkType();

                case 18:
                  _context21.t7 = _context21.sent;
                  _context21.t8 = _TestUtils["default"].NETWORK_TYPE;

                  _context21.t6.equal.call(_context21.t6, _context21.t7, _context21.t8);

                  _context21.t9 = _assert["default"];
                  _context21.next = 24;
                  return wallet.getDaemonConnection();

                case 24:
                  _context21.t10 = _context21.sent;
                  _context21.t11 = new MoneroRpcConnection(_TestUtils["default"].OFFLINE_SERVER_URI);

                  _context21.t9.deepEqual.call(_context21.t9, _context21.t10, _context21.t11);

                  _context21.t12 = _assert["default"];
                  _context21.next = 30;
                  return wallet.isConnectedToDaemon();

                case 30:
                  _context21.t13 = !_context21.sent;
                  (0, _context21.t12)(_context21.t13);
                  _context21.t14 = _assert["default"];
                  _context21.next = 35;
                  return wallet.getMnemonicLanguage();

                case 35:
                  _context21.t15 = _context21.sent;

                  _context21.t14.equal.call(_context21.t14, _context21.t15, "English");

                  _context21.t16 = _assert["default"];
                  _context21.next = 40;
                  return wallet.isSynced();

                case 40:
                  _context21.t17 = !_context21.sent;
                  (0, _context21.t16)(_context21.t17);
                  _context21.t18 = _assert["default"];
                  _context21.next = 45;
                  return wallet.getHeight();

                case 45:
                  _context21.t19 = _context21.sent;

                  _context21.t18.equal.call(_context21.t18, _context21.t19, 1);

                  _context21.t20 = _assert["default"];
                  _context21.next = 50;
                  return wallet.getSyncHeight();

                case 50:
                  _context21.t21 = _context21.sent;

                  _context21.t20.equal.call(_context21.t20, _context21.t21, 0);

                  _context21.prev = 52;
                  _context21.next = 55;
                  return wallet.startSyncing();

                case 55:
                  _context21.next = 60;
                  break;

                case 57:
                  _context21.prev = 57;
                  _context21.t22 = _context21["catch"](52);

                  _assert["default"].equal(_context21.t22.message, "Wallet is not connected to daemon");

                case 60:
                  _context21.next = 62;
                  return wallet.close();

                case 62:
                  _context21.next = 64;
                  return that.createWallet({
                    mnemonic: _TestUtils["default"].MNEMONIC
                  }, false);

                case 64:
                  wallet = _context21.sent;
                  _context21.t23 = _assert["default"];
                  _context21.next = 68;
                  return wallet.getMnemonic();

                case 68:
                  _context21.t24 = _context21.sent;
                  _context21.t25 = _TestUtils["default"].MNEMONIC;

                  _context21.t23.equal.call(_context21.t23, _context21.t24, _context21.t25);

                  _context21.t26 = _assert["default"];
                  _context21.next = 74;
                  return wallet.getPrimaryAddress();

                case 74:
                  _context21.t27 = _context21.sent;
                  _context21.t28 = TestUtilsADDRESS;

                  _context21.t26.equal.call(_context21.t26, _context21.t27, _context21.t28);

                  _context21.t29 = _assert["default"];
                  _context21.t30 = _TestUtils["default"].NETWORK_TYPE;
                  _context21.next = 81;
                  return wallet.getNetworkType();

                case 81:
                  _context21.t31 = _context21.sent;

                  _context21.t29.equal.call(_context21.t29, _context21.t30, _context21.t31);

                  _context21.t32 = _assert["default"];
                  _context21.next = 86;
                  return wallet.getDaemonConnection();

                case 86:
                  _context21.t33 = _context21.sent;
                  (0, _context21.t32)(_context21.t33);
                  _context21.t34 = _assert["default"];
                  _context21.next = 91;
                  return that.daemon.getRpcConnection();

                case 91:
                  _context21.t35 = _context21.sent;
                  _context21.next = 94;
                  return wallet.getDaemonConnection();

                case 94:
                  _context21.t36 = _context21.sent;
                  _context21.t37 = _context21.t35 != _context21.t36;
                  (0, _context21.t34)(_context21.t37);
                  _context21.t38 = _assert["default"];
                  _context21.next = 100;
                  return wallet.getDaemonConnection();

                case 100:
                  _context21.t39 = _context21.sent.getUri();
                  _context21.next = 103;
                  return that.daemon.getRpcConnection();

                case 103:
                  _context21.t40 = _context21.sent.getUri();

                  _context21.t38.equal.call(_context21.t38, _context21.t39, _context21.t40);

                  _context21.t41 = _assert["default"];
                  _context21.next = 108;
                  return wallet.getDaemonConnection();

                case 108:
                  _context21.t42 = _context21.sent.getUsername();
                  _context21.next = 111;
                  return that.daemon.getRpcConnection();

                case 111:
                  _context21.t43 = _context21.sent.getUsername();

                  _context21.t41.equal.call(_context21.t41, _context21.t42, _context21.t43);

                  _context21.t44 = _assert["default"];
                  _context21.next = 116;
                  return wallet.getDaemonConnection();

                case 116:
                  _context21.t45 = _context21.sent.getPassword();
                  _context21.next = 119;
                  return that.daemon.getRpcConnection();

                case 119:
                  _context21.t46 = _context21.sent.getPassword();

                  _context21.t44.equal.call(_context21.t44, _context21.t45, _context21.t46);

                  _context21.t47 = _assert["default"];
                  _context21.next = 124;
                  return wallet.isConnectedToDaemon();

                case 124:
                  _context21.t48 = _context21.sent;
                  (0, _context21.t47)(_context21.t48);
                  _context21.t49 = _assert["default"];
                  _context21.next = 129;
                  return wallet.getMnemonicLanguage();

                case 129:
                  _context21.t50 = _context21.sent;

                  _context21.t49.equal.call(_context21.t49, _context21.t50, "English");

                  _context21.t51 = _assert["default"];
                  _context21.next = 134;
                  return wallet.isSynced();

                case 134:
                  _context21.t52 = !_context21.sent;
                  (0, _context21.t51)(_context21.t52);
                  _context21.t53 = _assert["default"];
                  _context21.next = 139;
                  return wallet.getHeight();

                case 139:
                  _context21.t54 = _context21.sent;

                  _context21.t53.equal.call(_context21.t53, _context21.t54, 1);

                  _context21.t55 = _assert["default"];
                  _context21.next = 144;
                  return wallet.getSyncHeight();

                case 144:
                  _context21.t56 = _context21.sent;

                  _context21.t55.equal.call(_context21.t55, _context21.t56, 0);

                  _context21.next = 148;
                  return wallet.close();

                case 148:
                  // create wallet with mnemonic, no connection, and restore height
                  restoreHeight = 10000;
                  _context21.next = 151;
                  return that.createWallet({
                    mnemonic: _TestUtils["default"].MNEMONIC,
                    restoreHeight: restoreHeight,
                    serverUri: _TestUtils["default"].OFFLINE_SERVER_URI
                  });

                case 151:
                  wallet = _context21.sent;
                  _context21.t57 = _assert["default"];
                  _context21.next = 155;
                  return wallet.getMnemonic();

                case 155:
                  _context21.t58 = _context21.sent;
                  _context21.t59 = _TestUtils["default"].MNEMONIC;

                  _context21.t57.equal.call(_context21.t57, _context21.t58, _context21.t59);

                  _context21.t60 = _assert["default"];
                  _context21.next = 161;
                  return wallet.getPrimaryAddress();

                case 161:
                  _context21.t61 = _context21.sent;
                  _context21.t62 = TestUtilsADDRESS;

                  _context21.t60.equal.call(_context21.t60, _context21.t61, _context21.t62);

                  _context21.t63 = _assert["default"];
                  _context21.next = 167;
                  return wallet.getNetworkType();

                case 167:
                  _context21.t64 = _context21.sent;
                  _context21.t65 = _TestUtils["default"].NETWORK_TYPE;

                  _context21.t63.equal.call(_context21.t63, _context21.t64, _context21.t65);

                  _context21.t66 = _assert["default"];
                  _context21.next = 173;
                  return wallet.getDaemonConnection();

                case 173:
                  _context21.t67 = _context21.sent;
                  _context21.t68 = new MoneroRpcConnection(_TestUtils["default"].OFFLINE_SERVER_URI);

                  _context21.t66.deepEqual.call(_context21.t66, _context21.t67, _context21.t68);

                  _context21.t69 = _assert["default"];
                  _context21.next = 179;
                  return wallet.isConnectedToDaemon();

                case 179:
                  _context21.t70 = !_context21.sent;
                  (0, _context21.t69)(_context21.t70);
                  _context21.t71 = _assert["default"];
                  _context21.next = 184;
                  return wallet.getMnemonicLanguage();

                case 184:
                  _context21.t72 = _context21.sent;

                  _context21.t71.equal.call(_context21.t71, _context21.t72, "English");

                  _context21.t73 = _assert["default"];
                  _context21.next = 189;
                  return wallet.getHeight();

                case 189:
                  _context21.t74 = _context21.sent;

                  _context21.t73.equal.call(_context21.t73, _context21.t74, 1);

                  _context21.t75 = _assert["default"];
                  _context21.next = 194;
                  return wallet.getSyncHeight();

                case 194:
                  _context21.t76 = _context21.sent;
                  _context21.t77 = restoreHeight;

                  _context21.t75.equal.call(_context21.t75, _context21.t76, _context21.t77);

                  _context21.next = 199;
                  return wallet.getPath();

                case 199:
                  path = _context21.sent;
                  _context21.next = 202;
                  return wallet.close(true);

                case 202:
                  _context21.next = 204;
                  return that.openWallet({
                    path: path,
                    serverUri: _TestUtils["default"].OFFLINE_SERVER_URI
                  });

                case 204:
                  wallet = _context21.sent;
                  _context21.t78 = _assert["default"];
                  _context21.next = 208;
                  return wallet.isConnectedToDaemon();

                case 208:
                  _context21.t79 = !_context21.sent;
                  (0, _context21.t78)(_context21.t79);
                  _context21.t80 = _assert["default"];
                  _context21.next = 213;
                  return wallet.isSynced();

                case 213:
                  _context21.t81 = !_context21.sent;
                  (0, _context21.t80)(_context21.t81);
                  _context21.t82 = _assert["default"];
                  _context21.next = 218;
                  return wallet.getHeight();

                case 218:
                  _context21.t83 = _context21.sent;

                  _context21.t82.equal.call(_context21.t82, _context21.t83, 1);

                  _context21.t84 = _assert["default"];
                  _context21.next = 223;
                  return wallet.getSyncHeight();

                case 223:
                  _context21.t85 = _context21.sent;
                  _context21.t86 = restoreHeight;

                  _context21.t84.equal.call(_context21.t84, _context21.t85, _context21.t86);

                  _context21.next = 228;
                  return wallet.close();

                case 228:
                  _context21.next = 230;
                  return that.createWallet({
                    mnemonic: _TestUtils["default"].MNEMONIC,
                    restoreHeight: restoreHeight
                  }, false);

                case 230:
                  wallet = _context21.sent;
                  _context21.t87 = _assert["default"];
                  _context21.next = 234;
                  return wallet.getMnemonic();

                case 234:
                  _context21.t88 = _context21.sent;
                  _context21.t89 = _TestUtils["default"].MNEMONIC;

                  _context21.t87.equal.call(_context21.t87, _context21.t88, _context21.t89);

                  _context21.t90 = _assert["default"];
                  _context21.next = 240;
                  return wallet.getPrimaryAddress();

                case 240:
                  _context21.t91 = _context21.sent;
                  _context21.t92 = TestUtilsADDRESS;
                  (0, _context21.t90)(_context21.t91, _context21.t92);
                  _context21.t93 = _assert["default"];
                  _context21.next = 246;
                  return wallet.getNetworkType();

                case 246:
                  _context21.t94 = _context21.sent;
                  _context21.t95 = _TestUtils["default"].NETWORK_TYPE;
                  (0, _context21.t93)(_context21.t94, _context21.t95);
                  _context21.t96 = _assert["default"];
                  _context21.next = 252;
                  return wallet.getDaemonConnection();

                case 252:
                  _context21.t97 = _context21.sent;
                  (0, _context21.t96)(_context21.t97);
                  _context21.t98 = _assert["default"];
                  _context21.next = 257;
                  return that.daemon.getRpcConnection();

                case 257:
                  _context21.t99 = _context21.sent;
                  _context21.t100 = wallet.getDaemonConnection();
                  _context21.t101 = _context21.t99 != _context21.t100;
                  (0, _context21.t98)(_context21.t101);
                  _context21.t102 = _assert["default"];
                  _context21.next = 264;
                  return wallet.getDaemonConnection();

                case 264:
                  _context21.t103 = _context21.sent.getUri();
                  _context21.next = 267;
                  return that.daemon.getRpcConnection();

                case 267:
                  _context21.t104 = _context21.sent.getUri();

                  _context21.t102.equal.call(_context21.t102, _context21.t103, _context21.t104);

                  _context21.t105 = _assert["default"];
                  _context21.next = 272;
                  return wallet.getDaemonConnection();

                case 272:
                  _context21.t106 = _context21.sent.getUsername();
                  _context21.next = 275;
                  return that.daemon.getRpcConnection();

                case 275:
                  _context21.t107 = _context21.sent.getUsername();

                  _context21.t105.equal.call(_context21.t105, _context21.t106, _context21.t107);

                  _context21.t108 = _assert["default"];
                  _context21.next = 280;
                  return wallet.getDaemonConnection();

                case 280:
                  _context21.t109 = _context21.sent.getPassword();
                  _context21.next = 283;
                  return that.daemon.getRpcConnection();

                case 283:
                  _context21.t110 = _context21.sent.getPassword();

                  _context21.t108.equal.call(_context21.t108, _context21.t109, _context21.t110);

                  _context21.t111 = _assert["default"];
                  _context21.next = 288;
                  return wallet.isConnectedToDaemon();

                case 288:
                  _context21.t112 = _context21.sent;
                  (0, _context21.t111)(_context21.t112);
                  _context21.t113 = _assert["default"];
                  _context21.next = 293;
                  return wallet.getMnemonicLanguage();

                case 293:
                  _context21.t114 = _context21.sent;

                  _context21.t113.equal.call(_context21.t113, _context21.t114, "English");

                  _context21.t115 = _assert["default"];
                  _context21.next = 298;
                  return wallet.isSynced();

                case 298:
                  _context21.t116 = !_context21.sent;
                  (0, _context21.t115)(_context21.t116);
                  _context21.t117 = _assert["default"];
                  _context21.next = 303;
                  return wallet.getHeight();

                case 303:
                  _context21.t118 = _context21.sent;

                  _context21.t117.equal.call(_context21.t117, _context21.t118, 1);

                  _context21.t119 = _assert["default"];
                  _context21.next = 308;
                  return wallet.getSyncHeight();

                case 308:
                  _context21.t120 = _context21.sent;
                  _context21.t121 = restoreHeight;

                  _context21.t119.equal.call(_context21.t119, _context21.t120, _context21.t121);

                  _context21.next = 313;
                  return wallet.close();

                case 313:
                case "end":
                  return _context21.stop();
              }
            }
          }, _callee21, null, [[52, 57]]);
        })));
        if (testConfig.testNonRelays) it("Can create a full wallet from keys", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee22() {
          var wallet, walletKeys, err;
          return _regenerator["default"].wrap(function _callee22$(_context22) {
            while (1) {
              switch (_context22.prev = _context22.next) {
                case 0:
                  // recreate test wallet from keys
                  wallet = that.wallet;
                  _context22.t0 = that;
                  _context22.t1 = _TestUtils["default"].OFFLINE_SERVER_URI;
                  _context22.next = 5;
                  return wallet.getNetworkType();

                case 5:
                  _context22.t2 = _context22.sent;
                  _context22.next = 8;
                  return wallet.getPrimaryAddress();

                case 8:
                  _context22.t3 = _context22.sent;
                  _context22.next = 11;
                  return wallet.getPrivateViewKey();

                case 11:
                  _context22.t4 = _context22.sent;
                  _context22.next = 14;
                  return wallet.getPrivateSpendKey();

                case 14:
                  _context22.t5 = _context22.sent;
                  _context22.t6 = _TestUtils["default"].FIRST_RECEIVE_HEIGHT;
                  _context22.t7 = {
                    serverUri: _context22.t1,
                    networkType: _context22.t2,
                    primaryAddress: _context22.t3,
                    privateViewKey: _context22.t4,
                    privateSpendKey: _context22.t5,
                    restoreHeight: _context22.t6
                  };
                  _context22.next = 19;
                  return _context22.t0.createWallet.call(_context22.t0, _context22.t7);

                case 19:
                  walletKeys = _context22.sent;
                  _context22.prev = 20;
                  _context22.t8 = _assert["default"];
                  _context22.next = 24;
                  return walletKeys.getMnemonic();

                case 24:
                  _context22.t9 = _context22.sent;
                  _context22.next = 27;
                  return wallet.getMnemonic();

                case 27:
                  _context22.t10 = _context22.sent;

                  _context22.t8.equal.call(_context22.t8, _context22.t9, _context22.t10);

                  _context22.t11 = _assert["default"];
                  _context22.next = 32;
                  return walletKeys.getPrimaryAddress();

                case 32:
                  _context22.t12 = _context22.sent;
                  _context22.next = 35;
                  return wallet.getPrimaryAddress();

                case 35:
                  _context22.t13 = _context22.sent;

                  _context22.t11.equal.call(_context22.t11, _context22.t12, _context22.t13);

                  _context22.t14 = _assert["default"];
                  _context22.next = 40;
                  return walletKeys.getPrivateViewKey();

                case 40:
                  _context22.t15 = _context22.sent;
                  _context22.next = 43;
                  return wallet.getPrivateViewKey();

                case 43:
                  _context22.t16 = _context22.sent;

                  _context22.t14.equal.call(_context22.t14, _context22.t15, _context22.t16);

                  _context22.t17 = _assert["default"];
                  _context22.next = 48;
                  return walletKeys.getPublicViewKey();

                case 48:
                  _context22.t18 = _context22.sent;
                  _context22.next = 51;
                  return wallet.getPublicViewKey();

                case 51:
                  _context22.t19 = _context22.sent;

                  _context22.t17.equal.call(_context22.t17, _context22.t18, _context22.t19);

                  _context22.t20 = _assert["default"];
                  _context22.next = 56;
                  return walletKeys.getPrivateSpendKey();

                case 56:
                  _context22.t21 = _context22.sent;
                  _context22.next = 59;
                  return wallet.getPrivateSpendKey();

                case 59:
                  _context22.t22 = _context22.sent;

                  _context22.t20.equal.call(_context22.t20, _context22.t21, _context22.t22);

                  _context22.t23 = _assert["default"];
                  _context22.next = 64;
                  return walletKeys.getPublicSpendKey();

                case 64:
                  _context22.t24 = _context22.sent;
                  _context22.next = 67;
                  return wallet.getPublicSpendKey();

                case 67:
                  _context22.t25 = _context22.sent;

                  _context22.t23.equal.call(_context22.t23, _context22.t24, _context22.t25);

                  _context22.t26 = _assert["default"];
                  _context22.next = 72;
                  return walletKeys.getSyncHeight();

                case 72:
                  _context22.t27 = _context22.sent;
                  _context22.t28 = _TestUtils["default"].FIRST_RECEIVE_HEIGHT;

                  _context22.t26.equal.call(_context22.t26, _context22.t27, _context22.t28);

                  _context22.t29 = _assert["default"];
                  _context22.next = 78;
                  return walletKeys.isConnectedToDaemon();

                case 78:
                  _context22.t30 = !_context22.sent;
                  (0, _context22.t29)(_context22.t30);
                  _context22.t31 = _assert["default"];
                  _context22.next = 83;
                  return walletKeys.isSynced();

                case 83:
                  _context22.t32 = !_context22.sent;
                  (0, _context22.t31)(_context22.t32);
                  _context22.next = 90;
                  break;

                case 87:
                  _context22.prev = 87;
                  _context22.t33 = _context22["catch"](20);
                  err = _context22.t33;

                case 90:
                  _context22.next = 92;
                  return walletKeys.close();

                case 92:
                  if (!err) {
                    _context22.next = 94;
                    break;
                  }

                  throw err;

                case 94:
                case "end":
                  return _context22.stop();
              }
            }
          }, _callee22, null, [[20, 87]]);
        })));
        if (testConfig.testNonRelays && !_index.GenUtils.isBrowser()) it("Is compatible with monero-wallet-rpc wallet files", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee23() {
          var walletName, walletRpc, balance, outputsHex, walletFull, path;
          return _regenerator["default"].wrap(function _callee23$(_context23) {
            while (1) {
              switch (_context23.prev = _context23.next) {
                case 0:
                  // create wallet using monero-wallet-rpc
                  walletName = _index.GenUtils.getUUID();
                  _context23.next = 3;
                  return _TestUtils["default"].getWalletRpc();

                case 3:
                  walletRpc = _context23.sent;
                  _context23.next = 6;
                  return walletRpc.createWallet(new _index.MoneroWalletConfig().setPath(walletName).setPassword(_TestUtils["default"].WALLET_PASSWORD).setMnemonic(_TestUtils["default"].MNEMONIC).setRestoreHeight(_TestUtils["default"].FIRST_RECEIVE_HEIGHT));

                case 6:
                  _context23.next = 8;
                  return walletRpc.sync();

                case 8:
                  _context23.next = 10;
                  return walletRpc.getBalance();

                case 10:
                  balance = _context23.sent;
                  _context23.next = 13;
                  return walletRpc.exportOutputs();

                case 13:
                  outputsHex = _context23.sent;
                  (0, _assert["default"])(outputsHex.length > 0);
                  _context23.next = 17;
                  return walletRpc.close(true);

                case 17:
                  _context23.next = 19;
                  return openWalletFull(new _index.MoneroWalletConfig().setPath(_TestUtils["default"].WALLET_RPC_LOCAL_WALLET_DIR + "/" + walletName).setPassword(_TestUtils["default"].WALLET_PASSWORD).setNetworkType(_TestUtils["default"].NETWORK_TYPE).setServer(_TestUtils["default"].DAEMON_RPC_CONFIG));

                case 19:
                  walletFull = _context23.sent;
                  _context23.next = 22;
                  return walletFull.sync();

                case 22:
                  _context23.t0 = _assert["default"];
                  _context23.t1 = _TestUtils["default"].MNEMONIC;
                  _context23.next = 26;
                  return walletFull.getMnemonic();

                case 26:
                  _context23.t2 = _context23.sent;

                  _context23.t0.equal.call(_context23.t0, _context23.t1, _context23.t2);

                  _context23.t3 = _assert["default"];
                  _context23.t4 = TestUtilsADDRESS;
                  _context23.next = 32;
                  return walletFull.getPrimaryAddress();

                case 32:
                  _context23.t5 = _context23.sent;

                  _context23.t3.equal.call(_context23.t3, _context23.t4, _context23.t5);

                  _context23.t6 = _assert["default"];
                  _context23.t7 = balance.toString();
                  _context23.next = 38;
                  return walletFull.getBalance();

                case 38:
                  _context23.t8 = _context23.sent.toString();

                  _context23.t6.equal.call(_context23.t6, _context23.t7, _context23.t8);

                  _context23.t9 = _assert["default"];
                  _context23.t10 = outputsHex.length;
                  _context23.next = 44;
                  return walletFull.exportOutputs();

                case 44:
                  _context23.t11 = _context23.sent.length;

                  _context23.t9.equal.call(_context23.t9, _context23.t10, _context23.t11);

                  _context23.next = 48;
                  return walletFull.close(true);

                case 48:
                  // create full wallet
                  walletName = _index.GenUtils.getUUID();
                  path = _TestUtils["default"].WALLET_RPC_LOCAL_WALLET_DIR + "/" + walletName;
                  _context23.next = 52;
                  return createWalletFull(new _index.MoneroWalletConfig().setPath(path).setPassword(_TestUtils["default"].WALLET_PASSWORD).setNetworkType(_TestUtils["default"].NETWORK_TYPE).setMnemonic(_TestUtils["default"].MNEMONIC).setRestoreHeight(_TestUtils["default"].FIRST_RECEIVE_HEIGHT).setServer(_TestUtils["default"].DAEMON_RPC_CONFIG));

                case 52:
                  walletFull = _context23.sent;
                  _context23.next = 55;
                  return walletFull.sync();

                case 55:
                  _context23.next = 57;
                  return walletFull.getBalance();

                case 57:
                  balance = _context23.sent;
                  _context23.next = 60;
                  return walletFull.exportOutputs();

                case 60:
                  outputsHex = _context23.sent;
                  _context23.next = 63;
                  return walletFull.close(true);

                case 63:
                  // rebuild wallet cache using full wallet
                  _TestUtils["default"].getDefaultFs().unlinkSync(path);

                  _context23.next = 66;
                  return openWalletFull(new _index.MoneroWalletConfig().setPath(path).setPassword(_TestUtils["default"].WALLET_PASSWORD).setNetworkType(_TestUtils["default"].NETWORK_TYPE).setServer(_TestUtils["default"].DAEMON_RPC_CONFIG));

                case 66:
                  walletFull = _context23.sent;
                  _context23.next = 69;
                  return walletFull.close(true);

                case 69:
                  _context23.next = 71;
                  return walletRpc.openWallet(new _index.MoneroWalletConfig().setPath(walletName).setPassword(_TestUtils["default"].WALLET_PASSWORD));

                case 71:
                  _context23.next = 73;
                  return walletRpc.sync();

                case 73:
                  _context23.t12 = _assert["default"];
                  _context23.t13 = _TestUtils["default"].MNEMONIC;
                  _context23.next = 77;
                  return walletRpc.getMnemonic();

                case 77:
                  _context23.t14 = _context23.sent;

                  _context23.t12.equal.call(_context23.t12, _context23.t13, _context23.t14);

                  _context23.t15 = _assert["default"];
                  _context23.t16 = TestUtilsADDRESS;
                  _context23.next = 83;
                  return walletRpc.getPrimaryAddress();

                case 83:
                  _context23.t17 = _context23.sent;

                  _context23.t15.equal.call(_context23.t15, _context23.t16, _context23.t17);

                  _context23.t18 = _assert["default"];
                  _context23.t19 = balance.toString();
                  _context23.next = 89;
                  return walletRpc.getBalance();

                case 89:
                  _context23.t20 = _context23.sent.toString();

                  _context23.t18.equal.call(_context23.t18, _context23.t19, _context23.t20);

                  _context23.t21 = _assert["default"];
                  _context23.t22 = outputsHex.length;
                  _context23.next = 95;
                  return walletRpc.exportOutputs();

                case 95:
                  _context23.t23 = _context23.sent.length;

                  _context23.t21.equal.call(_context23.t21, _context23.t22, _context23.t23);

                  _context23.next = 99;
                  return walletRpc.close(true);

                case 99:
                case "end":
                  return _context23.stop();
              }
            }
          }, _callee23);
        })));
        if (!testConfig.liteMode && (testConfig.testNonRelays || testConfig.testRelays)) it("Is compatible with monero-wallet-rpc outputs and offline transaction signing", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee24() {
          var viewOnlyWallet, offlineWallet, err;
          return _regenerator["default"].wrap(function _callee24$(_context24) {
            while (1) {
              switch (_context24.prev = _context24.next) {
                case 0:
                  _context24.next = 2;
                  return _TestUtils["default"].startWalletRpcProcess();

                case 2:
                  viewOnlyWallet = _context24.sent;
                  _context24.t0 = viewOnlyWallet;
                  _context24.t1 = _index.GenUtils.getUUID();
                  _context24.t2 = _TestUtils["default"].WALLET_PASSWORD;
                  _context24.next = 8;
                  return that.wallet.getPrimaryAddress();

                case 8:
                  _context24.t3 = _context24.sent;
                  _context24.next = 11;
                  return that.wallet.getPrivateViewKey();

                case 11:
                  _context24.t4 = _context24.sent;
                  _context24.t5 = _TestUtils["default"].FIRST_RECEIVE_HEIGHT;
                  _context24.t6 = {
                    path: _context24.t1,
                    password: _context24.t2,
                    primaryAddress: _context24.t3,
                    privateViewKey: _context24.t4,
                    restoreHeight: _context24.t5
                  };
                  _context24.next = 16;
                  return _context24.t0.createWallet.call(_context24.t0, _context24.t6);

                case 16:
                  _context24.next = 18;
                  return viewOnlyWallet.sync();

                case 18:
                  _context24.t7 = that;
                  _context24.next = 21;
                  return that.wallet.getPrimaryAddress();

                case 21:
                  _context24.t8 = _context24.sent;
                  _context24.next = 24;
                  return that.wallet.getPrivateViewKey();

                case 24:
                  _context24.t9 = _context24.sent;
                  _context24.next = 27;
                  return that.wallet.getPrivateSpendKey();

                case 27:
                  _context24.t10 = _context24.sent;
                  _context24.t11 = _TestUtils["default"].OFFLINE_SERVER_URI;
                  _context24.t12 = {
                    primaryAddress: _context24.t8,
                    privateViewKey: _context24.t9,
                    privateSpendKey: _context24.t10,
                    serverUri: _context24.t11,
                    restoreHeight: 0
                  };
                  _context24.next = 32;
                  return _context24.t7.createWallet.call(_context24.t7, _context24.t12);

                case 32:
                  offlineWallet = _context24.sent;
                  _context24.prev = 33;
                  _context24.next = 36;
                  return that._testViewOnlyAndOfflineWallets(viewOnlyWallet, offlineWallet);

                case 36:
                  _context24.next = 41;
                  break;

                case 38:
                  _context24.prev = 38;
                  _context24.t13 = _context24["catch"](33);
                  err = _context24.t13;

                case 41:
                  // finally
                  _TestUtils["default"].stopWalletRpcProcess(viewOnlyWallet);

                  _context24.next = 44;
                  return that.closeWallet(offlineWallet);

                case 44:
                  if (!err) {
                    _context24.next = 46;
                    break;
                  }

                  throw err;

                case 46:
                case "end":
                  return _context24.stop();
              }
            }
          }, _callee24, null, [[33, 38]]);
        })));
        if (!testConfig.liteMode) it("Is compatible with monero-wallet-rpc multisig wallets", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee25() {
          var participants, err;
          return _regenerator["default"].wrap(function _callee25$(_context25) {
            while (1) {
              switch (_context25.prev = _context25.next) {
                case 0:
                  // create participants with monero-wallet-rpc and full wallet
                  participants = [];
                  _context25.t0 = participants;
                  _context25.next = 4;
                  return _TestUtils["default"].startWalletRpcProcess();

                case 4:
                  _context25.next = 6;
                  return _context25.sent.createWallet(new _index.MoneroWalletConfig().setPath(_index.GenUtils.getUUID()).setPassword(_TestUtils["default"].WALLET_PASSWORD));

                case 6:
                  _context25.t1 = _context25.sent;

                  _context25.t0.push.call(_context25.t0, _context25.t1);

                  _context25.t2 = participants;
                  _context25.next = 11;
                  return _TestUtils["default"].startWalletRpcProcess();

                case 11:
                  _context25.next = 13;
                  return _context25.sent.createWallet(new _index.MoneroWalletConfig().setPath(_index.GenUtils.getUUID()).setPassword(_TestUtils["default"].WALLET_PASSWORD));

                case 13:
                  _context25.t3 = _context25.sent;

                  _context25.t2.push.call(_context25.t2, _context25.t3);

                  _context25.t4 = participants;
                  _context25.next = 18;
                  return that.createWallet(new _index.MoneroWalletConfig());

                case 18:
                  _context25.t5 = _context25.sent;

                  _context25.t4.push.call(_context25.t4, _context25.t5);

                  _context25.prev = 20;
                  _context25.next = 23;
                  return that._testMultisigParticipants(participants, 3, 3, true);

                case 23:
                  _context25.next = 28;
                  break;

                case 25:
                  _context25.prev = 25;
                  _context25.t6 = _context25["catch"](20);
                  err = _context25.t6;

                case 28:
                  _context25.prev = 28;
                  _context25.next = 31;
                  return that.daemon.stopMining();

                case 31:
                  _context25.next = 35;
                  break;

                case 33:
                  _context25.prev = 33;
                  _context25.t7 = _context25["catch"](28);

                case 35:
                  _context25.next = 37;
                  return _TestUtils["default"].stopWalletRpcProcess(participants[0]);

                case 37:
                  _context25.next = 39;
                  return _TestUtils["default"].stopWalletRpcProcess(participants[1]);

                case 39:
                  _context25.next = 41;
                  return that.closeWallet(participants[2], true);

                case 41:
                  if (!err) {
                    _context25.next = 43;
                    break;
                  }

                  throw err;

                case 43:
                case "end":
                  return _context25.stop();
              }
            }
          }, _callee25, null, [[20, 25], [28, 33]]);
        }))); // TODO monero-project: cannot re-sync from lower block height after wallet saved

        if (testConfig.testNonRelays && !testConfig.liteMode && false) it("Can re-sync an existing wallet from scratch", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee26() {
          var wallet, startHeight, progressTester, result;
          return _regenerator["default"].wrap(function _callee26$(_context26) {
            while (1) {
              switch (_context26.prev = _context26.next) {
                case 0:
                  _context26.next = 2;
                  return that.openWallet({
                    path: _TestUtils["default"].WALLET_FULL_PATH,
                    password: _TestUtils["default"].WALLET_PASSWORD,
                    networkType: _index.MoneroNetworkType.TESTNET,
                    serverUri: _TestUtils["default"].OFFLINE_SERVER_URI
                  }, true);

                case 2:
                  wallet = _context26.sent;
                  _context26.next = 5;
                  return wallet.setDaemonConnection(_TestUtils["default"].getDaemonRpcConnection());

                case 5:
                  //long startHeight = TestUtils.TEST_RESTORE_HEIGHT;
                  startHeight = 0;
                  _context26.t0 = SyncProgressTester;
                  _context26.t1 = wallet;
                  _context26.t2 = startHeight;
                  _context26.next = 11;
                  return wallet.getDaemonHeight();

                case 11:
                  _context26.t3 = _context26.sent;
                  progressTester = new _context26.t0(_context26.t1, _context26.t2, _context26.t3);
                  _context26.next = 15;
                  return wallet.setSyncHeight(1);

                case 15:
                  _context26.next = 17;
                  return wallet.sync(progressTester, 1);

                case 17:
                  result = _context26.sent;
                  _context26.t4 = progressTester;
                  _context26.next = 21;
                  return wallet.getDaemonHeight();

                case 21:
                  _context26.t5 = _context26.sent;
                  _context26.next = 24;
                  return _context26.t4.onDone.call(_context26.t4, _context26.t5);

                case 24:
                  _context26.t6 = _assert["default"];
                  _context26.next = 27;
                  return wallet.isConnectedToDaemon();

                case 27:
                  _context26.t7 = _context26.sent;
                  (0, _context26.t6)(_context26.t7);
                  _context26.t8 = _assert["default"];
                  _context26.next = 32;
                  return wallet.isSynced();

                case 32:
                  _context26.t9 = _context26.sent;
                  (0, _context26.t8)(_context26.t9);
                  _context26.t10 = _assert["default"];
                  _context26.t11 = result.getNumBlocksFetched();
                  _context26.next = 38;
                  return wallet.getDaemonHeight();

                case 38:
                  _context26.t12 = _context26.sent;
                  _context26.t13 = startHeight;
                  _context26.t14 = _context26.t12 - _context26.t13;

                  _context26.t10.equal.call(_context26.t10, _context26.t11, _context26.t14);

                  (0, _assert["default"])(result.getReceivedMoney());
                  _context26.t15 = _assert["default"];
                  _context26.next = 46;
                  return wallet.getHeight();

                case 46:
                  _context26.t16 = _context26.sent;
                  _context26.next = 49;
                  return that.daemon.getHeight();

                case 49:
                  _context26.t17 = _context26.sent;

                  _context26.t15.equal.call(_context26.t15, _context26.t16, _context26.t17);

                  _context26.next = 53;
                  return wallet.close();

                case 53:
                case "end":
                  return _context26.stop();
              }
            }
          }, _callee26);
        })));
        if (testConfig.testNonRelays) it("Can sync a wallet with a randomly generated seed", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee27() {
          var restoreHeight, wallet, walletGt, err, progressTester, result;
          return _regenerator["default"].wrap(function _callee27$(_context27) {
            while (1) {
              switch (_context27.prev = _context27.next) {
                case 0:
                  _context27.t0 = _assert["default"];
                  _context27.next = 3;
                  return that.daemon.isConnected();

                case 3:
                  _context27.t1 = _context27.sent;
                  (0, _context27.t0)(_context27.t1, "Not connected to daemon");
                  _context27.next = 7;
                  return that.daemon.getHeight();

                case 7:
                  restoreHeight = _context27.sent;
                  _context27.next = 10;
                  return that.createWallet({}, false);

                case 10:
                  wallet = _context27.sent;
                  _context27.prev = 11;
                  _context27.t2 = _assert["default"];
                  _context27.next = 15;
                  return wallet.getDaemonConnection();

                case 15:
                  _context27.t3 = _context27.sent.getUri();
                  _context27.next = 18;
                  return that.daemon.getRpcConnection();

                case 18:
                  _context27.t4 = _context27.sent.getUri();

                  _context27.t2.equal.call(_context27.t2, _context27.t3, _context27.t4);

                  _context27.t5 = _assert["default"];
                  _context27.next = 23;
                  return wallet.getDaemonConnection();

                case 23:
                  _context27.t6 = _context27.sent.getUsername();
                  _context27.next = 26;
                  return that.daemon.getRpcConnection();

                case 26:
                  _context27.t7 = _context27.sent.getUsername();

                  _context27.t5.equal.call(_context27.t5, _context27.t6, _context27.t7);

                  _context27.t8 = _assert["default"];
                  _context27.next = 31;
                  return wallet.getDaemonConnection();

                case 31:
                  _context27.t9 = _context27.sent.getPassword();
                  _context27.next = 34;
                  return that.daemon.getRpcConnection();

                case 34:
                  _context27.t10 = _context27.sent.getPassword();

                  _context27.t8.equal.call(_context27.t8, _context27.t9, _context27.t10);

                  _context27.t11 = _assert["default"];
                  _context27.next = 39;
                  return wallet.getDaemonHeight();

                case 39:
                  _context27.t12 = _context27.sent;
                  _context27.t13 = restoreHeight;

                  _context27.t11.equal.call(_context27.t11, _context27.t12, _context27.t13);

                  _context27.t14 = _assert["default"];
                  _context27.next = 45;
                  return wallet.isConnectedToDaemon();

                case 45:
                  _context27.t15 = _context27.sent;
                  (0, _context27.t14)(_context27.t15);
                  _context27.t16 = _assert["default"];
                  _context27.next = 50;
                  return wallet.isSynced();

                case 50:
                  _context27.t17 = !_context27.sent;
                  (0, _context27.t16)(_context27.t17);
                  _context27.t18 = _assert["default"];
                  _context27.next = 55;
                  return wallet.getHeight();

                case 55:
                  _context27.t19 = _context27.sent;

                  _context27.t18.equal.call(_context27.t18, _context27.t19, 1);

                  _context27.t20 = _assert["default"];
                  _context27.next = 60;
                  return wallet.getSyncHeight();

                case 60:
                  _context27.t21 = _context27.sent;
                  _context27.t22 = restoreHeight;

                  _context27.t20.equal.call(_context27.t20, _context27.t21, _context27.t22);

                  _context27.t23 = SyncProgressTester;
                  _context27.t24 = wallet;
                  _context27.next = 67;
                  return wallet.getSyncHeight();

                case 67:
                  _context27.t25 = _context27.sent;
                  _context27.next = 70;
                  return wallet.getDaemonHeight();

                case 70:
                  _context27.t26 = _context27.sent;
                  progressTester = new _context27.t23(_context27.t24, _context27.t25, _context27.t26);
                  _context27.next = 74;
                  return wallet.sync(progressTester, undefined);

                case 74:
                  result = _context27.sent;
                  _context27.t27 = progressTester;
                  _context27.next = 78;
                  return wallet.getDaemonHeight();

                case 78:
                  _context27.t28 = _context27.sent;
                  _context27.next = 81;
                  return _context27.t27.onDone.call(_context27.t27, _context27.t28);

                case 81:
                  _context27.t29 = that;
                  _context27.next = 84;
                  return wallet.getMnemonic();

                case 84:
                  _context27.t30 = _context27.sent;
                  _context27.t31 = restoreHeight;
                  _context27.t32 = {
                    mnemonic: _context27.t30,
                    restoreHeight: _context27.t31
                  };
                  _context27.next = 89;
                  return _context27.t29.createWallet.call(_context27.t29, _context27.t32);

                case 89:
                  walletGt = _context27.sent;
                  _context27.next = 92;
                  return walletGt.sync();

                case 92:
                  _context27.t33 = _assert["default"];
                  _context27.next = 95;
                  return wallet.isConnectedToDaemon();

                case 95:
                  _context27.t34 = _context27.sent;
                  (0, _context27.t33)(_context27.t34);
                  _context27.t35 = _assert["default"];
                  _context27.next = 100;
                  return wallet.isSynced();

                case 100:
                  _context27.t36 = _context27.sent;
                  (0, _context27.t35)(_context27.t36);

                  _assert["default"].equal(result.getNumBlocksFetched(), 0);

                  (0, _assert["default"])(!result.getReceivedMoney());
                  _context27.next = 106;
                  return wallet.getHeight();

                case 106:
                  _context27.t37 = _context27.sent;
                  _context27.next = 109;
                  return that.daemon.getHeight();

                case 109:
                  _context27.t38 = _context27.sent;

                  if (!(_context27.t37 !== _context27.t38)) {
                    _context27.next = 122;
                    break;
                  }

                  _context27.t39 = console;
                  _context27.next = 114;
                  return wallet.getHeight();

                case 114:
                  _context27.t40 = _context27.sent;
                  _context27.t41 = "WARNING: wallet height " + _context27.t40;
                  _context27.t42 = _context27.t41 + " is not synced with daemon height ";
                  _context27.next = 119;
                  return that.daemon.getHeight();

                case 119:
                  _context27.t43 = _context27.sent;
                  _context27.t44 = _context27.t42 + _context27.t43;

                  _context27.t39.log.call(_context27.t39, _context27.t44);

                case 122:
                  _context27.next = 124;
                  return wallet.sync();

                case 124:
                  _context27.t45 = _assert["default"];
                  _context27.next = 127;
                  return wallet.isSynced();

                case 127:
                  _context27.t46 = _context27.sent;
                  (0, _context27.t45)(_context27.t46);
                  _context27.t47 = _assert["default"];
                  _context27.next = 132;
                  return wallet.getHeight();

                case 132:
                  _context27.t48 = _context27.sent;
                  _context27.next = 135;
                  return that.daemon.getHeight();

                case 135:
                  _context27.t49 = _context27.sent;

                  _context27.t47.equal.call(_context27.t47, _context27.t48, _context27.t49);

                  _context27.next = 139;
                  return TestMoneroWalletFull._testWalletEqualityOnChain(walletGt, wallet);

                case 139:
                  _context27.next = 144;
                  break;

                case 141:
                  _context27.prev = 141;
                  _context27.t50 = _context27["catch"](11);
                  err = _context27.t50;

                case 144:
                  if (!walletGt) {
                    _context27.next = 147;
                    break;
                  }

                  _context27.next = 147;
                  return walletGt.close();

                case 147:
                  _context27.next = 149;
                  return wallet.close();

                case 149:
                  if (!err) {
                    _context27.next = 151;
                    break;
                  }

                  throw err;

                case 151:
                  _context27.next = 153;
                  return that.createWallet({
                    serverUri: _TestUtils["default"].OFFLINE_SERVER_URI
                  });

                case 153:
                  wallet = _context27.sent;
                  err = undefined;
                  _context27.prev = 155;
                  _context27.next = 158;
                  return wallet.sync();

                case 158:
                  throw new Error("Should have thrown exception");

                case 161:
                  _context27.prev = 161;
                  _context27.t51 = _context27["catch"](155);

                  try {
                    _assert["default"].equal(_context27.t51.message, "Wallet is not connected to daemon");
                  } catch (e2) {
                    err = e2;
                  }

                case 164:
                  _context27.next = 166;
                  return wallet.close();

                case 166:
                  if (!err) {
                    _context27.next = 168;
                    break;
                  }

                  throw err;

                case 168:
                case "end":
                  return _context27.stop();
              }
            }
          }, _callee27, null, [[11, 141], [155, 161]]);
        })));
        if (false && testConfig.testNonRelays && !testConfig.liteMode) // TODO: re-enable before release
          it("Can sync a wallet created from mnemonic from the genesis", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee28() {
            return _regenerator["default"].wrap(function _callee28$(_context28) {
              while (1) {
                switch (_context28.prev = _context28.next) {
                  case 0:
                    _context28.next = 2;
                    return _testSyncMnemonic(undefined, undefined, true, false);

                  case 2:
                  case "end":
                    return _context28.stop();
                }
              }
            }, _callee28);
          })));
        if (testConfig.testNonRelays) it("Can sync a wallet created from mnemonic from a restore height", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee29() {
          return _regenerator["default"].wrap(function _callee29$(_context29) {
            while (1) {
              switch (_context29.prev = _context29.next) {
                case 0:
                  _context29.next = 2;
                  return _testSyncMnemonic(undefined, _TestUtils["default"].FIRST_RECEIVE_HEIGHT);

                case 2:
                case "end":
                  return _context29.stop();
              }
            }
          }, _callee29);
        })));
        if (testConfig.testNonRelays && !testConfig.liteMode) it("Can sync a wallet created from mnemonic from a start height.", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee30() {
          return _regenerator["default"].wrap(function _callee30$(_context30) {
            while (1) {
              switch (_context30.prev = _context30.next) {
                case 0:
                  _context30.next = 2;
                  return _testSyncMnemonic(_TestUtils["default"].FIRST_RECEIVE_HEIGHT, undefined, false, true);

                case 2:
                case "end":
                  return _context30.stop();
              }
            }
          }, _callee30);
        })));
        if (testConfig.testNonRelays && !testConfig.liteMode) it("Can sync a wallet created from mnemonic from a start height less than the restore height", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee31() {
          return _regenerator["default"].wrap(function _callee31$(_context31) {
            while (1) {
              switch (_context31.prev = _context31.next) {
                case 0:
                  _context31.next = 2;
                  return _testSyncMnemonic(_TestUtils["default"].FIRST_RECEIVE_HEIGHT, _TestUtils["default"].FIRST_RECEIVE_HEIGHT + 3);

                case 2:
                case "end":
                  return _context31.stop();
              }
            }
          }, _callee31);
        })));
        if (testConfig.testNonRelays && !testConfig.liteMode) it("Can sync a wallet created from mnemonic from a start height greater than the restore height", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee32() {
          return _regenerator["default"].wrap(function _callee32$(_context32) {
            while (1) {
              switch (_context32.prev = _context32.next) {
                case 0:
                  _context32.next = 2;
                  return _testSyncMnemonic(_TestUtils["default"].FIRST_RECEIVE_HEIGHT + 3, _TestUtils["default"].FIRST_RECEIVE_HEIGHT);

                case 2:
                case "end":
                  return _context32.stop();
              }
            }
          }, _callee32);
        })));

        function _testSyncMnemonic(_x10, _x11, _x12, _x13) {
          return _testSyncMnemonic2.apply(this, arguments);
        }

        function _testSyncMnemonic2() {
          _testSyncMnemonic2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee42(startHeight, restoreHeight, skipGtComparison, testPostSyncNotifications) {
            var wallet, startHeightExpected, endHeightExpected, walletGt, err, walletSyncTester, progressTester, result, startedMining, miningStatus;
            return _regenerator["default"].wrap(function _callee42$(_context42) {
              while (1) {
                switch (_context42.prev = _context42.next) {
                  case 0:
                    _context42.t0 = _assert["default"];
                    _context42.next = 3;
                    return that.daemon.isConnected();

                  case 3:
                    _context42.t1 = _context42.sent;
                    (0, _context42.t0)(_context42.t1, "Not connected to daemon");
                    if (startHeight !== undefined && restoreHeight != undefined) (0, _assert["default"])(startHeight <= _TestUtils["default"].FIRST_RECEIVE_HEIGHT || restoreHeight <= _TestUtils["default"].FIRST_RECEIVE_HEIGHT); // create wallet from mnemonic

                    _context42.next = 8;
                    return that.createWallet({
                      mnemonic: _TestUtils["default"].MNEMONIC,
                      restoreHeight: restoreHeight
                    }, false);

                  case 8:
                    wallet = _context42.sent;
                    // sanitize expected sync bounds
                    if (restoreHeight === undefined) restoreHeight = 0;
                    startHeightExpected = startHeight === undefined ? restoreHeight : startHeight;
                    if (startHeightExpected === 0) startHeightExpected = 1;
                    _context42.next = 14;
                    return wallet.getDaemonMaxPeerHeight();

                  case 14:
                    endHeightExpected = _context42.sent;
                    // test wallet and close as final step
                    walletGt = undefined;
                    err = undefined; // to permit final cleanup like Java's try...catch...finally

                    _context42.prev = 17;
                    _context42.t2 = _assert["default"];
                    _context42.next = 21;
                    return wallet.isConnectedToDaemon();

                  case 21:
                    _context42.t3 = _context42.sent;
                    (0, _context42.t2)(_context42.t3);
                    _context42.t4 = _assert["default"];
                    _context42.next = 26;
                    return wallet.isSynced();

                  case 26:
                    _context42.t5 = !_context42.sent;
                    (0, _context42.t4)(_context42.t5);
                    _context42.t6 = _assert["default"];
                    _context42.next = 31;
                    return wallet.getHeight();

                  case 31:
                    _context42.t7 = _context42.sent;

                    _context42.t6.equal.call(_context42.t6, _context42.t7, 1);

                    _context42.t8 = _assert["default"];
                    _context42.next = 36;
                    return wallet.getSyncHeight();

                  case 36:
                    _context42.t9 = _context42.sent;
                    _context42.t10 = restoreHeight;

                    _context42.t8.equal.call(_context42.t8, _context42.t9, _context42.t10);

                    // register a wallet listener which tests notifications throughout the sync
                    walletSyncTester = new WalletSyncTester(wallet, startHeightExpected, endHeightExpected);
                    _context42.next = 42;
                    return wallet;

                  case 42:
                    _context42.t11 = _context42.sent;
                    _context42.t12 = Listener(walletSyncTester);
                    _context42.t11 + _context42.t12;
                    // sync the wallet with a listener which tests sync notifications
                    progressTester = new SyncProgressTester(wallet, startHeightExpected, endHeightExpected);
                    _context42.next = 48;
                    return wallet.sync(progressTester, startHeight);

                  case 48:
                    result = _context42.sent;
                    _context42.t13 = progressTester;
                    _context42.next = 52;
                    return wallet.getDaemonHeight();

                  case 52:
                    _context42.t14 = _context42.sent;
                    _context42.next = 55;
                    return _context42.t13.onDone.call(_context42.t13, _context42.t14);

                  case 55:
                    _context42.t15 = walletSyncTester;
                    _context42.next = 58;
                    return wallet.getDaemonHeight();

                  case 58:
                    _context42.t16 = _context42.sent;
                    _context42.next = 61;
                    return _context42.t15.onDone.call(_context42.t15, _context42.t16);

                  case 61:
                    _context42.t17 = _assert["default"];
                    _context42.next = 64;
                    return wallet.isSynced();

                  case 64:
                    _context42.t18 = _context42.sent;
                    (0, _context42.t17)(_context42.t18);
                    _context42.t19 = _assert["default"];
                    _context42.t20 = result.getNumBlocksFetched();
                    _context42.next = 70;
                    return wallet.getDaemonHeight();

                  case 70:
                    _context42.t21 = _context42.sent;
                    _context42.t22 = startHeightExpected;
                    _context42.t23 = _context42.t21 - _context42.t22;

                    _context42.t19.equal.call(_context42.t19, _context42.t20, _context42.t23);

                    (0, _assert["default"])(result.getReceivedMoney());
                    _context42.next = 77;
                    return wallet.getHeight();

                  case 77:
                    _context42.t24 = _context42.sent;
                    _context42.next = 80;
                    return that.daemon.getHeight();

                  case 80:
                    _context42.t25 = _context42.sent;

                    if (!(_context42.t24 !== _context42.t25)) {
                      _context42.next = 93;
                      break;
                    }

                    _context42.t26 = console;
                    _context42.next = 85;
                    return wallet.getHeight();

                  case 85:
                    _context42.t27 = _context42.sent;
                    _context42.t28 = "WARNING: wallet height " + _context42.t27;
                    _context42.t29 = _context42.t28 + " is not synced with daemon height ";
                    _context42.next = 90;
                    return that.daemon.getHeight();

                  case 90:
                    _context42.t30 = _context42.sent;
                    _context42.t31 = _context42.t29 + _context42.t30;

                    _context42.t26.log.call(_context42.t26, _context42.t31);

                  case 93:
                    _context42.t32 = _assert["default"];
                    _context42.next = 96;
                    return wallet.getDaemonHeight();

                  case 96:
                    _context42.t33 = _context42.sent;
                    _context42.next = 99;
                    return that.daemon.getHeight();

                  case 99:
                    _context42.t34 = _context42.sent;
                    _context42.next = 102;
                    return wallet.getDaemonHeight();

                  case 102:
                    _context42.t35 = _context42.sent;
                    _context42.t36 = "Daemon heights are not equal: " + _context42.t35;
                    _context42.t37 = _context42.t36 + " vs ";
                    _context42.next = 107;
                    return that.daemon.getHeight();

                  case 107:
                    _context42.t38 = _context42.sent;
                    _context42.t39 = _context42.t37 + _context42.t38;

                    _context42.t32.equal.call(_context42.t32, _context42.t33, _context42.t34, _context42.t39);

                    if (!(startHeightExpected > _TestUtils["default"].FIRST_RECEIVE_HEIGHT)) {
                      _context42.next = 120;
                      break;
                    }

                    _context42.t40 = _assert["default"];
                    _context42.next = 114;
                    return wallet.getTxs();

                  case 114:
                    _context42.t41 = _context42.sent[0].getHeight();
                    _context42.t42 = _TestUtils["default"].FIRST_RECEIVE_HEIGHT;
                    _context42.t43 = _context42.t41 > _context42.t42;
                    (0, _context42.t40)(_context42.t43);
                    _context42.next = 126;
                    break;

                  case 120:
                    _context42.t44 = _assert["default"];
                    _context42.next = 123;
                    return wallet.getTxs();

                  case 123:
                    _context42.t45 = _context42.sent[0].getHeight();
                    _context42.t46 = _TestUtils["default"].FIRST_RECEIVE_HEIGHT;

                    _context42.t44.equal.call(_context42.t44, _context42.t45, _context42.t46);

                  case 126:
                    _context42.next = 128;
                    return wallet.sync();

                  case 128:
                    result = _context42.sent;
                    _context42.t47 = _assert["default"];
                    _context42.next = 132;
                    return wallet.isSynced();

                  case 132:
                    _context42.t48 = _context42.sent;
                    (0, _context42.t47)(_context42.t48);
                    _context42.next = 136;
                    return wallet.getHeight();

                  case 136:
                    _context42.t49 = _context42.sent;
                    _context42.next = 139;
                    return that.daemon.getHeight();

                  case 139:
                    _context42.t50 = _context42.sent;

                    if (!(_context42.t49 !== _context42.t50)) {
                      _context42.next = 153;
                      break;
                    }

                    _context42.t51 = console;
                    _context42.next = 144;
                    return wallet.getHeight();

                  case 144:
                    _context42.t52 = _context42.sent;
                    _context42.t53 = "WARNING: wallet height " + _context42.t52;
                    _context42.t54 = _context42.t53 + " is not synced with daemon height ";
                    _context42.next = 149;
                    return that.daemon.getHeight();

                  case 149:
                    _context42.t55 = _context42.sent;
                    _context42.t56 = _context42.t54 + _context42.t55;
                    _context42.t57 = _context42.t56 + " after re-syncing";

                    _context42.t51.log.call(_context42.t51, _context42.t57);

                  case 153:
                    _assert["default"].equal(result.getNumBlocksFetched(), 0);

                    (0, _assert["default"])(!result.getReceivedMoney()); // compare with ground truth

                    if (skipGtComparison) {
                      _context42.next = 163;
                      break;
                    }

                    _context42.next = 158;
                    return that.createWallet({
                      mnemonic: _TestUtils["default"].MNEMONIC,
                      restoreHeight: startHeightExpected
                    });

                  case 158:
                    walletGt = _context42.sent;
                    _context42.next = 161;
                    return walletGt.sync();

                  case 161:
                    _context42.next = 163;
                    return TestMoneroWalletFull._testWalletEqualityOnChain(walletGt, wallet);

                  case 163:
                    if (!testPostSyncNotifications) {
                      _context42.next = 197;
                      break;
                    }

                    _context42.next = 166;
                    return wallet.startSyncing(_TestUtils["default"].SYNC_PERIOD_IN_MS);

                  case 166:
                    // attempt to start mining to push the network along  // TODO: TestUtils.tryStartMining() : reqId, TestUtils.tryStopMining(reqId)
                    startedMining = false;
                    _context42.next = 169;
                    return that.daemon.getMiningStatus();

                  case 169:
                    miningStatus = _context42.sent;

                    if (miningStatus.isActive()) {
                      _context42.next = 179;
                      break;
                    }

                    _context42.prev = 171;
                    _context42.next = 174;
                    return _StartMining["default"].startMining();

                  case 174:
                    startedMining = true;
                    _context42.next = 179;
                    break;

                  case 177:
                    _context42.prev = 177;
                    _context42.t58 = _context42["catch"](171);

                  case 179:
                    _context42.prev = 179;
                    // wait for block
                    console.log("Waiting for next block to test post sync notifications");
                    _context42.next = 183;
                    return that.daemon.waitForNextBlockHeader();

                  case 183:
                    _context42.next = 185;
                    return new Promise(function (resolve) {
                      setTimeout(resolve, _TestUtils["default"].SYNC_PERIOD_IN_MS + 3000);
                    });

                  case 185:
                    // sleep for wallet interval + time to sync
                    // test that wallet listener's onSyncProgress() and onNewBlock() were invoked after previous completion
                    (0, _assert["default"])(walletSyncTester.getOnSyncProgressAfterDone());
                    (0, _assert["default"])(walletSyncTester.getOnNewBlockAfterDone());
                    _context42.next = 192;
                    break;

                  case 189:
                    _context42.prev = 189;
                    _context42.t59 = _context42["catch"](179);
                    err = _context42.t59;

                  case 192:
                    if (!startedMining) {
                      _context42.next = 195;
                      break;
                    }

                    _context42.next = 195;
                    return that.daemon.stopMining();

                  case 195:
                    if (!err) {
                      _context42.next = 197;
                      break;
                    }

                    throw err;

                  case 197:
                    _context42.next = 202;
                    break;

                  case 199:
                    _context42.prev = 199;
                    _context42.t60 = _context42["catch"](17);
                    err = _context42.t60;

                  case 202:
                    if (!(walletGt !== undefined)) {
                      _context42.next = 205;
                      break;
                    }

                    _context42.next = 205;
                    return walletGt.close(true);

                  case 205:
                    _context42.next = 207;
                    return wallet.close();

                  case 207:
                    if (!err) {
                      _context42.next = 209;
                      break;
                    }

                    throw err;

                  case 209:
                  case "end":
                    return _context42.stop();
                }
              }
            }, _callee42, null, [[17, 199], [171, 177], [179, 189]]);
          }));
          return _testSyncMnemonic2.apply(this, arguments);
        }

        if (testConfig.testNonRelays) it("Can sync a wallet created from keys", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee33() {
          var walletKeys, walletGt, err, progressTester, result;
          return _regenerator["default"].wrap(function _callee33$(_context33) {
            while (1) {
              switch (_context33.prev = _context33.next) {
                case 0:
                  _context33.t0 = that;
                  _context33.next = 3;
                  return that.wallet.getPrimaryAddress();

                case 3:
                  _context33.t1 = _context33.sent;
                  _context33.next = 6;
                  return that.wallet.getPrivateViewKey();

                case 6:
                  _context33.t2 = _context33.sent;
                  _context33.next = 9;
                  return that.wallet.getPrivateSpendKey();

                case 9:
                  _context33.t3 = _context33.sent;
                  _context33.t4 = _TestUtils["default"].FIRST_RECEIVE_HEIGHT;
                  _context33.t5 = {
                    primaryAddress: _context33.t1,
                    privateViewKey: _context33.t2,
                    privateSpendKey: _context33.t3,
                    restoreHeight: _context33.t4
                  };
                  _context33.next = 14;
                  return _context33.t0.createWallet.call(_context33.t0, _context33.t5, false);

                case 14:
                  walletKeys = _context33.sent;
                  _context33.next = 17;
                  return that.getWalletGt();

                case 17:
                  walletGt = _context33.sent;
                  _context33.prev = 18;
                  _context33.t6 = _assert["default"];
                  _context33.next = 22;
                  return walletKeys.getMnemonic();

                case 22:
                  _context33.t7 = _context33.sent;
                  _context33.next = 25;
                  return walletGt.getMnemonic();

                case 25:
                  _context33.t8 = _context33.sent;

                  _context33.t6.equal.call(_context33.t6, _context33.t7, _context33.t8);

                  _context33.t9 = _assert["default"];
                  _context33.next = 30;
                  return walletKeys.getPrimaryAddress();

                case 30:
                  _context33.t10 = _context33.sent;
                  _context33.next = 33;
                  return walletGt.getPrimaryAddress();

                case 33:
                  _context33.t11 = _context33.sent;

                  _context33.t9.equal.call(_context33.t9, _context33.t10, _context33.t11);

                  _context33.t12 = _assert["default"];
                  _context33.next = 38;
                  return walletKeys.getPrivateViewKey();

                case 38:
                  _context33.t13 = _context33.sent;
                  _context33.next = 41;
                  return walletGt.getPrivateViewKey();

                case 41:
                  _context33.t14 = _context33.sent;

                  _context33.t12.equal.call(_context33.t12, _context33.t13, _context33.t14);

                  _context33.t15 = _assert["default"];
                  _context33.next = 46;
                  return walletKeys.getPublicViewKey();

                case 46:
                  _context33.t16 = _context33.sent;
                  _context33.next = 49;
                  return walletGt.getPublicViewKey();

                case 49:
                  _context33.t17 = _context33.sent;

                  _context33.t15.equal.call(_context33.t15, _context33.t16, _context33.t17);

                  _context33.t18 = _assert["default"];
                  _context33.next = 54;
                  return walletKeys.getPrivateSpendKey();

                case 54:
                  _context33.t19 = _context33.sent;
                  _context33.next = 57;
                  return walletGt.getPrivateSpendKey();

                case 57:
                  _context33.t20 = _context33.sent;

                  _context33.t18.equal.call(_context33.t18, _context33.t19, _context33.t20);

                  _context33.t21 = _assert["default"];
                  _context33.next = 62;
                  return walletKeys.getPublicSpendKey();

                case 62:
                  _context33.t22 = _context33.sent;
                  _context33.next = 65;
                  return walletGt.getPublicSpendKey();

                case 65:
                  _context33.t23 = _context33.sent;

                  _context33.t21.equal.call(_context33.t21, _context33.t22, _context33.t23);

                  _context33.t24 = _assert["default"];
                  _context33.next = 70;
                  return walletKeys.getSyncHeight();

                case 70:
                  _context33.t25 = _context33.sent;
                  _context33.t26 = _TestUtils["default"].FIRST_RECEIVE_HEIGHT;

                  _context33.t24.equal.call(_context33.t24, _context33.t25, _context33.t26);

                  _context33.t27 = _assert["default"];
                  _context33.next = 76;
                  return walletKeys.isConnectedToDaemon();

                case 76:
                  _context33.t28 = _context33.sent;
                  (0, _context33.t27)(_context33.t28);
                  _context33.t29 = _assert["default"];
                  _context33.next = 81;
                  return walletKeys.isSynced();

                case 81:
                  _context33.t30 = !_context33.sent;
                  (0, _context33.t29)(_context33.t30);
                  _context33.t31 = SyncProgressTester;
                  _context33.t32 = walletKeys;
                  _context33.t33 = _TestUtils["default"].FIRST_RECEIVE_HEIGHT;
                  _context33.next = 88;
                  return walletKeys.getDaemonMaxPeerHeight();

                case 88:
                  _context33.t34 = _context33.sent;
                  progressTester = new _context33.t31(_context33.t32, _context33.t33, _context33.t34);
                  _context33.next = 92;
                  return walletKeys.sync(progressTester);

                case 92:
                  result = _context33.sent;
                  _context33.t35 = progressTester;
                  _context33.next = 96;
                  return walletKeys.getDaemonHeight();

                case 96:
                  _context33.t36 = _context33.sent;
                  _context33.next = 99;
                  return _context33.t35.onDone.call(_context33.t35, _context33.t36);

                case 99:
                  _context33.t37 = _assert["default"];
                  _context33.next = 102;
                  return walletKeys.isSynced();

                case 102:
                  _context33.t38 = _context33.sent;
                  (0, _context33.t37)(_context33.t38);
                  _context33.t39 = _assert["default"];
                  _context33.t40 = result.getNumBlocksFetched();
                  _context33.next = 108;
                  return walletKeys.getDaemonHeight();

                case 108:
                  _context33.t41 = _context33.sent;
                  _context33.t42 = _TestUtils["default"].FIRST_RECEIVE_HEIGHT;
                  _context33.t43 = _context33.t41 - _context33.t42;

                  _context33.t39.equal.call(_context33.t39, _context33.t40, _context33.t43);

                  (0, _assert["default"])(result.getReceivedMoney());
                  _context33.t44 = _assert["default"];
                  _context33.next = 116;
                  return walletKeys.getHeight();

                case 116:
                  _context33.t45 = _context33.sent;
                  _context33.next = 119;
                  return that.daemon.getHeight();

                case 119:
                  _context33.t46 = _context33.sent;

                  _context33.t44.equal.call(_context33.t44, _context33.t45, _context33.t46);

                  _context33.t47 = _assert["default"];
                  _context33.next = 124;
                  return walletKeys.getDaemonHeight();

                case 124:
                  _context33.t48 = _context33.sent;
                  _context33.next = 127;
                  return that.daemon.getHeight();

                case 127:
                  _context33.t49 = _context33.sent;

                  _context33.t47.equal.call(_context33.t47, _context33.t48, _context33.t49);

                  _context33.t50 = _assert["default"];
                  _context33.next = 132;
                  return walletKeys.getTxs();

                case 132:
                  _context33.t51 = _context33.sent[0].getHeight();
                  _context33.t52 = _TestUtils["default"].FIRST_RECEIVE_HEIGHT;

                  _context33.t50.equal.call(_context33.t50, _context33.t51, _context33.t52);

                  _context33.next = 137;
                  return TestMoneroWalletFull._testWalletEqualityOnChain(walletGt, walletKeys);

                case 137:
                  _context33.next = 142;
                  break;

                case 139:
                  _context33.prev = 139;
                  _context33.t53 = _context33["catch"](18);
                  err = _context33.t53;

                case 142:
                  _context33.next = 144;
                  return walletGt.close(true);

                case 144:
                  _context33.next = 146;
                  return walletKeys.close();

                case 146:
                  if (!err) {
                    _context33.next = 148;
                    break;
                  }

                  throw err;

                case 148:
                case "end":
                  return _context33.stop();
              }
            }
          }, _callee33, null, [[18, 139]]);
        }))); // TODO: test start syncing, notification of syncs happening, stop syncing, no notifications, etc

        if (testConfig.testNonRelays) it("Can start and stop syncing", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee34() {
          var err, path, wallet, chainHeight, restoreHeight;
          return _regenerator["default"].wrap(function _callee34$(_context34) {
            while (1) {
              switch (_context34.prev = _context34.next) {
                case 0:
                  // test unconnected wallet
                  // used to emulate Java's try...catch...finally
                  path = TestMoneroWalletFull._getRandomWalletPath();
                  _context34.next = 3;
                  return that.createWallet({
                    path: path,
                    password: _TestUtils["default"].WALLET_PASSWORD,
                    networkType: _TestUtils["default"].NETWORK_TYPE,
                    serverUri: _TestUtils["default"].OFFLINE_SERVER_URI
                  });

                case 3:
                  wallet = _context34.sent;
                  _context34.prev = 4;
                  _context34.t0 = _assert["default"];
                  _context34.next = 8;
                  return wallet.getMnemonic();

                case 8:
                  _context34.t1 = _context34.sent;
                  _context34.t2 = undefined;

                  _context34.t0.notEqual.call(_context34.t0, _context34.t1, _context34.t2);

                  _context34.t3 = _assert["default"];
                  _context34.next = 14;
                  return wallet.getHeight();

                case 14:
                  _context34.t4 = _context34.sent;

                  _context34.t3.equal.call(_context34.t3, _context34.t4, 1);

                  _context34.t5 = _assert["default"];
                  _context34.next = 19;
                  return wallet.getBalance();

                case 19:
                  _context34.t6 = _context34.sent;
                  _context34.t7 = BigInt("0");

                  _context34.t5.equal.call(_context34.t5, _context34.t6, _context34.t7);

                  _context34.next = 24;
                  return wallet.startSyncing();

                case 24:
                  _context34.next = 29;
                  break;

                case 26:
                  _context34.prev = 26;
                  _context34.t8 = _context34["catch"](4);

                  // first error is expected
                  try {
                    _assert["default"].equal(_context34.t8.message, "Wallet is not connected to daemon");
                  } catch (e2) {
                    err = e2;
                  }

                case 29:
                  _context34.next = 31;
                  return wallet.close();

                case 31:
                  if (!err) {
                    _context34.next = 33;
                    break;
                  }

                  throw err;

                case 33:
                  // test connecting wallet
                  path = TestMoneroWalletFull._getRandomWalletPath();
                  _context34.next = 36;
                  return that.createWallet({
                    path: path,
                    password: _TestUtils["default"].WALLET_PASSWORD,
                    networkType: _TestUtils["default"].NETWORK_TYPE,
                    serverUri: _TestUtils["default"].OFFLINE_SERVER_URI
                  });

                case 36:
                  wallet = _context34.sent;
                  _context34.prev = 37;

                  _assert["default"].notEqual(wallet.getMnemonic(), undefined);

                  _context34.t9 = _assert["default"];
                  _context34.next = 42;
                  return wallet.isConnectedToDaemon();

                case 42:
                  _context34.t10 = !_context34.sent;
                  (0, _context34.t9)(_context34.t10);
                  _context34.t11 = wallet;
                  _context34.next = 47;
                  return that.daemon.getRpcConnection();

                case 47:
                  _context34.t12 = _context34.sent;
                  _context34.next = 50;
                  return _context34.t11.setDaemonConnection.call(_context34.t11, _context34.t12);

                case 50:
                  _context34.t13 = _assert["default"];
                  _context34.next = 53;
                  return wallet.getHeight();

                case 53:
                  _context34.t14 = _context34.sent;

                  _context34.t13.equal.call(_context34.t13, _context34.t14, 1);

                  _context34.t15 = _assert["default"];
                  _context34.next = 58;
                  return wallet.isSynced();

                case 58:
                  _context34.t16 = !_context34.sent;
                  (0, _context34.t15)(_context34.t16);
                  _context34.t17 = _assert["default"];
                  _context34.t18 = _index.GenUtils;
                  _context34.next = 64;
                  return wallet.getBalance();

                case 64:
                  _context34.t19 = _context34.sent;
                  _context34.t20 = BigInt(0);
                  _context34.t21 = _context34.t18.compareBigInt.call(_context34.t18, _context34.t19, _context34.t20);

                  _context34.t17.equal.call(_context34.t17, _context34.t21, 0);

                  _context34.next = 70;
                  return wallet.getDaemonHeight();

                case 70:
                  chainHeight = _context34.sent;
                  _context34.next = 73;
                  return wallet.setSyncHeight(chainHeight - 3);

                case 73:
                  _context34.next = 75;
                  return wallet.startSyncing();

                case 75:
                  _context34.t22 = _assert["default"];
                  _context34.next = 78;
                  return wallet.getSyncHeight();

                case 78:
                  _context34.t23 = _context34.sent;
                  _context34.t24 = chainHeight - 3;

                  _context34.t22.equal.call(_context34.t22, _context34.t23, _context34.t24);

                  _context34.t25 = _assert["default"];
                  _context34.next = 84;
                  return wallet.getDaemonConnection();

                case 84:
                  _context34.t26 = _context34.sent.getUri();
                  _context34.next = 87;
                  return that.daemon.getRpcConnection();

                case 87:
                  _context34.t27 = _context34.sent.getUri();

                  _context34.t25.equal.call(_context34.t25, _context34.t26, _context34.t27);

                  _context34.t28 = _assert["default"];
                  _context34.next = 92;
                  return wallet.getDaemonConnection();

                case 92:
                  _context34.t29 = _context34.sent.getUsername();
                  _context34.next = 95;
                  return that.daemon.getRpcConnection();

                case 95:
                  _context34.t30 = _context34.sent.getUsername();

                  _context34.t28.equal.call(_context34.t28, _context34.t29, _context34.t30);

                  _context34.t31 = _assert["default"];
                  _context34.next = 100;
                  return wallet.getDaemonConnection();

                case 100:
                  _context34.t32 = _context34.sent.getPassword();
                  _context34.next = 103;
                  return that.daemon.getRpcConnection();

                case 103:
                  _context34.t33 = _context34.sent.getPassword();

                  _context34.t31.equal.call(_context34.t31, _context34.t32, _context34.t33);

                  _context34.next = 107;
                  return wallet.stopSyncing();

                case 107:
                  _context34.next = 109;
                  return wallet.sync();

                case 109:
                  _context34.next = 111;
                  return wallet.stopSyncing();

                case 111:
                  _context34.next = 113;
                  return wallet.stopSyncing();

                case 113:
                  _context34.next = 118;
                  break;

                case 115:
                  _context34.prev = 115;
                  _context34.t34 = _context34["catch"](37);
                  err = _context34.t34;

                case 118:
                  _context34.next = 120;
                  return wallet.close();

                case 120:
                  if (!err) {
                    _context34.next = 122;
                    break;
                  }

                  throw err;

                case 122:
                  _context34.next = 124;
                  return that.daemon.getHeight();

                case 124:
                  _context34.t35 = _context34.sent;
                  restoreHeight = _context34.t35 - 100;
                  path = TestMoneroWalletFull._getRandomWalletPath();
                  _context34.t36 = that;
                  _context34.t37 = path;
                  _context34.t38 = _TestUtils["default"].WALLET_PASSWORD;
                  _context34.t39 = _TestUtils["default"].NETWORK_TYPE;
                  _context34.t40 = _TestUtils["default"].MNEMONIC;
                  _context34.next = 134;
                  return that.daemon.getRpcConnection();

                case 134:
                  _context34.t41 = _context34.sent;
                  _context34.t42 = restoreHeight;
                  _context34.t43 = {
                    path: _context34.t37,
                    password: _context34.t38,
                    networkType: _context34.t39,
                    mnemonic: _context34.t40,
                    server: _context34.t41,
                    restoreHeight: _context34.t42
                  };
                  _context34.next = 139;
                  return _context34.t36.createWallet.call(_context34.t36, _context34.t43, false);

                case 139:
                  wallet = _context34.sent;
                  _context34.prev = 140;
                  _context34.t44 = _assert["default"];
                  _context34.next = 144;
                  return wallet.getHeight();

                case 144:
                  _context34.t45 = _context34.sent;

                  _context34.t44.equal.call(_context34.t44, _context34.t45, 1);

                  _context34.t46 = _assert["default"];
                  _context34.next = 149;
                  return wallet.getSyncHeight();

                case 149:
                  _context34.t47 = _context34.sent;
                  _context34.t48 = restoreHeight;

                  _context34.t46.equal.call(_context34.t46, _context34.t47, _context34.t48);

                  _context34.t49 = _assert["default"];
                  _context34.next = 155;
                  return wallet.isSynced();

                case 155:
                  _context34.t50 = !_context34.sent;
                  (0, _context34.t49)(_context34.t50);
                  _context34.t51 = _assert["default"];
                  _context34.next = 160;
                  return wallet.getBalance();

                case 160:
                  _context34.t52 = _context34.sent;
                  _context34.t53 = BigInt(0);

                  _context34.t51.equal.call(_context34.t51, _context34.t52, _context34.t53);

                  _context34.next = 165;
                  return wallet.startSyncing(_TestUtils["default"].SYNC_PERIOD_IN_MS);

                case 165:
                  _context34.next = 167;
                  return new Promise(function (resolve) {
                    setTimeout(resolve, _TestUtils["default"].SYNC_PERIOD_IN_MS + 1000);
                  });

                case 167:
                  _context34.t54 = _assert["default"];
                  _context34.next = 170;
                  return wallet.getHeight();

                case 170:
                  _context34.t55 = _context34.sent;
                  _context34.t56 = _context34.t55 > 1;
                  (0, _context34.t54)(_context34.t56);
                  _context34.next = 175;
                  return wallet.stopSyncing();

                case 175:
                  _context34.next = 180;
                  break;

                case 177:
                  _context34.prev = 177;
                  _context34.t57 = _context34["catch"](140);
                  err = _context34.t57;

                case 180:
                  _context34.next = 182;
                  return wallet.close();

                case 182:
                  if (!err) {
                    _context34.next = 184;
                    break;
                  }

                  throw err;

                case 184:
                case "end":
                  return _context34.stop();
              }
            }
          }, _callee34, null, [[4, 26], [37, 115], [140, 177]]);
        })));
        if (testConfig.testNonRelays) it("Does not interfere with other wallet notifications", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee35() {
          var height, restoreHeight, wallet1, wallet2, tester1, tester2, tester3;
          return _regenerator["default"].wrap(function _callee35$(_context35) {
            while (1) {
              switch (_context35.prev = _context35.next) {
                case 0:
                  _context35.next = 2;
                  return that.daemon.getHeight();

                case 2:
                  height = _context35.sent;
                  restoreHeight = height - 5;
                  _context35.next = 6;
                  return that.createWallet({
                    mnemonic: _TestUtils["default"].MNEMONIC,
                    restoreHeight: restoreHeight
                  }, false);

                case 6:
                  wallet1 = _context35.sent;
                  _context35.next = 9;
                  return that.createWallet({
                    mnemonic: _TestUtils["default"].MNEMONIC,
                    restoreHeight: restoreHeight
                  }, false);

                case 9:
                  wallet2 = _context35.sent;
                  // track notifications of each wallet
                  tester1 = new SyncProgressTester(wallet1, restoreHeight, height);
                  tester2 = new SyncProgressTester(wallet2, restoreHeight, height);
                  _context35.next = 14;
                  return wallet1;

                case 14:
                  _context35.t0 = _context35.sent;
                  _context35.t1 = Listener(tester1);
                  _context35.t0 + _context35.t1;
                  _context35.next = 19;
                  return wallet2;

                case 19:
                  _context35.t2 = _context35.sent;
                  _context35.t3 = Listener(tester2);
                  _context35.t2 + _context35.t3;
                  _context35.next = 24;
                  return wallet1.sync();

                case 24:
                  (0, _assert["default"])(tester1.isNotified());
                  (0, _assert["default"])(!tester2.isNotified()); // sync 2nd wallet and test that 1st is not notified

                  tester3 = new SyncProgressTester(wallet1, restoreHeight, height);
                  _context35.next = 29;
                  return wallet1;

                case 29:
                  _context35.t4 = _context35.sent;
                  _context35.t5 = Listener(tester3);
                  _context35.t4 + _context35.t5;
                  _context35.next = 34;
                  return wallet2.sync();

                case 34:
                  (0, _assert["default"])(tester2.isNotified());
                  (0, _assert["default"])(!tester3.isNotified()); // close wallets

                  _context35.next = 38;
                  return wallet1.close();

                case 38:
                  _context35.next = 40;
                  return wallet2.close();

                case 40:
                case "end":
                  return _context35.stop();
              }
            }
          }, _callee35);
        })));
        if (testConfig.testNonRelays) it("Is equal to the RPC wallet.", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee36() {
          return _regenerator["default"].wrap(function _callee36$(_context36) {
            while (1) {
              switch (_context36.prev = _context36.next) {
                case 0:
                  _context36.t0 = _WalletEqualityUtils["default"];
                  _context36.next = 3;
                  return _TestUtils["default"].getWalletRpc();

                case 3:
                  _context36.t1 = _context36.sent;
                  _context36.t2 = that.wallet;
                  _context36.next = 7;
                  return _context36.t0.testWalletEqualityOnChain.call(_context36.t0, _context36.t1, _context36.t2);

                case 7:
                case "end":
                  return _context36.stop();
              }
            }
          }, _callee36);
        })));
        if (testConfig.testNonRelays) it("Is equal to the RPC wallet with a seed offset", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee37() {
          var seedOffset, walletRpc, walletFull, err;
          return _regenerator["default"].wrap(function _callee37$(_context37) {
            while (1) {
              switch (_context37.prev = _context37.next) {
                case 0:
                  // use common offset to compare wallet implementations
                  seedOffset = "my super secret offset!"; // create rpc wallet with offset

                  _context37.next = 3;
                  return _TestUtils["default"].getWalletRpc();

                case 3:
                  walletRpc = _context37.sent;
                  _context37.t0 = walletRpc;
                  _context37.t1 = _index.GenUtils.getUUID();
                  _context37.t2 = _TestUtils["default"].WALLET_PASSWORD;
                  _context37.next = 9;
                  return walletRpc.getMnemonic();

                case 9:
                  _context37.t3 = _context37.sent;
                  _context37.t4 = _TestUtils["default"].FIRST_RECEIVE_HEIGHT;
                  _context37.t5 = seedOffset;
                  _context37.t6 = {
                    path: _context37.t1,
                    password: _context37.t2,
                    mnemonic: _context37.t3,
                    restoreHeight: _context37.t4,
                    seedOffset: _context37.t5
                  };
                  _context37.next = 15;
                  return _context37.t0.createWallet.call(_context37.t0, _context37.t6);

                case 15:
                  _context37.next = 17;
                  return that.createWallet({
                    mnemonic: _TestUtils["default"].MNEMONIC,
                    restoreHeight: _TestUtils["default"].FIRST_RECEIVE_HEIGHT,
                    seedOffset: seedOffset
                  });

                case 17:
                  walletFull = _context37.sent;
                  _context37.prev = 18;
                  _context37.next = 21;
                  return _WalletEqualityUtils["default"].testWalletEqualityOnChain(walletRpc, walletFull);

                case 21:
                  _context37.next = 26;
                  break;

                case 23:
                  _context37.prev = 23;
                  _context37.t7 = _context37["catch"](18);
                  err = _context37.t7;

                case 26:
                  _context37.next = 28;
                  return walletFull.close();

                case 28:
                  if (!err) {
                    _context37.next = 30;
                    break;
                  }

                  throw err;

                case 30:
                case "end":
                  return _context37.stop();
              }
            }
          }, _callee37, null, [[18, 23]]);
        })));
        if (testConfig.testNonRelays) it("Supports multisig sample code", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee38() {
          return _regenerator["default"].wrap(function _callee38$(_context38) {
            while (1) {
              switch (_context38.prev = _context38.next) {
                case 0:
                  _context38.next = 2;
                  return testCreateMultisigWallet(2, 2);

                case 2:
                  _context38.next = 4;
                  return testCreateMultisigWallet(2, 3);

                case 4:
                  _context38.next = 6;
                  return testCreateMultisigWallet(2, 4);

                case 6:
                case "end":
                  return _context38.stop();
              }
            }
          }, _callee38);
        })));

        function testCreateMultisigWallet(_x14, _x15) {
          return _testCreateMultisigWallet.apply(this, arguments);
        }

        function _testCreateMultisigWallet() {
          _testCreateMultisigWallet = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee43(M, N) {
            var wallets, i, preparedMultisigHexes, _i2, _wallets2, wallet, madeMultisigHexes, _i3, peerMultisigHexes, j, multisigHex, multisigHexes, _i4, resultMultisigHexes, _iterator3, _step3, _wallet2, result, _i5, _wallets3, _wallet3, primaryAddress, info;

            return _regenerator["default"].wrap(function _callee43$(_context43) {
              while (1) {
                switch (_context43.prev = _context43.next) {
                  case 0:
                    console.log("Creating " + M + "/" + N + " multisig wallet"); // create participating wallets

                    wallets = [];
                    i = 0;

                  case 3:
                    if (!(i < N)) {
                      _context43.next = 12;
                      break;
                    }

                    _context43.t0 = wallets;
                    _context43.next = 7;
                    return that.createWallet();

                  case 7:
                    _context43.t1 = _context43.sent;

                    _context43.t0.push.call(_context43.t0, _context43.t1);

                  case 9:
                    i++;
                    _context43.next = 3;
                    break;

                  case 12:
                    // prepare and collect multisig hex from each participant
                    preparedMultisigHexes = [];
                    _i2 = 0, _wallets2 = wallets;

                  case 14:
                    if (!(_i2 < _wallets2.length)) {
                      _context43.next = 24;
                      break;
                    }

                    wallet = _wallets2[_i2];
                    _context43.t2 = preparedMultisigHexes;
                    _context43.next = 19;
                    return wallet.prepareMultisig();

                  case 19:
                    _context43.t3 = _context43.sent;

                    _context43.t2.push.call(_context43.t2, _context43.t3);

                  case 21:
                    _i2++;
                    _context43.next = 14;
                    break;

                  case 24:
                    // make each wallet multsig and collect results
                    madeMultisigHexes = [];
                    _i3 = 0;

                  case 26:
                    if (!(_i3 < wallets.length)) {
                      _context43.next = 36;
                      break;
                    }

                    // collect prepared multisig hexes from wallet's peers
                    peerMultisigHexes = [];

                    for (j = 0; j < wallets.length; j++) {
                      if (j !== _i3) peerMultisigHexes.push(preparedMultisigHexes[j]);
                    } // make wallet multisig and collect result hex


                    _context43.next = 31;
                    return wallets[_i3].makeMultisig(peerMultisigHexes, M, _TestUtils["default"].WALLET_PASSWORD);

                  case 31:
                    multisigHex = _context43.sent;
                    madeMultisigHexes.push(multisigHex);

                  case 33:
                    _i3++;
                    _context43.next = 26;
                    break;

                  case 36:
                    // exchange multisig keys N - M + 1 times
                    multisigHexes = madeMultisigHexes;
                    _i4 = 0;

                  case 38:
                    if (!(_i4 < N - M + 1)) {
                      _context43.next = 63;
                      break;
                    }

                    // exchange multisig keys among participants and collect results for next round if applicable
                    resultMultisigHexes = [];
                    _iterator3 = _createForOfIteratorHelper(wallets);
                    _context43.prev = 41;

                    _iterator3.s();

                  case 43:
                    if ((_step3 = _iterator3.n()).done) {
                      _context43.next = 51;
                      break;
                    }

                    _wallet2 = _step3.value;
                    _context43.next = 47;
                    return _wallet2.exchangeMultisigKeys(multisigHexes, _TestUtils["default"].WALLET_PASSWORD);

                  case 47:
                    result = _context43.sent;
                    resultMultisigHexes.push(result.getMultisigHex());

                  case 49:
                    _context43.next = 43;
                    break;

                  case 51:
                    _context43.next = 56;
                    break;

                  case 53:
                    _context43.prev = 53;
                    _context43.t4 = _context43["catch"](41);

                    _iterator3.e(_context43.t4);

                  case 56:
                    _context43.prev = 56;

                    _iterator3.f();

                    return _context43.finish(56);

                  case 59:
                    // use resulting multisig hex for next round of exchange if applicable
                    multisigHexes = resultMultisigHexes;

                  case 60:
                    _i4++;
                    _context43.next = 38;
                    break;

                  case 63:
                    _i5 = 0, _wallets3 = wallets;

                  case 64:
                    if (!(_i5 < _wallets3.length)) {
                      _context43.next = 88;
                      break;
                    }

                    _wallet3 = _wallets3[_i5];
                    _context43.next = 68;
                    return _wallet3.getAddress(0, 0);

                  case 68:
                    primaryAddress = _context43.sent;
                    _context43.t5 = _index.MoneroUtils;
                    _context43.t6 = primaryAddress;
                    _context43.next = 73;
                    return _wallet3.getNetworkType();

                  case 73:
                    _context43.t7 = _context43.sent;
                    _context43.next = 76;
                    return _context43.t5.validateAddress.call(_context43.t5, _context43.t6, _context43.t7);

                  case 76:
                    _context43.next = 78;
                    return _wallet3.getMultisigInfo();

                  case 78:
                    info = _context43.sent;
                    (0, _assert["default"])(info.isMultisig());
                    (0, _assert["default"])(info.isReady());

                    _assert["default"].equal(info.getThreshold(), M);

                    _assert["default"].equal(info.getNumParticipants(), N);

                    _context43.next = 85;
                    return _wallet3.close(true);

                  case 85:
                    _i5++;
                    _context43.next = 64;
                    break;

                  case 88:
                  case "end":
                    return _context43.stop();
                }
              }
            }, _callee43, null, [[41, 53, 56, 59]]);
          }));
          return _testCreateMultisigWallet.apply(this, arguments);
        }

        if (testConfig.testNonRelays) it("Can be saved", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee39() {
          var path, restoreHeight, wallet, err, prevHeight, _err;

          return _regenerator["default"].wrap(function _callee39$(_context39) {
            while (1) {
              switch (_context39.prev = _context39.next) {
                case 0:
                  // create unique path for new test wallet
                  path = TestMoneroWalletFull._getRandomWalletPath(); // wallet does not exist

                  _context39.t0 = _assert["default"];
                  _context39.next = 4;
                  return _index.MoneroWalletFull.walletExists(path, _TestUtils["default"].getDefaultFs());

                case 4:
                  _context39.t1 = !_context39.sent;
                  (0, _context39.t0)(_context39.t1);
                  _context39.prev = 6;
                  _context39.next = 9;
                  return that.openWallet({
                    path: path,
                    serverUri: ""
                  });

                case 9:
                  throw new Error("Cannot open non-existent wallet");

                case 12:
                  _context39.prev = 12;
                  _context39.t2 = _context39["catch"](6);

                  _assert["default"].equal(_context39.t2.message, "Wallet does not exist at path: " + path);

                case 15:
                  _context39.next = 17;
                  return that.daemon.getHeight();

                case 17:
                  _context39.t3 = _context39.sent;
                  restoreHeight = _context39.t3 - 200;
                  _context39.next = 21;
                  return that.createWallet({
                    path: path,
                    password: _TestUtils["default"].WALLET_PASSWORD,
                    networkType: _TestUtils["default"].NETWORK_TYPE,
                    mnemonic: _TestUtils["default"].MNEMONIC,
                    restoreHeight: restoreHeight,
                    serverUri: _TestUtils["default"].OFFLINE_SERVER_URI
                  });

                case 21:
                  wallet = _context39.sent;
                  _context39.prev = 22;
                  _context39.t4 = _assert["default"];
                  _context39.next = 26;
                  return _index.MoneroWalletFull.walletExists(path, _TestUtils["default"].getDefaultFs());

                case 26:
                  _context39.t5 = _context39.sent;
                  (0, _context39.t4)(_context39.t5);
                  _context39.t6 = _assert["default"];
                  _context39.next = 31;
                  return wallet.getMnemonic();

                case 31:
                  _context39.t7 = _context39.sent;
                  _context39.t8 = _TestUtils["default"].MNEMONIC;

                  _context39.t6.equal.call(_context39.t6, _context39.t7, _context39.t8);

                  _context39.t9 = _assert["default"];
                  _context39.next = 37;
                  return wallet.getNetworkType();

                case 37:
                  _context39.t10 = _context39.sent;
                  _context39.t11 = _TestUtils["default"].NETWORK_TYPE;

                  _context39.t9.equal.call(_context39.t9, _context39.t10, _context39.t11);

                  _context39.t12 = _assert["default"];
                  _context39.next = 43;
                  return wallet.getDaemonConnection();

                case 43:
                  _context39.t13 = _context39.sent;
                  _context39.t14 = new MoneroRpcConnection(_TestUtils["default"].OFFLINE_SERVER_URI);

                  _context39.t12.deepEqual.call(_context39.t12, _context39.t13, _context39.t14);

                  _context39.t15 = _assert["default"];
                  _context39.next = 49;
                  return wallet.getSyncHeight();

                case 49:
                  _context39.t16 = _context39.sent;
                  _context39.t17 = restoreHeight;

                  _context39.t15.equal.call(_context39.t15, _context39.t16, _context39.t17);

                  _context39.t18 = _assert["default"];
                  _context39.next = 55;
                  return wallet.getMnemonicLanguage();

                case 55:
                  _context39.t19 = _context39.sent;

                  _context39.t18.equal.call(_context39.t18, _context39.t19, "English");

                  _context39.t20 = _assert["default"];
                  _context39.next = 60;
                  return wallet.getHeight();

                case 60:
                  _context39.t21 = _context39.sent;

                  _context39.t20.equal.call(_context39.t20, _context39.t21, 1);

                  _context39.t22 = _assert["default"];
                  _context39.next = 65;
                  return wallet.getSyncHeight();

                case 65:
                  _context39.t23 = _context39.sent;
                  _context39.t24 = restoreHeight;

                  _context39.t22.equal.call(_context39.t22, _context39.t23, _context39.t24);

                  _context39.next = 70;
                  return wallet.setDaemonConnection(_TestUtils["default"].getDaemonRpcConnection());

                case 70:
                  _context39.next = 72;
                  return wallet.sync();

                case 72:
                  _context39.next = 74;
                  return wallet.getHeight();

                case 74:
                  _context39.t25 = _context39.sent;
                  _context39.next = 77;
                  return wallet.getDaemonHeight();

                case 77:
                  _context39.t26 = _context39.sent;

                  if (!(_context39.t25 !== _context39.t26)) {
                    _context39.next = 90;
                    break;
                  }

                  _context39.t27 = console;
                  _context39.next = 82;
                  return wallet.getHeight();

                case 82:
                  _context39.t28 = _context39.sent;
                  _context39.t29 = "WARNING: wallet height " + _context39.t28;
                  _context39.t30 = _context39.t29 + " is not synced with daemon height ";
                  _context39.next = 87;
                  return that.daemon.getHeight();

                case 87:
                  _context39.t31 = _context39.sent;
                  _context39.t32 = _context39.t30 + _context39.t31;

                  _context39.t27.log.call(_context39.t27, _context39.t32);

                case 90:
                  _context39.next = 92;
                  return wallet.close();

                case 92:
                  _context39.next = 94;
                  return that.openWallet({
                    path: path,
                    serverUri: _TestUtils["default"].OFFLINE_SERVER_URI
                  });

                case 94:
                  wallet = _context39.sent;
                  _context39.t33 = _assert["default"];
                  _context39.next = 98;
                  return _index.MoneroWalletFull.walletExists(path, _TestUtils["default"].getDefaultFs());

                case 98:
                  _context39.t34 = _context39.sent;
                  (0, _context39.t33)(_context39.t34);
                  _context39.t35 = _assert["default"];
                  _context39.next = 103;
                  return wallet.getMnemonic();

                case 103:
                  _context39.t36 = _context39.sent;
                  _context39.t37 = _TestUtils["default"].MNEMONIC;

                  _context39.t35.equal.call(_context39.t35, _context39.t36, _context39.t37);

                  _context39.t38 = _assert["default"];
                  _context39.next = 109;
                  return wallet.getNetworkType();

                case 109:
                  _context39.t39 = _context39.sent;
                  _context39.t40 = _TestUtils["default"].NETWORK_TYPE;

                  _context39.t38.equal.call(_context39.t38, _context39.t39, _context39.t40);

                  _context39.t41 = _assert["default"];
                  _context39.next = 115;
                  return wallet.getDaemonConnection();

                case 115:
                  _context39.t42 = _context39.sent;
                  _context39.t43 = new MoneroRpcConnection(_TestUtils["default"].OFFLINE_SERVER_URI);

                  _context39.t41.deepEqual.call(_context39.t41, _context39.t42, _context39.t43);

                  _context39.t44 = _assert["default"];
                  _context39.next = 121;
                  return wallet.isConnectedToDaemon();

                case 121:
                  _context39.t45 = !_context39.sent;
                  (0, _context39.t44)(_context39.t45);
                  _context39.t46 = _assert["default"];
                  _context39.next = 126;
                  return wallet.getMnemonicLanguage();

                case 126:
                  _context39.t47 = _context39.sent;

                  _context39.t46.equal.call(_context39.t46, _context39.t47, "English");

                  _context39.t48 = _assert["default"];
                  _context39.next = 131;
                  return wallet.isSynced();

                case 131:
                  _context39.t49 = !_context39.sent;
                  (0, _context39.t48)(_context39.t49);
                  _context39.t50 = _assert["default"];
                  _context39.next = 136;
                  return wallet.getHeight();

                case 136:
                  _context39.t51 = _context39.sent;

                  _context39.t50.equal.call(_context39.t50, _context39.t51, 1);

                  _context39.t52 = _assert["default"];
                  _context39.next = 141;
                  return wallet.getSyncHeight();

                case 141:
                  _context39.t53 = _context39.sent;

                  _context39.t52.equal.call(_context39.t52, _context39.t53, 0);

                  _context39.next = 145;
                  return wallet.setDaemonConnection(_TestUtils["default"].getDaemonRpcConnection());

                case 145:
                  _context39.t54 = _assert["default"];
                  _context39.next = 148;
                  return wallet.isConnectedToDaemon();

                case 148:
                  _context39.t55 = _context39.sent;
                  (0, _context39.t54)(_context39.t55);
                  _context39.next = 152;
                  return wallet.setSyncHeight(restoreHeight);

                case 152:
                  _context39.next = 154;
                  return wallet.sync();

                case 154:
                  _context39.t56 = _assert["default"];
                  _context39.next = 157;
                  return wallet.isSynced();

                case 157:
                  _context39.t57 = _context39.sent;
                  (0, _context39.t56)(_context39.t57);
                  _context39.t58 = _assert["default"];
                  _context39.next = 162;
                  return wallet.getHeight();

                case 162:
                  _context39.t59 = _context39.sent;
                  _context39.next = 165;
                  return wallet.getDaemonHeight();

                case 165:
                  _context39.t60 = _context39.sent;

                  _context39.t58.equal.call(_context39.t58, _context39.t59, _context39.t60);

                  _context39.next = 169;
                  return wallet.getHeight();

                case 169:
                  prevHeight = _context39.sent;
                  _context39.next = 172;
                  return wallet.save();

                case 172:
                  _context39.next = 174;
                  return wallet.close();

                case 174:
                  _context39.next = 176;
                  return that.openWallet({
                    path: path,
                    serverUri: _TestUtils["default"].OFFLINE_SERVER_URI
                  });

                case 176:
                  wallet = _context39.sent;
                  _context39.t61 = _assert["default"];
                  _context39.next = 180;
                  return wallet.isConnectedToDaemon();

                case 180:
                  _context39.t62 = !_context39.sent;
                  (0, _context39.t61)(_context39.t62);
                  _context39.next = 184;
                  return wallet.setDaemonConnection(_TestUtils["default"].getDaemonRpcConnection());

                case 184:
                  _context39.t63 = _assert["default"];
                  _context39.next = 187;
                  return wallet.getDaemonConnection();

                case 187:
                  _context39.t64 = _context39.sent;
                  _context39.t65 = _TestUtils["default"].getDaemonRpcConnection();

                  _context39.t63.equal.call(_context39.t63, _context39.t64, _context39.t65);

                  _context39.t66 = _assert["default"];
                  _context39.next = 193;
                  return wallet.isConnectedToDaemon();

                case 193:
                  _context39.t67 = _context39.sent;
                  (0, _context39.t66)(_context39.t67);
                  _context39.t68 = _assert["default"];
                  _context39.next = 198;
                  return wallet.getHeight();

                case 198:
                  _context39.t69 = _context39.sent;
                  _context39.t70 = prevHeight;

                  _context39.t68.equal.call(_context39.t68, _context39.t69, _context39.t70);

                  _context39.t71 = _assert["default"];
                  _context39.next = 204;
                  return wallet.getSyncHeight();

                case 204:
                  _context39.t72 = _context39.sent;

                  _context39.t71.equal.call(_context39.t71, _context39.t72, 0);

                  _context39.t73 = _assert["default"];
                  _context39.next = 209;
                  return _index.MoneroWalletFull.walletExists(path, _TestUtils["default"].getDefaultFs());

                case 209:
                  _context39.t74 = _context39.sent;
                  (0, _context39.t73)(_context39.t74);
                  _context39.t75 = _assert["default"];
                  _context39.next = 214;
                  return wallet.getMnemonic();

                case 214:
                  _context39.t76 = _context39.sent;
                  _context39.t77 = _TestUtils["default"].MNEMONIC;

                  _context39.t75.equal.call(_context39.t75, _context39.t76, _context39.t77);

                  _context39.t78 = _assert["default"];
                  _context39.next = 220;
                  return wallet.getNetworkType();

                case 220:
                  _context39.t79 = _context39.sent;
                  _context39.t80 = _TestUtils["default"].NETWORK_TYPE;

                  _context39.t78.equal.call(_context39.t78, _context39.t79, _context39.t80);

                  _context39.t81 = _assert["default"];
                  _context39.next = 226;
                  return wallet.getMnemonicLanguage();

                case 226:
                  _context39.t82 = _context39.sent;

                  _context39.t81.equal.call(_context39.t81, _context39.t82, "English");

                  _context39.next = 230;
                  return wallet.sync();

                case 230:
                  _context39.next = 235;
                  break;

                case 232:
                  _context39.prev = 232;
                  _context39.t83 = _context39["catch"](22);
                  _err = _context39.t83;

                case 235:
                  _context39.next = 237;
                  return wallet.close();

                case 237:
                  if (!err) {
                    _context39.next = 239;
                    break;
                  }

                  throw err;

                case 239:
                case "end":
                  return _context39.stop();
              }
            }
          }, _callee39, null, [[6, 12], [22, 232]]);
        })));
        if (testConfig.testNonRelays) it("Can be moved", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee40() {
          var err, wallet, mnemonic, path1, path2;
          return _regenerator["default"].wrap(function _callee40$(_context40) {
            while (1) {
              switch (_context40.prev = _context40.next) {
                case 0:
                  _context40.prev = 0;
                  _context40.next = 3;
                  return that.createWallet(new _index.MoneroWalletConfig().setPath(""));

                case 3:
                  wallet = _context40.sent;
                  _context40.next = 6;
                  return wallet.getMnemonic();

                case 6:
                  mnemonic = _context40.sent;
                  _context40.next = 9;
                  return wallet.setAttribute("mykey", "myval1");

                case 9:
                  // move wallet from memory to disk
                  path1 = _TestUtils["default"].TEST_WALLETS_DIR + "/" + _index.GenUtils.getUUID();
                  (0, _assert["default"])(!_index.MoneroWalletFull.walletExists(path1, _TestUtils["default"].getDefaultFs()));
                  _context40.next = 13;
                  return wallet.moveTo(path1);

                case 13:
                  (0, _assert["default"])(_index.MoneroWalletFull.walletExists(path1, _TestUtils["default"].getDefaultFs()));
                  _context40.t0 = _assert["default"];
                  _context40.next = 17;
                  return wallet.getMnemonic();

                case 17:
                  _context40.t1 = _context40.sent;
                  _context40.t2 = mnemonic;

                  _context40.t0.equal.call(_context40.t0, _context40.t1, _context40.t2);

                  _context40.t3 = _assert["default"];
                  _context40.next = 23;
                  return wallet.getAttribute("mykey");

                case 23:
                  _context40.t4 = _context40.sent;

                  _context40.t3.equal.call(_context40.t3, "myval1", _context40.t4);

                  _context40.next = 27;
                  return wallet.setAttribute("mykey", "myval2");

                case 27:
                  _context40.next = 29;
                  return wallet.moveTo(path1);

                case 29:
                  _context40.next = 31;
                  return wallet.close();

                case 31:
                  (0, _assert["default"])(_index.MoneroWalletFull.walletExists(path1, _TestUtils["default"].getDefaultFs()));
                  _context40.next = 34;
                  return that.openWallet(new _index.MoneroWalletConfig().setPath(path1));

                case 34:
                  wallet = _context40.sent;
                  _context40.t5 = _assert["default"];
                  _context40.next = 38;
                  return wallet.getMnemonic();

                case 38:
                  _context40.t6 = _context40.sent;
                  _context40.t7 = mnemonic;

                  _context40.t5.equal.call(_context40.t5, _context40.t6, _context40.t7);

                  _context40.t8 = _assert["default"];
                  _context40.next = 44;
                  return wallet.getAttribute("mykey");

                case 44:
                  _context40.t9 = _context40.sent;

                  _context40.t8.equal.call(_context40.t8, "myval2", _context40.t9);

                  // move wallet to new directory
                  path2 = _TestUtils["default"].TEST_WALLETS_DIR + "/" + _index.GenUtils.getUUID();
                  _context40.next = 49;
                  return wallet.setAttribute("mykey", "myval3");

                case 49:
                  _context40.next = 51;
                  return wallet.moveTo(path2);

                case 51:
                  (0, _assert["default"])(!_index.MoneroWalletFull.walletExists(path1, _TestUtils["default"].getDefaultFs()));
                  (0, _assert["default"])(_index.MoneroWalletFull.walletExists(path2, _TestUtils["default"].getDefaultFs()));
                  _context40.t10 = _assert["default"];
                  _context40.next = 56;
                  return wallet.getMnemonic();

                case 56:
                  _context40.t11 = _context40.sent;
                  _context40.t12 = mnemonic;

                  _context40.t10.equal.call(_context40.t10, _context40.t11, _context40.t12);

                  _context40.next = 61;
                  return wallet.close();

                case 61:
                  _context40.next = 63;
                  return that.openWallet(new _index.MoneroWalletConfig().setPath(path2));

                case 63:
                  wallet = _context40.sent;
                  _context40.next = 66;
                  return wallet.sync();

                case 66:
                  _context40.t13 = _assert["default"];
                  _context40.next = 69;
                  return wallet.getMnemonic();

                case 69:
                  _context40.t14 = _context40.sent;
                  _context40.t15 = mnemonic;

                  _context40.t13.equal.call(_context40.t13, _context40.t14, _context40.t15);

                  _context40.t16 = _assert["default"];
                  _context40.next = 75;
                  return wallet.getAttribute("mykey");

                case 75:
                  _context40.t17 = _context40.sent;

                  _context40.t16.equal.call(_context40.t16, "myval3", _context40.t17);

                  _context40.next = 82;
                  break;

                case 79:
                  _context40.prev = 79;
                  _context40.t18 = _context40["catch"](0);
                  err = _context40.t18;

                case 82:
                  if (!wallet) {
                    _context40.next = 85;
                    break;
                  }

                  _context40.next = 85;
                  return wallet.close();

                case 85:
                  if (!err) {
                    _context40.next = 87;
                    break;
                  }

                  throw err;

                case 87:
                case "end":
                  return _context40.stop();
              }
            }
          }, _callee40, null, [[0, 79]]);
        })));
        if (testConfig.testNonRelays) it("Can be closed", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee41() {
          var err, wallet, path;
          return _regenerator["default"].wrap(function _callee41$(_context41) {
            while (1) {
              switch (_context41.prev = _context41.next) {
                case 0:
                  _context41.prev = 0;
                  _context41.next = 3;
                  return that.createWallet();

                case 3:
                  wallet = _context41.sent;
                  _context41.next = 6;
                  return wallet.getPath();

                case 6:
                  path = _context41.sent;
                  _context41.next = 9;
                  return wallet.sync();

                case 9:
                  _context41.t0 = _assert["default"];
                  _context41.next = 12;
                  return wallet.getHeight();

                case 12:
                  _context41.t1 = _context41.sent;
                  _context41.t2 = _context41.t1 > 1;
                  (0, _context41.t0)(_context41.t2);
                  _context41.t3 = _assert["default"];
                  _context41.next = 18;
                  return wallet.isSynced();

                case 18:
                  _context41.t4 = _context41.sent;
                  (0, _context41.t3)(_context41.t4);
                  _context41.t5 = _assert["default"];
                  _context41.next = 23;
                  return wallet.isClosed();

                case 23:
                  _context41.t6 = _context41.sent;

                  _context41.t5.equal.call(_context41.t5, _context41.t6, false);

                  _context41.next = 27;
                  return wallet.close();

                case 27:
                  _context41.t7 = _assert["default"];
                  _context41.next = 30;
                  return wallet.isClosed();

                case 30:
                  _context41.t8 = _context41.sent;
                  (0, _context41.t7)(_context41.t8);
                  _context41.prev = 32;
                  _context41.next = 35;
                  return wallet.getHeight();

                case 35:
                  _context41.next = 40;
                  break;

                case 37:
                  _context41.prev = 37;
                  _context41.t9 = _context41["catch"](32);

                  _assert["default"].equal(_context41.t9.message, "Wallet is closed");

                case 40:
                  _context41.prev = 40;
                  _context41.next = 43;
                  return wallet.getMnemonic();

                case 43:
                  _context41.next = 48;
                  break;

                case 45:
                  _context41.prev = 45;
                  _context41.t10 = _context41["catch"](40);

                  _assert["default"].equal(_context41.t10.message, "Wallet is closed");

                case 48:
                  _context41.prev = 48;
                  _context41.next = 51;
                  return wallet.sync();

                case 51:
                  _context41.next = 56;
                  break;

                case 53:
                  _context41.prev = 53;
                  _context41.t11 = _context41["catch"](48);

                  _assert["default"].equal(_context41.t11.message, "Wallet is closed");

                case 56:
                  _context41.prev = 56;
                  _context41.next = 59;
                  return wallet.startSyncing();

                case 59:
                  _context41.next = 64;
                  break;

                case 61:
                  _context41.prev = 61;
                  _context41.t12 = _context41["catch"](56);

                  _assert["default"].equal(_context41.t12.message, "Wallet is closed");

                case 64:
                  _context41.prev = 64;
                  _context41.next = 67;
                  return wallet.stopSyncing();

                case 67:
                  _context41.next = 72;
                  break;

                case 69:
                  _context41.prev = 69;
                  _context41.t13 = _context41["catch"](64);

                  _assert["default"].equal(_context41.t13.message, "Wallet is closed");

                case 72:
                  _context41.next = 74;
                  return that.openWallet({
                    path: path
                  });

                case 74:
                  wallet = _context41.sent;
                  _context41.next = 77;
                  return wallet.sync();

                case 77:
                  _context41.t14 = _assert["default"];
                  _context41.next = 80;
                  return wallet.getHeight();

                case 80:
                  _context41.t15 = _context41.sent;
                  _context41.next = 83;
                  return wallet.getDaemonHeight();

                case 83:
                  _context41.t16 = _context41.sent;

                  _context41.t14.equal.call(_context41.t14, _context41.t15, _context41.t16);

                  _context41.t17 = _assert["default"];
                  _context41.next = 88;
                  return wallet.isClosed();

                case 88:
                  _context41.t18 = _context41.sent;

                  _context41.t17.equal.call(_context41.t17, _context41.t18, false);

                  _context41.next = 96;
                  break;

                case 92:
                  _context41.prev = 92;
                  _context41.t19 = _context41["catch"](0);
                  console.log(_context41.t19);
                  err = _context41.t19;

                case 96:
                  _context41.next = 98;
                  return wallet.close();

                case 98:
                  _context41.t20 = _assert["default"];
                  _context41.next = 101;
                  return wallet.isClosed();

                case 101:
                  _context41.t21 = _context41.sent;
                  (0, _context41.t20)(_context41.t21);

                  if (!err) {
                    _context41.next = 105;
                    break;
                  }

                  throw err;

                case 105:
                case "end":
                  return _context41.stop();
              }
            }
          }, _callee41, null, [[0, 92], [32, 37], [40, 45], [48, 53], [56, 61], [64, 69]]);
        })));
      });
    } //----------------------------- PRIVATE HELPERS -----------------------------

  }], [{
    key: "_getRandomWalletPath",
    value: function _getRandomWalletPath() {
      return _TestUtils["default"].TEST_WALLETS_DIR + "/test_wallet_" + _index.GenUtils.getUUID();
    } // possible configuration: on chain xor local wallet data ("strict"), txs ordered same way? TBD

  }, {
    key: "_testWalletEqualityOnChain",
    value: function () {
      var _testWalletEqualityOnChain2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee44(wallet1, wallet2) {
        return _regenerator["default"].wrap(function _callee44$(_context44) {
          while (1) {
            switch (_context44.prev = _context44.next) {
              case 0:
                _context44.next = 2;
                return _WalletEqualityUtils["default"].testWalletEqualityOnChain(wallet1, wallet2);

              case 2:
                _context44.t0 = _assert["default"];
                _context44.next = 5;
                return wallet2.getNetworkType();

              case 5:
                _context44.t1 = _context44.sent;
                _context44.next = 8;
                return wallet1.getNetworkType();

              case 8:
                _context44.t2 = _context44.sent;

                _context44.t0.equal.call(_context44.t0, _context44.t1, _context44.t2);

                _context44.t3 = _assert["default"];
                _context44.next = 13;
                return wallet2.getDaemonConnection();

              case 13:
                _context44.t4 = _context44.sent.getUri();
                _context44.next = 16;
                return wallet1.getDaemonConnection();

              case 16:
                _context44.t5 = _context44.sent.getUri();

                _context44.t3.equal.call(_context44.t3, _context44.t4, _context44.t5);

                _context44.t6 = _assert["default"];
                _context44.next = 21;
                return wallet2.getDaemonConnection();

              case 21:
                _context44.t7 = _context44.sent.getUsername();
                _context44.next = 24;
                return wallet1.getDaemonConnection();

              case 24:
                _context44.t8 = _context44.sent.getUsername();

                _context44.t6.equal.call(_context44.t6, _context44.t7, _context44.t8);

                _context44.t9 = _assert["default"];
                _context44.next = 29;
                return wallet2.getDaemonConnection();

              case 29:
                _context44.t10 = _context44.sent.getPassword();
                _context44.next = 32;
                return wallet1.getDaemonConnection();

              case 32:
                _context44.t11 = _context44.sent.getPassword();

                _context44.t9.equal.call(_context44.t9, _context44.t10, _context44.t11);

                _context44.t12 = _assert["default"];
                _context44.next = 37;
                return wallet2.getMnemonicLanguage();

              case 37:
                _context44.t13 = _context44.sent;
                _context44.next = 40;
                return wallet1.getMnemonicLanguage();

              case 40:
                _context44.t14 = _context44.sent;

                _context44.t12.equal.call(_context44.t12, _context44.t13, _context44.t14);

              case 42:
              case "end":
                return _context44.stop();
            }
          }
        }, _callee44);
      }));

      function _testWalletEqualityOnChain(_x16, _x17) {
        return _testWalletEqualityOnChain2.apply(this, arguments);
      }

      return _testWalletEqualityOnChain;
    }()
  }]);
  return TestMoneroWalletFull;
}(_TestMoneroWalletCommon["default"]);
/**
 * Helper class to test progress updates.
 */


var SyncProgressTester = /*#__PURE__*/function (_WalletSyncPrinter) {
  (0, _inherits2["default"])(SyncProgressTester, _WalletSyncPrinter);

  var _super2 = _createSuper(SyncProgressTester);

  function SyncProgressTester(wallet, startHeight, endHeight) {
    var _this;

    (0, _classCallCheck2["default"])(this, SyncProgressTester);
    _this = _super2.call(this);
    _this.wallet = wallet;
    (0, _assert["default"])(startHeight >= 0);
    (0, _assert["default"])(endHeight >= 0);
    _this.startHeight = startHeight;
    _this.prevEndHeight = endHeight;
    _this.isDone = false;
    return _this;
  }

  (0, _createClass2["default"])(SyncProgressTester, [{
    key: "onSyncProgress",
    value: function onSyncProgress(height, startHeight, endHeight, percentDone, message) {
      (0, _get2["default"])((0, _getPrototypeOf2["default"])(SyncProgressTester.prototype), "onSyncProgress", this).call(this, height, startHeight, endHeight, percentDone, message); // registered wallet listeners will continue to get sync notifications after the wallet's initial sync

      if (this.isDone) {
        (0, _assert["default"])(this.wallet.getListeners().includes(this), "Listener has completed and is not registered so should not be called again");
        this.onSyncProgressAfterDone = true;
      } // update tester's start height if new sync session


      if (this.prevCompleteHeight !== undefined && startHeight === this.prevCompleteHeight) this.startHeight = startHeight; // if sync is complete, record completion height for subsequent start heights

      if (percentDone === 1) this.prevCompleteHeight = endHeight; // otherwise start height is equal to previous completion height
      else if (this.prevCompleteHeight !== undefined) _assert["default"].equal(startHeight, this.prevCompleteHeight);
      (0, _assert["default"])(endHeight > startHeight, "end height > start height");

      _assert["default"].equal(startHeight, this.startHeight);

      (0, _assert["default"])(endHeight >= this.prevEndHeight); // chain can grow while syncing

      this.prevEndHeight = endHeight;
      (0, _assert["default"])(height >= startHeight);
      (0, _assert["default"])(height < endHeight);
      var expectedPercentDone = (height - startHeight + 1) / (endHeight - startHeight);

      _assert["default"].equal(expectedPercentDone, percentDone);

      if (this.prevHeight === undefined) _assert["default"].equal(height, startHeight);else _assert["default"].equal(this.prevHeight + 1, height);
      this.prevHeight = height;
    }
  }, {
    key: "onDone",
    value: function () {
      var _onDone = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee45(chainHeight) {
        return _regenerator["default"].wrap(function _callee45$(_context45) {
          while (1) {
            switch (_context45.prev = _context45.next) {
              case 0:
                (0, _assert["default"])(!this.isDone);
                this.isDone = true;

                if (this.prevHeight === undefined) {
                  _assert["default"].equal(this.prevCompleteHeight, undefined);

                  _assert["default"].equal(this.startHeight, chainHeight);
                } else {
                  _assert["default"].equal(this.prevHeight, chainHeight - 1); // otherwise last height is chain height - 1


                  _assert["default"].equal(this.prevCompleteHeight, chainHeight);
                }

              case 3:
              case "end":
                return _context45.stop();
            }
          }
        }, _callee45, this);
      }));

      function onDone(_x18) {
        return _onDone.apply(this, arguments);
      }

      return onDone;
    }()
  }, {
    key: "isNotified",
    value: function isNotified() {
      return this.prevHeight !== undefined;
    }
  }, {
    key: "getOnSyncProgressAfterDone",
    value: function getOnSyncProgressAfterDone() {
      return this.onSyncProgressAfterDone;
    }
  }]);
  return SyncProgressTester;
}(_WalletSyncPrinter2["default"]);
/**
 * Internal class to test all wallet notifications on sync. 
 */


var WalletSyncTester = /*#__PURE__*/function (_SyncProgressTester) {
  (0, _inherits2["default"])(WalletSyncTester, _SyncProgressTester);

  var _super3 = _createSuper(WalletSyncTester);

  function WalletSyncTester(wallet, startHeight, endHeight) {
    var _this2;

    (0, _classCallCheck2["default"])(this, WalletSyncTester);
    _this2 = _super3.call(this, wallet, startHeight, endHeight);
    (0, _assert["default"])(startHeight >= 0);
    (0, _assert["default"])(endHeight >= 0);
    _this2.incomingTotal = BigInt("0");
    _this2.outgoingTotal = BigInt("0");
    return _this2;
  }

  (0, _createClass2["default"])(WalletSyncTester, [{
    key: "onNewBlock",
    value: function onNewBlock(height) {
      if (this.isDone) {
        (0, _assert["default"])(this.wallet.getListeners().includes(this), "Listener has completed and is not registered so should not be called again");
        this.onNewBlockAfterDone = true;
      }

      if (this.walletTesterPrevHeight !== undefined) _assert["default"].equal(height, this.walletTesterPrevHeight + 1);
      (0, _assert["default"])(height >= this.startHeight);
      this.walletTesterPrevHeight = height;
    }
  }, {
    key: "onBalancesChanged",
    value: function () {
      var _onBalancesChanged = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee46(newBalance, newUnlockedBalance) {
        return _regenerator["default"].wrap(function _callee46$(_context46) {
          while (1) {
            switch (_context46.prev = _context46.next) {
              case 0:
                if (this.prevBalance !== undefined) (0, _assert["default"])(newBalance.toString() !== this.prevBalance.toString() || newUnlockedBalance.toString() !== this.prevUnlockedBalance.toString());
                this.prevBalance = newBalance;
                this.prevUnlockedBalance = newUnlockedBalance;

              case 3:
              case "end":
                return _context46.stop();
            }
          }
        }, _callee46, this);
      }));

      function onBalancesChanged(_x19, _x20) {
        return _onBalancesChanged.apply(this, arguments);
      }

      return onBalancesChanged;
    }()
  }, {
    key: "onOutputReceived",
    value: function onOutputReceived(output) {
      _assert["default"].notEqual(output, undefined);

      this.prevOutputReceived = output; // test output

      _TestUtils["default"].testUnsignedBigInt(output.getAmount());

      (0, _assert["default"])(output.getAccountIndex() >= 0);
      (0, _assert["default"])(output.getSubaddressIndex() >= 0); // test output's tx

      (0, _assert["default"])(output.getTx());
      (0, _assert["default"])(output.getTx() instanceof _index.MoneroTxWallet);
      (0, _assert["default"])(output.getTx().getHash());

      _assert["default"].equal(output.getTx().getHash().length, 64);

      (0, _assert["default"])(output.getTx().getVersion() >= 0);
      (0, _assert["default"])(output.getTx().getUnlockHeight() >= 0);

      _assert["default"].equal(output.getTx().getInputs(), undefined);

      _assert["default"].equal(output.getTx().getOutputs().length, 1);

      (0, _assert["default"])(output.getTx().getOutputs()[0] === output); // extra is not sent over the wasm bridge

      _assert["default"].equal(output.getTx().getExtra(), undefined); // add incoming amount to running total


      if (output.isLocked()) this.incomingTotal = this.incomingTotal + output.getAmount();
    }
  }, {
    key: "onOutputSpent",
    value: function onOutputSpent(output) {
      _assert["default"].notEqual(output, undefined);

      this.prevOutputSpent = output; // test output

      _TestUtils["default"].testUnsignedBigInt(output.getAmount());

      (0, _assert["default"])(output.getAccountIndex() >= 0);
      if (output.getSubaddressIndex() !== undefined) (0, _assert["default"])(output.getSubaddressIndex() >= 0); // TODO (monero-project): can be undefined because inputs not provided so one created from outgoing transfer
      // test output's tx

      (0, _assert["default"])(output.getTx());
      (0, _assert["default"])(output.getTx() instanceof _index.MoneroTxWallet);
      (0, _assert["default"])(output.getTx().getHash());

      _assert["default"].equal(output.getTx().getHash().length, 64);

      (0, _assert["default"])(output.getTx().getVersion() >= 0);
      (0, _assert["default"])(output.getTx().getUnlockHeight() >= 0);

      _assert["default"].equal(output.getTx().getInputs().length, 1);

      (0, _assert["default"])(output.getTx().getInputs()[0] === output);

      _assert["default"].equal(output.getTx().getOutputs(), undefined); // extra is not sent over the wasm bridge


      _assert["default"].equal(output.getTx().getExtra(), undefined); // add outgoing amount to running total


      if (output.isLocked()) this.outgoingTotal = this.outgoingTotal + output.getAmount();
    }
  }, {
    key: "onDone",
    value: function () {
      var _onDone2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee47(chainHeight) {
        var balance;
        return _regenerator["default"].wrap(function _callee47$(_context47) {
          while (1) {
            switch (_context47.prev = _context47.next) {
              case 0:
                _context47.next = 2;
                return (0, _get2["default"])((0, _getPrototypeOf2["default"])(WalletSyncTester.prototype), "onDone", this).call(this, chainHeight);

              case 2:
                _assert["default"].notEqual(this.walletTesterPrevHeight, undefined);

                _assert["default"].notEqual(this.prevOutputReceived, undefined);

                _assert["default"].notEqual(this.prevOutputSpent, undefined);

                balance = this.incomingTotal - this.outgoingTotal;
                _context47.t0 = _assert["default"];
                _context47.t1 = balance.toString();
                _context47.next = 10;
                return this.wallet.getBalance();

              case 10:
                _context47.t2 = _context47.sent.toString();

                _context47.t0.equal.call(_context47.t0, _context47.t1, _context47.t2);

                _context47.t3 = _assert["default"];
                _context47.t4 = this.prevBalance.toString();
                _context47.next = 16;
                return this.wallet.getBalance();

              case 16:
                _context47.t5 = _context47.sent.toString();

                _context47.t3.equal.call(_context47.t3, _context47.t4, _context47.t5);

                _context47.t6 = _assert["default"];
                _context47.t7 = this.prevUnlockedBalance.toString();
                _context47.next = 22;
                return this.wallet.getUnlockedBalance();

              case 22:
                _context47.t8 = _context47.sent.toString();

                _context47.t6.equal.call(_context47.t6, _context47.t7, _context47.t8);

              case 24:
              case "end":
                return _context47.stop();
            }
          }
        }, _callee47, this);
      }));

      function onDone(_x21) {
        return _onDone2.apply(this, arguments);
      }

      return onDone;
    }()
  }, {
    key: "getOnNewBlockAfterDone",
    value: function getOnNewBlockAfterDone() {
      return this.onNewBlockAfterDone;
    }
  }]);
  return WalletSyncTester;
}(SyncProgressTester);

var _default = TestMoneroWalletFull;
exports["default"] = _default;