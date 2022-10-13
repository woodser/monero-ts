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

var _TestUtils = _interopRequireDefault(require("./utils/TestUtils"));

var _index = require("../../index");

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

// context for testing binary blocks
// TODO: binary blocks have inconsistent client-side pruning
// TODO: get_blocks_by_height.bin does not return output indices (#5127)
var BINARY_BLOCK_CTX = {
  hasHex: false,
  headerIsFull: false,
  hasTxs: true,
  ctx: {
    isPruned: false,
    isConfirmed: true,
    fromGetTxPool: false,
    hasOutputIndices: false,
    fromBinaryBlock: true
  }
};
/**
 * Tests a Monero daemon.
 */

var TestMoneroDaemonRpc = /*#__PURE__*/function () {
  function TestMoneroDaemonRpc(testConfig) {
    (0, _classCallCheck2["default"])(this, TestMoneroDaemonRpc);
    this.testConfig = testConfig;

    _TestUtils["default"].WALLET_TX_TRACKER.reset(); // all wallets need to wait for txs to confirm to reliably sync

  }
  /**
   * Run all tests.
   */


  (0, _createClass2["default"])(TestMoneroDaemonRpc, [{
    key: "runTests",
    value: function runTests() {
      var that = this;
      var testConfig = this.testConfig;
      describe("TEST MONERO DAEMON RPC", function () {
        // initialize wallet before all tests
        before( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
          return _regenerator["default"].wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _context.prev = 0;
                  _context.next = 3;
                  return _TestUtils["default"].getWalletRpc();

                case 3:
                  that.wallet = _context.sent;
                  _context.next = 6;
                  return _TestUtils["default"].getDaemonRpc();

                case 6:
                  that.daemon = _context.sent;

                  _TestUtils["default"].WALLET_TX_TRACKER.reset(); // all wallets need to wait for txs to confirm to reliably sync


                  _context.next = 15;
                  break;

                case 10:
                  _context.prev = 10;
                  _context.t0 = _context["catch"](0);
                  console.error("Error before tests: ");
                  console.error(_context.t0);
                  throw _context.t0;

                case 15:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, null, [[0, 10]]);
        }))); // -------------------------- TEST NON RELAYS ---------------------------

        if (testConfig.testNonRelays && !_index.GenUtils.isBrowser()) it("Can start and stop a daemon process", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
          var cmd, daemon, connection, info;
          return _regenerator["default"].wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  // create command to start monerod process
                  cmd = [_TestUtils["default"].DAEMON_LOCAL_PATH, "--" + MoneroNetworkType.toString(_TestUtils["default"].NETWORK_TYPE).toLowerCase(), "--no-igd", "--hide-my-port", "--data-dir", _TestUtils["default"].MONERO_BINS_DIR + "/node1", "--p2p-bind-port", "58080", "--rpc-bind-port", "58081", "--rpc-login", "superuser:abctesting123", "--zmq-rpc-bind-port", "58082"]; // start monerod process from command

                  _context2.next = 3;
                  return connectToDaemonRpc(cmd);

                case 3:
                  daemon = _context2.sent;
                  _context2.next = 6;
                  return daemon.getRpcConnection();

                case 6:
                  connection = _context2.sent;

                  _assert["default"].equal("http://127.0.0.1:58081", connection.getUri());

                  _assert["default"].equal("superuser", connection.getUsername());

                  _assert["default"].equal("abctesting123", connection.getPassword());

                  _context2.t0 = _assert["default"];
                  _context2.next = 13;
                  return daemon.getHeight();

                case 13:
                  _context2.t1 = _context2.sent;
                  _context2.t2 = _context2.t1 > 0;
                  (0, _context2.t0)(_context2.t2);
                  _context2.next = 18;
                  return daemon.getInfo();

                case 18:
                  info = _context2.sent;
                  testInfo(info); // stop daemon

                  _context2.next = 22;
                  return daemon.stopProcess();

                case 22:
                case "end":
                  return _context2.stop();
              }
            }
          }, _callee2);
        })));
        if (testConfig.testNonRelays) it("Can get the daemon's version", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3() {
          var version;
          return _regenerator["default"].wrap(function _callee3$(_context3) {
            while (1) {
              switch (_context3.prev = _context3.next) {
                case 0:
                  _context3.next = 2;
                  return that.daemon.getVersion();

                case 2:
                  version = _context3.sent;
                  (0, _assert["default"])(version.getNumber() > 0);

                  _assert["default"].equal((0, _typeof2["default"])(version.isRelease()), "boolean");

                case 5:
                case "end":
                  return _context3.stop();
              }
            }
          }, _callee3);
        })));
        if (testConfig.testNonRelays) it("Can indicate if it's trusted", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4() {
          var isTrusted;
          return _regenerator["default"].wrap(function _callee4$(_context4) {
            while (1) {
              switch (_context4.prev = _context4.next) {
                case 0:
                  _context4.next = 2;
                  return that.daemon.isTrusted();

                case 2:
                  isTrusted = _context4.sent;

                  _assert["default"].equal((0, _typeof2["default"])(isTrusted), "boolean");

                case 4:
                case "end":
                  return _context4.stop();
              }
            }
          }, _callee4);
        })));
        if (testConfig.testNonRelays) it("Can get the blockchain height", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5() {
          var height;
          return _regenerator["default"].wrap(function _callee5$(_context5) {
            while (1) {
              switch (_context5.prev = _context5.next) {
                case 0:
                  _context5.next = 2;
                  return that.daemon.getHeight();

                case 2:
                  height = _context5.sent;
                  (0, _assert["default"])(height, "Height must be initialized");
                  (0, _assert["default"])(height > 0, "Height must be greater than 0");

                case 5:
                case "end":
                  return _context5.stop();
              }
            }
          }, _callee5);
        })));
        if (testConfig.testNonRelays) it("Can get a block hash by height", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6() {
          var lastHeader, hash;
          return _regenerator["default"].wrap(function _callee6$(_context6) {
            while (1) {
              switch (_context6.prev = _context6.next) {
                case 0:
                  _context6.next = 2;
                  return that.daemon.getLastBlockHeader();

                case 2:
                  lastHeader = _context6.sent;
                  _context6.next = 5;
                  return that.daemon.getBlockHash(lastHeader.getHeight());

                case 5:
                  hash = _context6.sent;
                  (0, _assert["default"])(hash);

                  _assert["default"].equal(hash.length, 64);

                case 8:
                case "end":
                  return _context6.stop();
              }
            }
          }, _callee6);
        })));
        if (testConfig.testNonRelays) it("Can get a block template", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7() {
          var template;
          return _regenerator["default"].wrap(function _callee7$(_context7) {
            while (1) {
              switch (_context7.prev = _context7.next) {
                case 0:
                  _context7.next = 2;
                  return that.daemon.getBlockTemplate(_TestUtils["default"].ADDRESS, 2);

                case 2:
                  template = _context7.sent;
                  testBlockTemplate(template);

                case 4:
                case "end":
                  return _context7.stop();
              }
            }
          }, _callee7);
        })));
        if (testConfig.testNonRelays) it("Can get the last block's header", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee8() {
          var lastHeader;
          return _regenerator["default"].wrap(function _callee8$(_context8) {
            while (1) {
              switch (_context8.prev = _context8.next) {
                case 0:
                  _context8.next = 2;
                  return that.daemon.getLastBlockHeader();

                case 2:
                  lastHeader = _context8.sent;
                  testBlockHeader(lastHeader, true);

                case 4:
                case "end":
                  return _context8.stop();
              }
            }
          }, _callee8);
        })));
        if (testConfig.testNonRelays) it("Can get a block header by hash", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee9() {
          var lastHeader, hash, header;
          return _regenerator["default"].wrap(function _callee9$(_context9) {
            while (1) {
              switch (_context9.prev = _context9.next) {
                case 0:
                  _context9.next = 2;
                  return that.daemon.getLastBlockHeader();

                case 2:
                  lastHeader = _context9.sent;
                  _context9.next = 5;
                  return that.daemon.getBlockHash(lastHeader.getHeight());

                case 5:
                  hash = _context9.sent;
                  _context9.next = 8;
                  return that.daemon.getBlockHeaderByHash(hash);

                case 8:
                  header = _context9.sent;
                  testBlockHeader(header, true);

                  _assert["default"].deepEqual(header, lastHeader); // retrieve by hash of previous to last block


                  _context9.next = 13;
                  return that.daemon.getBlockHash(lastHeader.getHeight() - 1);

                case 13:
                  hash = _context9.sent;
                  _context9.next = 16;
                  return that.daemon.getBlockHeaderByHash(hash);

                case 16:
                  header = _context9.sent;
                  testBlockHeader(header, true);

                  _assert["default"].equal(header.getHeight(), lastHeader.getHeight() - 1);

                case 19:
                case "end":
                  return _context9.stop();
              }
            }
          }, _callee9);
        })));
        if (testConfig.testNonRelays) it("Can get a block header by height", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee10() {
          var lastHeader, header;
          return _regenerator["default"].wrap(function _callee10$(_context10) {
            while (1) {
              switch (_context10.prev = _context10.next) {
                case 0:
                  _context10.next = 2;
                  return that.daemon.getLastBlockHeader();

                case 2:
                  lastHeader = _context10.sent;
                  _context10.next = 5;
                  return that.daemon.getBlockHeaderByHeight(lastHeader.getHeight());

                case 5:
                  header = _context10.sent;
                  testBlockHeader(header, true);

                  _assert["default"].deepEqual(header, lastHeader); // retrieve by height of previous to last block


                  _context10.next = 10;
                  return that.daemon.getBlockHeaderByHeight(lastHeader.getHeight() - 1);

                case 10:
                  header = _context10.sent;
                  testBlockHeader(header, true);

                  _assert["default"].equal(header.getHeight(), lastHeader.getHeight() - 1);

                case 13:
                case "end":
                  return _context10.stop();
              }
            }
          }, _callee10);
        }))); // TODO: test start with no end, vice versa, inclusivity

        if (testConfig.testNonRelays) it("Can get block headers by range", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee11() {
          var numBlocks, numBlocksAgo, currentHeight, startHeight, endHeight, headers, i, header;
          return _regenerator["default"].wrap(function _callee11$(_context11) {
            while (1) {
              switch (_context11.prev = _context11.next) {
                case 0:
                  // determine start and end height based on number of blocks and how many blocks ago
                  numBlocks = 100;
                  numBlocksAgo = 100;
                  _context11.next = 4;
                  return that.daemon.getHeight();

                case 4:
                  currentHeight = _context11.sent;
                  startHeight = currentHeight - numBlocksAgo;
                  endHeight = currentHeight - (numBlocksAgo - numBlocks) - 1; // fetch headers

                  _context11.next = 9;
                  return that.daemon.getBlockHeadersByRange(startHeight, endHeight);

                case 9:
                  headers = _context11.sent;

                  // test headers
                  _assert["default"].equal(headers.length, numBlocks);

                  for (i = 0; i < numBlocks; i++) {
                    header = headers[i];

                    _assert["default"].equal(header.getHeight(), startHeight + i);

                    testBlockHeader(header, true);
                  }

                case 12:
                case "end":
                  return _context11.stop();
              }
            }
          }, _callee11);
        })));
        if (testConfig.testNonRelays) it("Can get a block by hash", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee12() {
          var testBlockCtx, lastHeader, hash, block;
          return _regenerator["default"].wrap(function _callee12$(_context12) {
            while (1) {
              switch (_context12.prev = _context12.next) {
                case 0:
                  // context for testing blocks
                  testBlockCtx = {
                    hasHex: true,
                    headerIsFull: true,
                    hasTxs: false
                  }; // retrieve by hash of last block

                  _context12.next = 3;
                  return that.daemon.getLastBlockHeader();

                case 3:
                  lastHeader = _context12.sent;
                  _context12.next = 6;
                  return that.daemon.getBlockHash(lastHeader.getHeight());

                case 6:
                  hash = _context12.sent;
                  _context12.next = 9;
                  return that.daemon.getBlockByHash(hash);

                case 9:
                  block = _context12.sent;
                  testBlock(block, testBlockCtx);
                  _context12.t0 = _assert["default"];
                  _context12.t1 = block;
                  _context12.next = 15;
                  return that.daemon.getBlockByHeight(block.getHeight());

                case 15:
                  _context12.t2 = _context12.sent;

                  _context12.t0.deepEqual.call(_context12.t0, _context12.t1, _context12.t2);

                  (0, _assert["default"])(block.getTxs() === undefined); // retrieve by hash of previous to last block

                  _context12.next = 20;
                  return that.daemon.getBlockHash(lastHeader.getHeight() - 1);

                case 20:
                  hash = _context12.sent;
                  _context12.next = 23;
                  return that.daemon.getBlockByHash(hash);

                case 23:
                  block = _context12.sent;
                  testBlock(block, testBlockCtx);
                  _context12.t3 = _assert["default"];
                  _context12.t4 = block;
                  _context12.next = 29;
                  return that.daemon.getBlockByHeight(lastHeader.getHeight() - 1);

                case 29:
                  _context12.t5 = _context12.sent;

                  _context12.t3.deepEqual.call(_context12.t3, _context12.t4, _context12.t5);

                  (0, _assert["default"])(block.getTxs() === undefined);

                case 32:
                case "end":
                  return _context12.stop();
              }
            }
          }, _callee12);
        })));
        if (testConfig.testNonRelays) it("Can get blocks by hash which includes transactions (binary)", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee13() {
          return _regenerator["default"].wrap(function _callee13$(_context13) {
            while (1) {
              switch (_context13.prev = _context13.next) {
                case 0:
                  throw new Error("Not implemented");

                case 1:
                case "end":
                  return _context13.stop();
              }
            }
          }, _callee13);
        })));
        if (testConfig.testNonRelays) it("Can get a block by height", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee14() {
          var testBlockCtx, lastHeader, block;
          return _regenerator["default"].wrap(function _callee14$(_context14) {
            while (1) {
              switch (_context14.prev = _context14.next) {
                case 0:
                  // context for testing blocks
                  testBlockCtx = {
                    hasHex: true,
                    headerIsFull: true,
                    hasTxs: false
                  }; // retrieve by height of last block

                  _context14.next = 3;
                  return that.daemon.getLastBlockHeader();

                case 3:
                  lastHeader = _context14.sent;
                  _context14.next = 6;
                  return that.daemon.getBlockByHeight(lastHeader.getHeight());

                case 6:
                  block = _context14.sent;
                  testBlock(block, testBlockCtx);
                  _context14.t0 = _assert["default"];
                  _context14.t1 = block;
                  _context14.next = 12;
                  return that.daemon.getBlockByHeight(block.getHeight());

                case 12:
                  _context14.t2 = _context14.sent;

                  _context14.t0.deepEqual.call(_context14.t0, _context14.t1, _context14.t2);

                  _context14.next = 16;
                  return that.daemon.getBlockByHeight(lastHeader.getHeight() - 1);

                case 16:
                  block = _context14.sent;
                  testBlock(block, testBlockCtx);

                  _assert["default"].deepEqual(block.getHeight(), lastHeader.getHeight() - 1);

                case 19:
                case "end":
                  return _context14.stop();
              }
            }
          }, _callee14);
        })));
        if (testConfig.testNonRelays) it("Can get blocks by height which includes transactions (binary)", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee15() {
          var numBlocks, currentHeight, allHeights, i, heights, _i, blocks, txFound, _i2, block;

          return _regenerator["default"].wrap(function _callee15$(_context15) {
            while (1) {
              switch (_context15.prev = _context15.next) {
                case 0:
                  // set number of blocks to test
                  numBlocks = 200; // select random heights  // TODO: this is horribly inefficient way of computing last 100 blocks if not shuffling

                  _context15.next = 3;
                  return that.daemon.getHeight();

                case 3:
                  currentHeight = _context15.sent;
                  allHeights = [];

                  for (i = 0; i < currentHeight - 1; i++) {
                    allHeights.push(i);
                  } //GenUtils.shuffle(allHeights);


                  heights = [];

                  for (_i = allHeights.length - numBlocks; _i < allHeights.length; _i++) {
                    heights.push(allHeights[_i]);
                  } // fetch blocks


                  _context15.next = 10;
                  return that.daemon.getBlocksByHeight(heights);

                case 10:
                  blocks = _context15.sent;
                  // test blocks
                  txFound = false;

                  _assert["default"].equal(blocks.length, numBlocks);

                  for (_i2 = 0; _i2 < heights.length; _i2++) {
                    block = blocks[_i2];
                    if (block.getTxs().length) txFound = true;
                    testBlock(block, BINARY_BLOCK_CTX);

                    _assert["default"].equal(block.getHeight(), heights[_i2]);
                  }

                  (0, _assert["default"])(txFound, "No transactions found to test");

                case 15:
                case "end":
                  return _context15.stop();
              }
            }
          }, _callee15);
        })));
        if (testConfig.testNonRelays) it("Can get blocks by range in a single request", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee16() {
          var numBlocks, numBlocksAgo, height, startHeight, endHeight;
          return _regenerator["default"].wrap(function _callee16$(_context16) {
            while (1) {
              switch (_context16.prev = _context16.next) {
                case 0:
                  // get height range
                  numBlocks = 100;
                  numBlocksAgo = 190;
                  (0, _assert["default"])(numBlocks > 0);
                  (0, _assert["default"])(numBlocksAgo >= numBlocks);
                  _context16.next = 6;
                  return that.daemon.getHeight();

                case 6:
                  height = _context16.sent;
                  (0, _assert["default"])(height - numBlocksAgo + numBlocks - 1 < height);
                  startHeight = height - numBlocksAgo;
                  endHeight = height - numBlocksAgo + numBlocks - 1; // test known start and end heights

                  _context16.next = 12;
                  return testGetBlocksRange(startHeight, endHeight, height, false);

                case 12:
                  _context16.next = 14;
                  return testGetBlocksRange(undefined, numBlocks - 1, height, false);

                case 14:
                  _context16.next = 16;
                  return testGetBlocksRange(height - numBlocks - 1, undefined, height, false);

                case 16:
                case "end":
                  return _context16.stop();
              }
            }
          }, _callee16);
        }))); // Can get blocks by range using chunked requests

        if (testConfig.testNonRelays) it("Can get blocks by range using chunked requests", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee17() {
          var numBlocks, height, startHeight, endHeight;
          return _regenerator["default"].wrap(function _callee17$(_context17) {
            while (1) {
              switch (_context17.prev = _context17.next) {
                case 0:
                  _context17.t0 = Math;
                  _context17.next = 3;
                  return that.daemon.getHeight();

                case 3:
                  _context17.t1 = _context17.sent;
                  _context17.t2 = _context17.t1 - 2;
                  numBlocks = _context17.t0.min.call(_context17.t0, _context17.t2, 1440);
                  // test up to ~2 days of blocks
                  (0, _assert["default"])(numBlocks > 0);
                  _context17.next = 9;
                  return that.daemon.getHeight();

                case 9:
                  height = _context17.sent;
                  (0, _assert["default"])(height - numBlocks - 1 < height);
                  startHeight = height - numBlocks;
                  endHeight = height - 1; // test known start and end heights

                  _context17.next = 15;
                  return testGetBlocksRange(startHeight, endHeight, height, true);

                case 15:
                  _context17.next = 17;
                  return testGetBlocksRange(undefined, numBlocks - 1, height, true);

                case 17:
                  _context17.next = 19;
                  return testGetBlocksRange(endHeight - numBlocks - 1, undefined, height, true);

                case 19:
                case "end":
                  return _context17.stop();
              }
            }
          }, _callee17);
        })));

        function testGetBlocksRange(_x, _x2, _x3, _x4) {
          return _testGetBlocksRange.apply(this, arguments);
        }

        function _testGetBlocksRange() {
          _testGetBlocksRange = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee63(startHeight, endHeight, chainHeight, chunked) {
            var realStartHeight, realEndHeight, blocks, i;
            return _regenerator["default"].wrap(function _callee63$(_context63) {
              while (1) {
                switch (_context63.prev = _context63.next) {
                  case 0:
                    // fetch blocks by range
                    realStartHeight = startHeight === undefined ? 0 : startHeight;
                    realEndHeight = endHeight === undefined ? chainHeight - 1 : endHeight;

                    if (!chunked) {
                      _context63.next = 8;
                      break;
                    }

                    _context63.next = 5;
                    return that.daemon.getBlocksByRangeChunked(startHeight, endHeight);

                  case 5:
                    _context63.t0 = _context63.sent;
                    _context63.next = 11;
                    break;

                  case 8:
                    _context63.next = 10;
                    return that.daemon.getBlocksByRange(startHeight, endHeight);

                  case 10:
                    _context63.t0 = _context63.sent;

                  case 11:
                    blocks = _context63.t0;

                    _assert["default"].equal(blocks.length, realEndHeight - realStartHeight + 1); // test each block


                    for (i = 0; i < blocks.length; i++) {
                      _assert["default"].equal(blocks[i].getHeight(), realStartHeight + i);

                      testBlock(blocks[i], BINARY_BLOCK_CTX);
                    }

                  case 14:
                  case "end":
                    return _context63.stop();
                }
              }
            }, _callee63);
          }));
          return _testGetBlocksRange.apply(this, arguments);
        }

        if (testConfig.testNonRelays) it("Can get block hashes (binary)", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee18() {
          return _regenerator["default"].wrap(function _callee18$(_context18) {
            while (1) {
              switch (_context18.prev = _context18.next) {
                case 0:
                  throw new Error("Not implemented");

                case 1:
                case "end":
                  return _context18.stop();
              }
            }
          }, _callee18);
        })));
        if (testConfig.testNonRelays) it("Can get a transaction by hash with and without pruning", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee19() {
          var txHashes, _iterator, _step, txHash, tx, _iterator2, _step2, _txHash, _tx;

          return _regenerator["default"].wrap(function _callee19$(_context19) {
            while (1) {
              switch (_context19.prev = _context19.next) {
                case 0:
                  _context19.next = 2;
                  return getConfirmedTxHashes(that.daemon);

                case 2:
                  txHashes = _context19.sent;
                  // fetch each tx by hash without pruning
                  _iterator = _createForOfIteratorHelper(txHashes);
                  _context19.prev = 4;

                  _iterator.s();

                case 6:
                  if ((_step = _iterator.n()).done) {
                    _context19.next = 14;
                    break;
                  }

                  txHash = _step.value;
                  _context19.next = 10;
                  return that.daemon.getTx(txHash);

                case 10:
                  tx = _context19.sent;
                  testTx(tx, {
                    isPruned: false,
                    isConfirmed: true,
                    fromGetTxPool: false
                  });

                case 12:
                  _context19.next = 6;
                  break;

                case 14:
                  _context19.next = 19;
                  break;

                case 16:
                  _context19.prev = 16;
                  _context19.t0 = _context19["catch"](4);

                  _iterator.e(_context19.t0);

                case 19:
                  _context19.prev = 19;

                  _iterator.f();

                  return _context19.finish(19);

                case 22:
                  // fetch each tx by hash with pruning
                  _iterator2 = _createForOfIteratorHelper(txHashes);
                  _context19.prev = 23;

                  _iterator2.s();

                case 25:
                  if ((_step2 = _iterator2.n()).done) {
                    _context19.next = 33;
                    break;
                  }

                  _txHash = _step2.value;
                  _context19.next = 29;
                  return that.daemon.getTx(_txHash, true);

                case 29:
                  _tx = _context19.sent;
                  testTx(_tx, {
                    isPruned: true,
                    isConfirmed: true,
                    fromGetTxPool: false
                  });

                case 31:
                  _context19.next = 25;
                  break;

                case 33:
                  _context19.next = 38;
                  break;

                case 35:
                  _context19.prev = 35;
                  _context19.t1 = _context19["catch"](23);

                  _iterator2.e(_context19.t1);

                case 38:
                  _context19.prev = 38;

                  _iterator2.f();

                  return _context19.finish(38);

                case 41:
                  _context19.prev = 41;
                  _context19.next = 44;
                  return that.daemon.getTx("invalid tx hash");

                case 44:
                  throw new Error("fail");

                case 47:
                  _context19.prev = 47;
                  _context19.t2 = _context19["catch"](41);

                  _assert["default"].equal("Invalid transaction hash", _context19.t2.message);

                case 50:
                case "end":
                  return _context19.stop();
              }
            }
          }, _callee19, null, [[4, 16, 19, 22], [23, 35, 38, 41], [41, 47]]);
        })));
        if (testConfig.testNonRelays) it("Can get transactions by hashes with and without pruning", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee20() {
          var txHashes, txs, _iterator3, _step3, _tx2, _iterator4, _step4, _tx3, tx, numTxs;

          return _regenerator["default"].wrap(function _callee20$(_context20) {
            while (1) {
              switch (_context20.prev = _context20.next) {
                case 0:
                  _context20.next = 2;
                  return getConfirmedTxHashes(that.daemon);

                case 2:
                  txHashes = _context20.sent;
                  (0, _assert["default"])(txHashes.length > 0); // fetch txs by hash without pruning

                  _context20.next = 6;
                  return that.daemon.getTxs(txHashes);

                case 6:
                  txs = _context20.sent;

                  _assert["default"].equal(txs.length, txHashes.length);

                  _iterator3 = _createForOfIteratorHelper(txs);

                  try {
                    for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                      _tx2 = _step3.value;
                      testTx(_tx2, {
                        isPruned: false,
                        isConfirmed: true,
                        fromGetTxPool: false
                      });
                    } // fetch txs by hash with pruning

                  } catch (err) {
                    _iterator3.e(err);
                  } finally {
                    _iterator3.f();
                  }

                  _context20.next = 12;
                  return that.daemon.getTxs(txHashes, true);

                case 12:
                  txs = _context20.sent;

                  _assert["default"].equal(txs.length, txHashes.length);

                  _iterator4 = _createForOfIteratorHelper(txs);

                  try {
                    for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                      _tx3 = _step4.value;
                      testTx(_tx3, {
                        isPruned: true,
                        isConfirmed: true,
                        fromGetTxPool: false
                      });
                    } // fetch missing hash

                  } catch (err) {
                    _iterator4.e(err);
                  } finally {
                    _iterator4.f();
                  }

                  _context20.t0 = that.wallet;
                  _context20.next = 19;
                  return that.wallet.getPrimaryAddress();

                case 19:
                  _context20.t1 = _context20.sent;
                  _context20.t2 = _TestUtils["default"].MAX_FEE;
                  _context20.t3 = {
                    accountIndex: 0,
                    address: _context20.t1,
                    amount: _context20.t2
                  };
                  _context20.next = 24;
                  return _context20.t0.createTx.call(_context20.t0, _context20.t3);

                case 24:
                  tx = _context20.sent;
                  _context20.t4 = _assert["default"];
                  _context20.t5 = undefined;
                  _context20.next = 29;
                  return that.daemon.getTx(tx.getHash());

                case 29:
                  _context20.t6 = _context20.sent;

                  _context20.t4.equal.call(_context20.t4, _context20.t5, _context20.t6);

                  txHashes.push(tx.getHash());
                  numTxs = txs.length;
                  _context20.next = 35;
                  return that.daemon.getTxs(txHashes);

                case 35:
                  txs = _context20.sent;

                  _assert["default"].equal(numTxs, txs.length); // fetch invalid hash


                  txHashes.push("invalid tx hash");
                  _context20.prev = 38;
                  _context20.next = 41;
                  return that.daemon.getTxs(txHashes);

                case 41:
                  throw new Error("fail");

                case 44:
                  _context20.prev = 44;
                  _context20.t7 = _context20["catch"](38);

                  _assert["default"].equal("Invalid transaction hash", _context20.t7.message);

                case 47:
                case "end":
                  return _context20.stop();
              }
            }
          }, _callee20, null, [[38, 44]]);
        })));
        if (testConfig.testNonRelays) it("Can get transactions by hashes that are in the transaction pool", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee21() {
          var txHashes, i, tx, result, txs, _iterator5, _step5, _tx4;

          return _regenerator["default"].wrap(function _callee21$(_context21) {
            while (1) {
              switch (_context21.prev = _context21.next) {
                case 0:
                  _context21.next = 2;
                  return _TestUtils["default"].WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);

                case 2:
                  // wait for wallet's txs in the pool to clear to ensure reliable sync
                  // submit txs to the pool but don't relay
                  txHashes = [];
                  i = 1;

                case 4:
                  if (!(i < 3)) {
                    _context21.next = 17;
                    break;
                  }

                  _context21.next = 7;
                  return getUnrelayedTx(that.wallet, i);

                case 7:
                  tx = _context21.sent;
                  _context21.next = 10;
                  return that.daemon.submitTxHex(tx.getFullHex(), true);

                case 10:
                  result = _context21.sent;
                  testSubmitTxResultGood(result);

                  _assert["default"].equal(result.isRelayed(), false);

                  txHashes.push(tx.getHash());

                case 14:
                  i++;
                  _context21.next = 4;
                  break;

                case 17:
                  _context21.next = 19;
                  return that.daemon.getTxs(txHashes);

                case 19:
                  txs = _context21.sent;

                  // test fetched txs
                  _assert["default"].equal(txs.length, txHashes.length);

                  _iterator5 = _createForOfIteratorHelper(txs);

                  try {
                    for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
                      _tx4 = _step5.value;
                      testTx(_tx4, {
                        isConfirmed: false,
                        fromGetTxPool: false,
                        isPruned: false
                      });
                    } // clear txs from pool

                  } catch (err) {
                    _iterator5.e(err);
                  } finally {
                    _iterator5.f();
                  }

                  _context21.next = 25;
                  return that.daemon.flushTxPool(txHashes);

                case 25:
                  _context21.next = 27;
                  return that.wallet.sync();

                case 27:
                case "end":
                  return _context21.stop();
              }
            }
          }, _callee21);
        })));
        if (testConfig.testNonRelays) it("Can get a transaction hex by hash with and without pruning", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee22() {
          var txHashes, hexes, hexesPruned, _iterator6, _step6, txHash, i;

          return _regenerator["default"].wrap(function _callee22$(_context22) {
            while (1) {
              switch (_context22.prev = _context22.next) {
                case 0:
                  _context22.next = 2;
                  return getConfirmedTxHashes(that.daemon);

                case 2:
                  txHashes = _context22.sent;
                  // fetch each tx hex by hash with and without pruning
                  hexes = [];
                  hexesPruned = [];
                  _iterator6 = _createForOfIteratorHelper(txHashes);
                  _context22.prev = 6;

                  _iterator6.s();

                case 8:
                  if ((_step6 = _iterator6.n()).done) {
                    _context22.next = 22;
                    break;
                  }

                  txHash = _step6.value;
                  _context22.t0 = hexes;
                  _context22.next = 13;
                  return that.daemon.getTxHex(txHash);

                case 13:
                  _context22.t1 = _context22.sent;

                  _context22.t0.push.call(_context22.t0, _context22.t1);

                  _context22.t2 = hexesPruned;
                  _context22.next = 18;
                  return that.daemon.getTxHex(txHash, true);

                case 18:
                  _context22.t3 = _context22.sent;

                  _context22.t2.push.call(_context22.t2, _context22.t3);

                case 20:
                  _context22.next = 8;
                  break;

                case 22:
                  _context22.next = 27;
                  break;

                case 24:
                  _context22.prev = 24;
                  _context22.t4 = _context22["catch"](6);

                  _iterator6.e(_context22.t4);

                case 27:
                  _context22.prev = 27;

                  _iterator6.f();

                  return _context22.finish(27);

                case 30:
                  // test results
                  _assert["default"].equal(hexes.length, txHashes.length);

                  _assert["default"].equal(hexesPruned.length, txHashes.length);

                  for (i = 0; i < hexes.length; i++) {
                    _assert["default"].equal((0, _typeof2["default"])(hexes[i]), "string");

                    _assert["default"].equal((0, _typeof2["default"])(hexesPruned[i]), "string");

                    (0, _assert["default"])(hexesPruned[i].length > 0);
                    (0, _assert["default"])(hexes[i].length > hexesPruned[i].length); // pruned hex is shorter
                  } // fetch invalid hash


                  _context22.prev = 33;
                  _context22.next = 36;
                  return that.daemon.getTxHex("invalid tx hash");

                case 36:
                  throw new Error("fail");

                case 39:
                  _context22.prev = 39;
                  _context22.t5 = _context22["catch"](33);

                  _assert["default"].equal("Invalid transaction hash", _context22.t5.message);

                case 42:
                case "end":
                  return _context22.stop();
              }
            }
          }, _callee22, null, [[6, 24, 27, 30], [33, 39]]);
        })));
        if (testConfig.testNonRelays) it("Can get transaction hexes by hashes with and without pruning", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee23() {
          var txHashes, hexes, hexesPruned, i;
          return _regenerator["default"].wrap(function _callee23$(_context23) {
            while (1) {
              switch (_context23.prev = _context23.next) {
                case 0:
                  _context23.next = 2;
                  return getConfirmedTxHashes(that.daemon);

                case 2:
                  txHashes = _context23.sent;
                  _context23.next = 5;
                  return that.daemon.getTxHexes(txHashes);

                case 5:
                  hexes = _context23.sent;
                  _context23.next = 8;
                  return that.daemon.getTxHexes(txHashes, true);

                case 8:
                  hexesPruned = _context23.sent;

                  // test results
                  _assert["default"].equal(hexes.length, txHashes.length);

                  _assert["default"].equal(hexesPruned.length, txHashes.length);

                  for (i = 0; i < hexes.length; i++) {
                    _assert["default"].equal((0, _typeof2["default"])(hexes[i]), "string");

                    _assert["default"].equal((0, _typeof2["default"])(hexesPruned[i]), "string");

                    (0, _assert["default"])(hexesPruned[i].length > 0);
                    (0, _assert["default"])(hexes[i].length > hexesPruned[i].length); // pruned hex is shorter
                  } // fetch invalid hash


                  txHashes.push("invalid tx hash");
                  _context23.prev = 13;
                  _context23.next = 16;
                  return that.daemon.getTxHexes(txHashes);

                case 16:
                  throw new Error("fail");

                case 19:
                  _context23.prev = 19;
                  _context23.t0 = _context23["catch"](13);

                  _assert["default"].equal("Invalid transaction hash", _context23.t0.message);

                case 22:
                case "end":
                  return _context23.stop();
              }
            }
          }, _callee23, null, [[13, 19]]);
        })));
        if (testConfig.testNonRelays) it("Can get the miner transaction sum", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee24() {
          var sum;
          return _regenerator["default"].wrap(function _callee24$(_context24) {
            while (1) {
              switch (_context24.prev = _context24.next) {
                case 0:
                  _context24.t0 = that.daemon;
                  _context24.t1 = Math;
                  _context24.next = 4;
                  return that.daemon.getHeight();

                case 4:
                  _context24.t2 = _context24.sent;
                  _context24.t3 = _context24.t1.min.call(_context24.t1, 50000, _context24.t2);
                  _context24.next = 8;
                  return _context24.t0.getMinerTxSum.call(_context24.t0, 0, _context24.t3);

                case 8:
                  sum = _context24.sent;
                  testMinerTxSum(sum);

                case 10:
                case "end":
                  return _context24.stop();
              }
            }
          }, _callee24);
        })));
        if (testConfig.testNonRelays) it("Can get a fee estimate", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee25() {
          var fee;
          return _regenerator["default"].wrap(function _callee25$(_context25) {
            while (1) {
              switch (_context25.prev = _context25.next) {
                case 0:
                  _context25.next = 2;
                  return that.daemon.getFeeEstimate();

                case 2:
                  fee = _context25.sent;

                  _TestUtils["default"].testUnsignedBigInt(fee, true);

                case 4:
                case "end":
                  return _context25.stop();
              }
            }
          }, _callee25);
        })));
        if (testConfig.testNonRelays) it("Can get all transactions in the transaction pool", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee26() {
          var tx, result, txs, _iterator7, _step7, _tx5;

          return _regenerator["default"].wrap(function _callee26$(_context26) {
            while (1) {
              switch (_context26.prev = _context26.next) {
                case 0:
                  _context26.next = 2;
                  return _TestUtils["default"].WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);

                case 2:
                  _context26.next = 4;
                  return getUnrelayedTx(that.wallet, 0);

                case 4:
                  tx = _context26.sent;
                  _context26.next = 7;
                  return that.daemon.submitTxHex(tx.getFullHex(), true);

                case 7:
                  result = _context26.sent;
                  testSubmitTxResultGood(result);

                  _assert["default"].equal(result.isRelayed(), false); // fetch txs in pool


                  _context26.next = 12;
                  return that.daemon.getTxPool();

                case 12:
                  txs = _context26.sent;
                  // test txs
                  (0, _assert["default"])(Array.isArray(txs));
                  (0, _assert["default"])(txs.length > 0, "Test requires an unconfirmed tx in the tx pool");
                  _iterator7 = _createForOfIteratorHelper(txs);

                  try {
                    for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
                      _tx5 = _step7.value;
                      testTx(_tx5, {
                        isPruned: false,
                        isConfirmed: false,
                        fromGetTxPool: true
                      });
                    } // flush the tx from the pool, gg

                  } catch (err) {
                    _iterator7.e(err);
                  } finally {
                    _iterator7.f();
                  }

                  _context26.next = 19;
                  return that.daemon.flushTxPool(tx.getHash());

                case 19:
                  _context26.next = 21;
                  return that.wallet.sync();

                case 21:
                case "end":
                  return _context26.stop();
              }
            }
          }, _callee26);
        })));
        if (testConfig.testNonRelays) it("Can get hashes of transactions in the transaction pool (binary)", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee27() {
          return _regenerator["default"].wrap(function _callee27$(_context27) {
            while (1) {
              switch (_context27.prev = _context27.next) {
                case 0:
                  throw new Error("Not implemented");

                case 1:
                case "end":
                  return _context27.stop();
              }
            }
          }, _callee27);
        })));
        if (testConfig.testNonRelays) it("Can get the transaction pool backlog (binary)", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee28() {
          return _regenerator["default"].wrap(function _callee28$(_context28) {
            while (1) {
              switch (_context28.prev = _context28.next) {
                case 0:
                  throw new Error("Not implemented");

                case 1:
                case "end":
                  return _context28.stop();
              }
            }
          }, _callee28);
        })));
        if (testConfig.testNonRelays) it("Can get transaction pool statistics (binary)", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee29() {
          var i, tx, result;
          return _regenerator["default"].wrap(function _callee29$(_context29) {
            while (1) {
              switch (_context29.prev = _context29.next) {
                case 0:
                  _context29.next = 2;
                  return _TestUtils["default"].WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);

                case 2:
                  i = 0;

                case 3:
                  if (!(i < 2)) {
                    _context29.next = 26;
                    break;
                  }

                  _context29.next = 6;
                  return getUnrelayedTx(that.wallet, i);

                case 6:
                  tx = _context29.sent;
                  _context29.next = 9;
                  return that.daemon.submitTxHex(tx.getFullHex(), true);

                case 9:
                  result = _context29.sent;

                  _assert["default"].equal(result.isGood(), true, "Bad tx submit result: " + result.toJson()); // test stats


                  _context29.prev = 11;
                  _context29.next = 14;
                  return that.daemon.getTxPoolStats();

                case 14:
                  stats = _context29.sent;
                  (0, _assert["default"])(stats.getNumTxs() > i);
                  testTxPoolStats(stats);

                case 17:
                  _context29.prev = 17;
                  _context29.next = 20;
                  return that.daemon.flushTxPool(tx.getHash());

                case 20:
                  _context29.next = 22;
                  return that.wallet.sync();

                case 22:
                  return _context29.finish(17);

                case 23:
                  i++;
                  _context29.next = 3;
                  break;

                case 26:
                case "end":
                  return _context29.stop();
              }
            }
          }, _callee29, null, [[11,, 17, 23]]);
        })));
        if (testConfig.testNonRelays) it("Can flush all transactions from the pool", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee30() {
          var txPoolBefore, i, tx, result, _iterator8, _step8, _tx6, _result;

          return _regenerator["default"].wrap(function _callee30$(_context30) {
            while (1) {
              switch (_context30.prev = _context30.next) {
                case 0:
                  _context30.next = 2;
                  return _TestUtils["default"].WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);

                case 2:
                  _context30.next = 4;
                  return that.daemon.getTxPool();

                case 4:
                  txPoolBefore = _context30.sent;
                  i = 0;

                case 6:
                  if (!(i < 2)) {
                    _context30.next = 17;
                    break;
                  }

                  _context30.next = 9;
                  return getUnrelayedTx(that.wallet, i);

                case 9:
                  tx = _context30.sent;
                  _context30.next = 12;
                  return that.daemon.submitTxHex(tx.getFullHex(), true);

                case 12:
                  result = _context30.sent;
                  testSubmitTxResultGood(result);

                case 14:
                  i++;
                  _context30.next = 6;
                  break;

                case 17:
                  _context30.t0 = _assert["default"];
                  _context30.next = 20;
                  return that.daemon.getTxPool();

                case 20:
                  _context30.t1 = _context30.sent.length;
                  _context30.t2 = txPoolBefore.length + 2;

                  _context30.t0.equal.call(_context30.t0, _context30.t1, _context30.t2);

                  _context30.next = 25;
                  return that.daemon.flushTxPool();

                case 25:
                  _context30.t3 = _assert["default"];
                  _context30.next = 28;
                  return that.daemon.getTxPool();

                case 28:
                  _context30.t4 = _context30.sent.length;

                  _context30.t3.equal.call(_context30.t3, _context30.t4, 0);

                  // re-submit original transactions
                  _iterator8 = _createForOfIteratorHelper(txPoolBefore);
                  _context30.prev = 31;

                  _iterator8.s();

                case 33:
                  if ((_step8 = _iterator8.n()).done) {
                    _context30.next = 41;
                    break;
                  }

                  _tx6 = _step8.value;
                  _context30.next = 37;
                  return that.daemon.submitTxHex(_tx6.getFullHex(), _tx6.isRelayed());

                case 37:
                  _result = _context30.sent;
                  testSubmitTxResultGood(_result);

                case 39:
                  _context30.next = 33;
                  break;

                case 41:
                  _context30.next = 46;
                  break;

                case 43:
                  _context30.prev = 43;
                  _context30.t5 = _context30["catch"](31);

                  _iterator8.e(_context30.t5);

                case 46:
                  _context30.prev = 46;

                  _iterator8.f();

                  return _context30.finish(46);

                case 49:
                  _context30.t6 = _assert["default"];
                  _context30.next = 52;
                  return that.daemon.getTxPool();

                case 52:
                  _context30.t7 = _context30.sent.length;
                  _context30.t8 = txPoolBefore.length;

                  _context30.t6.equal.call(_context30.t6, _context30.t7, _context30.t8);

                  _context30.next = 57;
                  return that.wallet.sync();

                case 57:
                case "end":
                  return _context30.stop();
              }
            }
          }, _callee30, null, [[31, 43, 46, 49]]);
        })));
        if (testConfig.testNonRelays) it("Can flush a transaction from the pool by hash", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee31() {
          var txPoolBefore, txs, i, tx, result, _i3, poolTxs;

          return _regenerator["default"].wrap(function _callee31$(_context31) {
            while (1) {
              switch (_context31.prev = _context31.next) {
                case 0:
                  _context31.next = 2;
                  return _TestUtils["default"].WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);

                case 2:
                  _context31.next = 4;
                  return that.daemon.getTxPool();

                case 4:
                  txPoolBefore = _context31.sent;
                  // submit txs to the pool but don't relay
                  txs = [];
                  i = 1;

                case 7:
                  if (!(i < 3)) {
                    _context31.next = 19;
                    break;
                  }

                  _context31.next = 10;
                  return getUnrelayedTx(that.wallet, i);

                case 10:
                  tx = _context31.sent;
                  _context31.next = 13;
                  return that.daemon.submitTxHex(tx.getFullHex(), true);

                case 13:
                  result = _context31.sent;
                  testSubmitTxResultGood(result);
                  txs.push(tx);

                case 16:
                  i++;
                  _context31.next = 7;
                  break;

                case 19:
                  _i3 = 0;

                case 20:
                  if (!(_i3 < txs.length)) {
                    _context31.next = 30;
                    break;
                  }

                  _context31.next = 23;
                  return that.daemon.flushTxPool(txs[_i3].getHash());

                case 23:
                  _context31.next = 25;
                  return that.daemon.getTxPool();

                case 25:
                  poolTxs = _context31.sent;

                  _assert["default"].equal(poolTxs.length, txs.length - _i3 - 1);

                case 27:
                  _i3++;
                  _context31.next = 20;
                  break;

                case 30:
                  _context31.t0 = _assert["default"];
                  _context31.next = 33;
                  return that.daemon.getTxPool();

                case 33:
                  _context31.t1 = _context31.sent.length;
                  _context31.t2 = txPoolBefore.length;

                  _context31.t0.equal.call(_context31.t0, _context31.t1, _context31.t2);

                  _context31.next = 38;
                  return that.wallet.sync();

                case 38:
                case "end":
                  return _context31.stop();
              }
            }
          }, _callee31);
        })));
        if (testConfig.testNonRelays) it("Can flush transactions from the pool by hashes", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee32() {
          var txPoolBefore, txHashes, i, tx, result;
          return _regenerator["default"].wrap(function _callee32$(_context32) {
            while (1) {
              switch (_context32.prev = _context32.next) {
                case 0:
                  _context32.next = 2;
                  return _TestUtils["default"].WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);

                case 2:
                  _context32.next = 4;
                  return that.daemon.getTxPool();

                case 4:
                  txPoolBefore = _context32.sent;
                  // submit txs to the pool but don't relay
                  txHashes = [];
                  i = 1;

                case 7:
                  if (!(i < 3)) {
                    _context32.next = 19;
                    break;
                  }

                  _context32.next = 10;
                  return getUnrelayedTx(that.wallet, i);

                case 10:
                  tx = _context32.sent;
                  _context32.next = 13;
                  return that.daemon.submitTxHex(tx.getFullHex(), true);

                case 13:
                  result = _context32.sent;
                  testSubmitTxResultGood(result);
                  txHashes.push(tx.getHash());

                case 16:
                  i++;
                  _context32.next = 7;
                  break;

                case 19:
                  _context32.t0 = _assert["default"];
                  _context32.next = 22;
                  return that.daemon.getTxPool();

                case 22:
                  _context32.t1 = _context32.sent.length;
                  _context32.t2 = txPoolBefore.length + txHashes.length;

                  _context32.t0.equal.call(_context32.t0, _context32.t1, _context32.t2);

                  _context32.next = 27;
                  return that.daemon.flushTxPool(txHashes);

                case 27:
                  _context32.t3 = _assert["default"];
                  _context32.next = 30;
                  return that.daemon.getTxPool();

                case 30:
                  _context32.t4 = _context32.sent.length;
                  _context32.t5 = txPoolBefore.length;

                  _context32.t3.equal.call(_context32.t3, _context32.t4, _context32.t5, "Tx pool size is different from start");

                  _context32.next = 35;
                  return that.wallet.sync();

                case 35:
                case "end":
                  return _context32.stop();
              }
            }
          }, _callee32);
        })));
        if (testConfig.testNonRelays) it("Can get the spent status of key images", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee34() {
          var txs, i, tx, keyImages, txHashes, _iterator9, _step9, _tx8, _iterator11, _step11, input, _i4, _txs, _tx7, _iterator10, _step10, _tx9, _iterator12, _step12, _input, testSpentStatuses, _testSpentStatuses;

          return _regenerator["default"].wrap(function _callee34$(_context34) {
            while (1) {
              switch (_context34.prev = _context34.next) {
                case 0:
                  _testSpentStatuses = function _testSpentStatuses3() {
                    _testSpentStatuses = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee33(keyImages, expectedStatus) {
                      var _iterator13, _step13, keyImage, statuses, _iterator14, _step14, status;

                      return _regenerator["default"].wrap(function _callee33$(_context33) {
                        while (1) {
                          switch (_context33.prev = _context33.next) {
                            case 0:
                              // test image
                              _iterator13 = _createForOfIteratorHelper(keyImages);
                              _context33.prev = 1;

                              _iterator13.s();

                            case 3:
                              if ((_step13 = _iterator13.n()).done) {
                                _context33.next = 13;
                                break;
                              }

                              keyImage = _step13.value;
                              _context33.t0 = _assert["default"];
                              _context33.next = 8;
                              return that.daemon.getKeyImageSpentStatus(keyImage);

                            case 8:
                              _context33.t1 = _context33.sent;
                              _context33.t2 = expectedStatus;

                              _context33.t0.equal.call(_context33.t0, _context33.t1, _context33.t2);

                            case 11:
                              _context33.next = 3;
                              break;

                            case 13:
                              _context33.next = 18;
                              break;

                            case 15:
                              _context33.prev = 15;
                              _context33.t3 = _context33["catch"](1);

                              _iterator13.e(_context33.t3);

                            case 18:
                              _context33.prev = 18;

                              _iterator13.f();

                              return _context33.finish(18);

                            case 21:
                              if (!(keyImages.length == 0)) {
                                _context33.next = 25;
                                break;
                              }

                              _context33.t4 = [];
                              _context33.next = 28;
                              break;

                            case 25:
                              _context33.next = 27;
                              return that.daemon.getKeyImageSpentStatuses(keyImages);

                            case 27:
                              _context33.t4 = _context33.sent;

                            case 28:
                              statuses = _context33.t4;
                              (0, _assert["default"])(Array.isArray(statuses));

                              _assert["default"].equal(statuses.length, keyImages.length);

                              _iterator14 = _createForOfIteratorHelper(statuses);

                              try {
                                for (_iterator14.s(); !(_step14 = _iterator14.n()).done;) {
                                  status = _step14.value;

                                  _assert["default"].equal(status, expectedStatus);
                                }
                              } catch (err) {
                                _iterator14.e(err);
                              } finally {
                                _iterator14.f();
                              }

                            case 33:
                            case "end":
                              return _context33.stop();
                          }
                        }
                      }, _callee33, null, [[1, 15, 18, 21]]);
                    }));
                    return _testSpentStatuses.apply(this, arguments);
                  };

                  testSpentStatuses = function _testSpentStatuses2(_x5, _x6) {
                    return _testSpentStatuses.apply(this, arguments);
                  };

                  _context34.next = 4;
                  return _TestUtils["default"].WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);

                case 4:
                  // submit txs to the pool to collect key images then flush them
                  txs = [];
                  i = 1;

                case 6:
                  if (!(i < 3)) {
                    _context34.next = 16;
                    break;
                  }

                  _context34.next = 9;
                  return getUnrelayedTx(that.wallet, i);

                case 9:
                  tx = _context34.sent;
                  _context34.next = 12;
                  return that.daemon.submitTxHex(tx.getFullHex(), true);

                case 12:
                  txs.push(tx);

                case 13:
                  i++;
                  _context34.next = 6;
                  break;

                case 16:
                  keyImages = [];
                  txHashes = txs.map(function (tx) {
                    return tx.getHash();
                  });
                  _context34.t0 = _createForOfIteratorHelper;
                  _context34.next = 21;
                  return that.daemon.getTxs(txHashes);

                case 21:
                  _context34.t1 = _context34.sent;
                  _iterator9 = (0, _context34.t0)(_context34.t1);

                  try {
                    for (_iterator9.s(); !(_step9 = _iterator9.n()).done;) {
                      _tx8 = _step9.value;
                      _iterator11 = _createForOfIteratorHelper(_tx8.getInputs());

                      try {
                        for (_iterator11.s(); !(_step11 = _iterator11.n()).done;) {
                          input = _step11.value;
                          keyImages.push(input.getKeyImage().getHex());
                        }
                      } catch (err) {
                        _iterator11.e(err);
                      } finally {
                        _iterator11.f();
                      }
                    }
                  } catch (err) {
                    _iterator9.e(err);
                  } finally {
                    _iterator9.f();
                  }

                  _context34.next = 26;
                  return that.daemon.flushTxPool(txHashes);

                case 26:
                  _context34.next = 28;
                  return testSpentStatuses(keyImages, _index.MoneroKeyImageSpentStatus.NOT_SPENT);

                case 28:
                  _i4 = 0, _txs = txs;

                case 29:
                  if (!(_i4 < _txs.length)) {
                    _context34.next = 36;
                    break;
                  }

                  _tx7 = _txs[_i4];
                  _context34.next = 33;
                  return that.daemon.submitTxHex(_tx7.getFullHex(), true);

                case 33:
                  _i4++;
                  _context34.next = 29;
                  break;

                case 36:
                  _context34.next = 38;
                  return testSpentStatuses(keyImages, _index.MoneroKeyImageSpentStatus.TX_POOL);

                case 38:
                  // collect key images of confirmed txs
                  keyImages = [];
                  _context34.next = 41;
                  return getConfirmedTxs(that.daemon, 10);

                case 41:
                  txs = _context34.sent;
                  _iterator10 = _createForOfIteratorHelper(txs);

                  try {
                    for (_iterator10.s(); !(_step10 = _iterator10.n()).done;) {
                      _tx9 = _step10.value;
                      _iterator12 = _createForOfIteratorHelper(_tx9.getInputs());

                      try {
                        for (_iterator12.s(); !(_step12 = _iterator12.n()).done;) {
                          _input = _step12.value;
                          keyImages.push(_input.getKeyImage().getHex());
                        }
                      } catch (err) {
                        _iterator12.e(err);
                      } finally {
                        _iterator12.f();
                      }
                    } // key images are all spent

                  } catch (err) {
                    _iterator10.e(err);
                  } finally {
                    _iterator10.f();
                  }

                  _context34.next = 46;
                  return testSpentStatuses(keyImages, _index.MoneroKeyImageSpentStatus.CONFIRMED);

                case 46:
                  _context34.next = 48;
                  return that.daemon.flushTxPool(txHashes);

                case 48:
                case "end":
                  return _context34.stop();
              }
            }
          }, _callee34);
        })));
        if (testConfig.testNonRelays) it("Can get output indices given a list of transaction hashes (binary)", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee35() {
          return _regenerator["default"].wrap(function _callee35$(_context35) {
            while (1) {
              switch (_context35.prev = _context35.next) {
                case 0:
                  throw new Error("Not implemented");

                case 1:
                case "end":
                  return _context35.stop();
              }
            }
          }, _callee35);
        })));
        if (testConfig.testNonRelays) it("Can get outputs given a list of output amounts and indices (binary)", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee36() {
          return _regenerator["default"].wrap(function _callee36$(_context36) {
            while (1) {
              switch (_context36.prev = _context36.next) {
                case 0:
                  throw new Error("Not implemented");

                case 1:
                case "end":
                  return _context36.stop();
              }
            }
          }, _callee36);
        })));
        if (testConfig.testNonRelays) it("Can get an output histogram (binary)", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee37() {
          var entries, _iterator15, _step15, entry;

          return _regenerator["default"].wrap(function _callee37$(_context37) {
            while (1) {
              switch (_context37.prev = _context37.next) {
                case 0:
                  _context37.next = 2;
                  return that.daemon.getOutputHistogram();

                case 2:
                  entries = _context37.sent;
                  (0, _assert["default"])(Array.isArray(entries));
                  (0, _assert["default"])(entries.length > 0);
                  _iterator15 = _createForOfIteratorHelper(entries);

                  try {
                    for (_iterator15.s(); !(_step15 = _iterator15.n()).done;) {
                      entry = _step15.value;
                      testOutputHistogramEntry(entry);
                    }
                  } catch (err) {
                    _iterator15.e(err);
                  } finally {
                    _iterator15.f();
                  }

                case 7:
                case "end":
                  return _context37.stop();
              }
            }
          }, _callee37);
        })));
        if (testConfig.testNonRelays) it("Can get an output distribution (binary)", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee38() {
          var amounts, entries, _iterator16, _step16, entry;

          return _regenerator["default"].wrap(function _callee38$(_context38) {
            while (1) {
              switch (_context38.prev = _context38.next) {
                case 0:
                  amounts = [];
                  amounts.push(BigInt(0));
                  amounts.push(BigInt(1));
                  amounts.push(BigInt(10));
                  amounts.push(BigInt(100));
                  amounts.push(BigInt(1000));
                  amounts.push(BigInt(10000));
                  amounts.push(BigInt(100000));
                  amounts.push(BigInt(1000000));
                  _context38.next = 11;
                  return that.daemon.getOutputDistribution(amounts);

                case 11:
                  entries = _context38.sent;
                  _iterator16 = _createForOfIteratorHelper(entries);

                  try {
                    for (_iterator16.s(); !(_step16 = _iterator16.n()).done;) {
                      entry = _step16.value;
                      testOutputDistributionEntry(entry);
                    }
                  } catch (err) {
                    _iterator16.e(err);
                  } finally {
                    _iterator16.f();
                  }

                case 14:
                case "end":
                  return _context38.stop();
              }
            }
          }, _callee38);
        })));
        if (testConfig.testNonRelays) it("Can get general information", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee39() {
          var info;
          return _regenerator["default"].wrap(function _callee39$(_context39) {
            while (1) {
              switch (_context39.prev = _context39.next) {
                case 0:
                  _context39.next = 2;
                  return that.daemon.getInfo();

                case 2:
                  info = _context39.sent;
                  testInfo(info);

                case 4:
                case "end":
                  return _context39.stop();
              }
            }
          }, _callee39);
        })));
        if (testConfig.testNonRelays) it("Can get sync information", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee40() {
          var syncInfo;
          return _regenerator["default"].wrap(function _callee40$(_context40) {
            while (1) {
              switch (_context40.prev = _context40.next) {
                case 0:
                  _context40.next = 2;
                  return that.daemon.getSyncInfo();

                case 2:
                  syncInfo = _context40.sent;
                  testSyncInfo(syncInfo);

                case 4:
                case "end":
                  return _context40.stop();
              }
            }
          }, _callee40);
        })));
        if (testConfig.testNonRelays) it("Can get hard fork information", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee41() {
          var hardForkInfo;
          return _regenerator["default"].wrap(function _callee41$(_context41) {
            while (1) {
              switch (_context41.prev = _context41.next) {
                case 0:
                  _context41.next = 2;
                  return that.daemon.getHardForkInfo();

                case 2:
                  hardForkInfo = _context41.sent;
                  testHardForkInfo(hardForkInfo);

                case 4:
                case "end":
                  return _context41.stop();
              }
            }
          }, _callee41);
        })));
        if (testConfig.testNonRelays) it("Can get alternative chains", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee42() {
          var altChains, _iterator17, _step17, altChain;

          return _regenerator["default"].wrap(function _callee42$(_context42) {
            while (1) {
              switch (_context42.prev = _context42.next) {
                case 0:
                  _context42.next = 2;
                  return that.daemon.getAltChains();

                case 2:
                  altChains = _context42.sent;
                  (0, _assert["default"])(Array.isArray(altChains) && altChains.length >= 0);
                  _iterator17 = _createForOfIteratorHelper(altChains);

                  try {
                    for (_iterator17.s(); !(_step17 = _iterator17.n()).done;) {
                      altChain = _step17.value;
                      testAltChain(altChain);
                    }
                  } catch (err) {
                    _iterator17.e(err);
                  } finally {
                    _iterator17.f();
                  }

                case 6:
                case "end":
                  return _context42.stop();
              }
            }
          }, _callee42);
        })));
        if (testConfig.testNonRelays) it("Can get alternative block hashes", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee43() {
          var altBlockHashes, _iterator18, _step18, altBlockHash;

          return _regenerator["default"].wrap(function _callee43$(_context43) {
            while (1) {
              switch (_context43.prev = _context43.next) {
                case 0:
                  _context43.next = 2;
                  return that.daemon.getAltBlockHashes();

                case 2:
                  altBlockHashes = _context43.sent;
                  (0, _assert["default"])(Array.isArray(altBlockHashes) && altBlockHashes.length >= 0);
                  _iterator18 = _createForOfIteratorHelper(altBlockHashes);

                  try {
                    for (_iterator18.s(); !(_step18 = _iterator18.n()).done;) {
                      altBlockHash = _step18.value;

                      _assert["default"].equal((0, _typeof2["default"])(altBlockHash), "string");

                      _assert["default"].equal(altBlockHash.length, 64); // TODO: common validation

                    }
                  } catch (err) {
                    _iterator18.e(err);
                  } finally {
                    _iterator18.f();
                  }

                case 6:
                case "end":
                  return _context43.stop();
              }
            }
          }, _callee43);
        })));
        if (testConfig.testNonRelays) it("Can get, set, and reset a download bandwidth limit", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee44() {
          var initVal, setVal, resetVal;
          return _regenerator["default"].wrap(function _callee44$(_context44) {
            while (1) {
              switch (_context44.prev = _context44.next) {
                case 0:
                  _context44.next = 2;
                  return that.daemon.getDownloadLimit();

                case 2:
                  initVal = _context44.sent;
                  (0, _assert["default"])(initVal > 0);
                  setVal = initVal * 2;
                  _context44.next = 7;
                  return that.daemon.setDownloadLimit(setVal);

                case 7:
                  _context44.t0 = _assert["default"];
                  _context44.next = 10;
                  return that.daemon.getDownloadLimit();

                case 10:
                  _context44.t1 = _context44.sent;
                  _context44.t2 = setVal;

                  _context44.t0.equal.call(_context44.t0, _context44.t1, _context44.t2);

                  _context44.next = 15;
                  return that.daemon.resetDownloadLimit();

                case 15:
                  resetVal = _context44.sent;

                  _assert["default"].equal(resetVal, initVal); // test invalid limits


                  _context44.prev = 17;
                  _context44.next = 20;
                  return that.daemon.setDownloadLimit();

                case 20:
                  fail("Should have thrown error on invalid input");
                  _context44.next = 26;
                  break;

                case 23:
                  _context44.prev = 23;
                  _context44.t3 = _context44["catch"](17);

                  _assert["default"].equal("Download limit must be an integer greater than 0", _context44.t3.message);

                case 26:
                  _context44.prev = 26;
                  _context44.next = 29;
                  return that.daemon.setDownloadLimit(0);

                case 29:
                  fail("Should have thrown error on invalid input");
                  _context44.next = 35;
                  break;

                case 32:
                  _context44.prev = 32;
                  _context44.t4 = _context44["catch"](26);

                  _assert["default"].equal("Download limit must be an integer greater than 0", _context44.t4.message);

                case 35:
                  _context44.prev = 35;
                  _context44.next = 38;
                  return that.daemon.setDownloadLimit(1.2);

                case 38:
                  fail("Should have thrown error on invalid input");
                  _context44.next = 44;
                  break;

                case 41:
                  _context44.prev = 41;
                  _context44.t5 = _context44["catch"](35);

                  _assert["default"].equal("Download limit must be an integer greater than 0", _context44.t5.message);

                case 44:
                  _context44.t6 = _assert["default"];
                  _context44.next = 47;
                  return that.daemon.getDownloadLimit();

                case 47:
                  _context44.t7 = _context44.sent;
                  _context44.t8 = initVal;

                  _context44.t6.equal.call(_context44.t6, _context44.t7, _context44.t8);

                case 50:
                case "end":
                  return _context44.stop();
              }
            }
          }, _callee44, null, [[17, 23], [26, 32], [35, 41]]);
        })));
        if (testConfig.testNonRelays) it("Can get, set, and reset an upload bandwidth limit", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee45() {
          var initVal, setVal, resetVal;
          return _regenerator["default"].wrap(function _callee45$(_context45) {
            while (1) {
              switch (_context45.prev = _context45.next) {
                case 0:
                  _context45.next = 2;
                  return that.daemon.getUploadLimit();

                case 2:
                  initVal = _context45.sent;
                  (0, _assert["default"])(initVal > 0);
                  setVal = initVal * 2;
                  _context45.next = 7;
                  return that.daemon.setUploadLimit(setVal);

                case 7:
                  _context45.t0 = _assert["default"];
                  _context45.next = 10;
                  return that.daemon.getUploadLimit();

                case 10:
                  _context45.t1 = _context45.sent;
                  _context45.t2 = setVal;

                  _context45.t0.equal.call(_context45.t0, _context45.t1, _context45.t2);

                  _context45.next = 15;
                  return that.daemon.resetUploadLimit();

                case 15:
                  resetVal = _context45.sent;

                  _assert["default"].equal(resetVal, initVal); // test invalid limits


                  _context45.prev = 17;
                  _context45.next = 20;
                  return that.daemon.setUploadLimit();

                case 20:
                  fail("Should have thrown error on invalid input");
                  _context45.next = 26;
                  break;

                case 23:
                  _context45.prev = 23;
                  _context45.t3 = _context45["catch"](17);

                  _assert["default"].equal("Upload limit must be an integer greater than 0", _context45.t3.message);

                case 26:
                  _context45.prev = 26;
                  _context45.next = 29;
                  return that.daemon.setUploadLimit(0);

                case 29:
                  fail("Should have thrown error on invalid input");
                  _context45.next = 35;
                  break;

                case 32:
                  _context45.prev = 32;
                  _context45.t4 = _context45["catch"](26);

                  _assert["default"].equal("Upload limit must be an integer greater than 0", _context45.t4.message);

                case 35:
                  _context45.prev = 35;
                  _context45.next = 38;
                  return that.daemon.setUploadLimit(1.2);

                case 38:
                  fail("Should have thrown error on invalid input");
                  _context45.next = 44;
                  break;

                case 41:
                  _context45.prev = 41;
                  _context45.t5 = _context45["catch"](35);

                  _assert["default"].equal("Upload limit must be an integer greater than 0", _context45.t5.message);

                case 44:
                  _context45.t6 = _assert["default"];
                  _context45.next = 47;
                  return that.daemon.getUploadLimit();

                case 47:
                  _context45.t7 = _context45.sent;
                  _context45.t8 = initVal;

                  _context45.t6.equal.call(_context45.t6, _context45.t7, _context45.t8);

                case 50:
                case "end":
                  return _context45.stop();
              }
            }
          }, _callee45, null, [[17, 23], [26, 32], [35, 41]]);
        })));
        if (testConfig.testNonRelays) it("Can get peers with active incoming or outgoing peers", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee46() {
          var peers, _iterator19, _step19, peer;

          return _regenerator["default"].wrap(function _callee46$(_context46) {
            while (1) {
              switch (_context46.prev = _context46.next) {
                case 0:
                  _context46.next = 2;
                  return that.daemon.getPeers();

                case 2:
                  peers = _context46.sent;
                  (0, _assert["default"])(Array.isArray(peers));
                  (0, _assert["default"])(peers.length > 0, "Daemon has no incoming or outgoing peers to test");
                  _iterator19 = _createForOfIteratorHelper(peers);

                  try {
                    for (_iterator19.s(); !(_step19 = _iterator19.n()).done;) {
                      peer = _step19.value;
                      testPeer(peer);
                    }
                  } catch (err) {
                    _iterator19.e(err);
                  } finally {
                    _iterator19.f();
                  }

                case 7:
                case "end":
                  return _context46.stop();
              }
            }
          }, _callee46);
        })));
        if (testConfig.testNonRelays) it("Can get known peers which may be online or offline", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee47() {
          var peers, _iterator20, _step20, peer;

          return _regenerator["default"].wrap(function _callee47$(_context47) {
            while (1) {
              switch (_context47.prev = _context47.next) {
                case 0:
                  _context47.next = 2;
                  return that.daemon.getKnownPeers();

                case 2:
                  peers = _context47.sent;
                  (0, _assert["default"])(peers.length > 0, "Daemon has no known peers to test");
                  _iterator20 = _createForOfIteratorHelper(peers);

                  try {
                    for (_iterator20.s(); !(_step20 = _iterator20.n()).done;) {
                      peer = _step20.value;
                      testKnownPeer(peer);
                    }
                  } catch (err) {
                    _iterator20.e(err);
                  } finally {
                    _iterator20.f();
                  }

                case 6:
                case "end":
                  return _context47.stop();
              }
            }
          }, _callee47);
        })));
        if (testConfig.testNonRelays) it("Can limit the number of outgoing peers", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee48() {
          return _regenerator["default"].wrap(function _callee48$(_context48) {
            while (1) {
              switch (_context48.prev = _context48.next) {
                case 0:
                  _context48.next = 2;
                  return that.daemon.setOutgoingPeerLimit(0);

                case 2:
                  _context48.next = 4;
                  return that.daemon.setOutgoingPeerLimit(8);

                case 4:
                  _context48.next = 6;
                  return that.daemon.setOutgoingPeerLimit(10);

                case 6:
                  _context48.prev = 6;
                  _context48.next = 9;
                  return that.daemon.setOutgoingPeerLimit("a");

                case 9:
                  throw new Error("Should have failed on invalid input");

                case 12:
                  _context48.prev = 12;
                  _context48.t0 = _context48["catch"](6);

                  _assert["default"].notEqual("Should have failed on invalid input", _context48.t0.message);

                case 15:
                case "end":
                  return _context48.stop();
              }
            }
          }, _callee48, null, [[6, 12]]);
        })));
        if (testConfig.testNonRelays) it("Can limit the number of incoming peers", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee49() {
          return _regenerator["default"].wrap(function _callee49$(_context49) {
            while (1) {
              switch (_context49.prev = _context49.next) {
                case 0:
                  _context49.next = 2;
                  return that.daemon.setIncomingPeerLimit(0);

                case 2:
                  _context49.next = 4;
                  return that.daemon.setIncomingPeerLimit(8);

                case 4:
                  _context49.next = 6;
                  return that.daemon.setIncomingPeerLimit(10);

                case 6:
                  _context49.prev = 6;
                  _context49.next = 9;
                  return that.daemon.setIncomingPeerLimit("a");

                case 9:
                  throw new Error("Should have failed on invalid input");

                case 12:
                  _context49.prev = 12;
                  _context49.t0 = _context49["catch"](6);

                  _assert["default"].notEqual("Should have failed on invalid input", _context49.t0.message);

                case 15:
                case "end":
                  return _context49.stop();
              }
            }
          }, _callee49, null, [[6, 12]]);
        })));
        if (testConfig.testNonRelays) it("Can ban a peer", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee50() {
          var ban, bans, found, _iterator21, _step21, aBan;

          return _regenerator["default"].wrap(function _callee50$(_context50) {
            while (1) {
              switch (_context50.prev = _context50.next) {
                case 0:
                  // set ban
                  ban = new _index.MoneroBan();
                  ban.setHost("192.168.1.56");
                  ban.setIsBanned(true);
                  ban.setSeconds(60);
                  _context50.next = 6;
                  return that.daemon.setPeerBan(ban);

                case 6:
                  _context50.next = 8;
                  return that.daemon.getPeerBans();

                case 8:
                  bans = _context50.sent;
                  found = false;
                  _iterator21 = _createForOfIteratorHelper(bans);

                  try {
                    for (_iterator21.s(); !(_step21 = _iterator21.n()).done;) {
                      aBan = _step21.value;
                      testMoneroBan(aBan);
                      if (aBan.getHost() === "192.168.1.56") found = true;
                    }
                  } catch (err) {
                    _iterator21.e(err);
                  } finally {
                    _iterator21.f();
                  }

                  (0, _assert["default"])(found);

                case 13:
                case "end":
                  return _context50.stop();
              }
            }
          }, _callee50);
        })));
        if (testConfig.testNonRelays) it("Can ban peers", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee51() {
          var ban1, ban2, bans, found1, found2, _iterator22, _step22, aBan;

          return _regenerator["default"].wrap(function _callee51$(_context51) {
            while (1) {
              switch (_context51.prev = _context51.next) {
                case 0:
                  // set bans
                  ban1 = new _index.MoneroBan();
                  ban1.setHost("192.168.1.52");
                  ban1.setIsBanned(true);
                  ban1.setSeconds(60);
                  ban2 = new _index.MoneroBan();
                  ban2.setHost("192.168.1.53");
                  ban2.setIsBanned(true);
                  ban2.setSeconds(60);
                  bans = [];
                  bans.push(ban1);
                  bans.push(ban2);
                  _context51.next = 13;
                  return that.daemon.setPeerBans(bans);

                case 13:
                  _context51.next = 15;
                  return that.daemon.getPeerBans();

                case 15:
                  bans = _context51.sent;
                  found1 = false;
                  found2 = false;
                  _iterator22 = _createForOfIteratorHelper(bans);

                  try {
                    for (_iterator22.s(); !(_step22 = _iterator22.n()).done;) {
                      aBan = _step22.value;
                      testMoneroBan(aBan);
                      if (aBan.getHost() === "192.168.1.52") found1 = true;
                      if (aBan.getHost() === "192.168.1.53") found2 = true;
                    }
                  } catch (err) {
                    _iterator22.e(err);
                  } finally {
                    _iterator22.f();
                  }

                  (0, _assert["default"])(found1);
                  (0, _assert["default"])(found2);

                case 22:
                case "end":
                  return _context51.stop();
              }
            }
          }, _callee51);
        })));
        if (testConfig.testNonRelays) it("Can start and stop mining", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee52() {
          var address;
          return _regenerator["default"].wrap(function _callee52$(_context52) {
            while (1) {
              switch (_context52.prev = _context52.next) {
                case 0:
                  _context52.prev = 0;
                  _context52.next = 3;
                  return that.daemon.stopMining();

                case 3:
                  _context52.next = 7;
                  break;

                case 5:
                  _context52.prev = 5;
                  _context52.t0 = _context52["catch"](0);

                case 7:
                  _context52.next = 9;
                  return that.wallet.getPrimaryAddress();

                case 9:
                  address = _context52.sent;
                  _context52.next = 12;
                  return that.daemon.startMining(address, 2, false, true);

                case 12:
                  _context52.next = 14;
                  return that.daemon.stopMining();

                case 14:
                case "end":
                  return _context52.stop();
              }
            }
          }, _callee52, null, [[0, 5]]);
        })));
        if (testConfig.testNonRelays) it("Can get mining status", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee53() {
          var status, address, threadCount, isBackground;
          return _regenerator["default"].wrap(function _callee53$(_context53) {
            while (1) {
              switch (_context53.prev = _context53.next) {
                case 0:
                  _context53.prev = 0;
                  _context53.prev = 1;
                  _context53.next = 4;
                  return that.daemon.stopMining();

                case 4:
                  _context53.next = 8;
                  break;

                case 6:
                  _context53.prev = 6;
                  _context53.t0 = _context53["catch"](1);

                case 8:
                  _context53.next = 10;
                  return that.daemon.getMiningStatus();

                case 10:
                  status = _context53.sent;

                  _assert["default"].equal(status.isActive(), false);

                  _assert["default"].equal(status.getAddress(), undefined);

                  _assert["default"].equal(status.getSpeed(), 0);

                  _assert["default"].equal(status.getNumThreads(), 0);

                  _assert["default"].equal(status.isBackground(), undefined); // test status with mining


                  _context53.next = 18;
                  return that.wallet.getPrimaryAddress();

                case 18:
                  address = _context53.sent;
                  threadCount = 3;
                  isBackground = false;
                  _context53.next = 23;
                  return that.daemon.startMining(address, threadCount, isBackground, true);

                case 23:
                  _context53.next = 25;
                  return that.daemon.getMiningStatus();

                case 25:
                  status = _context53.sent;

                  _assert["default"].equal(status.isActive(), true);

                  _assert["default"].equal(status.getAddress(), address);

                  (0, _assert["default"])(status.getSpeed() >= 0);

                  _assert["default"].equal(status.getNumThreads(), threadCount);

                  _assert["default"].equal(status.isBackground(), isBackground);

                  _context53.next = 36;
                  break;

                case 33:
                  _context53.prev = 33;
                  _context53.t1 = _context53["catch"](0);
                  throw _context53.t1;

                case 36:
                  _context53.prev = 36;
                  _context53.prev = 37;
                  _context53.next = 40;
                  return that.daemon.stopMining();

                case 40:
                  _context53.next = 44;
                  break;

                case 42:
                  _context53.prev = 42;
                  _context53.t2 = _context53["catch"](37);

                case 44:
                  return _context53.finish(36);

                case 45:
                case "end":
                  return _context53.stop();
              }
            }
          }, _callee53, null, [[0, 33, 36, 45], [1, 6], [37, 42]]);
        })));
        if (testConfig.testNonRelays) it("Can submit a mined block to the network", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee54() {
          var template;
          return _regenerator["default"].wrap(function _callee54$(_context54) {
            while (1) {
              switch (_context54.prev = _context54.next) {
                case 0:
                  _context54.next = 2;
                  return that.daemon.getBlockTemplate(_TestUtils["default"].ADDRESS);

                case 2:
                  template = _context54.sent;
                  _context54.prev = 3;
                  _context54.next = 6;
                  return that.daemon.submitBlock(template.getBlockHashingBlob());

                case 6:
                  fail("Should have thrown error");
                  _context54.next = 13;
                  break;

                case 9:
                  _context54.prev = 9;
                  _context54.t0 = _context54["catch"](3);

                  _assert["default"].equal(_context54.t0.getCode(), -7);

                  _assert["default"].equal(_context54.t0.message, "Block not accepted");

                case 13:
                case "end":
                  return _context54.stop();
              }
            }
          }, _callee54, null, [[3, 9]]);
        })));
        if (testConfig.testNonRelays) it("Can check for an update", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee55() {
          var result;
          return _regenerator["default"].wrap(function _callee55$(_context55) {
            while (1) {
              switch (_context55.prev = _context55.next) {
                case 0:
                  _context55.next = 2;
                  return that.daemon.checkForUpdate();

                case 2:
                  result = _context55.sent;
                  testUpdateCheckResult(result);

                case 4:
                case "end":
                  return _context55.stop();
              }
            }
          }, _callee55);
        })));
        if (testConfig.testNonRelays) it("Can download an update", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee56() {
          var result, path;
          return _regenerator["default"].wrap(function _callee56$(_context56) {
            while (1) {
              switch (_context56.prev = _context56.next) {
                case 0:
                  _context56.next = 2;
                  return that.daemon.downloadUpdate();

                case 2:
                  result = _context56.sent;
                  testUpdateDownloadResult(result); // download to defined path

                  path = "test_download_" + +new Date().getTime() + ".tar.bz2";
                  _context56.next = 7;
                  return that.daemon.downloadUpdate(path);

                case 7:
                  result = _context56.sent;
                  testUpdateDownloadResult(result, path); // test invalid path

                  if (!result.isUpdateAvailable()) {
                    _context56.next = 21;
                    break;
                  }

                  _context56.prev = 10;
                  _context56.next = 13;
                  return that.daemon.downloadUpdate("./ohhai/there");

                case 13:
                  result = _context56.sent;
                  throw new Error("Should have thrown error");

                case 17:
                  _context56.prev = 17;
                  _context56.t0 = _context56["catch"](10);

                  _assert["default"].notEqual("Should have thrown error", _context56.t0.message);

                  _assert["default"].equal(_context56.t0.statusCode, 500); // TODO monero-daemon-rpc: this causes a 500 in that.daemon rpc


                case 21:
                case "end":
                  return _context56.stop();
              }
            }
          }, _callee56, null, [[10, 17]]);
        })));
        if (testConfig.testNonRelays) it("Can be stopped", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee57() {
          return _regenerator["default"].wrap(function _callee57$(_context57) {
            while (1) {
              switch (_context57.prev = _context57.next) {
                case 0:
                  return _context57.abrupt("return");

                case 3:
                  _context57.next = 5;
                  return that.daemon.stop();

                case 5:
                  _context57.next = 7;
                  return new Promise(function (resolve) {
                    setTimeout(resolve, 10000);
                  });

                case 7:
                  _context57.prev = 7;
                  _context57.next = 10;
                  return that.daemon.getHeight();

                case 10:
                  throw new Error("Should have thrown error");

                case 13:
                  _context57.prev = 13;
                  _context57.t0 = _context57["catch"](7);
                  console.log(_context57.t0);

                  _assert["default"].notEqual("Should have thrown error", _context57.t0.message);

                case 17:
                case "end":
                  return _context57.stop();
              }
            }
          }, _callee57, null, [[7, 13]]);
        }))); // ---------------------------- TEST RELAYS -----------------------------

        if (testConfig.testRelays) it("Can submit a tx in hex format to the pool and relay in one call", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee58() {
          var tx1, tx2, result, txs, found, _iterator23, _step23, aTx, _iterator24, _step24, _aTx;

          return _regenerator["default"].wrap(function _callee58$(_context58) {
            while (1) {
              switch (_context58.prev = _context58.next) {
                case 0:
                  _context58.next = 2;
                  return _TestUtils["default"].WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);

                case 2:
                  _context58.next = 4;
                  return getUnrelayedTx(that.wallet, 2);

                case 4:
                  tx1 = _context58.sent;
                  _context58.next = 7;
                  return getUnrelayedTx(that.wallet, 2);

                case 7:
                  tx2 = _context58.sent;
                  _context58.next = 10;
                  return that.daemon.submitTxHex(tx1.getFullHex());

                case 10:
                  result = _context58.sent;

                  _assert["default"].equal(result.isRelayed(), true);

                  testSubmitTxResultGood(result); // tx1 is in the pool

                  _context58.next = 15;
                  return that.daemon.getTxPool();

                case 15:
                  txs = _context58.sent;
                  found = false;
                  _iterator23 = _createForOfIteratorHelper(txs);
                  _context58.prev = 18;

                  _iterator23.s();

                case 20:
                  if ((_step23 = _iterator23.n()).done) {
                    _context58.next = 28;
                    break;
                  }

                  aTx = _step23.value;

                  if (!(aTx.getHash() === tx1.getHash())) {
                    _context58.next = 26;
                    break;
                  }

                  _assert["default"].equal(aTx.isRelayed(), true);

                  found = true;
                  return _context58.abrupt("break", 28);

                case 26:
                  _context58.next = 20;
                  break;

                case 28:
                  _context58.next = 33;
                  break;

                case 30:
                  _context58.prev = 30;
                  _context58.t0 = _context58["catch"](18);

                  _iterator23.e(_context58.t0);

                case 33:
                  _context58.prev = 33;

                  _iterator23.f();

                  return _context58.finish(33);

                case 36:
                  (0, _assert["default"])(found, "Tx1 was not found after being submitted to the that.daemon's tx pool"); // tx1 is recognized by the wallet

                  _context58.next = 39;
                  return that.wallet.sync();

                case 39:
                  _context58.next = 41;
                  return that.wallet.getTx(tx1.getHash());

                case 41:
                  _context58.next = 43;
                  return that.daemon.submitTxHex(tx2.getFullHex());

                case 43:
                  result = _context58.sent;

                  _assert["default"].equal(result.isRelayed(), true);

                  testSubmitTxResultDoubleSpend(result); // tx2 is in not the pool

                  _context58.next = 48;
                  return that.daemon.getTxPool();

                case 48:
                  txs = _context58.sent;
                  found = false;
                  _iterator24 = _createForOfIteratorHelper(txs);
                  _context58.prev = 51;

                  _iterator24.s();

                case 53:
                  if ((_step24 = _iterator24.n()).done) {
                    _context58.next = 60;
                    break;
                  }

                  _aTx = _step24.value;

                  if (!(_aTx.getHash() === tx2.getHash())) {
                    _context58.next = 58;
                    break;
                  }

                  found = true;
                  return _context58.abrupt("break", 60);

                case 58:
                  _context58.next = 53;
                  break;

                case 60:
                  _context58.next = 65;
                  break;

                case 62:
                  _context58.prev = 62;
                  _context58.t1 = _context58["catch"](51);

                  _iterator24.e(_context58.t1);

                case 65:
                  _context58.prev = 65;

                  _iterator24.f();

                  return _context58.finish(65);

                case 68:
                  (0, _assert["default"])(!found, "Tx2 should not be in the pool because it double spends tx1 which is in the pool"); // all wallets will need to wait for tx to confirm in order to properly sync

                  _TestUtils["default"].WALLET_TX_TRACKER.reset();

                case 70:
                case "end":
                  return _context58.stop();
              }
            }
          }, _callee58, null, [[18, 30, 33, 36], [51, 62, 65, 68]]);
        })));
        if (testConfig.testRelays && !testConfig.liteMode) it("Can submit a tx in hex format to the pool then relay", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee59() {
          var tx;
          return _regenerator["default"].wrap(function _callee59$(_context59) {
            while (1) {
              switch (_context59.prev = _context59.next) {
                case 0:
                  _context59.next = 2;
                  return _TestUtils["default"].WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);

                case 2:
                  _context59.next = 4;
                  return getUnrelayedTx(that.wallet, 1);

                case 4:
                  tx = _context59.sent;
                  _context59.next = 7;
                  return testSubmitThenRelay([tx]);

                case 7:
                case "end":
                  return _context59.stop();
              }
            }
          }, _callee59);
        })));
        if (testConfig.testRelays && !testConfig.liteMode) it("Can submit txs in hex format to the pool then relay", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee60() {
          var txs;
          return _regenerator["default"].wrap(function _callee60$(_context60) {
            while (1) {
              switch (_context60.prev = _context60.next) {
                case 0:
                  _context60.next = 2;
                  return _TestUtils["default"].WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);

                case 2:
                  txs = [];
                  _context60.t0 = txs;
                  _context60.next = 6;
                  return getUnrelayedTx(that.wallet, 1);

                case 6:
                  _context60.t1 = _context60.sent;

                  _context60.t0.push.call(_context60.t0, _context60.t1);

                  _context60.t2 = txs;
                  _context60.next = 11;
                  return getUnrelayedTx(that.wallet, 2);

                case 11:
                  _context60.t3 = _context60.sent;

                  _context60.t2.push.call(_context60.t2, _context60.t3);

                  _context60.next = 15;
                  return testSubmitThenRelay(txs);

                case 15:
                case "end":
                  return _context60.stop();
              }
            }
          }, _callee60);
        })));

        function testSubmitThenRelay(_x7) {
          return _testSubmitThenRelay.apply(this, arguments);
        } // ------------------------ TEST NOTIFICATIONS --------------------------


        function _testSubmitThenRelay() {
          _testSubmitThenRelay = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee64(txs) {
            var txHashes, _iterator25, _step25, tx, result, _poolTxs, found, _iterator27, _step27, aTx, fetchedTx, poolTxs, _iterator26, _step26, _tx10, _found, _iterator28, _step28, _aTx2;

            return _regenerator["default"].wrap(function _callee64$(_context64) {
              while (1) {
                switch (_context64.prev = _context64.next) {
                  case 0:
                    // submit txs hex but don't relay
                    txHashes = [];
                    _iterator25 = _createForOfIteratorHelper(txs);
                    _context64.prev = 2;

                    _iterator25.s();

                  case 4:
                    if ((_step25 = _iterator25.n()).done) {
                      _context64.next = 42;
                      break;
                    }

                    tx = _step25.value;
                    txHashes.push(tx.getHash());
                    _context64.next = 9;
                    return that.daemon.submitTxHex(tx.getFullHex(), true);

                  case 9:
                    result = _context64.sent;
                    testSubmitTxResultGood(result);

                    _assert["default"].equal(result.isRelayed(), false); // ensure tx is in pool


                    _context64.next = 14;
                    return that.daemon.getTxPool();

                  case 14:
                    _poolTxs = _context64.sent;
                    found = false;
                    _iterator27 = _createForOfIteratorHelper(_poolTxs);
                    _context64.prev = 17;

                    _iterator27.s();

                  case 19:
                    if ((_step27 = _iterator27.n()).done) {
                      _context64.next = 27;
                      break;
                    }

                    aTx = _step27.value;

                    if (!(aTx.getHash() === tx.getHash())) {
                      _context64.next = 25;
                      break;
                    }

                    _assert["default"].equal(aTx.isRelayed(), false);

                    found = true;
                    return _context64.abrupt("break", 27);

                  case 25:
                    _context64.next = 19;
                    break;

                  case 27:
                    _context64.next = 32;
                    break;

                  case 29:
                    _context64.prev = 29;
                    _context64.t0 = _context64["catch"](17);

                    _iterator27.e(_context64.t0);

                  case 32:
                    _context64.prev = 32;

                    _iterator27.f();

                    return _context64.finish(32);

                  case 35:
                    (0, _assert["default"])(found, "Tx was not found after being submitted to the that.daemon's tx pool"); // fetch tx by hash and ensure not relayed

                    _context64.next = 38;
                    return that.daemon.getTx(tx.getHash());

                  case 38:
                    fetchedTx = _context64.sent;

                    _assert["default"].equal(fetchedTx.isRelayed(), false);

                  case 40:
                    _context64.next = 4;
                    break;

                  case 42:
                    _context64.next = 47;
                    break;

                  case 44:
                    _context64.prev = 44;
                    _context64.t1 = _context64["catch"](2);

                    _iterator25.e(_context64.t1);

                  case 47:
                    _context64.prev = 47;

                    _iterator25.f();

                    return _context64.finish(47);

                  case 50:
                    _context64.prev = 50;

                    if (!(txHashes.length === 1)) {
                      _context64.next = 56;
                      break;
                    }

                    _context64.next = 54;
                    return that.daemon.relayTxByHash(txHashes[0]);

                  case 54:
                    _context64.next = 58;
                    break;

                  case 56:
                    _context64.next = 58;
                    return that.daemon.relayTxsByHash(txHashes);

                  case 58:
                    _context64.next = 65;
                    break;

                  case 60:
                    _context64.prev = 60;
                    _context64.t2 = _context64["catch"](50);
                    _context64.next = 64;
                    return that.daemon.flushTxPool(txHashes);

                  case 64:
                    throw _context64.t2;

                  case 65:
                    _context64.next = 67;
                    return new Promise(function (resolve) {
                      setTimeout(resolve, 1000);
                    });

                  case 67:
                    _context64.next = 69;
                    return that.daemon.getTxPool();

                  case 69:
                    poolTxs = _context64.sent;
                    _iterator26 = _createForOfIteratorHelper(txs);
                    _context64.prev = 71;

                    _iterator26.s();

                  case 73:
                    if ((_step26 = _iterator26.n()).done) {
                      _context64.next = 98;
                      break;
                    }

                    _tx10 = _step26.value;
                    _found = false;
                    _iterator28 = _createForOfIteratorHelper(poolTxs);
                    _context64.prev = 77;

                    _iterator28.s();

                  case 79:
                    if ((_step28 = _iterator28.n()).done) {
                      _context64.next = 87;
                      break;
                    }

                    _aTx2 = _step28.value;

                    if (!(_aTx2.getHash() === _tx10.getHash())) {
                      _context64.next = 85;
                      break;
                    }

                    _assert["default"].equal(_aTx2.isRelayed(), true);

                    _found = true;
                    return _context64.abrupt("break", 87);

                  case 85:
                    _context64.next = 79;
                    break;

                  case 87:
                    _context64.next = 92;
                    break;

                  case 89:
                    _context64.prev = 89;
                    _context64.t3 = _context64["catch"](77);

                    _iterator28.e(_context64.t3);

                  case 92:
                    _context64.prev = 92;

                    _iterator28.f();

                    return _context64.finish(92);

                  case 95:
                    (0, _assert["default"])(_found, "Tx was not found after being submitted to the that.daemon's tx pool");

                  case 96:
                    _context64.next = 73;
                    break;

                  case 98:
                    _context64.next = 103;
                    break;

                  case 100:
                    _context64.prev = 100;
                    _context64.t4 = _context64["catch"](71);

                    _iterator26.e(_context64.t4);

                  case 103:
                    _context64.prev = 103;

                    _iterator26.f();

                    return _context64.finish(103);

                  case 106:
                    // wallets will need to wait for tx to confirm in order to properly sync
                    _TestUtils["default"].WALLET_TX_TRACKER.reset();

                  case 107:
                  case "end":
                    return _context64.stop();
                }
              }
            }, _callee64, null, [[2, 44, 47, 50], [17, 29, 32, 35], [50, 60], [71, 100, 103, 106], [77, 89, 92, 95]]);
          }));
          return _testSubmitThenRelay.apply(this, arguments);
        }

        if (!testConfig.liteMode && testConfig.testNotifications) it("Can notify listeners when a new block is added to the chain", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee62() {
          var err, address, listenerHeader, listener, header;
          return _regenerator["default"].wrap(function _callee62$(_context62) {
            while (1) {
              switch (_context62.prev = _context62.next) {
                case 0:
                  _context62.prev = 0;
                  _context62.next = 3;
                  return that.wallet.getPrimaryAddress();

                case 3:
                  address = _context62.sent;
                  _context62.prev = 4;
                  _context62.next = 7;
                  return that.daemon.startMining(address, 8, false, true);

                case 7:
                  _context62.next = 13;
                  break;

                case 9:
                  _context62.prev = 9;
                  _context62.t0 = _context62["catch"](4);

                  if (!("BUSY" === _context62.t0.message)) {
                    _context62.next = 13;
                    break;
                  }

                  throw _context62.t0;

                case 13:
                  listener = new ( /*#__PURE__*/function (_MoneroDaemonListener) {
                    (0, _inherits2["default"])(_class, _MoneroDaemonListener);

                    var _super = _createSuper(_class);

                    function _class() {
                      (0, _classCallCheck2["default"])(this, _class);
                      return _super.apply(this, arguments);
                    }

                    (0, _createClass2["default"])(_class, [{
                      key: "onBlockHeader",
                      value: function () {
                        var _onBlockHeader = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee61(header) {
                          return _regenerator["default"].wrap(function _callee61$(_context61) {
                            while (1) {
                              switch (_context61.prev = _context61.next) {
                                case 0:
                                  listenerHeader = header;
                                  _context61.next = 3;
                                  return that.daemon.removeListener(listener);

                                case 3:
                                case "end":
                                  return _context61.stop();
                              }
                            }
                          }, _callee61);
                        }));

                        function onBlockHeader(_x8) {
                          return _onBlockHeader.apply(this, arguments);
                        }

                        return onBlockHeader;
                      }()
                    }]);
                    return _class;
                  }(_index.MoneroDaemonListener))();
                  _context62.next = 16;
                  return that.daemon.addListener(listener);

                case 16:
                  _context62.next = 18;
                  return that.daemon.waitForNextBlockHeader();

                case 18:
                  header = _context62.sent;
                  testBlockHeader(header, true); // test that listener was called with equivalent header

                  _assert["default"].deepEqual(listenerHeader, header);

                  _context62.next = 26;
                  break;

                case 23:
                  _context62.prev = 23;
                  _context62.t1 = _context62["catch"](0);
                  err = _context62.t1;

                case 26:
                  _context62.prev = 26;
                  _context62.next = 29;
                  return that.daemon.stopMining();

                case 29:
                  _context62.next = 33;
                  break;

                case 31:
                  _context62.prev = 31;
                  _context62.t2 = _context62["catch"](26);

                case 33:
                  if (!err) {
                    _context62.next = 35;
                    break;
                  }

                  throw err;

                case 35:
                case "end":
                  return _context62.stop();
              }
            }
          }, _callee62, null, [[0, 23], [4, 9], [26, 31]]);
        })));
      });
    }
  }]);
  return TestMoneroDaemonRpc;
}();

