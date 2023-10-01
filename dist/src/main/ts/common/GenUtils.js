"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _assert = _interopRequireDefault(require("assert"));
var _async = _interopRequireDefault(require("async"));
var csv = _interopRequireWildcard(require("jquery-csv"));function _getRequireWildcardCache(nodeInterop) {if (typeof WeakMap !== "function") return null;var cacheBabelInterop = new WeakMap();var cacheNodeInterop = new WeakMap();return (_getRequireWildcardCache = function (nodeInterop) {return nodeInterop ? cacheNodeInterop : cacheBabelInterop;})(nodeInterop);}function _interopRequireWildcard(obj, nodeInterop) {if (!nodeInterop && obj && obj.__esModule) {return obj;}if (obj === null || typeof obj !== "object" && typeof obj !== "function") {return { default: obj };}var cache = _getRequireWildcardCache(nodeInterop);if (cache && cache.has(obj)) {return cache.get(obj);}var newObj = {};var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;for (var key in obj) {if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;if (desc && (desc.get || desc.set)) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}newObj.default = obj;if (cache) {cache.set(obj, newObj);}return newObj;}


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
 */
class GenUtils {

  /**
   * Indicates if the given argument is defined.
   * 
   * @param {any} arg is the arg to test
   * @return {boolean} true if the given arg is defined, false otherwise
   */
  static isDefined(arg) {
    return typeof arg !== 'undefined';
  }

  /**
   * Indicates if the given argument is undefined.
   * 
   * @param arg is the arg to test
   * @return {boolean} true if the given arg is undefined, false otherwise
   */
  static isUndefined(arg) {
    return typeof arg === 'undefined';
  }

  /**
   * Indicates if the given arg is initialized.
   * 
   * @param {any} arg is the arg to test
   * @return {boolean} true if the given arg is initialized, false otherwise
   */
  static isInitialized(arg) {
    return arg !== undefined && arg !== null;
  }

  /**
   * Indicates if the given arg is uninitialized.
   * 
   * @param arg is the arg to test
   * @return true if the given arg is uninitialized, false otherwise
   */
  static isUninitialized(arg) {
    if (!arg) return true;
    return false;
  }

  /**
   * Indicates if the given argument is a number.
   * 
   * @param {any} arg is the argument to test
   * @return {boolean} true if the argument is a number, false otherwise
   */
  static isNumber(arg) {
    return !isNaN(parseFloat(arg)) && isFinite(arg);
  }

  /**
   * Indicates if the given argument is an integer.
   * 
   * @param {any} arg is the argument to test
   * @return {boolean} true if the given argument is an integer, false otherwise
   */
  static isInt(arg) {
    return arg === parseInt("" + Number(arg)) && !isNaN(arg) && !isNaN(parseInt(arg, 10));
  }

  /**
   * Indicates if the given argument is an array.
   * 
   * @param {any} arg is the argument to test as being an array
   * @return {booolean} true if the argument is an array, false otherwise
   */
  static isArray(arg) {
    return arg instanceof Array && Array.isArray(arg);
  }

  /**
   * Indicates if the given argument is a string.
   * 
   * @param {any} arg is the argument to test as being a string
   * @return {boolean} true if the argument is a string, false otherwise
   */
  static isString(arg) {
    return typeof arg === 'string';
  }

  /**
   * Determines if the given argument is a boolean.
   * 
   * @param {any} arg is the argument to test as being a boolean
   * @return {boolean} true if the argument is a boolean, false otherwise
   */
  static isBoolean(arg) {
    return typeof arg == typeof true;
  }

  /**
   * Determines if the given argument is a static.
   * 
   * @param {any} arg is the argument to test as being a static
   * @return {boolean} true if the argument is a static, false otherwise
   */
  static isFunction(arg) {
    return typeof arg === "function";
  }

  /**
   * Indicates if the given argument is an object and optionally if it has the given constructor name.
   * 
   * @param {any} arg is the argument to test
   * @param {any} obj is an object to test arg instanceof obj (optional)
   * @return {boolean} true if the given argument is an object and optionally has the given constructor name
   */
  static isObject(arg, obj) {
    if (!arg) return false;
    if (typeof arg !== 'object') return false;
    if (obj && !(arg instanceof obj)) return false;
    return true;
  }

  /**
   * Determines if all alphabet characters in the given string are upper case.
   * 
   * @param {string} str is the string to test
   * @return {boolean} true if the string is upper case, false otherwise
   */
  static isUpperCase(str) {
    return str.toUpperCase() === str;
  }

  /**
   * Determines if all alphabet characters in the given string are lower case.
   * 
   * @param str is the string to test
   * @param true if the string is lower case, false otherwise
   */
  static isLowerCase(str) {
    return str.toLowerCase() === str;
  }

  /**
   * Asserts that the given argument is hex.
   * 
   * @param arg is the argument to assert as hex
   * @param msg is the message to throw if the argument is not hex
   */
  static assertHex(str, msg) {
    GenUtils.assertTrue(GenUtils.isHex(str), msg ? msg : "Argument asserted as hex but is not hex");
  }

  /**
   * Indicates if the given argument is a hexidemal string.
   * 
   * Credit: https://github.com/roryrjb/is-hex/blob/master/is-hex.js.
   * 
   * @param str is the string to test
   * @return true if the given string is hexidecimal, false otherwise
   */
  static isHex(arg) {
    if (typeof arg !== 'string') return false;
    if (arg.length === 0) return false;
    return (arg.match(/([0-9]|[a-f])/gim) || []).length === arg.length;
  }

