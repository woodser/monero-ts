import GenUtils from "./GenUtils";
import HttpClient from "./HttpClient";
import LibraryUtils from "./LibraryUtils";
import MoneroError from "./MoneroError";
import MoneroRpcError from "./MoneroRpcError";
import MoneroUtils from "./MoneroUtils";
import ThreadPool from "./ThreadPool";

/**
 * Maintains a connection and sends requests to a Monero RPC API.
 */
export default class MoneroRpcConnection {

  // public instance variables
  uri: string;
  username: string;
  password: string;
  rejectUnauthorized: boolean;
  proxyToWorker: boolean;
  priority: number;
  timeoutMs: number;

  // private instance variables
  protected isOnline: boolean;
  protected isAuthenticated: boolean;
  protected attributes: any;
  protected fakeDisconnected: boolean;
  protected responseTime: number;
  protected checkConnectionMutex: ThreadPool;
  protected sendRequestMutex: ThreadPool;

  // default config
  /** @private */
  static DEFAULT_CONFIG: Partial<MoneroRpcConnection> = {
    uri: undefined,
    username: undefined,
    password: undefined,
    rejectUnauthorized: true, // reject self-signed certificates if true
    proxyToWorker: false,
    priority: 0,
    timeoutMs: undefined
  }

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
  constructor(uriOrConnection: string | Partial<MoneroRpcConnection>, username?: string, password?: string) {

    // validate and normalize config
    if (typeof uriOrConnection === "string") {
      Object.assign(this, MoneroRpcConnection.DEFAULT_CONFIG);
      this.uri = uriOrConnection;
      this.setCredentials(username, password);
    } else {
      if (username !== undefined || password !== undefined) throw new MoneroError("Can provide config object or params but not both");
      Object.assign(this, MoneroRpcConnection.DEFAULT_CONFIG, uriOrConnection);
      this.setCredentials(this.username, this.password);
    }
    
    // normalize uri
    if (this.uri) this.uri = GenUtils.normalizeUri(this.uri);

    // initialize mutexes
    this.checkConnectionMutex = new ThreadPool(1);
    this.sendRequestMutex = new ThreadPool(1);
  }
  
