'use strict';

// --------------------------------- IMPORTS ----------------------------------

// See the full model specification: https://woodser.github.io/monero-java/monero-spec.pdf

// import common models
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });Object.defineProperty(exports, "ConnectionType", { enumerable: true, get: function () {return _ConnectionType.default;} });Object.defineProperty(exports, "Filter", { enumerable: true, get: function () {return _Filter.default;} });Object.defineProperty(exports, "GenUtils", { enumerable: true, get: function () {return _GenUtils.default;} });Object.defineProperty(exports, "HttpClient", { enumerable: true, get: function () {return _HttpClient.default;} });Object.defineProperty(exports, "LibraryUtils", { enumerable: true, get: function () {return _LibraryUtils.default;} });Object.defineProperty(exports, "MoneroAccount", { enumerable: true, get: function () {return _MoneroAccount.default;} });Object.defineProperty(exports, "MoneroAccountTag", { enumerable: true, get: function () {return _MoneroAccountTag.default;} });Object.defineProperty(exports, "MoneroAddressBookEntry", { enumerable: true, get: function () {return _MoneroAddressBookEntry.default;} });Object.defineProperty(exports, "MoneroAltChain", { enumerable: true, get: function () {return _MoneroAltChain.default;} });Object.defineProperty(exports, "MoneroBan", { enumerable: true, get: function () {return _MoneroBan.default;} });Object.defineProperty(exports, "MoneroBlock", { enumerable: true, get: function () {return _MoneroBlock.default;} });Object.defineProperty(exports, "MoneroBlockHeader", { enumerable: true, get: function () {return _MoneroBlockHeader.default;} });Object.defineProperty(exports, "MoneroBlockTemplate", { enumerable: true, get: function () {return _MoneroBlockTemplate.default;} });Object.defineProperty(exports, "MoneroCheck", { enumerable: true, get: function () {return _MoneroCheck.default;} });Object.defineProperty(exports, "MoneroCheckReserve", { enumerable: true, get: function () {return _MoneroCheckReserve.default;} });Object.defineProperty(exports, "MoneroCheckTx", { enumerable: true, get: function () {return _MoneroCheckTx.default;} });Object.defineProperty(exports, "MoneroConnectionManager", { enumerable: true, get: function () {return _MoneroConnectionManager.default;} });Object.defineProperty(exports, "MoneroConnectionManagerListener", { enumerable: true, get: function () {return _MoneroConnectionManagerListener.default;} });Object.defineProperty(exports, "MoneroConnectionSpan", { enumerable: true, get: function () {return _MoneroConnectionSpan.default;} });Object.defineProperty(exports, "MoneroDaemon", { enumerable: true, get: function () {return _MoneroDaemon.default;} });Object.defineProperty(exports, "MoneroDaemonConfig", { enumerable: true, get: function () {return _MoneroDaemonConfig.default;} });Object.defineProperty(exports, "MoneroDaemonInfo", { enumerable: true, get: function () {return _MoneroDaemonInfo.default;} });Object.defineProperty(exports, "MoneroDaemonListener", { enumerable: true, get: function () {return _MoneroDaemonListener.default;} });Object.defineProperty(exports, "MoneroDaemonRpc", { enumerable: true, get: function () {return _MoneroDaemonRpc.default;} });Object.defineProperty(exports, "MoneroDaemonSyncInfo", { enumerable: true, get: function () {return _MoneroDaemonSyncInfo.default;} });Object.defineProperty(exports, "MoneroDaemonUpdateCheckResult", { enumerable: true, get: function () {return _MoneroDaemonUpdateCheckResult.default;} });Object.defineProperty(exports, "MoneroDaemonUpdateDownloadResult", { enumerable: true, get: function () {return _MoneroDaemonUpdateDownloadResult.default;} });Object.defineProperty(exports, "MoneroDestination", { enumerable: true, get: function () {return _MoneroDestination.default;} });Object.defineProperty(exports, "MoneroError", { enumerable: true, get: function () {return _MoneroError.default;} });Object.defineProperty(exports, "MoneroFeeEstimate", { enumerable: true, get: function () {return _MoneroFeeEstimate.default;} });Object.defineProperty(exports, "MoneroHardForkInfo", { enumerable: true, get: function () {return _MoneroHardForkInfo.default;} });Object.defineProperty(exports, "MoneroIncomingTransfer", { enumerable: true, get: function () {return _MoneroIncomingTransfer.default;} });Object.defineProperty(exports, "MoneroIntegratedAddress", { enumerable: true, get: function () {return _MoneroIntegratedAddress.default;} });Object.defineProperty(exports, "MoneroKeyImage", { enumerable: true, get: function () {return _MoneroKeyImage.default;} });Object.defineProperty(exports, "MoneroKeyImageImportResult", { enumerable: true, get: function () {return _MoneroKeyImageImportResult.default;} });Object.defineProperty(exports, "MoneroKeyImageSpentStatus", { enumerable: true, get: function () {return _MoneroKeyImageSpentStatus.default;} });Object.defineProperty(exports, "MoneroMessageSignatureResult", { enumerable: true, get: function () {return _MoneroMessageSignatureResult.default;} });Object.defineProperty(exports, "MoneroMessageSignatureType", { enumerable: true, get: function () {return _MoneroMessageSignatureType.default;} });Object.defineProperty(exports, "MoneroMinerTxSum", { enumerable: true, get: function () {return _MoneroMinerTxSum.default;} });Object.defineProperty(exports, "MoneroMiningStatus", { enumerable: true, get: function () {return _MoneroMiningStatus.default;} });Object.defineProperty(exports, "MoneroMultisigInfo", { enumerable: true, get: function () {return _MoneroMultisigInfo.default;} });Object.defineProperty(exports, "MoneroMultisigInitResult", { enumerable: true, get: function () {return _MoneroMultisigInitResult.default;} });Object.defineProperty(exports, "MoneroMultisigSignResult", { enumerable: true, get: function () {return _MoneroMultisigSignResult.default;} });Object.defineProperty(exports, "MoneroNetworkType", { enumerable: true, get: function () {return _MoneroNetworkType.default;} });Object.defineProperty(exports, "MoneroOutgoingTransfer", { enumerable: true, get: function () {return _MoneroOutgoingTransfer.default;} });Object.defineProperty(exports, "MoneroOutput", { enumerable: true, get: function () {return _MoneroOutput.default;} });Object.defineProperty(exports, "MoneroOutputHistogramEntry", { enumerable: true, get: function () {return _MoneroOutputHistogramEntry.default;} });Object.defineProperty(exports, "MoneroOutputQuery", { enumerable: true, get: function () {return _MoneroOutputQuery.default;} });Object.defineProperty(exports, "MoneroOutputWallet", { enumerable: true, get: function () {return _MoneroOutputWallet.default;} });Object.defineProperty(exports, "MoneroPeer", { enumerable: true, get: function () {return _MoneroPeer.default;} });Object.defineProperty(exports, "MoneroPruneResult", { enumerable: true, get: function () {return _MoneroPruneResult.default;} });Object.defineProperty(exports, "MoneroRpcConnection", { enumerable: true, get: function () {return _MoneroRpcConnection.default;} });Object.defineProperty(exports, "MoneroRpcError", { enumerable: true, get: function () {return _MoneroRpcError.default;} });Object.defineProperty(exports, "MoneroSubaddress", { enumerable: true, get: function () {return _MoneroSubaddress.default;} });Object.defineProperty(exports, "MoneroSubmitTxResult", { enumerable: true, get: function () {return _MoneroSubmitTxResult.default;} });Object.defineProperty(exports, "MoneroSyncResult", { enumerable: true, get: function () {return _MoneroSyncResult.default;} });Object.defineProperty(exports, "MoneroTransfer", { enumerable: true, get: function () {return _MoneroTransfer.default;} });Object.defineProperty(exports, "MoneroTransferQuery", { enumerable: true, get: function () {return _MoneroTransferQuery.default;} });Object.defineProperty(exports, "MoneroTx", { enumerable: true, get: function () {return _MoneroTx.default;} });Object.defineProperty(exports, "MoneroTxConfig", { enumerable: true, get: function () {return _MoneroTxConfig.default;} });Object.defineProperty(exports, "MoneroTxPoolStats", { enumerable: true, get: function () {return _MoneroTxPoolStats.default;} });Object.defineProperty(exports, "MoneroTxPriority", { enumerable: true, get: function () {return _MoneroTxPriority.default;} });Object.defineProperty(exports, "MoneroTxQuery", { enumerable: true, get: function () {return _MoneroTxQuery.default;} });Object.defineProperty(exports, "MoneroTxSet", { enumerable: true, get: function () {return _MoneroTxSet.default;} });Object.defineProperty(exports, "MoneroTxWallet", { enumerable: true, get: function () {return _MoneroTxWallet.default;} });Object.defineProperty(exports, "MoneroUtils", { enumerable: true, get: function () {return _MoneroUtils.default;} });Object.defineProperty(exports, "MoneroVersion", { enumerable: true, get: function () {return _MoneroVersion.default;} });Object.defineProperty(exports, "MoneroWallet", { enumerable: true, get: function () {return _MoneroWallet.default;} });Object.defineProperty(exports, "MoneroWalletConfig", { enumerable: true, get: function () {return _MoneroWalletConfig.default;} });Object.defineProperty(exports, "MoneroWalletFull", { enumerable: true, get: function () {return _MoneroWalletFull.default;} });Object.defineProperty(exports, "MoneroWalletKeys", { enumerable: true, get: function () {return _MoneroWalletKeys.MoneroWalletKeys;} });Object.defineProperty(exports, "MoneroWalletListener", { enumerable: true, get: function () {return _MoneroWalletListener.default;} });Object.defineProperty(exports, "MoneroWalletRpc", { enumerable: true, get: function () {return _MoneroWalletRpc.default;} });Object.defineProperty(exports, "SslOptions", { enumerable: true, get: function () {return _SslOptions.default;} });Object.defineProperty(exports, "TaskLooper", { enumerable: true, get: function () {return _TaskLooper.default;} });Object.defineProperty(exports, "ThreadPool", { enumerable: true, get: function () {return _ThreadPool.default;} });exports.connectToDaemonRpc = connectToDaemonRpc;exports.connectToWalletRpc = connectToWalletRpc;exports.createWalletFull = createWalletFull;exports.createWalletKeys = createWalletKeys;exports.default = void 0;exports.getVersion = getVersion;exports.openWalletFull = openWalletFull;exports.shutdown = shutdown;var _GenUtils = _interopRequireDefault(require("./src/main/ts/common/GenUtils"));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIk9iamVjdCIsImRlZmluZVByb3BlcnR5IiwiZXhwb3J0cyIsInZhbHVlIiwiZW51bWVyYWJsZSIsImdldCIsIl9Db25uZWN0aW9uVHlwZSIsImRlZmF1bHQiLCJfRmlsdGVyIiwiX0dlblV0aWxzIiwiX0h0dHBDbGllbnQiLCJfTGlicmFyeVV0aWxzIiwiX01vbmVyb0FjY291bnQiLCJfTW9uZXJvQWNjb3VudFRhZyIsIl9Nb25lcm9BZGRyZXNzQm9va0VudHJ5IiwiX01vbmVyb0FsdENoYWluIiwiX01vbmVyb0JhbiIsIl9Nb25lcm9CbG9jayIsIl9Nb25lcm9CbG9ja0hlYWRlciIsIl9Nb25lcm9CbG9ja1RlbXBsYXRlIiwiX01vbmVyb0NoZWNrIiwiX01vbmVyb0NoZWNrUmVzZXJ2ZSIsIl9Nb25lcm9DaGVja1R4IiwiX01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyIiwiX01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIiLCJfTW9uZXJvQ29ubmVjdGlvblNwYW4iLCJfTW9uZXJvRGFlbW9uIiwiX01vbmVyb0RhZW1vbkNvbmZpZyIsIl9Nb25lcm9EYWVtb25JbmZvIiwiX01vbmVyb0RhZW1vbkxpc3RlbmVyIiwiX01vbmVyb0RhZW1vblJwYyIsIl9Nb25lcm9EYWVtb25TeW5jSW5mbyIsIl9Nb25lcm9EYWVtb25VcGRhdGVDaGVja1Jlc3VsdCIsIl9Nb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdCIsIl9Nb25lcm9EZXN0aW5hdGlvbiIsIl9Nb25lcm9FcnJvciIsIl9Nb25lcm9GZWVFc3RpbWF0ZSIsIl9Nb25lcm9IYXJkRm9ya0luZm8iLCJfTW9uZXJvSW5jb21pbmdUcmFuc2ZlciIsIl9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsIl9Nb25lcm9LZXlJbWFnZSIsIl9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCIsIl9Nb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQiLCJfTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUiLCJfTW9uZXJvTWluZXJUeFN1bSIsIl9Nb25lcm9NaW5pbmdTdGF0dXMiLCJfTW9uZXJvTXVsdGlzaWdJbmZvIiwiX01vbmVyb011bHRpc2lnSW5pdFJlc3VsdCIsIl9Nb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQiLCJfTW9uZXJvTmV0d29ya1R5cGUiLCJfTW9uZXJvT3V0Z29pbmdUcmFuc2ZlciIsIl9Nb25lcm9PdXRwdXQiLCJfTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkiLCJfTW9uZXJvT3V0cHV0UXVlcnkiLCJfTW9uZXJvT3V0cHV0V2FsbGV0IiwiX01vbmVyb1BlZXIiLCJfTW9uZXJvUHJ1bmVSZXN1bHQiLCJfTW9uZXJvUnBjQ29ubmVjdGlvbiIsIl9Nb25lcm9ScGNFcnJvciIsIl9Nb25lcm9TdWJhZGRyZXNzIiwiX01vbmVyb1N1Ym1pdFR4UmVzdWx0IiwiX01vbmVyb1N5bmNSZXN1bHQiLCJfTW9uZXJvVHJhbnNmZXIiLCJfTW9uZXJvVHJhbnNmZXJRdWVyeSIsIl9Nb25lcm9UeCIsIl9Nb25lcm9UeENvbmZpZyIsIl9Nb25lcm9UeFBvb2xTdGF0cyIsIl9Nb25lcm9UeFByaW9yaXR5IiwiX01vbmVyb1R4UXVlcnkiLCJfTW9uZXJvVHhTZXQiLCJfTW9uZXJvVHhXYWxsZXQiLCJfTW9uZXJvVXRpbHMiLCJfTW9uZXJvVmVyc2lvbiIsIl9Nb25lcm9XYWxsZXQiLCJfTW9uZXJvV2FsbGV0Q29uZmlnIiwiX01vbmVyb1dhbGxldEZ1bGwiLCJfTW9uZXJvV2FsbGV0S2V5cyIsIk1vbmVyb1dhbGxldEtleXMiLCJfTW9uZXJvV2FsbGV0TGlzdGVuZXIiLCJfTW9uZXJvV2FsbGV0UnBjIiwiX1NzbE9wdGlvbnMiLCJfVGFza0xvb3BlciIsIl9UaHJlYWRQb29sIiwiY29ubmVjdFRvRGFlbW9uUnBjIiwiY29ubmVjdFRvV2FsbGV0UnBjIiwiY3JlYXRlV2FsbGV0RnVsbCIsImNyZWF0ZVdhbGxldEtleXMiLCJnZXRWZXJzaW9uIiwib3BlbldhbGxldEZ1bGwiLCJzaHV0ZG93biIsIk1vbmVyb1V0aWxzIiwidXJpT3JDb25maWciLCJ1c2VybmFtZSIsInBhc3N3b3JkIiwiTW9uZXJvRGFlbW9uUnBjIiwiTW9uZXJvV2FsbGV0UnBjIiwiY29uZmlnIiwiTW9uZXJvV2FsbGV0RnVsbCIsImNyZWF0ZVdhbGxldCIsIk1vbmVyb1dhbGxldENvbmZpZyIsIm9wZW5XYWxsZXQiLCJMaWJyYXJ5VXRpbHMiLCJ0ZXJtaW5hdGVXb3JrZXIiLCJtb25lcm9UcyIsIkdlblV0aWxzIiwiRmlsdGVyIiwiTW9uZXJvRXJyb3IiLCJIdHRwQ2xpZW50IiwiTW9uZXJvUnBjQ29ubmVjdGlvbiIsIk1vbmVyb1JwY0Vycm9yIiwiU3NsT3B0aW9ucyIsIlRhc2tMb29wZXIiLCJDb25uZWN0aW9uVHlwZSIsIk1vbmVyb0FsdENoYWluIiwiTW9uZXJvQmFuIiwiTW9uZXJvQmxvY2tIZWFkZXIiLCJNb25lcm9CbG9jayIsIk1vbmVyb0Jsb2NrVGVtcGxhdGUiLCJNb25lcm9Db25uZWN0aW9uU3BhbiIsIk1vbmVyb0RhZW1vbkNvbmZpZyIsIk1vbmVyb0RhZW1vbkluZm8iLCJNb25lcm9EYWVtb25MaXN0ZW5lciIsIk1vbmVyb0RhZW1vblN5bmNJbmZvIiwiTW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQiLCJNb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdCIsIk1vbmVyb0ZlZUVzdGltYXRlIiwiTW9uZXJvSGFyZEZvcmtJbmZvIiwiTW9uZXJvS2V5SW1hZ2UiLCJNb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzIiwiTW9uZXJvTWluZXJUeFN1bSIsIk1vbmVyb01pbmluZ1N0YXR1cyIsIk1vbmVyb05ldHdvcmtUeXBlIiwiTW9uZXJvT3V0cHV0IiwiTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkiLCJNb25lcm9TdWJtaXRUeFJlc3VsdCIsIk1vbmVyb1R4IiwiTW9uZXJvVHhQb29sU3RhdHMiLCJNb25lcm9WZXJzaW9uIiwiTW9uZXJvUGVlciIsIk1vbmVyb1BydW5lUmVzdWx0IiwiTW9uZXJvQWNjb3VudCIsIk1vbmVyb0FjY291bnRUYWciLCJNb25lcm9BZGRyZXNzQm9va0VudHJ5IiwiTW9uZXJvQ2hlY2siLCJNb25lcm9DaGVja1Jlc2VydmUiLCJNb25lcm9DaGVja1R4IiwiTW9uZXJvRGVzdGluYXRpb24iLCJNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsIk1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0IiwiTW9uZXJvTXVsdGlzaWdJbmZvIiwiTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IiwiTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0IiwiTW9uZXJvT3V0cHV0V2FsbGV0IiwiTW9uZXJvT3V0cHV0UXVlcnkiLCJNb25lcm9UeFByaW9yaXR5IiwiTW9uZXJvVHhDb25maWciLCJNb25lcm9TdWJhZGRyZXNzIiwiTW9uZXJvU3luY1Jlc3VsdCIsIk1vbmVyb1RyYW5zZmVyIiwiTW9uZXJvSW5jb21pbmdUcmFuc2ZlciIsIk1vbmVyb091dGdvaW5nVHJhbnNmZXIiLCJNb25lcm9UcmFuc2ZlclF1ZXJ5IiwiTW9uZXJvVHhTZXQiLCJNb25lcm9UeFdhbGxldCIsIk1vbmVyb1R4UXVlcnkiLCJNb25lcm9XYWxsZXRMaXN0ZW5lciIsIk1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIiwiTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCIsIk1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIiLCJNb25lcm9Db25uZWN0aW9uTWFuYWdlciIsIk1vbmVyb0RhZW1vbiIsIk1vbmVyb1dhbGxldCIsIlRocmVhZFBvb2wiLCJfZGVmYXVsdCJdLCJzb3VyY2VzIjpbIi4uL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0J1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gSU1QT1JUUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIFNlZSB0aGUgZnVsbCBtb2RlbCBzcGVjaWZpY2F0aW9uOiBodHRwczovL3dvb2RzZXIuZ2l0aHViLmlvL21vbmVyby1qYXZhL21vbmVyby1zcGVjLnBkZlxuXG4vLyBpbXBvcnQgY29tbW9uIG1vZGVsc1xuaW1wb3J0IEdlblV0aWxzIGZyb20gXCIuL3NyYy9tYWluL3RzL2NvbW1vbi9HZW5VdGlsc1wiO1xuaW1wb3J0IEZpbHRlciBmcm9tIFwiLi9zcmMvbWFpbi90cy9jb21tb24vRmlsdGVyXCI7XG5pbXBvcnQgTW9uZXJvRXJyb3IgZnJvbSBcIi4vc3JjL21haW4vdHMvY29tbW9uL01vbmVyb0Vycm9yXCI7XG5pbXBvcnQgSHR0cENsaWVudCBmcm9tIFwiLi9zcmMvbWFpbi90cy9jb21tb24vSHR0cENsaWVudFwiO1xuaW1wb3J0IExpYnJhcnlVdGlscyBmcm9tIFwiLi9zcmMvbWFpbi90cy9jb21tb24vTGlicmFyeVV0aWxzXCI7XG5pbXBvcnQgTW9uZXJvUnBjQ29ubmVjdGlvbiBmcm9tIFwiLi9zcmMvbWFpbi90cy9jb21tb24vTW9uZXJvUnBjQ29ubmVjdGlvblwiO1xuaW1wb3J0IE1vbmVyb1JwY0Vycm9yIGZyb20gXCIuL3NyYy9tYWluL3RzL2NvbW1vbi9Nb25lcm9ScGNFcnJvclwiO1xuaW1wb3J0IFNzbE9wdGlvbnMgZnJvbSBcIi4vc3JjL21haW4vdHMvY29tbW9uL1NzbE9wdGlvbnNcIjtcbmltcG9ydCBUYXNrTG9vcGVyIGZyb20gXCIuL3NyYy9tYWluL3RzL2NvbW1vbi9UYXNrTG9vcGVyXCI7XG5cbi8vIGltcG9ydCBkYWVtb24gbW9kZWxzXG5pbXBvcnQgQ29ubmVjdGlvblR5cGUgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL0Nvbm5lY3Rpb25UeXBlXCI7XG5pbXBvcnQgTW9uZXJvQWx0Q2hhaW4gZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb0FsdENoYWluXCI7XG5pbXBvcnQgTW9uZXJvQmFuIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9CYW5cIjtcbmltcG9ydCBNb25lcm9CbG9ja0hlYWRlciBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvQmxvY2tIZWFkZXJcIjtcbmltcG9ydCBNb25lcm9CbG9jayBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvQmxvY2tcIjtcbmltcG9ydCBNb25lcm9CbG9ja1RlbXBsYXRlIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9CbG9ja1RlbXBsYXRlXCI7XG5pbXBvcnQgTW9uZXJvQ29ubmVjdGlvblNwYW4gZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb0Nvbm5lY3Rpb25TcGFuXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uQ29uZmlnIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9EYWVtb25Db25maWdcIjtcbmltcG9ydCBNb25lcm9EYWVtb25JbmZvIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9EYWVtb25JbmZvXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uTGlzdGVuZXIgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb0RhZW1vbkxpc3RlbmVyXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uU3luY0luZm8gZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb0RhZW1vblN5bmNJbmZvXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvRmVlRXN0aW1hdGUgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb0ZlZUVzdGltYXRlXCI7XG5pbXBvcnQgTW9uZXJvSGFyZEZvcmtJbmZvIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9IYXJkRm9ya0luZm9cIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZSBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvS2V5SW1hZ2VcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzXCI7XG5pbXBvcnQgTW9uZXJvTWluZXJUeFN1bSBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvTWluZXJUeFN1bVwiO1xuaW1wb3J0IE1vbmVyb01pbmluZ1N0YXR1cyBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvTWluaW5nU3RhdHVzXCI7XG5pbXBvcnQgTW9uZXJvTmV0d29ya1R5cGUgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb05ldHdvcmtUeXBlXCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0IGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9PdXRwdXRcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeSBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnlcIjtcbmltcG9ydCBNb25lcm9TdWJtaXRUeFJlc3VsdCBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvU3VibWl0VHhSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9UeCBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvVHhcIjtcbmltcG9ydCBNb25lcm9UeFBvb2xTdGF0cyBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvVHhQb29sU3RhdHNcIjtcbmltcG9ydCBNb25lcm9WZXJzaW9uIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9WZXJzaW9uXCI7XG5pbXBvcnQgTW9uZXJvUGVlciBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvUGVlclwiO1xuaW1wb3J0IE1vbmVyb1BydW5lUmVzdWx0IGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9QcnVuZVJlc3VsdFwiO1xuXG4vLyBpbXBvcnQgd2FsbGV0IG1vZGVsc1xuaW1wb3J0IE1vbmVyb0FjY291bnQgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb0FjY291bnRcIjtcbmltcG9ydCBNb25lcm9BY2NvdW50VGFnIGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9BY2NvdW50VGFnXCI7XG5pbXBvcnQgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeVwiO1xuaW1wb3J0IE1vbmVyb0NoZWNrIGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9DaGVja1wiO1xuaW1wb3J0IE1vbmVyb0NoZWNrUmVzZXJ2ZSBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvQ2hlY2tSZXNlcnZlXCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2tUeCBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvQ2hlY2tUeFwiO1xuaW1wb3J0IE1vbmVyb0Rlc3RpbmF0aW9uIGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9EZXN0aW5hdGlvblwiO1xuaW1wb3J0IE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzIGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0IGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnSW5mbyBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvTXVsdGlzaWdJbmZvXCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9NdWx0aXNpZ0luaXRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb011bHRpc2lnU2lnblJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb091dHB1dFdhbGxldCBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvT3V0cHV0V2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0UXVlcnkgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb091dHB1dFF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvVHhQcmlvcml0eSBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvVHhQcmlvcml0eVwiO1xuaW1wb3J0IE1vbmVyb1R4Q29uZmlnIGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9UeENvbmZpZ1wiO1xuaW1wb3J0IE1vbmVyb1N1YmFkZHJlc3MgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb1N1YmFkZHJlc3NcIjtcbmltcG9ydCBNb25lcm9TeW5jUmVzdWx0IGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9TeW5jUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvVHJhbnNmZXIgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvSW5jb21pbmdUcmFuc2ZlciBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvSW5jb21pbmdUcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb091dGdvaW5nVHJhbnNmZXIgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb091dGdvaW5nVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9UcmFuc2ZlclF1ZXJ5IGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9UcmFuc2ZlclF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvVHhTZXQgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb1R4U2V0XCI7XG5pbXBvcnQgTW9uZXJvVHhXYWxsZXQgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb1R4V2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvVHhRdWVyeSBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvVHhRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb1dhbGxldExpc3RlbmVyIGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9XYWxsZXRMaXN0ZW5lclwiO1xuaW1wb3J0IE1vbmVyb1dhbGxldENvbmZpZyBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvV2FsbGV0Q29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlXCI7XG5pbXBvcnQgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdFwiO1xuXG4vLyBpbXBvcnQgY29ubmVjdGlvbiBtYW5hZ2VyXG5pbXBvcnQgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIgZnJvbSBcIi4vc3JjL21haW4vdHMvY29tbW9uL01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyXCI7XG5pbXBvcnQgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lciBmcm9tIFwiLi9zcmMvbWFpbi90cy9jb21tb24vTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lclwiO1xuXG4vLyBpbXBvcnQgZGFlbW9uLCB3YWxsZXQsIGFuZCB1dGlsIGNsYXNzZXNcbmltcG9ydCBNb25lcm9EYWVtb24gZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL01vbmVyb0RhZW1vblwiO1xuaW1wb3J0IE1vbmVyb1dhbGxldCBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvTW9uZXJvV2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uUnBjIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9Nb25lcm9EYWVtb25ScGNcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRScGMgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L01vbmVyb1dhbGxldFJwY1wiO1xuaW1wb3J0IHsgTW9uZXJvV2FsbGV0S2V5cyB9IGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9Nb25lcm9XYWxsZXRLZXlzXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0RnVsbCBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvTW9uZXJvV2FsbGV0RnVsbFwiO1xuaW1wb3J0IE1vbmVyb1V0aWxzIGZyb20gXCIuL3NyYy9tYWluL3RzL2NvbW1vbi9Nb25lcm9VdGlsc1wiO1xuaW1wb3J0IFRocmVhZFBvb2wgZnJvbSBcIi4vc3JjL21haW4vdHMvY29tbW9uL1RocmVhZFBvb2xcIjtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBHTE9CQUwgRlVOQ1RJT05TIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vKipcbiAqIDxwPkdldCB0aGUgdmVyc2lvbiBvZiB0aGUgbW9uZXJvLXRzIGxpYnJhcnkuPHA+XG4gKlxuICogQHJldHVybiB7c3RyaW5nfSB0aGUgdmVyc2lvbiBvZiB0aGlzIG1vbmVyby10cyBsaWJyYXJ5XG4gKi9cbmZ1bmN0aW9uIGdldFZlcnNpb24oKSB7XG4gIHJldHVybiBNb25lcm9VdGlscy5nZXRWZXJzaW9uKCk7XG59XG5cbi8qKlxuICogPHA+Q3JlYXRlIGEgY2xpZW50IGNvbm5lY3RlZCB0byBtb25lcm9kLjxwPlxuICpcbiAqIDxwPkV4YW1wbGVzOjxwPlxuICpcbiAqIDxjb2RlPlxuICogbGV0IGRhZW1vbiA9IGF3YWl0IG1vbmVyb1RzLmNvbm5lY3RUb0RhZW1vblJwYyhcImh0dHA6Ly9sb2NhbGhvc3Q6MzgwODFcIik7PGJyPlxuICogPC9jb2RlPjxicj5cbiAqIDxicj5cbiAqIDxjb2RlPlxuICogbGV0IGRhZW1vbiA9IGF3YWl0IG1vbmVyb1RzLmNvbm5lY3RUb0RhZW1vblJwYyh7PGJyPlxuICogJm5ic3A7Jm5ic3A7IHVyaTogXCJodHRwOi8vbG9jYWxob3N0OjM4MDgxXCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7IHVzZXJuYW1lOiBcInN1cGVydXNlclwiLDxicj5cbiAqICZuYnNwOyZuYnNwOyBwYXNzd29yZDogXCJhYmN0ZXN0aW5nMTIzXCI8YnI+XG4gKiB9KTtcbiAqIDwvY29kZT48YnI+XG4gKiA8YnI+XG4gKiA8Y29kZT5cbiAqIC8vIHN0YXJ0IG1vbmVyb2QgYXMgYW4gaW50ZXJuYWwgcHJvY2Vzczxicj5cbiAqIGxldCBkYWVtb24gPSBhd2FpdCBtb25lcm9Ucy5jb25uZWN0VG9EYWVtb25ScGMoezxicj5cbiAqICZuYnNwOyZuYnNwOyBjbWQ6IFtcInBhdGgvdG8vbW9uZXJvZFwiLCAuLi5wYXJhbXMuLi5dLDxicj5cbiAqIH0pO1xuICogPC9jb2RlPlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj58UGFydGlhbDxNb25lcm9EYWVtb25Db25maWc+fHN0cmluZ1tdfSB1cmlPckNvbmZpZyAtIHVyaSBvciBycGMgY29ubmVjdGlvbiBvciBjb25maWcgb3IgdGVybWluYWwgcGFyYW1ldGVycyB0byBjb25uZWN0IHRvIG1vbmVyb2RcbiAqIEBwYXJhbSB7c3RyaW5nfSBbdXNlcm5hbWVdIC0gdXNlcm5hbWUgdG8gYXV0aGVudGljYXRlIHdpdGggbW9uZXJvZFxuICogQHBhcmFtIHtzdHJpbmd9IFtwYXNzd29yZF0gLSBwYXNzd29yZCB0byBhdXRoZW50aWNhdGUgd2l0aCBtb25lcm9kXG4gKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0RhZW1vblJwYz59IHRoZSBkYWVtb24gUlBDIGNsaWVudFxuICovXG5mdW5jdGlvbiBjb25uZWN0VG9EYWVtb25ScGModXJpT3JDb25maWc6IHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4gfCBQYXJ0aWFsPE1vbmVyb0RhZW1vbkNvbmZpZz4gfCBzdHJpbmdbXSwgdXNlcm5hbWU/OiBzdHJpbmcsIHBhc3N3b3JkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9EYWVtb25ScGM+IHtcbiAgcmV0dXJuIE1vbmVyb0RhZW1vblJwYy5jb25uZWN0VG9EYWVtb25ScGModXJpT3JDb25maWcsIHVzZXJuYW1lLCBwYXNzd29yZCk7XG59XG5cbi8qKlxuICogPHA+Q3JlYXRlIGEgY2xpZW50IGNvbm5lY3RlZCB0byBtb25lcm8td2FsbGV0LXJwYy48L3A+XG4gKlxuICogPHA+RXhhbXBsZXM6PC9wPlxuICpcbiAqIDxjb2RlPlxuICogbGV0IHdhbGxldFJwYyA9IGF3YWl0IG1vbmVyb1RzLmNvbm5lY3RUb1dhbGxldFJwYyh7PGJyPlxuICogJm5ic3A7Jm5ic3A7IHVyaTogXCJodHRwOi8vbG9jYWxob3N0OjM4MDgxXCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7IHVzZXJuYW1lOiBcInN1cGVydXNlclwiLDxicj5cbiAqICZuYnNwOyZuYnNwOyBwYXNzd29yZDogXCJhYmN0ZXN0aW5nMTIzXCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7IHJlamVjdFVuYXV0aG9yaXplZDogZmFsc2UgLy8gZS5nLiBsb2NhbCBkZXZlbG9wbWVudDxicj5cbiAqIH0pOzxicj5cbiAqIDwvY29kZT48YnI+XG4gKiA8YnI+XG4gKiA8Y29kZT5cbiAqIC8vIGNvbm5lY3QgdG8gbW9uZXJvLXdhbGxldC1ycGMgcnVubmluZyBhcyBpbnRlcm5hbCBwcm9jZXNzPGJyPlxuICogbGV0IHdhbGxldFJwYyA9IGF3YWl0IG1vbmVyb1RzLmNvbm5lY3RUb1dhbGxldFJwYyh7Y21kOiBbPGJyPlxuICogJm5ic3A7Jm5ic3A7IFwiL3BhdGgvdG8vbW9uZXJvLXdhbGxldC1ycGNcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgXCItLXN0YWdlbmV0XCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7IFwiLS1kYWVtb24tYWRkcmVzc1wiLCBcImh0dHA6Ly9sb2NhbGhvc3Q6MzgwODFcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgXCItLWRhZW1vbi1sb2dpblwiLCBcInN1cGVydXNlcjphYmN0ZXN0aW5nMTIzXCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7IFwiLS1ycGMtYmluZC1wb3J0XCIsIFwiMzgwODVcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgXCItLXJwYy1sb2dpblwiLCBcInJwY191c2VyOmFiYzEyM1wiLDxicj5cbiAqICZuYnNwOyZuYnNwOyBcIi0td2FsbGV0LWRpclwiLCBcIi9wYXRoL3RvL3dhbGxldHNcIiwgLy8gZGVmYXVsdHMgdG8gbW9uZXJvLXdhbGxldC1ycGMgZGlyZWN0b3J5PGJyPlxuICogJm5ic3A7Jm5ic3A7IFwiLS1ycGMtYWNjZXNzLWNvbnRyb2wtb3JpZ2luc1wiLCBcImh0dHA6Ly9sb2NhbGhvc3Q6ODA4MFwiPGJyPlxuICogJm5ic3A7XX0pO1xuICogPC9jb2RlPlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj58UGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+fHN0cmluZ1tdfSB1cmlPckNvbmZpZyAtIHVyaSBvciBycGMgY29ubmVjdGlvbiBvciBjb25maWcgb3IgdGVybWluYWwgcGFyYW1ldGVycyB0byBjb25uZWN0IHRvIG1vbmVyby13YWxsZXQtcnBjXG4gKiBAcGFyYW0ge3N0cmluZ30gW3VzZXJuYW1lXSAtIHVzZXJuYW1lIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIG1vbmVyby13YWxsZXQtcnBjXG4gKiBAcGFyYW0ge3N0cmluZ30gW3Bhc3N3b3JkXSAtIHBhc3N3b3JkIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIG1vbmVyby13YWxsZXQtcnBjXG4gKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1dhbGxldFJwYz59IHRoZSB3YWxsZXQgUlBDIGNsaWVudFxuICovXG5mdW5jdGlvbiBjb25uZWN0VG9XYWxsZXRScGModXJpT3JDb25maWc6IHN0cmluZyB8IFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj4gfCBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4gfCBzdHJpbmdbXSwgdXNlcm5hbWU/OiBzdHJpbmcsIHBhc3N3b3JkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9XYWxsZXRScGM+IHtcbiAgcmV0dXJuIE1vbmVyb1dhbGxldFJwYy5jb25uZWN0VG9XYWxsZXRScGModXJpT3JDb25maWcsIHVzZXJuYW1lLCBwYXNzd29yZCk7XG59XG5cbi8qKlxuICogPHA+Q3JlYXRlIGEgTW9uZXJvIHdhbGxldCB1c2luZyBjbGllbnQtc2lkZSBXZWJBc3NlbWJseSBiaW5kaW5ncyB0byBtb25lcm8tcHJvamVjdCdzIHdhbGxldDIgaW4gQysrLjxwPlxuICpcbiAqIDxwPkV4YW1wbGU6PC9wPlxuICpcbiAqIDxjb2RlPlxuICogY29uc3Qgd2FsbGV0ID0gYXdhaXQgbW9uZXJvVHMuY3JlYXRlV2FsbGV0RnVsbCh7PGJyPlxuICogJm5ic3A7Jm5ic3A7IHBhdGg6IFwiLi90ZXN0X3dhbGxldHMvd2FsbGV0MVwiLCAvLyBsZWF2ZSBibGFuayBmb3IgaW4tbWVtb3J5IHdhbGxldDxicj5cbiAqICZuYnNwOyZuYnNwOyBwYXNzd29yZDogXCJzdXBlcnNlY3JldHBhc3N3b3JkXCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7IG5ldHdvcmtUeXBlOiBtb25lcm9Ucy5Nb25lcm9OZXR3b3JrVHlwZS5TVEFHRU5FVCw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgc2VlZDogXCJjb2V4aXN0IGlnbG9vIHBhbXBobGV0IGxhZ29vbi4uLlwiLDxicj5cbiAqICZuYnNwOyZuYnNwOyByZXN0b3JlSGVpZ2h0OiAxNTQzMjE4LDxicj5cbiAqICZuYnNwOyZuYnNwOyBzZXJ2ZXI6IFwiaHR0cDovL2xvY2FsaG9zdDozODA4MVwiPGJyPlxuICogfSk7XG4gKiA8L2NvZGU+PGJyPlxuICogPGJyPlxuICogPGNvZGU+XG4gKiBjb25zdCB3YWxsZXQgPSBhd2FpdCBtb25lcm9Ucy5jcmVhdGVXYWxsZXRGdWxsKHs8YnI+XG4gKiAmbmJzcDsmbmJzcDsgcGF0aDogXCIuL3Rlc3Rfd2FsbGV0cy93YWxsZXQxXCIsIC8vIGxlYXZlIGJsYW5rIGZvciBpbi1tZW1vcnkgd2FsbGV0PGJyPlxuICogJm5ic3A7Jm5ic3A7IHBhc3N3b3JkOiBcInN1cGVyc2VjcmV0cGFzc3dvcmRcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgbmV0d29ya1R5cGU6IG1vbmVyb1RzLk1vbmVyb05ldHdvcmtUeXBlLlNUQUdFTkVULDxicj5cbiAqICZuYnNwOyZuYnNwOyBzZWVkOiBcImNvZXhpc3QgaWdsb28gcGFtcGhsZXQgbGFnb29uLi4uXCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7IHJlc3RvcmVIZWlnaHQ6IDE1NDMyMTgsPGJyPlxuICogJm5ic3A7Jm5ic3A7IHByb3h5VG9Xb3JrZXI6IGZhbHNlLCAvLyBvdmVycmlkZSBkZWZhdWx0PGJyPlxuICogJm5ic3A7Jm5ic3A7IHNlcnZlcjogezxicj5cbiAqICZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwOyB1cmk6IFwiaHR0cDovL2xvY2FsaG9zdDozODA4MVwiLDxicj5cbiAqICZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwOyB1c2VybmFtZTogXCJkYWVtb25fdXNlclwiLDxicj5cbiAqICZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwOyBwYXNzd29yZDogXCJkYWVtb25fcGFzc3dvcmRfMTIzXCI8YnI+XG4gKiAmbmJzcDsmbmJzcDsgfTxicj5cbiAqIH0pO1xuICogPC9jb2RlPlxuICpcbiAqIEBwYXJhbSB7UGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+fSBjb25maWcgLSBNb25lcm9XYWxsZXRDb25maWcgb3IgZXF1aXZhbGVudCBjb25maWcgb2JqZWN0XG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wYXRoXSAtIHBhdGggb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsLCBpbi1tZW1vcnkgd2FsbGV0IGlmIG5vdCBnaXZlbilcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnBhc3N3b3JkXSAtIHBhc3N3b3JkIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlXG4gKiBAcGFyYW0ge01vbmVyb05ldHdvcmtUeXBlfHN0cmluZ30gW2NvbmZpZy5uZXR3b3JrVHlwZV0gLSBuZXR3b3JrIHR5cGUgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9uZSBvZiBcIm1haW5uZXRcIiwgXCJ0ZXN0bmV0XCIsIFwic3RhZ2VuZXRcIiBvciBNb25lcm9OZXR3b3JrVHlwZS5NQUlOTkVUfFRFU1RORVR8U1RBR0VORVQpXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5zZWVkXSAtIHNlZWQgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsLCByYW5kb20gd2FsbGV0IGNyZWF0ZWQgaWYgbmVpdGhlciBzZWVkIG5vciBrZXlzIGdpdmVuKVxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VlZE9mZnNldF0gLSB0aGUgb2Zmc2V0IHVzZWQgdG8gZGVyaXZlIGEgbmV3IHNlZWQgZnJvbSB0aGUgZ2l2ZW4gc2VlZCB0byByZWNvdmVyIGEgc2VjcmV0IHdhbGxldCBmcm9tIHRoZSBzZWVkIHBocmFzZVxuICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLmlzTXVsdGlzaWddIC0gcmVzdG9yZSBtdWx0aXNpZyB3YWxsZXQgZnJvbSBzZWVkXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wcmltYXJ5QWRkcmVzc10gLSBwcmltYXJ5IGFkZHJlc3Mgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9ubHkgcHJvdmlkZSBpZiByZXN0b3JpbmcgZnJvbSBrZXlzKVxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpdmF0ZVZpZXdLZXldIC0gcHJpdmF0ZSB2aWV3IGtleSBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwpXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wcml2YXRlU3BlbmRLZXldIC0gcHJpdmF0ZSBzcGVuZCBrZXkgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsKVxuICogQHBhcmFtIHtudW1iZXJ9IFtjb25maWcucmVzdG9yZUhlaWdodF0gLSBibG9jayBoZWlnaHQgdG8gc3RhcnQgc2Nhbm5pbmcgZnJvbSAoZGVmYXVsdHMgdG8gMCB1bmxlc3MgZ2VuZXJhdGluZyByYW5kb20gd2FsbGV0KVxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcubGFuZ3VhZ2VdIC0gbGFuZ3VhZ2Ugb2YgdGhlIHdhbGxldCdzIHNlZWQgcGhyYXNlIChkZWZhdWx0cyB0byBcIkVuZ2xpc2hcIiBvciBhdXRvLWRldGVjdGVkKVxuICogQHBhcmFtIHtudW1iZXJ9IFtjb25maWcuYWNjb3VudExvb2thaGVhZF0gLSAgbnVtYmVyIG9mIGFjY291bnRzIHRvIHNjYW4gKG9wdGlvbmFsKVxuICogQHBhcmFtIHtudW1iZXJ9IFtjb25maWcuc3ViYWRkcmVzc0xvb2thaGVhZF0gLSBudW1iZXIgb2Ygc3ViYWRkcmVzc2VzIHRvIHNjYW4gcGVyIGFjY291bnQgKG9wdGlvbmFsKVxuICogQHBhcmFtIHtzdHJpbmd8UGFydGlhbDxNb25lcm9ScGNDb25uZWN0aW9uPn0gW2NvbmZpZy5zZXJ2ZXJdIC0gY29ubmVjdGlvbiB0byBtb25lcm8gZGFlbW9uIChvcHRpb25hbClcbiAqIEBwYXJhbSB7TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJ9IFtjb25maWcuY29ubmVjdGlvbk1hbmFnZXJdIC0gbWFuYWdlIGNvbm5lY3Rpb25zIHRvIG1vbmVyb2QgKG9wdGlvbmFsKVxuICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLnJlamVjdFVuYXV0aG9yaXplZF0gLSByZWplY3Qgc2VsZi1zaWduZWQgc2VydmVyIGNlcnRpZmljYXRlcyBpZiB0cnVlIChkZWZhdWx0cyB0byB0cnVlKVxuICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLnByb3h5VG9Xb3JrZXJdIC0gcHJveGllcyB3YWxsZXQgb3BlcmF0aW9ucyB0byBhIHdvcmtlciBpbiBvcmRlciB0byBub3QgYmxvY2sgdGhlIG1haW4gdGhyZWFkIChkZWZhdWx0IHRydWUpXG4gKiBAcGFyYW0ge2FueX0gW2NvbmZpZy5mc10gLSBmaWxlIHN5c3RlbSBjb21wYXRpYmxlIHdpdGggTm9kZS5qcyBgZnMucHJvbWlzZXNgIEFQSSAoZGVmYXVsdHMgdG8gZGlzayBvciBpbi1tZW1vcnkgRlMgaWYgYnJvd3NlcilcbiAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvV2FsbGV0RnVsbD59IHRoZSBjcmVhdGVkIHdhbGxldFxuICovXG5mdW5jdGlvbiBjcmVhdGVXYWxsZXRGdWxsKGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KTogUHJvbWlzZTxNb25lcm9XYWxsZXRGdWxsPiB7XG4gIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLmNyZWF0ZVdhbGxldChuZXcgTW9uZXJvV2FsbGV0Q29uZmlnKGNvbmZpZykpO1xufVxuXG4vKipcbiAqIDxwPk9wZW4gYW4gZXhpc3RpbmcgTW9uZXJvIHdhbGxldCB1c2luZyBjbGllbnQtc2lkZSBXZWJBc3NlbWJseSBiaW5kaW5ncyB0byBtb25lcm8tcHJvamVjdCdzIHdhbGxldDIgaW4gQysrLjxwPlxuICpcbiAqIDxwPkV4YW1wbGU6PHA+XG4gKlxuICogPGNvZGU+XG4gKiBjb25zdCB3YWxsZXQgPSBhd2FpdCBtb25lcm9Ucy5vcGVuV2FsbGV0RnVsbCh7PGJyPlxuICogJm5ic3A7Jm5ic3A7IHBhdGg6IFwiLi93YWxsZXRzL3dhbGxldDFcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgcGFzc3dvcmQ6IFwic3VwZXJzZWNyZXRwYXNzd29yZFwiLDxicj5cbiAqICZuYnNwOyZuYnNwOyBuZXR3b3JrVHlwZTogbW9uZXJvVHMuTW9uZXJvTmV0d29ya1R5cGUuU1RBR0VORVQsPGJyPlxuICogJm5ic3A7Jm5ic3A7IHNlcnZlcjogeyAvLyBkYWVtb24gY29uZmlndXJhdGlvbjxicj5cbiAqICZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwOyB1cmk6IFwiaHR0cDovL2xvY2FsaG9zdDozODA4MVwiLDxicj5cbiAqICZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwOyB1c2VybmFtZTogXCJzdXBlcnVzZXJcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDsgcGFzc3dvcmQ6IFwiYWJjdGVzdGluZzEyM1wiPGJyPlxuICogJm5ic3A7Jm5ic3A7IH08YnI+XG4gKiB9KTtcbiAqIDwvY29kZT5cbiAqXG4gKiBAcGFyYW0ge1BhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPn0gY29uZmlnIC0gY29uZmlnIHRvIG9wZW4gYSBmdWxsIHdhbGxldFxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucGF0aF0gLSBwYXRoIG9mIHRoZSB3YWxsZXQgdG8gb3BlbiAob3B0aW9uYWwgaWYgJ2tleXNEYXRhJyBwcm92aWRlZClcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnBhc3N3b3JkXSAtIHBhc3N3b3JkIG9mIHRoZSB3YWxsZXQgdG8gb3BlblxuICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBbY29uZmlnLm5ldHdvcmtUeXBlXSAtIG5ldHdvcmsgdHlwZSBvZiB0aGUgd2FsbGV0IHRvIG9wZW4gKG9uZSBvZiBcIm1haW5uZXRcIiwgXCJ0ZXN0bmV0XCIsIFwic3RhZ2VuZXRcIiBvciBNb25lcm9OZXR3b3JrVHlwZS5NQUlOTkVUfFRFU1RORVR8U1RBR0VORVQpXG4gKiBAcGFyYW0ge3N0cmluZ3xNb25lcm9ScGNDb25uZWN0aW9ufSBbY29uZmlnLnNlcnZlcl0gLSB1cmkgb3IgY29ubmVjdGlvbiB0byBtb25lcm8gZGFlbW9uIChvcHRpb25hbClcbiAqIEBwYXJhbSB7VWludDhBcnJheX0gW2NvbmZpZy5rZXlzRGF0YV0gLSB3YWxsZXQga2V5cyBkYXRhIHRvIG9wZW4gKG9wdGlvbmFsIGlmIHBhdGggcHJvdmlkZWQpXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IFtjb25maWcuY2FjaGVEYXRhXSAtIHdhbGxldCBjYWNoZSBkYXRhIHRvIG9wZW4gKG9wdGlvbmFsKVxuICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLnByb3h5VG9Xb3JrZXJdIC0gcHJveGllcyB3YWxsZXQgb3BlcmF0aW9ucyB0byBhIHdvcmtlciBpbiBvcmRlciB0byBub3QgYmxvY2sgdGhlIG1haW4gdGhyZWFkIChkZWZhdWx0IHRydWUpXG4gKiBAcGFyYW0ge2FueX0gW2NvbmZpZy5mc10gLSBmaWxlIHN5c3RlbSBjb21wYXRpYmxlIHdpdGggTm9kZS5qcyBgZnMucHJvbWlzZXNgIEFQSSAoZGVmYXVsdHMgdG8gZGlzayBvciBpbi1tZW1vcnkgRlMgaWYgYnJvd3NlcilcbiAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvV2FsbGV0RnVsbD59IHRoZSBvcGVuZWQgd2FsbGV0XG4gKi9cbmZ1bmN0aW9uIG9wZW5XYWxsZXRGdWxsKGNvbmZpZzogUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+KTogUHJvbWlzZTxNb25lcm9XYWxsZXRGdWxsPiB7XG4gIHJldHVybiBNb25lcm9XYWxsZXRGdWxsLm9wZW5XYWxsZXQobmV3IE1vbmVyb1dhbGxldENvbmZpZyhjb25maWcpKTtcbn1cblxuLyoqXG4gKiA8cD5DcmVhdGUgYSB3YWxsZXQgdXNpbmcgV2ViQXNzZW1ibHkgYmluZGluZ3MgdG8gbW9uZXJvLXByb2plY3QuPC9wPlxuICpcbiAqIDxwPkV4YW1wbGU6PC9wPlxuICpcbiAqIDxjb2RlPlxuICogY29uc3Qgd2FsbGV0ID0gYXdhaXQgbW9uZXJvVHMuY3JlYXRlV2FsbGV0S2V5cyh7PGJyPlxuICogJm5ic3A7Jm5ic3A7IHBhc3N3b3JkOiBcImFiYzEyM1wiLDxicj5cbiAqICZuYnNwOyZuYnNwOyBuZXR3b3JrVHlwZTogbW9uZXJvVHMuTW9uZXJvTmV0d29ya1R5cGUuU1RBR0VORVQsPGJyPlxuICogJm5ic3A7Jm5ic3A7IHNlZWQ6IFwiY29leGlzdCBpZ2xvbyBwYW1waGxldCBsYWdvb24uLi5cIjxicj5cbiAqIH0pO1xuICogPC9jb2RlPlxuICpcbiAqIEBwYXJhbSB7UGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+fSBjb25maWcgLSBNb25lcm9XYWxsZXRDb25maWcgb3IgZXF1aXZhbGVudCBjb25maWcgb2JqZWN0XG4gKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ9IGNvbmZpZy5uZXR3b3JrVHlwZSAtIG5ldHdvcmsgdHlwZSBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob25lIG9mIFwibWFpbm5ldFwiLCBcInRlc3RuZXRcIiwgXCJzdGFnZW5ldFwiIG9yIE1vbmVyb05ldHdvcmtUeXBlLk1BSU5ORVR8VEVTVE5FVHxTVEFHRU5FVClcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlZWRdIC0gc2VlZCBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwsIHJhbmRvbSB3YWxsZXQgY3JlYXRlZCBpZiBuZWl0aGVyIHNlZWQgbm9yIGtleXMgZ2l2ZW4pXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5zZWVkT2Zmc2V0XSAtIHRoZSBvZmZzZXQgdXNlZCB0byBkZXJpdmUgYSBuZXcgc2VlZCBmcm9tIHRoZSBnaXZlbiBzZWVkIHRvIHJlY292ZXIgYSBzZWNyZXQgd2FsbGV0IGZyb20gdGhlIHNlZWQgcGhyYXNlXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wcmltYXJ5QWRkcmVzc10gLSBwcmltYXJ5IGFkZHJlc3Mgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9ubHkgcHJvdmlkZSBpZiByZXN0b3JpbmcgZnJvbSBrZXlzKVxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpdmF0ZVZpZXdLZXldIC0gcHJpdmF0ZSB2aWV3IGtleSBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZSAob3B0aW9uYWwpXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wcml2YXRlU3BlbmRLZXldIC0gcHJpdmF0ZSBzcGVuZCBrZXkgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsKVxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcubGFuZ3VhZ2VdIC0gbGFuZ3VhZ2Ugb2YgdGhlIHdhbGxldCdzIHNlZWQgKGRlZmF1bHRzIHRvIFwiRW5nbGlzaFwiIG9yIGF1dG8tZGV0ZWN0ZWQpXG4gKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1dhbGxldEtleXM+fSB0aGUgY3JlYXRlZCB3YWxsZXRcbiAqL1xuZnVuY3Rpb24gY3JlYXRlV2FsbGV0S2V5cyhjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPik6IFByb21pc2U8TW9uZXJvV2FsbGV0S2V5cz4ge1xuICByZXR1cm4gTW9uZXJvV2FsbGV0S2V5cy5jcmVhdGVXYWxsZXQobmV3IE1vbmVyb1dhbGxldENvbmZpZyhjb25maWcpKTtcbn1cblxuLyoqXG4gKiA8cD5TaHV0IGRvd24gdGhlIG1vbmVyby10cyBsaWJyYXJ5LCB0ZXJtaW5hdGluZyBhbnkgcnVubmluZyB3b3JrZXJzLjwvcD5cbiAqXG4gKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2hlbiB0aGUgbGlicmFyeSBoYXMgc2h1dCBkb3duXG4gKi9cbmZ1bmN0aW9uIHNodXRkb3duKCk6IFByb21pc2U8dm9pZD4ge1xuICByZXR1cm4gTGlicmFyeVV0aWxzLnRlcm1pbmF0ZVdvcmtlcigpO1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gRVhQT1JUUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmV4cG9ydCB7XG5cbiAgLy8gdHlwZXNcbiAgR2VuVXRpbHMsXG4gIEZpbHRlcixcbiAgTW9uZXJvRXJyb3IsXG4gIEh0dHBDbGllbnQsXG4gIExpYnJhcnlVdGlscyxcbiAgTW9uZXJvUnBjQ29ubmVjdGlvbixcbiAgTW9uZXJvUnBjRXJyb3IsXG4gIFNzbE9wdGlvbnMsXG4gIFRhc2tMb29wZXIsXG4gIENvbm5lY3Rpb25UeXBlLFxuICBNb25lcm9BbHRDaGFpbixcbiAgTW9uZXJvQmFuLFxuICBNb25lcm9CbG9ja0hlYWRlcixcbiAgTW9uZXJvQmxvY2ssXG4gIE1vbmVyb0Jsb2NrVGVtcGxhdGUsXG4gIE1vbmVyb0Nvbm5lY3Rpb25TcGFuLFxuICBNb25lcm9EYWVtb25Db25maWcsXG4gIE1vbmVyb0RhZW1vbkluZm8sXG4gIE1vbmVyb0RhZW1vbkxpc3RlbmVyLFxuICBNb25lcm9EYWVtb25TeW5jSW5mbyxcbiAgTW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQsXG4gIE1vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0LFxuICBNb25lcm9GZWVFc3RpbWF0ZSxcbiAgTW9uZXJvSGFyZEZvcmtJbmZvLFxuICBNb25lcm9LZXlJbWFnZSxcbiAgTW9uZXJvS2V5SW1hZ2VTcGVudFN0YXR1cyxcbiAgTW9uZXJvTWluZXJUeFN1bSxcbiAgTW9uZXJvTWluaW5nU3RhdHVzLFxuICBNb25lcm9OZXR3b3JrVHlwZSxcbiAgTW9uZXJvT3V0cHV0LFxuICBNb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeSxcbiAgTW9uZXJvU3VibWl0VHhSZXN1bHQsXG4gIE1vbmVyb1R4LFxuICBNb25lcm9UeFBvb2xTdGF0cyxcbiAgTW9uZXJvVmVyc2lvbixcbiAgTW9uZXJvUGVlcixcbiAgTW9uZXJvUHJ1bmVSZXN1bHQsXG4gIE1vbmVyb0FjY291bnQsXG4gIE1vbmVyb0FjY291bnRUYWcsXG4gIE1vbmVyb0FkZHJlc3NCb29rRW50cnksXG4gIE1vbmVyb0NoZWNrLFxuICBNb25lcm9DaGVja1Jlc2VydmUsXG4gIE1vbmVyb0NoZWNrVHgsXG4gIE1vbmVyb0Rlc3RpbmF0aW9uLFxuICBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyxcbiAgTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQsXG4gIE1vbmVyb011bHRpc2lnSW5mbyxcbiAgTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0LFxuICBNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQsXG4gIE1vbmVyb091dHB1dFdhbGxldCxcbiAgTW9uZXJvT3V0cHV0UXVlcnksXG4gIE1vbmVyb1R4UHJpb3JpdHksXG4gIE1vbmVyb1R4Q29uZmlnLFxuICBNb25lcm9TdWJhZGRyZXNzLFxuICBNb25lcm9TeW5jUmVzdWx0LFxuICBNb25lcm9UcmFuc2ZlcixcbiAgTW9uZXJvSW5jb21pbmdUcmFuc2ZlcixcbiAgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcixcbiAgTW9uZXJvVHJhbnNmZXJRdWVyeSxcbiAgTW9uZXJvVHhTZXQsXG4gIE1vbmVyb1R4V2FsbGV0LFxuICBNb25lcm9UeFF1ZXJ5LFxuICBNb25lcm9XYWxsZXRMaXN0ZW5lcixcbiAgTW9uZXJvV2FsbGV0Q29uZmlnLFxuICBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSxcbiAgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCxcbiAgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lcixcbiAgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIsXG4gIE1vbmVyb0RhZW1vbixcbiAgTW9uZXJvV2FsbGV0LFxuICBNb25lcm9EYWVtb25ScGMsXG4gIE1vbmVyb1dhbGxldFJwYyxcbiAgTW9uZXJvV2FsbGV0S2V5cyxcbiAgTW9uZXJvV2FsbGV0RnVsbCxcbiAgTW9uZXJvVXRpbHMsXG4gIFRocmVhZFBvb2wsXG5cbiAgLy8gZ2xvYmFsIGZ1bmN0aW9uc1xuICBnZXRWZXJzaW9uLFxuICBjb25uZWN0VG9EYWVtb25ScGMsXG4gIGNvbm5lY3RUb1dhbGxldFJwYyxcbiAgY3JlYXRlV2FsbGV0RnVsbCxcbiAgb3BlbldhbGxldEZ1bGwsXG4gIGNyZWF0ZVdhbGxldEtleXMsXG4gIHNodXRkb3duXG59O1xuXG4vLyBleHBvcnQgZGVmYXVsdCBvYmplY3Qgd2l0aCBhZ2dyZWdhdGUgb2YgYWxsIGV4cG9ydHNcbmNvbnN0IG1vbmVyb1RzID0ge1xuICBHZW5VdGlscyxcbiAgRmlsdGVyLFxuICBNb25lcm9FcnJvcixcbiAgSHR0cENsaWVudCxcbiAgTGlicmFyeVV0aWxzLFxuICBNb25lcm9ScGNDb25uZWN0aW9uLFxuICBNb25lcm9ScGNFcnJvcixcbiAgU3NsT3B0aW9ucyxcbiAgVGFza0xvb3BlcixcbiAgQ29ubmVjdGlvblR5cGUsXG4gIE1vbmVyb0FsdENoYWluLFxuICBNb25lcm9CYW4sXG4gIE1vbmVyb0Jsb2NrSGVhZGVyLFxuICBNb25lcm9CbG9jayxcbiAgTW9uZXJvQmxvY2tUZW1wbGF0ZSxcbiAgTW9uZXJvQ29ubmVjdGlvblNwYW4sXG4gIE1vbmVyb0RhZW1vbkNvbmZpZyxcbiAgTW9uZXJvRGFlbW9uSW5mbyxcbiAgTW9uZXJvRGFlbW9uTGlzdGVuZXIsXG4gIE1vbmVyb0RhZW1vblN5bmNJbmZvLFxuICBNb25lcm9EYWVtb25VcGRhdGVDaGVja1Jlc3VsdCxcbiAgTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQsXG4gIE1vbmVyb0ZlZUVzdGltYXRlLFxuICBNb25lcm9IYXJkRm9ya0luZm8sXG4gIE1vbmVyb0tleUltYWdlLFxuICBNb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzLFxuICBNb25lcm9NaW5lclR4U3VtLFxuICBNb25lcm9NaW5pbmdTdGF0dXMsXG4gIE1vbmVyb05ldHdvcmtUeXBlLFxuICBNb25lcm9PdXRwdXQsXG4gIE1vbmVyb091dHB1dEhpc3RvZ3JhbUVudHJ5LFxuICBNb25lcm9TdWJtaXRUeFJlc3VsdCxcbiAgTW9uZXJvVHgsXG4gIE1vbmVyb1R4UG9vbFN0YXRzLFxuICBNb25lcm9WZXJzaW9uLFxuICBNb25lcm9QZWVyLFxuICBNb25lcm9QcnVuZVJlc3VsdCxcbiAgTW9uZXJvQWNjb3VudCxcbiAgTW9uZXJvQWNjb3VudFRhZyxcbiAgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSxcbiAgTW9uZXJvQ2hlY2ssXG4gIE1vbmVyb0NoZWNrUmVzZXJ2ZSxcbiAgTW9uZXJvQ2hlY2tUeCxcbiAgTW9uZXJvRGVzdGluYXRpb24sXG4gIE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzLFxuICBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCxcbiAgTW9uZXJvTXVsdGlzaWdJbmZvLFxuICBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQsXG4gIE1vbmVyb011bHRpc2lnU2lnblJlc3VsdCxcbiAgTW9uZXJvT3V0cHV0V2FsbGV0LFxuICBNb25lcm9PdXRwdXRRdWVyeSxcbiAgTW9uZXJvVHhQcmlvcml0eSxcbiAgTW9uZXJvVHhDb25maWcsXG4gIE1vbmVyb1N1YmFkZHJlc3MsXG4gIE1vbmVyb1N5bmNSZXN1bHQsXG4gIE1vbmVyb1RyYW5zZmVyLFxuICBNb25lcm9JbmNvbWluZ1RyYW5zZmVyLFxuICBNb25lcm9PdXRnb2luZ1RyYW5zZmVyLFxuICBNb25lcm9UcmFuc2ZlclF1ZXJ5LFxuICBNb25lcm9UeFNldCxcbiAgTW9uZXJvVHhXYWxsZXQsXG4gIE1vbmVyb1R4UXVlcnksXG4gIE1vbmVyb1dhbGxldExpc3RlbmVyLFxuICBNb25lcm9XYWxsZXRDb25maWcsXG4gIE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLFxuICBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0LFxuICBNb25lcm9Db25uZWN0aW9uTWFuYWdlckxpc3RlbmVyLFxuICBNb25lcm9Db25uZWN0aW9uTWFuYWdlcixcbiAgTW9uZXJvRGFlbW9uLFxuICBNb25lcm9XYWxsZXQsXG4gIE1vbmVyb0RhZW1vblJwYyxcbiAgTW9uZXJvV2FsbGV0UnBjLFxuICBNb25lcm9XYWxsZXRLZXlzLFxuICBNb25lcm9XYWxsZXRGdWxsLFxuICBNb25lcm9VdGlscyxcbiAgVGhyZWFkUG9vbCxcblxuICAvLyBnbG9iYWwgZnVuY3Rpb25zXG4gIGdldFZlcnNpb24sXG4gIGNvbm5lY3RUb0RhZW1vblJwYyxcbiAgY29ubmVjdFRvV2FsbGV0UnBjLFxuICBjcmVhdGVXYWxsZXRGdWxsLFxuICBvcGVuV2FsbGV0RnVsbCxcbiAgY3JlYXRlV2FsbGV0S2V5cyxcbiAgc2h1dGRvd25cbn1cbmV4cG9ydCBkZWZhdWx0IG1vbmVyb1RzO1xuXG4vLyBhdWdtZW50IGdsb2JhbCBzY29wZSB3aXRoIHNhbWUgbmFtZXNwYWNlIGFzIGRlZmF1bHQgZXhwb3J0XG5kZWNsYXJlIGdsb2JhbCB7XG4gIG5hbWVzcGFjZSBtb25lcm9UcyB7XG4gICAgdHlwZSBHZW5VdGlscyA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5HZW5VdGlscz47XG4gICAgdHlwZSBGaWx0ZXIgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuRmlsdGVyPjtcbiAgICB0eXBlIE1vbmVyb0Vycm9yID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0Vycm9yPjtcbiAgICB0eXBlIEh0dHBDbGllbnQgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuSHR0cENsaWVudD47XG4gICAgdHlwZSBMaWJyYXJ5VXRpbHMgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTGlicmFyeVV0aWxzPjtcbiAgICB0eXBlIE1vbmVyb1JwY0Nvbm5lY3Rpb24gPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvUnBjQ29ubmVjdGlvbj47XG4gICAgdHlwZSBNb25lcm9ScGNFcnJvciA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9ScGNFcnJvcj47XG4gICAgdHlwZSBTc2xPcHRpb25zID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLlNzbE9wdGlvbnM+O1xuICAgIHR5cGUgVGFza0xvb3BlciA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5UYXNrTG9vcGVyPjtcbiAgICB0eXBlIENvbm5lY3Rpb25UeXBlID0gaW1wb3J0KFwiLi9pbmRleFwiKS5Db25uZWN0aW9uVHlwZTsgLy8gdHlwZSBhbGlhcyBmb3IgZW51bVxuICAgIHR5cGUgTW9uZXJvQWx0Q2hhaW4gPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvQWx0Q2hhaW4+O1xuICAgIHR5cGUgTW9uZXJvQmFuID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0Jhbj47XG4gICAgdHlwZSBNb25lcm9CbG9ja0hlYWRlciA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9CbG9ja0hlYWRlcj47XG4gICAgdHlwZSBNb25lcm9CbG9jayA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9CbG9jaz47XG4gICAgdHlwZSBNb25lcm9CbG9ja1RlbXBsYXRlID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0Jsb2NrVGVtcGxhdGU+O1xuICAgIHR5cGUgTW9uZXJvQ29ubmVjdGlvblNwYW4gPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvQ29ubmVjdGlvblNwYW4+O1xuICAgIHR5cGUgTW9uZXJvRGFlbW9uQ29uZmlnID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0RhZW1vbkNvbmZpZz47XG4gICAgdHlwZSBNb25lcm9EYWVtb25JbmZvID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0RhZW1vbkluZm8+O1xuICAgIHR5cGUgTW9uZXJvRGFlbW9uTGlzdGVuZXIgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvRGFlbW9uTGlzdGVuZXI+O1xuICAgIHR5cGUgTW9uZXJvRGFlbW9uU3luY0luZm8gPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvRGFlbW9uU3luY0luZm8+O1xuICAgIHR5cGUgTW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQ+O1xuICAgIHR5cGUgTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQ+O1xuICAgIHR5cGUgTW9uZXJvRmVlRXN0aW1hdGUgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvRmVlRXN0aW1hdGU+O1xuICAgIHR5cGUgTW9uZXJvSGFyZEZvcmtJbmZvID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0hhcmRGb3JrSW5mbz47XG4gICAgdHlwZSBNb25lcm9LZXlJbWFnZSA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9LZXlJbWFnZT47XG4gICAgdHlwZSBNb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzID0gaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzO1xuICAgIHR5cGUgTW9uZXJvTWluZXJUeFN1bSA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9NaW5lclR4U3VtPjtcbiAgICB0eXBlIE1vbmVyb01pbmluZ1N0YXR1cyA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9NaW5pbmdTdGF0dXM+O1xuICAgIHR5cGUgTW9uZXJvTmV0d29ya1R5cGUgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvTmV0d29ya1R5cGU+O1xuICAgIHR5cGUgTW9uZXJvT3V0cHV0ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb091dHB1dD47XG4gICAgdHlwZSBNb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeSA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeT47XG4gICAgdHlwZSBNb25lcm9TdWJtaXRUeFJlc3VsdCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9TdWJtaXRUeFJlc3VsdD47XG4gICAgdHlwZSBNb25lcm9UeCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9UeD47XG4gICAgdHlwZSBNb25lcm9UeFBvb2xTdGF0cyA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9UeFBvb2xTdGF0cz47XG4gICAgdHlwZSBNb25lcm9WZXJzaW9uID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1ZlcnNpb24+O1xuICAgIHR5cGUgTW9uZXJvUGVlciA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9QZWVyPjtcbiAgICB0eXBlIE1vbmVyb1BydW5lUmVzdWx0ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1BydW5lUmVzdWx0PjtcbiAgICB0eXBlIE1vbmVyb0FjY291bnQgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvQWNjb3VudD47XG4gICAgdHlwZSBNb25lcm9BY2NvdW50VGFnID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0FjY291bnRUYWc+O1xuICAgIHR5cGUgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9BZGRyZXNzQm9va0VudHJ5PjtcbiAgICB0eXBlIE1vbmVyb0NoZWNrID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0NoZWNrPjtcbiAgICB0eXBlIE1vbmVyb0NoZWNrUmVzZXJ2ZSA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9DaGVja1Jlc2VydmU+O1xuICAgIHR5cGUgTW9uZXJvQ2hlY2tUeCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9DaGVja1R4PjtcbiAgICB0eXBlIE1vbmVyb0Rlc3RpbmF0aW9uID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0Rlc3RpbmF0aW9uPjtcbiAgICB0eXBlIE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0ludGVncmF0ZWRBZGRyZXNzPjtcbiAgICB0eXBlIE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0PjtcbiAgICB0eXBlIE1vbmVyb011bHRpc2lnSW5mbyA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9NdWx0aXNpZ0luZm8+O1xuICAgIHR5cGUgTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb011bHRpc2lnSW5pdFJlc3VsdD47XG4gICAgdHlwZSBNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0PjtcbiAgICB0eXBlIE1vbmVyb091dHB1dFdhbGxldCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9PdXRwdXRXYWxsZXQ+O1xuICAgIHR5cGUgTW9uZXJvT3V0cHV0UXVlcnkgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvT3V0cHV0UXVlcnk+O1xuICAgIHR5cGUgTW9uZXJvVHhQcmlvcml0eSA9IGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvVHhQcmlvcml0eTtcbiAgICB0eXBlIE1vbmVyb1R4Q29uZmlnID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1R4Q29uZmlnPjtcbiAgICB0eXBlIE1vbmVyb1N1YmFkZHJlc3MgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvU3ViYWRkcmVzcz47XG4gICAgdHlwZSBNb25lcm9TeW5jUmVzdWx0ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1N5bmNSZXN1bHQ+O1xuICAgIHR5cGUgTW9uZXJvVHJhbnNmZXIgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvVHJhbnNmZXI+O1xuICAgIHR5cGUgTW9uZXJvSW5jb21pbmdUcmFuc2ZlciA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9JbmNvbWluZ1RyYW5zZmVyPjtcbiAgICB0eXBlIE1vbmVyb091dGdvaW5nVHJhbnNmZXIgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvT3V0Z29pbmdUcmFuc2Zlcj47XG4gICAgdHlwZSBNb25lcm9UcmFuc2ZlclF1ZXJ5ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1RyYW5zZmVyUXVlcnk+O1xuICAgIHR5cGUgTW9uZXJvVHhTZXQgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvVHhTZXQ+O1xuICAgIHR5cGUgTW9uZXJvVHhXYWxsZXQgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvVHhXYWxsZXQ+O1xuICAgIHR5cGUgTW9uZXJvVHhRdWVyeSA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9UeFF1ZXJ5PjtcbiAgICB0eXBlIE1vbmVyb1dhbGxldExpc3RlbmVyID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1dhbGxldExpc3RlbmVyPjtcbiAgICB0eXBlIE1vbmVyb1dhbGxldENvbmZpZyA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9XYWxsZXRDb25maWc+O1xuICAgIHR5cGUgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUgPSBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlO1xuICAgIHR5cGUgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0PjtcbiAgICB0eXBlIE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lcj47XG4gICAgdHlwZSBNb25lcm9Db25uZWN0aW9uTWFuYWdlciA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9Db25uZWN0aW9uTWFuYWdlcj47XG4gICAgdHlwZSBNb25lcm9EYWVtb24gPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvRGFlbW9uPjtcbiAgICB0eXBlIE1vbmVyb1dhbGxldCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9XYWxsZXQ+O1xuICAgIHR5cGUgTW9uZXJvRGFlbW9uUnBjID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0RhZW1vblJwYz47XG4gICAgdHlwZSBNb25lcm9XYWxsZXRScGMgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvV2FsbGV0UnBjPjtcbiAgICB0eXBlIE1vbmVyb1dhbGxldEtleXMgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvV2FsbGV0S2V5cz47XG4gICAgdHlwZSBNb25lcm9XYWxsZXRGdWxsID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1dhbGxldEZ1bGw+O1xuICAgIHR5cGUgTW9uZXJvVXRpbHMgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvVXRpbHM+O1xuICAgIHR5cGUgVGhyZWFkUG9vbCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5UaHJlYWRQb29sPjtcbiAgfVxufSJdLCJtYXBw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