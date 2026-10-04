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
        let body = MoneroRpcConnection.stringifyBigIntJson({ // body is stringified so text/plain is returned so bigints are preserved
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
          proxyUri: this.getProxyUri(),
          timeout: timeoutMs === undefined ? this.timeoutMs : timeoutMs,
          rejectUnauthorized: this.rejectUnauthorized,
          proxyToWorker: this.proxyToWorker
        });

        // validate response
        MoneroRpcConnection.validateHttpResponse(resp);

        // deserialize response
        if (resp.body[0] != '{') throw resp.body;
        resp = MoneroRpcConnection.parseBigIntJson(resp.body);
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
        let body = MoneroRpcConnection.stringifyBigIntJson(params);
        if (_LibraryUtils.default.getLogLevel() >= 2) _LibraryUtils.default.log(2, "Sending path request with path '" + path + "' and params: " + body);

        // send http request
        let startTime = new Date().getTime();
        let resp = await _HttpClient.default.request({
          method: "POST",
          uri: this.getUri() + '/' + path,
          username: this.getUsername(),
          password: this.getPassword(),
          body: body, // body is stringified so text/plain is returned so bigints are preserved
          proxyUri: this.getProxyUri(),
          timeout: timeoutMs === undefined ? this.timeoutMs : timeoutMs,
          rejectUnauthorized: this.rejectUnauthorized,
          proxyToWorker: this.proxyToWorker
        });

        // validate response
        MoneroRpcConnection.validateHttpResponse(resp);

        // deserialize response
        if (resp.body[0] != '{') throw resp.body;
        resp = MoneroRpcConnection.parseBigIntJson(resp.body);
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

        // send http request
        let resp = await _HttpClient.default.request({
          method: "POST",
          uri: this.getUri() + '/' + path,
          username: this.getUsername(),
          password: this.getPassword(),
          body: paramsBin,
          proxyUri: this.getProxyUri(),
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

  static stringifyBigIntJson(obj) {
    const tag = "bigint" + Math.random().toString(36).slice(2); // per-call tag avoids colliding with string values
    return JSON.stringify(obj, (_key, val) => typeof val === "bigint" ? tag + val.toString() : val)?.replace(new RegExp('"' + tag + '(-?\\d+)"', "g"), "$1"); // write bigints as JSON numbers
  }

  static parseBigIntJson(body) {
    return JSON.parse(body.replace(/("[^"]*"\s*:\s*|[\[,]\s*)(\d{16,})(?=\s*[,\]}])/g, '$1"$2"')); // quote 16+ digit values and array elements to preserve precision
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfR2VuVXRpbHMiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9IdHRwQ2xpZW50IiwiX0xpYnJhcnlVdGlscyIsIl9Nb25lcm9FcnJvciIsIl9Nb25lcm9ScGNFcnJvciIsIl9Nb25lcm9VdGlscyIsIl9UaHJlYWRQb29sIiwiTW9uZXJvUnBjQ29ubmVjdGlvbiIsIkRFRkFVTFRfQ09ORklHIiwidXJpIiwidW5kZWZpbmVkIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsInptcVVyaSIsInByb3h5VXJpIiwicmVqZWN0VW5hdXRob3JpemVkIiwicHJveHlUb1dvcmtlciIsInByaW9yaXR5IiwidGltZW91dE1zIiwiY29uc3RydWN0b3IiLCJ1cmlPckNvbm5lY3Rpb24iLCJPYmplY3QiLCJhc3NpZ24iLCJzZXRDcmVkZW50aWFscyIsIk1vbmVyb0Vycm9yIiwiR2VuVXRpbHMiLCJub3JtYWxpemVVcmkiLCJjaGVja0Nvbm5lY3Rpb25NdXRleCIsIlRocmVhZFBvb2wiLCJzZW5kUmVxdWVzdE11dGV4IiwiaXNPbmxpbmUiLCJpc0F1dGhlbnRpY2F0ZWQiLCJnZXRVcmkiLCJnZXRVc2VybmFtZSIsImdldFBhc3N3b3JkIiwiZ2V0Wm1xVXJpIiwic2V0Wm1xVXJpIiwiZ2V0UHJveHlVcmkiLCJzZXRQcm94eVVyaSIsImdldFJlamVjdFVuYXV0aG9yaXplZCIsInNldFByb3h5VG9Xb3JrZXIiLCJnZXRQcm94eVRvV29ya2VyIiwic2V0UHJpb3JpdHkiLCJnZXRQcmlvcml0eSIsInNldFRpbWVvdXQiLCJnZXRUaW1lb3V0Iiwic2V0QXR0cmlidXRlIiwia2V5IiwidmFsdWUiLCJhdHRyaWJ1dGVzIiwiTWFwIiwicHV0IiwiZ2V0QXR0cmlidXRlIiwiZ2V0IiwiY2hlY2tDb25uZWN0aW9uIiwicXVldWVDaGVja0Nvbm5lY3Rpb24iLCJMaWJyYXJ5VXRpbHMiLCJsb2FkV2FzbU1vZHVsZSIsImlzT25saW5lQmVmb3JlIiwiaXNBdXRoZW50aWNhdGVkQmVmb3JlIiwic3RhcnRUaW1lIiwiRGF0ZSIsIm5vdyIsImZha2VEaXNjb25uZWN0ZWQiLCJFcnJvciIsImhlaWdodHMiLCJpIiwicHVzaCIsInNlbmRCaW5hcnlSZXF1ZXN0IiwiZXJyIiwicmVzcG9uc2VUaW1lIiwiTW9uZXJvUnBjRXJyb3IiLCJnZXRDb2RlIiwiaXNDb25uZWN0ZWQiLCJnZXRJc09ubGluZSIsInNldE9ubGluZSIsImdldElzQXV0aGVudGljYXRlZCIsInNldEF1dGhlbnRpY2F0ZWQiLCJnZXRSZXNwb25zZVRpbWUiLCJzZXRSZXNwb25zZVRpbWUiLCJyZXNwb25zZVRpbWVNcyIsInNlbmRKc29uUmVxdWVzdCIsIm1ldGhvZCIsInBhcmFtcyIsInF1ZXVlU2VuZFJlcXVlc3QiLCJib2R5Iiwic3RyaW5naWZ5QmlnSW50SnNvbiIsImlkIiwianNvbnJwYyIsImdldExvZ0xldmVsIiwibG9nIiwiZ2V0VGltZSIsInJlc3AiLCJIdHRwQ2xpZW50IiwicmVxdWVzdCIsInRpbWVvdXQiLCJ2YWxpZGF0ZUh0dHBSZXNwb25zZSIsInBhcnNlQmlnSW50SnNvbiIsInJlc3BTdHIiLCJKU09OIiwic3RyaW5naWZ5Iiwic3Vic3RyaW5nIiwiTWF0aCIsIm1pbiIsImxlbmd0aCIsInZhbGlkYXRlUnBjUmVzcG9uc2UiLCJzdGF0dXNDb2RlIiwic2VuZFBhdGhSZXF1ZXN0IiwicGF0aCIsInBhcnNlIiwicGFyYW1zQmluIiwiTW9uZXJvVXRpbHMiLCJqc29uVG9CaW5hcnkiLCJVaW50OEFycmF5IiwiY29uc29sZSIsImVycm9yIiwibWVzc2FnZSIsImNvZGUiLCJnZXRDb25maWciLCJ0b0pzb24iLCJqc29uIiwidG9TdHJpbmciLCJzZXRGYWtlRGlzY29ubmVjdGVkIiwiYXN5bmNGbiIsInN1Ym1pdCIsIm9iaiIsInRhZyIsInJhbmRvbSIsInNsaWNlIiwiX2tleSIsInZhbCIsInJlcGxhY2UiLCJSZWdFeHAiLCJjb250ZW50Iiwic3RhdHVzVGV4dCIsImVycm9yTXNnIiwiZXhwb3J0cyIsImRlZmF1bHQiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy9jb21tb24vTW9uZXJvUnBjQ29ubmVjdGlvbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4vR2VuVXRpbHNcIjtcbmltcG9ydCBIdHRwQ2xpZW50IGZyb20gXCIuL0h0dHBDbGllbnRcIjtcbmltcG9ydCBMaWJyYXJ5VXRpbHMgZnJvbSBcIi4vTGlicmFyeVV0aWxzXCI7XG5pbXBvcnQgTW9uZXJvRXJyb3IgZnJvbSBcIi4vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBNb25lcm9ScGNFcnJvciBmcm9tIFwiLi9Nb25lcm9ScGNFcnJvclwiO1xuaW1wb3J0IE1vbmVyb1V0aWxzIGZyb20gXCIuL01vbmVyb1V0aWxzXCI7XG5pbXBvcnQgVGhyZWFkUG9vbCBmcm9tIFwiLi9UaHJlYWRQb29sXCI7XG5cbi8qKlxuICogTWFpbnRhaW5zIGEgY29ubmVjdGlvbiBhbmQgc2VuZHMgcmVxdWVzdHMgdG8gYSBNb25lcm8gUlBDIEFQSS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTW9uZXJvUnBjQ29ubmVjdGlvbiB7XG5cbiAgLy8gcHVibGljIGluc3RhbmNlIHZhcmlhYmxlc1xuICB1cmk6IHN0cmluZztcbiAgdXNlcm5hbWU6IHN0cmluZztcbiAgcGFzc3dvcmQ6IHN0cmluZztcbiAgem1xVXJpOiBzdHJpbmc7XG4gIHByb3h5VXJpOiBzdHJpbmc7XG4gIHJlamVjdFVuYXV0aG9yaXplZDogYm9vbGVhbjtcbiAgcHJveHlUb1dvcmtlcjogYm9vbGVhbjtcbiAgcHJpb3JpdHk6IG51bWJlcjtcbiAgdGltZW91dE1zOiBudW1iZXI7XG5cbiAgLy8gcHJpdmF0ZSBpbnN0YW5jZSB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIGlzT25saW5lOiBib29sZWFuO1xuICBwcm90ZWN0ZWQgaXNBdXRoZW50aWNhdGVkOiBib29sZWFuO1xuICBwcm90ZWN0ZWQgYXR0cmlidXRlczogYW55O1xuICBwcm90ZWN0ZWQgZmFrZURpc2Nvbm5lY3RlZDogYm9vbGVhbjtcbiAgcHJvdGVjdGVkIHJlc3BvbnNlVGltZTogbnVtYmVyO1xuICBwcm90ZWN0ZWQgY2hlY2tDb25uZWN0aW9uTXV0ZXg6IFRocmVhZFBvb2w7XG4gIHByb3RlY3RlZCBzZW5kUmVxdWVzdE11dGV4OiBUaHJlYWRQb29sO1xuXG4gIC8vIGRlZmF1bHQgY29uZmlnXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBzdGF0aWMgREVGQVVMVF9DT05GSUc6IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4gPSB7XG4gICAgdXJpOiB1bmRlZmluZWQsXG4gICAgdXNlcm5hbWU6IHVuZGVmaW5lZCxcbiAgICBwYXNzd29yZDogdW5kZWZpbmVkLFxuICAgIHptcVVyaTogdW5kZWZpbmVkLFxuICAgIHByb3h5VXJpOiB1bmRlZmluZWQsXG4gICAgcmVqZWN0VW5hdXRob3JpemVkOiB0cnVlLCAvLyByZWplY3Qgc2VsZi1zaWduZWQgY2VydGlmaWNhdGVzIGlmIHRydWVcbiAgICBwcm94eVRvV29ya2VyOiBmYWxzZSxcbiAgICBwcmlvcml0eTogMCxcbiAgICB0aW1lb3V0TXM6IHVuZGVmaW5lZFxuICB9XG5cbiAgLyoqXG4gICAqIDxwPkNvbnN0cnVjdCBhIFJQQyBjb25uZWN0aW9uLjwvcD5cbiAgICogXG4gICAqIDxwPkV4YW1wbGVzOjwvcD5cbiAgICogXG4gICAqIDxjb2RlPlxuICAgKiBsZXQgY29ubmVjdGlvbjEgPSBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbihcImh0dHA6Ly9sb2NhbGhvc3Q6MzgwODFcIiwgXCJkYWVtb25fdXNlclwiLCBcImRhZW1vbl9wYXNzd29yZF8xMjNcIik8YnI+PGJyPlxuICAgKiBcbiAgICogbGV0IGNvbm5lY3Rpb24yID0gbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24oezxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHVyaTogaHR0cDovL2xvY2FsaG9zdDozODA4MSw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyB1c2VybmFtZTogXCJkYWVtb25fdXNlclwiLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHBhc3N3b3JkOiBcImRhZW1vbl9wYXNzd29yZF8xMjNcIiw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyByZWplY3RVbmF1dGhvcml6ZWQ6IGZhbHNlLCAvLyBhY2NlcHQgc2VsZi1zaWduZWQgY2VydGlmaWNhdGVzIGUuZy4gZm9yIGxvY2FsIGRldmVsb3BtZW50PGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcHJveHlUb1dvcmtlcjogdHJ1ZSAvLyBwcm94eSByZXF1ZXN0IHRvIHdvcmtlciAoZGVmYXVsdCBmYWxzZSk8YnI+XG4gICAqIH0pO1xuICAgKiA8L2NvZGU+XG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ3xQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+fSB1cmlPckNvbm5lY3Rpb24gLSBNb25lcm9ScGNDb25uZWN0aW9uIG9yIFVSSSBvZiB0aGUgUlBDIGVuZHBvaW50XG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1cmlPckNvbm5lY3Rpb24udXJpIC0gVVJJIG9mIHRoZSBSUEMgZW5kcG9pbnRcbiAgICogQHBhcmFtIHtzdHJpbmd9IFt1cmlPckNvbm5lY3Rpb24udXNlcm5hbWVdIC0gdXNlcm5hbWUgdG8gYXV0aGVudGljYXRlIHdpdGggdGhlIFJQQyBlbmRwb2ludCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbdXJpT3JDb25uZWN0aW9uLnBhc3N3b3JkXSAtIHBhc3N3b3JkIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIHRoZSBSUEMgZW5kcG9pbnQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3VyaU9yQ29ubmVjdGlvbi56bXFVcmldIC0gVVJJIG9mIHRoZSBaTVEgZW5kcG9pbnQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3VyaU9yQ29ubmVjdGlvbi5wcm94eVVyaV0gLSBVUkkgb2YgYSBwcm94eSBzZXJ2ZXIgdG8gcm91dGUgcmVxdWVzdHMgdGhyb3VnaCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3VyaU9yQ29ubmVjdGlvbi5yZWplY3RVbmF1dGhvcml6ZWRdIC0gcmVqZWN0cyBzZWxmLXNpZ25lZCBjZXJ0aWZpY2F0ZXMgaWYgdHJ1ZSAoZGVmYXVsdCB0cnVlKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHVyaU9yQ29ubmVjdGlvbi5wcm94eVRvV29ya2VyIC0gcHJveHkgcmVxdWVzdHMgdG8gd29ya2VyIChkZWZhdWx0IHRydWUpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1c2VybmFtZSAtIHVzZXJuYW1lIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIHRoZSBSUEMgZW5kcG9pbnQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGFzc3dvcmQgLSBwYXNzd29yZCB0byBhdXRoZW50aWNhdGUgd2l0aCB0aGUgUlBDIGVuZHBvaW50IChvcHRpb25hbClcbiAgICovXG4gIGNvbnN0cnVjdG9yKHVyaU9yQ29ubmVjdGlvbjogc3RyaW5nIHwgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPiwgdXNlcm5hbWU/OiBzdHJpbmcsIHBhc3N3b3JkPzogc3RyaW5nKSB7XG5cbiAgICAvLyB2YWxpZGF0ZSBhbmQgbm9ybWFsaXplIGNvbmZpZ1xuICAgIGlmICh0eXBlb2YgdXJpT3JDb25uZWN0aW9uID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBPYmplY3QuYXNzaWduKHRoaXMsIE1vbmVyb1JwY0Nvbm5lY3Rpb24uREVGQVVMVF9DT05GSUcpO1xuICAgICAgdGhpcy51cmkgPSB1cmlPckNvbm5lY3Rpb247XG4gICAgICB0aGlzLnNldENyZWRlbnRpYWxzKHVzZXJuYW1lLCBwYXNzd29yZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh1c2VybmFtZSAhPT0gdW5kZWZpbmVkIHx8IHBhc3N3b3JkICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbiBwcm92aWRlIGNvbmZpZyBvYmplY3Qgb3IgcGFyYW1zIGJ1dCBub3QgYm90aFwiKTtcbiAgICAgIE9iamVjdC5hc3NpZ24odGhpcywgTW9uZXJvUnBjQ29ubmVjdGlvbi5ERUZBVUxUX0NPTkZJRywgdXJpT3JDb25uZWN0aW9uKTtcbiAgICAgIHRoaXMuc2V0Q3JlZGVudGlhbHModGhpcy51c2VybmFtZSwgdGhpcy5wYXNzd29yZCk7XG4gICAgfVxuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSB1cmlzXG4gICAgaWYgKHRoaXMudXJpKSB0aGlzLnVyaSA9IEdlblV0aWxzLm5vcm1hbGl6ZVVyaSh0aGlzLnVyaSk7XG4gICAgaWYgKHRoaXMuem1xVXJpKSB0aGlzLnptcVVyaSA9IEdlblV0aWxzLm5vcm1hbGl6ZVVyaSh0aGlzLnptcVVyaSk7XG4gICAgaWYgKHRoaXMucHJveHlVcmkpIHRoaXMucHJveHlVcmkgPSBHZW5VdGlscy5ub3JtYWxpemVVcmkodGhpcy5wcm94eVVyaSk7XG5cbiAgICAvLyBpbml0aWFsaXplIG11dGV4ZXNcbiAgICB0aGlzLmNoZWNrQ29ubmVjdGlvbk11dGV4ID0gbmV3IFRocmVhZFBvb2woMSk7XG4gICAgdGhpcy5zZW5kUmVxdWVzdE11dGV4ID0gbmV3IFRocmVhZFBvb2woMSk7XG4gIH1cbiAgXG4gIHNldENyZWRlbnRpYWxzKHVzZXJuYW1lLCBwYXNzd29yZCkge1xuICAgIGlmICh1c2VybmFtZSA9PT0gXCJcIikgdXNlcm5hbWUgPSB1bmRlZmluZWQ7XG4gICAgaWYgKHBhc3N3b3JkID09PSBcIlwiKSBwYXNzd29yZCA9IHVuZGVmaW5lZDtcbiAgICBpZiAodXNlcm5hbWUgfHwgcGFzc3dvcmQpIHtcbiAgICAgIGlmICghdXNlcm5hbWUpIHRocm93IG5ldyBNb25lcm9FcnJvcihcInVzZXJuYW1lIG11c3QgYmUgZGVmaW5lZCBiZWNhdXNlIHBhc3N3b3JkIGlzIGRlZmluZWRcIik7XG4gICAgICBpZiAoIXBhc3N3b3JkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJwYXNzd29yZCBtdXN0IGJlIGRlZmluZWQgYmVjYXVzZSB1c2VybmFtZSBpcyBkZWZpbmVkXCIpO1xuICAgIH1cbiAgICBpZiAodGhpcy51c2VybmFtZSA9PT0gXCJcIikgdGhpcy51c2VybmFtZSA9IHVuZGVmaW5lZDtcbiAgICBpZiAodGhpcy5wYXNzd29yZCA9PT0gXCJcIikgdGhpcy5wYXNzd29yZCA9IHVuZGVmaW5lZDtcbiAgICBpZiAodGhpcy51c2VybmFtZSAhPT0gdXNlcm5hbWUgfHwgdGhpcy5wYXNzd29yZCAhPT0gcGFzc3dvcmQpIHtcbiAgICAgIHRoaXMuaXNPbmxpbmUgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgdGhpcy51c2VybmFtZSA9IHVzZXJuYW1lO1xuICAgIHRoaXMucGFzc3dvcmQgPSBwYXNzd29yZDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgZ2V0VXJpKCkge1xuICAgIHJldHVybiB0aGlzLnVyaTtcbiAgfVxuXG4gIGdldFVzZXJuYW1lKCkge1xuICAgIHJldHVybiB0aGlzLnVzZXJuYW1lID8gdGhpcy51c2VybmFtZSA6IFwiXCI7XG4gIH1cbiAgXG4gIGdldFBhc3N3b3JkKCkge1xuICAgIHJldHVybiB0aGlzLnBhc3N3b3JkID8gdGhpcy5wYXNzd29yZCA6IFwiXCI7XG4gIH1cblxuICBnZXRabXFVcmkoKSB7XG4gICAgcmV0dXJuIHRoaXMuem1xVXJpO1xuICB9XG5cbiAgc2V0Wm1xVXJpKHptcVVyaSkge1xuICAgIHRoaXMuem1xVXJpID0gem1xVXJpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBnZXRQcm94eVVyaSgpIHtcbiAgICByZXR1cm4gdGhpcy5wcm94eVVyaTtcbiAgfVxuXG4gIHNldFByb3h5VXJpKHByb3h5VXJpKSB7XG4gICAgdGhpcy5wcm94eVVyaSA9IHByb3h5VXJpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBnZXRSZWplY3RVbmF1dGhvcml6ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVqZWN0VW5hdXRob3JpemVkO1xuICB9XG4gIFxuICBzZXRQcm94eVRvV29ya2VyKHByb3h5VG9Xb3JrZXIpIHtcbiAgICB0aGlzLnByb3h5VG9Xb3JrZXIgPSBwcm94eVRvV29ya2VyO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBnZXRQcm94eVRvV29ya2VyKCkge1xuICAgIHJldHVybiB0aGlzLnByb3h5VG9Xb3JrZXI7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZXQgdGhlIGNvbm5lY3Rpb24ncyBwcmlvcml0eSByZWxhdGl2ZSB0byBvdGhlciBjb25uZWN0aW9ucy4gUHJpb3JpdHkgMSBpcyBoaWdoZXN0LFxuICAgKiB0aGVuIHByaW9yaXR5IDIsIGV0Yy4gVGhlIGRlZmF1bHQgcHJpb3JpdHkgb2YgMCBpcyBsb3dlc3QgcHJpb3JpdHkuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gW3ByaW9yaXR5XSAtIHRoZSBjb25uZWN0aW9uIHByaW9yaXR5IChkZWZhdWx0IDApXG4gICAqIEByZXR1cm4ge01vbmVyb1JwY0Nvbm5lY3Rpb259IHRoaXMgY29ubmVjdGlvblxuICAgKi9cbiAgc2V0UHJpb3JpdHkocHJpb3JpdHkpIHtcbiAgICBpZiAoIShwcmlvcml0eSA+PSAwKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiUHJpb3JpdHkgbXVzdCBiZSA+PSAwXCIpO1xuICAgIHRoaXMucHJpb3JpdHkgPSBwcmlvcml0eTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldFByaW9yaXR5KCkge1xuICAgIHJldHVybiB0aGlzLnByaW9yaXR5OyBcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIFJQQyByZXF1ZXN0IHRpbWVvdXQgaW4gbWlsbGlzZWNvbmRzLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IHRpbWVvdXRNcyBpcyB0aGUgdGltZW91dCBpbiBtaWxsaXNlY29uZHMsIDAgdG8gZGlzYWJsZSB0aW1lb3V0LCBvciB1bmRlZmluZWQgdG8gdXNlIGRlZmF1bHRcbiAgICogQHJldHVybiB7TW9uZXJvUnBjQ29ubmVjdGlvbn0gdGhpcyBjb25uZWN0aW9uXG4gICAqL1xuICBzZXRUaW1lb3V0KHRpbWVvdXRNczogbnVtYmVyKSB7XG4gICAgdGhpcy50aW1lb3V0TXMgPSB0aW1lb3V0TXM7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXRUaW1lb3V0KCkge1xuICAgIHJldHVybiB0aGlzLnRpbWVvdXRNcztcbiAgfVxuICBcbiAgc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpIHtcbiAgICBpZiAoIXRoaXMuYXR0cmlidXRlcykgdGhpcy5hdHRyaWJ1dGVzID0gbmV3IE1hcCgpO1xuICAgIHRoaXMuYXR0cmlidXRlcy5wdXQoa2V5LCB2YWx1ZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIGdldEF0dHJpYnV0ZShrZXkpIHtcbiAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzLmdldChrZXkpO1xuICB9XG4gIFxuICAvKipcbiAgICogQ2hlY2sgdGhlIGNvbm5lY3Rpb24gc3RhdHVzIHRvIHVwZGF0ZSBpc09ubGluZSwgaXNBdXRoZW50aWNhdGVkLCBhbmQgcmVzcG9uc2UgdGltZS5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB0aW1lb3V0TXMgLSBtYXhpbXVtIHJlc3BvbnNlIHRpbWUgYmVmb3JlIGNvbnNpZGVyZWQgb2ZmbGluZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSB0cnVlIGlmIHRoZXJlIGlzIGEgY2hhbmdlIGluIHN0YXR1cywgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBhc3luYyBjaGVja0Nvbm5lY3Rpb24odGltZW91dE1zKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIHRoaXMucXVldWVDaGVja0Nvbm5lY3Rpb24oYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRXYXNtTW9kdWxlKCk7IC8vIGNhY2hlIHdhc20gZm9yIGJpbmFyeSByZXF1ZXN0XG4gICAgICBsZXQgaXNPbmxpbmVCZWZvcmUgPSB0aGlzLmlzT25saW5lO1xuICAgICAgbGV0IGlzQXV0aGVudGljYXRlZEJlZm9yZSA9IHRoaXMuaXNBdXRoZW50aWNhdGVkO1xuICAgICAgbGV0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAodGhpcy5mYWtlRGlzY29ubmVjdGVkKSB0aHJvdyBuZXcgRXJyb3IoXCJDb25uZWN0aW9uIGlzIGZha2UgZGlzY29ubmVjdGVkXCIpO1xuICAgICAgICBsZXQgaGVpZ2h0cyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDEwMDsgaSsrKSBoZWlnaHRzLnB1c2goaSk7XG4gICAgICAgIGF3YWl0IHRoaXMuc2VuZEJpbmFyeVJlcXVlc3QoXCJnZXRfYmxvY2tzX2J5X2hlaWdodC5iaW5cIiwge2hlaWdodHM6IGhlaWdodHN9LCB0aW1lb3V0TXMpOyAvLyBhc3N1bWUgZGFlbW9uIGNvbm5lY3Rpb25cbiAgICAgICAgdGhpcy5pc09ubGluZSA9IHRydWU7XG4gICAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gdHJ1ZTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICB0aGlzLmlzT25saW5lID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLnJlc3BvbnNlVGltZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yKSB7XG4gICAgICAgICAgaWYgKGVyci5nZXRDb2RlKCkgPT09IDQwMSkge1xuICAgICAgICAgICAgdGhpcy5pc09ubGluZSA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IGZhbHNlO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZXJyLmdldENvZGUoKSA9PT0gNDA0KSB7IC8vIGZhbGxiYWNrIHRvIGxhdGVuY3kgY2hlY2tcbiAgICAgICAgICAgIHRoaXMuaXNPbmxpbmUgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHRoaXMuaXNPbmxpbmUpIHRoaXMucmVzcG9uc2VUaW1lID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcbiAgICAgIHJldHVybiBpc09ubGluZUJlZm9yZSAhPT0gdGhpcy5pc09ubGluZSB8fCBpc0F1dGhlbnRpY2F0ZWRCZWZvcmUgIT09IHRoaXMuaXNBdXRoZW50aWNhdGVkO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBjb25uZWN0aW9uIGlzIGNvbm5lY3RlZCBhY2NvcmRpbmcgdG8gdGhlIGxhc3QgY2FsbCB0byBjaGVja0Nvbm5lY3Rpb24oKS5cbiAgICogXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgb3IgZmFsc2UgdG8gaW5kaWNhdGUgaWYgY29ubmVjdGVkLCBvciB1bmRlZmluZWQgaWYgY2hlY2tDb25uZWN0aW9uKCkgaGFzIG5vdCBiZWVuIGNhbGxlZFxuICAgKi9cbiAgaXNDb25uZWN0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNPbmxpbmUgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHRoaXMuaXNPbmxpbmUgJiYgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgIT09IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgY29ubmVjdGlvbiBpcyBvbmxpbmUgYWNjb3JkaW5nIHRvIHRoZSBsYXN0IGNhbGwgdG8gY2hlY2tDb25uZWN0aW9uKCkuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIG9yIGZhbHNlIHRvIGluZGljYXRlIGlmIG9ubGluZSwgb3IgdW5kZWZpbmVkIGlmIGNoZWNrQ29ubmVjdGlvbigpIGhhcyBub3QgYmVlbiBjYWxsZWRcbiAgICovXG4gIGdldElzT25saW5lKCkge1xuICAgIHJldHVybiB0aGlzLmlzT25saW5lO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgY29ubmVjdGlvbidzIG9ubGluZSBzdGF0dXMuXG4gICAqIFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzT25saW5lIC0gc2V0cyBpZiB0aGUgY29ubmVjdGlvbiBpcyBvbmxpbmVcbiAgICogQHJldHVybiB7TW9uZXJvUnBjQ29ubmVjdGlvbn0gdGhpcyBjb25uZWN0aW9uXG4gICAqL1xuICBzZXRPbmxpbmUoaXNPbmxpbmUpIHtcbiAgICB0aGlzLmlzT25saW5lID0gaXNPbmxpbmU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBjb25uZWN0aW9uIGlzIGF1dGhlbnRpY2F0ZWQgYWNjb3JkaW5nIHRvIHRoZSBsYXN0IGNhbGwgdG8gY2hlY2tDb25uZWN0aW9uKCkuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIGF1dGhlbnRpY2F0ZWQgb3Igbm8gYXV0aGVudGljYXRpb24sIGZhbHNlIGlmIG5vdCBhdXRoZW50aWNhdGVkLCBvciB1bmRlZmluZWQgaWYgY2hlY2tDb25uZWN0aW9uKCkgaGFzIG5vdCBiZWVuIGNhbGxlZFxuICAgKi9cbiAgZ2V0SXNBdXRoZW50aWNhdGVkKCkge1xuICAgIHJldHVybiB0aGlzLmlzQXV0aGVudGljYXRlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGNvbm5lY3Rpb24ncyBhdXRoZW50aWNhdGVkIHN0YXR1cy5cbiAgICogXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNBdXRoZW50aWNhdGVkIC0gc2V0cyBpZiB0aGUgY29ubmVjdGlvbiBpcyBhdXRoZW50aWNhdGVkXG4gICAqIEByZXR1cm4ge01vbmVyb1JwY0Nvbm5lY3Rpb259IHRoaXMgY29ubmVjdGlvblxuICAgKi9cbiAgc2V0QXV0aGVudGljYXRlZChpc0F1dGhlbnRpY2F0ZWQpIHtcbiAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IGlzQXV0aGVudGljYXRlZDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHJlc3BvbnNlIHRpbWUsIHdoaWNoIGlzIHNldCBhdXRvbWF0aWNhbGx5IGJ5IGNhbGxpbmcgY2hlY2tDb25uZWN0aW9uKCkuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtudW1iZXJ9IHRoZSByZXNwb25zZSB0aW1lIG9mIHRoaXMgY29ubmVjdGlvbiBpbiBtaWxsaXNlY29uZHNcbiAgICovXG4gIGdldFJlc3BvbnNlVGltZSgpIHtcbiAgICByZXR1cm4gdGhpcy5yZXNwb25zZVRpbWU7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBjb25uZWN0aW9uJ3MgcmVzcG9uc2UgdGltZS5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSByZXNwb25zZVRpbWVNcyAtIHJlc3BvbnNlIHRpbWUgaW4gbWlsbGlzZWNvbmRzXG4gICAqIEByZXR1cm4ge01vbmVyb1JwY0Nvbm5lY3Rpb259IHRoaXMgY29ubmVjdGlvblxuICAgKi9cbiAgc2V0UmVzcG9uc2VUaW1lKHJlc3BvbnNlVGltZU1zKSB7XG4gICAgdGhpcy5yZXNwb25zZVRpbWUgPSByZXNwb25zZVRpbWVNcztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIGEgSlNPTiBSUEMgcmVxdWVzdC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZXRob2QgLSBKU09OIFJQQyBtZXRob2QgdG8gaW52b2tlXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXMgLSByZXF1ZXN0IHBhcmFtZXRlcnNcbiAgICogQHBhcmFtIHtudW1iZXJ9IFt0aW1lb3V0TXNdIC0gb3ZlcnJpZGVzIHRoZSByZXF1ZXN0IHRpbWVvdXQgaW4gbWlsbGlzZWNvbmRzXG4gICAqIEByZXR1cm4ge29iamVjdH0gaXMgdGhlIHJlc3BvbnNlIG1hcFxuICAgKi9cbiAgYXN5bmMgc2VuZEpzb25SZXF1ZXN0KG1ldGhvZCwgcGFyYW1zPywgdGltZW91dE1zPyk6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIHRoaXMucXVldWVTZW5kUmVxdWVzdChhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuXG4gICAgICAgIC8vIGJ1aWxkIHJlcXVlc3QgYm9keVxuICAgICAgICBsZXQgYm9keSA9IE1vbmVyb1JwY0Nvbm5lY3Rpb24uc3RyaW5naWZ5QmlnSW50SnNvbih7ICAvLyBib2R5IGlzIHN0cmluZ2lmaWVkIHNvIHRleHQvcGxhaW4gaXMgcmV0dXJuZWQgc28gYmlnaW50cyBhcmUgcHJlc2VydmVkXG4gICAgICAgICAgaWQ6IFwiMFwiLFxuICAgICAgICAgIGpzb25ycGM6IFwiMi4wXCIsXG4gICAgICAgICAgbWV0aG9kOiBtZXRob2QsXG4gICAgICAgICAgcGFyYW1zOiBwYXJhbXNcbiAgICAgICAgfSk7XG4gIFxuICAgICAgICAvLyBsb2dnaW5nXG4gICAgICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0TG9nTGV2ZWwoKSA+PSAyKSBMaWJyYXJ5VXRpbHMubG9nKDIsIFwiU2VuZGluZyBqc29uIHJlcXVlc3Qgd2l0aCBtZXRob2QgJ1wiICsgbWV0aG9kICsgXCInIGFuZCBib2R5OiBcIiArIGJvZHkpO1xuXG4gICAgICAgIC8vIHNlbmQgaHR0cCByZXF1ZXN0XG4gICAgICAgIGxldCBzdGFydFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgbGV0IHJlc3AgPSBhd2FpdCBIdHRwQ2xpZW50LnJlcXVlc3Qoe1xuICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgICAgdXJpOiB0aGlzLmdldFVyaSgpICsgJy9qc29uX3JwYycsXG4gICAgICAgICAgdXNlcm5hbWU6IHRoaXMuZ2V0VXNlcm5hbWUoKSxcbiAgICAgICAgICBwYXNzd29yZDogdGhpcy5nZXRQYXNzd29yZCgpLFxuICAgICAgICAgIGJvZHk6IGJvZHksXG4gICAgICAgICAgcHJveHlVcmk6IHRoaXMuZ2V0UHJveHlVcmkoKSxcbiAgICAgICAgICB0aW1lb3V0OiB0aW1lb3V0TXMgPT09IHVuZGVmaW5lZCA/IHRoaXMudGltZW91dE1zIDogdGltZW91dE1zLFxuICAgICAgICAgIHJlamVjdFVuYXV0aG9yaXplZDogdGhpcy5yZWplY3RVbmF1dGhvcml6ZWQsXG4gICAgICAgICAgcHJveHlUb1dvcmtlcjogdGhpcy5wcm94eVRvV29ya2VyXG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gdmFsaWRhdGUgcmVzcG9uc2VcbiAgICAgICAgTW9uZXJvUnBjQ29ubmVjdGlvbi52YWxpZGF0ZUh0dHBSZXNwb25zZShyZXNwKTtcbiAgICAgICAgXG4gICAgICAgIC8vIGRlc2VyaWFsaXplIHJlc3BvbnNlXG4gICAgICAgIGlmIChyZXNwLmJvZHlbMF0gIT0gJ3snKSB0aHJvdyByZXNwLmJvZHk7XG4gICAgICAgIHJlc3AgPSBNb25lcm9ScGNDb25uZWN0aW9uLnBhcnNlQmlnSW50SnNvbihyZXNwLmJvZHkpO1xuICAgICAgICBpZiAoTGlicmFyeVV0aWxzLmdldExvZ0xldmVsKCkgPj0gMykge1xuICAgICAgICAgIGxldCByZXNwU3RyID0gSlNPTi5zdHJpbmdpZnkocmVzcCk7XG4gICAgICAgICAgTGlicmFyeVV0aWxzLmxvZygzLCBcIlJlY2VpdmVkIHJlc3BvbnNlIGZyb20gbWV0aG9kPSdcIiArIG1ldGhvZCArIFwiJywgcmVzcG9uc2U9XCIgKyByZXNwU3RyLnN1YnN0cmluZygwLCBNYXRoLm1pbigxMDAwLCByZXNwU3RyLmxlbmd0aCkpICsgXCIoXCIgKyAobmV3IERhdGUoKS5nZXRUaW1lKCkgLSBzdGFydFRpbWUpICsgXCIgbXMpXCIpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBjaGVjayBycGMgcmVzcG9uc2UgZm9yIGVycm9yc1xuICAgICAgICB0aGlzLnZhbGlkYXRlUnBjUmVzcG9uc2UocmVzcCwgbWV0aG9kLCBwYXJhbXMpO1xuICAgICAgICByZXR1cm4gcmVzcDtcbiAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvcikgdGhyb3cgZXJyO1xuICAgICAgICBlbHNlIHRocm93IG5ldyBNb25lcm9ScGNFcnJvcihlcnIsIGVyci5zdGF0dXNDb2RlLCBtZXRob2QsIHBhcmFtcyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZW5kIGEgUlBDIHJlcXVlc3QgdG8gdGhlIGdpdmVuIHBhdGggYW5kIHdpdGggdGhlIGdpdmVuIHBhcmFtdGVycy5cbiAgICogXG4gICAqIEUuZy4gXCIvZ2V0X3RyYW5zYWN0aW9uc1wiIHdpdGggcGFyYW1zXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIEpTT04gUlBDIHBhdGggdG8gaW52b2tlXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXMgLSByZXF1ZXN0IHBhcmFtZXRlcnNcbiAgICogQHBhcmFtIHtudW1iZXJ9IFt0aW1lb3V0TXNdIC0gb3ZlcnJpZGVzIHRoZSByZXF1ZXN0IHRpbWVvdXQgaW4gbWlsbGlzZWNvbmRzXG4gICAqIEByZXR1cm4ge29iamVjdH0gaXMgdGhlIHJlc3BvbnNlIG1hcFxuICAgKi9cbiAgYXN5bmMgc2VuZFBhdGhSZXF1ZXN0KHBhdGgsIHBhcmFtcz8sIHRpbWVvdXRNcz8pOiBQcm9taXNlPGFueT4ge1xuICAgIHJldHVybiB0aGlzLnF1ZXVlU2VuZFJlcXVlc3QoYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHtcblxuICAgICAgICAvLyBsb2dnaW5nXG4gICAgICAgIGxldCBib2R5ID0gTW9uZXJvUnBjQ29ubmVjdGlvbi5zdHJpbmdpZnlCaWdJbnRKc29uKHBhcmFtcyk7XG4gICAgICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0TG9nTGV2ZWwoKSA+PSAyKSBMaWJyYXJ5VXRpbHMubG9nKDIsIFwiU2VuZGluZyBwYXRoIHJlcXVlc3Qgd2l0aCBwYXRoICdcIiArIHBhdGggKyBcIicgYW5kIHBhcmFtczogXCIgKyBib2R5KTtcblxuICAgICAgICAvLyBzZW5kIGh0dHAgcmVxdWVzdFxuICAgICAgICBsZXQgc3RhcnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgIGxldCByZXNwID0gYXdhaXQgSHR0cENsaWVudC5yZXF1ZXN0KHtcbiAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgIHVyaTogdGhpcy5nZXRVcmkoKSArICcvJyArIHBhdGgsXG4gICAgICAgICAgdXNlcm5hbWU6IHRoaXMuZ2V0VXNlcm5hbWUoKSxcbiAgICAgICAgICBwYXNzd29yZDogdGhpcy5nZXRQYXNzd29yZCgpLFxuICAgICAgICAgIGJvZHk6IGJvZHksICAvLyBib2R5IGlzIHN0cmluZ2lmaWVkIHNvIHRleHQvcGxhaW4gaXMgcmV0dXJuZWQgc28gYmlnaW50cyBhcmUgcHJlc2VydmVkXG4gICAgICAgICAgcHJveHlVcmk6IHRoaXMuZ2V0UHJveHlVcmkoKSxcbiAgICAgICAgICB0aW1lb3V0OiB0aW1lb3V0TXMgPT09IHVuZGVmaW5lZCA/IHRoaXMudGltZW91dE1zIDogdGltZW91dE1zLFxuICAgICAgICAgIHJlamVjdFVuYXV0aG9yaXplZDogdGhpcy5yZWplY3RVbmF1dGhvcml6ZWQsXG4gICAgICAgICAgcHJveHlUb1dvcmtlcjogdGhpcy5wcm94eVRvV29ya2VyXG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gdmFsaWRhdGUgcmVzcG9uc2VcbiAgICAgICAgTW9uZXJvUnBjQ29ubmVjdGlvbi52YWxpZGF0ZUh0dHBSZXNwb25zZShyZXNwKTtcbiAgICAgICAgXG4gICAgICAgIC8vIGRlc2VyaWFsaXplIHJlc3BvbnNlXG4gICAgICAgIGlmIChyZXNwLmJvZHlbMF0gIT0gJ3snKSB0aHJvdyByZXNwLmJvZHk7XG4gICAgICAgIHJlc3AgPSBNb25lcm9ScGNDb25uZWN0aW9uLnBhcnNlQmlnSW50SnNvbihyZXNwLmJvZHkpO1xuICAgICAgICBpZiAodHlwZW9mIHJlc3AgPT09IFwic3RyaW5nXCIpIHJlc3AgPSBKU09OLnBhcnNlKHJlc3ApOyAgLy8gVE9ETzogc29tZSByZXNwb25zZXMgcmV0dXJuZWQgYXMgc3RyaW5ncz9cbiAgICAgICAgaWYgKExpYnJhcnlVdGlscy5nZXRMb2dMZXZlbCgpID49IDMpIHtcbiAgICAgICAgICBsZXQgcmVzcFN0ciA9IEpTT04uc3RyaW5naWZ5KHJlc3ApO1xuICAgICAgICAgIExpYnJhcnlVdGlscy5sb2coMywgXCJSZWNlaXZlZCByZXNwb25zZSBmcm9tIHBhdGg9J1wiICsgcGF0aCArIFwiJywgcmVzcG9uc2U9XCIgKyByZXNwU3RyLnN1YnN0cmluZygwLCBNYXRoLm1pbigxMDAwLCByZXNwU3RyLmxlbmd0aCkpICsgXCIoXCIgKyAobmV3IERhdGUoKS5nZXRUaW1lKCkgLSBzdGFydFRpbWUpICsgXCIgbXMpXCIpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBjaGVjayBycGMgcmVzcG9uc2UgZm9yIGVycm9yc1xuICAgICAgICB0aGlzLnZhbGlkYXRlUnBjUmVzcG9uc2UocmVzcCwgcGF0aCwgcGFyYW1zKTtcbiAgICAgICAgcmV0dXJuIHJlc3A7XG4gICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICBpZiAoZXJyIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IpIHRocm93IGVycjtcbiAgICAgICAgZWxzZSB0aHJvdyBuZXcgTW9uZXJvUnBjRXJyb3IoZXJyLCBlcnIuc3RhdHVzQ29kZSwgcGF0aCwgcGFyYW1zKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNlbmQgYSBiaW5hcnkgUlBDIHJlcXVlc3QuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIHBhdGggb2YgdGhlIGJpbmFyeSBSUEMgbWV0aG9kIHRvIGludm9rZVxuICAgKiBAcGFyYW0ge29iamVjdH0gW3BhcmFtc10gLSByZXF1ZXN0IHBhcmFtZXRlcnNcbiAgICogQHBhcmFtIHtudW1iZXJ9IFt0aW1lb3V0TXNdIC0gcmVxdWVzdCB0aW1lb3V0IGluIG1pbGxpc2Vjb25kc1xuICAgKiBAcmV0dXJuIHtVaW50OEFycmF5fSB0aGUgYmluYXJ5IHJlc3BvbnNlXG4gICAqL1xuICBhc3luYyBzZW5kQmluYXJ5UmVxdWVzdChwYXRoLCBwYXJhbXM/LCB0aW1lb3V0TXM/KTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gdGhpcy5xdWV1ZVNlbmRSZXF1ZXN0KGFzeW5jICgpID0+IHtcblxuICAgICAgLy8gc2VyaWFsaXplIHBhcmFtc1xuICAgICAgbGV0IHBhcmFtc0JpbiA9IGF3YWl0IE1vbmVyb1V0aWxzLmpzb25Ub0JpbmFyeShwYXJhbXMpO1xuICAgICAgICAgIFxuICAgICAgdHJ5IHtcblxuICAgICAgICAvLyBsb2dnaW5nXG4gICAgICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0TG9nTGV2ZWwoKSA+PSAyKSBMaWJyYXJ5VXRpbHMubG9nKDIsIFwiU2VuZGluZyBiaW5hcnkgcmVxdWVzdCB3aXRoIHBhdGggJ1wiICsgcGF0aCArIFwiJyBhbmQgcGFyYW1zOiBcIiArIEpTT04uc3RyaW5naWZ5KHBhcmFtcykpO1xuXG4gICAgICAgIC8vIHNlbmQgaHR0cCByZXF1ZXN0XG4gICAgICAgIGxldCByZXNwID0gYXdhaXQgSHR0cENsaWVudC5yZXF1ZXN0KHtcbiAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgIHVyaTogdGhpcy5nZXRVcmkoKSArICcvJyArIHBhdGgsXG4gICAgICAgICAgdXNlcm5hbWU6IHRoaXMuZ2V0VXNlcm5hbWUoKSxcbiAgICAgICAgICBwYXNzd29yZDogdGhpcy5nZXRQYXNzd29yZCgpLFxuICAgICAgICAgIGJvZHk6IHBhcmFtc0JpbixcbiAgICAgICAgICBwcm94eVVyaTogdGhpcy5nZXRQcm94eVVyaSgpLFxuICAgICAgICAgIHRpbWVvdXQ6IHRpbWVvdXRNcyA9PT0gdW5kZWZpbmVkID8gdGhpcy50aW1lb3V0TXMgOiB0aW1lb3V0TXMsXG4gICAgICAgICAgcmVqZWN0VW5hdXRob3JpemVkOiB0aGlzLnJlamVjdFVuYXV0aG9yaXplZCxcbiAgICAgICAgICBwcm94eVRvV29ya2VyOiB0aGlzLnByb3h5VG9Xb3JrZXJcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICAvLyB2YWxpZGF0ZSByZXNwb25zZVxuICAgICAgICBNb25lcm9ScGNDb25uZWN0aW9uLnZhbGlkYXRlSHR0cFJlc3BvbnNlKHJlc3ApO1xuICAgICAgICBcbiAgICAgICAgLy8gcHJvY2VzcyByZXNwb25zZVxuICAgICAgICByZXNwID0gcmVzcC5ib2R5O1xuICAgICAgICBpZiAoIShyZXNwIGluc3RhbmNlb2YgVWludDhBcnJheSkpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwicmVzcCBpcyBub3QgdWludDhhcnJheVwiKTtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKHJlc3ApO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyZXNwLmVycm9yKSB0aHJvdyBuZXcgTW9uZXJvUnBjRXJyb3IocmVzcC5lcnJvci5tZXNzYWdlLCByZXNwLmVycm9yLmNvZGUsIHBhdGgsIHBhcmFtcyk7XG4gICAgICAgIHJldHVybiByZXNwO1xuICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yKSB0aHJvdyBlcnI7XG4gICAgICAgIGVsc2UgdGhyb3cgbmV3IE1vbmVyb1JwY0Vycm9yKGVyciwgZXJyLnN0YXR1c0NvZGUsIHBhdGgsIHBhcmFtcyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBnZXRDb25maWcoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHVyaTogdGhpcy51cmksXG4gICAgICB1c2VybmFtZTogdGhpcy51c2VybmFtZSxcbiAgICAgIHBhc3N3b3JkOiB0aGlzLnBhc3N3b3JkLFxuICAgICAgem1xVXJpOiB0aGlzLnptcVVyaSxcbiAgICAgIHByb3h5VXJpOiB0aGlzLnByb3h5VXJpLFxuICAgICAgcmVqZWN0VW5hdXRob3JpemVkOiB0aGlzLnJlamVjdFVuYXV0aG9yaXplZCxcbiAgICAgIHByb3h5VG9Xb3JrZXI6IHRoaXMucHJveHlUb1dvcmtlcixcbiAgICAgIHByaW9yaXR5OiB0aGlzLnByaW9yaXR5LFxuICAgICAgdGltZW91dE1zOiB0aGlzLnRpbWVvdXRNc1xuICAgIH07XG4gIH1cblxuICB0b0pzb24oKSB7XG4gICAgbGV0IGpzb24gPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzKVxuICAgIGpzb24uY2hlY2tDb25uZWN0aW9uTXV0ZXggPSB1bmRlZmluZWQ7XG4gICAganNvbi5zZW5kUmVxdWVzdE11dGV4ID0gdW5kZWZpbmVkO1xuICAgIHJldHVybiBqc29uO1xuICB9XG4gIFxuICB0b1N0cmluZygpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRVcmkoKSArIFwiICh1c2VybmFtZT1cIiArIHRoaXMuZ2V0VXNlcm5hbWUoKSArIFwiLCBwYXNzd29yZD1cIiArICh0aGlzLmdldFBhc3N3b3JkKCkgPyBcIioqKlwiIDogdGhpcy5nZXRQYXNzd29yZCgpKSArIFwiLCB6bXFVcmk9XCIgKyB0aGlzLmdldFptcVVyaSgpICsgXCIsIHByb3h5VXJpPVwiICsgdGhpcy5nZXRQcm94eVVyaSgpICsgXCIsIHByaW9yaXR5PVwiICsgdGhpcy5nZXRQcmlvcml0eSgpICsgXCIsIHRpbWVvdXRNcz1cIiArIHRoaXMuZ2V0VGltZW91dCgpICsgXCIsIGlzT25saW5lPVwiICsgdGhpcy5nZXRJc09ubGluZSgpICsgXCIsIGlzQXV0aGVudGljYXRlZD1cIiArIHRoaXMuZ2V0SXNBdXRoZW50aWNhdGVkKCkgKyBcIilcIjtcbiAgfVxuXG4gIHNldEZha2VEaXNjb25uZWN0ZWQoZmFrZURpc2Nvbm5lY3RlZCkgeyAvLyB1c2VkIHRvIHRlc3QgY29ubmVjdGlvbiBtYW5hZ2VyXG4gICAgdGhpcy5mYWtlRGlzY29ubmVjdGVkID0gZmFrZURpc2Nvbm5lY3RlZDsgXG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIEhFTFBFUlMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICBwcm90ZWN0ZWQgYXN5bmMgcXVldWVDaGVja0Nvbm5lY3Rpb248VD4oYXN5bmNGbjogKCkgPT4gUHJvbWlzZTxUPik6IFByb21pc2U8VD4ge1xuICAgIHJldHVybiB0aGlzLmNoZWNrQ29ubmVjdGlvbk11dGV4LnN1Ym1pdChhc3luY0ZuKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBxdWV1ZVNlbmRSZXF1ZXN0PFQ+KGFzeW5jRm46ICgpID0+IFByb21pc2U8VD4pOiBQcm9taXNlPFQ+IHtcbiAgICByZXR1cm4gdGhpcy5zZW5kUmVxdWVzdE11dGV4LnN1Ym1pdChhc3luY0ZuKTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBzdHJpbmdpZnlCaWdJbnRKc29uKG9iajogYW55KTogc3RyaW5nIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCB0YWcgPSBcImJpZ2ludFwiICsgTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMik7IC8vIHBlci1jYWxsIHRhZyBhdm9pZHMgY29sbGlkaW5nIHdpdGggc3RyaW5nIHZhbHVlc1xuICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShvYmosIChfa2V5LCB2YWwpID0+IHR5cGVvZiB2YWwgPT09IFwiYmlnaW50XCIgPyB0YWcgKyB2YWwudG9TdHJpbmcoKSA6IHZhbCk/LnJlcGxhY2UobmV3IFJlZ0V4cCgnXCInICsgdGFnICsgJygtP1xcXFxkKylcIicsIFwiZ1wiKSwgXCIkMVwiKTsgLy8gd3JpdGUgYmlnaW50cyBhcyBKU09OIG51bWJlcnNcbiAgfVxuXG4gIHByb3RlY3RlZCBzdGF0aWMgcGFyc2VCaWdJbnRKc29uKGJvZHk6IHN0cmluZyk6IGFueSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UoYm9keS5yZXBsYWNlKC8oXCJbXlwiXSpcIlxccyo6XFxzKnxbXFxbLF1cXHMqKShcXGR7MTYsfSkoPz1cXHMqWyxcXF19XSkvZywgJyQxXCIkMlwiJykpOyAvLyBxdW90ZSAxNisgZGlnaXQgdmFsdWVzIGFuZCBhcnJheSBlbGVtZW50cyB0byBwcmVzZXJ2ZSBwcmVjaXNpb25cbiAgfVxuXG4gIHByb3RlY3RlZCBzdGF0aWMgdmFsaWRhdGVIdHRwUmVzcG9uc2UocmVzcCkge1xuICAgIGxldCBjb2RlID0gcmVzcC5zdGF0dXNDb2RlO1xuICAgIGlmIChjb2RlIDwgMjAwIHx8IGNvZGUgPiAyOTkpIHtcbiAgICAgIGxldCBjb250ZW50ID0gcmVzcC5ib2R5O1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb1JwY0Vycm9yKGNvZGUgKyBcIiBcIiArIHJlc3Auc3RhdHVzVGV4dCArICghY29udGVudCA/IFwiXCIgOiAoXCI6IFwiICsgY29udGVudCkpLCBjb2RlLCB1bmRlZmluZWQsIHVuZGVmaW5lZCk7XG4gICAgfVxuICB9XG4gIFxuICBwcm90ZWN0ZWQgdmFsaWRhdGVScGNSZXNwb25zZShyZXNwLCBtZXRob2QsIHBhcmFtcykge1xuICAgIGlmIChyZXNwLmVycm9yID09PSB1bmRlZmluZWQpIHJldHVybjtcbiAgICBsZXQgZXJyb3JNc2cgPSByZXNwLmVycm9yLm1lc3NhZ2U7XG4gICAgaWYgKGVycm9yTXNnID09PSBcIlwiKSBlcnJvck1zZyA9IFwiUmVjZWl2ZWQgZXJyb3IgcmVzcG9uc2UgZnJvbSBSUEMgcmVxdWVzdCB3aXRoIG1ldGhvZCAnXCIgKyBtZXRob2QgKyBcIicgdG8gXCIgKyB0aGlzLmdldFVyaSgpOyAvLyBUT0RPIChtb25lcm8tcHJvamVjdCk6IHJlc3BvbnNlIHNvbWV0aW1lcyBoYXMgZW1wdHkgZXJyb3IgbWVzc2FnZVxuICAgIHRocm93IG5ldyBNb25lcm9ScGNFcnJvcihyZXNwLmVycm9yLm1lc3NhZ2UsIHJlc3AuZXJyb3IuY29kZSwgbWV0aG9kLCBwYXJhbXMpO1xuICB9XG59XG4iXSwibWFwcGluZ3MiOiJ5TEFBQSxJQUFBQSxTQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxXQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7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