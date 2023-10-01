import MoneroDestination from "./MoneroDestination";
import MoneroTransfer from "./MoneroTransfer";
import MoneroTxWallet from "./MoneroTxWallet";
/**
 * Models an outgoing transfer of funds from the wallet.
 */
export default class MoneroOutgoingTransfer extends MoneroTransfer {
    subaddressIndices: number[];
    addresses: string[];
    destinations: MoneroDestination[];
    /**
     * Construct the model.
     *
     * @param {MoneroOutgoingTranser [transfer] existing state to initialize from (optional)
     */
    constructor(transfer?: Partial<MoneroOutgoingTransfer>);
    getIsIncoming(): boolean;
    getSubaddressIndices(): number[];
    setSubaddressIndices(subaddressIndices: number[]): MoneroOutgoingTransfer;
    getAddresses(): string[];
    setAddresses(addresses: string[]): MoneroOutgoingTransfer;
    getDestinations(): MoneroDestination[];
    setDestinations(destinations: MoneroDestination[]): MoneroOutgoingTransfer;
    copy(): MoneroOutgoingTransfer;
    toJson(): any;
    /**
     * Updates this transaction by merging the latest information from the given
     * transaction.
     *
     * Merging can modify or build references to the transfer given so it
     * should not be re-used or it should be copied before calling this method.
     *
     * @param transfer is the transfer to merge into this one
     */
    merge(transfer: MoneroOutgoingTransfer): MoneroOutgoingTransfer;
    toString(indent?: number): string;
    setTx(tx: MoneroTxWallet): MoneroOutgoingTransfer;
    setAmount(amount: bigint): MoneroOutgoingTransfer;
    setAccountIndex(accountIndex: number): MoneroOutgoingTransfer;
}
