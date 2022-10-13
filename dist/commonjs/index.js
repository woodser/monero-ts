'use strict';
/**
 * Export all library models.
 * 
 * See the full model specification: http://moneroecosystem.org/monero-java/monero-spec.pdf
 */
// export common models

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "ConnectionType", {
  enumerable: true,
  get: function get() {
    return _ConnectionType["default"];
  }
});
Object.defineProperty(exports, "Filter", {
  enumerable: true,
  get: function get() {
    return _Filter["default"];
  }
});
Object.defineProperty(exports, "GenUtils", {
  enumerable: true,
  get: function get() {
    return _GenUtils["default"];
  }
});
Object.defineProperty(exports, "HttpClient", {
  enumerable: true,
  get: function get() {
    return _HttpClient["default"];
  }
});
Object.defineProperty(exports, "LibraryUtils", {
  enumerable: true,
  get: function get() {
    return _LibraryUtils["default"];
  }
});
Object.defineProperty(exports, "MoneroAccount", {
  enumerable: true,
  get: function get() {
    return _MoneroAccount["default"];
  }
});
Object.defineProperty(exports, "MoneroAccountTag", {
  enumerable: true,
  get: function get() {
    return _MoneroAccountTag["default"];
  }
});
Object.defineProperty(exports, "MoneroAddressBookEntry", {
  enumerable: true,
  get: function get() {
    return _MoneroAddressBookEntry["default"];
  }
});
Object.defineProperty(exports, "MoneroAltChain", {
  enumerable: true,
  get: function get() {
    return _MoneroAltChain["default"];
  }
});
Object.defineProperty(exports, "MoneroBan", {
  enumerable: true,
  get: function get() {
    return _MoneroBan["default"];
  }
});
Object.defineProperty(exports, "MoneroBlock", {
  enumerable: true,
  get: function get() {
    return _MoneroBlock["default"];
  }
});
Object.defineProperty(exports, "MoneroBlockHeader", {
  enumerable: true,
  get: function get() {
    return _MoneroBlockHeader["default"];
  }
});
Object.defineProperty(exports, "MoneroBlockTemplate", {
  enumerable: true,
  get: function get() {
    return _MoneroBlockTemplate["default"];
  }
});
Object.defineProperty(exports, "MoneroCheck", {
  enumerable: true,
  get: function get() {
    return _MoneroCheck["default"];
  }
});
Object.defineProperty(exports, "MoneroCheckReserve", {
  enumerable: true,
  get: function get() {
    return _MoneroCheckReserve["default"];
  }
});
Object.defineProperty(exports, "MoneroCheckTx", {
  enumerable: true,
  get: function get() {
    return _MoneroCheckTx["default"];
  }
});
Object.defineProperty(exports, "MoneroConnectionManager", {
  enumerable: true,
  get: function get() {
    return _MoneroConnectionManager["default"];
  }
});
Object.defineProperty(exports, "MoneroConnectionManagerListener", {
  enumerable: true,
  get: function get() {
    return _MoneroConnectionManagerListener["default"];
  }
});
Object.defineProperty(exports, "MoneroConnectionSpan", {
  enumerable: true,
  get: function get() {
    return _MoneroConnectionSpan["default"];
  }
});
Object.defineProperty(exports, "MoneroDaemon", {
  enumerable: true,
  get: function get() {
    return _MoneroDaemon["default"];
  }
});
Object.defineProperty(exports, "MoneroDaemonInfo", {
  enumerable: true,
  get: function get() {
    return _MoneroDaemonInfo["default"];
  }
});
Object.defineProperty(exports, "MoneroDaemonListener", {
  enumerable: true,
  get: function get() {
    return _MoneroDaemonListener["default"];
  }
});
Object.defineProperty(exports, "MoneroDaemonRpc", {
  enumerable: true,
  get: function get() {
    return _MoneroDaemonRpc["default"];
  }
});
Object.defineProperty(exports, "MoneroDaemonSyncInfo", {
  enumerable: true,
  get: function get() {
    return _MoneroDaemonSyncInfo["default"];
  }
});
Object.defineProperty(exports, "MoneroDaemonUpdateCheckResult", {
  enumerable: true,
  get: function get() {
    return _MoneroDaemonUpdateCheckResult["default"];
  }
});
Object.defineProperty(exports, "MoneroDaemonUpdateDownloadResult", {
  enumerable: true,
  get: function get() {
    return _MoneroDaemonUpdateDownloadResult["default"];
  }
});
Object.defineProperty(exports, "MoneroDestination", {
  enumerable: true,
  get: function get() {
    return _MoneroDestination["default"];
  }
});
Object.defineProperty(exports, "MoneroError", {
  enumerable: true,
  get: function get() {
    return _MoneroError["default"];
  }
});
Object.defineProperty(exports, "MoneroHardForkInfo", {
  enumerable: true,
  get: function get() {
    return _MoneroHardForkInfo["default"];
  }
});
Object.defineProperty(exports, "MoneroIncomingTransfer", {
  enumerable: true,
  get: function get() {
    return _MoneroIncomingTransfer["default"];
  }
});
Object.defineProperty(exports, "MoneroIntegratedAddress", {
  enumerable: true,
  get: function get() {
    return _MoneroIntegratedAddress["default"];
  }
});
Object.defineProperty(exports, "MoneroKeyImage", {
  enumerable: true,
  get: function get() {
    return _MoneroKeyImage["default"];
  }
});
Object.defineProperty(exports, "MoneroKeyImageImportResult", {
  enumerable: true,
  get: function get() {
    return _MoneroKeyImageImportResult["default"];
  }
});
Object.defineProperty(exports, "MoneroKeyImageSpentStatus", {
  enumerable: true,
  get: function get() {
    return _MoneroKeyImageSpentStatus["default"];
  }
});
Object.defineProperty(exports, "MoneroMessageSignatureResult", {
  enumerable: true,
  get: function get() {
    return _MoneroMessageSignatureResult["default"];
  }
});
Object.defineProperty(exports, "MoneroMessageSignatureType", {
  enumerable: true,
  get: function get() {
    return _MoneroMessageSignatureType["default"];
  }
});
Object.defineProperty(exports, "MoneroMinerTxSum", {
  enumerable: true,
  get: function get() {
    return _MoneroMinerTxSum["default"];
  }
});
Object.defineProperty(exports, "MoneroMiningStatus", {
  enumerable: true,
  get: function get() {
    return _MoneroMiningStatus["default"];
  }
});
Object.defineProperty(exports, "MoneroMultisigInfo", {
  enumerable: true,
  get: function get() {
    return _MoneroMultisigInfo["default"];
  }
});
Object.defineProperty(exports, "MoneroMultisigInitResult", {
  enumerable: true,
  get: function get() {
    return _MoneroMultisigInitResult["default"];
  }
});
Object.defineProperty(exports, "MoneroMultisigSignResult", {
  enumerable: true,
  get: function get() {
    return _MoneroMultisigSignResult["default"];
  }
});
Object.defineProperty(exports, "MoneroNetworkType", {
  enumerable: true,
  get: function get() {
    return _MoneroNetworkType["default"];
  }
});
Object.defineProperty(exports, "MoneroOutgoingTransfer", {
  enumerable: true,
  get: function get() {
    return _MoneroOutgoingTransfer["default"];
  }
});
Object.defineProperty(exports, "MoneroOutput", {
  enumerable: true,
  get: function get() {
    return _MoneroOutput["default"];
  }
});
Object.defineProperty(exports, "MoneroOutputHistogramEntry", {
  enumerable: true,
  get: function get() {
    return _MoneroOutputHistogramEntry["default"];
  }
});
Object.defineProperty(exports, "MoneroOutputQuery", {
  enumerable: true,
  get: function get() {
    return _MoneroOutputQuery["default"];
  }
});
Object.defineProperty(exports, "MoneroOutputWallet", {
  enumerable: true,
  get: function get() {
    return _MoneroOutputWallet["default"];
  }
});
Object.defineProperty(exports, "MoneroPeer", {
  enumerable: true,
  get: function get() {
    return _MoneroPeer["default"];
  }
});
Object.defineProperty(exports, "MoneroRpcConnection", {
  enumerable: true,
  get: function get() {
    return _MoneroRpcConnection["default"];
  }
});
Object.defineProperty(exports, "MoneroRpcError", {
  enumerable: true,
  get: function get() {
    return _MoneroRpcError["default"];
  }
});
Object.defineProperty(exports, "MoneroSubaddress", {
  enumerable: true,
  get: function get() {
    return _MoneroSubaddress["default"];
  }
});
Object.defineProperty(exports, "MoneroSubmitTxResult", {
  enumerable: true,
  get: function get() {
    return _MoneroSubmitTxResult["default"];
  }
});
Object.defineProperty(exports, "MoneroSyncResult", {
  enumerable: true,
  get: function get() {
    return _MoneroSyncResult["default"];
  }
});
Object.defineProperty(exports, "MoneroTransfer", {
  enumerable: true,
  get: function get() {
    return _MoneroTransfer["default"];
  }
});
Object.defineProperty(exports, "MoneroTransferQuery", {
  enumerable: true,
  get: function get() {
    return _MoneroTransferQuery["default"];
  }
});
Object.defineProperty(exports, "MoneroTx", {
  enumerable: true,
  get: function get() {
    return _MoneroTx["default"];
  }
});
Object.defineProperty(exports, "MoneroTxConfig", {
  enumerable: true,
  get: function get() {
    return _MoneroTxConfig["default"];
  }
});
Object.defineProperty(exports, "MoneroTxPoolStats", {
  enumerable: true,
  get: function get() {
    return _MoneroTxPoolStats["default"];
  }
});
Object.defineProperty(exports, "MoneroTxPriority", {
  enumerable: true,
  get: function get() {
    return _MoneroTxPriority["default"];
  }
});
Object.defineProperty(exports, "MoneroTxQuery", {
  enumerable: true,
  get: function get() {
    return _MoneroTxQuery["default"];
  }
});
Object.defineProperty(exports, "MoneroTxSet", {
  enumerable: true,
  get: function get() {
    return _MoneroTxSet["default"];
  }
});
Object.defineProperty(exports, "MoneroTxWallet", {
  enumerable: true,
  get: function get() {
    return _MoneroTxWallet["default"];
  }
});
Object.defineProperty(exports, "MoneroUtils", {
  enumerable: true,
  get: function get() {
    return _MoneroUtils["default"];
  }
});
Object.defineProperty(exports, "MoneroVersion", {
  enumerable: true,
  get: function get() {
    return _MoneroVersion["default"];
  }
});
Object.defineProperty(exports, "MoneroWallet", {
  enumerable: true,
  get: function get() {
    return _MoneroWallet["default"];
  }
});
Object.defineProperty(exports, "MoneroWalletConfig", {
  enumerable: true,
  get: function get() {
    return _MoneroWalletConfig["default"];
  }
});
Object.defineProperty(exports, "MoneroWalletFull", {
  enumerable: true,
  get: function get() {
    return _MoneroWalletFull["default"];
  }
});
Object.defineProperty(exports, "MoneroWalletKeys", {
  enumerable: true,
  get: function get() {
    return _MoneroWalletKeys["default"];
  }
});
Object.defineProperty(exports, "MoneroWalletListener", {
  enumerable: true,
  get: function get() {
    return _MoneroWalletListener["default"];
  }
});
Object.defineProperty(exports, "MoneroWalletRpc", {
  enumerable: true,
  get: function get() {
    return _MoneroWalletRpc["default"];
  }
});
Object.defineProperty(exports, "SslOptions", {
  enumerable: true,
  get: function get() {
    return _SslOptions["default"];
  }
});
Object.defineProperty(exports, "TaskLooper", {
  enumerable: true,
  get: function get() {
    return _TaskLooper["default"];
  }
});
exports.connectToDaemonRpc = connectToDaemonRpc;
exports.connectToWalletRpc = connectToWalletRpc;
exports.createWalletFull = createWalletFull;
exports.createWalletKeys = createWalletKeys;
exports.getVersion = getVersion;
exports.openWalletFull = openWalletFull;

