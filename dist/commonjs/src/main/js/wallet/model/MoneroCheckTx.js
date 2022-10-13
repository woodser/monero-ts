"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _MoneroCheck2 = _interopRequireDefault(require("./MoneroCheck"));

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * Results from checking a transaction key.
 * 
 * @extends {MoneroCheck}
 */
var MoneroCheckTx = /*#__PURE__*/function (_MoneroCheck) {
  (0, _inherits2["default"])(MoneroCheckTx, _MoneroCheck);

  var _super = _createSuper(MoneroCheckTx);

  function MoneroCheckTx(state) {
    var _this;

    (0, _classCallCheck2["default"])(this, MoneroCheckTx);
    _this = _super.call(this, state);
    if (_this.state.receivedAmount !== undefined && !(_this.state.receivedAmount instanceof BigInt)) _this.state.receivedAmount = BigInt(_this.state.receivedAmount);
    return _this;
  }

  (0, _createClass2["default"])(MoneroCheckTx, [{
    key: "toJson",
    value: function toJson() {
      var json = Object.assign({}, this.state);
      if (this.getReceivedAmount() !== undefined) json.receivedAmount = this.getReceivedAmount().toString();
      return json;
    }
  }, {
    key: "inTxPool",
    value: function inTxPool() {
      return this.state.inTxPool;
    }
  }, {
    key: "setInTxPool",
    value: function setInTxPool(inTxPool) {
      this.state.inTxPool = inTxPool;
      return this;
    }
  }, {
    key: "getNumConfirmations",
    value: function getNumConfirmations() {
      return this.state.numConfirmations;
    }
  }, {
    key: "setNumConfirmations",
    value: function setNumConfirmations(numConfirmations) {
      this.state.numConfirmations = numConfirmations;
      return this;
    }
  }, {
    key: "getReceivedAmount",
    value: function getReceivedAmount() {
      return this.state.receivedAmount;
    }
  }, {
    key: "setReceivedAmount",
    value: function setReceivedAmount(receivedAmount) {
      this.state.receivedAmount = receivedAmount;
      return this;
    }
  }]);
  return MoneroCheckTx;
}(_MoneroCheck2["default"]);

var _default = MoneroCheckTx;
exports["default"] = _default;