export = MoneroMultisigSignResult;
/**
 * Models the result of signing multisig tx hex.
 */
declare class MoneroMultisigSignResult {
    constructor(state: any);
    state: any;
    toJson(): any;
    getSignedMultisigTxHex(): any;
    setSignedMultisigTxHex(signedTxMultisigHex: any): void;
    getTxHashes(): any;
    setTxHashes(txHashes: any): void;
}
