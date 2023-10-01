/**
 * Models the result of initializing a multisig wallet which results in the
 * multisig wallet's address xor another multisig hex to share with
 * participants to create the wallet.
 */
export default class MoneroMultisigInitResult {
    address: string;
    multisigHex: string;
    constructor(result?: Partial<MoneroMultisigInitResult>);
    toJson(): any;
    getAddress(): string;
    setAddress(address: string): MoneroMultisigInitResult;
    getMultisigHex(): string;
    setMultisigHex(multisigHex: string): MoneroMultisigInitResult;
}
