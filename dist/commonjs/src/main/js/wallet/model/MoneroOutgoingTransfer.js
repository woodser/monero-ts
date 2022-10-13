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

var _MoneroDestination = _interopRequireDefault(require("./MoneroDestination"));

var _MoneroTransfer2 = _interopRequireDefault(require("./MoneroTransfer"));

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * Models an outgoing transfer of funds from the wallet.
 * 
 * @extends {MoneroTransfer}
 */
var MoneroOutgoingTransfer = /*#__PURE__*/function (_MoneroTransfer) {
  (0, _inherits2["default"])(MoneroOutgoingTransfer, _MoneroTransfer);

  var _super = _createSuper(MoneroOutgoingTransfer);

  /**
   * Construct the model.
   * 
   * @param {MoneroOutgoingTranser|object} state is existing state to initialize from (optional)
   */
  function MoneroOutgoingTransfer(state) {
    var _this;

    (0, _classCallCheck2["default"])(this, MoneroOutgoingTransfer);
    _this = _super.call(this, state);
    state = _this.state; // deserialize destinations

    if (state.destinations) {
      for (var i = 0; i < state.destinations.length; i++) {
        if (!(state.destinations[i] instanceof _MoneroDestination["default"])) state.destinations[i] = new _MoneroDestination["default"](state.destinations[i]);
      }
    }

    return _this;
  }

  (0, _createClass2["default"])(MoneroOutgoingTransfer, [{
    key: "isIncoming",
    value: function isIncoming() {
      return false;
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
    key: "getAddresses",
    value: function getAddresses() {
      return this.state.addresses;
    }
  }, {
    key: "setAddresses",
    value: function setAddresses(addresses) {
      this.state.addresses = addresses;
      return this;
    }
  }, {
    key: "getDestinations",
    value: function getDestinations() {
      return this.state.destinations;
    }
  }, {
    key: "setDestinations",
    value: function setDestinations(destinations) {
      this.state.destinations = destinations;
      return this;
    }
  }, {
    key: "copy",
    value: function copy() {
      return new MoneroOutgoingTransfer(this);
    }
  }, {
    key: "toJson",
    value: function toJson() {
      var json = Object.assign({}, this.state, (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroOutgoingTransfer.prototype), "toJson", this).call(this)); // merge json onto inherited state

      if (this.getDestinations() !== undefined) {
        json.destinations = [];

        var _iterator = _createForOfIteratorHelper(this.getDestinations()),
            _step;

        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var destination = _step.value;
            json.destinations.push(destination.toJson());
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }

      delete json.tx; // parent tx is not serialized

      return json;
    }
    /**
     * Updates this transaction by merging the latest information from the given
     * transaction.
     * 
     * Merging can modify or build references to the transfer given so it
     * should not be re-used or it should be copied before calling this method.
     * 
     * @param transfer is the transfer to merge into this one
     */

  }, {
    key: "merge",
    value: function merge(transfer) {
      (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroOutgoingTransfer.prototype), "merge", this).call(this, transfer);
      (0, _assert["default"])(transfer instanceof MoneroOutgoingTransfer);
      if (this === transfer) return this;
      this.setSubaddressIndices(_GenUtils["default"].reconcile(this.getSubaddressIndices(), transfer.getSubaddressIndices()));
      this.setAddresses(_GenUtils["default"].reconcile(this.getAddresses(), transfer.getAddresses()));
      this.setDestinations(_GenUtils["default"].reconcile(this.getDestinations(), transfer.getDestinations()));
      return this;
    }
  }, {
    key: "toString",
    value: function toString() {
      var indent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var str = (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroOutgoingTransfer.prototype), "toString", this).call(this, indent) + "\n";
      str += _GenUtils["default"].kvLine("Subaddress indices", this.getSubaddressIndices(), indent);
      str += _GenUtils["default"].kvLine("Addresses", this.getAddresses(), indent);

      if (this.getDestinations() !== undefined) {
        str += _GenUtils["default"].kvLine("Destinations", "", indent);

        for (var i = 0; i < this.getDestinations().length; i++) {
          str += _GenUtils["default"].kvLine(i + 1, "", indent + 1);
          str += this.getDestinations()[i].toString(indent + 2) + "\n";
        }
      }

      return str.slice(0, str.length - 1); // strip last newline
    }
  }]);
  return MoneroOutgoingTransfer;
}(_MoneroTransfer2["default"]);

var _default = MoneroOutgoingTransfer;
exports["default"] = _default;