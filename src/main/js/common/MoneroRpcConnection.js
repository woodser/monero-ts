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
   * Construct a RPC connection.
   * 
   * @param {string|object|uriOrConfigOrConnection} uriOrConfigOrConnection is the rpc endpoint uri or MoneroRpcConnection or equivalent JS object
   * @param {string} username is the username to authenticate with the rpc endpoint (optional)
   * @param {string} password is the password to authenticate with the rpc endpoint (optional)
   * @param {boolean} rejectUnauthorized rejects self-signed certificates if true
   */
  constructor(uriOrConfigOrConnection, username, password, rejectUnauthorized) {
    
    // validate and normalize config
    if (typeof uriOrConfigOrConnection === "string") {
      this.config = {uri: uriOrConfigOrConnection};
      if (username !== undefined) this.config.username = username;
      if (password !== undefined) this.config.password = password;
      if (rejectUnauthorized !== undefined) this.config.rejectUnauthorized = rejectUnauthorized;
    } else {
      if (typeof uriOrConfigOrConnection !== "object") throw new MoneroError("Invalid configuration to MoneroRpcConnection; must be string or MoneroRpcConnection or equivalent JS object");
      if (username !== undefined || password !== undefined || rejectUnauthorized !== undefined) throw new MoneroError("Can provide config object or params but not both");
      if (uriOrConfigOrConnection instanceof MoneroRpcConnection) this.config = Object.assign({}, uriOrConfigOrConnection.getConfig());
      else this.config = Object.assign({}, uriOrConfigOrConnection);
    }
    
    // merge default config
    this.config = Object.assign({}, MoneroRpcConfigDefault, this.config);
    
    // standardize uri
    if (this.config.uri) this.config.uri = this.config.uri.replace(/\/$/, ""); // strip trailing slash
    
    // fail with friendly message if using old api
    if (this.config.user || this.config.pass) throw new MoneroError("Authentication fields 'user' and 'pass' have been renamed to 'username' and 'password'.  Please update to the new api");
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
        console.error(resp);
      }
      if (resp.error) throw new MoneroRpcError(resp.error.message, resp.error.code, path, params);
      return resp;
    } catch (e) {
      if (e instanceof MoneroRpcError) throw e;
      else throw new MoneroRpcError(e, undefined, path, params);
    }
  }
}

MoneroRpcConnection.SUPPORTED_FIELDS = ["uri", "username", "password", "rejectUnauthorized"];

module.exports = MoneroRpcConnection;