function testBlockHeader(header, isFull) {
  (0, _assert["default"])(typeof isFull === "boolean");
  (0, _assert["default"])(header);
  (0, _assert["default"])(header.getHeight() >= 0);
  (0, _assert["default"])(header.getMajorVersion() > 0);
  (0, _assert["default"])(header.getMinorVersion() >= 0);
  if (header.getHeight() === 0) (0, _assert["default"])(header.getTimestamp() === 0);else (0, _assert["default"])(header.getTimestamp() > 0);
  (0, _assert["default"])(header.getPrevHash());
  (0, _assert["default"])(header.getNonce() !== undefined);
  if (header.getNonce() === 0) console.log("WARNING: header nonce is 0 at height " + header.getHeight()); // TODO (monero-project): why is header nonce 0?
  else (0, _assert["default"])(header.getNonce() > 0);

  _assert["default"].equal((0, _typeof2["default"])(header.getNonce()), "number");

  (0, _assert["default"])(header.getPowHash() === undefined); // never seen defined

  (0, _assert["default"])(!isFull ? undefined === header.getSize() : header.getSize());
  (0, _assert["default"])(!isFull ? undefined === header.getDepth() : header.getDepth() >= 0);
  (0, _assert["default"])(!isFull ? undefined === header.getDifficulty() : header.getDifficulty().toJSValue() > 0);
  (0, _assert["default"])(!isFull ? undefined === header.getCumulativeDifficulty() : header.getCumulativeDifficulty().toJSValue() > 0);
  (0, _assert["default"])(!isFull ? undefined === header.getHash() : header.getHash().length === 64);
  (0, _assert["default"])(!isFull ? undefined === header.getMinerTxHash() : header.getMinerTxHash().length === 64);
  (0, _assert["default"])(!isFull ? undefined === header.getNumTxs() : header.getNumTxs() >= 0);
  (0, _assert["default"])(!isFull ? undefined === header.getOrphanStatus() : typeof header.getOrphanStatus() === "boolean");
  (0, _assert["default"])(!isFull ? undefined === header.getReward() : header.getReward());
  (0, _assert["default"])(!isFull ? undefined === header.getWeight() : header.getWeight());
} // TODO: test block deep copy


