"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _GenUtils = _interopRequireDefault(require("./GenUtils"));
var _TaskLooper = _interopRequireDefault(require("./TaskLooper"));
var _ThreadPool = _interopRequireDefault(require("./ThreadPool"));

var _MoneroError = _interopRequireDefault(require("./MoneroError"));
var _MoneroRpcConnection = _interopRequireDefault(require("./MoneroRpcConnection"));

/**
 * <p>Manages a collection of prioritized connections to daemon or wallet RPC endpoints.</p>
 *
 * <p>Example usage:</p>
 * 
 * <code>
 * // imports<br>
 * import { MoneroRpcConnection, MoneroConnectionManager, MoneroConnectionManagerListener } from "monero-ts";<br>
 * <br>
 * // create connection manager<br>
 * let connectionManager = new MoneroConnectionManager();<br>
 * <br>
 * // add managed connections with priorities<br>
 * await connectionManager.addConnection({uri: "http://localhost:38081", priority: 1}); // use localhost as first priority<br>
 * await connectionManager.addConnection({uri: "http://example.com"}); // default priority is prioritized last<br>
 * <br>
 * // set current connection<br>
 * await connectionManager.setConnection({uri: "http://foo.bar", username: "admin", password: "password"}); // connection is added if new<br>
 * <br>
 * // check connection status<br>
 * await connectionManager.checkConnection();<br>
 * console.log("Connection manager is connected: " + connectionManager.isConnected());<br>
 * console.log("Connection is online: " + connectionManager.getConnection().getIsOnline());<br>
 * console.log("Connection is authenticated: " + connectionManager.getConnection().getIsAuthenticated());<br>
 * <br> 
 * // receive notifications of any changes to current connection<br>
 * connectionManager.addListener(new class extends MoneroConnectionManagerListener {<br>
 * &nbsp;&nbsp; async onConnectionChanged(connection) {<br>
 * &nbsp;&nbsp;&nbsp;&nbsp; console.log("Connection changed to: " + connection);<br>
 * &nbsp;&nbsp; }<br>
 * });<br>
 * <br>
 * // start polling for best connection every 10 seconds and automatically switch<br>
 * connectionManager.startPolling(10000);<br>
 * <br>
 * // automatically switch to best available connection if disconnected<br>
 * connectionManager.setAutoSwitch(true);<br>
 * <br>
 * // get best available connection in order of priority then response time<br>
 * let bestConnection = await connectionManager.getBestAvailableConnection();<br>
 * <br>
 * // check status of all connections<br>
 * await connectionManager.checkConnections();<br>
 * <br>
 * // get connections in order of current connection, online status from last check, priority, and name<br>
 * let connections = connectionManager.getConnections();<br>
 * <br>
 * // clear connection manager<br>
 * connectionManager.clear();
 * </code>
 */
class MoneroConnectionManager {

  // static variables
  static DEFAULT_TIMEOUT = 5000;
  static DEFAULT_POLL_PERIOD = 20000;
  static DEFAULT_AUTO_SWITCH = true;
  static MIN_BETTER_RESPONSES = 3;

  // instance variables









  /**
   * Specify behavior when polling.
   * 
   * One of PRIORITIZED (poll connections in order of priority until connected; default), CURRENT (poll current connection), or ALL (poll all connections).
   */
  static PollType = {
    PRIORITIZED: 0,
    CURRENT: 1,
    ALL: 2
  };

  /**
   * Construct a connection manager.
   * 
   * @param {boolean} [proxyToWorker] - configure all connections to proxy to worker (default true)
   */
  constructor(proxyToWorker = true) {
    this.proxyToWorker = proxyToWorker !== false;
    this.timeoutMs = MoneroConnectionManager.DEFAULT_TIMEOUT;
    this.autoSwitch = MoneroConnectionManager.DEFAULT_AUTO_SWITCH;
    this.connections = [];
    this.responseTimes = new Map();
    this.listeners = [];
  }

  /**
   * Add a listener to receive notifications when the connection changes.
   * 
   * @param {MoneroConnectionManagerListener} listener - the listener to add
   * @return {MoneroConnectionManager} this connection manager for chaining
   */
  addListener(listener) {
    this.listeners.push(listener);
    return this;
  }

  /**
   * Remove a listener.
   * 
   * @param {MoneroConnectionManagerListener} listener - the listener to remove
   * @return {MoneroConnectionManager} this connection manager for chaining
   */
  removeListener(listener) {
    if (!_GenUtils.default.remove(this.listeners, listener)) throw new _MoneroError.default("Monero connection manager does not contain listener to remove");
    return this;
  }

  /**
   * Remove all listeners.
   * 
   * @return {MoneroConnectionManager} this connection manager for chaining
   */
  removeListeners() {
    this.listeners.splice(0, this.listeners.length);
    return this;
  }

  /**
   * Get all listeners.
   * 
   * @return {MoneroConnectionManagerListener[]} all listeners
   */
  getListeners() {
    return this.listeners;
  }

  /**
   * Add a connection. The connection may have an elevated priority for this manager to use.
   * 
   * @param {string|Partial<MoneroRpcConnection>} uriOrConnection - uri or connection to add
   * @return {Promise<MoneroConnectionManager>} this connection manager for chaining
   */
  async addConnection(uriOrConnection) {
    let connection = uriOrConnection instanceof _MoneroRpcConnection.default ? uriOrConnection : new _MoneroRpcConnection.default(uriOrConnection);
    for (let aConnection of this.connections) {
      if (aConnection.getUri() === connection.getUri()) throw new _MoneroError.default("Connection URI already exists");
    }
    if (this.proxyToWorker !== undefined) connection.setProxyToWorker(this.proxyToWorker);
    this.connections.push(connection);
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
    if (!connection) throw new _MoneroError.default("No connection exists with URI: " + uri);
    _GenUtils.default.remove(this.connections, connection);
    this.responseTimes.delete(connection.getUri());
    if (connection === this.currentConnection) {
      this.currentConnection = undefined;
      await this.onConnectionChanged(this.currentConnection);
    }
    return this;
  }

  /**
   * Set the current connection.
   * Provide a URI to select an existing connection without updating its credentials.
   * Provide a MoneroRpcConnection to add new connection or replace existing connection with the same URI.
   * Notify if current connection changes.
   * Does not check the connection.
   * 
   * @param {string|Partial<MoneroRpcConnection>} [uriOrConnection] - is the uri of the connection or the connection to make current (default undefined for no current connection)
   * @return {Promise<MoneroConnectionManager>} this connection manager for chaining
   */
  async setConnection(uriOrConnection) {

    // handle uri
    if (uriOrConnection && typeof uriOrConnection === "string") {
      let connection = this.getConnectionByUri(uriOrConnection);
      return this.setConnection(connection === undefined ? new _MoneroRpcConnection.default(uriOrConnection) : connection);
    }

    // handle connection
    let connection = uriOrConnection;
    if (this.currentConnection === connection) return this;

    // check if setting undefined connection
    if (!connection) {
      this.currentConnection = undefined;
      await this.onConnectionChanged(undefined);
      return this;
    }

    // validate connection
    if (!(connection instanceof _MoneroRpcConnection.default)) connection = new _MoneroRpcConnection.default(connection);
    if (!connection.getUri()) throw new _MoneroError.default("Connection is missing URI");

    // add or replace connection
    let prevConnection = this.getConnectionByUri(connection.getUri());
    if (prevConnection) _GenUtils.default.remove(this.connections, prevConnection);
    await this.addConnection(connection);
    this.currentConnection = connection;
    await this.onConnectionChanged(this.currentConnection);

    return this;
  }

  /**
   * Get the current connection.
   * 
   * @return {MoneroRpcConnection} the current connection or undefined if no connection set
   */
  getConnection() {
    return this.currentConnection;
  }

  /**
   * Indicates if this manager has a connection with the given URI.
   * 
   * @param {string} uri URI of the connection to check
   * @return {boolean} true if this manager has a connection with the given URI, false otherwise
   */
  hasConnection(uri) {
    return this.getConnectionByUri(uri) !== undefined;
  }

  /**
   * Get a connection by URI.
   * 
   * @param {string} uri is the URI of the connection to get
   * @return {MoneroRpcConnection} the connection with the URI or undefined if no connection with the URI exists
   */
  getConnectionByUri(uri) {
    for (let connection of this.connections) if (connection.getUri() === uri) return connection;
    return undefined;
  }

  /**
   * Get all connections in order of current connection (if applicable), online status, priority, and name.
   * 
   * @return {MoneroRpcConnection[]} the list of sorted connections
   */
  getConnections() {
    let sortedConnections = _GenUtils.default.copyArray(this.connections);
    sortedConnections.sort(this.compareConnections.bind(this));
    return sortedConnections;
  }

  /**
   * Indicates if the connection manager is connected to a node.
   * 
   * @return {boolean|undefined} true if the current connection is set, online, and not unauthenticated, undefined if unknown, false otherwise
   */
  isConnected() {
    if (!this.currentConnection) return false;
    return this.currentConnection.isConnected();
  }

  /**
   * Start polling connections.
   * 
   * @param {number} [periodMs] poll period in milliseconds (default 20s)
   * @param {boolean} [autoSwitch] specifies to automatically switch to the best connection (default true unless changed)
   * @param {number} [timeoutMs] specifies the timeout to poll a single connection (default 5s unless changed)
   * @param {number} [pollType] one of PRIORITIZED (poll connections in order of priority until connected; default), CURRENT (poll current connection), or ALL (poll all connections)
   * @param {MoneroRpcConnection[]} [excludedConnections] connections excluded from being polled
   * @return {MoneroConnectionManager} this connection manager for chaining
   */
  startPolling(periodMs, autoSwitch, timeoutMs, pollType, excludedConnections) {

    // apply defaults
    if (periodMs == undefined) periodMs = MoneroConnectionManager.DEFAULT_POLL_PERIOD;
    if (autoSwitch !== undefined) this.setAutoSwitch(autoSwitch);
    if (timeoutMs !== undefined) this.setTimeout(timeoutMs);
    if (pollType === undefined) pollType = MoneroConnectionManager.PollType.PRIORITIZED;

    // stop polling
    this.stopPolling();

    // start polling
    switch (pollType) {
      case MoneroConnectionManager.PollType.CURRENT:
        this.startPollingConnection(periodMs);
        break;
      case MoneroConnectionManager.PollType.ALL:
        this.startPollingConnections(periodMs);
        break;
      case MoneroConnectionManager.PollType.PRIORITIZED:
      default:
        this.startPollingPrioritizedConnections(periodMs, excludedConnections);
    }
    return this;
  }

  /**
   * Stop polling connections.
   * 
   * @return {MoneroConnectionManager} this connection manager for chaining
   */
  stopPolling() {
    if (this.poller) this.poller.stop();
    this.poller = undefined;
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
    if (connection) {
      if (await connection.checkConnection(this.timeoutMs)) connectionChanged = true;
      await this.processResponses([connection]);
    }
    if (this.autoSwitch && !this.isConnected()) {
      let bestConnection = await this.getBestAvailableConnection([connection]);
      if (bestConnection) {
        await this.setConnection(bestConnection);
        return this;
      }
    }
    if (connectionChanged) await this.onConnectionChanged(connection);
    return this;
  }

  /**
   * Check all managed connections.
   * 
   * @return {Promise<MoneroConnectionManager>} this connection manager for chaining
   */
  async checkConnections() {
    await this.checkConnectionsAux(this.getConnections());
    return this;
  }

  /**
   * Check all managed connections, returning a promise for each connection check.
   * Does not auto switch if disconnected.
   *
   * @return {Promise[]} a promise for each connection in the order of getConnections().
   */
  checkConnectionPromises() {
    let checkPromises = [];
    let pool = new _ThreadPool.default(this.connections.length);
    for (let connection of this.getConnections()) {
      checkPromises.push(pool.submit(async () => {
        try {
          if ((await connection.checkConnection(this.timeoutMs)) && connection === this.currentConnection) await this.onConnectionChanged(connection);
        } catch (err) {

          // ignore error
        }}));
    }
    Promise.all(checkPromises);
    return checkPromises;
  }

