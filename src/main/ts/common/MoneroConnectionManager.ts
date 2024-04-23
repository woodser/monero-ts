import GenUtils from "./GenUtils";
import TaskLooper from "./TaskLooper";
import ThreadPool from "./ThreadPool";
import MoneroConnectionManagerListener from "./MoneroConnectionManagerListener";
import MoneroError from "./MoneroError";
import MoneroRpcConnection from "./MoneroRpcConnection";

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
export default class MoneroConnectionManager {

  // static variables
  static DEFAULT_TIMEOUT = 5000;
  static DEFAULT_POLL_PERIOD = 20000;
  static DEFAULT_AUTO_SWITCH = true;
  static MIN_BETTER_RESPONSES = 3;

  // instance variables
  protected proxyToWorker: any;
  protected timeoutMs: any;
  protected autoSwitch: any;
  protected connections: any;
  protected responseTimes: any;
  protected listeners: any;
  protected currentConnection: any;
  protected poller: any;

  /**
   * Specify behavior when polling.
   * 
   * One of PRIORITIZED (poll connections in order of priority until connected; default), CURRENT (poll current connection), or ALL (poll all connections).
   */
  static PollType = {
    PRIORITIZED: 0,
    CURRENT: 1,
    ALL: 2
  }
  
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
  addListener(listener: MoneroConnectionManagerListener): MoneroConnectionManager {
    this.listeners.push(listener);
    return this;
  }
  
  /**
   * Remove a listener.
   * 
   * @param {MoneroConnectionManagerListener} listener - the listener to remove
   * @return {MoneroConnectionManager} this connection manager for chaining
   */
  removeListener(listener: MoneroConnectionManagerListener): MoneroConnectionManager {
    if (!GenUtils.remove(this.listeners, listener)) throw new MoneroError("Monero connection manager does not contain listener to remove");
    return this;
  }
  
  /**
   * Remove all listeners.
   * 
   * @return {MoneroConnectionManager} this connection manager for chaining
   */
  removeListeners(): MoneroConnectionManager {
    this.listeners.splice(0, this.listeners.length);
    return this;
  }

  /**
   * Get all listeners.
   * 
   * @return {MoneroConnectionManagerListener[]} all listeners
   */
  getListeners(): MoneroConnectionManagerListener[] {
    return this.listeners
  }