function testBlock(block, ctx) {
  // check inputs
  (0, _assert["default"])(ctx);

  _assert["default"].equal((0, _typeof2["default"])(ctx.hasHex), "boolean");

  _assert["default"].equal((0, _typeof2["default"])(ctx.headerIsFull), "boolean");

  _assert["default"].equal((0, _typeof2["default"])(ctx.hasTxs), "boolean"); // test required fields


  (0, _assert["default"])(block);
  (0, _assert["default"])(Array.isArray(block.getTxHashes()));
  (0, _assert["default"])(block.getTxHashes().length >= 0);
  testMinerTx(block.getMinerTx()); // TODO: miner tx doesn't have as much stuff, can't call testTx?

  testBlockHeader(block, ctx.headerIsFull);

  if (ctx.hasHex) {
    (0, _assert["default"])(block.getHex());
    (0, _assert["default"])(block.getHex().length > 1);
  } else {
    (0, _assert["default"])(block.getHex() === undefined);
  }

  if (ctx.hasTxs) {
    (0, _assert["default"])((0, _typeof2["default"])(ctx.ctx) === "object");
    (0, _assert["default"])(block.getTxs() instanceof Array);

    var _iterator29 = _createForOfIteratorHelper(block.getTxs()),
        _step29;

    try {
      for (_iterator29.s(); !(_step29 = _iterator29.n()).done;) {
        var tx = _step29.value;
        (0, _assert["default"])(block === tx.getBlock());
        testTx(tx, ctx.ctx);
      }
    } catch (err) {
      _iterator29.e(err);
    } finally {
      _iterator29.f();
    }
  } else {
    (0, _assert["default"])(ctx.ctx === undefined);
    (0, _assert["default"])(block.getTxs() === undefined);
  }
}

