export = MoneroMultisigInfo;
/**
 * Models information about a multisig wallet.
 */
declare class MoneroMultisigInfo {
    constructor(state: any);
    state: any;
    toJson(): any;
    isMultisig(): any;
    setIsMultisig(isMultisig: any): this;
    isReady(): any;
    setIsReady(isReady: any): void;
    getThreshold(): any;
    setThreshold(threshold: any): void;
    getNumParticipants(): any;
    setNumParticipants(numParticipants: any): void;
}
