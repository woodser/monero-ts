/**
 * Import and export all library types.
 *
 * See the full model specification: http://moneroecosystem.org/monero-java/monero-spec.pdf
 */
import GenUtils from "./src/main/ts/common/GenUtils";
import Filter from "./src/main/ts/common/Filter";
import MoneroError from "./src/main/ts/common/MoneroError";
import HttpClient from "./src/main/ts/common/HttpClient";
import LibraryUtils from "./src/main/ts/common/LibraryUtils";
import MoneroRpcConnection from "./src/main/ts/common/MoneroRpcConnection";
import MoneroRpcError from "./src/main/ts/common/MoneroRpcError";
import SslOptions from "./src/main/ts/common/SslOptions";
import TaskLooper from "./src/main/ts/common/TaskLooper";
import ConnectionType from "./src/main/ts/daemon/model/ConnectionType";
import MoneroAltChain from "./src/main/ts/daemon/model/MoneroAltChain";
import MoneroBan from "./src/main/ts/daemon/model/MoneroBan";
import MoneroBlockHeader from "./src/main/ts/daemon/model/MoneroBlockHeader";
import MoneroBlock from "./src/main/ts/daemon/model/MoneroBlock";
import MoneroBlockTemplate from "./src/main/ts/daemon/model/MoneroBlockTemplate";
import MoneroConnectionSpan from "./src/main/ts/daemon/model/MoneroConnectionSpan";
import MoneroDaemonConfig from "./src/main/ts/daemon/model/MoneroDaemonConfig";
import MoneroDaemonInfo from "./src/main/ts/daemon/model/MoneroDaemonInfo";
import MoneroDaemonListener from "./src/main/ts/daemon/model/MoneroDaemonListener";
import MoneroDaemonSyncInfo from "./src/main/ts/daemon/model/MoneroDaemonSyncInfo";
import MoneroDaemonUpdateCheckResult from "./src/main/ts/daemon/model/MoneroDaemonUpdateCheckResult";
import MoneroDaemonUpdateDownloadResult from "./src/main/ts/daemon/model/MoneroDaemonUpdateDownloadResult";
import MoneroFeeEstimate from "./src/main/ts/daemon/model/MoneroFeeEstimate";
import MoneroHardForkInfo from "./src/main/ts/daemon/model/MoneroHardForkInfo";
import MoneroKeyImage from "./src/main/ts/daemon/model/MoneroKeyImage";
import MoneroKeyImageSpentStatus from "./src/main/ts/daemon/model/MoneroKeyImageSpentStatus";
import MoneroMinerTxSum from "./src/main/ts/daemon/model/MoneroMinerTxSum";
import MoneroMiningStatus from "./src/main/ts/daemon/model/MoneroMiningStatus";
import MoneroNetworkType from "./src/main/ts/daemon/model/MoneroNetworkType";
import MoneroOutput from "./src/main/ts/daemon/model/MoneroOutput";
import MoneroOutputHistogramEntry from "./src/main/ts/daemon/model/MoneroOutputHistogramEntry";
import MoneroSubmitTxResult from "./src/main/ts/daemon/model/MoneroSubmitTxResult";
import MoneroTx from "./src/main/ts/daemon/model/MoneroTx";
import MoneroTxPoolStats from "./src/main/ts/daemon/model/MoneroTxPoolStats";
import MoneroVersion from "./src/main/ts/daemon/model/MoneroVersion";
import MoneroPeer from "./src/main/ts/daemon/model/MoneroPeer";
import MoneroPruneResult from "./src/main/ts/daemon/model/MoneroPruneResult";
import MoneroAccount from "./src/main/ts/wallet/model/MoneroAccount";
import MoneroAccountTag from "./src/main/ts/wallet/model/MoneroAccountTag";
import MoneroAddressBookEntry from "./src/main/ts/wallet/model/MoneroAddressBookEntry";
import MoneroCheck from "./src/main/ts/wallet/model/MoneroCheck";
import MoneroCheckReserve from "./src/main/ts/wallet/model/MoneroCheckReserve";
import MoneroCheckTx from "./src/main/ts/wallet/model/MoneroCheckTx";
import MoneroDestination from "./src/main/ts/wallet/model/MoneroDestination";
import MoneroIntegratedAddress from "./src/main/ts/wallet/model/MoneroIntegratedAddress";
import MoneroKeyImageImportResult from "./src/main/ts/wallet/model/MoneroKeyImageImportResult";
import MoneroMultisigInfo from "./src/main/ts/wallet/model/MoneroMultisigInfo";
import MoneroMultisigInitResult from "./src/main/ts/wallet/model/MoneroMultisigInitResult";
import MoneroMultisigSignResult from "./src/main/ts/wallet/model/MoneroMultisigSignResult";
import MoneroOutputWallet from "./src/main/ts/wallet/model/MoneroOutputWallet";
import MoneroOutputQuery from "./src/main/ts/wallet/model/MoneroOutputQuery";
import MoneroTxPriority from "./src/main/ts/wallet/model/MoneroTxPriority";
import MoneroTxConfig from "./src/main/ts/wallet/model/MoneroTxConfig";
import MoneroSubaddress from "./src/main/ts/wallet/model/MoneroSubaddress";
import MoneroSyncResult from "./src/main/ts/wallet/model/MoneroSyncResult";
import MoneroTransfer from "./src/main/ts/wallet/model/MoneroTransfer";
import MoneroIncomingTransfer from "./src/main/ts/wallet/model/MoneroIncomingTransfer";
import MoneroOutgoingTransfer from "./src/main/ts/wallet/model/MoneroOutgoingTransfer";
import MoneroTransferQuery from "./src/main/ts/wallet/model/MoneroTransferQuery";
import MoneroTxSet from "./src/main/ts/wallet/model/MoneroTxSet";
import MoneroTxWallet from "./src/main/ts/wallet/model/MoneroTxWallet";
import MoneroTxQuery from "./src/main/ts/wallet/model/MoneroTxQuery";
import MoneroWalletListener from "./src/main/ts/wallet/model/MoneroWalletListener";
import MoneroWalletConfig from "./src/main/ts/wallet/model/MoneroWalletConfig";
import MoneroMessageSignatureType from "./src/main/ts/wallet/model/MoneroMessageSignatureType";
import MoneroMessageSignatureResult from "./src/main/ts/wallet/model/MoneroMessageSignatureResult";
import MoneroConnectionManager from "./src/main/ts/common/MoneroConnectionManager";
import MoneroConnectionManagerListener from "./src/main/ts/common/MoneroConnectionManagerListener";
import MoneroDaemon from "./src/main/ts/daemon/MoneroDaemon";
import MoneroWallet from "./src/main/ts/wallet/MoneroWallet";
import MoneroDaemonRpc from "./src/main/ts/daemon/MoneroDaemonRpc";
import MoneroWalletRpc from "./src/main/ts/wallet/MoneroWalletRpc";
import { MoneroWalletKeys } from "./src/main/ts/wallet/MoneroWalletKeys";
import MoneroWalletFull from "./src/main/ts/wallet/MoneroWalletFull";
import MoneroUtils from "./src/main/ts/common/MoneroUtils";
import ThreadPool from "./src/main/ts/common/ThreadPool";
export { GenUtils, Filter, MoneroError, HttpClient, LibraryUtils, MoneroRpcConnection, MoneroRpcError, SslOptions, TaskLooper, ConnectionType, MoneroAltChain, MoneroBan, MoneroBlockHeader, MoneroBlock, MoneroBlockTemplate, MoneroConnectionSpan, MoneroDaemonConfig, MoneroDaemonInfo, MoneroDaemonListener, MoneroDaemonSyncInfo, MoneroDaemonUpdateCheckResult, MoneroDaemonUpdateDownloadResult, MoneroFeeEstimate, MoneroHardForkInfo, MoneroKeyImage, MoneroKeyImageSpentStatus, MoneroMinerTxSum, MoneroMiningStatus, MoneroNetworkType, MoneroOutput, MoneroOutputHistogramEntry, MoneroSubmitTxResult, MoneroTx, MoneroTxPoolStats, MoneroVersion, MoneroPeer, MoneroPruneResult, MoneroAccount, MoneroAccountTag, MoneroAddressBookEntry, MoneroCheck, MoneroCheckReserve, MoneroCheckTx, MoneroDestination, MoneroIntegratedAddress, MoneroKeyImageImportResult, MoneroMultisigInfo, MoneroMultisigInitResult, MoneroMultisigSignResult, MoneroOutputWallet, MoneroOutputQuery, MoneroTxPriority, MoneroTxConfig, MoneroSubaddress, MoneroSyncResult, MoneroTransfer, MoneroIncomingTransfer, MoneroOutgoingTransfer, MoneroTransferQuery, MoneroTxSet, MoneroTxWallet, MoneroTxQuery, MoneroWalletListener, MoneroWalletConfig, MoneroMessageSignatureType, MoneroMessageSignatureResult, MoneroConnectionManagerListener, MoneroConnectionManager, MoneroDaemon, MoneroWallet, MoneroDaemonRpc, MoneroWalletRpc, MoneroWalletKeys, MoneroWalletFull, MoneroUtils, ThreadPool };
/**
 * <p>Get the version of the monero-ts library.<p>
 *
 * @return {string} the version of this monero-ts library
 */
