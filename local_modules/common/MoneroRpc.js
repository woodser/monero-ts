const request = require('request-promise');

/**
 * Default RPC configuration.
 */
const MoneroRpcConfigDefault = {
    protocol: "http",
    host: "localhost",
    port: 18081,
    username: null,
    password: null,
    uri: null
}

/**
 * Interacts with a Monero RPC API.
 */
class MoneroRpc {
  
  /**
   * Constructs a RPC connection using the given config.
   * 
   * @param config defines the rpc configuration as a map
   */
  constructor(config) {
    
    // merge config with defaults
    config = Object.assign({}, MoneroRpcConfigDefault, config);
    
    console.log("Constructing RPC connection with this config:");
    console.log(config);
  }
  
  sendRpcRequest(method, params) {
    throw new Error("Not implemented");
  }
}

module.exports = MoneroRpc;