function testMinerTx(minerTx) {
  (0, _assert["default"])(minerTx);
  (0, _assert["default"])(minerTx instanceof _index.MoneroTx);

  _assert["default"].equal((0, _typeof2["default"])(minerTx.isMinerTx()), "boolean");

  (0, _assert["default"])(minerTx.isMinerTx());
  (0, _assert["default"])(minerTx.getVersion() >= 0);
  (0, _assert["default"])(Array.isArray(minerTx.getExtra()));
  (0, _assert["default"])(minerTx.getExtra().length > 0);
  (0, _assert["default"])(minerTx.getUnlockHeight() >= 0); // TODO: miner tx does not have hashes in binary requests so this will fail, need to derive using prunable data
  //  testTx(minerTx, {
  //    hasJson: false,
  //    isPruned: true,
  //    isFull: false,
  //    isConfirmed: true,
  //    isMinerTx: true,
  //    fromGetTxPool: false,
  //  })
} // TODO: how to test output indices? comes back with /get_transactions, maybe others


function testTx(tx, ctx) {
  // check inputs
  (0, _assert["default"])(tx);

  _assert["default"].equal((0, _typeof2["default"])(ctx), "object");

  _assert["default"].equal((0, _typeof2["default"])(ctx.isPruned), "boolean");

  _assert["default"].equal((0, _typeof2["default"])(ctx.isConfirmed), "boolean");

  _assert["default"].equal((0, _typeof2["default"])(ctx.fromGetTxPool), "boolean"); // standard across all txs


  (0, _assert["default"])(tx.getHash().length === 64);
  if (tx.isRelayed() === undefined) (0, _assert["default"])(tx.inTxPool()); // TODO monero-daemon-rpc: add relayed to get_transactions
  else _assert["default"].equal((0, _typeof2["default"])(tx.isRelayed()), "boolean");

  _assert["default"].equal((0, _typeof2["default"])(tx.isConfirmed()), "boolean");

  _assert["default"].equal((0, _typeof2["default"])(tx.inTxPool()), "boolean");

  _assert["default"].equal((0, _typeof2["default"])(tx.isMinerTx()), "boolean");

  _assert["default"].equal((0, _typeof2["default"])(tx.isDoubleSpendSeen()), "boolean");

  (0, _assert["default"])(tx.getVersion() >= 0);
  (0, _assert["default"])(tx.getUnlockHeight() >= 0);
  (0, _assert["default"])(tx.getInputs());
  (0, _assert["default"])(tx.getOutputs());
  (0, _assert["default"])(tx.getExtra().length > 0); // test presence of output indices
  // TODO: change this over to outputs only

  if (tx.isMinerTx()) _assert["default"].equal(tx.getOutputIndices(), undefined); // TODO: how to get output indices for miner transactions?

  if (tx.inTxPool() || ctx.fromGetTxPool || ctx.hasOutputIndices === false) _assert["default"].equal(tx.getOutputIndices(), undefined);else (0, _assert["default"])(tx.getOutputIndices());
  if (tx.getOutputIndices()) (0, _assert["default"])(tx.getOutputIndices().length > 0); // test confirmed ctx

  if (ctx.isConfirmed === true) _assert["default"].equal(tx.isConfirmed(), true);
  if (ctx.isConfirmed === false) _assert["default"].equal(tx.isConfirmed(), false); // test confirmed

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

    if (ctx.fromBinaryBlock) _assert["default"].equal(tx.getNumConfirmations(), undefined);else (0, _assert["default"])(tx.getNumConfirmations() > 0);
  } else {
    _assert["default"].equal(tx.getBlock(), undefined);

    _assert["default"].equal(tx.getNumConfirmations(), 0);
  } // test in tx pool


  if (tx.inTxPool()) {
    _assert["default"].equal(tx.isConfirmed(), false);

    _assert["default"].equal(tx.isDoubleSpendSeen(), false);

    _assert["default"].equal(tx.getLastFailedHeight(), undefined);

    _assert["default"].equal(tx.getLastFailedHash(), undefined);

    (0, _assert["default"])(tx.getReceivedTimestamp() > 0);
    (0, _assert["default"])(tx.getSize() > 0);
    (0, _assert["default"])(tx.getWeight() > 0);

    _assert["default"].equal((0, _typeof2["default"])(tx.isKeptByBlock()), "boolean");

    _assert["default"].equal(tx.getLastFailedHeight(), undefined);

    _assert["default"].equal(tx.getLastFailedHash(), undefined);

    (0, _assert["default"])(tx.getMaxUsedBlockHeight() >= 0);
    (0, _assert["default"])(tx.getMaxUsedBlockHash());
  } else {
    _assert["default"].equal(tx.getLastRelayedTimestamp(), undefined);
  } // test miner tx


  if (tx.isMinerTx()) {
    _assert["default"].equal(_index.GenUtils.compareBigInt(tx.getFee(), BigInt(0)), 0);

    (0, _assert["default"])(tx.getIncomingTransfers().length > 0); // TODO: MoneroTx does not have getIncomingTransfers() but this doesn't fail?

    _assert["default"].equal(tx.getInputs(), undefined);

    _assert["default"].equal(tx.getSignatures(), undefined);
  } else {
    if (tx.getSignatures() !== undefined) (0, _assert["default"])(tx.getSignatures().length > 0);
  } // test failed  // TODO: what else to test associated with failed


  if (tx.isFailed()) {
    (0, _assert["default"])(tx.getOutgoingTransfer() instanceof MoneroTransfer); // TODO: MoneroTx does not have getOutgoingTransfer() but this doesn't fail?

    (0, _assert["default"])(tx.getReceivedTimestamp() > 0);
  } else {
    if (tx.isRelayed() === undefined) _assert["default"].equal(tx.getRelay(), undefined); // TODO monero-daemon-rpc: add relayed to get_transactions
    else if (tx.isRelayed()) _assert["default"].equal(tx.isDoubleSpendSeen(), false);else {
      _assert["default"].equal(tx.isRelayed(), false);

      _assert["default"].equal(tx.getRelay(), false);

      _assert["default"].equal((0, _typeof2["default"])(tx.isDoubleSpendSeen()), "boolean");
    }
  }

  _assert["default"].equal(tx.getLastFailedHeight(), undefined);

  _assert["default"].equal(tx.getLastFailedHash(), undefined); // received time only for tx pool or failed txs


  if (tx.getReceivedTimestamp() !== undefined) {
    (0, _assert["default"])(tx.inTxPool() || tx.isFailed());
  } // test inputs and outputs


  (0, _assert["default"])(tx.getInputs() && Array.isArray(tx.getInputs()) && tx.getInputs().length >= 0);
  (0, _assert["default"])(tx.getOutputs() && Array.isArray(tx.getOutputs()) && tx.getOutputs().length >= 0);
  if (!tx.isMinerTx()) (0, _assert["default"])(tx.getInputs().length > 0);

  var _iterator30 = _createForOfIteratorHelper(tx.getInputs()),
      _step30;

  try {
    for (_iterator30.s(); !(_step30 = _iterator30.n()).done;) {
      var input = _step30.value;
      (0, _assert["default"])(tx === input.getTx());
      testVin(input, ctx);
    }
  } catch (err) {
    _iterator30.e(err);
  } finally {
    _iterator30.f();
  }

  (0, _assert["default"])(tx.getOutputs().length > 0);

  var _iterator31 = _createForOfIteratorHelper(tx.getOutputs()),
      _step31;

  try {
    for (_iterator31.s(); !(_step31 = _iterator31.n()).done;) {
      var output = _step31.value;
      (0, _assert["default"])(tx === output.getTx());
      testOutput(output, ctx);
    } // test pruned vs not pruned

  } catch (err) {
    _iterator31.e(err);
  } finally {
    _iterator31.f();
  }

  if (ctx.fromGetTxPool || ctx.fromBinaryBlock) _assert["default"].equal(tx.getPrunableHash(), undefined); // TODO monero-daemon-rpc: tx pool txs do not have prunable hash, TODO: getBlocksByHeight() has inconsistent client-side pruning
  else (0, _assert["default"])(tx.getPrunableHash());

  if (ctx.isPruned) {
    _assert["default"].equal(tx.getRctSigPrunable(), undefined);

    _assert["default"].equal(tx.getSize(), undefined);

    _assert["default"].equal(tx.getLastRelayedTimestamp(), undefined);

    _assert["default"].equal(tx.getReceivedTimestamp(), undefined);

    _assert["default"].equal(tx.getFullHex(), undefined);

    (0, _assert["default"])(tx.getPrunedHex());
  } else {
    _assert["default"].equal(tx.getPrunedHex(), undefined);

    (0, _assert["default"])(tx.getVersion() >= 0);
    (0, _assert["default"])(tx.getUnlockHeight() >= 0);
    (0, _assert["default"])(Array.isArray(tx.getExtra()) && tx.getExtra().length > 0);
    if (ctx.fromBinaryBlock) _assert["default"].equal(tx.getFullHex(), undefined); // TODO: getBlocksByHeight() has inconsistent client-side pruning
    else (0, _assert["default"])(tx.getFullHex().length > 0);
    if (ctx.fromBinaryBlock) _assert["default"].equal(tx.getRctSigPrunable(), undefined); // TODO: getBlocksByHeight() has inconsistent client-side pruning
    //else assert.equal(typeof tx.getRctSigPrunable().nbp, "number");

    _assert["default"].equal(tx.isDoubleSpendSeen(), false);

    if (tx.isConfirmed()) {
      _assert["default"].equal(tx.getLastRelayedTimestamp(), undefined);

      _assert["default"].equal(tx.getReceivedTimestamp(), undefined);
    } else {
      if (tx.isRelayed()) (0, _assert["default"])(tx.getLastRelayedTimestamp() > 0);else _assert["default"].equal(tx.getLastRelayedTimestamp(), undefined);
      (0, _assert["default"])(tx.getReceivedTimestamp() > 0);
    }
  }

  if (tx.isFailed()) {// TODO: implement this
  } // test deep copy


  if (!ctx.doNotTestCopy) testTxCopy(tx, ctx);
}

