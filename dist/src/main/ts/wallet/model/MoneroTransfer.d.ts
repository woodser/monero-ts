import MoneroTxWallet from "./MoneroTxWallet";
/**
 * Models a base transfer of funds to or from the wallet.
 */
export default class MoneroTransfer {
    tx: MoneroTxWallet;
    accountIndex: number;
    amount: bigint;
    /**
     * Construct the transfer.
     *
     * @param {Partial<MoneroTransfer>} transfer existing state to initialize from (optional)
     */
    constructor(transfer: Partial<MoneroTransfer>);
    copy(): MoneroTransfer;
    toJson(): any;
    getTx(): MoneroTxWallet;
    setTx(tx: MoneroTxWallet): MoneroTransfer;
    getIsOutgoing(): boolean;
    getIsIncoming(): boolean;
    getAccountIndex(): number;
    setAccountIndex(accountIndex: number): MoneroTransfer;
    getAmount(): bigint;
    setAmount(amount: bigint): MoneroTransfer;
    /**
     * Updates this transaction by merging the latest information from the given
     * transaction.
     *
     * Merging can modify or build references to the transfer given so it
     * should not be re-used or it should be copied before calling this method.
     *
     * @param transfer is the transfer to merge into this one
     * @return {MoneroTransfer} the merged transfer
     */
    merge(transfer: MoneroTransfer): MoneroTransfer;
    toString(indent?: number): string;
    protected validate(): void;
}
