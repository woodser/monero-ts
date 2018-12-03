const Http = require('http');
const Request = require("request-promise");
const PromiseThrottle = require("promise-throttle");
const MoneroUtils = require("../utils/MoneroUtils.js");
const MoneroRpcError = require("./MoneroRpcError");

/**
 * Default RPC configuration.
 */
const MoneroRpcConfigDefault = {
    protocol: "http",
    host: "localhost",
    port: 18081,
    user: null,
    pass: null,
    uri: null,
    requestsPerSecond: 1000
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
    
    // initialize promise throttler
    this.promiseThrottle = new PromiseThrottle({
      requestsPerSecond: this.config.requestsPerSecond,
      promiseImplementation: Promise
    })
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
        method: "POST",
        uri: this.config.uri + "/json_rpc",
        json: {
          id: "0",
          jsonrpc: "2.0",
          method: method,
          params: params
        },
        agent: new Http.Agent({ // TODO: recycle agent?
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
    let resp = await this._throttledRequest(opts);
    if (resp.error) {
      //console.error("Request failed: " + resp.error.code + ": " + resp.error.message);
      //console.error(opts);
      throw new MoneroRpcError(resp.error.code, resp.error.message, opts);
    }
    return resp.result;
  }
  
  /**
   * Sends a RPC request to the given path and with the given paramters.
   * 
   * E.g. "/get_transactions" with params
   */
  async sendPathRpcRequest(path, params) {
    
    // build request
    let opts = {
        method: "POST",
        uri: this.config.uri + "/" + path,
        agent: new Http.Agent({ // TODO: recycle agent?
          keepAlive: true,
          maxSockets: 1
        }),
        json: params
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
    let resp = await this._throttledRequest(opts);
    if (resp.error) throw new MoneroRpcError(resp.error.code, resp.error.message, opts);
    return resp;
  }
  
  /**
   * Sends a binary RPC request.
   * 
   * @param path is the path of the binary RPC method to invoke
   * @params are the request parameters
   * @returns a Uint8Array with the binary response
   */
  async sendBinRpcRequest(path, params) {
    
    // get core utils to serialize and deserialize binary requests
    let coreUtils = await MoneroUtils.getCoreUtils();
    
    // serialize params
    let paramsBin = coreUtils.json_to_binary(params);
    
    // build request
    let opts = {
        method: "POST",
        uri: this.config.uri + "/" + path,
        agent: new Http.Agent({ // TODO: recycle agent?
          keepAlive: true,
          maxSockets: 1
        }),
        encoding: null,
        body: paramsBin
    };
    if (this.config.user) {
      opts.forever = true;
      opts.auth = {
        user: this.config.user,
        pass: this.config.pass,
        sendImmediately: false
      }
    }
    
    // send request and store binary response as Uint8Array
    let resp = await this._throttledRequest(opts);
    if (resp.error) throw new MoneroRpcError(resp.error.code, resp.error.message, opts);
    return new Uint8Array(resp, 0, resp.length);
  }
  
  /**
   * Makes a throttled request.
   */
  _throttledRequest(opts) {
    return this.promiseThrottle.add(function(opts) { return Request(opts); }.bind(this, opts));
  }
}

module.exports = MoneroRpc;