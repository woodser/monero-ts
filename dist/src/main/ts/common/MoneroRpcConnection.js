"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _GenUtils = _interopRequireDefault(require("./GenUtils"));
var _HttpClient = _interopRequireDefault(require("./HttpClient"));
var _LibraryUtils = _interopRequireDefault(require("./LibraryUtils"));
var _MoneroError = _interopRequireDefault(require("./MoneroError"));
var _MoneroRpcError = _interopRequireDefault(require("./MoneroRpcError"));
var _MoneroUtils = _interopRequireDefault(require("./MoneroUtils"));
var _ThreadPool = _interopRequireDefault(require("./ThreadPool"));

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
    zmqUri: undefined,
    proxyUri: undefined,
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
   * @param {string} [uriOrConnection.zmqUri] - URI of the ZMQ endpoint (optional)
   * @param {string} [uriOrConnection.proxyUri] - URI of a proxy server to route requests through (optional)
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

    // normalize uris
    if (this.uri) this.uri = _GenUtils.default.normalizeUri(this.uri);
    if (this.zmqUri) this.zmqUri = _GenUtils.default.normalizeUri(this.zmqUri);
    if (this.proxyUri) this.proxyUri = _GenUtils.default.normalizeUri(this.proxyUri);

    // initialize mutexes
    this.checkConnectionMutex = new _ThreadPool.default(1);
    this.sendRequestMutex = new _ThreadPool.default(1);
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

  getZmqUri() {
    return this.zmqUri;
  }

  setZmqUri(zmqUri) {
    this.zmqUri = zmqUri;
    return this;
  }

  getProxyUri() {
    return this.proxyUri;
  }

  setProxyUri(proxyUri) {
    this.proxyUri = proxyUri;
    return this;
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
    return this.queueCheckConnection(async () => {
      await _LibraryUtils.default.loadWasmModule(); // cache wasm for binary request
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
    });
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
    return this.queueSendRequest(async () => {
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

        // proxy uri is not supported
        if (this.getProxyUri()) throw new _MoneroError.default("Proxy URI not supported for JSON requests");

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
    });
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
    return this.queueSendRequest(async () => {
      try {

        // logging
        if (_LibraryUtils.default.getLogLevel() >= 2) _LibraryUtils.default.log(2, "Sending path request with path '" + path + "' and params: " + JSON.stringify(params));

        // proxy uri is not supported
        if (this.getProxyUri()) throw new _MoneroError.default("Proxy URI not supported for path requests");

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
    });
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
    return this.queueSendRequest(async () => {

      // serialize params
      let paramsBin = await _MoneroUtils.default.jsonToBinary(params);

      try {

        // logging
        if (_LibraryUtils.default.getLogLevel() >= 2) _LibraryUtils.default.log(2, "Sending binary request with path '" + path + "' and params: " + JSON.stringify(params));

        // proxy uri is not supported
        if (this.getProxyUri()) throw new _MoneroError.default("Proxy URI not supported for binary requests");

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
    });
  }

  getConfig() {
    return {
      uri: this.uri,
      username: this.username,
      password: this.password,
      zmqUri: this.zmqUri,
      proxyUri: this.proxyUri,
      rejectUnauthorized: this.rejectUnauthorized,
      proxyToWorker: this.proxyToWorker,
      priority: this.priority,
      timeoutMs: this.timeoutMs
    };
  }

  toJson() {
    let json = Object.assign({}, this);
    json.checkConnectionMutex = undefined;
    json.sendRequestMutex = undefined;
    return json;
  }

  toString() {
    return this.getUri() + " (username=" + this.getUsername() + ", password=" + (this.getPassword() ? "***" : this.getPassword()) + ", zmqUri=" + this.getZmqUri() + ", proxyUri=" + this.getProxyUri() + ", priority=" + this.getPriority() + ", timeoutMs=" + this.getTimeout() + ", isOnline=" + this.getIsOnline() + ", isAuthenticated=" + this.getIsAuthenticated() + ")";
  }

  setFakeDisconnected(fakeDisconnected) {// used to test connection manager
    this.fakeDisconnected = fakeDisconnected;
  }

  // ------------------------------ PRIVATE HELPERS --------------------------

  async queueCheckConnection(asyncFn) {
    return this.checkConnectionMutex.submit(asyncFn);
  }

  async queueSendRequest(asyncFn) {
    return this.sendRequestMutex.submit(asyncFn);
  }

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfR2VuVXRpbHMiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9IdHRwQ2xpZW50IiwiX0xpYnJhcnlVdGlscyIsIl9Nb25lcm9FcnJvciIsIl9Nb25lcm9ScGNFcnJvciIsIl9Nb25lcm9VdGlscyIsIl9UaHJlYWRQb29sIiwiTW9uZXJvUnBjQ29ubmVjdGlvbiIsIkRFRkFVTFRfQ09ORklHIiwidXJpIiwidW5kZWZpbmVkIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsInptcVVyaSIsInByb3h5VXJpIiwicmVqZWN0VW5hdXRob3JpemVkIiwicHJveHlUb1dvcmtlciIsInByaW9yaXR5IiwidGltZW91dE1zIiwiY29uc3RydWN0b3IiLCJ1cmlPckNvbm5lY3Rpb24iLCJPYmplY3QiLCJhc3NpZ24iLCJzZXRDcmVkZW50aWFscyIsIk1vbmVyb0Vycm9yIiwiR2VuVXRpbHMiLCJub3JtYWxpemVVcmkiLCJjaGVja0Nvbm5lY3Rpb25NdXRleCIsIlRocmVhZFBvb2wiLCJzZW5kUmVxdWVzdE11dGV4IiwiaXNPbmxpbmUiLCJpc0F1dGhlbnRpY2F0ZWQiLCJnZXRVcmkiLCJnZXRVc2VybmFtZSIsImdldFBhc3N3b3JkIiwiZ2V0Wm1xVXJpIiwic2V0Wm1xVXJpIiwiZ2V0UHJveHlVcmkiLCJzZXRQcm94eVVyaSIsImdldFJlamVjdFVuYXV0aG9yaXplZCIsInNldFByb3h5VG9Xb3JrZXIiLCJnZXRQcm94eVRvV29ya2VyIiwic2V0UHJpb3JpdHkiLCJnZXRQcmlvcml0eSIsInNldFRpbWVvdXQiLCJnZXRUaW1lb3V0Iiwic2V0QXR0cmlidXRlIiwia2V5IiwidmFsdWUiLCJhdHRyaWJ1dGVzIiwiTWFwIiwicHV0IiwiZ2V0QXR0cmlidXRlIiwiZ2V0IiwiY2hlY2tDb25uZWN0aW9uIiwicXVldWVDaGVja0Nvbm5lY3Rpb24iLCJMaWJyYXJ5VXRpbHMiLCJsb2FkV2FzbU1vZHVsZSIsImlzT25saW5lQmVmb3JlIiwiaXNBdXRoZW50aWNhdGVkQmVmb3JlIiwic3RhcnRUaW1lIiwiRGF0ZSIsIm5vdyIsImZha2VEaXNjb25uZWN0ZWQiLCJFcnJvciIsImhlaWdodHMiLCJpIiwicHVzaCIsInNlbmRCaW5hcnlSZXF1ZXN0IiwiZXJyIiwicmVzcG9uc2VUaW1lIiwiTW9uZXJvUnBjRXJyb3IiLCJnZXRDb2RlIiwiaXNDb25uZWN0ZWQiLCJnZXRJc09ubGluZSIsImdldElzQXV0aGVudGljYXRlZCIsImdldFJlc3BvbnNlVGltZSIsInNlbmRKc29uUmVxdWVzdCIsIm1ldGhvZCIsInBhcmFtcyIsInF1ZXVlU2VuZFJlcXVlc3QiLCJib2R5IiwiSlNPTiIsInN0cmluZ2lmeSIsImlkIiwianNvbnJwYyIsImdldExvZ0xldmVsIiwibG9nIiwiZ2V0VGltZSIsInJlc3AiLCJIdHRwQ2xpZW50IiwicmVxdWVzdCIsInRpbWVvdXQiLCJ2YWxpZGF0ZUh0dHBSZXNwb25zZSIsInBhcnNlIiwicmVwbGFjZSIsInJlc3BTdHIiLCJzdWJzdHJpbmciLCJNYXRoIiwibWluIiwibGVuZ3RoIiwidmFsaWRhdGVScGNSZXNwb25zZSIsInN0YXR1c0NvZGUiLCJzZW5kUGF0aFJlcXVlc3QiLCJwYXRoIiwicGFyYW1zQmluIiwiTW9uZXJvVXRpbHMiLCJqc29uVG9CaW5hcnkiLCJVaW50OEFycmF5IiwiY29uc29sZSIsImVycm9yIiwibWVzc2FnZSIsImNvZGUiLCJnZXRDb25maWciLCJ0b0pzb24iLCJqc29uIiwidG9TdHJpbmciLCJzZXRGYWtlRGlzY29ubmVjdGVkIiwiYXN5bmNGbiIsInN1Ym1pdCIsImNvbnRlbnQiLCJzdGF0dXNUZXh0IiwiZXJyb3JNc2ciLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL2NvbW1vbi9Nb25lcm9ScGNDb25uZWN0aW9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBHZW5VdGlscyBmcm9tIFwiLi9HZW5VdGlsc1wiO1xuaW1wb3J0IEh0dHBDbGllbnQgZnJvbSBcIi4vSHR0cENsaWVudFwiO1xuaW1wb3J0IExpYnJhcnlVdGlscyBmcm9tIFwiLi9MaWJyYXJ5VXRpbHNcIjtcbmltcG9ydCBNb25lcm9FcnJvciBmcm9tIFwiLi9Nb25lcm9FcnJvclwiO1xuaW1wb3J0IE1vbmVyb1JwY0Vycm9yIGZyb20gXCIuL01vbmVyb1JwY0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvVXRpbHMgZnJvbSBcIi4vTW9uZXJvVXRpbHNcIjtcbmltcG9ydCBUaHJlYWRQb29sIGZyb20gXCIuL1RocmVhZFBvb2xcIjtcblxuLyoqXG4gKiBNYWludGFpbnMgYSBjb25uZWN0aW9uIGFuZCBzZW5kcyByZXF1ZXN0cyB0byBhIE1vbmVybyBSUEMgQVBJLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNb25lcm9ScGNDb25uZWN0aW9uIHtcblxuICAvLyBwdWJsaWMgaW5zdGFuY2UgdmFyaWFibGVzXG4gIHVyaTogc3RyaW5nO1xuICB1c2VybmFtZTogc3RyaW5nO1xuICBwYXNzd29yZDogc3RyaW5nO1xuICB6bXFVcmk6IHN0cmluZztcbiAgcHJveHlVcmk6IHN0cmluZztcbiAgcmVqZWN0VW5hdXRob3JpemVkOiBib29sZWFuO1xuICBwcm94eVRvV29ya2VyOiBib29sZWFuO1xuICBwcmlvcml0eTogbnVtYmVyO1xuICB0aW1lb3V0TXM6IG51bWJlcjtcblxuICAvLyBwcml2YXRlIGluc3RhbmNlIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgaXNPbmxpbmU6IGJvb2xlYW47XG4gIHByb3RlY3RlZCBpc0F1dGhlbnRpY2F0ZWQ6IGJvb2xlYW47XG4gIHByb3RlY3RlZCBhdHRyaWJ1dGVzOiBhbnk7XG4gIHByb3RlY3RlZCBmYWtlRGlzY29ubmVjdGVkOiBib29sZWFuO1xuICBwcm90ZWN0ZWQgcmVzcG9uc2VUaW1lOiBudW1iZXI7XG4gIHByb3RlY3RlZCBjaGVja0Nvbm5lY3Rpb25NdXRleDogVGhyZWFkUG9vbDtcbiAgcHJvdGVjdGVkIHNlbmRSZXF1ZXN0TXV0ZXg6IFRocmVhZFBvb2w7XG5cbiAgLy8gZGVmYXVsdCBjb25maWdcbiAgLyoqIEBwcml2YXRlICovXG4gIHN0YXRpYyBERUZBVUxUX0NPTkZJRzogUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPiA9IHtcbiAgICB1cmk6IHVuZGVmaW5lZCxcbiAgICB1c2VybmFtZTogdW5kZWZpbmVkLFxuICAgIHBhc3N3b3JkOiB1bmRlZmluZWQsXG4gICAgem1xVXJpOiB1bmRlZmluZWQsXG4gICAgcHJveHlVcmk6IHVuZGVmaW5lZCxcbiAgICByZWplY3RVbmF1dGhvcml6ZWQ6IHRydWUsIC8vIHJlamVjdCBzZWxmLXNpZ25lZCBjZXJ0aWZpY2F0ZXMgaWYgdHJ1ZVxuICAgIHByb3h5VG9Xb3JrZXI6IGZhbHNlLFxuICAgIHByaW9yaXR5OiAwLFxuICAgIHRpbWVvdXRNczogdW5kZWZpbmVkXG4gIH1cblxuICAvKipcbiAgICogPHA+Q29uc3RydWN0IGEgUlBDIGNvbm5lY3Rpb24uPC9wPlxuICAgKiBcbiAgICogPHA+RXhhbXBsZXM6PC9wPlxuICAgKiBcbiAgICogPGNvZGU+XG4gICAqIGxldCBjb25uZWN0aW9uMSA9IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKFwiaHR0cDovL2xvY2FsaG9zdDozODA4MVwiLCBcImRhZW1vbl91c2VyXCIsIFwiZGFlbW9uX3Bhc3N3b3JkXzEyM1wiKTxicj48YnI+XG4gICAqIFxuICAgKiBsZXQgY29ubmVjdGlvbjIgPSBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih7PGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgdXJpOiBodHRwOi8vbG9jYWxob3N0OjM4MDgxLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHVzZXJuYW1lOiBcImRhZW1vbl91c2VyXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcGFzc3dvcmQ6IFwiZGFlbW9uX3Bhc3N3b3JkXzEyM1wiLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHJlamVjdFVuYXV0aG9yaXplZDogZmFsc2UsIC8vIGFjY2VwdCBzZWxmLXNpZ25lZCBjZXJ0aWZpY2F0ZXMgZS5nLiBmb3IgbG9jYWwgZGV2ZWxvcG1lbnQ8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBwcm94eVRvV29ya2VyOiB0cnVlIC8vIHByb3h5IHJlcXVlc3QgdG8gd29ya2VyIChkZWZhdWx0IGZhbHNlKTxicj5cbiAgICogfSk7XG4gICAqIDwvY29kZT5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj59IHVyaU9yQ29ubmVjdGlvbiAtIE1vbmVyb1JwY0Nvbm5lY3Rpb24gb3IgVVJJIG9mIHRoZSBSUEMgZW5kcG9pbnRcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVyaU9yQ29ubmVjdGlvbi51cmkgLSBVUkkgb2YgdGhlIFJQQyBlbmRwb2ludFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3VyaU9yQ29ubmVjdGlvbi51c2VybmFtZV0gLSB1c2VybmFtZSB0byBhdXRoZW50aWNhdGUgd2l0aCB0aGUgUlBDIGVuZHBvaW50IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFt1cmlPckNvbm5lY3Rpb24ucGFzc3dvcmRdIC0gcGFzc3dvcmQgdG8gYXV0aGVudGljYXRlIHdpdGggdGhlIFJQQyBlbmRwb2ludCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbdXJpT3JDb25uZWN0aW9uLnptcVVyaV0gLSBVUkkgb2YgdGhlIFpNUSBlbmRwb2ludCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbdXJpT3JDb25uZWN0aW9uLnByb3h5VXJpXSAtIFVSSSBvZiBhIHByb3h5IHNlcnZlciB0byByb3V0ZSByZXF1ZXN0cyB0aHJvdWdoIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbdXJpT3JDb25uZWN0aW9uLnJlamVjdFVuYXV0aG9yaXplZF0gLSByZWplY3RzIHNlbGYtc2lnbmVkIGNlcnRpZmljYXRlcyBpZiB0cnVlIChkZWZhdWx0IHRydWUpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gdXJpT3JDb25uZWN0aW9uLnByb3h5VG9Xb3JrZXIgLSBwcm94eSByZXF1ZXN0cyB0byB3b3JrZXIgKGRlZmF1bHQgdHJ1ZSlcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVzZXJuYW1lIC0gdXNlcm5hbWUgdG8gYXV0aGVudGljYXRlIHdpdGggdGhlIFJQQyBlbmRwb2ludCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXNzd29yZCAtIHBhc3N3b3JkIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIHRoZSBSUEMgZW5kcG9pbnQgKG9wdGlvbmFsKVxuICAgKi9cbiAgY29uc3RydWN0b3IodXJpT3JDb25uZWN0aW9uOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+LCB1c2VybmFtZT86IHN0cmluZywgcGFzc3dvcmQ/OiBzdHJpbmcpIHtcblxuICAgIC8vIHZhbGlkYXRlIGFuZCBub3JtYWxpemUgY29uZmlnXG4gICAgaWYgKHR5cGVvZiB1cmlPckNvbm5lY3Rpb24gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIE9iamVjdC5hc3NpZ24odGhpcywgTW9uZXJvUnBjQ29ubmVjdGlvbi5ERUZBVUxUX0NPTkZJRyk7XG4gICAgICB0aGlzLnVyaSA9IHVyaU9yQ29ubmVjdGlvbjtcbiAgICAgIHRoaXMuc2V0Q3JlZGVudGlhbHModXNlcm5hbWUsIHBhc3N3b3JkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHVzZXJuYW1lICE9PSB1bmRlZmluZWQgfHwgcGFzc3dvcmQgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2FuIHByb3ZpZGUgY29uZmlnIG9iamVjdCBvciBwYXJhbXMgYnV0IG5vdCBib3RoXCIpO1xuICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLCBNb25lcm9ScGNDb25uZWN0aW9uLkRFRkFVTFRfQ09ORklHLCB1cmlPckNvbm5lY3Rpb24pO1xuICAgICAgdGhpcy5zZXRDcmVkZW50aWFscyh0aGlzLnVzZXJuYW1lLCB0aGlzLnBhc3N3b3JkKTtcbiAgICB9XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIHVyaXNcbiAgICBpZiAodGhpcy51cmkpIHRoaXMudXJpID0gR2VuVXRpbHMubm9ybWFsaXplVXJpKHRoaXMudXJpKTtcbiAgICBpZiAodGhpcy56bXFVcmkpIHRoaXMuem1xVXJpID0gR2VuVXRpbHMubm9ybWFsaXplVXJpKHRoaXMuem1xVXJpKTtcbiAgICBpZiAodGhpcy5wcm94eVVyaSkgdGhpcy5wcm94eVVyaSA9IEdlblV0aWxzLm5vcm1hbGl6ZVVyaSh0aGlzLnByb3h5VXJpKTtcblxuICAgIC8vIGluaXRpYWxpemUgbXV0ZXhlc1xuICAgIHRoaXMuY2hlY2tDb25uZWN0aW9uTXV0ZXggPSBuZXcgVGhyZWFkUG9vbCgxKTtcbiAgICB0aGlzLnNlbmRSZXF1ZXN0TXV0ZXggPSBuZXcgVGhyZWFkUG9vbCgxKTtcbiAgfVxuICBcbiAgc2V0Q3JlZGVudGlhbHModXNlcm5hbWUsIHBhc3N3b3JkKSB7XG4gICAgaWYgKHVzZXJuYW1lID09PSBcIlwiKSB1c2VybmFtZSA9IHVuZGVmaW5lZDtcbiAgICBpZiAocGFzc3dvcmQgPT09IFwiXCIpIHBhc3N3b3JkID0gdW5kZWZpbmVkO1xuICAgIGlmICh1c2VybmFtZSB8fCBwYXNzd29yZCkge1xuICAgICAgaWYgKCF1c2VybmFtZSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwidXNlcm5hbWUgbXVzdCBiZSBkZWZpbmVkIGJlY2F1c2UgcGFzc3dvcmQgaXMgZGVmaW5lZFwiKTtcbiAgICAgIGlmICghcGFzc3dvcmQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcInBhc3N3b3JkIG11c3QgYmUgZGVmaW5lZCBiZWNhdXNlIHVzZXJuYW1lIGlzIGRlZmluZWRcIik7XG4gICAgfVxuICAgIGlmICh0aGlzLnVzZXJuYW1lID09PSBcIlwiKSB0aGlzLnVzZXJuYW1lID0gdW5kZWZpbmVkO1xuICAgIGlmICh0aGlzLnBhc3N3b3JkID09PSBcIlwiKSB0aGlzLnBhc3N3b3JkID0gdW5kZWZpbmVkO1xuICAgIGlmICh0aGlzLnVzZXJuYW1lICE9PSB1c2VybmFtZSB8fCB0aGlzLnBhc3N3b3JkICE9PSBwYXNzd29yZCkge1xuICAgICAgdGhpcy5pc09ubGluZSA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICB0aGlzLnVzZXJuYW1lID0gdXNlcm5hbWU7XG4gICAgdGhpcy5wYXNzd29yZCA9IHBhc3N3b3JkO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBnZXRVcmkoKSB7XG4gICAgcmV0dXJuIHRoaXMudXJpO1xuICB9XG5cbiAgZ2V0VXNlcm5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMudXNlcm5hbWUgPyB0aGlzLnVzZXJuYW1lIDogXCJcIjtcbiAgfVxuICBcbiAgZ2V0UGFzc3dvcmQoKSB7XG4gICAgcmV0dXJuIHRoaXMucGFzc3dvcmQgPyB0aGlzLnBhc3N3b3JkIDogXCJcIjtcbiAgfVxuXG4gIGdldFptcVVyaSgpIHtcbiAgICByZXR1cm4gdGhpcy56bXFVcmk7XG4gIH1cblxuICBzZXRabXFVcmkoem1xVXJpKSB7XG4gICAgdGhpcy56bXFVcmkgPSB6bXFVcmk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIGdldFByb3h5VXJpKCkge1xuICAgIHJldHVybiB0aGlzLnByb3h5VXJpO1xuICB9XG5cbiAgc2V0UHJveHlVcmkocHJveHlVcmkpIHtcbiAgICB0aGlzLnByb3h5VXJpID0gcHJveHlVcmk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIGdldFJlamVjdFVuYXV0aG9yaXplZCgpIHtcbiAgICByZXR1cm4gdGhpcy5yZWplY3RVbmF1dGhvcml6ZWQ7XG4gIH1cbiAgXG4gIHNldFByb3h5VG9Xb3JrZXIocHJveHlUb1dvcmtlcikge1xuICAgIHRoaXMucHJveHlUb1dvcmtlciA9IHByb3h5VG9Xb3JrZXI7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIGdldFByb3h5VG9Xb3JrZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMucHJveHlUb1dvcmtlcjtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNldCB0aGUgY29ubmVjdGlvbidzIHByaW9yaXR5IHJlbGF0aXZlIHRvIG90aGVyIGNvbm5lY3Rpb25zLiBQcmlvcml0eSAxIGlzIGhpZ2hlc3QsXG4gICAqIHRoZW4gcHJpb3JpdHkgMiwgZXRjLiBUaGUgZGVmYXVsdCBwcmlvcml0eSBvZiAwIGlzIGxvd2VzdCBwcmlvcml0eS5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcHJpb3JpdHldIC0gdGhlIGNvbm5lY3Rpb24gcHJpb3JpdHkgKGRlZmF1bHQgMClcbiAgICogQHJldHVybiB7TW9uZXJvUnBjQ29ubmVjdGlvbn0gdGhpcyBjb25uZWN0aW9uXG4gICAqL1xuICBzZXRQcmlvcml0eShwcmlvcml0eSkge1xuICAgIGlmICghKHByaW9yaXR5ID49IDApKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJQcmlvcml0eSBtdXN0IGJlID49IDBcIik7XG4gICAgdGhpcy5wcmlvcml0eSA9IHByaW9yaXR5O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZ2V0UHJpb3JpdHkoKSB7XG4gICAgcmV0dXJuIHRoaXMucHJpb3JpdHk7IFxuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgUlBDIHJlcXVlc3QgdGltZW91dCBpbiBtaWxsaXNlY29uZHMuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gdGltZW91dE1zIGlzIHRoZSB0aW1lb3V0IGluIG1pbGxpc2Vjb25kcywgMCB0byBkaXNhYmxlIHRpbWVvdXQsIG9yIHVuZGVmaW5lZCB0byB1c2UgZGVmYXVsdFxuICAgKiBAcmV0dXJuIHtNb25lcm9ScGNDb25uZWN0aW9ufSB0aGlzIGNvbm5lY3Rpb25cbiAgICovXG4gIHNldFRpbWVvdXQodGltZW91dE1zOiBudW1iZXIpIHtcbiAgICB0aGlzLnRpbWVvdXRNcyA9IHRpbWVvdXRNcztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldFRpbWVvdXQoKSB7XG4gICAgcmV0dXJuIHRoaXMudGltZW91dE1zO1xuICB9XG4gIFxuICBzZXRBdHRyaWJ1dGUoa2V5LCB2YWx1ZSkge1xuICAgIGlmICghdGhpcy5hdHRyaWJ1dGVzKSB0aGlzLmF0dHJpYnV0ZXMgPSBuZXcgTWFwKCk7XG4gICAgdGhpcy5hdHRyaWJ1dGVzLnB1dChrZXksIHZhbHVlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgZ2V0QXR0cmlidXRlKGtleSkge1xuICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXMuZ2V0KGtleSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDaGVjayB0aGUgY29ubmVjdGlvbiBzdGF0dXMgdG8gdXBkYXRlIGlzT25saW5lLCBpc0F1dGhlbnRpY2F0ZWQsIGFuZCByZXNwb25zZSB0aW1lLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IHRpbWVvdXRNcyAtIG1heGltdW0gcmVzcG9uc2UgdGltZSBiZWZvcmUgY29uc2lkZXJlZCBvZmZsaW5lXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgdGhlcmUgaXMgYSBjaGFuZ2UgaW4gc3RhdHVzLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGNoZWNrQ29ubmVjdGlvbih0aW1lb3V0TXMpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICByZXR1cm4gdGhpcy5xdWV1ZUNoZWNrQ29ubmVjdGlvbihhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZFdhc21Nb2R1bGUoKTsgLy8gY2FjaGUgd2FzbSBmb3IgYmluYXJ5IHJlcXVlc3RcbiAgICAgIGxldCBpc09ubGluZUJlZm9yZSA9IHRoaXMuaXNPbmxpbmU7XG4gICAgICBsZXQgaXNBdXRoZW50aWNhdGVkQmVmb3JlID0gdGhpcy5pc0F1dGhlbnRpY2F0ZWQ7XG4gICAgICBsZXQgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmICh0aGlzLmZha2VEaXNjb25uZWN0ZWQpIHRocm93IG5ldyBFcnJvcihcIkNvbm5lY3Rpb24gaXMgZmFrZSBkaXNjb25uZWN0ZWRcIik7XG4gICAgICAgIGxldCBoZWlnaHRzID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTAwOyBpKyspIGhlaWdodHMucHVzaChpKTtcbiAgICAgICAgYXdhaXQgdGhpcy5zZW5kQmluYXJ5UmVxdWVzdChcImdldF9ibG9ja3NfYnlfaGVpZ2h0LmJpblwiLCB7aGVpZ2h0czogaGVpZ2h0c30sIHRpbWVvdXRNcyk7IC8vIGFzc3VtZSBkYWVtb24gY29ubmVjdGlvblxuICAgICAgICB0aGlzLmlzT25saW5lID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSB0cnVlO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHRoaXMuaXNPbmxpbmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMucmVzcG9uc2VUaW1lID0gdW5kZWZpbmVkO1xuICAgICAgICBpZiAoZXJyIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IpIHtcbiAgICAgICAgICBpZiAoZXJyLmdldENvZGUoKSA9PT0gNDAxKSB7XG4gICAgICAgICAgICB0aGlzLmlzT25saW5lID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gZmFsc2U7XG4gICAgICAgICAgfSBlbHNlIGlmIChlcnIuZ2V0Q29kZSgpID09PSA0MDQpIHsgLy8gZmFsbGJhY2sgdG8gbGF0ZW5jeSBjaGVja1xuICAgICAgICAgICAgdGhpcy5pc09ubGluZSA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5pc09ubGluZSkgdGhpcy5yZXNwb25zZVRpbWUgPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuICAgICAgcmV0dXJuIGlzT25saW5lQmVmb3JlICE9PSB0aGlzLmlzT25saW5lIHx8IGlzQXV0aGVudGljYXRlZEJlZm9yZSAhPT0gdGhpcy5pc0F1dGhlbnRpY2F0ZWQ7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGNvbm5lY3Rpb24gaXMgY29ubmVjdGVkIGFjY29yZGluZyB0byB0aGUgbGFzdCBjYWxsIHRvIGNoZWNrQ29ubmVjdGlvbigpLjxicj48YnI+XG4gICAqIFxuICAgKiBOb3RlOiBtdXN0IGNhbGwgY2hlY2tDb25uZWN0aW9uKCkgbWFudWFsbHkgdW5sZXNzIHVzaW5nIE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyLlxuICAgKiBcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBvciBmYWxzZSB0byBpbmRpY2F0ZSBpZiBjb25uZWN0ZWQsIG9yIHVuZGVmaW5lZCBpZiBjaGVja0Nvbm5lY3Rpb24oKSBoYXMgbm90IGJlZW4gY2FsbGVkXG4gICAqL1xuICBpc0Nvbm5lY3RlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5pc09ubGluZSA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogdGhpcy5pc09ubGluZSAmJiB0aGlzLmlzQXV0aGVudGljYXRlZCAhPT0gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBjb25uZWN0aW9uIGlzIG9ubGluZSBhY2NvcmRpbmcgdG8gdGhlIGxhc3QgY2FsbCB0byBjaGVja0Nvbm5lY3Rpb24oKS48YnI+PGJyPlxuICAgKiBcbiAgICogTm90ZTogbXVzdCBjYWxsIGNoZWNrQ29ubmVjdGlvbigpIG1hbnVhbGx5IHVubGVzcyB1c2luZyBNb25lcm9Db25uZWN0aW9uTWFuYWdlci5cbiAgICogXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgb3IgZmFsc2UgdG8gaW5kaWNhdGUgaWYgb25saW5lLCBvciB1bmRlZmluZWQgaWYgY2hlY2tDb25uZWN0aW9uKCkgaGFzIG5vdCBiZWVuIGNhbGxlZFxuICAgKi9cbiAgZ2V0SXNPbmxpbmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNPbmxpbmU7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBjb25uZWN0aW9uIGlzIGF1dGhlbnRpY2F0ZWQgYWNjb3JkaW5nIHRvIHRoZSBsYXN0IGNhbGwgdG8gY2hlY2tDb25uZWN0aW9uKCkuPGJyPjxicj5cbiAgICogXG4gICAqIE5vdGU6IG11c3QgY2FsbCBjaGVja0Nvbm5lY3Rpb24oKSBtYW51YWxseSB1bmxlc3MgdXNpbmcgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIGF1dGhlbnRpY2F0ZWQgb3Igbm8gYXV0aGVudGljYXRpb24sIGZhbHNlIGlmIG5vdCBhdXRoZW50aWNhdGVkLCBvciB1bmRlZmluZWQgaWYgY2hlY2tDb25uZWN0aW9uKCkgaGFzIG5vdCBiZWVuIGNhbGxlZFxuICAgKi9cbiAgZ2V0SXNBdXRoZW50aWNhdGVkKCkge1xuICAgIHJldHVybiB0aGlzLmlzQXV0aGVudGljYXRlZDtcbiAgfVxuXG4gIGdldFJlc3BvbnNlVGltZSgpIHtcbiAgICByZXR1cm4gdGhpcy5yZXNwb25zZVRpbWU7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZW5kIGEgSlNPTiBSUEMgcmVxdWVzdC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZXRob2QgLSBKU09OIFJQQyBtZXRob2QgdG8gaW52b2tlXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXMgLSByZXF1ZXN0IHBhcmFtZXRlcnNcbiAgICogQHBhcmFtIHtudW1iZXJ9IFt0aW1lb3V0TXNdIC0gb3ZlcnJpZGVzIHRoZSByZXF1ZXN0IHRpbWVvdXQgaW4gbWlsbGlzZWNvbmRzXG4gICAqIEByZXR1cm4ge29iamVjdH0gaXMgdGhlIHJlc3BvbnNlIG1hcFxuICAgKi9cbiAgYXN5bmMgc2VuZEpzb25SZXF1ZXN0KG1ldGhvZCwgcGFyYW1zPywgdGltZW91dE1zPyk6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIHRoaXMucXVldWVTZW5kUmVxdWVzdChhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuXG4gICAgICAgIC8vIGJ1aWxkIHJlcXVlc3QgYm9keVxuICAgICAgICBsZXQgYm9keSA9IEpTT04uc3RyaW5naWZ5KHsgIC8vIGJvZHkgaXMgc3RyaW5naWZpZWQgc28gdGV4dC9wbGFpbiBpcyByZXR1cm5lZCBzbyBiaWdpbnRzIGFyZSBwcmVzZXJ2ZWRcbiAgICAgICAgICBpZDogXCIwXCIsXG4gICAgICAgICAganNvbnJwYzogXCIyLjBcIixcbiAgICAgICAgICBtZXRob2Q6IG1ldGhvZCxcbiAgICAgICAgICBwYXJhbXM6IHBhcmFtc1xuICAgICAgICB9KTtcbiAgXG4gICAgICAgIC8vIGxvZ2dpbmdcbiAgICAgICAgaWYgKExpYnJhcnlVdGlscy5nZXRMb2dMZXZlbCgpID49IDIpIExpYnJhcnlVdGlscy5sb2coMiwgXCJTZW5kaW5nIGpzb24gcmVxdWVzdCB3aXRoIG1ldGhvZCAnXCIgKyBtZXRob2QgKyBcIicgYW5kIGJvZHk6IFwiICsgYm9keSk7XG5cbiAgICAgICAgLy8gcHJveHkgdXJpIGlzIG5vdCBzdXBwb3J0ZWRcbiAgICAgICAgaWYgKHRoaXMuZ2V0UHJveHlVcmkoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiUHJveHkgVVJJIG5vdCBzdXBwb3J0ZWQgZm9yIEpTT04gcmVxdWVzdHNcIik7XG4gICAgICAgIFxuICAgICAgICAvLyBzZW5kIGh0dHAgcmVxdWVzdFxuICAgICAgICBsZXQgc3RhcnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgIGxldCByZXNwID0gYXdhaXQgSHR0cENsaWVudC5yZXF1ZXN0KHtcbiAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgIHVyaTogdGhpcy5nZXRVcmkoKSArICcvanNvbl9ycGMnLFxuICAgICAgICAgIHVzZXJuYW1lOiB0aGlzLmdldFVzZXJuYW1lKCksXG4gICAgICAgICAgcGFzc3dvcmQ6IHRoaXMuZ2V0UGFzc3dvcmQoKSxcbiAgICAgICAgICBib2R5OiBib2R5LFxuICAgICAgICAgIHRpbWVvdXQ6IHRpbWVvdXRNcyA9PT0gdW5kZWZpbmVkID8gdGhpcy50aW1lb3V0TXMgOiB0aW1lb3V0TXMsXG4gICAgICAgICAgcmVqZWN0VW5hdXRob3JpemVkOiB0aGlzLnJlamVjdFVuYXV0aG9yaXplZCxcbiAgICAgICAgICBwcm94eVRvV29ya2VyOiB0aGlzLnByb3h5VG9Xb3JrZXJcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyB2YWxpZGF0ZSByZXNwb25zZVxuICAgICAgICBNb25lcm9ScGNDb25uZWN0aW9uLnZhbGlkYXRlSHR0cFJlc3BvbnNlKHJlc3ApO1xuICAgICAgICBcbiAgICAgICAgLy8gZGVzZXJpYWxpemUgcmVzcG9uc2VcbiAgICAgICAgaWYgKHJlc3AuYm9keVswXSAhPSAneycpIHRocm93IHJlc3AuYm9keTtcbiAgICAgICAgcmVzcCA9IEpTT04ucGFyc2UocmVzcC5ib2R5LnJlcGxhY2UoLyhcIlteXCJdKlwiXFxzKjpcXHMqKShcXGR7MTYsfSkvZywgJyQxXCIkMlwiJykpOyAgLy8gcmVwbGFjZSAxNiBvciBtb3JlIGRpZ2l0cyB3aXRoIHN0cmluZ3MgYW5kIHBhcnNlXG4gICAgICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0TG9nTGV2ZWwoKSA+PSAzKSB7XG4gICAgICAgICAgbGV0IHJlc3BTdHIgPSBKU09OLnN0cmluZ2lmeShyZXNwKTtcbiAgICAgICAgICBMaWJyYXJ5VXRpbHMubG9nKDMsIFwiUmVjZWl2ZWQgcmVzcG9uc2UgZnJvbSBtZXRob2Q9J1wiICsgbWV0aG9kICsgXCInLCByZXNwb25zZT1cIiArIHJlc3BTdHIuc3Vic3RyaW5nKDAsIE1hdGgubWluKDEwMDAsIHJlc3BTdHIubGVuZ3RoKSkgKyBcIihcIiArIChuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHN0YXJ0VGltZSkgKyBcIiBtcylcIik7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIGNoZWNrIHJwYyByZXNwb25zZSBmb3IgZXJyb3JzXG4gICAgICAgIHRoaXMudmFsaWRhdGVScGNSZXNwb25zZShyZXNwLCBtZXRob2QsIHBhcmFtcyk7XG4gICAgICAgIHJldHVybiByZXNwO1xuICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yKSB0aHJvdyBlcnI7XG4gICAgICAgIGVsc2UgdGhyb3cgbmV3IE1vbmVyb1JwY0Vycm9yKGVyciwgZXJyLnN0YXR1c0NvZGUsIG1ldGhvZCwgcGFyYW1zKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNlbmQgYSBSUEMgcmVxdWVzdCB0byB0aGUgZ2l2ZW4gcGF0aCBhbmQgd2l0aCB0aGUgZ2l2ZW4gcGFyYW10ZXJzLlxuICAgKiBcbiAgICogRS5nLiBcIi9nZXRfdHJhbnNhY3Rpb25zXCIgd2l0aCBwYXJhbXNcbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gSlNPTiBSUEMgcGF0aCB0byBpbnZva2VcbiAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcyAtIHJlcXVlc3QgcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0ge251bWJlcn0gW3RpbWVvdXRNc10gLSBvdmVycmlkZXMgdGhlIHJlcXVlc3QgdGltZW91dCBpbiBtaWxsaXNlY29uZHNcbiAgICogQHJldHVybiB7b2JqZWN0fSBpcyB0aGUgcmVzcG9uc2UgbWFwXG4gICAqL1xuICBhc3luYyBzZW5kUGF0aFJlcXVlc3QocGF0aCwgcGFyYW1zPywgdGltZW91dE1zPyk6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIHRoaXMucXVldWVTZW5kUmVxdWVzdChhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuXG4gICAgICAgIC8vIGxvZ2dpbmdcbiAgICAgICAgaWYgKExpYnJhcnlVdGlscy5nZXRMb2dMZXZlbCgpID49IDIpIExpYnJhcnlVdGlscy5sb2coMiwgXCJTZW5kaW5nIHBhdGggcmVxdWVzdCB3aXRoIHBhdGggJ1wiICsgcGF0aCArIFwiJyBhbmQgcGFyYW1zOiBcIiArIEpTT04uc3RyaW5naWZ5KHBhcmFtcykpO1xuXG4gICAgICAgIC8vIHByb3h5IHVyaSBpcyBub3Qgc3VwcG9ydGVkXG4gICAgICAgIGlmICh0aGlzLmdldFByb3h5VXJpKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlByb3h5IFVSSSBub3Qgc3VwcG9ydGVkIGZvciBwYXRoIHJlcXVlc3RzXCIpO1xuICAgICAgICBcbiAgICAgICAgLy8gc2VuZCBodHRwIHJlcXVlc3RcbiAgICAgICAgbGV0IHN0YXJ0VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICBsZXQgcmVzcCA9IGF3YWl0IEh0dHBDbGllbnQucmVxdWVzdCh7XG4gICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgICB1cmk6IHRoaXMuZ2V0VXJpKCkgKyAnLycgKyBwYXRoLFxuICAgICAgICAgIHVzZXJuYW1lOiB0aGlzLmdldFVzZXJuYW1lKCksXG4gICAgICAgICAgcGFzc3dvcmQ6IHRoaXMuZ2V0UGFzc3dvcmQoKSxcbiAgICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShwYXJhbXMpLCAgLy8gYm9keSBpcyBzdHJpbmdpZmllZCBzbyB0ZXh0L3BsYWluIGlzIHJldHVybmVkIHNvIGJpZ2ludHMgYXJlIHByZXNlcnZlZFxuICAgICAgICAgIHRpbWVvdXQ6IHRpbWVvdXRNcyA9PT0gdW5kZWZpbmVkID8gdGhpcy50aW1lb3V0TXMgOiB0aW1lb3V0TXMsXG4gICAgICAgICAgcmVqZWN0VW5hdXRob3JpemVkOiB0aGlzLnJlamVjdFVuYXV0aG9yaXplZCxcbiAgICAgICAgICBwcm94eVRvV29ya2VyOiB0aGlzLnByb3h5VG9Xb3JrZXJcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyB2YWxpZGF0ZSByZXNwb25zZVxuICAgICAgICBNb25lcm9ScGNDb25uZWN0aW9uLnZhbGlkYXRlSHR0cFJlc3BvbnNlKHJlc3ApO1xuICAgICAgICBcbiAgICAgICAgLy8gZGVzZXJpYWxpemUgcmVzcG9uc2VcbiAgICAgICAgaWYgKHJlc3AuYm9keVswXSAhPSAneycpIHRocm93IHJlc3AuYm9keTtcbiAgICAgICAgcmVzcCA9IEpTT04ucGFyc2UocmVzcC5ib2R5LnJlcGxhY2UoLyhcIlteXCJdKlwiXFxzKjpcXHMqKShcXGR7MTYsfSkvZywgJyQxXCIkMlwiJykpOyAgLy8gcmVwbGFjZSAxNiBvciBtb3JlIGRpZ2l0cyB3aXRoIHN0cmluZ3MgYW5kIHBhcnNlXG4gICAgICAgIGlmICh0eXBlb2YgcmVzcCA9PT0gXCJzdHJpbmdcIikgcmVzcCA9IEpTT04ucGFyc2UocmVzcCk7ICAvLyBUT0RPOiBzb21lIHJlc3BvbnNlcyByZXR1cm5lZCBhcyBzdHJpbmdzP1xuICAgICAgICBpZiAoTGlicmFyeVV0aWxzLmdldExvZ0xldmVsKCkgPj0gMykge1xuICAgICAgICAgIGxldCByZXNwU3RyID0gSlNPTi5zdHJpbmdpZnkocmVzcCk7XG4gICAgICAgICAgTGlicmFyeVV0aWxzLmxvZygzLCBcIlJlY2VpdmVkIHJlc3BvbnNlIGZyb20gcGF0aD0nXCIgKyBwYXRoICsgXCInLCByZXNwb25zZT1cIiArIHJlc3BTdHIuc3Vic3RyaW5nKDAsIE1hdGgubWluKDEwMDAsIHJlc3BTdHIubGVuZ3RoKSkgKyBcIihcIiArIChuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIHN0YXJ0VGltZSkgKyBcIiBtcylcIik7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIGNoZWNrIHJwYyByZXNwb25zZSBmb3IgZXJyb3JzXG4gICAgICAgIHRoaXMudmFsaWRhdGVScGNSZXNwb25zZShyZXNwLCBwYXRoLCBwYXJhbXMpO1xuICAgICAgICByZXR1cm4gcmVzcDtcbiAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvcikgdGhyb3cgZXJyO1xuICAgICAgICBlbHNlIHRocm93IG5ldyBNb25lcm9ScGNFcnJvcihlcnIsIGVyci5zdGF0dXNDb2RlLCBwYXRoLCBwYXJhbXMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogU2VuZCBhIGJpbmFyeSBSUEMgcmVxdWVzdC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gcGF0aCBvZiB0aGUgYmluYXJ5IFJQQyBtZXRob2QgdG8gaW52b2tlXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBbcGFyYW1zXSAtIHJlcXVlc3QgcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0ge251bWJlcn0gW3RpbWVvdXRNc10gLSByZXF1ZXN0IHRpbWVvdXQgaW4gbWlsbGlzZWNvbmRzXG4gICAqIEByZXR1cm4ge1VpbnQ4QXJyYXl9IHRoZSBiaW5hcnkgcmVzcG9uc2VcbiAgICovXG4gIGFzeW5jIHNlbmRCaW5hcnlSZXF1ZXN0KHBhdGgsIHBhcmFtcz8sIHRpbWVvdXRNcz8pOiBQcm9taXNlPGFueT4ge1xuICAgIHJldHVybiB0aGlzLnF1ZXVlU2VuZFJlcXVlc3QoYXN5bmMgKCkgPT4ge1xuXG4gICAgICAvLyBzZXJpYWxpemUgcGFyYW1zXG4gICAgICBsZXQgcGFyYW1zQmluID0gYXdhaXQgTW9uZXJvVXRpbHMuanNvblRvQmluYXJ5KHBhcmFtcyk7XG4gICAgICAgICAgXG4gICAgICB0cnkge1xuXG4gICAgICAgIC8vIGxvZ2dpbmdcbiAgICAgICAgaWYgKExpYnJhcnlVdGlscy5nZXRMb2dMZXZlbCgpID49IDIpIExpYnJhcnlVdGlscy5sb2coMiwgXCJTZW5kaW5nIGJpbmFyeSByZXF1ZXN0IHdpdGggcGF0aCAnXCIgKyBwYXRoICsgXCInIGFuZCBwYXJhbXM6IFwiICsgSlNPTi5zdHJpbmdpZnkocGFyYW1zKSk7XG5cbiAgICAgICAgLy8gcHJveHkgdXJpIGlzIG5vdCBzdXBwb3J0ZWRcbiAgICAgICAgaWYgKHRoaXMuZ2V0UHJveHlVcmkoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiUHJveHkgVVJJIG5vdCBzdXBwb3J0ZWQgZm9yIGJpbmFyeSByZXF1ZXN0c1wiKTtcbiAgICAgICAgXG4gICAgICAgIC8vIHNlbmQgaHR0cCByZXF1ZXN0XG4gICAgICAgIGxldCByZXNwID0gYXdhaXQgSHR0cENsaWVudC5yZXF1ZXN0KHtcbiAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgIHVyaTogdGhpcy5nZXRVcmkoKSArICcvJyArIHBhdGgsXG4gICAgICAgICAgdXNlcm5hbWU6IHRoaXMuZ2V0VXNlcm5hbWUoKSxcbiAgICAgICAgICBwYXNzd29yZDogdGhpcy5nZXRQYXNzd29yZCgpLFxuICAgICAgICAgIGJvZHk6IHBhcmFtc0JpbixcbiAgICAgICAgICB0aW1lb3V0OiB0aW1lb3V0TXMgPT09IHVuZGVmaW5lZCA/IHRoaXMudGltZW91dE1zIDogdGltZW91dE1zLFxuICAgICAgICAgIHJlamVjdFVuYXV0aG9yaXplZDogdGhpcy5yZWplY3RVbmF1dGhvcml6ZWQsXG4gICAgICAgICAgcHJveHlUb1dvcmtlcjogdGhpcy5wcm94eVRvV29ya2VyXG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gdmFsaWRhdGUgcmVzcG9uc2VcbiAgICAgICAgTW9uZXJvUnBjQ29ubmVjdGlvbi52YWxpZGF0ZUh0dHBSZXNwb25zZShyZXNwKTtcbiAgICAgICAgXG4gICAgICAgIC8vIHByb2Nlc3MgcmVzcG9uc2VcbiAgICAgICAgcmVzcCA9IHJlc3AuYm9keTtcbiAgICAgICAgaWYgKCEocmVzcCBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcInJlc3AgaXMgbm90IHVpbnQ4YXJyYXlcIik7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihyZXNwKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVzcC5lcnJvcikgdGhyb3cgbmV3IE1vbmVyb1JwY0Vycm9yKHJlc3AuZXJyb3IubWVzc2FnZSwgcmVzcC5lcnJvci5jb2RlLCBwYXRoLCBwYXJhbXMpO1xuICAgICAgICByZXR1cm4gcmVzcDtcbiAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvcikgdGhyb3cgZXJyO1xuICAgICAgICBlbHNlIHRocm93IG5ldyBNb25lcm9ScGNFcnJvcihlcnIsIGVyci5zdGF0dXNDb2RlLCBwYXRoLCBwYXJhbXMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZ2V0Q29uZmlnKCkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmk6IHRoaXMudXJpLFxuICAgICAgdXNlcm5hbWU6IHRoaXMudXNlcm5hbWUsXG4gICAgICBwYXNzd29yZDogdGhpcy5wYXNzd29yZCxcbiAgICAgIHptcVVyaTogdGhpcy56bXFVcmksXG4gICAgICBwcm94eVVyaTogdGhpcy5wcm94eVVyaSxcbiAgICAgIHJlamVjdFVuYXV0aG9yaXplZDogdGhpcy5yZWplY3RVbmF1dGhvcml6ZWQsXG4gICAgICBwcm94eVRvV29ya2VyOiB0aGlzLnByb3h5VG9Xb3JrZXIsXG4gICAgICBwcmlvcml0eTogdGhpcy5wcmlvcml0eSxcbiAgICAgIHRpbWVvdXRNczogdGhpcy50aW1lb3V0TXNcbiAgICB9O1xuICB9XG5cbiAgdG9Kc29uKCkge1xuICAgIGxldCBqc29uID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcylcbiAgICBqc29uLmNoZWNrQ29ubmVjdGlvbk11dGV4ID0gdW5kZWZpbmVkO1xuICAgIGpzb24uc2VuZFJlcXVlc3RNdXRleCA9IHVuZGVmaW5lZDtcbiAgICByZXR1cm4ganNvbjtcbiAgfVxuICBcbiAgdG9TdHJpbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0VXJpKCkgKyBcIiAodXNlcm5hbWU9XCIgKyB0aGlzLmdldFVzZXJuYW1lKCkgKyBcIiwgcGFzc3dvcmQ9XCIgKyAodGhpcy5nZXRQYXNzd29yZCgpID8gXCIqKipcIiA6IHRoaXMuZ2V0UGFzc3dvcmQoKSkgKyBcIiwgem1xVXJpPVwiICsgdGhpcy5nZXRabXFVcmkoKSArIFwiLCBwcm94eVVyaT1cIiArIHRoaXMuZ2V0UHJveHlVcmkoKSArIFwiLCBwcmlvcml0eT1cIiArIHRoaXMuZ2V0UHJpb3JpdHkoKSArIFwiLCB0aW1lb3V0TXM9XCIgKyB0aGlzLmdldFRpbWVvdXQoKSArIFwiLCBpc09ubGluZT1cIiArIHRoaXMuZ2V0SXNPbmxpbmUoKSArIFwiLCBpc0F1dGhlbnRpY2F0ZWQ9XCIgKyB0aGlzLmdldElzQXV0aGVudGljYXRlZCgpICsgXCIpXCI7XG4gIH1cblxuICBzZXRGYWtlRGlzY29ubmVjdGVkKGZha2VEaXNjb25uZWN0ZWQpIHsgLy8gdXNlZCB0byB0ZXN0IGNvbm5lY3Rpb24gbWFuYWdlclxuICAgIHRoaXMuZmFrZURpc2Nvbm5lY3RlZCA9IGZha2VEaXNjb25uZWN0ZWQ7IFxuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUFJJVkFURSBIRUxQRVJTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHJvdGVjdGVkIGFzeW5jIHF1ZXVlQ2hlY2tDb25uZWN0aW9uPFQ+KGFzeW5jRm46ICgpID0+IFByb21pc2U8VD4pOiBQcm9taXNlPFQ+IHtcbiAgICByZXR1cm4gdGhpcy5jaGVja0Nvbm5lY3Rpb25NdXRleC5zdWJtaXQoYXN5bmNGbik7XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgcXVldWVTZW5kUmVxdWVzdDxUPihhc3luY0ZuOiAoKSA9PiBQcm9taXNlPFQ+KTogUHJvbWlzZTxUPiB7XG4gICAgcmV0dXJuIHRoaXMuc2VuZFJlcXVlc3RNdXRleC5zdWJtaXQoYXN5bmNGbik7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgdmFsaWRhdGVIdHRwUmVzcG9uc2UocmVzcCkge1xuICAgIGxldCBjb2RlID0gcmVzcC5zdGF0dXNDb2RlO1xuICAgIGlmIChjb2RlIDwgMjAwIHx8IGNvZGUgPiAyOTkpIHtcbiAgICAgIGxldCBjb250ZW50ID0gcmVzcC5ib2R5O1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb1JwY0Vycm9yKGNvZGUgKyBcIiBcIiArIHJlc3Auc3RhdHVzVGV4dCArICghY29udGVudCA/IFwiXCIgOiAoXCI6IFwiICsgY29udGVudCkpLCBjb2RlLCB1bmRlZmluZWQsIHVuZGVmaW5lZCk7XG4gICAgfVxuICB9XG4gIFxuICBwcm90ZWN0ZWQgdmFsaWRhdGVScGNSZXNwb25zZShyZXNwLCBtZXRob2QsIHBhcmFtcykge1xuICAgIGlmIChyZXNwLmVycm9yID09PSB1bmRlZmluZWQpIHJldHVybjtcbiAgICBsZXQgZXJyb3JNc2cgPSByZXNwLmVycm9yLm1lc3NhZ2U7XG4gICAgaWYgKGVycm9yTXNnID09PSBcIlwiKSBlcnJvck1zZyA9IFwiUmVjZWl2ZWQgZXJyb3IgcmVzcG9uc2UgZnJvbSBSUEMgcmVxdWVzdCB3aXRoIG1ldGhvZCAnXCIgKyBtZXRob2QgKyBcIicgdG8gXCIgKyB0aGlzLmdldFVyaSgpOyAvLyBUT0RPIChtb25lcm8tcHJvamVjdCk6IHJlc3BvbnNlIHNvbWV0aW1lcyBoYXMgZW1wdHkgZXJyb3IgbWVzc2FnZVxuICAgIHRocm93IG5ldyBNb25lcm9ScGNFcnJvcihyZXNwLmVycm9yLm1lc3NhZ2UsIHJlc3AuZXJyb3IuY29kZSwgbWV0aG9kLCBwYXJhbXMpO1xuICB9XG59XG4iXSwibWFwcGluZ3MiOiJ5TEFBQSxJQUFBQSxTQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxXQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxhQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRyxZQUFBLEdBQUFKLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSSxlQUFBLEdBQUFMLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSyxZQUFBLEdBQUFOLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTSxXQUFBLEdBQUFQLHNCQUFBLENBQUFDLE9B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