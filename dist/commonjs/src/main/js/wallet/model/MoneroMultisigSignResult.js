"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/**
 * Models the result of signing multisig tx hex.
 */
var MoneroMultisigSignResult = /*#__PURE__*/function () {
  function MoneroMultisigSignResult(state) {
    (0, _classCallCheck2["default"])(this, MoneroMultisigSignResult);
    this.state = Object.assign({}, state);
  }

  (0, _createClass2["default"])(MoneroMultisigSignResult, [{
    key: "toJson",
    value: function toJson() {
      return Object.assign({}, this.state);
    }
  }, {
    key: "getSignedMultisigTxHex",
    value: function getSignedMultisigTxHex() {
      return this.state.signedMultisigTxHex;
    }
  }, {
    key: "setSignedMultisigTxHex",
    value: function setSignedMultisigTxHex(signedTxMultisigHex) {
      this.state.signedMultisigTxHex = signedTxMultisigHex;
    }
  }, {
    key: "getTxHashes",
    value: function getTxHashes() {
      return this.state.txHashes;
    }
  }, {
    key: "setTxHashes",
    value: function setTxHashes(txHashes) {
      this.state.txHashes = txHashes;
    }
  }]);
  return MoneroMultisigSignResult;
}();

var _default = MoneroMultisigSignResult;
exports["default"] = _default;