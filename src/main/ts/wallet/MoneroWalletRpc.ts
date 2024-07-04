import assert from "assert";
import GenUtils from "../common/GenUtils";
import LibraryUtils from "../common/LibraryUtils";
import TaskLooper from "../common/TaskLooper";
import MoneroAccount from "./model/MoneroAccount";
import MoneroAccountTag from "./model/MoneroAccountTag";
import MoneroAddressBookEntry from "./model/MoneroAddressBookEntry";
import MoneroBlock from "../daemon/model/MoneroBlock";
import MoneroBlockHeader from "../daemon/model/MoneroBlockHeader";
import MoneroCheckReserve from "./model/MoneroCheckReserve";
import MoneroCheckTx from "./model/MoneroCheckTx";
import MoneroDestination from "./model/MoneroDestination";
import MoneroError from "../common/MoneroError";
import MoneroIncomingTransfer from "./model/MoneroIncomingTransfer";
import MoneroIntegratedAddress from "./model/MoneroIntegratedAddress";
import MoneroKeyImage from "../daemon/model/MoneroKeyImage";
import MoneroKeyImageImportResult from "./model/MoneroKeyImageImportResult";
import MoneroMultisigInfo from "./model/MoneroMultisigInfo";
import MoneroMultisigInitResult from "./model/MoneroMultisigInitResult";
import MoneroMultisigSignResult from "./model/MoneroMultisigSignResult";
import MoneroOutgoingTransfer from "./model/MoneroOutgoingTransfer";
import MoneroOutputQuery from "./model/MoneroOutputQuery";
import MoneroOutputWallet from "./model/MoneroOutputWallet";
import MoneroRpcConnection from "../common/MoneroRpcConnection";
import MoneroRpcError from "../common/MoneroRpcError";
import MoneroSubaddress from "./model/MoneroSubaddress";
import MoneroSyncResult from "./model/MoneroSyncResult";
import MoneroTransfer from "./model/MoneroTransfer";
import MoneroTransferQuery from "./model/MoneroTransferQuery";
import MoneroTx from "../daemon/model/MoneroTx";
import MoneroTxConfig from "./model/MoneroTxConfig";
import MoneroTxQuery from "./model/MoneroTxQuery";
import MoneroTxSet from "./model/MoneroTxSet";
import MoneroTxWallet from "./model/MoneroTxWallet";
import MoneroUtils from "../common/MoneroUtils";
import MoneroVersion from "../daemon/model/MoneroVersion";
import MoneroWallet from "./MoneroWallet";
import MoneroWalletConfig from "./model/MoneroWalletConfig";
import MoneroWalletListener from "./model/MoneroWalletListener";
import MoneroMessageSignatureType from "./model/MoneroMessageSignatureType";
import MoneroMessageSignatureResult from "./model/MoneroMessageSignatureResult";
import ThreadPool from "../common/ThreadPool";
import SslOptions from "../common/SslOptions";
import { ChildProcess } from "child_process";

/**
 * Copyright (c) woodser
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Implements a MoneroWallet as a client of monero-wallet-rpc.
 * 
 * @implements {MoneroWallet}
 */
export default class MoneroWalletRpc extends MoneroWallet {

  // static variables
  protected static readonly DEFAULT_SYNC_PERIOD_IN_MS = 20000; // default period between syncs in ms (defined by DEFAULT_AUTO_REFRESH_PERIOD in wallet_rpc_server.cpp)

  // instance variables
  protected config: Partial<MoneroWalletConfig>;
  protected addressCache: any;
  protected syncPeriodInMs: number;
  protected listeners: MoneroWalletListener[];
  protected process: any;
  protected path: string;
  protected daemonConnection: MoneroRpcConnection;
  protected walletPoller: WalletPoller;
  
  /** @private */
  constructor(config: MoneroWalletConfig) {
    super();
    this.config = config;
    this.addressCache = {}; // avoid unecessary requests for addresses
    this.syncPeriodInMs = MoneroWalletRpc.DEFAULT_SYNC_PERIOD_IN_MS;
  }
  
  // --------------------------- RPC WALLET METHODS ---------------------------
  
  /**
   * Get the internal process running monero-wallet-rpc.
   * 
   * @return {ChildProcess} the process running monero-wallet-rpc, undefined if not created from new process
   */
  getProcess(): ChildProcess {
    return this.process;
  }
  
  /**
   * Stop the internal process running monero-wallet-rpc, if applicable.
   * 
   * @param {boolean} force specifies if the process should be destroyed forcibly (default false)
   * @return {Promise<number | undefined>} the exit code from stopping the process
   */
  async stopProcess(force = false): Promise<number | undefined>  {
    if (this.process === undefined) throw new MoneroError("MoneroWalletRpc instance not created from new process");
    let listenersCopy = GenUtils.copyArray(this.getListeners());
    for (let listener of listenersCopy) await this.removeListener(listener);
    return GenUtils.killProcess(this.process, force ? "SIGKILL" : undefined);
  }
  
  /**
   * Get the wallet's RPC connection.
   * 
   * @return {MoneroRpcConnection | undefined} the wallet's rpc connection
   */
  getRpcConnection(): MoneroRpcConnection | undefined {
    return this.config.getServer();
  }
  
  /**
   * <p>Open an existing wallet on the monero-wallet-rpc server.</p>
   * 
   * <p>Example:<p>
   * 
   * <code>
   * let wallet = new MoneroWalletRpc("http://localhost:38084", "rpc_user", "abc123");<br>
   * await wallet.openWallet("mywallet1", "supersecretpassword");<br>
   * <br>
   * await wallet.openWallet({<br>
   * &nbsp;&nbsp; path: "mywallet2",<br>
   * &nbsp;&nbsp; password: "supersecretpassword",<br>
   * &nbsp;&nbsp; server: "http://locahost:38081", // or object with uri, username, password, etc <br>
   * &nbsp;&nbsp; rejectUnauthorized: false<br>
   * });<br>
   * </code>
   * 
   * @param {string|MoneroWalletConfig} pathOrConfig  - the wallet's name or configuration to open
   * @param {string} pathOrConfig.path - path of the wallet to create (optional, in-memory wallet if not given)
   * @param {string} pathOrConfig.password - password of the wallet to create
   * @param {string|Partial<MoneroRpcConnection>} pathOrConfig.server - uri or MoneroRpcConnection of a daemon to use (optional, monero-wallet-rpc usually started with daemon config)
   * @param {string} [password] the wallet's password
   * @return {Promise<MoneroWalletRpc>} this wallet client
   */
  async openWallet(pathOrConfig: string | Partial<MoneroWalletConfig>, password?: string): Promise<MoneroWalletRpc> {
    
    // normalize and validate config
    let config = new MoneroWalletConfig(typeof pathOrConfig === "string" ? {path: pathOrConfig, password: password ? password : ""} : pathOrConfig);
    // TODO: ensure other fields uninitialized?
    
    // open wallet on rpc server
    if (!config.getPath()) throw new MoneroError("Must provide name of wallet to open");
    await this.config.getServer().sendJsonRequest("open_wallet", {filename: config.getPath(), password: config.getPassword()});
    await this.clear();
    this.path = config.getPath();

    // set connection manager or server
    if (config.getConnectionManager() != null) {
      if (config.getServer()) throw new MoneroError("Wallet can be opened with a server or connection manager but not both");
      await this.setConnectionManager(config.getConnectionManager());
    } else if (config.getServer() != null) {
      await this.setDaemonConnection(config.getServer());
    }
    
    return this;
  }
  
  /**
   * <p>Create and open a wallet on the monero-wallet-rpc server.<p>
   * 
   * <p>Example:<p>
   * 
   * <code>
   * &sol;&sol; construct client to monero-wallet-rpc<br>
   * let walletRpc = new MoneroWalletRpc("http://localhost:38084", "rpc_user", "abc123");<br><br>
   * 
   * &sol;&sol; create and open wallet on monero-wallet-rpc<br>
   * await walletRpc.createWallet({<br>
   * &nbsp;&nbsp; path: "mywallet",<br>
   * &nbsp;&nbsp; password: "abc123",<br>
   * &nbsp;&nbsp; seed: "coexist igloo pamphlet lagoon...",<br>
   * &nbsp;&nbsp; restoreHeight: 1543218l<br>
   * });
   *  </code>
   * 
   * @param {Partial<MoneroWalletConfig>} config - MoneroWalletConfig or equivalent JS object
   * @param {string} [config.path] - path of the wallet to create (optional, in-memory wallet if not given)
   * @param {string} [config.password] - password of the wallet to create
   * @param {string} [config.seed] - seed of the wallet to create (optional, random wallet created if neither seed nor keys given)
   * @param {string} [config.seedOffset] - the offset used to derive a new seed from the given seed to recover a secret wallet from the seed
   * @param {boolean} [config.isMultisig] - restore multisig wallet from seed
   * @param {string} [config.primaryAddress] - primary address of the wallet to create (only provide if restoring from keys)
   * @param {string} [config.privateViewKey] - private view key of the wallet to create (optional)
   * @param {string} [config.privateSpendKey] - private spend key of the wallet to create (optional)
   * @param {number} [config.restoreHeight] - block height to start scanning from (defaults to 0 unless generating random wallet)
   * @param {string} [config.language] - language of the wallet's mnemonic phrase or seed (defaults to "English" or auto-detected)
   * @param {MoneroRpcConnection} [config.server] - MoneroRpcConnection to a monero daemon (optional)<br>
   * @param {string} [config.serverUri] - uri of a daemon to use (optional, monero-wallet-rpc usually started with daemon config)
   * @param {string} [config.serverUsername] - username to authenticate with the daemon (optional)
   * @param {string} [config.serverPassword] - password to authenticate with the daemon (optional)
   * @param {MoneroConnectionManager} [config.connectionManager] - manage connections to monerod (optional)
   * @param {boolean} [config.rejectUnauthorized] - reject self-signed server certificates if true (defaults to true)
   * @param {MoneroRpcConnection} [config.server] - MoneroRpcConnection or equivalent JS object providing daemon configuration (optional)
   * @param {boolean} [config.saveCurrent] - specifies if the current RPC wallet should be saved before being closed (default true)
   * @return {MoneroWalletRpc} this wallet client
   */
  async createWallet(config: Partial<MoneroWalletConfig>): Promise<MoneroWalletRpc> {
    
    // normalize and validate config
    if (config === undefined) throw new MoneroError("Must provide config to create wallet");
    const configNormalized = new MoneroWalletConfig(config);
    if (configNormalized.getSeed() !== undefined && (configNormalized.getPrimaryAddress() !== undefined || configNormalized.getPrivateViewKey() !== undefined || configNormalized.getPrivateSpendKey() !== undefined)) {
      throw new MoneroError("Wallet can be initialized with a seed or keys but not both");
    }
    if (configNormalized.getNetworkType() !== undefined) throw new MoneroError("Cannot provide networkType when creating RPC wallet because server's network type is already set");
    if (configNormalized.getAccountLookahead() !== undefined || configNormalized.getSubaddressLookahead() !== undefined) throw new MoneroError("monero-wallet-rpc does not support creating wallets with subaddress lookahead over rpc");
    if (configNormalized.getPassword() === undefined) configNormalized.setPassword("");

    // set server from connection manager if provided
    if (configNormalized.getConnectionManager()) {
      if (configNormalized.getServer()) throw new MoneroError("Wallet can be created with a server or connection manager but not both");
      configNormalized.setServer(config.getConnectionManager().getConnection());
    }

    // create wallet
    if (configNormalized.getSeed() !== undefined) await this.createWalletFromSeed(configNormalized);
    else if (configNormalized.getPrivateSpendKey() !== undefined || configNormalized.getPrimaryAddress() !== undefined) await this.createWalletFromKeys(configNormalized);
    else await this.createWalletRandom(configNormalized);

    // set connection manager or server
    if (configNormalized.getConnectionManager()) {
      await this.setConnectionManager(configNormalized.getConnectionManager());
    } else if (configNormalized.getServer()) {
      await this.setDaemonConnection(configNormalized.getServer());
    }
    
    return this;
  }
  
  protected async createWalletRandom(config: MoneroWalletConfig) {
    if (config.getSeedOffset() !== undefined) throw new MoneroError("Cannot provide seedOffset when creating random wallet");
    if (config.getRestoreHeight() !== undefined) throw new MoneroError("Cannot provide restoreHeight when creating random wallet");
    if (config.getSaveCurrent() === false) throw new MoneroError("Current wallet is saved automatically when creating random wallet");
    if (!config.getPath()) throw new MoneroError("Name is not initialized");
    if (!config.getLanguage()) config.setLanguage(MoneroWallet.DEFAULT_LANGUAGE);
    let params = { filename: config.getPath(), password: config.getPassword(), language: config.getLanguage() };
    try {
      await this.config.getServer().sendJsonRequest("create_wallet", params);
    } catch (err: any) {
      this.handleCreateWalletError(config.getPath(), err);
    }
    await this.clear();
    this.path = config.getPath();
    return this;
  }
  
  protected async createWalletFromSeed(config: MoneroWalletConfig) {
    try {
      await this.config.getServer().sendJsonRequest("restore_deterministic_wallet", {
        filename: config.getPath(),
        password: config.getPassword(),
        seed: config.getSeed(),
        seed_offset: config.getSeedOffset(),
        enable_multisig_experimental: config.getIsMultisig(),
        restore_height: config.getRestoreHeight(),
        language: config.getLanguage(),
        autosave_current: config.getSaveCurrent()
      });
    } catch (err: any) {
      this.handleCreateWalletError(config.getPath(), err);
    }
    await this.clear();
    this.path = config.getPath();
    return this;
  }
  
  protected async createWalletFromKeys(config: MoneroWalletConfig) {
    if (config.getSeedOffset() !== undefined) throw new MoneroError("Cannot provide seedOffset when creating wallet from keys");
    if (config.getRestoreHeight() === undefined) config.setRestoreHeight(0);
    if (config.getLanguage() === undefined) config.setLanguage(MoneroWallet.DEFAULT_LANGUAGE);
    try {
      await this.config.getServer().sendJsonRequest("generate_from_keys", {
        filename: config.getPath(),
        password: config.getPassword(),
        address: config.getPrimaryAddress(),
        viewkey: config.getPrivateViewKey(),
        spendkey: config.getPrivateSpendKey(),
        restore_height: config.getRestoreHeight(),
        autosave_current: config.getSaveCurrent()
      });
    } catch (err: any) {
      this.handleCreateWalletError(config.getPath(), err);
    }
    await this.clear();
    this.path = config.getPath();
    return this;
  }
  
