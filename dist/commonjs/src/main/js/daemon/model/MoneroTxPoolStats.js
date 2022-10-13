"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/**
 * Models transaction pool statistics.
 */
var MoneroTxPoolStats = /*#__PURE__*/function () {
  function MoneroTxPoolStats(state) {
    (0, _classCallCheck2["default"])(this, MoneroTxPoolStats);
    this.state = Object.assign({}, state);
    if (this.state.feeTotal !== undefined && !(this.state.feeTotal instanceof BigInt)) this.state.feeTotal = BigInt(this.state.feeTotal);
  }

  (0, _createClass2["default"])(MoneroTxPoolStats, [{
    key: "toJson",
    value: function toJson() {
      var json = Object.assign({}, this.state);
      if (json.feeTotal !== undefined) json.feeTotal = json.feeTotal.toString();
      return json;
    }
  }, {
    key: "getNumTxs",
    value: function getNumTxs() {
      return this.state.numTxs;
    }
  }, {
    key: "setNumTxs",
    value: function setNumTxs(numTxs) {
      this.state.numTxs = numTxs;
      return this;
    }
  }, {
    key: "getNumNotRelayed",
    value: function getNumNotRelayed() {
      return this.state.numNotRelayed;
    }
  }, {
    key: "setNumNotRelayed",
    value: function setNumNotRelayed(numNotRelayed) {
      this.state.numNotRelayed = numNotRelayed;
      return this;
    }
  }, {
    key: "getNumFailing",
    value: function getNumFailing() {
      return this.state.numFailing;
    }
  }, {
    key: "setNumFailing",
    value: function setNumFailing(numFailing) {
      this.state.numFailing = numFailing;
      return this;
    }
  }, {
    key: "getNumDoubleSpends",
    value: function getNumDoubleSpends() {
      return this.state.numDoubleSpends;
    }
  }, {
    key: "setNumDoubleSpends",
    value: function setNumDoubleSpends(numDoubleSpends) {
      this.state.numDoubleSpends = numDoubleSpends;
      return this;
    }
  }, {
    key: "getNum10m",
    value: function getNum10m() {
      return this.state.num10m;
    }
  }, {
    key: "setNum10m",
    value: function setNum10m(num10m) {
      this.state.num10m = num10m;
      return this;
    }
  }, {
    key: "getFeeTotal",
    value: function getFeeTotal() {
      return this.state.feeTotal;
    }
  }, {
    key: "setFeeTotal",
    value: function setFeeTotal(feeTotal) {
      this.state.feeTotal = feeTotal;
      return this;
    }
  }, {
    key: "getBytesMax",
    value: function getBytesMax() {
      return this.state.bytesMax;
    }
  }, {
    key: "setBytesMax",
    value: function setBytesMax(bytesMax) {
      this.state.bytesMax = bytesMax;
      return this;
    }
  }, {
    key: "getBytesMed",
    value: function getBytesMed() {
      return this.state.bytesMed;
    }
  }, {
    key: "setBytesMed",
    value: function setBytesMed(bytesMed) {
      this.state.bytesMed = bytesMed;
      return this;
    }
  }, {
    key: "getBytesMin",
    value: function getBytesMin() {
      return this.state.bytesMin;
    }
  }, {
    key: "setBytesMin",
    value: function setBytesMin(bytesMin) {
      this.state.bytesMin = bytesMin;
      return this;
    }
  }, {
    key: "getBytesTotal",
    value: function getBytesTotal() {
      return this.state.bytesTotal;
    }
  }, {
    key: "setBytesTotal",
    value: function setBytesTotal(bytesTotal) {
      this.state.bytesTotal = bytesTotal;
      return this;
    } // TODO: histo... what?

  }, {
    key: "getHisto",
    value: function getHisto() {
      return this.state.histo;
    }
  }, {
    key: "setHisto",
    value: function setHisto(histo) {
      this.state.histo = histo;
      return this;
    }
  }, {
    key: "getHisto98pc",
    value: function getHisto98pc() {
      return this.state.histo98pc;
    }
  }, {
    key: "setHisto98pc",
    value: function setHisto98pc(histo98pc) {
      this.state.histo98pc = histo98pc;
      return this;
    }
  }, {
    key: "getOldestTimestamp",
    value: function getOldestTimestamp() {
      return this.state.oldestTimestamp;
    }
  }, {
    key: "setOldestTimestamp",
    value: function setOldestTimestamp(oldestTimestamp) {
      this.state.oldestTimestamp = oldestTimestamp;
      return this;
    }
  }]);
  return MoneroTxPoolStats;
}();

var _default = MoneroTxPoolStats;
exports["default"] = _default;