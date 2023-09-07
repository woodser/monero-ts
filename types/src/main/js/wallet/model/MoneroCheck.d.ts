export = MoneroCheck;
/**
 * Base class for results from checking a transaction or reserve proof.
 *
 * @class
 */
declare class MoneroCheck {
    constructor(state: any);
    state: any;
    isGood(): any;
    setIsGood(isGood: any): this;
}
