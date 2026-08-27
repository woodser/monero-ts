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
   * Indicates if the current environment is Deno
   * 
   * @return {boolean} true if the environment is Deno, false otherwise
   */
  static isDeno() {
    return typeof Deno === "object" && Deno.hasOwnProperty("version") && typeof Deno.version === "object" && Deno.version.hasOwnProperty("deno") && typeof Deno.version.deno === "string";
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
   * Indicates if two proxy URIs refer to the same host and port, regardless of scheme.
   *
   * @param {string} uri1 - first proxy URI to compare
   * @param {string} uri2 - second proxy URI to compare
   * @return {boolean} true if the proxy URIs refer to the same host and port
   */
  static isSameProxyUri(uri1, uri2) {
    if (!uri1 || !uri2) return !uri1 === !uri2;
    if (uri1 === uri2) return true;
    try {
      const parsed1 = new URL(GenUtils.normalizeUri(uri1));
      const parsed2 = new URL(GenUtils.normalizeUri(uri2));
      return parsed1.hostname.toLowerCase() === parsed2.hostname.toLowerCase() && parsed1.port === parsed2.port;
    } catch (err) {
      return false;
    }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfYXN5bmMiLCJHZW5VdGlscyIsImlzRGVmaW5lZCIsImFyZyIsImlzVW5kZWZpbmVkIiwiaXNJbml0aWFsaXplZCIsInVuZGVmaW5lZCIsImlzVW5pbml0aWFsaXplZCIsImlzTnVtYmVyIiwiaXNOYU4iLCJwYXJzZUZsb2F0IiwiaXNGaW5pdGUiLCJpc0ludCIsInBhcnNlSW50IiwiTnVtYmVyIiwiaXNBcnJheSIsIkFycmF5IiwiaXNTdHJpbmciLCJpc0Jvb2xlYW4iLCJpc0Z1bmN0aW9uIiwiaXNPYmplY3QiLCJvYmoiLCJpc1VwcGVyQ2FzZSIsInN0ciIsInRvVXBwZXJDYXNlIiwiaXNMb3dlckNhc2UiLCJ0b0xvd2VyQ2FzZSIsImFzc2VydEhleCIsIm1zZyIsImFzc2VydFRydWUiLCJpc0hleCIsImxlbmd0aCIsIm1hdGNoIiwiaXNCYXNlMzIiLCJ0ZXN0IiwiYXNzZXJ0QmFzZTU4IiwiaXNCYXNlNTgiLCJhc3NlcnRCYXNlNjQiLCJpc0Jhc2U2NCIsImJ0b2EiLCJhdG9iIiwiZXJyIiwiZmFpbCIsIkVycm9yIiwiY29uZGl0aW9uIiwiYXNzZXJ0RmFsc2UiLCJib29sIiwiYXNzZXJ0TnVsbCIsImFzc2VydE5vdE51bGwiLCJhc3NlcnREZWZpbmVkIiwiYXNzZXJ0VW5kZWZpbmVkIiwiYXNzZXJ0SW5pdGlhbGl6ZWQiLCJhc3NlcnRVbmluaXRpYWxpemVkIiwiYXNzZXJ0RXF1YWxzIiwiYXJnMSIsImFyZzIiLCJlcXVhbHMiLCJhc3NlcnROb3RFcXVhbHMiLCJhc3NlcnRJbnQiLCJhc3NlcnROdW1iZXIiLCJhc3NlcnRCb29sZWFuIiwiYXNzZXJ0U3RyaW5nIiwiYXNzZXJ0QXJyYXkiLCJhc3NlcnRGdW5jdGlvbiIsImFzc2VydE9iamVjdCIsIm5hbWUiLCJpbmhlcml0c0Zyb20iLCJjaGlsZCIsInBhcmVudCIsInByb3RvdHlwZSIsIk9iamVjdCIsImNyZWF0ZSIsImNvbnN0cnVjdG9yIiwiaW52b2tlIiwiZm5zIiwiYXJndW1lbnRzIiwiYXJncyIsImkiLCJwdXNoIiwiYXBwbHkiLCJnZXRQb3dlclNldCIsImFyciIsImZuIiwibiIsInNyYyIsImdvdCIsImFsbCIsImoiLCJzbGljZSIsImNvbmNhdCIsImdldFBvd2VyU2V0T2ZMZW5ndGgiLCJzaXplIiwicG93ZXJTZXQiLCJwb3dlclNldE9mTGVuZ3RoIiwiZ2V0SW5kaWNlcyIsImluZGljZXMiLCJ0b1VuaXF1ZUFycmF5IiwiZmlsdGVyIiwidmFsdWUiLCJpbmRleCIsInNlbGYiLCJpbmRleE9mIiwiY29weUFycmF5IiwiY29weSIsInJlbW92ZSIsInZhbCIsImZvdW5kIiwic3BsaWNlIiwidG9Mb3dlckNhc2VBcnJheSIsImFycjIiLCJsaXN0aWZ5IiwiYXJyT3JFbGVtIiwiYXJyYXlDb250YWlucyIsImNvbXBhcmVCeVJlZmVyZW5jZSIsInN0ckNvbnRhaW5zIiwic3Vic3RyaW5nIiwiYXJyYXlzRXF1YWwiLCJhcnIxIiwib2JqZWN0c0VxdWFsIiwibWFwMSIsIm1hcDIiLCJrZXlzMSIsImtleXMiLCJrZXlzMiIsImtleTEiLCJrZXkyIiwiZGVsZXRlVW5kZWZpbmVkS2V5cyIsImtleSIsImdldENvbWJpbmF0aW9ucyIsImNvbWJpbmF0aW9uU2l6ZSIsImluZGV4Q29tYmluYXRpb25zIiwiY29tYmluYXRpb25zIiwiaW5kZXhDb21iaW5hdGlvbnNJZHgiLCJpbmRleENvbWJpbmF0aW9uIiwiY29tYmluYXRpb24iLCJpbmRleENvbWJpbmF0aW9uSWR4IiwiZ2V0RG93bmxvYWRhYmxlQSIsImNvbnRlbnRzIiwiYSIsIndpbmRvdyIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImhyZWYiLCJVUkwiLCJjcmVhdGVPYmplY3RVUkwiLCJCbG9iIiwidHlwZSIsImRvd25sb2FkIiwidGFyZ2V0IiwiaW5uZXJIVE1MIiwiY29weVByb3BlcnRpZXMiLCJKU09OIiwicGFyc2UiLCJzdHJpbmdpZnkiLCJkZWxldGVQcm9wZXJ0aWVzIiwicHJvcHMiLCJwcm9wIiwidG9TdHJpbmciLCJoYXNXaGl0ZXNwYWNlIiwiaXNXaGl0ZXNwYWNlIiwiY2hhciIsImlzTmV3bGluZSIsImNvdW50Tm9uV2hpdGVzcGFjZUNoYXJhY3RlcnMiLCJjb3VudCIsImNoYXJBdCIsImdldFdoaXRlc3BhY2VUb2tlbnMiLCJnZXRMaW5lcyIsImdldEludGVybmFsU3R5bGVTaGVldCIsInN0eWxlU2hlZXRzIiwic3R5bGVTaGVldCIsImdldEludGVybmFsU3R5bGVTaGVldFRleHQiLCJpbnRlcm5hbENzcyIsImludGVybmFsU3R5bGVTaGVldCIsImNzc1J1bGVzIiwiY3NzVGV4dCIsImJ1aWxkSHRtbERvY3VtZW50IiwiY29udGVudCIsIm1ldGFzIiwibWV0YSIsImVsZW0iLCJoYXNPd25Qcm9wZXJ0eSIsInNldEF0dHJpYnV0ZSIsIm91dGVySFRNTCIsInRpdGxlIiwiZGVwZW5kZW5jeVBhdGhzIiwiZGVwZW5kZW5jeVBhdGgiLCJlbmRzV2l0aCIsImRpdiIsIiQiLCJhcHBlbmQiLCJjbG9uZSIsImh0bWwiLCJuZXdXaW5kb3ciLCJvbkxvYWQiLCJvbkxvYWRDYWxsZWQiLCJ3Iiwib3BlbiIsIm9uTG9hZE9uY2UiLCJvcGVuZXIiLCJ3cml0ZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJjbG9zZSIsImltZ1RvRGF0YVVybCIsImltZyIsInF1YWxpdHkiLCJjYW52YXMiLCJoZWlnaHQiLCJuYXR1cmFsSGVpZ2h0Iiwid2lkdGgiLCJuYXR1cmFsV2lkdGgiLCJjb250ZXh0IiwiZ2V0Q29udGV4dCIsImRyYXdJbWFnZSIsInRvRGF0YVVSTCIsImlzSW1hZ2VBY2Nlc3NpYmxlIiwidXJsIiwidGltZW91dCIsIm9uRG9uZSIsInJldHVybmVkIiwiSW1hZ2UiLCJvbmxvYWQiLCJvblJlc3BvbnNlIiwib25lcnJvciIsIkRhdGUiLCJzZXRUaW1lb3V0Iiwic2V0SW1tZWRpYXRlIiwiZSIsImlzWmlwRmlsZSIsImZpbGUiLCJpc0pzb25GaWxlIiwiaXNUeHRGaWxlIiwiZ2V0SW1hZ2VzIiwicGF0aHMiLCJmdW5jcyIsImxvYWRGdW5jIiwiYXN5bmMiLCJwYXJhbGxlbCIsInBhdGgiLCJnZXRJbmRlbnQiLCJpbml0UG9seWZpbGxzIiwiYXNzaWduIiwiZGVmaW5lUHJvcGVydHkiLCJ2YXJBcmdzIiwiVHlwZUVycm9yIiwidG8iLCJuZXh0U291cmNlIiwibmV4dEtleSIsImNhbGwiLCJ3cml0YWJsZSIsImNvbmZpZ3VyYWJsZSIsIlN0cmluZyIsInN0YXJ0c1dpdGgiLCJzZWFyY2hTdHJpbmciLCJwb3NpdGlvbiIsInN1YnN0ciIsImdldFVVSUQiLCJyZXBsYWNlIiwiYyIsInIiLCJNYXRoIiwicmFuZG9tIiwidiIsImlzQnJvd3NlciIsImlzV29ya2VyIiwiaW1wb3J0U2NyaXB0cyIsImlzQnJvd3Nlck1haW4iLCJGdW5jdGlvbiIsImlzSnNEb20iLCJpc0Rlbm8iLCJEZW5vIiwidmVyc2lvbiIsImRlbm8iLCJpc0ZpcmVmb3giLCJuYXZpZ2F0b3IiLCJ1c2VyQWdlbnQiLCJnZXRJRVZlcnNpb24iLCJ1YSIsIm1zaWUiLCJ0cmlkZW50IiwicnYiLCJlZGdlIiwiZ2V0UGFyYW1ldGVyQnlOYW1lIiwibG9jYXRpb24iLCJyZWdleCIsIlJlZ0V4cCIsInJlc3VsdHMiLCJleGVjIiwiZGVjb2RlVVJJQ29tcG9uZW50IiwiZ2V0UmFuZG9tSW50IiwibWluIiwibWF4IiwiY2VpbCIsImZsb29yIiwiZ2V0UmFuZG9tSW50cyIsImludHMiLCJnZXRVbmlxdWVSYW5kb21JbnRzIiwicmFuZG9tSW50IiwiaW5jbHVkZXMiLCJzaHVmZmxlIiwiYXJyYXkiLCJ0ZW1wIiwic29ydCIsImIiLCJzYWZlU2V0IiwiZ2V0Rm4iLCJzZXRGbiIsImNvbmZpZyIsImVyck1zZyIsImN1clZhbCIsInJlY29uY2lsZWRWYWwiLCJyZWNvbmNpbGUiLCJ2YWwxIiwidmFsMiIsImNvbXBhcmlzb24iLCJyZXNvbHZlRGVmaW5lZCIsInJlc29sdmVUcnVlIiwiYXNzZXJ0IiwiZXF1YWwiLCJyZXNvbHZlTWF4IiwiZGVlcEVxdWFsIiwia3ZMaW5lIiwiaW5kZW50IiwibmV3bGluZSIsImlnbm9yZVVuZGVmaW5lZCIsInN0cmluZ2lmeUJpZ0ludHMiLCJwcmludFN0YWNrVHJhY2UiLCJjb25zb2xlIiwiZXJyb3IiLCJzdGFjayIsIndhaXRGb3IiLCJkdXJhdGlvbk1zIiwiUHJvbWlzZSIsInJlc29sdmUiLCJraWxsUHJvY2VzcyIsInByb2Nlc3MiLCJzaWduYWwiLCJyZWplY3QiLCJvbiIsImNvZGUiLCJraWxsIiwibm9ybWFsaXplVXJpIiwidXJpIiwiaXNTYW1lUHJveHlVcmkiLCJ1cmkxIiwidXJpMiIsInBhcnNlZDEiLCJwYXJzZWQyIiwiaG9zdG5hbWUiLCJwb3J0IiwiYWJzIiwiYmkiLCJnZXRFbnVtS2V5QnlWYWx1ZSIsImVudW1UeXBlIiwiZW51bVZhbHVlIiwiZXhlY3V0ZVdpdGhUaW1lb3V0IiwicHJvbWlzZSIsInRpbWVvdXRNcyIsInRpbWVvdXRJZCIsInRoZW4iLCJyZXN1bHQiLCJjbGVhclRpbWVvdXQiLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL2NvbW1vbi9HZW5VdGlscy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXNzZXJ0IGZyb20gXCJhc3NlcnRcIjtcbmltcG9ydCBhc3luYyBmcm9tIFwiYXN5bmNcIjtcbmltcG9ydCB7IENoaWxkUHJvY2VzcyB9IGZyb20gXCJjaGlsZF9wcm9jZXNzXCI7XG5cbmRlY2xhcmUgdmFyIERlbm86IGFueTtcblxuLyoqXG4gKiBNSVQgTGljZW5zZVxuICogXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKiBcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxuICogY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqIFxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICogU09GVFdBUkUuXG4gKi9cblxuLyoqXG4gKiBDb2xsZWN0aW9uIG9mIGdlbmVyYWwgcHVycG9zZSB1dGlsaXRpZXMuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEdlblV0aWxzIHtcbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGRlZmluZWQuXG4gICAqIFxuICAgKiBAcGFyYW0ge2FueX0gYXJnIGlzIHRoZSBhcmcgdG8gdGVzdFxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBnaXZlbiBhcmcgaXMgZGVmaW5lZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaXNEZWZpbmVkKGFyZzogYW55KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHR5cGVvZiBhcmcgIT09ICd1bmRlZmluZWQnO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgdW5kZWZpbmVkLlxuICAgKiBcbiAgICogQHBhcmFtIGFyZyBpcyB0aGUgYXJnIHRvIHRlc3RcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgZ2l2ZW4gYXJnIGlzIHVuZGVmaW5lZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaXNVbmRlZmluZWQoYXJnKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICd1bmRlZmluZWQnO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZ2l2ZW4gYXJnIGlzIGluaXRpYWxpemVkLlxuICAgKiBcbiAgICogQHBhcmFtIHthbnl9IGFyZyBpcyB0aGUgYXJnIHRvIHRlc3RcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgZ2l2ZW4gYXJnIGlzIGluaXRpYWxpemVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc0luaXRpYWxpemVkKGFyZzogYW55KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGFyZyAhPT0gdW5kZWZpbmVkICYmIGFyZyAhPT0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGdpdmVuIGFyZyBpcyB1bmluaXRpYWxpemVkLlxuICAgKiBcbiAgICogQHBhcmFtIGFyZyBpcyB0aGUgYXJnIHRvIHRlc3RcbiAgICogQHJldHVybiB0cnVlIGlmIHRoZSBnaXZlbiBhcmcgaXMgdW5pbml0aWFsaXplZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaXNVbmluaXRpYWxpemVkKGFyZzogYW55KTogYm9vbGVhbiB7XG4gICAgaWYgKCFhcmcpIHJldHVybiB0cnVlO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGEgbnVtYmVyLlxuICAgKiBcbiAgICogQHBhcmFtIHthbnl9IGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gdGVzdFxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBhcmd1bWVudCBpcyBhIG51bWJlciwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaXNOdW1iZXIoYXJnOiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gIWlzTmFOKHBhcnNlRmxvYXQoYXJnKSkgJiYgaXNGaW5pdGUoYXJnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGFuIGludGVnZXIuXG4gICAqIFxuICAgKiBAcGFyYW0ge2FueX0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byB0ZXN0XG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGFuIGludGVnZXIsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGlzSW50KGFyZzogYW55KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGFyZyA9PT0gcGFyc2VJbnQoXCJcIiArIE51bWJlcihhcmcpKSAmJiAhaXNOYU4oYXJnKSAmJiAhaXNOYU4ocGFyc2VJbnQoYXJnLCAxMCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYW4gYXJyYXkuXG4gICAqIFxuICAgKiBAcGFyYW0ge2FueX0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byB0ZXN0IGFzIGJlaW5nIGFuIGFycmF5XG4gICAqIEByZXR1cm4ge2Jvb29sZWFufSB0cnVlIGlmIHRoZSBhcmd1bWVudCBpcyBhbiBhcnJheSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaXNBcnJheShhcmc6IGFueSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBhcmcgaW5zdGFuY2VvZiBBcnJheSAmJiBBcnJheS5pc0FycmF5KGFyZyk7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhIHN0cmluZy5cbiAgICogXG4gICAqIEBwYXJhbSB7YW55fSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIHRlc3QgYXMgYmVpbmcgYSBzdHJpbmdcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgYXJndW1lbnQgaXMgYSBzdHJpbmcsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGlzU3RyaW5nKGFyZzogYW55KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGEgYm9vbGVhbi5cbiAgICogXG4gICAqIEBwYXJhbSB7YW55fSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIHRlc3QgYXMgYmVpbmcgYSBib29sZWFuXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGFyZ3VtZW50IGlzIGEgYm9vbGVhbiwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaXNCb29sZWFuKGFyZzogYW55KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHR5cGVvZihhcmcpID09IHR5cGVvZih0cnVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIGlmIHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhIHN0YXRpYy5cbiAgICogXG4gICAqIEBwYXJhbSB7YW55fSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIHRlc3QgYXMgYmVpbmcgYSBzdGF0aWNcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgYXJndW1lbnQgaXMgYSBzdGF0aWMsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGlzRnVuY3Rpb24oYXJnOiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gXCJmdW5jdGlvblwiO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYW4gb2JqZWN0IGFuZCBvcHRpb25hbGx5IGlmIGl0IGhhcyB0aGUgZ2l2ZW4gY29uc3RydWN0b3IgbmFtZS5cbiAgICogXG4gICAqIEBwYXJhbSB7YW55fSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIHRlc3RcbiAgICogQHBhcmFtIHthbnl9IG9iaiBpcyBhbiBvYmplY3QgdG8gdGVzdCBhcmcgaW5zdGFuY2VvZiBvYmogKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhbiBvYmplY3QgYW5kIG9wdGlvbmFsbHkgaGFzIHRoZSBnaXZlbiBjb25zdHJ1Y3RvciBuYW1lXG4gICAqL1xuICBzdGF0aWMgaXNPYmplY3QoYXJnOiBhbnksIG9iaj86IGFueSk6IGJvb2xlYW4ge1xuICAgIGlmICghYXJnKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKHR5cGVvZiBhcmcgIT09ICdvYmplY3QnKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKG9iaiAmJiAhKGFyZyBpbnN0YW5jZW9mIG9iaikpIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIGlmIGFsbCBhbHBoYWJldCBjaGFyYWN0ZXJzIGluIHRoZSBnaXZlbiBzdHJpbmcgYXJlIHVwcGVyIGNhc2UuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gc3RyIGlzIHRoZSBzdHJpbmcgdG8gdGVzdFxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBzdHJpbmcgaXMgdXBwZXIgY2FzZSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaXNVcHBlckNhc2Uoc3RyOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gc3RyLnRvVXBwZXJDYXNlKCkgPT09IHN0cjtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIGlmIGFsbCBhbHBoYWJldCBjaGFyYWN0ZXJzIGluIHRoZSBnaXZlbiBzdHJpbmcgYXJlIGxvd2VyIGNhc2UuXG4gICAqIFxuICAgKiBAcGFyYW0gc3RyIGlzIHRoZSBzdHJpbmcgdG8gdGVzdFxuICAgKiBAcGFyYW0gdHJ1ZSBpZiB0aGUgc3RyaW5nIGlzIGxvd2VyIGNhc2UsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGlzTG93ZXJDYXNlKHN0cikge1xuICAgIHJldHVybiBzdHIudG9Mb3dlckNhc2UoKSA9PT0gc3RyO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgaGV4LlxuICAgKiBcbiAgICogQHBhcmFtIGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gYXNzZXJ0IGFzIGhleFxuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIHRoZSBhcmd1bWVudCBpcyBub3QgaGV4XG4gICAqL1xuICBzdGF0aWMgYXNzZXJ0SGV4KHN0ciwgbXNnKSB7XG4gICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZShHZW5VdGlscy5pc0hleChzdHIpLCBtc2cgPyBtc2cgOiBcIkFyZ3VtZW50IGFzc2VydGVkIGFzIGhleCBidXQgaXMgbm90IGhleFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGEgaGV4aWRlbWFsIHN0cmluZy5cbiAgICogXG4gICAqIENyZWRpdDogaHR0cHM6Ly9naXRodWIuY29tL3JvcnlyamIvaXMtaGV4L2Jsb2IvbWFzdGVyL2lzLWhleC5qcy5cbiAgICogXG4gICAqIEBwYXJhbSBzdHIgaXMgdGhlIHN0cmluZyB0byB0ZXN0XG4gICAqIEByZXR1cm4gdHJ1ZSBpZiB0aGUgZ2l2ZW4gc3RyaW5nIGlzIGhleGlkZWNpbWFsLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc0hleChhcmcpIHtcbiAgICBpZiAodHlwZW9mIGFyZyAhPT0gJ3N0cmluZycpIHJldHVybiBmYWxzZTtcbiAgICBpZiAoYXJnLmxlbmd0aCA9PT0gMCkgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiAoYXJnLm1hdGNoKC8oWzAtOV18W2EtZl0pL2dpbSkgfHwgW10pLmxlbmd0aCA9PT0gYXJnLmxlbmd0aDtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIGlmIHRoZSBnaXZlbiBzdHJpbmcgaXMgYmFzZTMyLlxuICAgKi9cbiAgc3RhdGljIGlzQmFzZTMyKHN0cikge1xuICAgIGlmICh0eXBlb2Ygc3RyICE9PSAnc3RyaW5nJykgcmV0dXJuIGZhbHNlO1xuICAgIEdlblV0aWxzLmFzc2VydFRydWUoc3RyLmxlbmd0aCA+IDAsIFwiQ2Fubm90IGRldGVybWluZSBpZiBlbXB0eSBzdHJpbmcgaXMgYmFzZTMyXCIpO1xuICAgIHJldHVybiAvXltBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWjIzNDU2N10rJC8udGVzdChzdHIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYmFzZTU4LlxuICAgKiBcbiAgICogQHBhcmFtIGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gYXNzZXJ0IGFzIGJhc2U1OFxuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIHRoZSBhcmd1bWVudCBpcyBub3QgYmFzZTU4XG4gICAqL1xuICBzdGF0aWMgYXNzZXJ0QmFzZTU4KHN0ciwgbXNnKSB7XG4gICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZShHZW5VdGlscy5pc0Jhc2U1OChzdHIpLCBtc2cgPyBtc2cgOiBcIkFyZ3VtZW50IGFzc2VydGVkIGFzIGJhc2U1OCBidXQgaXMgbm90IGJhc2U1OFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIGlmIHRoZSBnaXZlbiBzdHJpbmcgaXMgYmFzZTU4LlxuICAgKi9cbiAgc3RhdGljIGlzQmFzZTU4KHN0cikge1xuICAgIGlmICh0eXBlb2Ygc3RyICE9PSAnc3RyaW5nJykgcmV0dXJuIGZhbHNlO1xuICAgIEdlblV0aWxzLmFzc2VydFRydWUoc3RyLmxlbmd0aCA+IDAsIFwiQ2Fubm90IGRldGVybWluZSBpZiBlbXB0eSBzdHJpbmcgaXMgYmFzZTU4XCIpO1xuICAgIHJldHVybiAvXlsxMjM0NTY3ODlBQkNERUZHSEpLTE1OUFFSU1RVVldYWVphYmNkZWZnaGlqa21ub3BxcnN0dXZ3eHl6XSskLy50ZXN0KHN0cik7XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBhcmd1bWVudCBpcyBiYXNlNjQuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byBhc3NlcnQgYXMgYmFzZTY0XG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgdGhlIGFyZ3VtZW50IGlzIG5vdCBiYXNlNjRcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRCYXNlNjQoc3RyLCBtc2cpIHtcbiAgICBHZW5VdGlscy5hc3NlcnRUcnVlKEdlblV0aWxzLmlzQmFzZTY0KHN0ciksIG1zZyA/IG1zZyA6IFwiQXJndW1lbnQgYXNzZXJ0ZWQgYXMgYmFzZTY0IGJ1dCBpcyBub3QgYmFzZTY0XCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgdGhlIGdpdmVuIHN0cmluZyBpcyBiYXNlNjQuXG4gICAqL1xuICBzdGF0aWMgaXNCYXNlNjQoc3RyKSB7XG4gICAgaWYgKHR5cGVvZiBzdHIgIT09ICdzdHJpbmcnKSByZXR1cm4gZmFsc2U7XG4gICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZShzdHIubGVuZ3RoID4gMCwgXCJDYW5ub3QgZGV0ZXJtaW5lIGlmIGVtcHR5IHN0cmluZyBpcyBiYXNlNjRcIik7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBidG9hKGF0b2Ioc3RyKSkgPT0gc3RyO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUaHJvd3MgYW4gZXhjZXB0aW9uIHdpdGggdGhlIGdpdmVuIG1lc3NhZ2UuXG4gICAqIFxuICAgKiBAcGFyYW0gbXNnIGRlZmluZXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgdGhlIGV4Y2VwdGlvbiB3aXRoIChvcHRpb25hbClcbiAgICovXG4gIHN0YXRpYyBmYWlsKG1zZz8pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJGYWlsdXJlIChubyBtZXNzYWdlKVwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIGdpdmVuIGNvbmRpdGlvbiBpcyB0cnVlLiAgVGhyb3dzIGFuIGV4Y2VwdGlvbiBpZiBub3QgYSBib29sZWFuIG9yIGZhbHNlLlxuICAgKiBcbiAgICogQHBhcmFtIHtib29sZWFufSBjb25kaXRpb24gaXMgdGhlIGJvb2xlYW4gdG8gYXNzZXJ0IHRydWVcbiAgICogQHBhcmFtIHtzdHJpbmd9IFttc2ddIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIGNvbmRpdGlvbiBpcyBmYWxzZSAob3B0aW9uYWwpXG4gICAqL1xuICBzdGF0aWMgYXNzZXJ0VHJ1ZShjb25kaXRpb24sIG1zZz8pIHtcbiAgICBpZiAodHlwZW9mIGNvbmRpdGlvbiAhPT0gJ2Jvb2xlYW4nKSB0aHJvdyBuZXcgRXJyb3IoXCJBcmd1bWVudCBpcyBub3QgYSBib29sZWFuXCIpO1xuICAgIGlmICghY29uZGl0aW9uKSB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJCb29sZWFuIGFzc2VydGVkIGFzIHRydWUgYnV0IHdhcyBmYWxzZVwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIGdpdmVuIGJvb2xlYW4gaXMgZmFsc2UuICBUaHJvd3MgYW4gZXhjZXB0aW9uIGlmIG5vdCBhIGJvb2xlYW4gb3IgdHJ1ZS5cbiAgICogXG4gICAqIEBwYXJhbSBib29sIGlzIHRoZSBib29sZWFuIHRvIGFzc2VydCBmYWxzZVxuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIGJvb2wgaXMgdHJ1ZSAob3B0aW9uYWwpXG4gICAqL1xuICBzdGF0aWMgYXNzZXJ0RmFsc2UoYm9vbCwgbXNnPykge1xuICAgIGlmICh0eXBlb2YgYm9vbCAhPT0gJ2Jvb2xlYW4nKSB0aHJvdyBuZXcgRXJyb3IoXCJBcmd1bWVudCBpcyBub3QgYSBib29sZWFuXCIpO1xuICAgIGlmIChib29sKSB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJCb29sZWFuIGFzc2VydGVkIGFzIGZhbHNlIGJ1dCB3YXMgdHJ1ZVwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIG51bGwuICBUaHJvd3MgYW4gZXhjZXB0aW9uIGlmIG5vdCBudWxsLlxuICAgKiBcbiAgICogQHBhcmFtIGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gYXNzZXJ0IG51bGxcbiAgICogQHBhcmFtIG1zZyBpcyB0aGUgbWVzc2FnZSB0byB0aHJvdyBpZiBhcmcgaXMgbm90IG51bGwgKG9wdGlvbmFsKVxuICAgKi9cbiAgc3RhdGljIGFzc2VydE51bGwoYXJnLCBtc2c/KSB7XG4gICAgaWYgKGFyZyAhPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKG1zZyA/IG1zZyA6IFwiQXJndW1lbnQgYXNzZXJ0ZWQgYXMgbnVsbCBidXQgd2FzIG5vdCBudWxsOiBcIiArIGFyZyk7XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBhcmd1bWVudCBpcyBub3QgbnVsbC4gIFRocm93cyBhbiBleGNlcHRpb24gaWYgbnVsbC5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIGFzc2VydCBub3QgbnVsbFxuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIGFyZyBpcyBudWxsIChvcHRpb25hbClcbiAgICovXG4gIHN0YXRpYyBhc3NlcnROb3ROdWxsKGFyZywgbXNnPykge1xuICAgIGlmIChhcmcgPT09IG51bGwpIHRocm93IG5ldyBFcnJvcihtc2cgPyBtc2cgOiBcIkFyZ3VtZW50IGFzc2VydGVkIGFzIG5vdCBudWxsIGJ1dCB3YXMgbnVsbFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGRlZmluZWQuICBUaHJvd3MgYW4gZXhjZXB0aW9uIGlmIHVuZGVmaW5lZC5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIGFzc2VydCBkZWZpbmVkXG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgYXJnIGlzIHVuZGVmaW5lZCAob3B0aW9uYWwpXG4gICAqL1xuICBzdGF0aWMgYXNzZXJ0RGVmaW5lZChhcmcsIG1zZz8pIHtcbiAgICBpZiAoR2VuVXRpbHMuaXNVbmRlZmluZWQoYXJnKSkgdGhyb3cgbmV3IEVycm9yKG1zZyA/IG1zZyA6IFwiQXJndW1lbnQgYXNzZXJ0ZWQgYXMgZGVmaW5lZCBidXQgd2FzIHVuZGVmaW5lZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIHVuZGVmaW5lZC4gIFRocm93cyBhbiBleGNlcHRpb24gaWYgZGVmaW5lZC5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIGFzc2VydCB1bmRlZmluZWRcbiAgICogQHBhcmFtIG1zZyBpcyB0aGUgbWVzc2FnZSB0byB0aHJvdyBpZiBhcmcgaXMgZGVmaW5lZCAob3B0aW9uYWwpXG4gICAqL1xuICBzdGF0aWMgYXNzZXJ0VW5kZWZpbmVkKGFyZywgbXNnPykge1xuICAgIGlmIChHZW5VdGlscy5pc0RlZmluZWQoYXJnKSkgdGhyb3cgbmV3IEVycm9yKG1zZyA/IG1zZyA6IFwiQXJndW1lbnQgYXNzZXJ0ZWQgYXMgdW5kZWZpbmVkIGJ1dCB3YXMgZGVmaW5lZDogXCIgKyBhcmcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgaW5pdGlhbGl6ZWQuICBUaHJvd3MgYW4gZXhjZXB0aW9uIGlmIG5vdCBpbml0aWFsaXplZC5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIGFzc2VydCBhcyBpbml0aWFsaXplZFxuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIGFyZyBpcyBub3QgaW5pdGlhbGl6ZWQgKG9wdGlvbmFsKVxuICAgKi9cbiAgc3RhdGljIGFzc2VydEluaXRpYWxpemVkKGFyZywgbXNnPykge1xuICAgIGlmIChHZW5VdGlscy5pc1VuaW5pdGlhbGl6ZWQoYXJnKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyA/IG1zZyA6IFwiQXJndW1lbnQgYXNzZXJ0ZWQgYXMgaW5pdGlhbGl6ZWQgYnV0IHdhcyBcIiArIGFyZyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgdW5pbml0aWFsaXplZC4gIFRocm93cyBhbiBleGNlcHRpb24gaWYgaW5pdGlhbGl6ZWQuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byBhc3NlcnQgYXMgdW5pbml0aWFsaXplZFxuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIGFyZyBpcyBpbml0aWFsaXplZCAob3B0aW9uYWwpXG4gICAqL1xuICBzdGF0aWMgYXNzZXJ0VW5pbml0aWFsaXplZChhcmcsIG1zZz8pIHtcbiAgICBpZiAoR2VuVXRpbHMuaXNJbml0aWFsaXplZChhcmcpKSB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyB1bmluaXRpYWxpemVkIGJ1dCB3YXMgaW5pdGlhbGl6ZWRcIik7XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBhcmd1bWVudHMgYXJlIGVxdWFsLiAgVGhyb3dzIGFuIGV4Y2VwdGlvbiBpZiBub3QgZXF1YWwuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnMSBpcyBhbiBhcmd1bWVudCB0byBhc3NlcnQgYXMgZXF1YWxcbiAgICogQHBhcmFtIGFyZzIgaXMgYW4gYXJndW1lbnQgdG8gYXNzZXJ0IGFzIGVxdWFsXG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgdGhlIGFyZ3VtZW50cyBhcmUgbm90IGVxdWFsXG4gICAqL1xuICBzdGF0aWMgYXNzZXJ0RXF1YWxzKGFyZzEsIGFyZzIsIG1zZz8pIHtcbiAgICBHZW5VdGlscy5hc3NlcnRUcnVlKEdlblV0aWxzLmVxdWFscyhhcmcxLCBhcmcyKSwgbXNnID8gbXNnIDogXCJBcmd1bWVudHMgYXNzZXJ0ZWQgYXMgZXF1YWwgYnV0IGFyZSBub3QgZXF1YWw6IFwiICsgYXJnMSArIFwiIHZzIFwiICsgYXJnMik7XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBhcmd1bWVudHMgYXJlIG5vdCBlcXVhbC4gIFRocm93cyBhbiBleGNlcHRpb24gaWYgZXF1YWwuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnMSBpcyBhbiBhcmd1bWVudCB0byBhc3NlcnQgYXMgbm90IGVxdWFsXG4gICAqIEBwYXJhbSBhcmcyIGlzIGFuIGFyZ3VtZW50IHRvIGFzc2VydCBhcyBub3QgZXF1YWxcbiAgICogQHBhcmFtIG1zZyBpcyB0aGUgbWVzc2FnZSB0byB0aHJvdyBpZiB0aGUgYXJndW1lbnRzIGFyZSBlcXVhbFxuICAgKi9cbiAgc3RhdGljIGFzc2VydE5vdEVxdWFscyhhcmcxLCBhcmcyLCBtc2c/KSB7XG4gICAgaWYgKGFyZzEgPT09IGFyZzIpIHRocm93IG5ldyBFcnJvcihtc2cgPyBtc2cgOiBcIkFyZ3VtZW50cyBhc3NlcnRlZCBhcyBub3QgZXF1YWwgYnV0IGFyZSBlcXVhbDogXCIgKyBhcmcxICsgXCIgdnMgXCIgKyBhcmcyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGFuIGludGVnZXIuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byBhc3NlcnQgYXMgYW4gaW50ZWdlclxuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIHRoZSBhcmd1bWVudCBpcyBub3QgYW4gaW50ZWdlclxuICAgKi9cbiAgc3RhdGljIGFzc2VydEludChhcmcsIG1zZz8pIHtcbiAgICBpZiAoIUdlblV0aWxzLmlzSW50KGFyZykpIHRocm93IG5ldyBFcnJvcihtc2cgPyBtc2cgOiBcIkFyZ3VtZW50IGFzc2VydGVkIGFzIGFuIGludGVnZXIgYnV0IGlzIG5vdCBhbiBpbnRlZ2VyXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYSBudW1iZXIuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byBhc3NlcnQgYXMgYSBudW1iZXJcbiAgICogQHBhcmFtIG1zZyBpcyB0aGUgbWVzc2FnZSB0byB0aHJvdyBpZiB0aGUgYXJndW1lbnQgaXMgbm90IGEgbnVtYmVyXG4gICAqL1xuICBzdGF0aWMgYXNzZXJ0TnVtYmVyKGFyZywgbXNnPykge1xuICAgIGlmICghR2VuVXRpbHMuaXNOdW1iZXIoYXJnKSkgdGhyb3cgbmV3IEVycm9yKG1zZyA/IG1zZyA6IFwiQXJndW1lbnQgYXNzZXJ0ZWQgYXMgYSBudW1iZXIgYnV0IGlzIG5vdCBhIG51bWJlclwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGEgYm9vbGVhbi5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIGFzc2VydCBhcyBhIGJvb2xlYW5cbiAgICogQHBhcmFtIG1zZyBpcyB0aGUgbWVzc2FnZSB0byB0aHJvdyBpZiB0aGUgYXJndW1lbnQgaXMgbm90IGEgYm9vbGVhblxuICAgKi9cbiAgc3RhdGljIGFzc2VydEJvb2xlYW4oYXJnLCBtc2c/KSB7XG4gICAgaWYgKCFHZW5VdGlscy5pc0Jvb2xlYW4oYXJnKSkgdGhyb3cgbmV3IEVycm9yKG1zZyA/IG1zZyA6IFwiQXJndW1lbnQgYXNzZXJ0ZWQgYXMgYSBib29sZWFuIGJ1dCBpcyBub3QgYSBib29sZWFuXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYSBzdHJpbmcuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byBhc3NlcnQgYXMgYSBzdHJpbmdcbiAgICogQHBhcmFtIG1zZyBpcyB0aGUgbWVzc2FnZSB0byB0aHJvdyBpZiB0aGUgYXJndW1lbnQgaXMgbm90IGEgc3RyaW5nXG4gICAqL1xuICBzdGF0aWMgYXNzZXJ0U3RyaW5nKGFyZywgbXNnPykge1xuICAgIGlmICghR2VuVXRpbHMuaXNTdHJpbmcoYXJnKSkgdGhyb3cgbmV3IEVycm9yKG1zZyA/IG1zZyA6IFwiQXJndW1lbnQgYXNzZXJ0ZWQgYXMgYSBzdHJpbmcgYnV0IGlzIG5vdCBhIHN0cmluZzogXCIgKyBhcmcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYW4gYXJyYXkuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byBhc3NlcnQgYXMgYW4gYXJyYXlcbiAgICogQHBhcmFtIG1zZyBpcyB0aGUgbWVzc2FnZSB0byB0aHJvdyBpZiB0aGUgYXJndW1lbnQgaXMgbm90IGFuIGFycmF5XG4gICAqL1xuICBzdGF0aWMgYXNzZXJ0QXJyYXkoYXJnLCBtc2c/KSB7XG4gICAgaWYgKCFHZW5VdGlscy5pc0FycmF5KGFyZykpIHRocm93IG5ldyBFcnJvcihtc2cgPyBtc2cgOiBcIkFyZ3VtZW50IGFzc2VydGVkIGFzIGFuIGFycmF5IGJ1dCBpcyBub3QgYW4gYXJyYXlcIik7XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhIHN0YXRpYy5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIGFzc2VydCBhcyBhIHN0YXRpY1xuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIHRoZSBhcmd1bWVudCBpcyBub3QgYSBzdGF0aWNcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRGdW5jdGlvbihhcmcsIG1zZz8pIHtcbiAgICBpZiAoIUdlblV0aWxzLmlzRnVuY3Rpb24oYXJnKSkgdGhyb3cgbmV3IEVycm9yKG1zZyA/IG1zZyA6IFwiQXJndW1lbnQgYXNzZXJ0ZWQgYXMgYSBzdGF0aWMgYnV0IGlzIG5vdCBhIHN0YXRpY1wiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGFuIG9iamVjdCB3aXRoIHRoZSBnaXZlbiBuYW1lLlxuICAgKiBcbiAgICogQHBhcmFtIGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gdGVzdFxuICAgKiBAcGFyYW0gb2JqIGlzIGFuIG9iamVjdCB0byBhc3NlcnQgYXJnIGluc3RhbmNlb2Ygb2JqIChvcHRpb25hbClcbiAgICogQHBhcmFtIG1zZyBpcyB0aGUgbWVzc2FnZSB0byB0aHJvdyBpZiB0aGUgYXJndW1lbnQgaXMgbm90IHRoZSBzcGVjaWZpZWQgb2JqZWN0XG4gICAqL1xuICBzdGF0aWMgYXNzZXJ0T2JqZWN0KGFyZywgb2JqLCBtc2c/KSB7XG4gICAgR2VuVXRpbHMuYXNzZXJ0SW5pdGlhbGl6ZWQoYXJnLCBtc2cpO1xuICAgIGlmIChvYmopIHtcbiAgICAgIGlmICghR2VuVXRpbHMuaXNPYmplY3QoYXJnLCBvYmopKSB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBvYmplY3QgJ1wiICsgb2JqLm5hbWUgKyBcIicgYnV0IHdhcyBub3RcIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghR2VuVXRpbHMuaXNPYmplY3QoYXJnKSkgdGhyb3cgbmV3IEVycm9yKG1zZyA/IG1zZyA6IFwiQXJndW1lbnQgYXNzZXJ0ZWQgYXMgb2JqZWN0IGJ1dCB3YXMgbm90XCIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBjaGlsZCdzIHByb3RvdHlwZSB0byB0aGUgcGFyZW50J3MgcHJvdG90eXBlLlxuICAgKiBcbiAgICogQHBhcmFtIGNoaWxkIGlzIHRoZSBjaGlsZCBjbGFzc1xuICAgKiBAcGFyYW0gcGFyZW50IGlzIHRoZSBwYXJlbnQgY2xhc3NcbiAgICovXG4gIHN0YXRpYyBpbmhlcml0c0Zyb20oY2hpbGQsIHBhcmVudCkge1xuICAgIGNoaWxkLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUocGFyZW50LnByb3RvdHlwZSk7XG4gICAgY2hpbGQucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY2hpbGQ7XG4gIH1cblxuICAvKipcbiAgICogSW52b2tlcyBmdW5jdGlvbnMgd2l0aCBhcmd1bWVudHMuXG4gICAqIFxuICAgKiBhcmd1bWVudHNbMF0gaXMgYXNzdW1lZCB0byBiZSBhbiBhcnJheSBvZiBmdW5jdGlvbnMgdG8gaW52b2tlXG4gICAqIGFyZ3VtZW50c1sxLi4ubl0gYXJlIGFyZ3MgdG8gaW52b2tlIHRoZSBmdW5jdGlvbnMgd2l0aFxuICAgKi9cbiAgc3RhdGljIGludm9rZSgpIHtcbiAgICBsZXQgZm5zID0gYXJndW1lbnRzWzBdO1xuICAgIGxldCBhcmdzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIGFyZ3MucHVzaChhcmd1bWVudHNbaV0pO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZm5zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBHZW5VdGlscy5hc3NlcnRGdW5jdGlvbihmbnNbaV0sIFwiRnVuY3Rpb25zW1wiICsgaSArIFwiXSBpcyBub3QgYSBzdGF0aWNcIik7XG4gICAgICBmbnNbaV0uYXBwbHkobnVsbCwgYXJncyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHBvd2VyIHNldCBvZiB0aGUgZ2l2ZW4gYXJyYXkuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJyIGlzIHRoZSBhcnJheSB0byBnZXQgdGhlIHBvd2VyIHNldCBvZlxuICAgKiBAcmV0dXJuIFtdW10gaXMgdGhlIHBvd2VyIHNldCBvZiB0aGUgZ2l2ZW4gYXJyYXlcbiAgICovXG4gIHN0YXRpYyBnZXRQb3dlclNldChhcnIpIHtcbiAgICBsZXQgZm4gPSBmdW5jdGlvbihuLCBzcmMsIGdvdCwgYWxsKSB7XG4gICAgICBpZiAobiA9PSAwKSB7XG4gICAgICAgIGlmIChnb3QubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGFsbFthbGwubGVuZ3RoXSA9IGdvdDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHNyYy5sZW5ndGg7IGorKykge1xuICAgICAgICBmbihuIC0gMSwgc3JjLnNsaWNlKGogKyAxKSwgZ290LmNvbmNhdChbIHNyY1tqXSBdKSwgYWxsKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgbGV0IGFsbCA9IFtdO1xuICAgIGFsbC5wdXNoKFtdKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgZm4oaSwgYXJyLCBbXSwgYWxsKTtcbiAgICB9XG4gICAgYWxsLnB1c2goYXJyKTtcbiAgICByZXR1cm4gYWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIHBvd2VyIHNldCBvZiB0aGUgZ2l2ZW4gYXJyYXkgd2hvc2UgZWxlbWVudHMgYXJlIHRoZSBnaXZlbiBzaXplLlxuICAgKiBcbiAgICogQHBhcmFtIGFyciBpcyB0aGUgYXJyYXkgdG8gZ2V0IHRoZSBwb3dlciBzZXQgb2ZcbiAgICogQHBhcmFtIHNpemUgaXMgdGhlIHJlcXVpcmVkIHNpemUgb2YgdGhlIGVsZW1lbnRzIHdpdGhpbiB0aGUgcG93ZXIgc2V0XG4gICAqIHJldHVybnMgW11bXSBpcyB0aGUgcG93ZXIgc2V0IG9mIHRoZSBnaXZlbiBhcnJheSB3aG9zZSBlbGVtZW50cyBhcmUgdGhlIGdpdmVuIHNpemUgXG4gICAqL1xuICBzdGF0aWMgZ2V0UG93ZXJTZXRPZkxlbmd0aChhcnIsIHNpemUpIHtcbiAgICBHZW5VdGlscy5hc3NlcnRJbml0aWFsaXplZChhcnIpO1xuICAgIEdlblV0aWxzLmFzc2VydEluaXRpYWxpemVkKHNpemUpO1xuICAgIEdlblV0aWxzLmFzc2VydFRydWUoc2l6ZSA+PSAxKTtcbiAgICBsZXQgcG93ZXJTZXQgPSBHZW5VdGlscy5nZXRQb3dlclNldChhcnIpO1xuICAgIGxldCBwb3dlclNldE9mTGVuZ3RoID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwb3dlclNldC5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHBvd2VyU2V0W2ldLmxlbmd0aCA9PT0gc2l6ZSkge1xuICAgICAgICBwb3dlclNldE9mTGVuZ3RoLnB1c2gocG93ZXJTZXRbaV0pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcG93ZXJTZXRPZkxlbmd0aDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIGluZGljZXMgb2YgdGhlIGdpdmVuIHNpemUuXG4gICAqIFxuICAgKiBAcGFyYW0gc2l6ZSBzcGVjaWZpZXMgdGhlIHNpemUgdG8gZ2V0IGluZGljZXMgZm9yXG4gICAqIEByZXR1cm4gYXJyYXkgb2YgdGhlIGdpdmVuIHNpemUgd2l0aCBpbmRpY2VzIHN0YXJ0aW5nIGF0IDBcbiAgICovXG4gIHN0YXRpYyBnZXRJbmRpY2VzKHNpemUpIHtcbiAgICBsZXQgaW5kaWNlcyA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgICBpbmRpY2VzLnB1c2goaSk7XG4gICAgfVxuICAgIHJldHVybiBpbmRpY2VzO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBuZXcgYXJyYXkgY29udGFpbmluZyB1bmlxdWUgZWxlbWVudHMgb2YgdGhlIGdpdmVuIGFycmF5LlxuICAgKiBcbiAgICogQHBhcmFtIGFyciBpcyB0aGUgYXJyYXkgdG8gcmV0dXJuIHVuaXF1ZSBlbGVtZW50cyBmcm9tXG4gICAqIEByZXR1cm4gYSBuZXcgYXJyYXkgd2l0aCB0aGUgZ2l2ZW4gYXJyYXkncyB1bmlxdWUgZWxlbWVudHNcbiAgICovXG4gIHN0YXRpYyB0b1VuaXF1ZUFycmF5KGFycikge1xuICAgIHJldHVybiBhcnIuZmlsdGVyKGZ1bmN0aW9uKHZhbHVlLCBpbmRleCwgc2VsZikge1xuICAgICAgcmV0dXJuIHNlbGYuaW5kZXhPZih2YWx1ZSkgPT09IGluZGV4O1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENvcGllcyB0aGUgZ2l2ZW4gYXJyYXkuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJyIGlzIHRoZSBhcnJheSB0byBjb3B5XG4gICAqIEByZXR1cm4gYSBjb3B5IG9mIHRoZSBnaXZlbiBhcnJheVxuICAgKi9cbiAgc3RhdGljIGNvcHlBcnJheShhcnIpIHtcbiAgICBHZW5VdGlscy5hc3NlcnRBcnJheShhcnIpO1xuICAgIGxldCBjb3B5ID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIGNvcHkucHVzaChhcnJbaV0pO1xuICAgIHJldHVybiBjb3B5O1xuICB9XG4gIFxuICAvKipcbiAgICogUmVtb3ZlcyBldmVyeSBpbnN0YW5jZSBvZiB0aGUgZ2l2ZW4gdmFsdWUgZnJvbSB0aGUgZ2l2ZW4gYXJyYXkuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJyIGlzIHRoZSBhcnJheSB0byByZW1vdmUgdGhlIHZhbHVlIGZyb21cbiAgICogQHBhcmFtIHZhbCBpcyB0aGUgdmFsdWUgdG8gcmVtb3ZlIGZyb20gdGhlIGFycmF5XG4gICAqIEByZXR1cm4gdHJ1ZSBpZiB0aGUgdmFsdWUgaXMgZm91bmQgYW5kIHJlbW92ZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIHJlbW92ZShhcnIsIHZhbCkge1xuICAgIGxldCBmb3VuZCA9IGZhbHNlO1xuICAgIGZvciAobGV0IGkgPSBhcnIubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIGlmIChhcnJbaV0gPT09IHZhbCkge1xuICAgICAgICBhcnIuc3BsaWNlKGksIDEpO1xuICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgIGktLTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZvdW5kO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBjb3B5IG9mIHRoZSBnaXZlbiBhcnJheSB3aGVyZSBlYWNoIGVsZW1lbnQgaXMgbG93ZXJjYXNlLlxuICAgKiBcbiAgICogQHBhcmFtIGFyciBpcyB0aGUgYXJyYXkgdG8gY29udmVydCB0byBsb3dlcmNhc2VcbiAgICogQHJldHVybiBhIGNvcHkgb2YgdGhlIGdpdmVuIGFycmF5IHdoZXJlIGVhY2ggZWxlbWVudCBpcyBsb3dlcmNhc2VcbiAgICovXG4gIHN0YXRpYyB0b0xvd2VyQ2FzZUFycmF5KGFycikge1xuICAgIGxldCBhcnIyID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgIGFycjIucHVzaChhcnJbaV0udG9Mb3dlckNhc2UoKSk7XG4gICAgfVxuICAgIHJldHVybiBhcnIyO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3RpZmllcyB0aGUgZ2l2ZW4gYXJndW1lbnQuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJyT3JFbGVtIGlzIGFuIGFycmF5IG9yIGFuIGVsZW1lbnQgaW4gdGhlIGFycmF5XG4gICAqIEByZXR1cm4gYW4gYXJyYXkgd2hpY2ggaXMgdGhlIGdpdmVuIGFyZyBpZiBpdCdzIGFuIGFycmF5IG9yIGFuIGFycmF5IHdpdGggdGhlIGdpdmVuIGFyZyBhcyBhbiBlbGVtZW50XG4gICAqL1xuICBzdGF0aWMgbGlzdGlmeShhcnJPckVsZW0pIHtcbiAgICByZXR1cm4gR2VuVXRpbHMuaXNBcnJheShhcnJPckVsZW0pID8gYXJyT3JFbGVtIDogW2Fyck9yRWxlbV07XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBnaXZlbiBhcnJheSBjb250YWlucyB0aGUgZ2l2ZW4gb2JqZWN0LlxuICAgKiBcbiAgICogQHBhcmFtIHthbnl9IGFyciAtIGFycmF5IHRoYXQgbWF5IG9yIG1heSBub3QgY29udGFpbiB0aGUgb2JqZWN0XG4gICAqIEBwYXJhbSB7YW55fSBvYmogLSBvYmplY3QgdG8gY2hlY2sgZm9yIGluY2x1c2lvbiBpbiB0aGUgYXJyYXlcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29tcGFyZUJ5UmVmZXJlbmNlXSAtIGNvbXBhcmUgc3RyaWN0bHkgYnkgcmVmZXJlbmNlLCBmb3Jnb2luZyBkZWVwIGVxdWFsaXR5IGNoZWNrIChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcmV0dXJuIHRydWUgaWYgdGhlIGFycmF5IGNvbnRhaW5zIHRoZSBvYmplY3QsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGFycmF5Q29udGFpbnMoYXJyLCBvYmosIGNvbXBhcmVCeVJlZmVyZW5jZSA9IGZhbHNlKSB7XG4gICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZShHZW5VdGlscy5pc0FycmF5KGFycikpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYXJyW2ldID09PSBvYmopIHJldHVybiB0cnVlO1xuICAgICAgaWYgKCFjb21wYXJlQnlSZWZlcmVuY2UgJiYgR2VuVXRpbHMuZXF1YWxzKGFycltpXSwgb2JqKSkgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGdpdmVuIHN0cmluZyBjb250YWlucyB0aGUgZ2l2ZW4gc3Vic3RyaW5nLlxuICAgKiBcbiAgICogQHBhcmFtIHN0ciBpcyB0aGUgc3RyaW5nIHRvIHNlYXJjaCBmb3IgYSBzdWJzdHJpbmdcbiAgICogQHBhcmFtIHN1YnN0cmluZyBpcyB0aGUgc3Vic3RyaW5nIHRvIHNlYXJjaGluIHdpdGhpbiB0aGUgc3RyaW5nXG4gICAqIEByZXR1cm4gdHJ1ZSBpZiB0aGUgc3Vic3RyaW5nIGlzIHdpdGhpbiB0aGUgc3RyaW5nLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBzdHJDb250YWlucyhzdHIsIHN1YnN0cmluZykge1xuICAgIHJldHVybiBzdHIuaW5kZXhPZihzdWJzdHJpbmcpID4gLTE7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyBpZiB0d28gYXJyYXlzIGFyZSBlcXVhbC5cbiAgICogXG4gICAqIEBwYXJhbSBhcnIxIGlzIGFuIGFycmF5IHRvIGNvbXBhcmVcbiAgICogQHBhcmFtIGFycjIgaXMgYW4gYXJyYXkgdG8gY29tcGFyZVxuICAgKiBAcmV0dXJuIHRydWUgaWYgdGhlIGFycmF5cyBhcmUgZXF1YWwsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGFycmF5c0VxdWFsKGFycjEsIGFycjIpIHtcbiAgICBpZiAoYXJyMSA9PT0gYXJyMikgcmV0dXJuIHRydWU7XG4gICAgaWYgKGFycjEgPT0gbnVsbCAmJiBhcnIyID09IG51bGwpIHJldHVybiB0cnVlO1xuICAgIGlmIChhcnIxID09IG51bGwgfHwgYXJyMiA9PSBudWxsKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKHR5cGVvZiBhcnIxID09PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgYXJyMiA9PT0gJ3VuZGVmaW5lZCcpIHJldHVybiB0cnVlO1xuICAgIGlmICh0eXBlb2YgYXJyMSA9PT0gJ3VuZGVmaW5lZCcgfHwgdHlwZW9mIGFycjIgPT09ICd1bmRlZmluZWQnKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKCFHZW5VdGlscy5pc0FycmF5KGFycjEpKSB0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBhcmd1bWVudCBpcyBub3QgYW4gYXJyYXlcIik7XG4gICAgaWYgKCFHZW5VdGlscy5pc0FycmF5KGFycjIpKSB0aHJvdyBuZXcgRXJyb3IoXCJTZWNvbmQgYXJndW1lbnQgaXMgbm90IGFuIGFycmF5XCIpO1xuICAgIGlmIChhcnIxLmxlbmd0aCAhPSBhcnIyLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJyMS5sZW5ndGg7ICsraSkge1xuICAgICAgaWYgKCFHZW5VdGlscy5lcXVhbHMoYXJyMVtpXSwgYXJyMltpXSkpIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyBpZiB0d28gYXJndW1lbnRzIGFyZSBkZWVwIGVxdWFsLlxuICAgKiBcbiAgICogQHBhcmFtIGFyZzEgaXMgYW4gYXJndW1lbnQgdG8gY29tcGFyZVxuICAgKiBAcGFyYW0gYXJnMiBpcyBhbiBhcmd1bWVudCB0byBjb21wYXJlXG4gICAqIEByZXR1cm4gdHJ1ZSBpZiB0aGUgYXJndW1lbnRzIGFyZSBkZWVwIGVxdWFscywgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgZXF1YWxzKGFyZzEsIGFyZzIpIHtcbiAgICBpZiAoR2VuVXRpbHMuaXNBcnJheShhcmcxKSAmJiBHZW5VdGlscy5pc0FycmF5KGFyZzIpKSByZXR1cm4gR2VuVXRpbHMuYXJyYXlzRXF1YWwoYXJnMSwgYXJnMik7XG4gICAgaWYgKEdlblV0aWxzLmlzT2JqZWN0KGFyZzEpICYmIEdlblV0aWxzLmlzT2JqZWN0KGFyZzIpKSByZXR1cm4gR2VuVXRpbHMub2JqZWN0c0VxdWFsKGFyZzEsIGFyZzIpO1xuICAgIHJldHVybiBhcmcxID09PSBhcmcyO1xuICB9XG4gIFxuICAvKipcbiAgICogRGV0ZXJtaW5lcyBpZiB0d28gb2JqZWN0cyBhcmUgZGVlcCBlcXVhbC5cbiAgICogXG4gICAqIFVuZGVmaW5lZCB2YWx1ZXMgYXJlIGNvbnNpZGVyZWQgZXF1YWwgdG8gbm9uLWV4aXN0ZW50IGtleXMuXG4gICAqIFxuICAgKiBAcGFyYW0gbWFwMSBpcyBhIG1hcCB0byBjb21wYXJlXG4gICAqIEBwYXJhbSBtYXAyIGlzIGEgbWFwIHRvIGNvbXBhcmVcbiAgICogQHJldHVybiB0cnVlIGlmIHRoZSBtYXBzIGhhdmUgaWRlbnRpY2FsIGtleXMgYW5kIHZhbHVlcywgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgb2JqZWN0c0VxdWFsKG1hcDEsIG1hcDIpIHtcbiAgICBsZXQga2V5czEgPSBPYmplY3Qua2V5cyhtYXAxKTtcbiAgICBsZXQga2V5czIgPSBPYmplY3Qua2V5cyhtYXAyKTtcbiAgICBcbiAgICAvLyBjb21wYXJlIGVhY2gga2V5MSB0byBrZXlzMlxuICAgIGZvciAobGV0IGtleTEgb2Yga2V5czEpIHtcbiAgICAgIGxldCBmb3VuZCA9IGZhbHNlO1xuICAgICAgZm9yIChsZXQga2V5MiBvZiBrZXlzMikge1xuICAgICAgICBpZiAoa2V5MSA9PT0ga2V5Mikge1xuICAgICAgICAgIGlmICghR2VuVXRpbHMuZXF1YWxzKG1hcDFba2V5MV0sIG1hcDJba2V5Ml0pKSByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoIWZvdW5kICYmIG1hcDFba2V5MV0gIT09IHVuZGVmaW5lZCkgcmV0dXJuIGZhbHNlOyAvLyBhbGxvd3MgdW5kZWZpbmVkIHZhbHVlcyB0byBlcXVhbCBub24tZXhpc3RlbnQga2V5c1xuICAgIH1cbiAgICBcbiAgICAvLyBjb21wYXJlIGVhY2gga2V5MiB0byBrZXlzMVxuICAgIGZvciAobGV0IGtleTIgb2Yga2V5czIpIHtcbiAgICAgIGxldCBmb3VuZCA9IGZhbHNlO1xuICAgICAgZm9yIChsZXQga2V5MSBvZiBrZXlzMSkge1xuICAgICAgICBpZiAoa2V5MSA9PT0ga2V5Mikge1xuICAgICAgICAgIGZvdW5kID0gdHJ1ZTsgLy8gbm8gbmVlZCB0byByZS1jb21wYXJlIHdoaWNoIHdhcyBkb25lIGVhcmxpZXJcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKCFmb3VuZCAmJiBtYXAyW2tleTJdICE9PSB1bmRlZmluZWQpIHJldHVybiBmYWxzZTsgLy8gYWxsb3dzIHVuZGVmaW5lZCB2YWx1ZXMgdG8gZXF1YWwgbm9uLWV4aXN0ZW50IGtleXNcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gICAgXG4gICAgLy8gVE9ETzogc3VwcG9ydCBzdHJpY3Qgb3B0aW9uP1xuLy8gICAgaWYgKHN0cmljdCkge1xuLy8gICAgICBsZXQga2V5czEgPSBPYmplY3Qua2V5cyhtYXAxKTtcbi8vICAgICAgaWYgKGtleXMxLmxlbmd0aCAhPT0gT2JqZWN0LmtleXMobWFwMikubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4vLyAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwga2V5czEubGVuZ3RoOyBpKyspIHtcbi8vICAgICAgICBsZXQga2V5ID0gT2JqZWN0LmtleXMobWFwMSlbaV07XG4vLyAgICAgICAgaWYgKCFHZW5VdGlscy5lcXVhbHMobWFwMVtrZXldLCBtYXAyW2tleV0pKSByZXR1cm4gZmFsc2U7XG4vLyAgICAgIH1cbi8vICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIERlbGV0ZXMgcHJvcGVydGllcyBmcm9tIHRoZSBvYmplY3QgdGhhdCBhcmUgdW5kZWZpbmVkLlxuICAgKiBcbiAgICogQHBhcmFtIG9iaiBpcyB0aGUgb2JqZWN0IHRvIGRlbGV0ZSB1bmRlZmluZWQga2V5cyBmcm9tXG4gICAqL1xuICBzdGF0aWMgZGVsZXRlVW5kZWZpbmVkS2V5cyhvYmopIHtcbiAgICBmb3IgKGxldCBrZXkgb2YgT2JqZWN0LmtleXMob2JqKSkge1xuICAgICAgaWYgKG9ialtrZXldID09PSB1bmRlZmluZWQpIGRlbGV0ZSBvYmpba2V5XTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBjb21iaW5hdGlvbnMgb2YgdGhlIGdpdmVuIGFycmF5IG9mIHRoZSBnaXZlbiBzaXplLlxuICAgKiBcbiAgICogQHBhcmFtIGFyciBpcyB0aGUgYXJyYXkgdG8gZ2V0IGNvbWJpbmF0aW9ucyBmcm9tXG4gICAqIEBwYXJhbSBjb21iaW5hdGlvblNpemUgc3BlY2lmaWVzIHRoZSBzaXplIG9mIGVhY2ggY29tYmluYXRpb25cbiAgICovXG4gIHN0YXRpYyBnZXRDb21iaW5hdGlvbnMoYXJyLCBjb21iaW5hdGlvblNpemUpIHtcbiAgICBcbiAgICAvLyB2YWxpZGF0ZSBpbnB1dFxuICAgIEdlblV0aWxzLmFzc2VydEluaXRpYWxpemVkKGFycik7XG4gICAgR2VuVXRpbHMuYXNzZXJ0SW5pdGlhbGl6ZWQoY29tYmluYXRpb25TaXplKTtcbiAgICBHZW5VdGlscy5hc3NlcnRUcnVlKGNvbWJpbmF0aW9uU2l6ZSA+PSAxKTtcbiAgICBcbiAgICAvLyBnZXQgY29tYmluYXRpb25zIG9mIGFycmF5IGluZGljZXMgb2YgdGhlIGdpdmVuIHNpemVcbiAgICBsZXQgaW5kZXhDb21iaW5hdGlvbnMgPSBHZW5VdGlscy5nZXRQb3dlclNldE9mTGVuZ3RoKEdlblV0aWxzLmdldEluZGljZXMoYXJyLmxlbmd0aCksIGNvbWJpbmF0aW9uU2l6ZSk7XG4gICAgXG4gICAgLy8gY29sbGVjdCBjb21iaW5hdGlvbnMgZnJvbSBlYWNoIGNvbWJpbmF0aW9uIG9mIGFycmF5IGluZGljZXNcbiAgICBsZXQgY29tYmluYXRpb25zID0gW107XG4gICAgZm9yIChsZXQgaW5kZXhDb21iaW5hdGlvbnNJZHggPSAwOyBpbmRleENvbWJpbmF0aW9uc0lkeCA8IGluZGV4Q29tYmluYXRpb25zLmxlbmd0aDsgaW5kZXhDb21iaW5hdGlvbnNJZHgrKykge1xuICAgICAgXG4gICAgICAvLyBnZXQgY29tYmluYXRpb24gb2YgYXJyYXkgaW5kaWNlc1xuICAgICAgbGV0IGluZGV4Q29tYmluYXRpb24gPSBpbmRleENvbWJpbmF0aW9uc1tpbmRleENvbWJpbmF0aW9uc0lkeF07XG4gICAgICBcbiAgICAgIC8vIGJ1aWxkIGNvbWJpbmF0aW9uIGZyb20gYXJyYXlcbiAgICAgIGxldCBjb21iaW5hdGlvbiA9IFtdO1xuICAgICAgZm9yIChsZXQgaW5kZXhDb21iaW5hdGlvbklkeCA9IDA7IGluZGV4Q29tYmluYXRpb25JZHggPCBpbmRleENvbWJpbmF0aW9uLmxlbmd0aDsgaW5kZXhDb21iaW5hdGlvbklkeCsrKSB7XG4gICAgICAgIGNvbWJpbmF0aW9uLnB1c2goYXJyW2luZGV4Q29tYmluYXRpb25baW5kZXhDb21iaW5hdGlvbklkeF1dKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gYWRkIHRvIGNvbWJpbmF0aW9uc1xuICAgICAgY29tYmluYXRpb25zLnB1c2goY29tYmluYXRpb24pO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gY29tYmluYXRpb25zO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYW4gJ2EnIGVsZW1lbnQgdGhhdCBpcyBkb3dubG9hZGFibGUgd2hlbiBjbGlja2VkLlxuICAgKiBcbiAgICogQHBhcmFtIG5hbWUgaXMgdGhlIG5hbWUgb2YgdGhlIGZpbGUgdG8gZG93bmxvYWRcbiAgICogQHBhcmFtIGNvbnRlbnRzIGFyZSB0aGUgc3RyaW5nIGNvbnRlbnRzIG9mIHRoZSBmaWxlIHRvIGRvd25sb2FkXG4gICAqIEByZXR1cm4gJ2EnIGRvbSBlbGVtZW50IHdpdGggZG93bmxvYWRhYmxlIGZpbGVcbiAgICovXG4gIHN0YXRpYyBnZXREb3dubG9hZGFibGVBKG5hbWUsIGNvbnRlbnRzKSB7XG4gICAgbGV0IGEgPSB3aW5kb3cuZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgIGEuaHJlZiA9IHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKG5ldyBCbG9iKFtjb250ZW50c10sIHt0eXBlOiAndGV4dC9wbGFpbid9KSk7XG4gICAgYS5kb3dubG9hZCA9IG5hbWU7XG4gICAgYS50YXJnZXQ9XCJfYmxhbmtcIjtcbiAgICBhLmlubmVySFRNTCA9IG5hbWU7XG4gICAgcmV0dXJuIGE7XG4gIH1cblxuICAvKipcbiAgICogQ29waWVzIHByb3BlcnRpZXMgaW4gdGhlIGdpdmVuIG9iamVjdCB0byBhIG5ldyBvYmplY3QuXG4gICAqIFxuICAgKiBAcGFyYW0gb2JqIGlzIG9iamVjdCB0byBjb3B5IHByb3BlcnRpZXMgZm9yXG4gICAqIEByZXR1cm4gYSBuZXcgb2JqZWN0IHdpdGggcHJvcGVydGllcyBjb3BpZWQgZnJvbSB0aGUgZ2l2ZW4gb2JqZWN0XG4gICAqL1xuICBzdGF0aWMgY29weVByb3BlcnRpZXMob2JqKSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkob2JqKSlcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGVzIGFsbCBwcm9wZXJ0aWVzIGluIHRoZSBnaXZlbiBvYmplY3QuXG4gICAqIFxuICAgKiBAcGFyYW0gb2JqIGlzIHRoZSBvYmplY3QgdG8gZGVsZXRlIHByb3BlcnRpZXMgZnJvbVxuICAgKi9cbiAgc3RhdGljIGRlbGV0ZVByb3BlcnRpZXMob2JqKSB7XG4gICAgbGV0IHByb3BzID0gW107XG4gICAgZm9yIChsZXQgcHJvcCBpbiBvYmopIHByb3BzLnB1c2gocHJvcCk7IC8vIFRPRE86IGlmIChvYmouaGFzT3duUHJvcGVydHkocHJvcCkpIHsgLi4uXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykgZGVsZXRlIG9ialtwcm9wc1tpXS50b1N0cmluZygpXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGdpdmVuIHN0cmluZyBjb250YWlucyB3aGl0ZXNwYWNlLlxuICAgKiBcbiAgICogQHBhcmFtIHN0ciBpcyB0aGUgc3RyaW5nIHRvIHRlc3RcbiAgICogQHJldHVybiB0cnVlIGlmIHRoZSBzdHJpbmcgY29udGFpbnMgd2hpdGVzcGFjZSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaGFzV2hpdGVzcGFjZShzdHIpIHtcbiAgICByZXR1cm4gL1xccy9nLnRlc3Qoc3RyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGdpdmVuIGNoYXJhY3RlciBpcyB3aGl0ZXNwYWNlLlxuICAgKiBcbiAgICogQHBhcmFtIGNoYXIgaXMgdGhlIGNoYXJhY3RlciB0byB0ZXN0XG4gICAqIEByZXR1cm4gdHJ1ZSBpZiB0aGUgZ2l2ZW4gY2hhcmFjdGVyIGlzIHdoaXRlc3BhY2UsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGlzV2hpdGVzcGFjZShjaGFyKSB7XG4gICAgcmV0dXJuIC9cXHMvLnRlc3QoY2hhcik7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBnaXZlbiBjaGFyYWN0ZXIgaXMgYSBuZXdsaW5lLlxuICAgKiBcbiAgICogQHBhcmFtIGNoYXIgaXMgdGhlIGNoYXJhY3RlciB0byB0ZXN0XG4gICAqIEByZXR1cm4gdHJ1ZSBpZiB0aGUgZ2l2ZW4gY2hhcmFjdGVyIGlzIGEgbmV3bGluZSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaXNOZXdsaW5lKGNoYXIpIHtcbiAgICByZXR1cm4gY2hhciA9PT0gJ1xcbicgfHwgY2hhciA9PT0gJ1xccic7XG4gIH1cblxuICAvKipcbiAgICogQ291bnRzIHRoZSBudW1iZXIgb2Ygbm9uLXdoaXRlc3BhY2UgY2hhcmFjdGVycyBpbiB0aGUgZ2l2ZW4gc3RyaW5nLlxuICAgKiBcbiAgICogQHBhcmFtIHN0ciBpcyB0aGUgc3RyaW5nIHRvIGNvdW50IHRoZSBudW1iZXIgb2Ygbm9uLXdoaXRlc3BhY2UgY2hhcmFjdGVycyBpblxuICAgKiBAcmV0dXJuIGludCBpcyB0aGUgbnVtYmVyIG9mIG5vbi13aGl0ZXNwYWNlIGNoYXJhY3RlcnMgaW4gdGhlIGdpdmVuIHN0cmluZ1xuICAgKi9cbiAgc3RhdGljIGNvdW50Tm9uV2hpdGVzcGFjZUNoYXJhY3RlcnMoc3RyKSB7XG4gICAgbGV0IGNvdW50ID0gMDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKCFHZW5VdGlscy5pc1doaXRlc3BhY2Uoc3RyLmNoYXJBdChpKSkpIGNvdW50Kys7XG4gICAgfVxuICAgIHJldHVybiBjb3VudDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRva2VucyBzZXBhcmF0ZWQgYnkgd2hpdGVzcGFjZSBmcm9tIHRoZSBnaXZlbiBzdHJpbmcuXG4gICAqIFxuICAgKiBAcGFyYW0gc3RyIGlzIHRoZSBzdHJpbmcgdG8gZ2V0IHRva2VucyBmcm9tXG4gICAqIEByZXR1cm4gc3RyaW5nW10gYXJlIHRoZSB0b2tlbnMgc2VwYXJhdGVkIGJ5IHdoaXRlc3BhY2Ugd2l0aGluIHRoZSBzdHJpbmdcbiAgICovXG4gIHN0YXRpYyBnZXRXaGl0ZXNwYWNlVG9rZW5zKHN0cikge1xuICAgIHJldHVybiBzdHIubWF0Y2goL1xcUysvZyk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBsaW5lcyBzZXBhcmF0ZWQgYnkgbmV3bGluZXMgZnJvbSB0aGUgZ2l2ZW4gc3RyaW5nLlxuICAgKiBcbiAgICogQHBhcmFtIHN0ciBpcyB0aGUgc3RyaW5nIHRvIGdldCBsaW5lcyBmcm9tXG4gICAqIEBwYXJhbSBzdHJpbmdbXSBhcmUgdGhlIGxpbmVzIHNlcGFyYXRlZCBieSBuZXdsaW5lcyB3aXRoaW4gdGhlIHN0cmluZ1xuICAgKi9cbiAgc3RhdGljIGdldExpbmVzKHN0cikge1xuICAgIHJldHVybiBzdHIubWF0Y2goL1teXFxyXFxuXSsvZyk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgZG9jdW1lbnQncyBmaXJzdCBzdHlsZXNoZWV0IHdoaWNoIGhhcyBubyBocmVmLlxuICAgKiBcbiAgICogQHJldHVybiBTdHlsZVNoZWV0IGlzIHRoZSBpbnRlcm5hbCBzdHlsZXNoZWV0XG4gICAqL1xuICBzdGF0aWMgZ2V0SW50ZXJuYWxTdHlsZVNoZWV0KCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZG9jdW1lbnQuc3R5bGVTaGVldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBzdHlsZVNoZWV0ID0gZG9jdW1lbnQuc3R5bGVTaGVldHNbaV07XG4gICAgICBpZiAoIXN0eWxlU2hlZXQuaHJlZikgcmV0dXJuIHN0eWxlU2hlZXQ7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGRvY3VtZW50J3MgaW50ZXJuYWwgc3R5bGVzaGVldCBhcyB0ZXh0LlxuICAgKiBcbiAgICogQHJldHVybiBzdHIgaXMgdGhlIGRvY3VtZW50J3MgaW50ZXJuYWwgc3R5bGVzaGVldFxuICAgKi9cbiAgc3RhdGljIGdldEludGVybmFsU3R5bGVTaGVldFRleHQoKSB7XG4gICAgbGV0IGludGVybmFsQ3NzID0gXCJcIjtcbiAgICBsZXQgaW50ZXJuYWxTdHlsZVNoZWV0ID0gR2VuVXRpbHMuZ2V0SW50ZXJuYWxTdHlsZVNoZWV0KCk7XG4gICAgaWYgKCFpbnRlcm5hbFN0eWxlU2hlZXQpIHJldHVybiBudWxsO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW50ZXJuYWxTdHlsZVNoZWV0LmNzc1J1bGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpbnRlcm5hbENzcyArPSBpbnRlcm5hbFN0eWxlU2hlZXQuY3NzUnVsZXNbaV0uY3NzVGV4dCArIFwiXFxuXCI7XG4gICAgfVxuICAgIHJldHVybiBpbnRlcm5hbENzcztcbiAgfVxuXG4gIC8qKlxuICAgKiBNYW51YWxseSBidWlsZHMgYW4gSFRNTCBkb2N1bWVudCBzdHJpbmcuXG4gICAqIFxuICAgKiBAcGFyYW0gY29udGVudCBzcGVjaWZpZXMgb3B0aW9uYWwgZG9jdW1lbnQgY29udGVudFxuICAgKiAgICAgICAgY29udGVudC5kaXYgaXMgYSBwcmUtZXhpc3RpbmcgZGl2IHRvIHN0cmluZ2lmeSBhbmQgYWRkIHRvIHRoZSBib2R5XG4gICAqICAgICAgICBjb250ZW50LnRpdGxlIGlzIHRoZSB0aXRsZSBvZiB0aGUgbmV3IHRhYlxuICAgKiAgICAgICAgY29udGVudC5kZXBlbmRlbmN5UGF0aHMgc3BlY2lmaWVzIHBhdGhzIHRvIGpzLCBjc3MsIG9yIGltZyBwYXRoc1xuICAgKiAgICAgICAgY29udGVudC5pbnRlcm5hbENzcyBpcyBjc3MgdG8gZW1iZWQgaW4gdGhlIGh0bWwgZG9jdW1lbnRcbiAgICogICAgICAgIGNvbnRlbnQubWV0YXMgYXJlIG1ldGEgZWxlbWVudHMgd2l0aCBrZXlzL3ZhbHVlcyB0byBpbmNsdWRlXG4gICAqIEByZXR1cm4gc3RyIGlzIHRoZSBkb2N1bWVudCBzdHJpbmdcbiAgICovXG4gIHN0YXRpYyBidWlsZEh0bWxEb2N1bWVudChjb250ZW50KSB7XG4gICAgbGV0IHN0ciA9IFwiPCFET0NUWVBFIEhUTUw+XCI7XG4gICAgc3RyICs9IFwiPGh0bWw+PGhlYWQ+XCI7XG4gICAgXG4gICAgLy8gYWRkIG1ldGFzXG4gICAgaWYgKGNvbnRlbnQubWV0YXMpIHtcbiAgICAgIGxldCBtZXRhcyA9IEdlblV0aWxzLmxpc3RpZnkoY29udGVudC5tZXRhcyk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1ldGFzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxldCBtZXRhID0gbWV0YXNbaV07XG4gICAgICAgIGxldCBlbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIm1ldGFcIik7XG4gICAgICAgIGZvciAobGV0IHByb3AgaW4gbWV0YSkge1xuICAgICAgICAgIGlmIChtZXRhLmhhc093blByb3BlcnR5KHByb3ApKSB7XG4gICAgICAgICAgICBlbGVtLnNldEF0dHJpYnV0ZShwcm9wLnRvU3RyaW5nKCksIG1ldGFbcHJvcC50b1N0cmluZygpXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHN0ciArPSBlbGVtLm91dGVySFRNTDtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gYWRkIHRpdGxlIGFuZCBpbnRlcm5hbCBjc3NcbiAgICBzdHIgKz0gY29udGVudC50aXRsZSA/IFwiPHRpdGxlPlwiICsgY29udGVudC50aXRsZSArIFwiPC90aXRsZT5cIiA6IFwiXCI7XG4gICAgc3RyICs9IGNvbnRlbnQuaW50ZXJuYWxDc3MgPyBcIjxzdHlsZT5cIiArIGNvbnRlbnQuaW50ZXJuYWxDc3MgKyBcIjwvc3R5bGU+XCIgOiBcIlwiO1xuICAgIFxuICAgIC8vIGFkZCBkZXBlbmRlbmN5IHBhdGhzXG4gICAgaWYgKGNvbnRlbnQuZGVwZW5kZW5jeVBhdGhzKSB7XG4gICAgICBsZXQgZGVwZW5kZW5jeVBhdGhzID0gR2VuVXRpbHMubGlzdGlmeShjb250ZW50LmRlcGVuZGVuY3lQYXRocyk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlcGVuZGVuY3lQYXRocy5sZW5ndGg7IGkrKykge1xuICAgICAgICBsZXQgZGVwZW5kZW5jeVBhdGggPSBkZXBlbmRlbmN5UGF0aHNbaV07XG4gICAgICAgIGlmIChkZXBlbmRlbmN5UGF0aC5lbmRzV2l0aChcIi5qc1wiKSkgc3RyICs9IFwiPHNjcmlwdCBzcmM9J1wiICsgZGVwZW5kZW5jeVBhdGggKyBcIic+PC9zY3JpcHQ+XCI7XG4gICAgICAgIGVsc2UgaWYgKGRlcGVuZGVuY3lQYXRoLmVuZHNXaXRoKFwiLmNzc1wiKSkgc3RyICs9IFwiPGxpbmsgcmVsPSdzdHlsZXNoZWV0JyB0eXBlPSd0ZXh0L2NzcycgaHJlZj0nXCIgKyBkZXBlbmRlbmN5UGF0aCArIFwiJy8+XCI7XG4gICAgICAgIGVsc2UgaWYgKGRlcGVuZGVuY3lQYXRoLmVuZHNXaXRoKFwiLnBuZ1wiKSB8fCBkZXBlbmRlbmN5UGF0aC5lbmRzV2l0aChcIi5pbWdcIikpICBzdHIgKz0gXCI8aW1nIHNyYz0nXCIgKyBkZXBlbmRlbmN5UGF0aCArIFwiJz5cIjtcbiAgICAgICAgZWxzZSB0aHJvdyBuZXcgRXJyb3IoXCJVbnJlY29nbml6ZWQgZGVwZW5kZW5jeSBwYXRoIGV4dGVuc2lvbjogXCIgKyBkZXBlbmRlbmN5UGF0aCk7ICAgICAgXG4gICAgICB9XG4gICAgfVxuICAgIHN0ciArPSBcIjwvaGVhZD48Ym9keT5cIjtcbiAgICBpZiAoY29udGVudC5kaXYpIHN0ciArPSAkKFwiPGRpdj5cIikuYXBwZW5kKGNvbnRlbnQuZGl2LmNsb25lKCkpLmh0bWwoKTsgIC8vIGFkZCBjbG9uZWQgZGl2IGFzIHN0cmluZ1xuICAgIHN0ciArPSBcIjwvYm9keT48L2h0bWw+XCI7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVucyB0aGUgZ2l2ZW4gZGl2IGluIGEgbmV3IHdpbmRvdy5cbiAgICogXG4gICAqIEBwYXJhbSBjb250ZW50IHNwZWNpZmllcyBvcHRpb25hbCB3aW5kb3cgY29udGVudFxuICAgKiAgICAgICAgY29udGVudC5kaXYgaXMgYSBwcmUtZXhpc3RpbmcgZGl2IHRvIHN0cmluZ2lmeSBhbmQgYWRkIHRvIHRoZSBib2R5XG4gICAqICAgICAgICBjb250ZW50LnRpdGxlIGlzIHRoZSB0aXRsZSBvZiB0aGUgbmV3IHRhYlxuICAgKiAgICAgICAgY29udGVudC5kZXBlbmRlbmN5UGF0aHMgc3BlY2lmaWVzIHBhdGhzIHRvIGpzLCBjc3MsIG9yIGltZyBwYXRoc1xuICAgKiAgICAgICAgY29udGVudC5pbnRlcm5hbENzcyBpcyBjc3MgdG8gZW1iZWQgaW4gdGhlIGh0bWwgZG9jdW1lbnRcbiAgICogICAgICAgIGNvbnRlbnQubWV0YXMgYXJlIG1ldGEgZWxlbWVudHMgd2l0aCBrZXlzL3ZhbHVlcyB0byBpbmNsdWRlXG4gICAqIEBwYXJhbSBvbkxvYWQoZXJyLCB3aW5kb3cpIGlzIGludm9rZWQgd2l0aCBhIHJlZmVyZW5jZSB0byB0aGUgd2luZG93IHdoZW4gYXZhaWxhYmxlXG4gICAqL1xuICBzdGF0aWMgbmV3V2luZG93KGNvbnRlbnQsIG9uTG9hZCkge1xuICAgIGxldCBvbkxvYWRDYWxsZWQgPSBmYWxzZTtcbiAgICBsZXQgdyA9IHdpbmRvdy5vcGVuKCk7XG4gICAgaWYgKCFHZW5VdGlscy5pc0luaXRpYWxpemVkKHcpIHx8ICFHZW5VdGlscy5pc0luaXRpYWxpemVkKHcuZG9jdW1lbnQpKSB7XG4gICAgICBvbkxvYWRPbmNlKG5ldyBFcnJvcihcIkNvdWxkIG5vdCBnZXQgd2luZG93IHJlZmVyZW5jZVwiKSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHcub3BlbmVyID0gbnVsbDtcbiAgICB3LmRvY3VtZW50LndyaXRlKEdlblV0aWxzLmJ1aWxkSHRtbERvY3VtZW50KGNvbnRlbnQpKTtcbiAgICB3LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgIG9uTG9hZE9uY2UobnVsbCwgdyk7XG4gICAgfSk7XG4gICAgdy5kb2N1bWVudC5jbG9zZSgpO1xuICAgIFxuICAgIC8vIHByZXZlbnRzIG9uTG9hZCgpIGZyb20gYmVpbmcgY2FsbGVkIG11bHRpcGxlIHRpbWVzXG4gICAgZnVuY3Rpb24gb25Mb2FkT25jZShlcnIsIHdpbmRvdz8pIHtcbiAgICAgIGlmIChvbkxvYWRDYWxsZWQpIHJldHVybjtcbiAgICAgIG9uTG9hZENhbGxlZCA9IHRydWU7XG4gICAgICBpZiAob25Mb2FkKSBvbkxvYWQoZXJyLCB3aW5kb3cpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyB0aGUgZ2l2ZW4gaW1hZ2UgdG8gYSBiYXNlNjQgZW5jb2RlZCBkYXRhIHVybC5cbiAgICogXG4gICAqIEBwYXJhbSBpbWcgaXMgdGhlIGltYWdlIHRvIGNvbnZlcnRcbiAgICogQHBhcmFtIHF1YWxpdHkgaXMgYSBudW1iZXIgYmV0d2VlbiAwIGFuZCAxIHNwZWNpZnlpbmcgdGhlIGltYWdlIHF1YWxpdHlcbiAgICovXG4gIHN0YXRpYyBpbWdUb0RhdGFVcmwoaW1nLCBxdWFsaXR5KSB7XG4gICAgbGV0IGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICAgIGNhbnZhcy5oZWlnaHQgPSBpbWcubmF0dXJhbEhlaWdodDtcbiAgICBjYW52YXMud2lkdGggPSBpbWcubmF0dXJhbFdpZHRoO1xuICAgIGxldCBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgY29udGV4dC5kcmF3SW1hZ2UoaW1nLCAwLCAwKTtcbiAgICByZXR1cm4gY2FudmFzLnRvRGF0YVVSTChxdWFsaXR5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIGlmIHRoZSBpbWFnZSBhdCB0aGUgZ2l2ZW4gVVJMIGlzIGFjY2Vzc2libGUuXG4gICAqIFxuICAgKiBAcGFyYW0gdXJsIGlzIHRoZSB1cmwgdG8gYW4gaW1hZ2VcbiAgICogQHBhcmFtIHRpbWVvdXQgaXMgdGhlIG1heGltdW0gdGltZSB0byB3YWl0XG4gICAqIEBwYXJhbSBvbkRvbmUoYm9vbCkgd2hlbiB0aGUgaW1hZ2UgaXMgZGV0ZXJtaW5lZCB0byBiZSBhY2Nlc3NpYmxlIG9yIG5vdFxuICAgKi9cbiAgc3RhdGljIGlzSW1hZ2VBY2Nlc3NpYmxlKHVybCwgdGltZW91dCwgb25Eb25lKSB7XG4gICAgXG4gICAgLy8gdHJhY2sgcmV0dXJuIHNvIGl0IG9ubHkgZXhlY3V0ZXMgb25jZVxuICAgIGxldCByZXR1cm5lZCA9IGZhbHNlO1xuICAgIFxuICAgIC8vIGF0dGVtcHQgdG8gbG9hZCBmYXZpY29uXG4gICAgbGV0IGltZyA9IG5ldyBJbWFnZSgpO1xuICAgIGltZy5vbmxvYWQgPSBvblJlc3BvbnNlO1xuICAgIGltZy5vbmVycm9yID0gb25SZXNwb25zZTtcbiAgICBpbWcuc3JjID0gdXJsICsgXCI/XCIgKyAoK25ldyBEYXRlKCkpOyAvLyB0cmlnZ2VyIGltYWdlIGxvYWQgd2l0aCBjYWNoZSBidXN0ZXJcbiAgICBcbiAgICAvLyBuZXN0IGZhaWx1cmUgdGltZW91dHMgdG8gZ2l2ZSByZXNwb25zZSBhIGNoYW5jZSB3aGVuIGJyb3dzZXIgaXMgdW5kZXIgbG9hZFxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICBzZXRJbW1lZGlhdGUoZnVuY3Rpb24oKSB7XG4gICAgICAgIHNldEltbWVkaWF0ZShmdW5jdGlvbigpIHtcbiAgICAgICAgICBzZXRJbW1lZGlhdGUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoIXJldHVybmVkKSB7XG4gICAgICAgICAgICAgIHJldHVybmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgb25Eb25lKGZhbHNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9LCB0aW1lb3V0KTtcbiAgICBcbiAgICBmdW5jdGlvbiBvblJlc3BvbnNlKGUpIHtcbiAgICAgIGlmIChyZXR1cm5lZCkgcmV0dXJuO1xuICAgICAgcmV0dXJuZWQgPSB0cnVlO1xuICAgICAgaWYgKHR5cGVvZiBlID09PSAndW5kZWZpbmVkJyB8fCBlLnR5cGUgPT09IFwiZXJyb3JcIikgb25Eb25lKGZhbHNlKTtcbiAgICAgIGVsc2Ugb25Eb25lKHRydWUpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIGlmIHRoZSBnaXZlbiBmaWxlIGlzIGEgemlwIGZpbGUuXG4gICAqIFxuICAgKiBAcGFyYW0gZmlsZSBpcyBhIGZpbGVcbiAgICogQHJldHVybiB0cnVlIGlmIHRoZSBnaXZlbiBmaWxlIGlzIGEgemlwIGZpbGUsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGlzWmlwRmlsZShmaWxlKSB7XG4gICAgcmV0dXJuIGZpbGUubmFtZS5lbmRzV2l0aChcIi56aXBcIikgfHwgZmlsZS50eXBlID09PSAnYXBwbGljYXRpb24vemlwJztcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIGlmIHRoZSBnaXZlbiBmaWxlIGlzIGEganNvbiBmaWxlLlxuICAgKiBcbiAgICogQHBhcmFtIGZpbGUgaXMgYSBmaWxlXG4gICAqIEByZXR1cm4gdHJ1ZSBpZiB0aGUgZ2l2ZW4gZmlsZSBpcyBhIGpzb24gZmlsZSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaXNKc29uRmlsZShmaWxlKSB7XG4gICAgcmV0dXJuIGZpbGUubmFtZS5lbmRzV2l0aChcIi5qc29uXCIpIHx8IGZpbGUudHlwZSA9PT0gJ2FwcGxpY2F0aW9uL2pzb24nO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgdGhlIGdpdmVuIGZpbGUgaXMgYSB0eHQgZmlsZS5cbiAgICogXG4gICAqIEBwYXJhbSBmaWxlIGlzIGEgZmlsZVxuICAgKiBAcmV0dXJuIHRydWUgaWYgdGhlIGdpdmVuIGZpbGUgaXMgYSB0eHQgZmlsZSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaXNUeHRGaWxlKGZpbGUpIHtcbiAgICByZXR1cm4gZmlsZS5uYW1lLmVuZHNXaXRoKFwiLnR4dFwiKSB8fCBmaWxlLnR5cGUgPT09ICd0ZXh0L3BsYWluJztcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaGVzIHRoZSBnaXZlbiBsaXN0IG9mIGltYWdlcy5cbiAgICogXG4gICAqIFByZXJlcXVpc2l0ZTogYXN5bmMuanMuXG4gICAqIFxuICAgKiBAcGFyYW0gcGF0aHMgYXJlIHRoZSBwYXRocyB0byB0aGUgaW1hZ2VzIHRvIGZldGNoXG4gICAqIEBwYXJhbSBvbkRvbmUoZXJyLCBpbWFnZXMpIGlzIGNhbGxlZCB3aGVuIGRvbmVcbiAgICovXG4gIHN0YXRpYyBnZXRJbWFnZXMocGF0aHMsIG9uRG9uZSkge1xuICAgIFxuICAgIC8vIGxpc3RpZnkgcGF0aHNcbiAgICBpZiAoIUdlblV0aWxzLmlzQXJyYXkocGF0aHMpKSB7XG4gICAgICBHZW5VdGlscy5hc3NlcnRUcnVlKEdlblV0aWxzLmlzU3RyaW5nKHBhdGhzKSk7XG4gICAgICBwYXRocyA9IFtwYXRoc107XG4gICAgfVxuICAgIFxuICAgIC8vIGNvbGxlY3QgZnVuY3Rpb25zIHRvIGZldGNoIGltYWdlc1xuICAgIGxldCBmdW5jcyA9IFtdO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGF0aHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGZ1bmNzLnB1c2gobG9hZEZ1bmMocGF0aHNbaV0pKTtcbiAgICB9XG4gICAgXG4gICAgLy8gZmV0Y2ggaW4gcGFyYWxsZWxcbiAgICBhc3luYy5wYXJhbGxlbChmdW5jcywgb25Eb25lKTtcbiAgICBcbiAgICAvLyBjYWxsYmFjayBzdGF0aWMgdG8gZmV0Y2ggYSBzaW5nbGUgaW1hZ2VcbiAgICBmdW5jdGlvbiBsb2FkRnVuYyhwYXRoKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24ob25Eb25lKSB7XG4gICAgICAgIGxldCBpbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgaW1nLm9ubG9hZCA9IGZ1bmN0aW9uKCkgeyBvbkRvbmUobnVsbCwgaW1nKTsgfVxuICAgICAgICBpbWcub25lcnJvciA9IGZ1bmN0aW9uKCkgeyBvbkRvbmUobmV3IEVycm9yKFwiQ2Fubm90IGxvYWQgaW1hZ2U6IFwiICsgcGF0aCkpOyB9XG4gICAgICAgIGltZy5zcmMgPSBwYXRoO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIFJldHVybnMgYSBzdHJpbmcgaW5kZW50YXRpb24gb2YgdGhlIGdpdmVuIGxlbmd0aDtcbiAgICogXG4gICAqIEBwYXJhbSBsZW5ndGggaXMgdGhlIGxlbmd0aCBvZiB0aGUgaW5kZW50YXRpb25cbiAgICogQHJldHVybiB7c3RyaW5nfSBpcyBhbiBpbmRlbnRhdGlvbiBzdHJpbmcgb2YgdGhlIGdpdmVuIGxlbmd0aFxuICAgKi9cbiAgc3RhdGljIGdldEluZGVudChsZW5ndGgpIHtcbiAgICBsZXQgc3RyID0gXCJcIjtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSBzdHIgKz0gJyAgJzsgLy8gdHdvIHNwYWNlc1xuICAgIHJldHVybiBzdHI7XG4gIH1cbiAgXG4gIHN0YXRpYyBpbml0UG9seWZpbGxzKCkge1xuICAgIFxuICAgIC8vIFBvbHlmaWxsIE9iamVjdC5hc3NpZ24oKVxuICAgIC8vIENyZWRpdDogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvT2JqZWN0L2Fzc2lnblxuICAgIGlmICh0eXBlb2YgT2JqZWN0LmFzc2lnbiAhPSAnZnVuY3Rpb24nKSB7XG4gICAgICAvLyBNdXN0IGJlIHdyaXRhYmxlOiB0cnVlLCBlbnVtZXJhYmxlOiBmYWxzZSwgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoT2JqZWN0LCBcImFzc2lnblwiLCB7XG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbiBhc3NpZ24odGFyZ2V0LCB2YXJBcmdzKSB7IC8vIC5sZW5ndGggb2Ygc3RhdGljIGlzIDJcbiAgICAgICAgICAndXNlIHN0cmljdCc7XG4gICAgICAgICAgaWYgKHRhcmdldCA9PSBudWxsKSB7IC8vIFR5cGVFcnJvciBpZiB1bmRlZmluZWQgb3IgbnVsbFxuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNvbnZlcnQgdW5kZWZpbmVkIG9yIG51bGwgdG8gb2JqZWN0Jyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGV0IHRvID0gT2JqZWN0KHRhcmdldCk7XG5cbiAgICAgICAgICBmb3IgKGxldCBpbmRleCA9IDE7IGluZGV4IDwgYXJndW1lbnRzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgICAgbGV0IG5leHRTb3VyY2UgPSBhcmd1bWVudHNbaW5kZXhdO1xuXG4gICAgICAgICAgICBpZiAobmV4dFNvdXJjZSAhPSBudWxsKSB7IC8vIFNraXAgb3ZlciBpZiB1bmRlZmluZWQgb3IgbnVsbFxuICAgICAgICAgICAgICBmb3IgKGxldCBuZXh0S2V5IGluIG5leHRTb3VyY2UpIHtcbiAgICAgICAgICAgICAgICAvLyBBdm9pZCBidWdzIHdoZW4gaGFzT3duUHJvcGVydHkgaXMgc2hhZG93ZWRcbiAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG5leHRTb3VyY2UsIG5leHRLZXkpKSB7XG4gICAgICAgICAgICAgICAgICB0b1tuZXh0S2V5XSA9IG5leHRTb3VyY2VbbmV4dEtleV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0bztcbiAgICAgICAgfSxcbiAgICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIC8qKlxuICAgICAqIFBvbHlmaWxsIHN0ci5zdGFydHNXaXRoKHNlYXJjaFN0cmluZywgcG9zaXRpb24pLlxuICAgICAqIFxuICAgICAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL1N0cmluZy9zdGFydHNXaXRoI1BvbHlmaWxsXG4gICAgICovXG4gICAgU3RyaW5nLnByb3RvdHlwZS5zdGFydHNXaXRoID0gZnVuY3Rpb24oc2VhcmNoU3RyaW5nLCBwb3NpdGlvbikge1xuICAgICAgcmV0dXJuIHRoaXMuc3Vic3RyKHBvc2l0aW9uIHx8IDAsIHNlYXJjaFN0cmluZy5sZW5ndGgpID09PSBzZWFyY2hTdHJpbmc7XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIFBvbHlmaWxsIHN0ci5lbmRzV2l0aChzZWFyY2hTdHJpbmcsIHBvc2l0aW9uKS5cbiAgICAgKiBcbiAgICAgKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9TdHJpbmcvZW5kc1dpdGgjUG9seWZpbGxcbiAgICAgKi9cbiAgICBTdHJpbmcucHJvdG90eXBlLmVuZHNXaXRoID0gZnVuY3Rpb24oc2VhcmNoU3RyaW5nLCBwb3NpdGlvbikge1xuICAgICAgaWYgKCEocG9zaXRpb24gPCB0aGlzLmxlbmd0aCkpIHBvc2l0aW9uID0gdGhpcy5sZW5ndGg7ICAvLyB3b3JrcyBiZXR0ZXIgdGhhbiA+PSBiZWNhdXNlIGl0IGNvbXBlbnNhdGVzIGZvciBOYU5cbiAgICAgIGVsc2UgcG9zaXRpb24gfD0gMDsgLy8gcm91bmQgcG9zaXRpb25cbiAgICAgIHJldHVybiB0aGlzLnN1YnN0cihwb3NpdGlvbiAtIHNlYXJjaFN0cmluZy5sZW5ndGgsIHNlYXJjaFN0cmluZy5sZW5ndGgpID09PSBzZWFyY2hTdHJpbmc7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyBhIHY0IFVVSUQuXG4gICAqIFxuICAgKiBTb3VyY2U6IGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzEwNTAzNC9jcmVhdGUtZ3VpZC11dWlkLWluLWphdmFzY3JpcHRcbiAgICovXG4gIHN0YXRpYyBnZXRVVUlEKCkge1xuICAgIHJldHVybiAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uKGMpIHtcbiAgICAgIGxldCByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMCwgdiA9IGMgPT0gJ3gnID8gciA6IChyICYgMHgzIHwgMHg4KTtcbiAgICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgY3VycmVudCBlbnZpcm9ubWVudCBpcyBhIGJyb3dzZXIuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBlbnZpcm9ubWVudCBpcyBhIGJyb3dzZXIsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGlzQnJvd3NlcigpIHtcbiAgICBsZXQgaXNXb3JrZXIgPSB0eXBlb2YgaW1wb3J0U2NyaXB0cyA9PT0gJ2Z1bmN0aW9uJztcbiAgICBsZXQgaXNCcm93c2VyTWFpbiA9IG5ldyBGdW5jdGlvbihcInRyeSB7cmV0dXJuIHRoaXM9PT13aW5kb3c7fWNhdGNoKGUpe3JldHVybiBmYWxzZTt9XCIpKCk7XG4gICAgbGV0IGlzSnNEb20gPSBpc0Jyb3dzZXJNYWluID8gbmV3IEZ1bmN0aW9uKFwidHJ5IHtyZXR1cm4gd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQuaW5jbHVkZXMoJ2pzZG9tJyk7fWNhdGNoKGUpe3JldHVybiBmYWxzZTt9XCIpKCkgOiBmYWxzZTtcbiAgICByZXR1cm4gaXNXb3JrZXIgfHwgKGlzQnJvd3Nlck1haW4gJiYgIWlzSnNEb20pO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBjdXJyZW50IGVudmlyb25tZW50IGlzIERlbm9cbiAgICogXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGVudmlyb25tZW50IGlzIERlbm8sIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGlzRGVubygpIHtcbiAgICByZXR1cm4gdHlwZW9mIERlbm8gPT09IFwib2JqZWN0XCIgJiYgRGVuby5oYXNPd25Qcm9wZXJ0eShcInZlcnNpb25cIikgJiYgdHlwZW9mIERlbm8udmVyc2lvbiA9PT0gXCJvYmplY3RcIiAmJiBEZW5vLnZlcnNpb24uaGFzT3duUHJvcGVydHkoXCJkZW5vXCIpICYmIHR5cGVvZiBEZW5vLnZlcnNpb24uZGVubyA9PT0gXCJzdHJpbmdcIjtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgY3VycmVudCBlbnZpcm9ubWVudCBpcyBhIGZpcmVmb3gtYmFzZWQgYnJvd3Nlci5cbiAgICogXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGVudmlyb25tZW50IGlzIGEgZmlyZWZveC1iYXNlZCBicm93c2VyLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc0ZpcmVmb3goKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNCcm93c2VyKCkgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKFwiRmlyZWZveFwiKSA+IDA7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgSUUgdmVyc2lvbiBudW1iZXIuXG4gICAqIFxuICAgKiBDcmVkaXQ6IGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE5OTk5Mzg4L2NoZWNrLWlmLXVzZXItaXMtdXNpbmctaWUtd2l0aC1qcXVlcnkvMjE3MTIzNTYjMjE3MTIzNTZcbiAgICogXG4gICAqIEByZXR1cm4gdGhlIElFIHZlcnNpb24gbnVtYmVyIG9yIG51bGwgaWYgbm90IElFXG4gICAqL1xuICBzdGF0aWMgZ2V0SUVWZXJzaW9uKCkge1xuICAgIGxldCB1YSA9IHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50O1xuXG4gICAgbGV0IG1zaWUgPSB1YS5pbmRleE9mKCdNU0lFICcpO1xuICAgIGlmIChtc2llID4gMCkge1xuICAgICAgICAvLyBJRSAxMCBvciBvbGRlciA9PiByZXR1cm4gdmVyc2lvbiBudW1iZXJcbiAgICAgICAgcmV0dXJuIHBhcnNlSW50KHVhLnN1YnN0cmluZyhtc2llICsgNSwgdWEuaW5kZXhPZignLicsIG1zaWUpKSwgMTApO1xuICAgIH1cblxuICAgIGxldCB0cmlkZW50ID0gdWEuaW5kZXhPZignVHJpZGVudC8nKTtcbiAgICBpZiAodHJpZGVudCA+IDApIHtcbiAgICAgICAgLy8gSUUgMTEgPT4gcmV0dXJuIHZlcnNpb24gbnVtYmVyXG4gICAgICAgIGxldCBydiA9IHVhLmluZGV4T2YoJ3J2OicpO1xuICAgICAgICByZXR1cm4gcGFyc2VJbnQodWEuc3Vic3RyaW5nKHJ2ICsgMywgdWEuaW5kZXhPZignLicsIHJ2KSksIDEwKTtcbiAgICB9XG5cbiAgICBsZXQgZWRnZSA9IHVhLmluZGV4T2YoJ0VkZ2UvJyk7XG4gICAgaWYgKGVkZ2UgPiAwKSB7XG4gICAgICAgLy8gRWRnZSAoSUUgMTIrKSA9PiByZXR1cm4gdmVyc2lvbiBudW1iZXJcbiAgICAgICByZXR1cm4gcGFyc2VJbnQodWEuc3Vic3RyaW5nKGVkZ2UgKyA1LCB1YS5pbmRleE9mKCcuJywgZWRnZSkpLCAxMCk7XG4gICAgfVxuXG4gICAgLy8gb3RoZXIgYnJvd3NlclxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSBwYXJhbWV0ZXIgdmFsdWUuXG4gICAqIFxuICAgKiBDcmVkaXQ6IGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzkwMTExNS9ob3ctY2FuLWktZ2V0LXF1ZXJ5LXN0cmluZy12YWx1ZXMtaW4tamF2YXNjcmlwdFxuICAgKiBcbiAgICogQHBhcmFtIG5hbWUgaXMgdGhlIG5hbWUgb2YgdGhlIHBhcmFtZXRlciB0byBnZXQgdGhlIHZhbHVlIG9mXG4gICAqIEBwYXJhbSB1cmwgaXMgYSBVUkwgdG8gZ2V0IHRoZSBwYXJhbWV0ZXIgZnJvbSwgdXNlcyB0aGUgd2luZG93J3MgY3VycmVudCBocmVmIGlmIG5vdCBnaXZlblxuICAgKiBAcmV0dXJuIHRoZSBwYXJhbWV0ZXIncyB2YWx1ZVxuICAgKi9cbiAgc3RhdGljIGdldFBhcmFtZXRlckJ5TmFtZShuYW1lLCB1cmwpIHtcbiAgICBpZiAoIXVybCkgdXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWY7XG4gICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvW1xcW1xcXV0vZywgXCJcXFxcJCZcIik7XG4gICAgbGV0IHJlZ2V4ID0gbmV3IFJlZ0V4cChcIls/Jl1cIiArIG5hbWUgKyBcIig9KFteJiNdKil8JnwjfCQpXCIpLCByZXN1bHRzID0gcmVnZXguZXhlYyh1cmwpO1xuICAgIGlmICghcmVzdWx0cykgcmV0dXJuIG51bGw7XG4gICAgaWYgKCFyZXN1bHRzWzJdKSByZXR1cm4gJyc7XG4gICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChyZXN1bHRzWzJdLnJlcGxhY2UoL1xcKy9nLCBcIiBcIikpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0cyBhIG5vbi1jcnlwdG9ncmFwaGljYWxseSBzZWN1cmUgcmFuZG9tIG51bWJlciB3aXRoaW4gYSBnaXZlbiByYW5nZS5cbiAgICogXG4gICAqIEBwYXJhbSBtaW4gaXMgdGhlIG1pbmltdW0gcmFuZ2Ugb2YgdGhlIGludCB0byBnZW5lcmF0ZSwgaW5jbHVzaXZlXG4gICAqIEBwYXJhbSBtYXggaXMgdGhlIG1heGltdW0gcmFuZ2Ugb2YgdGhlIGludCB0byBnZW5lcmF0ZSwgaW5jbHVzaXZlXG4gICAqIFxuICAgKiBTb3VyY2U6IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL01hdGgvcmFuZG9tXG4gICAqL1xuICBzdGF0aWMgZ2V0UmFuZG9tSW50KG1pbiwgbWF4KSB7XG4gICAgbWluID0gTWF0aC5jZWlsKG1pbik7XG4gICAgbWF4ID0gTWF0aC5mbG9vcihtYXgpO1xuICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpICsgbWluO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0cyByYW5kb20gaW50cy5cbiAgICogXG4gICAqIEBwYXJhbSBtaW4gaXMgdGhlIG1pbmltdW0gcmFuZ2Ugb2YgdGhlIGludHMgdG8gZ2VuZXJhdGUsIGluY2x1c2l2ZVxuICAgKiBAcGFyYW0gbWF4IGlzIHRoZSBtYXhpbXVtIHJhbmdlIG9mIHRoZSBpbnRzIHRvIGdlbmVyYXRlLCBpbmNsdXNpdmVcbiAgICogQHBhcmFtIGNvdW50IGlzIHRoZSBudW1iZXIgb2YgcmFuZG9tIGludHMgdG8gZ2V0XG4gICAqL1xuICBzdGF0aWMgZ2V0UmFuZG9tSW50cyhtaW4sIG1heCwgY291bnQpIHtcbiAgICBHZW5VdGlscy5hc3NlcnRUcnVlKHR5cGVvZiBjb3VudCA9PT0gXCJudW1iZXJcIik7XG4gICAgbGV0IGludHMgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpKyspIGludHMucHVzaChHZW5VdGlscy5nZXRSYW5kb21JbnQobWluLCBtYXgpKTtcbiAgICByZXR1cm4gaW50cztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldHMgYSBnaXZlbiBudW1iZXIgb2YgdW5pcXVlIHJhbmRvbSBpbnRzIHdpdGhpbiBhIHJhbmdlLlxuICAgKiBcbiAgICogQHBhcmFtIG1pbiBpcyB0aGUgbWluaW11bSByYW5nZSBvZiB0aGUgaW50cyB0byBnZW5lcmF0ZSwgaW5jbHVzaXZlXG4gICAqIEBwYXJhbSBtYXggaXMgdGhlIG1heGltdW0gcmFuZ2Ugb2YgdGhlIGludHMgdG8gZ2VuZXJhdGUsIGluY2x1c2l2ZVxuICAgKiBAcGFyYW0gY291bnQgaXMgdGhlIG51bWJlciBvZiB1bmlxdWUgcmFuZG9tIGludHMgdG8gZ2V0XG4gICAqL1xuICBzdGF0aWMgZ2V0VW5pcXVlUmFuZG9tSW50cyhtaW4sIG1heCwgY291bnQpIHtcbiAgICBsZXQgaW50cyA9IFtdO1xuICAgIEdlblV0aWxzLmFzc2VydFRydWUoY291bnQgPj0gMCk7XG4gICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZShtYXggLSBtaW4gKyAxID49IGNvdW50KTtcbiAgICB3aGlsZSAoaW50cy5sZW5ndGggPCBjb3VudCkge1xuICAgICAgbGV0IHJhbmRvbUludCA9IEdlblV0aWxzLmdldFJhbmRvbUludChtaW4sIG1heCk7XG4gICAgICBpZiAoIWludHMuaW5jbHVkZXMocmFuZG9tSW50KSkgaW50cy5wdXNoKHJhbmRvbUludCk7XG4gICAgfVxuICAgIHJldHVybiBpbnRzO1xuICB9XG4gIFxuICAvKipcbiAgICogUmFuZG9taXplIGFycmF5IGVsZW1lbnQgb3JkZXIgaW4tcGxhY2UgdXNpbmcgRHVyc3RlbmZlbGQgc2h1ZmZsZSBhbGdvcml0aG0uXG4gICAqIFxuICAgKiBDcmVkaXQ6IGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzI0NTA5NTQvaG93LXRvLXJhbmRvbWl6ZS1zaHVmZmxlLWEtamF2YXNjcmlwdC1hcnJheVxuICAgKi9cbiAgc3RhdGljIHNodWZmbGUoYXJyYXkpIHtcbiAgICBmb3IgKHZhciBpID0gYXJyYXkubGVuZ3RoIC0gMTsgaSA+IDA7IGktLSkge1xuICAgICAgdmFyIGogPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAoaSArIDEpKTtcbiAgICAgIHZhciB0ZW1wID0gYXJyYXlbaV07XG4gICAgICBhcnJheVtpXSA9IGFycmF5W2pdO1xuICAgICAgYXJyYXlbal0gPSB0ZW1wO1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIFNvcnRzIGFuIGFycmF5IGJ5IG5hdHVyYWwgb3JkZXJpbmcuXG4gICAqIFxuICAgKiBAcGFyYW0gdGhlIGFycmF5IHRvIHNvcnRcbiAgICovXG4gIHN0YXRpYyBzb3J0KGFycmF5KSB7XG4gICAgYXJyYXkuc29ydCgoYSwgYikgPT4gYSA9PT0gYiA/IDAgOiBhID4gYiA/IDEgOiAtMSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBnaXZlbiB2YWx1ZSBlbnN1cmluZyBhIHByZXZpb3VzIHZhbHVlIGlzIG5vdCBvdmVyd3JpdHRlbi5cbiAgICogXG4gICAqIFRPRE86IHJlbW92ZSBmb3IgcG9ydGFiaWxpdHkgYmVjYXVzZSBmdW5jdGlvbiBwYXNzaW5nIG5vdCBzdXBwb3J0ZWQgaW4gb3RoZXIgbGFuZ3VhZ2VzLCB1c2UgcmVjb25jaWxlIG9ubHlcbiAgICogXG4gICAqIEBwYXJhbSBvYmogaXMgdGhlIG9iamVjdCB0byBpbnZva2UgdGhlIGdldHRlciBhbmQgc2V0dGVyIG9uXG4gICAqIEBwYXJhbSBnZXRGbiBnZXRzIHRoZSBjdXJyZW50IHZhbHVlXG4gICAqIEBwYXJhbSBzZXRGbiBzZXRzIHRoZSBjdXJyZW50IHZhbHVlXG4gICAqIEBwYXJhbSB2YWwgaXMgdGhlIHZhbHVlIHRvIHNldCBpZmYgaXQgZG9lcyBub3Qgb3ZlcndyaXRlIGEgcHJldmlvdXMgdmFsdWVcbiAgICogQHBhcmFtIFtjb25maWddIHNwZWNpZmllcyByZWNvbmNpbGlhdGlvbiBjb25maWd1cmF0aW9uXG4gICAqICAgICAgICBjb25maWcucmVzb2x2ZURlZmluZWQgdXNlcyBkZWZpbmVkIHZhbHVlIGlmIHRydWUgb3IgdW5kZWZpbmVkLCB1bmRlZmluZWQgaWYgZmFsc2VcbiAgICogICAgICAgIGNvbmZpZy5yZXNvbHZlVHJ1ZSB1c2VzIHRydWUgb3ZlciBmYWxzZSBpZiB0cnVlLCBmYWxzZSBvdmVyIHRydWUgaWYgZmFsc2UsIG11c3QgYmUgZXF1YWwgaWYgdW5kZWZpbmVkXG4gICAqICAgICAgICBjb25maWcucmVzb2x2ZU1heCB1c2VzIG1heCBvdmVyIG1pbiBpZiB0cnVlLCBtaW4gb3ZlciBtYXggaWYgZmFsc2UsIG11c3QgYmUgZXF1YWwgaWYgdW5kZWZpbmVkXG4gICAqIEBwYXJhbSBbZXJyTXNnXSBpcyB0aGUgZXJyb3IgbWVzc2FnZSB0byB0aHJvdyBpZiB0aGUgdmFsdWVzIGNhbm5vdCBiZSByZWNvbmNpbGVkIChvcHRpb25hbClcbiAgICovXG4gIHN0YXRpYyBzYWZlU2V0KG9iaiwgZ2V0Rm4sIHNldEZuLCB2YWwsIGNvbmZpZz8sIGVyck1zZz8pIHtcbiAgICBsZXQgY3VyVmFsID0gZ2V0Rm4uY2FsbChvYmopO1xuICAgIGxldCByZWNvbmNpbGVkVmFsID0gR2VuVXRpbHMucmVjb25jaWxlKGN1clZhbCwgdmFsLCBjb25maWcsIGVyck1zZyk7XG4gICAgaWYgKGN1clZhbCAhPT0gcmVjb25jaWxlZFZhbCkgc2V0Rm4uY2FsbChvYmosIHJlY29uY2lsZWRWYWwpO1xuICB9XG4gIFxuICAvKipcbiAgICogUmVjb25jaWxlcyB0d28gdmFsdWVzLlxuICAgKiBcbiAgICogVE9ETzogcmVtb3ZlIGN1c3RvbSBlcnJvciBtZXNzYWdlXG4gICAqIFxuICAgKiBAcGFyYW0gdmFsMSBpcyBhIHZhbHVlIHRvIHJlY29uY2lsZVxuICAgKiBAcGFyYW0gdmFsMiBpcyBhIHZhbHVlIHRvIHJlY29uY2lsZVxuICAgKiBAcGFyYW0gW2NvbmZpZ10gc3BlY2lmaWVzIHJlY29uY2lsaWF0aW9uIGNvbmZpZ3VyYXRpb25cbiAgICogICAgICAgIGNvbmZpZy5yZXNvbHZlRGVmaW5lZCB1c2VzIGRlZmluZWQgdmFsdWUgaWYgdHJ1ZSBvciB1bmRlZmluZWQsIHVuZGVmaW5lZCBpZiBmYWxzZVxuICAgKiAgICAgICAgY29uZmlnLnJlc29sdmVUcnVlIHVzZXMgdHJ1ZSBvdmVyIGZhbHNlIGlmIHRydWUsIGZhbHNlIG92ZXIgdHJ1ZSBpZiBmYWxzZSwgbXVzdCBiZSBlcXVhbCBpZiB1bmRlZmluZWRcbiAgICogICAgICAgIGNvbmZpZy5yZXNvbHZlTWF4IHVzZXMgbWF4IG92ZXIgbWluIGlmIHRydWUsIG1pbiBvdmVyIG1heCBpZiBmYWxzZSwgbXVzdCBiZSBlcXVhbCBpZiB1bmRlZmluZWRcbiAgICogQHBhcmFtIFtlcnJNc2ddIGlzIHRoZSBlcnJvciBtZXNzYWdlIHRvIHRocm93IGlmIHRoZSB2YWx1ZXMgY2Fubm90IGJlIHJlY29uY2lsZWQgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHRoZSByZWNvbmNpbGVkIHZhbHVlIGlmIHJlY29uY2lsYWJsZSwgdGhyb3dzIGVycm9yIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIHJlY29uY2lsZSh2YWwxLCB2YWwyLCBjb25maWc/LCBlcnJNc2c/KSB7XG4gICAgXG4gICAgLy8gY2hlY2sgZm9yIGVxdWFsaXR5XG4gICAgaWYgKHZhbDEgPT09IHZhbDIpIHJldHVybiB2YWwxO1xuICAgIFxuICAgIC8vIGNoZWNrIGZvciBiaWdpbnQgZXF1YWxpdHlcbiAgICBsZXQgY29tcGFyaXNvbjsgLy8gc2F2ZSBjb21wYXJpc29uIGZvciBsYXRlciBpZiBhcHBsaWNhYmxlXG4gICAgaWYgKHR5cGVvZiB2YWwxID09PSBcImJpZ2ludFwiICYmIHR5cGVvZiB2YWwyID09PSBcImJpZ2ludFwiKSB7XG4gICAgICBpZiAodmFsMSA9PT0gdmFsMikgcmV0dXJuIHZhbDE7XG4gICAgfVxuICAgIFxuICAgIC8vIHJlc29sdmUgb25lIHZhbHVlIGRlZmluZWRcbiAgICBpZiAodmFsMSA9PT0gdW5kZWZpbmVkIHx8IHZhbDIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKGNvbmZpZyAmJiBjb25maWcucmVzb2x2ZURlZmluZWQgPT09IGZhbHNlKSByZXR1cm4gdW5kZWZpbmVkOyAgLy8gdXNlIHVuZGVmaW5lZFxuICAgICAgZWxzZSByZXR1cm4gdmFsMSA9PT0gdW5kZWZpbmVkID8gdmFsMiA6IHZhbDE7ICAvLyB1c2UgZGVmaW5lZCB2YWx1ZVxuICAgIH1cbiAgICBcbiAgICAvLyByZXNvbHZlIGRpZmZlcmVudCBib29sZWFuc1xuICAgIGlmIChjb25maWcgJiYgY29uZmlnLnJlc29sdmVUcnVlICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIHZhbDEgPT09IFwiYm9vbGVhblwiICYmIHR5cGVvZiB2YWwyID09PSBcImJvb2xlYW5cIikge1xuICAgICAgYXNzZXJ0LmVxdWFsKHR5cGVvZiBjb25maWcucmVzb2x2ZVRydWUsIFwiYm9vbGVhblwiKTtcbiAgICAgIHJldHVybiBjb25maWcucmVzb2x2ZVRydWU7XG4gICAgfVxuICAgIFxuICAgIC8vIHJlc29sdmUgZGlmZmVyZW50IG51bWJlcnNcbiAgICBpZiAoY29uZmlnICYmIGNvbmZpZy5yZXNvbHZlTWF4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGFzc2VydC5lcXVhbCh0eXBlb2YgY29uZmlnLnJlc29sdmVNYXgsIFwiYm9vbGVhblwiKTtcbiAgICAgIFxuICAgICAgLy8gcmVzb2x2ZSBqcyBudW1iZXJzXG4gICAgICBpZiAodHlwZW9mIHZhbDEgPT09IFwibnVtYmVyXCIgJiYgdHlwZW9mIHZhbDIgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5yZXNvbHZlTWF4ID8gTWF0aC5tYXgodmFsMSwgdmFsMikgOiBNYXRoLm1pbih2YWwxLCB2YWwyKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gcmVzb2x2ZSBiaWdpbnRzXG4gICAgICBpZiAodHlwZW9mIHZhbDEgPT09IFwiYmlnaW50XCIgJiYgdHlwZW9mIHZhbDIgPT09IFwiYmlnaW50XCIpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5yZXNvbHZlTWF4ID8gKGNvbXBhcmlzb24gPCAwID8gdmFsMiA6IHZhbDEpIDogKGNvbXBhcmlzb24gPCAwID8gdmFsMSA6IHZhbDIpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBhc3NlcnQgZGVlcCBlcXVhbGl0eVxuICAgIGFzc2VydC5kZWVwRXF1YWwodmFsMSwgdmFsMiwgZXJyTXNnID8gZXJyTXNnIDogXCJDYW5ub3QgcmVjb25jaWxlIHZhbHVlcyBcIiArIHZhbDEgKyBcIiBhbmQgXCIgKyB2YWwyICsgXCIgd2l0aCBjb25maWc6IFwiICsgSlNPTi5zdHJpbmdpZnkoY29uZmlnKSk7XG4gICAgcmV0dXJuIHZhbDE7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgaHVtYW4tZnJpZW5kbHkga2V5IHZhbHVlIGxpbmUuXG4gICAqIFxuICAgKiBAcGFyYW0ga2V5IGlzIHRoZSBrZXlcbiAgICogQHBhcmFtIHZhbHVlIGlzIHRoZSB2YWx1ZVxuICAgKiBAcGFyYW0gaW5kZW50IGluZGVudHMgdGhlIGxpbmVcbiAgICogQHBhcmFtIG5ld2xpbmUgc3BlY2lmaWVzIGlmIHRoZSBzdHJpbmcgc2hvdWxkIGJlIHRlcm1pbmF0ZWQgd2l0aCBhIG5ld2xpbmUgb3Igbm90XG4gICAqIEBwYXJhbSBpZ25vcmVVbmRlZmluZWQgc3BlY2lmaWVzIGlmIHVuZGVmaW5lZCB2YWx1ZXMgc2hvdWxkIHJldHVybiBhbiBlbXB0eSBzdHJpbmdcbiAgICogQHJldHVybiB7c3RyaW5nfSBpcyB0aGUgaHVtYW4tZnJpZW5kbHkga2V5IHZhbHVlIGxpbmVcbiAgICovXG4gIHN0YXRpYyBrdkxpbmUoa2V5LCB2YWx1ZSwgaW5kZW50ID0gMCwgbmV3bGluZSA9IHRydWUsIGlnbm9yZVVuZGVmaW5lZCA9IHRydWUpIHtcbiAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCAmJiBpZ25vcmVVbmRlZmluZWQpIHJldHVybiBcIlwiO1xuICAgIHJldHVybiBHZW5VdGlscy5nZXRJbmRlbnQoaW5kZW50KSArIGtleSArIFwiOiBcIiArIHZhbHVlICsgKG5ld2xpbmUgPyAnXFxuJyA6IFwiXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogUmVwbGFjZSBiaWcgaW50ZWdlcnMgKDE2IG9yIG1vcmUgY29uc2VjdXRpdmUgZGlnaXRzKSB3aXRoIHN0cmluZ3MgaW4gb3JkZXJcbiAgICogdG8gcHJlc2VydmUgbnVtZXJpYyBwcmVjaXNpb24uXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gc3RyIGlzIHRoZSBzdHJpbmcgdG8gYmUgbW9kaWZpZWRcbiAgICogQHJldHVybiB7c3RyaW5nfSB0aGUgbW9kaWZpZWQgc3RyaW5nIHdpdGggYmlnIG51bWJlcnMgY29udmVydGVkIHRvIHN0cmluZ3NcbiAgICovXG4gIHN0YXRpYyBzdHJpbmdpZnlCaWdJbnRzKHN0cikge1xuICAgIHJldHVybiBzdHIucmVwbGFjZSgvKFwiW15cIl0qXCJcXHMqOlxccyopKFxcZHsxNix9KS9nLCAnJDFcIiQyXCInKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFByaW50IHRoZSBjdXJyZW50IHN0YWNrIHRyYWNlLiBcbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtc2cgLSBvcHRpb25hbCBtZXNzYWdlIHRvIHByaW50IHdpdGggdGhlIHRyYWNlXG4gICAqL1xuICBzdGF0aWMgcHJpbnRTdGFja1RyYWNlKG1zZykge1xuICAgIHRyeSB7IHRocm93IG5ldyBFcnJvcihtc2cpOyB9XG4gICAgY2F0Y2ggKGVycjogYW55KSB7IGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrKTsgfVxuICB9XG4gIFxuICAvKipcbiAgICogV2FpdCBmb3IgdGhlIGR1cmF0aW9uLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uTXMgLSB0aGUgZHVyYXRpb24gdG8gd2FpdCBmb3IgaW4gbWlsbGlzZWNvbmRzXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgd2FpdEZvcihkdXJhdGlvbk1zKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUpIHsgc2V0VGltZW91dChyZXNvbHZlLCBkdXJhdGlvbk1zKTsgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBLaWxsIHRoZSBnaXZlbiBub2RlanMgY2hpbGQgcHJvY2Vzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7Q2hpbGRQcm9jZXNzfSBwcm9jZXNzIC0gdGhlIG5vZGVqcyBjaGlsZCBwcm9jZXNzIHRvIGtpbGxcbiAgICogQHBhcmFtIHtudW1iZXIgfCBOb2RlSlMuU2lnbmFsc30gW3NpZ25hbF0gLSB0aGUga2lsbCBzaWduYWwsIGUuZy4gU0lHVEVSTSwgU0lHS0lMTCwgU0lHSU5UIChkZWZhdWx0KVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlciB8IHVuZGVmaW5lZD59IHRoZSBleGl0IGNvZGUgZnJvbSBraWxsaW5nIHRoZSBwcm9jZXNzXG4gICAqL1xuICBzdGF0aWMgYXN5bmMga2lsbFByb2Nlc3MocHJvY2VzczogQ2hpbGRQcm9jZXNzLCBzaWduYWw/OiBudW1iZXIgfCBOb2RlSlMuU2lnbmFscyk6IFByb21pc2U8bnVtYmVyIHwgdW5kZWZpbmVkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHByb2Nlc3Mub24oXCJleGl0XCIsIGZ1bmN0aW9uKGNvZGUsIHNpZ25hbCkgeyByZXNvbHZlKGNvZGUpOyB9KTtcbiAgICAgIHByb2Nlc3Mub24oXCJlcnJvclwiLCBmdW5jdGlvbihlcnIpIHsgcmVqZWN0KGVycik7IH0pO1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKCFwcm9jZXNzLmtpbGwoc2lnbmFsID09PSB1bmRlZmluZWQgPyBcIlNJR0lOVFwiIDogc2lnbmFsKSkgcmVzb2x2ZSh1bmRlZmluZWQpOyAvLyByZXNvbHZlIGltbWVkaWF0ZWx5IGlmIG5vdCBydW5uaW5nXG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTm9ybWFsaXplIGEgVVJJLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVyaSAtIHRoZSBVUkkgdG8gbm9ybWFsaXplXG4gICAqIEByZXR1cm4ge3N0cmluZ30gdGhlIG5vcm1hbGl6ZWQgVVJJXG4gICAqL1xuICBzdGF0aWMgbm9ybWFsaXplVXJpKHVyaSkge1xuICAgIGlmICghdXJpKSB0aHJvdyBFcnJvcihcIk11c3QgcHJvdmlkZSBVUkkgdG8gbm9ybWFsaXplXCIpO1xuICAgIHVyaSA9IHVyaS5yZXBsYWNlKC9cXC8kLywgXCJcIik7IC8vIHN0cmlwIHRyYWlsaW5nIHNsYXNoXG4gICAgaWYgKCFuZXcgUmVnRXhwKFwiXlxcXFx3KzovLy4rXCIpLnRlc3QodXJpKSkgdXJpPSBcImh0dHA6Ly9cIiArIHVyaTsgLy8gYXNzdW1lIGh0dHAgaWYgcHJvdG9jb2wgbm90IGdpdmVuXG4gICAgcmV0dXJuIHVyaTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdHdvIHByb3h5IFVSSXMgcmVmZXIgdG8gdGhlIHNhbWUgaG9zdCBhbmQgcG9ydCwgcmVnYXJkbGVzcyBvZiBzY2hlbWUuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1cmkxIC0gZmlyc3QgcHJveHkgVVJJIHRvIGNvbXBhcmVcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVyaTIgLSBzZWNvbmQgcHJveHkgVVJJIHRvIGNvbXBhcmVcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgcHJveHkgVVJJcyByZWZlciB0byB0aGUgc2FtZSBob3N0IGFuZCBwb3J0XG4gICAqL1xuICBzdGF0aWMgaXNTYW1lUHJveHlVcmkodXJpMSwgdXJpMikge1xuICAgIGlmICghdXJpMSB8fCAhdXJpMikgcmV0dXJuICF1cmkxID09PSAhdXJpMjtcbiAgICBpZiAodXJpMSA9PT0gdXJpMikgcmV0dXJuIHRydWU7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHBhcnNlZDEgPSBuZXcgVVJMKEdlblV0aWxzLm5vcm1hbGl6ZVVyaSh1cmkxKSk7XG4gICAgICBjb25zdCBwYXJzZWQyID0gbmV3IFVSTChHZW5VdGlscy5ub3JtYWxpemVVcmkodXJpMikpO1xuICAgICAgcmV0dXJuIHBhcnNlZDEuaG9zdG5hbWUudG9Mb3dlckNhc2UoKSA9PT0gcGFyc2VkMi5ob3N0bmFtZS50b0xvd2VyQ2FzZSgpICYmIHBhcnNlZDEucG9ydCA9PT0gcGFyc2VkMi5wb3J0O1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGFic29sdXRlIHZhbHVlIG9mIHRoZSBnaXZlbiBiaWdpbnQgb3IgbnVtYmVyLlxuICAgKiBcbiAgICogQHBhcmFtIHtiaWdpbnQgfCBudW1iZXJ9IGJpIC0gdGhlIGJpZ2ludCBvciBudW1iZXIgdG8gZ2V0IHRoZSBhYnNvbHV0ZSB2YWx1ZSBvZlxuICAgKiBAcmV0dXJuIHtiaWdpbnQgfCBudW1iZXJ9IHRoZSBhYnNvbHV0ZSB2YWx1ZSBvZiB0aGUgZ2l2ZW4gYmlnaW50IG9yIG51bWJlclxuICAgKi9cbiAgc3RhdGljIGFicyhiaTogYmlnaW50IHwgbnVtYmVyKTogYmlnaW50IHwgbnVtYmVyIHtcbiAgICByZXR1cm4gYmkgPCAwID8gLWJpIDogYmk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGFuIGVudW0ga2V5IG5hbWUgYnkgdmFsdWUuXG4gICAqIFxuICAgKiBAcGFyYW0ge2FueX0gZW51bVR5cGUgaXMgdGhlIGVudW0gdHlwZSB0byBnZXQgdGhlIGtleSBmcm9tXG4gICAqIEBwYXJhbSB7YW55fSBlbnVtVmFsdWUgaXMgdGhlIGVudW0gdmFsdWUgdG8gZ2V0IHRoZSBrZXkgZm9yXG4gICAqIEByZXR1cm4ge3N0cmluZyB8IHVuZGVmaW5lZH0gdGhlIGVudW0ga2V5IG5hbWVcbiAgICovXG4gIHN0YXRpYyBnZXRFbnVtS2V5QnlWYWx1ZShlbnVtVHlwZTogYW55LCBlbnVtVmFsdWU6IGFueSk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgZm9yIChsZXQga2V5IGluIGVudW1UeXBlKSB7XG4gICAgICBpZiAoZW51bVR5cGVba2V5XSA9PT0gZW51bVZhbHVlKSByZXR1cm4ga2V5O1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc29sdmUgdGhlIGdpdmVuIHByb21pc2Ugd2l0aCBhIHRpbWVvdXQuXG4gICAqIFxuICAgKiBAcGFyYW0gcHJvbWlzZSB0aGUgcHJvbWlzZSB0byByZXNvbHZlIHdpdGhpbiB0aGUgdGltZW91dFxuICAgKiBAcGFyYW0gdGltZW91dE1zIHRoZSB0aW1lb3V0IGluIG1pbGxpc2Vjb25kcyB0byByZXNvbHZlIHRoZSBwcm9taXNlXG4gICAqIEByZXR1cm4gdGhlIHJlc3VsdCBvZiB0aGUgcHJvbWlzZSB1bmxlc3MgZXJyb3IgdGhyb3duXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgZXhlY3V0ZVdpdGhUaW1lb3V0KHByb21pc2UsIHRpbWVvdXRNcyk6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICByZWplY3QoJ0V4ZWN1dGlvbiB0aW1lZCBvdXQgaW4gJyArIHRpbWVvdXRNcyArICcgbWlsbGlzZWNvbmRzJylcbiAgICAgIH0sIHRpbWVvdXRNcyk7XG4gICAgICBwcm9taXNlLnRoZW4oXG4gICAgICAgIChyZXN1bHQpID0+IHtcbiAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgIH0sXG4gICAgICAgIChlcnJvcikgPT4ge1xuICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgfSk7XG4gIH1cbn1cblxuIl0sIm1hcHBpbmdzIjoieUxBQUEsSUFBQUEsT0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMsTUFBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBOzs7OztBQUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDZSxNQUFNRSxRQUFRLENBQUM7O0VBRTVCO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE9BQU9DLFNBQVNBLENBQUNDLEdBQVEsRUFBVztJQUNsQyxPQUFPLE9BQU9BLEdBQUcsS0FBSyxXQUFXO0VBQ25DOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE9BQU9DLFdBQVdBLENBQUNELEdBQUcsRUFBVztJQUMvQixPQUFPLE9BQU9BLEdBQUcsS0FBSyxXQUFXO0VBQ25DOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE9B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