/**
 * Exception when interacting with a Monero wallet or daemon.
 */
class MoneroError extends Error {
  
  /**
   * Constructs the error.
   * 
   * @param {string} description is a human-readable description of the error
   * @param {int} code is the error code (optional)
   */
  constructor(description, code) {
    super();
    this.description = description;
    this.code = code;
    this.message = this.toString();  // overwrite error message
  }
  
  getDescription() {
    return this.description;
  }
  
  getCode() {
    return this.code;
  }
  
  toString() {
    let str = "";
    if (this.getCode() !== undefined) str += this.getCode() + ": ";
    str += this.getDescription();
    return str;
  }
}

module.exports = MoneroError;