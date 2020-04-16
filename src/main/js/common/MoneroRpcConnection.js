/**
 * Default RPC configuration.
 */
const MoneroRpcConfigDefault = {
    uri: undefined,
    username: undefined,
    password: undefined,
    rejectUnauthorized: true  // reject self-signed certificates if true
}

/**
 * Maintains a connection and sends requests to a Monero RPC API.
 */
class MoneroRpcConnection {
  
  /**
   * Constructs a RPC connection using the given config.
   * 
   * @param {object} config defines the rpc configuration
   * @param {string} config.uri is the uri of the rpc endpoint
   * @param {string} config.username is a username to authenticate with the rpc endpoint
   * @param {string} config.password is a password to authenticate with the rpc endpoint
   * @param {string} config.rejectUnauthorized rejects self-signed certificates if true
   */
  constructor(config) {
    
    // normalize config
    if (typeof config === "string") this.config = {uri: config};
    else this.config = Object.assign({}, config);
    
    // merge config with defaults
    this.config = Object.assign({}, MoneroRpcConfigDefault, this.config);
    
    // standardize uri
    if (this.config.uri) this.config.uri = this.config.uri.replace(/\/$/, ""); // strip trailing slash
  }
  
  getUri() {
    return this.config.uri;
  }
  
  getUsername() {
    return this.config.username;
  }
  
  getPassword() {
    return this.config.password;
  }
  
  getRejectUnauthorized() {
    return this.config.rejectUnauthorized;
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
    
    try {
      // send request
      let resp = await HttpClient.request({
        method: "POST",
        uri: this.getUri() + '/json_rpc',
        username: this.getUsername(),
        password: this.getPassword(),
        body: JSON.stringify({  // body is stringified so text/plain is returned so BigIntegers are preserved
          id: "0",
          jsonrpc: "2.0",
          method: method,
          params: params
        }),
        rejectUnauthorized: this.config.rejectUnauthorized,
        requestApi: GenUtils.isFirefox() ? "xhr" : "fetch"  // firefox issue: https://bugzilla.mozilla.org/show_bug.cgi?id=1491010
      });
      
      // process response
      resp = JSON.parse(resp.body.replace(/("[^"]*"\s*:\s*)(\d{16,})/g, '$1"$2"'));  // replace 16 or more digits with strings and parse
      if (resp.error) throw new MoneroRpcError(resp.error.message, resp.error.code, method, params);
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
    
    try {
      // send request
      let resp = await HttpClient.request({
        method: "POST",
        uri: this.getUri() + '/' + path,
        username: this.getUsername(),
        password: this.getPassword(),
        body: JSON.stringify(params),  // body is stringified so text/plain is returned so BigIntegers are preserved
        rejectUnauthorized: this.config.rejectUnauthorized,
        requestApi: GenUtils.isFirefox() ? "xhr" : "fetch"
      });
      
      // process response
      resp = JSON.parse(resp.body.replace(/("[^"]*"\s*:\s*)(\d{16,})/g, '$1"$2"'));  // replace 16 or more digits with strings and parse
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
    await MoneroUtils.loadKeysModule();
    
    // serialize params
    let paramsBin = MoneroUtils.jsonToBinary(params);
    
    try {
      // send request
      let resp = await HttpClient.request({
        method: "POST",
        uri: this.getUri() + '/' + path,
        username: this.getUsername(),
        password: this.getPassword(),
        body: paramsBin,
        rejectUnauthorized: this.config.rejectUnauthorized,
        requestApi: GenUtils.isFirefox() ? "xhr" : "fetch"
      });
      
      // process response
      resp = resp.body;
      if (!(resp instanceof Uint8Array)) {
        console.error("resp is not uint8array");
        console.log(resp);
      }
      if (resp.error) throw new MoneroRpcError(resp.error.message, resp.error.code, path, params);
      return resp;
    } catch (e) {
      if (e instanceof MoneroRpcError) throw e;
      else throw new MoneroRpcError(e, undefined, path, params);
    }
  }
}

module.exports = MoneroRpcConnection;