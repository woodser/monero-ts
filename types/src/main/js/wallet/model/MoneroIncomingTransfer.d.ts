export = MoneroIncomingTransfer;
/**
 * Models an incoming transfer of funds to the wallet.
 *
 * @extends {MoneroTransfer}
 */
declare class MoneroIncomingTransfer extends MoneroTransfer {
    isIncoming(): boolean;
    getSubaddressIndex(): any;
    setSubaddressIndex(subaddressIndex: any): this;
    getAddress(): any;
    setAddress(address: any): this;
    /**
     * Return how many confirmations till it's not economically worth re-writing the chain.
     * That is, the number of confirmations before the transaction is highly unlikely to be
     * double spent or overwritten and may be considered settled, e.g. for a merchant to trust
     * as finalized.
     *
     * @return {number} is the number of confirmations before it's not worth rewriting the chain
     */
    getNumSuggestedConfirmations(): number;
    setNumSuggestedConfirmations(numSuggestedConfirmations: any): this;
    copy(): MoneroIncomingTransfer;
    /**
     * Updates this transaction by merging the latest information from the given
     * transaction.
     *
     * Merging can modify or build references to the transfer given so it
     * should not be re-used or it should be copied before calling this method.
     *
     * @param {MoneroIncomingTransfer} transfer is the transfer to merge into this one
     */
    merge(transfer: MoneroIncomingTransfer): this;
    toString(): any;
}
import MoneroTransfer = require("./MoneroTransfer");