  protected handleCreateWalletError(name, err) {
    if (err.message === "Cannot create wallet. Already exists.") throw new MoneroRpcError("Wallet already exists: " + name, err.getCode(), err.getRpcMethod(), err.getRpcParams());
    if (err.message === "Electrum-style word list failed verification") throw new MoneroRpcError("Invalid mnemonic", err.getCode(), err.getRpcMethod(), err.getRpcParams());
    throw err;
  }
  
  async isViewOnly(): Promise<boolean> {
    try {
      await this.config.getServer().sendJsonRequest("query_key", {key_type: "mnemonic"});
      return false; // key retrieval succeeds if not view only
    } catch (e: any) {
      if (e.getCode() === -29) return true;  // wallet is view only
      if (e.getCode() === -1) return false;  // wallet is offline but not view only
      throw e;
    }
  }
  
  /**
   * Set the wallet's daemon connection.
   * 
   * @param {string|MoneroRpcConnection} [uriOrConnection] - the daemon's URI or connection (defaults to offline)
   * @param {boolean} isTrusted - indicates if the daemon in trusted
   * @param {SslOptions} sslOptions - custom SSL configuration
   */
  async setDaemonConnection(uriOrConnection?: MoneroRpcConnection | string, isTrusted?: boolean, sslOptions?: SslOptions): Promise<void> {
    let connection = !uriOrConnection ? undefined : uriOrConnection instanceof MoneroRpcConnection ? uriOrConnection : new MoneroRpcConnection(uriOrConnection);
    if (!sslOptions) sslOptions = new SslOptions();
    let params: any = {};
    params.address = connection ? connection.getUri() : "bad_uri"; // TODO monero-wallet-rpc: bad daemon uri necessary for offline?
    params.username = connection ? connection.getUsername() : "";
    params.password = connection ? connection.getPassword() : "";
    params.trusted = isTrusted;
    params.ssl_support = "autodetect";
    params.ssl_private_key_path = sslOptions.getPrivateKeyPath();
    params.ssl_certificate_path  = sslOptions.getCertificatePath();
    params.ssl_ca_file = sslOptions.getCertificateAuthorityFile();
    params.ssl_allowed_fingerprints = sslOptions.getAllowedFingerprints();
    params.ssl_allow_any_cert = sslOptions.getAllowAnyCert();
    await this.config.getServer().sendJsonRequest("set_daemon", params);
    this.daemonConnection = connection;
  }
  
  async getDaemonConnection(): Promise<MoneroRpcConnection> {
    return this.daemonConnection;
  }

  /**
   * Get the total and unlocked balances in a single request.
   * 
   * @param {number} [accountIdx] account index
   * @param {number} [subaddressIdx] subaddress index
   * @return {Promise<bigint[]>} is the total and unlocked balances in an array, respectively
   */
  async getBalances(accountIdx?: number, subaddressIdx?: number): Promise<bigint[]> {
    if (accountIdx === undefined) {
      assert.equal(subaddressIdx, undefined, "Must provide account index with subaddress index");
      let balance = BigInt(0);
      let unlockedBalance = BigInt(0);
      for (let account of await this.getAccounts()) {
        balance = balance + account.getBalance();
        unlockedBalance = unlockedBalance + account.getUnlockedBalance();
      }
      return [balance, unlockedBalance];
    } else {
      let params = {account_index: accountIdx, address_indices: subaddressIdx === undefined ? undefined : [subaddressIdx]};
      let resp = await this.config.getServer().sendJsonRequest("get_balance", params);
      if (subaddressIdx === undefined) return [BigInt(resp.result.balance), BigInt(resp.result.unlocked_balance)];
      else return [BigInt(resp.result.per_subaddress[0].balance), BigInt(resp.result.per_subaddress[0].unlocked_balance)];
    }
  }
  
  // -------------------------- COMMON WALLET METHODS -------------------------
  
  async addListener(listener: MoneroWalletListener): Promise<void> {
    await super.addListener(listener);
    this.refreshListening();
  }
  
  async removeListener(listener): Promise<void> {
    await super.removeListener(listener);
    this.refreshListening();
  }
  
  async isConnectedToDaemon(): Promise<boolean> {
    try {
      await this.checkReserveProof(await this.getPrimaryAddress(), "", ""); // TODO (monero-project): provide better way to know if wallet rpc is connected to daemon
      throw new MoneroError("check reserve expected to fail");
    } catch (e: any) {
      return e.message.indexOf("Failed to connect to daemon") < 0;
    }
  }
  
  async getVersion(): Promise<MoneroVersion> {
    let resp = await this.config.getServer().sendJsonRequest("get_version");
    return new MoneroVersion(resp.result.version, resp.result.release);
  }
  
  async getPath(): Promise<string> {
    return this.path;
  }
  
  async getSeed(): Promise<string> {
    let resp = await this.config.getServer().sendJsonRequest("query_key", { key_type: "mnemonic" });
    return resp.result.key;
  }
  
  async getSeedLanguage(): Promise<string> {
    if (await this.getSeed() === undefined) return undefined;
    throw new MoneroError("MoneroWalletRpc.getSeedLanguage() not supported");
  }

  /**
   * Get a list of available languages for the wallet's seed.
   * 
   * @return {string[]} the available languages for the wallet's seed.
   */
  async getSeedLanguages() {
    return (await this.config.getServer().sendJsonRequest("get_languages")).result.languages;
  }
  
  async getPrivateViewKey(): Promise<string> {
    let resp = await this.config.getServer().sendJsonRequest("query_key", { key_type: "view_key" });
    return resp.result.key;
  }
  
  async getPrivateSpendKey(): Promise<string> {
    let resp = await this.config.getServer().sendJsonRequest("query_key", { key_type: "spend_key" });
    return resp.result.key;
  }
  
  async getAddress(accountIdx: number, subaddressIdx: number): Promise<string> {
    let subaddressMap = this.addressCache[accountIdx];
    if (!subaddressMap) {
      await this.getSubaddresses(accountIdx, undefined, true);  // cache's all addresses at this account
      return this.getAddress(accountIdx, subaddressIdx);        // recursive call uses cache
    }
    let address = subaddressMap[subaddressIdx];
    if (!address) {
      await this.getSubaddresses(accountIdx, undefined, true);  // cache's all addresses at this account
      return this.addressCache[accountIdx][subaddressIdx];
    }
    return address;
  }
  
  // TODO: use cache
  async getAddressIndex(address: string): Promise<MoneroSubaddress> {
    
    // fetch result and normalize error if address does not belong to the wallet
    let resp;
    try {
      resp = await this.config.getServer().sendJsonRequest("get_address_index", {address: address});
    } catch (e: any) {
      if (e.getCode() === -2) throw new MoneroError(e.message);
      throw e;
    }
    
    // convert rpc response
    let subaddress = new MoneroSubaddress({address: address});
    subaddress.setAccountIndex(resp.result.index.major);
    subaddress.setIndex(resp.result.index.minor);
    return subaddress;
  }
  
  async getIntegratedAddress(standardAddress?: string, paymentId?: string): Promise<MoneroIntegratedAddress> {
    try {
      let integratedAddressStr = (await this.config.getServer().sendJsonRequest("make_integrated_address", {standard_address: standardAddress, payment_id: paymentId})).result.integrated_address;
      return await this.decodeIntegratedAddress(integratedAddressStr);
    } catch (e: any) {
      if (e.message.includes("Invalid payment ID")) throw new MoneroError("Invalid payment ID: " + paymentId);
      throw e;
    }
  }
  
  async decodeIntegratedAddress(integratedAddress: string): Promise<MoneroIntegratedAddress> {
    let resp = await this.config.getServer().sendJsonRequest("split_integrated_address", {integrated_address: integratedAddress});
    return new MoneroIntegratedAddress().setStandardAddress(resp.result.standard_address).setPaymentId(resp.result.payment_id).setIntegratedAddress(integratedAddress);
  }
  
  async getHeight(): Promise<number> {
    return (await this.config.getServer().sendJsonRequest("get_height")).result.height;
  }
  
  async getDaemonHeight(): Promise<number> {
    throw new MoneroError("monero-wallet-rpc does not support getting the chain height");
  }
  
  async getHeightByDate(year: number, month: number, day: number): Promise<number> {
    throw new MoneroError("monero-wallet-rpc does not support getting a height by date");
  }
  
  async sync(listenerOrStartHeight?: MoneroWalletListener | number, startHeight?: number): Promise<MoneroSyncResult> {
    assert(!(listenerOrStartHeight instanceof MoneroWalletListener), "Monero Wallet RPC does not support reporting sync progress");
    try {
      let resp = await this.config.getServer().sendJsonRequest("refresh", {start_height: startHeight});
      await this.poll();
      return new MoneroSyncResult(resp.result.blocks_fetched, resp.result.received_money);
    } catch (err: any) {
      if (err.message === "no connection to daemon") throw new MoneroError("Wallet is not connected to daemon");
      throw err;
    }
  }
  
  async startSyncing(syncPeriodInMs?: number): Promise<void> {
    
    // convert ms to seconds for rpc parameter
    let syncPeriodInSeconds = Math.round((syncPeriodInMs === undefined ? MoneroWalletRpc.DEFAULT_SYNC_PERIOD_IN_MS : syncPeriodInMs) / 1000);
    
    // send rpc request
    await this.config.getServer().sendJsonRequest("auto_refresh", {
      enable: true,
      period: syncPeriodInSeconds
    });
    
    // update sync period for poller
    this.syncPeriodInMs = syncPeriodInSeconds * 1000;
    if (this.walletPoller !== undefined) this.walletPoller.setPeriodInMs(this.syncPeriodInMs);
    
    // poll if listening
    await this.poll();
  }

  getSyncPeriodInMs(): number {
    return this.syncPeriodInMs;
  }
  
  async stopSyncing(): Promise<void> {
    return this.config.getServer().sendJsonRequest("auto_refresh", { enable: false });
  }
  
  async scanTxs(txHashes: string[]): Promise<void> {
    if (!txHashes || !txHashes.length) throw new MoneroError("No tx hashes given to scan");
    await this.config.getServer().sendJsonRequest("scan_tx", {txids: txHashes});
    await this.poll();
  }
  
  async rescanSpent(): Promise<void> {
    await this.config.getServer().sendJsonRequest("rescan_spent", undefined);
  }
  
  async rescanBlockchain(): Promise<void> {
    await this.config.getServer().sendJsonRequest("rescan_blockchain", undefined);
  }
  
  async getBalance(accountIdx?: number, subaddressIdx?: number): Promise<bigint> {
    return (await this.getBalances(accountIdx, subaddressIdx))[0];
  }
  
  async getUnlockedBalance(accountIdx?: number, subaddressIdx?: number): Promise<bigint> {
    return (await this.getBalances(accountIdx, subaddressIdx))[1];
  }
  
  async getAccounts(includeSubaddresses?: boolean, tag?: string, skipBalances?: boolean): Promise<MoneroAccount[]> {
    
    // fetch accounts from rpc
    let resp = await this.config.getServer().sendJsonRequest("get_accounts", {tag: tag});
    
    // build account objects and fetch subaddresses per account using get_address
    // TODO monero-wallet-rpc: get_address should support all_accounts so not called once per account
    let accounts: MoneroAccount[] = [];
    for (let rpcAccount of resp.result.subaddress_accounts) {
      let account = MoneroWalletRpc.convertRpcAccount(rpcAccount);
      if (includeSubaddresses) account.setSubaddresses(await this.getSubaddresses(account.getIndex(), undefined, true));
      accounts.push(account);
    }
    
    // fetch and merge fields from get_balance across all accounts
    if (includeSubaddresses && !skipBalances) {
      
      // these fields are not initialized if subaddress is unused and therefore not returned from `get_balance`
      for (let account of accounts) {
        for (let subaddress of account.getSubaddresses()) {
          subaddress.setBalance(BigInt(0));
          subaddress.setUnlockedBalance(BigInt(0));
          subaddress.setNumUnspentOutputs(0);
          subaddress.setNumBlocksToUnlock(0);
        }
      }
      
      // fetch and merge info from get_balance
      resp = await this.config.getServer().sendJsonRequest("get_balance", {all_accounts: true});
      if (resp.result.per_subaddress) {
        for (let rpcSubaddress of resp.result.per_subaddress) {
          let subaddress = MoneroWalletRpc.convertRpcSubaddress(rpcSubaddress);
          
          // merge info
          let account = accounts[subaddress.getAccountIndex()];
          assert.equal(subaddress.getAccountIndex(), account.getIndex(), "RPC accounts are out of order");  // would need to switch lookup to loop
          let tgtSubaddress = account.getSubaddresses()[subaddress.getIndex()];
          assert.equal(subaddress.getIndex(), tgtSubaddress.getIndex(), "RPC subaddresses are out of order");
          if (subaddress.getBalance() !== undefined) tgtSubaddress.setBalance(subaddress.getBalance());
          if (subaddress.getUnlockedBalance() !== undefined) tgtSubaddress.setUnlockedBalance(subaddress.getUnlockedBalance());
          if (subaddress.getNumUnspentOutputs() !== undefined) tgtSubaddress.setNumUnspentOutputs(subaddress.getNumUnspentOutputs());
        }
      }
    }
    
    return accounts;
  }
  
  // TODO: getAccountByIndex(), getAccountByTag()
  async getAccount(accountIdx: number, includeSubaddresses?: boolean, skipBalances?: boolean): Promise<MoneroAccount> {
    assert(accountIdx >= 0);
    for (let account of await this.getAccounts()) {
      if (account.getIndex() === accountIdx) {
        if (includeSubaddresses) account.setSubaddresses(await this.getSubaddresses(accountIdx, undefined, skipBalances));
        return account;
      }
    }
    throw new Error("Account with index " + accountIdx + " does not exist");
  }

  async createAccount(label?: string): Promise<MoneroAccount> {
    label = label ? label : undefined;
    let resp = await this.config.getServer().sendJsonRequest("create_account", {label: label});
    return new MoneroAccount({
      index: resp.result.account_index,
      primaryAddress: resp.result.address,
      label: label,
      balance: BigInt(0),
      unlockedBalance: BigInt(0)
    });
  }

