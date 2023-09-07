export = MoneroKeyImageImportResult;
/**
 * Models results from importing key images.
 */
declare class MoneroKeyImageImportResult {
    constructor(state: any);
    state: any;
    toJson(): any;
    getHeight(): any;
    setHeight(height: any): this;
    getSpentAmount(): any;
    setSpentAmount(spentAmount: any): this;
    getUnspentAmount(): any;
    setUnspentAmount(unspentAmount: any): this;
}
