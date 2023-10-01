import MoneroTxWallet from "./MoneroTxWallet";
/**
 * Groups transactions who share common hex data which is needed in order to
 * sign and submit the transactions.
 *
 * For example, multisig transactions created from createTxs() share a common
 * hex string which is needed in order to sign and submit the multisig
 * transactions.
 */
export default class MoneroTxSet {
    txs: MoneroTxWallet[];
    multisigTxHex: string;
    unsignedTxHex: string;
    signedTxHex: string;
    constructor(txSet?: Partial<MoneroTxSet>);
    toJson(): {} & this;
    getTxs(): MoneroTxWallet[];
    setTxs(txs: any): this;
    getMultisigTxHex(): string;
    setMultisigTxHex(multisigTxHex: any): this;
    getUnsignedTxHex(): string;
    setUnsignedTxHex(unsignedTxHex: any): this;
    getSignedTxHex(): string;
    setSignedTxHex(signedTxHex: any): this;
    merge(txSet: any): this;
    toString(indent?: number): string;
}
