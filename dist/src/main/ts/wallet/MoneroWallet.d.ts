import MoneroAccount from "./model/MoneroAccount";
import MoneroAccountTag from "./model/MoneroAccountTag";
import MoneroAddressBookEntry from "./model/MoneroAddressBookEntry";
import MoneroCheckReserve from "./model/MoneroCheckReserve";
import MoneroCheckTx from "./model/MoneroCheckTx";
import MoneroConnectionManager from "../common/MoneroConnectionManager";
import MoneroConnectionManagerListener from "../common/MoneroConnectionManagerListener";
import MoneroIncomingTransfer from "./model/MoneroIncomingTransfer";
import MoneroIntegratedAddress from "./model/MoneroIntegratedAddress";
import MoneroKeyImage from "../daemon/model/MoneroKeyImage";
import MoneroKeyImageImportResult from "./model/MoneroKeyImageImportResult";
import MoneroMessageSignatureResult from "./model/MoneroMessageSignatureResult";
import MoneroMessageSignatureType from "./model/MoneroMessageSignatureType";
import MoneroMultisigInfo from "./model/MoneroMultisigInfo";
import MoneroMultisigInitResult from "./model/MoneroMultisigInitResult";
import MoneroMultisigSignResult from "./model/MoneroMultisigSignResult";
import MoneroOutputQuery from "./model/MoneroOutputQuery";
import MoneroOutputWallet from "./model/MoneroOutputWallet";
import MoneroOutgoingTransfer from "./model/MoneroOutgoingTransfer";
import MoneroRpcConnection from "../common/MoneroRpcConnection";
import MoneroSubaddress from "./model/MoneroSubaddress";
import MoneroSyncResult from "./model/MoneroSyncResult";
import MoneroTransfer from "./model/MoneroTransfer";
import MoneroTransferQuery from "./model/MoneroTransferQuery";
import MoneroTxConfig from "./model/MoneroTxConfig";
import MoneroTxPriority from "./model/MoneroTxPriority";
import MoneroTxQuery from "./model/MoneroTxQuery";
import MoneroTxWallet from "./model/MoneroTxWallet";
import MoneroTxSet from "./model/MoneroTxSet";
import MoneroVersion from "../daemon/model/MoneroVersion";
import MoneroWalletListener from "./model/MoneroWalletListener";
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
 * Monero wallet interface and default implementations.
 *
 * @interface
 */
