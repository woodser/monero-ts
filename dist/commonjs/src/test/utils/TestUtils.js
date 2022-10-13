"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime/helpers/slicedToArray"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assert = _interopRequireDefault(require("assert"));

var _WalletSyncPrinter = _interopRequireDefault(require("./WalletSyncPrinter"));

var _index = require("../../../index");

var _WalletTxTracker = _interopRequireDefault(require("./WalletTxTracker"));

/**
 * Collection of test utilities and configurations.
 * 
 * TODO: move hard coded to config
 */
var TestUtils = /*#__PURE__*/function () {
  function TestUtils() {
    (0, _classCallCheck2["default"])(this, TestUtils);
  }

  (0, _createClass2["default"])(TestUtils, null, [{
    key: "getDefaultFs",
    value:
    /**
     * Get a default file system.  Uses an in-memory file system if running in the browser.
     * 
     * @return nodejs-compatible file system
     */
    function getDefaultFs() {
      if (!_index.LibraryUtils.FS) _index.LibraryUtils.FS = _index.GenUtils.isBrowser() ? require('memfs') : require('fs');
      return _index.LibraryUtils.FS;
    }
    /**
     * Get a singleton daemon RPC instance shared among tests.
     * 
     * @return {MoneroDaemonRpc} a daemon RPC instance
     */

  }, {
    key: "getDaemonRpc",
    value: function () {
      var _getDaemonRpc = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(TestUtils.daemonRpc === undefined)) {
                  _context.next = 4;
                  break;
                }

                _context.next = 3;
                return (0, _index.connectToDaemonRpc)(Object.assign({
                  proxyToWorker: TestUtils.PROXY_TO_WORKER
                }, TestUtils.DAEMON_RPC_CONFIG));

              case 3:
                TestUtils.daemonRpc = _context.sent;

              case 4:
                return _context.abrupt("return", TestUtils.daemonRpc);

              case 5:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      function getDaemonRpc() {
        return _getDaemonRpc.apply(this, arguments);
      }

      return getDaemonRpc;
    }()
    /**
     * Get a singleton instance of a monero-daemon-rpc client.
     */

  }, {
    key: "getDaemonRpcConnection",
    value: function getDaemonRpcConnection() {
      return new _index.MoneroRpcConnection(TestUtils.DAEMON_RPC_CONFIG);
    }
    /**
     * Get a singleton instance of a monero-wallet-rpc client.
     * 
     * @return {MoneroWalletRpc} a wallet RPC instance
     */

  }, {
    key: "getWalletRpc",
    value: function () {
      var _getWalletRpc = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!(TestUtils.walletRpc === undefined)) {
                  _context2.next = 4;
                  break;
                }

                _context2.next = 3;
                return (0, _index.connectToWalletRpc)(TestUtils.WALLET_RPC_CONFIG);

              case 3:
                TestUtils.walletRpc = _context2.sent;

              case 4:
                _context2.prev = 4;
                _context2.next = 7;
                return TestUtils.walletRpc.openWallet({
                  path: TestUtils.WALLET_NAME,
                  password: TestUtils.WALLET_PASSWORD
                });

              case 7:
                _context2.next = 19;
                break;

              case 9:
                _context2.prev = 9;
                _context2.t0 = _context2["catch"](4);

                if (_context2.t0 instanceof _index.MoneroRpcError) {
                  _context2.next = 13;
                  break;
                }

                throw _context2.t0;

              case 13:
                if (!(_context2.t0.getCode() === -1)) {
                  _context2.next = 18;
                  break;
                }

                _context2.next = 16;
                return TestUtils.walletRpc.createWallet({
                  path: TestUtils.WALLET_NAME,
                  password: TestUtils.WALLET_PASSWORD,
                  mnemonic: TestUtils.MNEMONIC,
                  restoreHeight: TestUtils.FIRST_RECEIVE_HEIGHT
                });

              case 16:
                _context2.next = 19;
                break;

              case 18:
                throw _context2.t0;

              case 19:
                _context2.t1 = _assert["default"];
                _context2.next = 22;
                return TestUtils.walletRpc.getMnemonic();

              case 22:
                _context2.t2 = _context2.sent;
                _context2.t3 = TestUtils.MNEMONIC;

                _context2.t1.equal.call(_context2.t1, _context2.t2, _context2.t3);

                _context2.t4 = _assert["default"];
                _context2.next = 28;
                return TestUtils.walletRpc.getPrimaryAddress();

              case 28:
                _context2.t5 = _context2.sent;
                _context2.t6 = TestUtils.ADDRESS;

                _context2.t4.equal.call(_context2.t4, _context2.t5, _context2.t6);

                _context2.next = 33;
                return TestUtils.walletRpc.sync();

              case 33:
                _context2.next = 35;
                return TestUtils.walletRpc.save();

              case 35:
                _context2.next = 37;
                return TestUtils.walletRpc.startSyncing(TestUtils.SYNC_PERIOD_IN_MS);

              case 37:
                return _context2.abrupt("return", TestUtils.walletRpc);

              case 38:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, null, [[4, 9]]);
      }));

      function getWalletRpc() {
        return _getWalletRpc.apply(this, arguments);
      }

      return getWalletRpc;
    }()
    /**
     * Create a monero-wallet-rpc process bound to the next available port.
     *
     * @param {boolean} offline - wallet is started in offline mode 
     * @return {Promise<MoneroWalletRpc>} - client connected to an internal monero-wallet-rpc instance
     */

  }, {
    key: "startWalletRpcProcess",
    value: function () {
      var _startWalletRpcProcess = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(offline) {
        var portOffset, wallet, uri, cmd;
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                // get next available offset of ports to bind to
                portOffset = 1;

                while (Object.keys(TestUtils.WALLET_PORT_OFFSETS).includes("" + portOffset)) {
                  portOffset++;
                }

                TestUtils.WALLET_PORT_OFFSETS[portOffset] = undefined; // reserve port
                // create or connect to monero-wallet-rpc process

                if (!_index.GenUtils.isBrowser()) {
                  _context3.next = 10;
                  break;
                }

                uri = TestUtils.WALLET_RPC_CONFIG.uri.substring(0, TestUtils.WALLET_RPC_CONFIG.uri.lastIndexOf(":")) + ":" + (TestUtils.WALLET_RPC_PORT_START + portOffset);
                _context3.next = 7;
                return (0, _index.connectToWalletRpc)(uri, TestUtils.WALLET_RPC_CONFIG.username, TestUtils.WALLET_RPC_CONFIG.password);

              case 7:
                wallet = _context3.sent;
                _context3.next = 16;
                break;

              case 10:
                // create command to start client with internal monero-wallet-rpc process
                cmd = [TestUtils.WALLET_RPC_LOCAL_PATH, "--" + _index.MoneroNetworkType.toString(TestUtils.NETWORK_TYPE), "--rpc-bind-port", "" + (TestUtils.WALLET_RPC_PORT_START + portOffset), "--rpc-login", TestUtils.WALLET_RPC_CONFIG.username + ":" + TestUtils.WALLET_RPC_CONFIG.password, "--wallet-dir", TestUtils.WALLET_RPC_LOCAL_WALLET_DIR, "--rpc-access-control-origins", TestUtils.WALLET_RPC_ACCESS_CONTROL_ORIGINS];
                if (offline) cmd.push("--offline");else cmd.push("--daemon-address", TestUtils.DAEMON_RPC_CONFIG.uri);
                if (TestUtils.DAEMON_RPC_CONFIG.username) cmd.push("--daemon-login", TestUtils.DAEMON_RPC_CONFIG.username + ":" + TestUtils.DAEMON_RPC_CONFIG.password); // TODO: include zmq params when supported and enabled
                // create and connect to monero-wallet-rpc process

                _context3.next = 15;
                return (0, _index.connectToWalletRpc)(cmd);

              case 15:
                wallet = _context3.sent;

              case 16:
                // register wallet with port offset
                TestUtils.WALLET_PORT_OFFSETS[portOffset] = wallet;
                return _context3.abrupt("return", wallet);

              case 18:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }));

      function startWalletRpcProcess(_x) {
        return _startWalletRpcProcess.apply(this, arguments);
      }

      return startWalletRpcProcess;
    }()
    /**
     * Stop a monero-wallet-rpc process and release its port.
     * 
     * @param {MoneroWalletRpc} walletRpc - wallet created with internal monero-wallet-rpc process
     */

  }, {
    key: "stopWalletRpcProcess",
    value: function () {
      var _stopWalletRpcProcess = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(walletRpc) {
        var portOffset, _i, _Object$entries, _Object$entries$_i, key, value;

        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                (0, _assert["default"])(walletRpc instanceof _index.MoneroWalletRpc, "Must provide instance of MoneroWalletRpc to close"); // get corresponding port

                _i = 0, _Object$entries = Object.entries(TestUtils.WALLET_PORT_OFFSETS);

              case 2:
                if (!(_i < _Object$entries.length)) {
                  _context4.next = 10;
                  break;
                }

                _Object$entries$_i = (0, _slicedToArray2["default"])(_Object$entries[_i], 2), key = _Object$entries$_i[0], value = _Object$entries$_i[1];

                if (!(value === walletRpc)) {
                  _context4.next = 7;
                  break;
                }

                portOffset = key;
                return _context4.abrupt("break", 10);

              case 7:
                _i++;
                _context4.next = 2;
                break;

              case 10:
                if (!(portOffset === undefined)) {
                  _context4.next = 12;
                  break;
                }

                throw new Error("Wallet not registered");

              case 12:
                // unregister wallet with port offset
                delete TestUtils.WALLET_PORT_OFFSETS[portOffset];

                if (_index.GenUtils.isBrowser()) {
                  _context4.next = 16;
                  break;
                }

                _context4.next = 16;
                return walletRpc.stopProcess();

              case 16:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4);
      }));

      function stopWalletRpcProcess(_x2) {
        return _stopWalletRpcProcess.apply(this, arguments);
      }

      return stopWalletRpcProcess;
    }()
    /**
     * Get a singleton instance of a wallet supported by WebAssembly bindings to monero-project's wallet2.
     * 
     * @return {MoneroWalletFull} a full wallet instance
     */

  }, {
    key: "getWalletFull",
    value: function () {
      var _getWalletFull = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5() {
        var fs;
        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.t0 = !TestUtils.walletFull;

                if (_context5.t0) {
                  _context5.next = 5;
                  break;
                }

                _context5.next = 4;
                return TestUtils.walletFull.isClosed();

              case 4:
                _context5.t0 = _context5.sent;

              case 5:
                if (!_context5.t0) {
                  _context5.next = 35;
                  break;
                }

                // create wallet from mnemonic phrase if it doesn't exist
                fs = TestUtils.getDefaultFs();
                _context5.next = 9;
                return _index.MoneroWalletFull.walletExists(TestUtils.WALLET_FULL_PATH, fs);

              case 9:
                if (_context5.sent) {
                  _context5.next = 28;
                  break;
                }

                // create directory for test wallets if it doesn't exist
                if (!fs.existsSync(TestUtils.TEST_WALLETS_DIR)) {
                  if (!fs.existsSync(process.cwd())) fs.mkdirSync(process.cwd(), {
                    recursive: true
                  }); // create current process directory for relative paths which does not exist in memory fs

                  fs.mkdirSync(TestUtils.TEST_WALLETS_DIR);
                } // create wallet with connection


                _context5.next = 13;
                return (0, _index.createWalletFull)({
                  path: TestUtils.WALLET_FULL_PATH,
                  password: TestUtils.WALLET_PASSWORD,
                  networkType: TestUtils.NETWORK_TYPE,
                  mnemonic: TestUtils.MNEMONIC,
                  server: TestUtils.getDaemonRpcConnection(),
                  restoreHeight: TestUtils.FIRST_RECEIVE_HEIGHT,
                  proxyToWorker: TestUtils.PROXY_TO_WORKER,
                  fs: fs
                });

              case 13:
                TestUtils.walletFull = _context5.sent;
                _context5.t1 = _assert["default"];
                _context5.next = 17;
                return TestUtils.walletFull.getSyncHeight();

              case 17:
                _context5.t2 = _context5.sent;
                _context5.t3 = TestUtils.FIRST_RECEIVE_HEIGHT;

                _context5.t1.equal.call(_context5.t1, _context5.t2, _context5.t3);

                _context5.next = 22;
                return TestUtils.walletFull.sync(new _WalletSyncPrinter["default"]());

              case 22:
                _context5.next = 24;
                return TestUtils.walletFull.save();

              case 24:
                _context5.next = 26;
                return TestUtils.walletFull.startSyncing(TestUtils.SYNC_PERIOD_IN_MS);

              case 26:
                _context5.next = 35;
                break;

              case 28:
                _context5.next = 30;
                return (0, _index.openWalletFull)({
                  path: TestUtils.WALLET_FULL_PATH,
                  password: TestUtils.WALLET_PASSWORD,
                  networkType: TestUtils.NETWORK_TYPE,
                  server: TestUtils.getDaemonRpcConnection(),
                  proxyToWorker: TestUtils.PROXY_TO_WORKER,
                  fs: TestUtils.getDefaultFs()
                });

              case 30:
                TestUtils.walletFull = _context5.sent;
                _context5.next = 33;
                return TestUtils.walletFull.sync(new _WalletSyncPrinter["default"]());

              case 33:
                _context5.next = 35;
                return TestUtils.walletFull.startSyncing(TestUtils.SYNC_PERIOD_IN_MS);

              case 35:
                _context5.t4 = _assert["default"];
                _context5.next = 38;
                return TestUtils.walletFull.getMnemonic();

              case 38:
                _context5.t5 = _context5.sent;
                _context5.t6 = TestUtils.MNEMONIC;

                _context5.t4.equal.call(_context5.t4, _context5.t5, _context5.t6);

                _context5.t7 = _assert["default"];
                _context5.next = 44;
                return TestUtils.walletFull.getPrimaryAddress();

              case 44:
                _context5.t8 = _context5.sent;
                _context5.t9 = TestUtils.ADDRESS;

                _context5.t7.equal.call(_context5.t7, _context5.t8, _context5.t9);

                return _context5.abrupt("return", TestUtils.walletFull);

              case 48:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5);
      }));

      function getWalletFull() {
        return _getWalletFull.apply(this, arguments);
      }

      return getWalletFull;
    }()
    /**
     * Get a singleton keys-only wallet instance shared among tests.
     * 
     * @return {MoneroWalletKeys} a keys-only wallet instance
     */

  }, {
    key: "getWalletKeys",
    value: function () {
      var _getWalletKeys = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6() {
        return _regenerator["default"].wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                if (!(TestUtils.walletKeys === undefined)) {
                  _context6.next = 4;
                  break;
                }

                _context6.next = 3;
                return createWalletKeys({
                  networkType: TestUtils.NETWORK_TYPE,
                  mnemonic: TestUtils.MNEMONIC
                });

              case 3:
                TestUtils.walletKeys = _context6.sent;

              case 4:
                return _context6.abrupt("return", TestUtils.walletKeys);

              case 5:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6);
      }));

      function getWalletKeys() {
        return _getWalletKeys.apply(this, arguments);
      }

      return getWalletKeys;
    }()
  }, {
    key: "testUnsignedBigInt",
    value: function testUnsignedBigInt(num, nonZero) {
      (0, _assert["default"])(num);
      (0, _assert["default"])(num instanceof BigInt);

      var comparison = _index.GenUtils.compareBigInt(num, BigInt(0));

      (0, _assert["default"])(comparison >= 0);
      if (nonZero === true) (0, _assert["default"])(comparison > 0);
      if (nonZero === false) (0, _assert["default"])(comparison === 0);
    }
  }, {
    key: "getExternalWalletAddress",
    value: function () {
      var _getExternalWalletAddress = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7() {
        var wallet;
        return _regenerator["default"].wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                _context7.next = 2;
                return createWalletKeys({
                  networkType: TestUtils.NETWORK_TYPE
                });

              case 2:
                wallet = _context7.sent;
                _context7.next = 5;
                return wallet.getAddress(0, 1);

              case 5:
                return _context7.abrupt("return", _context7.sent);

              case 6:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7);
      }));

      function getExternalWalletAddress() {
        return _getExternalWalletAddress.apply(this, arguments);
      }

      return getExternalWalletAddress;
    }()
  }, {
    key: "txsMergeable",
    value: function txsMergeable(tx1, tx2) {
      try {
        var copy1 = tx1.copy();
        var copy2 = tx2.copy();
        if (copy1.isConfirmed()) copy1.setBlock(tx1.getBlock().copy().setTxs([copy1]));
        if (copy2.isConfirmed()) copy2.setBlock(tx2.getBlock().copy().setTxs([copy2]));
        copy1.merge(copy2);
        return true;
      } catch (e) {
        console.error(e);
        return false;
      }
    }
  }]);
  return TestUtils;
}(); // ---------------------------- STATIC TEST CONFIG ----------------------------
// TODO: export these to key/value properties file for tests
// directory with monero binaries to test (monerod and monero-wallet-rpc)


