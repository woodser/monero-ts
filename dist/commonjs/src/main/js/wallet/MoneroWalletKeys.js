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

var _LibraryUtils = _interopRequireDefault(require("../common/LibraryUtils"));

var _MoneroError = _interopRequireDefault(require("../common/MoneroError"));

var _MoneroNetworkType = _interopRequireDefault(require("../daemon/model/MoneroNetworkType"));

var _MoneroSubaddress = _interopRequireDefault(require("./model/MoneroSubaddress"));

var _MoneroUtils = _interopRequireDefault(require("../common/MoneroUtils"));

var _MoneroVersion = _interopRequireDefault(require("../daemon/model/MoneroVersion"));

var _MoneroWallet2 = _interopRequireDefault(require("./MoneroWallet"));

var _MoneroWalletConfig = _interopRequireDefault(require("./model/MoneroWalletConfig"));

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * Implements a MoneroWallet which only manages keys using WebAssembly.
 * 
 * @implements {MoneroWallet}
 * @hideconstructor
 */
var MoneroWalletKeys = /*#__PURE__*/function (_MoneroWallet) {
  (0, _inherits2["default"])(MoneroWalletKeys, _MoneroWallet);

  var _super = _createSuper(MoneroWalletKeys);

  // --------------------------- INSTANCE METHODS -----------------------------

  /**
   * Internal constructor which is given the memory address of a C++ wallet
   * instance.
   * 
   * This method should not be called externally but should be called through
   * static wallet creation utilities in this class.
   * 
   * @param {number} cppAddress - address of the wallet instance in C++
   */
  function MoneroWalletKeys(cppAddress) {
    var _this;

    (0, _classCallCheck2["default"])(this, MoneroWalletKeys);
    _this = _super.call(this);
    _this._cppAddress = cppAddress;
    _this._module = _LibraryUtils["default"].getWasmModule();
    if (!_this._module.create_full_wallet) throw new _MoneroError["default"]("WASM module not loaded - create wallet instance using static utilities"); // static utilites pre-load wasm module

    return _this;
  }

  (0, _createClass2["default"])(MoneroWalletKeys, [{
    key: "addListener",
    value: function () {
      var _addListener = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(listener) {
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                throw new _MoneroError["default"]("MoneroWalletKeys does not support adding listeners");

              case 1:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      function addListener(_x) {
        return _addListener.apply(this, arguments);
      }

      return addListener;
    }()
  }, {
    key: "removeListener",
    value: function () {
      var _removeListener = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(listener) {
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                throw new _MoneroError["default"]("MoneroWalletKeys does not support removing listeners");

              case 1:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }));

      function removeListener(_x2) {
        return _removeListener.apply(this, arguments);
      }

      return removeListener;
    }()
  }, {
    key: "isViewOnly",
    value: function () {
      var _isViewOnly = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4() {
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

                          return _context3.abrupt("return", that._module.is_view_only(that._cppAddress));

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

      function isViewOnly() {
        return _isViewOnly.apply(this, arguments);
      }

      return isViewOnly;
    }()
  }, {
    key: "isConnectedToDaemon",
    value: function () {
      var _isConnectedToDaemon = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5() {
        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                return _context5.abrupt("return", false);

              case 1:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5);
      }));

      function isConnectedToDaemon() {
        return _isConnectedToDaemon.apply(this, arguments);
      }

      return isConnectedToDaemon;
    }()
  }, {
    key: "getVersion",
    value: function () {
      var _getVersion = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7() {
        var that;
        return _regenerator["default"].wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                that = this;
                return _context7.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6() {
                  var versionStr, versionJson;
                  return _regenerator["default"].wrap(function _callee6$(_context6) {
                    while (1) {
                      switch (_context6.prev = _context6.next) {
                        case 0:
                          that._assertNotClosed();

                          versionStr = that._module.get_version(that._cppAddress);
                          versionJson = JSON.parse(versionStr);
                          return _context6.abrupt("return", new _MoneroVersion["default"](versionJson.number, versionJson.isRelease));

                        case 4:
                        case "end":
                          return _context6.stop();
                      }
                    }
                  }, _callee6);
                }))));

              case 2:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function getVersion() {
        return _getVersion.apply(this, arguments);
      }

      return getVersion;
    }()
    /**
     * @ignore
     */

  }, {
    key: "getPath",
    value: function getPath() {
      this._assertNotClosed();

      throw new _MoneroError["default"]("MoneroWalletKeys does not support a persisted path");
    }
  }, {
    key: "getMnemonic",
    value: function () {
      var _getMnemonic = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee9() {
        var that;
        return _regenerator["default"].wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                that = this;
                return _context9.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee8() {
                  var mnemonic;
                  return _regenerator["default"].wrap(function _callee8$(_context8) {
                    while (1) {
                      switch (_context8.prev = _context8.next) {
                        case 0:
                          that._assertNotClosed();

                          mnemonic = that._module.get_mnemonic(that._cppAddress);
                          return _context8.abrupt("return", mnemonic ? mnemonic : undefined);

                        case 3:
                        case "end":
                          return _context8.stop();
                      }
                    }
                  }, _callee8);
                }))));

              case 2:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function getMnemonic() {
        return _getMnemonic.apply(this, arguments);
      }

      return getMnemonic;
    }()
  }, {
    key: "getMnemonicLanguage",
    value: function () {
      var _getMnemonicLanguage = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee11() {
        var that;
        return _regenerator["default"].wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                that = this;
                return _context11.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee10() {
                  var mnemonicLanguage;
                  return _regenerator["default"].wrap(function _callee10$(_context10) {
                    while (1) {
                      switch (_context10.prev = _context10.next) {
                        case 0:
                          that._assertNotClosed();

                          mnemonicLanguage = that._module.get_mnemonic_language(that._cppAddress);
                          return _context10.abrupt("return", mnemonicLanguage ? mnemonicLanguage : undefined);

                        case 3:
                        case "end":
                          return _context10.stop();
                      }
                    }
                  }, _callee10);
                }))));

              case 2:
              case "end":
                return _context11.stop();
            }
          }
        }, _callee11, this);
      }));

      function getMnemonicLanguage() {
        return _getMnemonicLanguage.apply(this, arguments);
      }

      return getMnemonicLanguage;
    }()
  }, {
    key: "getPrivateSpendKey",
    value: function () {
      var _getPrivateSpendKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee13() {
        var that;
        return _regenerator["default"].wrap(function _callee13$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                that = this;
                return _context13.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee12() {
                  var privateSpendKey;
                  return _regenerator["default"].wrap(function _callee12$(_context12) {
                    while (1) {
                      switch (_context12.prev = _context12.next) {
                        case 0:
                          that._assertNotClosed();

                          privateSpendKey = that._module.get_private_spend_key(that._cppAddress);
                          return _context12.abrupt("return", privateSpendKey ? privateSpendKey : undefined);

                        case 3:
                        case "end":
                          return _context12.stop();
                      }
                    }
                  }, _callee12);
                }))));

              case 2:
              case "end":
                return _context13.stop();
            }
          }
        }, _callee13, this);
      }));

      function getPrivateSpendKey() {
        return _getPrivateSpendKey.apply(this, arguments);
      }

      return getPrivateSpendKey;
    }()
  }, {
    key: "getPrivateViewKey",
    value: function () {
      var _getPrivateViewKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee15() {
        var that;
        return _regenerator["default"].wrap(function _callee15$(_context15) {
          while (1) {
            switch (_context15.prev = _context15.next) {
              case 0:
                that = this;
                return _context15.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee14() {
                  return _regenerator["default"].wrap(function _callee14$(_context14) {
                    while (1) {
                      switch (_context14.prev = _context14.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context14.abrupt("return", that._module.get_private_view_key(that._cppAddress));

                        case 2:
                        case "end":
                          return _context14.stop();
                      }
                    }
                  }, _callee14);
                }))));

              case 2:
              case "end":
                return _context15.stop();
            }
          }
        }, _callee15, this);
      }));

      function getPrivateViewKey() {
        return _getPrivateViewKey.apply(this, arguments);
      }

      return getPrivateViewKey;
    }()
  }, {
    key: "getPublicViewKey",
    value: function () {
      var _getPublicViewKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee17() {
        var that;
        return _regenerator["default"].wrap(function _callee17$(_context17) {
          while (1) {
            switch (_context17.prev = _context17.next) {
              case 0:
                that = this;
                return _context17.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee16() {
                  return _regenerator["default"].wrap(function _callee16$(_context16) {
                    while (1) {
                      switch (_context16.prev = _context16.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context16.abrupt("return", that._module.get_public_view_key(that._cppAddress));

                        case 2:
                        case "end":
                          return _context16.stop();
                      }
                    }
                  }, _callee16);
                }))));

              case 2:
              case "end":
                return _context17.stop();
            }
          }
        }, _callee17, this);
      }));

      function getPublicViewKey() {
        return _getPublicViewKey.apply(this, arguments);
      }

      return getPublicViewKey;
    }()
  }, {
    key: "getPublicSpendKey",
    value: function () {
      var _getPublicSpendKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee19() {
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

                          return _context18.abrupt("return", that._module.get_public_spend_key(that._cppAddress));

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

      function getPublicSpendKey() {
        return _getPublicSpendKey.apply(this, arguments);
      }

      return getPublicSpendKey;
    }()
  }, {
    key: "getAddress",
    value: function () {
      var _getAddress = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee21(accountIdx, subaddressIdx) {
        var that;
        return _regenerator["default"].wrap(function _callee21$(_context21) {
          while (1) {
            switch (_context21.prev = _context21.next) {
              case 0:
                this._assertNotClosed();

                (0, _assert["default"])(typeof accountIdx === "number");
                that = this;
                return _context21.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee20() {
                  return _regenerator["default"].wrap(function _callee20$(_context20) {
                    while (1) {
                      switch (_context20.prev = _context20.next) {
                        case 0:
                          that._assertNotClosed();

                          return _context20.abrupt("return", that._module.get_address(that._cppAddress, accountIdx, subaddressIdx));

                        case 2:
                        case "end":
                          return _context20.stop();
                      }
                    }
                  }, _callee20);
                }))));

              case 4:
              case "end":
                return _context21.stop();
            }
          }
        }, _callee21, this);
      }));

      function getAddress(_x3, _x4) {
        return _getAddress.apply(this, arguments);
      }

      return getAddress;
    }()
  }, {
    key: "getAddressIndex",
    value: function () {
      var _getAddressIndex = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee23(address) {
        var that;
        return _regenerator["default"].wrap(function _callee23$(_context23) {
          while (1) {
            switch (_context23.prev = _context23.next) {
              case 0:
                this._assertNotClosed();

                that = this;
                return _context23.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee22() {
                  var resp;
                  return _regenerator["default"].wrap(function _callee22$(_context22) {
                    while (1) {
                      switch (_context22.prev = _context22.next) {
                        case 0:
                          that._assertNotClosed();

                          resp = that._module.get_address_index(that._cppAddress, address);

                          if (!(resp.charAt(0) !== '{')) {
                            _context22.next = 4;
                            break;
                          }

                          throw new _MoneroError["default"](resp);

                        case 4:
                          return _context22.abrupt("return", new _MoneroSubaddress["default"](JSON.parse(resp)));

                        case 5:
                        case "end":
                          return _context22.stop();
                      }
                    }
                  }, _callee22);
                }))));

              case 3:
              case "end":
                return _context23.stop();
            }
          }
        }, _callee23, this);
      }));

      function getAddressIndex(_x5) {
        return _getAddressIndex.apply(this, arguments);
      }

      return getAddressIndex;
    }()
  }, {
    key: "getAccounts",
    value: function getAccounts() {
      this._assertNotClosed();

      throw new _MoneroError["default"]("MoneroWalletKeys does not support getting an enumerable set of accounts; query specific accounts");
    } // getIntegratedAddress(paymentId)  // TODO
    // decodeIntegratedAddress

  }, {
    key: "close",
    value: function () {
      var _close = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee26(save) {
        var that;
        return _regenerator["default"].wrap(function _callee26$(_context26) {
          while (1) {
            switch (_context26.prev = _context26.next) {
              case 0:
                if (!this._isClosed) {
                  _context26.next = 2;
                  break;
                }

                return _context26.abrupt("return");

              case 2:
                if (!save) {
                  _context26.next = 5;
                  break;
                }

                _context26.next = 5;
                return this.save();

              case 5:
                // queue task to use wasm module
                that = this;
                return _context26.abrupt("return", that._module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee25() {
                  return _regenerator["default"].wrap(function _callee25$(_context25) {
                    while (1) {
                      switch (_context25.prev = _context25.next) {
                        case 0:
                          return _context25.abrupt("return", new Promise(function (resolve, reject) {
                            if (that._isClosed) {
                              resolve();
                              return;
                            } // define callback for wasm


                            var callbackFn = /*#__PURE__*/function () {
                              var _ref12 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee24() {
                                return _regenerator["default"].wrap(function _callee24$(_context24) {
                                  while (1) {
                                    switch (_context24.prev = _context24.next) {
                                      case 0:
                                        delete that._cppAddress;
                                        that._isClosed = true;
                                        resolve();

                                      case 3:
                                      case "end":
                                        return _context24.stop();
                                    }
                                  }
                                }, _callee24);
                              }));

                              return function callbackFn() {
                                return _ref12.apply(this, arguments);
                              };
                            }(); // close wallet in wasm and invoke callback when done


                            that._module.close(that._cppAddress, false, callbackFn); // saving handled external to webassembly

                          }));

                        case 1:
                        case "end":
                          return _context25.stop();
                      }
                    }
                  }, _callee25);
                }))));

              case 7:
              case "end":
                return _context26.stop();
            }
          }
        }, _callee26, this);
      }));

      function close(_x6) {
        return _close.apply(this, arguments);
      }

      return close;
    }()
  }, {
    key: "isClosed",
    value: function () {
      var _isClosed = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee27() {
        return _regenerator["default"].wrap(function _callee27$(_context27) {
          while (1) {
            switch (_context27.prev = _context27.next) {
              case 0:
                return _context27.abrupt("return", this._isClosed);

              case 1:
              case "end":
                return _context27.stop();
            }
          }
        }, _callee27, this);
      }));

      function isClosed() {
        return _isClosed.apply(this, arguments);
      }

      return isClosed;
    }() // ----------- ADD JSDOC FOR SUPPORTED DEFAULT IMPLEMENTATIONS --------------

  }, {
    key: "getPrimaryAddress",
    value: function () {
      var _getPrimaryAddress = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee28() {
        var _args28 = arguments;
        return _regenerator["default"].wrap(function _callee28$(_context28) {
          while (1) {
            switch (_context28.prev = _context28.next) {
              case 0:
                return _context28.abrupt("return", (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroWalletKeys.prototype), "getPrimaryAddress", this).apply(this, _args28));

              case 1:
              case "end":
                return _context28.stop();
            }
          }
        }, _callee28, this);
      }));

      function getPrimaryAddress() {
        return _getPrimaryAddress.apply(this, arguments);
      }

      return getPrimaryAddress;
    }()
  }, {
    key: "getSubaddress",
    value: function () {
      var _getSubaddress = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee29() {
        var _args29 = arguments;
        return _regenerator["default"].wrap(function _callee29$(_context29) {
          while (1) {
            switch (_context29.prev = _context29.next) {
              case 0:
                return _context29.abrupt("return", (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroWalletKeys.prototype), "getSubaddress", this).apply(this, _args29));

              case 1:
              case "end":
                return _context29.stop();
            }
          }
        }, _callee29, this);
      }));

      function getSubaddress() {
        return _getSubaddress.apply(this, arguments);
      }

      return getSubaddress;
    }() // ----------------------------- PRIVATE HELPERS ----------------------------

  }, {
    key: "_assertNotClosed",
    value: function _assertNotClosed() {
      if (this._isClosed) throw new _MoneroError["default"]("Wallet is closed");
    }
  }], [{
    key: "createWallet",
    value: // --------------------------- STATIC UTILITIES -----------------------------

    /**
     * <p>Create a wallet using WebAssembly bindings to monero-project.</p>
     * 
     * <p>Example:</p>
     * 
     * <code>
     * let wallet = await MoneroWalletKeys.createWallet({<br>
     * &nbsp;&nbsp; password: "abc123",<br>
     * &nbsp;&nbsp; networkType: MoneroNetworkType.STAGENET,<br>
     * &nbsp;&nbsp; mnemonic: "coexist igloo pamphlet lagoon..."<br>
     * });
     * </code>
     * 
     * @param {MoneroWalletConfig|object} config - MoneroWalletConfig or equivalent config object
     * @param {string|number} config.networkType - network type of the wallet to create (one of "mainnet", "testnet", "stagenet" or MoneroNetworkType.MAINNET|TESTNET|STAGENET)
     * @param {string} config.mnemonic - mnemonic of the wallet to create (optional, random wallet created if neither mnemonic nor keys given)
     * @param {string} config.seedOffset - the offset used to derive a new seed from the given mnemonic to recover a secret wallet from the mnemonic phrase
     * @param {string} config.primaryAddress - primary address of the wallet to create (only provide if restoring from keys)
     * @param {string} [config.privateViewKey] - private view key of the wallet to create (optional)
     * @param {string} [config.privateSpendKey] - private spend key of the wallet to create (optional)
     * @param {string} [config.language] - language of the wallet's mnemonic phrase (defaults to "English" or auto-detected)
     * @return {MoneroWalletKeys} the created wallet
     */
    function () {
      var _createWallet = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee30(config) {
        return _regenerator["default"].wrap(function _callee30$(_context30) {
          while (1) {
            switch (_context30.prev = _context30.next) {
              case 0:
                if (!(config === undefined)) {
                  _context30.next = 2;
                  break;
                }

                throw new _MoneroError["default"]("Must provide config to create wallet");

              case 2:
                config = config instanceof _MoneroWalletConfig["default"] ? config : new _MoneroWalletConfig["default"](config);

                if (!(config.getMnemonic() !== undefined && (config.getPrimaryAddress() !== undefined || config.getPrivateViewKey() !== undefined || config.getPrivateSpendKey() !== undefined))) {
                  _context30.next = 5;
                  break;
                }

                throw new _MoneroError["default"]("Wallet may be initialized with a mnemonic or keys but not both");

              case 5:
                if (!(config.getNetworkType() === undefined)) {
                  _context30.next = 7;
                  break;
                }

                throw new _MoneroError["default"]("Must provide a networkType: 'mainnet', 'testnet' or 'stagenet'");

              case 7:
                if (!(config.getSaveCurrent() === true)) {
                  _context30.next = 9;
                  break;
                }

                throw new _MoneroError["default"]("Cannot save current wallet when creating keys-only wallet");

              case 9:
                if (!(config.getMnemonic() !== undefined)) {
                  _context30.next = 15;
                  break;
                }

                if (!(config.getLanguage() !== undefined)) {
                  _context30.next = 12;
                  break;
                }

                throw new _MoneroError["default"]("Cannot provide language when creating wallet from mnemonic");

              case 12:
                return _context30.abrupt("return", MoneroWalletKeys._createWalletFromMnemonic(config.getNetworkType(), config.getMnemonic(), config.getSeedOffset()));

              case 15:
                if (!(config.getPrivateSpendKey() !== undefined || config.getPrimaryAddress() !== undefined)) {
                  _context30.next = 21;
                  break;
                }

                if (!(config.getSeedOffset() !== undefined)) {
                  _context30.next = 18;
                  break;
                }

                throw new _MoneroError["default"]("Cannot provide seedOffset when creating wallet from keys");

              case 18:
                return _context30.abrupt("return", MoneroWalletKeys._createWalletFromKeys(config.getNetworkType(), config.getPrimaryAddress(), config.getPrivateViewKey(), config.getPrivateSpendKey(), config.getLanguage()));

              case 21:
                if (!(config.getSeedOffset() !== undefined)) {
                  _context30.next = 23;
                  break;
                }

                throw new _MoneroError["default"]("Cannot provide seedOffset when creating random wallet");

              case 23:
                if (!(config.getRestoreHeight() !== undefined)) {
                  _context30.next = 25;
                  break;
                }

                throw new _MoneroError["default"]("Cannot provide restoreHeight when creating random wallet");

              case 25:
                return _context30.abrupt("return", MoneroWalletKeys._createWalletRandom(config.getNetworkType(), config.getLanguage()));

              case 26:
              case "end":
                return _context30.stop();
            }
          }
        }, _callee30);
      }));

      function createWallet(_x7) {
        return _createWallet.apply(this, arguments);
      }

      return createWallet;
    }()
  }, {
    key: "_createWalletRandom",
    value: function () {
      var _createWalletRandom2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee33(networkType, language) {
        var module;
        return _regenerator["default"].wrap(function _callee33$(_context33) {
          while (1) {
            switch (_context33.prev = _context33.next) {
              case 0:
                // validate and sanitize params
                _MoneroNetworkType["default"].validate(networkType);

                if (language === undefined) language = "English"; // load wasm module

                _context33.next = 4;
                return _LibraryUtils["default"].loadKeysModule();

              case 4:
                module = _context33.sent;
                return _context33.abrupt("return", module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee32() {
                  return _regenerator["default"].wrap(function _callee32$(_context32) {
                    while (1) {
                      switch (_context32.prev = _context32.next) {
                        case 0:
                          return _context32.abrupt("return", new Promise(function (resolve, reject) {
                            // define callback for wasm
                            var callbackFn = /*#__PURE__*/function () {
                              var _ref14 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee31(cppAddress) {
                                return _regenerator["default"].wrap(function _callee31$(_context31) {
                                  while (1) {
                                    switch (_context31.prev = _context31.next) {
                                      case 0:
                                        if (typeof cppAddress === "string") reject(new _MoneroError["default"](cppAddress));else resolve(new MoneroWalletKeys(cppAddress));

                                      case 1:
                                      case "end":
                                        return _context31.stop();
                                    }
                                  }
                                }, _callee31);
                              }));

                              return function callbackFn(_x10) {
                                return _ref14.apply(this, arguments);
                              };
                            }(); // create wallet in wasm and invoke callback when done


                            module.create_keys_wallet_random(networkType, language, callbackFn);
                          }));

                        case 1:
                        case "end":
                          return _context32.stop();
                      }
                    }
                  }, _callee32);
                }))));

              case 6:
              case "end":
                return _context33.stop();
            }
          }
        }, _callee33);
      }));

      function _createWalletRandom(_x8, _x9) {
        return _createWalletRandom2.apply(this, arguments);
      }

      return _createWalletRandom;
    }()
  }, {
    key: "_createWalletFromMnemonic",
    value: function () {
      var _createWalletFromMnemonic2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee36(networkType, mnemonic, seedOffset) {
        var module;
        return _regenerator["default"].wrap(function _callee36$(_context36) {
          while (1) {
            switch (_context36.prev = _context36.next) {
              case 0:
                // validate and sanitize params
                _MoneroNetworkType["default"].validate(networkType);

                if (!(mnemonic === undefined)) {
                  _context36.next = 3;
                  break;
                }

                throw Error("Must define mnemonic phrase to create wallet from");

              case 3:
                if (seedOffset === undefined) seedOffset = ""; // load wasm module

                _context36.next = 6;
                return _LibraryUtils["default"].loadKeysModule();

              case 6:
                module = _context36.sent;
                return _context36.abrupt("return", module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee35() {
                  return _regenerator["default"].wrap(function _callee35$(_context35) {
                    while (1) {
                      switch (_context35.prev = _context35.next) {
                        case 0:
                          return _context35.abrupt("return", new Promise(function (resolve, reject) {
                            // define callback for wasm
                            var callbackFn = /*#__PURE__*/function () {
                              var _ref16 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee34(cppAddress) {
                                return _regenerator["default"].wrap(function _callee34$(_context34) {
                                  while (1) {
                                    switch (_context34.prev = _context34.next) {
                                      case 0:
                                        if (typeof cppAddress === "string") reject(new _MoneroError["default"](cppAddress));else resolve(new MoneroWalletKeys(cppAddress));

                                      case 1:
                                      case "end":
                                        return _context34.stop();
                                    }
                                  }
                                }, _callee34);
                              }));

                              return function callbackFn(_x14) {
                                return _ref16.apply(this, arguments);
                              };
                            }(); // create wallet in wasm and invoke callback when done


                            module.create_keys_wallet_from_mnemonic(networkType, mnemonic, seedOffset, callbackFn);
                          }));

                        case 1:
                        case "end":
                          return _context35.stop();
                      }
                    }
                  }, _callee35);
                }))));

              case 8:
              case "end":
                return _context36.stop();
            }
          }
        }, _callee36);
      }));

      function _createWalletFromMnemonic(_x11, _x12, _x13) {
        return _createWalletFromMnemonic2.apply(this, arguments);
      }

      return _createWalletFromMnemonic;
    }()
  }, {
    key: "_createWalletFromKeys",
    value: function () {
      var _createWalletFromKeys2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee39(networkType, address, privateViewKey, privateSpendKey, language) {
        var module;
        return _regenerator["default"].wrap(function _callee39$(_context39) {
          while (1) {
            switch (_context39.prev = _context39.next) {
              case 0:
                // validate and sanitize params
                _MoneroNetworkType["default"].validate(networkType);

                if (address === undefined) address = "";
                if (privateViewKey === undefined) privateViewKey = "";
                if (privateSpendKey === undefined) privateSpendKey = "";
                if (language === undefined) language = "English"; // load wasm module

                _context39.next = 7;
                return _LibraryUtils["default"].loadKeysModule();

              case 7:
                module = _context39.sent;
                return _context39.abrupt("return", module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee38() {
                  return _regenerator["default"].wrap(function _callee38$(_context38) {
                    while (1) {
                      switch (_context38.prev = _context38.next) {
                        case 0:
                          return _context38.abrupt("return", new Promise(function (resolve, reject) {
                            // define callback for wasm
                            var callbackFn = /*#__PURE__*/function () {
                              var _ref18 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee37(cppAddress) {
                                return _regenerator["default"].wrap(function _callee37$(_context37) {
                                  while (1) {
                                    switch (_context37.prev = _context37.next) {
                                      case 0:
                                        if (typeof cppAddress === "string") reject(new _MoneroError["default"](cppAddress));else resolve(new MoneroWalletKeys(cppAddress));

                                      case 1:
                                      case "end":
                                        return _context37.stop();
                                    }
                                  }
                                }, _callee37);
                              }));

                              return function callbackFn(_x20) {
                                return _ref18.apply(this, arguments);
                              };
                            }(); // create wallet in wasm and invoke callback when done


                            module.create_keys_wallet_from_keys(networkType, address, privateViewKey, privateSpendKey, language, callbackFn);
                          }));

                        case 1:
                        case "end":
                          return _context38.stop();
                      }
                    }
                  }, _callee38);
                }))));

              case 9:
              case "end":
                return _context39.stop();
            }
          }
        }, _callee39);
      }));

      function _createWalletFromKeys(_x15, _x16, _x17, _x18, _x19) {
        return _createWalletFromKeys2.apply(this, arguments);
      }

      return _createWalletFromKeys;
    }()
  }, {
    key: "getMnemonicLanguages",
    value: function () {
      var _getMnemonicLanguages = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee41() {
        var module;
        return _regenerator["default"].wrap(function _callee41$(_context41) {
          while (1) {
            switch (_context41.prev = _context41.next) {
              case 0:
                _context41.next = 2;
                return _LibraryUtils["default"].loadKeysModule();

              case 2:
                module = _context41.sent;
                return _context41.abrupt("return", module.queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee40() {
                  return _regenerator["default"].wrap(function _callee40$(_context40) {
                    while (1) {
                      switch (_context40.prev = _context40.next) {
                        case 0:
                          return _context40.abrupt("return", JSON.parse(module.get_keys_wallet_mnemonic_languages()).languages);

                        case 1:
                        case "end":
                          return _context40.stop();
                      }
                    }
                  }, _callee40);
                }))));

              case 4:
              case "end":
                return _context41.stop();
            }
          }
        }, _callee41);
      }));

      function getMnemonicLanguages() {
        return _getMnemonicLanguages.apply(this, arguments);
      }

      return getMnemonicLanguages;
    }()
  }]);
  return MoneroWalletKeys;
}(_MoneroWallet2["default"]);

var _default = MoneroWalletKeys;
exports["default"] = _default;