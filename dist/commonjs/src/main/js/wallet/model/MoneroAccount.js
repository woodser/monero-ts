"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assert = _interopRequireDefault(require("assert"));

var _MoneroSubaddress = _interopRequireDefault(require("./MoneroSubaddress"));

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

/**
 * Monero account model.
 */
var MoneroAccount = /*#__PURE__*/function () {
  function MoneroAccount(stateOrIndex, primaryAddress, balance, unlockedBalance, subaddresses) {
    (0, _classCallCheck2["default"])(this, MoneroAccount);

    // construct from json
    if ((0, _typeof2["default"])(stateOrIndex) === "object") {
      this.state = stateOrIndex; // deserialize balances

      if (this.state.balance !== undefined && !(this.state.balance instanceof BigInt)) this.state.balance = BigInt(this.state.balance);
      if (this.state.unlockedBalance !== undefined && !(this.state.unlockedBalance instanceof BigInt)) this.state.unlockedBalance = BigInt(this.state.unlockedBalance); // deserialize subaddresses

      if (this.state.subaddresses) {
        for (var i = 0; i < this.state.subaddresses.length; i++) {
          if (!(this.state.subaddresses[i] instanceof _MoneroSubaddress["default"])) {
            this.state.subaddresses[i] = new _MoneroSubaddress["default"](this.state.subaddresses[i]);
          }
        }
      }
    } // construct from individual params
    else {
      this.state = {};
      this.setIndex(stateOrIndex);
      this.setPrimaryAddress(primaryAddress);
      this.setBalance(balance);
      this.setUnlockedBalance(unlockedBalance);
      this.setSubaddresses(subaddresses);
    }
  }

  (0, _createClass2["default"])(MoneroAccount, [{
    key: "toJson",
    value: function toJson() {
      var json = Object.assign({}, this.state);
      if (json.balance !== undefined) json.balance = json.balance.toString();
      if (json.unlockedBalance !== undefined) json.unlockedBalance = json.unlockedBalance.toString();

      if (json.subaddresses !== null) {
        for (var i = 0; i < json.subaddresses.length; i++) {
          json.subaddresses[i] = json.subaddresses[i].toJson();
        }
      }

      return json;
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
    key: "getPrimaryAddress",
    value: function getPrimaryAddress() {
      return this.state.primaryAddress;
    }
  }, {
    key: "setPrimaryAddress",
    value: function setPrimaryAddress(primaryAddress) {
      this.state.primaryAddress = primaryAddress;
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
    key: "getTag",
    value: function getTag() {
      return this.state.tag;
    }
  }, {
    key: "setTag",
    value: function setTag(tag) {
      this.state.tag = tag;
      return this;
    }
  }, {
    key: "getSubaddresses",
    value: function getSubaddresses() {
      return this.state.subaddresses;
    }
  }, {
    key: "setSubaddresses",
    value: function setSubaddresses(subaddresses) {
      (0, _assert["default"])(subaddresses === undefined || Array.isArray(subaddresses), "Given subaddresses must be undefined or an array of subaddresses");
      this.state.subaddresses = subaddresses;

      if (subaddresses) {
        var _iterator = _createForOfIteratorHelper(subaddresses),
            _step;

        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var subaddress = _step.value;
            subaddress.setAccountIndex(this.state.index);
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }

      return this;
    }
  }, {
    key: "toString",
    value: function toString() {
      var indent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var str = "";
      str += GenUtils.kvLine("Index", this.getIndex(), indent);
      str += GenUtils.kvLine("Primary address", this.getPrimaryAddress(), indent);
      str += GenUtils.kvLine("Balance", this.getBalance(), indent);
      str += GenUtils.kvLine("Unlocked balance", this.getUnlockedBalance(), indent);
      str += GenUtils.kvLine("Tag", this.getTag(), indent);

      if (this.getSubaddresses() != null) {
        sb += GenUtils.kvLine("Subaddresses", "", indent);

        for (var i = 0; i < this.getSubaddresses().size(); i++) {
          str += GenUtils.kvLine(i + 1, "", indent + 1);
          str += this.getSubaddresses()[i].toString(indent + 2) + "\n";
        }
      }

      return str.slice(0, str.length - 1); // strip last newline
    }
  }]);
  return MoneroAccount;
}();

var _default = MoneroAccount;
exports["default"] = _default;