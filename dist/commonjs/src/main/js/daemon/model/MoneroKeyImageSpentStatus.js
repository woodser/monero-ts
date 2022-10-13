"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

/**
 * Enumerate key image spent statuses.
 * 
 * @hideconstructor
 */
var MoneroKeyImageSpentStatus = /*#__PURE__*/(0, _createClass2["default"])(function MoneroKeyImageSpentStatus() {
  (0, _classCallCheck2["default"])(this, MoneroKeyImageSpentStatus);
});
/**
 * Key image is not spent (value=0).
 */

MoneroKeyImageSpentStatus.NOT_SPENT = 0;
/**
 * Key image is confirmed (value=1).
 */

MoneroKeyImageSpentStatus.CONFIRMED = 1;
/**
 * Key image is in the pool (value=2).
 */

MoneroKeyImageSpentStatus.TX_POOL = 2;
var _default = MoneroKeyImageSpentStatus;
exports["default"] = _default;