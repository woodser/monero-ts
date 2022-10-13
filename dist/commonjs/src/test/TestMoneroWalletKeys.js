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

var _WalletEqualityUtils = _interopRequireDefault(require("./utils/WalletEqualityUtils"));

var _TestMoneroWalletCommon = _interopRequireDefault(require("./TestMoneroWalletCommon"));

var _index = require("../../index");

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * Tests the implementation of MoneroWallet which only manages keys using WebAssembly.
 */
var TestMoneroWalletKeys = /*#__PURE__*/function (_TestMoneroWalletComm) {
  (0, _inherits2["default"])(TestMoneroWalletKeys, _TestMoneroWalletComm);

  var _super = _createSuper(TestMoneroWalletKeys);

  function TestMoneroWalletKeys(config) {
    (0, _classCallCheck2["default"])(this, TestMoneroWalletKeys);
    return _super.call(this, config);
  }

  (0, _createClass2["default"])(TestMoneroWalletKeys, [{
    key: "beforeAll",
    value: function () {
      var _beforeAll = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(currentTest) {
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return (0, _get2["default"])((0, _getPrototypeOf2["default"])(TestMoneroWalletKeys.prototype), "beforeAll", this).call(this, currentTest);

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
                return (0, _get2["default"])((0, _getPrototypeOf2["default"])(TestMoneroWalletKeys.prototype), "beforeEach", this).call(this, currentTest);

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
                console.log("After all");
                _context3.next = 3;
                return this.wallet.close();

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
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return (0, _get2["default"])((0, _getPrototypeOf2["default"])(TestMoneroWalletKeys.prototype), "afterEach", this).call(this, currentTest);

              case 2:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
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
                return _context5.abrupt("return", _TestUtils["default"].getWalletKeys());

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
      var _openWallet = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7(config) {
        return _regenerator["default"].wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                throw new Error("TestMoneroWalletKeys.openWallet(config) not applicable, use createWallet()");

              case 1:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7);
      }));

      function openWallet(_x4) {
        return _openWallet.apply(this, arguments);
      }

      return openWallet;
    }()
  }, {
    key: "createWallet",
    value: function () {
      var _createWallet = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee8(config) {
        return _regenerator["default"].wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                // assign defaults
                config = new _index.MoneroWalletConfig(config);
                if (!config.getPassword()) config.setPassword(_TestUtils["default"].WALLET_PASSWORD);
                if (config.getNetworkType() === undefined) config.setNetworkType(_TestUtils["default"].NETWORK_TYPE);

                if (!config.getServer()) {
                  _context8.next = 5;
                  break;
                }

                throw new Error("Cannot initialize keys wallet with connection");

              case 5:
                _context8.next = 7;
                return createWalletKeys(config);

              case 7:
                return _context8.abrupt("return", _context8.sent);

              case 8:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8);
      }));

      function createWallet(_x5) {
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
              case "end":
                return _context9.stop();
            }
          }
        }, _callee9);
      }));

      function closeWallet(_x6, _x7) {
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
                return MoneroWalletKeys.getMnemonicLanguages();

              case 2:
                return _context10.abrupt("return", _context10.sent);

              case 3:
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
    }()
  }, {
    key: "runTests",
    value: function runTests() {
      var that = this;
      describe("TEST MONERO WALLET KEYS", function () {
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
        }))); // run tests specific to keys wallet

        that._testWalletKeys(); // run common tests


        that.runCommonTests();
      });
    } // ---------------------------------- PRIVATE -------------------------------

  }, {
    key: "_testWalletKeys",
    value: function _testWalletKeys() {
      var that = this;
      var config = this.config;
      var daemon = this.daemon;
      describe("Tests specific to keys wallet", function () {
        it("Has the same keys as the RPC wallet", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee15() {
          return _regenerator["default"].wrap(function _callee15$(_context15) {
            while (1) {
              switch (_context15.prev = _context15.next) {
                case 0:
                  _context15.t0 = _WalletEqualityUtils["default"];
                  _context15.next = 3;
                  return _TestUtils["default"].getWalletRpc();

                case 3:
                  _context15.t1 = _context15.sent;
                  _context15.next = 6;
                  return that.getTestWallet();

                case 6:
                  _context15.t2 = _context15.sent;
                  _context15.next = 9;
                  return _context15.t0.testWalletEqualityKeys.call(_context15.t0, _context15.t1, _context15.t2);

                case 9:
                case "end":
                  return _context15.stop();
              }
            }
          }, _callee15);
        })));
        it("Has the same keys as the RPC wallet with a seed offset", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee16() {
          var seedOffset, walletRpc, walletKeys;
          return _regenerator["default"].wrap(function _callee16$(_context16) {
            while (1) {
              switch (_context16.prev = _context16.next) {
                case 0:
                  // use common offset to compare wallet implementations
                  seedOffset = "my super secret offset!"; // create rpc wallet with offset

                  _context16.next = 3;
                  return _TestUtils["default"].getWalletRpc();

                case 3:
                  walletRpc = _context16.sent;
                  _context16.t0 = walletRpc;
                  _context16.t1 = _index.GenUtils.getUUID();
                  _context16.t2 = _TestUtils["default"].WALLET_PASSWORD;
                  _context16.next = 9;
                  return walletRpc.getMnemonic();

                case 9:
                  _context16.t3 = _context16.sent;
                  _context16.t4 = _TestUtils["default"].FIRST_RECEIVE_HEIGHT;
                  _context16.t5 = seedOffset;
                  _context16.t6 = {
                    path: _context16.t1,
                    password: _context16.t2,
                    mnemonic: _context16.t3,
                    restoreHeight: _context16.t4,
                    seedOffset: _context16.t5
                  };
                  _context16.next = 15;
                  return _context16.t0.createWallet.call(_context16.t0, _context16.t6);

                case 15:
                  _context16.next = 17;
                  return createWalletKeys({
                    networkType: _TestUtils["default"].NETWORK_TYPE,
                    mnemonic: _TestUtils["default"].MNEMONIC,
                    seedOffset: seedOffset
                  });

                case 17:
                  walletKeys = _context16.sent;
                  _context16.next = 20;
                  return _WalletEqualityUtils["default"].testWalletEqualityKeys(walletRpc, walletKeys);

                case 20:
                case "end":
                  return _context16.stop();
              }
            }
          }, _callee16);
        })));
        it("Can get the address of a specified account and subaddress index", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee17() {
          var accountIdx, subaddressIdx;
          return _regenerator["default"].wrap(function _callee17$(_context17) {
            while (1) {
              switch (_context17.prev = _context17.next) {
                case 0:
                  accountIdx = 0;

                case 1:
                  if (!(accountIdx < 5)) {
                    _context17.next = 17;
                    break;
                  }

                  subaddressIdx = 0;

                case 3:
                  if (!(subaddressIdx < 5)) {
                    _context17.next = 14;
                    break;
                  }

                  _context17.t0 = _index.MoneroUtils;
                  _context17.next = 7;
                  return that.wallet.getAddress(accountIdx, subaddressIdx);

                case 7:
                  _context17.t1 = _context17.sent;
                  _context17.t2 = _TestUtils["default"].NETWORK_TYPE;
                  _context17.next = 11;
                  return _context17.t0.validateAddress.call(_context17.t0, _context17.t1, _context17.t2);

                case 11:
                  subaddressIdx++;
                  _context17.next = 3;
                  break;

                case 14:
                  accountIdx++;
                  _context17.next = 1;
                  break;

                case 17:
                case "end":
                  return _context17.stop();
              }
            }
          }, _callee17);
        })));
      });
    }
  }]);
  return TestMoneroWalletKeys;
}(_TestMoneroWalletCommon["default"]);

var _default = TestMoneroWalletKeys;
exports["default"] = _default;