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
      await this.sendBinaryRequest("get_blocks_by_height.bin", { heights: heights }); // assume daemon connection
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfR2VuVXRpbHMiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9IdHRwQ2xpZW50IiwiX0xpYnJhcnlVdGlscyIsIl9Nb25lcm9FcnJvciIsIl9Nb25lcm9ScGNFcnJvciIsIl9Nb25lcm9VdGlscyIsIk1vbmVyb1JwY0Nvbm5lY3Rpb24iLCJERUZBVUxUX0NPTkZJRyIsInVyaSIsInVuZGVmaW5lZCIsInVzZXJuYW1lIiwicGFzc3dvcmQiLCJyZWplY3RVbmF1dGhvcml6ZWQiLCJwcm94eVRvV29ya2VyIiwicHJpb3JpdHkiLCJjb25zdHJ1Y3RvciIsInVyaU9yQ29ubmVjdGlvbiIsIk9iamVjdCIsImFzc2lnbiIsInNldENyZWRlbnRpYWxzIiwiTW9uZXJvRXJyb3IiLCJHZW5VdGlscyIsIm5vcm1hbGl6ZVVyaSIsImlzT25saW5lIiwiaXNBdXRoZW50aWNhdGVkIiwiZ2V0VXJpIiwiZ2V0VXNlcm5hbWUiLCJnZXRQYXNzd29yZCIsImdldFJlamVjdFVuYXV0aG9yaXplZCIsInNldFByb3h5VG9Xb3JrZXIiLCJnZXRQcm94eVRvV29ya2VyIiwiZ2V0UHJpb3JpdHkiLCJzZXRQcmlvcml0eSIsInNldEF0dHJpYnV0ZSIsImtleSIsInZhbHVlIiwiYXR0cmlidXRlcyIsIk1hcCIsInB1dCIsImdldEF0dHJpYnV0ZSIsImdldCIsImNoZWNrQ29ubmVjdGlvbiIsInRpbWVvdXRNcyIsIkxpYnJhcnlVdGlscyIsImxvYWRLZXlzTW9kdWxlIiwiaXNPbmxpbmVCZWZvcmUiLCJpc0F1dGhlbnRpY2F0ZWRCZWZvcmUiLCJzdGFydFRpbWUiLCJEYXRlIiwibm93IiwiZmFrZURpc2Nvbm5lY3RlZCIsIkVycm9yIiwiaGVpZ2h0cyIsImkiLCJwdXNoIiwic2VuZEJpbmFyeVJlcXVlc3QiLCJlcnIiLCJyZXNwb25zZVRpbWUiLCJNb25lcm9ScGNFcnJvciIsImdldENvZGUiLCJpc0Nvbm5lY3RlZCIsImdldElzT25saW5lIiwiZ2V0SXNBdXRoZW50aWNhdGVkIiwiZ2V0UmVzcG9uc2VUaW1lIiwic2VuZEpzb25SZXF1ZXN0IiwibWV0aG9kIiwicGFyYW1zIiwidGltZW91dEluTXMiLCJib2R5IiwiSlNPTiIsInN0cmluZ2lmeSIsImlkIiwianNvbnJwYyIsImdldExvZ0xldmVsIiwibG9nIiwiZ2V0VGltZSIsInJlc3AiLCJIdHRwQ2xpZW50IiwicmVxdWVzdCIsInRpbWVvdXQiLCJyZXF1ZXN0QXBpIiwiaXNGaXJlZm94IiwidmFsaWRhdGVIdHRwUmVzcG9uc2UiLCJwYXJzZSIsInJlcGxhY2UiLCJyZXNwU3RyIiwic3Vic3RyaW5nIiwiTWF0aCIsIm1pbiIsImxlbmd0aCIsInZhbGlkYXRlUnBjUmVzcG9uc2UiLCJzdGF0dXNDb2RlIiwic2VuZFBhdGhSZXF1ZXN0IiwicGF0aCIsInBhcmFtc0JpbiIsIk1vbmVyb1V0aWxzIiwianNvblRvQmluYXJ5IiwiVWludDhBcnJheSIsImNvbnNvbGUiLCJlcnJvciIsIm1lc3NhZ2UiLCJjb2RlIiwiZ2V0Q29uZmlnIiwidG9Kc29uIiwidG9TdHJpbmciLCJzZXRGYWtlRGlzY29ubmVjdGVkIiwiY29udGVudCIsInN0YXR1c1RleHQiLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL2NvbW1vbi9Nb25lcm9ScGNDb25uZWN0aW9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBHZW5VdGlscyBmcm9tIFwiLi9HZW5VdGlsc1wiO1xuaW1wb3J0IEh0dHBDbGllbnQgZnJvbSBcIi4vSHR0cENsaWVudFwiO1xuaW1wb3J0IExpYnJhcnlVdGlscyBmcm9tIFwiLi9MaWJyYXJ5VXRpbHNcIjtcbmltcG9ydCBNb25lcm9FcnJvciBmcm9tIFwiLi9Nb25lcm9FcnJvclwiO1xuaW1wb3J0IE1vbmVyb1JwY0Vycm9yIGZyb20gXCIuL01vbmVyb1JwY0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvVXRpbHMgZnJvbSBcIi4vTW9uZXJvVXRpbHNcIjtcblxuLyoqXG4gKiBNYWludGFpbnMgYSBjb25uZWN0aW9uIGFuZCBzZW5kcyByZXF1ZXN0cyB0byBhIE1vbmVybyBSUEMgQVBJLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNb25lcm9ScGNDb25uZWN0aW9uIHtcblxuICAvLyBwdWJsaWMgaW5zdGFuY2UgdmFyaWFibGVzXG4gIHVyaTogc3RyaW5nO1xuICB1c2VybmFtZTogc3RyaW5nO1xuICBwYXNzd29yZDogc3RyaW5nO1xuICByZWplY3RVbmF1dGhvcml6ZWQ6IGJvb2xlYW47XG4gIHByb3h5VG9Xb3JrZXI6IGJvb2xlYW47XG4gIHByaW9yaXR5OiBudW1iZXI7XG5cbiAgLy8gcHJpdmF0ZSBpbnN0YW5jZSB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIGlzT25saW5lOiBib29sZWFuO1xuICBwcm90ZWN0ZWQgaXNBdXRoZW50aWNhdGVkOiBib29sZWFuO1xuICBwcm90ZWN0ZWQgYXR0cmlidXRlczogYW55O1xuICBwcm90ZWN0ZWQgZmFrZURpc2Nvbm5lY3RlZDogYm9vbGVhbjtcbiAgcHJvdGVjdGVkIHJlc3BvbnNlVGltZTogbnVtYmVyO1xuXG4gIC8vIGRlZmF1bHQgY29uZmlnXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBzdGF0aWMgREVGQVVMVF9DT05GSUc6IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4gPSB7XG4gICAgdXJpOiB1bmRlZmluZWQsXG4gICAgdXNlcm5hbWU6IHVuZGVmaW5lZCxcbiAgICBwYXNzd29yZDogdW5kZWZpbmVkLFxuICAgIHJlamVjdFVuYXV0aG9yaXplZDogdHJ1ZSwgLy8gcmVqZWN0IHNlbGYtc2lnbmVkIGNlcnRpZmljYXRlcyBpZiB0cnVlXG4gICAgcHJveHlUb1dvcmtlcjogZmFsc2UsXG4gICAgcHJpb3JpdHk6IDBcbiAgfVxuXG4gIC8qKlxuICAgKiA8cD5Db25zdHJ1Y3QgYSBSUEMgY29ubmVjdGlvbi48L3A+XG4gICAqIFxuICAgKiA8cD5FeGFtcGxlczo8L3A+XG4gICAqIFxuICAgKiA8Y29kZT5cbiAgICogbGV0IGNvbm5lY3Rpb24xID0gbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24oXCJodHRwOi8vbG9jYWxob3N0OjM4MDgxXCIsIFwiZGFlbW9uX3VzZXJcIiwgXCJkYWVtb25fcGFzc3dvcmRfMTIzXCIpPGJyPjxicj5cbiAgICogXG4gICAqIGxldCBjb25uZWN0aW9uMiA9IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHs8YnI+XG4gICAqICZuYnNwOyZuYnNwOyB1cmk6IGh0dHA6Ly9sb2NhbGhvc3Q6MzgwODEsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgdXNlcm5hbWU6IFwiZGFlbW9uX3VzZXJcIiw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBwYXNzd29yZDogXCJkYWVtb25fcGFzc3dvcmRfMTIzXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcmVqZWN0VW5hdXRob3JpemVkOiBmYWxzZSwgLy8gYWNjZXB0IHNlbGYtc2lnbmVkIGNlcnRpZmljYXRlcyBlLmcuIGZvciBsb2NhbCBkZXZlbG9wbWVudDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHByb3h5VG9Xb3JrZXI6IHRydWUgLy8gcHJveHkgcmVxdWVzdCB0byB3b3JrZXIgKGRlZmF1bHQgZmFsc2UpPGJyPlxuICAgKiB9KTtcbiAgICogPC9jb2RlPlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd8UGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPn0gdXJpT3JDb25uZWN0aW9uIC0gTW9uZXJvUnBjQ29ubmVjdGlvbiBvciBVUkkgb2YgdGhlIFJQQyBlbmRwb2ludFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXJpT3JDb25uZWN0aW9uLnVyaSAtIFVSSSBvZiB0aGUgUlBDIGVuZHBvaW50XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbdXJpT3JDb25uZWN0aW9uLnVzZXJuYW1lXSAtIHVzZXJuYW1lIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIHRoZSBSUEMgZW5kcG9pbnQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3VyaU9yQ29ubmVjdGlvbi5wYXNzd29yZF0gLSBwYXNzd29yZCB0byBhdXRoZW50aWNhdGUgd2l0aCB0aGUgUlBDIGVuZHBvaW50IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbdXJpT3JDb25uZWN0aW9uLnJlamVjdFVuYXV0aG9yaXplZF0gLSByZWplY3RzIHNlbGYtc2lnbmVkIGNlcnRpZmljYXRlcyBpZiB0cnVlIChkZWZhdWx0IHRydWUpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gdXJpT3JDb25uZWN0aW9uLnByb3h5VG9Xb3JrZXIgLSBwcm94eSByZXF1ZXN0cyB0byB3b3JrZXIgKGRlZmF1bHQgdHJ1ZSlcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVzZXJuYW1lIC0gdXNlcm5hbWUgdG8gYXV0aGVudGljYXRlIHdpdGggdGhlIFJQQyBlbmRwb2ludCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXNzd29yZCAtIHBhc3N3b3JkIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIHRoZSBSUEMgZW5kcG9pbnQgKG9wdGlvbmFsKVxuICAgKi9cbiAgY29uc3RydWN0b3IodXJpT3JDb25uZWN0aW9uOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+LCB1c2VybmFtZT86IHN0cmluZywgcGFzc3dvcmQ/OiBzdHJpbmcpIHtcblxuICAgIC8vIHZhbGlkYXRlIGFuZCBub3JtYWxpemUgY29uZmlnXG4gICAgaWYgKHR5cGVvZiB1cmlPckNvbm5lY3Rpb24gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIE9iamVjdC5hc3NpZ24odGhpcywgTW9uZXJvUnBjQ29ubmVjdGlvbi5ERUZBVUxUX0NPTkZJRyk7XG4gICAgICB0aGlzLnVyaSA9IHVyaU9yQ29ubmVjdGlvbjtcbiAgICAgIHRoaXMuc2V0Q3JlZGVudGlhbHModXNlcm5hbWUsIHBhc3N3b3JkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHVzZXJuYW1lICE9PSB1bmRlZmluZWQgfHwgcGFzc3dvcmQgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2FuIHByb3ZpZGUgY29uZmlnIG9iamVjdCBvciBwYXJhbXMgYnV0IG5vdCBib3RoXCIpO1xuICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLCBNb25lcm9ScGNDb25uZWN0aW9uLkRFRkFVTFRfQ09ORklHLCB1cmlPckNvbm5lY3Rpb24pO1xuICAgICAgdGhpcy5zZXRDcmVkZW50aWFscyh0aGlzLnVzZXJuYW1lLCB0aGlzLnBhc3N3b3JkKTtcbiAgICB9XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIHVyaVxuICAgIGlmICh0aGlzLnVyaSkgdGhpcy51cmkgPSBHZW5VdGlscy5ub3JtYWxpemVVcmkodGhpcy51cmkpO1xuICB9XG4gIFxuICBzZXRDcmVkZW50aWFscyh1c2VybmFtZSwgcGFzc3dvcmQpIHtcbiAgICBpZiAodXNlcm5hbWUgPT09IFwiXCIpIHVzZXJuYW1lID0gdW5kZWZpbmVkO1xuICAgIGlmIChwYXNzd29yZCA9PT0gXCJcIikgcGFzc3dvcmQgPSB1bmRlZmluZWQ7XG4gICAgaWYgKHVzZXJuYW1lIHx8IHBhc3N3b3JkKSB7XG4gICAgICBpZiAoIXVzZXJuYW1lKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJ1c2VybmFtZSBtdXN0IGJlIGRlZmluZWQgYmVjYXVzZSBwYXNzd29yZCBpcyBkZWZpbmVkXCIpO1xuICAgICAgaWYgKCFwYXNzd29yZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwicGFzc3dvcmQgbXVzdCBiZSBkZWZpbmVkIGJlY2F1c2UgdXNlcm5hbWUgaXMgZGVmaW5lZFwiKTtcbiAgICB9XG4gICAgaWYgKHRoaXMudXNlcm5hbWUgPT09IFwiXCIpIHRoaXMudXNlcm5hbWUgPSB1bmRlZmluZWQ7XG4gICAgaWYgKHRoaXMucGFzc3dvcmQgPT09IFwiXCIpIHRoaXMucGFzc3dvcmQgPSB1bmRlZmluZWQ7XG4gICAgaWYgKHRoaXMudXNlcm5hbWUgIT09IHVzZXJuYW1lIHx8IHRoaXMucGFzc3dvcmQgIT09IHBhc3N3b3JkKSB7XG4gICAgICB0aGlzLmlzT25saW5lID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHRoaXMudXNlcm5hbWUgPSB1c2VybmFtZTtcbiAgICB0aGlzLnBhc3N3b3JkID0gcGFzc3dvcmQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIGdldFVyaSgpIHtcbiAgICByZXR1cm4gdGhpcy51cmk7XG4gIH1cbiAgXG4gIGdldFVzZXJuYW1lKCkge1xuICAgIHJldHVybiB0aGlzLnVzZXJuYW1lID8gdGhpcy51c2VybmFtZSA6IFwiXCI7XG4gIH1cbiAgXG4gIGdldFBhc3N3b3JkKCkge1xuICAgIHJldHVybiB0aGlzLnBhc3N3b3JkID8gdGhpcy5wYXNzd29yZCA6IFwiXCI7XG4gIH1cbiAgXG4gIGdldFJlamVjdFVuYXV0aG9yaXplZCgpIHtcbiAgICByZXR1cm4gdGhpcy5yZWplY3RVbmF1dGhvcml6ZWQ7XG4gIH1cbiAgXG4gIHNldFByb3h5VG9Xb3JrZXIocHJveHlUb1dvcmtlcikge1xuICAgIHRoaXMucHJveHlUb1dvcmtlciA9IHByb3h5VG9Xb3JrZXI7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIGdldFByb3h5VG9Xb3JrZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMucHJveHlUb1dvcmtlcjtcbiAgfVxuICBcbiAgZ2V0UHJpb3JpdHkoKSB7XG4gICAgcmV0dXJuIHRoaXMucHJpb3JpdHk7IFxuICB9XG4gIFxuICAvKipcbiAgICogU2V0IHRoZSBjb25uZWN0aW9uJ3MgcHJpb3JpdHkgcmVsYXRpdmUgdG8gb3RoZXIgY29ubmVjdGlvbnMuIFByaW9yaXR5IDEgaXMgaGlnaGVzdCxcbiAgICogdGhlbiBwcmlvcml0eSAyLCBldGMuIFRoZSBkZWZhdWx0IHByaW9yaXR5IG9mIDAgaXMgbG93ZXN0IHByaW9yaXR5LlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtwcmlvcml0eV0gLSB0aGUgY29ubmVjdGlvbiBwcmlvcml0eSAoZGVmYXVsdCAwKVxuICAgKiBAcmV0dXJuIHtNb25lcm9ScGNDb25uZWN0aW9ufSB0aGlzIGNvbm5lY3Rpb25cbiAgICovXG4gIHNldFByaW9yaXR5KHByaW9yaXR5KSB7XG4gICAgaWYgKCEocHJpb3JpdHkgPj0gMCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlByaW9yaXR5IG11c3QgYmUgPj0gMFwiKTtcbiAgICB0aGlzLnByaW9yaXR5ID0gcHJpb3JpdHk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIHNldEF0dHJpYnV0ZShrZXksIHZhbHVlKSB7XG4gICAgaWYgKCF0aGlzLmF0dHJpYnV0ZXMpIHRoaXMuYXR0cmlidXRlcyA9IG5ldyBNYXAoKTtcbiAgICB0aGlzLmF0dHJpYnV0ZXMucHV0KGtleSwgdmFsdWUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBnZXRBdHRyaWJ1dGUoa2V5KSB7XG4gICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlcy5nZXQoa2V5KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENoZWNrIHRoZSBjb25uZWN0aW9uIHN0YXR1cyB0byB1cGRhdGUgaXNPbmxpbmUsIGlzQXV0aGVudGljYXRlZCwgYW5kIHJlc3BvbnNlIHRpbWUuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gdGltZW91dE1zIC0gbWF4aW11bSByZXNwb25zZSB0aW1lIGJlZm9yZSBjb25zaWRlcmVkIG9mZmxpbmVcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiB0aGVyZSBpcyBhIGNoYW5nZSBpbiBzdGF0dXMsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgYXN5bmMgY2hlY2tDb25uZWN0aW9uKHRpbWVvdXRNcykge1xuICAgIGF3YWl0IExpYnJhcnlVdGlscy5sb2FkS2V5c01vZHVsZSgpOyAvLyBjYWNoZSB3YXNtIGZvciBiaW5hcnkgcmVxdWVzdFxuICAgIGxldCBpc09ubGluZUJlZm9yZSA9IHRoaXMuaXNPbmxpbmU7XG4gICAgbGV0IGlzQXV0aGVudGljYXRlZEJlZm9yZSA9IHRoaXMuaXNBdXRoZW50aWNhdGVkO1xuICAgIGxldCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIHRyeSB7XG4gICAgICBpZiAodGhpcy5mYWtlRGlzY29ubmVjdGVkKSB0aHJvdyBuZXcgRXJyb3IoXCJDb25uZWN0aW9uIGlzIGZha2UgZGlzY29ubmVjdGVkXCIpO1xuICAgICAgbGV0IGhlaWdodHMgPSBbXTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTAwOyBpKyspIGhlaWdodHMucHVzaChpKTtcbiAgICAgIGF3YWl0IHRoaXMuc2VuZEJpbmFyeVJlcXVlc3QoXCJnZXRfYmxvY2tzX2J5X2hlaWdodC5iaW5cIiwge2hlaWdodHM6IGhlaWdodHN9KTsgLy8gYXNzdW1lIGRhZW1vbiBjb25uZWN0aW9uXG4gICAgICB0aGlzLmlzT25saW5lID0gdHJ1ZTtcbiAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gdHJ1ZTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHRoaXMuaXNPbmxpbmUgPSBmYWxzZTtcbiAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5yZXNwb25zZVRpbWUgPSB1bmRlZmluZWQ7XG4gICAgICBpZiAoZXJyIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IpIHtcbiAgICAgICAgaWYgKGVyci5nZXRDb2RlKCkgPT09IDQwMSkge1xuICAgICAgICAgIHRoaXMuaXNPbmxpbmUgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSBpZiAoZXJyLmdldENvZGUoKSA9PT0gNDA0KSB7IC8vIGZhbGxiYWNrIHRvIGxhdGVuY3kgY2hlY2tcbiAgICAgICAgICB0aGlzLmlzT25saW5lID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRoaXMuaXNPbmxpbmUpIHRoaXMucmVzcG9uc2VUaW1lID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcbiAgICByZXR1cm4gaXNPbmxpbmVCZWZvcmUgIT09IHRoaXMuaXNPbmxpbmUgfHwgaXNBdXRoZW50aWNhdGVkQmVmb3JlICE9PSB0aGlzLmlzQXV0aGVudGljYXRlZDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgY29ubmVjdGlvbiBpcyBjb25uZWN0ZWQgYWNjb3JkaW5nIHRvIHRoZSBsYXN0IGNhbGwgdG8gY2hlY2tDb25uZWN0aW9uKCkuPGJyPjxicj5cbiAgICogXG4gICAqIE5vdGU6IG11c3QgY2FsbCBjaGVja0Nvbm5lY3Rpb24oKSBtYW51YWxseSB1bmxlc3MgdXNpbmcgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIG9yIGZhbHNlIHRvIGluZGljYXRlIGlmIGNvbm5lY3RlZCwgb3IgdW5kZWZpbmVkIGlmIGNoZWNrQ29ubmVjdGlvbigpIGhhcyBub3QgYmVlbiBjYWxsZWRcbiAgICovXG4gIGlzQ29ubmVjdGVkKCkge1xuICAgIHJldHVybiB0aGlzLmlzT25saW5lID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB0aGlzLmlzT25saW5lICYmIHRoaXMuaXNBdXRoZW50aWNhdGVkICE9PSBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGNvbm5lY3Rpb24gaXMgb25saW5lIGFjY29yZGluZyB0byB0aGUgbGFzdCBjYWxsIHRvIGNoZWNrQ29ubmVjdGlvbigpLjxicj48YnI+XG4gICAqIFxuICAgKiBOb3RlOiBtdXN0IGNhbGwgY2hlY2tDb25uZWN0aW9uKCkgbWFudWFsbHkgdW5sZXNzIHVzaW5nIE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyLlxuICAgKiBcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBvciBmYWxzZSB0byBpbmRpY2F0ZSBpZiBvbmxpbmUsIG9yIHVuZGVmaW5lZCBpZiBjaGVja0Nvbm5lY3Rpb24oKSBoYXMgbm90IGJlZW4gY2FsbGVkXG4gICAqL1xuICBnZXRJc09ubGluZSgpIHtcbiAgICByZXR1cm4gdGhpcy5pc09ubGluZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGNvbm5lY3Rpb24gaXMgYXV0aGVudGljYXRlZCBhY2NvcmRpbmcgdG8gdGhlIGxhc3QgY2FsbCB0byBjaGVja0Nvbm5lY3Rpb24oKS48YnI+PGJyPlxuICAgKiBcbiAgICogTm90ZTogbXVzdCBjYWxsIGNoZWNrQ29ubmVjdGlvbigpIG1hbnVhbGx5IHVubGVzcyB1c2luZyBNb25lcm9Db25uZWN0aW9uTWFuYWdlci5cbiAgICogXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgYXV0aGVudGljYXRlZCBvciBubyBhdXRoZW50aWNhdGlvbiwgZmFsc2UgaWYgbm90IGF1dGhlbnRpY2F0ZWQsIG9yIHVuZGVmaW5lZCBpZiBjaGVja0Nvbm5lY3Rpb24oKSBoYXMgbm90IGJlZW4gY2FsbGVkXG4gICAqL1xuICBnZXRJc0F1dGhlbnRpY2F0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNBdXRoZW50aWNhdGVkO1xuICB9XG5cbiAgZ2V0UmVzcG9uc2VUaW1lKCkge1xuICAgIHJldHVybiB0aGlzLnJlc3BvbnNlVGltZTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNlbmQgYSBKU09OIFJQQyByZXF1ZXN0LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1ldGhvZCAtIEpTT04gUlBDIG1ldGhvZCB0byBpbnZva2VcbiAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcyAtIHJlcXVlc3QgcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0ge251bWJlcn0gdGltZW91dEluTXMgLSByZXF1ZXN0IHRpbWVvdXQgaW4gbWlsbGlzZWNvbmRzXG4gICAqIEByZXR1cm4ge29iamVjdH0gaXMgdGhlIHJlc3BvbnNlIG1hcFxuICAgKi9cbiAgYXN5bmMgc2VuZEpzb25SZXF1ZXN0KG1ldGhvZCwgcGFyYW1zPywgdGltZW91dEluTXM/KTogUHJvbWlzZTxhbnk+IHtcbiAgICB0cnkge1xuICAgICAgXG4gICAgICAvLyBidWlsZCByZXF1ZXN0IGJvZHlcbiAgICAgIGxldCBib2R5ID0gSlNPTi5zdHJpbmdpZnkoeyAgLy8gYm9keSBpcyBzdHJpbmdpZmllZCBzbyB0ZXh0L3BsYWluIGlzIHJldHVybmVkIHNvIGJpZ2ludHMgYXJlIHByZXNlcnZlZFxuICAgICAgICBpZDogXCIwXCIsXG4gICAgICAgIGpzb25ycGM6IFwiMi4wXCIsXG4gICAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgICBwYXJhbXM6IHBhcmFtc1xuICAgICAgfSk7XG5cbiAgICAgIC8vIGxvZ2dpbmdcbiAgICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0TG9nTGV2ZWwoKSA+PSAyKSBMaWJyYXJ5VXRpbHMubG9nKDIsIFwiU2VuZGluZyBqc29uIHJlcXVlc3Qgd2l0aCBtZXRob2QgJ1wiICsgbWV0aG9kICsgXCInIGFuZCBib2R5OiBcIiArIGJvZHkpO1xuICAgICAgXG4gICAgICAvLyBzZW5kIGh0dHAgcmVxdWVzdFxuICAgICAgbGV0IHN0YXJ0VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCBIdHRwQ2xpZW50LnJlcXVlc3Qoe1xuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICB1cmk6IHRoaXMuZ2V0VXJpKCkgKyAnL2pzb25fcnBjJyxcbiAgICAgICAgdXNlcm5hbWU6IHRoaXMuZ2V0VXNlcm5hbWUoKSxcbiAgICAgICAgcGFzc3dvcmQ6IHRoaXMuZ2V0UGFzc3dvcmQoKSxcbiAgICAgICAgYm9keTogYm9keSxcbiAgICAgICAgdGltZW91dDogdGltZW91dEluTXMsXG4gICAgICAgIHJlamVjdFVuYXV0aG9yaXplZDogdGhpcy5yZWplY3RVbmF1dGhvcml6ZWQsXG4gICAgICAgIHJlcXVlc3RBcGk6IEdlblV0aWxzLmlzRmlyZWZveCgpID8gXCJ4aHJcIiA6IFwiZmV0Y2hcIiwgIC8vIGZpcmVmb3ggaXNzdWU6IGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTE0OTEwMTBcbiAgICAgICAgcHJveHlUb1dvcmtlcjogdGhpcy5wcm94eVRvV29ya2VyXG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgLy8gdmFsaWRhdGUgcmVzcG9uc2VcbiAgICAgIE1vbmVyb1JwY0Nvbm5lY3Rpb24udmFsaWRhdGVIdHRwUmVzcG9uc2UocmVzcCk7XG4gICAgICBcbiAgICAgIC8vIGRlc2VyaWFsaXplIHJlc3BvbnNlXG4gICAgICBpZiAocmVzcC5ib2R5WzBdICE9ICd7JykgdGhyb3cgcmVzcC5ib2R5O1xuICAgICAgcmVzcCA9IEpTT04ucGFyc2UocmVzcC5ib2R5LnJlcGxhY2UoLyhcIlteXCJdKlwiXFxzKjpcXHMqKShcXGR7MTYsfSkvZywgJyQxXCIkMlwiJykpOyAgLy8gcmVwbGFjZSAxNiBvciBtb3JlIGRpZ2l0cyB3aXRoIHN0cmluZ3MgYW5kIHBhcnNlXG4gICAgICBpZiAoTGlicmFyeVV0aWxzLmdldExvZ0xldmVsKCkgPj0gMykge1xuICAgICAgICBsZXQgcmVzcFN0ciA9IEpTT04uc3RyaW5naWZ5KHJlc3ApO1xuICAgICAgICBMaWJyYXJ5VXRpbHMubG9nKDMsIFwiUmVjZWl2ZWQgcmVzcG9uc2UgZnJvbSBtZXRob2Q9J1wiICsgbWV0aG9kICsgXCInLCByZXNwb25zZT1cIiArIHJlc3BTdHIuc3Vic3RyaW5nKDAsIE1hdGgubWluKDEwMDAsIHJlc3BTdHIubGVuZ3RoKSkgKyBcIihcIiArIChuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHN0YXJ0VGltZSkgKyBcIiBtcylcIik7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIGNoZWNrIHJwYyByZXNwb25zZSBmb3IgZXJyb3JzXG4gICAgICBNb25lcm9ScGNDb25uZWN0aW9uLnZhbGlkYXRlUnBjUmVzcG9uc2UocmVzcCwgbWV0aG9kLCBwYXJhbXMpO1xuICAgICAgcmV0dXJuIHJlc3A7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvcikgdGhyb3cgZXJyO1xuICAgICAgZWxzZSB0aHJvdyBuZXcgTW9uZXJvUnBjRXJyb3IoZXJyLCBlcnIuc3RhdHVzQ29kZSwgbWV0aG9kLCBwYXJhbXMpO1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIFNlbmQgYSBSUEMgcmVxdWVzdCB0byB0aGUgZ2l2ZW4gcGF0aCBhbmQgd2l0aCB0aGUgZ2l2ZW4gcGFyYW10ZXJzLlxuICAgKiBcbiAgICogRS5nLiBcIi9nZXRfdHJhbnNhY3Rpb25zXCIgd2l0aCBwYXJhbXNcbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gSlNPTiBSUEMgcGF0aCB0byBpbnZva2VcbiAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcyAtIHJlcXVlc3QgcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0ge251bWJlcn0gdGltZW91dEluTXMgLSByZXF1ZXN0IHRpbWVvdXQgaW4gbWlsbGlzZWNvbmRzXG4gICAqIEByZXR1cm4ge29iamVjdH0gaXMgdGhlIHJlc3BvbnNlIG1hcFxuICAgKi9cbiAgYXN5bmMgc2VuZFBhdGhSZXF1ZXN0KHBhdGgsIHBhcmFtcz8sIHRpbWVvdXRJbk1zPyk6IFByb21pc2U8YW55PiB7XG4gICAgdHJ5IHtcblxuICAgICAgLy8gbG9nZ2luZ1xuICAgICAgaWYgKExpYnJhcnlVdGlscy5nZXRMb2dMZXZlbCgpID49IDIpIExpYnJhcnlVdGlscy5sb2coMiwgXCJTZW5kaW5nIHBhdGggcmVxdWVzdCB3aXRoIHBhdGggJ1wiICsgcGF0aCArIFwiJyBhbmQgcGFyYW1zOiBcIiArIEpTT04uc3RyaW5naWZ5KHBhcmFtcykpO1xuICAgICAgXG4gICAgICAvLyBzZW5kIGh0dHAgcmVxdWVzdFxuICAgICAgbGV0IHN0YXJ0VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCBIdHRwQ2xpZW50LnJlcXVlc3Qoe1xuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICB1cmk6IHRoaXMuZ2V0VXJpKCkgKyAnLycgKyBwYXRoLFxuICAgICAgICB1c2VybmFtZTogdGhpcy5nZXRVc2VybmFtZSgpLFxuICAgICAgICBwYXNzd29yZDogdGhpcy5nZXRQYXNzd29yZCgpLFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShwYXJhbXMpLCAgLy8gYm9keSBpcyBzdHJpbmdpZmllZCBzbyB0ZXh0L3BsYWluIGlzIHJldHVybmVkIHNvIGJpZ2ludHMgYXJlIHByZXNlcnZlZFxuICAgICAgICB0aW1lb3V0OiB0aW1lb3V0SW5NcyxcbiAgICAgICAgcmVqZWN0VW5hdXRob3JpemVkOiB0aGlzLnJlamVjdFVuYXV0aG9yaXplZCxcbiAgICAgICAgcmVxdWVzdEFwaTogR2VuVXRpbHMuaXNGaXJlZm94KCkgPyBcInhoclwiIDogXCJmZXRjaFwiLFxuICAgICAgICBwcm94eVRvV29ya2VyOiB0aGlzLnByb3h5VG9Xb3JrZXJcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICAvLyB2YWxpZGF0ZSByZXNwb25zZVxuICAgICAgTW9uZXJvUnBjQ29ubmVjdGlvbi52YWxpZGF0ZUh0dHBSZXNwb25zZShyZXNwKTtcbiAgICAgIFxuICAgICAgLy8gZGVzZXJpYWxpemUgcmVzcG9uc2VcbiAgICAgIGlmIChyZXNwLmJvZHlbMF0gIT0gJ3snKSB0aHJvdyByZXNwLmJvZHk7XG4gICAgICByZXNwID0gSlNPTi5wYXJzZShyZXNwLmJvZHkucmVwbGFjZSgvKFwiW15cIl0qXCJcXHMqOlxccyopKFxcZHsxNix9KS9nLCAnJDFcIiQyXCInKSk7ICAvLyByZXBsYWNlIDE2IG9yIG1vcmUgZGlnaXRzIHdpdGggc3RyaW5ncyBhbmQgcGFyc2VcbiAgICAgIGlmICh0eXBlb2YgcmVzcCA9PT0gXCJzdHJpbmdcIikgcmVzcCA9IEpTT04ucGFyc2UocmVzcCk7ICAvLyBUT0RPOiBzb21lIHJlc3BvbnNlcyByZXR1cm5lZCBhcyBzdHJpbmdzP1xuICAgICAgaWYgKExpYnJhcnlVdGlscy5nZXRMb2dMZXZlbCgpID49IDMpIHtcbiAgICAgICAgbGV0IHJlc3BTdHIgPSBKU09OLnN0cmluZ2lmeShyZXNwKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLmxvZygzLCBcIlJlY2VpdmVkIHJlc3BvbnNlIGZyb20gcGF0aD0nXCIgKyBwYXRoICsgXCInLCByZXNwb25zZT1cIiArIHJlc3BTdHIuc3Vic3RyaW5nKDAsIE1hdGgubWluKDEwMDAsIHJlc3BTdHIubGVuZ3RoKSkgKyBcIihcIiArIChuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHN0YXJ0VGltZSkgKyBcIiBtcylcIik7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIGNoZWNrIHJwYyByZXNwb25zZSBmb3IgZXJyb3JzXG4gICAgICBNb25lcm9ScGNDb25uZWN0aW9uLnZhbGlkYXRlUnBjUmVzcG9uc2UocmVzcCwgcGF0aCwgcGFyYW1zKTtcbiAgICAgIHJldHVybiByZXNwO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICBpZiAoZXJyIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IpIHRocm93IGVycjtcbiAgICAgIGVsc2UgdGhyb3cgbmV3IE1vbmVyb1JwY0Vycm9yKGVyciwgZXJyLnN0YXR1c0NvZGUsIHBhdGgsIHBhcmFtcyk7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogU2VuZCBhIGJpbmFyeSBSUEMgcmVxdWVzdC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gcGF0aCBvZiB0aGUgYmluYXJ5IFJQQyBtZXRob2QgdG8gaW52b2tlXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBbcGFyYW1zXSAtIHJlcXVlc3QgcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0ge251bWJlcn0gW3RpbWVvdXRJbk1zXSAtIHJlcXVlc3QgdGltZW91dCBpbiBtaWxsaXNlY29uZHNcbiAgICogQHJldHVybiB7VWludDhBcnJheX0gdGhlIGJpbmFyeSByZXNwb25zZVxuICAgKi9cbiAgYXN5bmMgc2VuZEJpbmFyeVJlcXVlc3QocGF0aCwgcGFyYW1zPywgdGltZW91dEluTXM/KTogUHJvbWlzZTxhbnk+IHtcbiAgICBcbiAgICAvLyBzZXJpYWxpemUgcGFyYW1zXG4gICAgbGV0IHBhcmFtc0JpbiA9IGF3YWl0IE1vbmVyb1V0aWxzLmpzb25Ub0JpbmFyeShwYXJhbXMpO1xuICAgIFxuICAgIHRyeSB7XG5cbiAgICAgIC8vIGxvZ2dpbmdcbiAgICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0TG9nTGV2ZWwoKSA+PSAyKSBMaWJyYXJ5VXRpbHMubG9nKDIsIFwiU2VuZGluZyBiaW5hcnkgcmVxdWVzdCB3aXRoIHBhdGggJ1wiICsgcGF0aCArIFwiJyBhbmQgcGFyYW1zOiBcIiArIEpTT04uc3RyaW5naWZ5KHBhcmFtcykpO1xuICAgICAgXG4gICAgICAvLyBzZW5kIGh0dHAgcmVxdWVzdFxuICAgICAgbGV0IHJlc3AgPSBhd2FpdCBIdHRwQ2xpZW50LnJlcXVlc3Qoe1xuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICB1cmk6IHRoaXMuZ2V0VXJpKCkgKyAnLycgKyBwYXRoLFxuICAgICAgICB1c2VybmFtZTogdGhpcy5nZXRVc2VybmFtZSgpLFxuICAgICAgICBwYXNzd29yZDogdGhpcy5nZXRQYXNzd29yZCgpLFxuICAgICAgICBib2R5OiBwYXJhbXNCaW4sXG4gICAgICAgIHRpbWVvdXQ6IHRpbWVvdXRJbk1zLFxuICAgICAgICByZWplY3RVbmF1dGhvcml6ZWQ6IHRoaXMucmVqZWN0VW5hdXRob3JpemVkLFxuICAgICAgICByZXF1ZXN0QXBpOiBHZW5VdGlscy5pc0ZpcmVmb3goKSA/IFwieGhyXCIgOiBcImZldGNoXCIsXG4gICAgICAgIHByb3h5VG9Xb3JrZXI6IHRoaXMucHJveHlUb1dvcmtlclxuICAgICAgfSk7XG4gICAgICBcbiAgICAgIC8vIHZhbGlkYXRlIHJlc3BvbnNlXG4gICAgICBNb25lcm9ScGNDb25uZWN0aW9uLnZhbGlkYXRlSHR0cFJlc3BvbnNlKHJlc3ApO1xuICAgICAgXG4gICAgICAvLyBwcm9jZXNzIHJlc3BvbnNlXG4gICAgICByZXNwID0gcmVzcC5ib2R5O1xuICAgICAgaWYgKCEocmVzcCBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJyZXNwIGlzIG5vdCB1aW50OGFycmF5XCIpO1xuICAgICAgICBjb25zb2xlLmVycm9yKHJlc3ApO1xuICAgICAgfVxuICAgICAgaWYgKHJlc3AuZXJyb3IpIHRocm93IG5ldyBNb25lcm9ScGNFcnJvcihyZXNwLmVycm9yLm1lc3NhZ2UsIHJlc3AuZXJyb3IuY29kZSwgcGF0aCwgcGFyYW1zKTtcbiAgICAgIHJldHVybiByZXNwO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICBpZiAoZXJyIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IpIHRocm93IGVycjtcbiAgICAgIGVsc2UgdGhyb3cgbmV3IE1vbmVyb1JwY0Vycm9yKGVyciwgZXJyLnN0YXR1c0NvZGUsIHBhdGgsIHBhcmFtcyk7XG4gICAgfVxuICB9XG5cbiAgZ2V0Q29uZmlnKCkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmk6IHRoaXMudXJpLFxuICAgICAgdXNlcm5hbWU6IHRoaXMudXNlcm5hbWUsXG4gICAgICBwYXNzd29yZDogdGhpcy5wYXNzd29yZCxcbiAgICAgIHJlamVjdFVuYXV0aG9yaXplZDogdGhpcy5yZWplY3RVbmF1dGhvcml6ZWQsXG4gICAgICBwcm94eVRvV29ya2VyOiB0aGlzLnByb3h5VG9Xb3JrZXIsXG4gICAgICBwcmlvcml0eTogdGhpcy5wcmlvcml0eVxuICAgIH07XG4gIH1cblxuICB0b0pzb24oKSB7XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHRoaXMpO1xuICB9XG4gIFxuICB0b1N0cmluZygpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRVcmkoKSArIFwiICh1c2VybmFtZT1cIiArIHRoaXMuZ2V0VXNlcm5hbWUoKSArIFwiLCBwYXNzd29yZD1cIiArICh0aGlzLmdldFBhc3N3b3JkKCkgPyBcIioqKlwiIDogdGhpcy5nZXRQYXNzd29yZCgpKSArIFwiLCBwcmlvcml0eT1cIiArIHRoaXMuZ2V0UHJpb3JpdHkoKSArIFwiLCBpc09ubGluZT1cIiArIHRoaXMuZ2V0SXNPbmxpbmUoKSArIFwiLCBpc0F1dGhlbnRpY2F0ZWQ9XCIgKyB0aGlzLmdldElzQXV0aGVudGljYXRlZCgpICsgXCIpXCI7XG4gIH1cblxuICBzZXRGYWtlRGlzY29ubmVjdGVkKGZha2VEaXNjb25uZWN0ZWQpIHsgLy8gdXNlZCB0byB0ZXN0IGNvbm5lY3Rpb24gbWFuYWdlclxuICAgIHRoaXMuZmFrZURpc2Nvbm5lY3RlZCA9IGZha2VEaXNjb25uZWN0ZWQ7IFxuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUFJJVkFURSBIRUxQRVJTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIHZhbGlkYXRlSHR0cFJlc3BvbnNlKHJlc3ApIHtcbiAgICBsZXQgY29kZSA9IHJlc3Auc3RhdHVzQ29kZTtcbiAgICBpZiAoY29kZSA8IDIwMCB8fCBjb2RlID4gMjk5KSB7XG4gICAgICBsZXQgY29udGVudCA9IHJlc3AuYm9keTtcbiAgICAgIHRocm93IG5ldyBNb25lcm9ScGNFcnJvcihjb2RlICsgXCIgXCIgKyByZXNwLnN0YXR1c1RleHQgKyAoIWNvbnRlbnQgPyBcIlwiIDogKFwiOiBcIiArIGNvbnRlbnQpKSwgY29kZSwgdW5kZWZpbmVkLCB1bmRlZmluZWQpO1xuICAgIH1cbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyB2YWxpZGF0ZVJwY1Jlc3BvbnNlKHJlc3AsIG1ldGhvZCwgcGFyYW1zKSB7XG4gICAgaWYgKCFyZXNwLmVycm9yKSByZXR1cm47XG4gICAgdGhyb3cgbmV3IE1vbmVyb1JwY0Vycm9yKHJlc3AuZXJyb3IubWVzc2FnZSwgcmVzcC5lcnJvci5jb2RlLCBtZXRob2QsIHBhcmFtcyk7XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLFNBQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLFdBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLGFBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFHLFlBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFJLGVBQUEsR0FBQUwsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFLLFlBQUEsR0FBQU4sc0JBQUEsQ0FBQUMsT0FBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDZSxNQUFNTSxtQkFBbUIsQ0FBQzs7RUFFdkM7Ozs7Ozs7O0VBUUE7Ozs7Ozs7RUFPQTtFQUNBO0VBQ0EsT0FBT0MsY0FBYyxHQUFpQztJQUNwREMsR0FBRyxFQUFFQyxTQUFTO0lBQ2RDLFFBQVEsRUFBRUQsU0FBUztJQUNuQkUsUUFBUSxFQUFFRixTQUFTO0lBQ25CRyxrQkFBa0IsRUFBRSxJQUFJLEVBQUU7SUFDMUJDLGFBQWEsRUFBRSxLQUFLO0lBQ3BCQyxRQUFRLEVBQUU7RUFDWixDQUFDOztFQUVEO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRUMsV0FBV0EsQ0FBQ0MsZUFBc0QsRUFBRU4sUUFBaUIsRUFBRUMsUUFBaUIsRUFBRTs7SUFFeEc7SUFDQSxJQUFJLE9BQU9LLGVBQWUsS0FBSyxRQUFRLEVBQUU7TUFDdkNDLE1BQU0sQ0FBQ0MsTUFBTSxDQUFDLElBQUksRUFBRVosbUJBQW1CLENBQUNDLGNBQWMsQ0FBQztNQUN2RCxJQUFJLENBQUNDLEdBQUcsR0FBR1EsZUFBZTtNQUMxQixJQUFJLENBQUNHLGNBQWMsQ0FBQ1QsUUFBUSxFQUFFQyxRQUFRLENBQUM7SUFDekMsQ0FBQyxNQUFNO01BQ0wsSUFBSUQsUUFBUSxLQUFLRCxTQUFTLElBQUlFLFFBQVEsS0FBS0YsU0FBUyxFQUFFLE1BQU0sSUFBSVcsb0JBQVcsQ0FBQyxrREFBa0QsQ0FBQztNQUMvSEgsTUFBTSxDQUFDQyxNQUFNLENBQUMsSUFBSSxFQUFFWixtQkFBbUIsQ0FBQ0MsY0FBYyxFQUFFUyxlQUFlLENBQUM7TUFDeEUsSUFBSSxDQUFDRyxjQUFjLENBQUMsSUFBSSxDQUFDVCxRQUFRLEVBQUUsSUFBSSxDQUFDQyxRQUFRLENBQUM7SUFDbkQ7O0lBRUE7SUFDQSxJQUFJLElBQUksQ0FBQ0gsR0FBRyxFQUFFLElBQUksQ0FBQ0EsR0FBRyxHQUFHYSxpQkFBUSxDQUFDQyxZQUFZLENBQUMsSUFBSSxDQUFDZCxHQUFHLENBQUM7RUFDMUQ7O0VBRUFXLGNBQWNBLENBQUNULFFBQVEsRUFBRUMsUUFBUSxFQUFFO0lBQ2pDLElBQUlELFFBQVEsS0FBSyxFQUFFLEVBQUVBLFFBQVEsR0FBR0QsU0FBUztJQUN6QyxJQUFJRSxRQUFRLEtBQUssRUFBRSxFQUFFQSxRQUFRLEdBQUdGLFNBQVM7SUFDekMsSUFBSUMsUUFBUSxJQUFJQyxRQUFRLEVBQUU7TUFDeEIsSUFBSSxDQUFDRCxRQUFRLEVBQUUsTUFBTSxJQUFJVSxvQkFBVyxDQUFDLHNEQUFzRCxDQUFDO01BQzVGLElBQUksQ0FBQ1QsUUFBUSxFQUFFLE1BQU0sSUFBSVMsb0JBQVcsQ0FBQyxzREFBc0QsQ0FBQztJQUM5RjtJQUNBLElBQUksSUFBSSxDQUFDVixRQUFRLEtBQUssRUFBRSxFQUFFLElBQUksQ0FBQ0EsUUFBUSxHQUFHRCxTQUFTO0lBQ25ELElBQUksSUFBSSxDQUFDRSxRQUFRLEtBQUssRUFBRSxFQUFFLElBQUksQ0FBQ0EsUUFBUSxHQUFHRixTQUFTO0lBQ25ELElBQUksSUFBSSxDQUFDQyxRQUFRLEtBQUtBLFFBQVEsSUFBSSxJQUFJLENBQUNDLFFBQVEsS0FBS0EsUUFBUSxFQUFFO01BQzVELElBQUksQ0FBQ1ksUUFBUSxHQUFHZCxTQUFTO01BQ3pCLElBQUksQ0FBQ2UsZUFBZSxHQUFHZixTQUFTO0lBQ2xDO0lBQ0EsSUFBSSxDQUFDQyxRQUFRLEdBQUdBLFFBQVE7SUFDeEIsSUFBSSxDQUFDQyxRQUFRLEdBQUdBLFFBQVE7SUFDeEIsT0FBTyxJQUFJO0VBQ2I7O0VBRUFjLE1BQU1BLENBQUEsRUFBRztJQUNQLE9BQU8sSUFBSSxDQUFDakIsR0FBRztFQUNqQjs7RUFFQWtCLFdBQVdBLENBQUEsRUFBRztJQUNaLE9BQU8sSUFBSSxDQUFDaEIsUUFBUSxHQUFHLElBQUksQ0FBQ0EsUUFBUSxHQUFHLEVBQUU7RUFDM0M7O0VBRUFpQixXQUFXQSxDQUFBLEVBQUc7SUFDWixPQUFPLElBQUksQ0FBQ2hCLFFBQVEsR0FBRyxJQUFJLENBQUNBLFFBQVEsR0FBRyxFQUFFO0VBQzNDOztFQUVBaUIscUJBQXFCQSxDQUFBLEVBQUc7SUFDdEIsT0FBTyxJQUFJLENBQUNoQixrQkFBa0I7RUFDaEM7O0VBRUFpQixnQkFBZ0JBLENBQUNoQixhQUFhLEVBQUU7SUFDOUIsSUFBSSxDQUFDQSxhQUFhLEdBQUdBLGFBQWE7SUFDbEMsT0FBTyxJQUFJO0VBQ2I7O0VBRUFpQixnQkFBZ0JBLENBQUEsRUFBRztJQUNqQixPQUFPLElBQUksQ0FBQ2pCLGFBQWE7RUFDM0I7O0VBRUFrQixXQUFXQSxDQUFBLEVBQUc7SUFDWixPQUFPLElBQUksQ0FBQ2pCLFFBQVE7RUFDdEI7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRWtCLFdBQVdBLENBQUNsQixRQUFRLEVBQUU7SUFDcEIsSUFBSSxFQUFFQSxRQUFRLElBQUksQ0FBQyxDQUFDLEVBQUUsTUFBTSxJQUFJTSxvQkFBVyxDQUFDLHVCQUF1QixDQUFDO0lBQ3BFLElBQUksQ0FBQ04sUUFBUSxHQUFHQSxRQUFRO0lBQ3hCLE9BQU8sSUFBSTtFQUNiOztFQUVBbUIsWUFBWUEsQ0FBQ0MsR0FBRyxFQUFFQyxLQUFLLEVBQUU7SUFDdkIsSUFBSSxDQUFDLElBQUksQ0FBQ0MsVUFBVSxFQUFFLElBQUksQ0FBQ0EsVUFBVSxHQUFHLElBQUlDLEdBQUcsQ0FBQyxDQUFDO0lBQ2pELElBQUksQ0FBQ0QsVUFBVSxDQUFDRSxHQUFHLENBQUNKLEdBQUcsRUFBRUMsS0FBSyxDQUFDO0lBQy9CLE9BQU8sSUFBSTtFQUNiOztFQUVBSSxZQUFZQSxDQUFDTCxHQUFHLEVBQUU7SUFDaEIsT0FBTyxJQUFJLENBQUNFLFVBQVUsQ0FBQ0ksR0FBRyxDQUFDTixHQUFHLENBQUM7RUFDakM7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsTUFBTU8sZUFBZUEsQ0FBQ0MsU0FBUyxFQUFFO0lBQy9CLE1BQU1DLHFCQUFZLENBQUNDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNyQyxJQUFJQyxjQUFjLEdBQUcsSUFBSSxDQUFDdEIsUUFBUTtJQUNsQyxJQUFJdUIscUJBQXFCLEdBQUcsSUFBSSxDQUFDdEIsZUFBZTtJQUNoRCxJQUFJdUIsU0FBUyxHQUFHQyxJQUFJLENBQUNDLEdBQUcsQ0FBQyxDQUFDO0lBQzFCLElBQUk7TUFDRixJQUFJLElBQUksQ0FBQ0MsZ0JBQWdCLEVBQUUsTUFBTSxJQUFJQyxLQUFLLENBQUMsaUNBQWlDLENBQUM7TUFDN0UsSUFBSUMsT0FBTyxHQUFHLEVBQUU7TUFDaEIsS0FBSyxJQUFJQyxDQUFDLEdBQUcsQ0FBQyxFQUFFQSxDQUFDLEdBQUcsR0FBRyxFQUFFQSxDQUFDLEVBQUUsRUFBRUQsT0FBTyxDQUFDRSxJQUFJLENBQUNELENBQUMsQ0FBQztNQUM3QyxNQUFNLElBQUksQ0FBQ0UsaUJBQWlCLENBQUMsMEJBQTBCLEVBQUUsRUFBQ0gsT0FBTyxFQUFFQSxPQUFPLEVBQUMsQ0FBQyxDQUFDLENBQUM7TUFDOUUsSUFBSSxDQUFDN0IsUUFBUSxHQUFHLElBQUk7TUFDcEIsSUFBSSxDQUFDQyxlQUFlLEdBQUcsSUFBSTtJQUM3QixDQUFDLENBQUMsT0FBT2dDLEdBQUcsRUFBRTtNQUNaLElBQUksQ0FBQ2pDLFFBQVEsR0FBRyxLQUFLO01BQ3JCLElBQUksQ0FBQ0MsZUFBZSxHQUFHZixTQUFTO01BQ2hDLElBQUksQ0FBQ2dELFlBQVksR0FBR2hELFNBQVM7TUFDN0IsSUFBSStDLEdBQUcsWUFBWUUsdUJBQWMsRUFBRTtRQUNqQyxJQUFJRixHQUFHLENBQUNHLE9BQU8sQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFO1VBQ3pCLElBQUksQ0FBQ3BDLFFBQVEsR0FBRyxJQUFJO1VBQ3BCLElBQUksQ0FBQ0MsZUFBZSxHQUFHLEtBQUs7UUFDOUIsQ0FBQyxNQUFNLElBQUlnQyxHQUFHLENBQUNHLE9BQU8sQ0FBQyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUU7VUFDbEMsSUFBSSxDQUFDcEMsUUFBUSxHQUFHLElBQUk7VUFDcEIsSUFBSSxDQUFDQyxlQUFlLEdBQUcsSUFBSTtRQUM3QjtNQUNGO0lBQ0Y7SUFDQSxJQUFJLElBQUksQ0FBQ0QsUUFBUSxFQUFFLElBQUksQ0FBQ2tDLFlBQVksR0FBR1QsSUFBSSxDQUFDQyxHQUFHLENBQUMsQ0FBQyxHQUFHRixTQUFTO0lBQzdELE9BQU9GLGNBQWMsS0FBSyxJQUFJLENBQUN0QixRQUFRLElBQUl1QixxQkFBcUIsS0FBSyxJQUFJLENBQUN0QixlQUFlO0VBQzNGOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0VvQyxXQUFXQSxDQUFBLEVBQUc7SUFDWixPQUFPLElBQUksQ0FBQ3JDLFFBQVEsS0FBS2QsU0FBUyxHQUFHQSxTQUFTLEdBQUcsSUFBSSxDQUFDYyxRQUFRLElBQUksSUFBSSxDQUFDQyxlQUFlLEtBQUssS0FBSztFQUNsRzs7RUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFcUMsV0FBV0EsQ0FBQSxFQUFHO0lBQ1osT0FBTyxJQUFJLENBQUN0QyxRQUFRO0VBQ3RCOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0V1QyxrQkFBa0JBLENBQUEsRUFBRztJQUNuQixPQUFPLElBQUksQ0FBQ3RDLGVBQWU7RUFDN0I7O0VBRUF1QyxlQUFlQSxDQUFBLEVBQUc7SUFDaEIsT0FBTyxJQUFJLENBQUNOLFlBQVk7RUFDMUI7O0VBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLE1BQU1PLGVBQWVBLENBQUNDLE1BQU0sRUFBRUMsTUFBTyxFQUFFQyxXQUFZLEVBQWdCO0lBQ2pFLElBQUk7O01BRUY7TUFDQSxJQUFJQyxJQUFJLEdBQUdDLElBQUksQ0FBQ0MsU0FBUyxDQUFDLEVBQUc7UUFDM0JDLEVBQUUsRUFBRSxHQUFHO1FBQ1BDLE9BQU8sRUFBRSxLQUFLO1FBQ2RQLE1BQU0sRUFBRUEsTUFBTTtRQUNkQyxNQUFNLEVBQUVBO01BQ1YsQ0FBQyxDQUFDOztNQUVGO01BQ0EsSUFBSXZCLHFCQUFZLENBQUM4QixXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRTlCLHFCQUFZLENBQUMrQixHQUFHLENBQUMsQ0FBQyxFQUFFLG9DQUFvQyxHQUFHVCxNQUFNLEdBQUcsY0FBYyxHQUFHRyxJQUFJLENBQUM7O01BRS9IO01BQ0EsSUFBSXJCLFNBQVMsR0FBRyxJQUFJQyxJQUFJLENBQUMsQ0FBQyxDQUFDMkIsT0FBTyxDQUFDLENBQUM7TUFDcEMsSUFBSUMsSUFBSSxHQUFHLE1BQU1DLG1CQUFVLENBQUNDLE9BQU8sQ0FBQztRQUNsQ2IsTUFBTSxFQUFFLE1BQU07UUFDZHpELEdBQUcsRUFBRSxJQUFJLENBQUNpQixNQUFNLENBQUMsQ0FBQyxHQUFHLFdBQVc7UUFDaENmLFFBQVEsRUFBRSxJQUFJLENBQUNnQixXQUFXLENBQUMsQ0FBQztRQUM1QmYsUUFBUSxFQUFFLElBQUksQ0FBQ2dCLFdBQVcsQ0FBQyxDQUFDO1FBQzVCeUMsSUFBSSxFQUFFQSxJQUFJO1FBQ1ZXLE9BQU8sRUFBRVosV0FBVztRQUNwQnZELGtCQUFrQixFQUFFLElBQUksQ0FBQ0Esa0JBQWtCO1FBQzNDb0UsVUFBVSxFQUFFM0QsaUJBQVEsQ0FBQzRELFNBQVMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxHQUFHLE9BQU8sRUFBRztRQUNyRHBFLGFBQWEsRUFBRSxJQUFJLENBQUNBO01BQ3RCLENBQUMsQ0FBQzs7TUFFRjtNQUNBUCxtQkFBbUIsQ0FBQzRFLG9CQUFvQixDQUFDTixJQUFJLENBQUM7O01BRTlDO01BQ0EsSUFBSUEsSUFBSSxDQUFDUixJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxFQUFFLE1BQU1RLElBQUksQ0FBQ1IsSUFBSTtNQUN4Q1EsSUFBSSxHQUFHUCxJQUFJLENBQUNjLEtBQUssQ0FBQ1AsSUFBSSxDQUFDUixJQUFJLENBQUNnQixPQUFPLENBQUMsNEJBQTRCLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFFO01BQy9FLElBQUl6QyxxQkFBWSxDQUFDOEIsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDbkMsSUFBSVksT0FBTyxHQUFHaEIsSUFBSSxDQUFDQyxTQUFTLENBQUNNLElBQUksQ0FBQztRQUNsQ2pDLHFCQUFZLENBQUMrQixHQUFHLENBQUMsQ0FBQyxFQUFFLGlDQUFpQyxHQUFHVCxNQUFNLEdBQUcsY0FBYyxHQUFHb0IsT0FBTyxDQUFDQyxTQUFTLENBQUMsQ0FBQyxFQUFFQyxJQUFJLENBQUNDLEdBQUcsQ0FBQyxJQUFJLEVBQUVILE9BQU8sQ0FBQ0ksTUFBTSxDQUFDLENBQUMsR0FBRyxHQUFHLElBQUksSUFBSXpDLElBQUksQ0FBQyxDQUFDLENBQUMyQixPQUFPLENBQUMsQ0FBQyxHQUFHNUIsU0FBUyxDQUFDLEdBQUcsTUFBTSxDQUFDO01BQzdMOztNQUVBO01BQ0F6QyxtQkFBbUIsQ0FBQ29GLG1CQUFtQixDQUFDZCxJQUFJLEVBQUVYLE1BQU0sRUFBRUMsTUFBTSxDQUFDO01BQzdELE9BQU9VLElBQUk7SUFDYixDQUFDLENBQUMsT0FBT3BCLEdBQVEsRUFBRTtNQUNqQixJQUFJQSxHQUFHLFlBQVlFLHVCQUFjLEVBQUUsTUFBTUYsR0FBRyxDQUFDO01BQ3hDLE1BQU0sSUFBSUUsdUJBQWMsQ0FBQ0YsR0FBRyxFQUFFQSxHQUFHLENBQUNtQyxVQUFVLEVBQUUxQixNQUFNLEVBQUVDLE1BQU0sQ0FBQztJQUNwRTtFQUNGOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsTUFBTTBCLGVBQWVBLENBQUNDLElBQUksRUFBRTNCLE1BQU8sRUFBRUMsV0FBWSxFQUFnQjtJQUMvRCxJQUFJOztNQUVGO01BQ0EsSUFBSXhCLHFCQUFZLENBQUM4QixXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRTlCLHFCQUFZLENBQUMrQixHQUFHLENBQUMsQ0FBQyxFQUFFLGtDQUFrQyxHQUFHbUIsSUFBSSxHQUFHLGdCQUFnQixHQUFHeEIsSUFBSSxDQUFDQyxTQUFTLENBQUNKLE1BQU0sQ0FBQyxDQUFDOztNQUUvSTtNQUNBLElBQUluQixTQUFTLEdBQUcsSUFBSUMsSUFBSSxDQUFDLENBQUMsQ0FBQzJCLE9BQU8sQ0FBQyxDQUFDO01BQ3BDLElBQUlDLElBQUksR0FBRyxNQUFNQyxtQkFBVSxDQUFDQyxPQUFPLENBQUM7UUFDbENiLE1BQU0sRUFBRSxNQUFNO1FBQ2R6RCxHQUFHLEVBQUUsSUFBSSxDQUFDaUIsTUFBTSxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUdvRSxJQUFJO1FBQy9CbkYsUUFBUSxFQUFFLElBQUksQ0FBQ2dCLFdBQVcsQ0FBQyxDQUFDO1FBQzVCZixRQUFRLEVBQUUsSUFBSSxDQUFDZ0IsV0FBVyxDQUFDLENBQUM7UUFDNUJ5QyxJQUFJLEVBQUVDLElBQUksQ0FBQ0MsU0FBUyxDQUFDSixNQUFNLENBQUMsRUFBRztRQUMvQmEsT0FBTyxFQUFFWixXQUFXO1FBQ3BCdkQsa0JBQWtCLEVBQUUsSUFBSSxDQUFDQSxrQkFBa0I7UUFDM0NvRSxVQUFVLEVBQUUzRCxpQkFBUSxDQUFDNEQsU0FBUyxDQUFDLENBQUMsR0FBRyxLQUFLLEdBQUcsT0FBTztRQUNsRHBFLGFBQWEsRUFBRSxJQUFJLENBQUNBO01BQ3RCLENBQUMsQ0FBQzs7TUFFRjtNQUNBUCxtQkFBbUIsQ0FBQzRFLG9CQUFvQixDQUFDTixJQUFJLENBQUM7O01BRTlDO01BQ0EsSUFBSUEsSUFBSSxDQUFDUixJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxFQUFFLE1BQU1RLElBQUksQ0FBQ1IsSUFBSTtNQUN4Q1EsSUFBSSxHQUFHUCxJQUFJLENBQUNjLEtBQUssQ0FBQ1AsSUFBSSxDQUFDUixJQUFJLENBQUNnQixPQUFPLENBQUMsNEJBQTRCLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFFO01BQy9FLElBQUksT0FBT1IsSUFBSSxLQUFLLFFBQVEsRUFBRUEsSUFBSSxHQUFHUCxJQUFJLENBQUNjLEtBQUssQ0FBQ1AsSUFBSSxDQUFDLENBQUMsQ0FBRTtNQUN4RCxJQUFJakMscUJBQVksQ0FBQzhCLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ25DLElBQUlZLE9BQU8sR0FBR2hCLElBQUksQ0FBQ0MsU0FBUyxDQUFDTSxJQUFJLENBQUM7UUFDbENqQyxxQkFBWSxDQUFDK0IsR0FBRyxDQUFDLENBQUMsRUFBRSwrQkFBK0IsR0FBR21CLElBQUksR0FBRyxjQUFjLEdBQUdSLE9BQU8sQ0FBQ0MsU0FBUyxDQUFDLENBQUMsRUFBRUMsSUFBSSxDQUFDQyxHQUFHLENBQUMsSUFBSSxFQUFFSCxPQUFPLENBQUNJLE1BQU0sQ0FBQyxDQUFDLEdBQUcsR0FBRyxJQUFJLElBQUl6QyxJQUFJLENBQUMsQ0FBQyxDQUFDMkIsT0FBTyxDQUFDLENBQUMsR0FBRzVCLFNBQVMsQ0FBQyxHQUFHLE1BQU0sQ0FBQztNQUN6TDs7TUFFQTtNQUNBekMsbUJBQW1CLENBQUNvRixtQkFBbUIsQ0FBQ2QsSUFBSSxFQUFFaUIsSUFBSSxFQUFFM0IsTUFBTSxDQUFDO01BQzNELE9BQU9VLElBQUk7SUFDYixDQUFDLENBQUMsT0FBT3BCLEdBQVEsRUFBRTtNQUNqQixJQUFJQSxHQUFHLFlBQVlFLHVCQUFjLEVBQUUsTUFBTUYsR0FBRyxDQUFDO01BQ3hDLE1BQU0sSUFBSUUsdUJBQWMsQ0FBQ0YsR0FBRyxFQUFFQSxHQUFHLENBQUNtQyxVQUFVLEVBQUVFLElBQUksRUFBRTNCLE1BQU0sQ0FBQztJQUNsRTtFQUNGOztFQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxNQUFNWCxpQkFBaUJBLENBQUNzQyxJQUFJLEVBQUUzQixNQUFPLEVBQUVDLFdBQVksRUFBZ0I7O0lBRWpFO0lBQ0EsSUFBSTJCLFNBQVMsR0FBRyxNQUFNQyxvQkFBVyxDQUFDQyxZQUFZLENBQUM5QixNQUFNLENBQUM7O0lBRXRELElBQUk7O01BRUY7TUFDQSxJQUFJdkIscUJBQVksQ0FBQzhCLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFOUIscUJBQVksQ0FBQytCLEdBQUcsQ0FBQyxDQUFDLEVBQUUsb0NBQW9DLEdBQUdtQixJQUFJLEdBQUcsZ0JBQWdCLEdBQUd4QixJQUFJLENBQUNDLFNBQVMsQ0FBQ0osTUFBTSxDQUFDLENBQUM7O01BRWpKO01BQ0EsSUFBSVUsSUFBSSxHQUFHLE1BQU1DLG1CQUFVLENBQUNDLE9BQU8sQ0FBQztRQUNsQ2IsTUFBTSxFQUFFLE1BQU07UUFDZHpELEdBQUcsRUFBRSxJQUFJLENBQUNpQixNQUFNLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBR29FLElBQUk7UUFDL0JuRixRQUFRLEVBQUUsSUFBSSxDQUFDZ0IsV0FBVyxDQUFDLENBQUM7UUFDNUJmLFFBQVEsRUFBRSxJQUFJLENBQUNnQixXQUFXLENBQUMsQ0FBQztRQUM1QnlDLElBQUksRUFBRTBCLFNBQVM7UUFDZmYsT0FBTyxFQUFFWixXQUFXO1FBQ3BCdkQsa0JBQWtCLEVBQUUsSUFBSSxDQUFDQSxrQkFBa0I7UUFDM0NvRSxVQUFVLEVBQUUzRCxpQkFBUSxDQUFDNEQsU0FBUyxDQUFDLENBQUMsR0FBRyxLQUFLLEdBQUcsT0FBTztRQUNsRHBFLGFBQWEsRUFBRSxJQUFJLENBQUNBO01BQ3RCLENBQUMsQ0FBQzs7TUFFRjtNQUNBUCxtQkFBbUIsQ0FBQzRFLG9CQUFvQixDQUFDTixJQUFJLENBQUM7O01BRTlDO01BQ0FBLElBQUksR0FBR0EsSUFBSSxDQUFDUixJQUFJO01BQ2hCLElBQUksRUFBRVEsSUFBSSxZQUFZcUIsVUFBVSxDQUFDLEVBQUU7UUFDakNDLE9BQU8sQ0FBQ0MsS0FBSyxDQUFDLHdCQUF3QixDQUFDO1FBQ3ZDRCxPQUFPLENBQUNDLEtBQUssQ0FBQ3ZCLElBQUksQ0FBQztNQUNyQjtNQUNBLElBQUlBLElBQUksQ0FBQ3VCLEtBQUssRUFBRSxNQUFNLElBQUl6Qyx1QkFBYyxDQUFDa0IsSUFBSSxDQUFDdUIsS0FBSyxDQUFDQyxPQUFPLEVBQUV4QixJQUFJLENBQUN1QixLQUFLLENBQUNFLElBQUksRUFBRVIsSUFBSSxFQUFFM0IsTUFBTSxDQUFDO01BQzNGLE9BQU9VLElBQUk7SUFDYixDQUFDLENBQUMsT0FBT3BCLEdBQVEsRUFBRTtNQUNqQixJQUFJQSxHQUFHLFlBQVlFLHVCQUFjLEVBQUUsTUFBTUYsR0FBRyxDQUFDO01BQ3hDLE1BQU0sSUFBSUUsdUJBQWMsQ0FBQ0YsR0FBRyxFQUFFQSxHQUFHLENBQUNtQyxVQUFVLEVBQUVFLElBQUksRUFBRTNCLE1BQU0sQ0FBQztJQUNsRTtFQUNGOztFQUVBb0MsU0FBU0EsQ0FBQSxFQUFHO0lBQ1YsT0FBTztNQUNMOUYsR0FBRyxFQUFFLElBQUksQ0FBQ0EsR0FBRztNQUNiRSxRQUFRLEVBQUUsSUFBSSxDQUFDQSxRQUFRO01BQ3ZCQyxRQUFRLEVBQUUsSUFBSSxDQUFDQSxRQUFRO01BQ3ZCQyxrQkFBa0IsRUFBRSxJQUFJLENBQUNBLGtCQUFrQjtNQUMzQ0MsYUFBYSxFQUFFLElBQUksQ0FBQ0EsYUFBYTtNQUNqQ0MsUUFBUSxFQUFFLElBQUksQ0FBQ0E7SUFDakIsQ0FBQztFQUNIOztFQUVBeUYsTUFBTUEsQ0FBQSxFQUFHO0lBQ1AsT0FBT3RGLE1BQU0sQ0FBQ0MsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQztFQUNoQzs7RUFFQXNGLFFBQVFBLENBQUEsRUFBRztJQUNULE9BQU8sSUFBSSxDQUFDL0UsTUFBTSxDQUFDLENBQUMsR0FBRyxhQUFhLEdBQUcsSUFBSSxDQUFDQyxXQUFXLENBQUMsQ0FBQyxHQUFHLGFBQWEsSUFBSSxJQUFJLENBQUNDLFdBQVcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxHQUFHLElBQUksQ0FBQ0EsV0FBVyxDQUFDLENBQUMsQ0FBQyxHQUFHLGFBQWEsR0FBRyxJQUFJLENBQUNJLFdBQVcsQ0FBQyxDQUFDLEdBQUcsYUFBYSxHQUFHLElBQUksQ0FBQzhCLFdBQVcsQ0FBQyxDQUFDLEdBQUcsb0JBQW9CLEdBQUcsSUFBSSxDQUFDQyxrQkFBa0IsQ0FBQyxDQUFDLEdBQUcsR0FBRztFQUNsUTs7RUFFQTJDLG1CQUFtQkEsQ0FBQ3ZELGdCQUFnQixFQUFFLENBQUU7SUFDdEMsSUFBSSxDQUFDQSxnQkFBZ0IsR0FBR0EsZ0JBQWdCO0VBQzFDOztFQUVBOztFQUVBLE9BQWlCZ0Msb0JBQW9CQSxDQUFDTixJQUFJLEVBQUU7SUFDMUMsSUFBSXlCLElBQUksR0FBR3pCLElBQUksQ0FBQ2UsVUFBVTtJQUMxQixJQUFJVSxJQUFJLEdBQUcsR0FBRyxJQUFJQSxJQUFJLEdBQUcsR0FBRyxFQUFFO01BQzVCLElBQUlLLE9BQU8sR0FBRzlCLElBQUksQ0FBQ1IsSUFBSTtNQUN2QixNQUFNLElBQUlWLHVCQUFjLENBQUMyQyxJQUFJLEdBQUcsR0FBRyxHQUFHekIsSUFBSSxDQUFDK0IsVUFBVSxJQUFJLENBQUNELE9BQU8sR0FBRyxFQUFFLEdBQUksSUFBSSxHQUFHQSxPQUFRLENBQUMsRUFBRUwsSUFBSSxFQUFFNUYsU0FBUyxFQUFFQSxTQUFTLENBQUM7SUFDekg7RUFDRjs7RUFFQSxPQUFpQmlGLG1CQUFtQkEsQ0FBQ2QsSUFBSSxFQUFFWCxNQUFNLEVBQUVDLE1BQU0sRUFBRTtJQUN6RCxJQUFJLENBQUNVLElBQUksQ0FBQ3VCLEtBQUssRUFBRTtJQUNqQixNQUFNLElBQUl6Qyx1QkFBYyxDQUFDa0IsSUFBSSxDQUFDdUIsS0FBSyxDQUFDQyxPQUFPLEVBQUV4QixJQUFJLENBQUN1QixLQUFLLENBQUNFLElBQUksRUFBRXBDLE1BQU0sRUFBRUMsTUFBTSxDQUFDO0VBQy9FO0FBQ0YsQ0FBQzBDLE9BQUEsQ0FBQUMsT0FBQSxHQUFBdkcsbUJBQUEifQ==