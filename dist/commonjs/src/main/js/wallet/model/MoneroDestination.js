"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _GenUtils = _interopRequireDefault(require("../../common/GenUtils"));

var _MoneroError = _interopRequireDefault(require("../../common/MoneroError"));

/**
 * Models an outgoing transfer destination.
 */
var MoneroDestination = /*#__PURE__*/function () {
  /**
   * Construct the model.
   * 
   * @param {MoneroDestination|object|string} stateOrAddress is a MoneroDestination, JS object, or hex string to initialize from (optional)
   * @param {BigInt|string} amount - the destination amount
   */
  function MoneroDestination(stateOrAddress, amount) {
    (0, _classCallCheck2["default"])(this, MoneroDestination);
    if (!stateOrAddress) this.state = {};else if (stateOrAddress instanceof MoneroDestination) this.state = stateOrAddress.toJson();else if ((0, _typeof2["default"])(stateOrAddress) === "object") {
      this.state = Object.assign({}, stateOrAddress);
      if (typeof this.state.amount === "number") this.state.amount = BigInt(this.state.amount);
    } else if (typeof stateOrAddress === "string") {
      this.state = {};
      this.setAddress(stateOrAddress);
    } else throw new _MoneroError["default"]("stateOrAddress must be a MoneroDestination, JavaScript object, or hex string");
    if (amount) this.state.amount = amount;
    this.setAmount(this.state.amount);
  }

  (0, _createClass2["default"])(MoneroDestination, [{
    key: "getAddress",
    value: function getAddress() {
      return this.state.address;
    }
  }, {
    key: "setAddress",
    value: function setAddress(address) {
      this.state.address = address;
      return this;
    }
  }, {
    key: "getAmount",
    value: function getAmount() {
      return this.state.amount;
    }
  }, {
    key: "setAmount",
    value: function setAmount(amount) {
      if (amount !== undefined && !(this.state.amount instanceof BigInt)) {
        if (typeof amount === "number") throw new _MoneroError["default"]("Destination amount must be BigInt or string");

        try {
          amount = BigInt(amount);
        } catch (err) {
          throw new _MoneroError["default"]("Invalid destination amount: " + amount);
        }
      }

      this.state.amount = amount;
      return this;
    }
  }, {
    key: "copy",
    value: function copy() {
      return new MoneroDestination(this);
    }
  }, {
    key: "toJson",
    value: function toJson() {
      var json = Object.assign({}, this.state);
      if (this.getAmount() !== undefined) json.amount = this.getAmount().toString();
      return json;
    }
  }, {
    key: "toString",
    value: function toString() {
      var indent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

      var str = _GenUtils["default"].kvLine("Address", this.getAddress(), indent);

      str += _GenUtils["default"].kvLine("Amount", this.getAmount() ? this.getAmount().toString() : undefined, indent);
      return str.slice(0, str.length - 1); // strip last newline
    }
  }]);
  return MoneroDestination;
}();

var _default = MoneroDestination;
exports["default"] = _default;