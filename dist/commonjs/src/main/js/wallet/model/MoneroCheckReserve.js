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
 * Results from checking a reserve proof.
 * 
 * @extends {MoneroCheck}
 */
var MoneroCheckReserve = /*#__PURE__*/function (_MoneroCheck) {
  (0, _inherits2["default"])(MoneroCheckReserve, _MoneroCheck);

  var _super = _createSuper(MoneroCheckReserve);

  function MoneroCheckReserve(state) {
    var _this;

    (0, _classCallCheck2["default"])(this, MoneroCheckReserve);
    _this = _super.call(this, state);
    if (_this.state.totalAmount !== undefined && !(_this.state.totalAmount instanceof BigInt)) _this.state.totalAmount = BigInt(_this.state.totalAmount);
    if (_this.state.unconfirmedSpentAmount !== undefined && !(_this.state.unconfirmedSpentAmount instanceof BigInt)) _this.state.unconfirmedSpentAmount = BigInt(_this.state.unconfirmedSpentAmount);
    return _this;
  }

  (0, _createClass2["default"])(MoneroCheckReserve, [{
    key: "toJson",
    value: function toJson() {
      var json = Object.assign({}, this.state);
      if (this.getTotalAmount() !== undefined) json.totalAmount = this.getTotalAmount().toString();
      if (this.getUnconfirmedSpentAmount() !== undefined) json.unconfirmedSpentAmount = this.getUnconfirmedSpentAmount().toString();
      return json;
    }
  }, {
    key: "getTotalAmount",
    value: function getTotalAmount() {
      return this.state.totalAmount;
    }
  }, {
    key: "setTotalAmount",
    value: function setTotalAmount(totalAmount) {
      this.state.totalAmount = totalAmount;
      return this;
    }
  }, {
    key: "getUnconfirmedSpentAmount",
    value: function getUnconfirmedSpentAmount() {
      return this.state.unconfirmedSpentAmount;
    }
  }, {
    key: "setUnconfirmedSpentAmount",
    value: function setUnconfirmedSpentAmount(unconfirmedSpentAmount) {
      this.state.unconfirmedSpentAmount = unconfirmedSpentAmount;
      return this;
    }
  }]);
  return MoneroCheckReserve;
}(_MoneroCheck2["default"]);

var _default = MoneroCheckReserve;
exports["default"] = _default;