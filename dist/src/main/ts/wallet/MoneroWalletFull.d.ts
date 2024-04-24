import TaskLooper from "../common/TaskLooper";
import MoneroAccount from "./model/MoneroAccount";
import MoneroAccountTag from "./model/MoneroAccountTag";
import MoneroAddressBookEntry from "./model/MoneroAddressBookEntry";
import MoneroCheckTx from "./model/MoneroCheckTx";
import MoneroCheckReserve from "./model/MoneroCheckReserve";
import MoneroIncomingTransfer from "./model/MoneroIncomingTransfer";
import MoneroIntegratedAddress from "./model/MoneroIntegratedAddress";
import MoneroKeyImage from "../daemon/model/MoneroKeyImage";
import MoneroKeyImageImportResult from "./model/MoneroKeyImageImportResult";
import MoneroMultisigInfo from "./model/MoneroMultisigInfo";
import MoneroMultisigInitResult from "./model/MoneroMultisigInitResult";
import MoneroMultisigSignResult from "./model/MoneroMultisigSignResult";
import MoneroNetworkType from "../daemon/model/MoneroNetworkType";
import MoneroOutputQuery from "./model/MoneroOutputQuery";
import MoneroOutputWallet from "./model/MoneroOutputWallet";
import MoneroRpcConnection from "../common/MoneroRpcConnection";
import MoneroSubaddress from "./model/MoneroSubaddress";
import MoneroSyncResult from "./model/MoneroSyncResult";
import MoneroTransfer from "./model/MoneroTransfer";
import MoneroTransferQuery from "./model/MoneroTransferQuery";
import MoneroTxConfig from "./model/MoneroTxConfig";
import MoneroTxQuery from "./model/MoneroTxQuery";
import MoneroTxSet from "./model/MoneroTxSet";
import MoneroTxWallet from "./model/MoneroTxWallet";
import MoneroWallet from "./MoneroWallet";
import MoneroWalletConfig from "./model/MoneroWalletConfig";
import { MoneroWalletKeys, MoneroWalletKeysProxy } from "./MoneroWalletKeys";
import MoneroWalletListener from "./model/MoneroWalletListener";
import MoneroMessageSignatureType from "./model/MoneroMessageSignatureType";
import MoneroMessageSignatureResult from "./model/MoneroMessageSignatureResult";
import MoneroVersion from "../daemon/model/MoneroVersion";
/**
 * Implements a Monero wallet using client-side WebAssembly bindings to monero-project's wallet2 in C++.
 */
