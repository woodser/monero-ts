"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/**
 * Models the result from submitting a tx to a daemon.
 */
var MoneroSubmitTxResult = /*#__PURE__*/function () {
  function MoneroSubmitTxResult(state) {
    (0, _classCallCheck2["default"])(this, MoneroSubmitTxResult);
    state = Object.assign({}, state);
    this.state = state; // deserialize BigInts

    if (state.credits !== undefined && !(state.credits instanceof BigInt)) state.credits = BigInt(state.credits);
  }

  (0, _createClass2["default"])(MoneroSubmitTxResult, [{
    key: "toJson",
    value: function toJson() {
      var json = Object.assign({}, this.state);
      if (json.credits !== undefined) json.credits = json.credits.toString();
      return json;
    }
  }, {
    key: "isGood",
    value: function isGood() {
      return this.state.isGood;
    }
  }, {
    key: "setIsGood",
    value: function setIsGood(isGood) {
      this.state.isGood = isGood;
      return this;
    }
  }, {
    key: "isRelayed",
    value: function isRelayed() {
      return this.state.isRelayed;
    }
  }, {
    key: "setIsRelayed",
    value: function setIsRelayed(isRelayed) {
      this.state.isRelayed = isRelayed;
      return this;
    }
  }, {
    key: "isDoubleSpendSeen",
    value: function isDoubleSpendSeen() {
      return this.state.isDoubleSpendSeen;
    }
  }, {
    key: "setIsDoubleSpend",
    value: function setIsDoubleSpend(isDoubleSpendSeen) {
      this.state.isDoubleSpendSeen = isDoubleSpendSeen;
      return this;
    }
  }, {
    key: "isFeeTooLow",
    value: function isFeeTooLow() {
      return this.state.isFeeTooLow;
    }
  }, {
    key: "setIsFeeTooLow",
    value: function setIsFeeTooLow(isFeeTooLow) {
      this.state.isFeeTooLow = isFeeTooLow;
      return this;
    }
  }, {
    key: "isMixinTooLow",
    value: function isMixinTooLow() {
      return this.state.isMixinTooLow;
    }
  }, {
    key: "setIsMixinTooLow",
    value: function setIsMixinTooLow(isMixinTooLow) {
      this.state.isMixinTooLow = isMixinTooLow;
      return this;
    }
  }, {
    key: "hasInvalidInput",
    value: function hasInvalidInput() {
      return this.state.hasInvalidInput;
    }
  }, {
    key: "setHasInvalidInput",
    value: function setHasInvalidInput(hasInvalidInput) {
      this.state.hasInvalidInput = hasInvalidInput;
      return this;
    }
  }, {
    key: "hasInvalidOutput",
    value: function hasInvalidOutput() {
      return this.state.hasInvalidOutput;
    }
  }, {
    key: "setHasInvalidOutput",
    value: function setHasInvalidOutput(hasInvalidOutput) {
      this.state.hasInvalidOutput = hasInvalidOutput;
      return this;
    }
  }, {
    key: "hasTooFewOutputs",
    value: function hasTooFewOutputs() {
      return this.state.hasTooFewOutputs;
    }
  }, {
    key: "setHasTooFewOutputs",
    value: function setHasTooFewOutputs(hasTooFewOutputs) {
      this.state.hasTooFewOutputs = hasTooFewOutputs;
      return this;
    }
  }, {
    key: "isOverspend",
    value: function isOverspend() {
      return this.state.isOverspend;
    }
  }, {
    key: "setIsOverspend",
    value: function setIsOverspend(isOverspend) {
      this.state.isOverspend = isOverspend;
      return this;
    }
  }, {
    key: "getReason",
    value: function getReason() {
      return this.state.reason;
    }
  }, {
    key: "setReason",
    value: function setReason(reason) {
      this.state.reason = reason;
      return this;
    }
  }, {
    key: "isTooBig",
    value: function isTooBig() {
      return this.state.isTooBig;
    }
  }, {
    key: "setIsTooBig",
    value: function setIsTooBig(isTooBig) {
      this.state.isTooBig = isTooBig;
      return this;
    }
  }, {
    key: "getSanityCheckFailed",
    value: function getSanityCheckFailed() {
      return this.state.sanityCheckFailed;
    }
  }, {
    key: "setSanityCheckFailed",
    value: function setSanityCheckFailed(sanityCheckFailed) {
      this.state.sanityCheckFailed = sanityCheckFailed;
      return this;
    }
  }, {
    key: "getCredits",
    value: function getCredits() {
      return this.state.credits;
    }
  }, {
    key: "setCredits",
    value: function setCredits(credits) {
      this.state.credits = credits;
      return this;
    }
  }, {
    key: "getTopBlockHash",
    value: function getTopBlockHash() {
      return this.state.topBlockHash;
    }
  }, {
    key: "setTopBlockHash",
    value: function setTopBlockHash(topBlockHash) {
      this.state.topBlockHash = topBlockHash;
      return this;
    }
  }]);
  return MoneroSubmitTxResult;
}();

var _default = MoneroSubmitTxResult;
exports["default"] = _default;