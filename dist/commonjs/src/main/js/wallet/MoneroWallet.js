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

var _assert = _interopRequireDefault(require("assert"));

var _MoneroBlock = _interopRequireDefault(require("../daemon/model/MoneroBlock"));

var _MoneroError = _interopRequireDefault(require("../common/MoneroError"));

var _MoneroOutputQuery = _interopRequireDefault(require("./model/MoneroOutputQuery"));

var _MoneroTransferQuery = _interopRequireDefault(require("./model/MoneroTransferQuery"));

var _MoneroTxConfig = _interopRequireDefault(require("./model/MoneroTxConfig"));

var _MoneroTxQuery = _interopRequireDefault(require("./model/MoneroTxQuery"));

var _MoneroTxSet = _interopRequireDefault(require("./model/MoneroTxSet"));

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

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
 * Monero wallet interface and default implementations.
 * 
 * @interface
 */
var MoneroWallet = /*#__PURE__*/function () {
  function MoneroWallet() {
    (0, _classCallCheck2["default"])(this, MoneroWallet);
  }

  (0, _createClass2["default"])(MoneroWallet, [{
    key: "addListener",
    value:
    /**
     * Register a listener to receive wallet notifications.
     * 
     * @param {MoneroWalletListener} listener - listener to receive wallet notifications
     */
    function () {
      var _addListener = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(listener) {
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                throw new Error("Not supported");

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
    /**
     * Unregister a listener to receive wallet notifications.
     * 
     * @param {MoneroWalletListener} listener - listener to unregister
     */

  }, {
    key: "removeListener",
    value: function () {
      var _removeListener = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(listener) {
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                throw new Error("Not supported");

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
    /**
     * Get the listeners registered with the wallet.
     * 
     * @return {MoneroWalletListener[]} the registered listeners
     */

  }, {
    key: "getListeners",
    value: function getListeners() {
      throw new Error("Not supported");
    }
    /**
     * Indicates if the wallet is view-only, meaning it does not have the private
     * spend key and can therefore only observe incoming outputs.
     * 
     * @return {bool} true if the wallet is view-only, false otherwise
     */

  }, {
    key: "isViewOnly",
    value: function () {
      var _isViewOnly = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3() {
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }));

      function isViewOnly() {
        return _isViewOnly.apply(this, arguments);
      }

      return isViewOnly;
    }()
    /**
     * Set the wallet's daemon connection.
     * 
     * @param {string|MoneroRpcConnection} [uriOrConnection] - daemon's URI or connection (defaults to offline)
     * @param {string} [username] - username to authenticate with the daemon (optional)
     * @param {string} [password] - password to authenticate with the daemon (optional)
     */

  }, {
    key: "setDaemonConnection",
    value: function () {
      var _setDaemonConnection = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(uriOrConnection, username, password) {
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4);
      }));

      function setDaemonConnection(_x3, _x4, _x5) {
        return _setDaemonConnection.apply(this, arguments);
      }

      return setDaemonConnection;
    }()
    /**
     * Get the wallet's daemon connection.
     * 
     * @return {MoneroRpcConnection} the wallet's daemon connection
     */

  }, {
    key: "getDaemonConnection",
    value: function () {
      var _getDaemonConnection = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5() {
        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5);
      }));

      function getDaemonConnection() {
        return _getDaemonConnection.apply(this, arguments);
      }

      return getDaemonConnection;
    }()
    /**
     * Indicates if the wallet is connected to daemon.
     * 
     * @return {boolean} true if the wallet is connected to a daemon, false otherwise
     */

  }, {
    key: "isConnectedToDaemon",
    value: function () {
      var _isConnectedToDaemon = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6() {
        return _regenerator["default"].wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6);
      }));

      function isConnectedToDaemon() {
        return _isConnectedToDaemon.apply(this, arguments);
      }

      return isConnectedToDaemon;
    }()
    /**
     * Gets the version of the wallet.
     * 
     * @return {MoneroVersion} the version of the wallet
     */

  }, {
    key: "getVersion",
    value: function () {
      var _getVersion = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7() {
        return _regenerator["default"].wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7);
      }));

      function getVersion() {
        return _getVersion.apply(this, arguments);
      }

      return getVersion;
    }()
    /**
     * Get the wallet's path.
     * 
     * @return {string} the path the wallet can be opened with
     */

  }, {
    key: "getPath",
    value: function () {
      var _getPath = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee8() {
        return _regenerator["default"].wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8);
      }));

      function getPath() {
        return _getPath.apply(this, arguments);
      }

      return getPath;
    }()
    /**
     * Get the wallet's mnemonic phrase derived from the seed.
     * 
     * @return {string} the wallet's mnemonic phrase
     */

  }, {
    key: "getMnemonic",
    value: function () {
      var _getMnemonic = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee9() {
        return _regenerator["default"].wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee9);
      }));

      function getMnemonic() {
        return _getMnemonic.apply(this, arguments);
      }

      return getMnemonic;
    }()
    /**
     * Get the language of the wallet's mnemonic phrase.
     * 
     * @return {string} the language of the wallet's mnemonic phrase
     */

  }, {
    key: "getMnemonicLanguage",
    value: function () {
      var _getMnemonicLanguage = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee10() {
        return _regenerator["default"].wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee10);
      }));

      function getMnemonicLanguage() {
        return _getMnemonicLanguage.apply(this, arguments);
      }

      return getMnemonicLanguage;
    }()
    /**
     * Get the wallet's private view key.
     * 
     * @return {string} the wallet's private view key
     */

  }, {
    key: "getPrivateViewKey",
    value: function () {
      var _getPrivateViewKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee11() {
        return _regenerator["default"].wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context11.stop();
            }
          }
        }, _callee11);
      }));

      function getPrivateViewKey() {
        return _getPrivateViewKey.apply(this, arguments);
      }

      return getPrivateViewKey;
    }()
    /**
     * Get the wallet's private spend key.
     * 
     * @return {string} the wallet's private spend key
     */

  }, {
    key: "getPrivateSpendKey",
    value: function () {
      var _getPrivateSpendKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee12() {
        return _regenerator["default"].wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context12.stop();
            }
          }
        }, _callee12);
      }));

      function getPrivateSpendKey() {
        return _getPrivateSpendKey.apply(this, arguments);
      }

      return getPrivateSpendKey;
    }()
    /**
     * Get the wallet's public view key.
     * 
     * @return {string} the wallet's public view key
     */

  }, {
    key: "getPublicViewKey",
    value: function () {
      var _getPublicViewKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee13() {
        return _regenerator["default"].wrap(function _callee13$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context13.stop();
            }
          }
        }, _callee13);
      }));

      function getPublicViewKey() {
        return _getPublicViewKey.apply(this, arguments);
      }

      return getPublicViewKey;
    }()
    /**
     * Get the wallet's public spend key.
     * 
     * @return {string} the wallet's public spend key
     */

  }, {
    key: "getPublicSpendKey",
    value: function () {
      var _getPublicSpendKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee14() {
        return _regenerator["default"].wrap(function _callee14$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context14.stop();
            }
          }
        }, _callee14);
      }));

      function getPublicSpendKey() {
        return _getPublicSpendKey.apply(this, arguments);
      }

      return getPublicSpendKey;
    }()
    /**
     * Get the wallet's primary address.
     * 
     * @return {string} the wallet's primary address
     */

  }, {
    key: "getPrimaryAddress",
    value: function () {
      var _getPrimaryAddress = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee15() {
        return _regenerator["default"].wrap(function _callee15$(_context15) {
          while (1) {
            switch (_context15.prev = _context15.next) {
              case 0:
                _context15.next = 2;
                return this.getAddress(0, 0);

              case 2:
                return _context15.abrupt("return", _context15.sent);

              case 3:
              case "end":
                return _context15.stop();
            }
          }
        }, _callee15, this);
      }));

      function getPrimaryAddress() {
        return _getPrimaryAddress.apply(this, arguments);
      }

      return getPrimaryAddress;
    }()
    /**
     * Get the address of a specific subaddress.
     * 
     * @param {number} accountIdx - the account index of the address's subaddress
     * @param {number} subaddressIdx - the subaddress index within the account
     * @return {string} the receive address of the specified subaddress
     */

  }, {
    key: "getAddress",
    value: function () {
      var _getAddress = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee16(accountIdx, subaddressIdx) {
        return _regenerator["default"].wrap(function _callee16$(_context16) {
          while (1) {
            switch (_context16.prev = _context16.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context16.stop();
            }
          }
        }, _callee16);
      }));

      function getAddress(_x6, _x7) {
        return _getAddress.apply(this, arguments);
      }

      return getAddress;
    }()
    /**
     * Get the account and subaddress index of the given address.
     * 
     * @param {string} address - address to get the account and subaddress index from
     * @return {MoneroSubaddress} the account and subaddress indices
     */

  }, {
    key: "getAddressIndex",
    value: function () {
      var _getAddressIndex = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee17(address) {
        return _regenerator["default"].wrap(function _callee17$(_context17) {
          while (1) {
            switch (_context17.prev = _context17.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context17.stop();
            }
          }
        }, _callee17);
      }));

      function getAddressIndex(_x8) {
        return _getAddressIndex.apply(this, arguments);
      }

      return getAddressIndex;
    }()
    /**
     * Get an integrated address based on the given standard address and payment
     * ID. Uses the wallet's primary address if an address is not given.
     * Generates a random payment ID if a payment ID is not given.
     * 
     * @param {string} standardAddress is the standard address to generate the integrated address from (wallet's primary address if undefined)
     * @param {string} paymentId is the payment ID to generate an integrated address from (randomly generated if undefined)
     * @return {MoneroIntegratedAddress} the integrated address
     */

  }, {
    key: "getIntegratedAddress",
    value: function () {
      var _getIntegratedAddress = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee18(standardAddress, paymentId) {
        return _regenerator["default"].wrap(function _callee18$(_context18) {
          while (1) {
            switch (_context18.prev = _context18.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context18.stop();
            }
          }
        }, _callee18);
      }));

      function getIntegratedAddress(_x9, _x10) {
        return _getIntegratedAddress.apply(this, arguments);
      }

      return getIntegratedAddress;
    }()
    /**
     * Decode an integrated address to get its standard address and payment id.
     * 
     * @param {string} integratedAddress - integrated address to decode
     * @return {MoneroIntegratedAddress} the decoded integrated address including standard address and payment id
     */

  }, {
    key: "decodeIntegratedAddress",
    value: function () {
      var _decodeIntegratedAddress = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee19(integratedAddress) {
        return _regenerator["default"].wrap(function _callee19$(_context19) {
          while (1) {
            switch (_context19.prev = _context19.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context19.stop();
            }
          }
        }, _callee19);
      }));

      function decodeIntegratedAddress(_x11) {
        return _decodeIntegratedAddress.apply(this, arguments);
      }

      return decodeIntegratedAddress;
    }()
    /**
     * Get the block height that the wallet is synced to.
     * 
     * @return {int} the block height that the wallet is synced to
     */

  }, {
    key: "getHeight",
    value: function () {
      var _getHeight = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee20() {
        return _regenerator["default"].wrap(function _callee20$(_context20) {
          while (1) {
            switch (_context20.prev = _context20.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context20.stop();
            }
          }
        }, _callee20);
      }));

      function getHeight() {
        return _getHeight.apply(this, arguments);
      }

      return getHeight;
    }()
    /**
     * Get the blockchain's height.
     * 
     * @return {int} the blockchain's height
     */

  }, {
    key: "getDaemonHeight",
    value: function () {
      var _getDaemonHeight = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee21() {
        return _regenerator["default"].wrap(function _callee21$(_context21) {
          while (1) {
            switch (_context21.prev = _context21.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context21.stop();
            }
          }
        }, _callee21);
      }));

      function getDaemonHeight() {
        return _getDaemonHeight.apply(this, arguments);
      }

      return getDaemonHeight;
    }()
    /**
     * Get the blockchain's height by date as a conservative estimate for scanning.
     * 
     * @param {number} year - year of the height to get
     * @param {number} month - month of the height to get as a number between 1 and 12
     * @param {number} day - day of the height to get as a number between 1 and 31
     * @return the blockchain's approximate height at the given date
     */

  }, {
    key: "getHeightByDate",
    value: function () {
      var _getHeightByDate = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee22(year, month, day) {
        return _regenerator["default"].wrap(function _callee22$(_context22) {
          while (1) {
            switch (_context22.prev = _context22.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context22.stop();
            }
          }
        }, _callee22);
      }));

      function getHeightByDate(_x12, _x13, _x14) {
        return _getHeightByDate.apply(this, arguments);
      }

      return getHeightByDate;
    }()
    /**
     * Synchronize the wallet with the daemon as a one-time synchronous process.
     * 
     * @param {MoneroWalletListener|number} [listenerOrStartHeight] - listener xor start height (defaults to no sync listener, the last synced block)
     * @param {number} [startHeight] - startHeight if not given in first arg (defaults to last synced block)
     */

  }, {
    key: "sync",
    value: function () {
      var _sync = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee23(listenerOrStartHeight, startHeight) {
        return _regenerator["default"].wrap(function _callee23$(_context23) {
          while (1) {
            switch (_context23.prev = _context23.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context23.stop();
            }
          }
        }, _callee23);
      }));

      function sync(_x15, _x16) {
        return _sync.apply(this, arguments);
      }

      return sync;
    }()
    /**
     * Start background synchronizing with a maximum period between syncs.
     * 
     * @param {number} [syncPeriodInMs] - maximum period between syncs in milliseconds (default is wallet-specific)
     */

  }, {
    key: "startSyncing",
    value: function () {
      var _startSyncing = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee24(syncPeriodInMs) {
        return _regenerator["default"].wrap(function _callee24$(_context24) {
          while (1) {
            switch (_context24.prev = _context24.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context24.stop();
            }
          }
        }, _callee24);
      }));

      function startSyncing(_x17) {
        return _startSyncing.apply(this, arguments);
      }

      return startSyncing;
    }()
    /**
     * Stop synchronizing the wallet with the daemon.
     */

  }, {
    key: "stopSyncing",
    value: function () {
      var _stopSyncing = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee25() {
        return _regenerator["default"].wrap(function _callee25$(_context25) {
          while (1) {
            switch (_context25.prev = _context25.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context25.stop();
            }
          }
        }, _callee25);
      }));

      function stopSyncing() {
        return _stopSyncing.apply(this, arguments);
      }

      return stopSyncing;
    }()
    /**
     * Scan transactions by their hash/id.
     * 
     * @param {string[]} txHashes - tx hashes to scan
     */

  }, {
    key: "scanTxs",
    value: function () {
      var _scanTxs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee26(txHashes) {
        return _regenerator["default"].wrap(function _callee26$(_context26) {
          while (1) {
            switch (_context26.prev = _context26.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context26.stop();
            }
          }
        }, _callee26);
      }));

      function scanTxs(_x18) {
        return _scanTxs.apply(this, arguments);
      }

      return scanTxs;
    }()
    /**
     * <p>Rescan the blockchain for spent outputs.</p>
     * 
     * <p>Note: this can only be called with a trusted daemon.</p>
     * 
     * <p>Example use case: peer multisig hex is import when connected to an untrusted daemon,
     * so the wallet will not rescan spent outputs.  Then the wallet connects to a trusted
     * daemon.  This method should be manually invoked to rescan outputs.</p>
     */

  }, {
    key: "rescanSpent",
    value: function () {
      var _rescanSpent = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee27() {
        return _regenerator["default"].wrap(function _callee27$(_context27) {
          while (1) {
            switch (_context27.prev = _context27.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context27.stop();
            }
          }
        }, _callee27);
      }));

      function rescanSpent() {
        return _rescanSpent.apply(this, arguments);
      }

      return rescanSpent;
    }()
    /**
     * <p>Rescan the blockchain from scratch, losing any information which cannot be recovered from
     * the blockchain itself.</p>
     * 
     * <p>WARNING: This method discards local wallet data like destination addresses, tx secret keys,
     * tx notes, etc.</p>
     */

  }, {
    key: "rescanBlockchain",
    value: function () {
      var _rescanBlockchain = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee28() {
        return _regenerator["default"].wrap(function _callee28$(_context28) {
          while (1) {
            switch (_context28.prev = _context28.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context28.stop();
            }
          }
        }, _callee28);
      }));

      function rescanBlockchain() {
        return _rescanBlockchain.apply(this, arguments);
      }

      return rescanBlockchain;
    }()
    /**
     * Get the balance of the wallet, account, or subaddress.
     * 
     * @param {number} [accountIdx] - index of the account to get the balance of (default all accounts)
     * @param {number} [subaddressIdx] - index of the subaddress to get the balance of (default all subaddresses)
     * @return {BigInt} the balance of the wallet, account, or subaddress
     */

  }, {
    key: "getBalance",
    value: function () {
      var _getBalance = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee29(accountIdx, subaddressIdx) {
        return _regenerator["default"].wrap(function _callee29$(_context29) {
          while (1) {
            switch (_context29.prev = _context29.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context29.stop();
            }
          }
        }, _callee29);
      }));

      function getBalance(_x19, _x20) {
        return _getBalance.apply(this, arguments);
      }

      return getBalance;
    }()
    /**
     * Get the unlocked balance of the wallet, account, or subaddress.
     * 
     * @param {number} [accountIdx] - index of the account to get the unlocked balance of (optional)
     * @param {number} [subaddressIdx] - index of the subaddress to get the unlocked balance of (optional)
     * @return {BigInt} the unlocked balance of the wallet, account, or subaddress
     */

  }, {
    key: "getUnlockedBalance",
    value: function () {
      var _getUnlockedBalance = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee30(accountIdx, subaddressIdx) {
        return _regenerator["default"].wrap(function _callee30$(_context30) {
          while (1) {
            switch (_context30.prev = _context30.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context30.stop();
            }
          }
        }, _callee30);
      }));

      function getUnlockedBalance(_x21, _x22) {
        return _getUnlockedBalance.apply(this, arguments);
      }

      return getUnlockedBalance;
    }()
    /**
     * Get the number of blocks until the next and last funds unlock.
     * 
     * @return {int[]} the number of blocks until the next and last funds unlock in elements 0 and 1, respectively, or undefined if no balance
     */

  }, {
    key: "getNumBlocksToUnlock",
    value: function () {
      var _getNumBlocksToUnlock = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee31() {
        var balance, unlockedBalance, txs, height, numBlocksToNextUnlock, _iterator, _step, tx, numBlocksToUnlock, numBlocksToLastUnlock, _iterator2, _step2, _tx, _numBlocksToUnlock;

        return _regenerator["default"].wrap(function _callee31$(_context31) {
          while (1) {
            switch (_context31.prev = _context31.next) {
              case 0:
                _context31.next = 2;
                return this.getBalance();

              case 2:
                balance = _context31.sent;

                if (!(GenUtils.compareBigInt(balance, BigInt(0)) === 0)) {
                  _context31.next = 5;
                  break;
                }

                return _context31.abrupt("return", [undefined, undefined]);

              case 5:
                _context31.next = 7;
                return this.getUnlockedBalance();

              case 7:
                unlockedBalance = _context31.sent;
                numBlocksToNextUnlock = undefined;

                if (!(GenUtils.compareBigInt(unlockedBalance, BigInt(0)) > 0)) {
                  _context31.next = 13;
                  break;
                }

                numBlocksToNextUnlock = 0;
                _context31.next = 21;
                break;

              case 13:
                _context31.next = 15;
                return this.getTxs({
                  isLocked: true
                });

              case 15:
                txs = _context31.sent;
                _context31.next = 18;
                return this.getHeight();

              case 18:
                height = _context31.sent;
                // get most recent height
                _iterator = _createForOfIteratorHelper(txs);

                try {
                  for (_iterator.s(); !(_step = _iterator.n()).done;) {
                    tx = _step.value;
                    numBlocksToUnlock = Math.max((tx.isConfirmed() ? tx.getHeight() : height) + 10, tx.getUnlockHeight()) - height;
                    numBlocksToNextUnlock = numBlocksToNextUnlock === undefined ? numBlocksToUnlock : Math.min(numBlocksToNextUnlock, numBlocksToUnlock);
                  }
                } catch (err) {
                  _iterator.e(err);
                } finally {
                  _iterator.f();
                }

              case 21:
                // compute number of blocks until all funds available
                numBlocksToLastUnlock = undefined;

                if (!(GenUtils.compareBigInt(balance, unlockedBalance) === 0)) {
                  _context31.next = 26;
                  break;
                }

                if (GenUtils.compareBigInt(unlockedBalance, BigInt(0)) > 0) numBlocksToLastUnlock = 0;
                _context31.next = 35;
                break;

              case 26:
                if (txs) {
                  _context31.next = 33;
                  break;
                }

                _context31.next = 29;
                return this.getTxs({
                  isLocked: true
                });

              case 29:
                txs = _context31.sent;
                _context31.next = 32;
                return this.getHeight();

              case 32:
                height = _context31.sent;

              case 33:
                _iterator2 = _createForOfIteratorHelper(txs);

                try {
                  for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                    _tx = _step2.value;
                    _numBlocksToUnlock = Math.max((_tx.isConfirmed() ? _tx.getHeight() : height) + 10, _tx.getUnlockHeight()) - height;
                    numBlocksToLastUnlock = numBlocksToLastUnlock === undefined ? _numBlocksToUnlock : Math.max(numBlocksToLastUnlock, _numBlocksToUnlock);
                  }
                } catch (err) {
                  _iterator2.e(err);
                } finally {
                  _iterator2.f();
                }

              case 35:
                return _context31.abrupt("return", [numBlocksToNextUnlock, numBlocksToLastUnlock]);

              case 36:
              case "end":
                return _context31.stop();
            }
          }
        }, _callee31, this);
      }));

      function getNumBlocksToUnlock() {
        return _getNumBlocksToUnlock.apply(this, arguments);
      }

      return getNumBlocksToUnlock;
    }()
    /**
     * Get accounts with a given tag.
     * 
     * @param {boolean} includeSubaddresses - include subaddresses if true
     * @param {string} tag - tag for filtering accounts, all accounts if undefined
     * @return {MoneroAccount[]} all accounts with the given tag
     */

  }, {
    key: "getAccounts",
    value: function () {
      var _getAccounts = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee32(includeSubaddresses, tag) {
        return _regenerator["default"].wrap(function _callee32$(_context32) {
          while (1) {
            switch (_context32.prev = _context32.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context32.stop();
            }
          }
        }, _callee32);
      }));

      function getAccounts(_x23, _x24) {
        return _getAccounts.apply(this, arguments);
      }

      return getAccounts;
    }()
    /**
     * Get an account.
     * 
     * @param {number} accountIdx - index of the account to get
     * @param {boolean} includeSubaddresses - include subaddresses if true
     * @return {MoneroAccount} the retrieved account
     */

  }, {
    key: "getAccount",
    value: function () {
      var _getAccount = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee33(accountIdx, includeSubaddresses) {
        return _regenerator["default"].wrap(function _callee33$(_context33) {
          while (1) {
            switch (_context33.prev = _context33.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context33.stop();
            }
          }
        }, _callee33);
      }));

      function getAccount(_x25, _x26) {
        return _getAccount.apply(this, arguments);
      }

      return getAccount;
    }()
    /**
     * Create a new account with a label for the first subaddress.
     * 
     * @param {string} [label] - label for account's first subaddress (optional)
     * @return {MoneroAccount} the created account
     */

  }, {
    key: "createAccount",
    value: function () {
      var _createAccount = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee34(label) {
        return _regenerator["default"].wrap(function _callee34$(_context34) {
          while (1) {
            switch (_context34.prev = _context34.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context34.stop();
            }
          }
        }, _callee34);
      }));

      function createAccount(_x27) {
        return _createAccount.apply(this, arguments);
      }

      return createAccount;
    }()
    /**
     * Get subaddresses in an account.
     * 
     * @param {number} accountIdx - account to get subaddresses within
     * @param {int[]} [subaddressIndices] - indices of subaddresses to get (optional)
     * @return {MoneroSubaddress[]} the retrieved subaddresses
     */

  }, {
    key: "getSubaddresses",
    value: function () {
      var _getSubaddresses = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee35(accountIdx, subaddressIndices) {
        return _regenerator["default"].wrap(function _callee35$(_context35) {
          while (1) {
            switch (_context35.prev = _context35.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context35.stop();
            }
          }
        }, _callee35);
      }));

      function getSubaddresses(_x28, _x29) {
        return _getSubaddresses.apply(this, arguments);
      }

      return getSubaddresses;
    }()
    /**
     * Get a subaddress.
     * 
     * @param {number} accountIdx - index of the subaddress's account
     * @param {number} subaddressIdx - index of the subaddress within the account
     * @return {MoneroSubaddress} the retrieved subaddress
     */

  }, {
    key: "getSubaddress",
    value: function () {
      var _getSubaddress = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee36(accountIdx, subaddressIdx) {
        return _regenerator["default"].wrap(function _callee36$(_context36) {
          while (1) {
            switch (_context36.prev = _context36.next) {
              case 0:
                (0, _assert["default"])(accountIdx >= 0);
                (0, _assert["default"])(subaddressIdx >= 0);
                _context36.next = 4;
                return this.getSubaddresses(accountIdx, subaddressIdx);

              case 4:
                return _context36.abrupt("return", _context36.sent[0]);

              case 5:
              case "end":
                return _context36.stop();
            }
          }
        }, _callee36, this);
      }));

      function getSubaddress(_x30, _x31) {
        return _getSubaddress.apply(this, arguments);
      }

      return getSubaddress;
    }()
    /**
     * Create a subaddress within an account.
     * 
     * @param {number} accountIdx - index of the account to create the subaddress within
     * @param {string} [label] - the label for the subaddress (optional)
     * @return {MoneroSubaddress} the created subaddress
     */

  }, {
    key: "createSubaddress",
    value: function () {
      var _createSubaddress = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee37(accountIdx, label) {
        return _regenerator["default"].wrap(function _callee37$(_context37) {
          while (1) {
            switch (_context37.prev = _context37.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context37.stop();
            }
          }
        }, _callee37);
      }));

      function createSubaddress(_x32, _x33) {
        return _createSubaddress.apply(this, arguments);
      }

      return createSubaddress;
    }()
    /**
     * Get a wallet transaction by hash.
     * 
     * @param {string} txHash - hash of a transaction to get
     * @return {MoneroTxWallet} the identified transactions
     */

  }, {
    key: "getTx",
    value: function () {
      var _getTx = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee38(txHash) {
        var txs;
        return _regenerator["default"].wrap(function _callee38$(_context38) {
          while (1) {
            switch (_context38.prev = _context38.next) {
              case 0:
                _context38.next = 2;
                return this.getTxs([txHash]);

              case 2:
                txs = _context38.sent;
                return _context38.abrupt("return", txs.length === 0 ? undefined : txs[0]);

              case 4:
              case "end":
                return _context38.stop();
            }
          }
        }, _callee38, this);
      }));

      function getTx(_x34) {
        return _getTx.apply(this, arguments);
      }

      return getTx;
    }()
    /**
     * <p>Get wallet transactions.  Wallet transactions contain one or more
     * transfers that are either incoming or outgoing to the wallet.<p>
     * 
     * <p>Results can be filtered by passing a query object.  Transactions must
     * meet every criteria defined in the query in order to be returned.  All
     * criteria are optional and no filtering is applied when not defined.</p>
     * 
     * @param {(MoneroTxQuery|string[]|object)} [query] - configures the query (optional)
     * @param {boolean} [query.isConfirmed] - get txs that are confirmed or not (optional)
     * @param {boolean} [query.inTxPool] - get txs that are in the tx pool or not (optional)
     * @param {boolean} [query.isRelayed] - get txs that are relayed or not (optional)
     * @param {boolean} [query.isFailed] - get txs that are failed or not (optional)
     * @param {boolean} [query.isMinerTx] - get miner txs or not (optional)
     * @param {string} [query.hash] - get a tx with the hash (optional)
     * @param {string[]} [query.hashes] - get txs with the hashes (optional)
     * @param {string} [query.paymentId] - get transactions with the payment id (optional)
     * @param {string[]} [query.paymentIds] - get transactions with the payment ids (optional)
     * @param {boolean} [query.hasPaymentId] - get transactions with a payment id or not (optional)
     * @param {number} [query.minHeight] - get txs with height >= the given height (optional)
     * @param {number} [query.maxHeight] - get txs with height <= the given height (optional)
     * @param {boolean} [query.isOutgoing] - get txs with an outgoing transfer or not (optional)
     * @param {boolean} [query.isIncoming] - get txs with an incoming transfer or not (optional)
     * @param {MoneroTransferQuery} [query.transferQuery] - get txs that have a transfer that meets this query (optional)
     * @param {boolean} [query.includeOutputs] - specifies that tx outputs should be returned with tx results (optional)
     * @param {string[]} missingTxHashes - populated with hashes of unfound or unmet transactions that were queried by hash (throws error if undefined and queried transaction hashes are unfound or unmet) 
     * @return {MoneroTxWallet[]} wallet transactions per the configuration
     */

  }, {
    key: "getTxs",
    value: function () {
      var _getTxs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee39(query, missingTxHashes) {
        return _regenerator["default"].wrap(function _callee39$(_context39) {
          while (1) {
            switch (_context39.prev = _context39.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context39.stop();
            }
          }
        }, _callee39);
      }));

      function getTxs(_x35, _x36) {
        return _getTxs.apply(this, arguments);
      }

      return getTxs;
    }()
    /**
     * <p>Get incoming and outgoing transfers to and from this wallet.  An outgoing
     * transfer represents a total amount sent from one or more subaddresses
     * within an account to individual destination addresses, each with their
     * own amount.  An incoming transfer represents a total amount received into
     * a subaddress within an account.  Transfers belong to transactions which
     * are stored on the blockchain.</p>
     * 
     * <p>Results can be filtered by passing a query object.  Transfers must
     * meet every criteria defined in the query in order to be returned.  All
     * criteria are optional and no filtering is applied when not defined.</p>
     * 
     * @param {(MoneroTransferQuery|object)} [query] - configures the query (optional)
     * @param {boolean} [query.isOutgoing] - get transfers that are outgoing or not (optional)
     * @param {boolean} [query.isIncoming] - get transfers that are incoming or not (optional)
     * @param {string} [query.address] - wallet's address that a transfer either originated from (if outgoing) or is destined for (if incoming) (optional)
     * @param {number} [query.accountIndex] - get transfers that either originated from (if outgoing) or are destined for (if incoming) a specific account index (optional)
     * @param {number} [query.subaddressIndex] - get transfers that either originated from (if outgoing) or are destined for (if incoming) a specific subaddress index (optional)
     * @param {int[]} [query.subaddressIndices] - get transfers that either originated from (if outgoing) or are destined for (if incoming) specific subaddress indices (optional)
     * @param {BigInt} [query.amount] - amount being transferred (optional)
     * @param {MoneroDestination[]} [query.destinations] - individual destinations of an outgoing transfer, which is local wallet data and NOT recoverable from the blockchain (optional)
     * @param {boolean} [query.hasDestinations] - get transfers that have destinations or not (optional)
     * @param {MoneroTxQuery} [query.txQuery] - get transfers whose transaction meets this query (optional)
     * @return {MoneroTransfer[]} wallet transfers that meet the query
     */

  }, {
    key: "getTransfers",
    value: function () {
      var _getTransfers = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee40(query) {
        return _regenerator["default"].wrap(function _callee40$(_context40) {
          while (1) {
            switch (_context40.prev = _context40.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context40.stop();
            }
          }
        }, _callee40);
      }));

      function getTransfers(_x37) {
        return _getTransfers.apply(this, arguments);
      }

      return getTransfers;
    }()
    /**
     * Get incoming transfers.
     * 
     * @param {(MoneroTransferQuery|object)} [query] - configures the query (optional)
     * @param {string} [query.address] - get incoming transfers to a specific address in the wallet (optional)
     * @param {number} [query.accountIndex] - get incoming transfers to a specific account index (optional)
     * @param {number} [query.subaddressIndex] - get incoming transfers to a specific subaddress index (optional)
     * @param {int[]} [query.subaddressIndices] - get transfers destined for specific subaddress indices (optional)
     * @param {BigInt} [query.amount] - amount being transferred (optional)
     * @param {MoneroTxQuery} [query.txQuery] - get transfers whose transaction meets this query (optional)
     * @return {MoneroIncomingTransfer[]} incoming transfers that meet the query
     */

  }, {
    key: "getIncomingTransfers",
    value: function () {
      var _getIncomingTransfers = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee41(query) {
        return _regenerator["default"].wrap(function _callee41$(_context41) {
          while (1) {
            switch (_context41.prev = _context41.next) {
              case 0:
                query = MoneroWallet._normalizeTransferQuery(query);

                if (!(query.isIncoming() === false)) {
                  _context41.next = 3;
                  break;
                }

                throw new _MoneroError["default"]("Transfer query contradicts getting incoming transfers");

              case 3:
                query.setIsIncoming(true);
                return _context41.abrupt("return", this.getTransfers(query));

              case 5:
              case "end":
                return _context41.stop();
            }
          }
        }, _callee41, this);
      }));

      function getIncomingTransfers(_x38) {
        return _getIncomingTransfers.apply(this, arguments);
      }

      return getIncomingTransfers;
    }()
    /**
     * Get outgoing transfers.
     * 
     * @param {(MoneroTransferQuery|object)} [query] - configures the query (optional)
     * @param {string} [query.address] - get outgoing transfers from a specific address in the wallet (optional)
     * @param {number} [query.accountIndex] - get outgoing transfers from a specific account index (optional)
     * @param {number} [query.subaddressIndex] - get outgoing transfers from a specific subaddress index (optional)
     * @param {int[]} [query.subaddressIndices] - get outgoing transfers from specific subaddress indices (optional)
     * @param {BigInt} [query.amount] - amount being transferred (optional)
     * @param {MoneroDestination[]} [query.destinations] - individual destinations of an outgoing transfer, which is local wallet data and NOT recoverable from the blockchain (optional)
     * @param {boolean} [query.hasDestinations] - get transfers that have destinations or not (optional)
     * @param {MoneroTxQuery} [query.txQuery] - get transfers whose transaction meets this query (optional)
     * @return {MoneroOutgoingTransfer[]} outgoing transfers that meet the query
     */

  }, {
    key: "getOutgoingTransfers",
    value: function () {
      var _getOutgoingTransfers = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee42(query) {
        return _regenerator["default"].wrap(function _callee42$(_context42) {
          while (1) {
            switch (_context42.prev = _context42.next) {
              case 0:
                query = MoneroWallet._normalizeTransferQuery(query);

                if (!(query.isOutgoing() === false)) {
                  _context42.next = 3;
                  break;
                }

                throw new _MoneroError["default"]("Transfer query contradicts getting outgoing transfers");

              case 3:
                query.setIsOutgoing(true);
                return _context42.abrupt("return", this.getTransfers(query));

              case 5:
              case "end":
                return _context42.stop();
            }
          }
        }, _callee42, this);
      }));

      function getOutgoingTransfers(_x39) {
        return _getOutgoingTransfers.apply(this, arguments);
      }

      return getOutgoingTransfers;
    }()
    /**
     * <p>Get outputs created from previous transactions that belong to the wallet
     * (i.e. that the wallet can spend one time).  Outputs are part of
     * transactions which are stored in blocks on the blockchain.</p>
     * 
     * <p>Results can be filtered by passing a query object.  Outputs must
     * meet every criteria defined in the query in order to be returned.  All
     * filtering is optional and no filtering is applied when not defined.</p>
     * 
     * @param {(MoneroOutputQuery|object)} [query] - configures the query (optional)
     * @param {number} [query.accountIndex] - get outputs associated with a specific account index (optional)
     * @param {number} [query.subaddressIndex] - get outputs associated with a specific subaddress index (optional)
     * @param {int[]} [query.subaddressIndices] - get outputs associated with specific subaddress indices (optional)
     * @param {BigInt} [query.amount] - get outputs with a specific amount (optional)
     * @param {BigInt} [query.minAmount] - get outputs greater than or equal to a minimum amount (optional)
     * @param {BigInt} [query.maxAmount] - get outputs less than or equal to a maximum amount (optional)
     * @param {boolean} [query.isSpent] - get outputs that are spent or not (optional)
     * @param {string|MoneroKeyImage} [query.keyImage] - get output with a key image or which matches fields defined in a MoneroKeyImage (optional)
     * @param {MoneroTxQuery} [query.txQuery] - get outputs whose transaction meets this filter (optional)
     * @return {MoneroOutputWallet[]} the queried outputs
     */

  }, {
    key: "getOutputs",
    value: function () {
      var _getOutputs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee43(query) {
        return _regenerator["default"].wrap(function _callee43$(_context43) {
          while (1) {
            switch (_context43.prev = _context43.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context43.stop();
            }
          }
        }, _callee43);
      }));

      function getOutputs(_x40) {
        return _getOutputs.apply(this, arguments);
      }

      return getOutputs;
    }()
    /**
     * Export outputs in hex format.
     *
     * @param {boolean} all - export all outputs if true, else export the outputs since the last export
     * @return {string} outputs in hex format
     */

  }, {
    key: "exportOutputs",
    value: function () {
      var _exportOutputs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee44(all) {
        return _regenerator["default"].wrap(function _callee44$(_context44) {
          while (1) {
            switch (_context44.prev = _context44.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context44.stop();
            }
          }
        }, _callee44);
      }));

      function exportOutputs(_x41) {
        return _exportOutputs.apply(this, arguments);
      }

      return exportOutputs;
    }()
    /**
     * Import outputs in hex format.
     * 
     * @param {string} outputsHex - outputs in hex format
     * @return {int} the number of outputs imported
     */

  }, {
    key: "importOutputs",
    value: function () {
      var _importOutputs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee45(outputsHex) {
        return _regenerator["default"].wrap(function _callee45$(_context45) {
          while (1) {
            switch (_context45.prev = _context45.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context45.stop();
            }
          }
        }, _callee45);
      }));

      function importOutputs(_x42) {
        return _importOutputs.apply(this, arguments);
      }

      return importOutputs;
    }()
    /**
     * Export signed key images.
     * 
     * @param {boolean} all - export all key images if true, else export the key images since the last export
     * @return {MoneroKeyImage[]} the wallet's signed key images
     */

  }, {
    key: "exportKeyImages",
    value: function () {
      var _exportKeyImages = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee46(all) {
        return _regenerator["default"].wrap(function _callee46$(_context46) {
          while (1) {
            switch (_context46.prev = _context46.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context46.stop();
            }
          }
        }, _callee46);
      }));

      function exportKeyImages(_x43) {
        return _exportKeyImages.apply(this, arguments);
      }

      return exportKeyImages;
    }()
    /**
     * Import signed key images and verify their spent status.
     * 
     * @param {MoneroKeyImage[]} keyImages - images to import and verify (requires hex and signature)
     * @return {MoneroKeyImageImportResult} results of the import
     */

  }, {
    key: "importKeyImages",
    value: function () {
      var _importKeyImages = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee47(keyImages) {
        return _regenerator["default"].wrap(function _callee47$(_context47) {
          while (1) {
            switch (_context47.prev = _context47.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context47.stop();
            }
          }
        }, _callee47);
      }));

      function importKeyImages(_x44) {
        return _importKeyImages.apply(this, arguments);
      }

      return importKeyImages;
    }()
    /**
     * Get new key images from the last imported outputs.
     * 
     * @return {MoneroKeyImage[]} the key images from the last imported outputs
     */

  }, {
    key: "getNewKeyImagesFromLastImport",
    value: function () {
      var _getNewKeyImagesFromLastImport = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee48() {
        return _regenerator["default"].wrap(function _callee48$(_context48) {
          while (1) {
            switch (_context48.prev = _context48.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context48.stop();
            }
          }
        }, _callee48);
      }));

      function getNewKeyImagesFromLastImport() {
        return _getNewKeyImagesFromLastImport.apply(this, arguments);
      }

      return getNewKeyImagesFromLastImport;
    }()
    /**
     * Freeze an output.
     * 
     * @param {string} keyImage - key image of the output to freeze
     */

  }, {
    key: "freezeOutput",
    value: function () {
      var _freezeOutput = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee49(keyImage) {
        return _regenerator["default"].wrap(function _callee49$(_context49) {
          while (1) {
            switch (_context49.prev = _context49.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context49.stop();
            }
          }
        }, _callee49);
      }));

      function freezeOutput(_x45) {
        return _freezeOutput.apply(this, arguments);
      }

      return freezeOutput;
    }()
    /**
     * Thaw a frozen output.
     * 
     * @param {string} keyImage - key image of the output to thaw
     */

  }, {
    key: "thawOutput",
    value: function () {
      var _thawOutput = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee50(keyImage) {
        return _regenerator["default"].wrap(function _callee50$(_context50) {
          while (1) {
            switch (_context50.prev = _context50.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context50.stop();
            }
          }
        }, _callee50);
      }));

      function thawOutput(_x46) {
        return _thawOutput.apply(this, arguments);
      }

      return thawOutput;
    }()
    /**
     * Check if an output is frozen.
     * 
     * @param {string} keyImage - key image of the output to check if frozen
     * @return {boolean} true if the output is frozen, false otherwise
     */

  }, {
    key: "isOutputFrozen",
    value: function () {
      var _isOutputFrozen = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee51(keyImage) {
        return _regenerator["default"].wrap(function _callee51$(_context51) {
          while (1) {
            switch (_context51.prev = _context51.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context51.stop();
            }
          }
        }, _callee51);
      }));

      function isOutputFrozen(_x47) {
        return _isOutputFrozen.apply(this, arguments);
      }

      return isOutputFrozen;
    }()
    /**
     * Create a transaction to transfer funds from this wallet.
     * 
     * @param {MoneroTxConfig|object} config - configures the transaction to create (required)
     * @param {string} config.address - single destination address (required unless `destinations` provided)
     * @param {BigInt|string} config.amount - single destination amount (required unless `destinations` provided)
     * @param {number} config.accountIndex - source account index to transfer funds from (required)
     * @param {number} [config.subaddressIndex] - source subaddress index to transfer funds from (optional)
     * @param {int[]} [config.subaddressIndices] - source subaddress indices to transfer funds from (optional)
     * @param {boolean} [config.relay] - relay the transaction to peers to commit to the blockchain (default false)
     * @param {MoneroTxPriority} [config.priority] - transaction priority (default MoneroTxPriority.NORMAL)
     * @param {MoneroDestination[]} config.destinations - addresses and amounts in a multi-destination tx (required unless `address` and `amount` provided)
     * @param {string} [config.paymentId] - transaction payment ID (optional)
     * @param {number} [config.unlockHeight] - minimum height for the transaction to unlock (default 0)
     * @return {MoneroTxWallet} the created transaction
     */

  }, {
    key: "createTx",
    value: function () {
      var _createTx = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee52(config) {
        return _regenerator["default"].wrap(function _callee52$(_context52) {
          while (1) {
            switch (_context52.prev = _context52.next) {
              case 0:
                config = MoneroWallet._normalizeCreateTxsConfig(config);
                if (config.getCanSplit() !== undefined) _assert["default"].equal(config.getCanSplit(), false, "Cannot split transactions using createTx(); use createTxs()");
                config.setCanSplit(false);
                _context52.next = 5;
                return this.createTxs(config);

              case 5:
                return _context52.abrupt("return", _context52.sent[0]);

              case 6:
              case "end":
                return _context52.stop();
            }
          }
        }, _callee52, this);
      }));

      function createTx(_x48) {
        return _createTx.apply(this, arguments);
      }

      return createTx;
    }()
    /**
     * Create one or more transactions to transfer funds from this wallet.
     * 
     * @param {MoneroTxConfig|object} config - configures the transactions to create (required)
     * @param {string} config.address - single destination address (required unless `destinations` provided)
     * @param {BigInt|string} config.amount - single destination amount (required unless `destinations` provided)
     * @param {number} config.accountIndex - source account index to transfer funds from (required)
     * @param {number} [config.subaddressIndex] - source subaddress index to transfer funds from (optional)
     * @param {int[]} [config.subaddressIndices] - source subaddress indices to transfer funds from (optional)
     * @param {boolean} [config.relay] - relay the transactions to peers to commit to the blockchain (default false)
     * @param {MoneroTxPriority} [config.priority] - transaction priority (default MoneroTxPriority.NORMAL)
     * @param {MoneroDestination[]} config.destinations - addresses and amounts in a multi-destination tx (required unless `address` and `amount` provided)
     * @param {string} [config.paymentId] - transaction payment ID (optional)
     * @param {number} [config.unlockHeight] - minimum height for the transactions to unlock (default 0)
     * @param {boolean} [config.canSplit] - allow funds to be transferred using multiple transactions (default true)
     * @return {MoneroTxWallet[]} the created transactions
     */

  }, {
    key: "createTxs",
    value: function () {
      var _createTxs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee53(config) {
        return _regenerator["default"].wrap(function _callee53$(_context53) {
          while (1) {
            switch (_context53.prev = _context53.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context53.stop();
            }
          }
        }, _callee53);
      }));

      function createTxs(_x49) {
        return _createTxs.apply(this, arguments);
      }

      return createTxs;
    }()
    /**
     * Sweep an output by key image.
     * 
     * @param {MoneroTxConfig} config - configures the transaction to create (required)
     * @param {string} config.address - single destination address (required)
     * @param {string} config.keyImage - key image to sweep (required)
     * @param {boolean} [config.relay] - relay the transaction to peers to commit to the blockchain (default false)
     * @param {number} [config.unlockHeight] - minimum height for the transaction to unlock (default 0)
     * @param {MoneroTxPriority} [config.priority] - transaction priority (default MoneroTxPriority.NORMAL)
     * @return {MoneroTxWallet} the created transaction
     */

  }, {
    key: "sweepOutput",
    value: function () {
      var _sweepOutput = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee54(config) {
        return _regenerator["default"].wrap(function _callee54$(_context54) {
          while (1) {
            switch (_context54.prev = _context54.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context54.stop();
            }
          }
        }, _callee54);
      }));

      function sweepOutput(_x50) {
        return _sweepOutput.apply(this, arguments);
      }

      return sweepOutput;
    }()
    /**
     * Sweep all unlocked funds according to the given configuration.
     * 
     * @param {MoneroTxConfig|object} config - configures the transactions to create (required)
     * @param {string} config.address - single destination address (required)
     * @param {number} config.accountIndex - source account index to sweep from (optional, defaults to all accounts)
     * @param {number} config.subaddressIndex - source subaddress index to sweep from (optional, defaults to all subaddresses)
     * @param {int[]} [config.subaddressIndices] - source subaddress indices to sweep from (optional)
     * @param {boolean} [config.relay] - relay the transactions to peers to commit to the blockchain (default false)
     * @param {MoneroTxPriority} [config.priority] - transaction priority (default MoneroTxPriority.NORMAL)
     * @param {number} [config.unlockHeight] - minimum height for the transactions to unlock (default 0)
     * @param {boolean} [config.sweepEachSubaddress] - sweep each subaddress individually if true (default false)
     * @return {MoneroTxWallet[]} the created transactions
     */

  }, {
    key: "sweepUnlocked",
    value: function () {
      var _sweepUnlocked = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee55(config) {
        return _regenerator["default"].wrap(function _callee55$(_context55) {
          while (1) {
            switch (_context55.prev = _context55.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context55.stop();
            }
          }
        }, _callee55);
      }));

      function sweepUnlocked(_x51) {
        return _sweepUnlocked.apply(this, arguments);
      }

      return sweepUnlocked;
    }()
    /**
     * <p>Sweep all unmixable dust outputs back to the wallet to make them easier to spend and mix.</p>
     * 
     * <p>NOTE: Dust only exists pre RCT, so this method will throw "no dust to sweep" on new wallets.</p>
     * 
     * @param {boolean} [relay] - specifies if the resulting transaction should be relayed (default false)
     * @return {MoneroTxWallet[]} the created transactions
     */

  }, {
    key: "sweepDust",
    value: function () {
      var _sweepDust = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee56(relay) {
        return _regenerator["default"].wrap(function _callee56$(_context56) {
          while (1) {
            switch (_context56.prev = _context56.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context56.stop();
            }
          }
        }, _callee56);
      }));

      function sweepDust(_x52) {
        return _sweepDust.apply(this, arguments);
      }

      return sweepDust;
    }()
    /**
     * Relay a previously created transaction.
     * 
     * @param {(MoneroTxWallet|string)} txOrMetadata - transaction or its metadata to relay
     * @return {string} the hash of the relayed tx
     */

  }, {
    key: "relayTx",
    value: function () {
      var _relayTx = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee57(txOrMetadata) {
        return _regenerator["default"].wrap(function _callee57$(_context57) {
          while (1) {
            switch (_context57.prev = _context57.next) {
              case 0:
                _context57.next = 2;
                return this.relayTxs([txOrMetadata]);

              case 2:
                return _context57.abrupt("return", _context57.sent[0]);

              case 3:
              case "end":
                return _context57.stop();
            }
          }
        }, _callee57, this);
      }));

      function relayTx(_x53) {
        return _relayTx.apply(this, arguments);
      }

      return relayTx;
    }()
    /**
     * Relay previously created transactions.
     * 
     * @param {(MoneroTxWallet[]|string[])} txsOrMetadatas - transactions or their metadata to relay
     * @return {string[]} the hashes of the relayed txs
     */

  }, {
    key: "relayTxs",
    value: function () {
      var _relayTxs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee58(txsOrMetadatas) {
        return _regenerator["default"].wrap(function _callee58$(_context58) {
          while (1) {
            switch (_context58.prev = _context58.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context58.stop();
            }
          }
        }, _callee58);
      }));

      function relayTxs(_x54) {
        return _relayTxs.apply(this, arguments);
      }

      return relayTxs;
    }()
    /**
     * Describe a tx set from unsigned tx hex.
     * 
     * @param {string} unsignedTxHex - unsigned tx hex
     * @return {MoneroTxSet} the tx set containing structured transactions
     */

  }, {
    key: "describeUnsignedTxSet",
    value: function () {
      var _describeUnsignedTxSet = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee59(unsignedTxHex) {
        return _regenerator["default"].wrap(function _callee59$(_context59) {
          while (1) {
            switch (_context59.prev = _context59.next) {
              case 0:
                return _context59.abrupt("return", this.describeTxSet(new _MoneroTxSet["default"]().setUnsignedTxHex(unsignedTxHex)));

              case 1:
              case "end":
                return _context59.stop();
            }
          }
        }, _callee59, this);
      }));

      function describeUnsignedTxSet(_x55) {
        return _describeUnsignedTxSet.apply(this, arguments);
      }

      return describeUnsignedTxSet;
    }()
    /**
     * Describe a tx set from multisig tx hex.
     * 
     * @param {string} multisigTxHex - multisig tx hex
     * @return {MoneroTxSet} the tx set containing structured transactions
     */

  }, {
    key: "describeMultisigTxSet",
    value: function () {
      var _describeMultisigTxSet = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee60(multisigTxHex) {
        return _regenerator["default"].wrap(function _callee60$(_context60) {
          while (1) {
            switch (_context60.prev = _context60.next) {
              case 0:
                return _context60.abrupt("return", this.describeTxSet(new _MoneroTxSet["default"]().setMultisigTxHex(multisigTxHex)));

              case 1:
              case "end":
                return _context60.stop();
            }
          }
        }, _callee60, this);
      }));

      function describeMultisigTxSet(_x56) {
        return _describeMultisigTxSet.apply(this, arguments);
      }

      return describeMultisigTxSet;
    }()
    /**
     * Describe a tx set containing unsigned or multisig tx hex to a new tx set containing structured transactions.
     * 
     * @param {MoneroTxSet} txSet - a tx set containing unsigned or multisig tx hex
     * @return {MoneroTxSet} txSet - the tx set containing structured transactions
     */

  }, {
    key: "describeTxSet",
    value: function () {
      var _describeTxSet = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee61(txSet) {
        return _regenerator["default"].wrap(function _callee61$(_context61) {
          while (1) {
            switch (_context61.prev = _context61.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context61.stop();
            }
          }
        }, _callee61);
      }));

      function describeTxSet(_x57) {
        return _describeTxSet.apply(this, arguments);
      }

      return describeTxSet;
    }()
    /**
     * Sign unsigned transactions from a view-only wallet.
     * 
     * @param {string} unsignedTxHex - unsigned transaction hex from when the transactions were created
     * @return {string} the signed transaction hex
     */

  }, {
    key: "signTxs",
    value: function () {
      var _signTxs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee62(unsignedTxHex) {
        return _regenerator["default"].wrap(function _callee62$(_context62) {
          while (1) {
            switch (_context62.prev = _context62.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context62.stop();
            }
          }
        }, _callee62);
      }));

      function signTxs(_x58) {
        return _signTxs.apply(this, arguments);
      }

      return signTxs;
    }()
    /**
     * Submit signed transactions from a view-only wallet.
     * 
     * @param {string} signedTxHex - signed transaction hex from signTxs()
     * @return {string[]} the resulting transaction hashes
     */

  }, {
    key: "submitTxs",
    value: function () {
      var _submitTxs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee63(signedTxHex) {
        return _regenerator["default"].wrap(function _callee63$(_context63) {
          while (1) {
            switch (_context63.prev = _context63.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context63.stop();
            }
          }
        }, _callee63);
      }));

      function submitTxs(_x59) {
        return _submitTxs.apply(this, arguments);
      }

      return submitTxs;
    }()
    /**
     * Sign a message.
     * 
     * @param {string} message - the message to sign
     * @param {MoneroMessageSignatureType} [signatureType] - sign with spend key or view key (default spend key)
     * @param {number} [accountIdx] - the account index of the message signature (default 0)
     * @param {number} [subaddressIdx] - the subaddress index of the message signature (default 0)
     * @return {string} the signature
     */

  }, {
    key: "signMessage",
    value: function () {
      var _signMessage = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee64(message, signatureType, accountIdx, subaddressIdx) {
        return _regenerator["default"].wrap(function _callee64$(_context64) {
          while (1) {
            switch (_context64.prev = _context64.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context64.stop();
            }
          }
        }, _callee64);
      }));

      function signMessage(_x60, _x61, _x62, _x63) {
        return _signMessage.apply(this, arguments);
      }

      return signMessage;
    }()
    /**
     * Verify a signature on a message.
     * 
     * @param {string} message - signed message
     * @param {string} address - signing address
     * @param {string} signature - signature
     * @return {MoneroMessageSignatureResult} true if the signature is good, false otherwise
     */

  }, {
    key: "verifyMessage",
    value: function () {
      var _verifyMessage = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee65(message, address, signature) {
        return _regenerator["default"].wrap(function _callee65$(_context65) {
          while (1) {
            switch (_context65.prev = _context65.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context65.stop();
            }
          }
        }, _callee65);
      }));

      function verifyMessage(_x64, _x65, _x66) {
        return _verifyMessage.apply(this, arguments);
      }

      return verifyMessage;
    }()
    /**
     * Get a transaction's secret key from its hash.
     * 
     * @param {string} txHash - transaction's hash
     * @return {string} - transaction's secret key
     */

  }, {
    key: "getTxKey",
    value: function () {
      var _getTxKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee66(txHash) {
        return _regenerator["default"].wrap(function _callee66$(_context66) {
          while (1) {
            switch (_context66.prev = _context66.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context66.stop();
            }
          }
        }, _callee66);
      }));

      function getTxKey(_x67) {
        return _getTxKey.apply(this, arguments);
      }

      return getTxKey;
    }()
    /**
     * Check a transaction in the blockchain with its secret key.
     * 
     * @param {string} txHash - transaction to check
     * @param {string} txKey - transaction's secret key
     * @param {string} address - destination public address of the transaction
     * @return {MoneroCheckTx} the result of the check
     */

  }, {
    key: "checkTxKey",
    value: function () {
      var _checkTxKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee67(txHash, txKey, address) {
        return _regenerator["default"].wrap(function _callee67$(_context67) {
          while (1) {
            switch (_context67.prev = _context67.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context67.stop();
            }
          }
        }, _callee67);
      }));

      function checkTxKey(_x68, _x69, _x70) {
        return _checkTxKey.apply(this, arguments);
      }

      return checkTxKey;
    }()
    /**
     * Get a transaction signature to prove it.
     * 
     * @param {string} txHash - transaction to prove
     * @param {string} address - destination public address of the transaction
     * @param {string} [message] - message to include with the signature to further authenticate the proof (optional)
     * @return {string} the transaction signature
     */

  }, {
    key: "getTxProof",
    value: function () {
      var _getTxProof = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee68(txHash, address, message) {
        return _regenerator["default"].wrap(function _callee68$(_context68) {
          while (1) {
            switch (_context68.prev = _context68.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context68.stop();
            }
          }
        }, _callee68);
      }));

      function getTxProof(_x71, _x72, _x73) {
        return _getTxProof.apply(this, arguments);
      }

      return getTxProof;
    }()
    /**
     * Prove a transaction by checking its signature.
     * 
     * @param {string} txHash - transaction to prove
     * @param {string} address - destination public address of the transaction
     * @param {string} [message] - message included with the signature to further authenticate the proof (optional)
     * @param {string} signature - transaction signature to confirm
     * @return {MoneroCheckTx} the result of the check
     */

  }, {
    key: "checkTxProof",
    value: function () {
      var _checkTxProof = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee69(txHash, address, message, signature) {
        return _regenerator["default"].wrap(function _callee69$(_context69) {
          while (1) {
            switch (_context69.prev = _context69.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context69.stop();
            }
          }
        }, _callee69);
      }));

      function checkTxProof(_x74, _x75, _x76, _x77) {
        return _checkTxProof.apply(this, arguments);
      }

      return checkTxProof;
    }()
    /**
     * Generate a signature to prove a spend. Unlike proving a transaction, it does not require the destination public address.
     * 
     * @param {string} txHash - transaction to prove
     * @param {string} [message] - message to include with the signature to further authenticate the proof (optional)
     * @return {string} the transaction signature
     */

  }, {
    key: "getSpendProof",
    value: function () {
      var _getSpendProof = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee70(txHash, message) {
        return _regenerator["default"].wrap(function _callee70$(_context70) {
          while (1) {
            switch (_context70.prev = _context70.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context70.stop();
            }
          }
        }, _callee70);
      }));

      function getSpendProof(_x78, _x79) {
        return _getSpendProof.apply(this, arguments);
      }

      return getSpendProof;
    }()
    /**
     * Prove a spend using a signature. Unlike proving a transaction, it does not require the destination public address.
     * 
     * @param {string} txHash - transaction to prove
     * @param {string} [message] - message included with the signature to further authenticate the proof (optional)
     * @param {string} signature - transaction signature to confirm
     * @return {boolean} true if the signature is good, false otherwise
     */

  }, {
    key: "checkSpendProof",
    value: function () {
      var _checkSpendProof = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee71(txHash, message, signature) {
        return _regenerator["default"].wrap(function _callee71$(_context71) {
          while (1) {
            switch (_context71.prev = _context71.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context71.stop();
            }
          }
        }, _callee71);
      }));

      function checkSpendProof(_x80, _x81, _x82) {
        return _checkSpendProof.apply(this, arguments);
      }

      return checkSpendProof;
    }()
    /**
     * Generate a signature to prove the entire balance of the wallet.
     * 
     * @param message - message included with the signature to further authenticate the proof (optional)
     * @return the reserve proof signature
     */

  }, {
    key: "getReserveProofWallet",
    value: function () {
      var _getReserveProofWallet = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee72(message) {
        return _regenerator["default"].wrap(function _callee72$(_context72) {
          while (1) {
            switch (_context72.prev = _context72.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context72.stop();
            }
          }
        }, _callee72);
      }));

      function getReserveProofWallet(_x83) {
        return _getReserveProofWallet.apply(this, arguments);
      }

      return getReserveProofWallet;
    }()
    /**
     * Generate a signature to prove an available amount in an account.
     * 
     * @param {number} accountIdx - account to prove ownership of the amount
     * @param {BigInt} amount - minimum amount to prove as available in the account
     * @param {string} [message] - message to include with the signature to further authenticate the proof (optional)
     * @return {string} the reserve proof signature
     */

  }, {
    key: "getReserveProofAccount",
    value: function () {
      var _getReserveProofAccount = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee73(accountIdx, amount, message) {
        return _regenerator["default"].wrap(function _callee73$(_context73) {
          while (1) {
            switch (_context73.prev = _context73.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context73.stop();
            }
          }
        }, _callee73);
      }));

      function getReserveProofAccount(_x84, _x85, _x86) {
        return _getReserveProofAccount.apply(this, arguments);
      }

      return getReserveProofAccount;
    }()
    /**
     * Proves a wallet has a disposable reserve using a signature.
     * 
     * @param {string} address - public wallet address
     * @param {string} [message] - message included with the signature to further authenticate the proof (optional)
     * @param {string} signature - reserve proof signature to check
     * @return {MoneroCheckReserve} the result of checking the signature proof
     */

  }, {
    key: "checkReserveProof",
    value: function () {
      var _checkReserveProof = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee74(address, message, signature) {
        return _regenerator["default"].wrap(function _callee74$(_context74) {
          while (1) {
            switch (_context74.prev = _context74.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context74.stop();
            }
          }
        }, _callee74);
      }));

      function checkReserveProof(_x87, _x88, _x89) {
        return _checkReserveProof.apply(this, arguments);
      }

      return checkReserveProof;
    }()
    /**
     * Get a transaction note.
     * 
     * @param {string} txHash - transaction to get the note of
     * @return {string} the tx note
     */

  }, {
    key: "getTxNote",
    value: function () {
      var _getTxNote = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee75(txHash) {
        return _regenerator["default"].wrap(function _callee75$(_context75) {
          while (1) {
            switch (_context75.prev = _context75.next) {
              case 0:
                _context75.next = 2;
                return this.getTxNotes([txHash]);

              case 2:
                return _context75.abrupt("return", _context75.sent[0]);

              case 3:
              case "end":
                return _context75.stop();
            }
          }
        }, _callee75, this);
      }));

      function getTxNote(_x90) {
        return _getTxNote.apply(this, arguments);
      }

      return getTxNote;
    }()
    /**
     * Get notes for multiple transactions.
     * 
     * @param {string[]} txHashes - hashes of the transactions to get notes for
     * @return {string[]} notes for the transactions
     */

  }, {
    key: "getTxNotes",
    value: function () {
      var _getTxNotes = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee76(txHashes) {
        return _regenerator["default"].wrap(function _callee76$(_context76) {
          while (1) {
            switch (_context76.prev = _context76.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context76.stop();
            }
          }
        }, _callee76);
      }));

      function getTxNotes(_x91) {
        return _getTxNotes.apply(this, arguments);
      }

      return getTxNotes;
    }()
    /**
     * Set a note for a specific transaction.
     * 
     * @param {string} txHash - hash of the transaction to set a note for
     * @param {string} note - the transaction note
     */

  }, {
    key: "setTxNote",
    value: function () {
      var _setTxNote = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee77(txHash, note) {
        return _regenerator["default"].wrap(function _callee77$(_context77) {
          while (1) {
            switch (_context77.prev = _context77.next) {
              case 0:
                _context77.next = 2;
                return this.setTxNotes([txHash], [note]);

              case 2:
              case "end":
                return _context77.stop();
            }
          }
        }, _callee77, this);
      }));

      function setTxNote(_x92, _x93) {
        return _setTxNote.apply(this, arguments);
      }

      return setTxNote;
    }()
    /**
     * Set notes for multiple transactions.
     * 
     * @param {string[]} txHashes - transactions to set notes for
     * @param {string[]} notes - notes to set for the transactions
     */

  }, {
    key: "setTxNotes",
    value: function () {
      var _setTxNotes = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee78(txHashes, notes) {
        return _regenerator["default"].wrap(function _callee78$(_context78) {
          while (1) {
            switch (_context78.prev = _context78.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context78.stop();
            }
          }
        }, _callee78);
      }));

      function setTxNotes(_x94, _x95) {
        return _setTxNotes.apply(this, arguments);
      }

      return setTxNotes;
    }()
    /**
     * Get address book entries.
     * 
     * @param {int[]} entryIndices - indices of the entries to get
     * @return {MoneroAddressBookEntry[]} the address book entries
     */

  }, {
    key: "getAddressBookEntries",
    value: function () {
      var _getAddressBookEntries = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee79(entryIndices) {
        return _regenerator["default"].wrap(function _callee79$(_context79) {
          while (1) {
            switch (_context79.prev = _context79.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context79.stop();
            }
          }
        }, _callee79);
      }));

      function getAddressBookEntries(_x96) {
        return _getAddressBookEntries.apply(this, arguments);
      }

      return getAddressBookEntries;
    }()
    /**
     * Add an address book entry.
     * 
     * @param {string} address - entry address
     * @param {string} [description] - entry description (optional)
     * @return {int} the index of the added entry
     */

  }, {
    key: "addAddressBookEntry",
    value: function () {
      var _addAddressBookEntry = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee80(address, description) {
        return _regenerator["default"].wrap(function _callee80$(_context80) {
          while (1) {
            switch (_context80.prev = _context80.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context80.stop();
            }
          }
        }, _callee80);
      }));

      function addAddressBookEntry(_x97, _x98) {
        return _addAddressBookEntry.apply(this, arguments);
      }

      return addAddressBookEntry;
    }()
    /**
     * Edit an address book entry.
     * 
     * @param {number} index - index of the address book entry to edit
     * @param {boolean} setAddress - specifies if the address should be updated
     * @param {string} address - updated address
     * @param {boolean} setDescription - specifies if the description should be updated
     * @param {string} description - updated description
     */

  }, {
    key: "editAddressBookEntry",
    value: function () {
      var _editAddressBookEntry = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee81(index, setAddress, address, setDescription, description) {
        return _regenerator["default"].wrap(function _callee81$(_context81) {
          while (1) {
            switch (_context81.prev = _context81.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context81.stop();
            }
          }
        }, _callee81);
      }));

      function editAddressBookEntry(_x99, _x100, _x101, _x102, _x103) {
        return _editAddressBookEntry.apply(this, arguments);
      }

      return editAddressBookEntry;
    }()
    /**
     * Delete an address book entry.
     * 
     * @param {number} entryIdx - index of the entry to delete
     */

  }, {
    key: "deleteAddressBookEntry",
    value: function () {
      var _deleteAddressBookEntry = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee82(entryIdx) {
        return _regenerator["default"].wrap(function _callee82$(_context82) {
          while (1) {
            switch (_context82.prev = _context82.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context82.stop();
            }
          }
        }, _callee82);
      }));

      function deleteAddressBookEntry(_x104) {
        return _deleteAddressBookEntry.apply(this, arguments);
      }

      return deleteAddressBookEntry;
    }()
    /**
     * Tag accounts.
     * 
     * @param {string} tag - tag to apply to the specified accounts
     * @param {int[]} accountIndices - indices of the accounts to tag
     */

  }, {
    key: "tagAccounts",
    value: function () {
      var _tagAccounts = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee83(tag, accountIndices) {
        return _regenerator["default"].wrap(function _callee83$(_context83) {
          while (1) {
            switch (_context83.prev = _context83.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context83.stop();
            }
          }
        }, _callee83);
      }));

      function tagAccounts(_x105, _x106) {
        return _tagAccounts.apply(this, arguments);
      }

      return tagAccounts;
    }()
    /**
     * Untag accounts.
     * 
     * @param {int[]} accountIndices - indices of the accounts to untag
     */

  }, {
    key: "untagAccounts",
    value: function () {
      var _untagAccounts = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee84(accountIndices) {
        return _regenerator["default"].wrap(function _callee84$(_context84) {
          while (1) {
            switch (_context84.prev = _context84.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context84.stop();
            }
          }
        }, _callee84);
      }));

      function untagAccounts(_x107) {
        return _untagAccounts.apply(this, arguments);
      }

      return untagAccounts;
    }()
    /**
     * Return all account tags.
     * 
     * @return {MoneroAccountTag[]} the wallet's account tags
     */

  }, {
    key: "getAccountTags",
    value: function () {
      var _getAccountTags = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee85() {
        return _regenerator["default"].wrap(function _callee85$(_context85) {
          while (1) {
            switch (_context85.prev = _context85.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context85.stop();
            }
          }
        }, _callee85);
      }));

      function getAccountTags() {
        return _getAccountTags.apply(this, arguments);
      }

      return getAccountTags;
    }()
    /**
     * Sets a human-readable description for a tag.
     * 
     * @param {string} tag - tag to set a description for
     * @param {string} label - label to set for the tag
     */

  }, {
    key: "setAccountTagLabel",
    value: function () {
      var _setAccountTagLabel = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee86(tag, label) {
        return _regenerator["default"].wrap(function _callee86$(_context86) {
          while (1) {
            switch (_context86.prev = _context86.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context86.stop();
            }
          }
        }, _callee86);
      }));

      function setAccountTagLabel(_x108, _x109) {
        return _setAccountTagLabel.apply(this, arguments);
      }

      return setAccountTagLabel;
    }()
    /**
     * Creates a payment URI from a send configuration.
     * 
     * @param {MoneroTxConfig} config - specifies configuration for a potential tx
     * @return {string} the payment uri
     */

  }, {
    key: "getPaymentUri",
    value: function () {
      var _getPaymentUri = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee87(config) {
        return _regenerator["default"].wrap(function _callee87$(_context87) {
          while (1) {
            switch (_context87.prev = _context87.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context87.stop();
            }
          }
        }, _callee87);
      }));

      function getPaymentUri(_x110) {
        return _getPaymentUri.apply(this, arguments);
      }

      return getPaymentUri;
    }()
    /**
     * Parses a payment URI to a tx config.
     * 
     * @param {string} uri - payment uri to parse
     * @return {MoneroTxConfig} the send configuration parsed from the uri
     */

  }, {
    key: "parsePaymentUri",
    value: function () {
      var _parsePaymentUri = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee88(uri) {
        return _regenerator["default"].wrap(function _callee88$(_context88) {
          while (1) {
            switch (_context88.prev = _context88.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context88.stop();
            }
          }
        }, _callee88);
      }));

      function parsePaymentUri(_x111) {
        return _parsePaymentUri.apply(this, arguments);
      }

      return parsePaymentUri;
    }()
    /**
     * Get an attribute.
     * 
     * @param {string} key - attribute to get the value of
     * @return {string} the attribute's value
     */

  }, {
    key: "getAttribute",
    value: function () {
      var _getAttribute = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee89(key) {
        return _regenerator["default"].wrap(function _callee89$(_context89) {
          while (1) {
            switch (_context89.prev = _context89.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context89.stop();
            }
          }
        }, _callee89);
      }));

      function getAttribute(_x112) {
        return _getAttribute.apply(this, arguments);
      }

      return getAttribute;
    }()
    /**
     * Set an arbitrary attribute.
     * 
     * @param {string} key - attribute key
     * @param {string} val - attribute value
     */

  }, {
    key: "setAttribute",
    value: function () {
      var _setAttribute = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee90(key, val) {
        return _regenerator["default"].wrap(function _callee90$(_context90) {
          while (1) {
            switch (_context90.prev = _context90.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context90.stop();
            }
          }
        }, _callee90);
      }));

      function setAttribute(_x113, _x114) {
        return _setAttribute.apply(this, arguments);
      }

      return setAttribute;
    }()
    /**
     * Start mining.
     * 
     * @param {number} [numThreads] - number of threads created for mining (optional)
     * @param {boolean} [backgroundMining] - specifies if mining should occur in the background (optional)
     * @param {boolean} [ignoreBattery] - specifies if the battery should be ignored for mining (optional)
     */

  }, {
    key: "startMining",
    value: function () {
      var _startMining = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee91(numThreads, backgroundMining, ignoreBattery) {
        return _regenerator["default"].wrap(function _callee91$(_context91) {
          while (1) {
            switch (_context91.prev = _context91.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context91.stop();
            }
          }
        }, _callee91);
      }));

      function startMining(_x115, _x116, _x117) {
        return _startMining.apply(this, arguments);
      }

      return startMining;
    }()
    /**
     * Stop mining.
     */

  }, {
    key: "stopMining",
    value: function () {
      var _stopMining = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee92() {
        return _regenerator["default"].wrap(function _callee92$(_context92) {
          while (1) {
            switch (_context92.prev = _context92.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context92.stop();
            }
          }
        }, _callee92);
      }));

      function stopMining() {
        return _stopMining.apply(this, arguments);
      }

      return stopMining;
    }()
    /**
     * Indicates if importing multisig data is needed for returning a correct balance.
     * 
     * @return {boolean} true if importing multisig data is needed for returning a correct balance, false otherwise
     */

  }, {
    key: "isMultisigImportNeeded",
    value: function () {
      var _isMultisigImportNeeded = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee93() {
        return _regenerator["default"].wrap(function _callee93$(_context93) {
          while (1) {
            switch (_context93.prev = _context93.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context93.stop();
            }
          }
        }, _callee93);
      }));

      function isMultisigImportNeeded() {
        return _isMultisigImportNeeded.apply(this, arguments);
      }

      return isMultisigImportNeeded;
    }()
    /**
     * Indicates if this wallet is a multisig wallet.
     * 
     * @return {boolean} true if this is a multisig wallet, false otherwise
     */

  }, {
    key: "isMultisig",
    value: function () {
      var _isMultisig = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee94() {
        return _regenerator["default"].wrap(function _callee94$(_context94) {
          while (1) {
            switch (_context94.prev = _context94.next) {
              case 0:
                _context94.next = 2;
                return this.getMultisigInfo();

              case 2:
                return _context94.abrupt("return", _context94.sent.isMultisig());

              case 3:
              case "end":
                return _context94.stop();
            }
          }
        }, _callee94, this);
      }));

      function isMultisig() {
        return _isMultisig.apply(this, arguments);
      }

      return isMultisig;
    }()
    /**
     * Get multisig info about this wallet.
     * 
     * @return {MoneroMultisigInfo} multisig info about this wallet
     */

  }, {
    key: "getMultisigInfo",
    value: function () {
      var _getMultisigInfo = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee95() {
        return _regenerator["default"].wrap(function _callee95$(_context95) {
          while (1) {
            switch (_context95.prev = _context95.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context95.stop();
            }
          }
        }, _callee95);
      }));

      function getMultisigInfo() {
        return _getMultisigInfo.apply(this, arguments);
      }

      return getMultisigInfo;
    }()
    /**
     * Get multisig info as hex to share with participants to begin creating a
     * multisig wallet.
     * 
     * @return {string} this wallet's multisig hex to share with participants
     */

  }, {
    key: "prepareMultisig",
    value: function () {
      var _prepareMultisig = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee96() {
        return _regenerator["default"].wrap(function _callee96$(_context96) {
          while (1) {
            switch (_context96.prev = _context96.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context96.stop();
            }
          }
        }, _callee96);
      }));

      function prepareMultisig() {
        return _prepareMultisig.apply(this, arguments);
      }

      return prepareMultisig;
    }()
    /**
     * Make this wallet multisig by importing multisig hex from participants.
     * 
     * @param {String[]} multisigHexes - multisig hex from each participant
     * @param {number} threshold - number of signatures needed to sign transfers
     * @param {string} password - wallet password
     * @return {string} this wallet's multisig hex to share with participants
     */

  }, {
    key: "makeMultisig",
    value: function () {
      var _makeMultisig = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee97(multisigHexes, threshold, password) {
        return _regenerator["default"].wrap(function _callee97$(_context97) {
          while (1) {
            switch (_context97.prev = _context97.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context97.stop();
            }
          }
        }, _callee97);
      }));

      function makeMultisig(_x118, _x119, _x120) {
        return _makeMultisig.apply(this, arguments);
      }

      return makeMultisig;
    }()
    /**
     * Exchange multisig hex with participants in a M/N multisig wallet.
     * 
     * This process must be repeated with participants exactly N-M times.
     * 
     * @param {string[]} multisigHexes are multisig hex from each participant
     * @param {string} password - wallet's password // TODO monero-project: redundant? wallet is created with password
     * @return {MoneroMultisigInitResult} the result which has the multisig's address xor this wallet's multisig hex to share with participants iff not done
     */

  }, {
    key: "exchangeMultisigKeys",
    value: function () {
      var _exchangeMultisigKeys = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee98(multisigHexes, password) {
        return _regenerator["default"].wrap(function _callee98$(_context98) {
          while (1) {
            switch (_context98.prev = _context98.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context98.stop();
            }
          }
        }, _callee98);
      }));

      function exchangeMultisigKeys(_x121, _x122) {
        return _exchangeMultisigKeys.apply(this, arguments);
      }

      return exchangeMultisigKeys;
    }()
    /**
     * Export this wallet's multisig info as hex for other participants.
     * 
     * @return {string} this wallet's multisig info as hex for other participants
     */

  }, {
    key: "exportMultisigHex",
    value: function () {
      var _exportMultisigHex = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee99() {
        return _regenerator["default"].wrap(function _callee99$(_context99) {
          while (1) {
            switch (_context99.prev = _context99.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported?");

              case 1:
              case "end":
                return _context99.stop();
            }
          }
        }, _callee99);
      }));

      function exportMultisigHex() {
        return _exportMultisigHex.apply(this, arguments);
      }

      return exportMultisigHex;
    }()
    /**
     * Import multisig info as hex from other participants.
     * 
     * @param {string[]} multisigHexes - multisig hex from each participant
     * @return {int} the number of outputs signed with the given multisig hex
     */

  }, {
    key: "importMultisigHex",
    value: function () {
      var _importMultisigHex = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee100(multisigHexes) {
        return _regenerator["default"].wrap(function _callee100$(_context100) {
          while (1) {
            switch (_context100.prev = _context100.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context100.stop();
            }
          }
        }, _callee100);
      }));

      function importMultisigHex(_x123) {
        return _importMultisigHex.apply(this, arguments);
      }

      return importMultisigHex;
    }()
    /**
     * Sign multisig transactions from a multisig wallet.
     * 
     * @param {string} multisigTxHex - unsigned multisig transactions as hex
     * @return {MoneroMultisigSignResult} the result of signing the multisig transactions
     */

  }, {
    key: "signMultisigTxHex",
    value: function () {
      var _signMultisigTxHex = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee101(multisigTxHex) {
        return _regenerator["default"].wrap(function _callee101$(_context101) {
          while (1) {
            switch (_context101.prev = _context101.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context101.stop();
            }
          }
        }, _callee101);
      }));

      function signMultisigTxHex(_x124) {
        return _signMultisigTxHex.apply(this, arguments);
      }

      return signMultisigTxHex;
    }()
    /**
     * Submit signed multisig transactions from a multisig wallet.
     * 
     * @param {string} signedMultisigTxHex - signed multisig hex returned from signMultisigTxHex()
     * @return {string[]} the resulting transaction hashes
     */

  }, {
    key: "submitMultisigTxHex",
    value: function () {
      var _submitMultisigTxHex = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee102(signedMultisigTxHex) {
        return _regenerator["default"].wrap(function _callee102$(_context102) {
          while (1) {
            switch (_context102.prev = _context102.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context102.stop();
            }
          }
        }, _callee102);
      }));

      function submitMultisigTxHex(_x125) {
        return _submitMultisigTxHex.apply(this, arguments);
      }

      return submitMultisigTxHex;
    }()
    /**
     * Change the wallet password.
     * 
     * @param {string} oldPassword - the wallet's old password
     * @param {string} newPassword - the wallet's new password
     */

  }, {
    key: "changePassword",
    value: function () {
      var _changePassword = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee103(oldPassword, newPassword) {
        return _regenerator["default"].wrap(function _callee103$(_context103) {
          while (1) {
            switch (_context103.prev = _context103.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context103.stop();
            }
          }
        }, _callee103);
      }));

      function changePassword(_x126, _x127) {
        return _changePassword.apply(this, arguments);
      }

      return changePassword;
    }()
    /**
     * Save the wallet at its current path.
     */

  }, {
    key: "save",
    value: function save() {
      throw new _MoneroError["default"]("Not supported");
    }
    /**
     * Optionally save then close the wallet.
     *
     * @param {boolean} [save] - specifies if the wallet should be saved before being closed (default false)
     */

  }, {
    key: "close",
    value: function () {
      var _close = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee104(save) {
        return _regenerator["default"].wrap(function _callee104$(_context104) {
          while (1) {
            switch (_context104.prev = _context104.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context104.stop();
            }
          }
        }, _callee104);
      }));

      function close(_x128) {
        return _close.apply(this, arguments);
      }

      return close;
    }()
    /**
     * Indicates if this wallet is closed or not.
     * 
     * @return {boolean} true if the wallet is closed, false otherwise
     */

  }, {
    key: "isClosed",
    value: function () {
      var _isClosed = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee105() {
        return _regenerator["default"].wrap(function _callee105$(_context105) {
          while (1) {
            switch (_context105.prev = _context105.next) {
              case 0:
                throw new _MoneroError["default"]("Not supported");

              case 1:
              case "end":
                return _context105.stop();
            }
          }
        }, _callee105);
      }));

      function isClosed() {
        return _isClosed.apply(this, arguments);
      }

      return isClosed;
    }() // -------------------------------- PRIVATE ---------------------------------

  }], [{
    key: "_normalizeTxQuery",
    value: function _normalizeTxQuery(query) {
      if (query instanceof _MoneroTxQuery["default"]) query = query.copy();else if (Array.isArray(query)) query = new _MoneroTxQuery["default"]().setHashes(query);else {
        query = Object.assign({}, query);
        query = new _MoneroTxQuery["default"](query);
      }
      if (query.getBlock() === undefined) query.setBlock(new _MoneroBlock["default"]().setTxs([query]));
      if (query.getInputQuery()) query.getInputQuery().setTxQuery(query);
      if (query.getOutputQuery()) query.getOutputQuery().setTxQuery(query);
      return query;
    }
  }, {
    key: "_normalizeTransferQuery",
    value: function _normalizeTransferQuery(query) {
      if (query === undefined) query = new _MoneroTransferQuery["default"]();else if (query instanceof _MoneroTransferQuery["default"]) {
        if (query.getTxQuery() === undefined) query = query.copy();else {
          var txQuery = query.getTxQuery().copy();
          if (query.getTxQuery().getTransferQuery() === query) query = txQuery.getTransferQuery();else {
            _assert["default"].equal(query.getTxQuery().getTransferQuery(), undefined, "Transfer query's tx query must be circular reference or null");

            query = query.copy();
            query.setTxQuery(txQuery);
          }
        }
      } else {
        query = Object.assign({}, query);
        query = new _MoneroTransferQuery["default"](query);
      }
      if (query.getTxQuery() === undefined) query.setTxQuery(new _MoneroTxQuery["default"]());
      query.getTxQuery().setTransferQuery(query);
      if (query.getTxQuery().getBlock() === undefined) query.getTxQuery().setBlock(new _MoneroBlock["default"]().setTxs([query.getTxQuery()]));
      return query;
    }
  }, {
    key: "_normalizeOutputQuery",
    value: function _normalizeOutputQuery(query) {
      if (query === undefined) query = new _MoneroOutputQuery["default"]();else if (query instanceof _MoneroOutputQuery["default"]) {
        if (query.getTxQuery() === undefined) query = query.copy();else {
          var txQuery = query.getTxQuery().copy();
          if (query.getTxQuery().getOutputQuery() === query) query = txQuery.getOutputQuery();else {
            _assert["default"].equal(query.getTxQuery().getOutputQuery(), undefined, "Output query's tx query must be circular reference or null");

            query = query.copy();
            query.setTxQuery(txQuery);
          }
        }
      } else {
        query = Object.assign({}, query);
        query = new _MoneroOutputQuery["default"](query);
      }
      if (query.getTxQuery() === undefined) query.setTxQuery(new _MoneroTxQuery["default"]());
      query.getTxQuery().setOutputQuery(query);
      if (query.getTxQuery().getBlock() === undefined) query.getTxQuery().setBlock(new _MoneroBlock["default"]().setTxs([query.getTxQuery()]));
      return query;
    }
  }, {
    key: "_normalizeCreateTxsConfig",
    value: function _normalizeCreateTxsConfig(config) {
      if (config === undefined || !(config instanceof Object)) throw new _MoneroError["default"]("Must provide MoneroTxConfig or equivalent JS object");
      config = new _MoneroTxConfig["default"](config);
      (0, _assert["default"])(config.getDestinations() && config.getDestinations().length > 0, "Must provide destinations");

      _assert["default"].equal(config.getSweepEachSubaddress(), undefined);

      _assert["default"].equal(config.getBelowAmount(), undefined);

      return config;
    }
  }, {
    key: "_normalizeSweepOutputConfig",
    value: function _normalizeSweepOutputConfig(config) {
      if (config === undefined || !(config instanceof Object)) throw new _MoneroError["default"]("Must provide MoneroTxConfig or equivalent JS object");
      config = new _MoneroTxConfig["default"](config);

      _assert["default"].equal(config.getSweepEachSubaddress(), undefined);

      _assert["default"].equal(config.getBelowAmount(), undefined);

      _assert["default"].equal(config.getCanSplit(), undefined, "Cannot split transactions when sweeping an output");

      if (!config.getDestinations() || config.getDestinations().length !== 1 || !config.getDestinations()[0].getAddress()) throw new _MoneroError["default"]("Must provide exactly one destination address to sweep output to");
      return config;
    }
  }, {
    key: "_normalizeSweepUnlockedConfig",
    value: function _normalizeSweepUnlockedConfig(config) {
      if (config === undefined || !(config instanceof Object)) throw new _MoneroError["default"]("Must provide MoneroTxConfig or equivalent JS object");
      config = new _MoneroTxConfig["default"](config);
      if (config.getDestinations() === undefined || config.getDestinations().length != 1) throw new _MoneroError["default"]("Must provide exactly one destination to sweep to");
      if (config.getDestinations()[0].getAddress() === undefined) throw new _MoneroError["default"]("Must provide destination address to sweep to");
      if (config.getDestinations()[0].getAmount() !== undefined) throw new _MoneroError["default"]("Cannot provide amount in sweep config");
      if (config.getKeyImage() !== undefined) throw new _MoneroError["default"]("Key image defined; use sweepOutput() to sweep an output by its key image");
      if (config.getSubaddressIndices() !== undefined && config.getSubaddressIndices().length === 0) config.setSubaddressIndices(undefined);
      if (config.getAccountIndex() === undefined && config.getSubaddressIndices() !== undefined) throw new _MoneroError["default"]("Must provide account index if subaddress indices are provided");
      return config;
    }
  }]);
  return MoneroWallet;
}();

MoneroWallet.DEFAULT_LANGUAGE = "English";
var _default = MoneroWallet;
exports["default"] = _default;