var _GenUtils = _interopRequireDefault(require("./src/main/js/common/GenUtils"));

var _Filter = _interopRequireDefault(require("./src/main/js/common/Filter"));

var _MoneroError = _interopRequireDefault(require("./src/main/js/common/MoneroError"));

var _HttpClient = _interopRequireDefault(require("./src/main/js/common/HttpClient"));

var _LibraryUtils = _interopRequireDefault(require("./src/main/js/common/LibraryUtils"));

var _MoneroRpcConnection = _interopRequireDefault(require("./src/main/js/common/MoneroRpcConnection"));

var _MoneroRpcError = _interopRequireDefault(require("./src/main/js/common/MoneroRpcError"));

var _SslOptions = _interopRequireDefault(require("./src/main/js/common/SslOptions"));

var _TaskLooper = _interopRequireDefault(require("./src/main/js/common/TaskLooper"));

var _ConnectionType = _interopRequireDefault(require("./src/main/js/daemon/model/ConnectionType"));

var _MoneroAltChain = _interopRequireDefault(require("./src/main/js/daemon/model/MoneroAltChain"));

var _MoneroBan = _interopRequireDefault(require("./src/main/js/daemon/model/MoneroBan"));

var _MoneroBlockHeader = _interopRequireDefault(require("./src/main/js/daemon/model/MoneroBlockHeader"));

