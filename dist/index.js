'use strict';

// --------------------------------- IMPORTS ----------------------------------

// See the full model specification: https://woodser.github.io/monero-java/monero-spec.pdf

// import common models
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });Object.defineProperty(exports, "ConnectionType", { enumerable: true, get: function () {return _ConnectionType.default;} });Object.defineProperty(exports, "Filter", { enumerable: true, get: function () {return _Filter.default;} });Object.defineProperty(exports, "GenUtils", { enumerable: true, get: function () {return _GenUtils.default;} });Object.defineProperty(exports, "HttpClient", { enumerable: true, get: function () {return _HttpClient.default;} });Object.defineProperty(exports, "LibraryUtils", { enumerable: true, get: function () {return _LibraryUtils.default;} });Object.defineProperty(exports, "MoneroAccount", { enumerable: true, get: function () {return _MoneroAccount.default;} });Object.defineProperty(exports, "MoneroAccountTag", { enumerable: true, get: function () {return _MoneroAccountTag.default;} });Object.defineProperty(exports, "MoneroAddressBookEntry", { enumerable: true, get: function () {return _MoneroAddressBookEntry.default;} });Object.defineProperty(exports, "MoneroAltChain", { enumerable: true, get: function () {return _MoneroAltChain.default;} });Object.defineProperty(exports, "MoneroBan", { enumerable: true, get: function () {return _MoneroBan.default;} });Object.defineProperty(exports, "MoneroBlock", { enumerable: true, get: function () {return _MoneroBlock.default;} });Object.defineProperty(exports, "MoneroBlockHeader", { enumerable: true, get: function () {return _MoneroBlockHeader.default;} });Object.defineProperty(exports, "MoneroBlockTemplate", { enumerable: true, get: function () {return _MoneroBlockTemplate.default;} });Object.defineProperty(exports, "MoneroCheck", { enumerable: true, get: function () {return _MoneroCheck.default;} });Object.defineProperty(exports, "MoneroCheckReserve", { enumerable: true, get: function () {return _MoneroCheckReserve.default;} });Object.defineProperty(exports, "MoneroCheckTx", { enumerable: true, get: function () {return _MoneroCheckTx.default;} });Object.defineProperty(exports, "MoneroConnectionManager", { enumerable: true, get: function () {return _MoneroConnectionManager.default;} });Object.defineProperty(exports, "MoneroConnectionManagerListener", { enumerable: true, get: function () {return _MoneroConnectionManagerListener.default;} });Object.defineProperty(exports, "MoneroConnectionSpan", { enumerable: true, get: function () {return _MoneroConnectionSpan.default;} });Object.defineProperty(exports, "MoneroDaemon", { enumerable: true, get: function () {return _MoneroDaemon.default;} });Object.defineProperty(exports, "MoneroDaemonConfig", { enumerable: true, get: function () {return _MoneroDaemonConfig.default;} });Object.defineProperty(exports, "MoneroDaemonInfo", { enumerable: true, get: function () {return _MoneroDaemonInfo.default;} });Object.defineProperty(exports, "MoneroDaemonListener", { enumerable: true, get: function () {return _MoneroDaemonListener.default;} });Object.defineProperty(exports, "MoneroDaemonRpc", { enumerable: true, get: function () {return _MoneroDaemonRpc.default;} });Object.defineProperty(exports, "MoneroDaemonSyncInfo", { enumerable: true, get: function () {return _MoneroDaemonSyncInfo.default;} });Object.defineProperty(exports, "MoneroDaemonUpdateCheckResult", { enumerable: true, get: function () {return _MoneroDaemonUpdateCheckResult.default;} });Object.defineProperty(exports, "MoneroDaemonUpdateDownloadResult", { enumerable: true, get: function () {return _MoneroDaemonUpdateDownloadResult.default;} });Object.defineProperty(exports, "MoneroDestination", { enumerable: true, get: function () {return _MoneroDestination.default;} });Object.defineProperty(exports, "MoneroError", { enumerable: true, get: function () {return _MoneroError.default;} });Object.defineProperty(exports, "MoneroFeeEstimate", { enumerable: true, get: function () {return _MoneroFeeEstimate.default;} });Object.defineProperty(exports, "MoneroHardForkInfo", { enumerable: true, get: function () {return _MoneroHardForkInfo.default;} });Object.defineProperty(exports, "MoneroIncomingTransfer", { enumerable: true, get: function () {return _MoneroIncomingTransfer.default;} });Object.defineProperty(exports, "MoneroIntegratedAddress", { enumerable: true, get: function () {return _MoneroIntegratedAddress.default;} });Object.defineProperty(exports, "MoneroKeyImage", { enumerable: true, get: function () {return _MoneroKeyImage.default;} });Object.defineProperty(exports, "MoneroKeyImageImportResult", { enumerable: true, get: function () {return _MoneroKeyImageImportResult.default;} });Object.defineProperty(exports, "MoneroKeyImageSpentStatus", { enumerable: true, get: function () {return _MoneroKeyImageSpentStatus.default;} });Object.defineProperty(exports, "MoneroMessageSignatureResult", { enumerable: true, get: function () {return _MoneroMessageSignatureResult.default;} });Object.defineProperty(exports, "MoneroMessageSignatureType", { enumerable: true, get: function () {return _MoneroMessageSignatureType.default;} });Object.defineProperty(exports, "MoneroMinerTxSum", { enumerable: true, get: function () {return _MoneroMinerTxSum.default;} });Object.defineProperty(exports, "MoneroMiningStatus", { enumerable: true, get: function () {return _MoneroMiningStatus.default;} });Object.defineProperty(exports, "MoneroMultisigInfo", { enumerable: true, get: function () {return _MoneroMultisigInfo.default;} });Object.defineProperty(exports, "MoneroMultisigInitResult", { enumerable: true, get: function () {return _MoneroMultisigInitResult.default;} });Object.defineProperty(exports, "MoneroMultisigSignResult", { enumerable: true, get: function () {return _MoneroMultisigSignResult.default;} });Object.defineProperty(exports, "MoneroNetworkType", { enumerable: true, get: function () {return _MoneroNetworkType.default;} });Object.defineProperty(exports, "MoneroOutgoingTransfer", { enumerable: true, get: function () {return _MoneroOutgoingTransfer.default;} });Object.defineProperty(exports, "MoneroOutput", { enumerable: true, get: function () {return _MoneroOutput.default;} });Object.defineProperty(exports, "MoneroOutputHistogramEntry", { enumerable: true, get: function () {return _MoneroOutputHistogramEntry.default;} });Object.defineProperty(exports, "MoneroOutputQuery", { enumerable: true, get: function () {return _MoneroOutputQuery.default;} });Object.defineProperty(exports, "MoneroOutputWallet", { enumerable: true, get: function () {return _MoneroOutputWallet.default;} });Object.defineProperty(exports, "MoneroPeer", { enumerable: true, get: function () {return _MoneroPeer.default;} });Object.defineProperty(exports, "MoneroPruneResult", { enumerable: true, get: function () {return _MoneroPruneResult.default;} });Object.defineProperty(exports, "MoneroRpcConnection", { enumerable: true, get: function () {return _MoneroRpcConnection.default;} });Object.defineProperty(exports, "MoneroRpcError", { enumerable: true, get: function () {return _MoneroRpcError.default;} });Object.defineProperty(exports, "MoneroSubaddress", { enumerable: true, get: function () {return _MoneroSubaddress.default;} });Object.defineProperty(exports, "MoneroSubmitTxResult", { enumerable: true, get: function () {return _MoneroSubmitTxResult.default;} });Object.defineProperty(exports, "MoneroSyncResult", { enumerable: true, get: function () {return _MoneroSyncResult.default;} });Object.defineProperty(exports, "MoneroTransfer", { enumerable: true, get: function () {return _MoneroTransfer.default;} });Object.defineProperty(exports, "MoneroTransferQuery", { enumerable: true, get: function () {return _MoneroTransferQuery.default;} });Object.defineProperty(exports, "MoneroTx", { enumerable: true, get: function () {return _MoneroTx.default;} });Object.defineProperty(exports, "MoneroTxConfig", { enumerable: true, get: function () {return _MoneroTxConfig.default;} });Object.defineProperty(exports, "MoneroTxPoolStats", { enumerable: true, get: function () {return _MoneroTxPoolStats.default;} });Object.defineProperty(exports, "MoneroTxPriority", { enumerable: true, get: function () {return _MoneroTxPriority.default;} });Object.defineProperty(exports, "MoneroTxQuery", { enumerable: true, get: function () {return _MoneroTxQuery.default;} });Object.defineProperty(exports, "MoneroTxSet", { enumerable: true, get: function () {return _MoneroTxSet.default;} });Object.defineProperty(exports, "MoneroTxWallet", { enumerable: true, get: function () {return _MoneroTxWallet.default;} });Object.defineProperty(exports, "MoneroUtils", { enumerable: true, get: function () {return _MoneroUtils.default;} });Object.defineProperty(exports, "MoneroVersion", { enumerable: true, get: function () {return _MoneroVersion.default;} });Object.defineProperty(exports, "MoneroWallet", { enumerable: true, get: function () {return _MoneroWallet.default;} });Object.defineProperty(exports, "MoneroWalletConfig", { enumerable: true, get: function () {return _MoneroWalletConfig.default;} });Object.defineProperty(exports, "MoneroWalletFull", { enumerable: true, get: function () {return _MoneroWalletFull.default;} });Object.defineProperty(exports, "MoneroWalletKeys", { enumerable: true, get: function () {return _MoneroWalletKeys.MoneroWalletKeys;} });Object.defineProperty(exports, "MoneroWalletListener", { enumerable: true, get: function () {return _MoneroWalletListener.default;} });Object.defineProperty(exports, "MoneroWalletRpc", { enumerable: true, get: function () {return _MoneroWalletRpc.default;} });Object.defineProperty(exports, "SslOptions", { enumerable: true, get: function () {return _SslOptions.default;} });Object.defineProperty(exports, "TaskLooper", { enumerable: true, get: function () {return _TaskLooper.default;} });Object.defineProperty(exports, "ThreadPool", { enumerable: true, get: function () {return _ThreadPool.default;} });exports.connectToDaemonRpc = connectToDaemonRpc;exports.connectToWalletRpc = connectToWalletRpc;exports.createWalletFull = createWalletFull;exports.createWalletKeys = createWalletKeys;exports.default = void 0;exports.getVersion = getVersion;exports.openWalletFull = openWalletFull;var _GenUtils = _interopRequireDefault(require("./src/main/ts/common/GenUtils"));
var _Filter = _interopRequireDefault(require("./src/main/ts/common/Filter"));
var _MoneroError = _interopRequireDefault(require("./src/main/ts/common/MoneroError"));
var _HttpClient = _interopRequireDefault(require("./src/main/ts/common/HttpClient"));
var _LibraryUtils = _interopRequireDefault(require("./src/main/ts/common/LibraryUtils"));
var _MoneroRpcConnection = _interopRequireDefault(require("./src/main/ts/common/MoneroRpcConnection"));
var _MoneroRpcError = _interopRequireDefault(require("./src/main/ts/common/MoneroRpcError"));
var _SslOptions = _interopRequireDefault(require("./src/main/ts/common/SslOptions"));
var _TaskLooper = _interopRequireDefault(require("./src/main/ts/common/TaskLooper"));


