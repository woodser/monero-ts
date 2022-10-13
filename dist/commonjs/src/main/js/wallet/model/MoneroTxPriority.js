"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

/**
 * Enumerates send priorities.
 * 
 * @hideconstructor
 */
var MoneroTxPriority = /*#__PURE__*/(0, _createClass2["default"])(function MoneroTxPriority() {
  (0, _classCallCheck2["default"])(this, MoneroTxPriority);
});
/**
 * Default priority (i.e. normal) (value=0).
 */

MoneroTxPriority.DEFAULT = 0;
/**
 * Unimportant priority (value=1).
 */

MoneroTxPriority.UNIMPORTANT = 1;
/**
 * Normal priority (value=2).
 */

MoneroTxPriority.NORMAL = 2;
/**
 * Elevated priority (value=3).
 */

MoneroTxPriority.ELEVATED = 3;
var _default = MoneroTxPriority;
exports["default"] = _default;