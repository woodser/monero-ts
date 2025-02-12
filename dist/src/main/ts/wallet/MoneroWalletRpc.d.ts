/// <reference types="node" />
import TaskLooper from "../common/TaskLooper";
import MoneroAccount from "./model/MoneroAccount";
import MoneroAccountTag from "./model/MoneroAccountTag";
import MoneroAddressBookEntry from "./model/MoneroAddressBookEntry";
import MoneroCheckReserve from "./model/MoneroCheckReserve";
import MoneroCheckTx from "./model/MoneroCheckTx";
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
import MoneroSubaddress from "./model/MoneroSubaddress";
import MoneroSyncResult from "./model/MoneroSyncResult";
import MoneroTransfer from "./model/MoneroTransfer";
import MoneroTransferQuery from "./model/MoneroTransferQuery";
import MoneroTxConfig from "./model/MoneroTxConfig";
import MoneroTxPriority from "./model/MoneroTxPriority";
import MoneroTxQuery from "./model/MoneroTxQuery";
import MoneroTxSet from "./model/MoneroTxSet";
import MoneroTxWallet from "./model/MoneroTxWallet";
import MoneroVersion from "../daemon/model/MoneroVersion";
import MoneroWallet from "./MoneroWallet";
import MoneroWalletConfig from "./model/MoneroWalletConfig";
import MoneroWalletListener from "./model/MoneroWalletListener";
import MoneroMessageSignatureType from "./model/MoneroMessageSignatureType";
import MoneroMessageSignatureResult from "./model/MoneroMessageSignatureResult";
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
    protected static readonly DEFAULT_SYNC_PERIOD_IN_MS = 20000;
    protected config: Partial<MoneroWalletConfig>;
    protected addressCache: any;
    protected syncPeriodInMs: number;
    protected listeners: MoneroWalletListener[];
    protected process: any;
    protected path: string;
    protected daemonConnection: MoneroRpcConnection;
    protected walletPoller: WalletPoller;
    /** @private */
    constructor(config: MoneroWalletConfig);
    /**
     * Get the internal process running monero-wallet-rpc.
     *
     * @return {ChildProcess} the process running monero-wallet-rpc, undefined if not created from new process
     */
    getProcess(): ChildProcess;
    /**
     * Stop the internal process running monero-wallet-rpc, if applicable.
     *
     * @param {boolean} force specifies if the process should be destroyed forcibly (default false)
     * @return {Promise<number | undefined>} the exit code from stopping the process
     */
    stopProcess(force?: boolean): Promise<number | undefined>;
    /**
     * Get the wallet's RPC connection.
     *
     * @return {MoneroRpcConnection | undefined} the wallet's rpc connection
     */
    getRpcConnection(): MoneroRpcConnection | undefined;
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
    openWallet(pathOrConfig: string | Partial<MoneroWalletConfig>, password?: string): Promise<MoneroWalletRpc>;
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
    createWallet(config: Partial<MoneroWalletConfig>): Promise<MoneroWalletRpc>;
    protected createWalletRandom(config: MoneroWalletConfig): Promise<this>;
    protected createWalletFromSeed(config: MoneroWalletConfig): Promise<this>;
    protected createWalletFromKeys(config: MoneroWalletConfig): Promise<this>;
    protected handleCreateWalletError(name: any, err: any): void;
    isViewOnly(): Promise<boolean>;
    /**
     * Set the wallet's daemon connection.
     *
     * @param {string|MoneroRpcConnection} [uriOrConnection] - the daemon's URI or connection (defaults to offline)
     * @param {boolean} isTrusted - indicates if the daemon in trusted
     * @param {SslOptions} sslOptions - custom SSL configuration
     */
    setDaemonConnection(uriOrConnection?: MoneroRpcConnection | string, isTrusted?: boolean, sslOptions?: SslOptions): Promise<void>;
    getDaemonConnection(): Promise<MoneroRpcConnection>;
    /**
     * Get the total and unlocked balances in a single request.
     *
     * @param {number} [accountIdx] account index
     * @param {number} [subaddressIdx] subaddress index
     * @return {Promise<bigint[]>} is the total and unlocked balances in an array, respectively
     */
    getBalances(accountIdx?: number, subaddressIdx?: number): Promise<bigint[]>;
    addListener(listener: MoneroWalletListener): Promise<void>;
    removeListener(listener: any): Promise<void>;
    isConnectedToDaemon(): Promise<boolean>;
    getVersion(): Promise<MoneroVersion>;
    getPath(): Promise<string>;
    getSeed(): Promise<string>;
    getSeedLanguage(): Promise<string>;
    /**
     * Get a list of available languages for the wallet's seed.
     *
     * @return {string[]} the available languages for the wallet's seed.
     */
    getSeedLanguages(): Promise<any>;
    getPrivateViewKey(): Promise<string>;
    getPrivateSpendKey(): Promise<string>;
    getAddress(accountIdx: number, subaddressIdx: number): Promise<string>;
    getAddressIndex(address: string): Promise<MoneroSubaddress>;
    getIntegratedAddress(standardAddress?: string, paymentId?: string): Promise<MoneroIntegratedAddress>;
    decodeIntegratedAddress(integratedAddress: string): Promise<MoneroIntegratedAddress>;
    getHeight(): Promise<number>;
    getDaemonHeight(): Promise<number>;
    getHeightByDate(year: number, month: number, day: number): Promise<number>;
    sync(listenerOrStartHeight?: MoneroWalletListener | number, startHeight?: number): Promise<MoneroSyncResult>;
    startSyncing(syncPeriodInMs?: number): Promise<void>;
    getSyncPeriodInMs(): number;
    stopSyncing(): Promise<void>;
    scanTxs(txHashes: string[]): Promise<void>;
    rescanSpent(): Promise<void>;
    rescanBlockchain(): Promise<void>;
    getBalance(accountIdx?: number, subaddressIdx?: number): Promise<bigint>;
    getUnlockedBalance(accountIdx?: number, subaddressIdx?: number): Promise<bigint>;
    getAccounts(includeSubaddresses?: boolean, tag?: string, skipBalances?: boolean): Promise<MoneroAccount[]>;
    getAccount(accountIdx: number, includeSubaddresses?: boolean, skipBalances?: boolean): Promise<MoneroAccount>;
    createAccount(label?: string): Promise<MoneroAccount>;
    getSubaddresses(accountIdx: number, subaddressIndices?: number[], skipBalances?: boolean): Promise<MoneroSubaddress[]>;
    getSubaddress(accountIdx: number, subaddressIdx: number, skipBalances?: boolean): Promise<MoneroSubaddress>;
    createSubaddress(accountIdx: number, label?: string): Promise<MoneroSubaddress>;
    setSubaddressLabel(accountIdx: number, subaddressIdx: number, label: string): Promise<void>;
    getTxs(query?: string[] | Partial<MoneroTxQuery>): Promise<MoneroTxWallet[]>;
    getTransfers(query?: Partial<MoneroTransferQuery>): Promise<MoneroTransfer[]>;
    getOutputs(query?: Partial<MoneroOutputQuery>): Promise<MoneroOutputWallet[]>;
    exportOutputs(all?: boolean): Promise<string>;
    importOutputs(outputsHex: string): Promise<number>;
    exportKeyImages(all?: boolean): Promise<MoneroKeyImage[]>;
    importKeyImages(keyImages: MoneroKeyImage[]): Promise<MoneroKeyImageImportResult>;
    getNewKeyImagesFromLastImport(): Promise<MoneroKeyImage[]>;
    freezeOutput(keyImage: string): Promise<void>;
    thawOutput(keyImage: string): Promise<void>;
    isOutputFrozen(keyImage: string): Promise<boolean>;
    getDefaultFeePriority(): Promise<MoneroTxPriority>;
    createTxs(config: Partial<MoneroTxConfig>): Promise<MoneroTxWallet[]>;
    sweepOutput(config: Partial<MoneroTxConfig>): Promise<MoneroTxWallet>;
    sweepUnlocked(config: Partial<MoneroTxConfig>): Promise<MoneroTxWallet[]>;
    sweepDust(relay?: boolean): Promise<MoneroTxWallet[]>;
    relayTxs(txsOrMetadatas: (MoneroTxWallet | string)[]): Promise<string[]>;
    describeTxSet(txSet: MoneroTxSet): Promise<MoneroTxSet>;
    signTxs(unsignedTxHex: string): Promise<MoneroTxSet>;
    submitTxs(signedTxHex: string): Promise<string[]>;
    signMessage(message: string, signatureType?: MoneroMessageSignatureType, accountIdx?: number, subaddressIdx?: number): Promise<string>;
    verifyMessage(message: string, address: string, signature: string): Promise<MoneroMessageSignatureResult>;
    getTxKey(txHash: string): Promise<string>;
    checkTxKey(txHash: string, txKey: string, address: string): Promise<MoneroCheckTx>;
    getTxProof(txHash: string, address: string, message?: string): Promise<string>;
    checkTxProof(txHash: string, address: string, message: string | undefined, signature: string): Promise<MoneroCheckTx>;
    getSpendProof(txHash: string, message?: string): Promise<string>;
    checkSpendProof(txHash: string, message: string | undefined, signature: string): Promise<boolean>;
    getReserveProofWallet(message?: string): Promise<string>;
    getReserveProofAccount(accountIdx: number, amount: bigint, message?: string): Promise<string>;
    checkReserveProof(address: string, message: string | undefined, signature: string): Promise<MoneroCheckReserve>;
    getTxNotes(txHashes: string[]): Promise<string[]>;
    setTxNotes(txHashes: string[], notes: string[]): Promise<void>;
    getAddressBookEntries(entryIndices?: number[]): Promise<MoneroAddressBookEntry[]>;
    addAddressBookEntry(address: string, description?: string): Promise<number>;
    editAddressBookEntry(index: number, setAddress: boolean, address: string | undefined, setDescription: boolean, description: string | undefined): Promise<void>;
    deleteAddressBookEntry(entryIdx: number): Promise<void>;
    tagAccounts(tag: any, accountIndices: any): Promise<void>;
    untagAccounts(accountIndices: number[]): Promise<void>;
    getAccountTags(): Promise<MoneroAccountTag[]>;
    setAccountTagLabel(tag: string, label: string): Promise<void>;
    getPaymentUri(config: MoneroTxConfig): Promise<string>;
    parsePaymentUri(uri: string): Promise<MoneroTxConfig>;
    getAttribute(key: string): Promise<string>;
    setAttribute(key: string, val: string): Promise<void>;
    startMining(numThreads: number, backgroundMining?: boolean, ignoreBattery?: boolean): Promise<void>;
    stopMining(): Promise<void>;
    isMultisigImportNeeded(): Promise<boolean>;
    getMultisigInfo(): Promise<MoneroMultisigInfo>;
    prepareMultisig(): Promise<string>;
    makeMultisig(multisigHexes: string[], threshold: number, password: string): Promise<string>;
    exchangeMultisigKeys(multisigHexes: string[], password: string): Promise<MoneroMultisigInitResult>;
    exportMultisigHex(): Promise<string>;
    importMultisigHex(multisigHexes: string[]): Promise<number>;
    signMultisigTxHex(multisigTxHex: string): Promise<MoneroMultisigSignResult>;
    submitMultisigTxHex(signedMultisigTxHex: string): Promise<string[]>;
    changePassword(oldPassword: string, newPassword: string): Promise<void>;
    save(): Promise<void>;
    close(save?: boolean): Promise<void>;
    isClosed(): Promise<boolean>;
    /**
     * Save and close the current wallet and stop the RPC server.
     *
     * @return {Promise<void>}
     */
    stop(): Promise<void>;
    getNumBlocksToUnlock(): Promise<number[] | undefined>;
    getTx(txHash: string): Promise<MoneroTxWallet | undefined>;
    getIncomingTransfers(query: Partial<MoneroTransferQuery>): Promise<MoneroIncomingTransfer[]>;
    getOutgoingTransfers(query: Partial<MoneroTransferQuery>): Promise<MoneroOutgoingTransfer[]>;
    createTx(config: Partial<MoneroTxConfig>): Promise<MoneroTxWallet>;
    relayTx(txOrMetadata: MoneroTxWallet | string): Promise<string>;
    getTxNote(txHash: string): Promise<string>;
    setTxNote(txHash: string, note: string): Promise<void>;
    static connectToWalletRpc(uriOrConfig: string | Partial<MoneroRpcConnection> | Partial<MoneroWalletConfig> | string[], username?: string, password?: string): Promise<MoneroWalletRpc>;
    protected static startWalletRpcProcess(config: Partial<MoneroWalletConfig>): Promise<MoneroWalletRpc>;
    protected clear(): Promise<void>;
    protected getAccountIndices(getSubaddressIndices?: any): Promise<Map<any, any>>;
    protected getSubaddressIndices(accountIdx: any): Promise<any[]>;
    protected getTransfersAux(query: MoneroTransferQuery): Promise<any[]>;
    protected getOutputsAux(query: any): Promise<any[]>;
    /**
     * Common method to get key images.
     *
     * @param all - pecifies to get all xor only new images from last import
     * @return {MoneroKeyImage[]} are the key images
     */
    protected rpcExportKeyImages(all: any): Promise<any>;
    protected rpcSweepAccount(config: MoneroTxConfig): Promise<MoneroTxWallet[]>;
    protected refreshListening(): void;
    /**
     * Poll if listening.
     */
    protected poll(): Promise<void>;
    protected static normalizeConfig(uriOrConfig: string | Partial<MoneroRpcConnection> | Partial<MoneroWalletConfig> | string[], username?: string, password?: string): MoneroWalletConfig;
    /**
     * Remove criteria which requires looking up other transfers/outputs to
     * fulfill query.
     *
     * @param {MoneroTxQuery} query - the query to decontextualize
     * @return {MoneroTxQuery} a reference to the query for convenience
     */
    protected static decontextualize(query: any): any;
    protected static isContextual(query: any): boolean;
    protected static convertRpcAccount(rpcAccount: any): MoneroAccount;
    protected static convertRpcSubaddress(rpcSubaddress: any): MoneroSubaddress;
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
    protected static initSentTxWallet(config: Partial<MoneroTxConfig>, tx: any, copyDestinations: any): any;
    /**
     * Initializes a tx set from a RPC map excluding txs.
     *
     * @param rpcMap - map to initialize the tx set from
     * @return MoneroTxSet - initialized tx set
     * @return the resulting tx set
     */
    protected static convertRpcTxSet(rpcMap: any): MoneroTxSet;
    /**
     * Initializes a MoneroTxSet from a list of rpc txs.
     *
     * @param rpcTxs - rpc txs to initialize the set from
     * @param txs - existing txs to further initialize (optional)
     * @param config - tx config
     * @return the converted tx set
     */
    protected static convertRpcSentTxsToTxSet(rpcTxs: any, txs?: any, config?: any): MoneroTxSet;
    /**
     * Converts a rpc tx with a transfer to a tx set with a tx and transfer.
     *
     * @param rpcTx - rpc tx to build from
     * @param tx - existing tx to continue initializing (optional)
     * @param isOutgoing - specifies if the tx is outgoing if true, incoming if false, or decodes from type if undefined
     * @param config - tx config
     * @return the initialized tx set with a tx
     */
    protected static convertRpcTxToTxSet(rpcTx: any, tx: any, isOutgoing: any, config: any): MoneroTxSet;
    /**
     * Builds a MoneroTxWallet from a RPC tx.
     *
     * @param rpcTx - rpc tx to build from
     * @param tx - existing tx to continue initializing (optional)
     * @param isOutgoing - specifies if the tx is outgoing if true, incoming if false, or decodes from type if undefined
     * @param config - tx config
     * @return {MoneroTxWallet} is the initialized tx
     */
    protected static convertRpcTxWithTransfer(rpcTx: any, tx?: any, isOutgoing?: any, config?: any): any;
    protected static convertRpcTxWalletWithOutput(rpcOutput: any): MoneroTxWallet;
    protected static convertRpcDescribeTransfer(rpcDescribeTransferResult: any): MoneroTxSet;
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
    protected static decodeRpcType(rpcType: any, tx: any): any;
    /**
     * Merges a transaction into a unique set of transactions.
     *
     * @param {MoneroTxWallet} tx - the transaction to merge into the existing txs
     * @param {Object} txMap - maps tx hashes to txs
     * @param {Object} blockMap - maps block heights to blocks
     */
    protected static mergeTx(tx: any, txMap: any, blockMap: any): void;
    /**
     * Compares two transactions by their height.
     */
    protected static compareTxsByHeight(tx1: any, tx2: any): number;
    /**
     * Compares two transfers by ascending account and subaddress indices.
     */
    static compareIncomingTransfers(t1: any, t2: any): number;
    /**
     * Compares two outputs by ascending account and subaddress indices.
     */
    protected static compareOutputs(o1: any, o2: any): any;
}
/**
 * Polls monero-wallet-rpc to provide listener notifications.
 *
 * @private
 */
declare class WalletPoller {
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
    constructor(wallet: any);
    setIsPolling(isPolling: any): void;
    setPeriodInMs(periodInMs: any): void;
    poll(): Promise<any>;
    protected onNewBlock(height: any): Promise<void>;
    protected notifyOutputs(tx: any): Promise<void>;
    protected getTx(txs: any, txHash: any): any;
    protected checkForChangedBalances(): Promise<boolean>;
}
export {};
