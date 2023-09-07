export = MoneroFeeEstimate;
/**
 * Models a Monero fee estimate.
 */
declare class MoneroFeeEstimate {
    /**
     * Construct the model.
     *
     * @param {MoneroFeeEstimate|object} state - MoneroFeeEstimate or JS object
     */
    constructor(state: MoneroFeeEstimate | object);
    state: any;
    getFee(): any;
    setFee(fee: any): this;
    getFees(): any;
    setFees(fees: any): this;
    getQuantizationMask(): any;
    setQuantizationMask(quantizationMask: any): this;
    copy(): MoneroFeeEstimate;
    toJson(): any;
    toString(indent?: number): string;
}
