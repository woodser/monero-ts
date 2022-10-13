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

var _TestUtils = _interopRequireDefault(require("./TestUtils"));

var _index = require("../../../index");

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

/**
 * Utilities to deep compare wallets.
 */
var WalletEqualityUtils = /*#__PURE__*/function () {
  function WalletEqualityUtils() {
    (0, _classCallCheck2["default"])(this, WalletEqualityUtils);
  }

  (0, _createClass2["default"])(WalletEqualityUtils, null, [{
    key: "testWalletEqualityKeys",
    value:
    /**
     * Compare the keys of two wallets.
     */
    function () {
      var _testWalletEqualityKeys = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(w1, w2) {
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.t0 = _assert["default"];
                _context.next = 3;
                return w2.getMnemonic();

              case 3:
                _context.t1 = _context.sent;
                _context.next = 6;
                return w1.getMnemonic();

              case 6:
                _context.t2 = _context.sent;

                _context.t0.equal.call(_context.t0, _context.t1, _context.t2);

                _context.t3 = _assert["default"];
                _context.next = 11;
                return w2.getPrimaryAddress();

              case 11:
                _context.t4 = _context.sent;
                _context.next = 14;
                return w1.getPrimaryAddress();

              case 14:
                _context.t5 = _context.sent;

                _context.t3.equal.call(_context.t3, _context.t4, _context.t5);

                _context.t6 = _assert["default"];
                _context.next = 19;
                return w2.getPrivateViewKey();

              case 19:
                _context.t7 = _context.sent;
                _context.next = 22;
                return w1.getPrivateViewKey();

              case 22:
                _context.t8 = _context.sent;

                _context.t6.equal.call(_context.t6, _context.t7, _context.t8);

              case 24:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      function testWalletEqualityKeys(_x, _x2) {
        return _testWalletEqualityKeys.apply(this, arguments);
      }

      return testWalletEqualityKeys;
    }()
    /**
     * Compares two wallets for equality using only on-chain data.
     * 
     * This test will sync the two wallets until their height is equal to guarantee equal state.
     * 
     * @param w1 a wallet to compare
     * @param w2 a wallet to compare
     */

  }, {
    key: "testWalletEqualityOnChain",
    value: function () {
      var _testWalletEqualityOnChain = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(w1, w2) {
        var txQuery, transferQuery, outputQuery;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _TestUtils["default"].WALLET_TX_TRACKER.reset(); // all wallets need to wait for txs to confirm to reliably sync
                // wait for relayed txs associated with wallets to clear pool


                _context2.next = 3;
                return _TestUtils["default"].WALLET_TX_TRACKER.waitForWalletTxsToClearPool(w1, w2);

              case 3:
                _context2.next = 5;
                return w1.getHeight();

              case 5:
                _context2.t0 = _context2.sent;
                _context2.next = 8;
                return w2.getHeight();

              case 8:
                _context2.t1 = _context2.sent;

                if (!(_context2.t0 !== _context2.t1)) {
                  _context2.next = 16;
                  break;
                }

                _context2.next = 12;
                return w1.sync();

              case 12:
                _context2.next = 14;
                return w2.sync();

              case 14:
                _context2.next = 3;
                break;

              case 16:
                _context2.t2 = _assert["default"];
                _context2.next = 19;
                return w2.getHeight();

              case 19:
                _context2.t3 = _context2.sent;
                _context2.next = 22;
                return w1.getHeight();

              case 22:
                _context2.t4 = _context2.sent;

                _context2.t2.equal.call(_context2.t2, _context2.t3, _context2.t4, "Wallet heights are not equal after syncing");

                _context2.t5 = _assert["default"];
                _context2.next = 27;
                return w2.getMnemonic();

              case 27:
                _context2.t6 = _context2.sent;
                _context2.next = 30;
                return w1.getMnemonic();

              case 30:
                _context2.t7 = _context2.sent;

                _context2.t5.equal.call(_context2.t5, _context2.t6, _context2.t7);

                _context2.t8 = _assert["default"];
                _context2.next = 35;
                return w2.getPrimaryAddress();

              case 35:
                _context2.t9 = _context2.sent;
                _context2.next = 38;
                return w1.getPrimaryAddress();

              case 38:
                _context2.t10 = _context2.sent;

                _context2.t8.equal.call(_context2.t8, _context2.t9, _context2.t10);

                _context2.t11 = _assert["default"];
                _context2.next = 43;
                return w2.getPrivateViewKey();

              case 43:
                _context2.t12 = _context2.sent;
                _context2.next = 46;
                return w1.getPrivateViewKey();

              case 46:
                _context2.t13 = _context2.sent;

                _context2.t11.equal.call(_context2.t11, _context2.t12, _context2.t13);

                _context2.t14 = _assert["default"];
                _context2.next = 51;
                return w2.getPrivateSpendKey();

              case 51:
                _context2.t15 = _context2.sent;
                _context2.next = 54;
                return w1.getPrivateSpendKey();

              case 54:
                _context2.t16 = _context2.sent;

                _context2.t14.equal.call(_context2.t14, _context2.t15, _context2.t16);

                txQuery = new _index.MoneroTxQuery().setIsConfirmed(true);
                _context2.t17 = WalletEqualityUtils;
                _context2.next = 60;
                return w1.getTxs(txQuery);

              case 60:
                _context2.t18 = _context2.sent;
                _context2.next = 63;
                return w2.getTxs(txQuery);

              case 63:
                _context2.t19 = _context2.sent;
                _context2.next = 66;
                return _context2.t17._testTxWalletsEqualOnChain.call(_context2.t17, _context2.t18, _context2.t19);

              case 66:
                txQuery.setIncludeOutputs(true);
                _context2.t20 = WalletEqualityUtils;
                _context2.next = 70;
                return w1.getTxs(txQuery);

              case 70:
                _context2.t21 = _context2.sent;
                _context2.next = 73;
                return w2.getTxs(txQuery);

              case 73:
                _context2.t22 = _context2.sent;
                _context2.next = 76;
                return _context2.t20._testTxWalletsEqualOnChain.call(_context2.t20, _context2.t21, _context2.t22);

              case 76:
                _context2.t23 = WalletEqualityUtils;
                _context2.next = 79;
                return w1.getAccounts(true);

              case 79:
                _context2.t24 = _context2.sent;
                _context2.next = 82;
                return w2.getAccounts(true);

              case 82:
                _context2.t25 = _context2.sent;
                _context2.next = 85;
                return _context2.t23._testAccountsEqualOnChain.call(_context2.t23, _context2.t24, _context2.t25);

              case 85:
                _context2.t26 = _assert["default"];
                _context2.next = 88;
                return w2.getBalance();

              case 88:
                _context2.t27 = _context2.sent.toString();
                _context2.next = 91;
                return w1.getBalance();

              case 91:
                _context2.t28 = _context2.sent.toString();

                _context2.t26.equal.call(_context2.t26, _context2.t27, _context2.t28);

                _context2.t29 = _assert["default"];
                _context2.next = 96;
                return w2.getUnlockedBalance();

              case 96:
                _context2.t30 = _context2.sent.toString();
                _context2.next = 99;
                return w1.getUnlockedBalance();

              case 99:
                _context2.t31 = _context2.sent.toString();

                _context2.t29.equal.call(_context2.t29, _context2.t30, _context2.t31);

                transferQuery = new _index.MoneroTransferQuery().setTxQuery(new _index.MoneroTxQuery().setIsConfirmed(true));
                _context2.t32 = WalletEqualityUtils;
                _context2.next = 105;
                return w1.getTransfers(transferQuery);

              case 105:
                _context2.t33 = _context2.sent;
                _context2.next = 108;
                return w2.getTransfers(transferQuery);

              case 108:
                _context2.t34 = _context2.sent;
                _context2.next = 111;
                return _context2.t32._testTransfersEqualOnChain.call(_context2.t32, _context2.t33, _context2.t34);

              case 111:
                outputQuery = new _index.MoneroOutputQuery().setTxQuery(new _index.MoneroTxQuery().setIsConfirmed(true));
                _context2.t35 = WalletEqualityUtils;
                _context2.next = 115;
                return w1.getOutputs(outputQuery);

              case 115:
                _context2.t36 = _context2.sent;
                _context2.next = 118;
                return w2.getOutputs(outputQuery);

              case 118:
                _context2.t37 = _context2.sent;
                _context2.next = 121;
                return _context2.t35._testOutputWalletsEqualOnChain.call(_context2.t35, _context2.t36, _context2.t37);

              case 121:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }));

      function testWalletEqualityOnChain(_x3, _x4) {
        return _testWalletEqualityOnChain.apply(this, arguments);
      }

      return testWalletEqualityOnChain;
    }()
  }, {
    key: "_testAccountsEqualOnChain",
    value: function () {
      var _testAccountsEqualOnChain2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(accounts1, accounts2) {
        var i, j, _iterator, _step, subaddress, _j, _iterator2, _step2, _subaddress;

        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                i = 0;

              case 1:
                if (!(i < Math.max(accounts1.length, accounts2.length))) {
                  _context3.next = 17;
                  break;
                }

                if (!(i < accounts1.length && i < accounts2.length)) {
                  _context3.next = 7;
                  break;
                }

                _context3.next = 5;
                return WalletEqualityUtils._testAccountEqualOnChain(accounts1[i], accounts2[i]);

              case 5:
                _context3.next = 14;
                break;

              case 7:
                if (!(i >= accounts1.length)) {
                  _context3.next = 12;
                  break;
                }

                for (j = i; j < accounts2.length; j++) {
                  _assert["default"].equal(accounts2[j].getBalance().toString(), BigInt("0").toString());

                  (0, _assert["default"])(accounts2[j].getSubaddresses().length >= 1);
                  _iterator = _createForOfIteratorHelper(accounts2[j].getSubaddresses());

                  try {
                    for (_iterator.s(); !(_step = _iterator.n()).done;) {
                      subaddress = _step.value;
                      (0, _assert["default"])(!subaddress.isUsed());
                    }
                  } catch (err) {
                    _iterator.e(err);
                  } finally {
                    _iterator.f();
                  }
                }

                return _context3.abrupt("return");

              case 12:
                for (_j = i; _j < accounts1.length; _j++) {
                  _assert["default"].equal(accounts1[_j].getBalance().toString(), BigInt("0"));

                  (0, _assert["default"])(accounts1[_j].getSubaddresses().length >= 1);
                  _iterator2 = _createForOfIteratorHelper(accounts1[_j].getSubaddresses());

                  try {
                    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                      _subaddress = _step2.value;
                      (0, _assert["default"])(!_subaddress.isUsed());
                    }
                  } catch (err) {
                    _iterator2.e(err);
                  } finally {
                    _iterator2.f();
                  }
                }

                return _context3.abrupt("return");

              case 14:
                i++;
                _context3.next = 1;
                break;

              case 17:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }));

      function _testAccountsEqualOnChain(_x5, _x6) {
        return _testAccountsEqualOnChain2.apply(this, arguments);
      }

      return _testAccountsEqualOnChain;
    }()
  }, {
    key: "_testAccountEqualOnChain",
    value: function () {
      var _testAccountEqualOnChain2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(account1, account2) {
        var subaddresses1, subaddresses2;
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                // nullify off-chain data for comparison
                subaddresses1 = account1.getSubaddresses();
                subaddresses2 = account2.getSubaddresses();
                account1.setSubaddresses(undefined);
                account2.setSubaddresses(undefined);
                account1.setTag(undefined);
                account2.setTag(undefined); // test account equality

                (0, _assert["default"])(_index.GenUtils.equals(account2, account1));
                _context4.next = 9;
                return WalletEqualityUtils._testSubaddressesEqualOnChain(subaddresses1, subaddresses2);

              case 9:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4);
      }));

      function _testAccountEqualOnChain(_x7, _x8) {
        return _testAccountEqualOnChain2.apply(this, arguments);
      }

      return _testAccountEqualOnChain;
    }()
  }, {
    key: "_testSubaddressesEqualOnChain",
    value: function () {
      var _testSubaddressesEqualOnChain2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(subaddresses1, subaddresses2) {
        var i, j, _j2;

        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                i = 0;

              case 1:
                if (!(i < Math.max(subaddresses1.length, subaddresses2.length))) {
                  _context5.next = 17;
                  break;
                }

                if (!(i < subaddresses1.length && i < subaddresses2.length)) {
                  _context5.next = 7;
                  break;
                }

                _context5.next = 5;
                return WalletEqualityUtils._testSubaddressesEqualOnChain(subaddresses1[i], subaddresses2[i]);

              case 5:
                _context5.next = 14;
                break;

              case 7:
                if (!(i >= subaddresses1.length)) {
                  _context5.next = 12;
                  break;
                }

                for (j = i; j < subaddresses2.length; j++) {
                  _assert["default"].equal(BigInt("0"), subaddresses2[j].getBalance().toString());

                  (0, _assert["default"])(!subaddresses2[j].isUsed());
                }

                return _context5.abrupt("return");

              case 12:
                for (_j2 = i; _j2 < subaddresses1.length; _j2++) {
                  _assert["default"].equal(BigInt("0"), subaddresses1[i].getBalance());

                  (0, _assert["default"])(!subaddresses1[_j2].isUsed());
                }

                return _context5.abrupt("return");

              case 14:
                i++;
                _context5.next = 1;
                break;

              case 17:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5);
      }));

      function _testSubaddressesEqualOnChain(_x9, _x10) {
        return _testSubaddressesEqualOnChain2.apply(this, arguments);
      }

      return _testSubaddressesEqualOnChain;
    }()
  }, {
    key: "testSubaddressesEqualOnChain",
    value: function () {
      var _testSubaddressesEqualOnChain3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6(subaddress1, subaddress2) {
        return _regenerator["default"].wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                subaddress1.setLabel(undefined); // nullify off-chain data for comparison

                subaddress2.setLabel(undefined);
                (0, _assert["default"])(_index.GenUtils.equals(subaddress2, subaddress1));

              case 3:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6);
      }));

      function testSubaddressesEqualOnChain(_x11, _x12) {
        return _testSubaddressesEqualOnChain3.apply(this, arguments);
      }

      return testSubaddressesEqualOnChain;
    }()
  }, {
    key: "_testTxWalletsEqualOnChain",
    value: function () {
      var _testTxWalletsEqualOnChain2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7(txs1, txs2) {
        var allTxs, _iterator3, _step3, tx1, _iterator4, _step4, tx2, _i, _allTxs, tx, _iterator5, _step5, _tx, found, _iterator6, _step6, _tx2, blockTxs1, blockTxs2;

        return _regenerator["default"].wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                // nullify off-chain data for comparison
                allTxs = [];
                _iterator3 = _createForOfIteratorHelper(txs1);

                try {
                  for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                    tx1 = _step3.value;
                    allTxs.push(tx1);
                  }
                } catch (err) {
                  _iterator3.e(err);
                } finally {
                  _iterator3.f();
                }

                _iterator4 = _createForOfIteratorHelper(txs2);

                try {
                  for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                    tx2 = _step4.value;
                    allTxs.push(tx2);
                  }
                } catch (err) {
                  _iterator4.e(err);
                } finally {
                  _iterator4.f();
                }

                for (_i = 0, _allTxs = allTxs; _i < _allTxs.length; _i++) {
                  tx = _allTxs[_i];
                  tx.setNote(undefined);

                  if (tx.getOutgoingTransfer() !== undefined) {
                    tx.getOutgoingTransfer().setAddresses(undefined);
                  }
                } // compare txs


                _assert["default"].equal(txs2.length, txs1.length, "Wallets have different number of txs: " + txs1.length + " vs " + txs2.length);

                _iterator5 = _createForOfIteratorHelper(txs1);

                try {
                  for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
                    _tx = _step5.value;
                    found = false;
                    _iterator6 = _createForOfIteratorHelper(txs2);

                    try {
                      for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
                        _tx2 = _step6.value;

                        if (_tx.getHash() === _tx2.getHash()) {
                          // transfer cached info if known for comparison
                          if (_tx.getOutgoingTransfer() !== undefined && _tx.getOutgoingTransfer().getDestinations() !== undefined) {
                            if (_tx2.getOutgoingTransfer() === undefined || _tx2.getOutgoingTransfer().getDestinations() === undefined) WalletEqualityUtils._transferCachedInfo(_tx, _tx2);
                          } else if (_tx2.getOutgoingTransfer() !== undefined && _tx2.getOutgoingTransfer().getDestinations() !== undefined) {
                            WalletEqualityUtils._transferCachedInfo(_tx2, _tx);
                          } // test tx equality by merging


                          (0, _assert["default"])(_TestUtils["default"].txsMergeable(_tx, _tx2), "Txs are not mergeable");
                          found = true; // test block equality except txs to ignore order

                          blockTxs1 = _tx.getBlock().getTxs();
                          blockTxs2 = _tx2.getBlock().getTxs();

                          _tx.getBlock().setTxs();

                          _tx2.getBlock().setTxs();

                          (0, _assert["default"])(_index.GenUtils.equals(_tx2.getBlock().toJson(), _tx.getBlock().toJson()), "Tx blocks are not equal");

                          _tx.getBlock().setTxs(blockTxs1);

                          _tx2.getBlock().setTxs(blockTxs2);
                        }
                      }
                    } catch (err) {
                      _iterator6.e(err);
                    } finally {
                      _iterator6.f();
                    }

                    (0, _assert["default"])(found); // each tx must have one and only one match
                  }
                } catch (err) {
                  _iterator5.e(err);
                } finally {
                  _iterator5.f();
                }

              case 9:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7);
      }));

      function _testTxWalletsEqualOnChain(_x13, _x14) {
        return _testTxWalletsEqualOnChain2.apply(this, arguments);
      }

      return _testTxWalletsEqualOnChain;
    }()
  }, {
    key: "_transferCachedInfo",
    value: function () {
      var _transferCachedInfo2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee8(src, tgt) {
        var _iterator7, _step7, inTransfer;

        return _regenerator["default"].wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                // fill in missing incoming transfers when sending from/to the same account
                if (src.getIncomingTransfers() !== undefined) {
                  _iterator7 = _createForOfIteratorHelper(src.getIncomingTransfers());

                  try {
                    for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
                      inTransfer = _step7.value;

                      if (inTransfer.getAccountIndex() === src.getOutgoingTransfer().getAccountIndex()) {
                        tgt.getIncomingTransfers().push(inTransfer);
                      }
                    } // sort transfers

                  } catch (err) {
                    _iterator7.e(err);
                  } finally {
                    _iterator7.f();
                  }

                  tgt.getIncomingTransfers().sort(_index.MoneroWalletRpc._compareIncomingTransfers);
                } // transfer info to outgoing transfer


                if (tgt.getOutgoingTransfer() === undefined) tgt.setOutgoingTransfer(src.getOutgoingTransfer());else {
                  tgt.getOutgoingTransfer().setDestinations(src.getOutgoingTransfer().getDestinations());
                  tgt.getOutgoingTransfer().setAmount(src.getOutgoingTransfer().getAmount());
                } // transfer payment id if outgoing // TODO: monero-wallet-rpc does not provide payment id for outgoing transfer when cache missing https://github.com/monero-project/monero/issues/8378

                if (tgt.getOutgoingTransfer() !== undefined) tgt.setPaymentId(src.getPaymentId());

              case 3:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8);
      }));

      function _transferCachedInfo(_x15, _x16) {
        return _transferCachedInfo2.apply(this, arguments);
      }

      return _transferCachedInfo;
    }()
  }, {
    key: "_testTransfersEqualOnChain",
    value: function () {
      var _testTransfersEqualOnChain2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee9(transfers1, transfers2) {
        var txsTransfers1, txsTransfers2, lastHeight, lastTx1, lastTx2, i, transfer1, transfer2, txTransfers1, txTransfers2, _i2, _Object$keys, txHash, _txTransfers, _txTransfers2, _i3, _transfer, _transfer2, ot1, ot2, it1, it2;

        return _regenerator["default"].wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                _assert["default"].equal(transfers2.length, transfers1.length); // test and collect transfers per transaction


                txsTransfers1 = {};
                txsTransfers2 = {};
                lastHeight = undefined;
                lastTx1 = undefined;
                lastTx2 = undefined;

                for (i = 0; i < transfers1.length; i++) {
                  transfer1 = transfers1[i];
                  transfer2 = transfers2[i]; // transfers must have same height even if they don't belong to same tx (because tx ordering within blocks is not currently provided by wallet2)

                  _assert["default"].equal(transfer2.getTx().getHeight(), transfer1.getTx().getHeight()); // transfers must be in ascending order by height


                  if (lastHeight === undefined) lastHeight = transfer1.getTx().getHeight();else (0, _assert["default"])(lastHeight <= transfer1.getTx().getHeight()); // transfers must be consecutive per transaction

                  if (lastTx1 !== transfer1.getTx()) {
                    (0, _assert["default"])(!txsTransfers1[transfer1.getTx().getHash()]); // cannot be seen before

                    lastTx1 = transfer1.getTx();
                  }

                  if (lastTx2 !== transfer2.getTx()) {
                    (0, _assert["default"])(!txsTransfers2[transfer2.getTx().getHash()]); // cannot be seen before

                    lastTx2 = transfer2.getTx();
                  } // collect tx1 transfer


                  txTransfers1 = txsTransfers1[transfer1.getTx().getHash()];

                  if (txTransfers1 === undefined) {
                    txTransfers1 = [];
                    txsTransfers1[transfer1.getTx().getHash()] = txTransfers1;
                  }

                  txTransfers1.push(transfer1); // collect tx2 transfer

                  txTransfers2 = txsTransfers2[transfer2.getTx().getHash()];

                  if (txTransfers2 === undefined) {
                    txTransfers2 = [];
                    txsTransfers2[transfer2.getTx().getHash()] = txTransfers2;
                  }

                  txTransfers2.push(transfer2);
                } // compare collected transfers per tx for equality


                _i2 = 0, _Object$keys = Object.keys(txsTransfers1);

              case 8:
                if (!(_i2 < _Object$keys.length)) {
                  _context9.next = 44;
                  break;
                }

                txHash = _Object$keys[_i2];
                _txTransfers = txsTransfers1[txHash];
                _txTransfers2 = txsTransfers2[txHash];

                _assert["default"].equal(_txTransfers2.length, _txTransfers.length); // normalize and compare transfers


                _i3 = 0;

              case 14:
                if (!(_i3 < _txTransfers.length)) {
                  _context9.next = 41;
                  break;
                }

                _transfer = _txTransfers[_i3];
                _transfer2 = _txTransfers2[_i3]; // normalize outgoing transfers

                if (!(_transfer instanceof _index.MoneroOutgoingTransfer)) {
                  _context9.next = 33;
                  break;
                }

                ot1 = _transfer;
                ot2 = _transfer2; // transfer destination info if known for comparison

                if (!(ot1.getDestinations() !== undefined)) {
                  _context9.next = 26;
                  break;
                }

                if (!(ot2.getDestinations() === undefined)) {
                  _context9.next = 24;
                  break;
                }

                _context9.next = 24;
                return WalletEqualityUtils._transferCachedInfo(ot1.getTx(), ot2.getTx());

              case 24:
                _context9.next = 29;
                break;

              case 26:
                if (!(ot2.getDestinations() !== undefined)) {
                  _context9.next = 29;
                  break;
                }

                _context9.next = 29;
                return WalletEqualityUtils._transferCachedInfo(ot2.getTx(), ot1.getTx());

              case 29:
                // nullify other local wallet data
                ot1.setAddresses(undefined);
                ot2.setAddresses(undefined);
                _context9.next = 37;
                break;

              case 33:
                it1 = _transfer;
                it2 = _transfer2;
                it1.setAddress(undefined);
                it2.setAddress(undefined);

              case 37:
                // compare transfer equality
                (0, _assert["default"])(_index.GenUtils.equals(_transfer2.toJson(), _transfer.toJson()));

              case 38:
                _i3++;
                _context9.next = 14;
                break;

              case 41:
                _i2++;
                _context9.next = 8;
                break;

              case 44:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee9);
      }));

      function _testTransfersEqualOnChain(_x17, _x18) {
        return _testTransfersEqualOnChain2.apply(this, arguments);
      }

      return _testTransfersEqualOnChain;
    }()
  }, {
    key: "_testOutputWalletsEqualOnChain",
    value: function () {
      var _testOutputWalletsEqualOnChain2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee10(outputs1, outputs2) {
        var txsOutputs1, txsOutputs2, lastHeight, lastTx1, lastTx2, i, output1, output2, txOutputs1, txOutputs2, _i4, _Object$keys2, txHash, _txOutputs, _txOutputs2, _i5, _output, _output2;

        return _regenerator["default"].wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                _assert["default"].equal(outputs2.length, outputs1.length); // test and collect outputs per transaction


                txsOutputs1 = {};
                txsOutputs2 = {};
                lastHeight = undefined;
                lastTx1 = undefined;
                lastTx2 = undefined;

                for (i = 0; i < outputs1.length; i++) {
                  output1 = outputs1[i];
                  output2 = outputs2[i]; // outputs must have same height even if they don't belong to same tx (because tx ordering within blocks is not currently provided by wallet2)

                  _assert["default"].equal(output2.getTx().getHeight(), output1.getTx().getHeight()); // outputs must be in ascending order by height


                  if (lastHeight === undefined) lastHeight = output1.getTx().getHeight();else (0, _assert["default"])(lastHeight <= output1.getTx().getHeight()); // outputs must be consecutive per transaction

                  if (lastTx1 !== output1.getTx()) {
                    (0, _assert["default"])(!txsOutputs1[output1.getTx().getHash()]); // cannot be seen before

                    lastTx1 = output1.getTx();
                  }

                  if (lastTx2 !== output2.getTx()) {
                    (0, _assert["default"])(!txsOutputs2[output2.getTx().getHash()]); // cannot be seen before

                    lastTx2 = output2.getTx();
                  } // collect tx1 output


                  txOutputs1 = txsOutputs1[output1.getTx().getHash()];

                  if (txOutputs1 === undefined) {
                    txOutputs1 = [];
                    txsOutputs1[output1.getTx().getHash()] = txOutputs1;
                  }

                  txOutputs1.push(output1); // collect tx2 output

                  txOutputs2 = txsOutputs2[output2.getTx().getHash()];

                  if (txOutputs2 === undefined) {
                    txOutputs2 = [];
                    txsOutputs2[output2.getTx().getHash()] = txOutputs2;
                  }

                  txOutputs2.push(output2);
                } // compare collected outputs per tx for equality


                for (_i4 = 0, _Object$keys2 = Object.keys(txsOutputs1); _i4 < _Object$keys2.length; _i4++) {
                  txHash = _Object$keys2[_i4];
                  _txOutputs = txsOutputs1[txHash];
                  _txOutputs2 = txsOutputs2[txHash];

                  _assert["default"].equal(_txOutputs2.length, _txOutputs.length); // normalize and compare outputs


                  for (_i5 = 0; _i5 < _txOutputs.length; _i5++) {
                    _output = _txOutputs[_i5];
                    _output2 = _txOutputs2[_i5];

                    _assert["default"].equal(_output2.getTx().getHash(), _output.getTx().getHash());

                    (0, _assert["default"])(_index.GenUtils.equals(_output2.toJson(), _output.toJson()));
                  }
                }

              case 8:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee10);
      }));

      function _testOutputWalletsEqualOnChain(_x19, _x20) {
        return _testOutputWalletsEqualOnChain2.apply(this, arguments);
      }

      return _testOutputWalletsEqualOnChain;
    }()
  }]);
  return WalletEqualityUtils;
}();

var _default = WalletEqualityUtils;
exports["default"] = _default;