'use strict'

/**
 * Export all library models.
 * 
 * See the full model specification: http://moneroecosystem.org/monero-java/monero-spec.pdf
 */

// export common models
import GenUtils from "./src/main/js/common/GenUtils";
export {GenUtils};
import Filter from "./src/main/js/common/Filter";
export {Filter};
import MoneroError from "./src/main/js/common/MoneroError";
export {MoneroError};
import HttpClient from "./src/main/js/common/HttpClient";
export {HttpClient};
import LibraryUtils from "./src/main/js/common/LibraryUtils";
export {LibraryUtils};
import MoneroRpcConnection from "./src/main/js/common/MoneroRpcConnection";
export {MoneroRpcConnection};
import MoneroRpcError from "./src/main/js/common/MoneroRpcError";
export {MoneroRpcError};
import SslOptions from "./src/main/js/common/SslOptions";
export {SslOptions};
import TaskLooper from "./src/main/js/common/TaskLooper";
export {TaskLooper};

// export daemon models
import ConnectionType from "./src/main/js/daemon/model/ConnectionType";
export {ConnectionType};
import MoneroAltChain from "./src/main/js/daemon/model/MoneroAltChain";
export {MoneroAltChain};
import MoneroBan from "./src/main/js/daemon/model/MoneroBan";
export {MoneroBan};
import MoneroBlockHeader from "./src/main/js/daemon/model/MoneroBlockHeader";
export {MoneroBlockHeader};
import MoneroBlock from "./src/main/js/daemon/model/MoneroBlock";
export {MoneroBlock};
import MoneroBlockTemplate from "./src/main/js/daemon/model/MoneroBlockTemplate";
export {MoneroBlockTemplate};
import MoneroConnectionSpan from "./src/main/js/daemon/model/MoneroConnectionSpan";
export {MoneroConnectionSpan};
import MoneroDaemonInfo from "./src/main/js/daemon/model/MoneroDaemonInfo";
export {MoneroDaemonInfo};
import MoneroDaemonListener from "./src/main/js/daemon/model/MoneroDaemonListener";
export {MoneroDaemonListener};
import MoneroDaemonSyncInfo from "./src/main/js/daemon/model/MoneroDaemonSyncInfo";
export {MoneroDaemonSyncInfo};
import MoneroDaemonUpdateCheckResult from "./src/main/js/daemon/model/MoneroDaemonUpdateCheckResult";
export {MoneroDaemonUpdateCheckResult};
import MoneroDaemonUpdateDownloadResult from "./src/main/js/daemon/model/MoneroDaemonUpdateDownloadResult";
export {MoneroDaemonUpdateDownloadResult};
import MoneroHardForkInfo from "./src/main/js/daemon/model/MoneroHardForkInfo";
export {MoneroHardForkInfo};
import MoneroKeyImage from "./src/main/js/daemon/model/MoneroKeyImage";
export {MoneroKeyImage};
import MoneroKeyImageSpentStatus from "./src/main/js/daemon/model/MoneroKeyImageSpentStatus";
export {MoneroKeyImageSpentStatus};
import MoneroMinerTxSum from "./src/main/js/daemon/model/MoneroMinerTxSum";
export {MoneroMinerTxSum};
import MoneroMiningStatus from "./src/main/js/daemon/model/MoneroMiningStatus";
export {MoneroMiningStatus};
import MoneroNetworkType from "./src/main/js/daemon/model/MoneroNetworkType";
export {MoneroNetworkType};
import MoneroOutput from "./src/main/js/daemon/model/MoneroOutput";
export {MoneroOutput};
import MoneroOutputHistogramEntry from "./src/main/js/daemon/model/MoneroOutputHistogramEntry";
export {MoneroOutputHistogramEntry};
import MoneroSubmitTxResult from "./src/main/js/daemon/model/MoneroSubmitTxResult";
export {MoneroSubmitTxResult};
import MoneroTx from "./src/main/js/daemon/model/MoneroTx";
export {MoneroTx};
import MoneroTxPoolStats from "./src/main/js/daemon/model/MoneroTxPoolStats";
export {MoneroTxPoolStats};
import MoneroVersion from "./src/main/js/daemon/model/MoneroVersion";
export {MoneroVersion};
import MoneroPeer from "./src/main/js/daemon/model/MoneroPeer";
export {MoneroPeer};