  async getSubaddresses(accountIdx: number, subaddressIndices?: number[], skipBalances?: boolean): Promise<MoneroSubaddress[]> {
    
    // fetch subaddresses
    let params: any = {};
    params.account_index = accountIdx;
    if (subaddressIndices) params.address_index = GenUtils.listify(subaddressIndices);
    let resp = await this.config.getServer().sendJsonRequest("get_address", params);
    
    // initialize subaddresses
    let subaddresses = [];
    for (let rpcSubaddress of resp.result.addresses) {
      let subaddress = MoneroWalletRpc.convertRpcSubaddress(rpcSubaddress);
      subaddress.setAccountIndex(accountIdx);
      subaddresses.push(subaddress);
    }
    
    // fetch and initialize subaddress balances
    if (!skipBalances) {
      
      // these fields are not initialized if subaddress is unused and therefore not returned from `get_balance`
      for (let subaddress of subaddresses) {
        subaddress.setBalance(BigInt(0));
        subaddress.setUnlockedBalance(BigInt(0));
        subaddress.setNumUnspentOutputs(0);
        subaddress.setNumBlocksToUnlock(0);
      }

      // fetch and initialize balances
      resp = await this.config.getServer().sendJsonRequest("get_balance", params);
      if (resp.result.per_subaddress) {
        for (let rpcSubaddress of resp.result.per_subaddress) {
          let subaddress = MoneroWalletRpc.convertRpcSubaddress(rpcSubaddress);
          
          // transfer info to existing subaddress object
          for (let tgtSubaddress of subaddresses) {
            if (tgtSubaddress.getIndex() !== subaddress.getIndex()) continue; // skip to subaddress with same index
            if (subaddress.getBalance() !== undefined) tgtSubaddress.setBalance(subaddress.getBalance());
            if (subaddress.getUnlockedBalance() !== undefined) tgtSubaddress.setUnlockedBalance(subaddress.getUnlockedBalance());
            if (subaddress.getNumUnspentOutputs() !== undefined) tgtSubaddress.setNumUnspentOutputs(subaddress.getNumUnspentOutputs());
            if (subaddress.getNumBlocksToUnlock() !== undefined) tgtSubaddress.setNumBlocksToUnlock(subaddress.getNumBlocksToUnlock());
          }
        }
      }
    }
    
    // cache addresses
    let subaddressMap = this.addressCache[accountIdx];
    if (!subaddressMap) {
      subaddressMap = {};
      this.addressCache[accountIdx] = subaddressMap;
    }
    for (let subaddress of subaddresses) {
      subaddressMap[subaddress.getIndex()] = subaddress.getAddress();
    }
    
    // return results
    return subaddresses;
  }

  async getSubaddress(accountIdx: number, subaddressIdx: number, skipBalances?: boolean): Promise<MoneroSubaddress> {
    assert(accountIdx >= 0);
    assert(subaddressIdx >= 0);
    return (await this.getSubaddresses(accountIdx, [subaddressIdx], skipBalances))[0];
  }

  async createSubaddress(accountIdx: number, label?: string): Promise<MoneroSubaddress> {
    
    // send request
    let resp = await this.config.getServer().sendJsonRequest("create_address", {account_index: accountIdx, label: label});
    
    // build subaddress object
    let subaddress = new MoneroSubaddress();
    subaddress.setAccountIndex(accountIdx);
    subaddress.setIndex(resp.result.address_index);
    subaddress.setAddress(resp.result.address);
    subaddress.setLabel(label ? label : undefined);
    subaddress.setBalance(BigInt(0));
    subaddress.setUnlockedBalance(BigInt(0));
    subaddress.setNumUnspentOutputs(0);
    subaddress.setIsUsed(false);
    subaddress.setNumBlocksToUnlock(0);
    return subaddress;
  }

  async setSubaddressLabel(accountIdx: number, subaddressIdx: number, label: string): Promise<void> {
    await this.config.getServer().sendJsonRequest("label_address", {index: {major: accountIdx, minor: subaddressIdx}, label: label});
  }
  
  async getTxs(query?: string[] | Partial<MoneroTxQuery>): Promise<MoneroTxWallet[]> {
    
    // copy query
    const queryNormalized = MoneroWallet.normalizeTxQuery(query);
    
    // temporarily disable transfer and output queries in order to collect all tx information
    let transferQuery = queryNormalized.getTransferQuery();
    let inputQuery = queryNormalized.getInputQuery();
    let outputQuery = queryNormalized.getOutputQuery();
    queryNormalized.setTransferQuery(undefined);
    queryNormalized.setInputQuery(undefined);
    queryNormalized.setOutputQuery(undefined);
    
    // fetch all transfers that meet tx query
    let transfers = await this.getTransfersAux(new MoneroTransferQuery().setTxQuery(MoneroWalletRpc.decontextualize(queryNormalized.copy())));
    
    // collect unique txs from transfers while retaining order
    let txs = [];
    let txsSet = new Set();
    for (let transfer of transfers) {
      if (!txsSet.has(transfer.getTx())) {
        txs.push(transfer.getTx());
        txsSet.add(transfer.getTx());
      }
    }
    
    // cache types into maps for merging and lookup
    let txMap = {};
    let blockMap = {};
    for (let tx of txs) {
      MoneroWalletRpc.mergeTx(tx, txMap, blockMap);
    }
    
    // fetch and merge outputs if requested
    if (queryNormalized.getIncludeOutputs() || outputQuery) {
        
      // fetch outputs
      let outputQueryAux = (outputQuery ? outputQuery.copy() : new MoneroOutputQuery()).setTxQuery(MoneroWalletRpc.decontextualize(queryNormalized.copy()));
      let outputs = await this.getOutputsAux(outputQueryAux);
      
      // merge output txs one time while retaining order
      let outputTxs = [];
      for (let output of outputs) {
        if (!outputTxs.includes(output.getTx())) {
          MoneroWalletRpc.mergeTx(output.getTx(), txMap, blockMap);
          outputTxs.push(output.getTx());
        }
      }
    }
    
    // restore transfer and output queries
    queryNormalized.setTransferQuery(transferQuery);
    queryNormalized.setInputQuery(inputQuery);
    queryNormalized.setOutputQuery(outputQuery);
    
    // filter txs that don't meet transfer query
    let txsQueried = [];
    for (let tx of txs) {
      if (queryNormalized.meetsCriteria(tx)) txsQueried.push(tx);
      else if (tx.getBlock() !== undefined) tx.getBlock().getTxs().splice(tx.getBlock().getTxs().indexOf(tx), 1);
    }
    txs = txsQueried;
    
    // special case: re-fetch txs if inconsistency caused by needing to make multiple rpc calls
    for (let tx of txs) {
      if (tx.getIsConfirmed() && tx.getBlock() === undefined || !tx.getIsConfirmed() && tx.getBlock() !== undefined) {
        console.error("Inconsistency detected building txs from multiple rpc calls, re-fetching txs");
        return this.getTxs(queryNormalized);
      }
    }
    
    // order txs if tx hashes given then return
    if (queryNormalized.getHashes() && queryNormalized.getHashes().length > 0) {
      let txsById = new Map()  // store txs in temporary map for sorting
      for (let tx of txs) txsById.set(tx.getHash(), tx);
      let orderedTxs = [];
      for (let hash of queryNormalized.getHashes()) if (txsById.get(hash)) orderedTxs.push(txsById.get(hash));
      txs = orderedTxs;
    }
    return txs;
  }
  
  async getTransfers(query?: Partial<MoneroTransferQuery>): Promise<MoneroTransfer[]> {
    
    // copy and normalize query up to block
    const queryNormalized = MoneroWallet.normalizeTransferQuery(query);
    
    // get transfers directly if query does not require tx context (other transfers, outputs)
    if (!MoneroWalletRpc.isContextual(queryNormalized)) return this.getTransfersAux(queryNormalized);
    
    // otherwise get txs with full models to fulfill query
    let transfers = [];
    for (let tx of await this.getTxs(queryNormalized.getTxQuery())) {
      for (let transfer of tx.filterTransfers(queryNormalized)) {
        transfers.push(transfer);
      }
    }
    
    return transfers;
  }
  
  async getOutputs(query?: Partial<MoneroOutputQuery>): Promise<MoneroOutputWallet[]> {
    
    // copy and normalize query up to block
    const queryNormalized = MoneroWallet.normalizeOutputQuery(query);
    
    // get outputs directly if query does not require tx context (other outputs, transfers)
    if (!MoneroWalletRpc.isContextual(queryNormalized)) return this.getOutputsAux(queryNormalized);
    
    // otherwise get txs with full models to fulfill query
    let outputs = [];
    for (let tx of await this.getTxs(queryNormalized.getTxQuery())) {
      for (let output of tx.filterOutputs(queryNormalized)) {
        outputs.push(output);
      }
    }
    
    return outputs;
  }
  
  async exportOutputs(all = false): Promise<string> {
    return (await this.config.getServer().sendJsonRequest("export_outputs", {all: all})).result.outputs_data_hex;
  }
  
  async importOutputs(outputsHex: string): Promise<number> {
    let resp = await this.config.getServer().sendJsonRequest("import_outputs", {outputs_data_hex: outputsHex});
    return resp.result.num_imported;
  }
  
  async exportKeyImages(all = false): Promise<MoneroKeyImage[]> {
    return await this.rpcExportKeyImages(all);
  }
  
  async importKeyImages(keyImages: MoneroKeyImage[]): Promise<MoneroKeyImageImportResult> {
    
    // convert key images to rpc parameter
    let rpcKeyImages = keyImages.map(keyImage => ({key_image: keyImage.getHex(), signature: keyImage.getSignature()}));
    
    // send request
    let resp = await this.config.getServer().sendJsonRequest("import_key_images", {signed_key_images: rpcKeyImages});
    
    // build and return result
    let importResult = new MoneroKeyImageImportResult();
    importResult.setHeight(resp.result.height);
    importResult.setSpentAmount(BigInt(resp.result.spent));
    importResult.setUnspentAmount(BigInt(resp.result.unspent));
    return importResult;
  }
  
  async getNewKeyImagesFromLastImport(): Promise<MoneroKeyImage[]> {
    return await this.rpcExportKeyImages(false);
  }
  
  async freezeOutput(keyImage: string): Promise<void> {
    return this.config.getServer().sendJsonRequest("freeze", {key_image: keyImage});
  }
  
  async thawOutput(keyImage: string): Promise<void> {
    return this.config.getServer().sendJsonRequest("thaw", {key_image: keyImage});
  }
  
  async isOutputFrozen(keyImage: string): Promise<boolean> {
    let resp = await this.config.getServer().sendJsonRequest("frozen", {key_image: keyImage});
    return resp.result.frozen === true;
  }
  
  async createTxs(config: Partial<MoneroTxConfig>): Promise<MoneroTxWallet[]> {
    
    // validate, copy, and normalize config
    const configNormalized = MoneroWallet.normalizeCreateTxsConfig(config);
    if (configNormalized.getCanSplit() === undefined) configNormalized.setCanSplit(true);
    if (configNormalized.getRelay() === true && await this.isMultisig()) throw new MoneroError("Cannot relay multisig transaction until co-signed");

    // determine account and subaddresses to send from
    let accountIdx = configNormalized.getAccountIndex();
    if (accountIdx === undefined) throw new MoneroError("Must provide the account index to send from");
    let subaddressIndices = configNormalized.getSubaddressIndices() === undefined ? undefined : configNormalized.getSubaddressIndices().slice(0); // fetch all or copy given indices
    
    // build config parameters
    let params: any = {};
    params.destinations = [];
    for (let destination of configNormalized.getDestinations()) {
      assert(destination.getAddress(), "Destination address is not defined");
      assert(destination.getAmount(), "Destination amount is not defined");
      params.destinations.push({ address: destination.getAddress(), amount: destination.getAmount().toString() });
    }
    if (configNormalized.getSubtractFeeFrom()) params.subtract_fee_from_outputs = configNormalized.getSubtractFeeFrom();
    params.account_index = accountIdx;
    params.subaddr_indices = subaddressIndices;
    params.payment_id = configNormalized.getPaymentId();
    if (configNormalized.getUnlockTime() !== undefined) params.unlock_time = configNormalized.getUnlockTime().toString()
    params.do_not_relay = configNormalized.getRelay() !== true;
    assert(configNormalized.getPriority() === undefined || configNormalized.getPriority() >= 0 && configNormalized.getPriority() <= 3);
    params.priority = configNormalized.getPriority();
    params.get_tx_hex = true;
    params.get_tx_metadata = true;
    if (configNormalized.getCanSplit()) params.get_tx_keys = true; // param to get tx key(s) depends if split
    else params.get_tx_key = true;

    // cannot apply subtractFeeFrom with `transfer_split` call
    if (configNormalized.getCanSplit() && configNormalized.getSubtractFeeFrom() && configNormalized.getSubtractFeeFrom().length > 0) {
      throw new MoneroError("subtractfeefrom transfers cannot be split over multiple transactions yet");
    }
    
    // send request
    let result;
    try {
      let resp = await this.config.getServer().sendJsonRequest(configNormalized.getCanSplit() ? "transfer_split" : "transfer", params);
      result = resp.result;
    } catch (err: any) {
      if (err.message.indexOf("WALLET_RPC_ERROR_CODE_WRONG_ADDRESS") > -1) throw new MoneroError("Invalid destination address");
      throw err;
    }
    
    // pre-initialize txs iff present. multisig and view-only wallets will have tx set without transactions
    let txs;
    let numTxs = configNormalized.getCanSplit() ? (result.fee_list !== undefined ? result.fee_list.length : 0) : (result.fee !== undefined ? 1 : 0);
    if (numTxs > 0) txs = [];
    let copyDestinations = numTxs === 1;
    for (let i = 0; i < numTxs; i++) {
      let tx = new MoneroTxWallet();
      MoneroWalletRpc.initSentTxWallet(configNormalized, tx, copyDestinations);
      tx.getOutgoingTransfer().setAccountIndex(accountIdx);
      if (subaddressIndices !== undefined && subaddressIndices.length === 1) tx.getOutgoingTransfer().setSubaddressIndices(subaddressIndices);
      txs.push(tx);
    }
    
    // notify of changes
    if (configNormalized.getRelay()) await this.poll();
    
    // initialize tx set from rpc response with pre-initialized txs
    if (configNormalized.getCanSplit()) return MoneroWalletRpc.convertRpcSentTxsToTxSet(result, txs, configNormalized).getTxs();
    else return MoneroWalletRpc.convertRpcTxToTxSet(result, txs === undefined ? undefined : txs[0], true, configNormalized).getTxs();
  }
  