var _MoneroBlock = _interopRequireDefault(require("./src/main/js/daemon/model/MoneroBlock"));

var _MoneroBlockTemplate = _interopRequireDefault(require("./src/main/js/daemon/model/MoneroBlockTemplate"));

var _MoneroConnectionSpan = _interopRequireDefault(require("./src/main/js/daemon/model/MoneroConnectionSpan"));

var _MoneroDaemonInfo = _interopRequireDefault(require("./src/main/js/daemon/model/MoneroDaemonInfo"));

var _MoneroDaemonListener = _interopRequireDefault(require("./src/main/js/daemon/model/MoneroDaemonListener"));

var _MoneroDaemonSyncInfo = _interopRequireDefault(require("./src/main/js/daemon/model/MoneroDaemonSyncInfo"));

var _MoneroDaemonUpdateCheckResult = _interopRequireDefault(require("./src/main/js/daemon/model/MoneroDaemonUpdateCheckResult"));

var _MoneroDaemonUpdateDownloadResult = _interopRequireDefault(require("./src/main/js/daemon/model/MoneroDaemonUpdateDownloadResult"));

var _MoneroHardForkInfo = _interopRequireDefault(require("./src/main/js/daemon/model/MoneroHardForkInfo"));

var _MoneroKeyImage = _interopRequireDefault(require("./src/main/js/daemon/model/MoneroKeyImage"));

