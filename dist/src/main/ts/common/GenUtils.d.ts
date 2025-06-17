/// <reference types="node" />
/// <reference types="node" />
import { ChildProcess } from "child_process";
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
export default class GenUtils {
    /**
     * Indicates if the given argument is defined.
     *
     * @param {any} arg is the arg to test
     * @return {boolean} true if the given arg is defined, false otherwise
     */
    static isDefined(arg: any): boolean;
    /**
     * Indicates if the given argument is undefined.
     *
     * @param arg is the arg to test
     * @return {boolean} true if the given arg is undefined, false otherwise
     */
    static isUndefined(arg: any): boolean;
    /**
     * Indicates if the given arg is initialized.
     *
     * @param {any} arg is the arg to test
     * @return {boolean} true if the given arg is initialized, false otherwise
     */
    static isInitialized(arg: any): boolean;
    /**
     * Indicates if the given arg is uninitialized.
     *
     * @param arg is the arg to test
     * @return true if the given arg is uninitialized, false otherwise
     */
    static isUninitialized(arg: any): boolean;
    /**
     * Indicates if the given argument is a number.
     *
     * @param {any} arg is the argument to test
     * @return {boolean} true if the argument is a number, false otherwise
     */
    static isNumber(arg: any): boolean;
    /**
     * Indicates if the given argument is an integer.
     *
     * @param {any} arg is the argument to test
     * @return {boolean} true if the given argument is an integer, false otherwise
     */
    static isInt(arg: any): boolean;
    /**
     * Indicates if the given argument is an array.
     *
     * @param {any} arg is the argument to test as being an array
     * @return {booolean} true if the argument is an array, false otherwise
     */
    static isArray(arg: any): boolean;
    /**
     * Indicates if the given argument is a string.
     *
     * @param {any} arg is the argument to test as being a string
     * @return {boolean} true if the argument is a string, false otherwise
     */
    static isString(arg: any): boolean;
    /**
     * Determines if the given argument is a boolean.
     *
     * @param {any} arg is the argument to test as being a boolean
     * @return {boolean} true if the argument is a boolean, false otherwise
     */
    static isBoolean(arg: any): boolean;
    /**
     * Determines if the given argument is a static.
     *
     * @param {any} arg is the argument to test as being a static
     * @return {boolean} true if the argument is a static, false otherwise
     */
    static isFunction(arg: any): boolean;
    /**
     * Indicates if the given argument is an object and optionally if it has the given constructor name.
     *
     * @param {any} arg is the argument to test
     * @param {any} obj is an object to test arg instanceof obj (optional)
     * @return {boolean} true if the given argument is an object and optionally has the given constructor name
     */
    static isObject(arg: any, obj?: any): boolean;
    /**
     * Determines if all alphabet characters in the given string are upper case.
     *
     * @param {string} str is the string to test
     * @return {boolean} true if the string is upper case, false otherwise
     */
    static isUpperCase(str: string): boolean;
    /**
     * Determines if all alphabet characters in the given string are lower case.
     *
     * @param str is the string to test
     * @param true if the string is lower case, false otherwise
     */
    static isLowerCase(str: any): boolean;
    /**
     * Asserts that the given argument is hex.
     *
     * @param arg is the argument to assert as hex
     * @param msg is the message to throw if the argument is not hex
     */
    static assertHex(str: any, msg: any): void;
    /**
     * Indicates if the given argument is a hexidemal string.
     *
     * Credit: https://github.com/roryrjb/is-hex/blob/master/is-hex.js.
     *
     * @param str is the string to test
     * @return true if the given string is hexidecimal, false otherwise
     */
    static isHex(arg: any): boolean;
    /**
     * Determines if the given string is base32.
     */
    static isBase32(str: any): boolean;
    /**
     * Asserts that the given argument is base58.
     *
     * @param arg is the argument to assert as base58
     * @param msg is the message to throw if the argument is not base58
     */
    static assertBase58(str: any, msg: any): void;
    /**
     * Determines if the given string is base58.
     */
    static isBase58(str: any): boolean;
    /**
     * Asserts that the given argument is base64.
     *
     * @param arg is the argument to assert as base64
     * @param msg is the message to throw if the argument is not base64
     */
    static assertBase64(str: any, msg: any): void;
    /**
     * Determines if the given string is base64.
     */
    static isBase64(str: any): boolean;
    /**
     * Throws an exception with the given message.
     *
     * @param msg defines the message to throw the exception with (optional)
     */
    static fail(msg?: any): void;
    /**
     * Asserts that the given condition is true.  Throws an exception if not a boolean or false.
     *
     * @param {boolean} condition is the boolean to assert true
     * @param {string} [msg] is the message to throw if condition is false (optional)
     */
    static assertTrue(condition: any, msg?: any): void;
    /**
     * Asserts that the given boolean is false.  Throws an exception if not a boolean or true.
     *
     * @param bool is the boolean to assert false
     * @param msg is the message to throw if bool is true (optional)
     */
    static assertFalse(bool: any, msg?: any): void;
    /**
     * Asserts that the given argument is null.  Throws an exception if not null.
     *
     * @param arg is the argument to assert null
     * @param msg is the message to throw if arg is not null (optional)
     */
    static assertNull(arg: any, msg?: any): void;
    /**
     * Asserts that the given argument is not null.  Throws an exception if null.
     *
     * @param arg is the argument to assert not null
     * @param msg is the message to throw if arg is null (optional)
     */
    static assertNotNull(arg: any, msg?: any): void;
    /**
     * Asserts that the given argument is defined.  Throws an exception if undefined.
     *
     * @param arg is the argument to assert defined
     * @param msg is the message to throw if arg is undefined (optional)
     */
    static assertDefined(arg: any, msg?: any): void;
    /**
     * Asserts that the given argument is undefined.  Throws an exception if defined.
     *
     * @param arg is the argument to assert undefined
     * @param msg is the message to throw if arg is defined (optional)
     */
    static assertUndefined(arg: any, msg?: any): void;
    /**
     * Asserts that the given argument is initialized.  Throws an exception if not initialized.
     *
     * @param arg is the argument to assert as initialized
     * @param msg is the message to throw if arg is not initialized (optional)
     */
    static assertInitialized(arg: any, msg?: any): void;
    /**
     * Asserts that the given argument is uninitialized.  Throws an exception if initialized.
     *
     * @param arg is the argument to assert as uninitialized
     * @param msg is the message to throw if arg is initialized (optional)
     */
    static assertUninitialized(arg: any, msg?: any): void;
    /**
     * Asserts that the given arguments are equal.  Throws an exception if not equal.
     *
     * @param arg1 is an argument to assert as equal
     * @param arg2 is an argument to assert as equal
     * @param msg is the message to throw if the arguments are not equal
     */
    static assertEquals(arg1: any, arg2: any, msg?: any): void;
    /**
     * Asserts that the given arguments are not equal.  Throws an exception if equal.
     *
     * @param arg1 is an argument to assert as not equal
     * @param arg2 is an argument to assert as not equal
     * @param msg is the message to throw if the arguments are equal
     */
    static assertNotEquals(arg1: any, arg2: any, msg?: any): void;
    /**
     * Asserts that the given argument is an integer.
     *
     * @param arg is the argument to assert as an integer
     * @param msg is the message to throw if the argument is not an integer
     */
    static assertInt(arg: any, msg?: any): void;
    /**
     * Asserts that the given argument is a number.
     *
     * @param arg is the argument to assert as a number
     * @param msg is the message to throw if the argument is not a number
     */
    static assertNumber(arg: any, msg?: any): void;
    /**
     * Asserts that the given argument is a boolean.
     *
     * @param arg is the argument to assert as a boolean
     * @param msg is the message to throw if the argument is not a boolean
     */
    static assertBoolean(arg: any, msg?: any): void;
    /**
     * Asserts that the given argument is a string.
     *
     * @param arg is the argument to assert as a string
     * @param msg is the message to throw if the argument is not a string
     */
    static assertString(arg: any, msg?: any): void;
    /**
     * Asserts that the given argument is an array.
     *
     * @param arg is the argument to assert as an array
     * @param msg is the message to throw if the argument is not an array
     */
    static assertArray(arg: any, msg?: any): void;
    /**
     * Asserts that the given argument is a static.
     *
     * @param arg is the argument to assert as a static
     * @param msg is the message to throw if the argument is not a static
     */
    static assertFunction(arg: any, msg?: any): void;
    /**
     * Asserts that the given argument is an object with the given name.
     *
     * @param arg is the argument to test
     * @param obj is an object to assert arg instanceof obj (optional)
     * @param msg is the message to throw if the argument is not the specified object
     */
    static assertObject(arg: any, obj: any, msg?: any): void;
    /**
     * Sets the child's prototype to the parent's prototype.
     *
     * @param child is the child class
     * @param parent is the parent class
     */
    static inheritsFrom(child: any, parent: any): void;
    /**
     * Invokes functions with arguments.
     *
     * arguments[0] is assumed to be an array of functions to invoke
     * arguments[1...n] are args to invoke the functions with
     */
    static invoke(): void;
    /**
     * Returns the power set of the given array.
     *
     * @param arr is the array to get the power set of
     * @return [][] is the power set of the given array
     */
    static getPowerSet(arr: any): any[];
    /**
     * Returns the power set of the given array whose elements are the given size.
     *
     * @param arr is the array to get the power set of
     * @param size is the required size of the elements within the power set
     * returns [][] is the power set of the given array whose elements are the given size
     */
    static getPowerSetOfLength(arr: any, size: any): any[];
    /**
     * Returns an array of indices of the given size.
     *
     * @param size specifies the size to get indices for
     * @return array of the given size with indices starting at 0
     */
    static getIndices(size: any): any[];
    /**
     * Returns a new array containing unique elements of the given array.
     *
     * @param arr is the array to return unique elements from
     * @return a new array with the given array's unique elements
     */
    static toUniqueArray(arr: any): any;
    /**
     * Copies the given array.
     *
     * @param arr is the array to copy
     * @return a copy of the given array
     */
    static copyArray(arr: any): any[];
    /**
     * Removes every instance of the given value from the given array.
     *
     * @param arr is the array to remove the value from
     * @param val is the value to remove from the array
     * @return true if the value is found and removed, false otherwise
     */
    static remove(arr: any, val: any): boolean;
    /**
     * Returns a copy of the given array where each element is lowercase.
     *
     * @param arr is the array to convert to lowercase
     * @return a copy of the given array where each element is lowercase
     */
    static toLowerCaseArray(arr: any): any[];
    /**
     * Listifies the given argument.
     *
     * @param arrOrElem is an array or an element in the array
     * @return an array which is the given arg if it's an array or an array with the given arg as an element
     */
    static listify(arrOrElem: any): any;
    /**
     * Indicates if the given array contains the given object.
     *
     * @param {any} arr - array that may or may not contain the object
     * @param {any} obj - object to check for inclusion in the array
     * @param {boolean} [compareByReference] - compare strictly by reference, forgoing deep equality check (default false)
     * @return true if the array contains the object, false otherwise
     */
    static arrayContains(arr: any, obj: any, compareByReference?: boolean): boolean;
    /**
     * Indicates if the given string contains the given substring.
     *
     * @param str is the string to search for a substring
     * @param substring is the substring to searchin within the string
     * @return true if the substring is within the string, false otherwise
     */
    static strContains(str: any, substring: any): boolean;
    /**
     * Determines if two arrays are equal.
     *
     * @param arr1 is an array to compare
     * @param arr2 is an array to compare
     * @return true if the arrays are equal, false otherwise
     */
    static arraysEqual(arr1: any, arr2: any): boolean;
    /**
     * Determines if two arguments are deep equal.
     *
     * @param arg1 is an argument to compare
     * @param arg2 is an argument to compare
     * @return true if the arguments are deep equals, false otherwise
     */
    static equals(arg1: any, arg2: any): boolean;
    /**
     * Determines if two objects are deep equal.
     *
     * Undefined values are considered equal to non-existent keys.
     *
     * @param map1 is a map to compare
     * @param map2 is a map to compare
     * @return true if the maps have identical keys and values, false otherwise
     */
    static objectsEqual(map1: any, map2: any): boolean;
    /**
     * Deletes properties from the object that are undefined.
     *
     * @param obj is the object to delete undefined keys from
     */
    static deleteUndefinedKeys(obj: any): void;
    /**
     * Returns combinations of the given array of the given size.
     *
     * @param arr is the array to get combinations from
     * @param combinationSize specifies the size of each combination
     */
    static getCombinations(arr: any, combinationSize: any): any[];
    /**
     * Gets an 'a' element that is downloadable when clicked.
     *
     * @param name is the name of the file to download
     * @param contents are the string contents of the file to download
     * @return 'a' dom element with downloadable file
     */
    static getDownloadableA(name: any, contents: any): HTMLAnchorElement;
    /**
     * Copies properties in the given object to a new object.
     *
     * @param obj is object to copy properties for
     * @return a new object with properties copied from the given object
     */
    static copyProperties(obj: any): any;
    /**
     * Deletes all properties in the given object.
     *
     * @param obj is the object to delete properties from
     */
    static deleteProperties(obj: any): void;
    /**
     * Indicates if the given string contains whitespace.
     *
     * @param str is the string to test
     * @return true if the string contains whitespace, false otherwise
     */
    static hasWhitespace(str: any): boolean;
    /**
     * Indicates if the given character is whitespace.
     *
     * @param char is the character to test
     * @return true if the given character is whitespace, false otherwise
     */
    static isWhitespace(char: any): boolean;
    /**
     * Indicates if the given character is a newline.
     *
     * @param char is the character to test
     * @return true if the given character is a newline, false otherwise
     */
    static isNewline(char: any): boolean;
    /**
     * Counts the number of non-whitespace characters in the given string.
     *
     * @param str is the string to count the number of non-whitespace characters in
     * @return int is the number of non-whitespace characters in the given string
     */
    static countNonWhitespaceCharacters(str: any): number;
    /**
     * Returns tokens separated by whitespace from the given string.
     *
     * @param str is the string to get tokens from
     * @return string[] are the tokens separated by whitespace within the string
     */
    static getWhitespaceTokens(str: any): any;
    /**
     * Returns lines separated by newlines from the given string.
     *
     * @param str is the string to get lines from
     * @param string[] are the lines separated by newlines within the string
     */
    static getLines(str: any): any;
    /**
     * Returns the document's first stylesheet which has no href.
     *
     * @return StyleSheet is the internal stylesheet
     */
    static getInternalStyleSheet(): CSSStyleSheet;
    /**
     * Returns the document's internal stylesheet as text.
     *
     * @return str is the document's internal stylesheet
     */
    static getInternalStyleSheetText(): string;
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
    static buildHtmlDocument(content: any): string;
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
    static newWindow(content: any, onLoad: any): void;
    /**
     * Converts the given image to a base64 encoded data url.
     *
     * @param img is the image to convert
     * @param quality is a number between 0 and 1 specifying the image quality
     */
    static imgToDataUrl(img: any, quality: any): string;
    /**
     * Determines if the image at the given URL is accessible.
     *
     * @param url is the url to an image
     * @param timeout is the maximum time to wait
     * @param onDone(bool) when the image is determined to be accessible or not
     */
    static isImageAccessible(url: any, timeout: any, onDone: any): void;
    /**
     * Determines if the given file is a zip file.
     *
     * @param file is a file
     * @return true if the given file is a zip file, false otherwise
     */
    static isZipFile(file: any): any;
    /**
     * Determines if the given file is a json file.
     *
     * @param file is a file
     * @return true if the given file is a json file, false otherwise
     */
    static isJsonFile(file: any): any;
    /**
     * Determines if the given file is a txt file.
     *
     * @param file is a file
     * @return true if the given file is a txt file, false otherwise
     */
    static isTxtFile(file: any): any;
    /**
     * Fetches the given list of images.
     *
     * Prerequisite: async.js.
     *
     * @param paths are the paths to the images to fetch
     * @param onDone(err, images) is called when done
     */
    static getImages(paths: any, onDone: any): void;
    /**
     * Returns a string indentation of the given length;
     *
     * @param length is the length of the indentation
     * @return {string} is an indentation string of the given length
     */
    static getIndent(length: any): string;
    static initPolyfills(): void;
    /**
     * Generates a v4 UUID.
     *
     * Source: https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
     */
    static getUUID(): string;
    /**
     * Indicates if the current environment is a browser.
     *
     * @return {boolean} true if the environment is a browser, false otherwise
     */
    static isBrowser(): boolean;
    /**
     * Indicates if the current environment is Deno
     *
     * @return {boolean} true if the environment is Deno, false otherwise
     */
    static isDeno(): boolean;
    /**
     * Indicates if the current environment is a firefox-based browser.
     *
     * @return {boolean} true if the environment is a firefox-based browser, false otherwise
     */
    static isFirefox(): boolean;
    /**
     * Gets the IE version number.
     *
     * Credit: https://stackoverflow.com/questions/19999388/check-if-user-is-using-ie-with-jquery/21712356#21712356
     *
     * @return the IE version number or null if not IE
     */
    static getIEVersion(): number;
    /**
     * Gets a parameter value.
     *
     * Credit: https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
     *
     * @param name is the name of the parameter to get the value of
     * @param url is a URL to get the parameter from, uses the window's current href if not given
     * @return the parameter's value
     */
    static getParameterByName(name: any, url: any): string;
    /**
     * Gets a non-cryptographically secure random number within a given range.
     *
     * @param min is the minimum range of the int to generate, inclusive
     * @param max is the maximum range of the int to generate, inclusive
     *
     * Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
     */
    static getRandomInt(min: any, max: any): any;
    /**
     * Gets random ints.
     *
     * @param min is the minimum range of the ints to generate, inclusive
     * @param max is the maximum range of the ints to generate, inclusive
     * @param count is the number of random ints to get
     */
    static getRandomInts(min: any, max: any, count: any): any[];
    /**
     * Gets a given number of unique random ints within a range.
     *
     * @param min is the minimum range of the ints to generate, inclusive
     * @param max is the maximum range of the ints to generate, inclusive
     * @param count is the number of unique random ints to get
     */
    static getUniqueRandomInts(min: any, max: any, count: any): any[];
    /**
     * Randomize array element order in-place using Durstenfeld shuffle algorithm.
     *
     * Credit: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
     */
    static shuffle(array: any): void;
    /**
     * Sorts an array by natural ordering.
     *
     * @param the array to sort
     */
    static sort(array: any): void;
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
    static safeSet(obj: any, getFn: any, setFn: any, val: any, config?: any, errMsg?: any): void;
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
    static reconcile(val1: any, val2: any, config?: any, errMsg?: any): any;
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
    static kvLine(key: any, value: any, indent?: number, newline?: boolean, ignoreUndefined?: boolean): string;
    /**
     * Replace big integers (16 or more consecutive digits) with strings in order
     * to preserve numeric precision.
     *
     * @param {string} str is the string to be modified
     * @return {string} the modified string with big numbers converted to strings
     */
    static stringifyBigInts(str: any): any;
    /**
     * Print the current stack trace.
     *
     * @param {string} msg - optional message to print with the trace
     */
    static printStackTrace(msg: any): void;
    /**
     * Wait for the duration.
     *
     * @param {number} durationMs - the duration to wait for in milliseconds
     */
    static waitFor(durationMs: any): Promise<unknown>;
    /**
     * Kill the given nodejs child process.
     *
     * @param {ChildProcess} process - the nodejs child process to kill
     * @param {number | NodeJS.Signals} [signal] - the kill signal, e.g. SIGTERM, SIGKILL, SIGINT (default)
     * @return {Promise<number | undefined>} the exit code from killing the process
     */
    static killProcess(process: ChildProcess, signal?: number | NodeJS.Signals): Promise<number | undefined>;
    /**
     * Normalize a URI.
     *
     * @param {string} uri - the URI to normalize
     * @return {string} the normalized URI
     */
    static normalizeUri(uri: any): any;
    /**
     * Get the absolute value of the given bigint or number.
     *
     * @param {bigint | number} bi - the bigint or number to get the absolute value of
     * @return {bigint | number} the absolute value of the given bigint or number
     */
    static abs(bi: bigint | number): bigint | number;
    /**
     * Get an enum key name by value.
     *
     * @param {any} enumType is the enum type to get the key from
     * @param {any} enumValue is the enum value to get the key for
     * @return {string | undefined} the enum key name
     */
    static getEnumKeyByValue(enumType: any, enumValue: any): string | undefined;
    /**
     * Resolve the given promise with a timeout.
     *
     * @param promise the promise to resolve within the timeout
     * @param timeoutMs the timeout in milliseconds to resolve the promise
     * @return the result of the promise unless error thrown
     */
    static executeWithTimeout(promise: any, timeoutMs: any): Promise<any>;
}
