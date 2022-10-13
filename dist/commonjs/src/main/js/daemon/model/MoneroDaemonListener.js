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
 * Receives notifications as a daemon is updated.
 */
var MoneroDaemonListener = /*#__PURE__*/function () {
  function MoneroDaemonListener() {
    (0, _classCallCheck2["default"])(this, MoneroDaemonListener);
  }

  (0, _createClass2["default"])(MoneroDaemonListener, [{
    key: "onBlockHeader",
    value:
    /**
     * Called when a new block is added to the chain.
     * 
     * @param {MoneroBlockHeader} header - the header of the block added to the chain
     */
    function () {
      var _onBlockHeader = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(header) {
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                this.lastHeader = header;

              case 1:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function onBlockHeader(_x) {
        return _onBlockHeader.apply(this, arguments);
      }

      return onBlockHeader;
    }()
    /**
     * Get the last notified block header.
     * 
     * @return {MoneroBlockHeader} the last notified block header
     */

  }, {
    key: "getLastBlockHeader",
    value: function getLastBlockHeader() {
      return this.lastHeader;
    }
  }]);
  return MoneroDaemonListener;
}();

var _default = MoneroDaemonListener;
exports["default"] = _default;