export = MoneroTxSet;
/**
 * Groups transactions who share common hex data which is needed in order to
 * sign and submit the transactions.
 *
 * For example, multisig transactions created from createTxs() share a common
 * hex string which is needed in order to sign and submit the multisig
 * transactions.
 */
declare class MoneroTxSet {
    constructor(state: any);
    state: any;
    toJson(): any;
    getTxs(): any;
    setTxs(txs: any): this;
    getMultisigTxHex(): any;
    setMultisigTxHex(multisigTxHex: any): this;
    getUnsignedTxHex(): any;
    setUnsignedTxHex(unsignedTxHex: any): this;
    getSignedTxHex(): any;
    setSignedTxHex(signedTxHex: any): this;
    merge(txSet: any): this;
    toString(indent?: number): string;
}
