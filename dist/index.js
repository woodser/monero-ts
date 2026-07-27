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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIk9iamVjdCIsImRlZmluZVByb3BlcnR5IiwiZXhwb3J0cyIsInZhbHVlIiwiZW51bWVyYWJsZSIsImdldCIsIl9Db25uZWN0aW9uVHlwZSIsImRlZmF1bHQiLCJfRmlsdGVyIiwiX0dlblV0aWxzIiwiX0h0dHBDbGllbnQiLCJfTGlicmFyeVV0aWxzIiwiX01vbmVyb0FjY291bnQiLCJfTW9uZXJvQWNjb3VudFRhZyIsIl9Nb25lcm9BZGRyZXNzQm9va0VudHJ5IiwiX01vbmVyb0FsdENoYWluIiwiX01vbmVyb0JhbiIsIl9Nb25lcm9CbG9jayIsIl9Nb25lcm9CbG9ja0hlYWRlciIsIl9Nb25lcm9CbG9ja1RlbXBsYXRlIiwiX01vbmVyb0NoZWNrIiwiX01vbmVyb0NoZWNrUmVzZXJ2ZSIsIl9Nb25lcm9DaGVja1R4IiwiX01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyIiwiX01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIiLCJfTW9uZXJvQ29ubmVjdGlvblNwYW4iLCJfTW9uZXJvRGFlbW9uIiwiX01vbmVyb0RhZW1vbkNvbmZpZyIsIl9Nb25lcm9EYWVtb25JbmZvIiwiX01vbmVyb0RhZW1vbkxpc3RlbmVyIiwiX01vbmVyb0RhZW1vblJwYyIsIl9Nb25lcm9EYWVtb25TeW5jSW5mbyIsIl9Nb25lcm9EYWVtb25VcGRhdGVDaGVja1Jlc3VsdCIsIl9Nb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdCIsIl9Nb25lcm9EZXN0aW5hdGlvbiIsIl9Nb25lcm9FcnJvciIsIl9Nb25lcm9GZWVFc3RpbWF0ZSIsIl9Nb25lcm9IYXJkRm9ya0luZm8iLCJfTW9uZXJvSW5jb21pbmdUcmFuc2ZlciIsIl9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsIl9Nb25lcm9LZXlJbWFnZSIsIl9Nb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdCIsIl9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCIsIl9Nb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQiLCJfTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUiLCJfTW9uZXJvTWluZXJUeFN1bSIsIl9Nb25lcm9NaW5pbmdTdGF0dXMiLCJfTW9uZXJvTXVsdGlzaWdJbmZvIiwiX01vbmVyb011bHRpc2lnSW5pdFJlc3VsdCIsIl9Nb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQiLCJfTW9uZXJvTmV0d29ya1R5cGUiLCJfTW9uZXJvT3V0Z29pbmdUcmFuc2ZlciIsIl9Nb25lcm9PdXRwdXQiLCJfTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkiLCJfTW9uZXJvT3V0cHV0UXVlcnkiLCJfTW9uZXJvT3V0cHV0V2FsbGV0IiwiX01vbmVyb1BlZXIiLCJfTW9uZXJvUHJ1bmVSZXN1bHQiLCJfTW9uZXJvUnBjQ29ubmVjdGlvbiIsIl9Nb25lcm9ScGNFcnJvciIsIl9Nb25lcm9TdWJhZGRyZXNzIiwiX01vbmVyb1N1Ym1pdFR4UmVzdWx0IiwiX01vbmVyb1N5bmNSZXN1bHQiLCJfTW9uZXJvVHJhbnNmZXIiLCJfTW9uZXJvVHJhbnNmZXJRdWVyeSIsIl9Nb25lcm9UeCIsIl9Nb25lcm9UeENvbmZpZyIsIl9Nb25lcm9UeFBvb2xTdGF0cyIsIl9Nb25lcm9UeFByaW9yaXR5IiwiX01vbmVyb1R4UXVlcnkiLCJfTW9uZXJvVHhTZXQiLCJfTW9uZXJvVHhXYWxsZXQiLCJfTW9uZXJvVXRpbHMiLCJfTW9uZXJvVmVyc2lvbiIsIl9Nb25lcm9XYWxsZXQiLCJfTW9uZXJvV2FsbGV0Q29uZmlnIiwiX01vbmVyb1dhbGxldEZ1bGwiLCJfTW9uZXJvV2FsbGV0S2V5cyIsIk1vbmVyb1dhbGxldEtleXMiLCJfTW9uZXJvV2FsbGV0TGlzdGVuZXIiLCJfTW9uZXJvV2FsbGV0UnBjIiwiX1NzbE9wdGlvbnMiLCJfVGFza0xvb3BlciIsIl9UaHJlYWRQb29sIiwiY29ubmVjdFRvRGFlbW9uUnBjIiwiY29ubmVjdFRvV2FsbGV0UnBjIiwiY3JlYXRlV2FsbGV0RnVsbCIsImNyZWF0ZVdhbGxldEtleXMiLCJnZXRWZXJzaW9uIiwib3BlbldhbGxldEZ1bGwiLCJzaHV0ZG93biIsIk1vbmVyb1V0aWxzIiwidXJpT3JDb25maWciLCJ1c2VybmFtZSIsInBhc3N3b3JkIiwiTW9uZXJvRGFlbW9uUnBjIiwiTW9uZXJvV2FsbGV0UnBjIiwiY29uZmlnIiwiTW9uZXJvV2FsbGV0RnVsbCIsImNyZWF0ZVdhbGxldCIsIk1vbmVyb1dhbGxldENvbmZpZyIsIm9wZW5XYWxsZXQiLCJMaWJyYXJ5VXRpbHMiLCJ0ZXJtaW5hdGVXb3JrZXIiLCJtb25lcm9UcyIsIkdlblV0aWxzIiwiRmlsdGVyIiwiTW9uZXJvRXJyb3IiLCJIdHRwQ2xpZW50IiwiTW9uZXJvUnBjQ29ubmVjdGlvbiIsIk1vbmVyb1JwY0Vycm9yIiwiU3NsT3B0aW9ucyIsIlRhc2tMb29wZXIiLCJDb25uZWN0aW9uVHlwZSIsIk1vbmVyb0FsdENoYWluIiwiTW9uZXJvQmFuIiwiTW9uZXJvQmxvY2tIZWFkZXIiLCJNb25lcm9CbG9jayIsIk1vbmVyb0Jsb2NrVGVtcGxhdGUiLCJNb25lcm9Db25uZWN0aW9uU3BhbiIsIk1vbmVyb0RhZW1vbkNvbmZpZyIsIk1vbmVyb0RhZW1vbkluZm8iLCJNb25lcm9EYWVtb25MaXN0ZW5lciIsIk1vbmVyb0RhZW1vblN5bmNJbmZvIiwiTW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQiLCJNb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdCIsIk1vbmVyb0ZlZUVzdGltYXRlIiwiTW9uZXJvSGFyZEZvcmtJbmZvIiwiTW9uZXJvS2V5SW1hZ2UiLCJNb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzIiwiTW9uZXJvTWluZXJUeFN1bSIsIk1vbmVyb01pbmluZ1N0YXR1cyIsIk1vbmVyb05ldHdvcmtUeXBlIiwiTW9uZXJvT3V0cHV0IiwiTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkiLCJNb25lcm9TdWJtaXRUeFJlc3VsdCIsIk1vbmVyb1R4IiwiTW9uZXJvVHhQb29sU3RhdHMiLCJNb25lcm9WZXJzaW9uIiwiTW9uZXJvUGVlciIsIk1vbmVyb1BydW5lUmVzdWx0IiwiTW9uZXJvQWNjb3VudCIsIk1vbmVyb0FjY291bnRUYWciLCJNb25lcm9BZGRyZXNzQm9va0VudHJ5IiwiTW9uZXJvQ2hlY2siLCJNb25lcm9DaGVja1Jlc2VydmUiLCJNb25lcm9DaGVja1R4IiwiTW9uZXJvRGVzdGluYXRpb24iLCJNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsIk1vbmVyb0tleUltYWdlRXhwb3J0UmVzdWx0IiwiTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQiLCJNb25lcm9NdWx0aXNpZ0luZm8iLCJNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQiLCJNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQiLCJNb25lcm9PdXRwdXRXYWxsZXQiLCJNb25lcm9PdXRwdXRRdWVyeSIsIk1vbmVyb1R4UHJpb3JpdHkiLCJNb25lcm9UeENvbmZpZyIsIk1vbmVyb1N1YmFkZHJlc3MiLCJNb25lcm9TeW5jUmVzdWx0IiwiTW9uZXJvVHJhbnNmZXIiLCJNb25lcm9JbmNvbWluZ1RyYW5zZmVyIiwiTW9uZXJvT3V0Z29pbmdUcmFuc2ZlciIsIk1vbmVyb1RyYW5zZmVyUXVlcnkiLCJNb25lcm9UeFNldCIsIk1vbmVyb1R4V2FsbGV0IiwiTW9uZXJvVHhRdWVyeSIsIk1vbmVyb1dhbGxldExpc3RlbmVyIiwiTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUiLCJNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0IiwiTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lciIsIk1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyIiwiTW9uZXJvRGFlbW9uIiwiTW9uZXJvV2FsbGV0IiwiVGhyZWFkUG9vbCIsIl9kZWZhdWx0Il0sInNvdXJjZXMiOlsiLi4vaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBJTVBPUlRTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLy8gU2VlIHRoZSBmdWxsIG1vZGVsIHNwZWNpZmljYXRpb246IGh0dHBzOi8vd29vZHNlci5naXRodWIuaW8vbW9uZXJvLWphdmEvbW9uZXJvLXNwZWMucGRmXG5cbi8vIGltcG9ydCBjb21tb24gbW9kZWxzXG5pbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4vc3JjL21haW4vdHMvY29tbW9uL0dlblV0aWxzXCI7XG5pbXBvcnQgRmlsdGVyIGZyb20gXCIuL3NyYy9tYWluL3RzL2NvbW1vbi9GaWx0ZXJcIjtcbmltcG9ydCBNb25lcm9FcnJvciBmcm9tIFwiLi9zcmMvbWFpbi90cy9jb21tb24vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBIdHRwQ2xpZW50IGZyb20gXCIuL3NyYy9tYWluL3RzL2NvbW1vbi9IdHRwQ2xpZW50XCI7XG5pbXBvcnQgTGlicmFyeVV0aWxzIGZyb20gXCIuL3NyYy9tYWluL3RzL2NvbW1vbi9MaWJyYXJ5VXRpbHNcIjtcbmltcG9ydCBNb25lcm9ScGNDb25uZWN0aW9uIGZyb20gXCIuL3NyYy9tYWluL3RzL2NvbW1vbi9Nb25lcm9ScGNDb25uZWN0aW9uXCI7XG5pbXBvcnQgTW9uZXJvUnBjRXJyb3IgZnJvbSBcIi4vc3JjL21haW4vdHMvY29tbW9uL01vbmVyb1JwY0Vycm9yXCI7XG5pbXBvcnQgU3NsT3B0aW9ucyBmcm9tIFwiLi9zcmMvbWFpbi90cy9jb21tb24vU3NsT3B0aW9uc1wiO1xuaW1wb3J0IFRhc2tMb29wZXIgZnJvbSBcIi4vc3JjL21haW4vdHMvY29tbW9uL1Rhc2tMb29wZXJcIjtcblxuLy8gaW1wb3J0IGRhZW1vbiBtb2RlbHNcbmltcG9ydCBDb25uZWN0aW9uVHlwZSBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvQ29ubmVjdGlvblR5cGVcIjtcbmltcG9ydCBNb25lcm9BbHRDaGFpbiBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvQWx0Q2hhaW5cIjtcbmltcG9ydCBNb25lcm9CYW4gZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb0JhblwiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrSGVhZGVyIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9CbG9ja0hlYWRlclwiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9CbG9ja1wiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrVGVtcGxhdGUgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb0Jsb2NrVGVtcGxhdGVcIjtcbmltcG9ydCBNb25lcm9Db25uZWN0aW9uU3BhbiBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvQ29ubmVjdGlvblNwYW5cIjtcbmltcG9ydCBNb25lcm9EYWVtb25Db25maWcgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb0RhZW1vbkNvbmZpZ1wiO1xuaW1wb3J0IE1vbmVyb0RhZW1vbkluZm8gZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb0RhZW1vbkluZm9cIjtcbmltcG9ydCBNb25lcm9EYWVtb25MaXN0ZW5lciBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvRGFlbW9uTGlzdGVuZXJcIjtcbmltcG9ydCBNb25lcm9EYWVtb25TeW5jSW5mbyBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvRGFlbW9uU3luY0luZm9cIjtcbmltcG9ydCBNb25lcm9EYWVtb25VcGRhdGVDaGVja1Jlc3VsdCBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdCBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9GZWVFc3RpbWF0ZSBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvRmVlRXN0aW1hdGVcIjtcbmltcG9ydCBNb25lcm9IYXJkRm9ya0luZm8gZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb0hhcmRGb3JrSW5mb1wiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9LZXlJbWFnZVwiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlU3BlbnRTdGF0dXMgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb0tleUltYWdlU3BlbnRTdGF0dXNcIjtcbmltcG9ydCBNb25lcm9NaW5lclR4U3VtIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9NaW5lclR4U3VtXCI7XG5pbXBvcnQgTW9uZXJvTWluaW5nU3RhdHVzIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9NaW5pbmdTdGF0dXNcIjtcbmltcG9ydCBNb25lcm9OZXR3b3JrVHlwZSBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvTmV0d29ya1R5cGVcIjtcbmltcG9ydCBNb25lcm9PdXRwdXQgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb091dHB1dFwiO1xuaW1wb3J0IE1vbmVyb091dHB1dEhpc3RvZ3JhbUVudHJ5IGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeVwiO1xuaW1wb3J0IE1vbmVyb1N1Ym1pdFR4UmVzdWx0IGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9TdWJtaXRUeFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb1R4IGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9UeFwiO1xuaW1wb3J0IE1vbmVyb1R4UG9vbFN0YXRzIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9UeFBvb2xTdGF0c1wiO1xuaW1wb3J0IE1vbmVyb1ZlcnNpb24gZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb1ZlcnNpb25cIjtcbmltcG9ydCBNb25lcm9QZWVyIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9QZWVyXCI7XG5pbXBvcnQgTW9uZXJvUHJ1bmVSZXN1bHQgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb1BydW5lUmVzdWx0XCI7XG5cbi8vIGltcG9ydCB3YWxsZXQgbW9kZWxzXG5pbXBvcnQgTW9uZXJvQWNjb3VudCBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvQWNjb3VudFwiO1xuaW1wb3J0IE1vbmVyb0FjY291bnRUYWcgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb0FjY291bnRUYWdcIjtcbmltcG9ydCBNb25lcm9BZGRyZXNzQm9va0VudHJ5IGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9BZGRyZXNzQm9va0VudHJ5XCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2sgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb0NoZWNrXCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2tSZXNlcnZlIGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9DaGVja1Jlc2VydmVcIjtcbmltcG9ydCBNb25lcm9DaGVja1R4IGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9DaGVja1R4XCI7XG5pbXBvcnQgTW9uZXJvRGVzdGluYXRpb24gZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb0Rlc3RpbmF0aW9uXCI7XG5pbXBvcnQgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb0ludGVncmF0ZWRBZGRyZXNzXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHQgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb0tleUltYWdlRXhwb3J0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdJbmZvIGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9NdWx0aXNpZ0luZm9cIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb011bHRpc2lnSW5pdFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnU2lnblJlc3VsdCBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0V2FsbGV0IGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9PdXRwdXRXYWxsZXRcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRRdWVyeSBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvT3V0cHV0UXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeFByaW9yaXR5IGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9UeFByaW9yaXR5XCI7XG5pbXBvcnQgTW9uZXJvVHhDb25maWcgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb1R4Q29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvU3ViYWRkcmVzcyBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvU3ViYWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb1N5bmNSZXN1bHQgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb1N5bmNSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9UcmFuc2ZlciBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9JbmNvbWluZ1RyYW5zZmVyIGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9JbmNvbWluZ1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlciBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvT3V0Z29pbmdUcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb1RyYW5zZmVyUXVlcnkgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb1RyYW5zZmVyUXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeFNldCBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvVHhTZXRcIjtcbmltcG9ydCBNb25lcm9UeFdhbGxldCBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvVHhXYWxsZXRcIjtcbmltcG9ydCBNb25lcm9UeFF1ZXJ5IGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9UeFF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0TGlzdGVuZXIgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb1dhbGxldExpc3RlbmVyXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0Q29uZmlnIGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9XYWxsZXRDb25maWdcIjtcbmltcG9ydCBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGVcIjtcbmltcG9ydCBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0IGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0XCI7XG5cbi8vIGltcG9ydCBjb25uZWN0aW9uIG1hbmFnZXJcbmltcG9ydCBNb25lcm9Db25uZWN0aW9uTWFuYWdlciBmcm9tIFwiLi9zcmMvbWFpbi90cy9jb21tb24vTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJcIjtcbmltcG9ydCBNb25lcm9Db25uZWN0aW9uTWFuYWdlckxpc3RlbmVyIGZyb20gXCIuL3NyYy9tYWluL3RzL2NvbW1vbi9Nb25lcm9Db25uZWN0aW9uTWFuYWdlckxpc3RlbmVyXCI7XG5cbi8vIGltcG9ydCBkYWVtb24sIHdhbGxldCwgYW5kIHV0aWwgY2xhc3Nlc1xuaW1wb3J0IE1vbmVyb0RhZW1vbiBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vTW9uZXJvRGFlbW9uXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0IGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9Nb25lcm9XYWxsZXRcIjtcbmltcG9ydCBNb25lcm9EYWVtb25ScGMgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL01vbmVyb0RhZW1vblJwY1wiO1xuaW1wb3J0IE1vbmVyb1dhbGxldFJwYyBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvTW9uZXJvV2FsbGV0UnBjXCI7XG5pbXBvcnQgeyBNb25lcm9XYWxsZXRLZXlzIH0gZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L01vbmVyb1dhbGxldEtleXNcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRGdWxsIGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9Nb25lcm9XYWxsZXRGdWxsXCI7XG5pbXBvcnQgTW9uZXJvVXRpbHMgZnJvbSBcIi4vc3JjL21haW4vdHMvY29tbW9uL01vbmVyb1V0aWxzXCI7XG5pbXBvcnQgVGhyZWFkUG9vbCBmcm9tIFwiLi9zcmMvbWFpbi90cy9jb21tb24vVGhyZWFkUG9vbFwiO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIEdMT0JBTCBGVU5DVElPTlMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8qKlxuICogPHA+R2V0IHRoZSB2ZXJzaW9uIG9mIHRoZSBtb25lcm8tdHMgbGlicmFyeS48cD5cbiAqXG4gKiBAcmV0dXJuIHtzdHJpbmd9IHRoZSB2ZXJzaW9uIG9mIHRoaXMgbW9uZXJvLXRzIGxpYnJhcnlcbiAqL1xuZnVuY3Rpb24gZ2V0VmVyc2lvbigpIHtcbiAgcmV0dXJuIE1vbmVyb1V0aWxzLmdldFZlcnNpb24oKTtcbn1cblxuLyoqXG4gKiA8cD5DcmVhdGUgYSBjbGllbnQgY29ubmVjdGVkIHRvIG1vbmVyb2QuPHA+XG4gKlxuICogPHA+RXhhbXBsZXM6PHA+XG4gKlxuICogPGNvZGU+XG4gKiBsZXQgZGFlbW9uID0gYXdhaXQgbW9uZXJvVHMuY29ubmVjdFRvRGFlbW9uUnBjKFwiaHR0cDovL2xvY2FsaG9zdDozODA4MVwiKTs8YnI+XG4gKiA8L2NvZGU+PGJyPlxuICogPGJyPlxuICogPGNvZGU+XG4gKiBsZXQgZGFlbW9uID0gYXdhaXQgbW9uZXJvVHMuY29ubmVjdFRvRGFlbW9uUnBjKHs8YnI+XG4gKiAmbmJzcDsmbmJzcDsgdXJpOiBcImh0dHA6Ly9sb2NhbGhvc3Q6MzgwODFcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgdXNlcm5hbWU6IFwic3VwZXJ1c2VyXCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7IHBhc3N3b3JkOiBcImFiY3Rlc3RpbmcxMjNcIjxicj5cbiAqIH0pO1xuICogPC9jb2RlPjxicj5cbiAqIDxicj5cbiAqIDxjb2RlPlxuICogLy8gc3RhcnQgbW9uZXJvZCBhcyBhbiBpbnRlcm5hbCBwcm9jZXNzPGJyPlxuICogbGV0IGRhZW1vbiA9IGF3YWl0IG1vbmVyb1RzLmNvbm5lY3RUb0RhZW1vblJwYyh7PGJyPlxuICogJm5ic3A7Jm5ic3A7IGNtZDogW1wicGF0aC90by9tb25lcm9kXCIsIC4uLnBhcmFtcy4uLl0sPGJyPlxuICogfSk7XG4gKiA8L2NvZGU+XG4gKlxuICogQHBhcmFtIHtzdHJpbmd8UGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPnxQYXJ0aWFsPE1vbmVyb0RhZW1vbkNvbmZpZz58c3RyaW5nW119IHVyaU9yQ29uZmlnIC0gdXJpIG9yIHJwYyBjb25uZWN0aW9uIG9yIGNvbmZpZyBvciB0ZXJtaW5hbCBwYXJhbWV0ZXJzIHRvIGNvbm5lY3QgdG8gbW9uZXJvZFxuICogQHBhcmFtIHtzdHJpbmd9IFt1c2VybmFtZV0gLSB1c2VybmFtZSB0byBhdXRoZW50aWNhdGUgd2l0aCBtb25lcm9kXG4gKiBAcGFyYW0ge3N0cmluZ30gW3Bhc3N3b3JkXSAtIHBhc3N3b3JkIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIG1vbmVyb2RcbiAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvRGFlbW9uUnBjPn0gdGhlIGRhZW1vbiBSUEMgY2xpZW50XG4gKi9cbmZ1bmN0aW9uIGNvbm5lY3RUb0RhZW1vblJwYyh1cmlPckNvbmZpZzogc3RyaW5nIHwgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPiB8IFBhcnRpYWw8TW9uZXJvRGFlbW9uQ29uZmlnPiB8IHN0cmluZ1tdLCB1c2VybmFtZT86IHN0cmluZywgcGFzc3dvcmQ/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0RhZW1vblJwYz4ge1xuICByZXR1cm4gTW9uZXJvRGFlbW9uUnBjLmNvbm5lY3RUb0RhZW1vblJwYyh1cmlPckNvbmZpZywgdXNlcm5hbWUsIHBhc3N3b3JkKTtcbn1cblxuLyoqXG4gKiA8cD5DcmVhdGUgYSBjbGllbnQgY29ubmVjdGVkIHRvIG1vbmVyby13YWxsZXQtcnBjLjwvcD5cbiAqXG4gKiA8cD5FeGFtcGxlczo8L3A+XG4gKlxuICogPGNvZGU+XG4gKiBsZXQgd2FsbGV0UnBjID0gYXdhaXQgbW9uZXJvVHMuY29ubmVjdFRvV2FsbGV0UnBjKHs8YnI+XG4gKiAmbmJzcDsmbmJzcDsgdXJpOiBcImh0dHA6Ly9sb2NhbGhvc3Q6MzgwODFcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgdXNlcm5hbWU6IFwic3VwZXJ1c2VyXCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7IHBhc3N3b3JkOiBcImFiY3Rlc3RpbmcxMjNcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgcmVqZWN0VW5hdXRob3JpemVkOiBmYWxzZSAvLyBlLmcuIGxvY2FsIGRldmVsb3BtZW50PGJyPlxuICogfSk7PGJyPlxuICogPC9jb2RlPjxicj5cbiAqIDxicj5cbiAqIDxjb2RlPlxuICogLy8gY29ubmVjdCB0byBtb25lcm8td2FsbGV0LXJwYyBydW5uaW5nIGFzIGludGVybmFsIHByb2Nlc3M8YnI+XG4gKiBsZXQgd2FsbGV0UnBjID0gYXdhaXQgbW9uZXJvVHMuY29ubmVjdFRvV2FsbGV0UnBjKHtjbWQ6IFs8YnI+XG4gKiAmbmJzcDsmbmJzcDsgXCIvcGF0aC90by9tb25lcm8td2FsbGV0LXJwY1wiLDxicj5cbiAqICZuYnNwOyZuYnNwOyBcIi0tc3RhZ2VuZXRcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgXCItLWRhZW1vbi1hZGRyZXNzXCIsIFwiaHR0cDovL2xvY2FsaG9zdDozODA4MVwiLDxicj5cbiAqICZuYnNwOyZuYnNwOyBcIi0tZGFlbW9uLWxvZ2luXCIsIFwic3VwZXJ1c2VyOmFiY3Rlc3RpbmcxMjNcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgXCItLXJwYy1iaW5kLXBvcnRcIiwgXCIzODA4NVwiLDxicj5cbiAqICZuYnNwOyZuYnNwOyBcIi0tcnBjLWxvZ2luXCIsIFwicnBjX3VzZXI6YWJjMTIzXCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7IFwiLS13YWxsZXQtZGlyXCIsIFwiL3BhdGgvdG8vd2FsbGV0c1wiLCAvLyBkZWZhdWx0cyB0byBtb25lcm8td2FsbGV0LXJwYyBkaXJlY3Rvcnk8YnI+XG4gKiAmbmJzcDsmbmJzcDsgXCItLXJwYy1hY2Nlc3MtY29udHJvbC1vcmlnaW5zXCIsIFwiaHR0cDovL2xvY2FsaG9zdDo4MDgwXCI8YnI+XG4gKiAmbmJzcDtdfSk7XG4gKiA8L2NvZGU+XG4gKlxuICogQHBhcmFtIHtzdHJpbmd8UGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPnxQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz58c3RyaW5nW119IHVyaU9yQ29uZmlnIC0gdXJpIG9yIHJwYyBjb25uZWN0aW9uIG9yIGNvbmZpZyBvciB0ZXJtaW5hbCBwYXJhbWV0ZXJzIHRvIGNvbm5lY3QgdG8gbW9uZXJvLXdhbGxldC1ycGNcbiAqIEBwYXJhbSB7c3RyaW5nfSBbdXNlcm5hbWVdIC0gdXNlcm5hbWUgdG8gYXV0aGVudGljYXRlIHdpdGggbW9uZXJvLXdhbGxldC1ycGNcbiAqIEBwYXJhbSB7c3RyaW5nfSBbcGFzc3dvcmRdIC0gcGFzc3dvcmQgdG8gYXV0aGVudGljYXRlIHdpdGggbW9uZXJvLXdhbGxldC1ycGNcbiAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvV2FsbGV0UnBjPn0gdGhlIHdhbGxldCBSUEMgY2xpZW50XG4gKi9cbmZ1bmN0aW9uIGNvbm5lY3RUb1dhbGxldFJwYyh1cmlPckNvbmZpZzogc3RyaW5nIHwgUGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPiB8IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPiB8IHN0cmluZ1tdLCB1c2VybmFtZT86IHN0cmluZywgcGFzc3dvcmQ/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1dhbGxldFJwYz4ge1xuICByZXR1cm4gTW9uZXJvV2FsbGV0UnBjLmNvbm5lY3RUb1dhbGxldFJwYyh1cmlPckNvbmZpZywgdXNlcm5hbWUsIHBhc3N3b3JkKTtcbn1cblxuLyoqXG4gKiA8cD5DcmVhdGUgYSBNb25lcm8gd2FsbGV0IHVzaW5nIGNsaWVudC1zaWRlIFdlYkFzc2VtYmx5IGJpbmRpbmdzIHRvIG1vbmVyby1wcm9qZWN0J3Mgd2FsbGV0MiBpbiBDKysuPHA+XG4gKlxuICogPHA+RXhhbXBsZTo8L3A+XG4gKlxuICogPGNvZGU+XG4gKiBjb25zdCB3YWxsZXQgPSBhd2FpdCBtb25lcm9Ucy5jcmVhdGVXYWxsZXRGdWxsKHs8YnI+XG4gKiAmbmJzcDsmbmJzcDsgcGF0aDogXCIuL3Rlc3Rfd2FsbGV0cy93YWxsZXQxXCIsIC8vIGxlYXZlIGJsYW5rIGZvciBpbi1tZW1vcnkgd2FsbGV0PGJyPlxuICogJm5ic3A7Jm5ic3A7IHBhc3N3b3JkOiBcInN1cGVyc2VjcmV0cGFzc3dvcmRcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgbmV0d29ya1R5cGU6IG1vbmVyb1RzLk1vbmVyb05ldHdvcmtUeXBlLlNUQUdFTkVULDxicj5cbiAqICZuYnNwOyZuYnNwOyBzZWVkOiBcImNvZXhpc3QgaWdsb28gcGFtcGhsZXQgbGFnb29uLi4uXCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7IHJlc3RvcmVIZWlnaHQ6IDE1NDMyMTgsPGJyPlxuICogJm5ic3A7Jm5ic3A7IHNlcnZlcjogXCJodHRwOi8vbG9jYWxob3N0OjM4MDgxXCI8YnI+XG4gKiB9KTtcbiAqIDwvY29kZT48YnI+XG4gKiA8YnI+XG4gKiA8Y29kZT5cbiAqIGNvbnN0IHdhbGxldCA9IGF3YWl0IG1vbmVyb1RzLmNyZWF0ZVdhbGxldEZ1bGwoezxicj5cbiAqICZuYnNwOyZuYnNwOyBwYXRoOiBcIi4vdGVzdF93YWxsZXRzL3dhbGxldDFcIiwgLy8gbGVhdmUgYmxhbmsgZm9yIGluLW1lbW9yeSB3YWxsZXQ8YnI+XG4gKiAmbmJzcDsmbmJzcDsgcGFzc3dvcmQ6IFwic3VwZXJzZWNyZXRwYXNzd29yZFwiLDxicj5cbiAqICZuYnNwOyZuYnNwOyBuZXR3b3JrVHlwZTogbW9uZXJvVHMuTW9uZXJvTmV0d29ya1R5cGUuU1RBR0VORVQsPGJyPlxuICogJm5ic3A7Jm5ic3A7IHNlZWQ6IFwiY29leGlzdCBpZ2xvbyBwYW1waGxldCBsYWdvb24uLi5cIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgcmVzdG9yZUhlaWdodDogMTU0MzIxOCw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgcHJveHlUb1dvcmtlcjogZmFsc2UsIC8vIG92ZXJyaWRlIGRlZmF1bHQ8YnI+XG4gKiAmbmJzcDsmbmJzcDsgc2VydmVyOiB7PGJyPlxuICogJm5ic3A7Jm5ic3A7Jm5ic3A7Jm5ic3A7IHVyaTogXCJodHRwOi8vbG9jYWxob3N0OjM4MDgxXCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7Jm5ic3A7Jm5ic3A7IHVzZXJuYW1lOiBcImRhZW1vbl91c2VyXCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7Jm5ic3A7Jm5ic3A7IHBhc3N3b3JkOiBcImRhZW1vbl9wYXNzd29yZF8xMjNcIjxicj5cbiAqICZuYnNwOyZuYnNwOyB9PGJyPlxuICogfSk7XG4gKiA8L2NvZGU+XG4gKlxuICogQHBhcmFtIHtQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz59IGNvbmZpZyAtIE1vbmVyb1dhbGxldENvbmZpZyBvciBlcXVpdmFsZW50IGNvbmZpZyBvYmplY3RcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnBhdGhdIC0gcGF0aCBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwsIGluLW1lbW9yeSB3YWxsZXQgaWYgbm90IGdpdmVuKVxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucGFzc3dvcmRdIC0gcGFzc3dvcmQgb2YgdGhlIHdhbGxldCB0byBjcmVhdGVcbiAqIEBwYXJhbSB7TW9uZXJvTmV0d29ya1R5cGV8c3RyaW5nfSBbY29uZmlnLm5ldHdvcmtUeXBlXSAtIG5ldHdvcmsgdHlwZSBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob25lIG9mIFwibWFpbm5ldFwiLCBcInRlc3RuZXRcIiwgXCJzdGFnZW5ldFwiIG9yIE1vbmVyb05ldHdvcmtUeXBlLk1BSU5ORVR8VEVTVE5FVHxTVEFHRU5FVClcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlZWRdIC0gc2VlZCBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwsIHJhbmRvbSB3YWxsZXQgY3JlYXRlZCBpZiBuZWl0aGVyIHNlZWQgbm9yIGtleXMgZ2l2ZW4pXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5zZWVkT2Zmc2V0XSAtIHRoZSBvZmZzZXQgdXNlZCB0byBkZXJpdmUgYSBuZXcgc2VlZCBmcm9tIHRoZSBnaXZlbiBzZWVkIHRvIHJlY292ZXIgYSBzZWNyZXQgd2FsbGV0IGZyb20gdGhlIHNlZWQgcGhyYXNlXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcuaXNNdWx0aXNpZ10gLSByZXN0b3JlIG11bHRpc2lnIHdhbGxldCBmcm9tIHNlZWRcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnByaW1hcnlBZGRyZXNzXSAtIHByaW1hcnkgYWRkcmVzcyBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob25seSBwcm92aWRlIGlmIHJlc3RvcmluZyBmcm9tIGtleXMpXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wcml2YXRlVmlld0tleV0gLSBwcml2YXRlIHZpZXcga2V5IG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbClcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnByaXZhdGVTcGVuZEtleV0gLSBwcml2YXRlIHNwZW5kIGtleSBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwpXG4gKiBAcGFyYW0ge251bWJlcn0gW2NvbmZpZy5yZXN0b3JlSGVpZ2h0XSAtIGJsb2NrIGhlaWdodCB0byBzdGFydCBzY2FubmluZyBmcm9tIChkZWZhdWx0cyB0byAwIHVubGVzcyBnZW5lcmF0aW5nIHJhbmRvbSB3YWxsZXQpXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5sYW5ndWFnZV0gLSBsYW5ndWFnZSBvZiB0aGUgd2FsbGV0J3Mgc2VlZCBwaHJhc2UgKGRlZmF1bHRzIHRvIFwiRW5nbGlzaFwiIG9yIGF1dG8tZGV0ZWN0ZWQpXG4gKiBAcGFyYW0ge251bWJlcn0gW2NvbmZpZy5hY2NvdW50TG9va2FoZWFkXSAtICBudW1iZXIgb2YgYWNjb3VudHMgdG8gc2NhbiAob3B0aW9uYWwpXG4gKiBAcGFyYW0ge251bWJlcn0gW2NvbmZpZy5zdWJhZGRyZXNzTG9va2FoZWFkXSAtIG51bWJlciBvZiBzdWJhZGRyZXNzZXMgdG8gc2NhbiBwZXIgYWNjb3VudCAob3B0aW9uYWwpXG4gKiBAcGFyYW0ge3N0cmluZ3xQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+fSBbY29uZmlnLnNlcnZlcl0gLSBjb25uZWN0aW9uIHRvIG1vbmVybyBkYWVtb24gKG9wdGlvbmFsKVxuICogQHBhcmFtIHtNb25lcm9Db25uZWN0aW9uTWFuYWdlcn0gW2NvbmZpZy5jb25uZWN0aW9uTWFuYWdlcl0gLSBtYW5hZ2UgY29ubmVjdGlvbnMgdG8gbW9uZXJvZCAob3B0aW9uYWwpXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcucmVqZWN0VW5hdXRob3JpemVkXSAtIHJlamVjdCBzZWxmLXNpZ25lZCBzZXJ2ZXIgY2VydGlmaWNhdGVzIGlmIHRydWUgKGRlZmF1bHRzIHRvIHRydWUpXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcucHJveHlUb1dvcmtlcl0gLSBwcm94aWVzIHdhbGxldCBvcGVyYXRpb25zIHRvIGEgd29ya2VyIGluIG9yZGVyIHRvIG5vdCBibG9jayB0aGUgbWFpbiB0aHJlYWQgKGRlZmF1bHQgdHJ1ZSlcbiAqIEBwYXJhbSB7YW55fSBbY29uZmlnLmZzXSAtIGZpbGUgc3lzdGVtIGNvbXBhdGlibGUgd2l0aCBOb2RlLmpzIGBmcy5wcm9taXNlc2AgQVBJIChkZWZhdWx0cyB0byBkaXNrIG9yIGluLW1lbW9yeSBGUyBpZiBicm93c2VyKVxuICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9XYWxsZXRGdWxsPn0gdGhlIGNyZWF0ZWQgd2FsbGV0XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVdhbGxldEZ1bGwoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1dhbGxldEZ1bGw+IHtcbiAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwuY3JlYXRlV2FsbGV0KG5ldyBNb25lcm9XYWxsZXRDb25maWcoY29uZmlnKSk7XG59XG5cbi8qKlxuICogPHA+T3BlbiBhbiBleGlzdGluZyBNb25lcm8gd2FsbGV0IHVzaW5nIGNsaWVudC1zaWRlIFdlYkFzc2VtYmx5IGJpbmRpbmdzIHRvIG1vbmVyby1wcm9qZWN0J3Mgd2FsbGV0MiBpbiBDKysuPHA+XG4gKlxuICogPHA+RXhhbXBsZTo8cD5cbiAqXG4gKiA8Y29kZT5cbiAqIGNvbnN0IHdhbGxldCA9IGF3YWl0IG1vbmVyb1RzLm9wZW5XYWxsZXRGdWxsKHs8YnI+XG4gKiAmbmJzcDsmbmJzcDsgcGF0aDogXCIuL3dhbGxldHMvd2FsbGV0MVwiLDxicj5cbiAqICZuYnNwOyZuYnNwOyBwYXNzd29yZDogXCJzdXBlcnNlY3JldHBhc3N3b3JkXCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7IG5ldHdvcmtUeXBlOiBtb25lcm9Ucy5Nb25lcm9OZXR3b3JrVHlwZS5TVEFHRU5FVCw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgc2VydmVyOiB7IC8vIGRhZW1vbiBjb25maWd1cmF0aW9uPGJyPlxuICogJm5ic3A7Jm5ic3A7Jm5ic3A7Jm5ic3A7IHVyaTogXCJodHRwOi8vbG9jYWxob3N0OjM4MDgxXCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7Jm5ic3A7Jm5ic3A7IHVzZXJuYW1lOiBcInN1cGVydXNlclwiLDxicj5cbiAqICZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwOyBwYXNzd29yZDogXCJhYmN0ZXN0aW5nMTIzXCI8YnI+XG4gKiAmbmJzcDsmbmJzcDsgfTxicj5cbiAqIH0pO1xuICogPC9jb2RlPlxuICpcbiAqIEBwYXJhbSB7UGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+fSBjb25maWcgLSBjb25maWcgdG8gb3BlbiBhIGZ1bGwgd2FsbGV0XG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wYXRoXSAtIHBhdGggb2YgdGhlIHdhbGxldCB0byBvcGVuIChvcHRpb25hbCBpZiAna2V5c0RhdGEnIHByb3ZpZGVkKVxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucGFzc3dvcmRdIC0gcGFzc3dvcmQgb2YgdGhlIHdhbGxldCB0byBvcGVuXG4gKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IFtjb25maWcubmV0d29ya1R5cGVdIC0gbmV0d29yayB0eXBlIG9mIHRoZSB3YWxsZXQgdG8gb3BlbiAob25lIG9mIFwibWFpbm5ldFwiLCBcInRlc3RuZXRcIiwgXCJzdGFnZW5ldFwiIG9yIE1vbmVyb05ldHdvcmtUeXBlLk1BSU5ORVR8VEVTVE5FVHxTVEFHRU5FVClcbiAqIEBwYXJhbSB7c3RyaW5nfE1vbmVyb1JwY0Nvbm5lY3Rpb259IFtjb25maWcuc2VydmVyXSAtIHVyaSBvciBjb25uZWN0aW9uIHRvIG1vbmVybyBkYWVtb24gKG9wdGlvbmFsKVxuICogQHBhcmFtIHtVaW50OEFycmF5fSBbY29uZmlnLmtleXNEYXRhXSAtIHdhbGxldCBrZXlzIGRhdGEgdG8gb3BlbiAob3B0aW9uYWwgaWYgcGF0aCBwcm92aWRlZClcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gW2NvbmZpZy5jYWNoZURhdGFdIC0gd2FsbGV0IGNhY2hlIGRhdGEgdG8gb3BlbiAob3B0aW9uYWwpXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcucHJveHlUb1dvcmtlcl0gLSBwcm94aWVzIHdhbGxldCBvcGVyYXRpb25zIHRvIGEgd29ya2VyIGluIG9yZGVyIHRvIG5vdCBibG9jayB0aGUgbWFpbiB0aHJlYWQgKGRlZmF1bHQgdHJ1ZSlcbiAqIEBwYXJhbSB7YW55fSBbY29uZmlnLmZzXSAtIGZpbGUgc3lzdGVtIGNvbXBhdGlibGUgd2l0aCBOb2RlLmpzIGBmcy5wcm9taXNlc2AgQVBJIChkZWZhdWx0cyB0byBkaXNrIG9yIGluLW1lbW9yeSBGUyBpZiBicm93c2VyKVxuICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9XYWxsZXRGdWxsPn0gdGhlIG9wZW5lZCB3YWxsZXRcbiAqL1xuZnVuY3Rpb24gb3BlbldhbGxldEZ1bGwoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1dhbGxldEZ1bGw+IHtcbiAgcmV0dXJuIE1vbmVyb1dhbGxldEZ1bGwub3BlbldhbGxldChuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKGNvbmZpZykpO1xufVxuXG4vKipcbiAqIDxwPkNyZWF0ZSBhIHdhbGxldCB1c2luZyBXZWJBc3NlbWJseSBiaW5kaW5ncyB0byBtb25lcm8tcHJvamVjdC48L3A+XG4gKlxuICogPHA+RXhhbXBsZTo8L3A+XG4gKlxuICogPGNvZGU+XG4gKiBjb25zdCB3YWxsZXQgPSBhd2FpdCBtb25lcm9Ucy5jcmVhdGVXYWxsZXRLZXlzKHs8YnI+XG4gKiAmbmJzcDsmbmJzcDsgcGFzc3dvcmQ6IFwiYWJjMTIzXCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7IG5ldHdvcmtUeXBlOiBtb25lcm9Ucy5Nb25lcm9OZXR3b3JrVHlwZS5TVEFHRU5FVCw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgc2VlZDogXCJjb2V4aXN0IGlnbG9vIHBhbXBobGV0IGxhZ29vbi4uLlwiPGJyPlxuICogfSk7XG4gKiA8L2NvZGU+XG4gKlxuICogQHBhcmFtIHtQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz59IGNvbmZpZyAtIE1vbmVyb1dhbGxldENvbmZpZyBvciBlcXVpdmFsZW50IGNvbmZpZyBvYmplY3RcbiAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gY29uZmlnLm5ldHdvcmtUeXBlIC0gbmV0d29yayB0eXBlIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvbmUgb2YgXCJtYWlubmV0XCIsIFwidGVzdG5ldFwiLCBcInN0YWdlbmV0XCIgb3IgTW9uZXJvTmV0d29ya1R5cGUuTUFJTk5FVHxURVNUTkVUfFNUQUdFTkVUKVxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VlZF0gLSBzZWVkIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbCwgcmFuZG9tIHdhbGxldCBjcmVhdGVkIGlmIG5laXRoZXIgc2VlZCBub3Iga2V5cyBnaXZlbilcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlZWRPZmZzZXRdIC0gdGhlIG9mZnNldCB1c2VkIHRvIGRlcml2ZSBhIG5ldyBzZWVkIGZyb20gdGhlIGdpdmVuIHNlZWQgdG8gcmVjb3ZlciBhIHNlY3JldCB3YWxsZXQgZnJvbSB0aGUgc2VlZCBwaHJhc2VcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnByaW1hcnlBZGRyZXNzXSAtIHByaW1hcnkgYWRkcmVzcyBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob25seSBwcm92aWRlIGlmIHJlc3RvcmluZyBmcm9tIGtleXMpXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wcml2YXRlVmlld0tleV0gLSBwcml2YXRlIHZpZXcga2V5IG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbClcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnByaXZhdGVTcGVuZEtleV0gLSBwcml2YXRlIHNwZW5kIGtleSBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwpXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5sYW5ndWFnZV0gLSBsYW5ndWFnZSBvZiB0aGUgd2FsbGV0J3Mgc2VlZCAoZGVmYXVsdHMgdG8gXCJFbmdsaXNoXCIgb3IgYXV0by1kZXRlY3RlZClcbiAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvV2FsbGV0S2V5cz59IHRoZSBjcmVhdGVkIHdhbGxldFxuICovXG5mdW5jdGlvbiBjcmVhdGVXYWxsZXRLZXlzKGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KTogUHJvbWlzZTxNb25lcm9XYWxsZXRLZXlzPiB7XG4gIHJldHVybiBNb25lcm9XYWxsZXRLZXlzLmNyZWF0ZVdhbGxldChuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKGNvbmZpZykpO1xufVxuXG4vKipcbiAqIDxwPlNodXQgZG93biB0aGUgbW9uZXJvLXRzIGxpYnJhcnksIHRlcm1pbmF0aW5nIGFueSBydW5uaW5nIHdvcmtlcnMuPC9wPlxuICpcbiAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59IHByb21pc2UgdGhhdCByZXNvbHZlcyB3aGVuIHRoZSBsaWJyYXJ5IGhhcyBzaHV0IGRvd25cbiAqL1xuZnVuY3Rpb24gc2h1dGRvd24oKTogUHJvbWlzZTx2b2lkPiB7XG4gIHJldHVybiBMaWJyYXJ5VXRpbHMudGVybWluYXRlV29ya2VyKCk7XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBFWFBPUlRTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuZXhwb3J0IHtcblxuICAvLyB0eXBlc1xuICBHZW5VdGlscyxcbiAgRmlsdGVyLFxuICBNb25lcm9FcnJvcixcbiAgSHR0cENsaWVudCxcbiAgTGlicmFyeVV0aWxzLFxuICBNb25lcm9ScGNDb25uZWN0aW9uLFxuICBNb25lcm9ScGNFcnJvcixcbiAgU3NsT3B0aW9ucyxcbiAgVGFza0xvb3BlcixcbiAgQ29ubmVjdGlvblR5cGUsXG4gIE1vbmVyb0FsdENoYWluLFxuICBNb25lcm9CYW4sXG4gIE1vbmVyb0Jsb2NrSGVhZGVyLFxuICBNb25lcm9CbG9jayxcbiAgTW9uZXJvQmxvY2tUZW1wbGF0ZSxcbiAgTW9uZXJvQ29ubmVjdGlvblNwYW4sXG4gIE1vbmVyb0RhZW1vbkNvbmZpZyxcbiAgTW9uZXJvRGFlbW9uSW5mbyxcbiAgTW9uZXJvRGFlbW9uTGlzdGVuZXIsXG4gIE1vbmVyb0RhZW1vblN5bmNJbmZvLFxuICBNb25lcm9EYWVtb25VcGRhdGVDaGVja1Jlc3VsdCxcbiAgTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQsXG4gIE1vbmVyb0ZlZUVzdGltYXRlLFxuICBNb25lcm9IYXJkRm9ya0luZm8sXG4gIE1vbmVyb0tleUltYWdlLFxuICBNb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzLFxuICBNb25lcm9NaW5lclR4U3VtLFxuICBNb25lcm9NaW5pbmdTdGF0dXMsXG4gIE1vbmVyb05ldHdvcmtUeXBlLFxuICBNb25lcm9PdXRwdXQsXG4gIE1vbmVyb091dHB1dEhpc3RvZ3JhbUVudHJ5LFxuICBNb25lcm9TdWJtaXRUeFJlc3VsdCxcbiAgTW9uZXJvVHgsXG4gIE1vbmVyb1R4UG9vbFN0YXRzLFxuICBNb25lcm9WZXJzaW9uLFxuICBNb25lcm9QZWVyLFxuICBNb25lcm9QcnVuZVJlc3VsdCxcbiAgTW9uZXJvQWNjb3VudCxcbiAgTW9uZXJvQWNjb3VudFRhZyxcbiAgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSxcbiAgTW9uZXJvQ2hlY2ssXG4gIE1vbmVyb0NoZWNrUmVzZXJ2ZSxcbiAgTW9uZXJvQ2hlY2tUeCxcbiAgTW9uZXJvRGVzdGluYXRpb24sXG4gIE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzLFxuICBNb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdCxcbiAgTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQsXG4gIE1vbmVyb011bHRpc2lnSW5mbyxcbiAgTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0LFxuICBNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQsXG4gIE1vbmVyb091dHB1dFdhbGxldCxcbiAgTW9uZXJvT3V0cHV0UXVlcnksXG4gIE1vbmVyb1R4UHJpb3JpdHksXG4gIE1vbmVyb1R4Q29uZmlnLFxuICBNb25lcm9TdWJhZGRyZXNzLFxuICBNb25lcm9TeW5jUmVzdWx0LFxuICBNb25lcm9UcmFuc2ZlcixcbiAgTW9uZXJvSW5jb21pbmdUcmFuc2ZlcixcbiAgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcixcbiAgTW9uZXJvVHJhbnNmZXJRdWVyeSxcbiAgTW9uZXJvVHhTZXQsXG4gIE1vbmVyb1R4V2FsbGV0LFxuICBNb25lcm9UeFF1ZXJ5LFxuICBNb25lcm9XYWxsZXRMaXN0ZW5lcixcbiAgTW9uZXJvV2FsbGV0Q29uZmlnLFxuICBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSxcbiAgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCxcbiAgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lcixcbiAgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIsXG4gIE1vbmVyb0RhZW1vbixcbiAgTW9uZXJvV2FsbGV0LFxuICBNb25lcm9EYWVtb25ScGMsXG4gIE1vbmVyb1dhbGxldFJwYyxcbiAgTW9uZXJvV2FsbGV0S2V5cyxcbiAgTW9uZXJvV2FsbGV0RnVsbCxcbiAgTW9uZXJvVXRpbHMsXG4gIFRocmVhZFBvb2wsXG5cbiAgLy8gZ2xvYmFsIGZ1bmN0aW9uc1xuICBnZXRWZXJzaW9uLFxuICBjb25uZWN0VG9EYWVtb25ScGMsXG4gIGNvbm5lY3RUb1dhbGxldFJwYyxcbiAgY3JlYXRlV2FsbGV0RnVsbCxcbiAgb3BlbldhbGxldEZ1bGwsXG4gIGNyZWF0ZVdhbGxldEtleXMsXG4gIHNodXRkb3duXG59O1xuXG4vLyBleHBvcnQgZGVmYXVsdCBvYmplY3Qgd2l0aCBhZ2dyZWdhdGUgb2YgYWxsIGV4cG9ydHNcbmNvbnN0IG1vbmVyb1RzID0ge1xuICBHZW5VdGlscyxcbiAgRmlsdGVyLFxuICBNb25lcm9FcnJvcixcbiAgSHR0cENsaWVudCxcbiAgTGlicmFyeVV0aWxzLFxuICBNb25lcm9ScGNDb25uZWN0aW9uLFxuICBNb25lcm9ScGNFcnJvcixcbiAgU3NsT3B0aW9ucyxcbiAgVGFza0xvb3BlcixcbiAgQ29ubmVjdGlvblR5cGUsXG4gIE1vbmVyb0FsdENoYWluLFxuICBNb25lcm9CYW4sXG4gIE1vbmVyb0Jsb2NrSGVhZGVyLFxuICBNb25lcm9CbG9jayxcbiAgTW9uZXJvQmxvY2tUZW1wbGF0ZSxcbiAgTW9uZXJvQ29ubmVjdGlvblNwYW4sXG4gIE1vbmVyb0RhZW1vbkNvbmZpZyxcbiAgTW9uZXJvRGFlbW9uSW5mbyxcbiAgTW9uZXJvRGFlbW9uTGlzdGVuZXIsXG4gIE1vbmVyb0RhZW1vblN5bmNJbmZvLFxuICBNb25lcm9EYWVtb25VcGRhdGVDaGVja1Jlc3VsdCxcbiAgTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQsXG4gIE1vbmVyb0ZlZUVzdGltYXRlLFxuICBNb25lcm9IYXJkRm9ya0luZm8sXG4gIE1vbmVyb0tleUltYWdlLFxuICBNb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzLFxuICBNb25lcm9NaW5lclR4U3VtLFxuICBNb25lcm9NaW5pbmdTdGF0dXMsXG4gIE1vbmVyb05ldHdvcmtUeXBlLFxuICBNb25lcm9PdXRwdXQsXG4gIE1vbmVyb091dHB1dEhpc3RvZ3JhbUVudHJ5LFxuICBNb25lcm9TdWJtaXRUeFJlc3VsdCxcbiAgTW9uZXJvVHgsXG4gIE1vbmVyb1R4UG9vbFN0YXRzLFxuICBNb25lcm9WZXJzaW9uLFxuICBNb25lcm9QZWVyLFxuICBNb25lcm9QcnVuZVJlc3VsdCxcbiAgTW9uZXJvQWNjb3VudCxcbiAgTW9uZXJvQWNjb3VudFRhZyxcbiAgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSxcbiAgTW9uZXJvQ2hlY2ssXG4gIE1vbmVyb0NoZWNrUmVzZXJ2ZSxcbiAgTW9uZXJvQ2hlY2tUeCxcbiAgTW9uZXJvRGVzdGluYXRpb24sXG4gIE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzLFxuICBNb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdCxcbiAgTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQsXG4gIE1vbmVyb011bHRpc2lnSW5mbyxcbiAgTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0LFxuICBNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQsXG4gIE1vbmVyb091dHB1dFdhbGxldCxcbiAgTW9uZXJvT3V0cHV0UXVlcnksXG4gIE1vbmVyb1R4UHJpb3JpdHksXG4gIE1vbmVyb1R4Q29uZmlnLFxuICBNb25lcm9TdWJhZGRyZXNzLFxuICBNb25lcm9TeW5jUmVzdWx0LFxuICBNb25lcm9UcmFuc2ZlcixcbiAgTW9uZXJvSW5jb21pbmdUcmFuc2ZlcixcbiAgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcixcbiAgTW9uZXJvVHJhbnNmZXJRdWVyeSxcbiAgTW9uZXJvVHhTZXQsXG4gIE1vbmVyb1R4V2FsbGV0LFxuICBNb25lcm9UeFF1ZXJ5LFxuICBNb25lcm9XYWxsZXRMaXN0ZW5lcixcbiAgTW9uZXJvV2FsbGV0Q29uZmlnLFxuICBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSxcbiAgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCxcbiAgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lcixcbiAgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIsXG4gIE1vbmVyb0RhZW1vbixcbiAgTW9uZXJvV2FsbGV0LFxuICBNb25lcm9EYWVtb25ScGMsXG4gIE1vbmVyb1dhbGxldFJwYyxcbiAgTW9uZXJvV2FsbGV0S2V5cyxcbiAgTW9uZXJvV2FsbGV0RnVsbCxcbiAgTW9uZXJvVXRpbHMsXG4gIFRocmVhZFBvb2wsXG5cbiAgLy8gZ2xvYmFsIGZ1bmN0aW9uc1xuICBnZXRWZXJzaW9uLFxuICBjb25uZWN0VG9EYWVtb25ScGMsXG4gIGNvbm5lY3RUb1dhbGxldFJwYyxcbiAgY3JlYXRlV2FsbGV0RnVsbCxcbiAgb3BlbldhbGxldEZ1bGwsXG4gIGNyZWF0ZVdhbGxldEtleXMsXG4gIHNodXRkb3duXG59XG5leHBvcnQgZGVmYXVsdCBtb25lcm9UcztcblxuLy8gYXVnbWVudCBnbG9iYWwgc2NvcGUgd2l0aCBzYW1lIG5hbWVzcGFjZSBhcyBkZWZhdWx0IGV4cG9ydFxuZGVjbGFyZSBnbG9iYWwge1xuICBuYW1lc3BhY2UgbW9uZXJvVHMge1xuICAgIHR5cGUgR2VuVXRpbHMgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuR2VuVXRpbHM+O1xuICAgIHR5cGUgRmlsdGVyID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLkZpbHRlcj47XG4gICAgdHlwZSBNb25lcm9FcnJvciA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9FcnJvcj47XG4gICAgdHlwZSBIdHRwQ2xpZW50ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLkh0dHBDbGllbnQ+O1xuICAgIHR5cGUgTGlicmFyeVV0aWxzID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLkxpYnJhcnlVdGlscz47XG4gICAgdHlwZSBNb25lcm9ScGNDb25uZWN0aW9uID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1JwY0Nvbm5lY3Rpb24+O1xuICAgIHR5cGUgTW9uZXJvUnBjRXJyb3IgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvUnBjRXJyb3I+O1xuICAgIHR5cGUgU3NsT3B0aW9ucyA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Tc2xPcHRpb25zPjtcbiAgICB0eXBlIFRhc2tMb29wZXIgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuVGFza0xvb3Blcj47XG4gICAgdHlwZSBDb25uZWN0aW9uVHlwZSA9IGltcG9ydChcIi4vaW5kZXhcIikuQ29ubmVjdGlvblR5cGU7IC8vIHR5cGUgYWxpYXMgZm9yIGVudW1cbiAgICB0eXBlIE1vbmVyb0FsdENoYWluID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0FsdENoYWluPjtcbiAgICB0eXBlIE1vbmVyb0JhbiA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9CYW4+O1xuICAgIHR5cGUgTW9uZXJvQmxvY2tIZWFkZXIgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvQmxvY2tIZWFkZXI+O1xuICAgIHR5cGUgTW9uZXJvQmxvY2sgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvQmxvY2s+O1xuICAgIHR5cGUgTW9uZXJvQmxvY2tUZW1wbGF0ZSA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9CbG9ja1RlbXBsYXRlPjtcbiAgICB0eXBlIE1vbmVyb0Nvbm5lY3Rpb25TcGFuID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0Nvbm5lY3Rpb25TcGFuPjtcbiAgICB0eXBlIE1vbmVyb0RhZW1vbkNvbmZpZyA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9EYWVtb25Db25maWc+O1xuICAgIHR5cGUgTW9uZXJvRGFlbW9uSW5mbyA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9EYWVtb25JbmZvPjtcbiAgICB0eXBlIE1vbmVyb0RhZW1vbkxpc3RlbmVyID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0RhZW1vbkxpc3RlbmVyPjtcbiAgICB0eXBlIE1vbmVyb0RhZW1vblN5bmNJbmZvID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0RhZW1vblN5bmNJbmZvPjtcbiAgICB0eXBlIE1vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0PjtcbiAgICB0eXBlIE1vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0PjtcbiAgICB0eXBlIE1vbmVyb0ZlZUVzdGltYXRlID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0ZlZUVzdGltYXRlPjtcbiAgICB0eXBlIE1vbmVyb0hhcmRGb3JrSW5mbyA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9IYXJkRm9ya0luZm8+O1xuICAgIHR5cGUgTW9uZXJvS2V5SW1hZ2UgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvS2V5SW1hZ2U+O1xuICAgIHR5cGUgTW9uZXJvS2V5SW1hZ2VTcGVudFN0YXR1cyA9IGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvS2V5SW1hZ2VTcGVudFN0YXR1cztcbiAgICB0eXBlIE1vbmVyb01pbmVyVHhTdW0gPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvTWluZXJUeFN1bT47XG4gICAgdHlwZSBNb25lcm9NaW5pbmdTdGF0dXMgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvTWluaW5nU3RhdHVzPjtcbiAgICB0eXBlIE1vbmVyb05ldHdvcmtUeXBlID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb05ldHdvcmtUeXBlPjtcbiAgICB0eXBlIE1vbmVyb091dHB1dCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9PdXRwdXQ+O1xuICAgIHR5cGUgTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnk+O1xuICAgIHR5cGUgTW9uZXJvU3VibWl0VHhSZXN1bHQgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvU3VibWl0VHhSZXN1bHQ+O1xuICAgIHR5cGUgTW9uZXJvVHggPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvVHg+O1xuICAgIHR5cGUgTW9uZXJvVHhQb29sU3RhdHMgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvVHhQb29sU3RhdHM+O1xuICAgIHR5cGUgTW9uZXJvVmVyc2lvbiA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9WZXJzaW9uPjtcbiAgICB0eXBlIE1vbmVyb1BlZXIgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvUGVlcj47XG4gICAgdHlwZSBNb25lcm9QcnVuZVJlc3VsdCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9QcnVuZVJlc3VsdD47XG4gICAgdHlwZSBNb25lcm9BY2NvdW50ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0FjY291bnQ+O1xuICAgIHR5cGUgTW9uZXJvQWNjb3VudFRhZyA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9BY2NvdW50VGFnPjtcbiAgICB0eXBlIE1vbmVyb0FkZHJlc3NCb29rRW50cnkgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeT47XG4gICAgdHlwZSBNb25lcm9DaGVjayA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9DaGVjaz47XG4gICAgdHlwZSBNb25lcm9DaGVja1Jlc2VydmUgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvQ2hlY2tSZXNlcnZlPjtcbiAgICB0eXBlIE1vbmVyb0NoZWNrVHggPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvQ2hlY2tUeD47XG4gICAgdHlwZSBNb25lcm9EZXN0aW5hdGlvbiA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9EZXN0aW5hdGlvbj47XG4gICAgdHlwZSBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz47XG4gICAgdHlwZSBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdD47XG4gICAgdHlwZSBNb25lcm9NdWx0aXNpZ0luZm8gPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvTXVsdGlzaWdJbmZvPjtcbiAgICB0eXBlIE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQ+O1xuICAgIHR5cGUgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb011bHRpc2lnU2lnblJlc3VsdD47XG4gICAgdHlwZSBNb25lcm9PdXRwdXRXYWxsZXQgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvT3V0cHV0V2FsbGV0PjtcbiAgICB0eXBlIE1vbmVyb091dHB1dFF1ZXJ5ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb091dHB1dFF1ZXJ5PjtcbiAgICB0eXBlIE1vbmVyb1R4UHJpb3JpdHkgPSBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1R4UHJpb3JpdHk7XG4gICAgdHlwZSBNb25lcm9UeENvbmZpZyA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9UeENvbmZpZz47XG4gICAgdHlwZSBNb25lcm9TdWJhZGRyZXNzID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1N1YmFkZHJlc3M+O1xuICAgIHR5cGUgTW9uZXJvU3luY1Jlc3VsdCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9TeW5jUmVzdWx0PjtcbiAgICB0eXBlIE1vbmVyb1RyYW5zZmVyID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1RyYW5zZmVyPjtcbiAgICB0eXBlIE1vbmVyb0luY29taW5nVHJhbnNmZXIgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvSW5jb21pbmdUcmFuc2Zlcj47XG4gICAgdHlwZSBNb25lcm9PdXRnb2luZ1RyYW5zZmVyID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb091dGdvaW5nVHJhbnNmZXI+O1xuICAgIHR5cGUgTW9uZXJvVHJhbnNmZXJRdWVyeSA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9UcmFuc2ZlclF1ZXJ5PjtcbiAgICB0eXBlIE1vbmVyb1R4U2V0ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1R4U2V0PjtcbiAgICB0eXBlIE1vbmVyb1R4V2FsbGV0ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1R4V2FsbGV0PjtcbiAgICB0eXBlIE1vbmVyb1R4UXVlcnkgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvVHhRdWVyeT47XG4gICAgdHlwZSBNb25lcm9XYWxsZXRMaXN0ZW5lciA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9XYWxsZXRMaXN0ZW5lcj47XG4gICAgdHlwZSBNb25lcm9XYWxsZXRDb25maWcgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvV2FsbGV0Q29uZmlnPjtcbiAgICB0eXBlIE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlID0gaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZTtcbiAgICB0eXBlIE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdD47XG4gICAgdHlwZSBNb25lcm9Db25uZWN0aW9uTWFuYWdlckxpc3RlbmVyID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXI+O1xuICAgIHR5cGUgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXI+O1xuICAgIHR5cGUgTW9uZXJvRGFlbW9uID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0RhZW1vbj47XG4gICAgdHlwZSBNb25lcm9XYWxsZXQgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvV2FsbGV0PjtcbiAgICB0eXBlIE1vbmVyb0RhZW1vblJwYyA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9EYWVtb25ScGM+O1xuICAgIHR5cGUgTW9uZXJvV2FsbGV0UnBjID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1dhbGxldFJwYz47XG4gICAgdHlwZSBNb25lcm9XYWxsZXRLZXlzID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1dhbGxldEtleXM+O1xuICAgIHR5cGUgTW9uZXJvV2FsbGV0RnVsbCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9XYWxsZXRGdWxsPjtcbiAgICB0eXBlIE1vbmVyb1V0aWxzID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1V0aWxzPjtcbiAgICB0eXBlIFRocmVhZFBvb2wgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuVGhyZWFkUG9vbD47XG4gIH1cbn0iXSwibWFwcGluZ3MiOiJBQUFBLFlBQVk7O0FBRVo7O0FBRUE7O0FBRUE7QUFBQSxJQUFBQSxzQkFBQSxHQUFBQyxPQUFBLGlEQUFBQyxNQUFBLENBQUFDLGNBQUEsQ0FBQUMsT0FBQSxrQkFBQUMsS0FBQSxVQUFBSCxNQUFBLENBQUFDLGNBQUEsQ0FBQUMsT0FBQSxzQkFBQUUsVUFBQSxRQUFBQyxHQUFBLFdBQUFBLENBQUEsVUFBQUMsZUFBQSxDQUFBQyxPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLGNBQUFFLFVBQUEsUUFBQUMsR0FBQSxXQUFBQSxDQUFBLFVBQUFHLE9BQUEsQ0FBQUQsT0FBQSxNQUFBUCxNQUFBLENBQUFDLGNBQUEsQ0FBQUMsT0FBQSxnQkFBQUUsVUFBQSxRQUFBQyxHQUFBLFdBQUFBLENBQUEsVUFBQUksU0FBQSxDQUFBRixPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLGtCQUFBRSxVQUFBLFFBQUFDLEdBQUEsV0FBQUEsQ0FBQSxVQUFBSyxXQUFBLENBQUFILE9BQUEsTUFBQVAsTUFBQSxDQUFBQyxjQUFBLENBQUFDLE9BQUEsb0JBQUFFLFVBQUEsUUFBQUMsR0FBQSxXQUFBQSxDQUFBLFVBQUFNLGFBQUEsQ0FBQUosT0FBQSxNQUFBUCxNQUFBLENBQUFDLGNBQUEsQ0FBQUMsT0FBQSxxQkFBQUUsVUFBQSxRQUFBQyxHQUFBLFdBQUFBLENBQUEsVUFBQU8sY0FBQSxDQUFBTCxPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLHdCQUFBRSxVQUFBLFFBQUFDLEdBQUEsV0FBQUEsQ0FBQSxVQUFBUSxpQkFBQSxDQUFBTixPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLDhCQUFBRSxVQUFBLFFBQUFDLEdBQUEsV0FBQUEsQ0FBQSxVQUFBUyx1QkFBQSxDQUFBUCxPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLHNCQUFBRSxVQUFBLFFBQUFDLEdBQUEsV0FBQUEsQ0FBQSxVQUFBVSxlQUFBLENBQUFSLE9BQUEsTUFBQVAsTUFBQSxDQUFBQyxjQUFBLENBQUFDLE9BQUEsaUJBQUFFLFVBQUEsUUFBQUMsR0FBQSxXQUFBQSxDQUFBLFVBQUFXLFVBQUEsQ0FBQVQsT0FBQSxNQUFBUCxNQUFBLENBQUFDLGNBQUEsQ0FBQUMsT0FBQSxtQkFBQUUsVUFBQSxRQUFBQyxHQUFBLFdBQUFBLENBQUEsVUFBQVksWUFBQSxDQUFBVixPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLHlCQUFBRSxVQUFBLFFBQUFDLEdBQUEsV0FBQUEsQ0FBQSxVQUFBYSxrQkFBQSxDQUFBWCxPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLDJCQUFBRSxVQUFBLFFBQUFDLEdBQUEsV0FBQUEsQ0FBQSxVQUFBYyxvQkFBQSxDQUFBWixPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLG1CQUFBRSxVQUFBLFFBQUFDLEdBQUEsV0FBQUEsQ0FBQSxVQUFBZSxZQUFBLENBQUFiLE9BQUEsTUFBQVAsTUFBQSxDQUFBQyxjQUFBLENBQUFDLE9BQUEsMEJBQUFFLFVBQUEsUUFBQUMsR0FBQSxXQUFBQSxDQUFBLFVBQUFnQixtQkFBQSxDQUFBZCxPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLHFCQUFBRSxVQUFBLFFBQUFDLEdBQUEsV0FBQUEsQ0FBQSxVQUFBaUIsY0FBQSxDQUFBZixPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLCtCQUFBRSxVQUFBLFFBQUFDLEdBQUEsV0FBQUEsQ0FBQSxVQUFBa0Isd0JBQUEsQ0FBQWhCLE9BQUEsTUFBQVAsTUFBQSxDQUFBQyxjQUFBLENBQUFDLE9BQUEsdUNBQUFFLFVBQUEsUUFBQUMsR0FBQSxXQUFBQSxDQUFBLFVBQUFtQixnQ0FBQSxDQUFBakIsT0FBQSxNQUFBUCxNQUFBLENBQUFDLGNBQUEsQ0FBQUMsT0FBQSw0QkFBQUUsVUFBQSxRQUFBQyxHQUFBLFdBQUFBLENBQUEsVUFBQW9CLHFCQUFBLENBQUFsQixPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLG9CQUFBRSxVQUFBLFFBQUFDLEdBQUEsV0FBQUEsQ0FBQSxVQUFBcUIsYUFBQSxDQUFBbkIsT0FBQSxNQUFBUCxNQUFBLENBQUFDLGNBQUEsQ0FBQUMsT0FBQSwwQkFBQUUsVUFBQSxRQUFBQyxHQUFBLFdBQUFBLENBQUEsVUFBQXNCLG1CQUFBLENBQUFwQixPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLHdCQUFBRSxVQUFBLFFBQUFDLEdBQUEsV0FBQUEsQ0FBQSxVQUFBdUIsaUJBQUEsQ0FBQXJCLE9BQUEsTUFBQVAsTUFBQSxDQUFBQyxjQUFBLENBQUFDLE9BQUEsNEJBQUFFLFVBQUEsUUFBQUMsR0FBQSxXQUFBQSxDQUFBLFVBQUF3QixxQkFBQSxDQUFBdEIsT0FBQSxNQUFBUCxNQUFBLENBQUFDLGNBQUEsQ0FBQUMsT0FBQSx1QkFBQUUsVUFBQSxRQUFBQyxHQUFBLFdBQUFBLENBQUEsVUFBQXlCLGdCQUFBLENBQUF2QixPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLDRCQUFBRSxVQUFBLFFBQUFDLEdBQUEsV0FBQUEsQ0FBQSxVQUFBMEIscUJBQUEsQ0FBQXhCLE9BQUEsTUFBQVAsTUFBQSxDQUFBQyxjQUFBLENBQUFDLE9BQUEscUNBQUFFLFVBQUEsUUFBQUMsR0FBQSxXQUFBQSxDQUFBLFVBQUEyQiw4QkFBQSxDQUFBekIsT0FBQSxNQUFBUCxNQUFBLENBQUFDLGNBQUEsQ0FBQUMsT0FBQSx3Q0FBQUUsVUFBQSxRQUFBQyxHQUFBLFdBQUFBLENBQUEsVUFBQTRCLGlDQUFBLENBQUExQixPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLHlCQUFBRSxVQUFBLFFBQUFDLEdBQUEsV0FBQUEsQ0FBQSxVQUFBNkIsa0JBQUEsQ0FBQTNCLE9BQUEsTUFBQVAsTUFBQSxDQUFBQyxjQUFBLENBQUFDLE9BQUEsbUJBQUFFLFVBQUEsUUFBQUMsR0FBQSxXQUFBQSxDQUFBLFVBQUE4QixZQUFBLENBQUE1QixPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLHlCQUFBRSxVQUFBLFFBQUFDLEdBQUEsV0FBQUEsQ0FBQSxVQUFBK0Isa0JBQUEsQ0FBQTdCLE9BQUEsTUFBQVAsTUFBQSxDQUFBQyxjQUFBLENBQUFDLE9BQUEsMEJBQUFFLFVBQUEsUUFBQUMsR0FBQSxXQUFBQSxDQUFBLFVBQUFnQyxtQkFBQSxDQUFBOUIsT0FBQSxNQUFBUCxNQUFBLENBQUFDLGNBQUEsQ0FBQUMsT0FBQSw4QkFBQUUsVUFBQSxRQUFBQyxHQUFBLFdBQUFBLENBQUEsVUFBQWlDLHVCQUFBLENBQUEvQixPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLCtCQUFBRSxVQUFBLFFBQUFDLEdBQUEsV0FBQUEsQ0FBQSxVQUFBa0Msd0JBQUEsQ0FBQWhDLE9BQUEsTUFBQVAsTUFBQSxDQUFBQyxjQUFBLENBQUFDLE9BQUEsc0JBQUFFLFVBQUEsUUFBQUMsR0FBQSxXQUFBQSxDQUFBLFVBQUFtQyxlQUFBLENBQUFqQyxPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLGtDQUFBRSxVQUFBLFFBQUFDLEdBQUEsV0FBQUEsQ0FBQSxVQUFBb0MsMkJBQUEsQ0FBQWxDLE9BQUEsTUFBQVAsTUFBQSxDQUFBQyxjQUFBLENBQUFDLE9BQUEsa0NBQUFFLFVBQUEsUUFBQUMsR0FBQSxXQUFBQSxDQUFBLFVBQUFxQywyQkFBQSxDQUFBbkMsT0FBQSxNQUFBUCxNQUFBLENBQUFDLGNBQUEsQ0FBQUMsT0FBQSxpQ0FBQUUsVUFBQSxRQUFBQyxHQUFBLFdBQUFBLENBQUEsVUFBQXNDLDBCQUFBLENBQUFwQyxPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLG9DQUFBRSxVQUFBLFFBQUFDLEdBQUEsV0FBQUEsQ0FBQSxVQUFBdUMsNkJBQUEsQ0FBQXJDLE9BQUEsTUFBQVAsTUFBQSxDQUFBQyxjQUFBLENBQUFDLE9BQUEsa0NBQUFFLFVBQUEsUUFBQUMsR0FBQSxXQUFBQSxDQUFBLFVBQUF3QywyQkFBQSxDQUFBdEMsT0FBQSxNQUFBUCxNQUFBLENBQUFDLGNBQUEsQ0FBQUMsT0FBQSx3QkFBQUUsVUFBQSxRQUFBQyxHQUFBLFdBQUFBLENBQUEsVUFBQXlDLGlCQUFBLENBQUF2QyxPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLDBCQUFBRSxVQUFBLFFBQUFDLEdBQUEsV0FBQUEsQ0FBQSxVQUFBMEMsbUJBQUEsQ0FBQXhDLE9BQUEsTUFBQVAsTUFBQSxDQUFBQyxjQUFBLENBQUFDLE9BQUEsMEJBQUFFLFVBQUEsUUFBQUMsR0FBQSxXQUFBQSxDQUFBLFVBQUEyQyxtQkFBQSxDQUFBekMsT0FBQSxNQUFBUCxNQUFBLENBQUFDLGNBQUEsQ0FBQUMsT0FBQSxnQ0FBQUUsVUFBQSxRQUFBQyxHQUFBLFdBQUFBLENBQUEsVUFBQTRDLHlCQUFBLENBQUExQyxPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLGdDQUFBRSxVQUFBLFFBQUFDLEdBQUEsV0FBQUEsQ0FBQSxVQUFBNkMseUJBQUEsQ0FBQTNDLE9BQUEsTUFBQVAsTUFBQSxDQUFBQyxjQUFBLENBQUFDLE9BQUEseUJBQUFFLFVBQUEsUUFBQUMsR0FBQSxXQUFBQSxDQUFBLFVBQUE4QyxrQkFBQSxDQUFBNUMsT0FBQSxNQUFBUCxNQUFBLENBQUFDLGNBQUEsQ0FBQUMsT0FBQSw4QkFBQUUsVUFBQSxRQUFBQyxHQUFBLFdBQUFBLENBQUEsVUFBQStDLHVCQUFBLENBQUE3QyxPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLG9CQUFBRSxVQUFBLFFBQUFDLEdBQUEsV0FBQUEsQ0FBQSxVQUFBZ0QsYUFBQSxDQUFBOUMsT0FBQSxNQUFBUCxNQUFBLENBQUFDLGNBQUEsQ0FBQUMsT0FBQSxrQ0FBQUUsVUFBQSxRQUFBQyxHQUFBLFdBQUFBLENBQUEsVUFBQWlELDJCQUFBLENBQUEvQyxPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLHlCQUFBRSxVQUFBLFFBQUFDLEdBQUEsV0FBQUEsQ0FBQSxVQUFBa0Qsa0JBQUEsQ0FBQWhELE9BQUEsTUFBQVAsTUFBQSxDQUFBQyxjQUFBLENBQUFDLE9BQUEsMEJBQUFFLFVBQUEsUUFBQUMsR0FBQSxXQUFBQSxDQUFBLFVBQUFtRCxtQkFBQSxDQUFBakQsT0FBQSxNQUFBUCxNQUFBLENBQUFDLGNBQUEsQ0FBQUMsT0FBQSxrQkFBQUUsVUFBQSxRQUFBQyxHQUFBLFdBQUFBLENBQUEsVUFBQW9ELFdBQUEsQ0FBQWxELE9BQUEsTUFBQVAsTUFBQSxDQUFBQyxjQUFBLENBQUFDLE9BQUEseUJBQUFFLFVBQUEsUUFBQUMsR0FBQSxXQUFBQSxDQUFBLFVBQUFxRCxrQkFBQSxDQUFBbkQsT0FBQSxNQUFBUCxNQUFBLENBQUFDLGNBQUEsQ0FBQUMsT0FBQSwyQkFBQUUsVUFBQSxRQUFBQyxHQUFBLFdBQUFBLENBQUEsVUFBQXNELG9CQUFBLENBQUFwRCxPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLHNCQUFBRSxVQUFBLFFBQUFDLEdBQUEsV0FBQUEsQ0FBQSxVQUFBdUQsZUFBQSxDQUFBckQsT0FBQSxNQUFBUCxNQUFBLENBQUFDLGNBQUEsQ0FBQUMsT0FBQSx3QkFBQUUsVUFBQSxRQUFBQyxHQUFBLFdBQUFBLENBQUEsVUFBQXdELGlCQUFBLENBQUF0RCxPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLDRCQUFBRSxVQUFBLFFBQUFDLEdBQUEsV0FBQUEsQ0FBQSxVQUFBeUQscUJBQUEsQ0FBQXZELE9BQUEsTUFBQVAsTUFBQSxDQUFBQyxjQUFBLENBQUFDLE9BQUEsd0JBQUFFLFVBQUEsUUFBQUMsR0FBQSxXQUFBQSxDQUFBLFVBQUEwRCxpQkFBQSxDQUFBeEQsT0FBQSxNQUFBUCxNQUFBLENBQUFDLGNBQUEsQ0FBQUMsT0FBQSxzQkFBQUUsVUFBQSxRQUFBQyxHQUFBLFdBQUFBLENBQUEsVUFBQTJELGVBQUEsQ0FBQXpELE9BQUEsTUFBQVAsTUFBQSxDQUFBQyxjQUFBLENBQUFDLE9BQUEsMkJBQUFFLFVBQUEsUUFBQUMsR0FBQSxXQUFBQSxDQUFBLFVBQUE0RCxvQkFBQSxDQUFBMUQsT0FBQSxNQUFBUCxNQUFBLENBQUFDLGNBQUEsQ0FBQUMsT0FBQSxnQkFBQUUsVUFBQSxRQUFBQyxHQUFBLFdBQUFBLENBQUEsVUFBQTZELFNBQUEsQ0FBQTNELE9BQUEsTUFBQVAsTUFBQSxDQUFBQyxjQUFBLENBQUFDLE9BQUEsc0JBQUFFLFVBQUEsUUFBQUMsR0FBQSxXQUFBQSxDQUFBLFVBQUE4RCxlQUFBLENBQUE1RCxPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLHlCQUFBRSxVQUFBLFFBQUFDLEdBQUEsV0FBQUEsQ0FBQSxVQUFBK0Qsa0JBQUEsQ0FBQTdELE9BQUEsTUFBQVAsTUFBQSxDQUFBQyxjQUFBLENBQUFDLE9BQUEsd0JBQUFFLFVBQUEsUUFBQUMsR0FBQSxXQUFBQSxDQUFBLFVBQUFnRSxpQkFBQSxDQUFBOUQsT0FBQSxNQUFBUCxNQUFBLENBQUFDLGNBQUEsQ0FBQUMsT0FBQSxxQkFBQUUsVUFBQSxRQUFBQyxHQUFBLFdBQUFBLENBQUEsVUFBQWlFLGNBQUEsQ0FBQS9ELE9BQUEsTUFBQVAsTUFBQSxDQUFBQyxjQUFBLENBQUFDLE9BQUEsbUJBQUFFLFVBQUEsUUFBQUMsR0FBQSxXQUFBQSxDQUFBLFVBQUFrRSxZQUFBLENBQUFoRSxPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLHNCQUFBRSxVQUFBLFFBQUFDLEdBQUEsV0FBQUEsQ0FBQSxVQUFBbUUsZUFBQSxDQUFBakUsT0FBQSxNQUFBUCxNQUFBLENBQUFDLGNBQUEsQ0FBQUMsT0FBQSxtQkFBQUUsVUFBQSxRQUFBQyxHQUFBLFdBQUFBLENBQUEsVUFBQW9FLFlBQUEsQ0FBQWxFLE9BQUEsTUFBQVAsTUFBQSxDQUFBQyxjQUFBLENBQUFDLE9BQUEscUJBQUFFLFVBQUEsUUFBQUMsR0FBQSxXQUFBQSxDQUFBLFVBQUFxRSxjQUFBLENBQUFuRSxPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLG9CQUFBRSxVQUFBLFFBQUFDLEdBQUEsV0FBQUEsQ0FBQSxVQUFBc0UsYUFBQSxDQUFBcEUsT0FBQSxNQUFBUCxNQUFBLENBQUFDLGNBQUEsQ0FBQUMsT0FBQSwwQkFBQUUsVUFBQSxRQUFBQyxHQUFBLFdBQUFBLENBQUEsVUFBQXVFLG1CQUFBLENBQUFyRSxPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLHdCQUFBRSxVQUFBLFFBQUFDLEdBQUEsV0FBQUEsQ0FBQSxVQUFBd0UsaUJBQUEsQ0FBQXRFLE9BQUEsTUFBQVAsTUFBQSxDQUFBQyxjQUFBLENBQUFDLE9BQUEsd0JBQUFFLFVBQUEsUUFBQUMsR0FBQSxXQUFBQSxDQUFBLFVBQUF5RSxpQkFBQSxDQUFBQyxnQkFBQSxNQUFBL0UsTUFBQSxDQUFBQyxjQUFBLENBQUFDLE9BQUEsNEJBQUFFLFVBQUEsUUFBQUMsR0FBQSxXQUFBQSxDQUFBLFVBQUEyRSxxQkFBQSxDQUFBekUsT0FBQSxNQUFBUCxNQUFBLENBQUFDLGNBQUEsQ0FBQUMsT0FBQSx1QkFBQUUsVUFBQSxRQUFBQyxHQUFBLFdBQUFBLENBQUEsVUFBQTRFLGdCQUFBLENBQUExRSxPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLGtCQUFBRSxVQUFBLFFBQUFDLEdBQUEsV0FBQUEsQ0FBQSxVQUFBNkUsV0FBQSxDQUFBM0UsT0FBQSxNQUFBUCxNQUFBLENBQUFDLGNBQUEsQ0FBQUMsT0FBQSxrQkFBQUUsVUFBQSxRQUFBQyxHQUFBLFdBQUFBLENBQUEsVUFBQThFLFdBQUEsQ0FBQTVFLE9BQUEsTUFBQVAsTUFBQSxDQUFBQyxjQUFBLENBQUFDLE9BQUEsa0JBQUFFLFVBQUEsUUFBQUMsR0FBQSxXQUFBQSxDQUFBLFVBQUErRSxXQUFBLENBQUE3RSxPQUFBLE1BQUFMLE9BQUEsQ0FBQW1GLGtCQUFBLEdBQUFBLGtCQUFBLENBQUFuRixPQUFBLENBQUFvRixrQkFBQSxHQUFBQSxrQkFBQSxDQUFBcEYsT0FBQSxDQUFBcUYsZ0JBQUEsR0FBQUEsZ0JBQUEsQ0FBQXJGLE9BQUEsQ0FBQXNGLGdCQUFBLEdBQUFBLGdCQUFBLENBQUF0RixPQUFBLENBQUFLLE9BQUEsVUFBQUwsT0FBQSxDQUFBdUYsVUFBQSxHQUFBQSxVQUFBLENBQUF2RixPQUFBLENBQUF3RixjQUFBLEdBQUFBLGNBQUEsQ0FBQXhGLE9BQUEsQ0FBQXlGLFFBQUEsR0FBQUEsUUFBQSxDQUNBLElBQUFsRixTQUFBLEdBQUFYLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBUyxPQUFBLEdBQUFWLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBb0MsWUFBQSxHQUFBckMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFXLFdBQUEsR0FBQVosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFZLGFBQUEsR0FBQWIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUE0RCxvQkFBQSxHQUFBN0Qsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUE2RCxlQUFBLEdBQUE5RCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQW1GLFdBQUEsR0FBQXBGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBb0YsV0FBQSxHQUFBckYsc0JBQUEsQ0FBQUMsT0FBQTs7O0FBR0EsSUFBQU8sZUFBQSxHQUFBUixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWdCLGVBQUEsR0FBQWpCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBaUIsVUFBQSxHQUFBbEIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFtQixrQkFBQSxHQUFBcEIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFrQixZQUFBLEdBQUFuQixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQW9CLG9CQUFBLEdBQUFyQixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQTBCLHFCQUFBLEdBQUEzQixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQTRCLG1CQUFBLEdBQUE3QixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQTZCLGlCQUFBLEdBQUE5QixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQThCLHFCQUFBLEdBQUEvQixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWdDLHFCQUFBLEdBQUFqQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWlDLDhCQUFBLEdBQUFsQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWtDLGlDQUFBLEdBQUFuQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQXFDLGtCQUFBLEdBQUF0QyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQXNDLG1CQUFBLEdBQUF2QyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQXlDLGVBQUEsR0FBQTFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBNEMsMEJBQUEsR0FBQTdDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBK0MsaUJBQUEsR0FBQWhELHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBZ0QsbUJBQUEsR0FBQWpELHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBb0Qsa0JBQUEsR0FBQXJELHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBc0QsYUFBQSxHQUFBdkQsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUF1RCwyQkFBQSxHQUFBeEQsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUErRCxxQkFBQSxHQUFBaEUsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFtRSxTQUFBLEdBQUFwRSxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQXFFLGtCQUFBLEdBQUF0RSxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQTJFLGNBQUEsR0FBQTVFLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBMEQsV0FBQSxHQUFBM0Qsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUEyRCxrQkFBQSxHQUFBNUQsc0JBQUEsQ0FBQUMsT0FBQTs7O0FBR0EsSUFBQWEsY0FBQSxHQUFBZCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWMsaUJBQUEsR0FBQWYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFlLHVCQUFBLEdBQUFoQixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQXFCLFlBQUEsR0FBQXRCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBc0IsbUJBQUEsR0FBQXZCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBdUIsY0FBQSxHQUFBeEIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFtQyxrQkFBQSxHQUFBcEMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUF3Qyx3QkFBQSxHQUFBekMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUEwQywyQkFBQSxHQUFBM0Msc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUEyQywyQkFBQSxHQUFBNUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFpRCxtQkFBQSxHQUFBbEQsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFrRCx5QkFBQSxHQUFBbkQsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFtRCx5QkFBQSxHQUFBcEQsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUF5RCxtQkFBQSxHQUFBMUQsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUF3RCxrQkFBQSxHQUFBekQsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFzRSxpQkFBQSxHQUFBdkUsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFvRSxlQUFBLEdBQUFyRSxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQThELGlCQUFBLEdBQUEvRCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWdFLGlCQUFBLEdBQUFqRSxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQWlFLGVBQUEsR0FBQWxFLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBdUMsdUJBQUEsR0FBQXhDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBcUQsdUJBQUEsR0FBQXRELHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBa0Usb0JBQUEsR0FBQW5FLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBd0UsWUFBQSxHQUFBekUsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUF5RSxlQUFBLEdBQUExRSxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQXVFLGNBQUEsR0FBQXhFLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBaUYscUJBQUEsR0FBQWxGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBNkUsbUJBQUEsR0FBQTlFLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBOEMsMkJBQUEsR0FBQS9DLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBNkMsNkJBQUEsR0FBQTlDLHNCQUFBLENBQUFDLE9BQUE7OztBQUdBLElBQUF3Qix3QkFBQSxHQUFBekIsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUF5QixnQ0FBQSxHQUFBMUIsc0JBQUEsQ0FBQUMsT0FBQTs7O0FBR0EsSUFBQTJCLGFBQUEsR0FBQTVCLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBNEUsYUFBQSxHQUFBN0Usc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUErQixnQkFBQSxHQUFBaEMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFrRixnQkFBQSxHQUFBbkYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUErRSxpQkFBQSxHQUFBL0UsT0FBQTtBQUNBLElBQUE4RSxpQkFBQSxHQUFBL0Usc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUEwRSxZQUFBLEdBQUEzRSxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQXFGLFdBQUEsR0FBQXRGLHNCQUFBLENBQUFDLE9BQUEscUNBQXlELENBMUV6RDtBQThCQTtBQWdDQTtBQUlBO0FBVUE7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQ0EsU0FBUzBGLFVBQVVBLENBQUEsRUFBRztFQUNwQixPQUFPRyxvQkFBVyxDQUFDSCxVQUFVLENBQUMsQ0FBQztBQUNqQzs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBU0osa0JBQWtCQSxDQUFDUSxXQUEyRixFQUFFQyxRQUFpQixFQUFFQyxRQUFpQixFQUE0QjtFQUN2TCxPQUFPQyx3QkFBZSxDQUFDWCxrQkFBa0IsQ0FBQ1EsV0FBVyxFQUFFQyxRQUFRLEVBQUVDLFFBQVEsQ0FBQztBQUM1RTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTVCxrQkFBa0JBLENBQUNPLFdBQTJGLEVBQUVDLFFBQWlCLEVBQUVDLFFBQWlCLEVBQTRCO0VBQ3ZMLE9BQU9FLHdCQUFlLENBQUNYLGtCQUFrQixDQUFDTyxXQUFXLEVBQUVDLFFBQVEsRUFBRUMsUUFBUSxDQUFDO0FBQzVFOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTUixnQkFBZ0JBLENBQUNXLE1BQW1DLEVBQTZCO0VBQ3hGLE9BQU9DLHlCQUFnQixDQUFDQyxZQUFZLENBQUMsSUFBSUMsMkJBQWtCLENBQUNILE1BQU0sQ0FBQyxDQUFDO0FBQ3RFOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTUixjQUFjQSxDQUFDUSxNQUFtQyxFQUE2QjtFQUN0RixPQUFPQyx5QkFBZ0IsQ0FBQ0csVUFBVSxDQUFDLElBQUlELDJCQUFrQixDQUFDSCxNQUFNLENBQUMsQ0FBQztBQUNwRTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBU1YsZ0JBQWdCQSxDQUFDVSxNQUFtQyxFQUE2QjtFQUN4RixPQUFPbkIsa0NBQWdCLENBQUNxQixZQUFZLENBQUMsSUFBSUMsMkJBQWtCLENBQUNILE1BQU0sQ0FBQyxDQUFDO0FBQ3RFOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTUCxRQUFRQSxDQUFBLEVBQWtCO0VBQ2pDLE9BQU9ZLHFCQUFZLENBQUNDLGVBQWUsQ0FBQyxDQUFDO0FBQ3ZDOztBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE2RkE7QUFDQSxNQUFNQyxRQUFRLEdBQUc7RUFDZkMsUUFBUSxFQUFSQSxpQkFBUTtFQUNSQyxNQUFNLEVBQU5BLGVBQU07RUFDTkMsV0FBVyxFQUFYQSxvQkFBVztFQUNYQyxVQUFVLEVBQVZBLG1CQUFVO0VBQ1ZOLFlBQVksRUFBWkEscUJBQVk7RUFDWk8sbUJBQW1CLEVBQW5CQSw0QkFBbUI7RUFDbkJDLGNBQWMsRUFBZEEsdUJBQWM7RUFDZEMsVUFBVSxFQUFWQSxtQkFBVTtFQUNWQyxVQUFVLEVBQVZBLG1CQUFVO0VBQ1ZDLGNBQWMsRUFBZEEsdUJBQWM7RUFDZEMsY0FBYyxFQUFkQSx1QkFBYztFQUNkQyxTQUFTLEVBQVRBLGtCQUFTO0VBQ1RDLGlCQUFpQixFQUFqQkEsMEJBQWlCO0VBQ2pCQyxXQUFXLEVBQVhBLG9CQUFXO0VBQ1hDLG1CQUFtQixFQUFuQkEsNEJBQW1CO0VBQ25CQyxvQkFBb0IsRUFBcEJBLDZCQUFvQjtFQUNwQkMsa0JBQWtCLEVBQWxCQSwyQkFBa0I7RUFDbEJDLGdCQUFnQixFQUFoQkEseUJBQWdCO0VBQ2hCQyxvQkFBb0IsRUFBcEJBLDZCQUFvQjtFQUNwQkMsb0JBQW9CLEVBQXBCQSw2QkFBb0I7RUFDcEJDLDZCQUE2QixFQUE3QkEsc0NBQTZCO0VBQzdCQyxnQ0FBZ0MsRUFBaENBLHlDQUFnQztFQUNoQ0MsaUJBQWlCLEVBQWpCQSwwQkFBaUI7RUFDakJDLGtCQUFrQixFQUFsQkEsMkJBQWtCO0VBQ2xCQyxjQUFjLEVBQWRBLHVCQUFjO0VBQ2RDLHlCQUF5QixFQUF6QkEsa0NBQXlCO0VBQ3pCQyxnQkFBZ0IsRUFBaEJBLHlCQUFnQjtFQUNoQkMsa0JBQWtCLEVBQWxCQSwyQkFBa0I7RUFDbEJDLGlCQUFpQixFQUFqQkEsMEJBQWlCO0VBQ2pCQyxZQUFZLEVBQVpBLHFCQUFZO0VBQ1pDLDBCQUEwQixFQUExQkEsbUNBQTBCO0VBQzFCQyxvQkFBb0IsRUFBcEJBLDZCQUFvQjtFQUNwQkMsUUFBUSxFQUFSQSxpQkFBUTtFQUNSQyxpQkFBaUIsRUFBakJBLDBCQUFpQjtFQUNqQkMsYUFBYSxFQUFiQSxzQkFBYTtFQUNiQyxVQUFVLEVBQVZBLG1CQUFVO0VBQ1ZDLGlCQUFpQixFQUFqQkEsMEJBQWlCO0VBQ2pCQyxhQUFhLEVBQWJBLHNCQUFhO0VBQ2JDLGdCQUFnQixFQUFoQkEseUJBQWdCO0VBQ2hCQyxzQkFBc0IsRUFBdEJBLCtCQUFzQjtFQUN0QkMsV0FBVyxFQUFYQSxvQkFBVztFQUNYQyxrQkFBa0IsRUFBbEJBLDJCQUFrQjtFQUNsQkMsYUFBYSxFQUFiQSxzQkFBYTtFQUNiQyxpQkFBaUIsRUFBakJBLDBCQUFpQjtFQUNqQkMsdUJBQXVCLEVBQXZCQSxnQ0FBdUI7RUFDdkJDLDBCQUEwQixFQUExQkEsbUNBQTBCO0VBQzFCQywwQkFBMEIsRUFBMUJBLG1DQUEwQjtFQUMxQkMsa0JBQWtCLEVBQWxCQSwyQkFBa0I7RUFDbEJDLHdCQUF3QixFQUF4QkEsaUNBQXdCO0VBQ3hCQyx3QkFBd0IsRUFBeEJBLGlDQUF3QjtFQUN4QkMsa0JBQWtCLEVBQWxCQSwyQkFBa0I7RUFDbEJDLGlCQUFpQixFQUFqQkEsMEJBQWlCO0VBQ2pCQyxnQkFBZ0IsRUFBaEJBLHlCQUFnQjtFQUNoQkMsY0FBYyxFQUFkQSx1QkFBYztFQUNkQyxnQkFBZ0IsRUFBaEJBLHlCQUFnQjtFQUNoQkMsZ0JBQWdCLEVBQWhCQSx5QkFBZ0I7RUFDaEJDLGNBQWMsRUFBZEEsdUJBQWM7RUFDZEMsc0JBQXNCLEVBQXRCQSwrQkFBc0I7RUFDdEJDLHNCQUFzQixFQUF0QkEsK0JBQXNCO0VBQ3RCQyxtQkFBbUIsRUFBbkJBLDRCQUFtQjtFQUNuQkMsV0FBVyxFQUFYQSxvQkFBVztFQUNYQyxjQUFjLEVBQWRBLHVCQUFjO0VBQ2RDLGFBQWEsRUFBYkEsc0JBQWE7RUFDYkMsb0JBQW9CLEVBQXBCQSw2QkFBb0I7RUFDcEJuRSxrQkFBa0IsRUFBbEJBLDJCQUFrQjtFQUNsQm9FLDBCQUEwQixFQUExQkEsbUNBQTBCO0VBQzFCQyw0QkFBNEIsRUFBNUJBLHFDQUE0QjtFQUM1QkMsK0JBQStCLEVBQS9CQSx3Q0FBK0I7RUFDL0JDLHVCQUF1QixFQUF2QkEsZ0NBQXVCO0VBQ3ZCQyxZQUFZLEVBQVpBLHFCQUFZO0VBQ1pDLFlBQVksRUFBWkEscUJBQVk7RUFDWjlFLGVBQWUsRUFBZkEsd0JBQWU7RUFDZkMsZUFBZSxFQUFmQSx3QkFBZTtFQUNmbEIsZ0JBQWdCLEVBQWhCQSxrQ0FBZ0I7RUFDaEJvQixnQkFBZ0IsRUFBaEJBLHlCQUFnQjtFQUNoQlAsV0FBVyxFQUFYQSxvQkFBVztFQUNYbUYsVUFBVSxFQUFWQSxtQkFBVTs7RUFFVjtFQUNBdEYsVUFBVTtFQUNWSixrQkFBa0I7RUFDbEJDLGtCQUFrQjtFQUNsQkMsZ0JBQWdCO0VBQ2hCRyxjQUFjO0VBQ2RGLGdCQUFnQjtFQUNoQkc7QUFDRixDQUFDLEtBQUFxRixRQUFBLEdBQUE5SyxPQUFBLENBQUFLLE9BQUE7QUFDY2tHLFFBQVE7O0FBRXZCIn0=