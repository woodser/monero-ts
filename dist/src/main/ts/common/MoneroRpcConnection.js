"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _GenUtils = _interopRequireDefault(require("./GenUtils"));
var _HttpClient = _interopRequireDefault(require("./HttpClient"));
var _LibraryUtils = _interopRequireDefault(require("./LibraryUtils"));
var _MoneroError = _interopRequireDefault(require("./MoneroError"));
var _MoneroRpcError = _interopRequireDefault(require("./MoneroRpcError"));
var _MoneroUtils = _interopRequireDefault(require("./MoneroUtils"));

/**
 * Maintains a connection and sends requests to a Monero RPC API.
 */
class MoneroRpcConnection {

  // public instance variables







  // private instance variables






  // default config
  /** @private */
  static DEFAULT_CONFIG = {
    uri: undefined,
    username: undefined,
    password: undefined,
    rejectUnauthorized: true, // reject self-signed certificates if true
    proxyToWorker: false,
    priority: 0
  };

  /**
   * <p>Construct a RPC connection.</p>
   * 
   * <p>Examples:</p>
   * 
   * <code>
   * let connection1 = new MoneroRpcConnection("http://localhost:38081", "daemon_user", "daemon_password_123")<br><br>
   * 
   * let connection2 = new MoneroRpcConnection({<br>
   * &nbsp;&nbsp; uri: http://localhost:38081,<br>
   * &nbsp;&nbsp; username: "daemon_user",<br>
   * &nbsp;&nbsp; password: "daemon_password_123",<br>
   * &nbsp;&nbsp; rejectUnauthorized: false, // accept self-signed certificates e.g. for local development<br>
   * &nbsp;&nbsp; proxyToWorker: true // proxy request to worker (default false)<br>
   * });
   * </code>
   * 
   * @param {string|Partial<MoneroRpcConnection>} uriOrConnection - MoneroRpcConnection or URI of the RPC endpoint
   * @param {string} uriOrConnection.uri - URI of the RPC endpoint
   * @param {string} [uriOrConnection.username] - username to authenticate with the RPC endpoint (optional)
   * @param {string} [uriOrConnection.password] - password to authenticate with the RPC endpoint (optional)
   * @param {boolean} [uriOrConnection.rejectUnauthorized] - rejects self-signed certificates if true (default true)
   * @param {boolean} uriOrConnection.proxyToWorker - proxy requests to worker (default true)
   * @param {string} username - username to authenticate with the RPC endpoint (optional)
   * @param {string} password - password to authenticate with the RPC endpoint (optional)
   */
  constructor(uriOrConnection, username, password) {

    // validate and normalize config
    if (typeof uriOrConnection === "string") {
      Object.assign(this, MoneroRpcConnection.DEFAULT_CONFIG);
      this.uri = uriOrConnection;
      this.setCredentials(username, password);
    } else {
      if (username !== undefined || password !== undefined) throw new _MoneroError.default("Can provide config object or params but not both");
      Object.assign(this, MoneroRpcConnection.DEFAULT_CONFIG, uriOrConnection);
      this.setCredentials(this.username, this.password);
    }

    // normalize uri
    if (this.uri) this.uri = _GenUtils.default.normalizeUri(this.uri);
  }

  setCredentials(username, password) {
    if (username === "") username = undefined;
    if (password === "") password = undefined;
    if (username || password) {
      if (!username) throw new _MoneroError.default("username must be defined because password is defined");
      if (!password) throw new _MoneroError.default("password must be defined because username is defined");
    }
    if (this.username === "") this.username = undefined;
    if (this.password === "") this.password = undefined;
    if (this.username !== username || this.password !== password) {
      this.isOnline = undefined;
      this.isAuthenticated = undefined;
    }
    this.username = username;
    this.password = password;
    return this;
  }

  getUri() {
    return this.uri;
  }

  getUsername() {
    return this.username ? this.username : "";
  }

  getPassword() {
    return this.password ? this.password : "";
  }

  getRejectUnauthorized() {
    return this.rejectUnauthorized;
  }

  setProxyToWorker(proxyToWorker) {
    this.proxyToWorker = proxyToWorker;
    return this;
  }

  getProxyToWorker() {
    return this.proxyToWorker;
  }

  getPriority() {
    return this.priority;
  }

  /**
   * Set the connection's priority relative to other connections. Priority 1 is highest,
   * then priority 2, etc. The default priority of 0 is lowest priority.
   * 
   * @param {number} [priority] - the connection priority (default 0)
   * @return {MoneroRpcConnection} this connection
   */
  setPriority(priority) {
    if (!(priority >= 0)) throw new _MoneroError.default("Priority must be >= 0");
    this.priority = priority;
    return this;
  }

  setAttribute(key, value) {
    if (!this.attributes) this.attributes = new Map();
    this.attributes.put(key, value);
    return this;
  }

  getAttribute(key) {
    return this.attributes.get(key);
  }

  /**
   * Check the connection status to update isOnline, isAuthenticated, and response time.
   * 
   * @param {number} timeoutMs - maximum response time before considered offline
   * @return {Promise<boolean>} true if there is a change in status, false otherwise
   */
  async checkConnection(timeoutMs) {
    await _LibraryUtils.default.loadKeysModule(); // cache wasm for binary request
    let isOnlineBefore = this.isOnline;
    let isAuthenticatedBefore = this.isAuthenticated;
    let startTime = Date.now();
    try {
      if (this.fakeDisconnected) throw new Error("Connection is fake disconnected");
      let heights = [];
      for (let i = 0; i < 100; i++) heights.push(i);
      await this.sendBinaryRequest("get_blocks_by_height.bin", { heights: heights }, timeoutMs); // assume daemon connection
      this.isOnline = true;
      this.isAuthenticated = true;
    } catch (err) {
      this.isOnline = false;
      this.isAuthenticated = undefined;
      this.responseTime = undefined;
      if (err instanceof _MoneroRpcError.default) {
        if (err.getCode() === 401) {
          this.isOnline = true;
          this.isAuthenticated = false;
        } else if (err.getCode() === 404) {// fallback to latency check
          this.isOnline = true;
          this.isAuthenticated = true;
        }
      }
    }
    if (this.isOnline) this.responseTime = Date.now() - startTime;
    return isOnlineBefore !== this.isOnline || isAuthenticatedBefore !== this.isAuthenticated;
  }

  /**
   * Indicates if the connection is connected according to the last call to checkConnection().<br><br>
   * 
   * Note: must call checkConnection() manually unless using MoneroConnectionManager.
   * 
   * @return {boolean} true or false to indicate if connected, or undefined if checkConnection() has not been called
   */
  isConnected() {
    return this.isOnline === undefined ? undefined : this.isOnline && this.isAuthenticated !== false;
  }

  /**
   * Indicates if the connection is online according to the last call to checkConnection().<br><br>
   * 
   * Note: must call checkConnection() manually unless using MoneroConnectionManager.
   * 
   * @return {boolean} true or false to indicate if online, or undefined if checkConnection() has not been called
   */
  getIsOnline() {
    return this.isOnline;
  }

  /**
   * Indicates if the connection is authenticated according to the last call to checkConnection().<br><br>
   * 
   * Note: must call checkConnection() manually unless using MoneroConnectionManager.
   * 
   * @return {boolean} true if authenticated or no authentication, false if not authenticated, or undefined if checkConnection() has not been called
   */
  getIsAuthenticated() {
    return this.isAuthenticated;
  }

  getResponseTime() {
    return this.responseTime;
  }