function testBlockTemplate(template) {
  (0, _assert["default"])(template);
  (0, _assert["default"])(template.getBlockTemplateBlob());
  (0, _assert["default"])(template.getBlockHashingBlob());
  (0, _assert["default"])(template.getDifficulty());
  (0, _assert["default"])(template.getDifficulty() instanceof BigInt);
  (0, _assert["default"])(template.getExpectedReward());
  (0, _assert["default"])(template.getHeight());
  (0, _assert["default"])(template.getPrevHash());
  (0, _assert["default"])(template.getReservedOffset());

  _assert["default"].equal((0, _typeof2["default"])(template.getSeedHeight()), "number");

  (0, _assert["default"])(template.getSeedHeight() > 0);

  _assert["default"].equal((0, _typeof2["default"])(template.getSeedHash()), "string");

  (0, _assert["default"])(template.getSeedHash()); // next seed hash can be null or initialized  // TODO: test circumstances for each
}

function testInfo(info) {
  (0, _assert["default"])(info.getVersion());
  (0, _assert["default"])(info.getNumAltBlocks() >= 0);
  (0, _assert["default"])(info.getBlockSizeLimit());
  (0, _assert["default"])(info.getBlockSizeMedian());
  (0, _assert["default"])(info.getBootstrapDaemonAddress() === undefined || typeof info.getBootstrapDaemonAddress() === "string" && info.getBootstrapDaemonAddress().length > 0);
  (0, _assert["default"])(info.getCumulativeDifficulty());
  (0, _assert["default"])(info.getCumulativeDifficulty() instanceof BigInt);
  (0, _assert["default"])(info.getFreeSpace());
  (0, _assert["default"])(info.getNumOfflinePeers() >= 0);
  (0, _assert["default"])(info.getNumOnlinePeers() >= 0);
  (0, _assert["default"])(info.getHeight() >= 0);
  (0, _assert["default"])(info.getHeightWithoutBootstrap());
  (0, _assert["default"])(info.getNumIncomingConnections() >= 0);
  (0, _assert["default"])(info.getNetworkType());

  _assert["default"].equal("boolean", (0, _typeof2["default"])(info.isOffline()));

  (0, _assert["default"])(info.getNumOutgoingConnections() >= 0);
  (0, _assert["default"])(info.getNumRpcConnections() >= 0);
  (0, _assert["default"])(info.getStartTimestamp());
  (0, _assert["default"])(info.getAdjustedTimestamp());
  (0, _assert["default"])(info.getTarget());
  (0, _assert["default"])(info.getTargetHeight() >= 0);
  (0, _assert["default"])(info.getNumTxs() >= 0);
  (0, _assert["default"])(info.getNumTxsPool() >= 0);
  (0, _assert["default"])(typeof info.getWasBootstrapEverUsed() === "boolean");
  (0, _assert["default"])(info.getBlockWeightLimit());
  (0, _assert["default"])(info.getBlockWeightMedian());
  (0, _assert["default"])(info.getDatabaseSize() > 0);
  (0, _assert["default"])(typeof info.getUpdateAvailable() === "boolean");

  _TestUtils["default"].testUnsignedBigInt(info.getCredits(), false);

  _assert["default"].equal((0, _typeof2["default"])(info.getTopBlockHash()), "string");

  (0, _assert["default"])(info.getTopBlockHash());

  _assert["default"].equal("boolean", (0, _typeof2["default"])(info.isBusySyncing()));

  _assert["default"].equal("boolean", (0, _typeof2["default"])(info.isSynchronized()));
}

