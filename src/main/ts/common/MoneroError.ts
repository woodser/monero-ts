/**
 * Exception when interacting with a Monero wallet or daemon.
 */
export default class MoneroError extends Error {

  code: number;
  
  /**
   * Constructs the error.
   * 
   * @param {string|Error} message is a human-readable message or the error to wrap
   * @param {number} [code] is the error code (optional)
   */
  constructor(message, code?) {
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
}
