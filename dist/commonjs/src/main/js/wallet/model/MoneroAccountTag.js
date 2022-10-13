"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/**
 * Represents an account tag.
 */
var MoneroAccountTag = /*#__PURE__*/function () {
  function MoneroAccountTag(tag, label, accountIndices) {
    (0, _classCallCheck2["default"])(this, MoneroAccountTag);
    this.tag = tag;
    this.label = label;
    this.accountIndices = accountIndices;
  }

  (0, _createClass2["default"])(MoneroAccountTag, [{
    key: "getTag",
    value: function getTag() {
      return this.tag;
    }
  }, {
    key: "setTag",
    value: function setTag(tag) {
      this.tag = tag;
      return this;
    }
  }, {
    key: "getLabel",
    value: function getLabel() {
      return this.label;
    }
  }, {
    key: "setLabel",
    value: function setLabel(label) {
      this.label = label;
      return this;
    }
  }, {
    key: "getAccountIndices",
    value: function getAccountIndices() {
      return this.accountIndices;
    }
  }, {
    key: "setAccountIndices",
    value: function setAccountIndices(accountIndices) {
      this.accoutIndices = accountIndices;
      return this;
    }
  }]);
  return MoneroAccountTag;
}();

var _default = MoneroAccountTag;
exports["default"] = _default;