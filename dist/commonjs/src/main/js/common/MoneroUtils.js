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

var _assert = _interopRequireDefault(require("assert"));

var _GenUtils = _interopRequireDefault(require("./GenUtils"));

var _LibraryUtils = _interopRequireDefault(require("./LibraryUtils"));

var _MoneroError = _interopRequireDefault(require("./MoneroError"));

var _MoneroIntegratedAddress = _interopRequireDefault(require("../wallet/model/MoneroIntegratedAddress"));

var _MoneroNetworkType = _interopRequireDefault(require("../daemon/model/MoneroNetworkType"));

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

/**
 * Collection of Monero utilities. Runs in a worker thread by default.
 * 
 * @hideconstructor
 */
var MoneroUtils = /*#__PURE__*/function () {
  function MoneroUtils() {
    (0, _classCallCheck2["default"])(this, MoneroUtils);
  }

  (0, _createClass2["default"])(MoneroUtils, null, [{
    key: "getVersion",
    value:
    /**
     * <p>Get the version of the monero-javascript library.<p>
     * 
     * @return {string} the version of this monero-javascript library
     */
    function getVersion() {
      return "0.7.4";
    }
    /**
     * Enable or disable proxying these utilities to a worker thread.
     * 
     * @param {boolean} proxyToWorker - specifies if utilities should be proxied to a worker
     */

  }, {
    key: "setProxyToWorker",
    value: function setProxyToWorker(proxyToWorker) {
      MoneroUtils.PROXY_TO_WORKER = proxyToWorker || false;
    }
    /**
     * Validate the given mnemonic, throw an error if invalid.
     *
     * TODO: improve validation, use network type
     * 
     * @param {string} mnemonic - mnemonic to validate
     */

  }, {
    key: "validateMnemonic",
    value: function () {
      var _validateMnemonic = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(mnemonic) {
        var words;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                (0, _assert["default"])(mnemonic, "Mnemonic phrase is not initialized");
                words = mnemonic.split(" ");

                if (!(words.length !== MoneroUtils.NUM_MNEMONIC_WORDS)) {
                  _context.next = 4;
                  break;
                }

                throw new _MoneroError["default"]("Mnemonic phrase is " + words.length + " words but must be " + MoneroUtils.NUM_MNEMONIC_WORDS);

              case 4:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      function validateMnemonic(_x) {
        return _validateMnemonic.apply(this, arguments);
      }

      return validateMnemonic;
    }()
    /**
     * Indicates if a private view key is valid.
     * 
     * @param {string} privateViewKey is the private view key to validate
     * @return {Promise<bool>} true if the private view key is valid, false otherwise
     */

  }, {
    key: "isValidPrivateViewKey",
    value: function () {
      var _isValidPrivateViewKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(privateViewKey) {
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.prev = 0;
                _context2.next = 3;
                return MoneroUtils.validatePrivateViewKey(privateViewKey);

              case 3:
                return _context2.abrupt("return", true);

              case 6:
                _context2.prev = 6;
                _context2.t0 = _context2["catch"](0);
                return _context2.abrupt("return", false);

              case 9:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, null, [[0, 6]]);
      }));

      function isValidPrivateViewKey(_x2) {
        return _isValidPrivateViewKey.apply(this, arguments);
      }

      return isValidPrivateViewKey;
    }()
    /**
     * Indicates if a public view key is valid.
     * 
     * @param {string} publicViewKey is the public view key to validate
     * @return {Promise<bool>} true if the public view key is valid, false otherwise
     */

  }, {
    key: "isValidPublicViewKey",
    value: function () {
      var _isValidPublicViewKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(publicViewKey) {
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.prev = 0;
                _context3.next = 3;
                return MoneroUtils.validatePublicViewKey(publicViewKey);

              case 3:
                return _context3.abrupt("return", true);

              case 6:
                _context3.prev = 6;
                _context3.t0 = _context3["catch"](0);
                return _context3.abrupt("return", false);

              case 9:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, null, [[0, 6]]);
      }));

      function isValidPublicViewKey(_x3) {
        return _isValidPublicViewKey.apply(this, arguments);
      }

      return isValidPublicViewKey;
    }()
    /**
     * Indicates if a private spend key is valid.
     * 
     * @param {string} privateSpendKey is the private spend key to validate
     * @return {Promise<bool>} true if the private spend key is valid, false otherwise
     */

  }, {
    key: "isValidPrivateSpendKey",
    value: function () {
      var _isValidPrivateSpendKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(privateSpendKey) {
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.prev = 0;
                _context4.next = 3;
                return MoneroUtils.validatePrivateSpendKey(privateSpendKey);

              case 3:
                return _context4.abrupt("return", true);

              case 6:
                _context4.prev = 6;
                _context4.t0 = _context4["catch"](0);
                return _context4.abrupt("return", false);

              case 9:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, null, [[0, 6]]);
      }));

      function isValidPrivateSpendKey(_x4) {
        return _isValidPrivateSpendKey.apply(this, arguments);
      }

      return isValidPrivateSpendKey;
    }()
    /**
     * Indicates if a public spend key is valid.
     * 
     * @param {string} publicSpendKey is the public spend key to validate
     * @return {Promise<bool>} true if the public spend key is valid, false otherwise
     */

  }, {
    key: "isValidPublicSpendKey",
    value: function () {
      var _isValidPublicSpendKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(publicSpendKey) {
        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.prev = 0;
                _context5.next = 3;
                return MoneroUtils.validatePublicSpendKey(publicSpendKey);

              case 3:
                return _context5.abrupt("return", true);

              case 6:
                _context5.prev = 6;
                _context5.t0 = _context5["catch"](0);
                return _context5.abrupt("return", false);

              case 9:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, null, [[0, 6]]);
      }));

      function isValidPublicSpendKey(_x5) {
        return _isValidPublicSpendKey.apply(this, arguments);
      }

      return isValidPublicSpendKey;
    }()
    /**
     * Validate the given private view key, throw an error if invalid.
     *
     * @param {string} privateViewKey - private view key to validate
     */

  }, {
    key: "validatePrivateViewKey",
    value: function () {
      var _validatePrivateViewKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6(privateViewKey) {
        return _regenerator["default"].wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                if (MoneroUtils._isHex64(privateViewKey)) {
                  _context6.next = 2;
                  break;
                }

                throw new _MoneroError["default"]("private view key expected to be 64 hex characters");

              case 2:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6);
      }));

      function validatePrivateViewKey(_x6) {
        return _validatePrivateViewKey.apply(this, arguments);
      }

      return validatePrivateViewKey;
    }()
    /**
     * Validate the given public view key, throw an error if invalid.
     *
     * @param {string} publicViewKey - public view key to validate
     */

  }, {
    key: "validatePublicViewKey",
    value: function () {
      var _validatePublicViewKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7(publicViewKey) {
        return _regenerator["default"].wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                if (MoneroUtils._isHex64(publicViewKey)) {
                  _context7.next = 2;
                  break;
                }

                throw new _MoneroError["default"]("public view key expected to be 64 hex characters");

              case 2:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7);
      }));

      function validatePublicViewKey(_x7) {
        return _validatePublicViewKey.apply(this, arguments);
      }

      return validatePublicViewKey;
    }()
    /**
     * Validate the given private spend key, throw an error if invalid.
     *
     * @param {string} privateSpendKey - private spend key to validate
     */

  }, {
    key: "validatePrivateSpendKey",
    value: function () {
      var _validatePrivateSpendKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee8(privateSpendKey) {
        return _regenerator["default"].wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                if (MoneroUtils._isHex64(privateSpendKey)) {
                  _context8.next = 2;
                  break;
                }

                throw new _MoneroError["default"]("private spend key expected to be 64 hex characters");

              case 2:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8);
      }));

      function validatePrivateSpendKey(_x8) {
        return _validatePrivateSpendKey.apply(this, arguments);
      }

      return validatePrivateSpendKey;
    }()
    /**
     * Validate the given public spend key, throw an error if invalid.
     *
     * @param {string} publicSpendKey - public spend key to validate
     */

  }, {
    key: "validatePublicSpendKey",
    value: function () {
      var _validatePublicSpendKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee9(publicSpendKey) {
        return _regenerator["default"].wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                if (MoneroUtils._isHex64(publicSpendKey)) {
                  _context9.next = 2;
                  break;
                }

                throw new _MoneroError["default"]("public spend key expected to be 64 hex characters");

              case 2:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee9);
      }));

      function validatePublicSpendKey(_x9) {
        return _validatePublicSpendKey.apply(this, arguments);
      }

      return validatePublicSpendKey;
    }()
    /**
     * Get an integrated address.
     * 
     * @param {MoneroNetworkType} networkType - network type of the integrated address
     * @param {string} standardAddress - address to derive the integrated address from
     * @param {string} [paymentId] - optionally specifies the integrated address's payment id (defaults to random payment id)
     * @return {Promise<MoneroIntegratedAddress>} the integrated address
     */

  }, {
    key: "getIntegratedAddress",
    value: function () {
      var _getIntegratedAddress = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee11(networkType, standardAddress, paymentId) {
        var _args11 = arguments;
        return _regenerator["default"].wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                if (!MoneroUtils.PROXY_TO_WORKER) {
                  _context11.next = 6;
                  break;
                }

                _context11.t0 = _MoneroIntegratedAddress["default"];
                _context11.next = 4;
                return _LibraryUtils["default"].invokeWorker(undefined, "moneroUtilsGetIntegratedAddress", Array.from(_args11));

              case 4:
                _context11.t1 = _context11.sent;
                return _context11.abrupt("return", new _context11.t0(_context11.t1));

              case 6:
                // validate inputs
                _MoneroNetworkType["default"].validate(networkType);

                (0, _assert["default"])(typeof standardAddress === "string", "Address is not string");
                (0, _assert["default"])(standardAddress.length > 0, "Address is empty");
                (0, _assert["default"])(_GenUtils["default"].isBase58(standardAddress), "Address is not base 58"); // load keys module by default

                if (!(_LibraryUtils["default"].getWasmModule() === undefined)) {
                  _context11.next = 13;
                  break;
                }

                _context11.next = 13;
                return _LibraryUtils["default"].loadKeysModule();

              case 13:
                return _context11.abrupt("return", _LibraryUtils["default"].getWasmModule().queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee10() {
                  var integratedAddressJson;
                  return _regenerator["default"].wrap(function _callee10$(_context10) {
                    while (1) {
                      switch (_context10.prev = _context10.next) {
                        case 0:
                          integratedAddressJson = _LibraryUtils["default"].getWasmModule().get_integrated_address_util(networkType, standardAddress, paymentId ? paymentId : "");

                          if (!(integratedAddressJson.charAt(0) !== '{')) {
                            _context10.next = 3;
                            break;
                          }

                          throw new _MoneroError["default"](integratedAddressJson);

                        case 3:
                          return _context10.abrupt("return", new _MoneroIntegratedAddress["default"](JSON.parse(integratedAddressJson)));

                        case 4:
                        case "end":
                          return _context10.stop();
                      }
                    }
                  }, _callee10);
                }))));

              case 14:
              case "end":
                return _context11.stop();
            }
          }
        }, _callee11);
      }));

      function getIntegratedAddress(_x10, _x11, _x12) {
        return _getIntegratedAddress.apply(this, arguments);
      }

      return getIntegratedAddress;
    }()
    /**
     * Determine if the given address is valid.
     * 
     * @param {string} address - address
     * @param {MoneroNetworkType} networkType - network type of the address to validate
     * @return {Promise<boolean>} true if the address is valid, false otherwise
     */

  }, {
    key: "isValidAddress",
    value: function () {
      var _isValidAddress = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee12(address, networkType) {
        return _regenerator["default"].wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                _context12.prev = 0;
                _context12.next = 3;
                return MoneroUtils.validateAddress(address, networkType);

              case 3:
                return _context12.abrupt("return", true);

              case 6:
                _context12.prev = 6;
                _context12.t0 = _context12["catch"](0);
                return _context12.abrupt("return", false);

              case 9:
              case "end":
                return _context12.stop();
            }
          }
        }, _callee12, null, [[0, 6]]);
      }));

      function isValidAddress(_x13, _x14) {
        return _isValidAddress.apply(this, arguments);
      }

      return isValidAddress;
    }()
    /**
     * Validate the given address, throw an error if invalid.
     *
     * @param {string} address - address to validate
     * @param {MoneroNetworkType} networkType - network type of the address to validate
     */

  }, {
    key: "validateAddress",
    value: function () {
      var _validateAddress = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee14(address, networkType) {
        var _args14 = arguments;
        return _regenerator["default"].wrap(function _callee14$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                if (!MoneroUtils.PROXY_TO_WORKER) {
                  _context14.next = 2;
                  break;
                }

                return _context14.abrupt("return", _LibraryUtils["default"].invokeWorker(undefined, "moneroUtilsValidateAddress", Array.from(_args14)));

              case 2:
                // validate inputs
                (0, _assert["default"])(typeof address === "string", "Address is not string");
                (0, _assert["default"])(address.length > 0, "Address is empty");
                (0, _assert["default"])(_GenUtils["default"].isBase58(address), "Address is not base 58");

                _MoneroNetworkType["default"].validate(networkType); // load keys module by default


                if (!(_LibraryUtils["default"].getWasmModule() === undefined)) {
                  _context14.next = 9;
                  break;
                }

                _context14.next = 9;
                return _LibraryUtils["default"].loadKeysModule();

              case 9:
                return _context14.abrupt("return", _LibraryUtils["default"].getWasmModule().queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee13() {
                  var errMsg;
                  return _regenerator["default"].wrap(function _callee13$(_context13) {
                    while (1) {
                      switch (_context13.prev = _context13.next) {
                        case 0:
                          errMsg = _LibraryUtils["default"].getWasmModule().validate_address(address, networkType);

                          if (!errMsg) {
                            _context13.next = 3;
                            break;
                          }

                          throw new _MoneroError["default"](errMsg);

                        case 3:
                        case "end":
                          return _context13.stop();
                      }
                    }
                  }, _callee13);
                }))));

              case 10:
              case "end":
                return _context14.stop();
            }
          }
        }, _callee14);
      }));

      function validateAddress(_x15, _x16) {
        return _validateAddress.apply(this, arguments);
      }

      return validateAddress;
    }()
    /**
     * Determine if the given payment id is valid.
     * 
     * @param {string} paymentId - payment id to determine if valid
     * @return {Promise<bool>} true if the payment id is valid, false otherwise
     */

  }, {
    key: "isValidPaymentId",
    value: function () {
      var _isValidPaymentId = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee15(paymentId) {
        return _regenerator["default"].wrap(function _callee15$(_context15) {
          while (1) {
            switch (_context15.prev = _context15.next) {
              case 0:
                _context15.prev = 0;
                _context15.next = 3;
                return MoneroUtils.validatePaymentId(paymentId);

              case 3:
                return _context15.abrupt("return", true);

              case 6:
                _context15.prev = 6;
                _context15.t0 = _context15["catch"](0);
                return _context15.abrupt("return", false);

              case 9:
              case "end":
                return _context15.stop();
            }
          }
        }, _callee15, null, [[0, 6]]);
      }));

      function isValidPaymentId(_x17) {
        return _isValidPaymentId.apply(this, arguments);
      }

      return isValidPaymentId;
    }()
    /**
     * Validate the given payment id, throw an error if invalid.
     * 
     * TODO: improve validation
     * 
     * @param {string} paymentId - payment id to validate 
     */

  }, {
    key: "validatePaymentId",
    value: function () {
      var _validatePaymentId = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee16(paymentId) {
        return _regenerator["default"].wrap(function _callee16$(_context16) {
          while (1) {
            switch (_context16.prev = _context16.next) {
              case 0:
                _assert["default"].equal((0, _typeof2["default"])(paymentId), "string");

                (0, _assert["default"])(paymentId.length === 16 || paymentId.length === 64);

              case 2:
              case "end":
                return _context16.stop();
            }
          }
        }, _callee16);
      }));

      function validatePaymentId(_x18) {
        return _validatePaymentId.apply(this, arguments);
      }

      return validatePaymentId;
    }()
    /**
     * Decode tx extra according to https://cryptonote.org/cns/cns005.txt and
     * returns the last tx pub key.
     * 
     * TODO: use c++ bridge for this
     * 
     * @param [byte[]] txExtra - array of tx extra bytes
     * @return {string} the last pub key as a hexidecimal string
     */

  }, {
    key: "getLastTxPubKey",
    value: function () {
      var _getLastTxPubKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee17(txExtra) {
        var lastPubKeyIdx, i, tag;
        return _regenerator["default"].wrap(function _callee17$(_context17) {
          while (1) {
            switch (_context17.prev = _context17.next) {
              case 0:
                i = 0;

              case 1:
                if (!(i < txExtra.length)) {
                  _context17.next = 16;
                  break;
                }

                tag = txExtra[i];

                if (!(tag === 0 || tag === 2)) {
                  _context17.next = 7;
                  break;
                }

                i += 1 + txExtra[i + 1]; // advance to next tag

                _context17.next = 13;
                break;

              case 7:
                if (!(tag === 1)) {
                  _context17.next = 12;
                  break;
                }

                lastPubKeyIdx = i + 1;
                i += 1 + 32; // advance to next tag

                _context17.next = 13;
                break;

              case 12:
                throw new _MoneroError["default"]("Invalid sub-field tag: " + tag);

              case 13:
                i++;
                _context17.next = 1;
                break;

              case 16:
                return _context17.abrupt("return", Buffer.from(new Uint8Array(txExtra.slice(lastPubKeyIdx, lastPubKeyIdx + 32))).toString("hex"));

              case 17:
              case "end":
                return _context17.stop();
            }
          }
        }, _callee17);
      }));

      function getLastTxPubKey(_x19) {
        return _getLastTxPubKey.apply(this, arguments);
      }

      return getLastTxPubKey;
    }()
    /**
     * Determines if two payment ids are functionally equal.
     * 
     * For example, 03284e41c342f032 and 03284e41c342f032000000000000000000000000000000000000000000000000 are considered equal.
     * 
     * @param {string} paymentId1 is a payment id to compare
     * @param {string} paymentId2 is a payment id to compare
     * @return {bool} true if the payment ids are equal, false otherwise
     */

  }, {
    key: "paymentIdsEqual",
    value: function paymentIdsEqual(paymentId1, paymentId2) {
      var maxLength = Math.max(paymentId1.length, paymentId2.length);

      for (var i = 0; i < maxLength; i++) {
        if (i < paymentId1.length && i < paymentId2.length && paymentId1[i] !== paymentId2[i]) return false;
        if (i >= paymentId1.length && paymentId2[i] !== '0') return false;
        if (i >= paymentId2.length && paymentId1[i] !== '0') return false;
      }

      return true;
    }
    /**
     * Merges a transaction into a list of existing transactions.
     * 
     * @param {MoneroTx[]} txs - existing transactions to merge into
     * @param {MoneroTx} tx - transaction to merge into the list
     */

  }, {
    key: "mergeTx",
    value: function mergeTx(txs, tx) {
      var _iterator = _createForOfIteratorHelper(txs),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var aTx = _step.value;

          if (aTx.getHash() === tx.getHash()) {
            aTx.merge(tx);
            return;
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      txs.push(tx);
    }
    /**
     * Convert the given JSON to a binary Uint8Array using Monero's portable storage format.
     * 
     * @param {object} json - json to convert to binary
     * @return {Promise<Uint8Array>} the json converted to portable storage binary
     */

  }, {
    key: "jsonToBinary",
    value: function () {
      var _jsonToBinary = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee19(json) {
        var _args19 = arguments;
        return _regenerator["default"].wrap(function _callee19$(_context19) {
          while (1) {
            switch (_context19.prev = _context19.next) {
              case 0:
                if (!MoneroUtils.PROXY_TO_WORKER) {
                  _context19.next = 2;
                  break;
                }

                return _context19.abrupt("return", _LibraryUtils["default"].invokeWorker(undefined, "moneroUtilsJsonToBinary", Array.from(_args19)));

              case 2:
                if (!(_LibraryUtils["default"].getWasmModule() === undefined)) {
                  _context19.next = 5;
                  break;
                }

                _context19.next = 5;
                return _LibraryUtils["default"].loadKeysModule();

              case 5:
                return _context19.abrupt("return", _LibraryUtils["default"].getWasmModule().queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee18() {
                  var binMemInfoStr, binMemInfo, view, i;
                  return _regenerator["default"].wrap(function _callee18$(_context18) {
                    while (1) {
                      switch (_context18.prev = _context18.next) {
                        case 0:
                          // serialize json to binary which is stored in c++ heap
                          binMemInfoStr = _LibraryUtils["default"].getWasmModule().malloc_binary_from_json(JSON.stringify(json)); // sanitize binary memory address info

                          binMemInfo = JSON.parse(binMemInfoStr);
                          binMemInfo.ptr = parseInt(binMemInfo.ptr);
                          binMemInfo.length = parseInt(binMemInfo.length); // read binary data from heap to Uint8Array

                          view = new Uint8Array(binMemInfo.length);

                          for (i = 0; i < binMemInfo.length; i++) {
                            view[i] = _LibraryUtils["default"].getWasmModule().HEAPU8[binMemInfo.ptr / Uint8Array.BYTES_PER_ELEMENT + i];
                          } // free binary on heap


                          _LibraryUtils["default"].getWasmModule()._free(binMemInfo.ptr); // return json from binary data


                          return _context18.abrupt("return", view);

                        case 8:
                        case "end":
                          return _context18.stop();
                      }
                    }
                  }, _callee18);
                }))));

              case 6:
              case "end":
                return _context19.stop();
            }
          }
        }, _callee19);
      }));

      function jsonToBinary(_x20) {
        return _jsonToBinary.apply(this, arguments);
      }

      return jsonToBinary;
    }()
    /**
     * Convert the given portable storage binary to JSON.
     * 
     * @param {Uint8Array} uint8arr - binary data in Monero's portable storage format
     * @return {Promise<object>} JSON object converted from the binary data
     */

  }, {
    key: "binaryToJson",
    value: function () {
      var _binaryToJson = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee21(uint8arr) {
        var _args21 = arguments;
        return _regenerator["default"].wrap(function _callee21$(_context21) {
          while (1) {
            switch (_context21.prev = _context21.next) {
              case 0:
                if (!MoneroUtils.PROXY_TO_WORKER) {
                  _context21.next = 2;
                  break;
                }

                return _context21.abrupt("return", _LibraryUtils["default"].invokeWorker(undefined, "moneroUtilsBinaryToJson", Array.from(_args21)));

              case 2:
                if (!(_LibraryUtils["default"].getWasmModule() === undefined)) {
                  _context21.next = 5;
                  break;
                }

                _context21.next = 5;
                return _LibraryUtils["default"].loadKeysModule();

              case 5:
                return _context21.abrupt("return", _LibraryUtils["default"].getWasmModule().queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee20() {
                  var ptr, heap, binMemInfo, ret_string;
                  return _regenerator["default"].wrap(function _callee20$(_context20) {
                    while (1) {
                      switch (_context20.prev = _context20.next) {
                        case 0:
                          // allocate space in c++ heap for binary
                          ptr = _LibraryUtils["default"].getWasmModule()._malloc(uint8arr.length * uint8arr.BYTES_PER_ELEMENT);
                          heap = new Uint8Array(_LibraryUtils["default"].getWasmModule().HEAPU8.buffer, ptr, uint8arr.length * uint8arr.BYTES_PER_ELEMENT);

                          if (!(ptr !== heap.byteOffset)) {
                            _context20.next = 4;
                            break;
                          }

                          throw new _MoneroError["default"]("Memory ptr !== heap.byteOffset");

                        case 4:
                          // should be equal
                          // write binary to heap
                          heap.set(new Uint8Array(uint8arr.buffer)); // create object with binary memory address info

                          binMemInfo = {
                            ptr: ptr,
                            length: uint8arr.length
                          }; // convert binary to json str

                          ret_string = _LibraryUtils["default"].getWasmModule().binary_to_json(JSON.stringify(binMemInfo)); // free binary on heap

                          _LibraryUtils["default"].getWasmModule()._free(ptr); // parse and return json


                          return _context20.abrupt("return", JSON.parse(ret_string));

                        case 9:
                        case "end":
                          return _context20.stop();
                      }
                    }
                  }, _callee20);
                }))));

              case 6:
              case "end":
                return _context21.stop();
            }
          }
        }, _callee21);
      }));

      function binaryToJson(_x21) {
        return _binaryToJson.apply(this, arguments);
      }

      return binaryToJson;
    }()
    /**
     * Convert the binary response from daemon RPC block retrieval to JSON.
     * 
     * @param {Uint8Array} uint8arr - binary response from daemon RPC when getting blocks
     * @return {Promise<object>} JSON object with the blocks data
     */

  }, {
    key: "binaryBlocksToJson",
    value: function () {
      var _binaryBlocksToJson = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee23(uint8arr) {
        var _args23 = arguments;
        return _regenerator["default"].wrap(function _callee23$(_context23) {
          while (1) {
            switch (_context23.prev = _context23.next) {
              case 0:
                if (!MoneroUtils.PROXY_TO_WORKER) {
                  _context23.next = 2;
                  break;
                }

                return _context23.abrupt("return", _LibraryUtils["default"].invokeWorker(undefined, "moneroUtilsBinaryBlocksToJson", Array.from(_args23)));

              case 2:
                if (!(_LibraryUtils["default"].getWasmModule() === undefined)) {
                  _context23.next = 5;
                  break;
                }

                _context23.next = 5;
                return _LibraryUtils["default"].loadKeysModule();

              case 5:
                return _context23.abrupt("return", _LibraryUtils["default"].getWasmModule().queueTask( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee22() {
                  var ptr, heap, binMemInfo, json_str, json;
                  return _regenerator["default"].wrap(function _callee22$(_context22) {
                    while (1) {
                      switch (_context22.prev = _context22.next) {
                        case 0:
                          // allocate space in c++ heap for binary
                          ptr = _LibraryUtils["default"].getWasmModule()._malloc(uint8arr.length * uint8arr.BYTES_PER_ELEMENT);
                          heap = new Uint8Array(_LibraryUtils["default"].getWasmModule().HEAPU8.buffer, ptr, uint8arr.length * uint8arr.BYTES_PER_ELEMENT);

                          if (!(ptr !== heap.byteOffset)) {
                            _context22.next = 4;
                            break;
                          }

                          throw new _MoneroError["default"]("Memory ptr !== heap.byteOffset");

                        case 4:
                          // should be equal
                          // write binary to heap
                          heap.set(new Uint8Array(uint8arr.buffer)); // create object with binary memory address info

                          binMemInfo = {
                            ptr: ptr,
                            length: uint8arr.length
                          }; // convert binary to json str

                          json_str = _LibraryUtils["default"].getWasmModule().binary_blocks_to_json(JSON.stringify(binMemInfo)); // free memory

                          _LibraryUtils["default"].getWasmModule()._free(ptr); // parse result to json


                          json = JSON.parse(json_str); // parsing json gives arrays of block and tx strings

                          json.blocks = json.blocks.map(function (blockStr) {
                            return JSON.parse(blockStr);
                          }); // replace block strings with parsed blocks

                          json.txs = json.txs.map(function (txs) {
                            return txs ? txs.map(function (tx) {
                              return JSON.parse(tx.replace(",", "{") + "}");
                            }) : [];
                          }); // modify tx string to proper json and parse // TODO: more efficient way than this json manipulation?

                          return _context22.abrupt("return", json);

                        case 12:
                        case "end":
                          return _context22.stop();
                      }
                    }
                  }, _callee22);
                }))));

              case 6:
              case "end":
                return _context23.stop();
            }
          }
        }, _callee23);
      }));

      function binaryBlocksToJson(_x22) {
        return _binaryBlocksToJson.apply(this, arguments);
      }

      return binaryBlocksToJson;
    }()
    /**
     * Convert XMR to atomic units.
     * 
     * @param {number|string} amountXmr - amount in XMR to convert to atomic units
     * @return {BigInt} amount in atomic units
     */

  }, {
    key: "xmrToAtomicUnits",
    value: function xmrToAtomicUnits(amountXmr) {
      if (typeof amountXmr === "number") amountXmr = "" + amountXmr;else if (typeof amountXmr !== "string") throw new _MoneroError["default"]("Must provide XMR amount as a string or js number to convert to atomic units");
      var decimalDivisor = 1;
      var decimalIdx = amountXmr.indexOf('.');

      if (decimalIdx > -1) {
        decimalDivisor = Math.pow(10, amountXmr.length - decimalIdx - 1);
        amountXmr = amountXmr.slice(0, decimalIdx) + amountXmr.slice(decimalIdx + 1);
      }

      return BigInt(amountXmr) * BigInt(MoneroUtils.AU_PER_XMR) / BigInt(decimalDivisor);
    }
    /**
     * Convert atomic units to XMR.
     * 
     * @param {BigInt|string} amountAtomicUnits - amount in atomic units to convert to XMR
     * @return {number} amount in XMR 
     */

  }, {
    key: "atomicUnitsToXmr",
    value: function atomicUnitsToXmr(amountAtomicUnits) {
      if (typeof amountAtomicUnits === "string") amountAtomicUnits = BigInt(amountAtomicUnits);else if (!(amountAtomicUnits instanceof BigInt)) throw new _MoneroError["default"]("Must provide atomic units as BigInt or string to convert to XMR");
      var quotientAndRemainder = amountAtomicUnits.divRem(BigInt(MoneroUtils.AU_PER_XMR));
      return Number(quotientAndRemainder[0].toJSValue() + quotientAndRemainder[1].toJSValue() / MoneroUtils.AU_PER_XMR);
    }
  }, {
    key: "_isHex64",
    value: function _isHex64(str) {
      return typeof str === "string" && str.length === 64 && _GenUtils["default"].isHex(str);
    }
  }]);
  return MoneroUtils;
}();

MoneroUtils.PROXY_TO_WORKER = false;
MoneroUtils.NUM_MNEMONIC_WORDS = 25;
MoneroUtils.RING_SIZE = 12;
MoneroUtils.MAX_REQUESTS_PER_SECOND = 50;
MoneroUtils.AU_PER_XMR = 1000000000000;
var _default = MoneroUtils;
exports["default"] = _default;