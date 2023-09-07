export = MoneroWalletRpc;
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
 * @hideconstructor
 */
declare class MoneroWalletRpc extends MoneroWallet implements MoneroWallet {
    /**
     * <p>Create a client connected to monero-wallet-rpc (for internal use).</p>
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
    static _connectToWalletRpc(uriOrConfig: string | string[] | object | MoneroRpcConnection, username: string, password: string, rejectUnauthorized: boolean, ...args: any[]): MoneroWalletRpc;
    static _startWalletRpcProcess(cmd: any): Promise<any>;
    static _normalizeConfig(uriOrConfigOrConnection: any, username: any, password: any, rejectUnauthorized: any): any;
    /**
     * Remove criteria which requires looking up other transfers/outputs to
     * fulfill query.
     *
     * @param {MoneroTxQuery} query - the query to decontextualize
     * @return {MoneroTxQuery} a reference to the query for convenience
     */
    static _decontextualize(query: MoneroTxQuery): MoneroTxQuery;
    static _isContextual(query: any): boolean;
    static _convertRpcAccount(rpcAccount: any): MoneroAccount;
    static _convertRpcSubaddress(rpcSubaddress: any): MoneroSubaddress;
    /**
     * Initializes a sent transaction.
     *
     * TODO: remove copyDestinations after >18.2.2 when subtractFeeFrom fully supported
     *
     * @param {MoneroTxConfig} config - send config
     * @param {MoneroTxWallet} tx - existing transaction to initialize (optional)
     * @param {boolean} copyDestinations - copies config destinations if true
     * @return {MoneroTxWallet} is the initialized send tx
     */
    static _initSentTxWallet(config: MoneroTxConfig, tx: MoneroTxWallet, copyDestinations: boolean): MoneroTxWallet;
    /**
     * Initializes a tx set from a RPC map excluding txs.
     *
     * @param rpcMap - map to initialize the tx set from
     * @return MoneroTxSet - initialized tx set
     * @return the resulting tx set
     */
    static _convertRpcTxSet(rpcMap: any): MoneroTxSet;
    /**
     * Initializes a MoneroTxSet from a list of rpc txs.
     *
     * @param rpcTxs - rpc txs to initialize the set from
     * @param txs - existing txs to further initialize (optional)
     * @param config - tx config
     * @return the converted tx set
     */
    static _convertRpcSentTxsToTxSet(rpcTxs: any, txs: any, config: any): MoneroTxSet;
    /**
     * Converts a rpc tx with a transfer to a tx set with a tx and transfer.
     *
     * @param rpcTx - rpc tx to build from
     * @param tx - existing tx to continue initializing (optional)
     * @param isOutgoing - specifies if the tx is outgoing if true, incoming if false, or decodes from type if undefined
     * @param config - tx config
     * @returns the initialized tx set with a tx
     */
    static _convertRpcTxToTxSet(rpcTx: any, tx: any, isOutgoing: any, config: any): MoneroTxSet;
    /**
     * Builds a MoneroTxWallet from a RPC tx.
     *
     * @param rpcTx - rpc tx to build from
     * @param tx - existing tx to continue initializing (optional)
     * @param isOutgoing - specifies if the tx is outgoing if true, incoming if false, or decodes from type if undefined
     * @param config - tx config
     * @returns {MoneroTxWallet} is the initialized tx
     */
    static _convertRpcTxWithTransfer(rpcTx: any, tx: any, isOutgoing: any, config: any): MoneroTxWallet;
    static _convertRpcTxWalletWithOutput(rpcOutput: any): MoneroTxWallet;
    static _convertRpcDescribeTransfer(rpcDescribeTransferResult: any): MoneroTxSet;
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
    static _decodeRpcType(rpcType: any, tx: any): boolean;
    /**
     * Merges a transaction into a unique set of transactions.
     *
     * @param {MoneroTxWallet} tx - the transaction to merge into the existing txs
     * @param {Object} txMap - maps tx hashes to txs
     * @param {Object} blockMap - maps block heights to blocks
     */
    static _mergeTx(tx: MoneroTxWallet, txMap: any, blockMap: any): void;
    /**
     * Compares two transactions by their height.
     */
    static _compareTxsByHeight(tx1: any, tx2: any): number;
    /**
     * Compares two transfers by ascending account and subaddress indices.
     */
    static _compareIncomingTransfers(t1: any, t2: any): number;
    /**
     * Compares two outputs by ascending account and subaddress indices.
     */
    static _compareOutputs(o1: any, o2: any): any;
    /**
     * <p>Construct a wallet RPC client (for internal use).</p>
     *
     * @param {string|object|MoneroRpcConnection|string[]} uriOrConfig - uri of monero-wallet-rpc or JS config object or MoneroRpcConnection or command line parameters to run a monero-wallet-rpc process internally
     * @param {string} uriOrConfig.uri - uri of monero-wallet-rpc
     * @param {string} uriOrConfig.username - username to authenticate with monero-wallet-rpc (optional)
     * @param {string} uriOrConfig.password - password to authenticate with monero-wallet-rpc (optional)
     * @param {boolean} uriOrConfig.rejectUnauthorized - rejects self-signed certificates if true (default true)
     * @param {string} username - username to authenticate with monero-wallet-rpc (optional)
     * @param {string} password - password to authenticate with monero-wallet-rpc (optional)
     * @param {boolean} rejectUnauthorized - rejects self-signed certificates if true (default true)
     */
    constructor(uriOrConfig: string | object | MoneroRpcConnection | string[], username: string, password: string, rejectUnauthorized: boolean);
    config: any;
    rpc: MoneroRpcConnection;
    addressCache: {};
    syncPeriodInMs: number;
    listeners: any[];
    /**
     * Get the internal process running monero-wallet-rpc.
     *
     * @return the process running monero-wallet-rpc, undefined if not created from new process
     */
    getProcess(): any;
    /**
     * Stop the internal process running monero-wallet-rpc, if applicable.
     *
     * @param {boolean} force specifies if the process should be destroyed forcibly
     * @return {Promise<number|undefined>} the exit code from stopping the process
     */
    stopProcess(force: boolean): Promise<number | undefined>;
    /**
     * Get the wallet's RPC connection.
     *
     * @return {MoneroWalletRpc} the wallet's rpc connection
     */
    getRpcConnection(): MoneroWalletRpc;
    /**
     * <p>Open an existing wallet on the monero-wallet-rpc server.</p>
     *
     * <p>Example:<p>
     *
     * <code>
     * let wallet = new MoneroWalletRpc("http://localhost:38084", "rpc_user", "abc123");<br>
     * await wallet.openWallet("mywallet1", "supersecretpassword");<br>
     * await wallet.openWallet({<br>
     * &nbsp;&nbsp; path: "mywallet2",<br>
     * &nbsp;&nbsp; password: "supersecretpassword",<br>
     * &nbsp;&nbsp; serverUri: "http://locahost:38081",<br>
     * &nbsp;&nbsp; rejectUnauthorized: false<br>
     * });<br>
     * </code>
     *
     * @param {string|object|MoneroWalletConfig} pathOrConfig  - the wallet's name or configuration to open
     * @param {string} pathOrConfig.path - path of the wallet to create (optional, in-memory wallet if not given)
     * @param {string} pathOrConfig.password - password of the wallet to create
     * @param {string} pathOrConfig.serverUri - uri of a daemon to use (optional, monero-wallet-rpc usually started with daemon config)
     * @param {string} pathOrConfig.serverUsername - username to authenticate with the daemon (optional)
     * @param {string} pathOrConfig.serverPassword - password to authenticate with the daemon (optional)
     * @param {boolean} pathOrConfig.rejectUnauthorized - reject self-signed server certificates if true (defaults to true)
     * @param {MoneroRpcConnection|object} pathOrConfig.server - MoneroRpcConnection or equivalent JS object providing daemon configuration (optional)
     * @param {string} password is the wallet's password
     * @return {MoneroWalletRpc} this wallet client
     */
    openWallet(pathOrConfig: string | object | MoneroWalletConfig, password: string): MoneroWalletRpc;
    path: any;
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
     * @param {object|MoneroWalletConfig} config - MoneroWalletConfig or equivalent JS object
     * @param {string} config.path - path of the wallet to create (optional, in-memory wallet if not given)
     * @param {string} config.password - password of the wallet to create
     * @param {string} config.seed - seed of the wallet to create (optional, random wallet created if neither seed nor keys given)
     * @param {string} config.seedOffset - the offset used to derive a new seed from the given seed to recover a secret wallet from the seed
     * @param {boolean} config.isMultisig - restore multisig wallet from seed
     * @param {string} config.primaryAddress - primary address of the wallet to create (only provide if restoring from keys)
     * @param {string} config.privateViewKey - private view key of the wallet to create (optional)
     * @param {string} config.privateSpendKey - private spend key of the wallet to create (optional)
     * @param {number} config.restoreHeight - block height to start scanning from (defaults to 0 unless generating random wallet)
     * @param {string} config.language - language of the wallet's mnemonic phrase or seed (defaults to "English" or auto-detected)
     * @param {string} config.serverUri - uri of a daemon to use (optional, monero-wallet-rpc usually started with daemon config)
     * @param {string} config.serverUsername - username to authenticate with the daemon (optional)
     * @param {string} config.serverPassword - password to authenticate with the daemon (optional)
     * @param {boolean} config.rejectUnauthorized - reject self-signed server certificates if true (defaults to true)
     * @param {MoneroRpcConnection|object} config.server - MoneroRpcConnection or equivalent JS object providing daemon configuration (optional)
     * @param {boolean} config.saveCurrent - specifies if the current RPC wallet should be saved before being closed (default true)
     * @return {MoneroWalletRpc} this wallet client
     */
    createWallet(config: object | MoneroWalletConfig): MoneroWalletRpc;
    /**
     * Create and open a new wallet with a randomly generated seed on the RPC server.
     *
     * @param {MoneroWalletConfig} config - the wallet configuration
     * @return {MoneroWalletRpc} this wallet client
     */
    _createWalletRandom(config: MoneroWalletConfig): MoneroWalletRpc;
    /**
     * Create and open a wallet from an existing seed on the RPC server,
     * closing the currently open wallet if applicable.
     *
     * @param {MoneroWalletConfig} config - the wallet configuration
     * @return {MoneroWalletRpc} this wallet client
     */
    _createWalletFromSeed(config: MoneroWalletConfig): MoneroWalletRpc;
    /**
     * Create a wallet on the RPC server from an address, view key, and (optionally) spend key.
     *
     * @param {MoneroWalletConfig} config - the wallet configuration
     * @return {MoneroWalletRpc} this wallet client
     */
    _createWalletFromKeys(config: MoneroWalletConfig): MoneroWalletRpc;
    _handleCreateWalletError(name: any, err: any): void;
    isViewOnly(): Promise<boolean>;
    /**
     * Set the wallet's daemon connection.
     *
     * @param {string|MoneroRpcConnection} uriOrConnection - the daemon's URI or connection (defaults to offline)
     * @param {boolean} isTrusted - indicates if the daemon in trusted
     * @param {SslOptions} sslOptions - custom SSL configuration
     */
    setDaemonConnection(uriOrRpcConnection: any, isTrusted: boolean, sslOptions: SslOptions): Promise<void>;
    daemonConnection: MoneroRpcConnection;
    getDaemonConnection(): Promise<MoneroRpcConnection>;
    addListener(listener: any): Promise<void>;
    removeListener(listener: any): Promise<void>;
    isConnectedToDaemon(): Promise<boolean>;
    getVersion(): Promise<MoneroVersion>;
    getPath(): Promise<any>;
    getSeed(): Promise<any>;
    getSeedLanguage(): Promise<any>;
    /**
     * Get a list of available languages for the wallet's seed.
     *
     * @return {string[]} the available languages for the wallet's seed.
     */
    getSeedLanguages(): string[];
    getPrivateViewKey(): Promise<any>;
    getPrivateSpendKey(): Promise<any>;
    getAddress(accountIdx: any, subaddressIdx: any): any;
    getAddressIndex(address: any): Promise<MoneroSubaddress>;
    getIntegratedAddress(standardAddress: any, paymentId: any): Promise<MoneroIntegratedAddress>;
    decodeIntegratedAddress(integratedAddress: any): Promise<MoneroIntegratedAddress>;
    getHeight(): Promise<any>;
    getDaemonHeight(): Promise<void>;
    getHeightByDate(year: any, month: any, day: any): Promise<void>;
    sync(startHeight: any, onProgress: any): Promise<MoneroSyncResult>;
    startSyncing(syncPeriodInMs: any): Promise<void>;
    stopSyncing(): Promise<any>;
    scanTxs(txHashes: any): Promise<void>;
    getBalance(accountIdx: any, subaddressIdx: any): Promise<any>;
    getUnlockedBalance(accountIdx: any, subaddressIdx: any): Promise<any>;
    getAccounts(includeSubaddresses: any, tag: any, skipBalances: any): Promise<MoneroAccount[]>;
    getAccount(accountIdx: any, includeSubaddresses: any, skipBalances: any): Promise<MoneroAccount>;
    createAccount(label: any): Promise<MoneroAccount>;
    getSubaddresses(accountIdx: any, subaddressIndices: any, skipBalances: any): Promise<MoneroSubaddress[]>;
    getSubaddress(accountIdx: any, subaddressIdx: any, skipBalances: any): Promise<MoneroSubaddress>;
    createSubaddress(accountIdx: any, label: any): Promise<MoneroSubaddress>;
    setSubaddressLabel(accountIdx: any, subaddressIdx: any, label: any): Promise<void>;
    getTxs(query: any): any;
    getTransfers(query: any): Promise<any[]>;
    getOutputs(query: any): Promise<any[]>;
    exportOutputs(all: any): Promise<any>;
    importOutputs(outputsHex: any): Promise<any>;
    exportKeyImages(all: any): Promise<MoneroKeyImage[]>;
    importKeyImages(keyImages: any): Promise<MoneroKeyImageImportResult>;
    getNewKeyImagesFromLastImport(): Promise<MoneroKeyImage[]>;
    freezeOutput(keyImage: any): Promise<any>;
    thawOutput(keyImage: any): Promise<any>;
    isOutputFrozen(keyImage: any): Promise<boolean>;
    createTxs(config: any): Promise<any>;
    sweepOutput(config: any): Promise<MoneroTxWallet>;
    sweepUnlocked(config: any): Promise<any[]>;
    sweepDust(relay: any): Promise<any>;
    relayTxs(txsOrMetadatas: any): Promise<any[]>;
    describeTxSet(txSet: any): Promise<MoneroTxSet>;
    signTxs(unsignedTxHex: any): Promise<any>;
    submitTxs(signedTxHex: any): Promise<any>;
    signMessage(message: any, signatureType: any, accountIdx: any, subaddressIdx: any): Promise<any>;
    verifyMessage(message: any, address: any, signature: any): Promise<MoneroMessageSignatureResult>;
    getTxKey(txHash: any): Promise<any>;
    checkTxKey(txHash: any, txKey: any, address: any): Promise<MoneroCheckTx>;
    getTxProof(txHash: any, address: any, message: any): Promise<any>;
    checkTxProof(txHash: any, address: any, message: any, signature: any): Promise<MoneroCheckTx>;
    getSpendProof(txHash: any, message: any): Promise<any>;
    checkSpendProof(txHash: any, message: any, signature: any): Promise<any>;
    getReserveProofWallet(message: any): Promise<any>;
    getReserveProofAccount(accountIdx: any, amount: any, message: any): Promise<any>;
    checkReserveProof(address: any, message: any, signature: any): Promise<MoneroCheckReserve>;
    getTxNotes(txHashes: any): Promise<any>;
    setTxNotes(txHashes: any, notes: any): Promise<void>;
    getAddressBookEntries(entryIndices: any): Promise<MoneroAddressBookEntry[]>;
    addAddressBookEntry(address: any, description: any): Promise<any>;
    editAddressBookEntry(index: any, setAddress: any, address: any, setDescription: any, description: any): Promise<void>;
    deleteAddressBookEntry(entryIdx: any): Promise<void>;
    tagAccounts(tag: any, accountIndices: any): Promise<void>;
    untagAccounts(accountIndices: any): Promise<void>;
    getAccountTags(): Promise<MoneroAccountTag[]>;
    setAccountTagLabel(tag: any, label: any): Promise<void>;
    getPaymentUri(config: any): Promise<any>;
    parsePaymentUri(uri: any): Promise<MoneroTxConfig>;
    getAttribute(key: any): Promise<any>;
    setAttribute(key: any, val: any): Promise<void>;
    startMining(numThreads: any, backgroundMining: any, ignoreBattery: any): Promise<void>;
    isMultisigImportNeeded(): Promise<boolean>;
    getMultisigInfo(): Promise<MoneroMultisigInfo>;
    prepareMultisig(): Promise<any>;
    makeMultisig(multisigHexes: any, threshold: any, password: any): Promise<any>;
    exchangeMultisigKeys(multisigHexes: any, password: any): Promise<MoneroMultisigInitResult>;
    exportMultisigHex(): Promise<any>;
    importMultisigHex(multisigHexes: any): Promise<any>;
    signMultisigTxHex(multisigTxHex: any): Promise<MoneroMultisigSignResult>;
    submitMultisigTxHex(signedMultisigTxHex: any): Promise<any>;
    changePassword(oldPassword: any, newPassword: any): Promise<any>;
    save(): Promise<void>;
    close(save: any): Promise<void>;
    isClosed(): Promise<boolean>;
    /**
     * Save and close the current wallet and stop the RPC server.
     */
    stop(): Promise<void>;
    getNumBlocksToUnlock(...args: any[]): Promise<int[]>;
    getTx(...args: any[]): Promise<MoneroTxWallet>;
    getIncomingTransfers(...args: any[]): Promise<MoneroIncomingTransfer[]>;
    getOutgoingTransfers(...args: any[]): Promise<MoneroOutgoingTransfer[]>;
    createTx(...args: any[]): Promise<MoneroTxWallet>;
    relayTx(...args: any[]): Promise<string>;
    getTxNote(...args: any[]): Promise<string>;
    setTxNote(...args: any[]): Promise<void>;
    _clear(): Promise<void>;
    _getBalances(accountIdx: any, subaddressIdx: any): Promise<any[]>;
    _getAccountIndices(getSubaddressIndices: any): Promise<Map<any, any>>;
    _getSubaddressIndices(accountIdx: any): Promise<any[]>;
    _getTransfersAux(query: any): Promise<any[]>;
    _getOutputsAux(query: any): Promise<any[]>;
    /**
     * Common method to get key images.
     *
     * @param all - pecifies to get all xor only new images from last import
     * @return {MoneroKeyImage[]} are the key images
     */
    _rpcExportKeyImages(all: any): MoneroKeyImage[];
    _rpcSweepAccount(config: any): Promise<any>;
    _refreshListening(): void;
    walletPoller: WalletPoller;
    /**
     * Poll if listening.
     */
    _poll(): Promise<void>;
}
declare namespace MoneroWalletRpc {
    let process: any;
    let DEFAULT_SYNC_PERIOD_IN_MS: number;
}
import MoneroWallet = require("./MoneroWallet");
import MoneroRpcConnection = require("../common/MoneroRpcConnection");
import MoneroWalletConfig = require("./model/MoneroWalletConfig");
import SslOptions = require("../common/SslOptions");
import MoneroVersion = require("../daemon/model/MoneroVersion");
import MoneroSubaddress = require("./model/MoneroSubaddress");
import MoneroIntegratedAddress = require("./model/MoneroIntegratedAddress");
import MoneroSyncResult = require("./model/MoneroSyncResult");
import MoneroAccount = require("./model/MoneroAccount");
import MoneroKeyImage = require("../daemon/model/MoneroKeyImage");
import MoneroKeyImageImportResult = require("./model/MoneroKeyImageImportResult");
import MoneroTxWallet = require("./model/MoneroTxWallet");
import MoneroTxSet = require("./model/MoneroTxSet");
import MoneroMessageSignatureResult = require("./model/MoneroMessageSignatureResult");
import MoneroCheckTx = require("./model/MoneroCheckTx");
import MoneroCheckReserve = require("./model/MoneroCheckReserve");
import MoneroAddressBookEntry = require("./model/MoneroAddressBookEntry");
import MoneroAccountTag = require("./model/MoneroAccountTag");
import MoneroTxConfig = require("./model/MoneroTxConfig");
import MoneroMultisigInfo = require("./model/MoneroMultisigInfo");
import MoneroMultisigInitResult = require("./model/MoneroMultisigInitResult");
import MoneroMultisigSignResult = require("./model/MoneroMultisigSignResult");
/**
 * Polls monero-wallet-rpc to provide listener notifications.
 *
 * @class
 * @ignore
 */
declare class WalletPoller {
    constructor(wallet: any);
    _wallet: any;
    _looper: TaskLooper;
    _prevLockedTxs: any[];
    _prevUnconfirmedNotifications: Set<any>;
    _prevConfirmedNotifications: Set<any>;
    _threadPool: ThreadPool;
    _numPolling: number;
    setIsPolling(isPolling: any): void;
    _isPolling: any;
    setPeriodInMs(periodInMs: any): void;
    poll(): Promise<any>;
    _onNewBlock(height: any): Promise<void>;
    _notifyOutputs(tx: any): Promise<void>;
    _getTx(txs: any, txHash: any): any;
    _checkForChangedBalances(): Promise<boolean>;
    _prevBalances: any;
}
import MoneroTxQuery = require("./model/MoneroTxQuery");
import TaskLooper = require("../common/TaskLooper");
import ThreadPool = require("../common/ThreadPool");
