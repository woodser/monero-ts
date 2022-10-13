"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/**
 * Base class for results from checking a transaction or reserve proof.
 * 
 * @class
 */
var MoneroCheck = /*#__PURE__*/function () {
  function MoneroCheck(state) {
    (0, _classCallCheck2["default"])(this, MoneroCheck);
    this.state = Object.assign({}, state);
  }

  (0, _createClass2["default"])(MoneroCheck, [{
    key: "isGood",
    value: function isGood() {
      return this.state.isGood;
    }
  }, {
    key: "setIsGood",
    value: function setIsGood(isGood) {
      this.state.isGood = isGood;
      return this;
    }
  }]);
  return MoneroCheck;
}();

var _default = MoneroCheck;
exports["default"] = _default;