export declare function getVersion(): string;
/**
 * <p>Create a client connected to monerod.<p>
 *
 * <p>Examples:<p>
 *
 * <code>
 * let daemon = await moneroTs.connectToDaemonRpc("http://localhost:38081");<br>
 * </code><br>
 * <br>
 * <code>
 * let daemon = await moneroTs.connectToDaemonRpc({<br>
 * &nbsp;&nbsp; uri: "http://localhost:38081",<br>
 * &nbsp;&nbsp; username: "superuser",<br>
 * &nbsp;&nbsp; password: "abctesting123"<br>
 * });
 * </code><br>
 * <br>
 * <code>
 * // start monerod as an internal process<br>
 * let daemon = await moneroTs.connectToDaemonRpc({<br>
 * &nbsp;&nbsp; cmd: ["path/to/monerod", ...params...],<br>
 * });
 * </code>
 *
 * @param {string|Partial<MoneroRpcConnection>|Partial<MoneroDaemonConfig>|string[]} uriOrConfig - uri or rpc connection or config or terminal parameters to connect to monerod
 * @param {string} [username] - username to authenticate with monerod
 * @param {string} [password] - password to authenticate with monerod
 * @return {Promise<MoneroDaemonRpc>} the daemon RPC client
 */
export declare function connectToDaemonRpc(uriOrConfig: string | Partial<MoneroRpcConnection> | Partial<MoneroDaemonConfig> | string[], username?: string, password?: string): Promise<MoneroDaemonRpc>;
/**
 * <p>Create a client connected to monero-wallet-rpc.</p>
 *
 * <p>Examples:</p>
 *
 * <code>
 * let walletRpc = await moneroTs.connectToWalletRpc({<br>
 * &nbsp;&nbsp; uri: "http://localhost:38081",<br>
 * &nbsp;&nbsp; username: "superuser",<br>
 * &nbsp;&nbsp; password: "abctesting123",<br>
 * &nbsp;&nbsp; rejectUnauthorized: false // e.g. local development<br>
 * });<br>
 * </code><br>
 * <br>
 * <code>
 * // connect to monero-wallet-rpc running as internal process<br>
 * let walletRpc = await moneroTs.connectToWalletRpc({cmd: [<br>
 * &nbsp;&nbsp; "/path/to/monero-wallet-rpc",<br>
 * &nbsp;&nbsp; "--stagenet",<br>
 * &nbsp;&nbsp; "--daemon-address", "http://localhost:38081",<br>
 * &nbsp;&nbsp; "--daemon-login", "superuser:abctesting123",<br>
 * &nbsp;&nbsp; "--rpc-bind-port", "38085",<br>
 * &nbsp;&nbsp; "--rpc-login", "rpc_user:abc123",<br>
 * &nbsp;&nbsp; "--wallet-dir", "/path/to/wallets", // defaults to monero-wallet-rpc directory<br>
 * &nbsp;&nbsp; "--rpc-access-control-origins", "http://localhost:8080"<br>
 * &nbsp;]});
 * </code>
 *
 * @param {string|Partial<MoneroRpcConnection>|Partial<MoneroWalletConfig>|string[]} uriOrConfig - uri or rpc connection or config or terminal parameters to connect to monero-wallet-rpc
 * @param {string} [username] - username to authenticate with monero-wallet-rpc
 * @param {string} [password] - password to authenticate with monero-wallet-rpc
 * @return {Promise<MoneroWalletRpc>} the wallet RPC client
 */
