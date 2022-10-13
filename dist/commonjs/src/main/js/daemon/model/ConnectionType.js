"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assert = _interopRequireDefault(require("assert"));

/**
 * Enumerates connection types.
 * 
 * Based on enums.h in monero-project.
 * 
 * @hideconstructor
 */
var ConnectionType = /*#__PURE__*/function () {
  function ConnectionType() {
    (0, _classCallCheck2["default"])(this, ConnectionType);
  }

  (0, _createClass2["default"])(ConnectionType, null, [{
    key: "validate",
    value:
    /**
     * Asserts that the given connection type is valid.
     */
    function validate(type) {
      (0, _assert["default"])(type === 0 || type === 1 || type === 2 || type === 3, "Connection type is invalid: " + type);
    }
    /**
     * Indicates if the given connection type is valid or not.
     */

  }, {
    key: "isValid",
    value: function isValid(type) {
      return type === 0 || type === 1 || type === 2 || 3;
    }
  }]);
  return ConnectionType;
}();
/**
 * Invalid connection type (value=0).
 */


ConnectionType.INVALID = 0;
/**
 * IPV4 connection type (value=1).
 */

ConnectionType.IPV4 = 1;
/**
 * IPV6 connection type (value=2).
 */

ConnectionType.IPV6 = 2;
/**
 * TOR connection type (value=3).
 */

ConnectionType.TOR = 3;
/**
 * I2P connection type (value=4).
 */

ConnectionType.I2P = 4;
var _default = ConnectionType;
exports["default"] = _default;