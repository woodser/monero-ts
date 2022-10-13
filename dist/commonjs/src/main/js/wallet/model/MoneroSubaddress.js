"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _GenUtils = _interopRequireDefault(require("../../common/GenUtils"));

var _assert = _interopRequireDefault(require("assert"));

/**
 * Monero subaddress model.
 */
var MoneroSubaddress = /*#__PURE__*/function () {
  function MoneroSubaddress(stateOrAddress, accountIndex, index) {
    (0, _classCallCheck2["default"])(this, MoneroSubaddress);

    if (stateOrAddress === undefined || typeof stateOrAddress === "string") {
      this.state = {};
      this.setAddress(stateOrAddress);
      this.setAccountIndex(accountIndex);
      this.setIndex(index);
    } else {
      this.state = stateOrAddress;
      (0, _assert["default"])(accountIndex === undefined && index === undefined, "Can construct MoneroSubaddress with object or params but not both");
      if (this.state.balance !== undefined && !(this.state.balance instanceof BigInt)) this.state.balance = BigInt(this.state.balance);
      if (this.state.unlockedBalance !== undefined && !(this.state.unlockedBalance instanceof BigInt)) this.state.unlockedBalance = BigInt(this.state.unlockedBalance);
    }
  }

  (0, _createClass2["default"])(MoneroSubaddress, [{
    key: "toJson",
    value: function toJson() {
      var json = Object.assign({}, this.state);
      if (json.balance !== undefined) json.balance = json.balance.toString();
      if (json.unlockedBalance !== undefined) json.unlockedBalance = json.unlockedBalance.toString();
      return json;
    }
  }, {
    key: "getAccountIndex",
    value: function getAccountIndex() {
      return this.state.accountIndex;
    }
  }, {
    key: "setAccountIndex",
    value: function setAccountIndex(accountIndex) {
      this.state.accountIndex = accountIndex;
      return this;
    }
  }, {
    key: "getIndex",
    value: function getIndex() {
      return this.state.index;
    }
  }, {
    key: "setIndex",
    value: function setIndex(index) {
      this.state.index = index;
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
    key: "getLabel",
    value: function getLabel() {
      return this.state.label;
    }
  }, {
    key: "setLabel",
    value: function setLabel(label) {
      this.state.label = label;
      return this;
    }
  }, {
    key: "getBalance",
    value: function getBalance() {
      return this.state.balance;
    }
  }, {
    key: "setBalance",
    value: function setBalance(balance) {
      this.state.balance = balance;
      return this;
    }
  }, {
    key: "getUnlockedBalance",
    value: function getUnlockedBalance() {
      return this.state.unlockedBalance;
    }
  }, {
    key: "setUnlockedBalance",
    value: function setUnlockedBalance(unlockedBalance) {
      this.state.unlockedBalance = unlockedBalance;
      return this;
    }
  }, {
    key: "getNumUnspentOutputs",
    value: function getNumUnspentOutputs() {
      return this.state.numUnspentOutputs;
    }
  }, {
    key: "setNumUnspentOutputs",
    value: function setNumUnspentOutputs(numUnspentOutputs) {
      this.state.numUnspentOutputs = numUnspentOutputs;
      return this;
    }
  }, {
    key: "isUsed",
    value: function isUsed() {
      return this.state.isUsed;
    }
  }, {
    key: "setIsUsed",
    value: function setIsUsed(isUsed) {
      this.state.isUsed = isUsed;
      return this;
    }
  }, {
    key: "getNumBlocksToUnlock",
    value: function getNumBlocksToUnlock() {
      return this.state.numBlocksToUnlock;
    }
  }, {
    key: "setNumBlocksToUnlock",
    value: function setNumBlocksToUnlock(numBlocksToUnlock) {
      this.state.numBlocksToUnlock = numBlocksToUnlock;
      return this;
    }
  }, {
    key: "toString",
    value: function toString(indent) {
      var str = "";
      str += _GenUtils["default"].kvLine("Account index", this.getAccountIndex(), indent);
      str += _GenUtils["default"].kvLine("Subaddress index", this.getIndex(), indent);
      str += _GenUtils["default"].kvLine("Address", this.getAddress(), indent);
      str += _GenUtils["default"].kvLine("Label", this.getLabel(), indent);
      str += _GenUtils["default"].kvLine("Balance", this.getBalance(), indent);
      str += _GenUtils["default"].kvLine("Unlocked balance", this.getUnlockedBalance(), indent);
      str += _GenUtils["default"].kvLine("Num unspent outputs", this.getNumUnspentOutputs(), indent);
      str += _GenUtils["default"].kvLine("Is used", this.isUsed(), indent);
      str += _GenUtils["default"].kvLine("Num blocks to unlock", this.isUsed(), indent);
      return str.slice(0, str.length - 1); // strip last newline
    }
  }]);
  return MoneroSubaddress;
}();

var _default = MoneroSubaddress;
exports["default"] = _default;