function testSyncInfo(syncInfo) {
  // TODO: consistent naming, daemon in name?
  (0, _assert["default"])(syncInfo instanceof _index.MoneroDaemonSyncInfo);
  (0, _assert["default"])(syncInfo.getHeight() >= 0);

  if (syncInfo.getPeers() !== undefined) {
    (0, _assert["default"])(syncInfo.getPeers().length > 0);

    var _iterator32 = _createForOfIteratorHelper(syncInfo.getPeers()),
        _step32;

    try {
      for (_iterator32.s(); !(_step32 = _iterator32.n()).done;) {
        var peer = _step32.value;
        testPeer(peer);
      }
    } catch (err) {
      _iterator32.e(err);
    } finally {
      _iterator32.f();
    }
  }

  if (syncInfo.getSpans() !== undefined) {
    // TODO: test that this is being hit, so far not used
    (0, _assert["default"])(syncInfo.getSpans().length > 0);

    var _iterator33 = _createForOfIteratorHelper(syncInfo.getSpans()),
        _step33;

    try {
      for (_iterator33.s(); !(_step33 = _iterator33.n()).done;) {
        var span = _step33.value;
        testConnectionSpan(span);
      }
    } catch (err) {
      _iterator33.e(err);
    } finally {
      _iterator33.f();
    }
  }

  (0, _assert["default"])(syncInfo.getNextNeededPruningSeed() >= 0);

  _assert["default"].equal(syncInfo.getOverview(), undefined);

  _TestUtils["default"].testUnsignedBigInt(syncInfo.getCredits(), false);

  _assert["default"].equal(syncInfo.getTopBlockHash(), undefined);
}

