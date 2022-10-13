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

var _MoneroWalletListener2 = _interopRequireDefault(require("../../main/js/wallet/model/MoneroWalletListener"));

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * Print sync progress every X blocks.
 */
var WalletSyncPrinter = /*#__PURE__*/function (_MoneroWalletListener) {
  (0, _inherits2["default"])(WalletSyncPrinter, _MoneroWalletListener);

  var _super = _createSuper(WalletSyncPrinter);

  function WalletSyncPrinter(syncResolution) {
    var _this;

    (0, _classCallCheck2["default"])(this, WalletSyncPrinter);
    _this = _super.call(this);
    _this.nextIncrement = 0;
    _this.syncResolution = syncResolution ? syncResolution : .05;
    return _this;
  }

  (0, _createClass2["default"])(WalletSyncPrinter, [{
    key: "onSyncProgress",
    value: function onSyncProgress(height, startHeight, endHeight, percentDone, message) {
      if (percentDone === 1 || percentDone >= this.nextIncrement) {
        console.log("onSyncProgress(" + height + ", " + startHeight + ", " + endHeight + ", " + percentDone + ", " + message + ")");
        this.nextIncrement += this.syncResolution;
      }
    }
  }]);
  return WalletSyncPrinter;
}(_MoneroWalletListener2["default"]);

var _default = WalletSyncPrinter;
exports["default"] = _default;