var _ConnectionType = _interopRequireDefault(require("./src/main/ts/daemon/model/ConnectionType"));
var _MoneroAltChain = _interopRequireDefault(require("./src/main/ts/daemon/model/MoneroAltChain"));
var _MoneroBan = _interopRequireDefault(require("./src/main/ts/daemon/model/MoneroBan"));
var _MoneroBlockHeader = _interopRequireDefault(require("./src/main/ts/daemon/model/MoneroBlockHeader"));
var _MoneroBlock = _interopRequireDefault(require("./src/main/ts/daemon/model/MoneroBlock"));
var _MoneroBlockTemplate = _interopRequireDefault(require("./src/main/ts/daemon/model/MoneroBlockTemplate"));
var _MoneroConnectionSpan = _interopRequireDefault(require("./src/main/ts/daemon/model/MoneroConnectionSpan"));
var _MoneroDaemonConfig = _interopRequireDefault(require("./src/main/ts/daemon/model/MoneroDaemonConfig"));
var _MoneroDaemonInfo = _interopRequireDefault(require("./src/main/ts/daemon/model/MoneroDaemonInfo"));
var _MoneroDaemonListener = _interopRequireDefault(require("./src/main/ts/daemon/model/MoneroDaemonListener"));
var _MoneroDaemonSyncInfo = _interopRequireDefault(require("./src/main/ts/daemon/model/MoneroDaemonSyncInfo"));
var _MoneroDaemonUpdateCheckResult = _interopRequireDefault(require("./src/main/ts/daemon/model/MoneroDaemonUpdateCheckResult"));
var _MoneroDaemonUpdateDownloadResult = _interopRequireDefault(require("./src/main/ts/daemon/model/MoneroDaemonUpdateDownloadResult"));
var _MoneroFeeEstimate = _interopRequireDefault(require("./src/main/ts/daemon/model/MoneroFeeEstimate"));
var _MoneroHardForkInfo = _interopRequireDefault(require("./src/main/ts/daemon/model/MoneroHardForkInfo"));
var _MoneroKeyImage = _interopRequireDefault(require("./src/main/ts/daemon/model/MoneroKeyImage"));
var _MoneroKeyImageSpentStatus = _interopRequireDefault(require("./src/main/ts/daemon/model/MoneroKeyImageSpentStatus"));
var _MoneroMinerTxSum = _interopRequireDefault(require("./src/main/ts/daemon/model/MoneroMinerTxSum"));
var _MoneroMiningStatus = _interopRequireDefault(require("./src/main/ts/daemon/model/MoneroMiningStatus"));
var _MoneroNetworkType = _interopRequireDefault(require("./src/main/ts/daemon/model/MoneroNetworkType"));
var _MoneroOutput = _interopRequireDefault(require("./src/main/ts/daemon/model/MoneroOutput"));
var _MoneroOutputHistogramEntry = _interopRequireDefault(require("./src/main/ts/daemon/model/MoneroOutputHistogramEntry"));
var _MoneroSubmitTxResult = _interopRequireDefault(require("./src/main/ts/daemon/model/MoneroSubmitTxResult"));
var _MoneroTx = _interopRequireDefault(require("./src/main/ts/daemon/model/MoneroTx"));
var _MoneroTxPoolStats = _interopRequireDefault(require("./src/main/ts/daemon/model/MoneroTxPoolStats"));
var _MoneroVersion = _interopRequireDefault(require("./src/main/ts/daemon/model/MoneroVersion"));
var _MoneroPeer = _interopRequireDefault(require("./src/main/ts/daemon/model/MoneroPeer"));
var _MoneroPruneResult = _interopRequireDefault(require("./src/main/ts/daemon/model/MoneroPruneResult"));


var _MoneroAccount = _interopRequireDefault(require("./src/main/ts/wallet/model/MoneroAccount"));
var _MoneroAccountTag = _interopRequireDefault(require("./src/main/ts/wallet/model/MoneroAccountTag"));
var _MoneroAddressBookEntry = _interopRequireDefault(require("./src/main/ts/wallet/model/MoneroAddressBookEntry"));
var _MoneroCheck = _interopRequireDefault(require("./src/main/ts/wallet/model/MoneroCheck"));
var _MoneroCheckReserve = _interopRequireDefault(require("./src/main/ts/wallet/model/MoneroCheckReserve"));
var _MoneroCheckTx = _interopRequireDefault(require("./src/main/ts/wallet/model/MoneroCheckTx"));
var _MoneroDestination = _interopRequireDefault(require("./src/main/ts/wallet/model/MoneroDestination"));
var _MoneroIntegratedAddress = _interopRequireDefault(require("./src/main/ts/wallet/model/MoneroIntegratedAddress"));
var _MoneroKeyImageImportResult = _interopRequireDefault(require("./src/main/ts/wallet/model/MoneroKeyImageImportResult"));
var _MoneroMultisigInfo = _interopRequireDefault(require("./src/main/ts/wallet/model/MoneroMultisigInfo"));
var _MoneroMultisigInitResult = _interopRequireDefault(require("./src/main/ts/wallet/model/MoneroMultisigInitResult"));
var _MoneroMultisigSignResult = _interopRequireDefault(require("./src/main/ts/wallet/model/MoneroMultisigSignResult"));
var _MoneroOutputWallet = _interopRequireDefault(require("./src/main/ts/wallet/model/MoneroOutputWallet"));
var _MoneroOutputQuery = _interopRequireDefault(require("./src/main/ts/wallet/model/MoneroOutputQuery"));
var _MoneroTxPriority = _interopRequireDefault(require("./src/main/ts/wallet/model/MoneroTxPriority"));
var _MoneroTxConfig = _interopRequireDefault(require("./src/main/ts/wallet/model/MoneroTxConfig"));
var _MoneroSubaddress = _interopRequireDefault(require("./src/main/ts/wallet/model/MoneroSubaddress"));
var _MoneroSyncResult = _interopRequireDefault(require("./src/main/ts/wallet/model/MoneroSyncResult"));
var _MoneroTransfer = _interopRequireDefault(require("./src/main/ts/wallet/model/MoneroTransfer"));
var _MoneroIncomingTransfer = _interopRequireDefault(require("./src/main/ts/wallet/model/MoneroIncomingTransfer"));
var _MoneroOutgoingTransfer = _interopRequireDefault(require("./src/main/ts/wallet/model/MoneroOutgoingTransfer"));
var _MoneroTransferQuery = _interopRequireDefault(require("./src/main/ts/wallet/model/MoneroTransferQuery"));
var _MoneroTxSet = _interopRequireDefault(require("./src/main/ts/wallet/model/MoneroTxSet"));
var _MoneroTxWallet = _interopRequireDefault(require("./src/main/ts/wallet/model/MoneroTxWallet"));
var _MoneroTxQuery = _interopRequireDefault(require("./src/main/ts/wallet/model/MoneroTxQuery"));
var _MoneroWalletListener = _interopRequireDefault(require("./src/main/ts/wallet/model/MoneroWalletListener"));
var _MoneroWalletConfig = _interopRequireDefault(require("./src/main/ts/wallet/model/MoneroWalletConfig"));
var _MoneroMessageSignatureType = _interopRequireDefault(require("./src/main/ts/wallet/model/MoneroMessageSignatureType"));
var _MoneroMessageSignatureResult = _interopRequireDefault(require("./src/main/ts/wallet/model/MoneroMessageSignatureResult"));


var _MoneroConnectionManager = _interopRequireDefault(require("./src/main/ts/common/MoneroConnectionManager"));
var _MoneroConnectionManagerListener = _interopRequireDefault(require("./src/main/ts/common/MoneroConnectionManagerListener"));


var _MoneroDaemon = _interopRequireDefault(require("./src/main/ts/daemon/MoneroDaemon"));
var _MoneroWallet = _interopRequireDefault(require("./src/main/ts/wallet/MoneroWallet"));
var _MoneroDaemonRpc = _interopRequireDefault(require("./src/main/ts/daemon/MoneroDaemonRpc"));
var _MoneroWalletRpc = _interopRequireDefault(require("./src/main/ts/wallet/MoneroWalletRpc"));
var _MoneroWalletKeys = require("./src/main/ts/wallet/MoneroWalletKeys");
var _MoneroWalletFull = _interopRequireDefault(require("./src/main/ts/wallet/MoneroWalletFull"));
var _MoneroUtils = _interopRequireDefault(require("./src/main/ts/common/MoneroUtils"));
var _ThreadPool = _interopRequireDefault(require("./src/main/ts/common/ThreadPool")); // import daemon models
// import wallet models
// import connection manager
// import daemon, wallet, and util classes
// ---------------------------- GLOBAL FUNCTIONS ------------------------------
/**
 * <p>Get the version of the monero-ts library.<p>
 *
 * @return {string} the version of this monero-ts library
 */function getVersion() {
  return _MoneroUtils.default.getVersion();
}

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
function connectToDaemonRpc(uriOrConfig, username, password) {
  return _MoneroDaemonRpc.default.connectToDaemonRpc(uriOrConfig, username, password);
}

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
function connectToWalletRpc(uriOrConfig, username, password) {
  return _MoneroWalletRpc.default.connectToWalletRpc(uriOrConfig, username, password);
}

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
function createWalletFull(config) {
  return _MoneroWalletFull.default.createWallet(new _MoneroWalletConfig.default(config));
}

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
function openWalletFull(config) {
  return _MoneroWalletFull.default.openWallet(new _MoneroWalletConfig.default(config));
}

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
function createWalletKeys(config) {
  return _MoneroWalletKeys.MoneroWalletKeys.createWallet(new _MoneroWalletConfig.default(config));
}

// --------------------------------- EXPORTS ----------------------------------


























































































