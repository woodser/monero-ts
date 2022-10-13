"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _MoneroError = _interopRequireDefault(require("../../common/MoneroError"));

/**
 * Defines the Monero network types (mainnet, testnet, and stagenet).
 * 
 * @hideconstructor
 */
var MoneroNetworkType = /*#__PURE__*/function () {
  function MoneroNetworkType() {
    (0, _classCallCheck2["default"])(this, MoneroNetworkType);
  }

  (0, _createClass2["default"])(MoneroNetworkType, null, [{
    key: "validate",
    value:
    /**
     * Validates the given network type.
     * 
     * @param {number} networkType - the network type to validate as a numeric
     */
    function validate(networkType) {
      if (networkType !== 0 && networkType !== 1 && networkType !== 2) throw new _MoneroError["default"]("Network type is invalid: " + networkType);
    }
    /**
     * Indicates if the given network type is valid or not.
     * 
     * @param {number} networkType - the network type to validate as a numeric
     * @return {boolean} true if the network type is valid, false otherwise
     */

  }, {
    key: "isValid",
    value: function isValid(networkType) {
      return networkType === 0 || networkType === 1 || networkType === 2;
    }
    /**
     * Parse the given string as a network type.
     * 
     * @param {string} networkTypeStr - "mainnet", "testnet", or "stagenet" (case insensitive)
     * @return {int} the network type as a numeric
     */

  }, {
    key: "parse",
    value: function parse(networkTypeStr) {
      var str = ("" + networkTypeStr).toLowerCase();

      switch (str) {
        case "mainnet":
          return MoneroNetworkType.MAINNET;

        case "testnet":
          return MoneroNetworkType.TESTNET;

        case "stagenet":
          return MoneroNetworkType.STAGENET;

        default:
          throw new _MoneroError["default"]("Invalid network type to parse: '" + networkTypeStr + "'");
      }
    }
    /**
     * Get the network type in human-readable form.
     *
     * @return {string} the network type in human-readable form
     */

  }, {
    key: "toString",
    value: function toString(networkType) {
      if (networkType === 0) return "mainnet";
      if (networkType === 1) return "testnet";
      if (networkType === 2) return "stagenet";
      throw new _MoneroError["default"]("Invalid network type: " + networkType);
    }
  }]);
  return MoneroNetworkType;
}();
/**
 * Mainnet (value=0).
 */


MoneroNetworkType.MAINNET = 0;
/**
 * Testnet (value=1).
 */

MoneroNetworkType.TESTNET = 1;
/**
 * Stagnet (value=2).
 */

MoneroNetworkType.STAGENET = 2;
var _default = MoneroNetworkType;
exports["default"] = _default;