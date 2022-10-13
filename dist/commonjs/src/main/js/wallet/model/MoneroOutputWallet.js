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

var _MoneroOutput2 = _interopRequireDefault(require("../../daemon/model/MoneroOutput"));

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * Models a Monero output with wallet extensions.
 * 
 * @class
 * @extends {MoneroOutput}
 */
var MoneroOutputWallet = /*#__PURE__*/function (_MoneroOutput) {
  (0, _inherits2["default"])(MoneroOutputWallet, _MoneroOutput);

  var _super = _createSuper(MoneroOutputWallet);

  /**
   * Construct the model.
   * 
   * @param {MoneroOutputWallet|object} state is existing state to initialize from (optional)
   */
  function MoneroOutputWallet(state) {
    (0, _classCallCheck2["default"])(this, MoneroOutputWallet);
    return _super.call(this, state);
  }

  (0, _createClass2["default"])(MoneroOutputWallet, [{
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
    key: "isSpent",
    value: function isSpent() {
      return this.state.isSpent;
    }
  }, {
    key: "setIsSpent",
    value: function setIsSpent(isSpent) {
      this.state.isSpent = isSpent;
      return this;
    }
    /**
     * Indicates if this output has been deemed 'malicious' and will therefore
     * not be spent by the wallet.
     * 
     * @return Boolean is whether or not this output is frozen
     */

  }, {
    key: "isFrozen",
    value: function isFrozen() {
      return this.state.isFrozen;
    }
  }, {
    key: "setIsFrozen",
    value: function setIsFrozen(isFrozen) {
      this.state.isFrozen = isFrozen;
      return this;
    }
  }, {
    key: "isLocked",
    value: function isLocked() {
      if (this.getTx() === undefined) return undefined;
      return this.getTx().isLocked();
    }
  }, {
    key: "copy",
    value: function copy() {
      return new MoneroOutputWallet(this.toJson());
    }
  }, {
    key: "toJson",
    value: function toJson() {
      var json = Object.assign({}, this.state, (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroOutputWallet.prototype), "toJson", this).call(this));
      delete json.tx;
      return json;
    }
    /**
     * Updates this output by merging the latest information from the given
     * output.
     * 
     * Merging can modify or build references to the output given so it
     * should not be re-used or it should be copied before calling this method.
     * 
     * @param output is the output to merge into this one
     */

  }, {
    key: "merge",
    value: function merge(output) {
      (0, _assert["default"])(output instanceof MoneroOutputWallet);
      if (this === output) return;
      (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroOutputWallet.prototype), "merge", this).call(this, output);
      this.setAccountIndex(_GenUtils["default"].reconcile(this.getAccountIndex(), output.getAccountIndex()));
      this.setSubaddressIndex(_GenUtils["default"].reconcile(this.getSubaddressIndex(), output.getSubaddressIndex()));
      this.setIsSpent(_GenUtils["default"].reconcile(this.isSpent(), output.isSpent(), {
        resolveTrue: true
      })); // output can become spent

      this.setIsFrozen(_GenUtils["default"].reconcile(this.isFrozen(), output.isFrozen()));
      return this;
    }
  }, {
    key: "toString",
    value: function toString(indent) {
      var str = (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroOutputWallet.prototype), "toString", this).call(this, indent) + "\n";
      str += _GenUtils["default"].kvLine("Account index", this.getAccountIndex(), indent);
      str += _GenUtils["default"].kvLine("Subaddress index", this.getSubaddressIndex(), indent);
      str += _GenUtils["default"].kvLine("Is spent", this.isSpent(), indent);
      str += _GenUtils["default"].kvLine("Is frozen", this.isFrozen(), indent);
      return str.slice(0, str.length - 1); // strip last newline
    }
  }]);
  return MoneroOutputWallet;
}(_MoneroOutput2["default"]);

var _default = MoneroOutputWallet;
exports["default"] = _default;