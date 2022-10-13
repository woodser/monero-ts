"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/**
 * Models daemon mining status.
 */
var MoneroMiningStatus = /*#__PURE__*/function () {
  function MoneroMiningStatus(state) {
    (0, _classCallCheck2["default"])(this, MoneroMiningStatus);
    if (!state) state = {};else if (state instanceof MoneroMiningStatus) state = state.toJson();else if ((0, _typeof2["default"])(state) === "object") state = Object.assign({}, state);else throw new MoneroError("state must be a MoneroMiningStatus or JavaScript object");
    this.state = state;
  }

  (0, _createClass2["default"])(MoneroMiningStatus, [{
    key: "toJson",
    value: function toJson() {
      return Object.assign({}, this.state);
    }
  }, {
    key: "isActive",
    value: function isActive() {
      return this.state.isActive;
    }
  }, {
    key: "setIsActive",
    value: function setIsActive(isActive) {
      this.state.isActive = isActive;
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
    key: "getNumThreads",
    value: function getNumThreads() {
      return this.state.numThreads;
    }
  }, {
    key: "setNumThreads",
    value: function setNumThreads(numThreads) {
      this.state.numThreads = numThreads;
      return this;
    }
  }, {
    key: "isBackground",
    value: function isBackground() {
      return this.state.isBackground;
    }
  }, {
    key: "setIsBackground",
    value: function setIsBackground(isBackground) {
      this.state.isBackground = isBackground;
      return this;
    }
  }]);
  return MoneroMiningStatus;
}();

var _default = MoneroMiningStatus;
exports["default"] = _default;