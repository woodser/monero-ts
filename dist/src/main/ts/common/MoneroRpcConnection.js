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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfR2VuVXRpbHMiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9IdHRwQ2xpZW50IiwiX0xpYnJhcnlVdGlscyIsIl9Nb25lcm9FcnJvciIsIl9Nb25lcm9ScGNFcnJvciIsIl9Nb25lcm9VdGlscyIsIk1vbmVyb1JwY0Nvbm5lY3Rpb24iLCJERUZBVUxUX0NPTkZJRyIsInVyaSIsInVuZGVmaW5lZCIsInVzZXJuYW1lIiwicGFzc3dvcmQiLCJyZWplY3RVbmF1dGhvcml6ZWQiLCJwcm94eVRvV29ya2VyIiwicHJpb3JpdHkiLCJ0aW1lb3V0TXMiLCJjb25zdHJ1Y3RvciIsInVyaU9yQ29ubmVjdGlvbiIsIk9iamVjdCIsImFzc2lnbiIsInNldENyZWRlbnRpYWxzIiwiTW9uZXJvRXJyb3IiLCJHZW5VdGlscyIsIm5vcm1hbGl6ZVVyaSIsImlzT25saW5lIiwiaXNBdXRoZW50aWNhdGVkIiwiZ2V0VXJpIiwiZ2V0VXNlcm5hbWUiLCJnZXRQYXNzd29yZCIsImdldFJlamVjdFVuYXV0aG9yaXplZCIsInNldFByb3h5VG9Xb3JrZXIiLCJnZXRQcm94eVRvV29ya2VyIiwic2V0UHJpb3JpdHkiLCJnZXRQcmlvcml0eSIsInNldFRpbWVvdXQiLCJnZXRUaW1lb3V0Iiwic2V0QXR0cmlidXRlIiwia2V5IiwidmFsdWUiLCJhdHRyaWJ1dGVzIiwiTWFwIiwicHV0IiwiZ2V0QXR0cmlidXRlIiwiZ2V0IiwiY2hlY2tDb25uZWN0aW9uIiwiTGlicmFyeVV0aWxzIiwibG9hZEtleXNNb2R1bGUiLCJpc09ubGluZUJlZm9yZSIsImlzQXV0aGVudGljYXRlZEJlZm9yZSIsInN0YXJ0VGltZSIsIkRhdGUiLCJub3ciLCJmYWtlRGlzY29ubmVjdGVkIiwiRXJyb3IiLCJoZWlnaHRzIiwiaSIsInB1c2giLCJzZW5kQmluYXJ5UmVxdWVzdCIsImVyciIsInJlc3BvbnNlVGltZSIsIk1vbmVyb1JwY0Vycm9yIiwiZ2V0Q29kZSIsImlzQ29ubmVjdGVkIiwiZ2V0SXNPbmxpbmUiLCJnZXRJc0F1dGhlbnRpY2F0ZWQiLCJnZXRSZXNwb25zZVRpbWUiLCJzZW5kSnNvblJlcXVlc3QiLCJtZXRob2QiLCJwYXJhbXMiLCJib2R5IiwiSlNPTiIsInN0cmluZ2lmeSIsImlkIiwianNvbnJwYyIsImdldExvZ0xldmVsIiwibG9nIiwiZ2V0VGltZSIsInJlc3AiLCJIdHRwQ2xpZW50IiwicmVxdWVzdCIsInRpbWVvdXQiLCJ2YWxpZGF0ZUh0dHBSZXNwb25zZSIsInBhcnNlIiwicmVwbGFjZSIsInJlc3BTdHIiLCJzdWJzdHJpbmciLCJNYXRoIiwibWluIiwibGVuZ3RoIiwidmFsaWRhdGVScGNSZXNwb25zZSIsInN0YXR1c0NvZGUiLCJzZW5kUGF0aFJlcXVlc3QiLCJwYXRoIiwicGFyYW1zQmluIiwiTW9uZXJvVXRpbHMiLCJqc29uVG9CaW5hcnkiLCJVaW50OEFycmF5IiwiY29uc29sZSIsImVycm9yIiwibWVzc2FnZSIsImNvZGUiLCJnZXRDb25maWciLCJ0b0pzb24iLCJ0b1N0cmluZyIsInNldEZha2VEaXNjb25uZWN0ZWQiLCJjb250ZW50Iiwic3RhdHVzVGV4dCIsImVycm9yTXNnIiwiZXhwb3J0cyIsImRlZmF1bHQiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy9jb21tb24vTW9uZXJvUnBjQ29ubmVjdGlvbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4vR2VuVXRpbHNcIjtcbmltcG9ydCBIdHRwQ2xpZW50IGZyb20gXCIuL0h0dHBDbGllbnRcIjtcbmltcG9ydCBMaWJyYXJ5VXRpbHMgZnJvbSBcIi4vTGlicmFyeVV0aWxzXCI7XG5pbXBvcnQgTW9uZXJvRXJyb3IgZnJvbSBcIi4vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBNb25lcm9ScGNFcnJvciBmcm9tIFwiLi9Nb25lcm9ScGNFcnJvclwiO1xuaW1wb3J0IE1vbmVyb1V0aWxzIGZyb20gXCIuL01vbmVyb1V0aWxzXCI7XG5cbi8qKlxuICogTWFpbnRhaW5zIGEgY29ubmVjdGlvbiBhbmQgc2VuZHMgcmVxdWVzdHMgdG8gYSBNb25lcm8gUlBDIEFQSS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTW9uZXJvUnBjQ29ubmVjdGlvbiB7XG5cbiAgLy8gcHVibGljIGluc3RhbmNlIHZhcmlhYmxlc1xuICB1cmk6IHN0cmluZztcbiAgdXNlcm5hbWU6IHN0cmluZztcbiAgcGFzc3dvcmQ6IHN0cmluZztcbiAgcmVqZWN0VW5hdXRob3JpemVkOiBib29sZWFuO1xuICBwcm94eVRvV29ya2VyOiBib29sZWFuO1xuICBwcmlvcml0eTogbnVtYmVyO1xuICB0aW1lb3V0TXM6IG51bWJlcjtcblxuICAvLyBwcml2YXRlIGluc3RhbmNlIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgaXNPbmxpbmU6IGJvb2xlYW47XG4gIHByb3RlY3RlZCBpc0F1dGhlbnRpY2F0ZWQ6IGJvb2xlYW47XG4gIHByb3RlY3RlZCBhdHRyaWJ1dGVzOiBhbnk7XG4gIHByb3RlY3RlZCBmYWtlRGlzY29ubmVjdGVkOiBib29sZWFuO1xuICBwcm90ZWN0ZWQgcmVzcG9uc2VUaW1lOiBudW1iZXI7XG5cbiAgLy8gZGVmYXVsdCBjb25maWdcbiAgLyoqIEBwcml2YXRlICovXG4gIHN0YXRpYyBERUZBVUxUX0NPTkZJRzogUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPiA9IHtcbiAgICB1cmk6IHVuZGVmaW5lZCxcbiAgICB1c2VybmFtZTogdW5kZWZpbmVkLFxuICAgIHBhc3N3b3JkOiB1bmRlZmluZWQsXG4gICAgcmVqZWN0VW5hdXRob3JpemVkOiB0cnVlLCAvLyByZWplY3Qgc2VsZi1zaWduZWQgY2VydGlmaWNhdGVzIGlmIHRydWVcbiAgICBwcm94eVRvV29ya2VyOiBmYWxzZSxcbiAgICBwcmlvcml0eTogMCxcbiAgICB0aW1lb3V0TXM6IHVuZGVmaW5lZFxuICB9XG5cbiAgLyoqXG4gICAqIDxwPkNvbnN0cnVjdCBhIFJQQyBjb25uZWN0aW9uLjwvcD5cbiAgICogXG4gICAqIDxwPkV4YW1wbGVzOjwvcD5cbiAgICogXG4gICAqIDxjb2RlPlxuICAgKiBsZXQgY29ubmVjdGlvbjEgPSBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbihcImh0dHA6Ly9sb2NhbGhvc3Q6MzgwODFcIiwgXCJkYWVtb25fdXNlclwiLCBcImRhZW1vbl9wYXNzd29yZF8xMjNcIik8YnI+PGJyPlxuICAgKiBcbiAgICogbGV0IGNvbm5lY3Rpb24yID0gbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24oezxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHVyaTogaHR0cDovL2xvY2FsaG9zdDozODA4MSw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyB1c2VybmFtZTogXCJkYWVtb25fdXNlclwiLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHBhc3N3b3JkOiBcImRhZW1vbl9wYXNzd29yZF8xMjNcIiw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyByZWplY3RVbmF1dGhvcml6ZWQ6IGZhbHNlLCAvLyBhY2NlcHQgc2VsZi1zaWduZWQgY2VydGlmaWNhdGVzIGUuZy4gZm9yIGxvY2FsIGRldmVsb3BtZW50PGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcHJveHlUb1dvcmtlcjogdHJ1ZSAvLyBwcm94eSByZXF1ZXN0IHRvIHdvcmtlciAoZGVmYXVsdCBmYWxzZSk8YnI+XG4gICAqIH0pO1xuICAgKiA8L2NvZGU+XG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ3xQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+fSB1cmlPckNvbm5lY3Rpb24gLSBNb25lcm9ScGNDb25uZWN0aW9uIG9yIFVSSSBvZiB0aGUgUlBDIGVuZHBvaW50XG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1cmlPckNvbm5lY3Rpb24udXJpIC0gVVJJIG9mIHRoZSBSUEMgZW5kcG9pbnRcbiAgICogQHBhcmFtIHtzdHJpbmd9IFt1cmlPckNvbm5lY3Rpb24udXNlcm5hbWVdIC0gdXNlcm5hbWUgdG8gYXV0aGVudGljYXRlIHdpdGggdGhlIFJQQyBlbmRwb2ludCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbdXJpT3JDb25uZWN0aW9uLnBhc3N3b3JkXSAtIHBhc3N3b3JkIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIHRoZSBSUEMgZW5kcG9pbnQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFt1cmlPckNvbm5lY3Rpb24ucmVqZWN0VW5hdXRob3JpemVkXSAtIHJlamVjdHMgc2VsZi1zaWduZWQgY2VydGlmaWNhdGVzIGlmIHRydWUgKGRlZmF1bHQgdHJ1ZSlcbiAgICogQHBhcmFtIHtib29sZWFufSB1cmlPckNvbm5lY3Rpb24ucHJveHlUb1dvcmtlciAtIHByb3h5IHJlcXVlc3RzIHRvIHdvcmtlciAoZGVmYXVsdCB0cnVlKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXNlcm5hbWUgLSB1c2VybmFtZSB0byBhdXRoZW50aWNhdGUgd2l0aCB0aGUgUlBDIGVuZHBvaW50IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhc3N3b3JkIC0gcGFzc3dvcmQgdG8gYXV0aGVudGljYXRlIHdpdGggdGhlIFJQQyBlbmRwb2ludCAob3B0aW9uYWwpXG4gICAqL1xuICBjb25zdHJ1Y3Rvcih1cmlPckNvbm5lY3Rpb246IHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4sIHVzZXJuYW1lPzogc3RyaW5nLCBwYXNzd29yZD86IHN0cmluZykge1xuXG4gICAgLy8gdmFsaWRhdGUgYW5kIG5vcm1hbGl6ZSBjb25maWdcbiAgICBpZiAodHlwZW9mIHVyaU9yQ29ubmVjdGlvbiA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLCBNb25lcm9ScGNDb25uZWN0aW9uLkRFRkFVTFRfQ09ORklHKTtcbiAgICAgIHRoaXMudXJpID0gdXJpT3JDb25uZWN0aW9uO1xuICAgICAgdGhpcy5zZXRDcmVkZW50aWFscyh1c2VybmFtZSwgcGFzc3dvcmQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAodXNlcm5hbWUgIT09IHVuZGVmaW5lZCB8fCBwYXNzd29yZCAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW4gcHJvdmlkZSBjb25maWcgb2JqZWN0IG9yIHBhcmFtcyBidXQgbm90IGJvdGhcIik7XG4gICAgICBPYmplY3QuYXNzaWduKHRoaXMsIE1vbmVyb1JwY0Nvbm5lY3Rpb24uREVGQVVMVF9DT05GSUcsIHVyaU9yQ29ubmVjdGlvbik7XG4gICAgICB0aGlzLnNldENyZWRlbnRpYWxzKHRoaXMudXNlcm5hbWUsIHRoaXMucGFzc3dvcmQpO1xuICAgIH1cbiAgICBcbiAgICAvLyBub3JtYWxpemUgdXJpXG4gICAgaWYgKHRoaXMudXJpKSB0aGlzLnVyaSA9IEdlblV0aWxzLm5vcm1hbGl6ZVVyaSh0aGlzLnVyaSk7XG4gIH1cbiAgXG4gIHNldENyZWRlbnRpYWxzKHVzZXJuYW1lLCBwYXNzd29yZCkge1xuICAgIGlmICh1c2VybmFtZSA9PT0gXCJcIikgdXNlcm5hbWUgPSB1bmRlZmluZWQ7XG4gICAgaWYgKHBhc3N3b3JkID09PSBcIlwiKSBwYXNzd29yZCA9IHVuZGVmaW5lZDtcbiAgICBpZiAodXNlcm5hbWUgfHwgcGFzc3dvcmQpIHtcbiAgICAgIGlmICghdXNlcm5hbWUpIHRocm93IG5ldyBNb25lcm9FcnJvcihcInVzZXJuYW1lIG11c3QgYmUgZGVmaW5lZCBiZWNhdXNlIHBhc3N3b3JkIGlzIGRlZmluZWRcIik7XG4gICAgICBpZiAoIXBhc3N3b3JkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJwYXNzd29yZCBtdXN0IGJlIGRlZmluZWQgYmVjYXVzZSB1c2VybmFtZSBpcyBkZWZpbmVkXCIpO1xuICAgIH1cbiAgICBpZiAodGhpcy51c2VybmFtZSA9PT0gXCJcIikgdGhpcy51c2VybmFtZSA9IHVuZGVmaW5lZDtcbiAgICBpZiAodGhpcy5wYXNzd29yZCA9PT0gXCJcIikgdGhpcy5wYXNzd29yZCA9IHVuZGVmaW5lZDtcbiAgICBpZiAodGhpcy51c2VybmFtZSAhPT0gdXNlcm5hbWUgfHwgdGhpcy5wYXNzd29yZCAhPT0gcGFzc3dvcmQpIHtcbiAgICAgIHRoaXMuaXNPbmxpbmUgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgdGhpcy51c2VybmFtZSA9IHVzZXJuYW1lO1xuICAgIHRoaXMucGFzc3dvcmQgPSBwYXNzd29yZDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgZ2V0VXJpKCkge1xuICAgIHJldHVybiB0aGlzLnVyaTtcbiAgfVxuICBcbiAgZ2V0VXNlcm5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMudXNlcm5hbWUgPyB0aGlzLnVzZXJuYW1lIDogXCJcIjtcbiAgfVxuICBcbiAgZ2V0UGFzc3dvcmQoKSB7XG4gICAgcmV0dXJuIHRoaXMucGFzc3dvcmQgPyB0aGlzLnBhc3N3b3JkIDogXCJcIjtcbiAgfVxuICBcbiAgZ2V0UmVqZWN0VW5hdXRob3JpemVkKCkge1xuICAgIHJldHVybiB0aGlzLnJlamVjdFVuYXV0aG9yaXplZDtcbiAgfVxuICBcbiAgc2V0UHJveHlUb1dvcmtlcihwcm94eVRvV29ya2VyKSB7XG4gICAgdGhpcy5wcm94eVRvV29ya2VyID0gcHJveHlUb1dvcmtlcjtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgZ2V0UHJveHlUb1dvcmtlcigpIHtcbiAgICByZXR1cm4gdGhpcy5wcm94eVRvV29ya2VyO1xuICB9XG4gIFxuICBcbiAgLyoqXG4gICAqIFNldCB0aGUgY29ubmVjdGlvbidzIHByaW9yaXR5IHJlbGF0aXZlIHRvIG90aGVyIGNvbm5lY3Rpb25zLiBQcmlvcml0eSAxIGlzIGhpZ2hlc3QsXG4gICAqIHRoZW4gcHJpb3JpdHkgMiwgZXRjLiBUaGUgZGVmYXVsdCBwcmlvcml0eSBvZiAwIGlzIGxvd2VzdCBwcmlvcml0eS5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcHJpb3JpdHldIC0gdGhlIGNvbm5lY3Rpb24gcHJpb3JpdHkgKGRlZmF1bHQgMClcbiAgICogQHJldHVybiB7TW9uZXJvUnBjQ29ubmVjdGlvbn0gdGhpcyBjb25uZWN0aW9uXG4gICAqL1xuICBzZXRQcmlvcml0eShwcmlvcml0eSkge1xuICAgIGlmICghKHByaW9yaXR5ID49IDApKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJQcmlvcml0eSBtdXN0IGJlID49IDBcIik7XG4gICAgdGhpcy5wcmlvcml0eSA9IHByaW9yaXR5O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZ2V0UHJpb3JpdHkoKSB7XG4gICAgcmV0dXJuIHRoaXMucHJpb3JpdHk7IFxuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgUlBDIHJlcXVlc3QgdGltZW91dCBpbiBtaWxsaXNlY29uZHMuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gdGltZW91dE1zIGlzIHRoZSB0aW1lb3V0IGluIG1pbGxpc2Vjb25kcywgMCB0byBkaXNhYmxlIHRpbWVvdXQsIG9yIHVuZGVmaW5lZCB0byB1c2UgZGVmYXVsdFxuICAgKiBAcmV0dXJuIHtNb25lcm9ScGNDb25uZWN0aW9ufSB0aGlzIGNvbm5lY3Rpb25cbiAgICovXG4gIHNldFRpbWVvdXQodGltZW91dE1zOiBudW1iZXIpIHtcbiAgICB0aGlzLnRpbWVvdXRNcyA9IHRpbWVvdXRNcztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldFRpbWVvdXQoKSB7XG4gICAgcmV0dXJuIHRoaXMudGltZW91dE1zO1xuICB9XG4gIFxuICBzZXRBdHRyaWJ1dGUoa2V5LCB2YWx1ZSkge1xuICAgIGlmICghdGhpcy5hdHRyaWJ1dGVzKSB0aGlzLmF0dHJpYnV0ZXMgPSBuZXcgTWFwKCk7XG4gICAgdGhpcy5hdHRyaWJ1dGVzLnB1dChrZXksIHZhbHVlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgZ2V0QXR0cmlidXRlKGtleSkge1xuICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXMuZ2V0KGtleSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDaGVjayB0aGUgY29ubmVjdGlvbiBzdGF0dXMgdG8gdXBkYXRlIGlzT25saW5lLCBpc0F1dGhlbnRpY2F0ZWQsIGFuZCByZXNwb25zZSB0aW1lLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IHRpbWVvdXRNcyAtIG1heGltdW0gcmVzcG9uc2UgdGltZSBiZWZvcmUgY29uc2lkZXJlZCBvZmZsaW5lXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgdGhlcmUgaXMgYSBjaGFuZ2UgaW4gc3RhdHVzLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGNoZWNrQ29ubmVjdGlvbih0aW1lb3V0TXMpIHtcbiAgICBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZEtleXNNb2R1bGUoKTsgLy8gY2FjaGUgd2FzbSBmb3IgYmluYXJ5IHJlcXVlc3RcbiAgICBsZXQgaXNPbmxpbmVCZWZvcmUgPSB0aGlzLmlzT25saW5lO1xuICAgIGxldCBpc0F1dGhlbnRpY2F0ZWRCZWZvcmUgPSB0aGlzLmlzQXV0aGVudGljYXRlZDtcbiAgICBsZXQgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICB0cnkge1xuICAgICAgaWYgKHRoaXMuZmFrZURpc2Nvbm5lY3RlZCkgdGhyb3cgbmV3IEVycm9yKFwiQ29ubmVjdGlvbiBpcyBmYWtlIGRpc2Nvbm5lY3RlZFwiKTtcbiAgICAgIGxldCBoZWlnaHRzID0gW107XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDEwMDsgaSsrKSBoZWlnaHRzLnB1c2goaSk7XG4gICAgICBhd2FpdCB0aGlzLnNlbmRCaW5hcnlSZXF1ZXN0KFwiZ2V0X2Jsb2Nrc19ieV9oZWlnaHQuYmluXCIsIHtoZWlnaHRzOiBoZWlnaHRzfSwgdGltZW91dE1zKTsgLy8gYXNzdW1lIGRhZW1vbiBjb25uZWN0aW9uXG4gICAgICB0aGlzLmlzT25saW5lID0gdHJ1ZTtcbiAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gdHJ1ZTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHRoaXMuaXNPbmxpbmUgPSBmYWxzZTtcbiAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5yZXNwb25zZVRpbWUgPSB1bmRlZmluZWQ7XG4gICAgICBpZiAoZXJyIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IpIHtcbiAgICAgICAgaWYgKGVyci5nZXRDb2RlKCkgPT09IDQwMSkge1xuICAgICAgICAgIHRoaXMuaXNPbmxpbmUgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSBpZiAoZXJyLmdldENvZGUoKSA9PT0gNDA0KSB7IC8vIGZhbGxiYWNrIHRvIGxhdGVuY3kgY2hlY2tcbiAgICAgICAgICB0aGlzLmlzT25saW5lID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRoaXMuaXNPbmxpbmUpIHRoaXMucmVzcG9uc2VUaW1lID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcbiAgICByZXR1cm4gaXNPbmxpbmVCZWZvcmUgIT09IHRoaXMuaXNPbmxpbmUgfHwgaXNBdXRoZW50aWNhdGVkQmVmb3JlICE9PSB0aGlzLmlzQXV0aGVudGljYXRlZDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgY29ubmVjdGlvbiBpcyBjb25uZWN0ZWQgYWNjb3JkaW5nIHRvIHRoZSBsYXN0IGNhbGwgdG8gY2hlY2tDb25uZWN0aW9uKCkuPGJyPjxicj5cbiAgICogXG4gICAqIE5vdGU6IG11c3QgY2FsbCBjaGVja0Nvbm5lY3Rpb24oKSBtYW51YWxseSB1bmxlc3MgdXNpbmcgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIG9yIGZhbHNlIHRvIGluZGljYXRlIGlmIGNvbm5lY3RlZCwgb3IgdW5kZWZpbmVkIGlmIGNoZWNrQ29ubmVjdGlvbigpIGhhcyBub3QgYmVlbiBjYWxsZWRcbiAgICovXG4gIGlzQ29ubmVjdGVkKCkge1xuICAgIHJldHVybiB0aGlzLmlzT25saW5lID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB0aGlzLmlzT25saW5lICYmIHRoaXMuaXNBdXRoZW50aWNhdGVkICE9PSBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGNvbm5lY3Rpb24gaXMgb25saW5lIGFjY29yZGluZyB0byB0aGUgbGFzdCBjYWxsIHRvIGNoZWNrQ29ubmVjdGlvbigpLjxicj48YnI+XG4gICAqIFxuICAgKiBOb3RlOiBtdXN0IGNhbGwgY2hlY2tDb25uZWN0aW9uKCkgbWFudWFsbHkgdW5sZXNzIHVzaW5nIE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyLlxuICAgKiBcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBvciBmYWxzZSB0byBpbmRpY2F0ZSBpZiBvbmxpbmUsIG9yIHVuZGVmaW5lZCBpZiBjaGVja0Nvbm5lY3Rpb24oKSBoYXMgbm90IGJlZW4gY2FsbGVkXG4gICAqL1xuICBnZXRJc09ubGluZSgpIHtcbiAgICByZXR1cm4gdGhpcy5pc09ubGluZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGNvbm5lY3Rpb24gaXMgYXV0aGVudGljYXRlZCBhY2NvcmRpbmcgdG8gdGhlIGxhc3QgY2FsbCB0byBjaGVja0Nvbm5lY3Rpb24oKS48YnI+PGJyPlxuICAgKiBcbiAgICogTm90ZTogbXVzdCBjYWxsIGNoZWNrQ29ubmVjdGlvbigpIG1hbnVhbGx5IHVubGVzcyB1c2luZyBNb25lcm9Db25uZWN0aW9uTWFuYWdlci5cbiAgICogXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgYXV0aGVudGljYXRlZCBvciBubyBhdXRoZW50aWNhdGlvbiwgZmFsc2UgaWYgbm90IGF1dGhlbnRpY2F0ZWQsIG9yIHVuZGVmaW5lZCBpZiBjaGVja0Nvbm5lY3Rpb24oKSBoYXMgbm90IGJlZW4gY2FsbGVkXG4gICAqL1xuICBnZXRJc0F1dGhlbnRpY2F0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNBdXRoZW50aWNhdGVkO1xuICB9XG5cbiAgZ2V0UmVzcG9uc2VUaW1lKCkge1xuICAgIHJldHVybiB0aGlzLnJlc3BvbnNlVGltZTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNlbmQgYSBKU09OIFJQQyByZXF1ZXN0LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1ldGhvZCAtIEpTT04gUlBDIG1ldGhvZCB0byBpbnZva2VcbiAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcyAtIHJlcXVlc3QgcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0ge251bWJlcn0gW3RpbWVvdXRNc10gLSBvdmVycmlkZXMgdGhlIHJlcXVlc3QgdGltZW91dCBpbiBtaWxsaXNlY29uZHNcbiAgICogQHJldHVybiB7b2JqZWN0fSBpcyB0aGUgcmVzcG9uc2UgbWFwXG4gICAqL1xuICBhc3luYyBzZW5kSnNvblJlcXVlc3QobWV0aG9kLCBwYXJhbXM/LCB0aW1lb3V0TXM/KTogUHJvbWlzZTxhbnk+IHtcbiAgICB0cnkge1xuICAgICAgXG4gICAgICAvLyBidWlsZCByZXF1ZXN0IGJvZHlcbiAgICAgIGxldCBib2R5ID0gSlNPTi5zdHJpbmdpZnkoeyAgLy8gYm9keSBpcyBzdHJpbmdpZmllZCBzbyB0ZXh0L3BsYWluIGlzIHJldHVybmVkIHNvIGJpZ2ludHMgYXJlIHByZXNlcnZlZFxuICAgICAgICBpZDogXCIwXCIsXG4gICAgICAgIGpzb25ycGM6IFwiMi4wXCIsXG4gICAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgICBwYXJhbXM6IHBhcmFtc1xuICAgICAgfSk7XG5cbiAgICAgIC8vIGxvZ2dpbmdcbiAgICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0TG9nTGV2ZWwoKSA+PSAyKSBMaWJyYXJ5VXRpbHMubG9nKDIsIFwiU2VuZGluZyBqc29uIHJlcXVlc3Qgd2l0aCBtZXRob2QgJ1wiICsgbWV0aG9kICsgXCInIGFuZCBib2R5OiBcIiArIGJvZHkpO1xuICAgICAgXG4gICAgICAvLyBzZW5kIGh0dHAgcmVxdWVzdFxuICAgICAgbGV0IHN0YXJ0VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCBIdHRwQ2xpZW50LnJlcXVlc3Qoe1xuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICB1cmk6IHRoaXMuZ2V0VXJpKCkgKyAnL2pzb25fcnBjJyxcbiAgICAgICAgdXNlcm5hbWU6IHRoaXMuZ2V0VXNlcm5hbWUoKSxcbiAgICAgICAgcGFzc3dvcmQ6IHRoaXMuZ2V0UGFzc3dvcmQoKSxcbiAgICAgICAgYm9keTogYm9keSxcbiAgICAgICAgdGltZW91dDogdGltZW91dE1zID09PSB1bmRlZmluZWQgPyB0aGlzLnRpbWVvdXRNcyA6IHRpbWVvdXRNcyxcbiAgICAgICAgcmVqZWN0VW5hdXRob3JpemVkOiB0aGlzLnJlamVjdFVuYXV0aG9yaXplZCxcbiAgICAgICAgcHJveHlUb1dvcmtlcjogdGhpcy5wcm94eVRvV29ya2VyXG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgLy8gdmFsaWRhdGUgcmVzcG9uc2VcbiAgICAgIE1vbmVyb1JwY0Nvbm5lY3Rpb24udmFsaWRhdGVIdHRwUmVzcG9uc2UocmVzcCk7XG4gICAgICBcbiAgICAgIC8vIGRlc2VyaWFsaXplIHJlc3BvbnNlXG4gICAgICBpZiAocmVzcC5ib2R5WzBdICE9ICd7JykgdGhyb3cgcmVzcC5ib2R5O1xuICAgICAgcmVzcCA9IEpTT04ucGFyc2UocmVzcC5ib2R5LnJlcGxhY2UoLyhcIlteXCJdKlwiXFxzKjpcXHMqKShcXGR7MTYsfSkvZywgJyQxXCIkMlwiJykpOyAgLy8gcmVwbGFjZSAxNiBvciBtb3JlIGRpZ2l0cyB3aXRoIHN0cmluZ3MgYW5kIHBhcnNlXG4gICAgICBpZiAoTGlicmFyeVV0aWxzLmdldExvZ0xldmVsKCkgPj0gMykge1xuICAgICAgICBsZXQgcmVzcFN0ciA9IEpTT04uc3RyaW5naWZ5KHJlc3ApO1xuICAgICAgICBMaWJyYXJ5VXRpbHMubG9nKDMsIFwiUmVjZWl2ZWQgcmVzcG9uc2UgZnJvbSBtZXRob2Q9J1wiICsgbWV0aG9kICsgXCInLCByZXNwb25zZT1cIiArIHJlc3BTdHIuc3Vic3RyaW5nKDAsIE1hdGgubWluKDEwMDAsIHJlc3BTdHIubGVuZ3RoKSkgKyBcIihcIiArIChuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHN0YXJ0VGltZSkgKyBcIiBtcylcIik7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIGNoZWNrIHJwYyByZXNwb25zZSBmb3IgZXJyb3JzXG4gICAgICB0aGlzLnZhbGlkYXRlUnBjUmVzcG9uc2UocmVzcCwgbWV0aG9kLCBwYXJhbXMpO1xuICAgICAgcmV0dXJuIHJlc3A7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvcikgdGhyb3cgZXJyO1xuICAgICAgZWxzZSB0aHJvdyBuZXcgTW9uZXJvUnBjRXJyb3IoZXJyLCBlcnIuc3RhdHVzQ29kZSwgbWV0aG9kLCBwYXJhbXMpO1xuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIFNlbmQgYSBSUEMgcmVxdWVzdCB0byB0aGUgZ2l2ZW4gcGF0aCBhbmQgd2l0aCB0aGUgZ2l2ZW4gcGFyYW10ZXJzLlxuICAgKiBcbiAgICogRS5nLiBcIi9nZXRfdHJhbnNhY3Rpb25zXCIgd2l0aCBwYXJhbXNcbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gSlNPTiBSUEMgcGF0aCB0byBpbnZva2VcbiAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcyAtIHJlcXVlc3QgcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0ge251bWJlcn0gW3RpbWVvdXRNc10gLSBvdmVycmlkZXMgdGhlIHJlcXVlc3QgdGltZW91dCBpbiBtaWxsaXNlY29uZHNcbiAgICogQHJldHVybiB7b2JqZWN0fSBpcyB0aGUgcmVzcG9uc2UgbWFwXG4gICAqL1xuICBhc3luYyBzZW5kUGF0aFJlcXVlc3QocGF0aCwgcGFyYW1zPywgdGltZW91dE1zPyk6IFByb21pc2U8YW55PiB7XG4gICAgdHJ5IHtcblxuICAgICAgLy8gbG9nZ2luZ1xuICAgICAgaWYgKExpYnJhcnlVdGlscy5nZXRMb2dMZXZlbCgpID49IDIpIExpYnJhcnlVdGlscy5sb2coMiwgXCJTZW5kaW5nIHBhdGggcmVxdWVzdCB3aXRoIHBhdGggJ1wiICsgcGF0aCArIFwiJyBhbmQgcGFyYW1zOiBcIiArIEpTT04uc3RyaW5naWZ5KHBhcmFtcykpO1xuICAgICAgXG4gICAgICAvLyBzZW5kIGh0dHAgcmVxdWVzdFxuICAgICAgbGV0IHN0YXJ0VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgbGV0IHJlc3AgPSBhd2FpdCBIdHRwQ2xpZW50LnJlcXVlc3Qoe1xuICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICB1cmk6IHRoaXMuZ2V0VXJpKCkgKyAnLycgKyBwYXRoLFxuICAgICAgICB1c2VybmFtZTogdGhpcy5nZXRVc2VybmFtZSgpLFxuICAgICAgICBwYXNzd29yZDogdGhpcy5nZXRQYXNzd29yZCgpLFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShwYXJhbXMpLCAgLy8gYm9keSBpcyBzdHJpbmdpZmllZCBzbyB0ZXh0L3BsYWluIGlzIHJldHVybmVkIHNvIGJpZ2ludHMgYXJlIHByZXNlcnZlZFxuICAgICAgICB0aW1lb3V0OiB0aW1lb3V0TXMgPT09IHVuZGVmaW5lZCA/IHRoaXMudGltZW91dE1zIDogdGltZW91dE1zLFxuICAgICAgICByZWplY3RVbmF1dGhvcml6ZWQ6IHRoaXMucmVqZWN0VW5hdXRob3JpemVkLFxuICAgICAgICBwcm94eVRvV29ya2VyOiB0aGlzLnByb3h5VG9Xb3JrZXJcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICAvLyB2YWxpZGF0ZSByZXNwb25zZVxuICAgICAgTW9uZXJvUnBjQ29ubmVjdGlvbi52YWxpZGF0ZUh0dHBSZXNwb25zZShyZXNwKTtcbiAgICAgIFxuICAgICAgLy8gZGVzZXJpYWxpemUgcmVzcG9uc2VcbiAgICAgIGlmIChyZXNwLmJvZHlbMF0gIT0gJ3snKSB0aHJvdyByZXNwLmJvZHk7XG4gICAgICByZXNwID0gSlNPTi5wYXJzZShyZXNwLmJvZHkucmVwbGFjZSgvKFwiW15cIl0qXCJcXHMqOlxccyopKFxcZHsxNix9KS9nLCAnJDFcIiQyXCInKSk7ICAvLyByZXBsYWNlIDE2IG9yIG1vcmUgZGlnaXRzIHdpdGggc3RyaW5ncyBhbmQgcGFyc2VcbiAgICAgIGlmICh0eXBlb2YgcmVzcCA9PT0gXCJzdHJpbmdcIikgcmVzcCA9IEpTT04ucGFyc2UocmVzcCk7ICAvLyBUT0RPOiBzb21lIHJlc3BvbnNlcyByZXR1cm5lZCBhcyBzdHJpbmdzP1xuICAgICAgaWYgKExpYnJhcnlVdGlscy5nZXRMb2dMZXZlbCgpID49IDMpIHtcbiAgICAgICAgbGV0IHJlc3BTdHIgPSBKU09OLnN0cmluZ2lmeShyZXNwKTtcbiAgICAgICAgTGlicmFyeVV0aWxzLmxvZygzLCBcIlJlY2VpdmVkIHJlc3BvbnNlIGZyb20gcGF0aD0nXCIgKyBwYXRoICsgXCInLCByZXNwb25zZT1cIiArIHJlc3BTdHIuc3Vic3RyaW5nKDAsIE1hdGgubWluKDEwMDAsIHJlc3BTdHIubGVuZ3RoKSkgKyBcIihcIiArIChuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHN0YXJ0VGltZSkgKyBcIiBtcylcIik7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIGNoZWNrIHJwYyByZXNwb25zZSBmb3IgZXJyb3JzXG4gICAgICB0aGlzLnZhbGlkYXRlUnBjUmVzcG9uc2UocmVzcCwgcGF0aCwgcGFyYW1zKTtcbiAgICAgIHJldHVybiByZXNwO1xuICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICBpZiAoZXJyIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IpIHRocm93IGVycjtcbiAgICAgIGVsc2UgdGhyb3cgbmV3IE1vbmVyb1JwY0Vycm9yKGVyciwgZXJyLnN0YXR1c0NvZGUsIHBhdGgsIHBhcmFtcyk7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogU2VuZCBhIGJpbmFyeSBSUEMgcmVxdWVzdC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gcGF0aCBvZiB0aGUgYmluYXJ5IFJQQyBtZXRob2QgdG8gaW52b2tlXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBbcGFyYW1zXSAtIHJlcXVlc3QgcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0ge251bWJlcn0gW3RpbWVvdXRNc10gLSByZXF1ZXN0IHRpbWVvdXQgaW4gbWlsbGlzZWNvbmRzXG4gICAqIEByZXR1cm4ge1VpbnQ4QXJyYXl9IHRoZSBiaW5hcnkgcmVzcG9uc2VcbiAgICovXG4gIGFzeW5jIHNlbmRCaW5hcnlSZXF1ZXN0KHBhdGgsIHBhcmFtcz8sIHRpbWVvdXRNcz8pOiBQcm9taXNlPGFueT4ge1xuICAgIFxuICAgIC8vIHNlcmlhbGl6ZSBwYXJhbXNcbiAgICBsZXQgcGFyYW1zQmluID0gYXdhaXQgTW9uZXJvVXRpbHMuanNvblRvQmluYXJ5KHBhcmFtcyk7XG4gICAgXG4gICAgdHJ5IHtcblxuICAgICAgLy8gbG9nZ2luZ1xuICAgICAgaWYgKExpYnJhcnlVdGlscy5nZXRMb2dMZXZlbCgpID49IDIpIExpYnJhcnlVdGlscy5sb2coMiwgXCJTZW5kaW5nIGJpbmFyeSByZXF1ZXN0IHdpdGggcGF0aCAnXCIgKyBwYXRoICsgXCInIGFuZCBwYXJhbXM6IFwiICsgSlNPTi5zdHJpbmdpZnkocGFyYW1zKSk7XG4gICAgICBcbiAgICAgIC8vIHNlbmQgaHR0cCByZXF1ZXN0XG4gICAgICBsZXQgcmVzcCA9IGF3YWl0IEh0dHBDbGllbnQucmVxdWVzdCh7XG4gICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgIHVyaTogdGhpcy5nZXRVcmkoKSArICcvJyArIHBhdGgsXG4gICAgICAgIHVzZXJuYW1lOiB0aGlzLmdldFVzZXJuYW1lKCksXG4gICAgICAgIHBhc3N3b3JkOiB0aGlzLmdldFBhc3N3b3JkKCksXG4gICAgICAgIGJvZHk6IHBhcmFtc0JpbixcbiAgICAgICAgdGltZW91dDogdGltZW91dE1zID09PSB1bmRlZmluZWQgPyB0aGlzLnRpbWVvdXRNcyA6IHRpbWVvdXRNcyxcbiAgICAgICAgcmVqZWN0VW5hdXRob3JpemVkOiB0aGlzLnJlamVjdFVuYXV0aG9yaXplZCxcbiAgICAgICAgcHJveHlUb1dvcmtlcjogdGhpcy5wcm94eVRvV29ya2VyXG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgLy8gdmFsaWRhdGUgcmVzcG9uc2VcbiAgICAgIE1vbmVyb1JwY0Nvbm5lY3Rpb24udmFsaWRhdGVIdHRwUmVzcG9uc2UocmVzcCk7XG4gICAgICBcbiAgICAgIC8vIHByb2Nlc3MgcmVzcG9uc2VcbiAgICAgIHJlc3AgPSByZXNwLmJvZHk7XG4gICAgICBpZiAoIShyZXNwIGluc3RhbmNlb2YgVWludDhBcnJheSkpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcInJlc3AgaXMgbm90IHVpbnQ4YXJyYXlcIik7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IocmVzcCk7XG4gICAgICB9XG4gICAgICBpZiAocmVzcC5lcnJvcikgdGhyb3cgbmV3IE1vbmVyb1JwY0Vycm9yKHJlc3AuZXJyb3IubWVzc2FnZSwgcmVzcC5lcnJvci5jb2RlLCBwYXRoLCBwYXJhbXMpO1xuICAgICAgcmV0dXJuIHJlc3A7XG4gICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvcikgdGhyb3cgZXJyO1xuICAgICAgZWxzZSB0aHJvdyBuZXcgTW9uZXJvUnBjRXJyb3IoZXJyLCBlcnIuc3RhdHVzQ29kZSwgcGF0aCwgcGFyYW1zKTtcbiAgICB9XG4gIH1cblxuICBnZXRDb25maWcoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHVyaTogdGhpcy51cmksXG4gICAgICB1c2VybmFtZTogdGhpcy51c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkOiB0aGlzLnBhc3N3b3JkLFxuICAgICAgcmVqZWN0VW5hdXRob3JpemVkOiB0aGlzLnJlamVjdFVuYXV0aG9yaXplZCxcbiAgICAgIHByb3h5VG9Xb3JrZXI6IHRoaXMucHJveHlUb1dvcmtlcixcbiAgICAgIHByaW9yaXR5OiB0aGlzLnByaW9yaXR5LFxuICAgICAgdGltZW91dE1zOiB0aGlzLnRpbWVvdXRNc1xuICAgIH07XG4gIH1cblxuICB0b0pzb24oKSB7XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIHRoaXMpO1xuICB9XG4gIFxuICB0b1N0cmluZygpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRVcmkoKSArIFwiICh1c2VybmFtZT1cIiArIHRoaXMuZ2V0VXNlcm5hbWUoKSArIFwiLCBwYXNzd29yZD1cIiArICh0aGlzLmdldFBhc3N3b3JkKCkgPyBcIioqKlwiIDogdGhpcy5nZXRQYXNzd29yZCgpKSArIFwiLCBwcmlvcml0eT1cIiArIHRoaXMuZ2V0UHJpb3JpdHkoKSArIFwiIHRpbWVvdXRNcz1cIiArIHRoaXMuZ2V0VGltZW91dCgpICsgXCIsIGlzT25saW5lPVwiICsgdGhpcy5nZXRJc09ubGluZSgpICsgXCIsIGlzQXV0aGVudGljYXRlZD1cIiArIHRoaXMuZ2V0SXNBdXRoZW50aWNhdGVkKCkgKyBcIilcIjtcbiAgfVxuXG4gIHNldEZha2VEaXNjb25uZWN0ZWQoZmFrZURpc2Nvbm5lY3RlZCkgeyAvLyB1c2VkIHRvIHRlc3QgY29ubmVjdGlvbiBtYW5hZ2VyXG4gICAgdGhpcy5mYWtlRGlzY29ubmVjdGVkID0gZmFrZURpc2Nvbm5lY3RlZDsgXG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIEhFTFBFUlMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgdmFsaWRhdGVIdHRwUmVzcG9uc2UocmVzcCkge1xuICAgIGxldCBjb2RlID0gcmVzcC5zdGF0dXNDb2RlO1xuICAgIGlmIChjb2RlIDwgMjAwIHx8IGNvZGUgPiAyOTkpIHtcbiAgICAgIGxldCBjb250ZW50ID0gcmVzcC5ib2R5O1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb1JwY0Vycm9yKGNvZGUgKyBcIiBcIiArIHJlc3Auc3RhdHVzVGV4dCArICghY29udGVudCA/IFwiXCIgOiAoXCI6IFwiICsgY29udGVudCkpLCBjb2RlLCB1bmRlZmluZWQsIHVuZGVmaW5lZCk7XG4gICAgfVxuICB9XG4gIFxuICBwcm90ZWN0ZWQgdmFsaWRhdGVScGNSZXNwb25zZShyZXNwLCBtZXRob2QsIHBhcmFtcykge1xuICAgIGlmIChyZXNwLmVycm9yID09PSB1bmRlZmluZWQpIHJldHVybjtcbiAgICBsZXQgZXJyb3JNc2cgPSByZXNwLmVycm9yLm1lc3NhZ2U7XG4gICAgaWYgKGVycm9yTXNnID09PSBcIlwiKSBlcnJvck1zZyA9IFwiUmVjZWl2ZWQgZXJyb3IgcmVzcG9uc2UgZnJvbSBSUEMgcmVxdWVzdCB3aXRoIG1ldGhvZCAnXCIgKyBtZXRob2QgKyBcIicgdG8gXCIgKyB0aGlzLmdldFVyaSgpOyAvLyBUT0RPIChtb25lcm8tcHJvamVjdCk6IHJlc3BvbnNlIHNvbWV0aW1lcyBoYXMgZW1wdHkgZXJyb3IgbWVzc2FnZVxuICAgIHRocm93IG5ldyBNb25lcm9ScGNFcnJvcihyZXNwLmVycm9yLm1lc3NhZ2UsIHJlc3AuZXJyb3IuY29kZSwgbWV0aG9kLCBwYXJhbXMpO1xuICB9XG59XG4iXSwibWFwcGluZ3MiOiJ5TEFBQSxJQUFBQSxTQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxXQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxhQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRyxZQUFBLEdBQUFKLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSSxlQUFBLEdBQUFMLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSyxZQUFBLEdB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