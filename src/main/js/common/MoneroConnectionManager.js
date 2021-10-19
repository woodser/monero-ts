const GenUtils = require("./GenUtils");
const MoneroError = require("./MoneroError");
const MoneroRpcConnection = require("./MoneroRpcConnection");
const TaskLooper = require("./TaskLooper");
const ThreadPool = require("./ThreadPool");

/**
 * Manages a collection of prioritized Monero RPC connections.
 */
class MoneroConnectionManager {
  
  constructor() {
    this._timeoutInMs = MoneroRpcConnection.DEFAULT_TIMEOUT;
    this._connections = [];
    this._listeners = [];
  }
  
  /**
   * Add a connection. The connection may have an elevated priority for this manager to use.
   * 
   * @param {MoneroRpcConnection} connection - the connection to add
   * @return {MoneroConnectionManager} this connection manager for chaining
   */
  addConnection(connection) {
    for (let aConnection of this._connections) {
      if (aConnection.getUri() === connection.getUri()) throw new MoneroError("Connection URI already exists");
    }
    this._connections.push(connection);
    return this;
  }
  
  /**
   * Remove a connection.
   * 
   * @param {MoneroRpcConnection} connection - the connection to remove
   * @return {MoneroConnectionManager} this connection manager for chaining
   */
  removeConnection(connection) {
    if (!GenUtils.remove(connections, connection)) throw new MoneroError("Monero connection manager does not contain connection to remove");
    connection._setIsCurrentConnection(false);
    return this;
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
   * Get all connections in order of current connection (if applicable), online status, priority, and name.
   * 
   * @return {MoneroRpcConnection[]} the list of sorted connections
   */
  getConnections() {
    let sortedConnections = GenUtils.copyArray(this._connections);
    sortedConnections.sort(MoneroConnectionManager._compareConnections);
    return sortedConnections;
  }
  
  /**
   * Automatically refresh the connection status by polling the server in a fixed period loop.
   * 
   * @param {number} refreshPeriod is the time between refreshes in milliseconds (default 10000 or 10 seconds)
   * @return {MoneroConnectionManager} this connection manager for chaining
   */
  startAutoRefresh(refreshPeriod) {
    if (!refreshPeriod) refreshPeriod = MoneroConnectionManager.DEFAULT_REFRESH_PERIOD;
    if (!this.refreshLooper) {
      let that = this;
      this.refreshLooper = new TaskLooper(async function() {
        try { if (that.getConnection()) await that.refreshConnection(); }
        catch (err) { console.error("Error refreshing connection: " + err); }
      });
    }
    this.refreshLooper.start(refreshPeriod);
    return this;
  }
  
  /**
   * Stop automatically refreshing the connection status.
   * @return {MoneroConnectionManager} this connection manager for chaining
   */
  stopAutoRefresh() {
    if (this.refreshLooper) this.refreshLooper.stop();
    return this;
  }
  
  /**
   * Automatically switch to best available connection if current connection disconnects.
   * 
   * @param {boolean} autoSwitch specifies if the connection should switch on disconnect
   * @return {MoneroConnectionManager} this connection manager for chaining
   */
  setAutoSwitch(autoSwitch) {
    this.autoSwitch = autoSwitch;
    return this;
  }
  
  /**
   * Connect to given connection or best available connection in order of priority then response time.
   * 
   * @param {MoneroRpcConnection} connection - connect if given, otherwise connect to best available connection
   * @return {MoneroRpcConnection} the selected connection
   */
  async connect(connection) {
    
    // connect if given
    if (connection) {
      if (!this._connections.includes(connection)) this.addConnection(connection);
      await connection.refreshConnection(this._timeoutInMs);
      if (!connection.isOnline()) throw new MoneroError("Connection is not online");
      if (connection.isAuthenticated() === false) throw new MoneroError("Connection is not authenticated");
      await this._setCurrentConnection(connection);
      return connection;
    } else {
      
      // try connections within each descending priority
      for (let prioritizedConnections of this._getConnectionsInDescendingPriority()) {
        try {
        
          // check connections in parallel
          let that = this;
          let refreshPromises = [];
          let pool = new ThreadPool(prioritizedConnections.length);
          for (let connection of prioritizedConnections) {
            refreshPromises.push(pool.submit(async function() {
              return new Promise(function(resolve, reject) {
                connection.refreshConnection(that._timeoutInMs).then(function() {
                  if (connection.isOnline() && connection.isAuthenticated() !== false) resolve(connection);
                  else reject();
                }, function(err) {
                  reject(err);
                })
              });
            }));
          }
          
          // use first available connection
          let firstAvailable = await Promise.any(refreshPromises);
          if (firstAvailable) {
            await this._setCurrentConnection(firstAvailable);
            return firstAvailable;
          }
        } catch (err) {
          throw new MoneroError(err);
        }
      }
      return undefined;
    }
  }
  
  /**
   * Indicates if the connection manager is connected to a node.
   * 
   * @return {boolean} true if the manager is connected to a node
   */
  isConnected() {
    let connection = this.getConnection();
    return connection && connection.isOnline() && connection.isAuthenticated() !== false;
  }
  
  /**
   * Get the currently used connection.
   * 
   * @return {MoneroRpcConnection} the current connection
   */
  getConnection() {
    for (let connection of this._connections) if (connection._isCurrentConnection()) return connection;
    return undefined;
  }
  
  /**
   * Refresh the current connection.
   * 
   * @return {MoneroRpcConnection} the current connection
   */
  async refreshConnection() {
    let connection = this.getConnection();
    if (!connection) throw new MoneroError("There is no current connection");
    if (await connection.refreshConnection(this._timeoutInMs)) await this._onConnectionChanged(connection);   
    if (this.autoSwitch && (!connection.isOnline() || connection.isAuthenticated() === false)) return this.connect();
    return connection;
  }
  
  /**
   * Refresh all managed connections.
   * 
   * @return {Promise} resolves when all connections refresh
   */
  async refreshAllConnections() {
    return Promise.all(this.refreshAllConnectionPromises());
  }
  
  /**
   * Refresh all managed connections, returning a promise for each connection refresh.
   *
   * @return {Promise[]} a promise for each connection in the order of getConnections().
   */
  refreshAllConnectionPromises() {
    let that = this;
    let refreshPromises = [];
    let currentConnection = this.getConnection();
    let pool = new ThreadPool(this._connections.length);
    for (let connection of this.getConnections()) {
      refreshPromises.push(pool.submit(async function() {
        try {
          if (await connection.refreshConnection(that._timeoutInMs) && connection === currentConnection) await that._onConnectionChanged(connection);
        } catch (err) {
          // ignore error
        }
      }));
    }
    return refreshPromises;
  }
  
  /**
   * Collect connectable peers of the managed connections.
   *
   * @return {MoneroRpcConnection[]} connectable peers
   */
  async getPeerConnections() {
    throw new MoneroError("Not implemented");
  }
  
  // ------------------------------ PRIVATE HELPERS ---------------------------
  
  async _onConnectionChanged(connection) {
    let promises = [];
    for (let listener of this._listeners) promises.push(listener.onConnectionChanged(connection));
    return Promise.all(promises);
  }
  
  _getConnectionsInDescendingPriority() {
    let connectionPriorities = new Map();
    for (let connection of this._connections) {
      if (!connectionPriorities.has(connection.getPriority())) connectionPriorities.set(connection.getPriority(), []);
      connectionPriorities.get(connection.getPriority()).push(connection);
    }
    let descendingPriorities = new Map([...connectionPriorities].sort((a, b) => parseInt(b[0]) - parseInt(a[0]))); // create map in descending order
    let descendingPrioritiesList = [];
    for (let priorityConnections of descendingPriorities.values()) descendingPrioritiesList.push(priorityConnections);
    return descendingPrioritiesList;
  }
  
  async _setCurrentConnection(connection) {
    if (connection === this.getConnection()) return;
    for (let aConnection of this._connections) aConnection._setIsCurrentConnection(aConnection === connection);
    return this._onConnectionChanged(connection);
  }
  
  static _compareConnections(c1, c2) {
    
      // current connection is first
      if (c1._isCurrentConnection()) return -1;
      if (c2._isCurrentConnection()) return 1;
      
      // order by availability then priority then by name
      if (c1.isOnline() === c2.isOnline()) {
        if (c1.getPriority() === c2.getPriority()) return c1.getUri().localeCompare(c2.getUri());
        else return c1.getPriority() > c2.getPriority() ? -1 : 1;
      } else {
        if (c1.isOnline()) return -1;
        else if (c2.isOnline()) return 1;
        else if (c1.isOnline() === undefined) return -1;
        else return 1; // c1 is offline
      }
  }
}

MoneroConnectionManager.DEFAULT_TIMEOUT = 5000;
MoneroConnectionManager.DEFAULT_REFRESH_PERIOD = 10000;

module.exports = MoneroConnectionManager;