TestUtils.MONERO_BINS_DIR = "~/git/haveno/.localnet"; // test wallet config

TestUtils.WALLET_NAME = "test_wallet_1";
TestUtils.WALLET_PASSWORD = "supersecretpassword123";
TestUtils.TEST_WALLETS_DIR = "./test_wallets";
TestUtils.WALLET_FULL_PATH = TestUtils.TEST_WALLETS_DIR + "/" + TestUtils.WALLET_NAME;
TestUtils.MAX_FEE = BigInt("7500000") * BigInt("10000");
TestUtils.NETWORK_TYPE = _index.MoneroNetworkType.TESTNET; // default keypair to test

TestUtils.MNEMONIC = "silk mocked cucumber lettuce hope adrenalin aching lush roles fuel revamp baptism wrist long tender teardrop midst pastry pigment equip frying inbound pinched ravine frying";
TestUtils.ADDRESS = "A1y9sbVt8nqhZAVm3me1U18rUVXcjeNKuBd1oE2cTs8biA9cozPMeyYLhe77nPv12JA3ejJN3qprmREriit2fi6tJDi99RR";
TestUtils.FIRST_RECEIVE_HEIGHT = 500; // NOTE: this value must be the height of the wallet's first tx for tests
// wallet RPC config

TestUtils.WALLET_RPC_CONFIG = {
  uri: "localhost:28084",
  username: "rpc_user",
  password: "abc123",
  rejectUnauthorized: true // reject self-signed certificates if true

}; // daemon config