  async sweepOutput(config: Partial<MoneroTxConfig>): Promise<MoneroTxWallet> {
    
    // normalize and validate config
    config = MoneroWallet.normalizeSweepOutputConfig(config);
    
    // build request parameters
    let params: any = {};
    params.address = config.getDestinations()[0].getAddress();
    params.account_index = config.getAccountIndex();
    params.subaddr_indices = config.getSubaddressIndices();
    params.key_image = config.getKeyImage();
    if (config.getUnlockTime() !== undefined) params.unlock_time = config.getUnlockTime();
    params.do_not_relay = config.getRelay() !== true;
    assert(config.getPriority() === undefined || config.getPriority() >= 0 && config.getPriority() <= 3);
    params.priority = config.getPriority();
    params.payment_id = config.getPaymentId();
    params.get_tx_key = true;
    params.get_tx_hex = true;
    params.get_tx_metadata = true;
    
    // send request
    let resp = await this.config.getServer().sendJsonRequest("sweep_single", params);
    let result = resp.result;
    
    // notify of changes
    if (config.getRelay()) await this.poll();
    
    // build and return tx
    let tx = MoneroWalletRpc.initSentTxWallet(config, undefined, true);
    MoneroWalletRpc.convertRpcTxToTxSet(result, tx, true, config);
    tx.getOutgoingTransfer().getDestinations()[0].setAmount(tx.getOutgoingTransfer().getAmount()); // initialize destination amount
    return tx;
  }
  
  async sweepUnlocked(config: Partial<MoneroTxConfig>): Promise<MoneroTxWallet[]> {
    
    // validate and normalize config
    const configNormalized = MoneroWallet.normalizeSweepUnlockedConfig(config);
    
    // determine account and subaddress indices to sweep; default to all with unlocked balance if not specified
    let indices = new Map();  // maps each account index to subaddress indices to sweep
    if (configNormalized.getAccountIndex() !== undefined) {
      if (configNormalized.getSubaddressIndices() !== undefined) {
        indices.set(configNormalized.getAccountIndex(), configNormalized.getSubaddressIndices());
      } else {
        let subaddressIndices = [];
        indices.set(configNormalized.getAccountIndex(), subaddressIndices);
        for (let subaddress of await this.getSubaddresses(configNormalized.getAccountIndex())) {
          if (subaddress.getUnlockedBalance() > 0n) subaddressIndices.push(subaddress.getIndex());
        }
      }
    } else {
      let accounts = await this.getAccounts(true);
      for (let account of accounts) {
        if (account.getUnlockedBalance() > 0n) {
          let subaddressIndices = [];
          indices.set(account.getIndex(), subaddressIndices);
          for (let subaddress of account.getSubaddresses()) {
            if (subaddress.getUnlockedBalance() > 0n) subaddressIndices.push(subaddress.getIndex());
          }
        }
      }
    }
    
    // sweep from each account and collect resulting tx sets
    let txs = [];
    for (let accountIdx of indices.keys()) {
      
      // copy and modify the original config
      let copy = configNormalized.copy();
      copy.setAccountIndex(accountIdx);
      copy.setSweepEachSubaddress(false);
      
      // sweep all subaddresses together  // TODO monero-project: can this reveal outputs belong to the same wallet?
      if (copy.getSweepEachSubaddress() !== true) {
        copy.setSubaddressIndices(indices.get(accountIdx));
        for (let tx of await this.rpcSweepAccount(copy)) txs.push(tx);
      }
      
      // otherwise sweep each subaddress individually
      else {
        for (let subaddressIdx of indices.get(accountIdx)) {
          copy.setSubaddressIndices([subaddressIdx]);
          for (let tx of await this.rpcSweepAccount(copy)) txs.push(tx);
        }
      }
    }
    
    // notify of changes
    if (configNormalized.getRelay()) await this.poll();
    return txs;
  }
  
  async sweepDust(relay?: boolean): Promise<MoneroTxWallet[]> {
    if (relay === undefined) relay = false;
    let resp = await this.config.getServer().sendJsonRequest("sweep_dust", {do_not_relay: !relay});
    if (relay) await this.poll();
    let result = resp.result;
    let txSet = MoneroWalletRpc.convertRpcSentTxsToTxSet(result);
    if (txSet.getTxs() === undefined) return [];
    for (let tx of txSet.getTxs()) {
      tx.setIsRelayed(!relay);
      tx.setInTxPool(tx.getIsRelayed());
    }
    return txSet.getTxs();
  }
  
  async relayTxs(txsOrMetadatas: (MoneroTxWallet | string)[]): Promise<string[]> {
    assert(Array.isArray(txsOrMetadatas), "Must provide an array of txs or their metadata to relay");
    let txHashes = [];
    for (let txOrMetadata of txsOrMetadatas) {
      let metadata = txOrMetadata instanceof MoneroTxWallet ? txOrMetadata.getMetadata() : txOrMetadata;
      let resp = await this.config.getServer().sendJsonRequest("relay_tx", { hex: metadata });
      txHashes.push(resp.result.tx_hash);
    }
    await this.poll(); // notify of changes
    return txHashes;
  }
  
  async describeTxSet(txSet: MoneroTxSet): Promise<MoneroTxSet> {
    let resp = await this.config.getServer().sendJsonRequest("describe_transfer", {
      unsigned_txset: txSet.getUnsignedTxHex(),
      multisig_txset: txSet.getMultisigTxHex()
    });
    return MoneroWalletRpc.convertRpcDescribeTransfer(resp.result);
  }
  
  async signTxs(unsignedTxHex: string): Promise<MoneroTxSet> {
    let resp = await this.config.getServer().sendJsonRequest("sign_transfer", {
      unsigned_txset: unsignedTxHex,
      export_raw: false
    });
    await this.poll();
    return MoneroWalletRpc.convertRpcSentTxsToTxSet(resp.result);
  }
  
  async submitTxs(signedTxHex: string): Promise<string[]> {
    let resp = await this.config.getServer().sendJsonRequest("submit_transfer", {
      tx_data_hex: signedTxHex
    });
    await this.poll();
    return resp.result.tx_hash_list;
  }
  
  async signMessage(message: string, signatureType = MoneroMessageSignatureType.SIGN_WITH_SPEND_KEY, accountIdx = 0, subaddressIdx = 0): Promise<string> {
    let resp = await this.config.getServer().sendJsonRequest("sign", {
        data: message,
        signature_type: signatureType === MoneroMessageSignatureType.SIGN_WITH_SPEND_KEY ? "spend" : "view",
        account_index: accountIdx,
        address_index: subaddressIdx
    });
    return resp.result.signature;
  }
  
  async verifyMessage(message: string, address: string, signature: string): Promise<MoneroMessageSignatureResult> {
    try {
      let resp = await this.config.getServer().sendJsonRequest("verify", {data: message, address: address, signature: signature});
      let result = resp.result;
      return new MoneroMessageSignatureResult(
        result.good ? {isGood: result.good, isOld: result.old, signatureType: result.signature_type === "view" ? MoneroMessageSignatureType.SIGN_WITH_VIEW_KEY : MoneroMessageSignatureType.SIGN_WITH_SPEND_KEY, version: result.version} : {isGood: false}
      );
    } catch (e: any) {
      if (e.getCode() === -2) return new MoneroMessageSignatureResult({isGood: false});
      throw e;
    }
  }
  
  async getTxKey(txHash: string): Promise<string> {
    try {
      return (await this.config.getServer().sendJsonRequest("get_tx_key", {txid: txHash})).result.tx_key;
    } catch (e: any) {
      if (e instanceof MoneroRpcError && e.getCode() === -8 && e.message.includes("TX ID has invalid format")) e = new MoneroRpcError("TX hash has invalid format", e.getCode(), e.getRpcMethod(), e.getRpcParams());  // normalize error message
      throw e;
    }
  }
  
  async checkTxKey(txHash: string, txKey: string, address: string): Promise<MoneroCheckTx> {
    try {
      
      // send request
      let resp = await this.config.getServer().sendJsonRequest("check_tx_key", {txid: txHash, tx_key: txKey, address: address});
      
      // interpret result
      let check = new MoneroCheckTx();
      check.setIsGood(true);
      check.setNumConfirmations(resp.result.confirmations);
      check.setInTxPool(resp.result.in_pool);
      check.setReceivedAmount(BigInt(resp.result.received));
      return check;
    } catch (e: any) {
      if (e instanceof MoneroRpcError && e.getCode() === -8 && e.message.includes("TX ID has invalid format")) e = new MoneroRpcError("TX hash has invalid format", e.getCode(), e.getRpcMethod(), e.getRpcParams());  // normalize error message
      throw e;
    }
  }
  
  async getTxProof(txHash: string, address: string, message?: string): Promise<string> {
    try {
      let resp = await this.config.getServer().sendJsonRequest("get_tx_proof", {txid: txHash, address: address, message: message});
      return resp.result.signature;
    } catch (e: any) {
      if (e instanceof MoneroRpcError && e.getCode() === -8 && e.message.includes("TX ID has invalid format")) e = new MoneroRpcError("TX hash has invalid format", e.getCode(), e.getRpcMethod(), e.getRpcParams());  // normalize error message
      throw e;
    }
  }
  
  async checkTxProof(txHash: string, address: string, message: string | undefined, signature: string): Promise<MoneroCheckTx> {
    try {
      
      // send request
      let resp = await this.config.getServer().sendJsonRequest("check_tx_proof", {
        txid: txHash,
        address: address,
        message: message,
        signature: signature
      });
      
      // interpret response
      let isGood = resp.result.good;
      let check = new MoneroCheckTx();
      check.setIsGood(isGood);
      if (isGood) {
        check.setNumConfirmations(resp.result.confirmations);
        check.setInTxPool(resp.result.in_pool);
        check.setReceivedAmount(BigInt(resp.result.received));
      }
      return check;
    } catch (e: any) {
      if (e instanceof MoneroRpcError && e.getCode() === -1 && e.message === "basic_string") e = new MoneroRpcError("Must provide signature to check tx proof", -1);
      if (e instanceof MoneroRpcError && e.getCode() === -8 && e.message.includes("TX ID has invalid format")) e = new MoneroRpcError("TX hash has invalid format", e.getCode(), e.getRpcMethod(), e.getRpcParams());
      throw e;
    }
  }
  
  async getSpendProof(txHash: string, message?: string): Promise<string> {
    try {
      let resp = await this.config.getServer().sendJsonRequest("get_spend_proof", {txid: txHash, message: message});
      return resp.result.signature;
    } catch (e: any) {
      if (e instanceof MoneroRpcError && e.getCode() === -8 && e.message.includes("TX ID has invalid format")) e = new MoneroRpcError("TX hash has invalid format", e.getCode(), e.getRpcMethod(), e.getRpcParams());  // normalize error message
      throw e;
    }
  }
  
  async checkSpendProof(txHash: string, message: string | undefined, signature: string): Promise<boolean> {
    try {
      let resp = await this.config.getServer().sendJsonRequest("check_spend_proof", {
        txid: txHash,
        message: message,
        signature: signature
      });
      return resp.result.good;
    } catch (e: any) {
      if (e instanceof MoneroRpcError && e.getCode() === -8 && e.message.includes("TX ID has invalid format")) e = new MoneroRpcError("TX hash has invalid format", e.getCode(), e.getRpcMethod(), e.getRpcParams());  // normalize error message
      throw e;
    }
  }
  
  async getReserveProofWallet(message?: string): Promise<string> {
    let resp = await this.config.getServer().sendJsonRequest("get_reserve_proof", {
      all: true,
      message: message
    });
    return resp.result.signature;
  }
  
  async getReserveProofAccount(accountIdx: number, amount: bigint, message?: string): Promise<string> {
    let resp = await this.config.getServer().sendJsonRequest("get_reserve_proof", {
      account_index: accountIdx,
      amount: amount.toString(),
      message: message
    });
    return resp.result.signature;
  }

  async checkReserveProof(address: string, message: string | undefined, signature: string): Promise<MoneroCheckReserve> {
    
    // send request
    let resp = await this.config.getServer().sendJsonRequest("check_reserve_proof", {
      address: address,
      message: message,
      signature: signature
    });
    
    // interpret results
    let isGood = resp.result.good;
    let check = new MoneroCheckReserve();
    check.setIsGood(isGood);
    if (isGood) {
      check.setUnconfirmedSpentAmount(BigInt(resp.result.spent));
      check.setTotalAmount(BigInt(resp.result.total));
    }
    return check;
  }
  
  async getTxNotes(txHashes: string[]): Promise<string[]> {
    return (await this.config.getServer().sendJsonRequest("get_tx_notes", {txids: txHashes})).result.notes;
  }
  
  async setTxNotes(txHashes: string[], notes: string[]): Promise<void> {
    await this.config.getServer().sendJsonRequest("set_tx_notes", {txids: txHashes, notes: notes});
  }
  
  async getAddressBookEntries(entryIndices?: number[]): Promise<MoneroAddressBookEntry[]> {
    let resp = await this.config.getServer().sendJsonRequest("get_address_book", {entries: entryIndices});
    if (!resp.result.entries) return [];
    let entries = [];
    for (let rpcEntry of resp.result.entries) {
      entries.push(new MoneroAddressBookEntry().setIndex(rpcEntry.index).setAddress(rpcEntry.address).setDescription(rpcEntry.description).setPaymentId(rpcEntry.payment_id));
    }
    return entries;
  }
  
  async addAddressBookEntry(address: string, description?: string): Promise<number> {
    let resp = await this.config.getServer().sendJsonRequest("add_address_book", {address: address, description: description});
    return resp.result.index;
  }
  
  async editAddressBookEntry(index: number, setAddress: boolean, address: string | undefined, setDescription: boolean, description: string | undefined): Promise<void> {
    let resp = await this.config.getServer().sendJsonRequest("edit_address_book", {
      index: index,
      set_address: setAddress,
      address: address,
      set_description: setDescription,
      description: description
    });
  }
  
  async deleteAddressBookEntry(entryIdx: number): Promise<void> {
    await this.config.getServer().sendJsonRequest("delete_address_book", {index: entryIdx});
  }
  
  async tagAccounts(tag, accountIndices) {
    await this.config.getServer().sendJsonRequest("tag_accounts", {tag: tag, accounts: accountIndices});
  }

  async untagAccounts(accountIndices: number[]): Promise<void> {
    await this.config.getServer().sendJsonRequest("untag_accounts", {accounts: accountIndices});
  }

  async getAccountTags(): Promise<MoneroAccountTag[]> {
    let tags = [];
    let resp = await this.config.getServer().sendJsonRequest("get_account_tags");
    if (resp.result.account_tags) {
      for (let rpcAccountTag of resp.result.account_tags) {
        tags.push(new MoneroAccountTag({
          tag: rpcAccountTag.tag ? rpcAccountTag.tag : undefined,
          label: rpcAccountTag.label ? rpcAccountTag.label : undefined,
          accountIndices: rpcAccountTag.accounts
        }));
      }
    }
    return tags;
  }

