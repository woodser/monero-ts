"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _MoneroError2 = _interopRequireDefault(require("./MoneroError"));

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * Error when interacting with Monero RPC.
 */
var MoneroRpcError = /*#__PURE__*/function (_MoneroError) {
  (0, _inherits2["default"])(MoneroRpcError, _MoneroError);

  var _super = _createSuper(MoneroRpcError);

  /**
   * Constructs the error.
   * 
   * @param {string} rpcDescription is a description of the error from rpc
   * @param {number} rpcCode is the error code from rpc
   * @param {string} rpcMethod is the rpc method invoked
   * @param {object} rpcParams are parameters sent with the rpc request
   */
  function MoneroRpcError(rpcDescription, rpcCode, rpcMethod, rpcParams) {
    var _this;

    (0, _classCallCheck2["default"])(this, MoneroRpcError);
    _this = _super.call(this, rpcDescription, rpcCode);
    _this.rpcMethod = rpcMethod;
    _this.rpcParams = rpcParams;
    return _this;
  }

  (0, _createClass2["default"])(MoneroRpcError, [{
    key: "getRpcMethod",
    value: function getRpcMethod() {
      return this.rpcMethod;
    }
  }, {
    key: "getRpcParams",
    value: function getRpcParams() {
      return this.rpcParams;
    }
  }, {
    key: "toString",
    value: function toString() {
      var str = (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroRpcError.prototype), "toString", this).call(this);
      if (this.rpcMethod || this.rpcParams) str += "\nRequest: '" + this.rpcMethod + "' with params: " + ((0, _typeof2["default"])(this.rpcParams) === "object" ? JSON.stringify(this.rpcParams) : this.rpcParams);
      return str;
    }
  }]);
  return MoneroRpcError;
}(_MoneroError2["default"]);

var _default = MoneroRpcError;
exports["default"] = _default;