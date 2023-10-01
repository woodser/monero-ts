/**
 * Model for the summation of miner emissions and fees.
 */
export default class MoneroMinerTxSum {
    emissionSum: bigint;
    feeSum: bigint;
    constructor(txSum?: Partial<MoneroMinerTxSum>);
    toJson(): any;
    getEmissionSum(): bigint;
    setEmissionSum(emissionSum: bigint): MoneroMinerTxSum;
    getFeeSum(): bigint;
    setFeeSum(feeSum: bigint): MoneroMinerTxSum;
}
