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
 * Default connection manager listener which takes no action on notifications.
 */
var MoneroConnectionManagerListener = /*#__PURE__*/function () {
  function MoneroConnectionManagerListener() {
    (0, _classCallCheck2["default"])(this, MoneroConnectionManagerListener);
  }

  (0, _createClass2["default"])(MoneroConnectionManagerListener, [{
    key: "onConnectionChanged",
    value:
    /**
     * Notified on connection change events.
     * 
     * @param {MoneroRpcConnection} connection - the connection manager's current connection
     * @returns {promise<void>}
     */
    function () {
      var _onConnectionChanged = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(connection) {
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

      function onConnectionChanged(_x) {
        return _onConnectionChanged.apply(this, arguments);
      }

      return onConnectionChanged;
    }()
  }]);
  return MoneroConnectionManagerListener;
}();

var _default = MoneroConnectionManagerListener;
exports["default"] = _default;