export default class MoneroWallet {
    static readonly DEFAULT_LANGUAGE = "English";
    protected connectionManager: MoneroConnectionManager;
    protected connectionManagerListener: MoneroConnectionManagerListener;
    protected listeners: MoneroWalletListener[];
    protected _isClosed: boolean;
    /**
     * Hidden constructor.
     *
     * @private
     */
    constructor();
    /**
     * Register a listener to receive wallet notifications.
     *
     * @param {MoneroWalletListener} listener - listener to receive wallet notifications
     * @return {Promise<void>}
     */
    addListener(listener: MoneroWalletListener): Promise<void>;
    /**
     * Unregister a listener to receive wallet notifications.
     *
     * @param {MoneroWalletListener} listener - listener to unregister
     * @return {Promise<void>}
     */
    removeListener(listener: any): Promise<void>;
    /**
     * Get the listeners registered with the wallet.
     *
     * @return {MoneroWalletListener[]} the registered listeners
     */
    getListeners(): MoneroWalletListener[];
    /**
     * Indicates if the wallet is view-only, meaning it does not have the private
     * spend key and can therefore only observe incoming outputs.
     *
     * @return {Promise<boolean>} true if the wallet is view-only, false otherwise
     */
    isViewOnly(): Promise<boolean>;
    /**
     * Set the wallet's daemon connection.
     *
     * @param {MoneroRpcConnection | string} [uriOrConnection] - daemon's URI or connection (defaults to offline)
     * @return {Promise<void>}
     */
    setDaemonConnection(uriOrConnection?: MoneroRpcConnection | string): Promise<void>;
    /**
     * Get the wallet's daemon connection.
     *
     * @return {Promise<MoneroRpcConnection>} the wallet's daemon connection
     */
    getDaemonConnection(): Promise<MoneroRpcConnection>;
    /**
     * Set the wallet's daemon connection manager.
     *
     * @param {MoneroConnectionManager} connectionManager manages connections to monerod
     * @return {Promise<void>}
     */
    setConnectionManager(connectionManager?: MoneroConnectionManager): Promise<void>;
    /**
     * Get the wallet's daemon connection manager.
     *
     * @return {Promise<MoneroConnectionManager>} the wallet's daemon connection manager
     */
    getConnectionManager(): Promise<MoneroConnectionManager>;
    /**
     * Indicates if the wallet is connected to daemon.
     *
     * @return {Promise<boolean>} true if the wallet is connected to a daemon, false otherwise
     */
    isConnectedToDaemon(): Promise<boolean>;
    /**
     * Gets the version of the wallet.
     *
     * @return {Promise<MoneroVersion>} the version of the wallet
     */
    getVersion(): Promise<MoneroVersion>;
    /**
     * Get the wallet's path.
     *
     * @return {Promise<string>} the path the wallet can be opened with
     */
    getPath(): Promise<string>;
    /**
     * Get the wallet's mnemonic phrase or seed.
     *
     * @return {Promise<string>} the wallet's mnemonic phrase or seed.
     */
    getSeed(): Promise<string>;
    /**
     * Get the language of the wallet's mnemonic phrase or seed.
     *
     * @return {Promise<string>} the language of the wallet's mnemonic phrase or seed.
     */
    getSeedLanguage(): Promise<string>;
    /**
     * Get the wallet's private view key.
     *
     * @return {Promise<string>} the wallet's private view key
     */
    getPrivateViewKey(): Promise<string>;
    /**
     * Get the wallet's private spend key.
     *
     * @return {Promise<string>} the wallet's private spend key
     */
    getPrivateSpendKey(): Promise<string>;
    /**
     * Get the wallet's public view key.
     *
     * @return {Promise<string>} the wallet's public view key
     */
    getPublicViewKey(): Promise<string>;
    /**
     * Get the wallet's public spend key.
     *
     * @return {Promise<string>} the wallet's public spend key
     */
    getPublicSpendKey(): Promise<string>;
    /**
     * Get the wallet's primary address.
     *
     * @return {Promise<string>} the wallet's primary address
     */
    getPrimaryAddress(): Promise<string>;
    /**
     * Get the address of a specific subaddress.
     *
     * @param {number} accountIdx - the account index of the address's subaddress
     * @param {number} subaddressIdx - the subaddress index within the account
     * @return {Promise<string>} the receive address of the specified subaddress
     */
    getAddress(accountIdx: number, subaddressIdx: number): Promise<string>;
    /**
     * Get the account and subaddress index of the given address.
     *
     * @param {string} address - address to get the account and subaddress index from
     * @return {Promise<MoneroSubaddress>} the account and subaddress indices
     */
    getAddressIndex(address: string): Promise<MoneroSubaddress>;
    /**
     * Get an integrated address based on the given standard address and payment
     * ID. Uses the wallet's primary address if an address is not given.
     * Generates a random payment ID if a payment ID is not given.
     *
     * @param {string} standardAddress is the standard address to generate the integrated address from (wallet's primary address if undefined)
     * @param {string} paymentId is the payment ID to generate an integrated address from (randomly generated if undefined)
     * @return {Promise<MoneroIntegratedAddress>} the integrated address
     */
    getIntegratedAddress(standardAddress?: string, paymentId?: string): Promise<MoneroIntegratedAddress>;
    /**
     * Decode an integrated address to get its standard address and payment id.
     *
     * @param {string} integratedAddress - integrated address to decode
     * @return {Promise<MoneroIntegratedAddress>} the decoded integrated address including standard address and payment id
     */
    decodeIntegratedAddress(integratedAddress: string): Promise<MoneroIntegratedAddress>;
    /**
     * Get the block height that the wallet is synced to.
     *
     * @return {Promise<number>} the block height that the wallet is synced to
     */
    getHeight(): Promise<number>;
    /**
     * Get the blockchain's height.
     *
     * @return {Promise<number>} the blockchain's height
     */
    getDaemonHeight(): Promise<number>;
    /**
     * Get the blockchain's height by date as a conservative estimate for scanning.
     *
     * @param {number} year - year of the height to get
     * @param {number} month - month of the height to get as a number between 1 and 12
     * @param {number} day - day of the height to get as a number between 1 and 31
     * @return {Promise<number>} the blockchain's approximate height at the given date
     */
    getHeightByDate(year: number, month: number, day: number): Promise<number>;
    /**
     * Synchronize the wallet with the daemon as a one-time synchronous process.
     *
     * @param {MoneroWalletListener|number} [listenerOrStartHeight] - listener xor start height (defaults to no sync listener, the last synced block)
     * @param {number} [startHeight] - startHeight if not given in first arg (defaults to last synced block)
     * @return {Promise<void>}
     */
    sync(listenerOrStartHeight?: MoneroWalletListener | number, startHeight?: number): Promise<MoneroSyncResult>;
    /**
     * Start background synchronizing with a maximum period between syncs.
     *
     * @param {number} [syncPeriodInMs] - maximum period between syncs in milliseconds (default is wallet-specific)
     * @return {Promise<void>}
     */
    startSyncing(syncPeriodInMs?: number): Promise<void>;
    /**
     * Stop synchronizing the wallet with the daemon.
     *
     * @return {Promise<void>}
     */
    stopSyncing(): Promise<void>;
    /**
     * Scan transactions by their hash/id.
     *
     * @param {string[]} txHashes - tx hashes to scan
     * @return {Promise<void>}
     */
    scanTxs(txHashes: string[]): Promise<void>;
    /**
     * <p>Rescan the blockchain for spent outputs.</p>
     *
     * <p>Note: this can only be called with a trusted daemon.</p>
     *
     * <p>Example use case: peer multisig hex is import when connected to an untrusted daemon,
     * so the wallet will not rescan spent outputs.  Then the wallet connects to a trusted
     * daemon.  This method should be manually invoked to rescan outputs.</p>
     *
     * @return {Promise<void>}
     */
    rescanSpent(): Promise<void>;
    /**
     * <p>Rescan the blockchain from scratch, losing any information which cannot be recovered from
     * the blockchain itself.</p>
     *
     * <p>WARNING: This method discards local wallet data like destination addresses, tx secret keys,
     * tx notes, etc.</p>
     *
     * @return {Promise<void>}
     */
    rescanBlockchain(): Promise<void>;
    /**
     * Get the balance of the wallet, account, or subaddress.
     *
     * @param {number} [accountIdx] - index of the account to get the balance of (default all accounts)
     * @param {number} [subaddressIdx] - index of the subaddress to get the balance of (default all subaddresses)
     * @return {Promise<bigint>} the balance of the wallet, account, or subaddress
     */
    getBalance(accountIdx?: number, subaddressIdx?: number): Promise<bigint>;
    /**
     * Get the unlocked balance of the wallet, account, or subaddress.
     *
     * @param {number} [accountIdx] - index of the account to get the unlocked balance of (optional)
     * @param {number} [subaddressIdx] - index of the subaddress to get the unlocked balance of (optional)
     * @return {Promise<bigint>} the unlocked balance of the wallet, account, or subaddress
     */
    getUnlockedBalance(accountIdx?: number, subaddressIdx?: number): Promise<bigint>;
    /**
     * Get the number of blocks until the next and last funds unlock. Ignores txs with unlock time as timestamp.
     *
     * @return {Promise<number[]>} the number of blocks until the next and last funds unlock in elements 0 and 1, respectively, or undefined if no balance
     */
    getNumBlocksToUnlock(): Promise<number[] | undefined>;
    /**
     * Get accounts with a given tag.
     *
     * @param {boolean} includeSubaddresses - include subaddresses if true
     * @param {string} tag - tag for filtering accounts, all accounts if undefined
     * @return {Promise<MoneroAccount[]>} all accounts with the given tag
     */
    getAccounts(includeSubaddresses?: boolean, tag?: string): Promise<MoneroAccount[]>;
    /**
     * Get an account.
     *
     * @param {number} accountIdx - index of the account to get
     * @param {boolean} includeSubaddresses - include subaddresses if true
     * @return {Promise<MoneroAccount>} the retrieved account
     */
    getAccount(accountIdx: number, includeSubaddresses?: boolean): Promise<MoneroAccount>;
    /**
     * Create a new account with a label for the first subaddress.
     *
     * @param {string} [label] - label for account's first subaddress (optional)
     * @return {Promise<MoneroAccount>} the created account
     */
    createAccount(label?: string): Promise<MoneroAccount>;
    /**
     * Set an account label.
     *
     * @param {number} accountIdx - index of the account to set the label for
     * @param {string} label - the label to set
     * @return {Promise<void>}
     */
    setAccountLabel(accountIdx: number, label: string): Promise<void>;
    /**
     * Get subaddresses in an account.
     *
     * @param {number} accountIdx - account to get subaddresses within
     * @param {number[]} [subaddressIndices] - indices of subaddresses to get (optional)
     * @return {Promise<MoneroSubaddress[]>} the retrieved subaddresses
     */
    getSubaddresses(accountIdx: number, subaddressIndices?: number[]): Promise<MoneroSubaddress[]>;
    /**
     * Get a subaddress.
     *
     * @param {number} accountIdx - index of the subaddress's account
     * @param {number} subaddressIdx - index of the subaddress within the account
     * @return {Promise<MoneroSubaddress>} the retrieved subaddress
     */
    getSubaddress(accountIdx: number, subaddressIdx: number): Promise<MoneroSubaddress>;
    /**
     * Create a subaddress within an account.
     *
     * @param {number} accountIdx - index of the account to create the subaddress within
     * @param {string} [label] - the label for the subaddress (optional)
     * @return {Promise<MoneroSubaddress>} the created subaddress
     */
    createSubaddress(accountIdx: number, label?: string): Promise<MoneroSubaddress>;
    /**
     * Set a subaddress label.
     *
     * @param {number} accountIdx - index of the account to set the label for
     * @param {number} subaddressIdx - index of the subaddress to set the label for
     * @param {Promise<string>} label - the label to set
     */
    setSubaddressLabel(accountIdx: number, subaddressIdx: number, label: string): Promise<void>;
    /**
     * Get a wallet transaction by hash.
     *
     * @param {string} txHash - hash of a transaction to get
     * @return {Promise<MoneroTxWallet> } the identified transaction or undefined if not found
     */
    getTx(txHash: string): Promise<MoneroTxWallet | undefined>;
    /**
     * <p>Get wallet transactions.  Wallet transactions contain one or more
     * transfers that are either incoming or outgoing to the wallet.<p>
     *
     * <p>Results can be filtered by passing a query object.  Transactions must
     * meet every criteria defined in the query in order to be returned.  All
     * criteria are optional and no filtering is applied when not defined.</p>
     *
     * @param {string[] | MoneroTxQuery} [query] - configures the query (optional)
     * @param {boolean} [query.isConfirmed] - get txs that are confirmed or not (optional)
     * @param {boolean} [query.inTxPool] - get txs that are in the tx pool or not (optional)
     * @param {boolean} [query.isRelayed] - get txs that are relayed or not (optional)
     * @param {boolean} [query.isFailed] - get txs that are failed or not (optional)
     * @param {boolean} [query.isMinerTx] - get miner txs or not (optional)
     * @param {string} [query.hash] - get a tx with the hash (optional)
     * @param {string[]} [query.hashes] - get txs with the hashes (optional)
     * @param {string} [query.paymentId] - get transactions with the payment id (optional)
     * @param {string[]} [query.paymentIds] - get transactions with the payment ids (optional)
     * @param {boolean} [query.hasPaymentId] - get transactions with a payment id or not (optional)
     * @param {number} [query.minHeight] - get txs with height >= the given height (optional)
     * @param {number} [query.maxHeight] - get txs with height <= the given height (optional)
     * @param {boolean} [query.isOutgoing] - get txs with an outgoing transfer or not (optional)
     * @param {boolean} [query.isIncoming] - get txs with an incoming transfer or not (optional)
     * @param {MoneroTransferQuery} [query.transferQuery] - get txs that have a transfer that meets this query (optional)
     * @param {boolean} [query.includeOutputs] - specifies that tx outputs should be returned with tx results (optional)
     * @return {Promise<MoneroTxWallet[]>} wallet transactions per the configuration
     */
    getTxs(query?: string[] | Partial<MoneroTxQuery>): Promise<MoneroTxWallet[]>;
    /**
     * <p>Get incoming and outgoing transfers to and from this wallet.  An outgoing
     * transfer represents a total amount sent from one or more subaddresses
     * within an account to individual destination addresses, each with their
     * own amount.  An incoming transfer represents a total amount received into
     * a subaddress within an account.  Transfers belong to transactions which
     * are stored on the blockchain.</p>
     *
     * <p>Results can be filtered by passing a query object.  Transfers must
     * meet every criteria defined in the query in order to be returned.  All
     * criteria are optional and no filtering is applied when not defined.</p>
     *
     * @param {MoneroTransferQuery} [query] - configures the query (optional)
     * @param {boolean} [query.isOutgoing] - get transfers that are outgoing or not (optional)
     * @param {boolean} [query.isIncoming] - get transfers that are incoming or not (optional)
     * @param {string} [query.address] - wallet's address that a transfer either originated from (if outgoing) or is destined for (if incoming) (optional)
     * @param {number} [query.accountIndex] - get transfers that either originated from (if outgoing) or are destined for (if incoming) a specific account index (optional)
     * @param {number} [query.subaddressIndex] - get transfers that either originated from (if outgoing) or are destined for (if incoming) a specific subaddress index (optional)
     * @param {int[]} [query.subaddressIndices] - get transfers that either originated from (if outgoing) or are destined for (if incoming) specific subaddress indices (optional)
     * @param {bigint} [query.amount] - amount being transferred (optional)
     * @param {MoneroDestination[] | MoneroDestinationModel[]} [query.destinations] - individual destinations of an outgoing transfer, which is local wallet data and NOT recoverable from the blockchain (optional)
     * @param {boolean} [query.hasDestinations] - get transfers that have destinations or not (optional)
     * @param {MoneroTxQuery} [query.txQuery] - get transfers whose transaction meets this query (optional)
     * @return {Promise<MoneroTransfer[]>} wallet transfers that meet the query
     */
    getTransfers(query?: Partial<MoneroTransferQuery>): Promise<MoneroTransfer[]>;
    /**
     * Get incoming transfers.
     *
     * @param {Partial<MoneroTransferQuery>} [query] - configures the query (optional)
     * @param {string} [query.address] - get incoming transfers to a specific address in the wallet (optional)
     * @param {number} [query.accountIndex] - get incoming transfers to a specific account index (optional)
     * @param {number} [query.subaddressIndex] - get incoming transfers to a specific subaddress index (optional)
     * @param {int[]} [query.subaddressIndices] - get transfers destined for specific subaddress indices (optional)
     * @param {bigint} [query.amount] - amount being transferred (optional)
     * @param {MoneroTxQuery} [query.txQuery] - get transfers whose transaction meets this query (optional)
     * @return {Promise<MoneroIncomingTransfer[]>} incoming transfers that meet the query
     */
    getIncomingTransfers(query?: Partial<MoneroTransferQuery>): Promise<MoneroIncomingTransfer[]>;
    /**
     * Get outgoing transfers.
     *
     * @param {Partial<MoneroTransferQuery>} [query] - configures the query (optional)
     * @param {string} [query.address] - get outgoing transfers from a specific address in the wallet (optional)
     * @param {number} [query.accountIndex] - get outgoing transfers from a specific account index (optional)
     * @param {number} [query.subaddressIndex] - get outgoing transfers from a specific subaddress index (optional)
     * @param {int[]} [query.subaddressIndices] - get outgoing transfers from specific subaddress indices (optional)
     * @param {bigint} [query.amount] - amount being transferred (optional)
     * @param {MoneroDestination[] | MoneroDestinationModel[]} [query.destinations] - individual destinations of an outgoing transfer, which is local wallet data and NOT recoverable from the blockchain (optional)
     * @param {boolean} [query.hasDestinations] - get transfers that have destinations or not (optional)
     * @param {MoneroTxQuery} [query.txQuery] - get transfers whose transaction meets this query (optional)
     * @return {Promise<MoneroOutgoingTransfer[]>} outgoing transfers that meet the query
     */
    getOutgoingTransfers(query?: Partial<MoneroTransferQuery>): Promise<MoneroOutgoingTransfer[]>;
    /**
     * <p>Get outputs created from previous transactions that belong to the wallet
     * (i.e. that the wallet can spend one time).  Outputs are part of
     * transactions which are stored in blocks on the blockchain.</p>
     *
     * <p>Results can be filtered by passing a query object.  Outputs must
     * meet every criteria defined in the query in order to be returned.  All
     * filtering is optional and no filtering is applied when not defined.</p>
     *
     * @param {Parital<MoneroOutputQuery>} [query] - configures the query (optional)
     * @param {number} [query.accountIndex] - get outputs associated with a specific account index (optional)
     * @param {number} [query.subaddressIndex] - get outputs associated with a specific subaddress index (optional)
     * @param {int[]} [query.subaddressIndices] - get outputs associated with specific subaddress indices (optional)
     * @param {bigint} [query.amount] - get outputs with a specific amount (optional)
     * @param {bigint} [query.minAmount] - get outputs greater than or equal to a minimum amount (optional)
     * @param {bigint} [query.maxAmount] - get outputs less than or equal to a maximum amount (optional)
     * @param {boolean} [query.isSpent] - get outputs that are spent or not (optional)
     * @param {string|MoneroKeyImage} [query.keyImage] - get output with a key image or which matches fields defined in a MoneroKeyImage (optional)
     * @param {MoneroTxQuery} [query.txQuery] - get outputs whose transaction meets this filter (optional)
     * @return {Promise<MoneroOutputWallet[]>} the queried outputs
     */
    getOutputs(query?: Partial<MoneroOutputQuery>): Promise<MoneroOutputWallet[]>;
    /**
     * Export outputs in hex format.
     *
     * @param {boolean} [all] - export all outputs if true, else export the outputs since the last export (default false)
     * @return {Promise<string>} outputs in hex format
     */
    exportOutputs(all?: boolean): Promise<string>;
    /**
     * Import outputs in hex format.
     *
     * @param {string} outputsHex - outputs in hex format
     * @return {Promise<number>} the number of outputs imported
     */
    importOutputs(outputsHex: string): Promise<number>;
    /**
     * Export signed key images.
     *
     * @param {boolean} [all] - export all key images if true, else export the key images since the last export (default false)
     * @return {Promise<MoneroKeyImage[]>} the wallet's signed key images
     */
    exportKeyImages(all?: boolean): Promise<MoneroKeyImage[]>;
    /**
     * Import signed key images and verify their spent status.
     *
     * @param {MoneroKeyImage[]} keyImages - images to import and verify (requires hex and signature)
     * @return {Promise<MoneroKeyImageImportResult>} results of the import
     */
    importKeyImages(keyImages: MoneroKeyImage[]): Promise<MoneroKeyImageImportResult>;
    /**
     * Get new key images from the last imported outputs.
     *
     * @return {Promise<MoneroKeyImage[]>} the key images from the last imported outputs
     */
    getNewKeyImagesFromLastImport(): Promise<MoneroKeyImage[]>;
    /**
     * Freeze an output.
     *
     * @param {string} keyImage - key image of the output to freeze
     * @return {Promise<void>}
     */
    freezeOutput(keyImage: string): Promise<void>;
    /**
     * Thaw a frozen output.
     *
     * @param {string} keyImage - key image of the output to thaw
     * @return {Promise<void>}
     */
    thawOutput(keyImage: string): Promise<void>;
    /**
     * Check if an output is frozen.
     *
     * @param {string} keyImage - key image of the output to check if frozen
     * @return {Promise<boolean>} true if the output is frozen, false otherwise
     */
    isOutputFrozen(keyImage: string): Promise<boolean>;
    /**
     * Get the current default fee priority (unimportant, normal, elevated, etc).
     *
     * @return {Promise<MoneroTxPriority>} the current fee priority
     */
    getDefaultFeePriority(): Promise<MoneroTxPriority>;
    /**
     * Create a transaction to transfer funds from this wallet.
     *
     * @param {MoneroTxConfig} config - configures the transaction to create (required)
     * @param {string} config.address - single destination address (required unless `destinations` provided)
     * @param {bigint|string} config.amount - single destination amount (required unless `destinations` provided)
     * @param {number} config.accountIndex - source account index to transfer funds from (required)
     * @param {number} [config.subaddressIndex] - source subaddress index to transfer funds from (optional)
     * @param {number[]} [config.subaddressIndices] - source subaddress indices to transfer funds from (optional)
     * @param {boolean} [config.relay] - relay the transaction to peers to commit to the blockchain (default false)
     * @param {MoneroTxPriority} [config.priority] - transaction priority (default MoneroTxPriority.NORMAL)
     * @param {MoneroDestination[]} config.destinations - addresses and amounts in a multi-destination tx (required unless `address` and `amount` provided)
     * @param {number[]} [config.subtractFeeFrom] - list of destination indices to split the transaction fee (optional)
     * @param {string} [config.paymentId] - transaction payment ID (optional)
     * @param {bigint|string} [config.unlockTime] - minimum height or timestamp for the transaction to unlock (default 0)
     * @return {Promise<MoneroTxWallet>} the created transaction
     */
    createTx(config: Partial<MoneroTxConfig>): Promise<MoneroTxWallet>;
    /**
     * Create one or more transactions to transfer funds from this wallet.
     *
     * @param {Partial<MoneroTxConfig>} config - configures the transactions to create (required)
     * @param {string} config.address - single destination address (required unless `destinations` provided)
     * @param {bigint|string} config.amount - single destination amount (required unless `destinations` provided)
     * @param {number} config.accountIndex - source account index to transfer funds from (required)
     * @param {number} [config.subaddressIndex] - source subaddress index to transfer funds from (optional)
     * @param {int[]} [config.subaddressIndices] - source subaddress indices to transfer funds from (optional)
     * @param {boolean} [config.relay] - relay the transactions to peers to commit to the blockchain (default false)
     * @param {MoneroTxPriority} [config.priority] - transaction priority (default MoneroTxPriority.NORMAL)
     * @param {MoneroDestination[] | MoneroDestinationModel[]} config.destinations - addresses and amounts in a multi-destination tx (required unless `address` and `amount` provided)
     * @param {string} [config.paymentId] - transaction payment ID (optional)
     * @param {bigint|string} [config.unlockTime] - minimum height or timestamp for the transactions to unlock (default 0)
     * @param {boolean} [config.canSplit] - allow funds to be transferred using multiple transactions (default true)
     * @return {Promise<MoneroTxWallet[]>} the created transactions
     */
    createTxs(config: Partial<MoneroTxConfig>): Promise<MoneroTxWallet[]>;
    /**
     * Sweep an output by key image.
     *
     * @param {Partial<MoneroTxConfig>} config - configures the transaction to create (required)
     * @param {string} config.address - single destination address (required)
     * @param {string} config.keyImage - key image to sweep (required)
     * @param {boolean} [config.relay] - relay the transaction to peers to commit to the blockchain (default false)
     * @param {bigint|string} [config.unlockTime] - minimum height or timestamp for the transaction to unlock (default 0)
     * @param {MoneroTxPriority} [config.priority] - transaction priority (default MoneroTxPriority.NORMAL)
     * @return {Promise<MoneroTxWallet>} the created transaction
     */
    sweepOutput(config: Partial<MoneroTxConfig>): Promise<MoneroTxWallet>;
    /**
     * Sweep all unlocked funds according to the given configuration.
     *
     * @param {Partial<MoneroTxConfig>} config - configures the transactions to create (required)
     * @param {string} config.address - single destination address (required)
     * @param {number} [config.accountIndex] - source account index to sweep from (optional, defaults to all accounts)
     * @param {number} [config.subaddressIndex] - source subaddress index to sweep from (optional, defaults to all subaddresses)
     * @param {number[]} [config.subaddressIndices] - source subaddress indices to sweep from (optional)
     * @param {boolean} [config.relay] - relay the transactions to peers to commit to the blockchain (default false)
     * @param {MoneroTxPriority} [config.priority] - transaction priority (default MoneroTxPriority.NORMAL)
     * @param {bigint|string} [config.unlockTime] - minimum height or timestamp for the transactions to unlock (default 0)
     * @param {boolean} [config.sweepEachSubaddress] - sweep each subaddress individually if true (default false)
     * @return {Promise<MoneroTxWallet[]>} the created transactions
     */
    sweepUnlocked(config: Partial<MoneroTxConfig>): Promise<MoneroTxWallet[]>;
    /**
     * <p>Sweep all unmixable dust outputs back to the wallet to make them easier to spend and mix.</p>
     *
     * <p>NOTE: Dust only exists pre RCT, so this method will throw "no dust to sweep" on new wallets.</p>
     *
     * @param {boolean} [relay] - specifies if the resulting transaction should be relayed (default false)
     * @return {Promise<MoneroTxWallet[]>} the created transactions
     */
    sweepDust(relay?: boolean): Promise<MoneroTxWallet[]>;
    /**
     * Relay a previously created transaction.
     *
     * @param {(MoneroTxWallet | string)} txOrMetadata - transaction or its metadata to relay
     * @return {Promise<string>} the hash of the relayed tx
     */
    relayTx(txOrMetadata: MoneroTxWallet | string): Promise<string>;
    /**
     * Relay previously created transactions.
     *
     * @param {(MoneroTxWallet[] | string[])} txsOrMetadatas - transactions or their metadata to relay
     * @return {Promise<string[]>} the hashes of the relayed txs
     */
    relayTxs(txsOrMetadatas: (MoneroTxWallet | string)[]): Promise<string[]>;
    /**
     * Describe a tx set from unsigned tx hex.
     *
     * @param {string} unsignedTxHex - unsigned tx hex
     * @return {Promise<MoneroTxSet>} the tx set containing structured transactions
     */
    describeUnsignedTxSet(unsignedTxHex: string): Promise<MoneroTxSet>;
    /**
     * Describe a tx set from multisig tx hex.
     *
     * @param {string} multisigTxHex - multisig tx hex
     * @return {Promise<MoneroTxSet>} the tx set containing structured transactions
     */
    describeMultisigTxSet(multisigTxHex: string): Promise<MoneroTxSet>;
    /**
     * Describe a tx set containing unsigned or multisig tx hex to a new tx set containing structured transactions.
     *
     * @param {MoneroTxSet} txSet - a tx set containing unsigned or multisig tx hex
     * @return {Promise<MoneroTxSet>} txSet - the tx set containing structured transactions
     */
    describeTxSet(txSet: MoneroTxSet): Promise<MoneroTxSet>;
    /**
     * Sign unsigned transactions from a view-only wallet.
     *
     * @param {string} unsignedTxHex - unsigned transaction hex from when the transactions were created
     * @return {Promise<MoneroTxSet>} the signed transaction set
     */
    signTxs(unsignedTxHex: string): Promise<MoneroTxSet>;
    /**
     * Submit signed transactions from a view-only wallet.
     *
     * @param {string} signedTxHex - signed transaction hex from signTxs()
     * @return {Promise<string[]>} the resulting transaction hashes
     */
    submitTxs(signedTxHex: string): Promise<string[]>;
    /**
     * Sign a message.
     *
     * @param {string} message - the message to sign
     * @param {MoneroMessageSignatureType} [signatureType] - sign with spend key or view key (default spend key)
     * @param {number} [accountIdx] - the account index of the message signature (default 0)
     * @param {number} [subaddressIdx] - the subaddress index of the message signature (default 0)
     * @return {Promise<string>} the signature
     */
    signMessage(message: string, signatureType?: MoneroMessageSignatureType, accountIdx?: number, subaddressIdx?: number): Promise<string>;
    /**
     * Verify a signature on a message.
     *
     * @param {string} message - signed message
     * @param {string} address - signing address
     * @param {string} signature - signature
     * @return {Promise<MoneroMessageSignatureResult>} true if the signature is good, false otherwise
     */
    verifyMessage(message: string, address: string, signature: string): Promise<MoneroMessageSignatureResult>;
    /**
     * Get a transaction's secret key from its hash.
     *
     * @param {string} txHash - transaction's hash
     * @return {Promise<string>} - transaction's secret key
     */
    getTxKey(txHash: string): Promise<string>;
    /**
     * Check a transaction in the blockchain with its secret key.
     *
     * @param {string} txHash - transaction to check
     * @param {string} txKey - transaction's secret key
     * @param {string} address - destination public address of the transaction
     * @return {romise<MoneroCheckTx>} the result of the check
     */
    checkTxKey(txHash: string, txKey: string, address: string): Promise<MoneroCheckTx>;
    /**
     * Get a transaction signature to prove it.
     *
     * @param {string} txHash - transaction to prove
     * @param {string} address - destination public address of the transaction
     * @param {string} [message] - message to include with the signature to further authenticate the proof (optional)
     * @return {Promise<string>} the transaction signature
     */
    getTxProof(txHash: string, address: string, message?: string): Promise<string>;
    /**
     * Prove a transaction by checking its signature.
     *
     * @param {string} txHash - transaction to prove
     * @param {string} address - destination public address of the transaction
     * @param {string | undefined} message - message included with the signature to further authenticate the proof
     * @param {string} signature  - transaction signature to confirm
     * @return {Promise<MoneroCheckTx>} the result of the check
     */
    checkTxProof(txHash: string, address: string, message: string | undefined, signature: string): Promise<MoneroCheckTx>;
    /**
     * Generate a signature to prove a spend. Unlike proving a transaction, it does not require the destination public address.
     *
     * @param {string} txHash - transaction to prove
     * @param {string} [message] - message to include with the signature to further authenticate the proof (optional)
     * @return {Promise<string>} the transaction signature
     */
    getSpendProof(txHash: string, message?: string): Promise<string>;
    /**
     * Prove a spend using a signature. Unlike proving a transaction, it does not require the destination public address.
     *
     * @param {string} txHash - transaction to prove
     * @param {string | undefined} message - message included with the signature to further authenticate the proof (optional)
     * @param {string} signature - transaction signature to confirm
     * @return {Promise<boolean>} true if the signature is good, false otherwise
     */
    checkSpendProof(txHash: string, message: string | undefined, signature: string): Promise<boolean>;
    /**
     * Generate a signature to prove the entire balance of the wallet.
     *
     * @param {string} [message] - message included with the signature to further authenticate the proof (optional)
     * @return {Promise<string>} the reserve proof signature
     */
    getReserveProofWallet(message?: string): Promise<string>;
    /**
     * Generate a signature to prove an available amount in an account.
     *
     * @param {number} accountIdx - account to prove ownership of the amount
     * @param {bigint} amount - minimum amount to prove as available in the account
     * @param {string} [message] - message to include with the signature to further authenticate the proof (optional)
     * @return {Promise<string>} the reserve proof signature
     */
    getReserveProofAccount(accountIdx: number, amount: bigint, message?: string): Promise<string>;
    /**
     * Proves a wallet has a disposable reserve using a signature.
     *
     * @param {string} address - public wallet address
     * @param {string | undefined} message - message included with the signature to further authenticate the proof (optional)
     * @param {string} signature - reserve proof signature to check
     * @return {Promise<MoneroCheckReserve>} the result of checking the signature proof
     */
    checkReserveProof(address: string, message: string | undefined, signature: string): Promise<MoneroCheckReserve>;
    /**
     * Get a transaction note.
     *
     * @param {string} txHash - transaction to get the note of
     * @return {Promise<string>} the tx note
     */
    getTxNote(txHash: string): Promise<string>;
    /**
     * Get notes for multiple transactions.
     *
     * @param {string[]} txHashes - hashes of the transactions to get notes for
     * @return {Promise<string[]>} notes for the transactions
     */
    getTxNotes(txHashes: string[]): Promise<string[]>;
    /**
     * Set a note for a specific transaction.
     *
     * @param {string} txHash - hash of the transaction to set a note for
     * @param {string} note - the transaction note
     * @return {Promise<void>}
     */
    setTxNote(txHash: string, note: string): Promise<void>;
    /**
     * Set notes for multiple transactions.
     *
     * @param {string[]} txHashes - transactions to set notes for
     * @param {string[]} notes - notes to set for the transactions
     * @return {Promise<void>}
     */
    setTxNotes(txHashes: string[], notes: string[]): Promise<void>;
    /**
     * Get address book entries.
     *
     * @param {number[]} [entryIndices] - indices of the entries to get
     * @return {Promise<MoneroAddressBookEntry[]>} the address book entries
     */
    getAddressBookEntries(entryIndices?: number[]): Promise<MoneroAddressBookEntry[]>;
    /**
     * Add an address book entry.
     *
     * @param {string} address - entry address
     * @param {string} [description] - entry description (optional)
     * @return {Promise<number>} the index of the added entry
     */
    addAddressBookEntry(address: string, description?: string): Promise<number>;
    /**
     * Edit an address book entry.
     *
     * @param {number} index - index of the address book entry to edit
     * @param {boolean} setAddress - specifies if the address should be updated
     * @param {string | undefined} address - updated address
     * @param {boolean} setDescription - specifies if the description should be updated
     * @param {string | undefined} description - updated description
     * @return {Promise<void>}
     */
    editAddressBookEntry(index: number, setAddress: boolean, address: string | undefined, setDescription: boolean, description: string | undefined): Promise<void>;
    /**
     * Delete an address book entry.
     *
     * @param {number} entryIdx - index of the entry to delete
     * @return {Promise<void>}
     */
    deleteAddressBookEntry(entryIdx: number): Promise<void>;
    /**
     * Tag accounts.
     *
     * @param {string} tag - tag to apply to the specified accounts
     * @param {number[]} accountIndices - indices of the accounts to tag
     * @return {Promise<void>}
     */
    tagAccounts(tag: string, accountIndices: number[]): Promise<void>;
    /**
     * Untag accounts.
     *
     * @param {number[]} accountIndices - indices of the accounts to untag
     * @return {Promise<void>}
     */
    untagAccounts(accountIndices: number[]): Promise<void>;
    /**
     * Return all account tags.
     *
     * @return {Promise<MoneroAccountTag[]>} the wallet's account tags
     */
    getAccountTags(): Promise<MoneroAccountTag[]>;
    /**
     * Sets a human-readable description for a tag.
     *
     * @param {string} tag - tag to set a description for
     * @param {string} label - label to set for the tag
     * @return {Promise<void>}
     */
    setAccountTagLabel(tag: string, label: string): Promise<void>;
    /**
     * Creates a payment URI from a send configuration.
     *
     * @param {MoneroTxConfig} config - specifies configuration for a potential tx
     * @return {Promise<string>} the payment uri
     */
    getPaymentUri(config: MoneroTxConfig): Promise<string>;
    /**
     * Parses a payment URI to a tx config.
     *
     * @param {string} uri - payment uri to parse
     * @return {Promise<MoneroTxConfig>} the send configuration parsed from the uri
     */
    parsePaymentUri(uri: string): Promise<MoneroTxConfig>;
    /**
     * Get an attribute.
     *
     * @param {string} key - attribute to get the value of
     * @return {Promise<string>} the attribute's value
     */
    getAttribute(key: string): Promise<string>;
    /**
     * Set an arbitrary attribute.
     *
     * @param {string} key - attribute key
     * @param {string} val - attribute value
     * @return {Promise<void>}
     */
    setAttribute(key: string, val: string): Promise<void>;
    /**
     * Start mining.
     *
     * @param {number} [numThreads] - number of threads created for mining (optional)
     * @param {boolean} [backgroundMining] - specifies if mining should occur in the background (optional)
     * @param {boolean} [ignoreBattery] - specifies if the battery should be ignored for mining (optional)
     * @return {Promise<void>}
     */
    startMining(numThreads: number, backgroundMining?: boolean, ignoreBattery?: boolean): Promise<void>;
    /**
     * Stop mining.
     *
     * @return {Promise<void>}
     */
    stopMining(): Promise<void>;
    /**
     * Indicates if importing multisig data is needed for returning a correct balance.
     *
     * @return {Promise<boolean>} true if importing multisig data is needed for returning a correct balance, false otherwise
     */
    isMultisigImportNeeded(): Promise<boolean>;
    /**
     * Indicates if this wallet is a multisig wallet.
     *
     * @return {Promise<boolean>} true if this is a multisig wallet, false otherwise
     */
    isMultisig(): Promise<boolean>;
    /**
     * Get multisig info about this wallet.
     *
     * @return {Promise<MoneroMultisigInfo>} multisig info about this wallet
     */
    getMultisigInfo(): Promise<MoneroMultisigInfo>;
    /**
     * Get multisig info as hex to share with participants to begin creating a
     * multisig wallet.
     *
     * @return {Promise<string>} this wallet's multisig hex to share with participants
     */
    prepareMultisig(): Promise<string>;
    /**
     * Make this wallet multisig by importing multisig hex from participants.
     *
     * @param {string[]} multisigHexes - multisig hex from each participant
     * @param {number} threshold - number of signatures needed to sign transfers
     * @param {string} password - wallet password
     * @return {Promise<string>} this wallet's multisig hex to share with participants
     */
    makeMultisig(multisigHexes: string[], threshold: number, password: string): Promise<string>;
    /**
     * Exchange multisig hex with participants in a M/N multisig wallet.
     *
     * This process must be repeated with participants exactly N-M times.
     *
     * @param {string[]} multisigHexes are multisig hex from each participant
     * @param {string} password - wallet's password // TODO monero-project: redundant? wallet is created with password
     * @return {Promise<MoneroMultisigInitResult>} the result which has the multisig's address xor this wallet's multisig hex to share with participants iff not done
     */
    exchangeMultisigKeys(multisigHexes: string[], password: string): Promise<MoneroMultisigInitResult>;
    /**
     * Export this wallet's multisig info as hex for other participants.
     *
     * @return {Promise<string>} this wallet's multisig info as hex for other participants
     */
    exportMultisigHex(): Promise<string>;
    /**
     * Import multisig info as hex from other participants.
     *
     * @param {string[]} multisigHexes - multisig hex from each participant
     * @return {Promise<number>} the number of outputs signed with the given multisig hex
     */
    importMultisigHex(multisigHexes: string[]): Promise<number>;
    /**
     * Sign multisig transactions from a multisig wallet.
     *
     * @param {string} multisigTxHex - unsigned multisig transactions as hex
     * @return {MoneroMultisigSignResult} the result of signing the multisig transactions
     */
    signMultisigTxHex(multisigTxHex: string): Promise<MoneroMultisigSignResult>;
    /**
     * Submit signed multisig transactions from a multisig wallet.
     *
     * @param {string} signedMultisigTxHex - signed multisig hex returned from signMultisigTxHex()
     * @return {Promise<string[]>} the resulting transaction hashes
     */
    submitMultisigTxHex(signedMultisigTxHex: string): Promise<string[]>;
    /**
     * Change the wallet password.
     *
     * @param {string} oldPassword - the wallet's old password
     * @param {string} newPassword - the wallet's new password
     * @return {Promise<void>}
     */
    changePassword(oldPassword: string, newPassword: string): Promise<void>;
    /**
     * Save the wallet at its current path.
     *
     * @return {Promise<void>}
     */
    save(): Promise<void>;
    /**
     * Optionally save then close the wallet.
     *
     * @param {boolean} [save] - specifies if the wallet should be saved before being closed (default false)
     * @return {Promise<void>}
     */
    close(save?: boolean): Promise<void>;
    /**
     * Indicates if this wallet is closed or not.
     *
     * @return {Promise<boolean>} true if the wallet is closed, false otherwise
     */
    isClosed(): Promise<boolean>;
    /**
     * @private
     */
    announceSyncProgress(height: number, startHeight: number, endHeight: number, percentDone: number, message: string): Promise<void>;
    /**
     * @private
     */
    announceNewBlock(height: number): Promise<void>;
    /**
     * @private
     */
    announceBalancesChanged(newBalance: bigint, newUnlockedBalance: bigint): Promise<void>;
    /**
     * @private
     */
    announceOutputReceived(output: MoneroOutputWallet): Promise<void>;
    /**
     * @private
     */
    announceOutputSpent(output: MoneroOutputWallet): Promise<void>;
    protected static normalizeTxQuery(query: any): MoneroTxQuery;
    protected static normalizeTransferQuery(query: any): MoneroTransferQuery;
    protected static normalizeOutputQuery(query: any): MoneroOutputQuery;
    protected static normalizeCreateTxsConfig(config: any): MoneroTxConfig;
    protected static normalizeSweepOutputConfig(config: any): MoneroTxConfig;
    protected static normalizeSweepUnlockedConfig(config: any): MoneroTxConfig;
}