  async setAccountTagLabel(tag: string, label: string): Promise<void> {
    await this.config.getServer().sendJsonRequest("set_account_tag_description", {tag: tag, description: label});
  }
  
  async getPaymentUri(config: MoneroTxConfig): Promise<string> {
    config = MoneroWallet.normalizeCreateTxsConfig(config);
    let resp = await this.config.getServer().sendJsonRequest("make_uri", {
      address: config.getDestinations()[0].getAddress(),
      amount: config.getDestinations()[0].getAmount() ? config.getDestinations()[0].getAmount().toString() : undefined,
      payment_id: config.getPaymentId(),
      recipient_name: config.getRecipientName(),
      tx_description: config.getNote()
    });
    return resp.result.uri;
  }
  
  async parsePaymentUri(uri: string): Promise<MoneroTxConfig> {
    assert(uri, "Must provide URI to parse");
    let resp = await this.config.getServer().sendJsonRequest("parse_uri", {uri: uri});
    let config = new MoneroTxConfig({address: resp.result.uri.address, amount: BigInt(resp.result.uri.amount)});
    config.setPaymentId(resp.result.uri.payment_id);
    config.setRecipientName(resp.result.uri.recipient_name);
    config.setNote(resp.result.uri.tx_description);
    if ("" === config.getDestinations()[0].getAddress()) config.getDestinations()[0].setAddress(undefined);
    if ("" === config.getPaymentId()) config.setPaymentId(undefined);
    if ("" === config.getRecipientName()) config.setRecipientName(undefined);
    if ("" === config.getNote()) config.setNote(undefined);
    return config;
  }
  
  async getAttribute(key: string): Promise<string> {
    try {
      let resp = await this.config.getServer().sendJsonRequest("get_attribute", {key: key});
      return resp.result.value === "" ? undefined : resp.result.value;
    } catch (e: any) {
      if (e instanceof MoneroRpcError && e.getCode() === -45) return undefined;
      throw e;
    }
  }
  
  async setAttribute(key: string, val: string): Promise<void> {
    await this.config.getServer().sendJsonRequest("set_attribute", {key: key, value: val});
  }
  
  async startMining(numThreads: number, backgroundMining?: boolean, ignoreBattery?: boolean): Promise<void> {
    await this.config.getServer().sendJsonRequest("start_mining", {
      threads_count: numThreads,
      do_background_mining: backgroundMining,
      ignore_battery: ignoreBattery
    });
  }
  
  async stopMining(): Promise<void> {
    await this.config.getServer().sendJsonRequest("stop_mining");
  }
  
  async isMultisigImportNeeded(): Promise<boolean> {
    let resp = await this.config.getServer().sendJsonRequest("get_balance");
    return resp.result.multisig_import_needed === true;
  }
  
  async getMultisigInfo(): Promise<MoneroMultisigInfo> {
    let resp = await this.config.getServer().sendJsonRequest("is_multisig");
    let result = resp.result;
    let info = new MoneroMultisigInfo();
    info.setIsMultisig(result.multisig);
    info.setIsReady(result.ready);
    info.setThreshold(result.threshold);
    info.setNumParticipants(result.total);
    return info;
  }
  
  async prepareMultisig(): Promise<string> {
    let resp = await this.config.getServer().sendJsonRequest("prepare_multisig", {enable_multisig_experimental: true});
    this.addressCache = {};
    let result = resp.result;
    return result.multisig_info;
  }
  
  async makeMultisig(multisigHexes: string[], threshold: number, password: string): Promise<string> {
    let resp = await this.config.getServer().sendJsonRequest("make_multisig", {
      multisig_info: multisigHexes,
      threshold: threshold,
      password: password
    });
    this.addressCache = {};
    return resp.result.multisig_info;
  }
  
  async exchangeMultisigKeys(multisigHexes: string[], password: string): Promise<MoneroMultisigInitResult> {
    let resp = await this.config.getServer().sendJsonRequest("exchange_multisig_keys", {multisig_info: multisigHexes, password: password});
    this.addressCache = {};
    let msResult = new MoneroMultisigInitResult();
    msResult.setAddress(resp.result.address);
    msResult.setMultisigHex(resp.result.multisig_info);
    if (msResult.getAddress().length === 0) msResult.setAddress(undefined);
    if (msResult.getMultisigHex().length === 0) msResult.setMultisigHex(undefined);
    return msResult;
  }
  
  async exportMultisigHex(): Promise<string> {
    let resp = await this.config.getServer().sendJsonRequest("export_multisig_info");
    return resp.result.info;
  }

  async importMultisigHex(multisigHexes: string[]): Promise<number> {
    if (!GenUtils.isArray(multisigHexes)) throw new MoneroError("Must provide string[] to importMultisigHex()")
    let resp = await this.config.getServer().sendJsonRequest("import_multisig_info", {info: multisigHexes});
    return resp.result.n_outputs;
  }

  async signMultisigTxHex(multisigTxHex: string): Promise<MoneroMultisigSignResult> {
    let resp = await this.config.getServer().sendJsonRequest("sign_multisig", {tx_data_hex: multisigTxHex});
    let result = resp.result;
    let signResult = new MoneroMultisigSignResult();
    signResult.setSignedMultisigTxHex(result.tx_data_hex);
    signResult.setTxHashes(result.tx_hash_list);
    return signResult;
  }

