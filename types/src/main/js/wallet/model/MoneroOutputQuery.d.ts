export = MoneroOutputQuery;
/**
 * Configuration to query wallet outputs.
 *
 * @extends {MoneroOutputWallet}
 */
declare class MoneroOutputQuery extends MoneroOutputWallet {
    /**
     * <p>Construct the output query.</p>
     *
     * <p>Example:</p>
     *
     * <code>
     * &sol;&sol; get available outputs in account 0 with a minimum amount<br>
     * let outputs = await wallet.getOutputs({<br>
     * &nbsp;&nbsp; isSpent: false,<br>
     * &nbsp;&nbsp; isLocked: false,<br>
     * &nbsp;&nbsp; accountIndex: 0,<br>
     * &nbsp;&nbsp; minAmount: new BigInteger("750000")<br>
     * });
     * </code>
     *
     * <p>All configuration is optional.  All outputs are returned except those that don't meet criteria defined in this query.</p>
     *
     * @param {object} config - output query configuration (optional)
     * @param {int} config.accountIndex - get outputs in this account index
     * @param {int} config.subaddressIndex - get outputs in this subaddress index
     * @param {int[]} config.subaddressIndices - get outputs in these subaddress indices
     * @param {BigInteger} config.amount - get outputs with this amount
     * @param {BigInteger} config.minAmount - get outputs with amount greater than or equal to this amount
     * @param {BigInteger} config.maxAmount - get outputs with amount less than or equal to this amount
     * @param {boolean} config.isSpent - get spent xor unspent outputs
     * @param {boolean} config.isFrozen - get frozen xor thawed outputs
     * @param {object|MoneroKeyImage} config.keyImage - get outputs with a key image matching fields defined in this key image
     * @param {string} config.keyImage.hex - get outputs with this key image hex
     * @param {string} config.keyImage.signature - get outputs with this key image signature
     * @param {object|MoneroTxQuery} config.txQuery - get outputs whose tx match this tx query
     */
    constructor(config: {
        accountIndex: int;
        subaddressIndex: int;
        subaddressIndices: int[];
        amount: BigInteger;
        minAmount: BigInteger;
        maxAmount: BigInteger;
        isSpent: boolean;
        isFrozen: boolean;
        keyImage: object | MoneroKeyImage;
    });
    copy(): MoneroOutputQuery;
    getMinAmount(): any;
    setMinAmount(minAmount: any): this;
    getMaxAmount(): any;
    setMaxAmount(maxAmount: any): this;
    getTxQuery(): any;
    setTxQuery(txQuery: any): this;
    getSubaddressIndices(): any;
    setSubaddressIndices(subaddressIndices: any): this;
    meetsCriteria(output: any, queryParent: any): boolean;
}
declare namespace MoneroOutputQuery {
    let _EMPTY_OUTPUT: MoneroOutputWallet;
}
import MoneroOutputWallet = require("./MoneroOutputWallet");
