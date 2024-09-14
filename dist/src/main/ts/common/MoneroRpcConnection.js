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
    return this.getUri() + " (username=" + this.getUsername() + ", password=" + (this.getPassword() ? "***" : this.getPassword()) + ", priority=" + this.getPriority() + ", timeoutMs=" + this.getTimeout() + ", isOnline=" + this.getIsOnline() + ", isAuthenticated=" + this.getIsAuthenticated() + ")";
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfR2VuVXRpbHMiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9IdHRwQ2xpZW50IiwiX0xpYnJhcnlVdGlscyIsIl9Nb25lcm9FcnJvciIsIl9Nb25lcm9ScGNFcnJvciIsIl9Nb25lcm9VdGlscyIsIl9UaHJlYWRQb29sIiwiTW9uZXJvUnBjQ29ubmVjdGlvbiIsIkRFRkFVTFRfQ09ORklHIiwidXJpIiwidW5kZWZpbmVkIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsInJlamVjdFVuYXV0aG9yaXplZCIsInByb3h5VG9Xb3JrZXIiLCJwcmlvcml0eSIsInRpbWVvdXRNcyIsImNvbnN0cnVjdG9yIiwidXJpT3JDb25uZWN0aW9uIiwiT2JqZWN0IiwiYXNzaWduIiwic2V0Q3JlZGVudGlhbHMiLCJNb25lcm9FcnJvciIsIkdlblV0aWxzIiwibm9ybWFsaXplVXJpIiwiY2hlY2tDb25uZWN0aW9uTXV0ZXgiLCJUaHJlYWRQb29sIiwic2VuZFJlcXVlc3RNdXRleCIsImlzT25saW5lIiwiaXNBdXRoZW50aWNhdGVkIiwiZ2V0VXJpIiwiZ2V0VXNlcm5hbWUiLCJnZXRQYXNzd29yZCIsImdldFJlamVjdFVuYXV0aG9yaXplZCIsInNldFByb3h5VG9Xb3JrZXIiLCJnZXRQcm94eVRvV29ya2VyIiwic2V0UHJpb3JpdHkiLCJnZXRQcmlvcml0eSIsInNldFRpbWVvdXQiLCJnZXRUaW1lb3V0Iiwic2V0QXR0cmlidXRlIiwia2V5IiwidmFsdWUiLCJhdHRyaWJ1dGVzIiwiTWFwIiwicHV0IiwiZ2V0QXR0cmlidXRlIiwiZ2V0IiwiY2hlY2tDb25uZWN0aW9uIiwicXVldWVDaGVja0Nvbm5lY3Rpb24iLCJMaWJyYXJ5VXRpbHMiLCJsb2FkV2FzbU1vZHVsZSIsImlzT25saW5lQmVmb3JlIiwiaXNBdXRoZW50aWNhdGVkQmVmb3JlIiwic3RhcnRUaW1lIiwiRGF0ZSIsIm5vdyIsImZha2VEaXNjb25uZWN0ZWQiLCJFcnJvciIsImhlaWdodHMiLCJpIiwicHVzaCIsInNlbmRCaW5hcnlSZXF1ZXN0IiwiZXJyIiwicmVzcG9uc2VUaW1lIiwiTW9uZXJvUnBjRXJyb3IiLCJnZXRDb2RlIiwiaXNDb25uZWN0ZWQiLCJnZXRJc09ubGluZSIsImdldElzQXV0aGVudGljYXRlZCIsImdldFJlc3BvbnNlVGltZSIsInNlbmRKc29uUmVxdWVzdCIsIm1ldGhvZCIsInBhcmFtcyIsInF1ZXVlU2VuZFJlcXVlc3QiLCJib2R5IiwiSlNPTiIsInN0cmluZ2lmeSIsImlkIiwianNvbnJwYyIsImdldExvZ0xldmVsIiwibG9nIiwiZ2V0VGltZSIsInJlc3AiLCJIdHRwQ2xpZW50IiwicmVxdWVzdCIsInRpbWVvdXQiLCJ2YWxpZGF0ZUh0dHBSZXNwb25zZSIsInBhcnNlIiwicmVwbGFjZSIsInJlc3BTdHIiLCJzdWJzdHJpbmciLCJNYXRoIiwibWluIiwibGVuZ3RoIiwidmFsaWRhdGVScGNSZXNwb25zZSIsInN0YXR1c0NvZGUiLCJzZW5kUGF0aFJlcXVlc3QiLCJwYXRoIiwicGFyYW1zQmluIiwiTW9uZXJvVXRpbHMiLCJqc29uVG9CaW5hcnkiLCJVaW50OEFycmF5IiwiY29uc29sZSIsImVycm9yIiwibWVzc2FnZSIsImNvZGUiLCJnZXRDb25maWciLCJ0b0pzb24iLCJqc29uIiwidG9TdHJpbmciLCJzZXRGYWtlRGlzY29ubmVjdGVkIiwiYXN5bmNGbiIsInN1Ym1pdCIsImNvbnRlbnQiLCJzdGF0dXNUZXh0IiwiZXJyb3JNc2ciLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL2NvbW1vbi9Nb25lcm9ScGNDb25uZWN0aW9uLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBHZW5VdGlscyBmcm9tIFwiLi9HZW5VdGlsc1wiO1xuaW1wb3J0IEh0dHBDbGllbnQgZnJvbSBcIi4vSHR0cENsaWVudFwiO1xuaW1wb3J0IExpYnJhcnlVdGlscyBmcm9tIFwiLi9MaWJyYXJ5VXRpbHNcIjtcbmltcG9ydCBNb25lcm9FcnJvciBmcm9tIFwiLi9Nb25lcm9FcnJvclwiO1xuaW1wb3J0IE1vbmVyb1JwY0Vycm9yIGZyb20gXCIuL01vbmVyb1JwY0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvVXRpbHMgZnJvbSBcIi4vTW9uZXJvVXRpbHNcIjtcbmltcG9ydCBUaHJlYWRQb29sIGZyb20gXCIuL1RocmVhZFBvb2xcIjtcblxuLyoqXG4gKiBNYWludGFpbnMgYSBjb25uZWN0aW9uIGFuZCBzZW5kcyByZXF1ZXN0cyB0byBhIE1vbmVybyBSUEMgQVBJLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNb25lcm9ScGNDb25uZWN0aW9uIHtcblxuICAvLyBwdWJsaWMgaW5zdGFuY2UgdmFyaWFibGVzXG4gIHVyaTogc3RyaW5nO1xuICB1c2VybmFtZTogc3RyaW5nO1xuICBwYXNzd29yZDogc3RyaW5nO1xuICByZWplY3RVbmF1dGhvcml6ZWQ6IGJvb2xlYW47XG4gIHByb3h5VG9Xb3JrZXI6IGJvb2xlYW47XG4gIHByaW9yaXR5OiBudW1iZXI7XG4gIHRpbWVvdXRNczogbnVtYmVyO1xuXG4gIC8vIHByaXZhdGUgaW5zdGFuY2UgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBpc09ubGluZTogYm9vbGVhbjtcbiAgcHJvdGVjdGVkIGlzQXV0aGVudGljYXRlZDogYm9vbGVhbjtcbiAgcHJvdGVjdGVkIGF0dHJpYnV0ZXM6IGFueTtcbiAgcHJvdGVjdGVkIGZha2VEaXNjb25uZWN0ZWQ6IGJvb2xlYW47XG4gIHByb3RlY3RlZCByZXNwb25zZVRpbWU6IG51bWJlcjtcbiAgcHJvdGVjdGVkIGNoZWNrQ29ubmVjdGlvbk11dGV4OiBUaHJlYWRQb29sO1xuICBwcm90ZWN0ZWQgc2VuZFJlcXVlc3RNdXRleDogVGhyZWFkUG9vbDtcblxuICAvLyBkZWZhdWx0IGNvbmZpZ1xuICAvKiogQHByaXZhdGUgKi9cbiAgc3RhdGljIERFRkFVTFRfQ09ORklHOiBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+ID0ge1xuICAgIHVyaTogdW5kZWZpbmVkLFxuICAgIHVzZXJuYW1lOiB1bmRlZmluZWQsXG4gICAgcGFzc3dvcmQ6IHVuZGVmaW5lZCxcbiAgICByZWplY3RVbmF1dGhvcml6ZWQ6IHRydWUsIC8vIHJlamVjdCBzZWxmLXNpZ25lZCBjZXJ0aWZpY2F0ZXMgaWYgdHJ1ZVxuICAgIHByb3h5VG9Xb3JrZXI6IGZhbHNlLFxuICAgIHByaW9yaXR5OiAwLFxuICAgIHRpbWVvdXRNczogdW5kZWZpbmVkXG4gIH1cblxuICAvKipcbiAgICogPHA+Q29uc3RydWN0IGEgUlBDIGNvbm5lY3Rpb24uPC9wPlxuICAgKiBcbiAgICogPHA+RXhhbXBsZXM6PC9wPlxuICAgKiBcbiAgICogPGNvZGU+XG4gICAqIGxldCBjb25uZWN0aW9uMSA9IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKFwiaHR0cDovL2xvY2FsaG9zdDozODA4MVwiLCBcImRhZW1vbl91c2VyXCIsIFwiZGFlbW9uX3Bhc3N3b3JkXzEyM1wiKTxicj48YnI+XG4gICAqIFxuICAgKiBsZXQgY29ubmVjdGlvbjIgPSBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih7PGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgdXJpOiBodHRwOi8vbG9jYWxob3N0OjM4MDgxLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHVzZXJuYW1lOiBcImRhZW1vbl91c2VyXCIsPGJyPlxuICAgKiAmbmJzcDsmbmJzcDsgcGFzc3dvcmQ6IFwiZGFlbW9uX3Bhc3N3b3JkXzEyM1wiLDxicj5cbiAgICogJm5ic3A7Jm5ic3A7IHJlamVjdFVuYXV0aG9yaXplZDogZmFsc2UsIC8vIGFjY2VwdCBzZWxmLXNpZ25lZCBjZXJ0aWZpY2F0ZXMgZS5nLiBmb3IgbG9jYWwgZGV2ZWxvcG1lbnQ8YnI+XG4gICAqICZuYnNwOyZuYnNwOyBwcm94eVRvV29ya2VyOiB0cnVlIC8vIHByb3h5IHJlcXVlc3QgdG8gd29ya2VyIChkZWZhdWx0IGZhbHNlKTxicj5cbiAgICogfSk7XG4gICAqIDwvY29kZT5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj59IHVyaU9yQ29ubmVjdGlvbiAtIE1vbmVyb1JwY0Nvbm5lY3Rpb24gb3IgVVJJIG9mIHRoZSBSUEMgZW5kcG9pbnRcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVyaU9yQ29ubmVjdGlvbi51cmkgLSBVUkkgb2YgdGhlIFJQQyBlbmRwb2ludFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3VyaU9yQ29ubmVjdGlvbi51c2VybmFtZV0gLSB1c2VybmFtZSB0byBhdXRoZW50aWNhdGUgd2l0aCB0aGUgUlBDIGVuZHBvaW50IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFt1cmlPckNvbm5lY3Rpb24ucGFzc3dvcmRdIC0gcGFzc3dvcmQgdG8gYXV0aGVudGljYXRlIHdpdGggdGhlIFJQQyBlbmRwb2ludCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3VyaU9yQ29ubmVjdGlvbi5yZWplY3RVbmF1dGhvcml6ZWRdIC0gcmVqZWN0cyBzZWxmLXNpZ25lZCBjZXJ0aWZpY2F0ZXMgaWYgdHJ1ZSAoZGVmYXVsdCB0cnVlKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHVyaU9yQ29ubmVjdGlvbi5wcm94eVRvV29ya2VyIC0gcHJveHkgcmVxdWVzdHMgdG8gd29ya2VyIChkZWZhdWx0IHRydWUpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1c2VybmFtZSAtIHVzZXJuYW1lIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIHRoZSBSUEMgZW5kcG9pbnQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGFzc3dvcmQgLSBwYXNzd29yZCB0byBhdXRoZW50aWNhdGUgd2l0aCB0aGUgUlBDIGVuZHBvaW50IChvcHRpb25hbClcbiAgICovXG4gIGNvbnN0cnVjdG9yKHVyaU9yQ29ubmVjdGlvbjogc3RyaW5nIHwgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPiwgdXNlcm5hbWU/OiBzdHJpbmcsIHBhc3N3b3JkPzogc3RyaW5nKSB7XG5cbiAgICAvLyB2YWxpZGF0ZSBhbmQgbm9ybWFsaXplIGNvbmZpZ1xuICAgIGlmICh0eXBlb2YgdXJpT3JDb25uZWN0aW9uID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBPYmplY3QuYXNzaWduKHRoaXMsIE1vbmVyb1JwY0Nvbm5lY3Rpb24uREVGQVVMVF9DT05GSUcpO1xuICAgICAgdGhpcy51cmkgPSB1cmlPckNvbm5lY3Rpb247XG4gICAgICB0aGlzLnNldENyZWRlbnRpYWxzKHVzZXJuYW1lLCBwYXNzd29yZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh1c2VybmFtZSAhPT0gdW5kZWZpbmVkIHx8IHBhc3N3b3JkICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbiBwcm92aWRlIGNvbmZpZyBvYmplY3Qgb3IgcGFyYW1zIGJ1dCBub3QgYm90aFwiKTtcbiAgICAgIE9iamVjdC5hc3NpZ24odGhpcywgTW9uZXJvUnBjQ29ubmVjdGlvbi5ERUZBVUxUX0NPTkZJRywgdXJpT3JDb25uZWN0aW9uKTtcbiAgICAgIHRoaXMuc2V0Q3JlZGVudGlhbHModGhpcy51c2VybmFtZSwgdGhpcy5wYXNzd29yZCk7XG4gICAgfVxuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSB1cmlcbiAgICBpZiAodGhpcy51cmkpIHRoaXMudXJpID0gR2VuVXRpbHMubm9ybWFsaXplVXJpKHRoaXMudXJpKTtcblxuICAgIC8vIGluaXRpYWxpemUgbXV0ZXhlc1xuICAgIHRoaXMuY2hlY2tDb25uZWN0aW9uTXV0ZXggPSBuZXcgVGhyZWFkUG9vbCgxKTtcbiAgICB0aGlzLnNlbmRSZXF1ZXN0TXV0ZXggPSBuZXcgVGhyZWFkUG9vbCgxKTtcbiAgfVxuICBcbiAgc2V0Q3JlZGVudGlhbHModXNlcm5hbWUsIHBhc3N3b3JkKSB7XG4gICAgaWYgKHVzZXJuYW1lID09PSBcIlwiKSB1c2VybmFtZSA9IHVuZGVmaW5lZDtcbiAgICBpZiAocGFzc3dvcmQgPT09IFwiXCIpIHBhc3N3b3JkID0gdW5kZWZpbmVkO1xuICAgIGlmICh1c2VybmFtZSB8fCBwYXNzd29yZCkge1xuICAgICAgaWYgKCF1c2VybmFtZSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwidXNlcm5hbWUgbXVzdCBiZSBkZWZpbmVkIGJlY2F1c2UgcGFzc3dvcmQgaXMgZGVmaW5lZFwiKTtcbiAgICAgIGlmICghcGFzc3dvcmQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcInBhc3N3b3JkIG11c3QgYmUgZGVmaW5lZCBiZWNhdXNlIHVzZXJuYW1lIGlzIGRlZmluZWRcIik7XG4gICAgfVxuICAgIGlmICh0aGlzLnVzZXJuYW1lID09PSBcIlwiKSB0aGlzLnVzZXJuYW1lID0gdW5kZWZpbmVkO1xuICAgIGlmICh0aGlzLnBhc3N3b3JkID09PSBcIlwiKSB0aGlzLnBhc3N3b3JkID0gdW5kZWZpbmVkO1xuICAgIGlmICh0aGlzLnVzZXJuYW1lICE9PSB1c2VybmFtZSB8fCB0aGlzLnBhc3N3b3JkICE9PSBwYXNzd29yZCkge1xuICAgICAgdGhpcy5pc09ubGluZSA9IHVuZGVmaW5lZDtcbiAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICB0aGlzLnVzZXJuYW1lID0gdXNlcm5hbWU7XG4gICAgdGhpcy5wYXNzd29yZCA9IHBhc3N3b3JkO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBnZXRVcmkoKSB7XG4gICAgcmV0dXJuIHRoaXMudXJpO1xuICB9XG4gIFxuICBnZXRVc2VybmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy51c2VybmFtZSA/IHRoaXMudXNlcm5hbWUgOiBcIlwiO1xuICB9XG4gIFxuICBnZXRQYXNzd29yZCgpIHtcbiAgICByZXR1cm4gdGhpcy5wYXNzd29yZCA/IHRoaXMucGFzc3dvcmQgOiBcIlwiO1xuICB9XG4gIFxuICBnZXRSZWplY3RVbmF1dGhvcml6ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMucmVqZWN0VW5hdXRob3JpemVkO1xuICB9XG4gIFxuICBzZXRQcm94eVRvV29ya2VyKHByb3h5VG9Xb3JrZXIpIHtcbiAgICB0aGlzLnByb3h5VG9Xb3JrZXIgPSBwcm94eVRvV29ya2VyO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBnZXRQcm94eVRvV29ya2VyKCkge1xuICAgIHJldHVybiB0aGlzLnByb3h5VG9Xb3JrZXI7XG4gIH1cbiAgXG4gIFxuICAvKipcbiAgICogU2V0IHRoZSBjb25uZWN0aW9uJ3MgcHJpb3JpdHkgcmVsYXRpdmUgdG8gb3RoZXIgY29ubmVjdGlvbnMuIFByaW9yaXR5IDEgaXMgaGlnaGVzdCxcbiAgICogdGhlbiBwcmlvcml0eSAyLCBldGMuIFRoZSBkZWZhdWx0IHByaW9yaXR5IG9mIDAgaXMgbG93ZXN0IHByaW9yaXR5LlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtwcmlvcml0eV0gLSB0aGUgY29ubmVjdGlvbiBwcmlvcml0eSAoZGVmYXVsdCAwKVxuICAgKiBAcmV0dXJuIHtNb25lcm9ScGNDb25uZWN0aW9ufSB0aGlzIGNvbm5lY3Rpb25cbiAgICovXG4gIHNldFByaW9yaXR5KHByaW9yaXR5KSB7XG4gICAgaWYgKCEocHJpb3JpdHkgPj0gMCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlByaW9yaXR5IG11c3QgYmUgPj0gMFwiKTtcbiAgICB0aGlzLnByaW9yaXR5ID0gcHJpb3JpdHk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXRQcmlvcml0eSgpIHtcbiAgICByZXR1cm4gdGhpcy5wcmlvcml0eTsgXG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSBSUEMgcmVxdWVzdCB0aW1lb3V0IGluIG1pbGxpc2Vjb25kcy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB0aW1lb3V0TXMgaXMgdGhlIHRpbWVvdXQgaW4gbWlsbGlzZWNvbmRzLCAwIHRvIGRpc2FibGUgdGltZW91dCwgb3IgdW5kZWZpbmVkIHRvIHVzZSBkZWZhdWx0XG4gICAqIEByZXR1cm4ge01vbmVyb1JwY0Nvbm5lY3Rpb259IHRoaXMgY29ubmVjdGlvblxuICAgKi9cbiAgc2V0VGltZW91dCh0aW1lb3V0TXM6IG51bWJlcikge1xuICAgIHRoaXMudGltZW91dE1zID0gdGltZW91dE1zO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZ2V0VGltZW91dCgpIHtcbiAgICByZXR1cm4gdGhpcy50aW1lb3V0TXM7XG4gIH1cbiAgXG4gIHNldEF0dHJpYnV0ZShrZXksIHZhbHVlKSB7XG4gICAgaWYgKCF0aGlzLmF0dHJpYnV0ZXMpIHRoaXMuYXR0cmlidXRlcyA9IG5ldyBNYXAoKTtcbiAgICB0aGlzLmF0dHJpYnV0ZXMucHV0KGtleSwgdmFsdWUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBnZXRBdHRyaWJ1dGUoa2V5KSB7XG4gICAgcmV0dXJuIHRoaXMuYXR0cmlidXRlcy5nZXQoa2V5KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENoZWNrIHRoZSBjb25uZWN0aW9uIHN0YXR1cyB0byB1cGRhdGUgaXNPbmxpbmUsIGlzQXV0aGVudGljYXRlZCwgYW5kIHJlc3BvbnNlIHRpbWUuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gdGltZW91dE1zIC0gbWF4aW11bSByZXNwb25zZSB0aW1lIGJlZm9yZSBjb25zaWRlcmVkIG9mZmxpbmVcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiB0aGVyZSBpcyBhIGNoYW5nZSBpbiBzdGF0dXMsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgYXN5bmMgY2hlY2tDb25uZWN0aW9uKHRpbWVvdXRNcyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHJldHVybiB0aGlzLnF1ZXVlQ2hlY2tDb25uZWN0aW9uKGFzeW5jICgpID0+IHtcbiAgICAgIGF3YWl0IExpYnJhcnlVdGlscy5sb2FkV2FzbU1vZHVsZSgpOyAvLyBjYWNoZSB3YXNtIGZvciBiaW5hcnkgcmVxdWVzdFxuICAgICAgbGV0IGlzT25saW5lQmVmb3JlID0gdGhpcy5pc09ubGluZTtcbiAgICAgIGxldCBpc0F1dGhlbnRpY2F0ZWRCZWZvcmUgPSB0aGlzLmlzQXV0aGVudGljYXRlZDtcbiAgICAgIGxldCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgaWYgKHRoaXMuZmFrZURpc2Nvbm5lY3RlZCkgdGhyb3cgbmV3IEVycm9yKFwiQ29ubmVjdGlvbiBpcyBmYWtlIGRpc2Nvbm5lY3RlZFwiKTtcbiAgICAgICAgbGV0IGhlaWdodHMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxMDA7IGkrKykgaGVpZ2h0cy5wdXNoKGkpO1xuICAgICAgICBhd2FpdCB0aGlzLnNlbmRCaW5hcnlSZXF1ZXN0KFwiZ2V0X2Jsb2Nrc19ieV9oZWlnaHQuYmluXCIsIHtoZWlnaHRzOiBoZWlnaHRzfSwgdGltZW91dE1zKTsgLy8gYXNzdW1lIGRhZW1vbiBjb25uZWN0aW9uXG4gICAgICAgIHRoaXMuaXNPbmxpbmUgPSB0cnVlO1xuICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IHRydWU7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgdGhpcy5pc09ubGluZSA9IGZhbHNlO1xuICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5yZXNwb25zZVRpbWUgPSB1bmRlZmluZWQ7XG4gICAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvcikge1xuICAgICAgICAgIGlmIChlcnIuZ2V0Q29kZSgpID09PSA0MDEpIHtcbiAgICAgICAgICAgIHRoaXMuaXNPbmxpbmUgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGVyci5nZXRDb2RlKCkgPT09IDQwNCkgeyAvLyBmYWxsYmFjayB0byBsYXRlbmN5IGNoZWNrXG4gICAgICAgICAgICB0aGlzLmlzT25saW5lID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLmlzT25saW5lKSB0aGlzLnJlc3BvbnNlVGltZSA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG4gICAgICByZXR1cm4gaXNPbmxpbmVCZWZvcmUgIT09IHRoaXMuaXNPbmxpbmUgfHwgaXNBdXRoZW50aWNhdGVkQmVmb3JlICE9PSB0aGlzLmlzQXV0aGVudGljYXRlZDtcbiAgICB9KTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgY29ubmVjdGlvbiBpcyBjb25uZWN0ZWQgYWNjb3JkaW5nIHRvIHRoZSBsYXN0IGNhbGwgdG8gY2hlY2tDb25uZWN0aW9uKCkuPGJyPjxicj5cbiAgICogXG4gICAqIE5vdGU6IG11c3QgY2FsbCBjaGVja0Nvbm5lY3Rpb24oKSBtYW51YWxseSB1bmxlc3MgdXNpbmcgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIG9yIGZhbHNlIHRvIGluZGljYXRlIGlmIGNvbm5lY3RlZCwgb3IgdW5kZWZpbmVkIGlmIGNoZWNrQ29ubmVjdGlvbigpIGhhcyBub3QgYmVlbiBjYWxsZWRcbiAgICovXG4gIGlzQ29ubmVjdGVkKCkge1xuICAgIHJldHVybiB0aGlzLmlzT25saW5lID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB0aGlzLmlzT25saW5lICYmIHRoaXMuaXNBdXRoZW50aWNhdGVkICE9PSBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGNvbm5lY3Rpb24gaXMgb25saW5lIGFjY29yZGluZyB0byB0aGUgbGFzdCBjYWxsIHRvIGNoZWNrQ29ubmVjdGlvbigpLjxicj48YnI+XG4gICAqIFxuICAgKiBOb3RlOiBtdXN0IGNhbGwgY2hlY2tDb25uZWN0aW9uKCkgbWFudWFsbHkgdW5sZXNzIHVzaW5nIE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyLlxuICAgKiBcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBvciBmYWxzZSB0byBpbmRpY2F0ZSBpZiBvbmxpbmUsIG9yIHVuZGVmaW5lZCBpZiBjaGVja0Nvbm5lY3Rpb24oKSBoYXMgbm90IGJlZW4gY2FsbGVkXG4gICAqL1xuICBnZXRJc09ubGluZSgpIHtcbiAgICByZXR1cm4gdGhpcy5pc09ubGluZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIGNvbm5lY3Rpb24gaXMgYXV0aGVudGljYXRlZCBhY2NvcmRpbmcgdG8gdGhlIGxhc3QgY2FsbCB0byBjaGVja0Nvbm5lY3Rpb24oKS48YnI+PGJyPlxuICAgKiBcbiAgICogTm90ZTogbXVzdCBjYWxsIGNoZWNrQ29ubmVjdGlvbigpIG1hbnVhbGx5IHVubGVzcyB1c2luZyBNb25lcm9Db25uZWN0aW9uTWFuYWdlci5cbiAgICogXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgYXV0aGVudGljYXRlZCBvciBubyBhdXRoZW50aWNhdGlvbiwgZmFsc2UgaWYgbm90IGF1dGhlbnRpY2F0ZWQsIG9yIHVuZGVmaW5lZCBpZiBjaGVja0Nvbm5lY3Rpb24oKSBoYXMgbm90IGJlZW4gY2FsbGVkXG4gICAqL1xuICBnZXRJc0F1dGhlbnRpY2F0ZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuaXNBdXRoZW50aWNhdGVkO1xuICB9XG5cbiAgZ2V0UmVzcG9uc2VUaW1lKCkge1xuICAgIHJldHVybiB0aGlzLnJlc3BvbnNlVGltZTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNlbmQgYSBKU09OIFJQQyByZXF1ZXN0LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1ldGhvZCAtIEpTT04gUlBDIG1ldGhvZCB0byBpbnZva2VcbiAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcyAtIHJlcXVlc3QgcGFyYW1ldGVyc1xuICAgKiBAcGFyYW0ge251bWJlcn0gW3RpbWVvdXRNc10gLSBvdmVycmlkZXMgdGhlIHJlcXVlc3QgdGltZW91dCBpbiBtaWxsaXNlY29uZHNcbiAgICogQHJldHVybiB7b2JqZWN0fSBpcyB0aGUgcmVzcG9uc2UgbWFwXG4gICAqL1xuICBhc3luYyBzZW5kSnNvblJlcXVlc3QobWV0aG9kLCBwYXJhbXM/LCB0aW1lb3V0TXM/KTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gdGhpcy5xdWV1ZVNlbmRSZXF1ZXN0KGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICBcbiAgICAgICAgLy8gYnVpbGQgcmVxdWVzdCBib2R5XG4gICAgICAgIGxldCBib2R5ID0gSlNPTi5zdHJpbmdpZnkoeyAgLy8gYm9keSBpcyBzdHJpbmdpZmllZCBzbyB0ZXh0L3BsYWluIGlzIHJldHVybmVkIHNvIGJpZ2ludHMgYXJlIHByZXNlcnZlZFxuICAgICAgICAgIGlkOiBcIjBcIixcbiAgICAgICAgICBqc29ucnBjOiBcIjIuMFwiLFxuICAgICAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgICAgIHBhcmFtczogcGFyYW1zXG4gICAgICAgIH0pO1xuICBcbiAgICAgICAgLy8gbG9nZ2luZ1xuICAgICAgICBpZiAoTGlicmFyeVV0aWxzLmdldExvZ0xldmVsKCkgPj0gMikgTGlicmFyeVV0aWxzLmxvZygyLCBcIlNlbmRpbmcganNvbiByZXF1ZXN0IHdpdGggbWV0aG9kICdcIiArIG1ldGhvZCArIFwiJyBhbmQgYm9keTogXCIgKyBib2R5KTtcbiAgICAgICAgXG4gICAgICAgIC8vIHNlbmQgaHR0cCByZXF1ZXN0XG4gICAgICAgIGxldCBzdGFydFRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAgICAgbGV0IHJlc3AgPSBhd2FpdCBIdHRwQ2xpZW50LnJlcXVlc3Qoe1xuICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgICAgdXJpOiB0aGlzLmdldFVyaSgpICsgJy9qc29uX3JwYycsXG4gICAgICAgICAgdXNlcm5hbWU6IHRoaXMuZ2V0VXNlcm5hbWUoKSxcbiAgICAgICAgICBwYXNzd29yZDogdGhpcy5nZXRQYXNzd29yZCgpLFxuICAgICAgICAgIGJvZHk6IGJvZHksXG4gICAgICAgICAgdGltZW91dDogdGltZW91dE1zID09PSB1bmRlZmluZWQgPyB0aGlzLnRpbWVvdXRNcyA6IHRpbWVvdXRNcyxcbiAgICAgICAgICByZWplY3RVbmF1dGhvcml6ZWQ6IHRoaXMucmVqZWN0VW5hdXRob3JpemVkLFxuICAgICAgICAgIHByb3h5VG9Xb3JrZXI6IHRoaXMucHJveHlUb1dvcmtlclxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIHZhbGlkYXRlIHJlc3BvbnNlXG4gICAgICAgIE1vbmVyb1JwY0Nvbm5lY3Rpb24udmFsaWRhdGVIdHRwUmVzcG9uc2UocmVzcCk7XG4gICAgICAgIFxuICAgICAgICAvLyBkZXNlcmlhbGl6ZSByZXNwb25zZVxuICAgICAgICBpZiAocmVzcC5ib2R5WzBdICE9ICd7JykgdGhyb3cgcmVzcC5ib2R5O1xuICAgICAgICByZXNwID0gSlNPTi5wYXJzZShyZXNwLmJvZHkucmVwbGFjZSgvKFwiW15cIl0qXCJcXHMqOlxccyopKFxcZHsxNix9KS9nLCAnJDFcIiQyXCInKSk7ICAvLyByZXBsYWNlIDE2IG9yIG1vcmUgZGlnaXRzIHdpdGggc3RyaW5ncyBhbmQgcGFyc2VcbiAgICAgICAgaWYgKExpYnJhcnlVdGlscy5nZXRMb2dMZXZlbCgpID49IDMpIHtcbiAgICAgICAgICBsZXQgcmVzcFN0ciA9IEpTT04uc3RyaW5naWZ5KHJlc3ApO1xuICAgICAgICAgIExpYnJhcnlVdGlscy5sb2coMywgXCJSZWNlaXZlZCByZXNwb25zZSBmcm9tIG1ldGhvZD0nXCIgKyBtZXRob2QgKyBcIicsIHJlc3BvbnNlPVwiICsgcmVzcFN0ci5zdWJzdHJpbmcoMCwgTWF0aC5taW4oMTAwMCwgcmVzcFN0ci5sZW5ndGgpKSArIFwiKFwiICsgKG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gc3RhcnRUaW1lKSArIFwiIG1zKVwiKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gY2hlY2sgcnBjIHJlc3BvbnNlIGZvciBlcnJvcnNcbiAgICAgICAgdGhpcy52YWxpZGF0ZVJwY1Jlc3BvbnNlKHJlc3AsIG1ldGhvZCwgcGFyYW1zKTtcbiAgICAgICAgcmV0dXJuIHJlc3A7XG4gICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICBpZiAoZXJyIGluc3RhbmNlb2YgTW9uZXJvUnBjRXJyb3IpIHRocm93IGVycjtcbiAgICAgICAgZWxzZSB0aHJvdyBuZXcgTW9uZXJvUnBjRXJyb3IoZXJyLCBlcnIuc3RhdHVzQ29kZSwgbWV0aG9kLCBwYXJhbXMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIFxuICAvKipcbiAgICogU2VuZCBhIFJQQyByZXF1ZXN0IHRvIHRoZSBnaXZlbiBwYXRoIGFuZCB3aXRoIHRoZSBnaXZlbiBwYXJhbXRlcnMuXG4gICAqIFxuICAgKiBFLmcuIFwiL2dldF90cmFuc2FjdGlvbnNcIiB3aXRoIHBhcmFtc1xuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggLSBKU09OIFJQQyBwYXRoIHRvIGludm9rZVxuICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zIC0gcmVxdWVzdCBwYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbdGltZW91dE1zXSAtIG92ZXJyaWRlcyB0aGUgcmVxdWVzdCB0aW1lb3V0IGluIG1pbGxpc2Vjb25kc1xuICAgKiBAcmV0dXJuIHtvYmplY3R9IGlzIHRoZSByZXNwb25zZSBtYXBcbiAgICovXG4gIGFzeW5jIHNlbmRQYXRoUmVxdWVzdChwYXRoLCBwYXJhbXM/LCB0aW1lb3V0TXM/KTogUHJvbWlzZTxhbnk+IHtcbiAgICByZXR1cm4gdGhpcy5xdWV1ZVNlbmRSZXF1ZXN0KGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7XG5cbiAgICAgICAgLy8gbG9nZ2luZ1xuICAgICAgICBpZiAoTGlicmFyeVV0aWxzLmdldExvZ0xldmVsKCkgPj0gMikgTGlicmFyeVV0aWxzLmxvZygyLCBcIlNlbmRpbmcgcGF0aCByZXF1ZXN0IHdpdGggcGF0aCAnXCIgKyBwYXRoICsgXCInIGFuZCBwYXJhbXM6IFwiICsgSlNPTi5zdHJpbmdpZnkocGFyYW1zKSk7XG4gICAgICAgIFxuICAgICAgICAvLyBzZW5kIGh0dHAgcmVxdWVzdFxuICAgICAgICBsZXQgc3RhcnRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgICAgIGxldCByZXNwID0gYXdhaXQgSHR0cENsaWVudC5yZXF1ZXN0KHtcbiAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgIHVyaTogdGhpcy5nZXRVcmkoKSArICcvJyArIHBhdGgsXG4gICAgICAgICAgdXNlcm5hbWU6IHRoaXMuZ2V0VXNlcm5hbWUoKSxcbiAgICAgICAgICBwYXNzd29yZDogdGhpcy5nZXRQYXNzd29yZCgpLFxuICAgICAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHBhcmFtcyksICAvLyBib2R5IGlzIHN0cmluZ2lmaWVkIHNvIHRleHQvcGxhaW4gaXMgcmV0dXJuZWQgc28gYmlnaW50cyBhcmUgcHJlc2VydmVkXG4gICAgICAgICAgdGltZW91dDogdGltZW91dE1zID09PSB1bmRlZmluZWQgPyB0aGlzLnRpbWVvdXRNcyA6IHRpbWVvdXRNcyxcbiAgICAgICAgICByZWplY3RVbmF1dGhvcml6ZWQ6IHRoaXMucmVqZWN0VW5hdXRob3JpemVkLFxuICAgICAgICAgIHByb3h5VG9Xb3JrZXI6IHRoaXMucHJveHlUb1dvcmtlclxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIC8vIHZhbGlkYXRlIHJlc3BvbnNlXG4gICAgICAgIE1vbmVyb1JwY0Nvbm5lY3Rpb24udmFsaWRhdGVIdHRwUmVzcG9uc2UocmVzcCk7XG4gICAgICAgIFxuICAgICAgICAvLyBkZXNlcmlhbGl6ZSByZXNwb25zZVxuICAgICAgICBpZiAocmVzcC5ib2R5WzBdICE9ICd7JykgdGhyb3cgcmVzcC5ib2R5O1xuICAgICAgICByZXNwID0gSlNPTi5wYXJzZShyZXNwLmJvZHkucmVwbGFjZSgvKFwiW15cIl0qXCJcXHMqOlxccyopKFxcZHsxNix9KS9nLCAnJDFcIiQyXCInKSk7ICAvLyByZXBsYWNlIDE2IG9yIG1vcmUgZGlnaXRzIHdpdGggc3RyaW5ncyBhbmQgcGFyc2VcbiAgICAgICAgaWYgKHR5cGVvZiByZXNwID09PSBcInN0cmluZ1wiKSByZXNwID0gSlNPTi5wYXJzZShyZXNwKTsgIC8vIFRPRE86IHNvbWUgcmVzcG9uc2VzIHJldHVybmVkIGFzIHN0cmluZ3M/XG4gICAgICAgIGlmIChMaWJyYXJ5VXRpbHMuZ2V0TG9nTGV2ZWwoKSA+PSAzKSB7XG4gICAgICAgICAgbGV0IHJlc3BTdHIgPSBKU09OLnN0cmluZ2lmeShyZXNwKTtcbiAgICAgICAgICBMaWJyYXJ5VXRpbHMubG9nKDMsIFwiUmVjZWl2ZWQgcmVzcG9uc2UgZnJvbSBwYXRoPSdcIiArIHBhdGggKyBcIicsIHJlc3BvbnNlPVwiICsgcmVzcFN0ci5zdWJzdHJpbmcoMCwgTWF0aC5taW4oMTAwMCwgcmVzcFN0ci5sZW5ndGgpKSArIFwiKFwiICsgKG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gc3RhcnRUaW1lKSArIFwiIG1zKVwiKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gY2hlY2sgcnBjIHJlc3BvbnNlIGZvciBlcnJvcnNcbiAgICAgICAgdGhpcy52YWxpZGF0ZVJwY1Jlc3BvbnNlKHJlc3AsIHBhdGgsIHBhcmFtcyk7XG4gICAgICAgIHJldHVybiByZXNwO1xuICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIE1vbmVyb1JwY0Vycm9yKSB0aHJvdyBlcnI7XG4gICAgICAgIGVsc2UgdGhyb3cgbmV3IE1vbmVyb1JwY0Vycm9yKGVyciwgZXJyLnN0YXR1c0NvZGUsIHBhdGgsIHBhcmFtcyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZW5kIGEgYmluYXJ5IFJQQyByZXF1ZXN0LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhdGggLSBwYXRoIG9mIHRoZSBiaW5hcnkgUlBDIG1ldGhvZCB0byBpbnZva2VcbiAgICogQHBhcmFtIHtvYmplY3R9IFtwYXJhbXNdIC0gcmVxdWVzdCBwYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbdGltZW91dE1zXSAtIHJlcXVlc3QgdGltZW91dCBpbiBtaWxsaXNlY29uZHNcbiAgICogQHJldHVybiB7VWludDhBcnJheX0gdGhlIGJpbmFyeSByZXNwb25zZVxuICAgKi9cbiAgYXN5bmMgc2VuZEJpbmFyeVJlcXVlc3QocGF0aCwgcGFyYW1zPywgdGltZW91dE1zPyk6IFByb21pc2U8YW55PiB7XG4gICAgcmV0dXJuIHRoaXMucXVldWVTZW5kUmVxdWVzdChhc3luYyAoKSA9PiB7XG5cbiAgICAgIC8vIHNlcmlhbGl6ZSBwYXJhbXNcbiAgICAgIGxldCBwYXJhbXNCaW4gPSBhd2FpdCBNb25lcm9VdGlscy5qc29uVG9CaW5hcnkocGFyYW1zKTtcbiAgICAgICAgICBcbiAgICAgIHRyeSB7XG5cbiAgICAgICAgLy8gbG9nZ2luZ1xuICAgICAgICBpZiAoTGlicmFyeVV0aWxzLmdldExvZ0xldmVsKCkgPj0gMikgTGlicmFyeVV0aWxzLmxvZygyLCBcIlNlbmRpbmcgYmluYXJ5IHJlcXVlc3Qgd2l0aCBwYXRoICdcIiArIHBhdGggKyBcIicgYW5kIHBhcmFtczogXCIgKyBKU09OLnN0cmluZ2lmeShwYXJhbXMpKTtcbiAgICAgICAgXG4gICAgICAgIC8vIHNlbmQgaHR0cCByZXF1ZXN0XG4gICAgICAgIGxldCByZXNwID0gYXdhaXQgSHR0cENsaWVudC5yZXF1ZXN0KHtcbiAgICAgICAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICAgIHVyaTogdGhpcy5nZXRVcmkoKSArICcvJyArIHBhdGgsXG4gICAgICAgICAgdXNlcm5hbWU6IHRoaXMuZ2V0VXNlcm5hbWUoKSxcbiAgICAgICAgICBwYXNzd29yZDogdGhpcy5nZXRQYXNzd29yZCgpLFxuICAgICAgICAgIGJvZHk6IHBhcmFtc0JpbixcbiAgICAgICAgICB0aW1lb3V0OiB0aW1lb3V0TXMgPT09IHVuZGVmaW5lZCA/IHRoaXMudGltZW91dE1zIDogdGltZW91dE1zLFxuICAgICAgICAgIHJlamVjdFVuYXV0aG9yaXplZDogdGhpcy5yZWplY3RVbmF1dGhvcml6ZWQsXG4gICAgICAgICAgcHJveHlUb1dvcmtlcjogdGhpcy5wcm94eVRvV29ya2VyXG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgLy8gdmFsaWRhdGUgcmVzcG9uc2VcbiAgICAgICAgTW9uZXJvUnBjQ29ubmVjdGlvbi52YWxpZGF0ZUh0dHBSZXNwb25zZShyZXNwKTtcbiAgICAgICAgXG4gICAgICAgIC8vIHByb2Nlc3MgcmVzcG9uc2VcbiAgICAgICAgcmVzcCA9IHJlc3AuYm9keTtcbiAgICAgICAgaWYgKCEocmVzcCBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkpKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihcInJlc3AgaXMgbm90IHVpbnQ4YXJyYXlcIik7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihyZXNwKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocmVzcC5lcnJvcikgdGhyb3cgbmV3IE1vbmVyb1JwY0Vycm9yKHJlc3AuZXJyb3IubWVzc2FnZSwgcmVzcC5lcnJvci5jb2RlLCBwYXRoLCBwYXJhbXMpO1xuICAgICAgICByZXR1cm4gcmVzcDtcbiAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBNb25lcm9ScGNFcnJvcikgdGhyb3cgZXJyO1xuICAgICAgICBlbHNlIHRocm93IG5ldyBNb25lcm9ScGNFcnJvcihlcnIsIGVyci5zdGF0dXNDb2RlLCBwYXRoLCBwYXJhbXMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZ2V0Q29uZmlnKCkge1xuICAgIHJldHVybiB7XG4gICAgICB1cmk6IHRoaXMudXJpLFxuICAgICAgdXNlcm5hbWU6IHRoaXMudXNlcm5hbWUsXG4gICAgICBwYXNzd29yZDogdGhpcy5wYXNzd29yZCxcbiAgICAgIHJlamVjdFVuYXV0aG9yaXplZDogdGhpcy5yZWplY3RVbmF1dGhvcml6ZWQsXG4gICAgICBwcm94eVRvV29ya2VyOiB0aGlzLnByb3h5VG9Xb3JrZXIsXG4gICAgICBwcmlvcml0eTogdGhpcy5wcmlvcml0eSxcbiAgICAgIHRpbWVvdXRNczogdGhpcy50aW1lb3V0TXNcbiAgICB9O1xuICB9XG5cbiAgdG9Kc29uKCkge1xuICAgIGxldCBqc29uID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcylcbiAgICBqc29uLmNoZWNrQ29ubmVjdGlvbk11dGV4ID0gdW5kZWZpbmVkO1xuICAgIGpzb24uc2VuZFJlcXVlc3RNdXRleCA9IHVuZGVmaW5lZDtcbiAgICByZXR1cm4ganNvbjtcbiAgfVxuICBcbiAgdG9TdHJpbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0VXJpKCkgKyBcIiAodXNlcm5hbWU9XCIgKyB0aGlzLmdldFVzZXJuYW1lKCkgKyBcIiwgcGFzc3dvcmQ9XCIgKyAodGhpcy5nZXRQYXNzd29yZCgpID8gXCIqKipcIiA6IHRoaXMuZ2V0UGFzc3dvcmQoKSkgKyBcIiwgcHJpb3JpdHk9XCIgKyB0aGlzLmdldFByaW9yaXR5KCkgKyBcIiwgdGltZW91dE1zPVwiICsgdGhpcy5nZXRUaW1lb3V0KCkgKyBcIiwgaXNPbmxpbmU9XCIgKyB0aGlzLmdldElzT25saW5lKCkgKyBcIiwgaXNBdXRoZW50aWNhdGVkPVwiICsgdGhpcy5nZXRJc0F1dGhlbnRpY2F0ZWQoKSArIFwiKVwiO1xuICB9XG5cbiAgc2V0RmFrZURpc2Nvbm5lY3RlZChmYWtlRGlzY29ubmVjdGVkKSB7IC8vIHVzZWQgdG8gdGVzdCBjb25uZWN0aW9uIG1hbmFnZXJcbiAgICB0aGlzLmZha2VEaXNjb25uZWN0ZWQgPSBmYWtlRGlzY29ubmVjdGVkOyBcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFBSSVZBVEUgSEVMUEVSUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHByb3RlY3RlZCBhc3luYyBxdWV1ZUNoZWNrQ29ubmVjdGlvbjxUPihhc3luY0ZuOiAoKSA9PiBQcm9taXNlPFQ+KTogUHJvbWlzZTxUPiB7XG4gICAgcmV0dXJuIHRoaXMuY2hlY2tDb25uZWN0aW9uTXV0ZXguc3VibWl0KGFzeW5jRm4pO1xuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIHF1ZXVlU2VuZFJlcXVlc3Q8VD4oYXN5bmNGbjogKCkgPT4gUHJvbWlzZTxUPik6IFByb21pc2U8VD4ge1xuICAgIHJldHVybiB0aGlzLnNlbmRSZXF1ZXN0TXV0ZXguc3VibWl0KGFzeW5jRm4pO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIHZhbGlkYXRlSHR0cFJlc3BvbnNlKHJlc3ApIHtcbiAgICBsZXQgY29kZSA9IHJlc3Auc3RhdHVzQ29kZTtcbiAgICBpZiAoY29kZSA8IDIwMCB8fCBjb2RlID4gMjk5KSB7XG4gICAgICBsZXQgY29udGVudCA9IHJlc3AuYm9keTtcbiAgICAgIHRocm93IG5ldyBNb25lcm9ScGNFcnJvcihjb2RlICsgXCIgXCIgKyByZXNwLnN0YXR1c1RleHQgKyAoIWNvbnRlbnQgPyBcIlwiIDogKFwiOiBcIiArIGNvbnRlbnQpKSwgY29kZSwgdW5kZWZpbmVkLCB1bmRlZmluZWQpO1xuICAgIH1cbiAgfVxuICBcbiAgcHJvdGVjdGVkIHZhbGlkYXRlUnBjUmVzcG9uc2UocmVzcCwgbWV0aG9kLCBwYXJhbXMpIHtcbiAgICBpZiAocmVzcC5lcnJvciA9PT0gdW5kZWZpbmVkKSByZXR1cm47XG4gICAgbGV0IGVycm9yTXNnID0gcmVzcC5lcnJvci5tZXNzYWdlO1xuICAgIGlmIChlcnJvck1zZyA9PT0gXCJcIikgZXJyb3JNc2cgPSBcIlJlY2VpdmVkIGVycm9yIHJlc3BvbnNlIGZyb20gUlBDIHJlcXVlc3Qgd2l0aCBtZXRob2QgJ1wiICsgbWV0aG9kICsgXCInIHRvIFwiICsgdGhpcy5nZXRVcmkoKTsgLy8gVE9ETyAobW9uZXJvLXByb2plY3QpOiByZXNwb25zZSBzb21ldGltZXMgaGFzIGVtcHR5IGVycm9yIG1lc3NhZ2VcbiAgICB0aHJvdyBuZXcgTW9uZXJvUnBjRXJyb3IocmVzcC5lcnJvci5tZXNzYWdlLCByZXNwLmVycm9yLmNvZGUsIG1ldGhvZCwgcGFyYW1zKTtcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoieUxBQUEsSUFBQUEsU0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMsV0FBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUUsYUFBQSxHQUFBSCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUcsWUFBQSxHQUFBSixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUksZUFBQSxHQUFBTCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUssWUFBQSxHQUFBTixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQU0sV0FBQSxHQUFBUCxzQkFBQSxDQUFBQyxPQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNlLE1BQU1PLG1CQUFtQixDQUFDOztFQUV2Qzs7Ozs7Ozs7O0VBU0E7Ozs7Ozs7OztFQVNBO0VBQ0E7RUFDQSxPQUFPQyxjQUFjLEdBQWlDO0lBQ3BEQyxHQUFHLEVBQUVDLFNBQVM7SUFDZEMsUUFBUSxFQUFFRCxTQUFTO0lBQ25CRSxRQUFRLEVBQUVGLFNBQVM7SUFDbkJHLGtCQUFrQixFQUFFLElBQUksRUFBRTtJQUMxQkMsYUFBYSxFQUFFLEtBQUs7SUFDcEJDLFFBQVEsRUFBRSxDQUFDO0lBQ1hDLFNBQVMsRUFBRU47RUFDYixDQUFDOztFQUVEO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRU8sV0FBV0EsQ0FBQ0MsZUFBc0Qs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