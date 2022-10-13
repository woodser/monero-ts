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

/**
 * Utility class to start mining.
 */
var StartMining = /*#__PURE__*/function () {
  function StartMining() {
    (0, _classCallCheck2["default"])(this, StartMining);
  }

  (0, _createClass2["default"])(StartMining, null, [{
    key: "startMining",
    value: function () {
      var _startMining = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(numThreads) {
        var daemon;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!numThreads) numThreads = 1; //TestUtils.getWalletRpc().startMining(numThreads, false, true);

                _context.next = 3;
                return _TestUtils["default"].getDaemonRpc();

              case 3:
                daemon = _context.sent;
                _context.next = 6;
                return daemon.startMining("9tsUiG9bwcU7oTbAdBwBk2PzxFtysge5qcEsHEpetmEKgerHQa1fDqH7a4FiquZmms7yM22jdifVAD7jAb2e63GSJMuhY75", numThreads, false, false);

              case 6:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      function startMining(_x) {
        return _startMining.apply(this, arguments);
      }

      return startMining;
    }()
  }]);
  return StartMining;
}();

var _default = StartMining;
exports["default"] = _default;