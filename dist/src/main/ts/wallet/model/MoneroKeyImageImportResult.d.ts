/**
 * Models results from importing key images.
 */
export default class MoneroKeyImageImportResult {
    height: number;
    spentAmount: bigint;
    unspentAmount: bigint;
    constructor(result?: Partial<MoneroKeyImageImportResult>);
    toJson(): any;
    getHeight(): number;
    setHeight(height: number): MoneroKeyImageImportResult;
    getSpentAmount(): bigint;
    setSpentAmount(spentAmount: bigint): MoneroKeyImageImportResult;
    getUnspentAmount(): bigint;
    setUnspentAmount(unspentAmount: bigint): MoneroKeyImageImportResult;
}
