"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/**
 * Models results from importing key images.
 */
var MoneroKeyImageImportResult = /*#__PURE__*/function () {
  function MoneroKeyImageImportResult(state) {
    (0, _classCallCheck2["default"])(this, MoneroKeyImageImportResult);
    state = Object.assign({}, state);
    if (state.spentAmount !== undefined && !(state.spentAmount instanceof BigInt)) state.spentAmount = BigInt(state.spentAmount);
    if (state.unspentAmount !== undefined && !(state.unspentAmount instanceof BigInt)) state.unspentAmount = BigInt(state.unspentAmount);
    this.state = state;
  }

  (0, _createClass2["default"])(MoneroKeyImageImportResult, [{
    key: "toJson",
    value: function toJson() {
      var json = Object.assign({}, this.state);
      if (this.getSpentAmount() !== undefined) json.spentAmount = this.getSpentAmount().toString();
      if (this.getUnspentAmount() !== undefined) json.unspentAmount = this.getUnspentAmount().toString();
      return json;
    }
  }, {
    key: "getHeight",
    value: function getHeight() {
      return this.state.height;
    }
  }, {
    key: "setHeight",
    value: function setHeight(height) {
      this.state.height = height;
      return this;
    }
  }, {
    key: "getSpentAmount",
    value: function getSpentAmount() {
      return this.state.spentAmount;
    }
  }, {
    key: "setSpentAmount",
    value: function setSpentAmount(spentAmount) {
      this.state.spentAmount = spentAmount;
      return this;
    }
  }, {
    key: "getUnspentAmount",
    value: function getUnspentAmount() {
      return this.state.unspentAmount;
    }
  }, {
    key: "setUnspentAmount",
    value: function setUnspentAmount(unspentAmount) {
      this.state.unspentAmount = unspentAmount;
      return this;
    }
  }]);
  return MoneroKeyImageImportResult;
}();

var _default = MoneroKeyImageImportResult;
exports["default"] = _default;