"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _assert = _interopRequireDefault(require("assert"));
var _async = _interopRequireDefault(require("async"));


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

  /**
   * Resolve the given promise with a timeout.
   * 
   * @param promise the promise to resolve within the timeout
   * @param timeoutMs the timeout in milliseconds to resolve the promise
   * @return the result of the promise unless error thrown
   */
  static async executeWithTimeout(promise, timeoutMs) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject('Execution timed out in ' + timeoutMs + ' milliseconds');
      }, timeoutMs);
      promise.then(
        (result) => {
          clearTimeout(timeoutId);
          resolve(result);
        },
        (error) => {
          clearTimeout(timeoutId);
          reject(error);
        }
      );
    });
  }
}exports.default = GenUtils;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfYXN5bmMiLCJHZW5VdGlscyIsImlzRGVmaW5lZCIsImFyZyIsImlzVW5kZWZpbmVkIiwiaXNJbml0aWFsaXplZCIsInVuZGVmaW5lZCIsImlzVW5pbml0aWFsaXplZCIsImlzTnVtYmVyIiwiaXNOYU4iLCJwYXJzZUZsb2F0IiwiaXNGaW5pdGUiLCJpc0ludCIsInBhcnNlSW50IiwiTnVtYmVyIiwiaXNBcnJheSIsIkFycmF5IiwiaXNTdHJpbmciLCJpc0Jvb2xlYW4iLCJpc0Z1bmN0aW9uIiwiaXNPYmplY3QiLCJvYmoiLCJpc1VwcGVyQ2FzZSIsInN0ciIsInRvVXBwZXJDYXNlIiwiaXNMb3dlckNhc2UiLCJ0b0xvd2VyQ2FzZSIsImFzc2VydEhleCIsIm1zZyIsImFzc2VydFRydWUiLCJpc0hleCIsImxlbmd0aCIsIm1hdGNoIiwiaXNCYXNlMzIiLCJ0ZXN0IiwiYXNzZXJ0QmFzZTU4IiwiaXNCYXNlNTgiLCJhc3NlcnRCYXNlNjQiLCJpc0Jhc2U2NCIsImJ0b2EiLCJhdG9iIiwiZXJyIiwiZmFpbCIsIkVycm9yIiwiY29uZGl0aW9uIiwiYXNzZXJ0RmFsc2UiLCJib29sIiwiYXNzZXJ0TnVsbCIsImFzc2VydE5vdE51bGwiLCJhc3NlcnREZWZpbmVkIiwiYXNzZXJ0VW5kZWZpbmVkIiwiYXNzZXJ0SW5pdGlhbGl6ZWQiLCJhc3NlcnRVbmluaXRpYWxpemVkIiwiYXNzZXJ0RXF1YWxzIiwiYXJnMSIsImFyZzIiLCJlcXVhbHMiLCJhc3NlcnROb3RFcXVhbHMiLCJhc3NlcnRJbnQiLCJhc3NlcnROdW1iZXIiLCJhc3NlcnRCb29sZWFuIiwiYXNzZXJ0U3RyaW5nIiwiYXNzZXJ0QXJyYXkiLCJhc3NlcnRGdW5jdGlvbiIsImFzc2VydE9iamVjdCIsIm5hbWUiLCJpbmhlcml0c0Zyb20iLCJjaGlsZCIsInBhcmVudCIsInByb3RvdHlwZSIsIk9iamVjdCIsImNyZWF0ZSIsImNvbnN0cnVjdG9yIiwiaW52b2tlIiwiZm5zIiwiYXJndW1lbnRzIiwiYXJncyIsImkiLCJwdXNoIiwiYXBwbHkiLCJnZXRQb3dlclNldCIsImFyciIsImZuIiwibiIsInNyYyIsImdvdCIsImFsbCIsImoiLCJzbGljZSIsImNvbmNhdCIsImdldFBvd2VyU2V0T2ZMZW5ndGgiLCJzaXplIiwicG93ZXJTZXQiLCJwb3dlclNldE9mTGVuZ3RoIiwiZ2V0SW5kaWNlcyIsImluZGljZXMiLCJ0b1VuaXF1ZUFycmF5IiwiZmlsdGVyIiwidmFsdWUiLCJpbmRleCIsInNlbGYiLCJpbmRleE9mIiwiY29weUFycmF5IiwiY29weSIsInJlbW92ZSIsInZhbCIsImZvdW5kIiwic3BsaWNlIiwidG9Mb3dlckNhc2VBcnJheSIsImFycjIiLCJsaXN0aWZ5IiwiYXJyT3JFbGVtIiwiYXJyYXlDb250YWlucyIsImNvbXBhcmVCeVJlZmVyZW5jZSIsInN0ckNvbnRhaW5zIiwic3Vic3RyaW5nIiwiYXJyYXlzRXF1YWwiLCJhcnIxIiwib2JqZWN0c0VxdWFsIiwibWFwMSIsIm1hcDIiLCJrZXlzMSIsImtleXMiLCJrZXlzMiIsImtleTEiLCJrZXkyIiwiZGVsZXRlVW5kZWZpbmVkS2V5cyIsImtleSIsImdldENvbWJpbmF0aW9ucyIsImNvbWJpbmF0aW9uU2l6ZSIsImluZGV4Q29tYmluYXRpb25zIiwiY29tYmluYXRpb25zIiwiaW5kZXhDb21iaW5hdGlvbnNJZHgiLCJpbmRleENvbWJpbmF0aW9uIiwiY29tYmluYXRpb24iLCJpbmRleENvbWJpbmF0aW9uSWR4IiwiZ2V0RG93bmxvYWRhYmxlQSIsImNvbnRlbnRzIiwiYSIsIndpbmRvdyIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImhyZWYiLCJVUkwiLCJjcmVhdGVPYmplY3RVUkwiLCJCbG9iIiwidHlwZSIsImRvd25sb2FkIiwidGFyZ2V0IiwiaW5uZXJIVE1MIiwiY29weVByb3BlcnRpZXMiLCJKU09OIiwicGFyc2UiLCJzdHJpbmdpZnkiLCJkZWxldGVQcm9wZXJ0aWVzIiwicHJvcHMiLCJwcm9wIiwidG9TdHJpbmciLCJoYXNXaGl0ZXNwYWNlIiwiaXNXaGl0ZXNwYWNlIiwiY2hhciIsImlzTmV3bGluZSIsImNvdW50Tm9uV2hpdGVzcGFjZUNoYXJhY3RlcnMiLCJjb3VudCIsImNoYXJBdCIsImdldFdoaXRlc3BhY2VUb2tlbnMiLCJnZXRMaW5lcyIsImdldEludGVybmFsU3R5bGVTaGVldCIsInN0eWxlU2hlZXRzIiwic3R5bGVTaGVldCIsImdldEludGVybmFsU3R5bGVTaGVldFRleHQiLCJpbnRlcm5hbENzcyIsImludGVybmFsU3R5bGVTaGVldCIsImNzc1J1bGVzIiwiY3NzVGV4dCIsImJ1aWxkSHRtbERvY3VtZW50IiwiY29udGVudCIsIm1ldGFzIiwibWV0YSIsImVsZW0iLCJoYXNPd25Qcm9wZXJ0eSIsInNldEF0dHJpYnV0ZSIsIm91dGVySFRNTCIsInRpdGxlIiwiZGVwZW5kZW5jeVBhdGhzIiwiZGVwZW5kZW5jeVBhdGgiLCJlbmRzV2l0aCIsImRpdiIsIiQiLCJhcHBlbmQiLCJjbG9uZSIsImh0bWwiLCJuZXdXaW5kb3ciLCJvbkxvYWQiLCJvbkxvYWRDYWxsZWQiLCJ3Iiwib3BlbiIsIm9uTG9hZE9uY2UiLCJvcGVuZXIiLCJ3cml0ZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJjbG9zZSIsImltZ1RvRGF0YVVybCIsImltZyIsInF1YWxpdHkiLCJjYW52YXMiLCJoZWlnaHQiLCJuYXR1cmFsSGVpZ2h0Iiwid2lkdGgiLCJuYXR1cmFsV2lkdGgiLCJjb250ZXh0IiwiZ2V0Q29udGV4dCIsImRyYXdJbWFnZSIsInRvRGF0YVVSTCIsImlzSW1hZ2VBY2Nlc3NpYmxlIiwidXJsIiwidGltZW91dCIsIm9uRG9uZSIsInJldHVybmVkIiwiSW1hZ2UiLCJvbmxvYWQiLCJvblJlc3BvbnNlIiwib25lcnJvciIsIkRhdGUiLCJzZXRUaW1lb3V0Iiwic2V0SW1tZWRpYXRlIiwiZSIsImlzWmlwRmlsZSIsImZpbGUiLCJpc0pzb25GaWxlIiwiaXNUeHRGaWxlIiwiZ2V0SW1hZ2VzIiwicGF0aHMiLCJmdW5jcyIsImxvYWRGdW5jIiwiYXN5bmMiLCJwYXJhbGxlbCIsInBhdGgiLCJnZXRJbmRlbnQiLCJpbml0UG9seWZpbGxzIiwiYXNzaWduIiwiZGVmaW5lUHJvcGVydHkiLCJ2YXJBcmdzIiwiVHlwZUVycm9yIiwidG8iLCJuZXh0U291cmNlIiwibmV4dEtleSIsImNhbGwiLCJ3cml0YWJsZSIsImNvbmZpZ3VyYWJsZSIsIlN0cmluZyIsInN0YXJ0c1dpdGgiLCJzZWFyY2hTdHJpbmciLCJwb3NpdGlvbiIsInN1YnN0ciIsImdldFVVSUQiLCJyZXBsYWNlIiwiYyIsInIiLCJNYXRoIiwicmFuZG9tIiwidiIsImlzQnJvd3NlciIsImlzV29ya2VyIiwiaW1wb3J0U2NyaXB0cyIsImlzQnJvd3Nlck1haW4iLCJGdW5jdGlvbiIsImlzSnNEb20iLCJpc0ZpcmVmb3giLCJuYXZpZ2F0b3IiLCJ1c2VyQWdlbnQiLCJnZXRJRVZlcnNpb24iLCJ1YSIsIm1zaWUiLCJ0cmlkZW50IiwicnYiLCJlZGdlIiwiZ2V0UGFyYW1ldGVyQnlOYW1lIiwibG9jYXRpb24iLCJyZWdleCIsIlJlZ0V4cCIsInJlc3VsdHMiLCJleGVjIiwiZGVjb2RlVVJJQ29tcG9uZW50IiwiZ2V0UmFuZG9tSW50IiwibWluIiwibWF4IiwiY2VpbCIsImZsb29yIiwiZ2V0UmFuZG9tSW50cyIsImludHMiLCJnZXRVbmlxdWVSYW5kb21JbnRzIiwicmFuZG9tSW50IiwiaW5jbHVkZXMiLCJzaHVmZmxlIiwiYXJyYXkiLCJ0ZW1wIiwic29ydCIsImIiLCJzYWZlU2V0IiwiZ2V0Rm4iLCJzZXRGbiIsImNvbmZpZyIsImVyck1zZyIsImN1clZhbCIsInJlY29uY2lsZWRWYWwiLCJyZWNvbmNpbGUiLCJ2YWwxIiwidmFsMiIsImNvbXBhcmlzb24iLCJyZXNvbHZlRGVmaW5lZCIsInJlc29sdmVUcnVlIiwiYXNzZXJ0IiwiZXF1YWwiLCJyZXNvbHZlTWF4IiwiZGVlcEVxdWFsIiwia3ZMaW5lIiwiaW5kZW50IiwibmV3bGluZSIsImlnbm9yZVVuZGVmaW5lZCIsInN0cmluZ2lmeUJpZ0ludHMiLCJwcmludFN0YWNrVHJhY2UiLCJjb25zb2xlIiwiZXJyb3IiLCJzdGFjayIsIndhaXRGb3IiLCJkdXJhdGlvbk1zIiwiUHJvbWlzZSIsInJlc29sdmUiLCJraWxsUHJvY2VzcyIsInByb2Nlc3MiLCJzaWduYWwiLCJyZWplY3QiLCJvbiIsImNvZGUiLCJraWxsIiwibm9ybWFsaXplVXJpIiwidXJpIiwiYWJzIiwiYmkiLCJnZXRFbnVtS2V5QnlWYWx1ZSIsImVudW1UeXBlIiwiZW51bVZhbHVlIiwiZXhlY3V0ZVdpdGhUaW1lb3V0IiwicHJvbWlzZSIsInRpbWVvdXRNcyIsInRpbWVvdXRJZCIsInRoZW4iLCJyZXN1bHQiLCJjbGVhclRpbWVvdXQiLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL2NvbW1vbi9HZW5VdGlscy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXNzZXJ0IGZyb20gXCJhc3NlcnRcIjtcbmltcG9ydCBhc3luYyBmcm9tIFwiYXN5bmNcIjtcbmltcG9ydCB7IENoaWxkUHJvY2VzcyB9IGZyb20gXCJjaGlsZF9wcm9jZXNzXCI7XG5cbi8qKlxuICogTUlUIExpY2Vuc2VcbiAqIFxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICogXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcbiAqIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKiBcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbi8qKlxuICogQ29sbGVjdGlvbiBvZiBnZW5lcmFsIHB1cnBvc2UgdXRpbGl0aWVzLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBHZW5VdGlscyB7XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBnaXZlbiBhcmd1bWVudCBpcyBkZWZpbmVkLlxuICAgKiBcbiAgICogQHBhcmFtIHthbnl9IGFyZyBpcyB0aGUgYXJnIHRvIHRlc3RcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgZ2l2ZW4gYXJnIGlzIGRlZmluZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGlzRGVmaW5lZChhcmc6IGFueSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0eXBlb2YgYXJnICE9PSAndW5kZWZpbmVkJztcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIHVuZGVmaW5lZC5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcgaXMgdGhlIGFyZyB0byB0ZXN0XG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGdpdmVuIGFyZyBpcyB1bmRlZmluZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGlzVW5kZWZpbmVkKGFyZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0eXBlb2YgYXJnID09PSAndW5kZWZpbmVkJztcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGdpdmVuIGFyZyBpcyBpbml0aWFsaXplZC5cbiAgICogXG4gICAqIEBwYXJhbSB7YW55fSBhcmcgaXMgdGhlIGFyZyB0byB0ZXN0XG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGdpdmVuIGFyZyBpcyBpbml0aWFsaXplZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaXNJbml0aWFsaXplZChhcmc6IGFueSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBhcmcgIT09IHVuZGVmaW5lZCAmJiBhcmcgIT09IG51bGw7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBnaXZlbiBhcmcgaXMgdW5pbml0aWFsaXplZC5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcgaXMgdGhlIGFyZyB0byB0ZXN0XG4gICAqIEByZXR1cm4gdHJ1ZSBpZiB0aGUgZ2l2ZW4gYXJnIGlzIHVuaW5pdGlhbGl6ZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGlzVW5pbml0aWFsaXplZChhcmc6IGFueSk6IGJvb2xlYW4ge1xuICAgIGlmICghYXJnKSByZXR1cm4gdHJ1ZTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhIG51bWJlci5cbiAgICogXG4gICAqIEBwYXJhbSB7YW55fSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIHRlc3RcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgYXJndW1lbnQgaXMgYSBudW1iZXIsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGlzTnVtYmVyKGFyZzogYW55KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuICFpc05hTihwYXJzZUZsb2F0KGFyZykpICYmIGlzRmluaXRlKGFyZyk7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhbiBpbnRlZ2VyLlxuICAgKiBcbiAgICogQHBhcmFtIHthbnl9IGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gdGVzdFxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhbiBpbnRlZ2VyLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc0ludChhcmc6IGFueSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBhcmcgPT09IHBhcnNlSW50KFwiXCIgKyBOdW1iZXIoYXJnKSkgJiYgIWlzTmFOKGFyZykgJiYgIWlzTmFOKHBhcnNlSW50KGFyZywgMTApKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGFuIGFycmF5LlxuICAgKiBcbiAgICogQHBhcmFtIHthbnl9IGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gdGVzdCBhcyBiZWluZyBhbiBhcnJheVxuICAgKiBAcmV0dXJuIHtib29vbGVhbn0gdHJ1ZSBpZiB0aGUgYXJndW1lbnQgaXMgYW4gYXJyYXksIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGlzQXJyYXkoYXJnOiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gYXJnIGluc3RhbmNlb2YgQXJyYXkgJiYgQXJyYXkuaXNBcnJheShhcmcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYSBzdHJpbmcuXG4gICAqIFxuICAgKiBAcGFyYW0ge2FueX0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byB0ZXN0IGFzIGJlaW5nIGEgc3RyaW5nXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGFyZ3VtZW50IGlzIGEgc3RyaW5nLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc1N0cmluZyhhcmc6IGFueSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJztcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIGlmIHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhIGJvb2xlYW4uXG4gICAqIFxuICAgKiBAcGFyYW0ge2FueX0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byB0ZXN0IGFzIGJlaW5nIGEgYm9vbGVhblxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBhcmd1bWVudCBpcyBhIGJvb2xlYW4sIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGlzQm9vbGVhbihhcmc6IGFueSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0eXBlb2YoYXJnKSA9PSB0eXBlb2YodHJ1ZSk7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyBpZiB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYSBzdGF0aWMuXG4gICAqIFxuICAgKiBAcGFyYW0ge2FueX0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byB0ZXN0IGFzIGJlaW5nIGEgc3RhdGljXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGFyZ3VtZW50IGlzIGEgc3RhdGljLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc0Z1bmN0aW9uKGFyZzogYW55KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHR5cGVvZiBhcmcgPT09IFwiZnVuY3Rpb25cIjtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGFuIG9iamVjdCBhbmQgb3B0aW9uYWxseSBpZiBpdCBoYXMgdGhlIGdpdmVuIGNvbnN0cnVjdG9yIG5hbWUuXG4gICAqIFxuICAgKiBAcGFyYW0ge2FueX0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byB0ZXN0XG4gICAqIEBwYXJhbSB7YW55fSBvYmogaXMgYW4gb2JqZWN0IHRvIHRlc3QgYXJnIGluc3RhbmNlb2Ygb2JqIChvcHRpb25hbClcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYW4gb2JqZWN0IGFuZCBvcHRpb25hbGx5IGhhcyB0aGUgZ2l2ZW4gY29uc3RydWN0b3IgbmFtZVxuICAgKi9cbiAgc3RhdGljIGlzT2JqZWN0KGFyZzogYW55LCBvYmo/OiBhbnkpOiBib29sZWFuIHtcbiAgICBpZiAoIWFyZykgcmV0dXJuIGZhbHNlO1xuICAgIGlmICh0eXBlb2YgYXJnICE9PSAnb2JqZWN0JykgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChvYmogJiYgIShhcmcgaW5zdGFuY2VvZiBvYmopKSByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyBpZiBhbGwgYWxwaGFiZXQgY2hhcmFjdGVycyBpbiB0aGUgZ2l2ZW4gc3RyaW5nIGFyZSB1cHBlciBjYXNlLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHN0ciBpcyB0aGUgc3RyaW5nIHRvIHRlc3RcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgc3RyaW5nIGlzIHVwcGVyIGNhc2UsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGlzVXBwZXJDYXNlKHN0cjogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHN0ci50b1VwcGVyQ2FzZSgpID09PSBzdHI7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyBpZiBhbGwgYWxwaGFiZXQgY2hhcmFjdGVycyBpbiB0aGUgZ2l2ZW4gc3RyaW5nIGFyZSBsb3dlciBjYXNlLlxuICAgKiBcbiAgICogQHBhcmFtIHN0ciBpcyB0aGUgc3RyaW5nIHRvIHRlc3RcbiAgICogQHBhcmFtIHRydWUgaWYgdGhlIHN0cmluZyBpcyBsb3dlciBjYXNlLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc0xvd2VyQ2FzZShzdHIpIHtcbiAgICByZXR1cm4gc3RyLnRvTG93ZXJDYXNlKCkgPT09IHN0cjtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGhleC5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIGFzc2VydCBhcyBoZXhcbiAgICogQHBhcmFtIG1zZyBpcyB0aGUgbWVzc2FnZSB0byB0aHJvdyBpZiB0aGUgYXJndW1lbnQgaXMgbm90IGhleFxuICAgKi9cbiAgc3RhdGljIGFzc2VydEhleChzdHIsIG1zZykge1xuICAgIEdlblV0aWxzLmFzc2VydFRydWUoR2VuVXRpbHMuaXNIZXgoc3RyKSwgbXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBoZXggYnV0IGlzIG5vdCBoZXhcIik7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhIGhleGlkZW1hbCBzdHJpbmcuXG4gICAqIFxuICAgKiBDcmVkaXQ6IGh0dHBzOi8vZ2l0aHViLmNvbS9yb3J5cmpiL2lzLWhleC9ibG9iL21hc3Rlci9pcy1oZXguanMuXG4gICAqIFxuICAgKiBAcGFyYW0gc3RyIGlzIHRoZSBzdHJpbmcgdG8gdGVzdFxuICAgKiBAcmV0dXJuIHRydWUgaWYgdGhlIGdpdmVuIHN0cmluZyBpcyBoZXhpZGVjaW1hbCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaXNIZXgoYXJnKSB7XG4gICAgaWYgKHR5cGVvZiBhcmcgIT09ICdzdHJpbmcnKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKGFyZy5sZW5ndGggPT09IDApIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gKGFyZy5tYXRjaCgvKFswLTldfFthLWZdKS9naW0pIHx8IFtdKS5sZW5ndGggPT09IGFyZy5sZW5ndGg7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyBpZiB0aGUgZ2l2ZW4gc3RyaW5nIGlzIGJhc2UzMi5cbiAgICovXG4gIHN0YXRpYyBpc0Jhc2UzMihzdHIpIHtcbiAgICBpZiAodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHJldHVybiBmYWxzZTtcbiAgICBHZW5VdGlscy5hc3NlcnRUcnVlKHN0ci5sZW5ndGggPiAwLCBcIkNhbm5vdCBkZXRlcm1pbmUgaWYgZW1wdHkgc3RyaW5nIGlzIGJhc2UzMlwiKTtcbiAgICByZXR1cm4gL15bQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVoyMzQ1NjddKyQvLnRlc3Qoc3RyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGJhc2U1OC5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIGFzc2VydCBhcyBiYXNlNThcbiAgICogQHBhcmFtIG1zZyBpcyB0aGUgbWVzc2FnZSB0byB0aHJvdyBpZiB0aGUgYXJndW1lbnQgaXMgbm90IGJhc2U1OFxuICAgKi9cbiAgc3RhdGljIGFzc2VydEJhc2U1OChzdHIsIG1zZykge1xuICAgIEdlblV0aWxzLmFzc2VydFRydWUoR2VuVXRpbHMuaXNCYXNlNTgoc3RyKSwgbXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBiYXNlNTggYnV0IGlzIG5vdCBiYXNlNThcIik7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyBpZiB0aGUgZ2l2ZW4gc3RyaW5nIGlzIGJhc2U1OC5cbiAgICovXG4gIHN0YXRpYyBpc0Jhc2U1OChzdHIpIHtcbiAgICBpZiAodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHJldHVybiBmYWxzZTtcbiAgICBHZW5VdGlscy5hc3NlcnRUcnVlKHN0ci5sZW5ndGggPiAwLCBcIkNhbm5vdCBkZXRlcm1pbmUgaWYgZW1wdHkgc3RyaW5nIGlzIGJhc2U1OFwiKTtcbiAgICByZXR1cm4gL15bMTIzNDU2Nzg5QUJDREVGR0hKS0xNTlBRUlNUVVZXWFlaYWJjZGVmZ2hpamttbm9wcXJzdHV2d3h5el0rJC8udGVzdChzdHIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYmFzZTY0LlxuICAgKiBcbiAgICogQHBhcmFtIGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gYXNzZXJ0IGFzIGJhc2U2NFxuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIHRoZSBhcmd1bWVudCBpcyBub3QgYmFzZTY0XG4gICAqL1xuICBzdGF0aWMgYXNzZXJ0QmFzZTY0KHN0ciwgbXNnKSB7XG4gICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZShHZW5VdGlscy5pc0Jhc2U2NChzdHIpLCBtc2cgPyBtc2cgOiBcIkFyZ3VtZW50IGFzc2VydGVkIGFzIGJhc2U2NCBidXQgaXMgbm90IGJhc2U2NFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIGlmIHRoZSBnaXZlbiBzdHJpbmcgaXMgYmFzZTY0LlxuICAgKi9cbiAgc3RhdGljIGlzQmFzZTY0KHN0cikge1xuICAgIGlmICh0eXBlb2Ygc3RyICE9PSAnc3RyaW5nJykgcmV0dXJuIGZhbHNlO1xuICAgIEdlblV0aWxzLmFzc2VydFRydWUoc3RyLmxlbmd0aCA+IDAsIFwiQ2Fubm90IGRldGVybWluZSBpZiBlbXB0eSBzdHJpbmcgaXMgYmFzZTY0XCIpO1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gYnRvYShhdG9iKHN0cikpID09IHN0cjtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVGhyb3dzIGFuIGV4Y2VwdGlvbiB3aXRoIHRoZSBnaXZlbiBtZXNzYWdlLlxuICAgKiBcbiAgICogQHBhcmFtIG1zZyBkZWZpbmVzIHRoZSBtZXNzYWdlIHRvIHRocm93IHRoZSBleGNlcHRpb24gd2l0aCAob3B0aW9uYWwpXG4gICAqL1xuICBzdGF0aWMgZmFpbChtc2c/KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKG1zZyA/IG1zZyA6IFwiRmFpbHVyZSAobm8gbWVzc2FnZSlcIik7XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBjb25kaXRpb24gaXMgdHJ1ZS4gIFRocm93cyBhbiBleGNlcHRpb24gaWYgbm90IGEgYm9vbGVhbiBvciBmYWxzZS5cbiAgICogXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gY29uZGl0aW9uIGlzIHRoZSBib29sZWFuIHRvIGFzc2VydCB0cnVlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbbXNnXSBpcyB0aGUgbWVzc2FnZSB0byB0aHJvdyBpZiBjb25kaXRpb24gaXMgZmFsc2UgKG9wdGlvbmFsKVxuICAgKi9cbiAgc3RhdGljIGFzc2VydFRydWUoY29uZGl0aW9uLCBtc2c/KSB7XG4gICAgaWYgKHR5cGVvZiBjb25kaXRpb24gIT09ICdib29sZWFuJykgdGhyb3cgbmV3IEVycm9yKFwiQXJndW1lbnQgaXMgbm90IGEgYm9vbGVhblwiKTtcbiAgICBpZiAoIWNvbmRpdGlvbikgdGhyb3cgbmV3IEVycm9yKG1zZyA/IG1zZyA6IFwiQm9vbGVhbiBhc3NlcnRlZCBhcyB0cnVlIGJ1dCB3YXMgZmFsc2VcIik7XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBib29sZWFuIGlzIGZhbHNlLiAgVGhyb3dzIGFuIGV4Y2VwdGlvbiBpZiBub3QgYSBib29sZWFuIG9yIHRydWUuXG4gICAqIFxuICAgKiBAcGFyYW0gYm9vbCBpcyB0aGUgYm9vbGVhbiB0byBhc3NlcnQgZmFsc2VcbiAgICogQHBhcmFtIG1zZyBpcyB0aGUgbWVzc2FnZSB0byB0aHJvdyBpZiBib29sIGlzIHRydWUgKG9wdGlvbmFsKVxuICAgKi9cbiAgc3RhdGljIGFzc2VydEZhbHNlKGJvb2wsIG1zZz8pIHtcbiAgICBpZiAodHlwZW9mIGJvb2wgIT09ICdib29sZWFuJykgdGhyb3cgbmV3IEVycm9yKFwiQXJndW1lbnQgaXMgbm90IGEgYm9vbGVhblwiKTtcbiAgICBpZiAoYm9vbCkgdGhyb3cgbmV3IEVycm9yKG1zZyA/IG1zZyA6IFwiQm9vbGVhbiBhc3NlcnRlZCBhcyBmYWxzZSBidXQgd2FzIHRydWVcIik7XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBhcmd1bWVudCBpcyBudWxsLiAgVGhyb3dzIGFuIGV4Y2VwdGlvbiBpZiBub3QgbnVsbC5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIGFzc2VydCBudWxsXG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgYXJnIGlzIG5vdCBudWxsIChvcHRpb25hbClcbiAgICovXG4gIHN0YXRpYyBhc3NlcnROdWxsKGFyZywgbXNnPykge1xuICAgIGlmIChhcmcgIT09IG51bGwpIHRocm93IG5ldyBFcnJvcihtc2cgPyBtc2cgOiBcIkFyZ3VtZW50IGFzc2VydGVkIGFzIG51bGwgYnV0IHdhcyBub3QgbnVsbDogXCIgKyBhcmcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgbm90IG51bGwuICBUaHJvd3MgYW4gZXhjZXB0aW9uIGlmIG51bGwuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byBhc3NlcnQgbm90IG51bGxcbiAgICogQHBhcmFtIG1zZyBpcyB0aGUgbWVzc2FnZSB0byB0aHJvdyBpZiBhcmcgaXMgbnVsbCAob3B0aW9uYWwpXG4gICAqL1xuICBzdGF0aWMgYXNzZXJ0Tm90TnVsbChhcmcsIG1zZz8pIHtcbiAgICBpZiAoYXJnID09PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBub3QgbnVsbCBidXQgd2FzIG51bGxcIik7XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBhcmd1bWVudCBpcyBkZWZpbmVkLiAgVGhyb3dzIGFuIGV4Y2VwdGlvbiBpZiB1bmRlZmluZWQuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byBhc3NlcnQgZGVmaW5lZFxuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIGFyZyBpcyB1bmRlZmluZWQgKG9wdGlvbmFsKVxuICAgKi9cbiAgc3RhdGljIGFzc2VydERlZmluZWQoYXJnLCBtc2c/KSB7XG4gICAgaWYgKEdlblV0aWxzLmlzVW5kZWZpbmVkKGFyZykpIHRocm93IG5ldyBFcnJvcihtc2cgPyBtc2cgOiBcIkFyZ3VtZW50IGFzc2VydGVkIGFzIGRlZmluZWQgYnV0IHdhcyB1bmRlZmluZWRcIik7XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBhcmd1bWVudCBpcyB1bmRlZmluZWQuICBUaHJvd3MgYW4gZXhjZXB0aW9uIGlmIGRlZmluZWQuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byBhc3NlcnQgdW5kZWZpbmVkXG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgYXJnIGlzIGRlZmluZWQgKG9wdGlvbmFsKVxuICAgKi9cbiAgc3RhdGljIGFzc2VydFVuZGVmaW5lZChhcmcsIG1zZz8pIHtcbiAgICBpZiAoR2VuVXRpbHMuaXNEZWZpbmVkKGFyZykpIHRocm93IG5ldyBFcnJvcihtc2cgPyBtc2cgOiBcIkFyZ3VtZW50IGFzc2VydGVkIGFzIHVuZGVmaW5lZCBidXQgd2FzIGRlZmluZWQ6IFwiICsgYXJnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGluaXRpYWxpemVkLiAgVGhyb3dzIGFuIGV4Y2VwdGlvbiBpZiBub3QgaW5pdGlhbGl6ZWQuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byBhc3NlcnQgYXMgaW5pdGlhbGl6ZWRcbiAgICogQHBhcmFtIG1zZyBpcyB0aGUgbWVzc2FnZSB0byB0aHJvdyBpZiBhcmcgaXMgbm90IGluaXRpYWxpemVkIChvcHRpb25hbClcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRJbml0aWFsaXplZChhcmcsIG1zZz8pIHtcbiAgICBpZiAoR2VuVXRpbHMuaXNVbmluaXRpYWxpemVkKGFyZykpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihtc2cgPyBtc2cgOiBcIkFyZ3VtZW50IGFzc2VydGVkIGFzIGluaXRpYWxpemVkIGJ1dCB3YXMgXCIgKyBhcmcpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIHVuaW5pdGlhbGl6ZWQuICBUaHJvd3MgYW4gZXhjZXB0aW9uIGlmIGluaXRpYWxpemVkLlxuICAgKiBcbiAgICogQHBhcmFtIGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gYXNzZXJ0IGFzIHVuaW5pdGlhbGl6ZWRcbiAgICogQHBhcmFtIG1zZyBpcyB0aGUgbWVzc2FnZSB0byB0aHJvdyBpZiBhcmcgaXMgaW5pdGlhbGl6ZWQgKG9wdGlvbmFsKVxuICAgKi9cbiAgc3RhdGljIGFzc2VydFVuaW5pdGlhbGl6ZWQoYXJnLCBtc2c/KSB7XG4gICAgaWYgKEdlblV0aWxzLmlzSW5pdGlhbGl6ZWQoYXJnKSkgdGhyb3cgbmV3IEVycm9yKG1zZyA/IG1zZyA6IFwiQXJndW1lbnQgYXNzZXJ0ZWQgYXMgdW5pbml0aWFsaXplZCBidXQgd2FzIGluaXRpYWxpemVkXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYXJndW1lbnRzIGFyZSBlcXVhbC4gIFRocm93cyBhbiBleGNlcHRpb24gaWYgbm90IGVxdWFsLlxuICAgKiBcbiAgICogQHBhcmFtIGFyZzEgaXMgYW4gYXJndW1lbnQgdG8gYXNzZXJ0IGFzIGVxdWFsXG4gICAqIEBwYXJhbSBhcmcyIGlzIGFuIGFyZ3VtZW50IHRvIGFzc2VydCBhcyBlcXVhbFxuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIHRoZSBhcmd1bWVudHMgYXJlIG5vdCBlcXVhbFxuICAgKi9cbiAgc3RhdGljIGFzc2VydEVxdWFscyhhcmcxLCBhcmcyLCBtc2c/KSB7XG4gICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZShHZW5VdGlscy5lcXVhbHMoYXJnMSwgYXJnMiksIG1zZyA/IG1zZyA6IFwiQXJndW1lbnRzIGFzc2VydGVkIGFzIGVxdWFsIGJ1dCBhcmUgbm90IGVxdWFsOiBcIiArIGFyZzEgKyBcIiB2cyBcIiArIGFyZzIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYXJndW1lbnRzIGFyZSBub3QgZXF1YWwuICBUaHJvd3MgYW4gZXhjZXB0aW9uIGlmIGVxdWFsLlxuICAgKiBcbiAgICogQHBhcmFtIGFyZzEgaXMgYW4gYXJndW1lbnQgdG8gYXNzZXJ0IGFzIG5vdCBlcXVhbFxuICAgKiBAcGFyYW0gYXJnMiBpcyBhbiBhcmd1bWVudCB0byBhc3NlcnQgYXMgbm90IGVxdWFsXG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgdGhlIGFyZ3VtZW50cyBhcmUgZXF1YWxcbiAgICovXG4gIHN0YXRpYyBhc3NlcnROb3RFcXVhbHMoYXJnMSwgYXJnMiwgbXNnPykge1xuICAgIGlmIChhcmcxID09PSBhcmcyKSB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudHMgYXNzZXJ0ZWQgYXMgbm90IGVxdWFsIGJ1dCBhcmUgZXF1YWw6IFwiICsgYXJnMSArIFwiIHZzIFwiICsgYXJnMik7XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhbiBpbnRlZ2VyLlxuICAgKiBcbiAgICogQHBhcmFtIGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gYXNzZXJ0IGFzIGFuIGludGVnZXJcbiAgICogQHBhcmFtIG1zZyBpcyB0aGUgbWVzc2FnZSB0byB0aHJvdyBpZiB0aGUgYXJndW1lbnQgaXMgbm90IGFuIGludGVnZXJcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRJbnQoYXJnLCBtc2c/KSB7XG4gICAgaWYgKCFHZW5VdGlscy5pc0ludChhcmcpKSB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBhbiBpbnRlZ2VyIGJ1dCBpcyBub3QgYW4gaW50ZWdlclwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGEgbnVtYmVyLlxuICAgKiBcbiAgICogQHBhcmFtIGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gYXNzZXJ0IGFzIGEgbnVtYmVyXG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgdGhlIGFyZ3VtZW50IGlzIG5vdCBhIG51bWJlclxuICAgKi9cbiAgc3RhdGljIGFzc2VydE51bWJlcihhcmcsIG1zZz8pIHtcbiAgICBpZiAoIUdlblV0aWxzLmlzTnVtYmVyKGFyZykpIHRocm93IG5ldyBFcnJvcihtc2cgPyBtc2cgOiBcIkFyZ3VtZW50IGFzc2VydGVkIGFzIGEgbnVtYmVyIGJ1dCBpcyBub3QgYSBudW1iZXJcIik7XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhIGJvb2xlYW4uXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byBhc3NlcnQgYXMgYSBib29sZWFuXG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgdGhlIGFyZ3VtZW50IGlzIG5vdCBhIGJvb2xlYW5cbiAgICovXG4gIHN0YXRpYyBhc3NlcnRCb29sZWFuKGFyZywgbXNnPykge1xuICAgIGlmICghR2VuVXRpbHMuaXNCb29sZWFuKGFyZykpIHRocm93IG5ldyBFcnJvcihtc2cgPyBtc2cgOiBcIkFyZ3VtZW50IGFzc2VydGVkIGFzIGEgYm9vbGVhbiBidXQgaXMgbm90IGEgYm9vbGVhblwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGEgc3RyaW5nLlxuICAgKiBcbiAgICogQHBhcmFtIGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gYXNzZXJ0IGFzIGEgc3RyaW5nXG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgdGhlIGFyZ3VtZW50IGlzIG5vdCBhIHN0cmluZ1xuICAgKi9cbiAgc3RhdGljIGFzc2VydFN0cmluZyhhcmcsIG1zZz8pIHtcbiAgICBpZiAoIUdlblV0aWxzLmlzU3RyaW5nKGFyZykpIHRocm93IG5ldyBFcnJvcihtc2cgPyBtc2cgOiBcIkFyZ3VtZW50IGFzc2VydGVkIGFzIGEgc3RyaW5nIGJ1dCBpcyBub3QgYSBzdHJpbmc6IFwiICsgYXJnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGFuIGFycmF5LlxuICAgKiBcbiAgICogQHBhcmFtIGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gYXNzZXJ0IGFzIGFuIGFycmF5XG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgdGhlIGFyZ3VtZW50IGlzIG5vdCBhbiBhcnJheVxuICAgKi9cbiAgc3RhdGljIGFzc2VydEFycmF5KGFyZywgbXNnPykge1xuICAgIGlmICghR2VuVXRpbHMuaXNBcnJheShhcmcpKSB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBhbiBhcnJheSBidXQgaXMgbm90IGFuIGFycmF5XCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYSBzdGF0aWMuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byBhc3NlcnQgYXMgYSBzdGF0aWNcbiAgICogQHBhcmFtIG1zZyBpcyB0aGUgbWVzc2FnZSB0byB0aHJvdyBpZiB0aGUgYXJndW1lbnQgaXMgbm90IGEgc3RhdGljXG4gICAqL1xuICBzdGF0aWMgYXNzZXJ0RnVuY3Rpb24oYXJnLCBtc2c/KSB7XG4gICAgaWYgKCFHZW5VdGlscy5pc0Z1bmN0aW9uKGFyZykpIHRocm93IG5ldyBFcnJvcihtc2cgPyBtc2cgOiBcIkFyZ3VtZW50IGFzc2VydGVkIGFzIGEgc3RhdGljIGJ1dCBpcyBub3QgYSBzdGF0aWNcIik7XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhbiBvYmplY3Qgd2l0aCB0aGUgZ2l2ZW4gbmFtZS5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIHRlc3RcbiAgICogQHBhcmFtIG9iaiBpcyBhbiBvYmplY3QgdG8gYXNzZXJ0IGFyZyBpbnN0YW5jZW9mIG9iaiAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgdGhlIGFyZ3VtZW50IGlzIG5vdCB0aGUgc3BlY2lmaWVkIG9iamVjdFxuICAgKi9cbiAgc3RhdGljIGFzc2VydE9iamVjdChhcmcsIG9iaiwgbXNnPykge1xuICAgIEdlblV0aWxzLmFzc2VydEluaXRpYWxpemVkKGFyZywgbXNnKTtcbiAgICBpZiAob2JqKSB7XG4gICAgICBpZiAoIUdlblV0aWxzLmlzT2JqZWN0KGFyZywgb2JqKSkgdGhyb3cgbmV3IEVycm9yKG1zZyA/IG1zZyA6IFwiQXJndW1lbnQgYXNzZXJ0ZWQgYXMgb2JqZWN0ICdcIiArIG9iai5uYW1lICsgXCInIGJ1dCB3YXMgbm90XCIpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIUdlblV0aWxzLmlzT2JqZWN0KGFyZykpIHRocm93IG5ldyBFcnJvcihtc2cgPyBtc2cgOiBcIkFyZ3VtZW50IGFzc2VydGVkIGFzIG9iamVjdCBidXQgd2FzIG5vdFwiKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgY2hpbGQncyBwcm90b3R5cGUgdG8gdGhlIHBhcmVudCdzIHByb3RvdHlwZS5cbiAgICogXG4gICAqIEBwYXJhbSBjaGlsZCBpcyB0aGUgY2hpbGQgY2xhc3NcbiAgICogQHBhcmFtIHBhcmVudCBpcyB0aGUgcGFyZW50IGNsYXNzXG4gICAqL1xuICBzdGF0aWMgaW5oZXJpdHNGcm9tKGNoaWxkLCBwYXJlbnQpIHtcbiAgICBjaGlsZC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHBhcmVudC5wcm90b3R5cGUpO1xuICAgIGNoaWxkLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGNoaWxkO1xuICB9XG5cbiAgLyoqXG4gICAqIEludm9rZXMgZnVuY3Rpb25zIHdpdGggYXJndW1lbnRzLlxuICAgKiBcbiAgICogYXJndW1lbnRzWzBdIGlzIGFzc3VtZWQgdG8gYmUgYW4gYXJyYXkgb2YgZnVuY3Rpb25zIHRvIGludm9rZVxuICAgKiBhcmd1bWVudHNbMS4uLm5dIGFyZSBhcmdzIHRvIGludm9rZSB0aGUgZnVuY3Rpb25zIHdpdGhcbiAgICovXG4gIHN0YXRpYyBpbnZva2UoKSB7XG4gICAgbGV0IGZucyA9IGFyZ3VtZW50c1swXTtcbiAgICBsZXQgYXJncyA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSBhcmdzLnB1c2goYXJndW1lbnRzW2ldKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZucy5sZW5ndGg7IGkrKykge1xuICAgICAgR2VuVXRpbHMuYXNzZXJ0RnVuY3Rpb24oZm5zW2ldLCBcIkZ1bmN0aW9uc1tcIiArIGkgKyBcIl0gaXMgbm90IGEgc3RhdGljXCIpO1xuICAgICAgZm5zW2ldLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBwb3dlciBzZXQgb2YgdGhlIGdpdmVuIGFycmF5LlxuICAgKiBcbiAgICogQHBhcmFtIGFyciBpcyB0aGUgYXJyYXkgdG8gZ2V0IHRoZSBwb3dlciBzZXQgb2ZcbiAgICogQHJldHVybiBbXVtdIGlzIHRoZSBwb3dlciBzZXQgb2YgdGhlIGdpdmVuIGFycmF5XG4gICAqL1xuICBzdGF0aWMgZ2V0UG93ZXJTZXQoYXJyKSB7XG4gICAgbGV0IGZuID0gZnVuY3Rpb24obiwgc3JjLCBnb3QsIGFsbCkge1xuICAgICAgaWYgKG4gPT0gMCkge1xuICAgICAgICBpZiAoZ290Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBhbGxbYWxsLmxlbmd0aF0gPSBnb3Q7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBzcmMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgZm4obiAtIDEsIHNyYy5zbGljZShqICsgMSksIGdvdC5jb25jYXQoWyBzcmNbal0gXSksIGFsbCk7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGxldCBhbGwgPSBbXTtcbiAgICBhbGwucHVzaChbXSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgIGZuKGksIGFyciwgW10sIGFsbCk7XG4gICAgfVxuICAgIGFsbC5wdXNoKGFycik7XG4gICAgcmV0dXJuIGFsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBwb3dlciBzZXQgb2YgdGhlIGdpdmVuIGFycmF5IHdob3NlIGVsZW1lbnRzIGFyZSB0aGUgZ2l2ZW4gc2l6ZS5cbiAgICogXG4gICAqIEBwYXJhbSBhcnIgaXMgdGhlIGFycmF5IHRvIGdldCB0aGUgcG93ZXIgc2V0IG9mXG4gICAqIEBwYXJhbSBzaXplIGlzIHRoZSByZXF1aXJlZCBzaXplIG9mIHRoZSBlbGVtZW50cyB3aXRoaW4gdGhlIHBvd2VyIHNldFxuICAgKiByZXR1cm5zIFtdW10gaXMgdGhlIHBvd2VyIHNldCBvZiB0aGUgZ2l2ZW4gYXJyYXkgd2hvc2UgZWxlbWVudHMgYXJlIHRoZSBnaXZlbiBzaXplIFxuICAgKi9cbiAgc3RhdGljIGdldFBvd2VyU2V0T2ZMZW5ndGgoYXJyLCBzaXplKSB7XG4gICAgR2VuVXRpbHMuYXNzZXJ0SW5pdGlhbGl6ZWQoYXJyKTtcbiAgICBHZW5VdGlscy5hc3NlcnRJbml0aWFsaXplZChzaXplKTtcbiAgICBHZW5VdGlscy5hc3NlcnRUcnVlKHNpemUgPj0gMSk7XG4gICAgbGV0IHBvd2VyU2V0ID0gR2VuVXRpbHMuZ2V0UG93ZXJTZXQoYXJyKTtcbiAgICBsZXQgcG93ZXJTZXRPZkxlbmd0aCA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcG93ZXJTZXQubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChwb3dlclNldFtpXS5sZW5ndGggPT09IHNpemUpIHtcbiAgICAgICAgcG93ZXJTZXRPZkxlbmd0aC5wdXNoKHBvd2VyU2V0W2ldKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHBvd2VyU2V0T2ZMZW5ndGg7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBhcnJheSBvZiBpbmRpY2VzIG9mIHRoZSBnaXZlbiBzaXplLlxuICAgKiBcbiAgICogQHBhcmFtIHNpemUgc3BlY2lmaWVzIHRoZSBzaXplIHRvIGdldCBpbmRpY2VzIGZvclxuICAgKiBAcmV0dXJuIGFycmF5IG9mIHRoZSBnaXZlbiBzaXplIHdpdGggaW5kaWNlcyBzdGFydGluZyBhdCAwXG4gICAqL1xuICBzdGF0aWMgZ2V0SW5kaWNlcyhzaXplKSB7XG4gICAgbGV0IGluZGljZXMgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgaW5kaWNlcy5wdXNoKGkpO1xuICAgIH1cbiAgICByZXR1cm4gaW5kaWNlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgbmV3IGFycmF5IGNvbnRhaW5pbmcgdW5pcXVlIGVsZW1lbnRzIG9mIHRoZSBnaXZlbiBhcnJheS5cbiAgICogXG4gICAqIEBwYXJhbSBhcnIgaXMgdGhlIGFycmF5IHRvIHJldHVybiB1bmlxdWUgZWxlbWVudHMgZnJvbVxuICAgKiBAcmV0dXJuIGEgbmV3IGFycmF5IHdpdGggdGhlIGdpdmVuIGFycmF5J3MgdW5pcXVlIGVsZW1lbnRzXG4gICAqL1xuICBzdGF0aWMgdG9VbmlxdWVBcnJheShhcnIpIHtcbiAgICByZXR1cm4gYXJyLmZpbHRlcihmdW5jdGlvbih2YWx1ZSwgaW5kZXgsIHNlbGYpIHtcbiAgICAgIHJldHVybiBzZWxmLmluZGV4T2YodmFsdWUpID09PSBpbmRleDtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb3BpZXMgdGhlIGdpdmVuIGFycmF5LlxuICAgKiBcbiAgICogQHBhcmFtIGFyciBpcyB0aGUgYXJyYXkgdG8gY29weVxuICAgKiBAcmV0dXJuIGEgY29weSBvZiB0aGUgZ2l2ZW4gYXJyYXlcbiAgICovXG4gIHN0YXRpYyBjb3B5QXJyYXkoYXJyKSB7XG4gICAgR2VuVXRpbHMuYXNzZXJ0QXJyYXkoYXJyKTtcbiAgICBsZXQgY29weSA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSBjb3B5LnB1c2goYXJyW2ldKTtcbiAgICByZXR1cm4gY29weTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFJlbW92ZXMgZXZlcnkgaW5zdGFuY2Ugb2YgdGhlIGdpdmVuIHZhbHVlIGZyb20gdGhlIGdpdmVuIGFycmF5LlxuICAgKiBcbiAgICogQHBhcmFtIGFyciBpcyB0aGUgYXJyYXkgdG8gcmVtb3ZlIHRoZSB2YWx1ZSBmcm9tXG4gICAqIEBwYXJhbSB2YWwgaXMgdGhlIHZhbHVlIHRvIHJlbW92ZSBmcm9tIHRoZSBhcnJheVxuICAgKiBAcmV0dXJuIHRydWUgaWYgdGhlIHZhbHVlIGlzIGZvdW5kIGFuZCByZW1vdmVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyByZW1vdmUoYXJyLCB2YWwpIHtcbiAgICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgICBmb3IgKGxldCBpID0gYXJyLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICBpZiAoYXJyW2ldID09PSB2YWwpIHtcbiAgICAgICAgYXJyLnNwbGljZShpLCAxKTtcbiAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICBpLS07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmb3VuZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgY29weSBvZiB0aGUgZ2l2ZW4gYXJyYXkgd2hlcmUgZWFjaCBlbGVtZW50IGlzIGxvd2VyY2FzZS5cbiAgICogXG4gICAqIEBwYXJhbSBhcnIgaXMgdGhlIGFycmF5IHRvIGNvbnZlcnQgdG8gbG93ZXJjYXNlXG4gICAqIEByZXR1cm4gYSBjb3B5IG9mIHRoZSBnaXZlbiBhcnJheSB3aGVyZSBlYWNoIGVsZW1lbnQgaXMgbG93ZXJjYXNlXG4gICAqL1xuICBzdGF0aWMgdG9Mb3dlckNhc2VBcnJheShhcnIpIHtcbiAgICBsZXQgYXJyMiA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgICBhcnIyLnB1c2goYXJyW2ldLnRvTG93ZXJDYXNlKCkpO1xuICAgIH1cbiAgICByZXR1cm4gYXJyMjtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0aWZpZXMgdGhlIGdpdmVuIGFyZ3VtZW50LlxuICAgKiBcbiAgICogQHBhcmFtIGFyck9yRWxlbSBpcyBhbiBhcnJheSBvciBhbiBlbGVtZW50IGluIHRoZSBhcnJheVxuICAgKiBAcmV0dXJuIGFuIGFycmF5IHdoaWNoIGlzIHRoZSBnaXZlbiBhcmcgaWYgaXQncyBhbiBhcnJheSBvciBhbiBhcnJheSB3aXRoIHRoZSBnaXZlbiBhcmcgYXMgYW4gZWxlbWVudFxuICAgKi9cbiAgc3RhdGljIGxpc3RpZnkoYXJyT3JFbGVtKSB7XG4gICAgcmV0dXJuIEdlblV0aWxzLmlzQXJyYXkoYXJyT3JFbGVtKSA/IGFyck9yRWxlbSA6IFthcnJPckVsZW1dO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZ2l2ZW4gYXJyYXkgY29udGFpbnMgdGhlIGdpdmVuIG9iamVjdC5cbiAgICogXG4gICAqIEBwYXJhbSB7YW55fSBhcnIgLSBhcnJheSB0aGF0IG1heSBvciBtYXkgbm90IGNvbnRhaW4gdGhlIG9iamVjdFxuICAgKiBAcGFyYW0ge2FueX0gb2JqIC0gb2JqZWN0IHRvIGNoZWNrIGZvciBpbmNsdXNpb24gaW4gdGhlIGFycmF5XG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbXBhcmVCeVJlZmVyZW5jZV0gLSBjb21wYXJlIHN0cmljdGx5IGJ5IHJlZmVyZW5jZSwgZm9yZ29pbmcgZGVlcCBlcXVhbGl0eSBjaGVjayAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHJldHVybiB0cnVlIGlmIHRoZSBhcnJheSBjb250YWlucyB0aGUgb2JqZWN0LCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBhcnJheUNvbnRhaW5zKGFyciwgb2JqLCBjb21wYXJlQnlSZWZlcmVuY2UgPSBmYWxzZSkge1xuICAgIEdlblV0aWxzLmFzc2VydFRydWUoR2VuVXRpbHMuaXNBcnJheShhcnIpKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFycltpXSA9PT0gb2JqKSByZXR1cm4gdHJ1ZTtcbiAgICAgIGlmICghY29tcGFyZUJ5UmVmZXJlbmNlICYmIEdlblV0aWxzLmVxdWFscyhhcnJbaV0sIG9iaikpIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBnaXZlbiBzdHJpbmcgY29udGFpbnMgdGhlIGdpdmVuIHN1YnN0cmluZy5cbiAgICogXG4gICAqIEBwYXJhbSBzdHIgaXMgdGhlIHN0cmluZyB0byBzZWFyY2ggZm9yIGEgc3Vic3RyaW5nXG4gICAqIEBwYXJhbSBzdWJzdHJpbmcgaXMgdGhlIHN1YnN0cmluZyB0byBzZWFyY2hpbiB3aXRoaW4gdGhlIHN0cmluZ1xuICAgKiBAcmV0dXJuIHRydWUgaWYgdGhlIHN1YnN0cmluZyBpcyB3aXRoaW4gdGhlIHN0cmluZywgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgc3RyQ29udGFpbnMoc3RyLCBzdWJzdHJpbmcpIHtcbiAgICByZXR1cm4gc3RyLmluZGV4T2Yoc3Vic3RyaW5nKSA+IC0xO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgdHdvIGFycmF5cyBhcmUgZXF1YWwuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJyMSBpcyBhbiBhcnJheSB0byBjb21wYXJlXG4gICAqIEBwYXJhbSBhcnIyIGlzIGFuIGFycmF5IHRvIGNvbXBhcmVcbiAgICogQHJldHVybiB0cnVlIGlmIHRoZSBhcnJheXMgYXJlIGVxdWFsLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBhcnJheXNFcXVhbChhcnIxLCBhcnIyKSB7XG4gICAgaWYgKGFycjEgPT09IGFycjIpIHJldHVybiB0cnVlO1xuICAgIGlmIChhcnIxID09IG51bGwgJiYgYXJyMiA9PSBudWxsKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoYXJyMSA9PSBudWxsIHx8IGFycjIgPT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xuICAgIGlmICh0eXBlb2YgYXJyMSA9PT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIGFycjIgPT09ICd1bmRlZmluZWQnKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAodHlwZW9mIGFycjEgPT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZiBhcnIyID09PSAndW5kZWZpbmVkJykgcmV0dXJuIGZhbHNlO1xuICAgIGlmICghR2VuVXRpbHMuaXNBcnJheShhcnIxKSkgdGhyb3cgbmV3IEVycm9yKFwiRmlyc3QgYXJndW1lbnQgaXMgbm90IGFuIGFycmF5XCIpO1xuICAgIGlmICghR2VuVXRpbHMuaXNBcnJheShhcnIyKSkgdGhyb3cgbmV3IEVycm9yKFwiU2Vjb25kIGFyZ3VtZW50IGlzIG5vdCBhbiBhcnJheVwiKTtcbiAgICBpZiAoYXJyMS5sZW5ndGggIT0gYXJyMi5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFycjEubGVuZ3RoOyArK2kpIHtcbiAgICAgIGlmICghR2VuVXRpbHMuZXF1YWxzKGFycjFbaV0sIGFycjJbaV0pKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgdHdvIGFyZ3VtZW50cyBhcmUgZGVlcCBlcXVhbC5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcxIGlzIGFuIGFyZ3VtZW50IHRvIGNvbXBhcmVcbiAgICogQHBhcmFtIGFyZzIgaXMgYW4gYXJndW1lbnQgdG8gY29tcGFyZVxuICAgKiBAcmV0dXJuIHRydWUgaWYgdGhlIGFyZ3VtZW50cyBhcmUgZGVlcCBlcXVhbHMsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGVxdWFscyhhcmcxLCBhcmcyKSB7XG4gICAgaWYgKEdlblV0aWxzLmlzQXJyYXkoYXJnMSkgJiYgR2VuVXRpbHMuaXNBcnJheShhcmcyKSkgcmV0dXJuIEdlblV0aWxzLmFycmF5c0VxdWFsKGFyZzEsIGFyZzIpO1xuICAgIGlmIChHZW5VdGlscy5pc09iamVjdChhcmcxKSAmJiBHZW5VdGlscy5pc09iamVjdChhcmcyKSkgcmV0dXJuIEdlblV0aWxzLm9iamVjdHNFcXVhbChhcmcxLCBhcmcyKTtcbiAgICByZXR1cm4gYXJnMSA9PT0gYXJnMjtcbiAgfVxuICBcbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgdHdvIG9iamVjdHMgYXJlIGRlZXAgZXF1YWwuXG4gICAqIFxuICAgKiBVbmRlZmluZWQgdmFsdWVzIGFyZSBjb25zaWRlcmVkIGVxdWFsIHRvIG5vbi1leGlzdGVudCBrZXlzLlxuICAgKiBcbiAgICogQHBhcmFtIG1hcDEgaXMgYSBtYXAgdG8gY29tcGFyZVxuICAgKiBAcGFyYW0gbWFwMiBpcyBhIG1hcCB0byBjb21wYXJlXG4gICAqIEByZXR1cm4gdHJ1ZSBpZiB0aGUgbWFwcyBoYXZlIGlkZW50aWNhbCBrZXlzIGFuZCB2YWx1ZXMsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIG9iamVjdHNFcXVhbChtYXAxLCBtYXAyKSB7XG4gICAgbGV0IGtleXMxID0gT2JqZWN0LmtleXMobWFwMSk7XG4gICAgbGV0IGtleXMyID0gT2JqZWN0LmtleXMobWFwMik7XG4gICAgXG4gICAgLy8gY29tcGFyZSBlYWNoIGtleTEgdG8ga2V5czJcbiAgICBmb3IgKGxldCBrZXkxIG9mIGtleXMxKSB7XG4gICAgICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgICAgIGZvciAobGV0IGtleTIgb2Yga2V5czIpIHtcbiAgICAgICAgaWYgKGtleTEgPT09IGtleTIpIHtcbiAgICAgICAgICBpZiAoIUdlblV0aWxzLmVxdWFscyhtYXAxW2tleTFdLCBtYXAyW2tleTJdKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKCFmb3VuZCAmJiBtYXAxW2tleTFdICE9PSB1bmRlZmluZWQpIHJldHVybiBmYWxzZTsgLy8gYWxsb3dzIHVuZGVmaW5lZCB2YWx1ZXMgdG8gZXF1YWwgbm9uLWV4aXN0ZW50IGtleXNcbiAgICB9XG4gICAgXG4gICAgLy8gY29tcGFyZSBlYWNoIGtleTIgdG8ga2V5czFcbiAgICBmb3IgKGxldCBrZXkyIG9mIGtleXMyKSB7XG4gICAgICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgICAgIGZvciAobGV0IGtleTEgb2Yga2V5czEpIHtcbiAgICAgICAgaWYgKGtleTEgPT09IGtleTIpIHtcbiAgICAgICAgICBmb3VuZCA9IHRydWU7IC8vIG5vIG5lZWQgdG8gcmUtY29tcGFyZSB3aGljaCB3YXMgZG9uZSBlYXJsaWVyXG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICghZm91bmQgJiYgbWFwMltrZXkyXSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gZmFsc2U7IC8vIGFsbG93cyB1bmRlZmluZWQgdmFsdWVzIHRvIGVxdWFsIG5vbi1leGlzdGVudCBrZXlzXG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICAgIFxuICAgIC8vIFRPRE86IHN1cHBvcnQgc3RyaWN0IG9wdGlvbj9cbi8vICAgIGlmIChzdHJpY3QpIHtcbi8vICAgICAgbGV0IGtleXMxID0gT2JqZWN0LmtleXMobWFwMSk7XG4vLyAgICAgIGlmIChrZXlzMS5sZW5ndGggIT09IE9iamVjdC5rZXlzKG1hcDIpLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuLy8gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtleXMxLmxlbmd0aDsgaSsrKSB7XG4vLyAgICAgICAgbGV0IGtleSA9IE9iamVjdC5rZXlzKG1hcDEpW2ldO1xuLy8gICAgICAgIGlmICghR2VuVXRpbHMuZXF1YWxzKG1hcDFba2V5XSwgbWFwMltrZXldKSkgcmV0dXJuIGZhbHNlO1xuLy8gICAgICB9XG4vLyAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEZWxldGVzIHByb3BlcnRpZXMgZnJvbSB0aGUgb2JqZWN0IHRoYXQgYXJlIHVuZGVmaW5lZC5cbiAgICogXG4gICAqIEBwYXJhbSBvYmogaXMgdGhlIG9iamVjdCB0byBkZWxldGUgdW5kZWZpbmVkIGtleXMgZnJvbVxuICAgKi9cbiAgc3RhdGljIGRlbGV0ZVVuZGVmaW5lZEtleXMob2JqKSB7XG4gICAgZm9yIChsZXQga2V5IG9mIE9iamVjdC5rZXlzKG9iaikpIHtcbiAgICAgIGlmIChvYmpba2V5XSA9PT0gdW5kZWZpbmVkKSBkZWxldGUgb2JqW2tleV07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgY29tYmluYXRpb25zIG9mIHRoZSBnaXZlbiBhcnJheSBvZiB0aGUgZ2l2ZW4gc2l6ZS5cbiAgICogXG4gICAqIEBwYXJhbSBhcnIgaXMgdGhlIGFycmF5IHRvIGdldCBjb21iaW5hdGlvbnMgZnJvbVxuICAgKiBAcGFyYW0gY29tYmluYXRpb25TaXplIHNwZWNpZmllcyB0aGUgc2l6ZSBvZiBlYWNoIGNvbWJpbmF0aW9uXG4gICAqL1xuICBzdGF0aWMgZ2V0Q29tYmluYXRpb25zKGFyciwgY29tYmluYXRpb25TaXplKSB7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgaW5wdXRcbiAgICBHZW5VdGlscy5hc3NlcnRJbml0aWFsaXplZChhcnIpO1xuICAgIEdlblV0aWxzLmFzc2VydEluaXRpYWxpemVkKGNvbWJpbmF0aW9uU2l6ZSk7XG4gICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZShjb21iaW5hdGlvblNpemUgPj0gMSk7XG4gICAgXG4gICAgLy8gZ2V0IGNvbWJpbmF0aW9ucyBvZiBhcnJheSBpbmRpY2VzIG9mIHRoZSBnaXZlbiBzaXplXG4gICAgbGV0IGluZGV4Q29tYmluYXRpb25zID0gR2VuVXRpbHMuZ2V0UG93ZXJTZXRPZkxlbmd0aChHZW5VdGlscy5nZXRJbmRpY2VzKGFyci5sZW5ndGgpLCBjb21iaW5hdGlvblNpemUpO1xuICAgIFxuICAgIC8vIGNvbGxlY3QgY29tYmluYXRpb25zIGZyb20gZWFjaCBjb21iaW5hdGlvbiBvZiBhcnJheSBpbmRpY2VzXG4gICAgbGV0IGNvbWJpbmF0aW9ucyA9IFtdO1xuICAgIGZvciAobGV0IGluZGV4Q29tYmluYXRpb25zSWR4ID0gMDsgaW5kZXhDb21iaW5hdGlvbnNJZHggPCBpbmRleENvbWJpbmF0aW9ucy5sZW5ndGg7IGluZGV4Q29tYmluYXRpb25zSWR4KyspIHtcbiAgICAgIFxuICAgICAgLy8gZ2V0IGNvbWJpbmF0aW9uIG9mIGFycmF5IGluZGljZXNcbiAgICAgIGxldCBpbmRleENvbWJpbmF0aW9uID0gaW5kZXhDb21iaW5hdGlvbnNbaW5kZXhDb21iaW5hdGlvbnNJZHhdO1xuICAgICAgXG4gICAgICAvLyBidWlsZCBjb21iaW5hdGlvbiBmcm9tIGFycmF5XG4gICAgICBsZXQgY29tYmluYXRpb24gPSBbXTtcbiAgICAgIGZvciAobGV0IGluZGV4Q29tYmluYXRpb25JZHggPSAwOyBpbmRleENvbWJpbmF0aW9uSWR4IDwgaW5kZXhDb21iaW5hdGlvbi5sZW5ndGg7IGluZGV4Q29tYmluYXRpb25JZHgrKykge1xuICAgICAgICBjb21iaW5hdGlvbi5wdXNoKGFycltpbmRleENvbWJpbmF0aW9uW2luZGV4Q29tYmluYXRpb25JZHhdXSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIGFkZCB0byBjb21iaW5hdGlvbnNcbiAgICAgIGNvbWJpbmF0aW9ucy5wdXNoKGNvbWJpbmF0aW9uKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGNvbWJpbmF0aW9ucztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGFuICdhJyBlbGVtZW50IHRoYXQgaXMgZG93bmxvYWRhYmxlIHdoZW4gY2xpY2tlZC5cbiAgICogXG4gICAqIEBwYXJhbSBuYW1lIGlzIHRoZSBuYW1lIG9mIHRoZSBmaWxlIHRvIGRvd25sb2FkXG4gICAqIEBwYXJhbSBjb250ZW50cyBhcmUgdGhlIHN0cmluZyBjb250ZW50cyBvZiB0aGUgZmlsZSB0byBkb3dubG9hZFxuICAgKiBAcmV0dXJuICdhJyBkb20gZWxlbWVudCB3aXRoIGRvd25sb2FkYWJsZSBmaWxlXG4gICAqL1xuICBzdGF0aWMgZ2V0RG93bmxvYWRhYmxlQShuYW1lLCBjb250ZW50cykge1xuICAgIGxldCBhID0gd2luZG93LmRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICBhLmhyZWYgPSB3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTChuZXcgQmxvYihbY29udGVudHNdLCB7dHlwZTogJ3RleHQvcGxhaW4nfSkpO1xuICAgIGEuZG93bmxvYWQgPSBuYW1lO1xuICAgIGEudGFyZ2V0PVwiX2JsYW5rXCI7XG4gICAgYS5pbm5lckhUTUwgPSBuYW1lO1xuICAgIHJldHVybiBhO1xuICB9XG5cbiAgLyoqXG4gICAqIENvcGllcyBwcm9wZXJ0aWVzIGluIHRoZSBnaXZlbiBvYmplY3QgdG8gYSBuZXcgb2JqZWN0LlxuICAgKiBcbiAgICogQHBhcmFtIG9iaiBpcyBvYmplY3QgdG8gY29weSBwcm9wZXJ0aWVzIGZvclxuICAgKiBAcmV0dXJuIGEgbmV3IG9iamVjdCB3aXRoIHByb3BlcnRpZXMgY29waWVkIGZyb20gdGhlIGdpdmVuIG9iamVjdFxuICAgKi9cbiAgc3RhdGljIGNvcHlQcm9wZXJ0aWVzKG9iaikge1xuICAgIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG9iaikpXG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlcyBhbGwgcHJvcGVydGllcyBpbiB0aGUgZ2l2ZW4gb2JqZWN0LlxuICAgKiBcbiAgICogQHBhcmFtIG9iaiBpcyB0aGUgb2JqZWN0IHRvIGRlbGV0ZSBwcm9wZXJ0aWVzIGZyb21cbiAgICovXG4gIHN0YXRpYyBkZWxldGVQcm9wZXJ0aWVzKG9iaikge1xuICAgIGxldCBwcm9wcyA9IFtdO1xuICAgIGZvciAobGV0IHByb3AgaW4gb2JqKSBwcm9wcy5wdXNoKHByb3ApOyAvLyBUT0RPOiBpZiAob2JqLmhhc093blByb3BlcnR5KHByb3ApKSB7IC4uLlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIGRlbGV0ZSBvYmpbcHJvcHNbaV0udG9TdHJpbmcoKV07XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBnaXZlbiBzdHJpbmcgY29udGFpbnMgd2hpdGVzcGFjZS5cbiAgICogXG4gICAqIEBwYXJhbSBzdHIgaXMgdGhlIHN0cmluZyB0byB0ZXN0XG4gICAqIEByZXR1cm4gdHJ1ZSBpZiB0aGUgc3RyaW5nIGNvbnRhaW5zIHdoaXRlc3BhY2UsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGhhc1doaXRlc3BhY2Uoc3RyKSB7XG4gICAgcmV0dXJuIC9cXHMvZy50ZXN0KHN0cik7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBnaXZlbiBjaGFyYWN0ZXIgaXMgd2hpdGVzcGFjZS5cbiAgICogXG4gICAqIEBwYXJhbSBjaGFyIGlzIHRoZSBjaGFyYWN0ZXIgdG8gdGVzdFxuICAgKiBAcmV0dXJuIHRydWUgaWYgdGhlIGdpdmVuIGNoYXJhY3RlciBpcyB3aGl0ZXNwYWNlLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc1doaXRlc3BhY2UoY2hhcikge1xuICAgIHJldHVybiAvXFxzLy50ZXN0KGNoYXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZ2l2ZW4gY2hhcmFjdGVyIGlzIGEgbmV3bGluZS5cbiAgICogXG4gICAqIEBwYXJhbSBjaGFyIGlzIHRoZSBjaGFyYWN0ZXIgdG8gdGVzdFxuICAgKiBAcmV0dXJuIHRydWUgaWYgdGhlIGdpdmVuIGNoYXJhY3RlciBpcyBhIG5ld2xpbmUsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGlzTmV3bGluZShjaGFyKSB7XG4gICAgcmV0dXJuIGNoYXIgPT09ICdcXG4nIHx8IGNoYXIgPT09ICdcXHInO1xuICB9XG5cbiAgLyoqXG4gICAqIENvdW50cyB0aGUgbnVtYmVyIG9mIG5vbi13aGl0ZXNwYWNlIGNoYXJhY3RlcnMgaW4gdGhlIGdpdmVuIHN0cmluZy5cbiAgICogXG4gICAqIEBwYXJhbSBzdHIgaXMgdGhlIHN0cmluZyB0byBjb3VudCB0aGUgbnVtYmVyIG9mIG5vbi13aGl0ZXNwYWNlIGNoYXJhY3RlcnMgaW5cbiAgICogQHJldHVybiBpbnQgaXMgdGhlIG51bWJlciBvZiBub24td2hpdGVzcGFjZSBjaGFyYWN0ZXJzIGluIHRoZSBnaXZlbiBzdHJpbmdcbiAgICovXG4gIHN0YXRpYyBjb3VudE5vbldoaXRlc3BhY2VDaGFyYWN0ZXJzKHN0cikge1xuICAgIGxldCBjb3VudCA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICghR2VuVXRpbHMuaXNXaGl0ZXNwYWNlKHN0ci5jaGFyQXQoaSkpKSBjb3VudCsrO1xuICAgIH1cbiAgICByZXR1cm4gY291bnQ7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0b2tlbnMgc2VwYXJhdGVkIGJ5IHdoaXRlc3BhY2UgZnJvbSB0aGUgZ2l2ZW4gc3RyaW5nLlxuICAgKiBcbiAgICogQHBhcmFtIHN0ciBpcyB0aGUgc3RyaW5nIHRvIGdldCB0b2tlbnMgZnJvbVxuICAgKiBAcmV0dXJuIHN0cmluZ1tdIGFyZSB0aGUgdG9rZW5zIHNlcGFyYXRlZCBieSB3aGl0ZXNwYWNlIHdpdGhpbiB0aGUgc3RyaW5nXG4gICAqL1xuICBzdGF0aWMgZ2V0V2hpdGVzcGFjZVRva2VucyhzdHIpIHtcbiAgICByZXR1cm4gc3RyLm1hdGNoKC9cXFMrL2cpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgbGluZXMgc2VwYXJhdGVkIGJ5IG5ld2xpbmVzIGZyb20gdGhlIGdpdmVuIHN0cmluZy5cbiAgICogXG4gICAqIEBwYXJhbSBzdHIgaXMgdGhlIHN0cmluZyB0byBnZXQgbGluZXMgZnJvbVxuICAgKiBAcGFyYW0gc3RyaW5nW10gYXJlIHRoZSBsaW5lcyBzZXBhcmF0ZWQgYnkgbmV3bGluZXMgd2l0aGluIHRoZSBzdHJpbmdcbiAgICovXG4gIHN0YXRpYyBnZXRMaW5lcyhzdHIpIHtcbiAgICByZXR1cm4gc3RyLm1hdGNoKC9bXlxcclxcbl0rL2cpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGRvY3VtZW50J3MgZmlyc3Qgc3R5bGVzaGVldCB3aGljaCBoYXMgbm8gaHJlZi5cbiAgICogXG4gICAqIEByZXR1cm4gU3R5bGVTaGVldCBpcyB0aGUgaW50ZXJuYWwgc3R5bGVzaGVldFxuICAgKi9cbiAgc3RhdGljIGdldEludGVybmFsU3R5bGVTaGVldCgpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRvY3VtZW50LnN0eWxlU2hlZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBsZXQgc3R5bGVTaGVldCA9IGRvY3VtZW50LnN0eWxlU2hlZXRzW2ldO1xuICAgICAgaWYgKCFzdHlsZVNoZWV0LmhyZWYpIHJldHVybiBzdHlsZVNoZWV0O1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBkb2N1bWVudCdzIGludGVybmFsIHN0eWxlc2hlZXQgYXMgdGV4dC5cbiAgICogXG4gICAqIEByZXR1cm4gc3RyIGlzIHRoZSBkb2N1bWVudCdzIGludGVybmFsIHN0eWxlc2hlZXRcbiAgICovXG4gIHN0YXRpYyBnZXRJbnRlcm5hbFN0eWxlU2hlZXRUZXh0KCkge1xuICAgIGxldCBpbnRlcm5hbENzcyA9IFwiXCI7XG4gICAgbGV0IGludGVybmFsU3R5bGVTaGVldCA9IEdlblV0aWxzLmdldEludGVybmFsU3R5bGVTaGVldCgpO1xuICAgIGlmICghaW50ZXJuYWxTdHlsZVNoZWV0KSByZXR1cm4gbnVsbDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGludGVybmFsU3R5bGVTaGVldC5jc3NSdWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgaW50ZXJuYWxDc3MgKz0gaW50ZXJuYWxTdHlsZVNoZWV0LmNzc1J1bGVzW2ldLmNzc1RleHQgKyBcIlxcblwiO1xuICAgIH1cbiAgICByZXR1cm4gaW50ZXJuYWxDc3M7XG4gIH1cblxuICAvKipcbiAgICogTWFudWFsbHkgYnVpbGRzIGFuIEhUTUwgZG9jdW1lbnQgc3RyaW5nLlxuICAgKiBcbiAgICogQHBhcmFtIGNvbnRlbnQgc3BlY2lmaWVzIG9wdGlvbmFsIGRvY3VtZW50IGNvbnRlbnRcbiAgICogICAgICAgIGNvbnRlbnQuZGl2IGlzIGEgcHJlLWV4aXN0aW5nIGRpdiB0byBzdHJpbmdpZnkgYW5kIGFkZCB0byB0aGUgYm9keVxuICAgKiAgICAgICAgY29udGVudC50aXRsZSBpcyB0aGUgdGl0bGUgb2YgdGhlIG5ldyB0YWJcbiAgICogICAgICAgIGNvbnRlbnQuZGVwZW5kZW5jeVBhdGhzIHNwZWNpZmllcyBwYXRocyB0byBqcywgY3NzLCBvciBpbWcgcGF0aHNcbiAgICogICAgICAgIGNvbnRlbnQuaW50ZXJuYWxDc3MgaXMgY3NzIHRvIGVtYmVkIGluIHRoZSBodG1sIGRvY3VtZW50XG4gICAqICAgICAgICBjb250ZW50Lm1ldGFzIGFyZSBtZXRhIGVsZW1lbnRzIHdpdGgga2V5cy92YWx1ZXMgdG8gaW5jbHVkZVxuICAgKiBAcmV0dXJuIHN0ciBpcyB0aGUgZG9jdW1lbnQgc3RyaW5nXG4gICAqL1xuICBzdGF0aWMgYnVpbGRIdG1sRG9jdW1lbnQoY29udGVudCkge1xuICAgIGxldCBzdHIgPSBcIjwhRE9DVFlQRSBIVE1MPlwiO1xuICAgIHN0ciArPSBcIjxodG1sPjxoZWFkPlwiO1xuICAgIFxuICAgIC8vIGFkZCBtZXRhc1xuICAgIGlmIChjb250ZW50Lm1ldGFzKSB7XG4gICAgICBsZXQgbWV0YXMgPSBHZW5VdGlscy5saXN0aWZ5KGNvbnRlbnQubWV0YXMpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtZXRhcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBsZXQgbWV0YSA9IG1ldGFzW2ldO1xuICAgICAgICBsZXQgZWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJtZXRhXCIpO1xuICAgICAgICBmb3IgKGxldCBwcm9wIGluIG1ldGEpIHtcbiAgICAgICAgICBpZiAobWV0YS5oYXNPd25Qcm9wZXJ0eShwcm9wKSkge1xuICAgICAgICAgICAgZWxlbS5zZXRBdHRyaWJ1dGUocHJvcC50b1N0cmluZygpLCBtZXRhW3Byb3AudG9TdHJpbmcoKV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzdHIgKz0gZWxlbS5vdXRlckhUTUw7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIGFkZCB0aXRsZSBhbmQgaW50ZXJuYWwgY3NzXG4gICAgc3RyICs9IGNvbnRlbnQudGl0bGUgPyBcIjx0aXRsZT5cIiArIGNvbnRlbnQudGl0bGUgKyBcIjwvdGl0bGU+XCIgOiBcIlwiO1xuICAgIHN0ciArPSBjb250ZW50LmludGVybmFsQ3NzID8gXCI8c3R5bGU+XCIgKyBjb250ZW50LmludGVybmFsQ3NzICsgXCI8L3N0eWxlPlwiIDogXCJcIjtcbiAgICBcbiAgICAvLyBhZGQgZGVwZW5kZW5jeSBwYXRoc1xuICAgIGlmIChjb250ZW50LmRlcGVuZGVuY3lQYXRocykge1xuICAgICAgbGV0IGRlcGVuZGVuY3lQYXRocyA9IEdlblV0aWxzLmxpc3RpZnkoY29udGVudC5kZXBlbmRlbmN5UGF0aHMpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZXBlbmRlbmN5UGF0aHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IGRlcGVuZGVuY3lQYXRoID0gZGVwZW5kZW5jeVBhdGhzW2ldO1xuICAgICAgICBpZiAoZGVwZW5kZW5jeVBhdGguZW5kc1dpdGgoXCIuanNcIikpIHN0ciArPSBcIjxzY3JpcHQgc3JjPSdcIiArIGRlcGVuZGVuY3lQYXRoICsgXCInPjwvc2NyaXB0PlwiO1xuICAgICAgICBlbHNlIGlmIChkZXBlbmRlbmN5UGF0aC5lbmRzV2l0aChcIi5jc3NcIikpIHN0ciArPSBcIjxsaW5rIHJlbD0nc3R5bGVzaGVldCcgdHlwZT0ndGV4dC9jc3MnIGhyZWY9J1wiICsgZGVwZW5kZW5jeVBhdGggKyBcIicvPlwiO1xuICAgICAgICBlbHNlIGlmIChkZXBlbmRlbmN5UGF0aC5lbmRzV2l0aChcIi5wbmdcIikgfHwgZGVwZW5kZW5jeVBhdGguZW5kc1dpdGgoXCIuaW1nXCIpKSAgc3RyICs9IFwiPGltZyBzcmM9J1wiICsgZGVwZW5kZW5jeVBhdGggKyBcIic+XCI7XG4gICAgICAgIGVsc2UgdGhyb3cgbmV3IEVycm9yKFwiVW5yZWNvZ25pemVkIGRlcGVuZGVuY3kgcGF0aCBleHRlbnNpb246IFwiICsgZGVwZW5kZW5jeVBhdGgpOyAgICAgIFxuICAgICAgfVxuICAgIH1cbiAgICBzdHIgKz0gXCI8L2hlYWQ+PGJvZHk+XCI7XG4gICAgaWYgKGNvbnRlbnQuZGl2KSBzdHIgKz0gJChcIjxkaXY+XCIpLmFwcGVuZChjb250ZW50LmRpdi5jbG9uZSgpKS5odG1sKCk7ICAvLyBhZGQgY2xvbmVkIGRpdiBhcyBzdHJpbmdcbiAgICBzdHIgKz0gXCI8L2JvZHk+PC9odG1sPlwiO1xuICAgIHJldHVybiBzdHI7XG4gIH1cblxuICAvKipcbiAgICogT3BlbnMgdGhlIGdpdmVuIGRpdiBpbiBhIG5ldyB3aW5kb3cuXG4gICAqIFxuICAgKiBAcGFyYW0gY29udGVudCBzcGVjaWZpZXMgb3B0aW9uYWwgd2luZG93IGNvbnRlbnRcbiAgICogICAgICAgIGNvbnRlbnQuZGl2IGlzIGEgcHJlLWV4aXN0aW5nIGRpdiB0byBzdHJpbmdpZnkgYW5kIGFkZCB0byB0aGUgYm9keVxuICAgKiAgICAgICAgY29udGVudC50aXRsZSBpcyB0aGUgdGl0bGUgb2YgdGhlIG5ldyB0YWJcbiAgICogICAgICAgIGNvbnRlbnQuZGVwZW5kZW5jeVBhdGhzIHNwZWNpZmllcyBwYXRocyB0byBqcywgY3NzLCBvciBpbWcgcGF0aHNcbiAgICogICAgICAgIGNvbnRlbnQuaW50ZXJuYWxDc3MgaXMgY3NzIHRvIGVtYmVkIGluIHRoZSBodG1sIGRvY3VtZW50XG4gICAqICAgICAgICBjb250ZW50Lm1ldGFzIGFyZSBtZXRhIGVsZW1lbnRzIHdpdGgga2V5cy92YWx1ZXMgdG8gaW5jbHVkZVxuICAgKiBAcGFyYW0gb25Mb2FkKGVyciwgd2luZG93KSBpcyBpbnZva2VkIHdpdGggYSByZWZlcmVuY2UgdG8gdGhlIHdpbmRvdyB3aGVuIGF2YWlsYWJsZVxuICAgKi9cbiAgc3RhdGljIG5ld1dpbmRvdyhjb250ZW50LCBvbkxvYWQpIHtcbiAgICBsZXQgb25Mb2FkQ2FsbGVkID0gZmFsc2U7XG4gICAgbGV0IHcgPSB3aW5kb3cub3BlbigpO1xuICAgIGlmICghR2VuVXRpbHMuaXNJbml0aWFsaXplZCh3KSB8fCAhR2VuVXRpbHMuaXNJbml0aWFsaXplZCh3LmRvY3VtZW50KSkge1xuICAgICAgb25Mb2FkT25jZShuZXcgRXJyb3IoXCJDb3VsZCBub3QgZ2V0IHdpbmRvdyByZWZlcmVuY2VcIikpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB3Lm9wZW5lciA9IG51bGw7XG4gICAgdy5kb2N1bWVudC53cml0ZShHZW5VdGlscy5idWlsZEh0bWxEb2N1bWVudChjb250ZW50KSk7XG4gICAgdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgICBvbkxvYWRPbmNlKG51bGwsIHcpO1xuICAgIH0pO1xuICAgIHcuZG9jdW1lbnQuY2xvc2UoKTtcbiAgICBcbiAgICAvLyBwcmV2ZW50cyBvbkxvYWQoKSBmcm9tIGJlaW5nIGNhbGxlZCBtdWx0aXBsZSB0aW1lc1xuICAgIGZ1bmN0aW9uIG9uTG9hZE9uY2UoZXJyLCB3aW5kb3c/KSB7XG4gICAgICBpZiAob25Mb2FkQ2FsbGVkKSByZXR1cm47XG4gICAgICBvbkxvYWRDYWxsZWQgPSB0cnVlO1xuICAgICAgaWYgKG9uTG9hZCkgb25Mb2FkKGVyciwgd2luZG93KTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgdGhlIGdpdmVuIGltYWdlIHRvIGEgYmFzZTY0IGVuY29kZWQgZGF0YSB1cmwuXG4gICAqIFxuICAgKiBAcGFyYW0gaW1nIGlzIHRoZSBpbWFnZSB0byBjb252ZXJ0XG4gICAqIEBwYXJhbSBxdWFsaXR5IGlzIGEgbnVtYmVyIGJldHdlZW4gMCBhbmQgMSBzcGVjaWZ5aW5nIHRoZSBpbWFnZSBxdWFsaXR5XG4gICAqL1xuICBzdGF0aWMgaW1nVG9EYXRhVXJsKGltZywgcXVhbGl0eSkge1xuICAgIGxldCBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgICBjYW52YXMuaGVpZ2h0ID0gaW1nLm5hdHVyYWxIZWlnaHQ7XG4gICAgY2FudmFzLndpZHRoID0gaW1nLm5hdHVyYWxXaWR0aDtcbiAgICBsZXQgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIGNvbnRleHQuZHJhd0ltYWdlKGltZywgMCwgMCk7XG4gICAgcmV0dXJuIGNhbnZhcy50b0RhdGFVUkwocXVhbGl0eSk7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyBpZiB0aGUgaW1hZ2UgYXQgdGhlIGdpdmVuIFVSTCBpcyBhY2Nlc3NpYmxlLlxuICAgKiBcbiAgICogQHBhcmFtIHVybCBpcyB0aGUgdXJsIHRvIGFuIGltYWdlXG4gICAqIEBwYXJhbSB0aW1lb3V0IGlzIHRoZSBtYXhpbXVtIHRpbWUgdG8gd2FpdFxuICAgKiBAcGFyYW0gb25Eb25lKGJvb2wpIHdoZW4gdGhlIGltYWdlIGlzIGRldGVybWluZWQgdG8gYmUgYWNjZXNzaWJsZSBvciBub3RcbiAgICovXG4gIHN0YXRpYyBpc0ltYWdlQWNjZXNzaWJsZSh1cmwsIHRpbWVvdXQsIG9uRG9uZSkge1xuICAgIFxuICAgIC8vIHRyYWNrIHJldHVybiBzbyBpdCBvbmx5IGV4ZWN1dGVzIG9uY2VcbiAgICBsZXQgcmV0dXJuZWQgPSBmYWxzZTtcbiAgICBcbiAgICAvLyBhdHRlbXB0IHRvIGxvYWQgZmF2aWNvblxuICAgIGxldCBpbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICBpbWcub25sb2FkID0gb25SZXNwb25zZTtcbiAgICBpbWcub25lcnJvciA9IG9uUmVzcG9uc2U7XG4gICAgaW1nLnNyYyA9IHVybCArIFwiP1wiICsgKCtuZXcgRGF0ZSgpKTsgLy8gdHJpZ2dlciBpbWFnZSBsb2FkIHdpdGggY2FjaGUgYnVzdGVyXG4gICAgXG4gICAgLy8gbmVzdCBmYWlsdXJlIHRpbWVvdXRzIHRvIGdpdmUgcmVzcG9uc2UgYSBjaGFuY2Ugd2hlbiBicm93c2VyIGlzIHVuZGVyIGxvYWRcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgc2V0SW1tZWRpYXRlKGZ1bmN0aW9uKCkge1xuICAgICAgICBzZXRJbW1lZGlhdGUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgc2V0SW1tZWRpYXRlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKCFyZXR1cm5lZCkge1xuICAgICAgICAgICAgICByZXR1cm5lZCA9IHRydWU7XG4gICAgICAgICAgICAgIG9uRG9uZShmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSwgdGltZW91dCk7XG4gICAgXG4gICAgZnVuY3Rpb24gb25SZXNwb25zZShlKSB7XG4gICAgICBpZiAocmV0dXJuZWQpIHJldHVybjtcbiAgICAgIHJldHVybmVkID0gdHJ1ZTtcbiAgICAgIGlmICh0eXBlb2YgZSA9PT0gJ3VuZGVmaW5lZCcgfHwgZS50eXBlID09PSBcImVycm9yXCIpIG9uRG9uZShmYWxzZSk7XG4gICAgICBlbHNlIG9uRG9uZSh0cnVlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyBpZiB0aGUgZ2l2ZW4gZmlsZSBpcyBhIHppcCBmaWxlLlxuICAgKiBcbiAgICogQHBhcmFtIGZpbGUgaXMgYSBmaWxlXG4gICAqIEByZXR1cm4gdHJ1ZSBpZiB0aGUgZ2l2ZW4gZmlsZSBpcyBhIHppcCBmaWxlLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc1ppcEZpbGUoZmlsZSkge1xuICAgIHJldHVybiBmaWxlLm5hbWUuZW5kc1dpdGgoXCIuemlwXCIpIHx8IGZpbGUudHlwZSA9PT0gJ2FwcGxpY2F0aW9uL3ppcCc7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyBpZiB0aGUgZ2l2ZW4gZmlsZSBpcyBhIGpzb24gZmlsZS5cbiAgICogXG4gICAqIEBwYXJhbSBmaWxlIGlzIGEgZmlsZVxuICAgKiBAcmV0dXJuIHRydWUgaWYgdGhlIGdpdmVuIGZpbGUgaXMgYSBqc29uIGZpbGUsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGlzSnNvbkZpbGUoZmlsZSkge1xuICAgIHJldHVybiBmaWxlLm5hbWUuZW5kc1dpdGgoXCIuanNvblwiKSB8fCBmaWxlLnR5cGUgPT09ICdhcHBsaWNhdGlvbi9qc29uJztcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIGlmIHRoZSBnaXZlbiBmaWxlIGlzIGEgdHh0IGZpbGUuXG4gICAqIFxuICAgKiBAcGFyYW0gZmlsZSBpcyBhIGZpbGVcbiAgICogQHJldHVybiB0cnVlIGlmIHRoZSBnaXZlbiBmaWxlIGlzIGEgdHh0IGZpbGUsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGlzVHh0RmlsZShmaWxlKSB7XG4gICAgcmV0dXJuIGZpbGUubmFtZS5lbmRzV2l0aChcIi50eHRcIikgfHwgZmlsZS50eXBlID09PSAndGV4dC9wbGFpbic7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2hlcyB0aGUgZ2l2ZW4gbGlzdCBvZiBpbWFnZXMuXG4gICAqIFxuICAgKiBQcmVyZXF1aXNpdGU6IGFzeW5jLmpzLlxuICAgKiBcbiAgICogQHBhcmFtIHBhdGhzIGFyZSB0aGUgcGF0aHMgdG8gdGhlIGltYWdlcyB0byBmZXRjaFxuICAgKiBAcGFyYW0gb25Eb25lKGVyciwgaW1hZ2VzKSBpcyBjYWxsZWQgd2hlbiBkb25lXG4gICAqL1xuICBzdGF0aWMgZ2V0SW1hZ2VzKHBhdGhzLCBvbkRvbmUpIHtcbiAgICBcbiAgICAvLyBsaXN0aWZ5IHBhdGhzXG4gICAgaWYgKCFHZW5VdGlscy5pc0FycmF5KHBhdGhzKSkge1xuICAgICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZShHZW5VdGlscy5pc1N0cmluZyhwYXRocykpO1xuICAgICAgcGF0aHMgPSBbcGF0aHNdO1xuICAgIH1cbiAgICBcbiAgICAvLyBjb2xsZWN0IGZ1bmN0aW9ucyB0byBmZXRjaCBpbWFnZXNcbiAgICBsZXQgZnVuY3MgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhdGhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBmdW5jcy5wdXNoKGxvYWRGdW5jKHBhdGhzW2ldKSk7XG4gICAgfVxuICAgIFxuICAgIC8vIGZldGNoIGluIHBhcmFsbGVsXG4gICAgYXN5bmMucGFyYWxsZWwoZnVuY3MsIG9uRG9uZSk7XG4gICAgXG4gICAgLy8gY2FsbGJhY2sgc3RhdGljIHRvIGZldGNoIGEgc2luZ2xlIGltYWdlXG4gICAgZnVuY3Rpb24gbG9hZEZ1bmMocGF0aCkge1xuICAgICAgcmV0dXJuIGZ1bmN0aW9uKG9uRG9uZSkge1xuICAgICAgICBsZXQgaW1nID0gbmV3IEltYWdlKCk7XG4gICAgICAgIGltZy5vbmxvYWQgPSBmdW5jdGlvbigpIHsgb25Eb25lKG51bGwsIGltZyk7IH1cbiAgICAgICAgaW1nLm9uZXJyb3IgPSBmdW5jdGlvbigpIHsgb25Eb25lKG5ldyBFcnJvcihcIkNhbm5vdCBsb2FkIGltYWdlOiBcIiArIHBhdGgpKTsgfVxuICAgICAgICBpbWcuc3JjID0gcGF0aDtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgc3RyaW5nIGluZGVudGF0aW9uIG9mIHRoZSBnaXZlbiBsZW5ndGg7XG4gICAqIFxuICAgKiBAcGFyYW0gbGVuZ3RoIGlzIHRoZSBsZW5ndGggb2YgdGhlIGluZGVudGF0aW9uXG4gICAqIEByZXR1cm4ge3N0cmluZ30gaXMgYW4gaW5kZW50YXRpb24gc3RyaW5nIG9mIHRoZSBnaXZlbiBsZW5ndGhcbiAgICovXG4gIHN0YXRpYyBnZXRJbmRlbnQobGVuZ3RoKSB7XG4gICAgbGV0IHN0ciA9IFwiXCI7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykgc3RyICs9ICcgICc7IC8vIHR3byBzcGFjZXNcbiAgICByZXR1cm4gc3RyO1xuICB9XG4gIFxuICBzdGF0aWMgaW5pdFBvbHlmaWxscygpIHtcbiAgICBcbiAgICAvLyBQb2x5ZmlsbCBPYmplY3QuYXNzaWduKClcbiAgICAvLyBDcmVkaXQ6IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL09iamVjdC9hc3NpZ25cbiAgICBpZiAodHlwZW9mIE9iamVjdC5hc3NpZ24gIT0gJ2Z1bmN0aW9uJykge1xuICAgICAgLy8gTXVzdCBiZSB3cml0YWJsZTogdHJ1ZSwgZW51bWVyYWJsZTogZmFsc2UsIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KE9iamVjdCwgXCJhc3NpZ25cIiwge1xuICAgICAgICB2YWx1ZTogZnVuY3Rpb24gYXNzaWduKHRhcmdldCwgdmFyQXJncykgeyAvLyAubGVuZ3RoIG9mIHN0YXRpYyBpcyAyXG4gICAgICAgICAgJ3VzZSBzdHJpY3QnO1xuICAgICAgICAgIGlmICh0YXJnZXQgPT0gbnVsbCkgeyAvLyBUeXBlRXJyb3IgaWYgdW5kZWZpbmVkIG9yIG51bGxcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjb252ZXJ0IHVuZGVmaW5lZCBvciBudWxsIHRvIG9iamVjdCcpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxldCB0byA9IE9iamVjdCh0YXJnZXQpO1xuXG4gICAgICAgICAgZm9yIChsZXQgaW5kZXggPSAxOyBpbmRleCA8IGFyZ3VtZW50cy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICAgIGxldCBuZXh0U291cmNlID0gYXJndW1lbnRzW2luZGV4XTtcblxuICAgICAgICAgICAgaWYgKG5leHRTb3VyY2UgIT0gbnVsbCkgeyAvLyBTa2lwIG92ZXIgaWYgdW5kZWZpbmVkIG9yIG51bGxcbiAgICAgICAgICAgICAgZm9yIChsZXQgbmV4dEtleSBpbiBuZXh0U291cmNlKSB7XG4gICAgICAgICAgICAgICAgLy8gQXZvaWQgYnVncyB3aGVuIGhhc093blByb3BlcnR5IGlzIHNoYWRvd2VkXG4gICAgICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChuZXh0U291cmNlLCBuZXh0S2V5KSkge1xuICAgICAgICAgICAgICAgICAgdG9bbmV4dEtleV0gPSBuZXh0U291cmNlW25leHRLZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdG87XG4gICAgICAgIH0sXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICAvKipcbiAgICAgKiBQb2x5ZmlsbCBzdHIuc3RhcnRzV2l0aChzZWFyY2hTdHJpbmcsIHBvc2l0aW9uKS5cbiAgICAgKiBcbiAgICAgKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9TdHJpbmcvc3RhcnRzV2l0aCNQb2x5ZmlsbFxuICAgICAqL1xuICAgIFN0cmluZy5wcm90b3R5cGUuc3RhcnRzV2l0aCA9IGZ1bmN0aW9uKHNlYXJjaFN0cmluZywgcG9zaXRpb24pIHtcbiAgICAgIHJldHVybiB0aGlzLnN1YnN0cihwb3NpdGlvbiB8fCAwLCBzZWFyY2hTdHJpbmcubGVuZ3RoKSA9PT0gc2VhcmNoU3RyaW5nO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBQb2x5ZmlsbCBzdHIuZW5kc1dpdGgoc2VhcmNoU3RyaW5nLCBwb3NpdGlvbikuXG4gICAgICogXG4gICAgICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvU3RyaW5nL2VuZHNXaXRoI1BvbHlmaWxsXG4gICAgICovXG4gICAgU3RyaW5nLnByb3RvdHlwZS5lbmRzV2l0aCA9IGZ1bmN0aW9uKHNlYXJjaFN0cmluZywgcG9zaXRpb24pIHtcbiAgICAgIGlmICghKHBvc2l0aW9uIDwgdGhpcy5sZW5ndGgpKSBwb3NpdGlvbiA9IHRoaXMubGVuZ3RoOyAgLy8gd29ya3MgYmV0dGVyIHRoYW4gPj0gYmVjYXVzZSBpdCBjb21wZW5zYXRlcyBmb3IgTmFOXG4gICAgICBlbHNlIHBvc2l0aW9uIHw9IDA7IC8vIHJvdW5kIHBvc2l0aW9uXG4gICAgICByZXR1cm4gdGhpcy5zdWJzdHIocG9zaXRpb24gLSBzZWFyY2hTdHJpbmcubGVuZ3RoLCBzZWFyY2hTdHJpbmcubGVuZ3RoKSA9PT0gc2VhcmNoU3RyaW5nO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZXMgYSB2NCBVVUlELlxuICAgKiBcbiAgICogU291cmNlOiBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xMDUwMzQvY3JlYXRlLWd1aWQtdXVpZC1pbi1qYXZhc2NyaXB0XG4gICAqL1xuICBzdGF0aWMgZ2V0VVVJRCgpIHtcbiAgICByZXR1cm4gJ3h4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCBmdW5jdGlvbihjKSB7XG4gICAgICBsZXQgciA9IE1hdGgucmFuZG9tKCkgKiAxNiB8IDAsIHYgPSBjID09ICd4JyA/IHIgOiAociAmIDB4MyB8IDB4OCk7XG4gICAgICByZXR1cm4gdi50b1N0cmluZygxNik7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGN1cnJlbnQgZW52aXJvbm1lbnQgaXMgYSBicm93c2VyLlxuICAgKiBcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgZW52aXJvbm1lbnQgaXMgYSBicm93c2VyLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc0Jyb3dzZXIoKSB7XG4gICAgbGV0IGlzV29ya2VyID0gdHlwZW9mIGltcG9ydFNjcmlwdHMgPT09ICdmdW5jdGlvbic7XG4gICAgbGV0IGlzQnJvd3Nlck1haW4gPSBuZXcgRnVuY3Rpb24oXCJ0cnkge3JldHVybiB0aGlzPT09d2luZG93O31jYXRjaChlKXtyZXR1cm4gZmFsc2U7fVwiKSgpO1xuICAgIGxldCBpc0pzRG9tID0gaXNCcm93c2VyTWFpbiA/IG5ldyBGdW5jdGlvbihcInRyeSB7cmV0dXJuIHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50LmluY2x1ZGVzKCdqc2RvbScpO31jYXRjaChlKXtyZXR1cm4gZmFsc2U7fVwiKSgpIDogZmFsc2U7XG4gICAgcmV0dXJuIGlzV29ya2VyIHx8IChpc0Jyb3dzZXJNYWluICYmICFpc0pzRG9tKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgY3VycmVudCBlbnZpcm9ubWVudCBpcyBhIGZpcmVmb3gtYmFzZWQgYnJvd3Nlci5cbiAgICogXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGVudmlyb25tZW50IGlzIGEgZmlyZWZveC1iYXNlZCBicm93c2VyLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc0ZpcmVmb3goKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNCcm93c2VyKCkgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKFwiRmlyZWZveFwiKSA+IDA7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgSUUgdmVyc2lvbiBudW1iZXIuXG4gICAqIFxuICAgKiBDcmVkaXQ6IGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE5OTk5Mzg4L2NoZWNrLWlmLXVzZXItaXMtdXNpbmctaWUtd2l0aC1qcXVlcnkvMjE3MTIzNTYjMjE3MTIzNTZcbiAgICogXG4gICAqIEByZXR1cm4gdGhlIElFIHZlcnNpb24gbnVtYmVyIG9yIG51bGwgaWYgbm90IElFXG4gICAqL1xuICBzdGF0aWMgZ2V0SUVWZXJzaW9uKCkge1xuICAgIGxldCB1YSA9IHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50O1xuXG4gICAgbGV0IG1zaWUgPSB1YS5pbmRleE9mKCdNU0lFICcpO1xuICAgIGlmIChtc2llID4gMCkge1xuICAgICAgICAvLyBJRSAxMCBvciBvbGRlciA9PiByZXR1cm4gdmVyc2lvbiBudW1iZXJcbiAgICAgICAgcmV0dXJuIHBhcnNlSW50KHVhLnN1YnN0cmluZyhtc2llICsgNSwgdWEuaW5kZXhPZignLicsIG1zaWUpKSwgMTApO1xuICAgIH1cblxuICAgIGxldCB0cmlkZW50ID0gdWEuaW5kZXhPZignVHJpZGVudC8nKTtcbiAgICBpZiAodHJpZGVudCA+IDApIHtcbiAgICAgICAgLy8gSUUgMTEgPT4gcmV0dXJuIHZlcnNpb24gbnVtYmVyXG4gICAgICAgIGxldCBydiA9IHVhLmluZGV4T2YoJ3J2OicpO1xuICAgICAgICByZXR1cm4gcGFyc2VJbnQodWEuc3Vic3RyaW5nKHJ2ICsgMywgdWEuaW5kZXhPZignLicsIHJ2KSksIDEwKTtcbiAgICB9XG5cbiAgICBsZXQgZWRnZSA9IHVhLmluZGV4T2YoJ0VkZ2UvJyk7XG4gICAgaWYgKGVkZ2UgPiAwKSB7XG4gICAgICAgLy8gRWRnZSAoSUUgMTIrKSA9PiByZXR1cm4gdmVyc2lvbiBudW1iZXJcbiAgICAgICByZXR1cm4gcGFyc2VJbnQodWEuc3Vic3RyaW5nKGVkZ2UgKyA1LCB1YS5pbmRleE9mKCcuJywgZWRnZSkpLCAxMCk7XG4gICAgfVxuXG4gICAgLy8gb3RoZXIgYnJvd3NlclxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSBwYXJhbWV0ZXIgdmFsdWUuXG4gICAqIFxuICAgKiBDcmVkaXQ6IGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzkwMTExNS9ob3ctY2FuLWktZ2V0LXF1ZXJ5LXN0cmluZy12YWx1ZXMtaW4tamF2YXNjcmlwdFxuICAgKiBcbiAgICogQHBhcmFtIG5hbWUgaXMgdGhlIG5hbWUgb2YgdGhlIHBhcmFtZXRlciB0byBnZXQgdGhlIHZhbHVlIG9mXG4gICAqIEBwYXJhbSB1cmwgaXMgYSBVUkwgdG8gZ2V0IHRoZSBwYXJhbWV0ZXIgZnJvbSwgdXNlcyB0aGUgd2luZG93J3MgY3VycmVudCBocmVmIGlmIG5vdCBnaXZlblxuICAgKiBAcmV0dXJuIHRoZSBwYXJhbWV0ZXIncyB2YWx1ZVxuICAgKi9cbiAgc3RhdGljIGdldFBhcmFtZXRlckJ5TmFtZShuYW1lLCB1cmwpIHtcbiAgICBpZiAoIXVybCkgdXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWY7XG4gICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvW1xcW1xcXV0vZywgXCJcXFxcJCZcIik7XG4gICAgbGV0IHJlZ2V4ID0gbmV3IFJlZ0V4cChcIls/Jl1cIiArIG5hbWUgKyBcIig9KFteJiNdKil8JnwjfCQpXCIpLCByZXN1bHRzID0gcmVnZXguZXhlYyh1cmwpO1xuICAgIGlmICghcmVzdWx0cykgcmV0dXJuIG51bGw7XG4gICAgaWYgKCFyZXN1bHRzWzJdKSByZXR1cm4gJyc7XG4gICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChyZXN1bHRzWzJdLnJlcGxhY2UoL1xcKy9nLCBcIiBcIikpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0cyBhIG5vbi1jcnlwdG9ncmFwaGljYWxseSBzZWN1cmUgcmFuZG9tIG51bWJlciB3aXRoaW4gYSBnaXZlbiByYW5nZS5cbiAgICogXG4gICAqIEBwYXJhbSBtaW4gaXMgdGhlIG1pbmltdW0gcmFuZ2Ugb2YgdGhlIGludCB0byBnZW5lcmF0ZSwgaW5jbHVzaXZlXG4gICAqIEBwYXJhbSBtYXggaXMgdGhlIG1heGltdW0gcmFuZ2Ugb2YgdGhlIGludCB0byBnZW5lcmF0ZSwgaW5jbHVzaXZlXG4gICAqIFxuICAgKiBTb3VyY2U6IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL01hdGgvcmFuZG9tXG4gICAqL1xuICBzdGF0aWMgZ2V0UmFuZG9tSW50KG1pbiwgbWF4KSB7XG4gICAgbWluID0gTWF0aC5jZWlsKG1pbik7XG4gICAgbWF4ID0gTWF0aC5mbG9vcihtYXgpO1xuICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpICsgbWluO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0cyByYW5kb20gaW50cy5cbiAgICogXG4gICAqIEBwYXJhbSBtaW4gaXMgdGhlIG1pbmltdW0gcmFuZ2Ugb2YgdGhlIGludHMgdG8gZ2VuZXJhdGUsIGluY2x1c2l2ZVxuICAgKiBAcGFyYW0gbWF4IGlzIHRoZSBtYXhpbXVtIHJhbmdlIG9mIHRoZSBpbnRzIHRvIGdlbmVyYXRlLCBpbmNsdXNpdmVcbiAgICogQHBhcmFtIGNvdW50IGlzIHRoZSBudW1iZXIgb2YgcmFuZG9tIGludHMgdG8gZ2V0XG4gICAqL1xuICBzdGF0aWMgZ2V0UmFuZG9tSW50cyhtaW4sIG1heCwgY291bnQpIHtcbiAgICBHZW5VdGlscy5hc3NlcnRUcnVlKHR5cGVvZiBjb3VudCA9PT0gXCJudW1iZXJcIik7XG4gICAgbGV0IGludHMgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpKyspIGludHMucHVzaChHZW5VdGlscy5nZXRSYW5kb21JbnQobWluLCBtYXgpKTtcbiAgICByZXR1cm4gaW50cztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldHMgYSBnaXZlbiBudW1iZXIgb2YgdW5pcXVlIHJhbmRvbSBpbnRzIHdpdGhpbiBhIHJhbmdlLlxuICAgKiBcbiAgICogQHBhcmFtIG1pbiBpcyB0aGUgbWluaW11bSByYW5nZSBvZiB0aGUgaW50cyB0byBnZW5lcmF0ZSwgaW5jbHVzaXZlXG4gICAqIEBwYXJhbSBtYXggaXMgdGhlIG1heGltdW0gcmFuZ2Ugb2YgdGhlIGludHMgdG8gZ2VuZXJhdGUsIGluY2x1c2l2ZVxuICAgKiBAcGFyYW0gY291bnQgaXMgdGhlIG51bWJlciBvZiB1bmlxdWUgcmFuZG9tIGludHMgdG8gZ2V0XG4gICAqL1xuICBzdGF0aWMgZ2V0VW5pcXVlUmFuZG9tSW50cyhtaW4sIG1heCwgY291bnQpIHtcbiAgICBsZXQgaW50cyA9IFtdO1xuICAgIEdlblV0aWxzLmFzc2VydFRydWUoY291bnQgPj0gMCk7XG4gICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZShtYXggLSBtaW4gKyAxID49IGNvdW50KTtcbiAgICB3aGlsZSAoaW50cy5sZW5ndGggPCBjb3VudCkge1xuICAgICAgbGV0IHJhbmRvbUludCA9IEdlblV0aWxzLmdldFJhbmRvbUludChtaW4sIG1heCk7XG4gICAgICBpZiAoIWludHMuaW5jbHVkZXMocmFuZG9tSW50KSkgaW50cy5wdXNoKHJhbmRvbUludCk7XG4gICAgfVxuICAgIHJldHVybiBpbnRzO1xuICB9XG4gIFxuICAvKipcbiAgICogUmFuZG9taXplIGFycmF5IGVsZW1lbnQgb3JkZXIgaW4tcGxhY2UgdXNpbmcgRHVyc3RlbmZlbGQgc2h1ZmZsZSBhbGdvcml0aG0uXG4gICAqIFxuICAgKiBDcmVkaXQ6IGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzI0NTA5NTQvaG93LXRvLXJhbmRvbWl6ZS1zaHVmZmxlLWEtamF2YXNjcmlwdC1hcnJheVxuICAgKi9cbiAgc3RhdGljIHNodWZmbGUoYXJyYXkpIHtcbiAgICBmb3IgKHZhciBpID0gYXJyYXkubGVuZ3RoIC0gMTsgaSA+IDA7IGktLSkge1xuICAgICAgdmFyIGogPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAoaSArIDEpKTtcbiAgICAgIHZhciB0ZW1wID0gYXJyYXlbaV07XG4gICAgICBhcnJheVtpXSA9IGFycmF5W2pdO1xuICAgICAgYXJyYXlbal0gPSB0ZW1wO1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIFNvcnRzIGFuIGFycmF5IGJ5IG5hdHVyYWwgb3JkZXJpbmcuXG4gICAqIFxuICAgKiBAcGFyYW0gdGhlIGFycmF5IHRvIHNvcnRcbiAgICovXG4gIHN0YXRpYyBzb3J0KGFycmF5KSB7XG4gICAgYXJyYXkuc29ydCgoYSwgYikgPT4gYSA9PT0gYiA/IDAgOiBhID4gYiA/IDEgOiAtMSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBnaXZlbiB2YWx1ZSBlbnN1cmluZyBhIHByZXZpb3VzIHZhbHVlIGlzIG5vdCBvdmVyd3JpdHRlbi5cbiAgICogXG4gICAqIFRPRE86IHJlbW92ZSBmb3IgcG9ydGFiaWxpdHkgYmVjYXVzZSBmdW5jdGlvbiBwYXNzaW5nIG5vdCBzdXBwb3J0ZWQgaW4gb3RoZXIgbGFuZ3VhZ2VzLCB1c2UgcmVjb25jaWxlIG9ubHlcbiAgICogXG4gICAqIEBwYXJhbSBvYmogaXMgdGhlIG9iamVjdCB0byBpbnZva2UgdGhlIGdldHRlciBhbmQgc2V0dGVyIG9uXG4gICAqIEBwYXJhbSBnZXRGbiBnZXRzIHRoZSBjdXJyZW50IHZhbHVlXG4gICAqIEBwYXJhbSBzZXRGbiBzZXRzIHRoZSBjdXJyZW50IHZhbHVlXG4gICAqIEBwYXJhbSB2YWwgaXMgdGhlIHZhbHVlIHRvIHNldCBpZmYgaXQgZG9lcyBub3Qgb3ZlcndyaXRlIGEgcHJldmlvdXMgdmFsdWVcbiAgICogQHBhcmFtIFtjb25maWddIHNwZWNpZmllcyByZWNvbmNpbGlhdGlvbiBjb25maWd1cmF0aW9uXG4gICAqICAgICAgICBjb25maWcucmVzb2x2ZURlZmluZWQgdXNlcyBkZWZpbmVkIHZhbHVlIGlmIHRydWUgb3IgdW5kZWZpbmVkLCB1bmRlZmluZWQgaWYgZmFsc2VcbiAgICogICAgICAgIGNvbmZpZy5yZXNvbHZlVHJ1ZSB1c2VzIHRydWUgb3ZlciBmYWxzZSBpZiB0cnVlLCBmYWxzZSBvdmVyIHRydWUgaWYgZmFsc2UsIG11c3QgYmUgZXF1YWwgaWYgdW5kZWZpbmVkXG4gICAqICAgICAgICBjb25maWcucmVzb2x2ZU1heCB1c2VzIG1heCBvdmVyIG1pbiBpZiB0cnVlLCBtaW4gb3ZlciBtYXggaWYgZmFsc2UsIG11c3QgYmUgZXF1YWwgaWYgdW5kZWZpbmVkXG4gICAqIEBwYXJhbSBbZXJyTXNnXSBpcyB0aGUgZXJyb3IgbWVzc2FnZSB0byB0aHJvdyBpZiB0aGUgdmFsdWVzIGNhbm5vdCBiZSByZWNvbmNpbGVkIChvcHRpb25hbClcbiAgICovXG4gIHN0YXRpYyBzYWZlU2V0KG9iaiwgZ2V0Rm4sIHNldEZuLCB2YWwsIGNvbmZpZz8sIGVyck1zZz8pIHtcbiAgICBsZXQgY3VyVmFsID0gZ2V0Rm4uY2FsbChvYmopO1xuICAgIGxldCByZWNvbmNpbGVkVmFsID0gR2VuVXRpbHMucmVjb25jaWxlKGN1clZhbCwgdmFsLCBjb25maWcsIGVyck1zZyk7XG4gICAgaWYgKGN1clZhbCAhPT0gcmVjb25jaWxlZFZhbCkgc2V0Rm4uY2FsbChvYmosIHJlY29uY2lsZWRWYWwpO1xuICB9XG4gIFxuICAvKipcbiAgICogUmVjb25jaWxlcyB0d28gdmFsdWVzLlxuICAgKiBcbiAgICogVE9ETzogcmVtb3ZlIGN1c3RvbSBlcnJvciBtZXNzYWdlXG4gICAqIFxuICAgKiBAcGFyYW0gdmFsMSBpcyBhIHZhbHVlIHRvIHJlY29uY2lsZVxuICAgKiBAcGFyYW0gdmFsMiBpcyBhIHZhbHVlIHRvIHJlY29uY2lsZVxuICAgKiBAcGFyYW0gW2NvbmZpZ10gc3BlY2lmaWVzIHJlY29uY2lsaWF0aW9uIGNvbmZpZ3VyYXRpb25cbiAgICogICAgICAgIGNvbmZpZy5yZXNvbHZlRGVmaW5lZCB1c2VzIGRlZmluZWQgdmFsdWUgaWYgdHJ1ZSBvciB1bmRlZmluZWQsIHVuZGVmaW5lZCBpZiBmYWxzZVxuICAgKiAgICAgICAgY29uZmlnLnJlc29sdmVUcnVlIHVzZXMgdHJ1ZSBvdmVyIGZhbHNlIGlmIHRydWUsIGZhbHNlIG92ZXIgdHJ1ZSBpZiBmYWxzZSwgbXVzdCBiZSBlcXVhbCBpZiB1bmRlZmluZWRcbiAgICogICAgICAgIGNvbmZpZy5yZXNvbHZlTWF4IHVzZXMgbWF4IG92ZXIgbWluIGlmIHRydWUsIG1pbiBvdmVyIG1heCBpZiBmYWxzZSwgbXVzdCBiZSBlcXVhbCBpZiB1bmRlZmluZWRcbiAgICogQHBhcmFtIFtlcnJNc2ddIGlzIHRoZSBlcnJvciBtZXNzYWdlIHRvIHRocm93IGlmIHRoZSB2YWx1ZXMgY2Fubm90IGJlIHJlY29uY2lsZWQgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHRoZSByZWNvbmNpbGVkIHZhbHVlIGlmIHJlY29uY2lsYWJsZSwgdGhyb3dzIGVycm9yIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIHJlY29uY2lsZSh2YWwxLCB2YWwyLCBjb25maWc/LCBlcnJNc2c/KSB7XG4gICAgXG4gICAgLy8gY2hlY2sgZm9yIGVxdWFsaXR5XG4gICAgaWYgKHZhbDEgPT09IHZhbDIpIHJldHVybiB2YWwxO1xuICAgIFxuICAgIC8vIGNoZWNrIGZvciBiaWdpbnQgZXF1YWxpdHlcbiAgICBsZXQgY29tcGFyaXNvbjsgLy8gc2F2ZSBjb21wYXJpc29uIGZvciBsYXRlciBpZiBhcHBsaWNhYmxlXG4gICAgaWYgKHR5cGVvZiB2YWwxID09PSBcImJpZ2ludFwiICYmIHR5cGVvZiB2YWwyID09PSBcImJpZ2ludFwiKSB7XG4gICAgICBpZiAodmFsMSA9PT0gdmFsMikgcmV0dXJuIHZhbDE7XG4gICAgfVxuICAgIFxuICAgIC8vIHJlc29sdmUgb25lIHZhbHVlIGRlZmluZWRcbiAgICBpZiAodmFsMSA9PT0gdW5kZWZpbmVkIHx8IHZhbDIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKGNvbmZpZyAmJiBjb25maWcucmVzb2x2ZURlZmluZWQgPT09IGZhbHNlKSByZXR1cm4gdW5kZWZpbmVkOyAgLy8gdXNlIHVuZGVmaW5lZFxuICAgICAgZWxzZSByZXR1cm4gdmFsMSA9PT0gdW5kZWZpbmVkID8gdmFsMiA6IHZhbDE7ICAvLyB1c2UgZGVmaW5lZCB2YWx1ZVxuICAgIH1cbiAgICBcbiAgICAvLyByZXNvbHZlIGRpZmZlcmVudCBib29sZWFuc1xuICAgIGlmIChjb25maWcgJiYgY29uZmlnLnJlc29sdmVUcnVlICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIHZhbDEgPT09IFwiYm9vbGVhblwiICYmIHR5cGVvZiB2YWwyID09PSBcImJvb2xlYW5cIikge1xuICAgICAgYXNzZXJ0LmVxdWFsKHR5cGVvZiBjb25maWcucmVzb2x2ZVRydWUsIFwiYm9vbGVhblwiKTtcbiAgICAgIHJldHVybiBjb25maWcucmVzb2x2ZVRydWU7XG4gICAgfVxuICAgIFxuICAgIC8vIHJlc29sdmUgZGlmZmVyZW50IG51bWJlcnNcbiAgICBpZiAoY29uZmlnICYmIGNvbmZpZy5yZXNvbHZlTWF4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGFzc2VydC5lcXVhbCh0eXBlb2YgY29uZmlnLnJlc29sdmVNYXgsIFwiYm9vbGVhblwiKTtcbiAgICAgIFxuICAgICAgLy8gcmVzb2x2ZSBqcyBudW1iZXJzXG4gICAgICBpZiAodHlwZW9mIHZhbDEgPT09IFwibnVtYmVyXCIgJiYgdHlwZW9mIHZhbDIgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5yZXNvbHZlTWF4ID8gTWF0aC5tYXgodmFsMSwgdmFsMikgOiBNYXRoLm1pbih2YWwxLCB2YWwyKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gcmVzb2x2ZSBiaWdpbnRzXG4gICAgICBpZiAodHlwZW9mIHZhbDEgPT09IFwiYmlnaW50XCIgJiYgdHlwZW9mIHZhbDIgPT09IFwiYmlnaW50XCIpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5yZXNvbHZlTWF4ID8gKGNvbXBhcmlzb24gPCAwID8gdmFsMiA6IHZhbDEpIDogKGNvbXBhcmlzb24gPCAwID8gdmFsMSA6IHZhbDIpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBhc3NlcnQgZGVlcCBlcXVhbGl0eVxuICAgIGFzc2VydC5kZWVwRXF1YWwodmFsMSwgdmFsMiwgZXJyTXNnID8gZXJyTXNnIDogXCJDYW5ub3QgcmVjb25jaWxlIHZhbHVlcyBcIiArIHZhbDEgKyBcIiBhbmQgXCIgKyB2YWwyICsgXCIgd2l0aCBjb25maWc6IFwiICsgSlNPTi5zdHJpbmdpZnkoY29uZmlnKSk7XG4gICAgcmV0dXJuIHZhbDE7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgaHVtYW4tZnJpZW5kbHkga2V5IHZhbHVlIGxpbmUuXG4gICAqIFxuICAgKiBAcGFyYW0ga2V5IGlzIHRoZSBrZXlcbiAgICogQHBhcmFtIHZhbHVlIGlzIHRoZSB2YWx1ZVxuICAgKiBAcGFyYW0gaW5kZW50IGluZGVudHMgdGhlIGxpbmVcbiAgICogQHBhcmFtIG5ld2xpbmUgc3BlY2lmaWVzIGlmIHRoZSBzdHJpbmcgc2hvdWxkIGJlIHRlcm1pbmF0ZWQgd2l0aCBhIG5ld2xpbmUgb3Igbm90XG4gICAqIEBwYXJhbSBpZ25vcmVVbmRlZmluZWQgc3BlY2lmaWVzIGlmIHVuZGVmaW5lZCB2YWx1ZXMgc2hvdWxkIHJldHVybiBhbiBlbXB0eSBzdHJpbmdcbiAgICogQHJldHVybiB7c3RyaW5nfSBpcyB0aGUgaHVtYW4tZnJpZW5kbHkga2V5IHZhbHVlIGxpbmVcbiAgICovXG4gIHN0YXRpYyBrdkxpbmUoa2V5LCB2YWx1ZSwgaW5kZW50ID0gMCwgbmV3bGluZSA9IHRydWUsIGlnbm9yZVVuZGVmaW5lZCA9IHRydWUpIHtcbiAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCAmJiBpZ25vcmVVbmRlZmluZWQpIHJldHVybiBcIlwiO1xuICAgIHJldHVybiBHZW5VdGlscy5nZXRJbmRlbnQoaW5kZW50KSArIGtleSArIFwiOiBcIiArIHZhbHVlICsgKG5ld2xpbmUgPyAnXFxuJyA6IFwiXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogUmVwbGFjZSBiaWcgaW50ZWdlcnMgKDE2IG9yIG1vcmUgY29uc2VjdXRpdmUgZGlnaXRzKSB3aXRoIHN0cmluZ3MgaW4gb3JkZXJcbiAgICogdG8gcHJlc2VydmUgbnVtZXJpYyBwcmVjaXNpb24uXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gc3RyIGlzIHRoZSBzdHJpbmcgdG8gYmUgbW9kaWZpZWRcbiAgICogQHJldHVybiB7c3RyaW5nfSB0aGUgbW9kaWZpZWQgc3RyaW5nIHdpdGggYmlnIG51bWJlcnMgY29udmVydGVkIHRvIHN0cmluZ3NcbiAgICovXG4gIHN0YXRpYyBzdHJpbmdpZnlCaWdJbnRzKHN0cikge1xuICAgIHJldHVybiBzdHIucmVwbGFjZSgvKFwiW15cIl0qXCJcXHMqOlxccyopKFxcZHsxNix9KS9nLCAnJDFcIiQyXCInKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFByaW50IHRoZSBjdXJyZW50IHN0YWNrIHRyYWNlLiBcbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtc2cgLSBvcHRpb25hbCBtZXNzYWdlIHRvIHByaW50IHdpdGggdGhlIHRyYWNlXG4gICAqL1xuICBzdGF0aWMgcHJpbnRTdGFja1RyYWNlKG1zZykge1xuICAgIHRyeSB7IHRocm93IG5ldyBFcnJvcihtc2cpOyB9XG4gICAgY2F0Y2ggKGVycjogYW55KSB7IGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrKTsgfVxuICB9XG4gIFxuICAvKipcbiAgICogV2FpdCBmb3IgdGhlIGR1cmF0aW9uLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uTXMgLSB0aGUgZHVyYXRpb24gdG8gd2FpdCBmb3IgaW4gbWlsbGlzZWNvbmRzXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgd2FpdEZvcihkdXJhdGlvbk1zKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUpIHsgc2V0VGltZW91dChyZXNvbHZlLCBkdXJhdGlvbk1zKTsgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBLaWxsIHRoZSBnaXZlbiBub2RlanMgY2hpbGQgcHJvY2Vzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7Q2hpbGRQcm9jZXNzfSBwcm9jZXNzIC0gdGhlIG5vZGVqcyBjaGlsZCBwcm9jZXNzIHRvIGtpbGxcbiAgICogQHBhcmFtIHtudW1iZXIgfCBOb2RlSlMuU2lnbmFsc30gW3NpZ25hbF0gLSB0aGUga2lsbCBzaWduYWwsIGUuZy4gU0lHVEVSTSwgU0lHS0lMTCwgU0lHSU5UIChkZWZhdWx0KVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlciB8IHVuZGVmaW5lZD59IHRoZSBleGl0IGNvZGUgZnJvbSBraWxsaW5nIHRoZSBwcm9jZXNzXG4gICAqL1xuICBzdGF0aWMgYXN5bmMga2lsbFByb2Nlc3MocHJvY2VzczogQ2hpbGRQcm9jZXNzLCBzaWduYWw/OiBudW1iZXIgfCBOb2RlSlMuU2lnbmFscyk6IFByb21pc2U8bnVtYmVyIHwgdW5kZWZpbmVkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHByb2Nlc3Mub24oXCJleGl0XCIsIGZ1bmN0aW9uKGNvZGUsIHNpZ25hbCkgeyByZXNvbHZlKGNvZGUpOyB9KTtcbiAgICAgIHByb2Nlc3Mub24oXCJlcnJvclwiLCBmdW5jdGlvbihlcnIpIHsgcmVqZWN0KGVycik7IH0pO1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKCFwcm9jZXNzLmtpbGwoc2lnbmFsID09PSB1bmRlZmluZWQgPyBcIlNJR0lOVFwiIDogc2lnbmFsKSkgcmVzb2x2ZSh1bmRlZmluZWQpOyAvLyByZXNvbHZlIGltbWVkaWF0ZWx5IGlmIG5vdCBydW5uaW5nXG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTm9ybWFsaXplIGEgVVJJLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVyaSAtIHRoZSBVUkkgdG8gbm9ybWFsaXplXG4gICAqIEByZXR1cm4ge3N0cmluZ30gdGhlIG5vcm1hbGl6ZWQgVVJJXG4gICAqL1xuICBzdGF0aWMgbm9ybWFsaXplVXJpKHVyaSkge1xuICAgIGlmICghdXJpKSB0aHJvdyBFcnJvcihcIk11c3QgcHJvdmlkZSBVUkkgdG8gbm9ybWFsaXplXCIpO1xuICAgIHVyaSA9IHVyaS5yZXBsYWNlKC9cXC8kLywgXCJcIik7IC8vIHN0cmlwIHRyYWlsaW5nIHNsYXNoXG4gICAgaWYgKCFuZXcgUmVnRXhwKFwiXlxcXFx3KzovLy4rXCIpLnRlc3QodXJpKSkgdXJpPSBcImh0dHA6Ly9cIiArIHVyaTsgLy8gYXNzdW1lIGh0dHAgaWYgcHJvdG9jb2wgbm90IGdpdmVuXG4gICAgcmV0dXJuIHVyaTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgYWJzb2x1dGUgdmFsdWUgb2YgdGhlIGdpdmVuIGJpZ2ludCBvciBudW1iZXIuXG4gICAqIFxuICAgKiBAcGFyYW0ge2JpZ2ludCB8IG51bWJlcn0gYmkgLSB0aGUgYmlnaW50IG9yIG51bWJlciB0byBnZXQgdGhlIGFic29sdXRlIHZhbHVlIG9mXG4gICAqIEByZXR1cm4ge2JpZ2ludCB8IG51bWJlcn0gdGhlIGFic29sdXRlIHZhbHVlIG9mIHRoZSBnaXZlbiBiaWdpbnQgb3IgbnVtYmVyXG4gICAqL1xuICBzdGF0aWMgYWJzKGJpOiBiaWdpbnQgfCBudW1iZXIpOiBiaWdpbnQgfCBudW1iZXIge1xuICAgIHJldHVybiBiaSA8IDAgPyAtYmkgOiBiaTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYW4gZW51bSBrZXkgbmFtZSBieSB2YWx1ZS5cbiAgICogXG4gICAqIEBwYXJhbSB7YW55fSBlbnVtVHlwZSBpcyB0aGUgZW51bSB0eXBlIHRvIGdldCB0aGUga2V5IGZyb21cbiAgICogQHBhcmFtIHthbnl9IGVudW1WYWx1ZSBpcyB0aGUgZW51bSB2YWx1ZSB0byBnZXQgdGhlIGtleSBmb3JcbiAgICogQHJldHVybiB7c3RyaW5nIHwgdW5kZWZpbmVkfSB0aGUgZW51bSBrZXkgbmFtZVxuICAgKi9cbiAgc3RhdGljIGdldEVudW1LZXlCeVZhbHVlKGVudW1UeXBlOiBhbnksIGVudW1WYWx1ZTogYW55KTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICBmb3IgKGxldCBrZXkgaW4gZW51bVR5cGUpIHtcbiAgICAgIGlmIChlbnVtVHlwZVtrZXldID09PSBlbnVtVmFsdWUpIHJldHVybiBrZXk7XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogUmVzb2x2ZSB0aGUgZ2l2ZW4gcHJvbWlzZSB3aXRoIGEgdGltZW91dC5cbiAgICogXG4gICAqIEBwYXJhbSBwcm9taXNlIHRoZSBwcm9taXNlIHRvIHJlc29sdmUgd2l0aGluIHRoZSB0aW1lb3V0XG4gICAqIEBwYXJhbSB0aW1lb3V0TXMgdGhlIHRpbWVvdXQgaW4gbWlsbGlzZWNvbmRzIHRvIHJlc29sdmUgdGhlIHByb21pc2VcbiAgICogQHJldHVybiB0aGUgcmVzdWx0IG9mIHRoZSBwcm9taXNlIHVubGVzcyBlcnJvciB0aHJvd25cbiAgICovXG4gIHN0YXRpYyBhc3luYyBleGVjdXRlV2l0aFRpbWVvdXQocHJvbWlzZSwgdGltZW91dE1zKTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3QgdGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHJlamVjdCgnRXhlY3V0aW9uIHRpbWVkIG91dCBpbiAnICsgdGltZW91dE1zICsgJyBtaWxsaXNlY29uZHMnKVxuICAgICAgfSwgdGltZW91dE1zKTtcbiAgICAgIHByb21pc2UudGhlbihcbiAgICAgICAgKHJlc3VsdCkgPT4ge1xuICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgICAgICAgIHJlc29sdmUocmVzdWx0KTtcbiAgICAgICAgfSxcbiAgICAgICAgKGVycm9yKSA9PiB7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICB9KTtcbiAgfVxufVxuXG4iXSwibWFwcGluZ3MiOiJ5TEFBQSxJQUFBQSxPQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxNQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDZSxNQUFNRSxRQUFRLENBQUM7O0VBRTVCO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE9BQU9DLFNBQVNBLENBQUNDLEdBQVEsRUFBVztJQUNsQyxPQUFPLE9BQU9BLEdBQUcsS0FBSyxXQUFXO0VBQ25DOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE9BQU9DLFdBQVdBLENBQUNELEdBQUcsRUFBVztJQUMvQixPQUFPLE9BQU9BLEdBQUcsS0FBSyxXQUFXO0VBQ25DOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE9BQU9FLGFBQWFBLENBQUNGLEdBQVEsRUFBVztJQUN0QyxPQUFPQSxHQUFHLEtBQUtHLFNBQVMsSUFBSUgsR0FBRyxLQUFLLElBQUk7RUFDMUM7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsT0FBT0ksZUFBZUEsQ0FBQ0osR0FBUSxFQUFXO0lBQ3hDLElBQUksQ0FBQ0EsR0FBRyxFQUFFLE9BQU8sSUFBSTtJQUNyQixPQUFPLEtBQUs7RUFDZDs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxPQUFPSyxRQUFRQSxDQUFDTCxHQUFRLEVBQVc7SUFDakMsT0FBTyxDQUFDTSxLQUFLLENBQUNDLFVBQVUsQ0FBQ1AsR0FBRyxDQUFDLENBQUMsSUFBSVEsUUFB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