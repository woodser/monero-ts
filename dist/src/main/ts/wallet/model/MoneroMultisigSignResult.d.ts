/**
 * Models the result of signing multisig tx hex.
 */
export default class MoneroMultisigSignResult {
    signedMultisigTxHex: string;
    txHashes: string[];
    constructor(result?: Partial<MoneroMultisigSignResult>);
    toJson(): any;
    getSignedMultisigTxHex(): string;
    setSignedMultisigTxHex(signedTxMultisigHex: string): MoneroMultisigSignResult;
    getTxHashes(): string[];
    setTxHashes(txHashes: string[]): MoneroMultisigSignResult;
}