var _MoneroKeyImageSpentStatus = _interopRequireDefault(require("./src/main/js/daemon/model/MoneroKeyImageSpentStatus"));

var _MoneroMinerTxSum = _interopRequireDefault(require("./src/main/js/daemon/model/MoneroMinerTxSum"));

var _MoneroMiningStatus = _interopRequireDefault(require("./src/main/js/daemon/model/MoneroMiningStatus"));

var _MoneroNetworkType = _interopRequireDefault(require("./src/main/js/daemon/model/MoneroNetworkType"));

var _MoneroOutput = _interopRequireDefault(require("./src/main/js/daemon/model/MoneroOutput"));

var _MoneroOutputHistogramEntry = _interopRequireDefault(require("./src/main/js/daemon/model/MoneroOutputHistogramEntry"));

var _MoneroSubmitTxResult = _interopRequireDefault(require("./src/main/js/daemon/model/MoneroSubmitTxResult"));

var _MoneroTx = _interopRequireDefault(require("./src/main/js/daemon/model/MoneroTx"));

var _MoneroTxPoolStats = _interopRequireDefault(require("./src/main/js/daemon/model/MoneroTxPoolStats"));

var _MoneroVersion = _interopRequireDefault(require("./src/main/js/daemon/model/MoneroVersion"));

var _MoneroPeer = _interopRequireDefault(require("./src/main/js/daemon/model/MoneroPeer"));

var _MoneroAccount = _interopRequireDefault(require("./src/main/js/wallet/model/MoneroAccount"));

var _MoneroAccountTag = _interopRequireDefault(require("./src/main/js/wallet/model/MoneroAccountTag"));

var _MoneroAddressBookEntry = _interopRequireDefault(require("./src/main/js/wallet/model/MoneroAddressBookEntry"));

var _MoneroCheck = _interopRequireDefault(require("./src/main/js/wallet/model/MoneroCheck"));

var _MoneroCheckReserve = _interopRequireDefault(require("./src/main/js/wallet/model/MoneroCheckReserve"));

var _MoneroCheckTx = _interopRequireDefault(require("./src/main/js/wallet/model/MoneroCheckTx"));

