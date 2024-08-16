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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIk9iamVjdCIsImRlZmluZVByb3BlcnR5IiwiZXhwb3J0cyIsInZhbHVlIiwiZW51bWVyYWJsZSIsImdldCIsIl9Db25uZWN0aW9uVHlwZSIsImRlZmF1bHQiLCJfRmlsdGVyIiwiX0dlblV0aWxzIiwiX0h0dHBDbGllbnQiLCJfTGlicmFyeVV0aWxzIiwiX01vbmVyb0FjY291bnQiLCJfTW9uZXJvQWNjb3VudFRhZyIsIl9Nb25lcm9BZGRyZXNzQm9va0VudHJ5IiwiX01vbmVyb0FsdENoYWluIiwiX01vbmVyb0JhbiIsIl9Nb25lcm9CbG9jayIsIl9Nb25lcm9CbG9ja0hlYWRlciIsIl9Nb25lcm9CbG9ja1RlbXBsYXRlIiwiX01vbmVyb0NoZWNrIiwiX01vbmVyb0NoZWNrUmVzZXJ2ZSIsIl9Nb25lcm9DaGVja1R4IiwiX01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyIiwiX01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIiLCJfTW9uZXJvQ29ubmVjdGlvblNwYW4iLCJfTW9uZXJvRGFlbW9uIiwiX01vbmVyb0RhZW1vbkNvbmZpZyIsIl9Nb25lcm9EYWVtb25JbmZvIiwiX01vbmVyb0RhZW1vbkxpc3RlbmVyIiwiX01vbmVyb0RhZW1vblJwYyIsIl9Nb25lcm9EYWVtb25TeW5jSW5mbyIsIl9Nb25lcm9EYWVtb25VcGRhdGVDaGVja1Jlc3VsdCIsIl9Nb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdCIsIl9Nb25lcm9EZXN0aW5hdGlvbiIsIl9Nb25lcm9FcnJvciIsIl9Nb25lcm9GZWVFc3RpbWF0ZSIsIl9Nb25lcm9IYXJkRm9ya0luZm8iLCJfTW9uZXJvSW5jb21pbmdUcmFuc2ZlciIsIl9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyIsIl9Nb25lcm9LZXlJbWFnZSIsIl9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCIsIl9Nb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzIiwiX01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQiLCJfTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUiLCJfTW9uZXJvTWluZXJUeFN1bSIsIl9Nb25lcm9NaW5pbmdTdGF0dXMiLCJfTW9uZXJvTXVsdGlzaWdJbmZvIiwiX01vbmVyb011bHRpc2lnSW5pdFJlc3VsdCIsIl9Nb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQiLCJfTW9uZXJvTmV0d29ya1R5cGUiLCJfTW9uZXJvT3V0Z29pbmdUcmFuc2ZlciIsIl9Nb25lcm9PdXRwdXQiLCJfTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkiLCJfTW9uZXJvT3V0cHV0UXVlcnkiLCJfTW9uZXJvT3V0cHV0V2FsbGV0IiwiX01vbmVyb1BlZXIiLCJfTW9uZXJvUHJ1bmVSZXN1bHQiLCJfTW9uZXJvUnBjQ29ubmVjdGlvbiIsIl9Nb25lcm9ScGNFcnJvciIsIl9Nb25lcm9TdWJhZGRyZXNzIiwiX01vbmVyb1N1Ym1pdFR4UmVzdWx0IiwiX01vbmVyb1N5bmNSZXN1bHQiLCJfTW9uZXJvVHJhbnNmZXIiLCJfTW9uZXJvVHJhbnNmZXJRdWVyeSIsIl9Nb25lcm9UeCIsIl9Nb25lcm9UeENvbmZpZyIsIl9Nb25lcm9UeFBvb2xTdGF0cyIsIl9Nb25lcm9UeFByaW9yaXR5IiwiX01vbmVyb1R4UXVlcnkiLCJfTW9uZXJvVHhTZXQiLCJfTW9uZXJvVHhXYWxsZXQiLCJfTW9uZXJvVXRpbHMiLCJfTW9uZXJvVmVyc2lvbiIsIl9Nb25lcm9XYWxsZXQiLCJfTW9uZXJvV2FsbGV0Q29uZmlnIiwiX01vbmVyb1dhbGxldEZ1bGwiLCJfTW9uZXJvV2FsbGV0S2V5cyIsIk1vbmVyb1dhbGxldEtleXMiLCJfTW9uZXJvV2FsbGV0TGlzdGVuZXIiLCJfTW9uZXJvV2FsbGV0UnBjIiwiX1NzbE9wdGlvbnMiLCJfVGFza0xvb3BlciIsIl9UaHJlYWRQb29sIiwiY29ubmVjdFRvRGFlbW9uUnBjIiwiY29ubmVjdFRvV2FsbGV0UnBjIiwiY3JlYXRlV2FsbGV0RnVsbCIsImNyZWF0ZVdhbGxldEtleXMiLCJnZXRWZXJzaW9uIiwib3BlbldhbGxldEZ1bGwiLCJNb25lcm9VdGlscyIsInVyaU9yQ29uZmlnIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsIk1vbmVyb0RhZW1vblJwYyIsIk1vbmVyb1dhbGxldFJwYyIsImNvbmZpZyIsIk1vbmVyb1dhbGxldEZ1bGwiLCJjcmVhdGVXYWxsZXQiLCJNb25lcm9XYWxsZXRDb25maWciLCJvcGVuV2FsbGV0IiwibW9uZXJvVHMiLCJHZW5VdGlscyIsIkZpbHRlciIsIk1vbmVyb0Vycm9yIiwiSHR0cENsaWVudCIsIkxpYnJhcnlVdGlscyIsIk1vbmVyb1JwY0Nvbm5lY3Rpb24iLCJNb25lcm9ScGNFcnJvciIsIlNzbE9wdGlvbnMiLCJUYXNrTG9vcGVyIiwiQ29ubmVjdGlvblR5cGUiLCJNb25lcm9BbHRDaGFpbiIsIk1vbmVyb0JhbiIsIk1vbmVyb0Jsb2NrSGVhZGVyIiwiTW9uZXJvQmxvY2siLCJNb25lcm9CbG9ja1RlbXBsYXRlIiwiTW9uZXJvQ29ubmVjdGlvblNwYW4iLCJNb25lcm9EYWVtb25Db25maWciLCJNb25lcm9EYWVtb25JbmZvIiwiTW9uZXJvRGFlbW9uTGlzdGVuZXIiLCJNb25lcm9EYWVtb25TeW5jSW5mbyIsIk1vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0IiwiTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQiLCJNb25lcm9GZWVFc3RpbWF0ZSIsIk1vbmVyb0hhcmRGb3JrSW5mbyIsIk1vbmVyb0tleUltYWdlIiwiTW9uZXJvS2V5SW1hZ2VTcGVudFN0YXR1cyIsIk1vbmVyb01pbmVyVHhTdW0iLCJNb25lcm9NaW5pbmdTdGF0dXMiLCJNb25lcm9OZXR3b3JrVHlwZSIsIk1vbmVyb091dHB1dCIsIk1vbmVyb091dHB1dEhpc3RvZ3JhbUVudHJ5IiwiTW9uZXJvU3VibWl0VHhSZXN1bHQiLCJNb25lcm9UeCIsIk1vbmVyb1R4UG9vbFN0YXRzIiwiTW9uZXJvVmVyc2lvbiIsIk1vbmVyb1BlZXIiLCJNb25lcm9QcnVuZVJlc3VsdCIsIk1vbmVyb0FjY291bnQiLCJNb25lcm9BY2NvdW50VGFnIiwiTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSIsIk1vbmVyb0NoZWNrIiwiTW9uZXJvQ2hlY2tSZXNlcnZlIiwiTW9uZXJvQ2hlY2tUeCIsIk1vbmVyb0Rlc3RpbmF0aW9uIiwiTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MiLCJNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCIsIk1vbmVyb011bHRpc2lnSW5mbyIsIk1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCIsIk1vbmVyb011bHRpc2lnU2lnblJlc3VsdCIsIk1vbmVyb091dHB1dFdhbGxldCIsIk1vbmVyb091dHB1dFF1ZXJ5IiwiTW9uZXJvVHhQcmlvcml0eSIsIk1vbmVyb1R4Q29uZmlnIiwiTW9uZXJvU3ViYWRkcmVzcyIsIk1vbmVyb1N5bmNSZXN1bHQiLCJNb25lcm9UcmFuc2ZlciIsIk1vbmVyb0luY29taW5nVHJhbnNmZXIiLCJNb25lcm9PdXRnb2luZ1RyYW5zZmVyIiwiTW9uZXJvVHJhbnNmZXJRdWVyeSIsIk1vbmVyb1R4U2V0IiwiTW9uZXJvVHhXYWxsZXQiLCJNb25lcm9UeFF1ZXJ5IiwiTW9uZXJvV2FsbGV0TGlzdGVuZXIiLCJNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIk1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQiLCJNb25lcm9Db25uZWN0aW9uTWFuYWdlckxpc3RlbmVyIiwiTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIiLCJNb25lcm9EYWVtb24iLCJNb25lcm9XYWxsZXQiLCJUaHJlYWRQb29sIiwiX2RlZmF1bHQiXSwic291cmNlcyI6WyIuLi9pbmRleC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCdcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIElNUE9SVFMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBTZWUgdGhlIGZ1bGwgbW9kZWwgc3BlY2lmaWNhdGlvbjogaHR0cHM6Ly93b29kc2VyLmdpdGh1Yi5pby9tb25lcm8tamF2YS9tb25lcm8tc3BlYy5wZGZcblxuLy8gaW1wb3J0IGNvbW1vbiBtb2RlbHNcbmltcG9ydCBHZW5VdGlscyBmcm9tIFwiLi9zcmMvbWFpbi90cy9jb21tb24vR2VuVXRpbHNcIjtcbmltcG9ydCBGaWx0ZXIgZnJvbSBcIi4vc3JjL21haW4vdHMvY29tbW9uL0ZpbHRlclwiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuL3NyYy9tYWluL3RzL2NvbW1vbi9Nb25lcm9FcnJvclwiO1xuaW1wb3J0IEh0dHBDbGllbnQgZnJvbSBcIi4vc3JjL21haW4vdHMvY29tbW9uL0h0dHBDbGllbnRcIjtcbmltcG9ydCBMaWJyYXJ5VXRpbHMgZnJvbSBcIi4vc3JjL21haW4vdHMvY29tbW9uL0xpYnJhcnlVdGlsc1wiO1xuaW1wb3J0IE1vbmVyb1JwY0Nvbm5lY3Rpb24gZnJvbSBcIi4vc3JjL21haW4vdHMvY29tbW9uL01vbmVyb1JwY0Nvbm5lY3Rpb25cIjtcbmltcG9ydCBNb25lcm9ScGNFcnJvciBmcm9tIFwiLi9zcmMvbWFpbi90cy9jb21tb24vTW9uZXJvUnBjRXJyb3JcIjtcbmltcG9ydCBTc2xPcHRpb25zIGZyb20gXCIuL3NyYy9tYWluL3RzL2NvbW1vbi9Tc2xPcHRpb25zXCI7XG5pbXBvcnQgVGFza0xvb3BlciBmcm9tIFwiLi9zcmMvbWFpbi90cy9jb21tb24vVGFza0xvb3BlclwiO1xuXG4vLyBpbXBvcnQgZGFlbW9uIG1vZGVsc1xuaW1wb3J0IENvbm5lY3Rpb25UeXBlIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Db25uZWN0aW9uVHlwZVwiO1xuaW1wb3J0IE1vbmVyb0FsdENoYWluIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9BbHRDaGFpblwiO1xuaW1wb3J0IE1vbmVyb0JhbiBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvQmFuXCI7XG5pbXBvcnQgTW9uZXJvQmxvY2tIZWFkZXIgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb0Jsb2NrSGVhZGVyXCI7XG5pbXBvcnQgTW9uZXJvQmxvY2sgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb0Jsb2NrXCI7XG5pbXBvcnQgTW9uZXJvQmxvY2tUZW1wbGF0ZSBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvQmxvY2tUZW1wbGF0ZVwiO1xuaW1wb3J0IE1vbmVyb0Nvbm5lY3Rpb25TcGFuIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9Db25uZWN0aW9uU3BhblwiO1xuaW1wb3J0IE1vbmVyb0RhZW1vbkNvbmZpZyBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvRGFlbW9uQ29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvRGFlbW9uSW5mbyBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvRGFlbW9uSW5mb1wiO1xuaW1wb3J0IE1vbmVyb0RhZW1vbkxpc3RlbmVyIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9EYWVtb25MaXN0ZW5lclwiO1xuaW1wb3J0IE1vbmVyb0RhZW1vblN5bmNJbmZvIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9EYWVtb25TeW5jSW5mb1wiO1xuaW1wb3J0IE1vbmVyb0RhZW1vblVwZGF0ZUNoZWNrUmVzdWx0IGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9EYWVtb25VcGRhdGVDaGVja1Jlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0IGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9EYWVtb25VcGRhdGVEb3dubG9hZFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb0ZlZUVzdGltYXRlIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9GZWVFc3RpbWF0ZVwiO1xuaW1wb3J0IE1vbmVyb0hhcmRGb3JrSW5mbyBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvSGFyZEZvcmtJbmZvXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2UgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb0tleUltYWdlXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2VTcGVudFN0YXR1cyBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvS2V5SW1hZ2VTcGVudFN0YXR1c1wiO1xuaW1wb3J0IE1vbmVyb01pbmVyVHhTdW0gZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb01pbmVyVHhTdW1cIjtcbmltcG9ydCBNb25lcm9NaW5pbmdTdGF0dXMgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb01pbmluZ1N0YXR1c1wiO1xuaW1wb3J0IE1vbmVyb05ldHdvcmtUeXBlIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9tb2RlbC9Nb25lcm9OZXR3b3JrVHlwZVwiO1xuaW1wb3J0IE1vbmVyb091dHB1dCBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvT3V0cHV0XCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0SGlzdG9ncmFtRW50cnkgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb091dHB1dEhpc3RvZ3JhbUVudHJ5XCI7XG5pbXBvcnQgTW9uZXJvU3VibWl0VHhSZXN1bHQgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb1N1Ym1pdFR4UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvVHggZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb1R4XCI7XG5pbXBvcnQgTW9uZXJvVHhQb29sU3RhdHMgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb1R4UG9vbFN0YXRzXCI7XG5pbXBvcnQgTW9uZXJvVmVyc2lvbiBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvVmVyc2lvblwiO1xuaW1wb3J0IE1vbmVyb1BlZXIgZnJvbSBcIi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb1BlZXJcIjtcbmltcG9ydCBNb25lcm9QcnVuZVJlc3VsdCBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvUHJ1bmVSZXN1bHRcIjtcblxuLy8gaW1wb3J0IHdhbGxldCBtb2RlbHNcbmltcG9ydCBNb25lcm9BY2NvdW50IGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9BY2NvdW50XCI7XG5pbXBvcnQgTW9uZXJvQWNjb3VudFRhZyBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvQWNjb3VudFRhZ1wiO1xuaW1wb3J0IE1vbmVyb0FkZHJlc3NCb29rRW50cnkgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb0FkZHJlc3NCb29rRW50cnlcIjtcbmltcG9ydCBNb25lcm9DaGVjayBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvQ2hlY2tcIjtcbmltcG9ydCBNb25lcm9DaGVja1Jlc2VydmUgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb0NoZWNrUmVzZXJ2ZVwiO1xuaW1wb3J0IE1vbmVyb0NoZWNrVHggZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb0NoZWNrVHhcIjtcbmltcG9ydCBNb25lcm9EZXN0aW5hdGlvbiBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvRGVzdGluYXRpb25cIjtcbmltcG9ydCBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3NcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ0luZm8gZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb011bHRpc2lnSW5mb1wiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0IGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHRcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRXYWxsZXQgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb091dHB1dFdhbGxldFwiO1xuaW1wb3J0IE1vbmVyb091dHB1dFF1ZXJ5IGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9PdXRwdXRRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb1R4UHJpb3JpdHkgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb1R4UHJpb3JpdHlcIjtcbmltcG9ydCBNb25lcm9UeENvbmZpZyBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvVHhDb25maWdcIjtcbmltcG9ydCBNb25lcm9TdWJhZGRyZXNzIGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9TdWJhZGRyZXNzXCI7XG5pbXBvcnQgTW9uZXJvU3luY1Jlc3VsdCBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvU3luY1Jlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb1RyYW5zZmVyIGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9UcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb0luY29taW5nVHJhbnNmZXIgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb0luY29taW5nVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9PdXRnb2luZ1RyYW5zZmVyIGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9PdXRnb2luZ1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvVHJhbnNmZXJRdWVyeSBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvVHJhbnNmZXJRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb1R4U2V0IGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9UeFNldFwiO1xuaW1wb3J0IE1vbmVyb1R4V2FsbGV0IGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9UeFdhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1R4UXVlcnkgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb1R4UXVlcnlcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRMaXN0ZW5lciBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvbW9kZWwvTW9uZXJvV2FsbGV0TGlzdGVuZXJcIjtcbmltcG9ydCBNb25lcm9XYWxsZXRDb25maWcgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb1dhbGxldENvbmZpZ1wiO1xuaW1wb3J0IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZVwiO1xuaW1wb3J0IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L21vZGVsL01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHRcIjtcblxuLy8gaW1wb3J0IGNvbm5lY3Rpb24gbWFuYWdlclxuaW1wb3J0IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyIGZyb20gXCIuL3NyYy9tYWluL3RzL2NvbW1vbi9Nb25lcm9Db25uZWN0aW9uTWFuYWdlclwiO1xuaW1wb3J0IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIgZnJvbSBcIi4vc3JjL21haW4vdHMvY29tbW9uL01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXJcIjtcblxuLy8gaW1wb3J0IGRhZW1vbiwgd2FsbGV0LCBhbmQgdXRpbCBjbGFzc2VzXG5pbXBvcnQgTW9uZXJvRGFlbW9uIGZyb20gXCIuL3NyYy9tYWluL3RzL2RhZW1vbi9Nb25lcm9EYWVtb25cIjtcbmltcG9ydCBNb25lcm9XYWxsZXQgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L01vbmVyb1dhbGxldFwiO1xuaW1wb3J0IE1vbmVyb0RhZW1vblJwYyBmcm9tIFwiLi9zcmMvbWFpbi90cy9kYWVtb24vTW9uZXJvRGFlbW9uUnBjXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0UnBjIGZyb20gXCIuL3NyYy9tYWluL3RzL3dhbGxldC9Nb25lcm9XYWxsZXRScGNcIjtcbmltcG9ydCB7IE1vbmVyb1dhbGxldEtleXMgfSBmcm9tIFwiLi9zcmMvbWFpbi90cy93YWxsZXQvTW9uZXJvV2FsbGV0S2V5c1wiO1xuaW1wb3J0IE1vbmVyb1dhbGxldEZ1bGwgZnJvbSBcIi4vc3JjL21haW4vdHMvd2FsbGV0L01vbmVyb1dhbGxldEZ1bGxcIjtcbmltcG9ydCBNb25lcm9VdGlscyBmcm9tIFwiLi9zcmMvbWFpbi90cy9jb21tb24vTW9uZXJvVXRpbHNcIjtcbmltcG9ydCBUaHJlYWRQb29sIGZyb20gXCIuL3NyYy9tYWluL3RzL2NvbW1vbi9UaHJlYWRQb29sXCI7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gR0xPQkFMIEZVTkNUSU9OUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLyoqXG4gKiA8cD5HZXQgdGhlIHZlcnNpb24gb2YgdGhlIG1vbmVyby10cyBsaWJyYXJ5LjxwPlxuICpcbiAqIEByZXR1cm4ge3N0cmluZ30gdGhlIHZlcnNpb24gb2YgdGhpcyBtb25lcm8tdHMgbGlicmFyeVxuICovXG5mdW5jdGlvbiBnZXRWZXJzaW9uKCkge1xuICByZXR1cm4gTW9uZXJvVXRpbHMuZ2V0VmVyc2lvbigpO1xufVxuXG4vKipcbiAqIDxwPkNyZWF0ZSBhIGNsaWVudCBjb25uZWN0ZWQgdG8gbW9uZXJvZC48cD5cbiAqXG4gKiA8cD5FeGFtcGxlczo8cD5cbiAqXG4gKiA8Y29kZT5cbiAqIGxldCBkYWVtb24gPSBhd2FpdCBtb25lcm9Ucy5jb25uZWN0VG9EYWVtb25ScGMoXCJodHRwOi8vbG9jYWxob3N0OjM4MDgxXCIpOzxicj5cbiAqIDwvY29kZT48YnI+XG4gKiA8YnI+XG4gKiA8Y29kZT5cbiAqIGxldCBkYWVtb24gPSBhd2FpdCBtb25lcm9Ucy5jb25uZWN0VG9EYWVtb25ScGMoezxicj5cbiAqICZuYnNwOyZuYnNwOyB1cmk6IFwiaHR0cDovL2xvY2FsaG9zdDozODA4MVwiLDxicj5cbiAqICZuYnNwOyZuYnNwOyB1c2VybmFtZTogXCJzdXBlcnVzZXJcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgcGFzc3dvcmQ6IFwiYWJjdGVzdGluZzEyM1wiPGJyPlxuICogfSk7XG4gKiA8L2NvZGU+PGJyPlxuICogPGJyPlxuICogPGNvZGU+XG4gKiAvLyBzdGFydCBtb25lcm9kIGFzIGFuIGludGVybmFsIHByb2Nlc3M8YnI+XG4gKiBsZXQgZGFlbW9uID0gYXdhaXQgbW9uZXJvVHMuY29ubmVjdFRvRGFlbW9uUnBjKHs8YnI+XG4gKiAmbmJzcDsmbmJzcDsgY21kOiBbXCJwYXRoL3RvL21vbmVyb2RcIiwgLi4ucGFyYW1zLi4uXSw8YnI+XG4gKiB9KTtcbiAqIDwvY29kZT5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+fFBhcnRpYWw8TW9uZXJvRGFlbW9uQ29uZmlnPnxzdHJpbmdbXX0gdXJpT3JDb25maWcgLSB1cmkgb3IgcnBjIGNvbm5lY3Rpb24gb3IgY29uZmlnIG9yIHRlcm1pbmFsIHBhcmFtZXRlcnMgdG8gY29ubmVjdCB0byBtb25lcm9kXG4gKiBAcGFyYW0ge3N0cmluZ30gW3VzZXJuYW1lXSAtIHVzZXJuYW1lIHRvIGF1dGhlbnRpY2F0ZSB3aXRoIG1vbmVyb2RcbiAqIEBwYXJhbSB7c3RyaW5nfSBbcGFzc3dvcmRdIC0gcGFzc3dvcmQgdG8gYXV0aGVudGljYXRlIHdpdGggbW9uZXJvZFxuICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9EYWVtb25ScGM+fSB0aGUgZGFlbW9uIFJQQyBjbGllbnRcbiAqL1xuZnVuY3Rpb24gY29ubmVjdFRvRGFlbW9uUnBjKHVyaU9yQ29uZmlnOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHwgUGFydGlhbDxNb25lcm9EYWVtb25Db25maWc+IHwgc3RyaW5nW10sIHVzZXJuYW1lPzogc3RyaW5nLCBwYXNzd29yZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvRGFlbW9uUnBjPiB7XG4gIHJldHVybiBNb25lcm9EYWVtb25ScGMuY29ubmVjdFRvRGFlbW9uUnBjKHVyaU9yQ29uZmlnLCB1c2VybmFtZSwgcGFzc3dvcmQpO1xufVxuXG4vKipcbiAqIDxwPkNyZWF0ZSBhIGNsaWVudCBjb25uZWN0ZWQgdG8gbW9uZXJvLXdhbGxldC1ycGMuPC9wPlxuICpcbiAqIDxwPkV4YW1wbGVzOjwvcD5cbiAqXG4gKiA8Y29kZT5cbiAqIGxldCB3YWxsZXRScGMgPSBhd2FpdCBtb25lcm9Ucy5jb25uZWN0VG9XYWxsZXRScGMoezxicj5cbiAqICZuYnNwOyZuYnNwOyB1cmk6IFwiaHR0cDovL2xvY2FsaG9zdDozODA4MVwiLDxicj5cbiAqICZuYnNwOyZuYnNwOyB1c2VybmFtZTogXCJzdXBlcnVzZXJcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgcGFzc3dvcmQ6IFwiYWJjdGVzdGluZzEyM1wiLDxicj5cbiAqICZuYnNwOyZuYnNwOyByZWplY3RVbmF1dGhvcml6ZWQ6IGZhbHNlIC8vIGUuZy4gbG9jYWwgZGV2ZWxvcG1lbnQ8YnI+XG4gKiB9KTs8YnI+XG4gKiA8L2NvZGU+PGJyPlxuICogPGJyPlxuICogPGNvZGU+XG4gKiAvLyBjb25uZWN0IHRvIG1vbmVyby13YWxsZXQtcnBjIHJ1bm5pbmcgYXMgaW50ZXJuYWwgcHJvY2Vzczxicj5cbiAqIGxldCB3YWxsZXRScGMgPSBhd2FpdCBtb25lcm9Ucy5jb25uZWN0VG9XYWxsZXRScGMoe2NtZDogWzxicj5cbiAqICZuYnNwOyZuYnNwOyBcIi9wYXRoL3RvL21vbmVyby13YWxsZXQtcnBjXCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7IFwiLS1zdGFnZW5ldFwiLDxicj5cbiAqICZuYnNwOyZuYnNwOyBcIi0tZGFlbW9uLWFkZHJlc3NcIiwgXCJodHRwOi8vbG9jYWxob3N0OjM4MDgxXCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7IFwiLS1kYWVtb24tbG9naW5cIiwgXCJzdXBlcnVzZXI6YWJjdGVzdGluZzEyM1wiLDxicj5cbiAqICZuYnNwOyZuYnNwOyBcIi0tcnBjLWJpbmQtcG9ydFwiLCBcIjM4MDg1XCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7IFwiLS1ycGMtbG9naW5cIiwgXCJycGNfdXNlcjphYmMxMjNcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgXCItLXdhbGxldC1kaXJcIiwgXCIvcGF0aC90by93YWxsZXRzXCIsIC8vIGRlZmF1bHRzIHRvIG1vbmVyby13YWxsZXQtcnBjIGRpcmVjdG9yeTxicj5cbiAqICZuYnNwOyZuYnNwOyBcIi0tcnBjLWFjY2Vzcy1jb250cm9sLW9yaWdpbnNcIiwgXCJodHRwOi8vbG9jYWxob3N0OjgwODBcIjxicj5cbiAqICZuYnNwO119KTtcbiAqIDwvY29kZT5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+fFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPnxzdHJpbmdbXX0gdXJpT3JDb25maWcgLSB1cmkgb3IgcnBjIGNvbm5lY3Rpb24gb3IgY29uZmlnIG9yIHRlcm1pbmFsIHBhcmFtZXRlcnMgdG8gY29ubmVjdCB0byBtb25lcm8td2FsbGV0LXJwY1xuICogQHBhcmFtIHtzdHJpbmd9IFt1c2VybmFtZV0gLSB1c2VybmFtZSB0byBhdXRoZW50aWNhdGUgd2l0aCBtb25lcm8td2FsbGV0LXJwY1xuICogQHBhcmFtIHtzdHJpbmd9IFtwYXNzd29yZF0gLSBwYXNzd29yZCB0byBhdXRoZW50aWNhdGUgd2l0aCBtb25lcm8td2FsbGV0LXJwY1xuICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9XYWxsZXRScGM+fSB0aGUgd2FsbGV0IFJQQyBjbGllbnRcbiAqL1xuZnVuY3Rpb24gY29ubmVjdFRvV2FsbGV0UnBjKHVyaU9yQ29uZmlnOiBzdHJpbmcgfCBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHwgUGFydGlhbDxNb25lcm9XYWxsZXRDb25maWc+IHwgc3RyaW5nW10sIHVzZXJuYW1lPzogc3RyaW5nLCBwYXNzd29yZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvV2FsbGV0UnBjPiB7XG4gIHJldHVybiBNb25lcm9XYWxsZXRScGMuY29ubmVjdFRvV2FsbGV0UnBjKHVyaU9yQ29uZmlnLCB1c2VybmFtZSwgcGFzc3dvcmQpO1xufVxuXG4vKipcbiAqIDxwPkNyZWF0ZSBhIE1vbmVybyB3YWxsZXQgdXNpbmcgY2xpZW50LXNpZGUgV2ViQXNzZW1ibHkgYmluZGluZ3MgdG8gbW9uZXJvLXByb2plY3QncyB3YWxsZXQyIGluIEMrKy48cD5cbiAqXG4gKiA8cD5FeGFtcGxlOjwvcD5cbiAqXG4gKiA8Y29kZT5cbiAqIGNvbnN0IHdhbGxldCA9IGF3YWl0IG1vbmVyb1RzLmNyZWF0ZVdhbGxldEZ1bGwoezxicj5cbiAqICZuYnNwOyZuYnNwOyBwYXRoOiBcIi4vdGVzdF93YWxsZXRzL3dhbGxldDFcIiwgLy8gbGVhdmUgYmxhbmsgZm9yIGluLW1lbW9yeSB3YWxsZXQ8YnI+XG4gKiAmbmJzcDsmbmJzcDsgcGFzc3dvcmQ6IFwic3VwZXJzZWNyZXRwYXNzd29yZFwiLDxicj5cbiAqICZuYnNwOyZuYnNwOyBuZXR3b3JrVHlwZTogbW9uZXJvVHMuTW9uZXJvTmV0d29ya1R5cGUuU1RBR0VORVQsPGJyPlxuICogJm5ic3A7Jm5ic3A7IHNlZWQ6IFwiY29leGlzdCBpZ2xvbyBwYW1waGxldCBsYWdvb24uLi5cIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgcmVzdG9yZUhlaWdodDogMTU0MzIxOCw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgc2VydmVyOiBcImh0dHA6Ly9sb2NhbGhvc3Q6MzgwODFcIjxicj5cbiAqIH0pO1xuICogPC9jb2RlPjxicj5cbiAqIDxicj5cbiAqIDxjb2RlPlxuICogY29uc3Qgd2FsbGV0ID0gYXdhaXQgbW9uZXJvVHMuY3JlYXRlV2FsbGV0RnVsbCh7PGJyPlxuICogJm5ic3A7Jm5ic3A7IHBhdGg6IFwiLi90ZXN0X3dhbGxldHMvd2FsbGV0MVwiLCAvLyBsZWF2ZSBibGFuayBmb3IgaW4tbWVtb3J5IHdhbGxldDxicj5cbiAqICZuYnNwOyZuYnNwOyBwYXNzd29yZDogXCJzdXBlcnNlY3JldHBhc3N3b3JkXCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7IG5ldHdvcmtUeXBlOiBtb25lcm9Ucy5Nb25lcm9OZXR3b3JrVHlwZS5TVEFHRU5FVCw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgc2VlZDogXCJjb2V4aXN0IGlnbG9vIHBhbXBobGV0IGxhZ29vbi4uLlwiLDxicj5cbiAqICZuYnNwOyZuYnNwOyByZXN0b3JlSGVpZ2h0OiAxNTQzMjE4LDxicj5cbiAqICZuYnNwOyZuYnNwOyBwcm94eVRvV29ya2VyOiBmYWxzZSwgLy8gb3ZlcnJpZGUgZGVmYXVsdDxicj5cbiAqICZuYnNwOyZuYnNwOyBzZXJ2ZXI6IHs8YnI+XG4gKiAmbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDsgdXJpOiBcImh0dHA6Ly9sb2NhbGhvc3Q6MzgwODFcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDsgdXNlcm5hbWU6IFwiZGFlbW9uX3VzZXJcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDsgcGFzc3dvcmQ6IFwiZGFlbW9uX3Bhc3N3b3JkXzEyM1wiPGJyPlxuICogJm5ic3A7Jm5ic3A7IH08YnI+XG4gKiB9KTtcbiAqIDwvY29kZT5cbiAqXG4gKiBAcGFyYW0ge1BhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPn0gY29uZmlnIC0gTW9uZXJvV2FsbGV0Q29uZmlnIG9yIGVxdWl2YWxlbnQgY29uZmlnIG9iamVjdFxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucGF0aF0gLSBwYXRoIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbCwgaW4tbWVtb3J5IHdhbGxldCBpZiBub3QgZ2l2ZW4pXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wYXNzd29yZF0gLSBwYXNzd29yZCBvZiB0aGUgd2FsbGV0IHRvIGNyZWF0ZVxuICogQHBhcmFtIHtNb25lcm9OZXR3b3JrVHlwZXxzdHJpbmd9IFtjb25maWcubmV0d29ya1R5cGVdIC0gbmV0d29yayB0eXBlIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvbmUgb2YgXCJtYWlubmV0XCIsIFwidGVzdG5ldFwiLCBcInN0YWdlbmV0XCIgb3IgTW9uZXJvTmV0d29ya1R5cGUuTUFJTk5FVHxURVNUTkVUfFNUQUdFTkVUKVxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VlZF0gLSBzZWVkIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbCwgcmFuZG9tIHdhbGxldCBjcmVhdGVkIGlmIG5laXRoZXIgc2VlZCBub3Iga2V5cyBnaXZlbilcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnNlZWRPZmZzZXRdIC0gdGhlIG9mZnNldCB1c2VkIHRvIGRlcml2ZSBhIG5ldyBzZWVkIGZyb20gdGhlIGdpdmVuIHNlZWQgdG8gcmVjb3ZlciBhIHNlY3JldCB3YWxsZXQgZnJvbSB0aGUgc2VlZCBwaHJhc2VcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5pc011bHRpc2lnXSAtIHJlc3RvcmUgbXVsdGlzaWcgd2FsbGV0IGZyb20gc2VlZFxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpbWFyeUFkZHJlc3NdIC0gcHJpbWFyeSBhZGRyZXNzIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvbmx5IHByb3ZpZGUgaWYgcmVzdG9yaW5nIGZyb20ga2V5cylcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnByaXZhdGVWaWV3S2V5XSAtIHByaXZhdGUgdmlldyBrZXkgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsKVxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpdmF0ZVNwZW5kS2V5XSAtIHByaXZhdGUgc3BlbmQga2V5IG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbClcbiAqIEBwYXJhbSB7bnVtYmVyfSBbY29uZmlnLnJlc3RvcmVIZWlnaHRdIC0gYmxvY2sgaGVpZ2h0IHRvIHN0YXJ0IHNjYW5uaW5nIGZyb20gKGRlZmF1bHRzIHRvIDAgdW5sZXNzIGdlbmVyYXRpbmcgcmFuZG9tIHdhbGxldClcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLmxhbmd1YWdlXSAtIGxhbmd1YWdlIG9mIHRoZSB3YWxsZXQncyBzZWVkIHBocmFzZSAoZGVmYXVsdHMgdG8gXCJFbmdsaXNoXCIgb3IgYXV0by1kZXRlY3RlZClcbiAqIEBwYXJhbSB7bnVtYmVyfSBbY29uZmlnLmFjY291bnRMb29rYWhlYWRdIC0gIG51bWJlciBvZiBhY2NvdW50cyB0byBzY2FuIChvcHRpb25hbClcbiAqIEBwYXJhbSB7bnVtYmVyfSBbY29uZmlnLnN1YmFkZHJlc3NMb29rYWhlYWRdIC0gbnVtYmVyIG9mIHN1YmFkZHJlc3NlcyB0byBzY2FuIHBlciBhY2NvdW50IChvcHRpb25hbClcbiAqIEBwYXJhbSB7c3RyaW5nfFBhcnRpYWw8TW9uZXJvUnBjQ29ubmVjdGlvbj59IFtjb25maWcuc2VydmVyXSAtIGNvbm5lY3Rpb24gdG8gbW9uZXJvIGRhZW1vbiAob3B0aW9uYWwpXG4gKiBAcGFyYW0ge01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyfSBbY29uZmlnLmNvbm5lY3Rpb25NYW5hZ2VyXSAtIG1hbmFnZSBjb25uZWN0aW9ucyB0byBtb25lcm9kIChvcHRpb25hbClcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5yZWplY3RVbmF1dGhvcml6ZWRdIC0gcmVqZWN0IHNlbGYtc2lnbmVkIHNlcnZlciBjZXJ0aWZpY2F0ZXMgaWYgdHJ1ZSAoZGVmYXVsdHMgdG8gdHJ1ZSlcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5wcm94eVRvV29ya2VyXSAtIHByb3hpZXMgd2FsbGV0IG9wZXJhdGlvbnMgdG8gYSB3b3JrZXIgaW4gb3JkZXIgdG8gbm90IGJsb2NrIHRoZSBtYWluIHRocmVhZCAoZGVmYXVsdCB0cnVlKVxuICogQHBhcmFtIHthbnl9IFtjb25maWcuZnNdIC0gZmlsZSBzeXN0ZW0gY29tcGF0aWJsZSB3aXRoIE5vZGUuanMgYGZzLnByb21pc2VzYCBBUEkgKGRlZmF1bHRzIHRvIGRpc2sgb3IgaW4tbWVtb3J5IEZTIGlmIGJyb3dzZXIpXG4gKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1dhbGxldEZ1bGw+fSB0aGUgY3JlYXRlZCB3YWxsZXRcbiAqL1xuZnVuY3Rpb24gY3JlYXRlV2FsbGV0RnVsbChjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPik6IFByb21pc2U8TW9uZXJvV2FsbGV0RnVsbD4ge1xuICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5jcmVhdGVXYWxsZXQobmV3IE1vbmVyb1dhbGxldENvbmZpZyhjb25maWcpKTtcbn1cblxuLyoqXG4gKiA8cD5PcGVuIGFuIGV4aXN0aW5nIE1vbmVybyB3YWxsZXQgdXNpbmcgY2xpZW50LXNpZGUgV2ViQXNzZW1ibHkgYmluZGluZ3MgdG8gbW9uZXJvLXByb2plY3QncyB3YWxsZXQyIGluIEMrKy48cD5cbiAqXG4gKiA8cD5FeGFtcGxlOjxwPlxuICpcbiAqIDxjb2RlPlxuICogY29uc3Qgd2FsbGV0ID0gYXdhaXQgbW9uZXJvVHMub3BlbldhbGxldEZ1bGwoezxicj5cbiAqICZuYnNwOyZuYnNwOyBwYXRoOiBcIi4vd2FsbGV0cy93YWxsZXQxXCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7IHBhc3N3b3JkOiBcInN1cGVyc2VjcmV0cGFzc3dvcmRcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgbmV0d29ya1R5cGU6IG1vbmVyb1RzLk1vbmVyb05ldHdvcmtUeXBlLlNUQUdFTkVULDxicj5cbiAqICZuYnNwOyZuYnNwOyBzZXJ2ZXI6IHsgLy8gZGFlbW9uIGNvbmZpZ3VyYXRpb248YnI+XG4gKiAmbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDsgdXJpOiBcImh0dHA6Ly9sb2NhbGhvc3Q6MzgwODFcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDsgdXNlcm5hbWU6IFwic3VwZXJ1c2VyXCIsPGJyPlxuICogJm5ic3A7Jm5ic3A7Jm5ic3A7Jm5ic3A7IHBhc3N3b3JkOiBcImFiY3Rlc3RpbmcxMjNcIjxicj5cbiAqICZuYnNwOyZuYnNwOyB9PGJyPlxuICogfSk7XG4gKiA8L2NvZGU+XG4gKlxuICogQHBhcmFtIHtQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz59IGNvbmZpZyAtIGNvbmZpZyB0byBvcGVuIGEgZnVsbCB3YWxsZXRcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnBhdGhdIC0gcGF0aCBvZiB0aGUgd2FsbGV0IHRvIG9wZW4gKG9wdGlvbmFsIGlmICdrZXlzRGF0YScgcHJvdmlkZWQpXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wYXNzd29yZF0gLSBwYXNzd29yZCBvZiB0aGUgd2FsbGV0IHRvIG9wZW5cbiAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcn0gW2NvbmZpZy5uZXR3b3JrVHlwZV0gLSBuZXR3b3JrIHR5cGUgb2YgdGhlIHdhbGxldCB0byBvcGVuIChvbmUgb2YgXCJtYWlubmV0XCIsIFwidGVzdG5ldFwiLCBcInN0YWdlbmV0XCIgb3IgTW9uZXJvTmV0d29ya1R5cGUuTUFJTk5FVHxURVNUTkVUfFNUQUdFTkVUKVxuICogQHBhcmFtIHtzdHJpbmd8TW9uZXJvUnBjQ29ubmVjdGlvbn0gW2NvbmZpZy5zZXJ2ZXJdIC0gdXJpIG9yIGNvbm5lY3Rpb24gdG8gbW9uZXJvIGRhZW1vbiAob3B0aW9uYWwpXG4gKiBAcGFyYW0ge1VpbnQ4QXJyYXl9IFtjb25maWcua2V5c0RhdGFdIC0gd2FsbGV0IGtleXMgZGF0YSB0byBvcGVuIChvcHRpb25hbCBpZiBwYXRoIHByb3ZpZGVkKVxuICogQHBhcmFtIHtVaW50OEFycmF5fSBbY29uZmlnLmNhY2hlRGF0YV0gLSB3YWxsZXQgY2FjaGUgZGF0YSB0byBvcGVuIChvcHRpb25hbClcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5wcm94eVRvV29ya2VyXSAtIHByb3hpZXMgd2FsbGV0IG9wZXJhdGlvbnMgdG8gYSB3b3JrZXIgaW4gb3JkZXIgdG8gbm90IGJsb2NrIHRoZSBtYWluIHRocmVhZCAoZGVmYXVsdCB0cnVlKVxuICogQHBhcmFtIHthbnl9IFtjb25maWcuZnNdIC0gZmlsZSBzeXN0ZW0gY29tcGF0aWJsZSB3aXRoIE5vZGUuanMgYGZzLnByb21pc2VzYCBBUEkgKGRlZmF1bHRzIHRvIGRpc2sgb3IgaW4tbWVtb3J5IEZTIGlmIGJyb3dzZXIpXG4gKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1dhbGxldEZ1bGw+fSB0aGUgb3BlbmVkIHdhbGxldFxuICovXG5mdW5jdGlvbiBvcGVuV2FsbGV0RnVsbChjb25maWc6IFBhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPik6IFByb21pc2U8TW9uZXJvV2FsbGV0RnVsbD4ge1xuICByZXR1cm4gTW9uZXJvV2FsbGV0RnVsbC5vcGVuV2FsbGV0KG5ldyBNb25lcm9XYWxsZXRDb25maWcoY29uZmlnKSk7XG59XG5cbi8qKlxuICogPHA+Q3JlYXRlIGEgd2FsbGV0IHVzaW5nIFdlYkFzc2VtYmx5IGJpbmRpbmdzIHRvIG1vbmVyby1wcm9qZWN0LjwvcD5cbiAqXG4gKiA8cD5FeGFtcGxlOjwvcD5cbiAqXG4gKiA8Y29kZT5cbiAqIGNvbnN0IHdhbGxldCA9IGF3YWl0IG1vbmVyb1RzLmNyZWF0ZVdhbGxldEtleXMoezxicj5cbiAqICZuYnNwOyZuYnNwOyBwYXNzd29yZDogXCJhYmMxMjNcIiw8YnI+XG4gKiAmbmJzcDsmbmJzcDsgbmV0d29ya1R5cGU6IG1vbmVyb1RzLk1vbmVyb05ldHdvcmtUeXBlLlNUQUdFTkVULDxicj5cbiAqICZuYnNwOyZuYnNwOyBzZWVkOiBcImNvZXhpc3QgaWdsb28gcGFtcGhsZXQgbGFnb29uLi4uXCI8YnI+XG4gKiB9KTtcbiAqIDwvY29kZT5cbiAqXG4gKiBAcGFyYW0ge1BhcnRpYWw8TW9uZXJvV2FsbGV0Q29uZmlnPn0gY29uZmlnIC0gTW9uZXJvV2FsbGV0Q29uZmlnIG9yIGVxdWl2YWxlbnQgY29uZmlnIG9iamVjdFxuICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSBjb25maWcubmV0d29ya1R5cGUgLSBuZXR3b3JrIHR5cGUgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9uZSBvZiBcIm1haW5uZXRcIiwgXCJ0ZXN0bmV0XCIsIFwic3RhZ2VuZXRcIiBvciBNb25lcm9OZXR3b3JrVHlwZS5NQUlOTkVUfFRFU1RORVR8U1RBR0VORVQpXG4gKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5zZWVkXSAtIHNlZWQgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsLCByYW5kb20gd2FsbGV0IGNyZWF0ZWQgaWYgbmVpdGhlciBzZWVkIG5vciBrZXlzIGdpdmVuKVxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcuc2VlZE9mZnNldF0gLSB0aGUgb2Zmc2V0IHVzZWQgdG8gZGVyaXZlIGEgbmV3IHNlZWQgZnJvbSB0aGUgZ2l2ZW4gc2VlZCB0byByZWNvdmVyIGEgc2VjcmV0IHdhbGxldCBmcm9tIHRoZSBzZWVkIHBocmFzZVxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpbWFyeUFkZHJlc3NdIC0gcHJpbWFyeSBhZGRyZXNzIG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvbmx5IHByb3ZpZGUgaWYgcmVzdG9yaW5nIGZyb20ga2V5cylcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnByaXZhdGVWaWV3S2V5XSAtIHByaXZhdGUgdmlldyBrZXkgb2YgdGhlIHdhbGxldCB0byBjcmVhdGUgKG9wdGlvbmFsKVxuICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucHJpdmF0ZVNwZW5kS2V5XSAtIHByaXZhdGUgc3BlbmQga2V5IG9mIHRoZSB3YWxsZXQgdG8gY3JlYXRlIChvcHRpb25hbClcbiAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLmxhbmd1YWdlXSAtIGxhbmd1YWdlIG9mIHRoZSB3YWxsZXQncyBzZWVkIChkZWZhdWx0cyB0byBcIkVuZ2xpc2hcIiBvciBhdXRvLWRldGVjdGVkKVxuICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9XYWxsZXRLZXlzPn0gdGhlIGNyZWF0ZWQgd2FsbGV0XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVdhbGxldEtleXMoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1dhbGxldENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1dhbGxldEtleXM+IHtcbiAgcmV0dXJuIE1vbmVyb1dhbGxldEtleXMuY3JlYXRlV2FsbGV0KG5ldyBNb25lcm9XYWxsZXRDb25maWcoY29uZmlnKSk7XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBFWFBPUlRTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuZXhwb3J0IHtcblxuICAvLyB0eXBlc1xuICBHZW5VdGlscyxcbiAgRmlsdGVyLFxuICBNb25lcm9FcnJvcixcbiAgSHR0cENsaWVudCxcbiAgTGlicmFyeVV0aWxzLFxuICBNb25lcm9ScGNDb25uZWN0aW9uLFxuICBNb25lcm9ScGNFcnJvcixcbiAgU3NsT3B0aW9ucyxcbiAgVGFza0xvb3BlcixcbiAgQ29ubmVjdGlvblR5cGUsXG4gIE1vbmVyb0FsdENoYWluLFxuICBNb25lcm9CYW4sXG4gIE1vbmVyb0Jsb2NrSGVhZGVyLFxuICBNb25lcm9CbG9jayxcbiAgTW9uZXJvQmxvY2tUZW1wbGF0ZSxcbiAgTW9uZXJvQ29ubmVjdGlvblNwYW4sXG4gIE1vbmVyb0RhZW1vbkNvbmZpZyxcbiAgTW9uZXJvRGFlbW9uSW5mbyxcbiAgTW9uZXJvRGFlbW9uTGlzdGVuZXIsXG4gIE1vbmVyb0RhZW1vblN5bmNJbmZvLFxuICBNb25lcm9EYWVtb25VcGRhdGVDaGVja1Jlc3VsdCxcbiAgTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQsXG4gIE1vbmVyb0ZlZUVzdGltYXRlLFxuICBNb25lcm9IYXJkRm9ya0luZm8sXG4gIE1vbmVyb0tleUltYWdlLFxuICBNb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzLFxuICBNb25lcm9NaW5lclR4U3VtLFxuICBNb25lcm9NaW5pbmdTdGF0dXMsXG4gIE1vbmVyb05ldHdvcmtUeXBlLFxuICBNb25lcm9PdXRwdXQsXG4gIE1vbmVyb091dHB1dEhpc3RvZ3JhbUVudHJ5LFxuICBNb25lcm9TdWJtaXRUeFJlc3VsdCxcbiAgTW9uZXJvVHgsXG4gIE1vbmVyb1R4UG9vbFN0YXRzLFxuICBNb25lcm9WZXJzaW9uLFxuICBNb25lcm9QZWVyLFxuICBNb25lcm9QcnVuZVJlc3VsdCxcbiAgTW9uZXJvQWNjb3VudCxcbiAgTW9uZXJvQWNjb3VudFRhZyxcbiAgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSxcbiAgTW9uZXJvQ2hlY2ssXG4gIE1vbmVyb0NoZWNrUmVzZXJ2ZSxcbiAgTW9uZXJvQ2hlY2tUeCxcbiAgTW9uZXJvRGVzdGluYXRpb24sXG4gIE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzLFxuICBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCxcbiAgTW9uZXJvTXVsdGlzaWdJbmZvLFxuICBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQsXG4gIE1vbmVyb011bHRpc2lnU2lnblJlc3VsdCxcbiAgTW9uZXJvT3V0cHV0V2FsbGV0LFxuICBNb25lcm9PdXRwdXRRdWVyeSxcbiAgTW9uZXJvVHhQcmlvcml0eSxcbiAgTW9uZXJvVHhDb25maWcsXG4gIE1vbmVyb1N1YmFkZHJlc3MsXG4gIE1vbmVyb1N5bmNSZXN1bHQsXG4gIE1vbmVyb1RyYW5zZmVyLFxuICBNb25lcm9JbmNvbWluZ1RyYW5zZmVyLFxuICBNb25lcm9PdXRnb2luZ1RyYW5zZmVyLFxuICBNb25lcm9UcmFuc2ZlclF1ZXJ5LFxuICBNb25lcm9UeFNldCxcbiAgTW9uZXJvVHhXYWxsZXQsXG4gIE1vbmVyb1R4UXVlcnksXG4gIE1vbmVyb1dhbGxldExpc3RlbmVyLFxuICBNb25lcm9XYWxsZXRDb25maWcsXG4gIE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLFxuICBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0LFxuICBNb25lcm9Db25uZWN0aW9uTWFuYWdlckxpc3RlbmVyLFxuICBNb25lcm9Db25uZWN0aW9uTWFuYWdlcixcbiAgTW9uZXJvRGFlbW9uLFxuICBNb25lcm9XYWxsZXQsXG4gIE1vbmVyb0RhZW1vblJwYyxcbiAgTW9uZXJvV2FsbGV0UnBjLFxuICBNb25lcm9XYWxsZXRLZXlzLFxuICBNb25lcm9XYWxsZXRGdWxsLFxuICBNb25lcm9VdGlscyxcbiAgVGhyZWFkUG9vbCxcblxuICAvLyBnbG9iYWwgZnVuY3Rpb25zXG4gIGdldFZlcnNpb24sXG4gIGNvbm5lY3RUb0RhZW1vblJwYyxcbiAgY29ubmVjdFRvV2FsbGV0UnBjLFxuICBjcmVhdGVXYWxsZXRGdWxsLFxuICBvcGVuV2FsbGV0RnVsbCxcbiAgY3JlYXRlV2FsbGV0S2V5c1xufTtcblxuLy8gZXhwb3J0IGRlZmF1bHQgb2JqZWN0IHdpdGggYWdncmVnYXRlIG9mIGFsbCBleHBvcnRzXG5jb25zdCBtb25lcm9UcyA9IHtcbiAgR2VuVXRpbHMsXG4gIEZpbHRlcixcbiAgTW9uZXJvRXJyb3IsXG4gIEh0dHBDbGllbnQsXG4gIExpYnJhcnlVdGlscyxcbiAgTW9uZXJvUnBjQ29ubmVjdGlvbixcbiAgTW9uZXJvUnBjRXJyb3IsXG4gIFNzbE9wdGlvbnMsXG4gIFRhc2tMb29wZXIsXG4gIENvbm5lY3Rpb25UeXBlLFxuICBNb25lcm9BbHRDaGFpbixcbiAgTW9uZXJvQmFuLFxuICBNb25lcm9CbG9ja0hlYWRlcixcbiAgTW9uZXJvQmxvY2ssXG4gIE1vbmVyb0Jsb2NrVGVtcGxhdGUsXG4gIE1vbmVyb0Nvbm5lY3Rpb25TcGFuLFxuICBNb25lcm9EYWVtb25Db25maWcsXG4gIE1vbmVyb0RhZW1vbkluZm8sXG4gIE1vbmVyb0RhZW1vbkxpc3RlbmVyLFxuICBNb25lcm9EYWVtb25TeW5jSW5mbyxcbiAgTW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQsXG4gIE1vbmVyb0RhZW1vblVwZGF0ZURvd25sb2FkUmVzdWx0LFxuICBNb25lcm9GZWVFc3RpbWF0ZSxcbiAgTW9uZXJvSGFyZEZvcmtJbmZvLFxuICBNb25lcm9LZXlJbWFnZSxcbiAgTW9uZXJvS2V5SW1hZ2VTcGVudFN0YXR1cyxcbiAgTW9uZXJvTWluZXJUeFN1bSxcbiAgTW9uZXJvTWluaW5nU3RhdHVzLFxuICBNb25lcm9OZXR3b3JrVHlwZSxcbiAgTW9uZXJvT3V0cHV0LFxuICBNb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeSxcbiAgTW9uZXJvU3VibWl0VHhSZXN1bHQsXG4gIE1vbmVyb1R4LFxuICBNb25lcm9UeFBvb2xTdGF0cyxcbiAgTW9uZXJvVmVyc2lvbixcbiAgTW9uZXJvUGVlcixcbiAgTW9uZXJvUHJ1bmVSZXN1bHQsXG4gIE1vbmVyb0FjY291bnQsXG4gIE1vbmVyb0FjY291bnRUYWcsXG4gIE1vbmVyb0FkZHJlc3NCb29rRW50cnksXG4gIE1vbmVyb0NoZWNrLFxuICBNb25lcm9DaGVja1Jlc2VydmUsXG4gIE1vbmVyb0NoZWNrVHgsXG4gIE1vbmVyb0Rlc3RpbmF0aW9uLFxuICBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyxcbiAgTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQsXG4gIE1vbmVyb011bHRpc2lnSW5mbyxcbiAgTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0LFxuICBNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQsXG4gIE1vbmVyb091dHB1dFdhbGxldCxcbiAgTW9uZXJvT3V0cHV0UXVlcnksXG4gIE1vbmVyb1R4UHJpb3JpdHksXG4gIE1vbmVyb1R4Q29uZmlnLFxuICBNb25lcm9TdWJhZGRyZXNzLFxuICBNb25lcm9TeW5jUmVzdWx0LFxuICBNb25lcm9UcmFuc2ZlcixcbiAgTW9uZXJvSW5jb21pbmdUcmFuc2ZlcixcbiAgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcixcbiAgTW9uZXJvVHJhbnNmZXJRdWVyeSxcbiAgTW9uZXJvVHhTZXQsXG4gIE1vbmVyb1R4V2FsbGV0LFxuICBNb25lcm9UeFF1ZXJ5LFxuICBNb25lcm9XYWxsZXRMaXN0ZW5lcixcbiAgTW9uZXJvV2FsbGV0Q29uZmlnLFxuICBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSxcbiAgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCxcbiAgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lcixcbiAgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIsXG4gIE1vbmVyb0RhZW1vbixcbiAgTW9uZXJvV2FsbGV0LFxuICBNb25lcm9EYWVtb25ScGMsXG4gIE1vbmVyb1dhbGxldFJwYyxcbiAgTW9uZXJvV2FsbGV0S2V5cyxcbiAgTW9uZXJvV2FsbGV0RnVsbCxcbiAgTW9uZXJvVXRpbHMsXG4gIFRocmVhZFBvb2wsXG5cbiAgLy8gZ2xvYmFsIGZ1bmN0aW9uc1xuICBnZXRWZXJzaW9uLFxuICBjb25uZWN0VG9EYWVtb25ScGMsXG4gIGNvbm5lY3RUb1dhbGxldFJwYyxcbiAgY3JlYXRlV2FsbGV0RnVsbCxcbiAgb3BlbldhbGxldEZ1bGwsXG4gIGNyZWF0ZVdhbGxldEtleXNcbn1cbmV4cG9ydCBkZWZhdWx0IG1vbmVyb1RzO1xuXG4vLyBhdWdtZW50IGdsb2JhbCBzY29wZSB3aXRoIHNhbWUgbmFtZXNwYWNlIGFzIGRlZmF1bHQgZXhwb3J0XG5kZWNsYXJlIGdsb2JhbCB7XG4gIG5hbWVzcGFjZSBtb25lcm9UcyB7XG4gICAgdHlwZSBHZW5VdGlscyA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5HZW5VdGlscz47XG4gICAgdHlwZSBGaWx0ZXIgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuRmlsdGVyPjtcbiAgICB0eXBlIE1vbmVyb0Vycm9yID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0Vycm9yPjtcbiAgICB0eXBlIEh0dHBDbGllbnQgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuSHR0cENsaWVudD47XG4gICAgdHlwZSBMaWJyYXJ5VXRpbHMgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTGlicmFyeVV0aWxzPjtcbiAgICB0eXBlIE1vbmVyb1JwY0Nvbm5lY3Rpb24gPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvUnBjQ29ubmVjdGlvbj47XG4gICAgdHlwZSBNb25lcm9ScGNFcnJvciA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9ScGNFcnJvcj47XG4gICAgdHlwZSBTc2xPcHRpb25zID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLlNzbE9wdGlvbnM+O1xuICAgIHR5cGUgVGFza0xvb3BlciA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5UYXNrTG9vcGVyPjtcbiAgICB0eXBlIENvbm5lY3Rpb25UeXBlID0gaW1wb3J0KFwiLi9pbmRleFwiKS5Db25uZWN0aW9uVHlwZTsgLy8gdHlwZSBhbGlhcyBmb3IgZW51bVxuICAgIHR5cGUgTW9uZXJvQWx0Q2hhaW4gPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvQWx0Q2hhaW4+O1xuICAgIHR5cGUgTW9uZXJvQmFuID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0Jhbj47XG4gICAgdHlwZSBNb25lcm9CbG9ja0hlYWRlciA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9CbG9ja0hlYWRlcj47XG4gICAgdHlwZSBNb25lcm9CbG9jayA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9CbG9jaz47XG4gICAgdHlwZSBNb25lcm9CbG9ja1RlbXBsYXRlID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0Jsb2NrVGVtcGxhdGU+O1xuICAgIHR5cGUgTW9uZXJvQ29ubmVjdGlvblNwYW4gPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvQ29ubmVjdGlvblNwYW4+O1xuICAgIHR5cGUgTW9uZXJvRGFlbW9uQ29uZmlnID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0RhZW1vbkNvbmZpZz47XG4gICAgdHlwZSBNb25lcm9EYWVtb25JbmZvID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0RhZW1vbkluZm8+O1xuICAgIHR5cGUgTW9uZXJvRGFlbW9uTGlzdGVuZXIgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvRGFlbW9uTGlzdGVuZXI+O1xuICAgIHR5cGUgTW9uZXJvRGFlbW9uU3luY0luZm8gPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvRGFlbW9uU3luY0luZm8+O1xuICAgIHR5cGUgTW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvRGFlbW9uVXBkYXRlQ2hlY2tSZXN1bHQ+O1xuICAgIHR5cGUgTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvRGFlbW9uVXBkYXRlRG93bmxvYWRSZXN1bHQ+O1xuICAgIHR5cGUgTW9uZXJvRmVlRXN0aW1hdGUgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvRmVlRXN0aW1hdGU+O1xuICAgIHR5cGUgTW9uZXJvSGFyZEZvcmtJbmZvID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0hhcmRGb3JrSW5mbz47XG4gICAgdHlwZSBNb25lcm9LZXlJbWFnZSA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9LZXlJbWFnZT47XG4gICAgdHlwZSBNb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzID0gaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9LZXlJbWFnZVNwZW50U3RhdHVzO1xuICAgIHR5cGUgTW9uZXJvTWluZXJUeFN1bSA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9NaW5lclR4U3VtPjtcbiAgICB0eXBlIE1vbmVyb01pbmluZ1N0YXR1cyA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9NaW5pbmdTdGF0dXM+O1xuICAgIHR5cGUgTW9uZXJvTmV0d29ya1R5cGUgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvTmV0d29ya1R5cGU+O1xuICAgIHR5cGUgTW9uZXJvT3V0cHV0ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb091dHB1dD47XG4gICAgdHlwZSBNb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeSA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9PdXRwdXRIaXN0b2dyYW1FbnRyeT47XG4gICAgdHlwZSBNb25lcm9TdWJtaXRUeFJlc3VsdCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9TdWJtaXRUeFJlc3VsdD47XG4gICAgdHlwZSBNb25lcm9UeCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9UeD47XG4gICAgdHlwZSBNb25lcm9UeFBvb2xTdGF0cyA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9UeFBvb2xTdGF0cz47XG4gICAgdHlwZSBNb25lcm9WZXJzaW9uID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1ZlcnNpb24+O1xuICAgIHR5cGUgTW9uZXJvUGVlciA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9QZWVyPjtcbiAgICB0eXBlIE1vbmVyb1BydW5lUmVzdWx0ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1BydW5lUmVzdWx0PjtcbiAgICB0eXBlIE1vbmVyb0FjY291bnQgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvQWNjb3VudD47XG4gICAgdHlwZSBNb25lcm9BY2NvdW50VGFnID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0FjY291bnRUYWc+O1xuICAgIHR5cGUgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9BZGRyZXNzQm9va0VudHJ5PjtcbiAgICB0eXBlIE1vbmVyb0NoZWNrID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0NoZWNrPjtcbiAgICB0eXBlIE1vbmVyb0NoZWNrUmVzZXJ2ZSA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9DaGVja1Jlc2VydmU+O1xuICAgIHR5cGUgTW9uZXJvQ2hlY2tUeCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9DaGVja1R4PjtcbiAgICB0eXBlIE1vbmVyb0Rlc3RpbmF0aW9uID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0Rlc3RpbmF0aW9uPjtcbiAgICB0eXBlIE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0ludGVncmF0ZWRBZGRyZXNzPjtcbiAgICB0eXBlIE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0PjtcbiAgICB0eXBlIE1vbmVyb011bHRpc2lnSW5mbyA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9NdWx0aXNpZ0luZm8+O1xuICAgIHR5cGUgTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb011bHRpc2lnSW5pdFJlc3VsdD47XG4gICAgdHlwZSBNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0PjtcbiAgICB0eXBlIE1vbmVyb091dHB1dFdhbGxldCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9PdXRwdXRXYWxsZXQ+O1xuICAgIHR5cGUgTW9uZXJvT3V0cHV0UXVlcnkgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvT3V0cHV0UXVlcnk+O1xuICAgIHR5cGUgTW9uZXJvVHhQcmlvcml0eSA9IGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvVHhQcmlvcml0eTtcbiAgICB0eXBlIE1vbmVyb1R4Q29uZmlnID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1R4Q29uZmlnPjtcbiAgICB0eXBlIE1vbmVyb1N1YmFkZHJlc3MgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvU3ViYWRkcmVzcz47XG4gICAgdHlwZSBNb25lcm9TeW5jUmVzdWx0ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1N5bmNSZXN1bHQ+O1xuICAgIHR5cGUgTW9uZXJvVHJhbnNmZXIgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvVHJhbnNmZXI+O1xuICAgIHR5cGUgTW9uZXJvSW5jb21pbmdUcmFuc2ZlciA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9JbmNvbWluZ1RyYW5zZmVyPjtcbiAgICB0eXBlIE1vbmVyb091dGdvaW5nVHJhbnNmZXIgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvT3V0Z29pbmdUcmFuc2Zlcj47XG4gICAgdHlwZSBNb25lcm9UcmFuc2ZlclF1ZXJ5ID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1RyYW5zZmVyUXVlcnk+O1xuICAgIHR5cGUgTW9uZXJvVHhTZXQgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvVHhTZXQ+O1xuICAgIHR5cGUgTW9uZXJvVHhXYWxsZXQgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvVHhXYWxsZXQ+O1xuICAgIHR5cGUgTW9uZXJvVHhRdWVyeSA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9UeFF1ZXJ5PjtcbiAgICB0eXBlIE1vbmVyb1dhbGxldExpc3RlbmVyID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1dhbGxldExpc3RlbmVyPjtcbiAgICB0eXBlIE1vbmVyb1dhbGxldENvbmZpZyA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9XYWxsZXRDb25maWc+O1xuICAgIHR5cGUgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUgPSBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlO1xuICAgIHR5cGUgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0PjtcbiAgICB0eXBlIE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lcj47XG4gICAgdHlwZSBNb25lcm9Db25uZWN0aW9uTWFuYWdlciA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9Db25uZWN0aW9uTWFuYWdlcj47XG4gICAgdHlwZSBNb25lcm9EYWVtb24gPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvRGFlbW9uPjtcbiAgICB0eXBlIE1vbmVyb1dhbGxldCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5Nb25lcm9XYWxsZXQ+O1xuICAgIHR5cGUgTW9uZXJvRGFlbW9uUnBjID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb0RhZW1vblJwYz47XG4gICAgdHlwZSBNb25lcm9XYWxsZXRScGMgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvV2FsbGV0UnBjPjtcbiAgICB0eXBlIE1vbmVyb1dhbGxldEtleXMgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvV2FsbGV0S2V5cz47XG4gICAgdHlwZSBNb25lcm9XYWxsZXRGdWxsID0gSW5zdGFuY2VUeXBlPHR5cGVvZiBpbXBvcnQoXCIuL2luZGV4XCIpLk1vbmVyb1dhbGxldEZ1bGw+O1xuICAgIHR5cGUgTW9uZXJvVXRpbHMgPSBJbnN0YW5jZVR5cGU8dHlwZW9mIGltcG9ydChcIi4vaW5kZXhcIikuTW9uZXJvVXRpbHM+O1xuICAgIHR5cGUgVGhyZWFkUG9vbCA9IEluc3RhbmNlVHlwZTx0eXBlb2YgaW1wb3J0KFwiLi9pbmRleFwiKS5UaHJlYWRQb29sPjtcbiAgfVxufSJdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWTs7QUFFWjs7QUFFQTs7QUFFQTtBQUFBLElBQUFBLHNCQUFBLEdBQUFDLE9BQUEsaURBQUFDLE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLGtCQUFBQyxLQUFBLFVBQUFILE1BQUEsQ0FBQUMsY0FBQSxDQUFBQyxPQUFBLHNCQUFBRSxVQUFBLFFBQUFDLEdBQUEsV0FBQUEsQ0FBQSxVQUFBQyxlQUFBLENBQUFDLE9BQUEsTUFBQVAsTUFBQSxDQUFBQyxjQUFBLENBQUFDLE9BQUEsY0FBQUUsVUFBQSxRQUFBQyxHQUFBLFdBQUFBLENBQUEsVUFBQUcsT0FBQSxDQUFBRCxPQUFBLE1BQUFQLE1BQUEsQ0FBQUMsY0FBQSxDQUFB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