export declare function connectToWalletRpc(uriOrConfig: string | Partial<MoneroRpcConnection> | Partial<MoneroWalletConfig> | string[], username?: string, password?: string): Promise<MoneroWalletRpc>;
/**
 * <p>Create a Monero wallet using client-side WebAssembly bindings to monero-project's wallet2 in C++.<p>
 *
 * <p>Example:</p>
 *
 * <code>
 * const wallet = await moneroTs.createWalletFull({<br>
 * &nbsp;&nbsp; path: "./test_wallets/wallet1", // leave blank for in-memory wallet<br>
 * &nbsp;&nbsp; password: "supersecretpassword",<br>
 * &nbsp;&nbsp; networkType: moneroTs.MoneroNetworkType.STAGENET,<br>
 * &nbsp;&nbsp; seed: "coexist igloo pamphlet lagoon...",<br>
 * &nbsp;&nbsp; restoreHeight: 1543218,<br>
 * &nbsp;&nbsp; server: "http://localhost:38081"<br>
 * });
 * </code><br>
 * <br>
 * <code>
 * const wallet = await moneroTs.createWalletFull({<br>
 * &nbsp;&nbsp; path: "./test_wallets/wallet1", // leave blank for in-memory wallet<br>
 * &nbsp;&nbsp; password: "supersecretpassword",<br>
 * &nbsp;&nbsp; networkType: moneroTs.MoneroNetworkType.STAGENET,<br>
 * &nbsp;&nbsp; seed: "coexist igloo pamphlet lagoon...",<br>
 * &nbsp;&nbsp; restoreHeight: 1543218,<br>
 * &nbsp;&nbsp; proxyToWorker: false, // override default<br>
 * &nbsp;&nbsp; server: {<br>
 * &nbsp;&nbsp;&nbsp;&nbsp; uri: "http://localhost:38081",<br>
 * &nbsp;&nbsp;&nbsp;&nbsp; username: "daemon_user",<br>
 * &nbsp;&nbsp;&nbsp;&nbsp; password: "daemon_password_123"<br>
 * &nbsp;&nbsp; }<br>
 * });
 * </code>
 *
 * @param {Partial<MoneroWalletConfig>} config - MoneroWalletConfig or equivalent config object
 * @param {string} [config.path] - path of the wallet to create (optional, in-memory wallet if not given)
 * @param {string} [config.password] - password of the wallet to create
 * @param {MoneroNetworkType|string} [config.networkType] - network type of the wallet to create (one of "mainnet", "testnet", "stagenet" or MoneroNetworkType.MAINNET|TESTNET|STAGENET)
 * @param {string} [config.seed] - seed of the wallet to create (optional, random wallet created if neither seed nor keys given)
 * @param {string} [config.seedOffset] - the offset used to derive a new seed from the given seed to recover a secret wallet from the seed phrase
 * @param {boolean} [config.isMultisig] - restore multisig wallet from seed
 * @param {string} [config.primaryAddress] - primary address of the wallet to create (only provide if restoring from keys)
 * @param {string} [config.privateViewKey] - private view key of the wallet to create (optional)
 * @param {string} [config.privateSpendKey] - private spend key of the wallet to create (optional)
 * @param {number} [config.restoreHeight] - block height to start scanning from (defaults to 0 unless generating random wallet)
 * @param {string} [config.language] - language of the wallet's seed phrase (defaults to "English" or auto-detected)
 * @param {number} [config.accountLookahead] -  number of accounts to scan (optional)
 * @param {number} [config.subaddressLookahead] - number of subaddresses to scan per account (optional)
 * @param {string|Partial<MoneroRpcConnection>} [config.server] - connection to monero daemon (optional)
 * @param {MoneroConnectionManager} [config.connectionManager] - manage connections to monerod (optional)
 * @param {boolean} [config.rejectUnauthorized] - reject self-signed server certificates if true (defaults to true)
 * @param {boolean} [config.proxyToWorker] - proxies wallet operations to a worker in order to not block the main thread (default true)
 * @param {any} [config.fs] - Node.js compatible file system to use (defaults to disk or in-memory FS if browser)
 * @return {Promise<MoneroWalletFull>} the created wallet
 */
