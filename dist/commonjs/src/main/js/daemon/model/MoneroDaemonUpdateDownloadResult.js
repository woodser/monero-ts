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

var _MoneroDaemonUpdateCheckResult = _interopRequireDefault(require("./MoneroDaemonUpdateCheckResult"));

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * Models the result of downloading an update.
 */
var MoneroDaemonUpdateDownloadResult = /*#__PURE__*/function (_MoneroDaemonUpdateCh) {
  (0, _inherits2["default"])(MoneroDaemonUpdateDownloadResult, _MoneroDaemonUpdateCh);

  var _super = _createSuper(MoneroDaemonUpdateDownloadResult);

  /**
   * Construct a download result.
   * 
   * @param {MoneroDaemonUpdateCheckResult} is an existing result to copy from
   */
  function MoneroDaemonUpdateDownloadResult(result) {
    (0, _classCallCheck2["default"])(this, MoneroDaemonUpdateDownloadResult);
    return _super.call(this, result);
  }
  /**
   * Get the path the update was downloaded to.
   * 
   * @return {string} is the path the update was downloaded to
   */


  (0, _createClass2["default"])(MoneroDaemonUpdateDownloadResult, [{
    key: "getDownloadPath",
    value: function getDownloadPath() {
      return this.state.downloadPath;
    }
  }, {
    key: "setDownloadPath",
    value: function setDownloadPath(downloadPath) {
      this.state.downloadPath = downloadPath;
      return this;
    }
  }]);
  return MoneroDaemonUpdateDownloadResult;
}(_MoneroDaemonUpdateCheckResult["default"]);

var _default = MoneroDaemonUpdateDownloadResult;
exports["default"] = _default;