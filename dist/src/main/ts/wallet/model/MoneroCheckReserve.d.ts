import MoneroCheck from "./MoneroCheck";
/**
 * Results from checking a reserve proof.
 */
export default class MoneroCheckReserve extends MoneroCheck {
    totalAmount: bigint;
    unconfirmedSpentAmount: bigint;
    constructor(check?: Partial<MoneroCheckReserve>);
    toJson(): any;
    getTotalAmount(): bigint;
    setTotalAmount(totalAmount: bigint): MoneroCheckReserve;
    getUnconfirmedSpentAmount(): bigint;
    setUnconfirmedSpentAmount(unconfirmedSpentAmount: bigint): MoneroCheckReserve;
}
