import MoneroDestination from "./MoneroDestination";
import MoneroTransfer from "./MoneroTransfer";
import MoneroTxWallet from "./MoneroTxWallet";
import MoneroTxQuery from "./MoneroTxQuery";
/**
 * Configuration to query wallet transfers.
 */
export default class MoneroTransferQuery extends MoneroTransfer {
    txQuery: Partial<MoneroTxQuery>;
    isIncoming: boolean;
    address: string;
    addresses: string[];
    subaddressIndex: number;
    subaddressIndices: number[];
    destinations: MoneroDestination[];
    hasDestinations: boolean;
    /**
     * <p>Construct the transfer query.</p>
     *
     * <p>Example:</p>
     *
     * <code>
     * &sol;&sol; get incoming transfers to account 0, subaddress 1<br>
     * let transfers = await wallet.getTransfers({<br>
     * &nbsp;&nbsp; accountIndex: 0,<br>
     * &nbsp;&nbsp; subaddressIndex: 0<br>
     * });
     * </code>
     *
     * <p>All configuration is optional.  All transfers are returned except those that don't meet criteria defined in this query.</p>
     *
     * @param {Partial<MoneroTransferQuery>} [query] - transfer query configuration (optional)
     * @param {bigint} query.amount - get transfers with this amount
     * @param {number} query.accountIndex - get transfers to/from this account index
     * @param {number} query.subaddressIndex - get transfers to/from this subaddress index
     * @param {number[]} query.subaddressIndices - get transfers to/from these subaddress indices
     * @param {string} query.address - get transfers to/from this wallet address
     * @param {string[]} query.addresses - get transfers to/from these wallet addresses
     * @param {boolean} query.isIncoming - get transfers which are incoming if true
     * @param {boolean} query.isOutgoing - get transfers which are outgoing if true
     * @param {boolean} query.hasDestinations - get transfers with known destinations if true (destinations are only stored locally with the wallet)
     * @param {MoneroTxQuery} query.txQuery - get transfers whose tx match this tx query
     */
    constructor(query?: Partial<MoneroTransferQuery>);
    copy(): MoneroTransferQuery;
    toJson(): any;
    getTxQuery(): MoneroTxQuery;
    setTxQuery(txQuery: MoneroTxQuery): MoneroTransferQuery;
    getIsIncoming(): boolean;
    setIsIncoming(isIncoming: boolean): MoneroTransferQuery;
    getIsOutgoing(): boolean;
    setIsOutgoing(isOutgoing: boolean): MoneroTransferQuery;
    getAddress(): string;
    setAddress(address: string): MoneroTransferQuery;
    getAddresses(): string[];
    setAddresses(addresses: string[]): MoneroTransferQuery;
    getSubaddressIndex(): number;
    setSubaddressIndex(subaddressIndex: number): MoneroTransferQuery;
    getSubaddressIndices(): number[];
    setSubaddressIndices(subaddressIndices: number[]): MoneroTransferQuery;
    getDestinations(): MoneroDestination[];
    setDestinations(destinations: MoneroDestination[]): this;
    getHasDestinations(): boolean;
    setHasDestinations(hasDestinations: boolean): MoneroTransferQuery;
    /**
     * Convenience method to query outputs by the locked state of their tx.
     *
     * @param isLocked specifies if the output's tx must be locked or unlocked (optional)
     * @return {MoneroOutputQuery} this query for chaining
     */
    setIsLocked(isLocked: boolean): MoneroTransferQuery;
    meetsCriteria(transfer: MoneroTransfer, queryParent?: boolean): boolean;
    validate(): void;
    setTx(tx: MoneroTxWallet): MoneroTransferQuery;
    setAmount(amount: bigint): MoneroTransferQuery;
    setAccountIndex(accountIndex: number): MoneroTransferQuery;
}
