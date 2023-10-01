/**
 * Base class for results from checking a transaction or reserve proof.
 */
export default class MoneroCheck {
    isGood?: boolean;
    constructor(check?: Partial<MoneroCheck>);
    getIsGood(): boolean;
    setIsGood(isGood: boolean): MoneroCheck;
}
