const Http = require('http');
const Request = require("request-promise");
const PromiseThrottle = require("promise-throttle");
const MoneroUtils = require("../utils/MoneroUtils.js");
const MoneroRpcError = require("./MoneroRpcError");

/**
 * Default RPC configuration.
 */
const MoneroRpcConfigDefault = {
    uri: null,
    protocol: "http",
    host: "localhost",
    port: 18081,
    user: null,
    pass: null,
    maxRequestsPerSecond: 50
}

/**
 * Interacts with a Monero RPC API.
 */
class MoneroRpc {
  
  /**
   * Constructs a RPC connection using the given config.
   * 
   * @param {object}  config defines the rpc configuration
   * @param {string}  config.uri is the uri of the rpc endpoint
   * @param {string}  config.protocol is the protocol of the rpc endpoint
   * @param {string}  config.host is the host of the rpc endpoint
   * @param {int}     config.port is the port of the rpc endpoint
   * @param {string}  config.user is a username to authenticate with the rpc endpoint
   * @param {string}  config.password is a password to authenticate with the rpc endpoint
   * @param {string}  config.maxRequestsPerSecond is the maximum requests per second to allow
   */
  constructor(config) {
    
    // merge config with defaults
    this.config = Object.assign({}, MoneroRpcConfigDefault, config);
    
    // standardize uri
    if (this.config.uri) {
      // TODO: strip trailing slash
    } else {
      this.config.uri = this.config.protocol + "://" + this.config.host + ":" + this.config.port;
    }
    
    // initialize promise throttler
    this.promiseThrottle = new PromiseThrottle({
      requestsPerSecond: this.config.maxRequestsPerSecond,
      promiseImplementation: Promise
    });
    
    // initialize http agent
    this.agent = new Http.Agent({keepAlive: true, maxSockets: 1});
  }
  
  /**
   * Sends a JSON RPC request.
   * 
   * @param method is the JSON RPC method to invoke
   * @param params are request parameters
   * @return {object} is the response map
   */
  async sendJsonRequest(method, params) {
    //console.log("sendJsonRequest(" + method + ", " + JSON.stringify(params) + ")");
    
    // build request which gets json response as text
    let opts = {
      method: "POST",
      uri: this.config.uri + "/json_rpc",
      body: JSON.stringify({  // body is stringified so text/plain is returned so BigIntegers are properly parsed because JS numbers are limited to 53 bits which can lose precision
        id: "0",
        jsonrpc: "2.0",
        method: method,
        params: params
      }),
      agent: this.agent,
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
    resp = JSON.parse(resp.replace(/("[^"]*"\s*:\s*)(\d{16,})/g, '$1"$2"'));  // replace 16 or more digits with strings and parse
    //console.log(JSON.stringify(resp));
    if (resp.error) {
      //console.error("Request failed: " + resp.error.code + ": " + resp.error.message);
      //console.error(opts);
      throw new MoneroRpcError(resp.error.message, resp.error.code, method, params);
    }
    return resp;
  }
  
  /**
   * Sends a RPC request to the given path and with the given paramters.
   * 
   * E.g. "/get_transactions" with params
   */
  async sendPathRequest(path, params) {
    //console.log("sendPathRequest(" + path + ", " + JSON.stringify(params) + ")");
    
    // build request which gets json response as text
    let opts = {
      method: "POST",
      uri: this.config.uri + "/" + path,
      agent: this.agent,
      body: JSON.stringify(params)
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
    resp = JSON.parse(resp.replace(/("[^"]*"\s*:\s*)(\d{16,})/g, '$1"$2"'));  // replace 16 or more digits with strings and parse
    if (typeof resp === "string") resp = JSON.parse(resp);  // TODO: some responses returned as strings?
    if (resp.error) throw new MoneroRpcError(resp.error.message, resp.error.code, path, params);
    return resp;
  }
  
  /**
   * Sends a binary RPC request.
   * 
   * @param path is the path of the binary RPC method to invoke
   * @paramm params are the request parameters
   * @return a Uint8Array with the binary response
   */
  async sendBinaryRequest(path, params) {
    //console.log("sendBinaryRequest(" + path + ", " + JSON.stringify(params) + ")");
    
    // get core utils to serialize and deserialize binary requests
    let coreUtils = await MoneroUtils.getCoreUtils();
    
    // serialize params
    let paramsBin = coreUtils.json_to_binary(params);
    
    // build request
    let opts = {
      method: "POST",
      uri: this.config.uri + "/" + path,
      agent: this.agent,
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
    if (resp.error) throw new MoneroRpcError(resp.error.message, resp.error.code, path, params);
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