var _MoneroDestination = _interopRequireDefault(require("./src/main/js/wallet/model/MoneroDestination"));

var _MoneroIntegratedAddress = _interopRequireDefault(require("./src/main/js/wallet/model/MoneroIntegratedAddress"));

var _MoneroKeyImageImportResult = _interopRequireDefault(require("./src/main/js/wallet/model/MoneroKeyImageImportResult"));

var _MoneroMultisigInfo = _interopRequireDefault(require("./src/main/js/wallet/model/MoneroMultisigInfo"));

var _MoneroMultisigInitResult = _interopRequireDefault(require("./src/main/js/wallet/model/MoneroMultisigInitResult"));

var _MoneroMultisigSignResult = _interopRequireDefault(require("./src/main/js/wallet/model/MoneroMultisigSignResult"));

var _MoneroOutputWallet = _interopRequireDefault(require("./src/main/js/wallet/model/MoneroOutputWallet"));

var _MoneroOutputQuery = _interopRequireDefault(require("./src/main/js/wallet/model/MoneroOutputQuery"));

var _MoneroTxPriority = _interopRequireDefault(require("./src/main/js/wallet/model/MoneroTxPriority"));

var _MoneroTxConfig = _interopRequireDefault(require("./src/main/js/wallet/model/MoneroTxConfig"));

var _MoneroSubaddress = _interopRequireDefault(require("./src/main/js/wallet/model/MoneroSubaddress"));

var _MoneroSyncResult = _interopRequireDefault(require("./src/main/js/wallet/model/MoneroSyncResult"));

var _MoneroTransfer = _interopRequireDefault(require("./src/main/js/wallet/model/MoneroTransfer"));

var _MoneroIncomingTransfer = _interopRequireDefault(require("./src/main/js/wallet/model/MoneroIncomingTransfer"));

var _MoneroOutgoingTransfer = _interopRequireDefault(require("./src/main/js/wallet/model/MoneroOutgoingTransfer"));

var _MoneroTransferQuery = _interopRequireDefault(require("./src/main/js/wallet/model/MoneroTransferQuery"));

var _MoneroTxSet = _interopRequireDefault(require("./src/main/js/wallet/model/MoneroTxSet"));

var _MoneroTxWallet = _interopRequireDefault(require("./src/main/js/wallet/model/MoneroTxWallet"));

var _MoneroTxQuery = _interopRequireDefault(require("./src/main/js/wallet/model/MoneroTxQuery"));

var _MoneroWalletListener = _interopRequireDefault(require("./src/main/js/wallet/model/MoneroWalletListener"));

var _MoneroWalletConfig = _interopRequireDefault(require("./src/main/js/wallet/model/MoneroWalletConfig"));

var _MoneroMessageSignatureType = _interopRequireDefault(require("./src/main/js/wallet/model/MoneroMessageSignatureType"));

var _MoneroMessageSignatureResult = _interopRequireDefault(require("./src/main/js/wallet/model/MoneroMessageSignatureResult"));

var _MoneroConnectionManager = _interopRequireDefault(require("./src/main/js/common/MoneroConnectionManager"));

var _MoneroConnectionManagerListener = _interopRequireDefault(require("./src/main/js/common/MoneroConnectionManagerListener"));

var _MoneroUtils = _interopRequireDefault(require("./src/main/js/common/MoneroUtils"));

var _MoneroDaemon = _interopRequireDefault(require("./src/main/js/daemon/MoneroDaemon"));

var _MoneroWallet = _interopRequireDefault(require("./src/main/js/wallet/MoneroWallet"));

var _MoneroDaemonRpc = _interopRequireDefault(require("./src/main/js/daemon/MoneroDaemonRpc"));

var _MoneroWalletRpc = _interopRequireDefault(require("./src/main/js/wallet/MoneroWalletRpc"));

var _MoneroWalletKeys = _interopRequireDefault(require("./src/main/js/wallet/MoneroWalletKeys"));

var _MoneroWalletFull = _interopRequireDefault(require("./src/main/js/wallet/MoneroWalletFull"));

// export daemon models
// export wallet models
// export connection manager
// export daemon, wallet, and utils classes
// ---------------------------- GLOBAL FUNCTIONS ------------------------------

