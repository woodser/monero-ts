const GenUtils = require("./GenUtils");
const MoneroError = require("./MoneroError");
const MoneroRpcConnection = require("./MoneroRpcConnection");
const TaskLooper = require("./TaskLooper");
const ThreadPool = require("./ThreadPool");

/**
 * <p>Manages a collection of prioritized connections to daemon or wallet RPC endpoints.</p>
 *
 * <p>Example usage:</p>
 * 
 * <code>
 * // imports<br>
 * const monerojs = require("monero-javascript");<br>
 * const MoneroRpcConnection = monerojs.MoneroRpcConnection;<br>
 * const MoneroConnectionManager = monerojs.MoneroConnectionManager;<br>
 * const MoneroConnectionManagerListener = monerojs.MoneroConnectionManagerListener;<br><br>
 * 
 * // create connection manager<br>
 * let connectionManager = new MoneroConnectionManager();<br><br>
 * 
 * // add managed connections with priorities<br>
 * connectionManager.addConnection(new MoneroRpcConnection("http://localhost:38081").setPriority(1)); // use localhost as first priority<br>
 * connectionManager.addConnection(new MoneroRpcConnection("http://example.com")); // default priority is prioritized last<br><br>
 * 
 * // set current connection<br>
 * connectionManager.setConnection(new MoneroRpcConnection("http://foo.bar", "admin", "password")); // connection is added if new<br><br>
 * 
 * // check connection status<br>
 * await connectionManager.checkConnection();<br>
 * console.log("Connection manager is connected: " + connectionManager.isConnected());<br>
 * console.log("Connection is online: " + connectionManager.getConnection().isOnline());<br>
 * console.log("Connection is authenticated: " + connectionManager.getConnection().isAuthenticated());<br><br>
 * 
 * // receive notifications of any changes to current connection<br>
 * connectionManager.addListener(new class extends MoneroConnectionManagerListener {<br>
 * &nbsp;&nbsp; onConnectionChanged(connection) {<br>
 * &nbsp;&nbsp;&nbsp;&nbsp; console.log("Connection changed to: " + connection);<br>
 * &nbsp;&nbsp; }<br>
 * });<br><br>
 *  
 * // check connection status every 10 seconds<br>
 * await connectionManager.startCheckingConnection(10000);<br><br>
 * 
 * // automatically switch to best available connection if disconnected<br>
 * connectionManager.setAutoSwitch(true);<br><br>
 * 
 * // get best available connection in order of priority then response time<br>
 * let bestConnection = await connectionManager.getBestAvailableConnection();<br><br>
 * 
 * // check status of all connections<br>
 * await connectionManager.checkConnections();<br><br>
 * 
 * // get connections in order of current connection, online status from last check, priority, and name<br>
 * let connections = connectionManager.getConnections();<br><br>
 * 
 * // clear connection manager<br>
 * connectionManager.clear();
 * <code>
 */
class MoneroConnectionManager {
  
  /**
   * Construct a connection manager.
   * 
   * @param {boolean} proxyToWorker - configure all connections to proxy to worker (default true)
   */
  constructor(proxyToWorker) {
    this._proxyToWorker = proxyToWorker !== false;
    this._timeoutInMs = MoneroConnectionManager.DEFAULT_TIMEOUT;
    this._connections = [];
    this._listeners = [];
  }
  
  /**
   * Add a listener to receive notifications when the connection changes.
   * 
   * @param {MoneroConnectionManagerListener} listener - the listener to add
   * @return {MoneroConnectionManager} this connection manager for chaining
   */
  addListener(listener) {
    this._listeners.push(listener);
    return this;
  }
  
  /**
   * Remove a listener.
   * 
   * @param {MoneroConnectionManagerListener} listener - the listener to remove
   * @return {MoneroConnectionManager} this connection manager for chaining
   */
  removeListener(listener) {
    if (!GenUtils.remove(this._listeners, listener)) throw new MoneroError("Monero connection manager does not contain listener to remove");
    return this;
  }
  
  /**
   * Remove all listeners.
   * 
   * @return {MoneroConnectionManager} this connection manager for chaining
   */
  removeListeners() {
    this._listeners.splice(0, this._listeners.length);
    return this;
  }
  