  async submitMultisigTxHex(signedMultisigTxHex: string): Promise<string[]> {
    let resp = await this.config.getServer().sendJsonRequest("submit_multisig", {tx_data_hex: signedMultisigTxHex});
    return resp.result.tx_hash_list;
  }
  
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    return this.config.getServer().sendJsonRequest("change_wallet_password", {old_password: oldPassword || "", new_password: newPassword || ""});
  }
  
  async save(): Promise<void> {
    await this.config.getServer().sendJsonRequest("store");
  }
  
  async close(save = false): Promise<void> {
    await super.close(save);
    if (save === undefined) save = false;
    await this.clear();
    await this.config.getServer().sendJsonRequest("close_wallet", {autosave_current: save});
  }
  
  async isClosed(): Promise<boolean> {
    try {
      await this.getPrimaryAddress();
    } catch (e: any) {
      return e instanceof MoneroRpcError && e.getCode() === -13 && e.message.indexOf("No wallet file") > -1;
    }
    return false;
  }
  
  /**
   * Save and close the current wallet and stop the RPC server.
   * 
   * @return {Promise<void>}
   */
  async stop(): Promise<void> {
    await this.clear();
    await this.config.getServer().sendJsonRequest("stop_wallet");
  }
  
  // ----------- ADD JSDOC FOR SUPPORTED DEFAULT IMPLEMENTATIONS --------------

  async getNumBlocksToUnlock(): Promise<number[]> { return super.getNumBlocksToUnlock(); }
  async getTx(txHash: string): Promise<MoneroTxWallet> { return super.getTx(txHash); }
  async getIncomingTransfers(query: Partial<MoneroTransferQuery>): Promise<MoneroIncomingTransfer[]> { return super.getIncomingTransfers(query); }
  async getOutgoingTransfers(query: Partial<MoneroTransferQuery>) { return super.getOutgoingTransfers(query); }
  async createTx(config: Partial<MoneroTxConfig>): Promise<MoneroTxWallet> { return super.createTx(config); }
  async relayTx(txOrMetadata: MoneroTxWallet | string): Promise<string> { return super.relayTx(txOrMetadata); }
  async getTxNote(txHash: string): Promise<string> { return super.getTxNote(txHash); }
  async setTxNote(txHash: string, note: string): Promise<void> { return super.setTxNote(txHash, note); }
  
  // -------------------------------- PRIVATE ---------------------------------

  static async connectToWalletRpc(uriOrConfig: string | Partial<MoneroRpcConnection> | Partial<MoneroWalletConfig> | string[], username?: string, password?: string): Promise<MoneroWalletRpc> {
    let config = MoneroWalletRpc.normalizeConfig(uriOrConfig, username, password);
    if (config.cmd) return MoneroWalletRpc.startWalletRpcProcess(config);
    else return new MoneroWalletRpc(config);
  }
  
  protected static async startWalletRpcProcess(config: Partial<MoneroWalletConfig>): Promise<MoneroWalletRpc> {
    assert(GenUtils.isArray(config.cmd), "Must provide string array with command line parameters");
    
    // start process
    let child_process = await import("child_process");
    const childProcess = child_process.spawn(config.cmd[0], config.cmd.slice(1), {
      env: { ...process.env, LANG: 'en_US.UTF-8' } // scrape output in english
    });
    childProcess.stdout.setEncoding('utf8');
    childProcess.stderr.setEncoding('utf8');
    
    // return promise which resolves after starting monero-wallet-rpc
    let uri;
    let that = this;
    let output = "";
    try {
      return await new Promise(function(resolve, reject) {
      
        // handle stdout
        childProcess.stdout.on('data', async function(data) {
          let line = data.toString();
          LibraryUtils.log(2, line);
          output += line + '\n'; // capture output in case of error
          
          // extract uri from e.g. "I Binding on 127.0.0.1 (IPv4):38085"
          let uriLineContains = "Binding on ";
          let uriLineContainsIdx = line.indexOf(uriLineContains);
          if (uriLineContainsIdx >= 0) {
            let host = line.substring(uriLineContainsIdx + uriLineContains.length, line.lastIndexOf(' '));
            let unformattedLine = line.replace(/\u001b\[.*?m/g, '').trim(); // remove color formatting
            let port = unformattedLine.substring(unformattedLine.lastIndexOf(':') + 1);
            let sslIdx = config.cmd.indexOf("--rpc-ssl");
            let sslEnabled = sslIdx >= 0 ? "enabled" == config.cmd[sslIdx + 1].toLowerCase() : false;
            uri = (sslEnabled ? "https" : "http") + "://" + host + ":" + port;
          }
          
          // read success message
          if (line.indexOf("Starting wallet RPC server") >= 0) {
            
            // get username and password from params
            let userPassIdx = config.cmd.indexOf("--rpc-login");
            let userPass = userPassIdx >= 0 ? config.cmd[userPassIdx + 1] : undefined;
            let username = userPass === undefined ? undefined : userPass.substring(0, userPass.indexOf(':'));
            let password = userPass === undefined ? undefined : userPass.substring(userPass.indexOf(':') + 1);
            
            // create client connected to internal process
            config = config.copy().setServer({uri: uri, username: username, password: password, rejectUnauthorized: config.getServer() ? config.getServer().getRejectUnauthorized() : undefined});
            config.cmd = undefined;
            let wallet = await MoneroWalletRpc.connectToWalletRpc(config);
            wallet.process = childProcess;
            
            // resolve promise with client connected to internal process 
            this.isResolved = true;
            resolve(wallet);
          }
        });
        
        // handle stderr
        childProcess.stderr.on('data', function(data) {
          if (LibraryUtils.getLogLevel() >= 2) console.error(data);
        });
        
        // handle exit
        childProcess.on("exit", function(code) {
          if (!this.isResolved) reject(new MoneroError("monero-wallet-rpc process terminated with exit code " + code + (output ? ":\n\n" + output : "")));
        });
        
        // handle error
        childProcess.on("error", function(err) {
          if (err.message.indexOf("ENOENT") >= 0) reject(new MoneroError("monero-wallet-rpc does not exist at path '" + config.cmd[0] + "'"));
          if (!this.isResolved) reject(err);
        });
        
        // handle uncaught exception
        childProcess.on("uncaughtException", function(err, origin) {
          console.error("Uncaught exception in monero-wallet-rpc process: " + err.message);
          console.error(origin);
          if (!this.isResolved) reject(err);
        });
      });
    } catch (err: any) {
      throw new MoneroError(err.message);
    }
  }
  
  protected async clear() {
    this.refreshListening();
    delete this.addressCache;
    this.addressCache = {};
    this.path = undefined;
  }
  
  protected async getAccountIndices(getSubaddressIndices?: any) {
    let indices = new Map();
    for (let account of await this.getAccounts()) {
      indices.set(account.getIndex(), getSubaddressIndices ? await this.getSubaddressIndices(account.getIndex()) : undefined);
    }
    return indices;
  }
  
  protected async getSubaddressIndices(accountIdx) {
    let subaddressIndices = [];
    let resp = await this.config.getServer().sendJsonRequest("get_address", {account_index: accountIdx});
    for (let address of resp.result.addresses) subaddressIndices.push(address.address_index);
    return subaddressIndices;
  }
  
  protected async getTransfersAux(query: MoneroTransferQuery) {
    
    // build params for get_transfers rpc call
    let txQuery = query.getTxQuery();
    let canBeConfirmed = txQuery.getIsConfirmed() !== false && txQuery.getInTxPool() !== true && txQuery.getIsFailed() !== true && txQuery.getIsRelayed() !== false;
    let canBeInTxPool = txQuery.getIsConfirmed() !== true && txQuery.getInTxPool() !== false && txQuery.getIsFailed() !== true && txQuery.getHeight() === undefined && txQuery.getMaxHeight() === undefined && txQuery.getIsLocked() !== false;
    let canBeIncoming = query.getIsIncoming() !== false && query.getIsOutgoing() !== true && query.getHasDestinations() !== true;
    let canBeOutgoing = query.getIsOutgoing() !== false && query.getIsIncoming() !== true;

    // check if fetching pool txs contradicted by configuration
    if (txQuery.getInTxPool() === true && !canBeInTxPool) {
      throw new MoneroError("Cannot fetch pool transactions because it contradicts configuration");
    }

    let params: any = {};
    params.in = canBeIncoming && canBeConfirmed;
    params.out = canBeOutgoing && canBeConfirmed;
    params.pool = canBeIncoming && canBeInTxPool;
    params.pending = canBeOutgoing && canBeInTxPool;
    params.failed = txQuery.getIsFailed() !== false && txQuery.getIsConfirmed() !== true && txQuery.getInTxPool() != true;
    if (txQuery.getMinHeight() !== undefined) {
      if (txQuery.getMinHeight() > 0) params.min_height = txQuery.getMinHeight() - 1; // TODO monero-project: wallet2::get_payments() min_height is exclusive, so manually offset to match intended range (issues #5751, #5598)
      else params.min_height = txQuery.getMinHeight();
    }
    if (txQuery.getMaxHeight() !== undefined) params.max_height = txQuery.getMaxHeight();
    params.filter_by_height = txQuery.getMinHeight() !== undefined || txQuery.getMaxHeight() !== undefined;
    if (query.getAccountIndex() === undefined) {
      assert(query.getSubaddressIndex() === undefined && query.getSubaddressIndices() === undefined, "Query specifies a subaddress index but not an account index");
      params.all_accounts = true;
    } else {
      params.account_index = query.getAccountIndex();
      
      // set subaddress indices param
      let subaddressIndices = new Set();
      if (query.getSubaddressIndex() !== undefined) subaddressIndices.add(query.getSubaddressIndex());
      if (query.getSubaddressIndices() !== undefined) query.getSubaddressIndices().map(subaddressIdx => subaddressIndices.add(subaddressIdx));
      if (subaddressIndices.size) params.subaddr_indices = Array.from(subaddressIndices);
    }
    
    // cache unique txs and blocks
    let txMap = {};
    let blockMap = {};
    
    // build txs using `get_transfers`
    let resp = await this.config.getServer().sendJsonRequest("get_transfers", params);
    for (let key of Object.keys(resp.result)) {
      for (let rpcTx of resp.result[key]) {
        //if (rpcTx.txid === query.debugTxId) console.log(rpcTx);
        let tx = MoneroWalletRpc.convertRpcTxWithTransfer(rpcTx);
        if (tx.getIsConfirmed()) assert(tx.getBlock().getTxs().indexOf(tx) > -1);
        
        // replace transfer amount with destination sum
        // TODO monero-wallet-rpc: confirmed tx from/to same account has amount 0 but cached transfers
        if (tx.getOutgoingTransfer() !== undefined && tx.getIsRelayed() && !tx.getIsFailed() &&
            tx.getOutgoingTransfer().getDestinations() && tx.getOutgoingAmount() === 0n) {
          let outgoingTransfer = tx.getOutgoingTransfer();
          let transferTotal = BigInt(0);
          for (let destination of outgoingTransfer.getDestinations()) transferTotal = transferTotal + destination.getAmount();
          tx.getOutgoingTransfer().setAmount(transferTotal);
        }
        
        // merge tx
        MoneroWalletRpc.mergeTx(tx, txMap, blockMap);
      }
    }
    
    // sort txs by block height
    let txs: MoneroTxWallet[] = Object.values(txMap);
    txs.sort(MoneroWalletRpc.compareTxsByHeight);
    
    // filter and return transfers
    let transfers = [];
    for (let tx of txs) {
      
      // tx is not incoming/outgoing unless already set
      if (tx.getIsIncoming() === undefined) tx.setIsIncoming(false);
      if (tx.getIsOutgoing() === undefined) tx.setIsOutgoing(false);
      
      // sort incoming transfers
      if (tx.getIncomingTransfers() !== undefined) tx.getIncomingTransfers().sort(MoneroWalletRpc.compareIncomingTransfers);
      
      // collect queried transfers, erase if excluded
      for (let transfer of tx.filterTransfers(query)) {
        transfers.push(transfer);
      }
      
      // remove txs without requested transfer
      if (tx.getBlock() !== undefined && tx.getOutgoingTransfer() === undefined && tx.getIncomingTransfers() === undefined) {
        tx.getBlock().getTxs().splice(tx.getBlock().getTxs().indexOf(tx), 1);
      }
    }
    
    return transfers;
  }
  
  protected async getOutputsAux(query) {
    
    // determine account and subaddress indices to be queried
    let indices = new Map();
    if (query.getAccountIndex() !== undefined) {
      let subaddressIndices = new Set();
      if (query.getSubaddressIndex() !== undefined) subaddressIndices.add(query.getSubaddressIndex());
      if (query.getSubaddressIndices() !== undefined) query.getSubaddressIndices().map(subaddressIdx => subaddressIndices.add(subaddressIdx));
      indices.set(query.getAccountIndex(), subaddressIndices.size ? Array.from(subaddressIndices) : undefined);  // undefined will fetch from all subaddresses
    } else {
      assert.equal(query.getSubaddressIndex(), undefined, "Query specifies a subaddress index but not an account index")
      assert(query.getSubaddressIndices() === undefined || query.getSubaddressIndices().length === 0, "Query specifies subaddress indices but not an account index");
      indices = await this.getAccountIndices();  // fetch all account indices without subaddresses
    }
    
    // cache unique txs and blocks
    let txMap = {};
    let blockMap = {};
    
    // collect txs with outputs for each indicated account using `incoming_transfers` rpc call
    let params: any = {};
    params.transfer_type = query.getIsSpent() === true ? "unavailable" : query.getIsSpent() === false ? "available" : "all";
    params.verbose = true;
    for (let accountIdx of indices.keys()) {
    
      // send request
      params.account_index = accountIdx;
      params.subaddr_indices = indices.get(accountIdx);
      let resp = await this.config.getServer().sendJsonRequest("incoming_transfers", params);
      
      // convert response to txs with outputs and merge
      if (resp.result.transfers === undefined) continue;
      for (let rpcOutput of resp.result.transfers) {
        let tx = MoneroWalletRpc.convertRpcTxWalletWithOutput(rpcOutput);
        MoneroWalletRpc.mergeTx(tx, txMap, blockMap);
      }
    }
    
    // sort txs by block height
    let txs: MoneroTxWallet[] = Object.values(txMap);
    txs.sort(MoneroWalletRpc.compareTxsByHeight);
    
    // collect queried outputs
    let outputs = [];
    for (let tx of txs) {
      
      // sort outputs
      if (tx.getOutputs() !== undefined) tx.getOutputs().sort(MoneroWalletRpc.compareOutputs);
      
      // collect queried outputs, erase if excluded
      for (let output of tx.filterOutputs(query)) outputs.push(output);
      
      // remove excluded txs from block
      if (tx.getOutputs() === undefined && tx.getBlock() !== undefined) {
        tx.getBlock().getTxs().splice(tx.getBlock().getTxs().indexOf(tx), 1);
      }
    }
    return outputs;
  }
  
  /**
   * Common method to get key images.
   * 
   * @param all - pecifies to get all xor only new images from last import
   * @return {MoneroKeyImage[]} are the key images
   */
  protected async rpcExportKeyImages(all) {
    let resp = await this.config.getServer().sendJsonRequest("export_key_images", {all: all});
    if (!resp.result.signed_key_images) return [];
    return resp.result.signed_key_images.map(rpcImage => new MoneroKeyImage(rpcImage.key_image, rpcImage.signature));
  }
  
  protected async rpcSweepAccount(config) {
    
    // validate config
    if (config === undefined) throw new MoneroError("Must provide sweep config");
    if (config.getAccountIndex() === undefined) throw new MoneroError("Must provide an account index to sweep from");
    if (config.getDestinations() === undefined || config.getDestinations().length != 1) throw new MoneroError("Must provide exactly one destination to sweep to");
    if (config.getDestinations()[0].getAddress() === undefined) throw new MoneroError("Must provide destination address to sweep to");
    if (config.getDestinations()[0].getAmount() !== undefined) throw new MoneroError("Cannot specify amount in sweep config");
    if (config.getKeyImage() !== undefined) throw new MoneroError("Key image defined; use sweepOutput() to sweep an output by its key image");
    if (config.getSubaddressIndices() !== undefined && config.getSubaddressIndices().length === 0) throw new MoneroError("Empty list given for subaddresses indices to sweep");
    if (config.getSweepEachSubaddress()) throw new MoneroError("Cannot sweep each subaddress with RPC `sweep_all`");
    if (config.getSubtractFeeFrom() !== undefined && config.getSubtractFeeFrom().length > 0) throw new MoneroError("Sweeping output does not support subtracting fees from destinations");
    
    // sweep from all subaddresses if not otherwise defined
    if (config.getSubaddressIndices() === undefined) {
      config.setSubaddressIndices([]);
      for (let subaddress of await this.getSubaddresses(config.getAccountIndex())) {
        config.getSubaddressIndices().push(subaddress.getIndex());
      }
    }
    if (config.getSubaddressIndices().length === 0) throw new MoneroError("No subaddresses to sweep from");
    
    // common config params
    let params: any = {};
    let relay = config.getRelay() === true;
    params.account_index = config.getAccountIndex();
    params.subaddr_indices = config.getSubaddressIndices();
    params.address = config.getDestinations()[0].getAddress();
    assert(config.getPriority() === undefined || config.getPriority() >= 0 && config.getPriority() <= 3);
    params.priority = config.getPriority();
    if (config.getUnlockTime() !== undefined) params.unlock_time = config.getUnlockTime();
    params.payment_id = config.getPaymentId();
    params.do_not_relay = !relay;
    params.below_amount = config.getBelowAmount();
    params.get_tx_keys = true;
    params.get_tx_hex = true;
    params.get_tx_metadata = true;
    
    // invoke wallet rpc `sweep_all`
    let resp = await this.config.getServer().sendJsonRequest("sweep_all", params);
    let result = resp.result;
    
    // initialize txs from response
    let txSet = MoneroWalletRpc.convertRpcSentTxsToTxSet(result, undefined, config);
    
    // initialize remaining known fields
    for (let tx of txSet.getTxs()) {
      tx.setIsLocked(true);
      tx.setIsConfirmed(false);
      tx.setNumConfirmations(0);
      tx.setRelay(relay);
      tx.setInTxPool(relay);
      tx.setIsRelayed(relay);
      tx.setIsMinerTx(false);
      tx.setIsFailed(false);
      let transfer = tx.getOutgoingTransfer();
      transfer.setAccountIndex(config.getAccountIndex());
      if (config.getSubaddressIndices().length === 1) transfer.setSubaddressIndices(config.getSubaddressIndices());
      let destination = new MoneroDestination(config.getDestinations()[0].getAddress(), BigInt(transfer.getAmount()));
      transfer.setDestinations([destination]);
      tx.setOutgoingTransfer(transfer);
      tx.setPaymentId(config.getPaymentId());
      if (tx.getUnlockTime() === undefined) tx.setUnlockTime(config.getUnlockTime() === undefined ? 0 : config.getUnlockTime());
      if (tx.getRelay()) {
        if (tx.getLastRelayedTimestamp() === undefined) tx.setLastRelayedTimestamp(+new Date().getTime());  // TODO (monero-wallet-rpc): provide timestamp on response; unconfirmed timestamps vary
        if (tx.getIsDoubleSpendSeen() === undefined) tx.setIsDoubleSpendSeen(false);
      }
    }
    return txSet.getTxs();
  }
  
  protected refreshListening() {
    if (this.walletPoller == undefined && this.listeners.length) this.walletPoller = new WalletPoller(this);
    if (this.walletPoller !== undefined) this.walletPoller.setIsPolling(this.listeners.length > 0);
  }
  
  /**
   * Poll if listening.
   */
  protected async poll() {
    if (this.walletPoller !== undefined && this.walletPoller.isPolling) await this.walletPoller.poll();
  }
  
  // ---------------------------- PRIVATE STATIC ------------------------------
  
  protected static normalizeConfig(uriOrConfig: string | Partial<MoneroRpcConnection> | Partial<MoneroWalletConfig> | string[], username?: string, password?: string): MoneroWalletConfig {
    let config: undefined | Partial<MoneroWalletConfig> = undefined;
    if (typeof uriOrConfig === "string" || (uriOrConfig as Partial<MoneroRpcConnection>).uri) config = new MoneroWalletConfig({server: new MoneroRpcConnection(uriOrConfig as string | Partial<MoneroRpcConnection>, username, password)});
    else if (GenUtils.isArray(uriOrConfig)) config = new MoneroWalletConfig({cmd: uriOrConfig as string[]});
    else config = new MoneroWalletConfig(uriOrConfig as Partial<MoneroWalletConfig>);
    if (config.proxyToWorker === undefined) config.proxyToWorker = true;
    return config as MoneroWalletConfig;
  }
  
  /**
   * Remove criteria which requires looking up other transfers/outputs to
   * fulfill query.
   * 
   * @param {MoneroTxQuery} query - the query to decontextualize
   * @return {MoneroTxQuery} a reference to the query for convenience
   */
  protected static decontextualize(query) {
    query.setIsIncoming(undefined);
    query.setIsOutgoing(undefined);
    query.setTransferQuery(undefined);
    query.setInputQuery(undefined);
    query.setOutputQuery(undefined);
    return query;
  }
  
  protected static isContextual(query) {
    if (!query) return false;
    if (!query.getTxQuery()) return false;
    if (query.getTxQuery().getIsIncoming() !== undefined) return true; // requires getting other transfers
    if (query.getTxQuery().getIsOutgoing() !== undefined) return true;
    if (query instanceof MoneroTransferQuery) {
      if (query.getTxQuery().getOutputQuery() !== undefined) return true; // requires getting other outputs
    } else if (query instanceof MoneroOutputQuery) {
      if (query.getTxQuery().getTransferQuery() !== undefined) return true; // requires getting other transfers
    } else {
      throw new MoneroError("query must be tx or transfer query");
    }
    return false;
  }
  
  protected static convertRpcAccount(rpcAccount) {
    let account = new MoneroAccount();
    for (let key of Object.keys(rpcAccount)) {
      let val = rpcAccount[key];
      if (key === "account_index") account.setIndex(val);
      else if (key === "balance") account.setBalance(BigInt(val));
      else if (key === "unlocked_balance") account.setUnlockedBalance(BigInt(val));
      else if (key === "base_address") account.setPrimaryAddress(val);
      else if (key === "tag") account.setTag(val);
      else if (key === "label") { } // label belongs to first subaddress
      else console.log("WARNING: ignoring unexpected account field: " + key + ": " + val);
    }
    if ("" === account.getTag()) account.setTag(undefined);
    return account;
  }
  
  protected static convertRpcSubaddress(rpcSubaddress) {
    let subaddress = new MoneroSubaddress();
    for (let key of Object.keys(rpcSubaddress)) {
      let val = rpcSubaddress[key];
      if (key === "account_index") subaddress.setAccountIndex(val);
      else if (key === "address_index") subaddress.setIndex(val);
      else if (key === "address") subaddress.setAddress(val);
      else if (key === "balance") subaddress.setBalance(BigInt(val));
      else if (key === "unlocked_balance") subaddress.setUnlockedBalance(BigInt(val));
      else if (key === "num_unspent_outputs") subaddress.setNumUnspentOutputs(val);
      else if (key === "label") { if (val) subaddress.setLabel(val); }
      else if (key === "used") subaddress.setIsUsed(val);
      else if (key === "blocks_to_unlock") subaddress.setNumBlocksToUnlock(val);
      else if (key == "time_to_unlock") {}  // ignoring
      else console.log("WARNING: ignoring unexpected subaddress field: " + key + ": " + val);
    }
    return subaddress;
  }
  
  /**
   * Initializes a sent transaction.
   * 
   * TODO: remove copyDestinations after >18.3.1 when subtractFeeFrom fully supported
   * 
   * @param {MoneroTxConfig} config - send config
   * @param {MoneroTxWallet} [tx] - existing transaction to initialize (optional)
   * @param {boolean} copyDestinations - copies config destinations if true
   * @return {MoneroTxWallet} is the initialized send tx
   */
  protected static initSentTxWallet(config, tx, copyDestinations) {
    if (!tx) tx = new MoneroTxWallet();
    let relay = config.getRelay() === true;
    tx.setIsOutgoing(true);
    tx.setIsConfirmed(false);
    tx.setNumConfirmations(0);
    tx.setInTxPool(relay);
    tx.setRelay(relay);
    tx.setIsRelayed(relay);
    tx.setIsMinerTx(false);
    tx.setIsFailed(false);
    tx.setIsLocked(true);
    tx.setRingSize(MoneroUtils.RING_SIZE);
    let transfer = new MoneroOutgoingTransfer();
    transfer.setTx(tx);
    if (config.getSubaddressIndices() && config.getSubaddressIndices().length === 1) transfer.setSubaddressIndices(config.getSubaddressIndices().slice(0)); // we know src subaddress indices iff config specifies 1
    if (copyDestinations) {
      let destCopies = [];
      for (let dest of config.getDestinations()) destCopies.push(dest.copy());
      transfer.setDestinations(destCopies);
    }
    tx.setOutgoingTransfer(transfer);
    tx.setPaymentId(config.getPaymentId());
    if (tx.getUnlockTime() === undefined) tx.setUnlockTime(config.getUnlockTime() === undefined ? 0 : config.getUnlockTime());
    if (config.getRelay()) {
      if (tx.getLastRelayedTimestamp() === undefined) tx.setLastRelayedTimestamp(+new Date().getTime());  // TODO (monero-wallet-rpc): provide timestamp on response; unconfirmed timestamps vary
      if (tx.getIsDoubleSpendSeen() === undefined) tx.setIsDoubleSpendSeen(false);
    }
    return tx;
  }
  
  /**
   * Initializes a tx set from a RPC map excluding txs.
   * 
   * @param rpcMap - map to initialize the tx set from
   * @return MoneroTxSet - initialized tx set
   * @return the resulting tx set
   */
  protected static convertRpcTxSet(rpcMap) {
    let txSet = new MoneroTxSet();
    txSet.setMultisigTxHex(rpcMap.multisig_txset);
    txSet.setUnsignedTxHex(rpcMap.unsigned_txset);
    txSet.setSignedTxHex(rpcMap.signed_txset);
    if (txSet.getMultisigTxHex() !== undefined && txSet.getMultisigTxHex().length === 0) txSet.setMultisigTxHex(undefined);
    if (txSet.getUnsignedTxHex() !== undefined && txSet.getUnsignedTxHex().length === 0) txSet.setUnsignedTxHex(undefined);
    if (txSet.getSignedTxHex() !== undefined && txSet.getSignedTxHex().length === 0) txSet.setSignedTxHex(undefined);
    return txSet;
  }
  
  /**
   * Initializes a MoneroTxSet from a list of rpc txs.
   * 
   * @param rpcTxs - rpc txs to initialize the set from
   * @param txs - existing txs to further initialize (optional)
   * @param config - tx config
   * @return the converted tx set
   */
  protected static convertRpcSentTxsToTxSet(rpcTxs: any, txs?: any, config?: any) {
    
    // build shared tx set
    let txSet = MoneroWalletRpc.convertRpcTxSet(rpcTxs);

    // get number of txs
    let numTxs = rpcTxs.fee_list ? rpcTxs.fee_list.length : rpcTxs.tx_hash_list ? rpcTxs.tx_hash_list.length : 0;
    
    // done if rpc response contains no txs
    if (numTxs === 0) {
      assert.equal(txs, undefined);
      return txSet;
    }
    
    // initialize txs if none given
    if (txs) txSet.setTxs(txs);
    else {
      txs = [];
      for (let i = 0; i < numTxs; i++) txs.push(new MoneroTxWallet());
    }
    for (let tx of txs) {
      tx.setTxSet(txSet);
      tx.setIsOutgoing(true);
    }
    txSet.setTxs(txs);
    
    // initialize txs from rpc lists
    for (let key of Object.keys(rpcTxs)) {
      let val = rpcTxs[key];
      if (key === "tx_hash_list") for (let i = 0; i < val.length; i++) txs[i].setHash(val[i]);
      else if (key === "tx_key_list") for (let i = 0; i < val.length; i++) txs[i].setKey(val[i]);
      else if (key === "tx_blob_list") for (let i = 0; i < val.length; i++) txs[i].setFullHex(val[i]);
      else if (key === "tx_metadata_list") for (let i = 0; i < val.length; i++) txs[i].setMetadata(val[i]);
      else if (key === "fee_list") for (let i = 0; i < val.length; i++) txs[i].setFee(BigInt(val[i]));
      else if (key === "weight_list") for (let i = 0; i < val.length; i++) txs[i].setWeight(val[i]);
      else if (key === "amount_list") {
        for (let i = 0; i < val.length; i++) {
          if (txs[i].getOutgoingTransfer() == undefined) txs[i].setOutgoingTransfer(new MoneroOutgoingTransfer().setTx(txs[i]));
          txs[i].getOutgoingTransfer().setAmount(BigInt(val[i]));
        }
      }
      else if (key === "multisig_txset" || key === "unsigned_txset" || key === "signed_txset") {} // handled elsewhere
      else if (key === "spent_key_images_list") {
        let inputKeyImagesList = val;
        for (let i = 0; i < inputKeyImagesList.length; i++) {
          GenUtils.assertTrue(txs[i].getInputs() === undefined);
          txs[i].setInputs([]);
          for (let inputKeyImage of inputKeyImagesList[i]["key_images"]) {
            txs[i].getInputs().push(new MoneroOutputWallet().setKeyImage(new MoneroKeyImage().setHex(inputKeyImage)).setTx(txs[i]));
          }
        }
      }
      else if (key === "amounts_by_dest_list") {
        let amountsByDestList = val;
        let destinationIdx = 0;
        for (let txIdx = 0; txIdx < amountsByDestList.length; txIdx++) {
          let amountsByDest = amountsByDestList[txIdx]["amounts"];
          if (txs[txIdx].getOutgoingTransfer() === undefined) txs[txIdx].setOutgoingTransfer(new MoneroOutgoingTransfer().setTx(txs[txIdx]));
          txs[txIdx].getOutgoingTransfer().setDestinations([]);
          for (let amount of amountsByDest) {
            if (config.getDestinations().length === 1) txs[txIdx].getOutgoingTransfer().getDestinations().push(new MoneroDestination(config.getDestinations()[0].getAddress(), BigInt(amount))); // sweeping can create multiple txs with one address
            else txs[txIdx].getOutgoingTransfer().getDestinations().push(new MoneroDestination(config.getDestinations()[destinationIdx++].getAddress(), BigInt(amount)));
          }
        }
      }
      else console.log("WARNING: ignoring unexpected transaction field: " + key + ": " + val);
    }
    
    return txSet;
  }
  
  /**
   * Converts a rpc tx with a transfer to a tx set with a tx and transfer.
   * 
   * @param rpcTx - rpc tx to build from
   * @param tx - existing tx to continue initializing (optional)
   * @param isOutgoing - specifies if the tx is outgoing if true, incoming if false, or decodes from type if undefined
   * @param config - tx config
   * @return the initialized tx set with a tx
   */
  protected static convertRpcTxToTxSet(rpcTx, tx, isOutgoing, config) {
    let txSet = MoneroWalletRpc.convertRpcTxSet(rpcTx);
    txSet.setTxs([MoneroWalletRpc.convertRpcTxWithTransfer(rpcTx, tx, isOutgoing, config).setTxSet(txSet)]);
    return txSet;
  }
  
  /**
   * Builds a MoneroTxWallet from a RPC tx.
   * 
   * @param rpcTx - rpc tx to build from
   * @param tx - existing tx to continue initializing (optional)
   * @param isOutgoing - specifies if the tx is outgoing if true, incoming if false, or decodes from type if undefined
   * @param config - tx config
   * @return {MoneroTxWallet} is the initialized tx
   */
  protected static convertRpcTxWithTransfer(rpcTx: any, tx?: any, isOutgoing?: any, config?: any) {  // TODO: change everything to safe set
        
    // initialize tx to return
    if (!tx) tx = new MoneroTxWallet();
    
    // initialize tx state from rpc type
    if (rpcTx.type !== undefined) isOutgoing = MoneroWalletRpc.decodeRpcType(rpcTx.type, tx);
    else assert.equal(typeof isOutgoing, "boolean", "Must indicate if tx is outgoing (true) xor incoming (false) since unknown");
    
    // TODO: safe set
    // initialize remaining fields  TODO: seems this should be part of common function with DaemonRpc.convertRpcTx
    let header;
    let transfer;
    for (let key of Object.keys(rpcTx)) {
      let val = rpcTx[key];
      if (key === "txid") tx.setHash(val);
      else if (key === "tx_hash") tx.setHash(val);
      else if (key === "fee") tx.setFee(BigInt(val));
      else if (key === "note") { if (val) tx.setNote(val); }
      else if (key === "tx_key") tx.setKey(val);
      else if (key === "type") { } // type already handled
      else if (key === "tx_size") tx.setSize(val);
      else if (key === "unlock_time") tx.setUnlockTime(val);
      else if (key === "weight") tx.setWeight(val);
      else if (key === "locked") tx.setIsLocked(val);
      else if (key === "tx_blob") tx.setFullHex(val);
      else if (key === "tx_metadata") tx.setMetadata(val);
      else if (key === "double_spend_seen") tx.setIsDoubleSpendSeen(val);
      else if (key === "block_height" || key === "height") {
        if (tx.getIsConfirmed()) {
          if (!header) header = new MoneroBlockHeader();
          header.setHeight(val);
        }
      }
      else if (key === "timestamp") {
        if (tx.getIsConfirmed()) {
          if (!header) header = new MoneroBlockHeader();
          header.setTimestamp(val);
        } else {
          // timestamp of unconfirmed tx is current request time
        }
      }
      else if (key === "confirmations") tx.setNumConfirmations(val);
      else if (key === "suggested_confirmations_threshold") {
        if (transfer === undefined) transfer = (isOutgoing ? new MoneroOutgoingTransfer() : new MoneroIncomingTransfer()).setTx(tx);
        if (!isOutgoing) transfer.setNumSuggestedConfirmations(val);
      }
      else if (key === "amount") {
        if (transfer === undefined) transfer = (isOutgoing ? new MoneroOutgoingTransfer() : new MoneroIncomingTransfer()).setTx(tx);
        transfer.setAmount(BigInt(val));
      }
      else if (key === "amounts") {}  // ignoring, amounts sum to amount
      else if (key === "address") {
        if (!isOutgoing) {
          if (!transfer) transfer = new MoneroIncomingTransfer().setTx(tx);
          transfer.setAddress(val);
        }
      }
      else if (key === "payment_id") {
        if ("" !== val && MoneroTxWallet.DEFAULT_PAYMENT_ID !== val) tx.setPaymentId(val);  // default is undefined
      }
      else if (key === "subaddr_index") assert(rpcTx.subaddr_indices);  // handled by subaddr_indices
      else if (key === "subaddr_indices") {
        if (!transfer) transfer = (isOutgoing ? new MoneroOutgoingTransfer() : new MoneroIncomingTransfer()).setTx(tx);
        let rpcIndices = val;
        transfer.setAccountIndex(rpcIndices[0].major);
        if (isOutgoing) {
          let subaddressIndices = [];
          for (let rpcIndex of rpcIndices) subaddressIndices.push(rpcIndex.minor);
          transfer.setSubaddressIndices(subaddressIndices);
        } else {
          assert.equal(rpcIndices.length, 1);
          transfer.setSubaddressIndex(rpcIndices[0].minor);
        }
      }
      else if (key === "destinations" || key == "recipients") {
        assert(isOutgoing);
        let destinations = [];
        for (let rpcDestination of val) {
          let destination = new MoneroDestination();
          destinations.push(destination);
          for (let destinationKey of Object.keys(rpcDestination)) {
            if (destinationKey === "address") destination.setAddress(rpcDestination[destinationKey]);
            else if (destinationKey === "amount") destination.setAmount(BigInt(rpcDestination[destinationKey]));
            else throw new MoneroError("Unrecognized transaction destination field: " + destinationKey);
          }
        }
        if (transfer === undefined) transfer = new MoneroOutgoingTransfer({tx: tx});
        transfer.setDestinations(destinations);
      }
      else if (key === "multisig_txset" && val !== undefined) {} // handled elsewhere; this method only builds a tx wallet
      else if (key === "unsigned_txset" && val !== undefined) {} // handled elsewhere; this method only builds a tx wallet
      else if (key === "amount_in") tx.setInputSum(BigInt(val));
      else if (key === "amount_out") tx.setOutputSum(BigInt(val));
      else if (key === "change_address") tx.setChangeAddress(val === "" ? undefined : val);
      else if (key === "change_amount") tx.setChangeAmount(BigInt(val));
      else if (key === "dummy_outputs") tx.setNumDummyOutputs(val);
      else if (key === "extra") tx.setExtraHex(val);
      else if (key === "ring_size") tx.setRingSize(val);
      else if (key === "spent_key_images") {
        let inputKeyImages = val.key_images;
        GenUtils.assertTrue(tx.getInputs() === undefined);
        tx.setInputs([]);
        for (let inputKeyImage of inputKeyImages) {
          tx.getInputs().push(new MoneroOutputWallet().setKeyImage(new MoneroKeyImage().setHex(inputKeyImage)).setTx(tx));
        }
      }
      else if (key === "amounts_by_dest") {
        GenUtils.assertTrue(isOutgoing);
        let amountsByDest = val.amounts;
        assert.equal(config.getDestinations().length, amountsByDest.length);
        if (transfer === undefined) transfer = new MoneroOutgoingTransfer().setTx(tx);
        transfer.setDestinations([]);
        for (let i = 0; i < config.getDestinations().length; i++) {
          transfer.getDestinations().push(new MoneroDestination(config.getDestinations()[i].getAddress(), BigInt(amountsByDest[i])));
        }
      }
      else console.log("WARNING: ignoring unexpected transaction field with transfer: " + key + ": " + val);
    }
    
    // link block and tx
    if (header) tx.setBlock(new MoneroBlock(header).setTxs([tx]));
    
    // initialize final fields
    if (transfer) {
      if (tx.getIsConfirmed() === undefined) tx.setIsConfirmed(false);
      if (!transfer.getTx().getIsConfirmed()) tx.setNumConfirmations(0);
      if (isOutgoing) {
        tx.setIsOutgoing(true);
        if (tx.getOutgoingTransfer()) {
          if (transfer.getDestinations()) tx.getOutgoingTransfer().setDestinations(undefined); // overwrite to avoid reconcile error TODO: remove after >18.3.1 when amounts_by_dest supported
          tx.getOutgoingTransfer().merge(transfer);
        }
        else tx.setOutgoingTransfer(transfer);
      } else {
        tx.setIsIncoming(true);
        tx.setIncomingTransfers([transfer]);
      }
    }
    
    // return initialized transaction
    return tx;
  }
  
  protected static convertRpcTxWalletWithOutput(rpcOutput) {
    
    // initialize tx
    let tx = new MoneroTxWallet();
    tx.setIsConfirmed(true);
    tx.setIsRelayed(true);
    tx.setIsFailed(false);
    
    // initialize output
    let output = new MoneroOutputWallet({tx: tx});
    for (let key of Object.keys(rpcOutput)) {
      let val = rpcOutput[key];
      if (key === "amount") output.setAmount(BigInt(val));
      else if (key === "spent") output.setIsSpent(val);
      else if (key === "key_image") { if ("" !== val) output.setKeyImage(new MoneroKeyImage(val)); }
      else if (key === "global_index") output.setIndex(val);
      else if (key === "tx_hash") tx.setHash(val);
      else if (key === "unlocked") tx.setIsLocked(!val);
      else if (key === "frozen") output.setIsFrozen(val);
      else if (key === "pubkey") output.setStealthPublicKey(val);
      else if (key === "subaddr_index") {
        output.setAccountIndex(val.major);
        output.setSubaddressIndex(val.minor);
      }
      else if (key === "block_height") tx.setBlock((new MoneroBlock().setHeight(val) as MoneroBlock).setTxs([tx as MoneroTx]));
      else console.log("WARNING: ignoring unexpected transaction field: " + key + ": " + val);
    }
    
    // initialize tx with output
    tx.setOutputs([output]);
    return tx;
  }
  
  protected static convertRpcDescribeTransfer(rpcDescribeTransferResult) {
    let txSet = new MoneroTxSet();
    for (let key of Object.keys(rpcDescribeTransferResult)) {
      let val = rpcDescribeTransferResult[key];
      if (key === "desc") {
        txSet.setTxs([]);
        for (let txMap of val) {
          let tx = MoneroWalletRpc.convertRpcTxWithTransfer(txMap, undefined, true);
          tx.setTxSet(txSet);
          txSet.getTxs().push(tx);
        }
      }
      else if (key === "summary") { } // TODO: support tx set summary fields?
      else console.log("WARNING: ignoring unexpected descdribe transfer field: " + key + ": " + val);
    }
    return txSet;
  }
  
  /**
   * Decodes a "type" from monero-wallet-rpc to initialize type and state
   * fields in the given transaction.
   * 
   * TODO: these should be safe set
   * 
   * @param rpcType is the type to decode
   * @param tx is the transaction to decode known fields to
   * @return {boolean} true if the rpc type indicates outgoing xor incoming
   */
  protected static decodeRpcType(rpcType, tx) {
    let isOutgoing;
    if (rpcType === "in") {
      isOutgoing = false;
      tx.setIsConfirmed(true);
      tx.setInTxPool(false);
      tx.setIsRelayed(true);
      tx.setRelay(true);
      tx.setIsFailed(false);
      tx.setIsMinerTx(false);
    } else if (rpcType === "out") {
      isOutgoing = true;
      tx.setIsConfirmed(true);
      tx.setInTxPool(false);
      tx.setIsRelayed(true);
      tx.setRelay(true);
      tx.setIsFailed(false);
      tx.setIsMinerTx(false);
    } else if (rpcType === "pool") {
      isOutgoing = false;
      tx.setIsConfirmed(false);
      tx.setInTxPool(true);
      tx.setIsRelayed(true);
      tx.setRelay(true);
      tx.setIsFailed(false);
      tx.setIsMinerTx(false);  // TODO: but could it be?
    } else if (rpcType === "pending") {
      isOutgoing = true;
      tx.setIsConfirmed(false);
      tx.setInTxPool(true);
      tx.setIsRelayed(true);
      tx.setRelay(true);
      tx.setIsFailed(false);
      tx.setIsMinerTx(false);
    } else if (rpcType === "block") {
      isOutgoing = false;
      tx.setIsConfirmed(true);
      tx.setInTxPool(false);
      tx.setIsRelayed(true);
      tx.setRelay(true);
      tx.setIsFailed(false);
      tx.setIsMinerTx(true);
    } else if (rpcType === "failed") {
      isOutgoing = true;
      tx.setIsConfirmed(false);
      tx.setInTxPool(false);
      tx.setIsRelayed(true);
      tx.setRelay(true);
      tx.setIsFailed(true);
      tx.setIsMinerTx(false);
    } else {
      throw new MoneroError("Unrecognized transfer type: " + rpcType);
    }
    return isOutgoing;
  }
  
  /**
   * Merges a transaction into a unique set of transactions.
   *
   * @param {MoneroTxWallet} tx - the transaction to merge into the existing txs
   * @param {Object} txMap - maps tx hashes to txs
   * @param {Object} blockMap - maps block heights to blocks
   */
  protected static mergeTx(tx, txMap, blockMap) {
    assert(tx.getHash() !== undefined);
    
    // merge tx
    let aTx = txMap[tx.getHash()];
    if (aTx === undefined) txMap[tx.getHash()] = tx; // cache new tx
    else aTx.merge(tx); // merge with existing tx
    
    // merge tx's block if confirmed
    if (tx.getHeight() !== undefined) {
      let aBlock = blockMap[tx.getHeight()];
      if (aBlock === undefined) blockMap[tx.getHeight()] = tx.getBlock(); // cache new block
      else aBlock.merge(tx.getBlock()); // merge with existing block
    }
  }
  
  /**
   * Compares two transactions by their height.
   */
  protected static compareTxsByHeight(tx1, tx2) {
    if (tx1.getHeight() === undefined && tx2.getHeight() === undefined) return 0; // both unconfirmed
    else if (tx1.getHeight() === undefined) return 1;   // tx1 is unconfirmed
    else if (tx2.getHeight() === undefined) return -1;  // tx2 is unconfirmed
    let diff = tx1.getHeight() - tx2.getHeight();
    if (diff !== 0) return diff;
    return tx1.getBlock().getTxs().indexOf(tx1) - tx2.getBlock().getTxs().indexOf(tx2); // txs are in the same block so retain their original order
  }
  
  /**
   * Compares two transfers by ascending account and subaddress indices.
   */
  static compareIncomingTransfers(t1, t2) {
    if (t1.getAccountIndex() < t2.getAccountIndex()) return -1;
    else if (t1.getAccountIndex() === t2.getAccountIndex()) return t1.getSubaddressIndex() - t2.getSubaddressIndex();
    return 1;
  }
  
  /**
   * Compares two outputs by ascending account and subaddress indices.
   */
  protected static compareOutputs(o1, o2) {
    
    // compare by height
    let heightComparison = MoneroWalletRpc.compareTxsByHeight(o1.getTx(), o2.getTx());
    if (heightComparison !== 0) return heightComparison;
    
    // compare by account index, subaddress index, output index, then key image hex
    let compare = o1.getAccountIndex() - o2.getAccountIndex();
    if (compare !== 0) return compare;
    compare = o1.getSubaddressIndex() - o2.getSubaddressIndex();
    if (compare !== 0) return compare;
    compare = o1.getIndex() - o2.getIndex();
    if (compare !== 0) return compare;
    return o1.getKeyImage().getHex().localeCompare(o2.getKeyImage().getHex());
  }
}

