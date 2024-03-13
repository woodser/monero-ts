import MoneroKeyImage from "../../daemon/model/MoneroKeyImage";
import MoneroOutputWallet from "./MoneroOutputWallet";
import MoneroTx from "../../daemon/model/MoneroTx";
import MoneroTxQuery from "./MoneroTxQuery";
/**
 * Configuration to query wallet outputs.
 */
export default class MoneroOutputQuery extends MoneroOutputWallet {
    minAmount: bigint;
    maxAmount: bigint;
    txQuery: Partial<MoneroTxQuery>;
    subaddressIndices: number[];
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
     * &nbsp;&nbsp; minAmount: 750000n<br>
     * });
     * </code>
     *
     * <p>All configuration is optional.  All outputs are returned except those that don't meet criteria defined in this query.</p>
     *
     * @param {MoneroOutputQuery} [config] - output query configuration (optional)
     * @param {number} config.accountIndex - get outputs in this account index
     * @param {number} config.subaddressIndex - get outputs in this subaddress index
     * @param {number[]} config.subaddressIndices - get outputs in these subaddress indices
     * @param {bigint} config.amount - get outputs with this amount
     * @param {bigint} config.minAmount - get outputs with amount greater than or equal to this amount
     * @param {bigint} config.maxAmount - get outputs with amount less than or equal to this amount
     * @param {boolean} config.isSpent - get spent xor unspent outputs
     * @param {boolean} config.isFrozen - get frozen xor thawed outputs
     * @param {MoneroKeyImage} config.keyImage - get outputs with a key image matching fields defined in this key image
     * @param {string} config.keyImage.hex - get outputs with this key image hex
     * @param {string} config.keyImage.signature - get outputs with this key image signature
     * @param {MoneroTxQuery} config.txQuery - get outputs whose tx match this tx query
     */
    constructor(query?: Partial<MoneroOutputQuery>);
    copy(): MoneroOutputQuery;
    toJson(): any;
    getMinAmount(): bigint;
    setMinAmount(minAmount: bigint): MoneroOutputQuery;
    getMaxAmount(): bigint;
    setMaxAmount(maxAmount: bigint): MoneroOutputQuery;
    getTxQuery(): MoneroTxQuery;
    setTxQuery(txQuery: MoneroTxQuery): MoneroOutputQuery;
    getSubaddressIndices(): number[];
    setSubaddressIndices(subaddressIndices: number[]): MoneroOutputQuery;
    meetsCriteria(output: MoneroOutputWallet, queryParent?: boolean): boolean;
    setTx(tx: MoneroTx): MoneroOutputQuery;
    setAccountIndex(accountIndex: number): MoneroOutputQuery;
    setSubaddressIndex(subaddressIndex: number): MoneroOutputQuery;
    setIsSpent(isSpent: boolean): MoneroOutputQuery;
    setIsFrozen(isFrozen: boolean): MoneroOutputQuery;
    setKeyImage(keyImage: MoneroKeyImage): MoneroOutputQuery;
    setAmount(amount: bigint): MoneroOutputQuery;
    setIndex(index: number): MoneroOutputQuery;
    setRingOutputIndices(ringOutputIndices: number[]): MoneroOutputQuery;
    setStealthPublicKey(stealthPublicKey: string): MoneroOutputQuery;
}
