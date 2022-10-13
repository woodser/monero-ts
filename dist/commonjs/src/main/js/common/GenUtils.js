"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _assert = _interopRequireDefault(require("assert"));

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

/**
 * MIT License
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Collection of general purpose utilities.
 * 
 * TODO: could pull in assert and remove these asserts
 * TODO: needs cleanup as ES6+ utility class
 */
var GenUtils = /*#__PURE__*/function () {
  function GenUtils() {
    (0, _classCallCheck2["default"])(this, GenUtils);
  }

  (0, _createClass2["default"])(GenUtils, null, [{
    key: "isDefined",
    value:
    /**
     * Indicates if the given argument is defined.
     * 
     * @param arg is the arg to test
     * @returns true if the given arg is defined, false otherwise
     */
    function isDefined(arg) {
      return typeof arg !== 'undefined';
    }
    /**
     * Indicates if the given argument is undefined.
     * 
     * @param arg is the arg to test
     * @returns true if the given arg is undefined, false otherwise
     */

  }, {
    key: "isUndefined",
    value: function isUndefined(arg) {
      return typeof arg === 'undefined';
    }
    /**
     * Indicates if the given arg is initialized.
     * 
     * @param arg is the arg to test
     * @returns true if the given arg is initialized, false otherwise
     */

  }, {
    key: "isInitialized",
    value: function isInitialized(arg) {
      return arg !== undefined && arg !== null;
    }
    /**
     * Indicates if the given arg is uninitialized.
     * 
     * @param arg is the arg to test
     * @returns true if the given arg is uninitialized, false otherwise
     */

  }, {
    key: "isUninitialized",
    value: function isUninitialized(arg) {
      if (!arg) return true;
      return false;
    }
    /**
     * Indicates if the given argument is a number.
     * 
     * @param arg is the argument to test
     * @returns true if the argument is a number, false otherwise
     */

  }, {
    key: "isNumber",
    value: function isNumber(arg) {
      return !isNaN(parseFloat(arg)) && isFinite(arg);
    }
    /**
     * Indicates if the given argument is an integer.
     * 
     * @param arg is the argument to test
     * @returns true if the given argument is an integer, false otherwise
     */

  }, {
    key: "isInt",
    value: function isInt(arg) {
      return arg === parseInt(Number(arg)) && !isNaN(arg) && !isNaN(parseInt(arg, 10));
    }
    /**
     * Indicates if the given argument is an array.
     * 
     * @param arg is the argument to test as being an array
     * @returns true if the argument is an array, false otherwise
     */

  }, {
    key: "isArray",
    value: function isArray(arg) {
      return arg instanceof Array && Array.isArray(arg);
    }
    /**
     * Indicates if the given argument is a string.
     * 
     * @param arg is the argument to test as being a string
     * @returns true if the argument is a string, false otherwise
     */

  }, {
    key: "isString",
    value: function isString(arg) {
      return typeof arg === 'string';
    }
    /**
     * Determines if the given argument is a boolean.
     * 
     * @param arg is the argument to test as being a boolean
     * @returns true if the argument is a boolean, false otherwise
     */

  }, {
    key: "isBoolean",
    value: function isBoolean(arg) {
      return (0, _typeof2["default"])(arg) == (0, _typeof2["default"])(true);
    }
    /**
     * Determines if the given argument is a static.
     * 
     * @param arg is the argument to test as being a static
     * @returns true if the argument is a static, false otherwise
     */

  }, {
    key: "isFunction",
    value: function isFunction(arg) {
      return typeof arg === "static";
    }
    /**
     * Indicates if the given argument is an object and optionally if it has the given constructor name.
     * 
     * @param arg is the argument to test
     * @param obj is an object to test arg instanceof obj (optional)
     * @returns true if the given argument is an object and optionally has the given constructor name
     */

  }, {
    key: "isObject",
    value: function isObject(arg, obj) {
      if (!arg) return false;
      if ((0, _typeof2["default"])(arg) !== 'object') return false;
      if (obj && !(arg instanceof obj)) return false;
      return true;
    }
    /**
     * Determines if all alphabet characters in the given string are upper case.
     * 
     * @param str is the string to test
     * @returns true if the string is upper case, false otherwise
     */

  }, {
    key: "isUpperCase",
    value: function isUpperCase(str) {
      return str.toUpperCase() === str;
    }
    /**
     * Determines if all alphabet characters in the given string are lower case.
     * 
     * @param str is the string to test
     * @param true if the string is lower case, false otherwise
     */

  }, {
    key: "isLowerCase",
    value: function isLowerCase(str) {
      return str.toLowerCase() === str;
    }
    /**
     * Asserts that the given argument is hex.
     * 
     * @param arg is the argument to assert as hex
     * @param msg is the message to throw if the argument is not hex
     */

  }, {
    key: "assertHex",
    value: function assertHex(str, msg) {
      GenUtils.assertTrue(isHex(str), msg ? msg : "Argument asserted as hex but is not hex");
    }
    /**
     * Indicates if the given argument is a hexidemal string.
     * 
     * Credit: https://github.com/roryrjb/is-hex/blob/master/is-hex.js.
     * 
     * @param str is the string to test
     * @returns true if the given string is hexidecimal, false otherwise
     */

  }, {
    key: "isHex",
    value: function isHex(arg) {
      if (typeof arg !== 'string') return false;
      if (arg.length === 0) return false;
      return (arg.match(/([0-9]|[a-f])/gim) || []).length === arg.length;
    }
    /**
     * Determines if the given string is base32.
     */

  }, {
    key: "isBase32",
    value: function isBase32(str) {
      if (typeof str !== 'string') return false;
      GenUtils.assertTrue(str.length > 0, "Cannot determine if empty string is base32");
      return /^[ABCDEFGHIJKLMNOPQRSTUVWXYZ234567]+$/.test(str);
    }
    /**
     * Asserts that the given argument is base58.
     * 
     * @param arg is the argument to assert as base58
     * @param msg is the message to throw if the argument is not base58
     */

  }, {
    key: "assertBase58",
    value: function assertBase58(str, msg) {
      GenUtils.assertTrue(isBase58(str), msg ? msg : "Argument asserted as base58 but is not base58");
    }
    /**
     * Determines if the given string is base58.
     */

  }, {
    key: "isBase58",
    value: function isBase58(str) {
      if (typeof str !== 'string') return false;
      GenUtils.assertTrue(str.length > 0, "Cannot determine if empty string is base58");
      return /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/.test(str);
    }
    /**
     * Asserts that the given argument is base64.
     * 
     * @param arg is the argument to assert as base64
     * @param msg is the message to throw if the argument is not base64
     */

  }, {
    key: "assertBase64",
    value: function assertBase64(str, msg) {
      GenUtils.assertTrue(isBase64(str), msg ? msg : "Argument asserted as base64 but is not base64");
    }
    /**
     * Determines if the given string is base64.
     */

  }, {
    key: "isBase64",
    value: function isBase64(str) {
      if (typeof str !== 'string') return false;
      GenUtils.assertTrue(str.length > 0, "Cannot determine if empty string is base64");

      try {
        return btoa(atob(str)) == str;
      } catch (err) {
        return false;
      }
    }
    /**
     * Throws an exception with the given message.
     * 
     * @param msg defines the message to throw the exception with (optional)
     */

  }, {
    key: "fail",
    value: function fail(msg) {
      throw new Error(msg ? msg : "Failure (no message)");
    }
    /**
     * Asserts that the given boolean is true.  Throws an exception if not a boolean or false.
     * 
     * @param bool is the boolean to assert true
     * @param msg is the message to throw if bool is false (optional)
     */

  }, {
    key: "assertTrue",
    value: function assertTrue(bool, msg) {
      if (typeof bool !== 'boolean') throw new Error("Argument is not a boolean");
      if (!bool) throw new Error(msg ? msg : "Boolean asserted as true but was false");
    }
    /**
     * Asserts that the given boolean is false.  Throws an exception if not a boolean or true.
     * 
     * @param bool is the boolean to assert false
     * @param msg is the message to throw if bool is true (optional)
     */

  }, {
    key: "assertFalse",
    value: function assertFalse(bool, msg) {
      if (typeof bool !== 'boolean') throw new Error("Argument is not a boolean");
      if (bool) throw new Error(msg ? msg : "Boolean asserted as false but was true");
    }
    /**
     * Asserts that the given argument is null.  Throws an exception if not null.
     * 
     * @param arg is the argument to assert null
     * @param msg is the message to throw if arg is not null (optional)
     */

  }, {
    key: "assertNull",
    value: function assertNull(arg, msg) {
      if (arg !== null) throw new Error(msg ? msg : "Argument asserted as null but was not null: " + arg);
    }
    /**
     * Asserts that the given argument is not null.  Throws an exception if null.
     * 
     * @param arg is the argument to assert not null
     * @param msg is the message to throw if arg is null (optional)
     */

  }, {
    key: "assertNotNull",
    value: function assertNotNull(arg, msg) {
      if (arg === null) throw new Error(msg ? msg : "Argument asserted as not null but was null");
    }
    /**
     * Asserts that the given argument is defined.  Throws an exception if undefined.
     * 
     * @param arg is the argument to assert defined
     * @param msg is the message to throw if arg is undefined (optional)
     */

  }, {
    key: "assertDefined",
    value: function assertDefined(arg, msg) {
      if (GenUtils.isUndefined(arg)) throw new Error(msg ? msg : "Argument asserted as defined but was undefined");
    }
    /**
     * Asserts that the given argument is undefined.  Throws an exception if defined.
     * 
     * @param arg is the argument to assert undefined
     * @param msg is the message to throw if arg is defined (optional)
     */

  }, {
    key: "assertUndefined",
    value: function assertUndefined(arg, msg) {
      if (GenUtils.isDefined(arg)) throw new Error(msg ? msg : "Argument asserted as undefined but was defined: " + arg);
    }
    /**
     * Asserts that the given argument is initialized.  Throws an exception if not initialized.
     * 
     * @param arg is the argument to assert as initialized
     * @param msg is the message to throw if arg is not initialized (optional)
     */

  }, {
    key: "assertInitialized",
    value: function assertInitialized(arg, msg) {
      if (GenUtils.isUninitialized(arg)) {
        throw new Error(msg ? msg : "Argument asserted as initialized but was " + arg);
      }
    }
    /**
     * Asserts that the given argument is uninitialized.  Throws an exception if initialized.
     * 
     * @param arg is the argument to assert as uninitialized
     * @param msg is the message to throw if arg is initialized (optional)
     */

  }, {
    key: "assertUninitialized",
    value: function assertUninitialized(arg, msg) {
      if (GenUtils.isInitialized(arg)) throw new Error(msg ? msg : "Argument asserted as uninitialized but was initialized");
    }
    /**
     * Asserts that the given arguments are equal.  Throws an exception if not equal.
     * 
     * @param arg1 is an argument to assert as equal
     * @param arg2 is an argument to assert as equal
     * @param msg is the message to throw if the arguments are not equal
     */

  }, {
    key: "assertEquals",
    value: function assertEquals(arg1, arg2, msg) {
      GenUtils.assertTrue(equals(arg1, arg2), msg ? msg : "Arguments asserted as equal but are not equal: " + arg1 + " vs " + arg2);
    }
    /**
     * Asserts that the given arguments are not equal.  Throws an exception if equal.
     * 
     * @param arg1 is an argument to assert as not equal
     * @param arg2 is an argument to assert as not equal
     * @param msg is the message to throw if the arguments are equal
     */

  }, {
    key: "assertNotEquals",
    value: function assertNotEquals(arg1, arg2, msg) {
      if (arg1 === arg2) throw new Error(msg ? msg : "Arguments asserted as not equal but are equal: " + arg1 + " vs " + arg2);
    }
    /**
     * Asserts that the given argument is an integer.
     * 
     * @param arg is the argument to assert as an integer
     * @param msg is the message to throw if the argument is not an integer
     */

  }, {
    key: "assertInt",
    value: function assertInt(arg, msg) {
      if (!GenUtils.isInt(arg)) throw new Error(msg ? msg : "Argument asserted as an integer but is not an integer");
    }
    /**
     * Asserts that the given argument is a number.
     * 
     * @param arg is the argument to assert as a number
     * @param msg is the message to throw if the argument is not a number
     */

  }, {
    key: "assertNumber",
    value: function assertNumber(arg, msg) {
      if (!GenUtils.isNumber(arg)) throw new Error(msg ? msg : "Argument asserted as a number but is not a number");
    }
    /**
     * Asserts that the given argument is a boolean.
     * 
     * @param arg is the argument to assert as a boolean
     * @param msg is the message to throw if the argument is not a boolean
     */

  }, {
    key: "assertBoolean",
    value: function assertBoolean(arg, msg) {
      if (!GenUtils.isBoolean(arg)) throw new Error(msg ? msg : "Argument asserted as a boolean but is not a boolean");
    }
    /**
     * Asserts that the given argument is a string.
     * 
     * @param arg is the argument to assert as a string
     * @param msg is the message to throw if the argument is not a string
     */

  }, {
    key: "assertString",
    value: function assertString(arg, msg) {
      if (!GenUtils.isString(arg)) throw new Error(msg ? msg : "Argument asserted as a string but is not a string: " + arg);
    }
    /**
     * Asserts that the given argument is an array.
     * 
     * @param arg is the argument to assert as an array
     * @param msg is the message to throw if the argument is not an array
     */

  }, {
    key: "assertArray",
    value: function assertArray(arg, msg) {
      if (!GenUtils.isArray(arg)) throw new Error(msg ? msg : "Argument asserted as an array but is not an array");
    }
    /**
     * Asserts that the given argument is a static.
     * 
     * @param arg is the argument to assert as a static
     * @param msg is the message to throw if the argument is not a static
     */

  }, {
    key: "assertFunction",
    value: function assertFunction(arg, msg) {
      if (!GenUtils.isFunction(arg)) throw new Error(msg ? msg : "Argument asserted as a static but is not a static");
    }
    /**
     * Asserts that the given argument is an object with the given name.
     * 
     * @param arg is the argument to test
     * @param obj is an object to assert arg instanceof obj (optional)
     * @param msg is the message to throw if the argument is not the specified object
     */

  }, {
    key: "assertObject",
    value: function assertObject(arg, obj, msg) {
      GenUtils.assertInitialized(arg, msg);

      if (obj) {
        if (!isObject(arg, obj)) throw new Error(msg ? msg : "Argument asserted as object '" + obj.name + "' but was not");
      } else {
        if (!isObject(arg)) throw new Error(msg ? msg : "Argument asserted as object but was not");
      }
    }
    /**
     * Sets the child's prototype to the parent's prototype.
     * 
     * @param child is the child class
     * @param parent is the parent class
     */

  }, {
    key: "inheritsFrom",
    value: function inheritsFrom(child, parent) {
      child.prototype = Object.create(parent.prototype);
      child.prototype.constructor = child;
    }
    /**
     * Invokes functions with arguments.
     * 
     * arguments[0] is assumed to be an array of functions to invoke
     * arguments[1...n] are args to invoke the functions with
     */

  }, {
    key: "invoke",
    value: function invoke() {
      var fns = arguments[0];
      var args = [];

      for (var _i = 1; _i < arguments.length; _i++) {
        args.push(arguments[_i]);
      }

      for (var _i2 = 0; _i2 < fns.length; _i2++) {
        assertFunction(fns[_i2], "Functions[" + _i2 + "] is not a static");

        fns[_i2].apply(null, args);
      }
    }
    /**
     * Returns the power set of the given array.
     * 
     * @param arr is the array to get the power set of
     * @returns [][] is the power set of the given array
     */

  }, {
    key: "getPowerSet",
    value: function getPowerSet(arr) {
      var fn = function fn(n, src, got, all) {
        if (n == 0) {
          if (got.length > 0) {
            all[all.length] = got;
          }

          return;
        }

        for (var j = 0; j < src.length; j++) {
          fn(n - 1, src.slice(j + 1), got.concat([src[j]]), all);
        }

        return;
      };

      var all = [];
      all.push([]);

      for (var _i3 = 0; _i3 < arr.length; _i3++) {
        fn(_i3, arr, [], all);
      }

      all.push(arr);
      return all;
    }
    /**
     * Returns the power set of the given array whose elements are the given size.
     * 
     * @param arr is the array to get the power set of
     * @param size is the required size of the elements within the power set
     * returns [][] is the power set of the given array whose elements are the given size 
     */

  }, {
    key: "getPowerSetOfLength",
    value: function getPowerSetOfLength(arr, size) {
      assertInitialized(arr);
      assertInitialized(size);
      GenUtils.assertTrue(size >= 1);
      var powerSet = getPowerSet(arr);
      var powerSetOfLength = [];

      for (var _i4 = 0; _i4 < powerSet.length; _i4++) {
        if (powerSet[_i4].length === size) {
          powerSetOfLength.push(powerSet[_i4]);
        }
      }

      return powerSetOfLength;
    }
    /**
     * Returns an array of indices of the given size.
     * 
     * @param size specifies the size to get indices for
     * @returns array of the given size with indices starting at 0
     */

  }, {
    key: "getIndices",
    value: function getIndices(size) {
      var indices = [];

      for (var _i5 = 0; _i5 < size; _i5++) {
        indices.push(_i5);
      }

      return indices;
    }
    /**
     * Returns a new array containing unique elements of the given array.
     * 
     * @param arr is the array to return unique elements from
     * @returns a new array with the given array's unique elements
     */

  }, {
    key: "toUniqueArray",
    value: function toUniqueArray(arr) {
      return arr.filter(function (value, index, self) {
        return self.indexOf(value) === index;
      });
    }
    /**
     * Copies the given array.
     * 
     * @param arr is the array to copy
     * @returns a copy of the given array
     */

  }, {
    key: "copyArray",
    value: function copyArray(arr) {
      GenUtils.assertArray(arr);
      var copy = [];

      for (var _i6 = 0; _i6 < arr.length; _i6++) {
        copy.push(arr[_i6]);
      }

      return copy;
    }
    /**
     * Removes every instance of the given value from the given array.
     * 
     * @param arr is the array to remove the value from
     * @param val is the value to remove from the array
     * @returns true if the value is found and removed, false otherwise
     */

  }, {
    key: "remove",
    value: function remove(arr, val) {
      var found = false;

      for (var _i7 = arr.length - 1; _i7 >= 0; _i7--) {
        if (arr[_i7] === val) {
          arr.splice(_i7, 1);
          found = true;
          _i7--;
        }
      }

      return found;
    }
    /**
     * Returns a copy of the given array where each element is lowercase.
     * 
     * @param arr is the array to convert to lowercase
     * @returns a copy of the given array where each element is lowercase
     */

  }, {
    key: "toLowerCaseArray",
    value: function toLowerCaseArray(arr) {
      var arr2 = [];

      for (var _i8 = 0; _i8 < arr.length; _i8++) {
        arr2.push(arr[_i8].toLowerCase());
      }

      return arr2;
    }
    /**
     * Listifies the given argument.
     * 
     * @param arrOrElem is an array or an element in the array
     * @returns an array which is the given arg if it's an array or an array with the given arg as an element
     */

  }, {
    key: "listify",
    value: function listify(arrOrElem) {
      return GenUtils.isArray(arrOrElem) ? arrOrElem : [arrOrElem];
    }
    /**
     * Indicates if the given array contains the given object.
     * 
     * @param {object[]} arr - array that may or may not contain the object
     * @param {object} obj - object to check for inclusion in the array
     * @param {boolean} compareByReference - compare strictly by reference, forgoing deep equality check
     * @returns true if the array contains the object, false otherwise
     */

  }, {
    key: "arrayContains",
    value: function arrayContains(arr, obj, compareByReference) {
      GenUtils.assertTrue(GenUtils.isArray(arr));

      for (var _i9 = 0; _i9 < arr.length; _i9++) {
        if (arr[_i9] === obj) return true;
        if (!compareByReference && GenUtils.equals(arr[_i9], obj)) return true;
      }

      return false;
    }
    /**
     * Indicates if the given string contains the given substring.
     * 
     * @param str is the string to search for a substring
     * @param substring is the substring to searchin within the string
     * @returns true if the substring is within the string, false otherwise
     */

  }, {
    key: "strContains",
    value: function strContains(str, substring) {
      return str.indexOf(substring) > -1;
    }
    /**
     * Determines if two arrays are equal.
     * 
     * @param arr1 is an array to compare
     * @param arr2 is an array to compare
     * @returns true if the arrays are equal, false otherwise
     */

  }, {
    key: "arraysEqual",
    value: function arraysEqual(arr1, arr2) {
      if (arr1 === arr2) return true;
      if (arr1 == null && arr2 == null) return true;
      if (arr1 == null || arr2 == null) return false;
      if (typeof arr1 === 'undefined' && typeof arr2 === 'undefined') return true;
      if (typeof arr1 === 'undefined' || typeof arr2 === 'undefined') return false;
      if (!GenUtils.isArray(arr1)) throw new Error("First argument is not an array");
      if (!GenUtils.isArray(arr2)) throw new Error("Second argument is not an array");
      if (arr1.length != arr2.length) return false;

      for (var _i10 = 0; _i10 < arr1.length; ++_i10) {
        if (!GenUtils.equals(arr1[_i10], arr2[_i10])) return false;
      }

      return true;
    }
    /**
     * Determines if two arguments are deep equal.
     * 
     * @param arg1 is an argument to compare
     * @param arg2 is an argument to compare
     * @returns true if the arguments are deep equals, false otherwise
     */

  }, {
    key: "equals",
    value: function equals(arg1, arg2) {
      if (GenUtils.isArray(arg1) && GenUtils.isArray(arg2)) return GenUtils.arraysEqual(arg1, arg2);
      if (GenUtils.isObject(arg1) && GenUtils.isObject(arg2)) return GenUtils.objectsEqual(arg1, arg2);
      return arg1 === arg2;
    }
    /**
     * Determines if two objects are deep equal.
     * 
     * Undefined values are considered equal to non-existent keys.
     * 
     * @param map1 is a map to compare
     * @param map2 is a map to compare
     * @returns true if the maps have identical keys and values, false otherwise
     */

  }, {
    key: "objectsEqual",
    value: function objectsEqual(map1, map2) {
      var keys1 = Object.keys(map1);
      var keys2 = Object.keys(map2); // compare each key1 to keys2

      for (var _i11 = 0, _keys = keys1; _i11 < _keys.length; _i11++) {
        var key1 = _keys[_i11];
        var found = false;

        var _iterator = _createForOfIteratorHelper(keys2),
            _step;

        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var key2 = _step.value;

            if (key1 === key2) {
              if (!GenUtils.equals(map1[key1], map2[key2])) return false;
              found = true;
              break;
            }
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }

        if (!found && map1[key1] !== undefined) return false; // allows undefined values to equal non-existent keys
      } // compare each key2 to keys1


      for (var _i12 = 0, _keys2 = keys2; _i12 < _keys2.length; _i12++) {
        var _key = _keys2[_i12];
        var _found = false;

        var _iterator2 = _createForOfIteratorHelper(keys1),
            _step2;

        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var _key2 = _step2.value;

            if (_key2 === _key) {
              _found = true; // no need to re-compare which was done earlier

              break;
            }
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }

        if (!_found && map2[_key] !== undefined) return false; // allows undefined values to equal non-existent keys
      }

      return true; // TODO: support strict option?
      //    if (strict) {
      //      let keys1 = Object.keys(map1);
      //      if (keys1.length !== Object.keys(map2).length) return false;
      //      for (let i = 0; i < keys1.length; i++) {
      //        let key = Object.keys(map1)[i];
      //        if (!GenUtils.equals(map1[key], map2[key])) return false;
      //      }
      //    }
    }
    /**
     * Deletes properties from the object that are undefined.
     * 
     * @param obj is the object to delete undefined keys from
     */

  }, {
    key: "deleteUndefinedKeys",
    value: function deleteUndefinedKeys(obj) {
      for (var _i13 = 0, _Object$keys = Object.keys(obj); _i13 < _Object$keys.length; _i13++) {
        var key = _Object$keys[_i13];
        if (obj[key] === undefined) delete obj[key];
      }
    }
    /**
     * Returns combinations of the given array of the given size.
     * 
     * @param arr is the array to get combinations from
     * @param combinationSize specifies the size of each combination
     */

  }, {
    key: "getCombinations",
    value: function getCombinations(arr, combinationSize) {
      // validate input
      assertInitialized(arr);
      assertInitialized(combinationSize);
      GenUtils.assertTrue(combinationSize >= 1); // get combinations of array indices of the given size

      var indexCombinations = getPowerSetOfLength(getIndices(arr.length), combinationSize); // collect combinations from each combination of array indices

      var combinations = [];

      for (var indexCombinationsIdx = 0; indexCombinationsIdx < indexCombinations.length; indexCombinationsIdx++) {
        // get combination of array indices
        var indexCombination = indexCombinations[indexCombinationsIdx]; // build combination from array

        var combination = [];

        for (var indexCombinationIdx = 0; indexCombinationIdx < indexCombination.length; indexCombinationIdx++) {
          combination.push(arr[indexCombination[indexCombinationIdx]]);
        } // add to combinations


        combinations.push(combination);
      }

      return combinations;
    }
    /**
     * Gets an 'a' element that is downloadable when clicked.
     * 
     * @param name is the name of the file to download
     * @param contents are the string contents of the file to download
     * @returns 'a' dom element with downloadable file
     */

  }, {
    key: "getDownloadableA",
    value: function getDownloadableA(name, contents) {
      var a = window.document.createElement('a');
      a.href = window.URL.createObjectURL(new Blob([contents], {
        type: 'text/plain'
      }));
      a.download = name;
      a.target = "_blank";
      a.innerHTML = name;
      return a;
    }
    /**
     * Returns the given node's outer HTML.
     * 
     * @param node is the node to get outer HTML for
     * @returns the outer HTML of the given node
     */

  }, {
    key: "getOuterHtml",
    value: function getOuterHtml(node) {
      return $('<div>').append($(node).clone()).html();
    }
    /**
     * Copies properties in the given object to a new object.
     * 
     * @param obj is object to copy properties for
     * @returns a new object with properties copied from the given object
     */

  }, {
    key: "copyProperties",
    value: function copyProperties(obj) {
      return JSON.parse(JSON.stringify(obj));
    }
    /**
     * Deletes all properties in the given object.
     * 
     * @param obj is the object to delete properties from
     */

  }, {
    key: "deleteProperties",
    value: function deleteProperties(obj) {
      var props = [];

      for (var prop in obj) {
        props.push(prop);
      } // TODO: if (obj.hasOwnProperty(prop)) { ...


      for (i = 0; i < props.length; i++) {
        delete obj[props[i].toString()];
      }
    }
    /**
     * Converts a CSV string to a 2-dimensional array of strings.
     * 
     * @param csv is the CSV string to convert
     * @returns a 2-dimensional array of strings
     */

  }, {
    key: "csvToArr",
    value: function csvToArr(csv) {
      return $.csv.toArrays(csv);
    }
    /**
     * Converts the given array to a CSV string.
     * 
     * @param arr is a 2-dimensional array of strings
     * @returns the CSV string
     */

  }, {
    key: "arrToCsv",
    value: function arrToCsv(arr) {
      return $.csv.fromObjects(arr, {
        headers: false
      });
    }
    /**
     * Indicates if the given string contains whitespace.
     * 
     * @param str is the string to test
     * @returns true if the string contains whitespace, false otherwise
     */

  }, {
    key: "hasWhitespace",
    value: function hasWhitespace(str) {
      return /\s/g.test(str);
    }
    /**
     * Indicates if the given character is whitespace.
     * 
     * @param char is the character to test
     * @returns true if the given character is whitespace, false otherwise
     */

  }, {
    key: "isWhitespace",
    value: function isWhitespace(_char) {
      return /\s/.test(_char);
    }
    /**
     * Indicates if the given character is a newline.
     * 
     * @param char is the character to test
     * @returns true if the given character is a newline, false otherwise
     */

  }, {
    key: "isNewline",
    value: function isNewline(_char2) {
      return _char2 === '\n' || _char2 === '\r';
    }
    /**
     * Counts the number of non-whitespace characters in the given string.
     * 
     * @param str is the string to count the number of non-whitespace characters in
     * @returns int is the number of non-whitespace characters in the given string
     */

  }, {
    key: "countNonWhitespaceCharacters",
    value: function countNonWhitespaceCharacters(str) {
      var count = 0;

      for (var _i14 = 0; _i14 < str.length; _i14++) {
        if (!isWhitespace(str.charAt(_i14))) count++;
      }

      return count;
    }
    /**
     * Returns tokens separated by whitespace from the given string.
     * 
     * @param str is the string to get tokens from
     * @returns string[] are the tokens separated by whitespace within the string
     */

  }, {
    key: "getWhitespaceTokens",
    value: function getWhitespaceTokens(str) {
      return str.match(/\S+/g);
    }
    /**
     * Returns lines separated by newlines from the given string.
     * 
     * @param str is the string to get lines from
     * @param string[] are the lines separated by newlines within the string
     */

  }, {
    key: "getLines",
    value: function getLines(str) {
      return str.match(/[^\r\n]+/g);
    }
    /**
     * Returns the document's first stylesheet which has no href.
     * 
     * @returns StyleSheet is the internal stylesheet
     */

  }, {
    key: "getInternalStyleSheet",
    value: function getInternalStyleSheet() {
      for (var _i15 = 0; _i15 < document.styleSheets.length; _i15++) {
        var styleSheet = document.styleSheets[_i15];
        if (!styleSheet.href) return styleSheet;
      }

      return null;
    }
    /**
     * Returns the document's internal stylesheet as text.
     * 
     * @returns str is the document's internal stylesheet
     */

  }, {
    key: "getInternalStyleSheetText",
    value: function getInternalStyleSheetText() {
      var internalCss = "";
      var internalStyleSheet = getInternalStyleSheet();
      if (!internalStyleSheet) return null;

      for (var _i16 = 0; _i16 < internalStyleSheet.cssRules.length; _i16++) {
        internalCss += internalStyleSheet.cssRules[_i16].cssText + "\n";
      }

      return internalCss;
    }
    /**
     * Manually builds an HTML document string.
     * 
     * @param content specifies optional document content
     *        content.div is a pre-existing div to stringify and add to the body
     *        content.title is the title of the new tab
     *        content.dependencyPaths specifies paths to js, css, or img paths
     *        content.internalCss is css to embed in the html document
     *        content.metas are meta elements with keys/values to include
     * @returns str is the document string
     */

  }, {
    key: "buildHtmlDocument",
    value: function buildHtmlDocument(content) {
      var str = "<!DOCTYPE HTML>";
      str += "<html><head>"; // add metas

      if (content.metas) {
        var metas = listify(content.metas);

        for (var _i17 = 0; _i17 < metas.length; _i17++) {
          var meta = metas[_i17];
          var elem = document.createElement("meta");

          for (var prop in meta) {
            if (meta.hasOwnProperty(prop)) {
              elem.setAttribute(prop.toString(), meta[prop.toString()]);
            }
          }

          str += elem.outerHTML;
        }
      } // add title and internal css


      str += content.title ? "<title>" + content.title + "</title>" : "";
      str += content.internalCss ? "<style>" + content.internalCss + "</style>" : ""; // add dependency paths

      if (content.dependencyPaths) {
        var dependencyPaths = listify(content.dependencyPaths);

        for (var _i18 = 0; _i18 < dependencyPaths.length; _i18++) {
          var dependencyPath = dependencyPaths[_i18];
          if (dependencyPath.endsWith(".js")) str += "<script src='" + dependencyPath + "'></script>";else if (dependencyPath.endsWith(".css")) str += "<link rel='stylesheet' type='text/css' href='" + dependencyPath + "'/>";else if (dependencyPath.endsWith(".png") || dependencyPath.endsWith(".img")) str += "<img src='" + dependencyPath + "'>";else throw new Error("Unrecognized dependency path extension: " + dependencyPath);
        }
      }

      str += "</head><body>";
      if (content.div) str += $("<div>").append(content.div.clone()).html(); // add cloned div as string

      str += "</body></html>";
      return str;
    }
    /**
     * Opens the given div in a new window.
     * 
     * @param content specifies optional window content
     *        content.div is a pre-existing div to stringify and add to the body
     *        content.title is the title of the new tab
     *        content.dependencyPaths specifies paths to js, css, or img paths
     *        content.internalCss is css to embed in the html document
     *        content.metas are meta elements with keys/values to include
     * @param onLoad(err, window) is invoked with a reference to the window when available
     */

  }, {
    key: "newWindow",
    value: function newWindow(content, onLoad) {
      var onLoadCalled = false;
      var w = window.open();

      if (!isInitialized(w) || !isInitialized(w.document)) {
        onLoadOnce(new Error("Could not get window reference"));
        return;
      }

      w.opener = null;
      w.document.write(buildHtmlDocument(content));
      w.addEventListener('load', function () {
        onLoadOnce(null, w);
      });
      w.document.close(); // prevents onLoad() from being called multiple times

      function onLoadOnce(err, window) {
        if (onLoadCalled) return;
        onLoadCalled = true;
        if (onLoad) onLoad(err, window);
      }
    }
    /**
     * Converts the given image to a base64 encoded data url.
     * 
     * @param img is the image to convert
     * @param quality is a number between 0 and 1 specifying the image quality
     */

  }, {
    key: "imgToDataUrl",
    value: function imgToDataUrl(img, quality) {
      var canvas = document.createElement('canvas');
      canvas.height = img.naturalHeight;
      canvas.width = img.naturalWidth;
      var context = canvas.getContext('2d');
      context.drawImage(img, 0, 0);
      return canvas.toDataURL(quality);
    }
    /**
     * Determines if the image at the given URL is accessible.
     * 
     * @param url is the url to an image
     * @param timeout is the maximum time to wait
     * @param onDone(bool) when the image is determined to be accessible or not
     */

  }, {
    key: "isImageAccessible",
    value: function isImageAccessible(url, timeout, onDone) {
      // track return so it only executes once
      var returned = false; // attempt to load favicon

      var img = new Image();
      img.onload = onResponse;
      img.onerror = onResponse;
      img.src = url + "?" + +new Date(); // trigger image load with cache buster
      // nest failure timeouts to give response a chance when browser is under load

      setTimeout(function () {
        setImmediate(function () {
          setImmediate(function () {
            setImmediate(function () {
              if (!returned) {
                returned = true;
                onDone(false);
              }
            });
          });
        });
      }, timeout);

      function onResponse(e) {
        if (returned) return;
        returned = true;
        if (typeof e === 'undefined' || e.type === "error") onDone(false);else onDone(true);
      }
    }
    /**
     * Determines if the given file is a zip file.
     * 
     * @param file is a file
     * @returns true if the given file is a zip file, false otherwise
     */

  }, {
    key: "isZipFile",
    value: function isZipFile(file) {
      return file.name.endsWith(".zip") || file.type === 'application/zip';
    }
    /**
     * Determines if the given file is a json file.
     * 
     * @param file is a file
     * @returns true if the given file is a json file, false otherwise
     */

  }, {
    key: "isJsonFile",
    value: function isJsonFile(file) {
      return file.name.endsWith(".json") || file.type === 'application/json';
    }
    /**
     * Determines if the given file is a csv file.
     * 
     * @param file is a file
     * @returns true if the given file is a csv file, false otherwise
     */

  }, {
    key: "isCsvFile",
    value: function isCsvFile(file) {
      return file.name.endsWith(".csv") || file.type === 'text/csv';
    }
    /**
     * Determines if the given file is a txt file.
     * 
     * @param file is a file
     * @returns true if the given file is a txt file, false otherwise
     */

  }, {
    key: "isTxtFile",
    value: function isTxtFile(file) {
      return file.name.endsWith(".txt") || file.type === 'text/plain';
    }
    /**
     * Fetches the given list of images.
     * 
     * Prerequisite: async.js.
     * 
     * @param paths are the paths to the images to fetch
     * @param onDone(err, images) is called when done
     */

  }, {
    key: "getImages",
    value: function getImages(paths, onDone) {
      // listify paths
      if (!GenUtils.isArray(paths)) {
        GenUtils.assertTrue(isString(paths));
        paths = [paths];
      } // collect functions to fetch images


      var funcs = [];

      for (var _i19 = 0; _i19 < paths.length; _i19++) {
        funcs.push(loadFunc(paths[_i19]));
      } // fetch in parallel


      async.parallel(funcs, onDone); // callback static to fetch a single image

      function loadFunc(path) {
        return function (onDone) {
          var img = new Image();

          img.onload = function () {
            onDone(null, img);
          };

          img.onerror = function () {
            onDone(new Error("Cannot load image: " + path));
          };

          img.src = path;
        };
      }
    }
    /**
     * Returns a string indentation of the given length;
     * 
     * @param length is the length of the indentation
     * @returns {string} is an indentation string of the given length
     */

  }, {
    key: "getIndent",
    value: function getIndent(length) {
      var str = "";

      for (var _i20 = 0; _i20 < length; _i20++) {
        str += '  ';
      } // two spaces


      return str;
    }
  }, {
    key: "initPolyfills",
    value: function initPolyfills() {
      // Polyfill Object.assign()
      // Credit: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
      if (typeof Object.assign != 'static') {
        // Must be writable: true, enumerable: false, configurable: true
        Object.defineProperty(Object, "assign", {
          value: function assign(target, varArgs) {
            // .length of static is 2
            'use strict';

            if (target == null) {
              // TypeError if undefined or null
              throw new TypeError('Cannot convert undefined or null to object');
            }

            var to = Object(target);

            for (var index = 1; index < arguments.length; index++) {
              var nextSource = arguments[index];

              if (nextSource != null) {
                // Skip over if undefined or null
                for (var nextKey in nextSource) {
                  // Avoid bugs when hasOwnProperty is shadowed
                  if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                    to[nextKey] = nextSource[nextKey];
                  }
                }
              }
            }

            return to;
          },
          writable: true,
          configurable: true
        });
      }
      /**
       * Polyfill str.replaceAt(idx, replacement).
       */


      String.prototype.replaceAt = function (idx, replacement) {
        return this.substr(0, idx) + replacement + this.substr(idx + replacement.length);
      };
      /**
       * Polyfill str.startsWith(searchString, position).
       * 
       * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith#Polyfill
       */


      String.prototype.startsWith = function (searchString, position) {
        return this.substr(position || 0, searchString.length) === searchString;
      };
      /**
       * Polyfill str.endsWith(searchString, position).
       * 
       * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith#Polyfill
       */


      String.prototype.endsWith = function (searchString, position) {
        if (!(position < this.length)) position = this.length; // works better than >= because it compensates for NaN
        else position |= 0; // round position

        return this.substr(position - searchString.length, searchString.length) === searchString;
      };
      /**
       * Removes the given value from the array.
       * 
       * @returns true if the value was found and removed, false otherwise
       */


      Array.prototype.removeVal = function (val) {
        var found = false;

        for (var i = 0; i < this.length; i++) {
          if (this[i] == val) {
            found = true;
            this.splice(i, 1);
            i--;
          }
        }

        return found;
        ;
      };
    }
    /**
     * Generates a v4 UUID.
     * 
     * Source: https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
     */

  }, {
    key: "getUUID",
    value: function getUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : r & 0x3 | 0x8;
        return v.toString(16);
      });
    }
    /**
     * Indicates if the current environment is a browser.
     * 
     * @return {boolean} true if the environment is a browser, false otherwise
     */

  }, {
    key: "isBrowser",
    value: function isBrowser() {
      var isWorker = typeof importScripts === 'function';
      var isBrowserMain = new Function("try {return this===window;}catch(e){return false;}")();
      var isJsDom = isBrowserMain ? new Function("try {return window.navigator.userAgent.includes('jsdom');}catch(e){return false;}")() : false;
      return isWorker || isBrowserMain && !isJsDom;
    }
    /**
     * Indicates if the current environment is a firefox-based browser.
     * 
     * @return {boolean} true if the environment is a firefox-based browser, false otherwise
     */

  }, {
    key: "isFirefox",
    value: function isFirefox() {
      return this.isBrowser() && navigator.userAgent.indexOf("Firefox") > 0;
    }
    /**
     * Gets the IE version number.
     * 
     * Credit: https://stackoverflow.com/questions/19999388/check-if-user-is-using-ie-with-jquery/21712356#21712356
     * 
     * @returns the IE version number or null if not IE
     */

  }, {
    key: "getIEVersion",
    value: function getIEVersion() {
      var ua = window.navigator.userAgent;
      var msie = ua.indexOf('MSIE ');

      if (msie > 0) {
        // IE 10 or older => return version number
        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
      }

      var trident = ua.indexOf('Trident/');

      if (trident > 0) {
        // IE 11 => return version number
        var rv = ua.indexOf('rv:');
        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
      }

      var edge = ua.indexOf('Edge/');

      if (edge > 0) {
        // Edge (IE 12+) => return version number
        return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
      } // other browser


      return null;
    }
    /**
     * Gets a parameter value.
     * 
     * Credit: https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
     * 
     * @param name is the name of the parameter to get the value of
     * @param url is a URL to get the parameter from, uses the window's current href if not given
     * @returns the parameter's value
     */

  }, {
    key: "getParameterByName",
    value: function getParameterByName(name, url) {
      if (!url) url = window.location.href;
      name = name.replace(/[\[\]]/g, "\\$&");
      var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
          results = regex.exec(url);
      if (!results) return null;
      if (!results[2]) return '';
      return decodeURIComponent(results[2].replace(/\+/g, " "));
    }
    /**
     * Gets a non-cryptographically secure random number within a given range.
     * 
     * @param min is the minimum range of the int to generate, inclusive
     * @param max is the maximum range of the int to generate, inclusive
     * 
     * Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
     */

  }, {
    key: "getRandomInt",
    value: function getRandomInt(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    /**
     * Gets random ints.
     * 
     * @param min is the minimum range of the ints to generate, inclusive
     * @param max is the maximum range of the ints to generate, inclusive
     * @param count is the number of random ints to get
     */

  }, {
    key: "getRandomInts",
    value: function getRandomInts(min, max, count) {
      GenUtils.assertTrue(typeof count === "number");
      var ints = [];

      for (var _i21 = 0; _i21 < count; _i21++) {
        ints.push(GenUtils.getRandomInt(min, max));
      }

      return ints;
    }
    /**
     * Gets a given number of unique random ints within a range.
     * 
     * @param min is the minimum range of the ints to generate, inclusive
     * @param max is the maximum range of the ints to generate, inclusive
     * @param count is the number of unique random ints to get
     */

  }, {
    key: "getUniqueRandomInts",
    value: function getUniqueRandomInts(min, max, count) {
      var ints = [];
      GenUtils.assertTrue(count >= 0);
      GenUtils.assertTrue(max - min + 1 >= count);

      while (ints.length < count) {
        var randomInt = GenUtils.getRandomInt(min, max);
        if (!ints.includes(randomInt)) ints.push(randomInt);
      }

      return ints;
    }
    /**
     * Randomize array element order in-place using Durstenfeld shuffle algorithm.
     * 
     * Credit: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
     */

  }, {
    key: "shuffle",
    value: function shuffle(array) {
      for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
      }
    }
    /**
     * Sorts an array by natural ordering.
     * 
     * @param the array to sort
     */

  }, {
    key: "sort",
    value: function sort(array) {
      array.sort(function (a, b) {
        return a === b ? 0 : a > b ? 1 : -1;
      });
    }
    /**
     * Sets the given value ensuring a previous value is not overwritten.
     * 
     * TODO: remove for portability because function passing not supported in other languages, use reconcile only
     * 
     * @param obj is the object to invoke the getter and setter on
     * @param getFn gets the current value
     * @param setFn sets the current value
     * @param val is the value to set iff it does not overwrite a previous value
     * @param config specifies reconciliation configuration
     *        config.resolveDefined uses defined value if true or undefined, undefined if false
     *        config.resolveTrue uses true over false if true, false over true if false, must be equal if undefined
     *        config.resolveMax uses max over min if true, min over max if false, must be equal if undefined
     * @param errMsg is the error message to throw if the values cannot be reconciled (optional)
     */

  }, {
    key: "safeSet",
    value: function safeSet(obj, getFn, setFn, val, config, errMsg) {
      var curVal = getFn.call(obj);
      var reconciledVal = GenUtils.reconcile(curVal, val, config, errMsg);
      if (curVal !== reconciledVal) setFn.call(obj, reconciledVal);
    }
    /**
     * Reconciles two values.
     * 
     * TODO: remove custom error message
     * 
     * @param val1 is a value to reconcile
     * @param val2 is a value to reconcile
     * @param config specifies reconciliation configuration
     *        config.resolveDefined uses defined value if true or undefined, undefined if false
     *        config.resolveTrue uses true over false if true, false over true if false, must be equal if undefined
     *        config.resolveMax uses max over min if true, min over max if false, must be equal if undefined
     * @param errMsg is the error message to throw if the values cannot be reconciled (optional)
     * @returns the reconciled value if reconcilable, throws error otherwise
     */

  }, {
    key: "reconcile",
    value: function reconcile(val1, val2, config, errMsg) {
      // check for equality
      if (val1 === val2) return val1; // check for BigInt equality

      var comparison; // save comparison for later if applicable

      if (val1 instanceof BigInt && val2 instanceof BigInt) {
        comparison = compareBigInt(val1, val2);
        if (comparison === 0) return val1;
      } // resolve one value defined


      if (val1 === undefined || val2 === undefined) {
        if (config && config.resolveDefined === false) return undefined; // use undefined
        else return val1 === undefined ? val2 : val1; // use defined value
      } // resolve different booleans


      if (config && config.resolveTrue !== undefined && typeof val1 === "boolean" && typeof val2 === "boolean") {
        _assert["default"].equal((0, _typeof2["default"])(config.resolveTrue), "boolean");

        return config.resolveTrue;
      } // resolve different numbers


      if (config && config.resolveMax !== undefined) {
        _assert["default"].equal((0, _typeof2["default"])(config.resolveMax), "boolean"); // resolve js numbers


        if (typeof val1 === "number" && typeof val2 === "number") {
          return config.resolveMax ? Math.max(val1, val2) : Math.min(val1, val2);
        } // resolve BigInts


        if (val1 instanceof BigInt && val2 instanceof BigInt) {
          return config.resolveMax ? comparison < 0 ? val2 : val1 : comparison < 0 ? val1 : val2;
        }
      } // assert deep equality


      _assert["default"].deepEqual(val1, val2, errMsg ? errMsg : "Cannot reconcile values " + val1 + " and " + val2 + " with config: " + JSON.stringify(config));

      return val1;
    }
    /**
     * Returns a human-friendly key value line.
     * 
     * @param key is the key
     * @param value is the value
     * @param indent indents the line
     * @param newline specifies if the string should be terminated with a newline or not
     * @param ignoreUndefined specifies if undefined values should return an empty string
     * @returns {string} is the human-friendly key value line
     */

  }, {
    key: "kvLine",
    value: function kvLine(key, value) {
      var indent = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      var newline = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
      var ignoreUndefined = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;
      if (value === undefined && ignoreUndefined) return "";
      return GenUtils.getIndent(indent) + key + ": " + value + (newline ? '\n' : "");
    }
    /**
     * Replace big integers (16 or more consecutive digits) with strings in order
     * to preserve numeric precision.
     * 
     * @param {string} str is the string to be modified
     * @return {string} the modified string with big numbers converted to strings
     */

  }, {
    key: "stringifyBIs",
    value: function stringifyBIs(str) {
      return str.replace(/("[^"]*"\s*:\s*)(\d{16,})/g, '$1"$2"');
    }
    /**
     * Print the current stack trace. 
     * 
     * @param {string} msg - optional message to print with the trace
     */

  }, {
    key: "printStackTrace",
    value: function printStackTrace(msg) {
      try {
        throw new Error(msg);
      } catch (err) {
        console.error(err.stack);
      }
    }
    /**
     * Wait for the duration.
     * 
     * @param {number} duration - the duration to wait for in ms
     */

  }, {
    key: "waitFor",
    value: function () {
      var _waitFor = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(duration) {
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                return _context.abrupt("return", new Promise(function (resolve) {
                  setTimeout(resolve, duration);
                }));

              case 1:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      function waitFor(_x) {
        return _waitFor.apply(this, arguments);
      }

      return waitFor;
    }()
    /**
     * Kill the given nodejs child process.
     * 
     * @param {process} process - the nodejs child process to kill
     * @param {string} [signal] - the kill signal, e.g. SIGTERM, SIGKILL, SIGINT (default)
     */

  }, {
    key: "killProcess",
    value: function () {
      var _killProcess = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(process, signal) {
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                return _context2.abrupt("return", new Promise(function (resolve, reject) {
                  process.on("exit", function () {
                    resolve();
                  });
                  process.on("error", function (err) {
                    reject(err);
                  });
                  process.kill(signal ? signal : "SIGINT");
                }));

              case 1:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }));

      function killProcess(_x2, _x3) {
        return _killProcess.apply(this, arguments);
      }

      return killProcess;
    }()
    /**
     * Compare two BigInt values (replaces BigInteger.compare()).
     *
     * @param{BigInt} bigint1 - the first BigInt Value in the comparison
     * @parma{BigInt} bigint2 - the second BigInt value in the comparison
     */

  }]);
  return GenUtils;
}();

(0, _defineProperty2["default"])(GenUtils, "compareBigInt", function (bigint1, bigint2) {
  if (bigint1 === bigint2) return 0;
  if (bigint1 > bigint2) return 1;
  return -1;
});
var _default = GenUtils;
exports["default"] = _default;