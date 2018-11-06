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
 * Sends requests to the Monero RPC API.
 */
class MoneroRpc {
  
  /**
   * Constructs a RPC connection using the given config.
   * 
   * @param config defines the rpc configuration as a map
   */
  constructor(config) {
    config = Object.assign({}, MoneroRpcConfigDefault, config);
    
    console.log("Constructing RPC connection with this config:");
    console.log(config);
    
    throw new Error("Not implemented");
  }
}

modules.export = MoneroRpc;