/**
 * Polls monero-wallet-rpc to provide listener notifications.
 * 
 * @private
 */
class WalletPoller {

  // instance variables
  isPolling: boolean;
  protected wallet: MoneroWalletRpc;
  protected looper: TaskLooper;
  protected prevLockedTxs: any;
  protected prevUnconfirmedNotifications: any;
  protected prevConfirmedNotifications: any;
  protected threadPool: any;
  protected numPolling: any;
  protected prevHeight: any;
  protected prevBalances: any;
  
  constructor(wallet) {
    let that = this;
    this.wallet = wallet;
    this.looper = new TaskLooper(async function() { await that.poll(); });
    this.prevLockedTxs = [];
    this.prevUnconfirmedNotifications = new Set(); // tx hashes of previous notifications
    this.prevConfirmedNotifications = new Set(); // tx hashes of previously confirmed but not yet unlocked notifications
    this.threadPool = new ThreadPool(1); // synchronize polls
    this.numPolling = 0;
  }
  
  setIsPolling(isPolling) {
    this.isPolling = isPolling;
    if (isPolling) this.looper.start(this.wallet.getSyncPeriodInMs());
    else this.looper.stop();
  }
  
  setPeriodInMs(periodInMs) {
    this.looper.setPeriodInMs(periodInMs);
  }
  