export declare function createWalletFull(config: Partial<MoneroWalletConfig>): Promise<MoneroWalletFull>;
/**
 * <p>Open an existing Monero wallet using client-side WebAssembly bindings to monero-project's wallet2 in C++.<p>
 *
 * <p>Example:<p>
 *
 * <code>
 * const wallet = await moneroTs.openWalletFull({<br>
 * &nbsp;&nbsp; path: "./wallets/wallet1",<br>
 * &nbsp;&nbsp; password: "supersecretpassword",<br>
 * &nbsp;&nbsp; networkType: moneroTs.MoneroNetworkType.STAGENET,<br>
* &nbsp;&nbsp; server: { // daemon configuration<br>
 * &nbsp;&nbsp;&nbsp;&nbsp; uri: "http://localhost:38081",<br>
 * &nbsp;&nbsp;&nbsp;&nbsp; username: "superuser",<br>
 * &nbsp;&nbsp;&nbsp;&nbsp; password: "abctesting123"<br>
 * &nbsp;&nbsp; }<br>
 * });
 * </code>
 *
 * @param {Partial<MoneroWalletConfig>} config - config to open a full wallet
 * @param {string} [config.path] - path of the wallet to open (optional if 'keysData' provided)
 * @param {string} [config.password] - password of the wallet to open
 * @param {string|number} [config.networkType] - network type of the wallet to open (one of "mainnet", "testnet", "stagenet" or MoneroNetworkType.MAINNET|TESTNET|STAGENET)
 * @param {string|MoneroRpcConnection} [config.server] - uri or connection to monero daemon (optional)
 * @param {Uint8Array} [config.keysData] - wallet keys data to open (optional if path provided)
 * @param {Uint8Array} [config.cacheData] - wallet cache data to open (optional)
 * @param {boolean} [config.proxyToWorker] - proxies wallet operations to a worker in order to not block the main thread (default true)
 * @param {any} [config.fs] - Node.js compatible file system to use (defaults to disk or in-memory FS if browser)
 * @return {Promise<MoneroWalletFull>} the opened wallet
 */
