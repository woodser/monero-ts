export = MoneroMinerTxSum;
/**
 * Model for the summation of miner emissions and fees.
 */
declare class MoneroMinerTxSum {
    constructor(state: any);
    state: any;
    toJson(): any;
    getEmissionSum(): any;
    setEmissionSum(emissionSum: any): this;
    getFeeSum(): any;
    setFeeSum(feeSum: any): this;
}
