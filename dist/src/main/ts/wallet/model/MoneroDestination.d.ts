/**
 * Models an outgoing transfer destination.
 */
export default class MoneroDestination {
    /** Destination address to send funds to. */
    address: string;
    /** Amount to send to destination address. */
    amount: bigint;
    /**
     * Construct a destination to send funds to.
     *
     * @param {Partial<MoneroDestination>|string} destinationOrAddress is a MoneroDestination or hex string to initialize from (optional)
     * @param {bigint} [amount] - the destination amount
     */
    constructor(destinationOrAddress?: Partial<MoneroDestination> | string, amount?: bigint);
    getAddress(): string;
    setAddress(address: string | undefined): MoneroDestination;
    getAmount(): bigint;
    setAmount(amount: bigint): MoneroDestination;
    copy(): MoneroDestination;
    toJson(): any;
    toString(indent?: number): string;
}
