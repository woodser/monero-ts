"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0; /**
 * Exception when interacting with a Monero wallet or daemon.
 */
class MoneroError extends Error {



  /**
   * Constructs the error.
   * 
   * @param {string} message is a human-readable message of the error
   * @param {number} [code] is the error code (optional)
   */
  constructor(message, code) {
    super(message);
    this.code = code;
  }

  getCode() {
    return this.code;
  }

  toString() {
    if (this.message === undefined && this.getCode() === undefined) return super.message;
    let str = "";
    if (this.getCode() !== undefined) str += this.getCode() + ": ";
    str += this.message;
    return str;
  }
}exports.default = MoneroError;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJNb25lcm9FcnJvciIsIkVycm9yIiwiY29uc3RydWN0b3IiLCJtZXNzYWdlIiwiY29kZSIsImdldENvZGUiLCJ0b1N0cmluZyIsInVuZGVmaW5lZCIsInN0ciIsImV4cG9ydHMiLCJkZWZhdWx0Il0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvY29tbW9uL01vbmVyb0Vycm9yLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogRXhjZXB0aW9uIHdoZW4gaW50ZXJhY3Rpbmcgd2l0aCBhIE1vbmVybyB3YWxsZXQgb3IgZGFlbW9uLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNb25lcm9FcnJvciBleHRlbmRzIEVycm9yIHtcblxuICBjb2RlOiBudW1iZXI7XG4gIFxuICAvKipcbiAgICogQ29uc3RydWN0cyB0aGUgZXJyb3IuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSBpcyBhIGh1bWFuLXJlYWRhYmxlIG1lc3NhZ2Ugb2YgdGhlIGVycm9yXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbY29kZV0gaXMgdGhlIGVycm9yIGNvZGUgKG9wdGlvbmFsKVxuICAgKi9cbiAgY29uc3RydWN0b3IobWVzc2FnZSwgY29kZT8pIHtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB0aGlzLmNvZGUgPSBjb2RlO1xuICB9XG4gIFxuICBnZXRDb2RlKCkge1xuICAgIHJldHVybiB0aGlzLmNvZGU7XG4gIH1cbiAgXG4gIHRvU3RyaW5nKCkge1xuICAgIGlmICh0aGlzLm1lc3NhZ2UgPT09IHVuZGVmaW5lZCAmJiB0aGlzLmdldENvZGUoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gc3VwZXIubWVzc2FnZTtcbiAgICBsZXQgc3RyID0gXCJcIjtcbiAgICBpZiAodGhpcy5nZXRDb2RlKCkgIT09IHVuZGVmaW5lZCkgc3RyICs9IHRoaXMuZ2V0Q29kZSgpICsgXCI6IFwiO1xuICAgIHN0ciArPSB0aGlzLm1lc3NhZ2U7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoicUdBQUE7QUFDQTtBQUNBO0FBQ2UsTUFBTUEsV0FBVyxTQUFTQyxLQUFLLENBQUM7Ozs7RUFJN0M7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0VDLFdBQVdBLENBQUNDLE9BQU8sRUFBRUMsSUFBSyxFQUFFO0lBQzFCLEtBQUssQ0FBQ0QsT0FBTyxDQUFDO0lBQ2QsSUFBSSxDQUFDQyxJQUFJLEdBQUdBLElBQUk7RUFDbEI7O0VBRUFDLE9BQU9BLENBQUEsRUFBRztJQUNSLE9BQU8sSUFBSSxDQUFDRCxJQUFJO0VBQ2xCOztFQUVBRSxRQUFRQSxDQUFBLEVBQUc7SUFDVCxJQUFJLElBQUksQ0FBQ0gsT0FBTyxLQUFLSSxTQUFTLElBQUksSUFBSSxDQUFDRixPQUFPLENBQUMsQ0FBQyxLQUFLRSxTQUFTLEVBQUUsT0FBTyxLQUFLLENBQUNKLE9BQU87SUFDcEYsSUFBSUssR0FBRyxHQUFHLEVBQUU7SUFDWixJQUFJLElBQUksQ0FBQ0gsT0FBTyxDQUFDLENBQUMsS0FBS0UsU0FBUyxFQUFFQyxHQUFHLElBQUksSUFBSSxDQUFDSCxPQUFPLENBQUMsQ0FBQyxHQUFHLElBQUk7SUFDOURHLEdBQUcsSUFBSSxJQUFJLENBQUNMLE9BQU87SUFDbkIsT0FBT0ssR0FBRztFQUNaO0FBQ0YsQ0FBQ0MsT0FBQSxDQUFBQyxPQUFBLEdBQUFWLFdBQUEifQ==