'use strict';

// --------------------------------- IMPORTS ----------------------------------

// See the full model specification: https://woodser.github.io/monero-java/monero-spec.pdf

// import common models
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });Object.defineProperty(exports, "ConnectionType", { enumerable: true, get: function () {return _ConnectionType.default;} });Object.defineProperty(exports, "Filter", { enumerable: true, get: function () {return _Filter.default;} });Object.defineProperty(exports, "GenUtils", { enumerable: true, get: function () {return _GenUtils.default;} });Object.defineProperty(exports, "HttpClient", { enumerable: true, get: function () {return _HttpClient.default;} });Object.defineProperty(exports, "LibraryUtils", { enumerable: true, get: function () {return _LibraryUtils.default;} });Object.defineProperty(exports, "MoneroAccount", { enumerable: true, get: function () {return _MoneroAccount.default;} });Object.defineProperty(exports, "MoneroAccountTag", { enumerable: true, get: function () {return _MoneroAccountTag.default;} });Object.defineProperty(exports, "MoneroAddressBookEntry", { enumerable: true, get: function () {return _MoneroAddressBookEntry.default;} });Object.defineProperty(exports, "MoneroAltChain", { enumerable: true, get: function () {return _MoneroAltChain.default;} });Object.defineProperty(exports, "MoneroBan", { enumerable: true, get: function () {return _MoneroBan.default;} });Object.defineProperty(exports, "MoneroBlock", { enumerable: true, get: function () {return _MoneroBlock.default;} });Object.defineProperty(exports, "MoneroBlockHeader", { enumerable: true, get: function () {return _MoneroBlockHeader.default;} });Object.defineProperty(exports, "MoneroBlockTemplate", { enumerable: true, get: function () {return _MoneroBlockTemplate.default;} });Object.defineProperty(exports, "MoneroCheck", { enumerable: true, get: function () {return _MoneroCheck.default;} });Object.defineProperty(exports, "MoneroCheckReserve", { enumerable: true, get: function () {return _MoneroCheckReserve.default;} });Object.defineProperty(exports, "MoneroCheckTx", { enumerable: true, get: function () {return _MoneroCheckTx.default;} });Object.defineProperty(exports, "MoneroConnectionManager", { enumerable: true, get: function () {return _MoneroConnectionManager.default;} });Object.defineProperty(exports, "MoneroConnectionManagerListener", { enumerable: true, get: function () {return _MoneroConnectionManagerListener.default;} });Object.defineProperty(exports, "MoneroConnectionSpan", { enumerable: true, get: function () {return _MoneroConnectionSpan.default;} });Object.defineProperty(exports, "MoneroDaemon", { enumerable: true, get: function () {return _MoneroDaemon.default;} });Object.defineProperty(exports, "MoneroDaemonConfig", { enumerable: true, get: function () {return _MoneroDaemonConfig.default;} });Object.defineProperty(exports, "MoneroDaemonInfo", { enumerable: true, get: function () {return _MoneroDaemonInfo.default;} });Object.defineProperty(exports, "MoneroDaemonListener", { enumerable: true, get: function () {return _MoneroDaemonListener.default;} });Object.defineProperty(exports, "MoneroDaemonRpc", { enumerable: true, get: function () {return _MoneroDaemonRpc.default;} });Object.defineProperty(exports, "MoneroDaemonSyncInfo", { enumerable: true, get: function () {return _MoneroDaemonSyncInfo.default;} });Object.defineProperty(exports, "MoneroDaemonUpdateCheckResult", { enumerable: true, get: function () {return _MoneroDaemonUpdateCheckResult.default;} });Object.defineProperty(exports, "MoneroDaemonUpdateDownloadResult", { enumerable: true, get: function () {return _MoneroDaemonUpdateDownloadResult.default;} });Object.defineProperty(exports, "MoneroDestination", { enumerable: true, get: function () {return _MoneroDestination.default;} });Object.defineProperty(exports, "MoneroError", { enumerable: true, get: function () {return _MoneroError.default;} });Object.defineProperty(exports, "MoneroFeeEstimate", { enumerable: true, get: function () {return _MoneroFeeEstimate.default;} });Object.defineProperty(exports, "MoneroHardForkInfo", { enumerable: true, get: function () {return _MoneroHardForkInfo.default;} });Object.defineProperty(exports, "MoneroIncomingTransfer", { enumerable: true, get: function () {return _MoneroIncomingTransfer.default;} });Object.defineProperty(exports, "MoneroIntegratedAddress", { enumerable: true, get: function () {return _MoneroIntegratedAddress.default;} });Object.defineProperty(exports, "MoneroKeyImage", { enumerable: true, get: function () {return _MoneroKeyImage.default;} });Object.defineProperty(exports, "MoneroKeyImageExportResult", { enumerable: true, get: function () {return _MoneroKeyImageExportResult.default;} });Object.defineProperty(exports, "MoneroKeyImageImportResult", { enumerable: true, get: function () {return _MoneroKeyImageImportResult.default;} });Object.defineProperty(exports, "MoneroKeyImageSpentStatus", { enumerable: true, get: function () {return _MoneroKeyImageSpentStatus.default;} });Object.defineProperty(exports, "MoneroMessageSignatureResult", { enumerable: true, get: function () {return _MoneroMessageSignatureResult.default;} });Object.defineProperty(exports, "MoneroMessageSignatureType", { enumerable: true, get: function () {return _MoneroMessageSignatureType.default;} });Object.defineProperty(exports, "MoneroMinerTxSum", { enumerable: true, get: function () {return _MoneroMinerTxSum.default;} });Object.defineProperty(exports, "MoneroMiningStatus", { enumerable: true, get: function () {return _MoneroMiningStatus.default;} });Object.defineProperty(exports, "MoneroMultisigInfo", { enumerable: true, get: function () {return _MoneroMultisigInfo.default;} });Object.defineProperty(exports, "MoneroMultisigInitResult", { enumerable: true, get: function () {return _MoneroMultisigInitResult.default;} });Object.defineProperty(exports, "MoneroMultisigSignResult", { enumerable: true, get: function () {return _MoneroMultisigSignResult.default;} });Object.defineProperty(exports, "MoneroNetworkType", { enumerable: true, get: function () {return _MoneroNetworkType.default;} });Object.defineProperty(exports, "MoneroOutgoingTransfer", { enumerable: true, get: function () {return _MoneroOutgoingTransfer.default;} });Object.defineProperty(exports, "MoneroOutput", { enumerable: true, get: function () {return _MoneroOutput.default;} });Object.defineProperty(exports, "MoneroOutputHistogramEntry", { enumerable: true, get: function () {return _MoneroOutputHistogramEntry.default;} });Object.defineProperty(exports, "MoneroOutputQuery", { enumerable: true, get: function () {return _MoneroOutputQuery.default;} });Object.defineProperty(exports, "MoneroOutputWallet", { enumerable: true, get: function () {return _MoneroOutputWallet.default;} });Object.defineProperty(exports, "MoneroPeer", { enumerable: true, get: function () {return _MoneroPeer.default;} });Object.defineProperty(exports, "MoneroPruneResult", { enumerable: true, get: function () {return _MoneroPruneResult.default;} });Object.defineProperty(exports, "MoneroRpcConnection", { enumerable: true, get: function () {return _MoneroRpcConnection.default;} });Object.defineProperty(exports, "MoneroRpcError", { enumerable: true, get: function () {return _MoneroRpcError.default;} });Object.defineProperty(exports, "MoneroSubaddress", { enumerable: true, get: function () {return _MoneroSubaddress.default;} });Object.defineProperty(exports, "MoneroSubmitTxResult", { enumerable: true, get: function () {return _MoneroSubmitTxResult.default;} });Object.defineProperty(exports, "MoneroSyncResult", { enumerable: true, get: function () {return _MoneroSyncResult.default;} });Object.defineProperty(exports, "MoneroTransfer", { enumerable: true, get: function () {return _MoneroTransfer.default;} });Object.defineProperty(exports, "MoneroTransferQuery", { enumerable: true, get: function () {return _MoneroTransferQuery.default;} });Object.defineProperty(exports, "MoneroTx", { enumerable: true, get: function () {return _MoneroTx.default;} });Object.defineProperty(exports, "MoneroTxConfig", { enumerable: true, get: function () {return _MoneroTxConfig.default;} });Object.defineProperty(exports, "MoneroTxPoolStats", { enumerable: true, get: function () {return _MoneroTxPoolStats.default;} });Object.defineProperty(exports, "MoneroTxPriority", { enumerable: true, get: function () {return _MoneroTxPriority.default;} });Object.defineProperty(exports, "MoneroTxQuery", { enumerable: true, get: function () {return _MoneroTxQuery.default;} });Object.defineProperty(exports, "MoneroTxSet", { enumerable: true, get: function () {return _MoneroTxSet.default;} });Object.defineProperty(exports, "MoneroTxWallet", { enumerable: true, get: function () {return _MoneroTxWallet.default;} });Object.defineProperty(exports, "MoneroUtils", { enumerable: true, get: function () {return _MoneroUtils.default;} });Object.defineProperty(exports, "MoneroVersion", { enumerable: true, get: function () {return _MoneroVersion.default;} });Object.defineProperty(exports, "MoneroWallet", { enumerable: true, get: function () {return _MoneroWallet.default;} });Object.defineProperty(exports, "MoneroWalletConfig", { enumerable: true, get: function () {return _MoneroWalletConfig.default;} });Object.defineProperty(exports, "MoneroWalletFull", { enumerable: true, get: function () {return _MoneroWalletFull.default;} });Object.defineProperty(exports, "MoneroWalletKeys", { enumerable: true, get: function () {return _MoneroWalletKeys.MoneroWalletKeys;} });Object.defineProperty(exports, "MoneroWalletListener", { enumerable: true, get: function () {return _MoneroWalletListener.default;} });Object.defineProperty(exports, "MoneroWalletRpc", { enumerable: true, get: function () {return _MoneroWalletRpc.default;} });Object.defineProperty(exports, "SslOptions", { enumerable: true, get: function () {return _SslOptions.default;} });Object.defineProperty(exports, "TaskLooper", { enumerable: true, get: function () {return _TaskLooper.default;} });Object.defineProperty(exports, "ThreadPool", { enumerable: true, get: function () {return _ThreadPool.default;} });exports.connectToDaemonRpc = connectToDaemonRpc;exports.connectToWalletRpc = connectToWalletRpc;exports.createWalletFull = createWalletFull;exports.createWalletKeys = createWalletKeys;exports.default = void 0;exports.getVersion = getVersion;exports.openWalletFull = openWalletFull;exports.shutdown = shutdown;var _GenUtils = _interopRequireDefault(require("./src/main/ts/common/GenUtils"));
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
var _MoneroKeyImageExportResult = _interopRequireDefault(require("./src/main/ts/wallet/model/MoneroKeyImageExportResult"));
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
 * &nbsp;&nbsp; path: "./wallets/wallet1", // leave blank for in-memory wallet<br>
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
 * &nbsp;&nbsp; path: "./wallets/wallet1", // leave blank for in-memory wallet<br>
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
 * @param {any} [config.fs] - file system compatible with Node.js `fs.promises` API (defaults to disk or in-memory FS if browser)
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
 * @param {any} [config.fs] - file system compatible with Node.js `fs.promises` API (defaults to disk or in-memory FS if browser)
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

