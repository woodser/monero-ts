"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/**
 * Monero integrated address model.
 */
var MoneroIntegratedAddress = /*#__PURE__*/function () {
  function MoneroIntegratedAddress(state) {
    (0, _classCallCheck2["default"])(this, MoneroIntegratedAddress);
    this.state = Object.assign({}, state);
  }

  (0, _createClass2["default"])(MoneroIntegratedAddress, [{
    key: "toJson",
    value: function toJson() {
      return Object.assign({}, this.state);
    }
  }, {
    key: "getStandardAddress",
    value: function getStandardAddress() {
      return this.state.standardAddress;
    }
  }, {
    key: "setStandardAddress",
    value: function setStandardAddress(standardAddress) {
      this.state.standardAddress = standardAddress;
      return this;
    }
  }, {
    key: "getPaymentId",
    value: function getPaymentId() {
      return this.state.paymentId;
    }
  }, {
    key: "setPaymentId",
    value: function setPaymentId(paymentId) {
      this.state.paymentId = paymentId;
      return this;
    }
  }, {
    key: "getIntegratedAddress",
    value: function getIntegratedAddress() {
      return this.state.integratedAddress;
    }
  }, {
    key: "setIntegratedAddress",
    value: function setIntegratedAddress(integratedAddress) {
      this.state.integratedAddress = integratedAddress;
      return this;
    }
  }, {
    key: "toString",
    value: function toString() {
      return this.state.integratedAddress;
    }
  }]);
  return MoneroIntegratedAddress;
}();

var _default = MoneroIntegratedAddress;
exports["default"] = _default;