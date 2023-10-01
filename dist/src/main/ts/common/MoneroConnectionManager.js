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
      if (c1.getPriority() === c2.getPriority()) return c1.getUri().localeCompare(c2.getUri());else
      return c1.getPriority() == 0 ? 1 : c2.getPriority() == 0 ? -1 : c1.getPriority() - c2.getPriority();
    } else {
      if (c1.getIsOnline()) return -1;else
      if (c2.getIsOnline()) return 1;else
      if (c1.getIsOnline() === undefined) return -1;else
      return 1; // c1 is offline
    }
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

    // add non-existing connections
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
    await this.updateBestConnectionInPriority();
  }

  async updateBestConnectionInPriority() {
    if (!this.autoSwitch) return;
    for (let prioritizedConnections of this.getConnectionsInAscendingPriority()) {
      if (await this.updateBestConnectionFromResponses(prioritizedConnections)) break;
    }
  }

  async updateBestConnectionFromResponses(responses) {
    let bestConnection = this.isConnected() ? this.getConnection() : undefined;
    if (bestConnection && (!this.responseTimes.has(bestConnection.getUri()) || this.responseTimes.get(bestConnection.getUri()).length < MoneroConnectionManager.MIN_BETTER_RESPONSES)) return bestConnection;
    if (this.isConnected()) {

      // check if connection is consistently better
      for (let connection of responses) {
        if (connection === bestConnection) continue;
        if (!this.responseTimes.has(connection.getUri()) || this.responseTimes.get(connection.getUri()).length < MoneroConnectionManager.MIN_BETTER_RESPONSES) continue;
        let better = true;
        for (let i = 0; i < MoneroConnectionManager.MIN_BETTER_RESPONSES; i++) {
          if (this.responseTimes.get(connection.getUri())[i] === undefined || this.responseTimes.get(connection.getUri())[i] >= this.responseTimes.get(bestConnection.getUri())[i]) {
            better = false;
            break;
          }
        }
        if (better) bestConnection = connection;
      }
    } else {
      for (let connection of responses) {
        if (connection.isConnected() && (!bestConnection || connection.getResponseTime() < bestConnection.getResponseTime())) bestConnection = connection;
      }
    }
    if (bestConnection) await this.setConnection(bestConnection);
    return bestConnection;
  }
}exports.default = MoneroConnectionManager;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfR2VuVXRpbHMiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9UYXNrTG9vcGVyIiwiX1RocmVhZFBvb2wiLCJfTW9uZXJvRXJyb3IiLCJfTW9uZXJvUnBjQ29ubmVjdGlvbiIsIk1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyIiwiREVGQVVMVF9USU1FT1VUIiwiREVGQVVMVF9QT0xMX1BFUklPRCIsIkRFRkFVTFRfQVVUT19TV0lUQ0giLCJNSU5fQkVUVEVSX1JFU1BPTlNFUyIsIlBvbGxUeXBlIiwiUFJJT1JJVElaRUQiLCJDVVJSRU5UIiwiQUxMIiwiY29uc3RydWN0b3IiLCJwcm94eVRvV29ya2VyIiwidGltZW91dE1zIiwiYXV0b1N3aXRjaCIsImNvbm5lY3Rpb25zIiwicmVzcG9uc2VUaW1lcyIsIk1hcCIsImxpc3RlbmVycyIsImFkZExpc3RlbmVyIiwibGlzdGVuZXIiLCJwdXNoIiwicmVtb3ZlTGlzdGVuZXIiLCJHZW5VdGlscyIsInJlbW92ZSIsIk1vbmVyb0Vycm9yIiwicmVtb3ZlTGlzdGVuZXJzIiwic3BsaWNlIiwibGVuZ3RoIiwiZ2V0TGlzdGVuZXJzIiwiYWRkQ29ubmVjdGlvbiIsInVyaU9yQ29ubmVjdGlvbiIsImNvbm5lY3Rpb24iLCJNb25lcm9ScGNDb25uZWN0aW9uIiwiYUNvbm5lY3Rpb24iLCJnZXRVcmkiLCJ1bmRlZmluZWQiLCJzZXRQcm94eVRvV29ya2VyIiwicmVtb3ZlQ29ubmVjdGlvbiIsInVyaSIsImdldENvbm5lY3Rpb25CeVVyaSIsImRlbGV0ZSIsImN1cnJlbnRDb25uZWN0aW9uIiwib25Db25uZWN0aW9uQ2hhbmdlZCIsInNldENvbm5lY3Rpb24iLCJwcmV2Q29ubmVjdGlvbiIsImdldENvbm5lY3Rpb24iLCJoYXNDb25uZWN0aW9uIiwiZ2V0Q29ubmVjdGlvbnMiLCJzb3J0ZWRDb25uZWN0aW9ucyIsImNvcHlBcnJheSIsInNvcnQiLCJjb21wYXJlQ29ubmVjdGlvbnMiLCJiaW5kIiwiaXNDb25uZWN0ZWQiLCJzdGFydFBvbGxpbmciLCJwZXJpb2RNcyIsInBvbGxUeXBlIiwiZXhjbHVkZWRDb25uZWN0aW9ucyIsInNldEF1dG9Td2l0Y2giLCJzZXRUaW1lb3V0Iiwic3RvcFBvbGxpbmciLCJzdGFydFBvbGxpbmdDb25uZWN0aW9uIiwic3RhcnRQb2xsaW5nQ29ubmVjdGlvbnMiLCJzdGFydFBvbGxpbmdQcmlvcml0aXplZENvbm5lY3Rpb25zIiwicG9sbGVyIiwic3RvcCIsImNoZWNrQ29ubmVjdGlvbiIsImNvbm5lY3Rpb25DaGFuZ2VkIiwicHJvY2Vzc1Jlc3BvbnNlcyIsImJlc3RDb25uZWN0aW9uIiwiZ2V0QmVzdEF2YWlsYWJsZUNvbm5lY3Rpb24iLCJjaGVja0Nvbm5lY3Rpb25zIiwiY2hlY2tDb25uZWN0aW9uc0F1eCIsImNoZWNrQ29ubmVjdGlvblByb21pc2VzIiwiY2hlY2tQcm9taXNlcyIsInBvb2wiLCJUaHJlYWRQb29sIiwic3VibWl0IiwiZXJyIiwiUHJvbWlzZSIsImFsbCIsInByaW9yaXRpemVkQ29ubmVjdGlvbnMiLCJnZXRDb25uZWN0aW9uc0luQXNjZW5kaW5nUHJpb3JpdHkiLCJ0aGF0IiwiYXJyYXlDb250YWlucyIsInJlc29sdmUiLCJyZWplY3QiLCJmaXJzdEF2YWlsYWJsZSIsImFueSIsIkFnZ3JlZ2F0ZUVycm9yIiwiZ2V0QXV0b1N3aXRjaCIsImdldFRpbWVvdXQiLCJnZXRQZWVyQ29ubmVjdGlvbnMiLCJkaXNjb25uZWN0IiwiY2xlYXIiLCJyZXNldCIsInByb21pc2VzIiwiY29ubmVjdGlvblByaW9yaXRpZXMiLCJoYXMiLCJnZXRQcmlvcml0eSIsInNldCIsImdldCIsImFzY2VuZGluZ1ByaW9yaXRpZXMiLCJhIiwiYiIsInBhcnNlSW50IiwiYXNjZW5kaW5nUHJpb3JpdGllc0xpc3QiLCJwcmlvcml0eUNvbm5lY3Rpb25zIiwidmFsdWVzIiwiYzEiLCJjMiIsImdldElzT25saW5lIiwibG9jYWxlQ29tcGFyZSIsIlRhc2tMb29wZXIiLCJjb25zb2xlIiwibG9nIiwic3RhcnQiLCJjaGVja1ByaW9yaXRpemVkQ29ubmVjdGlvbnMiLCJjaGFuZ2UiLCJyZXNwb25zZXMiLCJmb3JFYWNoIiwidGltZXMiLCJ1bnNoaWZ0IiwiZ2V0UmVzcG9uc2VUaW1lIiwicG9wIiwidXBkYXRlQmVzdENvbm5lY3Rpb25JblByaW9yaXR5IiwidXBkYXRlQmVzdENvbm5lY3Rpb25Gcm9tUmVzcG9uc2VzIiwiYmV0dGVyIiwiaSIsImV4cG9ydHMiLCJkZWZhdWx0Il0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvY29tbW9uL01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBHZW5VdGlscyBmcm9tIFwiLi9HZW5VdGlsc1wiO1xuaW1wb3J0IFRhc2tMb29wZXIgZnJvbSBcIi4vVGFza0xvb3BlclwiO1xuaW1wb3J0IFRocmVhZFBvb2wgZnJvbSBcIi4vVGhyZWFkUG9vbFwiO1xuaW1wb3J0IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIgZnJvbSBcIi4vTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lclwiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuL01vbmVyb0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvUnBjQ29ubmVjdGlvbiBmcm9tIFwiLi9Nb25lcm9ScGNDb25uZWN0aW9uXCI7XG5cbi8qKlxuICogPHA+TWFuYWdlcyBhIGNvbGxlY3Rpb24gb2YgcHJpb3JpdGl6ZWQgY29ubmVjdGlvbnMgdG8gZGFlbW9uIG9yIHdhbGxldCBSUEMgZW5kcG9pbnRzLjwvcD5cbiAqXG4gKiA8cD5FeGFtcGxlIHVzYWdlOjwvcD5cbiAqIFxuICogPGNvZGU+XG4gKiAvLyBpbXBvcnRzPGJyPlxuICogaW1wb3J0IHsgTW9uZXJvUnBjQ29ubmVjdGlvbiwgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIsIE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIgfSBmcm9tIFwibW9uZXJvLXRzXCI7PGJyPlxuICogPGJyPlxuICogLy8gY3JlYXRlIGNvbm5lY3Rpb24gbWFuYWdlcjxicj5cbiAqIGxldCBjb25uZWN0aW9uTWFuYWdlciA9IG5ldyBNb25lcm9Db25uZWN0aW9uTWFuYWdlcigpOzxicj5cbiAqIDxicj5cbiAqIC8vIGFkZCBtYW5hZ2VkIGNvbm5lY3Rpb25zIHdpdGggcHJpb3JpdGllczxicj5cbiAqIGF3YWl0IGNvbm5lY3Rpb25NYW5hZ2VyLmFkZENvbm5lY3Rpb24oe3VyaTogXCJodHRwOi8vbG9jYWxob3N0OjM4MDgxXCIsIHByaW9yaXR5OiAxfSk7IC8vIHVzZSBsb2NhbGhvc3QgYXMgZmlyc3QgcHJpb3JpdHk8YnI+XG4gKiBhd2FpdCBjb25uZWN0aW9uTWFuYWdlci5hZGRDb25uZWN0aW9uKHt1cmk6IFwiaHR0cDovL2V4YW1wbGUuY29tXCJ9KTsgLy8gZGVmYXVsdCBwcmlvcml0eSBpcyBwcmlvcml0aXplZCBsYXN0PGJyPlxuICogPGJyPlxuICogLy8gc2V0IGN1cnJlbnQgY29ubmVjdGlvbjxicj5cbiAqIGF3YWl0IGNvbm5lY3Rpb25NYW5hZ2VyLnNldENvbm5lY3Rpb24oe3VyaTogXCJodHRwOi8vZm9vLmJhclwiLCB1c2VybmFtZTogXCJhZG1pblwiLCBwYXNzd29yZDogXCJwYXNzd29yZFwifSk7IC8vIGNvbm5lY3Rpb24gaXMgYWRkZWQgaWYgbmV3PGJyPlxuICogPGJyPlxuICogLy8gY2hlY2sgY29ubmVjdGlvbiBzdGF0dXM8YnI+XG4gKiBhd2FpdCBjb25uZWN0aW9uTWFuYWdlci5jaGVja0Nvbm5lY3Rpb24oKTs8YnI+XG4gKiBjb25zb2xlLmxvZyhcIkNvbm5lY3Rpb24gbWFuYWdlciBpcyBjb25uZWN0ZWQ6IFwiICsgY29ubmVjdGlvbk1hbmFnZXIuaXNDb25uZWN0ZWQoKSk7PGJyPlxuICogY29uc29sZS5sb2coXCJDb25uZWN0aW9uIGlzIG9ubGluZTogXCIgKyBjb25uZWN0aW9uTWFuYWdlci5nZXRDb25uZWN0aW9uKCkuZ2V0SXNPbmxpbmUoKSk7PGJyPlxuICogY29uc29sZS5sb2coXCJDb25uZWN0aW9uIGlzIGF1dGhlbnRpY2F0ZWQ6IFwiICsgY29ubmVjdGlvbk1hbmFnZXIuZ2V0Q29ubmVjdGlvbigpLmdldElzQXV0aGVudGljYXRlZCgpKTs8YnI+XG4gKiA8YnI+IFxuICogLy8gcmVjZWl2ZSBub3RpZmljYXRpb25zIG9mIGFueSBjaGFuZ2VzIHRvIGN1cnJlbnQgY29ubmVjdGlvbjxicj5cbiAqIGNvbm5lY3Rpb25NYW5hZ2VyLmFkZExpc3RlbmVyKG5ldyBjbGFzcyBleHRlbmRzIE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIgezxicj5cbiAqICZuYnNwOyZuYnNwOyBhc3luYyBvbkNvbm5lY3Rpb25DaGFuZ2VkKGNvbm5lY3Rpb24pIHs8YnI+XG4gKiAmbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDsgY29uc29sZS5sb2coXCJDb25uZWN0aW9uIGNoYW5nZWQgdG86IFwiICsgY29ubmVjdGlvbik7PGJyPlxuICogJm5ic3A7Jm5ic3A7IH08YnI+XG4gKiB9KTs8YnI+XG4gKiA8YnI+XG4gKiAvLyBzdGFydCBwb2xsaW5nIGZvciBiZXN0IGNvbm5lY3Rpb24gZXZlcnkgMTAgc2Vjb25kcyBhbmQgYXV0b21hdGljYWxseSBzd2l0Y2g8YnI+XG4gKiBjb25uZWN0aW9uTWFuYWdlci5zdGFydFBvbGxpbmcoMTAwMDApOzxicj5cbiAqIDxicj5cbiAqIC8vIGF1dG9tYXRpY2FsbHkgc3dpdGNoIHRvIGJlc3QgYXZhaWxhYmxlIGNvbm5lY3Rpb24gaWYgZGlzY29ubmVjdGVkPGJyPlxuICogY29ubmVjdGlvbk1hbmFnZXIuc2V0QXV0b1N3aXRjaCh0cnVlKTs8YnI+XG4gKiA8YnI+XG4gKiAvLyBnZXQgYmVzdCBhdmFpbGFibGUgY29ubmVjdGlvbiBpbiBvcmRlciBvZiBwcmlvcml0eSB0aGVuIHJlc3BvbnNlIHRpbWU8YnI+XG4gKiBsZXQgYmVzdENvbm5lY3Rpb24gPSBhd2FpdCBjb25uZWN0aW9uTWFuYWdlci5nZXRCZXN0QXZhaWxhYmxlQ29ubmVjdGlvbigpOzxicj5cbiAqIDxicj5cbiAqIC8vIGNoZWNrIHN0YXR1cyBvZiBhbGwgY29ubmVjdGlvbnM8YnI+XG4gKiBhd2FpdCBjb25uZWN0aW9uTWFuYWdlci5jaGVja0Nvbm5lY3Rpb25zKCk7PGJyPlxuICogPGJyPlxuICogLy8gZ2V0IGNvbm5lY3Rpb25zIGluIG9yZGVyIG9mIGN1cnJlbnQgY29ubmVjdGlvbiwgb25saW5lIHN0YXR1cyBmcm9tIGxhc3QgY2hlY2ssIHByaW9yaXR5LCBhbmQgbmFtZTxicj5cbiAqIGxldCBjb25uZWN0aW9ucyA9IGNvbm5lY3Rpb25NYW5hZ2VyLmdldENvbm5lY3Rpb25zKCk7PGJyPlxuICogPGJyPlxuICogLy8gY2xlYXIgY29ubmVjdGlvbiBtYW5hZ2VyPGJyPlxuICogY29ubmVjdGlvbk1hbmFnZXIuY2xlYXIoKTtcbiAqIDwvY29kZT5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIge1xuXG4gIC8vIHN0YXRpYyB2YXJpYWJsZXNcbiAgc3RhdGljIERFRkFVTFRfVElNRU9VVCA9IDUwMDA7XG4gIHN0YXRpYyBERUZBVUxUX1BPTExfUEVSSU9EID0gMjAwMDA7XG4gIHN0YXRpYyBERUZBVUxUX0FVVE9fU1dJVENIID0gdHJ1ZTtcbiAgc3RhdGljIE1JTl9CRVRURVJfUkVTUE9OU0VTID0gMztcblxuICAvLyBpbnN0YW5jZSB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIHByb3h5VG9Xb3JrZXI6IGFueTtcbiAgcHJvdGVjdGVkIHRpbWVvdXRNczogYW55O1xuICBwcm90ZWN0ZWQgYXV0b1N3aXRjaDogYW55O1xuICBwcm90ZWN0ZWQgY29ubmVjdGlvbnM6IGFueTtcbiAgcHJvdGVjdGVkIHJlc3BvbnNlVGltZXM6IGFueTtcbiAgcHJvdGVjdGVkIGxpc3RlbmVyczogYW55O1xuICBwcm90ZWN0ZWQgY3VycmVudENvbm5lY3Rpb246IGFueTtcbiAgcHJvdGVjdGVkIHBvbGxlcjogYW55O1xuXG4gIC8qKlxuICAgKiBTcGVjaWZ5IGJlaGF2aW9yIHdoZW4gcG9sbGluZy5cbiAgICogXG4gICAqIE9uZSBvZiBQUklPUklUSVpFRCAocG9sbCBjb25uZWN0aW9ucyBpbiBvcmRlciBvZiBwcmlvcml0eSB1bnRpbCBjb25uZWN0ZWQ7IGRlZmF1bHQpLCBDVVJSRU5UIChwb2xsIGN1cnJlbnQgY29ubmVjdGlvbiksIG9yIEFMTCAocG9sbCBhbGwgY29ubmVjdGlvbnMpLlxuICAgKi9cbiAgc3RhdGljIFBvbGxUeXBlID0ge1xuICAgIFBSSU9SSVRJWkVEOiAwLFxuICAgIENVUlJFTlQ6IDEsXG4gICAgQUxMOiAyXG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3QgYSBjb25uZWN0aW9uIG1hbmFnZXIuXG4gICAqIFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtwcm94eVRvV29ya2VyXSAtIGNvbmZpZ3VyZSBhbGwgY29ubmVjdGlvbnMgdG8gcHJveHkgdG8gd29ya2VyIChkZWZhdWx0IHRydWUpXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihwcm94eVRvV29ya2VyID0gdHJ1ZSkge1xuICAgIHRoaXMucHJveHlUb1dvcmtlciA9IHByb3h5VG9Xb3JrZXIgIT09IGZhbHNlO1xuICAgIHRoaXMudGltZW91dE1zID0gTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIuREVGQVVMVF9USU1FT1VUO1xuICAgIHRoaXMuYXV0b1N3aXRjaCA9IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyLkRFRkFVTFRfQVVUT19TV0lUQ0g7XG4gICAgdGhpcy5jb25uZWN0aW9ucyA9IFtdO1xuICAgIHRoaXMucmVzcG9uc2VUaW1lcyA9IG5ldyBNYXAoKTtcbiAgICB0aGlzLmxpc3RlbmVycyA9IFtdO1xuICB9XG4gIFxuICAvKipcbiAgICogQWRkIGEgbGlzdGVuZXIgdG8gcmVjZWl2ZSBub3RpZmljYXRpb25zIHdoZW4gdGhlIGNvbm5lY3Rpb24gY2hhbmdlcy5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lcn0gbGlzdGVuZXIgLSB0aGUgbGlzdGVuZXIgdG8gYWRkXG4gICAqIEByZXR1cm4ge01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyfSB0aGlzIGNvbm5lY3Rpb24gbWFuYWdlciBmb3IgY2hhaW5pbmdcbiAgICovXG4gIGFkZExpc3RlbmVyKGxpc3RlbmVyOiBNb25lcm9Db25uZWN0aW9uTWFuYWdlckxpc3RlbmVyKTogTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIge1xuICAgIHRoaXMubGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICAvKipcbiAgICogUmVtb3ZlIGEgbGlzdGVuZXIuXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXJ9IGxpc3RlbmVyIC0gdGhlIGxpc3RlbmVyIHRvIHJlbW92ZVxuICAgKiBAcmV0dXJuIHtNb25lcm9Db25uZWN0aW9uTWFuYWdlcn0gdGhpcyBjb25uZWN0aW9uIG1hbmFnZXIgZm9yIGNoYWluaW5nXG4gICAqL1xuICByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcjogTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lcik6IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyIHtcbiAgICBpZiAoIUdlblV0aWxzLnJlbW92ZSh0aGlzLmxpc3RlbmVycywgbGlzdGVuZXIpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNb25lcm8gY29ubmVjdGlvbiBtYW5hZ2VyIGRvZXMgbm90IGNvbnRhaW4gbGlzdGVuZXIgdG8gcmVtb3ZlXCIpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICAvKipcbiAgICogUmVtb3ZlIGFsbCBsaXN0ZW5lcnMuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtNb25lcm9Db25uZWN0aW9uTWFuYWdlcn0gdGhpcyBjb25uZWN0aW9uIG1hbmFnZXIgZm9yIGNoYWluaW5nXG4gICAqL1xuICByZW1vdmVMaXN0ZW5lcnMoKTogTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIge1xuICAgIHRoaXMubGlzdGVuZXJzLnNwbGljZSgwLCB0aGlzLmxpc3RlbmVycy5sZW5ndGgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhbGwgbGlzdGVuZXJzLlxuICAgKiBcbiAgICogQHJldHVybiB7TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lcltdfSBhbGwgbGlzdGVuZXJzXG4gICAqL1xuICBnZXRMaXN0ZW5lcnMoKTogTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lcltdIHtcbiAgICByZXR1cm4gdGhpcy5saXN0ZW5lcnNcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgYSBjb25uZWN0aW9uLiBUaGUgY29ubmVjdGlvbiBtYXkgaGF2ZSBhbiBlbGV2YXRlZCBwcmlvcml0eSBmb3IgdGhpcyBtYW5hZ2VyIHRvIHVzZS5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj59IHVyaU9yQ29ubmVjdGlvbiAtIHVyaSBvciBjb25uZWN0aW9uIHRvIGFkZFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyPn0gdGhpcyBjb25uZWN0aW9uIG1hbmFnZXIgZm9yIGNoYWluaW5nXG4gICAqL1xuICBhc3luYyBhZGRDb25uZWN0aW9uKHVyaU9yQ29ubmVjdGlvbjogc3RyaW5nIHwgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPik6IFByb21pc2U8TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXI+IHtcbiAgICBsZXQgY29ubmVjdGlvbiA9IHVyaU9yQ29ubmVjdGlvbiBpbnN0YW5jZW9mIE1vbmVyb1JwY0Nvbm5lY3Rpb24gPyB1cmlPckNvbm5lY3Rpb24gOiBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbih1cmlPckNvbm5lY3Rpb24pO1xuICAgIGZvciAobGV0IGFDb25uZWN0aW9uIG9mIHRoaXMuY29ubmVjdGlvbnMpIHtcbiAgICAgIGlmIChhQ29ubmVjdGlvbi5nZXRVcmkoKSA9PT0gY29ubmVjdGlvbi5nZXRVcmkoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ29ubmVjdGlvbiBVUkkgYWxyZWFkeSBleGlzdHNcIik7XG4gICAgfVxuICAgIGlmICh0aGlzLnByb3h5VG9Xb3JrZXIgIT09IHVuZGVmaW5lZCkgY29ubmVjdGlvbi5zZXRQcm94eVRvV29ya2VyKHRoaXMucHJveHlUb1dvcmtlcik7XG4gICAgdGhpcy5jb25uZWN0aW9ucy5wdXNoKGNvbm5lY3Rpb24pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICAvKipcbiAgICogUmVtb3ZlIGEgY29ubmVjdGlvbi5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1cmkgLSBvZiB0aGUgdGhlIGNvbm5lY3Rpb24gdG8gcmVtb3ZlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXI+fSB0aGlzIGNvbm5lY3Rpb24gbWFuYWdlciBmb3IgY2hhaW5pbmdcbiAgICovXG4gIGFzeW5jIHJlbW92ZUNvbm5lY3Rpb24odXJpOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyPiB7XG4gICAgbGV0IGNvbm5lY3Rpb24gPSB0aGlzLmdldENvbm5lY3Rpb25CeVVyaSh1cmkpO1xuICAgIGlmICghY29ubmVjdGlvbikgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm8gY29ubmVjdGlvbiBleGlzdHMgd2l0aCBVUkk6IFwiICsgdXJpKTtcbiAgICBHZW5VdGlscy5yZW1vdmUodGhpcy5jb25uZWN0aW9ucywgY29ubmVjdGlvbik7XG4gICAgdGhpcy5yZXNwb25zZVRpbWVzLmRlbGV0ZShjb25uZWN0aW9uLmdldFVyaSgpKTtcbiAgICBpZiAoY29ubmVjdGlvbiA9PT0gdGhpcy5jdXJyZW50Q29ubmVjdGlvbikge1xuICAgICAgdGhpcy5jdXJyZW50Q29ubmVjdGlvbiA9IHVuZGVmaW5lZDtcbiAgICAgIGF3YWl0IHRoaXMub25Db25uZWN0aW9uQ2hhbmdlZCh0aGlzLmN1cnJlbnRDb25uZWN0aW9uKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZXQgdGhlIGN1cnJlbnQgY29ubmVjdGlvbi5cbiAgICogUHJvdmlkZSBhIFVSSSB0byBzZWxlY3QgYW4gZXhpc3RpbmcgY29ubmVjdGlvbiB3aXRob3V0IHVwZGF0aW5nIGl0cyBjcmVkZW50aWFscy5cbiAgICogUHJvdmlkZSBhIE1vbmVyb1JwY0Nvbm5lY3Rpb24gdG8gYWRkIG5ldyBjb25uZWN0aW9uIG9yIHJlcGxhY2UgZXhpc3RpbmcgY29ubmVjdGlvbiB3aXRoIHRoZSBzYW1lIFVSSS5cbiAgICogTm90aWZ5IGlmIGN1cnJlbnQgY29ubmVjdGlvbiBjaGFuZ2VzLlxuICAgKiBEb2VzIG5vdCBjaGVjayB0aGUgY29ubmVjdGlvbi5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj59IFt1cmlPckNvbm5lY3Rpb25dIC0gaXMgdGhlIHVyaSBvZiB0aGUgY29ubmVjdGlvbiBvciB0aGUgY29ubmVjdGlvbiB0byBtYWtlIGN1cnJlbnQgKGRlZmF1bHQgdW5kZWZpbmVkIGZvciBubyBjdXJyZW50IGNvbm5lY3Rpb24pXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXI+fSB0aGlzIGNvbm5lY3Rpb24gbWFuYWdlciBmb3IgY2hhaW5pbmdcbiAgICovXG4gIGFzeW5jIHNldENvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uPzogc3RyaW5nIHwgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPik6IFByb21pc2U8TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXI+IHtcbiAgICBcbiAgICAvLyBoYW5kbGUgdXJpXG4gICAgaWYgKHVyaU9yQ29ubmVjdGlvbiAmJiB0eXBlb2YgdXJpT3JDb25uZWN0aW9uID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBsZXQgY29ubmVjdGlvbiA9IHRoaXMuZ2V0Q29ubmVjdGlvbkJ5VXJpKHVyaU9yQ29ubmVjdGlvbik7XG4gICAgICByZXR1cm4gdGhpcy5zZXRDb25uZWN0aW9uKGNvbm5lY3Rpb24gPT09IHVuZGVmaW5lZCA/IG5ldyBNb25lcm9ScGNDb25uZWN0aW9uKHVyaU9yQ29ubmVjdGlvbikgOiBjb25uZWN0aW9uKTtcbiAgICB9XG4gICAgXG4gICAgLy8gaGFuZGxlIGNvbm5lY3Rpb25cbiAgICBsZXQgY29ubmVjdGlvbiA9IHVyaU9yQ29ubmVjdGlvbjtcbiAgICBpZiAodGhpcy5jdXJyZW50Q29ubmVjdGlvbiA9PT0gY29ubmVjdGlvbikgcmV0dXJuIHRoaXM7XG4gICAgXG4gICAgLy8gY2hlY2sgaWYgc2V0dGluZyB1bmRlZmluZWQgY29ubmVjdGlvblxuICAgIGlmICghY29ubmVjdGlvbikge1xuICAgICAgdGhpcy5jdXJyZW50Q29ubmVjdGlvbiA9IHVuZGVmaW5lZDtcbiAgICAgIGF3YWl0IHRoaXMub25Db25uZWN0aW9uQ2hhbmdlZCh1bmRlZmluZWQpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIFxuICAgIC8vIHZhbGlkYXRlIGNvbm5lY3Rpb25cbiAgICBpZiAoIShjb25uZWN0aW9uIGluc3RhbmNlb2YgTW9uZXJvUnBjQ29ubmVjdGlvbikpIGNvbm5lY3Rpb24gPSBuZXcgTW9uZXJvUnBjQ29ubmVjdGlvbihjb25uZWN0aW9uKTtcbiAgICBpZiAoIWNvbm5lY3Rpb24uZ2V0VXJpKCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNvbm5lY3Rpb24gaXMgbWlzc2luZyBVUklcIik7XG5cbiAgICAvLyBhZGQgb3IgcmVwbGFjZSBjb25uZWN0aW9uXG4gICAgbGV0IHByZXZDb25uZWN0aW9uID0gdGhpcy5nZXRDb25uZWN0aW9uQnlVcmkoY29ubmVjdGlvbi5nZXRVcmkoKSk7XG4gICAgaWYgKHByZXZDb25uZWN0aW9uKSBHZW5VdGlscy5yZW1vdmUodGhpcy5jb25uZWN0aW9ucywgcHJldkNvbm5lY3Rpb24pO1xuICAgIGF3YWl0IHRoaXMuYWRkQ29ubmVjdGlvbihjb25uZWN0aW9uKTtcbiAgICB0aGlzLmN1cnJlbnRDb25uZWN0aW9uID0gY29ubmVjdGlvbjtcbiAgICBhd2FpdCB0aGlzLm9uQ29ubmVjdGlvbkNoYW5nZWQodGhpcy5jdXJyZW50Q29ubmVjdGlvbik7XG4gICAgXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBjdXJyZW50IGNvbm5lY3Rpb24uXG4gICAqIFxuICAgKiBAcmV0dXJuIHtNb25lcm9ScGNDb25uZWN0aW9ufSB0aGUgY3VycmVudCBjb25uZWN0aW9uIG9yIHVuZGVmaW5lZCBpZiBubyBjb25uZWN0aW9uIHNldFxuICAgKi9cbiAgZ2V0Q29ubmVjdGlvbigpOiBNb25lcm9ScGNDb25uZWN0aW9uIHtcbiAgICByZXR1cm4gdGhpcy5jdXJyZW50Q29ubmVjdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhpcyBtYW5hZ2VyIGhhcyBhIGNvbm5lY3Rpb24gd2l0aCB0aGUgZ2l2ZW4gVVJJLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVyaSBVUkkgb2YgdGhlIGNvbm5lY3Rpb24gdG8gY2hlY2tcbiAgICogQHJldHVybiB7Ym9vbGVhbn0gdHJ1ZSBpZiB0aGlzIG1hbmFnZXIgaGFzIGEgY29ubmVjdGlvbiB3aXRoIHRoZSBnaXZlbiBVUkksIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgaGFzQ29ubmVjdGlvbih1cmk6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmdldENvbm5lY3Rpb25CeVVyaSh1cmkpICE9PSB1bmRlZmluZWQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYSBjb25uZWN0aW9uIGJ5IFVSSS5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1cmkgaXMgdGhlIFVSSSBvZiB0aGUgY29ubmVjdGlvbiB0byBnZXRcbiAgICogQHJldHVybiB7TW9uZXJvUnBjQ29ubmVjdGlvbn0gdGhlIGNvbm5lY3Rpb24gd2l0aCB0aGUgVVJJIG9yIHVuZGVmaW5lZCBpZiBubyBjb25uZWN0aW9uIHdpdGggdGhlIFVSSSBleGlzdHNcbiAgICovXG4gIGdldENvbm5lY3Rpb25CeVVyaSh1cmk6IHN0cmluZyk6IE1vbmVyb1JwY0Nvbm5lY3Rpb24ge1xuICAgIGZvciAobGV0IGNvbm5lY3Rpb24gb2YgdGhpcy5jb25uZWN0aW9ucykgaWYgKGNvbm5lY3Rpb24uZ2V0VXJpKCkgPT09IHVyaSkgcmV0dXJuIGNvbm5lY3Rpb247XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhbGwgY29ubmVjdGlvbnMgaW4gb3JkZXIgb2YgY3VycmVudCBjb25uZWN0aW9uIChpZiBhcHBsaWNhYmxlKSwgb25saW5lIHN0YXR1cywgcHJpb3JpdHksIGFuZCBuYW1lLlxuICAgKiBcbiAgICogQHJldHVybiB7TW9uZXJvUnBjQ29ubmVjdGlvbltdfSB0aGUgbGlzdCBvZiBzb3J0ZWQgY29ubmVjdGlvbnNcbiAgICovXG4gIGdldENvbm5lY3Rpb25zKCk6IE1vbmVyb1JwY0Nvbm5lY3Rpb25bXSB7XG4gICAgbGV0IHNvcnRlZENvbm5lY3Rpb25zID0gR2VuVXRpbHMuY29weUFycmF5KHRoaXMuY29ubmVjdGlvbnMpO1xuICAgIHNvcnRlZENvbm5lY3Rpb25zLnNvcnQodGhpcy5jb21wYXJlQ29ubmVjdGlvbnMuYmluZCh0aGlzKSk7XG4gICAgcmV0dXJuIHNvcnRlZENvbm5lY3Rpb25zO1xuICB9XG5cbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgY29ubmVjdGlvbiBtYW5hZ2VyIGlzIGNvbm5lY3RlZCB0byBhIG5vZGUuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtib29sZWFufHVuZGVmaW5lZH0gdHJ1ZSBpZiB0aGUgY3VycmVudCBjb25uZWN0aW9uIGlzIHNldCwgb25saW5lLCBhbmQgbm90IHVuYXV0aGVudGljYXRlZCwgdW5kZWZpbmVkIGlmIHVua25vd24sIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgaXNDb25uZWN0ZWQoKTogYm9vbGVhbiB8IHVuZGVmaW5lZCB7XG4gICAgaWYgKCF0aGlzLmN1cnJlbnRDb25uZWN0aW9uKSByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIHRoaXMuY3VycmVudENvbm5lY3Rpb24uaXNDb25uZWN0ZWQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdGFydCBwb2xsaW5nIGNvbm5lY3Rpb25zLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtwZXJpb2RNc10gcG9sbCBwZXJpb2QgaW4gbWlsbGlzZWNvbmRzIChkZWZhdWx0IDIwcylcbiAgICogQHBhcmFtIHtib29sZWFufSBbYXV0b1N3aXRjaF0gc3BlY2lmaWVzIHRvIGF1dG9tYXRpY2FsbHkgc3dpdGNoIHRvIHRoZSBiZXN0IGNvbm5lY3Rpb24gKGRlZmF1bHQgdHJ1ZSB1bmxlc3MgY2hhbmdlZClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFt0aW1lb3V0TXNdIHNwZWNpZmllcyB0aGUgdGltZW91dCB0byBwb2xsIGEgc2luZ2xlIGNvbm5lY3Rpb24gKGRlZmF1bHQgNXMgdW5sZXNzIGNoYW5nZWQpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcG9sbFR5cGVdIG9uZSBvZiBQUklPUklUSVpFRCAocG9sbCBjb25uZWN0aW9ucyBpbiBvcmRlciBvZiBwcmlvcml0eSB1bnRpbCBjb25uZWN0ZWQ7IGRlZmF1bHQpLCBDVVJSRU5UIChwb2xsIGN1cnJlbnQgY29ubmVjdGlvbiksIG9yIEFMTCAocG9sbCBhbGwgY29ubmVjdGlvbnMpXG4gICAqIEBwYXJhbSB7TW9uZXJvUnBjQ29ubmVjdGlvbltdfSBbZXhjbHVkZWRDb25uZWN0aW9uc10gY29ubmVjdGlvbnMgZXhjbHVkZWQgZnJvbSBiZWluZyBwb2xsZWRcbiAgICogQHJldHVybiB7TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJ9IHRoaXMgY29ubmVjdGlvbiBtYW5hZ2VyIGZvciBjaGFpbmluZ1xuICAgKi9cbiAgc3RhcnRQb2xsaW5nKHBlcmlvZE1zPzogbnVtYmVyLCBhdXRvU3dpdGNoPzogYm9vbGVhbiwgdGltZW91dE1zPzogbnVtYmVyLCBwb2xsVHlwZT86IG51bWJlciwgZXhjbHVkZWRDb25uZWN0aW9ucz86IE1vbmVyb1JwY0Nvbm5lY3Rpb25bXSk6IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyIHtcblxuICAgIC8vIGFwcGx5IGRlZmF1bHRzXG4gICAgaWYgKHBlcmlvZE1zID09IHVuZGVmaW5lZCkgcGVyaW9kTXMgPSBNb25lcm9Db25uZWN0aW9uTWFuYWdlci5ERUZBVUxUX1BPTExfUEVSSU9EO1xuICAgIGlmIChhdXRvU3dpdGNoICE9PSB1bmRlZmluZWQpIHRoaXMuc2V0QXV0b1N3aXRjaChhdXRvU3dpdGNoKTtcbiAgICBpZiAodGltZW91dE1zICE9PSB1bmRlZmluZWQpIHRoaXMuc2V0VGltZW91dCh0aW1lb3V0TXMpO1xuICAgIGlmIChwb2xsVHlwZSA9PT0gdW5kZWZpbmVkKSBwb2xsVHlwZSA9IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyLlBvbGxUeXBlLlBSSU9SSVRJWkVEO1xuXG4gICAgLy8gc3RvcCBwb2xsaW5nXG4gICAgdGhpcy5zdG9wUG9sbGluZygpO1xuXG4gICAgLy8gc3RhcnQgcG9sbGluZ1xuICAgIHN3aXRjaCAocG9sbFR5cGUpIHtcbiAgICAgIGNhc2UgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIuUG9sbFR5cGUuQ1VSUkVOVDpcbiAgICAgICAgdGhpcy5zdGFydFBvbGxpbmdDb25uZWN0aW9uKHBlcmlvZE1zKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyLlBvbGxUeXBlLkFMTDpcbiAgICAgICAgdGhpcy5zdGFydFBvbGxpbmdDb25uZWN0aW9ucyhwZXJpb2RNcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBNb25lcm9Db25uZWN0aW9uTWFuYWdlci5Qb2xsVHlwZS5QUklPUklUSVpFRDpcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRoaXMuc3RhcnRQb2xsaW5nUHJpb3JpdGl6ZWRDb25uZWN0aW9ucyhwZXJpb2RNcywgZXhjbHVkZWRDb25uZWN0aW9ucyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIFN0b3AgcG9sbGluZyBjb25uZWN0aW9ucy5cbiAgICogXG4gICAqIEByZXR1cm4ge01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyfSB0aGlzIGNvbm5lY3Rpb24gbWFuYWdlciBmb3IgY2hhaW5pbmdcbiAgICovXG4gIHN0b3BQb2xsaW5nKCk6IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyIHtcbiAgICBpZiAodGhpcy5wb2xsZXIpIHRoaXMucG9sbGVyLnN0b3AoKTtcbiAgICB0aGlzLnBvbGxlciA9IHVuZGVmaW5lZDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayB0aGUgY3VycmVudCBjb25uZWN0aW9uLiBJZiBkaXNjb25uZWN0ZWQgYW5kIGF1dG8gc3dpdGNoIGVuYWJsZWQsIHN3aXRjaGVzIHRvIGJlc3QgYXZhaWxhYmxlIGNvbm5lY3Rpb24uXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyPn0gdGhpcyBjb25uZWN0aW9uIG1hbmFnZXIgZm9yIGNoYWluaW5nXG4gICAqL1xuICBhc3luYyBjaGVja0Nvbm5lY3Rpb24oKTogUHJvbWlzZTxNb25lcm9Db25uZWN0aW9uTWFuYWdlcj4ge1xuICAgIGxldCBjb25uZWN0aW9uQ2hhbmdlZCA9IGZhbHNlO1xuICAgIGxldCBjb25uZWN0aW9uID0gdGhpcy5nZXRDb25uZWN0aW9uKCk7XG4gICAgaWYgKGNvbm5lY3Rpb24pIHtcbiAgICAgIGlmIChhd2FpdCBjb25uZWN0aW9uLmNoZWNrQ29ubmVjdGlvbih0aGlzLnRpbWVvdXRNcykpIGNvbm5lY3Rpb25DaGFuZ2VkID0gdHJ1ZTtcbiAgICAgIGF3YWl0IHRoaXMucHJvY2Vzc1Jlc3BvbnNlcyhbY29ubmVjdGlvbl0pO1xuICAgIH1cbiAgICBpZiAodGhpcy5hdXRvU3dpdGNoICYmICF0aGlzLmlzQ29ubmVjdGVkKCkpIHtcbiAgICAgIGxldCBiZXN0Q29ubmVjdGlvbiA9IGF3YWl0IHRoaXMuZ2V0QmVzdEF2YWlsYWJsZUNvbm5lY3Rpb24oW2Nvbm5lY3Rpb25dKTtcbiAgICAgIGlmIChiZXN0Q29ubmVjdGlvbikge1xuICAgICAgICBhd2FpdCB0aGlzLnNldENvbm5lY3Rpb24oYmVzdENvbm5lY3Rpb24pO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGNvbm5lY3Rpb25DaGFuZ2VkKSBhd2FpdCB0aGlzLm9uQ29ubmVjdGlvbkNoYW5nZWQoY29ubmVjdGlvbik7ICAgXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDaGVjayBhbGwgbWFuYWdlZCBjb25uZWN0aW9ucy5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXI+fSB0aGlzIGNvbm5lY3Rpb24gbWFuYWdlciBmb3IgY2hhaW5pbmdcbiAgICovXG4gIGFzeW5jIGNoZWNrQ29ubmVjdGlvbnMoKTogUHJvbWlzZTxNb25lcm9Db25uZWN0aW9uTWFuYWdlcj4ge1xuICAgIGF3YWl0IHRoaXMuY2hlY2tDb25uZWN0aW9uc0F1eCh0aGlzLmdldENvbm5lY3Rpb25zKCkpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGFsbCBtYW5hZ2VkIGNvbm5lY3Rpb25zLCByZXR1cm5pbmcgYSBwcm9taXNlIGZvciBlYWNoIGNvbm5lY3Rpb24gY2hlY2suXG4gICAqIERvZXMgbm90IGF1dG8gc3dpdGNoIGlmIGRpc2Nvbm5lY3RlZC5cbiAgICpcbiAgICogQHJldHVybiB7UHJvbWlzZVtdfSBhIHByb21pc2UgZm9yIGVhY2ggY29ubmVjdGlvbiBpbiB0aGUgb3JkZXIgb2YgZ2V0Q29ubmVjdGlvbnMoKS5cbiAgICovXG4gIGNoZWNrQ29ubmVjdGlvblByb21pc2VzKCk6IFByb21pc2U8dm9pZD5bXSB7XG4gICAgbGV0IGNoZWNrUHJvbWlzZXMgPSBbXTtcbiAgICBsZXQgcG9vbCA9IG5ldyBUaHJlYWRQb29sKHRoaXMuY29ubmVjdGlvbnMubGVuZ3RoKTtcbiAgICBmb3IgKGxldCBjb25uZWN0aW9uIG9mIHRoaXMuZ2V0Q29ubmVjdGlvbnMoKSkge1xuICAgICAgY2hlY2tQcm9taXNlcy5wdXNoKHBvb2wuc3VibWl0KGFzeW5jICgpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBpZiAoYXdhaXQgY29ubmVjdGlvbi5jaGVja0Nvbm5lY3Rpb24odGhpcy50aW1lb3V0TXMpICYmIGNvbm5lY3Rpb24gPT09IHRoaXMuY3VycmVudENvbm5lY3Rpb24pIGF3YWl0IHRoaXMub25Db25uZWN0aW9uQ2hhbmdlZChjb25uZWN0aW9uKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgLy8gaWdub3JlIGVycm9yXG4gICAgICAgIH1cbiAgICAgIH0pKTtcbiAgICB9XG4gICAgUHJvbWlzZS5hbGwoY2hlY2tQcm9taXNlcyk7XG4gICAgcmV0dXJuIGNoZWNrUHJvbWlzZXM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGJlc3QgYXZhaWxhYmxlIGNvbm5lY3Rpb24gaW4gb3JkZXIgb2YgcHJpb3JpdHkgdGhlbiByZXNwb25zZSB0aW1lLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9ScGNDb25uZWN0aW9uW119IFtleGNsdWRlZENvbm5lY3Rpb25zXSAtIGNvbm5lY3Rpb25zIHRvIGJlIGV4Y2x1ZGVkIGZyb20gY29uc2lkZXJhdGlvbiAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvUnBjQ29ubmVjdGlvbj59IHRoZSBiZXN0IGF2YWlsYWJsZSBjb25uZWN0aW9uIGluIG9yZGVyIG9mIHByaW9yaXR5IHRoZW4gcmVzcG9uc2UgdGltZSwgdW5kZWZpbmVkIGlmIG5vIGNvbm5lY3Rpb25zIGF2YWlsYWJsZVxuICAgKi9cbiAgYXN5bmMgZ2V0QmVzdEF2YWlsYWJsZUNvbm5lY3Rpb24oZXhjbHVkZWRDb25uZWN0aW9ucz86IE1vbmVyb1JwY0Nvbm5lY3Rpb25bXSk6IFByb21pc2U8TW9uZXJvUnBjQ29ubmVjdGlvbj4ge1xuICAgIFxuICAgIC8vIHRyeSBjb25uZWN0aW9ucyB3aXRoaW4gZWFjaCBhc2NlbmRpbmcgcHJpb3JpdHlcbiAgICBmb3IgKGxldCBwcmlvcml0aXplZENvbm5lY3Rpb25zIG9mIHRoaXMuZ2V0Q29ubmVjdGlvbnNJbkFzY2VuZGluZ1ByaW9yaXR5KCkpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIFxuICAgICAgICAvLyBjcmVhdGUgcHJvbWlzZXMgdG8gY2hlY2sgY29ubmVjdGlvbnNcbiAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xuICAgICAgICBsZXQgY2hlY2tQcm9taXNlcyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBjb25uZWN0aW9uIG9mIHByaW9yaXRpemVkQ29ubmVjdGlvbnMpIHtcbiAgICAgICAgICBpZiAoZXhjbHVkZWRDb25uZWN0aW9ucyAmJiBHZW5VdGlscy5hcnJheUNvbnRhaW5zKGV4Y2x1ZGVkQ29ubmVjdGlvbnMsIGNvbm5lY3Rpb24pKSBjb250aW51ZTtcbiAgICAgICAgICBjaGVja1Byb21pc2VzLnB1c2gobmV3IFByb21pc2UoYXN5bmMgZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICBhd2FpdCBjb25uZWN0aW9uLmNoZWNrQ29ubmVjdGlvbih0aGF0LnRpbWVvdXRNcyk7XG4gICAgICAgICAgICBpZiAoY29ubmVjdGlvbi5pc0Nvbm5lY3RlZCgpKSByZXNvbHZlKGNvbm5lY3Rpb24pO1xuICAgICAgICAgICAgZWxzZSByZWplY3QoKTtcbiAgICAgICAgICB9KSk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIHVzZSBmaXJzdCBhdmFpbGFibGUgY29ubmVjdGlvblxuICAgICAgICBsZXQgZmlyc3RBdmFpbGFibGUgPSBhd2FpdCBQcm9taXNlLmFueShjaGVja1Byb21pc2VzKTtcbiAgICAgICAgaWYgKGZpcnN0QXZhaWxhYmxlKSByZXR1cm4gZmlyc3RBdmFpbGFibGU7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgaWYgKCEoZXJyIGluc3RhbmNlb2YgQWdncmVnYXRlRXJyb3IpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoZXJyKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEF1dG9tYXRpY2FsbHkgc3dpdGNoIHRvIHRoZSBiZXN0IGF2YWlsYWJsZSBjb25uZWN0aW9uIGFzIGNvbm5lY3Rpb25zIGFyZSBwb2xsZWQsIGJhc2VkIG9uIHByaW9yaXR5LCByZXNwb25zZSB0aW1lLCBhbmQgY29uc2lzdGVuY3kuXG4gICAqIFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGF1dG9Td2l0Y2ggc3BlY2lmaWVzIGlmIHRoZSBjb25uZWN0aW9uIHNob3VsZCBhdXRvIHN3aXRjaCB0byBhIGJldHRlciBjb25uZWN0aW9uXG4gICAqIEByZXR1cm4ge01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyfSB0aGlzIGNvbm5lY3Rpb24gbWFuYWdlciBmb3IgY2hhaW5pbmdcbiAgICovXG4gIHNldEF1dG9Td2l0Y2goYXV0b1N3aXRjaDogYm9vbGVhbik6IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyIHtcbiAgICB0aGlzLmF1dG9Td2l0Y2ggPSBhdXRvU3dpdGNoO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGlmIGF1dG8gc3dpdGNoIGlzIGVuYWJsZWQgb3IgZGlzYWJsZWQuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtib29sZWFufSB0cnVlIGlmIGF1dG8gc3dpdGNoIGVuYWJsZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgZ2V0QXV0b1N3aXRjaCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5hdXRvU3dpdGNoO1xuICB9XG4gIFxuICAvKipcbiAgICogU2V0IHRoZSBtYXhpbXVtIHJlcXVlc3QgdGltZSBiZWZvcmUgaXRzIGNvbm5lY3Rpb24gaXMgY29uc2lkZXJlZCBvZmZsaW5lLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IHRpbWVvdXRNcyAtIHRoZSB0aW1lb3V0IGJlZm9yZSB0aGUgY29ubmVjdGlvbiBpcyBjb25zaWRlcmVkIG9mZmxpbmVcbiAgICogQHJldHVybiB7TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJ9IHRoaXMgY29ubmVjdGlvbiBtYW5hZ2VyIGZvciBjaGFpbmluZ1xuICAgKi9cbiAgc2V0VGltZW91dCh0aW1lb3V0TXM6IG51bWJlcik6IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyIHtcbiAgICB0aGlzLnRpbWVvdXRNcyA9IHRpbWVvdXRNcztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgcmVxdWVzdCB0aW1lb3V0LlxuICAgKiBcbiAgICogQHJldHVybiB7bnVtYmVyfSB0aGUgcmVxdWVzdCB0aW1lb3V0IGJlZm9yZSBhIGNvbm5lY3Rpb24gaXMgY29uc2lkZXJlZCBvZmZsaW5lXG4gICAqL1xuICBnZXRUaW1lb3V0KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMudGltZW91dE1zO1xuICB9XG4gIFxuICAvKipcbiAgICogQ29sbGVjdCBjb25uZWN0YWJsZSBwZWVycyBvZiB0aGUgbWFuYWdlZCBjb25uZWN0aW9ucy5cbiAgICpcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9ScGNDb25uZWN0aW9uW10+fSBjb25uZWN0YWJsZSBwZWVyc1xuICAgKi9cbiAgYXN5bmMgZ2V0UGVlckNvbm5lY3Rpb25zKCk6IFByb21pc2U8TW9uZXJvUnBjQ29ubmVjdGlvbltdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IGltcGxlbWVudGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogRGlzY29ubmVjdCBmcm9tIHRoZSBjdXJyZW50IGNvbm5lY3Rpb24uXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyPn0gdGhpcyBjb25uZWN0aW9uIG1hbmFnZXIgZm9yIGNoYWluaW5nXG4gICAqL1xuICBhc3luYyBkaXNjb25uZWN0KCk6IFByb21pc2U8TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXI+IHtcbiAgICBhd2FpdCB0aGlzLnNldENvbm5lY3Rpb24odW5kZWZpbmVkKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgLyoqXG4gICAqIFJlbW92ZSBhbGwgY29ubmVjdGlvbnMuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyPn0gdGhpcyBjb25uZWN0aW9uIG1hbmFnZXIgZm9yIGNoYWluaW5nXG4gICAqL1xuICBhc3luYyBjbGVhcigpOiBQcm9taXNlPE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyPiB7XG4gICAgdGhpcy5jb25uZWN0aW9ucy5zcGxpY2UoMCwgdGhpcy5jb25uZWN0aW9ucy5sZW5ndGgpO1xuICAgIGlmICh0aGlzLmN1cnJlbnRDb25uZWN0aW9uKSB7XG4gICAgICB0aGlzLmN1cnJlbnRDb25uZWN0aW9uID0gdW5kZWZpbmVkO1xuICAgICAgYXdhaXQgdGhpcy5vbkNvbm5lY3Rpb25DaGFuZ2VkKHVuZGVmaW5lZCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICAvKipcbiAgICogUmVzZXQgdG8gZGVmYXVsdCBzdGF0ZS5cbiAgICogXG4gICAqIEByZXR1cm4ge01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyfSB0aGlzIGNvbm5lY3Rpb24gbWFuYWdlciBmb3IgY2hhaW5pbmdcbiAgICovXG4gIHJlc2V0KCk6IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVycygpO1xuICAgIHRoaXMuc3RvcFBvbGxpbmcoKTtcbiAgICB0aGlzLmNsZWFyKCk7XG4gICAgdGhpcy50aW1lb3V0TXMgPSBNb25lcm9Db25uZWN0aW9uTWFuYWdlci5ERUZBVUxUX1RJTUVPVVQ7XG4gICAgdGhpcy5hdXRvU3dpdGNoID0gTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIuREVGQVVMVF9BVVRPX1NXSVRDSDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIEhFTFBFUlMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICBwcm90ZWN0ZWQgYXN5bmMgb25Db25uZWN0aW9uQ2hhbmdlZChjb25uZWN0aW9uKSB7XG4gICAgbGV0IHByb21pc2VzID0gW107XG4gICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgdGhpcy5saXN0ZW5lcnMpIHByb21pc2VzLnB1c2gobGlzdGVuZXIub25Db25uZWN0aW9uQ2hhbmdlZChjb25uZWN0aW9uKSk7XG4gICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGdldENvbm5lY3Rpb25zSW5Bc2NlbmRpbmdQcmlvcml0eSgpIHtcbiAgICBsZXQgY29ubmVjdGlvblByaW9yaXRpZXMgPSBuZXcgTWFwKCk7XG4gICAgZm9yIChsZXQgY29ubmVjdGlvbiBvZiB0aGlzLmNvbm5lY3Rpb25zKSB7XG4gICAgICBpZiAoIWNvbm5lY3Rpb25Qcmlvcml0aWVzLmhhcyhjb25uZWN0aW9uLmdldFByaW9yaXR5KCkpKSBjb25uZWN0aW9uUHJpb3JpdGllcy5zZXQoY29ubmVjdGlvbi5nZXRQcmlvcml0eSgpLCBbXSk7XG4gICAgICBjb25uZWN0aW9uUHJpb3JpdGllcy5nZXQoY29ubmVjdGlvbi5nZXRQcmlvcml0eSgpKS5wdXNoKGNvbm5lY3Rpb24pO1xuICAgIH1cbiAgICBsZXQgYXNjZW5kaW5nUHJpb3JpdGllcyA9IG5ldyBNYXAoWy4uLmNvbm5lY3Rpb25Qcmlvcml0aWVzXS5zb3J0KChhLCBiKSA9PiBwYXJzZUludChhWzBdKSAtIHBhcnNlSW50KGJbMF0pKSk7IC8vIGNyZWF0ZSBtYXAgaW4gYXNjZW5kaW5nIG9yZGVyXG4gICAgbGV0IGFzY2VuZGluZ1ByaW9yaXRpZXNMaXN0ID0gW107XG4gICAgZm9yIChsZXQgcHJpb3JpdHlDb25uZWN0aW9ucyBvZiBhc2NlbmRpbmdQcmlvcml0aWVzLnZhbHVlcygpKSBhc2NlbmRpbmdQcmlvcml0aWVzTGlzdC5wdXNoKHByaW9yaXR5Q29ubmVjdGlvbnMpO1xuICAgIGlmIChjb25uZWN0aW9uUHJpb3JpdGllcy5oYXMoMCkpIGFzY2VuZGluZ1ByaW9yaXRpZXNMaXN0LnB1c2goYXNjZW5kaW5nUHJpb3JpdGllc0xpc3Quc3BsaWNlKDAsIDEpWzBdKTsgLy8gbW92ZSBwcmlvcml0eSAwIHRvIGVuZFxuICAgIHJldHVybiBhc2NlbmRpbmdQcmlvcml0aWVzTGlzdDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIGNvbXBhcmVDb25uZWN0aW9ucyhjMSwgYzIpIHtcbiAgICBcbiAgICAgIC8vIGN1cnJlbnQgY29ubmVjdGlvbiBpcyBmaXJzdFxuICAgICAgaWYgKGMxID09PSB0aGlzLmN1cnJlbnRDb25uZWN0aW9uKSByZXR1cm4gLTE7XG4gICAgICBpZiAoYzIgPT09IHRoaXMuY3VycmVudENvbm5lY3Rpb24pIHJldHVybiAxO1xuICAgICAgXG4gICAgICAvLyBvcmRlciBieSBhdmFpbGFiaWxpdHkgdGhlbiBwcmlvcml0eSB0aGVuIGJ5IG5hbWVcbiAgICAgIGlmIChjMS5nZXRJc09ubGluZSgpID09PSBjMi5nZXRJc09ubGluZSgpKSB7XG4gICAgICAgIGlmIChjMS5nZXRQcmlvcml0eSgpID09PSBjMi5nZXRQcmlvcml0eSgpKSByZXR1cm4gYzEuZ2V0VXJpKCkubG9jYWxlQ29tcGFyZShjMi5nZXRVcmkoKSk7XG4gICAgICAgIGVsc2UgcmV0dXJuIGMxLmdldFByaW9yaXR5KCkgPT0gMCA/IDEgOiBjMi5nZXRQcmlvcml0eSgpID09IDAgPyAtMSA6IGMxLmdldFByaW9yaXR5KCkgLSBjMi5nZXRQcmlvcml0eSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGMxLmdldElzT25saW5lKCkpIHJldHVybiAtMTtcbiAgICAgICAgZWxzZSBpZiAoYzIuZ2V0SXNPbmxpbmUoKSkgcmV0dXJuIDE7XG4gICAgICAgIGVsc2UgaWYgKGMxLmdldElzT25saW5lKCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIC0xO1xuICAgICAgICBlbHNlIHJldHVybiAxOyAvLyBjMSBpcyBvZmZsaW5lXG4gICAgICB9XG4gIH1cblxuICBwcm90ZWN0ZWQgc3RhcnRQb2xsaW5nQ29ubmVjdGlvbihwZXJpb2RNcykge1xuICAgIHRoaXMucG9sbGVyID0gbmV3IFRhc2tMb29wZXIoYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHsgYXdhaXQgdGhpcy5jaGVja0Nvbm5lY3Rpb24oKTsgfVxuICAgICAgY2F0Y2ggKGVycikgeyBjb25zb2xlLmxvZyhlcnIpOyB9XG4gICAgfSk7XG4gICAgdGhpcy5wb2xsZXIuc3RhcnQocGVyaW9kTXMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcHJvdGVjdGVkIHN0YXJ0UG9sbGluZ0Nvbm5lY3Rpb25zKHBlcmlvZE1zKSB7XG4gICAgdGhpcy5wb2xsZXIgPSBuZXcgVGFza0xvb3Blcihhc3luYyAoKSA9PiB7XG4gICAgICB0cnkgeyBhd2FpdCB0aGlzLmNoZWNrQ29ubmVjdGlvbnMoKTsgfVxuICAgICAgY2F0Y2ggKGVycikgeyBjb25zb2xlLmxvZyhlcnIpOyB9XG4gICAgfSk7XG4gICAgdGhpcy5wb2xsZXIuc3RhcnQocGVyaW9kTXMpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcHJvdGVjdGVkIHN0YXJ0UG9sbGluZ1ByaW9yaXRpemVkQ29ubmVjdGlvbnMocGVyaW9kTXMsIGV4Y2x1ZGVkQ29ubmVjdGlvbnMpIHtcbiAgICB0aGlzLnBvbGxlciA9IG5ldyBUYXNrTG9vcGVyKGFzeW5jICgpID0+IHtcbiAgICAgIHRyeSB7IGF3YWl0IHRoaXMuY2hlY2tQcmlvcml0aXplZENvbm5lY3Rpb25zKGV4Y2x1ZGVkQ29ubmVjdGlvbnMpOyB9XG4gICAgICBjYXRjaCAoZXJyKSB7IGNvbnNvbGUubG9nKGVycik7IH1cbiAgICB9KTtcbiAgICB0aGlzLnBvbGxlci5zdGFydChwZXJpb2RNcyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBhc3luYyBjaGVja1ByaW9yaXRpemVkQ29ubmVjdGlvbnMoZXhjbHVkZWRDb25uZWN0aW9ucykge1xuICAgIGZvciAobGV0IHByaW9yaXRpemVkQ29ubmVjdGlvbnMgb2YgdGhpcy5nZXRDb25uZWN0aW9uc0luQXNjZW5kaW5nUHJpb3JpdHkoKSkge1xuICAgICAgbGV0IGhhc0Nvbm5lY3Rpb24gPSBhd2FpdCB0aGlzLmNoZWNrQ29ubmVjdGlvbnNBdXgocHJpb3JpdGl6ZWRDb25uZWN0aW9ucywgZXhjbHVkZWRDb25uZWN0aW9ucyk7XG4gICAgICBpZiAoaGFzQ29ubmVjdGlvbikgcmV0dXJuO1xuICAgIH1cbiAgfVxuXG4gIHByb3RlY3RlZCBhc3luYyBjaGVja0Nvbm5lY3Rpb25zQXV4KGNvbm5lY3Rpb25zLCBleGNsdWRlZENvbm5lY3Rpb25zPykge1xuICAgIHRyeSB7XG5cbiAgICAgIC8vIGNoZWNrIGNvbm5lY3Rpb25zIGluIHBhcmFsbGVsXG4gICAgICBsZXQgdGhhdCA9IHRoaXM7XG4gICAgICBsZXQgY2hlY2tQcm9taXNlcyA9IFtdO1xuICAgICAgbGV0IGhhc0Nvbm5lY3Rpb24gPSBmYWxzZTtcbiAgICAgIGZvciAobGV0IGNvbm5lY3Rpb24gb2YgY29ubmVjdGlvbnMpIHtcbiAgICAgICAgaWYgKGV4Y2x1ZGVkQ29ubmVjdGlvbnMgJiYgR2VuVXRpbHMuYXJyYXlDb250YWlucyhleGNsdWRlZENvbm5lY3Rpb25zLCBjb25uZWN0aW9uKSkgY29udGludWU7XG4gICAgICAgIGNoZWNrUHJvbWlzZXMucHVzaChuZXcgUHJvbWlzZShhc3luYyBmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IGNoYW5nZSA9IGF3YWl0IGNvbm5lY3Rpb24uY2hlY2tDb25uZWN0aW9uKHRoYXQudGltZW91dE1zKTtcbiAgICAgICAgICAgIGlmIChjaGFuZ2UgJiYgY29ubmVjdGlvbiA9PT0gdGhhdC5nZXRDb25uZWN0aW9uKCkpIGF3YWl0IHRoYXQub25Db25uZWN0aW9uQ2hhbmdlZChjb25uZWN0aW9uKTtcbiAgICAgICAgICAgIGlmIChjb25uZWN0aW9uLmlzQ29ubmVjdGVkKCkgJiYgIWhhc0Nvbm5lY3Rpb24pIHtcbiAgICAgICAgICAgICAgaGFzQ29ubmVjdGlvbiA9IHRydWU7XG4gICAgICAgICAgICAgIGlmICghdGhhdC5pc0Nvbm5lY3RlZCgpICYmIHRoYXQuYXV0b1N3aXRjaCkgYXdhaXQgdGhhdC5zZXRDb25uZWN0aW9uKGNvbm5lY3Rpb24pOyAvLyBzZXQgZmlyc3QgYXZhaWxhYmxlIGNvbm5lY3Rpb24gaWYgZGlzY29ubmVjdGVkXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXNvbHZlKHVuZGVmaW5lZCk7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICAgIH1cbiAgICAgIGF3YWl0IFByb21pc2UuYWxsKGNoZWNrUHJvbWlzZXMpO1xuXG4gICAgICAvLyBwcm9jZXNzIHJlc3BvbnNlc1xuICAgICAgYXdhaXQgdGhpcy5wcm9jZXNzUmVzcG9uc2VzKGNvbm5lY3Rpb25zKTtcbiAgICAgIHJldHVybiBoYXNDb25uZWN0aW9uO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKGVycik7XG4gICAgfVxuICB9XG5cbiAgcHJvdGVjdGVkIGFzeW5jIHByb2Nlc3NSZXNwb25zZXMocmVzcG9uc2VzKSB7XG5cbiAgICAvLyBhZGQgbm9uLWV4aXN0aW5nIGNvbm5lY3Rpb25zXG4gICAgZm9yIChsZXQgY29ubmVjdGlvbiBvZiByZXNwb25zZXMpIHtcbiAgICAgIGlmICghdGhpcy5yZXNwb25zZVRpbWVzLmhhcyhjb25uZWN0aW9uLmdldFVyaSgpKSkgdGhpcy5yZXNwb25zZVRpbWVzLnNldChjb25uZWN0aW9uLmdldFVyaSgpLCBbXSk7XG4gICAgfVxuXG4gICAgLy8gaW5zZXJ0IHJlc3BvbnNlIHRpbWVzIG9yIHVuZGVmaW5lZFxuICAgIHRoaXMucmVzcG9uc2VUaW1lcy5mb3JFYWNoKCh0aW1lcywgY29ubmVjdGlvbikgPT4ge1xuICAgICAgdGltZXMudW5zaGlmdChHZW5VdGlscy5hcnJheUNvbnRhaW5zKHJlc3BvbnNlcywgY29ubmVjdGlvbikgPyBjb25uZWN0aW9uLmdldFJlc3BvbnNlVGltZSgpIDogdW5kZWZpbmVkKTtcblxuICAgICAgLy8gcmVtb3ZlIG9sZCByZXNwb25zZSB0aW1lc1xuICAgICAgaWYgKHRpbWVzLmxlbmd0aCA+IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyLk1JTl9CRVRURVJfUkVTUE9OU0VTKSB0aW1lcy5wb3AoKTtcbiAgICB9KTtcblxuICAgIC8vIHVwZGF0ZSBiZXN0IGNvbm5lY3Rpb24gYmFzZWQgb24gcmVzcG9uc2VzIGFuZCBwcmlvcml0eVxuICAgIGF3YWl0IHRoaXMudXBkYXRlQmVzdENvbm5lY3Rpb25JblByaW9yaXR5KCk7XG4gIH1cblxuICBwcm90ZWN0ZWQgYXN5bmMgdXBkYXRlQmVzdENvbm5lY3Rpb25JblByaW9yaXR5KCkge1xuICAgIGlmICghdGhpcy5hdXRvU3dpdGNoKSByZXR1cm47XG4gICAgZm9yIChsZXQgcHJpb3JpdGl6ZWRDb25uZWN0aW9ucyBvZiB0aGlzLmdldENvbm5lY3Rpb25zSW5Bc2NlbmRpbmdQcmlvcml0eSgpKSB7XG4gICAgICBpZiAoYXdhaXQgdGhpcy51cGRhdGVCZXN0Q29ubmVjdGlvbkZyb21SZXNwb25zZXMocHJpb3JpdGl6ZWRDb25uZWN0aW9ucykpIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gcHJvdGVjdGVkIGFzeW5jIHVwZGF0ZUJlc3RDb25uZWN0aW9uRnJvbVJlc3BvbnNlcyhyZXNwb25zZXMpIHtcbiAgICBsZXQgYmVzdENvbm5lY3Rpb24gPSB0aGlzLmlzQ29ubmVjdGVkKCkgPyB0aGlzLmdldENvbm5lY3Rpb24oKSA6IHVuZGVmaW5lZDtcbiAgICBpZiAoYmVzdENvbm5lY3Rpb24gJiYgKCF0aGlzLnJlc3BvbnNlVGltZXMuaGFzKGJlc3RDb25uZWN0aW9uLmdldFVyaSgpKSB8fCB0aGlzLnJlc3BvbnNlVGltZXMuZ2V0KGJlc3RDb25uZWN0aW9uLmdldFVyaSgpKS5sZW5ndGggPCBNb25lcm9Db25uZWN0aW9uTWFuYWdlci5NSU5fQkVUVEVSX1JFU1BPTlNFUykpIHJldHVybiBiZXN0Q29ubmVjdGlvbjtcbiAgICBpZiAodGhpcy5pc0Nvbm5lY3RlZCgpKSB7XG5cbiAgICAgIC8vIGNoZWNrIGlmIGNvbm5lY3Rpb24gaXMgY29uc2lzdGVudGx5IGJldHRlclxuICAgICAgZm9yIChsZXQgY29ubmVjdGlvbiBvZiByZXNwb25zZXMpIHtcbiAgICAgICAgaWYgKGNvbm5lY3Rpb24gPT09IGJlc3RDb25uZWN0aW9uKSBjb250aW51ZTtcbiAgICAgICAgaWYgKCF0aGlzLnJlc3BvbnNlVGltZXMuaGFzKGNvbm5lY3Rpb24uZ2V0VXJpKCkpIHx8IHRoaXMucmVzcG9uc2VUaW1lcy5nZXQoY29ubmVjdGlvbi5nZXRVcmkoKSkubGVuZ3RoIDwgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIuTUlOX0JFVFRFUl9SRVNQT05TRVMpIGNvbnRpbnVlO1xuICAgICAgICBsZXQgYmV0dGVyID0gdHJ1ZTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBNb25lcm9Db25uZWN0aW9uTWFuYWdlci5NSU5fQkVUVEVSX1JFU1BPTlNFUzsgaSsrKSB7XG4gICAgICAgICAgaWYgKHRoaXMucmVzcG9uc2VUaW1lcy5nZXQoY29ubmVjdGlvbi5nZXRVcmkoKSlbaV0gPT09IHVuZGVmaW5lZCB8fCB0aGlzLnJlc3BvbnNlVGltZXMuZ2V0KGNvbm5lY3Rpb24uZ2V0VXJpKCkpW2ldID49IHRoaXMucmVzcG9uc2VUaW1lcy5nZXQoYmVzdENvbm5lY3Rpb24uZ2V0VXJpKCkpW2ldKSB7XG4gICAgICAgICAgICBiZXR0ZXIgPSBmYWxzZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoYmV0dGVyKSBiZXN0Q29ubmVjdGlvbiA9IGNvbm5lY3Rpb247XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAobGV0IGNvbm5lY3Rpb24gb2YgcmVzcG9uc2VzKSB7XG4gICAgICAgIGlmIChjb25uZWN0aW9uLmlzQ29ubmVjdGVkKCkgJiYgKCFiZXN0Q29ubmVjdGlvbiB8fCBjb25uZWN0aW9uLmdldFJlc3BvbnNlVGltZSgpIDwgYmVzdENvbm5lY3Rpb24uZ2V0UmVzcG9uc2VUaW1lKCkpKSBiZXN0Q29ubmVjdGlvbiA9IGNvbm5lY3Rpb247XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChiZXN0Q29ubmVjdGlvbikgYXdhaXQgdGhpcy5zZXRDb25uZWN0aW9uKGJlc3RDb25uZWN0aW9uKTtcbiAgICByZXR1cm4gYmVzdENvbm5lY3Rpb247XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLFNBQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLFdBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLFdBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTs7QUFFQSxJQUFBRyxZQUFBLEdBQUFKLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBSSxvQkFBQSxHQUFBTCxzQkFBQSxDQUFBQyxPQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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