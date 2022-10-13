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

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

/**
 * Utility class to run monero-wallet-rpc test servers until terminated.
 */
var RunWalletRpcTestServers = /*#__PURE__*/function () {
  function RunWalletRpcTestServers() {
    (0, _classCallCheck2["default"])(this, RunWalletRpcTestServers);
  }

  (0, _createClass2["default"])(RunWalletRpcTestServers, null, [{
    key: "run",
    value: function () {
      var _run = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
        var numProcesses, processPromises, i, wallets;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                // start monero-wallet-rpc servers
                console.log("Starting monero-wallet-rpc servers...");
                numProcesses = 10;
                processPromises = [];

                for (i = 0; i < numProcesses; i++) {
                  processPromises.push(_TestUtils["default"].startWalletRpcProcess());
                }

                _context2.next = 6;
                return Promise.all(processPromises);

              case 6:
                wallets = _context2.sent;
                console.log("Done starting monero-wallet-rpc servers"); // close wallets and servers on ctrl+c

                process.on("SIGINT", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
                  var _iterator, _step, wallet;

                  return _regenerator["default"].wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          console.log("Stopping monero-wallet-rpc servers...");
                          _iterator = _createForOfIteratorHelper(wallets);
                          _context.prev = 2;

                          _iterator.s();

                        case 4:
                          if ((_step = _iterator.n()).done) {
                            _context.next = 10;
                            break;
                          }

                          wallet = _step.value;
                          _context.next = 8;
                          return _TestUtils["default"].stopWalletRpcProcess(wallet);

                        case 8:
                          _context.next = 4;
                          break;

                        case 10:
                          _context.next = 15;
                          break;

                        case 12:
                          _context.prev = 12;
                          _context.t0 = _context["catch"](2);

                          _iterator.e(_context.t0);

                        case 15:
                          _context.prev = 15;

                          _iterator.f();

                          return _context.finish(15);

                        case 18:
                          console.log("Stopped monero-wallet-rpc servers");
                          process.exit(0);

                        case 20:
                        case "end":
                          return _context.stop();
                      }
                    }
                  }, _callee, null, [[2, 12, 15, 18]]);
                })));

              case 9:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }));

      function run() {
        return _run.apply(this, arguments);
      }

      return run;
    }()
  }]);
  return RunWalletRpcTestServers;
}(); // run until termination


RunWalletRpcTestServers.run();
var _default = RunWalletRpcTestServers;
exports["default"] = _default;