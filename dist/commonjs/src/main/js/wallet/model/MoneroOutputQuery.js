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

var _MoneroError = _interopRequireDefault(require("../../common/MoneroError"));

var _MoneroOutputWallet2 = _interopRequireDefault(require("./MoneroOutputWallet"));

var _MoneroTxQuery = _interopRequireDefault(require("./MoneroTxQuery"));

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * Configuration to query wallet outputs.
 * 
 * @extends {MoneroOutputWallet}
 */
var MoneroOutputQuery = /*#__PURE__*/function (_MoneroOutputWallet) {
  (0, _inherits2["default"])(MoneroOutputQuery, _MoneroOutputWallet);

  var _super = _createSuper(MoneroOutputQuery);

  /**
   * <p>Construct the output query.</p>
   * 
   * <p>Example:</p>
   * 
   * <code>
   * &sol;&sol; get available outputs in account 0 with a minimum amount<br>
   * let outputs = await wallet.getOutputs({<br>
   * &nbsp;&nbsp; isSpent: false,<br>
   * &nbsp;&nbsp; isLocked: false,<br>
   * &nbsp;&nbsp; accountIndex: 0,<br>
   * &nbsp;&nbsp; minAmount: BigInt("750000")<br>
   * });
   * </code>
   * 
   * <p>All configuration is optional.  All outputs are returned except those that don't meet criteria defined in this query.</p>
   * 
   * @param {object} [config] - output query configuration (optional)
   * @param {number} config.accountIndex - get outputs in this account index
   * @param {number} config.subaddressIndex - get outputs in this subaddress index
   * @param {int[]} config.subaddressIndices - get outputs in these subaddress indices
   * @param {BigInt} config.amount - get outputs with this amount
   * @param {BigInt} config.minAmount - get outputs with amount greater than or equal to this amount
   * @param {BigInt} config.maxAmount - get outputs with amount less than or equal to this amount
   * @param {boolean} config.isSpent - get spent xor unspent outputs
   * @param {boolean} config.isFrozen - get frozen xor thawed outputs
   * @param {object|MoneroKeyImage} config.keyImage - get outputs with a key image matching fields defined in this key image
   * @param {string} config.keyImage.hex - get outputs with this key image hex
   * @param {string} config.keyImage.signature - get outputs with this key image signature
   * @param {object|MoneroTxQuery} config.txQuery - get outputs whose tx match this tx query
   */
  function MoneroOutputQuery(config) {
    var _this;

    (0, _classCallCheck2["default"])(this, MoneroOutputQuery);
    _this = _super.call(this, config); // deserialize if necessary
    //import MoneroTxQuery from "./MoneroTxQuery";

    if (_this.state.minAmount !== undefined && !(_this.state.minAmount instanceof BigInt)) _this.state.minAmount = BigInt(_this.state.minAmount);
    if (_this.state.maxAmount !== undefined && !(_this.state.maxAmount instanceof BigInt)) _this.state.maxAmount = BigInt(_this.state.maxAmount);
    if (_this.state.txQuery && !(_this.state.txQuery instanceof _MoneroTxQuery["default"])) _this.state.txQuery = new _MoneroTxQuery["default"](_this.state.txQuery);
    if (_this.state.txQuery) _this.state.txQuery.setOutputQuery((0, _assertThisInitialized2["default"])(_this));
    if (_this.state.isLocked !== undefined) throw new _MoneroError["default"]("isLocked must be part of tx query, not output query");
    return _this;
  }

  (0, _createClass2["default"])(MoneroOutputQuery, [{
    key: "copy",
    value: function copy() {
      return new MoneroOutputQuery(this);
    }
  }, {
    key: "toJson",
    value: function toJson() {
      var json = Object.assign({}, this.state, (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroOutputQuery.prototype), "toJson", this).call(this));
      if (this.getMinAmount() !== undefined) json.minAmount = this.getMinAmount().toString();
      if (this.getMaxAmount() !== undefined) json.maxAmount = this.getMaxAmount().toString();
      delete json.txQuery;
      return json;
    }
  }, {
    key: "getMinAmount",
    value: function getMinAmount() {
      return this.state.minAmount;
    }
  }, {
    key: "setMinAmount",
    value: function setMinAmount(minAmount) {
      this.state.minAmount = minAmount;
      return this;
    }
  }, {
    key: "getMaxAmount",
    value: function getMaxAmount() {
      return this.state.maxAmount;
    }
  }, {
    key: "setMaxAmount",
    value: function setMaxAmount(maxAmount) {
      this.state.maxAmount = maxAmount;
      return this;
    }
  }, {
    key: "getTxQuery",
    value: function getTxQuery() {
      return this.state.txQuery;
    }
  }, {
    key: "setTxQuery",
    value: function setTxQuery(txQuery) {
      this.state.txQuery = txQuery;
      if (txQuery) txQuery.state.outputQuery = this;
      return this;
    }
  }, {
    key: "getSubaddressIndices",
    value: function getSubaddressIndices() {
      return this.state.subaddressIndices;
    }
  }, {
    key: "setSubaddressIndices",
    value: function setSubaddressIndices(subaddressIndices) {
      this.state.subaddressIndices = subaddressIndices;
      return this;
    }
  }, {
    key: "meetsCriteria",
    value: function meetsCriteria(output, queryParent) {
      if (!(output instanceof _MoneroOutputWallet2["default"])) throw new Error("Output not given to MoneroOutputQuery.meetsCriteria(output)");
      if (queryParent === undefined) queryParent = true; // filter on output

      if (this.getAccountIndex() !== undefined && this.getAccountIndex() !== output.getAccountIndex()) return false;
      if (this.getSubaddressIndex() !== undefined && this.getSubaddressIndex() !== output.getSubaddressIndex()) return false;
      if (this.getAmount() !== undefined && GenUtils.compareBigInt(this.getAmount(), output.getAmount()) !== 0) return false;
      if (this.isSpent() !== undefined && this.isSpent() !== output.isSpent()) return false;
      if (this.isFrozen() !== undefined && this.isFrozen() !== output.isFrozen()) return false; // filter on output's key image

      if (this.getKeyImage() !== undefined) {
        if (output.getKeyImage() === undefined) return false;
        if (this.getKeyImage().getHex() !== undefined && this.getKeyImage().getHex() !== output.getKeyImage().getHex()) return false;
        if (this.getKeyImage().getSignature() !== undefined && this.getKeyImage().getSignature() !== output.getKeyImage().getSignature()) return false;
      } // filter on extensions


      if (this.getSubaddressIndices() !== undefined && !this.getSubaddressIndices().includes(output.getSubaddressIndex())) return false; // filter with tx query

      if (this.getTxQuery() && !this.getTxQuery().meetsCriteria(output.getTx(), false)) return false; // filter on remaining fields

      if (this.getMinAmount() !== undefined && (output.getAmount() === undefined || GenUtils.compareBigInt(output.getAmount(), this.getMinAmount()) < 0)) return false;
      if (this.getMaxAmount() !== undefined && (output.getAmount() === undefined || GenUtils.compareBigInt(output.getAmount(), this.getMaxAmount()) > 0)) return false; // output meets query

      return true;
    }
  }]);
  return MoneroOutputQuery;
}(_MoneroOutputWallet2["default"]);

MoneroOutputQuery._EMPTY_OUTPUT = new _MoneroOutputWallet2["default"]();
var _default = MoneroOutputQuery;
exports["default"] = _default;