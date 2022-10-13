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

var _wrapNativeSuper2 = _interopRequireDefault(require("@babel/runtime/helpers/wrapNativeSuper"));

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * Exception when interacting with a Monero wallet or daemon.
 */
var MoneroError = /*#__PURE__*/function (_Error) {
  (0, _inherits2["default"])(MoneroError, _Error);

  var _super = _createSuper(MoneroError);

  /**
   * Constructs the error.
   * 
   * @param {string} message is a human-readable message of the error
   * @param {number} code is the error code (optional)
   */
  function MoneroError(message, code) {
    var _this;

    (0, _classCallCheck2["default"])(this, MoneroError);
    _this = _super.call(this, message);
    _this.code = code;
    return _this;
  }

  (0, _createClass2["default"])(MoneroError, [{
    key: "getCode",
    value: function getCode() {
      return this.code;
    }
  }, {
    key: "toString",
    value: function toString() {
      if (this.message === undefined && this.getCode() === undefined) return (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroError.prototype), "message", this);
      var str = "";
      if (this.getCode() !== undefined) str += this.getCode() + ": ";
      str += this.message;
      return str;
    }
  }]);
  return MoneroError;
}( /*#__PURE__*/(0, _wrapNativeSuper2["default"])(Error));

var _default = MoneroError;
exports["default"] = _default;