/**
 * <p>Shut down the monero-ts library, terminating any running workers.</p>
 *
 * @return {Promise<void>} promise that resolves when the library has shut down
 */
function shutdown() {
  return _LibraryUtils.default.terminateWorker();
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
  MoneroKeyImageExportResult: _MoneroKeyImageExportResult.default,
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
  createWalletKeys,
  shutdown
};var _default = exports.default =
moneroTs;

// augment global scope with same namespace as default export
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIk9iamVjdCIsImRlZmluZVByb3BlcnR5IiwiZXhwb3J0cyIsInZhbHVlIiwiZW51bWVyYWJsZSIsImdldCIsIl9Db25uZWN0aW9uVHlwZSIsImRlZmF1bHQiLCJfRmlsdGVyIiwiX0dlblV0aWxzIiwiX0h0dHBDbGllbnQiLCJfTGlicmFyeVV0aWxzIiwiX01vbmVyb0FjY291bnQiLCJfTW9uZXJvQWNjb3VudFRhZyIsIl9Nb25lcm9BZGRyZXNzQm9va0VudHJ5IiwiX01vbmVyb0FsdENoYWluIiwiX01vbmVyb0JhbiIsIl9Nb25lcm9CbG9jayIsIl9Nb25lcm9CbG9ja0hlYWRlciIsIl9Nb25lcm9CbG9ja1RlbXBsYXRlIiwiX01vbmVyb0NoZWNrIiwiX01vbmVyb0NoZWNrUmVzZXJ2ZSIsIl9Nb25lcm9DaGVja1R4IiwiX01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyIiwiX01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIiLCJfTW9uZXJvQ29ubmVjdGlvblNwYW4iLCJfTW9uZXJvRGFlbW9uIiwiX01vbmVyb0RhZW1vbkNvbmZpZyIsIl9Nb25lcm9EYWVtb25JbmZvIiwiX01vbmVyb0RhZW1vbkxpc3RlbmVyIiwiX01vbmVyb0RhZW1vblJwYyIsIl9Nb25lcm9EYWVtb25TeW5jSW5mbyIsIl9Nb25lcm9EYWVtb25VcGRhdGVDaGVja1Jlc3VsdCIsIl9Nb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdCIsIl9Nb25lcm9EZXN0aW5hdGlvbiIsIl9Nb25lcm9FcnJvciIsIl9Nb25lcm9GZWVFc3RpbWF0ZSIsIl9Nb25lcm9IYXJkRm9ya0luZm8iLCJfTW9uZXJvSW5jb21pbmdUcmFuc2ZlciIsIl9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsIl9Nb25lcm9LZXlJbWFnZSIsIl9Nb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdCIsIl9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCIsIl9Nb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQiLCJfTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUiLCJfTW9uZXJvTWluZXJUeFN1bSIsIl9Nb25lcm9NaW5pbmdTdGF0dXMiLCJfTW9uZXJvTXVsdGlzaWdJbmZvIiwiX01vbmVyb011bHRpc2lnSW5pdFJlc3VsdCIsIl9Nb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQiLCJfTW9uZXJvTmV0d29ya1R5cGUiLCJfTW9uZXJvT3V0Z29pbmdUcmFuc2ZlciIsIl9Nb25lcm9PdXRwdXQiLCJfTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkiLCJfTW9uZXJvT3V0cHV0UXVlcnkiLCJfTW9uZXJvT3V0cHV0V2FsbGV0IiwiX01vbmVyb1BlZXIiLCJfTW9uZXJvUHJ1bmVSZXN1bHQiLCJfTW9uZXJvUnBjQ29ubmVjdGlvbiIsIl9Nb25lcm9ScGNFcnJvciIsIl9Nb25lcm9TdWJhZGRyZXNzIiwiX01vbmVyb1N1Ym1pdFR4UmVzdWx0IiwiX01vbmVyb1N5bmNSZXN1bHQiLCJfTW9uZXJvVHJhbnNmZXIiLCJfTW9uZXJvVHJhbnNmZXJRdWVyeSIsIl9Nb25lcm9UeCIsIl9Nb25lcm9UeENvbmZpZyIsIl9Nb25lcm9UeFBvb2xTdGF0cyIsIl9Nb25lcm9UeFByaW9yaXR5IiwiX01vbmVyb1R4UXVlcnkiLCJfTW9uZXJvVHhTZXQiLCJfTW9uZXJvVHhXYWxsZXQiLCJfTW9uZXJvVXRpbHMiLCJfTW9uZXJvVmVyc2lvbiIsIl9Nb25lcm9XYWxsZXQiLCJfTW9uZXJvV2FsbGV0Q29uZmlnIiwiX01vbmVyb1dhbGxldEZ1bGwiLCJfTW9uZXJvV2FsbGV0S2V5cyIsIk1vbmVyb1dhbGxldEtleXMiLCJfTW9uZXJvV2FsbGV0TGlzdGVuZXIiLCJfTW9uZXJvV2FsbGV0UnBjIiwiX1NzbE9wdGlvbnMiLCJfVGFza0xvb3BlciIsIl9UaHJlYWRQb29sIiwiY29ubmVjdFRvRGFlbW9uUnBjIiwiY29ubmVjdFRvV2FsbGV0UnBjIiwiY3JlYXRlV2FsbGV0RnVsbCIsImNyZWF0ZVdhbGxldEtleXMiLCJnZXRWZXJzaW9uIiwib3BlbldhbGxldEZ1bGwiLCJzaHV0ZG93biIsIk1vbmVyb1V0aWxzIiwidXJpT3JDb25maWciLCJ1c2VybmFtZSIsInBhc3N3b3JkIiwiTW9uZXJvRGFlbW9uUnBjIiwiTW9uZXJvV2FsbGV0UnBjIiwiY29uZmlnIiwiTW9uZXJvV2FsbGV0RnVsbCIsImNyZWF0ZVdhbGxldCIsIk1vbmVyb1dhbGxldENvbmZpZyIsIm9wZW5XYWxsZXQiLCJMaWJyYXJ5VXRpbHMiLCJ0ZXJtaW5hdGVXb3JrZXIiLCJtb25lcm9UcyIsIkdlblV0aWxzIiwiRmlsdGVyIiwiTW9uZXJvRXJyb3IiLCJIdHRwQ2xpZW50IiwiTW9uZXJvUnBjQ29ubmVjdGlvbiIsIk1vbmVyb1JwY0Vycm9yIiwiU3NsT3B0aW9ucyIsIlRhc2tMb29wZXIiLCJDb25uZWN0aW9uVHlwZSIsIk1vbmVyb0FsdENoYWluIiwiTW9uZXJvQmFuIiwiTW9uZXJvQmxvY2tIZWFkZXIiLCJNb25lcm9CbG9jayIsIk1vbmVyb0Jsb2NrVGVtcGxhdGUiLCJNb25lcm9Db25uZWN0aW9uU3BhbiIsIk1vbmVyb0RhZW1vbkNvbmZpZyIsIk1vbmVyb0RhZW1vbkluZm8iLCJNb25lcm9EYWVtb25MaXN0ZW5lciIsIk1vbmVyb0RhZW1vblN5bmNJbmZvIiwiTW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQiLCJNb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdCIsIk1vbmVyb0ZlZUVzdGltYXRlIiwiTW9uZXJvSGFyZEZvcmtJbmZvIiwiTW9uZXJvS2V5SW1hZ2UiLCJNb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzIiwiTW9uZXJvTWluZXJUeFN1bSIsIk1vbmVyb01pbmluZ1N0YXR1cyIsIk1vbmVyb05ldHdvcmtUeXBlIiwiTW9uZXJvT3V0cHV0IiwiTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkiLCJNb25lcm9TdWJtaXRUeFJlc3VsdCIsIk1vbmVyb1R4IiwiTW9uZXJvVHhQb29sU3RhdHMiLCJNb25lcm9WZXJzaW9uIiwiTW9uZXJvUGVlciIsIk1vbmVyb1BydW5lUmVzdWx0IiwiTW9uZXJvQWNjb3VudCIsIk1vbmVyb0FjY291bnRUYWciLCJNb25lcm9BZGRyZXNzQm9va0VudHJ5IiwiTW9uZXJvQ2hlY2siLCJNb25lcm9DaGVja1Jlc2VydmUiLCJNb25lcm9DaGVja1R4IiwiTW9uZXJvRGVzdGluYXRpb24iLCJNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsIk1vbmVyb0tleUltYWdlRXhwb3J0UmVzdWx0IiwiTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQiLCJNb25lcm9NdWx0aXNpZ0luZm8iLCJNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQiLCJNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQiLCJNb25lcm9PdXRwdXRXYWxsZXQiLCJNb25lcm9PdXRwdXRRdWVyeSIsIk1vbmVyb1R4UHJpb3JpdHkiLCJNb25lcm9UeENvbmZpZyIsIk1vbmVyb1N1YmFkZHJlc3MiLCJNb25lcm9TeW5jUmVzdWx0IiwiTW9uZXJvVHJhbnNmZXIiLCJNb25lcm9JbmNvbWluZ1RyYW5zZmVyIiwiTW9uZXJvT3V0Z29pbmdUcmFuc2ZlciIsIk1vbmVyb1RyYW5zZmVyUXVlcnkiLCJNb25lcm9UeFNldCIsIk1vbmVyb1R4V2FsbGV0IiwiTW9uZXJvVHhRdWVyeSIsIk1vbmVyb1dhbGxldExpc3RlbmVyIiwiTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUiLCJNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0IiwiTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lciIsIk1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyIiwiTW9uZXJvRGFlbW9uIiwiTW9uZXJvV2FsbGV0IiwiVGhyZWFkUG9vbCIsIl9kZWZhdWx0Il0sInNvdXJjZXMiOlsiLi4vaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBJTVBPUlRTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLy8gU2VlIHRoZSBmdWxsIG1vZGVsIHNwZWNpZmljYXRpb246IGh0dHBzOi8vd29vZHNlci5naXRodWIuaW8vbW9uZXJvLWphdmEvbW9uZXJvLXNwZWMucGRmXG5cbi8vIGltcG9ydCBjb21tb24gbW9kZWxzXG5pbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4vc3JjL21haW4vdHMvY29tbW9uL0dlblV0aWxzXCI7XG5pbXBvcnQgRmlsdGVyIGZyb20gXCIuL3NyYy9tYWluL3RzL2NvbW1vbi9GaWx0ZXJcIjtcbmltcG9ydCBNb25lcm9FcnJvciBmcm9tIFwiLi9zcmMvbWFpbi90cy9jb21tb24vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBIdHRwQ2xpZW50IGZyb20gXCIuL3NyYy9tYWluL3RzL2NvbW1vbi9IdHRwQ2xpZW50XCI7XG5pbXBvcnQgTGlicmFyeVV0aWxzIGZyb20gXCIuL3NyYy9tYWluL3RzL2NvbW1vbi9MaWJyYXJ5VXRpbHNcIjtcbmltcG9ydCBNb25lcm9ScGNDb25uZWN0aW9uIGZyb20gXCIuL3NyYy9tYWluL3RzL2NvbW1vbi9Nb25lcm9ScGNDb25uZWN0aW9uXCI7XG5pbXBvcnQgTW9uZXJvUnBjRXJyb3IgZnJvbSBcIi4vc3JjL21haW4vdHMvY29tbW9uL01vbmVyb1JwY0Vycm9yXCI7XG5pbXBvcnQgU3NsT3B0aW9ucyBmcm9tIFwiLi9zcmMvbWFpbi90cy9jb21tb24vU3NsT3B0aW9uc1wiO1xuaW1wb3J0IFRhc2tMb29wZXIgZnJvbSBcIi4vc3JjL21haW4vdHMvY29tbW9uL1Rhc2tMb29wZXJcIjtcblxuLy8gaW1wb3J0IGRhZW1vbiBtb2RlbHNcbmltcG9ydCBDb25uZWN0aW9uVHlwZSBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvQ29ubmVjdGlvblR5cGVcIjtcbmltcG9ydCBNb25lcm9BbHRDaGFpbiBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvQWx0Q2hhaW5cIjtcbmltcG9ydCBNb25lcm9CYW4gZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb0JhblwiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrSGVhZGVyIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9CbG9ja0hlYWRlclwiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9CbG9ja1wiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrVGVtcGxhdGUgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb0Jsb2NrVGVtcGxhdGVcIjtcbmltcG9ydCBNb25lcm9Db25uZWN0aW9uU3BhbiBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvQ29ubmVjdGlvblNwYW5cIjtcbmltcG9ydCBNb25lcm9EYWVtb25Db25maWcgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb0RhZW1vbkNvbmZpZ1wiO1xuaW1wb3J0IE1vbmVyb0RhZW1vbkluZm8gZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb0RhZW1vbkluZm9cIjtcbmltcG9ydCBNb25lcm9EYWVtb25MaXN0ZW5lciBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvRGFlbW9uTGlzdGVuZXJcIjtcbmltcG9ydCBNb25lcm9EYWVtb25TeW5jSW5mbyBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvRGFlbW9uU3luY0luZm9cIjtcbmltcG9ydCBNb25lcm9EYWVtb25VcGRhdGVDaGVja1Jlc3VsdCBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdCBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9GZWVFc3RpbWF0ZSBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvRmVlRXN0aW1hdGVcIjtcbmltcG9ydCBNb25lcm9IYXJkRm9ya0luZm8gZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb0hhcmRGb3JrSW5mb1wiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9LZXlJbWFnZVwiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlU3BlbnRTdGF0dXMgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb0tleUltYWdlU3BlbnRTdGF0dXNcIjtcbmltcG9ydCBNb25lcm9NaW5lclR4U3VtIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9NaW5lclR4U3VtXCI7XG5pbXBvcnQgTW9uZXJvTWluaW5nU3RhdHVzIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9NaW5pbmdTdGF0dXNcIjtcbmltcG9ydCBNb25lcm9OZXR3b3JrVHlwZSBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvTmV0d29ya1R5cGVcIjtcbmltcG9ydCBNb25lcm9PdXRwdXQgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb091dHB1dFwiO1xuaW1wb3J0IE1vbmVyb091dHB1dEhpc3RvZ3JhbUVudHJ5IGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeVwiO1xuaW1wb3J0IE1vbmVyb1N1Ym1pdFR4UmVzdWx0IGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9TdWJtaXRUeFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb1R4IGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9UeFwiO1xuaW1wb3J0IE1vbmVyb1R4UG9vbFN0YXRzIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9UeFBvb2xTdGF0c1wiO1xuaW1wb3J0IE1vbmVyb1ZlcnNpb24gZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb1ZlcnNpb25cIjtcbmltcG9ydCBNb25lcm9QZWVyIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9QZWVyXCI7XG5pbXBvcnQgTW9uZXJvUHJ1bmVSZXN1bHQgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb1BydW5lUmVzdWx0XCI7XG5cbi8vIGltcG9ydCB3YWxsZXQgbW9kZWxzXG5pbXBvcnQgTW9uZXJvQWNjb3VudCBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvQWNjb3VudFwiO1xuaW1wb3J0IE1vbmVyb0FjY291bnRUYWcgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb0FjY291bnRUYWdcIjtcbmltcG9ydCBNb25lcm9BZGRyZXNzQm9va0VudHJ5IGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9BZGRyZXNzQm9va0VudHJ5XCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2sgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb0NoZWNrXCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2tSZXNlcnZlIGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9DaGVja1Jlc2VydmVcIjtcbmltcG9ydCBNb25lcm9DaGVja1R4IGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9DaGVja1R4XCI7XG5pbXBvcnQgTW9uZXJvRGVzdGluYXRpb24gZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb0Rlc3RpbmF0aW9uXCI7XG5pbXBvcnQgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb0ludGVncmF0ZWRBZGRyZXNzXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHQgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb0tleUltYWdlRXhwb3J0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdJbmZvIGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9NdWx0aXNpZ0luZm9cIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb011bHRpc2lnSW5pdFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnU2lnblJlc3VsdCBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0V2FsbGV0IGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9PdXRwdXRXYWxsZXRcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRRdWVyeSBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvT3V0cHV0UXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeFByaW9yaXR5IGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9UeFByaW9yaXR5XCI7XG5pbXBvcnQgTW9uZXJvVHhDb25maWcgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb1R4Q29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvU3ViYWRkcmVzcyBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvU3ViYWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb1N5bmNSZXN1bHQgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb1N5bmNSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9UcmFuc2ZlciBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9JbmNvbWluZ1RyYW5zZmVyIGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9JbmNvbWluZ1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlciBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvT3V0Z29pbmdUcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb1RyYW5zZmVyUXVlcnkgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb1RyYW5zZmVyUXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeFNldCBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvVHhTZXRcIjtcbmltcG9ydCBNb25lcm9UeFdhbGxldCBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvVHhXYWxsZXRcIjtcbmltcG9ydCBNb25lcm9UeFF1ZXJ5IGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9UeFF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0TGlzdGVuZXIgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb1dhbGxldExpc3RlbmVyXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0Q29uZmlnIGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9XYWxsZXRDb25maWdcIjtcbmltcG9ydCBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGVcIjtcbmltcG9ydCBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0IGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0XCI7XG5cbi8vIGltcG9ydCBjb25uZWN0aW9uIG1hbmFnZXJcbmltcG9ydCBNb25lcm9Db25uZWN0aW9uTWFuYWdlciBmcm9tIFwiLi9zcmMvbWFpbi90cy9jb21tb24vTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJcIjtcbmltcG9ydCBNb25lcm9Db25uZWN0aW9uTWFuYWdlckxpc3RlbmVyIGZyb20gXCIuL3NyYy9tYWluL3RzL2NvbW1vbi9Nb25lcm9Db25uZWN0aW9uTWFuYWdlckxpc3RlbmVyXCI7XG5cbi8vIGltcG9ydCBkYWVtb24sIHdhbGxldCwgYW5kIHV0aWwgY2xhc3Nlc1xuaW1wb3J0IE1vbmVyb0RhZW1vbiBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vTW9uZXJvRGFlbW9uXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0IGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9Nb25lcm9XYWxsZXRcIjtcbmltcG9ydCBNb25lcm9EYWVtb25ScGMgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL01vbmVyb0RhZW1vblJwY1wiO1xuaW1wb3J0IE1vbmVyb1dhbGxldFJwYyBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvTW9uZXJvV2FsbGV0UnBjXCI7XG5pbXBvcnQgeyBNb25lcm9XYWxsZXRLZXlzIH0gZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L01vbmVyb1dhbGxldEtleXNcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRGdWxsIGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9Nb25lcm9XYWxsZXRGdWxsXCI7XG5pbXBvcnQgTW9uZXJvVXRpbHMgZnJvbSBcIi4vc3JjL21haW4vdHMvY29tbW9uL01vbmVyb1V0aWxzXCI7XG5pbXBvcnQgVGhyZWFkUG9vbCBmcm9tIFwiLi9zcmMvbWFpbi90cy9jb21tb24vVGhyZWFkUG9vbFwiO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEdMT0JBTCBGVU5DVElPTlMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8qKlxuICogPHA+R2V0IHRoZSB2ZXJzaW9uIG9mIHRoZSBtb25lcm8tdHMgbGlicmFyeS48cD5cbiAqXG4gKiBAcmV0dXJuIHtzdHJpbmd9IHRoZSB2ZXJzaW9uIG9mIHRoaXMgbW9uZXJvLXRzIGxpYnJhcnlcbiAqL1xuZnVuY3Rpb24gZ2V0VmVyc2lvbigpIHtcbiAgcmV0dXJuIE1vbmVyb1V0aWxzLmdldFZlcnNpb24oKTtcbn1cblxuLyoqXG4gKiA8cD5DcmVhdGUgYSBjbGllbnQgY29ubmVjdGVkIHRvIG1vbmVyb2QuPHA+XG4gKlxuICogPHA+RXhhbXBsZXM6PHA+XG4gKlxuICogPGNvZGU+XG4gKiBsZXQgZGFlbW9uID0gYXdhaXQgbW9uZXJvVHMuY29ubmVjdFRvRGFlbW9uUnBjKFwiaHR0cDovL2xvY2FsaG9zdDozODA4MVwiKTs8YnI+XG4gKiA8L2NvZGU+PGJyPlxuICogPGJyPlxuICogPGNvZGU+XG4gKiBsZXQgZGFlbW9uID0gYXdhaXQgbW9uZXJvVHMuY29ubmVjdFRvRGFlbW9uUnBjKHs8YnI+XG4gKiAmbmJzcDsmbmJzcDsgdXJpOiBcImh0dHA6Ly9sb2NhbGhvc3Q6MzgwODFcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgdXNlcm5hbWU6IFwic3VwZXJ1c2VyXCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7IHBhc3N3b3JkOiBcImFiY3Rlc3RpbmcxMjNcIjxicj5cbiAqIH0pO1xuICogPC9jb2RlPjxicj5cbiAqIDxicj5cbiAqIDxjb2RlPlxuICogLy8gc3RhcnQgbW9uZXJvZCBhcyBhbiBpbnRlcm5hbCBwcm9jZXNzPGJyPlxuICogbGV0IGRhZW1vbiA9IGF3YWl0IG1vbmVyb1RzLmNvbm5lY3RUb0RhZW1vblJwYyh7PGJyPlxuICogJm5ic3A7Jm5ic3A7IGNtZDogW1wicGF0aC90by9tb25lcm9kXCIsIC4uLnBhcmFtcy4uLl0sPGJyPlxuICogfSk7XG4gKiA8L2NvZGU+XG4gKlxuICogQHBhcmFtIHtzdHJpbmd8UGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPnxQYXJ0aWFsPE1vbmVyb0RhZW1vbkNvbmZpZz58c3RyaW5nW119IHVyaU9yQ29uZmlnIC0gdXJpIG9yIHJwYyBjb25uZWN0aW9uIG9yIGNvbmZpZyBvciB0ZXJtaW5hbCBwYXJhbWV0ZXJzIHRvIGNvbm5lY3QgdG8gbW9uZXJvZFxuICogQHBhcmFtIHtzdHJpbmd9IFt1c2VybmFtZV0gLSB1c2VybmFtZSB0byBhdXRoZW50aWNhdGUgd2l0aCBtb25lcm9kXG4gKiBAcGFyYW0ge3N0cmluZ30gW3Bhc3N3b3JkXSAtIHBhc3N3b3JkIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIG1vbmVyb2RcbiAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvRGFlbW9uUnBjPn0gdGhlIGRhZW1vbiBSUEMgY2xpZW50XG4gKi9cbmZ1bmN0aW9uIGNvbm5lY3RUb0RhZW1vblJwYyh1cmlPckNvbmZpZzogc3RyaW5nIHwgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPiB8IFBhcnRpYWw8TW9uZXJvRGFlbW9uQ29uZmlnPiB8IHN0cmluZ1tdLCB1c2VybmFtZT86IHN0cmluZywgcGFzc3dvcmQ/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0RhZW1vblJwYz4ge1xuICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbm5lY3RUb0RhZW1vblJwYyh1cmlPckNvbmZpZywgdXNlcm5hbWUsIHBhc3N3b3JkKTtcbn1cblxuLyoqXG4gKiA8cD5DcmVhdGUgYSBjbGllbnQgY29ubmVjdGVkIHRvIG1vbmVyby13YWxsZXQtcnBjLjwvcD5cbiAqXG4gKiA8cD5FeGFtcGxlczo8L3A+XG4gKlxuICogPGNvZGU+XG4gKiBsZXQgd2FsbGV0UnBjID0gYXdhaXQgbW9uZXJvVHMuY29ubmVjdFRvV2FsbGV0UnBjKHs8YnI+XG4gKiAmbmJzcDsmbmJzcDsgdXJpOiBcImh0dHA6Ly9sb2NhbGhvc3Q6MzgwODFcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgdXNlcm5hbWU6IFwic3VwZXJ1c2VyXCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7IHBhc3N3b3JkOiBcImFiY3Rlc3RpbmcxMjNcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgcmVqZWN0VW5hdXRob3JpemVkOiBmYWxzZSAvLyBlLmcuIGxvY2FsIGRldmVsb3BtZW50PGJyPlxuICogfSk7PGJyPlxuICogPC9jb2RlPjxicj5cbiAqIDxicj5cbiAqIDxjb2RlPlxuICogLy8gY29ubmVjdCB0byBtb25lcm8td2FsbGV0LXJwYyBydW5uaW5nIGFzIGludGVybmFsIHByb2Nlc3M8YnI+XG4gKiBsZXQgd2FsbGV0UnBjID0gYXdhaXQgbW9uZXJvVHMuY29ubmVjdFRvV2FsbGV0UnBjKHtjbWQ6IFs8YnI+XG4gKiAmbmJzcDsmbmJzcDsgXCIvcGF0aC90by9tb25lcm8td2FsbGV0LXJwY1wiLDxicj5cbiAqICZuYnNwOyZuYnNwOyBcIi0tc3RhZ2VuZXRcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgXCItLWRhZW1vbi1hZGRyZXNzXCIsIFwiaHR0cDovL2xvY2FsaG9zdDozODA4MVwiLDxicj5cbiAqICZuYnNwOyZuYnNwOyBcIi0tZGFlbW9uLWxvZ2luXCIsIFwic3VwZXJ1c2VyOmFiY3Rlc3RpbmcxMjNcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgXCItLXJwYy1iaW5kLXBvcnRcIiwgXCIzODA4NVwiLDxicj5cbiAqICZuYnNwOyZuYnNwOyBcIi0tcnBjLWxvZ2luXCIsIFwicnBjX3VzZXI6YWJjMTIzXCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7IFwiLS13YWxsZXQtZGlyXCIsIFwiL3BhdGgvdG8vd2FsbGV0c1wiLCAvLyBkZWZhdWx0cyB0byBtb25lcm8td2FsbGV0LXJwYyBkaXJlY3Rvcnk8YnI+XG4gKiAmbmJzcDsmbmJzcDsgXCItLXJwYy1hY2Nlc3MtY29udHJvbC1vcmlnaW5zXCIsIFwiaHR0cDovL2xvY2FsaG9zdDo4MDgwXCI8YnI+XG4gKiAmbmJzcDtdfSk7XG4gKiA8L2NvZGU+XG4gKlxuICogQHBhcmFtIHtzdHJpbmd8UGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPnxQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz58c3RyaW5nW119IHVyaU9yQ29uZmlnIC0gdXJpIG9yIHJwYyBjb25uZWN0aW9uIG9yIGNvbmZpZyBvciB0ZXJtaW5hbCBwYXJhbWV0ZXJzIHRvIGNvbm5lY3QgdG8gbW9uZXJvLXdhbGxldC1ycGNcbiAqIEBwYXJhbSB7c3RyaW5nfSBbdXNlcm5hbWVdIC0gdXNlcm5hbWUgdG8gYXV0aGVudGljYXRlIHdpdGggbW9uZXJvLXdhbGxldC1ycGNcbiAqIEBwYXJhbSB7c3RyaW5nfSBbcGFzc3dvcmRdIC0gcGFzc3dvcmQgdG8gYXV0aGVudGljYXRlIHdpdGggbW9uZXJvLXdhbGxldC1ycGNcbiAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvV2FsbGV0UnBjPn0gdGhlIHdhbGxldCBSUEMgY2xpZW50XG4gKi9cbmZ1bmN0aW9uIGNvbm5lY3RUb1dhbGxldFJwYyh1cmlPckNvbmZpZzogc3RyaW5nIHwgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPiB8IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPiB8IHN0cmluZ1tdLCB1c2VybmFtZT86IHN0cmluZywgcGFzc3dvcmQ/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1dhbGxldFJwYz4ge1xuICByZXR1cm4gTW9uZXJvV2FsbGV0UnBjLmNvbm5lY3RUb1dhbGxldFJwYyh1cmlPckNvbmZpZywgdXNlcm5hbWUsIHBhc3N3b3JkKTtcbn1cblxuLyoqXG4gKiA8cD5DcmVhdGUgYSBNb25lcm8gd2FsbGV0IHVzaW5nIGNsaWVudC1zaWRlIFdlYkFzc2VtYmx5IGJpbmRpbmdzIHRvIG1vbmVyby1wcm9qZWN0J3Mgd2FsbGV0MiBpbiBDKysuPHA+XG4gKlxuICogPHA+RXhhbXBsZTo8L3A+XG4gKlxuICogPGNvZGU+XG4gKiBjb25zdCB3YWxsZXQgPSBhd2FpdCBtb25lcm9Ucy5jcmVhdGVXYWxsZXRGdWxsKHs8YnI+XG4gKiAmbmJzcDsmbmJzcDsgcGF0aDogXCIuL3dhbGxldHMvd2FsbGV0MVwiLCAvLyBsZWF2ZSBibGFuayBmb3IgaW4tbWVtb3J5IHdhbGxldDxicj5cbiAqICZuYnNwOyZuYnNwOyBwYXNzd29yZDogXCJzdXBlcnNlY3JldHBhc3N3b3JkXCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7IG5ldHdvcmtUeXBlOiBtb25lcm9Ucy5Nb25lcm9OZXR3b3JrVHlwZS5TVEFHRU5FVCw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgc2VlZDogXCJjb2V4aXN0IGlnbG9vIHBhbXBobGV0IGxhZ29vbi4uLlwiLDxicj5cbiAqICZuYnNwOyZuYnNwOyByZXN0b3JlSGVpZ2h0OiAxNTQzMjE4LDxicj5cbiAqICZuYnNwOyZuYnNwOyBzZXJ2ZXI6IFwiaHR0cDovL2xvY2FsaG9zdDozODA4MVwiPGJyPlxuICogfSk7XG4gKiA8L2NvZGU+PGJyPlxuICogPGJyPlxuICogPGNvZGU+XG4gKiBjb25zdCB3YWxsZXQgPSBhd2FpdCBtb25lcm9Ucy5jcmVhdGVXYWxsZXRGdWxsKHs8YnI+XG4gKiAmbmJzcDsmbmJzcDsgcGF0aDogXCIuL3dhbGxldHMvd2FsbGV0MVwiLCAvLyBsZWF2ZSBibGFuayBmb3IgaW4tbWVtb3J5IHdhbGxldDxicj5cbiAqICZuYnNwOyZuYnNwOyBwYXNzd29yZDogXCJzdXBlcnNlY3JldHBhc3N3b3JkXCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7IG5ldHdvcmtUeXBlOiBtb25lcm9Ucy5Nb25lcm9OZXR3b3JrVHlwZS5TVEFHRU5FVCw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgc2VlZDogXCJjb2V4aXN0IGlnbG9vIHBhbXBobGV0IGxhZ29vbi4uLlwiLDxicj5cbiAqICZuYnNwOyZuYnNwOyByZXN0b3JlSGVpZ2h0OiAxNTQzMjE4LDxicj5cbiAqICZuYnNwOyZuYnNwOyBwcm94eVRvV29ya2VyOiBmYWxzZSwgLy8gb3ZlcnJpZGUgZGVmYXVsdDxicj5cbiAqICZuYnNwOyZuYnNwOyBzZXJ2ZXI6IHs8YnI+XG4gKiAmbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDsgdXJpOiBcImh0dHA6Ly9sb2NhbGhvc3Q6MzgwODFcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDsgdXNlcm5hbWU6IFwiZGFlbW9uX3VzZXJcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDsgcGFzc3dvcmQ6IFwiZGFlbW9uX3Bhc3N3b3JkXzEyM1wiPGJyPlxuICogJm5ic3A7Jm5ic3A7IH08YnI+XG4gKiB9KTtcbiAqIDwvY29kZT5cbiAqXG4gKiBAcGFyYW0ge1BhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPn0gY29uZmlnIC0gTW9uZXJvV2FsbGV0Q29uZmlnIG9yIGVxdWl2YWxlbnQgY29uZmlnIG9iamVjdFxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucGF0aF0gLSBwYXRoIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbCwgaW4tbWVtb3J5IHdhbGxldCBpZiBub3QgZ2l2ZW4pXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wYXNzd29yZF0gLSBwYXNzd29yZCBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZVxuICogQHBhcmFtIHtNb25lcm9OZXR3b3JrVHlwZXxzdHJpbmd9IFtjb25maWcubmV0d29ya1R5cGVdIC0gbmV0d29yayB0eXBlIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvbmUgb2YgXCJtYWlubmV0XCIsIFwidGVzdG5ldFwiLCBcInN0YWdlbmV0XCIgb3IgTW9uZXJvTmV0d29ya1R5cGUuTUFJTk5FVHxURVNUTkVUfFNUQUdFTkVUKVxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VlZF0gLSBzZWVkIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbCwgcmFuZG9tIHdhbGxldCBjcmVhdGVkIGlmIG5laXRoZXIgc2VlZCBub3Iga2V5cyBnaXZlbilcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlZWRPZmZzZXRdIC0gdGhlIG9mZnNldCB1c2VkIHRvIGRlcml2ZSBhIG5ldyBzZWVkIGZyb20gdGhlIGdpdmVuIHNlZWQgdG8gcmVjb3ZlciBhIHNlY3JldCB3YWxsZXQgZnJvbSB0aGUgc2VlZCBwaHJhc2VcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5pc011bHRpc2lnXSAtIHJlc3RvcmUgbXVsdGlzaWcgd2FsbGV0IGZyb20gc2VlZFxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpbWFyeUFkZHJlc3NdIC0gcHJpbWFyeSBhZGRyZXNzIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvbmx5IHByb3ZpZGUgaWYgcmVzdG9yaW5nIGZyb20ga2V5cylcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnByaXZhdGVWaWV3S2V5XSAtIHByaXZhdGUgdmlldyBrZXkgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsKVxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpdmF0ZVNwZW5kS2V5XSAtIHByaXZhdGUgc3BlbmQga2V5IG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbClcbiAqIEBwYXJhbSB7bnVtYmVyfSBbY29uZmlnLnJlc3RvcmVIZWlnaHRdIC0gYmxvY2sgaGVpZ2h0IHRvIHN0YXJ0IHNjYW5uaW5nIGZyb20gKGRlZmF1bHRzIHRvIDAgdW5sZXNzIGdlbmVyYXRpbmcgcmFuZG9tIHdhbGxldClcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLmxhbmd1YWdlXSAtIGxhbmd1YWdlIG9mIHRoZSB3YWxsZXQncyBzZWVkIHBocmFzZSAoZGVmYXVsdHMgdG8gXCJFbmdsaXNoXCIgb3IgYXV0by1kZXRlY3RlZClcbiAqIEBwYXJhbSB7bnVtYmVyfSBbY29uZmlnLmFjY291bnRMb29rYWhlYWRdIC0gIG51bWJlciBvZiBhY2NvdW50cyB0byBzY2FuIChvcHRpb25hbClcbiAqIEBwYXJhbSB7bnVtYmVyfSBbY29uZmlnLnN1YmFkZHJlc3NMb29rYWhlYWRdIC0gbnVtYmVyIG9mIHN1YmFkZHJlc3NlcyB0byBzY2FuIHBlciBhY2NvdW50IChvcHRpb25hbClcbiAqIEBwYXJhbSB7c3RyaW5nfFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj59IFtjb25maWcuc2VydmVyXSAtIGNvbm5lY3Rpb24gdG8gbW9uZXJvIGRhZW1vbiAob3B0aW9uYWwpXG4gKiBAcGFyYW0ge01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyfSBbY29uZmlnLmNvbm5lY3Rpb25NYW5hZ2VyXSAtIG1hbmFnZSBjb25uZWN0aW9ucyB0byBtb25lcm9kIChvcHRpb25hbClcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5yZWplY3RVbmF1dGhvcml6ZWRdIC0gcmVqZWN0IHNlbGYtc2lnbmVkIHNlcnZlciBjZXJ0aWZpY2F0ZXMgaWYgdHJ1ZSAoZGVmYXVsdHMgdG8gdHJ1ZSlcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5wcm94eVRvV29ya2VyXSAtIHByb3hpZXMgd2FsbGV0IG9wZXJhdGlvbnMgdG8gYSB3b3JrZXIgaW4gb3JkZXIgdG8gbm90IGJsb2NrIHRoZSBtYWluIHRocmVhZCAoZGVmYXVsdCB0cnVlKVxuICogQHBhcmFtIHthbnl9IFtjb25maWcuZnNdIC0gZmlsZSBzeXN0ZW0gY29tcGF0aWJsZSB3aXRoIE5vZGUuanMgYGZzLnByb21pc2VzYCBBUEkgKGRlZmF1bHRzIHRvIGRpc2sgb3IgaW4tbWVtb3J5IEZTIGlmIGJyb3dzZXIpXG4gKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1dhbGxldEZ1bGw+fSB0aGUgY3JlYXRlZCB3YWxsZXRcbiAqL1xuZnVuY3Rpb24gY3JlYXRlV2FsbGV0RnVsbChjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPik6IFByb21pc2U8TW9uZXJvV2FsbGV0RnVsbD4ge1xuICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5jcmVhdGVXYWxsZXQobmV3IE1vbmVyb1dhbGxldENvbmZpZyhjb25maWcpKTtcbn1cblxuLyoqXG4gKiA8cD5PcGVuIGFuIGV4aXN0aW5nIE1vbmVybyB3YWxsZXQgdXNpbmcgY2xpZW50LXNpZGUgV2ViQXNzZW1ibHkgYmluZGluZ3MgdG8gbW9uZXJvLXByb2plY3QncyB3YWxsZXQyIGluIEMrKy48cD5cbiAqXG4gKiA8cD5FeGFtcGxlOjxwPlxuICpcbiAqIDxjb2RlPlxuICogY29uc3Qgd2FsbGV0ID0gYXdhaXQgbW9uZXJvVHMub3BlbldhbGxldEZ1bGwoezxicj5cbiAqICZuYnNwOyZuYnNwOyBwYXRoOiBcIi4vd2FsbGV0cy93YWxsZXQxXCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7IHBhc3N3b3JkOiBcInN1cGVyc2VjcmV0cGFzc3dvcmRcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgbmV0d29ya1R5cGU6IG1vbmVyb1RzLk1vbmVyb05ldHdvcmtUeXBlLlNUQUdFTkVULDxicj5cbiAqICZuYnNwOyZuYnNwOyBzZXJ2ZXI6IHsgLy8gZGFlbW9uIGNvbmZpZ3VyYXRpb248YnI+XG4gKiAmbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDsgdXJpOiBcImh0dHA6Ly9sb2NhbGhvc3Q6MzgwODFcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDsgdXNlcm5hbWU6IFwic3VwZXJ1c2VyXCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7Jm5ic3A7Jm5ic3A7IHBhc3N3b3JkOiBcImFiY3Rlc3RpbmcxMjNcIjxicj5cbiAqICZuYnNwOyZuYnNwOyB9PGJyPlxuICogfSk7XG4gKiA8L2NvZGU+XG4gKlxuICogQHBhcmFtIHtQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz59IGNvbmZpZyAtIGNvbmZpZyB0byBvcGVuIGEgZnVsbCB3YWxsZXRcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnBhdGhdIC0gcGF0aCBvZiB0aGUgd2FsbGV0IHRvIG9wZW4gKG9wdGlvbmFsIGlmICdrZXlzRGF0YScgcHJvdmlkZWQpXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wYXNzd29yZF0gLSBwYXNzd29yZCBvZiB0aGUgd2FsbGV0IHRvIG9wZW5cbiAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gW2NvbmZpZy5uZXR3b3JrVHlwZV0gLSBuZXR3b3JrIHR5cGUgb2YgdGhlIHdhbGxldCB0byBvcGVuIChvbmUgb2YgXCJtYWlubmV0XCIsIFwidGVzdG5ldFwiLCBcInN0YWdlbmV0XCIgb3IgTW9uZXJvTmV0d29ya1R5cGUuTUFJTk5FVHxURVNUTkVUfFNUQUdFTkVUKVxuICogQHBhcmFtIHtzdHJpbmd8TW9uZXJvUnBjQ29ubmVjdGlvbn0gW2NvbmZpZy5zZXJ2ZXJdIC0gdXJpIG9yIGNvbm5lY3Rpb24gdG8gbW9uZXJvIGRhZW1vbiAob3B0aW9uYWwpXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IFtjb25maWcua2V5c0RhdGFdIC0gd2FsbGV0IGtleXMgZGF0YSB0byBvcGVuIChvcHRpb25hbCBpZiBwYXRoIHByb3ZpZGVkKVxuICogQHBhcmFtIHtVaW50OEFycmF5fSBbY29uZmlnLmNhY2hlRGF0YV0gLSB3YWxsZXQgY2FjaGUgZGF0YSB0byBvcGVuIChvcHRpb25hbClcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5wcm94eVRvV29ya2VyXSAtIHByb3hpZXMgd2FsbGV0IG9wZXJhdGlvbnMgdG8gYSB3b3JrZXIgaW4gb3JkZXIgdG8gbm90IGJsb2NrIHRoZSBtYWluIHRocmVhZCAoZGVmYXVsdCB0cnVlKVxuICogQHBhcmFtIHthbnl9IFtjb25maWcuZnNdIC0gZmlsZSBzeXN0ZW0gY29tcGF0aWJsZSB3aXRoIE5vZGUuanMgYGZzLnByb21pc2VzYCBBUEkgKGRlZmF1bHRzIHRvIGRpc2sgb3IgaW4tbWVtb3J5IEZTIGlmIGJyb3dzZXIpXG4gKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1dhbGxldEZ1bGw+fSB0aGUgb3BlbmVkIHdhbGxldFxuICovXG5mdW5jdGlvbiBvcGVuV2FsbGV0RnVsbChjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPik6IFByb21pc2U8TW9uZXJvV2FsbGV0RnVsbD4ge1xuICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5vcGVuV2FsbGV0KG5ldyBNb25lcm9XYWxsZXRDb25maWcoY29uZmlnKSk7XG59XG5cbi8qKlxuICogPHA+Q3JlYXRlIGEgd2FsbGV0IHVzaW5nIFdlYkFzc2VtYmx5IGJpbmRpbmdzIHRvIG1vbmVyby1wcm9qZWN0LjwvcD5cbiAqXG4gKiA8cD5FeGFtcGxlOjwvcD5cbiAqXG4gKiA8Y29kZT5cbiAqIGNvbnN0IHdhbGxldCA9IGF3YWl0IG1vbmVyb1RzLmNyZWF0ZVdhbGxldEtleXMoezxicj5cbiAqICZuYnNwOyZuYnNwOyBwYXNzd29yZDogXCJhYmMxMjNcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgbmV0d29ya1R5cGU6IG1vbmVyb1RzLk1vbmVyb05ldHdvcmtUeXBlLlNUQUdFTkVULDxicj5cbiAqICZuYnNwOyZuYnNwOyBzZWVkOiBcImNvZXhpc3QgaWdsb28gcGFtcGhsZXQgbGFnb29uLi4uXCI8YnI+XG4gKiB9KTtcbiAqIDwvY29kZT5cbiAqXG4gKiBAcGFyYW0ge1BhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPn0gY29uZmlnIC0gTW9uZXJvV2FsbGV0Q29uZmlnIG9yIGVxdWl2YWxlbnQgY29uZmlnIG9iamVjdFxuICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBjb25maWcubmV0d29ya1R5cGUgLSBuZXR3b3JrIHR5cGUgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9uZSBvZiBcIm1haW5uZXRcIiwgXCJ0ZXN0bmV0XCIsIFwic3RhZ2VuZXRcIiBvciBNb25lcm9OZXR3b3JrVHlwZS5NQUlOTkVUfFRFU1RORVR8U1RBR0VORVQpXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5zZWVkXSAtIHNlZWQgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsLCByYW5kb20gd2FsbGV0IGNyZWF0ZWQgaWYgbmVpdGhlciBzZWVkIG5vciBrZXlzIGdpdmVuKVxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VlZE9mZnNldF0gLSB0aGUgb2Zmc2V0IHVzZWQgdG8gZGVyaXZlIGEgbmV3IHNlZWQgZnJvbSB0aGUgZ2l2ZW4gc2VlZCB0byByZWNvdmVyIGEgc2VjcmV0IHdhbGxldCBmcm9tIHRoZSBzZWVkIHBocmFzZVxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpbWFyeUFkZHJlc3NdIC0gcHJpbWFyeSBhZGRyZXNzIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvbmx5IHByb3ZpZGUgaWYgcmVzdG9yaW5nIGZyb20ga2V5cylcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnByaXZhdGVWaWV3S2V5XSAtIHByaXZhdGUgdmlldyBrZXkgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsKVxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpdmF0ZVNwZW5kS2V5XSAtIHByaXZhdGUgc3BlbmQga2V5IG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbClcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLmxhbmd1YWdlXSAtIGxhbmd1YWdlIG9mIHRoZSB3YWxsZXQncyBzZWVkIChkZWZhdWx0cyB0byBcIkVuZ2xpc2hcIiBvciBhdXRvLWRldGVjdGVkKVxuICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9XYWxsZXRLZXlzPn0gdGhlIGNyZWF0ZWQgd2FsbGV0XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVdhbGxldEtleXMoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1dhbGxldEtleXM+IHtcbiAgcmV0dXJuIE1vbmVyb1dhbGxldEtleXMuY3JlYXRlV2FsbGV0KG5ldyBNb25lcm9XYWxsZXRDb25maWcoY29uZmlnKSk7XG59XG5cbi8qKlxuICogPHA+U2h1dCBkb3duIHRoZSBtb25lcm8tdHMgbGlicmFyeSwgdGVybWluYXRpbmcgYW55IHJ1bm5pbmcgd29ya2Vycy48L3A+XG4gKlxuICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn0gcHJvbWlzZSB0aGF0IHJlc29sdmVzIHdoZW4gdGhlIGxpYnJhcnkgaGFzIHNodXQgZG93blxuICovXG5mdW5jdGlvbiBzaHV0ZG93bigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgcmV0dXJuIExpYnJhcnlVdGlscy50ZXJtaW5hdGVXb3JrZXIoKTtcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEVYUE9SVFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5leHBvcnQge1xuXG4gIC8vIHR5cGVzXG4gIEdlblV0aWxzLFxuICBGaWx0ZXIsXG4gIE1vbmVyb0Vycm9yLFxuICBIdHRwQ2xpZW50LFxuICBMaWJyYXJ5VXRpbHMsXG4gIE1vbmVyb1JwY0Nvbm5lY3Rpb24sXG4gIE1vbmVyb1JwY0Vycm9yLFxuICBTc2xPcHRpb25zLFxuICBUYXNrTG9vcGVyLFxuICBDb25uZWN0aW9uVHlwZSxcbiAgTW9uZXJvQWx0Q2hhaW4sXG4gIE1vbmVyb0JhbixcbiAgTW9uZXJvQmxvY2tIZWFkZXIsXG4gIE1vbmVyb0Jsb2NrLFxuICBNb25lcm9CbG9ja1RlbXBsYXRlLFxuICBNb25lcm9Db25uZWN0aW9uU3BhbixcbiAgTW9uZXJvRGFlbW9uQ29uZmlnLFxuICBNb25lcm9EYWVtb25JbmZvLFxuICBNb25lcm9EYWVtb25MaXN0ZW5lcixcbiAgTW9uZXJvRGFlbW9uU3luY0luZm8sXG4gIE1vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0LFxuICBNb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdCxcbiAgTW9uZXJvRmVlRXN0aW1hdGUsXG4gIE1vbmVyb0hhcmRGb3JrSW5mbyxcbiAgTW9uZXJvS2V5SW1hZ2UsXG4gIE1vbmVyb0tleUltYWdlU3BlbnRTdGF0dXMsXG4gIE1vbmVyb01pbmVyVHhTdW0sXG4gIE1vbmVyb01pbmluZ1N0YXR1cyxcbiAgTW9uZXJvTmV0d29ya1R5cGUsXG4gIE1vbmVyb091dHB1dCxcbiAgTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnksXG4gIE1vbmVyb1N1Ym1pdFR4UmVzdWx0LFxuICBNb25lcm9UeCxcbiAgTW9uZXJvVHhQb29sU3RhdHMsXG4gIE1vbmVyb1ZlcnNpb24sXG4gIE1vbmVyb1BlZXIsXG4gIE1vbmVyb1BydW5lUmVzdWx0LFxuICBNb25lcm9BY2NvdW50LFxuICBNb25lcm9BY2NvdW50VGFnLFxuICBNb25lcm9BZGRyZXNzQm9va0VudHJ5LFxuICBNb25lcm9DaGVjayxcbiAgTW9uZXJvQ2hlY2tSZXNlcnZlLFxuICBNb25lcm9DaGVja1R4LFxuICBNb25lcm9EZXN0aW5hdGlvbixcbiAgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MsXG4gIE1vbmVyb0tleUltYWdlRXhwb3J0UmVzdWx0LFxuICBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCxcbiAgTW9uZXJvTXVsdGlzaWdJbmZvLFxuICBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQsXG4gIE1vbmVyb011bHRpc2lnU2lnblJlc3VsdCxcbiAgTW9uZXJvT3V0cHV0V2FsbGV0LFxuICBNb25lcm9PdXRwdXRRdWVyeSxcbiAgTW9uZXJvVHhQcmlvcml0eSxcbiAgTW9uZXJvVHhDb25maWcsXG4gIE1vbmVyb1N1YmFkZHJlc3MsXG4gIE1vbmVyb1N5bmNSZXN1bHQsXG4gIE1vbmVyb1RyYW5zZmVyLFxuICBNb25lcm9JbmNvbWluZ1RyYW5zZmVyLFxuICBNb25lcm9PdXRnb2luZ1RyYW5zZmVyLFxuICBNb25lcm9UcmFuc2ZlclF1ZXJ5LFxuICBNb25lcm9UeFNldCxcbiAgTW9uZXJvVHhXYWxsZXQsXG4gIE1vbmVyb1R4UXVlcnksXG4gIE1vbmVyb1dhbGxldExpc3RlbmVyLFxuICBNb25lcm9XYWxsZXRDb25maWcsXG4gIE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLFxuICBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0LFxuICBNb25lcm9Db25uZWN0aW9uTWFuYWdlckxpc3RlbmVyLFxuICBNb25lcm9Db25uZWN0aW9uTWFuYWdlcixcbiAgTW9uZXJvRGFlbW9uLFxuICBNb25lcm9XYWxsZXQsXG4gIE1vbmVyb0RhZW1vblJwYyxcbiAgTW9uZXJvV2FsbGV0UnBjLFxuICBNb25lcm9XYWxsZXRLZXlzLFxuICBNb25lcm9XYWxsZXRGdWxsLFxuICBNb25lcm9VdGlscyxcbiAgVGhyZWFkUG9vbCxcblxuICAvLyBnbG9iYWwgZnVuY3Rpb25zXG4gIGdldFZlcnNpb24sXG4gIGNvbm5lY3RUb0RhZW1vblJwYyxcbiAgY29ubmVjdFRvV2FsbGV0UnBjLFxuICBjcmVhdGVXYWxsZXRGdWxsLFxuICBvcGVuV2FsbGV0RnVsbCxcbiAgY3JlYXRlV2FsbGV0S2V5cyxcbiAgc2h1dGRvd25cbn07XG5cbi8vIGV4cG9ydCBkZWZhdWx0IG9iamVjdCB3aXRoIGFnZ3JlZ2F0ZSBvZiBhbGwgZXhwb3J0c1xuY29uc3QgbW9uZXJvVHMgPSB7XG4gIEdlblV0aWxzLFxuICBGaWx0ZXIsXG4gIE1vbmVyb0Vycm9yLFxuICBIdHRwQ2xpZW50LFxuICBMaWJyYXJ5VXRpbHMsXG4gIE1vbmVyb1JwY0Nvbm5lY3Rpb24sXG4gIE1vbmVyb1JwY0Vycm9yLFxuICBTc2xPcHRpb25zLFxuICBUYXNrTG9vcGVyLFxuICBDb25uZWN0aW9uVHlwZSxcbiAgTW9uZXJvQWx0Q2hhaW4sXG4gIE1vbmVyb0JhbixcbiAgTW9uZXJvQmxvY2tIZWFkZXIsXG4gIE1vbmVyb0Jsb2NrLFxuICBNb25lcm9CbG9ja1RlbXBsYXRlLFxuICBNb25lcm9Db25uZWN0aW9uU3BhbixcbiAgTW9uZXJvRGFlbW9uQ29uZmlnLFxuICBNb25lcm9EYWVtb25JbmZvLFxuICBNb25lcm9EYWVtb25MaXN0ZW5lcixcbiAgTW9uZXJvRGFlbW9uU3luY0luZm8sXG4gIE1vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0LFxuICBNb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdCxcbiAgTW9uZXJvRmVlRXN0aW1hdGUsXG4gIE1vbmVyb0hhcmRGb3JrSW5mbyxcbiAgTW9uZXJvS2V5SW1hZ2UsXG4gIE1vbmVyb0tleUltYWdlU3BlbnRTdGF0dXMsXG4gIE1vbmVyb01pbmVyVHhTdW0sXG4gIE1vbmVyb01pbmluZ1N0YXR1cyxcbiAgTW9uZXJvTmV0d29ya1R5cGUsXG4gIE1vbmVyb091dHB1dCxcbiAgTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnksXG4gIE1vbmVyb1N1Ym1pdFR4UmVzdWx0LFxuICBNb25lcm9UeCxcbiAgTW9uZXJvVHhQb29sU3RhdHMsXG4gIE1vbmVyb1ZlcnNpb24sXG4gIE1vbmVyb1BlZXIsXG4gIE1vbmVyb1BydW5lUmVzdWx0LFxuICBNb25lcm9BY2NvdW50LFxuICBNb25lcm9BY2NvdW50VGFnLFxuICBNb25lcm9BZGRyZXNzQm9va0VudHJ5LFxuICBNb25lcm9DaGVjayxcbiAgTW9uZXJvQ2hlY2tSZXNlcnZlLFxuICBNb25lcm9DaGVja1R4LFxuICBNb25lcm9EZXN0aW5hdGlvbixcbiAgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MsXG4gIE1vbmVyb0tleUltYWdlRXhwb3J0UmVzdWx0LFxuICBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCxcbiAgTW9uZXJvTXVsdGlzaWdJbmZvLFxuICBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQsXG4gIE1vbmVyb011bHRpc2lnU2lnblJlc3VsdCxcbiAgTW9uZXJvT3V0cHV0V2FsbGV0LFxuICBNb25lcm9PdXRwdXRRdWVyeSxcbiAgTW9uZXJvVHhQcmlvcml0eSxcbiAgTW9uZXJvVHhDb25maWcsXG4gIE1vbmVyb1N1YmFkZHJlc3MsXG4gIE1vbmVyb1N5bmNSZXN1bHQsXG4gIE1vbmVyb1RyYW5zZmVyLFxuICBNb25lcm9JbmNvbWluZ1RyYW5zZmVyLFxuICBNb25lcm9PdXRnb2luZ1RyYW5zZmVyLFxuICBNb25lcm9UcmFuc2ZlclF1ZXJ5LFxuICBNb25lcm9UeFNldCxcbiAgTW9uZXJvVHhXYWxsZXQsXG4gIE1vbmVyb1R4UXVlcnksXG4gIE1vbmVyb1dhbGxldExpc3RlbmVyLFxuICBNb25lcm9XYWxsZXRDb25maWcsXG4gIE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLFxuICBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0LFxuICBNb25lcm9Db25uZWN0aW9uTWFuYWdlckxpc3RlbmVyLFxuICBNb25lcm9Db25uZWN0aW9uTWFuYWdlcixcbiAgTW9uZXJvRGFlbW9uLFxuICBNb25lcm9XYWxsZXQsXG4gIE1vbmVyb0RhZW1vblJwYyxcbiAgTW9uZXJvV2FsbGV0UnBjLFxuICBNb25lcm9XYWxsZXRLZXlzLFxuICBNb25lcm9XYWxsZXRGdWxsLFxuICBNb25lcm9VdGlscyxcbiAgVGhyZWFkUG9vbCxcblxuICAvLyBnbG9iYWwgZnVuY3Rpb25zXG4gIGdldFZlcnNpb24sXG4gIGNvbm5lY3RUb0RhZW1vblJwYyxcbiAgY29ubmVjdFRvV2FsbGV0UnBjLFxuICBjcmVhdGVXYWxsZXRGdWxsLFxuICBvcGVuV2FsbGV0RnVsbCxcbiAgY3JlYXRlV2FsbGV0S2V5cyxcbiAgc2h1dGRvd25cbn1cbmV4cG9ydCBkZWZhdWx0IG1vbmVyb1RzO1xuXG4vLyBhdWdtZW50IGdsb2JhbCBzY29wZSB3aXRoIHNhbWUgbmFtZXNwYWNlIGFzIGRlZmF1bHQgZXhwb3J0XG5kZWNsYXJlIGdsb2JhbCB7XG4gIG5hbWVzcGFjZSBtb25lcm9UcyB7XG4gICAgdHlwZSBHZW5VdGlscyA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5HZW5VdGlscz47XG4gICAgdHlwZSBGaWx0ZXIgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuRmlsdGVyPjtcbiAgICB0eXBlIE1vbmVyb0Vycm9yID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0Vycm9yPjtcbiAgICB0eXBlIEh0dHBDbGllbnQgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuSHR0cENsaWVudD47XG4gICAgdHlwZSBMaWJyYXJ5VXRpbHMgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTGlicmFyeVV0aWxzPjtcbiAgICB0eXBlIE1vbmVyb1JwY0Nvbm5lY3Rpb24gPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvUnBjQ29ubmVjdGlvbj47XG4gICAgdHlwZSBNb25lcm9ScGNFcnJvciA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9ScGNFcnJvcj47XG4gICAgdHlwZSBTc2xPcHRpb25zID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLlNzbE9wdGlvbnM+O1xuICAgIHR5cGUgVGFza0xvb3BlciA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5UYXNrTG9vcGVyPjtcbiAgICB0eXBlIENvbm5lY3Rpb25UeXBlID0gaW1wb3J0KFwiLi9pbmRleFwiKS5Db25uZWN0aW9uVHlwZTsgLy8gdHlwZSBhbGlhcyBmb3IgZW51bVxuICAgIHR5cGUgTW9uZXJvQWx0Q2hhaW4gPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvQWx0Q2hhaW4+O1xuICAgIHR5cGUgTW9uZXJvQmFuID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0Jhbj47XG4gICAgdHlwZSBNb25lcm9CbG9ja0hlYWRlciA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9CbG9ja0hlYWRlcj47XG4gICAgdHlwZSBNb25lcm9CbG9jayA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9CbG9jaz47XG4gICAgdHlwZSBNb25lcm9CbG9ja1RlbXBsYXRlID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0Jsb2NrVGVtcGxhdGU+O1xuICAgIHR5cGUgTW9uZXJvQ29ubmVjdGlvblNwYW4gPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvQ29ubmVjdGlvblNwYW4+O1xuICAgIHR5cGUgTW9uZXJvRGFlbW9uQ29uZmlnID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0RhZW1vbkNvbmZpZz47XG4gICAgdHlwZSBNb25lcm9EYWVtb25JbmZvID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0RhZW1vbkluZm8+O1xuICAgIHR5cGUgTW9uZXJvRGFlbW9uTGlzdGVuZXIgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvRGFlbW9uTGlzdGVuZXI+O1xuICAgIHR5cGUgTW9uZXJvRGFlbW9uU3luY0luZm8gPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvRGFlbW9uU3luY0luZm8+O1xuICAgIHR5cGUgTW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQ+O1xuICAgIHR5cGUgTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQ+O1xuICAgIHR5cGUgTW9uZXJvRmVlRXN0aW1hdGUgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvRmVlRXN0aW1hdGU+O1xuICAgIHR5cGUgTW9uZXJvSGFyZEZvcmtJbmZvID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0hhcmRGb3JrSW5mbz47XG4gICAgdHlwZSBNb25lcm9LZXlJbWFnZSA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9LZXlJbWFnZT47XG4gICAgdHlwZSBNb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzID0gaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzO1xuICAgIHR5cGUgTW9uZXJvTWluZXJUeFN1bSA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9NaW5lclR4U3VtPjtcbiAgICB0eXBlIE1vbmVyb01pbmluZ1N0YXR1cyA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9NaW5pbmdTdGF0dXM+O1xuICAgIHR5cGUgTW9uZXJvTmV0d29ya1R5cGUgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvTmV0d29ya1R5cGU+O1xuICAgIHR5cGUgTW9uZXJvT3V0cHV0ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb091dHB1dD47XG4gICAgdHlwZSBNb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeSA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeT47XG4gICAgdHlwZSBNb25lcm9TdWJtaXRUeFJlc3VsdCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9TdWJtaXRUeFJlc3VsdD47XG4gICAgdHlwZSBNb25lcm9UeCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9UeD47XG4gICAgdHlwZSBNb25lcm9UeFBvb2xTdGF0cyA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9UeFBvb2xTdGF0cz47XG4gICAgdHlwZSBNb25lcm9WZXJzaW9uID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1ZlcnNpb24+O1xuICAgIHR5cGUgTW9uZXJvUGVlciA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9QZWVyPjtcbiAgICB0eXBlIE1vbmVyb1BydW5lUmVzdWx0ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1BydW5lUmVzdWx0PjtcbiAgICB0eXBlIE1vbmVyb0FjY291bnQgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvQWNjb3VudD47XG4gICAgdHlwZSBNb25lcm9BY2NvdW50VGFnID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0FjY291bnRUYWc+O1xuICAgIHR5cGUgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9BZGRyZXNzQm9va0VudHJ5PjtcbiAgICB0eXBlIE1vbmVyb0NoZWNrID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0NoZWNrPjtcbiAgICB0eXBlIE1vbmVyb0NoZWNrUmVzZXJ2ZSA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9DaGVja1Jlc2VydmU+O1xuICAgIHR5cGUgTW9uZXJvQ2hlY2tUeCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9DaGVja1R4PjtcbiAgICB0eXBlIE1vbmVyb0Rlc3RpbmF0aW9uID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0Rlc3RpbmF0aW9uPjtcbiAgICB0eXBlIE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0ludGVncmF0ZWRBZGRyZXNzPjtcbiAgICB0eXBlIE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0PjtcbiAgICB0eXBlIE1vbmVyb011bHRpc2lnSW5mbyA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9NdWx0aXNpZ0luZm8+O1xuICAgIHR5cGUgTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb011bHRpc2lnSW5pdFJlc3VsdD47XG4gICAgdHlwZSBNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0PjtcbiAgICB0eXBlIE1vbmVyb091dHB1dFdhbGxldCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9PdXRwdXRXYWxsZXQ+O1xuICAgIHR5cGUgTW9uZXJvT3V0cHV0UXVlcnkgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvT3V0cHV0UXVlcnk+O1xuICAgIHR5cGUgTW9uZXJvVHhQcmlvcml0eSA9IGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvVHhQcmlvcml0eTtcbiAgICB0eXBlIE1vbmVyb1R4Q29uZmlnID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1R4Q29uZmlnPjtcbiAgICB0eXBlIE1vbmVyb1N1YmFkZHJlc3MgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvU3ViYWRkcmVzcz47XG4gICAgdHlwZSBNb25lcm9TeW5jUmVzdWx0ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1N5bmNSZXN1bHQ+O1xuICAgIHR5cGUgTW9uZXJvVHJhbnNmZXIgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvVHJhbnNmZXI+O1xuICAgIHR5cGUgTW9uZXJvSW5jb21pbmdUcmFuc2ZlciA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9JbmNvbWluZ1RyYW5zZmVyPjtcbiAgICB0eXBlIE1vbmVyb091dGdvaW5nVHJhbnNmZXIgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvT3V0Z29pbmdUcmFuc2Zlcj47XG4gICAgdHlwZSBNb25lcm9UcmFuc2ZlclF1ZXJ5ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1RyYW5zZmVyUXVlcnk+O1xuICAgIHR5cGUgTW9uZXJvVHhTZXQgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvVHhTZXQ+O1xuICAgIHR5cGUgTW9uZXJvVHhXYWxsZXQgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvVHhXYWxsZXQ+O1xuICAgIHR5cGUgTW9uZXJvVHhRdWVyeSA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9UeFF1ZXJ5PjtcbiAgICB0eXBlIE1vbmVyb1dhbGxldExpc3RlbmVyID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1dhbGxldExpc3RlbmVyPjtcbiAgICB0eXBlIE1vbmVyb1dhbGxldENvbmZpZyA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9XYWxsZXRDb25maWc+O1xuICAgIHR5cGUgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUgPSBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlO1xuICAgIHR5cGUgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0PjtcbiAgICB0eXBlIE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lcj47XG4gICAgdHlwZSBNb25lcm9Db25uZWN0aW9uTWFuYWdlciA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9Db25uZWN0aW9uTWFuYWdlcj47XG4gICAgdHlwZSBNb25lcm9EYWVtb24gPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvRGFlbW9uPjtcbiAgICB0eXBlIE1vbmVyb1dhbGxldCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9XYWxsZXQ+O1xuICAgIHR5cGUgTW9uZXJvRGFlbW9uUnBjID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0RhZW1vblJwYz47XG4gICAgdHlwZSBNb25lcm9XYWxsZXRScGMgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvV2FsbGV0UnBjPjtcbiAgICB0eXBlIE1vbmVyb1dhbGxldEtleXMgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvV2FsbGV0S2V5cz47XG4gICAgdHlwZSBNb25lcm9XYWxsZXRGdWxsID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1dhbGxldEZ1bGw+O1xuICAgIHR5cGUgTW9uZXJvVXRpbHMgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvVXRpbHM+O1xuICAgIHR5cGUgVGhyZWFkUG9vbCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5UaHJlYWRQb29sPjtcbiAgfVxufSJdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWTs7QUFFWjs7QUFFQTs7QUFFQTtBQUFBLElBQUFBLHNCQUFBLEdBQUFDLE9BQUEsaURBQUFDLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLGtCQUFBQyxLQUFBLFVBQUFILE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLHNCQUFBRSxVQUFBLFFBQUFDLEdBQUEsV0FBQUEsQ0FBQSxVQUFBQyxlQUFBLENBQUFDLE9BQUEsTUFBQVAsTUFBQSxDQUFBQyxjQUFBLENBQUFDLE9BQUEsY0FBQUUsVUFBQSxRQUFBQyxHQUFBLFdBQUFBLENBQUEsVUFBQUcsT0FBQSxDQUFBRCxPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLGdCQUFBRSxVQUFBLFFBQUFDLEdBQUEsV0FBQUEsQ0FBQSxVQUFBSSxTQUFBLENBQUFGLE9BQUEsTUFBQVAsTUFBQSxDQUFBQyxjQUFBLENBQUFDLE9BQUEsa0JBQUFFLFVBQUEsUUFBQUMsR0FBQSxXQUFBQSxDQUFBLFVBQUFLLFdBQUEsQ0FBQUgsT0FBQSxNQUFBUCxNQUFBLENBQUFDLGNBQUEsQ0FBQUMsT0FBQSxvQkFBQUUsVUFBQSxRQUFBQyxHQUFBLFdBQUFBLENBQUEsVUFBQU0sYUFBQSxDQUFBSixPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLHFCQUFBRSxVQUFBLFFBQUFDLEdBQUEsV0FBQUEsQ0FBQSxVQUFBTyxjQUFBLENBQUFMLE9BQUEsTUFBQVAsTUFBQSxDQUFBQyxjQUFBLENBQUFDLE9BQUEsd0JBQUFFLFVBQUEsUUFB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