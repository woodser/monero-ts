"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/**
 * Models a Monero version.
 */
var MoneroVersion = /*#__PURE__*/function () {
  /**
   * Construct the model.
   * 
   * @param number is the version number
   * @param isRelease indicates if this version is a release
   */
  function MoneroVersion(number, isRelease) {
    (0, _classCallCheck2["default"])(this, MoneroVersion);
    this.state = {};
    this.state.number = number;
    this.state.isRelease = isRelease;
  }

  (0, _createClass2["default"])(MoneroVersion, [{
    key: "getNumber",
    value: function getNumber() {
      return this.state.number;
    }
  }, {
    key: "setNumber",
    value: function setNumber(number) {
      this.state.number = number;
      return this;
    }
  }, {
    key: "isRelease",
    value: function isRelease() {
      return this.state.isRelease;
    }
  }, {
    key: "setIsRelease",
    value: function setIsRelease(isRelease) {
      this.state.isRelease = isRelease;
      return this;
    }
  }, {
    key: "copy",
    value: function copy() {
      return new MoneroKeyImage(this);
    }
  }, {
    key: "toJson",
    value: function toJson() {
      return Object.assign({}, this.state);
    }
  }]);
  return MoneroVersion;
}();

var _default = MoneroVersion;
exports["default"] = _default;