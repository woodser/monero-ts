"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/**
 * Monero daemon connection span.
 */
var MoneroConnectionSpan = /*#__PURE__*/function () {
  function MoneroConnectionSpan(state) {
    (0, _classCallCheck2["default"])(this, MoneroConnectionSpan);
    this.state = Object.assign({}, state);
  }

  (0, _createClass2["default"])(MoneroConnectionSpan, [{
    key: "toJson",
    value: function toJson() {
      return Object.assign({}, this.state);
    }
  }, {
    key: "getConnectionId",
    value: function getConnectionId() {
      return this.state.connectionId;
    }
  }, {
    key: "setConnectionId",
    value: function setConnectionId(connectionId) {
      this.state.connectionId = connectionId;
      return this;
    }
  }, {
    key: "getNumBlocks",
    value: function getNumBlocks() {
      return this.state.numBlocks;
    }
  }, {
    key: "setNumBlocks",
    value: function setNumBlocks(numBlocks) {
      this.state.numBlocks = numBlocks;
      return this;
    }
  }, {
    key: "getRemoteAddress",
    value: function getRemoteAddress() {
      return this.state.remoteAddress;
    }
  }, {
    key: "setRemoteAddress",
    value: function setRemoteAddress(remoteAddress) {
      this.state.remoteAddress = remoteAddress;
      return this;
    }
  }, {
    key: "getRate",
    value: function getRate() {
      return this.state.rate;
    }
  }, {
    key: "setRate",
    value: function setRate(rate) {
      this.state.rate = rate;
      return this;
    }
  }, {
    key: "getSpeed",
    value: function getSpeed() {
      return this.state.speed;
    }
  }, {
    key: "setSpeed",
    value: function setSpeed(speed) {
      this.state.speed = speed;
      return this;
    }
  }, {
    key: "getSize",
    value: function getSize() {
      return this.state.size;
    }
  }, {
    key: "setSize",
    value: function setSize(size) {
      this.state.size = size;
      return this;
    }
  }, {
    key: "getStartHeight",
    value: function getStartHeight() {
      return this.state.startHeight;
    }
  }, {
    key: "setStartHeight",
    value: function setStartHeight(startHeight) {
      this.state.startHeight = startHeight;
      return this;
    }
  }]);
  return MoneroConnectionSpan;
}();

var _default = MoneroConnectionSpan;
exports["default"] = _default;