export default class MoneroWalletFull extends MoneroWalletKeys {
    protected static readonly DEFAULT_SYNC_PERIOD_IN_MS = 20000;
    protected static FS: any;
    protected path: string;
    protected password: string;
    protected listeners: MoneroWalletListener[];
    protected fs: any;
    protected wasmListener: WalletWasmListener;
    protected wasmListenerHandle: number;
    protected rejectUnauthorized: boolean;
    protected rejectUnauthorizedConfigId: string;
    protected syncPeriodInMs: number;
    protected syncLooper: TaskLooper;
    protected browserMainPath: string;
    /**
     * Internal constructor which is given the memory address of a C++ wallet instance.
     *
     * This constructor should be called through static wallet creation utilities in this class.
     *
     * @param {number} cppAddress - address of the wallet instance in C++
     * @param {string} path - path of the wallet instance
     * @param {string} password - password of the wallet instance
     * @param {FileSystem} fs - node.js-compatible file system to read/write wallet files
     * @param {boolean} rejectUnauthorized - specifies if unauthorized requests (e.g. self-signed certificates) should be rejected
     * @param {string} rejectUnauthorizedFnId - unique identifier for http_client_wasm to query rejectUnauthorized
     * @param {MoneroWalletFullProxy} walletProxy - proxy to invoke wallet operations in a web worker
     *
     * @private
     */
    constructor(cppAddress: any, path: any, password: any, fs: any, rejectUnauthorized: any, rejectUnauthorizedFnId: any, walletProxy?: MoneroWalletFullProxy);
    /**
     * Check if a wallet exists at a given path.
     *
     * @param {string} path - path of the wallet on the file system
     * @param {fs} - Node.js compatible file system to use (optional, defaults to disk if nodejs)
     * @return {boolean} true if a wallet exists at the given path, false otherwise
     */
    static walletExists(path: any, fs: any): Promise<any>;
    static openWallet(config: Partial<MoneroWalletConfig>): Promise<any>;
    static createWallet(config: MoneroWalletConfig): Promise<MoneroWalletFull>;
    protected static createWalletFromSeed(config: MoneroWalletConfig): Promise<MoneroWalletFull>;
    protected static createWalletFromKeys(config: MoneroWalletConfig): Promise<MoneroWalletFull>;
    protected static createWalletRandom(config: MoneroWalletConfig): Promise<MoneroWalletFull>;
    static getSeedLanguages(): Promise<any>;
    static getFs(): any;
    /**
     * Get the maximum height of the peers the wallet's daemon is connected to.
     *
     * @return {Promise<number>} the maximum height of the peers the wallet's daemon is connected to
     */
    getDaemonMaxPeerHeight(): Promise<number>;
    /**
     * Indicates if the wallet's daemon is synced with the network.
     *
     * @return {Promise<boolean>} true if the daemon is synced with the network, false otherwise
     */
    isDaemonSynced(): Promise<boolean>;
    /**
     * Indicates if the wallet is synced with the daemon.
     *
     * @return {Promise<boolean>} true if the wallet is synced with the daemon, false otherwise
     */
    isSynced(): Promise<boolean>;
    /**
     * Get the wallet's network type (mainnet, testnet, or stagenet).
     *
     * @return {Promise<MoneroNetworkType>} the wallet's network type
     */
    getNetworkType(): Promise<MoneroNetworkType>;
    /**
     * Get the height of the first block that the wallet scans.
     *
     * @return {Promise<number>} the height of the first block that the wallet scans
     */
    getRestoreHeight(): Promise<number>;
    /**
     * Set the height of the first block that the wallet scans.
     *
     * @param {number} restoreHeight - height of the first block that the wallet scans
     * @return {Promise<void>}
     */
    setRestoreHeight(restoreHeight: number): Promise<void>;
    /**
     * Move the wallet from its current path to the given path.
     *
     * @param {string} path - the wallet's destination path
     * @return {Promise<void>}
     */
    moveTo(path: string): Promise<void>;
    addListener(listener: MoneroWalletListener): Promise<void>;
    removeListener(listener: any): Promise<void>;
    getListeners(): MoneroWalletListener[];
    setDaemonConnection(uriOrConnection?: MoneroRpcConnection | string): Promise<void>;
    getDaemonConnection(): Promise<MoneroRpcConnection>;
    isConnectedToDaemon(): Promise<boolean>;
    getVersion(): Promise<MoneroVersion>;
    getPath(): Promise<string>;
    getIntegratedAddress(standardAddress?: string, paymentId?: string): Promise<MoneroIntegratedAddress>;
    decodeIntegratedAddress(integratedAddress: string): Promise<MoneroIntegratedAddress>;
    getHeight(): Promise<number>;
    getDaemonHeight(): Promise<number>;
    getHeightByDate(year: number, month: number, day: number): Promise<number>;
    /**
     * Synchronize the wallet with the daemon as a one-time synchronous process.
     *
     * @param {MoneroWalletListener|number} [listenerOrStartHeight] - listener xor start height (defaults to no sync listener, the last synced block)
     * @param {number} [startHeight] - startHeight if not given in first arg (defaults to last synced block)
     * @param {boolean} [allowConcurrentCalls] - allow other wallet methods to be processed simultaneously during sync (default false)<br><br><b>WARNING</b>: enabling this option will crash wallet execution if another call makes a simultaneous network request. TODO: possible to sync wasm network requests in http_client_wasm.cpp?
     */
    sync(listenerOrStartHeight?: MoneroWalletListener | number, startHeight?: number, allowConcurrentCalls?: boolean): Promise<MoneroSyncResult>;
    startSyncing(syncPeriodInMs?: number): Promise<void>;
    stopSyncing(): Promise<void>;
    scanTxs(txHashes: string[]): Promise<void>;
    rescanSpent(): Promise<void>;
    rescanBlockchain(): Promise<void>;
    getBalance(accountIdx?: number, subaddressIdx?: number): Promise<bigint>;
    getUnlockedBalance(accountIdx?: number, subaddressIdx?: number): Promise<bigint>;
    getAccounts(includeSubaddresses?: boolean, tag?: string): Promise<MoneroAccount[]>;
    getAccount(accountIdx: number, includeSubaddresses?: boolean): Promise<MoneroAccount>;
    createAccount(label?: string): Promise<MoneroAccount>;
    getSubaddresses(accountIdx: number, subaddressIndices?: number[]): Promise<MoneroSubaddress[]>;
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
    tagAccounts(tag: string, accountIndices: number[]): Promise<void>;
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
    isMultisig(): Promise<boolean>;
    getMultisigInfo(): Promise<MoneroMultisigInfo>;
    prepareMultisig(): Promise<string>;
    makeMultisig(multisigHexes: string[], threshold: number, password: string): Promise<string>;
    exchangeMultisigKeys(multisigHexes: string[], password: string): Promise<MoneroMultisigInitResult>;
    exportMultisigHex(): Promise<string>;
    importMultisigHex(multisigHexes: string[]): Promise<number>;
    signMultisigTxHex(multisigTxHex: string): Promise<MoneroMultisigSignResult>;
    submitMultisigTxHex(signedMultisigTxHex: string): Promise<string[]>;
    /**
     * Get the wallet's keys and cache data.
     *
     * @return {Promise<DataView[]>} is the keys and cache data, respectively
     */
    getData(): Promise<DataView[]>;
    changePassword(oldPassword: string, newPassword: string): Promise<void>;
    save(): Promise<void>;
    close(save?: boolean): Promise<void>;
    getNumBlocksToUnlock(): Promise<number[]>;
    getTx(txHash: string): Promise<MoneroTxWallet>;
    getIncomingTransfers(query: Partial<MoneroTransferQuery>): Promise<MoneroIncomingTransfer[]>;
    getOutgoingTransfers(query: Partial<MoneroTransferQuery>): Promise<import("./model/MoneroOutgoingTransfer").default[]>;
    createTx(config: Partial<MoneroTxConfig>): Promise<MoneroTxWallet>;
    relayTx(txOrMetadata: MoneroTxWallet | string): Promise<string>;
    getTxNote(txHash: string): Promise<string>;
    setTxNote(txHash: string, note: string): Promise<void>;
    protected static openWalletData(config: Partial<MoneroWalletConfig>): Promise<any>;
    protected getWalletProxy(): MoneroWalletFullProxy;
    protected backgroundSync(): Promise<void>;
    protected refreshListening(): Promise<any>;
    static sanitizeBlock(block: any): any;
    static sanitizeTxWallet(tx: any): MoneroTxWallet;
    static sanitizeAccount(account: any): any;
    static deserializeBlocks(blocksJsonStr: any): any;
    static deserializeTxs(query: any, blocksJsonStr: any): any[];
    static deserializeTransfers(query: any, blocksJsonStr: any): any[];
    static deserializeOutputs(query: any, blocksJsonStr: any): any[];
    /**
     * Set the path of the wallet on the browser main thread if run as a worker.
     *
     * @param {string} browserMainPath - path of the wallet on the browser main thread
     */
    protected setBrowserMainPath(browserMainPath: any): void;
    static moveTo(path: any, wallet: any): Promise<void>;
    static save(wallet: any): Promise<void>;
}
/**
 * Implements a MoneroWallet by proxying requests to a worker which runs a full wallet.
 *
 * @private
 */