// export default object with aggregate of all exports
const moneroTs = {
  GenUtils: _GenUtils.default,
  Filter: _Filter.default,
  MoneroError: _MoneroError.default,
  HttpClient: _HttpClient.default,
  LibraryUtils: _LibraryUtils.default,
  MoneroRpcConnection: _MoneroRpcConnection.default,
  MoneroRpcError: _MoneroRpcError.default,
  SslOptions: _SslOptions.default,
  TaskLooper: _TaskLooper.default,
  ConnectionType: _ConnectionType.default,
  MoneroAltChain: _MoneroAltChain.default,
  MoneroBan: _MoneroBan.default,
  MoneroBlockHeader: _MoneroBlockHeader.default,
  MoneroBlock: _MoneroBlock.default,
  MoneroBlockTemplate: _MoneroBlockTemplate.default,
  MoneroConnectionSpan: _MoneroConnectionSpan.default,
  MoneroDaemonConfig: _MoneroDaemonConfig.default,
  MoneroDaemonInfo: _MoneroDaemonInfo.default,
  MoneroDaemonListener: _MoneroDaemonListener.default,
  MoneroDaemonSyncInfo: _MoneroDaemonSyncInfo.default,
  MoneroDaemonUpdateCheckResult: _MoneroDaemonUpdateCheckResult.default,
  MoneroDaemonUpdateDownloadResult: _MoneroDaemonUpdateDownloadResult.default,
  MoneroFeeEstimate: _MoneroFeeEstimate.default,
  MoneroHardForkInfo: _MoneroHardForkInfo.default,
  MoneroKeyImage: _MoneroKeyImage.default,
  MoneroKeyImageSpentStatus: _MoneroKeyImageSpentStatus.default,
  MoneroMinerTxSum: _MoneroMinerTxSum.default,
  MoneroMiningStatus: _MoneroMiningStatus.default,
  MoneroNetworkType: _MoneroNetworkType.default,
  MoneroOutput: _MoneroOutput.default,
  MoneroOutputHistogramEntry: _MoneroOutputHistogramEntry.default,
  MoneroSubmitTxResult: _MoneroSubmitTxResult.default,
  MoneroTx: _MoneroTx.default,
  MoneroTxPoolStats: _MoneroTxPoolStats.default,
  MoneroVersion: _MoneroVersion.default,
  MoneroPeer: _MoneroPeer.default,
  MoneroPruneResult: _MoneroPruneResult.default,
  MoneroAccount: _MoneroAccount.default,
  MoneroAccountTag: _MoneroAccountTag.default,
  MoneroAddressBookEntry: _MoneroAddressBookEntry.default,
  MoneroCheck: _MoneroCheck.default,
  MoneroCheckReserve: _MoneroCheckReserve.default,
  MoneroCheckTx: _MoneroCheckTx.default,
  MoneroDestination: _MoneroDestination.default,
  MoneroIntegratedAddress: _MoneroIntegratedAddress.default,
  MoneroKeyImageImportResult: _MoneroKeyImageImportResult.default,
  MoneroMultisigInfo: _MoneroMultisigInfo.default,
  MoneroMultisigInitResult: _MoneroMultisigInitResult.default,
  MoneroMultisigSignResult: _MoneroMultisigSignResult.default,
  MoneroOutputWallet: _MoneroOutputWallet.default,
  MoneroOutputQuery: _MoneroOutputQuery.default,
  MoneroTxPriority: _MoneroTxPriority.default,
  MoneroTxConfig: _MoneroTxConfig.default,
  MoneroSubaddress: _MoneroSubaddress.default,
  MoneroSyncResult: _MoneroSyncResult.default,
  MoneroTransfer: _MoneroTransfer.default,
  MoneroIncomingTransfer: _MoneroIncomingTransfer.default,
  MoneroOutgoingTransfer: _MoneroOutgoingTransfer.default,
  MoneroTransferQuery: _MoneroTransferQuery.default,
  MoneroTxSet: _MoneroTxSet.default,
  MoneroTxWallet: _MoneroTxWallet.default,
  MoneroTxQuery: _MoneroTxQuery.default,
  MoneroWalletListener: _MoneroWalletListener.default,
  MoneroWalletConfig: _MoneroWalletConfig.default,
  MoneroMessageSignatureType: _MoneroMessageSignatureType.default,
  MoneroMessageSignatureResult: _MoneroMessageSignatureResult.default,
  MoneroConnectionManagerListener: _MoneroConnectionManagerListener.default,
  MoneroConnectionManager: _MoneroConnectionManager.default,
  MoneroDaemon: _MoneroDaemon.default,
  MoneroWallet: _MoneroWallet.default,
  MoneroDaemonRpc: _MoneroDaemonRpc.default,
  MoneroWalletRpc: _MoneroWalletRpc.default,
  MoneroWalletKeys: _MoneroWalletKeys.MoneroWalletKeys,
  MoneroWalletFull: _MoneroWalletFull.default,
  MoneroUtils: _MoneroUtils.default,
  ThreadPool: _ThreadPool.default,

  // global functions
  getVersion,
  connectToDaemonRpc,
  connectToWalletRpc,
  createWalletFull,
  openWalletFull,
  createWalletKeys
};var _default = exports.default =
moneroTs;

