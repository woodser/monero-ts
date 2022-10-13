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

var _MoneroKeyImage = _interopRequireDefault(require("./MoneroKeyImage"));

/**
 * Models a Monero transaction output.
 * 
 * @class
 */
var MoneroOutput = /*#__PURE__*/function () {
  /**
   * Construct the model.
   * 
   * @param {MoneroOutput|object} state is existing state to initialize from (optional)
   */
  function MoneroOutput(state) {
    (0, _classCallCheck2["default"])(this, MoneroOutput);
    // initialize internal state
    if (!state) state = {};else if (state instanceof MoneroOutput) state = state.toJson();else if ((0, _typeof2["default"])(state) === "object") state = Object.assign({}, state);else throw new MoneroError("state must be a MoneroOutput or JavaScript object");
    this.state = state; // deserialize fields if necessary

    if (state.amount !== undefined && !(state.amount instanceof BigInt)) state.amount = BigInt(state.amount);
    if (state.keyImage && !(state.keyImage instanceof _MoneroKeyImage["default"])) state.keyImage = new _MoneroKeyImage["default"](state.keyImage);
  }

  (0, _createClass2["default"])(MoneroOutput, [{
    key: "getTx",
    value: function getTx() {
      return this.state.tx;
    }
  }, {
    key: "setTx",
    value: function setTx(tx) {
      this.state.tx = tx;
      return this;
    }
  }, {
    key: "getKeyImage",
    value: function getKeyImage() {
      return this.state.keyImage;
    }
  }, {
    key: "setKeyImage",
    value: function setKeyImage(keyImage) {
      (0, _assert["default"])(keyImage === undefined || keyImage instanceof _MoneroKeyImage["default"]);
      this.state.keyImage = keyImage;
      return this;
    }
  }, {
    key: "getAmount",
    value: function getAmount() {
      return this.state.amount;
    }
  }, {
    key: "setAmount",
    value: function setAmount(amount) {
      this.state.amount = amount;
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
    key: "getRingOutputIndices",
    value: function getRingOutputIndices() {
      return this.state.ringOutputIndices;
    }
  }, {
    key: "setRingOutputIndices",
    value: function setRingOutputIndices(ringOutputIndices) {
      this.state.ringOutputIndices = ringOutputIndices;
      return this;
    }
  }, {
    key: "getStealthPublicKey",
    value: function getStealthPublicKey() {
      return this.state.stealthPublicKey;
    }
  }, {
    key: "setStealthPublicKey",
    value: function setStealthPublicKey(stealthPublicKey) {
      this.state.stealthPublicKey = stealthPublicKey;
      return this;
    }
  }, {
    key: "copy",
    value: function copy() {
      return new MoneroOutput(this);
    }
  }, {
    key: "toJson",
    value: function toJson() {
      var json = Object.assign({}, this.state);
      if (this.getAmount() !== undefined) json.amount = this.getAmount() ? this.getAmount().toString() : undefined;
      if (this.getKeyImage() !== undefined) json.keyImage = this.getKeyImage() ? this.getKeyImage().toJson() : undefined;
      delete json.tx;
      return json;
    }
  }, {
    key: "merge",
    value: function merge(output) {
      (0, _assert["default"])(output instanceof MoneroOutput);
      if (this === output) return this; // merge txs if they're different which comes back to merging outputs

      if (this.getTx() !== output.getTx()) this.getTx().merge(output.getTx()); // otherwise merge output fields
      else {
        if (this.getKeyImage() === undefined) this.setKeyImage(output.getKeyImage());else if (output.getKeyImage() !== undefined) this.getKeyImage().merge(output.getKeyImage());
        this.setAmount(_GenUtils["default"].reconcile(this.getAmount(), output.getAmount()));
        this.setIndex(_GenUtils["default"].reconcile(this.getIndex(), output.getIndex()));
      }
      return this;
    }
  }, {
    key: "toString",
    value: function toString() {
      var indent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var str = "";

      if (this.getKeyImage() !== undefined) {
        str += _GenUtils["default"].kvLine("Key image", "", indent);
        str += this.getKeyImage().toString(indent + 1) + "\n";
      }

      str += _GenUtils["default"].kvLine("Amount", this.getAmount(), indent);
      str += _GenUtils["default"].kvLine("Index", this.getIndex(), indent);
      str += _GenUtils["default"].kvLine("Ring output indices", this.getRingOutputIndices(), indent);
      str += _GenUtils["default"].kvLine("Stealth public key", this.getStealthPublicKey(), indent);
      return str === "" ? str : str.slice(0, str.length - 1); // strip last newline
    }
  }]);
  return MoneroOutput;
}();

var _default = MoneroOutput;
exports["default"] = _default;