"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/**
 * Result from syncing a Monero wallet.
 */
var MoneroSyncResult = /*#__PURE__*/function () {
  function MoneroSyncResult(numBlocksFetched, receivedMoney) {
    (0, _classCallCheck2["default"])(this, MoneroSyncResult);
    this.setNumBlocksFetched(numBlocksFetched);
    this.setReceivedMoney(receivedMoney);
  }

  (0, _createClass2["default"])(MoneroSyncResult, [{
    key: "getNumBlocksFetched",
    value: function getNumBlocksFetched() {
      return this.numBlocksFetched;
    }
  }, {
    key: "setNumBlocksFetched",
    value: function setNumBlocksFetched(numBlocksFetched) {
      this.numBlocksFetched = numBlocksFetched;
      return this;
    }
  }, {
    key: "getReceivedMoney",
    value: function getReceivedMoney() {
      return this.receivedMoney;
    }
  }, {
    key: "setReceivedMoney",
    value: function setReceivedMoney(receivedMoney) {
      this.receivedMoney = receivedMoney;
      return this;
    }
  }]);
  return MoneroSyncResult;
}();

var _default = MoneroSyncResult;
exports["default"] = _default;