function testConnectionSpan(span) {
  _assert["default"].notEqual(span, undefined);

  _assert["default"].notEqual(span.getConnectionId(), undefined);

  (0, _assert["default"])(span.getConnectionId().length > 0);
  (0, _assert["default"])(span.getStartHeight() > 0);
  (0, _assert["default"])(span.getNumBlocks() > 0);
  (0, _assert["default"])(span.getRemoteAddress() === undefined || span.getRemoteAddress().length > 0);
  (0, _assert["default"])(span.getRate() > 0);
  (0, _assert["default"])(span.getSpeed() >= 0);
  (0, _assert["default"])(span.getSize() > 0);
}

function testHardForkInfo(hardForkInfo) {
  _assert["default"].notEqual(hardForkInfo.getEarliestHeight(), undefined);

  _assert["default"].notEqual(hardForkInfo.isEnabled(), undefined);

  _assert["default"].notEqual(hardForkInfo.getState(), undefined);

  _assert["default"].notEqual(hardForkInfo.getThreshold(), undefined);

  _assert["default"].notEqual(hardForkInfo.getVersion(), undefined);

  _assert["default"].notEqual(hardForkInfo.getNumVotes(), undefined);

  _assert["default"].notEqual(hardForkInfo.getVoting(), undefined);

  _assert["default"].notEqual(hardForkInfo.getWindow(), undefined);

  _TestUtils["default"].testUnsignedBigInt(hardForkInfo.getCredits(), false);

  _assert["default"].equal(hardForkInfo.getTopBlockHash(), undefined);
}

function testMoneroBan(ban) {
  _assert["default"].notEqual(ban.getHost(), undefined);

  _assert["default"].notEqual(ban.getIp(), undefined);

  _assert["default"].notEqual(ban.getSeconds(), undefined);
}

function testMinerTxSum(txSum) {
  _TestUtils["default"].testUnsignedBigInt(txSum.getEmissionSum(), true);

  _TestUtils["default"].testUnsignedBigInt(txSum.getFeeSum(), true);
}

function testOutputHistogramEntry(entry) {
  _TestUtils["default"].testUnsignedBigInt(entry.getAmount());

  (0, _assert["default"])(entry.getNumInstances() >= 0);
  (0, _assert["default"])(entry.getNumUnlockedInstances() >= 0);
  (0, _assert["default"])(entry.getNumRecentInstances() >= 0);
}

function testOutputDistributionEntry(entry) {
  _TestUtils["default"].testUnsignedBigInt(entry.getAmount());

  (0, _assert["default"])(entry.getBase() >= 0);
  (0, _assert["default"])(Array.isArray(entry.getDistribution()) && entry.getDistribution().length > 0);
  (0, _assert["default"])(entry.getStartHeight() >= 0);
}

function testSubmitTxResultGood(result) {
  testSubmitTxResultCommon(result);

  try {
    _assert["default"].equal(result.isDoubleSpendSeen(), false, "tx submission is double spend.");

    _assert["default"].equal(result.isFeeTooLow(), false);

    _assert["default"].equal(result.isMixinTooLow(), false);

    _assert["default"].equal(result.hasInvalidInput(), false);

    _assert["default"].equal(result.hasInvalidOutput(), false);

    _assert["default"].equal(result.hasTooFewOutputs(), false);

    _assert["default"].equal(result.isOverspend(), false);

    _assert["default"].equal(result.isTooBig(), false);

    _assert["default"].equal(result.getSanityCheckFailed(), false);

    _TestUtils["default"].testUnsignedBigInt(result.getCredits(), false); // 0 credits


    _assert["default"].equal(result.getTopBlockHash(), undefined);

    _assert["default"].equal(result.isGood(), true);
  } catch (e) {
    console.log("Submit result is not good: " + JSON.stringify(result));
    throw e;
  }
}

