"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/**
 * Monero hard fork info.
 */
var MoneroHardForkInfo = /*#__PURE__*/function () {
  function MoneroHardForkInfo(state) {
    (0, _classCallCheck2["default"])(this, MoneroHardForkInfo);
    this.state = Object.assign({}, state);
    if (this.state.credits !== undefined && !(this.state.credits instanceof BigInt)) this.state.credits = BigInt(this.state.credits);
  }

  (0, _createClass2["default"])(MoneroHardForkInfo, [{
    key: "toJson",
    value: function toJson() {
      var json = Object.assign({}, this.state);
      if (json.credits !== undefined) json.credits = json.credits.toString();
      return json;
    }
  }, {
    key: "getEarliestHeight",
    value: function getEarliestHeight() {
      return this.state.earliestHeight;
    }
  }, {
    key: "setEarliestHeight",
    value: function setEarliestHeight(earliestHeight) {
      this.state.earliestHeight = earliestHeight;
      return this;
    }
  }, {
    key: "isEnabled",
    value: function isEnabled() {
      return this.state.isEnabled;
    }
  }, {
    key: "setIsEnabled",
    value: function setIsEnabled(isEnabled) {
      this.state.isEnabled = isEnabled;
      return this;
    }
  }, {
    key: "getState",
    value: function getState() {
      return this.state.state;
    }
  }, {
    key: "setState",
    value: function setState(state) {
      this.state.state = state;
      return this;
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
  }, {
    key: "getNumVotes",
    value: function getNumVotes() {
      return this.state.numVotes;
    }
  }, {
    key: "setNumVotes",
    value: function setNumVotes(numVotes) {
      this.state.numVotes = numVotes;
      return this;
    }
  }, {
    key: "getWindow",
    value: function getWindow() {
      return this.state.window;
    }
  }, {
    key: "setWindow",
    value: function setWindow(window) {
      this.state.window = window;
      return this;
    }
  }, {
    key: "getVoting",
    value: function getVoting() {
      return this.state.voting;
    }
  }, {
    key: "setVoting",
    value: function setVoting(voting) {
      this.state.voting = voting;
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
  return MoneroHardForkInfo;
}();

var _default = MoneroHardForkInfo;
exports["default"] = _default;