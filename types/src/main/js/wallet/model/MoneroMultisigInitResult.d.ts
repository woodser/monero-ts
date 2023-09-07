export = MoneroMultisigInitResult;
/**
 * Models the result of initializing a multisig wallet which results in the
 * multisig wallet's address xor another multisig hex to share with
 * participants to create the wallet.
 */
declare class MoneroMultisigInitResult {
    constructor(state: any);
    state: any;
    toJson(): any;
    getAddress(): any;
    setAddress(address: any): this;
    getMultisigHex(): any;
    setMultisigHex(multisigHex: any): this;
}
