"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assert = _interopRequireDefault(require("assert"));

var _GenUtils = _interopRequireDefault(require("../../common/GenUtils"));

/**
 * Models a Monero key image.
 */
var MoneroKeyImage = /*#__PURE__*/function () {
  /**
   * Construct the model.
   * 
   * @param {MoneroKeyImage|object|string} stateOrHex is a MoneroKeyImage, JS object, or hex string to initialize from (optional)
   * @param {string} signature is the key image's signature
   */
  function MoneroKeyImage(stateOrHex, signature) {
    (0, _classCallCheck2["default"])(this, MoneroKeyImage);
    if (!stateOrHex) this.state = {};else if (stateOrHex instanceof MoneroKeyImage) this.state = stateOrHex.toJson();else if ((0, _typeof2["default"])(stateOrHex) === "object") this.state = Object.assign({}, stateOrHex);else if (typeof stateOrHex === "string") {
      this.state = {};
      this.setHex(stateOrHex);
      this.setSignature(signature);
    } else {
      throw new MoneroError("stateOrHex must be a MoneroKeyImage, JavaScript object, or string");
    }
  }

  (0, _createClass2["default"])(MoneroKeyImage, [{
    key: "getHex",
    value: function getHex() {
      return this.state.hex;
    }
  }, {
    key: "setHex",
    value: function setHex(hex) {
      this.state.hex = hex;
      return this;
    }
  }, {
    key: "getSignature",
    value: function getSignature() {
      return this.state.signature;
    }
  }, {
    key: "setSignature",
    value: function setSignature(signature) {
      this.state.signature = signature;
      return this;
    }
  }, {
    key: "copy",
    value: function copy() {
      return new MoneroKeyImage(this);
    }
  }, {
    key: "toJson",
    value: function toJson() {
      return Object.assign({}, this.state);
    }
  }, {
    key: "merge",
    value: function merge(keyImage) {
      (0, _assert["default"])(keyImage instanceof MoneroKeyImage);
      if (keyImage === this) return this;
      this.setHex(_GenUtils["default"].reconcile(this.getHex(), keyImage.getHex()));
      this.setSignature(_GenUtils["default"].reconcile(this.getSignature(), keyImage.getSignature()));
      return this;
    }
  }, {
    key: "toString",
    value: function toString() {
      var indent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var str = "";
      str += _GenUtils["default"].kvLine("Hex", this.getHex(), indent);
      str += _GenUtils["default"].kvLine("Signature", this.getSignature(), indent);
      return str.slice(0, str.length - 1); // strip last newline
    }
  }]);
  return MoneroKeyImage;
}();

var _default = MoneroKeyImage;
exports["default"] = _default;