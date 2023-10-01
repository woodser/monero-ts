/**
 * Models information about a multisig wallet.
 */
export default class MoneroMultisigInfo {
    isMultisig: boolean;
    isReady: boolean;
    threshold: number;
    numParticipants: number;
    constructor(multisigInfo?: Partial<MoneroMultisigInfo>);
    toJson(): any;
    getIsMultisig(): boolean;
    setIsMultisig(isMultisig: boolean): MoneroMultisigInfo;
    getIsReady(): boolean;
    setIsReady(isReady: boolean): MoneroMultisigInfo;
    getThreshold(): number;
    setThreshold(threshold: number): MoneroMultisigInfo;
    getNumParticipants(): number;
    setNumParticipants(numParticipants: number): MoneroMultisigInfo;
}