// augment global scope with same namespace as default export
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIk9iamVjdCIsImRlZmluZVByb3BlcnR5IiwiZXhwb3J0cyIsInZhbHVlIiwiZW51bWVyYWJsZSIsImdldCIsIl9Db25uZWN0aW9uVHlwZSIsImRlZmF1bHQiLCJfRmlsdGVyIiwiX0dlblV0aWxzIiwiX0h0dHBDbGllbnQiLCJfTGlicmFyeVV0aWxzIiwiX01vbmVyb0FjY291bnQiLCJfTW9uZXJvQWNjb3VudFRhZyIsIl9Nb25lcm9BZGRyZXNzQm9va0VudHJ5IiwiX01vbmVyb0FsdENoYWluIiwiX01vbmVyb0JhbiIsIl9Nb25lcm9CbG9jayIsIl9Nb25lcm9CbG9ja0hlYWRlciIsIl9Nb25lcm9CbG9ja1RlbXBsYXRlIiwiX01vbmVyb0NoZWNrIiwiX01vbmVyb0NoZWNrUmVzZXJ2ZSIsIl9Nb25lcm9DaGVja1R4IiwiX01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyIiwiX01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIiLCJfTW9uZXJvQ29ubmVjdGlvblNwYW4iLCJfTW9uZXJvRGFlbW9uIiwiX01vbmVyb0RhZW1vbkNvbmZpZyIsIl9Nb25lcm9EYWVtb25JbmZvIiwiX01vbmVyb0RhZW1vbkxpc3RlbmVyIiwiX01vbmVyb0RhZW1vblJwYyIsIl9Nb25lcm9EYWVtb25TeW5jSW5mbyIsIl9Nb25lcm9EYWVtb25VcGRhdGVDaGVja1Jlc3VsdCIsIl9Nb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdCIsIl9Nb25lcm9EZXN0aW5hdGlvbiIsIl9Nb25lcm9FcnJvciIsIl9Nb25lcm9GZWVFc3RpbWF0ZSIsIl9Nb25lcm9IYXJkRm9ya0luZm8iLCJfTW9uZXJvSW5jb21pbmdUcmFuc2ZlciIsIl9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsIl9Nb25lcm9LZXlJbWFnZSIsIl9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCIsIl9Nb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQiLCJfTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUiLCJfTW9uZXJvTWluZXJUeFN1bSIsIl9Nb25lcm9NaW5pbmdTdGF0dXMiLCJfTW9uZXJvTXVsdGlzaWdJbmZvIiwiX01vbmVyb011bHRpc2lnSW5pdFJlc3VsdCIsIl9Nb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQiLCJfTW9uZXJvTmV0d29ya1R5cGUiLCJfTW9uZXJvT3V0Z29pbmdUcmFuc2ZlciIsIl9Nb25lcm9PdXRwdXQiLCJfTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkiLCJfTW9uZXJvT3V0cHV0UXVlcnkiLCJfTW9uZXJvT3V0cHV0V2FsbGV0IiwiX01vbmVyb1BlZXIiLCJfTW9uZXJvUHJ1bmVSZXN1bHQiLCJfTW9uZXJvUnBjQ29ubmVjdGlvbiIsIl9Nb25lcm9ScGNFcnJvciIsIl9Nb25lcm9TdWJhZGRyZXNzIiwiX01vbmVyb1N1Ym1pdFR4UmVzdWx0IiwiX01vbmVyb1N5bmNSZXN1bHQiLCJfTW9uZXJvVHJhbnNmZXIiLCJfTW9uZXJvVHJhbnNmZXJRdWVyeSIsIl9Nb25lcm9UeCIsIl9Nb25lcm9UeENvbmZpZyIsIl9Nb25lcm9UeFBvb2xTdGF0cyIsIl9Nb25lcm9UeFByaW9yaXR5IiwiX01vbmVyb1R4UXVlcnkiLCJfTW9uZXJvVHhTZXQiLCJfTW9uZXJvVHhXYWxsZXQiLCJfTW9uZXJvVXRpbHMiLCJfTW9uZXJvVmVyc2lvbiIsIl9Nb25lcm9XYWxsZXQiLCJfTW9uZXJvV2FsbGV0Q29uZmlnIiwiX01vbmVyb1dhbGxldEZ1bGwiLCJfTW9uZXJvV2FsbGV0S2V5cyIsIk1vbmVyb1dhbGxldEtleXMiLCJfTW9uZXJvV2FsbGV0TGlzdGVuZXIiLCJfTW9uZXJvV2FsbGV0UnBjIiwiX1NzbE9wdGlvbnMiLCJfVGFza0xvb3BlciIsIl9UaHJlYWRQb29sIiwiY29ubmVjdFRvRGFlbW9uUnBjIiwiY29ubmVjdFRvV2FsbGV0UnBjIiwiY3JlYXRlV2FsbGV0RnVsbCIsImNyZWF0ZVdhbGxldEtleXMiLCJnZXRWZXJzaW9uIiwib3BlbldhbGxldEZ1bGwiLCJNb25lcm9VdGlscyIsInVyaU9yQ29uZmlnIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsIk1vbmVyb0RhZW1vblJwYyIsIk1vbmVyb1dhbGxldFJwYyIsImNvbmZpZyIsIk1vbmVyb1dhbGxldEZ1bGwiLCJjcmVhdGVXYWxsZXQiLCJNb25lcm9XYWxsZXRDb25maWciLCJvcGVuV2FsbGV0IiwibW9uZXJvVHMiLCJHZW5VdGlscyIsIkZpbHRlciIsIk1vbmVyb0Vycm9yIiwiSHR0cENsaWVudCIsIkxpYnJhcnlVdGlscyIsIk1vbmVyb1JwY0Nvbm5lY3Rpb24iLCJNb25lcm9ScGNFcnJvciIsIlNzbE9wdGlvbnMiLCJUYXNrTG9vcGVyIiwiQ29ubmVjdGlvblR5cGUiLCJNb25lcm9BbHRDaGFpbiIsIk1vbmVyb0JhbiIsIk1vbmVyb0Jsb2NrSGVhZGVyIiwiTW9uZXJvQmxvY2siLCJNb25lcm9CbG9ja1RlbXBsYXRlIiwiTW9uZXJvQ29ubmVjdGlvblNwYW4iLCJNb25lcm9EYWVtb25Db25maWciLCJNb25lcm9EYWVtb25JbmZvIiwiTW9uZXJvRGFlbW9uTGlzdGVuZXIiLCJNb25lcm9EYWVtb25TeW5jSW5mbyIsIk1vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0IiwiTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQiLCJNb25lcm9GZWVFc3RpbWF0ZSIsIk1vbmVyb0hhcmRGb3JrSW5mbyIsIk1vbmVyb0tleUltYWdlIiwiTW9uZXJvS2V5SW1hZ2VTcGVudFN0YXR1cyIsIk1vbmVyb01pbmVyVHhTdW0iLCJNb25lcm9NaW5pbmdTdGF0dXMiLCJNb25lcm9OZXR3b3JrVHlwZSIsIk1vbmVyb091dHB1dCIsIk1vbmVyb091dHB1dEhpc3RvZ3JhbUVudHJ5IiwiTW9uZXJvU3VibWl0VHhSZXN1bHQiLCJNb25lcm9UeCIsIk1vbmVyb1R4UG9vbFN0YXRzIiwiTW9uZXJvVmVyc2lvbiIsIk1vbmVyb1BlZXIiLCJNb25lcm9QcnVuZVJlc3VsdCIsIk1vbmVyb0FjY291bnQiLCJNb25lcm9BY2NvdW50VGFnIiwiTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSIsIk1vbmVyb0NoZWNrIiwiTW9uZXJvQ2hlY2tSZXNlcnZlIiwiTW9uZXJvQ2hlY2tUeCIsIk1vbmVyb0Rlc3RpbmF0aW9uIiwiTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MiLCJNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCIsIk1vbmVyb011bHRpc2lnSW5mbyIsIk1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCIsIk1vbmVyb011bHRpc2lnU2lnblJlc3VsdCIsIk1vbmVyb091dHB1dFdhbGxldCIsIk1vbmVyb091dHB1dFF1ZXJ5IiwiTW9uZXJvVHhQcmlvcml0eSIsIk1vbmVyb1R4Q29uZmlnIiwiTW9uZXJvU3ViYWRkcmVzcyIsIk1vbmVyb1N5bmNSZXN1bHQiLCJNb25lcm9UcmFuc2ZlciIsIk1vbmVyb0luY29taW5nVHJhbnNmZXIiLCJNb25lcm9PdXRnb2luZ1RyYW5zZmVyIiwiTW9uZXJvVHJhbnNmZXJRdWVyeSIsIk1vbmVyb1R4U2V0IiwiTW9uZXJvVHhXYWxsZXQiLCJNb25lcm9UeFF1ZXJ5IiwiTW9uZXJvV2FsbGV0TGlzdGVuZXIiLCJNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIk1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQiLCJNb25lcm9Db25uZWN0aW9uTWFuYWdlckxpc3RlbmVyIiwiTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIiLCJNb25lcm9EYWVtb24iLCJNb25lcm9XYWxsZXQiLCJUaHJlYWRQb29sIiwiX2RlZmF1bHQiXSwic291cmNlcyI6WyIuLi9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIElNUE9SVFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBTZWUgdGhlIGZ1bGwgbW9kZWwgc3BlY2lmaWNhdGlvbjogaHR0cHM6Ly93b29kc2VyLmdpdGh1Yi5pby9tb25lcm8tamF2YS9tb25lcm8tc3BlYy5wZGZcblxuLy8gaW1wb3J0IGNvbW1vbiBtb2RlbHNcbmltcG9ydCBHZW5VdGlscyBmcm9tIFwiLi9zcmMvbWFpbi90cy9jb21tb24vR2VuVXRpbHNcIjtcbmltcG9ydCBGaWx0ZXIgZnJvbSBcIi4vc3JjL21haW4vdHMvY29tbW9uL0ZpbHRlclwiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuL3NyYy9tYWluL3RzL2NvbW1vbi9Nb25lcm9FcnJvclwiO1xuaW1wb3J0IEh0dHBDbGllbnQgZnJvbSBcIi4vc3JjL21haW4vdHMvY29tbW9uL0h0dHBDbGllbnRcIjtcbmltcG9ydCBMaWJyYXJ5VXRpbHMgZnJvbSBcIi4vc3JjL21haW4vdHMvY29tbW9uL0xpYnJhcnlVdGlsc1wiO1xuaW1wb3J0IE1vbmVyb1JwY0Nvbm5lY3Rpb24gZnJvbSBcIi4vc3JjL21haW4vdHMvY29tbW9uL01vbmVyb1JwY0Nvbm5lY3Rpb25cIjtcbmltcG9ydCBNb25lcm9ScGNFcnJvciBmcm9tIFwiLi9zcmMvbWFpbi90cy9jb21tb24vTW9uZXJvUnBjRXJyb3JcIjtcbmltcG9ydCBTc2xPcHRpb25zIGZyb20gXCIuL3NyYy9tYWluL3RzL2NvbW1vbi9Tc2xPcHRpb25zXCI7XG5pbXBvcnQgVGFza0xvb3BlciBmcm9tIFwiLi9zcmMvbWFpbi90cy9jb21tb24vVGFza0xvb3BlclwiO1xuXG4vLyBpbXBvcnQgZGFlbW9uIG1vZGVsc1xuaW1wb3J0IENvbm5lY3Rpb25UeXBlIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Db25uZWN0aW9uVHlwZVwiO1xuaW1wb3J0IE1vbmVyb0FsdENoYWluIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9BbHRDaGFpblwiO1xuaW1wb3J0IE1vbmVyb0JhbiBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvQmFuXCI7XG5pbXBvcnQgTW9uZXJvQmxvY2tIZWFkZXIgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb0Jsb2NrSGVhZGVyXCI7XG5pbXBvcnQgTW9uZXJvQmxvY2sgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb0Jsb2NrXCI7XG5pbXBvcnQgTW9uZXJvQmxvY2tUZW1wbGF0ZSBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvQmxvY2tUZW1wbGF0ZVwiO1xuaW1wb3J0IE1vbmVyb0Nvbm5lY3Rpb25TcGFuIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9Db25uZWN0aW9uU3BhblwiO1xuaW1wb3J0IE1vbmVyb0RhZW1vbkNvbmZpZyBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvRGFlbW9uQ29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uSW5mbyBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvRGFlbW9uSW5mb1wiO1xuaW1wb3J0IE1vbmVyb0RhZW1vbkxpc3RlbmVyIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9EYWVtb25MaXN0ZW5lclwiO1xuaW1wb3J0IE1vbmVyb0RhZW1vblN5bmNJbmZvIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9EYWVtb25TeW5jSW5mb1wiO1xuaW1wb3J0IE1vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0IGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9EYWVtb25VcGRhdGVDaGVja1Jlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0IGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb0ZlZUVzdGltYXRlIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9GZWVFc3RpbWF0ZVwiO1xuaW1wb3J0IE1vbmVyb0hhcmRGb3JrSW5mbyBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvSGFyZEZvcmtJbmZvXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2UgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb0tleUltYWdlXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2VTcGVudFN0YXR1cyBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvS2V5SW1hZ2VTcGVudFN0YXR1c1wiO1xuaW1wb3J0IE1vbmVyb01pbmVyVHhTdW0gZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb01pbmVyVHhTdW1cIjtcbmltcG9ydCBNb25lcm9NaW5pbmdTdGF0dXMgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb01pbmluZ1N0YXR1c1wiO1xuaW1wb3J0IE1vbmVyb05ldHdvcmtUeXBlIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9OZXR3b3JrVHlwZVwiO1xuaW1wb3J0IE1vbmVyb091dHB1dCBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvT3V0cHV0XCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb091dHB1dEhpc3RvZ3JhbUVudHJ5XCI7XG5pbXBvcnQgTW9uZXJvU3VibWl0VHhSZXN1bHQgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb1N1Ym1pdFR4UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvVHggZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb1R4XCI7XG5pbXBvcnQgTW9uZXJvVHhQb29sU3RhdHMgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb1R4UG9vbFN0YXRzXCI7XG5pbXBvcnQgTW9uZXJvVmVyc2lvbiBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvVmVyc2lvblwiO1xuaW1wb3J0IE1vbmVyb1BlZXIgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb1BlZXJcIjtcbmltcG9ydCBNb25lcm9QcnVuZVJlc3VsdCBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvUHJ1bmVSZXN1bHRcIjtcblxuLy8gaW1wb3J0IHdhbGxldCBtb2RlbHNcbmltcG9ydCBNb25lcm9BY2NvdW50IGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9BY2NvdW50XCI7XG5pbXBvcnQgTW9uZXJvQWNjb3VudFRhZyBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvQWNjb3VudFRhZ1wiO1xuaW1wb3J0IE1vbmVyb0FkZHJlc3NCb29rRW50cnkgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb0FkZHJlc3NCb29rRW50cnlcIjtcbmltcG9ydCBNb25lcm9DaGVjayBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvQ2hlY2tcIjtcbmltcG9ydCBNb25lcm9DaGVja1Jlc2VydmUgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb0NoZWNrUmVzZXJ2ZVwiO1xuaW1wb3J0IE1vbmVyb0NoZWNrVHggZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb0NoZWNrVHhcIjtcbmltcG9ydCBNb25lcm9EZXN0aW5hdGlvbiBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvRGVzdGluYXRpb25cIjtcbmltcG9ydCBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3NcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ0luZm8gZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb011bHRpc2lnSW5mb1wiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0IGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHRcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRXYWxsZXQgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb091dHB1dFdhbGxldFwiO1xuaW1wb3J0IE1vbmVyb091dHB1dFF1ZXJ5IGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9PdXRwdXRRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb1R4UHJpb3JpdHkgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb1R4UHJpb3JpdHlcIjtcbmltcG9ydCBNb25lcm9UeENvbmZpZyBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvVHhDb25maWdcIjtcbmltcG9ydCBNb25lcm9TdWJhZGRyZXNzIGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9TdWJhZGRyZXNzXCI7XG5pbXBvcnQgTW9uZXJvU3luY1Jlc3VsdCBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvU3luY1Jlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb1RyYW5zZmVyIGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9UcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb0luY29taW5nVHJhbnNmZXIgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb0luY29taW5nVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9PdXRnb2luZ1RyYW5zZmVyIGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9PdXRnb2luZ1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvVHJhbnNmZXJRdWVyeSBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvVHJhbnNmZXJRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb1R4U2V0IGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9UeFNldFwiO1xuaW1wb3J0IE1vbmVyb1R4V2FsbGV0IGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9UeFdhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1R4UXVlcnkgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb1R4UXVlcnlcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRMaXN0ZW5lciBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvV2FsbGV0TGlzdGVuZXJcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRDb25maWcgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb1dhbGxldENvbmZpZ1wiO1xuaW1wb3J0IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZVwiO1xuaW1wb3J0IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHRcIjtcblxuLy8gaW1wb3J0IGNvbm5lY3Rpb24gbWFuYWdlclxuaW1wb3J0IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyIGZyb20gXCIuL3NyYy9tYWluL3RzL2NvbW1vbi9Nb25lcm9Db25uZWN0aW9uTWFuYWdlclwiO1xuaW1wb3J0IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIgZnJvbSBcIi4vc3JjL21haW4vdHMvY29tbW9uL01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXJcIjtcblxuLy8gaW1wb3J0IGRhZW1vbiwgd2FsbGV0LCBhbmQgdXRpbCBjbGFzc2VzXG5pbXBvcnQgTW9uZXJvRGFlbW9uIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9Nb25lcm9EYWVtb25cIjtcbmltcG9ydCBNb25lcm9XYWxsZXQgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L01vbmVyb1dhbGxldFwiO1xuaW1wb3J0IE1vbmVyb0RhZW1vblJwYyBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vTW9uZXJvRGFlbW9uUnBjXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0UnBjIGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9Nb25lcm9XYWxsZXRScGNcIjtcbmltcG9ydCB7IE1vbmVyb1dhbGxldEtleXMgfSBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvTW9uZXJvV2FsbGV0S2V5c1wiO1xuaW1wb3J0IE1vbmVyb1dhbGxldEZ1bGwgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L01vbmVyb1dhbGxldEZ1bGxcIjtcbmltcG9ydCBNb25lcm9VdGlscyBmcm9tIFwiLi9zcmMvbWFpbi90cy9jb21tb24vTW9uZXJvVXRpbHNcIjtcbmltcG9ydCBUaHJlYWRQb29sIGZyb20gXCIuL3NyYy9tYWluL3RzL2NvbW1vbi9UaHJlYWRQb29sXCI7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gR0xPQkFMIEZVTkNUSU9OUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLyoqXG4gKiA8cD5HZXQgdGhlIHZlcnNpb24gb2YgdGhlIG1vbmVyby10cyBsaWJyYXJ5LjxwPlxuICpcbiAqIEByZXR1cm4ge3N0cmluZ30gdGhlIHZlcnNpb24gb2YgdGhpcyBtb25lcm8tdHMgbGlicmFyeVxuICovXG5mdW5jdGlvbiBnZXRWZXJzaW9uKCkge1xuICByZXR1cm4gTW9uZXJvVXRpbHMuZ2V0VmVyc2lvbigpO1xufVxuXG4vKipcbiAqIDxwPkNyZWF0ZSBhIGNsaWVudCBjb25uZWN0ZWQgdG8gbW9uZXJvZC48cD5cbiAqXG4gKiA8cD5FeGFtcGxlczo8cD5cbiAqXG4gKiA8Y29kZT5cbiAqIGxldCBkYWVtb24gPSBhd2FpdCBtb25lcm9Ucy5jb25uZWN0VG9EYWVtb25ScGMoXCJodHRwOi8vbG9jYWxob3N0OjM4MDgxXCIpOzxicj5cbiAqIDwvY29kZT48YnI+XG4gKiA8YnI+XG4gKiA8Y29kZT5cbiAqIGxldCBkYWVtb24gPSBhd2FpdCBtb25lcm9Ucy5jb25uZWN0VG9EYWVtb25ScGMoezxicj5cbiAqICZuYnNwOyZuYnNwOyB1cmk6IFwiaHR0cDovL2xvY2FsaG9zdDozODA4MVwiLDxicj5cbiAqICZuYnNwOyZuYnNwOyB1c2VybmFtZTogXCJzdXBlcnVzZXJcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgcGFzc3dvcmQ6IFwiYWJjdGVzdGluZzEyM1wiPGJyPlxuICogfSk7XG4gKiA8L2NvZGU+PGJyPlxuICogPGJyPlxuICogPGNvZGU+XG4gKiAvLyBzdGFydCBtb25lcm9kIGFzIGFuIGludGVybmFsIHByb2Nlc3M8YnI+XG4gKiBsZXQgZGFlbW9uID0gYXdhaXQgbW9uZXJvVHMuY29ubmVjdFRvRGFlbW9uUnBjKHs8YnI+XG4gKiAmbmJzcDsmbmJzcDsgY21kOiBbXCJwYXRoL3RvL21vbmVyb2RcIiwgLi4ucGFyYW1zLi4uXSw8YnI+XG4gKiB9KTtcbiAqIDwvY29kZT5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+fFBhcnRpYWw8TW9uZXJvRGFlbW9uQ29uZmlnPnxzdHJpbmdbXX0gdXJpT3JDb25maWcgLSB1cmkgb3IgcnBjIGNvbm5lY3Rpb24gb3IgY29uZmlnIG9yIHRlcm1pbmFsIHBhcmFtZXRlcnMgdG8gY29ubmVjdCB0byBtb25lcm9kXG4gKiBAcGFyYW0ge3N0cmluZ30gW3VzZXJuYW1lXSAtIHVzZXJuYW1lIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIG1vbmVyb2RcbiAqIEBwYXJhbSB7c3RyaW5nfSBbcGFzc3dvcmRdIC0gcGFzc3dvcmQgdG8gYXV0aGVudGljYXRlIHdpdGggbW9uZXJvZFxuICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9EYWVtb25ScGM+fSB0aGUgZGFlbW9uIFJQQyBjbGllbnRcbiAqL1xuZnVuY3Rpb24gY29ubmVjdFRvRGFlbW9uUnBjKHVyaU9yQ29uZmlnOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHwgUGFydGlhbDxNb25lcm9EYWVtb25Db25maWc+IHwgc3RyaW5nW10sIHVzZXJuYW1lPzogc3RyaW5nLCBwYXNzd29yZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvRGFlbW9uUnBjPiB7XG4gIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29ubmVjdFRvRGFlbW9uUnBjKHVyaU9yQ29uZmlnLCB1c2VybmFtZSwgcGFzc3dvcmQpO1xufVxuXG4vKipcbiAqIDxwPkNyZWF0ZSBhIGNsaWVudCBjb25uZWN0ZWQgdG8gbW9uZXJvLXdhbGxldC1ycGMuPC9wPlxuICpcbiAqIDxwPkV4YW1wbGVzOjwvcD5cbiAqXG4gKiA8Y29kZT5cbiAqIGxldCB3YWxsZXRScGMgPSBhd2FpdCBtb25lcm9Ucy5jb25uZWN0VG9XYWxsZXRScGMoezxicj5cbiAqICZuYnNwOyZuYnNwOyB1cmk6IFwiaHR0cDovL2xvY2FsaG9zdDozODA4MVwiLDxicj5cbiAqICZuYnNwOyZuYnNwOyB1c2VybmFtZTogXCJzdXBlcnVzZXJcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgcGFzc3dvcmQ6IFwiYWJjdGVzdGluZzEyM1wiLDxicj5cbiAqICZuYnNwOyZuYnNwOyByZWplY3RVbmF1dGhvcml6ZWQ6IGZhbHNlIC8vIGUuZy4gbG9jYWwgZGV2ZWxvcG1lbnQ8YnI+XG4gKiB9KTs8YnI+XG4gKiA8L2NvZGU+PGJyPlxuICogPGJyPlxuICogPGNvZGU+XG4gKiAvLyBjb25uZWN0IHRvIG1vbmVyby13YWxsZXQtcnBjIHJ1bm5pbmcgYXMgaW50ZXJuYWwgcHJvY2Vzczxicj5cbiAqIGxldCB3YWxsZXRScGMgPSBhd2FpdCBtb25lcm9Ucy5jb25uZWN0VG9XYWxsZXRScGMoe2NtZDogWzxicj5cbiAqICZuYnNwOyZuYnNwOyBcIi9wYXRoL3RvL21vbmVyby13YWxsZXQtcnBjXCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7IFwiLS1zdGFnZW5ldFwiLDxicj5cbiAqICZuYnNwOyZuYnNwOyBcIi0tZGFlbW9uLWFkZHJlc3NcIiwgXCJodHRwOi8vbG9jYWxob3N0OjM4MDgxXCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7IFwiLS1kYWVtb24tbG9naW5cIiwgXCJzdXBlcnVzZXI6YWJjdGVzdGluZzEyM1wiLDxicj5cbiAqICZuYnNwOyZuYnNwOyBcIi0tcnBjLWJpbmQtcG9ydFwiLCBcIjM4MDg1XCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7IFwiLS1ycGMtbG9naW5cIiwgXCJycGNfdXNlcjphYmMxMjNcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgXCItLXdhbGxldC1kaXJcIiwgXCIvcGF0aC90by93YWxsZXRzXCIsIC8vIGRlZmF1bHRzIHRvIG1vbmVyby13YWxsZXQtcnBjIGRpcmVjdG9yeTxicj5cbiAqICZuYnNwOyZuYnNwOyBcIi0tcnBjLWFjY2Vzcy1jb250cm9sLW9yaWdpbnNcIiwgXCJodHRwOi8vbG9jYWxob3N0OjgwODBcIjxicj5cbiAqICZuYnNwO119KTtcbiAqIDwvY29kZT5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+fFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPnxzdHJpbmdbXX0gdXJpT3JDb25maWcgLSB1cmkgb3IgcnBjIGNvbm5lY3Rpb24gb3IgY29uZmlnIG9yIHRlcm1pbmFsIHBhcmFtZXRlcnMgdG8gY29ubmVjdCB0byBtb25lcm8td2FsbGV0LXJwY1xuICogQHBhcmFtIHtzdHJpbmd9IFt1c2VybmFtZV0gLSB1c2VybmFtZSB0byBhdXRoZW50aWNhdGUgd2l0aCBtb25lcm8td2FsbGV0LXJwY1xuICogQHBhcmFtIHtzdHJpbmd9IFtwYXNzd29yZF0gLSBwYXNzd29yZCB0byBhdXRoZW50aWNhdGUgd2l0aCBtb25lcm8td2FsbGV0LXJwY1xuICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9XYWxsZXRScGM+fSB0aGUgd2FsbGV0IFJQQyBjbGllbnRcbiAqL1xuZnVuY3Rpb24gY29ubmVjdFRvV2FsbGV0UnBjKHVyaU9yQ29uZmlnOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHwgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+IHwgc3RyaW5nW10sIHVzZXJuYW1lPzogc3RyaW5nLCBwYXNzd29yZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvV2FsbGV0UnBjPiB7XG4gIHJldHVybiBNb25lcm9XYWxsZXRScGMuY29ubmVjdFRvV2FsbGV0UnBjKHVyaU9yQ29uZmlnLCB1c2VybmFtZSwgcGFzc3dvcmQpO1xufVxuXG4vKipcbiAqIDxwPkNyZWF0ZSBhIE1vbmVybyB3YWxsZXQgdXNpbmcgY2xpZW50LXNpZGUgV2ViQXNzZW1ibHkgYmluZGluZ3MgdG8gbW9uZXJvLXByb2plY3QncyB3YWxsZXQyIGluIEMrKy48cD5cbiAqXG4gKiA8cD5FeGFtcGxlOjwvcD5cbiAqXG4gKiA8Y29kZT5cbiAqIGNvbnN0IHdhbGxldCA9IGF3YWl0IG1vbmVyb1RzLmNyZWF0ZVdhbGxldEZ1bGwoezxicj5cbiAqICZuYnNwOyZuYnNwOyBwYXRoOiBcIi4vdGVzdF93YWxsZXRzL3dhbGxldDFcIiwgLy8gbGVhdmUgYmxhbmsgZm9yIGluLW1lbW9yeSB3YWxsZXQ8YnI+XG4gKiAmbmJzcDsmbmJzcDsgcGFzc3dvcmQ6IFwic3VwZXJzZWNyZXRwYXNzd29yZFwiLDxicj5cbiAqICZuYnNwOyZuYnNwOyBuZXR3b3JrVHlwZTogbW9uZXJvVHMuTW9uZXJvTmV0d29ya1R5cGUuU1RBR0VORVQsPGJyPlxuICogJm5ic3A7Jm5ic3A7IHNlZWQ6IFwiY29leGlzdCBpZ2xvbyBwYW1waGxldCBsYWdvb24uLi5cIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgcmVzdG9yZUhlaWdodDogMTU0MzIxOCw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgc2VydmVyOiBcImh0dHA6Ly9sb2NhbGhvc3Q6MzgwODFcIjxicj5cbiAqIH0pO1xuICogPC9jb2RlPjxicj5cbiAqIDxicj5cbiAqIDxjb2RlPlxuICogY29uc3Qgd2FsbGV0ID0gYXdhaXQgbW9uZXJvVHMuY3JlYXRlV2FsbGV0RnVsbCh7PGJyPlxuICogJm5ic3A7Jm5ic3A7IHBhdGg6IFwiLi90ZXN0X3dhbGxldHMvd2FsbGV0MVwiLCAvLyBsZWF2ZSBibGFuayBmb3IgaW4tbWVtb3J5IHdhbGxldDxicj5cbiAqICZuYnNwOyZuYnNwOyBwYXNzd29yZDogXCJzdXBlcnNlY3JldHBhc3N3b3JkXCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7IG5ldHdvcmtUeXBlOiBtb25lcm9Ucy5Nb25lcm9OZXR3b3JrVHlwZS5TVEFHRU5FVCw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgc2VlZDogXCJjb2V4aXN0IGlnbG9vIHBhbXBobGV0IGxhZ29vbi4uLlwiLDxicj5cbiAqICZuYnNwOyZuYnNwOyByZXN0b3JlSGVpZ2h0OiAxNTQzMjE4LDxicj5cbiAqICZuYnNwOyZuYnNwOyBwcm94eVRvV29ya2VyOiBmYWxzZSwgLy8gb3ZlcnJpZGUgZGVmYXVsdDxicj5cbiAqICZuYnNwOyZuYnNwOyBzZXJ2ZXI6IHs8YnI+XG4gKiAmbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDsgdXJpOiBcImh0dHA6Ly9sb2NhbGhvc3Q6MzgwODFcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDsgdXNlcm5hbWU6IFwiZGFlbW9uX3VzZXJcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDsgcGFzc3dvcmQ6IFwiZGFlbW9uX3Bhc3N3b3JkXzEyM1wiPGJyPlxuICogJm5ic3A7Jm5ic3A7IH08YnI+XG4gKiB9KTtcbiAqIDwvY29kZT5cbiAqXG4gKiBAcGFyYW0ge1BhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPn0gY29uZmlnIC0gTW9uZXJvV2FsbGV0Q29uZmlnIG9yIGVxdWl2YWxlbnQgY29uZmlnIG9iamVjdFxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucGF0aF0gLSBwYXRoIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbCwgaW4tbWVtb3J5IHdhbGxldCBpZiBub3QgZ2l2ZW4pXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wYXNzd29yZF0gLSBwYXNzd29yZCBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZVxuICogQHBhcmFtIHtNb25lcm9OZXR3b3JrVHlwZXxzdHJpbmd9IFtjb25maWcubmV0d29ya1R5cGVdIC0gbmV0d29yayB0eXBlIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvbmUgb2YgXCJtYWlubmV0XCIsIFwidGVzdG5ldFwiLCBcInN0YWdlbmV0XCIgb3IgTW9uZXJvTmV0d29ya1R5cGUuTUFJTk5FVHxURVNUTkVUfFNUQUdFTkVUKVxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VlZF0gLSBzZWVkIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbCwgcmFuZG9tIHdhbGxldCBjcmVhdGVkIGlmIG5laXRoZXIgc2VlZCBub3Iga2V5cyBnaXZlbilcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlZWRPZmZzZXRdIC0gdGhlIG9mZnNldCB1c2VkIHRvIGRlcml2ZSBhIG5ldyBzZWVkIGZyb20gdGhlIGdpdmVuIHNlZWQgdG8gcmVjb3ZlciBhIHNlY3JldCB3YWxsZXQgZnJvbSB0aGUgc2VlZCBwaHJhc2VcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5pc011bHRpc2lnXSAtIHJlc3RvcmUgbXVsdGlzaWcgd2FsbGV0IGZyb20gc2VlZFxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpbWFyeUFkZHJlc3NdIC0gcHJpbWFyeSBhZGRyZXNzIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvbmx5IHByb3ZpZGUgaWYgcmVzdG9yaW5nIGZyb20ga2V5cylcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnByaXZhdGVWaWV3S2V5XSAtIHByaXZhdGUgdmlldyBrZXkgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsKVxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpdmF0ZVNwZW5kS2V5XSAtIHByaXZhdGUgc3BlbmQga2V5IG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbClcbiAqIEBwYXJhbSB7bnVtYmVyfSBbY29uZmlnLnJlc3RvcmVIZWlnaHRdIC0gYmxvY2sgaGVpZ2h0IHRvIHN0YXJ0IHNjYW5uaW5nIGZyb20gKGRlZmF1bHRzIHRvIDAgdW5sZXNzIGdlbmVyYXRpbmcgcmFuZG9tIHdhbGxldClcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLmxhbmd1YWdlXSAtIGxhbmd1YWdlIG9mIHRoZSB3YWxsZXQncyBzZWVkIHBocmFzZSAoZGVmYXVsdHMgdG8gXCJFbmdsaXNoXCIgb3IgYXV0by1kZXRlY3RlZClcbiAqIEBwYXJhbSB7bnVtYmVyfSBbY29uZmlnLmFjY291bnRMb29rYWhlYWRdIC0gIG51bWJlciBvZiBhY2NvdW50cyB0byBzY2FuIChvcHRpb25hbClcbiAqIEBwYXJhbSB7bnVtYmVyfSBbY29uZmlnLnN1YmFkZHJlc3NMb29rYWhlYWRdIC0gbnVtYmVyIG9mIHN1YmFkZHJlc3NlcyB0byBzY2FuIHBlciBhY2NvdW50IChvcHRpb25hbClcbiAqIEBwYXJhbSB7c3RyaW5nfFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj59IFtjb25maWcuc2VydmVyXSAtIGNvbm5lY3Rpb24gdG8gbW9uZXJvIGRhZW1vbiAob3B0aW9uYWwpXG4gKiBAcGFyYW0ge01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyfSBbY29uZmlnLmNvbm5lY3Rpb25NYW5hZ2VyXSAtIG1hbmFnZSBjb25uZWN0aW9ucyB0byBtb25lcm9kIChvcHRpb25hbClcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5yZWplY3RVbmF1dGhvcml6ZWRdIC0gcmVqZWN0IHNlbGYtc2lnbmVkIHNlcnZlciBjZXJ0aWZpY2F0ZXMgaWYgdHJ1ZSAoZGVmYXVsdHMgdG8gdHJ1ZSlcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5wcm94eVRvV29ya2VyXSAtIHByb3hpZXMgd2FsbGV0IG9wZXJhdGlvbnMgdG8gYSB3b3JrZXIgaW4gb3JkZXIgdG8gbm90IGJsb2NrIHRoZSBtYWluIHRocmVhZCAoZGVmYXVsdCB0cnVlKVxuICogQHBhcmFtIHthbnl9IFtjb25maWcuZnNdIC0gTm9kZS5qcyBjb21wYXRpYmxlIGZpbGUgc3lzdGVtIHRvIHVzZSAoZGVmYXVsdHMgdG8gZGlzayBvciBpbi1tZW1vcnkgRlMgaWYgYnJvd3NlcilcbiAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvV2FsbGV0RnVsbD59IHRoZSBjcmVhdGVkIHdhbGxldFxuICovXG5mdW5jdGlvbiBjcmVhdGVXYWxsZXRGdWxsKGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KTogUHJvbWlzZTxNb25lcm9XYWxsZXRGdWxsPiB7XG4gIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLmNyZWF0ZVdhbGxldChuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKGNvbmZpZykpO1xufVxuXG4vKipcbiAqIDxwPk9wZW4gYW4gZXhpc3RpbmcgTW9uZXJvIHdhbGxldCB1c2luZyBjbGllbnQtc2lkZSBXZWJBc3NlbWJseSBiaW5kaW5ncyB0byBtb25lcm8tcHJvamVjdCdzIHdhbGxldDIgaW4gQysrLjxwPlxuICpcbiAqIDxwPkV4YW1wbGU6PHA+XG4gKlxuICogPGNvZGU+XG4gKiBjb25zdCB3YWxsZXQgPSBhd2FpdCBtb25lcm9Ucy5vcGVuV2FsbGV0RnVsbCh7PGJyPlxuICogJm5ic3A7Jm5ic3A7IHBhdGg6IFwiLi93YWxsZXRzL3dhbGxldDFcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgcGFzc3dvcmQ6IFwic3VwZXJzZWNyZXRwYXNzd29yZFwiLDxicj5cbiAqICZuYnNwOyZuYnNwOyBuZXR3b3JrVHlwZTogbW9uZXJvVHMuTW9uZXJvTmV0d29ya1R5cGUuU1RBR0VORVQsPGJyPlxuICogJm5ic3A7Jm5ic3A7IHNlcnZlcjogeyAvLyBkYWVtb24gY29uZmlndXJhdGlvbjxicj5cbiAqICZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwOyB1cmk6IFwiaHR0cDovL2xvY2FsaG9zdDozODA4MVwiLDxicj5cbiAqICZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwOyB1c2VybmFtZTogXCJzdXBlcnVzZXJcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDsgcGFzc3dvcmQ6IFwiYWJjdGVzdGluZzEyM1wiPGJyPlxuICogJm5ic3A7Jm5ic3A7IH08YnI+XG4gKiB9KTtcbiAqIDwvY29kZT5cbiAqXG4gKiBAcGFyYW0ge1BhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPn0gY29uZmlnIC0gY29uZmlnIHRvIG9wZW4gYSBmdWxsIHdhbGxldFxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucGF0aF0gLSBwYXRoIG9mIHRoZSB3YWxsZXQgdG8gb3BlbiAob3B0aW9uYWwgaWYgJ2tleXNEYXRhJyBwcm92aWRlZClcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnBhc3N3b3JkXSAtIHBhc3N3b3JkIG9mIHRoZSB3YWxsZXQgdG8gb3BlblxuICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBbY29uZmlnLm5ldHdvcmtUeXBlXSAtIG5ldHdvcmsgdHlwZSBvZiB0aGUgd2FsbGV0IHRvIG9wZW4gKG9uZSBvZiBcIm1haW5uZXRcIiwgXCJ0ZXN0bmV0XCIsIFwic3RhZ2VuZXRcIiBvciBNb25lcm9OZXR3b3JrVHlwZS5NQUlOTkVUfFRFU1RORVR8U1RBR0VORVQpXG4gKiBAcGFyYW0ge3N0cmluZ3xNb25lcm9ScGNDb25uZWN0aW9ufSBbY29uZmlnLnNlcnZlcl0gLSB1cmkgb3IgY29ubmVjdGlvbiB0byBtb25lcm8gZGFlbW9uIChvcHRpb25hbClcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gW2NvbmZpZy5rZXlzRGF0YV0gLSB3YWxsZXQga2V5cyBkYXRhIHRvIG9wZW4gKG9wdGlvbmFsIGlmIHBhdGggcHJvdmlkZWQpXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IFtjb25maWcuY2FjaGVEYXRhXSAtIHdhbGxldCBjYWNoZSBkYXRhIHRvIG9wZW4gKG9wdGlvbmFsKVxuICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLnByb3h5VG9Xb3JrZXJdIC0gcHJveGllcyB3YWxsZXQgb3BlcmF0aW9ucyB0byBhIHdvcmtlciBpbiBvcmRlciB0byBub3QgYmxvY2sgdGhlIG1haW4gdGhyZWFkIChkZWZhdWx0IHRydWUpXG4gKiBAcGFyYW0ge2FueX0gW2NvbmZpZy5mc10gLSBOb2RlLmpzIGNvbXBhdGlibGUgZmlsZSBzeXN0ZW0gdG8gdXNlIChkZWZhdWx0cyB0byBkaXNrIG9yIGluLW1lbW9yeSBGUyBpZiBicm93c2VyKVxuICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9XYWxsZXRGdWxsPn0gdGhlIG9wZW5lZCB3YWxsZXRcbiAqL1xuZnVuY3Rpb24gb3BlbldhbGxldEZ1bGwoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1dhbGxldEZ1bGw+IHtcbiAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwub3BlbldhbGxldChuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKGNvbmZpZykpO1xufVxuXG4vKipcbiAqIDxwPkNyZWF0ZSBhIHdhbGxldCB1c2luZyBXZWJBc3NlbWJseSBiaW5kaW5ncyB0byBtb25lcm8tcHJvamVjdC48L3A+XG4gKlxuICogPHA+RXhhbXBsZTo8L3A+XG4gKlxuICogPGNvZGU+XG4gKiBjb25zdCB3YWxsZXQgPSBhd2FpdCBtb25lcm9Ucy5jcmVhdGVXYWxsZXRLZXlzKHs8YnI+XG4gKiAmbmJzcDsmbmJzcDsgcGFzc3dvcmQ6IFwiYWJjMTIzXCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7IG5ldHdvcmtUeXBlOiBtb25lcm9Ucy5Nb25lcm9OZXR3b3JrVHlwZS5TVEFHRU5FVCw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgc2VlZDogXCJjb2V4aXN0IGlnbG9vIHBhbXBobGV0IGxhZ29vbi4uLlwiPGJyPlxuICogfSk7XG4gKiA8L2NvZGU+XG4gKlxuICogQHBhcmFtIHtQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz59IGNvbmZpZyAtIE1vbmVyb1dhbGxldENvbmZpZyBvciBlcXVpdmFsZW50IGNvbmZpZyBvYmplY3RcbiAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gY29uZmlnLm5ldHdvcmtUeXBlIC0gbmV0d29yayB0eXBlIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvbmUgb2YgXCJtYWlubmV0XCIsIFwidGVzdG5ldFwiLCBcInN0YWdlbmV0XCIgb3IgTW9uZXJvTmV0d29ya1R5cGUuTUFJTk5FVHxURVNUTkVUfFNUQUdFTkVUKVxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VlZF0gLSBzZWVkIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbCwgcmFuZG9tIHdhbGxldCBjcmVhdGVkIGlmIG5laXRoZXIgc2VlZCBub3Iga2V5cyBnaXZlbilcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlZWRPZmZzZXRdIC0gdGhlIG9mZnNldCB1c2VkIHRvIGRlcml2ZSBhIG5ldyBzZWVkIGZyb20gdGhlIGdpdmVuIHNlZWQgdG8gcmVjb3ZlciBhIHNlY3JldCB3YWxsZXQgZnJvbSB0aGUgc2VlZCBwaHJhc2VcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnByaW1hcnlBZGRyZXNzXSAtIHByaW1hcnkgYWRkcmVzcyBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob25seSBwcm92aWRlIGlmIHJlc3RvcmluZyBmcm9tIGtleXMpXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wcml2YXRlVmlld0tleV0gLSBwcml2YXRlIHZpZXcga2V5IG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbClcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnByaXZhdGVTcGVuZEtleV0gLSBwcml2YXRlIHNwZW5kIGtleSBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwpXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5sYW5ndWFnZV0gLSBsYW5ndWFnZSBvZiB0aGUgd2FsbGV0J3Mgc2VlZCAoZGVmYXVsdHMgdG8gXCJFbmdsaXNoXCIgb3IgYXV0by1kZXRlY3RlZClcbiAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvV2FsbGV0S2V5cz59IHRoZSBjcmVhdGVkIHdhbGxldFxuICovXG5mdW5jdGlvbiBjcmVhdGVXYWxsZXRLZXlzKGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KTogUHJvbWlzZTxNb25lcm9XYWxsZXRLZXlzPiB7XG4gIHJldHVybiBNb25lcm9XYWxsZXRLZXlzLmNyZWF0ZVdhbGxldChuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKGNvbmZpZykpO1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gRVhQT1JUUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmV4cG9ydCB7XG5cbiAgLy8gdHlwZXNcbiAgR2VuVXRpbHMsXG4gIEZpbHRlcixcbiAgTW9uZXJvRXJyb3IsXG4gIEh0dHBDbGllbnQsXG4gIExpYnJhcnlVdGlscyxcbiAgTW9uZXJvUnBjQ29ubmVjdGlvbixcbiAgTW9uZXJvUnBjRXJyb3IsXG4gIFNzbE9wdGlvbnMsXG4gIFRhc2tMb29wZXIsXG4gIENvbm5lY3Rpb25UeXBlLFxuICBNb25lcm9BbHRDaGFpbixcbiAgTW9uZXJvQmFuLFxuICBNb25lcm9CbG9ja0hlYWRlcixcbiAgTW9uZXJvQmxvY2ssXG4gIE1vbmVyb0Jsb2NrVGVtcGxhdGUsXG4gIE1vbmVyb0Nvbm5lY3Rpb25TcGFuLFxuICBNb25lcm9EYWVtb25Db25maWcsXG4gIE1vbmVyb0RhZW1vbkluZm8sXG4gIE1vbmVyb0RhZW1vbkxpc3RlbmVyLFxuICBNb25lcm9EYWVtb25TeW5jSW5mbyxcbiAgTW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQsXG4gIE1vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0LFxuICBNb25lcm9GZWVFc3RpbWF0ZSxcbiAgTW9uZXJvSGFyZEZvcmtJbmZvLFxuICBNb25lcm9LZXlJbWFnZSxcbiAgTW9uZXJvS2V5SW1hZ2VTcGVudFN0YXR1cyxcbiAgTW9uZXJvTWluZXJUeFN1bSxcbiAgTW9uZXJvTWluaW5nU3RhdHVzLFxuICBNb25lcm9OZXR3b3JrVHlwZSxcbiAgTW9uZXJvT3V0cHV0LFxuICBNb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeSxcbiAgTW9uZXJvU3VibWl0VHhSZXN1bHQsXG4gIE1vbmVyb1R4LFxuICBNb25lcm9UeFBvb2xTdGF0cyxcbiAgTW9uZXJvVmVyc2lvbixcbiAgTW9uZXJvUGVlcixcbiAgTW9uZXJvUHJ1bmVSZXN1bHQsXG4gIE1vbmVyb0FjY291bnQsXG4gIE1vbmVyb0FjY291bnRUYWcsXG4gIE1vbmVyb0FkZHJlc3NCb29rRW50cnksXG4gIE1vbmVyb0NoZWNrLFxuICBNb25lcm9DaGVja1Jlc2VydmUsXG4gIE1vbmVyb0NoZWNrVHgsXG4gIE1vbmVyb0Rlc3RpbmF0aW9uLFxuICBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyxcbiAgTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQsXG4gIE1vbmVyb011bHRpc2lnSW5mbyxcbiAgTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0LFxuICBNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQsXG4gIE1vbmVyb091dHB1dFdhbGxldCxcbiAgTW9uZXJvT3V0cHV0UXVlcnksXG4gIE1vbmVyb1R4UHJpb3JpdHksXG4gIE1vbmVyb1R4Q29uZmlnLFxuICBNb25lcm9TdWJhZGRyZXNzLFxuICBNb25lcm9TeW5jUmVzdWx0LFxuICBNb25lcm9UcmFuc2ZlcixcbiAgTW9uZXJvSW5jb21pbmdUcmFuc2ZlcixcbiAgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcixcbiAgTW9uZXJvVHJhbnNmZXJRdWVyeSxcbiAgTW9uZXJvVHhTZXQsXG4gIE1vbmVyb1R4V2FsbGV0LFxuICBNb25lcm9UeFF1ZXJ5LFxuICBNb25lcm9XYWxsZXRMaXN0ZW5lcixcbiAgTW9uZXJvV2FsbGV0Q29uZmlnLFxuICBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSxcbiAgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCxcbiAgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lcixcbiAgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIsXG4gIE1vbmVyb0RhZW1vbixcbiAgTW9uZXJvV2FsbGV0LFxuICBNb25lcm9EYWVtb25ScGMsXG4gIE1vbmVyb1dhbGxldFJwYyxcbiAgTW9uZXJvV2FsbGV0S2V5cyxcbiAgTW9uZXJvV2FsbGV0RnVsbCxcbiAgTW9uZXJvVXRpbHMsXG4gIFRocmVhZFBvb2wsXG5cbiAgLy8gZ2xvYmFsIGZ1bmN0aW9uc1xuICBnZXRWZXJzaW9uLFxuICBjb25uZWN0VG9EYWVtb25ScGMsXG4gIGNvbm5lY3RUb1dhbGxldFJwYyxcbiAgY3JlYXRlV2FsbGV0RnVsbCxcbiAgb3BlbldhbGxldEZ1bGwsXG4gIGNyZWF0ZVdhbGxldEtleXNcbn07XG5cbi8vIGV4cG9ydCBkZWZhdWx0IG9iamVjdCB3aXRoIGFnZ3JlZ2F0ZSBvZiBhbGwgZXhwb3J0c1xuY29uc3QgbW9uZXJvVHMgPSB7XG4gIEdlblV0aWxzLFxuICBGaWx0ZXIsXG4gIE1vbmVyb0Vycm9yLFxuICBIdHRwQ2xpZW50LFxuICBMaWJyYXJ5VXRpbHMsXG4gIE1vbmVyb1JwY0Nvbm5lY3Rpb24sXG4gIE1vbmVyb1JwY0Vycm9yLFxuICBTc2xPcHRpb25zLFxuICBUYXNrTG9vcGVyLFxuICBDb25uZWN0aW9uVHlwZSxcbiAgTW9uZXJvQWx0Q2hhaW4sXG4gIE1vbmVyb0JhbixcbiAgTW9uZXJvQmxvY2tIZWFkZXIsXG4gIE1vbmVyb0Jsb2NrLFxuICBNb25lcm9CbG9ja1RlbXBsYXRlLFxuICBNb25lcm9Db25uZWN0aW9uU3BhbixcbiAgTW9uZXJvRGFlbW9uQ29uZmlnLFxuICBNb25lcm9EYWVtb25JbmZvLFxuICBNb25lcm9EYWVtb25MaXN0ZW5lcixcbiAgTW9uZXJvRGFlbW9uU3luY0luZm8sXG4gIE1vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0LFxuICBNb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdCxcbiAgTW9uZXJvRmVlRXN0aW1hdGUsXG4gIE1vbmVyb0hhcmRGb3JrSW5mbyxcbiAgTW9uZXJvS2V5SW1hZ2UsXG4gIE1vbmVyb0tleUltYWdlU3BlbnRTdGF0dXMsXG4gIE1vbmVyb01pbmVyVHhTdW0sXG4gIE1vbmVyb01pbmluZ1N0YXR1cyxcbiAgTW9uZXJvTmV0d29ya1R5cGUsXG4gIE1vbmVyb091dHB1dCxcbiAgTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnksXG4gIE1vbmVyb1N1Ym1pdFR4UmVzdWx0LFxuICBNb25lcm9UeCxcbiAgTW9uZXJvVHhQb29sU3RhdHMsXG4gIE1vbmVyb1ZlcnNpb24sXG4gIE1vbmVyb1BlZXIsXG4gIE1vbmVyb1BydW5lUmVzdWx0LFxuICBNb25lcm9BY2NvdW50LFxuICBNb25lcm9BY2NvdW50VGFnLFxuICBNb25lcm9BZGRyZXNzQm9va0VudHJ5LFxuICBNb25lcm9DaGVjayxcbiAgTW9uZXJvQ2hlY2tSZXNlcnZlLFxuICBNb25lcm9DaGVja1R4LFxuICBNb25lcm9EZXN0aW5hdGlvbixcbiAgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MsXG4gIE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0LFxuICBNb25lcm9NdWx0aXNpZ0luZm8sXG4gIE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCxcbiAgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0LFxuICBNb25lcm9PdXRwdXRXYWxsZXQsXG4gIE1vbmVyb091dHB1dFF1ZXJ5LFxuICBNb25lcm9UeFByaW9yaXR5LFxuICBNb25lcm9UeENvbmZpZyxcbiAgTW9uZXJvU3ViYWRkcmVzcyxcbiAgTW9uZXJvU3luY1Jlc3VsdCxcbiAgTW9uZXJvVHJhbnNmZXIsXG4gIE1vbmVyb0luY29taW5nVHJhbnNmZXIsXG4gIE1vbmVyb091dGdvaW5nVHJhbnNmZXIsXG4gIE1vbmVyb1RyYW5zZmVyUXVlcnksXG4gIE1vbmVyb1R4U2V0LFxuICBNb25lcm9UeFdhbGxldCxcbiAgTW9uZXJvVHhRdWVyeSxcbiAgTW9uZXJvV2FsbGV0TGlzdGVuZXIsXG4gIE1vbmVyb1dhbGxldENvbmZpZyxcbiAgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUsXG4gIE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQsXG4gIE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIsXG4gIE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyLFxuICBNb25lcm9EYWVtb24sXG4gIE1vbmVyb1dhbGxldCxcbiAgTW9uZXJvRGFlbW9uUnBjLFxuICBNb25lcm9XYWxsZXRScGMsXG4gIE1vbmVyb1dhbGxldEtleXMsXG4gIE1vbmVyb1dhbGxldEZ1bGwsXG4gIE1vbmVyb1V0aWxzLFxuICBUaHJlYWRQb29sLFxuXG4gIC8vIGdsb2JhbCBmdW5jdGlvbnNcbiAgZ2V0VmVyc2lvbixcbiAgY29ubmVjdFRvRGFlbW9uUnBjLFxuICBjb25uZWN0VG9XYWxsZXRScGMsXG4gIGNyZWF0ZVdhbGxldEZ1bGwsXG4gIG9wZW5XYWxsZXRGdWxsLFxuICBjcmVhdGVXYWxsZXRLZXlzXG59XG5leHBvcnQgZGVmYXVsdCBtb25lcm9UcztcblxuLy8gYXVnbWVudCBnbG9iYWwgc2NvcGUgd2l0aCBzYW1lIG5hbWVzcGFjZSBhcyBkZWZhdWx0IGV4cG9ydFxuZGVjbGFyZSBnbG9iYWwge1xuICBuYW1lc3BhY2UgbW9uZXJvVHMge1xuICAgIHR5cGUgR2VuVXRpbHMgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuR2VuVXRpbHM+O1xuICAgIHR5cGUgRmlsdGVyID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLkZpbHRlcj47XG4gICAgdHlwZSBNb25lcm9FcnJvciA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9FcnJvcj47XG4gICAgdHlwZSBIdHRwQ2xpZW50ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLkh0dHBDbGllbnQ+O1xuICAgIHR5cGUgTGlicmFyeVV0aWxzID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLkxpYnJhcnlVdGlscz47XG4gICAgdHlwZSBNb25lcm9ScGNDb25uZWN0aW9uID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1JwY0Nvbm5lY3Rpb24+O1xuICAgIHR5cGUgTW9uZXJvUnBjRXJyb3IgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvUnBjRXJyb3I+O1xuICAgIHR5cGUgU3NsT3B0aW9ucyA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Tc2xPcHRpb25zPjtcbiAgICB0eXBlIFRhc2tMb29wZXIgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuVGFza0xvb3Blcj47XG4gICAgdHlwZSBDb25uZWN0aW9uVHlwZSA9IGltcG9ydChcIi4vaW5kZXhcIikuQ29ubmVjdGlvblR5cGU7IC8vIHR5cGUgYWxpYXMgZm9yIGVudW1cbiAgICB0eXBlIE1vbmVyb0FsdENoYWluID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0FsdENoYWluPjtcbiAgICB0eXBlIE1vbmVyb0JhbiA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9CYW4+O1xuICAgIHR5cGUgTW9uZXJvQmxvY2tIZWFkZXIgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvQmxvY2tIZWFkZXI+O1xuICAgIHR5cGUgTW9uZXJvQmxvY2sgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvQmxvY2s+O1xuICAgIHR5cGUgTW9uZXJvQmxvY2tUZW1wbGF0ZSA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9CbG9ja1RlbXBsYXRlPjtcbiAgICB0eXBlIE1vbmVyb0Nvbm5lY3Rpb25TcGFuID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0Nvbm5lY3Rpb25TcGFuPjtcbiAgICB0eXBlIE1vbmVyb0RhZW1vbkNvbmZpZyA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9EYWVtb25Db25maWc+O1xuICAgIHR5cGUgTW9uZXJvRGFlbW9uSW5mbyA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9EYWVtb25JbmZvPjtcbiAgICB0eXBlIE1vbmVyb0RhZW1vbkxpc3RlbmVyID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0RhZW1vbkxpc3RlbmVyPjtcbiAgICB0eXBlIE1vbmVyb0RhZW1vblN5bmNJbmZvID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0RhZW1vblN5bmNJbmZvPjtcbiAgICB0eXBlIE1vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0PjtcbiAgICB0eXBlIE1vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0PjtcbiAgICB0eXBlIE1vbmVyb0ZlZUVzdGltYXRlID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0ZlZUVzdGltYXRlPjtcbiAgICB0eXBlIE1vbmVyb0hhcmRGb3JrSW5mbyA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9IYXJkRm9ya0luZm8+O1xuICAgIHR5cGUgTW9uZXJvS2V5SW1hZ2UgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvS2V5SW1hZ2U+O1xuICAgIHR5cGUgTW9uZXJvS2V5SW1hZ2VTcGVudFN0YXR1cyA9IGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvS2V5SW1hZ2VTcGVudFN0YXR1cztcbiAgICB0eXBlIE1vbmVyb01pbmVyVHhTdW0gPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvTWluZXJUeFN1bT47XG4gICAgdHlwZSBNb25lcm9NaW5pbmdTdGF0dXMgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvTWluaW5nU3RhdHVzPjtcbiAgICB0eXBlIE1vbmVyb05ldHdvcmtUeXBlID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb05ldHdvcmtUeXBlPjtcbiAgICB0eXBlIE1vbmVyb091dHB1dCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9PdXRwdXQ+O1xuICAgIHR5cGUgTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnk+O1xuICAgIHR5cGUgTW9uZXJvU3VibWl0VHhSZXN1bHQgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvU3VibWl0VHhSZXN1bHQ+O1xuICAgIHR5cGUgTW9uZXJvVHggPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvVHg+O1xuICAgIHR5cGUgTW9uZXJvVHhQb29sU3RhdHMgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvVHhQb29sU3RhdHM+O1xuICAgIHR5cGUgTW9uZXJvVmVyc2lvbiA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9WZXJzaW9uPjtcbiAgICB0eXBlIE1vbmVyb1BlZXIgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvUGVlcj47XG4gICAgdHlwZSBNb25lcm9QcnVuZVJlc3VsdCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9QcnVuZVJlc3VsdD47XG4gICAgdHlwZSBNb25lcm9BY2NvdW50ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0FjY291bnQ+O1xuICAgIHR5cGUgTW9uZXJvQWNjb3VudFRhZyA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9BY2NvdW50VGFnPjtcbiAgICB0eXBlIE1vbmVyb0FkZHJlc3NCb29rRW50cnkgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeT47XG4gICAgdHlwZSBNb25lcm9DaGVjayA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9DaGVjaz47XG4gICAgdHlwZSBNb25lcm9DaGVja1Jlc2VydmUgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvQ2hlY2tSZXNlcnZlPjtcbiAgICB0eXBlIE1vbmVyb0NoZWNrVHggPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvQ2hlY2tUeD47XG4gICAgdHlwZSBNb25lcm9EZXN0aW5hdGlvbiA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9EZXN0aW5hdGlvbj47XG4gICAgdHlwZSBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz47XG4gICAgdHlwZSBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdD47XG4gICAgdHlwZSBNb25lcm9NdWx0aXNpZ0luZm8gPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvTXVsdGlzaWdJbmZvPjtcbiAgICB0eXBlIE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQ+O1xuICAgIHR5cGUgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb011bHRpc2lnU2lnblJlc3VsdD47XG4gICAgdHlwZSBNb25lcm9PdXRwdXRXYWxsZXQgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvT3V0cHV0V2FsbGV0PjtcbiAgICB0eXBlIE1vbmVyb091dHB1dFF1ZXJ5ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb091dHB1dFF1ZXJ5PjtcbiAgICB0eXBlIE1vbmVyb1R4UHJpb3JpdHkgPSBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1R4UHJpb3JpdHk7XG4gICAgdHlwZSBNb25lcm9UeENvbmZpZyA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9UeENvbmZpZz47XG4gICAgdHlwZSBNb25lcm9TdWJhZGRyZXNzID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1N1YmFkZHJlc3M+O1xuICAgIHR5cGUgTW9uZXJvU3luY1Jlc3VsdCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9TeW5jUmVzdWx0PjtcbiAgICB0eXBlIE1vbmVyb1RyYW5zZmVyID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1RyYW5zZmVyPjtcbiAgICB0eXBlIE1vbmVyb0luY29taW5nVHJhbnNmZXIgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvSW5jb21pbmdUcmFuc2Zlcj47XG4gICAgdHlwZSBNb25lcm9PdXRnb2luZ1RyYW5zZmVyID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb091dGdvaW5nVHJhbnNmZXI+O1xuICAgIHR5cGUgTW9uZXJvVHJhbnNmZXJRdWVyeSA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9UcmFuc2ZlclF1ZXJ5PjtcbiAgICB0eXBlIE1vbmVyb1R4U2V0ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1R4U2V0PjtcbiAgICB0eXBlIE1vbmVyb1R4V2FsbGV0ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1R4V2FsbGV0PjtcbiAgICB0eXBlIE1vbmVyb1R4UXVlcnkgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvVHhRdWVyeT47XG4gICAgdHlwZSBNb25lcm9XYWxsZXRMaXN0ZW5lciA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9XYWxsZXRMaXN0ZW5lcj47XG4gICAgdHlwZSBNb25lcm9XYWxsZXRDb25maWcgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvV2FsbGV0Q29uZmlnPjtcbiAgICB0eXBlIE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlID0gaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZTtcbiAgICB0eXBlIE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdD47XG4gICAgdHlwZSBNb25lcm9Db25uZWN0aW9uTWFuYWdlckxpc3RlbmVyID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXI+O1xuICAgIHR5cGUgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXI+O1xuICAgIHR5cGUgTW9uZXJvRGFlbW9uID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0RhZW1vbj47XG4gICAgdHlwZSBNb25lcm9XYWxsZXQgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvV2FsbGV0PjtcbiAgICB0eXBlIE1vbmVyb0RhZW1vblJwYyA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9EYWVtb25ScGM+O1xuICAgIHR5cGUgTW9uZXJvV2FsbGV0UnBjID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1dhbGxldFJwYz47XG4gICAgdHlwZSBNb25lcm9XYWxsZXRLZXlzID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1dhbGxldEtleXM+O1xuICAgIHR5cGUgTW9uZXJvV2FsbGV0RnVsbCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9XYWxsZXRGdWxsPjtcbiAgICB0eXBlIE1vbmVyb1V0aWxzID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1V0aWxzPjtcbiAgICB0eXBlIFRocmVhZFBvb2wgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuVGhyZWFkUG9vbD47XG4gIH1cbn0iXSwibWFwcGluZ3MiOiJBQUFBLFlBQVk7O0FBRVo7O0FBRUE7O0FBRUE7QUFBQSxJQUFBQSxzQkFBQSxHQUFBQyxPQUFBLGlEQUFBQyxNQUFBLENBQUFDLGNBQUEsQ0FBQUMsT0FBQSxrQkFBQUMsS0FBQSxVQUFBSCxNQUFBLENBQUFDLGNBQUEsQ0FBQUMsT0FBQSxzQkFBQUUsVUFBQSxRQUFBQyxHQUFBLFdBQUFBLENBQUEsVUFBQUMsZUFBQSxDQUFBQyxPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLGNBQUFFLFVBQUEsUUFBQUMsR0FBQSxXQUFBQSxDQUFBLFVBQUFHLE9BQUEsQ0FBQUQsT0FBQSxNQUFBUCxNQUFBLENBQUFDLGNBQUEsQ0FBQUMsT0FBQSxnQkFBQUUsVUFBQSxRQUFBQyxHQUFBLFdB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