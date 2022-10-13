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

/**
 * Models a base transfer of funds to or from the wallet.
 * 
 * @class
 */
var MoneroTransfer = /*#__PURE__*/function () {
  /**
   * Construct the model.
   * 
   * @param {MoneroTransfer|object} state is existing state to initialize from (optional)
   */
  function MoneroTransfer(state) {
    (0, _classCallCheck2["default"])(this, MoneroTransfer);
    // initialize internal state
    if (!state) state = {};else if (state instanceof MoneroTransfer) state = state.toJson();else if ((0, _typeof2["default"])(state) === "object") state = Object.assign({}, state);else throw new MoneroError("state must be a MoneroTransfer or JavaScript object");
    this.state = state; // deserialize fields if necessary

    if (state.amount !== undefined && !(state.amount instanceof BigInt)) state.amount = BigInt(state.amount); // validate state

    this._validate();
  }

  (0, _createClass2["default"])(MoneroTransfer, [{
    key: "copy",
    value: function copy() {
      return new MoneroTransfer(this);
    }
  }, {
    key: "toJson",
    value: function toJson() {
      var json = Object.assign({}, this.state);
      if (this.getAmount() !== undefined) json.amount = this.getAmount().toString();
      delete json.tx; // parent tx is not serialized

      return json;
    }
  }, {
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
    key: "isOutgoing",
    value: function isOutgoing() {
      var isIncoming = this.isIncoming();
      (0, _assert["default"])(typeof isIncoming === "boolean");
      return !isIncoming;
    }
  }, {
    key: "isIncoming",
    value: function isIncoming() {
      throw new Error("Subclass must implement");
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

      this._validate();

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
    /**
     * Updates this transaction by merging the latest information from the given
     * transaction.
     * 
     * Merging can modify or build references to the transfer given so it
     * should not be re-used or it should be copied before calling this method.
     * 
     * @param transfer is the transfer to merge into this one
     * @return {MoneroTransfer} the merged transfer
     */

  }, {
    key: "merge",
    value: function merge(transfer) {
      (0, _assert["default"])(transfer instanceof MoneroTransfer);
      if (this === transfer) return this; // merge transactions if they're different which comes back to merging transfers

      if (this.getTx() !== transfer.getTx()) {
        this.getTx().merge(transfer.getTx());
        return this;
      } // otherwise merge transfer fields


      this.setAccountIndex(_GenUtils["default"].reconcile(this.getAccountIndex(), transfer.getAccountIndex())); // TODO monero-project: failed tx in pool (after testUpdateLockedDifferentAccounts()) causes non-originating saved wallets to return duplicate incoming transfers but one has amount of 0

      if (this.getAmount() !== undefined && transfer.getAmount() !== undefined && _GenUtils["default"].compareBigInt(this.getAmount(), transfer.getAmount()) !== 0 && (_GenUtils["default"].compareBigInt(this.getAmount(), BigInt("0")) === 0 || _GenUtils["default"].compareBigInt(transfer.getAmount(), BigInt("0")) === 0)) {
        console.warn("monero-project returning transfers with 0 amount/numSuggestedConfirmations");
      } else {
        this.setAmount(_GenUtils["default"].reconcile(this.getAmount(), transfer.getAmount()));
      }

      return this;
    }
  }, {
    key: "toString",
    value: function toString() {
      var indent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var str = "";
      str += _GenUtils["default"].kvLine("Is incoming", this.isIncoming(), indent);
      str += _GenUtils["default"].kvLine("Account index", this.getAccountIndex(), indent);
      str += _GenUtils["default"].kvLine("Amount", this.getAmount() ? this.getAmount().toString() : undefined, indent);
      return str === "" ? str : str.slice(0, str.length - 1); // strip last newline
    }
  }, {
    key: "_validate",
    value: function _validate() {
      if (this.getAccountIndex() !== undefined && this.getAccountIndex() < 0) throw new MoneroError("Account index must be >= 0");
    }
  }]);
  return MoneroTransfer;
}();

var _default = MoneroTransfer;
exports["default"] = _default;