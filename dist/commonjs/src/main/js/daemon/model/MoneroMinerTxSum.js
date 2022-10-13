"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/**
 * Model for the summation of miner emissions and fees.
 */
var MoneroMinerTxSum = /*#__PURE__*/function () {
  function MoneroMinerTxSum(state) {
    (0, _classCallCheck2["default"])(this, MoneroMinerTxSum);
    state = Object.assign({}, state);
    this.state = state; // deserialize BigInts

    if (state.emissionSum !== undefined && !(state.emissionSum instanceof BigInt)) state.emissionSum = BigInt(state.emissionSum);
    if (state.feeSum !== undefined && !(state.feeSum instanceof BigInt)) state.feeSum = BigInt(state.feeSum);
  }

  (0, _createClass2["default"])(MoneroMinerTxSum, [{
    key: "toJson",
    value: function toJson() {
      var json = Object.assign({}, this.state);
      if (this.getEmissionSum() !== undefined) json.emissionSum = this.getEmissionSum().toString();
      if (this.getFeeSum() !== undefined) json.feeSum = this.getFeeSum().toString();
      return json;
    }
  }, {
    key: "getEmissionSum",
    value: function getEmissionSum() {
      return this.state.emissionSum;
    }
  }, {
    key: "setEmissionSum",
    value: function setEmissionSum(emissionSum) {
      this.state.emissionSum = emissionSum;
      return this;
    }
  }, {
    key: "getFeeSum",
    value: function getFeeSum() {
      return this.state.feeSum;
    }
  }, {
    key: "setFeeSum",
    value: function setFeeSum(feeSum) {
      this.state.feeSum = feeSum;
      return this;
    }
  }]);
  return MoneroMinerTxSum;
}();

var _default = MoneroMinerTxSum;
exports["default"] = _default;