export declare function openWalletFull(config: Partial<MoneroWalletConfig>): Promise<MoneroWalletFull>;
/**
 * <p>Create a wallet using WebAssembly bindings to monero-project.</p>
 *
 * <p>Example:</p>
 *
 * <code>
 * const wallet = await moneroTs.createWalletKeys({<br>
 * &nbsp;&nbsp; password: "abc123",<br>
 * &nbsp;&nbsp; networkType: moneroTs.MoneroNetworkType.STAGENET,<br>
 * &nbsp;&nbsp; seed: "coexist igloo pamphlet lagoon..."<br>
 * });
 * </code>
 *
 * @param {Partial<MoneroWalletConfig>} config - MoneroWalletConfig or equivalent config object
 * @param {string|number} config.networkType - network type of the wallet to create (one of "mainnet", "testnet", "stagenet" or MoneroNetworkType.MAINNET|TESTNET|STAGENET)
 * @param {string} [config.seed] - seed of the wallet to create (optional, random wallet created if neither seed nor keys given)
 * @param {string} [config.seedOffset] - the offset used to derive a new seed from the given seed to recover a secret wallet from the seed phrase
 * @param {string} [config.primaryAddress] - primary address of the wallet to create (only provide if restoring from keys)
 * @param {string} [config.privateViewKey] - private view key of the wallet to create (optional)
 * @param {string} [config.privateSpendKey] - private spend key of the wallet to create (optional)
 * @param {string} [config.language] - language of the wallet's seed (defaults to "English" or auto-detected)
 * @return {Promise<MoneroWalletKeys>} the created wallet
 */
export declare function createWalletKeys(config: Partial<MoneroWalletConfig>): Promise<MoneroWalletKeys>;
