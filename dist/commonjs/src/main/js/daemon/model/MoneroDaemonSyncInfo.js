"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _MoneroConnectionSpan = _interopRequireDefault(require("./MoneroConnectionSpan"));

var _MoneroPeer = _interopRequireDefault(require("./MoneroPeer"));

/**
 * Models daemon synchronization information.
 */
var MoneroDaemonSyncInfo = /*#__PURE__*/function () {
  function MoneroDaemonSyncInfo(state) {
    (0, _classCallCheck2["default"])(this, MoneroDaemonSyncInfo);
    // copy state
    state = Object.assign({}, state); // deserialize if necessary

    if (state.peers) {
      for (var i = 0; i < state.peers.length; i++) {
        if (!(state.peers[i] instanceof _MoneroPeer["default"])) {
          state.peers[i] = new _MoneroPeer["default"](state.peers[i]);
        }
      }
    }

    if (state.spans) {
      for (var _i = 0; _i < state.spans.length; _i++) {
        if (!(state.spans[_i] instanceof _MoneroConnectionSpan["default"])) {
          state.spans[_i] = new _MoneroConnectionSpan["default"](state.spans[_i]);
        }
      }
    }

    if (state.credits !== undefined && !(state.credits instanceof BigInt)) state.credits = BigInt(state.credits); // assign internal state

    this.state = state;
  }

  (0, _createClass2["default"])(MoneroDaemonSyncInfo, [{
    key: "toJson",
    value: function toJson() {
      var json = Object.assign({}, this.state);

      if (json.peers !== undefined) {
        for (var i = 0; i < json.peers.length; i++) {
          json.peers[i] = json.peers[i].toJson();
        }
      }

      if (json.spans !== undefined) {
        for (var _i2 = 0; _i2 < json.spans.length; _i2++) {
          json.spans[_i2] = json.spans[_i2].toJson();
        }
      }

      if (json.credits !== undefined) json.credits = json.credits.toString();
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
    key: "getPeers",
    value: function getPeers() {
      return this.state.peers;
    }
  }, {
    key: "setPeers",
    value: function setPeers(peers) {
      this.state.peers = peers;
      return this;
    }
  }, {
    key: "getSpans",
    value: function getSpans() {
      return this.state.spans;
    }
  }, {
    key: "setSpans",
    value: function setSpans(spans) {
      this.state.spans = spans;
      return this;
    }
  }, {
    key: "getTargetHeight",
    value: function getTargetHeight() {
      return this.state.targetHeight;
    }
  }, {
    key: "setTargetHeight",
    value: function setTargetHeight(targetHeight) {
      this.state.targetHeight = targetHeight;
      return this;
    }
  }, {
    key: "getNextNeededPruningSeed",
    value: function getNextNeededPruningSeed() {
      return this.state.nextNeededPruningSeed;
    }
  }, {
    key: "setNextNeededPruningSeed",
    value: function setNextNeededPruningSeed(nextNeededPruningSeed) {
      this.state.nextNeededPruningSeed = nextNeededPruningSeed;
      return this;
    }
  }, {
    key: "getOverview",
    value: function getOverview() {
      return this.state.overview;
    }
  }, {
    key: "setOverview",
    value: function setOverview(overview) {
      this.state.overview = overview;
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
  return MoneroDaemonSyncInfo;
}();

var _default = MoneroDaemonSyncInfo;
exports["default"] = _default;