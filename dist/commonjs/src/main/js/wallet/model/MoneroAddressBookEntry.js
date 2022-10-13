"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/**
 * Monero address book entry model
 */
var MoneroAddressBookEntry = /*#__PURE__*/function () {
  function MoneroAddressBookEntry(state) {
    (0, _classCallCheck2["default"])(this, MoneroAddressBookEntry);
    this.state = Object.assign({}, state);
  }

  (0, _createClass2["default"])(MoneroAddressBookEntry, [{
    key: "toJson",
    value: function toJson() {
      return Object.assign({}, this.state);
    }
  }, {
    key: "getIndex",
    value: function getIndex() {
      return this.state.index;
    }
  }, {
    key: "setIndex",
    value: function setIndex(index) {
      this.state.index = index;
      return this;
    }
  }, {
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
    key: "getDescription",
    value: function getDescription() {
      return this.state.description;
    }
  }, {
    key: "setDescription",
    value: function setDescription(description) {
      this.state.description = description;
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
  }]);
  return MoneroAddressBookEntry;
}();

var _default = MoneroAddressBookEntry;
exports["default"] = _default;