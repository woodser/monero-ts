import MoneroRpcConnection from "../../common/MoneroRpcConnection";
/**
 * Configuration to connect to monerod.
 */
export default class MoneroDaemonConfig {
    /** Server config to monerod. */
    server: string | Partial<MoneroRpcConnection>;
    /** Proxy requests to monerod to a worker (default true). */
    proxyToWorker: boolean;
    /** Command to start monerod as a child process. */
    cmd: string[];
    /** Interval in milliseconds to poll the daemon for updates (default 20000). */
    pollInterval: number;
    /**
     * Construct a configuration to open or create a wallet.
     *
     * @param {Partial<MoneroDaemonConfig>} [config] - MoneroDaemonConfig to construct from (optional)
     * @param {string|Partial<MoneroRpcConnection>} [config.server] - uri or MoneroRpcConnection to the daemon (optional)
     * @param {boolean} [config.proxyToWorker] - proxy daemon requests to a worker (default true)
     * @param {string[]} [config.cmd] - command to start monerod (optional)
     * @param {number} [config.pollInterval] - interval in milliseconds to poll the daemon for updates (default 20000)
     */
    constructor(config?: Partial<MoneroDaemonConfig>);
    copy(): MoneroDaemonConfig;
    toJson(): any;
    getServer(): MoneroRpcConnection;
    setServer(server: Partial<MoneroRpcConnection> | string): MoneroDaemonConfig;
    getProxyToWorker(): boolean;
    setProxyToWorker(proxyToWorker: boolean): MoneroDaemonConfig;
    getCmd(): string[];
    setCmd(cmd: string[]): MoneroDaemonConfig;
    getPollInterval(): number;
    setPollInterval(pollInterval: number): MoneroDaemonConfig;
}
