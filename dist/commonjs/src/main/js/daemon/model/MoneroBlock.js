"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _assert = _interopRequireDefault(require("assert"));

var _GenUtils = _interopRequireDefault(require("../../common/GenUtils"));

var _MoneroBlockHeader2 = _interopRequireDefault(require("./MoneroBlockHeader"));

var _MoneroTx = _interopRequireDefault(require("./MoneroTx"));

var _MoneroTxQuery = _interopRequireDefault(require("../../wallet/model/MoneroTxQuery"));

var _MoneroTxWallet = _interopRequireDefault(require("../../wallet/model/MoneroTxWallet"));

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * Models a Monero block in the blockchain.
 * 
 * @extends {MoneroBlockHeader}
 */
var MoneroBlock = /*#__PURE__*/function (_MoneroBlockHeader) {
  (0, _inherits2["default"])(MoneroBlock, _MoneroBlockHeader);

  var _super = _createSuper(MoneroBlock);

  /**
   * Construct the model.
   * 
   * @param {MoneroBlock|MoneroBlockHeader|object} state is existing state to initialize from (optional)
   * @param {MoneroBlock.DeserializationType} txType informs the tx deserialization type (MoneroTx, MoneroTxWallet, MoneroTxQuery)
   */
  function MoneroBlock(state, txType) {
    var _this;

    (0, _classCallCheck2["default"])(this, MoneroBlock);
    _this = _super.call(this, state);
    state = _this.state; // deserialize miner tx

    if (state.minerTx && !(state.minerTx instanceof _MoneroTx["default"])) state.minerTx = new _MoneroTx["default"](state.minerTx).setBlock((0, _assertThisInitialized2["default"])(_this)); // deserialize non-miner txs

    if (state.txs) {
      for (var i = 0; i < state.txs.length; i++) {
        if (txType === MoneroBlock.DeserializationType.TX || txType === undefined) {
          if (!(state.txs[i] instanceof _MoneroTx["default"])) state.txs[i] = new _MoneroTx["default"](state.txs[i]).setBlock((0, _assertThisInitialized2["default"])(_this));
        } else if (txType === MoneroBlock.DeserializationType.TX_WALLET) {
          if (!(state.txs[i] instanceof _MoneroTxWallet["default"])) state.txs[i] = new _MoneroTxWallet["default"](state.txs[i]).setBlock((0, _assertThisInitialized2["default"])(_this));
        } else if (txType === MoneroBlock.DeserializationType.TX_QUERY) {
          if (!(state.txs[i] instanceof _MoneroTxQuery["default"])) state.txs[i] = new _MoneroTxQuery["default"](state.txs[i]).setBlock((0, _assertThisInitialized2["default"])(_this));
        } else {
          throw new Error("Unrecognized tx deserialization type: " + txType);
        }
      }
    }

    return _this;
  }

  (0, _createClass2["default"])(MoneroBlock, [{
    key: "getHex",
    value: function getHex() {
      return this.state.hex;
    }
  }, {
    key: "setHex",
    value: function setHex(hex) {
      this.state.hex = hex;
      return this;
    }
  }, {
    key: "getMinerTx",
    value: function getMinerTx() {
      return this.state.minerTx;
    }
  }, {
    key: "setMinerTx",
    value: function setMinerTx(minerTx) {
      this.state.minerTx = minerTx;
      return this;
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
    key: "getTxHashes",
    value: function getTxHashes() {
      return this.state.txHashes;
    }
  }, {
    key: "setTxHashes",
    value: function setTxHashes(txHashes) {
      this.state.txHashes = txHashes;
      return this;
    }
  }, {
    key: "copy",
    value: function copy() {
      return new MoneroBlock(this);
    }
  }, {
    key: "toJson",
    value: function toJson() {
      var json = (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroBlock.prototype), "toJson", this).call(this);
      if (this.getMinerTx() !== undefined) json.minerTx = this.getMinerTx().toJson();

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
    key: "merge",
    value: function merge(block) {
      (0, _assert["default"])(block instanceof MoneroBlock);
      if (this === block) return this; // merge header fields

      (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroBlock.prototype), "merge", this).call(this, block); // merge reconcilable block extensions

      this.setHex(_GenUtils["default"].reconcile(this.getHex(), block.getHex()));
      this.setTxHashes(_GenUtils["default"].reconcile(this.getTxHashes(), block.getTxHashes())); // merge miner tx

      if (this.getMinerTx() === undefined) this.setMinerTx(block.getMinerTx());

      if (block.getMinerTx() !== undefined) {
        block.getMinerTx().setBlock(this);
        this.getMinerTx().merge(block.getMinerTx());
      } // merge non-miner txs


      if (block.getTxs() !== undefined) {
        var _iterator2 = _createForOfIteratorHelper(block.getTxs()),
            _step2;

        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var tx = _step2.value;
            tx.setBlock(this);

            MoneroBlock._mergeTx(this.getTxs(), tx);
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
      var str = (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroBlock.prototype), "toString", this).call(this, indent) + "\n";
      str += _GenUtils["default"].kvLine("Hex", this.getHex(), indent);

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

      if (this.getMinerTx() !== undefined) {
        str += _GenUtils["default"].kvLine("Miner tx", "", indent);
        str += this.getMinerTx().toString(indent + 1) + "\n";
      }

      str += _GenUtils["default"].kvLine("Txs hashes", this.getTxHashes(), indent);
      return str[str.length - 1] === "\n" ? str.slice(0, str.length - 1) : str; // strip last newline
    } // private helper to merge txs

  }], [{
    key: "_mergeTx",
    value: function _mergeTx(txs, tx) {
      var _iterator4 = _createForOfIteratorHelper(txs),
          _step4;

      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
          var aTx = _step4.value;

          if (aTx.getHash() === tx.getHash()) {
            aTx.merge(tx);
            return;
          }
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }

      txs.push(tx);
    }
  }]);
  return MoneroBlock;
}(_MoneroBlockHeader2["default"]);

MoneroBlock.DeserializationType = {
  TX: 0,
  TX_WALLET: 1,
  TX_QUERY: 2
};
var _default = MoneroBlock;
exports["default"] = _default;