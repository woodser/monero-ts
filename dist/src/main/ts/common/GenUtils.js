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
    let isBrowserMain = typeof window !== 'undefined' && globalThis === window;
    let isJsDom = isBrowserMain ? typeof navigator !== 'undefined' && navigator.userAgent.includes('jsdom') : false;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfYXN5bmMiLCJHZW5VdGlscyIsImlzRGVmaW5lZCIsImFyZyIsImlzVW5kZWZpbmVkIiwiaXNJbml0aWFsaXplZCIsInVuZGVmaW5lZCIsImlzVW5pbml0aWFsaXplZCIsImlzTnVtYmVyIiwiaXNOYU4iLCJwYXJzZUZsb2F0IiwiaXNGaW5pdGUiLCJpc0ludCIsInBhcnNlSW50IiwiTnVtYmVyIiwiaXNBcnJheSIsIkFycmF5IiwiaXNTdHJpbmciLCJpc0Jvb2xlYW4iLCJpc0Z1bmN0aW9uIiwiaXNPYmplY3QiLCJvYmoiLCJpc1VwcGVyQ2FzZSIsInN0ciIsInRvVXBwZXJDYXNlIiwiaXNMb3dlckNhc2UiLCJ0b0xvd2VyQ2FzZSIsImFzc2VydEhleCIsIm1zZyIsImFzc2VydFRydWUiLCJpc0hleCIsImxlbmd0aCIsIm1hdGNoIiwiaXNCYXNlMzIiLCJ0ZXN0IiwiYXNzZXJ0QmFzZTU4IiwiaXNCYXNlNTgiLCJhc3NlcnRCYXNlNjQiLCJpc0Jhc2U2NCIsImJ0b2EiLCJhdG9iIiwiZXJyIiwiZmFpbCIsIkVycm9yIiwiY29uZGl0aW9uIiwiYXNzZXJ0RmFsc2UiLCJib29sIiwiYXNzZXJ0TnVsbCIsImFzc2VydE5vdE51bGwiLCJhc3NlcnREZWZpbmVkIiwiYXNzZXJ0VW5kZWZpbmVkIiwiYXNzZXJ0SW5pdGlhbGl6ZWQiLCJhc3NlcnRVbmluaXRpYWxpemVkIiwiYXNzZXJ0RXF1YWxzIiwiYXJnMSIsImFyZzIiLCJlcXVhbHMiLCJhc3NlcnROb3RFcXVhbHMiLCJhc3NlcnRJbnQiLCJhc3NlcnROdW1iZXIiLCJhc3NlcnRCb29sZWFuIiwiYXNzZXJ0U3RyaW5nIiwiYXNzZXJ0QXJyYXkiLCJhc3NlcnRGdW5jdGlvbiIsImFzc2VydE9iamVjdCIsIm5hbWUiLCJpbmhlcml0c0Zyb20iLCJjaGlsZCIsInBhcmVudCIsInByb3RvdHlwZSIsIk9iamVjdCIsImNyZWF0ZSIsImNvbnN0cnVjdG9yIiwiaW52b2tlIiwiZm5zIiwiYXJndW1lbnRzIiwiYXJncyIsImkiLCJwdXNoIiwiYXBwbHkiLCJnZXRQb3dlclNldCIsImFyciIsImZuIiwibiIsInNyYyIsImdvdCIsImFsbCIsImoiLCJzbGljZSIsImNvbmNhdCIsImdldFBvd2VyU2V0T2ZMZW5ndGgiLCJzaXplIiwicG93ZXJTZXQiLCJwb3dlclNldE9mTGVuZ3RoIiwiZ2V0SW5kaWNlcyIsImluZGljZXMiLCJ0b1VuaXF1ZUFycmF5IiwiZmlsdGVyIiwidmFsdWUiLCJpbmRleCIsInNlbGYiLCJpbmRleE9mIiwiY29weUFycmF5IiwiY29weSIsInJlbW92ZSIsInZhbCIsImZvdW5kIiwic3BsaWNlIiwidG9Mb3dlckNhc2VBcnJheSIsImFycjIiLCJsaXN0aWZ5IiwiYXJyT3JFbGVtIiwiYXJyYXlDb250YWlucyIsImNvbXBhcmVCeVJlZmVyZW5jZSIsInN0ckNvbnRhaW5zIiwic3Vic3RyaW5nIiwiYXJyYXlzRXF1YWwiLCJhcnIxIiwib2JqZWN0c0VxdWFsIiwibWFwMSIsIm1hcDIiLCJrZXlzMSIsImtleXMiLCJrZXlzMiIsImtleTEiLCJrZXkyIiwiZGVsZXRlVW5kZWZpbmVkS2V5cyIsImtleSIsImdldENvbWJpbmF0aW9ucyIsImNvbWJpbmF0aW9uU2l6ZSIsImluZGV4Q29tYmluYXRpb25zIiwiY29tYmluYXRpb25zIiwiaW5kZXhDb21iaW5hdGlvbnNJZHgiLCJpbmRleENvbWJpbmF0aW9uIiwiY29tYmluYXRpb24iLCJpbmRleENvbWJpbmF0aW9uSWR4IiwiZ2V0RG93bmxvYWRhYmxlQSIsImNvbnRlbnRzIiwiYSIsIndpbmRvdyIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImhyZWYiLCJVUkwiLCJjcmVhdGVPYmplY3RVUkwiLCJCbG9iIiwidHlwZSIsImRvd25sb2FkIiwidGFyZ2V0IiwiaW5uZXJIVE1MIiwiY29weVByb3BlcnRpZXMiLCJKU09OIiwicGFyc2UiLCJzdHJpbmdpZnkiLCJkZWxldGVQcm9wZXJ0aWVzIiwicHJvcHMiLCJwcm9wIiwidG9TdHJpbmciLCJoYXNXaGl0ZXNwYWNlIiwiaXNXaGl0ZXNwYWNlIiwiY2hhciIsImlzTmV3bGluZSIsImNvdW50Tm9uV2hpdGVzcGFjZUNoYXJhY3RlcnMiLCJjb3VudCIsImNoYXJBdCIsImdldFdoaXRlc3BhY2VUb2tlbnMiLCJnZXRMaW5lcyIsImdldEludGVybmFsU3R5bGVTaGVldCIsInN0eWxlU2hlZXRzIiwic3R5bGVTaGVldCIsImdldEludGVybmFsU3R5bGVTaGVldFRleHQiLCJpbnRlcm5hbENzcyIsImludGVybmFsU3R5bGVTaGVldCIsImNzc1J1bGVzIiwiY3NzVGV4dCIsImJ1aWxkSHRtbERvY3VtZW50IiwiY29udGVudCIsIm1ldGFzIiwibWV0YSIsImVsZW0iLCJoYXNPd25Qcm9wZXJ0eSIsInNldEF0dHJpYnV0ZSIsIm91dGVySFRNTCIsInRpdGxlIiwiZGVwZW5kZW5jeVBhdGhzIiwiZGVwZW5kZW5jeVBhdGgiLCJlbmRzV2l0aCIsImRpdiIsIiQiLCJhcHBlbmQiLCJjbG9uZSIsImh0bWwiLCJuZXdXaW5kb3ciLCJvbkxvYWQiLCJvbkxvYWRDYWxsZWQiLCJ3Iiwib3BlbiIsIm9uTG9hZE9uY2UiLCJvcGVuZXIiLCJ3cml0ZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJjbG9zZSIsImltZ1RvRGF0YVVybCIsImltZyIsInF1YWxpdHkiLCJjYW52YXMiLCJoZWlnaHQiLCJuYXR1cmFsSGVpZ2h0Iiwid2lkdGgiLCJuYXR1cmFsV2lkdGgiLCJjb250ZXh0IiwiZ2V0Q29udGV4dCIsImRyYXdJbWFnZSIsInRvRGF0YVVSTCIsImlzSW1hZ2VBY2Nlc3NpYmxlIiwidXJsIiwidGltZW91dCIsIm9uRG9uZSIsInJldHVybmVkIiwiSW1hZ2UiLCJvbmxvYWQiLCJvblJlc3BvbnNlIiwib25lcnJvciIsIkRhdGUiLCJzZXRUaW1lb3V0Iiwic2V0SW1tZWRpYXRlIiwiZSIsImlzWmlwRmlsZSIsImZpbGUiLCJpc0pzb25GaWxlIiwiaXNUeHRGaWxlIiwiZ2V0SW1hZ2VzIiwicGF0aHMiLCJmdW5jcyIsImxvYWRGdW5jIiwiYXN5bmMiLCJwYXJhbGxlbCIsInBhdGgiLCJnZXRJbmRlbnQiLCJpbml0UG9seWZpbGxzIiwiYXNzaWduIiwiZGVmaW5lUHJvcGVydHkiLCJ2YXJBcmdzIiwiVHlwZUVycm9yIiwidG8iLCJuZXh0U291cmNlIiwibmV4dEtleSIsImNhbGwiLCJ3cml0YWJsZSIsImNvbmZpZ3VyYWJsZSIsIlN0cmluZyIsInN0YXJ0c1dpdGgiLCJzZWFyY2hTdHJpbmciLCJwb3NpdGlvbiIsInN1YnN0ciIsImdldFVVSUQiLCJyZXBsYWNlIiwiYyIsInIiLCJNYXRoIiwicmFuZG9tIiwidiIsImlzQnJvd3NlciIsImlzV29ya2VyIiwiaW1wb3J0U2NyaXB0cyIsImlzQnJvd3Nlck1haW4iLCJnbG9iYWxUaGlzIiwiaXNKc0RvbSIsIm5hdmlnYXRvciIsInVzZXJBZ2VudCIsImluY2x1ZGVzIiwiaXNEZW5vIiwiRGVubyIsInZlcnNpb24iLCJkZW5vIiwiaXNGaXJlZm94IiwiZ2V0SUVWZXJzaW9uIiwidWEiLCJtc2llIiwidHJpZGVudCIsInJ2IiwiZWRnZSIsImdldFBhcmFtZXRlckJ5TmFtZSIsImxvY2F0aW9uIiwicmVnZXgiLCJSZWdFeHAiLCJyZXN1bHRzIiwiZXhlYyIsImRlY29kZVVSSUNvbXBvbmVudCIsImdldFJhbmRvbUludCIsIm1pbiIsIm1heCIsImNlaWwiLCJmbG9vciIsImdldFJhbmRvbUludHMiLCJpbnRzIiwiZ2V0VW5pcXVlUmFuZG9tSW50cyIsInJhbmRvbUludCIsInNodWZmbGUiLCJhcnJheSIsInRlbXAiLCJzb3J0IiwiYiIsInNhZmVTZXQiLCJnZXRGbiIsInNldEZuIiwiY29uZmlnIiwiZXJyTXNnIiwiY3VyVmFsIiwicmVjb25jaWxlZFZhbCIsInJlY29uY2lsZSIsInZhbDEiLCJ2YWwyIiwiY29tcGFyaXNvbiIsInJlc29sdmVEZWZpbmVkIiwicmVzb2x2ZVRydWUiLCJhc3NlcnQiLCJlcXVhbCIsInJlc29sdmVNYXgiLCJkZWVwRXF1YWwiLCJrdkxpbmUiLCJpbmRlbnQiLCJuZXdsaW5lIiwiaWdub3JlVW5kZWZpbmVkIiwic3RyaW5naWZ5QmlnSW50cyIsInByaW50U3RhY2tUcmFjZSIsImNvbnNvbGUiLCJlcnJvciIsInN0YWNrIiwid2FpdEZvciIsImR1cmF0aW9uTXMiLCJQcm9taXNlIiwicmVzb2x2ZSIsImtpbGxQcm9jZXNzIiwicHJvY2VzcyIsInNpZ25hbCIsInJlamVjdCIsIm9uIiwiY29kZSIsImtpbGwiLCJub3JtYWxpemVVcmkiLCJ1cmkiLCJpc1NhbWVQcm94eVVyaSIsInVyaTEiLCJ1cmkyIiwicGFyc2VkMSIsInBhcnNlZDIiLCJob3N0bmFtZSIsInBvcnQiLCJhYnMiLCJiaSIsImdldEVudW1LZXlCeVZhbHVlIiwiZW51bVR5cGUiLCJlbnVtVmFsdWUiLCJleGVjdXRlV2l0aFRpbWVvdXQiLCJwcm9taXNlIiwidGltZW91dE1zIiwidGltZW91dElkIiwidGhlbiIsInJlc3VsdCIsImNsZWFyVGltZW91dCIsImV4cG9ydHMiLCJkZWZhdWx0Il0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvY29tbW9uL0dlblV0aWxzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IGFzeW5jIGZyb20gXCJhc3luY1wiO1xuaW1wb3J0IHsgQ2hpbGRQcm9jZXNzIH0gZnJvbSBcImNoaWxkX3Byb2Nlc3NcIjtcblxuZGVjbGFyZSB2YXIgRGVubzogYW55O1xuXG4vKipcbiAqIE1JVCBMaWNlbnNlXG4gKiBcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqIFxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICogXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG4gKiBTT0ZUV0FSRS5cbiAqL1xuXG4vKipcbiAqIENvbGxlY3Rpb24gb2YgZ2VuZXJhbCBwdXJwb3NlIHV0aWxpdGllcy5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR2VuVXRpbHMge1xuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgZGVmaW5lZC5cbiAgICogXG4gICAqIEBwYXJhbSB7YW55fSBhcmcgaXMgdGhlIGFyZyB0byB0ZXN0XG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGdpdmVuIGFyZyBpcyBkZWZpbmVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc0RlZmluZWQoYXJnOiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdHlwZW9mIGFyZyAhPT0gJ3VuZGVmaW5lZCc7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBnaXZlbiBhcmd1bWVudCBpcyB1bmRlZmluZWQuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnIGlzIHRoZSBhcmcgdG8gdGVzdFxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBnaXZlbiBhcmcgaXMgdW5kZWZpbmVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc1VuZGVmaW5lZChhcmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBnaXZlbiBhcmcgaXMgaW5pdGlhbGl6ZWQuXG4gICAqIFxuICAgKiBAcGFyYW0ge2FueX0gYXJnIGlzIHRoZSBhcmcgdG8gdGVzdFxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBnaXZlbiBhcmcgaXMgaW5pdGlhbGl6ZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGlzSW5pdGlhbGl6ZWQoYXJnOiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gYXJnICE9PSB1bmRlZmluZWQgJiYgYXJnICE9PSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZ2l2ZW4gYXJnIGlzIHVuaW5pdGlhbGl6ZWQuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnIGlzIHRoZSBhcmcgdG8gdGVzdFxuICAgKiBAcmV0dXJuIHRydWUgaWYgdGhlIGdpdmVuIGFyZyBpcyB1bmluaXRpYWxpemVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc1VuaW5pdGlhbGl6ZWQoYXJnOiBhbnkpOiBib29sZWFuIHtcbiAgICBpZiAoIWFyZykgcmV0dXJuIHRydWU7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYSBudW1iZXIuXG4gICAqIFxuICAgKiBAcGFyYW0ge2FueX0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byB0ZXN0XG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGFyZ3VtZW50IGlzIGEgbnVtYmVyLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc051bWJlcihhcmc6IGFueSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhaXNOYU4ocGFyc2VGbG9hdChhcmcpKSAmJiBpc0Zpbml0ZShhcmcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYW4gaW50ZWdlci5cbiAgICogXG4gICAqIEBwYXJhbSB7YW55fSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIHRlc3RcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYW4gaW50ZWdlciwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaXNJbnQoYXJnOiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gYXJnID09PSBwYXJzZUludChcIlwiICsgTnVtYmVyKGFyZykpICYmICFpc05hTihhcmcpICYmICFpc05hTihwYXJzZUludChhcmcsIDEwKSk7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhbiBhcnJheS5cbiAgICogXG4gICAqIEBwYXJhbSB7YW55fSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIHRlc3QgYXMgYmVpbmcgYW4gYXJyYXlcbiAgICogQHJldHVybiB7Ym9vb2xlYW59IHRydWUgaWYgdGhlIGFyZ3VtZW50IGlzIGFuIGFycmF5LCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc0FycmF5KGFyZzogYW55KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGFyZyBpbnN0YW5jZW9mIEFycmF5ICYmIEFycmF5LmlzQXJyYXkoYXJnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGEgc3RyaW5nLlxuICAgKiBcbiAgICogQHBhcmFtIHthbnl9IGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gdGVzdCBhcyBiZWluZyBhIHN0cmluZ1xuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBhcmd1bWVudCBpcyBhIHN0cmluZywgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaXNTdHJpbmcoYXJnOiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyBpZiB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYSBib29sZWFuLlxuICAgKiBcbiAgICogQHBhcmFtIHthbnl9IGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gdGVzdCBhcyBiZWluZyBhIGJvb2xlYW5cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgYXJndW1lbnQgaXMgYSBib29sZWFuLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc0Jvb2xlYW4oYXJnOiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdHlwZW9mKGFyZykgPT0gdHlwZW9mKHRydWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGEgc3RhdGljLlxuICAgKiBcbiAgICogQHBhcmFtIHthbnl9IGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gdGVzdCBhcyBiZWluZyBhIHN0YXRpY1xuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBhcmd1bWVudCBpcyBhIHN0YXRpYywgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaXNGdW5jdGlvbihhcmc6IGFueSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0eXBlb2YgYXJnID09PSBcImZ1bmN0aW9uXCI7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhbiBvYmplY3QgYW5kIG9wdGlvbmFsbHkgaWYgaXQgaGFzIHRoZSBnaXZlbiBjb25zdHJ1Y3RvciBuYW1lLlxuICAgKiBcbiAgICogQHBhcmFtIHthbnl9IGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gdGVzdFxuICAgKiBAcGFyYW0ge2FueX0gb2JqIGlzIGFuIG9iamVjdCB0byB0ZXN0IGFyZyBpbnN0YW5jZW9mIG9iaiAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGFuIG9iamVjdCBhbmQgb3B0aW9uYWxseSBoYXMgdGhlIGdpdmVuIGNvbnN0cnVjdG9yIG5hbWVcbiAgICovXG4gIHN0YXRpYyBpc09iamVjdChhcmc6IGFueSwgb2JqPzogYW55KTogYm9vbGVhbiB7XG4gICAgaWYgKCFhcmcpIHJldHVybiBmYWxzZTtcbiAgICBpZiAodHlwZW9mIGFyZyAhPT0gJ29iamVjdCcpIHJldHVybiBmYWxzZTtcbiAgICBpZiAob2JqICYmICEoYXJnIGluc3RhbmNlb2Ygb2JqKSkgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgYWxsIGFscGhhYmV0IGNoYXJhY3RlcnMgaW4gdGhlIGdpdmVuIHN0cmluZyBhcmUgdXBwZXIgY2FzZS5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzdHIgaXMgdGhlIHN0cmluZyB0byB0ZXN0XG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIHN0cmluZyBpcyB1cHBlciBjYXNlLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc1VwcGVyQ2FzZShzdHI6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBzdHIudG9VcHBlckNhc2UoKSA9PT0gc3RyO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgYWxsIGFscGhhYmV0IGNoYXJhY3RlcnMgaW4gdGhlIGdpdmVuIHN0cmluZyBhcmUgbG93ZXIgY2FzZS5cbiAgICogXG4gICAqIEBwYXJhbSBzdHIgaXMgdGhlIHN0cmluZyB0byB0ZXN0XG4gICAqIEBwYXJhbSB0cnVlIGlmIHRoZSBzdHJpbmcgaXMgbG93ZXIgY2FzZSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaXNMb3dlckNhc2Uoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci50b0xvd2VyQ2FzZSgpID09PSBzdHI7XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBhcmd1bWVudCBpcyBoZXguXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byBhc3NlcnQgYXMgaGV4XG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgdGhlIGFyZ3VtZW50IGlzIG5vdCBoZXhcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRIZXgoc3RyLCBtc2cpIHtcbiAgICBHZW5VdGlscy5hc3NlcnRUcnVlKEdlblV0aWxzLmlzSGV4KHN0ciksIG1zZyA/IG1zZyA6IFwiQXJndW1lbnQgYXNzZXJ0ZWQgYXMgaGV4IGJ1dCBpcyBub3QgaGV4XCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYSBoZXhpZGVtYWwgc3RyaW5nLlxuICAgKiBcbiAgICogQ3JlZGl0OiBodHRwczovL2dpdGh1Yi5jb20vcm9yeXJqYi9pcy1oZXgvYmxvYi9tYXN0ZXIvaXMtaGV4LmpzLlxuICAgKiBcbiAgICogQHBhcmFtIHN0ciBpcyB0aGUgc3RyaW5nIHRvIHRlc3RcbiAgICogQHJldHVybiB0cnVlIGlmIHRoZSBnaXZlbiBzdHJpbmcgaXMgaGV4aWRlY2ltYWwsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGlzSGV4KGFyZykge1xuICAgIGlmICh0eXBlb2YgYXJnICE9PSAnc3RyaW5nJykgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChhcmcubGVuZ3RoID09PSAwKSByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIChhcmcubWF0Y2goLyhbMC05XXxbYS1mXSkvZ2ltKSB8fCBbXSkubGVuZ3RoID09PSBhcmcubGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgdGhlIGdpdmVuIHN0cmluZyBpcyBiYXNlMzIuXG4gICAqL1xuICBzdGF0aWMgaXNCYXNlMzIoc3RyKSB7XG4gICAgaWYgKHR5cGVvZiBzdHIgIT09ICdzdHJpbmcnKSByZXR1cm4gZmFsc2U7XG4gICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZShzdHIubGVuZ3RoID4gMCwgXCJDYW5ub3QgZGV0ZXJtaW5lIGlmIGVtcHR5IHN0cmluZyBpcyBiYXNlMzJcIik7XG4gICAgcmV0dXJuIC9eW0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaMjM0NTY3XSskLy50ZXN0KHN0cik7XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBhcmd1bWVudCBpcyBiYXNlNTguXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byBhc3NlcnQgYXMgYmFzZTU4XG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgdGhlIGFyZ3VtZW50IGlzIG5vdCBiYXNlNThcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRCYXNlNTgoc3RyLCBtc2cpIHtcbiAgICBHZW5VdGlscy5hc3NlcnRUcnVlKEdlblV0aWxzLmlzQmFzZTU4KHN0ciksIG1zZyA/IG1zZyA6IFwiQXJndW1lbnQgYXNzZXJ0ZWQgYXMgYmFzZTU4IGJ1dCBpcyBub3QgYmFzZTU4XCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgdGhlIGdpdmVuIHN0cmluZyBpcyBiYXNlNTguXG4gICAqL1xuICBzdGF0aWMgaXNCYXNlNTgoc3RyKSB7XG4gICAgaWYgKHR5cGVvZiBzdHIgIT09ICdzdHJpbmcnKSByZXR1cm4gZmFsc2U7XG4gICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZShzdHIubGVuZ3RoID4gMCwgXCJDYW5ub3QgZGV0ZXJtaW5lIGlmIGVtcHR5IHN0cmluZyBpcyBiYXNlNThcIik7XG4gICAgcmV0dXJuIC9eWzEyMzQ1Njc4OUFCQ0RFRkdISktMTU5QUVJTVFVWV1hZWmFiY2RlZmdoaWprbW5vcHFyc3R1dnd4eXpdKyQvLnRlc3Qoc3RyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGJhc2U2NC5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIGFzc2VydCBhcyBiYXNlNjRcbiAgICogQHBhcmFtIG1zZyBpcyB0aGUgbWVzc2FnZSB0byB0aHJvdyBpZiB0aGUgYXJndW1lbnQgaXMgbm90IGJhc2U2NFxuICAgKi9cbiAgc3RhdGljIGFzc2VydEJhc2U2NChzdHIsIG1zZykge1xuICAgIEdlblV0aWxzLmFzc2VydFRydWUoR2VuVXRpbHMuaXNCYXNlNjQoc3RyKSwgbXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBiYXNlNjQgYnV0IGlzIG5vdCBiYXNlNjRcIik7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyBpZiB0aGUgZ2l2ZW4gc3RyaW5nIGlzIGJhc2U2NC5cbiAgICovXG4gIHN0YXRpYyBpc0Jhc2U2NChzdHIpIHtcbiAgICBpZiAodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHJldHVybiBmYWxzZTtcbiAgICBHZW5VdGlscy5hc3NlcnRUcnVlKHN0ci5sZW5ndGggPiAwLCBcIkNhbm5vdCBkZXRlcm1pbmUgaWYgZW1wdHkgc3RyaW5nIGlzIGJhc2U2NFwiKTtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGJ0b2EoYXRvYihzdHIpKSA9PSBzdHI7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRocm93cyBhbiBleGNlcHRpb24gd2l0aCB0aGUgZ2l2ZW4gbWVzc2FnZS5cbiAgICogXG4gICAqIEBwYXJhbSBtc2cgZGVmaW5lcyB0aGUgbWVzc2FnZSB0byB0aHJvdyB0aGUgZXhjZXB0aW9uIHdpdGggKG9wdGlvbmFsKVxuICAgKi9cbiAgc3RhdGljIGZhaWwobXNnPykge1xuICAgIHRocm93IG5ldyBFcnJvcihtc2cgPyBtc2cgOiBcIkZhaWx1cmUgKG5vIG1lc3NhZ2UpXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gY29uZGl0aW9uIGlzIHRydWUuICBUaHJvd3MgYW4gZXhjZXB0aW9uIGlmIG5vdCBhIGJvb2xlYW4gb3IgZmFsc2UuXG4gICAqIFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGNvbmRpdGlvbiBpcyB0aGUgYm9vbGVhbiB0byBhc3NlcnQgdHJ1ZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW21zZ10gaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgY29uZGl0aW9uIGlzIGZhbHNlIChvcHRpb25hbClcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRUcnVlKGNvbmRpdGlvbiwgbXNnPykge1xuICAgIGlmICh0eXBlb2YgY29uZGl0aW9uICE9PSAnYm9vbGVhbicpIHRocm93IG5ldyBFcnJvcihcIkFyZ3VtZW50IGlzIG5vdCBhIGJvb2xlYW5cIik7XG4gICAgaWYgKCFjb25kaXRpb24pIHRocm93IG5ldyBFcnJvcihtc2cgPyBtc2cgOiBcIkJvb2xlYW4gYXNzZXJ0ZWQgYXMgdHJ1ZSBidXQgd2FzIGZhbHNlXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYm9vbGVhbiBpcyBmYWxzZS4gIFRocm93cyBhbiBleGNlcHRpb24gaWYgbm90IGEgYm9vbGVhbiBvciB0cnVlLlxuICAgKiBcbiAgICogQHBhcmFtIGJvb2wgaXMgdGhlIGJvb2xlYW4gdG8gYXNzZXJ0IGZhbHNlXG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgYm9vbCBpcyB0cnVlIChvcHRpb25hbClcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRGYWxzZShib29sLCBtc2c/KSB7XG4gICAgaWYgKHR5cGVvZiBib29sICE9PSAnYm9vbGVhbicpIHRocm93IG5ldyBFcnJvcihcIkFyZ3VtZW50IGlzIG5vdCBhIGJvb2xlYW5cIik7XG4gICAgaWYgKGJvb2wpIHRocm93IG5ldyBFcnJvcihtc2cgPyBtc2cgOiBcIkJvb2xlYW4gYXNzZXJ0ZWQgYXMgZmFsc2UgYnV0IHdhcyB0cnVlXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgbnVsbC4gIFRocm93cyBhbiBleGNlcHRpb24gaWYgbm90IG51bGwuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byBhc3NlcnQgbnVsbFxuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIGFyZyBpcyBub3QgbnVsbCAob3B0aW9uYWwpXG4gICAqL1xuICBzdGF0aWMgYXNzZXJ0TnVsbChhcmcsIG1zZz8pIHtcbiAgICBpZiAoYXJnICE9PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBudWxsIGJ1dCB3YXMgbm90IG51bGw6IFwiICsgYXJnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIG5vdCBudWxsLiAgVGhyb3dzIGFuIGV4Y2VwdGlvbiBpZiBudWxsLlxuICAgKiBcbiAgICogQHBhcmFtIGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gYXNzZXJ0IG5vdCBudWxsXG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgYXJnIGlzIG51bGwgKG9wdGlvbmFsKVxuICAgKi9cbiAgc3RhdGljIGFzc2VydE5vdE51bGwoYXJnLCBtc2c/KSB7XG4gICAgaWYgKGFyZyA9PT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKG1zZyA/IG1zZyA6IFwiQXJndW1lbnQgYXNzZXJ0ZWQgYXMgbm90IG51bGwgYnV0IHdhcyBudWxsXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgZGVmaW5lZC4gIFRocm93cyBhbiBleGNlcHRpb24gaWYgdW5kZWZpbmVkLlxuICAgKiBcbiAgICogQHBhcmFtIGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gYXNzZXJ0IGRlZmluZWRcbiAgICogQHBhcmFtIG1zZyBpcyB0aGUgbWVzc2FnZSB0byB0aHJvdyBpZiBhcmcgaXMgdW5kZWZpbmVkIChvcHRpb25hbClcbiAgICovXG4gIHN0YXRpYyBhc3NlcnREZWZpbmVkKGFyZywgbXNnPykge1xuICAgIGlmIChHZW5VdGlscy5pc1VuZGVmaW5lZChhcmcpKSB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBkZWZpbmVkIGJ1dCB3YXMgdW5kZWZpbmVkXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgdW5kZWZpbmVkLiAgVGhyb3dzIGFuIGV4Y2VwdGlvbiBpZiBkZWZpbmVkLlxuICAgKiBcbiAgICogQHBhcmFtIGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gYXNzZXJ0IHVuZGVmaW5lZFxuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIGFyZyBpcyBkZWZpbmVkIChvcHRpb25hbClcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRVbmRlZmluZWQoYXJnLCBtc2c/KSB7XG4gICAgaWYgKEdlblV0aWxzLmlzRGVmaW5lZChhcmcpKSB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyB1bmRlZmluZWQgYnV0IHdhcyBkZWZpbmVkOiBcIiArIGFyZyk7XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBhcmd1bWVudCBpcyBpbml0aWFsaXplZC4gIFRocm93cyBhbiBleGNlcHRpb24gaWYgbm90IGluaXRpYWxpemVkLlxuICAgKiBcbiAgICogQHBhcmFtIGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gYXNzZXJ0IGFzIGluaXRpYWxpemVkXG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgYXJnIGlzIG5vdCBpbml0aWFsaXplZCAob3B0aW9uYWwpXG4gICAqL1xuICBzdGF0aWMgYXNzZXJ0SW5pdGlhbGl6ZWQoYXJnLCBtc2c/KSB7XG4gICAgaWYgKEdlblV0aWxzLmlzVW5pbml0aWFsaXplZChhcmcpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBpbml0aWFsaXplZCBidXQgd2FzIFwiICsgYXJnKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBhcmd1bWVudCBpcyB1bmluaXRpYWxpemVkLiAgVGhyb3dzIGFuIGV4Y2VwdGlvbiBpZiBpbml0aWFsaXplZC5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIGFzc2VydCBhcyB1bmluaXRpYWxpemVkXG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgYXJnIGlzIGluaXRpYWxpemVkIChvcHRpb25hbClcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRVbmluaXRpYWxpemVkKGFyZywgbXNnPykge1xuICAgIGlmIChHZW5VdGlscy5pc0luaXRpYWxpemVkKGFyZykpIHRocm93IG5ldyBFcnJvcihtc2cgPyBtc2cgOiBcIkFyZ3VtZW50IGFzc2VydGVkIGFzIHVuaW5pdGlhbGl6ZWQgYnV0IHdhcyBpbml0aWFsaXplZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIGdpdmVuIGFyZ3VtZW50cyBhcmUgZXF1YWwuICBUaHJvd3MgYW4gZXhjZXB0aW9uIGlmIG5vdCBlcXVhbC5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcxIGlzIGFuIGFyZ3VtZW50IHRvIGFzc2VydCBhcyBlcXVhbFxuICAgKiBAcGFyYW0gYXJnMiBpcyBhbiBhcmd1bWVudCB0byBhc3NlcnQgYXMgZXF1YWxcbiAgICogQHBhcmFtIG1zZyBpcyB0aGUgbWVzc2FnZSB0byB0aHJvdyBpZiB0aGUgYXJndW1lbnRzIGFyZSBub3QgZXF1YWxcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRFcXVhbHMoYXJnMSwgYXJnMiwgbXNnPykge1xuICAgIEdlblV0aWxzLmFzc2VydFRydWUoR2VuVXRpbHMuZXF1YWxzKGFyZzEsIGFyZzIpLCBtc2cgPyBtc2cgOiBcIkFyZ3VtZW50cyBhc3NlcnRlZCBhcyBlcXVhbCBidXQgYXJlIG5vdCBlcXVhbDogXCIgKyBhcmcxICsgXCIgdnMgXCIgKyBhcmcyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIGdpdmVuIGFyZ3VtZW50cyBhcmUgbm90IGVxdWFsLiAgVGhyb3dzIGFuIGV4Y2VwdGlvbiBpZiBlcXVhbC5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcxIGlzIGFuIGFyZ3VtZW50IHRvIGFzc2VydCBhcyBub3QgZXF1YWxcbiAgICogQHBhcmFtIGFyZzIgaXMgYW4gYXJndW1lbnQgdG8gYXNzZXJ0IGFzIG5vdCBlcXVhbFxuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIHRoZSBhcmd1bWVudHMgYXJlIGVxdWFsXG4gICAqL1xuICBzdGF0aWMgYXNzZXJ0Tm90RXF1YWxzKGFyZzEsIGFyZzIsIG1zZz8pIHtcbiAgICBpZiAoYXJnMSA9PT0gYXJnMikgdGhyb3cgbmV3IEVycm9yKG1zZyA/IG1zZyA6IFwiQXJndW1lbnRzIGFzc2VydGVkIGFzIG5vdCBlcXVhbCBidXQgYXJlIGVxdWFsOiBcIiArIGFyZzEgKyBcIiB2cyBcIiArIGFyZzIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYW4gaW50ZWdlci5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIGFzc2VydCBhcyBhbiBpbnRlZ2VyXG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgdGhlIGFyZ3VtZW50IGlzIG5vdCBhbiBpbnRlZ2VyXG4gICAqL1xuICBzdGF0aWMgYXNzZXJ0SW50KGFyZywgbXNnPykge1xuICAgIGlmICghR2VuVXRpbHMuaXNJbnQoYXJnKSkgdGhyb3cgbmV3IEVycm9yKG1zZyA/IG1zZyA6IFwiQXJndW1lbnQgYXNzZXJ0ZWQgYXMgYW4gaW50ZWdlciBidXQgaXMgbm90IGFuIGludGVnZXJcIik7XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhIG51bWJlci5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIGFzc2VydCBhcyBhIG51bWJlclxuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIHRoZSBhcmd1bWVudCBpcyBub3QgYSBudW1iZXJcbiAgICovXG4gIHN0YXRpYyBhc3NlcnROdW1iZXIoYXJnLCBtc2c/KSB7XG4gICAgaWYgKCFHZW5VdGlscy5pc051bWJlcihhcmcpKSB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBhIG51bWJlciBidXQgaXMgbm90IGEgbnVtYmVyXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYSBib29sZWFuLlxuICAgKiBcbiAgICogQHBhcmFtIGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gYXNzZXJ0IGFzIGEgYm9vbGVhblxuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIHRoZSBhcmd1bWVudCBpcyBub3QgYSBib29sZWFuXG4gICAqL1xuICBzdGF0aWMgYXNzZXJ0Qm9vbGVhbihhcmcsIG1zZz8pIHtcbiAgICBpZiAoIUdlblV0aWxzLmlzQm9vbGVhbihhcmcpKSB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBhIGJvb2xlYW4gYnV0IGlzIG5vdCBhIGJvb2xlYW5cIik7XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhIHN0cmluZy5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIGFzc2VydCBhcyBhIHN0cmluZ1xuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIHRoZSBhcmd1bWVudCBpcyBub3QgYSBzdHJpbmdcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRTdHJpbmcoYXJnLCBtc2c/KSB7XG4gICAgaWYgKCFHZW5VdGlscy5pc1N0cmluZyhhcmcpKSB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBhIHN0cmluZyBidXQgaXMgbm90IGEgc3RyaW5nOiBcIiArIGFyZyk7XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhbiBhcnJheS5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIGFzc2VydCBhcyBhbiBhcnJheVxuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIHRoZSBhcmd1bWVudCBpcyBub3QgYW4gYXJyYXlcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRBcnJheShhcmcsIG1zZz8pIHtcbiAgICBpZiAoIUdlblV0aWxzLmlzQXJyYXkoYXJnKSkgdGhyb3cgbmV3IEVycm9yKG1zZyA/IG1zZyA6IFwiQXJndW1lbnQgYXNzZXJ0ZWQgYXMgYW4gYXJyYXkgYnV0IGlzIG5vdCBhbiBhcnJheVwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGEgc3RhdGljLlxuICAgKiBcbiAgICogQHBhcmFtIGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gYXNzZXJ0IGFzIGEgc3RhdGljXG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgdGhlIGFyZ3VtZW50IGlzIG5vdCBhIHN0YXRpY1xuICAgKi9cbiAgc3RhdGljIGFzc2VydEZ1bmN0aW9uKGFyZywgbXNnPykge1xuICAgIGlmICghR2VuVXRpbHMuaXNGdW5jdGlvbihhcmcpKSB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBhIHN0YXRpYyBidXQgaXMgbm90IGEgc3RhdGljXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYW4gb2JqZWN0IHdpdGggdGhlIGdpdmVuIG5hbWUuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byB0ZXN0XG4gICAqIEBwYXJhbSBvYmogaXMgYW4gb2JqZWN0IHRvIGFzc2VydCBhcmcgaW5zdGFuY2VvZiBvYmogKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIHRoZSBhcmd1bWVudCBpcyBub3QgdGhlIHNwZWNpZmllZCBvYmplY3RcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRPYmplY3QoYXJnLCBvYmosIG1zZz8pIHtcbiAgICBHZW5VdGlscy5hc3NlcnRJbml0aWFsaXplZChhcmcsIG1zZyk7XG4gICAgaWYgKG9iaikge1xuICAgICAgaWYgKCFHZW5VdGlscy5pc09iamVjdChhcmcsIG9iaikpIHRocm93IG5ldyBFcnJvcihtc2cgPyBtc2cgOiBcIkFyZ3VtZW50IGFzc2VydGVkIGFzIG9iamVjdCAnXCIgKyBvYmoubmFtZSArIFwiJyBidXQgd2FzIG5vdFwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKCFHZW5VdGlscy5pc09iamVjdChhcmcpKSB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBvYmplY3QgYnV0IHdhcyBub3RcIik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGNoaWxkJ3MgcHJvdG90eXBlIHRvIHRoZSBwYXJlbnQncyBwcm90b3R5cGUuXG4gICAqIFxuICAgKiBAcGFyYW0gY2hpbGQgaXMgdGhlIGNoaWxkIGNsYXNzXG4gICAqIEBwYXJhbSBwYXJlbnQgaXMgdGhlIHBhcmVudCBjbGFzc1xuICAgKi9cbiAgc3RhdGljIGluaGVyaXRzRnJvbShjaGlsZCwgcGFyZW50KSB7XG4gICAgY2hpbGQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShwYXJlbnQucHJvdG90eXBlKTtcbiAgICBjaGlsZC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjaGlsZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnZva2VzIGZ1bmN0aW9ucyB3aXRoIGFyZ3VtZW50cy5cbiAgICogXG4gICAqIGFyZ3VtZW50c1swXSBpcyBhc3N1bWVkIHRvIGJlIGFuIGFycmF5IG9mIGZ1bmN0aW9ucyB0byBpbnZva2VcbiAgICogYXJndW1lbnRzWzEuLi5uXSBhcmUgYXJncyB0byBpbnZva2UgdGhlIGZ1bmN0aW9ucyB3aXRoXG4gICAqL1xuICBzdGF0aWMgaW52b2tlKCkge1xuICAgIGxldCBmbnMgPSBhcmd1bWVudHNbMF07XG4gICAgbGV0IGFyZ3MgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgYXJncy5wdXNoKGFyZ3VtZW50c1tpXSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIEdlblV0aWxzLmFzc2VydEZ1bmN0aW9uKGZuc1tpXSwgXCJGdW5jdGlvbnNbXCIgKyBpICsgXCJdIGlzIG5vdCBhIHN0YXRpY1wiKTtcbiAgICAgIGZuc1tpXS5hcHBseShudWxsLCBhcmdzKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgcG93ZXIgc2V0IG9mIHRoZSBnaXZlbiBhcnJheS5cbiAgICogXG4gICAqIEBwYXJhbSBhcnIgaXMgdGhlIGFycmF5IHRvIGdldCB0aGUgcG93ZXIgc2V0IG9mXG4gICAqIEByZXR1cm4gW11bXSBpcyB0aGUgcG93ZXIgc2V0IG9mIHRoZSBnaXZlbiBhcnJheVxuICAgKi9cbiAgc3RhdGljIGdldFBvd2VyU2V0KGFycikge1xuICAgIGxldCBmbiA9IGZ1bmN0aW9uKG4sIHNyYywgZ290LCBhbGwpIHtcbiAgICAgIGlmIChuID09IDApIHtcbiAgICAgICAgaWYgKGdvdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgYWxsW2FsbC5sZW5ndGhdID0gZ290O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgc3JjLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGZuKG4gLSAxLCBzcmMuc2xpY2UoaiArIDEpLCBnb3QuY29uY2F0KFsgc3JjW2pdIF0pLCBhbGwpO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgYWxsID0gW107XG4gICAgYWxsLnB1c2goW10pO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgICBmbihpLCBhcnIsIFtdLCBhbGwpO1xuICAgIH1cbiAgICBhbGwucHVzaChhcnIpO1xuICAgIHJldHVybiBhbGw7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgcG93ZXIgc2V0IG9mIHRoZSBnaXZlbiBhcnJheSB3aG9zZSBlbGVtZW50cyBhcmUgdGhlIGdpdmVuIHNpemUuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJyIGlzIHRoZSBhcnJheSB0byBnZXQgdGhlIHBvd2VyIHNldCBvZlxuICAgKiBAcGFyYW0gc2l6ZSBpcyB0aGUgcmVxdWlyZWQgc2l6ZSBvZiB0aGUgZWxlbWVudHMgd2l0aGluIHRoZSBwb3dlciBzZXRcbiAgICogcmV0dXJucyBbXVtdIGlzIHRoZSBwb3dlciBzZXQgb2YgdGhlIGdpdmVuIGFycmF5IHdob3NlIGVsZW1lbnRzIGFyZSB0aGUgZ2l2ZW4gc2l6ZSBcbiAgICovXG4gIHN0YXRpYyBnZXRQb3dlclNldE9mTGVuZ3RoKGFyciwgc2l6ZSkge1xuICAgIEdlblV0aWxzLmFzc2VydEluaXRpYWxpemVkKGFycik7XG4gICAgR2VuVXRpbHMuYXNzZXJ0SW5pdGlhbGl6ZWQoc2l6ZSk7XG4gICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZShzaXplID49IDEpO1xuICAgIGxldCBwb3dlclNldCA9IEdlblV0aWxzLmdldFBvd2VyU2V0KGFycik7XG4gICAgbGV0IHBvd2VyU2V0T2ZMZW5ndGggPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBvd2VyU2V0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAocG93ZXJTZXRbaV0ubGVuZ3RoID09PSBzaXplKSB7XG4gICAgICAgIHBvd2VyU2V0T2ZMZW5ndGgucHVzaChwb3dlclNldFtpXSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwb3dlclNldE9mTGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gYXJyYXkgb2YgaW5kaWNlcyBvZiB0aGUgZ2l2ZW4gc2l6ZS5cbiAgICogXG4gICAqIEBwYXJhbSBzaXplIHNwZWNpZmllcyB0aGUgc2l6ZSB0byBnZXQgaW5kaWNlcyBmb3JcbiAgICogQHJldHVybiBhcnJheSBvZiB0aGUgZ2l2ZW4gc2l6ZSB3aXRoIGluZGljZXMgc3RhcnRpbmcgYXQgMFxuICAgKi9cbiAgc3RhdGljIGdldEluZGljZXMoc2l6ZSkge1xuICAgIGxldCBpbmRpY2VzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgIGluZGljZXMucHVzaChpKTtcbiAgICB9XG4gICAgcmV0dXJuIGluZGljZXM7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIG5ldyBhcnJheSBjb250YWluaW5nIHVuaXF1ZSBlbGVtZW50cyBvZiB0aGUgZ2l2ZW4gYXJyYXkuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJyIGlzIHRoZSBhcnJheSB0byByZXR1cm4gdW5pcXVlIGVsZW1lbnRzIGZyb21cbiAgICogQHJldHVybiBhIG5ldyBhcnJheSB3aXRoIHRoZSBnaXZlbiBhcnJheSdzIHVuaXF1ZSBlbGVtZW50c1xuICAgKi9cbiAgc3RhdGljIHRvVW5pcXVlQXJyYXkoYXJyKSB7XG4gICAgcmV0dXJuIGFyci5maWx0ZXIoZnVuY3Rpb24odmFsdWUsIGluZGV4LCBzZWxmKSB7XG4gICAgICByZXR1cm4gc2VsZi5pbmRleE9mKHZhbHVlKSA9PT0gaW5kZXg7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ29waWVzIHRoZSBnaXZlbiBhcnJheS5cbiAgICogXG4gICAqIEBwYXJhbSBhcnIgaXMgdGhlIGFycmF5IHRvIGNvcHlcbiAgICogQHJldHVybiBhIGNvcHkgb2YgdGhlIGdpdmVuIGFycmF5XG4gICAqL1xuICBzdGF0aWMgY29weUFycmF5KGFycikge1xuICAgIEdlblV0aWxzLmFzc2VydEFycmF5KGFycik7XG4gICAgbGV0IGNvcHkgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykgY29weS5wdXNoKGFycltpXSk7XG4gICAgcmV0dXJuIGNvcHk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZW1vdmVzIGV2ZXJ5IGluc3RhbmNlIG9mIHRoZSBnaXZlbiB2YWx1ZSBmcm9tIHRoZSBnaXZlbiBhcnJheS5cbiAgICogXG4gICAqIEBwYXJhbSBhcnIgaXMgdGhlIGFycmF5IHRvIHJlbW92ZSB0aGUgdmFsdWUgZnJvbVxuICAgKiBAcGFyYW0gdmFsIGlzIHRoZSB2YWx1ZSB0byByZW1vdmUgZnJvbSB0aGUgYXJyYXlcbiAgICogQHJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBpcyBmb3VuZCBhbmQgcmVtb3ZlZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgcmVtb3ZlKGFyciwgdmFsKSB7XG4gICAgbGV0IGZvdW5kID0gZmFsc2U7XG4gICAgZm9yIChsZXQgaSA9IGFyci5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgaWYgKGFycltpXSA9PT0gdmFsKSB7XG4gICAgICAgIGFyci5zcGxpY2UoaSwgMSk7XG4gICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgaS0tO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZm91bmQ7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGNvcHkgb2YgdGhlIGdpdmVuIGFycmF5IHdoZXJlIGVhY2ggZWxlbWVudCBpcyBsb3dlcmNhc2UuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJyIGlzIHRoZSBhcnJheSB0byBjb252ZXJ0IHRvIGxvd2VyY2FzZVxuICAgKiBAcmV0dXJuIGEgY29weSBvZiB0aGUgZ2l2ZW4gYXJyYXkgd2hlcmUgZWFjaCBlbGVtZW50IGlzIGxvd2VyY2FzZVxuICAgKi9cbiAgc3RhdGljIHRvTG93ZXJDYXNlQXJyYXkoYXJyKSB7XG4gICAgbGV0IGFycjIgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgYXJyMi5wdXNoKGFycltpXS50b0xvd2VyQ2FzZSgpKTtcbiAgICB9XG4gICAgcmV0dXJuIGFycjI7XG4gIH1cblxuICAvKipcbiAgICogTGlzdGlmaWVzIHRoZSBnaXZlbiBhcmd1bWVudC5cbiAgICogXG4gICAqIEBwYXJhbSBhcnJPckVsZW0gaXMgYW4gYXJyYXkgb3IgYW4gZWxlbWVudCBpbiB0aGUgYXJyYXlcbiAgICogQHJldHVybiBhbiBhcnJheSB3aGljaCBpcyB0aGUgZ2l2ZW4gYXJnIGlmIGl0J3MgYW4gYXJyYXkgb3IgYW4gYXJyYXkgd2l0aCB0aGUgZ2l2ZW4gYXJnIGFzIGFuIGVsZW1lbnRcbiAgICovXG4gIHN0YXRpYyBsaXN0aWZ5KGFyck9yRWxlbSkge1xuICAgIHJldHVybiBHZW5VdGlscy5pc0FycmF5KGFyck9yRWxlbSkgPyBhcnJPckVsZW0gOiBbYXJyT3JFbGVtXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGdpdmVuIGFycmF5IGNvbnRhaW5zIHRoZSBnaXZlbiBvYmplY3QuXG4gICAqIFxuICAgKiBAcGFyYW0ge2FueX0gYXJyIC0gYXJyYXkgdGhhdCBtYXkgb3IgbWF5IG5vdCBjb250YWluIHRoZSBvYmplY3RcbiAgICogQHBhcmFtIHthbnl9IG9iaiAtIG9iamVjdCB0byBjaGVjayBmb3IgaW5jbHVzaW9uIGluIHRoZSBhcnJheVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb21wYXJlQnlSZWZlcmVuY2VdIC0gY29tcGFyZSBzdHJpY3RseSBieSByZWZlcmVuY2UsIGZvcmdvaW5nIGRlZXAgZXF1YWxpdHkgY2hlY2sgKGRlZmF1bHQgZmFsc2UpXG4gICAqIEByZXR1cm4gdHJ1ZSBpZiB0aGUgYXJyYXkgY29udGFpbnMgdGhlIG9iamVjdCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgYXJyYXlDb250YWlucyhhcnIsIG9iaiwgY29tcGFyZUJ5UmVmZXJlbmNlID0gZmFsc2UpIHtcbiAgICBHZW5VdGlscy5hc3NlcnRUcnVlKEdlblV0aWxzLmlzQXJyYXkoYXJyKSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhcnJbaV0gPT09IG9iaikgcmV0dXJuIHRydWU7XG4gICAgICBpZiAoIWNvbXBhcmVCeVJlZmVyZW5jZSAmJiBHZW5VdGlscy5lcXVhbHMoYXJyW2ldLCBvYmopKSByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZ2l2ZW4gc3RyaW5nIGNvbnRhaW5zIHRoZSBnaXZlbiBzdWJzdHJpbmcuXG4gICAqIFxuICAgKiBAcGFyYW0gc3RyIGlzIHRoZSBzdHJpbmcgdG8gc2VhcmNoIGZvciBhIHN1YnN0cmluZ1xuICAgKiBAcGFyYW0gc3Vic3RyaW5nIGlzIHRoZSBzdWJzdHJpbmcgdG8gc2VhcmNoaW4gd2l0aGluIHRoZSBzdHJpbmdcbiAgICogQHJldHVybiB0cnVlIGlmIHRoZSBzdWJzdHJpbmcgaXMgd2l0aGluIHRoZSBzdHJpbmcsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIHN0ckNvbnRhaW5zKHN0ciwgc3Vic3RyaW5nKSB7XG4gICAgcmV0dXJuIHN0ci5pbmRleE9mKHN1YnN0cmluZykgPiAtMTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIGlmIHR3byBhcnJheXMgYXJlIGVxdWFsLlxuICAgKiBcbiAgICogQHBhcmFtIGFycjEgaXMgYW4gYXJyYXkgdG8gY29tcGFyZVxuICAgKiBAcGFyYW0gYXJyMiBpcyBhbiBhcnJheSB0byBjb21wYXJlXG4gICAqIEByZXR1cm4gdHJ1ZSBpZiB0aGUgYXJyYXlzIGFyZSBlcXVhbCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgYXJyYXlzRXF1YWwoYXJyMSwgYXJyMikge1xuICAgIGlmIChhcnIxID09PSBhcnIyKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoYXJyMSA9PSBudWxsICYmIGFycjIgPT0gbnVsbCkgcmV0dXJuIHRydWU7XG4gICAgaWYgKGFycjEgPT0gbnVsbCB8fCBhcnIyID09IG51bGwpIHJldHVybiBmYWxzZTtcbiAgICBpZiAodHlwZW9mIGFycjEgPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBhcnIyID09PSAndW5kZWZpbmVkJykgcmV0dXJuIHRydWU7XG4gICAgaWYgKHR5cGVvZiBhcnIxID09PSAndW5kZWZpbmVkJyB8fCB0eXBlb2YgYXJyMiA9PT0gJ3VuZGVmaW5lZCcpIHJldHVybiBmYWxzZTtcbiAgICBpZiAoIUdlblV0aWxzLmlzQXJyYXkoYXJyMSkpIHRocm93IG5ldyBFcnJvcihcIkZpcnN0IGFyZ3VtZW50IGlzIG5vdCBhbiBhcnJheVwiKTtcbiAgICBpZiAoIUdlblV0aWxzLmlzQXJyYXkoYXJyMikpIHRocm93IG5ldyBFcnJvcihcIlNlY29uZCBhcmd1bWVudCBpcyBub3QgYW4gYXJyYXlcIik7XG4gICAgaWYgKGFycjEubGVuZ3RoICE9IGFycjIubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnIxLmxlbmd0aDsgKytpKSB7XG4gICAgICBpZiAoIUdlblV0aWxzLmVxdWFscyhhcnIxW2ldLCBhcnIyW2ldKSkgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIGlmIHR3byBhcmd1bWVudHMgYXJlIGRlZXAgZXF1YWwuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnMSBpcyBhbiBhcmd1bWVudCB0byBjb21wYXJlXG4gICAqIEBwYXJhbSBhcmcyIGlzIGFuIGFyZ3VtZW50IHRvIGNvbXBhcmVcbiAgICogQHJldHVybiB0cnVlIGlmIHRoZSBhcmd1bWVudHMgYXJlIGRlZXAgZXF1YWxzLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBlcXVhbHMoYXJnMSwgYXJnMikge1xuICAgIGlmIChHZW5VdGlscy5pc0FycmF5KGFyZzEpICYmIEdlblV0aWxzLmlzQXJyYXkoYXJnMikpIHJldHVybiBHZW5VdGlscy5hcnJheXNFcXVhbChhcmcxLCBhcmcyKTtcbiAgICBpZiAoR2VuVXRpbHMuaXNPYmplY3QoYXJnMSkgJiYgR2VuVXRpbHMuaXNPYmplY3QoYXJnMikpIHJldHVybiBHZW5VdGlscy5vYmplY3RzRXF1YWwoYXJnMSwgYXJnMik7XG4gICAgcmV0dXJuIGFyZzEgPT09IGFyZzI7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIGlmIHR3byBvYmplY3RzIGFyZSBkZWVwIGVxdWFsLlxuICAgKiBcbiAgICogVW5kZWZpbmVkIHZhbHVlcyBhcmUgY29uc2lkZXJlZCBlcXVhbCB0byBub24tZXhpc3RlbnQga2V5cy5cbiAgICogXG4gICAqIEBwYXJhbSBtYXAxIGlzIGEgbWFwIHRvIGNvbXBhcmVcbiAgICogQHBhcmFtIG1hcDIgaXMgYSBtYXAgdG8gY29tcGFyZVxuICAgKiBAcmV0dXJuIHRydWUgaWYgdGhlIG1hcHMgaGF2ZSBpZGVudGljYWwga2V5cyBhbmQgdmFsdWVzLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBvYmplY3RzRXF1YWwobWFwMSwgbWFwMikge1xuICAgIGxldCBrZXlzMSA9IE9iamVjdC5rZXlzKG1hcDEpO1xuICAgIGxldCBrZXlzMiA9IE9iamVjdC5rZXlzKG1hcDIpO1xuICAgIFxuICAgIC8vIGNvbXBhcmUgZWFjaCBrZXkxIHRvIGtleXMyXG4gICAgZm9yIChsZXQga2V5MSBvZiBrZXlzMSkge1xuICAgICAgbGV0IGZvdW5kID0gZmFsc2U7XG4gICAgICBmb3IgKGxldCBrZXkyIG9mIGtleXMyKSB7XG4gICAgICAgIGlmIChrZXkxID09PSBrZXkyKSB7XG4gICAgICAgICAgaWYgKCFHZW5VdGlscy5lcXVhbHMobWFwMVtrZXkxXSwgbWFwMltrZXkyXSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICghZm91bmQgJiYgbWFwMVtrZXkxXSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gZmFsc2U7IC8vIGFsbG93cyB1bmRlZmluZWQgdmFsdWVzIHRvIGVxdWFsIG5vbi1leGlzdGVudCBrZXlzXG4gICAgfVxuICAgIFxuICAgIC8vIGNvbXBhcmUgZWFjaCBrZXkyIHRvIGtleXMxXG4gICAgZm9yIChsZXQga2V5MiBvZiBrZXlzMikge1xuICAgICAgbGV0IGZvdW5kID0gZmFsc2U7XG4gICAgICBmb3IgKGxldCBrZXkxIG9mIGtleXMxKSB7XG4gICAgICAgIGlmIChrZXkxID09PSBrZXkyKSB7XG4gICAgICAgICAgZm91bmQgPSB0cnVlOyAvLyBubyBuZWVkIHRvIHJlLWNvbXBhcmUgd2hpY2ggd2FzIGRvbmUgZWFybGllclxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoIWZvdW5kICYmIG1hcDJba2V5Ml0gIT09IHVuZGVmaW5lZCkgcmV0dXJuIGZhbHNlOyAvLyBhbGxvd3MgdW5kZWZpbmVkIHZhbHVlcyB0byBlcXVhbCBub24tZXhpc3RlbnQga2V5c1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgICBcbiAgICAvLyBUT0RPOiBzdXBwb3J0IHN0cmljdCBvcHRpb24/XG4vLyAgICBpZiAoc3RyaWN0KSB7XG4vLyAgICAgIGxldCBrZXlzMSA9IE9iamVjdC5rZXlzKG1hcDEpO1xuLy8gICAgICBpZiAoa2V5czEubGVuZ3RoICE9PSBPYmplY3Qua2V5cyhtYXAyKS5sZW5ndGgpIHJldHVybiBmYWxzZTtcbi8vICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzMS5sZW5ndGg7IGkrKykge1xuLy8gICAgICAgIGxldCBrZXkgPSBPYmplY3Qua2V5cyhtYXAxKVtpXTtcbi8vICAgICAgICBpZiAoIUdlblV0aWxzLmVxdWFscyhtYXAxW2tleV0sIG1hcDJba2V5XSkpIHJldHVybiBmYWxzZTtcbi8vICAgICAgfVxuLy8gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogRGVsZXRlcyBwcm9wZXJ0aWVzIGZyb20gdGhlIG9iamVjdCB0aGF0IGFyZSB1bmRlZmluZWQuXG4gICAqIFxuICAgKiBAcGFyYW0gb2JqIGlzIHRoZSBvYmplY3QgdG8gZGVsZXRlIHVuZGVmaW5lZCBrZXlzIGZyb21cbiAgICovXG4gIHN0YXRpYyBkZWxldGVVbmRlZmluZWRLZXlzKG9iaikge1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhvYmopKSB7XG4gICAgICBpZiAob2JqW2tleV0gPT09IHVuZGVmaW5lZCkgZGVsZXRlIG9ialtrZXldO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGNvbWJpbmF0aW9ucyBvZiB0aGUgZ2l2ZW4gYXJyYXkgb2YgdGhlIGdpdmVuIHNpemUuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJyIGlzIHRoZSBhcnJheSB0byBnZXQgY29tYmluYXRpb25zIGZyb21cbiAgICogQHBhcmFtIGNvbWJpbmF0aW9uU2l6ZSBzcGVjaWZpZXMgdGhlIHNpemUgb2YgZWFjaCBjb21iaW5hdGlvblxuICAgKi9cbiAgc3RhdGljIGdldENvbWJpbmF0aW9ucyhhcnIsIGNvbWJpbmF0aW9uU2l6ZSkge1xuICAgIFxuICAgIC8vIHZhbGlkYXRlIGlucHV0XG4gICAgR2VuVXRpbHMuYXNzZXJ0SW5pdGlhbGl6ZWQoYXJyKTtcbiAgICBHZW5VdGlscy5hc3NlcnRJbml0aWFsaXplZChjb21iaW5hdGlvblNpemUpO1xuICAgIEdlblV0aWxzLmFzc2VydFRydWUoY29tYmluYXRpb25TaXplID49IDEpO1xuICAgIFxuICAgIC8vIGdldCBjb21iaW5hdGlvbnMgb2YgYXJyYXkgaW5kaWNlcyBvZiB0aGUgZ2l2ZW4gc2l6ZVxuICAgIGxldCBpbmRleENvbWJpbmF0aW9ucyA9IEdlblV0aWxzLmdldFBvd2VyU2V0T2ZMZW5ndGgoR2VuVXRpbHMuZ2V0SW5kaWNlcyhhcnIubGVuZ3RoKSwgY29tYmluYXRpb25TaXplKTtcbiAgICBcbiAgICAvLyBjb2xsZWN0IGNvbWJpbmF0aW9ucyBmcm9tIGVhY2ggY29tYmluYXRpb24gb2YgYXJyYXkgaW5kaWNlc1xuICAgIGxldCBjb21iaW5hdGlvbnMgPSBbXTtcbiAgICBmb3IgKGxldCBpbmRleENvbWJpbmF0aW9uc0lkeCA9IDA7IGluZGV4Q29tYmluYXRpb25zSWR4IDwgaW5kZXhDb21iaW5hdGlvbnMubGVuZ3RoOyBpbmRleENvbWJpbmF0aW9uc0lkeCsrKSB7XG4gICAgICBcbiAgICAgIC8vIGdldCBjb21iaW5hdGlvbiBvZiBhcnJheSBpbmRpY2VzXG4gICAgICBsZXQgaW5kZXhDb21iaW5hdGlvbiA9IGluZGV4Q29tYmluYXRpb25zW2luZGV4Q29tYmluYXRpb25zSWR4XTtcbiAgICAgIFxuICAgICAgLy8gYnVpbGQgY29tYmluYXRpb24gZnJvbSBhcnJheVxuICAgICAgbGV0IGNvbWJpbmF0aW9uID0gW107XG4gICAgICBmb3IgKGxldCBpbmRleENvbWJpbmF0aW9uSWR4ID0gMDsgaW5kZXhDb21iaW5hdGlvbklkeCA8IGluZGV4Q29tYmluYXRpb24ubGVuZ3RoOyBpbmRleENvbWJpbmF0aW9uSWR4KyspIHtcbiAgICAgICAgY29tYmluYXRpb24ucHVzaChhcnJbaW5kZXhDb21iaW5hdGlvbltpbmRleENvbWJpbmF0aW9uSWR4XV0pO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBhZGQgdG8gY29tYmluYXRpb25zXG4gICAgICBjb21iaW5hdGlvbnMucHVzaChjb21iaW5hdGlvbik7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBjb21iaW5hdGlvbnM7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhbiAnYScgZWxlbWVudCB0aGF0IGlzIGRvd25sb2FkYWJsZSB3aGVuIGNsaWNrZWQuXG4gICAqIFxuICAgKiBAcGFyYW0gbmFtZSBpcyB0aGUgbmFtZSBvZiB0aGUgZmlsZSB0byBkb3dubG9hZFxuICAgKiBAcGFyYW0gY29udGVudHMgYXJlIHRoZSBzdHJpbmcgY29udGVudHMgb2YgdGhlIGZpbGUgdG8gZG93bmxvYWRcbiAgICogQHJldHVybiAnYScgZG9tIGVsZW1lbnQgd2l0aCBkb3dubG9hZGFibGUgZmlsZVxuICAgKi9cbiAgc3RhdGljIGdldERvd25sb2FkYWJsZUEobmFtZSwgY29udGVudHMpIHtcbiAgICBsZXQgYSA9IHdpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgYS5ocmVmID0gd2luZG93LlVSTC5jcmVhdGVPYmplY3RVUkwobmV3IEJsb2IoW2NvbnRlbnRzXSwge3R5cGU6ICd0ZXh0L3BsYWluJ30pKTtcbiAgICBhLmRvd25sb2FkID0gbmFtZTtcbiAgICBhLnRhcmdldD1cIl9ibGFua1wiO1xuICAgIGEuaW5uZXJIVE1MID0gbmFtZTtcbiAgICByZXR1cm4gYTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb3BpZXMgcHJvcGVydGllcyBpbiB0aGUgZ2l2ZW4gb2JqZWN0IHRvIGEgbmV3IG9iamVjdC5cbiAgICogXG4gICAqIEBwYXJhbSBvYmogaXMgb2JqZWN0IHRvIGNvcHkgcHJvcGVydGllcyBmb3JcbiAgICogQHJldHVybiBhIG5ldyBvYmplY3Qgd2l0aCBwcm9wZXJ0aWVzIGNvcGllZCBmcm9tIHRoZSBnaXZlbiBvYmplY3RcbiAgICovXG4gIHN0YXRpYyBjb3B5UHJvcGVydGllcyhvYmopIHtcbiAgICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShvYmopKVxuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZXMgYWxsIHByb3BlcnRpZXMgaW4gdGhlIGdpdmVuIG9iamVjdC5cbiAgICogXG4gICAqIEBwYXJhbSBvYmogaXMgdGhlIG9iamVjdCB0byBkZWxldGUgcHJvcGVydGllcyBmcm9tXG4gICAqL1xuICBzdGF0aWMgZGVsZXRlUHJvcGVydGllcyhvYmopIHtcbiAgICBsZXQgcHJvcHMgPSBbXTtcbiAgICBmb3IgKGxldCBwcm9wIGluIG9iaikgcHJvcHMucHVzaChwcm9wKTsgLy8gVE9ETzogaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wKSkgeyAuLi5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSBkZWxldGUgb2JqW3Byb3BzW2ldLnRvU3RyaW5nKCldO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZ2l2ZW4gc3RyaW5nIGNvbnRhaW5zIHdoaXRlc3BhY2UuXG4gICAqIFxuICAgKiBAcGFyYW0gc3RyIGlzIHRoZSBzdHJpbmcgdG8gdGVzdFxuICAgKiBAcmV0dXJuIHRydWUgaWYgdGhlIHN0cmluZyBjb250YWlucyB3aGl0ZXNwYWNlLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBoYXNXaGl0ZXNwYWNlKHN0cikge1xuICAgIHJldHVybiAvXFxzL2cudGVzdChzdHIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZ2l2ZW4gY2hhcmFjdGVyIGlzIHdoaXRlc3BhY2UuXG4gICAqIFxuICAgKiBAcGFyYW0gY2hhciBpcyB0aGUgY2hhcmFjdGVyIHRvIHRlc3RcbiAgICogQHJldHVybiB0cnVlIGlmIHRoZSBnaXZlbiBjaGFyYWN0ZXIgaXMgd2hpdGVzcGFjZSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaXNXaGl0ZXNwYWNlKGNoYXIpIHtcbiAgICByZXR1cm4gL1xccy8udGVzdChjaGFyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGdpdmVuIGNoYXJhY3RlciBpcyBhIG5ld2xpbmUuXG4gICAqIFxuICAgKiBAcGFyYW0gY2hhciBpcyB0aGUgY2hhcmFjdGVyIHRvIHRlc3RcbiAgICogQHJldHVybiB0cnVlIGlmIHRoZSBnaXZlbiBjaGFyYWN0ZXIgaXMgYSBuZXdsaW5lLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc05ld2xpbmUoY2hhcikge1xuICAgIHJldHVybiBjaGFyID09PSAnXFxuJyB8fCBjaGFyID09PSAnXFxyJztcbiAgfVxuXG4gIC8qKlxuICAgKiBDb3VudHMgdGhlIG51bWJlciBvZiBub24td2hpdGVzcGFjZSBjaGFyYWN0ZXJzIGluIHRoZSBnaXZlbiBzdHJpbmcuXG4gICAqIFxuICAgKiBAcGFyYW0gc3RyIGlzIHRoZSBzdHJpbmcgdG8gY291bnQgdGhlIG51bWJlciBvZiBub24td2hpdGVzcGFjZSBjaGFyYWN0ZXJzIGluXG4gICAqIEByZXR1cm4gaW50IGlzIHRoZSBudW1iZXIgb2Ygbm9uLXdoaXRlc3BhY2UgY2hhcmFjdGVycyBpbiB0aGUgZ2l2ZW4gc3RyaW5nXG4gICAqL1xuICBzdGF0aWMgY291bnROb25XaGl0ZXNwYWNlQ2hhcmFjdGVycyhzdHIpIHtcbiAgICBsZXQgY291bnQgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoIUdlblV0aWxzLmlzV2hpdGVzcGFjZShzdHIuY2hhckF0KGkpKSkgY291bnQrKztcbiAgICB9XG4gICAgcmV0dXJuIGNvdW50O1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdG9rZW5zIHNlcGFyYXRlZCBieSB3aGl0ZXNwYWNlIGZyb20gdGhlIGdpdmVuIHN0cmluZy5cbiAgICogXG4gICAqIEBwYXJhbSBzdHIgaXMgdGhlIHN0cmluZyB0byBnZXQgdG9rZW5zIGZyb21cbiAgICogQHJldHVybiBzdHJpbmdbXSBhcmUgdGhlIHRva2VucyBzZXBhcmF0ZWQgYnkgd2hpdGVzcGFjZSB3aXRoaW4gdGhlIHN0cmluZ1xuICAgKi9cbiAgc3RhdGljIGdldFdoaXRlc3BhY2VUb2tlbnMoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5tYXRjaCgvXFxTKy9nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGxpbmVzIHNlcGFyYXRlZCBieSBuZXdsaW5lcyBmcm9tIHRoZSBnaXZlbiBzdHJpbmcuXG4gICAqIFxuICAgKiBAcGFyYW0gc3RyIGlzIHRoZSBzdHJpbmcgdG8gZ2V0IGxpbmVzIGZyb21cbiAgICogQHBhcmFtIHN0cmluZ1tdIGFyZSB0aGUgbGluZXMgc2VwYXJhdGVkIGJ5IG5ld2xpbmVzIHdpdGhpbiB0aGUgc3RyaW5nXG4gICAqL1xuICBzdGF0aWMgZ2V0TGluZXMoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5tYXRjaCgvW15cXHJcXG5dKy9nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBkb2N1bWVudCdzIGZpcnN0IHN0eWxlc2hlZXQgd2hpY2ggaGFzIG5vIGhyZWYuXG4gICAqIFxuICAgKiBAcmV0dXJuIFN0eWxlU2hlZXQgaXMgdGhlIGludGVybmFsIHN0eWxlc2hlZXRcbiAgICovXG4gIHN0YXRpYyBnZXRJbnRlcm5hbFN0eWxlU2hlZXQoKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkb2N1bWVudC5zdHlsZVNoZWV0cy5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IHN0eWxlU2hlZXQgPSBkb2N1bWVudC5zdHlsZVNoZWV0c1tpXTtcbiAgICAgIGlmICghc3R5bGVTaGVldC5ocmVmKSByZXR1cm4gc3R5bGVTaGVldDtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgZG9jdW1lbnQncyBpbnRlcm5hbCBzdHlsZXNoZWV0IGFzIHRleHQuXG4gICAqIFxuICAgKiBAcmV0dXJuIHN0ciBpcyB0aGUgZG9jdW1lbnQncyBpbnRlcm5hbCBzdHlsZXNoZWV0XG4gICAqL1xuICBzdGF0aWMgZ2V0SW50ZXJuYWxTdHlsZVNoZWV0VGV4dCgpIHtcbiAgICBsZXQgaW50ZXJuYWxDc3MgPSBcIlwiO1xuICAgIGxldCBpbnRlcm5hbFN0eWxlU2hlZXQgPSBHZW5VdGlscy5nZXRJbnRlcm5hbFN0eWxlU2hlZXQoKTtcbiAgICBpZiAoIWludGVybmFsU3R5bGVTaGVldCkgcmV0dXJuIG51bGw7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnRlcm5hbFN0eWxlU2hlZXQuY3NzUnVsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGludGVybmFsQ3NzICs9IGludGVybmFsU3R5bGVTaGVldC5jc3NSdWxlc1tpXS5jc3NUZXh0ICsgXCJcXG5cIjtcbiAgICB9XG4gICAgcmV0dXJuIGludGVybmFsQ3NzO1xuICB9XG5cbiAgLyoqXG4gICAqIE1hbnVhbGx5IGJ1aWxkcyBhbiBIVE1MIGRvY3VtZW50IHN0cmluZy5cbiAgICogXG4gICAqIEBwYXJhbSBjb250ZW50IHNwZWNpZmllcyBvcHRpb25hbCBkb2N1bWVudCBjb250ZW50XG4gICAqICAgICAgICBjb250ZW50LmRpdiBpcyBhIHByZS1leGlzdGluZyBkaXYgdG8gc3RyaW5naWZ5IGFuZCBhZGQgdG8gdGhlIGJvZHlcbiAgICogICAgICAgIGNvbnRlbnQudGl0bGUgaXMgdGhlIHRpdGxlIG9mIHRoZSBuZXcgdGFiXG4gICAqICAgICAgICBjb250ZW50LmRlcGVuZGVuY3lQYXRocyBzcGVjaWZpZXMgcGF0aHMgdG8ganMsIGNzcywgb3IgaW1nIHBhdGhzXG4gICAqICAgICAgICBjb250ZW50LmludGVybmFsQ3NzIGlzIGNzcyB0byBlbWJlZCBpbiB0aGUgaHRtbCBkb2N1bWVudFxuICAgKiAgICAgICAgY29udGVudC5tZXRhcyBhcmUgbWV0YSBlbGVtZW50cyB3aXRoIGtleXMvdmFsdWVzIHRvIGluY2x1ZGVcbiAgICogQHJldHVybiBzdHIgaXMgdGhlIGRvY3VtZW50IHN0cmluZ1xuICAgKi9cbiAgc3RhdGljIGJ1aWxkSHRtbERvY3VtZW50KGNvbnRlbnQpIHtcbiAgICBsZXQgc3RyID0gXCI8IURPQ1RZUEUgSFRNTD5cIjtcbiAgICBzdHIgKz0gXCI8aHRtbD48aGVhZD5cIjtcbiAgICBcbiAgICAvLyBhZGQgbWV0YXNcbiAgICBpZiAoY29udGVudC5tZXRhcykge1xuICAgICAgbGV0IG1ldGFzID0gR2VuVXRpbHMubGlzdGlmeShjb250ZW50Lm1ldGFzKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWV0YXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IG1ldGEgPSBtZXRhc1tpXTtcbiAgICAgICAgbGV0IGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibWV0YVwiKTtcbiAgICAgICAgZm9yIChsZXQgcHJvcCBpbiBtZXRhKSB7XG4gICAgICAgICAgaWYgKG1ldGEuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcbiAgICAgICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKHByb3AudG9TdHJpbmcoKSwgbWV0YVtwcm9wLnRvU3RyaW5nKCldKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc3RyICs9IGVsZW0ub3V0ZXJIVE1MO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBhZGQgdGl0bGUgYW5kIGludGVybmFsIGNzc1xuICAgIHN0ciArPSBjb250ZW50LnRpdGxlID8gXCI8dGl0bGU+XCIgKyBjb250ZW50LnRpdGxlICsgXCI8L3RpdGxlPlwiIDogXCJcIjtcbiAgICBzdHIgKz0gY29udGVudC5pbnRlcm5hbENzcyA/IFwiPHN0eWxlPlwiICsgY29udGVudC5pbnRlcm5hbENzcyArIFwiPC9zdHlsZT5cIiA6IFwiXCI7XG4gICAgXG4gICAgLy8gYWRkIGRlcGVuZGVuY3kgcGF0aHNcbiAgICBpZiAoY29udGVudC5kZXBlbmRlbmN5UGF0aHMpIHtcbiAgICAgIGxldCBkZXBlbmRlbmN5UGF0aHMgPSBHZW5VdGlscy5saXN0aWZ5KGNvbnRlbnQuZGVwZW5kZW5jeVBhdGhzKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVwZW5kZW5jeVBhdGhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxldCBkZXBlbmRlbmN5UGF0aCA9IGRlcGVuZGVuY3lQYXRoc1tpXTtcbiAgICAgICAgaWYgKGRlcGVuZGVuY3lQYXRoLmVuZHNXaXRoKFwiLmpzXCIpKSBzdHIgKz0gXCI8c2NyaXB0IHNyYz0nXCIgKyBkZXBlbmRlbmN5UGF0aCArIFwiJz48L3NjcmlwdD5cIjtcbiAgICAgICAgZWxzZSBpZiAoZGVwZW5kZW5jeVBhdGguZW5kc1dpdGgoXCIuY3NzXCIpKSBzdHIgKz0gXCI8bGluayByZWw9J3N0eWxlc2hlZXQnIHR5cGU9J3RleHQvY3NzJyBocmVmPSdcIiArIGRlcGVuZGVuY3lQYXRoICsgXCInLz5cIjtcbiAgICAgICAgZWxzZSBpZiAoZGVwZW5kZW5jeVBhdGguZW5kc1dpdGgoXCIucG5nXCIpIHx8IGRlcGVuZGVuY3lQYXRoLmVuZHNXaXRoKFwiLmltZ1wiKSkgIHN0ciArPSBcIjxpbWcgc3JjPSdcIiArIGRlcGVuZGVuY3lQYXRoICsgXCInPlwiO1xuICAgICAgICBlbHNlIHRocm93IG5ldyBFcnJvcihcIlVucmVjb2duaXplZCBkZXBlbmRlbmN5IHBhdGggZXh0ZW5zaW9uOiBcIiArIGRlcGVuZGVuY3lQYXRoKTsgICAgICBcbiAgICAgIH1cbiAgICB9XG4gICAgc3RyICs9IFwiPC9oZWFkPjxib2R5PlwiO1xuICAgIGlmIChjb250ZW50LmRpdikgc3RyICs9ICQoXCI8ZGl2PlwiKS5hcHBlbmQoY29udGVudC5kaXYuY2xvbmUoKSkuaHRtbCgpOyAgLy8gYWRkIGNsb25lZCBkaXYgYXMgc3RyaW5nXG4gICAgc3RyICs9IFwiPC9ib2R5PjwvaHRtbD5cIjtcbiAgICByZXR1cm4gc3RyO1xuICB9XG5cbiAgLyoqXG4gICAqIE9wZW5zIHRoZSBnaXZlbiBkaXYgaW4gYSBuZXcgd2luZG93LlxuICAgKiBcbiAgICogQHBhcmFtIGNvbnRlbnQgc3BlY2lmaWVzIG9wdGlvbmFsIHdpbmRvdyBjb250ZW50XG4gICAqICAgICAgICBjb250ZW50LmRpdiBpcyBhIHByZS1leGlzdGluZyBkaXYgdG8gc3RyaW5naWZ5IGFuZCBhZGQgdG8gdGhlIGJvZHlcbiAgICogICAgICAgIGNvbnRlbnQudGl0bGUgaXMgdGhlIHRpdGxlIG9mIHRoZSBuZXcgdGFiXG4gICAqICAgICAgICBjb250ZW50LmRlcGVuZGVuY3lQYXRocyBzcGVjaWZpZXMgcGF0aHMgdG8ganMsIGNzcywgb3IgaW1nIHBhdGhzXG4gICAqICAgICAgICBjb250ZW50LmludGVybmFsQ3NzIGlzIGNzcyB0byBlbWJlZCBpbiB0aGUgaHRtbCBkb2N1bWVudFxuICAgKiAgICAgICAgY29udGVudC5tZXRhcyBhcmUgbWV0YSBlbGVtZW50cyB3aXRoIGtleXMvdmFsdWVzIHRvIGluY2x1ZGVcbiAgICogQHBhcmFtIG9uTG9hZChlcnIsIHdpbmRvdykgaXMgaW52b2tlZCB3aXRoIGEgcmVmZXJlbmNlIHRvIHRoZSB3aW5kb3cgd2hlbiBhdmFpbGFibGVcbiAgICovXG4gIHN0YXRpYyBuZXdXaW5kb3coY29udGVudCwgb25Mb2FkKSB7XG4gICAgbGV0IG9uTG9hZENhbGxlZCA9IGZhbHNlO1xuICAgIGxldCB3ID0gd2luZG93Lm9wZW4oKTtcbiAgICBpZiAoIUdlblV0aWxzLmlzSW5pdGlhbGl6ZWQodykgfHwgIUdlblV0aWxzLmlzSW5pdGlhbGl6ZWQody5kb2N1bWVudCkpIHtcbiAgICAgIG9uTG9hZE9uY2UobmV3IEVycm9yKFwiQ291bGQgbm90IGdldCB3aW5kb3cgcmVmZXJlbmNlXCIpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdy5vcGVuZXIgPSBudWxsO1xuICAgIHcuZG9jdW1lbnQud3JpdGUoR2VuVXRpbHMuYnVpbGRIdG1sRG9jdW1lbnQoY29udGVudCkpO1xuICAgIHcuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgb25Mb2FkT25jZShudWxsLCB3KTtcbiAgICB9KTtcbiAgICB3LmRvY3VtZW50LmNsb3NlKCk7XG4gICAgXG4gICAgLy8gcHJldmVudHMgb25Mb2FkKCkgZnJvbSBiZWluZyBjYWxsZWQgbXVsdGlwbGUgdGltZXNcbiAgICBmdW5jdGlvbiBvbkxvYWRPbmNlKGVyciwgd2luZG93Pykge1xuICAgICAgaWYgKG9uTG9hZENhbGxlZCkgcmV0dXJuO1xuICAgICAgb25Mb2FkQ2FsbGVkID0gdHJ1ZTtcbiAgICAgIGlmIChvbkxvYWQpIG9uTG9hZChlcnIsIHdpbmRvdyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIHRoZSBnaXZlbiBpbWFnZSB0byBhIGJhc2U2NCBlbmNvZGVkIGRhdGEgdXJsLlxuICAgKiBcbiAgICogQHBhcmFtIGltZyBpcyB0aGUgaW1hZ2UgdG8gY29udmVydFxuICAgKiBAcGFyYW0gcXVhbGl0eSBpcyBhIG51bWJlciBiZXR3ZWVuIDAgYW5kIDEgc3BlY2lmeWluZyB0aGUgaW1hZ2UgcXVhbGl0eVxuICAgKi9cbiAgc3RhdGljIGltZ1RvRGF0YVVybChpbWcsIHF1YWxpdHkpIHtcbiAgICBsZXQgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgY2FudmFzLmhlaWdodCA9IGltZy5uYXR1cmFsSGVpZ2h0O1xuICAgIGNhbnZhcy53aWR0aCA9IGltZy5uYXR1cmFsV2lkdGg7XG4gICAgbGV0IGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICBjb250ZXh0LmRyYXdJbWFnZShpbWcsIDAsIDApO1xuICAgIHJldHVybiBjYW52YXMudG9EYXRhVVJMKHF1YWxpdHkpO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgdGhlIGltYWdlIGF0IHRoZSBnaXZlbiBVUkwgaXMgYWNjZXNzaWJsZS5cbiAgICogXG4gICAqIEBwYXJhbSB1cmwgaXMgdGhlIHVybCB0byBhbiBpbWFnZVxuICAgKiBAcGFyYW0gdGltZW91dCBpcyB0aGUgbWF4aW11bSB0aW1lIHRvIHdhaXRcbiAgICogQHBhcmFtIG9uRG9uZShib29sKSB3aGVuIHRoZSBpbWFnZSBpcyBkZXRlcm1pbmVkIHRvIGJlIGFjY2Vzc2libGUgb3Igbm90XG4gICAqL1xuICBzdGF0aWMgaXNJbWFnZUFjY2Vzc2libGUodXJsLCB0aW1lb3V0LCBvbkRvbmUpIHtcbiAgICBcbiAgICAvLyB0cmFjayByZXR1cm4gc28gaXQgb25seSBleGVjdXRlcyBvbmNlXG4gICAgbGV0IHJldHVybmVkID0gZmFsc2U7XG4gICAgXG4gICAgLy8gYXR0ZW1wdCB0byBsb2FkIGZhdmljb25cbiAgICBsZXQgaW1nID0gbmV3IEltYWdlKCk7XG4gICAgaW1nLm9ubG9hZCA9IG9uUmVzcG9uc2U7XG4gICAgaW1nLm9uZXJyb3IgPSBvblJlc3BvbnNlO1xuICAgIGltZy5zcmMgPSB1cmwgKyBcIj9cIiArICgrbmV3IERhdGUoKSk7IC8vIHRyaWdnZXIgaW1hZ2UgbG9hZCB3aXRoIGNhY2hlIGJ1c3RlclxuICAgIFxuICAgIC8vIG5lc3QgZmFpbHVyZSB0aW1lb3V0cyB0byBnaXZlIHJlc3BvbnNlIGEgY2hhbmNlIHdoZW4gYnJvd3NlciBpcyB1bmRlciBsb2FkXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIHNldEltbWVkaWF0ZShmdW5jdGlvbigpIHtcbiAgICAgICAgc2V0SW1tZWRpYXRlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHNldEltbWVkaWF0ZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICghcmV0dXJuZWQpIHtcbiAgICAgICAgICAgICAgcmV0dXJuZWQgPSB0cnVlO1xuICAgICAgICAgICAgICBvbkRvbmUoZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0sIHRpbWVvdXQpO1xuICAgIFxuICAgIGZ1bmN0aW9uIG9uUmVzcG9uc2UoZSkge1xuICAgICAgaWYgKHJldHVybmVkKSByZXR1cm47XG4gICAgICByZXR1cm5lZCA9IHRydWU7XG4gICAgICBpZiAodHlwZW9mIGUgPT09ICd1bmRlZmluZWQnIHx8IGUudHlwZSA9PT0gXCJlcnJvclwiKSBvbkRvbmUoZmFsc2UpO1xuICAgICAgZWxzZSBvbkRvbmUodHJ1ZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgdGhlIGdpdmVuIGZpbGUgaXMgYSB6aXAgZmlsZS5cbiAgICogXG4gICAqIEBwYXJhbSBmaWxlIGlzIGEgZmlsZVxuICAgKiBAcmV0dXJuIHRydWUgaWYgdGhlIGdpdmVuIGZpbGUgaXMgYSB6aXAgZmlsZSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaXNaaXBGaWxlKGZpbGUpIHtcbiAgICByZXR1cm4gZmlsZS5uYW1lLmVuZHNXaXRoKFwiLnppcFwiKSB8fCBmaWxlLnR5cGUgPT09ICdhcHBsaWNhdGlvbi96aXAnO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgdGhlIGdpdmVuIGZpbGUgaXMgYSBqc29uIGZpbGUuXG4gICAqIFxuICAgKiBAcGFyYW0gZmlsZSBpcyBhIGZpbGVcbiAgICogQHJldHVybiB0cnVlIGlmIHRoZSBnaXZlbiBmaWxlIGlzIGEganNvbiBmaWxlLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc0pzb25GaWxlKGZpbGUpIHtcbiAgICByZXR1cm4gZmlsZS5uYW1lLmVuZHNXaXRoKFwiLmpzb25cIikgfHwgZmlsZS50eXBlID09PSAnYXBwbGljYXRpb24vanNvbic7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyBpZiB0aGUgZ2l2ZW4gZmlsZSBpcyBhIHR4dCBmaWxlLlxuICAgKiBcbiAgICogQHBhcmFtIGZpbGUgaXMgYSBmaWxlXG4gICAqIEByZXR1cm4gdHJ1ZSBpZiB0aGUgZ2l2ZW4gZmlsZSBpcyBhIHR4dCBmaWxlLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc1R4dEZpbGUoZmlsZSkge1xuICAgIHJldHVybiBmaWxlLm5hbWUuZW5kc1dpdGgoXCIudHh0XCIpIHx8IGZpbGUudHlwZSA9PT0gJ3RleHQvcGxhaW4nO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoZXMgdGhlIGdpdmVuIGxpc3Qgb2YgaW1hZ2VzLlxuICAgKiBcbiAgICogUHJlcmVxdWlzaXRlOiBhc3luYy5qcy5cbiAgICogXG4gICAqIEBwYXJhbSBwYXRocyBhcmUgdGhlIHBhdGhzIHRvIHRoZSBpbWFnZXMgdG8gZmV0Y2hcbiAgICogQHBhcmFtIG9uRG9uZShlcnIsIGltYWdlcykgaXMgY2FsbGVkIHdoZW4gZG9uZVxuICAgKi9cbiAgc3RhdGljIGdldEltYWdlcyhwYXRocywgb25Eb25lKSB7XG4gICAgXG4gICAgLy8gbGlzdGlmeSBwYXRoc1xuICAgIGlmICghR2VuVXRpbHMuaXNBcnJheShwYXRocykpIHtcbiAgICAgIEdlblV0aWxzLmFzc2VydFRydWUoR2VuVXRpbHMuaXNTdHJpbmcocGF0aHMpKTtcbiAgICAgIHBhdGhzID0gW3BhdGhzXTtcbiAgICB9XG4gICAgXG4gICAgLy8gY29sbGVjdCBmdW5jdGlvbnMgdG8gZmV0Y2ggaW1hZ2VzXG4gICAgbGV0IGZ1bmNzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXRocy5sZW5ndGg7IGkrKykge1xuICAgICAgZnVuY3MucHVzaChsb2FkRnVuYyhwYXRoc1tpXSkpO1xuICAgIH1cbiAgICBcbiAgICAvLyBmZXRjaCBpbiBwYXJhbGxlbFxuICAgIGFzeW5jLnBhcmFsbGVsKGZ1bmNzLCBvbkRvbmUpO1xuICAgIFxuICAgIC8vIGNhbGxiYWNrIHN0YXRpYyB0byBmZXRjaCBhIHNpbmdsZSBpbWFnZVxuICAgIGZ1bmN0aW9uIGxvYWRGdW5jKHBhdGgpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbihvbkRvbmUpIHtcbiAgICAgICAgbGV0IGltZyA9IG5ldyBJbWFnZSgpO1xuICAgICAgICBpbWcub25sb2FkID0gZnVuY3Rpb24oKSB7IG9uRG9uZShudWxsLCBpbWcpOyB9XG4gICAgICAgIGltZy5vbmVycm9yID0gZnVuY3Rpb24oKSB7IG9uRG9uZShuZXcgRXJyb3IoXCJDYW5ub3QgbG9hZCBpbWFnZTogXCIgKyBwYXRoKSk7IH1cbiAgICAgICAgaW1nLnNyYyA9IHBhdGg7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogUmV0dXJucyBhIHN0cmluZyBpbmRlbnRhdGlvbiBvZiB0aGUgZ2l2ZW4gbGVuZ3RoO1xuICAgKiBcbiAgICogQHBhcmFtIGxlbmd0aCBpcyB0aGUgbGVuZ3RoIG9mIHRoZSBpbmRlbnRhdGlvblxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IGlzIGFuIGluZGVudGF0aW9uIHN0cmluZyBvZiB0aGUgZ2l2ZW4gbGVuZ3RoXG4gICAqL1xuICBzdGF0aWMgZ2V0SW5kZW50KGxlbmd0aCkge1xuICAgIGxldCBzdHIgPSBcIlwiO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHN0ciArPSAnICAnOyAvLyB0d28gc3BhY2VzXG4gICAgcmV0dXJuIHN0cjtcbiAgfVxuICBcbiAgc3RhdGljIGluaXRQb2x5ZmlsbHMoKSB7XG4gICAgXG4gICAgLy8gUG9seWZpbGwgT2JqZWN0LmFzc2lnbigpXG4gICAgLy8gQ3JlZGl0OiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9PYmplY3QvYXNzaWduXG4gICAgaWYgKHR5cGVvZiBPYmplY3QuYXNzaWduICE9ICdmdW5jdGlvbicpIHtcbiAgICAgIC8vIE11c3QgYmUgd3JpdGFibGU6IHRydWUsIGVudW1lcmFibGU6IGZhbHNlLCBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QsIFwiYXNzaWduXCIsIHtcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGFzc2lnbih0YXJnZXQsIHZhckFyZ3MpIHsgLy8gLmxlbmd0aCBvZiBzdGF0aWMgaXMgMlxuICAgICAgICAgICd1c2Ugc3RyaWN0JztcbiAgICAgICAgICBpZiAodGFyZ2V0ID09IG51bGwpIHsgLy8gVHlwZUVycm9yIGlmIHVuZGVmaW5lZCBvciBudWxsXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY29udmVydCB1bmRlZmluZWQgb3IgbnVsbCB0byBvYmplY3QnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsZXQgdG8gPSBPYmplY3QodGFyZ2V0KTtcblxuICAgICAgICAgIGZvciAobGV0IGluZGV4ID0gMTsgaW5kZXggPCBhcmd1bWVudHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICBsZXQgbmV4dFNvdXJjZSA9IGFyZ3VtZW50c1tpbmRleF07XG5cbiAgICAgICAgICAgIGlmIChuZXh0U291cmNlICE9IG51bGwpIHsgLy8gU2tpcCBvdmVyIGlmIHVuZGVmaW5lZCBvciBudWxsXG4gICAgICAgICAgICAgIGZvciAobGV0IG5leHRLZXkgaW4gbmV4dFNvdXJjZSkge1xuICAgICAgICAgICAgICAgIC8vIEF2b2lkIGJ1Z3Mgd2hlbiBoYXNPd25Qcm9wZXJ0eSBpcyBzaGFkb3dlZFxuICAgICAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobmV4dFNvdXJjZSwgbmV4dEtleSkpIHtcbiAgICAgICAgICAgICAgICAgIHRvW25leHRLZXldID0gbmV4dFNvdXJjZVtuZXh0S2V5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRvO1xuICAgICAgICB9LFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgICogUG9seWZpbGwgc3RyLnN0YXJ0c1dpdGgoc2VhcmNoU3RyaW5nLCBwb3NpdGlvbikuXG4gICAgICogXG4gICAgICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvU3RyaW5nL3N0YXJ0c1dpdGgjUG9seWZpbGxcbiAgICAgKi9cbiAgICBTdHJpbmcucHJvdG90eXBlLnN0YXJ0c1dpdGggPSBmdW5jdGlvbihzZWFyY2hTdHJpbmcsIHBvc2l0aW9uKSB7XG4gICAgICByZXR1cm4gdGhpcy5zdWJzdHIocG9zaXRpb24gfHwgMCwgc2VhcmNoU3RyaW5nLmxlbmd0aCkgPT09IHNlYXJjaFN0cmluZztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUG9seWZpbGwgc3RyLmVuZHNXaXRoKHNlYXJjaFN0cmluZywgcG9zaXRpb24pLlxuICAgICAqIFxuICAgICAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL1N0cmluZy9lbmRzV2l0aCNQb2x5ZmlsbFxuICAgICAqL1xuICAgIFN0cmluZy5wcm90b3R5cGUuZW5kc1dpdGggPSBmdW5jdGlvbihzZWFyY2hTdHJpbmcsIHBvc2l0aW9uKSB7XG4gICAgICBpZiAoIShwb3NpdGlvbiA8IHRoaXMubGVuZ3RoKSkgcG9zaXRpb24gPSB0aGlzLmxlbmd0aDsgIC8vIHdvcmtzIGJldHRlciB0aGFuID49IGJlY2F1c2UgaXQgY29tcGVuc2F0ZXMgZm9yIE5hTlxuICAgICAgZWxzZSBwb3NpdGlvbiB8PSAwOyAvLyByb3VuZCBwb3NpdGlvblxuICAgICAgcmV0dXJuIHRoaXMuc3Vic3RyKHBvc2l0aW9uIC0gc2VhcmNoU3RyaW5nLmxlbmd0aCwgc2VhcmNoU3RyaW5nLmxlbmd0aCkgPT09IHNlYXJjaFN0cmluZztcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIGEgdjQgVVVJRC5cbiAgICogXG4gICAqIFNvdXJjZTogaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTA1MDM0L2NyZWF0ZS1ndWlkLXV1aWQtaW4tamF2YXNjcmlwdFxuICAgKi9cbiAgc3RhdGljIGdldFVVSUQoKSB7XG4gICAgcmV0dXJuICd4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgZnVuY3Rpb24oYykge1xuICAgICAgbGV0IHIgPSBNYXRoLnJhbmRvbSgpICogMTYgfCAwLCB2ID0gYyA9PSAneCcgPyByIDogKHIgJiAweDMgfCAweDgpO1xuICAgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBjdXJyZW50IGVudmlyb25tZW50IGlzIGEgYnJvd3Nlci5cbiAgICogXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGVudmlyb25tZW50IGlzIGEgYnJvd3NlciwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaXNCcm93c2VyKCkge1xuICAgIGxldCBpc1dvcmtlciA9IHR5cGVvZiBpbXBvcnRTY3JpcHRzID09PSAnZnVuY3Rpb24nO1xuICAgIGxldCBpc0Jyb3dzZXJNYWluID0gdHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgZ2xvYmFsVGhpcyA9PT0gd2luZG93O1xuICAgIGxldCBpc0pzRG9tID0gaXNCcm93c2VyTWFpbiA/IHR5cGVvZiBuYXZpZ2F0b3IgIT09ICd1bmRlZmluZWQnICYmIG5hdmlnYXRvci51c2VyQWdlbnQuaW5jbHVkZXMoJ2pzZG9tJykgOiBmYWxzZTtcbiAgICByZXR1cm4gaXNXb3JrZXIgfHwgKGlzQnJvd3Nlck1haW4gJiYgIWlzSnNEb20pO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBjdXJyZW50IGVudmlyb25tZW50IGlzIERlbm9cbiAgICogXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGVudmlyb25tZW50IGlzIERlbm8sIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGlzRGVubygpIHtcbiAgICByZXR1cm4gdHlwZW9mIERlbm8gPT09IFwib2JqZWN0XCIgJiYgRGVuby5oYXNPd25Qcm9wZXJ0eShcInZlcnNpb25cIikgJiYgdHlwZW9mIERlbm8udmVyc2lvbiA9PT0gXCJvYmplY3RcIiAmJiBEZW5vLnZlcnNpb24uaGFzT3duUHJvcGVydHkoXCJkZW5vXCIpICYmIHR5cGVvZiBEZW5vLnZlcnNpb24uZGVubyA9PT0gXCJzdHJpbmdcIjtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgY3VycmVudCBlbnZpcm9ubWVudCBpcyBhIGZpcmVmb3gtYmFzZWQgYnJvd3Nlci5cbiAgICogXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGVudmlyb25tZW50IGlzIGEgZmlyZWZveC1iYXNlZCBicm93c2VyLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc0ZpcmVmb3goKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNCcm93c2VyKCkgJiYgbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKFwiRmlyZWZveFwiKSA+IDA7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgSUUgdmVyc2lvbiBudW1iZXIuXG4gICAqIFxuICAgKiBDcmVkaXQ6IGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE5OTk5Mzg4L2NoZWNrLWlmLXVzZXItaXMtdXNpbmctaWUtd2l0aC1qcXVlcnkvMjE3MTIzNTYjMjE3MTIzNTZcbiAgICogXG4gICAqIEByZXR1cm4gdGhlIElFIHZlcnNpb24gbnVtYmVyIG9yIG51bGwgaWYgbm90IElFXG4gICAqL1xuICBzdGF0aWMgZ2V0SUVWZXJzaW9uKCkge1xuICAgIGxldCB1YSA9IHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50O1xuXG4gICAgbGV0IG1zaWUgPSB1YS5pbmRleE9mKCdNU0lFICcpO1xuICAgIGlmIChtc2llID4gMCkge1xuICAgICAgICAvLyBJRSAxMCBvciBvbGRlciA9PiByZXR1cm4gdmVyc2lvbiBudW1iZXJcbiAgICAgICAgcmV0dXJuIHBhcnNlSW50KHVhLnN1YnN0cmluZyhtc2llICsgNSwgdWEuaW5kZXhPZignLicsIG1zaWUpKSwgMTApO1xuICAgIH1cblxuICAgIGxldCB0cmlkZW50ID0gdWEuaW5kZXhPZignVHJpZGVudC8nKTtcbiAgICBpZiAodHJpZGVudCA+IDApIHtcbiAgICAgICAgLy8gSUUgMTEgPT4gcmV0dXJuIHZlcnNpb24gbnVtYmVyXG4gICAgICAgIGxldCBydiA9IHVhLmluZGV4T2YoJ3J2OicpO1xuICAgICAgICByZXR1cm4gcGFyc2VJbnQodWEuc3Vic3RyaW5nKHJ2ICsgMywgdWEuaW5kZXhPZignLicsIHJ2KSksIDEwKTtcbiAgICB9XG5cbiAgICBsZXQgZWRnZSA9IHVhLmluZGV4T2YoJ0VkZ2UvJyk7XG4gICAgaWYgKGVkZ2UgPiAwKSB7XG4gICAgICAgLy8gRWRnZSAoSUUgMTIrKSA9PiByZXR1cm4gdmVyc2lvbiBudW1iZXJcbiAgICAgICByZXR1cm4gcGFyc2VJbnQodWEuc3Vic3RyaW5nKGVkZ2UgKyA1LCB1YS5pbmRleE9mKCcuJywgZWRnZSkpLCAxMCk7XG4gICAgfVxuXG4gICAgLy8gb3RoZXIgYnJvd3NlclxuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgYSBwYXJhbWV0ZXIgdmFsdWUuXG4gICAqIFxuICAgKiBDcmVkaXQ6IGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzkwMTExNS9ob3ctY2FuLWktZ2V0LXF1ZXJ5LXN0cmluZy12YWx1ZXMtaW4tamF2YXNjcmlwdFxuICAgKiBcbiAgICogQHBhcmFtIG5hbWUgaXMgdGhlIG5hbWUgb2YgdGhlIHBhcmFtZXRlciB0byBnZXQgdGhlIHZhbHVlIG9mXG4gICAqIEBwYXJhbSB1cmwgaXMgYSBVUkwgdG8gZ2V0IHRoZSBwYXJhbWV0ZXIgZnJvbSwgdXNlcyB0aGUgd2luZG93J3MgY3VycmVudCBocmVmIGlmIG5vdCBnaXZlblxuICAgKiBAcmV0dXJuIHRoZSBwYXJhbWV0ZXIncyB2YWx1ZVxuICAgKi9cbiAgc3RhdGljIGdldFBhcmFtZXRlckJ5TmFtZShuYW1lLCB1cmwpIHtcbiAgICBpZiAoIXVybCkgdXJsID0gd2luZG93LmxvY2F0aW9uLmhyZWY7XG4gICAgbmFtZSA9IG5hbWUucmVwbGFjZSgvW1xcW1xcXV0vZywgXCJcXFxcJCZcIik7XG4gICAgbGV0IHJlZ2V4ID0gbmV3IFJlZ0V4cChcIls/Jl1cIiArIG5hbWUgKyBcIig9KFteJiNdKil8JnwjfCQpXCIpLCByZXN1bHRzID0gcmVnZXguZXhlYyh1cmwpO1xuICAgIGlmICghcmVzdWx0cykgcmV0dXJuIG51bGw7XG4gICAgaWYgKCFyZXN1bHRzWzJdKSByZXR1cm4gJyc7XG4gICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudChyZXN1bHRzWzJdLnJlcGxhY2UoL1xcKy9nLCBcIiBcIikpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0cyBhIG5vbi1jcnlwdG9ncmFwaGljYWxseSBzZWN1cmUgcmFuZG9tIG51bWJlciB3aXRoaW4gYSBnaXZlbiByYW5nZS5cbiAgICogXG4gICAqIEBwYXJhbSBtaW4gaXMgdGhlIG1pbmltdW0gcmFuZ2Ugb2YgdGhlIGludCB0byBnZW5lcmF0ZSwgaW5jbHVzaXZlXG4gICAqIEBwYXJhbSBtYXggaXMgdGhlIG1heGltdW0gcmFuZ2Ugb2YgdGhlIGludCB0byBnZW5lcmF0ZSwgaW5jbHVzaXZlXG4gICAqIFxuICAgKiBTb3VyY2U6IGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL01hdGgvcmFuZG9tXG4gICAqL1xuICBzdGF0aWMgZ2V0UmFuZG9tSW50KG1pbiwgbWF4KSB7XG4gICAgbWluID0gTWF0aC5jZWlsKG1pbik7XG4gICAgbWF4ID0gTWF0aC5mbG9vcihtYXgpO1xuICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpICsgbWluO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0cyByYW5kb20gaW50cy5cbiAgICogXG4gICAqIEBwYXJhbSBtaW4gaXMgdGhlIG1pbmltdW0gcmFuZ2Ugb2YgdGhlIGludHMgdG8gZ2VuZXJhdGUsIGluY2x1c2l2ZVxuICAgKiBAcGFyYW0gbWF4IGlzIHRoZSBtYXhpbXVtIHJhbmdlIG9mIHRoZSBpbnRzIHRvIGdlbmVyYXRlLCBpbmNsdXNpdmVcbiAgICogQHBhcmFtIGNvdW50IGlzIHRoZSBudW1iZXIgb2YgcmFuZG9tIGludHMgdG8gZ2V0XG4gICAqL1xuICBzdGF0aWMgZ2V0UmFuZG9tSW50cyhtaW4sIG1heCwgY291bnQpIHtcbiAgICBHZW5VdGlscy5hc3NlcnRUcnVlKHR5cGVvZiBjb3VudCA9PT0gXCJudW1iZXJcIik7XG4gICAgbGV0IGludHMgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpKyspIGludHMucHVzaChHZW5VdGlscy5nZXRSYW5kb21JbnQobWluLCBtYXgpKTtcbiAgICByZXR1cm4gaW50cztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldHMgYSBnaXZlbiBudW1iZXIgb2YgdW5pcXVlIHJhbmRvbSBpbnRzIHdpdGhpbiBhIHJhbmdlLlxuICAgKiBcbiAgICogQHBhcmFtIG1pbiBpcyB0aGUgbWluaW11bSByYW5nZSBvZiB0aGUgaW50cyB0byBnZW5lcmF0ZSwgaW5jbHVzaXZlXG4gICAqIEBwYXJhbSBtYXggaXMgdGhlIG1heGltdW0gcmFuZ2Ugb2YgdGhlIGludHMgdG8gZ2VuZXJhdGUsIGluY2x1c2l2ZVxuICAgKiBAcGFyYW0gY291bnQgaXMgdGhlIG51bWJlciBvZiB1bmlxdWUgcmFuZG9tIGludHMgdG8gZ2V0XG4gICAqL1xuICBzdGF0aWMgZ2V0VW5pcXVlUmFuZG9tSW50cyhtaW4sIG1heCwgY291bnQpIHtcbiAgICBsZXQgaW50cyA9IFtdO1xuICAgIEdlblV0aWxzLmFzc2VydFRydWUoY291bnQgPj0gMCk7XG4gICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZShtYXggLSBtaW4gKyAxID49IGNvdW50KTtcbiAgICB3aGlsZSAoaW50cy5sZW5ndGggPCBjb3VudCkge1xuICAgICAgbGV0IHJhbmRvbUludCA9IEdlblV0aWxzLmdldFJhbmRvbUludChtaW4sIG1heCk7XG4gICAgICBpZiAoIWludHMuaW5jbHVkZXMocmFuZG9tSW50KSkgaW50cy5wdXNoKHJhbmRvbUludCk7XG4gICAgfVxuICAgIHJldHVybiBpbnRzO1xuICB9XG4gIFxuICAvKipcbiAgICogUmFuZG9taXplIGFycmF5IGVsZW1lbnQgb3JkZXIgaW4tcGxhY2UgdXNpbmcgRHVyc3RlbmZlbGQgc2h1ZmZsZSBhbGdvcml0aG0uXG4gICAqIFxuICAgKiBDcmVkaXQ6IGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzI0NTA5NTQvaG93LXRvLXJhbmRvbWl6ZS1zaHVmZmxlLWEtamF2YXNjcmlwdC1hcnJheVxuICAgKi9cbiAgc3RhdGljIHNodWZmbGUoYXJyYXkpIHtcbiAgICBmb3IgKHZhciBpID0gYXJyYXkubGVuZ3RoIC0gMTsgaSA+IDA7IGktLSkge1xuICAgICAgdmFyIGogPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAoaSArIDEpKTtcbiAgICAgIHZhciB0ZW1wID0gYXJyYXlbaV07XG4gICAgICBhcnJheVtpXSA9IGFycmF5W2pdO1xuICAgICAgYXJyYXlbal0gPSB0ZW1wO1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIFNvcnRzIGFuIGFycmF5IGJ5IG5hdHVyYWwgb3JkZXJpbmcuXG4gICAqIFxuICAgKiBAcGFyYW0gdGhlIGFycmF5IHRvIHNvcnRcbiAgICovXG4gIHN0YXRpYyBzb3J0KGFycmF5KSB7XG4gICAgYXJyYXkuc29ydCgoYSwgYikgPT4gYSA9PT0gYiA/IDAgOiBhID4gYiA/IDEgOiAtMSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBnaXZlbiB2YWx1ZSBlbnN1cmluZyBhIHByZXZpb3VzIHZhbHVlIGlzIG5vdCBvdmVyd3JpdHRlbi5cbiAgICogXG4gICAqIFRPRE86IHJlbW92ZSBmb3IgcG9ydGFiaWxpdHkgYmVjYXVzZSBmdW5jdGlvbiBwYXNzaW5nIG5vdCBzdXBwb3J0ZWQgaW4gb3RoZXIgbGFuZ3VhZ2VzLCB1c2UgcmVjb25jaWxlIG9ubHlcbiAgICogXG4gICAqIEBwYXJhbSBvYmogaXMgdGhlIG9iamVjdCB0byBpbnZva2UgdGhlIGdldHRlciBhbmQgc2V0dGVyIG9uXG4gICAqIEBwYXJhbSBnZXRGbiBnZXRzIHRoZSBjdXJyZW50IHZhbHVlXG4gICAqIEBwYXJhbSBzZXRGbiBzZXRzIHRoZSBjdXJyZW50IHZhbHVlXG4gICAqIEBwYXJhbSB2YWwgaXMgdGhlIHZhbHVlIHRvIHNldCBpZmYgaXQgZG9lcyBub3Qgb3ZlcndyaXRlIGEgcHJldmlvdXMgdmFsdWVcbiAgICogQHBhcmFtIFtjb25maWddIHNwZWNpZmllcyByZWNvbmNpbGlhdGlvbiBjb25maWd1cmF0aW9uXG4gICAqICAgICAgICBjb25maWcucmVzb2x2ZURlZmluZWQgdXNlcyBkZWZpbmVkIHZhbHVlIGlmIHRydWUgb3IgdW5kZWZpbmVkLCB1bmRlZmluZWQgaWYgZmFsc2VcbiAgICogICAgICAgIGNvbmZpZy5yZXNvbHZlVHJ1ZSB1c2VzIHRydWUgb3ZlciBmYWxzZSBpZiB0cnVlLCBmYWxzZSBvdmVyIHRydWUgaWYgZmFsc2UsIG11c3QgYmUgZXF1YWwgaWYgdW5kZWZpbmVkXG4gICAqICAgICAgICBjb25maWcucmVzb2x2ZU1heCB1c2VzIG1heCBvdmVyIG1pbiBpZiB0cnVlLCBtaW4gb3ZlciBtYXggaWYgZmFsc2UsIG11c3QgYmUgZXF1YWwgaWYgdW5kZWZpbmVkXG4gICAqIEBwYXJhbSBbZXJyTXNnXSBpcyB0aGUgZXJyb3IgbWVzc2FnZSB0byB0aHJvdyBpZiB0aGUgdmFsdWVzIGNhbm5vdCBiZSByZWNvbmNpbGVkIChvcHRpb25hbClcbiAgICovXG4gIHN0YXRpYyBzYWZlU2V0KG9iaiwgZ2V0Rm4sIHNldEZuLCB2YWwsIGNvbmZpZz8sIGVyck1zZz8pIHtcbiAgICBsZXQgY3VyVmFsID0gZ2V0Rm4uY2FsbChvYmopO1xuICAgIGxldCByZWNvbmNpbGVkVmFsID0gR2VuVXRpbHMucmVjb25jaWxlKGN1clZhbCwgdmFsLCBjb25maWcsIGVyck1zZyk7XG4gICAgaWYgKGN1clZhbCAhPT0gcmVjb25jaWxlZFZhbCkgc2V0Rm4uY2FsbChvYmosIHJlY29uY2lsZWRWYWwpO1xuICB9XG4gIFxuICAvKipcbiAgICogUmVjb25jaWxlcyB0d28gdmFsdWVzLlxuICAgKiBcbiAgICogVE9ETzogcmVtb3ZlIGN1c3RvbSBlcnJvciBtZXNzYWdlXG4gICAqIFxuICAgKiBAcGFyYW0gdmFsMSBpcyBhIHZhbHVlIHRvIHJlY29uY2lsZVxuICAgKiBAcGFyYW0gdmFsMiBpcyBhIHZhbHVlIHRvIHJlY29uY2lsZVxuICAgKiBAcGFyYW0gW2NvbmZpZ10gc3BlY2lmaWVzIHJlY29uY2lsaWF0aW9uIGNvbmZpZ3VyYXRpb25cbiAgICogICAgICAgIGNvbmZpZy5yZXNvbHZlRGVmaW5lZCB1c2VzIGRlZmluZWQgdmFsdWUgaWYgdHJ1ZSBvciB1bmRlZmluZWQsIHVuZGVmaW5lZCBpZiBmYWxzZVxuICAgKiAgICAgICAgY29uZmlnLnJlc29sdmVUcnVlIHVzZXMgdHJ1ZSBvdmVyIGZhbHNlIGlmIHRydWUsIGZhbHNlIG92ZXIgdHJ1ZSBpZiBmYWxzZSwgbXVzdCBiZSBlcXVhbCBpZiB1bmRlZmluZWRcbiAgICogICAgICAgIGNvbmZpZy5yZXNvbHZlTWF4IHVzZXMgbWF4IG92ZXIgbWluIGlmIHRydWUsIG1pbiBvdmVyIG1heCBpZiBmYWxzZSwgbXVzdCBiZSBlcXVhbCBpZiB1bmRlZmluZWRcbiAgICogQHBhcmFtIFtlcnJNc2ddIGlzIHRoZSBlcnJvciBtZXNzYWdlIHRvIHRocm93IGlmIHRoZSB2YWx1ZXMgY2Fubm90IGJlIHJlY29uY2lsZWQgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHRoZSByZWNvbmNpbGVkIHZhbHVlIGlmIHJlY29uY2lsYWJsZSwgdGhyb3dzIGVycm9yIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIHJlY29uY2lsZSh2YWwxLCB2YWwyLCBjb25maWc/LCBlcnJNc2c/KSB7XG4gICAgXG4gICAgLy8gY2hlY2sgZm9yIGVxdWFsaXR5XG4gICAgaWYgKHZhbDEgPT09IHZhbDIpIHJldHVybiB2YWwxO1xuICAgIFxuICAgIC8vIGNoZWNrIGZvciBiaWdpbnQgZXF1YWxpdHlcbiAgICBsZXQgY29tcGFyaXNvbjsgLy8gc2F2ZSBjb21wYXJpc29uIGZvciBsYXRlciBpZiBhcHBsaWNhYmxlXG4gICAgaWYgKHR5cGVvZiB2YWwxID09PSBcImJpZ2ludFwiICYmIHR5cGVvZiB2YWwyID09PSBcImJpZ2ludFwiKSB7XG4gICAgICBpZiAodmFsMSA9PT0gdmFsMikgcmV0dXJuIHZhbDE7XG4gICAgfVxuICAgIFxuICAgIC8vIHJlc29sdmUgb25lIHZhbHVlIGRlZmluZWRcbiAgICBpZiAodmFsMSA9PT0gdW5kZWZpbmVkIHx8IHZhbDIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKGNvbmZpZyAmJiBjb25maWcucmVzb2x2ZURlZmluZWQgPT09IGZhbHNlKSByZXR1cm4gdW5kZWZpbmVkOyAgLy8gdXNlIHVuZGVmaW5lZFxuICAgICAgZWxzZSByZXR1cm4gdmFsMSA9PT0gdW5kZWZpbmVkID8gdmFsMiA6IHZhbDE7ICAvLyB1c2UgZGVmaW5lZCB2YWx1ZVxuICAgIH1cbiAgICBcbiAgICAvLyByZXNvbHZlIGRpZmZlcmVudCBib29sZWFuc1xuICAgIGlmIChjb25maWcgJiYgY29uZmlnLnJlc29sdmVUcnVlICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIHZhbDEgPT09IFwiYm9vbGVhblwiICYmIHR5cGVvZiB2YWwyID09PSBcImJvb2xlYW5cIikge1xuICAgICAgYXNzZXJ0LmVxdWFsKHR5cGVvZiBjb25maWcucmVzb2x2ZVRydWUsIFwiYm9vbGVhblwiKTtcbiAgICAgIHJldHVybiBjb25maWcucmVzb2x2ZVRydWU7XG4gICAgfVxuICAgIFxuICAgIC8vIHJlc29sdmUgZGlmZmVyZW50IG51bWJlcnNcbiAgICBpZiAoY29uZmlnICYmIGNvbmZpZy5yZXNvbHZlTWF4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGFzc2VydC5lcXVhbCh0eXBlb2YgY29uZmlnLnJlc29sdmVNYXgsIFwiYm9vbGVhblwiKTtcbiAgICAgIFxuICAgICAgLy8gcmVzb2x2ZSBqcyBudW1iZXJzXG4gICAgICBpZiAodHlwZW9mIHZhbDEgPT09IFwibnVtYmVyXCIgJiYgdHlwZW9mIHZhbDIgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5yZXNvbHZlTWF4ID8gTWF0aC5tYXgodmFsMSwgdmFsMikgOiBNYXRoLm1pbih2YWwxLCB2YWwyKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gcmVzb2x2ZSBiaWdpbnRzXG4gICAgICBpZiAodHlwZW9mIHZhbDEgPT09IFwiYmlnaW50XCIgJiYgdHlwZW9mIHZhbDIgPT09IFwiYmlnaW50XCIpIHtcbiAgICAgICAgcmV0dXJuIGNvbmZpZy5yZXNvbHZlTWF4ID8gKGNvbXBhcmlzb24gPCAwID8gdmFsMiA6IHZhbDEpIDogKGNvbXBhcmlzb24gPCAwID8gdmFsMSA6IHZhbDIpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBhc3NlcnQgZGVlcCBlcXVhbGl0eVxuICAgIGFzc2VydC5kZWVwRXF1YWwodmFsMSwgdmFsMiwgZXJyTXNnID8gZXJyTXNnIDogXCJDYW5ub3QgcmVjb25jaWxlIHZhbHVlcyBcIiArIHZhbDEgKyBcIiBhbmQgXCIgKyB2YWwyICsgXCIgd2l0aCBjb25maWc6IFwiICsgSlNPTi5zdHJpbmdpZnkoY29uZmlnKSk7XG4gICAgcmV0dXJuIHZhbDE7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgaHVtYW4tZnJpZW5kbHkga2V5IHZhbHVlIGxpbmUuXG4gICAqIFxuICAgKiBAcGFyYW0ga2V5IGlzIHRoZSBrZXlcbiAgICogQHBhcmFtIHZhbHVlIGlzIHRoZSB2YWx1ZVxuICAgKiBAcGFyYW0gaW5kZW50IGluZGVudHMgdGhlIGxpbmVcbiAgICogQHBhcmFtIG5ld2xpbmUgc3BlY2lmaWVzIGlmIHRoZSBzdHJpbmcgc2hvdWxkIGJlIHRlcm1pbmF0ZWQgd2l0aCBhIG5ld2xpbmUgb3Igbm90XG4gICAqIEBwYXJhbSBpZ25vcmVVbmRlZmluZWQgc3BlY2lmaWVzIGlmIHVuZGVmaW5lZCB2YWx1ZXMgc2hvdWxkIHJldHVybiBhbiBlbXB0eSBzdHJpbmdcbiAgICogQHJldHVybiB7c3RyaW5nfSBpcyB0aGUgaHVtYW4tZnJpZW5kbHkga2V5IHZhbHVlIGxpbmVcbiAgICovXG4gIHN0YXRpYyBrdkxpbmUoa2V5LCB2YWx1ZSwgaW5kZW50ID0gMCwgbmV3bGluZSA9IHRydWUsIGlnbm9yZVVuZGVmaW5lZCA9IHRydWUpIHtcbiAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCAmJiBpZ25vcmVVbmRlZmluZWQpIHJldHVybiBcIlwiO1xuICAgIHJldHVybiBHZW5VdGlscy5nZXRJbmRlbnQoaW5kZW50KSArIGtleSArIFwiOiBcIiArIHZhbHVlICsgKG5ld2xpbmUgPyAnXFxuJyA6IFwiXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogUmVwbGFjZSBiaWcgaW50ZWdlcnMgKDE2IG9yIG1vcmUgY29uc2VjdXRpdmUgZGlnaXRzKSB3aXRoIHN0cmluZ3MgaW4gb3JkZXJcbiAgICogdG8gcHJlc2VydmUgbnVtZXJpYyBwcmVjaXNpb24uXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gc3RyIGlzIHRoZSBzdHJpbmcgdG8gYmUgbW9kaWZpZWRcbiAgICogQHJldHVybiB7c3RyaW5nfSB0aGUgbW9kaWZpZWQgc3RyaW5nIHdpdGggYmlnIG51bWJlcnMgY29udmVydGVkIHRvIHN0cmluZ3NcbiAgICovXG4gIHN0YXRpYyBzdHJpbmdpZnlCaWdJbnRzKHN0cikge1xuICAgIHJldHVybiBzdHIucmVwbGFjZSgvKFwiW15cIl0qXCJcXHMqOlxccyopKFxcZHsxNix9KS9nLCAnJDFcIiQyXCInKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFByaW50IHRoZSBjdXJyZW50IHN0YWNrIHRyYWNlLiBcbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtc2cgLSBvcHRpb25hbCBtZXNzYWdlIHRvIHByaW50IHdpdGggdGhlIHRyYWNlXG4gICAqL1xuICBzdGF0aWMgcHJpbnRTdGFja1RyYWNlKG1zZykge1xuICAgIHRyeSB7IHRocm93IG5ldyBFcnJvcihtc2cpOyB9XG4gICAgY2F0Y2ggKGVycjogYW55KSB7IGNvbnNvbGUuZXJyb3IoZXJyLnN0YWNrKTsgfVxuICB9XG4gIFxuICAvKipcbiAgICogV2FpdCBmb3IgdGhlIGR1cmF0aW9uLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGR1cmF0aW9uTXMgLSB0aGUgZHVyYXRpb24gdG8gd2FpdCBmb3IgaW4gbWlsbGlzZWNvbmRzXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgd2FpdEZvcihkdXJhdGlvbk1zKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUpIHsgc2V0VGltZW91dChyZXNvbHZlLCBkdXJhdGlvbk1zKTsgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBLaWxsIHRoZSBnaXZlbiBub2RlanMgY2hpbGQgcHJvY2Vzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7Q2hpbGRQcm9jZXNzfSBwcm9jZXNzIC0gdGhlIG5vZGVqcyBjaGlsZCBwcm9jZXNzIHRvIGtpbGxcbiAgICogQHBhcmFtIHtudW1iZXIgfCBOb2RlSlMuU2lnbmFsc30gW3NpZ25hbF0gLSB0aGUga2lsbCBzaWduYWwsIGUuZy4gU0lHVEVSTSwgU0lHS0lMTCwgU0lHSU5UIChkZWZhdWx0KVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlciB8IHVuZGVmaW5lZD59IHRoZSBleGl0IGNvZGUgZnJvbSBraWxsaW5nIHRoZSBwcm9jZXNzXG4gICAqL1xuICBzdGF0aWMgYXN5bmMga2lsbFByb2Nlc3MocHJvY2VzczogQ2hpbGRQcm9jZXNzLCBzaWduYWw/OiBudW1iZXIgfCBOb2RlSlMuU2lnbmFscyk6IFByb21pc2U8bnVtYmVyIHwgdW5kZWZpbmVkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHByb2Nlc3Mub24oXCJleGl0XCIsIGZ1bmN0aW9uKGNvZGUsIHNpZ25hbCkgeyByZXNvbHZlKGNvZGUpOyB9KTtcbiAgICAgIHByb2Nlc3Mub24oXCJlcnJvclwiLCBmdW5jdGlvbihlcnIpIHsgcmVqZWN0KGVycik7IH0pO1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKCFwcm9jZXNzLmtpbGwoc2lnbmFsID09PSB1bmRlZmluZWQgPyBcIlNJR0lOVFwiIDogc2lnbmFsKSkgcmVzb2x2ZSh1bmRlZmluZWQpOyAvLyByZXNvbHZlIGltbWVkaWF0ZWx5IGlmIG5vdCBydW5uaW5nXG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTm9ybWFsaXplIGEgVVJJLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVyaSAtIHRoZSBVUkkgdG8gbm9ybWFsaXplXG4gICAqIEByZXR1cm4ge3N0cmluZ30gdGhlIG5vcm1hbGl6ZWQgVVJJXG4gICAqL1xuICBzdGF0aWMgbm9ybWFsaXplVXJpKHVyaSkge1xuICAgIGlmICghdXJpKSB0aHJvdyBFcnJvcihcIk11c3QgcHJvdmlkZSBVUkkgdG8gbm9ybWFsaXplXCIpO1xuICAgIHVyaSA9IHVyaS5yZXBsYWNlKC9cXC8kLywgXCJcIik7IC8vIHN0cmlwIHRyYWlsaW5nIHNsYXNoXG4gICAgaWYgKCFuZXcgUmVnRXhwKFwiXlxcXFx3KzovLy4rXCIpLnRlc3QodXJpKSkgdXJpPSBcImh0dHA6Ly9cIiArIHVyaTsgLy8gYXNzdW1lIGh0dHAgaWYgcHJvdG9jb2wgbm90IGdpdmVuXG4gICAgcmV0dXJuIHVyaTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdHdvIHByb3h5IFVSSXMgcmVmZXIgdG8gdGhlIHNhbWUgaG9zdCBhbmQgcG9ydCwgcmVnYXJkbGVzcyBvZiBzY2hlbWUuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1cmkxIC0gZmlyc3QgcHJveHkgVVJJIHRvIGNvbXBhcmVcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVyaTIgLSBzZWNvbmQgcHJveHkgVVJJIHRvIGNvbXBhcmVcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgcHJveHkgVVJJcyByZWZlciB0byB0aGUgc2FtZSBob3N0IGFuZCBwb3J0XG4gICAqL1xuICBzdGF0aWMgaXNTYW1lUHJveHlVcmkodXJpMSwgdXJpMikge1xuICAgIGlmICghdXJpMSB8fCAhdXJpMikgcmV0dXJuICF1cmkxID09PSAhdXJpMjtcbiAgICBpZiAodXJpMSA9PT0gdXJpMikgcmV0dXJuIHRydWU7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHBhcnNlZDEgPSBuZXcgVVJMKEdlblV0aWxzLm5vcm1hbGl6ZVVyaSh1cmkxKSk7XG4gICAgICBjb25zdCBwYXJzZWQyID0gbmV3IFVSTChHZW5VdGlscy5ub3JtYWxpemVVcmkodXJpMikpO1xuICAgICAgcmV0dXJuIHBhcnNlZDEuaG9zdG5hbWUudG9Mb3dlckNhc2UoKSA9PT0gcGFyc2VkMi5ob3N0bmFtZS50b0xvd2VyQ2FzZSgpICYmIHBhcnNlZDEucG9ydCA9PT0gcGFyc2VkMi5wb3J0O1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGFic29sdXRlIHZhbHVlIG9mIHRoZSBnaXZlbiBiaWdpbnQgb3IgbnVtYmVyLlxuICAgKiBcbiAgICogQHBhcmFtIHtiaWdpbnQgfCBudW1iZXJ9IGJpIC0gdGhlIGJpZ2ludCBvciBudW1iZXIgdG8gZ2V0IHRoZSBhYnNvbHV0ZSB2YWx1ZSBvZlxuICAgKiBAcmV0dXJuIHtiaWdpbnQgfCBudW1iZXJ9IHRoZSBhYnNvbHV0ZSB2YWx1ZSBvZiB0aGUgZ2l2ZW4gYmlnaW50IG9yIG51bWJlclxuICAgKi9cbiAgc3RhdGljIGFicyhiaTogYmlnaW50IHwgbnVtYmVyKTogYmlnaW50IHwgbnVtYmVyIHtcbiAgICByZXR1cm4gYmkgPCAwID8gLWJpIDogYmk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGFuIGVudW0ga2V5IG5hbWUgYnkgdmFsdWUuXG4gICAqIFxuICAgKiBAcGFyYW0ge2FueX0gZW51bVR5cGUgaXMgdGhlIGVudW0gdHlwZSB0byBnZXQgdGhlIGtleSBmcm9tXG4gICAqIEBwYXJhbSB7YW55fSBlbnVtVmFsdWUgaXMgdGhlIGVudW0gdmFsdWUgdG8gZ2V0IHRoZSBrZXkgZm9yXG4gICAqIEByZXR1cm4ge3N0cmluZyB8IHVuZGVmaW5lZH0gdGhlIGVudW0ga2V5IG5hbWVcbiAgICovXG4gIHN0YXRpYyBnZXRFbnVtS2V5QnlWYWx1ZShlbnVtVHlwZTogYW55LCBlbnVtVmFsdWU6IGFueSk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgZm9yIChsZXQga2V5IGluIGVudW1UeXBlKSB7XG4gICAgICBpZiAoZW51bVR5cGVba2V5XSA9PT0gZW51bVZhbHVlKSByZXR1cm4ga2V5O1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlc29sdmUgdGhlIGdpdmVuIHByb21pc2Ugd2l0aCBhIHRpbWVvdXQuXG4gICAqIFxuICAgKiBAcGFyYW0gcHJvbWlzZSB0aGUgcHJvbWlzZSB0byByZXNvbHZlIHdpdGhpbiB0aGUgdGltZW91dFxuICAgKiBAcGFyYW0gdGltZW91dE1zIHRoZSB0aW1lb3V0IGluIG1pbGxpc2Vjb25kcyB0byByZXNvbHZlIHRoZSBwcm9taXNlXG4gICAqIEByZXR1cm4gdGhlIHJlc3VsdCBvZiB0aGUgcHJvbWlzZSB1bmxlc3MgZXJyb3IgdGhyb3duXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgZXhlY3V0ZVdpdGhUaW1lb3V0KHByb21pc2UsIHRpbWVvdXRNcyk6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICByZWplY3QoJ0V4ZWN1dGlvbiB0aW1lZCBvdXQgaW4gJyArIHRpbWVvdXRNcyArICcgbWlsbGlzZWNvbmRzJylcbiAgICAgIH0sIHRpbWVvdXRNcyk7XG4gICAgICBwcm9taXNlLnRoZW4oXG4gICAgICAgIChyZXN1bHQpID0+IHtcbiAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgIH0sXG4gICAgICAgIChlcnJvcikgPT4ge1xuICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgfSk7XG4gIH1cbn1cblxuIl0sIm1hcHBpbmdzIjoieUxBQUEsSUFBQUEsT0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMsTUFBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBOzs7OztBQUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDZSxNQUFNRSxRQUFRLENBQUM7O0VBRTVCO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE9BQU9DLFNBQVNBLENBQUNDLEdBQVEsRUFBVztJQUNsQyxPQUFPLE9BQU9BLEdBQUcsS0FBSyxXQUFXO0VBQ25DOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE9BQU9DLFdBQVdBLENBQUNELEdBQUcsRUFBVztJQUMvQixPQUFPLE9BQU9BLEdBQUcsS0FBSyxXQUFXO0VBQ25DOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE9BQU9FLGFBQWFBLENBQUNGLEdBQVEsRUFBVztJQUN0QyxPQUFPQSxHQUFH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