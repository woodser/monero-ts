export = MoneroConnectionManager;
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
declare class MoneroConnectionManager {
    /**
     * Construct a connection manager.
     *
     * @param {boolean} proxyToWorker - configure all connections to proxy to worker (default true)
     */
    constructor(proxyToWorker: boolean);
    _proxyToWorker: boolean;
    _timeoutInMs: number;
    _connections: any[];
    _listeners: any[];
    /**
     * Add a listener to receive notifications when the connection changes.
     *
     * @param {MoneroConnectionManagerListener} listener - the listener to add
     * @return {MoneroConnectionManager} this connection manager for chaining
     */
    addListener(listener: MoneroConnectionManagerListener): MoneroConnectionManager;
    /**
     * Remove a listener.
     *
     * @param {MoneroConnectionManagerListener} listener - the listener to remove
     * @return {MoneroConnectionManager} this connection manager for chaining
     */
    removeListener(listener: MoneroConnectionManagerListener): MoneroConnectionManager;
    /**
     * Remove all listeners.
     *
     * @return {MoneroConnectionManager} this connection manager for chaining
     */
    removeListeners(): MoneroConnectionManager;
    /**
     * Add a connection. The connection may have an elevated priority for this manager to use.
     *
     * @param {MoneroRpcConnection} connection - the connection to add
     * @return {Promise<MoneroConnectionManager>} this connection manager for chaining
     */
    addConnection(connection: MoneroRpcConnection): Promise<MoneroConnectionManager>;
    /**
     * Remove a connection.
     *
     * @param {string} uri - of the the connection to remove
     * @return {Promise<MoneroConnectionManager>} this connection manager for chaining
     */
    removeConnection(uri: string): Promise<MoneroConnectionManager>;
    _currentConnection: any;
    /**
     * Indicates if the connection manager is connected to a node.
     *
     * @return {boolean|undefined} true if the current connection is set, online, and not unauthenticated, undefined if unknown, false otherwise
     */
    isConnected(): boolean | undefined;
    /**
     * Get the current connection.
     *
     * @return {MoneroRpcConnection} the current connection or undefined if no connection set
     */
    getConnection(): MoneroRpcConnection;
    /**
     * Get a connection by URI.
     *
     * @param {string} uri is the URI of the connection to get
     * @return {MoneroRpcConnection} the connection with the URI or undefined if no connection with the URI exists
     */
    getConnectionByUri(uri: string): MoneroRpcConnection;
    /**
     * Get all connections in order of current connection (if applicable), online status, priority, and name.
     *
     * @return {MoneroRpcConnection[]} the list of sorted connections
     */
    getConnections(): MoneroRpcConnection[];
    /**
     * Get the best available connection in order of priority then response time.
     *
     * @param {MoneroRpcConnection[]} excludedConnections - connections to be excluded from consideration (optional)
     * @return {Promise<MoneroRpcConnection>} the best available connection in order of priority then response time, undefined if no connections available
     */
    getBestAvailableConnection(excludedConnections: MoneroRpcConnection[]): Promise<MoneroRpcConnection>;
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
    setConnection(uriOrConnection: string | MoneroRpcConnection): MoneroConnectionManager;
    /**
     * Check the current connection. If disconnected and auto switch enabled, switches to best available connection.
     *
     * @return {Promise<MoneroConnectionManager>} this connection manager for chaining
     */
    checkConnection(): Promise<MoneroConnectionManager>;
    /**
     * Check all managed connections.
     *
     * @return {Promise<MoneroConnectionManager>} this connection manager for chaining
     */
    checkConnections(): Promise<MoneroConnectionManager>;
    /**
     * Check all managed connections, returning a promise for each connection check.
     * Does not auto switch if disconnected.
     *
     * @return {Promise[]} a promise for each connection in the order of getConnections().
     */
    checkConnectionPromises(): Promise<any>[];
    /**
     * Check the connection and start checking the connection periodically.
     *
     * @param {number} periodMs is the time between checks in milliseconds (default 10000 or 10 seconds)
     * @return {Promise<MoneroConnectionManager>} this connection manager for chaining (after first checking the connection)
     */
    startCheckingConnection(periodMs: number): Promise<MoneroConnectionManager>;
    _checkLooper: TaskLooper;
    /**
     * Stop checking the connection status periodically.
     *
     * @return {MoneroConnectionManager} this connection manager for chaining
     */
    stopCheckingConnection(): MoneroConnectionManager;
    /**
     * Automatically switch to best available connection if current connection is disconnected after being checked.
     *
     * @param {boolean} autoSwitch specifies if the connection should switch on disconnect
     * @return {MoneroConnectionManager} this connection manager for chaining
     */
    setAutoSwitch(autoSwitch: boolean): MoneroConnectionManager;
    _autoSwitch: boolean;
    /**
     * Get if auto switch is enabled or disabled.
     *
     * @return {boolean} true if auto switch enabled, false otherwise
     */
    getAutoSwitch(): boolean;
    /**
     * Set the maximum request time before its connection is considered offline.
     *
     * @param {int} timeoutInMs - the timeout before the connection is considered offline
     * @return {MoneroConnectionManager} this connection manager for chaining
     */
    setTimeout(timeoutInMs: int): MoneroConnectionManager;
    /**
     * Get the request timeout.
     *
     * @return {int} the request timeout before a connection is considered offline
     */
    getTimeout(): int;
    /**
     * Collect connectable peers of the managed connections.
     *
     * @return {MoneroRpcConnection[]} connectable peers
     */
    getPeerConnections(): MoneroRpcConnection[];
    /**
     * Disconnect from the current connection.
     *
     * @return {MoneroConnectionManager} this connection manager for chaining
     */
    disconnect(): MoneroConnectionManager;
    /**
     * Remove all connections.
     *
     * @return {MoneroConnectonManager} this connection manager for chaining
     */
    clear(): MoneroConnectonManager;
    /**
     * Reset to default state.
     *
     * @return {MoneroConnectonManager} this connection manager for chaining
     */
    reset(): MoneroConnectonManager;
    _timeoutMs: number;
    /**
     * Get all listeners.
     *
     * @return {MoneroConnectionManagerListener[]} all listeners
     */
    getListeners(): MoneroConnectionManagerListener[];
    _onConnectionChanged(connection: any): Promise<any[]>;
    _getConnectionsInAscendingPriority(): any[];
    _compareConnections(c1: any, c2: any): any;
}
declare namespace MoneroConnectionManager {
    let DEFAULT_TIMEOUT: number;
    let DEFAULT_CHECK_CONNECTION_PERIOD: number;
}
import MoneroRpcConnection = require("./MoneroRpcConnection");
import TaskLooper = require("./TaskLooper");
