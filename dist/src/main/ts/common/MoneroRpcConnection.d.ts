import ThreadPool from "./ThreadPool";
/**
 * Maintains a connection and sends requests to a Monero RPC API.
 */
export default class MoneroRpcConnection {
    uri: string;
    username: string;
    password: string;
    rejectUnauthorized: boolean;
    proxyToWorker: boolean;
    priority: number;
    timeoutMs: number;
    protected isOnline: boolean;
    protected isAuthenticated: boolean;
    protected attributes: any;
    protected fakeDisconnected: boolean;
    protected responseTime: number;
    protected checkConnectionMutex: ThreadPool;
    protected sendRequestMutex: ThreadPool;
    /** @private */
    static DEFAULT_CONFIG: Partial<MoneroRpcConnection>;
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
    constructor(uriOrConnection: string | Partial<MoneroRpcConnection>, username?: string, password?: string);
    setCredentials(username: any, password: any): this;
    getUri(): string;
    getUsername(): string;
    getPassword(): string;
    getRejectUnauthorized(): boolean;
    setProxyToWorker(proxyToWorker: any): this;
    getProxyToWorker(): boolean;
    /**
     * Set the connection's priority relative to other connections. Priority 1 is highest,
     * then priority 2, etc. The default priority of 0 is lowest priority.
     *
     * @param {number} [priority] - the connection priority (default 0)
     * @return {MoneroRpcConnection} this connection
     */
    setPriority(priority: any): this;
    getPriority(): number;
    /**
     * Set the RPC request timeout in milliseconds.
     *
     * @param {number} timeoutMs is the timeout in milliseconds, 0 to disable timeout, or undefined to use default
     * @return {MoneroRpcConnection} this connection
     */
    setTimeout(timeoutMs: number): this;
    getTimeout(): number;
    setAttribute(key: any, value: any): this;
    getAttribute(key: any): any;
    /**
     * Check the connection status to update isOnline, isAuthenticated, and response time.
     *
     * @param {number} timeoutMs - maximum response time before considered offline
     * @return {Promise<boolean>} true if there is a change in status, false otherwise
     */
    checkConnection(timeoutMs: any): Promise<boolean>;
    /**
     * Indicates if the connection is connected according to the last call to checkConnection().<br><br>
     *
     * Note: must call checkConnection() manually unless using MoneroConnectionManager.
     *
     * @return {boolean} true or false to indicate if connected, or undefined if checkConnection() has not been called
     */
    isConnected(): boolean;
    /**
     * Indicates if the connection is online according to the last call to checkConnection().<br><br>
     *
     * Note: must call checkConnection() manually unless using MoneroConnectionManager.
     *
     * @return {boolean} true or false to indicate if online, or undefined if checkConnection() has not been called
     */
    getIsOnline(): boolean;
    /**
     * Indicates if the connection is authenticated according to the last call to checkConnection().<br><br>
     *
     * Note: must call checkConnection() manually unless using MoneroConnectionManager.
     *
     * @return {boolean} true if authenticated or no authentication, false if not authenticated, or undefined if checkConnection() has not been called
     */
    getIsAuthenticated(): boolean;
    getResponseTime(): number;
    /**
     * Send a JSON RPC request.
     *
     * @param {string} method - JSON RPC method to invoke
     * @param {object} params - request parameters
     * @param {number} [timeoutMs] - overrides the request timeout in milliseconds
     * @return {object} is the response map
     */
    sendJsonRequest(method: any, params?: any, timeoutMs?: any): Promise<any>;
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
    sendPathRequest(path: any, params?: any, timeoutMs?: any): Promise<any>;
    /**
     * Send a binary RPC request.
     *
     * @param {string} path - path of the binary RPC method to invoke
     * @param {object} [params] - request parameters
     * @param {number} [timeoutMs] - request timeout in milliseconds
     * @return {Uint8Array} the binary response
     */
    sendBinaryRequest(path: any, params?: any, timeoutMs?: any): Promise<any>;
    getConfig(): {
        uri: string;
        username: string;
        password: string;
        rejectUnauthorized: boolean;
        proxyToWorker: boolean;
        priority: number;
        timeoutMs: number;
    };
    toJson(): {} & this;
    toString(): string;
    setFakeDisconnected(fakeDisconnected: any): void;
    protected queueCheckConnection<T>(asyncFn: () => Promise<T>): Promise<T>;
    protected queueSendRequest<T>(asyncFn: () => Promise<T>): Promise<T>;
    protected static validateHttpResponse(resp: any): void;
    protected validateRpcResponse(resp: any, method: any, params: any): void;
}
