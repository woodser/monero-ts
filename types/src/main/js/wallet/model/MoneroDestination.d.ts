export = MoneroDestination;
/**
 * Models an outgoing transfer destination.
 */
declare class MoneroDestination {
    /**
     * Construct the model.
     *
     * @param {MoneroDestination|object|string} stateOrAddress is a MoneroDestination, JS object, or hex string to initialize from (optional)
     * @param {BigInteger|string} amount - the destination amount
     */
    constructor(stateOrAddress: MoneroDestination | object | string, amount: BigInteger | string);
    state: any;
    getAddress(): any;
    setAddress(address: any): this;
    getAmount(): any;
    setAmount(amount: any): this;
    copy(): MoneroDestination;
    toJson(): any;
    toString(indent?: number): string;
}