  /**
   * Add a connection. The connection may have an elevated priority for this manager to use.
   * 
   * @param {MoneroRpcConnection} connection - the connection to add
   * @return {Promise<MoneroConnectionManager>} this connection manager for chaining
   */
  async addConnection(connection) {
    for (let aConnection of this._connections) {
      if (aConnection.getUri() === connection.getUri()) throw new MoneroError("Connection URI already exists");
    }
    if (this._proxyToWorker !== undefined) connection.setProxyToWorker(this._proxyToWorker);
    this._connections.push(connection);
    return this;
  }
  
  /**
   * Remove a connection.
   * 
   * @param {string} uri - of the the connection to remove
   * @return {Promise<MoneroConnectionManager>} this connection manager for chaining
   */
  async removeConnection(uri) {
    let connection = this.getConnectionByUri(uri);
    if (!connection) throw new MoneroError("No connection exists with URI: " + uri);
    GenUtils.remove(this._connections, connection);
    if (connection === this._currentConnection) {
      this._currentConnection = undefined;
      this._onConnectionChanged(this._currentConnection);
    }
    return this;
  }
  
  /**
   * Indicates if the connection manager is connected to a node.
   * 
   * @return {boolean|undefined} true if the current connection is set, online, and not unauthenticated, undefined if unknown, false otherwise
   */
  isConnected() {
    if (!this._currentConnection) return false;
    return this._currentConnection.isConnected();
  }
  
  /**
   * Get the current connection.
   * 
   * @return {MoneroRpcConnection} the current connection or undefined if no connection set
   */
  getConnection() {
    return this._currentConnection;
  }
  
  /**
   * Get a connection by URI.
   * 
   * @param {string} uri is the URI of the connection to get
   * @return {MoneroRpcConnection} the connection with the URI or undefined if no connection with the URI exists
   */
  getConnectionByUri(uri) {
    for (let connection of this._connections) if (connection.getUri() === uri) return connection;
    return undefined;
  }
  
  /**
   * Get all connections in order of current connection (if applicable), online status, priority, and name.
   * 
   * @return {MoneroRpcConnection[]} the list of sorted connections
   */
  getConnections() {
    let sortedConnections = GenUtils.copyArray(this._connections);
    sortedConnections.sort(this._compareConnections.bind(this));
    return sortedConnections;
  }
  
  /**
   * Get the best available connection in order of priority then response time.
   * 
   * @param {MoneroRpcConnection[]} excludedConnections - connections to be excluded from consideration (optional)
   * @return {Promise<MoneroRpcConnection>} the best available connection in order of priority then response time, undefined if no connections available
   */
  async getBestAvailableConnection(excludedConnections) {
    
    // try connections within each ascending priority
    for (let prioritizedConnections of this._getConnectionsInAscendingPriority()) {
      try {
        
        // create promises to check connections
        let that = this;
        let checkPromises = [];
        for (let connection of prioritizedConnections) {
          if (excludedConnections && GenUtils.arrayContains(excludedConnections, connection)) continue;
          checkPromises.push(new Promise(async function(resolve, reject) {
            await connection.checkConnection(that._timeoutInMs);
            if (connection.isConnected()) resolve(connection);
            reject();
          }));
        }
        
        // use first available connection
        let firstAvailable = await Promise.any(checkPromises);
        if (firstAvailable) return firstAvailable;
      } catch (err) {
        if (!(err instanceof AggregateError)) throw new MoneroError(err);
      }
    }
    return undefined;
  }
  
  /**
   * Set the current connection.
   * Provide a URI to select an existing connection without updating its credentials.
   * Provide a MoneroRpcConnection to add new connection or replace existing connection with the same URI.
   * Notify if current connection changes.
   * Does not check the connection.
   * 
   * @param {string|MoneroRpcConnection} uriOrConnection - is the uri of the connection or the connection to make current (default undefined for no current connection)
   * @return {MoneroConnectionManager} this connection manager for chaining
   */
  setConnection(uriOrConnection) {
    
    // handle uri
    if (uriOrConnection && typeof uriOrConnection === "string") {
      let connection = this.getConnectionByUri(uriOrConnection);
      return this.setConnection(connection === undefined ? new MoneroRpcConnection(uriOrConnection) : connection);
    }
    
    // handle connection
    let connection = uriOrConnection;
    if (this._currentConnection === connection) return this;
    
    // check if setting undefined connection
    if (!connection) {
      this._currentConnection = undefined;
      this._onConnectionChanged(undefined);
      return this;
    }
    
    // validate connection
    if (!(connection instanceof MoneroRpcConnection)) throw new MoneroError("Must provide string or MoneroRpcConnection to set connection");
    if (!connection.getUri()) throw new MoneroError("Connection is missing URI");

    // add or replace connection
    let prevConnection = this.getConnectionByUri(connection.getUri());
    if (prevConnection) GenUtils.remove(this._connections, prevConnection);
    this.addConnection(connection);
    this._currentConnection = connection;
    this._onConnectionChanged(this._currentConnection);
    
    return this;
  }
  
