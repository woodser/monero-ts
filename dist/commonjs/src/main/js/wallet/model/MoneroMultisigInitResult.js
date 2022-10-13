"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/**
 * Models the result of initializing a multisig wallet which results in the
 * multisig wallet's address xor another multisig hex to share with
 * participants to create the wallet.
 */
var MoneroMultisigInitResult = /*#__PURE__*/function () {
  function MoneroMultisigInitResult(state) {
    (0, _classCallCheck2["default"])(this, MoneroMultisigInitResult);
    this.state = Object.assign({}, state);
  }

  (0, _createClass2["default"])(MoneroMultisigInitResult, [{
    key: "toJson",
    value: function toJson() {
      return Object.assign({}, this.state);
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
  }, {
    key: "getMultisigHex",
    value: function getMultisigHex() {
      return this.state.multisigHex;
    }
  }, {
    key: "setMultisigHex",
    value: function setMultisigHex(multisigHex) {
      this.state.multisigHex = multisigHex;
      return this;
    }
  }]);
  return MoneroMultisigInitResult;
}();

var _default = MoneroMultisigInitResult;
exports["default"] = _default;