import MoneroTransfer from "./MoneroTransfer";
import MoneroTxWallet from "./MoneroTxWallet";
/**
 * Models an incoming transfer of funds to the wallet.
 */
export default class MoneroIncomingTransfer extends MoneroTransfer {
    subaddressIndex: number;
    address: string;
    numSuggestedConfirmations: number;
    /**
     * Construct the transfer.
     *
     * @param {MoneroTransfer} [transfer] is existing state to initialize from (optional)
     */
    constructor(transfer?: Partial<MoneroIncomingTransfer>);
    getIsIncoming(): boolean;
    getSubaddressIndex(): number;
    setSubaddressIndex(subaddressIndex: number): MoneroIncomingTransfer;
    getAddress(): string;
    setAddress(address: string): MoneroIncomingTransfer;
    /**
     * Return how many confirmations till it's not economically worth re-writing the chain.
     * That is, the number of confirmations before the transaction is highly unlikely to be
     * double spent or overwritten and may be considered settled, e.g. for a merchant to trust
     * as finalized.
     *
     * @return {number} is the number of confirmations before it's not worth rewriting the chain
     */
    getNumSuggestedConfirmations(): number;
    setNumSuggestedConfirmations(numSuggestedConfirmations: number): MoneroIncomingTransfer;
    copy(): MoneroIncomingTransfer;
    /**
     * Updates this transaction by merging the latest information from the given
     * transaction.
     *
     * Merging can modify or build references to the transfer given so it
     * should not be re-used or it should be copied before calling this method.
     *
     * @param {MoneroIncomingTransfer} transfer is the transfer to merge into this one
     * @return {MoneroIncomingTransfer}
     */
    merge(transfer: MoneroIncomingTransfer): MoneroIncomingTransfer;
    toString(indent?: number): string;
    setTx(tx: MoneroTxWallet): MoneroIncomingTransfer;
    setAmount(amount: bigint): MoneroIncomingTransfer;
    setAccountIndex(accountIndex: number): MoneroIncomingTransfer;
}