/**
 * <p>Get the version of the monero-javascript library.<p>
 * 
 * @return {string} the version of this monero-javascript library
 */
function getVersion() {
  return _MoneroUtils["default"].getVersion();
}
/**
 * <p>Create a client connected to monero-daemon-rpc.<p>
 * 
 * <p>Examples:<p>
 * 
 * <code>
 * let daemon = await monerojs.connectToDaemonRpc("http://localhost:38081", "superuser", "abctesting123");<br><br>
 * 
 * let daemon = await monerojs.connectToDaemonRpc({<br>
 * &nbsp;&nbsp; uri: "http://localhost:38081",<br>
 * &nbsp;&nbsp; username: "superuser",<br>
 * &nbsp;&nbsp; password: "abctesting123"<br>
 * });
 * </code>
 * 
 * @param {string|object|MoneroRpcConnection} uriOrConfig - uri of monero-daemon-rpc or JS config object or MoneroRpcConnection
 * @param {string} uriOrConfig.uri - uri of monero-daemon-rpc
 * @param {string} uriOrConfig.username - username to authenticate with monero-daemon-rpc (optional)
 * @param {string} uriOrConfig.password - password to authenticate with monero-daemon-rpc (optional)
 * @param {boolean} uriOrConfig.rejectUnauthorized - rejects self-signed certificates if true (default true)
 * @param {number} uriOrConfig.pollInterval - poll interval to query for updates in ms (default 5000)
 * @param {boolean} uriOrConfig.proxyToWorker - run the daemon client in a web worker if true (default true)
 * @param {string} username - username to authenticate with monero-daemon-rpc (optional)
 * @param {string} password - password to authenticate with monero-daemon-rpc (optional)
 * @param {boolean} rejectUnauthorized - rejects self-signed certificates if true (default true)
 * @param {number} pollInterval - poll interval to query for updates in ms (default 5000)
 * @param {boolean} proxyToWorker - runs the daemon client in a web worker if true (default true)
 * @return {MoneroDaemonRpc} the daemon RPC client
 */


function connectToDaemonRpc() {
  return _MoneroDaemonRpc["default"]._connectToDaemonRpc.apply(_MoneroDaemonRpc["default"], arguments);
}
/**
 * <p>Create a client connected to monero-wallet-rpc.</p>
 * 
 * <p>Examples:</p>
 * 
 * <code>
 * let walletRpc = await monerojs.connectToWalletRpc("http://localhost:38081", "superuser", "abctesting123");<br><br>
 * 
 * let walletRpc = await monerojs.connectToWalletRpc({<br>
 * &nbsp;&nbsp; uri: "http://localhost:38081",<br>
 * &nbsp;&nbsp; username: "superuser",<br>
 * &nbsp;&nbsp; password: "abctesting123",<br>
 * &nbsp;&nbsp; rejectUnauthorized: false // e.g. local development<br>
 * });<br><br>
 * 
 * // connect to monero-wallet-rpc running as internal process<br>
 * let walletRpc = await monerojs.connectToWalletRpc([<br>
 * &nbsp;&nbsp; "/path/to/monero-wallet-rpc",<br>
 * &nbsp;&nbsp; "--stagenet",<br>
 * &nbsp;&nbsp; "--daemon-address", "http://localhost:38081",<br>
 * &nbsp;&nbsp; "--daemon-login", "superuser:abctesting123",<br>
 * &nbsp;&nbsp; "--rpc-bind-port", "38085",<br>
 * &nbsp;&nbsp; "--rpc-login", "rpc_user:abc123",<br>
 * &nbsp;&nbsp; "--wallet-dir", "/path/to/wallets", // defaults to monero-wallet-rpc directory<br>
 * &nbsp;&nbsp; "--rpc-access-control-origins", "http://localhost:8080"<br>
 * &nbsp; ]);
 * 
 * </code>
 * 
 * @param {string|string[]|object|MoneroRpcConnection} uriOrConfig - uri of monero-wallet-rpc or terminal parameters or JS config object or MoneroRpcConnection
 * @param {string} uriOrConfig.uri - uri of monero-wallet-rpc
 * @param {string} uriOrConfig.username - username to authenticate with monero-wallet-rpc (optional)
 * @param {string} uriOrConfig.password - password to authenticate with monero-wallet-rpc (optional)
 * @param {boolean} uriOrConfig.rejectUnauthorized - rejects self-signed certificates if true (default true)
 * @param {string} username - username to authenticate with monero-wallet-rpc (optional)
 * @param {string} password - password to authenticate with monero-wallet-rpc (optional)
 * @param {boolean} rejectUnauthorized - rejects self-signed certificates if true (default true)
 * @return {MoneroWalletRpc} the wallet RPC client
 */


