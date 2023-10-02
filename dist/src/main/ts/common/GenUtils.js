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
}exports.default = GenUtils;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfYXN5bmMiLCJHZW5VdGlscyIsImlzRGVmaW5lZCIsImFyZyIsImlzVW5kZWZpbmVkIiwiaXNJbml0aWFsaXplZCIsInVuZGVmaW5lZCIsImlzVW5pbml0aWFsaXplZCIsImlzTnVtYmVyIiwiaXNOYU4iLCJwYXJzZUZsb2F0IiwiaXNGaW5pdGUiLCJpc0ludCIsInBhcnNlSW50IiwiTnVtYmVyIiwiaXNBcnJheSIsIkFycmF5IiwiaXNTdHJpbmciLCJpc0Jvb2xlYW4iLCJpc0Z1bmN0aW9uIiwiaXNPYmplY3QiLCJvYmoiLCJpc1VwcGVyQ2FzZSIsInN0ciIsInRvVXBwZXJDYXNlIiwiaXNMb3dlckNhc2UiLCJ0b0xvd2VyQ2FzZSIsImFzc2VydEhleCIsIm1zZyIsImFzc2VydFRydWUiLCJpc0hleCIsImxlbmd0aCIsIm1hdGNoIiwiaXNCYXNlMzIiLCJ0ZXN0IiwiYXNzZXJ0QmFzZTU4IiwiaXNCYXNlNTgiLCJhc3NlcnRCYXNlNjQiLCJpc0Jhc2U2NCIsImJ0b2EiLCJhdG9iIiwiZXJyIiwiZmFpbCIsIkVycm9yIiwiY29uZGl0aW9uIiwiYXNzZXJ0RmFsc2UiLCJib29sIiwiYXNzZXJ0TnVsbCIsImFzc2VydE5vdE51bGwiLCJhc3NlcnREZWZpbmVkIiwiYXNzZXJ0VW5kZWZpbmVkIiwiYXNzZXJ0SW5pdGlhbGl6ZWQiLCJhc3NlcnRVbmluaXRpYWxpemVkIiwiYXNzZXJ0RXF1YWxzIiwiYXJnMSIsImFyZzIiLCJlcXVhbHMiLCJhc3NlcnROb3RFcXVhbHMiLCJhc3NlcnRJbnQiLCJhc3NlcnROdW1iZXIiLCJhc3NlcnRCb29sZWFuIiwiYXNzZXJ0U3RyaW5nIiwiYXNzZXJ0QXJyYXkiLCJhc3NlcnRGdW5jdGlvbiIsImFzc2VydE9iamVjdCIsIm5hbWUiLCJpbmhlcml0c0Zyb20iLCJjaGlsZCIsInBhcmVudCIsInByb3RvdHlwZSIsIk9iamVjdCIsImNyZWF0ZSIsImNvbnN0cnVjdG9yIiwiaW52b2tlIiwiZm5zIiwiYXJndW1lbnRzIiwiYXJncyIsImkiLCJwdXNoIiwiYXBwbHkiLCJnZXRQb3dlclNldCIsImFyciIsImZuIiwibiIsInNyYyIsImdvdCIsImFsbCIsImoiLCJzbGljZSIsImNvbmNhdCIsImdldFBvd2VyU2V0T2ZMZW5ndGgiLCJzaXplIiwicG93ZXJTZXQiLCJwb3dlclNldE9mTGVuZ3RoIiwiZ2V0SW5kaWNlcyIsImluZGljZXMiLCJ0b1VuaXF1ZUFycmF5IiwiZmlsdGVyIiwidmFsdWUiLCJpbmRleCIsInNlbGYiLCJpbmRleE9mIiwiY29weUFycmF5IiwiY29weSIsInJlbW92ZSIsInZhbCIsImZvdW5kIiwic3BsaWNlIiwidG9Mb3dlckNhc2VBcnJheSIsImFycjIiLCJsaXN0aWZ5IiwiYXJyT3JFbGVtIiwiYXJyYXlDb250YWlucyIsImNvbXBhcmVCeVJlZmVyZW5jZSIsInN0ckNvbnRhaW5zIiwic3Vic3RyaW5nIiwiYXJyYXlzRXF1YWwiLCJhcnIxIiwib2JqZWN0c0VxdWFsIiwibWFwMSIsIm1hcDIiLCJrZXlzMSIsImtleXMiLCJrZXlzMiIsImtleTEiLCJrZXkyIiwiZGVsZXRlVW5kZWZpbmVkS2V5cyIsImtleSIsImdldENvbWJpbmF0aW9ucyIsImNvbWJpbmF0aW9uU2l6ZSIsImluZGV4Q29tYmluYXRpb25zIiwiY29tYmluYXRpb25zIiwiaW5kZXhDb21iaW5hdGlvbnNJZHgiLCJpbmRleENvbWJpbmF0aW9uIiwiY29tYmluYXRpb24iLCJpbmRleENvbWJpbmF0aW9uSWR4IiwiZ2V0RG93bmxvYWRhYmxlQSIsImNvbnRlbnRzIiwiYSIsIndpbmRvdyIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImhyZWYiLCJVUkwiLCJjcmVhdGVPYmplY3RVUkwiLCJCbG9iIiwidHlwZSIsImRvd25sb2FkIiwidGFyZ2V0IiwiaW5uZXJIVE1MIiwiY29weVByb3BlcnRpZXMiLCJKU09OIiwicGFyc2UiLCJzdHJpbmdpZnkiLCJkZWxldGVQcm9wZXJ0aWVzIiwicHJvcHMiLCJwcm9wIiwidG9TdHJpbmciLCJoYXNXaGl0ZXNwYWNlIiwiaXNXaGl0ZXNwYWNlIiwiY2hhciIsImlzTmV3bGluZSIsImNvdW50Tm9uV2hpdGVzcGFjZUNoYXJhY3RlcnMiLCJjb3VudCIsImNoYXJBdCIsImdldFdoaXRlc3BhY2VUb2tlbnMiLCJnZXRMaW5lcyIsImdldEludGVybmFsU3R5bGVTaGVldCIsInN0eWxlU2hlZXRzIiwic3R5bGVTaGVldCIsImdldEludGVybmFsU3R5bGVTaGVldFRleHQiLCJpbnRlcm5hbENzcyIsImludGVybmFsU3R5bGVTaGVldCIsImNzc1J1bGVzIiwiY3NzVGV4dCIsImJ1aWxkSHRtbERvY3VtZW50IiwiY29udGVudCIsIm1ldGFzIiwibWV0YSIsImVsZW0iLCJoYXNPd25Qcm9wZXJ0eSIsInNldEF0dHJpYnV0ZSIsIm91dGVySFRNTCIsInRpdGxlIiwiZGVwZW5kZW5jeVBhdGhzIiwiZGVwZW5kZW5jeVBhdGgiLCJlbmRzV2l0aCIsImRpdiIsIiQiLCJhcHBlbmQiLCJjbG9uZSIsImh0bWwiLCJuZXdXaW5kb3ciLCJvbkxvYWQiLCJvbkxvYWRDYWxsZWQiLCJ3Iiwib3BlbiIsIm9uTG9hZE9uY2UiLCJvcGVuZXIiLCJ3cml0ZSIsImFkZEV2ZW50TGlzdGVuZXIiLCJjbG9zZSIsImltZ1RvRGF0YVVybCIsImltZyIsInF1YWxpdHkiLCJjYW52YXMiLCJoZWlnaHQiLCJuYXR1cmFsSGVpZ2h0Iiwid2lkdGgiLCJuYXR1cmFsV2lkdGgiLCJjb250ZXh0IiwiZ2V0Q29udGV4dCIsImRyYXdJbWFnZSIsInRvRGF0YVVSTCIsImlzSW1hZ2VBY2Nlc3NpYmxlIiwidXJsIiwidGltZW91dCIsIm9uRG9uZSIsInJldHVybmVkIiwiSW1hZ2UiLCJvbmxvYWQiLCJvblJlc3BvbnNlIiwib25lcnJvciIsIkRhdGUiLCJzZXRUaW1lb3V0Iiwic2V0SW1tZWRpYXRlIiwiZSIsImlzWmlwRmlsZSIsImZpbGUiLCJpc0pzb25GaWxlIiwiaXNUeHRGaWxlIiwiZ2V0SW1hZ2VzIiwicGF0aHMiLCJmdW5jcyIsImxvYWRGdW5jIiwiYXN5bmMiLCJwYXJhbGxlbCIsInBhdGgiLCJnZXRJbmRlbnQiLCJpbml0UG9seWZpbGxzIiwiYXNzaWduIiwiZGVmaW5lUHJvcGVydHkiLCJ2YXJBcmdzIiwiVHlwZUVycm9yIiwidG8iLCJuZXh0U291cmNlIiwibmV4dEtleSIsImNhbGwiLCJ3cml0YWJsZSIsImNvbmZpZ3VyYWJsZSIsIlN0cmluZyIsInN0YXJ0c1dpdGgiLCJzZWFyY2hTdHJpbmciLCJwb3NpdGlvbiIsInN1YnN0ciIsImdldFVVSUQiLCJyZXBsYWNlIiwiYyIsInIiLCJNYXRoIiwicmFuZG9tIiwidiIsImlzQnJvd3NlciIsImlzV29ya2VyIiwiaW1wb3J0U2NyaXB0cyIsImlzQnJvd3Nlck1haW4iLCJGdW5jdGlvbiIsImlzSnNEb20iLCJpc0ZpcmVmb3giLCJuYXZpZ2F0b3IiLCJ1c2VyQWdlbnQiLCJnZXRJRVZlcnNpb24iLCJ1YSIsIm1zaWUiLCJ0cmlkZW50IiwicnYiLCJlZGdlIiwiZ2V0UGFyYW1ldGVyQnlOYW1lIiwibG9jYXRpb24iLCJyZWdleCIsIlJlZ0V4cCIsInJlc3VsdHMiLCJleGVjIiwiZGVjb2RlVVJJQ29tcG9uZW50IiwiZ2V0UmFuZG9tSW50IiwibWluIiwibWF4IiwiY2VpbCIsImZsb29yIiwiZ2V0UmFuZG9tSW50cyIsImludHMiLCJnZXRVbmlxdWVSYW5kb21JbnRzIiwicmFuZG9tSW50IiwiaW5jbHVkZXMiLCJzaHVmZmxlIiwiYXJyYXkiLCJ0ZW1wIiwic29ydCIsImIiLCJzYWZlU2V0IiwiZ2V0Rm4iLCJzZXRGbiIsImNvbmZpZyIsImVyck1zZyIsImN1clZhbCIsInJlY29uY2lsZWRWYWwiLCJyZWNvbmNpbGUiLCJ2YWwxIiwidmFsMiIsImNvbXBhcmlzb24iLCJyZXNvbHZlRGVmaW5lZCIsInJlc29sdmVUcnVlIiwiYXNzZXJ0IiwiZXF1YWwiLCJyZXNvbHZlTWF4IiwiZGVlcEVxdWFsIiwia3ZMaW5lIiwiaW5kZW50IiwibmV3bGluZSIsImlnbm9yZVVuZGVmaW5lZCIsInN0cmluZ2lmeUJpZ0ludHMiLCJwcmludFN0YWNrVHJhY2UiLCJjb25zb2xlIiwiZXJyb3IiLCJzdGFjayIsIndhaXRGb3IiLCJkdXJhdGlvbk1zIiwiUHJvbWlzZSIsInJlc29sdmUiLCJraWxsUHJvY2VzcyIsInByb2Nlc3MiLCJzaWduYWwiLCJyZWplY3QiLCJvbiIsImNvZGUiLCJraWxsIiwibm9ybWFsaXplVXJpIiwidXJpIiwiYWJzIiwiYmkiLCJnZXRFbnVtS2V5QnlWYWx1ZSIsImVudW1UeXBlIiwiZW51bVZhbHVlIiwiZXhwb3J0cyIsImRlZmF1bHQiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy9jb21tb24vR2VuVXRpbHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XG5pbXBvcnQgYXN5bmMgZnJvbSBcImFzeW5jXCI7XG5pbXBvcnQgeyBDaGlsZFByb2Nlc3MgfSBmcm9tIFwiY2hpbGRfcHJvY2Vzc1wiO1xuXG4vKipcbiAqIE1JVCBMaWNlbnNlXG4gKiBcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqIFxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICogXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG4gKiBTT0ZUV0FSRS5cbiAqL1xuXG4vKipcbiAqIENvbGxlY3Rpb24gb2YgZ2VuZXJhbCBwdXJwb3NlIHV0aWxpdGllcy5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR2VuVXRpbHMge1xuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgZGVmaW5lZC5cbiAgICogXG4gICAqIEBwYXJhbSB7YW55fSBhcmcgaXMgdGhlIGFyZyB0byB0ZXN0XG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGdpdmVuIGFyZyBpcyBkZWZpbmVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc0RlZmluZWQoYXJnOiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdHlwZW9mIGFyZyAhPT0gJ3VuZGVmaW5lZCc7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBnaXZlbiBhcmd1bWVudCBpcyB1bmRlZmluZWQuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnIGlzIHRoZSBhcmcgdG8gdGVzdFxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBnaXZlbiBhcmcgaXMgdW5kZWZpbmVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc1VuZGVmaW5lZChhcmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBnaXZlbiBhcmcgaXMgaW5pdGlhbGl6ZWQuXG4gICAqIFxuICAgKiBAcGFyYW0ge2FueX0gYXJnIGlzIHRoZSBhcmcgdG8gdGVzdFxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBnaXZlbiBhcmcgaXMgaW5pdGlhbGl6ZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGlzSW5pdGlhbGl6ZWQoYXJnOiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gYXJnICE9PSB1bmRlZmluZWQgJiYgYXJnICE9PSBudWxsO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZ2l2ZW4gYXJnIGlzIHVuaW5pdGlhbGl6ZWQuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnIGlzIHRoZSBhcmcgdG8gdGVzdFxuICAgKiBAcmV0dXJuIHRydWUgaWYgdGhlIGdpdmVuIGFyZyBpcyB1bmluaXRpYWxpemVkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc1VuaW5pdGlhbGl6ZWQoYXJnOiBhbnkpOiBib29sZWFuIHtcbiAgICBpZiAoIWFyZykgcmV0dXJuIHRydWU7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYSBudW1iZXIuXG4gICAqIFxuICAgKiBAcGFyYW0ge2FueX0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byB0ZXN0XG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGFyZ3VtZW50IGlzIGEgbnVtYmVyLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc051bWJlcihhcmc6IGFueSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhaXNOYU4ocGFyc2VGbG9hdChhcmcpKSAmJiBpc0Zpbml0ZShhcmcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYW4gaW50ZWdlci5cbiAgICogXG4gICAqIEBwYXJhbSB7YW55fSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIHRlc3RcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYW4gaW50ZWdlciwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaXNJbnQoYXJnOiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gYXJnID09PSBwYXJzZUludChcIlwiICsgTnVtYmVyKGFyZykpICYmICFpc05hTihhcmcpICYmICFpc05hTihwYXJzZUludChhcmcsIDEwKSk7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhbiBhcnJheS5cbiAgICogXG4gICAqIEBwYXJhbSB7YW55fSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIHRlc3QgYXMgYmVpbmcgYW4gYXJyYXlcbiAgICogQHJldHVybiB7Ym9vb2xlYW59IHRydWUgaWYgdGhlIGFyZ3VtZW50IGlzIGFuIGFycmF5LCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc0FycmF5KGFyZzogYW55KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGFyZyBpbnN0YW5jZW9mIEFycmF5ICYmIEFycmF5LmlzQXJyYXkoYXJnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGEgc3RyaW5nLlxuICAgKiBcbiAgICogQHBhcmFtIHthbnl9IGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gdGVzdCBhcyBiZWluZyBhIHN0cmluZ1xuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBhcmd1bWVudCBpcyBhIHN0cmluZywgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaXNTdHJpbmcoYXJnOiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ3N0cmluZyc7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyBpZiB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYSBib29sZWFuLlxuICAgKiBcbiAgICogQHBhcmFtIHthbnl9IGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gdGVzdCBhcyBiZWluZyBhIGJvb2xlYW5cbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGUgYXJndW1lbnQgaXMgYSBib29sZWFuLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc0Jvb2xlYW4oYXJnOiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdHlwZW9mKGFyZykgPT0gdHlwZW9mKHRydWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGEgc3RhdGljLlxuICAgKiBcbiAgICogQHBhcmFtIHthbnl9IGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gdGVzdCBhcyBiZWluZyBhIHN0YXRpY1xuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBhcmd1bWVudCBpcyBhIHN0YXRpYywgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaXNGdW5jdGlvbihhcmc6IGFueSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0eXBlb2YgYXJnID09PSBcImZ1bmN0aW9uXCI7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhbiBvYmplY3QgYW5kIG9wdGlvbmFsbHkgaWYgaXQgaGFzIHRoZSBnaXZlbiBjb25zdHJ1Y3RvciBuYW1lLlxuICAgKiBcbiAgICogQHBhcmFtIHthbnl9IGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gdGVzdFxuICAgKiBAcGFyYW0ge2FueX0gb2JqIGlzIGFuIG9iamVjdCB0byB0ZXN0IGFyZyBpbnN0YW5jZW9mIG9iaiAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGFuIG9iamVjdCBhbmQgb3B0aW9uYWxseSBoYXMgdGhlIGdpdmVuIGNvbnN0cnVjdG9yIG5hbWVcbiAgICovXG4gIHN0YXRpYyBpc09iamVjdChhcmc6IGFueSwgb2JqPzogYW55KTogYm9vbGVhbiB7XG4gICAgaWYgKCFhcmcpIHJldHVybiBmYWxzZTtcbiAgICBpZiAodHlwZW9mIGFyZyAhPT0gJ29iamVjdCcpIHJldHVybiBmYWxzZTtcbiAgICBpZiAob2JqICYmICEoYXJnIGluc3RhbmNlb2Ygb2JqKSkgcmV0dXJuIGZhbHNlO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgYWxsIGFscGhhYmV0IGNoYXJhY3RlcnMgaW4gdGhlIGdpdmVuIHN0cmluZyBhcmUgdXBwZXIgY2FzZS5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzdHIgaXMgdGhlIHN0cmluZyB0byB0ZXN0XG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIHN0cmluZyBpcyB1cHBlciBjYXNlLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc1VwcGVyQ2FzZShzdHI6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBzdHIudG9VcHBlckNhc2UoKSA9PT0gc3RyO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgYWxsIGFscGhhYmV0IGNoYXJhY3RlcnMgaW4gdGhlIGdpdmVuIHN0cmluZyBhcmUgbG93ZXIgY2FzZS5cbiAgICogXG4gICAqIEBwYXJhbSBzdHIgaXMgdGhlIHN0cmluZyB0byB0ZXN0XG4gICAqIEBwYXJhbSB0cnVlIGlmIHRoZSBzdHJpbmcgaXMgbG93ZXIgY2FzZSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaXNMb3dlckNhc2Uoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci50b0xvd2VyQ2FzZSgpID09PSBzdHI7XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBhcmd1bWVudCBpcyBoZXguXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byBhc3NlcnQgYXMgaGV4XG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgdGhlIGFyZ3VtZW50IGlzIG5vdCBoZXhcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRIZXgoc3RyLCBtc2cpIHtcbiAgICBHZW5VdGlscy5hc3NlcnRUcnVlKEdlblV0aWxzLmlzSGV4KHN0ciksIG1zZyA/IG1zZyA6IFwiQXJndW1lbnQgYXNzZXJ0ZWQgYXMgaGV4IGJ1dCBpcyBub3QgaGV4XCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYSBoZXhpZGVtYWwgc3RyaW5nLlxuICAgKiBcbiAgICogQ3JlZGl0OiBodHRwczovL2dpdGh1Yi5jb20vcm9yeXJqYi9pcy1oZXgvYmxvYi9tYXN0ZXIvaXMtaGV4LmpzLlxuICAgKiBcbiAgICogQHBhcmFtIHN0ciBpcyB0aGUgc3RyaW5nIHRvIHRlc3RcbiAgICogQHJldHVybiB0cnVlIGlmIHRoZSBnaXZlbiBzdHJpbmcgaXMgaGV4aWRlY2ltYWwsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIGlzSGV4KGFyZykge1xuICAgIGlmICh0eXBlb2YgYXJnICE9PSAnc3RyaW5nJykgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChhcmcubGVuZ3RoID09PSAwKSByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIChhcmcubWF0Y2goLyhbMC05XXxbYS1mXSkvZ2ltKSB8fCBbXSkubGVuZ3RoID09PSBhcmcubGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgdGhlIGdpdmVuIHN0cmluZyBpcyBiYXNlMzIuXG4gICAqL1xuICBzdGF0aWMgaXNCYXNlMzIoc3RyKSB7XG4gICAgaWYgKHR5cGVvZiBzdHIgIT09ICdzdHJpbmcnKSByZXR1cm4gZmFsc2U7XG4gICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZShzdHIubGVuZ3RoID4gMCwgXCJDYW5ub3QgZGV0ZXJtaW5lIGlmIGVtcHR5IHN0cmluZyBpcyBiYXNlMzJcIik7XG4gICAgcmV0dXJuIC9eW0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaMjM0NTY3XSskLy50ZXN0KHN0cik7XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBhcmd1bWVudCBpcyBiYXNlNTguXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byBhc3NlcnQgYXMgYmFzZTU4XG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgdGhlIGFyZ3VtZW50IGlzIG5vdCBiYXNlNThcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRCYXNlNTgoc3RyLCBtc2cpIHtcbiAgICBHZW5VdGlscy5hc3NlcnRUcnVlKEdlblV0aWxzLmlzQmFzZTU4KHN0ciksIG1zZyA/IG1zZyA6IFwiQXJndW1lbnQgYXNzZXJ0ZWQgYXMgYmFzZTU4IGJ1dCBpcyBub3QgYmFzZTU4XCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgdGhlIGdpdmVuIHN0cmluZyBpcyBiYXNlNTguXG4gICAqL1xuICBzdGF0aWMgaXNCYXNlNTgoc3RyKSB7XG4gICAgaWYgKHR5cGVvZiBzdHIgIT09ICdzdHJpbmcnKSByZXR1cm4gZmFsc2U7XG4gICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZShzdHIubGVuZ3RoID4gMCwgXCJDYW5ub3QgZGV0ZXJtaW5lIGlmIGVtcHR5IHN0cmluZyBpcyBiYXNlNThcIik7XG4gICAgcmV0dXJuIC9eWzEyMzQ1Njc4OUFCQ0RFRkdISktMTU5QUVJTVFVWV1hZWmFiY2RlZmdoaWprbW5vcHFyc3R1dnd4eXpdKyQvLnRlc3Qoc3RyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGJhc2U2NC5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIGFzc2VydCBhcyBiYXNlNjRcbiAgICogQHBhcmFtIG1zZyBpcyB0aGUgbWVzc2FnZSB0byB0aHJvdyBpZiB0aGUgYXJndW1lbnQgaXMgbm90IGJhc2U2NFxuICAgKi9cbiAgc3RhdGljIGFzc2VydEJhc2U2NChzdHIsIG1zZykge1xuICAgIEdlblV0aWxzLmFzc2VydFRydWUoR2VuVXRpbHMuaXNCYXNlNjQoc3RyKSwgbXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBiYXNlNjQgYnV0IGlzIG5vdCBiYXNlNjRcIik7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyBpZiB0aGUgZ2l2ZW4gc3RyaW5nIGlzIGJhc2U2NC5cbiAgICovXG4gIHN0YXRpYyBpc0Jhc2U2NChzdHIpIHtcbiAgICBpZiAodHlwZW9mIHN0ciAhPT0gJ3N0cmluZycpIHJldHVybiBmYWxzZTtcbiAgICBHZW5VdGlscy5hc3NlcnRUcnVlKHN0ci5sZW5ndGggPiAwLCBcIkNhbm5vdCBkZXRlcm1pbmUgaWYgZW1wdHkgc3RyaW5nIGlzIGJhc2U2NFwiKTtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGJ0b2EoYXRvYihzdHIpKSA9PSBzdHI7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRocm93cyBhbiBleGNlcHRpb24gd2l0aCB0aGUgZ2l2ZW4gbWVzc2FnZS5cbiAgICogXG4gICAqIEBwYXJhbSBtc2cgZGVmaW5lcyB0aGUgbWVzc2FnZSB0byB0aHJvdyB0aGUgZXhjZXB0aW9uIHdpdGggKG9wdGlvbmFsKVxuICAgKi9cbiAgc3RhdGljIGZhaWwobXNnPykge1xuICAgIHRocm93IG5ldyBFcnJvcihtc2cgPyBtc2cgOiBcIkZhaWx1cmUgKG5vIG1lc3NhZ2UpXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gY29uZGl0aW9uIGlzIHRydWUuICBUaHJvd3MgYW4gZXhjZXB0aW9uIGlmIG5vdCBhIGJvb2xlYW4gb3IgZmFsc2UuXG4gICAqIFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGNvbmRpdGlvbiBpcyB0aGUgYm9vbGVhbiB0byBhc3NlcnQgdHJ1ZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW21zZ10gaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgY29uZGl0aW9uIGlzIGZhbHNlIChvcHRpb25hbClcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRUcnVlKGNvbmRpdGlvbiwgbXNnPykge1xuICAgIGlmICh0eXBlb2YgY29uZGl0aW9uICE9PSAnYm9vbGVhbicpIHRocm93IG5ldyBFcnJvcihcIkFyZ3VtZW50IGlzIG5vdCBhIGJvb2xlYW5cIik7XG4gICAgaWYgKCFjb25kaXRpb24pIHRocm93IG5ldyBFcnJvcihtc2cgPyBtc2cgOiBcIkJvb2xlYW4gYXNzZXJ0ZWQgYXMgdHJ1ZSBidXQgd2FzIGZhbHNlXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYm9vbGVhbiBpcyBmYWxzZS4gIFRocm93cyBhbiBleGNlcHRpb24gaWYgbm90IGEgYm9vbGVhbiBvciB0cnVlLlxuICAgKiBcbiAgICogQHBhcmFtIGJvb2wgaXMgdGhlIGJvb2xlYW4gdG8gYXNzZXJ0IGZhbHNlXG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgYm9vbCBpcyB0cnVlIChvcHRpb25hbClcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRGYWxzZShib29sLCBtc2c/KSB7XG4gICAgaWYgKHR5cGVvZiBib29sICE9PSAnYm9vbGVhbicpIHRocm93IG5ldyBFcnJvcihcIkFyZ3VtZW50IGlzIG5vdCBhIGJvb2xlYW5cIik7XG4gICAgaWYgKGJvb2wpIHRocm93IG5ldyBFcnJvcihtc2cgPyBtc2cgOiBcIkJvb2xlYW4gYXNzZXJ0ZWQgYXMgZmFsc2UgYnV0IHdhcyB0cnVlXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgbnVsbC4gIFRocm93cyBhbiBleGNlcHRpb24gaWYgbm90IG51bGwuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byBhc3NlcnQgbnVsbFxuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIGFyZyBpcyBub3QgbnVsbCAob3B0aW9uYWwpXG4gICAqL1xuICBzdGF0aWMgYXNzZXJ0TnVsbChhcmcsIG1zZz8pIHtcbiAgICBpZiAoYXJnICE9PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBudWxsIGJ1dCB3YXMgbm90IG51bGw6IFwiICsgYXJnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIG5vdCBudWxsLiAgVGhyb3dzIGFuIGV4Y2VwdGlvbiBpZiBudWxsLlxuICAgKiBcbiAgICogQHBhcmFtIGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gYXNzZXJ0IG5vdCBudWxsXG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgYXJnIGlzIG51bGwgKG9wdGlvbmFsKVxuICAgKi9cbiAgc3RhdGljIGFzc2VydE5vdE51bGwoYXJnLCBtc2c/KSB7XG4gICAgaWYgKGFyZyA9PT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKG1zZyA/IG1zZyA6IFwiQXJndW1lbnQgYXNzZXJ0ZWQgYXMgbm90IG51bGwgYnV0IHdhcyBudWxsXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgZGVmaW5lZC4gIFRocm93cyBhbiBleGNlcHRpb24gaWYgdW5kZWZpbmVkLlxuICAgKiBcbiAgICogQHBhcmFtIGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gYXNzZXJ0IGRlZmluZWRcbiAgICogQHBhcmFtIG1zZyBpcyB0aGUgbWVzc2FnZSB0byB0aHJvdyBpZiBhcmcgaXMgdW5kZWZpbmVkIChvcHRpb25hbClcbiAgICovXG4gIHN0YXRpYyBhc3NlcnREZWZpbmVkKGFyZywgbXNnPykge1xuICAgIGlmIChHZW5VdGlscy5pc1VuZGVmaW5lZChhcmcpKSB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBkZWZpbmVkIGJ1dCB3YXMgdW5kZWZpbmVkXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgdW5kZWZpbmVkLiAgVGhyb3dzIGFuIGV4Y2VwdGlvbiBpZiBkZWZpbmVkLlxuICAgKiBcbiAgICogQHBhcmFtIGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gYXNzZXJ0IHVuZGVmaW5lZFxuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIGFyZyBpcyBkZWZpbmVkIChvcHRpb25hbClcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRVbmRlZmluZWQoYXJnLCBtc2c/KSB7XG4gICAgaWYgKEdlblV0aWxzLmlzRGVmaW5lZChhcmcpKSB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyB1bmRlZmluZWQgYnV0IHdhcyBkZWZpbmVkOiBcIiArIGFyZyk7XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBhcmd1bWVudCBpcyBpbml0aWFsaXplZC4gIFRocm93cyBhbiBleGNlcHRpb24gaWYgbm90IGluaXRpYWxpemVkLlxuICAgKiBcbiAgICogQHBhcmFtIGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gYXNzZXJ0IGFzIGluaXRpYWxpemVkXG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgYXJnIGlzIG5vdCBpbml0aWFsaXplZCAob3B0aW9uYWwpXG4gICAqL1xuICBzdGF0aWMgYXNzZXJ0SW5pdGlhbGl6ZWQoYXJnLCBtc2c/KSB7XG4gICAgaWYgKEdlblV0aWxzLmlzVW5pbml0aWFsaXplZChhcmcpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBpbml0aWFsaXplZCBidXQgd2FzIFwiICsgYXJnKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBhcmd1bWVudCBpcyB1bmluaXRpYWxpemVkLiAgVGhyb3dzIGFuIGV4Y2VwdGlvbiBpZiBpbml0aWFsaXplZC5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIGFzc2VydCBhcyB1bmluaXRpYWxpemVkXG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgYXJnIGlzIGluaXRpYWxpemVkIChvcHRpb25hbClcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRVbmluaXRpYWxpemVkKGFyZywgbXNnPykge1xuICAgIGlmIChHZW5VdGlscy5pc0luaXRpYWxpemVkKGFyZykpIHRocm93IG5ldyBFcnJvcihtc2cgPyBtc2cgOiBcIkFyZ3VtZW50IGFzc2VydGVkIGFzIHVuaW5pdGlhbGl6ZWQgYnV0IHdhcyBpbml0aWFsaXplZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIGdpdmVuIGFyZ3VtZW50cyBhcmUgZXF1YWwuICBUaHJvd3MgYW4gZXhjZXB0aW9uIGlmIG5vdCBlcXVhbC5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcxIGlzIGFuIGFyZ3VtZW50IHRvIGFzc2VydCBhcyBlcXVhbFxuICAgKiBAcGFyYW0gYXJnMiBpcyBhbiBhcmd1bWVudCB0byBhc3NlcnQgYXMgZXF1YWxcbiAgICogQHBhcmFtIG1zZyBpcyB0aGUgbWVzc2FnZSB0byB0aHJvdyBpZiB0aGUgYXJndW1lbnRzIGFyZSBub3QgZXF1YWxcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRFcXVhbHMoYXJnMSwgYXJnMiwgbXNnPykge1xuICAgIEdlblV0aWxzLmFzc2VydFRydWUoR2VuVXRpbHMuZXF1YWxzKGFyZzEsIGFyZzIpLCBtc2cgPyBtc2cgOiBcIkFyZ3VtZW50cyBhc3NlcnRlZCBhcyBlcXVhbCBidXQgYXJlIG5vdCBlcXVhbDogXCIgKyBhcmcxICsgXCIgdnMgXCIgKyBhcmcyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIGdpdmVuIGFyZ3VtZW50cyBhcmUgbm90IGVxdWFsLiAgVGhyb3dzIGFuIGV4Y2VwdGlvbiBpZiBlcXVhbC5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcxIGlzIGFuIGFyZ3VtZW50IHRvIGFzc2VydCBhcyBub3QgZXF1YWxcbiAgICogQHBhcmFtIGFyZzIgaXMgYW4gYXJndW1lbnQgdG8gYXNzZXJ0IGFzIG5vdCBlcXVhbFxuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIHRoZSBhcmd1bWVudHMgYXJlIGVxdWFsXG4gICAqL1xuICBzdGF0aWMgYXNzZXJ0Tm90RXF1YWxzKGFyZzEsIGFyZzIsIG1zZz8pIHtcbiAgICBpZiAoYXJnMSA9PT0gYXJnMikgdGhyb3cgbmV3IEVycm9yKG1zZyA/IG1zZyA6IFwiQXJndW1lbnRzIGFzc2VydGVkIGFzIG5vdCBlcXVhbCBidXQgYXJlIGVxdWFsOiBcIiArIGFyZzEgKyBcIiB2cyBcIiArIGFyZzIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYW4gaW50ZWdlci5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIGFzc2VydCBhcyBhbiBpbnRlZ2VyXG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgdGhlIGFyZ3VtZW50IGlzIG5vdCBhbiBpbnRlZ2VyXG4gICAqL1xuICBzdGF0aWMgYXNzZXJ0SW50KGFyZywgbXNnPykge1xuICAgIGlmICghR2VuVXRpbHMuaXNJbnQoYXJnKSkgdGhyb3cgbmV3IEVycm9yKG1zZyA/IG1zZyA6IFwiQXJndW1lbnQgYXNzZXJ0ZWQgYXMgYW4gaW50ZWdlciBidXQgaXMgbm90IGFuIGludGVnZXJcIik7XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhIG51bWJlci5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIGFzc2VydCBhcyBhIG51bWJlclxuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIHRoZSBhcmd1bWVudCBpcyBub3QgYSBudW1iZXJcbiAgICovXG4gIHN0YXRpYyBhc3NlcnROdW1iZXIoYXJnLCBtc2c/KSB7XG4gICAgaWYgKCFHZW5VdGlscy5pc051bWJlcihhcmcpKSB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBhIG51bWJlciBidXQgaXMgbm90IGEgbnVtYmVyXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYSBib29sZWFuLlxuICAgKiBcbiAgICogQHBhcmFtIGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gYXNzZXJ0IGFzIGEgYm9vbGVhblxuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIHRoZSBhcmd1bWVudCBpcyBub3QgYSBib29sZWFuXG4gICAqL1xuICBzdGF0aWMgYXNzZXJ0Qm9vbGVhbihhcmcsIG1zZz8pIHtcbiAgICBpZiAoIUdlblV0aWxzLmlzQm9vbGVhbihhcmcpKSB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBhIGJvb2xlYW4gYnV0IGlzIG5vdCBhIGJvb2xlYW5cIik7XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhIHN0cmluZy5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIGFzc2VydCBhcyBhIHN0cmluZ1xuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIHRoZSBhcmd1bWVudCBpcyBub3QgYSBzdHJpbmdcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRTdHJpbmcoYXJnLCBtc2c/KSB7XG4gICAgaWYgKCFHZW5VdGlscy5pc1N0cmluZyhhcmcpKSB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBhIHN0cmluZyBidXQgaXMgbm90IGEgc3RyaW5nOiBcIiArIGFyZyk7XG4gIH1cblxuICAvKipcbiAgICogQXNzZXJ0cyB0aGF0IHRoZSBnaXZlbiBhcmd1bWVudCBpcyBhbiBhcnJheS5cbiAgICogXG4gICAqIEBwYXJhbSBhcmcgaXMgdGhlIGFyZ3VtZW50IHRvIGFzc2VydCBhcyBhbiBhcnJheVxuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIHRoZSBhcmd1bWVudCBpcyBub3QgYW4gYXJyYXlcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRBcnJheShhcmcsIG1zZz8pIHtcbiAgICBpZiAoIUdlblV0aWxzLmlzQXJyYXkoYXJnKSkgdGhyb3cgbmV3IEVycm9yKG1zZyA/IG1zZyA6IFwiQXJndW1lbnQgYXNzZXJ0ZWQgYXMgYW4gYXJyYXkgYnV0IGlzIG5vdCBhbiBhcnJheVwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NlcnRzIHRoYXQgdGhlIGdpdmVuIGFyZ3VtZW50IGlzIGEgc3RhdGljLlxuICAgKiBcbiAgICogQHBhcmFtIGFyZyBpcyB0aGUgYXJndW1lbnQgdG8gYXNzZXJ0IGFzIGEgc3RhdGljXG4gICAqIEBwYXJhbSBtc2cgaXMgdGhlIG1lc3NhZ2UgdG8gdGhyb3cgaWYgdGhlIGFyZ3VtZW50IGlzIG5vdCBhIHN0YXRpY1xuICAgKi9cbiAgc3RhdGljIGFzc2VydEZ1bmN0aW9uKGFyZywgbXNnPykge1xuICAgIGlmICghR2VuVXRpbHMuaXNGdW5jdGlvbihhcmcpKSB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBhIHN0YXRpYyBidXQgaXMgbm90IGEgc3RhdGljXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzc2VydHMgdGhhdCB0aGUgZ2l2ZW4gYXJndW1lbnQgaXMgYW4gb2JqZWN0IHdpdGggdGhlIGdpdmVuIG5hbWUuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnIGlzIHRoZSBhcmd1bWVudCB0byB0ZXN0XG4gICAqIEBwYXJhbSBvYmogaXMgYW4gb2JqZWN0IHRvIGFzc2VydCBhcmcgaW5zdGFuY2VvZiBvYmogKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0gbXNnIGlzIHRoZSBtZXNzYWdlIHRvIHRocm93IGlmIHRoZSBhcmd1bWVudCBpcyBub3QgdGhlIHNwZWNpZmllZCBvYmplY3RcbiAgICovXG4gIHN0YXRpYyBhc3NlcnRPYmplY3QoYXJnLCBvYmosIG1zZz8pIHtcbiAgICBHZW5VdGlscy5hc3NlcnRJbml0aWFsaXplZChhcmcsIG1zZyk7XG4gICAgaWYgKG9iaikge1xuICAgICAgaWYgKCFHZW5VdGlscy5pc09iamVjdChhcmcsIG9iaikpIHRocm93IG5ldyBFcnJvcihtc2cgPyBtc2cgOiBcIkFyZ3VtZW50IGFzc2VydGVkIGFzIG9iamVjdCAnXCIgKyBvYmoubmFtZSArIFwiJyBidXQgd2FzIG5vdFwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKCFHZW5VdGlscy5pc09iamVjdChhcmcpKSB0aHJvdyBuZXcgRXJyb3IobXNnID8gbXNnIDogXCJBcmd1bWVudCBhc3NlcnRlZCBhcyBvYmplY3QgYnV0IHdhcyBub3RcIik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIGNoaWxkJ3MgcHJvdG90eXBlIHRvIHRoZSBwYXJlbnQncyBwcm90b3R5cGUuXG4gICAqIFxuICAgKiBAcGFyYW0gY2hpbGQgaXMgdGhlIGNoaWxkIGNsYXNzXG4gICAqIEBwYXJhbSBwYXJlbnQgaXMgdGhlIHBhcmVudCBjbGFzc1xuICAgKi9cbiAgc3RhdGljIGluaGVyaXRzRnJvbShjaGlsZCwgcGFyZW50KSB7XG4gICAgY2hpbGQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShwYXJlbnQucHJvdG90eXBlKTtcbiAgICBjaGlsZC5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBjaGlsZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnZva2VzIGZ1bmN0aW9ucyB3aXRoIGFyZ3VtZW50cy5cbiAgICogXG4gICAqIGFyZ3VtZW50c1swXSBpcyBhc3N1bWVkIHRvIGJlIGFuIGFycmF5IG9mIGZ1bmN0aW9ucyB0byBpbnZva2VcbiAgICogYXJndW1lbnRzWzEuLi5uXSBhcmUgYXJncyB0byBpbnZva2UgdGhlIGZ1bmN0aW9ucyB3aXRoXG4gICAqL1xuICBzdGF0aWMgaW52b2tlKCkge1xuICAgIGxldCBmbnMgPSBhcmd1bWVudHNbMF07XG4gICAgbGV0IGFyZ3MgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykgYXJncy5wdXNoKGFyZ3VtZW50c1tpXSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIEdlblV0aWxzLmFzc2VydEZ1bmN0aW9uKGZuc1tpXSwgXCJGdW5jdGlvbnNbXCIgKyBpICsgXCJdIGlzIG5vdCBhIHN0YXRpY1wiKTtcbiAgICAgIGZuc1tpXS5hcHBseShudWxsLCBhcmdzKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgcG93ZXIgc2V0IG9mIHRoZSBnaXZlbiBhcnJheS5cbiAgICogXG4gICAqIEBwYXJhbSBhcnIgaXMgdGhlIGFycmF5IHRvIGdldCB0aGUgcG93ZXIgc2V0IG9mXG4gICAqIEByZXR1cm4gW11bXSBpcyB0aGUgcG93ZXIgc2V0IG9mIHRoZSBnaXZlbiBhcnJheVxuICAgKi9cbiAgc3RhdGljIGdldFBvd2VyU2V0KGFycikge1xuICAgIGxldCBmbiA9IGZ1bmN0aW9uKG4sIHNyYywgZ290LCBhbGwpIHtcbiAgICAgIGlmIChuID09IDApIHtcbiAgICAgICAgaWYgKGdvdC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgYWxsW2FsbC5sZW5ndGhdID0gZ290O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgc3JjLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGZuKG4gLSAxLCBzcmMuc2xpY2UoaiArIDEpLCBnb3QuY29uY2F0KFsgc3JjW2pdIF0pLCBhbGwpO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBsZXQgYWxsID0gW107XG4gICAgYWxsLnB1c2goW10pO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgICBmbihpLCBhcnIsIFtdLCBhbGwpO1xuICAgIH1cbiAgICBhbGwucHVzaChhcnIpO1xuICAgIHJldHVybiBhbGw7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgcG93ZXIgc2V0IG9mIHRoZSBnaXZlbiBhcnJheSB3aG9zZSBlbGVtZW50cyBhcmUgdGhlIGdpdmVuIHNpemUuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJyIGlzIHRoZSBhcnJheSB0byBnZXQgdGhlIHBvd2VyIHNldCBvZlxuICAgKiBAcGFyYW0gc2l6ZSBpcyB0aGUgcmVxdWlyZWQgc2l6ZSBvZiB0aGUgZWxlbWVudHMgd2l0aGluIHRoZSBwb3dlciBzZXRcbiAgICogcmV0dXJucyBbXVtdIGlzIHRoZSBwb3dlciBzZXQgb2YgdGhlIGdpdmVuIGFycmF5IHdob3NlIGVsZW1lbnRzIGFyZSB0aGUgZ2l2ZW4gc2l6ZSBcbiAgICovXG4gIHN0YXRpYyBnZXRQb3dlclNldE9mTGVuZ3RoKGFyciwgc2l6ZSkge1xuICAgIEdlblV0aWxzLmFzc2VydEluaXRpYWxpemVkKGFycik7XG4gICAgR2VuVXRpbHMuYXNzZXJ0SW5pdGlhbGl6ZWQoc2l6ZSk7XG4gICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZShzaXplID49IDEpO1xuICAgIGxldCBwb3dlclNldCA9IEdlblV0aWxzLmdldFBvd2VyU2V0KGFycik7XG4gICAgbGV0IHBvd2VyU2V0T2ZMZW5ndGggPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBvd2VyU2V0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAocG93ZXJTZXRbaV0ubGVuZ3RoID09PSBzaXplKSB7XG4gICAgICAgIHBvd2VyU2V0T2ZMZW5ndGgucHVzaChwb3dlclNldFtpXSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwb3dlclNldE9mTGVuZ3RoO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gYXJyYXkgb2YgaW5kaWNlcyBvZiB0aGUgZ2l2ZW4gc2l6ZS5cbiAgICogXG4gICAqIEBwYXJhbSBzaXplIHNwZWNpZmllcyB0aGUgc2l6ZSB0byBnZXQgaW5kaWNlcyBmb3JcbiAgICogQHJldHVybiBhcnJheSBvZiB0aGUgZ2l2ZW4gc2l6ZSB3aXRoIGluZGljZXMgc3RhcnRpbmcgYXQgMFxuICAgKi9cbiAgc3RhdGljIGdldEluZGljZXMoc2l6ZSkge1xuICAgIGxldCBpbmRpY2VzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgIGluZGljZXMucHVzaChpKTtcbiAgICB9XG4gICAgcmV0dXJuIGluZGljZXM7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIG5ldyBhcnJheSBjb250YWluaW5nIHVuaXF1ZSBlbGVtZW50cyBvZiB0aGUgZ2l2ZW4gYXJyYXkuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJyIGlzIHRoZSBhcnJheSB0byByZXR1cm4gdW5pcXVlIGVsZW1lbnRzIGZyb21cbiAgICogQHJldHVybiBhIG5ldyBhcnJheSB3aXRoIHRoZSBnaXZlbiBhcnJheSdzIHVuaXF1ZSBlbGVtZW50c1xuICAgKi9cbiAgc3RhdGljIHRvVW5pcXVlQXJyYXkoYXJyKSB7XG4gICAgcmV0dXJuIGFyci5maWx0ZXIoZnVuY3Rpb24odmFsdWUsIGluZGV4LCBzZWxmKSB7XG4gICAgICByZXR1cm4gc2VsZi5pbmRleE9mKHZhbHVlKSA9PT0gaW5kZXg7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ29waWVzIHRoZSBnaXZlbiBhcnJheS5cbiAgICogXG4gICAqIEBwYXJhbSBhcnIgaXMgdGhlIGFycmF5IHRvIGNvcHlcbiAgICogQHJldHVybiBhIGNvcHkgb2YgdGhlIGdpdmVuIGFycmF5XG4gICAqL1xuICBzdGF0aWMgY29weUFycmF5KGFycikge1xuICAgIEdlblV0aWxzLmFzc2VydEFycmF5KGFycik7XG4gICAgbGV0IGNvcHkgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykgY29weS5wdXNoKGFycltpXSk7XG4gICAgcmV0dXJuIGNvcHk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZW1vdmVzIGV2ZXJ5IGluc3RhbmNlIG9mIHRoZSBnaXZlbiB2YWx1ZSBmcm9tIHRoZSBnaXZlbiBhcnJheS5cbiAgICogXG4gICAqIEBwYXJhbSBhcnIgaXMgdGhlIGFycmF5IHRvIHJlbW92ZSB0aGUgdmFsdWUgZnJvbVxuICAgKiBAcGFyYW0gdmFsIGlzIHRoZSB2YWx1ZSB0byByZW1vdmUgZnJvbSB0aGUgYXJyYXlcbiAgICogQHJldHVybiB0cnVlIGlmIHRoZSB2YWx1ZSBpcyBmb3VuZCBhbmQgcmVtb3ZlZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgcmVtb3ZlKGFyciwgdmFsKSB7XG4gICAgbGV0IGZvdW5kID0gZmFsc2U7XG4gICAgZm9yIChsZXQgaSA9IGFyci5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgaWYgKGFycltpXSA9PT0gdmFsKSB7XG4gICAgICAgIGFyci5zcGxpY2UoaSwgMSk7XG4gICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgaS0tO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZm91bmQ7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIGNvcHkgb2YgdGhlIGdpdmVuIGFycmF5IHdoZXJlIGVhY2ggZWxlbWVudCBpcyBsb3dlcmNhc2UuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJyIGlzIHRoZSBhcnJheSB0byBjb252ZXJ0IHRvIGxvd2VyY2FzZVxuICAgKiBAcmV0dXJuIGEgY29weSBvZiB0aGUgZ2l2ZW4gYXJyYXkgd2hlcmUgZWFjaCBlbGVtZW50IGlzIGxvd2VyY2FzZVxuICAgKi9cbiAgc3RhdGljIHRvTG93ZXJDYXNlQXJyYXkoYXJyKSB7XG4gICAgbGV0IGFycjIgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuICAgICAgYXJyMi5wdXNoKGFycltpXS50b0xvd2VyQ2FzZSgpKTtcbiAgICB9XG4gICAgcmV0dXJuIGFycjI7XG4gIH1cblxuICAvKipcbiAgICogTGlzdGlmaWVzIHRoZSBnaXZlbiBhcmd1bWVudC5cbiAgICogXG4gICAqIEBwYXJhbSBhcnJPckVsZW0gaXMgYW4gYXJyYXkgb3IgYW4gZWxlbWVudCBpbiB0aGUgYXJyYXlcbiAgICogQHJldHVybiBhbiBhcnJheSB3aGljaCBpcyB0aGUgZ2l2ZW4gYXJnIGlmIGl0J3MgYW4gYXJyYXkgb3IgYW4gYXJyYXkgd2l0aCB0aGUgZ2l2ZW4gYXJnIGFzIGFuIGVsZW1lbnRcbiAgICovXG4gIHN0YXRpYyBsaXN0aWZ5KGFyck9yRWxlbSkge1xuICAgIHJldHVybiBHZW5VdGlscy5pc0FycmF5KGFyck9yRWxlbSkgPyBhcnJPckVsZW0gOiBbYXJyT3JFbGVtXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGdpdmVuIGFycmF5IGNvbnRhaW5zIHRoZSBnaXZlbiBvYmplY3QuXG4gICAqIFxuICAgKiBAcGFyYW0ge2FueX0gYXJyIC0gYXJyYXkgdGhhdCBtYXkgb3IgbWF5IG5vdCBjb250YWluIHRoZSBvYmplY3RcbiAgICogQHBhcmFtIHthbnl9IG9iaiAtIG9iamVjdCB0byBjaGVjayBmb3IgaW5jbHVzaW9uIGluIHRoZSBhcnJheVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb21wYXJlQnlSZWZlcmVuY2VdIC0gY29tcGFyZSBzdHJpY3RseSBieSByZWZlcmVuY2UsIGZvcmdvaW5nIGRlZXAgZXF1YWxpdHkgY2hlY2sgKGRlZmF1bHQgZmFsc2UpXG4gICAqIEByZXR1cm4gdHJ1ZSBpZiB0aGUgYXJyYXkgY29udGFpbnMgdGhlIG9iamVjdCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgYXJyYXlDb250YWlucyhhcnIsIG9iaiwgY29tcGFyZUJ5UmVmZXJlbmNlID0gZmFsc2UpIHtcbiAgICBHZW5VdGlscy5hc3NlcnRUcnVlKEdlblV0aWxzLmlzQXJyYXkoYXJyKSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChhcnJbaV0gPT09IG9iaikgcmV0dXJuIHRydWU7XG4gICAgICBpZiAoIWNvbXBhcmVCeVJlZmVyZW5jZSAmJiBHZW5VdGlscy5lcXVhbHMoYXJyW2ldLCBvYmopKSByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZ2l2ZW4gc3RyaW5nIGNvbnRhaW5zIHRoZSBnaXZlbiBzdWJzdHJpbmcuXG4gICAqIFxuICAgKiBAcGFyYW0gc3RyIGlzIHRoZSBzdHJpbmcgdG8gc2VhcmNoIGZvciBhIHN1YnN0cmluZ1xuICAgKiBAcGFyYW0gc3Vic3RyaW5nIGlzIHRoZSBzdWJzdHJpbmcgdG8gc2VhcmNoaW4gd2l0aGluIHRoZSBzdHJpbmdcbiAgICogQHJldHVybiB0cnVlIGlmIHRoZSBzdWJzdHJpbmcgaXMgd2l0aGluIHRoZSBzdHJpbmcsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgc3RhdGljIHN0ckNvbnRhaW5zKHN0ciwgc3Vic3RyaW5nKSB7XG4gICAgcmV0dXJuIHN0ci5pbmRleE9mKHN1YnN0cmluZykgPiAtMTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIGlmIHR3byBhcnJheXMgYXJlIGVxdWFsLlxuICAgKiBcbiAgICogQHBhcmFtIGFycjEgaXMgYW4gYXJyYXkgdG8gY29tcGFyZVxuICAgKiBAcGFyYW0gYXJyMiBpcyBhbiBhcnJheSB0byBjb21wYXJlXG4gICAqIEByZXR1cm4gdHJ1ZSBpZiB0aGUgYXJyYXlzIGFyZSBlcXVhbCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgYXJyYXlzRXF1YWwoYXJyMSwgYXJyMikge1xuICAgIGlmIChhcnIxID09PSBhcnIyKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoYXJyMSA9PSBudWxsICYmIGFycjIgPT0gbnVsbCkgcmV0dXJuIHRydWU7XG4gICAgaWYgKGFycjEgPT0gbnVsbCB8fCBhcnIyID09IG51bGwpIHJldHVybiBmYWxzZTtcbiAgICBpZiAodHlwZW9mIGFycjEgPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBhcnIyID09PSAndW5kZWZpbmVkJykgcmV0dXJuIHRydWU7XG4gICAgaWYgKHR5cGVvZiBhcnIxID09PSAndW5kZWZpbmVkJyB8fCB0eXBlb2YgYXJyMiA9PT0gJ3VuZGVmaW5lZCcpIHJldHVybiBmYWxzZTtcbiAgICBpZiAoIUdlblV0aWxzLmlzQXJyYXkoYXJyMSkpIHRocm93IG5ldyBFcnJvcihcIkZpcnN0IGFyZ3VtZW50IGlzIG5vdCBhbiBhcnJheVwiKTtcbiAgICBpZiAoIUdlblV0aWxzLmlzQXJyYXkoYXJyMikpIHRocm93IG5ldyBFcnJvcihcIlNlY29uZCBhcmd1bWVudCBpcyBub3QgYW4gYXJyYXlcIik7XG4gICAgaWYgKGFycjEubGVuZ3RoICE9IGFycjIubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnIxLmxlbmd0aDsgKytpKSB7XG4gICAgICBpZiAoIUdlblV0aWxzLmVxdWFscyhhcnIxW2ldLCBhcnIyW2ldKSkgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIGlmIHR3byBhcmd1bWVudHMgYXJlIGRlZXAgZXF1YWwuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJnMSBpcyBhbiBhcmd1bWVudCB0byBjb21wYXJlXG4gICAqIEBwYXJhbSBhcmcyIGlzIGFuIGFyZ3VtZW50IHRvIGNvbXBhcmVcbiAgICogQHJldHVybiB0cnVlIGlmIHRoZSBhcmd1bWVudHMgYXJlIGRlZXAgZXF1YWxzLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBlcXVhbHMoYXJnMSwgYXJnMikge1xuICAgIGlmIChHZW5VdGlscy5pc0FycmF5KGFyZzEpICYmIEdlblV0aWxzLmlzQXJyYXkoYXJnMikpIHJldHVybiBHZW5VdGlscy5hcnJheXNFcXVhbChhcmcxLCBhcmcyKTtcbiAgICBpZiAoR2VuVXRpbHMuaXNPYmplY3QoYXJnMSkgJiYgR2VuVXRpbHMuaXNPYmplY3QoYXJnMikpIHJldHVybiBHZW5VdGlscy5vYmplY3RzRXF1YWwoYXJnMSwgYXJnMik7XG4gICAgcmV0dXJuIGFyZzEgPT09IGFyZzI7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIGlmIHR3byBvYmplY3RzIGFyZSBkZWVwIGVxdWFsLlxuICAgKiBcbiAgICogVW5kZWZpbmVkIHZhbHVlcyBhcmUgY29uc2lkZXJlZCBlcXVhbCB0byBub24tZXhpc3RlbnQga2V5cy5cbiAgICogXG4gICAqIEBwYXJhbSBtYXAxIGlzIGEgbWFwIHRvIGNvbXBhcmVcbiAgICogQHBhcmFtIG1hcDIgaXMgYSBtYXAgdG8gY29tcGFyZVxuICAgKiBAcmV0dXJuIHRydWUgaWYgdGhlIG1hcHMgaGF2ZSBpZGVudGljYWwga2V5cyBhbmQgdmFsdWVzLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBvYmplY3RzRXF1YWwobWFwMSwgbWFwMikge1xuICAgIGxldCBrZXlzMSA9IE9iamVjdC5rZXlzKG1hcDEpO1xuICAgIGxldCBrZXlzMiA9IE9iamVjdC5rZXlzKG1hcDIpO1xuICAgIFxuICAgIC8vIGNvbXBhcmUgZWFjaCBrZXkxIHRvIGtleXMyXG4gICAgZm9yIChsZXQga2V5MSBvZiBrZXlzMSkge1xuICAgICAgbGV0IGZvdW5kID0gZmFsc2U7XG4gICAgICBmb3IgKGxldCBrZXkyIG9mIGtleXMyKSB7XG4gICAgICAgIGlmIChrZXkxID09PSBrZXkyKSB7XG4gICAgICAgICAgaWYgKCFHZW5VdGlscy5lcXVhbHMobWFwMVtrZXkxXSwgbWFwMltrZXkyXSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICghZm91bmQgJiYgbWFwMVtrZXkxXSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gZmFsc2U7IC8vIGFsbG93cyB1bmRlZmluZWQgdmFsdWVzIHRvIGVxdWFsIG5vbi1leGlzdGVudCBrZXlzXG4gICAgfVxuICAgIFxuICAgIC8vIGNvbXBhcmUgZWFjaCBrZXkyIHRvIGtleXMxXG4gICAgZm9yIChsZXQga2V5MiBvZiBrZXlzMikge1xuICAgICAgbGV0IGZvdW5kID0gZmFsc2U7XG4gICAgICBmb3IgKGxldCBrZXkxIG9mIGtleXMxKSB7XG4gICAgICAgIGlmIChrZXkxID09PSBrZXkyKSB7XG4gICAgICAgICAgZm91bmQgPSB0cnVlOyAvLyBubyBuZWVkIHRvIHJlLWNvbXBhcmUgd2hpY2ggd2FzIGRvbmUgZWFybGllclxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoIWZvdW5kICYmIG1hcDJba2V5Ml0gIT09IHVuZGVmaW5lZCkgcmV0dXJuIGZhbHNlOyAvLyBhbGxvd3MgdW5kZWZpbmVkIHZhbHVlcyB0byBlcXVhbCBub24tZXhpc3RlbnQga2V5c1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgICBcbiAgICAvLyBUT0RPOiBzdXBwb3J0IHN0cmljdCBvcHRpb24/XG4vLyAgICBpZiAoc3RyaWN0KSB7XG4vLyAgICAgIGxldCBrZXlzMSA9IE9iamVjdC5rZXlzKG1hcDEpO1xuLy8gICAgICBpZiAoa2V5czEubGVuZ3RoICE9PSBPYmplY3Qua2V5cyhtYXAyKS5sZW5ndGgpIHJldHVybiBmYWxzZTtcbi8vICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBrZXlzMS5sZW5ndGg7IGkrKykge1xuLy8gICAgICAgIGxldCBrZXkgPSBPYmplY3Qua2V5cyhtYXAxKVtpXTtcbi8vICAgICAgICBpZiAoIUdlblV0aWxzLmVxdWFscyhtYXAxW2tleV0sIG1hcDJba2V5XSkpIHJldHVybiBmYWxzZTtcbi8vICAgICAgfVxuLy8gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogRGVsZXRlcyBwcm9wZXJ0aWVzIGZyb20gdGhlIG9iamVjdCB0aGF0IGFyZSB1bmRlZmluZWQuXG4gICAqIFxuICAgKiBAcGFyYW0gb2JqIGlzIHRoZSBvYmplY3QgdG8gZGVsZXRlIHVuZGVmaW5lZCBrZXlzIGZyb21cbiAgICovXG4gIHN0YXRpYyBkZWxldGVVbmRlZmluZWRLZXlzKG9iaikge1xuICAgIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhvYmopKSB7XG4gICAgICBpZiAob2JqW2tleV0gPT09IHVuZGVmaW5lZCkgZGVsZXRlIG9ialtrZXldO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGNvbWJpbmF0aW9ucyBvZiB0aGUgZ2l2ZW4gYXJyYXkgb2YgdGhlIGdpdmVuIHNpemUuXG4gICAqIFxuICAgKiBAcGFyYW0gYXJyIGlzIHRoZSBhcnJheSB0byBnZXQgY29tYmluYXRpb25zIGZyb21cbiAgICogQHBhcmFtIGNvbWJpbmF0aW9uU2l6ZSBzcGVjaWZpZXMgdGhlIHNpemUgb2YgZWFjaCBjb21iaW5hdGlvblxuICAgKi9cbiAgc3RhdGljIGdldENvbWJpbmF0aW9ucyhhcnIsIGNvbWJpbmF0aW9uU2l6ZSkge1xuICAgIFxuICAgIC8vIHZhbGlkYXRlIGlucHV0XG4gICAgR2VuVXRpbHMuYXNzZXJ0SW5pdGlhbGl6ZWQoYXJyKTtcbiAgICBHZW5VdGlscy5hc3NlcnRJbml0aWFsaXplZChjb21iaW5hdGlvblNpemUpO1xuICAgIEdlblV0aWxzLmFzc2VydFRydWUoY29tYmluYXRpb25TaXplID49IDEpO1xuICAgIFxuICAgIC8vIGdldCBjb21iaW5hdGlvbnMgb2YgYXJyYXkgaW5kaWNlcyBvZiB0aGUgZ2l2ZW4gc2l6ZVxuICAgIGxldCBpbmRleENvbWJpbmF0aW9ucyA9IEdlblV0aWxzLmdldFBvd2VyU2V0T2ZMZW5ndGgoR2VuVXRpbHMuZ2V0SW5kaWNlcyhhcnIubGVuZ3RoKSwgY29tYmluYXRpb25TaXplKTtcbiAgICBcbiAgICAvLyBjb2xsZWN0IGNvbWJpbmF0aW9ucyBmcm9tIGVhY2ggY29tYmluYXRpb24gb2YgYXJyYXkgaW5kaWNlc1xuICAgIGxldCBjb21iaW5hdGlvbnMgPSBbXTtcbiAgICBmb3IgKGxldCBpbmRleENvbWJpbmF0aW9uc0lkeCA9IDA7IGluZGV4Q29tYmluYXRpb25zSWR4IDwgaW5kZXhDb21iaW5hdGlvbnMubGVuZ3RoOyBpbmRleENvbWJpbmF0aW9uc0lkeCsrKSB7XG4gICAgICBcbiAgICAgIC8vIGdldCBjb21iaW5hdGlvbiBvZiBhcnJheSBpbmRpY2VzXG4gICAgICBsZXQgaW5kZXhDb21iaW5hdGlvbiA9IGluZGV4Q29tYmluYXRpb25zW2luZGV4Q29tYmluYXRpb25zSWR4XTtcbiAgICAgIFxuICAgICAgLy8gYnVpbGQgY29tYmluYXRpb24gZnJvbSBhcnJheVxuICAgICAgbGV0IGNvbWJpbmF0aW9uID0gW107XG4gICAgICBmb3IgKGxldCBpbmRleENvbWJpbmF0aW9uSWR4ID0gMDsgaW5kZXhDb21iaW5hdGlvbklkeCA8IGluZGV4Q29tYmluYXRpb24ubGVuZ3RoOyBpbmRleENvbWJpbmF0aW9uSWR4KyspIHtcbiAgICAgICAgY29tYmluYXRpb24ucHVzaChhcnJbaW5kZXhDb21iaW5hdGlvbltpbmRleENvbWJpbmF0aW9uSWR4XV0pO1xuICAgICAgfVxuICAgICAgXG4gICAgICAvLyBhZGQgdG8gY29tYmluYXRpb25zXG4gICAgICBjb21iaW5hdGlvbnMucHVzaChjb21iaW5hdGlvbik7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBjb21iaW5hdGlvbnM7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyBhbiAnYScgZWxlbWVudCB0aGF0IGlzIGRvd25sb2FkYWJsZSB3aGVuIGNsaWNrZWQuXG4gICAqIFxuICAgKiBAcGFyYW0gbmFtZSBpcyB0aGUgbmFtZSBvZiB0aGUgZmlsZSB0byBkb3dubG9hZFxuICAgKiBAcGFyYW0gY29udGVudHMgYXJlIHRoZSBzdHJpbmcgY29udGVudHMgb2YgdGhlIGZpbGUgdG8gZG93bmxvYWRcbiAgICogQHJldHVybiAnYScgZG9tIGVsZW1lbnQgd2l0aCBkb3dubG9hZGFibGUgZmlsZVxuICAgKi9cbiAgc3RhdGljIGdldERvd25sb2FkYWJsZUEobmFtZSwgY29udGVudHMpIHtcbiAgICBsZXQgYSA9IHdpbmRvdy5kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgYS5ocmVmID0gd2luZG93LlVSTC5jcmVhdGVPYmplY3RVUkwobmV3IEJsb2IoW2NvbnRlbnRzXSwge3R5cGU6ICd0ZXh0L3BsYWluJ30pKTtcbiAgICBhLmRvd25sb2FkID0gbmFtZTtcbiAgICBhLnRhcmdldD1cIl9ibGFua1wiO1xuICAgIGEuaW5uZXJIVE1MID0gbmFtZTtcbiAgICByZXR1cm4gYTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb3BpZXMgcHJvcGVydGllcyBpbiB0aGUgZ2l2ZW4gb2JqZWN0IHRvIGEgbmV3IG9iamVjdC5cbiAgICogXG4gICAqIEBwYXJhbSBvYmogaXMgb2JqZWN0IHRvIGNvcHkgcHJvcGVydGllcyBmb3JcbiAgICogQHJldHVybiBhIG5ldyBvYmplY3Qgd2l0aCBwcm9wZXJ0aWVzIGNvcGllZCBmcm9tIHRoZSBnaXZlbiBvYmplY3RcbiAgICovXG4gIHN0YXRpYyBjb3B5UHJvcGVydGllcyhvYmopIHtcbiAgICByZXR1cm4gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShvYmopKVxuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZXMgYWxsIHByb3BlcnRpZXMgaW4gdGhlIGdpdmVuIG9iamVjdC5cbiAgICogXG4gICAqIEBwYXJhbSBvYmogaXMgdGhlIG9iamVjdCB0byBkZWxldGUgcHJvcGVydGllcyBmcm9tXG4gICAqL1xuICBzdGF0aWMgZGVsZXRlUHJvcGVydGllcyhvYmopIHtcbiAgICBsZXQgcHJvcHMgPSBbXTtcbiAgICBmb3IgKGxldCBwcm9wIGluIG9iaikgcHJvcHMucHVzaChwcm9wKTsgLy8gVE9ETzogaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wKSkgeyAuLi5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSBkZWxldGUgb2JqW3Byb3BzW2ldLnRvU3RyaW5nKCldO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZ2l2ZW4gc3RyaW5nIGNvbnRhaW5zIHdoaXRlc3BhY2UuXG4gICAqIFxuICAgKiBAcGFyYW0gc3RyIGlzIHRoZSBzdHJpbmcgdG8gdGVzdFxuICAgKiBAcmV0dXJuIHRydWUgaWYgdGhlIHN0cmluZyBjb250YWlucyB3aGl0ZXNwYWNlLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBoYXNXaGl0ZXNwYWNlKHN0cikge1xuICAgIHJldHVybiAvXFxzL2cudGVzdChzdHIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgZ2l2ZW4gY2hhcmFjdGVyIGlzIHdoaXRlc3BhY2UuXG4gICAqIFxuICAgKiBAcGFyYW0gY2hhciBpcyB0aGUgY2hhcmFjdGVyIHRvIHRlc3RcbiAgICogQHJldHVybiB0cnVlIGlmIHRoZSBnaXZlbiBjaGFyYWN0ZXIgaXMgd2hpdGVzcGFjZSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaXNXaGl0ZXNwYWNlKGNoYXIpIHtcbiAgICByZXR1cm4gL1xccy8udGVzdChjaGFyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGdpdmVuIGNoYXJhY3RlciBpcyBhIG5ld2xpbmUuXG4gICAqIFxuICAgKiBAcGFyYW0gY2hhciBpcyB0aGUgY2hhcmFjdGVyIHRvIHRlc3RcbiAgICogQHJldHVybiB0cnVlIGlmIHRoZSBnaXZlbiBjaGFyYWN0ZXIgaXMgYSBuZXdsaW5lLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc05ld2xpbmUoY2hhcikge1xuICAgIHJldHVybiBjaGFyID09PSAnXFxuJyB8fCBjaGFyID09PSAnXFxyJztcbiAgfVxuXG4gIC8qKlxuICAgKiBDb3VudHMgdGhlIG51bWJlciBvZiBub24td2hpdGVzcGFjZSBjaGFyYWN0ZXJzIGluIHRoZSBnaXZlbiBzdHJpbmcuXG4gICAqIFxuICAgKiBAcGFyYW0gc3RyIGlzIHRoZSBzdHJpbmcgdG8gY291bnQgdGhlIG51bWJlciBvZiBub24td2hpdGVzcGFjZSBjaGFyYWN0ZXJzIGluXG4gICAqIEByZXR1cm4gaW50IGlzIHRoZSBudW1iZXIgb2Ygbm9uLXdoaXRlc3BhY2UgY2hhcmFjdGVycyBpbiB0aGUgZ2l2ZW4gc3RyaW5nXG4gICAqL1xuICBzdGF0aWMgY291bnROb25XaGl0ZXNwYWNlQ2hhcmFjdGVycyhzdHIpIHtcbiAgICBsZXQgY291bnQgPSAwO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoIUdlblV0aWxzLmlzV2hpdGVzcGFjZShzdHIuY2hhckF0KGkpKSkgY291bnQrKztcbiAgICB9XG4gICAgcmV0dXJuIGNvdW50O1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdG9rZW5zIHNlcGFyYXRlZCBieSB3aGl0ZXNwYWNlIGZyb20gdGhlIGdpdmVuIHN0cmluZy5cbiAgICogXG4gICAqIEBwYXJhbSBzdHIgaXMgdGhlIHN0cmluZyB0byBnZXQgdG9rZW5zIGZyb21cbiAgICogQHJldHVybiBzdHJpbmdbXSBhcmUgdGhlIHRva2VucyBzZXBhcmF0ZWQgYnkgd2hpdGVzcGFjZSB3aXRoaW4gdGhlIHN0cmluZ1xuICAgKi9cbiAgc3RhdGljIGdldFdoaXRlc3BhY2VUb2tlbnMoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5tYXRjaCgvXFxTKy9nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGxpbmVzIHNlcGFyYXRlZCBieSBuZXdsaW5lcyBmcm9tIHRoZSBnaXZlbiBzdHJpbmcuXG4gICAqIFxuICAgKiBAcGFyYW0gc3RyIGlzIHRoZSBzdHJpbmcgdG8gZ2V0IGxpbmVzIGZyb21cbiAgICogQHBhcmFtIHN0cmluZ1tdIGFyZSB0aGUgbGluZXMgc2VwYXJhdGVkIGJ5IG5ld2xpbmVzIHdpdGhpbiB0aGUgc3RyaW5nXG4gICAqL1xuICBzdGF0aWMgZ2V0TGluZXMoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5tYXRjaCgvW15cXHJcXG5dKy9nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBkb2N1bWVudCdzIGZpcnN0IHN0eWxlc2hlZXQgd2hpY2ggaGFzIG5vIGhyZWYuXG4gICAqIFxuICAgKiBAcmV0dXJuIFN0eWxlU2hlZXQgaXMgdGhlIGludGVybmFsIHN0eWxlc2hlZXRcbiAgICovXG4gIHN0YXRpYyBnZXRJbnRlcm5hbFN0eWxlU2hlZXQoKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkb2N1bWVudC5zdHlsZVNoZWV0cy5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IHN0eWxlU2hlZXQgPSBkb2N1bWVudC5zdHlsZVNoZWV0c1tpXTtcbiAgICAgIGlmICghc3R5bGVTaGVldC5ocmVmKSByZXR1cm4gc3R5bGVTaGVldDtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgZG9jdW1lbnQncyBpbnRlcm5hbCBzdHlsZXNoZWV0IGFzIHRleHQuXG4gICAqIFxuICAgKiBAcmV0dXJuIHN0ciBpcyB0aGUgZG9jdW1lbnQncyBpbnRlcm5hbCBzdHlsZXNoZWV0XG4gICAqL1xuICBzdGF0aWMgZ2V0SW50ZXJuYWxTdHlsZVNoZWV0VGV4dCgpIHtcbiAgICBsZXQgaW50ZXJuYWxDc3MgPSBcIlwiO1xuICAgIGxldCBpbnRlcm5hbFN0eWxlU2hlZXQgPSBHZW5VdGlscy5nZXRJbnRlcm5hbFN0eWxlU2hlZXQoKTtcbiAgICBpZiAoIWludGVybmFsU3R5bGVTaGVldCkgcmV0dXJuIG51bGw7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnRlcm5hbFN0eWxlU2hlZXQuY3NzUnVsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGludGVybmFsQ3NzICs9IGludGVybmFsU3R5bGVTaGVldC5jc3NSdWxlc1tpXS5jc3NUZXh0ICsgXCJcXG5cIjtcbiAgICB9XG4gICAgcmV0dXJuIGludGVybmFsQ3NzO1xuICB9XG5cbiAgLyoqXG4gICAqIE1hbnVhbGx5IGJ1aWxkcyBhbiBIVE1MIGRvY3VtZW50IHN0cmluZy5cbiAgICogXG4gICAqIEBwYXJhbSBjb250ZW50IHNwZWNpZmllcyBvcHRpb25hbCBkb2N1bWVudCBjb250ZW50XG4gICAqICAgICAgICBjb250ZW50LmRpdiBpcyBhIHByZS1leGlzdGluZyBkaXYgdG8gc3RyaW5naWZ5IGFuZCBhZGQgdG8gdGhlIGJvZHlcbiAgICogICAgICAgIGNvbnRlbnQudGl0bGUgaXMgdGhlIHRpdGxlIG9mIHRoZSBuZXcgdGFiXG4gICAqICAgICAgICBjb250ZW50LmRlcGVuZGVuY3lQYXRocyBzcGVjaWZpZXMgcGF0aHMgdG8ganMsIGNzcywgb3IgaW1nIHBhdGhzXG4gICAqICAgICAgICBjb250ZW50LmludGVybmFsQ3NzIGlzIGNzcyB0byBlbWJlZCBpbiB0aGUgaHRtbCBkb2N1bWVudFxuICAgKiAgICAgICAgY29udGVudC5tZXRhcyBhcmUgbWV0YSBlbGVtZW50cyB3aXRoIGtleXMvdmFsdWVzIHRvIGluY2x1ZGVcbiAgICogQHJldHVybiBzdHIgaXMgdGhlIGRvY3VtZW50IHN0cmluZ1xuICAgKi9cbiAgc3RhdGljIGJ1aWxkSHRtbERvY3VtZW50KGNvbnRlbnQpIHtcbiAgICBsZXQgc3RyID0gXCI8IURPQ1RZUEUgSFRNTD5cIjtcbiAgICBzdHIgKz0gXCI8aHRtbD48aGVhZD5cIjtcbiAgICBcbiAgICAvLyBhZGQgbWV0YXNcbiAgICBpZiAoY29udGVudC5tZXRhcykge1xuICAgICAgbGV0IG1ldGFzID0gR2VuVXRpbHMubGlzdGlmeShjb250ZW50Lm1ldGFzKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWV0YXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgbGV0IG1ldGEgPSBtZXRhc1tpXTtcbiAgICAgICAgbGV0IGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwibWV0YVwiKTtcbiAgICAgICAgZm9yIChsZXQgcHJvcCBpbiBtZXRhKSB7XG4gICAgICAgICAgaWYgKG1ldGEuaGFzT3duUHJvcGVydHkocHJvcCkpIHtcbiAgICAgICAgICAgIGVsZW0uc2V0QXR0cmlidXRlKHByb3AudG9TdHJpbmcoKSwgbWV0YVtwcm9wLnRvU3RyaW5nKCldKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc3RyICs9IGVsZW0ub3V0ZXJIVE1MO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBhZGQgdGl0bGUgYW5kIGludGVybmFsIGNzc1xuICAgIHN0ciArPSBjb250ZW50LnRpdGxlID8gXCI8dGl0bGU+XCIgKyBjb250ZW50LnRpdGxlICsgXCI8L3RpdGxlPlwiIDogXCJcIjtcbiAgICBzdHIgKz0gY29udGVudC5pbnRlcm5hbENzcyA/IFwiPHN0eWxlPlwiICsgY29udGVudC5pbnRlcm5hbENzcyArIFwiPC9zdHlsZT5cIiA6IFwiXCI7XG4gICAgXG4gICAgLy8gYWRkIGRlcGVuZGVuY3kgcGF0aHNcbiAgICBpZiAoY29udGVudC5kZXBlbmRlbmN5UGF0aHMpIHtcbiAgICAgIGxldCBkZXBlbmRlbmN5UGF0aHMgPSBHZW5VdGlscy5saXN0aWZ5KGNvbnRlbnQuZGVwZW5kZW5jeVBhdGhzKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVwZW5kZW5jeVBhdGhzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxldCBkZXBlbmRlbmN5UGF0aCA9IGRlcGVuZGVuY3lQYXRoc1tpXTtcbiAgICAgICAgaWYgKGRlcGVuZGVuY3lQYXRoLmVuZHNXaXRoKFwiLmpzXCIpKSBzdHIgKz0gXCI8c2NyaXB0IHNyYz0nXCIgKyBkZXBlbmRlbmN5UGF0aCArIFwiJz48L3NjcmlwdD5cIjtcbiAgICAgICAgZWxzZSBpZiAoZGVwZW5kZW5jeVBhdGguZW5kc1dpdGgoXCIuY3NzXCIpKSBzdHIgKz0gXCI8bGluayByZWw9J3N0eWxlc2hlZXQnIHR5cGU9J3RleHQvY3NzJyBocmVmPSdcIiArIGRlcGVuZGVuY3lQYXRoICsgXCInLz5cIjtcbiAgICAgICAgZWxzZSBpZiAoZGVwZW5kZW5jeVBhdGguZW5kc1dpdGgoXCIucG5nXCIpIHx8IGRlcGVuZGVuY3lQYXRoLmVuZHNXaXRoKFwiLmltZ1wiKSkgIHN0ciArPSBcIjxpbWcgc3JjPSdcIiArIGRlcGVuZGVuY3lQYXRoICsgXCInPlwiO1xuICAgICAgICBlbHNlIHRocm93IG5ldyBFcnJvcihcIlVucmVjb2duaXplZCBkZXBlbmRlbmN5IHBhdGggZXh0ZW5zaW9uOiBcIiArIGRlcGVuZGVuY3lQYXRoKTsgICAgICBcbiAgICAgIH1cbiAgICB9XG4gICAgc3RyICs9IFwiPC9oZWFkPjxib2R5PlwiO1xuICAgIGlmIChjb250ZW50LmRpdikgc3RyICs9ICQoXCI8ZGl2PlwiKS5hcHBlbmQoY29udGVudC5kaXYuY2xvbmUoKSkuaHRtbCgpOyAgLy8gYWRkIGNsb25lZCBkaXYgYXMgc3RyaW5nXG4gICAgc3RyICs9IFwiPC9ib2R5PjwvaHRtbD5cIjtcbiAgICByZXR1cm4gc3RyO1xuICB9XG5cbiAgLyoqXG4gICAqIE9wZW5zIHRoZSBnaXZlbiBkaXYgaW4gYSBuZXcgd2luZG93LlxuICAgKiBcbiAgICogQHBhcmFtIGNvbnRlbnQgc3BlY2lmaWVzIG9wdGlvbmFsIHdpbmRvdyBjb250ZW50XG4gICAqICAgICAgICBjb250ZW50LmRpdiBpcyBhIHByZS1leGlzdGluZyBkaXYgdG8gc3RyaW5naWZ5IGFuZCBhZGQgdG8gdGhlIGJvZHlcbiAgICogICAgICAgIGNvbnRlbnQudGl0bGUgaXMgdGhlIHRpdGxlIG9mIHRoZSBuZXcgdGFiXG4gICAqICAgICAgICBjb250ZW50LmRlcGVuZGVuY3lQYXRocyBzcGVjaWZpZXMgcGF0aHMgdG8ganMsIGNzcywgb3IgaW1nIHBhdGhzXG4gICAqICAgICAgICBjb250ZW50LmludGVybmFsQ3NzIGlzIGNzcyB0byBlbWJlZCBpbiB0aGUgaHRtbCBkb2N1bWVudFxuICAgKiAgICAgICAgY29udGVudC5tZXRhcyBhcmUgbWV0YSBlbGVtZW50cyB3aXRoIGtleXMvdmFsdWVzIHRvIGluY2x1ZGVcbiAgICogQHBhcmFtIG9uTG9hZChlcnIsIHdpbmRvdykgaXMgaW52b2tlZCB3aXRoIGEgcmVmZXJlbmNlIHRvIHRoZSB3aW5kb3cgd2hlbiBhdmFpbGFibGVcbiAgICovXG4gIHN0YXRpYyBuZXdXaW5kb3coY29udGVudCwgb25Mb2FkKSB7XG4gICAgbGV0IG9uTG9hZENhbGxlZCA9IGZhbHNlO1xuICAgIGxldCB3ID0gd2luZG93Lm9wZW4oKTtcbiAgICBpZiAoIUdlblV0aWxzLmlzSW5pdGlhbGl6ZWQodykgfHwgIUdlblV0aWxzLmlzSW5pdGlhbGl6ZWQody5kb2N1bWVudCkpIHtcbiAgICAgIG9uTG9hZE9uY2UobmV3IEVycm9yKFwiQ291bGQgbm90IGdldCB3aW5kb3cgcmVmZXJlbmNlXCIpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdy5vcGVuZXIgPSBudWxsO1xuICAgIHcuZG9jdW1lbnQud3JpdGUoR2VuVXRpbHMuYnVpbGRIdG1sRG9jdW1lbnQoY29udGVudCkpO1xuICAgIHcuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgb25Mb2FkT25jZShudWxsLCB3KTtcbiAgICB9KTtcbiAgICB3LmRvY3VtZW50LmNsb3NlKCk7XG4gICAgXG4gICAgLy8gcHJldmVudHMgb25Mb2FkKCkgZnJvbSBiZWluZyBjYWxsZWQgbXVsdGlwbGUgdGltZXNcbiAgICBmdW5jdGlvbiBvbkxvYWRPbmNlKGVyciwgd2luZG93Pykge1xuICAgICAgaWYgKG9uTG9hZENhbGxlZCkgcmV0dXJuO1xuICAgICAgb25Mb2FkQ2FsbGVkID0gdHJ1ZTtcbiAgICAgIGlmIChvbkxvYWQpIG9uTG9hZChlcnIsIHdpbmRvdyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIHRoZSBnaXZlbiBpbWFnZSB0byBhIGJhc2U2NCBlbmNvZGVkIGRhdGEgdXJsLlxuICAgKiBcbiAgICogQHBhcmFtIGltZyBpcyB0aGUgaW1hZ2UgdG8gY29udmVydFxuICAgKiBAcGFyYW0gcXVhbGl0eSBpcyBhIG51bWJlciBiZXR3ZWVuIDAgYW5kIDEgc3BlY2lmeWluZyB0aGUgaW1hZ2UgcXVhbGl0eVxuICAgKi9cbiAgc3RhdGljIGltZ1RvRGF0YVVybChpbWcsIHF1YWxpdHkpIHtcbiAgICBsZXQgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgY2FudmFzLmhlaWdodCA9IGltZy5uYXR1cmFsSGVpZ2h0O1xuICAgIGNhbnZhcy53aWR0aCA9IGltZy5uYXR1cmFsV2lkdGg7XG4gICAgbGV0IGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICBjb250ZXh0LmRyYXdJbWFnZShpbWcsIDAsIDApO1xuICAgIHJldHVybiBjYW52YXMudG9EYXRhVVJMKHF1YWxpdHkpO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgdGhlIGltYWdlIGF0IHRoZSBnaXZlbiBVUkwgaXMgYWNjZXNzaWJsZS5cbiAgICogXG4gICAqIEBwYXJhbSB1cmwgaXMgdGhlIHVybCB0byBhbiBpbWFnZVxuICAgKiBAcGFyYW0gdGltZW91dCBpcyB0aGUgbWF4aW11bSB0aW1lIHRvIHdhaXRcbiAgICogQHBhcmFtIG9uRG9uZShib29sKSB3aGVuIHRoZSBpbWFnZSBpcyBkZXRlcm1pbmVkIHRvIGJlIGFjY2Vzc2libGUgb3Igbm90XG4gICAqL1xuICBzdGF0aWMgaXNJbWFnZUFjY2Vzc2libGUodXJsLCB0aW1lb3V0LCBvbkRvbmUpIHtcbiAgICBcbiAgICAvLyB0cmFjayByZXR1cm4gc28gaXQgb25seSBleGVjdXRlcyBvbmNlXG4gICAgbGV0IHJldHVybmVkID0gZmFsc2U7XG4gICAgXG4gICAgLy8gYXR0ZW1wdCB0byBsb2FkIGZhdmljb25cbiAgICBsZXQgaW1nID0gbmV3IEltYWdlKCk7XG4gICAgaW1nLm9ubG9hZCA9IG9uUmVzcG9uc2U7XG4gICAgaW1nLm9uZXJyb3IgPSBvblJlc3BvbnNlO1xuICAgIGltZy5zcmMgPSB1cmwgKyBcIj9cIiArICgrbmV3IERhdGUoKSk7IC8vIHRyaWdnZXIgaW1hZ2UgbG9hZCB3aXRoIGNhY2hlIGJ1c3RlclxuICAgIFxuICAgIC8vIG5lc3QgZmFpbHVyZSB0aW1lb3V0cyB0byBnaXZlIHJlc3BvbnNlIGEgY2hhbmNlIHdoZW4gYnJvd3NlciBpcyB1bmRlciBsb2FkXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIHNldEltbWVkaWF0ZShmdW5jdGlvbigpIHtcbiAgICAgICAgc2V0SW1tZWRpYXRlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHNldEltbWVkaWF0ZShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICghcmV0dXJuZWQpIHtcbiAgICAgICAgICAgICAgcmV0dXJuZWQgPSB0cnVlO1xuICAgICAgICAgICAgICBvbkRvbmUoZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0sIHRpbWVvdXQpO1xuICAgIFxuICAgIGZ1bmN0aW9uIG9uUmVzcG9uc2UoZSkge1xuICAgICAgaWYgKHJldHVybmVkKSByZXR1cm47XG4gICAgICByZXR1cm5lZCA9IHRydWU7XG4gICAgICBpZiAodHlwZW9mIGUgPT09ICd1bmRlZmluZWQnIHx8IGUudHlwZSA9PT0gXCJlcnJvclwiKSBvbkRvbmUoZmFsc2UpO1xuICAgICAgZWxzZSBvbkRvbmUodHJ1ZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgdGhlIGdpdmVuIGZpbGUgaXMgYSB6aXAgZmlsZS5cbiAgICogXG4gICAqIEBwYXJhbSBmaWxlIGlzIGEgZmlsZVxuICAgKiBAcmV0dXJuIHRydWUgaWYgdGhlIGdpdmVuIGZpbGUgaXMgYSB6aXAgZmlsZSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaXNaaXBGaWxlKGZpbGUpIHtcbiAgICByZXR1cm4gZmlsZS5uYW1lLmVuZHNXaXRoKFwiLnppcFwiKSB8fCBmaWxlLnR5cGUgPT09ICdhcHBsaWNhdGlvbi96aXAnO1xuICB9XG5cbiAgLyoqXG4gICAqIERldGVybWluZXMgaWYgdGhlIGdpdmVuIGZpbGUgaXMgYSBqc29uIGZpbGUuXG4gICAqIFxuICAgKiBAcGFyYW0gZmlsZSBpcyBhIGZpbGVcbiAgICogQHJldHVybiB0cnVlIGlmIHRoZSBnaXZlbiBmaWxlIGlzIGEganNvbiBmaWxlLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc0pzb25GaWxlKGZpbGUpIHtcbiAgICByZXR1cm4gZmlsZS5uYW1lLmVuZHNXaXRoKFwiLmpzb25cIikgfHwgZmlsZS50eXBlID09PSAnYXBwbGljYXRpb24vanNvbic7XG4gIH1cblxuICAvKipcbiAgICogRGV0ZXJtaW5lcyBpZiB0aGUgZ2l2ZW4gZmlsZSBpcyBhIHR4dCBmaWxlLlxuICAgKiBcbiAgICogQHBhcmFtIGZpbGUgaXMgYSBmaWxlXG4gICAqIEByZXR1cm4gdHJ1ZSBpZiB0aGUgZ2l2ZW4gZmlsZSBpcyBhIHR4dCBmaWxlLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyBpc1R4dEZpbGUoZmlsZSkge1xuICAgIHJldHVybiBmaWxlLm5hbWUuZW5kc1dpdGgoXCIudHh0XCIpIHx8IGZpbGUudHlwZSA9PT0gJ3RleHQvcGxhaW4nO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoZXMgdGhlIGdpdmVuIGxpc3Qgb2YgaW1hZ2VzLlxuICAgKiBcbiAgICogUHJlcmVxdWlzaXRlOiBhc3luYy5qcy5cbiAgICogXG4gICAqIEBwYXJhbSBwYXRocyBhcmUgdGhlIHBhdGhzIHRvIHRoZSBpbWFnZXMgdG8gZmV0Y2hcbiAgICogQHBhcmFtIG9uRG9uZShlcnIsIGltYWdlcykgaXMgY2FsbGVkIHdoZW4gZG9uZVxuICAgKi9cbiAgc3RhdGljIGdldEltYWdlcyhwYXRocywgb25Eb25lKSB7XG4gICAgXG4gICAgLy8gbGlzdGlmeSBwYXRoc1xuICAgIGlmICghR2VuVXRpbHMuaXNBcnJheShwYXRocykpIHtcbiAgICAgIEdlblV0aWxzLmFzc2VydFRydWUoR2VuVXRpbHMuaXNTdHJpbmcocGF0aHMpKTtcbiAgICAgIHBhdGhzID0gW3BhdGhzXTtcbiAgICB9XG4gICAgXG4gICAgLy8gY29sbGVjdCBmdW5jdGlvbnMgdG8gZmV0Y2ggaW1hZ2VzXG4gICAgbGV0IGZ1bmNzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwYXRocy5sZW5ndGg7IGkrKykge1xuICAgICAgZnVuY3MucHVzaChsb2FkRnVuYyhwYXRoc1tpXSkpO1xuICAgIH1cbiAgICBcbiAgICAvLyBmZXRjaCBpbiBwYXJhbGxlbFxuICAgIGFzeW5jLnBhcmFsbGVsKGZ1bmNzLCBvbkRvbmUpO1xuICAgIFxuICAgIC8vIGNhbGxiYWNrIHN0YXRpYyB0byBmZXRjaCBhIHNpbmdsZSBpbWFnZVxuICAgIGZ1bmN0aW9uIGxvYWRGdW5jKHBhdGgpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbihvbkRvbmUpIHtcbiAgICAgICAgbGV0IGltZyA9IG5ldyBJbWFnZSgpO1xuICAgICAgICBpbWcub25sb2FkID0gZnVuY3Rpb24oKSB7IG9uRG9uZShudWxsLCBpbWcpOyB9XG4gICAgICAgIGltZy5vbmVycm9yID0gZnVuY3Rpb24oKSB7IG9uRG9uZShuZXcgRXJyb3IoXCJDYW5ub3QgbG9hZCBpbWFnZTogXCIgKyBwYXRoKSk7IH1cbiAgICAgICAgaW1nLnNyYyA9IHBhdGg7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogUmV0dXJucyBhIHN0cmluZyBpbmRlbnRhdGlvbiBvZiB0aGUgZ2l2ZW4gbGVuZ3RoO1xuICAgKiBcbiAgICogQHBhcmFtIGxlbmd0aCBpcyB0aGUgbGVuZ3RoIG9mIHRoZSBpbmRlbnRhdGlvblxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IGlzIGFuIGluZGVudGF0aW9uIHN0cmluZyBvZiB0aGUgZ2l2ZW4gbGVuZ3RoXG4gICAqL1xuICBzdGF0aWMgZ2V0SW5kZW50KGxlbmd0aCkge1xuICAgIGxldCBzdHIgPSBcIlwiO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHN0ciArPSAnICAnOyAvLyB0d28gc3BhY2VzXG4gICAgcmV0dXJuIHN0cjtcbiAgfVxuICBcbiAgc3RhdGljIGluaXRQb2x5ZmlsbHMoKSB7XG4gICAgXG4gICAgLy8gUG9seWZpbGwgT2JqZWN0LmFzc2lnbigpXG4gICAgLy8gQ3JlZGl0OiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9PYmplY3QvYXNzaWduXG4gICAgaWYgKHR5cGVvZiBPYmplY3QuYXNzaWduICE9ICdmdW5jdGlvbicpIHtcbiAgICAgIC8vIE11c3QgYmUgd3JpdGFibGU6IHRydWUsIGVudW1lcmFibGU6IGZhbHNlLCBjb25maWd1cmFibGU6IHRydWVcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QsIFwiYXNzaWduXCIsIHtcbiAgICAgICAgdmFsdWU6IGZ1bmN0aW9uIGFzc2lnbih0YXJnZXQsIHZhckFyZ3MpIHsgLy8gLmxlbmd0aCBvZiBzdGF0aWMgaXMgMlxuICAgICAgICAgICd1c2Ugc3RyaWN0JztcbiAgICAgICAgICBpZiAodGFyZ2V0ID09IG51bGwpIHsgLy8gVHlwZUVycm9yIGlmIHVuZGVmaW5lZCBvciBudWxsXG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY29udmVydCB1bmRlZmluZWQgb3IgbnVsbCB0byBvYmplY3QnKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsZXQgdG8gPSBPYmplY3QodGFyZ2V0KTtcblxuICAgICAgICAgIGZvciAobGV0IGluZGV4ID0gMTsgaW5kZXggPCBhcmd1bWVudHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgICBsZXQgbmV4dFNvdXJjZSA9IGFyZ3VtZW50c1tpbmRleF07XG5cbiAgICAgICAgICAgIGlmIChuZXh0U291cmNlICE9IG51bGwpIHsgLy8gU2tpcCBvdmVyIGlmIHVuZGVmaW5lZCBvciBudWxsXG4gICAgICAgICAgICAgIGZvciAobGV0IG5leHRLZXkgaW4gbmV4dFNvdXJjZSkge1xuICAgICAgICAgICAgICAgIC8vIEF2b2lkIGJ1Z3Mgd2hlbiBoYXNPd25Qcm9wZXJ0eSBpcyBzaGFkb3dlZFxuICAgICAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobmV4dFNvdXJjZSwgbmV4dEtleSkpIHtcbiAgICAgICAgICAgICAgICAgIHRvW25leHRLZXldID0gbmV4dFNvdXJjZVtuZXh0S2V5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRvO1xuICAgICAgICB9LFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgLyoqXG4gICAgICogUG9seWZpbGwgc3RyLnN0YXJ0c1dpdGgoc2VhcmNoU3RyaW5nLCBwb3NpdGlvbikuXG4gICAgICogXG4gICAgICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvU3RyaW5nL3N0YXJ0c1dpdGgjUG9seWZpbGxcbiAgICAgKi9cbiAgICBTdHJpbmcucHJvdG90eXBlLnN0YXJ0c1dpdGggPSBmdW5jdGlvbihzZWFyY2hTdHJpbmcsIHBvc2l0aW9uKSB7XG4gICAgICByZXR1cm4gdGhpcy5zdWJzdHIocG9zaXRpb24gfHwgMCwgc2VhcmNoU3RyaW5nLmxlbmd0aCkgPT09IHNlYXJjaFN0cmluZztcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogUG9seWZpbGwgc3RyLmVuZHNXaXRoKHNlYXJjaFN0cmluZywgcG9zaXRpb24pLlxuICAgICAqIFxuICAgICAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL1N0cmluZy9lbmRzV2l0aCNQb2x5ZmlsbFxuICAgICAqL1xuICAgIFN0cmluZy5wcm90b3R5cGUuZW5kc1dpdGggPSBmdW5jdGlvbihzZWFyY2hTdHJpbmcsIHBvc2l0aW9uKSB7XG4gICAgICBpZiAoIShwb3NpdGlvbiA8IHRoaXMubGVuZ3RoKSkgcG9zaXRpb24gPSB0aGlzLmxlbmd0aDsgIC8vIHdvcmtzIGJldHRlciB0aGFuID49IGJlY2F1c2UgaXQgY29tcGVuc2F0ZXMgZm9yIE5hTlxuICAgICAgZWxzZSBwb3NpdGlvbiB8PSAwOyAvLyByb3VuZCBwb3NpdGlvblxuICAgICAgcmV0dXJuIHRoaXMuc3Vic3RyKHBvc2l0aW9uIC0gc2VhcmNoU3RyaW5nLmxlbmd0aCwgc2VhcmNoU3RyaW5nLmxlbmd0aCkgPT09IHNlYXJjaFN0cmluZztcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIGEgdjQgVVVJRC5cbiAgICogXG4gICAqIFNvdXJjZTogaHR0cHM6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTA1MDM0L2NyZWF0ZS1ndWlkLXV1aWQtaW4tamF2YXNjcmlwdFxuICAgKi9cbiAgc3RhdGljIGdldFVVSUQoKSB7XG4gICAgcmV0dXJuICd4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgZnVuY3Rpb24oYykge1xuICAgICAgbGV0IHIgPSBNYXRoLnJhbmRvbSgpICogMTYgfCAwLCB2ID0gYyA9PSAneCcgPyByIDogKHIgJiAweDMgfCAweDgpO1xuICAgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBjdXJyZW50IGVudmlyb25tZW50IGlzIGEgYnJvd3Nlci5cbiAgICogXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgdGhlIGVudmlyb25tZW50IGlzIGEgYnJvd3NlciwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaXNCcm93c2VyKCkge1xuICAgIGxldCBpc1dvcmtlciA9IHR5cGVvZiBpbXBvcnRTY3JpcHRzID09PSAnZnVuY3Rpb24nO1xuICAgIGxldCBpc0Jyb3dzZXJNYWluID0gbmV3IEZ1bmN0aW9uKFwidHJ5IHtyZXR1cm4gdGhpcz09PXdpbmRvdzt9Y2F0Y2goZSl7cmV0dXJuIGZhbHNlO31cIikoKTtcbiAgICBsZXQgaXNKc0RvbSA9IGlzQnJvd3Nlck1haW4gPyBuZXcgRnVuY3Rpb24oXCJ0cnkge3JldHVybiB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC5pbmNsdWRlcygnanNkb20nKTt9Y2F0Y2goZSl7cmV0dXJuIGZhbHNlO31cIikoKSA6IGZhbHNlO1xuICAgIHJldHVybiBpc1dvcmtlciB8fCAoaXNCcm93c2VyTWFpbiAmJiAhaXNKc0RvbSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGN1cnJlbnQgZW52aXJvbm1lbnQgaXMgYSBmaXJlZm94LWJhc2VkIGJyb3dzZXIuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoZSBlbnZpcm9ubWVudCBpcyBhIGZpcmVmb3gtYmFzZWQgYnJvd3NlciwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBzdGF0aWMgaXNGaXJlZm94KCkge1xuICAgIHJldHVybiB0aGlzLmlzQnJvd3NlcigpICYmIG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZihcIkZpcmVmb3hcIikgPiAwO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIElFIHZlcnNpb24gbnVtYmVyLlxuICAgKiBcbiAgICogQ3JlZGl0OiBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xOTk5OTM4OC9jaGVjay1pZi11c2VyLWlzLXVzaW5nLWllLXdpdGgtanF1ZXJ5LzIxNzEyMzU2IzIxNzEyMzU2XG4gICAqIFxuICAgKiBAcmV0dXJuIHRoZSBJRSB2ZXJzaW9uIG51bWJlciBvciBudWxsIGlmIG5vdCBJRVxuICAgKi9cbiAgc3RhdGljIGdldElFVmVyc2lvbigpIHtcbiAgICBsZXQgdWEgPSB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudDtcblxuICAgIGxldCBtc2llID0gdWEuaW5kZXhPZignTVNJRSAnKTtcbiAgICBpZiAobXNpZSA+IDApIHtcbiAgICAgICAgLy8gSUUgMTAgb3Igb2xkZXIgPT4gcmV0dXJuIHZlcnNpb24gbnVtYmVyXG4gICAgICAgIHJldHVybiBwYXJzZUludCh1YS5zdWJzdHJpbmcobXNpZSArIDUsIHVhLmluZGV4T2YoJy4nLCBtc2llKSksIDEwKTtcbiAgICB9XG5cbiAgICBsZXQgdHJpZGVudCA9IHVhLmluZGV4T2YoJ1RyaWRlbnQvJyk7XG4gICAgaWYgKHRyaWRlbnQgPiAwKSB7XG4gICAgICAgIC8vIElFIDExID0+IHJldHVybiB2ZXJzaW9uIG51bWJlclxuICAgICAgICBsZXQgcnYgPSB1YS5pbmRleE9mKCdydjonKTtcbiAgICAgICAgcmV0dXJuIHBhcnNlSW50KHVhLnN1YnN0cmluZyhydiArIDMsIHVhLmluZGV4T2YoJy4nLCBydikpLCAxMCk7XG4gICAgfVxuXG4gICAgbGV0IGVkZ2UgPSB1YS5pbmRleE9mKCdFZGdlLycpO1xuICAgIGlmIChlZGdlID4gMCkge1xuICAgICAgIC8vIEVkZ2UgKElFIDEyKykgPT4gcmV0dXJuIHZlcnNpb24gbnVtYmVyXG4gICAgICAgcmV0dXJuIHBhcnNlSW50KHVhLnN1YnN0cmluZyhlZGdlICsgNSwgdWEuaW5kZXhPZignLicsIGVkZ2UpKSwgMTApO1xuICAgIH1cblxuICAgIC8vIG90aGVyIGJyb3dzZXJcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIGEgcGFyYW1ldGVyIHZhbHVlLlxuICAgKiBcbiAgICogQ3JlZGl0OiBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy85MDExMTUvaG93LWNhbi1pLWdldC1xdWVyeS1zdHJpbmctdmFsdWVzLWluLWphdmFzY3JpcHRcbiAgICogXG4gICAqIEBwYXJhbSBuYW1lIGlzIHRoZSBuYW1lIG9mIHRoZSBwYXJhbWV0ZXIgdG8gZ2V0IHRoZSB2YWx1ZSBvZlxuICAgKiBAcGFyYW0gdXJsIGlzIGEgVVJMIHRvIGdldCB0aGUgcGFyYW1ldGVyIGZyb20sIHVzZXMgdGhlIHdpbmRvdydzIGN1cnJlbnQgaHJlZiBpZiBub3QgZ2l2ZW5cbiAgICogQHJldHVybiB0aGUgcGFyYW1ldGVyJ3MgdmFsdWVcbiAgICovXG4gIHN0YXRpYyBnZXRQYXJhbWV0ZXJCeU5hbWUobmFtZSwgdXJsKSB7XG4gICAgaWYgKCF1cmwpIHVybCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xuICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoL1tcXFtcXF1dL2csIFwiXFxcXCQmXCIpO1xuICAgIGxldCByZWdleCA9IG5ldyBSZWdFeHAoXCJbPyZdXCIgKyBuYW1lICsgXCIoPShbXiYjXSopfCZ8I3wkKVwiKSwgcmVzdWx0cyA9IHJlZ2V4LmV4ZWModXJsKTtcbiAgICBpZiAoIXJlc3VsdHMpIHJldHVybiBudWxsO1xuICAgIGlmICghcmVzdWx0c1syXSkgcmV0dXJuICcnO1xuICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQocmVzdWx0c1syXS5yZXBsYWNlKC9cXCsvZywgXCIgXCIpKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldHMgYSBub24tY3J5cHRvZ3JhcGhpY2FsbHkgc2VjdXJlIHJhbmRvbSBudW1iZXIgd2l0aGluIGEgZ2l2ZW4gcmFuZ2UuXG4gICAqIFxuICAgKiBAcGFyYW0gbWluIGlzIHRoZSBtaW5pbXVtIHJhbmdlIG9mIHRoZSBpbnQgdG8gZ2VuZXJhdGUsIGluY2x1c2l2ZVxuICAgKiBAcGFyYW0gbWF4IGlzIHRoZSBtYXhpbXVtIHJhbmdlIG9mIHRoZSBpbnQgdG8gZ2VuZXJhdGUsIGluY2x1c2l2ZVxuICAgKiBcbiAgICogU291cmNlOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9NYXRoL3JhbmRvbVxuICAgKi9cbiAgc3RhdGljIGdldFJhbmRvbUludChtaW4sIG1heCkge1xuICAgIG1pbiA9IE1hdGguY2VpbChtaW4pO1xuICAgIG1heCA9IE1hdGguZmxvb3IobWF4KTtcbiAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKSArIG1pbjtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldHMgcmFuZG9tIGludHMuXG4gICAqIFxuICAgKiBAcGFyYW0gbWluIGlzIHRoZSBtaW5pbXVtIHJhbmdlIG9mIHRoZSBpbnRzIHRvIGdlbmVyYXRlLCBpbmNsdXNpdmVcbiAgICogQHBhcmFtIG1heCBpcyB0aGUgbWF4aW11bSByYW5nZSBvZiB0aGUgaW50cyB0byBnZW5lcmF0ZSwgaW5jbHVzaXZlXG4gICAqIEBwYXJhbSBjb3VudCBpcyB0aGUgbnVtYmVyIG9mIHJhbmRvbSBpbnRzIHRvIGdldFxuICAgKi9cbiAgc3RhdGljIGdldFJhbmRvbUludHMobWluLCBtYXgsIGNvdW50KSB7XG4gICAgR2VuVXRpbHMuYXNzZXJ0VHJ1ZSh0eXBlb2YgY291bnQgPT09IFwibnVtYmVyXCIpO1xuICAgIGxldCBpbnRzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSBpbnRzLnB1c2goR2VuVXRpbHMuZ2V0UmFuZG9tSW50KG1pbiwgbWF4KSk7XG4gICAgcmV0dXJuIGludHM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXRzIGEgZ2l2ZW4gbnVtYmVyIG9mIHVuaXF1ZSByYW5kb20gaW50cyB3aXRoaW4gYSByYW5nZS5cbiAgICogXG4gICAqIEBwYXJhbSBtaW4gaXMgdGhlIG1pbmltdW0gcmFuZ2Ugb2YgdGhlIGludHMgdG8gZ2VuZXJhdGUsIGluY2x1c2l2ZVxuICAgKiBAcGFyYW0gbWF4IGlzIHRoZSBtYXhpbXVtIHJhbmdlIG9mIHRoZSBpbnRzIHRvIGdlbmVyYXRlLCBpbmNsdXNpdmVcbiAgICogQHBhcmFtIGNvdW50IGlzIHRoZSBudW1iZXIgb2YgdW5pcXVlIHJhbmRvbSBpbnRzIHRvIGdldFxuICAgKi9cbiAgc3RhdGljIGdldFVuaXF1ZVJhbmRvbUludHMobWluLCBtYXgsIGNvdW50KSB7XG4gICAgbGV0IGludHMgPSBbXTtcbiAgICBHZW5VdGlscy5hc3NlcnRUcnVlKGNvdW50ID49IDApO1xuICAgIEdlblV0aWxzLmFzc2VydFRydWUobWF4IC0gbWluICsgMSA+PSBjb3VudCk7XG4gICAgd2hpbGUgKGludHMubGVuZ3RoIDwgY291bnQpIHtcbiAgICAgIGxldCByYW5kb21JbnQgPSBHZW5VdGlscy5nZXRSYW5kb21JbnQobWluLCBtYXgpO1xuICAgICAgaWYgKCFpbnRzLmluY2x1ZGVzKHJhbmRvbUludCkpIGludHMucHVzaChyYW5kb21JbnQpO1xuICAgIH1cbiAgICByZXR1cm4gaW50cztcbiAgfVxuICBcbiAgLyoqXG4gICAqIFJhbmRvbWl6ZSBhcnJheSBlbGVtZW50IG9yZGVyIGluLXBsYWNlIHVzaW5nIER1cnN0ZW5mZWxkIHNodWZmbGUgYWxnb3JpdGhtLlxuICAgKiBcbiAgICogQ3JlZGl0OiBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8yNDUwOTU0L2hvdy10by1yYW5kb21pemUtc2h1ZmZsZS1hLWphdmFzY3JpcHQtYXJyYXlcbiAgICovXG4gIHN0YXRpYyBzaHVmZmxlKGFycmF5KSB7XG4gICAgZm9yICh2YXIgaSA9IGFycmF5Lmxlbmd0aCAtIDE7IGkgPiAwOyBpLS0pIHtcbiAgICAgIHZhciBqID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKGkgKyAxKSk7XG4gICAgICB2YXIgdGVtcCA9IGFycmF5W2ldO1xuICAgICAgYXJyYXlbaV0gPSBhcnJheVtqXTtcbiAgICAgIGFycmF5W2pdID0gdGVtcDtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTb3J0cyBhbiBhcnJheSBieSBuYXR1cmFsIG9yZGVyaW5nLlxuICAgKiBcbiAgICogQHBhcmFtIHRoZSBhcnJheSB0byBzb3J0XG4gICAqL1xuICBzdGF0aWMgc29ydChhcnJheSkge1xuICAgIGFycmF5LnNvcnQoKGEsIGIpID0+IGEgPT09IGIgPyAwIDogYSA+IGIgPyAxIDogLTEpO1xuICB9XG4gIFxuICAvKipcbiAgICogU2V0cyB0aGUgZ2l2ZW4gdmFsdWUgZW5zdXJpbmcgYSBwcmV2aW91cyB2YWx1ZSBpcyBub3Qgb3ZlcndyaXR0ZW4uXG4gICAqIFxuICAgKiBUT0RPOiByZW1vdmUgZm9yIHBvcnRhYmlsaXR5IGJlY2F1c2UgZnVuY3Rpb24gcGFzc2luZyBub3Qgc3VwcG9ydGVkIGluIG90aGVyIGxhbmd1YWdlcywgdXNlIHJlY29uY2lsZSBvbmx5XG4gICAqIFxuICAgKiBAcGFyYW0gb2JqIGlzIHRoZSBvYmplY3QgdG8gaW52b2tlIHRoZSBnZXR0ZXIgYW5kIHNldHRlciBvblxuICAgKiBAcGFyYW0gZ2V0Rm4gZ2V0cyB0aGUgY3VycmVudCB2YWx1ZVxuICAgKiBAcGFyYW0gc2V0Rm4gc2V0cyB0aGUgY3VycmVudCB2YWx1ZVxuICAgKiBAcGFyYW0gdmFsIGlzIHRoZSB2YWx1ZSB0byBzZXQgaWZmIGl0IGRvZXMgbm90IG92ZXJ3cml0ZSBhIHByZXZpb3VzIHZhbHVlXG4gICAqIEBwYXJhbSBbY29uZmlnXSBzcGVjaWZpZXMgcmVjb25jaWxpYXRpb24gY29uZmlndXJhdGlvblxuICAgKiAgICAgICAgY29uZmlnLnJlc29sdmVEZWZpbmVkIHVzZXMgZGVmaW5lZCB2YWx1ZSBpZiB0cnVlIG9yIHVuZGVmaW5lZCwgdW5kZWZpbmVkIGlmIGZhbHNlXG4gICAqICAgICAgICBjb25maWcucmVzb2x2ZVRydWUgdXNlcyB0cnVlIG92ZXIgZmFsc2UgaWYgdHJ1ZSwgZmFsc2Ugb3ZlciB0cnVlIGlmIGZhbHNlLCBtdXN0IGJlIGVxdWFsIGlmIHVuZGVmaW5lZFxuICAgKiAgICAgICAgY29uZmlnLnJlc29sdmVNYXggdXNlcyBtYXggb3ZlciBtaW4gaWYgdHJ1ZSwgbWluIG92ZXIgbWF4IGlmIGZhbHNlLCBtdXN0IGJlIGVxdWFsIGlmIHVuZGVmaW5lZFxuICAgKiBAcGFyYW0gW2Vyck1zZ10gaXMgdGhlIGVycm9yIG1lc3NhZ2UgdG8gdGhyb3cgaWYgdGhlIHZhbHVlcyBjYW5ub3QgYmUgcmVjb25jaWxlZCAob3B0aW9uYWwpXG4gICAqL1xuICBzdGF0aWMgc2FmZVNldChvYmosIGdldEZuLCBzZXRGbiwgdmFsLCBjb25maWc/LCBlcnJNc2c/KSB7XG4gICAgbGV0IGN1clZhbCA9IGdldEZuLmNhbGwob2JqKTtcbiAgICBsZXQgcmVjb25jaWxlZFZhbCA9IEdlblV0aWxzLnJlY29uY2lsZShjdXJWYWwsIHZhbCwgY29uZmlnLCBlcnJNc2cpO1xuICAgIGlmIChjdXJWYWwgIT09IHJlY29uY2lsZWRWYWwpIHNldEZuLmNhbGwob2JqLCByZWNvbmNpbGVkVmFsKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFJlY29uY2lsZXMgdHdvIHZhbHVlcy5cbiAgICogXG4gICAqIFRPRE86IHJlbW92ZSBjdXN0b20gZXJyb3IgbWVzc2FnZVxuICAgKiBcbiAgICogQHBhcmFtIHZhbDEgaXMgYSB2YWx1ZSB0byByZWNvbmNpbGVcbiAgICogQHBhcmFtIHZhbDIgaXMgYSB2YWx1ZSB0byByZWNvbmNpbGVcbiAgICogQHBhcmFtIFtjb25maWddIHNwZWNpZmllcyByZWNvbmNpbGlhdGlvbiBjb25maWd1cmF0aW9uXG4gICAqICAgICAgICBjb25maWcucmVzb2x2ZURlZmluZWQgdXNlcyBkZWZpbmVkIHZhbHVlIGlmIHRydWUgb3IgdW5kZWZpbmVkLCB1bmRlZmluZWQgaWYgZmFsc2VcbiAgICogICAgICAgIGNvbmZpZy5yZXNvbHZlVHJ1ZSB1c2VzIHRydWUgb3ZlciBmYWxzZSBpZiB0cnVlLCBmYWxzZSBvdmVyIHRydWUgaWYgZmFsc2UsIG11c3QgYmUgZXF1YWwgaWYgdW5kZWZpbmVkXG4gICAqICAgICAgICBjb25maWcucmVzb2x2ZU1heCB1c2VzIG1heCBvdmVyIG1pbiBpZiB0cnVlLCBtaW4gb3ZlciBtYXggaWYgZmFsc2UsIG11c3QgYmUgZXF1YWwgaWYgdW5kZWZpbmVkXG4gICAqIEBwYXJhbSBbZXJyTXNnXSBpcyB0aGUgZXJyb3IgbWVzc2FnZSB0byB0aHJvdyBpZiB0aGUgdmFsdWVzIGNhbm5vdCBiZSByZWNvbmNpbGVkIChvcHRpb25hbClcbiAgICogQHJldHVybiB0aGUgcmVjb25jaWxlZCB2YWx1ZSBpZiByZWNvbmNpbGFibGUsIHRocm93cyBlcnJvciBvdGhlcndpc2VcbiAgICovXG4gIHN0YXRpYyByZWNvbmNpbGUodmFsMSwgdmFsMiwgY29uZmlnPywgZXJyTXNnPykge1xuICAgIFxuICAgIC8vIGNoZWNrIGZvciBlcXVhbGl0eVxuICAgIGlmICh2YWwxID09PSB2YWwyKSByZXR1cm4gdmFsMTtcbiAgICBcbiAgICAvLyBjaGVjayBmb3IgYmlnaW50IGVxdWFsaXR5XG4gICAgbGV0IGNvbXBhcmlzb247IC8vIHNhdmUgY29tcGFyaXNvbiBmb3IgbGF0ZXIgaWYgYXBwbGljYWJsZVxuICAgIGlmICh0eXBlb2YgdmFsMSA9PT0gXCJiaWdpbnRcIiAmJiB0eXBlb2YgdmFsMiA9PT0gXCJiaWdpbnRcIikge1xuICAgICAgaWYgKHZhbDEgPT09IHZhbDIpIHJldHVybiB2YWwxO1xuICAgIH1cbiAgICBcbiAgICAvLyByZXNvbHZlIG9uZSB2YWx1ZSBkZWZpbmVkXG4gICAgaWYgKHZhbDEgPT09IHVuZGVmaW5lZCB8fCB2YWwyID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmIChjb25maWcgJiYgY29uZmlnLnJlc29sdmVEZWZpbmVkID09PSBmYWxzZSkgcmV0dXJuIHVuZGVmaW5lZDsgIC8vIHVzZSB1bmRlZmluZWRcbiAgICAgIGVsc2UgcmV0dXJuIHZhbDEgPT09IHVuZGVmaW5lZCA/IHZhbDIgOiB2YWwxOyAgLy8gdXNlIGRlZmluZWQgdmFsdWVcbiAgICB9XG4gICAgXG4gICAgLy8gcmVzb2x2ZSBkaWZmZXJlbnQgYm9vbGVhbnNcbiAgICBpZiAoY29uZmlnICYmIGNvbmZpZy5yZXNvbHZlVHJ1ZSAhPT0gdW5kZWZpbmVkICYmIHR5cGVvZiB2YWwxID09PSBcImJvb2xlYW5cIiAmJiB0eXBlb2YgdmFsMiA9PT0gXCJib29sZWFuXCIpIHtcbiAgICAgIGFzc2VydC5lcXVhbCh0eXBlb2YgY29uZmlnLnJlc29sdmVUcnVlLCBcImJvb2xlYW5cIik7XG4gICAgICByZXR1cm4gY29uZmlnLnJlc29sdmVUcnVlO1xuICAgIH1cbiAgICBcbiAgICAvLyByZXNvbHZlIGRpZmZlcmVudCBudW1iZXJzXG4gICAgaWYgKGNvbmZpZyAmJiBjb25maWcucmVzb2x2ZU1heCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBhc3NlcnQuZXF1YWwodHlwZW9mIGNvbmZpZy5yZXNvbHZlTWF4LCBcImJvb2xlYW5cIik7XG4gICAgICBcbiAgICAgIC8vIHJlc29sdmUganMgbnVtYmVyc1xuICAgICAgaWYgKHR5cGVvZiB2YWwxID09PSBcIm51bWJlclwiICYmIHR5cGVvZiB2YWwyID09PSBcIm51bWJlclwiKSB7XG4gICAgICAgIHJldHVybiBjb25maWcucmVzb2x2ZU1heCA/IE1hdGgubWF4KHZhbDEsIHZhbDIpIDogTWF0aC5taW4odmFsMSwgdmFsMik7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIHJlc29sdmUgYmlnaW50c1xuICAgICAgaWYgKHR5cGVvZiB2YWwxID09PSBcImJpZ2ludFwiICYmIHR5cGVvZiB2YWwyID09PSBcImJpZ2ludFwiKSB7XG4gICAgICAgIHJldHVybiBjb25maWcucmVzb2x2ZU1heCA/IChjb21wYXJpc29uIDwgMCA/IHZhbDIgOiB2YWwxKSA6IChjb21wYXJpc29uIDwgMCA/IHZhbDEgOiB2YWwyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gYXNzZXJ0IGRlZXAgZXF1YWxpdHlcbiAgICBhc3NlcnQuZGVlcEVxdWFsKHZhbDEsIHZhbDIsIGVyck1zZyA/IGVyck1zZyA6IFwiQ2Fubm90IHJlY29uY2lsZSB2YWx1ZXMgXCIgKyB2YWwxICsgXCIgYW5kIFwiICsgdmFsMiArIFwiIHdpdGggY29uZmlnOiBcIiArIEpTT04uc3RyaW5naWZ5KGNvbmZpZykpO1xuICAgIHJldHVybiB2YWwxO1xuICB9XG4gIFxuICAvKipcbiAgICogUmV0dXJucyBhIGh1bWFuLWZyaWVuZGx5IGtleSB2YWx1ZSBsaW5lLlxuICAgKiBcbiAgICogQHBhcmFtIGtleSBpcyB0aGUga2V5XG4gICAqIEBwYXJhbSB2YWx1ZSBpcyB0aGUgdmFsdWVcbiAgICogQHBhcmFtIGluZGVudCBpbmRlbnRzIHRoZSBsaW5lXG4gICAqIEBwYXJhbSBuZXdsaW5lIHNwZWNpZmllcyBpZiB0aGUgc3RyaW5nIHNob3VsZCBiZSB0ZXJtaW5hdGVkIHdpdGggYSBuZXdsaW5lIG9yIG5vdFxuICAgKiBAcGFyYW0gaWdub3JlVW5kZWZpbmVkIHNwZWNpZmllcyBpZiB1bmRlZmluZWQgdmFsdWVzIHNob3VsZCByZXR1cm4gYW4gZW1wdHkgc3RyaW5nXG4gICAqIEByZXR1cm4ge3N0cmluZ30gaXMgdGhlIGh1bWFuLWZyaWVuZGx5IGtleSB2YWx1ZSBsaW5lXG4gICAqL1xuICBzdGF0aWMga3ZMaW5lKGtleSwgdmFsdWUsIGluZGVudCA9IDAsIG5ld2xpbmUgPSB0cnVlLCBpZ25vcmVVbmRlZmluZWQgPSB0cnVlKSB7XG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQgJiYgaWdub3JlVW5kZWZpbmVkKSByZXR1cm4gXCJcIjtcbiAgICByZXR1cm4gR2VuVXRpbHMuZ2V0SW5kZW50KGluZGVudCkgKyBrZXkgKyBcIjogXCIgKyB2YWx1ZSArIChuZXdsaW5lID8gJ1xcbicgOiBcIlwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFJlcGxhY2UgYmlnIGludGVnZXJzICgxNiBvciBtb3JlIGNvbnNlY3V0aXZlIGRpZ2l0cykgd2l0aCBzdHJpbmdzIGluIG9yZGVyXG4gICAqIHRvIHByZXNlcnZlIG51bWVyaWMgcHJlY2lzaW9uLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHN0ciBpcyB0aGUgc3RyaW5nIHRvIGJlIG1vZGlmaWVkXG4gICAqIEByZXR1cm4ge3N0cmluZ30gdGhlIG1vZGlmaWVkIHN0cmluZyB3aXRoIGJpZyBudW1iZXJzIGNvbnZlcnRlZCB0byBzdHJpbmdzXG4gICAqL1xuICBzdGF0aWMgc3RyaW5naWZ5QmlnSW50cyhzdHIpIHtcbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoLyhcIlteXCJdKlwiXFxzKjpcXHMqKShcXGR7MTYsfSkvZywgJyQxXCIkMlwiJyk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBQcmludCB0aGUgY3VycmVudCBzdGFjayB0cmFjZS4gXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbXNnIC0gb3B0aW9uYWwgbWVzc2FnZSB0byBwcmludCB3aXRoIHRoZSB0cmFjZVxuICAgKi9cbiAgc3RhdGljIHByaW50U3RhY2tUcmFjZShtc2cpIHtcbiAgICB0cnkgeyB0aHJvdyBuZXcgRXJyb3IobXNnKTsgfVxuICAgIGNhdGNoIChlcnI6IGFueSkgeyBjb25zb2xlLmVycm9yKGVyci5zdGFjayk7IH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIFdhaXQgZm9yIHRoZSBkdXJhdGlvbi5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBkdXJhdGlvbk1zIC0gdGhlIGR1cmF0aW9uIHRvIHdhaXQgZm9yIGluIG1pbGxpc2Vjb25kc1xuICAgKi9cbiAgc3RhdGljIGFzeW5jIHdhaXRGb3IoZHVyYXRpb25Ncykge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlKSB7IHNldFRpbWVvdXQocmVzb2x2ZSwgZHVyYXRpb25Ncyk7IH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogS2lsbCB0aGUgZ2l2ZW4gbm9kZWpzIGNoaWxkIHByb2Nlc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge0NoaWxkUHJvY2Vzc30gcHJvY2VzcyAtIHRoZSBub2RlanMgY2hpbGQgcHJvY2VzcyB0byBraWxsXG4gICAqIEBwYXJhbSB7bnVtYmVyIHwgTm9kZUpTLlNpZ25hbHN9IFtzaWduYWxdIC0gdGhlIGtpbGwgc2lnbmFsLCBlLmcuIFNJR1RFUk0sIFNJR0tJTEwsIFNJR0lOVCAoZGVmYXVsdClcbiAgICogQHJldHVybiB7UHJvbWlzZTxudW1iZXIgfCB1bmRlZmluZWQ+fSB0aGUgZXhpdCBjb2RlIGZyb20ga2lsbGluZyB0aGUgcHJvY2Vzc1xuICAgKi9cbiAgc3RhdGljIGFzeW5jIGtpbGxQcm9jZXNzKHByb2Nlc3M6IENoaWxkUHJvY2Vzcywgc2lnbmFsPzogbnVtYmVyIHwgTm9kZUpTLlNpZ25hbHMpOiBQcm9taXNlPG51bWJlciB8IHVuZGVmaW5lZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBwcm9jZXNzLm9uKFwiZXhpdFwiLCBmdW5jdGlvbihjb2RlLCBzaWduYWwpIHsgcmVzb2x2ZShjb2RlKTsgfSk7XG4gICAgICBwcm9jZXNzLm9uKFwiZXJyb3JcIiwgZnVuY3Rpb24oZXJyKSB7IHJlamVjdChlcnIpOyB9KTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmICghcHJvY2Vzcy5raWxsKHNpZ25hbCA9PT0gdW5kZWZpbmVkID8gXCJTSUdJTlRcIiA6IHNpZ25hbCkpIHJlc29sdmUodW5kZWZpbmVkKTsgLy8gcmVzb2x2ZSBpbW1lZGlhdGVseSBpZiBub3QgcnVubmluZ1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIE5vcm1hbGl6ZSBhIFVSSS5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1cmkgLSB0aGUgVVJJIHRvIG5vcm1hbGl6ZVxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IHRoZSBub3JtYWxpemVkIFVSSVxuICAgKi9cbiAgc3RhdGljIG5vcm1hbGl6ZVVyaSh1cmkpIHtcbiAgICBpZiAoIXVyaSkgdGhyb3cgRXJyb3IoXCJNdXN0IHByb3ZpZGUgVVJJIHRvIG5vcm1hbGl6ZVwiKTtcbiAgICB1cmkgPSB1cmkucmVwbGFjZSgvXFwvJC8sIFwiXCIpOyAvLyBzdHJpcCB0cmFpbGluZyBzbGFzaFxuICAgIGlmICghbmV3IFJlZ0V4cChcIl5cXFxcdys6Ly8uK1wiKS50ZXN0KHVyaSkpIHVyaT0gXCJodHRwOi8vXCIgKyB1cmk7IC8vIGFzc3VtZSBodHRwIGlmIHByb3RvY29sIG5vdCBnaXZlblxuICAgIHJldHVybiB1cmk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGFic29sdXRlIHZhbHVlIG9mIHRoZSBnaXZlbiBiaWdpbnQgb3IgbnVtYmVyLlxuICAgKiBcbiAgICogQHBhcmFtIHtiaWdpbnQgfCBudW1iZXJ9IGJpIC0gdGhlIGJpZ2ludCBvciBudW1iZXIgdG8gZ2V0IHRoZSBhYnNvbHV0ZSB2YWx1ZSBvZlxuICAgKiBAcmV0dXJuIHtiaWdpbnQgfCBudW1iZXJ9IHRoZSBhYnNvbHV0ZSB2YWx1ZSBvZiB0aGUgZ2l2ZW4gYmlnaW50IG9yIG51bWJlclxuICAgKi9cbiAgc3RhdGljIGFicyhiaTogYmlnaW50IHwgbnVtYmVyKTogYmlnaW50IHwgbnVtYmVyIHtcbiAgICByZXR1cm4gYmkgPCAwID8gLWJpIDogYmk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGFuIGVudW0ga2V5IG5hbWUgYnkgdmFsdWUuXG4gICAqIFxuICAgKiBAcGFyYW0ge2FueX0gZW51bVR5cGUgaXMgdGhlIGVudW0gdHlwZSB0byBnZXQgdGhlIGtleSBmcm9tXG4gICAqIEBwYXJhbSB7YW55fSBlbnVtVmFsdWUgaXMgdGhlIGVudW0gdmFsdWUgdG8gZ2V0IHRoZSBrZXkgZm9yXG4gICAqIEByZXR1cm4ge3N0cmluZyB8IHVuZGVmaW5lZH0gdGhlIGVudW0ga2V5IG5hbWVcbiAgICovXG4gIHN0YXRpYyBnZXRFbnVtS2V5QnlWYWx1ZShlbnVtVHlwZTogYW55LCBlbnVtVmFsdWU6IGFueSk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgZm9yIChsZXQga2V5IGluIGVudW1UeXBlKSB7XG4gICAgICBpZiAoZW51bVR5cGVba2V5XSA9PT0gZW51bVZhbHVlKSByZXR1cm4ga2V5O1xuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG59XG5cbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLE1BQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNlLE1BQU1FLFFBQVEsQ0FBQzs7RUFFNUI7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsT0FBT0MsU0FBU0EsQ0FBQ0MsR0FBUSxFQUFXO0lBQ2xDLE9BQU8sT0FBT0EsR0FBRyxLQUFLLFdBQVc7RUFDbkM7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsT0FBT0MsV0FBV0EsQ0FBQ0QsR0FBRyxFQUFXO0lBQy9CLE9BQU8sT0FBT0EsR0FBRyxLQUFLLFdBQVc7RUFDbkM7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsT0FBT0UsYUFBYUEsQ0FBQ0YsR0FBUSxFQUFXO0lBQ3RDLE9BQU9BLEdBQUcsS0FBS0csU0FBUyxJQUFJSCxHQUFHLEtBQUssSUFBSTtFQUMxQzs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxPQUFPSSxlQUFlQSxDQUFDSixHQUFRLEVBQVc7SUFDeEMsSUFBSSxDQUFDQSxHQUFHLEVBQUUsT0FBTyxJQUFJO0lBQ3JCLE9BQU8sS0FBSztFQUNkOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE9BQU9LLFFBQVFBLENBQUNMLEdBQVEsRUFBVztJQUNqQyxPQUFPLENB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