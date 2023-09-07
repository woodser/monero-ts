export = MoneroSubmitTxResult;
/**
 * Models the result from submitting a tx to a daemon.
 */
declare class MoneroSubmitTxResult {
    constructor(state: any);
    state: any;
    toJson(): any;
    isGood(): any;
    setIsGood(isGood: any): this;
    isRelayed(): any;
    setIsRelayed(isRelayed: any): this;
    isDoubleSpendSeen(): any;
    setIsDoubleSpend(isDoubleSpendSeen: any): this;
    isFeeTooLow(): any;
    setIsFeeTooLow(isFeeTooLow: any): this;
    isMixinTooLow(): any;
    setIsMixinTooLow(isMixinTooLow: any): this;
    hasInvalidInput(): any;
    setHasInvalidInput(hasInvalidInput: any): this;
    hasInvalidOutput(): any;
    setHasInvalidOutput(hasInvalidOutput: any): this;
    hasTooFewOutputs(): any;
    setHasTooFewOutputs(hasTooFewOutputs: any): this;
    isOverspend(): any;
    setIsOverspend(isOverspend: any): this;
    getReason(): any;
    setReason(reason: any): this;
    isTooBig(): any;
    setIsTooBig(isTooBig: any): this;
    getSanityCheckFailed(): any;
    setSanityCheckFailed(sanityCheckFailed: any): this;
    getCredits(): any;
    setCredits(credits: any): this;
    getTopBlockHash(): any;
    setTopBlockHash(topBlockHash: any): this;
    isTxExtraTooBig(): any;
    setIsTxExtraTooBig(isTxExtraTooBig: any): this;
}