function connectToWalletRpc() {
  return _MoneroWalletRpc["default"]._connectToWalletRpc.apply(_MoneroWalletRpc["default"], arguments);
}
/**
 * <p>Create a Monero wallet using fully client-side WebAssembly bindings to monero-project's wallet2 in C++.<p>
 * 
 * <p>Example:</p>
 * 
 * <code>
 * let wallet = await monerojs.createWalletFull({<br>
 * &nbsp;&nbsp; path: "./test_wallets/wallet1", // leave blank for in-memory wallet<br>
 * &nbsp;&nbsp; password: "supersecretpassword",<br>
 * &nbsp;&nbsp; networkType: MoneroNetworkType.STAGENET,<br>
 * &nbsp;&nbsp; mnemonic: "coexist igloo pamphlet lagoon...",<br>
 * &nbsp;&nbsp; restoreHeight: 1543218,<br>
 * &nbsp;&nbsp; server: new monerojs.MoneroRpcConnection("http://localhost:38081", "daemon_user", "daemon_password_123"),<br>
 * });
 * </code>
 * 
 * @param {object|MoneroWalletConfig} config - MoneroWalletConfig or equivalent config object
 * @param {string} config.path - path of the wallet to create (optional, in-memory wallet if not given)
 * @param {string} config.password - password of the wallet to create
 * @param {string|number} config.networkType - network type of the wallet to create (one of "mainnet", "testnet", "stagenet" or MoneroNetworkType.MAINNET|TESTNET|STAGENET)
 * @param {string} config.mnemonic - mnemonic of the wallet to create (optional, random wallet created if neither mnemonic nor keys given)
 * @param {string} config.seedOffset - the offset used to derive a new seed from the given mnemonic to recover a secret wallet from the mnemonic phrase
 * @param {string} config.primaryAddress - primary address of the wallet to create (only provide if restoring from keys)
 * @param {string} config.privateViewKey - private view key of the wallet to create (optional)
 * @param {string} config.privateSpendKey - private spend key of the wallet to create (optional)
 * @param {number} config.restoreHeight - block height to start scanning frsom (defaults to 0 unless generating random wallet)
 * @param {string} config.language - language of the wallet's mnemonic phrase (defaults to "English" or auto-detected)
 * @param {number} config.accountLookahead -  number of accounts to scan (optional)
 * @param {number} config.subaddressLookahead - number of subaddresses to scan per account (optional)
 * @param {string} config.serverUri - uri of the wallet's daemon (optional)
 * @param {string} config.serverUsername - username to authenticate with the daemon (optional)
 * @param {string} config.serverPassword - password to authenticate with the daemon (optional)
 * @param {boolean} config.rejectUnauthorized - reject self-signed server certificates if true (defaults to true)
 * @param {MoneroRpcConnection|object} config.server - MoneroRpcConnection or equivalent JS object providing daemon configuration (optional)
 * @param {boolean} config.proxyToWorker - proxies wallet operations to a web worker in order to not block the main thread (default true)
 * @param {fs} config.fs - Node.js compatible file system to use (defaults to disk or in-memory FS if browser)
 * @return {Promise<MoneroWalletFull>} the created wallet
 */


