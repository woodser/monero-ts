"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _assert = _interopRequireDefault(require("assert"));

var _GenUtils = _interopRequireDefault(require("../../common/GenUtils"));

var _MoneroTransfer2 = _interopRequireDefault(require("./MoneroTransfer"));

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * Models an incoming transfer of funds to the wallet.
 * 
 * @extends {MoneroTransfer}
 */
var MoneroIncomingTransfer = /*#__PURE__*/function (_MoneroTransfer) {
  (0, _inherits2["default"])(MoneroIncomingTransfer, _MoneroTransfer);

  var _super = _createSuper(MoneroIncomingTransfer);

  /**
   * Construct the model.
   * 
   * @param {MoneroTransfer|object} state is existing state to initialize from (optional)
   */
  function MoneroIncomingTransfer(state) {
    (0, _classCallCheck2["default"])(this, MoneroIncomingTransfer);
    return _super.call(this, state);
  }

  (0, _createClass2["default"])(MoneroIncomingTransfer, [{
    key: "isIncoming",
    value: function isIncoming() {
      return true;
    }
  }, {
    key: "getSubaddressIndex",
    value: function getSubaddressIndex() {
      return this.state.subaddressIndex;
    }
  }, {
    key: "setSubaddressIndex",
    value: function setSubaddressIndex(subaddressIndex) {
      this.state.subaddressIndex = subaddressIndex;
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
    /**
     * Return how many confirmations till it's not economically worth re-writing the chain.
     * That is, the number of confirmations before the transaction is highly unlikely to be
     * double spent or overwritten and may be considered settled, e.g. for a merchant to trust
     * as finalized.
     * 
     * @return {number} is the number of confirmations before it's not worth rewriting the chain
     */

  }, {
    key: "getNumSuggestedConfirmations",
    value: function getNumSuggestedConfirmations() {
      return this.state.numSuggestedConfirmations;
    }
  }, {
    key: "setNumSuggestedConfirmations",
    value: function setNumSuggestedConfirmations(numSuggestedConfirmations) {
      this.state.numSuggestedConfirmations = numSuggestedConfirmations;
      return this;
    }
  }, {
    key: "copy",
    value: function copy() {
      return new MoneroIncomingTransfer(this.toJson());
    }
    /**
     * Updates this transaction by merging the latest information from the given
     * transaction.
     * 
     * Merging can modify or build references to the transfer given so it
     * should not be re-used or it should be copied before calling this method.
     * 
     * @param {MoneroIncomingTransfer} transfer is the transfer to merge into this one
     */

  }, {
    key: "merge",
    value: function merge(transfer) {
      (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroIncomingTransfer.prototype), "merge", this).call(this, transfer);
      (0, _assert["default"])(transfer instanceof MoneroIncomingTransfer);
      if (this === transfer) return this;
      this.setSubaddressIndex(_GenUtils["default"].reconcile(this.getSubaddressIndex(), transfer.getSubaddressIndex()));
      this.setAddress(_GenUtils["default"].reconcile(this.getAddress(), transfer.getAddress()));
      this.setNumSuggestedConfirmations(_GenUtils["default"].reconcile(this.getNumSuggestedConfirmations(), transfer.getNumSuggestedConfirmations(), {
        resolveMax: false
      }));
      return this;
    }
  }, {
    key: "toString",
    value: function toString(indent) {
      var str = (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroIncomingTransfer.prototype), "toString", this).call(this, indent) + "\n";
      str += _GenUtils["default"].kvLine("Subaddress index", this.getSubaddressIndex(), indent);
      str += _GenUtils["default"].kvLine("Address", this.getAddress(), indent);
      str += _GenUtils["default"].kvLine("Num suggested confirmations", this.getNumSuggestedConfirmations(), indent);
      return str.slice(0, str.length - 1); // strip last newline
    }
  }]);
  return MoneroIncomingTransfer;
}(_MoneroTransfer2["default"]);

var _default = MoneroIncomingTransfer;
exports["default"] = _default;