  /**
   * Get the best available connection in order of priority then response time.
   * 
   * @param {MoneroRpcConnection[]} [excludedConnections] - connections to be excluded from consideration (optional)
   * @return {Promise<MoneroRpcConnection>} the best available connection in order of priority then response time, undefined if no connections available
   */
  async getBestAvailableConnection(excludedConnections) {

    // try connections within each ascending priority
    for (let prioritizedConnections of this.getConnectionsInAscendingPriority()) {
      try {

        // create promises to check connections
        let that = this;
        let checkPromises = [];
        for (let connection of prioritizedConnections) {
          if (excludedConnections && _GenUtils.default.arrayContains(excludedConnections, connection)) continue;
          checkPromises.push(new Promise(async function (resolve, reject) {
            await connection.checkConnection(that.timeoutMs);
            if (connection.isConnected()) resolve(connection);else
            reject();
          }));
        }

        // use first available connection
        let firstAvailable = await Promise.any(checkPromises);
        if (firstAvailable) return firstAvailable;
      } catch (err) {
        if (!(err instanceof AggregateError)) throw new _MoneroError.default(err);
      }
    }
    return undefined;
  }

  /**
   * Automatically switch to the best available connection as connections are polled, based on priority, response time, and consistency.
   * 
   * @param {boolean} autoSwitch specifies if the connection should auto switch to a better connection
   * @return {MoneroConnectionManager} this connection manager for chaining
   */
  setAutoSwitch(autoSwitch) {
    this.autoSwitch = autoSwitch;
    return this;
  }

  /**
   * Get if auto switch is enabled or disabled.
   * 
   * @return {boolean} true if auto switch enabled, false otherwise
   */
  getAutoSwitch() {
    return this.autoSwitch;
  }

  /**
   * Set the maximum request time before its connection is considered offline.
   * 
   * @param {number} timeoutMs - the timeout before the connection is considered offline
   * @return {MoneroConnectionManager} this connection manager for chaining
   */
  setTimeout(timeoutMs) {
    this.timeoutMs = timeoutMs;
    return this;
  }

  /**
   * Get the request timeout.
   * 
   * @return {number} the request timeout before a connection is considered offline
   */
  getTimeout() {
    return this.timeoutMs;
  }

  /**
   * Collect connectable peers of the managed connections.
   *
   * @return {Promise<MoneroRpcConnection[]>} connectable peers
   */
  async getPeerConnections() {
    throw new _MoneroError.default("Not implemented");
  }

  /**
   * Disconnect from the current connection.
   * 
   * @return {Promise<MoneroConnectionManager>} this connection manager for chaining
   */
  async disconnect() {
    await this.setConnection(undefined);
    return this;
  }

  /**
   * Remove all connections.
   * 
   * @return {Promise<MoneroConnectionManager>} this connection manager for chaining
   */
  async clear() {
    this.connections.splice(0, this.connections.length);
    if (this.currentConnection) {
      this.currentConnection = undefined;
      await this.onConnectionChanged(undefined);
    }
    return this;
  }

  /**
   * Reset to default state.
   * 
   * @return {MoneroConnectionManager} this connection manager for chaining
   */
  reset() {
    this.removeListeners();
    this.stopPolling();
    this.clear();
    this.timeoutMs = MoneroConnectionManager.DEFAULT_TIMEOUT;
    this.autoSwitch = MoneroConnectionManager.DEFAULT_AUTO_SWITCH;
    return this;
  }

  // ------------------------------ PRIVATE HELPERS ---------------------------

  async onConnectionChanged(connection) {
    let promises = [];
    for (let listener of this.listeners) promises.push(listener.onConnectionChanged(connection));
    return Promise.all(promises);
  }

  getConnectionsInAscendingPriority() {
    let connectionPriorities = new Map();
    for (let connection of this.connections) {
      if (!connectionPriorities.has(connection.getPriority())) connectionPriorities.set(connection.getPriority(), []);
      connectionPriorities.get(connection.getPriority()).push(connection);
    }
    let ascendingPriorities = new Map([...connectionPriorities].sort((a, b) => parseInt(a[0]) - parseInt(b[0]))); // create map in ascending order
    let ascendingPrioritiesList = [];
    for (let priorityConnections of ascendingPriorities.values()) ascendingPrioritiesList.push(priorityConnections);
    if (connectionPriorities.has(0)) ascendingPrioritiesList.push(ascendingPrioritiesList.splice(0, 1)[0]); // move priority 0 to end
    return ascendingPrioritiesList;
  }

  compareConnections(c1, c2) {

    // current connection is first
    if (c1 === this.currentConnection) return -1;
    if (c2 === this.currentConnection) return 1;

    // order by availability then priority then by name
    if (c1.getIsOnline() === c2.getIsOnline()) {
      if (c1.getPriority() === c2.getPriority()) return c1.getUri().localeCompare(c2.getUri());
      return this.comparePriorities(c1.getPriority(), c2.getPriority()) * -1; // order by priority in descending order
    } else {
      if (c1.getIsOnline()) return -1;else
      if (c2.getIsOnline()) return 1;else
      if (c1.getIsOnline() === undefined) return -1;else
      return 1; // c1 is offline
    }
  }

  comparePriorities(p1, p2) {
    if (p1 == p2) return 0;
    if (p1 == 0) return -1;
    if (p2 == 0) return 1;
    return p2 - p1;
  }

  startPollingConnection(periodMs) {
    this.poller = new _TaskLooper.default(async () => {
      try {await this.checkConnection();}
      catch (err) {console.log(err);}
    });
    this.poller.start(periodMs);
    return this;
  }

  startPollingConnections(periodMs) {
    this.poller = new _TaskLooper.default(async () => {
      try {await this.checkConnections();}
      catch (err) {console.log(err);}
    });
    this.poller.start(periodMs);
    return this;
  }

  startPollingPrioritizedConnections(periodMs, excludedConnections) {
    this.poller = new _TaskLooper.default(async () => {
      try {await this.checkPrioritizedConnections(excludedConnections);}
      catch (err) {console.log(err);}
    });
    this.poller.start(periodMs);
    return this;
  }

  async checkPrioritizedConnections(excludedConnections) {
    for (let prioritizedConnections of this.getConnectionsInAscendingPriority()) {
      let hasConnection = await this.checkConnectionsAux(prioritizedConnections, excludedConnections);
      if (hasConnection) return;
    }
  }

  async checkConnectionsAux(connections, excludedConnections) {
    try {

      // check connections in parallel
      let that = this;
      let checkPromises = [];
      let hasConnection = false;
      for (let connection of connections) {
        if (excludedConnections && _GenUtils.default.arrayContains(excludedConnections, connection)) continue;
        checkPromises.push(new Promise(async function (resolve, reject) {
          try {
            let change = await connection.checkConnection(that.timeoutMs);
            if (change && connection === that.getConnection()) await that.onConnectionChanged(connection);
            if (connection.isConnected() && !hasConnection) {
              hasConnection = true;
              if (!that.isConnected() && that.autoSwitch) await that.setConnection(connection); // set first available connection if disconnected
            }
            resolve(undefined);
          } catch (err) {
            reject(err);
          }
        }));
      }
      await Promise.all(checkPromises);

      // process responses
      await this.processResponses(connections);
      return hasConnection;
    } catch (err) {
      throw new _MoneroError.default(err);
    }
  }

  async processResponses(responses) {

    // add new connections
    for (let connection of responses) {
      if (!this.responseTimes.has(connection.getUri())) this.responseTimes.set(connection.getUri(), []);
    }

    // insert response times or undefined
    this.responseTimes.forEach((times, connection) => {
      times.unshift(_GenUtils.default.arrayContains(responses, connection) ? connection.getResponseTime() : undefined);

      // remove old response times
      if (times.length > MoneroConnectionManager.MIN_BETTER_RESPONSES) times.pop();
    });

    // update best connection based on responses and priority
    return await this.updateBestConnectionInPriority();
  }

  async updateBestConnectionInPriority() {
    if (!this.autoSwitch) return undefined;
    for (let prioritizedConnections of this.getConnectionsInAscendingPriority()) {
      let bestConnectionFromResponses = await this.getBestConnectionFromPrioritizedResponses(prioritizedConnections);
      if (bestConnectionFromResponses) {
        await this.setConnection(bestConnectionFromResponses);
        return bestConnectionFromResponses;
      }
    }
    return undefined;
  }

