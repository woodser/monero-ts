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
  constructor(config?: Partial<MoneroDaemonConfig>) {
    Object.assign(this, config);
    if (this.server) this.setServer(this.server);
    this.setProxyToWorker(this.proxyToWorker);
  }

  copy(): MoneroDaemonConfig {
    return new MoneroDaemonConfig(this);
  }
  
  toJson(): any {
    let json: any = Object.assign({}, this);
    if (json.server) json.server = json.server.toJson();
    return json;
  }
  
  getServer(): MoneroRpcConnection {
    return this.server as MoneroRpcConnection;
  }
  
  setServer(server: Partial<MoneroRpcConnection> | string): MoneroDaemonConfig {
    if (server && !(server instanceof MoneroRpcConnection)) server = new MoneroRpcConnection(server);
    this.server = server as MoneroRpcConnection;
    return this;
  }
  
  getProxyToWorker(): boolean {
    return this.proxyToWorker;
  }
  
  setProxyToWorker(proxyToWorker: boolean): MoneroDaemonConfig {
    this.proxyToWorker = proxyToWorker;
    return this;
  }

  getCmd(): string[] {
    return this.cmd;
  }

  setCmd(cmd: string[]): MoneroDaemonConfig {
    this.cmd = cmd;
    return this;
  }

  getPollInterval(): number {
    return this.pollInterval;
  }

  setPollInterval(pollInterval: number): MoneroDaemonConfig {
    this.pollInterval = pollInterval;
    return this;
  }
}