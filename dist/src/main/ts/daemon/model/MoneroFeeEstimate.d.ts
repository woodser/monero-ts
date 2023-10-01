/**
 * Models a Monero fee estimate.
 */
export default class MoneroFeeEstimate {
    fee: bigint;
    fees: bigint[];
    quantizationMask: bigint;
    constructor(feeEstimate?: Partial<MoneroFeeEstimate>);
    getFee(): bigint;
    setFee(fee: bigint): MoneroFeeEstimate;
    getFees(): bigint[];
    setFees(fees: any): this;
    getQuantizationMask(): bigint;
    setQuantizationMask(quantizationMask: any): MoneroFeeEstimate;
    copy(): MoneroFeeEstimate;
    toJson(): any;
    toString(indent?: number): string;
}
