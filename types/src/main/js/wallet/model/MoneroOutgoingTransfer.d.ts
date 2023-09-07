export = MoneroOutgoingTransfer;
/**
 * Models an outgoing transfer of funds from the wallet.
 *
 * @extends {MoneroTransfer}
 */
declare class MoneroOutgoingTransfer extends MoneroTransfer {
    isIncoming(): boolean;
    getSubaddressIndices(): any;
    setSubaddressIndices(subaddressIndices: any): this;
    getAddresses(): any;
    setAddresses(addresses: any): this;
    getDestinations(): any;
    setDestinations(destinations: any): this;
    copy(): MoneroOutgoingTransfer;
    /**
     * Updates this transaction by merging the latest information from the given
     * transaction.
     *
     * Merging can modify or build references to the transfer given so it
     * should not be re-used or it should be copied before calling this method.
     *
     * @param transfer is the transfer to merge into this one
     */
    merge(transfer: any): this;
}
import MoneroTransfer = require("./MoneroTransfer");