  async poll() {

    // skip if next poll is queued
    if (this.numPolling > 1) return;
    this.numPolling++;
    
    // synchronize polls
    let that = this;
    return this.threadPool.submit(async function() {
      try {
        
        // skip if wallet is closed
        if (await that.wallet.isClosed()) {
          that.numPolling--;
          return;
        }
        
        // take initial snapshot
        if (that.prevBalances === undefined) {
          that.prevHeight = await that.wallet.getHeight();
          that.prevLockedTxs = await that.wallet.getTxs(new MoneroTxQuery().setIsLocked(true));
          that.prevBalances = await that.wallet.getBalances();
          that.numPolling--;
          return;
        }
        
        // announce height changes
        let height = await that.wallet.getHeight();
        if (that.prevHeight !== height) {
          for (let i = that.prevHeight; i < height; i++) await that.onNewBlock(i);
          that.prevHeight = height;
        }
        
        // get locked txs for comparison to previous
        let minHeight = Math.max(0, height - 70); // only monitor recent txs
        let lockedTxs = await that.wallet.getTxs(new MoneroTxQuery().setIsLocked(true).setMinHeight(minHeight).setIncludeOutputs(true));
        
        // collect hashes of txs no longer locked
        let noLongerLockedHashes = [];
        for (let prevLockedTx of that.prevLockedTxs) {
          if (that.getTx(lockedTxs, prevLockedTx.getHash()) === undefined) {
            noLongerLockedHashes.push(prevLockedTx.getHash());
          }
        }
        
        // save locked txs for next comparison
        that.prevLockedTxs = lockedTxs;
        
        // fetch txs which are no longer locked
        let unlockedTxs = noLongerLockedHashes.length === 0 ? [] : await that.wallet.getTxs(new MoneroTxQuery().setIsLocked(false).setMinHeight(minHeight).setHashes(noLongerLockedHashes).setIncludeOutputs(true));
         
        // announce new unconfirmed and confirmed outputs
        for (let lockedTx of lockedTxs) {
          let searchSet = lockedTx.getIsConfirmed() ? that.prevConfirmedNotifications : that.prevUnconfirmedNotifications;
          let unannounced = !searchSet.has(lockedTx.getHash());
          searchSet.add(lockedTx.getHash());
          if (unannounced) await that.notifyOutputs(lockedTx);
        }
        
        // announce new unlocked outputs
        for (let unlockedTx of unlockedTxs) {
          that.prevUnconfirmedNotifications.delete(unlockedTx.getHash());
          that.prevConfirmedNotifications.delete(unlockedTx.getHash());
          await that.notifyOutputs(unlockedTx);
        }
        
        // announce balance changes
        await that.checkForChangedBalances();
        that.numPolling--;
      } catch (err: any) {
        that.numPolling--;
        console.error("Failed to background poll wallet '" + await that.wallet.getPath() + "': " + err.message);
      }
    });
  }
  
  protected async onNewBlock(height) {
    await this.wallet.announceNewBlock(height);
  }
  
  protected async notifyOutputs(tx) {
  
    // notify spent outputs // TODO (monero-project): monero-wallet-rpc does not allow scrape of tx inputs so providing one input with outgoing amount
    if (tx.getOutgoingTransfer() !== undefined) {
      assert(tx.getInputs() === undefined);
      let output = new MoneroOutputWallet()
          .setAmount(tx.getOutgoingTransfer().getAmount() + tx.getFee())
          .setAccountIndex(tx.getOutgoingTransfer().getAccountIndex())
          .setSubaddressIndex(tx.getOutgoingTransfer().getSubaddressIndices().length === 1 ? tx.getOutgoingTransfer().getSubaddressIndices()[0] : undefined) // initialize if transfer sourced from single subaddress
          .setTx(tx);
      tx.setInputs([output]);
      await this.wallet.announceOutputSpent(output);
    }
    
    // notify received outputs
    if (tx.getIncomingTransfers() !== undefined) {
      if (tx.getOutputs() !== undefined && tx.getOutputs().length > 0) { // TODO (monero-project): outputs only returned for confirmed txs
        for (let output of tx.getOutputs()) {
          await this.wallet.announceOutputReceived(output);
        }
      } else { // TODO (monero-project): monero-wallet-rpc does not allow scrape of unconfirmed received outputs so using incoming transfer values
        let outputs = [];
        for (let transfer of tx.getIncomingTransfers()) {
          outputs.push(new MoneroOutputWallet()
              .setAccountIndex(transfer.getAccountIndex())
              .setSubaddressIndex(transfer.getSubaddressIndex())
              .setAmount(transfer.getAmount())
              .setTx(tx));
        }
        tx.setOutputs(outputs);
        for (let output of tx.getOutputs()) {
          await this.wallet.announceOutputReceived(output);
        }
      }
    }
  }
  
  protected getTx(txs, txHash) {
    for (let tx of txs) if (txHash === tx.getHash()) return tx;
    return undefined;
  }
  
  protected async checkForChangedBalances() {
    let balances = await this.wallet.getBalances();
    if (balances[0] !== this.prevBalances[0] || balances[1] !== this.prevBalances[1]) {
      this.prevBalances = balances;
      await this.wallet.announceBalancesChanged(balances[0], balances[1]);
      return true;
    }
    return false;
  }
}