  /**
   * Determines if the given string is base32.
   */
  static isBase32(str) {
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
  static assertBase58(str, msg) {
    GenUtils.assertTrue(GenUtils.isBase58(str), msg ? msg : "Argument asserted as base58 but is not base58");
  }

  /**
   * Determines if the given string is base58.
   */
  static isBase58(str) {
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
  static assertBase64(str, msg) {
    GenUtils.assertTrue(GenUtils.isBase64(str), msg ? msg : "Argument asserted as base64 but is not base64");
  }

  /**
   * Determines if the given string is base64.
   */
  static isBase64(str) {
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
  static fail(msg) {
    throw new Error(msg ? msg : "Failure (no message)");
  }

  /**
   * Asserts that the given condition is true.  Throws an exception if not a boolean or false.
   * 
   * @param {boolean} condition is the boolean to assert true
   * @param {string} [msg] is the message to throw if condition is false (optional)
   */
  static assertTrue(condition, msg) {
    if (typeof condition !== 'boolean') throw new Error("Argument is not a boolean");
    if (!condition) throw new Error(msg ? msg : "Boolean asserted as true but was false");
  }

  /**
   * Asserts that the given boolean is false.  Throws an exception if not a boolean or true.
   * 
   * @param bool is the boolean to assert false
   * @param msg is the message to throw if bool is true (optional)
   */
  static assertFalse(bool, msg) {
    if (typeof bool !== 'boolean') throw new Error("Argument is not a boolean");
    if (bool) throw new Error(msg ? msg : "Boolean asserted as false but was true");
  }

  /**
   * Asserts that the given argument is null.  Throws an exception if not null.
   * 
   * @param arg is the argument to assert null
   * @param msg is the message to throw if arg is not null (optional)
   */
  static assertNull(arg, msg) {
    if (arg !== null) throw new Error(msg ? msg : "Argument asserted as null but was not null: " + arg);
  }

  /**
   * Asserts that the given argument is not null.  Throws an exception if null.
   * 
   * @param arg is the argument to assert not null
   * @param msg is the message to throw if arg is null (optional)
   */
  static assertNotNull(arg, msg) {
    if (arg === null) throw new Error(msg ? msg : "Argument asserted as not null but was null");
  }

  /**
   * Asserts that the given argument is defined.  Throws an exception if undefined.
   * 
   * @param arg is the argument to assert defined
   * @param msg is the message to throw if arg is undefined (optional)
   */
  static assertDefined(arg, msg) {
    if (GenUtils.isUndefined(arg)) throw new Error(msg ? msg : "Argument asserted as defined but was undefined");
  }

  /**
   * Asserts that the given argument is undefined.  Throws an exception if defined.
   * 
   * @param arg is the argument to assert undefined
   * @param msg is the message to throw if arg is defined (optional)
   */
  static assertUndefined(arg, msg) {
    if (GenUtils.isDefined(arg)) throw new Error(msg ? msg : "Argument asserted as undefined but was defined: " + arg);
  }

  /**
   * Asserts that the given argument is initialized.  Throws an exception if not initialized.
   * 
   * @param arg is the argument to assert as initialized
   * @param msg is the message to throw if arg is not initialized (optional)
   */
  static assertInitialized(arg, msg) {
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
  static assertUninitialized(arg, msg) {
    if (GenUtils.isInitialized(arg)) throw new Error(msg ? msg : "Argument asserted as uninitialized but was initialized");
  }

  /**
   * Asserts that the given arguments are equal.  Throws an exception if not equal.
   * 
   * @param arg1 is an argument to assert as equal
   * @param arg2 is an argument to assert as equal
   * @param msg is the message to throw if the arguments are not equal
   */
  static assertEquals(arg1, arg2, msg) {
    GenUtils.assertTrue(GenUtils.equals(arg1, arg2), msg ? msg : "Arguments asserted as equal but are not equal: " + arg1 + " vs " + arg2);
  }

  /**
   * Asserts that the given arguments are not equal.  Throws an exception if equal.
   * 
   * @param arg1 is an argument to assert as not equal
   * @param arg2 is an argument to assert as not equal
   * @param msg is the message to throw if the arguments are equal
   */
  static assertNotEquals(arg1, arg2, msg) {
    if (arg1 === arg2) throw new Error(msg ? msg : "Arguments asserted as not equal but are equal: " + arg1 + " vs " + arg2);
  }

  /**
   * Asserts that the given argument is an integer.
   * 
   * @param arg is the argument to assert as an integer
   * @param msg is the message to throw if the argument is not an integer
   */
  static assertInt(arg, msg) {
    if (!GenUtils.isInt(arg)) throw new Error(msg ? msg : "Argument asserted as an integer but is not an integer");
  }

  /**
   * Asserts that the given argument is a number.
   * 
   * @param arg is the argument to assert as a number
   * @param msg is the message to throw if the argument is not a number
   */
  static assertNumber(arg, msg) {
    if (!GenUtils.isNumber(arg)) throw new Error(msg ? msg : "Argument asserted as a number but is not a number");
  }

  /**
   * Asserts that the given argument is a boolean.
   * 
   * @param arg is the argument to assert as a boolean
   * @param msg is the message to throw if the argument is not a boolean
   */
  static assertBoolean(arg, msg) {
    if (!GenUtils.isBoolean(arg)) throw new Error(msg ? msg : "Argument asserted as a boolean but is not a boolean");
  }

  /**
   * Asserts that the given argument is a string.
   * 
   * @param arg is the argument to assert as a string
   * @param msg is the message to throw if the argument is not a string
   */
  static assertString(arg, msg) {
    if (!GenUtils.isString(arg)) throw new Error(msg ? msg : "Argument asserted as a string but is not a string: " + arg);
  }

  /**
   * Asserts that the given argument is an array.
   * 
   * @param arg is the argument to assert as an array
   * @param msg is the message to throw if the argument is not an array
   */
  static assertArray(arg, msg) {
    if (!GenUtils.isArray(arg)) throw new Error(msg ? msg : "Argument asserted as an array but is not an array");
  }

  /**
   * Asserts that the given argument is a static.
   * 
   * @param arg is the argument to assert as a static
   * @param msg is the message to throw if the argument is not a static
   */
  static assertFunction(arg, msg) {
    if (!GenUtils.isFunction(arg)) throw new Error(msg ? msg : "Argument asserted as a static but is not a static");
  }

  /**
   * Asserts that the given argument is an object with the given name.
   * 
   * @param arg is the argument to test
   * @param obj is an object to assert arg instanceof obj (optional)
   * @param msg is the message to throw if the argument is not the specified object
   */
  static assertObject(arg, obj, msg) {
    GenUtils.assertInitialized(arg, msg);
    if (obj) {
      if (!GenUtils.isObject(arg, obj)) throw new Error(msg ? msg : "Argument asserted as object '" + obj.name + "' but was not");
    } else {
      if (!GenUtils.isObject(arg)) throw new Error(msg ? msg : "Argument asserted as object but was not");
    }
  }

  /**
   * Sets the child's prototype to the parent's prototype.
   * 
   * @param child is the child class
   * @param parent is the parent class
   */
  static inheritsFrom(child, parent) {
    child.prototype = Object.create(parent.prototype);
    child.prototype.constructor = child;
  }

  /**
   * Invokes functions with arguments.
   * 
   * arguments[0] is assumed to be an array of functions to invoke
   * arguments[1...n] are args to invoke the functions with
   */
  static invoke() {
    let fns = arguments[0];
    let args = [];
    for (let i = 1; i < arguments.length; i++) args.push(arguments[i]);
    for (let i = 0; i < fns.length; i++) {
      GenUtils.assertFunction(fns[i], "Functions[" + i + "] is not a static");
      fns[i].apply(null, args);
    }
  }

  /**
   * Returns the power set of the given array.
   * 
   * @param arr is the array to get the power set of
   * @return [][] is the power set of the given array
   */
  static getPowerSet(arr) {
    let fn = function (n, src, got, all) {
      if (n == 0) {
        if (got.length > 0) {
          all[all.length] = got;
        }
        return;
      }
      for (let j = 0; j < src.length; j++) {
        fn(n - 1, src.slice(j + 1), got.concat([src[j]]), all);
      }
      return;
    };
    let all = [];
    all.push([]);
    for (let i = 0; i < arr.length; i++) {
      fn(i, arr, [], all);
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
  static getPowerSetOfLength(arr, size) {
    GenUtils.assertInitialized(arr);
    GenUtils.assertInitialized(size);
    GenUtils.assertTrue(size >= 1);
    let powerSet = GenUtils.getPowerSet(arr);
    let powerSetOfLength = [];
    for (let i = 0; i < powerSet.length; i++) {
      if (powerSet[i].length === size) {
        powerSetOfLength.push(powerSet[i]);
      }
    }
    return powerSetOfLength;
  }

  /**
   * Returns an array of indices of the given size.
   * 
   * @param size specifies the size to get indices for
   * @return array of the given size with indices starting at 0
   */
  static getIndices(size) {
    let indices = [];
    for (let i = 0; i < size; i++) {
      indices.push(i);
    }
    return indices;
  }

  /**
   * Returns a new array containing unique elements of the given array.
   * 
   * @param arr is the array to return unique elements from
   * @return a new array with the given array's unique elements
   */
  static toUniqueArray(arr) {
    return arr.filter(function (value, index, self) {
      return self.indexOf(value) === index;
    });
  }

  /**
   * Copies the given array.
   * 
   * @param arr is the array to copy
   * @return a copy of the given array
   */
  static copyArray(arr) {
    GenUtils.assertArray(arr);
    let copy = [];
    for (let i = 0; i < arr.length; i++) copy.push(arr[i]);
    return copy;
  }

  /**
   * Removes every instance of the given value from the given array.
   * 
   * @param arr is the array to remove the value from
   * @param val is the value to remove from the array
   * @return true if the value is found and removed, false otherwise
   */
  static remove(arr, val) {
    let found = false;
    for (let i = arr.length - 1; i >= 0; i--) {
      if (arr[i] === val) {
        arr.splice(i, 1);
        found = true;
        i--;
      }
    }
    return found;
  }

  /**
   * Returns a copy of the given array where each element is lowercase.
   * 
   * @param arr is the array to convert to lowercase
   * @return a copy of the given array where each element is lowercase
   */
  static toLowerCaseArray(arr) {
    let arr2 = [];
    for (let i = 0; i < arr.length; i++) {
      arr2.push(arr[i].toLowerCase());
    }
    return arr2;
  }

  /**
   * Listifies the given argument.
   * 
   * @param arrOrElem is an array or an element in the array
   * @return an array which is the given arg if it's an array or an array with the given arg as an element
   */
  static listify(arrOrElem) {
    return GenUtils.isArray(arrOrElem) ? arrOrElem : [arrOrElem];
  }

  /**
   * Indicates if the given array contains the given object.
   * 
   * @param {any} arr - array that may or may not contain the object
   * @param {any} obj - object to check for inclusion in the array
   * @param {boolean} [compareByReference] - compare strictly by reference, forgoing deep equality check (default false)
   * @return true if the array contains the object, false otherwise
   */
  static arrayContains(arr, obj, compareByReference = false) {
    GenUtils.assertTrue(GenUtils.isArray(arr));
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === obj) return true;
      if (!compareByReference && GenUtils.equals(arr[i], obj)) return true;
    }
    return false;
  }

  /**
   * Indicates if the given string contains the given substring.
   * 
   * @param str is the string to search for a substring
   * @param substring is the substring to searchin within the string
   * @return true if the substring is within the string, false otherwise
   */
  static strContains(str, substring) {
    return str.indexOf(substring) > -1;
  }

  /**
   * Determines if two arrays are equal.
   * 
   * @param arr1 is an array to compare
   * @param arr2 is an array to compare
   * @return true if the arrays are equal, false otherwise
   */
  static arraysEqual(arr1, arr2) {
    if (arr1 === arr2) return true;
    if (arr1 == null && arr2 == null) return true;
    if (arr1 == null || arr2 == null) return false;
    if (typeof arr1 === 'undefined' && typeof arr2 === 'undefined') return true;
    if (typeof arr1 === 'undefined' || typeof arr2 === 'undefined') return false;
    if (!GenUtils.isArray(arr1)) throw new Error("First argument is not an array");
    if (!GenUtils.isArray(arr2)) throw new Error("Second argument is not an array");
    if (arr1.length != arr2.length) return false;
    for (let i = 0; i < arr1.length; ++i) {
      if (!GenUtils.equals(arr1[i], arr2[i])) return false;
    }
    return true;
  }

  /**
   * Determines if two arguments are deep equal.
   * 
   * @param arg1 is an argument to compare
   * @param arg2 is an argument to compare
   * @return true if the arguments are deep equals, false otherwise
   */
  static equals(arg1, arg2) {
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
   * @return true if the maps have identical keys and values, false otherwise
   */
  static objectsEqual(map1, map2) {
    let keys1 = Object.keys(map1);
    let keys2 = Object.keys(map2);

    // compare each key1 to keys2
    for (let key1 of keys1) {
      let found = false;
      for (let key2 of keys2) {
        if (key1 === key2) {
          if (!GenUtils.equals(map1[key1], map2[key2])) return false;
          found = true;
          break;
        }
      }
      if (!found && map1[key1] !== undefined) return false; // allows undefined values to equal non-existent keys
    }

    // compare each key2 to keys1
    for (let key2 of keys2) {
      let found = false;
      for (let key1 of keys1) {
        if (key1 === key2) {
          found = true; // no need to re-compare which was done earlier
          break;
        }
      }
      if (!found && map2[key2] !== undefined) return false; // allows undefined values to equal non-existent keys
    }
    return true;

    // TODO: support strict option?
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
  static deleteUndefinedKeys(obj) {
    for (let key of Object.keys(obj)) {
      if (obj[key] === undefined) delete obj[key];
    }
  }

  /**
   * Returns combinations of the given array of the given size.
   * 
   * @param arr is the array to get combinations from
   * @param combinationSize specifies the size of each combination
   */
  static getCombinations(arr, combinationSize) {

    // validate input
    GenUtils.assertInitialized(arr);
    GenUtils.assertInitialized(combinationSize);
    GenUtils.assertTrue(combinationSize >= 1);

    // get combinations of array indices of the given size
    let indexCombinations = GenUtils.getPowerSetOfLength(GenUtils.getIndices(arr.length), combinationSize);

    // collect combinations from each combination of array indices
    let combinations = [];
    for (let indexCombinationsIdx = 0; indexCombinationsIdx < indexCombinations.length; indexCombinationsIdx++) {

      // get combination of array indices
      let indexCombination = indexCombinations[indexCombinationsIdx];

      // build combination from array
      let combination = [];
      for (let indexCombinationIdx = 0; indexCombinationIdx < indexCombination.length; indexCombinationIdx++) {
        combination.push(arr[indexCombination[indexCombinationIdx]]);
      }

      // add to combinations
      combinations.push(combination);
    }

    return combinations;
  }

  /**
   * Gets an 'a' element that is downloadable when clicked.
   * 
   * @param name is the name of the file to download
   * @param contents are the string contents of the file to download
   * @return 'a' dom element with downloadable file
   */
  static getDownloadableA(name, contents) {
    let a = window.document.createElement('a');
    a.href = window.URL.createObjectURL(new Blob([contents], { type: 'text/plain' }));
    a.download = name;
    a.target = "_blank";
    a.innerHTML = name;
    return a;
  }

  /**
   * Copies properties in the given object to a new object.
   * 
   * @param obj is object to copy properties for
   * @return a new object with properties copied from the given object
   */
  static copyProperties(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Deletes all properties in the given object.
   * 
   * @param obj is the object to delete properties from
   */
  static deleteProperties(obj) {
    let props = [];
    for (let prop in obj) props.push(prop); // TODO: if (obj.hasOwnProperty(prop)) { ...
    for (let i = 0; i < props.length; i++) delete obj[props[i].toString()];
  }

  /**
   * Converts a CSV string to a 2-dimensional array of strings.
   * 
   * @param csv is the CSV string to convert
   * @return a 2-dimensional array of strings
   */
  static csvToArr(csv) {
    return csv.toArrays(csv);
  }

  /**
   * Converts the given array to a CSV string.
   * 
   * @param arr is a 2-dimensional array of strings
   * @return the CSV string
   */
  static arrToCsv(arr) {
    return csv.fromObjects(arr, { headers: false });
  }

  /**
   * Indicates if the given string contains whitespace.
   * 
   * @param str is the string to test
   * @return true if the string contains whitespace, false otherwise
   */
  static hasWhitespace(str) {
    return /\s/g.test(str);
  }

  /**
   * Indicates if the given character is whitespace.
   * 
   * @param char is the character to test
   * @return true if the given character is whitespace, false otherwise
   */
  static isWhitespace(char) {
    return /\s/.test(char);
  }

  /**
   * Indicates if the given character is a newline.
   * 
   * @param char is the character to test
   * @return true if the given character is a newline, false otherwise
   */
  static isNewline(char) {
    return char === '\n' || char === '\r';
  }

  /**
   * Counts the number of non-whitespace characters in the given string.
   * 
   * @param str is the string to count the number of non-whitespace characters in
   * @return int is the number of non-whitespace characters in the given string
   */
  static countNonWhitespaceCharacters(str) {
    let count = 0;
    for (let i = 0; i < str.length; i++) {
      if (!GenUtils.isWhitespace(str.charAt(i))) count++;
    }
    return count;
  }

  /**
   * Returns tokens separated by whitespace from the given string.
   * 
   * @param str is the string to get tokens from
   * @return string[] are the tokens separated by whitespace within the string
   */
  static getWhitespaceTokens(str) {
    return str.match(/\S+/g);
  }

  /**
   * Returns lines separated by newlines from the given string.
   * 
   * @param str is the string to get lines from
   * @param string[] are the lines separated by newlines within the string
   */
  static getLines(str) {
    return str.match(/[^\r\n]+/g);
  }

  /**
   * Returns the document's first stylesheet which has no href.
   * 
   * @return StyleSheet is the internal stylesheet
   */
  static getInternalStyleSheet() {
    for (let i = 0; i < document.styleSheets.length; i++) {
      let styleSheet = document.styleSheets[i];
      if (!styleSheet.href) return styleSheet;
    }
    return null;
  }

  /**
   * Returns the document's internal stylesheet as text.
   * 
   * @return str is the document's internal stylesheet
   */
  static getInternalStyleSheetText() {
    let internalCss = "";
    let internalStyleSheet = GenUtils.getInternalStyleSheet();
    if (!internalStyleSheet) return null;
    for (let i = 0; i < internalStyleSheet.cssRules.length; i++) {
      internalCss += internalStyleSheet.cssRules[i].cssText + "\n";
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
   * @return str is the document string
   */
  static buildHtmlDocument(content) {
    let str = "<!DOCTYPE HTML>";
    str += "<html><head>";

    // add metas
    if (content.metas) {
      let metas = GenUtils.listify(content.metas);
      for (let i = 0; i < metas.length; i++) {
        let meta = metas[i];
        let elem = document.createElement("meta");
        for (let prop in meta) {
          if (meta.hasOwnProperty(prop)) {
            elem.setAttribute(prop.toString(), meta[prop.toString()]);
          }
        }
        str += elem.outerHTML;
      }
    }

    // add title and internal css
    str += content.title ? "<title>" + content.title + "</title>" : "";
    str += content.internalCss ? "<style>" + content.internalCss + "</style>" : "";

    // add dependency paths
    if (content.dependencyPaths) {
      let dependencyPaths = GenUtils.listify(content.dependencyPaths);
      for (let i = 0; i < dependencyPaths.length; i++) {
        let dependencyPath = dependencyPaths[i];
        if (dependencyPath.endsWith(".js")) str += "<script src='" + dependencyPath + "'></script>";else
        if (dependencyPath.endsWith(".css")) str += "<link rel='stylesheet' type='text/css' href='" + dependencyPath + "'/>";else
        if (dependencyPath.endsWith(".png") || dependencyPath.endsWith(".img")) str += "<img src='" + dependencyPath + "'>";else
        throw new Error("Unrecognized dependency path extension: " + dependencyPath);
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
  static newWindow(content, onLoad) {
    let onLoadCalled = false;
    let w = window.open();
    if (!GenUtils.isInitialized(w) || !GenUtils.isInitialized(w.document)) {
      onLoadOnce(new Error("Could not get window reference"));
      return;
    }
    w.opener = null;
    w.document.write(GenUtils.buildHtmlDocument(content));
    w.addEventListener('load', function () {
      onLoadOnce(null, w);
    });
    w.document.close();

    // prevents onLoad() from being called multiple times
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
  static imgToDataUrl(img, quality) {
    let canvas = document.createElement('canvas');
    canvas.height = img.naturalHeight;
    canvas.width = img.naturalWidth;
    let context = canvas.getContext('2d');
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
  static isImageAccessible(url, timeout, onDone) {

    // track return so it only executes once
    let returned = false;

    // attempt to load favicon
    let img = new Image();
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
      if (typeof e === 'undefined' || e.type === "error") onDone(false);else
      onDone(true);
    }
  }

  /**
   * Determines if the given file is a zip file.
   * 
   * @param file is a file
   * @return true if the given file is a zip file, false otherwise
   */
  static isZipFile(file) {
    return file.name.endsWith(".zip") || file.type === 'application/zip';
  }

  /**
   * Determines if the given file is a json file.
   * 
   * @param file is a file
   * @return true if the given file is a json file, false otherwise
   */
  static isJsonFile(file) {
    return file.name.endsWith(".json") || file.type === 'application/json';
  }

  /**
   * Determines if the given file is a csv file.
   * 
   * @param file is a file
   * @return true if the given file is a csv file, false otherwise
   */
  static isCsvFile(file) {
    return file.name.endsWith(".csv") || file.type === 'text/csv';
  }

  /**
   * Determines if the given file is a txt file.
   * 
   * @param file is a file
   * @return true if the given file is a txt file, false otherwise
   */
  static isTxtFile(file) {
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
  static getImages(paths, onDone) {

    // listify paths
    if (!GenUtils.isArray(paths)) {
      GenUtils.assertTrue(GenUtils.isString(paths));
      paths = [paths];
    }

    // collect functions to fetch images
    let funcs = [];
    for (let i = 0; i < paths.length; i++) {
      funcs.push(loadFunc(paths[i]));
    }

    // fetch in parallel
    _async.default.parallel(funcs, onDone);

    // callback static to fetch a single image
    function loadFunc(path) {
      return function (onDone) {
        let img = new Image();
        img.onload = function () {onDone(null, img);};
        img.onerror = function () {onDone(new Error("Cannot load image: " + path));};
        img.src = path;
      };
    }
  }

  /**
   * Returns a string indentation of the given length;
   * 
   * @param length is the length of the indentation
   * @return {string} is an indentation string of the given length
   */
  static getIndent(length) {
    let str = "";
    for (let i = 0; i < length; i++) str += '  '; // two spaces
    return str;
  }

  static initPolyfills() {

    // Polyfill Object.assign()
    // Credit: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
    if (typeof Object.assign != 'function') {
      // Must be writable: true, enumerable: false, configurable: true
      Object.defineProperty(Object, "assign", {
        value: function assign(target, varArgs) {// .length of static is 2
          'use strict';
          if (target == null) {// TypeError if undefined or null
            throw new TypeError('Cannot convert undefined or null to object');
          }

          let to = Object(target);

          for (let index = 1; index < arguments.length; index++) {
            let nextSource = arguments[index];

            if (nextSource != null) {// Skip over if undefined or null
              for (let nextKey in nextSource) {
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
  }

  /**
   * Generates a v4 UUID.
   * 
   * Source: https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
   */
  static getUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      let r = Math.random() * 16 | 0,v = c == 'x' ? r : r & 0x3 | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Indicates if the current environment is a browser.
   * 
   * @return {boolean} true if the environment is a browser, false otherwise
   */
  static isBrowser() {
    let isWorker = typeof importScripts === 'function';
    let isBrowserMain = new Function("try {return this===window;}catch(e){return false;}")();
    let isJsDom = isBrowserMain ? new Function("try {return window.navigator.userAgent.includes('jsdom');}catch(e){return false;}")() : false;
    return isWorker || isBrowserMain && !isJsDom;
  }

  /**
   * Indicates if the current environment is a firefox-based browser.
   * 
   * @return {boolean} true if the environment is a firefox-based browser, false otherwise
   */
  static isFirefox() {
    return this.isBrowser() && navigator.userAgent.indexOf("Firefox") > 0;
  }

  /**
   * Gets the IE version number.
   * 
   * Credit: https://stackoverflow.com/questions/19999388/check-if-user-is-using-ie-with-jquery/21712356#21712356
   * 
   * @return the IE version number or null if not IE
   */
  static getIEVersion() {
    let ua = window.navigator.userAgent;

    let msie = ua.indexOf('MSIE ');
    if (msie > 0) {
      // IE 10 or older => return version number
      return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }

    let trident = ua.indexOf('Trident/');
    if (trident > 0) {
      // IE 11 => return version number
      let rv = ua.indexOf('rv:');
      return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }

    let edge = ua.indexOf('Edge/');
    if (edge > 0) {
      // Edge (IE 12+) => return version number
      return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
    }

    // other browser
    return null;
  }

  /**
   * Gets a parameter value.
   * 
   * Credit: https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
   * 
   * @param name is the name of the parameter to get the value of
   * @param url is a URL to get the parameter from, uses the window's current href if not given
   * @return the parameter's value
   */
  static getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),results = regex.exec(url);
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
  static getRandomInt(min, max) {
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
  static getRandomInts(min, max, count) {
    GenUtils.assertTrue(typeof count === "number");
    let ints = [];
    for (let i = 0; i < count; i++) ints.push(GenUtils.getRandomInt(min, max));
    return ints;
  }

  /**
   * Gets a given number of unique random ints within a range.
   * 
   * @param min is the minimum range of the ints to generate, inclusive
   * @param max is the maximum range of the ints to generate, inclusive
   * @param count is the number of unique random ints to get
   */
  static getUniqueRandomInts(min, max, count) {
    let ints = [];
    GenUtils.assertTrue(count >= 0);
    GenUtils.assertTrue(max - min + 1 >= count);
    while (ints.length < count) {
      let randomInt = GenUtils.getRandomInt(min, max);
      if (!ints.includes(randomInt)) ints.push(randomInt);
    }
    return ints;
  }

  /**
   * Randomize array element order in-place using Durstenfeld shuffle algorithm.
   * 
   * Credit: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
   */
  static shuffle(array) {
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
  static sort(array) {
    array.sort((a, b) => a === b ? 0 : a > b ? 1 : -1);
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
   * @param [config] specifies reconciliation configuration
   *        config.resolveDefined uses defined value if true or undefined, undefined if false
   *        config.resolveTrue uses true over false if true, false over true if false, must be equal if undefined
   *        config.resolveMax uses max over min if true, min over max if false, must be equal if undefined
   * @param [errMsg] is the error message to throw if the values cannot be reconciled (optional)
   */
  static safeSet(obj, getFn, setFn, val, config, errMsg) {
    let curVal = getFn.call(obj);
    let reconciledVal = GenUtils.reconcile(curVal, val, config, errMsg);
    if (curVal !== reconciledVal) setFn.call(obj, reconciledVal);
  }

  /**
   * Reconciles two values.
   * 
   * TODO: remove custom error message
   * 
   * @param val1 is a value to reconcile
   * @param val2 is a value to reconcile
   * @param [config] specifies reconciliation configuration
   *        config.resolveDefined uses defined value if true or undefined, undefined if false
   *        config.resolveTrue uses true over false if true, false over true if false, must be equal if undefined
   *        config.resolveMax uses max over min if true, min over max if false, must be equal if undefined
   * @param [errMsg] is the error message to throw if the values cannot be reconciled (optional)
   * @return the reconciled value if reconcilable, throws error otherwise
   */
  static reconcile(val1, val2, config, errMsg) {

    // check for equality
    if (val1 === val2) return val1;

    // check for bigint equality
    let comparison; // save comparison for later if applicable
    if (typeof val1 === "bigint" && typeof val2 === "bigint") {
      if (val1 === val2) return val1;
    }

    // resolve one value defined
    if (val1 === undefined || val2 === undefined) {
      if (config && config.resolveDefined === false) return undefined; // use undefined
      else return val1 === undefined ? val2 : val1; // use defined value
    }

    // resolve different booleans
    if (config && config.resolveTrue !== undefined && typeof val1 === "boolean" && typeof val2 === "boolean") {
      _assert.default.equal(typeof config.resolveTrue, "boolean");
      return config.resolveTrue;
    }

    // resolve different numbers
    if (config && config.resolveMax !== undefined) {
      _assert.default.equal(typeof config.resolveMax, "boolean");

      // resolve js numbers
      if (typeof val1 === "number" && typeof val2 === "number") {
        return config.resolveMax ? Math.max(val1, val2) : Math.min(val1, val2);
      }

      // resolve bigints
      if (typeof val1 === "bigint" && typeof val2 === "bigint") {
        return config.resolveMax ? comparison < 0 ? val2 : val1 : comparison < 0 ? val1 : val2;
      }
    }

    // assert deep equality
    _assert.default.deepEqual(val1, val2, errMsg ? errMsg : "Cannot reconcile values " + val1 + " and " + val2 + " with config: " + JSON.stringify(config));
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
   * @return {string} is the human-friendly key value line
   */
  static kvLine(key, value, indent = 0, newline = true, ignoreUndefined = true) {
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
  static stringifyBigInts(str) {
    return str.replace(/("[^"]*"\s*:\s*)(\d{16,})/g, '$1"$2"');
  }

  /**
   * Print the current stack trace. 
   * 
   * @param {string} msg - optional message to print with the trace
   */
  static printStackTrace(msg) {
    try {throw new Error(msg);}
    catch (err) {console.error(err.stack);}
  }

  /**
   * Wait for the duration.
   * 
   * @param {number} durationMs - the duration to wait for in milliseconds
   */
  static async waitFor(durationMs) {
    return new Promise(function (resolve) {setTimeout(resolve, durationMs);});
  }

  /**
   * Kill the given nodejs child process.
   * 
   * @param {ChildProcess} process - the nodejs child process to kill
   * @param {number | NodeJS.Signals} [signal] - the kill signal, e.g. SIGTERM, SIGKILL, SIGINT (default)
   * @return {Promise<number | undefined>} the exit code from killing the process
   */
  static async killProcess(process, signal) {
    return new Promise((resolve, reject) => {
      process.on("exit", function (code, signal) {resolve(code);});
      process.on("error", function (err) {reject(err);});
      try {
        if (!process.kill(signal === undefined ? "SIGINT" : signal)) resolve(undefined); // resolve immediately if not running
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Normalize a URI.
   * 
   * @param {string} uri - the URI to normalize
   * @return {string} the normalized URI
   */
  static normalizeUri(uri) {
    if (!uri) throw Error("Must provide URI to normalize");
    uri = uri.replace(/\/$/, ""); // strip trailing slash
    if (!new RegExp("^\\w+://.+").test(uri)) uri = "http://" + uri; // assume http if protocol not given
    return uri;
  }

  /**
   * Get the absolute value of the given bigint or number.
   * 
   * @param {bigint | number} bi - the bigint or number to get the absolute value of
   * @return {bigint | number} the absolute value of the given bigint or number
   */
  static abs(bi) {
    return bi < 0 ? -bi : bi;
  }

  /**
   * Get an enum key name by value.
   * 
   * @param {any} enumType is the enum type to get the key from
   * @param {any} enumValue is the enum value to get the key for
   * @return {string | undefined} the enum key name
   */
  static getEnumKeyByValue(enumType, enumValue) {
    for (let key in enumType) {
      if (enumType[key] === enumValue) return key;
    }
    return undefined;
  }
}exports.default = GenUtils;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfYXN5bmMiLCJjc3YiLCJfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZCIsIl9nZXRSZXF1aXJlV2lsZGNhcmRDYWNoZSIsIm5vZGVJbnRlcm9wIiwiV2Vha01hcCIsImNhY2hlQmFiZWxJbnRlcm9wIiwiY2FjaGVOb2RlSW50ZXJvcCIsIm9iaiIsIl9fZXNNb2R1bGUiLCJkZWZhdWx0IiwiY2FjaGUiLCJoYXMiLCJnZXQiLCJuZXdPYmoiLCJoYXNQcm9wZXJ0eURlc2NyaXB0b3IiLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsImdldE93blByb3BlcnR5RGVzY3JpcHRvciIsImtleSIsInByb3RvdHlwZSIsImhhc093blByb3BlcnR5IiwiY2FsbCIsImRlc2MiLCJzZXQiLCJHZW5VdGlscyIsImlzRGVmaW5lZCIsImFyZyIsImlzVW5kZWZpbmVkIiwiaXNJbml0aWFsaXplZCIsInVuZGVmaW5lZCIsImlzVW5pbml0aWFsaXplZCIsImlzTnVtYmVyIiwiaXNOYU4iLCJwYXJzZUZsb2F0IiwiaXNGaW5pdGUiLCJpc0ludCIsInBhcnNlSW50IiwiTnVtYmVyIiwiaXNBcnJheSIsIkFycmF5IiwiaXNTdHJpbmciLCJpc0Jvb2xlYW4iLCJpc0Z1bmN0aW9uIiwiaXNPYmplY3QiLCJpc1VwcGVyQ2FzZSIsInN0ciIsInRvVXBwZXJDYXNlIiwiaXNMb3dlckNhc2UiLCJ0b0xvd2VyQ2FzZSIsImFzc2VydEhleCIsIm1zZyIsImFzc2VydFRydWUiLCJpc0hleCIsImxlbmd0aCIsIm1hdGNoIiwiaXNCYXNlMzIiLCJ0ZXN0IiwiYXNzZXJ0QmFzZTU4IiwiaXNCYXNlNTgiLCJhc3NlcnRCYXNlNjQiLCJpc0Jhc2U2NCIsImJ0b2EiLCJhdG9iIiwiZXJyIiwiZmFpbCIsIkVycm9yIiwiY29uZGl0aW9uIiwiYXNzZXJ0RmFsc2UiLCJib29sIiwiYXNzZXJ0TnVsbCIsImFzc2VydE5vdE51bGwiLCJhc3NlcnREZWZpbmVkIiwiYXNzZXJ0VW5kZWZpbmVkIiwiYXNzZXJ0SW5pdGlhbGl6ZWQiLCJhc3NlcnRVbmluaXRpYWxpemVkIiwiYXNzZXJ0RXF1YWxzIiwiYXJnMSIsImFyZzIiLCJlcXVhbHMiLCJhc3NlcnROb3RFcXVhbHMiLCJhc3NlcnRJbnQiLCJhc3NlcnROdW1iZXIiLCJhc3NlcnRCb29sZWFuIiwiYXNzZXJ0U3RyaW5nIiwiYXNzZXJ0QXJyYXkiLCJhc3NlcnRGdW5jdGlvbiIsImFzc2VydE9iamVjdCIsIm5hbWUiLCJpbmhlcml0c0Zyb20iLCJjaGlsZCIsInBhcmVudCIsImNyZWF0ZSIsImNvbnN0cnVjdG9yIiwiaW52b2tlIiwiZm5zIiwiYXJndW1lbnRzIiwiYXJncyIsImkiLCJwdXNoIiwiYXBwbHkiLCJnZXRQb3dlclNldCIsImFyciIsImZuIiwibiIsInNyYyIsImdvdCIsImFsbCIsImoiLCJzbGljZSIsImNvbmNhdCIsImdldFBvd2VyU2V0T2ZMZW5ndGgiLCJzaXplIiwicG93ZXJTZXQiLCJwb3dlclNldE9mTGVuZ3RoIiwiZ2V0SW5kaWNlcyIsImluZGljZXMiLCJ0b1VuaXF1ZUFycmF5IiwiZmlsdGVyIiwidmFsdWUiLCJpbmRleCIsInNlbGYiLCJpbmRleE9mIiwiY29weUFycmF5IiwiY29weSIsInJlbW92ZSIsInZhbCIsImZvdW5kIiwic3BsaWNlIiwidG9Mb3dlckNhc2VBcnJheSIsImFycjIiLCJsaXN0aWZ5IiwiYXJyT3JFbGVtIiwiYXJyYXlDb250YWlucyIsImNvbXBhcmVCeVJlZmVyZW5jZSIsInN0ckNvbnRhaW5zIiwic3Vic3RyaW5nIiwiYXJyYXlzRXF1YWwiLCJhcnIxIiwib2JqZWN0c0VxdWFsIiwibWFwMSIsIm1hcDIiLCJrZXlzMSIsImtleXMiLCJrZXlzMiIsImtleTEiLCJrZXkyIiwiZGVsZXRlVW5kZWZpbmVkS2V5cyIsImdldENvbWJpbmF0aW9ucyIsImNvbWJpbmF0aW9uU2l6ZSIsImluZGV4Q29tYmluYXRpb25zIiwiY29tYmluYXRpb25zIiwiaW5kZXhDb21iaW5hdGlvbnNJZHgiLCJpbmRleENvbWJpbmF0aW9uIiwiY29tYmluYXRpb24iLCJpbmRleENvbWJpbmF0aW9uSWR4IiwiZ2V0RG93bmxvYWRhYmxlQSIsImNvbnRlbnRzIiwiYSIsIndpbmRvdyIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImhyZWYiLCJVUkwiLCJjcmVhdGVPYmplY3RVUkwiLCJCbG9iIiwidHlwZSIsImRvd25sb2FkIiwidGFyZ2V0IiwiaW5uZXJIVE1MIiwiY29weVByb3BlcnRpZXMiLCJKU09OIiwicGFyc2UiLCJzdHJpbmdpZnkiLCJkZWxldGVQcm9wZXJ0aWVzIiwicHJvcHMiLCJwcm9wIiwidG9TdHJpbmciLCJjc3ZUb0FyciIsInRvQXJyYXlzIiwiYXJyVG9Dc3YiLCJmcm9tT2JqZWN0cyIsImhlYWRlcnMiLCJoYXNXaGl0ZXNwYWNlIiwiaXNXaGl0ZXNwYWNlIiwiY2hhciIsImlzTmV3bGluZSIsImNvdW50Tm9uV2hpdGVzcGFjZUNoYXJhY3RlcnMiLCJjb3VudCIsImNoYXJBdCIsImdldFdoaXRlc3BhY2VUb2tlbnMiLCJnZXRMaW5lcyIsImdldEludGVybmFsU3R5bGVTaGVldCIsInN0eWxlU2hlZXRzIiwic3R5bGVTaGVldCIsImdldEludGVybmFsU3R5bGVTaGVldFRleHQiLCJpbnRlcm5hbENzcyIsImludGVybmFsU3R5bGVTaGVldCIsImNzc1J1bGVzIiwiY3NzVGV4dCIsImJ1aWxkSHRtbERvY3VtZW50IiwiY29udGVudCIsIm1ldGFzIiwibWV0YSIsImVsZW0iLCJzZXRBdHRyaWJ1dGUiLCJvdXRlckhUTUwiLCJ0aXRsZSIsImRlcGVuZGVuY3lQYXRocyIsImRlcGVuZGVuY3lQYXRoIiwiZW5kc1dpdGgiLCJkaXYiLCIkIiwiYXBwZW5kIiwiY2xvbmUiLCJodG1sIiwibmV3V2luZG93Iiwib25Mb2FkIiwib25Mb2FkQ2FsbGVkIiwidyIsIm9wZW4iLCJvbkxvYWRPbmNlIiwib3BlbmVyIiwid3JpdGUiLCJhZGRFdmVudExpc3RlbmVyIiwiY2xvc2UiLCJpbWdUb0RhdGFVcmwiLCJpbWciLCJxdWFsaXR5IiwiY2FudmFzIiwiaGVpZ2h0IiwibmF0dXJhbEhlaWdodCIsIndpZHRoIiwibmF0dXJhbFdpZHRoIiwiY29udGV4dCIsImdldENvbnRleHQiLCJkcmF3SW1hZ2UiLCJ0b0RhdGFVUkwiLCJpc0ltYWdlQWNjZXNzaWJsZSIsInVybCIsInRpbWVvdXQiLCJvbkRvbmUiLCJyZXR1cm5lZCIsIkltYWdlIiwib25sb2FkIiwib25SZXNwb25zZSIsIm9uZXJyb3IiLCJEYXRlIiwic2V0VGltZW91dCIsInNldEltbWVkaWF0ZSIsImUiLCJpc1ppcEZpbGUiLCJmaWxlIiwiaXNKc29uRmlsZSIsImlzQ3N2RmlsZSIsImlzVHh0RmlsZSIsImdldEltYWdlcyIsInBhdGhzIiwiZnVuY3MiLCJsb2FkRnVuYyIsImFzeW5jIiwicGFyYWxsZWwiLCJwYXRoIiwiZ2V0SW5kZW50IiwiaW5pdFBvbHlmaWxscyIsImFzc2lnbiIsInZhckFyZ3MiLCJUeXBlRXJyb3IiLCJ0byIsIm5leHRTb3VyY2UiLCJuZXh0S2V5Iiwid3JpdGFibGUiLCJjb25maWd1cmFibGUiLCJTdHJpbmciLCJzdGFydHNXaXRoIiwic2VhcmNoU3RyaW5nIiwicG9zaXRpb24iLCJzdWJzdHIiLCJnZXRVVUlEIiwicmVwbGFjZSIsImMiLCJyIiwiTWF0aCIsInJhbmRvbSIsInYiLCJpc0Jyb3dzZXIiLCJpc1dvcmtlciIsImltcG9ydFNjcmlwdHMiLCJpc0Jyb3dzZXJNYWluIiwiRnVuY3Rpb24iLCJpc0pzRG9tIiwiaXNGaXJlZm94IiwibmF2aWdhdG9yIiwidXNlckFnZW50IiwiZ2V0SUVWZXJzaW9uIiwidWEiLCJtc2llIiwidHJpZGVudCIsInJ2IiwiZWRnZSIsImdldFBhcmFtZXRlckJ5TmFtZSIsImxvY2F0aW9uIiwicmVnZXgiLCJSZWdFeHAiLCJyZXN1bHRzIiwiZXhlYyIsImRlY29kZVVSSUNvbXBvbmVudCIsImdldFJhbmRvbUludCIsIm1pbiIsIm1heCIsImNlaWwiLCJmbG9vciIsImdldFJhbmRvbUludHMiLCJpbnRzIiwiZ2V0VW5pcXVlUmFuZG9tSW50cyIsInJhbmRvbUludCIsImluY2x1ZGVzIiwic2h1ZmZsZSIsImFycmF5IiwidGVtcCIsInNvcnQiLCJiIiwic2FmZVNldCIsImdldEZuIiwic2V0Rm4iLCJjb25maWciLCJlcnJNc2ciLCJjdXJWYWwiLCJyZWNvbmNpbGVkVmFsIiwicmVjb25jaWxlIiwidmFsMSIsInZhbDIiLCJjb21wYXJpc29uIiwicmVzb2x2ZURlZmluZWQiLCJyZXNvbHZlVHJ1ZSIsImFzc2VydCIsImVxdWFsIiwicmVzb2x2ZU1heCIsImRlZXBFcXVhbCIsImt2TGluZSIsImluZGVudCIsIm5ld2xpbmUiLCJpZ25vcmVVbmRlZmluZWQiLCJzdHJpbmdpZnlCaWdJbnRzIiwicHJpbnRTdGFja1RyYWNlIiwiY29uc29sZSIsImVycm9yIiwic3RhY2siLCJ3YWl0Rm9yIiwiZHVyYXRpb25NcyIsIlByb21pc2UiLCJyZXNvbHZlIiwia2lsbFByb2Nlc3MiLCJwcm9jZXNzIiwic2lnbmFsIiwicmVqZWN0Iiwib24iLCJjb2RlIiwia2lsbCIsIm5vcm1hbGl6ZVVyaSIsInVyaSIsImFicyIsImJpIiwiZ2V0RW51bUtleUJ5VmFsdWUiLCJlbnVtVHlwZSIsImVudW1WYWx1ZSIsImV4cG9ydHMiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy9jb21tb24vR2VuVXRpbHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XG5pbXBvcnQgYXN5bmMgZnJvbSBcImFzeW5jXCI7XG5pbXBvcnQgKiBhcyBjc3YgZnJvbSAnanF1ZXJ5LWNzdic7XG5pbXBvcnQgeyBDaGlsZFByb2Nlc3MgfSBmcm9tIFwiY2hpbGRfcHJvY2Vzc1wiO1xuXG4vKipcbiAqIE1JVCBMaWNlbnNlXG4gKiBcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqIFxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICogXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG4gKiBTT0ZUV0FSRS5cbiAqL1xuXG4vKipcbiAqIENvbGxlY3Rpb24gb2YgZ2VuZXJhbCBwdXJwb3NlIHV0aWxpdGllcy5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR2VuVXRpbHMge1xuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgZGVmaW5lZC5cbiAgICogXG4gICAqIEBwYXJhbSB7YW55fSBhcmcgaXMgdGhlIGFyZyB0byB0ZXN0XG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGdpdmVuIGFyZyBpcyBkZWZpbmVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc0RlZmluZWQoYXJnOiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdHlwZW9mIGFyZyAhPT0gJ3VuZGVmaW5lZCc7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBnaXZlbiBhcmd1bWVudCBpcyB1bmRlZmluZWQuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnIGlzIHRoZSBhcmcgdG8gdGVzdFxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBnaXZlbiBhcmcgaXMgdW5kZWZpbmVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc1VuZGVmaW5lZChhcmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBnaXZlbiBhcmcgaXMgaW5pdGlhbGl6ZWQuXG4gICAqIFxuICAgKiBAcGFyYW0ge2FueX0gYXJnIGlzIHRoZSBhcmcgdG8gdGVzdFxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBnaXZlbiBhcmcgaXMgaW5pdGlhbGl6ZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGlzSW5pdGlhbGl6ZWQoYXJnOiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gYXJnICE9PSB1bmRlZmluZWQgJiYgYXJnICE9PSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZ2l2ZW4gYXJnIGlzIHVuaW5pdGlhbGl6ZWQuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnIGlzIHRoZSBhcmcgdG8gdGVzdFxuICAgKiBAcmV0dXJuIHRydWUgaWYgdGhlIGdpdmVuIGFyZyBpcyB1bmluaXRpYWxpemVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc1VuaW5pdGlhbGl6ZWQoYXJnOiBhbnkpOiBib29sZWFuIHtcbiAgICBpZiAoIWFyZykgcmV0dXJuIHRydWU7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYSBudW1iZXIuXG4gICAqIFxuICAgKiBAcGFyYW0ge2FueX0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byB0ZXN0XG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGFyZ3VtZW50IGlzIGEgbnVtYmVyLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc051bWJlcihhcmc6IGFueSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhaXNOYU4ocGFyc2VGbG9hdChhcmcpKSAmJiBpc0Zpbml0ZShhcmcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYW4gaW50ZWdlci5cbiAgICogXG4gICAqIEBwYXJhbSB7YW55fSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIHRlc3RcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYW4gaW50ZWdlciwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaXNJbnQoYXJnOiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gYXJnID09PSBwYXJzZUludChcIlwiICsgTnVtYmVyKGFyZykpICYmICFpc05hTihhcmcpICYmICFpc05hTihwYXJzZUludChhcmcsIDEwKSk7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhbiBhcnJheS5cbiAgICogXG4gICAqIEBwYXJhbSB7YW55fSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIHRlc3QgYXMgYmVpbmcgYW4gYXJyYXlcbiAgICogQHJldHVybiB7Ym9vb2xlYW59IHRydWUgaWYgdGhlIGFyZ3VtZW50IGlzIGFuIGFycmF5LCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc0FycmF5KGFyZzogYW55KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGFyZyBpbnN0YW5jZW9mIEFycmF5ICYmIEFycmF5LmlzQXJyYXkoYXJnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGEgc3RyaW5nLlxuICAgKiBcbiAgICogQHBhcmFtIHthbnl9IGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gdGVzdCBhcyBiZWluZyBhIHN0cmluZ1xuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBhcmd1bWVudCBpcyBhIHN0cmluZywgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaXNTdHJpbmcoYXJnOiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyBpZiB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYSBib29sZWFuLlxuICAgKiBcbiAgICogQHBhcmFtIHthbnl9IGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gdGVzdCBhcyBiZWluZyBhIGJvb2xlYW5cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgYXJndW1lbnQgaXMgYSBib29sZWFuLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc0Jvb2xlYW4oYXJnOiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdHlwZW9mKGFyZykgPT0gdHlwZW9mKHRydWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGEgc3RhdGljLlxuICAgKiBcbiAgICogQHBhcmFtIHthbnl9IGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gdGVzdCBhcyBiZWluZyBhIHN0YXRpY1xuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBhcmd1bWVudCBpcyBhIHN0YXRpYywgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaXNGdW5jdGlvbihhcmc6IGFueSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0eXBlb2YgYXJnID09PSBcImZ1bmN0aW9uXCI7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhbiBvYmplY3QgYW5kIG9wdGlvbmFsbHkgaWYgaXQgaGFzIHRoZSBnaXZlbiBjb25zdHJ1Y3RvciBuYW1lLlxuICAgKiBcbiAgICogQHBhcmFtIHthbnl9IGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gdGVzdFxuICAgKiBAcGFyYW0ge2FueX0gb2JqIGlzIGFuIG9iamVjdCB0byB0ZXN0IGFyZyBpbnN0YW5jZW9mIG9iaiAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGFuIG9iamVjdCBhbmQgb3B0aW9uYWxseSBoYXMgdGhlIGdpdmVuIGNvbnN0cnVjdG9yIG5hbWVcbiAgICovXG4gIHN0YXRpYyBpc09iamVjdChhcmc6IGFueSwgb2JqPzogYW55KTogYm9vbGVhbiB7XG4gICAgaWYgKCFhcmcpIHJldHVybiBmYWxzZTtcbiAgICBpZiAodHlwZW9mIGFyZyAhPT0gJ29iamVjdCcpIHJldHVybiBmYWxzZTtcbiAgICBpZiAob2JqICYmICEoYXJnIGluc3RhbmNlb2Ygb2JqKSkgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgYWxsIGFscGhhYmV0IGNoYXJhY3RlcnMgaW4gdGhlIGdpdmVuIHN0cmluZyBhcmUgdXBwZXIgY2FzZS5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzdHIgaXMgdGhlIHN0cmluZyB0byB0ZXN0XG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIHN0cmluZyBpcyB1cHBlciBjYXNlLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc1VwcGVyQ2FzZShzdHI6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBzdHIudG9VcHBlckNhc2UoKSA9PT0gc3RyO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgYWxsIGFscGhhYmV0IGNoYXJhY3RlcnMgaW4gdGhlIGdpdmVuIHN0cmluZyBhcmUgbG93ZXIgY2FzZS5cbiAgICogXG4gICAqIEBwYXJhbSBzdHIgaXMgdGhlIHN0cmluZyB0byB0ZXN0XG4gICAqIEBwYXJhbSB0cnVlIGlmIHRoZSBzdHJpbmcgaXMgbG93ZXIgY2FzZSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaXNMb3dlckNhc2Uoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci50b0xvd2VyQ2FzZSgpID09PSBzdHI7XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBhcmd1bWVudCBpcyBoZXguXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byBhc3NlcnQgYXMgaGV4XG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgdGhlIGFyZ3VtZW50IGlzIG5vdCBoZXhcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRIZXgoc3RyLCBtc2cpIHtcbiAgICBHZW5VdGlscy5hc3NlcnRUcnVlKEdlblV0aWxzLmlzSGV4KHN0ciksIG1zZyA/IG1zZyA6IFwiQXJndW1lbnQgYXNzZXJ0ZWQgYXMgaGV4IGJ1dCBpcyBub3QgaGV4XCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYSBoZXhpZGVtYWwgc3RyaW5nLlxuICAgKiBcbiAgICogQ3JlZGl0OiBodHRwczovL2dpdGh1Yi5jb20vcm9yeXJqYi9pcy1oZXgvYmxvYi9tYXN0ZXIvaXMtaGV4LmpzLlxuICAgKiBcbiAgICogQHBhcmFtIHN0ciBpcyB0aGUgc3RyaW5nIHRvIHRlc3RcbiAgICogQHJldHVybiB0cnVlIGlmIHRoZSBnaXZlbiBzdHJpbmcgaXMgaGV4aWRlY2ltYWwsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGlzSGV4KGFyZykge1xuICAgIGlmICh0eXBlb2YgYXJnICE9PSAnc3RyaW5nJykgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChhcmcubGVuZ3RoID09PSAwKSByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIChhcmcubWF0Y2goLyhbMC05XXxbYS1mXSkvZ2ltKSB8fCBbXSkubGVuZ3RoID09PSBhcmcubGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgdGhlIGdpdmVuIHN0cmluZyBpcyBiYXNlMzIuXG4gICAqL1xuICBzdGF0aWMgaXNCYXNlMzIoc3RyKSB7XG4gICAgaWYgKHR5cGVvZiBzdHIgIT09ICdzdHJpbmcnKSByZXR1cm4gZmFsc2U7XG4gICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZShzdHIubGVuZ3RoID4gMCwgXCJDYW5ub3QgZGV0ZXJtaW5lIGlmIGVtcHR5IHN0cmluZyBpcyBiYXNlMzJcIik7XG4gICAgcmV0dXJuIC9eW0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaMjM0NTY3XSskLy50ZXN0KHN0cik7XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBhcmd1bWVudCBpcyBiYXNlNTguXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byBhc3NlcnQgYXMgYmFzZTU4XG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgdGhlIGFyZ3VtZW50IGlzIG5vdCBiYXNlNThcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRCYXNlNTgoc3RyLCBtc2cpIHtcbiAgICBHZW5VdGlscy5hc3NlcnRUcnVlKEdlblV0aWxzLmlzQmFzZTU4KHN0ciksIG1zZyA/IG1zZyA6IFwiQXJndW1lbnQgYXNzZXJ0ZWQgYXMgYmFzZTU4IGJ1dCBpcyBub3QgYmFzZTU4XCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgdGhlIGdpdmVuIHN0cmluZyBpcyBiYXNlNTguXG4gICAqL1xuICBzdGF0aWMgaXNCYXNlNTgoc3RyKSB7XG4gICAgaWYgKHR5cGVvZiBzdHIgIT09ICdzdHJpbmcnKSByZXR1cm4gZmFsc2U7XG4gICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZShzdHIubGVuZ3RoID4gMCwgXCJDYW5ub3QgZGV0ZXJtaW5lIGlmIGVtcHR5IHN0cmluZyBpcyBiYXNlNThcIik7XG4gICAgcmV0dXJuIC9eWzEyMzQ1Njc4OUFCQ0RFRkdISktMTU5QUVJTVFVWV1hZWmFiY2RlZmdoaWprbW5vcHFyc3R1dnd4eXpdKyQvLnRlc3Qoc3RyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGJhc2U2NC5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIGFzc2VydCBhcyBiYXNlNjRcbiAgICogQHBhcmFtIG1zZyBpcyB0aGUgbWVzc2FnZSB0byB0aHJvdyBpZiB0aGUgYXJndW1lbnQgaXMgbm90IGJhc2U2NFxuICAgKi9cbiAgc3RhdGljIGFzc2VydEJhc2U2NChzdHIsIG1zZykge1xuICAgIEdlblV0aWxzLmFzc2VydFRydWUoR2VuVXRpbHMuaXNCYXNlNjQoc3RyKSwgbXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBiYXNlNjQgYnV0IGlzIG5vdCBiYXNlNjRcIik7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyBpZiB0aGUgZ2l2ZW4gc3RyaW5nIGlzIGJhc2U2NC5cbiAgICovXG4gIHN0YXRpYyBpc0Jhc2U2NChzdHIpIHtcbiAgICBpZiAodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHJldHVybiBmYWxzZTtcbiAgICBHZW5VdGlscy5hc3NlcnRUcnVlKHN0ci5sZW5ndGggPiAwLCBcIkNhbm5vdCBkZXRlcm1pbmUgaWYgZW1wdHkgc3RyaW5nIGlzIGJhc2U2NFwiKTtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGJ0b2EoYXRvYihzdHIpKSA9PSBzdHI7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRocm93cyBhbiBleGNlcHRpb24gd2l0aCB0aGUgZ2l2ZW4gbWVzc2FnZS5cbiAgICogXG4gICAqIEBwYXJhbSBtc2cgZGVmaW5lcyB0aGUgbWVzc2FnZSB0byB0aHJvdyB0aGUgZXhjZXB0aW9uIHdpdGggKG9wdGlvbmFsKVxuICAgKi9cbiAgc3RhdGljIGZhaWwobXNnPykge1xuICAgIHRocm93IG5ldyBFcnJvcihtc2cgPyBtc2cgOiBcIkZhaWx1cmUgKG5vIG1lc3NhZ2UpXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gY29uZGl0aW9uIGlzIHRydWUuICBUaHJvd3MgYW4gZXhjZXB0aW9uIGlmIG5vdCBhIGJvb2xlYW4gb3IgZmFsc2UuXG4gICAqIFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGNvbmRpdGlvbiBpcyB0aGUgYm9vbGVhbiB0byBhc3NlcnQgdHJ1ZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW21zZ10gaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgY29uZGl0aW9uIGlzIGZhbHNlIChvcHRpb25hbClcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRUcnVlKGNvbmRpdGlvbiwgbXNnPykge1xuICAgIGlmICh0eXBlb2YgY29uZGl0aW9uICE9PSAnYm9vbGVhbicpIHRocm93IG5ldyBFcnJvcihcIkFyZ3VtZW50IGlzIG5vdCBhIGJvb2xlYW5cIik7XG4gICAgaWYgKCFjb25kaXRpb24pIHRocm93IG5ldyBFcnJvcihtc2cgPyBtc2cgOiBcIkJvb2xlYW4gYXNzZXJ0ZWQgYXMgdHJ1ZSBidXQgd2FzIGZhbHNlXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYm9vbGVhbiBpcyBmYWxzZS4gIFRocm93cyBhbiBleGNlcHRpb24gaWYgbm90IGEgYm9vbGVhbiBvciB0cnVlLlxuICAgKiBcbiAgICogQHBhcmFtIGJvb2wgaXMgdGhlIGJvb2xlYW4gdG8gYXNzZXJ0IGZhbHNlXG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgYm9vbCBpcyB0cnVlIChvcHRpb25hbClcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRGYWxzZShib29sLCBtc2c/KSB7XG4gICAgaWYgKHR5cGVvZiBib29sICE9PSAnYm9vbGVhbicpIHRocm93IG5ldyBFcnJvcihcIkFyZ3VtZW50IGlzIG5vdCBhIGJvb2xlYW5cIik7XG4gICAgaWYgKGJvb2wpIHRocm93IG5ldyBFcnJvcihtc2cgPyBtc2cgOiBcIkJvb2xlYW4gYXNzZXJ0ZWQgYXMgZmFsc2UgYnV0IHdhcyB0cnVlXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgbnVsbC4gIFRocm93cyBhbiBleGNlcHRpb24gaWYgbm90IG51bGwuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byBhc3NlcnQgbnVsbFxuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIGFyZyBpcyBub3QgbnVsbCAob3B0aW9uYWwpXG4gICAqL1xuICBzdGF0aWMgYXNzZXJ0TnVsbChhcmcsIG1zZz8pIHtcbiAgICBpZiAoYXJnICE9PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBudWxsIGJ1dCB3YXMgbm90IG51bGw6IFwiICsgYXJnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIG5vdCBudWxsLiAgVGhyb3dzIGFuIGV4Y2VwdGlvbiBpZiBudWxsLlxuICAgKiBcbiAgICogQHBhcmFtIGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gYXNzZXJ0IG5vdCBudWxsXG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgYXJnIGlzIG51bGwgKG9wdGlvbmFsKVxuICAgKi9cbiAgc3RhdGljIGFzc2VydE5vdE51bGwoYXJnLCBtc2c/KSB7XG4gICAgaWYgKGFyZyA9PT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKG1zZyA/IG1zZyA6IFwiQXJndW1lbnQgYXNzZXJ0ZWQgYXMgbm90IG51bGwgYnV0IHdhcyBudWxsXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgZGVmaW5lZC4gIFRocm93cyBhbiBleGNlcHRpb24gaWYgdW5kZWZpbmVkLlxuICAgKiBcbiAgICogQHBhcmFtIGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gYXNzZXJ0IGRlZmluZWRcbiAgICogQHBhcmFtIG1zZyBpcyB0aGUgbWVzc2FnZSB0byB0aHJvdyBpZiBhcmcgaXMgdW5kZWZpbmVkIChvcHRpb25hbClcbiAgICovXG4gIHN0YXRpYyBhc3NlcnREZWZpbmVkKGFyZywgbXNnPykge1xuICAgIGlmIChHZW5VdGlscy5pc1VuZGVmaW5lZChhcmcpKSB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBkZWZpbmVkIGJ1dCB3YXMgdW5kZWZpbmVkXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgdW5kZWZpbmVkLiAgVGhyb3dzIGFuIGV4Y2VwdGlvbiBpZiBkZWZpbmVkLlxuICAgKiBcbiAgICogQHBhcmFtIGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gYXNzZXJ0IHVuZGVmaW5lZFxuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIGFyZyBpcyBkZWZpbmVkIChvcHRpb25hbClcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRVbmRlZmluZWQoYXJnLCBtc2c/KSB7XG4gICAgaWYgKEdlblV0aWxzLmlzRGVmaW5lZChhcmcpKSB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyB1bmRlZmluZWQgYnV0IHdhcyBkZWZpbmVkOiBcIiArIGFyZyk7XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBhcmd1bWVudCBpcyBpbml0aWFsaXplZC4gIFRocm93cyBhbiBleGNlcHRpb24gaWYgbm90IGluaXRpYWxpemVkLlxuICAgKiBcbiAgICogQHBhcmFtIGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gYXNzZXJ0IGFzIGluaXRpYWxpemVkXG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgYXJnIGlzIG5vdCBpbml0aWFsaXplZCAob3B0aW9uYWwpXG4gICAqL1xuICBzdGF0aWMgYXNzZXJ0SW5pdGlhbGl6ZWQoYXJnLCBtc2c/KSB7XG4gICAgaWYgKEdlblV0aWxzLmlzVW5pbml0aWFsaXplZChhcmcpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBpbml0aWFsaXplZCBidXQgd2FzIFwiICsgYXJnKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBhcmd1bWVudCBpcyB1bmluaXRpYWxpemVkLiAgVGhyb3dzIGFuIGV4Y2VwdGlvbiBpZiBpbml0aWFsaXplZC5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIGFzc2VydCBhcyB1bmluaXRpYWxpemVkXG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgYXJnIGlzIGluaXRpYWxpemVkIChvcHRpb25hbClcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRVbmluaXRpYWxpemVkKGFyZywgbXNnPykge1xuICAgIGlmIChHZW5VdGlscy5pc0luaXRpYWxpemVkKGFyZykpIHRocm93IG5ldyBFcnJvcihtc2cgPyBtc2cgOiBcIkFyZ3VtZW50IGFzc2VydGVkIGFzIHVuaW5pdGlhbGl6ZWQgYnV0IHdhcyBpbml0aWFsaXplZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIGdpdmVuIGFyZ3VtZW50cyBhcmUgZXF1YWwuICBUaHJvd3MgYW4gZXhjZXB0aW9uIGlmIG5vdCBlcXVhbC5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcxIGlzIGFuIGFyZ3VtZW50IHRvIGFzc2VydCBhcyBlcXVhbFxuICAgKiBAcGFyYW0gYXJnMiBpcyBhbiBhcmd1bWVudCB0byBhc3NlcnQgYXMgZXF1YWxcbiAgICogQHBhcmFtIG1zZyBpcyB0aGUgbWVzc2FnZSB0byB0aHJvdyBpZiB0aGUgYXJndW1lbnRzIGFyZSBub3QgZXF1YWxcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRFcXVhbHMoYXJnMSwgYXJnMiwgbXNnPykge1xuICAgIEdlblV0aWxzLmFzc2VydFRydWUoR2VuVXRpbHMuZXF1YWxzKGFyZzEsIGFyZzIpLCBtc2cgPyBtc2cgOiBcIkFyZ3VtZW50cyBhc3NlcnRlZCBhcyBlcXVhbCBidXQgYXJlIG5vdCBlcXVhbDogXCIgKyBhcmcxICsgXCIgdnMgXCIgKyBhcmcyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIGdpdmVuIGFyZ3VtZW50cyBhcmUgbm90IGVxdWFsLiAgVGhyb3dzIGFuIGV4Y2VwdGlvbiBpZiBlcXVhbC5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcxIGlzIGFuIGFyZ3VtZW50IHRvIGFzc2VydCBhcyBub3QgZXF1YWxcbiAgICogQHBhcmFtIGFyZzIgaXMgYW4gYXJndW1lbnQgdG8gYXNzZXJ0IGFzIG5vdCBlcXVhbFxuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIHRoZSBhcmd1bWVudHMgYXJlIGVxdWFsXG4gICAqL1xuICBzdGF0aWMgYXNzZXJ0Tm90RXF1YWxzKGFyZzEsIGFyZzIsIG1zZz8pIHtcbiAgICBpZiAoYXJnMSA9PT0gYXJnMikgdGhyb3cgbmV3IEVycm9yKG1zZyA/IG1zZyA6IFwiQXJndW1lbnRzIGFzc2VydGVkIGFzIG5vdCBlcXVhbCBidXQgYXJlIGVxdWFsOiBcIiArIGFyZzEgKyBcIiB2cyBcIiArIGFyZzIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYW4gaW50ZWdlci5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIGFzc2VydCBhcyBhbiBpbnRlZ2VyXG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgdGhlIGFyZ3VtZW50IGlzIG5vdCBhbiBpbnRlZ2VyXG4gICAqL1xuICBzdGF0aWMgYXNzZXJ0SW50KGFyZywgbXNnPykge1xuICAgIGlmICghR2VuVXRpbHMuaXNJbnQoYXJnKSkgdGhyb3cgbmV3IEVycm9yKG1zZyA/IG1zZyA6IFwiQXJndW1lbnQgYXNzZXJ0ZWQgYXMgYW4gaW50ZWdlciBidXQgaXMgbm90IGFuIGludGVnZXJcIik7XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhIG51bWJlci5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIGFzc2VydCBhcyBhIG51bWJlclxuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIHRoZSBhcmd1bWVudCBpcyBub3QgYSBudW1iZXJcbiAgICovXG4gIHN0YXRpYyBhc3NlcnROdW1iZXIoYXJnLCBtc2c/KSB7XG4gICAgaWYgKCFHZW5VdGlscy5pc051bWJlcihhcmcpKSB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBhIG51bWJlciBidXQgaXMgbm90IGEgbnVtYmVyXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYSBib29sZWFuLlxuICAgKiBcbiAgICogQHBhcmFtIGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gYXNzZXJ0IGFzIGEgYm9vbGVhblxuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIHRoZSBhcmd1bWVudCBpcyBub3QgYSBib29sZWFuXG4gICAqL1xuICBzdGF0aWMgYXNzZXJ0Qm9vbGVhbihhcmcsIG1zZz8pIHtcbiAgICBpZiAoIUdlblV0aWxzLmlzQm9vbGVhbihhcmcpKSB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBhIGJvb2xlYW4gYnV0IGlzIG5vdCBhIGJvb2xlYW5cIik7XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhIHN0cmluZy5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIGFzc2VydCBhcyBhIHN0cmluZ1xuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIHRoZSBhcmd1bWVudCBpcyBub3QgYSBzdHJpbmdcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRTdHJpbmcoYXJnLCBtc2c/KSB7XG4gICAgaWYgKCFHZW5VdGlscy5pc1N0cmluZyhhcmcpKSB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBhIHN0cmluZyBidXQgaXMgbm90IGEgc3RyaW5nOiBcIiArIGFyZyk7XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhbiBhcnJheS5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIGFzc2VydCBhcyBhbiBhcnJheVxuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIHRoZSBhcmd1bWVudCBpcyBub3QgYW4gYXJyYXlcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRBcnJheShhcmcsIG1zZz8pIHtcbiAgICBpZiAoIUdlblV0aWxzLmlzQXJyYXkoYXJnKSkgdGhyb3cgbmV3IEVycm9yKG1zZyA/IG1zZyA6IFwiQXJndW1lbnQgYXNzZXJ0ZWQgYXMgYW4gYXJyYXkgYnV0IGlzIG5vdCBhbiBhcnJheVwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGEgc3RhdGljLlxuICAgKiBcbiAgICogQHBhcmFtIGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gYXNzZXJ0IGFzIGEgc3RhdGljXG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgdGhlIGFyZ3VtZW50IGlzIG5vdCBhIHN0YXRpY1xuICAgKi9cbiAgc3RhdGljIGFzc2VydEZ1bmN0aW9uKGFyZywgbXNnPykge1xuICAgIGlmICghR2VuVXRpbHMuaXNGdW5jdGlvbihhcmcpKSB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBhIHN0YXRpYyBidXQgaXMgbm90IGEgc3RhdGljXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYW4gb2JqZWN0IHdpdGggdGhlIGdpdmVuIG5hbWUuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byB0ZXN0XG4gICAqIEBwYXJhbSBvYmogaXMgYW4gb2JqZWN0IHRvIGFzc2VydCBhcmcgaW5zdGFuY2VvZiBvYmogKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIHRoZSBhcmd1bWVudCBpcyBub3QgdGhlIHNwZWNpZmllZCBvYmplY3RcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRPYmplY3QoYXJnLCBvYmosIG1zZz8pIHtcbiAgICBHZW5VdGlscy5hc3NlcnRJbml0aWFsaXplZChhcmcsIG1zZyk7XG4gICAgaWYgKG9iaikge1xuICAgICAgaWYgKCFHZW5VdGlscy5pc09iamVjdChhcmcsIG9iaikpIHRocm93IG5ldyBFcnJvcihtc2cgPyBtc2cgOiBcIkFyZ3VtZW50IGFzc2VydGVkIGFzIG9iamVjdCAnXCIgKyBvYmoubmFtZSArIFwiJyBidXQgd2FzIG5vdFwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKCFHZW5VdGlscy5pc09iamVjdChhcmcpKSB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBvYmplY3QgYnV0IHdhcyBub3RcIik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGNoaWxkJ3MgcHJvdG90eXBlIHRvIHRoZSBwYXJlbnQncyBwcm90b3R5cGUuXG4gICAqIFxuICAgKiBAcGFyYW0gY2hpbGQgaXMgdGhlIGNoaWxkIGNsYXNzXG4gICAqIEBwYXJhbSBwYXJlbnQgaXMgdGhlIHBhcmVudCBjbGFzc1xuICAgKi9cbiAgc3RhdGljIGluaGVyaXRzRnJvbShjaGlsZCwgcGFyZW50KSB7XG4gICAgY2hpbGQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShwYXJlbnQucHJvdG90eXBlKTtcbiAgICBjaGlsZC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjaGlsZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnZva2VzIGZ1bmN0aW9ucyB3aXRoIGFyZ3VtZW50cy5cbiAgICogXG4gICAqIGFyZ3VtZW50c1swXSBpcyBhc3N1bWVkIHRvIGJlIGFuIGFycmF5IG9mIGZ1bmN0aW9ucyB0byBpbnZva2VcbiAgICogYXJndW1lbnRzWzEuLi5uXSBhcmUgYXJncyB0byBpbnZva2UgdGhlIGZ1bmN0aW9ucyB3aXRoXG4gICAqL1xuICBzdGF0aWMgaW52b2tlKCkge1xuICAgIGxldCBmbnMgPSBhcmd1bWVudHNbMF07XG4gICAgbGV0IGFyZ3MgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgYXJncy5wdXNoKGFyZ3VtZW50c1tpXSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIEdlblV0aWxzLmFzc2VydEZ1bmN0aW9uKGZuc1tpXSwgXCJGdW5jdGlvbnNbXCIgKyBpICsgXCJdIGlzIG5vdCBhIHN0YXRpY1wiKTtcbiAgICAgIGZuc1tpXS5hcHBseShudWxsLCBhcmdzKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgcG93ZXIgc2V0IG9mIHRoZSBnaXZlbiBhcnJheS5cbiAgICogXG4gICAqIEBwYXJhbSBhcnIgaXMgdGhlIGFycmF5IHRvIGdldCB0aGUgcG93ZXIgc2V0IG9mXG4gICAqIEByZXR1cm4gW11bXSBpcyB0aGUgcG93ZXIgc2V0IG9mIHRoZSBnaXZlbiBhcnJheVxuICAgKi9cbiAgc3RhdGljIGdldFBvd2VyU2V0KGFycikge1xuICAgIGxldCBmbiA9IGZ1bmN0aW9uKG4sIHNyYywgZ290LCBhbGwpIHtcbiAgICAgIGlmIChuID09IDApIHtcbiAgICAgICAgaWYgKGdvdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgYWxsW2FsbC5sZW5ndGhdID0gZ290O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgc3JjLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGZuKG4gLSAxLCBzcmMuc2xpY2UoaiArIDEpLCBnb3QuY29uY2F0KFsgc3JjW2pdIF0pLCBhbGwpO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgYWxsID0gW107XG4gICAgYWxsLnB1c2goW10pO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgICBmbihpLCBhcnIsIFtdLCBhbGwpO1xuICAgIH1cbiAgICBhbGwucHVzaChhcnIpO1xuICAgIHJldHVybiBhbGw7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgcG93ZXIgc2V0IG9mIHRoZSBnaXZlbiBhcnJheSB3aG9zZSBlbGVtZW50cyBhcmUgdGhlIGdpdmVuIHNpemUuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJyIGlzIHRoZSBhcnJheSB0byBnZXQgdGhlIHBvd2VyIHNldCBvZlxuICAgKiBAcGFyYW0gc2l6ZSBpcyB0aGUgcmVxdWlyZWQgc2l6ZSBvZiB0aGUgZWxlbWVudHMgd2l0aGluIHRoZSBwb3dlciBzZXRcbiAgICogcmV0dXJucyBbXVtdIGlzIHRoZSBwb3dlciBzZXQgb2YgdGhlIGdpdmVuIGFycmF5IHdob3NlIGVsZW1lbnRzIGFyZSB0aGUgZ2l2ZW4gc2l6ZSBcbiAgICovXG4gIHN0YXRpYyBnZXRQb3dlclNldE9mTGVuZ3RoKGFyciwgc2l6ZSkge1xuICAgIEdlblV0aWxzLmFzc2VydEluaXRpYWxpemVkKGFycik7XG4gICAgR2VuVXRpbHMuYXNzZXJ0SW5pdGlhbGl6ZWQoc2l6ZSk7XG4gICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZShzaXplID49IDEpO1xuICAgIGxldCBwb3dlclNldCA9IEdlblV0aWxzLmdldFBvd2VyU2V0KGFycik7XG4gICAgbGV0IHBvd2VyU2V0T2ZMZW5ndGggPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBvd2VyU2V0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAocG93ZXJTZXRbaV0ubGVuZ3RoID09PSBzaXplKSB7XG4gICAgICAgIHBvd2VyU2V0T2ZMZW5ndGgucHVzaChwb3dlclNldFtpXSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwb3dlclNldE9mTGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gYXJyYXkgb2YgaW5kaWNlcyBvZiB0aGUgZ2l2ZW4gc2l6ZS5cbiAgICogXG4gICAqIEBwYXJhbSBzaXplIHNwZWNpZmllcyB0aGUgc2l6ZSB0byBnZXQgaW5kaWNlcyBmb3JcbiAgICogQHJldHVybiBhcnJheSBvZiB0aGUgZ2l2ZW4gc2l6ZSB3aXRoIGluZGljZXMgc3RhcnRpbmcgYXQgMFxuICAgKi9cbiAgc3RhdGljIGdldEluZGljZXMoc2l6ZSkge1xuICAgIGxldCBpbmRpY2VzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgIGluZGljZXMucHVzaChpKTtcbiAgICB9XG4gICAgcmV0dXJuIGluZGljZXM7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIG5ldyBhcnJheSBjb250YWluaW5nIHVuaXF1ZSBlbGVtZW50cyBvZiB0aGUgZ2l2ZW4gYXJyYXkuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJyIGlzIHRoZSBhcnJheSB0byByZXR1cm4gdW5pcXVlIGVsZW1lbnRzIGZyb21cbiAgICogQHJldHVybiBhIG5ldyBhcnJheSB3aXRoIHRoZSBnaXZlbiBhcnJheSdzIHVuaXF1ZSBlbGVtZW50c1xuICAgKi9cbiAgc3RhdGljIHRvVW5pcXVlQXJyYXkoYXJyKSB7XG4gICAgcmV0dXJuIGFyci5maWx0ZXIoZnVuY3Rpb24odmFsdWUsIGluZGV4LCBzZWxmKSB7XG4gICAgICByZXR1cm4gc2VsZi5pbmRleE9mKHZhbHVlKSA9PT0gaW5kZXg7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ29waWVzIHRoZSBnaXZlbiBhcnJheS5cbiAgICogXG4gICAqIEBwYXJhbSBhcnIgaXMgdGhlIGFycmF5IHRvIGNvcHlcbiAgICogQHJldHVybiBhIGNvcHkgb2YgdGhlIGdpdmVuIGFycmF5XG4gICAqL1xuICBzdGF0aWMgY29weUFycmF5KGFycikge1xuICAgIEdlblV0aWxzLmFzc2VydEFycmF5KGFycik7XG4gICAgbGV0IGNvcHkgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykgY29weS5wdXNoKGFycltpXSk7XG4gICAgcmV0dXJuIGNvcHk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZW1vdmVzIGV2ZXJ5IGluc3RhbmNlIG9mIHRoZSBnaXZlbiB2YWx1ZSBmcm9tIHRoZSBnaXZlbiBhcnJheS5cbiAgICogXG4gICAqIEBwYXJhbSBhcnIgaXMgdGhlIGFycmF5IHRvIHJlbW92ZSB0aGUgdmFsdWUgZnJvbVxuICAgKiBAcGFyYW0gdmFsIGlzIHRoZSB2YWx1ZSB0byByZW1vdmUgZnJvbSB0aGUgYXJyYXlcbiAgICogQHJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBpcyBmb3VuZCBhbmQgcmVtb3ZlZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgcmVtb3ZlKGFyciwgdmFsKSB7XG4gICAgbGV0IGZvdW5kID0gZmFsc2U7XG4gICAgZm9yIChsZXQgaSA9IGFyci5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgaWYgKGFycltpXSA9PT0gdmFsKSB7XG4gICAgICAgIGFyci5zcGxpY2UoaSwgMSk7XG4gICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgaS0tO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZm91bmQ7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGNvcHkgb2YgdGhlIGdpdmVuIGFycmF5IHdoZXJlIGVhY2ggZWxlbWVudCBpcyBsb3dlcmNhc2UuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJyIGlzIHRoZSBhcnJheSB0byBjb252ZXJ0IHRvIGxvd2VyY2FzZVxuICAgKiBAcmV0dXJuIGEgY29weSBvZiB0aGUgZ2l2ZW4gYXJyYXkgd2hlcmUgZWFjaCBlbGVtZW50IGlzIGxvd2VyY2FzZVxuICAgKi9cbiAgc3RhdGljIHRvTG93ZXJDYXNlQXJyYXkoYXJyKSB7XG4gICAgbGV0IGFycjIgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgYXJyMi5wdXNoKGFycltpXS50b0xvd2VyQ2FzZSgpKTtcbiAgICB9XG4gICAgcmV0dXJuIGFycjI7XG4gIH1cblxuICAvKipcbiAgICogTGlzdGlmaWVzIHRoZSBnaXZlbiBhcmd1bWVudC5cbiAgICogXG4gICAqIEBwYXJhbSBhcnJPckVsZW0gaXMgYW4gYXJyYXkgb3IgYW4gZWxlbWVudCBpbiB0aGUgYXJyYXlcbiAgICogQHJldHVybiBhbiBhcnJheSB3aGljaCBpcyB0aGUgZ2l2ZW4gYXJnIGlmIGl0J3MgYW4gYXJyYXkgb3IgYW4gYXJyYXkgd2l0aCB0aGUgZ2l2ZW4gYXJnIGFzIGFuIGVsZW1lbnRcbiAgICovXG4gIHN0YXRpYyBsaXN0aWZ5KGFyck9yRWxlbSkge1xuICAgIHJldHVybiBHZW5VdGlscy5pc0FycmF5KGFyck9yRWxlbSkgPyBhcnJPckVsZW0gOiBbYXJyT3JFbGVtXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGdpdmVuIGFycmF5IGNvbnRhaW5zIHRoZSBnaXZlbiBvYmplY3QuXG4gICAqIFxuICAgKiBAcGFyYW0ge2FueX0gYXJyIC0gYXJyYXkgdGhhdCBtYXkgb3IgbWF5IG5vdCBjb250YWluIHRoZSBvYmplY3RcbiAgICogQHBhcmFtIHthbnl9IG9iaiAtIG9iamVjdCB0byBjaGVjayBmb3IgaW5jbHVzaW9uIGluIHRoZSBhcnJheVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb21wYXJlQnlSZWZlcmVuY2VdIC0gY29tcGFyZSBzdHJpY3RseSBieSByZWZlcmVuY2UsIGZvcmdvaW5nIGRlZXAgZXF1YWxpdHkgY2hlY2sgKGRlZmF1bHQgZmFsc2UpXG4gICAqIEByZXR1cm4gdHJ1ZSBpZiB0aGUgYXJyYXkgY29udGFpbnMgdGhlIG9iamVjdCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgYXJyYXlDb250YWlucyhhcnIsIG9iaiwgY29tcGFyZUJ5UmVmZXJlbmNlID0gZmFsc2UpIHtcbiAgICBHZW5VdGlscy5hc3NlcnRUcnVlKEdlblV0aWxzLmlzQXJyYXkoYXJyKSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhcnJbaV0gPT09IG9iaikgcmV0dXJuIHRydWU7XG4gICAgICBpZiAoIWNvbXBhcmVCeVJlZmVyZW5jZSAmJiBHZW5VdGlscy5lcXVhbHMoYXJyW2ldLCBvYmopKSByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZ2l2ZW4gc3RyaW5nIGNvbnRhaW5zIHRoZSBnaXZlbiBzdWJzdHJpbmcuXG4gICAqIFxuICAgKiBAcGFyYW0gc3RyIGlzIHRoZSBzdHJpbmcgdG8gc2VhcmNoIGZvciBhIHN1YnN0cmluZ1xuICAgKiBAcGFyYW0gc3Vic3RyaW5nIGlzIHRoZSBzdWJzdHJpbmcgdG8gc2VhcmNoaW4gd2l0aGluIHRoZSBzdHJpbmdcbiAgICogQHJldHVybiB0cnVlIGlmIHRoZSBzdWJzdHJpbmcgaXMgd2l0aGluIHRoZSBzdHJpbmcsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIHN0ckNvbnRhaW5zKHN0ciwgc3Vic3RyaW5nKSB7XG4gICAgcmV0dXJuIHN0ci5pbmRleE9mKHN1YnN0cmluZykgPiAtMTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIGlmIHR3byBhcnJheXMgYXJlIGVxdWFsLlxuICAgKiBcbiAgICogQHBhcmFtIGFycjEgaXMgYW4gYXJyYXkgdG8gY29tcGFyZVxuICAgKiBAcGFyYW0gYXJyMiBpcyBhbiBhcnJheSB0byBjb21wYXJlXG4gICAqIEByZXR1cm4gdHJ1ZSBpZiB0aGUgYXJyYXlzIGFyZSBlcXVhbCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgYXJyYXlzRXF1YWwoYXJyMSwgYXJyMikge1xuICAgIGlmIChhcnIxID09PSBhcnIyKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoYXJyMSA9PSBudWxsICYmIGFycjIgPT0gbnVsbCkgcmV0dXJuIHRydWU7XG4gICAgaWYgKGFycjEgPT0gbnVsbCB8fCBhcnIyID09IG51bGwpIHJldHVybiBmYWxzZTtcbiAgICBpZiAodHlwZW9mIGFycjEgPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBhcnIyID09PSAndW5kZWZpbmVkJykgcmV0dXJuIHRydWU7XG4gICAgaWYgKHR5cGVvZiBhcnIxID09PSAndW5kZWZpbmVkJyB8fCB0eXBlb2YgYXJyMiA9PT0gJ3VuZGVmaW5lZCcpIHJldHVybiBmYWxzZTtcbiAgICBpZiAoIUdlblV0aWxzLmlzQXJyYXkoYXJyMSkpIHRocm93IG5ldyBFcnJvcihcIkZpcnN0IGFyZ3VtZW50IGlzIG5vdCBhbiBhcnJheVwiKTtcbiAgICBpZiAoIUdlblV0aWxzLmlzQXJyYXkoYXJyMikpIHRocm93IG5ldyBFcnJvcihcIlNlY29uZCBhcmd1bWVudCBpcyBub3QgYW4gYXJyYXlcIik7XG4gICAgaWYgKGFycjEubGVuZ3RoICE9IGFycjIubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnIxLmxlbmd0aDsgKytpKSB7XG4gICAgICBpZiAoIUdlblV0aWxzLmVxdWFscyhhcnIxW2ldLCBhcnIyW2ldKSkgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIGlmIHR3byBhcmd1bWVudHMgYXJlIGRlZXAgZXF1YWwuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnMSBpcyBhbiBhcmd1bWVudCB0byBjb21wYXJlXG4gICAqIEBwYXJhbSBhcmcyIGlzIGFuIGFyZ3VtZW50IHRvIGNvbXBhcmVcbiAgICogQHJldHVybiB0cnVlIGlmIHRoZSBhcmd1bWVudHMgYXJlIGRlZXAgZXF1YWxzLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBlcXVhbHMoYXJnMSwgYXJnMikge1xuICAgIGlmIChHZW5VdGlscy5pc0FycmF5KGFyZzEpICYmIEdlblV0aWxzLmlzQXJyYXkoYXJnMikpIHJldHVybiBHZW5VdGlscy5hcnJheXNFcXVhbChhcmcxLCBhcmcyKTtcbiAgICBpZiAoR2VuVXRpbHMuaXNPYmplY3QoYXJnMSkgJiYgR2VuVXRpbHMuaXNPYmplY3QoYXJnMikpIHJldHVybiBHZW5VdGlscy5vYmplY3RzRXF1YWwoYXJnMSwgYXJnMik7XG4gICAgcmV0dXJuIGFyZzEgPT09IGFyZzI7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIGlmIHR3byBvYmplY3RzIGFyZSBkZWVwIGVxdWFsLlxuICAgKiBcbiAgICogVW5kZWZpbmVkIHZhbHVlcyBhcmUgY29uc2lkZXJlZCBlcXVhbCB0byBub24tZXhpc3RlbnQga2V5cy5cbiAgICogXG4gICAqIEBwYXJhbSBtYXAxIGlzIGEgbWFwIHRvIGNvbXBhcmVcbiAgICogQHBhcmFtIG1hcDIgaXMgYSBtYXAgdG8gY29tcGFyZVxuICAgKiBAcmV0dXJuIHRydWUgaWYgdGhlIG1hcHMgaGF2ZSBpZGVudGljYWwga2V5cyBhbmQgdmFsdWVzLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBvYmplY3RzRXF1YWwobWFwMSwgbWFwMikge1xuICAgIGxldCBrZXlzMSA9IE9iamVjdC5rZXlzKG1hcDEpO1xuICAgIGxldCBrZXlzMiA9IE9iamVjdC5rZXlzKG1hcDIpO1xuICAgIFxuICAgIC8vIGNvbXBhcmUgZWFjaCBrZXkxIHRvIGtleXMyXG4gICAgZm9yIChsZXQga2V5MSBvZiBrZXlzMSkge1xuICAgICAgbGV0IGZvdW5kID0gZmFsc2U7XG4gICAgICBmb3IgKGxldCBrZXkyIG9mIGtleXMyKSB7XG4gICAgICAgIGlmIChrZXkxID09PSBrZXkyKSB7XG4gICAgICAgICAgaWYgKCFHZW5VdGlscy5lcXVhbHMobWFwMVtrZXkxXSwgbWFwMltrZXkyXSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICghZm91bmQgJiYgbWFwMVtrZXkxXSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gZmFsc2U7IC8vIGFsbG93cyB1bmRlZmluZWQgdmFsdWVzIHRvIGVxdWFsIG5vbi1leGlzdGVudCBrZXlzXG4gICAgfVxuICAgIFxuICAgIC8vIGNvbXBhcmUgZWFjaCBrZXkyIHRvIGtleXMxXG4gICAgZm9yIChsZXQga2V5MiBvZiBrZXlzMikge1xuICAgICAgbGV0IGZvdW5kID0gZmFsc2U7XG4gICAgICBmb3IgKGxldCBrZXkxIG9mIGtleXMxKSB7XG4gICAgICAgIGlmIChrZXkxID09PSBrZXkyKSB7XG4gICAgICAgICAgZm91bmQgPSB0cnVlOyAvLyBubyBuZWVkIHRvIHJlLWNvbXBhcmUgd2hpY2ggd2FzIGRvbmUgZWFybGllclxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoIWZvdW5kICYmIG1hcDJba2V5Ml0gIT09IHVuZGVmaW5lZCkgcmV0dXJuIGZhbHNlOyAvLyBhbGxvd3MgdW5kZWZpbmVkIHZhbHVlcyB0byBlcXVhbCBub24tZXhpc3RlbnQga2V5c1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgICBcbiAgICAvLyBUT0RPOiBzdXBwb3J0IHN0cmljdCBvcHRpb24/XG4vLyAgICBpZiAoc3RyaWN0KSB7XG4vLyAgICAgIGxldCBrZXlzMSA9IE9iamVjdC5rZXlzKG1hcDEpO1xuLy8gICAgICBpZiAoa2V5czEubGVuZ3RoICE9PSBPYmplY3Qua2V5cyhtYXAyKS5sZW5ndGgpIHJldHVybiBmYWxzZTtcbi8vICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzMS5sZW5ndGg7IGkrKykge1xuLy8gICAgICAgIGxldCBrZXkgPSBPYmplY3Qua2V5cyhtYXAxKVtpXTtcbi8vICAgICAgICBpZiAoIUdlblV0aWxzLmVxdWFscyhtYXAxW2tleV0sIG1hcDJba2V5XSkpIHJldHVybiBmYWxzZTtcbi8vICAgICAgfVxuLy8gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogRGVsZXRlcyBwcm9wZXJ0aWVzIGZyb20gdGhlIG9iamVjdCB0aGF0IGFyZSB1bmRlZmluZWQuXG4gICAqIFxuICAgKiBAcGFyYW0gb2JqIGlzIHRoZSBvYmplY3QgdG8gZGVsZXRlIHVuZGVmaW5lZCBrZXlzIGZyb21cbiAgICovXG4gIHN0YXRpYyBkZWxldGVVbmRlZmluZWRLZXlzKG9iaikge1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhvYmopKSB7XG4gICAgICBpZiAob2JqW2tleV0gPT09IHVuZGVmaW5lZCkgZGVsZXRlIG9ialtrZXldO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGNvbWJpbmF0aW9ucyBvZiB0aGUgZ2l2ZW4gYXJyYXkgb2YgdGhlIGdpdmVuIHNpemUuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJyIGlzIHRoZSBhcnJheSB0byBnZXQgY29tYmluYXRpb25zIGZyb21cbiAgICogQHBhcmFtIGNvbWJpbmF0aW9uU2l6ZSBzcGVjaWZpZXMgdGhlIHNpemUgb2YgZWFjaCBjb21iaW5hdGlvblxuICAgKi9cbiAgc3RhdGljIGdldENvbWJpbmF0aW9ucyhhcnIsIGNvbWJpbmF0aW9uU2l6ZSkge1xuICAgIFxuICAgIC8vIHZhbGlkYXRlIGlucHV0XG4gICAgR2VuVXRpbHMuYXNzZXJ0SW5pdGlhbGl6ZWQoYXJyKTtcbiAgICBHZW5VdGlscy5hc3NlcnRJbml0aWFsaXplZChjb21iaW5hdGlvblNpemUpO1xuICAgIEdlblV0aWxzLmFzc2VydFRydWUoY29tYmluYXRpb25TaXplID49IDEpO1xuICAgIFxuICAgIC8vIGdldCBjb21iaW5hdGlvbnMgb2YgYXJyYXkgaW5kaWNlcyBvZiB0aGUgZ2l2ZW4gc2l6ZVxuICAgIGxldCBpbmRleENvbWJpbmF0aW9ucyA9IEdlblV0aWxzLmdldFBvd2VyU2V0T2ZMZW5ndGgoR2VuVXRpbHMuZ2V0SW5kaWNlcyhhcnIubGVuZ3RoKSwgY29tYmluYXRpb25TaXplKTtcbiAgICBcbiAgICAvLyBjb2xsZWN0IGNvbWJpbmF0aW9ucyBmcm9tIGVhY2ggY29tYmluYXRpb24gb2YgYXJyYXkgaW5kaWNlc1xuICAgIGxldCBjb21iaW5hdGlvbnMgPSBbXTtcbiAgICBmb3IgKGxldCBpbmRleENvbWJpbmF0aW9uc0lkeCA9IDA7IGluZGV4Q29tYmluYXRpb25zSWR4IDwgaW5kZXhDb21iaW5hdGlvbnMubGVuZ3RoOyBpbmRleENvbWJpbmF0aW9uc0lkeCsrKSB7XG4gICAgICBcbiAgICAgIC8vIGdldCBjb21iaW5hdGlvbiBvZiBhcnJheSBpbmRpY2VzXG4gICAgICBsZXQgaW5kZXhDb21iaW5hdGlvbiA9IGluZGV4Q29tYmluYXRpb25zW2luZGV4Q29tYmluYXRpb25zSWR4XTtcbiAgICAgIFxuICAgICAgLy8gYnVpbGQgY29tYmluYXRpb24gZnJvbSBhcnJheVxuICAgICAgbGV0IGNvbWJpbmF0aW9uID0gW107XG4gICAgICBmb3IgKGxldCBpbmRleENvbWJpbmF0aW9uSWR4ID0gMDsgaW5kZXhDb21iaW5hdGlvbklkeCA8IGluZGV4Q29tYmluYXRpb24ubGVuZ3RoOyBpbmRleENvbWJpbmF0aW9uSWR4KyspIHtcbiAgICAgICAgY29tYmluYXRpb24ucHVzaChhcnJbaW5kZXhDb21iaW5hdGlvbltpbmRleENvbWJpbmF0aW9uSWR4XV0pO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBhZGQgdG8gY29tYmluYXRpb25zXG4gICAgICBjb21iaW5hdGlvbnMucHVzaChjb21iaW5hdGlvbik7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBjb21iaW5hdGlvbnM7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhbiAnYScgZWxlbWVudCB0aGF0IGlzIGRvd25sb2FkYWJsZSB3aGVuIGNsaWNrZWQuXG4gICAqIFxuICAgKiBAcGFyYW0gbmFtZSBpcyB0aGUgbmFtZSBvZiB0aGUgZmlsZSB0byBkb3dubG9hZFxuICAgKiBAcGFyYW0gY29udGVudHMgYXJlIHRoZSBzdHJpbmcgY29udGVudHMgb2YgdGhlIGZpbGUgdG8gZG93bmxvYWRcbiAgICogQHJldHVybiAnYScgZG9tIGVsZW1lbnQgd2l0aCBkb3dubG9hZGFibGUgZmlsZVxuICAgKi9cbiAgc3RhdGljIGdldERvd25sb2FkYWJsZUEobmFtZSwgY29udGVudHMpIHtcbiAgICBsZXQgYSA9IHdpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgYS5ocmVmID0gd2luZG93LlVSTC5jcmVhdGVPYmplY3RVUkwobmV3IEJsb2IoW2NvbnRlbnRzXSwge3R5cGU6ICd0ZXh0L3BsYWluJ30pKTtcbiAgICBhLmRvd25sb2FkID0gbmFtZTtcbiAgICBhLnRhcmdldD1cIl9ibGFua1wiO1xuICAgIGEuaW5uZXJIVE1MID0gbmFtZTtcbiAgICByZXR1cm4gYTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb3BpZXMgcHJvcGVydGllcyBpbiB0aGUgZ2l2ZW4gb2JqZWN0IHRvIGEgbmV3IG9iamVjdC5cbiAgICogXG4gICAqIEBwYXJhbSBvYmogaXMgb2JqZWN0IHRvIGNvcHkgcHJvcGVydGllcyBmb3JcbiAgICogQHJldHVybiBhIG5ldyBvYmplY3Qgd2l0aCBwcm9wZXJ0aWVzIGNvcGllZCBmcm9tIHRoZSBnaXZlbiBvYmplY3RcbiAgICovXG4gIHN0YXRpYyBjb3B5UHJvcGVydGllcyhvYmopIHtcbiAgICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShvYmopKVxuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZXMgYWxsIHByb3BlcnRpZXMgaW4gdGhlIGdpdmVuIG9iamVjdC5cbiAgICogXG4gICAqIEBwYXJhbSBvYmogaXMgdGhlIG9iamVjdCB0byBkZWxldGUgcHJvcGVydGllcyBmcm9tXG4gICAqL1xuICBzdGF0aWMgZGVsZXRlUHJvcGVydGllcyhvYmopIHtcbiAgICBsZXQgcHJvcHMgPSBbXTtcbiAgICBmb3IgKGxldCBwcm9wIGluIG9iaikgcHJvcHMucHVzaChwcm9wKTsgLy8gVE9ETzogaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wKSkgeyAuLi5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSBkZWxldGUgb2JqW3Byb3BzW2ldLnRvU3RyaW5nKCldO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGEgQ1NWIHN0cmluZyB0byBhIDItZGltZW5zaW9uYWwgYXJyYXkgb2Ygc3RyaW5ncy5cbiAgICogXG4gICAqIEBwYXJhbSBjc3YgaXMgdGhlIENTViBzdHJpbmcgdG8gY29udmVydFxuICAgKiBAcmV0dXJuIGEgMi1kaW1lbnNpb25hbCBhcnJheSBvZiBzdHJpbmdzXG4gICAqL1xuICBzdGF0aWMgY3N2VG9BcnIoY3N2KSB7XG4gICAgcmV0dXJuIGNzdi50b0FycmF5cyhjc3YpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIHRoZSBnaXZlbiBhcnJheSB0byBhIENTViBzdHJpbmcuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJyIGlzIGEgMi1kaW1lbnNpb25hbCBhcnJheSBvZiBzdHJpbmdzXG4gICAqIEByZXR1cm4gdGhlIENTViBzdHJpbmdcbiAgICovXG4gIHN0YXRpYyBhcnJUb0NzdihhcnIpIHtcbiAgICByZXR1cm4gY3N2LmZyb21PYmplY3RzKGFyciwge2hlYWRlcnM6IGZhbHNlfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBnaXZlbiBzdHJpbmcgY29udGFpbnMgd2hpdGVzcGFjZS5cbiAgICogXG4gICAqIEBwYXJhbSBzdHIgaXMgdGhlIHN0cmluZyB0byB0ZXN0XG4gICAqIEByZXR1cm4gdHJ1ZSBpZiB0aGUgc3RyaW5nIGNvbnRhaW5zIHdoaXRlc3BhY2UsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGhhc1doaXRlc3BhY2Uoc3RyKSB7XG4gICAgcmV0dXJuIC9cXHMvZy50ZXN0KHN0cik7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBnaXZlbiBjaGFyYWN0ZXIgaXMgd2hpdGVzcGFjZS5cbiAgICogXG4gICAqIEBwYXJhbSBjaGFyIGlzIHRoZSBjaGFyYWN0ZXIgdG8gdGVzdFxuICAgKiBAcmV0dXJuIHRydWUgaWYgdGhlIGdpdmVuIGNoYXJhY3RlciBpcyB3aGl0ZXNwYWNlLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc1doaXRlc3BhY2UoY2hhcikge1xuICAgIHJldHVybiAvXFxzLy50ZXN0KGNoYXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZ2l2ZW4gY2hhcmFjdGVyIGlzIGEgbmV3bGluZS5cbiAgICogXG4gICAqIEBwYXJhbSBjaGFyIGlzIHRoZSBjaGFyYWN0ZXIgdG8gdGVzdFxuICAgKiBAcmV0dXJuIHRydWUgaWYgdGhlIGdpdmVuIGNoYXJhY3RlciBpcyBhIG5ld2xpbmUsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGlzTmV3bGluZShjaGFyKSB7XG4gICAgcmV0dXJuIGNoYXIgPT09ICdcXG4nIHx8IGNoYXIgPT09ICdcXHInO1xuICB9XG5cbiAgLyoqXG4gICAqIENvdW50cyB0aGUgbnVtYmVyIG9mIG5vbi13aGl0ZXNwYWNlIGNoYXJhY3RlcnMgaW4gdGhlIGdpdmVuIHN0cmluZy5cbiAgICogXG4gICAqIEBwYXJhbSBzdHIgaXMgdGhlIHN0cmluZyB0byBjb3VudCB0aGUgbnVtYmVyIG9mIG5vbi13aGl0ZXNwYWNlIGNoYXJhY3RlcnMgaW5cbiAgICogQHJldHVybiBpbnQgaXMgdGhlIG51bWJlciBvZiBub24td2hpdGVzcGFjZSBjaGFyYWN0ZXJzIGluIHRoZSBnaXZlbiBzdHJpbmdcbiAgICovXG4gIHN0YXRpYyBjb3VudE5vbldoaXRlc3BhY2VDaGFyYWN0ZXJzKHN0cikge1xuICAgIGxldCBjb3VudCA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICghR2VuVXRpbHMuaXNXaGl0ZXNwYWNlKHN0ci5jaGFyQXQoaSkpKSBjb3VudCsrO1xuICAgIH1cbiAgICByZXR1cm4gY291bnQ7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0b2tlbnMgc2VwYXJhdGVkIGJ5IHdoaXRlc3BhY2UgZnJvbSB0aGUgZ2l2ZW4gc3RyaW5nLlxuICAgKiBcbiAgICogQHBhcmFtIHN0ciBpcyB0aGUgc3RyaW5nIHRvIGdldCB0b2tlbnMgZnJvbVxuICAgKiBAcmV0dXJuIHN0cmluZ1tdIGFyZSB0aGUgdG9rZW5zIHNlcGFyYXRlZCBieSB3aGl0ZXNwYWNlIHdpdGhpbiB0aGUgc3RyaW5nXG4gICAqL1xuICBzdGF0aWMgZ2V0V2hpdGVzcGFjZVRva2VucyhzdHIpIHtcbiAgICByZXR1cm4gc3RyLm1hdGNoKC9cXFMrL2cpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgbGluZXMgc2VwYXJhdGVkIGJ5IG5ld2xpbmVzIGZyb20gdGhlIGdpdmVuIHN0cmluZy5cbiAgICogXG4gICAqIEBwYXJhbSBzdHIgaXMgdGhlIHN0cmluZyB0byBnZXQgbGluZXMgZnJvbVxuICAgKiBAcGFyYW0gc3RyaW5nW10gYXJlIHRoZSBsaW5lcyBzZXBhcmF0ZWQgYnkgbmV3bGluZXMgd2l0aGluIHRoZSBzdHJpbmdcbiAgICovXG4gIHN0YXRpYyBnZXRMaW5lcyhzdHIpIHtcbiAgICByZXR1cm4gc3RyLm1hdGNoKC9bXlxcclxcbl0rL2cpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGRvY3VtZW50J3MgZmlyc3Qgc3R5bGVzaGVldCB3aGljaCBoYXMgbm8gaHJlZi5cbiAgICogXG4gICAqIEByZXR1cm4gU3R5bGVTaGVldCBpcyB0aGUgaW50ZXJuYWwgc3R5bGVzaGVldFxuICAgKi9cbiAgc3RhdGljIGdldEludGVybmFsU3R5bGVTaGVldCgpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRvY3VtZW50LnN0eWxlU2hlZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgc3R5bGVTaGVldCA9IGRvY3VtZW50LnN0eWxlU2hlZXRzW2ldO1xuICAgICAgaWYgKCFzdHlsZVNoZWV0LmhyZWYpIHJldHVybiBzdHlsZVNoZWV0O1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBkb2N1bWVudCdzIGludGVybmFsIHN0eWxlc2hlZXQgYXMgdGV4dC5cbiAgICogXG4gICAqIEByZXR1cm4gc3RyIGlzIHRoZSBkb2N1bWVudCdzIGludGVybmFsIHN0eWxlc2hlZXRcbiAgICovXG4gIHN0YXRpYyBnZXRJbnRlcm5hbFN0eWxlU2hlZXRUZXh0KCkge1xuICAgIGxldCBpbnRlcm5hbENzcyA9IFwiXCI7XG4gICAgbGV0IGludGVybmFsU3R5bGVTaGVldCA9IEdlblV0aWxzLmdldEludGVybmFsU3R5bGVTaGVldCgpO1xuICAgIGlmICghaW50ZXJuYWxTdHlsZVNoZWV0KSByZXR1cm4gbnVsbDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGludGVybmFsU3R5bGVTaGVldC5jc3NSdWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgaW50ZXJuYWxDc3MgKz0gaW50ZXJuYWxTdHlsZVNoZWV0LmNzc1J1bGVzW2ldLmNzc1RleHQgKyBcIlxcblwiO1xuICAgIH1cbiAgICByZXR1cm4gaW50ZXJuYWxDc3M7XG4gIH1cblxuICAvKipcbiAgICogTWFudWFsbHkgYnVpbGRzIGFuIEhUTUwgZG9jdW1lbnQgc3RyaW5nLlxuICAgKiBcbiAgICogQHBhcmFtIGNvbnRlbnQgc3BlY2lmaWVzIG9wdGlvbmFsIGRvY3VtZW50IGNvbnRlbnRcbiAgICogICAgICAgIGNvbnRlbnQuZGl2IGlzIGEgcHJlLWV4aXN0aW5nIGRpdiB0byBzdHJpbmdpZnkgYW5kIGFkZCB0byB0aGUgYm9keVxuICAgKiAgICAgICAgY29udGVudC50aXRsZSBpcyB0aGUgdGl0bGUgb2YgdGhlIG5ldyB0YWJcbiAgICogICAgICAgIGNvbnRlbnQuZGVwZW5kZW5jeVBhdGhzIHNwZWNpZmllcyBwYXRocyB0byBqcywgY3NzLCBvciBpbWcgcGF0aHNcbiAgICogICAgICAgIGNvbnRlbnQuaW50ZXJuYWxDc3MgaXMgY3NzIHRvIGVtYmVkIGluIHRoZSBodG1sIGRvY3VtZW50XG4gICAqICAgICAgICBjb250ZW50Lm1ldGFzIGFyZSBtZXRhIGVsZW1lbnRzIHdpdGgga2V5cy92YWx1ZXMgdG8gaW5jbHVkZVxuICAgKiBAcmV0dXJuIHN0ciBpcyB0aGUgZG9jdW1lbnQgc3RyaW5nXG4gICAqL1xuICBzdGF0aWMgYnVpbGRIdG1sRG9jdW1lbnQoY29udGVudCkge1xuICAgIGxldCBzdHIgPSBcIjwhRE9DVFlQRSBIVE1MPlwiO1xuICAgIHN0ciArPSBcIjxodG1sPjxoZWFkPlwiO1xuICAgIFxuICAgIC8vIGFkZCBtZXRhc1xuICAgIGlmIChjb250ZW50Lm1ldGFzKSB7XG4gICAgICBsZXQgbWV0YXMgPSBHZW5VdGlscy5saXN0aWZ5KGNvbnRlbnQubWV0YXMpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtZXRhcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBsZXQgbWV0YSA9IG1ldGFzW2ldO1xuICAgICAgICBsZXQgZWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJtZXRhXCIpO1xuICAgICAgICBmb3IgKGxldCBwcm9wIGluIG1ldGEpIHtcbiAgICAgICAgICBpZiAobWV0YS5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUocHJvcC50b1N0cmluZygpLCBtZXRhW3Byb3AudG9TdHJpbmcoKV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzdHIgKz0gZWxlbS5vdXRlckhUTUw7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIGFkZCB0aXRsZSBhbmQgaW50ZXJuYWwgY3NzXG4gICAgc3RyICs9IGNvbnRlbnQudGl0bGUgPyBcIjx0aXRsZT5cIiArIGNvbnRlbnQudGl0bGUgKyBcIjwvdGl0bGU+XCIgOiBcIlwiO1xuICAgIHN0ciArPSBjb250ZW50LmludGVybmFsQ3NzID8gXCI8c3R5bGU+XCIgKyBjb250ZW50LmludGVybmFsQ3NzICsgXCI8L3N0eWxlPlwiIDogXCJcIjtcbiAgICBcbiAgICAvLyBhZGQgZGVwZW5kZW5jeSBwYXRoc1xuICAgIGlmIChjb250ZW50LmRlcGVuZGVuY3lQYXRocykge1xuICAgICAgbGV0IGRlcGVuZGVuY3lQYXRocyA9IEdlblV0aWxzLmxpc3RpZnkoY29udGVudC5kZXBlbmRlbmN5UGF0aHMpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZXBlbmRlbmN5UGF0aHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IGRlcGVuZGVuY3lQYXRoID0gZGVwZW5kZW5jeVBhdGhzW2ldO1xuICAgICAgICBpZiAoZGVwZW5kZW5jeVBhdGguZW5kc1dpdGgoXCIuanNcIikpIHN0ciArPSBcIjxzY3JpcHQgc3JjPSdcIiArIGRlcGVuZGVuY3lQYXRoICsgXCInPjwvc2NyaXB0PlwiO1xuICAgICAgICBlbHNlIGlmIChkZXBlbmRlbmN5UGF0aC5lbmRzV2l0aChcIi5jc3NcIikpIHN0ciArPSBcIjxsaW5rIHJlbD0nc3R5bGVzaGVldCcgdHlwZT0ndGV4dC9jc3MnIGhyZWY9J1wiICsgZGVwZW5kZW5jeVBhdGggKyBcIicvPlwiO1xuICAgICAgICBlbHNlIGlmIChkZXBlbmRlbmN5UGF0aC5lbmRzV2l0aChcIi5wbmdcIikgfHwgZGVwZW5kZW5jeVBhdGguZW5kc1dpdGgoXCIuaW1nXCIpKSAgc3RyICs9IFwiPGltZyBzcmM9J1wiICsgZGVwZW5kZW5jeVBhdGggKyBcIic+XCI7XG4gICAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yKFwiVW5yZWNvZ25pemVkIGRlcGVuZGVuY3kgcGF0aCBleHRlbnNpb246IFwiICsgZGVwZW5kZW5jeVBhdGgpOyAgICAgIFxuICAgICAgfVxuICAgIH1cbiAgICBzdHIgKz0gXCI8L2hlYWQ+PGJvZHk+XCI7XG4gICAgaWYgKGNvbnRlbnQuZGl2KSBzdHIgKz0gJChcIjxkaXY+XCIpLmFwcGVuZChjb250ZW50LmRpdi5jbG9uZSgpKS5odG1sKCk7ICAvLyBhZGQgY2xvbmVkIGRpdiBhcyBzdHJpbmdcbiAgICBzdHIgKz0gXCI8L2JvZHk+PC9odG1sPlwiO1xuICAgIHJldHVybiBzdHI7XG4gIH1cblxuICAvKipcbiAgICogT3BlbnMgdGhlIGdpdmVuIGRpdiBpbiBhIG5ldyB3aW5kb3cuXG4gICAqIFxuICAgKiBAcGFyYW0gY29udGVudCBzcGVjaWZpZXMgb3B0aW9uYWwgd2luZG93IGNvbnRlbnRcbiAgICogICAgICAgIGNvbnRlbnQuZGl2IGlzIGEgcHJlLWV4aXN0aW5nIGRpdiB0byBzdHJpbmdpZnkgYW5kIGFkZCB0byB0aGUgYm9keVxuICAgKiAgICAgICAgY29udGVudC50aXRsZSBpcyB0aGUgdGl0bGUgb2YgdGhlIG5ldyB0YWJcbiAgICogICAgICAgIGNvbnRlbnQuZGVwZW5kZW5jeVBhdGhzIHNwZWNpZmllcyBwYXRocyB0byBqcywgY3NzLCBvciBpbWcgcGF0aHNcbiAgICogICAgICAgIGNvbnRlbnQuaW50ZXJuYWxDc3MgaXMgY3NzIHRvIGVtYmVkIGluIHRoZSBodG1sIGRvY3VtZW50XG4gICAqICAgICAgICBjb250ZW50Lm1ldGFzIGFyZSBtZXRhIGVsZW1lbnRzIHdpdGgga2V5cy92YWx1ZXMgdG8gaW5jbHVkZVxuICAgKiBAcGFyYW0gb25Mb2FkKGVyciwgd2luZG93KSBpcyBpbnZva2VkIHdpdGggYSByZWZlcmVuY2UgdG8gdGhlIHdpbmRvdyB3aGVuIGF2YWlsYWJsZVxuICAgKi9cbiAgc3RhdGljIG5ld1dpbmRvdyhjb250ZW50LCBvbkxvYWQpIHtcbiAgICBsZXQgb25Mb2FkQ2FsbGVkID0gZmFsc2U7XG4gICAgbGV0IHcgPSB3aW5kb3cub3BlbigpO1xuICAgIGlmICghR2VuVXRpbHMuaXNJbml0aWFsaXplZCh3KSB8fCAhR2VuVXRpbHMuaXNJbml0aWFsaXplZCh3LmRvY3VtZW50KSkge1xuICAgICAgb25Mb2FkT25jZShuZXcgRXJyb3IoXCJDb3VsZCBub3QgZ2V0IHdpbmRvdyByZWZlcmVuY2VcIikpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB3Lm9wZW5lciA9IG51bGw7XG4gICAgdy5kb2N1bWVudC53cml0ZShHZW5VdGlscy5idWlsZEh0bWxEb2N1bWVudChjb250ZW50KSk7XG4gICAgdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgICBvbkxvYWRPbmNlKG51bGwsIHcpO1xuICAgIH0pO1xuICAgIHcuZG9jdW1lbnQuY2xvc2UoKTtcbiAgICBcbiAgICAvLyBwcmV2ZW50cyBvbkxvYWQoKSBmcm9tIGJlaW5nIGNhbGxlZCBtdWx0aXBsZSB0aW1lc1xuICAgIGZ1bmN0aW9uIG9uTG9hZE9uY2UoZXJyLCB3aW5kb3c/KSB7XG4gICAgICBpZiAob25Mb2FkQ2FsbGVkKSByZXR1cm47XG4gICAgICBvbkxvYWRDYWxsZWQgPSB0cnVlO1xuICAgICAgaWYgKG9uTG9hZCkgb25Mb2FkKGVyciwgd2luZG93KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgdGhlIGdpdmVuIGltYWdlIHRvIGEgYmFzZTY0IGVuY29kZWQgZGF0YSB1cmwuXG4gICAqIFxuICAgKiBAcGFyYW0gaW1nIGlzIHRoZSBpbWFnZSB0byBjb252ZXJ0XG4gICAqIEBwYXJhbSBxdWFsaXR5IGlzIGEgbnVtYmVyIGJldHdlZW4gMCBhbmQgMSBzcGVjaWZ5aW5nIHRoZSBpbWFnZSBxdWFsaXR5XG4gICAqL1xuICBzdGF0aWMgaW1nVG9EYXRhVXJsKGltZywgcXVhbGl0eSkge1xuICAgIGxldCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICBjYW52YXMuaGVpZ2h0ID0gaW1nLm5hdHVyYWxIZWlnaHQ7XG4gICAgY2FudmFzLndpZHRoID0gaW1nLm5hdHVyYWxXaWR0aDtcbiAgICBsZXQgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIGNvbnRleHQuZHJhd0ltYWdlKGltZywgMCwgMCk7XG4gICAgcmV0dXJuIGNhbnZhcy50b0RhdGFVUkwocXVhbGl0eSk7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyBpZiB0aGUgaW1hZ2UgYXQgdGhlIGdpdmVuIFVSTCBpcyBhY2Nlc3NpYmxlLlxuICAgKiBcbiAgICogQHBhcmFtIHVybCBpcyB0aGUgdXJsIHRvIGFuIGltYWdlXG4gICAqIEBwYXJhbSB0aW1lb3V0IGlzIHRoZSBtYXhpbXVtIHRpbWUgdG8gd2FpdFxuICAgKiBAcGFyYW0gb25Eb25lKGJvb2wpIHdoZW4gdGhlIGltYWdlIGlzIGRldGVybWluZWQgdG8gYmUgYWNjZXNzaWJsZSBvciBub3RcbiAgICovXG4gIHN0YXRpYyBpc0ltYWdlQWNjZXNzaWJsZSh1cmwsIHRpbWVvdXQsIG9uRG9uZSkge1xuICAgIFxuICAgIC8vIHRyYWNrIHJldHVybiBzbyBpdCBvbmx5IGV4ZWN1dGVzIG9uY2VcbiAgICBsZXQgcmV0dXJuZWQgPSBmYWxzZTtcbiAgICBcbiAgICAvLyBhdHRlbXB0IHRvIGxvYWQgZmF2aWNvblxuICAgIGxldCBpbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICBpbWcub25sb2FkID0gb25SZXNwb25zZTtcbiAgICBpbWcub25lcnJvciA9IG9uUmVzcG9uc2U7XG4gICAgaW1nLnNyYyA9IHVybCArIFwiP1wiICsgKCtuZXcgRGF0ZSgpKTsgLy8gdHJpZ2dlciBpbWFnZSBsb2FkIHdpdGggY2FjaGUgYnVzdGVyXG4gICAgXG4gICAgLy8gbmVzdCBmYWlsdXJlIHRpbWVvdXRzIHRvIGdpdmUgcmVzcG9uc2UgYSBjaGFuY2Ugd2hlbiBicm93c2VyIGlzIHVuZGVyIGxvYWRcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgc2V0SW1tZWRpYXRlKGZ1bmN0aW9uKCkge1xuICAgICAgICBzZXRJbW1lZGlhdGUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgc2V0SW1tZWRpYXRlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKCFyZXR1cm5lZCkge1xuICAgICAgICAgICAgICByZXR1cm5lZCA9IHRydWU7XG4gICAgICAgICAgICAgIG9uRG9uZShmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSwgdGltZW91dCk7XG4gICAgXG4gICAgZnVuY3Rpb24gb25SZXNwb25zZShlKSB7XG4gICAgICBpZiAocmV0dXJuZWQpIHJldHVybjtcbiAgICAgIHJldHVybmVkID0gdHJ1ZTtcbiAgICAgIGlmICh0eXBlb2YgZSA9PT0gJ3VuZGVmaW5lZCcgfHwgZS50eXBlID09PSBcImVycm9yXCIpIG9uRG9uZShmYWxzZSk7XG4gICAgICBlbHNlIG9uRG9uZSh0cnVlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyBpZiB0aGUgZ2l2ZW4gZmlsZSBpcyBhIHppcCBmaWxlLlxuICAgKiBcbiAgICogQHBhcmFtIGZpbGUgaXMgYSBmaWxlXG4gICAqIEByZXR1cm4gdHJ1ZSBpZiB0aGUgZ2l2ZW4gZmlsZSBpcyBhIHppcCBmaWxlLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc1ppcEZpbGUoZmlsZSkge1xuICAgIHJldHVybiBmaWxlLm5hbWUuZW5kc1dpdGgoXCIuemlwXCIpIHx8IGZpbGUudHlwZSA9PT0gJ2FwcGxpY2F0aW9uL3ppcCc7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyBpZiB0aGUgZ2l2ZW4gZmlsZSBpcyBhIGpzb24gZmlsZS5cbiAgICogXG4gICAqIEBwYXJhbSBmaWxlIGlzIGEgZmlsZVxuICAgKiBAcmV0dXJuIHRydWUgaWYgdGhlIGdpdmVuIGZpbGUgaXMgYSBqc29uIGZpbGUsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGlzSnNvbkZpbGUoZmlsZSkge1xuICAgIHJldHVybiBmaWxlLm5hbWUuZW5kc1dpdGgoXCIuanNvblwiKSB8fCBmaWxlLnR5cGUgPT09ICdhcHBsaWNhdGlvbi9qc29uJztcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIGlmIHRoZSBnaXZlbiBmaWxlIGlzIGEgY3N2IGZpbGUuXG4gICAqIFxuICAgKiBAcGFyYW0gZmlsZSBpcyBhIGZpbGVcbiAgICogQHJldHVybiB0cnVlIGlmIHRoZSBnaXZlbiBmaWxlIGlzIGEgY3N2IGZpbGUsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGlzQ3N2RmlsZShmaWxlKSB7XG4gICAgcmV0dXJuIGZpbGUubmFtZS5lbmRzV2l0aChcIi5jc3ZcIikgfHwgZmlsZS50eXBlID09PSAndGV4dC9jc3YnO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgdGhlIGdpdmVuIGZpbGUgaXMgYSB0eHQgZmlsZS5cbiAgICogXG4gICAqIEBwYXJhbSBmaWxlIGlzIGEgZmlsZVxuICAgKiBAcmV0dXJuIHRydWUgaWYgdGhlIGdpdmVuIGZpbGUgaXMgYSB0eHQgZmlsZSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaXNUeHRGaWxlKGZpbGUpIHtcbiAgICByZXR1cm4gZmlsZS5uYW1lLmVuZHNXaXRoKFwiLnR4dFwiKSB8fCBmaWxlLnR5cGUgPT09ICd0ZXh0L3BsYWluJztcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaGVzIHRoZSBnaXZlbiBsaXN0IG9mIGltYWdlcy5cbiAgICogXG4gICAqIFByZXJlcXVpc2l0ZTogYXN5bmMuanMuXG4gICAqIFxuICAgKiBAcGFyYW0gcGF0aHMgYXJlIHRoZSBwYXRocyB0byB0aGUgaW1hZ2VzIHRvIGZldGNoXG4gICAqIEBwYXJhbSBvbkRvbmUoZXJyLCBpbWFnZXMpIGlzIGNhbGxlZCB3aGVuIGRvbmVcbiAgICovXG4gIHN0YXRpYyBnZXRJbWFnZXMocGF0aHMsIG9uRG9uZSkge1xuICAgIFxuICAgIC8vIGxpc3RpZnkgcGF0aHNcbiAgICBpZiAoIUdlblV0aWxzLmlzQXJyYXkocGF0aHMpKSB7XG4gICAgICBHZW5VdGlscy5hc3NlcnRUcnVlKEdlblV0aWxzLmlzU3RyaW5nKHBhdGhzKSk7XG4gICAgICBwYXRocyA9IFtwYXRoc107XG4gICAgfVxuICAgIFxuICAgIC8vIGNvbGxlY3QgZnVuY3Rpb25zIHRvIGZldGNoIGltYWdlc1xuICAgIGxldCBmdW5jcyA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGF0aHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGZ1bmNzLnB1c2gobG9hZEZ1bmMocGF0aHNbaV0pKTtcbiAgICB9XG4gICAgXG4gICAgLy8gZmV0Y2ggaW4gcGFyYWxsZWxcbiAgICBhc3luYy5wYXJhbGxlbChmdW5jcywgb25Eb25lKTtcbiAgICBcbiAgICAvLyBjYWxsYmFjayBzdGF0aWMgdG8gZmV0Y2ggYSBzaW5nbGUgaW1hZ2VcbiAgICBmdW5jdGlvbiBsb2FkRnVuYyhwYXRoKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24ob25Eb25lKSB7XG4gICAgICAgIGxldCBpbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgaW1nLm9ubG9hZCA9IGZ1bmN0aW9uKCkgeyBvbkRvbmUobnVsbCwgaW1nKTsgfVxuICAgICAgICBpbWcub25lcnJvciA9IGZ1bmN0aW9uKCkgeyBvbkRvbmUobmV3IEVycm9yKFwiQ2Fubm90IGxvYWQgaW1hZ2U6IFwiICsgcGF0aCkpOyB9XG4gICAgICAgIGltZy5zcmMgPSBwYXRoO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIFJldHVybnMgYSBzdHJpbmcgaW5kZW50YXRpb24gb2YgdGhlIGdpdmVuIGxlbmd0aDtcbiAgICogXG4gICAqIEBwYXJhbSBsZW5ndGggaXMgdGhlIGxlbmd0aCBvZiB0aGUgaW5kZW50YXRpb25cbiAgICogQHJldHVybiB7c3RyaW5nfSBpcyBhbiBpbmRlbnRhdGlvbiBzdHJpbmcgb2YgdGhlIGdpdmVuIGxlbmd0aFxuICAgKi9cbiAgc3RhdGljIGdldEluZGVudChsZW5ndGgpIHtcbiAgICBsZXQgc3RyID0gXCJcIjtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSBzdHIgKz0gJyAgJzsgLy8gdHdvIHNwYWNlc1xuICAgIHJldHVybiBzdHI7XG4gIH1cbiAgXG4gIHN0YXRpYyBpbml0UG9seWZpbGxzKCkge1xuICAgIFxuICAgIC8vIFBvbHlmaWxsIE9iamVjdC5hc3NpZ24oKVxuICAgIC8vIENyZWRpdDogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvT2JqZWN0L2Fzc2lnblxuICAgIGlmICh0eXBlb2YgT2JqZWN0LmFzc2lnbiAhPSAnZnVuY3Rpb24nKSB7XG4gICAgICAvLyBNdXN0IGJlIHdyaXRhYmxlOiB0cnVlLCBlbnVtZXJhYmxlOiBmYWxzZSwgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoT2JqZWN0LCBcImFzc2lnblwiLCB7XG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBhc3NpZ24odGFyZ2V0LCB2YXJBcmdzKSB7IC8vIC5sZW5ndGggb2Ygc3RhdGljIGlzIDJcbiAgICAgICAgICAndXNlIHN0cmljdCc7XG4gICAgICAgICAgaWYgKHRhcmdldCA9PSBudWxsKSB7IC8vIFR5cGVFcnJvciBpZiB1bmRlZmluZWQgb3IgbnVsbFxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNvbnZlcnQgdW5kZWZpbmVkIG9yIG51bGwgdG8gb2JqZWN0Jyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGV0IHRvID0gT2JqZWN0KHRhcmdldCk7XG5cbiAgICAgICAgICBmb3IgKGxldCBpbmRleCA9IDE7IGluZGV4IDwgYXJndW1lbnRzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgbGV0IG5leHRTb3VyY2UgPSBhcmd1bWVudHNbaW5kZXhdO1xuXG4gICAgICAgICAgICBpZiAobmV4dFNvdXJjZSAhPSBudWxsKSB7IC8vIFNraXAgb3ZlciBpZiB1bmRlZmluZWQgb3IgbnVsbFxuICAgICAgICAgICAgICBmb3IgKGxldCBuZXh0S2V5IGluIG5leHRTb3VyY2UpIHtcbiAgICAgICAgICAgICAgICAvLyBBdm9pZCBidWdzIHdoZW4gaGFzT3duUHJvcGVydHkgaXMgc2hhZG93ZWRcbiAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG5leHRTb3VyY2UsIG5leHRLZXkpKSB7XG4gICAgICAgICAgICAgICAgICB0b1tuZXh0S2V5XSA9IG5leHRTb3VyY2VbbmV4dEtleV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0bztcbiAgICAgICAgfSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICAqIFBvbHlmaWxsIHN0ci5zdGFydHNXaXRoKHNlYXJjaFN0cmluZywgcG9zaXRpb24pLlxuICAgICAqIFxuICAgICAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL1N0cmluZy9zdGFydHNXaXRoI1BvbHlmaWxsXG4gICAgICovXG4gICAgU3RyaW5nLnByb3RvdHlwZS5zdGFydHNXaXRoID0gZnVuY3Rpb24oc2VhcmNoU3RyaW5nLCBwb3NpdGlvbikge1xuICAgICAgcmV0dXJuIHRoaXMuc3Vic3RyKHBvc2l0aW9uIHx8IDAsIHNlYXJjaFN0cmluZy5sZW5ndGgpID09PSBzZWFyY2hTdHJpbmc7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFBvbHlmaWxsIHN0ci5lbmRzV2l0aChzZWFyY2hTdHJpbmcsIHBvc2l0aW9uKS5cbiAgICAgKiBcbiAgICAgKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9TdHJpbmcvZW5kc1dpdGgjUG9seWZpbGxcbiAgICAgKi9cbiAgICBTdHJpbmcucHJvdG90eXBlLmVuZHNXaXRoID0gZnVuY3Rpb24oc2VhcmNoU3RyaW5nLCBwb3NpdGlvbikge1xuICAgICAgaWYgKCEocG9zaXRpb24gPCB0aGlzLmxlbmd0aCkpIHBvc2l0aW9uID0gdGhpcy5sZW5ndGg7ICAvLyB3b3JrcyBiZXR0ZXIgdGhhbiA+PSBiZWNhdXNlIGl0IGNvbXBlbnNhdGVzIGZvciBOYU5cbiAgICAgIGVsc2UgcG9zaXRpb24gfD0gMDsgLy8gcm91bmQgcG9zaXRpb25cbiAgICAgIHJldHVybiB0aGlzLnN1YnN0cihwb3NpdGlvbiAtIHNlYXJjaFN0cmluZy5sZW5ndGgsIHNlYXJjaFN0cmluZy5sZW5ndGgpID09PSBzZWFyY2hTdHJpbmc7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyBhIHY0IFVVSUQuXG4gICAqIFxuICAgKiBTb3VyY2U6IGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwNTAzNC9jcmVhdGUtZ3VpZC11dWlkLWluLWphdmFzY3JpcHRcbiAgICovXG4gIHN0YXRpYyBnZXRVVUlEKCkge1xuICAgIHJldHVybiAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uKGMpIHtcbiAgICAgIGxldCByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMCwgdiA9IGMgPT0gJ3gnID8gciA6IChyICYgMHgzIHwgMHg4KTtcbiAgICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgY3VycmVudCBlbnZpcm9ubWVudCBpcyBhIGJyb3dzZXIuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBlbnZpcm9ubWVudCBpcyBhIGJyb3dzZXIsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGlzQnJvd3NlcigpIHtcbiAgICBsZXQgaXNXb3JrZXIgPSB0eXBlb2YgaW1wb3J0U2NyaXB0cyA9PT0gJ2Z1bmN0aW9uJztcbiAgICBsZXQgaXNCcm93c2VyTWFpbiA9IG5ldyBGdW5jdGlvbihcInRyeSB7cmV0dXJuIHRoaXM9PT13aW5kb3c7fWNhdGNoKGUpe3JldHVybiBmYWxzZTt9XCIpKCk7XG4gICAgbGV0IGlzSnNEb20gPSBpc0Jyb3dzZXJNYWluID8gbmV3IEZ1bmN0aW9uKFwidHJ5IHtyZXR1cm4gd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQuaW5jbHVkZXMoJ2pzZG9tJyk7fWNhdGNoKGUpe3JldHVybiBmYWxzZTt9XCIpKCkgOiBmYWxzZTtcbiAgICByZXR1cm4gaXNXb3JrZXIgfHwgKGlzQnJvd3Nlck1haW4gJiYgIWlzSnNEb20pO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBjdXJyZW50IGVudmlyb25tZW50IGlzIGEgZmlyZWZveC1iYXNlZCBicm93c2VyLlxuICAgKiBcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgZW52aXJvbm1lbnQgaXMgYSBmaXJlZm94LWJhc2VkIGJyb3dzZXIsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGlzRmlyZWZveCgpIHtcbiAgICByZXR1cm4gdGhpcy5pc0Jyb3dzZXIoKSAmJiBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoXCJGaXJlZm94XCIpID4gMDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBJRSB2ZXJzaW9uIG51bWJlci5cbiAgICogXG4gICAqIENyZWRpdDogaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTk5OTkzODgvY2hlY2staWYtdXNlci1pcy11c2luZy1pZS13aXRoLWpxdWVyeS8yMTcxMjM1NiMyMTcxMjM1NlxuICAgKiBcbiAgICogQHJldHVybiB0aGUgSUUgdmVyc2lvbiBudW1iZXIgb3IgbnVsbCBpZiBub3QgSUVcbiAgICovXG4gIHN0YXRpYyBnZXRJRVZlcnNpb24oKSB7XG4gICAgbGV0IHVhID0gd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQ7XG5cbiAgICBsZXQgbXNpZSA9IHVhLmluZGV4T2YoJ01TSUUgJyk7XG4gICAgaWYgKG1zaWUgPiAwKSB7XG4gICAgICAgIC8vIElFIDEwIG9yIG9sZGVyID0+IHJldHVybiB2ZXJzaW9uIG51bWJlclxuICAgICAgICByZXR1cm4gcGFyc2VJbnQodWEuc3Vic3RyaW5nKG1zaWUgKyA1LCB1YS5pbmRleE9mKCcuJywgbXNpZSkpLCAxMCk7XG4gICAgfVxuXG4gICAgbGV0IHRyaWRlbnQgPSB1YS5pbmRleE9mKCdUcmlkZW50LycpO1xuICAgIGlmICh0cmlkZW50ID4gMCkge1xuICAgICAgICAvLyBJRSAxMSA9PiByZXR1cm4gdmVyc2lvbiBudW1iZXJcbiAgICAgICAgbGV0IHJ2ID0gdWEuaW5kZXhPZigncnY6Jyk7XG4gICAgICAgIHJldHVybiBwYXJzZUludCh1YS5zdWJzdHJpbmcocnYgKyAzLCB1YS5pbmRleE9mKCcuJywgcnYpKSwgMTApO1xuICAgIH1cblxuICAgIGxldCBlZGdlID0gdWEuaW5kZXhPZignRWRnZS8nKTtcbiAgICBpZiAoZWRnZSA+IDApIHtcbiAgICAgICAvLyBFZGdlIChJRSAxMispID0+IHJldHVybiB2ZXJzaW9uIG51bWJlclxuICAgICAgIHJldHVybiBwYXJzZUludCh1YS5zdWJzdHJpbmcoZWRnZSArIDUsIHVhLmluZGV4T2YoJy4nLCBlZGdlKSksIDEwKTtcbiAgICB9XG5cbiAgICAvLyBvdGhlciBicm93c2VyXG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhIHBhcmFtZXRlciB2YWx1ZS5cbiAgICogXG4gICAqIENyZWRpdDogaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvOTAxMTE1L2hvdy1jYW4taS1nZXQtcXVlcnktc3RyaW5nLXZhbHVlcy1pbi1qYXZhc2NyaXB0XG4gICAqIFxuICAgKiBAcGFyYW0gbmFtZSBpcyB0aGUgbmFtZSBvZiB0aGUgcGFyYW1ldGVyIHRvIGdldCB0aGUgdmFsdWUgb2ZcbiAgICogQHBhcmFtIHVybCBpcyBhIFVSTCB0byBnZXQgdGhlIHBhcmFtZXRlciBmcm9tLCB1c2VzIHRoZSB3aW5kb3cncyBjdXJyZW50IGhyZWYgaWYgbm90IGdpdmVuXG4gICAqIEByZXR1cm4gdGhlIHBhcmFtZXRlcidzIHZhbHVlXG4gICAqL1xuICBzdGF0aWMgZ2V0UGFyYW1ldGVyQnlOYW1lKG5hbWUsIHVybCkge1xuICAgIGlmICghdXJsKSB1cmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcbiAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC9bXFxbXFxdXS9nLCBcIlxcXFwkJlwiKTtcbiAgICBsZXQgcmVnZXggPSBuZXcgUmVnRXhwKFwiWz8mXVwiICsgbmFtZSArIFwiKD0oW14mI10qKXwmfCN8JClcIiksIHJlc3VsdHMgPSByZWdleC5leGVjKHVybCk7XG4gICAgaWYgKCFyZXN1bHRzKSByZXR1cm4gbnVsbDtcbiAgICBpZiAoIXJlc3VsdHNbMl0pIHJldHVybiAnJztcbiAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHJlc3VsdHNbMl0ucmVwbGFjZSgvXFwrL2csIFwiIFwiKSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXRzIGEgbm9uLWNyeXB0b2dyYXBoaWNhbGx5IHNlY3VyZSByYW5kb20gbnVtYmVyIHdpdGhpbiBhIGdpdmVuIHJhbmdlLlxuICAgKiBcbiAgICogQHBhcmFtIG1pbiBpcyB0aGUgbWluaW11bSByYW5nZSBvZiB0aGUgaW50IHRvIGdlbmVyYXRlLCBpbmNsdXNpdmVcbiAgICogQHBhcmFtIG1heCBpcyB0aGUgbWF4aW11bSByYW5nZSBvZiB0aGUgaW50IHRvIGdlbmVyYXRlLCBpbmNsdXNpdmVcbiAgICogXG4gICAqIFNvdXJjZTogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvTWF0aC9yYW5kb21cbiAgICovXG4gIHN0YXRpYyBnZXRSYW5kb21JbnQobWluLCBtYXgpIHtcbiAgICBtaW4gPSBNYXRoLmNlaWwobWluKTtcbiAgICBtYXggPSBNYXRoLmZsb29yKG1heCk7XG4gICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSkgKyBtaW47XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXRzIHJhbmRvbSBpbnRzLlxuICAgKiBcbiAgICogQHBhcmFtIG1pbiBpcyB0aGUgbWluaW11bSByYW5nZSBvZiB0aGUgaW50cyB0byBnZW5lcmF0ZSwgaW5jbHVzaXZlXG4gICAqIEBwYXJhbSBtYXggaXMgdGhlIG1heGltdW0gcmFuZ2Ugb2YgdGhlIGludHMgdG8gZ2VuZXJhdGUsIGluY2x1c2l2ZVxuICAgKiBAcGFyYW0gY291bnQgaXMgdGhlIG51bWJlciBvZiByYW5kb20gaW50cyB0byBnZXRcbiAgICovXG4gIHN0YXRpYyBnZXRSYW5kb21JbnRzKG1pbiwgbWF4LCBjb3VudCkge1xuICAgIEdlblV0aWxzLmFzc2VydFRydWUodHlwZW9mIGNvdW50ID09PSBcIm51bWJlclwiKTtcbiAgICBsZXQgaW50cyA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkrKykgaW50cy5wdXNoKEdlblV0aWxzLmdldFJhbmRvbUludChtaW4sIG1heCkpO1xuICAgIHJldHVybiBpbnRzO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0cyBhIGdpdmVuIG51bWJlciBvZiB1bmlxdWUgcmFuZG9tIGludHMgd2l0aGluIGEgcmFuZ2UuXG4gICAqIFxuICAgKiBAcGFyYW0gbWluIGlzIHRoZSBtaW5pbXVtIHJhbmdlIG9mIHRoZSBpbnRzIHRvIGdlbmVyYXRlLCBpbmNsdXNpdmVcbiAgICogQHBhcmFtIG1heCBpcyB0aGUgbWF4aW11bSByYW5nZSBvZiB0aGUgaW50cyB0byBnZW5lcmF0ZSwgaW5jbHVzaXZlXG4gICAqIEBwYXJhbSBjb3VudCBpcyB0aGUgbnVtYmVyIG9mIHVuaXF1ZSByYW5kb20gaW50cyB0byBnZXRcbiAgICovXG4gIHN0YXRpYyBnZXRVbmlxdWVSYW5kb21JbnRzKG1pbiwgbWF4LCBjb3VudCkge1xuICAgIGxldCBpbnRzID0gW107XG4gICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZShjb3VudCA+PSAwKTtcbiAgICBHZW5VdGlscy5hc3NlcnRUcnVlKG1heCAtIG1pbiArIDEgPj0gY291bnQpO1xuICAgIHdoaWxlIChpbnRzLmxlbmd0aCA8IGNvdW50KSB7XG4gICAgICBsZXQgcmFuZG9tSW50ID0gR2VuVXRpbHMuZ2V0UmFuZG9tSW50KG1pbiwgbWF4KTtcbiAgICAgIGlmICghaW50cy5pbmNsdWRlcyhyYW5kb21JbnQpKSBpbnRzLnB1c2gocmFuZG9tSW50KTtcbiAgICB9XG4gICAgcmV0dXJuIGludHM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSYW5kb21pemUgYXJyYXkgZWxlbWVudCBvcmRlciBpbi1wbGFjZSB1c2luZyBEdXJzdGVuZmVsZCBzaHVmZmxlIGFsZ29yaXRobS5cbiAgICogXG4gICAqIENyZWRpdDogaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMjQ1MDk1NC9ob3ctdG8tcmFuZG9taXplLXNodWZmbGUtYS1qYXZhc2NyaXB0LWFycmF5XG4gICAqL1xuICBzdGF0aWMgc2h1ZmZsZShhcnJheSkge1xuICAgIGZvciAodmFyIGkgPSBhcnJheS5sZW5ndGggLSAxOyBpID4gMDsgaS0tKSB7XG4gICAgICB2YXIgaiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChpICsgMSkpO1xuICAgICAgdmFyIHRlbXAgPSBhcnJheVtpXTtcbiAgICAgIGFycmF5W2ldID0gYXJyYXlbal07XG4gICAgICBhcnJheVtqXSA9IHRlbXA7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogU29ydHMgYW4gYXJyYXkgYnkgbmF0dXJhbCBvcmRlcmluZy5cbiAgICogXG4gICAqIEBwYXJhbSB0aGUgYXJyYXkgdG8gc29ydFxuICAgKi9cbiAgc3RhdGljIHNvcnQoYXJyYXkpIHtcbiAgICBhcnJheS5zb3J0KChhLCBiKSA9PiBhID09PSBiID8gMCA6IGEgPiBiID8gMSA6IC0xKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNldHMgdGhlIGdpdmVuIHZhbHVlIGVuc3VyaW5nIGEgcHJldmlvdXMgdmFsdWUgaXMgbm90IG92ZXJ3cml0dGVuLlxuICAgKiBcbiAgICogVE9ETzogcmVtb3ZlIGZvciBwb3J0YWJpbGl0eSBiZWNhdXNlIGZ1bmN0aW9uIHBhc3Npbmcgbm90IHN1cHBvcnRlZCBpbiBvdGhlciBsYW5ndWFnZXMsIHVzZSByZWNvbmNpbGUgb25seVxuICAgKiBcbiAgICogQHBhcmFtIG9iaiBpcyB0aGUgb2JqZWN0IHRvIGludm9rZSB0aGUgZ2V0dGVyIGFuZCBzZXR0ZXIgb25cbiAgICogQHBhcmFtIGdldEZuIGdldHMgdGhlIGN1cnJlbnQgdmFsdWVcbiAgICogQHBhcmFtIHNldEZuIHNldHMgdGhlIGN1cnJlbnQgdmFsdWVcbiAgICogQHBhcmFtIHZhbCBpcyB0aGUgdmFsdWUgdG8gc2V0IGlmZiBpdCBkb2VzIG5vdCBvdmVyd3JpdGUgYSBwcmV2aW91cyB2YWx1ZVxuICAgKiBAcGFyYW0gW2NvbmZpZ10gc3BlY2lmaWVzIHJlY29uY2lsaWF0aW9uIGNvbmZpZ3VyYXRpb25cbiAgICogICAgICAgIGNvbmZpZy5yZXNvbHZlRGVmaW5lZCB1c2VzIGRlZmluZWQgdmFsdWUgaWYgdHJ1ZSBvciB1bmRlZmluZWQsIHVuZGVmaW5lZCBpZiBmYWxzZVxuICAgKiAgICAgICAgY29uZmlnLnJlc29sdmVUcnVlIHVzZXMgdHJ1ZSBvdmVyIGZhbHNlIGlmIHRydWUsIGZhbHNlIG92ZXIgdHJ1ZSBpZiBmYWxzZSwgbXVzdCBiZSBlcXVhbCBpZiB1bmRlZmluZWRcbiAgICogICAgICAgIGNvbmZpZy5yZXNvbHZlTWF4IHVzZXMgbWF4IG92ZXIgbWluIGlmIHRydWUsIG1pbiBvdmVyIG1heCBpZiBmYWxzZSwgbXVzdCBiZSBlcXVhbCBpZiB1bmRlZmluZWRcbiAgICogQHBhcmFtIFtlcnJNc2ddIGlzIHRoZSBlcnJvciBtZXNzYWdlIHRvIHRocm93IGlmIHRoZSB2YWx1ZXMgY2Fubm90IGJlIHJlY29uY2lsZWQgKG9wdGlvbmFsKVxuICAgKi9cbiAgc3RhdGljIHNhZmVTZXQob2JqLCBnZXRGbiwgc2V0Rm4sIHZhbCwgY29uZmlnPywgZXJyTXNnPykge1xuICAgIGxldCBjdXJWYWwgPSBnZXRGbi5jYWxsKG9iaik7XG4gICAgbGV0IHJlY29uY2lsZWRWYWwgPSBHZW5VdGlscy5yZWNvbmNpbGUoY3VyVmFsLCB2YWwsIGNvbmZpZywgZXJyTXNnKTtcbiAgICBpZiAoY3VyVmFsICE9PSByZWNvbmNpbGVkVmFsKSBzZXRGbi5jYWxsKG9iaiwgcmVjb25jaWxlZFZhbCk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZWNvbmNpbGVzIHR3byB2YWx1ZXMuXG4gICAqIFxuICAgKiBUT0RPOiByZW1vdmUgY3VzdG9tIGVycm9yIG1lc3NhZ2VcbiAgICogXG4gICAqIEBwYXJhbSB2YWwxIGlzIGEgdmFsdWUgdG8gcmVjb25jaWxlXG4gICAqIEBwYXJhbSB2YWwyIGlzIGEgdmFsdWUgdG8gcmVjb25jaWxlXG4gICAqIEBwYXJhbSBbY29uZmlnXSBzcGVjaWZpZXMgcmVjb25jaWxpYXRpb24gY29uZmlndXJhdGlvblxuICAgKiAgICAgICAgY29uZmlnLnJlc29sdmVEZWZpbmVkIHVzZXMgZGVmaW5lZCB2YWx1ZSBpZiB0cnVlIG9yIHVuZGVmaW5lZCwgdW5kZWZpbmVkIGlmIGZhbHNlXG4gICAqICAgICAgICBjb25maWcucmVzb2x2ZVRydWUgdXNlcyB0cnVlIG92ZXIgZmFsc2UgaWYgdHJ1ZSwgZmFsc2Ugb3ZlciB0cnVlIGlmIGZhbHNlLCBtdXN0IGJlIGVxdWFsIGlmIHVuZGVmaW5lZFxuICAgKiAgICAgICAgY29uZmlnLnJlc29sdmVNYXggdXNlcyBtYXggb3ZlciBtaW4gaWYgdHJ1ZSwgbWluIG92ZXIgbWF4IGlmIGZhbHNlLCBtdXN0IGJlIGVxdWFsIGlmIHVuZGVmaW5lZFxuICAgKiBAcGFyYW0gW2Vyck1zZ10gaXMgdGhlIGVycm9yIG1lc3NhZ2UgdG8gdGhyb3cgaWYgdGhlIHZhbHVlcyBjYW5ub3QgYmUgcmVjb25jaWxlZCAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4gdGhlIHJlY29uY2lsZWQgdmFsdWUgaWYgcmVjb25jaWxhYmxlLCB0aHJvd3MgZXJyb3Igb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgcmVjb25jaWxlKHZhbDEsIHZhbDIsIGNvbmZpZz8sIGVyck1zZz8pIHtcbiAgICBcbiAgICAvLyBjaGVjayBmb3IgZXF1YWxpdHlcbiAgICBpZiAodmFsMSA9PT0gdmFsMikgcmV0dXJuIHZhbDE7XG4gICAgXG4gICAgLy8gY2hlY2sgZm9yIGJpZ2ludCBlcXVhbGl0eVxuICAgIGxldCBjb21wYXJpc29uOyAvLyBzYXZlIGNvbXBhcmlzb24gZm9yIGxhdGVyIGlmIGFwcGxpY2FibGVcbiAgICBpZiAodHlwZW9mIHZhbDEgPT09IFwiYmlnaW50XCIgJiYgdHlwZW9mIHZhbDIgPT09IFwiYmlnaW50XCIpIHtcbiAgICAgIGlmICh2YWwxID09PSB2YWwyKSByZXR1cm4gdmFsMTtcbiAgICB9XG4gICAgXG4gICAgLy8gcmVzb2x2ZSBvbmUgdmFsdWUgZGVmaW5lZFxuICAgIGlmICh2YWwxID09PSB1bmRlZmluZWQgfHwgdmFsMiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBpZiAoY29uZmlnICYmIGNvbmZpZy5yZXNvbHZlRGVmaW5lZCA9PT0gZmFsc2UpIHJldHVybiB1bmRlZmluZWQ7ICAvLyB1c2UgdW5kZWZpbmVkXG4gICAgICBlbHNlIHJldHVybiB2YWwxID09PSB1bmRlZmluZWQgPyB2YWwyIDogdmFsMTsgIC8vIHVzZSBkZWZpbmVkIHZhbHVlXG4gICAgfVxuICAgIFxuICAgIC8vIHJlc29sdmUgZGlmZmVyZW50IGJvb2xlYW5zXG4gICAgaWYgKGNvbmZpZyAmJiBjb25maWcucmVzb2x2ZVRydWUgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgdmFsMSA9PT0gXCJib29sZWFuXCIgJiYgdHlwZW9mIHZhbDIgPT09IFwiYm9vbGVhblwiKSB7XG4gICAgICBhc3NlcnQuZXF1YWwodHlwZW9mIGNvbmZpZy5yZXNvbHZlVHJ1ZSwgXCJib29sZWFuXCIpO1xuICAgICAgcmV0dXJuIGNvbmZpZy5yZXNvbHZlVHJ1ZTtcbiAgICB9XG4gICAgXG4gICAgLy8gcmVzb2x2ZSBkaWZmZXJlbnQgbnVtYmVyc1xuICAgIGlmIChjb25maWcgJiYgY29uZmlnLnJlc29sdmVNYXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgYXNzZXJ0LmVxdWFsKHR5cGVvZiBjb25maWcucmVzb2x2ZU1heCwgXCJib29sZWFuXCIpO1xuICAgICAgXG4gICAgICAvLyByZXNvbHZlIGpzIG51bWJlcnNcbiAgICAgIGlmICh0eXBlb2YgdmFsMSA9PT0gXCJudW1iZXJcIiAmJiB0eXBlb2YgdmFsMiA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICByZXR1cm4gY29uZmlnLnJlc29sdmVNYXggPyBNYXRoLm1heCh2YWwxLCB2YWwyKSA6IE1hdGgubWluKHZhbDEsIHZhbDIpO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyByZXNvbHZlIGJpZ2ludHNcbiAgICAgIGlmICh0eXBlb2YgdmFsMSA9PT0gXCJiaWdpbnRcIiAmJiB0eXBlb2YgdmFsMiA9PT0gXCJiaWdpbnRcIikge1xuICAgICAgICByZXR1cm4gY29uZmlnLnJlc29sdmVNYXggPyAoY29tcGFyaXNvbiA8IDAgPyB2YWwyIDogdmFsMSkgOiAoY29tcGFyaXNvbiA8IDAgPyB2YWwxIDogdmFsMik7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIGFzc2VydCBkZWVwIGVxdWFsaXR5XG4gICAgYXNzZXJ0LmRlZXBFcXVhbCh2YWwxLCB2YWwyLCBlcnJNc2cgPyBlcnJNc2cgOiBcIkNhbm5vdCByZWNvbmNpbGUgdmFsdWVzIFwiICsgdmFsMSArIFwiIGFuZCBcIiArIHZhbDIgKyBcIiB3aXRoIGNvbmZpZzogXCIgKyBKU09OLnN0cmluZ2lmeShjb25maWcpKTtcbiAgICByZXR1cm4gdmFsMTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFJldHVybnMgYSBodW1hbi1mcmllbmRseSBrZXkgdmFsdWUgbGluZS5cbiAgICogXG4gICAqIEBwYXJhbSBrZXkgaXMgdGhlIGtleVxuICAgKiBAcGFyYW0gdmFsdWUgaXMgdGhlIHZhbHVlXG4gICAqIEBwYXJhbSBpbmRlbnQgaW5kZW50cyB0aGUgbGluZVxuICAgKiBAcGFyYW0gbmV3bGluZSBzcGVjaWZpZXMgaWYgdGhlIHN0cmluZyBzaG91bGQgYmUgdGVybWluYXRlZCB3aXRoIGEgbmV3bGluZSBvciBub3RcbiAgICogQHBhcmFtIGlnbm9yZVVuZGVmaW5lZCBzcGVjaWZpZXMgaWYgdW5kZWZpbmVkIHZhbHVlcyBzaG91bGQgcmV0dXJuIGFuIGVtcHR5IHN0cmluZ1xuICAgKiBAcmV0dXJuIHtzdHJpbmd9IGlzIHRoZSBodW1hbi1mcmllbmRseSBrZXkgdmFsdWUgbGluZVxuICAgKi9cbiAgc3RhdGljIGt2TGluZShrZXksIHZhbHVlLCBpbmRlbnQgPSAwLCBuZXdsaW5lID0gdHJ1ZSwgaWdub3JlVW5kZWZpbmVkID0gdHJ1ZSkge1xuICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkICYmIGlnbm9yZVVuZGVmaW5lZCkgcmV0dXJuIFwiXCI7XG4gICAgcmV0dXJuIEdlblV0aWxzLmdldEluZGVudChpbmRlbnQpICsga2V5ICsgXCI6IFwiICsgdmFsdWUgKyAobmV3bGluZSA/ICdcXG4nIDogXCJcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZXBsYWNlIGJpZyBpbnRlZ2VycyAoMTYgb3IgbW9yZSBjb25zZWN1dGl2ZSBkaWdpdHMpIHdpdGggc3RyaW5ncyBpbiBvcmRlclxuICAgKiB0byBwcmVzZXJ2ZSBudW1lcmljIHByZWNpc2lvbi5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzdHIgaXMgdGhlIHN0cmluZyB0byBiZSBtb2RpZmllZFxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IHRoZSBtb2RpZmllZCBzdHJpbmcgd2l0aCBiaWcgbnVtYmVycyBjb252ZXJ0ZWQgdG8gc3RyaW5nc1xuICAgKi9cbiAgc3RhdGljIHN0cmluZ2lmeUJpZ0ludHMoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5yZXBsYWNlKC8oXCJbXlwiXSpcIlxccyo6XFxzKikoXFxkezE2LH0pL2csICckMVwiJDJcIicpO1xuICB9XG4gIFxuICAvKipcbiAgICogUHJpbnQgdGhlIGN1cnJlbnQgc3RhY2sgdHJhY2UuIFxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1zZyAtIG9wdGlvbmFsIG1lc3NhZ2UgdG8gcHJpbnQgd2l0aCB0aGUgdHJhY2VcbiAgICovXG4gIHN0YXRpYyBwcmludFN0YWNrVHJhY2UobXNnKSB7XG4gICAgdHJ5IHsgdGhyb3cgbmV3IEVycm9yKG1zZyk7IH1cbiAgICBjYXRjaCAoZXJyOiBhbnkpIHsgY29uc29sZS5lcnJvcihlcnIuc3RhY2spOyB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBXYWl0IGZvciB0aGUgZHVyYXRpb24uXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb25NcyAtIHRoZSBkdXJhdGlvbiB0byB3YWl0IGZvciBpbiBtaWxsaXNlY29uZHNcbiAgICovXG4gIHN0YXRpYyBhc3luYyB3YWl0Rm9yKGR1cmF0aW9uTXMpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSkgeyBzZXRUaW1lb3V0KHJlc29sdmUsIGR1cmF0aW9uTXMpOyB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEtpbGwgdGhlIGdpdmVuIG5vZGVqcyBjaGlsZCBwcm9jZXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtDaGlsZFByb2Nlc3N9IHByb2Nlc3MgLSB0aGUgbm9kZWpzIGNoaWxkIHByb2Nlc3MgdG8ga2lsbFxuICAgKiBAcGFyYW0ge251bWJlciB8IE5vZGVKUy5TaWduYWxzfSBbc2lnbmFsXSAtIHRoZSBraWxsIHNpZ25hbCwgZS5nLiBTSUdURVJNLCBTSUdLSUxMLCBTSUdJTlQgKGRlZmF1bHQpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyIHwgdW5kZWZpbmVkPn0gdGhlIGV4aXQgY29kZSBmcm9tIGtpbGxpbmcgdGhlIHByb2Nlc3NcbiAgICovXG4gIHN0YXRpYyBhc3luYyBraWxsUHJvY2Vzcyhwcm9jZXNzOiBDaGlsZFByb2Nlc3MsIHNpZ25hbD86IG51bWJlciB8IE5vZGVKUy5TaWduYWxzKTogUHJvbWlzZTxudW1iZXIgfCB1bmRlZmluZWQ+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgcHJvY2Vzcy5vbihcImV4aXRcIiwgZnVuY3Rpb24oY29kZSwgc2lnbmFsKSB7IHJlc29sdmUoY29kZSk7IH0pO1xuICAgICAgcHJvY2Vzcy5vbihcImVycm9yXCIsIGZ1bmN0aW9uKGVycikgeyByZWplY3QoZXJyKTsgfSk7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAoIXByb2Nlc3Mua2lsbChzaWduYWwgPT09IHVuZGVmaW5lZCA/IFwiU0lHSU5UXCIgOiBzaWduYWwpKSByZXNvbHZlKHVuZGVmaW5lZCk7IC8vIHJlc29sdmUgaW1tZWRpYXRlbHkgaWYgbm90IHJ1bm5pbmdcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBOb3JtYWxpemUgYSBVUkkuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXJpIC0gdGhlIFVSSSB0byBub3JtYWxpemVcbiAgICogQHJldHVybiB7c3RyaW5nfSB0aGUgbm9ybWFsaXplZCBVUklcbiAgICovXG4gIHN0YXRpYyBub3JtYWxpemVVcmkodXJpKSB7XG4gICAgaWYgKCF1cmkpIHRocm93IEVycm9yKFwiTXVzdCBwcm92aWRlIFVSSSB0byBub3JtYWxpemVcIik7XG4gICAgdXJpID0gdXJpLnJlcGxhY2UoL1xcLyQvLCBcIlwiKTsgLy8gc3RyaXAgdHJhaWxpbmcgc2xhc2hcbiAgICBpZiAoIW5ldyBSZWdFeHAoXCJeXFxcXHcrOi8vLitcIikudGVzdCh1cmkpKSB1cmk9IFwiaHR0cDovL1wiICsgdXJpOyAvLyBhc3N1bWUgaHR0cCBpZiBwcm90b2NvbCBub3QgZ2l2ZW5cbiAgICByZXR1cm4gdXJpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBhYnNvbHV0ZSB2YWx1ZSBvZiB0aGUgZ2l2ZW4gYmlnaW50IG9yIG51bWJlci5cbiAgICogXG4gICAqIEBwYXJhbSB7YmlnaW50IHwgbnVtYmVyfSBiaSAtIHRoZSBiaWdpbnQgb3IgbnVtYmVyIHRvIGdldCB0aGUgYWJzb2x1dGUgdmFsdWUgb2ZcbiAgICogQHJldHVybiB7YmlnaW50IHwgbnVtYmVyfSB0aGUgYWJzb2x1dGUgdmFsdWUgb2YgdGhlIGdpdmVuIGJpZ2ludCBvciBudW1iZXJcbiAgICovXG4gIHN0YXRpYyBhYnMoYmk6IGJpZ2ludCB8IG51bWJlcik6IGJpZ2ludCB8IG51bWJlciB7XG4gICAgcmV0dXJuIGJpIDwgMCA/IC1iaSA6IGJpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhbiBlbnVtIGtleSBuYW1lIGJ5IHZhbHVlLlxuICAgKiBcbiAgICogQHBhcmFtIHthbnl9IGVudW1UeXBlIGlzIHRoZSBlbnVtIHR5cGUgdG8gZ2V0IHRoZSBrZXkgZnJvbVxuICAgKiBAcGFyYW0ge2FueX0gZW51bVZhbHVlIGlzIHRoZSBlbnVtIHZhbHVlIHRvIGdldCB0aGUga2V5IGZvclxuICAgKiBAcmV0dXJuIHtzdHJpbmcgfCB1bmRlZmluZWR9IHRoZSBlbnVtIGtleSBuYW1lXG4gICAqL1xuICBzdGF0aWMgZ2V0RW51bUtleUJ5VmFsdWUoZW51bVR5cGU6IGFueSwgZW51bVZhbHVlOiBhbnkpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIGZvciAobGV0IGtleSBpbiBlbnVtVHlwZSkge1xuICAgICAgaWYgKGVudW1UeXBlW2tleV0gPT09IGVudW1WYWx1ZSkgcmV0dXJuIGtleTtcbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxufVxuXG4iXSwibWFwcGluZ3MiOiJ5TEFBQSxJQUFBQSxPQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxNQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxHQUFBLEdBQUFDLHVCQUFBLENBQUFILE9BQUEsZ0JBQWtDLFNBQUFJLHlCQUFBQyxXQUFBLGNBQUFDLE9BQUEsaUNBQUFDLGlCQUFBLE9BQUFELE9BQUEsT0FBQUUsZ0JBQUEsT0FBQUYsT0FBQSxXQUFBRix3QkFBQSxZQUFBQSxDQUFBQyxXQUFBLFVBQUFBLFdBQUEsR0FBQUcsZ0JBQUEsR0FBQUQsaUJBQUEsSUFBQUYsV0FBQSxZQUFBRix3QkFBQU0sR0FBQSxFQUFBSixXQUFBLFFBQUFBLFdBQUEsSUFBQUksR0FBQSxJQUFBQSxHQUFBLENBQUFDLFVBQUEsVUFBQUQsR0FBQSxNQUFBQSxHQUFBLG9CQUFBQSxHQUFBLHdCQUFBQSxHQUFBLDJCQUFBRSxPQUFBLEVBQUFGLEdBQUEsUUFBQUcsS0FBQSxHQUFBUix3QkFBQSxDQUFBQyxXQUFBLE1BQUFPLEtBQUEsSUFBQUEsS0FBQSxDQUFBQyxHQUFBLENBQUFKLEdBQUEsV0FBQUcsS0FBQSxDQUFBRSxHQUFBLENBQUFMLEdBQUEsT0FBQU0sTUFBQSxVQUFBQyxxQkFBQSxHQUFBQyxNQUFB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