declare class MoneroWalletFullProxy extends MoneroWalletKeysProxy {
    protected path: any;
    protected fs: any;
    protected wrappedListeners: any;
    static openWalletData(config: Partial<MoneroWalletConfig>): Promise<MoneroWalletFullProxy>;
    static createWallet(config: any): Promise<MoneroWalletFullProxy>;
    /**
     * Internal constructor which is given a worker to communicate with via messages.
     *
     * This method should not be called externally but should be called through
     * static wallet creation utilities in this class.
     *
     * @param {string} walletId - identifies the wallet with the worker
     * @param {Worker} worker - worker to communicate with via messages
     */
    constructor(walletId: any, worker: any, path: any, fs: any);
    getPath(): any;
    getNetworkType(): Promise<any>;
    setSubaddressLabel(accountIdx: any, subaddressIdx: any, label: any): Promise<void>;
    setDaemonConnection(uriOrRpcConnection: any): Promise<void>;
    getDaemonConnection(): Promise<MoneroRpcConnection>;
    isConnectedToDaemon(): Promise<any>;
    getRestoreHeight(): Promise<any>;
    setRestoreHeight(restoreHeight: any): Promise<any>;
    getDaemonHeight(): Promise<any>;
    getDaemonMaxPeerHeight(): Promise<any>;
    getHeightByDate(year: any, month: any, day: any): Promise<any>;
    isDaemonSynced(): Promise<any>;
    getHeight(): Promise<any>;
    addListener(listener: any): Promise<any>;
    removeListener(listener: any): Promise<void>;
    getListeners(): any[];
    isSynced(): Promise<any>;
    sync(listenerOrStartHeight?: MoneroWalletListener | number, startHeight?: number, allowConcurrentCalls?: boolean): Promise<MoneroSyncResult>;
    startSyncing(syncPeriodInMs: any): Promise<any>;
    stopSyncing(): Promise<any>;
    scanTxs(txHashes: any): Promise<any>;
    rescanSpent(): Promise<any>;
    rescanBlockchain(): Promise<any>;
    getBalance(accountIdx: any, subaddressIdx: any): Promise<bigint>;
    getUnlockedBalance(accountIdx: any, subaddressIdx: any): Promise<bigint>;
    getAccounts(includeSubaddresses: any, tag: any): Promise<any[]>;
    getAccount(accountIdx: any, includeSubaddresses: any): Promise<any>;
    createAccount(label: any): Promise<any>;
    getSubaddresses(accountIdx: any, subaddressIndices: any): Promise<any[]>;
    createSubaddress(accountIdx: any, label: any): Promise<any>;
    getTxs(query: any): Promise<any[]>;
    getTransfers(query: any): Promise<any[]>;
    getOutputs(query: any): Promise<any[]>;
    exportOutputs(all: any): Promise<any>;
    importOutputs(outputsHex: any): Promise<any>;
    exportKeyImages(all: any): Promise<any[]>;
    importKeyImages(keyImages: any): Promise<MoneroKeyImageImportResult>;
    getNewKeyImagesFromLastImport(): Promise<MoneroKeyImage[]>;
    freezeOutput(keyImage: any): Promise<any>;
    thawOutput(keyImage: any): Promise<any>;
    isOutputFrozen(keyImage: any): Promise<any>;
    createTxs(config: any): Promise<MoneroTxWallet[]>;
    sweepOutput(config: any): Promise<MoneroTxWallet>;
    sweepUnlocked(config: any): Promise<any[]>;
    sweepDust(relay: any): Promise<MoneroTxWallet[]>;
    relayTxs(txsOrMetadatas: any): Promise<any>;
    describeTxSet(txSet: any): Promise<MoneroTxSet>;
    signTxs(unsignedTxHex: any): Promise<MoneroTxSet>;
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
    setTxNotes(txHashes: any, notes: any): Promise<any>;
    getAddressBookEntries(entryIndices: any): Promise<any[]>;
    addAddressBookEntry(address: any, description: any): Promise<any>;
    editAddressBookEntry(index: any, setAddress: any, address: any, setDescription: any, description: any): Promise<any>;
    deleteAddressBookEntry(entryIdx: any): Promise<any>;
    tagAccounts(tag: any, accountIndices: any): Promise<any>;
    untagAccounts(accountIndices: any): Promise<any>;
    getAccountTags(): Promise<any>;
    setAccountTagLabel(tag: any, label: any): Promise<any>;
    getPaymentUri(config: any): Promise<any>;
    parsePaymentUri(uri: any): Promise<MoneroTxConfig>;
    getAttribute(key: any): Promise<any>;
    setAttribute(key: any, val: any): Promise<any>;
    startMining(numThreads: any, backgroundMining: any, ignoreBattery: any): Promise<any>;
    stopMining(): Promise<any>;
    isMultisigImportNeeded(): Promise<any>;
    isMultisig(): Promise<any>;
    getMultisigInfo(): Promise<MoneroMultisigInfo>;
    prepareMultisig(): Promise<any>;
    makeMultisig(multisigHexes: any, threshold: any, password: any): Promise<any>;
    exchangeMultisigKeys(multisigHexes: any, password: any): Promise<MoneroMultisigInitResult>;
    exportMultisigHex(): Promise<any>;
    importMultisigHex(multisigHexes: any): Promise<any>;
    signMultisigTxHex(multisigTxHex: any): Promise<MoneroMultisigSignResult>;
    submitMultisigTxHex(signedMultisigTxHex: any): Promise<any>;
    getData(): Promise<any>;
    moveTo(path: any): Promise<void>;
    changePassword(oldPassword: any, newPassword: any): Promise<void>;
    save(): Promise<void>;
    close(save: any): Promise<void>;
}
/**
 * Receives notifications directly from wasm c++.
 *
 * @private
 */
declare class WalletWasmListener {
    protected wallet: MoneroWallet;
    constructor(wallet: any);
    onSyncProgress(height: any, startHeight: any, endHeight: any, percentDone: any, message: any): Promise<void>;
    onNewBlock(height: any): Promise<void>;
    onBalancesChanged(newBalanceStr: any, newUnlockedBalanceStr: any): Promise<void>;
    onOutputReceived(height: any, txHash: any, amountStr: any, accountIdx: any, subaddressIdx: any, version: any, unlockTime: any, isLocked: any): Promise<void>;
    onOutputSpent(height: any, txHash: any, amountStr: any, accountIdxStr: any, subaddressIdxStr: any, version: any, unlockTime: any, isLocked: any): Promise<void>;
}
export {};
