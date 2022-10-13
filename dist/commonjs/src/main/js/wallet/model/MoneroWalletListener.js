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

/**
 * Default wallet listener which takes no action on notifications.
 */
var MoneroWalletListener = /*#__PURE__*/function () {
  function MoneroWalletListener() {
    (0, _classCallCheck2["default"])(this, MoneroWalletListener);
  }

  (0, _createClass2["default"])(MoneroWalletListener, [{
    key: "onSyncProgress",
    value:
    /**
     * Invoked as the wallet is synchronized.
     * 
     * @param {number} height - height of the synced block 
     * @param {number} startHeight - starting height of the sync request
     * @param {number} endHeight - ending height of the sync request
     * @param {number} percentDone - sync progress as a percentage
     * @param {string} message - human-readable description of the current progress
     * @returns {promise<void>}
     */
    function () {
      var _onSyncProgress = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(height, startHeight, endHeight, percentDone, message) {
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      function onSyncProgress(_x, _x2, _x3, _x4, _x5) {
        return _onSyncProgress.apply(this, arguments);
      }

      return onSyncProgress;
    }()
    /**
     * Invoked when a new block is added to the chain.
     * 
     * @param {number} height - the height of the new block (i.e. the number of blocks before it).
     * @returns {promise<void>}
     */

  }, {
    key: "onNewBlock",
    value: function () {
      var _onNewBlock = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(height) {
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }));

      function onNewBlock(_x6) {
        return _onNewBlock.apply(this, arguments);
      }

      return onNewBlock;
    }()
    /**
     * Invoked when the wallet's balances change.
     * 
     * @param {BigInt} newBalance - new wallet balance
     * @param {BigInt} newUnlockedBalance - new unlocked wallet balance
     * @returns {promise<void>}
     */

  }, {
    key: "onBalancesChanged",
    value: function () {
      var _onBalancesChanged = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(newBalance, newUnlockedBalance) {
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }));

      function onBalancesChanged(_x7, _x8) {
        return _onBalancesChanged.apply(this, arguments);
      }

      return onBalancesChanged;
    }()
    /**
     * Invoked 3 times per received output: once when unconfirmed, once when confirmed, and
     * once when unlocked.
     * 
     * The notified output includes basic fields only, so the output or its transaction should be fetched to get all available fields.
     * 
     * @param {MoneroOutputWallet} output - the received output
     * @returns {promise<void>}
     */

  }, {
    key: "onOutputReceived",
    value: function () {
      var _onOutputReceived = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(output) {
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4);
      }));

      function onOutputReceived(_x9) {
        return _onOutputReceived.apply(this, arguments);
      }

      return onOutputReceived;
    }()
    /**
     * Invoked twice per spent output: once when confirmed and once when unlocked.
     * 
     * The notified output includes basic fields only, so the output or its transaction should be fetched to get all available fields.
     * 
     * @param {MoneroOutputWallet} output - the spent output
     * @param {promise<void>}
     */

  }, {
    key: "onOutputSpent",
    value: function () {
      var _onOutputSpent = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(output) {
        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5);
      }));

      function onOutputSpent(_x10) {
        return _onOutputSpent.apply(this, arguments);
      }

      return onOutputSpent;
    }()
  }]);
  return MoneroWalletListener;
}();

var _default = MoneroWalletListener;
exports["default"] = _default;