  /**
   * Get the best connection from the given responses.
   * 
   * @param {MoneroRpcConnection[]} responses connection responses to update from
   * @return {MoneroRpcConnection} the best response among the given responses or undefined if none are best
   */
  async getBestConnectionFromPrioritizedResponses(responses) {

    // get best response
    let bestResponse = undefined;
    for (let connection of responses) {
      if (connection.isConnected() === true && (!bestResponse || connection.getResponseTime() < bestResponse.getResponseTime())) bestResponse = connection;
    }

    // no update if no responses
    if (!bestResponse) return undefined;

    // use best response if disconnected
    let bestConnection = await this.getConnection();
    if (!bestConnection || bestConnection.isConnected() !== true) return bestResponse;

    // use best response if different priority (assumes being called in descending priority)
    if (this.comparePriorities(bestResponse.getPriority(), bestConnection.getPriority()) !== 0) return bestResponse;

    // keep best connection if not enough data
    if (!this.responseTimes.has(bestConnection.getUri())) return bestConnection;

    // check if connection is consistently better
    for (let connection of responses) {
      if (connection === bestConnection) continue;
      if (!this.responseTimes.has(connection.getUri()) || this.responseTimes.get(connection.getUri()).length < MoneroConnectionManager.MIN_BETTER_RESPONSES) continue;
      let better = true;
      for (let i = 0; i < MoneroConnectionManager.MIN_BETTER_RESPONSES; i++) {
        if (this.responseTimes.get(connection.getUri())[i] === undefined || this.responseTimes.get(bestConnection.getUri())[i] || this.responseTimes.get(connection.getUri())[i] > this.responseTimes.get(bestConnection.getUri())[i]) {
          better = false;
          break;
        }
      }
      if (better) bestConnection = connection;
    }
    return bestConnection;
  }
}exports.default = MoneroConnectionManager;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfR2VuVXRpbHMiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9UYXNrTG9vcGVyIiwiX1RocmVhZFBvb2wiLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvUnBjQ29ubmVjdGlvbiIsIk1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyIiwiREVGQVVMVF9USU1FT1VUIiwiREVGQVVMVF9QT0xMX1BFUklPRCIsIkRFRkFVTFRfQVVUT19TV0lUQ0giLCJNSU5fQkVUVEVSX1JFU1BPTlNFUyIsIlBvbGxUeXBlIiwiUFJJT1JJVElaRUQiLCJDVVJSRU5UIiwiQUxMIiwiY29uc3RydWN0b3IiLCJwcm94eVRvV29ya2VyIiwidGltZW91dE1zIiwiYXV0b1N3aXRjaCIsImNvbm5lY3Rpb25zIiwicmVzcG9uc2VUaW1lcyIsIk1hcCIsImxpc3RlbmVycyIsImFkZExpc3RlbmVyIiwibGlzdGVuZXIiLCJwdXNoIiwicmVtb3ZlTGlzdGVuZXIiLCJHZW5VdGlscyIsInJlbW92ZSIsIk1vbmVyb0Vycm9yIiwicmVtb3ZlTGlzdGVuZXJzIiwic3BsaWNlIiwibGVuZ3RoIiwiZ2V0TGlzdGVuZXJzIiwiYWRkQ29ubmVjdGlvbiIsInVyaU9yQ29ubmVjdGlvbiIsImNvbm5lY3Rpb24iLCJNb25lcm9ScGNDb25uZWN0aW9uIiwiYUNvbm5lY3Rpb24iLCJnZXRVcmkiLCJ1bmRlZmluZWQiLCJzZXRQcm94eVRvV29ya2VyIiwicmVtb3ZlQ29ubmVjdGlvbiIsInVyaSIsImdldENvbm5lY3Rpb25CeVVyaSIsImRlbGV0ZSIsImN1cnJlbnRDb25uZWN0aW9uIiwib25Db25uZWN0aW9uQ2hhbmdlZCIsInNldENvbm5lY3Rpb24iLCJwcmV2Q29ubmVjdGlvbiIsImdldENvbm5lY3Rpb24iLCJoYXNDb25uZWN0aW9uIiwiZ2V0Q29ubmVjdGlvbnMiLCJzb3J0ZWRDb25uZWN0aW9ucyIsImNvcHlBcnJheSIsInNvcnQiLCJjb21wYXJlQ29ubmVjdGlvbnMiLCJiaW5kIiwiaXNDb25uZWN0ZWQiLCJzdGFydFBvbGxpbmciLCJwZXJpb2RNcyIsInBvbGxUeXBlIiwiZXhjbHVkZWRDb25uZWN0aW9ucyIsInNldEF1dG9Td2l0Y2giLCJzZXRUaW1lb3V0Iiwic3RvcFBvbGxpbmciLCJzdGFydFBvbGxpbmdDb25uZWN0aW9uIiwic3RhcnRQb2xsaW5nQ29ubmVjdGlvbnMiLCJzdGFydFBvbGxpbmdQcmlvcml0aXplZENvbm5lY3Rpb25zIiwicG9sbGVyIiwic3RvcCIsImNoZWNrQ29ubmVjdGlvbiIsImNvbm5lY3Rpb25DaGFuZ2VkIiwicHJvY2Vzc1Jlc3BvbnNlcyIsImJlc3RDb25uZWN0aW9uIiwiZ2V0QmVzdEF2YWlsYWJsZUNvbm5lY3Rpb24iLCJjaGVja0Nvbm5lY3Rpb25zIiwiY2hlY2tDb25uZWN0aW9uc0F1eCIsImNoZWNrQ29ubmVjdGlvblByb21pc2VzIiwiY2hlY2tQcm9taXNlcyIsInBvb2wiLCJUaHJlYWRQb29sIiwic3VibWl0IiwiZXJyIiwiUHJvbWlzZSIsImFsbCIsInByaW9yaXRpemVkQ29ubmVjdGlvbnMiLCJnZXRDb25uZWN0aW9uc0luQXNjZW5kaW5nUHJpb3JpdHkiLCJ0aGF0IiwiYXJyYXlDb250YWlucyIsInJlc29sdmUiLCJyZWplY3QiLCJmaXJzdEF2YWlsYWJsZSIsImFueSIsIkFnZ3JlZ2F0ZUVycm9yIiwiZ2V0QXV0b1N3aXRjaCIsImdldFRpbWVvdXQiLCJnZXRQZWVyQ29ubmVjdGlvbnMiLCJkaXNjb25uZWN0IiwiY2xlYXIiLCJyZXNldCIsInByb21pc2VzIiwiY29ubmVjdGlvblByaW9yaXRpZXMiLCJoYXMiLCJnZXRQcmlvcml0eSIsInNldCIsImdldCIsImFzY2VuZGluZ1ByaW9yaXRpZXMiLCJhIiwiYiIsInBhcnNlSW50IiwiYXNjZW5kaW5nUHJpb3JpdGllc0xpc3QiLCJwcmlvcml0eUNvbm5lY3Rpb25zIiwidmFsdWVzIiwiYzEiLCJjMiIsImdldElzT25saW5lIiwibG9jYWxlQ29tcGFyZSIsImNvbXBhcmVQcmlvcml0aWVzIiwicDEiLCJwMiIsIlRhc2tMb29wZXIiLCJjb25zb2xlIiwibG9nIiwic3RhcnQiLCJjaGVja1ByaW9yaXRpemVkQ29ubmVjdGlvbnMiLCJjaGFuZ2UiLCJyZXNwb25zZXMiLCJmb3JFYWNoIiwidGltZXMiLCJ1bnNoaWZ0IiwiZ2V0UmVzcG9uc2VUaW1lIiwicG9wIiwidXBkYXRlQmVzdENvbm5lY3Rpb25JblByaW9yaXR5IiwiYmVzdENvbm5lY3Rpb25Gcm9tUmVzcG9uc2VzIiwiZ2V0QmVzdENvbm5lY3Rpb25Gcm9tUHJpb3JpdGl6ZWRSZXNwb25zZXMiLCJiZXN0UmVzcG9uc2UiLCJiZXR0ZXIiLCJpIiwiZXhwb3J0cyIsImRlZmF1bHQiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy9jb21tb24vTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEdlblV0aWxzIGZyb20gXCIuL0dlblV0aWxzXCI7XG5pbXBvcnQgVGFza0xvb3BlciBmcm9tIFwiLi9UYXNrTG9vcGVyXCI7XG5pbXBvcnQgVGhyZWFkUG9vbCBmcm9tIFwiLi9UaHJlYWRQb29sXCI7XG5pbXBvcnQgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lciBmcm9tIFwiLi9Nb25lcm9Db25uZWN0aW9uTWFuYWdlckxpc3RlbmVyXCI7XG5pbXBvcnQgTW9uZXJvRXJyb3IgZnJvbSBcIi4vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBNb25lcm9ScGNDb25uZWN0aW9uIGZyb20gXCIuL01vbmVyb1JwY0Nvbm5lY3Rpb25cIjtcblxuLyoqXG4gKiA8cD5NYW5hZ2VzIGEgY29sbGVjdGlvbiBvZiBwcmlvcml0aXplZCBjb25uZWN0aW9ucyB0byBkYWVtb24gb3Igd2FsbGV0IFJQQyBlbmRwb2ludHMuPC9wPlxuICpcbiAqIDxwPkV4YW1wbGUgdXNhZ2U6PC9wPlxuICogXG4gKiA8Y29kZT5cbiAqIC8vIGltcG9ydHM8YnI+XG4gKiBpbXBvcnQgeyBNb25lcm9ScGNDb25uZWN0aW9uLCBNb25lcm9Db25uZWN0aW9uTWFuYWdlciwgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lciB9IGZyb20gXCJtb25lcm8tdHNcIjs8YnI+XG4gKiA8YnI+XG4gKiAvLyBjcmVhdGUgY29ubmVjdGlvbiBtYW5hZ2VyPGJyPlxuICogbGV0IGNvbm5lY3Rpb25NYW5hZ2VyID0gbmV3IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyKCk7PGJyPlxuICogPGJyPlxuICogLy8gYWRkIG1hbmFnZWQgY29ubmVjdGlvbnMgd2l0aCBwcmlvcml0aWVzPGJyPlxuICogYXdhaXQgY29ubmVjdGlvbk1hbmFnZXIuYWRkQ29ubmVjdGlvbih7dXJpOiBcImh0dHA6Ly9sb2NhbGhvc3Q6MzgwODFcIiwgcHJpb3JpdHk6IDF9KTsgLy8gdXNlIGxvY2FsaG9zdCBhcyBmaXJzdCBwcmlvcml0eTxicj5cbiAqIGF3YWl0IGNvbm5lY3Rpb25NYW5hZ2VyLmFkZENvbm5lY3Rpb24oe3VyaTogXCJodHRwOi8vZXhhbXBsZS5jb21cIn0pOyAvLyBkZWZhdWx0IHByaW9yaXR5IGlzIHByaW9yaXRpemVkIGxhc3Q8YnI+XG4gKiA8YnI+XG4gKiAvLyBzZXQgY3VycmVudCBjb25uZWN0aW9uPGJyPlxuICogYXdhaXQgY29ubmVjdGlvbk1hbmFnZXIuc2V0Q29ubmVjdGlvbih7dXJpOiBcImh0dHA6Ly9mb28uYmFyXCIsIHVzZXJuYW1lOiBcImFkbWluXCIsIHBhc3N3b3JkOiBcInBhc3N3b3JkXCJ9KTsgLy8gY29ubmVjdGlvbiBpcyBhZGRlZCBpZiBuZXc8YnI+XG4gKiA8YnI+XG4gKiAvLyBjaGVjayBjb25uZWN0aW9uIHN0YXR1czxicj5cbiAqIGF3YWl0IGNvbm5lY3Rpb25NYW5hZ2VyLmNoZWNrQ29ubmVjdGlvbigpOzxicj5cbiAqIGNvbnNvbGUubG9nKFwiQ29ubmVjdGlvbiBtYW5hZ2VyIGlzIGNvbm5lY3RlZDogXCIgKyBjb25uZWN0aW9uTWFuYWdlci5pc0Nvbm5lY3RlZCgpKTs8YnI+XG4gKiBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb24gaXMgb25saW5lOiBcIiArIGNvbm5lY3Rpb25NYW5hZ2VyLmdldENvbm5lY3Rpb24oKS5nZXRJc09ubGluZSgpKTs8YnI+XG4gKiBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb24gaXMgYXV0aGVudGljYXRlZDogXCIgKyBjb25uZWN0aW9uTWFuYWdlci5nZXRDb25uZWN0aW9uKCkuZ2V0SXNBdXRoZW50aWNhdGVkKCkpOzxicj5cbiAqIDxicj4gXG4gKiAvLyByZWNlaXZlIG5vdGlmaWNhdGlvbnMgb2YgYW55IGNoYW5nZXMgdG8gY3VycmVudCBjb25uZWN0aW9uPGJyPlxuICogY29ubmVjdGlvbk1hbmFnZXIuYWRkTGlzdGVuZXIobmV3IGNsYXNzIGV4dGVuZHMgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lciB7PGJyPlxuICogJm5ic3A7Jm5ic3A7IGFzeW5jIG9uQ29ubmVjdGlvbkNoYW5nZWQoY29ubmVjdGlvbikgezxicj5cbiAqICZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwOyBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb24gY2hhbmdlZCB0bzogXCIgKyBjb25uZWN0aW9uKTs8YnI+XG4gKiAmbmJzcDsmbmJzcDsgfTxicj5cbiAqIH0pOzxicj5cbiAqIDxicj5cbiAqIC8vIHN0YXJ0IHBvbGxpbmcgZm9yIGJlc3QgY29ubmVjdGlvbiBldmVyeSAxMCBzZWNvbmRzIGFuZCBhdXRvbWF0aWNhbGx5IHN3aXRjaDxicj5cbiAqIGNvbm5lY3Rpb25NYW5hZ2VyLnN0YXJ0UG9sbGluZygxMDAwMCk7PGJyPlxuICogPGJyPlxuICogLy8gYXV0b21hdGljYWxseSBzd2l0Y2ggdG8gYmVzdCBhdmFpbGFibGUgY29ubmVjdGlvbiBpZiBkaXNjb25uZWN0ZWQ8YnI+XG4gKiBjb25uZWN0aW9uTWFuYWdlci5zZXRBdXRvU3dpdGNoKHRydWUpOzxicj5cbiAqIDxicj5cbiAqIC8vIGdldCBiZXN0IGF2YWlsYWJsZSBjb25uZWN0aW9uIGluIG9yZGVyIG9mIHByaW9yaXR5IHRoZW4gcmVzcG9uc2UgdGltZTxicj5cbiAqIGxldCBiZXN0Q29ubmVjdGlvbiA9IGF3YWl0IGNvbm5lY3Rpb25NYW5hZ2VyLmdldEJlc3RBdmFpbGFibGVDb25uZWN0aW9uKCk7PGJyPlxuICogPGJyPlxuICogLy8gY2hlY2sgc3RhdHVzIG9mIGFsbCBjb25uZWN0aW9uczxicj5cbiAqIGF3YWl0IGNvbm5lY3Rpb25NYW5hZ2VyLmNoZWNrQ29ubmVjdGlvbnMoKTs8YnI+XG4gKiA8YnI+XG4gKiAvLyBnZXQgY29ubmVjdGlvbnMgaW4gb3JkZXIgb2YgY3VycmVudCBjb25uZWN0aW9uLCBvbmxpbmUgc3RhdHVzIGZyb20gbGFzdCBjaGVjaywgcHJpb3JpdHksIGFuZCBuYW1lPGJyPlxuICogbGV0IGNvbm5lY3Rpb25zID0gY29ubmVjdGlvbk1hbmFnZXIuZ2V0Q29ubmVjdGlvbnMoKTs8YnI+XG4gKiA8YnI+XG4gKiAvLyBjbGVhciBjb25uZWN0aW9uIG1hbmFnZXI8YnI+XG4gKiBjb25uZWN0aW9uTWFuYWdlci5jbGVhcigpO1xuICogPC9jb2RlPlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNb25lcm9Db25uZWN0aW9uTWFuYWdlciB7XG5cbiAgLy8gc3RhdGljIHZhcmlhYmxlc1xuICBzdGF0aWMgREVGQVVMVF9USU1FT1VUID0gNTAwMDtcbiAgc3RhdGljIERFRkFVTFRfUE9MTF9QRVJJT0QgPSAyMDAwMDtcbiAgc3RhdGljIERFRkFVTFRfQVVUT19TV0lUQ0ggPSB0cnVlO1xuICBzdGF0aWMgTUlOX0JFVFRFUl9SRVNQT05TRVMgPSAzO1xuXG4gIC8vIGluc3RhbmNlIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgcHJveHlUb1dvcmtlcjogYW55O1xuICBwcm90ZWN0ZWQgdGltZW91dE1zOiBhbnk7XG4gIHByb3RlY3RlZCBhdXRvU3dpdGNoOiBhbnk7XG4gIHByb3RlY3RlZCBjb25uZWN0aW9uczogYW55O1xuICBwcm90ZWN0ZWQgcmVzcG9uc2VUaW1lczogYW55O1xuICBwcm90ZWN0ZWQgbGlzdGVuZXJzOiBhbnk7XG4gIHByb3RlY3RlZCBjdXJyZW50Q29ubmVjdGlvbjogYW55O1xuICBwcm90ZWN0ZWQgcG9sbGVyOiBhbnk7XG5cbiAgLyoqXG4gICAqIFNwZWNpZnkgYmVoYXZpb3Igd2hlbiBwb2xsaW5nLlxuICAgKiBcbiAgICogT25lIG9mIFBSSU9SSVRJWkVEIChwb2xsIGNvbm5lY3Rpb25zIGluIG9yZGVyIG9mIHByaW9yaXR5IHVudGlsIGNvbm5lY3RlZDsgZGVmYXVsdCksIENVUlJFTlQgKHBvbGwgY3VycmVudCBjb25uZWN0aW9uKSwgb3IgQUxMIChwb2xsIGFsbCBjb25uZWN0aW9ucykuXG4gICAqL1xuICBzdGF0aWMgUG9sbFR5cGUgPSB7XG4gICAgUFJJT1JJVElaRUQ6IDAsXG4gICAgQ1VSUkVOVDogMSxcbiAgICBBTEw6IDJcbiAgfVxuICBcbiAgLyoqXG4gICAqIENvbnN0cnVjdCBhIGNvbm5lY3Rpb24gbWFuYWdlci5cbiAgICogXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3Byb3h5VG9Xb3JrZXJdIC0gY29uZmlndXJlIGFsbCBjb25uZWN0aW9ucyB0byBwcm94eSB0byB3b3JrZXIgKGRlZmF1bHQgdHJ1ZSlcbiAgICovXG4gIGNvbnN0cnVjdG9yKHByb3h5VG9Xb3JrZXIgPSB0cnVlKSB7XG4gICAgdGhpcy5wcm94eVRvV29ya2VyID0gcHJveHlUb1dvcmtlciAhPT0gZmFsc2U7XG4gICAgdGhpcy50aW1lb3V0TXMgPSBNb25lcm9Db25uZWN0aW9uTWFuYWdlci5ERUZBVUxUX1RJTUVPVVQ7XG4gICAgdGhpcy5hdXRvU3dpdGNoID0gTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIuREVGQVVMVF9BVVRPX1NXSVRDSDtcbiAgICB0aGlzLmNvbm5lY3Rpb25zID0gW107XG4gICAgdGhpcy5yZXNwb25zZVRpbWVzID0gbmV3IE1hcCgpO1xuICAgIHRoaXMubGlzdGVuZXJzID0gW107XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBBZGQgYSBsaXN0ZW5lciB0byByZWNlaXZlIG5vdGlmaWNhdGlvbnMgd2hlbiB0aGUgY29ubmVjdGlvbiBjaGFuZ2VzLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9Db25uZWN0aW9uTWFuYWdlckxpc3RlbmVyfSBsaXN0ZW5lciAtIHRoZSBsaXN0ZW5lciB0byBhZGRcbiAgICogQHJldHVybiB7TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJ9IHRoaXMgY29ubmVjdGlvbiBtYW5hZ2VyIGZvciBjaGFpbmluZ1xuICAgKi9cbiAgYWRkTGlzdGVuZXIobGlzdGVuZXI6IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIpOiBNb25lcm9Db25uZWN0aW9uTWFuYWdlciB7XG4gICAgdGhpcy5saXN0ZW5lcnMucHVzaChsaXN0ZW5lcik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZW1vdmUgYSBsaXN0ZW5lci5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lcn0gbGlzdGVuZXIgLSB0aGUgbGlzdGVuZXIgdG8gcmVtb3ZlXG4gICAqIEByZXR1cm4ge01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyfSB0aGlzIGNvbm5lY3Rpb24gbWFuYWdlciBmb3IgY2hhaW5pbmdcbiAgICovXG4gIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyOiBNb25lcm9Db25uZWN0aW9uTWFuYWdlckxpc3RlbmVyKTogTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIge1xuICAgIGlmICghR2VuVXRpbHMucmVtb3ZlKHRoaXMubGlzdGVuZXJzLCBsaXN0ZW5lcikpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk1vbmVybyBjb25uZWN0aW9uIG1hbmFnZXIgZG9lcyBub3QgY29udGFpbiBsaXN0ZW5lciB0byByZW1vdmVcIik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZW1vdmUgYWxsIGxpc3RlbmVycy5cbiAgICogXG4gICAqIEByZXR1cm4ge01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyfSB0aGlzIGNvbm5lY3Rpb24gbWFuYWdlciBmb3IgY2hhaW5pbmdcbiAgICovXG4gIHJlbW92ZUxpc3RlbmVycygpOiBNb25lcm9Db25uZWN0aW9uTWFuYWdlciB7XG4gICAgdGhpcy5saXN0ZW5lcnMuc3BsaWNlKDAsIHRoaXMubGlzdGVuZXJzLmxlbmd0aCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGFsbCBsaXN0ZW5lcnMuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtNb25lcm9Db25uZWN0aW9uTWFuYWdlckxpc3RlbmVyW119IGFsbCBsaXN0ZW5lcnNcbiAgICovXG4gIGdldExpc3RlbmVycygpOiBNb25lcm9Db25uZWN0aW9uTWFuYWdlckxpc3RlbmVyW10ge1xuICAgIHJldHVybiB0aGlzLmxpc3RlbmVyc1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBhIGNvbm5lY3Rpb24uIFRoZSBjb25uZWN0aW9uIG1heSBoYXZlIGFuIGVsZXZhdGVkIHByaW9yaXR5IGZvciB0aGlzIG1hbmFnZXIgdG8gdXNlLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd8UGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPn0gdXJpT3JDb25uZWN0aW9uIC0gdXJpIG9yIGNvbm5lY3Rpb24gdG8gYWRkXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXI+fSB0aGlzIGNvbm5lY3Rpb24gbWFuYWdlciBmb3IgY2hhaW5pbmdcbiAgICovXG4gIGFzeW5jIGFkZENvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+KTogUHJvbWlzZTxNb25lcm9Db25uZWN0aW9uTWFuYWdlcj4ge1xuICAgIGxldCBjb25uZWN0aW9uID0gdXJpT3JDb25uZWN0aW9uIGluc3RhbmNlb2YgTW9uZXJvUnBjQ29ubmVjdGlvbiA/IHVyaU9yQ29ubmVjdGlvbiA6IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHVyaU9yQ29ubmVjdGlvbik7XG4gICAgZm9yIChsZXQgYUNvbm5lY3Rpb24gb2YgdGhpcy5jb25uZWN0aW9ucykge1xuICAgICAgaWYgKGFDb25uZWN0aW9uLmdldFVyaSgpID09PSBjb25uZWN0aW9uLmdldFVyaSgpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDb25uZWN0aW9uIFVSSSBhbHJlYWR5IGV4aXN0c1wiKTtcbiAgICB9XG4gICAgaWYgKHRoaXMucHJveHlUb1dvcmtlciAhPT0gdW5kZWZpbmVkKSBjb25uZWN0aW9uLnNldFByb3h5VG9Xb3JrZXIodGhpcy5wcm94eVRvV29ya2VyKTtcbiAgICB0aGlzLmNvbm5lY3Rpb25zLnB1c2goY29ubmVjdGlvbik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZW1vdmUgYSBjb25uZWN0aW9uLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVyaSAtIG9mIHRoZSB0aGUgY29ubmVjdGlvbiB0byByZW1vdmVcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9Db25uZWN0aW9uTWFuYWdlcj59IHRoaXMgY29ubmVjdGlvbiBtYW5hZ2VyIGZvciBjaGFpbmluZ1xuICAgKi9cbiAgYXN5bmMgcmVtb3ZlQ29ubmVjdGlvbih1cmk6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXI+IHtcbiAgICBsZXQgY29ubmVjdGlvbiA9IHRoaXMuZ2V0Q29ubmVjdGlvbkJ5VXJpKHVyaSk7XG4gICAgaWYgKCFjb25uZWN0aW9uKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJObyBjb25uZWN0aW9uIGV4aXN0cyB3aXRoIFVSSTogXCIgKyB1cmkpO1xuICAgIEdlblV0aWxzLnJlbW92ZSh0aGlzLmNvbm5lY3Rpb25zLCBjb25uZWN0aW9uKTtcbiAgICB0aGlzLnJlc3BvbnNlVGltZXMuZGVsZXRlKGNvbm5lY3Rpb24uZ2V0VXJpKCkpO1xuICAgIGlmIChjb25uZWN0aW9uID09PSB0aGlzLmN1cnJlbnRDb25uZWN0aW9uKSB7XG4gICAgICB0aGlzLmN1cnJlbnRDb25uZWN0aW9uID0gdW5kZWZpbmVkO1xuICAgICAgYXdhaXQgdGhpcy5vbkNvbm5lY3Rpb25DaGFuZ2VkKHRoaXMuY3VycmVudENvbm5lY3Rpb24pO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNldCB0aGUgY3VycmVudCBjb25uZWN0aW9uLlxuICAgKiBQcm92aWRlIGEgVVJJIHRvIHNlbGVjdCBhbiBleGlzdGluZyBjb25uZWN0aW9uIHdpdGhvdXQgdXBkYXRpbmcgaXRzIGNyZWRlbnRpYWxzLlxuICAgKiBQcm92aWRlIGEgTW9uZXJvUnBjQ29ubmVjdGlvbiB0byBhZGQgbmV3IGNvbm5lY3Rpb24gb3IgcmVwbGFjZSBleGlzdGluZyBjb25uZWN0aW9uIHdpdGggdGhlIHNhbWUgVVJJLlxuICAgKiBOb3RpZnkgaWYgY3VycmVudCBjb25uZWN0aW9uIGNoYW5nZXMuXG4gICAqIERvZXMgbm90IGNoZWNrIHRoZSBjb25uZWN0aW9uLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd8UGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPn0gW3VyaU9yQ29ubmVjdGlvbl0gLSBpcyB0aGUgdXJpIG9mIHRoZSBjb25uZWN0aW9uIG9yIHRoZSBjb25uZWN0aW9uIHRvIG1ha2UgY3VycmVudCAoZGVmYXVsdCB1bmRlZmluZWQgZm9yIG5vIGN1cnJlbnQgY29ubmVjdGlvbilcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9Db25uZWN0aW9uTWFuYWdlcj59IHRoaXMgY29ubmVjdGlvbiBtYW5hZ2VyIGZvciBjaGFpbmluZ1xuICAgKi9cbiAgYXN5bmMgc2V0Q29ubmVjdGlvbih1cmlPckNvbm5lY3Rpb24/OiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+KTogUHJvbWlzZTxNb25lcm9Db25uZWN0aW9uTWFuYWdlcj4ge1xuICAgIFxuICAgIC8vIGhhbmRsZSB1cmlcbiAgICBpZiAodXJpT3JDb25uZWN0aW9uICYmIHR5cGVvZiB1cmlPckNvbm5lY3Rpb24gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGxldCBjb25uZWN0aW9uID0gdGhpcy5nZXRDb25uZWN0aW9uQnlVcmkodXJpT3JDb25uZWN0aW9uKTtcbiAgICAgIHJldHVybiB0aGlzLnNldENvbm5lY3Rpb24oY29ubmVjdGlvbiA9PT0gdW5kZWZpbmVkID8gbmV3IE1vbmVyb1JwY0Nvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uKSA6IGNvbm5lY3Rpb24pO1xuICAgIH1cbiAgICBcbiAgICAvLyBoYW5kbGUgY29ubmVjdGlvblxuICAgIGxldCBjb25uZWN0aW9uID0gdXJpT3JDb25uZWN0aW9uO1xuICAgIGlmICh0aGlzLmN1cnJlbnRDb25uZWN0aW9uID09PSBjb25uZWN0aW9uKSByZXR1cm4gdGhpcztcbiAgICBcbiAgICAvLyBjaGVjayBpZiBzZXR0aW5nIHVuZGVmaW5lZCBjb25uZWN0aW9uXG4gICAgaWYgKCFjb25uZWN0aW9uKSB7XG4gICAgICB0aGlzLmN1cnJlbnRDb25uZWN0aW9uID0gdW5kZWZpbmVkO1xuICAgICAgYXdhaXQgdGhpcy5vbkNvbm5lY3Rpb25DaGFuZ2VkKHVuZGVmaW5lZCk7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgY29ubmVjdGlvblxuICAgIGlmICghKGNvbm5lY3Rpb24gaW5zdGFuY2VvZiBNb25lcm9ScGNDb25uZWN0aW9uKSkgY29ubmVjdGlvbiA9IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKGNvbm5lY3Rpb24pO1xuICAgIGlmICghY29ubmVjdGlvbi5nZXRVcmkoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ29ubmVjdGlvbiBpcyBtaXNzaW5nIFVSSVwiKTtcblxuICAgIC8vIGFkZCBvciByZXBsYWNlIGNvbm5lY3Rpb25cbiAgICBsZXQgcHJldkNvbm5lY3Rpb24gPSB0aGlzLmdldENvbm5lY3Rpb25CeVVyaShjb25uZWN0aW9uLmdldFVyaSgpKTtcbiAgICBpZiAocHJldkNvbm5lY3Rpb24pIEdlblV0aWxzLnJlbW92ZSh0aGlzLmNvbm5lY3Rpb25zLCBwcmV2Q29ubmVjdGlvbik7XG4gICAgYXdhaXQgdGhpcy5hZGRDb25uZWN0aW9uKGNvbm5lY3Rpb24pO1xuICAgIHRoaXMuY3VycmVudENvbm5lY3Rpb24gPSBjb25uZWN0aW9uO1xuICAgIGF3YWl0IHRoaXMub25Db25uZWN0aW9uQ2hhbmdlZCh0aGlzLmN1cnJlbnRDb25uZWN0aW9uKTtcbiAgICBcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGN1cnJlbnQgY29ubmVjdGlvbi5cbiAgICogXG4gICAqIEByZXR1cm4ge01vbmVyb1JwY0Nvbm5lY3Rpb259IHRoZSBjdXJyZW50IGNvbm5lY3Rpb24gb3IgdW5kZWZpbmVkIGlmIG5vIGNvbm5lY3Rpb24gc2V0XG4gICAqL1xuICBnZXRDb25uZWN0aW9uKCk6IE1vbmVyb1JwY0Nvbm5lY3Rpb24ge1xuICAgIHJldHVybiB0aGlzLmN1cnJlbnRDb25uZWN0aW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGlzIG1hbmFnZXIgaGFzIGEgY29ubmVjdGlvbiB3aXRoIHRoZSBnaXZlbiBVUkkuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXJpIFVSSSBvZiB0aGUgY29ubmVjdGlvbiB0byBjaGVja1xuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIHRoaXMgbWFuYWdlciBoYXMgYSBjb25uZWN0aW9uIHdpdGggdGhlIGdpdmVuIFVSSSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBoYXNDb25uZWN0aW9uKHVyaTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0Q29ubmVjdGlvbkJ5VXJpKHVyaSkgIT09IHVuZGVmaW5lZDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhIGNvbm5lY3Rpb24gYnkgVVJJLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVyaSBpcyB0aGUgVVJJIG9mIHRoZSBjb25uZWN0aW9uIHRvIGdldFxuICAgKiBAcmV0dXJuIHtNb25lcm9ScGNDb25uZWN0aW9ufSB0aGUgY29ubmVjdGlvbiB3aXRoIHRoZSBVUkkgb3IgdW5kZWZpbmVkIGlmIG5vIGNvbm5lY3Rpb24gd2l0aCB0aGUgVVJJIGV4aXN0c1xuICAgKi9cbiAgZ2V0Q29ubmVjdGlvbkJ5VXJpKHVyaTogc3RyaW5nKTogTW9uZXJvUnBjQ29ubmVjdGlvbiB7XG4gICAgZm9yIChsZXQgY29ubmVjdGlvbiBvZiB0aGlzLmNvbm5lY3Rpb25zKSBpZiAoY29ubmVjdGlvbi5nZXRVcmkoKSA9PT0gdXJpKSByZXR1cm4gY29ubmVjdGlvbjtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGFsbCBjb25uZWN0aW9ucyBpbiBvcmRlciBvZiBjdXJyZW50IGNvbm5lY3Rpb24gKGlmIGFwcGxpY2FibGUpLCBvbmxpbmUgc3RhdHVzLCBwcmlvcml0eSwgYW5kIG5hbWUuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtNb25lcm9ScGNDb25uZWN0aW9uW119IHRoZSBsaXN0IG9mIHNvcnRlZCBjb25uZWN0aW9uc1xuICAgKi9cbiAgZ2V0Q29ubmVjdGlvbnMoKTogTW9uZXJvUnBjQ29ubmVjdGlvbltdIHtcbiAgICBsZXQgc29ydGVkQ29ubmVjdGlvbnMgPSBHZW5VdGlscy5jb3B5QXJyYXkodGhpcy5jb25uZWN0aW9ucyk7XG4gICAgc29ydGVkQ29ubmVjdGlvbnMuc29ydCh0aGlzLmNvbXBhcmVDb25uZWN0aW9ucy5iaW5kKHRoaXMpKTtcbiAgICByZXR1cm4gc29ydGVkQ29ubmVjdGlvbnM7XG4gIH1cblxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSBjb25uZWN0aW9uIG1hbmFnZXIgaXMgY29ubmVjdGVkIHRvIGEgbm9kZS5cbiAgICogXG4gICAqIEByZXR1cm4ge2Jvb2xlYW58dW5kZWZpbmVkfSB0cnVlIGlmIHRoZSBjdXJyZW50IGNvbm5lY3Rpb24gaXMgc2V0LCBvbmxpbmUsIGFuZCBub3QgdW5hdXRoZW50aWNhdGVkLCB1bmRlZmluZWQgaWYgdW5rbm93biwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBpc0Nvbm5lY3RlZCgpOiBib29sZWFuIHwgdW5kZWZpbmVkIHtcbiAgICBpZiAoIXRoaXMuY3VycmVudENvbm5lY3Rpb24pIHJldHVybiBmYWxzZTtcbiAgICByZXR1cm4gdGhpcy5jdXJyZW50Q29ubmVjdGlvbi5pc0Nvbm5lY3RlZCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0YXJ0IHBvbGxpbmcgY29ubmVjdGlvbnMuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gW3BlcmlvZE1zXSBwb2xsIHBlcmlvZCBpbiBtaWxsaXNlY29uZHMgKGRlZmF1bHQgMjBzKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFthdXRvU3dpdGNoXSBzcGVjaWZpZXMgdG8gYXV0b21hdGljYWxseSBzd2l0Y2ggdG8gdGhlIGJlc3QgY29ubmVjdGlvbiAoZGVmYXVsdCB0cnVlIHVubGVzcyBjaGFuZ2VkKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3RpbWVvdXRNc10gc3BlY2lmaWVzIHRoZSB0aW1lb3V0IHRvIHBvbGwgYSBzaW5nbGUgY29ubmVjdGlvbiAoZGVmYXVsdCA1cyB1bmxlc3MgY2hhbmdlZClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtwb2xsVHlwZV0gb25lIG9mIFBSSU9SSVRJWkVEIChwb2xsIGNvbm5lY3Rpb25zIGluIG9yZGVyIG9mIHByaW9yaXR5IHVudGlsIGNvbm5lY3RlZDsgZGVmYXVsdCksIENVUlJFTlQgKHBvbGwgY3VycmVudCBjb25uZWN0aW9uKSwgb3IgQUxMIChwb2xsIGFsbCBjb25uZWN0aW9ucylcbiAgICogQHBhcmFtIHtNb25lcm9ScGNDb25uZWN0aW9uW119IFtleGNsdWRlZENvbm5lY3Rpb25zXSBjb25uZWN0aW9ucyBleGNsdWRlZCBmcm9tIGJlaW5nIHBvbGxlZFxuICAgKiBAcmV0dXJuIHtNb25lcm9Db25uZWN0aW9uTWFuYWdlcn0gdGhpcyBjb25uZWN0aW9uIG1hbmFnZXIgZm9yIGNoYWluaW5nXG4gICAqL1xuICBzdGFydFBvbGxpbmcocGVyaW9kTXM/OiBudW1iZXIsIGF1dG9Td2l0Y2g/OiBib29sZWFuLCB0aW1lb3V0TXM/OiBudW1iZXIsIHBvbGxUeXBlPzogbnVtYmVyLCBleGNsdWRlZENvbm5lY3Rpb25zPzogTW9uZXJvUnBjQ29ubmVjdGlvbltdKTogTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIge1xuXG4gICAgLy8gYXBwbHkgZGVmYXVsdHNcbiAgICBpZiAocGVyaW9kTXMgPT0gdW5kZWZpbmVkKSBwZXJpb2RNcyA9IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyLkRFRkFVTFRfUE9MTF9QRVJJT0Q7XG4gICAgaWYgKGF1dG9Td2l0Y2ggIT09IHVuZGVmaW5lZCkgdGhpcy5zZXRBdXRvU3dpdGNoKGF1dG9Td2l0Y2gpO1xuICAgIGlmICh0aW1lb3V0TXMgIT09IHVuZGVmaW5lZCkgdGhpcy5zZXRUaW1lb3V0KHRpbWVvdXRNcyk7XG4gICAgaWYgKHBvbGxUeXBlID09PSB1bmRlZmluZWQpIHBvbGxUeXBlID0gTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIuUG9sbFR5cGUuUFJJT1JJVElaRUQ7XG5cbiAgICAvLyBzdG9wIHBvbGxpbmdcbiAgICB0aGlzLnN0b3BQb2xsaW5nKCk7XG5cbiAgICAvLyBzdGFydCBwb2xsaW5nXG4gICAgc3dpdGNoIChwb2xsVHlwZSkge1xuICAgICAgY2FzZSBNb25lcm9Db25uZWN0aW9uTWFuYWdlci5Qb2xsVHlwZS5DVVJSRU5UOlxuICAgICAgICB0aGlzLnN0YXJ0UG9sbGluZ0Nvbm5lY3Rpb24ocGVyaW9kTXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIuUG9sbFR5cGUuQUxMOlxuICAgICAgICB0aGlzLnN0YXJ0UG9sbGluZ0Nvbm5lY3Rpb25zKHBlcmlvZE1zKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyLlBvbGxUeXBlLlBSSU9SSVRJWkVEOlxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhpcy5zdGFydFBvbGxpbmdQcmlvcml0aXplZENvbm5lY3Rpb25zKHBlcmlvZE1zLCBleGNsdWRlZENvbm5lY3Rpb25zKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogU3RvcCBwb2xsaW5nIGNvbm5lY3Rpb25zLlxuICAgKiBcbiAgICogQHJldHVybiB7TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJ9IHRoaXMgY29ubmVjdGlvbiBtYW5hZ2VyIGZvciBjaGFpbmluZ1xuICAgKi9cbiAgc3RvcFBvbGxpbmcoKTogTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIge1xuICAgIGlmICh0aGlzLnBvbGxlcikgdGhpcy5wb2xsZXIuc3RvcCgpO1xuICAgIHRoaXMucG9sbGVyID0gdW5kZWZpbmVkO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIHRoZSBjdXJyZW50IGNvbm5lY3Rpb24uIElmIGRpc2Nvbm5lY3RlZCBhbmQgYXV0byBzd2l0Y2ggZW5hYmxlZCwgc3dpdGNoZXMgdG8gYmVzdCBhdmFpbGFibGUgY29ubmVjdGlvbi5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXI+fSB0aGlzIGNvbm5lY3Rpb24gbWFuYWdlciBmb3IgY2hhaW5pbmdcbiAgICovXG4gIGFzeW5jIGNoZWNrQ29ubmVjdGlvbigpOiBQcm9taXNlPE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyPiB7XG4gICAgbGV0IGNvbm5lY3Rpb25DaGFuZ2VkID0gZmFsc2U7XG4gICAgbGV0IGNvbm5lY3Rpb24gPSB0aGlzLmdldENvbm5lY3Rpb24oKTtcbiAgICBpZiAoY29ubmVjdGlvbikge1xuICAgICAgaWYgKGF3YWl0IGNvbm5lY3Rpb24uY2hlY2tDb25uZWN0aW9uKHRoaXMudGltZW91dE1zKSkgY29ubmVjdGlvbkNoYW5nZWQgPSB0cnVlO1xuICAgICAgYXdhaXQgdGhpcy5wcm9jZXNzUmVzcG9uc2VzKFtjb25uZWN0aW9uXSk7XG4gICAgfVxuICAgIGlmICh0aGlzLmF1dG9Td2l0Y2ggJiYgIXRoaXMuaXNDb25uZWN0ZWQoKSkge1xuICAgICAgbGV0IGJlc3RDb25uZWN0aW9uID0gYXdhaXQgdGhpcy5nZXRCZXN0QXZhaWxhYmxlQ29ubmVjdGlvbihbY29ubmVjdGlvbl0pO1xuICAgICAgaWYgKGJlc3RDb25uZWN0aW9uKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuc2V0Q29ubmVjdGlvbihiZXN0Q29ubmVjdGlvbik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoY29ubmVjdGlvbkNoYW5nZWQpIGF3YWl0IHRoaXMub25Db25uZWN0aW9uQ2hhbmdlZChjb25uZWN0aW9uKTsgICBcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIENoZWNrIGFsbCBtYW5hZ2VkIGNvbm5lY3Rpb25zLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9Db25uZWN0aW9uTWFuYWdlcj59IHRoaXMgY29ubmVjdGlvbiBtYW5hZ2VyIGZvciBjaGFpbmluZ1xuICAgKi9cbiAgYXN5bmMgY2hlY2tDb25uZWN0aW9ucygpOiBQcm9taXNlPE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyPiB7XG4gICAgYXdhaXQgdGhpcy5jaGVja0Nvbm5lY3Rpb25zQXV4KHRoaXMuZ2V0Q29ubmVjdGlvbnMoKSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgYWxsIG1hbmFnZWQgY29ubmVjdGlvbnMsIHJldHVybmluZyBhIHByb21pc2UgZm9yIGVhY2ggY29ubmVjdGlvbiBjaGVjay5cbiAgICogRG9lcyBub3QgYXV0byBzd2l0Y2ggaWYgZGlzY29ubmVjdGVkLlxuICAgKlxuICAgKiBAcmV0dXJuIHtQcm9taXNlW119IGEgcHJvbWlzZSBmb3IgZWFjaCBjb25uZWN0aW9uIGluIHRoZSBvcmRlciBvZiBnZXRDb25uZWN0aW9ucygpLlxuICAgKi9cbiAgY2hlY2tDb25uZWN0aW9uUHJvbWlzZXMoKTogUHJvbWlzZTx2b2lkPltdIHtcbiAgICBsZXQgY2hlY2tQcm9taXNlcyA9IFtdO1xuICAgIGxldCBwb29sID0gbmV3IFRocmVhZFBvb2wodGhpcy5jb25uZWN0aW9ucy5sZW5ndGgpO1xuICAgIGZvciAobGV0IGNvbm5lY3Rpb24gb2YgdGhpcy5nZXRDb25uZWN0aW9ucygpKSB7XG4gICAgICBjaGVja1Byb21pc2VzLnB1c2gocG9vbC5zdWJtaXQoYXN5bmMgKCkgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmIChhd2FpdCBjb25uZWN0aW9uLmNoZWNrQ29ubmVjdGlvbih0aGlzLnRpbWVvdXRNcykgJiYgY29ubmVjdGlvbiA9PT0gdGhpcy5jdXJyZW50Q29ubmVjdGlvbikgYXdhaXQgdGhpcy5vbkNvbm5lY3Rpb25DaGFuZ2VkKGNvbm5lY3Rpb24pO1xuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAvLyBpZ25vcmUgZXJyb3JcbiAgICAgICAgfVxuICAgICAgfSkpO1xuICAgIH1cbiAgICBQcm9taXNlLmFsbChjaGVja1Byb21pc2VzKTtcbiAgICByZXR1cm4gY2hlY2tQcm9taXNlcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgYmVzdCBhdmFpbGFibGUgY29ubmVjdGlvbiBpbiBvcmRlciBvZiBwcmlvcml0eSB0aGVuIHJlc3BvbnNlIHRpbWUuXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1JwY0Nvbm5lY3Rpb25bXX0gW2V4Y2x1ZGVkQ29ubmVjdGlvbnNdIC0gY29ubmVjdGlvbnMgdG8gYmUgZXhjbHVkZWQgZnJvbSBjb25zaWRlcmF0aW9uIChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9ScGNDb25uZWN0aW9uPn0gdGhlIGJlc3QgYXZhaWxhYmxlIGNvbm5lY3Rpb24gaW4gb3JkZXIgb2YgcHJpb3JpdHkgdGhlbiByZXNwb25zZSB0aW1lLCB1bmRlZmluZWQgaWYgbm8gY29ubmVjdGlvbnMgYXZhaWxhYmxlXG4gICAqL1xuICBhc3luYyBnZXRCZXN0QXZhaWxhYmxlQ29ubmVjdGlvbihleGNsdWRlZENvbm5lY3Rpb25zPzogTW9uZXJvUnBjQ29ubmVjdGlvbltdKTogUHJvbWlzZTxNb25lcm9ScGNDb25uZWN0aW9uPiB7XG4gICAgXG4gICAgLy8gdHJ5IGNvbm5lY3Rpb25zIHdpdGhpbiBlYWNoIGFzY2VuZGluZyBwcmlvcml0eVxuICAgIGZvciAobGV0IHByaW9yaXRpemVkQ29ubmVjdGlvbnMgb2YgdGhpcy5nZXRDb25uZWN0aW9uc0luQXNjZW5kaW5nUHJpb3JpdHkoKSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgXG4gICAgICAgIC8vIGNyZWF0ZSBwcm9taXNlcyB0byBjaGVjayBjb25uZWN0aW9uc1xuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XG4gICAgICAgIGxldCBjaGVja1Byb21pc2VzID0gW107XG4gICAgICAgIGZvciAobGV0IGNvbm5lY3Rpb24gb2YgcHJpb3JpdGl6ZWRDb25uZWN0aW9ucykge1xuICAgICAgICAgIGlmIChleGNsdWRlZENvbm5lY3Rpb25zICYmIEdlblV0aWxzLmFycmF5Q29udGFpbnMoZXhjbHVkZWRDb25uZWN0aW9ucywgY29ubmVjdGlvbikpIGNvbnRpbnVlO1xuICAgICAgICAgIGNoZWNrUHJvbWlzZXMucHVzaChuZXcgUHJvbWlzZShhc3luYyBmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgIGF3YWl0IGNvbm5lY3Rpb24uY2hlY2tDb25uZWN0aW9uKHRoYXQudGltZW91dE1zKTtcbiAgICAgICAgICAgIGlmIChjb25uZWN0aW9uLmlzQ29ubmVjdGVkKCkpIHJlc29sdmUoY29ubmVjdGlvbik7XG4gICAgICAgICAgICBlbHNlIHJlamVjdCgpO1xuICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8gdXNlIGZpcnN0IGF2YWlsYWJsZSBjb25uZWN0aW9uXG4gICAgICAgIGxldCBmaXJzdEF2YWlsYWJsZSA9IGF3YWl0IFByb21pc2UuYW55KGNoZWNrUHJvbWlzZXMpO1xuICAgICAgICBpZiAoZmlyc3RBdmFpbGFibGUpIHJldHVybiBmaXJzdEF2YWlsYWJsZTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBpZiAoIShlcnIgaW5zdGFuY2VvZiBBZ2dyZWdhdGVFcnJvcikpIHRocm93IG5ldyBNb25lcm9FcnJvcihlcnIpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG4gIFxuICAvKipcbiAgICogQXV0b21hdGljYWxseSBzd2l0Y2ggdG8gdGhlIGJlc3QgYXZhaWxhYmxlIGNvbm5lY3Rpb24gYXMgY29ubmVjdGlvbnMgYXJlIHBvbGxlZCwgYmFzZWQgb24gcHJpb3JpdHksIHJlc3BvbnNlIHRpbWUsIGFuZCBjb25zaXN0ZW5jeS5cbiAgICogXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gYXV0b1N3aXRjaCBzcGVjaWZpZXMgaWYgdGhlIGNvbm5lY3Rpb24gc2hvdWxkIGF1dG8gc3dpdGNoIHRvIGEgYmV0dGVyIGNvbm5lY3Rpb25cbiAgICogQHJldHVybiB7TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJ9IHRoaXMgY29ubmVjdGlvbiBtYW5hZ2VyIGZvciBjaGFpbmluZ1xuICAgKi9cbiAgc2V0QXV0b1N3aXRjaChhdXRvU3dpdGNoOiBib29sZWFuKTogTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIge1xuICAgIHRoaXMuYXV0b1N3aXRjaCA9IGF1dG9Td2l0Y2g7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgaWYgYXV0byBzd2l0Y2ggaXMgZW5hYmxlZCBvciBkaXNhYmxlZC5cbiAgICogXG4gICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgYXV0byBzd2l0Y2ggZW5hYmxlZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBnZXRBdXRvU3dpdGNoKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmF1dG9Td2l0Y2g7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZXQgdGhlIG1heGltdW0gcmVxdWVzdCB0aW1lIGJlZm9yZSBpdHMgY29ubmVjdGlvbiBpcyBjb25zaWRlcmVkIG9mZmxpbmUuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gdGltZW91dE1zIC0gdGhlIHRpbWVvdXQgYmVmb3JlIHRoZSBjb25uZWN0aW9uIGlzIGNvbnNpZGVyZWQgb2ZmbGluZVxuICAgKiBAcmV0dXJuIHtNb25lcm9Db25uZWN0aW9uTWFuYWdlcn0gdGhpcyBjb25uZWN0aW9uIG1hbmFnZXIgZm9yIGNoYWluaW5nXG4gICAqL1xuICBzZXRUaW1lb3V0KHRpbWVvdXRNczogbnVtYmVyKTogTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIge1xuICAgIHRoaXMudGltZW91dE1zID0gdGltZW91dE1zO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSByZXF1ZXN0IHRpbWVvdXQuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtudW1iZXJ9IHRoZSByZXF1ZXN0IHRpbWVvdXQgYmVmb3JlIGEgY29ubmVjdGlvbiBpcyBjb25zaWRlcmVkIG9mZmxpbmVcbiAgICovXG4gIGdldFRpbWVvdXQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy50aW1lb3V0TXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb2xsZWN0IGNvbm5lY3RhYmxlIHBlZXJzIG9mIHRoZSBtYW5hZ2VkIGNvbm5lY3Rpb25zLlxuICAgKlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1JwY0Nvbm5lY3Rpb25bXT59IGNvbm5lY3RhYmxlIHBlZXJzXG4gICAqL1xuICBhc3luYyBnZXRQZWVyQ29ubmVjdGlvbnMoKTogUHJvbWlzZTxNb25lcm9ScGNDb25uZWN0aW9uW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEaXNjb25uZWN0IGZyb20gdGhlIGN1cnJlbnQgY29ubmVjdGlvbi5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXI+fSB0aGlzIGNvbm5lY3Rpb24gbWFuYWdlciBmb3IgY2hhaW5pbmdcbiAgICovXG4gIGFzeW5jIGRpc2Nvbm5lY3QoKTogUHJvbWlzZTxNb25lcm9Db25uZWN0aW9uTWFuYWdlcj4ge1xuICAgIGF3YWl0IHRoaXMuc2V0Q29ubmVjdGlvbih1bmRlZmluZWQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICAvKipcbiAgICogUmVtb3ZlIGFsbCBjb25uZWN0aW9ucy5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXI+fSB0aGlzIGNvbm5lY3Rpb24gbWFuYWdlciBmb3IgY2hhaW5pbmdcbiAgICovXG4gIGFzeW5jIGNsZWFyKCk6IFByb21pc2U8TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXI+IHtcbiAgICB0aGlzLmNvbm5lY3Rpb25zLnNwbGljZSgwLCB0aGlzLmNvbm5lY3Rpb25zLmxlbmd0aCk7XG4gICAgaWYgKHRoaXMuY3VycmVudENvbm5lY3Rpb24pIHtcbiAgICAgIHRoaXMuY3VycmVudENvbm5lY3Rpb24gPSB1bmRlZmluZWQ7XG4gICAgICBhd2FpdCB0aGlzLm9uQ29ubmVjdGlvbkNoYW5nZWQodW5kZWZpbmVkKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZXNldCB0byBkZWZhdWx0IHN0YXRlLlxuICAgKiBcbiAgICogQHJldHVybiB7TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJ9IHRoaXMgY29ubmVjdGlvbiBtYW5hZ2VyIGZvciBjaGFpbmluZ1xuICAgKi9cbiAgcmVzZXQoKTogTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXJzKCk7XG4gICAgdGhpcy5zdG9wUG9sbGluZygpO1xuICAgIHRoaXMuY2xlYXIoKTtcbiAgICB0aGlzLnRpbWVvdXRNcyA9IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyLkRFRkFVTFRfVElNRU9VVDtcbiAgICB0aGlzLmF1dG9Td2l0Y2ggPSBNb25lcm9Db25uZWN0aW9uTWFuYWdlci5ERUZBVUxUX0FVVE9fU1dJVENIO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFBSSVZBVEUgSEVMUEVSUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIHByb3RlY3RlZCBhc3luYyBvbkNvbm5lY3Rpb25DaGFuZ2VkKGNvbm5lY3Rpb24pIHtcbiAgICBsZXQgcHJvbWlzZXMgPSBbXTtcbiAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiB0aGlzLmxpc3RlbmVycykgcHJvbWlzZXMucHVzaChsaXN0ZW5lci5vbkNvbm5lY3Rpb25DaGFuZ2VkKGNvbm5lY3Rpb24pKTtcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgZ2V0Q29ubmVjdGlvbnNJbkFzY2VuZGluZ1ByaW9yaXR5KCkge1xuICAgIGxldCBjb25uZWN0aW9uUHJpb3JpdGllcyA9IG5ldyBNYXAoKTtcbiAgICBmb3IgKGxldCBjb25uZWN0aW9uIG9mIHRoaXMuY29ubmVjdGlvbnMpIHtcbiAgICAgIGlmICghY29ubmVjdGlvblByaW9yaXRpZXMuaGFzKGNvbm5lY3Rpb24uZ2V0UHJpb3JpdHkoKSkpIGNvbm5lY3Rpb25Qcmlvcml0aWVzLnNldChjb25uZWN0aW9uLmdldFByaW9yaXR5KCksIFtdKTtcbiAgICAgIGNvbm5lY3Rpb25Qcmlvcml0aWVzLmdldChjb25uZWN0aW9uLmdldFByaW9yaXR5KCkpLnB1c2goY29ubmVjdGlvbik7XG4gICAgfVxuICAgIGxldCBhc2NlbmRpbmdQcmlvcml0aWVzID0gbmV3IE1hcChbLi4uY29ubmVjdGlvblByaW9yaXRpZXNdLnNvcnQoKGEsIGIpID0+IHBhcnNlSW50KGFbMF0pIC0gcGFyc2VJbnQoYlswXSkpKTsgLy8gY3JlYXRlIG1hcCBpbiBhc2NlbmRpbmcgb3JkZXJcbiAgICBsZXQgYXNjZW5kaW5nUHJpb3JpdGllc0xpc3QgPSBbXTtcbiAgICBmb3IgKGxldCBwcmlvcml0eUNvbm5lY3Rpb25zIG9mIGFzY2VuZGluZ1ByaW9yaXRpZXMudmFsdWVzKCkpIGFzY2VuZGluZ1ByaW9yaXRpZXNMaXN0LnB1c2gocHJpb3JpdHlDb25uZWN0aW9ucyk7XG4gICAgaWYgKGNvbm5lY3Rpb25Qcmlvcml0aWVzLmhhcygwKSkgYXNjZW5kaW5nUHJpb3JpdGllc0xpc3QucHVzaChhc2NlbmRpbmdQcmlvcml0aWVzTGlzdC5zcGxpY2UoMCwgMSlbMF0pOyAvLyBtb3ZlIHByaW9yaXR5IDAgdG8gZW5kXG4gICAgcmV0dXJuIGFzY2VuZGluZ1ByaW9yaXRpZXNMaXN0O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgY29tcGFyZUNvbm5lY3Rpb25zKGMxLCBjMikge1xuICAgIFxuICAgICAgLy8gY3VycmVudCBjb25uZWN0aW9uIGlzIGZpcnN0XG4gICAgICBpZiAoYzEgPT09IHRoaXMuY3VycmVudENvbm5lY3Rpb24pIHJldHVybiAtMTtcbiAgICAgIGlmIChjMiA9PT0gdGhpcy5jdXJyZW50Q29ubmVjdGlvbikgcmV0dXJuIDE7XG4gICAgICBcbiAgICAgIC8vIG9yZGVyIGJ5IGF2YWlsYWJpbGl0eSB0aGVuIHByaW9yaXR5IHRoZW4gYnkgbmFtZVxuICAgICAgaWYgKGMxLmdldElzT25saW5lKCkgPT09IGMyLmdldElzT25saW5lKCkpIHtcbiAgICAgICAgaWYgKGMxLmdldFByaW9yaXR5KCkgPT09IGMyLmdldFByaW9yaXR5KCkpIHJldHVybiBjMS5nZXRVcmkoKS5sb2NhbGVDb21wYXJlKGMyLmdldFVyaSgpKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcGFyZVByaW9yaXRpZXMoYzEuZ2V0UHJpb3JpdHkoKSwgYzIuZ2V0UHJpb3JpdHkoKSkgKiAtMSAvLyBvcmRlciBieSBwcmlvcml0eSBpbiBkZXNjZW5kaW5nIG9yZGVyXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoYzEuZ2V0SXNPbmxpbmUoKSkgcmV0dXJuIC0xO1xuICAgICAgICBlbHNlIGlmIChjMi5nZXRJc09ubGluZSgpKSByZXR1cm4gMTtcbiAgICAgICAgZWxzZSBpZiAoYzEuZ2V0SXNPbmxpbmUoKSA9PT0gdW5kZWZpbmVkKSByZXR1cm4gLTE7XG4gICAgICAgIGVsc2UgcmV0dXJuIDE7IC8vIGMxIGlzIG9mZmxpbmVcbiAgICAgIH1cbiAgfVxuXG4gIHByb3RlY3RlZCBjb21wYXJlUHJpb3JpdGllcyhwMSwgcDIpIHtcbiAgICBpZiAocDEgPT0gcDIpIHJldHVybiAwO1xuICAgIGlmIChwMSA9PSAwKSByZXR1cm4gLTE7XG4gICAgaWYgKHAyID09IDApIHJldHVybiAxO1xuICAgIHJldHVybiBwMiAtIHAxO1xuICB9XG5cbiAgcHJvdGVjdGVkIHN0YXJ0UG9sbGluZ0Nvbm5lY3Rpb24ocGVyaW9kTXMpIHtcbiAgICB0aGlzLnBvbGxlciA9IG5ldyBUYXNrTG9vcGVyKGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7IGF3YWl0IHRoaXMuY2hlY2tDb25uZWN0aW9uKCk7IH1cbiAgICAgIGNhdGNoIChlcnIpIHsgY29uc29sZS5sb2coZXJyKTsgfVxuICAgIH0pO1xuICAgIHRoaXMucG9sbGVyLnN0YXJ0KHBlcmlvZE1zKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHByb3RlY3RlZCBzdGFydFBvbGxpbmdDb25uZWN0aW9ucyhwZXJpb2RNcykge1xuICAgIHRoaXMucG9sbGVyID0gbmV3IFRhc2tMb29wZXIoYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHsgYXdhaXQgdGhpcy5jaGVja0Nvbm5lY3Rpb25zKCk7IH1cbiAgICAgIGNhdGNoIChlcnIpIHsgY29uc29sZS5sb2coZXJyKTsgfVxuICAgIH0pO1xuICAgIHRoaXMucG9sbGVyLnN0YXJ0KHBlcmlvZE1zKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHByb3RlY3RlZCBzdGFydFBvbGxpbmdQcmlvcml0aXplZENvbm5lY3Rpb25zKHBlcmlvZE1zLCBleGNsdWRlZENvbm5lY3Rpb25zKSB7XG4gICAgdGhpcy5wb2xsZXIgPSBuZXcgVGFza0xvb3Blcihhc3luYyAoKSA9PiB7XG4gICAgICB0cnkgeyBhd2FpdCB0aGlzLmNoZWNrUHJpb3JpdGl6ZWRDb25uZWN0aW9ucyhleGNsdWRlZENvbm5lY3Rpb25zKTsgfVxuICAgICAgY2F0Y2ggKGVycikgeyBjb25zb2xlLmxvZyhlcnIpOyB9XG4gICAgfSk7XG4gICAgdGhpcy5wb2xsZXIuc3RhcnQocGVyaW9kTXMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgYXN5bmMgY2hlY2tQcmlvcml0aXplZENvbm5lY3Rpb25zKGV4Y2x1ZGVkQ29ubmVjdGlvbnMpIHtcbiAgICBmb3IgKGxldCBwcmlvcml0aXplZENvbm5lY3Rpb25zIG9mIHRoaXMuZ2V0Q29ubmVjdGlvbnNJbkFzY2VuZGluZ1ByaW9yaXR5KCkpIHtcbiAgICAgIGxldCBoYXNDb25uZWN0aW9uID0gYXdhaXQgdGhpcy5jaGVja0Nvbm5lY3Rpb25zQXV4KHByaW9yaXRpemVkQ29ubmVjdGlvbnMsIGV4Y2x1ZGVkQ29ubmVjdGlvbnMpO1xuICAgICAgaWYgKGhhc0Nvbm5lY3Rpb24pIHJldHVybjtcbiAgICB9XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgY2hlY2tDb25uZWN0aW9uc0F1eChjb25uZWN0aW9ucywgZXhjbHVkZWRDb25uZWN0aW9ucz8pIHtcbiAgICB0cnkge1xuXG4gICAgICAvLyBjaGVjayBjb25uZWN0aW9ucyBpbiBwYXJhbGxlbFxuICAgICAgbGV0IHRoYXQgPSB0aGlzO1xuICAgICAgbGV0IGNoZWNrUHJvbWlzZXMgPSBbXTtcbiAgICAgIGxldCBoYXNDb25uZWN0aW9uID0gZmFsc2U7XG4gICAgICBmb3IgKGxldCBjb25uZWN0aW9uIG9mIGNvbm5lY3Rpb25zKSB7XG4gICAgICAgIGlmIChleGNsdWRlZENvbm5lY3Rpb25zICYmIEdlblV0aWxzLmFycmF5Q29udGFpbnMoZXhjbHVkZWRDb25uZWN0aW9ucywgY29ubmVjdGlvbikpIGNvbnRpbnVlO1xuICAgICAgICBjaGVja1Byb21pc2VzLnB1c2gobmV3IFByb21pc2UoYXN5bmMgZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCBjaGFuZ2UgPSBhd2FpdCBjb25uZWN0aW9uLmNoZWNrQ29ubmVjdGlvbih0aGF0LnRpbWVvdXRNcyk7XG4gICAgICAgICAgICBpZiAoY2hhbmdlICYmIGNvbm5lY3Rpb24gPT09IHRoYXQuZ2V0Q29ubmVjdGlvbigpKSBhd2FpdCB0aGF0Lm9uQ29ubmVjdGlvbkNoYW5nZWQoY29ubmVjdGlvbik7XG4gICAgICAgICAgICBpZiAoY29ubmVjdGlvbi5pc0Nvbm5lY3RlZCgpICYmICFoYXNDb25uZWN0aW9uKSB7XG4gICAgICAgICAgICAgIGhhc0Nvbm5lY3Rpb24gPSB0cnVlO1xuICAgICAgICAgICAgICBpZiAoIXRoYXQuaXNDb25uZWN0ZWQoKSAmJiB0aGF0LmF1dG9Td2l0Y2gpIGF3YWl0IHRoYXQuc2V0Q29ubmVjdGlvbihjb25uZWN0aW9uKTsgLy8gc2V0IGZpcnN0IGF2YWlsYWJsZSBjb25uZWN0aW9uIGlmIGRpc2Nvbm5lY3RlZFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzb2x2ZSh1bmRlZmluZWQpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgICB9XG4gICAgICBhd2FpdCBQcm9taXNlLmFsbChjaGVja1Byb21pc2VzKTtcblxuICAgICAgLy8gcHJvY2VzcyByZXNwb25zZXNcbiAgICAgIGF3YWl0IHRoaXMucHJvY2Vzc1Jlc3BvbnNlcyhjb25uZWN0aW9ucyk7XG4gICAgICByZXR1cm4gaGFzQ29ubmVjdGlvbjtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihlcnIpO1xuICAgIH1cbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBwcm9jZXNzUmVzcG9uc2VzKHJlc3BvbnNlcyk6IFByb21pc2U8TW9uZXJvUnBjQ29ubmVjdGlvbj4ge1xuXG4gICAgLy8gYWRkIG5ldyBjb25uZWN0aW9uc1xuICAgIGZvciAobGV0IGNvbm5lY3Rpb24gb2YgcmVzcG9uc2VzKSB7XG4gICAgICBpZiAoIXRoaXMucmVzcG9uc2VUaW1lcy5oYXMoY29ubmVjdGlvbi5nZXRVcmkoKSkpIHRoaXMucmVzcG9uc2VUaW1lcy5zZXQoY29ubmVjdGlvbi5nZXRVcmkoKSwgW10pO1xuICAgIH1cblxuICAgIC8vIGluc2VydCByZXNwb25zZSB0aW1lcyBvciB1bmRlZmluZWRcbiAgICB0aGlzLnJlc3BvbnNlVGltZXMuZm9yRWFjaCgodGltZXMsIGNvbm5lY3Rpb24pID0+IHtcbiAgICAgIHRpbWVzLnVuc2hpZnQoR2VuVXRpbHMuYXJyYXlDb250YWlucyhyZXNwb25zZXMsIGNvbm5lY3Rpb24pID8gY29ubmVjdGlvbi5nZXRSZXNwb25zZVRpbWUoKSA6IHVuZGVmaW5lZCk7XG5cbiAgICAgIC8vIHJlbW92ZSBvbGQgcmVzcG9uc2UgdGltZXNcbiAgICAgIGlmICh0aW1lcy5sZW5ndGggPiBNb25lcm9Db25uZWN0aW9uTWFuYWdlci5NSU5fQkVUVEVSX1JFU1BPTlNFUykgdGltZXMucG9wKCk7XG4gICAgfSk7XG5cbiAgICAvLyB1cGRhdGUgYmVzdCBjb25uZWN0aW9uIGJhc2VkIG9uIHJlc3BvbnNlcyBhbmQgcHJpb3JpdHlcbiAgICByZXR1cm4gYXdhaXQgdGhpcy51cGRhdGVCZXN0Q29ubmVjdGlvbkluUHJpb3JpdHkoKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyB1cGRhdGVCZXN0Q29ubmVjdGlvbkluUHJpb3JpdHkoKTogUHJvbWlzZTxNb25lcm9ScGNDb25uZWN0aW9uPiB7XG4gICAgaWYgKCF0aGlzLmF1dG9Td2l0Y2gpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgZm9yIChsZXQgcHJpb3JpdGl6ZWRDb25uZWN0aW9ucyBvZiB0aGlzLmdldENvbm5lY3Rpb25zSW5Bc2NlbmRpbmdQcmlvcml0eSgpKSB7XG4gICAgICBsZXQgYmVzdENvbm5lY3Rpb25Gcm9tUmVzcG9uc2VzID0gYXdhaXQgdGhpcy5nZXRCZXN0Q29ubmVjdGlvbkZyb21Qcmlvcml0aXplZFJlc3BvbnNlcyhwcmlvcml0aXplZENvbm5lY3Rpb25zKTtcbiAgICAgIGlmIChiZXN0Q29ubmVjdGlvbkZyb21SZXNwb25zZXMpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5zZXRDb25uZWN0aW9uKGJlc3RDb25uZWN0aW9uRnJvbVJlc3BvbnNlcyk7XG4gICAgICAgIHJldHVybiBiZXN0Q29ubmVjdGlvbkZyb21SZXNwb25zZXM7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBiZXN0IGNvbm5lY3Rpb24gZnJvbSB0aGUgZ2l2ZW4gcmVzcG9uc2VzLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9ScGNDb25uZWN0aW9uW119IHJlc3BvbnNlcyBjb25uZWN0aW9uIHJlc3BvbnNlcyB0byB1cGRhdGUgZnJvbVxuICAgKiBAcmV0dXJuIHtNb25lcm9ScGNDb25uZWN0aW9ufSB0aGUgYmVzdCByZXNwb25zZSBhbW9uZyB0aGUgZ2l2ZW4gcmVzcG9uc2VzIG9yIHVuZGVmaW5lZCBpZiBub25lIGFyZSBiZXN0XG4gICAqL1xuICBwcm90ZWN0ZWQgYXN5bmMgZ2V0QmVzdENvbm5lY3Rpb25Gcm9tUHJpb3JpdGl6ZWRSZXNwb25zZXMocmVzcG9uc2VzKTogUHJvbWlzZTxNb25lcm9ScGNDb25uZWN0aW9uPiB7XG5cbiAgICAvLyBnZXQgYmVzdCByZXNwb25zZVxuICAgIGxldCBiZXN0UmVzcG9uc2UgPSB1bmRlZmluZWQ7XG4gICAgZm9yIChsZXQgY29ubmVjdGlvbiBvZiByZXNwb25zZXMpIHtcbiAgICAgIGlmIChjb25uZWN0aW9uLmlzQ29ubmVjdGVkKCkgPT09IHRydWUgJiYgKCFiZXN0UmVzcG9uc2UgfHwgY29ubmVjdGlvbi5nZXRSZXNwb25zZVRpbWUoKSA8IGJlc3RSZXNwb25zZS5nZXRSZXNwb25zZVRpbWUoKSkpIGJlc3RSZXNwb25zZSA9IGNvbm5lY3Rpb247XG4gICAgfVxuXG4gICAgLy8gbm8gdXBkYXRlIGlmIG5vIHJlc3BvbnNlc1xuICAgIGlmICghYmVzdFJlc3BvbnNlKSByZXR1cm4gdW5kZWZpbmVkO1xuXG4gICAgLy8gdXNlIGJlc3QgcmVzcG9uc2UgaWYgZGlzY29ubmVjdGVkXG4gICAgbGV0IGJlc3RDb25uZWN0aW9uID0gYXdhaXQgdGhpcy5nZXRDb25uZWN0aW9uKCk7XG4gICAgaWYgKCFiZXN0Q29ubmVjdGlvbiB8fCBiZXN0Q29ubmVjdGlvbi5pc0Nvbm5lY3RlZCgpICE9PSB0cnVlKSByZXR1cm4gYmVzdFJlc3BvbnNlO1xuXG4gICAgLy8gdXNlIGJlc3QgcmVzcG9uc2UgaWYgZGlmZmVyZW50IHByaW9yaXR5IChhc3N1bWVzIGJlaW5nIGNhbGxlZCBpbiBkZXNjZW5kaW5nIHByaW9yaXR5KVxuICAgIGlmICh0aGlzLmNvbXBhcmVQcmlvcml0aWVzKGJlc3RSZXNwb25zZS5nZXRQcmlvcml0eSgpLCBiZXN0Q29ubmVjdGlvbi5nZXRQcmlvcml0eSgpKSAhPT0gMCkgcmV0dXJuIGJlc3RSZXNwb25zZTtcblxuICAgIC8vIGtlZXAgYmVzdCBjb25uZWN0aW9uIGlmIG5vdCBlbm91Z2ggZGF0YVxuICAgIGlmICghdGhpcy5yZXNwb25zZVRpbWVzLmhhcyhiZXN0Q29ubmVjdGlvbi5nZXRVcmkoKSkpIHJldHVybiBiZXN0Q29ubmVjdGlvbjtcblxuICAgIC8vIGNoZWNrIGlmIGNvbm5lY3Rpb24gaXMgY29uc2lzdGVudGx5IGJldHRlclxuICAgIGZvciAobGV0IGNvbm5lY3Rpb24gb2YgcmVzcG9uc2VzKSB7XG4gICAgICBpZiAoY29ubmVjdGlvbiA9PT0gYmVzdENvbm5lY3Rpb24pIGNvbnRpbnVlO1xuICAgICAgaWYgKCF0aGlzLnJlc3BvbnNlVGltZXMuaGFzKGNvbm5lY3Rpb24uZ2V0VXJpKCkpIHx8IHRoaXMucmVzcG9uc2VUaW1lcy5nZXQoY29ubmVjdGlvbi5nZXRVcmkoKSkubGVuZ3RoIDwgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIuTUlOX0JFVFRFUl9SRVNQT05TRVMpIGNvbnRpbnVlO1xuICAgICAgbGV0IGJldHRlciA9IHRydWU7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyLk1JTl9CRVRURVJfUkVTUE9OU0VTOyBpKyspIHtcbiAgICAgICAgaWYgKHRoaXMucmVzcG9uc2VUaW1lcy5nZXQoY29ubmVjdGlvbi5nZXRVcmkoKSlbaV0gPT09IHVuZGVmaW5lZCB8fCB0aGlzLnJlc3BvbnNlVGltZXMuZ2V0KGJlc3RDb25uZWN0aW9uLmdldFVyaSgpKVtpXSB8fCB0aGlzLnJlc3BvbnNlVGltZXMuZ2V0KGNvbm5lY3Rpb24uZ2V0VXJpKCkpW2ldID4gdGhpcy5yZXNwb25zZVRpbWVzLmdldChiZXN0Q29ubmVjdGlvbi5nZXRVcmkoKSlbaV0pIHtcbiAgICAgICAgICBiZXR0ZXIgPSBmYWxzZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGJldHRlcikgYmVzdENvbm5lY3Rpb24gPSBjb25uZWN0aW9uO1xuICAgIH1cbiAgICByZXR1cm4gYmVzdENvbm5lY3Rpb247XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLFNBQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLFdBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLFdBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTs7QUFF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