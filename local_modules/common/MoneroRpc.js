const MoneroRpcError = require("../common/MoneroRpcError");
const request = require("request-promise");
const http = require('http');


/**
 * Default RPC configuration.
 */
const MoneroRpcConfigDefault = {
    protocol: "http",
    host: "localhost",
    port: 18081,
    user: null,
    pass: null,
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
    this.config = Object.assign({}, MoneroRpcConfigDefault, config);
    
    // standardize uri
    if (config.uri) {
      // TODO: strip trailing slash
    } else {
      this.config.uri = this.config.protocol + "://" + this.config.host + ":" + this.config.port;
    }
    
    console.log("Constructing RPC connection with this config:");
    console.log(this.config);
  }
  
  /**
   * Sends a JSON RPC request.
   * 
   * @param method is the JSON RPC method to invoke
   * @param params are request parameters
   * @return a Promise invoked with the response
   */
  async sendJsonRpcRequest(method, params) {
    
    // build request
    let opts = {
        json: {
          id: "0",
          jsonrpc: "2.0",
          method: method,
          params: params
        },
        agent: new http.Agent({
          keepAlive: true,
          maxSockets: 1
        })
    };
    if (this.config.user) {
      opts.forever = true;
      opts.auth = {
          user: this.config.user,
          pass: this.config.pass,
          sendImmediately: false
      }
    }
    
    // send request and await response
    let resp = await request.post(this.config.uri + "/json_rpc", opts);
    if (resp.error) throw new MoneroRpcError(resp.error.code, resp.error.message, opts);
    return resp;
  }
}

module.exports = MoneroRpc;