  setCredentials(username, password) {
    if (username === "") username = undefined;
    if (password === "") password = undefined;
    if (username || password) {
      if (!username) throw new MoneroError("username must be defined because password is defined");
      if (!password) throw new MoneroError("password must be defined because username is defined");
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
    if (!(priority >= 0)) throw new MoneroError("Priority must be >= 0");
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
  setTimeout(timeoutMs: number) {
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
  async checkConnection(timeoutMs): Promise<boolean> {
    return this.queueCheckConnection(async () => {
      await LibraryUtils.loadFullModule(); // cache wasm for binary request
      let isOnlineBefore = this.isOnline;
      let isAuthenticatedBefore = this.isAuthenticated;
      let startTime = Date.now();
      try {
        if (this.fakeDisconnected) throw new Error("Connection is fake disconnected");
        let heights = [];
        for (let i = 0; i < 100; i++) heights.push(i);
        await this.sendBinaryRequest("get_blocks_by_height.bin", {heights: heights}, timeoutMs); // assume daemon connection
        this.isOnline = true;
        this.isAuthenticated = true;
      } catch (err) {
        this.isOnline = false;
        this.isAuthenticated = undefined;
        this.responseTime = undefined;
        if (err instanceof MoneroRpcError) {
          if (err.getCode() === 401) {
            this.isOnline = true;
            this.isAuthenticated = false;
          } else if (err.getCode() === 404) { // fallback to latency check
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
  async sendJsonRequest(method, params?, timeoutMs?): Promise<any> {
    return this.queueSendRequest(async () => {
      try {
      
        // build request body
        let body = JSON.stringify({  // body is stringified so text/plain is returned so bigints are preserved
          id: "0",
          jsonrpc: "2.0",
          method: method,
          params: params
        });
  
        // logging
        if (LibraryUtils.getLogLevel() >= 2) LibraryUtils.log(2, "Sending json request with method '" + method + "' and body: " + body);
        
        // send http request
        let startTime = new Date().getTime();
        let resp = await HttpClient.request({
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
        resp = JSON.parse(resp.body.replace(/("[^"]*"\s*:\s*)(\d{16,})/g, '$1"$2"'));  // replace 16 or more digits with strings and parse
        if (LibraryUtils.getLogLevel() >= 3) {
          let respStr = JSON.stringify(resp);
          LibraryUtils.log(3, "Received response from method='" + method + "', response=" + respStr.substring(0, Math.min(1000, respStr.length)) + "(" + (new Date().getTime() - startTime) + " ms)");
        }
        
        // check rpc response for errors
        this.validateRpcResponse(resp, method, params);
        return resp;
      } catch (err: any) {
        if (err instanceof MoneroRpcError) throw err;
        else throw new MoneroRpcError(err, err.statusCode, method, params);
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
  async sendPathRequest(path, params?, timeoutMs?): Promise<any> {
    return this.queueSendRequest(async () => {
      try {

        // logging
        if (LibraryUtils.getLogLevel() >= 2) LibraryUtils.log(2, "Sending path request with path '" + path + "' and params: " + JSON.stringify(params));
        
        // send http request
        let startTime = new Date().getTime();
        let resp = await HttpClient.request({
          method: "POST",
          uri: this.getUri() + '/' + path,
          username: this.getUsername(),
          password: this.getPassword(),
          body: JSON.stringify(params),  // body is stringified so text/plain is returned so bigints are preserved
          timeout: timeoutMs === undefined ? this.timeoutMs : timeoutMs,
          rejectUnauthorized: this.rejectUnauthorized,
          proxyToWorker: this.proxyToWorker
        });
        
        // validate response
        MoneroRpcConnection.validateHttpResponse(resp);
        
        // deserialize response
        if (resp.body[0] != '{') throw resp.body;
        resp = JSON.parse(resp.body.replace(/("[^"]*"\s*:\s*)(\d{16,})/g, '$1"$2"'));  // replace 16 or more digits with strings and parse
        if (typeof resp === "string") resp = JSON.parse(resp);  // TODO: some responses returned as strings?
        if (LibraryUtils.getLogLevel() >= 3) {
          let respStr = JSON.stringify(resp);
          LibraryUtils.log(3, "Received response from path='" + path + "', response=" + respStr.substring(0, Math.min(1000, respStr.length)) + "(" + (new Date().getTime() - startTime) + " ms)");
        }
        
        // check rpc response for errors
        this.validateRpcResponse(resp, path, params);
        return resp;
      } catch (err: any) {
        if (err instanceof MoneroRpcError) throw err;
        else throw new MoneroRpcError(err, err.statusCode, path, params);
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
  async sendBinaryRequest(path, params?, timeoutMs?): Promise<any> {
    return this.queueSendRequest(async () => {

      // serialize params
      let paramsBin = await MoneroUtils.jsonToBinary(params);
          
      try {

        // logging
        if (LibraryUtils.getLogLevel() >= 2) LibraryUtils.log(2, "Sending binary request with path '" + path + "' and params: " + JSON.stringify(params));
        
        // send http request
        let resp = await HttpClient.request({
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
        if (resp.error) throw new MoneroRpcError(resp.error.message, resp.error.code, path, params);
        return resp;
      } catch (err: any) {
        if (err instanceof MoneroRpcError) throw err;
        else throw new MoneroRpcError(err, err.statusCode, path, params);
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
    let json = Object.assign({}, this)
    json.checkConnectionMutex = undefined;
    json.sendRequestMutex = undefined;
    return json;
  }
  
  toString() {
    return this.getUri() + " (username=" + this.getUsername() + ", password=" + (this.getPassword() ? "***" : this.getPassword()) + ", priority=" + this.getPriority() + ", timeoutMs=" + this.getTimeout() + ", isOnline=" + this.getIsOnline() + ", isAuthenticated=" + this.getIsAuthenticated() + ")";
  }

  setFakeDisconnected(fakeDisconnected) { // used to test connection manager
    this.fakeDisconnected = fakeDisconnected; 
  }
  
  // ------------------------------ PRIVATE HELPERS --------------------------

  protected async queueCheckConnection<T>(asyncFn: () => Promise<T>): Promise<T> {
    return this.checkConnectionMutex.submit(asyncFn);
  }

  protected async queueSendRequest<T>(asyncFn: () => Promise<T>): Promise<T> {
    return this.sendRequestMutex.submit(asyncFn);
  }
  
  protected static validateHttpResponse(resp) {
    let code = resp.statusCode;
    if (code < 200 || code > 299) {
      let content = resp.body;
      throw new MoneroRpcError(code + " " + resp.statusText + (!content ? "" : (": " + content)), code, undefined, undefined);
    }
  }
  
  protected validateRpcResponse(resp, method, params) {
    if (resp.error === undefined) return;
    let errorMsg = resp.error.message;
    if (errorMsg === "") errorMsg = "Received error response from RPC request with method '" + method + "' to " + this.getUri(); // TODO (monero-project): response sometimes has empty error message
    throw new MoneroRpcError(resp.error.message, resp.error.code, method, params);
  }
}