TestUtils.DAEMON_LOCAL_PATH = TestUtils.MONERO_BINS_DIR + "/monerod";
TestUtils.DAEMON_RPC_CONFIG = {
  uri: "localhost:28081",
  rejectUnauthorized: true // reject self-signed certificates if true

};
TestUtils.WALLET_TX_TRACKER = new _WalletTxTracker["default"](); // used to track wallet txs for tests

TestUtils.PROXY_TO_WORKER = true;
TestUtils.SYNC_PERIOD_IN_MS = 5000; // period between wallet syncs in milliseconds

TestUtils.OFFLINE_SERVER_URI = "offline_server_uri"; // dummy server uri to remain offline because wallet2 connects to default if not given
// monero-wallet-rpc process management

TestUtils.WALLET_RPC_PORT_START = 28084;
TestUtils.WALLET_PORT_OFFSETS = {};
TestUtils.WALLET_RPC_LOCAL_PATH = TestUtils.MONERO_BINS_DIR + "/monero-wallet-rpc";
TestUtils.WALLET_RPC_LOCAL_WALLET_DIR = TestUtils.MONERO_BINS_DIR;
TestUtils.WALLET_RPC_ACCESS_CONTROL_ORIGINS = "http://localhost:8080"; // cors access from web browser

var _default = TestUtils;
exports["default"] = _default;