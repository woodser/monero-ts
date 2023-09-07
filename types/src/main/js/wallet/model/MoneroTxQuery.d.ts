export = MoneroTxQuery;
/**
 * <p>Configuration to query transactions.</p>
 *
 * @class
 * @extends {MoneroTxWallet}
 */
declare class MoneroTxQuery extends MoneroTxWallet {
    /**
     * <p>Construct the transaction query.</p>
     *
     * <p>Example:</p>
     *
     * <code>
     * &sol;&sol; get transactions with unlocked incoming transfers to account 0<br>
     * let txs = await wallet.getTxs({<br>
     * &nbsp;&nbsp; isLocked: false,<br>
     * &nbsp;&nbsp; transferQuery: {<br>
     * &nbsp;&nbsp;&nbsp;&nbsp; isIncoming: true,<br>
     * &nbsp;&nbsp;&nbsp;&nbsp; accountIndex: 0<br>
     * &nbsp;&nbsp; }<br>
     * });
     * </code>
     *
     * <p>All configuration is optional.  All transactions are returned except those that don't meet criteria defined in this query.</p>
     *
     * @param {object} config - tx query configuration
     * @param {string} config.hash - get a tx with this hash
     * @param {string[]} config.txHashes - get txs with these hashes
     * @param {int} config.height - get txs with this height
     * @param {int} config.minHeight - get txs with height greater than or equal to this height
     * @param {int} config.maxHeight - get txs with height less than or equal to this height
     * @param {boolean} config.isConfirmed - get confirmed or unconfirmed txs
     * @param {boolean} config.inTxPool - get txs in or out of the tx pool
     * @param {boolean} config.relay - get txs with the same relay status
     * @param {boolean} config.isRelayed - get relayed or non-relayed txs
     * @param {boolean} config.isFailed - get failed or non-failed txs
     * @param {boolean} config.isMinerTx - get miner or non-miner txs
     * @param {boolean} config.isLocked - get locked or unlocked txs
     * @param {boolean} config.isIncoming - get txs with or without incoming transfers
     * @param {boolean} config.isOutgoing - get txs with or without outgoing transfers
     * @param {string} config.paymentId - get txs with this payment ID
     * @param {string} config.paymentIds - get txs with a payment ID among these payment IDs
     * @param {boolean} config.hasPaymentId - get txs with or without payment IDs
     * @param {object|MoneroTransferQuery} config.transferQuery - get txs with transfers matching this transfer query
     * @param {object|MoneroOutputQuery} config.inputQuery - get txs with inputs matching this input query
     * @param {object|MoneroOutputQuery} config.outputQuery - get txs with outputs matching this output query
     */
    constructor(config: {
        hash: string;
        txHashes: string[];
        height: int;
        minHeight: int;
        maxHeight: int;
        isConfirmed: boolean;
        inTxPool: boolean;
        relay: boolean;
        isRelayed: boolean;
        isFailed: boolean;
        isMinerTx: boolean;
        isLocked: boolean;
        isIncoming: boolean;
        isOutgoing: boolean;
        paymentId: string;
        paymentIds: string;
        hasPaymentId: boolean;
        transferQuery: object | MoneroTransferQuery;
        inputQuery: object | MoneroOutputQuery;
        outputQuery: object | MoneroOutputQuery;
    });
    copy(): MoneroTxQuery;
    setIsIncoming(isIncoming: any): this;
    setIsOutgoing(isOutgoing: any): this;
    getHashes(): any;
    setHashes(hashes: any): this;
    setHash(hash: any): this;
    hasPaymentId(): any;
    setHasPaymentId(): this;
    getPaymentIds(): any;
    setPaymentIds(paymentIds: any): this;
    setPaymentId(paymentId: any): this;
    setHeight(height: any): this;
    getMinHeight(): any;
    setMinHeight(minHeight: any): this;
    getMaxHeight(): any;
    setMaxHeight(maxHeight: any): this;
    getIncludeOutputs(): any;
    setIncludeOutputs(includeOutputs: any): this;
    getTransferQuery(): any;
    setTransferQuery(transferQuery: any): this;
    getInputQuery(): any;
    setInputQuery(inputQuery: any): this;
    getOutputQuery(): any;
    setOutputQuery(outputQuery: any): this;
    meetsCriteria(tx: any, queryChildren: any): boolean;
}
import MoneroTxWallet = require("./MoneroTxWallet");
import MoneroTransferQuery = require("./MoneroTransferQuery");
import MoneroOutputQuery = require("./MoneroOutputQuery");
