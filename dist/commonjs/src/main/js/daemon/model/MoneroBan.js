"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/**
 * Monero banhammer.
 */
var MoneroBan = /*#__PURE__*/function () {
  function MoneroBan(state) {
    (0, _classCallCheck2["default"])(this, MoneroBan);
    this.state = Object.assign({}, state);
  }

  (0, _createClass2["default"])(MoneroBan, [{
    key: "toJson",
    value: function toJson() {
      return Object.assign({}, this.state);
    }
  }, {
    key: "getHost",
    value: function getHost() {
      return this.state.host;
    }
  }, {
    key: "setHost",
    value: function setHost(host) {
      this.state.host = host;
      return this;
    }
  }, {
    key: "getIp",
    value: function getIp() {
      return this.state.ip;
    }
  }, {
    key: "setIp",
    value: function setIp(ip) {
      this.state.ip = ip;
      return this;
    }
  }, {
    key: "isBanned",
    value: function isBanned() {
      return this.state.isBanned;
    }
  }, {
    key: "setIsBanned",
    value: function setIsBanned(isBanned) {
      this.state.isBanned = isBanned;
      return this;
    }
  }, {
    key: "getSeconds",
    value: function getSeconds() {
      return this.state.seconds;
    }
  }, {
    key: "setSeconds",
    value: function setSeconds(seconds) {
      this.state.seconds = seconds;
      return this;
    }
  }]);
  return MoneroBan;
}();

var _default = MoneroBan;
exports["default"] = _default;