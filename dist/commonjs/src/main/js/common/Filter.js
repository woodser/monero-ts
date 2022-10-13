"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/**
 * Base filter.
 * 
 * @private
 */
var Filter = /*#__PURE__*/function () {
  function Filter() {
    (0, _classCallCheck2["default"])(this, Filter);
  }

  (0, _createClass2["default"])(Filter, [{
    key: "meetsCriteria",
    value:
    /**
     * Indicates if the given value meets the criteria of this filter.
     * 
     * @param val is the value to test
     * @return true if the value meets the criteria of this filter, false otherwise
     */
    function meetsCriteria(val) {
      throw new Error("Subclass must implement");
    }
    /**
     * Returns a new array comprised of elements from the given array that meet
     * the filter's criteria.
     * 
     * @param filter implements meetsCriteria(elem) to filter the given array
     * @param array is the array to apply the filter to
     * @return the new array of filtered elements
     */

  }], [{
    key: "apply",
    value: function apply(filter, array) {
      return array.filter(function (elem) {
        return !filter || filter.meetsCriteria(elem);
      });
    }
  }]);
  return Filter;
}();

var _default = Filter;
exports["default"] = _default;