function testSubmitTxResultDoubleSpend(result) {
  testSubmitTxResultCommon(result);

  _assert["default"].equal(result.isGood(), false);

  _assert["default"].equal(result.isDoubleSpendSeen(), true);

  _assert["default"].equal(result.isFeeTooLow(), false);

  _assert["default"].equal(result.isMixinTooLow(), false);

  _assert["default"].equal(result.hasInvalidInput(), false);

  _assert["default"].equal(result.hasInvalidOutput(), false);

  _assert["default"].equal(result.isOverspend(), false);

  _assert["default"].equal(result.isTooBig(), false);
}

function testSubmitTxResultCommon(result) {
  _assert["default"].equal((0, _typeof2["default"])(result.isGood()), "boolean");

  _assert["default"].equal((0, _typeof2["default"])(result.isRelayed()), "boolean");

  _assert["default"].equal((0, _typeof2["default"])(result.isDoubleSpendSeen()), "boolean");

  _assert["default"].equal((0, _typeof2["default"])(result.isFeeTooLow()), "boolean");

  _assert["default"].equal((0, _typeof2["default"])(result.isMixinTooLow()), "boolean");

  _assert["default"].equal((0, _typeof2["default"])(result.hasInvalidInput()), "boolean");

  _assert["default"].equal((0, _typeof2["default"])(result.hasInvalidOutput()), "boolean");

  _assert["default"].equal((0, _typeof2["default"])(result.isOverspend()), "boolean");

  _assert["default"].equal((0, _typeof2["default"])(result.isTooBig()), "boolean");

  _assert["default"].equal((0, _typeof2["default"])(result.getSanityCheckFailed()), "boolean");

  (0, _assert["default"])(result.getReason() === undefined || result.getReason().length > 0);
}

function testTxPoolStats(stats) {
  (0, _assert["default"])(stats);
  (0, _assert["default"])(stats.getNumTxs() >= 0);

  if (stats.getNumTxs() > 0) {
    if (stats.getNumTxs() === 1) _assert["default"].equal(stats.getHisto(), undefined);else {
      (0, _assert["default"])(stats.getHisto());
      console.log(stats.getHisto());
      throw new Error("Ready to test histogram");
    }
    (0, _assert["default"])(stats.getBytesMax() > 0);
    (0, _assert["default"])(stats.getBytesMed() > 0);
    (0, _assert["default"])(stats.getBytesMin() > 0);
    (0, _assert["default"])(stats.getBytesTotal() > 0);
    (0, _assert["default"])(stats.getHisto98pc() === undefined || stats.getHisto98pc() > 0);
    (0, _assert["default"])(stats.getOldestTimestamp() > 0);
    (0, _assert["default"])(stats.getNum10m() >= 0);
    (0, _assert["default"])(stats.getNumDoubleSpends() >= 0);
    (0, _assert["default"])(stats.getNumFailing() >= 0);
    (0, _assert["default"])(stats.getNumNotRelayed() >= 0);
  } else {
    _assert["default"].equal(stats.getBytesMax(), undefined);

    _assert["default"].equal(stats.getBytesMed(), undefined);

    _assert["default"].equal(stats.getBytesMin(), undefined);

    _assert["default"].equal(stats.getBytesTotal(), 0);

    _assert["default"].equal(stats.getHisto98pc(), undefined);

    _assert["default"].equal(stats.getOldestTimestamp(), undefined);

    _assert["default"].equal(stats.getNum10m(), 0);

    _assert["default"].equal(stats.getNumDoubleSpends(), 0);

    _assert["default"].equal(stats.getNumFailing(), 0);

    _assert["default"].equal(stats.getNumNotRelayed(), 0);

    _assert["default"].equal(stats.getHisto(), undefined);
  }
}

function getUnrelayedTx(_x9, _x10) {
  return _getUnrelayedTx.apply(this, arguments);
}

function _getUnrelayedTx() {
  _getUnrelayedTx = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee65(wallet, accountIdx) {
    var config, tx;
    return _regenerator["default"].wrap(function _callee65$(_context65) {
      while (1) {
        switch (_context65.prev = _context65.next) {
          case 0:
            _context65.t0 = _index.MoneroTxConfig;
            _context65.t1 = accountIdx;
            _context65.next = 4;
            return wallet.getPrimaryAddress();

          case 4:
            _context65.t2 = _context65.sent;
            _context65.t3 = _TestUtils["default"].MAX_FEE;
            _context65.t4 = {
              accountIndex: _context65.t1,
              address: _context65.t2,
              amount: _context65.t3
            };
            config = new _context65.t0(_context65.t4);
            _context65.next = 10;
            return wallet.createTx(config);

          case 10:
            tx = _context65.sent;
            (0, _assert["default"])(tx.getFullHex());

            _assert["default"].equal(tx.getRelay(), false);

            return _context65.abrupt("return", tx);

          case 14:
          case "end":
            return _context65.stop();
        }
      }
    }, _callee65);
  }));
  return _getUnrelayedTx.apply(this, arguments);
}

function testVin(input, ctx) {
  testOutput(input);
  testKeyImage(input.getKeyImage(), ctx);
  (0, _assert["default"])(input.getRingOutputIndices() && Array.isArray(input.getRingOutputIndices()) && input.getRingOutputIndices().length > 0);

  var _iterator34 = _createForOfIteratorHelper(input.getRingOutputIndices()),
      _step34;

  try {
    for (_iterator34.s(); !(_step34 = _iterator34.n()).done;) {
      var index = _step34.value;

      _assert["default"].equal((0, _typeof2["default"])(index), "number");

      (0, _assert["default"])(index >= 0);
    }
  } catch (err) {
    _iterator34.e(err);
  } finally {
    _iterator34.f();
  }
}

function testKeyImage(image, ctx) {
  (0, _assert["default"])(image instanceof _index.MoneroKeyImage);
  (0, _assert["default"])(image.getHex());

  if (image.getSignature() !== undefined) {
    _assert["default"].equal((0, _typeof2["default"])(image.getSignature()), "string");

    (0, _assert["default"])(image.getSignature().length > 0);
  }
}

function testOutput(output, ctx) {
  (0, _assert["default"])(output instanceof _index.MoneroOutput);

  _TestUtils["default"].testUnsignedBigInt(output.getAmount());

  if (ctx) {
    if (output.getTx().inTxPool() || ctx.fromGetTxPool || ctx.hasOutputIndices === false) _assert["default"].equal(output.getIndex(), undefined); // TODO: get_blocks_by_height.bin (#5127), get_transaction_pool, and tx pool txs do not return output indices 
    else (0, _assert["default"])(output.getIndex() >= 0);
    (0, _assert["default"])(output.getStealthPublicKey() && output.getStealthPublicKey().length === 64);
  }
}

function getConfirmedTxs(_x11, _x12) {
  return _getConfirmedTxs.apply(this, arguments);
}

function _getConfirmedTxs() {
  _getConfirmedTxs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee66(daemon, numTxs) {
    var txs, numBlocksPerReq, startIdx, blocks, _iterator35, _step35, block, _iterator36, _step36, tx;

    return _regenerator["default"].wrap(function _callee66$(_context66) {
      while (1) {
        switch (_context66.prev = _context66.next) {
          case 0:
            txs = [];
            numBlocksPerReq = 50;
            _context66.next = 4;
            return daemon.getHeight();

          case 4:
            _context66.t0 = _context66.sent;
            _context66.t1 = numBlocksPerReq;
            _context66.t2 = _context66.t0 - _context66.t1;
            startIdx = _context66.t2 - 1;

          case 8:
            if (!(startIdx >= 0)) {
              _context66.next = 50;
              break;
            }

            _context66.next = 11;
            return daemon.getBlocksByRange(startIdx, startIdx + numBlocksPerReq);

          case 11:
            blocks = _context66.sent;
            _iterator35 = _createForOfIteratorHelper(blocks);
            _context66.prev = 13;

            _iterator35.s();

          case 15:
            if ((_step35 = _iterator35.n()).done) {
              _context66.next = 39;
              break;
            }

            block = _step35.value;

            if (block.getTxs()) {
              _context66.next = 19;
              break;
            }

            return _context66.abrupt("continue", 37);

          case 19:
            _iterator36 = _createForOfIteratorHelper(block.getTxs());
            _context66.prev = 20;

            _iterator36.s();

          case 22:
            if ((_step36 = _iterator36.n()).done) {
              _context66.next = 29;
              break;
            }

            tx = _step36.value;
            txs.push(tx);

            if (!(txs.length === numTxs)) {
              _context66.next = 27;
              break;
            }

            return _context66.abrupt("return", txs);

          case 27:
            _context66.next = 22;
            break;

          case 29:
            _context66.next = 34;
            break;

          case 31:
            _context66.prev = 31;
            _context66.t3 = _context66["catch"](20);

            _iterator36.e(_context66.t3);

          case 34:
            _context66.prev = 34;

            _iterator36.f();

            return _context66.finish(34);

          case 37:
            _context66.next = 15;
            break;

          case 39:
            _context66.next = 44;
            break;

          case 41:
            _context66.prev = 41;
            _context66.t4 = _context66["catch"](13);

            _iterator35.e(_context66.t4);

          case 44:
            _context66.prev = 44;

            _iterator35.f();

            return _context66.finish(44);

          case 47:
            startIdx -= numBlocksPerReq;
            _context66.next = 8;
            break;

          case 50:
            throw new Error("Could not get " + numTxs + " confirmed txs");

          case 51:
          case "end":
            return _context66.stop();
        }
      }
    }, _callee66, null, [[13, 41, 44, 47], [20, 31, 34, 37]]);
  }));
  return _getConfirmedTxs.apply(this, arguments);
}

function testAltChain(altChain) {
  (0, _assert["default"])(altChain instanceof _index.MoneroAltChain);
  (0, _assert["default"])(Array.isArray(altChain.getBlockHashes()) && altChain.getBlockHashes().length > 0);

  _TestUtils["default"].testUnsignedBigInt(altChain.getDifficulty(), true);

  (0, _assert["default"])(altChain.getHeight() > 0);
  (0, _assert["default"])(altChain.getLength() > 0);
  (0, _assert["default"])(altChain.getMainChainParentBlockHash().length === 64);
}

function testPeer(peer) {
  (0, _assert["default"])(peer instanceof _index.MoneroPeer);
  testKnownPeer(peer, true);
  (0, _assert["default"])(peer.getId());
  (0, _assert["default"])(peer.getAvgDownload() >= 0);
  (0, _assert["default"])(peer.getAvgUpload() >= 0);
  (0, _assert["default"])(peer.getCurrentDownload() >= 0);
  (0, _assert["default"])(peer.getCurrentUpload() >= 0);
  (0, _assert["default"])(peer.getHeight() >= 0);
  (0, _assert["default"])(peer.getLiveTime() >= 0);

  _assert["default"].equal((0, _typeof2["default"])(peer.isLocalIp()), "boolean");

  _assert["default"].equal((0, _typeof2["default"])(peer.isLocalHost()), "boolean");

  (0, _assert["default"])(peer.getNumReceives() >= 0);
  (0, _assert["default"])(peer.getReceiveIdleTime() >= 0);
  (0, _assert["default"])(peer.getNumSends() >= 0);
  (0, _assert["default"])(peer.getSendIdleTime() >= 0);
  (0, _assert["default"])(peer.getState());
  (0, _assert["default"])(peer.getNumSupportFlags() >= 0);

  _index.ConnectionType.validate(peer.getType());
}

function testKnownPeer(peer, fromConnection) {
  (0, _assert["default"])(peer instanceof _index.MoneroPeer);

  _assert["default"].equal((0, _typeof2["default"])(peer.getId()), "string");

  _assert["default"].equal((0, _typeof2["default"])(peer.getHost()), "string");

  (0, _assert["default"])(typeof peer.getPort() === "number");
  (0, _assert["default"])(peer.getPort() > 0);
  (0, _assert["default"])(peer.getRpcPort() === undefined || typeof peer.getRpcPort() === "number" && peer.getRpcPort() >= 0);

  _assert["default"].equal((0, _typeof2["default"])(peer.isOnline()), "boolean");

  if (peer.getRpcCreditsPerHash() !== undefined) _TestUtils["default"].testUnsignedBigInt(peer.getRpcCreditsPerHash());
  if (fromConnection) _assert["default"].equal(undefined, peer.getLastSeenTimestamp());else {
    if (peer.getLastSeenTimestamp() < 0) console("Last seen timestamp is invalid: " + peer.getLastSeenTimestamp());
    (0, _assert["default"])(peer.getLastSeenTimestamp() >= 0);
  }
  (0, _assert["default"])(peer.getPruningSeed() === undefined || peer.getPruningSeed() >= 0);
}

function testUpdateCheckResult(result) {
  (0, _assert["default"])(result instanceof MoneroDaemonUpdateCheckResult);

  _assert["default"].equal((0, _typeof2["default"])(result.isUpdateAvailable()), "boolean");

  if (result.isUpdateAvailable()) {
    (0, _assert["default"])(result.getAutoUri(), "No auto uri; is daemon online?");
    (0, _assert["default"])(result.getUserUri());

    _assert["default"].equal((0, _typeof2["default"])(result.getVersion()), "string");

    _assert["default"].equal((0, _typeof2["default"])(result.getHash()), "string");

    _assert["default"].equal(result.getHash().length, 64);
  } else {
    _assert["default"].equal(result.getAutoUri(), undefined);

    _assert["default"].equal(result.getUserUri(), undefined);

    _assert["default"].equal(result.getVersion(), undefined);

    _assert["default"].equal(result.getHash(), undefined);
  }
}

function testUpdateDownloadResult(result, path) {
  testUpdateCheckResult(result);

  if (result.isUpdateAvailable()) {
    if (path) _assert["default"].equal(result.getDownloadPath(), path);else (0, _assert["default"])(result.getDownloadPath());
  } else {
    _assert["default"].equal(result.getDownloadPath(), undefined);
  }
}

function getConfirmedTxHashes(_x13) {
  return _getConfirmedTxHashes.apply(this, arguments);
}

function _getConfirmedTxHashes() {
  _getConfirmedTxHashes = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee67(daemon) {
    var numTxs, txHashes, height, block, _iterator37, _step37, txHash;

    return _regenerator["default"].wrap(function _callee67$(_context67) {
      while (1) {
        switch (_context67.prev = _context67.next) {
          case 0:
            numTxs = 5;
            txHashes = [];
            _context67.next = 4;
            return daemon.getHeight();

          case 4:
            height = _context67.sent;

          case 5:
            if (!(txHashes.length < numTxs && height > 0)) {
              _context67.next = 13;
              break;
            }

            _context67.next = 8;
            return daemon.getBlockByHeight(--height);

          case 8:
            block = _context67.sent;
            _iterator37 = _createForOfIteratorHelper(block.getTxHashes());

            try {
              for (_iterator37.s(); !(_step37 = _iterator37.n()).done;) {
                txHash = _step37.value;
                txHashes.push(txHash);
              }
            } catch (err) {
              _iterator37.e(err);
            } finally {
              _iterator37.f();
            }

            _context67.next = 5;
            break;

          case 13:
            return _context67.abrupt("return", txHashes);

          case 14:
          case "end":
            return _context67.stop();
        }
      }
    }, _callee67);
  }));
  return _getConfirmedTxHashes.apply(this, arguments);
}

function testTxCopy(tx, ctx) {
  // copy tx and test
  var copy = tx.copy();
  (0, _assert["default"])(copy instanceof _index.MoneroTx);

  _assert["default"].equal(copy.getBlock(), undefined);

  if (tx.getBlock()) copy.setBlock(tx.getBlock().copy().setTxs([copy])); // copy block for testing equality

  _assert["default"].equal(copy.toString(), tx.toString()); // test different input references


  if (copy.getInputs() === undefined) _assert["default"].equal(tx.getInputs(), undefined);else {
    (0, _assert["default"])(copy.getInputs() !== tx.getInputs());

    for (var i = 0; i < copy.getInputs().length; i++) {
      _assert["default"].equal(0, _index.GenUtils.compareBigInt(tx.getInputs()[i].getAmount(), copy.getInputs()[i].getAmount()));
    }
  } // test different output references

  if (copy.getOutputs() === undefined) _assert["default"].equal(tx.getOutputs(), undefined);else {
    (0, _assert["default"])(copy.getOutputs() !== tx.getOutputs());

    for (var _i5 = 0; _i5 < copy.getOutputs().length; _i5++) {
      _assert["default"].equal(0, _index.GenUtils.compareBigInt(tx.getOutputs()[_i5].getAmount(), copy.getOutputs()[_i5].getAmount()));
    }
  } // test copied tx

  ctx = Object.assign({}, ctx);
  ctx.doNotTestCopy = true;
  if (tx.getBlock()) copy.setBlock(tx.getBlock().copy().setTxs([copy])); // copy block for testing

  testTx(copy, ctx); // test merging with copy

  var merged = copy.merge(copy.copy());

  _assert["default"].equal(merged.toString(), tx.toString());
}

var _default = TestMoneroDaemonRpc;
exports["default"] = _default;