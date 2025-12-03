import MoneroError from "./MoneroError";

/**
 * Error when interacting with Monero RPC.
 */
export default class MoneroRpcError extends MoneroError {

  // instance variables
  protected rpcMethod: any;
  protected rpcParams: any;
  
  /**
   * Constructs the error.
   * 
   * @param {string} rpcDescription is a description of the error from rpc
   * @param {number} rpcCode is the error code from rpc
   * @param {string} [rpcMethod] is the rpc method invoked
   * @param {object} [rpcParams] are parameters sent with the rpc request
   */
  constructor(rpcDescription, rpcCode, rpcMethod?, rpcParams?) {
    super(rpcDescription, rpcCode);
    this.rpcMethod = rpcMethod;
    this.rpcParams = rpcParams;
  }
  
  getRpcMethod() {
    return this.rpcMethod;
  }
  
  getRpcParams() {
    return this.rpcParams;
  }
  
  toString() {
    let str = super.toString();
    if (this.rpcMethod) str += "\nRPC request: '" + this.rpcMethod + "'";
    if (this.stack) str += `\nStack:\n${this.stack}`;
    return str;
  }
}
