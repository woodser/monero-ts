"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _typeof = require("@babel/runtime/helpers/typeof");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assert = _interopRequireDefault(require("assert"));

var _TestUtils = _interopRequireDefault(require("./utils/TestUtils.js"));

var monerojs = _interopRequireWildcard(require("../../index"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * Test the sample code in README.md.
 */
var TestSampleCode = /*#__PURE__*/function () {
  function TestSampleCode() {
    (0, _classCallCheck2["default"])(this, TestSampleCode);
  }

  (0, _createClass2["default"])(TestSampleCode, [{
    key: "runTests",
    value: function runTests() {
      describe("Test sample code", function () {
        var that = this; // Unnecessary? That is never used in the following code

        var wallet; // initialize wallet

        before( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
          var walletRpc, fs;
          return _regenerator["default"].wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _context.prev = 0;

                  // all wallets need to wait for txs to confirm to reliably sync
                  _TestUtils["default"].WALLET_TX_TRACKER.reset(); // create rpc test wallet


                  _context.next = 4;
                  return _TestUtils["default"].getWalletRpc();

                case 4:
                  walletRpc = _context.sent;
                  _context.next = 7;
                  return walletRpc.close();

                case 7:
                  // create directory for test wallets if it doesn't exist
                  fs = _TestUtils["default"].getDefaultFs();

                  if (!fs.existsSync(_TestUtils["default"].TEST_WALLETS_DIR)) {
                    if (!fs.existsSync(process.cwd())) fs.mkdirSync(process.cwd(), {
                      recursive: true
                    }); // create current process directory for relative paths which does not exist in memory fs

                    fs.mkdirSync(_TestUtils["default"].TEST_WALLETS_DIR);
                  } // create full test wallet


                  _context.next = 11;
                  return _TestUtils["default"].getWalletFull();

                case 11:
                  wallet = _context.sent;
                  _context.next = 19;
                  break;

                case 14:
                  _context.prev = 14;
                  _context.t0 = _context["catch"](0);
                  console.error("Error before tests: ");
                  console.error(_context.t0);
                  throw _context.t0;

                case 19:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, null, [[0, 14]]);
        })));
        after( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
          return _regenerator["default"].wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  if (!wallet) {
                    _context2.next = 3;
                    break;
                  }

                  _context2.next = 3;
                  return wallet.close(true);

                case 3:
                case "end":
                  return _context2.stop();
              }
            }
          }, _callee2);
        })));
        it("Sample code demonstration", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5() {
          var blahWalletFull, daemon, height, feeEstimate, txsInPool, walletRpc, primaryAddress, balance, txs, walletFull, fundsReceived, createdTx, fee;
          return _regenerator["default"].wrap(function _callee5$(_context5) {
            while (1) {
              switch (_context5.prev = _context5.next) {
                case 0:
                  console.log("Test * as monerojs import");
                  _context5.next = 3;
                  return monerojs.createWalletFull({
                    path: "./test_wallets/" + monerojs.GenUtils.getUUID(),
                    // *** CHANGE README TO "sample_wallet_full"
                    password: "supersecretpassword123",
                    networkType: "testnet",
                    serverUri: "http://localhost:28081",
                    serverUsername: "superuser",
                    serverPassword: "abctesting123",
                    mnemonic: _TestUtils["default"].MNEMONIC,
                    // *** REPLACE README WITH MNEMONIC ***
                    restoreHeight: _TestUtils["default"].FIRST_RECEIVE_HEIGHT,
                    // *** REPLACE README WITH FIRST RECEIVE HEIGHT ***
                    fs: _TestUtils["default"].getDefaultFs(),
                    proxyToWorker: _TestUtils["default"].PROXY_TO_WORKER
                  });

                case 3:
                  blahWalletFull = _context5.sent;
                  console.log("monerojs.createWalletFull: " + blahWalletFull.toString()); // import library
                  //const monerojs = require("../../index");  // *** CHANGE README TO "monero-javascript" ***
                  // connect to daemon

                  _context5.next = 7;
                  return (0, monerojs.connectToDaemonRpc)({
                    uri: "http://localhost:28081",
                    proxyToWorker: _TestUtils["default"].PROXY_TO_WORKER
                  });

                case 7:
                  daemon = _context5.sent;
                  _context5.next = 10;
                  return daemon.getHeight();

                case 10:
                  height = _context5.sent;
                  _context5.next = 13;
                  return daemon.getFeeEstimate();

                case 13:
                  feeEstimate = _context5.sent;
                  _context5.next = 16;
                  return daemon.getTxPool();

                case 16:
                  txsInPool = _context5.sent;
                  _context5.next = 19;
                  return (0, monerojs.connectToWalletRpc)({
                    uri: "http://localhost:28084",
                    username: "rpc_user",
                    password: "abc123"
                  });

                case 19:
                  walletRpc = _context5.sent;
                  _context5.next = 22;
                  return walletRpc.openWallet("test_wallet_1", "supersecretpassword123");

                case 22:
                  _context5.next = 24;
                  return walletRpc.getPrimaryAddress();

                case 24:
                  primaryAddress = _context5.sent;
                  _context5.next = 27;
                  return walletRpc.getBalance();

                case 27:
                  balance = _context5.sent;
                  _context5.next = 30;
                  return walletRpc.getTxs();

                case 30:
                  txs = _context5.sent;
                  _context5.next = 33;
                  return (0, monerojs.createWalletFull)({
                    path: "./test_wallets/" + monerojs.GenUtils.getUUID(),
                    // *** CHANGE README TO "sample_wallet_full"
                    password: "supersecretpassword123",
                    networkType: "testnet",
                    serverUri: "http://localhost:28081",
                    serverUsername: "superuser",
                    serverPassword: "abctesting123",
                    mnemonic: _TestUtils["default"].MNEMONIC,
                    // *** REPLACE README WITH MNEMONIC ***
                    restoreHeight: _TestUtils["default"].FIRST_RECEIVE_HEIGHT,
                    // *** REPLACE README WITH FIRST RECEIVE HEIGHT ***
                    fs: _TestUtils["default"].getDefaultFs(),
                    proxyToWorker: _TestUtils["default"].PROXY_TO_WORKER
                  });

                case 33:
                  walletFull = _context5.sent;
                  _context5.next = 36;
                  return walletFull.sync(new ( /*#__PURE__*/function (_MoneroWalletListener) {
                    (0, _inherits2["default"])(_class, _MoneroWalletListener);

                    var _super = _createSuper(_class);

                    function _class() {
                      (0, _classCallCheck2["default"])(this, _class);
                      return _super.apply(this, arguments);
                    }

                    (0, _createClass2["default"])(_class, [{
                      key: "onSyncProgress",
                      value: function () {
                        var _onSyncProgress = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(height, startHeight, endHeight, percentDone, message) {
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

                        function onSyncProgress(_x, _x2, _x3, _x4, _x5) {
                          return _onSyncProgress.apply(this, arguments);
                        }

                        return onSyncProgress;
                      }()
                    }]);
                    return _class;
                  }(monerojs.MoneroWalletListener))());

                case 36:
                  _context5.next = 38;
                  return walletFull.startSyncing(5000);

                case 38:
                  // receive notifications when funds are received, confirmed, and unlocked
                  fundsReceived = false;
                  _context5.next = 41;
                  return walletFull.addListener(new ( /*#__PURE__*/function (_MoneroWalletListener2) {
                    (0, _inherits2["default"])(_class2, _MoneroWalletListener2);

                    var _super2 = _createSuper(_class2);

                    function _class2() {
                      (0, _classCallCheck2["default"])(this, _class2);
                      return _super2.apply(this, arguments);
                    }

                    (0, _createClass2["default"])(_class2, [{
                      key: "onOutputReceived",
                      value: function () {
                        var _onOutputReceived = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(output) {
                          var amount, txHash, isConfirmed, isLocked;
                          return _regenerator["default"].wrap(function _callee4$(_context4) {
                            while (1) {
                              switch (_context4.prev = _context4.next) {
                                case 0:
                                  amount = output.getAmount();
                                  txHash = output.getTx().getHash(); //String?

                                  isConfirmed = output.getTx().isConfirmed();
                                  isLocked = output.getTx().isLocked();
                                  fundsReceived = true;

                                case 5:
                                case "end":
                                  return _context4.stop();
                              }
                            }
                          }, _callee4);
                        }));

                        function onOutputReceived(_x6) {
                          return _onOutputReceived.apply(this, arguments);
                        }

                        return onOutputReceived;
                      }()
                    }]);
                    return _class2;
                  }(monerojs.MoneroWalletListener))());

                case 41:
                  _context5.next = 43;
                  return _TestUtils["default"].WALLET_TX_TRACKER.waitForWalletTxsToClearPool(walletRpc);

                case 43:
                  _context5.t0 = walletRpc;
                  _context5.next = 46;
                  return walletFull.getAddress(1, 0);

                case 46:
                  _context5.t1 = _context5.sent;
                  _context5.t2 = {
                    accountIndex: 0,
                    address: _context5.t1,
                    amount: "250000000000",
                    relay: false
                  };
                  _context5.next = 50;
                  return _context5.t0.createTx.call(_context5.t0, _context5.t2);

                case 50:
                  createdTx = _context5.sent;
                  fee = createdTx.getFee(); // "Are you sure you want to send... ?"

                  _context5.next = 54;
                  return walletRpc.relayTx(createdTx);

                case 54:
                  _context5.next = 56;
                  return new Promise(function (resolve) {
                    setTimeout(resolve, 15000);
                  });

                case 56:
                  (0, _assert["default"])(fundsReceived); // save and close WebAssembly wallet

                  _context5.next = 59;
                  return walletFull.close(true);

                case 59:
                case "end":
                  return _context5.stop();
              }
            }
          }, _callee5);
        })));
        it("Connection manager demonstration", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7() {
          var connectionManager, bestConnection, connections;
          return _regenerator["default"].wrap(function _callee7$(_context7) {
            while (1) {
              switch (_context7.prev = _context7.next) {
                case 0:
                  // imports
                  //const monerojs = require("../../index");    // *** CHANGE README TO "monero-javascript" ***
                  //const MoneroRpcConnection = MoneroRpcConnection;
                  //const MoneroConnectionManager = MoneroConnectionManager;
                  //const MoneroConnectionManagerListener = MoneroConnectionManagerListener;
                  // create connection manager
                  connectionManager = new monerojs.MoneroConnectionManager(); // add managed connections with priorities

                  connectionManager.addConnection(new monerojs.MoneroRpcConnection({
                    uri: "http://localhost:38081",
                    proxyToWorker: _TestUtils["default"].PROXY_TO_WORKER
                  }).setPriority(1)); // use localhost as first priority

                  connectionManager.addConnection(new monerojs.MoneroRpcConnection({
                    uri: "http://example.com",
                    proxyToWorker: _TestUtils["default"].PROXY_TO_WORKER
                  })); // default priority is prioritized last
                  // set current connection

                  connectionManager.setConnection(new monerojs.MoneroRpcConnection({
                    uri: "http://foo.bar",
                    username: "admin",
                    password: "password",
                    proxyToWorker: _TestUtils["default"].PROXY_TO_WORKER
                  })); // connection is added if new
                  // check connection status

                  _context7.next = 6;
                  return connectionManager.checkConnection();

                case 6:
                  // receive notifications of any changes to current connection
                  connectionManager.addListener(new ( /*#__PURE__*/function (_MoneroConnectionMana) {
                    (0, _inherits2["default"])(_class3, _MoneroConnectionMana);

                    var _super3 = _createSuper(_class3);

                    function _class3() {
                      (0, _classCallCheck2["default"])(this, _class3);
                      return _super3.apply(this, arguments);
                    }

                    (0, _createClass2["default"])(_class3, [{
                      key: "onConnectionChanged",
                      value: function () {
                        var _onConnectionChanged = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6(connection) {
                          return _regenerator["default"].wrap(function _callee6$(_context6) {
                            while (1) {
                              switch (_context6.prev = _context6.next) {
                                case 0:
                                  console.log("Connection changed to: " + connection);

                                case 1:
                                case "end":
                                  return _context6.stop();
                              }
                            }
                          }, _callee6);
                        }));

                        function onConnectionChanged(_x7) {
                          return _onConnectionChanged.apply(this, arguments);
                        }

                        return onConnectionChanged;
                      }()
                    }]);
                    return _class3;
                  }(monerojs.MoneroConnectionManagerListener))()); // check connection status every 10 seconds

                  _context7.next = 9;
                  return connectionManager.startCheckingConnection(10000);

                case 9:
                  // automatically switch to best available connection if disconnected
                  connectionManager.setAutoSwitch(true); // get best available connection in order of priority then response time

                  _context7.next = 12;
                  return connectionManager.getBestAvailableConnection();

                case 12:
                  bestConnection = _context7.sent;
                  _context7.next = 15;
                  return connectionManager.checkConnections();

                case 15:
                  // get connections in order of current connection, online status from last check, priority, and name
                  connections = connectionManager.getConnections(); // clear connection manager

                  connectionManager.clear();

                case 17:
                case "end":
                  return _context7.stop();
              }
            }
          }, _callee7);
        })));
        it("Test developer guide transaction queries", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee8() {
          var tx, txs, _iterator, _step, _tx, _iterator2, _step2, _tx2, found, _iterator4, _step4, transfer, _iterator3, _step3, _tx3, _found, _iterator5, _step5, output;

          return _regenerator["default"].wrap(function _callee8$(_context8) {
            while (1) {
              switch (_context8.prev = _context8.next) {
                case 0:
                  _context8.t0 = wallet;
                  _context8.next = 3;
                  return wallet.getTxs();

                case 3:
                  _context8.t1 = _context8.sent[0].getHash();
                  _context8.next = 6;
                  return _context8.t0.getTx.call(_context8.t0, _context8.t1);

                case 6:
                  tx = _context8.sent;
                  _context8.next = 9;
                  return wallet.getTxs({
                    isConfirmed: false
                  });

                case 9:
                  txs = _context8.sent;
                  _iterator = _createForOfIteratorHelper(txs);

                  try {
                    for (_iterator.s(); !(_step = _iterator.n()).done;) {
                      _tx = _step.value;
                      (0, _assert["default"])(!_tx.isConfirmed());
                    } // get transactions since height 582106 with incoming transfers to
                    // account 0, subaddress 0

                  } catch (err) {
                    _iterator.e(err);
                  } finally {
                    _iterator.f();
                  }

                  _context8.next = 14;
                  return wallet.getTxs({
                    minHeight: 582106,
                    transferQuery: {
                      isIncoming: true,
                      accountIndex: 0,
                      subaddressIndex: 1
                    }
                  });

                case 14:
                  txs = _context8.sent;
                  _iterator2 = _createForOfIteratorHelper(txs);
                  _context8.prev = 16;

                  _iterator2.s();

                case 18:
                  if ((_step2 = _iterator2.n()).done) {
                    _context8.next = 44;
                    break;
                  }

                  _tx2 = _step2.value;
                  (0, _assert["default"])(_tx2.isConfirmed());
                  (0, _assert["default"])(_tx2.getHeight() >= 582106);
                  found = false;
                  _iterator4 = _createForOfIteratorHelper(_tx2.getTransfers());
                  _context8.prev = 24;

                  _iterator4.s();

                case 26:
                  if ((_step4 = _iterator4.n()).done) {
                    _context8.next = 33;
                    break;
                  }

                  transfer = _step4.value;

                  if (!(transfer.isIncoming() && transfer.getAccountIndex() === 0 && transfer.getSubaddressIndex() === 1)) {
                    _context8.next = 31;
                    break;
                  }

                  found = true;
                  return _context8.abrupt("break", 33);

                case 31:
                  _context8.next = 26;
                  break;

                case 33:
                  _context8.next = 38;
                  break;

                case 35:
                  _context8.prev = 35;
                  _context8.t2 = _context8["catch"](24);

                  _iterator4.e(_context8.t2);

                case 38:
                  _context8.prev = 38;

                  _iterator4.f();

                  return _context8.finish(38);

                case 41:
                  (0, _assert["default"])(found);

                case 42:
                  _context8.next = 18;
                  break;

                case 44:
                  _context8.next = 49;
                  break;

                case 46:
                  _context8.prev = 46;
                  _context8.t3 = _context8["catch"](16);

                  _iterator2.e(_context8.t3);

                case 49:
                  _context8.prev = 49;

                  _iterator2.f();

                  return _context8.finish(49);

                case 52:
                  _context8.next = 54;
                  return wallet.getTxs({
                    isLocked: false,
                    outputQuery: {
                      isSpent: false
                    }
                  });

                case 54:
                  txs = _context8.sent;
                  _iterator3 = _createForOfIteratorHelper(txs);
                  _context8.prev = 56;

                  _iterator3.s();

                case 58:
                  if ((_step3 = _iterator3.n()).done) {
                    _context8.next = 85;
                    break;
                  }

                  _tx3 = _step3.value;
                  (0, _assert["default"])(!_tx3.isLocked());
                  (0, _assert["default"])(_tx3.getOutputs().length > 0);
                  _found = false;
                  _iterator5 = _createForOfIteratorHelper(_tx3.getOutputs());
                  _context8.prev = 64;

                  _iterator5.s();

                case 66:
                  if ((_step5 = _iterator5.n()).done) {
                    _context8.next = 73;
                    break;
                  }

                  output = _step5.value;

                  if (output.isSpent()) {
                    _context8.next = 71;
                    break;
                  }

                  _found = true;
                  return _context8.abrupt("break", 73);

                case 71:
                  _context8.next = 66;
                  break;

                case 73:
                  _context8.next = 78;
                  break;

                case 75:
                  _context8.prev = 75;
                  _context8.t4 = _context8["catch"](64);

                  _iterator5.e(_context8.t4);

                case 78:
                  _context8.prev = 78;

                  _iterator5.f();

                  return _context8.finish(78);

                case 81:
                  if (!_found) {
                    console.log(_tx3.getOutputs());
                  }

                  (0, _assert["default"])(_found);

                case 83:
                  _context8.next = 58;
                  break;

                case 85:
                  _context8.next = 90;
                  break;

                case 87:
                  _context8.prev = 87;
                  _context8.t5 = _context8["catch"](56);

                  _iterator3.e(_context8.t5);

                case 90:
                  _context8.prev = 90;

                  _iterator3.f();

                  return _context8.finish(90);

                case 93:
                case "end":
                  return _context8.stop();
              }
            }
          }, _callee8, null, [[16, 46, 49, 52], [24, 35, 38, 41], [56, 87, 90, 93], [64, 75, 78, 81]]);
        })));
        it("Test developer guide transfer queries", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee9() {
          var transfers, _iterator6, _step6, transfer, _iterator7, _step7, _transfer, _iterator8, _step8, _transfer2;

          return _regenerator["default"].wrap(function _callee9$(_context9) {
            while (1) {
              switch (_context9.prev = _context9.next) {
                case 0:
                  _context9.next = 2;
                  return wallet.getTransfers();

                case 2:
                  transfers = _context9.sent;
                  _context9.next = 5;
                  return wallet.getTransfers({
                    isIncoming: true,
                    accountIndex: 0,
                    subaddressIndex: 1
                  });

                case 5:
                  transfers = _context9.sent;
                  _iterator6 = _createForOfIteratorHelper(transfers);

                  try {
                    for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
                      transfer = _step6.value;

                      _assert["default"].equal(transfer.isIncoming(), true);

                      _assert["default"].equal(transfer.getAccountIndex(), 0);

                      _assert["default"].equal(transfer.getSubaddressIndex(), 1);
                    } // get transfers in the tx pool

                  } catch (err) {
                    _iterator6.e(err);
                  } finally {
                    _iterator6.f();
                  }

                  _context9.next = 10;
                  return wallet.getTransfers({
                    txQuery: {
                      inTxPool: true
                    }
                  });

                case 10:
                  transfers = _context9.sent;
                  _iterator7 = _createForOfIteratorHelper(transfers);

                  try {
                    for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
                      _transfer = _step7.value;

                      _assert["default"].equal(_transfer.getTx().inTxPool(), true);
                    } // get confirmed outgoing transfers since a block height

                  } catch (err) {
                    _iterator7.e(err);
                  } finally {
                    _iterator7.f();
                  }

                  _context9.next = 15;
                  return wallet.getTransfers({
                    isOutgoing: true,
                    txQuery: {
                      isConfirmed: true,
                      minHeight: _TestUtils["default"].FIRST_RECEIVE_HEIGHT // *** REPLACE WITH NUMBER IN .MD FILE ***

                    }
                  });

                case 15:
                  transfers = _context9.sent;
                  (0, _assert["default"])(transfers.length > 0);
                  _iterator8 = _createForOfIteratorHelper(transfers);

                  try {
                    for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
                      _transfer2 = _step8.value;
                      (0, _assert["default"])(_transfer2.isOutgoing());
                      (0, _assert["default"])(_transfer2.getTx().isConfirmed());
                      (0, _assert["default"])(_transfer2.getTx().getHeight() >= _TestUtils["default"].FIRST_RECEIVE_HEIGHT);
                    }
                  } catch (err) {
                    _iterator8.e(err);
                  } finally {
                    _iterator8.f();
                  }

                case 19:
                case "end":
                  return _context9.stop();
              }
            }
          }, _callee9);
        })));
        it("Test developer guide output queries", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee10() {
          var outputs, _iterator9, _step9, output, amount, _iterator10, _step10, _output, _iterator11, _step11, _output2, keyImage;

          return _regenerator["default"].wrap(function _callee10$(_context10) {
            while (1) {
              switch (_context10.prev = _context10.next) {
                case 0:
                  _context10.next = 2;
                  return wallet.getOutputs();

                case 2:
                  outputs = _context10.sent;
                  (0, _assert["default"])(outputs.length > 0); // get outputs available to be spent

                  _context10.next = 6;
                  return wallet.getOutputs({
                    isSpent: false,
                    txQuery: {
                      isLocked: false
                    }
                  });

                case 6:
                  outputs = _context10.sent;
                  (0, _assert["default"])(outputs.length > 0);
                  _iterator9 = _createForOfIteratorHelper(outputs);

                  try {
                    for (_iterator9.s(); !(_step9 = _iterator9.n()).done;) {
                      output = _step9.value;
                      (0, _assert["default"])(!output.isSpent());
                      (0, _assert["default"])(!output.getTx().isLocked());
                    } // get outputs by amount

                  } catch (err) {
                    _iterator9.e(err);
                  } finally {
                    _iterator9.f();
                  }

                  amount = outputs[0].getAmount();
                  _context10.next = 13;
                  return wallet.getOutputs({
                    amount: amount.toString() // *** REPLACE WITH BigInteger IN .MD FILE ***

                  });

                case 13:
                  outputs = _context10.sent;
                  (0, _assert["default"])(outputs.length > 0);
                  _iterator10 = _createForOfIteratorHelper(outputs);

                  try {
                    for (_iterator10.s(); !(_step10 = _iterator10.n()).done;) {
                      _output = _step10.value;

                      _assert["default"].equal(_output.getAmount().toString(), amount.toString());
                    } // get outputs received to a specific subaddress

                  } catch (err) {
                    _iterator10.e(err);
                  } finally {
                    _iterator10.f();
                  }

                  _context10.next = 19;
                  return wallet.getOutputs({
                    accountIndex: 0,
                    subaddressIndex: 1
                  });

                case 19:
                  outputs = _context10.sent;
                  (0, _assert["default"])(outputs.length > 0);
                  _iterator11 = _createForOfIteratorHelper(outputs);

                  try {
                    for (_iterator11.s(); !(_step11 = _iterator11.n()).done;) {
                      _output2 = _step11.value;

                      _assert["default"].equal(_output2.getAccountIndex(), 0);

                      _assert["default"].equal(_output2.getSubaddressIndex(), 1);
                    } // get output by key image

                  } catch (err) {
                    _iterator11.e(err);
                  } finally {
                    _iterator11.f();
                  }

                  keyImage = outputs[0].getKeyImage().getHex();
                  _context10.next = 26;
                  return wallet.getOutputs({
                    keyImage: keyImage
                  });

                case 26:
                  outputs = _context10.sent;

                  _assert["default"].equal(outputs.length, 1);

                  _assert["default"].equal(outputs[0].getKeyImage().getHex(), keyImage);

                case 29:
                case "end":
                  return _context10.stop();
              }
            }
          }, _callee10);
        })));
        it("Test developer guide send funds", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee11() {
          var wallet, tx, fee, hash, _tx4, txs, _tx5, _txs, _txs2, _txs3;

          return _regenerator["default"].wrap(function _callee11$(_context11) {
            while (1) {
              switch (_context11.prev = _context11.next) {
                case 0:
                  _context11.next = 2;
                  return (0, monerojs.createWalletFull)({
                    password: "abctesting123",
                    networkType: "stagenet",
                    serverUri: "http://localhost:38081",
                    serverUsername: "superuser",
                    serverPassword: "abctesting123",
                    proxyToWorker: _TestUtils["default"].PROXY_TO_WORKER
                  });

                case 2:
                  wallet = _context11.sent;
                  _context11.prev = 3;
                  _context11.next = 6;
                  return wallet.createTx({
                    accountIndex: 0,
                    // source account to send funds from
                    address: "9tsUiG9bwcU7oTbAdBwBk2PzxFtysge5qcEsHEpetmEKgerHQa1fDqH7a4FiquZmms7yM22jdifVAD7jAb2e63GSJMuhY75",
                    amount: "1000000000000" // send 1 XMR (denominated in atomic units)

                  });

                case 6:
                  tx = _context11.sent;
                  // can confirm with the user
                  fee = tx.getFee(); // "Are you sure you want to send... ?"
                  // relay the transaction

                  _context11.next = 10;
                  return wallet.relayTx(tx);

                case 10:
                  hash = _context11.sent;
                  _context11.next = 16;
                  break;

                case 13:
                  _context11.prev = 13;
                  _context11.t0 = _context11["catch"](3);

                  _assert["default"].equal(_context11.t0.message, "not enough money");

                case 16:
                  _context11.prev = 16;
                  _context11.next = 19;
                  return wallet.createTx({
                    accountIndex: 0,
                    // source account to send funds from
                    address: "9tsUiG9bwcU7oTbAdBwBk2PzxFtysge5qcEsHEpetmEKgerHQa1fDqH7a4FiquZmms7yM22jdifVAD7jAb2e63GSJMuhY75",
                    amount: "1000000000000",
                    // send 1 XMR (denominated in atomic units)
                    relay: true // relay the transaction to the network

                  });

                case 19:
                  _tx4 = _context11.sent;
                  _context11.next = 25;
                  break;

                case 22:
                  _context11.prev = 22;
                  _context11.t1 = _context11["catch"](16);

                  _assert["default"].equal(_context11.t1.message, "not enough money");

                case 25:
                  _context11.prev = 25;
                  _context11.next = 28;
                  return wallet.createTxs({
                    accountIndex: 0,
                    // source account to send funds from
                    subaddressIndex: 1,
                    // source subaddress to send funds from
                    destinations: [{
                      address: "9tsUiG9bwcU7oTbAdBwBk2PzxFtysge5qcEsHEpetmEKgerHQa1fDqH7a4FiquZmms7yM22jdifVAD7jAb2e63GSJMuhY75",
                      amount: "500000000000" // send 0.5 XMR (denominated in atomic units)

                    }, {
                      address: "9y3bAgpF9iajSsNa7t4FN7Zh73MadCL4oMDTcD8SGzbxBGnkYhGyC67AD4pVkvaYw1XL97uwDYuFGf9hi1KEVgZpQtPWcZm",
                      amount: "500000000000" // send 0.5 XMR (denominated in atomic units)

                    }],
                    priority: monerojs.MoneroTxPriority.ELEVATED,
                    relay: true // relay the transaction to the network

                  });

                case 28:
                  txs = _context11.sent;
                  _context11.next = 34;
                  break;

                case 31:
                  _context11.prev = 31;
                  _context11.t2 = _context11["catch"](25);

                  _assert["default"].equal(_context11.t2.message, "not enough money");

                case 34:
                  _context11.prev = 34;
                  _context11.next = 37;
                  return wallet.sweepOutput({
                    address: "55bcxMRhBWea6xxsot8moF1rdPprjJR2x4mfnNnTGgBJFgXa4gWXmWAYdUBKiRcJxy9AUAGJEg28DejvWdJU2VgUDrUvCHG",
                    keyImage: "b7afd6afbb1615c98b1c0350b81c98a77d6d4fc0ab92020d25fd76aca0914f1e",
                    relay: true
                  });

                case 37:
                  _tx5 = _context11.sent;
                  _context11.next = 43;
                  break;

                case 40:
                  _context11.prev = 40;
                  _context11.t3 = _context11["catch"](34);

                  _assert["default"].equal(_context11.t3.message, "No outputs found");

                case 43:
                  _context11.prev = 43;
                  _context11.next = 46;
                  return wallet.sweepUnlocked({
                    address: "55bcxMRhBWea6xxsot8moF1rdPprjJR2x4mfnNnTGgBJFgXa4gWXmWAYdUBKiRcJxy9AUAGJEg28DejvWdJU2VgUDrUvCHG",
                    relay: true
                  });

                case 46:
                  _txs = _context11.sent;
                  _context11.next = 52;
                  break;

                case 49:
                  _context11.prev = 49;
                  _context11.t4 = _context11["catch"](43);

                  _assert["default"].equal(_context11.t4.message, "No unlocked balance in the specified account");

                case 52:
                  _context11.prev = 52;
                  _context11.next = 55;
                  return wallet.sweepUnlocked({
                    accountIndex: 0,
                    address: "9tsUiG9bwcU7oTbAdBwBk2PzxFtysge5qcEsHEpetmEKgerHQa1fDqH7a4FiquZmms7yM22jdifVAD7jAb2e63GSJMuhY75",
                    relay: true
                  });

                case 55:
                  _txs2 = _context11.sent;
                  _context11.next = 61;
                  break;

                case 58:
                  _context11.prev = 58;
                  _context11.t5 = _context11["catch"](52);

                  _assert["default"].equal(_context11.t5.message, "No unlocked balance in the specified account");

                case 61:
                  _context11.prev = 61;
                  _context11.next = 64;
                  return wallet.sweepUnlocked({
                    accountIndex: 0,
                    subaddressIndex: 0,
                    address: "9tsUiG9bwcU7oTbAdBwBk2PzxFtysge5qcEsHEpetmEKgerHQa1fDqH7a4FiquZmms7yM22jdifVAD7jAb2e63GSJMuhY75",
                    relay: true
                  });

                case 64:
                  _txs3 = _context11.sent;
                  _context11.next = 70;
                  break;

                case 67:
                  _context11.prev = 67;
                  _context11.t6 = _context11["catch"](61);

                  _assert["default"].equal(_context11.t6.message, "No unlocked balance in the specified account");

                case 70:
                case "end":
                  return _context11.stop();
              }
            }
          }, _callee11, null, [[3, 13], [16, 22], [25, 31], [34, 40], [43, 49], [52, 58], [61, 67]]);
        })));
      });
    }
  }]);
  return TestSampleCode;
}();

module.exports = TestSampleCode;