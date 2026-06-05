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
   * Indicates if the connection is connected according to the last call to checkConnection().
   * 
   * @return {boolean} true or false to indicate if connected, or undefined if checkConnection() has not been called
   */
  isConnected() {
    return this.isOnline === undefined ? undefined : this.isOnline && this.isAuthenticated !== false;
  }

  /**
   * Indicates if the connection is online according to the last call to checkConnection().
   * 
   * @return {boolean} true or false to indicate if online, or undefined if checkConnection() has not been called
   */
  getIsOnline() {
    return this.isOnline;
  }

  /**
   * Set the connection's online status.
   * 
   * @param {boolean} isOnline - sets if the connection is online
   * @return {MoneroRpcConnection} this connection
   */
  setOnline(isOnline) {
    this.isOnline = isOnline;
    return this;
  }

  /**
   * Indicates if the connection is authenticated according to the last call to checkConnection().
   * 
   * @return {boolean} true if authenticated or no authentication, false if not authenticated, or undefined if checkConnection() has not been called
   */
  getIsAuthenticated() {
    return this.isAuthenticated;
  }

  /**
   * Set the connection's authenticated status.
   * 
   * @param {boolean} isAuthenticated - sets if the connection is authenticated
   * @return {MoneroRpcConnection} this connection
   */
  setAuthenticated(isAuthenticated) {
    this.isAuthenticated = isAuthenticated;
    return this;
  }

  /**
   * Get the response time, which is set automatically by calling checkConnection().
   * 
   * @return {number} the response time of this connection in milliseconds
   */
  getResponseTime() {
    return this.responseTime;
  }

  /**
   * Set the connection's response time.
   * 
   * @param {number} responseTimeMs - response time in milliseconds
   * @return {MoneroRpcConnection} this connection
   */
  setResponseTime(responseTimeMs) {
    this.responseTime = responseTimeMs;
    return this;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfR2VuVXRpbHMiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9IdHRwQ2xpZW50IiwiX0xpYnJhcnlVdGlscyIsIl9Nb25lcm9FcnJvciIsIl9Nb25lcm9ScGNFcnJvciIsIl9Nb25lcm9VdGlscyIsIl9UaHJlYWRQb29sIiwiTW9uZXJvUnBjQ29ubmVjdGlvbiIsIkRFRkFVTFRfQ09ORklHIiwidXJpIiwidW5kZWZpbmVkIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsInptcVVyaSIsInByb3h5VXJpIiwicmVqZWN0VW5hdXRob3JpemVkIiwicHJveHlUb1dvcmtlciIsInByaW9yaXR5IiwidGltZW91dE1zIiwiY29uc3RydWN0b3IiLCJ1cmlPckNvbm5lY3Rpb24iLCJPYmplY3QiLCJhc3NpZ24iLCJzZXRDcmVkZW50aWFscyIsIk1vbmVyb0Vycm9yIiwiR2VuVXRpbHMiLCJub3JtYWxpemVVcmkiLCJjaGVja0Nvbm5lY3Rpb25NdXRleCIsIlRocmVhZFBvb2wiLCJzZW5kUmVxdWVzdE11dGV4IiwiaXNPbmxpbmUiLCJpc0F1dGhlbnRpY2F0ZWQiLCJnZXRVcmkiLCJnZXRVc2VybmFtZSIsImdldFBhc3N3b3JkIiwiZ2V0Wm1xVXJpIiwic2V0Wm1xVXJpIiwiZ2V0UHJveHlVcmkiLCJzZXRQcm94eVVyaSIsImdldFJlamVjdFVuYXV0aG9yaXplZCIsInNldFByb3h5VG9Xb3JrZXIiLCJnZXRQcm94eVRvV29ya2VyIiwic2V0UHJpb3JpdHkiLCJnZXRQcmlvcml0eSIsInNldFRpbWVvdXQiLCJnZXRUaW1lb3V0Iiwic2V0QXR0cmlidXRlIiwia2V5IiwidmFsdWUiLCJhdHRyaWJ1dGVzIiwiTWFwIiwicHV0IiwiZ2V0QXR0cmlidXRlIiwiZ2V0IiwiY2hlY2tDb25uZWN0aW9uIiwicXVldWVDaGVja0Nvbm5lY3Rpb24iLCJMaWJyYXJ5VXRpbHMiLCJsb2FkV2FzbU1vZHVsZSIsImlzT25saW5lQmVmb3JlIiwiaXNBdXRoZW50aWNhdGVkQmVmb3JlIiwic3RhcnRUaW1lIiwiRGF0ZSIsIm5vdyIsImZha2VEaXNjb25uZWN0ZWQiLCJFcnJvciIsImhlaWdodHMiLCJpIiwicHVzaCIsInNlbmRCaW5hcnlSZXF1ZXN0IiwiZXJyIiwicmVzcG9uc2VUaW1lIiwiTW9uZXJvUnBjRXJyb3IiLCJnZXRDb2RlIiwiaXNDb25uZWN0ZWQiLCJnZXRJc09ubGluZSIsInNldE9ubGluZSIsImdldElzQXV0aGVudGljYXRlZCIsInNldEF1dGhlbnRpY2F0ZWQiLCJnZXRSZXNwb25zZVRpbWUiLCJzZXRSZXNwb25zZVRpbWUiLCJyZXNwb25zZVRpbWVNcyIsInNlbmRKc29uUmVxdWVzdCIsIm1ldGhvZCIsInBhcmFtcyIsInF1ZXVlU2VuZFJlcXVlc3QiLCJib2R5IiwiSlNPTiIsInN0cmluZ2lmeSIsImlkIiwianNvbnJwYyIsImdldExvZ0xldmVsIiwibG9nIiwiZ2V0VGltZSIsInJlc3AiLCJIdHRwQ2xpZW50IiwicmVxdWVzdCIsInRpbWVvdXQiLCJ2YWxpZGF0ZUh0dHBSZXNwb25zZSIsInBhcnNlIiwicmVwbGFjZSIsInJlc3BTdHIiLCJzdWJzdHJpbmciLCJNYXRoIiwibWluIiwibGVuZ3RoIiwidmFsaWRhdGVScGNSZXNwb25zZSIsInN0YXR1c0NvZGUiLCJzZW5kUGF0aFJlcXVlc3QiLCJwYXRoIiwicGFyYW1zQmluIiwiTW9uZXJvVXRpbHMiLCJqc29uVG9CaW5hcnkiLCJVaW50OEFycmF5IiwiY29uc29sZSIsImVycm9yIiwibWVzc2FnZSIsImNvZGUiLCJnZXRDb25maWciLCJ0b0pzb24iLCJqc29uIiwidG9TdHJpbmciLCJzZXRGYWtlRGlzY29ubmVjdGVkIiwiYXN5bmNGbiIsInN1Ym1pdCIsImNvbnRlbnQiLCJzdGF0dXNUZXh0IiwiZXJyb3JNc2ciLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL2NvbW1vbi9Nb25lcm9ScGNDb25uZWN0aW9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBHZW5VdGlscyBmcm9tIFwiLi9HZW5VdGlsc1wiO1xuaW1wb3J0IEh0dHBDbGllbnQgZnJvbSBcIi4vSHR0cENsaWVudFwiO1xuaW1wb3J0IExpYnJhcnlVdGlscyBmcm9tIFwiLi9MaWJyYXJ5VXRpbHNcIjtcbmltcG9ydCBNb25lcm9FcnJvciBmcm9tIFwiLi9Nb25lcm9FcnJvclwiO1xuaW1wb3J0IE1vbmVyb1JwY0Vycm9yIGZyb20gXCIuL01vbmVyb1JwY0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvVXRpbHMgZnJvbSBcIi4vTW9uZXJvVXRpbHNcIjtcbmltcG9ydCBUaHJlYWRQb29sIGZyb20gXCIuL1RocmVhZFBvb2xcIjtcblxuLyoqXG4gKiBNYWludGFpbnMgYSBjb25uZWN0aW9uIGFuZCBzZW5kcyByZXF1ZXN0cyB0byBhIE1vbmVybyBSUEMgQVBJLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNb25lcm9ScGNDb25uZWN0aW9uIHtcblxuICAvLyBwdWJsaWMgaW5zdGFuY2UgdmFyaWFibGVzXG4gIHVyaTogc3RyaW5nO1xuICB1c2VybmFtZTogc3RyaW5nO1xuICBwYXNzd29yZDogc3RyaW5nO1xuICB6bXFVcmk6IHN0cmluZztcbiAgcHJveHlVcmk6IHN0cmluZztcbiAgcmVqZWN0VW5hdXRob3JpemVkOiBib29sZWFuO1xuICBwcm94eVRvV29ya2VyOiBib29sZWFuO1xuICBwcmlvcml0eTogbnVtYmVyO1xuICB0aW1lb3V0TXM6IG51bWJlcjtcblxuICAvLyBwcml2YXRlIGluc3RhbmNlIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgaXNPbmxpbmU6IGJvb2xlYW47XG4gIHByb3RlY3RlZCBpc0F1dGhlbnRpY2F0ZWQ6IGJvb2xlYW47XG4gIHByb3RlY3RlZCBhdHRyaWJ1dGVzOiBhbnk7XG4gIHByb3RlY3RlZCBmYWtlRGlzY29ubmVjdGVkOiBib29sZWFuO1xuICBwcm90ZWN0ZWQgcmVzcG9uc2VUaW1lOiBudW1iZXI7XG4gIHByb3RlY3RlZCBjaGVja0Nvbm5lY3Rpb25NdXRleDogVGhyZWFkUG9vbDtcbiAgcHJvdGVjdGVkIHNlbmRSZXF1ZXN0TXV0ZXg6IFRocmVhZFBvb2w7XG5cbiAgLy8gZGVmYXVsdCBjb25maWdcbiAgLyoqIEBwcml2YXRlICovXG4gIHN0YXRpYyBERUZBVUxUX0NPTkZJRzogUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPiA9IHtcbiAgICB1cmk6IHVuZGVmaW5lZCxcbiAgICB1c2VybmFtZTogdW5kZWZpbmVkLFxuICAgIHBhc3N3b3JkOiB1bmRlZmluZWQsXG4gICAgem1xVXJpOiB1bmRlZmluZWQsXG4gICAgcHJveHlVcmk6IHVuZGVmaW5lZCxcbiAgICByZWplY3RVbmF1dGhvcml6ZWQ6IHRydWUsIC8vIHJlamVjdCBzZWxmLXNpZ25lZCBjZXJ0aWZpY2F0ZXMgaWYgdHJ1ZVxuICAgIHByb3h5VG9Xb3JrZXI6IGZhbHNlLFxuICAgIHByaW9yaXR5OiAwLFxuICAgIHRpbWVvdXRNczogdW5kZWZpbmVkXG4gIH1cblxuICAvKipcbiAgICogPHA+Q29uc3RydWN0IGEgUlBDIGNvbm5lY3Rpb24uPC9wPlxuICAgKiBcbiAgICogPHA+RXhhbXBsZXM6PC9wPlxuICAgKiBcbiAgICogPGNvZGU+XG4gICAqIGxldCBjb25uZWN0aW9uMSA9IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKFwiaHR0cDovL2xvY2FsaG9zdDozODA4MVwiLCBcImRhZW1vbl91c2VyXCIsIFwiZGFlbW9uX3Bhc3N3b3JkXzEyM1wiKTxicj48YnI+XG4gICAqIFxuICAgKiBsZXQgY29ubmVjdGlvbjIgPSBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih7PGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgdXJpOiBodHRwOi8vbG9jYWxob3N0OjM4MDgxLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHVzZXJuYW1lOiBcImRhZW1vbl91c2VyXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcGFzc3dvcmQ6IFwiZGFlbW9uX3Bhc3N3b3JkXzEyM1wiLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHJlamVjdFVuYXV0aG9yaXplZDogZmFsc2UsIC8vIGFjY2VwdCBzZWxmLXNpZ25lZCBjZXJ0aWZpY2F0ZXMgZS5nLiBmb3IgbG9jYWwgZGV2ZWxvcG1lbnQ8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBwcm94eVRvV29ya2VyOiB0cnVlIC8vIHByb3h5IHJlcXVlc3QgdG8gd29ya2VyIChkZWZhdWx0IGZhbHNlKTxicj5cbiAgICogfSk7XG4gICAqIDwvY29kZT5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj59IHVyaU9yQ29ubmVjdGlvbiAtIE1vbmVyb1JwY0Nvbm5lY3Rpb24gb3IgVVJJIG9mIHRoZSBSUEMgZW5kcG9pbnRcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVyaU9yQ29ubmVjdGlvbi51cmkgLSBVUkkgb2YgdGhlIFJQQyBlbmRwb2ludFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3VyaU9yQ29ubmVjdGlvbi51c2VybmFtZV0gLSB1c2VybmFtZSB0byBhdXRoZW50aWNhdGUgd2l0aCB0aGUgUlBDIGVuZHBvaW50IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFt1cmlPckNvbm5lY3Rpb24ucGFzc3dvcmRdIC0gcGFzc3dvcmQgdG8gYXV0aGVudGljYXRlIHdpdGggdGhlIFJQQyBlbmRwb2ludCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbdXJpT3JDb25uZWN0aW9uLnptcVVyaV0gLSBVUkkgb2YgdGhlIFpNUSBlbmRwb2ludCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbdXJpT3JDb25uZWN0aW9uLnByb3h5VXJpXSAtIFVSSSBvZiBhIHByb3h5IHNlcnZlciB0byByb3V0ZSByZXF1ZXN0cyB0aHJvdWdoIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbdXJpT3JDb25uZWN0aW9uLnJlamVjdFVuYXV0aG9yaXplZF0gLSByZWplY3RzIHNlbGYtc2lnbmVkIGNlcnRpZmljYXRlcyBpZiB0cnVlIChkZWZhdWx0IHRydWUpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gdXJpT3JDb25uZWN0aW9uLnByb3h5VG9Xb3JrZXIgLSBwcm94eSByZXF1ZXN0cyB0byB3b3JrZXIgKGRlZmF1bHQgdHJ1ZSlcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVzZXJuYW1lIC0gdXNlcm5hbWUgdG8gYXV0aGVudGljYXRlIHdpdGggdGhlIFJQQyBlbmRwb2ludCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXNzd29yZCAtIHBhc3N3b3JkIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIHRoZSBSUEMgZW5kcG9pbnQgKG9wdGlvbmFsKVxuICAgKi9cbiAgY29uc3RydWN0b3IodXJpT3JDb25uZWN0aW9uOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+LCB1c2VybmFtZT86IHN0cmluZywgcGFzc3dvcmQ/OiBzdHJpbmcpIHtcblxuICAgIC8vIHZhbGlkYXRlIGFuZCBub3JtYWxpemUgY29uZmlnXG4gICAgaWYgKHR5cGVvZiB1cmlPckNvbm5lY3Rpb24gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIE9iamVjdC5hc3NpZ24odGhpcywgTW9uZXJvUnBjQ29ubmVjdGlvbi5ERUZBVUxUX0NPTkZJRyk7XG4gICAgICB0aGlzLnVyaSA9IHVyaU9yQ29ubmVjdGlvbjtcbiAgICAgIHRoaXMuc2V0Q3JlZGVudGlhbHModXNlcm5hbWUsIHBhc3N3b3JkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHVzZXJuYW1lICE9PSB1bmRlZmluZWQgfHwgcGFzc3dvcmQgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2FuIHByb3ZpZGUgY29uZmlnIG9iamVjdCBvciBwYXJhbXMgYnV0IG5vdCBib3RoXCIpO1xuICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLCBNb25lcm9ScGNDb25uZWN0aW9uLkRFRkFVTFRfQ09ORklHLCB1cmlPckNvbm5lY3Rpb24pO1xuICAgICAgdGhpcy5zZXRDcmVkZW50aWFscyh0aGlzLnVzZXJuYW1lLCB0aGlzLnBhc3N3b3JkKTtcbiAgICB9XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIHVyaXNcbiAgICBpZiAodGhpcy51cmkpIHRoaXMudXJpID0gR2VuVXRpbHMubm9ybWFsaXplVXJpKHRoaXMudXJpKTtcbiAgICBpZiAodGhpcy56bXFVcmkpIHRoaXMuem1xVXJpID0gR2VuVXRpbHMubm9ybWFsaXplVXJpKHRoaXMuem1xVXJpKTtcbiAgICBpZiAodGhpcy5wcm94eVVyaSkgdGhpcy5wcm94eVVyaSA9IEdlblV0aWxzLm5vcm1hbGl6ZVVyaSh0aGlzLnByb3h5VXJpKTtcblxuICAgIC8vIGluaXRpYWxpemUgbXV0ZXhlc1xuICAgIHRoaXMuY2hlY2tDb25uZWN0aW9uTXV0ZXggPSBuZXcgVGhyZWFkUG9vbCgxKTtcbiAgICB0aGlzLnNlbmRSZXF1ZXN0TXV0ZXggPSBuZXcgVGhyZWFkUG9vbCgxKTtcbiAgfVxuICBcbiAgc2V0Q3JlZGVudGlhbHModXNlcm5hbWUsIHBhc3N3b3JkKSB7XG4gICAgaWYgKHVzZXJuYW1lID09PSBcIlwiKSB1c2VybmFtZSA9IHVuZGVmaW5lZDtcbiAgICBpZiAocGFzc3dvcmQgPT09IFwiXCIpIHBhc3N3b3JkID0gdW5kZWZpbmVkO1xuICAgIGlmICh1c2VybmFtZSB8fCBwYXNzd29yZCkge1xuICAgICAgaWYgKCF1c2VybmFtZSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwidXNlcm5hbWUgbXVzdCBiZSBkZWZpbmVkIGJlY2F1c2UgcGFzc3dvcmQgaXMgZGVmaW5lZFwiKTtcbiAgICAgIGlmICghcGFzc3dvcmQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcInBhc3N3b3JkIG11c3QgYmUgZGVmaW5lZCBiZWNhdXNlIHVzZXJuYW1lIGlzIGRlZmluZWRcIik7XG4gICAgfVxuICAgIGlmICh0aGlzLnVzZXJuYW1lID09PSBcIlwiKSB0aGlzLnVzZXJuYW1lID0gdW5kZWZpbmVkO1xuICAgIGlmICh0aGlzLnBhc3N3b3JkID09PSBcIlwiKSB0aGlzLnBhc3N3b3JkID0gdW5kZWZpbmVkO1xuICAgIGlmICh0aGlzLnVzZXJuYW1lICE9PSB1c2VybmFtZSB8fCB0aGlzLnBhc3N3b3JkICE9PSBwYXNzd29yZCkge1xuICAgICAgdGhpcy5pc09ubGluZSA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICB0aGlzLnVzZXJuYW1lID0gdXNlcm5hbWU7XG4gICAgdGhpcy5wYXNzd29yZCA9IHBhc3N3b3JkO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBnZXRVcmkoKSB7XG4gICAgcmV0dXJuIHRoaXMudXJpO1xuICB9XG5cbiAgZ2V0VXNlcm5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMudXNlcm5hbWUgPyB0aGlzLnVzZXJuYW1lIDogXCJcIjtcbiAgfVxuICBcbiAgZ2V0UGFzc3dvcmQoKSB7XG4gICAgcmV0dXJuIHRoaXMucGFzc3dvcmQgPyB0aGlzLnBhc3N3b3JkIDogXCJcIjtcbiAgfVxuXG4gIGdldFptcVVyaSgpIHtcbiAgICByZXR1cm4gdGhpcy56bXFVcmk7XG4gIH1cblxuICBzZXRabXFVcmkoem1xVXJpKSB7XG4gICAgdGhpcy56bXFVcmkgPSB6bXFVcmk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIGdldFByb3h5VXJpKCkge1xuICAgIHJldHVybiB0aGlzLnByb3h5VXJpO1xuICB9XG5cbiAgc2V0UHJveHlVcmkocHJveHlVcmkpIHtcbiAgICB0aGlzLnByb3h5VXJpID0gcHJveHlVcmk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIGdldFJlamVjdFVuYXV0aG9yaXplZCgpIHtcbiAgICByZXR1cm4gdGhpcy5yZWplY3RVbmF1dGhvcml6ZWQ7XG4gIH1cbiAgXG4gIHNldFByb3h5VG9Xb3JrZXIocHJveHlUb1dvcmtlcikge1xuICAgIHRoaXMucHJveHlUb1dvcmtlciA9IHByb3h5VG9Xb3JrZXI7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIGdldFByb3h5VG9Xb3JrZXIoKSB7XG4gICAgcmV0dXJuIHRoaXMucHJveHlUb1dvcmtlcjtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNldCB0aGUgY29ubmVjdGlvbidzIHByaW9yaXR5IHJlbGF0aXZlIHRvIG90aGVyIGNvbm5lY3Rpb25zLiBQcmlvcml0eSAxIGlzIGhpZ2hlc3QsXG4gICAqIHRoZW4gcHJpb3JpdHkgMiwgZXRjLiBUaGUgZGVmYXVsdCBwcmlvcml0eSBvZiAwIGlzIGxvd2VzdCBwcmlvcml0eS5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcHJpb3JpdHldIC0gdGhlIGNvbm5lY3Rpb24gcHJpb3JpdHkgKGRlZmF1bHQgMClcbiAgICogQHJldHVybiB7TW9uZXJvUnBjQ29ubmVjdGlvbn0gdGhpcyBjb25uZWN0aW9uXG4gICAqL1xuICBzZXRQcmlvcml0eShwcmlvcml0eSkge1xuICAgIGlmICghKHByaW9yaXR5ID49IDApKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJQcmlvcml0eSBtdXN0IGJlID49IDBcIik7XG4gICAgdGhpcy5wcmlvcml0eSA9IHByaW9yaXR5O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZ2V0UHJpb3JpdHkoKSB7XG4gICAgcmV0dXJuIHRoaXMucHJpb3JpdHk7IFxuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgUlBDIHJlcXVlc3QgdGltZW91dCBpbiBtaWxsaXNlY29uZHMuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gdGltZW91dE1zIGlzIHRoZSB0aW1lb3V0IGluIG1pbGxpc2Vjb25kcywgMCB0byBkaXNhYmxlIHRpbWVvdXQsIG9yIHVuZGVmaW5lZCB0byB1c2UgZGVmYXVsdFxuICAgKiBAcmV0dXJuIHtNb25lcm9ScGNDb25uZWN0aW9ufSB0aGlzIGNvbm5lY3Rpb25cbiAgICovXG4gIHNldFRpbWVvdXQodGltZW91dE1zOiBudW1iZXIpIHtcbiAgICB0aGlzLnRpbWVvdXRNcyA9IHRpbWVvdXRNcztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldFRpbWVvdXQoKSB7XG4gICAgcmV0dXJuIHRoaXMudGltZW91dE1zO1xuICB9XG4gIFxuICBzZXRBdHRyaWJ1dGUoa2V5LCB2YWx1ZSkge1xuICAgIGlmICghdGhpcy5hdHRyaWJ1dGVzKSB0aGlzLmF0dHJpYnV0ZXMgPSBuZXcgTWFwKCk7XG4gICAgdGhpcy5hdHRyaWJ1dGVzLnB1dChrZXksIHZhbHVlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgZ2V0QXR0cmlidXRlKGtleSkge1xuICAgIHJldHVybiB0aGlzLmF0dHJpYnV0ZXMuZ2V0KGtleSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDaGVjayB0aGUgY29ubmVjdGlvbiBzdGF0dXMgdG8gdXBkYXRlIGlzT25saW5lLCBpc0F1dGhlbnRpY2F0ZWQsIGFuZCByZXNwb25zZSB0aW1lLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IHRpbWVvdXRNcyAtIG1heGltdW0gcmVzcG9uc2UgdGltZSBiZWZvcmUgY29uc2lkZXJlZCBvZmZsaW5lXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgdGhlcmUgaXMgYSBjaGFuZ2UgaW4gc3RhdHVzLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGNoZWNrQ29ubmVjdGlvbih0aW1lb3V0TXMpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICByZXR1cm4gdGhpcy5xdWV1ZUNoZWNrQ29ubmVjdGlvbihhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCBMaWJyYXJ5VXRpbHMubG9hZFdhc21Nb2R1bGUoKTsgLy8gY2FjaGUgd2FzbSBmb3IgYmluYXJ5IHJlcXVlc3RcbiAgICAgIGxldCBpc09ubGluZUJlZm9yZSA9IHRoaXMuaXNPbmxpbmU7XG4gICAgICBsZXQgaXNBdXRoZW50aWNhdGVkQmVmb3JlID0gdGhpcy5pc0F1dGhlbnRpY2F0ZWQ7XG4gICAgICBsZXQgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmICh0aGlzLmZha2VEaXNjb25uZWN0ZWQpIHRocm93IG5ldyBFcnJvcihcIkNvbm5lY3Rpb24gaXMgZmFrZSBkaXNjb25uZWN0ZWRcIik7XG4gICAgICAgIGxldCBoZWlnaHRzID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTAwOyBpKyspIGhlaWdodHMucHVzaChpKTtcbiAgICAgICAgYXdhaXQgdGhpcy5zZW5kQmluYXJ5UmVxdWVzdChcImdldF9ibG9ja3NfYnlfaGVpZ2h0LmJpblwiLCB7aGVpZ2h0czogaGVpZ2h0c30sIHRpbWVvdXRNcyk7IC8vIGFzc3VtZSBkYWVtb24gY29ubmVjdGlvblxuICAgICAgICB0aGlzLmlzT25saW5lID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSB0cnVlO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHRoaXMuaXNPbmxpbmUgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMucmVzcG9uc2VUaW1lID0gdW5kZWZpbmVkO1xuICAgICAgICBpZiAoZXJyIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IpIHtcbiAgICAgICAgICBpZiAoZXJyLmdldENvZGUoKSA9PT0gNDAxKSB7XG4gICAgICAgICAgICB0aGlzLmlzT25saW5lID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gZmFsc2U7XG4gICAgICAgICAgfSBlbHNlIGlmIChlcnIuZ2V0Q29kZSgpID09PSA0MDQpIHsgLy8gZmFsbGJhY2sgdG8gbGF0ZW5jeSBjaGVja1xuICAgICAgICAgICAgdGhpcy5pc09ubGluZSA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5pc09ubGluZSkgdGhpcy5yZXNwb25zZVRpbWUgPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuICAgICAgcmV0dXJuIGlzT25saW5lQmVmb3JlICE9PSB0aGlzLmlzT25saW5lIHx8IGlzQXV0aGVudGljYXRlZEJlZm9yZSAhPT0gdGhpcy5pc0F1dGhlbnRpY2F0ZWQ7XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGNvbm5lY3Rpb24gaXMgY29ubmVjdGVkIGFjY29yZGluZyB0byB0aGUgbGFzdCBjYWxsIHRvIGNoZWNrQ29ubmVjdGlvbigpLlxuICAgKiBcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBvciBmYWxzZSB0byBpbmRpY2F0ZSBpZiBjb25uZWN0ZWQsIG9yIHVuZGVmaW5lZCBpZiBjaGVja0Nvbm5lY3Rpb24oKSBoYXMgbm90IGJlZW4gY2FsbGVkXG4gICAqL1xuICBpc0Nvbm5lY3RlZCgpIHtcbiAgICByZXR1cm4gdGhpcy5pc09ubGluZSA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogdGhpcy5pc09ubGluZSAmJiB0aGlzLmlzQXV0aGVudGljYXRlZCAhPT0gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBjb25uZWN0aW9uIGlzIG9ubGluZSBhY2NvcmRpbmcgdG8gdGhlIGxhc3QgY2FsbCB0byBjaGVja0Nvbm5lY3Rpb24oKS5cbiAgICogXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgb3IgZmFsc2UgdG8gaW5kaWNhdGUgaWYgb25saW5lLCBvciB1bmRlZmluZWQgaWYgY2hlY2tDb25uZWN0aW9uKCkgaGFzIG5vdCBiZWVuIGNhbGxlZFxuICAgKi9cbiAgZ2V0SXNPbmxpbmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNPbmxpbmU7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBjb25uZWN0aW9uJ3Mgb25saW5lIHN0YXR1cy5cbiAgICogXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNPbmxpbmUgLSBzZXRzIGlmIHRoZSBjb25uZWN0aW9uIGlzIG9ubGluZVxuICAgKiBAcmV0dXJuIHtNb25lcm9ScGNDb25uZWN0aW9ufSB0aGlzIGNvbm5lY3Rpb25cbiAgICovXG4gIHNldE9ubGluZShpc09ubGluZSkge1xuICAgIHRoaXMuaXNPbmxpbmUgPSBpc09ubGluZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGNvbm5lY3Rpb24gaXMgYXV0aGVudGljYXRlZCBhY2NvcmRpbmcgdG8gdGhlIGxhc3QgY2FsbCB0byBjaGVja0Nvbm5lY3Rpb24oKS5cbiAgICogXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgYXV0aGVudGljYXRlZCBvciBubyBhdXRoZW50aWNhdGlvbiwgZmFsc2UgaWYgbm90IGF1dGhlbnRpY2F0ZWQsIG9yIHVuZGVmaW5lZCBpZiBjaGVja0Nvbm5lY3Rpb24oKSBoYXMgbm90IGJlZW4gY2FsbGVkXG4gICAqL1xuICBnZXRJc0F1dGhlbnRpY2F0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNBdXRoZW50aWNhdGVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgY29ubmVjdGlvbidzIGF1dGhlbnRpY2F0ZWQgc3RhdHVzLlxuICAgKiBcbiAgICogQHBhcmFtIHtib29sZWFufSBpc0F1dGhlbnRpY2F0ZWQgLSBzZXRzIGlmIHRoZSBjb25uZWN0aW9uIGlzIGF1dGhlbnRpY2F0ZWRcbiAgICogQHJldHVybiB7TW9uZXJvUnBjQ29ubmVjdGlvbn0gdGhpcyBjb25uZWN0aW9uXG4gICAqL1xuICBzZXRBdXRoZW50aWNhdGVkKGlzQXV0aGVudGljYXRlZCkge1xuICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gaXNBdXRoZW50aWNhdGVkO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgcmVzcG9uc2UgdGltZSwgd2hpY2ggaXMgc2V0IGF1dG9tYXRpY2FsbHkgYnkgY2FsbGluZyBjaGVja0Nvbm5lY3Rpb24oKS5cbiAgICogXG4gICAqIEByZXR1cm4ge251bWJlcn0gdGhlIHJlc3BvbnNlIHRpbWUgb2YgdGhpcyBjb25uZWN0aW9uIGluIG1pbGxpc2Vjb25kc1xuICAgKi9cbiAgZ2V0UmVzcG9uc2VUaW1lKCkge1xuICAgIHJldHVybiB0aGlzLnJlc3BvbnNlVGltZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGNvbm5lY3Rpb24ncyByZXNwb25zZSB0aW1lLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IHJlc3BvbnNlVGltZU1zIC0gcmVzcG9uc2UgdGltZSBpbiBtaWxsaXNlY29uZHNcbiAgICogQHJldHVybiB7TW9uZXJvUnBjQ29ubmVjdGlvbn0gdGhpcyBjb25uZWN0aW9uXG4gICAqL1xuICBzZXRSZXNwb25zZVRpbWUocmVzcG9uc2VUaW1lTXMpIHtcbiAgICB0aGlzLnJlc3BvbnNlVGltZSA9IHJlc3BvbnNlVGltZU1zO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFNlbmQgYSBKU09OIFJQQyByZXF1ZXN0LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1ldGhvZCAtIEpTT04gUlBDIG1ldGhvZCB0byBpbnZva2VcbiAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcyAtIHJlcXVlc3QgcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0ge251bWJlcn0gW3RpbWVvdXRNc10gLSBvdmVycmlkZXMgdGhlIHJlcXVlc3QgdGltZW91dCBpbiBtaWxsaXNlY29uZHNcbiAgICogQHJldHVybiB7b2JqZWN0fSBpcyB0aGUgcmVzcG9uc2UgbWFwXG4gICAqL1xuICBhc3luYyBzZW5kSnNvblJlcXVlc3QobWV0aG9kLCBwYXJhbXM/LCB0aW1lb3V0TXM/KTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gdGhpcy5xdWV1ZVNlbmRSZXF1ZXN0KGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG5cbiAgICAgICAgLy8gYnVpbGQgcmVxdWVzdCBib2R5XG4gICAgICAgIGxldCBib2R5ID0gSlNPTi5zdHJpbmdpZnkoeyAgLy8gYm9keSBpcyBzdHJpbmdpZmllZCBzbyB0ZXh0L3BsYWluIGlzIHJldHVybmVkIHNvIGJpZ2ludHMgYXJlIHByZXNlcnZlZFxuICAgICAgICAgIGlkOiBcIjBcIixcbiAgICAgICAgICBqc29ucnBjOiBcIjIuMFwiLFxuICAgICAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgICAgIHBhcmFtczogcGFyYW1zXG4gICAgICAgIH0pO1xuICBcbiAgICAgICAgLy8gbG9nZ2luZ1xuICAgICAgICBpZiAoTGlicmFyeVV0aWxzLmdldExvZ0xldmVsKCkgPj0gMikgTGlicmFyeVV0aWxzLmxvZygyLCBcIlNlbmRpbmcganNvbiByZXF1ZXN0IHdpdGggbWV0aG9kICdcIiArIG1ldGhvZCArIFwiJyBhbmQgYm9keTogXCIgKyBib2R5KTtcblxuICAgICAgICAvLyBwcm94eSB1cmkgaXMgbm90IHN1cHBvcnRlZFxuICAgICAgICBpZiAodGhpcy5nZXRQcm94eVVyaSgpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJQcm94eSBVUkkgbm90IHN1cHBvcnRlZCBmb3IgSlNPTiByZXF1ZXN0c1wiKTtcbiAgICAgICAgXG4gICAgICAgIC8vIHNlbmQgaHR0cCByZXF1ZXN0XG4gICAgICAgIGxldCBzdGFydFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgbGV0IHJlc3AgPSBhd2FpdCBIdHRwQ2xpZW50LnJlcXVlc3Qoe1xuICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgICAgdXJpOiB0aGlzLmdldFVyaSgpICsgJy9qc29uX3JwYycsXG4gICAgICAgICAgdXNlcm5hbWU6IHRoaXMuZ2V0VXNlcm5hbWUoKSxcbiAgICAgICAgICBwYXNzd29yZDogdGhpcy5nZXRQYXNzd29yZCgpLFxuICAgICAgICAgIGJvZHk6IGJvZHksXG4gICAgICAgICAgdGltZW91dDogdGltZW91dE1zID09PSB1bmRlZmluZWQgPyB0aGlzLnRpbWVvdXRNcyA6IHRpbWVvdXRNcyxcbiAgICAgICAgICByZWplY3RVbmF1dGhvcml6ZWQ6IHRoaXMucmVqZWN0VW5hdXRob3JpemVkLFxuICAgICAgICAgIHByb3h5VG9Xb3JrZXI6IHRoaXMucHJveHlUb1dvcmtlclxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIHZhbGlkYXRlIHJlc3BvbnNlXG4gICAgICAgIE1vbmVyb1JwY0Nvbm5lY3Rpb24udmFsaWRhdGVIdHRwUmVzcG9uc2UocmVzcCk7XG4gICAgICAgIFxuICAgICAgICAvLyBkZXNlcmlhbGl6ZSByZXNwb25zZVxuICAgICAgICBpZiAocmVzcC5ib2R5WzBdICE9ICd7JykgdGhyb3cgcmVzcC5ib2R5O1xuICAgICAgICByZXNwID0gSlNPTi5wYXJzZShyZXNwLmJvZHkucmVwbGFjZSgvKFwiW15cIl0qXCJcXHMqOlxccyopKFxcZHsxNix9KS9nLCAnJDFcIiQyXCInKSk7ICAvLyByZXBsYWNlIDE2IG9yIG1vcmUgZGlnaXRzIHdpdGggc3RyaW5ncyBhbmQgcGFyc2VcbiAgICAgICAgaWYgKExpYnJhcnlVdGlscy5nZXRMb2dMZXZlbCgpID49IDMpIHtcbiAgICAgICAgICBsZXQgcmVzcFN0ciA9IEpTT04uc3RyaW5naWZ5KHJlc3ApO1xuICAgICAgICAgIExpYnJhcnlVdGlscy5sb2coMywgXCJSZWNlaXZlZCByZXNwb25zZSBmcm9tIG1ldGhvZD0nXCIgKyBtZXRob2QgKyBcIicsIHJlc3BvbnNlPVwiICsgcmVzcFN0ci5zdWJzdHJpbmcoMCwgTWF0aC5taW4oMTAwMCwgcmVzcFN0ci5sZW5ndGgpKSArIFwiKFwiICsgKG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gc3RhcnRUaW1lKSArIFwiIG1zKVwiKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gY2hlY2sgcnBjIHJlc3BvbnNlIGZvciBlcnJvcnNcbiAgICAgICAgdGhpcy52YWxpZGF0ZVJwY1Jlc3BvbnNlKHJlc3AsIG1ldGhvZCwgcGFyYW1zKTtcbiAgICAgICAgcmV0dXJuIHJlc3A7XG4gICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICBpZiAoZXJyIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IpIHRocm93IGVycjtcbiAgICAgICAgZWxzZSB0aHJvdyBuZXcgTW9uZXJvUnBjRXJyb3IoZXJyLCBlcnIuc3RhdHVzQ29kZSwgbWV0aG9kLCBwYXJhbXMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogU2VuZCBhIFJQQyByZXF1ZXN0IHRvIHRoZSBnaXZlbiBwYXRoIGFuZCB3aXRoIHRoZSBnaXZlbiBwYXJhbXRlcnMuXG4gICAqIFxuICAgKiBFLmcuIFwiL2dldF90cmFuc2FjdGlvbnNcIiB3aXRoIHBhcmFtc1xuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggLSBKU09OIFJQQyBwYXRoIHRvIGludm9rZVxuICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zIC0gcmVxdWVzdCBwYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbdGltZW91dE1zXSAtIG92ZXJyaWRlcyB0aGUgcmVxdWVzdCB0aW1lb3V0IGluIG1pbGxpc2Vjb25kc1xuICAgKiBAcmV0dXJuIHtvYmplY3R9IGlzIHRoZSByZXNwb25zZSBtYXBcbiAgICovXG4gIGFzeW5jIHNlbmRQYXRoUmVxdWVzdChwYXRoLCBwYXJhbXM/LCB0aW1lb3V0TXM/KTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gdGhpcy5xdWV1ZVNlbmRSZXF1ZXN0KGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG5cbiAgICAgICAgLy8gbG9nZ2luZ1xuICAgICAgICBpZiAoTGlicmFyeVV0aWxzLmdldExvZ0xldmVsKCkgPj0gMikgTGlicmFyeVV0aWxzLmxvZygyLCBcIlNlbmRpbmcgcGF0aCByZXF1ZXN0IHdpdGggcGF0aCAnXCIgKyBwYXRoICsgXCInIGFuZCBwYXJhbXM6IFwiICsgSlNPTi5zdHJpbmdpZnkocGFyYW1zKSk7XG5cbiAgICAgICAgLy8gcHJveHkgdXJpIGlzIG5vdCBzdXBwb3J0ZWRcbiAgICAgICAgaWYgKHRoaXMuZ2V0UHJveHlVcmkoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiUHJveHkgVVJJIG5vdCBzdXBwb3J0ZWQgZm9yIHBhdGggcmVxdWVzdHNcIik7XG4gICAgICAgIFxuICAgICAgICAvLyBzZW5kIGh0dHAgcmVxdWVzdFxuICAgICAgICBsZXQgc3RhcnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgIGxldCByZXNwID0gYXdhaXQgSHR0cENsaWVudC5yZXF1ZXN0KHtcbiAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgIHVyaTogdGhpcy5nZXRVcmkoKSArICcvJyArIHBhdGgsXG4gICAgICAgICAgdXNlcm5hbWU6IHRoaXMuZ2V0VXNlcm5hbWUoKSxcbiAgICAgICAgICBwYXNzd29yZDogdGhpcy5nZXRQYXNzd29yZCgpLFxuICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHBhcmFtcyksICAvLyBib2R5IGlzIHN0cmluZ2lmaWVkIHNvIHRleHQvcGxhaW4gaXMgcmV0dXJuZWQgc28gYmlnaW50cyBhcmUgcHJlc2VydmVkXG4gICAgICAgICAgdGltZW91dDogdGltZW91dE1zID09PSB1bmRlZmluZWQgPyB0aGlzLnRpbWVvdXRNcyA6IHRpbWVvdXRNcyxcbiAgICAgICAgICByZWplY3RVbmF1dGhvcml6ZWQ6IHRoaXMucmVqZWN0VW5hdXRob3JpemVkLFxuICAgICAgICAgIHByb3h5VG9Xb3JrZXI6IHRoaXMucHJveHlUb1dvcmtlclxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIHZhbGlkYXRlIHJlc3BvbnNlXG4gICAgICAgIE1vbmVyb1JwY0Nvbm5lY3Rpb24udmFsaWRhdGVIdHRwUmVzcG9uc2UocmVzcCk7XG4gICAgICAgIFxuICAgICAgICAvLyBkZXNlcmlhbGl6ZSByZXNwb25zZVxuICAgICAgICBpZiAocmVzcC5ib2R5WzBdICE9ICd7JykgdGhyb3cgcmVzcC5ib2R5O1xuICAgICAgICByZXNwID0gSlNPTi5wYXJzZShyZXNwLmJvZHkucmVwbGFjZSgvKFwiW15cIl0qXCJcXHMqOlxccyopKFxcZHsxNix9KS9nLCAnJDFcIiQyXCInKSk7ICAvLyByZXBsYWNlIDE2IG9yIG1vcmUgZGlnaXRzIHdpdGggc3RyaW5ncyBhbmQgcGFyc2VcbiAgICAgICAgaWYgKHR5cGVvZiByZXNwID09PSBcInN0cmluZ1wiKSByZXNwID0gSlNPTi5wYXJzZShyZXNwKTsgIC8vIFRPRE86IHNvbWUgcmVzcG9uc2VzIHJldHVybmVkIGFzIHN0cmluZ3M/XG4gICAgICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0TG9nTGV2ZWwoKSA+PSAzKSB7XG4gICAgICAgICAgbGV0IHJlc3BTdHIgPSBKU09OLnN0cmluZ2lmeShyZXNwKTtcbiAgICAgICAgICBMaWJyYXJ5VXRpbHMubG9nKDMsIFwiUmVjZWl2ZWQgcmVzcG9uc2UgZnJvbSBwYXRoPSdcIiArIHBhdGggKyBcIicsIHJlc3BvbnNlPVwiICsgcmVzcFN0ci5zdWJzdHJpbmcoMCwgTWF0aC5taW4oMTAwMCwgcmVzcFN0ci5sZW5ndGgpKSArIFwiKFwiICsgKG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gc3RhcnRUaW1lKSArIFwiIG1zKVwiKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gY2hlY2sgcnBjIHJlc3BvbnNlIGZvciBlcnJvcnNcbiAgICAgICAgdGhpcy52YWxpZGF0ZVJwY1Jlc3BvbnNlKHJlc3AsIHBhdGgsIHBhcmFtcyk7XG4gICAgICAgIHJldHVybiByZXNwO1xuICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yKSB0aHJvdyBlcnI7XG4gICAgICAgIGVsc2UgdGhyb3cgbmV3IE1vbmVyb1JwY0Vycm9yKGVyciwgZXJyLnN0YXR1c0NvZGUsIHBhdGgsIHBhcmFtcyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZW5kIGEgYmluYXJ5IFJQQyByZXF1ZXN0LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggLSBwYXRoIG9mIHRoZSBiaW5hcnkgUlBDIG1ldGhvZCB0byBpbnZva2VcbiAgICogQHBhcmFtIHtvYmplY3R9IFtwYXJhbXNdIC0gcmVxdWVzdCBwYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbdGltZW91dE1zXSAtIHJlcXVlc3QgdGltZW91dCBpbiBtaWxsaXNlY29uZHNcbiAgICogQHJldHVybiB7VWludDhBcnJheX0gdGhlIGJpbmFyeSByZXNwb25zZVxuICAgKi9cbiAgYXN5bmMgc2VuZEJpbmFyeVJlcXVlc3QocGF0aCwgcGFyYW1zPywgdGltZW91dE1zPyk6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIHRoaXMucXVldWVTZW5kUmVxdWVzdChhc3luYyAoKSA9PiB7XG5cbiAgICAgIC8vIHNlcmlhbGl6ZSBwYXJhbXNcbiAgICAgIGxldCBwYXJhbXNCaW4gPSBhd2FpdCBNb25lcm9VdGlscy5qc29uVG9CaW5hcnkocGFyYW1zKTtcbiAgICAgICAgICBcbiAgICAgIHRyeSB7XG5cbiAgICAgICAgLy8gbG9nZ2luZ1xuICAgICAgICBpZiAoTGlicmFyeVV0aWxzLmdldExvZ0xldmVsKCkgPj0gMikgTGlicmFyeVV0aWxzLmxvZygyLCBcIlNlbmRpbmcgYmluYXJ5IHJlcXVlc3Qgd2l0aCBwYXRoICdcIiArIHBhdGggKyBcIicgYW5kIHBhcmFtczogXCIgKyBKU09OLnN0cmluZ2lmeShwYXJhbXMpKTtcblxuICAgICAgICAvLyBwcm94eSB1cmkgaXMgbm90IHN1cHBvcnRlZFxuICAgICAgICBpZiAodGhpcy5nZXRQcm94eVVyaSgpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJQcm94eSBVUkkgbm90IHN1cHBvcnRlZCBmb3IgYmluYXJ5IHJlcXVlc3RzXCIpO1xuICAgICAgICBcbiAgICAgICAgLy8gc2VuZCBodHRwIHJlcXVlc3RcbiAgICAgICAgbGV0IHJlc3AgPSBhd2FpdCBIdHRwQ2xpZW50LnJlcXVlc3Qoe1xuICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgICAgdXJpOiB0aGlzLmdldFVyaSgpICsgJy8nICsgcGF0aCxcbiAgICAgICAgICB1c2VybmFtZTogdGhpcy5nZXRVc2VybmFtZSgpLFxuICAgICAgICAgIHBhc3N3b3JkOiB0aGlzLmdldFBhc3N3b3JkKCksXG4gICAgICAgICAgYm9keTogcGFyYW1zQmluLFxuICAgICAgICAgIHRpbWVvdXQ6IHRpbWVvdXRNcyA9PT0gdW5kZWZpbmVkID8gdGhpcy50aW1lb3V0TXMgOiB0aW1lb3V0TXMsXG4gICAgICAgICAgcmVqZWN0VW5hdXRob3JpemVkOiB0aGlzLnJlamVjdFVuYXV0aG9yaXplZCxcbiAgICAgICAgICBwcm94eVRvV29ya2VyOiB0aGlzLnByb3h5VG9Xb3JrZXJcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyB2YWxpZGF0ZSByZXNwb25zZVxuICAgICAgICBNb25lcm9ScGNDb25uZWN0aW9uLnZhbGlkYXRlSHR0cFJlc3BvbnNlKHJlc3ApO1xuICAgICAgICBcbiAgICAgICAgLy8gcHJvY2VzcyByZXNwb25zZVxuICAgICAgICByZXNwID0gcmVzcC5ib2R5O1xuICAgICAgICBpZiAoIShyZXNwIGluc3RhbmNlb2YgVWludDhBcnJheSkpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwicmVzcCBpcyBub3QgdWludDhhcnJheVwiKTtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKHJlc3ApO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZXNwLmVycm9yKSB0aHJvdyBuZXcgTW9uZXJvUnBjRXJyb3IocmVzcC5lcnJvci5tZXNzYWdlLCByZXNwLmVycm9yLmNvZGUsIHBhdGgsIHBhcmFtcyk7XG4gICAgICAgIHJldHVybiByZXNwO1xuICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yKSB0aHJvdyBlcnI7XG4gICAgICAgIGVsc2UgdGhyb3cgbmV3IE1vbmVyb1JwY0Vycm9yKGVyciwgZXJyLnN0YXR1c0NvZGUsIHBhdGgsIHBhcmFtcyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBnZXRDb25maWcoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHVyaTogdGhpcy51cmksXG4gICAgICB1c2VybmFtZTogdGhpcy51c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkOiB0aGlzLnBhc3N3b3JkLFxuICAgICAgem1xVXJpOiB0aGlzLnptcVVyaSxcbiAgICAgIHByb3h5VXJpOiB0aGlzLnByb3h5VXJpLFxuICAgICAgcmVqZWN0VW5hdXRob3JpemVkOiB0aGlzLnJlamVjdFVuYXV0aG9yaXplZCxcbiAgICAgIHByb3h5VG9Xb3JrZXI6IHRoaXMucHJveHlUb1dvcmtlcixcbiAgICAgIHByaW9yaXR5OiB0aGlzLnByaW9yaXR5LFxuICAgICAgdGltZW91dE1zOiB0aGlzLnRpbWVvdXRNc1xuICAgIH07XG4gIH1cblxuICB0b0pzb24oKSB7XG4gICAgbGV0IGpzb24gPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzKVxuICAgIGpzb24uY2hlY2tDb25uZWN0aW9uTXV0ZXggPSB1bmRlZmluZWQ7XG4gICAganNvbi5zZW5kUmVxdWVzdE11dGV4ID0gdW5kZWZpbmVkO1xuICAgIHJldHVybiBqc29uO1xuICB9XG4gIFxuICB0b1N0cmluZygpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRVcmkoKSArIFwiICh1c2VybmFtZT1cIiArIHRoaXMuZ2V0VXNlcm5hbWUoKSArIFwiLCBwYXNzd29yZD1cIiArICh0aGlzLmdldFBhc3N3b3JkKCkgPyBcIioqKlwiIDogdGhpcy5nZXRQYXNzd29yZCgpKSArIFwiLCB6bXFVcmk9XCIgKyB0aGlzLmdldFptcVVyaSgpICsgXCIsIHByb3h5VXJpPVwiICsgdGhpcy5nZXRQcm94eVVyaSgpICsgXCIsIHByaW9yaXR5PVwiICsgdGhpcy5nZXRQcmlvcml0eSgpICsgXCIsIHRpbWVvdXRNcz1cIiArIHRoaXMuZ2V0VGltZW91dCgpICsgXCIsIGlzT25saW5lPVwiICsgdGhpcy5nZXRJc09ubGluZSgpICsgXCIsIGlzQXV0aGVudGljYXRlZD1cIiArIHRoaXMuZ2V0SXNBdXRoZW50aWNhdGVkKCkgKyBcIilcIjtcbiAgfVxuXG4gIHNldEZha2VEaXNjb25uZWN0ZWQoZmFrZURpc2Nvbm5lY3RlZCkgeyAvLyB1c2VkIHRvIHRlc3QgY29ubmVjdGlvbiBtYW5hZ2VyXG4gICAgdGhpcy5mYWtlRGlzY29ubmVjdGVkID0gZmFrZURpc2Nvbm5lY3RlZDsgXG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIEhFTFBFUlMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwcm90ZWN0ZWQgYXN5bmMgcXVldWVDaGVja0Nvbm5lY3Rpb248VD4oYXN5bmNGbjogKCkgPT4gUHJvbWlzZTxUPik6IFByb21pc2U8VD4ge1xuICAgIHJldHVybiB0aGlzLmNoZWNrQ29ubmVjdGlvbk11dGV4LnN1Ym1pdChhc3luY0ZuKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBxdWV1ZVNlbmRSZXF1ZXN0PFQ+KGFzeW5jRm46ICgpID0+IFByb21pc2U8VD4pOiBQcm9taXNlPFQ+IHtcbiAgICByZXR1cm4gdGhpcy5zZW5kUmVxdWVzdE11dGV4LnN1Ym1pdChhc3luY0ZuKTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyB2YWxpZGF0ZUh0dHBSZXNwb25zZShyZXNwKSB7XG4gICAgbGV0IGNvZGUgPSByZXNwLnN0YXR1c0NvZGU7XG4gICAgaWYgKGNvZGUgPCAyMDAgfHwgY29kZSA+IDI5OSkge1xuICAgICAgbGV0IGNvbnRlbnQgPSByZXNwLmJvZHk7XG4gICAgICB0aHJvdyBuZXcgTW9uZXJvUnBjRXJyb3IoY29kZSArIFwiIFwiICsgcmVzcC5zdGF0dXNUZXh0ICsgKCFjb250ZW50ID8gXCJcIiA6IChcIjogXCIgKyBjb250ZW50KSksIGNvZGUsIHVuZGVmaW5lZCwgdW5kZWZpbmVkKTtcbiAgICB9XG4gIH1cbiAgXG4gIHByb3RlY3RlZCB2YWxpZGF0ZVJwY1Jlc3BvbnNlKHJlc3AsIG1ldGhvZCwgcGFyYW1zKSB7XG4gICAgaWYgKHJlc3AuZXJyb3IgPT09IHVuZGVmaW5lZCkgcmV0dXJuO1xuICAgIGxldCBlcnJvck1zZyA9IHJlc3AuZXJyb3IubWVzc2FnZTtcbiAgICBpZiAoZXJyb3JNc2cgPT09IFwiXCIpIGVycm9yTXNnID0gXCJSZWNlaXZlZCBlcnJvciByZXNwb25zZSBmcm9tIFJQQyByZXF1ZXN0IHdpdGggbWV0aG9kICdcIiArIG1ldGhvZCArIFwiJyB0byBcIiArIHRoaXMuZ2V0VXJpKCk7IC8vIFRPRE8gKG1vbmVyby1wcm9qZWN0KTogcmVzcG9uc2Ugc29tZXRpbWVzIGhhcyBlbXB0eSBlcnJvciBtZXNzYWdlXG4gICAgdGhyb3cgbmV3IE1vbmVyb1JwY0Vycm9yKHJlc3AuZXJyb3IubWVzc2FnZSwgcmVzcC5lcnJvci5jb2RlLCBtZXRob2QsIHBhcmFtcyk7XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLFNBQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLFdBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLGFBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFHLFlBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFJLGVBQUEsR0FBQUwsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFLLFlBQUEsR0FBQU4sc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFNLFdBQUEsR0FBQVAsc0JBQUEsQ0FBQUMsT0FBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDZSxNQUFNTyxtQkFBbUIsQ0FBQzs7RUFFdkM7Ozs7Ozs7Ozs7O0VBV0E7Ozs7Ozs7OztFQVNBO0VBQ0E7RUFDQSxPQUFPQyxjQUFj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