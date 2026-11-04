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
   * @param {object | Uint8Array} [params] - request parameters or pre-serialized binary
   * @param {number} [timeoutMs] - request timeout in milliseconds
   * @return {Uint8Array} the binary response
   */
  async sendBinaryRequest(path, params, timeoutMs) {
    return this.queueSendRequest(async () => {

      // Serialize request parameters unless already encoded as binary.
      let paramsBin = params instanceof Uint8Array ? params : await _MoneroUtils.default.jsonToBinary(params);

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfR2VuVXRpbHMiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9IdHRwQ2xpZW50IiwiX0xpYnJhcnlVdGlscyIsIl9Nb25lcm9FcnJvciIsIl9Nb25lcm9ScGNFcnJvciIsIl9Nb25lcm9VdGlscyIsIl9UaHJlYWRQb29sIiwiTW9uZXJvUnBjQ29ubmVjdGlvbiIsIkRFRkFVTFRfQ09ORklHIiwidXJpIiwidW5kZWZpbmVkIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsInptcVVyaSIsInByb3h5VXJpIiwicmVqZWN0VW5hdXRob3JpemVkIiwicHJveHlUb1dvcmtlciIsInByaW9yaXR5IiwidGltZW91dE1zIiwiY29uc3RydWN0b3IiLCJ1cmlPckNvbm5lY3Rpb24iLCJPYmplY3QiLCJhc3NpZ24iLCJzZXRDcmVkZW50aWFscyIsIk1vbmVyb0Vycm9yIiwiR2VuVXRpbHMiLCJub3JtYWxpemVVcmkiLCJjaGVja0Nvbm5lY3Rpb25NdXRleCIsIlRocmVhZFBvb2wiLCJzZW5kUmVxdWVzdE11dGV4IiwiaXNPbmxpbmUiLCJpc0F1dGhlbnRpY2F0ZWQiLCJnZXRVcmkiLCJnZXRVc2VybmFtZSIsImdldFBhc3N3b3JkIiwiZ2V0Wm1xVXJpIiwic2V0Wm1xVXJpIiwiZ2V0UHJveHlVcmkiLCJzZXRQcm94eVVyaSIsImdldFJlamVjdFVuYXV0aG9yaXplZCIsInNldFByb3h5VG9Xb3JrZXIiLCJnZXRQcm94eVRvV29ya2VyIiwic2V0UHJpb3JpdHkiLCJnZXRQcmlvcml0eSIsInNldFRpbWVvdXQiLCJnZXRUaW1lb3V0Iiwic2V0QXR0cmlidXRlIiwia2V5IiwidmFsdWUiLCJhdHRyaWJ1dGVzIiwiTWFwIiwicHV0IiwiZ2V0QXR0cmlidXRlIiwiZ2V0IiwiY2hlY2tDb25uZWN0aW9uIiwicXVldWVDaGVja0Nvbm5lY3Rpb24iLCJMaWJyYXJ5VXRpbHMiLCJsb2FkV2FzbU1vZHVsZSIsImlzT25saW5lQmVmb3JlIiwiaXNBdXRoZW50aWNhdGVkQmVmb3JlIiwic3RhcnRUaW1lIiwiRGF0ZSIsIm5vdyIsImZha2VEaXNjb25uZWN0ZWQiLCJFcnJvciIsImhlaWdodHMiLCJpIiwicHVzaCIsInNlbmRCaW5hcnlSZXF1ZXN0IiwiZXJyIiwicmVzcG9uc2VUaW1lIiwiTW9uZXJvUnBjRXJyb3IiLCJnZXRDb2RlIiwiaXNDb25uZWN0ZWQiLCJnZXRJc09ubGluZSIsInNldE9ubGluZSIsImdldElzQXV0aGVudGljYXRlZCIsInNldEF1dGhlbnRpY2F0ZWQiLCJnZXRSZXNwb25zZVRpbWUiLCJzZXRSZXNwb25zZVRpbWUiLCJyZXNwb25zZVRpbWVNcyIsInNlbmRKc29uUmVxdWVzdCIsIm1ldGhvZCIsInBhcmFtcyIsInF1ZXVlU2VuZFJlcXVlc3QiLCJib2R5Iiwic3RyaW5naWZ5QmlnSW50SnNvbiIsImlkIiwianNvbnJwYyIsImdldExvZ0xldmVsIiwibG9nIiwiZ2V0VGltZSIsInJlc3AiLCJIdHRwQ2xpZW50IiwicmVxdWVzdCIsInRpbWVvdXQiLCJ2YWxpZGF0ZUh0dHBSZXNwb25zZSIsInBhcnNlQmlnSW50SnNvbiIsInJlc3BTdHIiLCJKU09OIiwic3RyaW5naWZ5Iiwic3Vic3RyaW5nIiwiTWF0aCIsIm1pbiIsImxlbmd0aCIsInZhbGlkYXRlUnBjUmVzcG9uc2UiLCJzdGF0dXNDb2RlIiwic2VuZFBhdGhSZXF1ZXN0IiwicGF0aCIsInBhcnNlIiwicGFyYW1zQmluIiwiVWludDhBcnJheSIsIk1vbmVyb1V0aWxzIiwianNvblRvQmluYXJ5IiwiY29uc29sZSIsImVycm9yIiwibWVzc2FnZSIsImNvZGUiLCJnZXRDb25maWciLCJ0b0pzb24iLCJqc29uIiwidG9TdHJpbmciLCJzZXRGYWtlRGlzY29ubmVjdGVkIiwiYXN5bmNGbiIsInN1Ym1pdCIsIm9iaiIsInRhZyIsInJhbmRvbSIsInNsaWNlIiwiX2tleSIsInZhbCIsInJlcGxhY2UiLCJSZWdFeHAiLCJjb250ZW50Iiwic3RhdHVzVGV4dCIsImVycm9yTXNnIiwiZXhwb3J0cyIsImRlZmF1bHQiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy9jb21tb24vTW9uZXJvUnBjQ29ubmVjdGlvbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4vR2VuVXRpbHNcIjtcbmltcG9ydCBIdHRwQ2xpZW50IGZyb20gXCIuL0h0dHBDbGllbnRcIjtcbmltcG9ydCBMaWJyYXJ5VXRpbHMgZnJvbSBcIi4vTGlicmFyeVV0aWxzXCI7XG5pbXBvcnQgTW9uZXJvRXJyb3IgZnJvbSBcIi4vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBNb25lcm9ScGNFcnJvciBmcm9tIFwiLi9Nb25lcm9ScGNFcnJvclwiO1xuaW1wb3J0IE1vbmVyb1V0aWxzIGZyb20gXCIuL01vbmVyb1V0aWxzXCI7XG5pbXBvcnQgVGhyZWFkUG9vbCBmcm9tIFwiLi9UaHJlYWRQb29sXCI7XG5cbi8qKlxuICogTWFpbnRhaW5zIGEgY29ubmVjdGlvbiBhbmQgc2VuZHMgcmVxdWVzdHMgdG8gYSBNb25lcm8gUlBDIEFQSS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTW9uZXJvUnBjQ29ubmVjdGlvbiB7XG5cbiAgLy8gcHVibGljIGluc3RhbmNlIHZhcmlhYmxlc1xuICB1cmk6IHN0cmluZztcbiAgdXNlcm5hbWU6IHN0cmluZztcbiAgcGFzc3dvcmQ6IHN0cmluZztcbiAgem1xVXJpOiBzdHJpbmc7XG4gIHByb3h5VXJpOiBzdHJpbmc7XG4gIHJlamVjdFVuYXV0aG9yaXplZDogYm9vbGVhbjtcbiAgcHJveHlUb1dvcmtlcjogYm9vbGVhbjtcbiAgcHJpb3JpdHk6IG51bWJlcjtcbiAgdGltZW91dE1zOiBudW1iZXI7XG5cbiAgLy8gcHJpdmF0ZSBpbnN0YW5jZSB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIGlzT25saW5lOiBib29sZWFuO1xuICBwcm90ZWN0ZWQgaXNBdXRoZW50aWNhdGVkOiBib29sZWFuO1xuICBwcm90ZWN0ZWQgYXR0cmlidXRlczogYW55O1xuICBwcm90ZWN0ZWQgZmFrZURpc2Nvbm5lY3RlZDogYm9vbGVhbjtcbiAgcHJvdGVjdGVkIHJlc3BvbnNlVGltZTogbnVtYmVyO1xuICBwcm90ZWN0ZWQgY2hlY2tDb25uZWN0aW9uTXV0ZXg6IFRocmVhZFBvb2w7XG4gIHByb3RlY3RlZCBzZW5kUmVxdWVzdE11dGV4OiBUaHJlYWRQb29sO1xuXG4gIC8vIGRlZmF1bHQgY29uZmlnXG4gIC8qKiBAcHJpdmF0ZSAqL1xuICBzdGF0aWMgREVGQVVMVF9DT05GSUc6IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4gPSB7XG4gICAgdXJpOiB1bmRlZmluZWQsXG4gICAgdXNlcm5hbWU6IHVuZGVmaW5lZCxcbiAgICBwYXNzd29yZDogdW5kZWZpbmVkLFxuICAgIHptcVVyaTogdW5kZWZpbmVkLFxuICAgIHByb3h5VXJpOiB1bmRlZmluZWQsXG4gICAgcmVqZWN0VW5hdXRob3JpemVkOiB0cnVlLCAvLyByZWplY3Qgc2VsZi1zaWduZWQgY2VydGlmaWNhdGVzIGlmIHRydWVcbiAgICBwcm94eVRvV29ya2VyOiBmYWxzZSxcbiAgICBwcmlvcml0eTogMCxcbiAgICB0aW1lb3V0TXM6IHVuZGVmaW5lZFxuICB9XG5cbiAgLyoqXG4gICAqIDxwPkNvbnN0cnVjdCBhIFJQQyBjb25uZWN0aW9uLjwvcD5cbiAgICogXG4gICAqIDxwPkV4YW1wbGVzOjwvcD5cbiAgICogXG4gICAqIDxjb2RlPlxuICAgKiBsZXQgY29ubmVjdGlvbjEgPSBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbihcImh0dHA6Ly9sb2NhbGhvc3Q6MzgwODFcIiwgXCJkYWVtb25fdXNlclwiLCBcImRhZW1vbl9wYXNzd29yZF8xMjNcIik8YnI+PGJyPlxuICAgKiBcbiAgICogbGV0IGNvbm5lY3Rpb24yID0gbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24oezxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHVyaTogaHR0cDovL2xvY2FsaG9zdDozODA4MSw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyB1c2VybmFtZTogXCJkYWVtb25fdXNlclwiLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHBhc3N3b3JkOiBcImRhZW1vbl9wYXNzd29yZF8xMjNcIiw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyByZWplY3RVbmF1dGhvcml6ZWQ6IGZhbHNlLCAvLyBhY2NlcHQgc2VsZi1zaWduZWQgY2VydGlmaWNhdGVzIGUuZy4gZm9yIGxvY2FsIGRldmVsb3BtZW50PGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcHJveHlUb1dvcmtlcjogdHJ1ZSAvLyBwcm94eSByZXF1ZXN0IHRvIHdvcmtlciAoZGVmYXVsdCBmYWxzZSk8YnI+XG4gICAqIH0pO1xuICAgKiA8L2NvZGU+XG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ3xQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+fSB1cmlPckNvbm5lY3Rpb24gLSBNb25lcm9ScGNDb25uZWN0aW9uIG9yIFVSSSBvZiB0aGUgUlBDIGVuZHBvaW50XG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1cmlPckNvbm5lY3Rpb24udXJpIC0gVVJJIG9mIHRoZSBSUEMgZW5kcG9pbnRcbiAgICogQHBhcmFtIHtzdHJpbmd9IFt1cmlPckNvbm5lY3Rpb24udXNlcm5hbWVdIC0gdXNlcm5hbWUgdG8gYXV0aGVudGljYXRlIHdpdGggdGhlIFJQQyBlbmRwb2ludCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbdXJpT3JDb25uZWN0aW9uLnBhc3N3b3JkXSAtIHBhc3N3b3JkIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIHRoZSBSUEMgZW5kcG9pbnQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3VyaU9yQ29ubmVjdGlvbi56bXFVcmldIC0gVVJJIG9mIHRoZSBaTVEgZW5kcG9pbnQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3VyaU9yQ29ubmVjdGlvbi5wcm94eVVyaV0gLSBVUkkgb2YgYSBwcm94eSBzZXJ2ZXIgdG8gcm91dGUgcmVxdWVzdHMgdGhyb3VnaCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3VyaU9yQ29ubmVjdGlvbi5yZWplY3RVbmF1dGhvcml6ZWRdIC0gcmVqZWN0cyBzZWxmLXNpZ25lZCBjZXJ0aWZpY2F0ZXMgaWYgdHJ1ZSAoZGVmYXVsdCB0cnVlKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHVyaU9yQ29ubmVjdGlvbi5wcm94eVRvV29ya2VyIC0gcHJveHkgcmVxdWVzdHMgdG8gd29ya2VyIChkZWZhdWx0IHRydWUpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1c2VybmFtZSAtIHVzZXJuYW1lIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIHRoZSBSUEMgZW5kcG9pbnQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGFzc3dvcmQgLSBwYXNzd29yZCB0byBhdXRoZW50aWNhdGUgd2l0aCB0aGUgUlBDIGVuZHBvaW50IChvcHRpb25hbClcbiAgICovXG4gIGNvbnN0cnVjdG9yKHVyaU9yQ29ubmVjdGlvbjogc3RyaW5nIHwgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPiwgdXNlcm5hbWU/OiBzdHJpbmcsIHBhc3N3b3JkPzogc3RyaW5nKSB7XG5cbiAgICAvLyB2YWxpZGF0ZSBhbmQgbm9ybWFsaXplIGNvbmZpZ1xuICAgIGlmICh0eXBlb2YgdXJpT3JDb25uZWN0aW9uID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBPYmplY3QuYXNzaWduKHRoaXMsIE1vbmVyb1JwY0Nvbm5lY3Rpb24uREVGQVVMVF9DT05GSUcpO1xuICAgICAgdGhpcy51cmkgPSB1cmlPckNvbm5lY3Rpb247XG4gICAgICB0aGlzLnNldENyZWRlbnRpYWxzKHVzZXJuYW1lLCBwYXNzd29yZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh1c2VybmFtZSAhPT0gdW5kZWZpbmVkIHx8IHBhc3N3b3JkICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbiBwcm92aWRlIGNvbmZpZyBvYmplY3Qgb3IgcGFyYW1zIGJ1dCBub3QgYm90aFwiKTtcbiAgICAgIE9iamVjdC5hc3NpZ24odGhpcywgTW9uZXJvUnBjQ29ubmVjdGlvbi5ERUZBVUxUX0NPTkZJRywgdXJpT3JDb25uZWN0aW9uKTtcbiAgICAgIHRoaXMuc2V0Q3JlZGVudGlhbHModGhpcy51c2VybmFtZSwgdGhpcy5wYXNzd29yZCk7XG4gICAgfVxuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSB1cmlzXG4gICAgaWYgKHRoaXMudXJpKSB0aGlzLnVyaSA9IEdlblV0aWxzLm5vcm1hbGl6ZVVyaSh0aGlzLnVyaSk7XG4gICAgaWYgKHRoaXMuem1xVXJpKSB0aGlzLnptcVVyaSA9IEdlblV0aWxzLm5vcm1hbGl6ZVVyaSh0aGlzLnptcVVyaSk7XG4gICAgaWYgKHRoaXMucHJveHlVcmkpIHRoaXMucHJveHlVcmkgPSBHZW5VdGlscy5ub3JtYWxpemVVcmkodGhpcy5wcm94eVVyaSk7XG5cbiAgICAvLyBpbml0aWFsaXplIG11dGV4ZXNcbiAgICB0aGlzLmNoZWNrQ29ubmVjdGlvbk11dGV4ID0gbmV3IFRocmVhZFBvb2woMSk7XG4gICAgdGhpcy5zZW5kUmVxdWVzdE11dGV4ID0gbmV3IFRocmVhZFBvb2woMSk7XG4gIH1cbiAgXG4gIHNldENyZWRlbnRpYWxzKHVzZXJuYW1lLCBwYXNzd29yZCkge1xuICAgIGlmICh1c2VybmFtZSA9PT0gXCJcIikgdXNlcm5hbWUgPSB1bmRlZmluZWQ7XG4gICAgaWYgKHBhc3N3b3JkID09PSBcIlwiKSBwYXNzd29yZCA9IHVuZGVmaW5lZDtcbiAgICBpZiAodXNlcm5hbWUgfHwgcGFzc3dvcmQpIHtcbiAgICAgIGlmICghdXNlcm5hbWUpIHRocm93IG5ldyBNb25lcm9FcnJvcihcInVzZXJuYW1lIG11c3QgYmUgZGVmaW5lZCBiZWNhdXNlIHBhc3N3b3JkIGlzIGRlZmluZWRcIik7XG4gICAgICBpZiAoIXBhc3N3b3JkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJwYXNzd29yZCBtdXN0IGJlIGRlZmluZWQgYmVjYXVzZSB1c2VybmFtZSBpcyBkZWZpbmVkXCIpO1xuICAgIH1cbiAgICBpZiAodGhpcy51c2VybmFtZSA9PT0gXCJcIikgdGhpcy51c2VybmFtZSA9IHVuZGVmaW5lZDtcbiAgICBpZiAodGhpcy5wYXNzd29yZCA9PT0gXCJcIikgdGhpcy5wYXNzd29yZCA9IHVuZGVmaW5lZDtcbiAgICBpZiAodGhpcy51c2VybmFtZSAhPT0gdXNlcm5hbWUgfHwgdGhpcy5wYXNzd29yZCAhPT0gcGFzc3dvcmQpIHtcbiAgICAgIHRoaXMuaXNPbmxpbmUgPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgdGhpcy51c2VybmFtZSA9IHVzZXJuYW1lO1xuICAgIHRoaXMucGFzc3dvcmQgPSBwYXNzd29yZDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgZ2V0VXJpKCkge1xuICAgIHJldHVybiB0aGlzLnVyaTtcbiAgfVxuXG4gIGdldFVzZXJuYW1lKCkge1xuICAgIHJldHVybiB0aGlzLnVzZXJuYW1lID8gdGhpcy51c2VybmFtZSA6IFwiXCI7XG4gIH1cbiAgXG4gIGdldFBhc3N3b3JkKCkge1xuICAgIHJldHVybiB0aGlzLnBhc3N3b3JkID8gdGhpcy5wYXNzd29yZCA6IFwiXCI7XG4gIH1cblxuICBnZXRabXFVcmkoKSB7XG4gICAgcmV0dXJuIHRoaXMuem1xVXJpO1xuICB9XG5cbiAgc2V0Wm1xVXJpKHptcVVyaSkge1xuICAgIHRoaXMuem1xVXJpID0gem1xVXJpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBnZXRQcm94eVVyaSgpIHtcbiAgICByZXR1cm4gdGhpcy5wcm94eVVyaTtcbiAgfVxuXG4gIHNldFByb3h5VXJpKHByb3h5VXJpKSB7XG4gICAgdGhpcy5wcm94eVVyaSA9IHByb3h5VXJpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBnZXRSZWplY3RVbmF1dGhvcml6ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVqZWN0VW5hdXRob3JpemVkO1xuICB9XG4gIFxuICBzZXRQcm94eVRvV29ya2VyKHByb3h5VG9Xb3JrZXIpIHtcbiAgICB0aGlzLnByb3h5VG9Xb3JrZXIgPSBwcm94eVRvV29ya2VyO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBnZXRQcm94eVRvV29ya2VyKCkge1xuICAgIHJldHVybiB0aGlzLnByb3h5VG9Xb3JrZXI7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZXQgdGhlIGNvbm5lY3Rpb24ncyBwcmlvcml0eSByZWxhdGl2ZSB0byBvdGhlciBjb25uZWN0aW9ucy4gUHJpb3JpdHkgMSBpcyBoaWdoZXN0LFxuICAgKiB0aGVuIHByaW9yaXR5IDIsIGV0Yy4gVGhlIGRlZmF1bHQgcHJpb3JpdHkgb2YgMCBpcyBsb3dlc3QgcHJpb3JpdHkuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gW3ByaW9yaXR5XSAtIHRoZSBjb25uZWN0aW9uIHByaW9yaXR5IChkZWZhdWx0IDApXG4gICAqIEByZXR1cm4ge01vbmVyb1JwY0Nvbm5lY3Rpb259IHRoaXMgY29ubmVjdGlvblxuICAgKi9cbiAgc2V0UHJpb3JpdHkocHJpb3JpdHkpIHtcbiAgICBpZiAoIShwcmlvcml0eSA+PSAwKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiUHJpb3JpdHkgbXVzdCBiZSA+PSAwXCIpO1xuICAgIHRoaXMucHJpb3JpdHkgPSBwcmlvcml0eTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldFByaW9yaXR5KCkge1xuICAgIHJldHVybiB0aGlzLnByaW9yaXR5OyBcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIFJQQyByZXF1ZXN0IHRpbWVvdXQgaW4gbWlsbGlzZWNvbmRzLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IHRpbWVvdXRNcyBpcyB0aGUgdGltZW91dCBpbiBtaWxsaXNlY29uZHMsIDAgdG8gZGlzYWJsZSB0aW1lb3V0LCBvciB1bmRlZmluZWQgdG8gdXNlIGRlZmF1bHRcbiAgICogQHJldHVybiB7TW9uZXJvUnBjQ29ubmVjdGlvbn0gdGhpcyBjb25uZWN0aW9uXG4gICAqL1xuICBzZXRUaW1lb3V0KHRpbWVvdXRNczogbnVtYmVyKSB7XG4gICAgdGhpcy50aW1lb3V0TXMgPSB0aW1lb3V0TXM7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXRUaW1lb3V0KCkge1xuICAgIHJldHVybiB0aGlzLnRpbWVvdXRNcztcbiAgfVxuICBcbiAgc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpIHtcbiAgICBpZiAoIXRoaXMuYXR0cmlidXRlcykgdGhpcy5hdHRyaWJ1dGVzID0gbmV3IE1hcCgpO1xuICAgIHRoaXMuYXR0cmlidXRlcy5wdXQoa2V5LCB2YWx1ZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIGdldEF0dHJpYnV0ZShrZXkpIHtcbiAgICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzLmdldChrZXkpO1xuICB9XG4gIFxuICAvKipcbiAgICogQ2hlY2sgdGhlIGNvbm5lY3Rpb24gc3RhdHVzIHRvIHVwZGF0ZSBpc09ubGluZSwgaXNBdXRoZW50aWNhdGVkLCBhbmQgcmVzcG9uc2UgdGltZS5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB0aW1lb3V0TXMgLSBtYXhpbXVtIHJlc3BvbnNlIHRpbWUgYmVmb3JlIGNvbnNpZGVyZWQgb2ZmbGluZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSB0cnVlIGlmIHRoZXJlIGlzIGEgY2hhbmdlIGluIHN0YXR1cywgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBhc3luYyBjaGVja0Nvbm5lY3Rpb24odGltZW91dE1zKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIHRoaXMucXVldWVDaGVja0Nvbm5lY3Rpb24oYXN5bmMgKCkgPT4ge1xuICAgICAgYXdhaXQgTGlicmFyeVV0aWxzLmxvYWRXYXNtTW9kdWxlKCk7IC8vIGNhY2hlIHdhc20gZm9yIGJpbmFyeSByZXF1ZXN0XG4gICAgICBsZXQgaXNPbmxpbmVCZWZvcmUgPSB0aGlzLmlzT25saW5lO1xuICAgICAgbGV0IGlzQXV0aGVudGljYXRlZEJlZm9yZSA9IHRoaXMuaXNBdXRoZW50aWNhdGVkO1xuICAgICAgbGV0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAodGhpcy5mYWtlRGlzY29ubmVjdGVkKSB0aHJvdyBuZXcgRXJyb3IoXCJDb25uZWN0aW9uIGlzIGZha2UgZGlzY29ubmVjdGVkXCIpO1xuICAgICAgICBsZXQgaGVpZ2h0cyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDEwMDsgaSsrKSBoZWlnaHRzLnB1c2goaSk7XG4gICAgICAgIGF3YWl0IHRoaXMuc2VuZEJpbmFyeVJlcXVlc3QoXCJnZXRfYmxvY2tzX2J5X2hlaWdodC5iaW5cIiwge2hlaWdodHM6IGhlaWdodHN9LCB0aW1lb3V0TXMpOyAvLyBhc3N1bWUgZGFlbW9uIGNvbm5lY3Rpb25cbiAgICAgICAgdGhpcy5pc09ubGluZSA9IHRydWU7XG4gICAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gdHJ1ZTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICB0aGlzLmlzT25saW5lID0gZmFsc2U7XG4gICAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLnJlc3BvbnNlVGltZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yKSB7XG4gICAgICAgICAgaWYgKGVyci5nZXRDb2RlKCkgPT09IDQwMSkge1xuICAgICAgICAgICAgdGhpcy5pc09ubGluZSA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IGZhbHNlO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZXJyLmdldENvZGUoKSA9PT0gNDA0KSB7IC8vIGZhbGxiYWNrIHRvIGxhdGVuY3kgY2hlY2tcbiAgICAgICAgICAgIHRoaXMuaXNPbmxpbmUgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHRoaXMuaXNPbmxpbmUpIHRoaXMucmVzcG9uc2VUaW1lID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcbiAgICAgIHJldHVybiBpc09ubGluZUJlZm9yZSAhPT0gdGhpcy5pc09ubGluZSB8fCBpc0F1dGhlbnRpY2F0ZWRCZWZvcmUgIT09IHRoaXMuaXNBdXRoZW50aWNhdGVkO1xuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBjb25uZWN0aW9uIGlzIGNvbm5lY3RlZCBhY2NvcmRpbmcgdG8gdGhlIGxhc3QgY2FsbCB0byBjaGVja0Nvbm5lY3Rpb24oKS5cbiAgICogXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgb3IgZmFsc2UgdG8gaW5kaWNhdGUgaWYgY29ubmVjdGVkLCBvciB1bmRlZmluZWQgaWYgY2hlY2tDb25uZWN0aW9uKCkgaGFzIG5vdCBiZWVuIGNhbGxlZFxuICAgKi9cbiAgaXNDb25uZWN0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNPbmxpbmUgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IHRoaXMuaXNPbmxpbmUgJiYgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgIT09IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgY29ubmVjdGlvbiBpcyBvbmxpbmUgYWNjb3JkaW5nIHRvIHRoZSBsYXN0IGNhbGwgdG8gY2hlY2tDb25uZWN0aW9uKCkuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIG9yIGZhbHNlIHRvIGluZGljYXRlIGlmIG9ubGluZSwgb3IgdW5kZWZpbmVkIGlmIGNoZWNrQ29ubmVjdGlvbigpIGhhcyBub3QgYmVlbiBjYWxsZWRcbiAgICovXG4gIGdldElzT25saW5lKCkge1xuICAgIHJldHVybiB0aGlzLmlzT25saW5lO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgY29ubmVjdGlvbidzIG9ubGluZSBzdGF0dXMuXG4gICAqIFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGlzT25saW5lIC0gc2V0cyBpZiB0aGUgY29ubmVjdGlvbiBpcyBvbmxpbmVcbiAgICogQHJldHVybiB7TW9uZXJvUnBjQ29ubmVjdGlvbn0gdGhpcyBjb25uZWN0aW9uXG4gICAqL1xuICBzZXRPbmxpbmUoaXNPbmxpbmUpIHtcbiAgICB0aGlzLmlzT25saW5lID0gaXNPbmxpbmU7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBjb25uZWN0aW9uIGlzIGF1dGhlbnRpY2F0ZWQgYWNjb3JkaW5nIHRvIHRoZSBsYXN0IGNhbGwgdG8gY2hlY2tDb25uZWN0aW9uKCkuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIGF1dGhlbnRpY2F0ZWQgb3Igbm8gYXV0aGVudGljYXRpb24sIGZhbHNlIGlmIG5vdCBhdXRoZW50aWNhdGVkLCBvciB1bmRlZmluZWQgaWYgY2hlY2tDb25uZWN0aW9uKCkgaGFzIG5vdCBiZWVuIGNhbGxlZFxuICAgKi9cbiAgZ2V0SXNBdXRoZW50aWNhdGVkKCkge1xuICAgIHJldHVybiB0aGlzLmlzQXV0aGVudGljYXRlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIGNvbm5lY3Rpb24ncyBhdXRoZW50aWNhdGVkIHN0YXR1cy5cbiAgICogXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaXNBdXRoZW50aWNhdGVkIC0gc2V0cyBpZiB0aGUgY29ubmVjdGlvbiBpcyBhdXRoZW50aWNhdGVkXG4gICAqIEByZXR1cm4ge01vbmVyb1JwY0Nvbm5lY3Rpb259IHRoaXMgY29ubmVjdGlvblxuICAgKi9cbiAgc2V0QXV0aGVudGljYXRlZChpc0F1dGhlbnRpY2F0ZWQpIHtcbiAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IGlzQXV0aGVudGljYXRlZDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHJlc3BvbnNlIHRpbWUsIHdoaWNoIGlzIHNldCBhdXRvbWF0aWNhbGx5IGJ5IGNhbGxpbmcgY2hlY2tDb25uZWN0aW9uKCkuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtudW1iZXJ9IHRoZSByZXNwb25zZSB0aW1lIG9mIHRoaXMgY29ubmVjdGlvbiBpbiBtaWxsaXNlY29uZHNcbiAgICovXG4gIGdldFJlc3BvbnNlVGltZSgpIHtcbiAgICByZXR1cm4gdGhpcy5yZXNwb25zZVRpbWU7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBjb25uZWN0aW9uJ3MgcmVzcG9uc2UgdGltZS5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSByZXNwb25zZVRpbWVNcyAtIHJlc3BvbnNlIHRpbWUgaW4gbWlsbGlzZWNvbmRzXG4gICAqIEByZXR1cm4ge01vbmVyb1JwY0Nvbm5lY3Rpb259IHRoaXMgY29ubmVjdGlvblxuICAgKi9cbiAgc2V0UmVzcG9uc2VUaW1lKHJlc3BvbnNlVGltZU1zKSB7XG4gICAgdGhpcy5yZXNwb25zZVRpbWUgPSByZXNwb25zZVRpbWVNcztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIGEgSlNPTiBSUEMgcmVxdWVzdC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZXRob2QgLSBKU09OIFJQQyBtZXRob2QgdG8gaW52b2tlXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXMgLSByZXF1ZXN0IHBhcmFtZXRlcnNcbiAgICogQHBhcmFtIHtudW1iZXJ9IFt0aW1lb3V0TXNdIC0gb3ZlcnJpZGVzIHRoZSByZXF1ZXN0IHRpbWVvdXQgaW4gbWlsbGlzZWNvbmRzXG4gICAqIEByZXR1cm4ge29iamVjdH0gaXMgdGhlIHJlc3BvbnNlIG1hcFxuICAgKi9cbiAgYXN5bmMgc2VuZEpzb25SZXF1ZXN0KG1ldGhvZCwgcGFyYW1zPywgdGltZW91dE1zPyk6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIHRoaXMucXVldWVTZW5kUmVxdWVzdChhc3luYyAoKSA9PiB7XG4gICAgICB0cnkge1xuXG4gICAgICAgIC8vIGJ1aWxkIHJlcXVlc3QgYm9keVxuICAgICAgICBsZXQgYm9keSA9IE1vbmVyb1JwY0Nvbm5lY3Rpb24uc3RyaW5naWZ5QmlnSW50SnNvbih7ICAvLyBib2R5IGlzIHN0cmluZ2lmaWVkIHNvIHRleHQvcGxhaW4gaXMgcmV0dXJuZWQgc28gYmlnaW50cyBhcmUgcHJlc2VydmVkXG4gICAgICAgICAgaWQ6IFwiMFwiLFxuICAgICAgICAgIGpzb25ycGM6IFwiMi4wXCIsXG4gICAgICAgICAgbWV0aG9kOiBtZXRob2QsXG4gICAgICAgICAgcGFyYW1zOiBwYXJhbXNcbiAgICAgICAgfSk7XG4gIFxuICAgICAgICAvLyBsb2dnaW5nXG4gICAgICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0TG9nTGV2ZWwoKSA+PSAyKSBMaWJyYXJ5VXRpbHMubG9nKDIsIFwiU2VuZGluZyBqc29uIHJlcXVlc3Qgd2l0aCBtZXRob2QgJ1wiICsgbWV0aG9kICsgXCInIGFuZCBib2R5OiBcIiArIGJvZHkpO1xuXG4gICAgICAgIC8vIHNlbmQgaHR0cCByZXF1ZXN0XG4gICAgICAgIGxldCBzdGFydFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgbGV0IHJlc3AgPSBhd2FpdCBIdHRwQ2xpZW50LnJlcXVlc3Qoe1xuICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgICAgdXJpOiB0aGlzLmdldFVyaSgpICsgJy9qc29uX3JwYycsXG4gICAgICAgICAgdXNlcm5hbWU6IHRoaXMuZ2V0VXNlcm5hbWUoKSxcbiAgICAgICAgICBwYXNzd29yZDogdGhpcy5nZXRQYXNzd29yZCgpLFxuICAgICAgICAgIGJvZHk6IGJvZHksXG4gICAgICAgICAgcHJveHlVcmk6IHRoaXMuZ2V0UHJveHlVcmkoKSxcbiAgICAgICAgICB0aW1lb3V0OiB0aW1lb3V0TXMgPT09IHVuZGVmaW5lZCA/IHRoaXMudGltZW91dE1zIDogdGltZW91dE1zLFxuICAgICAgICAgIHJlamVjdFVuYXV0aG9yaXplZDogdGhpcy5yZWplY3RVbmF1dGhvcml6ZWQsXG4gICAgICAgICAgcHJveHlUb1dvcmtlcjogdGhpcy5wcm94eVRvV29ya2VyXG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gdmFsaWRhdGUgcmVzcG9uc2VcbiAgICAgICAgTW9uZXJvUnBjQ29ubmVjdGlvbi52YWxpZGF0ZUh0dHBSZXNwb25zZShyZXNwKTtcbiAgICAgICAgXG4gICAgICAgIC8vIGRlc2VyaWFsaXplIHJlc3BvbnNlXG4gICAgICAgIGlmIChyZXNwLmJvZHlbMF0gIT0gJ3snKSB0aHJvdyByZXNwLmJvZHk7XG4gICAgICAgIHJlc3AgPSBNb25lcm9ScGNDb25uZWN0aW9uLnBhcnNlQmlnSW50SnNvbihyZXNwLmJvZHkpO1xuICAgICAgICBpZiAoTGlicmFyeVV0aWxzLmdldExvZ0xldmVsKCkgPj0gMykge1xuICAgICAgICAgIGxldCByZXNwU3RyID0gSlNPTi5zdHJpbmdpZnkocmVzcCk7XG4gICAgICAgICAgTGlicmFyeVV0aWxzLmxvZygzLCBcIlJlY2VpdmVkIHJlc3BvbnNlIGZyb20gbWV0aG9kPSdcIiArIG1ldGhvZCArIFwiJywgcmVzcG9uc2U9XCIgKyByZXNwU3RyLnN1YnN0cmluZygwLCBNYXRoLm1pbigxMDAwLCByZXNwU3RyLmxlbmd0aCkpICsgXCIoXCIgKyAobmV3IERhdGUoKS5nZXRUaW1lKCkgLSBzdGFydFRpbWUpICsgXCIgbXMpXCIpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBjaGVjayBycGMgcmVzcG9uc2UgZm9yIGVycm9yc1xuICAgICAgICB0aGlzLnZhbGlkYXRlUnBjUmVzcG9uc2UocmVzcCwgbWV0aG9kLCBwYXJhbXMpO1xuICAgICAgICByZXR1cm4gcmVzcDtcbiAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvcikgdGhyb3cgZXJyO1xuICAgICAgICBlbHNlIHRocm93IG5ldyBNb25lcm9ScGNFcnJvcihlcnIsIGVyci5zdGF0dXNDb2RlLCBtZXRob2QsIHBhcmFtcyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZW5kIGEgUlBDIHJlcXVlc3QgdG8gdGhlIGdpdmVuIHBhdGggYW5kIHdpdGggdGhlIGdpdmVuIHBhcmFtdGVycy5cbiAgICogXG4gICAqIEUuZy4gXCIvZ2V0X3RyYW5zYWN0aW9uc1wiIHdpdGggcGFyYW1zXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIEpTT04gUlBDIHBhdGggdG8gaW52b2tlXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXMgLSByZXF1ZXN0IHBhcmFtZXRlcnNcbiAgICogQHBhcmFtIHtudW1iZXJ9IFt0aW1lb3V0TXNdIC0gb3ZlcnJpZGVzIHRoZSByZXF1ZXN0IHRpbWVvdXQgaW4gbWlsbGlzZWNvbmRzXG4gICAqIEByZXR1cm4ge29iamVjdH0gaXMgdGhlIHJlc3BvbnNlIG1hcFxuICAgKi9cbiAgYXN5bmMgc2VuZFBhdGhSZXF1ZXN0KHBhdGgsIHBhcmFtcz8sIHRpbWVvdXRNcz8pOiBQcm9taXNlPGFueT4ge1xuICAgIHJldHVybiB0aGlzLnF1ZXVlU2VuZFJlcXVlc3QoYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHtcblxuICAgICAgICAvLyBsb2dnaW5nXG4gICAgICAgIGxldCBib2R5ID0gTW9uZXJvUnBjQ29ubmVjdGlvbi5zdHJpbmdpZnlCaWdJbnRKc29uKHBhcmFtcyk7XG4gICAgICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0TG9nTGV2ZWwoKSA+PSAyKSBMaWJyYXJ5VXRpbHMubG9nKDIsIFwiU2VuZGluZyBwYXRoIHJlcXVlc3Qgd2l0aCBwYXRoICdcIiArIHBhdGggKyBcIicgYW5kIHBhcmFtczogXCIgKyBib2R5KTtcblxuICAgICAgICAvLyBzZW5kIGh0dHAgcmVxdWVzdFxuICAgICAgICBsZXQgc3RhcnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgIGxldCByZXNwID0gYXdhaXQgSHR0cENsaWVudC5yZXF1ZXN0KHtcbiAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgIHVyaTogdGhpcy5nZXRVcmkoKSArICcvJyArIHBhdGgsXG4gICAgICAgICAgdXNlcm5hbWU6IHRoaXMuZ2V0VXNlcm5hbWUoKSxcbiAgICAgICAgICBwYXNzd29yZDogdGhpcy5nZXRQYXNzd29yZCgpLFxuICAgICAgICAgIGJvZHk6IGJvZHksICAvLyBib2R5IGlzIHN0cmluZ2lmaWVkIHNvIHRleHQvcGxhaW4gaXMgcmV0dXJuZWQgc28gYmlnaW50cyBhcmUgcHJlc2VydmVkXG4gICAgICAgICAgcHJveHlVcmk6IHRoaXMuZ2V0UHJveHlVcmkoKSxcbiAgICAgICAgICB0aW1lb3V0OiB0aW1lb3V0TXMgPT09IHVuZGVmaW5lZCA/IHRoaXMudGltZW91dE1zIDogdGltZW91dE1zLFxuICAgICAgICAgIHJlamVjdFVuYXV0aG9yaXplZDogdGhpcy5yZWplY3RVbmF1dGhvcml6ZWQsXG4gICAgICAgICAgcHJveHlUb1dvcmtlcjogdGhpcy5wcm94eVRvV29ya2VyXG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gdmFsaWRhdGUgcmVzcG9uc2VcbiAgICAgICAgTW9uZXJvUnBjQ29ubmVjdGlvbi52YWxpZGF0ZUh0dHBSZXNwb25zZShyZXNwKTtcbiAgICAgICAgXG4gICAgICAgIC8vIGRlc2VyaWFsaXplIHJlc3BvbnNlXG4gICAgICAgIGlmIChyZXNwLmJvZHlbMF0gIT0gJ3snKSB0aHJvdyByZXNwLmJvZHk7XG4gICAgICAgIHJlc3AgPSBNb25lcm9ScGNDb25uZWN0aW9uLnBhcnNlQmlnSW50SnNvbihyZXNwLmJvZHkpO1xuICAgICAgICBpZiAodHlwZW9mIHJlc3AgPT09IFwic3RyaW5nXCIpIHJlc3AgPSBKU09OLnBhcnNlKHJlc3ApOyAgLy8gVE9ETzogc29tZSByZXNwb25zZXMgcmV0dXJuZWQgYXMgc3RyaW5ncz9cbiAgICAgICAgaWYgKExpYnJhcnlVdGlscy5nZXRMb2dMZXZlbCgpID49IDMpIHtcbiAgICAgICAgICBsZXQgcmVzcFN0ciA9IEpTT04uc3RyaW5naWZ5KHJlc3ApO1xuICAgICAgICAgIExpYnJhcnlVdGlscy5sb2coMywgXCJSZWNlaXZlZCByZXNwb25zZSBmcm9tIHBhdGg9J1wiICsgcGF0aCArIFwiJywgcmVzcG9uc2U9XCIgKyByZXNwU3RyLnN1YnN0cmluZygwLCBNYXRoLm1pbigxMDAwLCByZXNwU3RyLmxlbmd0aCkpICsgXCIoXCIgKyAobmV3IERhdGUoKS5nZXRUaW1lKCkgLSBzdGFydFRpbWUpICsgXCIgbXMpXCIpO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICAvLyBjaGVjayBycGMgcmVzcG9uc2UgZm9yIGVycm9yc1xuICAgICAgICB0aGlzLnZhbGlkYXRlUnBjUmVzcG9uc2UocmVzcCwgcGF0aCwgcGFyYW1zKTtcbiAgICAgICAgcmV0dXJuIHJlc3A7XG4gICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICBpZiAoZXJyIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IpIHRocm93IGVycjtcbiAgICAgICAgZWxzZSB0aHJvdyBuZXcgTW9uZXJvUnBjRXJyb3IoZXJyLCBlcnIuc3RhdHVzQ29kZSwgcGF0aCwgcGFyYW1zKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNlbmQgYSBiaW5hcnkgUlBDIHJlcXVlc3QuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIHBhdGggb2YgdGhlIGJpbmFyeSBSUEMgbWV0aG9kIHRvIGludm9rZVxuICAgKiBAcGFyYW0ge29iamVjdCB8IFVpbnQ4QXJyYXl9IFtwYXJhbXNdIC0gcmVxdWVzdCBwYXJhbWV0ZXJzIG9yIHByZS1zZXJpYWxpemVkIGJpbmFyeVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3RpbWVvdXRNc10gLSByZXF1ZXN0IHRpbWVvdXQgaW4gbWlsbGlzZWNvbmRzXG4gICAqIEByZXR1cm4ge1VpbnQ4QXJyYXl9IHRoZSBiaW5hcnkgcmVzcG9uc2VcbiAgICovXG4gIGFzeW5jIHNlbmRCaW5hcnlSZXF1ZXN0KHBhdGgsIHBhcmFtcz8sIHRpbWVvdXRNcz8pOiBQcm9taXNlPGFueT4ge1xuICAgIHJldHVybiB0aGlzLnF1ZXVlU2VuZFJlcXVlc3QoYXN5bmMgKCkgPT4ge1xuXG4gICAgICAvLyBTZXJpYWxpemUgcmVxdWVzdCBwYXJhbWV0ZXJzIHVubGVzcyBhbHJlYWR5IGVuY29kZWQgYXMgYmluYXJ5LlxuICAgICAgbGV0IHBhcmFtc0JpbiA9IHBhcmFtcyBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkgPyBwYXJhbXMgOiBhd2FpdCBNb25lcm9VdGlscy5qc29uVG9CaW5hcnkocGFyYW1zKTtcbiAgICAgICAgICBcbiAgICAgIHRyeSB7XG5cbiAgICAgICAgLy8gbG9nZ2luZ1xuICAgICAgICBpZiAoTGlicmFyeVV0aWxzLmdldExvZ0xldmVsKCkgPj0gMikgTGlicmFyeVV0aWxzLmxvZygyLCBcIlNlbmRpbmcgYmluYXJ5IHJlcXVlc3Qgd2l0aCBwYXRoICdcIiArIHBhdGggKyBcIicgYW5kIHBhcmFtczogXCIgKyBKU09OLnN0cmluZ2lmeShwYXJhbXMpKTtcblxuICAgICAgICAvLyBzZW5kIGh0dHAgcmVxdWVzdFxuICAgICAgICBsZXQgcmVzcCA9IGF3YWl0IEh0dHBDbGllbnQucmVxdWVzdCh7XG4gICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgICB1cmk6IHRoaXMuZ2V0VXJpKCkgKyAnLycgKyBwYXRoLFxuICAgICAgICAgIHVzZXJuYW1lOiB0aGlzLmdldFVzZXJuYW1lKCksXG4gICAgICAgICAgcGFzc3dvcmQ6IHRoaXMuZ2V0UGFzc3dvcmQoKSxcbiAgICAgICAgICBib2R5OiBwYXJhbXNCaW4sXG4gICAgICAgICAgcHJveHlVcmk6IHRoaXMuZ2V0UHJveHlVcmkoKSxcbiAgICAgICAgICB0aW1lb3V0OiB0aW1lb3V0TXMgPT09IHVuZGVmaW5lZCA/IHRoaXMudGltZW91dE1zIDogdGltZW91dE1zLFxuICAgICAgICAgIHJlamVjdFVuYXV0aG9yaXplZDogdGhpcy5yZWplY3RVbmF1dGhvcml6ZWQsXG4gICAgICAgICAgcHJveHlUb1dvcmtlcjogdGhpcy5wcm94eVRvV29ya2VyXG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gdmFsaWRhdGUgcmVzcG9uc2VcbiAgICAgICAgTW9uZXJvUnBjQ29ubmVjdGlvbi52YWxpZGF0ZUh0dHBSZXNwb25zZShyZXNwKTtcbiAgICAgICAgXG4gICAgICAgIC8vIHByb2Nlc3MgcmVzcG9uc2VcbiAgICAgICAgcmVzcCA9IHJlc3AuYm9keTtcbiAgICAgICAgaWYgKCEocmVzcCBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcInJlc3AgaXMgbm90IHVpbnQ4YXJyYXlcIik7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihyZXNwKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVzcC5lcnJvcikgdGhyb3cgbmV3IE1vbmVyb1JwY0Vycm9yKHJlc3AuZXJyb3IubWVzc2FnZSwgcmVzcC5lcnJvci5jb2RlLCBwYXRoLCBwYXJhbXMpO1xuICAgICAgICByZXR1cm4gcmVzcDtcbiAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvcikgdGhyb3cgZXJyO1xuICAgICAgICBlbHNlIHRocm93IG5ldyBNb25lcm9ScGNFcnJvcihlcnIsIGVyci5zdGF0dXNDb2RlLCBwYXRoLCBwYXJhbXMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZ2V0Q29uZmlnKCkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmk6IHRoaXMudXJpLFxuICAgICAgdXNlcm5hbWU6IHRoaXMudXNlcm5hbWUsXG4gICAgICBwYXNzd29yZDogdGhpcy5wYXNzd29yZCxcbiAgICAgIHptcVVyaTogdGhpcy56bXFVcmksXG4gICAgICBwcm94eVVyaTogdGhpcy5wcm94eVVyaSxcbiAgICAgIHJlamVjdFVuYXV0aG9yaXplZDogdGhpcy5yZWplY3RVbmF1dGhvcml6ZWQsXG4gICAgICBwcm94eVRvV29ya2VyOiB0aGlzLnByb3h5VG9Xb3JrZXIsXG4gICAgICBwcmlvcml0eTogdGhpcy5wcmlvcml0eSxcbiAgICAgIHRpbWVvdXRNczogdGhpcy50aW1lb3V0TXNcbiAgICB9O1xuICB9XG5cbiAgdG9Kc29uKCkge1xuICAgIGxldCBqc29uID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcylcbiAgICBqc29uLmNoZWNrQ29ubmVjdGlvbk11dGV4ID0gdW5kZWZpbmVkO1xuICAgIGpzb24uc2VuZFJlcXVlc3RNdXRleCA9IHVuZGVmaW5lZDtcbiAgICByZXR1cm4ganNvbjtcbiAgfVxuICBcbiAgdG9TdHJpbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0VXJpKCkgKyBcIiAodXNlcm5hbWU9XCIgKyB0aGlzLmdldFVzZXJuYW1lKCkgKyBcIiwgcGFzc3dvcmQ9XCIgKyAodGhpcy5nZXRQYXNzd29yZCgpID8gXCIqKipcIiA6IHRoaXMuZ2V0UGFzc3dvcmQoKSkgKyBcIiwgem1xVXJpPVwiICsgdGhpcy5nZXRabXFVcmkoKSArIFwiLCBwcm94eVVyaT1cIiArIHRoaXMuZ2V0UHJveHlVcmkoKSArIFwiLCBwcmlvcml0eT1cIiArIHRoaXMuZ2V0UHJpb3JpdHkoKSArIFwiLCB0aW1lb3V0TXM9XCIgKyB0aGlzLmdldFRpbWVvdXQoKSArIFwiLCBpc09ubGluZT1cIiArIHRoaXMuZ2V0SXNPbmxpbmUoKSArIFwiLCBpc0F1dGhlbnRpY2F0ZWQ9XCIgKyB0aGlzLmdldElzQXV0aGVudGljYXRlZCgpICsgXCIpXCI7XG4gIH1cblxuICBzZXRGYWtlRGlzY29ubmVjdGVkKGZha2VEaXNjb25uZWN0ZWQpIHsgLy8gdXNlZCB0byB0ZXN0IGNvbm5lY3Rpb24gbWFuYWdlclxuICAgIHRoaXMuZmFrZURpc2Nvbm5lY3RlZCA9IGZha2VEaXNjb25uZWN0ZWQ7IFxuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUFJJVkFURSBIRUxQRVJTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgcHJvdGVjdGVkIGFzeW5jIHF1ZXVlQ2hlY2tDb25uZWN0aW9uPFQ+KGFzeW5jRm46ICgpID0+IFByb21pc2U8VD4pOiBQcm9taXNlPFQ+IHtcbiAgICByZXR1cm4gdGhpcy5jaGVja0Nvbm5lY3Rpb25NdXRleC5zdWJtaXQoYXN5bmNGbik7XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgcXVldWVTZW5kUmVxdWVzdDxUPihhc3luY0ZuOiAoKSA9PiBQcm9taXNlPFQ+KTogUHJvbWlzZTxUPiB7XG4gICAgcmV0dXJuIHRoaXMuc2VuZFJlcXVlc3RNdXRleC5zdWJtaXQoYXN5bmNGbik7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgc3RyaW5naWZ5QmlnSW50SnNvbihvYmo6IGFueSk6IHN0cmluZyB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgdGFnID0gXCJiaWdpbnRcIiArIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIpOyAvLyBwZXItY2FsbCB0YWcgYXZvaWRzIGNvbGxpZGluZyB3aXRoIHN0cmluZyB2YWx1ZXNcbiAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkob2JqLCAoX2tleSwgdmFsKSA9PiB0eXBlb2YgdmFsID09PSBcImJpZ2ludFwiID8gdGFnICsgdmFsLnRvU3RyaW5nKCkgOiB2YWwpPy5yZXBsYWNlKG5ldyBSZWdFeHAoJ1wiJyArIHRhZyArICcoLT9cXFxcZCspXCInLCBcImdcIiksIFwiJDFcIik7IC8vIHdyaXRlIGJpZ2ludHMgYXMgSlNPTiBudW1iZXJzXG4gIH1cblxuICBwcm90ZWN0ZWQgc3RhdGljIHBhcnNlQmlnSW50SnNvbihib2R5OiBzdHJpbmcpOiBhbnkge1xuICAgIHJldHVybiBKU09OLnBhcnNlKGJvZHkucmVwbGFjZSgvKFwiW15cIl0qXCJcXHMqOlxccyp8W1xcWyxdXFxzKikoXFxkezE2LH0pKD89XFxzKlssXFxdfV0pL2csICckMVwiJDJcIicpKTsgLy8gcXVvdGUgMTYrIGRpZ2l0IHZhbHVlcyBhbmQgYXJyYXkgZWxlbWVudHMgdG8gcHJlc2VydmUgcHJlY2lzaW9uXG4gIH1cblxuICBwcm90ZWN0ZWQgc3RhdGljIHZhbGlkYXRlSHR0cFJlc3BvbnNlKHJlc3ApIHtcbiAgICBsZXQgY29kZSA9IHJlc3Auc3RhdHVzQ29kZTtcbiAgICBpZiAoY29kZSA8IDIwMCB8fCBjb2RlID4gMjk5KSB7XG4gICAgICBsZXQgY29udGVudCA9IHJlc3AuYm9keTtcbiAgICAgIHRocm93IG5ldyBNb25lcm9ScGNFcnJvcihjb2RlICsgXCIgXCIgKyByZXNwLnN0YXR1c1RleHQgKyAoIWNvbnRlbnQgPyBcIlwiIDogKFwiOiBcIiArIGNvbnRlbnQpKSwgY29kZSwgdW5kZWZpbmVkLCB1bmRlZmluZWQpO1xuICAgIH1cbiAgfVxuICBcbiAgcHJvdGVjdGVkIHZhbGlkYXRlUnBjUmVzcG9uc2UocmVzcCwgbWV0aG9kLCBwYXJhbXMpIHtcbiAgICBpZiAocmVzcC5lcnJvciA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG4gICAgbGV0IGVycm9yTXNnID0gcmVzcC5lcnJvci5tZXNzYWdlO1xuICAgIGlmIChlcnJvck1zZyA9PT0gXCJcIikgZXJyb3JNc2cgPSBcIlJlY2VpdmVkIGVycm9yIHJlc3BvbnNlIGZyb20gUlBDIHJlcXVlc3Qgd2l0aCBtZXRob2QgJ1wiICsgbWV0aG9kICsgXCInIHRvIFwiICsgdGhpcy5nZXRVcmkoKTsgLy8gVE9ETyAobW9uZXJvLXByb2plY3QpOiByZXNwb25zZSBzb21ldGltZXMgaGFzIGVtcHR5IGVycm9yIG1lc3NhZ2VcbiAgICB0aHJvdyBuZXcgTW9uZXJvUnBjRXJyb3IocmVzcC5lcnJvci5tZXNzYWdlLCByZXNwLmVycm9yLmNv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