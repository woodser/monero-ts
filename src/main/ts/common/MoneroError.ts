/**
 * Exception when interacting with a Monero wallet or daemon.
 */
export default class MoneroError extends Error {

  code: number;
  
  /**
   * Constructs the error.
   * 
   * @param {string} message is a human-readable message of the error
   * @param {number} [code] is the error code (optional)
   */
  constructor(message, code?) {
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
}
