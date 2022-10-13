"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

/**
 * Enumerate message signature types.
 * 
 * @hideconstructor
 */
var MoneroMessageSignatureType = /*#__PURE__*/(0, _createClass2["default"])(function MoneroMessageSignatureType() {
  (0, _classCallCheck2["default"])(this, MoneroMessageSignatureType);
});
/**
 * Sign with spend key (value=0).
 */

MoneroMessageSignatureType.SIGN_WITH_SPEND_KEY = 0;
/**
 * Sign with the view key (value=1).
 */

MoneroMessageSignatureType.SIGN_WITH_VIEW_KEY = 1;
var _default = MoneroMessageSignatureType;
exports["default"] = _default;