  /**
   * Send a JSON RPC request.
   * 
   * @param {string} method - JSON RPC method to invoke
   * @param {object} params - request parameters
   * @param {number} timeoutInMs - request timeout in milliseconds
   * @return {object} is the response map
   */
  async sendJsonRequest(method, params, timeoutInMs) {
    try {

      // build request body
      let body = JSON.stringify({ // body is stringified so text/plain is returned so bigints are preserved
        id: "0",
        jsonrpc: "2.0",
        method: method,
        params: params
      });

      // logging
      if (_LibraryUtils.default.getLogLevel() >= 2) _LibraryUtils.default.log(2, "Sending json request with method '" + method + "' and body: " + body);

      // send http request
      let startTime = new Date().getTime();
      let resp = await _HttpClient.default.request({
        method: "POST",
        uri: this.getUri() + '/json_rpc',
        username: this.getUsername(),
        password: this.getPassword(),
        body: body,
        timeout: timeoutInMs,
        rejectUnauthorized: this.rejectUnauthorized,
        requestApi: _GenUtils.default.isFirefox() ? "xhr" : "fetch", // firefox issue: https://bugzilla.mozilla.org/show_bug.cgi?id=1491010
        proxyToWorker: this.proxyToWorker
      });

      // validate response
      MoneroRpcConnection.validateHttpResponse(resp);

      // deserialize response
      if (resp.body[0] != '{') throw resp.body;
      resp = JSON.parse(resp.body.replace(/("[^"]*"\s*:\s*)(\d{16,})/g, '$1"$2"')); // replace 16 or more digits with strings and parse
      if (_LibraryUtils.default.getLogLevel() >= 3) {
        let respStr = JSON.stringify(resp);
        _LibraryUtils.default.log(3, "Received response from method='" + method + "', response=" + respStr.substring(0, Math.min(1000, respStr.length)) + "(" + (new Date().getTime() - startTime) + " ms)");
      }

      // check rpc response for errors
      MoneroRpcConnection.validateRpcResponse(resp, method, params);
      return resp;
    } catch (err) {
      if (err instanceof _MoneroRpcError.default) throw err;else
      throw new _MoneroRpcError.default(err, err.statusCode, method, params);
    }
  }

  /**
   * Send a RPC request to the given path and with the given paramters.
   * 
   * E.g. "/get_transactions" with params
   * 
   * @param {string} path - JSON RPC path to invoke
   * @param {object} params - request parameters
   * @param {number} timeoutInMs - request timeout in milliseconds
   * @return {object} is the response map
   */
  async sendPathRequest(path, params, timeoutInMs) {
    try {

      // logging
      if (_LibraryUtils.default.getLogLevel() >= 2) _LibraryUtils.default.log(2, "Sending path request with path '" + path + "' and params: " + JSON.stringify(params));

      // send http request
      let startTime = new Date().getTime();
      let resp = await _HttpClient.default.request({
        method: "POST",
        uri: this.getUri() + '/' + path,
        username: this.getUsername(),
        password: this.getPassword(),
        body: JSON.stringify(params), // body is stringified so text/plain is returned so bigints are preserved
        timeout: timeoutInMs,
        rejectUnauthorized: this.rejectUnauthorized,
        requestApi: _GenUtils.default.isFirefox() ? "xhr" : "fetch",
        proxyToWorker: this.proxyToWorker
      });

      // validate response
      MoneroRpcConnection.validateHttpResponse(resp);

      // deserialize response
      if (resp.body[0] != '{') throw resp.body;
      resp = JSON.parse(resp.body.replace(/("[^"]*"\s*:\s*)(\d{16,})/g, '$1"$2"')); // replace 16 or more digits with strings and parse
      if (typeof resp === "string") resp = JSON.parse(resp); // TODO: some responses returned as strings?
      if (_LibraryUtils.default.getLogLevel() >= 3) {
        let respStr = JSON.stringify(resp);
        _LibraryUtils.default.log(3, "Received response from path='" + path + "', response=" + respStr.substring(0, Math.min(1000, respStr.length)) + "(" + (new Date().getTime() - startTime) + " ms)");
      }

      // check rpc response for errors
      MoneroRpcConnection.validateRpcResponse(resp, path, params);
      return resp;
    } catch (err) {
      if (err instanceof _MoneroRpcError.default) throw err;else
      throw new _MoneroRpcError.default(err, err.statusCode, path, params);
    }
  }

  /**
   * Send a binary RPC request.
   * 
   * @param {string} path - path of the binary RPC method to invoke
   * @param {object} [params] - request parameters
   * @param {number} [timeoutInMs] - request timeout in milliseconds
   * @return {Uint8Array} the binary response
   */
  async sendBinaryRequest(path, params, timeoutInMs) {

    // serialize params
    let paramsBin = await _MoneroUtils.default.jsonToBinary(params);

    try {

      // logging
      if (_LibraryUtils.default.getLogLevel() >= 2) _LibraryUtils.default.log(2, "Sending binary request with path '" + path + "' and params: " + JSON.stringify(params));

      // send http request
      let resp = await _HttpClient.default.request({
        method: "POST",
        uri: this.getUri() + '/' + path,
        username: this.getUsername(),
        password: this.getPassword(),
        body: paramsBin,
        timeout: timeoutInMs,
        rejectUnauthorized: this.rejectUnauthorized,
        requestApi: _GenUtils.default.isFirefox() ? "xhr" : "fetch",
        proxyToWorker: this.proxyToWorker
      });

      // validate response
      MoneroRpcConnection.validateHttpResponse(resp);

      // process response
      resp = resp.body;
      if (!(resp instanceof Uint8Array)) {
        console.error("resp is not uint8array");
        console.error(resp);
      }
      if (resp.error) throw new _MoneroRpcError.default(resp.error.message, resp.error.code, path, params);
      return resp;
    } catch (err) {
      if (err instanceof _MoneroRpcError.default) throw err;else
      throw new _MoneroRpcError.default(err, err.statusCode, path, params);
    }
  }

  getConfig() {
    return {
      uri: this.uri,
      username: this.username,
      password: this.password,
      rejectUnauthorized: this.rejectUnauthorized,
      proxyToWorker: this.proxyToWorker,
      priority: this.priority
    };
  }

  toJson() {
    return Object.assign({}, this);
  }

  toString() {
    return this.getUri() + " (username=" + this.getUsername() + ", password=" + (this.getPassword() ? "***" : this.getPassword()) + ", priority=" + this.getPriority() + ", isOnline=" + this.getIsOnline() + ", isAuthenticated=" + this.getIsAuthenticated() + ")";
  }

  setFakeDisconnected(fakeDisconnected) {// used to test connection manager
    this.fakeDisconnected = fakeDisconnected;
  }

  // ------------------------------ PRIVATE HELPERS --------------------------

  static validateHttpResponse(resp) {
    let code = resp.statusCode;
    if (code < 200 || code > 299) {
      let content = resp.body;
      throw new _MoneroRpcError.default(code + " " + resp.statusText + (!content ? "" : ": " + content), code, undefined, undefined);
    }
  }

  static validateRpcResponse(resp, method, params) {
    if (!resp.error) return;
    throw new _MoneroRpcError.default(resp.error.message, resp.error.code, method, params);
  }
}exports.default = MoneroRpcConnection;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfR2VuVXRpbHMiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9IdHRwQ2xpZW50IiwiX0xpYnJhcnlVdGlscyIsIl9Nb25lcm9FcnJvciIsIl9Nb25lcm9ScGNFcnJvciIsIl9Nb25lcm9VdGlscyIsIk1vbmVyb1JwY0Nvbm5lY3Rpb24iLCJERUZBVUxUX0NPTkZJRyIsInVyaSIsInVuZGVmaW5lZCIsInVzZXJuYW1lIiwicGFzc3dvcmQiLCJyZWplY3RVbmF1dGhvcml6ZWQiLCJwcm94eVRvV29ya2VyIiwicHJpb3JpdHkiLCJjb25zdHJ1Y3RvciIsInVyaU9yQ29ubmVjdGlvbiIsIk9iamVjdCIsImFzc2lnbiIsInNldENyZWRlbnRpYWxzIiwiTW9uZXJvRXJyb3IiLCJHZW5VdGlscyIsIm5vcm1hbGl6ZVVyaSIsImlzT25saW5lIiwiaXNBdXRoZW50aWNhdGVkIiwiZ2V0VXJpIiwiZ2V0VXNlcm5hbWUiLCJnZXRQYXNzd29yZCIsImdldFJlamVjdFVuYXV0aG9yaXplZCIsInNldFByb3h5VG9Xb3JrZXIiLCJnZXRQcm94eVRvV29ya2VyIiwiZ2V0UHJpb3JpdHkiLCJzZXRQcmlvcml0eSIsInNldEF0dHJpYnV0ZSIsImtleSIsInZhbHVlIiwiYXR0cmlidXRlcyIsIk1hcCIsInB1dCIsImdldEF0dHJpYnV0ZSIsImdldCIsImNoZWNrQ29ubmVjdGlvbiIsInRpbWVvdXRNcyIsIkxpYnJhcnlVdGlscyIsImxvYWRLZXlzTW9kdWxlIiwiaXNPbmxpbmVCZWZvcmUiLCJpc0F1dGhlbnRpY2F0ZWRCZWZvcmUiLCJzdGFydFRpbWUiLCJEYXRlIiwibm93IiwiZmFrZURpc2Nvbm5lY3RlZCIsIkVycm9yIiwiaGVpZ2h0cyIsImkiLCJwdXNoIiwic2VuZEJpbmFyeVJlcXVlc3QiLCJlcnIiLCJyZXNwb25zZVRpbWUiLCJNb25lcm9ScGNFcnJvciIsImdldENvZGUiLCJpc0Nvbm5lY3RlZCIsImdldElzT25saW5lIiwiZ2V0SXNBdXRoZW50aWNhdGVkIiwiZ2V0UmVzcG9uc2VUaW1lIiwic2VuZEpzb25SZXF1ZXN0IiwibWV0aG9kIiwicGFyYW1zIiwidGltZW91dEluTXMiLCJib2R5IiwiSlNPTiIsInN0cmluZ2lmeSIsImlkIiwianNvbnJwYyIsImdldExvZ0xldmVsIiwibG9nIiwiZ2V0VGltZSIsInJlc3AiLCJIdHRwQ2xpZW50IiwicmVxdWVzdCIsInRpbWVvdXQiLCJyZXF1ZXN0QXBpIiwiaXNGaXJlZm94IiwidmFsaWRhdGVIdHRwUmVzcG9uc2UiLCJwYXJzZSIsInJlcGxhY2UiLCJyZXNwU3RyIiwic3Vic3RyaW5nIiwiTWF0aCIsIm1pbiIsImxlbmd0aCIsInZhbGlkYXRlUnBjUmVzcG9uc2UiLCJzdGF0dXNDb2RlIiwic2VuZFBhdGhSZXF1ZXN0IiwicGF0aCIsInBhcmFtc0JpbiIsIk1vbmVyb1V0aWxzIiwianNvblRvQmluYXJ5IiwiVWludDhBcnJheSIsImNvbnNvbGUiLCJlcnJvciIsIm1lc3NhZ2UiLCJjb2RlIiwiZ2V0Q29uZmlnIiwidG9Kc29uIiwidG9TdHJpbmciLCJzZXRGYWtlRGlzY29ubmVjdGVkIiwiY29udGVudCIsInN0YXR1c1RleHQiLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL2NvbW1vbi9Nb25lcm9ScGNDb25uZWN0aW9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBHZW5VdGlscyBmcm9tIFwiLi9HZW5VdGlsc1wiO1xuaW1wb3J0IEh0dHBDbGllbnQgZnJvbSBcIi4vSHR0cENsaWVudFwiO1xuaW1wb3J0IExpYnJhcnlVdGlscyBmcm9tIFwiLi9MaWJyYXJ5VXRpbHNcIjtcbmltcG9ydCBNb25lcm9FcnJvciBmcm9tIFwiLi9Nb25lcm9FcnJvclwiO1xuaW1wb3J0IE1vbmVyb1JwY0Vycm9yIGZyb20gXCIuL01vbmVyb1JwY0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvVXRpbHMgZnJvbSBcIi4vTW9uZXJvVXRpbHNcIjtcblxuLyoqXG4gKiBNYWludGFpbnMgYSBjb25uZWN0aW9uIGFuZCBzZW5kcyByZXF1ZXN0cyB0byBhIE1vbmVybyBSUEMgQVBJLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNb25lcm9ScGNDb25uZWN0aW9uIHtcblxuICAvLyBwdWJsaWMgaW5zdGFuY2UgdmFyaWFibGVzXG4gIHVyaTogc3RyaW5nO1xuICB1c2VybmFtZTogc3RyaW5nO1xuICBwYXNzd29yZDogc3RyaW5nO1xuICByZWplY3RVbmF1dGhvcml6ZWQ6IGJvb2xlYW47XG4gIHByb3h5VG9Xb3JrZXI6IGJvb2xlYW47XG4gIHByaW9yaXR5OiBudW1iZXI7XG5cbiAgLy8gcHJpdmF0ZSBpbnN0YW5jZSB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIGlzT25saW5lOiBib29sZWFuO1xuICBwcm90ZWN0ZWQgaXNBdXRoZW50aWNhdGVkOiBib29sZWFuO1xuICBwcm90ZWN0ZWQgYXR0cmlidXRlczogYW55O1xuICBwcm90ZWN0ZWQgZmFrZURpc2Nvbm5lY3RlZDogYm9vbGVhbjtcbiAgcHJvdGVjdGVkIHJlc3BvbnNlVGltZTogbnVtYmVyO1xuXG4gIC8vIGRlZmF1bHQgY29uZmlnXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBzdGF0aWMgREVGQVVMVF9DT05GSUc6IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4gPSB7XG4gICAgdXJpOiB1bmRlZmluZWQsXG4gICAgdXNlcm5hbWU6IHVuZGVmaW5lZCxcbiAgICBwYXNzd29yZDogdW5kZWZpbmVkLFxuICAgIHJlamVjdFVuYXV0aG9yaXplZDogdHJ1ZSwgLy8gcmVqZWN0IHNlbGYtc2lnbmVkIGNlcnRpZmljYXRlcyBpZiB0cnVlXG4gICAgcHJveHlUb1dvcmtlcjogZmFsc2UsXG4gICAgcHJpb3JpdHk6IDBcbiAgfVxuXG4gIC8qKlxuICAgKiA8cD5Db25zdHJ1Y3QgYSBSUEMgY29ubmVjdGlvbi48L3A+XG4gICAqIFxuICAgKiA8cD5FeGFtcGxlczo8L3A+XG4gICAqIFxuICAgKiA8Y29kZT5cbiAgICogbGV0IGNvbm5lY3Rpb24xID0gbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24oXCJodHRwOi8vbG9jYWxob3N0OjM4MDgxXCIsIFwiZGFlbW9uX3VzZXJcIiwgXCJkYWVtb25fcGFzc3dvcmRfMTIzXCIpPGJyPjxicj5cbiAgICogXG4gICAqIGxldCBjb25uZWN0aW9uMiA9IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHs8YnI+XG4gICAqICZuYnNwOyZuYnNwOyB1cmk6IGh0dHA6Ly9sb2NhbGhvc3Q6MzgwODEsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgdXNlcm5hbWU6IFwiZGFlbW9uX3VzZXJcIiw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBwYXNzd29yZDogXCJkYWVtb25fcGFzc3dvcmRfMTIzXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcmVqZWN0VW5hdXRob3JpemVkOiBmYWxzZSwgLy8gYWNjZXB0IHNlbGYtc2lnbmVkIGNlcnRpZmljYXRlcyBlLmcuIGZvciBsb2NhbCBkZXZlbG9wbWVudDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHByb3h5VG9Xb3JrZXI6IHRydWUgLy8gcHJveHkgcmVxdWVzdCB0byB3b3JrZXIgKGRlZmF1bHQgZmFsc2UpPGJyPlxuICAgKiB9KTtcbiAgICogPC9jb2RlPlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd8UGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPn0gdXJpT3JDb25uZWN0aW9uIC0gTW9uZXJvUnBjQ29ubmVjdGlvbiBvciBVUkkgb2YgdGhlIFJQQyBlbmRwb2ludFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXJpT3JDb25uZWN0aW9uLnVyaSAtIFVSSSBvZiB0aGUgUlBDIGVuZHBvaW50XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbdXJpT3JDb25uZWN0aW9uLnVzZXJuYW1lXSAtIHVzZXJuYW1lIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIHRoZSBSUEMgZW5kcG9pbnQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3VyaU9yQ29ubmVjdGlvbi5wYXNzd29yZF0gLSBwYXNzd29yZCB0byBhdXRoZW50aWNhdGUgd2l0aCB0aGUgUlBDIGVuZHBvaW50IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbdXJpT3JDb25uZWN0aW9uLnJlamVjdFVuYXV0aG9yaXplZF0gLSByZWplY3RzIHNlbGYtc2lnbmVkIGNlcnRpZmljYXRlcyBpZiB0cnVlIChkZWZhdWx0IHRydWUpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gdXJpT3JDb25uZWN0aW9uLnByb3h5VG9Xb3JrZXIgLSBwcm94eSByZXF1ZXN0cyB0byB3b3JrZXIgKGRlZmF1bHQgdHJ1ZSlcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVzZXJuYW1lIC0gdXNlcm5hbWUgdG8gYXV0aGVudGljYXRlIHdpdGggdGhlIFJQQyBlbmRwb2ludCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXNzd29yZCAtIHBhc3N3b3JkIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIHRoZSBSUEMgZW5kcG9pbnQgKG9wdGlvbmFsKVxuICAgKi9cbiAgY29uc3RydWN0b3IodXJpT3JDb25uZWN0aW9uOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+LCB1c2VybmFtZT86IHN0cmluZywgcGFzc3dvcmQ/OiBzdHJpbmcpIHtcblxuICAgIC8vIHZhbGlkYXRlIGFuZCBub3JtYWxpemUgY29uZmlnXG4gICAgaWYgKHR5cGVvZiB1cmlPckNvbm5lY3Rpb24gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIE9iamVjdC5hc3NpZ24odGhpcywgTW9uZXJvUnBjQ29ubmVjdGlvbi5ERUZBVUxUX0NPTkZJRyk7XG4gICAgICB0aGlzLnVyaSA9IHVyaU9yQ29ubmVjdGlvbjtcbiAgICAgIHRoaXMuc2V0Q3JlZGVudGlhbHModXNlcm5hbWUsIHBhc3N3b3JkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHVzZXJuYW1lICE9PSB1bmRlZmluZWQgfHwgcGFzc3dvcmQgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2FuIHByb3ZpZGUgY29uZmlnIG9iamVjdCBvciBwYXJhbXMgYnV0IG5vdCBib3RoXCIpO1xuICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLCBNb25lcm9ScGNDb25uZWN0aW9uLkRFRkFVTFRfQ09ORklHLCB1cmlPckNvbm5lY3Rpb24pO1xuICAgICAgdGhpcy5zZXRDcmVkZW50aWFscyh0aGlzLnVzZXJuYW1lLCB0aGlzLnBhc3N3b3JkKTtcbiAgICB9XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIHVyaVxuICAgIGlmICh0aGlzLnVyaSkgdGhpcy51cmkgPSBHZW5VdGlscy5ub3JtYWxpemVVcmkodGhpcy51cmkpO1xuICB9XG4gIFxuICBzZXRDcmVkZW50aWFscyh1c2VybmFtZSwgcGFzc3dvcmQpIHtcbiAgICBpZiAodXNlcm5hbWUgPT09IFwiXCIpIHVzZXJuYW1lID0gdW5kZWZpbmVkO1xuICAgIGlmIChwYXNzd29yZCA9PT0gXCJcIikgcGFzc3dvcmQgPSB1bmRlZmluZWQ7XG4gICAgaWYgKHVzZXJuYW1lIHx8IHBhc3N3b3JkKSB7XG4gICAgICBpZiAoIXVzZXJuYW1lKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJ1c2VybmFtZSBtdXN0IGJlIGRlZmluZWQgYmVjYXVzZSBwYXNzd29yZCBpcyBkZWZpbmVkXCIpO1xuICAgICAgaWYgKCFwYXNzd29yZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwicGFzc3dvcmQgbXVzdCBiZSBkZWZpbmVkIGJlY2F1c2UgdXNlcm5hbWUgaXMgZGVmaW5lZFwiKTtcbiAgICB9XG4gICAgaWYgKHRoaXMudXNlcm5hbWUgPT09IFwiXCIpIHRoaXMudXNlcm5hbWUgPSB1bmRlZmluZWQ7XG4gICAgaWYgKHRoaXMucGFzc3dvcmQgPT09IFwiXCIpIHRoaXMucGFzc3dvcmQgPSB1bmRlZmluZWQ7XG4gICAgaWYgKHRoaXMudXNlcm5hbWUgIT09IHVzZXJuYW1lIHx8IHRoaXMucGFzc3dvcmQgIT09IHBhc3N3b3JkKSB7XG4gICAgICB0aGlzLmlzT25saW5lID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHRoaXMudXNlcm5hbWUgPSB1c2VybmFtZTtcbiAgICB0aGlzLnBhc3N3b3JkID0gcGFzc3dvcmQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIGdldFVyaSgpIHtcbiAgICByZXR1cm4gdGhpcy51cmk7XG4gIH1cbiAgXG4gIGdldFVzZXJuYW1lKCkge1xuICAgIHJldHVybiB0aGlzLnVzZXJuYW1lID8gdGhpcy51c2VybmFtZSA6IFwiXCI7XG4gIH1cbiAgXG4gIGdldFBhc3N3b3JkKCkge1xuICAgIHJldHVybiB0aGlzLnBhc3N3b3JkID8gdGhpcy5wYXNzd29yZCA6IFwiXCI7XG4gIH1cbiAgXG4gIGdldFJlamVjdFVuYXV0aG9yaXplZCgpIHtcbiAgICByZXR1cm4gdGhpcy5yZWplY3RVbmF1dGhvcml6ZWQ7XG4gIH1cbiAgXG4gIHNldFByb3h5VG9Xb3JrZXIocHJveHlUb1dvcmtlcikge1xuICAgIHRoaXMucHJveHlUb1dvcmtlciA9IHByb3h5VG9Xb3JrZXI7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIGdldFByb3h5VG9Xb3JrZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMucHJveHlUb1dvcmtlcjtcbiAgfVxuICBcbiAgZ2V0UHJpb3JpdHkoKSB7XG4gICAgcmV0dXJuIHRoaXMucHJpb3JpdHk7IFxuICB9XG4gIFxuICAvKipcbiAgICogU2V0IHRoZSBjb25uZWN0aW9uJ3MgcHJpb3JpdHkgcmVsYXRpdmUgdG8gb3RoZXIgY29ubmVjdGlvbnMuIFByaW9yaXR5IDEgaXMgaGlnaGVzdCxcbiAgICogdGhlbiBwcmlvcml0eSAyLCBldGMuIFRoZSBkZWZhdWx0IHByaW9yaXR5IG9mIDAgaXMgbG93ZXN0IHByaW9yaXR5LlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtwcmlvcml0eV0gLSB0aGUgY29ubmVjdGlvbiBwcmlvcml0eSAoZGVmYXVsdCAwKVxuICAgKiBAcmV0dXJuIHtNb25lcm9ScGNDb25uZWN0aW9ufSB0aGlzIGNvbm5lY3Rpb25cbiAgICovXG4gIHNldFByaW9yaXR5KHByaW9yaXR5KSB7XG4gICAgaWYgKCEocHJpb3JpdHkgPj0gMCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlByaW9yaXR5IG11c3QgYmUgPj0gMFwiKTtcbiAgICB0aGlzLnByaW9yaXR5ID0gcHJpb3JpdHk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIHNldEF0dHJpYnV0ZShrZXksIHZhbHVlKSB7XG4gICAgaWYgKCF0aGlzLmF0dHJpYnV0ZXMpIHRoaXMuYXR0cmlidXRlcyA9IG5ldyBNYXAoKTtcbiAgICB0aGlzLmF0dHJpYnV0ZXMucHV0KGtleSwgdmFsdWUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBnZXRBdHRyaWJ1dGUoa2V5KSB7XG4gICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlcy5nZXQoa2V5KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENoZWNrIHRoZSBjb25uZWN0aW9uIHN0YXR1cyB0byB1cGRhdGUgaXNPbmxpbmUsIGlzQXV0aGVudGljYXRlZCwgYW5kIHJlc3BvbnNlIHRpbWUuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gdGltZW91dE1zIC0gbWF4aW11bSByZXNwb25zZSB0aW1lIGJlZm9yZSBjb25zaWRlcmVkIG9mZmxpbmVcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiB0aGVyZSBpcyBhIGNoYW5nZSBpbiBzdGF0dXMsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgYXN5bmMgY2hlY2tDb25uZWN0aW9uKHRpbWVvdXRNcykge1xuICAgIGF3YWl0IExpYnJhcnlVdGlscy5sb2FkS2V5c01vZHVsZSgpOyAvLyBjYWNoZSB3YXNtIGZvciBiaW5hcnkgcmVxdWVzdFxuICAgIGxldCBpc09ubGluZUJlZm9yZSA9IHRoaXMuaXNPbmxpbmU7XG4gICAgbGV0IGlzQXV0aGVudGljYXRlZEJlZm9yZSA9IHRoaXMuaXNBdXRoZW50aWNhdGVkO1xuICAgIGxldCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIHRyeSB7XG4gICAgICBpZiAodGhpcy5mYWtlRGlzY29ubmVjdGVkKSB0aHJvdyBuZXcgRXJyb3IoXCJDb25uZWN0aW9uIGlzIGZha2UgZGlzY29ubmVjdGVkXCIpO1xuICAgICAgbGV0IGhlaWdodHMgPSBbXTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTAwOyBpKyspIGhlaWdodHMucHVzaChpKTtcbiAgICAgIGF3YWl0IHRoaXMuc2VuZEJpbmFyeVJlcXVlc3QoXCJnZXRfYmxvY2tzX2J5X2hlaWdodC5iaW5cIiwge2hlaWdodHM6IGhlaWdodHN9LCB0aW1lb3V0TXMpOyAvLyBhc3N1bWUgZGFlbW9uIGNvbm5lY3Rpb25cbiAgICAgIHRoaXMuaXNPbmxpbmUgPSB0cnVlO1xuICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSB0cnVlO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgdGhpcy5pc09ubGluZSA9IGZhbHNlO1xuICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLnJlc3BvbnNlVGltZSA9IHVuZGVmaW5lZDtcbiAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvcikge1xuICAgICAgICBpZiAoZXJyLmdldENvZGUoKSA9PT0gNDAxKSB7XG4gICAgICAgICAgdGhpcy5pc09ubGluZSA9IHRydWU7XG4gICAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcbiAgICAgICAgfSBlbHNlIGlmIChlcnIuZ2V0Q29kZSgpID09PSA0MDQpIHsgLy8gZmFsbGJhY2sgdG8gbGF0ZW5jeSBjaGVja1xuICAgICAgICAgIHRoaXMuaXNPbmxpbmUgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy5pc09ubGluZSkgdGhpcy5yZXNwb25zZVRpbWUgPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuICAgIHJldHVybiBpc09ubGluZUJlZm9yZSAhPT0gdGhpcy5pc09ubGluZSB8fCBpc0F1dGhlbnRpY2F0ZWRCZWZvcmUgIT09IHRoaXMuaXNBdXRoZW50aWNhdGVkO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBjb25uZWN0aW9uIGlzIGNvbm5lY3RlZCBhY2NvcmRpbmcgdG8gdGhlIGxhc3QgY2FsbCB0byBjaGVja0Nvbm5lY3Rpb24oKS48YnI+PGJyPlxuICAgKiBcbiAgICogTm90ZTogbXVzdCBjYWxsIGNoZWNrQ29ubmVjdGlvbigpIG1hbnVhbGx5IHVubGVzcyB1c2luZyBNb25lcm9Db25uZWN0aW9uTWFuYWdlci5cbiAgICogXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgb3IgZmFsc2UgdG8gaW5kaWNhdGUgaWYgY29ubmVjdGVkLCBvciB1bmRlZmluZWQgaWYgY2hlY2tDb25uZWN0aW9uKCkgaGFzIG5vdCBiZWVuIGNhbGxlZFxuICAgKi9cbiAgaXNDb25uZWN0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNPbmxpbmUgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHRoaXMuaXNPbmxpbmUgJiYgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgIT09IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgY29ubmVjdGlvbiBpcyBvbmxpbmUgYWNjb3JkaW5nIHRvIHRoZSBsYXN0IGNhbGwgdG8gY2hlY2tDb25uZWN0aW9uKCkuPGJyPjxicj5cbiAgICogXG4gICAqIE5vdGU6IG11c3QgY2FsbCBjaGVja0Nvbm5lY3Rpb24oKSBtYW51YWxseSB1bmxlc3MgdXNpbmcgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIG9yIGZhbHNlIHRvIGluZGljYXRlIGlmIG9ubGluZSwgb3IgdW5kZWZpbmVkIGlmIGNoZWNrQ29ubmVjdGlvbigpIGhhcyBub3QgYmVlbiBjYWxsZWRcbiAgICovXG4gIGdldElzT25saW5lKCkge1xuICAgIHJldHVybiB0aGlzLmlzT25saW5lO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgY29ubmVjdGlvbiBpcyBhdXRoZW50aWNhdGVkIGFjY29yZGluZyB0byB0aGUgbGFzdCBjYWxsIHRvIGNoZWNrQ29ubmVjdGlvbigpLjxicj48YnI+XG4gICAqIFxuICAgKiBOb3RlOiBtdXN0IGNhbGwgY2hlY2tDb25uZWN0aW9uKCkgbWFudWFsbHkgdW5sZXNzIHVzaW5nIE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyLlxuICAgKiBcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiBhdXRoZW50aWNhdGVkIG9yIG5vIGF1dGhlbnRpY2F0aW9uLCBmYWxzZSBpZiBub3QgYXV0aGVudGljYXRlZCwgb3IgdW5kZWZpbmVkIGlmIGNoZWNrQ29ubmVjdGlvbigpIGhhcyBub3QgYmVlbiBjYWxsZWRcbiAgICovXG4gIGdldElzQXV0aGVudGljYXRlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5pc0F1dGhlbnRpY2F0ZWQ7XG4gIH1cblxuICBnZXRSZXNwb25zZVRpbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVzcG9uc2VUaW1lO1xuICB9XG4gIFxuICAvKipcbiAgICogU2VuZCBhIEpTT04gUlBDIHJlcXVlc3QuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWV0aG9kIC0gSlNPTiBSUEMgbWV0aG9kIHRvIGludm9rZVxuICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zIC0gcmVxdWVzdCBwYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB0aW1lb3V0SW5NcyAtIHJlcXVlc3QgdGltZW91dCBpbiBtaWxsaXNlY29uZHNcbiAgICogQHJldHVybiB7b2JqZWN0fSBpcyB0aGUgcmVzcG9uc2UgbWFwXG4gICAqL1xuICBhc3luYyBzZW5kSnNvblJlcXVlc3QobWV0aG9kLCBwYXJhbXM/LCB0aW1lb3V0SW5Ncz8pOiBQcm9taXNlPGFueT4ge1xuICAgIHRyeSB7XG4gICAgICBcbiAgICAgIC8vIGJ1aWxkIHJlcXVlc3QgYm9keVxuICAgICAgbGV0IGJvZHkgPSBKU09OLnN0cmluZ2lmeSh7ICAvLyBib2R5IGlzIHN0cmluZ2lmaWVkIHNvIHRleHQvcGxhaW4gaXMgcmV0dXJuZWQgc28gYmlnaW50cyBhcmUgcHJlc2VydmVkXG4gICAgICAgIGlkOiBcIjBcIixcbiAgICAgICAganNvbnJwYzogXCIyLjBcIixcbiAgICAgICAgbWV0aG9kOiBtZXRob2QsXG4gICAgICAgIHBhcmFtczogcGFyYW1zXG4gICAgICB9KTtcblxuICAgICAgLy8gbG9nZ2luZ1xuICAgICAgaWYgKExpYnJhcnlVdGlscy5nZXRMb2dMZXZlbCgpID49IDIpIExpYnJhcnlVdGlscy5sb2coMiwgXCJTZW5kaW5nIGpzb24gcmVxdWVzdCB3aXRoIG1ldGhvZCAnXCIgKyBtZXRob2QgKyBcIicgYW5kIGJvZHk6IFwiICsgYm9keSk7XG4gICAgICBcbiAgICAgIC8vIHNlbmQgaHR0cCByZXF1ZXN0XG4gICAgICBsZXQgc3RhcnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IEh0dHBDbGllbnQucmVxdWVzdCh7XG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgIHVyaTogdGhpcy5nZXRVcmkoKSArICcvanNvbl9ycGMnLFxuICAgICAgICB1c2VybmFtZTogdGhpcy5nZXRVc2VybmFtZSgpLFxuICAgICAgICBwYXNzd29yZDogdGhpcy5nZXRQYXNzd29yZCgpLFxuICAgICAgICBib2R5OiBib2R5LFxuICAgICAgICB0aW1lb3V0OiB0aW1lb3V0SW5NcyxcbiAgICAgICAgcmVqZWN0VW5hdXRob3JpemVkOiB0aGlzLnJlamVjdFVuYXV0aG9yaXplZCxcbiAgICAgICAgcmVxdWVzdEFwaTogR2VuVXRpbHMuaXNGaXJlZm94KCkgPyBcInhoclwiIDogXCJmZXRjaFwiLCAgLy8gZmlyZWZveCBpc3N1ZTogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTQ5MTAxMFxuICAgICAgICBwcm94eVRvV29ya2VyOiB0aGlzLnByb3h5VG9Xb3JrZXJcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICAvLyB2YWxpZGF0ZSByZXNwb25zZVxuICAgICAgTW9uZXJvUnBjQ29ubmVjdGlvbi52YWxpZGF0ZUh0dHBSZXNwb25zZShyZXNwKTtcbiAgICAgIFxuICAgICAgLy8gZGVzZXJpYWxpemUgcmVzcG9uc2VcbiAgICAgIGlmIChyZXNwLmJvZHlbMF0gIT0gJ3snKSB0aHJvdyByZXNwLmJvZHk7XG4gICAgICByZXNwID0gSlNPTi5wYXJzZShyZXNwLmJvZHkucmVwbGFjZSgvKFwiW15cIl0qXCJcXHMqOlxccyopKFxcZHsxNix9KS9nLCAnJDFcIiQyXCInKSk7ICAvLyByZXBsYWNlIDE2IG9yIG1vcmUgZGlnaXRzIHdpdGggc3RyaW5ncyBhbmQgcGFyc2VcbiAgICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0TG9nTGV2ZWwoKSA+PSAzKSB7XG4gICAgICAgIGxldCByZXNwU3RyID0gSlNPTi5zdHJpbmdpZnkocmVzcCk7XG4gICAgICAgIExpYnJhcnlVdGlscy5sb2coMywgXCJSZWNlaXZlZCByZXNwb25zZSBmcm9tIG1ldGhvZD0nXCIgKyBtZXRob2QgKyBcIicsIHJlc3BvbnNlPVwiICsgcmVzcFN0ci5zdWJzdHJpbmcoMCwgTWF0aC5taW4oMTAwMCwgcmVzcFN0ci5sZW5ndGgpKSArIFwiKFwiICsgKG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gc3RhcnRUaW1lKSArIFwiIG1zKVwiKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gY2hlY2sgcnBjIHJlc3BvbnNlIGZvciBlcnJvcnNcbiAgICAgIE1vbmVyb1JwY0Nvbm5lY3Rpb24udmFsaWRhdGVScGNSZXNwb25zZShyZXNwLCBtZXRob2QsIHBhcmFtcyk7XG4gICAgICByZXR1cm4gcmVzcDtcbiAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yKSB0aHJvdyBlcnI7XG4gICAgICBlbHNlIHRocm93IG5ldyBNb25lcm9ScGNFcnJvcihlcnIsIGVyci5zdGF0dXNDb2RlLCBtZXRob2QsIHBhcmFtcyk7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogU2VuZCBhIFJQQyByZXF1ZXN0IHRvIHRoZSBnaXZlbiBwYXRoIGFuZCB3aXRoIHRoZSBnaXZlbiBwYXJhbXRlcnMuXG4gICAqIFxuICAgKiBFLmcuIFwiL2dldF90cmFuc2FjdGlvbnNcIiB3aXRoIHBhcmFtc1xuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggLSBKU09OIFJQQyBwYXRoIHRvIGludm9rZVxuICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zIC0gcmVxdWVzdCBwYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB0aW1lb3V0SW5NcyAtIHJlcXVlc3QgdGltZW91dCBpbiBtaWxsaXNlY29uZHNcbiAgICogQHJldHVybiB7b2JqZWN0fSBpcyB0aGUgcmVzcG9uc2UgbWFwXG4gICAqL1xuICBhc3luYyBzZW5kUGF0aFJlcXVlc3QocGF0aCwgcGFyYW1zPywgdGltZW91dEluTXM/KTogUHJvbWlzZTxhbnk+IHtcbiAgICB0cnkge1xuXG4gICAgICAvLyBsb2dnaW5nXG4gICAgICBpZiAoTGlicmFyeVV0aWxzLmdldExvZ0xldmVsKCkgPj0gMikgTGlicmFyeVV0aWxzLmxvZygyLCBcIlNlbmRpbmcgcGF0aCByZXF1ZXN0IHdpdGggcGF0aCAnXCIgKyBwYXRoICsgXCInIGFuZCBwYXJhbXM6IFwiICsgSlNPTi5zdHJpbmdpZnkocGFyYW1zKSk7XG4gICAgICBcbiAgICAgIC8vIHNlbmQgaHR0cCByZXF1ZXN0XG4gICAgICBsZXQgc3RhcnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IEh0dHBDbGllbnQucmVxdWVzdCh7XG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgIHVyaTogdGhpcy5nZXRVcmkoKSArICcvJyArIHBhdGgsXG4gICAgICAgIHVzZXJuYW1lOiB0aGlzLmdldFVzZXJuYW1lKCksXG4gICAgICAgIHBhc3N3b3JkOiB0aGlzLmdldFBhc3N3b3JkKCksXG4gICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHBhcmFtcyksICAvLyBib2R5IGlzIHN0cmluZ2lmaWVkIHNvIHRleHQvcGxhaW4gaXMgcmV0dXJuZWQgc28gYmlnaW50cyBhcmUgcHJlc2VydmVkXG4gICAgICAgIHRpbWVvdXQ6IHRpbWVvdXRJbk1zLFxuICAgICAgICByZWplY3RVbmF1dGhvcml6ZWQ6IHRoaXMucmVqZWN0VW5hdXRob3JpemVkLFxuICAgICAgICByZXF1ZXN0QXBpOiBHZW5VdGlscy5pc0ZpcmVmb3goKSA/IFwieGhyXCIgOiBcImZldGNoXCIsXG4gICAgICAgIHByb3h5VG9Xb3JrZXI6IHRoaXMucHJveHlUb1dvcmtlclxuICAgICAgfSk7XG4gICAgICBcbiAgICAgIC8vIHZhbGlkYXRlIHJlc3BvbnNlXG4gICAgICBNb25lcm9ScGNDb25uZWN0aW9uLnZhbGlkYXRlSHR0cFJlc3BvbnNlKHJlc3ApO1xuICAgICAgXG4gICAgICAvLyBkZXNlcmlhbGl6ZSByZXNwb25zZVxuICAgICAgaWYgKHJlc3AuYm9keVswXSAhPSAneycpIHRocm93IHJlc3AuYm9keTtcbiAgICAgIHJlc3AgPSBKU09OLnBhcnNlKHJlc3AuYm9keS5yZXBsYWNlKC8oXCJbXlwiXSpcIlxccyo6XFxzKikoXFxkezE2LH0pL2csICckMVwiJDJcIicpKTsgIC8vIHJlcGxhY2UgMTYgb3IgbW9yZSBkaWdpdHMgd2l0aCBzdHJpbmdzIGFuZCBwYXJzZVxuICAgICAgaWYgKHR5cGVvZiByZXNwID09PSBcInN0cmluZ1wiKSByZXNwID0gSlNPTi5wYXJzZShyZXNwKTsgIC8vIFRPRE86IHNvbWUgcmVzcG9uc2VzIHJldHVybmVkIGFzIHN0cmluZ3M/XG4gICAgICBpZiAoTGlicmFyeVV0aWxzLmdldExvZ0xldmVsKCkgPj0gMykge1xuICAgICAgICBsZXQgcmVzcFN0ciA9IEpTT04uc3RyaW5naWZ5KHJlc3ApO1xuICAgICAgICBMaWJyYXJ5VXRpbHMubG9nKDMsIFwiUmVjZWl2ZWQgcmVzcG9uc2UgZnJvbSBwYXRoPSdcIiArIHBhdGggKyBcIicsIHJlc3BvbnNlPVwiICsgcmVzcFN0ci5zdWJzdHJpbmcoMCwgTWF0aC5taW4oMTAwMCwgcmVzcFN0ci5sZW5ndGgpKSArIFwiKFwiICsgKG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gc3RhcnRUaW1lKSArIFwiIG1zKVwiKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gY2hlY2sgcnBjIHJlc3BvbnNlIGZvciBlcnJvcnNcbiAgICAgIE1vbmVyb1JwY0Nvbm5lY3Rpb24udmFsaWRhdGVScGNSZXNwb25zZShyZXNwLCBwYXRoLCBwYXJhbXMpO1xuICAgICAgcmV0dXJuIHJlc3A7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvcikgdGhyb3cgZXJyO1xuICAgICAgZWxzZSB0aHJvdyBuZXcgTW9uZXJvUnBjRXJyb3IoZXJyLCBlcnIuc3RhdHVzQ29kZSwgcGF0aCwgcGFyYW1zKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZW5kIGEgYmluYXJ5IFJQQyByZXF1ZXN0LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggLSBwYXRoIG9mIHRoZSBiaW5hcnkgUlBDIG1ldGhvZCB0byBpbnZva2VcbiAgICogQHBhcmFtIHtvYmplY3R9IFtwYXJhbXNdIC0gcmVxdWVzdCBwYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbdGltZW91dEluTXNdIC0gcmVxdWVzdCB0aW1lb3V0IGluIG1pbGxpc2Vjb25kc1xuICAgKiBAcmV0dXJuIHtVaW50OEFycmF5fSB0aGUgYmluYXJ5IHJlc3BvbnNlXG4gICAqL1xuICBhc3luYyBzZW5kQmluYXJ5UmVxdWVzdChwYXRoLCBwYXJhbXM/LCB0aW1lb3V0SW5Ncz8pOiBQcm9taXNlPGFueT4ge1xuICAgIFxuICAgIC8vIHNlcmlhbGl6ZSBwYXJhbXNcbiAgICBsZXQgcGFyYW1zQmluID0gYXdhaXQgTW9uZXJvVXRpbHMuanNvblRvQmluYXJ5KHBhcmFtcyk7XG4gICAgXG4gICAgdHJ5IHtcblxuICAgICAgLy8gbG9nZ2luZ1xuICAgICAgaWYgKExpYnJhcnlVdGlscy5nZXRMb2dMZXZlbCgpID49IDIpIExpYnJhcnlVdGlscy5sb2coMiwgXCJTZW5kaW5nIGJpbmFyeSByZXF1ZXN0IHdpdGggcGF0aCAnXCIgKyBwYXRoICsgXCInIGFuZCBwYXJhbXM6IFwiICsgSlNPTi5zdHJpbmdpZnkocGFyYW1zKSk7XG4gICAgICBcbiAgICAgIC8vIHNlbmQgaHR0cCByZXF1ZXN0XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IEh0dHBDbGllbnQucmVxdWVzdCh7XG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgIHVyaTogdGhpcy5nZXRVcmkoKSArICcvJyArIHBhdGgsXG4gICAgICAgIHVzZXJuYW1lOiB0aGlzLmdldFVzZXJuYW1lKCksXG4gICAgICAgIHBhc3N3b3JkOiB0aGlzLmdldFBhc3N3b3JkKCksXG4gICAgICAgIGJvZHk6IHBhcmFtc0JpbixcbiAgICAgICAgdGltZW91dDogdGltZW91dEluTXMsXG4gICAgICAgIHJlamVjdFVuYXV0aG9yaXplZDogdGhpcy5yZWplY3RVbmF1dGhvcml6ZWQsXG4gICAgICAgIHJlcXVlc3RBcGk6IEdlblV0aWxzLmlzRmlyZWZveCgpID8gXCJ4aHJcIiA6IFwiZmV0Y2hcIixcbiAgICAgICAgcHJveHlUb1dvcmtlcjogdGhpcy5wcm94eVRvV29ya2VyXG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgLy8gdmFsaWRhdGUgcmVzcG9uc2VcbiAgICAgIE1vbmVyb1JwY0Nvbm5lY3Rpb24udmFsaWRhdGVIdHRwUmVzcG9uc2UocmVzcCk7XG4gICAgICBcbiAgICAgIC8vIHByb2Nlc3MgcmVzcG9uc2VcbiAgICAgIHJlc3AgPSByZXNwLmJvZHk7XG4gICAgICBpZiAoIShyZXNwIGluc3RhbmNlb2YgVWludDhBcnJheSkpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcInJlc3AgaXMgbm90IHVpbnQ4YXJyYXlcIik7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IocmVzcCk7XG4gICAgICB9XG4gICAgICBpZiAocmVzcC5lcnJvcikgdGhyb3cgbmV3IE1vbmVyb1JwY0Vycm9yKHJlc3AuZXJyb3IubWVzc2FnZSwgcmVzcC5lcnJvci5jb2RlLCBwYXRoLCBwYXJhbXMpO1xuICAgICAgcmV0dXJuIHJlc3A7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvcikgdGhyb3cgZXJyO1xuICAgICAgZWxzZSB0aHJvdyBuZXcgTW9uZXJvUnBjRXJyb3IoZXJyLCBlcnIuc3RhdHVzQ29kZSwgcGF0aCwgcGFyYW1zKTtcbiAgICB9XG4gIH1cblxuICBnZXRDb25maWcoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHVyaTogdGhpcy51cmksXG4gICAgICB1c2VybmFtZTogdGhpcy51c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkOiB0aGlzLnBhc3N3b3JkLFxuICAgICAgcmVqZWN0VW5hdXRob3JpemVkOiB0aGlzLnJlamVjdFVuYXV0aG9yaXplZCxcbiAgICAgIHByb3h5VG9Xb3JrZXI6IHRoaXMucHJveHlUb1dvcmtlcixcbiAgICAgIHByaW9yaXR5OiB0aGlzLnByaW9yaXR5XG4gICAgfTtcbiAgfVxuXG4gIHRvSnNvbigpIHtcbiAgICByZXR1cm4gT2JqZWN0LmFzc2lnbih7fSwgdGhpcyk7XG4gIH1cbiAgXG4gIHRvU3RyaW5nKCkge1xuICAgIHJldHVybiB0aGlzLmdldFVyaSgpICsgXCIgKHVzZXJuYW1lPVwiICsgdGhpcy5nZXRVc2VybmFtZSgpICsgXCIsIHBhc3N3b3JkPVwiICsgKHRoaXMuZ2V0UGFzc3dvcmQoKSA/IFwiKioqXCIgOiB0aGlzLmdldFBhc3N3b3JkKCkpICsgXCIsIHByaW9yaXR5PVwiICsgdGhpcy5nZXRQcmlvcml0eSgpICsgXCIsIGlzT25saW5lPVwiICsgdGhpcy5nZXRJc09ubGluZSgpICsgXCIsIGlzQXV0aGVudGljYXRlZD1cIiArIHRoaXMuZ2V0SXNBdXRoZW50aWNhdGVkKCkgKyBcIilcIjtcbiAgfVxuXG4gIHNldEZha2VEaXNjb25uZWN0ZWQoZmFrZURpc2Nvbm5lY3RlZCkgeyAvLyB1c2VkIHRvIHRlc3QgY29ubmVjdGlvbiBtYW5hZ2VyXG4gICAgdGhpcy5mYWtlRGlzY29ubmVjdGVkID0gZmFrZURpc2Nvbm5lY3RlZDsgXG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIEhFTFBFUlMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgdmFsaWRhdGVIdHRwUmVzcG9uc2UocmVzcCkge1xuICAgIGxldCBjb2RlID0gcmVzcC5zdGF0dXNDb2RlO1xuICAgIGlmIChjb2RlIDwgMjAwIHx8IGNvZGUgPiAyOTkpIHtcbiAgICAgIGxldCBjb250ZW50ID0gcmVzcC5ib2R5O1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb1JwY0Vycm9yKGNvZGUgKyBcIiBcIiArIHJlc3Auc3RhdHVzVGV4dCArICghY29udGVudCA/IFwiXCIgOiAoXCI6IFwiICsgY29udGVudCkpLCBjb2RlLCB1bmRlZmluZWQsIHVuZGVmaW5lZCk7XG4gICAgfVxuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIHZhbGlkYXRlUnBjUmVzcG9uc2UocmVzcCwgbWV0aG9kLCBwYXJhbXMpIHtcbiAgICBpZiAoIXJlc3AuZXJyb3IpIHJldHVybjtcbiAgICB0aHJvdyBuZXcgTW9uZXJvUnBjRXJyb3IocmVzcC5lcnJvci5tZXNzYWdlLCByZXNwLmVycm9yLmNvZGUsIG1ldGhvZCwgcGFyYW1zKTtcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoieUxBQUEsSUFBQUEsU0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMsV0FBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUUsYUFBQSxHQUFBSCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUcsWUFBQSxHQUFBSixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUksZUFBQSxHQUFBTCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUssWUFBQSxHQUFBTixzQkFBQSxDQUFBQyxPQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNlLE1BQU1NLG1CQUFtQixDQUFDOztFQUV2Qzs7Ozs7Ozs7RUFRQTs7Ozs7OztFQU9BO0VBQ0E7RUFDQSxPQUFPQyxjQUFjLEdBQWlDO0lBQ3BEQyxHQUFHLEVBQUVDLFNBQVM7SUFDZEMsUUFBUSxFQUFFRCxTQUFTO0lBQ25CRSxRQUFRLEVBQUVGLFNBQVM7SUFDbkJHLGtCQUFrQixFQUFFLElBQUksRUFBRTtJQUMxQkMsYUFBYSxFQUFFLEtBQUs7SUFDcEJDLFFBQVEsRUFBRTtFQUNaLENBQUM7O0VBRUQ7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFQyxXQUFXQSxDQUFDQyxlQUFzRCxFQUFFTixRQUFpQixFQUFFQyxRQUFpQixFQUFFOztJQUV4RztJQUNBLElBQUksT0FBT0ssZUFBZSxLQUFLLFFBQVEsRUFBRTtNQUN2Q0MsTUFBTSxDQUFDQyxNQUFNLENBQUMsSUFBSSxFQUFFWixtQkFBbUIsQ0FBQ0MsY0FBYyxDQUFDO01BQ3ZELElBQUksQ0FBQ0MsR0FBRyxHQUFHUSxlQUFlO01BQzFCLElBQUksQ0FBQ0cs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