  /**
   * Check the current connection. If disconnected and auto switch enabled, switches to best available connection.
   * 
   * @return {Promise<MoneroConnectionManager>} this connection manager for chaining
   */
  async checkConnection() {
    let connectionChanged = false;
    let connection = this.getConnection();
    if (connection && await connection.checkConnection(this._timeoutInMs)) connectionChanged = true;
    if (this._autoSwitch && !this.isConnected()) {
      let bestConnection = await this.getBestAvailableConnection([connection]);
      if (bestConnection) {
        this.setConnection(bestConnection);
        return this;
      }
    }
    if (connectionChanged) await this._onConnectionChanged(connection);   
    return this;
  }
  
  /**
   * Check all managed connections.
   * 
   * @return {Promise<MoneroConnectionManager>} this connection manager for chaining
   */
  async checkConnections() {
    
    // check all connections
    await Promise.all(this.checkConnectionPromises());
    
    // auto switch to best connection
    if (this._autoSwitch && !this.isConnected()) {
      for (let prioritizedConnections of this._getConnectionsInAscendingPriority()) {
        let bestConnection;
        for (let prioritizedConnection of prioritizedConnections) {
          if (prioritizedConnection.isConnected() && (!bestConnection || prioritizedConnection.getResponseTime() < bestConnection.getResponseTime())) {
            bestConnection = prioritizedConnection;
          }
        }
        if (bestConnection) {
          this.setConnection(bestConnection);
          break;
        }
      }
    }
    return this;
  }
  
  /**
   * Check all managed connections, returning a promise for each connection check.
   * Does not auto switch if disconnected.
   *
   * @return {Promise[]} a promise for each connection in the order of getConnections().
   */
  checkConnectionPromises() {
    let that = this;
    let checkPromises = [];
    let pool = new ThreadPool(this._connections.length);
    for (let connection of this.getConnections()) {
      checkPromises.push(pool.submit(async function() {
        try {
          if (await connection.checkConnection(that._timeoutInMs) && connection === this._currentConnection) await that._onConnectionChanged(connection);
        } catch (err) {
          // ignore error
        }
      }));
    }
    Promise.all(checkPromises);
    return checkPromises;
  }
  
  /**
   * Check the connection and start checking the connection periodically.
   * 
   * @param {number} periodMs is the time between checks in milliseconds (default 10000 or 10 seconds)
   * @return {Promise<MoneroConnectionManager>} this connection manager for chaining (after first checking the connection)
   */
  async startCheckingConnection(periodMs) {
    await this.checkConnection();
    if (!periodMs) periodMs = MoneroConnectionManager.DEFAULT_CHECK_CONNECTION_PERIOD;
    if (this._checkLooper) return this;
    let that = this;
    let firstCheck = true;
    this._checkLooper = new TaskLooper(async function() {
      if (firstCheck) {
        firstCheck = false; // skip first check
        return;
      }
      try { await that.checkConnection(); }
      catch (err) { console.error("Error checking connection: " + err); }
    });
    this._checkLooper.start(periodMs);
    return this;
  }
  
  /**
   * Stop checking the connection status periodically.
   * 
   * @return {MoneroConnectionManager} this connection manager for chaining
   */
  stopCheckingConnection() {
    if (this._checkLooper) this._checkLooper.stop();
    delete this._checkLooper;
    return this;
  }

