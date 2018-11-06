/**
 * Error when interacting with Monero RPC.
 */
class MoneroRpcError extends Error {

  /**
   * Constructs the error.
   * 
   * @param code is the RPC error code
   * @param message is the RPC error message
   * @param requestOpts are request options sent with the request
   */
  constructor(code, message, requestOpts) {
    super(code + ": " + message);
    this.rpcCode = code;
    this.rpcMessage = message;
    this.requestOpts = requestOpts;
  }
  
  getCode() {
    return this.rpcCode;
  }
  
  getMessage() {
    return this.rpcMessage;
  }
  
  getRequestOpts() {
    return this.requestOpts;
  }
}

module.exports = MoneroRpcError;