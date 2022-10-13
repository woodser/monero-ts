"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/**
 * Message signature verification result.
 * 
 * @class
 */
var MoneroMessageSignatureResult = /*#__PURE__*/function () {
  function MoneroMessageSignatureResult(stateOrIsGood, isOld, signatureType, version) {
    (0, _classCallCheck2["default"])(this, MoneroMessageSignatureResult);

    if (typeof stateOrIsGood === "boolean") {
      this.state = {};
      this.state.isGood = stateOrIsGood;
      this.state.isOld = isOld;
      this.state.signatureType = signatureType;
      this.state.version = version;
    } else {
      this.state = stateOrIsGood;
    }
  }

  (0, _createClass2["default"])(MoneroMessageSignatureResult, [{
    key: "toJson",
    value: function toJson() {
      return Object.assign({}, this.state);
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
    key: "isOld",
    value: function isOld() {
      return this.state.isOld;
    }
  }, {
    key: "setIsOld",
    value: function setIsOld(isOld) {
      this.state.isOld = isOld;
      return this;
    }
  }, {
    key: "getSignatureType",
    value: function getSignatureType() {
      return this.state.signatureType;
    }
  }, {
    key: "setSignatureType",
    value: function setSignatureType(signatureType) {
      this.state.signatureType = signatureType;
      return this;
    }
  }, {
    key: "getVersion",
    value: function getVersion() {
      return this.state.version;
    }
  }, {
    key: "setVersion",
    value: function setVersion(version) {
      this.state.version = version;
      return this;
    }
  }]);
  return MoneroMessageSignatureResult;
}();

var _default = MoneroMessageSignatureResult;
exports["default"] = _default;