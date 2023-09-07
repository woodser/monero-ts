export = MoneroTransferQuery;
/**
 * Configuration to query wallet transfers.
 *
 * @extends {MoneroTransfer}
 */
declare class MoneroTransferQuery extends MoneroTransfer {
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
     * @param {object} config - transfer query configuration (optional)
     * @param {BigInteger} config.amount - get transfers with this amount
     * @param {int} config.accountIndex - get transfers to/from this account index
     * @param {int} config.subaddressIndex - get transfers to/from this subaddress index
     * @param {int[]} config.subaddressIndices - get transfers to/from these subaddress indices
     * @param {string} config.address - get transfers to/from this wallet address
     * @param {string[]} config.addresses - get transfers to/from these wallet addresses
     * @param {boolean} config.isIncoming - get transfers which are incoming if true
     * @param {boolean} config.isOutgoing - get transfers which are outgoing if true
     * @param {boolean} config.hasDestinations - get transfers with known destinations if true (destinations are only stored locally with the wallet)
     * @param {object|MoneroTxQuery} config.txQuery - get transfers whose tx match this tx query
     */
    constructor(config: {
        amount: BigInteger;
        accountIndex: int;
        subaddressIndex: int;
        subaddressIndices: int[];
        address: string;
        addresses: string[];
        isIncoming: boolean;
        isOutgoing: boolean;
        hasDestinations: boolean;
        txQuery: any;
    });
    copy(): MoneroTransferQuery;
    getTxQuery(): any;
    setTxQuery(txQuery: any): this;
    isIncoming(): any;
    setIsIncoming(isIncoming: any): this;
    setIsOutgoing(isOutgoing: any): this;
    getAddress(): any;
    setAddress(address: any): this;
    getAddresses(): any;
    setAddresses(addresses: any): this;
    getSubaddressIndex(): any;
    setSubaddressIndex(subaddressIndex: any): this;
    getSubaddressIndices(): any;
    setSubaddressIndices(subaddressIndices: any): this;
    getDestinations(): any;
    setDestinations(destinations: any): this;
    hasDestinations(): any;
    setHasDestinations(hasDestinations: any): this;
    /**
     * Convenience method to query outputs by the locked state of their tx.
     *
     * @param isLocked specifies if the output's tx must be locked or unlocked (optional)
     * @return {MoneroOutputQuery} this query for chaining
     */
    setIsLocked(isLocked: any): MoneroOutputQuery;
    meetsCriteria(transfer: any, queryParent: any): boolean;
}
import MoneroTransfer = require("./MoneroTransfer");
