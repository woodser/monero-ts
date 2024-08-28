/**
 * Models the result from submitting a tx to a daemon.
 */
export default class MoneroSubmitTxResult {
    isGood: boolean;
    isRelayed: boolean;
    isDoubleSpendSeen: boolean;
    isFeeTooLow: boolean;
    isMixinTooLow: boolean;
    hasInvalidInput: boolean;
    hasInvalidOutput: boolean;
    hasTooFewOutputs: boolean;
    isOverspend: boolean;
    reason: string;
    isTooBig: boolean;
    sanityCheckFailed: boolean;
    credits: bigint;
    topBlockHash: string;
    isTxExtraTooBig: boolean;
    isNonzeroUnlockTime: boolean;
    constructor(result?: Partial<MoneroSubmitTxResult>);
    toJson(): any;
    getIsGood(): boolean;
    setIsGood(isGood: boolean): MoneroSubmitTxResult;
    getIsRelayed(): boolean;
    setIsRelayed(isRelayed: boolean): this;
    getIsDoubleSpendSeen(): boolean;
    setIsDoubleSpendSeen(isDoubleSpendSeen: boolean): MoneroSubmitTxResult;
    getIsFeeTooLow(): boolean;
    setIsFeeTooLow(isFeeTooLow: boolean): MoneroSubmitTxResult;
    getIsMixinTooLow(): boolean;
    setIsMixinTooLow(isMixinTooLow: boolean): MoneroSubmitTxResult;
    getHasInvalidInput(): boolean;
    setHasInvalidInput(hasInvalidInput: boolean): MoneroSubmitTxResult;
    getHasInvalidOutput(): boolean;
    setHasInvalidOutput(hasInvalidOutput: boolean): MoneroSubmitTxResult;
    getHasTooFewOutputs(): boolean;
    setHasTooFewOutputs(hasTooFewOutputs: boolean): MoneroSubmitTxResult;
    getIsOverspend(): boolean;
    setIsOverspend(isOverspend: boolean): MoneroSubmitTxResult;
    getReason(): string;
    setReason(reason: any): MoneroSubmitTxResult;
    getIsTooBig(): boolean;
    setIsTooBig(isTooBig: boolean): this;
    getSanityCheckFailed(): boolean;
    setSanityCheckFailed(sanityCheckFailed: any): MoneroSubmitTxResult;
    getCredits(): bigint;
    setCredits(credits: any): MoneroSubmitTxResult;
    getTopBlockHash(): string;
    setTopBlockHash(topBlockHash: string): MoneroSubmitTxResult;
    getIsTxExtraTooBig(): boolean;
    setIsTxExtraTooBig(isTxExtraTooBig: boolean): MoneroSubmitTxResult;
    getIsNonzeroUnlockTime(): boolean;
    setIsNonzeroUnlockTime(isNonzeroUnlockTime: boolean): MoneroSubmitTxResult;
}
