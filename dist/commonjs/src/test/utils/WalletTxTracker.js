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

var _TestUtils = _interopRequireDefault(require("./TestUtils"));

var _StartMining = _interopRequireDefault(require("./StartMining"));

var _index = require("../../../index");

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function (_e) { function e(_x6) { return _e.apply(this, arguments); } e.toString = function () { return _e.toString(); }; return e; }(function (e) { throw e; }), f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function (_e2) { function e(_x7) { return _e2.apply(this, arguments); } e.toString = function () { return _e2.toString(); }; return e; }(function (e) { didErr = true; err = e; }), f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

/**
 * Tracks wallets which are in sync with the tx pool and therefore whose txs in the pool
 * do not need to be waited on for up-to-date pool information e.g. to create txs.
 * 
 * This is only necessary because txs relayed outside wallets are not fully incorporated
 * into the wallet state until confirmed.
 * 
 * TODO monero-project: sync txs relayed outside wallet so this class is unecessary
 */
var WalletTxTracker = /*#__PURE__*/function () {
  function WalletTxTracker() {
    (0, _classCallCheck2["default"])(this, WalletTxTracker);
    this.clearedWallets = new Set();
  }

  (0, _createClass2["default"])(WalletTxTracker, [{
    key: "reset",
    value: function reset() {
      this.clearedWallets.clear();
    } //  /**
    //   * Reset the tracker such that all wallets except the given sending wallet will
    //   * need to wait for pool txs to confirm in order to reliably sync.
    //   * 
    //   * @param sendingWallet is the wallet which sent the tx and therefore should not cause txs to be waited on
    //   */
    //  resetExcept(sendingWallet) {
    //    let found = this.clearedWallets.has(sendingWallet);
    //    this.clearedWallets.clear();
    //    if (found) this.clearedWallets.add(sendingWallet);
    //  }

    /**
     * Waits for transactions in the pool belonging to the given wallets to clear.
     * 
     * @param wallets have transactions to wait on if in the pool
     */

  }, {
    key: "waitForWalletTxsToClearPool",
    value: function () {
      var _waitForWalletTxsToClearPool = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(wallets) {
        var txHashesWallet, _iterator, _step, wallet, _iterator5, _step5, _tx, isFirst, miningStarted, daemon, txHashesPool, _iterator2, _step2, tx, txHashesIntersection, _iterator3, _step3, txHashPool, miningStatus, _iterator4, _step4, _wallet;

        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                wallets = _index.GenUtils.listify(wallets); // get wallet tx hashes

                txHashesWallet = new Set();
                _iterator = _createForOfIteratorHelper(wallets);
                _context.prev = 3;

                _iterator.s();

              case 5:
                if ((_step = _iterator.n()).done) {
                  _context.next = 18;
                  break;
                }

                wallet = _step.value;

                if (this.clearedWallets.has(wallet)) {
                  _context.next = 16;
                  break;
                }

                _context.next = 10;
                return wallet.sync();

              case 10:
                _context.t0 = _createForOfIteratorHelper;
                _context.next = 13;
                return wallet.getTxs();

              case 13:
                _context.t1 = _context.sent;
                _iterator5 = (0, _context.t0)(_context.t1);

                try {
                  for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
                    _tx = _step5.value;
                    txHashesWallet.add(_tx.getHash());
                  }
                } catch (err) {
                  _iterator5.e(err);
                } finally {
                  _iterator5.f();
                }

              case 16:
                _context.next = 5;
                break;

              case 18:
                _context.next = 23;
                break;

              case 20:
                _context.prev = 20;
                _context.t2 = _context["catch"](3);

                _iterator.e(_context.t2);

              case 23:
                _context.prev = 23;

                _iterator.f();

                return _context.finish(23);

              case 26:
                // loop until all wallet txs clear from pool
                isFirst = true;
                miningStarted = false; //import TestUtils from "./TestUtils"; // to avoid circular reference

                _context.next = 30;
                return _TestUtils["default"].getDaemonRpc();

              case 30:
                daemon = _context.sent;

              case 31:
                if (!true) {
                  _context.next = 89;
                  break;
                }

                // get hashes of relayed, non-failed txs in the pool
                txHashesPool = new Set();
                _context.t3 = _createForOfIteratorHelper;
                _context.next = 36;
                return daemon.getTxPool();

              case 36:
                _context.t4 = _context.sent;
                _iterator2 = (0, _context.t3)(_context.t4);
                _context.prev = 38;

                _iterator2.s();

              case 40:
                if ((_step2 = _iterator2.n()).done) {
                  _context.next = 54;
                  break;
                }

                tx = _step2.value;

                if (tx.isRelayed()) {
                  _context.next = 46;
                  break;
                }

                return _context.abrupt("continue", 52);

              case 46:
                if (!tx.isFailed()) {
                  _context.next = 51;
                  break;
                }

                _context.next = 49;
                return daemon.flushTxPool(tx.getHash());

              case 49:
                _context.next = 52;
                break;

              case 51:
                txHashesPool.add(tx.getHash());

              case 52:
                _context.next = 40;
                break;

              case 54:
                _context.next = 59;
                break;

              case 56:
                _context.prev = 56;
                _context.t5 = _context["catch"](38);

                _iterator2.e(_context.t5);

              case 59:
                _context.prev = 59;

                _iterator2.f();

                return _context.finish(59);

              case 62:
                // get hashes to wait for as intersection of wallet and pool txs
                txHashesIntersection = new Set();
                _iterator3 = _createForOfIteratorHelper(txHashesPool);

                try {
                  for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                    txHashPool = _step3.value;
                    if (txHashesWallet.has(txHashPool)) txHashesIntersection.add(txHashPool);
                  }
                } catch (err) {
                  _iterator3.e(err);
                } finally {
                  _iterator3.f();
                }

                txHashesPool = txHashesIntersection; // break if no txs to wait for

                if (!(txHashesPool.size === 0)) {
                  _context.next = 68;
                  break;
                }

                return _context.abrupt("break", 89);

              case 68:
                if (!isFirst) {
                  _context.next = 85;
                  break;
                }

                isFirst = false;
                console.log("Waiting for wallet txs to clear from the pool in order to fully sync and avoid double spend attempts (known issue)");
                _context.next = 73;
                return daemon.getMiningStatus();

              case 73:
                miningStatus = _context.sent;

                if (miningStatus.isActive()) {
                  _context.next = 85;
                  break;
                }

                _context.prev = 75;
                _context.next = 78;
                return _StartMining["default"].startMining();

              case 78:
                miningStarted = true;
                _context.next = 85;
                break;

              case 81:
                _context.prev = 81;
                _context.t6 = _context["catch"](75);
                console.error("Error starting mining:");
                console.error(_context.t6);

              case 85:
                _context.next = 87;
                return new Promise(function (resolve) {
                  setTimeout(resolve, _TestUtils["default"].SYNC_PERIOD_IN_MS);
                });

              case 87:
                _context.next = 31;
                break;

              case 89:
                if (!miningStarted) {
                  _context.next = 92;
                  break;
                }

                _context.next = 92;
                return daemon.stopMining();

              case 92:
                // sync wallets with the pool
                _iterator4 = _createForOfIteratorHelper(wallets);
                _context.prev = 93;

                _iterator4.s();

              case 95:
                if ((_step4 = _iterator4.n()).done) {
                  _context.next = 102;
                  break;
                }

                _wallet = _step4.value;
                _context.next = 99;
                return _wallet.sync();

              case 99:
                this.clearedWallets.add(_wallet);

              case 100:
                _context.next = 95;
                break;

              case 102:
                _context.next = 107;
                break;

              case 104:
                _context.prev = 104;
                _context.t7 = _context["catch"](93);

                _iterator4.e(_context.t7);

              case 107:
                _context.prev = 107;

                _iterator4.f();

                return _context.finish(107);

              case 110:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[3, 20, 23, 26], [38, 56, 59, 62], [75, 81], [93, 104, 107, 110]]);
      }));

      function waitForWalletTxsToClearPool(_x) {
        return _waitForWalletTxsToClearPool.apply(this, arguments);
      }

      return waitForWalletTxsToClearPool;
    }()
  }, {
    key: "waitForUnlockedBalance",
    value: function () {
      var _waitForUnlockedBalance = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(wallet, accountIndex, subaddressIndex, minAmount) {
        var unlockedBalance, daemon, miningStarted;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!minAmount) minAmount = BigInt("0"); // check if wallet has balance

                _context2.next = 3;
                return wallet.getBalance(accountIndex, _index.GenUtils.compareBigInt(subaddressIndex));

              case 3:
                _context2.t0 = minAmount;

                if (!(_context2.t0 < 0)) {
                  _context2.next = 6;
                  break;
                }

                throw new Error("Wallet does not have enough balance to wait for");

              case 6:
                _context2.next = 8;
                return wallet.getUnlockedBalance(accountIndex, subaddressIndex);

              case 8:
                unlockedBalance = _context2.sent;

                if (!(_index.GenUtils.compareBigInt(unlockedBalance, minAmount) > 0)) {
                  _context2.next = 11;
                  break;
                }

                return _context2.abrupt("return", unlockedBalance);

              case 11:
                _context2.next = 13;
                return _TestUtils["default"].getDaemonRpc();

              case 13:
                daemon = _context2.sent;
                miningStarted = false;
                _context2.next = 17;
                return daemon.getMiningStatus();

              case 17:
                if (_context2.sent.isActive()) {
                  _context2.next = 29;
                  break;
                }

                _context2.prev = 18;
                console.log("Starting mining!"); //import StartMining from "./StartMining"; // to avoid circular reference

                _context2.next = 22;
                return _StartMining["default"].startMining();

              case 22:
                miningStarted = true;
                _context2.next = 29;
                break;

              case 25:
                _context2.prev = 25;
                _context2.t1 = _context2["catch"](18);
                console.error("Error starting mining:");
                console.error(e);

              case 29:
                // wait for unlocked balance // TODO: promote to MoneroWallet interface?
                console.log("Waiting for unlocked balance");

              case 30:
                if (!(_index.GenUtils.compareBigInt(unlockedBalance, minAmount) < 0)) {
                  _context2.next = 38;
                  break;
                }

                _context2.next = 33;
                return wallet.getUnlockedBalance(accountIndex, subaddressIndex);

              case 33:
                unlockedBalance = _context2.sent;
                _context2.next = 36;
                return new Promise(function (resolve) {
                  setTimeout(resolve, _TestUtils["default"].SYNC_PERIOD_IN_MS);
                });

              case 36:
                _context2.next = 30;
                break;

              case 38:
                if (!miningStarted) {
                  _context2.next = 41;
                  break;
                }

                _context2.next = 41;
                return daemon.stopMining();

              case 41:
                return _context2.abrupt("return", unlockedBalance);

              case 42:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, null, [[18, 25]]);
      }));

      function waitForUnlockedBalance(_x2, _x3, _x4, _x5) {
        return _waitForUnlockedBalance.apply(this, arguments);
      }

      return waitForUnlockedBalance;
    }()
  }]);
  return WalletTxTracker;
}();

var _default = WalletTxTracker;
exports["default"] = _default;