function createWalletFull() {
  return _MoneroWalletFull["default"].createWallet.apply(_MoneroWalletFull["default"], arguments);
}
/**
 * <p>Open an existing Monero wallet using fully client-side WebAssembly bindings to monero-project's wallet2 in C++.<p>
 * 
 * <p>Examples:<p>
 * 
 * <code>
 * let wallet1 = await monerojs.openWalletFull(<br>
 * &nbsp;&nbsp; "./wallets/wallet1",<br>
 * &nbsp;&nbsp; "supersecretpassword",<br>
 * &nbsp;&nbsp; MoneroNetworkType.STAGENET,<br>
 * &nbsp;&nbsp; "http://localhost:38081" // daemon uri<br>
 * );<br><br>
 * 
 * let wallet2 = await monerojs.openWalletFull({<br>
 * &nbsp;&nbsp; path: "./wallets/wallet2",<br>
 * &nbsp;&nbsp; password: "supersecretpassword",<br>
 * &nbsp;&nbsp; networkType: MoneroNetworkType.STAGENET,<br>
 * &nbsp;&nbsp; serverUri: "http://localhost:38081", // daemon configuration<br>
 * &nbsp;&nbsp; serverUsername: "superuser",<br>
 * &nbsp;&nbsp; serverPassword: "abctesting123"<br>
 * });
 * </code>
 * 
 * @param {MoneroWalletConfig|object|string} configOrPath - MoneroWalletConfig or equivalent config object or a path to a wallet to open
 * @param {string} configOrPath.path - path of the wallet to open (optional if 'keysData' provided)
 * @param {string} configOrPath.password - password of the wallet to open
 * @param {string|number} configOrPath.networkType - network type of the wallet to open (one of "mainnet", "testnet", "stagenet" or MoneroNetworkType.MAINNET|TESTNET|STAGENET)
 * @param {Uint8Array} configOrPath.keysData - wallet keys data to open (optional if path provided)
 * @param {Uint8Array} configOrPath.cacheData - wallet cache data to open (optional)
 * @param {string} configOrPath.serverUri - uri of the wallet's daemon (optional)
 * @param {string} configOrPath.serverUsername - username to authenticate with the daemon (optional)
 * @param {string} configOrPath.serverPassword - password to authenticate with the daemon (optional)
 * @param {boolean} configOrPath.rejectUnauthorized - reject self-signed server certificates if true (defaults to true)
 * @param {MoneroRpcConnection|object} configOrPath.server - MoneroRpcConnection or equivalent JS object configuring the daemon connection (optional)
 * @param {boolean} configOrPath.proxyToWorker - proxies wallet operations to a web worker in order to not block the main thread (default true)
 * @param {fs} configOrPath.fs - Node.js compatible file system to use (defaults to disk or in-memory FS if browser)
 * @param {string} password - password of the wallet to open
 * @param {string|number} networkType - network type of the wallet to open
 * @param {string|MoneroRpcConnection} daemonUriOrConnection - daemon URI or MoneroRpcConnection
 * @param {boolean} proxyToWorker - proxies wallet operations to a web worker in order to not block the main thread (default true)
 * @param {fs} fs - Node.js compatible file system to use (defaults to disk or in-memory FS if browser)
 * @return {MoneroWalletFull} the opened wallet
 */


function openWalletFull() {
  return _MoneroWalletFull["default"].openWallet.apply(_MoneroWalletFull["default"], arguments);
}
/**
 * <p>Create a wallet using WebAssembly bindings to monero-project.</p>
 * 
 * <p>Example:</p>
 * 
 * <code>
 * let wallet = await monerojs.createWalletKeys({<br>
 * &nbsp;&nbsp; password: "abc123",<br>
 * &nbsp;&nbsp; networkType: MoneroNetworkType.STAGENET,<br>
 * &nbsp;&nbsp; mnemonic: "coexist igloo pamphlet lagoon..."<br>
 * });
 * </code>
 * 
 * @param {MoneroWalletConfig|object} config - MoneroWalletConfig or equivalent config object
 * @param {string|number} config.networkType - network type of the wallet to create (one of "mainnet", "testnet", "stagenet" or MoneroNetworkType.MAINNET|TESTNET|STAGENET)
 * @param {string} config.mnemonic - mnemonic of the wallet to create (optional, random wallet created if neither mnemonic nor keys given)
 * @param {string} config.seedOffset - the offset used to derive a new seed from the given mnemonic to recover a secret wallet from the mnemonic phrase
 * @param {string} config.primaryAddress - primary address of the wallet to create (only provide if restoring from keys)
 * @param {string} config.privateViewKey - private view key of the wallet to create (optional)
 * @param {string} config.privateSpendKey - private spend key of the wallet to create (optional)
 * @param {string} config.language - language of the wallet's mnemonic phrase (defaults to "English" or auto-detected)
 * @return {MoneroWalletKeys} the created wallet
 */


function createWalletKeys() {
  return _MoneroWalletKeys["default"].createWallet.apply(_MoneroWalletKeys["default"], arguments);
}