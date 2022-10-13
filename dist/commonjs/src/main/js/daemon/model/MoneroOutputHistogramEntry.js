"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/**
 * Entry in a Monero output histogram (see get_output_histogram of Daemon RPC documentation).
 */
var MoneroOutputHistogramEntry = /*#__PURE__*/function () {
  function MoneroOutputHistogramEntry(state) {
    (0, _classCallCheck2["default"])(this, MoneroOutputHistogramEntry);
    this.state = Object.assign({}, state);
    if (this.state.amount !== undefined && !(this.state.amount instanceof BigInt)) this.state.amount = BigInt(this.state.amount);
  }

  (0, _createClass2["default"])(MoneroOutputHistogramEntry, [{
    key: "toJson",
    value: function toJson() {
      var json = Object.assign({}, this.state);
      if (json.amount !== undefined) json.amount = json.amount.toString();
      return json;
    }
  }, {
    key: "getAmount",
    value: function getAmount() {
      return this.state.amount;
    }
  }, {
    key: "setAmount",
    value: function setAmount(amount) {
      this.state.amount = amount;
      return this;
    }
  }, {
    key: "getNumInstances",
    value: function getNumInstances() {
      return this.state.numInstances;
    }
  }, {
    key: "setNumInstances",
    value: function setNumInstances(numInstances) {
      this.state.numInstances = numInstances;
      return this;
    }
  }, {
    key: "getNumUnlockedInstances",
    value: function getNumUnlockedInstances() {
      return this.state.numUnlockedInstances;
    }
  }, {
    key: "setNumUnlockedInstances",
    value: function setNumUnlockedInstances(numUnlockedInstances) {
      this.state.numUnlockedInstances = numUnlockedInstances;
      return this;
    }
  }, {
    key: "getNumRecentInstances",
    value: function getNumRecentInstances() {
      return this.state.numRecentInstances;
    }
  }, {
    key: "setNumRecentInstances",
    value: function setNumRecentInstances(numRecentInstances) {
      this.state.numRecentInstances = numRecentInstances;
      return this;
    }
  }]);
  return MoneroOutputHistogramEntry;
}();

var _default = MoneroOutputHistogramEntry;
exports["default"] = _default;