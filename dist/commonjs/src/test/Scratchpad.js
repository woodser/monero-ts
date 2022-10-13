"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _TestUtils = _interopRequireDefault(require("./utils/TestUtils"));

var _WalletSyncPrinter = _interopRequireDefault(require("./utils/WalletSyncPrinter"));

describe("Scratchpad", function () {
  it("Can be scripted easily", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
    var daemon, walletRpc, walletFull;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return connectToDaemonRpc({
              uri: "http://localhost:28081",
              username: "superuser",
              password: "abctesting123",
              proxyToWorker: _TestUtils["default"].PROXY_TO_WORKER,
              rejectUnauthorized: false
            });

          case 2:
            daemon = _context.sent;
            _context.t0 = console;
            _context.next = 6;
            return daemon.getHeight();

          case 6:
            _context.t1 = _context.sent;
            _context.t2 = "Daemon height: " + _context.t1;

            _context.t0.log.call(_context.t0, _context.t2);

            _context.next = 11;
            return connectToWalletRpc({
              uri: "http://localhost:28084",
              username: "rpc_user",
              password: "abc123",
              rejectUnauthorized: false
            });

          case 11:
            walletRpc = _context.sent;
            _context.next = 14;
            return walletRpc.openWallet("test_wallet_1", "supersecretpassword123");

          case 14:
            _context.t3 = console;
            _context.next = 17;
            return walletRpc.getMnemonic();

          case 17:
            _context.t4 = _context.sent;
            _context.t5 = "RPC wallet mnemonic: " + _context.t4;

            _context.t3.log.call(_context.t3, _context.t5);

            _context.next = 22;
            return createWalletFull({
              //path: "./test_wallets/" + GenUtils.getUUID(), // in-memory wallet if not given
              password: "supersecretpassword123",
              serverUsername: "superuser",
              serverPassword: "abctesting123",
              networkType: "testnet",
              serverUri: "http://localhost:28081",
              mnemonic: "silk mocked cucumber lettuce hope adrenalin aching lush roles fuel revamp baptism wrist long tender teardrop midst pastry pigment equip frying inbound pinched ravine frying",
              restoreHeight: 0,
              proxyToWorker: _TestUtils["default"].PROXY_TO_WORKER,
              rejectUnauthorized: false
            });

          case 22:
            walletFull = _context.sent;
            _context.next = 25;
            return walletFull.sync(new _WalletSyncPrinter["default"]());

          case 25:
            _context.t6 = console;
            _context.next = 28;
            return walletFull.getDaemonHeight();

          case 28:
            _context.t7 = _context.sent;
            _context.t8 = "Full wallet daemon height: " + _context.t7;

            _context.t6.log.call(_context.t6, _context.t8);

            _context.t9 = console;
            _context.next = 34;
            return walletFull.getMnemonic();

          case 34:
            _context.t10 = _context.sent;
            _context.t11 = "Full wallet mnemonic: " + _context.t10;

            _context.t9.log.call(_context.t9, _context.t11);

            _context.t12 = console;
            _context.next = 40;
            return walletFull.getUnlockedBalance();

          case 40:
            _context.t13 = _context.sent.toString();
            _context.t14 = "Wallet balance: " + _context.t13;

            _context.t12.log.call(_context.t12, _context.t14);

            _context.next = 45;
            return walletFull.close();

          case 45:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  })));
});