// export wallet models
import MoneroAccount from "./src/main/js/wallet/model/MoneroAccount";
export {MoneroAccount};
import MoneroAccountTag from "./src/main/js/wallet/model/MoneroAccountTag";
export {MoneroAccountTag};
import MoneroAddressBookEntry from "./src/main/js/wallet/model/MoneroAddressBookEntry";
export {MoneroAddressBookEntry};
import MoneroCheck from "./src/main/js/wallet/model/MoneroCheck";
export {MoneroCheck};
import MoneroCheckReserve from "./src/main/js/wallet/model/MoneroCheckReserve";
export {MoneroCheckReserve};
import MoneroCheckTx from "./src/main/js/wallet/model/MoneroCheckTx";
export {MoneroCheckTx};
import MoneroDestination from "./src/main/js/wallet/model/MoneroDestination";
export {MoneroDestination};
import MoneroIntegratedAddress from "./src/main/js/wallet/model/MoneroIntegratedAddress";
export {MoneroIntegratedAddress};
import MoneroKeyImageImportResult from "./src/main/js/wallet/model/MoneroKeyImageImportResult";
export {MoneroKeyImageImportResult};
import MoneroMultisigInfo from "./src/main/js/wallet/model/MoneroMultisigInfo";
export {MoneroMultisigInfo};
import MoneroMultisigInitResult from "./src/main/js/wallet/model/MoneroMultisigInitResult";
export {MoneroMultisigInitResult};
import MoneroMultisigSignResult from "./src/main/js/wallet/model/MoneroMultisigSignResult";
export {MoneroMultisigSignResult};
import MoneroOutputWallet from "./src/main/js/wallet/model/MoneroOutputWallet";
export {MoneroOutputWallet};
import MoneroOutputQuery from "./src/main/js/wallet/model/MoneroOutputQuery";
export {MoneroOutputQuery};
import MoneroTxPriority from "./src/main/js/wallet/model/MoneroTxPriority";
export {MoneroTxPriority};
import MoneroTxConfig from "./src/main/js/wallet/model/MoneroTxConfig";
export {MoneroTxConfig};
import MoneroSubaddress from "./src/main/js/wallet/model/MoneroSubaddress";
export {MoneroSubaddress};
import MoneroSyncResult from "./src/main/js/wallet/model/MoneroSyncResult";
export {MoneroSyncResult};
import MoneroTransfer from "./src/main/js/wallet/model/MoneroTransfer";
export {MoneroTransfer};
import MoneroIncomingTransfer from "./src/main/js/wallet/model/MoneroIncomingTransfer";
export {MoneroIncomingTransfer};
import MoneroOutgoingTransfer from "./src/main/js/wallet/model/MoneroOutgoingTransfer";
export {MoneroOutgoingTransfer};
import MoneroTransferQuery from "./src/main/js/wallet/model/MoneroTransferQuery";
export {MoneroTransferQuery};
import MoneroTxSet from "./src/main/js/wallet/model/MoneroTxSet";
export {MoneroTxSet};
import MoneroTxWallet from "./src/main/js/wallet/model/MoneroTxWallet";
export {MoneroTxWallet};
import MoneroTxQuery from "./src/main/js/wallet/model/MoneroTxQuery";
export {MoneroTxQuery};
import MoneroWalletListener from "./src/main/js/wallet/model/MoneroWalletListener";
export {MoneroWalletListener};
import MoneroWalletConfig from "./src/main/js/wallet/model/MoneroWalletConfig";
export {MoneroWalletConfig};
import MoneroMessageSignatureType from "./src/main/js/wallet/model/MoneroMessageSignatureType";
export {MoneroMessageSignatureType};
import MoneroMessageSignatureResult from "./src/main/js/wallet/model/MoneroMessageSignatureResult";
export {MoneroMessageSignatureResult};

// export connection manager
import MoneroConnectionManager from "./src/main/js/common/MoneroConnectionManager";
export {MoneroConnectionManager};
import MoneroConnectionManagerListener from "./src/main/js/common/MoneroConnectionManagerListener";
export {MoneroConnectionManagerListener};

// export daemon, wallet, and utils classes
import MoneroUtils from "./src/main/js/common/MoneroUtils";
export {MoneroUtils};
import MoneroDaemon from "./src/main/js/daemon/MoneroDaemon";
export {MoneroDaemon};
import MoneroWallet from "./src/main/js/wallet/MoneroWallet";
export {MoneroWallet};
import MoneroDaemonRpc from "./src/main/js/daemon/MoneroDaemonRpc";
export {MoneroDaemonRpc};
import MoneroWalletRpc from "./src/main/js/wallet/MoneroWalletRpc";
export {MoneroWalletRpc};
import MoneroWalletKeys from "./src/main/js/wallet/MoneroWalletKeys";
export {MoneroWalletKeys};
import MoneroWalletFull from "./src/main/js/wallet/MoneroWalletFull";
export {MoneroWalletFull};

// ---------------------------- GLOBAL FUNCTIONS ------------------------------

/**
 * <p>Get the version of the monero-javascript library.<p>
 * 
 * @return {string} the version of this monero-javascript library
 */
export function getVersion() {
    return MoneroUtils.getVersion();
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
 * @return {Promise<MoneroDaemonRpc>} the daemon RPC client
 */
export function connectToDaemonRpc() { return MoneroDaemonRpc._connectToDaemonRpc(...arguments); }

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
 * @return {Promise<MoneroWalletRpc>} the wallet RPC client
 */
export function connectToWalletRpc() { return MoneroWalletRpc._connectToWalletRpc(...arguments); }

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
export function createWalletFull() { return MoneroWalletFull.createWallet(...arguments); }

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
 * @return {Promise<MoneroWalletFull>} the opened wallet
 */
export function openWalletFull() { return MoneroWalletFull.openWallet(...arguments); }

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
 * @return {Promise<MoneroWalletKeys>} the created wallet
 */
export function createWalletKeys() { return MoneroWalletKeys.createWallet(...arguments); }
