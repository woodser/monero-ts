import MoneroConnectionManagerListener from "./MoneroConnectionManagerListener";
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
    static DEFAULT_TIMEOUT: number;
    static DEFAULT_POLL_PERIOD: number;
    static DEFAULT_AUTO_SWITCH: boolean;
    static MIN_BETTER_RESPONSES: number;
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
    static PollType: {
        PRIORITIZED: number;
        CURRENT: number;
        ALL: number;
    };
    /**
     * Construct a connection manager.
     *
     * @param {boolean} [proxyToWorker] - configure all connections to proxy to worker (default true)
     */
    constructor(proxyToWorker?: boolean);
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
     * Get all listeners.
     *
     * @return {MoneroConnectionManagerListener[]} all listeners
     */
    getListeners(): MoneroConnectionManagerListener[];
    /**
     * Add a connection. The connection may have an elevated priority for this manager to use.
     *
     * @param {string|Partial<MoneroRpcConnection>} uriOrConnection - uri or connection to add
     * @return {Promise<MoneroConnectionManager>} this connection manager for chaining
     */
    addConnection(uriOrConnection: string | Partial<MoneroRpcConnection>): Promise<MoneroConnectionManager>;
    /**
     * Remove a connection.
     *
     * @param {string} uri - of the the connection to remove
     * @return {Promise<MoneroConnectionManager>} this connection manager for chaining
     */
    removeConnection(uri: string): Promise<MoneroConnectionManager>;
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
    setConnection(uriOrConnection?: string | Partial<MoneroRpcConnection>): Promise<MoneroConnectionManager>;
    /**
     * Get the current connection.
     *
     * @return {MoneroRpcConnection} the current connection or undefined if no connection set
     */
    getConnection(): MoneroRpcConnection;
    /**
     * Indicates if this manager has a connection with the given URI.
     *
     * @param {string} uri URI of the connection to check
     * @return {boolean} true if this manager has a connection with the given URI, false otherwise
     */
    hasConnection(uri: string): boolean;
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
     * Indicates if the connection manager is connected to a node.
     *
     * @return {boolean|undefined} true if the current connection is set, online, and not unauthenticated, undefined if unknown, false otherwise
     */
    isConnected(): boolean | undefined;
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
    startPolling(periodMs?: number, autoSwitch?: boolean, timeoutMs?: number, pollType?: number, excludedConnections?: MoneroRpcConnection[]): MoneroConnectionManager;
    /**
     * Stop polling connections.
     *
     * @return {MoneroConnectionManager} this connection manager for chaining
     */
    stopPolling(): MoneroConnectionManager;
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
    checkConnectionPromises(): Promise<void>[];
    /**
     * Get the best available connection in order of priority then response time.
     *
     * @param {MoneroRpcConnection[]} [excludedConnections] - connections to be excluded from consideration (optional)
     * @return {Promise<MoneroRpcConnection>} the best available connection in order of priority then response time, undefined if no connections available
     */
    getBestAvailableConnection(excludedConnections?: MoneroRpcConnection[]): Promise<MoneroRpcConnection>;
    /**
     * Automatically switch to the best available connection as connections are polled, based on priority, response time, and consistency.
     *
     * @param {boolean} autoSwitch specifies if the connection should auto switch to a better connection
     * @return {MoneroConnectionManager} this connection manager for chaining
     */
    setAutoSwitch(autoSwitch: boolean): MoneroConnectionManager;
    /**
     * Get if auto switch is enabled or disabled.
     *
     * @return {boolean} true if auto switch enabled, false otherwise
     */
    getAutoSwitch(): boolean;
    /**
     * Set the maximum request time before its connection is considered offline.
     *
     * @param {number} timeoutMs - the timeout before the connection is considered offline
     * @return {MoneroConnectionManager} this connection manager for chaining
     */
    setTimeout(timeoutMs: number): MoneroConnectionManager;
    /**
     * Get the request timeout.
     *
     * @return {number} the request timeout before a connection is considered offline
     */
    getTimeout(): number;
    /**
     * Collect connectable peers of the managed connections.
     *
     * @return {Promise<MoneroRpcConnection[]>} connectable peers
     */
    getPeerConnections(): Promise<MoneroRpcConnection[]>;
    /**
     * Disconnect from the current connection.
     *
     * @return {Promise<MoneroConnectionManager>} this connection manager for chaining
     */
    disconnect(): Promise<MoneroConnectionManager>;
    /**
     * Remove all connections.
     *
     * @return {Promise<MoneroConnectionManager>} this connection manager for chaining
     */
    clear(): Promise<MoneroConnectionManager>;
    /**
     * Reset to default state.
     *
     * @return {MoneroConnectionManager} this connection manager for chaining
     */
    reset(): MoneroConnectionManager;
    protected onConnectionChanged(connection: any): Promise<any[]>;
    protected getConnectionsInAscendingPriority(): any[];
    protected compareConnections(c1: any, c2: any): any;
    protected comparePriorities(p1: any, p2: any): number;
    protected startPollingConnection(periodMs: any): this;
    protected startPollingConnections(periodMs: any): this;
    protected startPollingPrioritizedConnections(periodMs: any, excludedConnections: any): this;
    checkPrioritizedConnections(excludedConnections: any): Promise<void>;
    protected checkConnectionsAux(connections: any, excludedConnections?: any): Promise<boolean>;
    protected processResponses(responses: any): Promise<MoneroRpcConnection>;
    protected updateBestConnectionInPriority(): Promise<MoneroRpcConnection>;
    /**
     * Get the best connection from the given responses.
     *
     * @param {MoneroRpcConnection[]} responses connection responses to update from
     * @return {MoneroRpcConnection} the best response among the given responses or undefined if none are best
     */
    protected getBestConnectionFromPrioritizedResponses(responses: any): Promise<MoneroRpcConnection>;
}
