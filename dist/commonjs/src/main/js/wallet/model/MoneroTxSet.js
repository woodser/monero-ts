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

var _GenUtils = _interopRequireDefault(require("../../common/GenUtils"));

var _MoneroTxWallet = _interopRequireDefault(require("./MoneroTxWallet"));

var _MoneroUtils = _interopRequireDefault(require("../../common/MoneroUtils"));

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

/**
 * Groups transactions who share common hex data which is needed in order to
 * sign and submit the transactions.
 * 
 * For example, multisig transactions created from createTxs() share a common
 * hex string which is needed in order to sign and submit the multisig
 * transactions.
 */
var MoneroTxSet = /*#__PURE__*/function () {
  function MoneroTxSet(state) {
    (0, _classCallCheck2["default"])(this, MoneroTxSet);
    // initialize internal state
    if (!state) state = {};else if ((0, _typeof2["default"])(state) === "object") state = Object.assign({}, state);else throw new MoneroError("state must be JavaScript object");
    this.state = state; // deserialize txs

    if (state.txs) {
      for (var i = 0; i < state.txs.length; i++) {
        if (!(state.txs[i] instanceof _MoneroTxWallet["default"])) state.txs[i] = new _MoneroTxWallet["default"](state.txs[i]);
        state.txs[i].setTxSet(this);
      }
    }
  }

  (0, _createClass2["default"])(MoneroTxSet, [{
    key: "toJson",
    value: function toJson() {
      var json = Object.assign({}, this.state); // copy state

      if (this.getTxs() !== undefined) {
        json.txs = [];

        var _iterator = _createForOfIteratorHelper(this.getTxs()),
            _step;

        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var tx = _step.value;
            json.txs.push(tx.toJson());
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }

      return json;
    }
  }, {
    key: "getTxs",
    value: function getTxs() {
      return this.state.txs;
    }
  }, {
    key: "setTxs",
    value: function setTxs(txs) {
      this.state.txs = txs;
      return this;
    }
  }, {
    key: "getMultisigTxHex",
    value: function getMultisigTxHex() {
      return this.state.multisigTxHex;
    }
  }, {
    key: "setMultisigTxHex",
    value: function setMultisigTxHex(multisigTxHex) {
      this.state.multisigTxHex = multisigTxHex;
      return this;
    }
  }, {
    key: "getUnsignedTxHex",
    value: function getUnsignedTxHex() {
      return this.state.unsignedTxHex;
    }
  }, {
    key: "setUnsignedTxHex",
    value: function setUnsignedTxHex(unsignedTxHex) {
      this.state.unsignedTxHex = unsignedTxHex;
      return this;
    }
  }, {
    key: "getSignedTxHex",
    value: function getSignedTxHex() {
      return this.state.signedTxHex;
    }
  }, {
    key: "setSignedTxHex",
    value: function setSignedTxHex(signedTxHex) {
      this.state.signedTxHex = signedTxHex;
      return this;
    }
  }, {
    key: "merge",
    value: function merge(txSet) {
      (0, _assert["default"])(txSet instanceof MoneroTxSet);
      if (this === txSet) return this; // merge sets

      this.setMultisigTxHex(_GenUtils["default"].reconcile(this.getMultisigTxHex(), txSet.getMultisigTxHex()));
      this.setUnsignedTxHex(_GenUtils["default"].reconcile(this.getUnsignedTxHex(), txSet.getUnsignedTxHex()));
      this.setSignedTxHex(_GenUtils["default"].reconcile(this.getSignedTxHex(), txSet.getSignedTxHex())); // merge txs

      if (txSet.getTxs() !== undefined) {
        var _iterator2 = _createForOfIteratorHelper(txSet.getTxs()),
            _step2;

        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var tx = _step2.value;
            tx.setTxSet(this);

            _MoneroUtils["default"].mergeTx(this.getTxs(), tx);
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }
      }

      return this;
    }
  }, {
    key: "toString",
    value: function toString() {
      var indent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var str = "";
      str += _GenUtils["default"].kvLine("Multisig tx hex: ", this.getMultisigTxHex(), indent);
      str += _GenUtils["default"].kvLine("Unsigned tx hex: ", this.getUnsignedTxHex(), indent);
      str += _GenUtils["default"].kvLine("Signed tx hex: ", this.getSignedTxHex(), indent);

      if (this.getTxs() !== undefined) {
        str += _GenUtils["default"].kvLine("Txs", "", indent);

        var _iterator3 = _createForOfIteratorHelper(this.getTxs()),
            _step3;

        try {
          for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
            var tx = _step3.value;
            str += tx.toString(indent + 1) + "\n";
          }
        } catch (err) {
          _iterator3.e(err);
        } finally {
          _iterator3.f();
        }
      }

      return str;
    }
  }]);
  return MoneroTxSet;
}();

var _default = MoneroTxSet;
exports["default"] = _default;