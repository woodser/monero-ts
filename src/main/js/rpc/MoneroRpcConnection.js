/**
 * Default RPC configuration.
 */
const MoneroRpcConfigDefault = {
    uri: undefined,
    protocol: "http",
    host: "localhost",
    port: 18081,
    user: undefined,
    pass: undefined,
    rejectUnauthorized: true  // reject self-signed certificates if true
}

/**
 * Maintains a connection and sends requests to a Monero RPC API.
 */
class MoneroRpcConnection {
  
  /**
   * Constructs a RPC connection using the given config.
   * 
   * @param {object}  config defines the rpc configuration
   * @param {string}  config.uri is the uri of the rpc endpoint
   * @param {string}  config.protocol is the protocol of the rpc endpoint
   * @param {string}  config.host is the host of the rpc endpoint
   * @param {int}     config.port is the port of the rpc endpoint
   * @param {string}  config.user is a username to authenticate with the rpc endpoint
   * @param {string}  config.pass is a password to authenticate with the rpc endpoint
   * @param {string}  config.maxRequestsPerSecond is the maximum requests per second to allow
   */
  constructor(config) {
    
    // normalize config
    if (typeof config === "string") this.config = {uri: config};
    else {
      if (config && config.uri) assert(!config.host && !config.protocol && !config.port, "Can specify either uri or protocol, host, and port but not both");
      this.config = Object.assign({}, config);
    }
    
    // merge config with defaults
    this.config = Object.assign({}, MoneroRpcConfigDefault, this.config);
    
    // delete protocol, host, and port if uri given
    if (this.config.uri) {
      delete this.config.protocol;
      delete this.config.host;
      delete this.config.port;
    }
    
    // standardize uri
    if (this.config.uri) {
      this.config.uri = this.config.uri.replace(/\/$/, ""); // strip trailing slash
    } else {
      this.config.uri = this.config.protocol + "://" + this.config.host + ":" + this.config.port;
    }
    
    // initialize http agent
    if (this.config.uri.startsWith("https")) {
      let https = require('https');
      this.agent = MoneroUtils.getHttpsAgent();
    } else {
      let http = require('http');
      this.agent = MoneroUtils.getHttpAgent();
    }
  }
  
  getUri() {
    return this.config.uri;
  }
  
  getUsername() {
    return this.config.user;
  }
  
  getPassword() {
    return this.config.pass;
  }
  
  getConfig() {
    return this.config;
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
      rejectUnauthorized: this.config.rejectUnauthorized,
      requestCert: true
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
    try {
      let resp = await MoneroUtils.throttledRequest(opts);
      resp = JSON.parse(resp.replace(/("[^"]*"\s*:\s*)(\d{16,})/g, '$1"$2"'));  // replace 16 or more digits with strings and parse
      //console.log(JSON.stringify(resp));
      if (resp.error) {
        //console.error("Request failed: " + resp.error.code + ": " + resp.error.message);
        //console.error(opts);
        throw new MoneroRpcError(resp.error.message, resp.error.code, method, params);
      }
      return resp;
    } catch (e) {
      if (e instanceof MoneroRpcError) throw e;
      else throw new MoneroRpcError(e, undefined, method, params);
    }
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
      body: JSON.stringify(params),
      agent: this.agent,
      rejectUnauthorized: this.config.rejectUnauthorized,
      requestCert: true
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
    try {
      let resp = await MoneroUtils.throttledRequest(opts);
      resp = JSON.parse(resp.replace(/("[^"]*"\s*:\s*)(\d{16,})/g, '$1"$2"'));  // replace 16 or more digits with strings and parse
      if (typeof resp === "string") resp = JSON.parse(resp);  // TODO: some responses returned as strings?
      if (resp.error) throw new MoneroRpcError(resp.error.message, resp.error.code, path, params);
      return resp;
    } catch (e) {
      if (e instanceof MoneroRpcError) throw e;
      else throw new MoneroRpcError(e, undefined, path, params);
    }
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
    
    // load wasm module
    await MoneroUtils.loadWasmModule();
    
    // serialize params
    let paramsBin = MoneroUtils.jsonToBinary(params);
    
    // build request
    let opts = {
      method: "POST",
      uri: this.config.uri + "/" + path,
      agent: this.agent,
      encoding: null,
      body: paramsBin,
      rejectUnauthorized: this.config.rejectUnauthorized,
      requestCert: true
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
    try {
      let resp = await MoneroUtils.throttledRequest(opts);
      if (resp.error) throw new MoneroRpcError(resp.error.message, resp.error.code, path, params);
      return new Uint8Array(resp, 0, resp.length);
    } catch (e) {
      if (e instanceof MoneroRpcError) throw e;
      else throw new MoneroRpcError(e, undefined, path, params);
    }
  }
}

module.exports = MoneroRpcConnection;