"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assert = _interopRequireDefault(require("assert"));

var _StartMining = _interopRequireDefault(require("./utils/StartMining"));

var _TestUtils = _interopRequireDefault(require("./utils/TestUtils"));

var _index = require("../../index");

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

// test constants
var SEND_DIVISOR = 10;
var SEND_MAX_DIFF = 60;
var MAX_TX_PROOFS = 25; // maximum number of transactions to check for each proof, undefined to check all

var NUM_BLOCKS_LOCKED = 10;
/**
 * Test a wallet for common functionality.
 */

var TestMoneroWalletCommon = /*#__PURE__*/function () {
  /**
   * Construct the tester.
   * 
   * @param {object} testConfig - test configuration
   */
  function TestMoneroWalletCommon(testConfig) {
    (0, _classCallCheck2["default"])(this, TestMoneroWalletCommon);
    this.testConfig = testConfig;
  }
  /**
   * Called before all wallet tests.
   */


  (0, _createClass2["default"])(TestMoneroWalletCommon, [{
    key: "beforeAll",
    value: function () {
      var _beforeAll = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                console.log("Before all");
                _context.next = 3;
                return this.getTestWallet();

              case 3:
                this.wallet = _context.sent;
                _context.next = 6;
                return this.getTestDaemon();

              case 6:
                this.daemon = _context.sent;

                _TestUtils["default"].WALLET_TX_TRACKER.reset(); // all wallets need to wait for txs to confirm to reliably sync


                _context.next = 10;
                return _index.LibraryUtils.loadKeysModule();

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
    /**
     * Called before each wallet test.
     * 
     @param {object} currentTest - invoked with Mocha current test
     */

  }, {
    key: "beforeEach",
    value: function () {
      var _beforeEach = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(currentTest) {
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                console.log("Before test \"" + currentTest.title + "\"");

              case 1:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }));

      function beforeEach(_x) {
        return _beforeEach.apply(this, arguments);
      }

      return beforeEach;
    }()
    /**
     * Called after all wallet tests.
     */

  }, {
    key: "afterAll",
    value: function () {
      var _afterAll = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3() {
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                console.log("After all"); // try to stop mining

                _context3.prev = 1;
                _context3.next = 4;
                return this.daemon.stopMining();

              case 4:
                _context3.next = 8;
                break;

              case 6:
                _context3.prev = 6;
                _context3.t0 = _context3["catch"](1);

              case 8:
                _context3.next = 10;
                return this.wallet.close(true);

              case 10:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this, [[1, 6]]);
      }));

      function afterAll() {
        return _afterAll.apply(this, arguments);
      }

      return afterAll;
    }()
    /**
     * Called after each wallet test.
     * 
     @param {object} currentTest - invoked with Mocha current test
     */

  }, {
    key: "afterEach",
    value: function () {
      var _afterEach = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(currentTest) {
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                console.log("After test \"" + currentTest.title + "\"");

              case 1:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4);
      }));

      function afterEach(_x2) {
        return _afterEach.apply(this, arguments);
      }

      return afterEach;
    }()
    /**
     * Get the daemon to test.
     * 
     * @return the daemon to test
     */

  }, {
    key: "getTestDaemon",
    value: function () {
      var _getTestDaemon = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5() {
        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                return _context5.abrupt("return", _TestUtils["default"].getDaemonRpc());

              case 1:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5);
      }));

      function getTestDaemon() {
        return _getTestDaemon.apply(this, arguments);
      }

      return getTestDaemon;
    }()
    /**
     * Get the main wallet to test.
     * 
     * @return the wallet to test
     */

  }, {
    key: "getTestWallet",
    value: function () {
      var _getTestWallet = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6() {
        return _regenerator["default"].wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                throw new Error("Subclass must implement");

              case 1:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6);
      }));

      function getTestWallet() {
        return _getTestWallet.apply(this, arguments);
      }

      return getTestWallet;
    }()
    /**
     * Open a test wallet with default configuration for each wallet type.
     * 
     * @param config - configures the wallet to open
     * @return MoneroWallet is the opened wallet
     */

  }, {
    key: "openWallet",
    value: function () {
      var _openWallet = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7(config) {
        return _regenerator["default"].wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                throw new Error("Subclass must implement");

              case 1:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7);
      }));

      function openWallet(_x3) {
        return _openWallet.apply(this, arguments);
      }

      return openWallet;
    }()
    /**
     * Create a test wallet with default configuration for each wallet type.
     * 
     * @param config - configures the wallet to create
     * @return MoneroWallet is the created wallet
     */

  }, {
    key: "createWallet",
    value: function () {
      var _createWallet = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee8(config) {
        return _regenerator["default"].wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                throw new Error("Subclass must implement");

              case 1:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8);
      }));

      function createWallet(_x4) {
        return _createWallet.apply(this, arguments);
      }

      return createWallet;
    }()
    /**
     * Close a test wallet with customization for each wallet type. 
     * 
     * @param {MoneroWallet} wallet - the wallet to close
     * @param {boolean} save - whether or not to save the wallet
     */

  }, {
    key: "closeWallet",
    value: function () {
      var _closeWallet = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee9(wallet, save) {
        return _regenerator["default"].wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                throw new Error("Subclass must implement");

              case 1:
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
    /**
     * Get the wallet's supported languages for the mnemonic phrase.  This is an
     * instance method for wallet rpc and a static utility for other wallets.
     * 
     * @return {string[]} the wallet's supported languages
     */

  }, {
    key: "getMnemonicLanguages",
    value: function () {
      var _getMnemonicLanguages = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee10() {
        return _regenerator["default"].wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                throw new Error("Subclass must implement");

              case 1:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee10);
      }));

      function getMnemonicLanguages() {
        return _getMnemonicLanguages.apply(this, arguments);
      }

      return getMnemonicLanguages;
    }() // ------------------------------ BEGIN TESTS -------------------------------

  }, {
    key: "runCommonTests",
    value: function runCommonTests() {
      var that = this;
      var testConfig = this.testConfig;
      describe("Common Wallet Tests" + (testConfig.liteMode ? " (lite mode)" : ""), function () {
        // start tests by sending to multiple addresses
        if (testConfig.testRelays) it("Can send to multiple addresses in a single transaction", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee11() {
          var i;
          return _regenerator["default"].wrap(function _callee11$(_context11) {
            while (1) {
              switch (_context11.prev = _context11.next) {
                case 0:
                  i = 0;

                case 1:
                  if (!(i < 3)) {
                    _context11.next = 7;
                    break;
                  }

                  _context11.next = 4;
                  return testSendToMultiple(5, 3, false);

                case 4:
                  i++;
                  _context11.next = 1;
                  break;

                case 7:
                case "end":
                  return _context11.stop();
              }
            }
          }, _callee11);
        }))); //  --------------------------- TEST NON RELAYS -------------------------

        if (testConfig.testNonRelays) it("Can create a random wallet", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee12() {
          var e1, _wallet, path, e2;

          return _regenerator["default"].wrap(function _callee12$(_context12) {
            while (1) {
              switch (_context12.prev = _context12.next) {
                case 0:
                  e1 = undefined;
                  _context12.prev = 1;
                  _context12.next = 4;
                  return that.createWallet();

                case 4:
                  _wallet = _context12.sent;
                  _context12.prev = 5;
                  _context12.next = 8;
                  return _wallet.getPath();

                case 8:
                  path = _context12.sent;
                  _context12.next = 13;
                  break;

                case 11:
                  _context12.prev = 11;
                  _context12.t0 = _context12["catch"](5);

                case 13:
                  // TODO: factor out keys-only tests?
                  e2 = undefined;
                  _context12.prev = 14;
                  _context12.t1 = _index.MoneroUtils;
                  _context12.next = 18;
                  return _wallet.getPrimaryAddress();

                case 18:
                  _context12.t2 = _context12.sent;
                  _context12.t3 = _TestUtils["default"].NETWORK_TYPE;
                  _context12.next = 22;
                  return _context12.t1.validateAddress.call(_context12.t1, _context12.t2, _context12.t3);

                case 22:
                  _context12.t4 = _index.MoneroUtils;
                  _context12.next = 25;
                  return _wallet.getPrivateViewKey();

                case 25:
                  _context12.t5 = _context12.sent;
                  _context12.next = 28;
                  return _context12.t4.validatePrivateViewKey.call(_context12.t4, _context12.t5);

                case 28:
                  _context12.t6 = _index.MoneroUtils;
                  _context12.next = 31;
                  return _wallet.getPrivateSpendKey();

                case 31:
                  _context12.t7 = _context12.sent;
                  _context12.next = 34;
                  return _context12.t6.validatePrivateSpendKey.call(_context12.t6, _context12.t7);

                case 34:
                  _context12.t8 = _index.MoneroUtils;
                  _context12.next = 37;
                  return _wallet.getMnemonic();

                case 37:
                  _context12.t9 = _context12.sent;
                  _context12.next = 40;
                  return _context12.t8.validateMnemonic.call(_context12.t8, _context12.t9);

                case 40:
                  if (_wallet instanceof _index.MoneroWalletRpc) {
                    _context12.next = 47;
                    break;
                  }

                  _context12.t10 = _assert["default"];
                  _context12.next = 44;
                  return _wallet.getMnemonicLanguage();

                case 44:
                  _context12.t11 = _context12.sent;
                  _context12.t12 = _index.MoneroWallet.DEFAULT_LANGUAGE;

                  _context12.t10.equal.call(_context12.t10, _context12.t11, _context12.t12);

                case 47:
                  _context12.next = 52;
                  break;

                case 49:
                  _context12.prev = 49;
                  _context12.t13 = _context12["catch"](14);
                  e2 = _context12.t13;

                case 52:
                  _context12.next = 54;
                  return that.closeWallet(_wallet);

                case 54:
                  if (!(e2 !== undefined)) {
                    _context12.next = 56;
                    break;
                  }

                  throw e2;

                case 56:
                  if (!path) {
                    _context12.next = 66;
                    break;
                  }

                  _context12.prev = 57;
                  _context12.next = 60;
                  return that.createWallet({
                    path: path
                  });

                case 60:
                  throw new Error("Should have thrown error");

                case 63:
                  _context12.prev = 63;
                  _context12.t14 = _context12["catch"](57);

                  _assert["default"].equal(_context12.t14.message, "Wallet already exists: " + path);

                case 66:
                  _context12.prev = 66;
                  _context12.next = 69;
                  return that.createWallet({
                    language: "english"
                  });

                case 69:
                  throw new Error("Should have thrown error");

                case 72:
                  _context12.prev = 72;
                  _context12.t15 = _context12["catch"](66);

                  _assert["default"].equal(_context12.t15.message, "Unknown language: english");

                case 75:
                  _context12.next = 80;
                  break;

                case 77:
                  _context12.prev = 77;
                  _context12.t16 = _context12["catch"](1);
                  e1 = _context12.t16;

                case 80:
                  if (!(e1 !== undefined)) {
                    _context12.next = 82;
                    break;
                  }

                  throw e1;

                case 82:
                case "end":
                  return _context12.stop();
              }
            }
          }, _callee12, null, [[1, 77], [5, 11], [14, 49], [57, 63], [66, 72]]);
        })));
        if (testConfig.testNonRelays) it("Can create a wallet from a mnemonic phrase.", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee13() {
          var e1, primaryAddress, privateViewKey, privateSpendKey, _wallet2, path, e2, invalidMnemonic;

          return _regenerator["default"].wrap(function _callee13$(_context13) {
            while (1) {
              switch (_context13.prev = _context13.next) {
                case 0:
                  e1 = undefined;
                  _context13.prev = 1;
                  _context13.next = 4;
                  return that.wallet.getPrimaryAddress();

                case 4:
                  primaryAddress = _context13.sent;
                  _context13.next = 7;
                  return that.wallet.getPrivateViewKey();

                case 7:
                  privateViewKey = _context13.sent;
                  _context13.next = 10;
                  return that.wallet.getPrivateSpendKey();

                case 10:
                  privateSpendKey = _context13.sent;
                  _context13.next = 13;
                  return that.createWallet({
                    mnemonic: _TestUtils["default"].MNEMONIC,
                    restoreHeight: _TestUtils["default"].FIRST_RECEIVE_HEIGHT
                  });

                case 13:
                  _wallet2 = _context13.sent;
                  _context13.prev = 14;
                  _context13.next = 17;
                  return _wallet2.getPath();

                case 17:
                  path = _context13.sent;
                  _context13.next = 22;
                  break;

                case 20:
                  _context13.prev = 20;
                  _context13.t0 = _context13["catch"](14);

                case 22:
                  // TODO: factor out keys-only tests?
                  e2 = undefined;
                  _context13.prev = 23;
                  _context13.t1 = _assert["default"];
                  _context13.next = 27;
                  return _wallet2.getPrimaryAddress();

                case 27:
                  _context13.t2 = _context13.sent;
                  _context13.t3 = primaryAddress;

                  _context13.t1.equal.call(_context13.t1, _context13.t2, _context13.t3);

                  _context13.t4 = _assert["default"];
                  _context13.next = 33;
                  return _wallet2.getPrivateViewKey();

                case 33:
                  _context13.t5 = _context13.sent;
                  _context13.t6 = privateViewKey;

                  _context13.t4.equal.call(_context13.t4, _context13.t5, _context13.t6);

                  _context13.t7 = _assert["default"];
                  _context13.next = 39;
                  return _wallet2.getPrivateSpendKey();

                case 39:
                  _context13.t8 = _context13.sent;
                  _context13.t9 = privateSpendKey;

                  _context13.t7.equal.call(_context13.t7, _context13.t8, _context13.t9);

                  if (_wallet2 instanceof _index.MoneroWalletRpc) {
                    _context13.next = 49;
                    break;
                  }

                  _context13.t10 = _assert["default"];
                  _context13.next = 46;
                  return _wallet2.getMnemonicLanguage();

                case 46:
                  _context13.t11 = _context13.sent;
                  _context13.t12 = _index.MoneroWallet.DEFAULT_LANGUAGE;

                  _context13.t10.equal.call(_context13.t10, _context13.t11, _context13.t12);

                case 49:
                  _context13.next = 54;
                  break;

                case 51:
                  _context13.prev = 51;
                  _context13.t13 = _context13["catch"](23);
                  e2 = _context13.t13;

                case 54:
                  _context13.next = 56;
                  return that.closeWallet(_wallet2);

                case 56:
                  if (!(e2 !== undefined)) {
                    _context13.next = 58;
                    break;
                  }

                  throw e2;

                case 58:
                  _context13.prev = 58;
                  invalidMnemonic = "memoir desk algebra inbound innocent unplugs fully okay five inflamed giant factual ritual toyed topic snake unhappy guarded tweezers haunted inundate giant";
                  _context13.next = 62;
                  return that.createWallet(new _index.MoneroWalletConfig().setMnemonic(invalidMnemonic).setRestoreHeight(_TestUtils["default"].FIRST_RECEIVE_HEIGHT));

                case 62:
                  _context13.next = 67;
                  break;

                case 64:
                  _context13.prev = 64;
                  _context13.t14 = _context13["catch"](58);

                  _assert["default"].equal("Invalid mnemonic", _context13.t14.message);

                case 67:
                  if (!path) {
                    _context13.next = 77;
                    break;
                  }

                  _context13.prev = 68;
                  _context13.next = 71;
                  return that.createWallet({
                    path: path
                  });

                case 71:
                  throw new Error("Should have thrown error");

                case 74:
                  _context13.prev = 74;
                  _context13.t15 = _context13["catch"](68);

                  _assert["default"].equal(_context13.t15.message, "Wallet already exists: " + path);

                case 77:
                  _context13.next = 82;
                  break;

                case 79:
                  _context13.prev = 79;
                  _context13.t16 = _context13["catch"](1);
                  e1 = _context13.t16;

                case 82:
                  if (!(e1 !== undefined)) {
                    _context13.next = 84;
                    break;
                  }

                  throw e1;

                case 84:
                case "end":
                  return _context13.stop();
              }
            }
          }, _callee13, null, [[1, 79], [14, 20], [23, 51], [58, 64], [68, 74]]);
        })));
        if (testConfig.testNonRelays) it("Can create a wallet from a mnemonic phrase with a seed offset", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee14() {
          var e1, _wallet3, e2;

          return _regenerator["default"].wrap(function _callee14$(_context14) {
            while (1) {
              switch (_context14.prev = _context14.next) {
                case 0:
                  e1 = undefined;
                  _context14.prev = 1;
                  _context14.next = 4;
                  return that.createWallet({
                    mnemonic: _TestUtils["default"].MNEMONIC,
                    restoreHeight: _TestUtils["default"].FIRST_RECEIVE_HEIGHT,
                    seedOffset: "my secret offset!"
                  });

                case 4:
                  _wallet3 = _context14.sent;
                  e2 = undefined;
                  _context14.prev = 6;
                  _context14.t0 = _index.MoneroUtils;
                  _context14.next = 10;
                  return _wallet3.getMnemonic();

                case 10:
                  _context14.t1 = _context14.sent;
                  _context14.next = 13;
                  return _context14.t0.validateMnemonic.call(_context14.t0, _context14.t1);

                case 13:
                  _context14.t2 = _assert["default"];
                  _context14.next = 16;
                  return _wallet3.getMnemonic();

                case 16:
                  _context14.t3 = _context14.sent;
                  _context14.t4 = _TestUtils["default"].MNEMONIC;

                  _context14.t2.notEqual.call(_context14.t2, _context14.t3, _context14.t4);

                  _context14.t5 = _index.MoneroUtils;
                  _context14.next = 22;
                  return _wallet3.getPrimaryAddress();

                case 22:
                  _context14.t6 = _context14.sent;
                  _context14.t7 = _TestUtils["default"].NETWORK_TYPE;
                  _context14.next = 26;
                  return _context14.t5.validateAddress.call(_context14.t5, _context14.t6, _context14.t7);

                case 26:
                  _context14.t8 = _assert["default"];
                  _context14.next = 29;
                  return _wallet3.getPrimaryAddress();

                case 29:
                  _context14.t9 = _context14.sent;
                  _context14.t10 = _TestUtils["default"].ADDRESS;

                  _context14.t8.notEqual.call(_context14.t8, _context14.t9, _context14.t10);

                  _context14.t11 = _index.MoneroUtils;
                  _context14.next = 35;
                  return _wallet3.getPrimaryAddress();

                case 35:
                  _context14.t12 = _context14.sent;
                  _context14.t13 = _TestUtils["default"].NETWORK_TYPE;
                  _context14.next = 39;
                  return _context14.t11.validateAddress.call(_context14.t11, _context14.t12, _context14.t13);

                case 39:
                  _context14.t14 = _assert["default"];
                  _context14.next = 42;
                  return _wallet3.getPrimaryAddress();

                case 42:
                  _context14.t15 = _context14.sent;
                  _context14.t16 = _TestUtils["default"].ADDRESS;

                  _context14.t14.notEqual.call(_context14.t14, _context14.t15, _context14.t16);

                  if (_wallet3 instanceof _index.MoneroWalletRpc) {
                    _context14.next = 52;
                    break;
                  }

                  _context14.t17 = _assert["default"];
                  _context14.next = 49;
                  return _wallet3.getMnemonicLanguage();

                case 49:
                  _context14.t18 = _context14.sent;
                  _context14.t19 = _index.MoneroWallet.DEFAULT_LANGUAGE;

                  _context14.t17.equal.call(_context14.t17, _context14.t18, _context14.t19);

                case 52:
                  _context14.next = 57;
                  break;

                case 54:
                  _context14.prev = 54;
                  _context14.t20 = _context14["catch"](6);
                  e2 = _context14.t20;

                case 57:
                  _context14.next = 59;
                  return that.closeWallet(_wallet3);

                case 59:
                  if (!(e2 !== undefined)) {
                    _context14.next = 61;
                    break;
                  }

                  throw e2;

                case 61:
                  _context14.next = 66;
                  break;

                case 63:
                  _context14.prev = 63;
                  _context14.t21 = _context14["catch"](1);
                  e1 = _context14.t21;

                case 66:
                  if (!(e1 !== undefined)) {
                    _context14.next = 68;
                    break;
                  }

                  throw e1;

                case 68:
                case "end":
                  return _context14.stop();
              }
            }
          }, _callee14, null, [[1, 63], [6, 54]]);
        })));
        if (testConfig.testNonRelays) it("Can create a wallet from keys", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee15() {
          var e1, primaryAddress, privateViewKey, privateSpendKey, _wallet4, path, e2;

          return _regenerator["default"].wrap(function _callee15$(_context15) {
            while (1) {
              switch (_context15.prev = _context15.next) {
                case 0:
                  e1 = undefined;
                  _context15.prev = 1;
                  _context15.next = 4;
                  return that.wallet.getPrimaryAddress();

                case 4:
                  primaryAddress = _context15.sent;
                  _context15.next = 7;
                  return that.wallet.getPrivateViewKey();

                case 7:
                  privateViewKey = _context15.sent;
                  _context15.next = 10;
                  return that.wallet.getPrivateSpendKey();

                case 10:
                  privateSpendKey = _context15.sent;
                  _context15.t0 = that;
                  _context15.t1 = primaryAddress;
                  _context15.t2 = privateViewKey;
                  _context15.t3 = privateSpendKey;
                  _context15.next = 17;
                  return that.daemon.getHeight();

                case 17:
                  _context15.t4 = _context15.sent;
                  _context15.t5 = {
                    primaryAddress: _context15.t1,
                    privateViewKey: _context15.t2,
                    privateSpendKey: _context15.t3,
                    restoreHeight: _context15.t4
                  };
                  _context15.next = 21;
                  return _context15.t0.createWallet.call(_context15.t0, _context15.t5);

                case 21:
                  _wallet4 = _context15.sent;
                  _context15.prev = 22;
                  _context15.next = 25;
                  return _wallet4.getPath();

                case 25:
                  path = _context15.sent;
                  _context15.next = 30;
                  break;

                case 28:
                  _context15.prev = 28;
                  _context15.t6 = _context15["catch"](22);

                case 30:
                  // TODO: factor out keys-only tests?
                  e2 = undefined;
                  _context15.prev = 31;
                  _context15.t7 = _assert["default"];
                  _context15.next = 35;
                  return _wallet4.getPrimaryAddress();

                case 35:
                  _context15.t8 = _context15.sent;
                  _context15.t9 = primaryAddress;

                  _context15.t7.equal.call(_context15.t7, _context15.t8, _context15.t9);

                  _context15.t10 = _assert["default"];
                  _context15.next = 41;
                  return _wallet4.getPrivateViewKey();

                case 41:
                  _context15.t11 = _context15.sent;
                  _context15.t12 = privateViewKey;

                  _context15.t10.equal.call(_context15.t10, _context15.t11, _context15.t12);

                  _context15.t13 = _assert["default"];
                  _context15.next = 47;
                  return _wallet4.getPrivateSpendKey();

                case 47:
                  _context15.t14 = _context15.sent;
                  _context15.t15 = privateSpendKey;

                  _context15.t13.equal.call(_context15.t13, _context15.t14, _context15.t15);

                  _context15.t16 = !(_wallet4 instanceof _index.MoneroWalletKeys);

                  if (!_context15.t16) {
                    _context15.next = 55;
                    break;
                  }

                  _context15.next = 54;
                  return _wallet4.isConnectedToDaemon();

                case 54:
                  _context15.t16 = !_context15.sent;

                case 55:
                  if (!_context15.t16) {
                    _context15.next = 57;
                    break;
                  }

                  console.log("WARNING: wallet created from keys is not connected to authenticated daemon");

                case 57:
                  if (_wallet4 instanceof _index.MoneroWalletRpc) {
                    _context15.next = 70;
                    break;
                  }

                  _context15.t17 = _assert["default"];
                  _context15.next = 61;
                  return _wallet4.getMnemonic();

                case 61:
                  _context15.t18 = _context15.sent;
                  _context15.t19 = _TestUtils["default"].MNEMONIC;

                  _context15.t17.equal.call(_context15.t17, _context15.t18, _context15.t19);

                  _context15.t20 = _assert["default"];
                  _context15.next = 67;
                  return _wallet4.getMnemonicLanguage();

                case 67:
                  _context15.t21 = _context15.sent;
                  _context15.t22 = _index.MoneroWallet.DEFAULT_LANGUAGE;

                  _context15.t20.equal.call(_context15.t20, _context15.t21, _context15.t22);

                case 70:
                  _context15.next = 75;
                  break;

                case 72:
                  _context15.prev = 72;
                  _context15.t23 = _context15["catch"](31);
                  e2 = _context15.t23;

                case 75:
                  _context15.next = 77;
                  return that.closeWallet(_wallet4);

                case 77:
                  if (!(e2 !== undefined)) {
                    _context15.next = 79;
                    break;
                  }

                  throw e2;

                case 79:
                  if (_wallet4 instanceof _index.MoneroWalletRpc) {
                    _context15.next = 146;
                    break;
                  }

                  _context15.t24 = that;
                  _context15.t25 = privateSpendKey;
                  _context15.next = 84;
                  return that.daemon.getHeight();

                case 84:
                  _context15.t26 = _context15.sent;
                  _context15.t27 = {
                    privateSpendKey: _context15.t25,
                    restoreHeight: _context15.t26
                  };
                  _context15.next = 88;
                  return _context15.t24.createWallet.call(_context15.t24, _context15.t27);

                case 88:
                  _wallet4 = _context15.sent;
                  _context15.prev = 89;
                  _context15.next = 92;
                  return _wallet4.getPath();

                case 92:
                  path = _context15.sent;
                  _context15.next = 97;
                  break;

                case 95:
                  _context15.prev = 95;
                  _context15.t28 = _context15["catch"](89);

                case 97:
                  // TODO: factor out keys-only tests?
                  e2 = undefined;
                  _context15.prev = 98;
                  _context15.t29 = _assert["default"];
                  _context15.next = 102;
                  return _wallet4.getPrimaryAddress();

                case 102:
                  _context15.t30 = _context15.sent;
                  _context15.t31 = primaryAddress;

                  _context15.t29.equal.call(_context15.t29, _context15.t30, _context15.t31);

                  _context15.t32 = _assert["default"];
                  _context15.next = 108;
                  return _wallet4.getPrivateViewKey();

                case 108:
                  _context15.t33 = _context15.sent;
                  _context15.t34 = privateViewKey;

                  _context15.t32.equal.call(_context15.t32, _context15.t33, _context15.t34);

                  _context15.t35 = _assert["default"];
                  _context15.next = 114;
                  return _wallet4.getPrivateSpendKey();

                case 114:
                  _context15.t36 = _context15.sent;
                  _context15.t37 = privateSpendKey;

                  _context15.t35.equal.call(_context15.t35, _context15.t36, _context15.t37);

                  _context15.t38 = !(_wallet4 instanceof _index.MoneroWalletKeys);

                  if (!_context15.t38) {
                    _context15.next = 122;
                    break;
                  }

                  _context15.next = 121;
                  return _wallet4.isConnectedToDaemon();

                case 121:
                  _context15.t38 = !_context15.sent;

                case 122:
                  if (!_context15.t38) {
                    _context15.next = 124;
                    break;
                  }

                  console.log("WARNING: wallet created from keys is not connected to authenticated daemon");

                case 124:
                  if (_wallet4 instanceof _index.MoneroWalletRpc) {
                    _context15.next = 137;
                    break;
                  }

                  _context15.t39 = _assert["default"];
                  _context15.next = 128;
                  return _wallet4.getMnemonic();

                case 128:
                  _context15.t40 = _context15.sent;
                  _context15.t41 = _TestUtils["default"].MNEMONIC;

                  _context15.t39.equal.call(_context15.t39, _context15.t40, _context15.t41);

                  _context15.t42 = _assert["default"];
                  _context15.next = 134;
                  return _wallet4.getMnemonicLanguage();

                case 134:
                  _context15.t43 = _context15.sent;
                  _context15.t44 = _index.MoneroWallet.DEFAULT_LANGUAGE;

                  _context15.t42.equal.call(_context15.t42, _context15.t43, _context15.t44);

                case 137:
                  _context15.next = 142;
                  break;

                case 139:
                  _context15.prev = 139;
                  _context15.t45 = _context15["catch"](98);
                  e2 = _context15.t45;

                case 142:
                  _context15.next = 144;
                  return that.closeWallet(_wallet4);

                case 144:
                  if (!(e2 !== undefined)) {
                    _context15.next = 146;
                    break;
                  }

                  throw e2;

                case 146:
                  if (!path) {
                    _context15.next = 156;
                    break;
                  }

                  _context15.prev = 147;
                  _context15.next = 150;
                  return that.createWallet({
                    path: path
                  });

                case 150:
                  throw new Error("Should have thrown error");

                case 153:
                  _context15.prev = 153;
                  _context15.t46 = _context15["catch"](147);

                  _assert["default"].equal(_context15.t46.message, "Wallet already exists: " + path);

                case 156:
                  _context15.next = 161;
                  break;

                case 158:
                  _context15.prev = 158;
                  _context15.t47 = _context15["catch"](1);
                  e1 = _context15.t47;

                case 161:
                  if (!(e1 !== undefined)) {
                    _context15.next = 163;
                    break;
                  }

                  throw e1;

                case 163:
                case "end":
                  return _context15.stop();
              }
            }
          }, _callee15, null, [[1, 158], [22, 28], [31, 72], [89, 95], [98, 139], [147, 153]]);
        })));
        if (testConfig.testRelays) it("Can create wallets with subaddress lookahead", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee16() {
          var err, receiver;
          return _regenerator["default"].wrap(function _callee16$(_context16) {
            while (1) {
              switch (_context16.prev = _context16.next) {
                case 0:
                  _context16.prev = 0;
                  _context16.next = 3;
                  return that.createWallet({
                    accountLookahead: 1,
                    subaddressLookahead: 100000
                  });

                case 3:
                  receiver = _context16.sent;
                  _context16.t0 = that.wallet;
                  _context16.t1 = new _index.MoneroTxConfig().setAccountIndex(0);
                  _context16.next = 8;
                  return receiver.getSubaddress(0, 85000);

                case 8:
                  _context16.t2 = _context16.sent.getAddress();
                  _context16.t3 = _TestUtils["default"].MAX_FEE;
                  _context16.t4 = _context16.t1.addDestination.call(_context16.t1, _context16.t2, _context16.t3).setRelay(true);
                  _context16.next = 13;
                  return _context16.t0.createTx.call(_context16.t0, _context16.t4);

                case 13:
                  _context16.next = 15;
                  return _index.GenUtils.waitFor(1000);

                case 15:
                  _context16.next = 17;
                  return receiver.sync();

                case 17:
                  _context16.t5 = _assert["default"];
                  _context16.t6 = genUtils;
                  _context16.next = 21;
                  return receiver.getBalance();

                case 21:
                  _context16.t7 = _context16.sent;
                  _context16.t8 = new BigInteger("0");
                  _context16.t9 = _context16.t6.compareBigInt.call(_context16.t6, _context16.t7, _context16.t8);
                  _context16.t10 = _context16.t9 > 0;
                  (0, _context16.t5)(_context16.t10);
                  _context16.next = 31;
                  break;

                case 28:
                  _context16.prev = 28;
                  _context16.t11 = _context16["catch"](0);
                  err = _context16.t11;

                case 31:
                  if (!receiver) {
                    _context16.next = 34;
                    break;
                  }

                  _context16.next = 34;
                  return that.closeWallet(receiver);

                case 34:
                  if (!err) {
                    _context16.next = 36;
                    break;
                  }

                  throw err;

                case 36:
                case "end":
                  return _context16.stop();
              }
            }
          }, _callee16, null, [[0, 28]]);
        })));
        if (testConfig.testNonRelays) it("Can get the wallet's version", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee17() {
          var version;
          return _regenerator["default"].wrap(function _callee17$(_context17) {
            while (1) {
              switch (_context17.prev = _context17.next) {
                case 0:
                  _context17.next = 2;
                  return that.wallet.getVersion();

                case 2:
                  version = _context17.sent;

                  _assert["default"].equal((0, _typeof2["default"])(version.getNumber()), "number");

                  (0, _assert["default"])(version.getNumber() > 0);

                  _assert["default"].equal((0, _typeof2["default"])(version.isRelease()), "boolean");

                case 6:
                case "end":
                  return _context17.stop();
              }
            }
          }, _callee17);
        })));
        if (testConfig.testNonRelays) it("Can get the wallet's path", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee18() {
          var wallet, uuid, path;
          return _regenerator["default"].wrap(function _callee18$(_context18) {
            while (1) {
              switch (_context18.prev = _context18.next) {
                case 0:
                  _context18.next = 2;
                  return that.createWallet();

                case 2:
                  wallet = _context18.sent;
                  // set a random attribute
                  uuid = _index.GenUtils.getUUID();
                  _context18.next = 6;
                  return wallet.setAttribute("uuid", uuid);

                case 6:
                  _context18.next = 8;
                  return wallet.getPath();

                case 8:
                  path = _context18.sent;
                  _context18.next = 11;
                  return that.closeWallet(wallet, true);

                case 11:
                  _context18.next = 13;
                  return that.openWallet({
                    path: path
                  });

                case 13:
                  wallet = _context18.sent;
                  _context18.t0 = _assert["default"];
                  _context18.next = 17;
                  return wallet.getAttribute("uuid");

                case 17:
                  _context18.t1 = _context18.sent;
                  _context18.t2 = uuid;

                  _context18.t0.equal.call(_context18.t0, _context18.t1, _context18.t2);

                  _context18.next = 22;
                  return that.closeWallet(wallet);

                case 22:
                case "end":
                  return _context18.stop();
              }
            }
          }, _callee18);
        })));
        if (testConfig.testNonRelays) it("Can set the daemon connection", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee19() {
          var err, wallet;
          return _regenerator["default"].wrap(function _callee19$(_context19) {
            while (1) {
              switch (_context19.prev = _context19.next) {
                case 0:
                  _context19.prev = 0;
                  _context19.next = 3;
                  return that.createWallet({
                    serverUri: ""
                  });

                case 3:
                  wallet = _context19.sent;

                  if (!(wallet instanceof _index.MoneroWalletRpc)) {
                    _context19.next = 18;
                    break;
                  }

                  _context19.t0 = _assert["default"];
                  _context19.next = 8;
                  return wallet.getDaemonConnection();

                case 8:
                  _context19.t1 = _context19.sent;
                  _context19.t2 = new _index.MoneroRpcConnection(_TestUtils["default"].DAEMON_RPC_CONFIG);

                  _context19.t0.deepEqual.call(_context19.t0, _context19.t1, _context19.t2);

                  _context19.t3 = _assert["default"];
                  _context19.next = 14;
                  return wallet.isConnectedToDaemon();

                case 14:
                  _context19.t4 = _context19.sent;

                  _context19.t3.equal.call(_context19.t3, _context19.t4, true);

                  _context19.next = 29;
                  break;

                case 18:
                  _context19.t5 = _assert["default"];
                  _context19.next = 21;
                  return wallet.getDaemonConnection();

                case 21:
                  _context19.t6 = _context19.sent;
                  _context19.t7 = undefined;

                  _context19.t5.equal.call(_context19.t5, _context19.t6, _context19.t7);

                  _context19.t8 = _assert["default"];
                  _context19.next = 27;
                  return wallet.isConnectedToDaemon();

                case 27:
                  _context19.t9 = !_context19.sent;
                  (0, _context19.t8)(_context19.t9);

                case 29:
                  _context19.next = 31;
                  return wallet.setDaemonConnection("");

                case 31:
                  _context19.t10 = _assert["default"];
                  _context19.next = 34;
                  return wallet.getDaemonConnection();

                case 34:
                  _context19.t11 = _context19.sent;
                  _context19.t12 = undefined;

                  _context19.t10.equal.call(_context19.t10, _context19.t11, _context19.t12);

                  _context19.t13 = _assert["default"];
                  _context19.next = 40;
                  return wallet.isConnectedToDaemon();

                case 40:
                  _context19.t14 = _context19.sent;

                  _context19.t13.equal.call(_context19.t13, _context19.t14, false);

                  _context19.next = 44;
                  return wallet.setDaemonConnection(_TestUtils["default"].OFFLINE_SERVER_URI);

                case 44:
                  _context19.t15 = _assert["default"];
                  _context19.next = 47;
                  return wallet.getDaemonConnection();

                case 47:
                  _context19.t16 = _context19.sent;
                  _context19.t17 = new _index.MoneroRpcConnection(_TestUtils["default"].OFFLINE_SERVER_URI);

                  _context19.t15.deepEqual.call(_context19.t15, _context19.t16, _context19.t17);

                  _context19.t18 = _assert["default"];
                  _context19.next = 53;
                  return wallet.isConnectedToDaemon();

                case 53:
                  _context19.t19 = _context19.sent;

                  _context19.t18.equal.call(_context19.t18, _context19.t19, false);

                  _context19.next = 57;
                  return wallet.setDaemonConnection({
                    uri: _TestUtils["default"].DAEMON_RPC_CONFIG.uri,
                    username: "wronguser",
                    password: "wrongpass"
                  });

                case 57:
                  _context19.t20 = _assert["default"];
                  _context19.next = 60;
                  return wallet.getDaemonConnection();

                case 60:
                  _context19.t21 = _context19.sent.getConfig();
                  _context19.t22 = new _index.MoneroRpcConnection(_TestUtils["default"].DAEMON_RPC_CONFIG.uri, "wronguser", "wrongpass").getConfig();

                  _context19.t20.deepEqual.call(_context19.t20, _context19.t21, _context19.t22);

                  if (_TestUtils["default"].DAEMON_RPC_CONFIG.username) {
                    _context19.next = 71;
                    break;
                  }

                  _context19.t23 = _assert["default"];
                  _context19.next = 67;
                  return wallet.isConnectedToDaemon();

                case 67:
                  _context19.t24 = _context19.sent;

                  _context19.t23.equal.call(_context19.t23, _context19.t24, true);

                  _context19.next = 76;
                  break;

                case 71:
                  _context19.t25 = _assert["default"];
                  _context19.next = 74;
                  return wallet.isConnectedToDaemon();

                case 74:
                  _context19.t26 = _context19.sent;

                  _context19.t25.equal.call(_context19.t25, _context19.t26, false);

                case 76:
                  _context19.next = 78;
                  return wallet.setDaemonConnection(_TestUtils["default"].DAEMON_RPC_CONFIG);

                case 78:
                  _context19.t27 = _assert["default"];
                  _context19.next = 81;
                  return wallet.getDaemonConnection();

                case 81:
                  _context19.t28 = _context19.sent;
                  _context19.t29 = new _index.MoneroRpcConnection(_TestUtils["default"].DAEMON_RPC_CONFIG.uri, _TestUtils["default"].DAEMON_RPC_CONFIG.username, _TestUtils["default"].DAEMON_RPC_CONFIG.password);

                  _context19.t27.deepEqual.call(_context19.t27, _context19.t28, _context19.t29);

                  _context19.t30 = _assert["default"];
                  _context19.next = 87;
                  return wallet.isConnectedToDaemon();

                case 87:
                  _context19.t31 = _context19.sent;
                  (0, _context19.t30)(_context19.t31);
                  _context19.next = 91;
                  return wallet.setDaemonConnection(undefined);

                case 91:
                  _context19.t32 = _assert["default"];
                  _context19.next = 94;
                  return wallet.getDaemonConnection();

                case 94:
                  _context19.t33 = _context19.sent;
                  _context19.t34 = undefined;

                  _context19.t32.equal.call(_context19.t32, _context19.t33, _context19.t34);

                  _context19.next = 99;
                  return wallet.setDaemonConnection(_TestUtils["default"].DAEMON_RPC_CONFIG.uri);

                case 99:
                  _context19.t35 = _assert["default"];
                  _context19.next = 102;
                  return wallet.getDaemonConnection();

                case 102:
                  _context19.t36 = _context19.sent.getConfig();
                  _context19.t37 = new _index.MoneroRpcConnection(_TestUtils["default"].DAEMON_RPC_CONFIG.uri).getConfig();

                  _context19.t35.deepEqual.call(_context19.t35, _context19.t36, _context19.t37);

                  _context19.next = 107;
                  return wallet.setDaemonConnection(undefined);

                case 107:
                  _context19.t38 = _assert["default"];
                  _context19.next = 110;
                  return wallet.getDaemonConnection();

                case 110:
                  _context19.t39 = _context19.sent;
                  _context19.t40 = undefined;

                  _context19.t38.equal.call(_context19.t38, _context19.t39, _context19.t40);

                  _context19.next = 115;
                  return wallet.setDaemonConnection("www.getmonero.org");

                case 115:
                  _context19.t41 = _assert["default"];
                  _context19.next = 118;
                  return wallet.getDaemonConnection();

                case 118:
                  _context19.t42 = _context19.sent.getConfig();
                  _context19.t43 = new _index.MoneroRpcConnection("www.getmonero.org").getConfig();

                  _context19.t41.deepEqual.call(_context19.t41, _context19.t42, _context19.t43);

                  _context19.t44 = _assert["default"];
                  _context19.next = 124;
                  return wallet.isConnectedToDaemon();

                case 124:
                  _context19.t45 = !_context19.sent;
                  (0, _context19.t44)(_context19.t45);
                  _context19.next = 128;
                  return wallet.setDaemonConnection("abc123");

                case 128:
                  _context19.t46 = _assert["default"];
                  _context19.next = 131;
                  return wallet.isConnectedToDaemon();

                case 131:
                  _context19.t47 = !_context19.sent;
                  (0, _context19.t46)(_context19.t47);
                  _context19.prev = 133;
                  _context19.next = 136;
                  return wallet.sync();

                case 136:
                  throw new Error("Exception expected");

                case 139:
                  _context19.prev = 139;
                  _context19.t48 = _context19["catch"](133);

                  _assert["default"].equal(_context19.t48.message, "Wallet is not connected to daemon");

                case 142:
                  _context19.next = 147;
                  break;

                case 144:
                  _context19.prev = 144;
                  _context19.t49 = _context19["catch"](0);
                  err = _context19.t49;

                case 147:
                  _context19.next = 149;
                  return that.closeWallet(wallet);

                case 149:
                  if (!err) {
                    _context19.next = 151;
                    break;
                  }

                  throw err;

                case 151:
                case "end":
                  return _context19.stop();
              }
            }
          }, _callee19, null, [[0, 144], [133, 139]]);
        })));
        if (testConfig.testNonRelays) it("Can get the mnemonic phrase", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee20() {
          var mnemonic;
          return _regenerator["default"].wrap(function _callee20$(_context20) {
            while (1) {
              switch (_context20.prev = _context20.next) {
                case 0:
                  _context20.next = 2;
                  return that.wallet.getMnemonic();

                case 2:
                  mnemonic = _context20.sent;
                  _context20.next = 5;
                  return _index.MoneroUtils.validateMnemonic(mnemonic);

                case 5:
                  _assert["default"].equal(mnemonic, _TestUtils["default"].MNEMONIC);

                case 6:
                case "end":
                  return _context20.stop();
              }
            }
          }, _callee20);
        })));
        if (testConfig.testNonRelays) it("Can get the language of the mnemonic phrase", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee21() {
          var language;
          return _regenerator["default"].wrap(function _callee21$(_context21) {
            while (1) {
              switch (_context21.prev = _context21.next) {
                case 0:
                  _context21.next = 2;
                  return that.wallet.getMnemonicLanguage();

                case 2:
                  language = _context21.sent;

                  _assert["default"].equal(language, "English");

                case 4:
                case "end":
                  return _context21.stop();
              }
            }
          }, _callee21);
        })));
        if (testConfig.testNonRelays) it("Can get a list of supported languages for the mnemonic phrase", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee22() {
          var languages, _iterator, _step, language;

          return _regenerator["default"].wrap(function _callee22$(_context22) {
            while (1) {
              switch (_context22.prev = _context22.next) {
                case 0:
                  _context22.next = 2;
                  return that.getMnemonicLanguages();

                case 2:
                  languages = _context22.sent;
                  (0, _assert["default"])(Array.isArray(languages));
                  (0, _assert["default"])(languages.length);
                  _iterator = _createForOfIteratorHelper(languages);

                  try {
                    for (_iterator.s(); !(_step = _iterator.n()).done;) {
                      language = _step.value;
                      (0, _assert["default"])(language);
                    }
                  } catch (err) {
                    _iterator.e(err);
                  } finally {
                    _iterator.f();
                  }

                case 7:
                case "end":
                  return _context22.stop();
              }
            }
          }, _callee22);
        })));
        if (testConfig.testNonRelays) it("Can get the private view key", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee23() {
          var privateViewKey;
          return _regenerator["default"].wrap(function _callee23$(_context23) {
            while (1) {
              switch (_context23.prev = _context23.next) {
                case 0:
                  _context23.next = 2;
                  return that.wallet.getPrivateViewKey();

                case 2:
                  privateViewKey = _context23.sent;
                  _context23.next = 5;
                  return _index.MoneroUtils.validatePrivateViewKey(privateViewKey);

                case 5:
                case "end":
                  return _context23.stop();
              }
            }
          }, _callee23);
        })));
        if (testConfig.testNonRelays) it("Can get the private spend key", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee24() {
          var privateSpendKey;
          return _regenerator["default"].wrap(function _callee24$(_context24) {
            while (1) {
              switch (_context24.prev = _context24.next) {
                case 0:
                  _context24.next = 2;
                  return that.wallet.getPrivateSpendKey();

                case 2:
                  privateSpendKey = _context24.sent;
                  _context24.next = 5;
                  return _index.MoneroUtils.validatePrivateSpendKey(privateSpendKey);

                case 5:
                case "end":
                  return _context24.stop();
              }
            }
          }, _callee24);
        })));
        if (testConfig.testNonRelays) it("Can get the public view key", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee25() {
          var publicViewKey;
          return _regenerator["default"].wrap(function _callee25$(_context25) {
            while (1) {
              switch (_context25.prev = _context25.next) {
                case 0:
                  _context25.next = 2;
                  return that.wallet.getPublicViewKey();

                case 2:
                  publicViewKey = _context25.sent;
                  _context25.next = 5;
                  return _index.MoneroUtils.validatePublicViewKey(publicViewKey);

                case 5:
                case "end":
                  return _context25.stop();
              }
            }
          }, _callee25);
        })));
        if (testConfig.testNonRelays) it("Can get the public spend key", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee26() {
          var publicSpendKey;
          return _regenerator["default"].wrap(function _callee26$(_context26) {
            while (1) {
              switch (_context26.prev = _context26.next) {
                case 0:
                  _context26.next = 2;
                  return that.wallet.getPublicSpendKey();

                case 2:
                  publicSpendKey = _context26.sent;
                  _context26.next = 5;
                  return _index.MoneroUtils.validatePublicSpendKey(publicSpendKey);

                case 5:
                case "end":
                  return _context26.stop();
              }
            }
          }, _callee26);
        })));
        if (testConfig.testNonRelays) it("Can get the primary address", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee27() {
          var primaryAddress;
          return _regenerator["default"].wrap(function _callee27$(_context27) {
            while (1) {
              switch (_context27.prev = _context27.next) {
                case 0:
                  _context27.next = 2;
                  return that.wallet.getPrimaryAddress();

                case 2:
                  primaryAddress = _context27.sent;
                  _context27.next = 5;
                  return _index.MoneroUtils.validateAddress(primaryAddress, _TestUtils["default"].NETWORK_TYPE);

                case 5:
                  _context27.t0 = _assert["default"];
                  _context27.t1 = primaryAddress;
                  _context27.next = 9;
                  return that.wallet.getAddress(0, 0);

                case 9:
                  _context27.t2 = _context27.sent;

                  _context27.t0.equal.call(_context27.t0, _context27.t1, _context27.t2);

                case 11:
                case "end":
                  return _context27.stop();
              }
            }
          }, _callee27);
        })));
        if (testConfig.testNonRelays) it("Can get the address of a subaddress at a specified account and subaddress index", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee28() {
          var _iterator2, _step2, account, _iterator3, _step3, subaddress;

          return _regenerator["default"].wrap(function _callee28$(_context28) {
            while (1) {
              switch (_context28.prev = _context28.next) {
                case 0:
                  _context28.t0 = _assert["default"];
                  _context28.next = 3;
                  return that.wallet.getSubaddress(0, 0);

                case 3:
                  _context28.t1 = _context28.sent.getAddress();
                  _context28.next = 6;
                  return that.wallet.getPrimaryAddress();

                case 6:
                  _context28.t2 = _context28.sent;

                  _context28.t0.equal.call(_context28.t0, _context28.t1, _context28.t2);

                  _context28.t3 = _createForOfIteratorHelper;
                  _context28.next = 11;
                  return that.wallet.getAccounts(true);

                case 11:
                  _context28.t4 = _context28.sent;
                  _iterator2 = (0, _context28.t3)(_context28.t4);
                  _context28.prev = 13;

                  _iterator2.s();

                case 15:
                  if ((_step2 = _iterator2.n()).done) {
                    _context28.next = 40;
                    break;
                  }

                  account = _step2.value;
                  _iterator3 = _createForOfIteratorHelper(account.getSubaddresses());
                  _context28.prev = 18;

                  _iterator3.s();

                case 20:
                  if ((_step3 = _iterator3.n()).done) {
                    _context28.next = 30;
                    break;
                  }

                  subaddress = _step3.value;
                  _context28.t5 = _assert["default"];
                  _context28.next = 25;
                  return that.wallet.getAddress(account.getIndex(), subaddress.getIndex());

                case 25:
                  _context28.t6 = _context28.sent;
                  _context28.t7 = subaddress.getAddress();

                  _context28.t5.equal.call(_context28.t5, _context28.t6, _context28.t7);

                case 28:
                  _context28.next = 20;
                  break;

                case 30:
                  _context28.next = 35;
                  break;

                case 32:
                  _context28.prev = 32;
                  _context28.t8 = _context28["catch"](18);

                  _iterator3.e(_context28.t8);

                case 35:
                  _context28.prev = 35;

                  _iterator3.f();

                  return _context28.finish(35);

                case 38:
                  _context28.next = 15;
                  break;

                case 40:
                  _context28.next = 45;
                  break;

                case 42:
                  _context28.prev = 42;
                  _context28.t9 = _context28["catch"](13);

                  _iterator2.e(_context28.t9);

                case 45:
                  _context28.prev = 45;

                  _iterator2.f();

                  return _context28.finish(45);

                case 48:
                case "end":
                  return _context28.stop();
              }
            }
          }, _callee28, null, [[13, 42, 45, 48], [18, 32, 35, 38]]);
        })));
        if (testConfig.testNonRelays) it("Can get addresses out of range of used accounts and subaddresses", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee29() {
          return _regenerator["default"].wrap(function _callee29$(_context29) {
            while (1) {
              switch (_context29.prev = _context29.next) {
                case 0:
                  _context29.next = 2;
                  return that._testGetSubaddressAddressOutOfRange();

                case 2:
                case "end":
                  return _context29.stop();
              }
            }
          }, _callee29);
        })));
        if (testConfig.testNonRelays) it("Can get the account and subaddress indices of an address", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee30() {
          var accounts, accountIdx, subaddressIdx, address, subaddress, nonWalletAddress;
          return _regenerator["default"].wrap(function _callee30$(_context30) {
            while (1) {
              switch (_context30.prev = _context30.next) {
                case 0:
                  _context30.next = 2;
                  return that.wallet.getAccounts(true);

                case 2:
                  accounts = _context30.sent;
                  accountIdx = accounts.length - 1;
                  subaddressIdx = accounts[accountIdx].getSubaddresses().length - 1;
                  _context30.next = 7;
                  return that.wallet.getAddress(accountIdx, subaddressIdx);

                case 7:
                  address = _context30.sent;
                  (0, _assert["default"])(address);

                  _assert["default"].equal((0, _typeof2["default"])(address), "string"); // get address index


                  _context30.next = 12;
                  return that.wallet.getAddressIndex(address);

                case 12:
                  subaddress = _context30.sent;

                  _assert["default"].equal(subaddress.getAccountIndex(), accountIdx);

                  _assert["default"].equal(subaddress.getIndex(), subaddressIdx); // test valid but unfound address


                  _context30.next = 17;
                  return _TestUtils["default"].getExternalWalletAddress();

                case 17:
                  nonWalletAddress = _context30.sent;
                  _context30.prev = 18;
                  _context30.next = 21;
                  return that.wallet.getAddressIndex(nonWalletAddress);

                case 21:
                  subaddress = _context30.sent;
                  throw new Error("fail");

                case 25:
                  _context30.prev = 25;
                  _context30.t0 = _context30["catch"](18);

                  _assert["default"].equal(_context30.t0.message, "Address doesn't belong to the wallet");

                case 28:
                  _context30.prev = 28;
                  _context30.next = 31;
                  return that.wallet.getAddressIndex("this is definitely not an address");

                case 31:
                  subaddress = _context30.sent;
                  throw new Error("fail");

                case 35:
                  _context30.prev = 35;
                  _context30.t1 = _context30["catch"](28);

                  _assert["default"].equal(_context30.t1.message, "Invalid address");

                case 38:
                case "end":
                  return _context30.stop();
              }
            }
          }, _callee30, null, [[18, 25], [28, 35]]);
        })));
        if (testConfig.testNonRelays) it("Can get an integrated address given a payment id", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee31() {
          var address, paymentId, integratedAddress, primaryAddress, subaddress, invalidPaymentId;
          return _regenerator["default"].wrap(function _callee31$(_context31) {
            while (1) {
              switch (_context31.prev = _context31.next) {
                case 0:
                  _context31.next = 2;
                  return that.wallet.getPrimaryAddress();

                case 2:
                  address = _context31.sent;
                  // test valid payment id
                  paymentId = "03284e41c342f036";
                  _context31.next = 6;
                  return that.wallet.getIntegratedAddress(undefined, paymentId);

                case 6:
                  integratedAddress = _context31.sent;

                  _assert["default"].equal(integratedAddress.getStandardAddress(), address);

                  _assert["default"].equal(integratedAddress.getPaymentId(), paymentId); // test undefined payment id which generates a new one


                  _context31.next = 11;
                  return that.wallet.getIntegratedAddress();

                case 11:
                  integratedAddress = _context31.sent;

                  _assert["default"].equal(integratedAddress.getStandardAddress(), address);

                  (0, _assert["default"])(integratedAddress.getPaymentId().length); // test with primary address

                  _context31.next = 16;
                  return that.wallet.getPrimaryAddress();

                case 16:
                  primaryAddress = _context31.sent;
                  _context31.next = 19;
                  return that.wallet.getIntegratedAddress(primaryAddress, paymentId);

                case 19:
                  integratedAddress = _context31.sent;

                  _assert["default"].equal(integratedAddress.getStandardAddress(), primaryAddress);

                  _assert["default"].equal(integratedAddress.getPaymentId(), paymentId); // test with subaddress


                  _context31.next = 24;
                  return that.wallet.getSubaddresses(0);

                case 24:
                  _context31.t0 = _context31.sent.length;

                  if (!(_context31.t0 < 2)) {
                    _context31.next = 28;
                    break;
                  }

                  _context31.next = 28;
                  return that.wallet.createSubaddress(0);

                case 28:
                  _context31.next = 30;
                  return that.wallet.getSubaddress(0, 1);

                case 30:
                  subaddress = _context31.sent.getAddress();
                  _context31.prev = 31;
                  _context31.next = 34;
                  return that.wallet.getIntegratedAddress(subaddress);

                case 34:
                  integratedAddress = _context31.sent;
                  throw new Error("Getting integrated address from subaddress should have failed");

                case 38:
                  _context31.prev = 38;
                  _context31.t1 = _context31["catch"](31);

                  _assert["default"].equal(_context31.t1.message, "Subaddress shouldn't be used");

                case 41:
                  // test invalid payment id
                  invalidPaymentId = "invalid_payment_id_123456";
                  _context31.prev = 42;
                  _context31.next = 45;
                  return that.wallet.getIntegratedAddress(undefined, invalidPaymentId);

                case 45:
                  integratedAddress = _context31.sent;
                  throw new Error("Getting integrated address with invalid payment id " + invalidPaymentId + " should have thrown a RPC exception");

                case 49:
                  _context31.prev = 49;
                  _context31.t2 = _context31["catch"](42);

                  //assert.equal(e.getCode(), -5);  // TODO: error codes part of rpc only?
                  _assert["default"].equal(_context31.t2.message, "Invalid payment ID: " + invalidPaymentId);

                case 52:
                case "end":
                  return _context31.stop();
              }
            }
          }, _callee31, null, [[31, 38], [42, 49]]);
        })));
        if (testConfig.testNonRelays) it("Can decode an integrated address", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee32() {
          var integratedAddress, decodedAddress;
          return _regenerator["default"].wrap(function _callee32$(_context32) {
            while (1) {
              switch (_context32.prev = _context32.next) {
                case 0:
                  _context32.next = 2;
                  return that.wallet.getIntegratedAddress(undefined, "03284e41c342f036");

                case 2:
                  integratedAddress = _context32.sent;
                  _context32.next = 5;
                  return that.wallet.decodeIntegratedAddress(integratedAddress.toString());

                case 5:
                  decodedAddress = _context32.sent;

                  _assert["default"].deepEqual(decodedAddress, integratedAddress); // decode invalid address


                  _context32.prev = 7;
                  _context32.t0 = console;
                  _context32.next = 11;
                  return that.wallet.decodeIntegratedAddress("bad address");

                case 11:
                  _context32.t1 = _context32.sent;

                  _context32.t0.log.call(_context32.t0, _context32.t1);

                  throw new Error("Should have failed decoding bad address");

                case 16:
                  _context32.prev = 16;
                  _context32.t2 = _context32["catch"](7);

                  _assert["default"].equal(_context32.t2.message, "Invalid address");

                case 19:
                case "end":
                  return _context32.stop();
              }
            }
          }, _callee32, null, [[7, 16]]);
        }))); // TODO: test syncing from start height

        if (testConfig.testNonRelays) it("Can sync (without progress)", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee33() {
          var numBlocks, chainHeight, result;
          return _regenerator["default"].wrap(function _callee33$(_context33) {
            while (1) {
              switch (_context33.prev = _context33.next) {
                case 0:
                  numBlocks = 100;
                  _context33.next = 3;
                  return that.daemon.getHeight();

                case 3:
                  chainHeight = _context33.sent;
                  (0, _assert["default"])(chainHeight >= numBlocks);
                  _context33.next = 7;
                  return that.wallet.sync(chainHeight - numBlocks);

                case 7:
                  result = _context33.sent;
                  // sync to end of chain
                  (0, _assert["default"])(result instanceof _index.MoneroSyncResult);
                  (0, _assert["default"])(result.getNumBlocksFetched() >= 0);

                  _assert["default"].equal((0, _typeof2["default"])(result.getReceivedMoney()), "boolean");

                case 11:
                case "end":
                  return _context33.stop();
              }
            }
          }, _callee33);
        })));
        if (testConfig.testNonRelays) it("Can get the current height that the wallet is synchronized to", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee34() {
          var height;
          return _regenerator["default"].wrap(function _callee34$(_context34) {
            while (1) {
              switch (_context34.prev = _context34.next) {
                case 0:
                  _context34.next = 2;
                  return that.wallet.getHeight();

                case 2:
                  height = _context34.sent;
                  (0, _assert["default"])(height >= 0);

                case 4:
                case "end":
                  return _context34.stop();
              }
            }
          }, _callee34);
        })));
        if (testConfig.testNonRelays) it("Can get a blockchain height by date", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee35() {
          var DAY_MS, yesterday, dates, i, lastHeight, _i, _dates, date, _height, height, tomorrow;

          return _regenerator["default"].wrap(function _callee35$(_context35) {
            while (1) {
              switch (_context35.prev = _context35.next) {
                case 0:
                  // collect dates to test starting 100 days ago
                  DAY_MS = 24 * 60 * 60 * 1000;
                  yesterday = new Date(new Date().getTime() - DAY_MS); // TODO monero-project: today's date can throw exception as "in future" so we test up to yesterday

                  dates = [];

                  for (i = 99; i >= 0; i--) {
                    dates.push(new Date(yesterday.getTime() - DAY_MS * i)); // subtract i days
                  } // test heights by date


                  lastHeight = undefined;
                  _i = 0, _dates = dates;

                case 6:
                  if (!(_i < _dates.length)) {
                    _context35.next = 17;
                    break;
                  }

                  date = _dates[_i];
                  _context35.next = 10;
                  return that.wallet.getHeightByDate(date.getYear() + 1900, date.getMonth() + 1, date.getDate());

                case 10:
                  _height = _context35.sent;
                  (0, _assert["default"])(_height >= 0);
                  if (lastHeight != undefined) (0, _assert["default"])(_height >= lastHeight);
                  lastHeight = _height;

                case 14:
                  _i++;
                  _context35.next = 6;
                  break;

                case 17:
                  (0, _assert["default"])(lastHeight >= 0);
                  _context35.next = 20;
                  return that.wallet.getHeight();

                case 20:
                  height = _context35.sent;
                  (0, _assert["default"])(height >= 0); // test future date

                  _context35.prev = 22;
                  tomorrow = new Date(yesterday.getTime() + DAY_MS * 2);
                  _context35.next = 26;
                  return that.wallet.getHeightByDate(tomorrow.getYear() + 1900, tomorrow.getMonth() + 1, tomorrow.getDate());

                case 26:
                  throw new Error("Expected exception on future date");

                case 29:
                  _context35.prev = 29;
                  _context35.t0 = _context35["catch"](22);

                  _assert["default"].equal(_context35.t0.message, "specified date is in the future");

                case 32:
                case "end":
                  return _context35.stop();
              }
            }
          }, _callee35, null, [[22, 29]]);
        })));
        if (testConfig.testNonRelays) it("Can get the locked and unlocked balances of the wallet, accounts, and subaddresses", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee36() {
          var accounts, accountsBalance, accountsUnlockedBalance, _iterator4, _step4, account, subaddressesBalance, subaddressesUnlockedBalance, _iterator5, _step5, subaddress;

          return _regenerator["default"].wrap(function _callee36$(_context36) {
            while (1) {
              switch (_context36.prev = _context36.next) {
                case 0:
                  _context36.next = 2;
                  return that.wallet.getAccounts(true);

                case 2:
                  accounts = _context36.sent;
                  // test that balances add up between accounts and wallet
                  accountsBalance = BigInt(0);
                  accountsUnlockedBalance = BigInt(0);
                  _iterator4 = _createForOfIteratorHelper(accounts);
                  _context36.prev = 6;

                  _iterator4.s();

                case 8:
                  if ((_step4 = _iterator4.n()).done) {
                    _context36.next = 57;
                    break;
                  }

                  account = _step4.value;
                  accountsBalance = accountsBalance + account.getBalance();
                  accountsUnlockedBalance = accountsUnlockedBalance + account.getUnlockedBalance(); // test that balances add up between subaddresses and accounts

                  subaddressesBalance = BigInt(0);
                  subaddressesUnlockedBalance = BigInt(0);
                  _iterator5 = _createForOfIteratorHelper(account.getSubaddresses());
                  _context36.prev = 15;

                  _iterator5.s();

                case 17:
                  if ((_step5 = _iterator5.n()).done) {
                    _context36.next = 35;
                    break;
                  }

                  subaddress = _step5.value;
                  subaddressesBalance = subaddressesBalance + subaddress.getBalance();
                  subaddressesUnlockedBalance = subaddressesUnlockedBalance + subaddress.getUnlockedBalance(); // test that balances are consistent with getAccounts() call

                  _context36.t0 = _assert["default"];
                  _context36.next = 24;
                  return that.wallet.getBalance(subaddress.getAccountIndex(), subaddress.getIndex());

                case 24:
                  _context36.t1 = _context36.sent.toString();
                  _context36.t2 = subaddress.getBalance().toString();

                  _context36.t0.equal.call(_context36.t0, _context36.t1, _context36.t2);

                  _context36.t3 = _assert["default"];
                  _context36.next = 30;
                  return that.wallet.getUnlockedBalance(subaddress.getAccountIndex(), subaddress.getIndex());

                case 30:
                  _context36.t4 = _context36.sent.toString();
                  _context36.t5 = subaddress.getUnlockedBalance().toString();

                  _context36.t3.equal.call(_context36.t3, _context36.t4, _context36.t5);

                case 33:
                  _context36.next = 17;
                  break;

                case 35:
                  _context36.next = 40;
                  break;

                case 37:
                  _context36.prev = 37;
                  _context36.t6 = _context36["catch"](15);

                  _iterator5.e(_context36.t6);

                case 40:
                  _context36.prev = 40;

                  _iterator5.f();

                  return _context36.finish(40);

                case 43:
                  _context36.t7 = _assert["default"];
                  _context36.next = 46;
                  return that.wallet.getBalance(account.getIndex());

                case 46:
                  _context36.t8 = _context36.sent.toString();
                  _context36.t9 = subaddressesBalance.toString();

                  _context36.t7.equal.call(_context36.t7, _context36.t8, _context36.t9);

                  _context36.t10 = _assert["default"];
                  _context36.next = 52;
                  return that.wallet.getUnlockedBalance(account.getIndex());

                case 52:
                  _context36.t11 = _context36.sent.toString();
                  _context36.t12 = subaddressesUnlockedBalance.toString();

                  _context36.t10.equal.call(_context36.t10, _context36.t11, _context36.t12);

                case 55:
                  _context36.next = 8;
                  break;

                case 57:
                  _context36.next = 62;
                  break;

                case 59:
                  _context36.prev = 59;
                  _context36.t13 = _context36["catch"](6);

                  _iterator4.e(_context36.t13);

                case 62:
                  _context36.prev = 62;

                  _iterator4.f();

                  return _context36.finish(62);

                case 65:
                  _TestUtils["default"].testUnsignedBigInt(accountsBalance);

                  _TestUtils["default"].testUnsignedBigInt(accountsUnlockedBalance);

                  _context36.t14 = _assert["default"];
                  _context36.next = 70;
                  return that.wallet.getBalance();

                case 70:
                  _context36.t15 = _context36.sent.toString();
                  _context36.t16 = accountsBalance.toString();

                  _context36.t14.equal.call(_context36.t14, _context36.t15, _context36.t16);

                  _context36.t17 = _assert["default"];
                  _context36.next = 76;
                  return that.wallet.getUnlockedBalance();

                case 76:
                  _context36.t18 = _context36.sent.toString();
                  _context36.t19 = accountsUnlockedBalance.toString();

                  _context36.t17.equal.call(_context36.t17, _context36.t18, _context36.t19);

                  _context36.prev = 79;
                  _context36.next = 82;
                  return that.wallet.getBalance(undefined, 0);

                case 82:
                  throw new Error("Should have failed");

                case 85:
                  _context36.prev = 85;
                  _context36.t20 = _context36["catch"](79);

                  _assert["default"].notEqual(_context36.t20.message, "Should have failed");

                case 88:
                case "end":
                  return _context36.stop();
              }
            }
          }, _callee36, null, [[6, 59, 62, 65], [15, 37, 40, 43], [79, 85]]);
        })));
        if (testConfig.testNonRelays) it("Can get accounts without subaddresses", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee38() {
          var accounts;
          return _regenerator["default"].wrap(function _callee38$(_context38) {
            while (1) {
              switch (_context38.prev = _context38.next) {
                case 0:
                  _context38.next = 2;
                  return that.wallet.getAccounts();

                case 2:
                  accounts = _context38.sent;
                  (0, _assert["default"])(accounts.length > 0);
                  accounts.map( /*#__PURE__*/function () {
                    var _ref28 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee37(account) {
                      return _regenerator["default"].wrap(function _callee37$(_context37) {
                        while (1) {
                          switch (_context37.prev = _context37.next) {
                            case 0:
                              _context37.next = 2;
                              return testAccount(account);

                            case 2:
                              (0, _assert["default"])(account.getSubaddresses() === undefined);

                            case 3:
                            case "end":
                              return _context37.stop();
                          }
                        }
                      }, _callee37);
                    }));

                    return function (_x7) {
                      return _ref28.apply(this, arguments);
                    };
                  }());

                case 5:
                case "end":
                  return _context38.stop();
              }
            }
          }, _callee38);
        })));
        if (testConfig.testNonRelays) it("Can get accounts with subaddresses", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee40() {
          var accounts;
          return _regenerator["default"].wrap(function _callee40$(_context40) {
            while (1) {
              switch (_context40.prev = _context40.next) {
                case 0:
                  _context40.next = 2;
                  return that.wallet.getAccounts(true);

                case 2:
                  accounts = _context40.sent;
                  (0, _assert["default"])(accounts.length > 0);
                  accounts.map( /*#__PURE__*/function () {
                    var _ref30 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee39(account) {
                      return _regenerator["default"].wrap(function _callee39$(_context39) {
                        while (1) {
                          switch (_context39.prev = _context39.next) {
                            case 0:
                              _context39.next = 2;
                              return testAccount(account);

                            case 2:
                              (0, _assert["default"])(account.getSubaddresses().length > 0);

                            case 3:
                            case "end":
                              return _context39.stop();
                          }
                        }
                      }, _callee39);
                    }));

                    return function (_x8) {
                      return _ref30.apply(this, arguments);
                    };
                  }());

                case 5:
                case "end":
                  return _context40.stop();
              }
            }
          }, _callee40);
        })));
        if (testConfig.testNonRelays) it("Can get an account at a specified index", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee41() {
          var accounts, _iterator6, _step6, account, retrieved;

          return _regenerator["default"].wrap(function _callee41$(_context41) {
            while (1) {
              switch (_context41.prev = _context41.next) {
                case 0:
                  _context41.next = 2;
                  return that.wallet.getAccounts();

                case 2:
                  accounts = _context41.sent;
                  (0, _assert["default"])(accounts.length > 0);
                  _iterator6 = _createForOfIteratorHelper(accounts);
                  _context41.prev = 5;

                  _iterator6.s();

                case 7:
                  if ((_step6 = _iterator6.n()).done) {
                    _context41.next = 21;
                    break;
                  }

                  account = _step6.value;
                  _context41.next = 11;
                  return testAccount(account);

                case 11:
                  _context41.next = 13;
                  return that.wallet.getAccount(account.getIndex());

                case 13:
                  retrieved = _context41.sent;
                  (0, _assert["default"])(retrieved.getSubaddresses() === undefined); // test with subaddresses

                  _context41.next = 17;
                  return that.wallet.getAccount(account.getIndex(), true);

                case 17:
                  retrieved = _context41.sent;
                  (0, _assert["default"])(retrieved.getSubaddresses().length > 0);

                case 19:
                  _context41.next = 7;
                  break;

                case 21:
                  _context41.next = 26;
                  break;

                case 23:
                  _context41.prev = 23;
                  _context41.t0 = _context41["catch"](5);

                  _iterator6.e(_context41.t0);

                case 26:
                  _context41.prev = 26;

                  _iterator6.f();

                  return _context41.finish(26);

                case 29:
                case "end":
                  return _context41.stop();
              }
            }
          }, _callee41, null, [[5, 23, 26, 29]]);
        })));
        if (testConfig.testNonRelays) it("Can create a new account without a label", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee42() {
          var accountsBefore, createdAccount;
          return _regenerator["default"].wrap(function _callee42$(_context42) {
            while (1) {
              switch (_context42.prev = _context42.next) {
                case 0:
                  _context42.next = 2;
                  return that.wallet.getAccounts();

                case 2:
                  accountsBefore = _context42.sent;
                  _context42.next = 5;
                  return that.wallet.createAccount();

                case 5:
                  createdAccount = _context42.sent;
                  _context42.next = 8;
                  return testAccount(createdAccount);

                case 8:
                  _context42.t0 = _assert["default"];
                  _context42.next = 11;
                  return that.wallet.getAccounts();

                case 11:
                  _context42.t1 = _context42.sent.length;
                  _context42.t2 = _context42.t1 - 1;
                  _context42.t3 = accountsBefore.length;

                  _context42.t0.equal.call(_context42.t0, _context42.t2, _context42.t3);

                case 15:
                case "end":
                  return _context42.stop();
              }
            }
          }, _callee42);
        })));
        if (testConfig.testNonRelays) it("Can create a new account with a label", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee43() {
          var accountsBefore, label, createdAccount;
          return _regenerator["default"].wrap(function _callee43$(_context43) {
            while (1) {
              switch (_context43.prev = _context43.next) {
                case 0:
                  _context43.next = 2;
                  return that.wallet.getAccounts();

                case 2:
                  accountsBefore = _context43.sent;
                  label = _index.GenUtils.getUUID();
                  _context43.next = 6;
                  return that.wallet.createAccount(label);

                case 6:
                  createdAccount = _context43.sent;
                  _context43.next = 9;
                  return testAccount(createdAccount);

                case 9:
                  _context43.t0 = _assert["default"];
                  _context43.next = 12;
                  return that.wallet.getAccounts();

                case 12:
                  _context43.t1 = _context43.sent.length;
                  _context43.t2 = _context43.t1 - 1;
                  _context43.t3 = accountsBefore.length;

                  _context43.t0.equal.call(_context43.t0, _context43.t2, _context43.t3);

                  _context43.t4 = _assert["default"];
                  _context43.next = 19;
                  return that.wallet.getSubaddress(createdAccount.getIndex(), 0);

                case 19:
                  _context43.t5 = _context43.sent.getLabel();
                  _context43.t6 = label;

                  _context43.t4.equal.call(_context43.t4, _context43.t5, _context43.t6);

                  _context43.next = 24;
                  return that.wallet.getAccount(createdAccount.getIndex());

                case 24:
                  createdAccount = _context43.sent;
                  _context43.next = 27;
                  return testAccount(createdAccount);

                case 27:
                  _context43.next = 29;
                  return that.wallet.createAccount(label);

                case 29:
                  createdAccount = _context43.sent;
                  _context43.next = 32;
                  return testAccount(createdAccount);

                case 32:
                  _context43.t7 = _assert["default"];
                  _context43.next = 35;
                  return that.wallet.getAccounts();

                case 35:
                  _context43.t8 = _context43.sent.length;
                  _context43.t9 = _context43.t8 - 2;
                  _context43.t10 = accountsBefore.length;

                  _context43.t7.equal.call(_context43.t7, _context43.t9, _context43.t10);

                  _context43.t11 = _assert["default"];
                  _context43.next = 42;
                  return that.wallet.getSubaddress(createdAccount.getIndex(), 0);

                case 42:
                  _context43.t12 = _context43.sent.getLabel();
                  _context43.t13 = label;

                  _context43.t11.equal.call(_context43.t11, _context43.t12, _context43.t13);

                  _context43.next = 47;
                  return that.wallet.getAccount(createdAccount.getIndex());

                case 47:
                  createdAccount = _context43.sent;
                  _context43.next = 50;
                  return testAccount(createdAccount);

                case 50:
                case "end":
                  return _context43.stop();
              }
            }
          }, _callee43);
        })));
        if (testConfig.testNonRelays) it("Can get subaddresses at a specified account index", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee44() {
          var accounts, _iterator7, _step7, _loop;

          return _regenerator["default"].wrap(function _callee44$(_context45) {
            while (1) {
              switch (_context45.prev = _context45.next) {
                case 0:
                  _context45.next = 2;
                  return that.wallet.getAccounts();

                case 2:
                  accounts = _context45.sent;
                  (0, _assert["default"])(accounts.length > 0);
                  _iterator7 = _createForOfIteratorHelper(accounts);
                  _context45.prev = 5;
                  _loop = /*#__PURE__*/_regenerator["default"].mark(function _loop() {
                    var account, subaddresses;
                    return _regenerator["default"].wrap(function _loop$(_context44) {
                      while (1) {
                        switch (_context44.prev = _context44.next) {
                          case 0:
                            account = _step7.value;
                            _context44.next = 3;
                            return that.wallet.getSubaddresses(account.getIndex());

                          case 3:
                            subaddresses = _context44.sent;
                            (0, _assert["default"])(subaddresses.length > 0);
                            subaddresses.map(function (subaddress) {
                              testSubaddress(subaddress);
                              (0, _assert["default"])(account.getIndex() === subaddress.getAccountIndex());
                            });

                          case 6:
                          case "end":
                            return _context44.stop();
                        }
                      }
                    }, _loop);
                  });

                  _iterator7.s();

                case 8:
                  if ((_step7 = _iterator7.n()).done) {
                    _context45.next = 12;
                    break;
                  }

                  return _context45.delegateYield(_loop(), "t0", 10);

                case 10:
                  _context45.next = 8;
                  break;

                case 12:
                  _context45.next = 17;
                  break;

                case 14:
                  _context45.prev = 14;
                  _context45.t1 = _context45["catch"](5);

                  _iterator7.e(_context45.t1);

                case 17:
                  _context45.prev = 17;

                  _iterator7.f();

                  return _context45.finish(17);

                case 20:
                case "end":
                  return _context45.stop();
              }
            }
          }, _callee44, null, [[5, 14, 17, 20]]);
        })));
        if (testConfig.testNonRelays) it("Can get subaddresses at specified account and subaddress indices", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee45() {
          var accounts, _iterator8, _step8, account, subaddresses, subaddressIndices, fetchedSubaddresses;

          return _regenerator["default"].wrap(function _callee45$(_context46) {
            while (1) {
              switch (_context46.prev = _context46.next) {
                case 0:
                  _context46.next = 2;
                  return that.wallet.getAccounts();

                case 2:
                  accounts = _context46.sent;
                  (0, _assert["default"])(accounts.length > 0);
                  _iterator8 = _createForOfIteratorHelper(accounts);
                  _context46.prev = 5;

                  _iterator8.s();

                case 7:
                  if ((_step8 = _iterator8.n()).done) {
                    _context46.next = 22;
                    break;
                  }

                  account = _step8.value;
                  _context46.next = 11;
                  return that.wallet.getSubaddresses(account.getIndex());

                case 11:
                  subaddresses = _context46.sent;
                  (0, _assert["default"])(subaddresses.length > 0); // remove a subaddress for query if possible

                  if (subaddresses.length > 1) subaddresses.splice(0, 1); // get subaddress indices

                  subaddressIndices = subaddresses.map(function (subaddress) {
                    return subaddress.getIndex();
                  });
                  (0, _assert["default"])(subaddressIndices.length > 0); // fetch subaddresses by indices

                  _context46.next = 18;
                  return that.wallet.getSubaddresses(account.getIndex(), subaddressIndices);

                case 18:
                  fetchedSubaddresses = _context46.sent;

                  // original subaddresses (minus one removed if applicable) is equal to fetched subaddresses
                  _assert["default"].deepEqual(fetchedSubaddresses, subaddresses);

                case 20:
                  _context46.next = 7;
                  break;

                case 22:
                  _context46.next = 27;
                  break;

                case 24:
                  _context46.prev = 24;
                  _context46.t0 = _context46["catch"](5);

                  _iterator8.e(_context46.t0);

                case 27:
                  _context46.prev = 27;

                  _iterator8.f();

                  return _context46.finish(27);

                case 30:
                case "end":
                  return _context46.stop();
              }
            }
          }, _callee45, null, [[5, 24, 27, 30]]);
        })));
        if (testConfig.testNonRelays) it("Can get a subaddress at a specified account and subaddress index", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee46() {
          var accounts, _iterator9, _step9, account, subaddresses, _iterator10, _step10, subaddress;

          return _regenerator["default"].wrap(function _callee46$(_context47) {
            while (1) {
              switch (_context47.prev = _context47.next) {
                case 0:
                  _context47.next = 2;
                  return that.wallet.getAccounts();

                case 2:
                  accounts = _context47.sent;
                  (0, _assert["default"])(accounts.length > 0);
                  _iterator9 = _createForOfIteratorHelper(accounts);
                  _context47.prev = 5;

                  _iterator9.s();

                case 7:
                  if ((_step9 = _iterator9.n()).done) {
                    _context47.next = 43;
                    break;
                  }

                  account = _step9.value;
                  _context47.next = 11;
                  return that.wallet.getSubaddresses(account.getIndex());

                case 11:
                  subaddresses = _context47.sent;
                  (0, _assert["default"])(subaddresses.length > 0);
                  _iterator10 = _createForOfIteratorHelper(subaddresses);
                  _context47.prev = 14;

                  _iterator10.s();

                case 16:
                  if ((_step10 = _iterator10.n()).done) {
                    _context47.next = 33;
                    break;
                  }

                  subaddress = _step10.value;
                  testSubaddress(subaddress);
                  _context47.t0 = _assert["default"];
                  _context47.next = 22;
                  return that.wallet.getSubaddress(account.getIndex(), subaddress.getIndex());

                case 22:
                  _context47.t1 = _context47.sent;
                  _context47.t2 = subaddress;

                  _context47.t0.deepEqual.call(_context47.t0, _context47.t1, _context47.t2);

                  _context47.t3 = _assert["default"];
                  _context47.next = 28;
                  return that.wallet.getSubaddresses(account.getIndex(), subaddress.getIndex());

                case 28:
                  _context47.t4 = _context47.sent[0];
                  _context47.t5 = subaddress;

                  _context47.t3.deepEqual.call(_context47.t3, _context47.t4, _context47.t5);

                case 31:
                  _context47.next = 16;
                  break;

                case 33:
                  _context47.next = 38;
                  break;

                case 35:
                  _context47.prev = 35;
                  _context47.t6 = _context47["catch"](14);

                  _iterator10.e(_context47.t6);

                case 38:
                  _context47.prev = 38;

                  _iterator10.f();

                  return _context47.finish(38);

                case 41:
                  _context47.next = 7;
                  break;

                case 43:
                  _context47.next = 48;
                  break;

                case 45:
                  _context47.prev = 45;
                  _context47.t7 = _context47["catch"](5);

                  _iterator9.e(_context47.t7);

                case 48:
                  _context47.prev = 48;

                  _iterator9.f();

                  return _context47.finish(48);

                case 51:
                case "end":
                  return _context47.stop();
              }
            }
          }, _callee46, null, [[5, 45, 48, 51], [14, 35, 38, 41]]);
        })));
        if (testConfig.testNonRelays) it("Can create a subaddress with and without a label", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee47() {
          var accounts, accountIdx, subaddresses, subaddress, subaddressesNew, uuid;
          return _regenerator["default"].wrap(function _callee47$(_context48) {
            while (1) {
              switch (_context48.prev = _context48.next) {
                case 0:
                  _context48.next = 2;
                  return that.wallet.getAccounts();

                case 2:
                  accounts = _context48.sent;

                  if (!(accounts.length < 2)) {
                    _context48.next = 6;
                    break;
                  }

                  _context48.next = 6;
                  return that.wallet.createAccount();

                case 6:
                  _context48.next = 8;
                  return that.wallet.getAccounts();

                case 8:
                  accounts = _context48.sent;
                  (0, _assert["default"])(accounts.length > 1);
                  accountIdx = 0;

                case 11:
                  if (!(accountIdx < 2)) {
                    _context48.next = 42;
                    break;
                  }

                  _context48.next = 14;
                  return that.wallet.getSubaddresses(accountIdx);

                case 14:
                  subaddresses = _context48.sent;
                  _context48.next = 17;
                  return that.wallet.createSubaddress(accountIdx);

                case 17:
                  subaddress = _context48.sent;

                  _assert["default"].equal(subaddress.getLabel(), undefined);

                  testSubaddress(subaddress);
                  _context48.next = 22;
                  return that.wallet.getSubaddresses(accountIdx);

                case 22:
                  subaddressesNew = _context48.sent;

                  _assert["default"].equal(subaddressesNew.length - 1, subaddresses.length);

                  _assert["default"].deepEqual(subaddressesNew[subaddressesNew.length - 1].toString(), subaddress.toString()); // create subaddress with label


                  _context48.next = 27;
                  return that.wallet.getSubaddresses(accountIdx);

                case 27:
                  subaddresses = _context48.sent;
                  uuid = _index.GenUtils.getUUID();
                  _context48.next = 31;
                  return that.wallet.createSubaddress(accountIdx, uuid);

                case 31:
                  subaddress = _context48.sent;

                  _assert["default"].equal(uuid, subaddress.getLabel());

                  testSubaddress(subaddress);
                  _context48.next = 36;
                  return that.wallet.getSubaddresses(accountIdx);

                case 36:
                  subaddressesNew = _context48.sent;

                  _assert["default"].equal(subaddressesNew.length - 1, subaddresses.length);

                  _assert["default"].deepEqual(subaddressesNew[subaddressesNew.length - 1].toString(), subaddress.toString());

                case 39:
                  accountIdx++;
                  _context48.next = 11;
                  break;

                case 42:
                case "end":
                  return _context48.stop();
              }
            }
          }, _callee47);
        })));
        if (testConfig.testNonRelays) it("Can get transactions in the wallet", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee48() {
          var nonDefaultIncoming, txs, blocksPerHeight, i, copy1, copy2, merged, _iterator11, _step11, transfer, block;

          return _regenerator["default"].wrap(function _callee48$(_context49) {
            while (1) {
              switch (_context49.prev = _context49.next) {
                case 0:
                  nonDefaultIncoming = false;
                  _context49.next = 3;
                  return that._getAndTestTxs(that.wallet, undefined, true);

                case 3:
                  txs = _context49.sent;
                  (0, _assert["default"])(txs.length > 0, "Wallet has no txs to test");

                  _assert["default"].equal(txs[0].getHeight(), _TestUtils["default"].FIRST_RECEIVE_HEIGHT, "First tx's restore height must match the restore height in TestUtils"); // test each tranasction


                  blocksPerHeight = {};
                  i = 0;

                case 8:
                  if (!(i < txs.length)) {
                    _context49.next = 26;
                    break;
                  }

                  _context49.next = 11;
                  return that._testTxWallet(txs[i], {
                    wallet: that.wallet
                  });

                case 11:
                  _context49.next = 13;
                  return that._testTxWallet(txs[i], {
                    wallet: that.wallet
                  });

                case 13:
                  _assert["default"].equal(txs[i].toString(), txs[i].toString()); // test merging equivalent txs


                  copy1 = txs[i].copy();
                  copy2 = txs[i].copy();
                  if (copy1.isConfirmed()) copy1.setBlock(txs[i].getBlock().copy().setTxs([copy1]));
                  if (copy2.isConfirmed()) copy2.setBlock(txs[i].getBlock().copy().setTxs([copy2]));
                  merged = copy1.merge(copy2);
                  _context49.next = 21;
                  return that._testTxWallet(merged, {
                    wallet: that.wallet
                  });

                case 21:
                  // find non-default incoming
                  if (txs[i].getIncomingTransfers()) {
                    _iterator11 = _createForOfIteratorHelper(txs[i].getIncomingTransfers());

                    try {
                      for (_iterator11.s(); !(_step11 = _iterator11.n()).done;) {
                        transfer = _step11.value;
                        if (transfer.getAccountIndex() !== 0 && transfer.getSubaddressIndex() !== 0) nonDefaultIncoming = true;
                      }
                    } catch (err) {
                      _iterator11.e(err);
                    } finally {
                      _iterator11.f();
                    }
                  } // ensure unique block reference per height


                  if (txs[i].isConfirmed()) {
                    block = blocksPerHeight[txs[i].getHeight()];
                    if (block === undefined) blocksPerHeight[txs[i].getHeight()] = txs[i].getBlock();else (0, _assert["default"])(block === txs[i].getBlock(), "Block references for same height must be same");
                  }

                case 23:
                  i++;
                  _context49.next = 8;
                  break;

                case 26:
                  // ensure non-default account and subaddress tested
                  (0, _assert["default"])(nonDefaultIncoming, "No incoming transfers found to non-default account and subaddress; run send-to-multiple tests first");

                case 27:
                case "end":
                  return _context49.stop();
              }
            }
          }, _callee48);
        })));
        if (testConfig.testNonRelays) it("Can get transactions by hash", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee49() {
          var maxNumTxs, txs, fetchedTx, txId1, txId2, fetchedTxs, txHashes, _iterator12, _step12, tx, i, missingTxHash, missingTxHashes, _i2;

          return _regenerator["default"].wrap(function _callee49$(_context50) {
            while (1) {
              switch (_context50.prev = _context50.next) {
                case 0:
                  maxNumTxs = 10; // max number of txs to test
                  // fetch all txs for testing

                  _context50.next = 3;
                  return that.wallet.getTxs();

                case 3:
                  txs = _context50.sent;
                  (0, _assert["default"])(txs.length > 1, "Test requires at least 2 txs to fetch by hash"); // randomly pick a few for fetching by hash

                  _index.GenUtils.shuffle(txs);

                  txs = txs.slice(0, Math.min(txs.length, maxNumTxs)); // test fetching by hash

                  _context50.next = 9;
                  return that.wallet.getTx(txs[0].getHash());

                case 9:
                  fetchedTx = _context50.sent;

                  _assert["default"].equal(fetchedTx.getHash(), txs[0].getHash());

                  _context50.next = 13;
                  return that._testTxWallet(fetchedTx);

                case 13:
                  // test fetching by hashes
                  txId1 = txs[0].getHash();
                  txId2 = txs[1].getHash();
                  _context50.next = 17;
                  return that.wallet.getTxs([txId1, txId2]);

                case 17:
                  fetchedTxs = _context50.sent;

                  _assert["default"].equal(2, fetchedTxs.length); // test fetching by hashes as collection


                  txHashes = [];
                  _iterator12 = _createForOfIteratorHelper(txs);

                  try {
                    for (_iterator12.s(); !(_step12 = _iterator12.n()).done;) {
                      tx = _step12.value;
                      txHashes.push(tx.getHash());
                    }
                  } catch (err) {
                    _iterator12.e(err);
                  } finally {
                    _iterator12.f();
                  }

                  _context50.next = 24;
                  return that.wallet.getTxs(txHashes);

                case 24:
                  fetchedTxs = _context50.sent;

                  _assert["default"].equal(fetchedTxs.length, txs.length);

                  i = 0;

                case 27:
                  if (!(i < txs.length)) {
                    _context50.next = 34;
                    break;
                  }

                  _assert["default"].equal(fetchedTxs[i].getHash(), txs[i].getHash());

                  _context50.next = 31;
                  return that._testTxWallet(fetchedTxs[i]);

                case 31:
                  i++;
                  _context50.next = 27;
                  break;

                case 34:
                  // test fetching with missing tx hashes
                  missingTxHash = "d01ede9cde813b2a693069b640c4b99c5adbdb49fbbd8da2c16c8087d0c3e320";
                  txHashes.push(missingTxHash);
                  missingTxHashes = [];
                  _context50.next = 39;
                  return that.wallet.getTxs(txHashes, missingTxHashes);

                case 39:
                  fetchedTxs = _context50.sent;

                  _assert["default"].equal(1, missingTxHashes.length);

                  _assert["default"].equal(missingTxHash, missingTxHashes[0]);

                  _assert["default"].equal(txs.length, fetchedTxs.length);

                  _i2 = 0;

                case 44:
                  if (!(_i2 < txs.length)) {
                    _context50.next = 51;
                    break;
                  }

                  _assert["default"].equal(txs[_i2].getHash(), fetchedTxs[_i2].getHash());

                  _context50.next = 48;
                  return that._testTxWallet(fetchedTxs[_i2]);

                case 48:
                  _i2++;
                  _context50.next = 44;
                  break;

                case 51:
                case "end":
                  return _context50.stop();
              }
            }
          }, _callee49);
        })));
        if (testConfig.testNonRelays && !testConfig.liteMode) it("Can get transactions with additional configuration", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee50() {
          var randomTxs, _iterator13, _step13, randomTx, txHashes, _iterator14, _step14, _randomTx, _txs, merged, txs, _iterator15, _step15, tx, _iterator16, _step16, _tx, _iterator17, _step17, _tx2, _iterator18, _step18, _tx3, _iterator28, _step28, transfer, _iterator19, _step19, _tx4, accountIdx, _iterator20, _step20, _tx5, _found, _iterator29, _step29, _transfer, _iterator21, _step21, _tx6, _found2, _iterator30, _step30, _transfer2, txQuery, _iterator22, _step22, _tx7, _iterator23, _step23, _tx8, found, _iterator24, _step24, _tx9, outputQuery, _iterator25, _step25, _tx10, _iterator31, _step31, _output, _iterator26, _step26, _tx11, _iterator27, _step27, _tx12;

          return _regenerator["default"].wrap(function _callee50$(_context51) {
            while (1) {
              switch (_context51.prev = _context51.next) {
                case 0:
                  _context51.next = 2;
                  return getRandomTransactions(that.wallet, undefined, 3, 5);

                case 2:
                  randomTxs = _context51.sent;
                  _iterator13 = _createForOfIteratorHelper(randomTxs);
                  _context51.prev = 4;

                  _iterator13.s();

                case 6:
                  if ((_step13 = _iterator13.n()).done) {
                    _context51.next = 12;
                    break;
                  }

                  randomTx = _step13.value;
                  _context51.next = 10;
                  return that._testTxWallet(randomTx);

                case 10:
                  _context51.next = 6;
                  break;

                case 12:
                  _context51.next = 17;
                  break;

                case 14:
                  _context51.prev = 14;
                  _context51.t0 = _context51["catch"](4);

                  _iterator13.e(_context51.t0);

                case 17:
                  _context51.prev = 17;

                  _iterator13.f();

                  return _context51.finish(17);

                case 20:
                  // get transactions by hash
                  txHashes = [];
                  _iterator14 = _createForOfIteratorHelper(randomTxs);
                  _context51.prev = 22;

                  _iterator14.s();

                case 24:
                  if ((_step14 = _iterator14.n()).done) {
                    _context51.next = 36;
                    break;
                  }

                  _randomTx = _step14.value;
                  txHashes.push(_randomTx.getHash());
                  _context51.next = 29;
                  return that._getAndTestTxs(that.wallet, {
                    hash: _randomTx.getHash()
                  }, true);

                case 29:
                  _txs = _context51.sent;

                  _assert["default"].equal(_txs.length, 1);

                  merged = _txs[0].merge(_randomTx.copy()); // txs change with chain so check mergeability

                  _context51.next = 34;
                  return that._testTxWallet(merged);

                case 34:
                  _context51.next = 24;
                  break;

                case 36:
                  _context51.next = 41;
                  break;

                case 38:
                  _context51.prev = 38;
                  _context51.t1 = _context51["catch"](22);

                  _iterator14.e(_context51.t1);

                case 41:
                  _context51.prev = 41;

                  _iterator14.f();

                  return _context51.finish(41);

                case 44:
                  _context51.next = 46;
                  return that._getAndTestTxs(that.wallet, {
                    hashes: txHashes
                  });

                case 46:
                  txs = _context51.sent;

                  _assert["default"].equal(txs.length, randomTxs.length);

                  _iterator15 = _createForOfIteratorHelper(txs);

                  try {
                    for (_iterator15.s(); !(_step15 = _iterator15.n()).done;) {
                      tx = _step15.value;
                      (0, _assert["default"])(txHashes.includes(tx.getHash()));
                    } // get transactions with an outgoing transfer

                  } catch (err) {
                    _iterator15.e(err);
                  } finally {
                    _iterator15.f();
                  }

                  _context51.next = 52;
                  return that._getAndTestTxs(that.wallet, {
                    isOutgoing: true
                  }, true);

                case 52:
                  txs = _context51.sent;
                  _iterator16 = _createForOfIteratorHelper(txs);
                  _context51.prev = 54;

                  _iterator16.s();

                case 56:
                  if ((_step16 = _iterator16.n()).done) {
                    _context51.next = 64;
                    break;
                  }

                  _tx = _step16.value;
                  (0, _assert["default"])(_tx.isOutgoing());
                  (0, _assert["default"])(_tx.getOutgoingTransfer() instanceof _index.MoneroTransfer);
                  _context51.next = 62;
                  return testTransfer(_tx.getOutgoingTransfer());

                case 62:
                  _context51.next = 56;
                  break;

                case 64:
                  _context51.next = 69;
                  break;

                case 66:
                  _context51.prev = 66;
                  _context51.t2 = _context51["catch"](54);

                  _iterator16.e(_context51.t2);

                case 69:
                  _context51.prev = 69;

                  _iterator16.f();

                  return _context51.finish(69);

                case 72:
                  _context51.next = 74;
                  return that._getAndTestTxs(that.wallet, {
                    isOutgoing: false
                  }, true);

                case 74:
                  txs = _context51.sent;
                  _iterator17 = _createForOfIteratorHelper(txs);

                  try {
                    for (_iterator17.s(); !(_step17 = _iterator17.n()).done;) {
                      _tx2 = _step17.value;

                      _assert["default"].equal(_tx2.getOutgoingTransfer(), undefined);
                    } // get transactions with incoming transfers

                  } catch (err) {
                    _iterator17.e(err);
                  } finally {
                    _iterator17.f();
                  }

                  _context51.next = 79;
                  return that._getAndTestTxs(that.wallet, {
                    isIncoming: true
                  }, true);

                case 79:
                  txs = _context51.sent;
                  _iterator18 = _createForOfIteratorHelper(txs);

                  try {
                    for (_iterator18.s(); !(_step18 = _iterator18.n()).done;) {
                      _tx3 = _step18.value;
                      (0, _assert["default"])(_tx3.getIncomingTransfers().length > 0);
                      _iterator28 = _createForOfIteratorHelper(_tx3.getIncomingTransfers());

                      try {
                        for (_iterator28.s(); !(_step28 = _iterator28.n()).done;) {
                          transfer = _step28.value;
                          (0, _assert["default"])(transfer instanceof _index.MoneroTransfer);
                        }
                      } catch (err) {
                        _iterator28.e(err);
                      } finally {
                        _iterator28.f();
                      }
                    } // get transactions without incoming transfers

                  } catch (err) {
                    _iterator18.e(err);
                  } finally {
                    _iterator18.f();
                  }

                  _context51.next = 84;
                  return that._getAndTestTxs(that.wallet, {
                    isIncoming: false
                  }, true);

                case 84:
                  txs = _context51.sent;
                  _iterator19 = _createForOfIteratorHelper(txs);

                  try {
                    for (_iterator19.s(); !(_step19 = _iterator19.n()).done;) {
                      _tx4 = _step19.value;

                      _assert["default"].equal(_tx4.getIncomingTransfers(), undefined);
                    } // get transactions associated with an account

                  } catch (err) {
                    _iterator19.e(err);
                  } finally {
                    _iterator19.f();
                  }

                  accountIdx = 1;
                  _context51.next = 90;
                  return that.wallet.getTxs({
                    transferQuery: {
                      accountIndex: accountIdx
                    }
                  });

                case 90:
                  txs = _context51.sent;
                  _iterator20 = _createForOfIteratorHelper(txs);
                  _context51.prev = 92;

                  _iterator20.s();

                case 94:
                  if ((_step20 = _iterator20.n()).done) {
                    _context51.next = 123;
                    break;
                  }

                  _tx5 = _step20.value;
                  _found = false;

                  if (!(_tx5.getOutgoingTransfer() && _tx5.getOutgoingTransfer().getAccountIndex() === accountIdx)) {
                    _context51.next = 101;
                    break;
                  }

                  _found = true;
                  _context51.next = 120;
                  break;

                case 101:
                  if (!_tx5.getIncomingTransfers()) {
                    _context51.next = 120;
                    break;
                  }

                  _iterator29 = _createForOfIteratorHelper(_tx5.getIncomingTransfers());
                  _context51.prev = 103;

                  _iterator29.s();

                case 105:
                  if ((_step29 = _iterator29.n()).done) {
                    _context51.next = 112;
                    break;
                  }

                  _transfer = _step29.value;

                  if (!(_transfer.getAccountIndex() === accountIdx)) {
                    _context51.next = 110;
                    break;
                  }

                  _found = true;
                  return _context51.abrupt("break", 112);

                case 110:
                  _context51.next = 105;
                  break;

                case 112:
                  _context51.next = 117;
                  break;

                case 114:
                  _context51.prev = 114;
                  _context51.t3 = _context51["catch"](103);

                  _iterator29.e(_context51.t3);

                case 117:
                  _context51.prev = 117;

                  _iterator29.f();

                  return _context51.finish(117);

                case 120:
                  (0, _assert["default"])(_found, "Transaction is not associated with account " + accountIdx + ":\n" + _tx5.toString());

                case 121:
                  _context51.next = 94;
                  break;

                case 123:
                  _context51.next = 128;
                  break;

                case 125:
                  _context51.prev = 125;
                  _context51.t4 = _context51["catch"](92);

                  _iterator20.e(_context51.t4);

                case 128:
                  _context51.prev = 128;

                  _iterator20.f();

                  return _context51.finish(128);

                case 131:
                  _context51.next = 133;
                  return that.wallet.getTxs({
                    transferQuery: {
                      isIncoming: true,
                      accountIndex: accountIdx
                    }
                  });

                case 133:
                  txs = _context51.sent;
                  _iterator21 = _createForOfIteratorHelper(txs);
                  _context51.prev = 135;

                  _iterator21.s();

                case 137:
                  if ((_step21 = _iterator21.n()).done) {
                    _context51.next = 162;
                    break;
                  }

                  _tx6 = _step21.value;
                  (0, _assert["default"])(_tx6.getIncomingTransfers().length > 0);
                  _found2 = false;
                  _iterator30 = _createForOfIteratorHelper(_tx6.getIncomingTransfers());
                  _context51.prev = 142;

                  _iterator30.s();

                case 144:
                  if ((_step30 = _iterator30.n()).done) {
                    _context51.next = 151;
                    break;
                  }

                  _transfer2 = _step30.value;

                  if (!(_transfer2.getAccountIndex() === accountIdx)) {
                    _context51.next = 149;
                    break;
                  }

                  _found2 = true;
                  return _context51.abrupt("break", 151);

                case 149:
                  _context51.next = 144;
                  break;

                case 151:
                  _context51.next = 156;
                  break;

                case 153:
                  _context51.prev = 153;
                  _context51.t5 = _context51["catch"](142);

                  _iterator30.e(_context51.t5);

                case 156:
                  _context51.prev = 156;

                  _iterator30.f();

                  return _context51.finish(156);

                case 159:
                  (0, _assert["default"])(_found2, "No incoming transfers to account " + accountIdx + " found:\n" + _tx6.toString());

                case 160:
                  _context51.next = 137;
                  break;

                case 162:
                  _context51.next = 167;
                  break;

                case 164:
                  _context51.prev = 164;
                  _context51.t6 = _context51["catch"](135);

                  _iterator21.e(_context51.t6);

                case 167:
                  _context51.prev = 167;

                  _iterator21.f();

                  return _context51.finish(167);

                case 170:
                  // get txs with manually built query that are confirmed and have an outgoing transfer from account 0
                  txQuery = new _index.MoneroTxQuery();
                  txQuery.setIsConfirmed(true);
                  txQuery.setTransferQuery(new _index.MoneroTransferQuery().setAccountIndex(0).setIsOutgoing(true));
                  _context51.next = 175;
                  return that._getAndTestTxs(that.wallet, txQuery, true);

                case 175:
                  txs = _context51.sent;
                  _iterator22 = _createForOfIteratorHelper(txs);

                  try {
                    for (_iterator22.s(); !(_step22 = _iterator22.n()).done;) {
                      _tx7 = _step22.value;
                      if (!_tx7.isConfirmed()) console.log(_tx7.toString());

                      _assert["default"].equal(_tx7.isConfirmed(), true);

                      (0, _assert["default"])(_tx7.getOutgoingTransfer());

                      _assert["default"].equal(_tx7.getOutgoingTransfer().getAccountIndex(), 0);
                    } // get txs with outgoing transfers that have destinations to account 1

                  } catch (err) {
                    _iterator22.e(err);
                  } finally {
                    _iterator22.f();
                  }

                  _context51.next = 180;
                  return that._getAndTestTxs(that.wallet, {
                    transferQuery: {
                      hasDestinations: true,
                      accountIndex: 0
                    }
                  });

                case 180:
                  txs = _context51.sent;
                  _iterator23 = _createForOfIteratorHelper(txs);

                  try {
                    for (_iterator23.s(); !(_step23 = _iterator23.n()).done;) {
                      _tx8 = _step23.value;
                      (0, _assert["default"])(_tx8.getOutgoingTransfer());
                      (0, _assert["default"])(_tx8.getOutgoingTransfer().getDestinations().length > 0);
                    } // include outputs with transactions

                  } catch (err) {
                    _iterator23.e(err);
                  } finally {
                    _iterator23.f();
                  }

                  _context51.next = 185;
                  return that._getAndTestTxs(that.wallet, {
                    includeOutputs: true
                  }, true);

                case 185:
                  txs = _context51.sent;
                  found = false;
                  _iterator24 = _createForOfIteratorHelper(txs);

                  try {
                    for (_iterator24.s(); !(_step24 = _iterator24.n()).done;) {
                      _tx9 = _step24.value;

                      if (_tx9.getOutputs()) {
                        (0, _assert["default"])(_tx9.getOutputs().length > 0);
                        found = true;
                      } else {
                        (0, _assert["default"])(_tx9.isOutgoing() || _tx9.isIncoming() && !_tx9.isConfirmed()); // TODO: monero-wallet-rpc: return outputs for unconfirmed txs
                      }
                    }
                  } catch (err) {
                    _iterator24.e(err);
                  } finally {
                    _iterator24.f();
                  }

                  (0, _assert["default"])(found, "No outputs found in txs"); // get txs with input query // TODO: no inputs returned to filter
                  // get txs with output query

                  outputQuery = new _index.MoneroOutputQuery().setIsSpent(false).setAccountIndex(1).setSubaddressIndex(2);
                  _context51.next = 193;
                  return that.wallet.getTxs(new _index.MoneroTxQuery().setOutputQuery(outputQuery));

                case 193:
                  txs = _context51.sent;
                  (0, _assert["default"])(txs.length > 0);
                  _iterator25 = _createForOfIteratorHelper(txs);
                  _context51.prev = 196;

                  _iterator25.s();

                case 198:
                  if ((_step25 = _iterator25.n()).done) {
                    _context51.next = 224;
                    break;
                  }

                  _tx10 = _step25.value;
                  (0, _assert["default"])(_tx10.getOutputs().length > 0);
                  found = false;
                  _iterator31 = _createForOfIteratorHelper(_tx10.getOutputs());
                  _context51.prev = 203;

                  _iterator31.s();

                case 205:
                  if ((_step31 = _iterator31.n()).done) {
                    _context51.next = 212;
                    break;
                  }

                  _output = _step31.value;

                  if (!(_output.isSpent() === false && _output.getAccountIndex() === 1 && _output.getSubaddressIndex() === 2)) {
                    _context51.next = 210;
                    break;
                  }

                  found = true;
                  return _context51.abrupt("break", 212);

                case 210:
                  _context51.next = 205;
                  break;

                case 212:
                  _context51.next = 217;
                  break;

                case 214:
                  _context51.prev = 214;
                  _context51.t7 = _context51["catch"](203);

                  _iterator31.e(_context51.t7);

                case 217:
                  _context51.prev = 217;

                  _iterator31.f();

                  return _context51.finish(217);

                case 220:
                  if (found) {
                    _context51.next = 222;
                    break;
                  }

                  throw new Error("Tx does not contain specified output");

                case 222:
                  _context51.next = 198;
                  break;

                case 224:
                  _context51.next = 229;
                  break;

                case 226:
                  _context51.prev = 226;
                  _context51.t8 = _context51["catch"](196);

                  _iterator25.e(_context51.t8);

                case 229:
                  _context51.prev = 229;

                  _iterator25.f();

                  return _context51.finish(229);

                case 232:
                  _context51.next = 234;
                  return that.wallet.getTxs(new _index.MoneroTxQuery().setIsLocked(false));

                case 234:
                  txs = _context51.sent;
                  (0, _assert["default"])(txs.length > 0);
                  _iterator26 = _createForOfIteratorHelper(txs);

                  try {
                    for (_iterator26.s(); !(_step26 = _iterator26.n()).done;) {
                      _tx11 = _step26.value;

                      _assert["default"].equal(_tx11.isLocked(), false);
                    } // get confirmed transactions sent from/to same wallet with a transfer with destinations

                  } catch (err) {
                    _iterator26.e(err);
                  } finally {
                    _iterator26.f();
                  }

                  _context51.next = 240;
                  return that.wallet.getTxs({
                    isIncoming: true,
                    isOutgoing: true,
                    isConfirmed: true,
                    includeOutputs: true,
                    transferQuery: {
                      hasDestinations: true
                    }
                  });

                case 240:
                  txs = _context51.sent;
                  _iterator27 = _createForOfIteratorHelper(txs);

                  try {
                    for (_iterator27.s(); !(_step27 = _iterator27.n()).done;) {
                      _tx12 = _step27.value;
                      (0, _assert["default"])(_tx12.isIncoming());
                      (0, _assert["default"])(_tx12.isOutgoing());
                      (0, _assert["default"])(_tx12.isConfirmed());
                      (0, _assert["default"])(_tx12.getOutputs().length > 0);

                      _assert["default"].notEqual(_tx12.getOutgoingTransfer(), undefined);

                      _assert["default"].notEqual(_tx12.getOutgoingTransfer().getDestinations(), undefined);

                      (0, _assert["default"])(_tx12.getOutgoingTransfer().getDestinations().length > 0);
                    }
                  } catch (err) {
                    _iterator27.e(err);
                  } finally {
                    _iterator27.f();
                  }

                case 243:
                case "end":
                  return _context51.stop();
              }
            }
          }, _callee50, null, [[4, 14, 17, 20], [22, 38, 41, 44], [54, 66, 69, 72], [92, 125, 128, 131], [103, 114, 117, 120], [135, 164, 167, 170], [142, 153, 156, 159], [196, 226, 229, 232], [203, 214, 217, 220]]);
        })));
        if (testConfig.testNonRelays) it("Can get transactions by height", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee51() {
          var txs, txHeights, _iterator32, _step32, _tx14, heightCounts, heightModes, modeHeight, modeTxs, modeTxsByRange, fetched, heights, _iterator33, _step33, tx, minHeight, maxHeight, unfilteredCount, _iterator34, _step34, _tx13, height;

          return _regenerator["default"].wrap(function _callee51$(_context52) {
            while (1) {
              switch (_context52.prev = _context52.next) {
                case 0:
                  _context52.next = 2;
                  return that._getAndTestTxs(that.wallet, new _index.MoneroTxQuery().setIsConfirmed(true));

                case 2:
                  txs = _context52.sent;
                  (0, _assert["default"])(txs.length > 0, "Wallet has no confirmed txs; run send tests"); // collect all tx heights

                  txHeights = [];
                  _iterator32 = _createForOfIteratorHelper(txs);

                  try {
                    for (_iterator32.s(); !(_step32 = _iterator32.n()).done;) {
                      _tx14 = _step32.value;
                      txHeights.push(_tx14.getHeight());
                    } // get height that most txs occur at

                  } catch (err) {
                    _iterator32.e(err);
                  } finally {
                    _iterator32.f();
                  }

                  heightCounts = countNumInstances(txHeights);
                  heightModes = getModes(heightCounts);
                  modeHeight = heightModes.values().next().value; // fetch txs at mode height

                  _context52.next = 12;
                  return that._getAndTestTxs(that.wallet, new _index.MoneroTxQuery().setHeight(modeHeight));

                case 12:
                  modeTxs = _context52.sent;

                  _assert["default"].equal(modeTxs.length, heightCounts.get(modeHeight)); // fetch txs at mode height by range


                  _context52.next = 16;
                  return that._getAndTestTxs(that.wallet, new _index.MoneroTxQuery().setMinHeight(modeHeight).setMaxHeight(modeHeight));

                case 16:
                  modeTxsByRange = _context52.sent;

                  _assert["default"].equal(modeTxsByRange.length, modeTxs.length);

                  _assert["default"].deepEqual(modeTxsByRange, modeTxs); // fetch all txs by range


                  _context52.next = 21;
                  return that._getAndTestTxs(that.wallet, new _index.MoneroTxQuery().setMinHeight(txs[0].getHeight()).setMaxHeight(txs[txs.length - 1].getHeight()));

                case 21:
                  fetched = _context52.sent;

                  _assert["default"].deepEqual(txs, fetched); // test some filtered by range  // TODO: these are separated in Java?


                  _context52.next = 25;
                  return that.wallet.getTxs({
                    isConfirmed: true
                  });

                case 25:
                  txs = _context52.sent;
                  (0, _assert["default"])(txs.length > 0, "No transactions; run send to multiple test"); // get and sort block heights in ascending order

                  heights = [];
                  _iterator33 = _createForOfIteratorHelper(txs);

                  try {
                    for (_iterator33.s(); !(_step33 = _iterator33.n()).done;) {
                      tx = _step33.value;
                      heights.push(tx.getBlock().getHeight());
                    }
                  } catch (err) {
                    _iterator33.e(err);
                  } finally {
                    _iterator33.f();
                  }

                  _index.GenUtils.sort(heights); // pick minimum and maximum heights for filtering


                  minHeight = -1;
                  maxHeight = -1;

                  if (heights.length == 1) {
                    minHeight = 0;
                    maxHeight = heights[0] - 1;
                  } else {
                    minHeight = heights[0] + 1;
                    maxHeight = heights[heights.length - 1] - 1;
                  } // assert some transactions filtered


                  unfilteredCount = txs.length;
                  _context52.next = 37;
                  return that._getAndTestTxs(that.wallet, {
                    minHeight: minHeight,
                    maxHeight: maxHeight
                  }, true);

                case 37:
                  txs = _context52.sent;
                  (0, _assert["default"])(txs.length < unfilteredCount);
                  _iterator34 = _createForOfIteratorHelper(txs);

                  try {
                    for (_iterator34.s(); !(_step34 = _iterator34.n()).done;) {
                      _tx13 = _step34.value;
                      height = _tx13.getBlock().getHeight();
                      (0, _assert["default"])(height >= minHeight && height <= maxHeight);
                    }
                  } catch (err) {
                    _iterator34.e(err);
                  } finally {
                    _iterator34.f();
                  }

                case 41:
                case "end":
                  return _context52.stop();
              }
            }
          }, _callee51);
        }))); // NOTE: payment hashes are deprecated so this test will require an old wallet to pass

        if (testConfig.testNonRelays) it("Can get transactions by payment ids", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee52() {
          var randomTxs, _iterator35, _step35, randomTx, paymentIds, _iterator36, _step36, paymentId, _txs2, txs, _iterator37, _step37, tx;

          return _regenerator["default"].wrap(function _callee52$(_context53) {
            while (1) {
              switch (_context53.prev = _context53.next) {
                case 0:
                  _context53.next = 2;
                  return getRandomTransactions(that.wallet, {
                    hasPaymentId: true
                  }, 3, 5);

                case 2:
                  randomTxs = _context53.sent;
                  _iterator35 = _createForOfIteratorHelper(randomTxs);

                  try {
                    for (_iterator35.s(); !(_step35 = _iterator35.n()).done;) {
                      randomTx = _step35.value;
                      (0, _assert["default"])(randomTx.getPaymentId());
                    } // get transactions by payment id

                  } catch (err) {
                    _iterator35.e(err);
                  } finally {
                    _iterator35.f();
                  }

                  paymentIds = randomTxs.map(function (tx) {
                    return tx.getPaymentId();
                  });
                  (0, _assert["default"])(paymentIds.length > 1);
                  _iterator36 = _createForOfIteratorHelper(paymentIds);
                  _context53.prev = 8;

                  _iterator36.s();

                case 10:
                  if ((_step36 = _iterator36.n()).done) {
                    _context53.next = 21;
                    break;
                  }

                  paymentId = _step36.value;
                  _context53.next = 14;
                  return that._getAndTestTxs(that.wallet, {
                    paymentId: paymentId
                  });

                case 14:
                  _txs2 = _context53.sent;
                  (0, _assert["default"])(_txs2.length > 0);
                  (0, _assert["default"])(_txs2[0].getPaymentId());
                  _context53.next = 19;
                  return _index.MoneroUtils.validatePaymentId(_txs2[0].getPaymentId());

                case 19:
                  _context53.next = 10;
                  break;

                case 21:
                  _context53.next = 26;
                  break;

                case 23:
                  _context53.prev = 23;
                  _context53.t0 = _context53["catch"](8);

                  _iterator36.e(_context53.t0);

                case 26:
                  _context53.prev = 26;

                  _iterator36.f();

                  return _context53.finish(26);

                case 29:
                  _context53.next = 31;
                  return that._getAndTestTxs(that.wallet, {
                    paymentIds: paymentIds
                  });

                case 31:
                  txs = _context53.sent;
                  _iterator37 = _createForOfIteratorHelper(txs);

                  try {
                    for (_iterator37.s(); !(_step37 = _iterator37.n()).done;) {
                      tx = _step37.value;
                      (0, _assert["default"])(paymentIds.includes(tx.getPaymentId()));
                    }
                  } catch (err) {
                    _iterator37.e(err);
                  } finally {
                    _iterator37.f();
                  }

                case 34:
                case "end":
                  return _context53.stop();
              }
            }
          }, _callee52, null, [[8, 23, 26, 29]]);
        })));
        if (testConfig.testNonRelays) it("Returns all known fields of txs regardless of filtering", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee53() {
          var txs, _iterator38, _step38, tx, _iterator39, _step39, transfer, filteredTxs, filteredTx;

          return _regenerator["default"].wrap(function _callee53$(_context54) {
            while (1) {
              switch (_context54.prev = _context54.next) {
                case 0:
                  _context54.next = 2;
                  return that.wallet.getTxs({
                    isConfirmed: true
                  });

                case 2:
                  txs = _context54.sent;
                  _iterator38 = _createForOfIteratorHelper(txs);
                  _context54.prev = 4;

                  _iterator38.s();

                case 6:
                  if ((_step38 = _iterator38.n()).done) {
                    _context54.next = 36;
                    break;
                  }

                  tx = _step38.value;

                  if (!(!tx.getOutgoingTransfer() || !tx.getIncomingTransfers())) {
                    _context54.next = 10;
                    break;
                  }

                  return _context54.abrupt("continue", 34);

                case 10:
                  _iterator39 = _createForOfIteratorHelper(tx.getIncomingTransfers());
                  _context54.prev = 11;

                  _iterator39.s();

                case 13:
                  if ((_step39 = _iterator39.n()).done) {
                    _context54.next = 26;
                    break;
                  }

                  transfer = _step39.value;

                  if (!(transfer.getAccountIndex() === tx.getOutgoingTransfer().getAccountIndex())) {
                    _context54.next = 17;
                    break;
                  }

                  return _context54.abrupt("continue", 24);

                case 17:
                  _context54.next = 19;
                  return that.wallet.getTxs({
                    transferQuery: {
                      isIncoming: true,
                      accountIndex: transfer.getAccountIndex()
                    }
                  });

                case 19:
                  filteredTxs = _context54.sent;
                  filteredTx = _index.Filter.apply(new _index.MoneroTxQuery().setHashes([tx.getHash()]), filteredTxs)[0]; // txs should be the same (mergeable)

                  _assert["default"].equal(filteredTx.getHash(), tx.getHash());

                  tx.merge(filteredTx); // test is done

                  return _context54.abrupt("return");

                case 24:
                  _context54.next = 13;
                  break;

                case 26:
                  _context54.next = 31;
                  break;

                case 28:
                  _context54.prev = 28;
                  _context54.t0 = _context54["catch"](11);

                  _iterator39.e(_context54.t0);

                case 31:
                  _context54.prev = 31;

                  _iterator39.f();

                  return _context54.finish(31);

                case 34:
                  _context54.next = 6;
                  break;

                case 36:
                  _context54.next = 41;
                  break;

                case 38:
                  _context54.prev = 38;
                  _context54.t1 = _context54["catch"](4);

                  _iterator38.e(_context54.t1);

                case 41:
                  _context54.prev = 41;

                  _iterator38.f();

                  return _context54.finish(41);

                case 44:
                  throw new Error("Test requires tx sent from/to different accounts of same wallet but none found; run send tests");

                case 45:
                case "end":
                  return _context54.stop();
              }
            }
          }, _callee53, null, [[4, 38, 41, 44], [11, 28, 31, 34]]);
        })));
        if (testConfig.testNonRelays && !testConfig.liteMode) it("Validates inputs when getting transactions", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee54() {
          var randomTxs, txHash, invalidHash, unknownHash1, unknownHash2, missingTxHashes, txs, _iterator40, _step40, tx;

          return _regenerator["default"].wrap(function _callee54$(_context55) {
            while (1) {
              switch (_context55.prev = _context55.next) {
                case 0:
                  _context55.next = 2;
                  return getRandomTransactions(that.wallet, undefined, 3, 5);

                case 2:
                  randomTxs = _context55.sent;
                  // valid, invalid, and unknown tx hashes for tests
                  txHash = randomTxs[0].getHash();
                  invalidHash = "invalid_id";
                  unknownHash1 = "6c4982f2499ece80e10b627083c4f9b992a00155e98bcba72a9588ccb91d0a61";
                  unknownHash2 = "ff397104dd875882f5e7c66e4f852ee134f8cf45e21f0c40777c9188bc92e943"; // fetch unknown tx hash

                  _context55.prev = 7;
                  _context55.next = 10;
                  return that.wallet.getTx(unknownHash1);

                case 10:
                  throw new Error("Should have thrown error getting tx hash unknown to wallet");

                case 13:
                  _context55.prev = 13;
                  _context55.t0 = _context55["catch"](7);

                  _assert["default"].equal(_context55.t0.message, "Wallet missing requested tx hashes: " + [unknownHash1]);

                case 16:
                  _context55.prev = 16;
                  _context55.next = 19;
                  return that.wallet.getTxs(new _index.MoneroTxQuery().setHash(unknownHash1));

                case 19:
                  throw new Error("Should have thrown error getting tx hash unknown to wallet");

                case 22:
                  _context55.prev = 22;
                  _context55.t1 = _context55["catch"](16);

                  _assert["default"].equal(_context55.t1.message, "Wallet missing requested tx hashes: " + [unknownHash1]);

                case 25:
                  _context55.prev = 25;
                  _context55.next = 28;
                  return that.wallet.getTxs([txHash, unknownHash1]);

                case 28:
                  throw new Error("Should have thrown error getting tx hash unknown to wallet");

                case 31:
                  _context55.prev = 31;
                  _context55.t2 = _context55["catch"](25);

                  _assert["default"].equal(_context55.t2.message, "Wallet missing requested tx hashes: " + [unknownHash1]);

                case 34:
                  _context55.prev = 34;
                  _context55.next = 37;
                  return that.wallet.getTxs([txHash, unknownHash1, unknownHash2]);

                case 37:
                  throw new Error("Should have thrown error getting tx hash unknown to wallet");

                case 40:
                  _context55.prev = 40;
                  _context55.t3 = _context55["catch"](34);

                  _assert["default"].equal(_context55.t3.message, "Wallet missing requested tx hashes: " + [unknownHash1, unknownHash2]);

                case 43:
                  _context55.prev = 43;
                  _context55.next = 46;
                  return that.wallet.getTx(invalidHash);

                case 46:
                  throw new Error("Should have thrown error getting tx hash unknown to wallet");

                case 49:
                  _context55.prev = 49;
                  _context55.t4 = _context55["catch"](43);

                  _assert["default"].equal(_context55.t4.message, "Wallet missing requested tx hashes: " + [invalidHash]);

                case 52:
                  _context55.prev = 52;
                  _context55.next = 55;
                  return that.wallet.getTxs([txHash, invalidHash]);

                case 55:
                  throw new Error("Should have thrown error getting tx hash unknown to wallet");

                case 58:
                  _context55.prev = 58;
                  _context55.t5 = _context55["catch"](52);

                  _assert["default"].equal(_context55.t5.message, "Wallet missing requested tx hashes: " + [invalidHash]);

                case 61:
                  _context55.prev = 61;
                  _context55.next = 64;
                  return that.wallet.getTxs([txHash, invalidHash, "invalid_hash_2"]);

                case 64:
                  throw new Error("Should have thrown error getting tx hash unknown to wallet");

                case 67:
                  _context55.prev = 67;
                  _context55.t6 = _context55["catch"](61);

                  _assert["default"].equal(_context55.t6.message, "Wallet missing requested tx hashes: " + [invalidHash, "invalid_hash_2"]);

                case 70:
                  // test collection of invalid hashes
                  missingTxHashes = [];
                  _context55.next = 73;
                  return that.wallet.getTxs(new _index.MoneroTxQuery().setHashes([txHash, invalidHash, "invalid_hash_2"]), missingTxHashes);

                case 73:
                  txs = _context55.sent;

                  _assert["default"].equal(1, txs.length);

                  _iterator40 = _createForOfIteratorHelper(txs);
                  _context55.prev = 76;

                  _iterator40.s();

                case 78:
                  if ((_step40 = _iterator40.n()).done) {
                    _context55.next = 84;
                    break;
                  }

                  tx = _step40.value;
                  _context55.next = 82;
                  return that._testTxWallet(tx);

                case 82:
                  _context55.next = 78;
                  break;

                case 84:
                  _context55.next = 89;
                  break;

                case 86:
                  _context55.prev = 86;
                  _context55.t7 = _context55["catch"](76);

                  _iterator40.e(_context55.t7);

                case 89:
                  _context55.prev = 89;

                  _iterator40.f();

                  return _context55.finish(89);

                case 92:
                  _assert["default"].deepEqual([invalidHash, "invalid_hash_2"], missingTxHashes);

                case 93:
                case "end":
                  return _context55.stop();
              }
            }
          }, _callee54, null, [[7, 13], [16, 22], [25, 31], [34, 40], [43, 49], [52, 58], [61, 67], [76, 86, 89, 92]]);
        })));
        if (testConfig.testNonRelays) it("Can get transfers in the wallet, accounts, and subaddresses", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee55() {
          var nonDefaultIncoming, _iterator41, _step41, account, accountTransfers, _iterator42, _step42, _transfer3, subaddressTransfers, _iterator43, _step43, subaddress, _transfers, _iterator46, _step46, _transfer4, _iterator47, _step47, subaddrIdx, found, _iterator48, _step48, subaddressTransfer, subaddressIndices, _i3, _subaddressTransfers, transfer, _iterator44, _step44, subaddressIdx, transfers, _iterator45, _step45, _transfer5, overlaps, _iterator49, _step49, _subaddressIdx, _iterator50, _step50, outSubaddressIdx;

          return _regenerator["default"].wrap(function _callee55$(_context56) {
            while (1) {
              switch (_context56.prev = _context56.next) {
                case 0:
                  _context56.next = 2;
                  return that._getAndTestTransfers(that.wallet, undefined, true);

                case 2:
                  // get transfers by account index
                  nonDefaultIncoming = false;
                  _context56.t0 = _createForOfIteratorHelper;
                  _context56.next = 6;
                  return that.wallet.getAccounts(true);

                case 6:
                  _context56.t1 = _context56.sent;
                  _iterator41 = (0, _context56.t0)(_context56.t1);
                  _context56.prev = 8;

                  _iterator41.s();

                case 10:
                  if ((_step41 = _iterator41.n()).done) {
                    _context56.next = 161;
                    break;
                  }

                  account = _step41.value;
                  _context56.next = 14;
                  return that._getAndTestTransfers(that.wallet, {
                    accountIndex: account.getIndex()
                  });

                case 14:
                  accountTransfers = _context56.sent;
                  _iterator42 = _createForOfIteratorHelper(accountTransfers);

                  try {
                    for (_iterator42.s(); !(_step42 = _iterator42.n()).done;) {
                      _transfer3 = _step42.value;

                      _assert["default"].equal(_transfer3.getAccountIndex(), account.getIndex());
                    } // get transfers by subaddress index

                  } catch (err) {
                    _iterator42.e(err);
                  } finally {
                    _iterator42.f();
                  }

                  subaddressTransfers = [];
                  _iterator43 = _createForOfIteratorHelper(account.getSubaddresses());
                  _context56.prev = 19;

                  _iterator43.s();

                case 21:
                  if ((_step43 = _iterator43.n()).done) {
                    _context56.next = 89;
                    break;
                  }

                  subaddress = _step43.value;
                  _context56.next = 25;
                  return that._getAndTestTransfers(that.wallet, {
                    accountIndex: subaddress.getAccountIndex(),
                    subaddressIndex: subaddress.getIndex()
                  });

                case 25:
                  _transfers = _context56.sent;
                  _iterator46 = _createForOfIteratorHelper(_transfers);
                  _context56.prev = 27;

                  _iterator46.s();

                case 29:
                  if ((_step46 = _iterator46.n()).done) {
                    _context56.next = 79;
                    break;
                  }

                  _transfer4 = _step46.value;

                  // test account and subaddress indices
                  _assert["default"].equal(_transfer4.getAccountIndex(), subaddress.getAccountIndex());

                  if (!_transfer4.isIncoming()) {
                    _context56.next = 37;
                    break;
                  }

                  _assert["default"].equal(_transfer4.getSubaddressIndex(), subaddress.getIndex());

                  if (_transfer4.getAccountIndex() !== 0 && _transfer4.getSubaddressIndex() !== 0) nonDefaultIncoming = true;
                  _context56.next = 57;
                  break;

                case 37:
                  (0, _assert["default"])(_transfer4.getSubaddressIndices().includes(subaddress.getIndex()));

                  if (!(_transfer4.getAccountIndex() !== 0)) {
                    _context56.next = 57;
                    break;
                  }

                  _iterator47 = _createForOfIteratorHelper(_transfer4.getSubaddressIndices());
                  _context56.prev = 40;

                  _iterator47.s();

                case 42:
                  if ((_step47 = _iterator47.n()).done) {
                    _context56.next = 49;
                    break;
                  }

                  subaddrIdx = _step47.value;

                  if (!(subaddrIdx > 0)) {
                    _context56.next = 47;
                    break;
                  }

                  nonDefaultIncoming = true;
                  return _context56.abrupt("break", 49);

                case 47:
                  _context56.next = 42;
                  break;

                case 49:
                  _context56.next = 54;
                  break;

                case 51:
                  _context56.prev = 51;
                  _context56.t2 = _context56["catch"](40);

                  _iterator47.e(_context56.t2);

                case 54:
                  _context56.prev = 54;

                  _iterator47.f();

                  return _context56.finish(54);

                case 57:
                  // don't add duplicates TODO monero-wallet-rpc: duplicate outgoing transfers returned for different subaddress indices, way to return outgoing subaddress indices?
                  found = false;
                  _iterator48 = _createForOfIteratorHelper(subaddressTransfers);
                  _context56.prev = 59;

                  _iterator48.s();

                case 61:
                  if ((_step48 = _iterator48.n()).done) {
                    _context56.next = 68;
                    break;
                  }

                  subaddressTransfer = _step48.value;

                  if (!(_transfer4.toString() === subaddressTransfer.toString() && _transfer4.getTx().getHash() === subaddressTransfer.getTx().getHash())) {
                    _context56.next = 66;
                    break;
                  }

                  found = true;
                  return _context56.abrupt("break", 68);

                case 66:
                  _context56.next = 61;
                  break;

                case 68:
                  _context56.next = 73;
                  break;

                case 70:
                  _context56.prev = 70;
                  _context56.t3 = _context56["catch"](59);

                  _iterator48.e(_context56.t3);

                case 73:
                  _context56.prev = 73;

                  _iterator48.f();

                  return _context56.finish(73);

                case 76:
                  if (!found) subaddressTransfers.push(_transfer4);

                case 77:
                  _context56.next = 29;
                  break;

                case 79:
                  _context56.next = 84;
                  break;

                case 81:
                  _context56.prev = 81;
                  _context56.t4 = _context56["catch"](27);

                  _iterator46.e(_context56.t4);

                case 84:
                  _context56.prev = 84;

                  _iterator46.f();

                  return _context56.finish(84);

                case 87:
                  _context56.next = 21;
                  break;

                case 89:
                  _context56.next = 94;
                  break;

                case 91:
                  _context56.prev = 91;
                  _context56.t5 = _context56["catch"](19);

                  _iterator43.e(_context56.t5);

                case 94:
                  _context56.prev = 94;

                  _iterator43.f();

                  return _context56.finish(94);

                case 97:
                  _assert["default"].equal(subaddressTransfers.length, accountTransfers.length); // collect unique subaddress indices


                  subaddressIndices = new Set();

                  for (_i3 = 0, _subaddressTransfers = subaddressTransfers; _i3 < _subaddressTransfers.length; _i3++) {
                    transfer = _subaddressTransfers[_i3];
                    if (transfer.isIncoming()) subaddressIndices.add(transfer.getSubaddressIndex());else {
                      _iterator44 = _createForOfIteratorHelper(transfer.getSubaddressIndices());

                      try {
                        for (_iterator44.s(); !(_step44 = _iterator44.n()).done;) {
                          subaddressIdx = _step44.value;
                          subaddressIndices.add(subaddressIdx);
                        }
                      } catch (err) {
                        _iterator44.e(err);
                      } finally {
                        _iterator44.f();
                      }
                    }
                  } // get and test transfers by subaddress indices


                  _context56.next = 102;
                  return that._getAndTestTransfers(that.wallet, new _index.MoneroTransferQuery().setAccountIndex(account.getIndex()).setSubaddressIndices(Array.from(subaddressIndices)), undefined, undefined);

                case 102:
                  transfers = _context56.sent;

                  //if (transfers.length !== subaddressTransfers.length) console.log("WARNING: outgoing transfers always from subaddress 0 (monero-wallet-rpc #5171)");
                  _assert["default"].equal(transfers.length, subaddressTransfers.length); // TODO monero-wallet-rpc: these may not be equal because outgoing transfers are always from subaddress 0 (#5171) and/or incoming transfers from/to same account are occluded (#4500)


                  _iterator45 = _createForOfIteratorHelper(transfers);
                  _context56.prev = 105;

                  _iterator45.s();

                case 107:
                  if ((_step45 = _iterator45.n()).done) {
                    _context56.next = 151;
                    break;
                  }

                  _transfer5 = _step45.value;

                  _assert["default"].equal(account.getIndex(), _transfer5.getAccountIndex());

                  if (!_transfer5.isIncoming()) {
                    _context56.next = 114;
                    break;
                  }

                  (0, _assert["default"])(subaddressIndices.has(_transfer5.getSubaddressIndex()));
                  _context56.next = 149;
                  break;

                case 114:
                  overlaps = false;
                  _iterator49 = _createForOfIteratorHelper(subaddressIndices);
                  _context56.prev = 116;

                  _iterator49.s();

                case 118:
                  if ((_step49 = _iterator49.n()).done) {
                    _context56.next = 140;
                    break;
                  }

                  _subaddressIdx = _step49.value;
                  _iterator50 = _createForOfIteratorHelper(_transfer5.getSubaddressIndices());
                  _context56.prev = 121;

                  _iterator50.s();

                case 123:
                  if ((_step50 = _iterator50.n()).done) {
                    _context56.next = 130;
                    break;
                  }

                  outSubaddressIdx = _step50.value;

                  if (!(_subaddressIdx === outSubaddressIdx)) {
                    _context56.next = 128;
                    break;
                  }

                  overlaps = true;
                  return _context56.abrupt("break", 130);

                case 128:
                  _context56.next = 123;
                  break;

                case 130:
                  _context56.next = 135;
                  break;

                case 132:
                  _context56.prev = 132;
                  _context56.t6 = _context56["catch"](121);

                  _iterator50.e(_context56.t6);

                case 135:
                  _context56.prev = 135;

                  _iterator50.f();

                  return _context56.finish(135);

                case 138:
                  _context56.next = 118;
                  break;

                case 140:
                  _context56.next = 145;
                  break;

                case 142:
                  _context56.prev = 142;
                  _context56.t7 = _context56["catch"](116);

                  _iterator49.e(_context56.t7);

                case 145:
                  _context56.prev = 145;

                  _iterator49.f();

                  return _context56.finish(145);

                case 148:
                  (0, _assert["default"])(overlaps, "Subaddresses must overlap");

                case 149:
                  _context56.next = 107;
                  break;

                case 151:
                  _context56.next = 156;
                  break;

                case 153:
                  _context56.prev = 153;
                  _context56.t8 = _context56["catch"](105);

                  _iterator45.e(_context56.t8);

                case 156:
                  _context56.prev = 156;

                  _iterator45.f();

                  return _context56.finish(156);

                case 159:
                  _context56.next = 10;
                  break;

                case 161:
                  _context56.next = 166;
                  break;

                case 163:
                  _context56.prev = 163;
                  _context56.t9 = _context56["catch"](8);

                  _iterator41.e(_context56.t9);

                case 166:
                  _context56.prev = 166;

                  _iterator41.f();

                  return _context56.finish(166);

                case 169:
                  // ensure transfer found with non-zero account and subaddress indices
                  (0, _assert["default"])(nonDefaultIncoming, "No transfers found in non-default account and subaddress; run send-to-multiple tests");

                case 170:
                case "end":
                  return _context56.stop();
              }
            }
          }, _callee55, null, [[8, 163, 166, 169], [19, 91, 94, 97], [27, 81, 84, 87], [40, 51, 54, 57], [59, 70, 73, 76], [105, 153, 156, 159], [116, 142, 145, 148], [121, 132, 135, 138]]);
        })));
        if (testConfig.testNonRelays && !testConfig.liteMode) it("Can get transfers with additional configuration", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee56() {
          var transfers, _iterator51, _step51, transfer, _iterator52, _step52, _transfer6, _iterator53, _step53, _transfer7, _iterator54, _step54, _transfer8, _iterator55, _step55, _transfer9, txs, txHashes, _iterator56, _step56, tx, _iterator61, _step61, _transfer10, _iterator57, _step57, _transfer11, transferQuery, _iterator58, _step58, _transfer12, _iterator59, _step59, _transfer13, subaddress, _iterator60, _step60, _transfer14;

          return _regenerator["default"].wrap(function _callee56$(_context57) {
            while (1) {
              switch (_context57.prev = _context57.next) {
                case 0:
                  _context57.next = 2;
                  return that._getAndTestTransfers(that.wallet, {
                    isIncoming: true
                  }, true);

                case 2:
                  transfers = _context57.sent;
                  _iterator51 = _createForOfIteratorHelper(transfers);

                  try {
                    for (_iterator51.s(); !(_step51 = _iterator51.n()).done;) {
                      transfer = _step51.value;
                      (0, _assert["default"])(transfer.isIncoming());
                    } // get outgoing transfers

                  } catch (err) {
                    _iterator51.e(err);
                  } finally {
                    _iterator51.f();
                  }

                  _context57.next = 7;
                  return that._getAndTestTransfers(that.wallet, {
                    isOutgoing: true
                  }, true);

                case 7:
                  transfers = _context57.sent;
                  _iterator52 = _createForOfIteratorHelper(transfers);

                  try {
                    for (_iterator52.s(); !(_step52 = _iterator52.n()).done;) {
                      _transfer6 = _step52.value;
                      (0, _assert["default"])(_transfer6.isOutgoing());
                    } // get confirmed transfers to account 0

                  } catch (err) {
                    _iterator52.e(err);
                  } finally {
                    _iterator52.f();
                  }

                  _context57.next = 12;
                  return that._getAndTestTransfers(that.wallet, {
                    accountIndex: 0,
                    txQuery: {
                      isConfirmed: true
                    }
                  }, true);

                case 12:
                  transfers = _context57.sent;
                  _iterator53 = _createForOfIteratorHelper(transfers);

                  try {
                    for (_iterator53.s(); !(_step53 = _iterator53.n()).done;) {
                      _transfer7 = _step53.value;

                      _assert["default"].equal(_transfer7.getAccountIndex(), 0);

                      (0, _assert["default"])(_transfer7.getTx().isConfirmed());
                    } // get confirmed transfers to [1, 2]

                  } catch (err) {
                    _iterator53.e(err);
                  } finally {
                    _iterator53.f();
                  }

                  _context57.next = 17;
                  return that._getAndTestTransfers(that.wallet, {
                    accountIndex: 1,
                    subaddressIndex: 2,
                    txQuery: {
                      isConfirmed: true
                    }
                  }, true);

                case 17:
                  transfers = _context57.sent;
                  _iterator54 = _createForOfIteratorHelper(transfers);

                  try {
                    for (_iterator54.s(); !(_step54 = _iterator54.n()).done;) {
                      _transfer8 = _step54.value;

                      _assert["default"].equal(_transfer8.getAccountIndex(), 1);

                      if (_transfer8.isIncoming()) _assert["default"].equal(_transfer8.getSubaddressIndex(), 2);else (0, _assert["default"])(_transfer8.getSubaddressIndices().includes(2));
                      (0, _assert["default"])(_transfer8.getTx().isConfirmed());
                    } // get transfers in the tx pool

                  } catch (err) {
                    _iterator54.e(err);
                  } finally {
                    _iterator54.f();
                  }

                  _context57.next = 22;
                  return that._getAndTestTransfers(that.wallet, {
                    txQuery: {
                      inTxPool: true
                    }
                  });

                case 22:
                  transfers = _context57.sent;
                  _iterator55 = _createForOfIteratorHelper(transfers);

                  try {
                    for (_iterator55.s(); !(_step55 = _iterator55.n()).done;) {
                      _transfer9 = _step55.value;

                      _assert["default"].equal(_transfer9.getTx().inTxPool(), true);
                    } // get random transactions

                  } catch (err) {
                    _iterator55.e(err);
                  } finally {
                    _iterator55.f();
                  }

                  _context57.next = 27;
                  return getRandomTransactions(that.wallet, undefined, 3, 5);

                case 27:
                  txs = _context57.sent;
                  // get transfers with a tx hash
                  txHashes = [];
                  _iterator56 = _createForOfIteratorHelper(txs);
                  _context57.prev = 30;

                  _iterator56.s();

                case 32:
                  if ((_step56 = _iterator56.n()).done) {
                    _context57.next = 42;
                    break;
                  }

                  tx = _step56.value;
                  txHashes.push(tx.getHash());
                  _context57.next = 37;
                  return that._getAndTestTransfers(that.wallet, {
                    txQuery: {
                      hash: tx.getHash()
                    }
                  }, true);

                case 37:
                  transfers = _context57.sent;
                  _iterator61 = _createForOfIteratorHelper(transfers);

                  try {
                    for (_iterator61.s(); !(_step61 = _iterator61.n()).done;) {
                      _transfer10 = _step61.value;

                      _assert["default"].equal(_transfer10.getTx().getHash(), tx.getHash());
                    }
                  } catch (err) {
                    _iterator61.e(err);
                  } finally {
                    _iterator61.f();
                  }

                case 40:
                  _context57.next = 32;
                  break;

                case 42:
                  _context57.next = 47;
                  break;

                case 44:
                  _context57.prev = 44;
                  _context57.t0 = _context57["catch"](30);

                  _iterator56.e(_context57.t0);

                case 47:
                  _context57.prev = 47;

                  _iterator56.f();

                  return _context57.finish(47);

                case 50:
                  _context57.next = 52;
                  return that._getAndTestTransfers(that.wallet, {
                    txQuery: {
                      hashes: txHashes
                    }
                  }, true);

                case 52:
                  transfers = _context57.sent;
                  _iterator57 = _createForOfIteratorHelper(transfers);

                  try {
                    for (_iterator57.s(); !(_step57 = _iterator57.n()).done;) {
                      _transfer11 = _step57.value;
                      (0, _assert["default"])(txHashes.includes(_transfer11.getTx().getHash()));
                    } // TODO: test that transfers with the same tx hash have the same tx reference
                    // TODO: test transfers destinations
                    // get transfers with pre-built query that are confirmed and have outgoing destinations

                  } catch (err) {
                    _iterator57.e(err);
                  } finally {
                    _iterator57.f();
                  }

                  transferQuery = new _index.MoneroTransferQuery();
                  transferQuery.setIsOutgoing(true);
                  transferQuery.setHasDestinations(true);
                  transferQuery.setTxQuery(new _index.MoneroTxQuery().setIsConfirmed(true));
                  _context57.next = 61;
                  return that._getAndTestTransfers(that.wallet, transferQuery);

                case 61:
                  transfers = _context57.sent;
                  _iterator58 = _createForOfIteratorHelper(transfers);

                  try {
                    for (_iterator58.s(); !(_step58 = _iterator58.n()).done;) {
                      _transfer12 = _step58.value;

                      _assert["default"].equal(_transfer12.isOutgoing(), true);

                      (0, _assert["default"])(_transfer12.getDestinations().length > 0);

                      _assert["default"].equal(_transfer12.getTx().isConfirmed(), true);
                    } // get incoming transfers to account 0 which has outgoing transfers (i.e. originated from the same wallet)

                  } catch (err) {
                    _iterator58.e(err);
                  } finally {
                    _iterator58.f();
                  }

                  _context57.next = 66;
                  return that.wallet.getTransfers({
                    accountIndex: 1,
                    isIncoming: true,
                    txQuery: {
                      isOutgoing: true
                    }
                  });

                case 66:
                  transfers = _context57.sent;
                  (0, _assert["default"])(transfers.length > 0);
                  _iterator59 = _createForOfIteratorHelper(transfers);

                  try {
                    for (_iterator59.s(); !(_step59 = _iterator59.n()).done;) {
                      _transfer13 = _step59.value;
                      (0, _assert["default"])(_transfer13.isIncoming());

                      _assert["default"].equal(_transfer13.getAccountIndex(), 1);

                      (0, _assert["default"])(_transfer13.getTx().isOutgoing());

                      _assert["default"].equal(_transfer13.getTx().getOutgoingTransfer(), undefined);
                    } // get incoming transfers to a specific address

                  } catch (err) {
                    _iterator59.e(err);
                  } finally {
                    _iterator59.f();
                  }

                  _context57.next = 72;
                  return that.wallet.getAddress(1, 0);

                case 72:
                  subaddress = _context57.sent;
                  _context57.next = 75;
                  return that.wallet.getTransfers({
                    isIncoming: true,
                    address: subaddress
                  });

                case 75:
                  transfers = _context57.sent;
                  (0, _assert["default"])(transfers.length > 0);
                  _iterator60 = _createForOfIteratorHelper(transfers);

                  try {
                    for (_iterator60.s(); !(_step60 = _iterator60.n()).done;) {
                      _transfer14 = _step60.value;
                      (0, _assert["default"])(_transfer14 instanceof _index.MoneroIncomingTransfer);

                      _assert["default"].equal(1, _transfer14.getAccountIndex());

                      _assert["default"].equal(0, _transfer14.getSubaddressIndex());

                      _assert["default"].equal(subaddress, _transfer14.getAddress());
                    }
                  } catch (err) {
                    _iterator60.e(err);
                  } finally {
                    _iterator60.f();
                  }

                case 79:
                case "end":
                  return _context57.stop();
              }
            }
          }, _callee56, null, [[30, 44, 47, 50]]);
        })));
        if (testConfig.testNonRelays && !testConfig.liteMode) it("Validates inputs when getting transfers", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee57() {
          var transfers, randomTxs, tx, _iterator62, _step62, transfer, _transfers2;

          return _regenerator["default"].wrap(function _callee57$(_context58) {
            while (1) {
              switch (_context58.prev = _context58.next) {
                case 0:
                  _context58.next = 2;
                  return that.wallet.getTransfers({
                    txQuery: {
                      hash: "invalid_id"
                    }
                  });

                case 2:
                  transfers = _context58.sent;

                  _assert["default"].equal(transfers.length, 0); // test invalid hash in collection


                  _context58.next = 6;
                  return getRandomTransactions(that.wallet, undefined, 3, 5);

                case 6:
                  randomTxs = _context58.sent;
                  _context58.next = 9;
                  return that.wallet.getTransfers({
                    txQuery: {
                      hashes: [randomTxs[0].getHash(), "invalid_id"]
                    }
                  });

                case 9:
                  transfers = _context58.sent;
                  (0, _assert["default"])(transfers.length > 0);
                  tx = transfers[0].getTx();
                  _iterator62 = _createForOfIteratorHelper(transfers);

                  try {
                    for (_iterator62.s(); !(_step62 = _iterator62.n()).done;) {
                      transfer = _step62.value;
                      (0, _assert["default"])(tx === transfer.getTx());
                    } // test unused subaddress indices

                  } catch (err) {
                    _iterator62.e(err);
                  } finally {
                    _iterator62.f();
                  }

                  _context58.next = 16;
                  return that.wallet.getTransfers({
                    accountIndex: 0,
                    subaddressIndices: [1234907]
                  });

                case 16:
                  transfers = _context58.sent;
                  (0, _assert["default"])(transfers.length === 0); // test invalid subaddress index

                  _context58.prev = 18;
                  _context58.next = 21;
                  return that.wallet.getTransfers({
                    accountIndex: 0,
                    subaddressIndex: -1
                  });

                case 21:
                  _transfers2 = _context58.sent;
                  throw new Error("Should have failed");

                case 25:
                  _context58.prev = 25;
                  _context58.t0 = _context58["catch"](18);

                  _assert["default"].notEqual(_context58.t0.message, "Should have failed");

                case 28:
                case "end":
                  return _context58.stop();
              }
            }
          }, _callee57, null, [[18, 25]]);
        })));
        if (testConfig.testNonRelays) it("Can get incoming and outgoing transfers using convenience methods", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee58() {
          var inTransfers, _iterator63, _step63, transfer, amount, accountIdx, subaddressIdx, _iterator64, _step64, _transfer15, outTransfers, _iterator65, _step65, _transfer16, _iterator66, _step66, _transfer17;

          return _regenerator["default"].wrap(function _callee58$(_context59) {
            while (1) {
              switch (_context59.prev = _context59.next) {
                case 0:
                  _context59.next = 2;
                  return that.wallet.getIncomingTransfers();

                case 2:
                  inTransfers = _context59.sent;
                  (0, _assert["default"])(inTransfers.length > 0);
                  _iterator63 = _createForOfIteratorHelper(inTransfers);
                  _context59.prev = 5;

                  _iterator63.s();

                case 7:
                  if ((_step63 = _iterator63.n()).done) {
                    _context59.next = 14;
                    break;
                  }

                  transfer = _step63.value;
                  (0, _assert["default"])(transfer.isIncoming());
                  _context59.next = 12;
                  return testTransfer(transfer, undefined);

                case 12:
                  _context59.next = 7;
                  break;

                case 14:
                  _context59.next = 19;
                  break;

                case 16:
                  _context59.prev = 16;
                  _context59.t0 = _context59["catch"](5);

                  _iterator63.e(_context59.t0);

                case 19:
                  _context59.prev = 19;

                  _iterator63.f();

                  return _context59.finish(19);

                case 22:
                  // get incoming transfers with query
                  amount = inTransfers[0].getAmount();
                  accountIdx = inTransfers[0].getAccountIndex();
                  subaddressIdx = inTransfers[0].getSubaddressIndex();
                  _context59.next = 27;
                  return that.wallet.getIncomingTransfers({
                    amount: amount,
                    accountIndex: accountIdx,
                    subaddressIndex: subaddressIdx
                  });

                case 27:
                  inTransfers = _context59.sent;
                  (0, _assert["default"])(inTransfers.length > 0);
                  _iterator64 = _createForOfIteratorHelper(inTransfers);
                  _context59.prev = 30;

                  _iterator64.s();

                case 32:
                  if ((_step64 = _iterator64.n()).done) {
                    _context59.next = 42;
                    break;
                  }

                  _transfer15 = _step64.value;
                  (0, _assert["default"])(_transfer15.isIncoming());

                  _assert["default"].equal(_transfer15.getAmount().toString(), amount.toString());

                  _assert["default"].equal(_transfer15.getAccountIndex(), accountIdx);

                  _assert["default"].equal(_transfer15.getSubaddressIndex(), subaddressIdx);

                  _context59.next = 40;
                  return testTransfer(_transfer15, undefined);

                case 40:
                  _context59.next = 32;
                  break;

                case 42:
                  _context59.next = 47;
                  break;

                case 44:
                  _context59.prev = 44;
                  _context59.t1 = _context59["catch"](30);

                  _iterator64.e(_context59.t1);

                case 47:
                  _context59.prev = 47;

                  _iterator64.f();

                  return _context59.finish(47);

                case 50:
                  _context59.prev = 50;
                  _context59.next = 53;
                  return that.wallet.getIncomingTransfers(new _index.MoneroTransferQuery().setIsIncoming(false));

                case 53:
                  inTransfers = _context59.sent;
                  _context59.next = 59;
                  break;

                case 56:
                  _context59.prev = 56;
                  _context59.t2 = _context59["catch"](50);

                  _assert["default"].equal(_context59.t2.message, "Transfer query contradicts getting incoming transfers");

                case 59:
                  _context59.next = 61;
                  return that.wallet.getOutgoingTransfers();

                case 61:
                  outTransfers = _context59.sent;
                  (0, _assert["default"])(outTransfers.length > 0);
                  _iterator65 = _createForOfIteratorHelper(outTransfers);
                  _context59.prev = 64;

                  _iterator65.s();

                case 66:
                  if ((_step65 = _iterator65.n()).done) {
                    _context59.next = 73;
                    break;
                  }

                  _transfer16 = _step65.value;
                  (0, _assert["default"])(_transfer16.isOutgoing());
                  _context59.next = 71;
                  return testTransfer(_transfer16, undefined);

                case 71:
                  _context59.next = 66;
                  break;

                case 73:
                  _context59.next = 78;
                  break;

                case 75:
                  _context59.prev = 75;
                  _context59.t3 = _context59["catch"](64);

                  _iterator65.e(_context59.t3);

                case 78:
                  _context59.prev = 78;

                  _iterator65.f();

                  return _context59.finish(78);

                case 81:
                  _context59.next = 83;
                  return that.wallet.getOutgoingTransfers({
                    accountIndex: accountIdx,
                    subaddressIndex: subaddressIdx
                  });

                case 83:
                  outTransfers = _context59.sent;
                  (0, _assert["default"])(outTransfers.length > 0);
                  _iterator66 = _createForOfIteratorHelper(outTransfers);
                  _context59.prev = 86;

                  _iterator66.s();

                case 88:
                  if ((_step66 = _iterator66.n()).done) {
                    _context59.next = 97;
                    break;
                  }

                  _transfer17 = _step66.value;
                  (0, _assert["default"])(_transfer17.isOutgoing());

                  _assert["default"].equal(_transfer17.getAccountIndex(), accountIdx);

                  (0, _assert["default"])(_transfer17.getSubaddressIndices().includes(subaddressIdx));
                  _context59.next = 95;
                  return testTransfer(_transfer17, undefined);

                case 95:
                  _context59.next = 88;
                  break;

                case 97:
                  _context59.next = 102;
                  break;

                case 99:
                  _context59.prev = 99;
                  _context59.t4 = _context59["catch"](86);

                  _iterator66.e(_context59.t4);

                case 102:
                  _context59.prev = 102;

                  _iterator66.f();

                  return _context59.finish(102);

                case 105:
                  _context59.prev = 105;
                  _context59.next = 108;
                  return that.wallet.getOutgoingTransfers(new _index.MoneroTransferQuery().setIsOutgoing(false));

                case 108:
                  outTransfers = _context59.sent;
                  _context59.next = 114;
                  break;

                case 111:
                  _context59.prev = 111;
                  _context59.t5 = _context59["catch"](105);

                  _assert["default"].equal(_context59.t5.message, "Transfer query contradicts getting outgoing transfers");

                case 114:
                case "end":
                  return _context59.stop();
              }
            }
          }, _callee58, null, [[5, 16, 19, 22], [30, 44, 47, 50], [50, 56], [64, 75, 78, 81], [86, 99, 102, 105], [105, 111]]);
        })));
        if (testConfig.testNonRelays) it("Can get outputs in the wallet, accounts, and subaddresses", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee59() {
          var nonDefaultIncoming, accounts, _iterator67, _step67, account, isUsed, _iterator68, _step68, subaddress, accountOutputs, _iterator69, _step69, _output2, subaddressOutputs, _iterator70, _step70, _subaddress, _outputs, _iterator72, _step72, _output3, subaddressIndices, outputs, _iterator71, _step71, _output4;

          return _regenerator["default"].wrap(function _callee59$(_context60) {
            while (1) {
              switch (_context60.prev = _context60.next) {
                case 0:
                  _context60.next = 2;
                  return that._getAndTestOutputs(that.wallet, undefined, true);

                case 2:
                  // get outputs for each account
                  nonDefaultIncoming = false;
                  _context60.next = 5;
                  return that.wallet.getAccounts(true);

                case 5:
                  accounts = _context60.sent;
                  _iterator67 = _createForOfIteratorHelper(accounts);
                  _context60.prev = 7;

                  _iterator67.s();

                case 9:
                  if ((_step67 = _iterator67.n()).done) {
                    _context60.next = 50;
                    break;
                  }

                  account = _step67.value;
                  // determine if account is used
                  isUsed = false;
                  _iterator68 = _createForOfIteratorHelper(account.getSubaddresses());

                  try {
                    for (_iterator68.s(); !(_step68 = _iterator68.n()).done;) {
                      subaddress = _step68.value;
                      if (subaddress.isUsed()) isUsed = true;
                    } // get outputs by account index

                  } catch (err) {
                    _iterator68.e(err);
                  } finally {
                    _iterator68.f();
                  }

                  _context60.next = 16;
                  return that._getAndTestOutputs(that.wallet, {
                    accountIndex: account.getIndex()
                  }, isUsed);

                case 16:
                  accountOutputs = _context60.sent;
                  _iterator69 = _createForOfIteratorHelper(accountOutputs);

                  try {
                    for (_iterator69.s(); !(_step69 = _iterator69.n()).done;) {
                      _output2 = _step69.value;

                      _assert["default"].equal(_output2.getAccountIndex(), account.getIndex());
                    } // get outputs by subaddress index

                  } catch (err) {
                    _iterator69.e(err);
                  } finally {
                    _iterator69.f();
                  }

                  subaddressOutputs = [];
                  _iterator70 = _createForOfIteratorHelper(account.getSubaddresses());
                  _context60.prev = 21;

                  _iterator70.s();

                case 23:
                  if ((_step70 = _iterator70.n()).done) {
                    _context60.next = 32;
                    break;
                  }

                  _subaddress = _step70.value;
                  _context60.next = 27;
                  return that._getAndTestOutputs(that.wallet, {
                    accountIndex: account.getIndex(),
                    subaddressIndex: _subaddress.getIndex()
                  }, _subaddress.isUsed());

                case 27:
                  _outputs = _context60.sent;
                  _iterator72 = _createForOfIteratorHelper(_outputs);

                  try {
                    for (_iterator72.s(); !(_step72 = _iterator72.n()).done;) {
                      _output3 = _step72.value;

                      _assert["default"].equal(_output3.getAccountIndex(), _subaddress.getAccountIndex());

                      _assert["default"].equal(_output3.getSubaddressIndex(), _subaddress.getIndex());

                      if (_output3.getAccountIndex() !== 0 && _output3.getSubaddressIndex() !== 0) nonDefaultIncoming = true;
                      subaddressOutputs.push(_output3);
                    }
                  } catch (err) {
                    _iterator72.e(err);
                  } finally {
                    _iterator72.f();
                  }

                case 30:
                  _context60.next = 23;
                  break;

                case 32:
                  _context60.next = 37;
                  break;

                case 34:
                  _context60.prev = 34;
                  _context60.t0 = _context60["catch"](21);

                  _iterator70.e(_context60.t0);

                case 37:
                  _context60.prev = 37;

                  _iterator70.f();

                  return _context60.finish(37);

                case 40:
                  _assert["default"].equal(subaddressOutputs.length, accountOutputs.length); // get outputs by subaddress indices


                  subaddressIndices = Array.from(new Set(subaddressOutputs.map(function (output) {
                    return output.getSubaddressIndex();
                  })));
                  _context60.next = 44;
                  return that._getAndTestOutputs(that.wallet, {
                    accountIndex: account.getIndex(),
                    subaddressIndices: subaddressIndices
                  }, isUsed);

                case 44:
                  outputs = _context60.sent;

                  _assert["default"].equal(outputs.length, subaddressOutputs.length);

                  _iterator71 = _createForOfIteratorHelper(outputs);

                  try {
                    for (_iterator71.s(); !(_step71 = _iterator71.n()).done;) {
                      _output4 = _step71.value;

                      _assert["default"].equal(_output4.getAccountIndex(), account.getIndex());

                      (0, _assert["default"])(subaddressIndices.includes(_output4.getSubaddressIndex()));
                    }
                  } catch (err) {
                    _iterator71.e(err);
                  } finally {
                    _iterator71.f();
                  }

                case 48:
                  _context60.next = 9;
                  break;

                case 50:
                  _context60.next = 55;
                  break;

                case 52:
                  _context60.prev = 52;
                  _context60.t1 = _context60["catch"](7);

                  _iterator67.e(_context60.t1);

                case 55:
                  _context60.prev = 55;

                  _iterator67.f();

                  return _context60.finish(55);

                case 58:
                  // ensure output found with non-zero account and subaddress indices
                  (0, _assert["default"])(nonDefaultIncoming, "No outputs found in non-default account and subaddress; run send-to-multiple tests");

                case 59:
                case "end":
                  return _context60.stop();
              }
            }
          }, _callee59, null, [[7, 52, 55, 58], [21, 34, 37, 40]]);
        })));
        if (testConfig.testNonRelays && !testConfig.liteMode) it("Can get outputs with additional configuration", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee60() {
          var outputs, _iterator73, _step73, _output5, _iterator74, _step74, _output6, txs, txHashes, _iterator75, _step75, tx, _iterator79, _step79, _output7, _iterator76, _step76, _output8, accountIdx, subaddressIdx, query, _iterator77, _step77, _output9, keyImage, _iterator78, _step78, _output10;

          return _regenerator["default"].wrap(function _callee60$(_context61) {
            while (1) {
              switch (_context61.prev = _context61.next) {
                case 0:
                  _context61.next = 2;
                  return that._getAndTestOutputs(that.wallet, {
                    accountIndex: 0,
                    isSpent: false
                  });

                case 2:
                  outputs = _context61.sent;
                  _iterator73 = _createForOfIteratorHelper(outputs);

                  try {
                    for (_iterator73.s(); !(_step73 = _iterator73.n()).done;) {
                      _output5 = _step73.value;

                      _assert["default"].equal(_output5.getAccountIndex(), 0);

                      _assert["default"].equal(_output5.isSpent(), false);
                    } // get spent outputs to account 1

                  } catch (err) {
                    _iterator73.e(err);
                  } finally {
                    _iterator73.f();
                  }

                  _context61.next = 7;
                  return that._getAndTestOutputs(that.wallet, {
                    accountIndex: 1,
                    isSpent: true
                  }, true);

                case 7:
                  outputs = _context61.sent;
                  _iterator74 = _createForOfIteratorHelper(outputs);

                  try {
                    for (_iterator74.s(); !(_step74 = _iterator74.n()).done;) {
                      _output6 = _step74.value;

                      _assert["default"].equal(_output6.getAccountIndex(), 1);

                      _assert["default"].equal(_output6.isSpent(), true);
                    } // get random transactions

                  } catch (err) {
                    _iterator74.e(err);
                  } finally {
                    _iterator74.f();
                  }

                  _context61.next = 12;
                  return getRandomTransactions(that.wallet, {
                    isConfirmed: true
                  }, 3, 5);

                case 12:
                  txs = _context61.sent;
                  // get outputs with a tx hash
                  txHashes = [];
                  _iterator75 = _createForOfIteratorHelper(txs);
                  _context61.prev = 15;

                  _iterator75.s();

                case 17:
                  if ((_step75 = _iterator75.n()).done) {
                    _context61.next = 27;
                    break;
                  }

                  tx = _step75.value;
                  txHashes.push(tx.getHash());
                  _context61.next = 22;
                  return that._getAndTestOutputs(that.wallet, {
                    txQuery: {
                      hash: tx.getHash()
                    }
                  }, true);

                case 22:
                  outputs = _context61.sent;
                  _iterator79 = _createForOfIteratorHelper(outputs);

                  try {
                    for (_iterator79.s(); !(_step79 = _iterator79.n()).done;) {
                      _output7 = _step79.value;

                      _assert["default"].equal(_output7.getTx().getHash(), tx.getHash());
                    }
                  } catch (err) {
                    _iterator79.e(err);
                  } finally {
                    _iterator79.f();
                  }

                case 25:
                  _context61.next = 17;
                  break;

                case 27:
                  _context61.next = 32;
                  break;

                case 29:
                  _context61.prev = 29;
                  _context61.t0 = _context61["catch"](15);

                  _iterator75.e(_context61.t0);

                case 32:
                  _context61.prev = 32;

                  _iterator75.f();

                  return _context61.finish(32);

                case 35:
                  _context61.next = 37;
                  return that._getAndTestOutputs(that.wallet, {
                    txQuery: {
                      hashes: txHashes
                    }
                  }, true);

                case 37:
                  outputs = _context61.sent;
                  _iterator76 = _createForOfIteratorHelper(outputs);

                  try {
                    for (_iterator76.s(); !(_step76 = _iterator76.n()).done;) {
                      _output8 = _step76.value;
                      (0, _assert["default"])(txHashes.includes(_output8.getTx().getHash()));
                    } // get confirmed outputs to specific subaddress with pre-built query

                  } catch (err) {
                    _iterator76.e(err);
                  } finally {
                    _iterator76.f();
                  }

                  accountIdx = 0;
                  subaddressIdx = 1;
                  query = new _index.MoneroOutputQuery();
                  query.setAccountIndex(accountIdx).setSubaddressIndex(subaddressIdx);
                  query.setTxQuery(new _index.MoneroTxQuery().setIsConfirmed(true));
                  query.setMinAmount(_TestUtils["default"].MAX_FEE);
                  _context61.next = 48;
                  return that._getAndTestOutputs(that.wallet, query, true);

                case 48:
                  outputs = _context61.sent;
                  _iterator77 = _createForOfIteratorHelper(outputs);

                  try {
                    for (_iterator77.s(); !(_step77 = _iterator77.n()).done;) {
                      _output9 = _step77.value;

                      _assert["default"].equal(_output9.getAccountIndex(), accountIdx);

                      _assert["default"].equal(_output9.getSubaddressIndex(), subaddressIdx);

                      _assert["default"].equal(_output9.getTx().isConfirmed(), true);

                      (0, _assert["default"])(BitIntegerCompare(_output9.getAmount(), _TestUtils["default"].MAX_FEE) >= 0);
                    } // get output by key image

                  } catch (err) {
                    _iterator77.e(err);
                  } finally {
                    _iterator77.f();
                  }

                  keyImage = outputs[0].getKeyImage().getHex();
                  _context61.next = 54;
                  return that.wallet.getOutputs(new _index.MoneroOutputQuery().setKeyImage(new _index.MoneroKeyImage(keyImage)));

                case 54:
                  outputs = _context61.sent;

                  _assert["default"].equal(outputs.length, 1);

                  _assert["default"].equal(outputs[0].getKeyImage().getHex(), keyImage); // get outputs whose transaction is confirmed and has incoming and outgoing transfers


                  _context61.next = 59;
                  return that.wallet.getOutputs({
                    txQuery: {
                      isConfirmed: true,
                      isIncoming: true,
                      isOutgoing: true,
                      includeOutputs: true
                    }
                  });

                case 59:
                  outputs = _context61.sent;
                  (0, _assert["default"])(outputs.length > 0);
                  _iterator78 = _createForOfIteratorHelper(outputs);

                  try {
                    for (_iterator78.s(); !(_step78 = _iterator78.n()).done;) {
                      _output10 = _step78.value;
                      (0, _assert["default"])(_output10.getTx().isIncoming());
                      (0, _assert["default"])(_output10.getTx().isOutgoing());
                      (0, _assert["default"])(_output10.getTx().isConfirmed());
                      (0, _assert["default"])(_output10.getTx().getOutputs().length > 0);
                      (0, _assert["default"])(_index.GenUtils.arrayContains(_output10.getTx().getOutputs(), _output10, true));
                    }
                  } catch (err) {
                    _iterator78.e(err);
                  } finally {
                    _iterator78.f();
                  }

                case 63:
                case "end":
                  return _context61.stop();
              }
            }
          }, _callee60, null, [[15, 29, 32, 35]]);
        })));
        if (testConfig.testNonRelays && !testConfig.liteMode) it("Validates inputs when getting outputs", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee61() {
          var outputs, randomTxs, tx, _iterator80, _step80, _output11;

          return _regenerator["default"].wrap(function _callee61$(_context62) {
            while (1) {
              switch (_context62.prev = _context62.next) {
                case 0:
                  _context62.next = 2;
                  return that.wallet.getOutputs({
                    txQuery: {
                      hash: "invalid_id"
                    }
                  });

                case 2:
                  outputs = _context62.sent;

                  _assert["default"].equal(outputs.length, 0); // test invalid hash in collection


                  _context62.next = 6;
                  return getRandomTransactions(that.wallet, {
                    isConfirmed: true,
                    includeOutputs: true
                  }, 3, 5);

                case 6:
                  randomTxs = _context62.sent;
                  _context62.next = 9;
                  return that.wallet.getOutputs({
                    txQuery: {
                      hashes: [randomTxs[0].getHash(), "invalid_id"]
                    }
                  });

                case 9:
                  outputs = _context62.sent;
                  (0, _assert["default"])(outputs.length > 0);

                  _assert["default"].equal(randomTxs[0].getOutputs().length, outputs.length);

                  tx = outputs[0].getTx();
                  _iterator80 = _createForOfIteratorHelper(outputs);

                  try {
                    for (_iterator80.s(); !(_step80 = _iterator80.n()).done;) {
                      _output11 = _step80.value;
                      (0, _assert["default"])(tx === _output11.getTx());
                    }
                  } catch (err) {
                    _iterator80.e(err);
                  } finally {
                    _iterator80.f();
                  }

                case 15:
                case "end":
                  return _context62.stop();
              }
            }
          }, _callee61);
        })));
        if (testConfig.testNonRelays) it("Can export outputs in hex format", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee62() {
          var outputsHex, outputsHexAll;
          return _regenerator["default"].wrap(function _callee62$(_context63) {
            while (1) {
              switch (_context63.prev = _context63.next) {
                case 0:
                  _context63.next = 2;
                  return that.wallet.exportOutputs();

                case 2:
                  outputsHex = _context63.sent;

                  _assert["default"].equal((0, _typeof2["default"])(outputsHex), "string"); // TODO: this will fail if wallet has no outputs; run these tests on new wallet


                  (0, _assert["default"])(outputsHex.length > 0); // wallet exports outputs since last export by default

                  _context63.next = 7;
                  return that.wallet.exportOutputs();

                case 7:
                  outputsHex = _context63.sent;
                  _context63.next = 10;
                  return that.wallet.exportOutputs(true);

                case 10:
                  outputsHexAll = _context63.sent;
                  (0, _assert["default"])(outputsHexAll.length > outputsHex.length);

                case 12:
                case "end":
                  return _context63.stop();
              }
            }
          }, _callee62);
        })));
        if (testConfig.testNonRelays) it("Can import outputs in hex format", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee63() {
          var outputsHex, numImported;
          return _regenerator["default"].wrap(function _callee63$(_context64) {
            while (1) {
              switch (_context64.prev = _context64.next) {
                case 0:
                  _context64.next = 2;
                  return that.wallet.exportOutputs();

                case 2:
                  outputsHex = _context64.sent;

                  if (!(outputsHex !== undefined)) {
                    _context64.next = 8;
                    break;
                  }

                  _context64.next = 6;
                  return that.wallet.importOutputs(outputsHex);

                case 6:
                  numImported = _context64.sent;
                  (0, _assert["default"])(numImported >= 0);

                case 8:
                case "end":
                  return _context64.stop();
              }
            }
          }, _callee63);
        })));
        if (testConfig.testNonRelays) it("Has correct accounting across accounts, subaddresses, txs, transfers, and outputs", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee64() {
          var walletBalance, walletUnlockedBalance, accounts, accountsBalance, accountsUnlockedBalance, _iterator81, _step81, account, txs, hasUnconfirmedTx, _iterator82, _step82, tx, walletSum, _iterator83, _step83, _output13, _iterator84, _step84, _output12, _iterator85, _step85, _account, accountSum, accountOutputs, _iterator86, _step86, _output14, _iterator87, _step87, subaddress, subaddressSum, subaddressOutputs, _iterator88, _step88, _output15;

          return _regenerator["default"].wrap(function _callee64$(_context65) {
            while (1) {
              switch (_context65.prev = _context65.next) {
                case 0:
                  _context65.next = 2;
                  return that.wallet.getBalance();

                case 2:
                  walletBalance = _context65.sent;
                  _context65.next = 5;
                  return that.wallet.getUnlockedBalance();

                case 5:
                  walletUnlockedBalance = _context65.sent;
                  _context65.next = 8;
                  return that.wallet.getAccounts(true);

                case 8:
                  accounts = _context65.sent;

                  // includes subaddresses
                  // test wallet balance
                  _TestUtils["default"].testUnsignedBigInt(walletBalance);

                  _TestUtils["default"].testUnsignedBigInt(walletUnlockedBalance);

                  (0, _assert["default"])(BitIntegerCompare(walletBalance, walletUnlockedBalance) >= 0); // test that wallet balance equals sum of account balances

                  accountsBalance = BigInt(0);
                  accountsUnlockedBalance = BigInt(0);
                  _iterator81 = _createForOfIteratorHelper(accounts);
                  _context65.prev = 15;

                  _iterator81.s();

                case 17:
                  if ((_step81 = _iterator81.n()).done) {
                    _context65.next = 29;
                    break;
                  }

                  account = _step81.value;
                  _context65.next = 21;
                  return testAccount(account);

                case 21:
                  // test that account balance equals sum of subaddress balances
                  accountsBalance = accountsBalance.add(account.getBalance());
                  accountsUnlockedBalance = accountsUnlockedBalance.add(account.getUnlockedBalance());
                  _context65.next = 25;
                  return testAccount(account);

                case 25:
                  // test that account balance equals sum of subaddress balances
                  accountsBalance = accountsBalance + account.getBalance();
                  accountsUnlockedBalance = accountsUnlockedBalance + account.getUnlockedBalance();

                case 27:
                  _context65.next = 17;
                  break;

                case 29:
                  _context65.next = 34;
                  break;

                case 31:
                  _context65.prev = 31;
                  _context65.t0 = _context65["catch"](15);

                  _iterator81.e(_context65.t0);

                case 34:
                  _context65.prev = 34;

                  _iterator81.f();

                  return _context65.finish(34);

                case 37:
                  _assert["default"].equal(BitIntegerCompare(walletBalance, accountsBalance), 0);

                  _assert["default"].equal(BitIntegerCompare(walletUnlockedBalance, accountsUnlockedBalance), 0); //        // test that wallet balance equals net of wallet's incoming and outgoing tx amounts
                  //        // TODO monero-wallet-rpc: these tests are disabled because incoming transfers are not returned when sent from the same account, so doesn't balance #4500
                  //        // TODO: test unlocked balance based on txs, requires e.g. tx.isLocked()
                  //        let outgoingSum = BigInt(0);
                  //        let incomingSum = BigInt(0);
                  //        for (let tx of txs) {
                  //          if (tx.getOutgoingAmount()) outgoingSum = outgoingSum + (tx.getOutgoingAmount());
                  //          if (tx.getIncomingAmount()) incomingSum = incomingSum + (tx.getIncomingAmount());
                  //        }
                  //        assert.equal(incomingSum - (outgoingSum).toString(), walletBalance.toString());
                  //        
                  //        // test that each account's balance equals net of account's incoming and outgoing tx amounts
                  //        for (let account of accounts) {
                  //          if (account.getIndex() !== 1) continue; // find 1
                  //          outgoingSum = BigInt(0);
                  //          incomingSum = BigInt(0);
                  //          let filter = new MoneroTxQuery();
                  //          filter.setAccountIndex(account.getIndex());
                  //          for (let tx of txs.filter(tx => filter.meetsCriteria(tx))) { // normally we'd call wallet.getTxs(filter) but we're using pre-fetched txs
                  //            if (tx.getHash() === "8d3919d98dd5a734da8c52eddc558db3fbf059ad55d432f0052ecd59ef122ecb") console.log(tx.toString(0));
                  //            
                  //            //console.log((tx.getOutgoingAmount() ? tx.getOutgoingAmount().toString() : "") + ", " + (tx.getIncomingAmount() ? tx.getIncomingAmount().toString() : ""));
                  //            if (tx.getOutgoingAmount()) outgoingSum = outgoingSum + (tx.getOutgoingAmount());
                  //            if (tx.getIncomingAmount()) incomingSum = incomingSum + (tx.getIncomingAmount());
                  //          }
                  //          assert.equal(incomingSum - (outgoingSum).toString(), account.getBalance().toString());
                  //        }
                  // balance may not equal sum of unspent outputs if unconfirmed txs
                  // TODO monero-wallet-rpc: reason not to return unspent outputs on unconfirmed txs? then this isn't necessary


                  _context65.next = 41;
                  return that.wallet.getTxs();

                case 41:
                  txs = _context65.sent;
                  hasUnconfirmedTx = false;
                  _iterator82 = _createForOfIteratorHelper(txs);

                  try {
                    for (_iterator82.s(); !(_step82 = _iterator82.n()).done;) {
                      tx = _step82.value;
                      if (tx.inTxPool()) hasUnconfirmedTx = true;
                    } // wallet balance is sum of all unspent outputs

                  } catch (err) {
                    _iterator82.e(err);
                  } finally {
                    _iterator82.f();
                  }

                  walletSum = BigInt(0);
                  _context65.t1 = _createForOfIteratorHelper;
                  _context65.next = 49;
                  return that.wallet.getOutputs({
                    isSpent: false
                  });

                case 49:
                  _context65.t2 = _context65.sent;
                  _iterator83 = (0, _context65.t1)(_context65.t2);

                  try {
                    for (_iterator83.s(); !(_step83 = _iterator83.n()).done;) {
                      _output13 = _step83.value;
                      walletSum = walletSum + _output13.getAmount();
                    }
                  } catch (err) {
                    _iterator83.e(err);
                  } finally {
                    _iterator83.f();
                  }

                  if (!(BitIntegerCompare(walletBalance, walletSum) !== 0)) {
                    _context65.next = 61;
                    break;
                  }

                  // txs may have changed in between calls so retry test
                  walletSum = BigInt(0);
                  _context65.t3 = _createForOfIteratorHelper;
                  _context65.next = 57;
                  return that.wallet.getOutputs({
                    isSpent: false
                  });

                case 57:
                  _context65.t4 = _context65.sent;
                  _iterator84 = (0, _context65.t3)(_context65.t4);

                  try {
                    for (_iterator84.s(); !(_step84 = _iterator84.n()).done;) {
                      _output12 = _step84.value;
                      walletSum = walletSum + _output12.getAmount();
                    }
                  } catch (err) {
                    _iterator84.e(err);
                  } finally {
                    _iterator84.f();
                  }

                  if (BitIntegerCompare(walletBalance, walletSum) !== 0) (0, _assert["default"])(hasUnconfirmedTx, "Wallet balance must equal sum of unspent outputs if no unconfirmed txs");

                case 61:
                  // account balances are sum of their unspent outputs
                  _iterator85 = _createForOfIteratorHelper(accounts);
                  _context65.prev = 62;

                  _iterator85.s();

                case 64:
                  if ((_step85 = _iterator85.n()).done) {
                    _context65.next = 97;
                    break;
                  }

                  _account = _step85.value;
                  accountSum = BigInt(0);
                  _context65.next = 69;
                  return that.wallet.getOutputs({
                    accountIndex: _account.getIndex(),
                    isSpent: false
                  });

                case 69:
                  accountOutputs = _context65.sent;
                  _iterator86 = _createForOfIteratorHelper(accountOutputs);

                  try {
                    for (_iterator86.s(); !(_step86 = _iterator86.n()).done;) {
                      _output14 = _step86.value;
                      accountSum = accountSum + _output14.getAmount();
                    }
                  } catch (err) {
                    _iterator86.e(err);
                  } finally {
                    _iterator86.f();
                  }

                  if (_account.getBalance().toString() !== accountSum.toString()) (0, _assert["default"])(hasUnconfirmedTx, "Account balance must equal sum of its unspent outputs if no unconfirmed txs"); // subaddress balances are sum of their unspent outputs

                  _iterator87 = _createForOfIteratorHelper(_account.getSubaddresses());
                  _context65.prev = 74;

                  _iterator87.s();

                case 76:
                  if ((_step87 = _iterator87.n()).done) {
                    _context65.next = 87;
                    break;
                  }

                  subaddress = _step87.value;
                  subaddressSum = BigInt(0);
                  _context65.next = 81;
                  return that.wallet.getOutputs({
                    accountIndex: _account.getIndex(),
                    subaddressIndex: subaddress.getIndex(),
                    isSpent: false
                  });

                case 81:
                  subaddressOutputs = _context65.sent;
                  _iterator88 = _createForOfIteratorHelper(subaddressOutputs);

                  try {
                    for (_iterator88.s(); !(_step88 = _iterator88.n()).done;) {
                      _output15 = _step88.value;
                      subaddressSum = subaddressSum + _output15.getAmount();
                    }
                  } catch (err) {
                    _iterator88.e(err);
                  } finally {
                    _iterator88.f();
                  }

                  if (subaddress.getBalance().toString() !== subaddressSum.toString()) (0, _assert["default"])(hasUnconfirmedTx, "Subaddress balance must equal sum of its unspent outputs if no unconfirmed txs");

                case 85:
                  _context65.next = 76;
                  break;

                case 87:
                  _context65.next = 92;
                  break;

                case 89:
                  _context65.prev = 89;
                  _context65.t5 = _context65["catch"](74);

                  _iterator87.e(_context65.t5);

                case 92:
                  _context65.prev = 92;

                  _iterator87.f();

                  return _context65.finish(92);

                case 95:
                  _context65.next = 64;
                  break;

                case 97:
                  _context65.next = 102;
                  break;

                case 99:
                  _context65.prev = 99;
                  _context65.t6 = _context65["catch"](62);

                  _iterator85.e(_context65.t6);

                case 102:
                  _context65.prev = 102;

                  _iterator85.f();

                  return _context65.finish(102);

                case 105:
                case "end":
                  return _context65.stop();
              }
            }
          }, _callee64, null, [[15, 31, 34, 37], [62, 99, 102, 105], [74, 89, 92, 95]]);
        })));
        if (testConfig.testNonRelays) it("Can get and set a transaction note", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee65() {
          var txs, uuid, i, _i4;

          return _regenerator["default"].wrap(function _callee65$(_context66) {
            while (1) {
              switch (_context66.prev = _context66.next) {
                case 0:
                  _context66.next = 2;
                  return getRandomTransactions(that.wallet, undefined, 1, 5);

                case 2:
                  txs = _context66.sent;
                  // set notes
                  uuid = _index.GenUtils.getUUID();
                  i = 0;

                case 5:
                  if (!(i < txs.length)) {
                    _context66.next = 11;
                    break;
                  }

                  _context66.next = 8;
                  return that.wallet.setTxNote(txs[i].getHash(), uuid + i);

                case 8:
                  i++;
                  _context66.next = 5;
                  break;

                case 11:
                  _i4 = 0;

                case 12:
                  if (!(_i4 < txs.length)) {
                    _context66.next = 22;
                    break;
                  }

                  _context66.t0 = _assert["default"];
                  _context66.next = 16;
                  return that.wallet.getTxNote(txs[_i4].getHash());

                case 16:
                  _context66.t1 = _context66.sent;
                  _context66.t2 = uuid + _i4;

                  _context66.t0.equal.call(_context66.t0, _context66.t1, _context66.t2);

                case 19:
                  _i4++;
                  _context66.next = 12;
                  break;

                case 22:
                case "end":
                  return _context66.stop();
              }
            }
          }, _callee65);
        }))); // TODO: why does getting cached txs take 2 seconds when should already be cached?

        if (testConfig.testNonRelays) it("Can get and set multiple transaction notes", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee66() {
          var uuid, txs, txHashes, txNotes, i, _i5;

          return _regenerator["default"].wrap(function _callee66$(_context67) {
            while (1) {
              switch (_context67.prev = _context67.next) {
                case 0:
                  // set tx notes
                  uuid = _index.GenUtils.getUUID();
                  _context67.next = 3;
                  return that.wallet.getTxs();

                case 3:
                  txs = _context67.sent;
                  (0, _assert["default"])(txs.length >= 3, "Test requires 3 or more wallet transactions; run send tests");
                  txHashes = [];
                  txNotes = [];

                  for (i = 0; i < txHashes.length; i++) {
                    txHashes.push(txs[i].getHash());
                    txNotes.push(uuid + i);
                  }

                  _context67.next = 10;
                  return that.wallet.setTxNotes(txHashes, txNotes);

                case 10:
                  _context67.next = 12;
                  return that.wallet.getTxNotes(txHashes);

                case 12:
                  txNotes = _context67.sent;

                  for (_i5 = 0; _i5 < txHashes.length; _i5++) {
                    _assert["default"].equal(uuid + _i5, txNotes[_i5]);
                  } // TODO: test that get transaction has note


                case 14:
                case "end":
                  return _context67.stop();
              }
            }
          }, _callee66);
        })));
        if (testConfig.testNonRelays) it("Can check a transfer using the transaction's secret key and the destination", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee67() {
          var txs, _iterator89, _step89, _tx15, _key, _iterator91, _step91, _destination, _check, tx, key, destination, differentAddress, _iterator90, _step90, aTx, _iterator92, _step92, aDestination, check;

          return _regenerator["default"].wrap(function _callee67$(_context68) {
            while (1) {
              switch (_context68.prev = _context68.next) {
                case 0:
                  _context68.next = 2;
                  return that.wallet.getTxs({
                    isConfirmed: true,
                    isOutgoing: true,
                    transferQuery: {
                      hasDestinations: true
                    }
                  });

                case 2:
                  _context68.t0 = _context68.sent.length;

                  if (!(_context68.t0 === 0)) {
                    _context68.next = 7;
                    break;
                  }

                  _TestUtils["default"].WALLET_TX_TRACKER.reset();

                  _context68.next = 7;
                  return _TestUtils["default"].WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);

                case 7:
                  _context68.prev = 7;
                  _context68.next = 10;
                  return getRandomTransactions(that.wallet, {
                    isConfirmed: true,
                    isOutgoing: true,
                    transferQuery: {
                      hasDestinations: true
                    }
                  }, 1, MAX_TX_PROOFS);

                case 10:
                  txs = _context68.sent;
                  _context68.next = 18;
                  break;

                case 13:
                  _context68.prev = 13;
                  _context68.t1 = _context68["catch"](7);

                  if (!(_context68.t1.message.indexOf("found with") >= 0)) {
                    _context68.next = 17;
                    break;
                  }

                  throw new Error("No txs with outgoing destinations found; run send tests");

                case 17:
                  throw _context68.t1;

                case 18:
                  // test good checks
                  (0, _assert["default"])(txs.length > 0, "No transactions found with outgoing destinations");
                  _iterator89 = _createForOfIteratorHelper(txs);
                  _context68.prev = 20;

                  _iterator89.s();

                case 22:
                  if ((_step89 = _iterator89.n()).done) {
                    _context68.next = 51;
                    break;
                  }

                  _tx15 = _step89.value;
                  _context68.next = 26;
                  return that.wallet.getTxKey(_tx15.getHash());

                case 26:
                  _key = _context68.sent;
                  (0, _assert["default"])(_key, "No tx key returned for tx hash");
                  (0, _assert["default"])(_tx15.getOutgoingTransfer().getDestinations().length > 0);
                  _iterator91 = _createForOfIteratorHelper(_tx15.getOutgoingTransfer().getDestinations());
                  _context68.prev = 30;

                  _iterator91.s();

                case 32:
                  if ((_step91 = _iterator91.n()).done) {
                    _context68.next = 41;
                    break;
                  }

                  _destination = _step91.value;
                  _context68.next = 36;
                  return that.wallet.checkTxKey(_tx15.getHash(), _key, _destination.getAddress());

                case 36:
                  _check = _context68.sent;

                  if (BitIntegerCompare(_destination.getAmount(), BigInt()) > 0) {
                    // TODO monero-wallet-rpc: indicates amount received amount is 0 despite transaction with transfer to this address
                    // TODO monero-wallet-rpc: returns 0-4 errors, not consistent
                    //            assert(GenUtils.compareBigInt(check.getReceivedAmount(), BigInt(0)) > 0);
                    if (BitIntegerCompare(_check.getReceivedAmount(), BigInt(0)) === 0) {
                      console.log("WARNING: key proof indicates no funds received despite transfer (txid=" + _tx15.getHash() + ", key=" + _key + ", address=" + _destination.getAddress() + ", amount=" + _destination.getAmount() + ")");
                    }
                  } else (0, _assert["default"])(BitIntegerCompare(_check.getReceivedAmount(), BigInt(0)) === 0);

                  testCheckTx(_tx15, _check);

                case 39:
                  _context68.next = 32;
                  break;

                case 41:
                  _context68.next = 46;
                  break;

                case 43:
                  _context68.prev = 43;
                  _context68.t2 = _context68["catch"](30);

                  _iterator91.e(_context68.t2);

                case 46:
                  _context68.prev = 46;

                  _iterator91.f();

                  return _context68.finish(46);

                case 49:
                  _context68.next = 22;
                  break;

                case 51:
                  _context68.next = 56;
                  break;

                case 53:
                  _context68.prev = 53;
                  _context68.t3 = _context68["catch"](20);

                  _iterator89.e(_context68.t3);

                case 56:
                  _context68.prev = 56;

                  _iterator89.f();

                  return _context68.finish(56);

                case 59:
                  _context68.prev = 59;
                  _context68.next = 62;
                  return that.wallet.getTxKey("invalid_tx_id");

                case 62:
                  throw new Error("Should throw exception for invalid key");

                case 65:
                  _context68.prev = 65;
                  _context68.t4 = _context68["catch"](59);

                  that._testInvalidTxHashError(_context68.t4);

                case 68:
                  // test check with invalid tx hash
                  tx = txs[0];
                  _context68.next = 71;
                  return that.wallet.getTxKey(tx.getHash());

                case 71:
                  key = _context68.sent;
                  destination = tx.getOutgoingTransfer().getDestinations()[0];
                  _context68.prev = 73;
                  _context68.next = 76;
                  return that.wallet.checkTxKey("invalid_tx_id", key, destination.getAddress());

                case 76:
                  throw new Error("Should have thrown exception");

                case 79:
                  _context68.prev = 79;
                  _context68.t5 = _context68["catch"](73);

                  that._testInvalidTxHashError(_context68.t5);

                case 82:
                  _context68.prev = 82;
                  _context68.next = 85;
                  return that.wallet.checkTxKey(tx.getHash(), "invalid_tx_key", destination.getAddress());

                case 85:
                  throw new Error("Should have thrown exception");

                case 88:
                  _context68.prev = 88;
                  _context68.t6 = _context68["catch"](82);

                  that._testInvalidTxKeyError(_context68.t6);

                case 91:
                  _context68.prev = 91;
                  _context68.next = 94;
                  return that.wallet.checkTxKey(tx.getHash(), key, "invalid_tx_address");

                case 94:
                  throw new Error("Should have thrown exception");

                case 97:
                  _context68.prev = 97;
                  _context68.t7 = _context68["catch"](91);

                  that._testInvalidAddressError(_context68.t7);

                case 100:
                  _context68.t8 = _createForOfIteratorHelper;
                  _context68.next = 103;
                  return that.wallet.getTxs();

                case 103:
                  _context68.t9 = _context68.sent;
                  _iterator90 = (0, _context68.t8)(_context68.t9);
                  _context68.prev = 105;

                  _iterator90.s();

                case 107:
                  if ((_step90 = _iterator90.n()).done) {
                    _context68.next = 131;
                    break;
                  }

                  aTx = _step90.value;

                  if (!(!aTx.getOutgoingTransfer() || !aTx.getOutgoingTransfer().getDestinations())) {
                    _context68.next = 111;
                    break;
                  }

                  return _context68.abrupt("continue", 129);

                case 111:
                  _iterator92 = _createForOfIteratorHelper(aTx.getOutgoingTransfer().getDestinations());
                  _context68.prev = 112;

                  _iterator92.s();

                case 114:
                  if ((_step92 = _iterator92.n()).done) {
                    _context68.next = 121;
                    break;
                  }

                  aDestination = _step92.value;

                  if (!(aDestination.getAddress() !== destination.getAddress())) {
                    _context68.next = 119;
                    break;
                  }

                  differentAddress = aDestination.getAddress();
                  return _context68.abrupt("break", 121);

                case 119:
                  _context68.next = 114;
                  break;

                case 121:
                  _context68.next = 126;
                  break;

                case 123:
                  _context68.prev = 123;
                  _context68.t10 = _context68["catch"](112);

                  _iterator92.e(_context68.t10);

                case 126:
                  _context68.prev = 126;

                  _iterator92.f();

                  return _context68.finish(126);

                case 129:
                  _context68.next = 107;
                  break;

                case 131:
                  _context68.next = 136;
                  break;

                case 133:
                  _context68.prev = 133;
                  _context68.t11 = _context68["catch"](105);

                  _iterator90.e(_context68.t11);

                case 136:
                  _context68.prev = 136;

                  _iterator90.f();

                  return _context68.finish(136);

                case 139:
                  (0, _assert["default"])(differentAddress, "Could not get a different outgoing address to test; run send tests");
                  _context68.next = 142;
                  return that.wallet.checkTxKey(tx.getHash(), key, differentAddress);

                case 142:
                  check = _context68.sent;
                  (0, _assert["default"])(check.isGood());
                  (0, _assert["default"])(BitIntegerCompare(check.getReceivedAmount(), BigInt(0)) >= 0);
                  testCheckTx(tx, check);

                case 146:
                case "end":
                  return _context68.stop();
              }
            }
          }, _callee67, null, [[7, 13], [20, 53, 56, 59], [30, 43, 46, 49], [59, 65], [73, 79], [82, 88], [91, 97], [105, 133, 136, 139], [112, 123, 126, 129]]);
        })));
        if (testConfig.testNonRelays) it("Can prove a transaction by getting its signature", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee68() {
          var txs, _iterator93, _step93, _tx16, _iterator94, _step94, _destination2, _signature, _check2, tx, destination, signature, check, wrongSignature;

          return _regenerator["default"].wrap(function _callee68$(_context69) {
            while (1) {
              switch (_context69.prev = _context69.next) {
                case 0:
                  _context69.prev = 0;
                  _context69.next = 3;
                  return getRandomTransactions(that.wallet, {
                    transferQuery: {
                      hasDestinations: true
                    }
                  }, 2, MAX_TX_PROOFS);

                case 3:
                  txs = _context69.sent;
                  _context69.next = 11;
                  break;

                case 6:
                  _context69.prev = 6;
                  _context69.t0 = _context69["catch"](0);

                  if (!(_context69.t0.message.indexOf("found with") >= 0)) {
                    _context69.next = 10;
                    break;
                  }

                  throw new Error("No txs with outgoing destinations found; run send tests");

                case 10:
                  throw _context69.t0;

                case 11:
                  // test good checks with messages
                  _iterator93 = _createForOfIteratorHelper(txs);
                  _context69.prev = 12;

                  _iterator93.s();

                case 14:
                  if ((_step93 = _iterator93.n()).done) {
                    _context69.next = 41;
                    break;
                  }

                  _tx16 = _step93.value;
                  _iterator94 = _createForOfIteratorHelper(_tx16.getOutgoingTransfer().getDestinations());
                  _context69.prev = 17;

                  _iterator94.s();

                case 19:
                  if ((_step94 = _iterator94.n()).done) {
                    _context69.next = 31;
                    break;
                  }

                  _destination2 = _step94.value;
                  _context69.next = 23;
                  return that.wallet.getTxProof(_tx16.getHash(), _destination2.getAddress(), "This transaction definitely happened.");

                case 23:
                  _signature = _context69.sent;
                  (0, _assert["default"])(_signature, "No signature returned from getTxProof()");
                  _context69.next = 27;
                  return that.wallet.checkTxProof(_tx16.getHash(), _destination2.getAddress(), "This transaction definitely happened.", _signature);

                case 27:
                  _check2 = _context69.sent;
                  testCheckTx(_tx16, _check2);

                case 29:
                  _context69.next = 19;
                  break;

                case 31:
                  _context69.next = 36;
                  break;

                case 33:
                  _context69.prev = 33;
                  _context69.t1 = _context69["catch"](17);

                  _iterator94.e(_context69.t1);

                case 36:
                  _context69.prev = 36;

                  _iterator94.f();

                  return _context69.finish(36);

                case 39:
                  _context69.next = 14;
                  break;

                case 41:
                  _context69.next = 46;
                  break;

                case 43:
                  _context69.prev = 43;
                  _context69.t2 = _context69["catch"](12);

                  _iterator93.e(_context69.t2);

                case 46:
                  _context69.prev = 46;

                  _iterator93.f();

                  return _context69.finish(46);

                case 49:
                  // test good check without message
                  tx = txs[0];
                  destination = tx.getOutgoingTransfer().getDestinations()[0];
                  _context69.next = 53;
                  return that.wallet.getTxProof(tx.getHash(), destination.getAddress());

                case 53:
                  signature = _context69.sent;
                  _context69.next = 56;
                  return that.wallet.checkTxProof(tx.getHash(), destination.getAddress(), undefined, signature);

                case 56:
                  check = _context69.sent;
                  testCheckTx(tx, check); // test get proof with invalid hash

                  _context69.prev = 58;
                  _context69.next = 61;
                  return that.wallet.getTxProof("invalid_tx_id", destination.getAddress());

                case 61:
                  throw new Error("Should throw exception for invalid key");

                case 64:
                  _context69.prev = 64;
                  _context69.t3 = _context69["catch"](58);

                  that._testInvalidTxHashError(_context69.t3);

                case 67:
                  _context69.prev = 67;
                  _context69.next = 70;
                  return that.wallet.checkTxProof("invalid_tx_id", destination.getAddress(), undefined, signature);

                case 70:
                  throw new Error("Should have thrown exception");

                case 73:
                  _context69.prev = 73;
                  _context69.t4 = _context69["catch"](67);

                  that._testInvalidTxHashError(_context69.t4);

                case 76:
                  _context69.prev = 76;
                  _context69.next = 79;
                  return that.wallet.checkTxProof(tx.getHash(), "invalid_tx_address", undefined, signature);

                case 79:
                  throw new Error("Should have thrown exception");

                case 82:
                  _context69.prev = 82;
                  _context69.t5 = _context69["catch"](76);

                  that._testInvalidAddressError(_context69.t5);

                case 85:
                  _context69.next = 87;
                  return that.wallet.getTxProof(tx.getHash(), destination.getAddress(), "This is the right message");

                case 87:
                  signature = _context69.sent;
                  _context69.next = 90;
                  return that.wallet.checkTxProof(tx.getHash(), destination.getAddress(), "This is the wrong message", signature);

                case 90:
                  check = _context69.sent;

                  _assert["default"].equal(check.isGood(), false);

                  testCheckTx(tx, check); // test check with wrong signature

                  _context69.next = 95;
                  return that.wallet.getTxProof(txs[1].getHash(), txs[1].getOutgoingTransfer().getDestinations()[0].getAddress(), "This is the right message");

                case 95:
                  wrongSignature = _context69.sent;
                  _context69.prev = 96;
                  _context69.next = 99;
                  return that.wallet.checkTxProof(tx.getHash(), destination.getAddress(), "This is the right message", wrongSignature);

                case 99:
                  check = _context69.sent;

                  _assert["default"].equal(check.isGood(), false);

                  _context69.next = 106;
                  break;

                case 103:
                  _context69.prev = 103;
                  _context69.t6 = _context69["catch"](96);

                  that._testInvalidSignatureError(_context69.t6);

                case 106:
                  _context69.prev = 106;
                  _context69.next = 109;
                  return that.wallet.checkTxProof(tx.getHash(), destination.getAddress(), "This is the right message", "");

                case 109:
                  check = _context69.sent;

                  _assert["default"].equal(check.isGood(), false);

                  _context69.next = 116;
                  break;

                case 113:
                  _context69.prev = 113;
                  _context69.t7 = _context69["catch"](106);

                  _assert["default"].equal("Must provide signature to check tx proof", _context69.t7.message);

                case 116:
                case "end":
                  return _context69.stop();
              }
            }
          }, _callee68, null, [[0, 6], [12, 43, 46, 49], [17, 33, 36, 39], [58, 64], [67, 73], [76, 82], [96, 103], [106, 113]]);
        })));
        if (testConfig.testNonRelays) it("Can prove a spend using a generated signature and no destination public address", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee69() {
          var txs, _iterator95, _step95, _tx17, _iterator96, _step96, _tx18, _signature2, tx, signature;

          return _regenerator["default"].wrap(function _callee69$(_context70) {
            while (1) {
              switch (_context70.prev = _context70.next) {
                case 0:
                  _context70.next = 2;
                  return getRandomTransactions(that.wallet, {
                    isIncoming: false,
                    inTxPool: false,
                    isFailed: false
                  }, 2, MAX_TX_PROOFS);

                case 2:
                  txs = _context70.sent;
                  _iterator95 = _createForOfIteratorHelper(txs);

                  try {
                    for (_iterator95.s(); !(_step95 = _iterator95.n()).done;) {
                      _tx17 = _step95.value;

                      _assert["default"].equal(_tx17.isConfirmed(), true);

                      _assert["default"].equal(_tx17.getIncomingTransfers(), undefined);

                      (0, _assert["default"])(_tx17.getOutgoingTransfer());
                    } // test good checks with messages

                  } catch (err) {
                    _iterator95.e(err);
                  } finally {
                    _iterator95.f();
                  }

                  _iterator96 = _createForOfIteratorHelper(txs);
                  _context70.prev = 6;

                  _iterator96.s();

                case 8:
                  if ((_step96 = _iterator96.n()).done) {
                    _context70.next = 21;
                    break;
                  }

                  _tx18 = _step96.value;
                  _context70.next = 12;
                  return that.wallet.getSpendProof(_tx18.getHash(), "I am a message.");

                case 12:
                  _signature2 = _context70.sent;
                  (0, _assert["default"])(_signature2, "No signature returned for spend proof");
                  _context70.t0 = _assert["default"];
                  _context70.next = 17;
                  return that.wallet.checkSpendProof(_tx18.getHash(), "I am a message.", _signature2);

                case 17:
                  _context70.t1 = _context70.sent;
                  (0, _context70.t0)(_context70.t1);

                case 19:
                  _context70.next = 8;
                  break;

                case 21:
                  _context70.next = 26;
                  break;

                case 23:
                  _context70.prev = 23;
                  _context70.t2 = _context70["catch"](6);

                  _iterator96.e(_context70.t2);

                case 26:
                  _context70.prev = 26;

                  _iterator96.f();

                  return _context70.finish(26);

                case 29:
                  // test good check without message
                  tx = txs[0];
                  _context70.next = 32;
                  return that.wallet.getSpendProof(tx.getHash());

                case 32:
                  signature = _context70.sent;
                  _context70.t3 = _assert["default"];
                  _context70.next = 36;
                  return that.wallet.checkSpendProof(tx.getHash(), undefined, signature);

                case 36:
                  _context70.t4 = _context70.sent;
                  (0, _context70.t3)(_context70.t4);
                  _context70.prev = 38;
                  _context70.next = 41;
                  return that.wallet.getSpendProof("invalid_tx_id");

                case 41:
                  throw new Error("Should throw exception for invalid key");

                case 44:
                  _context70.prev = 44;
                  _context70.t5 = _context70["catch"](38);

                  that._testInvalidTxHashError(_context70.t5);

                case 47:
                  _context70.prev = 47;
                  _context70.next = 50;
                  return that.wallet.checkSpendProof("invalid_tx_id", undefined, signature);

                case 50:
                  throw new Error("Should have thrown exception");

                case 53:
                  _context70.prev = 53;
                  _context70.t6 = _context70["catch"](47);

                  that._testInvalidTxHashError(_context70.t6);

                case 56:
                  _context70.next = 58;
                  return that.wallet.getSpendProof(tx.getHash(), "This is the right message");

                case 58:
                  signature = _context70.sent;
                  _context70.t7 = _assert["default"];
                  _context70.next = 62;
                  return that.wallet.checkSpendProof(tx.getHash(), "This is the wrong message", signature);

                case 62:
                  _context70.t8 = _context70.sent;

                  _context70.t7.equal.call(_context70.t7, _context70.t8, false);

                  _context70.next = 66;
                  return that.wallet.getSpendProof(txs[1].getHash(), "This is the right message");

                case 66:
                  signature = _context70.sent;
                  _context70.t9 = _assert["default"];
                  _context70.next = 70;
                  return that.wallet.checkSpendProof(tx.getHash(), "This is the right message", signature);

                case 70:
                  _context70.t10 = _context70.sent;

                  _context70.t9.equal.call(_context70.t9, _context70.t10, false);

                case 72:
                case "end":
                  return _context70.stop();
              }
            }
          }, _callee69, null, [[6, 23, 26, 29], [38, 44], [47, 53]]);
        })));
        if (testConfig.testNonRelays) it("Can prove reserves in the wallet", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee70() {
          var signature, check, balance, unconfirmedTxs, differentAddress;
          return _regenerator["default"].wrap(function _callee70$(_context71) {
            while (1) {
              switch (_context71.prev = _context71.next) {
                case 0:
                  _context71.next = 2;
                  return that.wallet.getReserveProofWallet("Test message");

                case 2:
                  signature = _context71.sent;
                  (0, _assert["default"])(signature, "No signature returned for wallet reserve proof"); // check proof of entire wallet

                  _context71.t0 = that.wallet;
                  _context71.next = 7;
                  return that.wallet.getPrimaryAddress();

                case 7:
                  _context71.t1 = _context71.sent;
                  _context71.t2 = signature;
                  _context71.next = 11;
                  return _context71.t0.checkReserveProof.call(_context71.t0, _context71.t1, "Test message", _context71.t2);

                case 11:
                  check = _context71.sent;
                  (0, _assert["default"])(check.isGood());
                  testCheckReserve(check);
                  _context71.next = 16;
                  return that.wallet.getBalance();

                case 16:
                  balance = _context71.sent;

                  if (!(BitIntegerCompare(balance, check.getTotalAmount()) !== 0)) {
                    _context71.next = 22;
                    break;
                  }

                  _context71.next = 20;
                  return that.wallet.getTxs({
                    inTxPool: true
                  });

                case 20:
                  unconfirmedTxs = _context71.sent;
                  (0, _assert["default"])(unconfirmedTxs.length > 0, "Reserve amount must equal balance unless wallet has unconfirmed txs");

                case 22:
                  _context71.next = 24;
                  return _TestUtils["default"].getExternalWalletAddress();

                case 24:
                  differentAddress = _context71.sent;
                  _context71.prev = 25;
                  _context71.next = 28;
                  return that.wallet.checkReserveProof(differentAddress, "Test message", signature);

                case 28:
                  throw new Error("Should have thrown exception");

                case 31:
                  _context71.prev = 31;
                  _context71.t3 = _context71["catch"](25);

                  that._testNoSubaddressError(_context71.t3);

                case 34:
                  _context71.prev = 34;
                  _context71.t4 = that.wallet;
                  _context71.next = 38;
                  return that.wallet.getSubaddress(0, 1);

                case 38:
                  _context71.t5 = _context71.sent.getAddress();
                  _context71.t6 = signature;
                  _context71.next = 42;
                  return _context71.t4.checkReserveProof.call(_context71.t4, _context71.t5, "Test message", _context71.t6);

                case 42:
                  throw new Error("Should have thrown exception");

                case 45:
                  _context71.prev = 45;
                  _context71.t7 = _context71["catch"](34);

                  that._testNoSubaddressError(_context71.t7);

                case 48:
                  _context71.t8 = that.wallet;
                  _context71.next = 51;
                  return that.wallet.getPrimaryAddress();

                case 51:
                  _context71.t9 = _context71.sent;
                  _context71.t10 = signature;
                  _context71.next = 55;
                  return _context71.t8.checkReserveProof.call(_context71.t8, _context71.t9, "Wrong message", _context71.t10);

                case 55:
                  check = _context71.sent;

                  _assert["default"].equal(check.isGood(), false); // TODO: specifically test reserve checks, probably separate objects


                  testCheckReserve(check); // test wrong signature

                  _context71.prev = 58;
                  _context71.t11 = that.wallet;
                  _context71.next = 62;
                  return that.wallet.getPrimaryAddress();

                case 62:
                  _context71.t12 = _context71.sent;
                  _context71.next = 65;
                  return _context71.t11.checkReserveProof.call(_context71.t11, _context71.t12, "Test message", "wrong signature");

                case 65:
                  throw new Error("Should have thrown exception");

                case 68:
                  _context71.prev = 68;
                  _context71.t13 = _context71["catch"](58);

                  that._testSignatureHeaderCheckError(_context71.t13);

                case 71:
                case "end":
                  return _context71.stop();
              }
            }
          }, _callee70, null, [[25, 31], [34, 45], [58, 68]]);
        })));
        if (testConfig.testNonRelays) it("Can prove reserves in an account", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee71() {
          var numNonZeroTests, msg, accounts, signature, _iterator97, _step97, account, checkAmount, _check3, reserveProof, differentAddress, check;

          return _regenerator["default"].wrap(function _callee71$(_context72) {
            while (1) {
              switch (_context72.prev = _context72.next) {
                case 0:
                  // test proofs of accounts
                  numNonZeroTests = 0;
                  msg = "Test message";
                  _context72.next = 4;
                  return that.wallet.getAccounts();

                case 4:
                  accounts = _context72.sent;
                  _iterator97 = _createForOfIteratorHelper(accounts);
                  _context72.prev = 6;

                  _iterator97.s();

                case 8:
                  if ((_step97 = _iterator97.n()).done) {
                    _context72.next = 54;
                    break;
                  }

                  account = _step97.value;

                  if (!(BitIntegerCompare(account.getBalance(), BigInt(0)) > 0)) {
                    _context72.next = 34;
                    break;
                  }

                  _context72.next = 13;
                  return account.getBalance();

                case 13:
                  _context72.t0 = _context72.sent;
                  _context72.t1 = BigInt(2);
                  checkAmount = _context72.t0 / _context72.t1;
                  _context72.next = 18;
                  return that.wallet.getReserveProofAccount(account.getIndex(), checkAmount, msg);

                case 18:
                  signature = _context72.sent;
                  _context72.t2 = that.wallet;
                  _context72.next = 22;
                  return that.wallet.getPrimaryAddress();

                case 22:
                  _context72.t3 = _context72.sent;
                  _context72.t4 = msg;
                  _context72.t5 = signature;
                  _context72.next = 27;
                  return _context72.t2.checkReserveProof.call(_context72.t2, _context72.t3, _context72.t4, _context72.t5);

                case 27:
                  _check3 = _context72.sent;
                  (0, _assert["default"])(_check3.isGood());
                  testCheckReserve(_check3);
                  (0, _assert["default"])(BitIntegerCompare(_check3.getTotalAmount(), checkAmount) >= 0);
                  numNonZeroTests++;
                  _context72.next = 52;
                  break;

                case 34:
                  _context72.prev = 34;
                  _context72.next = 37;
                  return that.wallet.getReserveProofAccount(account.getIndex(), account.getBalance(), msg);

                case 37:
                  throw new Error("Should have thrown exception");

                case 40:
                  _context72.prev = 40;
                  _context72.t6 = _context72["catch"](34);

                  _assert["default"].equal(_context72.t6.getCode(), -1);

                  _context72.prev = 43;
                  _context72.next = 46;
                  return that.wallet.getReserveProofAccount(account.getIndex(), _TestUtils["default"].MAX_FEE, msg);

                case 46:
                  throw new Error("Should have thrown exception");

                case 49:
                  _context72.prev = 49;
                  _context72.t7 = _context72["catch"](43);

                  _assert["default"].equal(_context72.t7.getCode(), -1);

                case 52:
                  _context72.next = 8;
                  break;

                case 54:
                  _context72.next = 59;
                  break;

                case 56:
                  _context72.prev = 56;
                  _context72.t8 = _context72["catch"](6);

                  _iterator97.e(_context72.t8);

                case 59:
                  _context72.prev = 59;

                  _iterator97.f();

                  return _context72.finish(59);

                case 62:
                  (0, _assert["default"])(numNonZeroTests > 1, "Must have more than one account with non-zero balance; run send-to-multiple tests"); // test error when not enough balance for requested minimum reserve amount

                  _context72.prev = 63;
                  _context72.next = 66;
                  return that.wallet.getReserveProofAccount(0, accounts[0].getBalance() + _TestUtils["default"].MAX_FEE, "Test message");

                case 66:
                  reserveProof = _context72.sent;
                  throw new Error("should have thrown error");

                case 70:
                  _context72.prev = 70;
                  _context72.t9 = _context72["catch"](63);

                  if (!(_context72.t9.message === "should have thrown error")) {
                    _context72.next = 74;
                    break;
                  }

                  throw new Error("Should have thrown exception but got reserve proof: https://github.com/monero-project/monero/issues/6595");

                case 74:
                  _assert["default"].equal(_context72.t9.getCode(), -1);

                case 75:
                  _context72.next = 77;
                  return _TestUtils["default"].getExternalWalletAddress();

                case 77:
                  differentAddress = _context72.sent;
                  _context72.prev = 78;
                  _context72.next = 81;
                  return that.wallet.checkReserveProof(differentAddress, "Test message", signature);

                case 81:
                  throw new Error("Should have thrown exception");

                case 84:
                  _context72.prev = 84;
                  _context72.t10 = _context72["catch"](78);

                  _assert["default"].equal(_context72.t10.getCode(), -1);

                case 87:
                  _context72.prev = 87;
                  _context72.t11 = that.wallet;
                  _context72.next = 91;
                  return that.wallet.getSubaddress(0, 1);

                case 91:
                  _context72.t12 = _context72.sent.getAddress();
                  _context72.t13 = signature;
                  _context72.next = 95;
                  return _context72.t11.checkReserveProof.call(_context72.t11, _context72.t12, "Test message", _context72.t13);

                case 95:
                  throw new Error("Should have thrown exception");

                case 98:
                  _context72.prev = 98;
                  _context72.t14 = _context72["catch"](87);

                  _assert["default"].equal(_context72.t14.getCode(), -1);

                case 101:
                  _context72.t15 = that.wallet;
                  _context72.next = 104;
                  return that.wallet.getPrimaryAddress();

                case 104:
                  _context72.t16 = _context72.sent;
                  _context72.t17 = signature;
                  _context72.next = 108;
                  return _context72.t15.checkReserveProof.call(_context72.t15, _context72.t16, "Wrong message", _context72.t17);

                case 108:
                  check = _context72.sent;

                  _assert["default"].equal(check.isGood(), false); // TODO: specifically test reserve checks, probably separate objects


                  testCheckReserve(check); // test wrong signature

                  _context72.prev = 111;
                  _context72.t18 = that.wallet;
                  _context72.next = 115;
                  return that.wallet.getPrimaryAddress();

                case 115:
                  _context72.t19 = _context72.sent;
                  _context72.next = 118;
                  return _context72.t18.checkReserveProof.call(_context72.t18, _context72.t19, "Test message", "wrong signature");

                case 118:
                  throw new Error("Should have thrown exception");

                case 121:
                  _context72.prev = 121;
                  _context72.t20 = _context72["catch"](111);

                  _assert["default"].equal(_context72.t20.getCode(), -1);

                case 124:
                case "end":
                  return _context72.stop();
              }
            }
          }, _callee71, null, [[6, 56, 59, 62], [34, 40], [43, 49], [63, 70], [78, 84], [87, 98], [111, 121]]);
        })));
        if (testConfig.testNonRelays) it("Can export key images", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee72() {
          var images, _iterator98, _step98, image, imagesAll;

          return _regenerator["default"].wrap(function _callee72$(_context73) {
            while (1) {
              switch (_context73.prev = _context73.next) {
                case 0:
                  _context73.next = 2;
                  return that.wallet.exportKeyImages(true);

                case 2:
                  images = _context73.sent;
                  (0, _assert["default"])(Array.isArray(images));
                  (0, _assert["default"])(images.length > 0, "No signed key images in wallet");
                  _iterator98 = _createForOfIteratorHelper(images);

                  try {
                    for (_iterator98.s(); !(_step98 = _iterator98.n()).done;) {
                      image = _step98.value;
                      (0, _assert["default"])(image instanceof _index.MoneroKeyImage);
                      (0, _assert["default"])(image.getHex());
                      (0, _assert["default"])(image.getSignature());
                    } // wallet exports key images since last export by default

                  } catch (err) {
                    _iterator98.e(err);
                  } finally {
                    _iterator98.f();
                  }

                  _context73.next = 9;
                  return that.wallet.exportKeyImages();

                case 9:
                  images = _context73.sent;
                  _context73.next = 12;
                  return that.wallet.exportKeyImages(true);

                case 12:
                  imagesAll = _context73.sent;
                  (0, _assert["default"])(imagesAll.length > images.length);

                case 14:
                case "end":
                  return _context73.stop();
              }
            }
          }, _callee72);
        })));
        if (testConfig.testNonRelays) it("Can get new key images from the last import", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee73() {
          var outputsHex, numImported, images, _iterator99, _step99, image;

          return _regenerator["default"].wrap(function _callee73$(_context74) {
            while (1) {
              switch (_context74.prev = _context74.next) {
                case 0:
                  _context74.next = 2;
                  return that.wallet.exportOutputs();

                case 2:
                  outputsHex = _context74.sent;

                  if (!(outputsHex !== undefined)) {
                    _context74.next = 8;
                    break;
                  }

                  _context74.next = 6;
                  return that.wallet.importOutputs(outputsHex);

                case 6:
                  numImported = _context74.sent;
                  (0, _assert["default"])(numImported > 0);

                case 8:
                  _context74.next = 10;
                  return that.wallet.getNewKeyImagesFromLastImport();

                case 10:
                  images = _context74.sent;
                  (0, _assert["default"])(Array.isArray(images));
                  (0, _assert["default"])(images.length > 0, "No new key images in last import"); // TODO: these are already known to the wallet, so no new key images will be imported

                  _iterator99 = _createForOfIteratorHelper(images);

                  try {
                    for (_iterator99.s(); !(_step99 = _iterator99.n()).done;) {
                      image = _step99.value;
                      (0, _assert["default"])(image.getHex());
                      (0, _assert["default"])(image.getSignature());
                    }
                  } catch (err) {
                    _iterator99.e(err);
                  } finally {
                    _iterator99.f();
                  }

                case 15:
                case "end":
                  return _context74.stop();
              }
            }
          }, _callee73);
        })));
        if (testConfig.testNonRelays && false) // TODO monero-project: importing key images can cause erasure of incoming transfers per wallet2.cpp:11957
          it("Can import key images", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee74() {
            var images, result, txs, balance, hasSpent, hasUnspent;
            return _regenerator["default"].wrap(function _callee74$(_context75) {
              while (1) {
                switch (_context75.prev = _context75.next) {
                  case 0:
                    _context75.next = 2;
                    return that.wallet.exportKeyImages();

                  case 2:
                    images = _context75.sent;
                    (0, _assert["default"])(Array.isArray(images));
                    (0, _assert["default"])(images.length > 0, "Wallet does not have any key images; run send tests");
                    _context75.next = 7;
                    return that.wallet.importKeyImages(images);

                  case 7:
                    result = _context75.sent;
                    (0, _assert["default"])(result.getHeight() > 0); // determine if non-zero spent and unspent amounts are expected

                    _context75.next = 11;
                    return that.wallet.getTxs({
                      isConfirmed: true,
                      transferQuery: {
                        isOutgoing: true
                      }
                    });

                  case 11:
                    txs = _context75.sent;
                    _context75.next = 14;
                    return that.wallet.getBalance();

                  case 14:
                    balance = _context75.sent;
                    hasSpent = txs.length > 0;
                    hasUnspent = balance.toJSValue() > 0; // test amounts

                    _TestUtils["default"].testUnsignedBigInt(result.getSpentAmount(), hasSpent);

                    _TestUtils["default"].testUnsignedBigInt(result.getUnspentAmount(), hasUnspent);

                  case 19:
                  case "end":
                    return _context75.stop();
                }
              }
            }, _callee74);
          })));
        if (testConfig.testNonRelays) it("Can sign and verify messages", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee75() {
          var msg, subaddresses, _i6, _subaddresses, subaddress, signature, result;

          return _regenerator["default"].wrap(function _callee75$(_context76) {
            while (1) {
              switch (_context76.prev = _context76.next) {
                case 0:
                  // message to sign and subaddresses to test
                  msg = "This is a super important message which needs to be signed and verified.";
                  subaddresses = [new _index.MoneroSubaddress(undefined, 0, 0), new _index.MoneroSubaddress(undefined, 0, 1), new _index.MoneroSubaddress(undefined, 1, 0)]; // test signing message with subaddresses

                  _i6 = 0, _subaddresses = subaddresses;

                case 3:
                  if (!(_i6 < _subaddresses.length)) {
                    _context76.next = 82;
                    break;
                  }

                  subaddress = _subaddresses[_i6];
                  _context76.next = 7;
                  return that.wallet.signMessage(msg, _index.MoneroMessageSignatureType.SIGN_WITH_SPEND_KEY, subaddress.getAccountIndex(), subaddress.getIndex());

                case 7:
                  signature = _context76.sent;
                  _context76.t0 = that.wallet;
                  _context76.t1 = msg;
                  _context76.next = 12;
                  return that.wallet.getAddress(subaddress.getAccountIndex(), subaddress.getIndex());

                case 12:
                  _context76.t2 = _context76.sent;
                  _context76.t3 = signature;
                  _context76.next = 16;
                  return _context76.t0.verifyMessage.call(_context76.t0, _context76.t1, _context76.t2, _context76.t3);

                case 16:
                  result = _context76.sent;

                  _assert["default"].deepEqual(result, new _index.MoneroMessageSignatureResult(true, false, _index.MoneroMessageSignatureType.SIGN_WITH_SPEND_KEY, 2)); // verify message with incorrect address


                  _context76.t4 = that.wallet;
                  _context76.t5 = msg;
                  _context76.next = 22;
                  return that.wallet.getAddress(0, 2);

                case 22:
                  _context76.t6 = _context76.sent;
                  _context76.t7 = signature;
                  _context76.next = 26;
                  return _context76.t4.verifyMessage.call(_context76.t4, _context76.t5, _context76.t6, _context76.t7);

                case 26:
                  result = _context76.sent;

                  _assert["default"].deepEqual(result, new _index.MoneroMessageSignatureResult(false)); // verify message with external address


                  _context76.t8 = that.wallet;
                  _context76.t9 = msg;
                  _context76.next = 32;
                  return _TestUtils["default"].getExternalWalletAddress();

                case 32:
                  _context76.t10 = _context76.sent;
                  _context76.t11 = signature;
                  _context76.next = 36;
                  return _context76.t8.verifyMessage.call(_context76.t8, _context76.t9, _context76.t10, _context76.t11);

                case 36:
                  result = _context76.sent;

                  _assert["default"].deepEqual(result, new _index.MoneroMessageSignatureResult(false)); // verify message with invalid address


                  _context76.next = 40;
                  return that.wallet.verifyMessage(msg, "invalid address", signature);

                case 40:
                  result = _context76.sent;

                  _assert["default"].deepEqual(result, new _index.MoneroMessageSignatureResult(false)); // sign and verify message with view key


                  _context76.next = 44;
                  return that.wallet.signMessage(msg, _index.MoneroMessageSignatureType.SIGN_WITH_VIEW_KEY, subaddress.getAccountIndex(), subaddress.getIndex());

                case 44:
                  signature = _context76.sent;
                  _context76.t12 = that.wallet;
                  _context76.t13 = msg;
                  _context76.next = 49;
                  return that.wallet.getAddress(subaddress.getAccountIndex(), subaddress.getIndex());

                case 49:
                  _context76.t14 = _context76.sent;
                  _context76.t15 = signature;
                  _context76.next = 53;
                  return _context76.t12.verifyMessage.call(_context76.t12, _context76.t13, _context76.t14, _context76.t15);

                case 53:
                  result = _context76.sent;

                  _assert["default"].deepEqual(result, new _index.MoneroMessageSignatureResult(true, false, _index.MoneroMessageSignatureType.SIGN_WITH_VIEW_KEY, 2)); // verify message with incorrect address


                  _context76.t16 = that.wallet;
                  _context76.t17 = msg;
                  _context76.next = 59;
                  return that.wallet.getAddress(0, 2);

                case 59:
                  _context76.t18 = _context76.sent;
                  _context76.t19 = signature;
                  _context76.next = 63;
                  return _context76.t16.verifyMessage.call(_context76.t16, _context76.t17, _context76.t18, _context76.t19);

                case 63:
                  result = _context76.sent;

                  _assert["default"].deepEqual(result, new _index.MoneroMessageSignatureResult(false)); // verify message with external address


                  _context76.t20 = that.wallet;
                  _context76.t21 = msg;
                  _context76.next = 69;
                  return _TestUtils["default"].getExternalWalletAddress();

                case 69:
                  _context76.t22 = _context76.sent;
                  _context76.t23 = signature;
                  _context76.next = 73;
                  return _context76.t20.verifyMessage.call(_context76.t20, _context76.t21, _context76.t22, _context76.t23);

                case 73:
                  result = _context76.sent;

                  _assert["default"].deepEqual(result, new _index.MoneroMessageSignatureResult(false)); // verify message with invalid address


                  _context76.next = 77;
                  return that.wallet.verifyMessage(msg, "invalid address", signature);

                case 77:
                  result = _context76.sent;

                  _assert["default"].deepEqual(result, new _index.MoneroMessageSignatureResult(false));

                case 79:
                  _i6++;
                  _context76.next = 3;
                  break;

                case 82:
                case "end":
                  return _context76.stop();
              }
            }
          }, _callee75);
        })));
        if (testConfig.testNonRelays) it("Has an address book", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee76() {
          var entries, numEntriesStart, _iterator100, _step100, _entry2, NUM_ENTRIES, address, indices, i, _i7, _indices, idx, found, _iterator101, _step101, entry, _i8, _indices2, _idx, _iterator102, _step102, _entry3, deleteIdx, _i9, paymentId, integratedAddresses, integratedDescriptions, _i10, integratedAddress, uuid, _idx2, _i11, _indices3, _idx3, _found3, _iterator103, _step103, _entry, _i12;

          return _regenerator["default"].wrap(function _callee76$(_context77) {
            while (1) {
              switch (_context77.prev = _context77.next) {
                case 0:
                  _context77.next = 2;
                  return that.wallet.getAddressBookEntries();

                case 2:
                  entries = _context77.sent;
                  numEntriesStart = entries.length;
                  _iterator100 = _createForOfIteratorHelper(entries);
                  _context77.prev = 5;

                  _iterator100.s();

                case 7:
                  if ((_step100 = _iterator100.n()).done) {
                    _context77.next = 13;
                    break;
                  }

                  _entry2 = _step100.value;
                  _context77.next = 11;
                  return testAddressBookEntry(_entry2);

                case 11:
                  _context77.next = 7;
                  break;

                case 13:
                  _context77.next = 18;
                  break;

                case 15:
                  _context77.prev = 15;
                  _context77.t0 = _context77["catch"](5);

                  _iterator100.e(_context77.t0);

                case 18:
                  _context77.prev = 18;

                  _iterator100.f();

                  return _context77.finish(18);

                case 21:
                  // test adding standard addresses
                  NUM_ENTRIES = 5;
                  _context77.next = 24;
                  return that.wallet.getSubaddress(0, 0);

                case 24:
                  address = _context77.sent.getAddress();
                  indices = [];
                  i = 0;

                case 27:
                  if (!(i < NUM_ENTRIES)) {
                    _context77.next = 36;
                    break;
                  }

                  _context77.t1 = indices;
                  _context77.next = 31;
                  return that.wallet.addAddressBookEntry(address, "hi there!");

                case 31:
                  _context77.t2 = _context77.sent;

                  _context77.t1.push.call(_context77.t1, _context77.t2);

                case 33:
                  i++;
                  _context77.next = 27;
                  break;

                case 36:
                  _context77.next = 38;
                  return that.wallet.getAddressBookEntries();

                case 38:
                  entries = _context77.sent;

                  _assert["default"].equal(entries.length, numEntriesStart + NUM_ENTRIES);

                  _i7 = 0, _indices = indices;

                case 41:
                  if (!(_i7 < _indices.length)) {
                    _context77.next = 70;
                    break;
                  }

                  idx = _indices[_i7];
                  found = false;
                  _iterator101 = _createForOfIteratorHelper(entries);
                  _context77.prev = 45;

                  _iterator101.s();

                case 47:
                  if ((_step101 = _iterator101.n()).done) {
                    _context77.next = 58;
                    break;
                  }

                  entry = _step101.value;

                  if (!(idx === entry.getIndex())) {
                    _context77.next = 56;
                    break;
                  }

                  _context77.next = 52;
                  return testAddressBookEntry(entry);

                case 52:
                  _assert["default"].equal(entry.getAddress(), address);

                  _assert["default"].equal(entry.getDescription(), "hi there!");

                  found = true;
                  return _context77.abrupt("break", 58);

                case 56:
                  _context77.next = 47;
                  break;

                case 58:
                  _context77.next = 63;
                  break;

                case 60:
                  _context77.prev = 60;
                  _context77.t3 = _context77["catch"](45);

                  _iterator101.e(_context77.t3);

                case 63:
                  _context77.prev = 63;

                  _iterator101.f();

                  return _context77.finish(63);

                case 66:
                  (0, _assert["default"])(found, "Index " + idx + " not found in address book indices");

                case 67:
                  _i7++;
                  _context77.next = 41;
                  break;

                case 70:
                  _i8 = 0, _indices2 = indices;

                case 71:
                  if (!(_i8 < _indices2.length)) {
                    _context77.next = 78;
                    break;
                  }

                  _idx = _indices2[_i8];
                  _context77.next = 75;
                  return that.wallet.editAddressBookEntry(_idx, false, undefined, true, "hello there!!");

                case 75:
                  _i8++;
                  _context77.next = 71;
                  break;

                case 78:
                  _context77.next = 80;
                  return that.wallet.getAddressBookEntries(indices);

                case 80:
                  entries = _context77.sent;
                  _iterator102 = _createForOfIteratorHelper(entries);

                  try {
                    for (_iterator102.s(); !(_step102 = _iterator102.n()).done;) {
                      _entry3 = _step102.value;

                      _assert["default"].equal(_entry3.getDescription(), "hello there!!");
                    } // delete entries at starting index

                  } catch (err) {
                    _iterator102.e(err);
                  } finally {
                    _iterator102.f();
                  }

                  deleteIdx = indices[0];
                  _i9 = 0;

                case 85:
                  if (!(_i9 < indices.length)) {
                    _context77.next = 91;
                    break;
                  }

                  _context77.next = 88;
                  return that.wallet.deleteAddressBookEntry(deleteIdx);

                case 88:
                  _i9++;
                  _context77.next = 85;
                  break;

                case 91:
                  _context77.next = 93;
                  return that.wallet.getAddressBookEntries();

                case 93:
                  entries = _context77.sent;

                  _assert["default"].equal(entries.length, numEntriesStart); // test adding integrated addresses


                  indices = [];
                  paymentId = "03284e41c342f03"; // payment id less one character

                  integratedAddresses = {};
                  integratedDescriptions = {};
                  _i10 = 0;

                case 100:
                  if (!(_i10 < NUM_ENTRIES)) {
                    _context77.next = 114;
                    break;
                  }

                  _context77.next = 103;
                  return that.wallet.getIntegratedAddress(undefined, paymentId + _i10);

                case 103:
                  integratedAddress = _context77.sent;
                  // create unique integrated address
                  uuid = _index.GenUtils.getUUID();
                  _context77.next = 107;
                  return that.wallet.addAddressBookEntry(integratedAddress.toString(), uuid);

                case 107:
                  _idx2 = _context77.sent;
                  indices.push(_idx2);
                  integratedAddresses[_idx2] = integratedAddress;
                  integratedDescriptions[_idx2] = uuid;

                case 111:
                  _i10++;
                  _context77.next = 100;
                  break;

                case 114:
                  _context77.next = 116;
                  return that.wallet.getAddressBookEntries();

                case 116:
                  entries = _context77.sent;

                  _assert["default"].equal(entries.length, numEntriesStart + NUM_ENTRIES);

                  _i11 = 0, _indices3 = indices;

                case 119:
                  if (!(_i11 < _indices3.length)) {
                    _context77.next = 149;
                    break;
                  }

                  _idx3 = _indices3[_i11];
                  _found3 = false;
                  _iterator103 = _createForOfIteratorHelper(entries);
                  _context77.prev = 123;

                  _iterator103.s();

                case 125:
                  if ((_step103 = _iterator103.n()).done) {
                    _context77.next = 137;
                    break;
                  }

                  _entry = _step103.value;

                  if (!(_idx3 === _entry.getIndex())) {
                    _context77.next = 135;
                    break;
                  }

                  _context77.next = 130;
                  return testAddressBookEntry(_entry);

                case 130:
                  _assert["default"].equal(_entry.getDescription(), integratedDescriptions[_idx3]);

                  _assert["default"].equal(_entry.getAddress(), integratedAddresses[_idx3].toString());

                  _assert["default"].equal(_entry.getPaymentId(), undefined);

                  _found3 = true;
                  return _context77.abrupt("break", 137);

                case 135:
                  _context77.next = 125;
                  break;

                case 137:
                  _context77.next = 142;
                  break;

                case 139:
                  _context77.prev = 139;
                  _context77.t4 = _context77["catch"](123);

                  _iterator103.e(_context77.t4);

                case 142:
                  _context77.prev = 142;

                  _iterator103.f();

                  return _context77.finish(142);

                case 145:
                  (0, _assert["default"])(_found3, "Index " + _idx3 + " not found in address book indices");

                case 146:
                  _i11++;
                  _context77.next = 119;
                  break;

                case 149:
                  // delete entries at starting index
                  deleteIdx = indices[0];
                  _i12 = 0;

                case 151:
                  if (!(_i12 < indices.length)) {
                    _context77.next = 157;
                    break;
                  }

                  _context77.next = 154;
                  return that.wallet.deleteAddressBookEntry(deleteIdx);

                case 154:
                  _i12++;
                  _context77.next = 151;
                  break;

                case 157:
                  _context77.next = 159;
                  return that.wallet.getAddressBookEntries();

                case 159:
                  entries = _context77.sent;

                  _assert["default"].equal(entries.length, numEntriesStart);

                case 161:
                case "end":
                  return _context77.stop();
              }
            }
          }, _callee76, null, [[5, 15, 18, 21], [45, 60, 63, 66], [123, 139, 142, 145]]);
        })));
        if (testConfig.testNonRelays) it("Can get and set arbitrary key/value attributes", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee77() {
          var attrs, i, key, val, _i13, _Object$keys, _key2;

          return _regenerator["default"].wrap(function _callee77$(_context78) {
            while (1) {
              switch (_context78.prev = _context78.next) {
                case 0:
                  // set attributes
                  attrs = {};
                  i = 0;

                case 2:
                  if (!(i < 5)) {
                    _context78.next = 11;
                    break;
                  }

                  key = "attr" + i;
                  val = _index.GenUtils.getUUID();
                  attrs[key] = val;
                  _context78.next = 8;
                  return that.wallet.setAttribute(key, val);

                case 8:
                  i++;
                  _context78.next = 2;
                  break;

                case 11:
                  _i13 = 0, _Object$keys = Object.keys(attrs);

                case 12:
                  if (!(_i13 < _Object$keys.length)) {
                    _context78.next = 23;
                    break;
                  }

                  _key2 = _Object$keys[_i13];
                  _context78.t0 = _assert["default"];
                  _context78.t1 = attrs[_key2];
                  _context78.next = 18;
                  return that.wallet.getAttribute(_key2);

                case 18:
                  _context78.t2 = _context78.sent;

                  _context78.t0.equal.call(_context78.t0, _context78.t1, _context78.t2);

                case 20:
                  _i13++;
                  _context78.next = 12;
                  break;

                case 23:
                  _context78.t3 = _assert["default"];
                  _context78.next = 26;
                  return that.wallet.getAttribute("unset_key");

                case 26:
                  _context78.t4 = _context78.sent;
                  _context78.t5 = undefined;

                  _context78.t3.equal.call(_context78.t3, _context78.t4, _context78.t5);

                case 29:
                case "end":
                  return _context78.stop();
              }
            }
          }, _callee77);
        })));
        if (testConfig.testNonRelays) it("Can convert between a tx config and payment URI", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee78() {
          var config1, uri, config2, address;
          return _regenerator["default"].wrap(function _callee78$(_context79) {
            while (1) {
              switch (_context79.prev = _context79.next) {
                case 0:
                  _context79.t0 = _index.MoneroTxConfig;
                  _context79.next = 3;
                  return that.wallet.getAddress(0, 0);

                case 3:
                  _context79.t1 = _context79.sent;
                  _context79.t2 = BigInt(0);
                  _context79.t3 = {
                    address: _context79.t1,
                    amount: _context79.t2
                  };
                  config1 = new _context79.t0(_context79.t3);
                  _context79.next = 9;
                  return that.wallet.getPaymentUri(config1);

                case 9:
                  uri = _context79.sent;
                  _context79.next = 12;
                  return that.wallet.parsePaymentUri(uri);

                case 12:
                  config2 = _context79.sent;

                  _index.GenUtils.deleteUndefinedKeys(config1);

                  _index.GenUtils.deleteUndefinedKeys(config2);

                  _assert["default"].deepEqual(JSON.parse(JSON.stringify(config2)), JSON.parse(JSON.stringify(config1))); // test with subaddress and all fields


                  _context79.t4 = config1.getDestinations()[0];
                  _context79.next = 19;
                  return that.wallet.getSubaddress(0, 1);

                case 19:
                  _context79.t5 = _context79.sent.getAddress();

                  _context79.t4.setAddress.call(_context79.t4, _context79.t5);

                  config1.getDestinations()[0].setAmount(BigInt("425000000000"));
                  config1.setRecipientName("John Doe");
                  config1.setNote("OMZG XMR FTW");
                  _context79.next = 26;
                  return that.wallet.getPaymentUri(config1.toJson());

                case 26:
                  uri = _context79.sent;
                  _context79.next = 29;
                  return that.wallet.parsePaymentUri(uri);

                case 29:
                  config2 = _context79.sent;

                  _index.GenUtils.deleteUndefinedKeys(config1);

                  _index.GenUtils.deleteUndefinedKeys(config2);

                  _assert["default"].deepEqual(JSON.parse(JSON.stringify(config2)), JSON.parse(JSON.stringify(config1))); // test with undefined address


                  address = config1.getDestinations()[0].getAddress();
                  config1.getDestinations()[0].setAddress(undefined);
                  _context79.prev = 35;
                  _context79.next = 38;
                  return that.wallet.getPaymentUri(config1);

                case 38:
                  fail("Should have thrown exception with invalid parameters");
                  _context79.next = 44;
                  break;

                case 41:
                  _context79.prev = 41;
                  _context79.t6 = _context79["catch"](35);
                  (0, _assert["default"])(_context79.t6.message.indexOf("Cannot make URI from supplied parameters") >= 0);

                case 44:
                  config1.getDestinations()[0].setAddress(address); // test with standalone payment id

                  config1.setPaymentId("03284e41c342f03603284e41c342f03603284e41c342f03603284e41c342f036");
                  _context79.prev = 46;
                  _context79.next = 49;
                  return that.wallet.getPaymentUri(config1);

                case 49:
                  fail("Should have thrown exception with invalid parameters");
                  _context79.next = 55;
                  break;

                case 52:
                  _context79.prev = 52;
                  _context79.t7 = _context79["catch"](46);
                  (0, _assert["default"])(_context79.t7.message.indexOf("Cannot make URI from supplied parameters") >= 0);

                case 55:
                case "end":
                  return _context79.stop();
              }
            }
          }, _callee78, null, [[35, 41], [46, 52]]);
        })));
        if (testConfig.testNonRelays) it("Can start and stop mining", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee79() {
          var status;
          return _regenerator["default"].wrap(function _callee79$(_context80) {
            while (1) {
              switch (_context80.prev = _context80.next) {
                case 0:
                  _context80.next = 2;
                  return that.daemon.getMiningStatus();

                case 2:
                  status = _context80.sent;

                  if (!status.isActive()) {
                    _context80.next = 6;
                    break;
                  }

                  _context80.next = 6;
                  return that.wallet.stopMining();

                case 6:
                  _context80.next = 8;
                  return that.wallet.startMining(2, false, true);

                case 8:
                  _context80.next = 10;
                  return that.wallet.stopMining();

                case 10:
                case "end":
                  return _context80.stop();
              }
            }
          }, _callee79);
        })));
        if (testConfig.testNonRelays) it("Can change the wallet password", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee80() {
          var wallet, path, newPassword;
          return _regenerator["default"].wrap(function _callee80$(_context81) {
            while (1) {
              switch (_context81.prev = _context81.next) {
                case 0:
                  _context81.next = 2;
                  return that.createWallet(new _index.MoneroWalletConfig().setPassword(_TestUtils["default"].WALLET_PASSWORD));

                case 2:
                  wallet = _context81.sent;
                  _context81.next = 5;
                  return wallet.getPath();

                case 5:
                  path = _context81.sent;
                  // change password
                  newPassword = _index.GenUtils.getUUID();
                  _context81.next = 9;
                  return wallet.changePassword(_TestUtils["default"].WALLET_PASSWORD, newPassword);

                case 9:
                  _context81.next = 11;
                  return that.closeWallet(wallet, true);

                case 11:
                  _context81.prev = 11;
                  _context81.next = 14;
                  return that.openWallet(new _index.MoneroWalletConfig().setPath(path).setPassword(_TestUtils["default"].WALLET_PASSWORD));

                case 14:
                  throw new Error("Should have thrown");

                case 17:
                  _context81.prev = 17;
                  _context81.t0 = _context81["catch"](11);
                  (0, _assert["default"])(_context81.t0.message === "Failed to open wallet" || _context81.t0.message === "invalid password"); // TODO: different errors from rpc and wallet2

                case 20:
                  _context81.next = 22;
                  return that.openWallet(new _index.MoneroWalletConfig().setPath(path).setPassword(newPassword));

                case 22:
                  wallet = _context81.sent;
                  _context81.prev = 23;
                  _context81.next = 26;
                  return wallet.changePassword("badpassword", newPassword);

                case 26:
                  throw new Error("Should have thrown");

                case 29:
                  _context81.prev = 29;
                  _context81.t1 = _context81["catch"](23);

                  _assert["default"].equal(_context81.t1.message, "Invalid original password.");

                case 32:
                  _context81.next = 34;
                  return that.closeWallet(wallet, true);

                case 34:
                  _context81.next = 36;
                  return that.openWallet(new _index.MoneroWalletConfig().setPath(path).setPassword(newPassword));

                case 36:
                  wallet = _context81.sent;
                  _context81.next = 39;
                  return that.closeWallet(wallet);

                case 39:
                case "end":
                  return _context81.stop();
              }
            }
          }, _callee80, null, [[11, 17], [23, 29]]);
        })));
        if (testConfig.testNonRelays) it("Can save and close the wallet in a single call", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee81() {
          var wallet, path, uuid;
          return _regenerator["default"].wrap(function _callee81$(_context82) {
            while (1) {
              switch (_context82.prev = _context82.next) {
                case 0:
                  _context82.next = 2;
                  return that.createWallet();

                case 2:
                  wallet = _context82.sent;
                  _context82.next = 5;
                  return wallet.getPath();

                case 5:
                  path = _context82.sent;
                  // set an attribute
                  uuid = _index.GenUtils.getUUID();
                  _context82.next = 9;
                  return wallet.setAttribute("id", uuid);

                case 9:
                  _context82.next = 11;
                  return that.closeWallet(wallet);

                case 11:
                  _context82.next = 13;
                  return that.openWallet({
                    path: path
                  });

                case 13:
                  wallet = _context82.sent;
                  _context82.t0 = _assert["default"];
                  _context82.next = 17;
                  return wallet.getAttribute("id");

                case 17:
                  _context82.t1 = _context82.sent;
                  _context82.t2 = undefined;

                  _context82.t0.equal.call(_context82.t0, _context82.t1, _context82.t2);

                  _context82.next = 22;
                  return wallet.setAttribute("id", uuid);

                case 22:
                  _context82.next = 24;
                  return that.closeWallet(wallet, true);

                case 24:
                  _context82.next = 26;
                  return that.openWallet({
                    path: path
                  });

                case 26:
                  wallet = _context82.sent;
                  _context82.t3 = _assert["default"];
                  _context82.next = 30;
                  return wallet.getAttribute("id");

                case 30:
                  _context82.t4 = _context82.sent;
                  _context82.t5 = uuid;

                  _context82.t3.equal.call(_context82.t3, _context82.t4, _context82.t5);

                  _context82.next = 35;
                  return that.closeWallet(wallet);

                case 35:
                case "end":
                  return _context82.stop();
              }
            }
          }, _callee81);
        }))); // ----------------------------- NOTIFICATION TESTS -------------------------

        if (testConfig.testNotifications) it("Can generate notifications sending to different wallet.", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee82() {
          return _regenerator["default"].wrap(function _callee82$(_context83) {
            while (1) {
              switch (_context83.prev = _context83.next) {
                case 0:
                  _context83.next = 2;
                  return testWalletNotifications("testNotificationsDifferentWallet", false, false, false, false, 0);

                case 2:
                case "end":
                  return _context83.stop();
              }
            }
          }, _callee82);
        })));
        if (testConfig.testNotifications) it("Can generate notifications sending to different wallet when relayed", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee83() {
          return _regenerator["default"].wrap(function _callee83$(_context84) {
            while (1) {
              switch (_context84.prev = _context84.next) {
                case 0:
                  _context84.next = 2;
                  return testWalletNotifications("testNotificationsDifferentWalletWhenRelayed", false, false, false, true, 3);

                case 2:
                case "end":
                  return _context84.stop();
              }
            }
          }, _callee83);
        })));
        if (testConfig.testNotifications) it("Can generate notifications sending to different account.", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee84() {
          return _regenerator["default"].wrap(function _callee84$(_context85) {
            while (1) {
              switch (_context85.prev = _context85.next) {
                case 0:
                  _context85.next = 2;
                  return testWalletNotifications("testNotificationsDifferentAccounts", true, false, false, false, 0);

                case 2:
                case "end":
                  return _context85.stop();
              }
            }
          }, _callee84);
        })));
        if (testConfig.testNotifications) it("Can generate notifications sending to same account", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee85() {
          return _regenerator["default"].wrap(function _callee85$(_context86) {
            while (1) {
              switch (_context86.prev = _context86.next) {
                case 0:
                  _context86.next = 2;
                  return testWalletNotifications("testNotificationsSameAccount", true, true, false, false, 0);

                case 2:
                case "end":
                  return _context86.stop();
              }
            }
          }, _callee85);
        })));
        if (testConfig.testNotifications) it("Can generate notifications sweeping output to different account", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee86() {
          return _regenerator["default"].wrap(function _callee86$(_context87) {
            while (1) {
              switch (_context87.prev = _context87.next) {
                case 0:
                  _context87.next = 2;
                  return testWalletNotifications("testNotificationsDifferentAccountSweepOutput", true, false, true, false, 0);

                case 2:
                case "end":
                  return _context87.stop();
              }
            }
          }, _callee86);
        })));
        if (testConfig.testNotifications) it("Can generate notifications sweeping output to same account when relayed", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee87() {
          return _regenerator["default"].wrap(function _callee87$(_context88) {
            while (1) {
              switch (_context88.prev = _context88.next) {
                case 0:
                  _context88.next = 2;
                  return testWalletNotifications("testNotificationsSameAccountSweepOutputWhenRelayed", true, true, true, true, 0);

                case 2:
                case "end":
                  return _context88.stop();
              }
            }
          }, _callee87);
        })));

        function testWalletNotifications(_x9, _x10, _x11, _x12, _x13, _x14) {
          return _testWalletNotifications.apply(this, arguments);
        } // TODO: test sweepUnlocked()


        function _testWalletNotifications() {
          _testWalletNotifications = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee121(testName, sameWallet, sameAccount, sweepOutput, createThenRelay, unlockDelay) {
            var issues, msg;
            return _regenerator["default"].wrap(function _callee121$(_context122) {
              while (1) {
                switch (_context122.prev = _context122.next) {
                  case 0:
                    _context122.next = 2;
                    return testWalletNotificationsAux(sameWallet, sameAccount, sweepOutput, createThenRelay, unlockDelay);

                  case 2:
                    issues = _context122.sent;

                    if (!(issues.length === 0)) {
                      _context122.next = 5;
                      break;
                    }

                    return _context122.abrupt("return");

                  case 5:
                    msg = testName + "(" + sameWallet + ", " + sameAccount + ", " + sweepOutput + ", " + createThenRelay + ") generated " + issues.length + " issues:\n" + issuesToStr(issues);
                    console.log(msg);

                    if (!msg.includes("ERROR:")) {
                      _context122.next = 9;
                      break;
                    }

                    throw new Error(msg);

                  case 9:
                  case "end":
                    return _context122.stop();
                }
              }
            }, _callee121);
          }));
          return _testWalletNotifications.apply(this, arguments);
        }

        function testWalletNotificationsAux(_x15, _x16, _x17, _x18, _x19) {
          return _testWalletNotificationsAux.apply(this, arguments);
        }

        function _testWalletNotificationsAux() {
          _testWalletNotificationsAux = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee125(sameWallet, sameAccount, sweepOutput, createThenRelay, unlockDelay) {
            var MAX_POLL_TIME, issues, sender, receiver, numAccounts, i, senderBalanceBefore, senderUnlockedBalanceBefore, receiverBalanceBefore, receiverUnlockedBalanceBefore, lastHeight, senderNotificationCollector, receiverNotificationCollector, ctx, senderTx, destinationAccounts, expectedOutputs, outputs, config, _config, _iterator131, _step131, destinationAccount, startTime, outputQuery, receiverTx, _iterator132, _step132, _output22, threads, expectedUnlockHeight, confirmHeight, _loop2, _ret, _iterator133, _step133, _output25, _iterator134, _step134, _output26, _iterator135, _step135, _output27, _iterator136, _step136, _output28;

            return _regenerator["default"].wrap(function _callee125$(_context127) {
              while (1) {
                switch (_context127.prev = _context127.next) {
                  case 0:
                    MAX_POLL_TIME = 5000; // maximum time granted for wallet to poll
                    // collect issues as test runs

                    issues = []; // set sender and receiver

                    sender = that.wallet;

                    if (!sameWallet) {
                      _context127.next = 7;
                      break;
                    }

                    _context127.t0 = sender;
                    _context127.next = 10;
                    break;

                  case 7:
                    _context127.next = 9;
                    return that.createWallet(new _index.MoneroWalletConfig());

                  case 9:
                    _context127.t0 = _context127.sent;

                  case 10:
                    receiver = _context127.t0;
                    _context127.next = 13;
                    return receiver.getAccounts();

                  case 13:
                    numAccounts = _context127.sent.length;
                    i = 0;

                  case 15:
                    if (!(i < 4 - numAccounts)) {
                      _context127.next = 21;
                      break;
                    }

                    _context127.next = 18;
                    return receiver.createAccount();

                  case 18:
                    i++;
                    _context127.next = 15;
                    break;

                  case 21:
                    _context127.next = 23;
                    return _TestUtils["default"].WALLET_TX_TRACKER.waitForWalletTxsToClearPool(sender);

                  case 23:
                    _context127.next = 25;
                    return _TestUtils["default"].WALLET_TX_TRACKER.waitForUnlockedBalance(sender, 0, undefined, _TestUtils["default"].MAX_FEE * BigInt("10"));

                  case 25:
                    _context127.next = 27;
                    return sender.getBalance();

                  case 27:
                    senderBalanceBefore = _context127.sent;
                    _context127.next = 30;
                    return sender.getUnlockedBalance();

                  case 30:
                    senderUnlockedBalanceBefore = _context127.sent;
                    _context127.next = 33;
                    return receiver.getBalance();

                  case 33:
                    receiverBalanceBefore = _context127.sent;
                    _context127.next = 36;
                    return receiver.getUnlockedBalance();

                  case 36:
                    receiverUnlockedBalanceBefore = _context127.sent;
                    _context127.next = 39;
                    return that.daemon.getHeight();

                  case 39:
                    lastHeight = _context127.sent;
                    // start collecting notifications from sender and receiver
                    senderNotificationCollector = new WalletNotificationCollector();
                    receiverNotificationCollector = new WalletNotificationCollector();
                    _context127.next = 44;
                    return sender.addListener(senderNotificationCollector);

                  case 44:
                    _context127.next = 46;
                    return _index.GenUtils.waitFor(_TestUtils["default"].SYNC_PERIOD_IN_MS / 2);

                  case 46:
                    _context127.next = 48;
                    return receiver.addListener(receiverNotificationCollector);

                  case 48:
                    // send funds
                    ctx = {
                      wallet: sender,
                      isSendResponse: true
                    };
                    destinationAccounts = sameAccount ? sweepOutput ? [0] : [0, 1, 2] : sweepOutput ? [1] : [1, 2, 3];
                    expectedOutputs = [];

                    if (!sweepOutput) {
                      _context127.next = 73;
                      break;
                    }

                    ctx.isSweepResponse = true;
                    ctx.isSweepOutputResponse = true;
                    _context127.next = 56;
                    return sender.getOutputs({
                      isSpent: false,
                      accountIndex: 0,
                      minAmount: _TestUtils["default"].MAX_FEE * BigInt("5"),
                      txQuery: {
                        isLocked: false
                      }
                    });

                  case 56:
                    outputs = _context127.sent;

                    if (!(outputs.length === 0)) {
                      _context127.next = 60;
                      break;
                    }

                    issues.push("ERROR: No outputs available to sweep from account 0");
                    return _context127.abrupt("return", issues);

                  case 60:
                    _context127.next = 62;
                    return receiver.getAddress(destinationAccounts[0], 0);

                  case 62:
                    _context127.t1 = _context127.sent;
                    _context127.t2 = outputs[0].getKeyImage().getHex();
                    _context127.t3 = !createThenRelay;
                    config = {
                      address: _context127.t1,
                      keyImage: _context127.t2,
                      relay: _context127.t3
                    };
                    _context127.next = 68;
                    return sender.sweepOutput(config);

                  case 68:
                    senderTx = _context127.sent;
                    expectedOutputs.push(new _index.MoneroOutputWallet().setAmount(senderTx.getOutgoingTransfer().getDestinations()[0].getAmount()).setAccountIndex(destinationAccounts[0]).setSubaddressIndex(0));
                    ctx.config = new _index.MoneroTxConfig(config);
                    _context127.next = 100;
                    break;

                  case 73:
                    _config = new _index.MoneroTxConfig().setAccountIndex(0).setRelay(!createThenRelay);
                    _iterator131 = _createForOfIteratorHelper(destinationAccounts);
                    _context127.prev = 75;

                    _iterator131.s();

                  case 77:
                    if ((_step131 = _iterator131.n()).done) {
                      _context127.next = 88;
                      break;
                    }

                    destinationAccount = _step131.value;
                    _context127.t4 = _config;
                    _context127.next = 82;
                    return receiver.getAddress(destinationAccount, 0);

                  case 82:
                    _context127.t5 = _context127.sent;
                    _context127.t6 = _TestUtils["default"].MAX_FEE;

                    _context127.t4.addDestination.call(_context127.t4, _context127.t5, _context127.t6);

                    // TODO: send and check random amounts?
                    expectedOutputs.push(new _index.MoneroOutputWallet().setAmount(_TestUtils["default"].MAX_FEE).setAccountIndex(destinationAccount).setSubaddressIndex(0));

                  case 86:
                    _context127.next = 77;
                    break;

                  case 88:
                    _context127.next = 93;
                    break;

                  case 90:
                    _context127.prev = 90;
                    _context127.t7 = _context127["catch"](75);

                    _iterator131.e(_context127.t7);

                  case 93:
                    _context127.prev = 93;

                    _iterator131.f();

                    return _context127.finish(93);

                  case 96:
                    _context127.next = 98;
                    return sender.createTx(_config);

                  case 98:
                    senderTx = _context127.sent;
                    ctx.config = _config;

                  case 100:
                    if (!createThenRelay) {
                      _context127.next = 103;
                      break;
                    }

                    _context127.next = 103;
                    return sender.relayTx(senderTx);

                  case 103:
                    // start timer to measure end of sync period
                    startTime = Date.now(); // timestamp in ms
                    // test send tx

                    _context127.next = 106;
                    return that._testTxWallet(senderTx, ctx);

                  case 106:
                    // test sender after sending
                    outputQuery = new _index.MoneroOutputQuery().setTxQuery(new _index.MoneroTxQuery().setHash(senderTx.getHash())); // query for outputs from sender tx

                    if (sameWallet) {
                      if (senderTx.getIncomingAmount() === undefined) issues.push("WARNING: sender tx incoming amount is null when sent to same wallet");else if (_index.GenUtils.compareBigInt(senderTx.getIncomingAmount(), BigInt("0")) === 0) issues.push("WARNING: sender tx incoming amount is 0 when sent to same wallet");else if (_index.GenUtils.compareBigInt(senderTx.getIncomingAmount(), senderTx.getOutgoingAmount() - senderTx.getFee()) !== 0) issues.push("WARNING: sender tx incoming amount != outgoing amount - fee when sent to same wallet");
                    } else {
                      if (senderTx.getIncomingAmount() !== undefined) issues.push("ERROR: tx incoming amount should be undefined"); // TODO: should be 0? then can remove undefined checks in this method
                    }

                    _context127.next = 110;
                    return sender.getTxs(new _index.MoneroTxQuery().setHash(senderTx.getHash()).setIncludeOutputs(true));

                  case 110:
                    senderTx = _context127.sent[0];
                    _context127.next = 113;
                    return _index.GenUtils.compareBigInt(sender.getBalance());

                  case 113:
                    _context127.t8 = senderBalanceBefore - senderTx.getFee() - senderTx.getOutgoingAmount() + (senderTx.getIncomingAmount() === undefined ? BigInt("0") : senderTx.getIncomingAmount());

                    if (!(_context127.t8 !== 0)) {
                      _context127.next = 136;
                      break;
                    }

                    _context127.t9 = issues;
                    _context127.t10 = toStringBI;
                    _context127.next = 119;
                    return sender.getBalance();

                  case 119:
                    _context127.t11 = _context127.sent;
                    _context127.t12 = (0, _context127.t10)(_context127.t11);
                    _context127.t13 = "ERROR: sender balance after send != balance before - tx fee - outgoing amount + incoming amount (" + _context127.t12;
                    _context127.t14 = _context127.t13 + " != ";
                    _context127.t15 = toStringBI(senderBalanceBefore);
                    _context127.t16 = _context127.t14 + _context127.t15;
                    _context127.t17 = _context127.t16 + " - ";
                    _context127.t18 = toStringBI(senderTx.getFee());
                    _context127.t19 = _context127.t17 + _context127.t18;
                    _context127.t20 = _context127.t19 + " - ";
                    _context127.t21 = toStringBI(senderTx.getOutgoingAmount());
                    _context127.t22 = _context127.t20 + _context127.t21;
                    _context127.t23 = _context127.t22 + " + ";
                    _context127.t24 = toStringBI(senderTx.getIncomingAmount());
                    _context127.t25 = _context127.t23 + _context127.t24;
                    _context127.t26 = _context127.t25 + ")";

                    _context127.t9.push.call(_context127.t9, _context127.t26);

                  case 136:
                    _context127.next = 138;
                    return _index.GenUtils.compareBigInt(sender.getUnlockedBalance());

                  case 138:
                    _context127.t27 = senderUnlockedBalanceBefore;

                    if (!(_context127.t27 >= 0)) {
                      _context127.next = 141;
                      break;
                    }

                    issues.push("ERROR: sender unlocked balance should have decreased after sending");

                  case 141:
                    if (!(senderNotificationCollector.getBalanceNotifications().length === 0)) {
                      _context127.next = 145;
                      break;
                    }

                    issues.push("ERROR: sender did not notify balance change after sending");
                    _context127.next = 177;
                    break;

                  case 145:
                    _context127.next = 147;
                    return _index.GenUtils.compareBigInt(sender.getBalance());

                  case 147:
                    _context127.t28 = senderNotificationCollector.getBalanceNotifications()[senderNotificationCollector.getBalanceNotifications().length - 1].balance;

                    if (!(_context127.t28 !== 0)) {
                      _context127.next = 161;
                      break;
                    }

                    _context127.t29 = issues;
                    _context127.t30 = toStringBI;
                    _context127.next = 153;
                    return sender.getBalance();

                  case 153:
                    _context127.t31 = _context127.sent;
                    _context127.t32 = (0, _context127.t30)(_context127.t31);
                    _context127.t33 = "ERROR: sender balance != last notified balance after sending (" + _context127.t32;
                    _context127.t34 = _context127.t33 + " != ";
                    _context127.t35 = toStringBI(senderNotificationCollector.getBalanceNotifications()[senderNotificationCollector.getBalanceNotifications().length - 1][0]);
                    _context127.t36 = _context127.t34 + _context127.t35;
                    _context127.t37 = _context127.t36 + ")";

                    _context127.t29.push.call(_context127.t29, _context127.t37);

                  case 161:
                    _context127.next = 163;
                    return _index.GenUtils.compareBigInt(sender.getUnlockedBalance());

                  case 163:
                    _context127.t38 = senderNotificationCollector.getBalanceNotifications()[senderNotificationCollector.getBalanceNotifications().length - 1].unlockedBalance;

                    if (!(_context127.t38 !== 0)) {
                      _context127.next = 177;
                      break;
                    }

                    _context127.t39 = issues;
                    _context127.t40 = toStringBI;
                    _context127.next = 169;
                    return sender.getUnlockedBalance();

                  case 169:
                    _context127.t41 = _context127.sent;
                    _context127.t42 = (0, _context127.t40)(_context127.t41);
                    _context127.t43 = "ERROR: sender unlocked balance != last notified unlocked balance after sending (" + _context127.t42;
                    _context127.t44 = _context127.t43 + " != ";
                    _context127.t45 = toStringBI(senderNotificationCollector.getBalanceNotifications()[senderNotificationCollector.getBalanceNotifications().length - 1][1]);
                    _context127.t46 = _context127.t44 + _context127.t45;
                    _context127.t47 = _context127.t46 + ")";

                    _context127.t39.push.call(_context127.t39, _context127.t47);

                  case 177:
                    if (senderNotificationCollector.getOutputsSpent(outputQuery).length === 0) issues.push("ERROR: sender did not announce unconfirmed spent output"); // test receiver after 2 sync periods

                    _context127.next = 180;
                    return _index.GenUtils.waitFor(_TestUtils["default"].SYNC_PERIOD_IN_MS * 2 - (Date.now() - startTime));

                  case 180:
                    startTime = Date.now(); // reset timer

                    _context127.next = 183;
                    return receiver.getTx(senderTx.getHash());

                  case 183:
                    receiverTx = _context127.sent;

                    if (_index.GenUtils.compareBigInt(senderTx.getOutgoingAmount(), receiverTx.getIncomingAmount()) !== 0) {
                      if (sameAccount) issues.push("WARNING: sender tx outgoing amount != receiver tx incoming amount when sent to same account (" + toStringBI(senderTx.getOutgoingAmount()) + " != " + toStringBI(receiverTx.getIncomingAmount()) + ")");else issues.push("ERROR: sender tx outgoing amount != receiver tx incoming amount (" + toStringBI(senderTx.getOutgoingAmount()) + " != " + toStringBI(receiverTx.getIncomingAmount()) + ")");
                    }

                    _context127.next = 187;
                    return _index.GenUtils.compareBigInt(receiver.getBalance());

                  case 187:
                    _context127.t48 = receiverBalanceBefore + (receiverTx.getIncomingAmount() === undefined ? BigInt("0") : receiverTx.getIncomingAmount()) - (receiverTx.getOutgoingAmount() === undefined ? BigInt("0") : receiverTx.getOutgoingAmount()) - (sameWallet ? receiverTx.getFee() : BigInt("0"));

                    if (!(_context127.t48 !== 0)) {
                      _context127.next = 234;
                      break;
                    }

                    if (!sameAccount) {
                      _context127.next = 213;
                      break;
                    }

                    _context127.t49 = issues;
                    _context127.t50 = toStringBI;
                    _context127.next = 194;
                    return receiver.getBalance();

                  case 194:
                    _context127.t51 = _context127.sent;
                    _context127.t52 = (0, _context127.t50)(_context127.t51);
                    _context127.t53 = "WARNING: after sending, receiver balance != balance before + incoming amount - outgoing amount - tx fee when sent to same account (" + _context127.t52;
                    _context127.t54 = _context127.t53 + " != ";
                    _context127.t55 = toStringBI(receiverBalanceBefore);
                    _context127.t56 = _context127.t54 + _context127.t55;
                    _context127.t57 = _context127.t56 + " + ";
                    _context127.t58 = toStringBI(receiverTx.getIncomingAmount());
                    _context127.t59 = _context127.t57 + _context127.t58;
                    _context127.t60 = _context127.t59 + " - ";
                    _context127.t61 = toStringBI(receiverTx.getOutgoingAmount());
                    _context127.t62 = _context127.t60 + _context127.t61;
                    _context127.t63 = _context127.t62 + " - ";
                    _context127.t64 = (sameWallet ? receiverTx.getFee() : BigInt("0")).toString();
                    _context127.t65 = _context127.t63 + _context127.t64;
                    _context127.t66 = _context127.t65 + ")";

                    _context127.t49.push.call(_context127.t49, _context127.t66);

                    _context127.next = 234;
                    break;

                  case 213:
                    _context127.t67 = issues;
                    _context127.t68 = toStringBI;
                    _context127.next = 217;
                    return receiver.getBalance();

                  case 217:
                    _context127.t69 = _context127.sent;
                    _context127.t70 = (0, _context127.t68)(_context127.t69);
                    _context127.t71 = "ERROR: after sending, receiver balance != balance before + incoming amount - outgoing amount - tx fee (" + _context127.t70;
                    _context127.t72 = _context127.t71 + " != ";
                    _context127.t73 = toStringBI(receiverBalanceBefore);
                    _context127.t74 = _context127.t72 + _context127.t73;
                    _context127.t75 = _context127.t74 + " + ";
                    _context127.t76 = toStringBI(receiverTx.getIncomingAmount());
                    _context127.t77 = _context127.t75 + _context127.t76;
                    _context127.t78 = _context127.t77 + " - ";
                    _context127.t79 = toStringBI(receiverTx.getOutgoingAmount());
                    _context127.t80 = _context127.t78 + _context127.t79;
                    _context127.t81 = _context127.t80 + " - ";
                    _context127.t82 = (sameWallet ? receiverTx.getFee() : BigInt("0")).toString();
                    _context127.t83 = _context127.t81 + _context127.t82;
                    _context127.t84 = _context127.t83 + ")";

                    _context127.t67.push.call(_context127.t67, _context127.t84);

                  case 234:
                    _context127.t85 = !sameWallet;

                    if (!_context127.t85) {
                      _context127.next = 240;
                      break;
                    }

                    _context127.next = 238;
                    return _index.GenUtils.compareBigInt(receiver.getUnlockedBalance());

                  case 238:
                    _context127.t86 = receiverUnlockedBalanceBefore;
                    _context127.t85 = _context127.t86 !== 0;

                  case 240:
                    if (!_context127.t85) {
                      _context127.next = 242;
                      break;
                    }

                    issues.push("ERROR: receiver unlocked balance should not have changed after sending");

                  case 242:
                    if (!(receiverNotificationCollector.getBalanceNotifications().length === 0)) {
                      _context127.next = 246;
                      break;
                    }

                    issues.push("ERROR: receiver did not notify balance change when funds received");
                    _context127.next = 256;
                    break;

                  case 246:
                    _context127.next = 248;
                    return _index.GenUtils.compareBigInt(receiver.getBalance());

                  case 248:
                    _context127.t87 = receiverNotificationCollector.getBalanceNotifications()[receiverNotificationCollector.getBalanceNotifications().length - 1].balance;

                    if (!(_context127.t87 !== 0)) {
                      _context127.next = 251;
                      break;
                    }

                    issues.push("ERROR: receiver balance != last notified balance after funds received");

                  case 251:
                    _context127.next = 253;
                    return _index.GenUtils.compareBigInt(receiver.getUnlockedBalance());

                  case 253:
                    _context127.t88 = receiverNotificationCollector.getBalanceNotifications()[receiverNotificationCollector.getBalanceNotifications().length - 1].unlockedBalance;

                    if (!(_context127.t88 !== 0)) {
                      _context127.next = 256;
                      break;
                    }

                    issues.push("ERROR: receiver unlocked balance != last notified unlocked balance after funds received");

                  case 256:
                    if (receiverNotificationCollector.getOutputsReceived(outputQuery).length === 0) issues.push("ERROR: receiver did not announce unconfirmed received output");else {
                      _iterator132 = _createForOfIteratorHelper(getMissingOutputs(expectedOutputs, receiverNotificationCollector.getOutputsReceived(outputQuery), true));

                      try {
                        for (_iterator132.s(); !(_step132 = _iterator132.n()).done;) {
                          _output22 = _step132.value;
                          issues.push("ERROR: receiver did not announce received output for amount " + toStringBI(_output22.getAmount()) + " to subaddress [" + _output22.getAccountIndex() + ", " + _output22.getSubaddressIndex() + "]");
                        }
                      } catch (err) {
                        _iterator132.e(err);
                      } finally {
                        _iterator132.f();
                      }
                    } // mine until test completes

                    _context127.next = 259;
                    return _StartMining["default"].startMining();

                  case 259:
                    // loop every sync period until unlock tested
                    threads = [];
                    expectedUnlockHeight = lastHeight + unlockDelay;
                    confirmHeight = undefined;
                    _loop2 = /*#__PURE__*/_regenerator["default"].mark(function _loop2() {
                      var height, testStartHeight, threadFn, tx, _threadFn, _threadFn2;

                      return _regenerator["default"].wrap(function _loop2$(_context126) {
                        while (1) {
                          switch (_context126.prev = _context126.next) {
                            case 0:
                              _context126.next = 2;
                              return that.daemon.getHeight();

                            case 2:
                              height = _context126.sent;

                              if (height > lastHeight) {
                                testStartHeight = lastHeight;
                                lastHeight = height;

                                threadFn = /*#__PURE__*/function () {
                                  var _ref111 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee122() {
                                    var senderBlockNotifications, receiverBlockNotifications, _i17;

                                    return _regenerator["default"].wrap(function _callee122$(_context123) {
                                      while (1) {
                                        switch (_context123.prev = _context123.next) {
                                          case 0:
                                            _context123.next = 2;
                                            return _index.GenUtils.waitFor(_TestUtils["default"].SYNC_PERIOD_IN_MS * 2 + MAX_POLL_TIME);

                                          case 2:
                                            // wait 2 sync periods + poll time for notifications
                                            senderBlockNotifications = senderNotificationCollector.getBlockNotifications();
                                            receiverBlockNotifications = receiverNotificationCollector.getBlockNotifications();

                                            for (_i17 = testStartHeight; _i17 < height; _i17++) {
                                              if (!_index.GenUtils.arrayContains(senderBlockNotifications, _i17)) issues.push("ERROR: sender did not announce block " + _i17);
                                              if (!_index.GenUtils.arrayContains(receiverBlockNotifications, _i17)) issues.push("ERROR: receiver did not announce block " + _i17);
                                            }

                                          case 5:
                                          case "end":
                                            return _context123.stop();
                                        }
                                      }
                                    }, _callee122);
                                  }));

                                  return function threadFn() {
                                    return _ref111.apply(this, arguments);
                                  };
                                }();

                                threads.push(threadFn());
                              } // check if tx confirmed


                              if (!(confirmHeight === undefined)) {
                                _context126.next = 14;
                                break;
                              }

                              _context126.next = 7;
                              return receiver.getTx(senderTx.getHash());

                            case 7:
                              tx = _context126.sent;

                              if (!tx.isFailed()) {
                                _context126.next = 11;
                                break;
                              }

                              issues.push("ERROR: tx failed in tx pool");
                              return _context126.abrupt("return", "break");

                            case 11:
                              // test confirm notifications
                              if (tx.isConfirmed() && confirmHeight === undefined) {
                                confirmHeight = tx.getHeight();
                                expectedUnlockHeight = Math.max(confirmHeight + NUM_BLOCKS_LOCKED, expectedUnlockHeight); // exact unlock height known

                                _threadFn = /*#__PURE__*/function () {
                                  var _ref112 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee123() {
                                    var confirmedQuery, _iterator137, _step137, _output23, netAmount, _iterator138, _step138, outputSpent, _iterator139, _step139, outputReceived;

                                    return _regenerator["default"].wrap(function _callee123$(_context124) {
                                      while (1) {
                                        switch (_context124.prev = _context124.next) {
                                          case 0:
                                            _context124.next = 2;
                                            return _index.GenUtils.waitFor(_TestUtils["default"].SYNC_PERIOD_IN_MS * 2 + MAX_POLL_TIME);

                                          case 2:
                                            // wait 2 sync periods + poll time for notifications
                                            confirmedQuery = outputQuery.getTxQuery().copy().setIsConfirmed(true).setIsLocked(true).getOutputQuery();
                                            if (senderNotificationCollector.getOutputsSpent(confirmedQuery).length === 0) issues.push("ERROR: sender did not announce confirmed spent output"); // TODO: test amount

                                            if (receiverNotificationCollector.getOutputsReceived(confirmedQuery).length === 0) issues.push("ERROR: receiver did not announce confirmed received output");else {
                                              _iterator137 = _createForOfIteratorHelper(getMissingOutputs(expectedOutputs, receiverNotificationCollector.getOutputsReceived(confirmedQuery), true));

                                              try {
                                                for (_iterator137.s(); !(_step137 = _iterator137.n()).done;) {
                                                  _output23 = _step137.value;
                                                  issues.push("ERROR: receiver did not announce confirmed received output for amount " + _output23.getAmount() + " to subaddress [" + _output23.getAccountIndex() + ", " + _output23.getSubaddressIndex() + "]");
                                                }
                                              } catch (err) {
                                                _iterator137.e(err);
                                              } finally {
                                                _iterator137.f();
                                              }
                                            } // if same wallet, net amount spent = tx fee = outputs spent - outputs received

                                            if (sameWallet) {
                                              netAmount = BigInt("0");
                                              _iterator138 = _createForOfIteratorHelper(senderNotificationCollector.getOutputsSpent(confirmedQuery));

                                              try {
                                                for (_iterator138.s(); !(_step138 = _iterator138.n()).done;) {
                                                  outputSpent = _step138.value;
                                                  netAmount = netAmount + outputSpent.getAmount();
                                                }
                                              } catch (err) {
                                                _iterator138.e(err);
                                              } finally {
                                                _iterator138.f();
                                              }

                                              _iterator139 = _createForOfIteratorHelper(senderNotificationCollector.getOutputsReceived(confirmedQuery));

                                              try {
                                                for (_iterator139.s(); !(_step139 = _iterator139.n()).done;) {
                                                  outputReceived = _step139.value;
                                                  netAmount = netAmount - outputReceived.getAmount();
                                                }
                                              } catch (err) {
                                                _iterator139.e(err);
                                              } finally {
                                                _iterator139.f();
                                              }

                                              if (_index.GenUtils.compareBigInt(tx.getFee(), netAmount) !== 0) {
                                                if (sameAccount) issues.push("WARNING: net output amount != tx fee when funds sent to same account: " + netAmount + " vs " + tx.getFee());else if (sender instanceof _index.MoneroWalletRpc) issues.push("WARNING: net output amount != tx fee when funds sent to same wallet because monero-wallet-rpc does not provide tx inputs: " + netAmount + " vs " + tx.getFee()); // TODO (monero-project): open issue to provide tx inputs
                                                else issues.push("ERROR: net output amount must equal tx fee when funds sent to same wallet: " + netAmount + " vs " + tx.getFee());
                                              }
                                            }

                                          case 6:
                                          case "end":
                                            return _context124.stop();
                                        }
                                      }
                                    }, _callee123);
                                  }));

                                  return function _threadFn() {
                                    return _ref112.apply(this, arguments);
                                  };
                                }();

                                threads.push(_threadFn());
                              }

                              _context126.next = 18;
                              break;

                            case 14:
                              if (!(height >= expectedUnlockHeight)) {
                                _context126.next = 18;
                                break;
                              }

                              _threadFn2 = /*#__PURE__*/function () {
                                var _ref113 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee124() {
                                  var unlockedQuery, _iterator140, _step140, _output24;

                                  return _regenerator["default"].wrap(function _callee124$(_context125) {
                                    while (1) {
                                      switch (_context125.prev = _context125.next) {
                                        case 0:
                                          _context125.next = 2;
                                          return _index.GenUtils.waitFor(_TestUtils["default"].SYNC_PERIOD_IN_MS * 2 + MAX_POLL_TIME);

                                        case 2:
                                          // wait 2 sync periods + poll time for notifications
                                          unlockedQuery = outputQuery.getTxQuery().copy().setIsLocked(false).getOutputQuery();
                                          if (senderNotificationCollector.getOutputsSpent(unlockedQuery).length === 0) issues.push("ERROR: sender did not announce unlocked spent output"); // TODO: test amount?

                                          _iterator140 = _createForOfIteratorHelper(getMissingOutputs(expectedOutputs, receiverNotificationCollector.getOutputsReceived(unlockedQuery), true));

                                          try {
                                            for (_iterator140.s(); !(_step140 = _iterator140.n()).done;) {
                                              _output24 = _step140.value;
                                              issues.push("ERROR: receiver did not announce unlocked received output for amount " + _output24.getAmount() + " to subaddress [" + _output24.getAccountIndex() + ", " + _output24.getSubaddressIndex() + "]");
                                            }
                                          } catch (err) {
                                            _iterator140.e(err);
                                          } finally {
                                            _iterator140.f();
                                          }

                                          _context125.t0 = !sameWallet;

                                          if (!_context125.t0) {
                                            _context125.next = 14;
                                            break;
                                          }

                                          _context125.next = 10;
                                          return _index.GenUtils.compareBigInt(receiver.getBalance());

                                        case 10:
                                          _context125.next = 12;
                                          return receiver.getUnlockedBalance();

                                        case 12:
                                          _context125.t1 = _context125.sent;
                                          _context125.t0 = _context125.t1 !== 0;

                                        case 14:
                                          if (!_context125.t0) {
                                            _context125.next = 16;
                                            break;
                                          }

                                          issues.push("ERROR: receiver balance != unlocked balance after funds unlocked");

                                        case 16:
                                          if (!(senderNotificationCollector.getBalanceNotifications().length === 0)) {
                                            _context125.next = 20;
                                            break;
                                          }

                                          issues.push("ERROR: sender did not announce any balance notifications");
                                          _context125.next = 30;
                                          break;

                                        case 20:
                                          _context125.next = 22;
                                          return _index.GenUtils.compareBigInt(sender.getBalance());

                                        case 22:
                                          _context125.t2 = senderNotificationCollector.getBalanceNotifications()[senderNotificationCollector.getBalanceNotifications().length - 1].balance;

                                          if (!(_context125.t2 !== 0)) {
                                            _context125.next = 25;
                                            break;
                                          }

                                          issues.push("ERROR: sender balance != last notified balance after funds unlocked");

                                        case 25:
                                          _context125.next = 27;
                                          return _index.GenUtils.compareBigInt(sender.getUnlockedBalance());

                                        case 27:
                                          _context125.t3 = senderNotificationCollector.getBalanceNotifications()[senderNotificationCollector.getBalanceNotifications().length - 1].unlockedBalance;

                                          if (!(_context125.t3 !== 0)) {
                                            _context125.next = 30;
                                            break;
                                          }

                                          issues.push("ERROR: sender unlocked balance != last notified unlocked balance after funds unlocked");

                                        case 30:
                                          if (!(receiverNotificationCollector.getBalanceNotifications().length === 0)) {
                                            _context125.next = 34;
                                            break;
                                          }

                                          issues.push("ERROR: receiver did not announce any balance notifications");
                                          _context125.next = 44;
                                          break;

                                        case 34:
                                          _context125.next = 36;
                                          return _index.GenUtils.compareBigInt(receiver.getBalance());

                                        case 36:
                                          _context125.t4 = receiverNotificationCollector.getBalanceNotifications()[receiverNotificationCollector.getBalanceNotifications().length - 1].balance;

                                          if (!(_context125.t4 !== 0)) {
                                            _context125.next = 39;
                                            break;
                                          }

                                          issues.push("ERROR: receiver balance != last notified balance after funds unlocked");

                                        case 39:
                                          _context125.next = 41;
                                          return _index.GenUtils.compareBigInt(receiver.getUnlockedBalance());

                                        case 41:
                                          _context125.t5 = receiverNotificationCollector.getBalanceNotifications()[receiverNotificationCollector.getBalanceNotifications().length - 1].unlockedBalance;

                                          if (!(_context125.t5 !== 0)) {
                                            _context125.next = 44;
                                            break;
                                          }

                                          issues.push("ERROR: receiver unlocked balance != last notified unlocked balance after funds unlocked");

                                        case 44:
                                        case "end":
                                          return _context125.stop();
                                      }
                                    }
                                  }, _callee124);
                                }));

                                return function _threadFn2() {
                                  return _ref113.apply(this, arguments);
                                };
                              }();

                              threads.push(_threadFn2());
                              return _context126.abrupt("return", "break");

                            case 18:
                              _context126.next = 20;
                              return _index.GenUtils.waitFor(_TestUtils["default"].SYNC_PERIOD_IN_MS - (Date.now() - startTime));

                            case 20:
                              startTime = Date.now(); // reset timer

                            case 21:
                            case "end":
                              return _context126.stop();
                          }
                        }
                      }, _loop2);
                    });

                  case 263:
                    if (!true) {
                      _context127.next = 270;
                      break;
                    }

                    return _context127.delegateYield(_loop2(), "t89", 265);

                  case 265:
                    _ret = _context127.t89;

                    if (!(_ret === "break")) {
                      _context127.next = 268;
                      break;
                    }

                    return _context127.abrupt("break", 270);

                  case 268:
                    _context127.next = 263;
                    break;

                  case 270:
                    _context127.next = 272;
                    return Promise.all(threads);

                  case 272:
                    // test notified outputs
                    _iterator133 = _createForOfIteratorHelper(senderNotificationCollector.getOutputsSpent(outputQuery));

                    try {
                      for (_iterator133.s(); !(_step133 = _iterator133.n()).done;) {
                        _output25 = _step133.value;
                        testNotifiedOutput(_output25, true, issues);
                      }
                    } catch (err) {
                      _iterator133.e(err);
                    } finally {
                      _iterator133.f();
                    }

                    _iterator134 = _createForOfIteratorHelper(senderNotificationCollector.getOutputsReceived(outputQuery));

                    try {
                      for (_iterator134.s(); !(_step134 = _iterator134.n()).done;) {
                        _output26 = _step134.value;
                        testNotifiedOutput(_output26, false, issues);
                      }
                    } catch (err) {
                      _iterator134.e(err);
                    } finally {
                      _iterator134.f();
                    }

                    _iterator135 = _createForOfIteratorHelper(receiverNotificationCollector.getOutputsSpent(outputQuery));

                    try {
                      for (_iterator135.s(); !(_step135 = _iterator135.n()).done;) {
                        _output27 = _step135.value;
                        testNotifiedOutput(_output27, true, issues);
                      }
                    } catch (err) {
                      _iterator135.e(err);
                    } finally {
                      _iterator135.f();
                    }

                    _iterator136 = _createForOfIteratorHelper(receiverNotificationCollector.getOutputsReceived(outputQuery));

                    try {
                      for (_iterator136.s(); !(_step136 = _iterator136.n()).done;) {
                        _output28 = _step136.value;
                        testNotifiedOutput(_output28, false, issues);
                      } // clean up

                    } catch (err) {
                      _iterator136.e(err);
                    } finally {
                      _iterator136.f();
                    }

                    _context127.next = 282;
                    return that.daemon.getMiningStatus();

                  case 282:
                    if (!_context127.sent.isActive()) {
                      _context127.next = 285;
                      break;
                    }

                    _context127.next = 285;
                    return that.daemon.stopMining();

                  case 285:
                    _context127.next = 287;
                    return sender.removeListener(senderNotificationCollector);

                  case 287:
                    senderNotificationCollector.setListening(false);
                    _context127.next = 290;
                    return receiver.removeListener(receiverNotificationCollector);

                  case 290:
                    receiverNotificationCollector.setListening(false);

                    if (!(sender !== receiver)) {
                      _context127.next = 294;
                      break;
                    }

                    _context127.next = 294;
                    return that.closeWallet(receiver);

                  case 294:
                    return _context127.abrupt("return", issues);

                  case 295:
                  case "end":
                    return _context127.stop();
                }
              }
            }, _callee125, null, [[75, 90, 93, 96]]);
          }));
          return _testWalletNotificationsAux.apply(this, arguments);
        }

        function getMissingOutputs(expectedOutputs, actualOutputs, matchSubaddress) {
          var missing = [];
          var used = [];

          var _iterator104 = _createForOfIteratorHelper(expectedOutputs),
              _step104;

          try {
            for (_iterator104.s(); !(_step104 = _iterator104.n()).done;) {
              var expectedOutput = _step104.value;
              var found = false;

              var _iterator105 = _createForOfIteratorHelper(actualOutputs),
                  _step105;

              try {
                for (_iterator105.s(); !(_step105 = _iterator105.n()).done;) {
                  var actualOutput = _step105.value;
                  if (_index.GenUtils.arrayContains(used, actualOutput, true)) continue;

                  if (BitIntegerCompare(actualOutput.getAmount(), expectedOutput.getAmount()) === 0 && (!matchSubaddress || actualOutput.getAccountIndex() === expectedOutput.getAccountIndex() && actualOutput.getSubaddressIndex() === expectedOutput.getSubaddressIndex())) {
                    used.push(actualOutput);
                    found = true;
                    break;
                  }
                }
              } catch (err) {
                _iterator105.e(err);
              } finally {
                _iterator105.f();
              }

              if (!found) missing.push(expectedOutput);
            }
          } catch (err) {
            _iterator104.e(err);
          } finally {
            _iterator104.f();
          }

          return missing;
        }

        function issuesToStr(issues) {
          if (issues.length === 0) return undefined;
          var str = "";

          for (var i = 0; i < issues.length; i++) {
            str += i + 1 + ": " + issues[i];
            if (i < issues.length - 1) str += "\n";
          }

          return str;
        }

        function testNotifiedOutput(output, isTxInput, issues) {
          // test tx link
          _assert["default"].notEqual(undefined, output.getTx());

          if (isTxInput) (0, _assert["default"])(output.getTx().getInputs().includes(output));else (0, _assert["default"])(output.getTx().getOutputs().includes(output)); // test output values

          _TestUtils["default"].testUnsignedBigInt(output.getAmount());

          if (output.getAccountIndex() !== undefined) (0, _assert["default"])(output.getAccountIndex() >= 0);else {
            if (isTxInput) issues.push("WARNING: notification of " + getOutputState(output) + " spent output missing account index"); // TODO (monero-project): account index not provided when output swept by key image.  could retrieve it but slows tx creation significantly
            else issues.push("ERROR: notification of " + getOutputState(output) + " received output missing account index");
          }
          if (output.getSubaddressIndex() !== undefined) (0, _assert["default"])(output.getSubaddressIndex() >= 0);else {
            if (isTxInput) issues.push("WARNING: notification of " + getOutputState(output) + " spent output missing subaddress index"); // TODO (monero-project): because inputs are not provided, creating fake input from outgoing transfer, which can be sourced from multiple subaddress indices, whereas an output can only come from one subaddress index; need to provide tx inputs to resolve this
            else issues.push("ERROR: notification of " + getOutputState(output) + " received output missing subaddress index");
          }
        }

        function getOutputState(output) {
          if (false === output.getTx().isLocked()) return "unlocked";
          if (true === output.getTx().isConfirmed()) return "confirmed";
          if (false === output.getTx().isConfirmed()) return "unconfirmed";
          throw new Error("Unknown output state: " + output.toString());
        }

        function toStringBI(bi) {
          return bi ? bi.toString() : bi + "";
        }

        it("Can stop listening", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee88() {
          var wallet, listener;
          return _regenerator["default"].wrap(function _callee88$(_context89) {
            while (1) {
              switch (_context89.prev = _context89.next) {
                case 0:
                  _context89.next = 2;
                  return that.createWallet(new _index.MoneroWalletConfig().setServerUri(_TestUtils["default"].OFFLINE_SERVER_URI));

                case 2:
                  wallet = _context89.sent;
                  // add listener
                  listener = new WalletNotificationCollector();
                  _context89.next = 6;
                  return wallet.addListener(listener);

                case 6:
                  _context89.t0 = wallet;
                  _context89.next = 9;
                  return that.daemon.getRpcConnection();

                case 9:
                  _context89.t1 = _context89.sent;
                  _context89.next = 12;
                  return _context89.t0.setDaemonConnection.call(_context89.t0, _context89.t1);

                case 12:
                  _context89.next = 14;
                  return new Promise(function (resolve) {
                    setTimeout(resolve, 1000);
                  });

                case 14:
                  _context89.next = 16;
                  return wallet.removeListener(listener);

                case 16:
                  _context89.next = 18;
                  return that.closeWallet(wallet);

                case 18:
                case "end":
                  return _context89.stop();
              }
            }
          }, _callee88);
        })));
        if (testConfig.testNotifications) it("Can be created and receive funds", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee89() {
          var receiver, err, myListener, sentTx;
          return _regenerator["default"].wrap(function _callee89$(_context90) {
            while (1) {
              switch (_context90.prev = _context90.next) {
                case 0:
                  _context90.next = 2;
                  return that.createWallet({
                    password: "mysupersecretpassword123"
                  });

                case 2:
                  receiver = _context90.sent;
                  _context90.prev = 3;
                  // listen for received outputs
                  myListener = new WalletNotificationCollector(receiver);
                  _context90.next = 7;
                  return receiver.addListener(myListener);

                case 7:
                  _context90.next = 9;
                  return _TestUtils["default"].WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);

                case 9:
                  _context90.next = 11;
                  return _TestUtils["default"].WALLET_TX_TRACKER.waitForUnlockedBalance(that.wallet, 0, undefined, _TestUtils["default"].MAX_FEE);

                case 11:
                  _context90.t0 = that.wallet;
                  _context90.next = 14;
                  return receiver.getPrimaryAddress();

                case 14:
                  _context90.t1 = _context90.sent;
                  _context90.t2 = _TestUtils["default"].MAX_FEE;
                  _context90.t3 = {
                    accountIndex: 0,
                    address: _context90.t1,
                    amount: _context90.t2,
                    relay: true
                  };
                  _context90.next = 19;
                  return _context90.t0.createTx.call(_context90.t0, _context90.t3);

                case 19:
                  sentTx = _context90.sent;
                  _context90.prev = 20;
                  _context90.next = 23;
                  return _StartMining["default"].startMining();

                case 23:
                  _context90.next = 27;
                  break;

                case 25:
                  _context90.prev = 25;
                  _context90.t4 = _context90["catch"](20);

                case 27:
                  _context90.next = 29;
                  return that.wallet.getTx(sentTx.getHash());

                case 29:
                  if (_context90.sent.isConfirmed()) {
                    _context90.next = 38;
                    break;
                  }

                  _context90.next = 32;
                  return that.wallet.getTx(sentTx.getHash());

                case 32:
                  if (!_context90.sent.isFailed()) {
                    _context90.next = 34;
                    break;
                  }

                  throw new Error("Tx failed in mempool: " + sentTx.getHash());

                case 34:
                  _context90.next = 36;
                  return that.daemon.waitForNextBlockHeader();

                case 36:
                  _context90.next = 27;
                  break;

                case 38:
                  _context90.next = 40;
                  return new Promise(function (resolve) {
                    setTimeout(resolve, 1000);
                  });

                case 40:
                  // TODO: this lets block slip, okay?
                  (0, _assert["default"])(myListener.getOutputsReceived().length > 0, "Listener did not receive outputs");
                  _context90.next = 46;
                  break;

                case 43:
                  _context90.prev = 43;
                  _context90.t5 = _context90["catch"](3);
                  err = _context90.t5;

                case 46:
                  _context90.next = 48;
                  return that.closeWallet(receiver);

                case 48:
                  _context90.prev = 48;
                  _context90.next = 51;
                  return that.daemon.stopMining();

                case 51:
                  _context90.next = 55;
                  break;

                case 53:
                  _context90.prev = 53;
                  _context90.t6 = _context90["catch"](48);

                case 55:
                  if (!err) {
                    _context90.next = 57;
                    break;
                  }

                  throw err;

                case 57:
                case "end":
                  return _context90.stop();
              }
            }
          }, _callee89, null, [[3, 43], [20, 25], [48, 53]]);
        }))); // TODO: test sending to multiple accounts

        if (testConfig.testRelays && testConfig.testNotifications) it("Can update a locked tx sent from/to the same account as blocks are added to the chain", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee90() {
          var config;
          return _regenerator["default"].wrap(function _callee90$(_context91) {
            while (1) {
              switch (_context91.prev = _context91.next) {
                case 0:
                  _context91.t0 = _index.MoneroTxConfig;
                  _context91.next = 3;
                  return that.wallet.getPrimaryAddress();

                case 3:
                  _context91.t1 = _context91.sent;
                  _context91.t2 = _TestUtils["default"].MAX_FEE;
                  _context91.next = 7;
                  return that.daemon.getHeight();

                case 7:
                  _context91.t3 = _context91.sent;
                  _context91.t4 = _context91.t3 + 3;
                  _context91.t5 = {
                    accountIndex: 0,
                    address: _context91.t1,
                    amount: _context91.t2,
                    unlockHeight: _context91.t4,
                    canSplit: false,
                    relay: true
                  };
                  config = new _context91.t0(_context91.t5);
                  _context91.next = 13;
                  return testSendAndUpdateTxs(config);

                case 13:
                case "end":
                  return _context91.stop();
              }
            }
          }, _callee90);
        })));
        if (testConfig.testRelays && testConfig.testNotifications && !testConfig.liteMode) it("Can update split locked txs sent from/to the same account as blocks are added to the chain", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee91() {
          var config;
          return _regenerator["default"].wrap(function _callee91$(_context92) {
            while (1) {
              switch (_context92.prev = _context92.next) {
                case 0:
                  _context92.t0 = _index.MoneroTxConfig;
                  _context92.next = 3;
                  return that.wallet.getPrimaryAddress();

                case 3:
                  _context92.t1 = _context92.sent;
                  _context92.t2 = _TestUtils["default"].MAX_FEE;
                  _context92.next = 7;
                  return that.daemon.getHeight();

                case 7:
                  _context92.t3 = _context92.sent;
                  _context92.t4 = _context92.t3 + 3;
                  _context92.t5 = {
                    accountIndex: 0,
                    address: _context92.t1,
                    amount: _context92.t2,
                    unlockHeight: _context92.t4,
                    canSplit: true,
                    relay: true
                  };
                  config = new _context92.t0(_context92.t5);
                  _context92.next = 13;
                  return testSendAndUpdateTxs(config);

                case 13:
                case "end":
                  return _context92.stop();
              }
            }
          }, _callee91);
        })));
        if (testConfig.testRelays && testConfig.testNotifications && !testConfig.liteMode) it("Can update a locked tx sent from/to different accounts as blocks are added to the chain", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee92() {
          var config;
          return _regenerator["default"].wrap(function _callee92$(_context93) {
            while (1) {
              switch (_context93.prev = _context93.next) {
                case 0:
                  _context93.t0 = _index.MoneroTxConfig;
                  _context93.next = 3;
                  return that.wallet.getSubaddress(1, 0);

                case 3:
                  _context93.t1 = _context93.sent.getAddress();
                  _context93.t2 = _TestUtils["default"].MAX_FEE;
                  _context93.next = 7;
                  return that.daemon.getHeight();

                case 7:
                  _context93.t3 = _context93.sent;
                  _context93.t4 = _context93.t3 + 3;
                  _context93.t5 = {
                    accountIndex: 0,
                    address: _context93.t1,
                    amount: _context93.t2,
                    unlockHeight: _context93.t4,
                    canSplit: false,
                    relay: true
                  };
                  config = new _context93.t0(_context93.t5);
                  _context93.next = 13;
                  return testSendAndUpdateTxs(config);

                case 13:
                case "end":
                  return _context93.stop();
              }
            }
          }, _callee92);
        })));
        if (testConfig.testRelays && testConfig.testNotifications && !testConfig.liteMode) it("Can update locked, split txs sent from/to different accounts as blocks are added to the chain", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee93() {
          var config;
          return _regenerator["default"].wrap(function _callee93$(_context94) {
            while (1) {
              switch (_context94.prev = _context94.next) {
                case 0:
                  _context94.t0 = _index.MoneroTxConfig;
                  _context94.next = 3;
                  return that.wallet.getSubaddress(1, 0);

                case 3:
                  _context94.t1 = _context94.sent.getAddress();
                  _context94.t2 = _TestUtils["default"].MAX_FEE;
                  _context94.next = 7;
                  return that.daemon.getHeight();

                case 7:
                  _context94.t3 = _context94.sent;
                  _context94.t4 = _context94.t3 + 3;
                  _context94.t5 = {
                    accountIndex: 0,
                    address: _context94.t1,
                    amount: _context94.t2,
                    unlockHeight: _context94.t4,
                    relay: true
                  };
                  config = new _context94.t0(_context94.t5);
                  _context94.next = 13;
                  return testSendAndUpdateTxs(config);

                case 13:
                case "end":
                  return _context94.stop();
              }
            }
          }, _callee93);
        })));
        /**
         * Tests sending a tx with an unlock height then tracking and updating it as
         * blocks are added to the chain.
         * 
         * TODO: test wallet accounting throughout this; dedicated method? probably.
         * 
         * Allows sending to and from the same account which is an edge case where
         * incoming txs are occluded by their outgoing counterpart (issue #4500)
         * and also where it is impossible to discern which incoming output is
         * the tx amount and which is the change amount without wallet metadata.
         * 
         * @param config - tx configuration to send and test
         */

        function testSendAndUpdateTxs(_x20) {
          return _testSendAndUpdateTxs.apply(this, arguments);
        }

        function _testSendAndUpdateTxs() {
          _testSendAndUpdateTxs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee126(config) {
            var err, sentTxs, _iterator141, _step141, tx, updatedTxs, numConfirmations, numConfirmationsTotal, header, txQuery, fetchedTxs, _iterator142, _step142, fetchedTx, _iterator143, _step143, updatedTx, _iterator144, _step144, sentTx;

            return _regenerator["default"].wrap(function _callee126$(_context128) {
              while (1) {
                switch (_context128.prev = _context128.next) {
                  case 0:
                    if (!config) config = new _index.MoneroTxConfig(); // wait for txs to confirm and for sufficient unlocked balance

                    _context128.next = 3;
                    return _TestUtils["default"].WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);

                  case 3:
                    (0, _assert["default"])(!config.getSubaddressIndices());
                    _context128.next = 6;
                    return _TestUtils["default"].WALLET_TX_TRACKER.waitForUnlockedBalance(that.wallet, config.getAccountIndex(), undefined, _TestUtils["default"].MAX_FEE * BigInt("2"));

                  case 6:
                    _context128.prev = 6;

                    if (!(config.getCanSplit() !== false)) {
                      _context128.next = 13;
                      break;
                    }

                    _context128.next = 10;
                    return that.wallet.createTxs(config);

                  case 10:
                    _context128.t0 = _context128.sent;
                    _context128.next = 17;
                    break;

                  case 13:
                    _context128.next = 15;
                    return that.wallet.createTx(config);

                  case 15:
                    _context128.t1 = _context128.sent;
                    _context128.t0 = [_context128.t1];

                  case 17:
                    sentTxs = _context128.t0;
                    // test sent transactions
                    _iterator141 = _createForOfIteratorHelper(sentTxs);
                    _context128.prev = 19;

                    _iterator141.s();

                  case 21:
                    if ((_step141 = _iterator141.n()).done) {
                      _context128.next = 29;
                      break;
                    }

                    tx = _step141.value;
                    _context128.next = 25;
                    return that._testTxWallet(tx, {
                      wallet: that.wallet,
                      config: config,
                      isSendResponse: true
                    });

                  case 25:
                    _assert["default"].equal(tx.isConfirmed(), false);

                    _assert["default"].equal(tx.inTxPool(), true);

                  case 27:
                    _context128.next = 21;
                    break;

                  case 29:
                    _context128.next = 34;
                    break;

                  case 31:
                    _context128.prev = 31;
                    _context128.t2 = _context128["catch"](19);

                    _iterator141.e(_context128.t2);

                  case 34:
                    _context128.prev = 34;

                    _iterator141.f();

                    return _context128.finish(34);

                  case 37:
                    _context128.prev = 37;
                    _context128.next = 40;
                    return _StartMining["default"].startMining();

                  case 40:
                    _context128.next = 45;
                    break;

                  case 42:
                    _context128.prev = 42;
                    _context128.t3 = _context128["catch"](37);
                    console.log("WARNING: could not start mining: " + _context128.t3.message);

                  case 45:
                    // not fatal
                    // loop to update txs through confirmations
                    numConfirmations = 0;
                    numConfirmationsTotal = 2; // number of confirmations to test

                  case 47:
                    if (!(numConfirmations < numConfirmationsTotal)) {
                      _context128.next = 128;
                      break;
                    }

                    _context128.next = 50;
                    return that.daemon.waitForNextBlockHeader();

                  case 50:
                    header = _context128.sent;
                    console.log("*** Block " + header.getHeight() + " added to chain ***"); // give wallet time to catch up, otherwise incoming tx may not appear

                    _context128.next = 54;
                    return new Promise(function (resolve) {
                      setTimeout(resolve, _TestUtils["default"].SYNC_PERIOD_IN_MS);
                    });

                  case 54:
                    // TODO: this lets block slip, okay?
                    // get incoming/outgoing txs with sent hashes
                    txQuery = new _index.MoneroTxQuery();
                    txQuery.setHashes(sentTxs.map(function (sentTx) {
                      return sentTx.getHash();
                    })); // TODO: convenience methods wallet.getTxById(), getTxsById()?

                    _context128.next = 58;
                    return that._getAndTestTxs(that.wallet, txQuery, true);

                  case 58:
                    fetchedTxs = _context128.sent;
                    (0, _assert["default"])(fetchedTxs.length > 0); // test fetched txs

                    _context128.next = 62;
                    return testOutInPairs(that.wallet, fetchedTxs, config, false);

                  case 62:
                    // merge fetched txs into updated txs and original sent txs
                    _iterator142 = _createForOfIteratorHelper(fetchedTxs);
                    _context128.prev = 63;

                    _iterator142.s();

                  case 65:
                    if ((_step142 = _iterator142.n()).done) {
                      _context128.next = 114;
                      break;
                    }

                    fetchedTx = _step142.value;

                    if (!(updatedTxs === undefined)) {
                      _context128.next = 71;
                      break;
                    }

                    updatedTxs = fetchedTxs;
                    _context128.next = 92;
                    break;

                  case 71:
                    _iterator143 = _createForOfIteratorHelper(updatedTxs);
                    _context128.prev = 72;

                    _iterator143.s();

                  case 74:
                    if ((_step143 = _iterator143.n()).done) {
                      _context128.next = 84;
                      break;
                    }

                    updatedTx = _step143.value;

                    if (!(fetchedTx.getHash() !== updatedTx.getHash())) {
                      _context128.next = 78;
                      break;
                    }

                    return _context128.abrupt("continue", 82);

                  case 78:
                    if (!(!!fetchedTx.getOutgoingTransfer() !== !!updatedTx.getOutgoingTransfer())) {
                      _context128.next = 80;
                      break;
                    }

                    return _context128.abrupt("continue", 82);

                  case 80:
                    // skip if directions are different
                    updatedTx.merge(fetchedTx.copy());
                    if (!updatedTx.getBlock() && fetchedTx.getBlock()) updatedTx.setBlock(fetchedTx.getBlock().copy().setTxs([updatedTx])); // copy block for testing

                  case 82:
                    _context128.next = 74;
                    break;

                  case 84:
                    _context128.next = 89;
                    break;

                  case 86:
                    _context128.prev = 86;
                    _context128.t4 = _context128["catch"](72);

                    _iterator143.e(_context128.t4);

                  case 89:
                    _context128.prev = 89;

                    _iterator143.f();

                    return _context128.finish(89);

                  case 92:
                    // merge with original sent txs
                    _iterator144 = _createForOfIteratorHelper(sentTxs);
                    _context128.prev = 93;

                    _iterator144.s();

                  case 95:
                    if ((_step144 = _iterator144.n()).done) {
                      _context128.next = 104;
                      break;
                    }

                    sentTx = _step144.value;

                    if (!(fetchedTx.getHash() !== sentTx.getHash())) {
                      _context128.next = 99;
                      break;
                    }

                    return _context128.abrupt("continue", 102);

                  case 99:
                    if (!(!!fetchedTx.getOutgoingTransfer() !== !!sentTx.getOutgoingTransfer())) {
                      _context128.next = 101;
                      break;
                    }

                    return _context128.abrupt("continue", 102);

                  case 101:
                    // skip if directions are different
                    sentTx.merge(fetchedTx.copy()); // TODO: it's mergeable but tests don't account for extra info from send (e.g. hex) so not tested; could specify in test context

                  case 102:
                    _context128.next = 95;
                    break;

                  case 104:
                    _context128.next = 109;
                    break;

                  case 106:
                    _context128.prev = 106;
                    _context128.t5 = _context128["catch"](93);

                    _iterator144.e(_context128.t5);

                  case 109:
                    _context128.prev = 109;

                    _iterator144.f();

                    return _context128.finish(109);

                  case 112:
                    _context128.next = 65;
                    break;

                  case 114:
                    _context128.next = 119;
                    break;

                  case 116:
                    _context128.prev = 116;
                    _context128.t6 = _context128["catch"](63);

                    _iterator142.e(_context128.t6);

                  case 119:
                    _context128.prev = 119;

                    _iterator142.f();

                    return _context128.finish(119);

                  case 122:
                    // test updated txs
                    testGetTxsStructure(updatedTxs, config);
                    _context128.next = 125;
                    return testOutInPairs(that.wallet, updatedTxs, config, false);

                  case 125:
                    // update confirmations in order to exit loop
                    numConfirmations = fetchedTxs[0].getNumConfirmations();
                    _context128.next = 47;
                    break;

                  case 128:
                    _context128.next = 133;
                    break;

                  case 130:
                    _context128.prev = 130;
                    _context128.t7 = _context128["catch"](6);
                    err = _context128.t7;

                  case 133:
                    _context128.prev = 133;
                    _context128.next = 136;
                    return that.wallet.stopMining();

                  case 136:
                    _context128.next = 140;
                    break;

                  case 138:
                    _context128.prev = 138;
                    _context128.t8 = _context128["catch"](133);

                  case 140:
                    if (!err) {
                      _context128.next = 142;
                      break;
                    }

                    throw err;

                  case 142:
                  case "end":
                    return _context128.stop();
                }
              }
            }, _callee126, null, [[6, 130], [19, 31, 34, 37], [37, 42], [63, 116, 119, 122], [72, 86, 89, 92], [93, 106, 109, 112], [133, 138]]);
          }));
          return _testSendAndUpdateTxs.apply(this, arguments);
        }

        function testOutInPairs(_x21, _x22, _x23, _x24) {
          return _testOutInPairs.apply(this, arguments);
        }

        function _testOutInPairs() {
          _testOutInPairs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee127(wallet, txs, config, isSendResponse) {
            var txOut, _iterator145, _step145, tx, _txOut, txIn, _iterator146, _step146, tx2;

            return _regenerator["default"].wrap(function _callee127$(_context129) {
              while (1) {
                switch (_context129.prev = _context129.next) {
                  case 0:
                    // for each out tx
                    _iterator145 = _createForOfIteratorHelper(txs);
                    _context129.prev = 1;

                    _iterator145.s();

                  case 3:
                    if ((_step145 = _iterator145.n()).done) {
                      _context129.next = 37;
                      break;
                    }

                    tx = _step145.value;
                    _context129.next = 7;
                    return testUnlockTx(that.wallet, tx, config, isSendResponse);

                  case 7:
                    if (tx.getOutgoingTransfer()) {
                      _context129.next = 9;
                      break;
                    }

                    return _context129.abrupt("continue", 35);

                  case 9:
                    _txOut = tx; // find incoming counterpart

                    txIn = void 0;
                    _iterator146 = _createForOfIteratorHelper(txs);
                    _context129.prev = 12;

                    _iterator146.s();

                  case 14:
                    if ((_step146 = _iterator146.n()).done) {
                      _context129.next = 21;
                      break;
                    }

                    tx2 = _step146.value;

                    if (!(tx2.getIncomingTransfers() && tx.getHash() === tx2.getHash())) {
                      _context129.next = 19;
                      break;
                    }

                    txIn = tx2;
                    return _context129.abrupt("break", 21);

                  case 19:
                    _context129.next = 14;
                    break;

                  case 21:
                    _context129.next = 26;
                    break;

                  case 23:
                    _context129.prev = 23;
                    _context129.t0 = _context129["catch"](12);

                    _iterator146.e(_context129.t0);

                  case 26:
                    _context129.prev = 26;

                    _iterator146.f();

                    return _context129.finish(26);

                  case 29:
                    if (txIn) {
                      _context129.next = 33;
                      break;
                    }

                    console.log("WARNING: outgoing tx " + _txOut.getHash() + " missing incoming counterpart (issue #4500)");
                    _context129.next = 35;
                    break;

                  case 33:
                    _context129.next = 35;
                    return testOutInPair(_txOut, txIn);

                  case 35:
                    _context129.next = 3;
                    break;

                  case 37:
                    _context129.next = 42;
                    break;

                  case 39:
                    _context129.prev = 39;
                    _context129.t1 = _context129["catch"](1);

                    _iterator145.e(_context129.t1);

                  case 42:
                    _context129.prev = 42;

                    _iterator145.f();

                    return _context129.finish(42);

                  case 45:
                  case "end":
                    return _context129.stop();
                }
              }
            }, _callee127, null, [[1, 39, 42, 45], [12, 23, 26, 29]]);
          }));
          return _testOutInPairs.apply(this, arguments);
        }

        function testOutInPair(_x25, _x26) {
          return _testOutInPair.apply(this, arguments);
        }

        function _testOutInPair() {
          _testOutInPair = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee128(txOut, txIn) {
            return _regenerator["default"].wrap(function _callee128$(_context130) {
              while (1) {
                switch (_context130.prev = _context130.next) {
                  case 0:
                    _assert["default"].equal(txIn.isConfirmed(), txOut.isConfirmed());

                    _assert["default"].equal(_index.GenUtils.compareBigInt(txOut.getOutgoingAmount(), txIn.getIncomingAmount()), 0);

                  case 2:
                  case "end":
                    return _context130.stop();
                }
              }
            }, _callee128);
          }));
          return _testOutInPair.apply(this, arguments);
        }

        function testUnlockTx(_x27, _x28, _x29, _x30) {
          return _testUnlockTx.apply(this, arguments);
        } //  ----------------------------- TEST RELAYS ---------------------------


        function _testUnlockTx() {
          _testUnlockTx = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee129(wallet, tx, config, isSendResponse) {
            return _regenerator["default"].wrap(function _callee129$(_context131) {
              while (1) {
                switch (_context131.prev = _context131.next) {
                  case 0:
                    _context131.prev = 0;
                    _context131.next = 3;
                    return that._testTxWallet(tx, {
                      wallet: that.wallet,
                      config: config,
                      isSendResponse: isSendResponse
                    });

                  case 3:
                    _context131.next = 9;
                    break;

                  case 5:
                    _context131.prev = 5;
                    _context131.t0 = _context131["catch"](0);
                    console.log(tx.toString());
                    throw _context131.t0;

                  case 9:
                  case "end":
                    return _context131.stop();
                }
              }
            }, _callee129, null, [[0, 5]]);
          }));
          return _testUnlockTx.apply(this, arguments);
        }

        if (testConfig.testNonRelays) it("Validates inputs when sending funds", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee94() {
          return _regenerator["default"].wrap(function _callee94$(_context95) {
            while (1) {
              switch (_context95.prev = _context95.next) {
                case 0:
                  _context95.prev = 0;
                  _context95.next = 3;
                  return that.wallet.createTx({
                    address: "my invalid address",
                    accountIndex: 0,
                    amount: _TestUtils["default"].MAX_FEE
                  });

                case 3:
                  throw new Error("fail");

                case 6:
                  _context95.prev = 6;
                  _context95.t0 = _context95["catch"](0);

                  _assert["default"].equal(_context95.t0.message, "Invalid destination address");

                case 9:
                  _context95.prev = 9;
                  _context95.t1 = that.wallet;
                  _context95.next = 13;
                  return that.wallet.getPrimaryAddress();

                case 13:
                  _context95.t2 = _context95.sent;
                  _context95.t3 = {
                    address: _context95.t2,
                    accountIndex: 0,
                    amount: "my invalid amount"
                  };
                  _context95.next = 17;
                  return _context95.t1.createTx.call(_context95.t1, _context95.t3);

                case 17:
                  throw new Error("fail");

                case 20:
                  _context95.prev = 20;
                  _context95.t4 = _context95["catch"](9);

                  _assert["default"].equal(_context95.t4.message, "Invalid destination amount: my invalid amount");

                case 23:
                  _context95.prev = 23;
                  _context95.t5 = that.wallet;
                  _context95.next = 27;
                  return that.wallet.getPrimaryAddress();

                case 27:
                  _context95.t6 = _context95.sent;
                  _context95.t7 = {
                    address: _context95.t6,
                    accountIndex: 0,
                    amount: 12345
                  };
                  _context95.next = 31;
                  return _context95.t5.createTx.call(_context95.t5, _context95.t7);

                case 31:
                  throw new Error("fail");

                case 34:
                  _context95.prev = 34;
                  _context95.t8 = _context95["catch"](23);

                  _assert["default"].equal(_context95.t8.message, "Destination amount must be BigInt or string");

                case 37:
                case "end":
                  return _context95.stop();
              }
            }
          }, _callee94, null, [[0, 6], [9, 20], [23, 34]]);
        })));
        if (testConfig.testRelays) it("Can send to self", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee95() {
          var err, recipient, amount, balance1, unlockedBalance1, tx, balance2, unlockedBalance2, expectedBalance;
          return _regenerator["default"].wrap(function _callee95$(_context96) {
            while (1) {
              switch (_context96.prev = _context96.next) {
                case 0:
                  _context96.prev = 0;
                  _context96.next = 3;
                  return _TestUtils["default"].WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);

                case 3:
                  amount = _TestUtils["default"].MAX_FEE * BigInt("3");
                  _context96.next = 6;
                  return _TestUtils["default"].WALLET_TX_TRACKER.waitForUnlockedBalance(that.wallet, 0, undefined, amount);

                case 6:
                  _context96.next = 8;
                  return that.wallet.getBalance();

                case 8:
                  balance1 = _context96.sent;
                  _context96.next = 11;
                  return that.wallet.getUnlockedBalance();

                case 11:
                  unlockedBalance1 = _context96.sent;
                  _context96.t0 = that.wallet;
                  _context96.next = 15;
                  return that.wallet.getIntegratedAddress();

                case 15:
                  _context96.t1 = _context96.sent.getIntegratedAddress();
                  _context96.t2 = amount;
                  _context96.t3 = {
                    accountIndex: 0,
                    address: _context96.t1,
                    amount: _context96.t2,
                    relay: true
                  };
                  _context96.next = 20;
                  return _context96.t0.createTx.call(_context96.t0, _context96.t3);

                case 20:
                  tx = _context96.sent;
                  _context96.next = 23;
                  return that.wallet.getBalance();

                case 23:
                  balance2 = _context96.sent;
                  _context96.next = 26;
                  return that.wallet.getUnlockedBalance();

                case 26:
                  unlockedBalance2 = _context96.sent;
                  (0, _assert["default"])(_index.GenUtils.compareBigInt(unlockedBalance2, unlockedBalance1) < 0); // unlocked balance should decrease

                  expectedBalance = balance1 - tx.getFee();

                  _assert["default"].equal(expectedBalance.toString(), balance2.toString(), "Balance after send was not balance before - net tx amount - fee (5 - 1 != 4 test)");

                  _context96.next = 35;
                  break;

                case 32:
                  _context96.prev = 32;
                  _context96.t4 = _context96["catch"](0);
                  err = _context96.t4;

                case 35:
                  _context96.t5 = recipient;

                  if (!_context96.t5) {
                    _context96.next = 40;
                    break;
                  }

                  _context96.next = 39;
                  return recipient.isClosed();

                case 39:
                  _context96.t5 = !_context96.sent;

                case 40:
                  if (!_context96.t5) {
                    _context96.next = 43;
                    break;
                  }

                  _context96.next = 43;
                  return that.closeWallet(recipient);

                case 43:
                  if (!err) {
                    _context96.next = 45;
                    break;
                  }

                  throw err;

                case 45:
                case "end":
                  return _context96.stop();
              }
            }
          }, _callee95, null, [[0, 32]]);
        })));
        if (testConfig.testRelays) it("Can send to an external address", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee96() {
          var err, recipient, amount, balance1, unlockedBalance1, tx, balance2, unlockedBalance2, expectedBalance;
          return _regenerator["default"].wrap(function _callee96$(_context97) {
            while (1) {
              switch (_context97.prev = _context97.next) {
                case 0:
                  _context97.prev = 0;
                  _context97.next = 3;
                  return _TestUtils["default"].WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);

                case 3:
                  amount = _TestUtils["default"].MAX_FEE * BigInt("3");
                  _context97.next = 6;
                  return _TestUtils["default"].WALLET_TX_TRACKER.waitForUnlockedBalance(that.wallet, 0, undefined, amount);

                case 6:
                  _context97.next = 8;
                  return that.createWallet(new _index.MoneroWalletConfig());

                case 8:
                  recipient = _context97.sent;
                  _context97.next = 11;
                  return that.wallet.getBalance();

                case 11:
                  balance1 = _context97.sent;
                  _context97.next = 14;
                  return that.wallet.getUnlockedBalance();

                case 14:
                  unlockedBalance1 = _context97.sent;
                  _context97.t0 = that.wallet;
                  _context97.next = 18;
                  return recipient.getPrimaryAddress();

                case 18:
                  _context97.t1 = _context97.sent;
                  _context97.t2 = amount;
                  _context97.t3 = {
                    accountIndex: 0,
                    address: _context97.t1,
                    amount: _context97.t2,
                    relay: true
                  };
                  _context97.next = 23;
                  return _context97.t0.createTx.call(_context97.t0, _context97.t3);

                case 23:
                  tx = _context97.sent;
                  _context97.next = 26;
                  return that.wallet.getBalance();

                case 26:
                  balance2 = _context97.sent;
                  _context97.next = 29;
                  return that.wallet.getUnlockedBalance();

                case 29:
                  unlockedBalance2 = _context97.sent;
                  (0, _assert["default"])(_index.GenUtils.compareBigInt(unlockedBalance2, unlockedBalance1) < 0); // unlocked balance should decrease

                  expectedBalance = balance1 - tx.getOutgoingAmount() - tx.getFee();

                  _assert["default"].equal(expectedBalance.toString(), balance2.toString(), "Balance after send was not balance before - net tx amount - fee (5 - 1 != 4 test)"); // test recipient balance after


                  _context97.next = 35;
                  return recipient.sync();

                case 35:
                  _context97.t4 = _assert["default"];
                  _context97.next = 38;
                  return that.wallet.getTxs({
                    isConfirmed: false
                  });

                case 38:
                  _context97.t5 = _context97.sent.length;
                  _context97.t6 = _context97.t5 > 0;
                  (0, _context97.t4)(_context97.t6);
                  _context97.t7 = _assert["default"];
                  _context97.t8 = amount.toString();
                  _context97.next = 45;
                  return recipient.getBalance();

                case 45:
                  _context97.t9 = _context97.sent.toString();

                  _context97.t7.equal.call(_context97.t7, _context97.t8, _context97.t9);

                  _context97.next = 52;
                  break;

                case 49:
                  _context97.prev = 49;
                  _context97.t10 = _context97["catch"](0);
                  err = _context97.t10;

                case 52:
                  _context97.t11 = recipient;

                  if (!_context97.t11) {
                    _context97.next = 57;
                    break;
                  }

                  _context97.next = 56;
                  return recipient.isClosed();

                case 56:
                  _context97.t11 = !_context97.sent;

                case 57:
                  if (!_context97.t11) {
                    _context97.next = 60;
                    break;
                  }

                  _context97.next = 60;
                  return that.closeWallet(recipient);

                case 60:
                  if (!err) {
                    _context97.next = 62;
                    break;
                  }

                  throw err;

                case 62:
                case "end":
                  return _context97.stop();
              }
            }
          }, _callee96, null, [[0, 49]]);
        })));
        if (testConfig.testRelays) it("Can send from multiple subaddresses in a single transaction", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee97() {
          return _regenerator["default"].wrap(function _callee97$(_context98) {
            while (1) {
              switch (_context98.prev = _context98.next) {
                case 0:
                  _context98.next = 2;
                  return testSendFromMultiple();

                case 2:
                case "end":
                  return _context98.stop();
              }
            }
          }, _callee97);
        })));
        if (testConfig.testRelays) it("Can send from multiple subaddresses in split transactions", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee98() {
          return _regenerator["default"].wrap(function _callee98$(_context99) {
            while (1) {
              switch (_context99.prev = _context99.next) {
                case 0:
                  _context99.next = 2;
                  return testSendFromMultiple(new _index.MoneroTxConfig().setCanSplit(true));

                case 2:
                case "end":
                  return _context99.stop();
              }
            }
          }, _callee98);
        })));

        function testSendFromMultiple(_x31) {
          return _testSendFromMultiple.apply(this, arguments);
        }

        function _testSendFromMultiple() {
          _testSendFromMultiple = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee130(config) {
            var NUM_SUBADDRESSES, accounts, srcAccount, unlockedSubaddresses, hasBalance, _iterator147, _step147, account, numSubaddressBalances, _iterator150, _step150, subaddress, fromSubaddressIndices, i, sendAmount, _i18, _fromSubaddressIndice, fromSubaddressIdx, address, configCopy, txs, _iterator148, _step148, tx, accountsAfter, srcUnlockedBalanceDecreased, _i19, j, subaddressBefore, subaddressAfter, outgoingSum, _i20, _txs3, _tx23, destinationSum, _iterator149, _step149, destination;

            return _regenerator["default"].wrap(function _callee130$(_context132) {
              while (1) {
                switch (_context132.prev = _context132.next) {
                  case 0:
                    _context132.next = 2;
                    return _TestUtils["default"].WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);

                  case 2:
                    if (!config) config = new _index.MoneroTxConfig();
                    NUM_SUBADDRESSES = 2; // number of subaddresses to send from
                    // get first account with (NUM_SUBADDRESSES + 1) subaddresses with unlocked balances

                    _context132.next = 6;
                    return that.wallet.getAccounts(true);

                  case 6:
                    accounts = _context132.sent;
                    (0, _assert["default"])(accounts.length >= 2, "This test requires at least 2 accounts; run send-to-multiple tests");
                    unlockedSubaddresses = [];
                    hasBalance = false;
                    _iterator147 = _createForOfIteratorHelper(accounts);
                    _context132.prev = 11;

                    _iterator147.s();

                  case 13:
                    if ((_step147 = _iterator147.n()).done) {
                      _context132.next = 25;
                      break;
                    }

                    account = _step147.value;
                    unlockedSubaddresses = [];
                    numSubaddressBalances = 0;
                    _iterator150 = _createForOfIteratorHelper(account.getSubaddresses());

                    try {
                      for (_iterator150.s(); !(_step150 = _iterator150.n()).done;) {
                        subaddress = _step150.value;
                        if (_index.GenUtils.compareBigInt(subaddress.getBalance(), _TestUtils["default"].MAX_FEE) > 0) numSubaddressBalances++;
                        if (_index.GenUtils.compareBigInt(subaddress.getUnlockedBalance(), _TestUtils["default"].MAX_FEE) > 0) unlockedSubaddresses.push(subaddress);
                      }
                    } catch (err) {
                      _iterator150.e(err);
                    } finally {
                      _iterator150.f();
                    }

                    if (numSubaddressBalances >= NUM_SUBADDRESSES + 1) hasBalance = true;

                    if (!(unlockedSubaddresses.length >= NUM_SUBADDRESSES + 1)) {
                      _context132.next = 23;
                      break;
                    }

                    srcAccount = account;
                    return _context132.abrupt("break", 25);

                  case 23:
                    _context132.next = 13;
                    break;

                  case 25:
                    _context132.next = 30;
                    break;

                  case 27:
                    _context132.prev = 27;
                    _context132.t0 = _context132["catch"](11);

                    _iterator147.e(_context132.t0);

                  case 30:
                    _context132.prev = 30;

                    _iterator147.f();

                    return _context132.finish(30);

                  case 33:
                    (0, _assert["default"])(hasBalance, "Wallet does not have account with " + (NUM_SUBADDRESSES + 1) + " subaddresses with balances; run send-to-multiple tests");
                    (0, _assert["default"])(unlockedSubaddresses.length >= NUM_SUBADDRESSES + 1, "Wallet is waiting on unlocked funds"); // determine the indices of the first two subaddresses with unlocked balances

                    fromSubaddressIndices = [];

                    for (i = 0; i < NUM_SUBADDRESSES; i++) {
                      fromSubaddressIndices.push(unlockedSubaddresses[i].getIndex());
                    } // determine the amount to send


                    sendAmount = BigInt(0);

                    for (_i18 = 0, _fromSubaddressIndice = fromSubaddressIndices; _i18 < _fromSubaddressIndice.length; _i18++) {
                      fromSubaddressIdx = _fromSubaddressIndice[_i18];
                      sendAmount = sendAmount + srcAccount.getSubaddresses()[fromSubaddressIdx].getUnlockedBalance();
                    }

                    sendAmount = sendAmount / BigInt(SEND_DIVISOR); // send from the first subaddresses with unlocked balances

                    _context132.next = 42;
                    return that.wallet.getPrimaryAddress();

                  case 42:
                    address = _context132.sent;
                    config.setDestinations([new _index.MoneroDestination(address, sendAmount)]);
                    config.setAccountIndex(srcAccount.getIndex());
                    config.setSubaddressIndices(fromSubaddressIndices);
                    config.setRelay(true);
                    configCopy = config.copy();
                    txs = [];

                    if (!(config.getCanSplit() !== false)) {
                      _context132.next = 58;
                      break;
                    }

                    _context132.t1 = _createForOfIteratorHelper;
                    _context132.next = 53;
                    return that.wallet.createTxs(config);

                  case 53:
                    _context132.t2 = _context132.sent;
                    _iterator148 = (0, _context132.t1)(_context132.t2);

                    try {
                      for (_iterator148.s(); !(_step148 = _iterator148.n()).done;) {
                        tx = _step148.value;
                        txs.push(tx);
                      }
                    } catch (err) {
                      _iterator148.e(err);
                    } finally {
                      _iterator148.f();
                    }

                    _context132.next = 63;
                    break;

                  case 58:
                    _context132.t3 = txs;
                    _context132.next = 61;
                    return that.wallet.createTx(config);

                  case 61:
                    _context132.t4 = _context132.sent;

                    _context132.t3.push.call(_context132.t3, _context132.t4);

                  case 63:
                    if (config.getCanSplit() === false) _assert["default"].equal(txs.length, 1); // must have exactly one tx if no split
                    // test that config is unchanged

                    (0, _assert["default"])(configCopy !== config);

                    _assert["default"].deepEqual(config, configCopy); // test that balances of intended subaddresses decreased


                    _context132.next = 68;
                    return that.wallet.getAccounts(true);

                  case 68:
                    accountsAfter = _context132.sent;

                    _assert["default"].equal(accountsAfter.length, accounts.length);

                    srcUnlockedBalanceDecreased = false;

                    for (_i19 = 0; _i19 < accounts.length; _i19++) {
                      _assert["default"].equal(accountsAfter[_i19].getSubaddresses().length, accounts[_i19].getSubaddresses().length);

                      for (j = 0; j < accounts[_i19].getSubaddresses().length; j++) {
                        subaddressBefore = accounts[_i19].getSubaddresses()[j];
                        subaddressAfter = accountsAfter[_i19].getSubaddresses()[j];

                        if (_i19 === srcAccount.getIndex() && fromSubaddressIndices.includes(j)) {
                          if (_index.GenUtils.compareBigInt(subaddressAfter.getUnlockedBalance(), subaddressBefore.getUnlockedBalance()) < 0) srcUnlockedBalanceDecreased = true;
                        } else {
                          (0, _assert["default"])(_index.GenUtils.compareBigInt(subaddressAfter.getUnlockedBalance(), subaddressBefore.getUnlockedBalance()) === 0, "Subaddress [" + _i19 + "," + j + "] unlocked balance should not have changed");
                        }
                      }
                    }

                    (0, _assert["default"])(srcUnlockedBalanceDecreased, "Subaddress unlocked balances should have decreased"); // test each transaction

                    (0, _assert["default"])(txs.length > 0);
                    outgoingSum = BigInt(0);
                    _i20 = 0, _txs3 = txs;

                  case 76:
                    if (!(_i20 < _txs3.length)) {
                      _context132.next = 106;
                      break;
                    }

                    _tx23 = _txs3[_i20];
                    _context132.next = 80;
                    return that._testTxWallet(_tx23, {
                      wallet: that.wallet,
                      config: config,
                      isSendResponse: true
                    });

                  case 80:
                    outgoingSum = outgoingSum + _tx23.getOutgoingAmount();

                    if (!(_tx23.getOutgoingTransfer() !== undefined && _tx23.getOutgoingTransfer().getDestinations())) {
                      _context132.next = 103;
                      break;
                    }

                    destinationSum = BigInt(0);
                    _iterator149 = _createForOfIteratorHelper(_tx23.getOutgoingTransfer().getDestinations());
                    _context132.prev = 84;

                    _iterator149.s();

                  case 86:
                    if ((_step149 = _iterator149.n()).done) {
                      _context132.next = 94;
                      break;
                    }

                    destination = _step149.value;
                    _context132.next = 90;
                    return testDestination(destination);

                  case 90:
                    _assert["default"].equal(destination.getAddress(), address);

                    destinationSum = destinationSum + destination.getAmount();

                  case 92:
                    _context132.next = 86;
                    break;

                  case 94:
                    _context132.next = 99;
                    break;

                  case 96:
                    _context132.prev = 96;
                    _context132.t5 = _context132["catch"](84);

                    _iterator149.e(_context132.t5);

                  case 99:
                    _context132.prev = 99;

                    _iterator149.f();

                    return _context132.finish(99);

                  case 102:
                    (0, _assert["default"])(_index.GenUtils.compareBigInt(_tx23.getOutgoingAmount(), destinationSum) === 0); // assert that transfers sum up to tx amount

                  case 103:
                    _i20++;
                    _context132.next = 76;
                    break;

                  case 106:
                    if (!(Math.abs(sendAmount - outgoingSum.toJSValue()) > SEND_MAX_DIFF)) {
                      _context132.next = 108;
                      break;
                    }

                    throw new Error("Tx amounts are too different: " + sendAmount + " - " + outgoingSum + " = " + sendAmount - outgoingSum);

                  case 108:
                  case "end":
                    return _context132.stop();
                }
              }
            }, _callee130, null, [[11, 27, 30, 33], [84, 96, 99, 102]]);
          }));
          return _testSendFromMultiple.apply(this, arguments);
        }

        if (testConfig.testRelays) it("Can send to an address in a single transaction.", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee99() {
          return _regenerator["default"].wrap(function _callee99$(_context100) {
            while (1) {
              switch (_context100.prev = _context100.next) {
                case 0:
                  _context100.next = 2;
                  return testSendToSingle(new _index.MoneroTxConfig().setCanSplit(false));

                case 2:
                case "end":
                  return _context100.stop();
              }
            }
          }, _callee99);
        }))); // NOTE: this test will be invalid when payment ids are fully removed

        if (testConfig.testRelays) it("Can send to an address in a single transaction with a payment id", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee100() {
          var integratedAddress, paymentId;
          return _regenerator["default"].wrap(function _callee100$(_context101) {
            while (1) {
              switch (_context101.prev = _context101.next) {
                case 0:
                  _context101.next = 2;
                  return that.wallet.getIntegratedAddress();

                case 2:
                  integratedAddress = _context101.sent;
                  paymentId = integratedAddress.getPaymentId();
                  _context101.prev = 4;
                  _context101.next = 7;
                  return testSendToSingle(new _index.MoneroTxConfig().setCanSplit(false).setPaymentId(paymentId + paymentId + paymentId + paymentId));

                case 7:
                  throw new Error("fail");

                case 10:
                  _context101.prev = 10;
                  _context101.t0 = _context101["catch"](4);

                  _assert["default"].equal(_context101.t0.message, "Standalone payment IDs are obsolete. Use subaddresses or integrated addresses instead");

                case 13:
                case "end":
                  return _context101.stop();
              }
            }
          }, _callee100, null, [[4, 10]]);
        })));
        if (testConfig.testRelays) it("Can send to an address with split transactions", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee101() {
          return _regenerator["default"].wrap(function _callee101$(_context102) {
            while (1) {
              switch (_context102.prev = _context102.next) {
                case 0:
                  _context102.next = 2;
                  return testSendToSingle(new _index.MoneroTxConfig().setCanSplit(true).setRelay(true));

                case 2:
                case "end":
                  return _context102.stop();
              }
            }
          }, _callee101);
        })));
        if (testConfig.testRelays) it("Can create then relay a transaction to send to a single address", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee102() {
          return _regenerator["default"].wrap(function _callee102$(_context103) {
            while (1) {
              switch (_context103.prev = _context103.next) {
                case 0:
                  _context103.next = 2;
                  return testSendToSingle(new _index.MoneroTxConfig().setCanSplit(false));

                case 2:
                case "end":
                  return _context103.stop();
              }
            }
          }, _callee102);
        })));
        if (testConfig.testRelays) it("Can create then relay split transactions to send to a single address", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee103() {
          return _regenerator["default"].wrap(function _callee103$(_context104) {
            while (1) {
              switch (_context104.prev = _context104.next) {
                case 0:
                  _context104.next = 2;
                  return testSendToSingle(new _index.MoneroTxConfig().setCanSplit(true));

                case 2:
                case "end":
                  return _context104.stop();
              }
            }
          }, _callee103);
        })));

        function testSendToSingle(_x32) {
          return _testSendToSingle.apply(this, arguments);
        }

        function _testSendToSingle() {
          _testSendToSingle = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee131(config) {
            var sufficientBalance, fromAccount, fromSubaddress, accounts, _iterator151, _step151, account, subaddresses, i, balanceBefore, unlockedBalanceBefore, sendAmount, address, txs, reqCopy, _iterator152, _step152, tx, _iterator153, _step153, _tx25, _iterator154, _step154, txCreated, _iterator157, _step157, txPool, txHashes, txMetadatas, _iterator155, _step155, _tx24, _iterator156, _step156, txHash, subaddress, lockedTxs, _iterator158, _step158, lockedTx, _iterator159, _step159, _tx26, _iterator160, _step160, destination, found, _iterator161, _step161, _lockedTx;

            return _regenerator["default"].wrap(function _callee131$(_context133) {
              while (1) {
                switch (_context133.prev = _context133.next) {
                  case 0:
                    _context133.next = 2;
                    return _TestUtils["default"].WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);

                  case 2:
                    if (!config) config = new _index.MoneroTxConfig(); // find a non-primary subaddress to send from

                    sufficientBalance = false;
                    fromAccount = undefined;
                    fromSubaddress = undefined;
                    _context133.next = 8;
                    return that.wallet.getAccounts(true);

                  case 8:
                    accounts = _context133.sent;
                    _iterator151 = _createForOfIteratorHelper(accounts);
                    _context133.prev = 10;

                    _iterator151.s();

                  case 12:
                    if ((_step151 = _iterator151.n()).done) {
                      _context133.next = 29;
                      break;
                    }

                    account = _step151.value;
                    subaddresses = account.getSubaddresses();
                    i = 1;

                  case 16:
                    if (!(i < subaddresses.length)) {
                      _context133.next = 25;
                      break;
                    }

                    if (_index.GenUtils.compareBigInt(subaddresses[i].getBalance(), _TestUtils["default"].MAX_FEE) > 0) sufficientBalance = true;

                    if (!(_index.GenUtils.compareBigInt(subaddresses[i].getUnlockedBalance(), _TestUtils["default"].MAX_FEE) > 0)) {
                      _context133.next = 22;
                      break;
                    }

                    fromAccount = account;
                    fromSubaddress = subaddresses[i];
                    return _context133.abrupt("break", 25);

                  case 22:
                    i++;
                    _context133.next = 16;
                    break;

                  case 25:
                    if (!(fromAccount != undefined)) {
                      _context133.next = 27;
                      break;
                    }

                    return _context133.abrupt("break", 29);

                  case 27:
                    _context133.next = 12;
                    break;

                  case 29:
                    _context133.next = 34;
                    break;

                  case 31:
                    _context133.prev = 31;
                    _context133.t0 = _context133["catch"](10);

                    _iterator151.e(_context133.t0);

                  case 34:
                    _context133.prev = 34;

                    _iterator151.f();

                    return _context133.finish(34);

                  case 37:
                    (0, _assert["default"])(sufficientBalance, "No non-primary subaddress found with sufficient balance");
                    (0, _assert["default"])(fromSubaddress !== undefined, "Wallet is waiting on unlocked funds"); // get balance before send

                    balanceBefore = fromSubaddress.getBalance();
                    unlockedBalanceBefore = fromSubaddress.getUnlockedBalance(); // init tx config

                    sendAmount = unlockedBalanceBefore - _TestUtils["default"].MAX_FEE / BigInt(SEND_DIVISOR);
                    _context133.next = 44;
                    return that.wallet.getPrimaryAddress();

                  case 44:
                    address = _context133.sent;
                    txs = [];
                    config.setDestinations([new _index.MoneroDestination(address, sendAmount)]);
                    config.setAccountIndex(fromAccount.getIndex());
                    config.setSubaddressIndices([fromSubaddress.getIndex()]);
                    reqCopy = config.copy(); // send to self

                    if (!(config.getCanSplit() !== false)) {
                      _context133.next = 59;
                      break;
                    }

                    _context133.t1 = _createForOfIteratorHelper;
                    _context133.next = 54;
                    return that.wallet.createTxs(config);

                  case 54:
                    _context133.t2 = _context133.sent;
                    _iterator152 = (0, _context133.t1)(_context133.t2);

                    try {
                      for (_iterator152.s(); !(_step152 = _iterator152.n()).done;) {
                        tx = _step152.value;
                        txs.push(tx);
                      }
                    } catch (err) {
                      _iterator152.e(err);
                    } finally {
                      _iterator152.f();
                    }

                    _context133.next = 64;
                    break;

                  case 59:
                    _context133.t3 = txs;
                    _context133.next = 62;
                    return that.wallet.createTx(config);

                  case 62:
                    _context133.t4 = _context133.sent;

                    _context133.t3.push.call(_context133.t3, _context133.t4);

                  case 64:
                    if (config.getCanSplit() === false) _assert["default"].equal(txs.length, 1); // must have exactly one tx if no split
                    // test that config is unchanged

                    (0, _assert["default"])(reqCopy !== config);

                    _assert["default"].deepEqual(config, reqCopy); // test common tx set among txs


                    testCommonTxSets(txs, false, false, false); // handle non-relayed transaction

                    if (!(config.getRelay() !== true)) {
                      _context133.next = 125;
                      break;
                    }

                    // test transactions
                    _iterator153 = _createForOfIteratorHelper(txs);
                    _context133.prev = 70;

                    _iterator153.s();

                  case 72:
                    if ((_step153 = _iterator153.n()).done) {
                      _context133.next = 78;
                      break;
                    }

                    _tx25 = _step153.value;
                    _context133.next = 76;
                    return that._testTxWallet(_tx25, {
                      wallet: that.wallet,
                      config: config,
                      isSendResponse: true
                    });

                  case 76:
                    _context133.next = 72;
                    break;

                  case 78:
                    _context133.next = 83;
                    break;

                  case 80:
                    _context133.prev = 80;
                    _context133.t5 = _context133["catch"](70);

                    _iterator153.e(_context133.t5);

                  case 83:
                    _context133.prev = 83;

                    _iterator153.f();

                    return _context133.finish(83);

                  case 86:
                    // txs are not in the pool
                    _iterator154 = _createForOfIteratorHelper(txs);
                    _context133.prev = 87;

                    _iterator154.s();

                  case 89:
                    if ((_step154 = _iterator154.n()).done) {
                      _context133.next = 99;
                      break;
                    }

                    txCreated = _step154.value;
                    _context133.t6 = _createForOfIteratorHelper;
                    _context133.next = 94;
                    return that.daemon.getTxPool();

                  case 94:
                    _context133.t7 = _context133.sent;
                    _iterator157 = (0, _context133.t6)(_context133.t7);

                    try {
                      for (_iterator157.s(); !(_step157 = _iterator157.n()).done;) {
                        txPool = _step157.value;
                        (0, _assert["default"])(txPool.getHash() !== txCreated.getHash(), "Created tx should not be in the pool");
                      }
                    } catch (err) {
                      _iterator157.e(err);
                    } finally {
                      _iterator157.f();
                    }

                  case 97:
                    _context133.next = 89;
                    break;

                  case 99:
                    _context133.next = 104;
                    break;

                  case 101:
                    _context133.prev = 101;
                    _context133.t8 = _context133["catch"](87);

                    _iterator154.e(_context133.t8);

                  case 104:
                    _context133.prev = 104;

                    _iterator154.f();

                    return _context133.finish(104);

                  case 107:
                    if (!(config.getCanSplit() !== true)) {
                      _context133.next = 114;
                      break;
                    }

                    _context133.next = 110;
                    return that.wallet.relayTx(txs[0]);

                  case 110:
                    _context133.t9 = _context133.sent;
                    txHashes = [_context133.t9];
                    _context133.next = 120;
                    break;

                  case 114:
                    txMetadatas = [];
                    _iterator155 = _createForOfIteratorHelper(txs);

                    try {
                      for (_iterator155.s(); !(_step155 = _iterator155.n()).done;) {
                        _tx24 = _step155.value;
                        txMetadatas.push(_tx24.getMetadata());
                      }
                    } catch (err) {
                      _iterator155.e(err);
                    } finally {
                      _iterator155.f();
                    }

                    _context133.next = 119;
                    return that.wallet.relayTxs(txMetadatas);

                  case 119:
                    txHashes = _context133.sent;

                  case 120:
                    _iterator156 = _createForOfIteratorHelper(txHashes);

                    try {
                      for (_iterator156.s(); !(_step156 = _iterator156.n()).done;) {
                        txHash = _step156.value;
                        (0, _assert["default"])(typeof txHash === "string" && txHash.length === 64);
                      } // fetch txs for testing

                    } catch (err) {
                      _iterator156.e(err);
                    } finally {
                      _iterator156.f();
                    }

                    _context133.next = 124;
                    return that.wallet.getTxs({
                      hashes: txHashes
                    });

                  case 124:
                    txs = _context133.sent;

                  case 125:
                    _context133.next = 127;
                    return that.wallet.getSubaddress(fromAccount.getIndex(), fromSubaddress.getIndex());

                  case 127:
                    subaddress = _context133.sent;
                    (0, _assert["default"])(_index.GenUtils.compareBigInt(subaddress.getBalance(), balanceBefore) < 0);
                    (0, _assert["default"])(_index.GenUtils.compareBigInt(subaddress.getUnlockedBalance(), unlockedBalanceBefore) < 0); // query locked txs

                    _context133.next = 132;
                    return that._getAndTestTxs(that.wallet, new _index.MoneroTxQuery().setIsLocked(true), undefined, true);

                  case 132:
                    lockedTxs = _context133.sent;
                    _iterator158 = _createForOfIteratorHelper(lockedTxs);

                    try {
                      for (_iterator158.s(); !(_step158 = _iterator158.n()).done;) {
                        lockedTx = _step158.value;

                        _assert["default"].equal(lockedTx.isLocked(), true);
                      } // test transactions

                    } catch (err) {
                      _iterator158.e(err);
                    } finally {
                      _iterator158.f();
                    }

                    (0, _assert["default"])(txs.length > 0);
                    _iterator159 = _createForOfIteratorHelper(txs);
                    _context133.prev = 137;

                    _iterator159.s();

                  case 139:
                    if ((_step159 = _iterator159.n()).done) {
                      _context133.next = 191;
                      break;
                    }

                    _tx26 = _step159.value;
                    _context133.next = 143;
                    return that._testTxWallet(_tx26, {
                      wallet: that.wallet,
                      config: config,
                      isSendResponse: config.getRelay() === true
                    });

                  case 143:
                    _assert["default"].equal(_tx26.getOutgoingTransfer().getAccountIndex(), fromAccount.getIndex());

                    _assert["default"].equal(_tx26.getOutgoingTransfer().getSubaddressIndices().length, 1);

                    _assert["default"].equal(_tx26.getOutgoingTransfer().getSubaddressIndices()[0], fromSubaddress.getIndex());

                    (0, _assert["default"])(_index.GenUtils.compareBigInt(sendAmount, _tx26.getOutgoingAmount()) === 0);
                    if (config.getPaymentId()) _assert["default"].equal(config.getPaymentId(), _tx26.getPaymentId()); // test outgoing destinations

                    if (!(_tx26.getOutgoingTransfer() && _tx26.getOutgoingTransfer().getDestinations())) {
                      _context133.next = 169;
                      break;
                    }

                    _assert["default"].equal(_tx26.getOutgoingTransfer().getDestinations().length, 1);

                    _iterator160 = _createForOfIteratorHelper(_tx26.getOutgoingTransfer().getDestinations());
                    _context133.prev = 151;

                    _iterator160.s();

                  case 153:
                    if ((_step160 = _iterator160.n()).done) {
                      _context133.next = 161;
                      break;
                    }

                    destination = _step160.value;
                    _context133.next = 157;
                    return testDestination(destination);

                  case 157:
                    _assert["default"].equal(destination.getAddress(), address);

                    (0, _assert["default"])(_index.GenUtils.compareBigInt(sendAmount, destination.getAmount()) === 0);

                  case 159:
                    _context133.next = 153;
                    break;

                  case 161:
                    _context133.next = 166;
                    break;

                  case 163:
                    _context133.prev = 163;
                    _context133.t10 = _context133["catch"](151);

                    _iterator160.e(_context133.t10);

                  case 166:
                    _context133.prev = 166;

                    _iterator160.f();

                    return _context133.finish(166);

                  case 169:
                    // tx is among locked txs
                    found = false;
                    _iterator161 = _createForOfIteratorHelper(lockedTxs);
                    _context133.prev = 171;

                    _iterator161.s();

                  case 173:
                    if ((_step161 = _iterator161.n()).done) {
                      _context133.next = 180;
                      break;
                    }

                    _lockedTx = _step161.value;

                    if (!(_lockedTx.getHash() === _tx26.getHash())) {
                      _context133.next = 178;
                      break;
                    }

                    found = true;
                    return _context133.abrupt("break", 180);

                  case 178:
                    _context133.next = 173;
                    break;

                  case 180:
                    _context133.next = 185;
                    break;

                  case 182:
                    _context133.prev = 182;
                    _context133.t11 = _context133["catch"](171);

                    _iterator161.e(_context133.t11);

                  case 185:
                    _context133.prev = 185;

                    _iterator161.f();

                    return _context133.finish(185);

                  case 188:
                    (0, _assert["default"])(found, "Created txs should be among locked txs");

                  case 189:
                    _context133.next = 139;
                    break;

                  case 191:
                    _context133.next = 196;
                    break;

                  case 193:
                    _context133.prev = 193;
                    _context133.t12 = _context133["catch"](137);

                    _iterator159.e(_context133.t12);

                  case 196:
                    _context133.prev = 196;

                    _iterator159.f();

                    return _context133.finish(196);

                  case 199:
                    if (!(config.getRelay() != true)) {
                      _context133.next = 202;
                      break;
                    }

                    _context133.next = 202;
                    return _TestUtils["default"].WALLET_TX_TRACKER.reset();

                  case 202:
                  case "end":
                    return _context133.stop();
                }
              }
            }, _callee131, null, [[10, 31, 34, 37], [70, 80, 83, 86], [87, 101, 104, 107], [137, 193, 196, 199], [151, 163, 166, 169], [171, 182, 185, 188]]);
          }));
          return _testSendToSingle.apply(this, arguments);
        }

        if (testConfig.testRelays) it("Can send to multiple addresses in split transactions.", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee104() {
          return _regenerator["default"].wrap(function _callee104$(_context105) {
            while (1) {
              switch (_context105.prev = _context105.next) {
                case 0:
                  _context105.next = 2;
                  return testSendToMultiple(3, 15, true);

                case 2:
                case "end":
                  return _context105.stop();
              }
            }
          }, _callee104);
        })));
        if (testConfig.testRelays) it("Can send to multiple addresses in split transactions using a JavaScript object for configuration", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee105() {
          return _regenerator["default"].wrap(function _callee105$(_context106) {
            while (1) {
              switch (_context106.prev = _context106.next) {
                case 0:
                  _context106.next = 2;
                  return testSendToMultiple(3, 15, true, undefined, true);

                case 2:
                case "end":
                  return _context106.stop();
              }
            }
          }, _callee105);
        })));
        if (testConfig.testRelays) it("Can send dust to multiple addresses in split transactions", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee106() {
          var dustAmt;
          return _regenerator["default"].wrap(function _callee106$(_context107) {
            while (1) {
              switch (_context107.prev = _context107.next) {
                case 0:
                  _context107.next = 2;
                  return that.daemon.getFeeEstimate();

                case 2:
                  _context107.t0 = _context107.sent;
                  _context107.t1 = BigInt(2);
                  dustAmt = _context107.t0 / _context107.t1;
                  _context107.next = 7;
                  return testSendToMultiple(5, 3, true, dustAmt);

                case 7:
                case "end":
                  return _context107.stop();
              }
            }
          }, _callee106);
        })));
        /**
         * Sends funds from the first unlocked account to multiple accounts and subaddresses.
         * 
         * @param numAccounts is the number of accounts to receive funds
         * @param numSubaddressesPerAccount is the number of subaddresses per account to receive funds
         * @param canSplit specifies if the operation can be split into multiple transactions
         * @param sendAmountPerSubaddress is the amount to send to each subaddress (optional, computed if not given)
         * @param useJsConfig specifies if the api should be invoked with a JS object instead of a MoneroTxConfig
         */

        function testSendToMultiple(_x33, _x34, _x35, _x36, _x37) {
          return _testSendToMultiple.apply(this, arguments);
        }

        function _testSendToMultiple() {
          _testSendToMultiple = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee132(numAccounts, numSubaddressesPerAccount, canSplit, sendAmountPerSubaddress, useJsConfig) {
            var minAccountAmount, totalSubaddresses, srcAccount, hasBalance, _iterator162, _step162, _account4, balance, unlockedBalance, sendAmount, accounts, i, destinationAddresses, _i21, subaddresses, j, _j, config, _i22, configCopy, jsConfig, _i23, txs, _iterator163, _step163, tx, account, outgoingSum, _i24, _txs4, _tx27, destinationSum, _iterator164, _step164, destination;

            return _regenerator["default"].wrap(function _callee132$(_context134) {
              while (1) {
                switch (_context134.prev = _context134.next) {
                  case 0:
                    _context134.next = 2;
                    return _TestUtils["default"].WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);

                  case 2:
                    totalSubaddresses = numAccounts * numSubaddressesPerAccount;
                    if (sendAmountPerSubaddress !== undefined) minAccountAmount = BigInt(totalSubaddresses) * sendAmountPerSubaddress + _TestUtils["default"].MAX_FEE; // min account amount must cover the total amount being sent plus the tx fee = numAddresses * (amtPerSubaddress + fee)
                    else minAccountAmount = _TestUtils["default"].MAX_FEE * BigInt(totalSubaddresses) * BigInt(SEND_DIVISOR) + _TestUtils["default"].MAX_FEE; // account balance must be more than fee * numAddresses * divisor + fee so each destination amount is at least a fee's worth (so dust is not sent)
                    // send funds from first account with sufficient unlocked funds

                    hasBalance = false;
                    _context134.t0 = _createForOfIteratorHelper;
                    _context134.next = 8;
                    return that.wallet.getAccounts();

                  case 8:
                    _context134.t1 = _context134.sent;
                    _iterator162 = (0, _context134.t0)(_context134.t1);
                    _context134.prev = 10;

                    _iterator162.s();

                  case 12:
                    if ((_step162 = _iterator162.n()).done) {
                      _context134.next = 20;
                      break;
                    }

                    _account4 = _step162.value;
                    if (_index.GenUtils.compareBigInt(_account4.getBalance(), minAccountAmount) > 0) hasBalance = true;

                    if (!(_index.GenUtils.compareBigInt(_account4.getUnlockedBalance(), minAccountAmount) > 0)) {
                      _context134.next = 18;
                      break;
                    }

                    srcAccount = _account4;
                    return _context134.abrupt("break", 20);

                  case 18:
                    _context134.next = 12;
                    break;

                  case 20:
                    _context134.next = 25;
                    break;

                  case 22:
                    _context134.prev = 22;
                    _context134.t2 = _context134["catch"](10);

                    _iterator162.e(_context134.t2);

                  case 25:
                    _context134.prev = 25;

                    _iterator162.f();

                    return _context134.finish(25);

                  case 28:
                    (0, _assert["default"])(hasBalance, "Wallet does not have enough balance; load '" + _TestUtils["default"].WALLET_NAME + "' with XMR in order to test sending");
                    (0, _assert["default"])(srcAccount, "Wallet is waiting on unlocked funds");
                    balance = srcAccount.getBalance();
                    unlockedBalance = srcAccount.getUnlockedBalance(); // get amount to send total and per subaddress

                    if (sendAmountPerSubaddress === undefined) {
                      sendAmount = _TestUtils["default"].MAX_FEE * BigInt("5") * BigInt(totalSubaddresses);
                      sendAmountPerSubaddress = sendAmount / BigInt(totalSubaddresses);
                    } else {
                      sendAmount = sendAmountPerSubaddress * BigInt(totalSubaddresses);
                    } // create minimum number of accounts


                    _context134.next = 35;
                    return that.wallet.getAccounts();

                  case 35:
                    accounts = _context134.sent;
                    i = 0;

                  case 37:
                    if (!(i < numAccounts - accounts.length)) {
                      _context134.next = 43;
                      break;
                    }

                    _context134.next = 40;
                    return that.wallet.createAccount();

                  case 40:
                    i++;
                    _context134.next = 37;
                    break;

                  case 43:
                    // create minimum number of subaddresses per account and collect destination addresses
                    destinationAddresses = [];
                    _i21 = 0;

                  case 45:
                    if (!(_i21 < numAccounts)) {
                      _context134.next = 64;
                      break;
                    }

                    _context134.next = 48;
                    return that.wallet.getSubaddresses(_i21);

                  case 48:
                    subaddresses = _context134.sent;
                    j = 0;

                  case 50:
                    if (!(j < numSubaddressesPerAccount - subaddresses.length)) {
                      _context134.next = 56;
                      break;
                    }

                    _context134.next = 53;
                    return that.wallet.createSubaddress(_i21);

                  case 53:
                    j++;
                    _context134.next = 50;
                    break;

                  case 56:
                    _context134.next = 58;
                    return that.wallet.getSubaddresses(_i21);

                  case 58:
                    subaddresses = _context134.sent;
                    (0, _assert["default"])(subaddresses.length >= numSubaddressesPerAccount);

                    for (_j = 0; _j < numSubaddressesPerAccount; _j++) {
                      destinationAddresses.push(subaddresses[_j].getAddress());
                    }

                  case 61:
                    _i21++;
                    _context134.next = 45;
                    break;

                  case 64:
                    // build tx config using MoneroTxConfig
                    config = new _index.MoneroTxConfig();
                    config.setAccountIndex(srcAccount.getIndex());
                    config.setDestinations([]);
                    config.setCanSplit(canSplit);
                    config.setPriority(_index.MoneroTxPriority.NORMAL);
                    config.setRelay(true);

                    for (_i22 = 0; _i22 < destinationAddresses.length; _i22++) {
                      config.getDestinations().push(new _index.MoneroDestination(destinationAddresses[_i22], sendAmountPerSubaddress));
                    }

                    configCopy = config.copy(); // build tx config with JS object

                    if (useJsConfig) {
                      jsConfig = {};
                      jsConfig.ringSize = _index.MoneroUtils.RING_SIZE;
                      jsConfig.accountIndex = srcAccount.getIndex();
                      jsConfig.relay = true;
                      jsConfig.destinations = [];

                      for (_i23 = 0; _i23 < destinationAddresses.length; _i23++) {
                        jsConfig.destinations.push({
                          address: destinationAddresses[_i23],
                          amount: sendAmountPerSubaddress
                        });
                      }
                    } // send tx(s) with config xor js object


                    txs = [];

                    if (!canSplit) {
                      _context134.next = 83;
                      break;
                    }

                    _context134.t3 = _createForOfIteratorHelper;
                    _context134.next = 78;
                    return that.wallet.createTxs(useJsConfig ? jsConfig : config);

                  case 78:
                    _context134.t4 = _context134.sent;
                    _iterator163 = (0, _context134.t3)(_context134.t4);

                    try {
                      for (_iterator163.s(); !(_step163 = _iterator163.n()).done;) {
                        tx = _step163.value;
                        txs.push(tx);
                      }
                    } catch (err) {
                      _iterator163.e(err);
                    } finally {
                      _iterator163.f();
                    }

                    _context134.next = 88;
                    break;

                  case 83:
                    _context134.t5 = txs;
                    _context134.next = 86;
                    return that.wallet.createTx(useJsConfig ? jsConfig : config);

                  case 86:
                    _context134.t6 = _context134.sent;

                    _context134.t5.push.call(_context134.t5, _context134.t6);

                  case 88:
                    // test that config is unchanged
                    (0, _assert["default"])(configCopy !== config);

                    _assert["default"].deepEqual(config, configCopy); // test that wallet balance decreased


                    _context134.next = 92;
                    return that.wallet.getAccount(srcAccount.getIndex());

                  case 92:
                    account = _context134.sent;
                    (0, _assert["default"])(_index.GenUtils.compareBigInt(account.getBalance(), balance) < 0);
                    (0, _assert["default"])(_index.GenUtils.compareBigInt(account.getUnlockedBalance(), unlockedBalance) < 0); // test each transaction

                    (0, _assert["default"])(txs.length > 0);
                    outgoingSum = BigInt(0);
                    _i24 = 0, _txs4 = txs;

                  case 98:
                    if (!(_i24 < _txs4.length)) {
                      _context134.next = 128;
                      break;
                    }

                    _tx27 = _txs4[_i24];
                    _context134.next = 102;
                    return that._testTxWallet(_tx27, {
                      wallet: that.wallet,
                      config: config,
                      isSendResponse: true
                    });

                  case 102:
                    outgoingSum = outgoingSum + _tx27.getOutgoingAmount();

                    if (!(_tx27.getOutgoingTransfer() !== undefined && _tx27.getOutgoingTransfer().getDestinations())) {
                      _context134.next = 125;
                      break;
                    }

                    destinationSum = BigInt(0);
                    _iterator164 = _createForOfIteratorHelper(_tx27.getOutgoingTransfer().getDestinations());
                    _context134.prev = 106;

                    _iterator164.s();

                  case 108:
                    if ((_step164 = _iterator164.n()).done) {
                      _context134.next = 116;
                      break;
                    }

                    destination = _step164.value;
                    _context134.next = 112;
                    return testDestination(destination);

                  case 112:
                    (0, _assert["default"])(destinationAddresses.includes(destination.getAddress()));
                    destinationSum = destinationSum + destination.getAmount();

                  case 114:
                    _context134.next = 108;
                    break;

                  case 116:
                    _context134.next = 121;
                    break;

                  case 118:
                    _context134.prev = 118;
                    _context134.t7 = _context134["catch"](106);

                    _iterator164.e(_context134.t7);

                  case 121:
                    _context134.prev = 121;

                    _iterator164.f();

                    return _context134.finish(121);

                  case 124:
                    (0, _assert["default"])(_index.GenUtils.compareBigInt(_tx27.getOutgoingAmount(), destinationSum) === 0); // assert that transfers sum up to tx amount

                  case 125:
                    _i24++;
                    _context134.next = 98;
                    break;

                  case 128:
                    if (!(Math.abs(sendAmount - outgoingSum.toJSValue()) > SEND_MAX_DIFF)) {
                      _context134.next = 130;
                      break;
                    }

                    throw new Error("Actual send amount is too different from requested send amount: " + sendAmount + " - " + outgoingSum + " = " + sendAmount - outgoingSum);

                  case 130:
                  case "end":
                    return _context134.stop();
                }
              }
            }, _callee132, null, [[10, 22, 25, 28], [106, 118, 121, 124]]);
          }));
          return _testSendToMultiple.apply(this, arguments);
        }

        if (!testConfig.liteMode && (testConfig.testNonRelays || testConfig.testRelays)) it("Supports view-only and offline wallets to create, sign, and submit transactions", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee107() {
          var viewOnlyWallet, offlineWallet, err;
          return _regenerator["default"].wrap(function _callee107$(_context108) {
            while (1) {
              switch (_context108.prev = _context108.next) {
                case 0:
                  _context108.t0 = that;
                  _context108.next = 3;
                  return that.wallet.getPrimaryAddress();

                case 3:
                  _context108.t1 = _context108.sent;
                  _context108.next = 6;
                  return that.wallet.getPrivateViewKey();

                case 6:
                  _context108.t2 = _context108.sent;
                  _context108.t3 = _TestUtils["default"].FIRST_RECEIVE_HEIGHT;
                  _context108.t4 = {
                    primaryAddress: _context108.t1,
                    privateViewKey: _context108.t2,
                    restoreHeight: _context108.t3
                  };
                  _context108.next = 11;
                  return _context108.t0.createWallet.call(_context108.t0, _context108.t4);

                case 11:
                  viewOnlyWallet = _context108.sent;
                  _context108.t5 = that;
                  _context108.next = 15;
                  return that.wallet.getPrimaryAddress();

                case 15:
                  _context108.t6 = _context108.sent;
                  _context108.next = 18;
                  return that.wallet.getPrivateViewKey();

                case 18:
                  _context108.t7 = _context108.sent;
                  _context108.next = 21;
                  return that.wallet.getPrivateSpendKey();

                case 21:
                  _context108.t8 = _context108.sent;
                  _context108.t9 = _TestUtils["default"].OFFLINE_SERVER_URI;
                  _context108.t10 = {
                    primaryAddress: _context108.t6,
                    privateViewKey: _context108.t7,
                    privateSpendKey: _context108.t8,
                    serverUri: _context108.t9,
                    restoreHeight: 0
                  };
                  _context108.next = 26;
                  return _context108.t5.createWallet.call(_context108.t5, _context108.t10);

                case 26:
                  offlineWallet = _context108.sent;
                  _context108.next = 29;
                  return viewOnlyWallet.sync();

                case 29:
                  _context108.prev = 29;
                  _context108.next = 32;
                  return that._testViewOnlyAndOfflineWallets(viewOnlyWallet, offlineWallet);

                case 32:
                  _context108.next = 37;
                  break;

                case 34:
                  _context108.prev = 34;
                  _context108.t11 = _context108["catch"](29);
                  err = _context108.t11;

                case 37:
                  _context108.next = 39;
                  return that.closeWallet(viewOnlyWallet);

                case 39:
                  _context108.next = 41;
                  return that.closeWallet(offlineWallet);

                case 41:
                  if (!err) {
                    _context108.next = 43;
                    break;
                  }

                  throw err;

                case 43:
                case "end":
                  return _context108.stop();
              }
            }
          }, _callee107, null, [[29, 34]]);
        })));
        if (testConfig.testRelays) it("Can sweep individual outputs identified by their key images", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee108() {
          var numOutputs, spendableUnlockedOutputs, outputsToSweep, i, _i14, _outputsToSweep, _output16, address, config, tx, afterOutputs, _iterator106, _step106, afterOutput, _iterator107, _step107, _output17;

          return _regenerator["default"].wrap(function _callee108$(_context109) {
            while (1) {
              switch (_context109.prev = _context109.next) {
                case 0:
                  _context109.next = 2;
                  return _TestUtils["default"].WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);

                case 2:
                  // test config
                  numOutputs = 3; // get outputs to sweep (not spent, unlocked, and amount >= fee)

                  _context109.next = 5;
                  return that.wallet.getOutputs(new _index.MoneroOutputQuery().setIsSpent(false).setTxQuery(new _index.MoneroTxQuery().setIsLocked(false)));

                case 5:
                  spendableUnlockedOutputs = _context109.sent;
                  outputsToSweep = [];

                  for (i = 0; i < spendableUnlockedOutputs.length && outputsToSweep.length < numOutputs; i++) {
                    if (BitIntegerCompare(spendableUnlockedOutputs[i].getAmount(), _TestUtils["default"].MAX_FEE) > 0) outputsToSweep.push(spendableUnlockedOutputs[i]); // output cannot be swept if amount does not cover fee
                  }

                  (0, _assert["default"])(outputsToSweep.length >= numOutputs, "Wallet does not have enough sweepable outputs; run send tests"); // sweep each output by key image

                  _i14 = 0, _outputsToSweep = outputsToSweep;

                case 10:
                  if (!(_i14 < _outputsToSweep.length)) {
                    _context109.next = 30;
                    break;
                  }

                  _output16 = _outputsToSweep[_i14];
                  testOutputWallet(_output16);

                  _assert["default"].equal(_output16.isSpent(), false);

                  _assert["default"].equal(_output16.isLocked(), false);

                  if (!(BitIntegerCompare(_output16.getAmount(), _TestUtils["default"].MAX_FEE) <= 0)) {
                    _context109.next = 17;
                    break;
                  }

                  return _context109.abrupt("continue", 27);

                case 17:
                  _context109.next = 19;
                  return that.wallet.getAddress(_output16.getAccountIndex(), _output16.getSubaddressIndex());

                case 19:
                  address = _context109.sent;
                  config = new _index.MoneroTxConfig({
                    address: address,
                    keyImage: _output16.getKeyImage().getHex(),
                    relay: true
                  });
                  _context109.next = 23;
                  return that.wallet.sweepOutput(config);

                case 23:
                  tx = _context109.sent;
                  // test resulting tx
                  config.setCanSplit(false);
                  _context109.next = 27;
                  return that._testTxWallet(tx, {
                    wallet: that.wallet,
                    config: config,
                    isSendResponse: true,
                    isSweepResponse: true,
                    isSweepOutputResponse: true
                  });

                case 27:
                  _i14++;
                  _context109.next = 10;
                  break;

                case 30:
                  _context109.next = 32;
                  return that.wallet.getOutputs();

                case 32:
                  afterOutputs = _context109.sent;
                  // swept output are now spent
                  _iterator106 = _createForOfIteratorHelper(afterOutputs);

                  try {
                    for (_iterator106.s(); !(_step106 = _iterator106.n()).done;) {
                      afterOutput = _step106.value;
                      _iterator107 = _createForOfIteratorHelper(outputsToSweep);

                      try {
                        for (_iterator107.s(); !(_step107 = _iterator107.n()).done;) {
                          _output17 = _step107.value;

                          if (_output17.getKeyImage().getHex() === afterOutput.getKeyImage().getHex()) {
                            (0, _assert["default"])(afterOutput.isSpent(), "Output should be spent");
                          }
                        }
                      } catch (err) {
                        _iterator107.e(err);
                      } finally {
                        _iterator107.f();
                      }
                    }
                  } catch (err) {
                    _iterator106.e(err);
                  } finally {
                    _iterator106.f();
                  }

                case 35:
                case "end":
                  return _context109.stop();
              }
            }
          }, _callee108);
        })));
        if (testConfig.testRelays) it("Can sweep dust without relaying", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee109() {
          var txs, ctx, _iterator108, _step108, tx, metadatas, _iterator109, _step109, _tx19, txHashes, _iterator110, _step110, txHash, _iterator111, _step111, _tx20;

          return _regenerator["default"].wrap(function _callee109$(_context110) {
            while (1) {
              switch (_context110.prev = _context110.next) {
                case 0:
                  _context110.next = 2;
                  return _TestUtils["default"].WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);

                case 2:
                  _context110.next = 4;
                  return that.wallet.sweepDust(false);

                case 4:
                  txs = _context110.sent;

                  if (!(txs.length == 0)) {
                    _context110.next = 7;
                    break;
                  }

                  return _context110.abrupt("return");

                case 7:
                  // test txs
                  ctx = {
                    config: new _index.MoneroTxConfig(),
                    isSendResponse: true,
                    isSweepResponse: true
                  };
                  _iterator108 = _createForOfIteratorHelper(txs);
                  _context110.prev = 9;

                  _iterator108.s();

                case 11:
                  if ((_step108 = _iterator108.n()).done) {
                    _context110.next = 17;
                    break;
                  }

                  tx = _step108.value;
                  _context110.next = 15;
                  return that._testTxWallet(tx, ctx);

                case 15:
                  _context110.next = 11;
                  break;

                case 17:
                  _context110.next = 22;
                  break;

                case 19:
                  _context110.prev = 19;
                  _context110.t0 = _context110["catch"](9);

                  _iterator108.e(_context110.t0);

                case 22:
                  _context110.prev = 22;

                  _iterator108.f();

                  return _context110.finish(22);

                case 25:
                  // relay txs
                  metadatas = [];
                  _iterator109 = _createForOfIteratorHelper(txs);

                  try {
                    for (_iterator109.s(); !(_step109 = _iterator109.n()).done;) {
                      _tx19 = _step109.value;
                      metadatas.push(_tx19.getMetadata());
                    }
                  } catch (err) {
                    _iterator109.e(err);
                  } finally {
                    _iterator109.f();
                  }

                  _context110.next = 30;
                  return that.wallet.relayTxs(metadatas);

                case 30:
                  txHashes = _context110.sent;

                  _assert["default"].equal(txs.length, txHashes.length);

                  _iterator110 = _createForOfIteratorHelper(txHashes);

                  try {
                    for (_iterator110.s(); !(_step110 = _iterator110.n()).done;) {
                      txHash = _step110.value;

                      _assert["default"].equal(txHash.length, 64);
                    } // fetch and test txs

                  } catch (err) {
                    _iterator110.e(err);
                  } finally {
                    _iterator110.f();
                  }

                  txs = wallet.getTxs(new _index.MoneroTxQuery().setHashes(txHashes));
                  ctx.config.setRelay(true);
                  _iterator111 = _createForOfIteratorHelper(txs);
                  _context110.prev = 37;

                  _iterator111.s();

                case 39:
                  if ((_step111 = _iterator111.n()).done) {
                    _context110.next = 45;
                    break;
                  }

                  _tx20 = _step111.value;
                  _context110.next = 43;
                  return that._testTxWallet(_tx20, ctx);

                case 43:
                  _context110.next = 39;
                  break;

                case 45:
                  _context110.next = 50;
                  break;

                case 47:
                  _context110.prev = 47;
                  _context110.t1 = _context110["catch"](37);

                  _iterator111.e(_context110.t1);

                case 50:
                  _context110.prev = 50;

                  _iterator111.f();

                  return _context110.finish(50);

                case 53:
                case "end":
                  return _context110.stop();
              }
            }
          }, _callee109, null, [[9, 19, 22, 25], [37, 47, 50, 53]]);
        })));
        if (testConfig.testRelays) it("Can sweep dust", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee110() {
          var txs, ctx, _iterator112, _step112, tx;

          return _regenerator["default"].wrap(function _callee110$(_context111) {
            while (1) {
              switch (_context111.prev = _context111.next) {
                case 0:
                  _context111.next = 2;
                  return _TestUtils["default"].WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);

                case 2:
                  _context111.next = 4;
                  return that.wallet.sweepDust(true);

                case 4:
                  txs = _context111.sent;
                  // test any txs
                  ctx = {
                    wallet: that.wallet,
                    isSendResponse: true,
                    isSweepResponse: true
                  };
                  _iterator112 = _createForOfIteratorHelper(txs);
                  _context111.prev = 7;

                  _iterator112.s();

                case 9:
                  if ((_step112 = _iterator112.n()).done) {
                    _context111.next = 15;
                    break;
                  }

                  tx = _step112.value;
                  _context111.next = 13;
                  return that._testTxWallet(tx, ctx);

                case 13:
                  _context111.next = 9;
                  break;

                case 15:
                  _context111.next = 20;
                  break;

                case 17:
                  _context111.prev = 17;
                  _context111.t0 = _context111["catch"](7);

                  _iterator112.e(_context111.t0);

                case 20:
                  _context111.prev = 20;

                  _iterator112.f();

                  return _context111.finish(20);

                case 23:
                case "end":
                  return _context111.stop();
              }
            }
          }, _callee110, null, [[7, 17, 20, 23]]);
        })));
        it("Supports multisig wallets", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee111() {
          return _regenerator["default"].wrap(function _callee111$(_context112) {
            while (1) {
              switch (_context112.prev = _context112.next) {
                case 0:
                  _context112.next = 2;
                  return that._testMultisig(2, 2, false);

                case 2:
                  _context112.next = 4;
                  return that._testMultisig(2, 3, false);

                case 4:
                  _context112.next = 6;
                  return that._testMultisig(2, 4, testConfig.testRelays && !testConfig.liteMode);

                case 6:
                case "end":
                  return _context112.stop();
              }
            }
          }, _callee111);
        }))); // ---------------------------- TEST RESETS -----------------------------

        if (testConfig.testResets) it("Can sweep subaddresses", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee112() {
          var NUM_SUBADDRESSES_TO_SWEEP, subaddresses, subaddressesBalance, subaddressesUnlocked, _iterator113, _step113, account, _iterator116, _step116, _subaddress2, i, unlockedSubaddress, config, txs, _iterator114, _step114, tx, subaddress, subaddressesAfter, _iterator115, _step115, _account2, _iterator117, _step117, _subaddress3, _i15, subaddressBefore, subaddressAfter, swept, j;

          return _regenerator["default"].wrap(function _callee112$(_context113) {
            while (1) {
              switch (_context113.prev = _context113.next) {
                case 0:
                  _context113.next = 2;
                  return _TestUtils["default"].WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);

                case 2:
                  NUM_SUBADDRESSES_TO_SWEEP = 2; // collect subaddresses with balance and unlocked balance

                  subaddresses = [];
                  subaddressesBalance = [];
                  subaddressesUnlocked = [];
                  _context113.t0 = _createForOfIteratorHelper;
                  _context113.next = 9;
                  return that.wallet.getAccounts(true);

                case 9:
                  _context113.t1 = _context113.sent;
                  _iterator113 = (0, _context113.t0)(_context113.t1);
                  _context113.prev = 11;

                  _iterator113.s();

                case 13:
                  if ((_step113 = _iterator113.n()).done) {
                    _context113.next = 21;
                    break;
                  }

                  account = _step113.value;

                  if (!(account.getIndex() === 0)) {
                    _context113.next = 17;
                    break;
                  }

                  return _context113.abrupt("continue", 19);

                case 17:
                  // skip default account
                  _iterator116 = _createForOfIteratorHelper(account.getSubaddresses());

                  try {
                    for (_iterator116.s(); !(_step116 = _iterator116.n()).done;) {
                      _subaddress2 = _step116.value;
                      subaddresses.push(_subaddress2);
                      if (_index.GenUtils.compareBigInt(_subaddress2.getBalance(), _TestUtils["default"].MAX_FEE) > 0) subaddressesBalance.push(_subaddress2);
                      if (_index.GenUtils.compareBigInt(_subaddress2.getUnlockedBalance(), _TestUtils["default"].MAX_FEE) > 0) subaddressesUnlocked.push(_subaddress2);
                    }
                  } catch (err) {
                    _iterator116.e(err);
                  } finally {
                    _iterator116.f();
                  }

                case 19:
                  _context113.next = 13;
                  break;

                case 21:
                  _context113.next = 26;
                  break;

                case 23:
                  _context113.prev = 23;
                  _context113.t2 = _context113["catch"](11);

                  _iterator113.e(_context113.t2);

                case 26:
                  _context113.prev = 26;

                  _iterator113.f();

                  return _context113.finish(26);

                case 29:
                  // test requires at least one more subaddresses than the number being swept to verify it does not change
                  (0, _assert["default"])(subaddressesBalance.length >= NUM_SUBADDRESSES_TO_SWEEP + 1, "Test requires balance in at least " + (NUM_SUBADDRESSES_TO_SWEEP + 1) + " subaddresses from non-default acccount; run send-to-multiple tests");
                  (0, _assert["default"])(subaddressesUnlocked.length >= NUM_SUBADDRESSES_TO_SWEEP + 1, "Wallet is waiting on unlocked funds"); // sweep from first unlocked subaddresses

                  i = 0;

                case 32:
                  if (!(i < NUM_SUBADDRESSES_TO_SWEEP)) {
                    _context113.next = 71;
                    break;
                  }

                  // sweep unlocked account
                  unlockedSubaddress = subaddressesUnlocked[i];
                  _context113.t3 = _index.MoneroTxConfig;
                  _context113.next = 37;
                  return that.wallet.getPrimaryAddress();

                case 37:
                  _context113.t4 = _context113.sent;
                  _context113.t5 = unlockedSubaddress.getAccountIndex();
                  _context113.t6 = unlockedSubaddress.getIndex();
                  _context113.t7 = {
                    address: _context113.t4,
                    accountIndex: _context113.t5,
                    subaddressIndex: _context113.t6,
                    relay: true
                  };
                  config = new _context113.t3(_context113.t7);
                  _context113.next = 44;
                  return that.wallet.sweepUnlocked(config);

                case 44:
                  txs = _context113.sent;
                  // test transactions
                  (0, _assert["default"])(txs.length > 0);
                  _iterator114 = _createForOfIteratorHelper(txs);
                  _context113.prev = 47;

                  _iterator114.s();

                case 49:
                  if ((_step114 = _iterator114.n()).done) {
                    _context113.next = 56;
                    break;
                  }

                  tx = _step114.value;
                  (0, _assert["default"])(_index.GenUtils.arrayContains(tx.getTxSet().getTxs(), tx));
                  _context113.next = 54;
                  return that._testTxWallet(tx, {
                    wallet: that.wallet,
                    config: config,
                    isSendResponse: true,
                    isSweepResponse: true
                  });

                case 54:
                  _context113.next = 49;
                  break;

                case 56:
                  _context113.next = 61;
                  break;

                case 58:
                  _context113.prev = 58;
                  _context113.t8 = _context113["catch"](47);

                  _iterator114.e(_context113.t8);

                case 61:
                  _context113.prev = 61;

                  _iterator114.f();

                  return _context113.finish(61);

                case 64:
                  _context113.next = 66;
                  return that.wallet.getSubaddress(unlockedSubaddress.getAccountIndex(), unlockedSubaddress.getIndex());

                case 66:
                  subaddress = _context113.sent;
                  (0, _assert["default"])(_index.GenUtils.compareBigInt(subaddress.getUnlockedBalance(), _TestUtils["default"].MAX_FEE) < 0);

                case 68:
                  i++;
                  _context113.next = 32;
                  break;

                case 71:
                  // test subaddresses after sweeping
                  subaddressesAfter = [];
                  _context113.t9 = _createForOfIteratorHelper;
                  _context113.next = 75;
                  return that.wallet.getAccounts(true);

                case 75:
                  _context113.t10 = _context113.sent;
                  _iterator115 = (0, _context113.t9)(_context113.t10);
                  _context113.prev = 77;

                  _iterator115.s();

                case 79:
                  if ((_step115 = _iterator115.n()).done) {
                    _context113.next = 87;
                    break;
                  }

                  _account2 = _step115.value;

                  if (!(_account2.getIndex() === 0)) {
                    _context113.next = 83;
                    break;
                  }

                  return _context113.abrupt("continue", 85);

                case 83:
                  // skip default account
                  _iterator117 = _createForOfIteratorHelper(_account2.getSubaddresses());

                  try {
                    for (_iterator117.s(); !(_step117 = _iterator117.n()).done;) {
                      _subaddress3 = _step117.value;
                      subaddressesAfter.push(_subaddress3);
                    }
                  } catch (err) {
                    _iterator117.e(err);
                  } finally {
                    _iterator117.f();
                  }

                case 85:
                  _context113.next = 79;
                  break;

                case 87:
                  _context113.next = 92;
                  break;

                case 89:
                  _context113.prev = 89;
                  _context113.t11 = _context113["catch"](77);

                  _iterator115.e(_context113.t11);

                case 92:
                  _context113.prev = 92;

                  _iterator115.f();

                  return _context113.finish(92);

                case 95:
                  _assert["default"].equal(subaddressesAfter.length, subaddresses.length);

                  _i15 = 0;

                case 97:
                  if (!(_i15 < subaddresses.length)) {
                    _context113.next = 113;
                    break;
                  }

                  subaddressBefore = subaddresses[_i15];
                  subaddressAfter = subaddressesAfter[_i15]; // determine if subaddress was swept

                  swept = false;
                  j = 0;

                case 102:
                  if (!(j < NUM_SUBADDRESSES_TO_SWEEP)) {
                    _context113.next = 109;
                    break;
                  }

                  if (!(subaddressesUnlocked[j].getAccountIndex() === subaddressBefore.getAccountIndex() && subaddressesUnlocked[j].getIndex() === subaddressBefore.getIndex())) {
                    _context113.next = 106;
                    break;
                  }

                  swept = true;
                  return _context113.abrupt("break", 109);

                case 106:
                  j++;
                  _context113.next = 102;
                  break;

                case 109:
                  // assert unlocked balance is less than max fee if swept, unchanged otherwise
                  if (swept) {
                    (0, _assert["default"])(_index.GenUtils.compareBigInt(subaddressAfter.getUnlockedBalance(), _TestUtils["default"].MAX_FEE) < 0);
                  } else {
                    (0, _assert["default"])(_index.GenUtils.compareBigInt(subaddressBefore.getUnlockedBalance(), subaddressAfter.getUnlockedBalance()) === 0);
                  }

                case 110:
                  _i15++;
                  _context113.next = 97;
                  break;

                case 113:
                case "end":
                  return _context113.stop();
              }
            }
          }, _callee112, null, [[11, 23, 26, 29], [47, 58, 61, 64], [77, 89, 92, 95]]);
        })));
        if (testConfig.testResets) it("Can sweep accounts", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee113() {
          var NUM_ACCOUNTS_TO_SWEEP, accounts, accountsBalance, accountsUnlocked, _iterator118, _step118, _account3, i, unlockedAccount, config, txs, _iterator119, _step119, tx, account, accountsAfter, _i16, accountBefore, accountAfter, swept, j;

          return _regenerator["default"].wrap(function _callee113$(_context114) {
            while (1) {
              switch (_context114.prev = _context114.next) {
                case 0:
                  _context114.next = 2;
                  return _TestUtils["default"].WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);

                case 2:
                  NUM_ACCOUNTS_TO_SWEEP = 1; // collect accounts with sufficient balance and unlocked balance to cover the fee

                  _context114.next = 5;
                  return that.wallet.getAccounts(true);

                case 5:
                  accounts = _context114.sent;
                  accountsBalance = [];
                  accountsUnlocked = [];
                  _iterator118 = _createForOfIteratorHelper(accounts);
                  _context114.prev = 9;

                  _iterator118.s();

                case 11:
                  if ((_step118 = _iterator118.n()).done) {
                    _context114.next = 19;
                    break;
                  }

                  _account3 = _step118.value;

                  if (!(_account3.getIndex() === 0)) {
                    _context114.next = 15;
                    break;
                  }

                  return _context114.abrupt("continue", 17);

                case 15:
                  // skip default account
                  if (_index.GenUtils.compareBigInt(_account3.getBalance(), _TestUtils["default"].MAX_FEE) > 0) accountsBalance.push(_account3);
                  if (_index.GenUtils.compareBigInt(_account3.getUnlockedBalance(), _TestUtils["default"].MAX_FEE) > 0) accountsUnlocked.push(_account3);

                case 17:
                  _context114.next = 11;
                  break;

                case 19:
                  _context114.next = 24;
                  break;

                case 21:
                  _context114.prev = 21;
                  _context114.t0 = _context114["catch"](9);

                  _iterator118.e(_context114.t0);

                case 24:
                  _context114.prev = 24;

                  _iterator118.f();

                  return _context114.finish(24);

                case 27:
                  // test requires at least one more accounts than the number being swept to verify it does not change
                  (0, _assert["default"])(accountsBalance.length >= NUM_ACCOUNTS_TO_SWEEP + 1, "Test requires balance greater than the fee in at least " + (NUM_ACCOUNTS_TO_SWEEP + 1) + " non-default accounts; run send-to-multiple tests");
                  (0, _assert["default"])(accountsUnlocked.length >= NUM_ACCOUNTS_TO_SWEEP + 1, "Wallet is waiting on unlocked funds"); // sweep from first unlocked accounts

                  i = 0;

                case 30:
                  if (!(i < NUM_ACCOUNTS_TO_SWEEP)) {
                    _context114.next = 65;
                    break;
                  }

                  // sweep unlocked account
                  unlockedAccount = accountsUnlocked[i];
                  _context114.t1 = new _index.MoneroTxConfig();
                  _context114.next = 35;
                  return that.wallet.getPrimaryAddress();

                case 35:
                  _context114.t2 = _context114.sent;
                  config = _context114.t1.setAddress.call(_context114.t1, _context114.t2).setAccountIndex(unlockedAccount.getIndex()).setRelay(true);
                  _context114.next = 39;
                  return that.wallet.sweepUnlocked(config);

                case 39:
                  txs = _context114.sent;
                  // test transactions
                  (0, _assert["default"])(txs.length > 0);
                  _iterator119 = _createForOfIteratorHelper(txs);
                  _context114.prev = 42;

                  _iterator119.s();

                case 44:
                  if ((_step119 = _iterator119.n()).done) {
                    _context114.next = 50;
                    break;
                  }

                  tx = _step119.value;
                  _context114.next = 48;
                  return that._testTxWallet(tx, {
                    wallet: that.wallet,
                    config: config,
                    isSendResponse: true,
                    isSweepResponse: true
                  });

                case 48:
                  _context114.next = 44;
                  break;

                case 50:
                  _context114.next = 55;
                  break;

                case 52:
                  _context114.prev = 52;
                  _context114.t3 = _context114["catch"](42);

                  _iterator119.e(_context114.t3);

                case 55:
                  _context114.prev = 55;

                  _iterator119.f();

                  return _context114.finish(55);

                case 58:
                  _context114.next = 60;
                  return that.wallet.getAccount(unlockedAccount.getIndex());

                case 60:
                  account = _context114.sent;
                  (0, _assert["default"])(_index.GenUtils.compareBigInt(account.getUnlockedBalance(), _TestUtils["default"].MAX_FEE) < 0);

                case 62:
                  i++;
                  _context114.next = 30;
                  break;

                case 65:
                  _context114.next = 67;
                  return that.wallet.getAccounts(true);

                case 67:
                  accountsAfter = _context114.sent;

                  _assert["default"].equal(accountsAfter.length, accounts.length);

                  _i16 = 0;

                case 70:
                  if (!(_i16 < accounts.length)) {
                    _context114.next = 86;
                    break;
                  }

                  accountBefore = accounts[_i16];
                  accountAfter = accountsAfter[_i16]; // determine if account was swept

                  swept = false;
                  j = 0;

                case 75:
                  if (!(j < NUM_ACCOUNTS_TO_SWEEP)) {
                    _context114.next = 82;
                    break;
                  }

                  if (!(accountsUnlocked[j].getIndex() === accountBefore.getIndex())) {
                    _context114.next = 79;
                    break;
                  }

                  swept = true;
                  return _context114.abrupt("break", 82);

                case 79:
                  j++;
                  _context114.next = 75;
                  break;

                case 82:
                  // assert unlocked balance is less than max fee if swept, unchanged otherwise
                  if (swept) {
                    (0, _assert["default"])(_index.GenUtils.compareBigInt(accountAfter.getUnlockedBalance(), _TestUtils["default"].MAX_FEE) < 0);
                  } else {
                    _assert["default"].equal(_index.GenUtils.compareBigInt(accountBefore.getUnlockedBalance(), accountAfter.getUnlockedBalance()), 0);
                  }

                case 83:
                  _i16++;
                  _context114.next = 70;
                  break;

                case 86:
                case "end":
                  return _context114.stop();
              }
            }
          }, _callee113, null, [[9, 21, 24, 27], [42, 52, 55, 58]]);
        })));
        if (testConfig.testResets) it("Can sweep the whole wallet by accounts", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee114() {
          return _regenerator["default"].wrap(function _callee114$(_context115) {
            while (1) {
              switch (_context115.prev = _context115.next) {
                case 0:
                  (0, _assert["default"])(false, "Are you sure you want to sweep the whole wallet?");
                  _context115.next = 3;
                  return _testSweepWallet();

                case 3:
                case "end":
                  return _context115.stop();
              }
            }
          }, _callee114);
        })));
        if (testConfig.testResets) it("Can sweep the whole wallet by subaddresses", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee115() {
          return _regenerator["default"].wrap(function _callee115$(_context116) {
            while (1) {
              switch (_context116.prev = _context116.next) {
                case 0:
                  (0, _assert["default"])(false, "Are you sure you want to sweep the whole wallet?");
                  _context116.next = 3;
                  return _testSweepWallet(true);

                case 3:
                case "end":
                  return _context116.stop();
              }
            }
          }, _callee115);
        })));

        function _testSweepWallet(_x38) {
          return _testSweepWallet2.apply(this, arguments);
        }

        function _testSweepWallet2() {
          _testSweepWallet2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee133(sweepEachSubaddress) {
            var subaddressesBalance, subaddressesUnlocked, _iterator165, _step165, account, _iterator170, _step170, subaddress, destination, config, copy, txs, _iterator166, _step166, tx, _iterator167, _step167, _tx28, spendableOutputs, _iterator168, _step168, spendableOutput, _iterator169, _step169, _account5, _iterator171, _step171, _subaddress4;

            return _regenerator["default"].wrap(function _callee133$(_context135) {
              while (1) {
                switch (_context135.prev = _context135.next) {
                  case 0:
                    _context135.next = 2;
                    return _TestUtils["default"].WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);

                  case 2:
                    // verify 2 subaddresses with enough unlocked balance to cover the fee
                    subaddressesBalance = [];
                    subaddressesUnlocked = [];
                    _context135.t0 = _createForOfIteratorHelper;
                    _context135.next = 7;
                    return that.wallet.getAccounts(true);

                  case 7:
                    _context135.t1 = _context135.sent;
                    _iterator165 = (0, _context135.t0)(_context135.t1);

                    try {
                      for (_iterator165.s(); !(_step165 = _iterator165.n()).done;) {
                        account = _step165.value;
                        _iterator170 = _createForOfIteratorHelper(account.getSubaddresses());

                        try {
                          for (_iterator170.s(); !(_step170 = _iterator170.n()).done;) {
                            subaddress = _step170.value;
                            if (_index.GenUtils.compareBigInt(subaddress.getBalance(), _TestUtils["default"].MAX_FEE) > 0) subaddressesBalance.push(subaddress);
                            if (_index.GenUtils.compareBigInt(subaddress.getUnlockedBalance(), _TestUtils["default"].MAX_FEE) > 0) subaddressesUnlocked.push(subaddress);
                          }
                        } catch (err) {
                          _iterator170.e(err);
                        } finally {
                          _iterator170.f();
                        }
                      }
                    } catch (err) {
                      _iterator165.e(err);
                    } finally {
                      _iterator165.f();
                    }

                    (0, _assert["default"])(subaddressesBalance.length >= 2, "Test requires multiple accounts with a balance greater than the fee; run send to multiple first");
                    (0, _assert["default"])(subaddressesUnlocked.length >= 2, "Wallet is waiting on unlocked funds"); // sweep

                    _context135.next = 14;
                    return that.wallet.getPrimaryAddress();

                  case 14:
                    destination = _context135.sent;
                    config = new _index.MoneroTxConfig().setAddress(destination).setSweepEachSubaddress(sweepEachSubaddress).setRelay(true);
                    copy = config.copy();
                    _context135.next = 19;
                    return that.wallet.sweepUnlocked(config);

                  case 19:
                    txs = _context135.sent;

                    _assert["default"].deepEqual(config, copy); // config is unchanged


                    _iterator166 = _createForOfIteratorHelper(txs);

                    try {
                      for (_iterator166.s(); !(_step166 = _iterator166.n()).done;) {
                        tx = _step166.value;
                        (0, _assert["default"])(_index.GenUtils.arrayContains(tx.getTxSet().getTxs(), tx));

                        _assert["default"].equal(tx.getTxSet().getMultisigTxHex(), undefined);

                        _assert["default"].equal(tx.getTxSet().getSignedTxHex(), undefined);

                        _assert["default"].equal(tx.getTxSet().getUnsignedTxHex(), undefined);
                      }
                    } catch (err) {
                      _iterator166.e(err);
                    } finally {
                      _iterator166.f();
                    }

                    (0, _assert["default"])(txs.length > 0);
                    _iterator167 = _createForOfIteratorHelper(txs);
                    _context135.prev = 25;

                    _iterator167.s();

                  case 27:
                    if ((_step167 = _iterator167.n()).done) {
                      _context135.next = 34;
                      break;
                    }

                    _tx28 = _step167.value;
                    config = new _index.MoneroTxConfig({
                      address: destination,
                      accountIndex: _tx28.getOutgoingTransfer().getAccountIndex(),
                      sweepEachSubaddress: sweepEachSubaddress,
                      relay: true
                    });
                    _context135.next = 32;
                    return that._testTxWallet(_tx28, {
                      wallet: that.wallet,
                      config: config,
                      isSendResponse: true,
                      isSweepResponse: true
                    });

                  case 32:
                    _context135.next = 27;
                    break;

                  case 34:
                    _context135.next = 39;
                    break;

                  case 36:
                    _context135.prev = 36;
                    _context135.t2 = _context135["catch"](25);

                    _iterator167.e(_context135.t2);

                  case 39:
                    _context135.prev = 39;

                    _iterator167.f();

                    return _context135.finish(39);

                  case 42:
                    _context135.next = 44;
                    return that.wallet.getOutputs(new _index.MoneroOutputQuery().setIsSpent(false).setTxQuery(new _index.MoneroTxQuery().setIsLocked(false)));

                  case 44:
                    spendableOutputs = _context135.sent;
                    _iterator168 = _createForOfIteratorHelper(spendableOutputs);

                    try {
                      for (_iterator168.s(); !(_step168 = _iterator168.n()).done;) {
                        spendableOutput = _step168.value;
                        (0, _assert["default"])(BitIntegerCompare(spendableOutput.getAmount(), _TestUtils["default"].MAX_FEE) < 0, "Unspent output should have been swept\n" + spendableOutput.toString());
                      } // all subaddress unlocked balances must be less than fee

                    } catch (err) {
                      _iterator168.e(err);
                    } finally {
                      _iterator168.f();
                    }

                    subaddressesBalance = [];
                    subaddressesUnlocked = [];
                    _context135.t3 = _createForOfIteratorHelper;
                    _context135.next = 52;
                    return that.wallet.getAccounts(true);

                  case 52:
                    _context135.t4 = _context135.sent;
                    _iterator169 = (0, _context135.t3)(_context135.t4);

                    try {
                      for (_iterator169.s(); !(_step169 = _iterator169.n()).done;) {
                        _account5 = _step169.value;
                        _iterator171 = _createForOfIteratorHelper(_account5.getSubaddresses());

                        try {
                          for (_iterator171.s(); !(_step171 = _iterator171.n()).done;) {
                            _subaddress4 = _step171.value;
                            (0, _assert["default"])(_index.GenUtils.compareBigInt(_subaddress4.getUnlockedBalance(), _TestUtils["default"].MAX_FEE) < 0, "No subaddress should have more unlocked than the fee");
                          }
                        } catch (err) {
                          _iterator171.e(err);
                        } finally {
                          _iterator171.f();
                        }
                      }
                    } catch (err) {
                      _iterator169.e(err);
                    } finally {
                      _iterator169.f();
                    }

                  case 55:
                  case "end":
                    return _context135.stop();
                }
              }
            }, _callee133, null, [[25, 36, 39, 42]]);
          }));
          return _testSweepWallet2.apply(this, arguments);
        }

        it("Can scan transactions by id", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee116() {
          var txHashes, txs, i, scanWallet;
          return _regenerator["default"].wrap(function _callee116$(_context117) {
            while (1) {
              switch (_context117.prev = _context117.next) {
                case 0:
                  // get a few tx hashes
                  txHashes = [];
                  _context117.next = 3;
                  return that.wallet.getTxs();

                case 3:
                  txs = _context117.sent;

                  if (!(txs.length < 3)) {
                    _context117.next = 6;
                    break;
                  }

                  throw new Error("Not enough txs to scan");

                case 6:
                  for (i = 0; i < 3; i++) {
                    txHashes.push(txs[i].getHash());
                  } // start wallet without scanning


                  _context117.t0 = that;
                  _context117.t1 = new _index.MoneroWalletConfig();
                  _context117.next = 11;
                  return that.wallet.getMnemonic();

                case 11:
                  _context117.t2 = _context117.sent;
                  _context117.t3 = _context117.t1.setMnemonic.call(_context117.t1, _context117.t2).setRestoreHeight(0);
                  _context117.next = 15;
                  return _context117.t0.createWallet.call(_context117.t0, _context117.t3);

                case 15:
                  scanWallet = _context117.sent;
                  _context117.next = 18;
                  return scanWallet.stopSyncing();

                case 18:
                  _context117.t4 = _assert["default"];
                  _context117.next = 21;
                  return scanWallet.isConnectedToDaemon();

                case 21:
                  _context117.t5 = _context117.sent;
                  (0, _context117.t4)(_context117.t5);
                  _context117.next = 25;
                  return scanWallet.scanTxs(txHashes);

                case 25:
                  _context117.next = 27;
                  return that.closeWallet(scanWallet, false);

                case 27:
                case "end":
                  return _context117.stop();
              }
            }
          }, _callee116);
        }))); // disabled so tests don't delete local cache

        if (testConfig.testResets) it("Can rescan the blockchain", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee117() {
          var _iterator120, _step120, tx;

          return _regenerator["default"].wrap(function _callee117$(_context118) {
            while (1) {
              switch (_context118.prev = _context118.next) {
                case 0:
                  (0, _assert["default"])(false, "Are you sure you want to discard local wallet data and rescan the blockchain?");
                  _context118.next = 3;
                  return that.wallet.rescanBlockchain();

                case 3:
                  _context118.t0 = _createForOfIteratorHelper;
                  _context118.next = 6;
                  return that.wallet.getTxs();

                case 6:
                  _context118.t1 = _context118.sent;
                  _iterator120 = (0, _context118.t0)(_context118.t1);
                  _context118.prev = 8;

                  _iterator120.s();

                case 10:
                  if ((_step120 = _iterator120.n()).done) {
                    _context118.next = 16;
                    break;
                  }

                  tx = _step120.value;
                  _context118.next = 14;
                  return that._testTxWallet(tx);

                case 14:
                  _context118.next = 10;
                  break;

                case 16:
                  _context118.next = 21;
                  break;

                case 18:
                  _context118.prev = 18;
                  _context118.t2 = _context118["catch"](8);

                  _iterator120.e(_context118.t2);

                case 21:
                  _context118.prev = 21;

                  _iterator120.f();

                  return _context118.finish(21);

                case 24:
                case "end":
                  return _context118.stop();
              }
            }
          }, _callee117, null, [[8, 18, 21, 24]]);
        })));
        if (testConfig.testNonRelays) it("Can freeze and thaw outputs", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee118() {
          var outputs, _iterator121, _step121, _output18, output, numFrozenBefore, outputFrozen, outputThawed;

          return _regenerator["default"].wrap(function _callee118$(_context119) {
            while (1) {
              switch (_context119.prev = _context119.next) {
                case 0:
                  _context119.next = 2;
                  return that.wallet.getOutputs(new _index.MoneroOutputQuery().setIsSpent(false).setIsFrozen(false).setTxQuery(new _index.MoneroTxQuery().setIsLocked(false)));

                case 2:
                  outputs = _context119.sent;
                  _iterator121 = _createForOfIteratorHelper(outputs);

                  try {
                    for (_iterator121.s(); !(_step121 = _iterator121.n()).done;) {
                      _output18 = _step121.value;

                      _assert["default"].equal(false, _output18.isFrozen());
                    }
                  } catch (err) {
                    _iterator121.e(err);
                  } finally {
                    _iterator121.f();
                  }

                  (0, _assert["default"])(outputs.length > 0);
                  output = outputs[0];

                  _assert["default"].equal(false, output.getTx().isLocked());

                  _assert["default"].equal(false, output.isSpent());

                  _assert["default"].equal(false, output.isFrozen());

                  _context119.t0 = _assert["default"];
                  _context119.next = 13;
                  return that.wallet.isOutputFrozen(output.getKeyImage().getHex());

                case 13:
                  _context119.t1 = _context119.sent;

                  _context119.t0.equal.call(_context119.t0, false, _context119.t1);

                  _context119.next = 17;
                  return that.wallet.getOutputs(new _index.MoneroOutputQuery().setIsFrozen(true));

                case 17:
                  numFrozenBefore = _context119.sent.length;
                  _context119.next = 20;
                  return that.wallet.freezeOutput(output.getKeyImage().getHex());

                case 20:
                  _context119.t2 = _assert["default"];
                  _context119.next = 23;
                  return that.wallet.isOutputFrozen(output.getKeyImage().getHex());

                case 23:
                  _context119.t3 = _context119.sent;

                  _context119.t2.equal.call(_context119.t2, true, _context119.t3);

                  _context119.t4 = _assert["default"];
                  _context119.t5 = numFrozenBefore + 1;
                  _context119.next = 29;
                  return that.wallet.getOutputs(new _index.MoneroOutputQuery().setIsFrozen(true));

                case 29:
                  _context119.t6 = _context119.sent.length;

                  _context119.t4.equal.call(_context119.t4, _context119.t5, _context119.t6);

                  _context119.next = 33;
                  return that.wallet.getOutputs(new _index.MoneroOutputQuery().setKeyImage(new _index.MoneroKeyImage().setHex(output.getKeyImage().getHex())).setIsFrozen(true));

                case 33:
                  outputs = _context119.sent;

                  _assert["default"].equal(1, outputs.length);

                  outputFrozen = outputs[0];

                  _assert["default"].equal(true, outputFrozen.isFrozen());

                  _assert["default"].equal(output.getKeyImage().getHex(), outputFrozen.getKeyImage().getHex()); // try to sweep frozen output


                  _context119.prev = 38;
                  _context119.t7 = that.wallet;
                  _context119.t8 = new _index.MoneroTxConfig();
                  _context119.next = 43;
                  return that.wallet.getPrimaryAddress();

                case 43:
                  _context119.t9 = _context119.sent;
                  _context119.t10 = _context119.t8.setAddress.call(_context119.t8, _context119.t9).setKeyImage(output.getKeyImage().getHex());
                  _context119.next = 47;
                  return _context119.t7.sweepOutput.call(_context119.t7, _context119.t10);

                case 47:
                  throw new Error("Should have thrown error");

                case 50:
                  _context119.prev = 50;
                  _context119.t11 = _context119["catch"](38);

                  _assert["default"].equal("No outputs found", _context119.t11.message);

                case 53:
                  _context119.prev = 53;
                  _context119.next = 56;
                  return that.wallet.freezeOutput(undefined);

                case 56:
                  throw new Error("Should have thrown error");

                case 59:
                  _context119.prev = 59;
                  _context119.t12 = _context119["catch"](53);

                  _assert["default"].equal("Must specify key image to freeze", _context119.t12.message);

                case 62:
                  _context119.prev = 62;
                  _context119.next = 65;
                  return that.wallet.freezeOutput("");

                case 65:
                  throw new Error("Should have thrown error");

                case 68:
                  _context119.prev = 68;
                  _context119.t13 = _context119["catch"](62);

                  _assert["default"].equal("Must specify key image to freeze", _context119.t13.message);

                case 71:
                  _context119.prev = 71;
                  _context119.next = 74;
                  return that.wallet.freezeOutput("123");

                case 74:
                  throw new Error("Should have thrown error");

                case 77:
                  _context119.prev = 77;
                  _context119.t14 = _context119["catch"](71);

                case 79:
                  _context119.next = 81;
                  return that.wallet.thawOutput(output.getKeyImage().getHex());

                case 81:
                  _context119.t15 = _assert["default"];
                  _context119.next = 84;
                  return that.wallet.isOutputFrozen(output.getKeyImage().getHex());

                case 84:
                  _context119.t16 = _context119.sent;

                  _context119.t15.equal.call(_context119.t15, false, _context119.t16);

                  _context119.t17 = _assert["default"];
                  _context119.t18 = numFrozenBefore;
                  _context119.next = 90;
                  return that.wallet.getOutputs(new _index.MoneroOutputQuery().setIsFrozen(true));

                case 90:
                  _context119.t19 = _context119.sent.length;

                  _context119.t17.equal.call(_context119.t17, _context119.t18, _context119.t19);

                  _context119.next = 94;
                  return that.wallet.getOutputs(new _index.MoneroOutputQuery().setKeyImage(new _index.MoneroKeyImage().setHex(output.getKeyImage().getHex())).setIsFrozen(true));

                case 94:
                  outputs = _context119.sent;

                  _assert["default"].equal(0, outputs.length);

                  _context119.next = 98;
                  return that.wallet.getOutputs(new _index.MoneroOutputQuery().setKeyImage(new _index.MoneroKeyImage().setHex(output.getKeyImage().getHex())).setIsFrozen(false));

                case 98:
                  outputs = _context119.sent;

                  _assert["default"].equal(1, outputs.length);

                  outputThawed = outputs[0];

                  _assert["default"].equal(false, outputThawed.isFrozen());

                  _assert["default"].equal(output.getKeyImage().getHex(), outputThawed.getKeyImage().getHex());

                case 103:
                case "end":
                  return _context119.stop();
              }
            }
          }, _callee118, null, [[38, 50], [53, 59], [62, 68], [71, 77]]);
        })));
        if (testConfig.testNonRelays) it("Provides key images of spent outputs", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee119() {
          var accountIndex, subaddressIndex, _iterator122, _step122, tx, dustKeyImages, _iterator123, _step123, _tx21, _iterator128, _step128, input, outputs, dustOutputs, _iterator124, _step124, _output19, availableKeyImages, _iterator125, _step125, _output20, sweptKeyImages, txs, _iterator126, _step126, _tx22, _iterator129, _step129, _input, maxSkippedOutput, _iterator127, _step127, _output21;

          return _regenerator["default"].wrap(function _callee119$(_context120) {
            while (1) {
              switch (_context120.prev = _context120.next) {
                case 0:
                  accountIndex = 0;
                  subaddressIndex = 0; // test unrelayed single transaction

                  _context120.t0 = testSpendTx;
                  _context120.t1 = that.wallet;
                  _context120.t2 = new _index.MoneroTxConfig();
                  _context120.next = 7;
                  return that.wallet.getPrimaryAddress();

                case 7:
                  _context120.t3 = _context120.sent;
                  _context120.t4 = _TestUtils["default"].MAX_FEE;
                  _context120.t5 = _context120.t2.addDestination.call(_context120.t2, _context120.t3, _context120.t4).setAccountIndex(accountIndex);
                  _context120.next = 12;
                  return _context120.t1.createTx.call(_context120.t1, _context120.t5);

                case 12:
                  _context120.t6 = _context120.sent;
                  (0, _context120.t0)(_context120.t6);
                  _context120.t7 = _createForOfIteratorHelper;
                  _context120.t8 = that.wallet;
                  _context120.t9 = new _index.MoneroTxConfig();
                  _context120.next = 19;
                  return that.wallet.getPrimaryAddress();

                case 19:
                  _context120.t10 = _context120.sent;
                  _context120.t11 = _TestUtils["default"].MAX_FEE;
                  _context120.t12 = _context120.t9.addDestination.call(_context120.t9, _context120.t10, _context120.t11).setAccountIndex(accountIndex);
                  _context120.next = 24;
                  return _context120.t8.createTxs.call(_context120.t8, _context120.t12);

                case 24:
                  _context120.t13 = _context120.sent;
                  _iterator122 = (0, _context120.t7)(_context120.t13);

                  try {
                    // test unrelayed split transactions
                    for (_iterator122.s(); !(_step122 = _iterator122.n()).done;) {
                      tx = _step122.value;
                      testSpendTx(tx);
                    } // test unrelayed sweep dust

                  } catch (err) {
                    _iterator122.e(err);
                  } finally {
                    _iterator122.f();
                  }

                  dustKeyImages = [];
                  _context120.t14 = _createForOfIteratorHelper;
                  _context120.next = 31;
                  return that.wallet.sweepDust(false);

                case 31:
                  _context120.t15 = _context120.sent;
                  _iterator123 = (0, _context120.t14)(_context120.t15);

                  try {
                    for (_iterator123.s(); !(_step123 = _iterator123.n()).done;) {
                      _tx21 = _step123.value;
                      testSpendTx(_tx21);
                      _iterator128 = _createForOfIteratorHelper(_tx21.getInputs());

                      try {
                        for (_iterator128.s(); !(_step128 = _iterator128.n()).done;) {
                          input = _step128.value;
                          dustKeyImages.add(input.getKeyImage().getHex());
                        }
                      } catch (err) {
                        _iterator128.e(err);
                      } finally {
                        _iterator128.f();
                      }
                    } // get available outputs above min amount

                  } catch (err) {
                    _iterator123.e(err);
                  } finally {
                    _iterator123.f();
                  }

                  _context120.next = 36;
                  return that.wallet.getOutputs(new _index.MoneroOutputQuery().setAccountIndex(accountIndex).setSubaddressIndex(subaddressIndex).setIsSpent(false).setIsFrozen(false).setTxQuery(new _index.MoneroTxQuery().setIsLocked(false)).setMinAmount(_TestUtils["default"].MAX_FEE));

                case 36:
                  outputs = _context120.sent;
                  // filter dust outputs
                  dustOutputs = [];
                  _iterator124 = _createForOfIteratorHelper(outputs);

                  try {
                    for (_iterator124.s(); !(_step124 = _iterator124.n()).done;) {
                      _output19 = _step124.value;
                      if (dustKeyImages.includes(_output19.getKeyImage().getHex())) dustOutputs.push(_output19);
                    }
                  } catch (err) {
                    _iterator124.e(err);
                  } finally {
                    _iterator124.f();
                  }

                  outputs = outputs.filter(function (output) {
                    return !dustOutputs.includes(output);
                  }); // remove dust outputs
                  // test unrelayed sweep output

                  _context120.t16 = testSpendTx;
                  _context120.t17 = that.wallet;
                  _context120.t18 = new _index.MoneroTxConfig();
                  _context120.next = 46;
                  return that.wallet.getPrimaryAddress();

                case 46:
                  _context120.t19 = _context120.sent;
                  _context120.t20 = _context120.t18.setAddress.call(_context120.t18, _context120.t19).setKeyImage(outputs[0].getKeyImage().getHex());
                  _context120.next = 50;
                  return _context120.t17.sweepOutput.call(_context120.t17, _context120.t20);

                case 50:
                  _context120.t21 = _context120.sent;
                  (0, _context120.t16)(_context120.t21);
                  // test unrelayed sweep wallet ensuring all non-dust outputs are spent
                  availableKeyImages = new Set();
                  _iterator125 = _createForOfIteratorHelper(outputs);

                  try {
                    for (_iterator125.s(); !(_step125 = _iterator125.n()).done;) {
                      _output20 = _step125.value;
                      availableKeyImages.add(_output20.getKeyImage().getHex());
                    }
                  } catch (err) {
                    _iterator125.e(err);
                  } finally {
                    _iterator125.f();
                  }

                  sweptKeyImages = new Set();
                  _context120.t22 = that.wallet;
                  _context120.t23 = new _index.MoneroTxConfig().setAccountIndex(accountIndex).setSubaddressIndex(subaddressIndex);
                  _context120.next = 60;
                  return that.wallet.getPrimaryAddress();

                case 60:
                  _context120.t24 = _context120.sent;
                  _context120.t25 = _context120.t23.setAddress.call(_context120.t23, _context120.t24);
                  _context120.next = 64;
                  return _context120.t22.sweepUnlocked.call(_context120.t22, _context120.t25);

                case 64:
                  txs = _context120.sent;
                  _iterator126 = _createForOfIteratorHelper(txs);

                  try {
                    for (_iterator126.s(); !(_step126 = _iterator126.n()).done;) {
                      _tx22 = _step126.value;
                      testSpendTx(_tx22);
                      _iterator129 = _createForOfIteratorHelper(_tx22.getInputs());

                      try {
                        for (_iterator129.s(); !(_step129 = _iterator129.n()).done;) {
                          _input = _step129.value;
                          sweptKeyImages.add(_input.getKeyImage().getHex());
                        }
                      } catch (err) {
                        _iterator129.e(err);
                      } finally {
                        _iterator129.f();
                      }
                    }
                  } catch (err) {
                    _iterator126.e(err);
                  } finally {
                    _iterator126.f();
                  }

                  (0, _assert["default"])(sweptKeyImages.size > 0); // max skipped output is less than max fee amount

                  maxSkippedOutput = undefined;
                  _iterator127 = _createForOfIteratorHelper(outputs);

                  try {
                    for (_iterator127.s(); !(_step127 = _iterator127.n()).done;) {
                      _output21 = _step127.value;

                      if (!sweptKeyImages.has(_output21.getKeyImage().getHex())) {
                        if (maxSkippedOutput === undefined || BitIntegerCompare(maxSkippedOutput.getAmount(), _output21.getAmount()) < 0) {
                          maxSkippedOutput = _output21;
                        }
                      }
                    }
                  } catch (err) {
                    _iterator127.e(err);
                  } finally {
                    _iterator127.f();
                  }

                  (0, _assert["default"])(maxSkippedOutput === undefined || BitIntegerCompare(maxSkippedOutput.getAmount(), _TestUtils["default"].MAX_FEE) < 0);

                case 72:
                case "end":
                  return _context120.stop();
              }
            }
          }, _callee119);
        })));

        function testSpendTx(spendTx) {
          _assert["default"].notEqual(undefined, spendTx.getInputs());

          (0, _assert["default"])(spendTx.getInputs().length > 0);

          var _iterator130 = _createForOfIteratorHelper(spendTx.getInputs()),
              _step130;

          try {
            for (_iterator130.s(); !(_step130 = _iterator130.n()).done;) {
              var input = _step130.value;
              (0, _assert["default"])(input.getKeyImage().getHex());
            }
          } catch (err) {
            _iterator130.e(err);
          } finally {
            _iterator130.f();
          }
        }

        if (testConfig.testNonRelays) it("Can prove unrelayed txs", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee120() {
          var address1, address2, address3, tx, result, verifyingWallet, check;
          return _regenerator["default"].wrap(function _callee120$(_context121) {
            while (1) {
              switch (_context121.prev = _context121.next) {
                case 0:
                  _context121.next = 2;
                  return _TestUtils["default"].getExternalWalletAddress();

                case 2:
                  address1 = _context121.sent;
                  _context121.next = 5;
                  return that.wallet.getAddress(0, 0);

                case 5:
                  address2 = _context121.sent;
                  _context121.next = 8;
                  return that.wallet.getAddress(1, 0);

                case 8:
                  address3 = _context121.sent;
                  _context121.next = 11;
                  return that.wallet.createTx(new _index.MoneroTxConfig().setAccountIndex(0).addDestination(address1, _TestUtils["default"].MAX_FEE).addDestination(address2, _TestUtils["default"].MAX_FEE * BigInt("2")).addDestination(address3, _TestUtils["default"].MAX_FEE * BigInt("3")));

                case 11:
                  tx = _context121.sent;
                  _context121.next = 14;
                  return that.daemon.submitTxHex(tx.getFullHex(), true);

                case 14:
                  result = _context121.sent;

                  _assert["default"].equal(result.isGood(), true); // create random wallet to verify transfers


                  _context121.next = 18;
                  return that.createWallet(new _index.MoneroWalletConfig());

                case 18:
                  verifyingWallet = _context121.sent;
                  _context121.next = 21;
                  return verifyingWallet.checkTxKey(tx.getHash(), tx.getKey(), address1);

                case 21:
                  check = _context121.sent;

                  _assert["default"].equal(check.isGood(), true);

                  _assert["default"].equal(check.inTxPool(), true);

                  _assert["default"].equal(check.getNumConfirmations(), 0);

                  _assert["default"].equal(check.getReceivedAmount().toString(), _TestUtils["default"].MAX_FEE.toString()); // verify transfer 2


                  _context121.next = 28;
                  return verifyingWallet.checkTxKey(tx.getHash(), tx.getKey(), address2);

                case 28:
                  check = _context121.sent;

                  _assert["default"].equal(check.isGood(), true);

                  _assert["default"].equal(check.inTxPool(), true);

                  _assert["default"].equal(check.getNumConfirmations(), 0);

                  _assert["default"].equal(true, _index.GenUtils.compareBigInt(check.getReceivedAmount(), _TestUtils["default"].MAX_FEE * BigInt("2")) >= 0); // + change amount
                  // verify transfer 3


                  _context121.next = 35;
                  return verifyingWallet.checkTxKey(tx.getHash(), tx.getKey(), address3);

                case 35:
                  check = _context121.sent;

                  _assert["default"].equal(check.isGood(), true);

                  _assert["default"].equal(check.inTxPool(), true);

                  _assert["default"].equal(check.getNumConfirmations(), 0);

                  _assert["default"].equal(check.getReceivedAmount().toString(), _TestUtils["default"].MAX_FEE * BigInt("3").toString()); // cleanup


                  _context121.next = 42;
                  return that.daemon.flushTxPool(tx.getHash());

                case 42:
                  _context121.next = 44;
                  return that.closeWallet(verifyingWallet);

                case 44:
                case "end":
                  return _context121.stop();
              }
            }
          }, _callee120);
        })));
      });
    } // -------------------------------- PRIVATE ---------------------------------

  }, {
    key: "getSubaddressesWithBalance",
    value: function () {
      var _getSubaddressesWithBalance = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee134() {
        var subaddresses, _iterator172, _step172, account, _iterator173, _step173, subaddress;

        return _regenerator["default"].wrap(function _callee134$(_context136) {
          while (1) {
            switch (_context136.prev = _context136.next) {
              case 0:
                subaddresses = [];
                _context136.t0 = _createForOfIteratorHelper;
                _context136.next = 4;
                return this.wallet.getAccounts(true);

              case 4:
                _context136.t1 = _context136.sent;
                _iterator172 = (0, _context136.t0)(_context136.t1);

                try {
                  for (_iterator172.s(); !(_step172 = _iterator172.n()).done;) {
                    account = _step172.value;
                    _iterator173 = _createForOfIteratorHelper(account.getSubaddresses());

                    try {
                      for (_iterator173.s(); !(_step173 = _iterator173.n()).done;) {
                        subaddress = _step173.value;
                        if (subaddress.getBalance().toJSValue() > 0) subaddresses.push(subaddress);
                      }
                    } catch (err) {
                      _iterator173.e(err);
                    } finally {
                      _iterator173.f();
                    }
                  }
                } catch (err) {
                  _iterator172.e(err);
                } finally {
                  _iterator172.f();
                }

                return _context136.abrupt("return", subaddresses);

              case 8:
              case "end":
                return _context136.stop();
            }
          }
        }, _callee134, this);
      }));

      function getSubaddressesWithBalance() {
        return _getSubaddressesWithBalance.apply(this, arguments);
      }

      return getSubaddressesWithBalance;
    }()
  }, {
    key: "getSubaddressesWithUnlockedBalance",
    value: function () {
      var _getSubaddressesWithUnlockedBalance = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee135() {
        var subaddresses, _iterator174, _step174, account, _iterator175, _step175, subaddress;

        return _regenerator["default"].wrap(function _callee135$(_context137) {
          while (1) {
            switch (_context137.prev = _context137.next) {
              case 0:
                subaddresses = [];
                _context137.t0 = _createForOfIteratorHelper;
                _context137.next = 4;
                return this.wallet.getAccounts(true);

              case 4:
                _context137.t1 = _context137.sent;
                _iterator174 = (0, _context137.t0)(_context137.t1);

                try {
                  for (_iterator174.s(); !(_step174 = _iterator174.n()).done;) {
                    account = _step174.value;
                    _iterator175 = _createForOfIteratorHelper(account.getSubaddresses());

                    try {
                      for (_iterator175.s(); !(_step175 = _iterator175.n()).done;) {
                        subaddress = _step175.value;
                        if (subaddress.getUnlockedBalance().toJSValue() > 0) subaddresses.push(subaddress);
                      }
                    } catch (err) {
                      _iterator175.e(err);
                    } finally {
                      _iterator175.f();
                    }
                  }
                } catch (err) {
                  _iterator174.e(err);
                } finally {
                  _iterator174.f();
                }

                return _context137.abrupt("return", subaddresses);

              case 8:
              case "end":
                return _context137.stop();
            }
          }
        }, _callee135, this);
      }));

      function getSubaddressesWithUnlockedBalance() {
        return _getSubaddressesWithUnlockedBalance.apply(this, arguments);
      }

      return getSubaddressesWithUnlockedBalance;
    }()
  }, {
    key: "_testGetSubaddressAddressOutOfRange",
    value: function () {
      var _testGetSubaddressAddressOutOfRange2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee136() {
        var accounts, accountIdx, subaddressIdx, address;
        return _regenerator["default"].wrap(function _callee136$(_context138) {
          while (1) {
            switch (_context138.prev = _context138.next) {
              case 0:
                _context138.next = 2;
                return this.wallet.getAccounts(true);

              case 2:
                accounts = _context138.sent;
                accountIdx = accounts.length - 1;
                subaddressIdx = accounts[accountIdx].getSubaddresses().length;
                _context138.next = 7;
                return this.wallet.getAddress(accountIdx, subaddressIdx);

              case 7:
                address = _context138.sent;

                _assert["default"].notEqual(address, undefined); // subclass my override with custom behavior (e.g. jni returns subaddress but wallet rpc does not)


                (0, _assert["default"])(address.length > 0);

              case 10:
              case "end":
                return _context138.stop();
            }
          }
        }, _callee136, this);
      }));

      function _testGetSubaddressAddressOutOfRange() {
        return _testGetSubaddressAddressOutOfRange2.apply(this, arguments);
      }

      return _testGetSubaddressAddressOutOfRange;
    }()
    /**
     * Fetches and tests transactions according to the given query.
     * 
     * TODO: convert query to query object and ensure each tx passes filter, same with getAndTestTransfer, getAndTestOutputs
     */

  }, {
    key: "_getAndTestTxs",
    value: function () {
      var _getAndTestTxs2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee137(wallet, query, isExpected) {
        var copy, txs, _iterator176, _step176, tx;

        return _regenerator["default"].wrap(function _callee137$(_context139) {
          while (1) {
            switch (_context139.prev = _context139.next) {
              case 0:
                if (query !== undefined) {
                  if (query instanceof _index.MoneroTxQuery) copy = query.copy();else copy = Object.assign({}, query);
                }

                _context139.next = 3;
                return wallet.getTxs(query);

              case 3:
                txs = _context139.sent;
                (0, _assert["default"])(Array.isArray(txs));
                if (isExpected === false) _assert["default"].equal(txs.length, 0);
                if (isExpected === true) (0, _assert["default"])(txs.length > 0, "Transactions were expected but not found; run send tests?");
                _iterator176 = _createForOfIteratorHelper(txs);
                _context139.prev = 8;

                _iterator176.s();

              case 10:
                if ((_step176 = _iterator176.n()).done) {
                  _context139.next = 16;
                  break;
                }

                tx = _step176.value;
                _context139.next = 14;
                return this._testTxWallet(tx, Object.assign({
                  wallet: wallet
                }, query));

              case 14:
                _context139.next = 10;
                break;

              case 16:
                _context139.next = 21;
                break;

              case 18:
                _context139.prev = 18;
                _context139.t0 = _context139["catch"](8);

                _iterator176.e(_context139.t0);

              case 21:
                _context139.prev = 21;

                _iterator176.f();

                return _context139.finish(21);

              case 24:
                testGetTxsStructure(txs, query);

                if (query !== undefined) {
                  if (query instanceof _index.MoneroTxQuery) _assert["default"].deepEqual(query.toJson(), copy.toJson());else _assert["default"].deepEqual(query, copy);
                }

                return _context139.abrupt("return", txs);

              case 27:
              case "end":
                return _context139.stop();
            }
          }
        }, _callee137, this, [[8, 18, 21, 24]]);
      }));

      function _getAndTestTxs(_x39, _x40, _x41) {
        return _getAndTestTxs2.apply(this, arguments);
      }

      return _getAndTestTxs;
    }()
    /**
     * Fetches and tests transfers according to the given query.
     */

  }, {
    key: "_getAndTestTransfers",
    value: function () {
      var _getAndTestTransfers2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee138(wallet, query, isExpected) {
        var copy, transfers, _iterator177, _step177, transfer;

        return _regenerator["default"].wrap(function _callee138$(_context140) {
          while (1) {
            switch (_context140.prev = _context140.next) {
              case 0:
                if (query !== undefined) {
                  if (query instanceof _index.MoneroTransferQuery) copy = query.copy();else copy = Object.assign({}, query);
                }

                _context140.next = 3;
                return wallet.getTransfers(query);

              case 3:
                transfers = _context140.sent;
                (0, _assert["default"])(Array.isArray(transfers));
                if (isExpected === false) _assert["default"].equal(transfers.length, 0);
                if (isExpected === true) (0, _assert["default"])(transfers.length > 0, "Transfers were expected but not found; run send tests?");
                _iterator177 = _createForOfIteratorHelper(transfers);
                _context140.prev = 8;

                _iterator177.s();

              case 10:
                if ((_step177 = _iterator177.n()).done) {
                  _context140.next = 16;
                  break;
                }

                transfer = _step177.value;
                _context140.next = 14;
                return this._testTxWallet(transfer.getTx(), Object.assign({
                  wallet: wallet
                }, query));

              case 14:
                _context140.next = 10;
                break;

              case 16:
                _context140.next = 21;
                break;

              case 18:
                _context140.prev = 18;
                _context140.t0 = _context140["catch"](8);

                _iterator177.e(_context140.t0);

              case 21:
                _context140.prev = 21;

                _iterator177.f();

                return _context140.finish(21);

              case 24:
                if (query !== undefined) {
                  if (query instanceof _index.MoneroTransferQuery) _assert["default"].deepEqual(query.toJson(), copy.toJson());else _assert["default"].deepEqual(query, copy);
                }

                return _context140.abrupt("return", transfers);

              case 26:
              case "end":
                return _context140.stop();
            }
          }
        }, _callee138, this, [[8, 18, 21, 24]]);
      }));

      function _getAndTestTransfers(_x42, _x43, _x44) {
        return _getAndTestTransfers2.apply(this, arguments);
      }

      return _getAndTestTransfers;
    }()
    /**
     * Fetches and tests outputs according to the given query.
     */

  }, {
    key: "_getAndTestOutputs",
    value: function () {
      var _getAndTestOutputs2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee139(wallet, query, isExpected) {
        var copy, outputs, _iterator178, _step178, _output29;

        return _regenerator["default"].wrap(function _callee139$(_context141) {
          while (1) {
            switch (_context141.prev = _context141.next) {
              case 0:
                if (query !== undefined) {
                  if (query instanceof _index.MoneroOutputQuery) copy = query.copy();else copy = Object.assign({}, query);
                }

                _context141.next = 3;
                return wallet.getOutputs(query);

              case 3:
                outputs = _context141.sent;
                (0, _assert["default"])(Array.isArray(outputs));
                if (isExpected === false) _assert["default"].equal(outputs.length, 0);
                if (isExpected === true) (0, _assert["default"])(outputs.length > 0, "Outputs were expected but not found; run send tests?");
                _iterator178 = _createForOfIteratorHelper(outputs);

                try {
                  for (_iterator178.s(); !(_step178 = _iterator178.n()).done;) {
                    _output29 = _step178.value;
                    testOutputWallet(_output29);
                  }
                } catch (err) {
                  _iterator178.e(err);
                } finally {
                  _iterator178.f();
                }

                if (query !== undefined) {
                  if (query instanceof _index.MoneroOutputQuery) _assert["default"].deepEqual(query.toJson(), copy.toJson());else _assert["default"].deepEqual(query, copy);
                }

                return _context141.abrupt("return", outputs);

              case 11:
              case "end":
                return _context141.stop();
            }
          }
        }, _callee139);
      }));

      function _getAndTestOutputs(_x45, _x46, _x47) {
        return _getAndTestOutputs2.apply(this, arguments);
      }

      return _getAndTestOutputs;
    }()
    /**
     * Tests a wallet transaction with a test configuration.
     * 
     * @param tx is the wallet transaction to test
     * @param ctx specifies test configuration
     *        ctx.wallet is used to cross reference tx info if available
     *        ctx.config specifies the tx's originating send configuration
     *        ctx.isSendResponse indicates if the tx is built from a send response, which contains additional fields (e.g. key)
     *        ctx.hasDestinations specifies if the tx has an outgoing transfer with destinations, undefined if doesn't matter
     *        ctx.includeOutputs specifies if outputs were fetched and should therefore be expected with incoming transfers
     */

  }, {
    key: "_testTxWallet",
    value: function () {
      var _testTxWallet2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee140(tx, ctx) {
        var _iterator179, _step179, input, transferSum, _iterator180, _step180, transfer, found, _iterator181, _step181, aTx, config, _iterator182, _step182, _output30, i, _iterator183, _step183, _input2, _iterator184, _step184, _output31;

        return _regenerator["default"].wrap(function _callee140$(_context142) {
          while (1) {
            switch (_context142.prev = _context142.next) {
              case 0:
                // validate / sanitize inputs
                ctx = Object.assign({}, ctx);
                delete ctx.wallet; // TODO: re-enable

                if (!(tx instanceof _index.MoneroTxWallet)) {
                  console.log("Tx is not a MoneroTxWallet!");
                  console.log(tx);
                }

                (0, _assert["default"])(tx instanceof _index.MoneroTxWallet);
                if (ctx.wallet) (0, _assert["default"])(ctx.wallet instanceof _index.MoneroWallet);
                (0, _assert["default"])(ctx.hasDestinations == undefined || typeof ctx.hasDestinations === "boolean");

                if (ctx.isSendResponse === undefined || ctx.config === undefined) {
                  _assert["default"].equal(ctx.isSendResponse, undefined, "if either config or isSendResponse is defined, they must both be defined");

                  _assert["default"].equal(ctx.config, undefined, "if either config or isSendResponse is defined, they must both be defined");
                } // test common field types


                _assert["default"].equal((0, _typeof2["default"])(tx.getHash()), "string");

                _assert["default"].equal((0, _typeof2["default"])(tx.isConfirmed()), "boolean");

                _assert["default"].equal((0, _typeof2["default"])(tx.isMinerTx()), "boolean");

                _assert["default"].equal((0, _typeof2["default"])(tx.isFailed()), "boolean");

                _assert["default"].equal((0, _typeof2["default"])(tx.isRelayed()), "boolean");

                _assert["default"].equal((0, _typeof2["default"])(tx.inTxPool()), "boolean");

                _assert["default"].equal((0, _typeof2["default"])(tx.isLocked()), "boolean");

                _TestUtils["default"].testUnsignedBigInt(tx.getFee());

                if (tx.getPaymentId()) _assert["default"].notEqual(tx.getPaymentId(), _index.MoneroTx.DEFAULT_PAYMENT_ID); // default payment id converted to undefined

                if (tx.getNote()) (0, _assert["default"])(tx.getNote().length > 0); // empty notes converted to undefined

                (0, _assert["default"])(tx.getUnlockHeight() >= 0);

                _assert["default"].equal(tx.getSize(), undefined); // TODO monero-wallet-rpc: add tx_size to get_transfers and get_transfer_by_txid


                _assert["default"].equal(tx.getReceivedTimestamp(), undefined); // TODO monero-wallet-rpc: return received timestamp (asked to file issue if wanted)
                // test send tx


                if (ctx.isSendResponse) {
                  (0, _assert["default"])(tx.getWeight() > 0);

                  _assert["default"].notEqual(tx.getInputs(), undefined);

                  (0, _assert["default"])(tx.getInputs().length > 0);
                  _iterator179 = _createForOfIteratorHelper(tx.getInputs());

                  try {
                    for (_iterator179.s(); !(_step179 = _iterator179.n()).done;) {
                      input = _step179.value;
                      (0, _assert["default"])(input.getTx() === tx);
                    }
                  } catch (err) {
                    _iterator179.e(err);
                  } finally {
                    _iterator179.f();
                  }
                } else {
                  _assert["default"].equal(tx.getWeight(), undefined);

                  _assert["default"].equal(tx.getInputs(), undefined);
                } // test confirmed


                if (tx.isConfirmed()) {
                  (0, _assert["default"])(tx.getBlock());
                  (0, _assert["default"])(tx.getBlock().getTxs().includes(tx));
                  (0, _assert["default"])(tx.getBlock().getHeight() > 0);
                  (0, _assert["default"])(tx.getBlock().getTimestamp() > 0);

                  _assert["default"].equal(tx.isRelayed(), true);

                  _assert["default"].equal(tx.isFailed(), false);

                  _assert["default"].equal(tx.inTxPool(), false);

                  _assert["default"].equal(tx.getRelay(), true);

                  _assert["default"].equal(tx.isDoubleSpendSeen(), false);

                  (0, _assert["default"])(tx.getNumConfirmations() > 0);
                } else {
                  _assert["default"].equal(undefined, tx.getBlock());

                  _assert["default"].equal(0, tx.getNumConfirmations());
                } // test in tx pool


                if (tx.inTxPool()) {
                  _assert["default"].equal(tx.isConfirmed(), false);

                  _assert["default"].equal(tx.getRelay(), true);

                  _assert["default"].equal(tx.isRelayed(), true);

                  _assert["default"].equal(tx.isDoubleSpendSeen(), false); // TODO: test double spend attempt


                  _assert["default"].equal(tx.isLocked(), true); // these should be initialized unless a response from sending


                  if (!ctx.isSendResponse) {//assert(tx.getReceivedTimestamp() > 0);    // TODO: re-enable when received timestamp returned in wallet rpc
                  }
                } else {
                  _assert["default"].equal(tx.getLastRelayedTimestamp(), undefined);
                } // test miner tx


                if (tx.isMinerTx()) {
                  _assert["default"].equal(_index.GenUtils.compareBigInt(tx.getFee(), BigInt(0)), 0);

                  (0, _assert["default"])(tx.getIncomingTransfers().length > 0);
                } // test failed  // TODO: what else to test associated with failed


                if (tx.isFailed()) {
                  (0, _assert["default"])(tx.getOutgoingTransfer() instanceof _index.MoneroTransfer); //assert(tx.getReceivedTimestamp() > 0);    // TODO: re-enable when received timestamp returned in wallet rpc
                } else {
                  if (tx.isRelayed()) _assert["default"].equal(tx.isDoubleSpendSeen(), false);else {
                    _assert["default"].equal(tx.isRelayed(), false);

                    _assert["default"].notEqual(tx.getRelay(), true);

                    _assert["default"].equal(tx.isDoubleSpendSeen(), undefined);
                  }
                }

                _assert["default"].equal(tx.getLastFailedHeight(), undefined);

                _assert["default"].equal(tx.getLastFailedHash(), undefined); // received time only for tx pool or failed txs


                if (tx.getReceivedTimestamp() !== undefined) {
                  (0, _assert["default"])(tx.inTxPool() || tx.isFailed());
                } // test relayed tx


                if (tx.isRelayed()) _assert["default"].equal(tx.getRelay(), true);
                if (tx.getRelay() !== true) _assert["default"].equal(tx.isRelayed(), false); // test outgoing transfer per configuration

                if (ctx.isOutgoing === false) (0, _assert["default"])(tx.getOutgoingTransfer() === undefined);
                if (ctx.hasDestinations) (0, _assert["default"])(tx.getOutgoingTransfer() && tx.getOutgoingTransfer().getDestinations().length > 0); // TODO: this was typo with getDestionations so is this actually being tested?
                // test outgoing transfer

                if (!tx.getOutgoingTransfer()) {
                  _context142.next = 39;
                  break;
                }

                (0, _assert["default"])(tx.isOutgoing());
                _context142.next = 36;
                return testTransfer(tx.getOutgoingTransfer(), ctx);

              case 36:
                if (ctx.isSweepResponse) _assert["default"].equal(tx.getOutgoingTransfer().getDestinations().length, 1); // TODO: handle special cases

                _context142.next = 46;
                break;

              case 39:
                (0, _assert["default"])(tx.getIncomingTransfers().length > 0);

                _assert["default"].equal(tx.getOutgoingAmount(), undefined);

                _assert["default"].equal(tx.getOutgoingTransfer(), undefined);

                _assert["default"].equal(tx.getRingSize(), undefined);

                _assert["default"].equal(tx.getFullHex(), undefined);

                _assert["default"].equal(tx.getMetadata(), undefined);

                _assert["default"].equal(tx.getKey(), undefined);

              case 46:
                if (!tx.getIncomingTransfers()) {
                  _context142.next = 83;
                  break;
                }

                (0, _assert["default"])(tx.isIncoming());
                (0, _assert["default"])(tx.getIncomingTransfers().length > 0);

                _TestUtils["default"].testUnsignedBigInt(tx.getIncomingAmount());

                _assert["default"].equal(tx.isFailed(), false); // test each transfer and collect transfer sum


                transferSum = BigInt(0);
                _iterator180 = _createForOfIteratorHelper(tx.getIncomingTransfers());
                _context142.prev = 53;

                _iterator180.s();

              case 55:
                if ((_step180 = _iterator180.n()).done) {
                  _context142.next = 72;
                  break;
                }

                transfer = _step180.value;
                _context142.next = 59;
                return testTransfer(transfer, ctx);

              case 59:
                transferSum = transferSum.add(transfer.getAmount());
                _context142.next = 62;
                return testTransfer(transfer, ctx);

              case 62:
                transferSum = transferSum + transfer.getAmount();

                if (!ctx.wallet) {
                  _context142.next = 70;
                  break;
                }

                _context142.t0 = _assert["default"];
                _context142.t1 = transfer.getAddress();
                _context142.next = 68;
                return ctx.wallet.getAddress(transfer.getAccountIndex(), transfer.getSubaddressIndex());

              case 68:
                _context142.t2 = _context142.sent;

                _context142.t0.equal.call(_context142.t0, _context142.t1, _context142.t2);

              case 70:
                _context142.next = 55;
                break;

              case 72:
                _context142.next = 77;
                break;

              case 74:
                _context142.prev = 74;
                _context142.t3 = _context142["catch"](53);

                _iterator180.e(_context142.t3);

              case 77:
                _context142.prev = 77;

                _iterator180.f();

                return _context142.finish(77);

              case 80:
                // incoming transfers add up to incoming tx amount
                _assert["default"].equal(_index.GenUtils.compareBigInt(transferSum, tx.getIncomingAmount()), 0);

                _context142.next = 86;
                break;

              case 83:
                (0, _assert["default"])(tx.getOutgoingTransfer());

                _assert["default"].equal(tx.getIncomingAmount(), undefined);

                _assert["default"].equal(tx.getIncomingTransfers(), undefined);

              case 86:
                if (!ctx.isSendResponse) {
                  _context142.next = 127;
                  break;
                }

                // test tx set
                _assert["default"].notEqual(tx.getTxSet(), undefined);

                found = false;
                _iterator181 = _createForOfIteratorHelper(tx.getTxSet().getTxs());
                _context142.prev = 90;

                _iterator181.s();

              case 92:
                if ((_step181 = _iterator181.n()).done) {
                  _context142.next = 99;
                  break;
                }

                aTx = _step181.value;

                if (!(aTx === tx)) {
                  _context142.next = 97;
                  break;
                }

                found = true;
                return _context142.abrupt("break", 99);

              case 97:
                _context142.next = 92;
                break;

              case 99:
                _context142.next = 104;
                break;

              case 101:
                _context142.prev = 101;
                _context142.t4 = _context142["catch"](90);

                _iterator181.e(_context142.t4);

              case 104:
                _context142.prev = 104;

                _iterator181.f();

                return _context142.finish(104);

              case 107:
                if (ctx.isCopy) (0, _assert["default"])(!found); // copy will not have back reference from tx set
                else (0, _assert["default"])(found); // test common attributes

                config = ctx.config;

                _assert["default"].equal(tx.isConfirmed(), false);

                _context142.next = 112;
                return testTransfer(tx.getOutgoingTransfer(), ctx);

              case 112:
                _assert["default"].equal(tx.getRingSize(), _index.MoneroUtils.RING_SIZE);

                _assert["default"].equal(tx.getUnlockHeight(), config.getUnlockHeight() ? config.getUnlockHeight() : 0);

                _assert["default"].equal(tx.getBlock(), undefined);

                (0, _assert["default"])(tx.getKey().length > 0);

                _assert["default"].equal((0, _typeof2["default"])(tx.getFullHex()), "string");

                (0, _assert["default"])(tx.getFullHex().length > 0);
                (0, _assert["default"])(tx.getMetadata());

                _assert["default"].equal(tx.getReceivedTimestamp(), undefined);

                _assert["default"].equal(tx.isLocked(), true); // test locked state


                if (tx.getUnlockHeight() === 0) _assert["default"].equal(!tx.isLocked(), tx.isConfirmed());else _assert["default"].equal(tx.isLocked(), true);

                if (tx.getOutputs() !== undefined) {
                  _iterator182 = _createForOfIteratorHelper(tx.getOutputs());

                  try {
                    for (_iterator182.s(); !(_step182 = _iterator182.n()).done;) {
                      _output30 = _step182.value;

                      _assert["default"].equal(_output30.isLocked(), tx.isLocked());
                    }
                  } catch (err) {
                    _iterator182.e(err);
                  } finally {
                    _iterator182.f();
                  }
                } // test destinations of sent tx


                if (tx.getOutgoingTransfer().getDestinations() === undefined) (0, _assert["default"])(config.getCanSplit()); // TODO: destinations not returned from transfer_split
                else {
                  _assert["default"].equal(tx.getOutgoingTransfer().getDestinations().length, config.getDestinations().length);

                  for (i = 0; i < config.getDestinations().length; i++) {
                    _assert["default"].equal(tx.getOutgoingTransfer().getDestinations()[i].getAddress(), config.getDestinations()[i].getAddress());

                    if (ctx.isSweepResponse) {
                      _assert["default"].equal(config.getDestinations().length, 1);

                      _assert["default"].equal(config.getDestinations()[i].getAmount(), undefined);

                      _assert["default"].equal(tx.getOutgoingTransfer().getDestinations()[i].getAmount().toString(), tx.getOutgoingTransfer().getAmount().toString());
                    } else {
                      _assert["default"].equal(tx.getOutgoingTransfer().getDestinations()[i].getAmount().toString(), config.getDestinations()[i].getAmount().toString());
                    }
                  }
                } // test relayed txs

                if (config.getRelay()) {
                  _assert["default"].equal(tx.inTxPool(), true);

                  _assert["default"].equal(tx.getRelay(), true);

                  _assert["default"].equal(tx.isRelayed(), true);

                  (0, _assert["default"])(tx.getLastRelayedTimestamp() > 0);

                  _assert["default"].equal(tx.isDoubleSpendSeen(), false);
                } // test non-relayed txs
                else {
                  _assert["default"].equal(tx.inTxPool(), false);

                  _assert["default"].notEqual(tx.getRelay(), true);

                  _assert["default"].equal(tx.isRelayed(), false);

                  _assert["default"].equal(tx.getLastRelayedTimestamp(), undefined);

                  _assert["default"].equal(tx.isDoubleSpendSeen(), undefined);
                }

                _context142.next = 133;
                break;

              case 127:
                _assert["default"].equal(tx.getTxSet(), undefined); // tx set only initialized on send responses


                _assert["default"].equal(tx.getRingSize(), undefined);

                _assert["default"].equal(tx.getKey(), undefined);

                _assert["default"].equal(tx.getFullHex(), undefined);

                _assert["default"].equal(tx.getMetadata(), undefined);

                _assert["default"].equal(tx.getLastRelayedTimestamp(), undefined);

              case 133:
                // test inputs
                if (tx.isOutgoing() && ctx.isSendResponse) {
                  (0, _assert["default"])(tx.getInputs() !== undefined);
                  (0, _assert["default"])(tx.getInputs().length > 0);
                } else {
                  if (tx.getInputs()) {
                    _iterator183 = _createForOfIteratorHelper(tx.getInputs());

                    try {
                      for (_iterator183.s(); !(_step183 = _iterator183.n()).done;) {
                        _input2 = _step183.value;
                        testInputWallet(output);
                      }
                    } catch (err) {
                      _iterator183.e(err);
                    } finally {
                      _iterator183.f();
                    }
                  }
                } // test outputs


                if (tx.isIncoming() && ctx.includeOutputs) {
                  if (tx.isConfirmed()) {
                    (0, _assert["default"])(tx.getOutputs() !== undefined);
                    (0, _assert["default"])(tx.getOutputs().length > 0);
                  } else {
                    (0, _assert["default"])(tx.getOutputs() === undefined);
                  }
                }

                if (tx.getOutputs()) {
                  _iterator184 = _createForOfIteratorHelper(tx.getOutputs());

                  try {
                    for (_iterator184.s(); !(_step184 = _iterator184.n()).done;) {
                      _output31 = _step184.value;
                      testOutputWallet(_output31);
                    }
                  } catch (err) {
                    _iterator184.e(err);
                  } finally {
                    _iterator184.f();
                  }
                } // test deep copy


                if (ctx.isCopy) {
                  _context142.next = 139;
                  break;
                }

                _context142.next = 139;
                return this._testTxWalletCopy(tx, ctx);

              case 139:
              case "end":
                return _context142.stop();
            }
          }
        }, _callee140, this, [[53, 74, 77, 80], [90, 101, 104, 107]]);
      }));

      function _testTxWallet(_x48, _x49) {
        return _testTxWallet2.apply(this, arguments);
      }

      return _testTxWallet;
    }() // TODO: move below _testTxWalletCopy

  }, {
    key: "_testTxWalletCopy",
    value: function () {
      var _testTxWalletCopy2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee141(tx, ctx) {
        var copy, i, _i25, _i26, _i27, merged;

        return _regenerator["default"].wrap(function _callee141$(_context143) {
          while (1) {
            switch (_context143.prev = _context143.next) {
              case 0:
                // copy tx and assert deep equality
                copy = tx.copy();
                (0, _assert["default"])(copy instanceof _index.MoneroTxWallet);

                _assert["default"].deepEqual(copy.toJson(), tx.toJson()); // test different references


                if (tx.getOutgoingTransfer()) {
                  (0, _assert["default"])(tx.getOutgoingTransfer() !== copy.getOutgoingTransfer());
                  (0, _assert["default"])(tx.getOutgoingTransfer().getTx() !== copy.getOutgoingTransfer().getTx()); //assert(tx.getOutgoingTransfer().getAmount() !== copy.getOutgoingTransfer().getAmount());  // TODO: BI 0 === BI 0?, testing this instead:

                  if (tx.getOutgoingTransfer().getAmount() === copy.getOutgoingTransfer().getAmount()) (0, _assert["default"])(BitIntegerCompare(tx.getOutgoingTransfer().getAmount(), BigInt(0)) === 0);

                  if (tx.getOutgoingTransfer().getDestinations()) {
                    (0, _assert["default"])(tx.getOutgoingTransfer().getDestinations() !== copy.getOutgoingTransfer().getDestinations());

                    for (i = 0; i < tx.getOutgoingTransfer().getDestinations().length; i++) {
                      _assert["default"].deepEqual(copy.getOutgoingTransfer().getDestinations()[i], tx.getOutgoingTransfer().getDestinations()[i]);

                      (0, _assert["default"])(tx.getOutgoingTransfer().getDestinations()[i] !== copy.getOutgoingTransfer().getDestinations()[i]);
                      if (tx.getOutgoingTransfer().getDestinations()[i].getAmount() === copy.getOutgoingTransfer().getDestinations()[i].getAmount()) (0, _assert["default"])(tx.getOutgoingTransfer().getDestinations()[i].getAmount().toJSValue() === 0);
                    }
                  }
                }

                if (tx.getIncomingTransfers()) {
                  for (_i25 = 0; _i25 < tx.getIncomingTransfers().length; _i25++) {
                    _assert["default"].deepEqual(copy.getIncomingTransfers()[_i25].toJson(), tx.getIncomingTransfers()[_i25].toJson());

                    (0, _assert["default"])(tx.getIncomingTransfers()[_i25] !== copy.getIncomingTransfers()[_i25]);
                    if (tx.getIncomingTransfers()[_i25].getAmount() == copy.getIncomingTransfers()[_i25].getAmount()) (0, _assert["default"])(tx.getIncomingTransfers()[_i25].getAmount().toJSValue() === 0);
                  }
                }

                if (tx.getInputs()) {
                  for (_i26 = 0; _i26 < tx.getInputs().length; _i26++) {
                    _assert["default"].deepEqual(copy.getInputs()[_i26].toJson(), tx.getInputs()[_i26].toJson());

                    (0, _assert["default"])(tx.getInputs()[_i26] !== copy.getInputs()[_i26]);
                  }
                }

                if (tx.getOutputs()) {
                  for (_i27 = 0; _i27 < tx.getOutputs().length; _i27++) {
                    _assert["default"].deepEqual(copy.getOutputs()[_i27].toJson(), tx.getOutputs()[_i27].toJson());

                    (0, _assert["default"])(tx.getOutputs()[_i27] !== copy.getOutputs()[_i27]);
                    if (tx.getOutputs()[_i27].getAmount() == copy.getOutputs()[_i27].getAmount()) (0, _assert["default"])(tx.getOutputs()[_i27].getAmount().toJSValue() === 0);
                  }
                } // test copied tx


                ctx = Object.assign({}, ctx);
                ctx.isCopy = true;
                if (tx.getBlock()) copy.setBlock(tx.getBlock().copy().setTxs([copy])); // copy block for testing

                _context143.next = 12;
                return this._testTxWallet(copy, ctx);

              case 12:
                // test merging with copy
                merged = copy.merge(copy.copy());

                _assert["default"].equal(merged.toString(), tx.toString());

              case 14:
              case "end":
                return _context143.stop();
            }
          }
        }, _callee141, this);
      }));

      function _testTxWalletCopy(_x50, _x51) {
        return _testTxWalletCopy2.apply(this, arguments);
      }

      return _testTxWalletCopy;
    }()
  }, {
    key: "_testMultisig",
    value: function () {
      var _testMultisig2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee142(M, N, testTx) {
        var participants, i, err, _i28, _participants, participant;

        return _regenerator["default"].wrap(function _callee142$(_context144) {
          while (1) {
            switch (_context144.prev = _context144.next) {
              case 0:
                // create N participants
                participants = [];
                i = 0;

              case 2:
                if (!(i < N)) {
                  _context144.next = 11;
                  break;
                }

                _context144.t0 = participants;
                _context144.next = 6;
                return this.createWallet(new _index.MoneroWalletConfig());

              case 6:
                _context144.t1 = _context144.sent;

                _context144.t0.push.call(_context144.t0, _context144.t1);

              case 8:
                i++;
                _context144.next = 2;
                break;

              case 11:
                _context144.prev = 11;
                _context144.next = 14;
                return this._testMultisigParticipants(participants, M, N, testTx);

              case 14:
                _context144.next = 19;
                break;

              case 16:
                _context144.prev = 16;
                _context144.t2 = _context144["catch"](11);
                err = _context144.t2;

              case 19:
                _context144.prev = 19;
                _context144.next = 22;
                return this.daemon.stopMining();

              case 22:
                _context144.next = 26;
                break;

              case 24:
                _context144.prev = 24;
                _context144.t3 = _context144["catch"](19);

              case 26:
                _i28 = 0, _participants = participants;

              case 27:
                if (!(_i28 < _participants.length)) {
                  _context144.next = 34;
                  break;
                }

                participant = _participants[_i28];
                _context144.next = 31;
                return this.closeWallet(participant, true);

              case 31:
                _i28++;
                _context144.next = 27;
                break;

              case 34:
                if (!err) {
                  _context144.next = 36;
                  break;
                }

                throw err;

              case 36:
              case "end":
                return _context144.stop();
            }
          }
        }, _callee142, this, [[11, 16], [19, 24]]);
      }));

      function _testMultisig(_x52, _x53, _x54) {
        return _testMultisig2.apply(this, arguments);
      }

      return _testMultisig;
    }()
  }, {
    key: "_testMultisigParticipants",
    value: function () {
      var _testMultisigParticipants2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee143(participants, M, N, testTx) {
        var preparedMultisigHexes, i, _participant, madeMultisigHexes, _i29, _participant2, peerMultisigHexes, j, multisigHex, address, prevMultisigHexes, _i30, exchangeMultisigHexes, _j2, _participant3, _peerMultisigHexes, k, result, participant, accountIdx, destinations, _i31, returnAddress, lastNumConfirmations, _outputs2, height, numConfirmations, _iterator185, _step185, _output32, _i32, outputs, _iterator186, _step186, _output33, txs, txSet, multisigTxHex, _i33, _result, txHashes, multisigTxs, _i34, _result2, _iterator187, _step187, tx, found, _iterator188, _step188, aTx, _i35, _result3;

        return _regenerator["default"].wrap(function _callee143$(_context145) {
          while (1) {
            switch (_context145.prev = _context145.next) {
              case 0:
                console.log("_testMultisig(" + M + ", " + N + ")");

                _assert["default"].equal(N, participants.length); // prepare multisig hexes


                preparedMultisigHexes = [];
                i = 0;

              case 4:
                if (!(i < N)) {
                  _context145.next = 14;
                  break;
                }

                _participant = participants[i];
                _context145.t0 = preparedMultisigHexes;
                _context145.next = 9;
                return _participant.prepareMultisig();

              case 9:
                _context145.t1 = _context145.sent;

                _context145.t0.push.call(_context145.t0, _context145.t1);

              case 11:
                i++;
                _context145.next = 4;
                break;

              case 14:
                // make wallets multisig
                madeMultisigHexes = [];
                _i29 = 0;

              case 16:
                if (!(_i29 < participants.length)) {
                  _context145.next = 38;
                  break;
                }

                _participant2 = participants[_i29]; // collect prepared multisig hexes from wallet's peers

                peerMultisigHexes = [];

                for (j = 0; j < participants.length; j++) {
                  if (j !== _i29) peerMultisigHexes.push(preparedMultisigHexes[j]);
                } // test bad input


                _context145.prev = 20;
                _context145.next = 23;
                return _participant2.makeMultisig(["asd", "dsa"], M, _TestUtils["default"].WALLET_PASSWORD);

              case 23:
                throw new Error("Should have thrown error making wallet multisig with bad input");

              case 26:
                _context145.prev = 26;
                _context145.t2 = _context145["catch"](20);

                if (_context145.t2 instanceof MoneroError) {
                  _context145.next = 30;
                  break;
                }

                throw _context145.t2;

              case 30:
                _assert["default"].equal(_context145.t2.message, "basic_string"); // TODO (monero-project): improve error message https://github.com/monero-project/monero/issues/8493


              case 31:
                _context145.next = 33;
                return _participant2.makeMultisig(peerMultisigHexes, M, _TestUtils["default"].WALLET_PASSWORD);

              case 33:
                multisigHex = _context145.sent;
                madeMultisigHexes.push(multisigHex);

              case 35:
                _i29++;
                _context145.next = 16;
                break;

              case 38:
                // exchange keys N - M + 1 times
                address = undefined;

                _assert["default"].equal(madeMultisigHexes.length, N);

                prevMultisigHexes = madeMultisigHexes;
                _i30 = 0;

              case 42:
                if (!(_i30 < N - M + 1)) {
                  _context145.next = 73;
                  break;
                }

                //console.log("Exchanging multisig keys round " + (i + 1) + " / " + (N - M));
                // exchange multisig keys with each wallet and collect results
                exchangeMultisigHexes = [];
                _j2 = 0;

              case 45:
                if (!(_j2 < participants.length)) {
                  _context145.next = 69;
                  break;
                }

                _participant3 = participants[_j2]; // test bad input

                _context145.prev = 47;
                _context145.next = 50;
                return _participant3.exchangeMultisigKeys([], _TestUtils["default"].WALLET_PASSWORD);

              case 50:
                throw new Error("Should have thrown error exchanging multisig keys with bad input");

              case 53:
                _context145.prev = 53;
                _context145.t3 = _context145["catch"](47);

                if (_context145.t3 instanceof MoneroError) {
                  _context145.next = 57;
                  break;
                }

                throw _context145.t3;

              case 57:
                (0, _assert["default"])(_context145.t3.message.length > 0);

              case 58:
                // collect the multisig hexes of the wallet's peers from last round
                _peerMultisigHexes = [];

                for (k = 0; k < participants.length; k++) {
                  if (k !== _j2) _peerMultisigHexes.push(prevMultisigHexes[k]);
                } // import the multisig hexes of the wallet's peers


                _context145.next = 62;
                return _participant3.exchangeMultisigKeys(_peerMultisigHexes, _TestUtils["default"].WALLET_PASSWORD);

              case 62:
                result = _context145.sent;

                // test result
                _assert["default"].notEqual(result.getMultisigHex(), undefined);

                (0, _assert["default"])(result.getMultisigHex().length > 0);

                if (_i30 === N - M) {
                  // result on last round has address
                  _assert["default"].notEqual(result.getAddress(), undefined);

                  (0, _assert["default"])(result.getAddress().length > 0);
                  if (address === undefined) address = result.getAddress();else _assert["default"].equal(result.getAddress(), address);
                } else {
                  _assert["default"].equal(result.getAddress(), undefined);

                  exchangeMultisigHexes.push(result.getMultisigHex());
                }

              case 66:
                _j2++;
                _context145.next = 45;
                break;

              case 69:
                // use results for next round of exchange
                prevMultisigHexes = exchangeMultisigHexes;

              case 70:
                _i30++;
                _context145.next = 42;
                break;

              case 73:
                // validate final multisig address
                participant = participants[0];
                _context145.t4 = _index.MoneroUtils;
                _context145.next = 77;
                return participant.getPrimaryAddress();

              case 77:
                _context145.t5 = _context145.sent;
                _context145.t6 = _TestUtils["default"].NETWORK_TYPE;
                _context145.next = 81;
                return _context145.t4.validateAddress.call(_context145.t4, _context145.t5, _context145.t6);

              case 81:
                _context145.t7 = this;
                _context145.next = 84;
                return participant.getMultisigInfo();

              case 84:
                _context145.t8 = _context145.sent;
                _context145.t9 = M;
                _context145.t10 = N;

                _context145.t7._testMultisigInfo.call(_context145.t7, _context145.t8, _context145.t9, _context145.t10);

                if (!testTx) {
                  _context145.next = 352;
                  break;
                }

                _context145.next = 91;
                return participant.createAccount();

              case 91:
                // get destinations to subaddresses within the account of the multisig wallet
                accountIdx = 1;
                destinations = [];
                _i31 = 0;

              case 94:
                if (!(_i31 < 3)) {
                  _context145.next = 108;
                  break;
                }

                _context145.next = 97;
                return participant.createSubaddress(accountIdx);

              case 97:
                _context145.t11 = destinations;
                _context145.t12 = _index.MoneroDestination;
                _context145.next = 101;
                return participant.getAddress(accountIdx, _i31);

              case 101:
                _context145.t13 = _context145.sent;
                _context145.t14 = _TestUtils["default"].MAX_FEE * BigInt(2);
                _context145.t15 = new _context145.t12(_context145.t13, _context145.t14);

                _context145.t11.push.call(_context145.t11, _context145.t15);

              case 105:
                _i31++;
                _context145.next = 94;
                break;

              case 108:
                _context145.next = 110;
                return _TestUtils["default"].WALLET_TX_TRACKER.waitForWalletTxsToClearPool(this.wallet);

              case 110:
                _context145.next = 112;
                return _TestUtils["default"].WALLET_TX_TRACKER.waitForUnlockedBalance(this.wallet, 0, undefined, _TestUtils["default"].MAX_FEE * BigInt("20"));

              case 112:
                _context145.t16 = _assert["default"];
                _context145.t17 = BitIntegerCompare;
                _context145.next = 116;
                return this.wallet.getBalance();

              case 116:
                _context145.t18 = _context145.sent;
                _context145.t19 = BigInt(0);
                _context145.t20 = (0, _context145.t17)(_context145.t18, _context145.t19);
                _context145.t21 = _context145.t20 > 0;
                (0, _context145.t16)(_context145.t21);
                console.log("Sending funds from main wallet");
                _context145.next = 124;
                return this.wallet.createTx({
                  accountIndex: 0,
                  destinations: destinations,
                  relay: true
                });

              case 124:
                _context145.next = 126;
                return this.wallet.getPrimaryAddress();

              case 126:
                returnAddress = _context145.sent;
                // funds will be returned to this address from the multisig wallet
                console.log("Starting mining"); // start mining to push the network along

                _context145.next = 130;
                return _StartMining["default"].startMining();

              case 130:
                // wait for the multisig wallet's funds to unlock // TODO: replace with MoneroWalletListener.onOutputReceived() which is called when output unlocked
                lastNumConfirmations = undefined;

              case 131:
                if (!true) {
                  _context145.next = 153;
                  break;
                }

                _context145.next = 134;
                return new Promise(function (resolve) {
                  setTimeout(resolve, _TestUtils["default"].SYNC_PERIOD_IN_MS);
                });

              case 134:
                _context145.next = 136;
                return participant.getOutputs();

              case 136:
                _outputs2 = _context145.sent;

                if (!(_outputs2.length === 0)) {
                  _context145.next = 141;
                  break;
                }

                console.log("No outputs reported yet");
                _context145.next = 151;
                break;

              case 141:
                _context145.next = 143;
                return this.daemon.getHeight();

              case 143:
                height = _context145.sent;
                numConfirmations = height - _outputs2[0].getTx().getHeight();
                if (lastNumConfirmations === undefined || lastNumConfirmations !== numConfirmations) console.log("Output has " + (height - _outputs2[0].getTx().getHeight()) + " confirmations");
                lastNumConfirmations = numConfirmations; // outputs are not spent

                _iterator185 = _createForOfIteratorHelper(_outputs2);

                try {
                  for (_iterator185.s(); !(_step185 = _iterator185.n()).done;) {
                    _output32 = _step185.value;
                    (0, _assert["default"])(_output32.isSpent() === false);
                  } // break if output is unlocked

                } catch (err) {
                  _iterator185.e(err);
                } finally {
                  _iterator185.f();
                }

                if (_outputs2[0].isLocked()) {
                  _context145.next = 151;
                  break;
                }

                return _context145.abrupt("break", 153);

              case 151:
                _context145.next = 131;
                break;

              case 153:
                _context145.next = 155;
                return this.daemon.stopMining();

              case 155:
                _i32 = 0;

              case 156:
                if (!(_i32 < 3)) {
                  _context145.next = 169;
                  break;
                }

                _context145.t22 = _assert["default"];
                _context145.t23 = BitIntegerCompare;
                _context145.next = 161;
                return participant.getUnlockedBalance(1, _i32);

              case 161:
                _context145.t24 = _context145.sent;
                _context145.t25 = BigInt("0");
                _context145.t26 = (0, _context145.t23)(_context145.t24, _context145.t25);
                _context145.t27 = _context145.t26 > 0;
                (0, _context145.t22)(_context145.t27);

              case 166:
                _i32++;
                _context145.next = 156;
                break;

              case 169:
                _context145.next = 171;
                return participant.getOutputs({
                  accountIndex: 1
                });

              case 171:
                outputs = _context145.sent;
                (0, _assert["default"])(outputs.length > 0);
                if (outputs.length < 3) console.log("WARNING: not one output per subaddress?"); //assert(outputs.length >= 3);  // TODO

                _iterator186 = _createForOfIteratorHelper(outputs);

                try {
                  for (_iterator186.s(); !(_step186 = _iterator186.n()).done;) {
                    _output33 = _step186.value;

                    _assert["default"].equal(_output33.isLocked(), false);
                  } // wallet requires importing multisig to be reliable

                } catch (err) {
                  _iterator186.e(err);
                } finally {
                  _iterator186.f();
                }

                _context145.t28 = _assert["default"];
                _context145.next = 179;
                return participant.isMultisigImportNeeded();

              case 179:
                _context145.t29 = _context145.sent;
                (0, _context145.t28)(_context145.t29);
                _context145.prev = 181;
                _context145.next = 184;
                return participant.createTx({
                  accountIndex: 1,
                  address: returnAddress,
                  amount: _TestUtils["default"].MAX_FEE * BigInt(3)
                });

              case 184:
                throw new Error("Should have failed sending funds without synchronizing with peers");

              case 187:
                _context145.prev = 187;
                _context145.t30 = _context145["catch"](181);

                _assert["default"].equal(_context145.t30.message, "No transaction created");

              case 190:
                // synchronize the multisig participants since receiving outputs
                console.log("Synchronizing participants");
                _context145.next = 193;
                return this._synchronizeMultisigParticipants(participants);

              case 193:
                _context145.prev = 193;
                _context145.next = 196;
                return participant.createTxs({
                  address: returnAddress,
                  amount: _TestUtils["default"].MAX_FEE,
                  accountIndex: 1,
                  subaddressIndex: 0,
                  relay: true
                });

              case 196:
                throw new Error("Should have failed");

              case 199:
                _context145.prev = 199;
                _context145.t31 = _context145["catch"](193);

                _assert["default"].equal(_context145.t31.message, "Cannot relay multisig transaction until co-signed");

              case 202:
                // send funds from a subaddress in the multisig wallet
                console.log("Sending");
                _context145.next = 205;
                return participant.createTxs({
                  address: returnAddress,
                  amount: _TestUtils["default"].MAX_FEE,
                  accountIndex: 1,
                  subaddressIndex: 0
                });

              case 205:
                txs = _context145.sent;
                (0, _assert["default"])(txs.length > 0);
                txSet = txs[0].getTxSet();

                _assert["default"].notEqual(txSet.getMultisigTxHex(), undefined);

                _assert["default"].equal(txSet.getSignedTxHex(), undefined);

                _assert["default"].equal(txSet.getUnsignedTxHex(), undefined); // parse multisig tx hex and test


                _context145.t32 = testDescribedTxSet;
                _context145.next = 214;
                return participant.describeMultisigTxSet(txSet.getMultisigTxHex());

              case 214:
                _context145.t33 = _context145.sent;
                _context145.next = 217;
                return (0, _context145.t32)(_context145.t33);

              case 217:
                // sign the tx with participants 1 through M - 1 to meet threshold
                multisigTxHex = txSet.getMultisigTxHex();
                console.log("Signing");
                _i33 = 1;

              case 220:
                if (!(_i33 < M)) {
                  _context145.next = 228;
                  break;
                }

                _context145.next = 223;
                return participants[_i33].signMultisigTxHex(multisigTxHex);

              case 223:
                _result = _context145.sent;
                multisigTxHex = _result.getSignedMultisigTxHex();

              case 225:
                _i33++;
                _context145.next = 220;
                break;

              case 228:
                //console.log("Submitting signed multisig tx hex: " + multisigTxHex);
                // submit the signed multisig tx hex to the network
                console.log("Submitting");
                _context145.next = 231;
                return participant.submitMultisigTxHex(multisigTxHex);

              case 231:
                txHashes = _context145.sent;
                // synchronize the multisig participants since spending outputs
                console.log("Synchronizing participants");
                _context145.next = 235;
                return this._synchronizeMultisigParticipants(participants);

              case 235:
                _context145.next = 237;
                return participant.getTxs({
                  hashes: txHashes
                });

              case 237:
                multisigTxs = _context145.sent;

                _assert["default"].equal(txHashes.length, multisigTxs.length); // sweep an output from subaddress [1,1]


                _context145.next = 241;
                return participant.getOutputs({
                  accountIndex: 1,
                  subaddressIndex: 1
                });

              case 241:
                outputs = _context145.sent;
                (0, _assert["default"])(outputs.length > 0);
                (0, _assert["default"])(outputs[0].isSpent() === false);
                _context145.next = 246;
                return participant.sweepOutput({
                  address: returnAddress,
                  keyImage: outputs[0].getKeyImage().getHex(),
                  relay: true
                });

              case 246:
                txSet = _context145.sent.getTxSet();

                _assert["default"].notEqual(txSet.getMultisigTxHex(), undefined);

                _assert["default"].equal(txSet.getSignedTxHex(), undefined);

                _assert["default"].equal(txSet.getUnsignedTxHex(), undefined);

                (0, _assert["default"])(txSet.getTxs().length > 0); // parse multisig tx hex and test

                _context145.t34 = testDescribedTxSet;
                _context145.next = 254;
                return participant.describeMultisigTxSet(txSet.getMultisigTxHex());

              case 254:
                _context145.t35 = _context145.sent;
                _context145.next = 257;
                return (0, _context145.t34)(_context145.t35);

              case 257:
                // sign the tx with participants 1 through M - 1 to meet threshold
                multisigTxHex = txSet.getMultisigTxHex();
                console.log("Signing sweep output");
                _i34 = 1;

              case 260:
                if (!(_i34 < M)) {
                  _context145.next = 268;
                  break;
                }

                _context145.next = 263;
                return participants[_i34].signMultisigTxHex(multisigTxHex);

              case 263:
                _result2 = _context145.sent;
                multisigTxHex = _result2.getSignedMultisigTxHex();

              case 265:
                _i34++;
                _context145.next = 260;
                break;

              case 268:
                // submit the signed multisig tx hex to the network
                console.log("Submitting sweep output");
                _context145.next = 271;
                return participant.submitMultisigTxHex(multisigTxHex);

              case 271:
                txHashes = _context145.sent;
                // synchronize the multisig participants since spending outputs
                console.log("Synchronizing participants");
                _context145.next = 275;
                return this._synchronizeMultisigParticipants(participants);

              case 275:
                _context145.next = 277;
                return participant.getTxs({
                  hashes: txHashes
                });

              case 277:
                multisigTxs = _context145.sent;

                _assert["default"].equal(txHashes.length, multisigTxs.length); // sweep remaining balance


                console.log("Sweeping");
                _context145.next = 282;
                return participant.sweepUnlocked({
                  address: returnAddress,
                  accountIndex: 1,
                  relay: true
                });

              case 282:
                txs = _context145.sent;
                // TODO: test multisig with sweepEachSubaddress which will generate multiple tx sets without synchronizing participants
                (0, _assert["default"])(txs.length > 0, "No txs created on sweepUnlocked");
                txSet = txs[0].getTxSet();
                _iterator187 = _createForOfIteratorHelper(txs);
                _context145.prev = 286;

                _iterator187.s();

              case 288:
                if ((_step187 = _iterator187.n()).done) {
                  _context145.next = 313;
                  break;
                }

                tx = _step187.value;
                (0, _assert["default"])(tx.getTxSet() === txSet); // only one tx set created per account

                found = false;
                _iterator188 = _createForOfIteratorHelper(tx.getTxSet().getTxs());
                _context145.prev = 293;

                _iterator188.s();

              case 295:
                if ((_step188 = _iterator188.n()).done) {
                  _context145.next = 302;
                  break;
                }

                aTx = _step188.value;

                if (!(aTx === tx)) {
                  _context145.next = 300;
                  break;
                }

                found = true;
                return _context145.abrupt("break", 302);

              case 300:
                _context145.next = 295;
                break;

              case 302:
                _context145.next = 307;
                break;

              case 304:
                _context145.prev = 304;
                _context145.t36 = _context145["catch"](293);

                _iterator188.e(_context145.t36);

              case 307:
                _context145.prev = 307;

                _iterator188.f();

                return _context145.finish(307);

              case 310:
                (0, _assert["default"])(found); // tx is contained in tx set

              case 311:
                _context145.next = 288;
                break;

              case 313:
                _context145.next = 318;
                break;

              case 315:
                _context145.prev = 315;
                _context145.t37 = _context145["catch"](286);

                _iterator187.e(_context145.t37);

              case 318:
                _context145.prev = 318;

                _iterator187.f();

                return _context145.finish(318);

              case 321:
                _assert["default"].notEqual(txSet.getMultisigTxHex(), undefined);

                _assert["default"].equal(txSet.getSignedTxHex(), undefined);

                _assert["default"].equal(txSet.getUnsignedTxHex(), undefined); // parse multisig tx hex and test


                _context145.t38 = testDescribedTxSet;
                _context145.next = 327;
                return participant.describeTxSet(txSet);

              case 327:
                _context145.t39 = _context145.sent;
                _context145.next = 330;
                return (0, _context145.t38)(_context145.t39);

              case 330:
                // sign the tx with participants 1 through M - 1 to meet threshold
                multisigTxHex = txSet.getMultisigTxHex();
                console.log("Signing sweep");
                _i35 = 1;

              case 333:
                if (!(_i35 < M)) {
                  _context145.next = 341;
                  break;
                }

                _context145.next = 336;
                return participants[_i35].signMultisigTxHex(multisigTxHex);

              case 336:
                _result3 = _context145.sent;
                multisigTxHex = _result3.getSignedMultisigTxHex();

              case 338:
                _i35++;
                _context145.next = 333;
                break;

              case 341:
                // submit the signed multisig tx hex to the network
                console.log("Submitting sweep");
                _context145.next = 344;
                return participant.submitMultisigTxHex(multisigTxHex);

              case 344:
                txHashes = _context145.sent;
                // synchronize the multisig participants since spending outputs
                console.log("Synchronizing participants");
                _context145.next = 348;
                return this._synchronizeMultisigParticipants(participants);

              case 348:
                _context145.next = 350;
                return participant.getTxs({
                  hashes: txHashes
                });

              case 350:
                multisigTxs = _context145.sent;

                _assert["default"].equal(txHashes.length, multisigTxs.length);

              case 352:
              case "end":
                return _context145.stop();
            }
          }
        }, _callee143, this, [[20, 26], [47, 53], [181, 187], [193, 199], [286, 315, 318, 321], [293, 304, 307, 310]]);
      }));

      function _testMultisigParticipants(_x55, _x56, _x57, _x58) {
        return _testMultisigParticipants2.apply(this, arguments);
      }

      return _testMultisigParticipants;
    }()
  }, {
    key: "_synchronizeMultisigParticipants",
    value: function () {
      var _synchronizeMultisigParticipants2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee144(wallets) {
        var multisigHexes, _iterator189, _step189, _wallet6, i, peerMultisigHexes, j, _wallet5;

        return _regenerator["default"].wrap(function _callee144$(_context146) {
          while (1) {
            switch (_context146.prev = _context146.next) {
              case 0:
                // collect multisig hex of all participants to synchronize
                multisigHexes = [];
                _iterator189 = _createForOfIteratorHelper(wallets);
                _context146.prev = 2;

                _iterator189.s();

              case 4:
                if ((_step189 = _iterator189.n()).done) {
                  _context146.next = 15;
                  break;
                }

                _wallet6 = _step189.value;
                _context146.next = 8;
                return _wallet6.sync();

              case 8:
                _context146.t0 = multisigHexes;
                _context146.next = 11;
                return _wallet6.exportMultisigHex();

              case 11:
                _context146.t1 = _context146.sent;

                _context146.t0.push.call(_context146.t0, _context146.t1);

              case 13:
                _context146.next = 4;
                break;

              case 15:
                _context146.next = 20;
                break;

              case 17:
                _context146.prev = 17;
                _context146.t2 = _context146["catch"](2);

                _iterator189.e(_context146.t2);

              case 20:
                _context146.prev = 20;

                _iterator189.f();

                return _context146.finish(20);

              case 23:
                i = 0;

              case 24:
                if (!(i < wallets.length)) {
                  _context146.next = 35;
                  break;
                }

                peerMultisigHexes = [];

                for (j = 0; j < wallets.length; j++) {
                  if (j !== i) peerMultisigHexes.push(multisigHexes[j]);
                }

                _wallet5 = wallets[i];
                _context146.next = 30;
                return _wallet5.sync();

              case 30:
                _context146.next = 32;
                return _wallet5.importMultisigHex(peerMultisigHexes);

              case 32:
                i++;
                _context146.next = 24;
                break;

              case 35:
              case "end":
                return _context146.stop();
            }
          }
        }, _callee144, null, [[2, 17, 20, 23]]);
      }));

      function _synchronizeMultisigParticipants(_x59) {
        return _synchronizeMultisigParticipants2.apply(this, arguments);
      }

      return _synchronizeMultisigParticipants;
    }()
  }, {
    key: "_testMultisigInfo",
    value: function () {
      var _testMultisigInfo2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee145(info, M, N) {
        return _regenerator["default"].wrap(function _callee145$(_context147) {
          while (1) {
            switch (_context147.prev = _context147.next) {
              case 0:
                (0, _assert["default"])(info.isMultisig());
                (0, _assert["default"])(info.isReady());

                _assert["default"].equal(info.getThreshold(), M);

                _assert["default"].equal(info.getNumParticipants(), N);

              case 4:
              case "end":
                return _context147.stop();
            }
          }
        }, _callee145);
      }));

      function _testMultisigInfo(_x60, _x61, _x62) {
        return _testMultisigInfo2.apply(this, arguments);
      }

      return _testMultisigInfo;
    }()
  }, {
    key: "_testViewOnlyAndOfflineWallets",
    value: function () {
      var _testViewOnlyAndOfflineWallets2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee146(viewOnlyWallet, offlineWallet) {
        var primaryAddress, privateViewKey, outputsHex, numOutputsImported, keyImages, unsignedTx, signedTxHex, describedTxSet, txHashes;
        return _regenerator["default"].wrap(function _callee146$(_context148) {
          while (1) {
            switch (_context148.prev = _context148.next) {
              case 0:
                _context148.next = 2;
                return _TestUtils["default"].WALLET_TX_TRACKER.waitForWalletTxsToClearPool(this.wallet);

              case 2:
                _context148.next = 4;
                return _TestUtils["default"].WALLET_TX_TRACKER.waitForUnlockedBalance(this.wallet, 0, undefined, _TestUtils["default"].MAX_FEE * BigInt("4"));

              case 4:
                _context148.t0 = _assert["default"];
                _context148.next = 7;
                return viewOnlyWallet.getTxs();

              case 7:
                _context148.t1 = _context148.sent.length;
                (0, _context148.t0)(_context148.t1, "View-only wallet has no transactions");
                _context148.t2 = _assert["default"];
                _context148.next = 12;
                return viewOnlyWallet.getTransfers();

              case 12:
                _context148.t3 = _context148.sent.length;
                (0, _context148.t2)(_context148.t3, "View-only wallet has no transfers");
                _context148.t4 = _assert["default"];
                _context148.next = 17;
                return viewOnlyWallet.getOutputs();

              case 17:
                _context148.t5 = _context148.sent.length;
                (0, _context148.t4)(_context148.t5, "View-only wallet has no outputs");
                _context148.next = 21;
                return this.wallet.getPrimaryAddress();

              case 21:
                primaryAddress = _context148.sent;
                _context148.next = 24;
                return this.wallet.getPrivateViewKey();

              case 24:
                privateViewKey = _context148.sent;
                _context148.t6 = _assert["default"];
                _context148.next = 28;
                return viewOnlyWallet.getPrimaryAddress();

              case 28:
                _context148.t7 = _context148.sent;
                _context148.t8 = primaryAddress;

                _context148.t6.equal.call(_context148.t6, _context148.t7, _context148.t8);

                _context148.t9 = _assert["default"];
                _context148.next = 34;
                return viewOnlyWallet.getPrivateViewKey();

              case 34:
                _context148.t10 = _context148.sent;
                _context148.t11 = privateViewKey;

                _context148.t9.equal.call(_context148.t9, _context148.t10, _context148.t11);

                _context148.t12 = _assert["default"];
                _context148.next = 40;
                return viewOnlyWallet.getPrivateSpendKey();

              case 40:
                _context148.t13 = _context148.sent;
                _context148.t14 = undefined;

                _context148.t12.equal.call(_context148.t12, _context148.t13, _context148.t14);

                _context148.t15 = _assert["default"];
                _context148.next = 46;
                return viewOnlyWallet.getMnemonic();

              case 46:
                _context148.t16 = _context148.sent;
                _context148.t17 = undefined;

                _context148.t15.equal.call(_context148.t15, _context148.t16, _context148.t17);

                _context148.t18 = _assert["default"];
                _context148.next = 52;
                return viewOnlyWallet.getMnemonicLanguage();

              case 52:
                _context148.t19 = _context148.sent;
                _context148.t20 = undefined;

                _context148.t18.equal.call(_context148.t18, _context148.t19, _context148.t20);

                _context148.t21 = _assert["default"];
                _context148.next = 58;
                return viewOnlyWallet.isViewOnly();

              case 58:
                _context148.t22 = _context148.sent;
                (0, _context148.t21)(_context148.t22);
                _context148.t23 = _assert["default"];
                _context148.next = 63;
                return viewOnlyWallet.isConnectedToDaemon();

              case 63:
                _context148.t24 = _context148.sent;
                (0, _context148.t23)(_context148.t24, "Wallet created from keys is not connected to authenticated daemon");
                _context148.t25 = _assert["default"];
                _context148.next = 68;
                return viewOnlyWallet.getMnemonic();

              case 68:
                _context148.t26 = _context148.sent;
                _context148.t27 = undefined;

                _context148.t25.equal.call(_context148.t25, _context148.t26, _context148.t27);

                _context148.next = 73;
                return viewOnlyWallet.sync();

              case 73:
                _context148.t28 = _assert["default"];
                _context148.next = 76;
                return viewOnlyWallet.getTxs();

              case 76:
                _context148.t29 = _context148.sent.length;
                _context148.t30 = _context148.t29 > 0;
                (0, _context148.t28)(_context148.t30);
                _context148.next = 81;
                return viewOnlyWallet.exportOutputs();

              case 81:
                outputsHex = _context148.sent;
                _context148.t31 = _assert["default"];
                _context148.next = 85;
                return offlineWallet.isConnectedToDaemon();

              case 85:
                _context148.t32 = !_context148.sent;
                (0, _context148.t31)(_context148.t32);
                _context148.t33 = _assert["default"];
                _context148.next = 90;
                return offlineWallet.isViewOnly();

              case 90:
                _context148.t34 = !_context148.sent;
                (0, _context148.t33)(_context148.t34);

                if (offlineWallet instanceof _index.MoneroWalletRpc) {
                  _context148.next = 99;
                  break;
                }

                _context148.t35 = _assert["default"];
                _context148.next = 96;
                return offlineWallet.getMnemonic();

              case 96:
                _context148.t36 = _context148.sent;
                _context148.t37 = _TestUtils["default"].MNEMONIC;

                _context148.t35.equal.call(_context148.t35, _context148.t36, _context148.t37);

              case 99:
                _context148.t38 = _assert["default"];
                _context148.next = 102;
                return offlineWallet.getTxs();

              case 102:
                _context148.t39 = _context148.sent.length;

                _context148.t38.equal.call(_context148.t38, _context148.t39, 0);

                _context148.next = 106;
                return offlineWallet.importOutputs(outputsHex);

              case 106:
                numOutputsImported = _context148.sent;
                (0, _assert["default"])(numOutputsImported > 0, "No outputs imported"); // export key images from offline wallet

                _context148.next = 110;
                return offlineWallet.exportKeyImages();

              case 110:
                keyImages = _context148.sent;
                (0, _assert["default"])(keyImages.length > 0); // import key images to view-only wallet

                _context148.t40 = _assert["default"];
                _context148.next = 115;
                return viewOnlyWallet.isConnectedToDaemon();

              case 115:
                _context148.t41 = _context148.sent;
                (0, _context148.t40)(_context148.t41);
                _context148.next = 119;
                return viewOnlyWallet.importKeyImages(keyImages);

              case 119:
                _context148.t42 = _assert["default"];
                _context148.next = 122;
                return viewOnlyWallet.getBalance();

              case 122:
                _context148.t43 = _context148.sent.toString();
                _context148.next = 125;
                return this.wallet.getBalance();

              case 125:
                _context148.t44 = _context148.sent.toString();

                _context148.t42.equal.call(_context148.t42, _context148.t43, _context148.t44);

                _context148.next = 129;
                return viewOnlyWallet.createTx({
                  accountIndex: 0,
                  address: primaryAddress,
                  amount: _TestUtils["default"].MAX_FEE * BigInt("3")
                });

              case 129:
                unsignedTx = _context148.sent;

                _assert["default"].equal((0, _typeof2["default"])(unsignedTx.getTxSet().getUnsignedTxHex()), "string");

                (0, _assert["default"])(unsignedTx.getTxSet().getUnsignedTxHex()); // sign tx using offline wallet

                _context148.next = 134;
                return offlineWallet.signTxs(unsignedTx.getTxSet().getUnsignedTxHex());

              case 134:
                signedTxHex = _context148.sent;
                (0, _assert["default"])(signedTxHex.length > 0); // parse or "describe" unsigned tx set

                _context148.next = 138;
                return offlineWallet.describeUnsignedTxSet(unsignedTx.getTxSet().getUnsignedTxHex());

              case 138:
                describedTxSet = _context148.sent;
                _context148.next = 141;
                return testDescribedTxSet(describedTxSet);

              case 141:
                if (!this.testConfig.testRelays) {
                  _context148.next = 149;
                  break;
                }

                _context148.next = 144;
                return viewOnlyWallet.submitTxs(signedTxHex);

              case 144:
                txHashes = _context148.sent;

                _assert["default"].equal(txHashes.length, 1);

                _assert["default"].equal(txHashes[0].length, 64);

                _context148.next = 149;
                return _TestUtils["default"].WALLET_TX_TRACKER.waitForWalletTxsToClearPool(viewOnlyWallet);

              case 149:
              case "end":
                return _context148.stop();
            }
          }
        }, _callee146, this);
      }));

      function _testViewOnlyAndOfflineWallets(_x63, _x64) {
        return _testViewOnlyAndOfflineWallets2.apply(this, arguments);
      }

      return _testViewOnlyAndOfflineWallets;
    }()
  }, {
    key: "_testInvalidAddressError",
    value: function _testInvalidAddressError(err) {
      _assert["default"].equal("Invalid address", err.message);
    }
  }, {
    key: "_testInvalidTxHashError",
    value: function _testInvalidTxHashError(err) {
      _assert["default"].equal("TX hash has invalid format", err.message);
    }
  }, {
    key: "_testInvalidTxKeyError",
    value: function _testInvalidTxKeyError(err) {
      _assert["default"].equal("Tx key has invalid format", err.message);
    }
  }, {
    key: "_testInvalidSignatureError",
    value: function _testInvalidSignatureError(err) {
      _assert["default"].equal("Signature size mismatch with additional tx pubkeys", err.message);
    }
  }, {
    key: "_testNoSubaddressError",
    value: function _testNoSubaddressError(err) {
      _assert["default"].equal("Address must not be a subaddress", err.message);
    }
  }, {
    key: "_testSignatureHeaderCheckError",
    value: function _testSignatureHeaderCheckError(err) {
      _assert["default"].equal("Signature header check error", err.message);
    }
  }]);
  return TestMoneroWalletCommon;
}(); // ------------------------------ PRIVATE STATIC ------------------------------


function testAccount(_x65) {
  return _testAccount.apply(this, arguments);
}

function _testAccount() {
  _testAccount = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee147(account) {
    var balance, unlockedBalance, i, tag;
    return _regenerator["default"].wrap(function _callee147$(_context149) {
      while (1) {
        switch (_context149.prev = _context149.next) {
          case 0:
            // test account
            (0, _assert["default"])(account);
            (0, _assert["default"])(account.getIndex() >= 0);
            _context149.next = 4;
            return _index.MoneroUtils.validateAddress(account.getPrimaryAddress(), _TestUtils["default"].NETWORK_TYPE);

          case 4:
            _TestUtils["default"].testUnsignedBigInteger(account.getBalance());

            _TestUtils["default"].testUnsignedBigInteger(account.getUnlockedBalance());

            _context149.next = 8;
            return _index.MoneroUtils.validateAddress(account.getPrimaryAddress(), _TestUtils["default"].NETWORK_TYPE);

          case 8:
            _TestUtils["default"].testUnsignedBigInt(account.getBalance());

            _TestUtils["default"].testUnsignedBigInt(account.getUnlockedBalance()); // if given, test subaddresses and that their balances add up to account balances


            if (account.getSubaddresses()) {
              balance = BigInt(0);
              unlockedBalance = BigInt(0);

              for (i = 0; i < account.getSubaddresses().length; i++) {
                testSubaddress(account.getSubaddresses()[i]);

                _assert["default"].equal(account.getSubaddresses()[i].getAccountIndex(), account.getIndex());

                _assert["default"].equal(account.getSubaddresses()[i].getIndex(), i);

                balance = balance + account.getSubaddresses()[i].getBalance();
                unlockedBalance = unlockedBalance + account.getSubaddresses()[i].getUnlockedBalance();
              }

              (0, _assert["default"])(BitIntegerCompare(account.getBalance(), balance) === 0, "Subaddress balances " + balance.toString() + " != account " + account.getIndex() + " balance " + account.getBalance().toString());
              (0, _assert["default"])(BitIntegerCompare(account.getUnlockedBalance(), unlockedBalance) === 0, "Subaddress unlocked balances " + unlockedBalance.toString() + " != account " + account.getIndex() + " unlocked balance " + account.getUnlockedBalance().toString());
            } // tag must be undefined or non-empty


            tag = account.getTag();
            (0, _assert["default"])(tag === undefined || tag.length > 0);

          case 13:
          case "end":
            return _context149.stop();
        }
      }
    }, _callee147);
  }));
  return _testAccount.apply(this, arguments);
}

function testSubaddress(subaddress) {
  (0, _assert["default"])(subaddress.getAccountIndex() >= 0);
  (0, _assert["default"])(subaddress.getIndex() >= 0);
  (0, _assert["default"])(subaddress.getAddress());
  (0, _assert["default"])(subaddress.getLabel() === undefined || typeof subaddress.getLabel() === "string");
  if (typeof subaddress.getLabel() === "string") (0, _assert["default"])(subaddress.getLabel().length > 0);

  _TestUtils["default"].testUnsignedBigInt(subaddress.getBalance());

  _TestUtils["default"].testUnsignedBigInt(subaddress.getUnlockedBalance());

  (0, _assert["default"])(subaddress.getNumUnspentOutputs() >= 0);
  (0, _assert["default"])(typeof subaddress.isUsed() === "boolean");
  if (BitIntegerCompare(subaddress.getBalance(), BigInt(0)) > 0) (0, _assert["default"])(subaddress.isUsed());
  (0, _assert["default"])(subaddress.getNumBlocksToUnlock() >= 0);
}
/**
 * Gets random transactions.
 * 
 * @param wallet is the wallet to query for transactions
 * @param query configures the transactions to retrieve
 * @param minTxs specifies the minimum number of transactions (undefined for no minimum)
 * @param maxTxs specifies the maximum number of transactions (undefined for all filtered transactions)
 * @return {MoneroTxWallet[]} are the random transactions
 */


function getRandomTransactions(_x66, _x67, _x68, _x69) {
  return _getRandomTransactions.apply(this, arguments);
}

function _getRandomTransactions() {
  _getRandomTransactions = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee148(wallet, query, minTxs, maxTxs) {
    var txs;
    return _regenerator["default"].wrap(function _callee148$(_context150) {
      while (1) {
        switch (_context150.prev = _context150.next) {
          case 0:
            _context150.next = 2;
            return wallet.getTxs(query);

          case 2:
            txs = _context150.sent;
            if (minTxs !== undefined) (0, _assert["default"])(txs.length >= minTxs, txs.length + "/" + minTxs + " transactions found with query: " + JSON.stringify(query));

            _index.GenUtils.shuffle(txs);

            if (!(maxTxs === undefined)) {
              _context150.next = 9;
              break;
            }

            return _context150.abrupt("return", txs);

          case 9:
            return _context150.abrupt("return", txs.slice(0, Math.min(maxTxs, txs.length)));

          case 10:
          case "end":
            return _context150.stop();
        }
      }
    }, _callee148);
  }));
  return _getRandomTransactions.apply(this, arguments);
}

function testTransfer(_x70, _x71) {
  return _testTransfer.apply(this, arguments);
}

function _testTransfer() {
  _testTransfer = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee149(transfer, ctx) {
    return _regenerator["default"].wrap(function _callee149$(_context151) {
      while (1) {
        switch (_context151.prev = _context151.next) {
          case 0:
            if (ctx === undefined) ctx = {};
            (0, _assert["default"])(transfer instanceof _index.MoneroTransfer);

            _TestUtils["default"].testUnsignedBigInt(transfer.getAmount());

            if (!ctx.isSweepOutputResponse) (0, _assert["default"])(transfer.getAccountIndex() >= 0);

            if (!transfer.isIncoming()) {
              _context151.next = 8;
              break;
            }

            testIncomingTransfer(transfer);
            _context151.next = 10;
            break;

          case 8:
            _context151.next = 10;
            return testOutgoingTransfer(transfer, ctx);

          case 10:
            // transfer and tx reference each other
            (0, _assert["default"])(transfer.getTx());

            if (transfer !== transfer.getTx().getOutgoingTransfer()) {
              (0, _assert["default"])(transfer.getTx().getIncomingTransfers());
              (0, _assert["default"])(transfer.getTx().getIncomingTransfers().includes(transfer), "Transaction does not reference given transfer");
            }

          case 12:
          case "end":
            return _context151.stop();
        }
      }
    }, _callee149);
  }));
  return _testTransfer.apply(this, arguments);
}

function testIncomingTransfer(transfer) {
  (0, _assert["default"])(transfer.isIncoming());
  (0, _assert["default"])(!transfer.isOutgoing());
  (0, _assert["default"])(transfer.getAddress());
  (0, _assert["default"])(transfer.getSubaddressIndex() >= 0);
  (0, _assert["default"])(transfer.getNumSuggestedConfirmations() > 0);
}

function testOutgoingTransfer(_x72, _x73) {
  return _testOutgoingTransfer.apply(this, arguments);
}

function _testOutgoingTransfer() {
  _testOutgoingTransfer = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee150(transfer, ctx) {
    var _iterator197, _step197, subaddressIdx, _iterator198, _step198, address, sum, _iterator199, _step199, destination;

    return _regenerator["default"].wrap(function _callee150$(_context152) {
      while (1) {
        switch (_context152.prev = _context152.next) {
          case 0:
            (0, _assert["default"])(!transfer.isIncoming());
            (0, _assert["default"])(transfer.isOutgoing());
            if (!ctx.isSendResponse) (0, _assert["default"])(transfer.getSubaddressIndices());

            if (transfer.getSubaddressIndices()) {
              (0, _assert["default"])(transfer.getSubaddressIndices().length >= 1);
              _iterator197 = _createForOfIteratorHelper(transfer.getSubaddressIndices());

              try {
                for (_iterator197.s(); !(_step197 = _iterator197.n()).done;) {
                  subaddressIdx = _step197.value;
                  (0, _assert["default"])(subaddressIdx >= 0);
                }
              } catch (err) {
                _iterator197.e(err);
              } finally {
                _iterator197.f();
              }
            }

            if (transfer.getAddresses()) {
              _assert["default"].equal(transfer.getAddresses().length, transfer.getSubaddressIndices().length);

              _iterator198 = _createForOfIteratorHelper(transfer.getAddresses());

              try {
                for (_iterator198.s(); !(_step198 = _iterator198.n()).done;) {
                  address = _step198.value;
                  (0, _assert["default"])(address);
                }
              } catch (err) {
                _iterator198.e(err);
              } finally {
                _iterator198.f();
              }
            } // test destinations sum to outgoing amount


            if (!transfer.getDestinations()) {
              _context152.next = 33;
              break;
            }

            (0, _assert["default"])(transfer.getDestinations().length > 0);
            sum = BigInt(0);
            _iterator199 = _createForOfIteratorHelper(transfer.getDestinations());
            _context152.prev = 9;

            _iterator199.s();

          case 11:
            if ((_step199 = _iterator199.n()).done) {
              _context152.next = 23;
              break;
            }

            destination = _step199.value;
            _context152.next = 15;
            return testDestination(destination);

          case 15:
            _TestUtils["default"].testUnsignedBigInteger(destination.getAmount(), true);

            sum = sum.add(destination.getAmount());
            _context152.next = 19;
            return testDestination(destination);

          case 19:
            _TestUtils["default"].testUnsignedBigInt(destination.getAmount(), true);

            sum = sum + destination.getAmount();

          case 21:
            _context152.next = 11;
            break;

          case 23:
            _context152.next = 28;
            break;

          case 25:
            _context152.prev = 25;
            _context152.t0 = _context152["catch"](9);

            _iterator199.e(_context152.t0);

          case 28:
            _context152.prev = 28;

            _iterator199.f();

            return _context152.finish(28);

          case 31:
            if (BitIntegerCompare(transfer.getAmount(), sum) !== 0) console.log(transfer.getTx().getTxSet() === undefined ? transfer.getTx().toString() : transfer.getTx().getTxSet().toString());

            _assert["default"].equal(sum.toString(), transfer.getAmount().toString()); // TODO: sum of destinations != outgoing amount in split txs


          case 33:
          case "end":
            return _context152.stop();
        }
      }
    }, _callee150, null, [[9, 25, 28, 31]]);
  }));
  return _testOutgoingTransfer.apply(this, arguments);
}

function testDestination(_x74) {
  return _testDestination.apply(this, arguments);
}

function _testDestination() {
  _testDestination = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee151(destination) {
    return _regenerator["default"].wrap(function _callee151$(_context153) {
      while (1) {
        switch (_context153.prev = _context153.next) {
          case 0:
            _context153.next = 2;
            return _index.MoneroUtils.validateAddress(destination.getAddress(), _TestUtils["default"].NETWORK_TYPE);

          case 2:
            _TestUtils["default"].testUnsignedBigInt(destination.getAmount(), true);

          case 3:
          case "end":
            return _context153.stop();
        }
      }
    }, _callee151);
  }));
  return _testDestination.apply(this, arguments);
}

function testInputWallet(input) {
  (0, _assert["default"])(input);
  (0, _assert["default"])(input.getKeyImage());
  (0, _assert["default"])(input.getKeyImage().getHex());
  (0, _assert["default"])(input.getKeyImage().getHex().length > 0);
  (0, _assert["default"])(input.getAmount() === undefined); // must get info separately
}

function testOutputWallet(output) {
  (0, _assert["default"])(output);
  (0, _assert["default"])(output instanceof _index.MoneroOutputWallet);
  (0, _assert["default"])(output.getAccountIndex() >= 0);
  (0, _assert["default"])(output.getSubaddressIndex() >= 0);
  (0, _assert["default"])(output.getIndex() >= 0);

  _assert["default"].equal((0, _typeof2["default"])(output.isSpent()), "boolean");

  _assert["default"].equal((0, _typeof2["default"])(output.isLocked()), "boolean");

  _assert["default"].equal((0, _typeof2["default"])(output.isFrozen()), "boolean");

  (0, _assert["default"])(output.getKeyImage());
  (0, _assert["default"])(output.getKeyImage() instanceof _index.MoneroKeyImage);
  (0, _assert["default"])(output.getKeyImage().getHex());

  _TestUtils["default"].testUnsignedBigInt(output.getAmount(), true); // output has circular reference to its transaction which has some initialized fields


  var tx = output.getTx();
  (0, _assert["default"])(tx);
  (0, _assert["default"])(tx instanceof _index.MoneroTxWallet);
  (0, _assert["default"])(tx.getOutputs().includes(output));
  (0, _assert["default"])(tx.getHash());

  _assert["default"].equal((0, _typeof2["default"])(tx.isLocked()), "boolean");

  _assert["default"].equal(tx.isConfirmed(), true); // TODO monero-wallet-rpc: possible to get unconfirmed outputs?


  _assert["default"].equal(tx.isRelayed(), true);

  _assert["default"].equal(tx.isFailed(), false);

  (0, _assert["default"])(tx.getHeight() > 0); // test copying

  var copy = output.copy();
  (0, _assert["default"])(copy !== output);

  _assert["default"].equal(copy.toString(), output.toString());

  _assert["default"].equal(copy.getTx(), undefined); // TODO: should output copy do deep copy of tx so models are graph instead of tree?  Would need to work out circular references

}

function testCommonTxSets(txs, hasSigned, hasUnsigned, hasMultisig) {
  (0, _assert["default"])(txs.length > 0); // assert that all sets are same reference

  var set;

  for (var i = 0; i < txs.length; i++) {
    (0, _assert["default"])(txs[i] instanceof _index.MoneroTx);
    if (i === 0) set = txs[i].getTxSet();else (0, _assert["default"])(txs[i].getTxSet() === set);
  } // test expected set


  (0, _assert["default"])(set);

  if (hasSigned) {
    (0, _assert["default"])(set.getSignedTxSet());
    (0, _assert["default"])(set.getSignedTxSet().length > 0);
  }

  if (hasUnsigned) {
    (0, _assert["default"])(set.getUnsignedTxSet());
    (0, _assert["default"])(set.getUnsignedTxSet().length > 0);
  }

  if (hasMultisig) {
    (0, _assert["default"])(set.getMultisigTxSet());
    (0, _assert["default"])(set.getMultisigTxSet().length > 0);
  }
}

function testCheckTx(tx, check) {
  _assert["default"].equal((0, _typeof2["default"])(check.isGood()), "boolean");

  if (check.isGood()) {
    (0, _assert["default"])(check.getNumConfirmations() >= 0);

    _assert["default"].equal((0, _typeof2["default"])(check.inTxPool()), "boolean");

    _TestUtils["default"].testUnsignedBigInt(check.getReceivedAmount());

    if (check.inTxPool()) _assert["default"].equal(0, check.getNumConfirmations());else (0, _assert["default"])(check.getNumConfirmations() > 0); // TODO (monero-wall-rpc) this fails (confirmations is 0) for (at least one) transaction that has 1 confirmation on testCheckTxKey()
  } else {
    _assert["default"].equal(check.getNumConfirmations(), undefined);

    _assert["default"].equal(check.inTxPool(), undefined);

    _assert["default"].equal(check.getReceivedAmount(), undefined);
  }
}

function testCheckReserve(check) {
  _assert["default"].equal((0, _typeof2["default"])(check.isGood()), "boolean");

  if (check.isGood()) {
    _TestUtils["default"].testUnsignedBigInt(check.getTotalAmount());

    (0, _assert["default"])(BitIntegerCompare(check.getTotalAmount(), BigInt(0)) >= 0);

    _TestUtils["default"].testUnsignedBigInt(check.getUnconfirmedSpentAmount());

    (0, _assert["default"])(BitIntegerCompare(check.getUnconfirmedSpentAmount(), BigInt(0)) >= 0);
  } else {
    _assert["default"].equal(check.getTotalAmount(), undefined);

    _assert["default"].equal(check.getUnconfirmedSpentAmount(), undefined);
  }
}

function testDescribedTxSet(_x75) {
  return _testDescribedTxSet.apply(this, arguments);
}

function _testDescribedTxSet() {
  _testDescribedTxSet = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee152(describedTxSet) {
    var _iterator200, _step200, describedTx, _iterator201, _step201, destination;

    return _regenerator["default"].wrap(function _callee152$(_context154) {
      while (1) {
        switch (_context154.prev = _context154.next) {
          case 0:
            _assert["default"].notEqual(describedTxSet, undefined);

            (0, _assert["default"])(describedTxSet.getTxs().length > 0);

            _assert["default"].equal(describedTxSet.getSignedTxHex(), undefined);

            _assert["default"].equal(describedTxSet.getUnsignedTxHex(), undefined); // test each transaction        
            // TODO: use common tx wallet test?


            _assert["default"].equal(describedTxSet.getMultisigTxHex(), undefined);

            _iterator200 = _createForOfIteratorHelper(describedTxSet.getTxs());
            _context154.prev = 6;

            _iterator200.s();

          case 8:
            if ((_step200 = _iterator200.n()).done) {
              _context154.next = 50;
              break;
            }

            describedTx = _step200.value;
            (0, _assert["default"])(describedTx.getTxSet() === describedTxSet);

            _TestUtils["default"].testUnsignedBigInt(describedTx.getInputSum(), true);

            _TestUtils["default"].testUnsignedBigInt(describedTx.getOutputSum(), true);

            _TestUtils["default"].testUnsignedBigInt(describedTx.getFee());

            _TestUtils["default"].testUnsignedBigInt(describedTx.getChangeAmount());

            if (!(BitIntegerCompare(describedTx.getChangeAmount(), BigInt(0)) === 0)) {
              _context154.next = 19;
              break;
            }

            _assert["default"].equal(describedTx.getChangeAddress(), undefined);

            _context154.next = 21;
            break;

          case 19:
            _context154.next = 21;
            return _index.MoneroUtils.validateAddress(describedTx.getChangeAddress(), _TestUtils["default"].NETWORK_TYPE);

          case 21:
            (0, _assert["default"])(describedTx.getRingSize() > 1);
            (0, _assert["default"])(describedTx.getUnlockHeight() >= 0);
            (0, _assert["default"])(describedTx.getNumDummyOutputs() >= 0);
            (0, _assert["default"])(describedTx.getExtraHex());
            (0, _assert["default"])(describedTx.getPaymentId() === undefined || describedTx.getPaymentId().length > 0);
            (0, _assert["default"])(describedTx.isOutgoing());

            _assert["default"].notEqual(describedTx.getOutgoingTransfer(), undefined);

            _assert["default"].notEqual(describedTx.getOutgoingTransfer().getDestinations(), undefined);

            (0, _assert["default"])(describedTx.getOutgoingTransfer().getDestinations().length > 0);

            _assert["default"].equal(describedTx.isIncoming(), undefined);

            _iterator201 = _createForOfIteratorHelper(describedTx.getOutgoingTransfer().getDestinations());
            _context154.prev = 32;

            _iterator201.s();

          case 34:
            if ((_step201 = _iterator201.n()).done) {
              _context154.next = 40;
              break;
            }

            destination = _step201.value;
            _context154.next = 38;
            return testDestination(destination);

          case 38:
            _context154.next = 34;
            break;

          case 40:
            _context154.next = 45;
            break;

          case 42:
            _context154.prev = 42;
            _context154.t0 = _context154["catch"](32);

            _iterator201.e(_context154.t0);

          case 45:
            _context154.prev = 45;

            _iterator201.f();

            return _context154.finish(45);

          case 48:
            _context154.next = 8;
            break;

          case 50:
            _context154.next = 55;
            break;

          case 52:
            _context154.prev = 52;
            _context154.t1 = _context154["catch"](6);

            _iterator200.e(_context154.t1);

          case 55:
            _context154.prev = 55;

            _iterator200.f();

            return _context154.finish(55);

          case 58:
          case "end":
            return _context154.stop();
        }
      }
    }, _callee152, null, [[6, 52, 55, 58], [32, 42, 45, 48]]);
  }));
  return _testDescribedTxSet.apply(this, arguments);
}

function testAddressBookEntry(_x76) {
  return _testAddressBookEntry.apply(this, arguments);
}
/**
 * Tests the integrity of the full structure in the given txs from the block down
 * to transfers / destinations.
 */


function _testAddressBookEntry() {
  _testAddressBookEntry = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee153(entry) {
    return _regenerator["default"].wrap(function _callee153$(_context155) {
      while (1) {
        switch (_context155.prev = _context155.next) {
          case 0:
            (0, _assert["default"])(entry.getIndex() >= 0);
            _context155.next = 3;
            return _index.MoneroUtils.validateAddress(entry.getAddress(), _TestUtils["default"].NETWORK_TYPE);

          case 3:
            _assert["default"].equal((0, _typeof2["default"])(entry.getDescription()), "string");

          case 4:
          case "end":
            return _context155.stop();
        }
      }
    }, _callee153);
  }));
  return _testAddressBookEntry.apply(this, arguments);
}

function testGetTxsStructure(txs) {
  var query = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
  // normalize query
  if (query === undefined) query = new _index.MoneroTxQuery();
  if (!(query instanceof _index.MoneroTxQuery)) query = new _index.MoneroTxQuery(query); // collect unique blocks in order (using set and list instead of TreeSet for direct portability to other languages)

  var seenBlocks = new Set();
  var blocks = [];
  var unconfirmedTxs = [];

  var _iterator190 = _createForOfIteratorHelper(txs),
      _step190;

  try {
    for (_iterator190.s(); !(_step190 = _iterator190.n()).done;) {
      var _tx29 = _step190.value;
      if (_tx29.getBlock() === undefined) unconfirmedTxs.push(_tx29);else {
        (0, _assert["default"])(_tx29.getBlock().getTxs().includes(_tx29));

        if (!seenBlocks.has(_tx29.getBlock())) {
          seenBlocks.add(_tx29.getBlock());
          blocks.push(_tx29.getBlock());
        }
      }
    } // tx hashes must be in order if requested

  } catch (err) {
    _iterator190.e(err);
  } finally {
    _iterator190.f();
  }

  if (query.getHashes() !== undefined) {
    _assert["default"].equal(txs.length, query.getHashes().length);

    for (var i = 0; i < query.getHashes().length; i++) {
      _assert["default"].equal(txs[i].getHash(), query.getHashes()[i]);
    }
  } // test that txs and blocks reference each other and blocks are in ascending order unless specific tx hashes requested


  var index = 0;
  var prevBlockHeight = undefined;

  for (var _i36 = 0, _blocks = blocks; _i36 < _blocks.length; _i36++) {
    var block = _blocks[_i36];
    if (prevBlockHeight === undefined) prevBlockHeight = block.getHeight();else if (query.getHashes() === undefined) (0, _assert["default"])(block.getHeight() > prevBlockHeight, "Blocks are not in order of heights: " + prevBlockHeight + " vs " + block.getHeight());

    var _iterator191 = _createForOfIteratorHelper(block.getTxs()),
        _step191;

    try {
      for (_iterator191.s(); !(_step191 = _iterator191.n()).done;) {
        var tx = _step191.value;
        (0, _assert["default"])(tx.getBlock() === block);

        if (query.getHashes() === undefined) {
          _assert["default"].equal(tx.getHash(), txs[index].getHash()); // verify tx order is self-consistent with blocks unless txs manually re-ordered by requesting by hash


          (0, _assert["default"])(tx === txs[index]);
        }

        index++;
      }
    } catch (err) {
      _iterator191.e(err);
    } finally {
      _iterator191.f();
    }
  }

  _assert["default"].equal(index + unconfirmedTxs.length, txs.length); // test that incoming transfers are in order of ascending accounts and subaddresses


  var _iterator192 = _createForOfIteratorHelper(txs),
      _step192;

  try {
    for (_iterator192.s(); !(_step192 = _iterator192.n()).done;) {
      var _tx30 = _step192.value;
      var prevAccountIdx = undefined;
      var prevSubaddressIdx = undefined;
      if (_tx30.getIncomingTransfers() === undefined) continue;

      var _iterator193 = _createForOfIteratorHelper(_tx30.getIncomingTransfers()),
          _step193;

      try {
        for (_iterator193.s(); !(_step193 = _iterator193.n()).done;) {
          var transfer = _step193.value;
          if (prevAccountIdx === undefined) prevAccountIdx = transfer.getAccountIndex();else {
            (0, _assert["default"])(prevAccountIdx <= transfer.getAccountIndex());

            if (prevAccountIdx < transfer.getAccountIndex()) {
              prevSubaddressIdx = undefined;
              prevAccountIdx = transfer.getAccountIndex();
            }

            if (prevSubaddressIdx === undefined) prevSubaddressIdx = transfer.getSubaddressIndex();else (0, _assert["default"])(prevSubaddressIdx < transfer.getSubaddressIndex());
          }
        }
      } catch (err) {
        _iterator193.e(err);
      } finally {
        _iterator193.f();
      }
    }
  } catch (err) {
    _iterator192.e(err);
  } finally {
    _iterator192.f();
  }
}

function countNumInstances(instances) {
  var counts = new Map();

  var _iterator194 = _createForOfIteratorHelper(instances),
      _step194;

  try {
    for (_iterator194.s(); !(_step194 = _iterator194.n()).done;) {
      var instance = _step194.value;
      var count = counts.get(instance);
      counts.set(instance, count === undefined ? 1 : count + 1);
    }
  } catch (err) {
    _iterator194.e(err);
  } finally {
    _iterator194.f();
  }

  return counts;
}

function getModes(counts) {
  var modes = new Set();
  var maxCount;

  var _iterator195 = _createForOfIteratorHelper(counts.keys()),
      _step195;

  try {
    for (_iterator195.s(); !(_step195 = _iterator195.n()).done;) {
      var key = _step195.value;
      var count = counts.get(key);
      if (maxCount === undefined || count > maxCount) maxCount = count;
    }
  } catch (err) {
    _iterator195.e(err);
  } finally {
    _iterator195.f();
  }

  var _iterator196 = _createForOfIteratorHelper(counts.keys()),
      _step196;

  try {
    for (_iterator196.s(); !(_step196 = _iterator196.n()).done;) {
      var _key3 = _step196.value;

      var _count = counts.get(_key3);

      if (_count === maxCount) modes.add(_key3);
    }
  } catch (err) {
    _iterator196.e(err);
  } finally {
    _iterator196.f();
  }

  return modes;
}
/**
 * Internal tester for output notifications.
 */


var ReceivedOutputNotificationTester = /*#__PURE__*/function (_MoneroWalletListener) {
  (0, _inherits2["default"])(ReceivedOutputNotificationTester, _MoneroWalletListener);

  var _super = _createSuper(ReceivedOutputNotificationTester);

  function ReceivedOutputNotificationTester(txHash) {
    var _this;

    (0, _classCallCheck2["default"])(this, ReceivedOutputNotificationTester);
    _this = _super.call(this);
    _this.txHash = txHash;
    _this.testComplete = false;
    _this.unlockedSeen = false;
    return _this;
  }

  (0, _createClass2["default"])(ReceivedOutputNotificationTester, [{
    key: "onNewBlock",
    value: function onNewBlock(height) {
      this.lastOnNewBlockHeight = height;
    }
  }, {
    key: "onBalancesChanged",
    value: function onBalancesChanged(newBalance, newUnlockedBalance) {
      this.lastOnBalancesChangedBalance = newBalance;
      this.lastOnBalancesChangedUnlockedBalance = newUnlockedBalance;
    }
  }, {
    key: "onOutputReceived",
    value: function onOutputReceived(output) {
      if (output.getTx().getHash() === this.txHash) this.lastNotifiedOutput = output;
    }
  }]);
  return ReceivedOutputNotificationTester;
}(_index.MoneroWalletListener);
/**
 * Wallet listener to collect output notifications.
 */


var WalletNotificationCollector = /*#__PURE__*/function (_MoneroWalletListener2) {
  (0, _inherits2["default"])(WalletNotificationCollector, _MoneroWalletListener2);

  var _super2 = _createSuper(WalletNotificationCollector);

  function WalletNotificationCollector() {
    var _this2;

    (0, _classCallCheck2["default"])(this, WalletNotificationCollector);
    _this2 = _super2.call(this);
    _this2.listening = true;
    _this2.blockNotifications = [];
    _this2.balanceNotifications = [];
    _this2.outputsReceived = [];
    _this2.outputsSpent = [];
    return _this2;
  }

  (0, _createClass2["default"])(WalletNotificationCollector, [{
    key: "onNewBlock",
    value: function onNewBlock(height) {
      (0, _assert["default"])(this.listening);
      if (this.blockNotifications.length > 0) (0, _assert["default"])(height === this.blockNotifications[this.blockNotifications.length - 1] + 1);
      this.blockNotifications.push(height);
    }
  }, {
    key: "onBalancesChanged",
    value: function onBalancesChanged(newBalance, newUnlockedBalance) {
      (0, _assert["default"])(this.listening);

      if (this.balanceNotifications.length > 0) {
        this.lastNotification = this.balanceNotifications[this.balanceNotifications.length - 1];
        (0, _assert["default"])(newBalance.toString() !== this.lastNotification.balance.toString() || newUnlockedBalance.toString() !== this.lastNotification.unlockedBalance.toString());
      }

      this.balanceNotifications.push({
        balance: newBalance,
        unlockedBalance: newUnlockedBalance
      });
    }
  }, {
    key: "onOutputReceived",
    value: function onOutputReceived(output) {
      (0, _assert["default"])(this.listening);
      this.outputsReceived.push(output);
    }
  }, {
    key: "onOutputSpent",
    value: function onOutputSpent(output) {
      (0, _assert["default"])(this.listening);
      this.outputsSpent.push(output);
    }
  }, {
    key: "getBlockNotifications",
    value: function getBlockNotifications() {
      return this.blockNotifications;
    }
  }, {
    key: "getBalanceNotifications",
    value: function getBalanceNotifications() {
      return this.balanceNotifications;
    }
  }, {
    key: "getOutputsReceived",
    value: function getOutputsReceived(query) {
      return _index.Filter.apply(query, this.outputsReceived);
    }
  }, {
    key: "getOutputsSpent",
    value: function getOutputsSpent(query) {
      return _index.Filter.apply(query, this.outputsSpent);
    }
  }, {
    key: "setListening",
    value: function setListening(listening) {
      this.listening = listening;
    }
  }]);
  return WalletNotificationCollector;
}(_index.MoneroWalletListener);

var _default = TestMoneroWalletCommon;
exports["default"] = _default;