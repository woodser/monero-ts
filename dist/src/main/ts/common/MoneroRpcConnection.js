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
    priority: 0,
    timeoutMs: undefined
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

  getPriority() {
    return this.priority;
  }

  /**
   * Set the RPC request timeout in milliseconds.
   * 
   * @param {number} timeoutMs is the timeout in milliseconds, 0 to disable timeout, or undefined to use default
   * @return {MoneroRpcConnection} this connection
   */
  setTimeout(timeoutMs) {
    this.timeoutMs = timeoutMs;
    return this;
  }

  getTimeout() {
    return this.timeoutMs;
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
   * @param {number} [timeoutMs] - overrides the request timeout in milliseconds
   * @return {object} is the response map
   */
  async sendJsonRequest(method, params, timeoutMs) {
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
        timeout: timeoutMs === undefined ? this.timeoutMs : timeoutMs,
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
      this.validateRpcResponse(resp, method, params);
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
   * @param {number} [timeoutMs] - overrides the request timeout in milliseconds
   * @return {object} is the response map
   */
  async sendPathRequest(path, params, timeoutMs) {
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
        timeout: timeoutMs === undefined ? this.timeoutMs : timeoutMs,
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
      this.validateRpcResponse(resp, path, params);
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
   * @param {number} [timeoutMs] - request timeout in milliseconds
   * @return {Uint8Array} the binary response
   */
  async sendBinaryRequest(path, params, timeoutMs) {

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
        timeout: timeoutMs === undefined ? this.timeoutMs : timeoutMs,
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
      priority: this.priority,
      timeoutMs: this.timeoutMs
    };
  }

  toJson() {
    return Object.assign({}, this);
  }

  toString() {
    return this.getUri() + " (username=" + this.getUsername() + ", password=" + (this.getPassword() ? "***" : this.getPassword()) + ", priority=" + this.getPriority() + " timeoutMs=" + this.getTimeout() + ", isOnline=" + this.getIsOnline() + ", isAuthenticated=" + this.getIsAuthenticated() + ")";
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

  validateRpcResponse(resp, method, params) {
    if (resp.error === undefined) return;
    let errorMsg = resp.error.message;
    if (errorMsg === "") errorMsg = "Received error response from RPC request with method '" + method + "' to " + this.getUri(); // TODO (monero-project): response sometimes has empty error message
    throw new _MoneroRpcError.default(resp.error.message, resp.error.code, method, params);
  }
}exports.default = MoneroRpcConnection;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfR2VuVXRpbHMiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9IdHRwQ2xpZW50IiwiX0xpYnJhcnlVdGlscyIsIl9Nb25lcm9FcnJvciIsIl9Nb25lcm9ScGNFcnJvciIsIl9Nb25lcm9VdGlscyIsIk1vbmVyb1JwY0Nvbm5lY3Rpb24iLCJERUZBVUxUX0NPTkZJRyIsInVyaSIsInVuZGVmaW5lZCIsInVzZXJuYW1lIiwicGFzc3dvcmQiLCJyZWplY3RVbmF1dGhvcml6ZWQiLCJwcm94eVRvV29ya2VyIiwicHJpb3JpdHkiLCJ0aW1lb3V0TXMiLCJjb25zdHJ1Y3RvciIsInVyaU9yQ29ubmVjdGlvbiIsIk9iamVjdCIsImFzc2lnbiIsInNldENyZWRlbnRpYWxzIiwiTW9uZXJvRXJyb3IiLCJHZW5VdGlscyIsIm5vcm1hbGl6ZVVyaSIsImlzT25saW5lIiwiaXNBdXRoZW50aWNhdGVkIiwiZ2V0VXJpIiwiZ2V0VXNlcm5hbWUiLCJnZXRQYXNzd29yZCIsImdldFJlamVjdFVuYXV0aG9yaXplZCIsInNldFByb3h5VG9Xb3JrZXIiLCJnZXRQcm94eVRvV29ya2VyIiwic2V0UHJpb3JpdHkiLCJnZXRQcmlvcml0eSIsInNldFRpbWVvdXQiLCJnZXRUaW1lb3V0Iiwic2V0QXR0cmlidXRlIiwia2V5IiwidmFsdWUiLCJhdHRyaWJ1dGVzIiwiTWFwIiwicHV0IiwiZ2V0QXR0cmlidXRlIiwiZ2V0IiwiY2hlY2tDb25uZWN0aW9uIiwiTGlicmFyeVV0aWxzIiwibG9hZEtleXNNb2R1bGUiLCJpc09ubGluZUJlZm9yZSIsImlzQXV0aGVudGljYXRlZEJlZm9yZSIsInN0YXJ0VGltZSIsIkRhdGUiLCJub3ciLCJmYWtlRGlzY29ubmVjdGVkIiwiRXJyb3IiLCJoZWlnaHRzIiwiaSIsInB1c2giLCJzZW5kQmluYXJ5UmVxdWVzdCIsImVyciIsInJlc3BvbnNlVGltZSIsIk1vbmVyb1JwY0Vycm9yIiwiZ2V0Q29kZSIsImlzQ29ubmVjdGVkIiwiZ2V0SXNPbmxpbmUiLCJnZXRJc0F1dGhlbnRpY2F0ZWQiLCJnZXRSZXNwb25zZVRpbWUiLCJzZW5kSnNvblJlcXVlc3QiLCJtZXRob2QiLCJwYXJhbXMiLCJib2R5IiwiSlNPTiIsInN0cmluZ2lmeSIsImlkIiwianNvbnJwYyIsImdldExvZ0xldmVsIiwibG9nIiwiZ2V0VGltZSIsInJlc3AiLCJIdHRwQ2xpZW50IiwicmVxdWVzdCIsInRpbWVvdXQiLCJyZXF1ZXN0QXBpIiwiaXNGaXJlZm94IiwidmFsaWRhdGVIdHRwUmVzcG9uc2UiLCJwYXJzZSIsInJlcGxhY2UiLCJyZXNwU3RyIiwic3Vic3RyaW5nIiwiTWF0aCIsIm1pbiIsImxlbmd0aCIsInZhbGlkYXRlUnBjUmVzcG9uc2UiLCJzdGF0dXNDb2RlIiwic2VuZFBhdGhSZXF1ZXN0IiwicGF0aCIsInBhcmFtc0JpbiIsIk1vbmVyb1V0aWxzIiwianNvblRvQmluYXJ5IiwiVWludDhBcnJheSIsImNvbnNvbGUiLCJlcnJvciIsIm1lc3NhZ2UiLCJjb2RlIiwiZ2V0Q29uZmlnIiwidG9Kc29uIiwidG9TdHJpbmciLCJzZXRGYWtlRGlzY29ubmVjdGVkIiwiY29udGVudCIsInN0YXR1c1RleHQiLCJlcnJvck1zZyIsImV4cG9ydHMiLCJkZWZhdWx0Il0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvY29tbW9uL01vbmVyb1JwY0Nvbm5lY3Rpb24udHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEdlblV0aWxzIGZyb20gXCIuL0dlblV0aWxzXCI7XG5pbXBvcnQgSHR0cENsaWVudCBmcm9tIFwiLi9IdHRwQ2xpZW50XCI7XG5pbXBvcnQgTGlicmFyeVV0aWxzIGZyb20gXCIuL0xpYnJhcnlVdGlsc1wiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuL01vbmVyb0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvUnBjRXJyb3IgZnJvbSBcIi4vTW9uZXJvUnBjRXJyb3JcIjtcbmltcG9ydCBNb25lcm9VdGlscyBmcm9tIFwiLi9Nb25lcm9VdGlsc1wiO1xuXG4vKipcbiAqIE1haW50YWlucyBhIGNvbm5lY3Rpb24gYW5kIHNlbmRzIHJlcXVlc3RzIHRvIGEgTW9uZXJvIFJQQyBBUEkuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1vbmVyb1JwY0Nvbm5lY3Rpb24ge1xuXG4gIC8vIHB1YmxpYyBpbnN0YW5jZSB2YXJpYWJsZXNcbiAgdXJpOiBzdHJpbmc7XG4gIHVzZXJuYW1lOiBzdHJpbmc7XG4gIHBhc3N3b3JkOiBzdHJpbmc7XG4gIHJlamVjdFVuYXV0aG9yaXplZDogYm9vbGVhbjtcbiAgcHJveHlUb1dvcmtlcjogYm9vbGVhbjtcbiAgcHJpb3JpdHk6IG51bWJlcjtcbiAgdGltZW91dE1zOiBudW1iZXI7XG5cbiAgLy8gcHJpdmF0ZSBpbnN0YW5jZSB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIGlzT25saW5lOiBib29sZWFuO1xuICBwcm90ZWN0ZWQgaXNBdXRoZW50aWNhdGVkOiBib29sZWFuO1xuICBwcm90ZWN0ZWQgYXR0cmlidXRlczogYW55O1xuICBwcm90ZWN0ZWQgZmFrZURpc2Nvbm5lY3RlZDogYm9vbGVhbjtcbiAgcHJvdGVjdGVkIHJlc3BvbnNlVGltZTogbnVtYmVyO1xuXG4gIC8vIGRlZmF1bHQgY29uZmlnXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBzdGF0aWMgREVGQVVMVF9DT05GSUc6IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4gPSB7XG4gICAgdXJpOiB1bmRlZmluZWQsXG4gICAgdXNlcm5hbWU6IHVuZGVmaW5lZCxcbiAgICBwYXNzd29yZDogdW5kZWZpbmVkLFxuICAgIHJlamVjdFVuYXV0aG9yaXplZDogdHJ1ZSwgLy8gcmVqZWN0IHNlbGYtc2lnbmVkIGNlcnRpZmljYXRlcyBpZiB0cnVlXG4gICAgcHJveHlUb1dvcmtlcjogZmFsc2UsXG4gICAgcHJpb3JpdHk6IDAsXG4gICAgdGltZW91dE1zOiB1bmRlZmluZWRcbiAgfVxuXG4gIC8qKlxuICAgKiA8cD5Db25zdHJ1Y3QgYSBSUEMgY29ubmVjdGlvbi48L3A+XG4gICAqIFxuICAgKiA8cD5FeGFtcGxlczo8L3A+XG4gICAqIFxuICAgKiA8Y29kZT5cbiAgICogbGV0IGNvbm5lY3Rpb24xID0gbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24oXCJodHRwOi8vbG9jYWxob3N0OjM4MDgxXCIsIFwiZGFlbW9uX3VzZXJcIiwgXCJkYWVtb25fcGFzc3dvcmRfMTIzXCIpPGJyPjxicj5cbiAgICogXG4gICAqIGxldCBjb25uZWN0aW9uMiA9IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHs8YnI+XG4gICAqICZuYnNwOyZuYnNwOyB1cmk6IGh0dHA6Ly9sb2NhbGhvc3Q6MzgwODEsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgdXNlcm5hbWU6IFwiZGFlbW9uX3VzZXJcIiw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBwYXNzd29yZDogXCJkYWVtb25fcGFzc3dvcmRfMTIzXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcmVqZWN0VW5hdXRob3JpemVkOiBmYWxzZSwgLy8gYWNjZXB0IHNlbGYtc2lnbmVkIGNlcnRpZmljYXRlcyBlLmcuIGZvciBsb2NhbCBkZXZlbG9wbWVudDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHByb3h5VG9Xb3JrZXI6IHRydWUgLy8gcHJveHkgcmVxdWVzdCB0byB3b3JrZXIgKGRlZmF1bHQgZmFsc2UpPGJyPlxuICAgKiB9KTtcbiAgICogPC9jb2RlPlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd8UGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPn0gdXJpT3JDb25uZWN0aW9uIC0gTW9uZXJvUnBjQ29ubmVjdGlvbiBvciBVUkkgb2YgdGhlIFJQQyBlbmRwb2ludFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXJpT3JDb25uZWN0aW9uLnVyaSAtIFVSSSBvZiB0aGUgUlBDIGVuZHBvaW50XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbdXJpT3JDb25uZWN0aW9uLnVzZXJuYW1lXSAtIHVzZXJuYW1lIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIHRoZSBSUEMgZW5kcG9pbnQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3VyaU9yQ29ubmVjdGlvbi5wYXNzd29yZF0gLSBwYXNzd29yZCB0byBhdXRoZW50aWNhdGUgd2l0aCB0aGUgUlBDIGVuZHBvaW50IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbdXJpT3JDb25uZWN0aW9uLnJlamVjdFVuYXV0aG9yaXplZF0gLSByZWplY3RzIHNlbGYtc2lnbmVkIGNlcnRpZmljYXRlcyBpZiB0cnVlIChkZWZhdWx0IHRydWUpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gdXJpT3JDb25uZWN0aW9uLnByb3h5VG9Xb3JrZXIgLSBwcm94eSByZXF1ZXN0cyB0byB3b3JrZXIgKGRlZmF1bHQgdHJ1ZSlcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVzZXJuYW1lIC0gdXNlcm5hbWUgdG8gYXV0aGVudGljYXRlIHdpdGggdGhlIFJQQyBlbmRwb2ludCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXNzd29yZCAtIHBhc3N3b3JkIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIHRoZSBSUEMgZW5kcG9pbnQgKG9wdGlvbmFsKVxuICAgKi9cbiAgY29uc3RydWN0b3IodXJpT3JDb25uZWN0aW9uOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+LCB1c2VybmFtZT86IHN0cmluZywgcGFzc3dvcmQ/OiBzdHJpbmcpIHtcblxuICAgIC8vIHZhbGlkYXRlIGFuZCBub3JtYWxpemUgY29uZmlnXG4gICAgaWYgKHR5cGVvZiB1cmlPckNvbm5lY3Rpb24gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIE9iamVjdC5hc3NpZ24odGhpcywgTW9uZXJvUnBjQ29ubmVjdGlvbi5ERUZBVUxUX0NPTkZJRyk7XG4gICAgICB0aGlzLnVyaSA9IHVyaU9yQ29ubmVjdGlvbjtcbiAgICAgIHRoaXMuc2V0Q3JlZGVudGlhbHModXNlcm5hbWUsIHBhc3N3b3JkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHVzZXJuYW1lICE9PSB1bmRlZmluZWQgfHwgcGFzc3dvcmQgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2FuIHByb3ZpZGUgY29uZmlnIG9iamVjdCBvciBwYXJhbXMgYnV0IG5vdCBib3RoXCIpO1xuICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLCBNb25lcm9ScGNDb25uZWN0aW9uLkRFRkFVTFRfQ09ORklHLCB1cmlPckNvbm5lY3Rpb24pO1xuICAgICAgdGhpcy5zZXRDcmVkZW50aWFscyh0aGlzLnVzZXJuYW1lLCB0aGlzLnBhc3N3b3JkKTtcbiAgICB9XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIHVyaVxuICAgIGlmICh0aGlzLnVyaSkgdGhpcy51cmkgPSBHZW5VdGlscy5ub3JtYWxpemVVcmkodGhpcy51cmkpO1xuICB9XG4gIFxuICBzZXRDcmVkZW50aWFscyh1c2VybmFtZSwgcGFzc3dvcmQpIHtcbiAgICBpZiAodXNlcm5hbWUgPT09IFwiXCIpIHVzZXJuYW1lID0gdW5kZWZpbmVkO1xuICAgIGlmIChwYXNzd29yZCA9PT0gXCJcIikgcGFzc3dvcmQgPSB1bmRlZmluZWQ7XG4gICAgaWYgKHVzZXJuYW1lIHx8IHBhc3N3b3JkKSB7XG4gICAgICBpZiAoIXVzZXJuYW1lKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJ1c2VybmFtZSBtdXN0IGJlIGRlZmluZWQgYmVjYXVzZSBwYXNzd29yZCBpcyBkZWZpbmVkXCIpO1xuICAgICAgaWYgKCFwYXNzd29yZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwicGFzc3dvcmQgbXVzdCBiZSBkZWZpbmVkIGJlY2F1c2UgdXNlcm5hbWUgaXMgZGVmaW5lZFwiKTtcbiAgICB9XG4gICAgaWYgKHRoaXMudXNlcm5hbWUgPT09IFwiXCIpIHRoaXMudXNlcm5hbWUgPSB1bmRlZmluZWQ7XG4gICAgaWYgKHRoaXMucGFzc3dvcmQgPT09IFwiXCIpIHRoaXMucGFzc3dvcmQgPSB1bmRlZmluZWQ7XG4gICAgaWYgKHRoaXMudXNlcm5hbWUgIT09IHVzZXJuYW1lIHx8IHRoaXMucGFzc3dvcmQgIT09IHBhc3N3b3JkKSB7XG4gICAgICB0aGlzLmlzT25saW5lID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHRoaXMudXNlcm5hbWUgPSB1c2VybmFtZTtcbiAgICB0aGlzLnBhc3N3b3JkID0gcGFzc3dvcmQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIGdldFVyaSgpIHtcbiAgICByZXR1cm4gdGhpcy51cmk7XG4gIH1cbiAgXG4gIGdldFVzZXJuYW1lKCkge1xuICAgIHJldHVybiB0aGlzLnVzZXJuYW1lID8gdGhpcy51c2VybmFtZSA6IFwiXCI7XG4gIH1cbiAgXG4gIGdldFBhc3N3b3JkKCkge1xuICAgIHJldHVybiB0aGlzLnBhc3N3b3JkID8gdGhpcy5wYXNzd29yZCA6IFwiXCI7XG4gIH1cbiAgXG4gIGdldFJlamVjdFVuYXV0aG9yaXplZCgpIHtcbiAgICByZXR1cm4gdGhpcy5yZWplY3RVbmF1dGhvcml6ZWQ7XG4gIH1cbiAgXG4gIHNldFByb3h5VG9Xb3JrZXIocHJveHlUb1dvcmtlcikge1xuICAgIHRoaXMucHJveHlUb1dvcmtlciA9IHByb3h5VG9Xb3JrZXI7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIGdldFByb3h5VG9Xb3JrZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMucHJveHlUb1dvcmtlcjtcbiAgfVxuICBcbiAgXG4gIC8qKlxuICAgKiBTZXQgdGhlIGNvbm5lY3Rpb24ncyBwcmlvcml0eSByZWxhdGl2ZSB0byBvdGhlciBjb25uZWN0aW9ucy4gUHJpb3JpdHkgMSBpcyBoaWdoZXN0LFxuICAgKiB0aGVuIHByaW9yaXR5IDIsIGV0Yy4gVGhlIGRlZmF1bHQgcHJpb3JpdHkgb2YgMCBpcyBsb3dlc3QgcHJpb3JpdHkuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gW3ByaW9yaXR5XSAtIHRoZSBjb25uZWN0aW9uIHByaW9yaXR5IChkZWZhdWx0IDApXG4gICAqIEByZXR1cm4ge01vbmVyb1JwY0Nvbm5lY3Rpb259IHRoaXMgY29ubmVjdGlvblxuICAgKi9cbiAgc2V0UHJpb3JpdHkocHJpb3JpdHkpIHtcbiAgICBpZiAoIShwcmlvcml0eSA+PSAwKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiUHJpb3JpdHkgbXVzdCBiZSA+PSAwXCIpO1xuICAgIHRoaXMucHJpb3JpdHkgPSBwcmlvcml0eTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldFByaW9yaXR5KCkge1xuICAgIHJldHVybiB0aGlzLnByaW9yaXR5OyBcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIFJQQyByZXF1ZXN0IHRpbWVvdXQgaW4gbWlsbGlzZWNvbmRzLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IHRpbWVvdXRNcyBpcyB0aGUgdGltZW91dCBpbiBtaWxsaXNlY29uZHMsIDAgdG8gZGlzYWJsZSB0aW1lb3V0LCBvciB1bmRlZmluZWQgdG8gdXNlIGRlZmF1bHRcbiAgICogQHJldHVybiB7TW9uZXJvUnBjQ29ubmVjdGlvbn0gdGhpcyBjb25uZWN0aW9uXG4gICAqL1xuICBzZXRUaW1lb3V0KHRpbWVvdXRNczogbnVtYmVyKSB7XG4gICAgdGhpcy50aW1lb3V0TXMgPSB0aW1lb3V0TXM7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXRUaW1lb3V0KCkge1xuICAgIHJldHVybiB0aGlzLnRpbWVvdXRNcztcbiAgfVxuICBcbiAgc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpIHtcbiAgICBpZiAoIXRoaXMuYXR0cmlidXRlcykgdGhpcy5hdHRyaWJ1dGVzID0gbmV3IE1hcCgpO1xuICAgIHRoaXMuYXR0cmlidXRlcy5wdXQoa2V5LCB2YWx1ZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIGdldEF0dHJpYnV0ZShrZXkpIHtcbiAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzLmdldChrZXkpO1xuICB9XG4gIFxuICAvKipcbiAgICogQ2hlY2sgdGhlIGNvbm5lY3Rpb24gc3RhdHVzIHRvIHVwZGF0ZSBpc09ubGluZSwgaXNBdXRoZW50aWNhdGVkLCBhbmQgcmVzcG9uc2UgdGltZS5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB0aW1lb3V0TXMgLSBtYXhpbXVtIHJlc3BvbnNlIHRpbWUgYmVmb3JlIGNvbnNpZGVyZWQgb2ZmbGluZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSB0cnVlIGlmIHRoZXJlIGlzIGEgY2hhbmdlIGluIHN0YXR1cywgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBhc3luYyBjaGVja0Nvbm5lY3Rpb24odGltZW91dE1zKSB7XG4gICAgYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRLZXlzTW9kdWxlKCk7IC8vIGNhY2hlIHdhc20gZm9yIGJpbmFyeSByZXF1ZXN0XG4gICAgbGV0IGlzT25saW5lQmVmb3JlID0gdGhpcy5pc09ubGluZTtcbiAgICBsZXQgaXNBdXRoZW50aWNhdGVkQmVmb3JlID0gdGhpcy5pc0F1dGhlbnRpY2F0ZWQ7XG4gICAgbGV0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgdHJ5IHtcbiAgICAgIGlmICh0aGlzLmZha2VEaXNjb25uZWN0ZWQpIHRocm93IG5ldyBFcnJvcihcIkNvbm5lY3Rpb24gaXMgZmFrZSBkaXNjb25uZWN0ZWRcIik7XG4gICAgICBsZXQgaGVpZ2h0cyA9IFtdO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMDA7IGkrKykgaGVpZ2h0cy5wdXNoKGkpO1xuICAgICAgYXdhaXQgdGhpcy5zZW5kQmluYXJ5UmVxdWVzdChcImdldF9ibG9ja3NfYnlfaGVpZ2h0LmJpblwiLCB7aGVpZ2h0czogaGVpZ2h0c30sIHRpbWVvdXRNcyk7IC8vIGFzc3VtZSBkYWVtb24gY29ubmVjdGlvblxuICAgICAgdGhpcy5pc09ubGluZSA9IHRydWU7XG4gICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IHRydWU7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICB0aGlzLmlzT25saW5lID0gZmFsc2U7XG4gICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMucmVzcG9uc2VUaW1lID0gdW5kZWZpbmVkO1xuICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yKSB7XG4gICAgICAgIGlmIChlcnIuZ2V0Q29kZSgpID09PSA0MDEpIHtcbiAgICAgICAgICB0aGlzLmlzT25saW5lID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IGZhbHNlO1xuICAgICAgICB9IGVsc2UgaWYgKGVyci5nZXRDb2RlKCkgPT09IDQwNCkgeyAvLyBmYWxsYmFjayB0byBsYXRlbmN5IGNoZWNrXG4gICAgICAgICAgdGhpcy5pc09ubGluZSA9IHRydWU7XG4gICAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLmlzT25saW5lKSB0aGlzLnJlc3BvbnNlVGltZSA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG4gICAgcmV0dXJuIGlzT25saW5lQmVmb3JlICE9PSB0aGlzLmlzT25saW5lIHx8IGlzQXV0aGVudGljYXRlZEJlZm9yZSAhPT0gdGhpcy5pc0F1dGhlbnRpY2F0ZWQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGNvbm5lY3Rpb24gaXMgY29ubmVjdGVkIGFjY29yZGluZyB0byB0aGUgbGFzdCBjYWxsIHRvIGNoZWNrQ29ubmVjdGlvbigpLjxicj48YnI+XG4gICAqIFxuICAgKiBOb3RlOiBtdXN0IGNhbGwgY2hlY2tDb25uZWN0aW9uKCkgbWFudWFsbHkgdW5sZXNzIHVzaW5nIE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyLlxuICAgKiBcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBvciBmYWxzZSB0byBpbmRpY2F0ZSBpZiBjb25uZWN0ZWQsIG9yIHVuZGVmaW5lZCBpZiBjaGVja0Nvbm5lY3Rpb24oKSBoYXMgbm90IGJlZW4gY2FsbGVkXG4gICAqL1xuICBpc0Nvbm5lY3RlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5pc09ubGluZSA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogdGhpcy5pc09ubGluZSAmJiB0aGlzLmlzQXV0aGVudGljYXRlZCAhPT0gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBjb25uZWN0aW9uIGlzIG9ubGluZSBhY2NvcmRpbmcgdG8gdGhlIGxhc3QgY2FsbCB0byBjaGVja0Nvbm5lY3Rpb24oKS48YnI+PGJyPlxuICAgKiBcbiAgICogTm90ZTogbXVzdCBjYWxsIGNoZWNrQ29ubmVjdGlvbigpIG1hbnVhbGx5IHVubGVzcyB1c2luZyBNb25lcm9Db25uZWN0aW9uTWFuYWdlci5cbiAgICogXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgb3IgZmFsc2UgdG8gaW5kaWNhdGUgaWYgb25saW5lLCBvciB1bmRlZmluZWQgaWYgY2hlY2tDb25uZWN0aW9uKCkgaGFzIG5vdCBiZWVuIGNhbGxlZFxuICAgKi9cbiAgZ2V0SXNPbmxpbmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNPbmxpbmU7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBjb25uZWN0aW9uIGlzIGF1dGhlbnRpY2F0ZWQgYWNjb3JkaW5nIHRvIHRoZSBsYXN0IGNhbGwgdG8gY2hlY2tDb25uZWN0aW9uKCkuPGJyPjxicj5cbiAgICogXG4gICAqIE5vdGU6IG11c3QgY2FsbCBjaGVja0Nvbm5lY3Rpb24oKSBtYW51YWxseSB1bmxlc3MgdXNpbmcgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIGF1dGhlbnRpY2F0ZWQgb3Igbm8gYXV0aGVudGljYXRpb24sIGZhbHNlIGlmIG5vdCBhdXRoZW50aWNhdGVkLCBvciB1bmRlZmluZWQgaWYgY2hlY2tDb25uZWN0aW9uKCkgaGFzIG5vdCBiZWVuIGNhbGxlZFxuICAgKi9cbiAgZ2V0SXNBdXRoZW50aWNhdGVkKCkge1xuICAgIHJldHVybiB0aGlzLmlzQXV0aGVudGljYXRlZDtcbiAgfVxuXG4gIGdldFJlc3BvbnNlVGltZSgpIHtcbiAgICByZXR1cm4gdGhpcy5yZXNwb25zZVRpbWU7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZW5kIGEgSlNPTiBSUEMgcmVxdWVzdC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZXRob2QgLSBKU09OIFJQQyBtZXRob2QgdG8gaW52b2tlXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXMgLSByZXF1ZXN0IHBhcmFtZXRlcnNcbiAgICogQHBhcmFtIHtudW1iZXJ9IFt0aW1lb3V0TXNdIC0gb3ZlcnJpZGVzIHRoZSByZXF1ZXN0IHRpbWVvdXQgaW4gbWlsbGlzZWNvbmRzXG4gICAqIEByZXR1cm4ge29iamVjdH0gaXMgdGhlIHJlc3BvbnNlIG1hcFxuICAgKi9cbiAgYXN5bmMgc2VuZEpzb25SZXF1ZXN0KG1ldGhvZCwgcGFyYW1zPywgdGltZW91dE1zPyk6IFByb21pc2U8YW55PiB7XG4gICAgdHJ5IHtcbiAgICAgIFxuICAgICAgLy8gYnVpbGQgcmVxdWVzdCBib2R5XG4gICAgICBsZXQgYm9keSA9IEpTT04uc3RyaW5naWZ5KHsgIC8vIGJvZHkgaXMgc3RyaW5naWZpZWQgc28gdGV4dC9wbGFpbiBpcyByZXR1cm5lZCBzbyBiaWdpbnRzIGFyZSBwcmVzZXJ2ZWRcbiAgICAgICAgaWQ6IFwiMFwiLFxuICAgICAgICBqc29ucnBjOiBcIjIuMFwiLFxuICAgICAgICBtZXRob2Q6IG1ldGhvZCxcbiAgICAgICAgcGFyYW1zOiBwYXJhbXNcbiAgICAgIH0pO1xuXG4gICAgICAvLyBsb2dnaW5nXG4gICAgICBpZiAoTGlicmFyeVV0aWxzLmdldExvZ0xldmVsKCkgPj0gMikgTGlicmFyeVV0aWxzLmxvZygyLCBcIlNlbmRpbmcganNvbiByZXF1ZXN0IHdpdGggbWV0aG9kICdcIiArIG1ldGhvZCArIFwiJyBhbmQgYm9keTogXCIgKyBib2R5KTtcbiAgICAgIFxuICAgICAgLy8gc2VuZCBodHRwIHJlcXVlc3RcbiAgICAgIGxldCBzdGFydFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgIGxldCByZXNwID0gYXdhaXQgSHR0cENsaWVudC5yZXF1ZXN0KHtcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgdXJpOiB0aGlzLmdldFVyaSgpICsgJy9qc29uX3JwYycsXG4gICAgICAgIHVzZXJuYW1lOiB0aGlzLmdldFVzZXJuYW1lKCksXG4gICAgICAgIHBhc3N3b3JkOiB0aGlzLmdldFBhc3N3b3JkKCksXG4gICAgICAgIGJvZHk6IGJvZHksXG4gICAgICAgIHRpbWVvdXQ6IHRpbWVvdXRNcyA9PT0gdW5kZWZpbmVkID8gdGhpcy50aW1lb3V0TXMgOiB0aW1lb3V0TXMsXG4gICAgICAgIHJlamVjdFVuYXV0aG9yaXplZDogdGhpcy5yZWplY3RVbmF1dGhvcml6ZWQsXG4gICAgICAgIHJlcXVlc3RBcGk6IEdlblV0aWxzLmlzRmlyZWZveCgpID8gXCJ4aHJcIiA6IFwiZmV0Y2hcIiwgIC8vIGZpcmVmb3ggaXNzdWU6IGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTE0OTEwMTBcbiAgICAgICAgcHJveHlUb1dvcmtlcjogdGhpcy5wcm94eVRvV29ya2VyXG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgLy8gdmFsaWRhdGUgcmVzcG9uc2VcbiAgICAgIE1vbmVyb1JwY0Nvbm5lY3Rpb24udmFsaWRhdGVIdHRwUmVzcG9uc2UocmVzcCk7XG4gICAgICBcbiAgICAgIC8vIGRlc2VyaWFsaXplIHJlc3BvbnNlXG4gICAgICBpZiAocmVzcC5ib2R5WzBdICE9ICd7JykgdGhyb3cgcmVzcC5ib2R5O1xuICAgICAgcmVzcCA9IEpTT04ucGFyc2UocmVzcC5ib2R5LnJlcGxhY2UoLyhcIlteXCJdKlwiXFxzKjpcXHMqKShcXGR7MTYsfSkvZywgJyQxXCIkMlwiJykpOyAgLy8gcmVwbGFjZSAxNiBvciBtb3JlIGRpZ2l0cyB3aXRoIHN0cmluZ3MgYW5kIHBhcnNlXG4gICAgICBpZiAoTGlicmFyeVV0aWxzLmdldExvZ0xldmVsKCkgPj0gMykge1xuICAgICAgICBsZXQgcmVzcFN0ciA9IEpTT04uc3RyaW5naWZ5KHJlc3ApO1xuICAgICAgICBMaWJyYXJ5VXRpbHMubG9nKDMsIFwiUmVjZWl2ZWQgcmVzcG9uc2UgZnJvbSBtZXRob2Q9J1wiICsgbWV0aG9kICsgXCInLCByZXNwb25zZT1cIiArIHJlc3BTdHIuc3Vic3RyaW5nKDAsIE1hdGgubWluKDEwMDAsIHJlc3BTdHIubGVuZ3RoKSkgKyBcIihcIiArIChuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHN0YXJ0VGltZSkgKyBcIiBtcylcIik7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIGNoZWNrIHJwYyByZXNwb25zZSBmb3IgZXJyb3JzXG4gICAgICB0aGlzLnZhbGlkYXRlUnBjUmVzcG9uc2UocmVzcCwgbWV0aG9kLCBwYXJhbXMpO1xuICAgICAgcmV0dXJuIHJlc3A7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvcikgdGhyb3cgZXJyO1xuICAgICAgZWxzZSB0aHJvdyBuZXcgTW9uZXJvUnBjRXJyb3IoZXJyLCBlcnIuc3RhdHVzQ29kZSwgbWV0aG9kLCBwYXJhbXMpO1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIFNlbmQgYSBSUEMgcmVxdWVzdCB0byB0aGUgZ2l2ZW4gcGF0aCBhbmQgd2l0aCB0aGUgZ2l2ZW4gcGFyYW10ZXJzLlxuICAgKiBcbiAgICogRS5nLiBcIi9nZXRfdHJhbnNhY3Rpb25zXCIgd2l0aCBwYXJhbXNcbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gSlNPTiBSUEMgcGF0aCB0byBpbnZva2VcbiAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcyAtIHJlcXVlc3QgcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0ge251bWJlcn0gW3RpbWVvdXRNc10gLSBvdmVycmlkZXMgdGhlIHJlcXVlc3QgdGltZW91dCBpbiBtaWxsaXNlY29uZHNcbiAgICogQHJldHVybiB7b2JqZWN0fSBpcyB0aGUgcmVzcG9uc2UgbWFwXG4gICAqL1xuICBhc3luYyBzZW5kUGF0aFJlcXVlc3QocGF0aCwgcGFyYW1zPywgdGltZW91dE1zPyk6IFByb21pc2U8YW55PiB7XG4gICAgdHJ5IHtcblxuICAgICAgLy8gbG9nZ2luZ1xuICAgICAgaWYgKExpYnJhcnlVdGlscy5nZXRMb2dMZXZlbCgpID49IDIpIExpYnJhcnlVdGlscy5sb2coMiwgXCJTZW5kaW5nIHBhdGggcmVxdWVzdCB3aXRoIHBhdGggJ1wiICsgcGF0aCArIFwiJyBhbmQgcGFyYW1zOiBcIiArIEpTT04uc3RyaW5naWZ5KHBhcmFtcykpO1xuICAgICAgXG4gICAgICAvLyBzZW5kIGh0dHAgcmVxdWVzdFxuICAgICAgbGV0IHN0YXJ0VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCBIdHRwQ2xpZW50LnJlcXVlc3Qoe1xuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICB1cmk6IHRoaXMuZ2V0VXJpKCkgKyAnLycgKyBwYXRoLFxuICAgICAgICB1c2VybmFtZTogdGhpcy5nZXRVc2VybmFtZSgpLFxuICAgICAgICBwYXNzd29yZDogdGhpcy5nZXRQYXNzd29yZCgpLFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShwYXJhbXMpLCAgLy8gYm9keSBpcyBzdHJpbmdpZmllZCBzbyB0ZXh0L3BsYWluIGlzIHJldHVybmVkIHNvIGJpZ2ludHMgYXJlIHByZXNlcnZlZFxuICAgICAgICB0aW1lb3V0OiB0aW1lb3V0TXMgPT09IHVuZGVmaW5lZCA/IHRoaXMudGltZW91dE1zIDogdGltZW91dE1zLFxuICAgICAgICByZWplY3RVbmF1dGhvcml6ZWQ6IHRoaXMucmVqZWN0VW5hdXRob3JpemVkLFxuICAgICAgICByZXF1ZXN0QXBpOiBHZW5VdGlscy5pc0ZpcmVmb3goKSA/IFwieGhyXCIgOiBcImZldGNoXCIsXG4gICAgICAgIHByb3h5VG9Xb3JrZXI6IHRoaXMucHJveHlUb1dvcmtlclxuICAgICAgfSk7XG4gICAgICBcbiAgICAgIC8vIHZhbGlkYXRlIHJlc3BvbnNlXG4gICAgICBNb25lcm9ScGNDb25uZWN0aW9uLnZhbGlkYXRlSHR0cFJlc3BvbnNlKHJlc3ApO1xuICAgICAgXG4gICAgICAvLyBkZXNlcmlhbGl6ZSByZXNwb25zZVxuICAgICAgaWYgKHJlc3AuYm9keVswXSAhPSAneycpIHRocm93IHJlc3AuYm9keTtcbiAgICAgIHJlc3AgPSBKU09OLnBhcnNlKHJlc3AuYm9keS5yZXBsYWNlKC8oXCJbXlwiXSpcIlxccyo6XFxzKikoXFxkezE2LH0pL2csICckMVwiJDJcIicpKTsgIC8vIHJlcGxhY2UgMTYgb3IgbW9yZSBkaWdpdHMgd2l0aCBzdHJpbmdzIGFuZCBwYXJzZVxuICAgICAgaWYgKHR5cGVvZiByZXNwID09PSBcInN0cmluZ1wiKSByZXNwID0gSlNPTi5wYXJzZShyZXNwKTsgIC8vIFRPRE86IHNvbWUgcmVzcG9uc2VzIHJldHVybmVkIGFzIHN0cmluZ3M/XG4gICAgICBpZiAoTGlicmFyeVV0aWxzLmdldExvZ0xldmVsKCkgPj0gMykge1xuICAgICAgICBsZXQgcmVzcFN0ciA9IEpTT04uc3RyaW5naWZ5KHJlc3ApO1xuICAgICAgICBMaWJyYXJ5VXRpbHMubG9nKDMsIFwiUmVjZWl2ZWQgcmVzcG9uc2UgZnJvbSBwYXRoPSdcIiArIHBhdGggKyBcIicsIHJlc3BvbnNlPVwiICsgcmVzcFN0ci5zdWJzdHJpbmcoMCwgTWF0aC5taW4oMTAwMCwgcmVzcFN0ci5sZW5ndGgpKSArIFwiKFwiICsgKG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gc3RhcnRUaW1lKSArIFwiIG1zKVwiKTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgLy8gY2hlY2sgcnBjIHJlc3BvbnNlIGZvciBlcnJvcnNcbiAgICAgIHRoaXMudmFsaWRhdGVScGNSZXNwb25zZShyZXNwLCBwYXRoLCBwYXJhbXMpO1xuICAgICAgcmV0dXJuIHJlc3A7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvcikgdGhyb3cgZXJyO1xuICAgICAgZWxzZSB0aHJvdyBuZXcgTW9uZXJvUnBjRXJyb3IoZXJyLCBlcnIuc3RhdHVzQ29kZSwgcGF0aCwgcGFyYW1zKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZW5kIGEgYmluYXJ5IFJQQyByZXF1ZXN0LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggLSBwYXRoIG9mIHRoZSBiaW5hcnkgUlBDIG1ldGhvZCB0byBpbnZva2VcbiAgICogQHBhcmFtIHtvYmplY3R9IFtwYXJhbXNdIC0gcmVxdWVzdCBwYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbdGltZW91dE1zXSAtIHJlcXVlc3QgdGltZW91dCBpbiBtaWxsaXNlY29uZHNcbiAgICogQHJldHVybiB7VWludDhBcnJheX0gdGhlIGJpbmFyeSByZXNwb25zZVxuICAgKi9cbiAgYXN5bmMgc2VuZEJpbmFyeVJlcXVlc3QocGF0aCwgcGFyYW1zPywgdGltZW91dE1zPyk6IFByb21pc2U8YW55PiB7XG4gICAgXG4gICAgLy8gc2VyaWFsaXplIHBhcmFtc1xuICAgIGxldCBwYXJhbXNCaW4gPSBhd2FpdCBNb25lcm9VdGlscy5qc29uVG9CaW5hcnkocGFyYW1zKTtcbiAgICBcbiAgICB0cnkge1xuXG4gICAgICAvLyBsb2dnaW5nXG4gICAgICBpZiAoTGlicmFyeVV0aWxzLmdldExvZ0xldmVsKCkgPj0gMikgTGlicmFyeVV0aWxzLmxvZygyLCBcIlNlbmRpbmcgYmluYXJ5IHJlcXVlc3Qgd2l0aCBwYXRoICdcIiArIHBhdGggKyBcIicgYW5kIHBhcmFtczogXCIgKyBKU09OLnN0cmluZ2lmeShwYXJhbXMpKTtcbiAgICAgIFxuICAgICAgLy8gc2VuZCBodHRwIHJlcXVlc3RcbiAgICAgIGxldCByZXNwID0gYXdhaXQgSHR0cENsaWVudC5yZXF1ZXN0KHtcbiAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgdXJpOiB0aGlzLmdldFVyaSgpICsgJy8nICsgcGF0aCxcbiAgICAgICAgdXNlcm5hbWU6IHRoaXMuZ2V0VXNlcm5hbWUoKSxcbiAgICAgICAgcGFzc3dvcmQ6IHRoaXMuZ2V0UGFzc3dvcmQoKSxcbiAgICAgICAgYm9keTogcGFyYW1zQmluLFxuICAgICAgICB0aW1lb3V0OiB0aW1lb3V0TXMgPT09IHVuZGVmaW5lZCA/IHRoaXMudGltZW91dE1zIDogdGltZW91dE1zLFxuICAgICAgICByZWplY3RVbmF1dGhvcml6ZWQ6IHRoaXMucmVqZWN0VW5hdXRob3JpemVkLFxuICAgICAgICByZXF1ZXN0QXBpOiBHZW5VdGlscy5pc0ZpcmVmb3goKSA/IFwieGhyXCIgOiBcImZldGNoXCIsXG4gICAgICAgIHByb3h5VG9Xb3JrZXI6IHRoaXMucHJveHlUb1dvcmtlclxuICAgICAgfSk7XG4gICAgICBcbiAgICAgIC8vIHZhbGlkYXRlIHJlc3BvbnNlXG4gICAgICBNb25lcm9ScGNDb25uZWN0aW9uLnZhbGlkYXRlSHR0cFJlc3BvbnNlKHJlc3ApO1xuICAgICAgXG4gICAgICAvLyBwcm9jZXNzIHJlc3BvbnNlXG4gICAgICByZXNwID0gcmVzcC5ib2R5O1xuICAgICAgaWYgKCEocmVzcCBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJyZXNwIGlzIG5vdCB1aW50OGFycmF5XCIpO1xuICAgICAgICBjb25zb2xlLmVycm9yKHJlc3ApO1xuICAgICAgfVxuICAgICAgaWYgKHJlc3AuZXJyb3IpIHRocm93IG5ldyBNb25lcm9ScGNFcnJvcihyZXNwLmVycm9yLm1lc3NhZ2UsIHJlc3AuZXJyb3IuY29kZSwgcGF0aCwgcGFyYW1zKTtcbiAgICAgIHJldHVybiByZXNwO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICBpZiAoZXJyIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IpIHRocm93IGVycjtcbiAgICAgIGVsc2UgdGhyb3cgbmV3IE1vbmVyb1JwY0Vycm9yKGVyciwgZXJyLnN0YXR1c0NvZGUsIHBhdGgsIHBhcmFtcyk7XG4gICAgfVxuICB9XG5cbiAgZ2V0Q29uZmlnKCkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmk6IHRoaXMudXJpLFxuICAgICAgdXNlcm5hbWU6IHRoaXMudXNlcm5hbWUsXG4gICAgICBwYXNzd29yZDogdGhpcy5wYXNzd29yZCxcbiAgICAgIHJlamVjdFVuYXV0aG9yaXplZDogdGhpcy5yZWplY3RVbmF1dGhvcml6ZWQsXG4gICAgICBwcm94eVRvV29ya2VyOiB0aGlzLnByb3h5VG9Xb3JrZXIsXG4gICAgICBwcmlvcml0eTogdGhpcy5wcmlvcml0eSxcbiAgICAgIHRpbWVvdXRNczogdGhpcy50aW1lb3V0TXNcbiAgICB9O1xuICB9XG5cbiAgdG9Kc29uKCkge1xuICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCB0aGlzKTtcbiAgfVxuICBcbiAgdG9TdHJpbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0VXJpKCkgKyBcIiAodXNlcm5hbWU9XCIgKyB0aGlzLmdldFVzZXJuYW1lKCkgKyBcIiwgcGFzc3dvcmQ9XCIgKyAodGhpcy5nZXRQYXNzd29yZCgpID8gXCIqKipcIiA6IHRoaXMuZ2V0UGFzc3dvcmQoKSkgKyBcIiwgcHJpb3JpdHk9XCIgKyB0aGlzLmdldFByaW9yaXR5KCkgKyBcIiB0aW1lb3V0TXM9XCIgKyB0aGlzLmdldFRpbWVvdXQoKSArIFwiLCBpc09ubGluZT1cIiArIHRoaXMuZ2V0SXNPbmxpbmUoKSArIFwiLCBpc0F1dGhlbnRpY2F0ZWQ9XCIgKyB0aGlzLmdldElzQXV0aGVudGljYXRlZCgpICsgXCIpXCI7XG4gIH1cblxuICBzZXRGYWtlRGlzY29ubmVjdGVkKGZha2VEaXNjb25uZWN0ZWQpIHsgLy8gdXNlZCB0byB0ZXN0IGNvbm5lY3Rpb24gbWFuYWdlclxuICAgIHRoaXMuZmFrZURpc2Nvbm5lY3RlZCA9IGZha2VEaXNjb25uZWN0ZWQ7IFxuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUFJJVkFURSBIRUxQRVJTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIHZhbGlkYXRlSHR0cFJlc3BvbnNlKHJlc3ApIHtcbiAgICBsZXQgY29kZSA9IHJlc3Auc3RhdHVzQ29kZTtcbiAgICBpZiAoY29kZSA8IDIwMCB8fCBjb2RlID4gMjk5KSB7XG4gICAgICBsZXQgY29udGVudCA9IHJlc3AuYm9keTtcbiAgICAgIHRocm93IG5ldyBNb25lcm9ScGNFcnJvcihjb2RlICsgXCIgXCIgKyByZXNwLnN0YXR1c1RleHQgKyAoIWNvbnRlbnQgPyBcIlwiIDogKFwiOiBcIiArIGNvbnRlbnQpKSwgY29kZSwgdW5kZWZpbmVkLCB1bmRlZmluZWQpO1xuICAgIH1cbiAgfVxuICBcbiAgcHJvdGVjdGVkIHZhbGlkYXRlUnBjUmVzcG9uc2UocmVzcCwgbWV0aG9kLCBwYXJhbXMpIHtcbiAgICBpZiAocmVzcC5lcnJvciA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG4gICAgbGV0IGVycm9yTXNnID0gcmVzcC5lcnJvci5tZXNzYWdlO1xuICAgIGlmIChlcnJvck1zZyA9PT0gXCJcIikgZXJyb3JNc2cgPSBcIlJlY2VpdmVkIGVycm9yIHJlc3BvbnNlIGZyb20gUlBDIHJlcXVlc3Qgd2l0aCBtZXRob2QgJ1wiICsgbWV0aG9kICsgXCInIHRvIFwiICsgdGhpcy5nZXRVcmkoKTsgLy8gVE9ETyAobW9uZXJvLXByb2plY3QpOiByZXNwb25zZSBzb21ldGltZXMgaGFzIGVtcHR5IGVycm9yIG1lc3NhZ2VcbiAgICB0aHJvdyBuZXcgTW9uZXJvUnBjRXJyb3IocmVzcC5lcnJvci5tZXNzYWdlLCByZXNwLmVycm9yLmNvZGUsIG1ldGhvZCwgcGFyYW1zKTtcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoieUxBQUEsSUFBQUEsU0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMsV0FBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUUsYUFBQSxHQUFBSCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUcsWUFBQSxHQUFBSixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUksZUFBQSxHQUFBTCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUssWUFBQSxHQUFBTixzQkFBQSxDQUFBQyxPQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNlLE1BQU1NLG1CQUFtQixDQUFDOztFQUV2Qzs7Ozs7Ozs7O0VBU0E7Ozs7Ozs7RUFPQTtFQUNBO0VBQ0EsT0FBT0MsY0FBYyxHQUFpQztJQUNwREMsR0FBRyxFQUFFQyxTQUFTO0lBQ2RDLFFBQVEsRUFBRUQsU0FBUztJQUNuQkUsUUFBUSxFQUFFRixTQUFTO0lBQ25CRyxrQkFBa0IsRUFBRSxJQUFJLEVBQUU7SUFDMUJDLGFBQWEsRUFBRSxLQUFLO0lBQ3BCQyxRQUFRLEVBQUUsQ0FBQztJQUNYQyxTQUFTLEVBQUVOO0VBQ2IsQ0FBQzs7RUFFRDtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0VPLFdBQVdBLENBQUNDLGVBQXNELEVBQUVQLFFBQWlCLEVBQUVDLFFBQWlCLEVBQUU7O0lBRXhHO0lBQ0EsSUFBSSxPQUFPTSxlQUFlLEtBQUssUUFBUSxFQUFFO01BQ3ZDQyxNQUFNLENBQUNDLE1BQU0sQ0FBQyxJQUFJLEVBQUViLG1CQUFtQixDQUFDQyxjQUFjLENBQUM7TUFDdkQsSUFBSSxDQUFDQyxHQUFHLEdBQUdTLGVBQWU7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