  /**
   * Add a connection. The connection may have an elevated priority for this manager to use.
   * 
   * @param {string|Partial<MoneroRpcConnection>} uriOrConnection - uri or connection to add
   * @return {Promise<MoneroConnectionManager>} this connection manager for chaining
   */
  async addConnection(uriOrConnection: string | Partial<MoneroRpcConnection>): Promise<MoneroConnectionManager> {
    let connection = uriOrConnection instanceof MoneroRpcConnection ? uriOrConnection : new MoneroRpcConnection(uriOrConnection);
    for (let aConnection of this.connections) {
      if (aConnection.getUri() === connection.getUri()) throw new MoneroError("Connection URI already exists");
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
  async removeConnection(uri: string): Promise<MoneroConnectionManager> {
    let connection = this.getConnectionByUri(uri);
    if (!connection) throw new MoneroError("No connection exists with URI: " + uri);
    GenUtils.remove(this.connections, connection);
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
  async setConnection(uriOrConnection?: string | Partial<MoneroRpcConnection>): Promise<MoneroConnectionManager> {
    
    // handle uri
    if (uriOrConnection && typeof uriOrConnection === "string") {
      let connection = this.getConnectionByUri(uriOrConnection);
      return this.setConnection(connection === undefined ? new MoneroRpcConnection(uriOrConnection) : connection);
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
    if (!(connection instanceof MoneroRpcConnection)) connection = new MoneroRpcConnection(connection);
    if (!connection.getUri()) throw new MoneroError("Connection is missing URI");

    // add or replace connection
    let prevConnection = this.getConnectionByUri(connection.getUri());
    if (prevConnection) GenUtils.remove(this.connections, prevConnection);
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
  getConnection(): MoneroRpcConnection {
    return this.currentConnection;
  }

  /**
   * Indicates if this manager has a connection with the given URI.
   * 
   * @param {string} uri URI of the connection to check
   * @return {boolean} true if this manager has a connection with the given URI, false otherwise
   */
  hasConnection(uri: string): boolean {
    return this.getConnectionByUri(uri) !== undefined;
  }
  
  /**
   * Get a connection by URI.
   * 
   * @param {string} uri is the URI of the connection to get
   * @return {MoneroRpcConnection} the connection with the URI or undefined if no connection with the URI exists
   */
  getConnectionByUri(uri: string): MoneroRpcConnection {
    for (let connection of this.connections) if (connection.getUri() === uri) return connection;
    return undefined;
  }
  
  /**
   * Get all connections in order of current connection (if applicable), online status, priority, and name.
   * 
   * @return {MoneroRpcConnection[]} the list of sorted connections
   */
  getConnections(): MoneroRpcConnection[] {
    let sortedConnections = GenUtils.copyArray(this.connections);
    sortedConnections.sort(this.compareConnections.bind(this));
    return sortedConnections;
  }

  /**
   * Indicates if the connection manager is connected to a node.
   * 
   * @return {boolean|undefined} true if the current connection is set, online, and not unauthenticated, undefined if unknown, false otherwise
   */
  isConnected(): boolean | undefined {
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
  startPolling(periodMs?: number, autoSwitch?: boolean, timeoutMs?: number, pollType?: number, excludedConnections?: MoneroRpcConnection[]): MoneroConnectionManager {

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
  stopPolling(): MoneroConnectionManager {
    if (this.poller) this.poller.stop();
    this.poller = undefined;
    return this;
  }

  /**
   * Check the current connection. If disconnected and auto switch enabled, switches to best available connection.
   * 
   * @return {Promise<MoneroConnectionManager>} this connection manager for chaining
   */
  async checkConnection(): Promise<MoneroConnectionManager> {
    let connectionChanged = false;
    let connection = this.getConnection();
    if (connection) {
      if (await connection.checkConnection(this.timeoutMs)) connectionChanged = true;
      if (await this.processResponses([connection]) !== undefined) return this; // done if connection set from responses
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
  async checkConnections(): Promise<MoneroConnectionManager> {
    await this.checkConnectionsAux(this.getConnections());
    return this;
  }

  /**
   * Check all managed connections, returning a promise for each connection check.
   * Does not auto switch if disconnected.
   *
   * @return {Promise[]} a promise for each connection in the order of getConnections().
   */
  checkConnectionPromises(): Promise<void>[] {
    let checkPromises = [];
    let pool = new ThreadPool(this.connections.length);
    for (let connection of this.getConnections()) {
      checkPromises.push(pool.submit(async () => {
        try {
          if (await connection.checkConnection(this.timeoutMs) && connection === this.currentConnection) await this.onConnectionChanged(connection);
        } catch (err) {
          // ignore error
        }
      }));
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
  async getBestAvailableConnection(excludedConnections?: MoneroRpcConnection[]): Promise<MoneroRpcConnection> {
    
    // try connections within each ascending priority
    for (let prioritizedConnections of this.getConnectionsInAscendingPriority()) {
      try {
        
        // create promises to check connections
        let that = this;
        let checkPromises = [];
        for (let connection of prioritizedConnections) {
          if (excludedConnections && GenUtils.arrayContains(excludedConnections, connection)) continue;
          checkPromises.push(new Promise(async function(resolve, reject) {
            await connection.checkConnection(that.timeoutMs);
            if (connection.isConnected()) resolve(connection);
            else reject();
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
   * Automatically switch to the best available connection as connections are polled, based on priority, response time, and consistency.
   * 
   * @param {boolean} autoSwitch specifies if the connection should auto switch to a better connection
   * @return {MoneroConnectionManager} this connection manager for chaining
   */
  setAutoSwitch(autoSwitch: boolean): MoneroConnectionManager {
    this.autoSwitch = autoSwitch;
    return this;
  }
  
  /**
   * Get if auto switch is enabled or disabled.
   * 
   * @return {boolean} true if auto switch enabled, false otherwise
   */
  getAutoSwitch(): boolean {
    return this.autoSwitch;
  }
  
  /**
   * Set the maximum request time before its connection is considered offline.
   * 
   * @param {number} timeoutMs - the timeout before the connection is considered offline
   * @return {MoneroConnectionManager} this connection manager for chaining
   */
  setTimeout(timeoutMs: number): MoneroConnectionManager {
    this.timeoutMs = timeoutMs;
    return this;
  }
  
  /**
   * Get the request timeout.
   * 
   * @return {number} the request timeout before a connection is considered offline
   */
  getTimeout(): number {
    return this.timeoutMs;
  }
  
  /**
   * Collect connectable peers of the managed connections.
   *
   * @return {Promise<MoneroRpcConnection[]>} connectable peers
   */
  async getPeerConnections(): Promise<MoneroRpcConnection[]> {
    throw new MoneroError("Not implemented");
  }
  
  /**
   * Disconnect from the current connection.
   * 
   * @return {Promise<MoneroConnectionManager>} this connection manager for chaining
   */
  async disconnect(): Promise<MoneroConnectionManager> {
    await this.setConnection(undefined);
    return this;
  }
  
  /**
   * Remove all connections.
   * 
   * @return {Promise<MoneroConnectionManager>} this connection manager for chaining
   */
  async clear(): Promise<MoneroConnectionManager> {
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
  reset(): MoneroConnectionManager {
    this.removeListeners();
    this.stopPolling();
    this.clear();
    this.timeoutMs = MoneroConnectionManager.DEFAULT_TIMEOUT;
    this.autoSwitch = MoneroConnectionManager.DEFAULT_AUTO_SWITCH;
    return this;
  }

  // ------------------------------ PRIVATE HELPERS ---------------------------
  
  protected async onConnectionChanged(connection) {
    let promises = [];
    for (let listener of this.listeners) promises.push(listener.onConnectionChanged(connection));
    return Promise.all(promises);
  }
  
  protected getConnectionsInAscendingPriority() {
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
  
  protected compareConnections(c1, c2) {
    
      // current connection is first
      if (c1 === this.currentConnection) return -1;
      if (c2 === this.currentConnection) return 1;
      
      // order by availability then priority then by name
      if (c1.getIsOnline() === c2.getIsOnline()) {
        if (c1.getPriority() === c2.getPriority()) return c1.getUri().localeCompare(c2.getUri());
        return this.comparePriorities(c1.getPriority(), c2.getPriority()) * -1 // order by priority in descending order
      } else {
        if (c1.getIsOnline()) return -1;
        else if (c2.getIsOnline()) return 1;
        else if (c1.getIsOnline() === undefined) return -1;
        else return 1; // c1 is offline
      }
  }

  protected comparePriorities(p1, p2) {
    if (p1 == p2) return 0;
    if (p1 == 0) return -1;
    if (p2 == 0) return 1;
    return p2 - p1;
  }

  protected startPollingConnection(periodMs) {
    this.poller = new TaskLooper(async () => {
      try { await this.checkConnection(); }
      catch (err) { console.log(err); }
    });
    this.poller.start(periodMs);
    return this;
  }

  protected startPollingConnections(periodMs) {
    this.poller = new TaskLooper(async () => {
      try { await this.checkConnections(); }
      catch (err) { console.log(err); }
    });
    this.poller.start(periodMs);
    return this;
  }

  protected startPollingPrioritizedConnections(periodMs, excludedConnections) {
    this.poller = new TaskLooper(async () => {
      try { await this.checkPrioritizedConnections(excludedConnections); }
      catch (err) { console.log(err); }
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

  protected async checkConnectionsAux(connections, excludedConnections?) {
    try {

      // check connections in parallel
      let that = this;
      let checkPromises = [];
      let hasConnection = false;
      for (let connection of connections) {
        if (excludedConnections && GenUtils.arrayContains(excludedConnections, connection)) continue;
        checkPromises.push(new Promise(async function(resolve, reject) {
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
      throw new MoneroError(err);
    }
  }

  protected async processResponses(responses): Promise<MoneroRpcConnection> {

    // add new connections
    for (let connection of responses) {
      if (!this.responseTimes.has(connection.getUri())) this.responseTimes.set(connection.getUri(), []);
    }

    // insert response times or undefined
    this.responseTimes.forEach((times, connection) => {
      times.unshift(GenUtils.arrayContains(responses, connection) ? connection.getResponseTime() : undefined);

      // remove old response times
      if (times.length > MoneroConnectionManager.MIN_BETTER_RESPONSES) times.pop();
    });

    // update best connection based on responses and priority
    return await this.updateBestConnectionInPriority();
  }

  protected async updateBestConnectionInPriority(): Promise<MoneroRpcConnection> {
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
  protected async getBestConnectionFromPrioritizedResponses(responses): Promise<MoneroRpcConnection> {

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
}
