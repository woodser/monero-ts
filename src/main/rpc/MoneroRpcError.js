const MoneroError = require("../utils/MoneroError");

/**
 * Error when interacting with Monero RPC.
 */
class MoneroRpcError extends MoneroError {
  
  /**
   * Constructs the error.
   * 
   * @param {string} rpcDescription is a description of the error from rpc
   * @param {int} rpcCode is the error code from rpc
   * @param {string} rpcMethod is the rpc method invoked
   * @param {object} rpcParams are parameters sent with the rpc request
   */
  constructor(rpcDescription, rpcCode, rpcMethod, rpcParams) {
    super(rpcDescription, rpcCode);
    this.rpcMethod = rpcMethod;
    this.rpcParams = rpcParams;
    this.message = this.toString(); // overwrite error message
  }
  
  getRpcMethod() {
    return this.rpcMethod;
  }
  
  getRpcParams() {
    return this.rpcParams;
  }
  
  toString() {
    let str = super.toString();
    str += "\nRequest: '" + this.getRpcMethod() + "' with params: " + (typeof this.getRpcParams() === "object" ? JSON.stringify(this.getRpcParams()) : this.getRpcParams());
    return str;
  }
}

module.exports = MoneroRpcError;