  /**
   * Automatically switch to best available connection if current connection is disconnected after being checked.
   * 
   * @param {boolean} autoSwitch specifies if the connection should switch on disconnect
   * @return {MoneroConnectionManager} this connection manager for chaining
   */
  setAutoSwitch(autoSwitch) {
    this._autoSwitch = autoSwitch;
    return this;
  }
  
  /**
   * Get if auto switch is enabled or disabled.
   * 
   * @return {boolean} true if auto switch enabled, false otherwise
   */
  getAutoSwitch() {
    return this._autoSwitch;
  }
  
  /**
   * Set the maximum request time before its connection is considered offline.
   * 
   * @param {int} timeoutInMs - the timeout before the connection is considered offline
   * @return {MoneroConnectionManager} this connection manager for chaining
   */
  setTimeout(timeoutInMs) {
    this._timeoutInMs = timeoutInMs;
    return this;
  }
  
  /**
   * Get the request timeout.
   * 
   * @return {int} the request timeout before a connection is considered offline
   */
  getTimeout() {
    return this._timeoutInMs;
  }
  
  /**
   * Collect connectable peers of the managed connections.
   *
   * @return {MoneroRpcConnection[]} connectable peers
   */
  async getPeerConnections() {
    throw new MoneroError("Not implemented");
  }
  
  /**
   * Disconnect from the current connection.
   * 
   * @return {MoneroConnectionManager} this connection manager for chaining
   */
  disconnect() {
    this.setConnection(undefined);
    return this;
  }
  
  /**
   * Remove all connections.
   * 
   * @return {MoneroConnectonManager} this connection manager for chaining
   */
  clear() {
    this._connections.splice(0, this._connections.length);
    if (this._currentConnection) {
      this._currentConnection = undefined;
      this._onConnectionChanged(undefined);
    }
    return this;
  }
  
  /**
   * Reset to default state.
   * 
   * @return {MoneroConnectonManager} this connection manager for chaining
   */
  reset() {
    this.removeListeners();
    this.stopCheckingConnection();
    this.clear();
    this._timeoutMs = MoneroConnectionManager.DEFAULT_TIMEOUT;
    this._autoSwitch = false;
    return this;
  }

  /**
   * Get all listeners.
   * 
   * @return {MoneroConnectionManagerListener[]} all listeners
   */
  getListeners() {
    return this._listeners
  }
  
  // ------------------------------ PRIVATE HELPERS ---------------------------
  
  async _onConnectionChanged(connection) {
    let promises = [];
    for (let listener of this._listeners) promises.push(listener.onConnectionChanged(connection));
    return Promise.all(promises);
  }
  
  _getConnectionsInAscendingPriority() {
    let connectionPriorities = new Map();
    for (let connection of this._connections) {
      if (!connectionPriorities.has(connection.getPriority())) connectionPriorities.set(connection.getPriority(), []);
      connectionPriorities.get(connection.getPriority()).push(connection);
    }
    let ascendingPriorities = new Map([...connectionPriorities].sort((a, b) => parseInt(a[0]) - parseInt(b[0]))); // create map in ascending order
    let ascendingPrioritiesList = [];
    for (let priorityConnections of ascendingPriorities.values()) ascendingPrioritiesList.push(priorityConnections);
    if (connectionPriorities.has(0)) ascendingPrioritiesList.push(ascendingPrioritiesList.splice(0, 1)[0]); // move priority 0 to end
    return ascendingPrioritiesList;
  }
  
  _compareConnections(c1, c2) {
    
      // current connection is first
      if (c1 === this._currentConnection) return -1;
      if (c2 === this._currentConnection) return 1;
      
      // order by availability then priority then by name
      if (c1.isOnline() === c2.isOnline()) {
        if (c1.getPriority() === c2.getPriority()) return c1.getUri().localeCompare(c2.getUri());
        else return c1.getPriority() == 0 ? 1 : c2.getPriority() == 0 ? -1 : c1.getPriority() - c2.getPriority();
      } else {
        if (c1.isOnline()) return -1;
        else if (c2.isOnline()) return 1;
        else if (c1.isOnline() === undefined) return -1;
        else return 1; // c1 is offline
      }
  }
}

MoneroConnectionManager.DEFAULT_TIMEOUT = 5000;
MoneroConnectionManager.DEFAULT_CHECK_CONNECTION_PERIOD = 15000;

module.exports = MoneroConnectionManager;