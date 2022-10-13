"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/**
 * Models information about a multisig wallet.
 */
var MoneroMultisigInfo = /*#__PURE__*/function () {
  function MoneroMultisigInfo(state) {
    (0, _classCallCheck2["default"])(this, MoneroMultisigInfo);
    this.state = Object.assign({}, state);
  }

  (0, _createClass2["default"])(MoneroMultisigInfo, [{
    key: "toJson",
    value: function toJson() {
      return Object.assign({}, this.state);
    }
  }, {
    key: "isMultisig",
    value: function isMultisig() {
      return this.state.isMultisig;
    }
  }, {
    key: "setIsMultisig",
    value: function setIsMultisig(isMultisig) {
      this.state.isMultisig = isMultisig;
      return this;
    }
  }, {
    key: "isReady",
    value: function isReady() {
      return this.state.isReady;
    }
  }, {
    key: "setIsReady",
    value: function setIsReady(isReady) {
      this.state.isReady = isReady;
    }
  }, {
    key: "getThreshold",
    value: function getThreshold() {
      return this.state.threshold;
    }
  }, {
    key: "setThreshold",
    value: function setThreshold(threshold) {
      this.state.threshold = threshold;
    }
  }, {
    key: "getNumParticipants",
    value: function getNumParticipants() {
      return this.state.numParticipants;
    }
  }, {
    key: "setNumParticipants",
    value: function setNumParticipants(numParticipants) {
      this.state.numParticipants = numParticipants;
    }
  }]);
  return MoneroMultisigInfo;
}();

var _default = MoneroMultisigInfo;
exports["default"] = _default;