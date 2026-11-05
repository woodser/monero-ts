"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0; /**
 * Exception when interacting with a Monero wallet or daemon.
 */
class MoneroError extends Error {



  /**
   * Constructs the error.
   * 
   * @param {string|Error} message is a human-readable message or the error to wrap
   * @param {number} [code] is the error code (optional)
   */
  constructor(message, code) {
    super(message);
    this.code = code;
    if (message instanceof Error) this.cause = message; // keep a wrapped error reachable as the cause
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJNb25lcm9FcnJvciIsIkVycm9yIiwiY29uc3RydWN0b3IiLCJtZXNzYWdlIiwiY29kZSIsImNhdXNlIiwiZ2V0Q29kZSIsInRvU3RyaW5nIiwidW5kZWZpbmVkIiwic3RyIiwiZXhwb3J0cyIsImRlZmF1bHQiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy9jb21tb24vTW9uZXJvRXJyb3IudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBFeGNlcHRpb24gd2hlbiBpbnRlcmFjdGluZyB3aXRoIGEgTW9uZXJvIHdhbGxldCBvciBkYWVtb24uXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1vbmVyb0Vycm9yIGV4dGVuZHMgRXJyb3Ige1xuXG4gIGNvZGU6IG51bWJlcjtcbiAgXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RzIHRoZSBlcnJvci5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfEVycm9yfSBtZXNzYWdlIGlzIGEgaHVtYW4tcmVhZGFibGUgbWVzc2FnZSBvciB0aGUgZXJyb3IgdG8gd3JhcFxuICAgKiBAcGFyYW0ge251bWJlcn0gW2NvZGVdIGlzIHRoZSBlcnJvciBjb2RlIChvcHRpb25hbClcbiAgICovXG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2UsIGNvZGU/KSB7XG4gICAgc3VwZXIobWVzc2FnZSk7XG4gICAgdGhpcy5jb2RlID0gY29kZTtcbiAgICBpZiAobWVzc2FnZSBpbnN0YW5jZW9mIEVycm9yKSB0aGlzLmNhdXNlID0gbWVzc2FnZTsgLy8ga2VlcCBhIHdyYXBwZWQgZXJyb3IgcmVhY2hhYmxlIGFzIHRoZSBjYXVzZVxuICB9XG4gIFxuICBnZXRDb2RlKCkge1xuICAgIHJldHVybiB0aGlzLmNvZGU7XG4gIH1cbiAgXG4gIHRvU3RyaW5nKCkge1xuICAgIGlmICh0aGlzLm1lc3NhZ2UgPT09IHVuZGVmaW5lZCAmJiB0aGlzLmdldENvZGUoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gc3VwZXIubWVzc2FnZTtcbiAgICBsZXQgc3RyID0gXCJcIjtcbiAgICBpZiAodGhpcy5nZXRDb2RlKCkgIT09IHVuZGVmaW5lZCkgc3RyICs9IHRoaXMuZ2V0Q29kZSgpICsgXCI6IFwiO1xuICAgIHN0ciArPSB0aGlzLm1lc3NhZ2U7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoicUdBQUE7QUFDQTtBQUNBO0FBQ2UsTUFBTUEsV0FBVyxTQUFTQyxLQUFLLENBQUM7Ozs7RUFJN0M7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0VDLFdBQVdBLENBQUNDLE9BQU8sRUFBRUMsSUFBSyxFQUFFO0lBQzFCLEtBQUssQ0FBQ0QsT0FBTyxDQUFDO0lBQ2QsSUFBSSxDQUFDQyxJQUFJLEdBQUdBLElBQUk7SUFDaEIsSUFBSUQsT0FBTyxZQUFZRixLQUFLLEVBQUUsSUFBSSxDQUFDSSxLQUFLLEdBQUdGLE9BQU8sQ0FBQyxDQUFDO0VBQ3REOztFQUVBRyxPQUFPQSxDQUFBLEVBQUc7SUFDUixPQUFPLElBQUksQ0FBQ0YsSUFBSTtFQUNsQjs7RUFFQUcsUUFBUUEsQ0FBQSxFQUFHO0lBQ1QsSUFBSSxJQUFJLENBQUNKLE9BQU8sS0FBS0ssU0FBUyxJQUFJLElBQUksQ0FBQ0YsT0FBTyxDQUFDLENBQUMsS0FBS0UsU0FBUyxFQUFFLE9BQU8sS0FBSyxDQUFDTCxPQUFPO0lBQ3BGLElBQUlNLEdBQUcsR0FBRyxFQUFFO0lBQ1osSUFBSSxJQUFJLENBQUNILE9BQU8sQ0FBQyxDQUFDLEtBQUtFLFNBQVMsRUFBRUMsR0FBRyxJQUFJLElBQUksQ0FBQ0gsT0FBTyxDQUFDLENBQUMsR0FBRyxJQUFJO0lBQzlERyxHQUFHLElBQUksSUFBSSxDQUFDTixPQUFPO0lBQ25CLE9BQU9NLEdBQUc7RUFDWjtBQUNGLENBQUNDLE9BQUEsQ0FBQUMsT0FBQSxHQUFBWCxXQUFBIn0=